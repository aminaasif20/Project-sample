import { Response } from 'express';
import { Task } from '../models/task.model';
import { Project } from '../models/project.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { broadcastWorkspaceEvent } from '../utils/realtime';

const populateTask = (query: ReturnType<typeof Task.find> | ReturnType<typeof Task.findByIdAndUpdate>) =>
  query
    .populate('assignee', 'name email role')
    .populate('reporter', 'name email role')
    .populate('project', 'name description status');

const allowedStatuses = ['todo', 'in_progress', 'review', 'blocked', 'testing', 'completed', 'cancelled'];

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = req.user?.role === 'team_member'
      ? { $or: [{ assignee: req.user.userId }, { reporter: req.user.userId }] }
      : {};
    const tasks = await populateTask(Task.find(query));
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tasks', error });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.create({
      ...req.body,
      assignee: req.body.assignee || undefined,
      reporter: req.user?.userId,
      project: req.body.project,
    });
    if (req.body.assignee) {
      await Project.findByIdAndUpdate(req.body.project, { $addToSet: { members: req.body.assignee } });
    }
    await task.populate('assignee', 'name email role');
    await task.populate('reporter', 'name email role');
    await task.populate('project', 'name description status');
    broadcastWorkspaceEvent('task:created', task);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create task', error });
  }
};

export const updateTaskStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!allowedStatuses.includes(req.body.status)) {
      res.status(400).json({ message: 'Invalid task status' });
      return;
    }

    const existingTask = await Task.findById(req.params.id);
    if (!existingTask) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const isAssignedUser = String(existingTask.assignee) === req.user?.userId || String(existingTask.reporter) === req.user?.userId;
    const isManager = req.user?.role === 'super_admin' || req.user?.role === 'project_manager';
    if (!isManager && !isAssignedUser) {
      res.status(403).json({ message: 'You can only update tasks assigned to you' });
      return;
    }

    const task = await populateTask(Task.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }));
    broadcastWorkspaceEvent('task:updated', task);
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update task status', error });
  }
};
