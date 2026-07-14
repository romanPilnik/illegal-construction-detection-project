import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { upload } from '../services/multer.config.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { AnalysisController } from '../controllers/analysis.controller.js';
import { validateRequest } from '../middlewares/validate-request.middleware.js';
import {
  analysisIdParamsSchema,
  createAnalysisBodySchema,
  exportByDateRangeBodySchema,
  exportByIdBodySchema,
  exportByIdParamsSchema,
  getAnalysesQuerySchema,
} from '../validation/analysis.validation.js';
import type { GetAnalysesQuery } from '../validation/analysis.validation.js';

const router = Router();

const multerErrorMessage = (error: multer.MulterError): string => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return 'Each image must be 5 MB or smaller.';
  }
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return 'Upload exactly one before image and one after image.';
  }
  return 'The image upload could not be processed.';
};

const handleAnalyzeUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  upload.fields([
    { name: 'beforeImage', maxCount: 1 },
    { name: 'afterImage', maxCount: 1 },
  ])(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      res.status(400).json({ message: multerErrorMessage(err) });
      return;
    }
    if (err) {
      res.status(400).json({
        message:
          err.message === 'UNSUPPORTED_IMAGE_TYPE'
            ? 'Only supported image files can be uploaded.'
            : 'The image upload could not be processed.',
      });
      return;
    }
    next();
  });
};

router.get<unknown, unknown, unknown, GetAnalysesQuery>(
  '/',
  authenticateToken,
  validateRequest({ query: getAnalysesQuerySchema }),
  AnalysisController.getAnalyses
);

/** Must stay above `/:id` so this path is not validated as a UUID. */
router.get(
  '/outcome-summary',
  authenticateToken,
  AnalysisController.getOutcomeSummary
);

router.get(
  '/:id',
  authenticateToken,
  validateRequest({ params: analysisIdParamsSchema }),
  AnalysisController.getAnalysisById
);

router.post(
  '/analyse',
  authenticateToken,
  handleAnalyzeUpload,
  validateRequest({ body: createAnalysisBodySchema }),
  AnalysisController.createAnalysis
);

router.post(
  '/export',
  authenticateToken,
  validateRequest({ body: exportByDateRangeBodySchema }),
  AnalysisController.exportByDateRange
);

router.post(
  '/:id/export',
  authenticateToken,
  validateRequest({
    params: exportByIdParamsSchema,
    body: exportByIdBodySchema,
  }),
  AnalysisController.exportById
);

export default router;
