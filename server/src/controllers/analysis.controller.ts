import type { Request, Response } from 'express';
import { AnalysisStatus, Prisma, Role } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { ExportService } from '../services/export.service.js';
import type { AnalysisReport } from '../services/export.service.js';
import { Jimp } from 'jimp';
import {
  type BoundingBoxCoordinates,
  requestAIInference,
} from '../services/ai-inference.service.js';
import { createAnnotatedResultImage } from '../services/image-annotator.service.js';
import { emitAnalysisUpdated } from '../services/socket.service.js';

type ProcessAnalysisPayload = {
  analysisId: string;
  inspectorId: string;
  beforeImagePath: string;
  afterImagePath: string;
  requesterIp: string;
};

const logAnalysisFailure = async (
  payload: ProcessAnalysisPayload,
  reason: string
) => {
  await prisma.$transaction(async (tx) => {
    await tx.analysis.update({
      where: { id: payload.analysisId },
      data: {
        status: 'Failed',
        anomaly_detected: null,
        bbox_x1: null,
        bbox_y1: null,
        bbox_x2: null,
        bbox_y2: null,
      },
    });

    await tx.auditLog.create({
      data: {
        user_id: payload.inspectorId,
        action: 'ANALYSIS_PROCESSING_FAILED',
        ip_address: payload.requesterIp,
        status: 'Failure',
        details: reason,
        metadata: { analysisId: payload.analysisId },
      },
    });
    },
    {
      timeout: 30000,
      maxWait: 10000,
  });

  emitAnalysisUpdated(payload.inspectorId, {
    analysisId: payload.analysisId,
    status: 'Failed',
    anomalyDetected: null,
    coordinates: {},
    error: reason,
  });
};

