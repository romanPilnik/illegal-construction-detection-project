import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/admin.middleware.js';
import { validateRequest } from '../middlewares/validate-request.middleware.js';
import { UserController } from '../controllers/user.controller.js';
import {
  createUserBodySchema,
  getUsersQuerySchema,
  updateUserBodySchema,
  userIdParamsSchema,
} from '../validation/user.validation.js';

const router = Router();

router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validateRequest({ body: createUserBodySchema }),
  UserController.createUser
);
router.get(
  '/',
  authenticateToken,
  requireAdmin,
  validateRequest({ query: getUsersQuerySchema }),
  UserController.getUsers
);
router.get(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateRequest({ params: userIdParamsSchema }),
  UserController.getUserById
);
router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateRequest({ params: userIdParamsSchema, body: updateUserBodySchema }),
  UserController.updateUser
);
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  validateRequest({ params: userIdParamsSchema }),
  UserController.deleteUser
);

export default router;
