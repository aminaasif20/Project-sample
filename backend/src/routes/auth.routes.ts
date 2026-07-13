import { Router } from 'express';
import { login, logout, register } from '../controllers/auth.controller';
import { optionalProtect } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', optionalProtect, register);
router.post('/login', login);
router.post('/logout', logout);

export default router;
