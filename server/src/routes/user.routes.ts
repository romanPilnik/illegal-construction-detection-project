import { Router } from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { getUsers } from '../controllers/user.controller.js';



//import { getUsers } from '../controllers/user.controller';
//import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticateToken, getUsers);

export default router;