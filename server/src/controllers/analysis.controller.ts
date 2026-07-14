import type { Request, Response } from 'express';
import { AnalysisStatus, Prisma, Role } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';
import { ExportService } from '../services/export.service.js';
import type { AnalysisReport } from '../services/export.service.js';
import { Jimp } from 'jimp';
import { promises as fs } from 'fs';
import path from 'path';
import { createAnnotatedResultImage } from '../services/image-annotator.service.js';
import {
  requestAIInference,
} from '../services/ai-inference.service.js';
import { emitAnalysisUpdated } from '../services/socket.service.js';
import { uploadImageAsset } from '../services/asset-storage.service.js';
import { sendAnalysisCompleteEmail } from '../services/email.service.js';
import { buildLocalDateRange } from '../lib/date-range.js';
import type {
  AnalysisIdParams,
  CreateAnalysisBody,
  ExportByDateRangeBody,
  ExportByIdBody,
  ExportByIdParams,
  GetAnalysesQuery,
} from '../validation/analysis.validation.js';

type ProcessAnalysisPayload = {
  analysisId: string;
  inspectorId: string;
  beforeImageBuffer: Buffer;
  beforeImageName: string;
  afterImageBuffer: Buffer;
  afterImageName: string;
  requesterIp: string;
};

class InvalidUploadedImageError extends Error {}

const processingFailureMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('timed out')) {
    return 'Analysis timed out while processing. Please try again.';
  }
  if (
    message.includes('image') ||
    message.includes('jimp') ||
    message.includes('bitmap')
  ) {
    return 'One or both uploaded images could not be processed.';
  }
  if (
    message.includes('ai service') ||
    message.includes('fetch') ||
    message.includes('network')
  ) {
    return 'The analysis service is temporarily unavailable. Please try again later.';
  }
  return 'Analysis could not be completed. Please try again.';
};

const DEFAULT_PROCESSING_FAILURE_MESSAGE =
  'Analysis could not be completed. Please try again.';

const writeAuditLog = async (data: Prisma.AuditLogCreateArgs['data']) => {
  try {
    await prisma.auditLog.create({ data });
  } catch (error) {
    console.error('Failed to write analysis audit log:', error);
  }
};

const notifyAnalysisUpdated = (
  inspectorId: string,
  payload: Parameters<typeof emitAnalysisUpdated>[1]
) => {
  try {
    emitAnalysisUpdated(inspectorId, payload);
  } catch (error) {
    console.error(
      `Failed to emit analysis update for ${payload.analysisId}:`,
      error
    );
  }
};

const recordAnalysisFailure = async (
  payload: ProcessAnalysisPayload,
  error: unknown
) => {
  const rawReason =
    error instanceof Error ? error.message : 'Unknown processing error';
  const publicReason = processingFailureMessage(error);

  try {
    await prisma.analysis.update({
      where: { id: payload.analysisId },
      data: {
        status: 'Failed',
        anomaly_detected: null,
        result_image_id: null,
      },
    });
  } catch (persistenceError) {
    console.error(
      `Failed to persist failure state for analysis ${payload.analysisId}:`,
      persistenceError
    );
  }

  await writeAuditLog({
    user_id: payload.inspectorId,
    action: 'ANALYSIS_PROCESSING_FAILED',
    ip_address: payload.requesterIp,
    status: 'Failure',
    details: rawReason,
    metadata: { analysisId: payload.analysisId, publicReason },
  });

  notifyAnalysisUpdated(payload.inspectorId, {
    analysisId: payload.analysisId,
    status: 'Failed',
  });
};

const sendCompletionNotification = async (
  payload: ProcessAnalysisPayload,
  analysis: { id: string; request_title: string | null },
  anomalyDetected: boolean
) => {
  try {
    const inspector = await prisma.user.findUnique({
      where: { id: payload.inspectorId },
      select: { email: true, username: true },
    });

    if (inspector?.email) {
      await sendAnalysisCompleteEmail({
        userEmail: inspector.email,
        username: inspector.username,
        requestTitle: analysis.request_title ?? 'Untitled analysis',
        completedAt: new Date(),
        anomalyDetected,
        analysisId: analysis.id,
      });
    }
  } catch (error) {
    console.error(
      `Failed to send completion notification for analysis ${analysis.id}:`,
      error
    );
  }
};

