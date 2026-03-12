import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { upload } from '../services/multer.config.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { AnalysisController } from '../controllers/analysis.controller.js';
import { validateRequest } from '../middlewares/validate-request.middleware.js';
import {
  analysisIdParamsSchema,
  exportByDateRangeBodySchema,
  exportByIdBodySchema,
  exportByIdParamsSchema,
  getAnalysesQuerySchema,
} from '../validation/analysis.validation.js';

const router = Router();
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
      res.status(400).json({ error: err.message });
      return;
    }
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    next();
  });
};

router.get(
  '/',
  authenticateToken,
  validateRequest({ query: getAnalysesQuerySchema }),
  AnalysisController.getAnalyses
);

router.get(
  '/:id',
  authenticateToken,
  validateRequest({ params: analysisIdParamsSchema }),
  AnalysisController.getAnalysisById
);

router.post(
  '/analyze',
  authenticateToken,
  handleAnalyzeUpload,
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
