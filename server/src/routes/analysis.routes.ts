import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';import multer from 'multer';
import { upload } from '../services/multer.config.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { createAnalysis } from '../controllers/analysis.controller.js';

const router = Router();

router.post(
  '/analyze',
  authenticateToken,
  (req: Request, res: Response, next: NextFunction) => {
    upload.fields([
      { name: 'beforeImage', maxCount: 1 },
      { name: 'afterImage', maxCount: 1 }
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

export default router;