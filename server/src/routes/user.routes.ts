import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate-request.middleware.js';
import { UserController } from '../controllers/user.controller.js';
import {
  getUsersQuerySchema,
  updateUserBodySchema,
  userIdParamsSchema,
} from '../validation/user.validation.js';

const router = Router();

router.get(
  '/',
  authenticateToken,
  validateRequest({ query: getUsersQuerySchema }),
  UserController.getUsers
);
router.get(
  '/:id',
  authenticateToken,
  validateRequest({ params: userIdParamsSchema }),
  UserController.getUserById
);
router.put(
  '/:id',
  authenticateToken,
  validateRequest({ params: userIdParamsSchema, body: updateUserBodySchema }),
  UserController.updateUser
);
router.delete(
  '/:id',
  authenticateToken,
  validateRequest({ params: userIdParamsSchema }),
  UserController.deleteUser
);

export default router;
