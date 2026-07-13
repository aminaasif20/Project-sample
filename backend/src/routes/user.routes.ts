import { Router } from 'express';
import { getUsers } from '../controllers/user.controller';
import { protect, requireRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect, requireRoles('super_admin', 'project_manager'), getUsers);

export default router;
