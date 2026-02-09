import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { UserController } from '../controllers/user.controller.js';

const router = Router();

router.get('/', authenticateToken, UserController.getUsers);
router.get('/:id', authenticateToken, UserController.getUserById);
router.put('/:id', authenticateToken, UserController.updateUser);
router.delete('/:id', authenticateToken, UserController.deleteUser);

export default router;
