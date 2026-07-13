import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/user.model';
import { registerSchema, loginSchema } from '../validators/auth.validator';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth.middleware';
import { broadcastWorkspaceEvent } from '../utils/realtime';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.flatten().fieldErrors });
      return;
    }

    const { name, email, password, role } = parsed.data;
    const requestedRole = role ?? 'team_member';
    if (!req.user && requestedRole !== 'team_member') {
      res.status(403).json({ message: 'Public registration is limited to team members' });
      return;
    }

    if (req.user?.role === 'team_member') {
      res.status(403).json({ message: 'Team members cannot create users' });
      return;
    }

    if (req.user?.role === 'project_manager' && requestedRole === 'super_admin') {
      res.status(403).json({ message: 'Project managers cannot create super admins' });
      return;
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role: requestedRole });
    const responseUser = { id: user._id, _id: user._id, name, email, role: user.role };
    broadcastWorkspaceEvent('user:created', responseUser);

    res.status(201).json({ message: 'User created', user: responseUser });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, password } = parsed.data;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const accessToken = generateAccessToken(String(user._id), user.role);
    const refreshToken = generateRefreshToken(String(user._id));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Login successful',
      accessToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error });
  }
};

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
};
