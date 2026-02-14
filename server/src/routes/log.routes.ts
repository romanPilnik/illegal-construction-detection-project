import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate-request.middleware.js';
import { AuditLogController } from '../controllers/log.controller.js';
import { getLogsQuerySchema } from '../validation/log.validation.js';

const router = Router();


router.get(
  '/',
  authenticateToken,
  validateRequest({ query: getLogsQuerySchema }),
  AuditLogController.getLogs
);

export default router;