export const processAnalysisInBackground = async (
  payload: ProcessAnalysisPayload
) => {
  let inference: Awaited<ReturnType<typeof requestAIInference>>;
  let analysis: { id: string; request_title: string | null };

  try {
    inference = await requestAIInference(
      payload.beforeImageBuffer,
      payload.afterImageBuffer,
      payload.beforeImageName,
      payload.afterImageName
    );
    const resultImage = await createAnnotatedResultImage(
      payload.afterImageBuffer,
      payload.afterImageName,
      inference.coordinates
    );
    const uploadedResultImage = await uploadImageAsset({
      buffer: resultImage.buffer,
      mimeType: resultImage.mimeType,
      originalName: resultImage.fileName,
      category: 'result',
    });

    analysis = await prisma.$transaction(async (tx) => {
      const imageRecord = await tx.image.create({
        data: {
          file_path: uploadedResultImage.filePath,
        },
      });

      return tx.analysis.update({
        where: { id: payload.analysisId },
        data: {
          status: 'Completed',
          anomaly_detected: inference.anomalyDetected,
          result_image_id: imageRecord.id,
        },
      });
    },
    {
      timeout: 30000,
      maxWait: 10000,
    });
  } catch (error) {
    console.error(`Analysis ${payload.analysisId} failed:`, error);
    await recordAnalysisFailure(payload, error);
    return;
  }

  await writeAuditLog({
    user_id: payload.inspectorId,
    action: 'ANALYSIS_PROCESSING_COMPLETED',
    ip_address: payload.requesterIp,
    status: 'Success',
    details: `Analysis ${payload.analysisId} completed successfully.`,
    metadata: {
      analysisId: payload.analysisId,
      anomalyDetected: inference.anomalyDetected,
    },
  });

  notifyAnalysisUpdated(payload.inspectorId, {
    analysisId: analysis.id,
    status: 'Completed',
  });
  await sendCompletionNotification(payload, analysis, inference.anomalyDetected);
};

const validateUploadedImage = async (buffer: Buffer) => {
  try {
    await Jimp.read(buffer);
  } catch {
    throw new InvalidUploadedImageError('Invalid uploaded image');
  }
};

const readUploadedFileBuffer = async (file: Express.Multer.File) => {
  if (file.buffer) return file.buffer;
  if (file.path) {
    const absolutePath = path.isAbsolute(file.path)
      ? file.path
      : path.resolve(process.cwd(), file.path);
    return fs.readFile(absolutePath);
  }
  throw new Error('Uploaded file is missing both buffer and path');
};

