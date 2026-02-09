import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validate-request.middleware.js';
import {
  loginBodySchema,
  registerBodySchema,
} from '../validation/auth.validation.js';

const router = Router();

router.post('/register', validateRequest({ body: registerBodySchema }), AuthController.register);
router.post('/login', validateRequest({ body: loginBodySchema }), AuthController.login);

export default router;
