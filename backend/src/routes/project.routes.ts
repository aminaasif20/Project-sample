import { Router } from 'express';
import { createProject, getProjects } from '../controllers/project.controller';
import { protect, requireRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect, getProjects);
router.post('/', protect, requireRoles('super_admin', 'project_manager'), createProject);

export default router;