const processAnalysisInBackground = async (payload: ProcessAnalysisPayload) => {
  try {
    const inference = await requestAIInference(
      payload.beforeImagePath,
      payload.afterImagePath
    );
    const resultImage = await createAnnotatedResultImage(
      payload.afterImagePath,
      inference.coordinates
    );

    const analysis = await prisma.$transaction(async (tx) => {
      const imageRecord = await tx.image.create({
        data: {
          file_path: resultImage.filePath,
          file_size_bytes: resultImage.fileSizeBytes,
          mime_type: resultImage.mimeType,
          width: resultImage.width,
          height: resultImage.height,
        },
      });

      const updatedAnalysis = await tx.analysis.update({
        where: { id: payload.analysisId },
        data: {
          status: 'Completed',
          anomaly_detected: inference.anomalyDetected,
          result_image_id: imageRecord.id,
          bbox_x1: inference.coordinates?.x1 ?? null,
          bbox_y1: inference.coordinates?.y1 ?? null,
          bbox_x2: inference.coordinates?.x2 ?? null,
          bbox_y2: inference.coordinates?.y2 ?? null,
        },
      });

      await tx.auditLog.create({
        data: {
          user_id: payload.inspectorId,
          action: 'ANALYSIS_PROCESSING_COMPLETED',
          ip_address: payload.requesterIp,
          status: 'Success',
          details: `Analysis ${payload.analysisId} completed successfully.`,
          metadata: {
            analysisId: payload.analysisId,
            anomalyDetected: inference.anomalyDetected,
          },
        },
      });

      return updatedAnalysis;
      },
      {
        timeout: 30000,
        maxWait: 10000,
      });


    // TODO: Keep empty coordinates for "no anomaly" response; revisit if product contract changes.
    const socketCoordinates: BoundingBoxCoordinates | Record<string, never> =
      inference.coordinates ?? {};
    emitAnalysisUpdated(payload.inspectorId, {
      analysisId: analysis.id,
      status: 'Completed',
      anomalyDetected: inference.anomalyDetected,
      coordinates: socketCoordinates,
      resultImagePath: resultImage.filePath,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown processing error';
    console.error(`Analysis ${payload.analysisId} failed:`, error);
    await logAnalysisFailure(payload, message);
  }
};

const getImageDimensions = async (filePath: string) => {
  const image = await Jimp.read(filePath);
  return {
    width: image.bitmap.width,
    height: image.bitmap.height,
  };
};

const createAnalysis = async (req: Request, res: Response) => {
  console.log('=== createAnalysis hit ===');
  console.log('req.files:', req.files);
  console.log('req.user:', req.user);

  const { location_address } = req.body;

  try {
    const files = req.files as { [fieldnames: string]: Express.Multer.File[] };
    const beforeFile = files['beforeImage']?.[0];
    const afterFile = files['afterImage']?.[0];

    if (!beforeFile || !afterFile) {
      res.status(400).json({
        error: 'Missing images. Both before and after images are required.',
      });
      return;
    }

    const inspectorId = req.user?.userId;
    if (!inspectorId) {
      res.status(401).json({ error: 'Unauthorized: Inspector ID not found' });
      return;
    }

    const [beforeDimensions, afterDimensions] = await Promise.all([
      getImageDimensions(beforeFile.path),
      getImageDimensions(afterFile.path),
    ]);


    const analysis = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const beforeImg = await tx.image.create({
          data: {
            file_path: beforeFile.path,
            file_size_bytes: beforeFile.size,
            mime_type: beforeFile.mimetype,
            width: beforeDimensions.width,
            height: beforeDimensions.height,
          },
        });

        const afterImg = await tx.image.create({
          data: {
            file_path: afterFile.path,
            file_size_bytes: afterFile.size,
            mime_type: afterFile.mimetype,
            width: afterDimensions.width,
            height: afterDimensions.height,
          },
        });

        const newAnalysis = await tx.analysis.create({
          data: {
            inspector_id: inspectorId,
            before_image_id: beforeImg.id,
            after_image_id: afterImg.id,
            status: 'Pending',
            location_address
          },
        });

        await tx.auditLog.create({
          data: {
            user_id: inspectorId,
            action: 'UPLOAD_IMAGES',
            ip_address: req.ip || 'unknown',
            status: 'Success',
            details: `Inspector uploaded images for analysis. Files: ${beforeFile.originalname}, ${afterFile.originalname}`,
            metadata: { analysisId: newAnalysis.id },
          },
        });

        return newAnalysis;
      },
      {
        timeout: 30000,
        maxWait: 10000,
      });



    console.log(`
      📸 New Upload Success!
      -----------------------
      Inspector ID: ${inspectorId}
      Analysis ID:  ${analysis.id}
      Status:       ${analysis.status}
      location_address:     ${location_address}
      Timestamp:    ${new Date().toLocaleString()}
      -----------------------
    `);

    res.status(201).json({
      message: 'Analysis created successfully and sent to processing',
      analysisId: analysis.id,
      location_address: location_address,
    });

    void processAnalysisInBackground({
      analysisId: analysis.id,
      inspectorId,
      beforeImagePath: beforeFile.path,
      afterImagePath: afterFile.path,
      requesterIp: req.ip || 'unknown',
    });
  } catch (error) {
    console.error('Error creating analysis:', error);
    res
      .status(500)
      .json({ error: 'Internal server error during analysis creation' });
  }
};

const analysisInclude = {
  issued_by: { select: { id: true, username: true } },
  before_image: true,
  after_image: true,
  result_image: true,
} satisfies Prisma.AnalysisInclude;

