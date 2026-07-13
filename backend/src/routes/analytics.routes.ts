import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    summary: {
      totalUsers: 48,
      totalProjects: 12,
      tasksCompleted: 312,
      overdueTasks: 9,
    },
  });
});

export default router;
