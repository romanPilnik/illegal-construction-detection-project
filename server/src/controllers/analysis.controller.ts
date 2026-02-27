import type { Request, Response } from 'express';
import { AnalysisStatus, Prisma, Role } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

export const createAnalysis = async (req: Request, res: Response) => {
  console.log('=== createAnalysis hit ===');
  console.log('req.files:', req.files);
  console.log('req.user:', req.user);

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

    const analysis = await prisma.$transaction(async (tx) => {
      const beforeImg = await tx.image.create({
        data: {
          file_path: beforeFile.path,
          file_size_bytes: beforeFile.size,
          mime_type: beforeFile.mimetype,
          width: 0,
          height: 0,
        },
      });

      const afterImg = await tx.image.create({
        data: {
          file_path: afterFile.path,
          file_size_bytes: afterFile.size,
          mime_type: afterFile.mimetype,
          width: 0,
          height: 0,
        },
      });

      const newAnalysis = await tx.analysis.create({
        data: {
          inspector_id: inspectorId,
          before_image_id: beforeImg.id,
          after_image_id: afterImg.id,
          status: 'Pending',
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
    });

    console.log(`
      📸 New Upload Success!
      -----------------------
      Inspector ID: ${inspectorId}
      Analysis ID:  ${analysis.id}
      Status:       ${analysis.status}
      Timestamp:    ${new Date().toLocaleString()}
      -----------------------
    `);

    res.status(201).json({
      message: 'Analysis created successfully and sent to processing',
      analysisId: analysis.id,
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

export const getAnalyses = async (req: Request, res: Response) => {
  try {
    const { page, limit, status } = req.query as unknown as {
      page: number;
      limit: number;
      status?: AnalysisStatus;
    };

    const where: Prisma.AnalysisWhereInput = {};

    if (req.user?.role === Role.Inspector) {
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

export const getAnalysisById = async (
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
