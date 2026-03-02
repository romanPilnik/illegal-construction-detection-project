import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { upload } from '../services/multer.config.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { exportAnalyses } from '../controllers/export.controller.js'
import { exportAnalysesSchema } from '../validation/analysis.validation.js';
import { validateRequest } from '../middlewares/validate-request.middleware.js';
import {
  createAnalysis,
  getAnalyses,
  getAnalysisById,
} from '../controllers/analysis.controller.js';
import {
  analysisIdParamsSchema,
  getAnalysesQuerySchema,
} from '../validation/analysis.validation.js';

const router = Router();

router.get(
  '/',
  authenticateToken,
  validateRequest({ query: getAnalysesQuerySchema }),
  getAnalyses
);

router.get(
  '/:id',
  authenticateToken,
  validateRequest({ params: analysisIdParamsSchema }),
  getAnalysisById
);

router.post(
  '/analyze',
  authenticateToken,
  (req: Request, res: Response, next: NextFunction) => {
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
  },
  createAnalysis
);

router.post(
  '/export',
  authenticateToken,
  validateRequest({ body: exportAnalysesSchema.shape.body }),
  exportAnalyses
);

export default router;
