import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate-request.middleware.js';
import {
  changePasswordBodySchema,
  loginBodySchema,
  registerBodySchema,
} from '../validation/auth.validation.js';

const router = Router();

router.post(
  '/register',
  validateRequest({ body: registerBodySchema }),
  AuthController.register
);
router.post(
  '/login',
  validateRequest({ body: loginBodySchema }),
  AuthController.login
);
router.post(
  '/change-password',
  authenticateToken,
  validateRequest({ body: changePasswordBodySchema }),
  AuthController.changePassword
);

export default router;