const createAnalysis = async (
  req: Request<unknown, unknown, CreateAnalysisBody>,
  res: Response
) => {
  const { request_title } = req.body;

  try {
    const files = req.files as { [fieldnames: string]: Express.Multer.File[] };
    const beforeFile = files['beforeImage']?.[0];
    const afterFile = files['afterImage']?.[0];

    if (!beforeFile || !afterFile) {
      res.status(400).json({
        message: 'Missing images. Both before and after images are required.',
      });
      return;
    }

    const inspectorId = req.user?.userId;
    if (!inspectorId) {
      res.status(401).json({ message: 'Unauthorized: Inspector ID not found' });
      return;
    }

    const [beforeBuffer, afterBuffer] = await Promise.all([
      readUploadedFileBuffer(beforeFile),
      readUploadedFileBuffer(afterFile),
    ]);
    await Promise.all([
      validateUploadedImage(beforeBuffer),
      validateUploadedImage(afterBuffer),
    ]);
    const [beforeStored, afterStored] = await Promise.all([
      uploadImageAsset({
        buffer: beforeBuffer,
        mimeType: beforeFile.mimetype,
        originalName: beforeFile.originalname,
        category: 'before',
      }),
      uploadImageAsset({
        buffer: afterBuffer,
        mimeType: afterFile.mimetype,
        originalName: afterFile.originalname,
        category: 'after',
      }),
    ]);


    const analysis = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const beforeImg = await tx.image.create({
          data: {
            file_path: beforeStored.filePath,
          },
        });

        const afterImg = await tx.image.create({
          data: {
            file_path: afterStored.filePath,
          },
        });

        const newAnalysis = await tx.analysis.create({
          data: {
            inspector_id: inspectorId,
            before_image_id: beforeImg.id,
            after_image_id: afterImg.id,
            status: 'Pending',
            request_title,
          },
        });

        return newAnalysis;
      },
      {
        timeout: 30000,
        maxWait: 10000,
      });
    void writeAuditLog({
      user_id: inspectorId,
      action: 'UPLOAD_IMAGES',
      ip_address: req.ip || 'unknown',
      status: 'Success',
      details: `Inspector uploaded images for analysis. Files: ${beforeFile.originalname}, ${afterFile.originalname}`,
      metadata: { analysisId: analysis.id },
    });
    res.status(201).json({
      message: 'Analysis created successfully and sent to processing',
      analysisId: analysis.id,
      request_title,
      data: { id: analysis.id },
    });

    void processAnalysisInBackground({
      analysisId: analysis.id,
      inspectorId,
      beforeImageBuffer: beforeBuffer,
      beforeImageName: beforeFile.originalname,
      afterImageBuffer: afterBuffer,
      afterImageName: afterFile.originalname,
      requesterIp: req.ip || 'unknown',
    }).catch((error) => {
      console.error(`Unexpected background failure for analysis ${analysis.id}:`, error);
    });
  } catch (error) {
    console.error('Error creating analysis:', error);
    if (error instanceof InvalidUploadedImageError) {
      res.status(400).json({
        message: 'One or both uploaded files are not valid supported images.',
      });
      return;
    }
    res
      .status(500)
      .json({ message: 'Internal server error during analysis creation' });
  }
};

const analysisListSelect = {
  id: true,
  status: true,
  created_at: true,
  request_title: true,
  anomaly_detected: true,
} satisfies Prisma.AnalysisSelect;

const analysisDetailSelect = {
  id: true,
  inspector_id: true,
  status: true,
  created_at: true,
  request_title: true,
  anomaly_detected: true,
  issued_by: { select: { username: true } },
  before_image: { select: { file_path: true } },
  after_image: { select: { file_path: true } },
  result_image: { select: { file_path: true } },
} satisfies Prisma.AnalysisSelect;

const getAnalysisFailureReason = async (analysisId: string) => {
  try {
    const failureLog = await prisma.auditLog.findFirst({
      where: {
        action: 'ANALYSIS_PROCESSING_FAILED',
        metadata: { path: '$.analysisId', equals: analysisId },
      },
      select: { metadata: true },
      orderBy: { timestamp: 'desc' },
    });
    const metadata = failureLog?.metadata;
    if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
      const publicReason = (metadata as Record<string, unknown>).publicReason;
      if (typeof publicReason === 'string' && publicReason.trim()) {
        return publicReason;
      }
    }
  } catch (error) {
    console.error(
      `Failed to read failure reason for analysis ${analysisId}:`,
      error
    );
  }
  return DEFAULT_PROCESSING_FAILURE_MESSAGE;
};

const getOutcomeSummary = async (req: Request, res: Response) => {
  try {
    const whereBase: Prisma.AnalysisWhereInput = {
      status: 'Completed',
      anomaly_detected: { not: null },
    };

    if (req.user && req.user.role === Role.Inspector) {
      whereBase.inspector_id = req.user.userId;
    }

    const [anomalyDetected, noAnomaly] = await Promise.all([
      prisma.analysis.count({
        where: { ...whereBase, anomaly_detected: true },
      }),
      prisma.analysis.count({
        where: { ...whereBase, anomaly_detected: false },
      }),
    ]);

    const completedWithOutcome = anomalyDetected + noAnomaly;
    const anomalyRate =
      completedWithOutcome > 0
        ? Math.round((anomalyDetected / completedWithOutcome) * 1000) / 1000
        : null;

    res.status(200).json({
      data: {
        completedWithOutcome,
        anomalyDetected,
        noAnomaly,
        anomalyRate,
      },
    });
  } catch (error) {
    console.error('Error fetching outcome summary:', error);
    res.status(500).json({ message: 'Error fetching outcome summary' });
  }
};

