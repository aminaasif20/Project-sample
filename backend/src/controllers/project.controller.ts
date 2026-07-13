import { Response } from 'express';
import { Project } from '../models/project.model';
import { Task } from '../models/task.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { broadcastWorkspaceEvent } from '../utils/realtime';

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const assignedProjectIds = req.user?.role === 'team_member'
      ? await Task.distinct('project', { $or: [{ assignee: req.user.userId }, { reporter: req.user.userId }] })
      : [];
    const query = req.user?.role === 'team_member'
      ? { $or: [{ owner: req.user.userId }, { members: req.user.userId }, { _id: { $in: assignedProjectIds } }] }
      : {};
    const projects = await Project.find(query).populate('owner', 'name email role').populate('members', 'name email role');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch projects', error });
  }
};

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const memberIds = Array.isArray(req.body.members) ? req.body.members.filter(Boolean) : [];
    const project = await Project.create({
      ...req.body,
      owner: req.body.owner || req.user?.userId,
      members: memberIds,
    });
    await project.populate('owner', 'name email role');
    await project.populate('members', 'name email role');
    broadcastWorkspaceEvent('project:created', project);
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create project', error });
  }
};
