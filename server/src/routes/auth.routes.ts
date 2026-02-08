import { Router } from 'express';
import { login } from '../controllers/auth.controller.js';
import { register } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);

export default router;