const getAnalyses = async (
  req: Request<unknown, unknown, unknown, GetAnalysesQuery>,
  res: Response
) => {
  try {
    const { page, limit, status, start_date, end_date, time_zone } = req.query;

    const where: Prisma.AnalysisWhereInput = {};

    if (req.user && req.user?.role === Role.Inspector) {
      where.inspector_id = req.user.userId;
    }
    if (status) {
      where.status = status;
    }
    if (start_date || end_date) {
      where.created_at = buildLocalDateRange({
        startDate: start_date,
        endDate: end_date,
        timeZone: time_zone,
      });
    }

    const skip = (page - 1) * limit;
    const total = await prisma.analysis.count({ where });
    const totalPages = Math.ceil(total / limit);

    const analyses = await prisma.analysis.findMany({
      where,
      select: analysisListSelect,
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

type ExportFormat = ExportByIdBody['format'];

const exportAnalysisInclude = {
  issued_by: { select: { username: true } },
  before_image: { select: { file_path: true } },
  after_image: { select: { file_path: true } },
  result_image: { select: { file_path: true } },
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
      select: analysisDetailSelect,
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

    const failureReason =
      analysis.status === AnalysisStatus.Failed
        ? await getAnalysisFailureReason(analysis.id)
        : null;

    res.status(200).json({
      data: {
        id: analysis.id,
        status: analysis.status,
        failure_reason: failureReason,
        created_at: analysis.created_at,
        request_title: analysis.request_title,
        anomaly_detected: analysis.anomaly_detected,
        issued_by: analysis.issued_by,
        before_image: analysis.before_image,
        after_image: analysis.after_image,
        result_image: analysis.result_image,
      },
    });
  } catch (error) {
    console.error('Error fetching analysis:', error);
    res.status(500).json({ message: 'Error fetching analysis' });
  }
};

const exportById = async (
  req: Request<ExportByIdParams, unknown, ExportByIdBody>,
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
      analysis,
    ]);

    res.status(200).json({
      message: 'Report generated successfully',
      downloadUrl: buildReportDownloadUrl(req, fileName),
    });
  } catch (error) {
    console.error('Error exporting analysis by id:', error);
    res.status(500).json({ message: 'Failed to process export request.' });
  }
};

const exportByDateRange = async (
  req: Request<unknown, unknown, ExportByDateRangeBody>,
  res: Response
) => {
  try {
    const { format, start_date, end_date, time_zone } = req.body;
    const where: Prisma.AnalysisWhereInput = {
      status: 'Completed',
      ...((start_date || end_date) && {
        created_at: buildLocalDateRange({
          startDate: start_date,
          endDate: end_date,
          timeZone: time_zone,
        }),
      }),
    };

    if (req.user?.role === Role.Inspector) {
      where.inspector_id = req.user.userId;
    }

    const analyses = await prisma.analysis.findMany({
      where,
      include: exportAnalysisInclude,
      orderBy: { created_at: 'desc' },
    });

    if (analyses.length === 0) {
      res.status(400).json({
        message: 'No completed analyses match the selected date range',
      });
      return;
    }

    const fileName = await generateReportFile(format, analyses);

    res.status(200).json({
      message: 'Report generated successfully',
      downloadUrl: buildReportDownloadUrl(req, fileName),
    });
  } catch (error) {
    console.error('Error exporting analyses by date range:', error);
    res.status(500).json({ message: 'Failed to process export request.' });
  }
};

export const AnalysisController = {
  createAnalysis,
  getAnalyses,
  getOutcomeSummary,
  getAnalysisById,
  exportById,
  exportByDateRange,
};
