import { Router } from 'express';
import { createTask, getTasks, updateTaskStatus } from '../controllers/task.controller';
import { protect, requireRoles } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protect, getTasks);
router.post('/', protect, requireRoles('super_admin', 'project_manager'), createTask);
router.patch('/:id/status', protect, updateTaskStatus);

export default router;