const getAnalyses = async (req: Request, res: Response) => {
  try {
    const { page, limit, status } = req.query as unknown as {
      page: number;
      limit: number;
      status?: AnalysisStatus;
    };

    const where: Prisma.AnalysisWhereInput = {};

    if (req.user && req.user?.role === Role.Inspector) {
      where.inspector_id = req.user.userId;
    }
    if (status) {
      where.status = status;
    }

    const skip = (page - 1) * limit;
    const total = await prisma.analysis.count({ where });
    const totalPages = Math.ceil(total / limit);

    const analyses = await prisma.analysis.findMany({
      where,
      include: analysisInclude,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    });

    res.status(200).json({
      data: analyses,
      meta: { total, page, limit, totalPages, hasNextPage: page < totalPages },
    });
  } catch (error) {
    console.error('Error fetching analyses:', error);
    res.status(500).json({ message: 'Error fetching analyses' });
  }
};

type AnalysisIdParams = { id: string };
type ExportFormat = 'EXCEL' | 'PDF';
type ExportByIdBody = { format: ExportFormat };
type ExportByDateRangeBody = {
  format: ExportFormat;
  start_date?: string;
  end_date?: string;
};

const exportAnalysisInclude = {
  issued_by: { select: { username: true } },
  before_image: { select: { file_path: true } },
} satisfies Prisma.AnalysisInclude;

const buildReportDownloadUrl = (
  req: Pick<Request, 'protocol' | 'get'>,
  fileName: string
) => {
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}/reports/${fileName}`;
};

const generateReportFile = async (
  format: ExportFormat,
  analyses: AnalysisReport[]
) => {
  if (format === 'EXCEL') {
    return ExportService.generateExcelReport(analyses);
  }

  return ExportService.generatePdfReport(analyses);
};

const getAnalysisById = async (
  req: Request<AnalysisIdParams>,
  res: Response
) => {
  try {
    const { id } = req.params;

    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: analysisInclude,
    });

    if (!analysis) {
      res.status(404).json({ message: 'Analysis not found' });
      return;
    }

    if (
      req.user &&
      req.user?.role === Role.Inspector &&
      analysis.inspector_id !== req.user.userId
    ) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    res.status(200).json({ data: analysis });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ message: 'Error fetching analysis' });
  }
};

const exportById = async (
  req: Request<AnalysisIdParams, unknown, ExportByIdBody>,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { format } = req.body;

    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: exportAnalysisInclude,
    });

    if (!analysis) {
      res.status(404).json({ message: 'Analysis not found' });
      return;
    }

    if (
      req.user &&
      req.user.role === Role.Inspector &&
      analysis.inspector_id !== req.user.userId
    ) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const fileName = await generateReportFile(format, [
      analysis as unknown as AnalysisReport,
    ]);

    res.status(200).json({
      message: 'Report generated successfully',
      downloadUrl: buildReportDownloadUrl(req, fileName),
      format,
      recordCount: 1,
    });
  } catch (error) {
    console.error('Error exporting analysis by id:', error);
    res.status(500).json({ error: 'Failed to process export request.' });
  }
};

const exportByDateRange = async (
  req: Request<unknown, unknown, ExportByDateRangeBody>,
  res: Response
) => {
  try {
    const { format, start_date, end_date } = req.body;
    const where: Prisma.AnalysisWhereInput = {
      created_at: {
        ...(start_date && { gte: new Date(start_date) }),
        ...(end_date && { lte: new Date(end_date) }),
      },
    };

    if (req.user?.role === Role.Inspector) {
      where.inspector_id = req.user.userId;
    }

    const analyses = await prisma.analysis.findMany({
      where,
      include: exportAnalysisInclude,
      orderBy: { created_at: 'desc' },
    });

    const fileName = await generateReportFile(
      format,
      analyses as unknown as AnalysisReport[]
    );

    res.status(200).json({
      message: 'Report generated successfully',
      downloadUrl: buildReportDownloadUrl(req, fileName),
      format,
      recordCount: analyses.length,
    });
  } catch (error) {
    console.error('Error exporting analyses by date range:', error);
    res.status(500).json({ error: 'Failed to process export request.' });
  }
};

export const AnalysisController = {
  createAnalysis,
  getAnalyses,
  getAnalysisById,
  exportById,
  exportByDateRange,
};
