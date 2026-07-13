import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export type UserRole = 'super_admin' | 'project_manager' | 'team_member';

export interface AuthRequest extends Request {
  user?: { userId: string; role: UserRole };
}

const readToken = (req: Request): string | undefined =>
  req.headers.authorization?.split(' ')[1] || (typeof req.query.token === 'string' ? req.query.token : undefined);

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = readToken(req);
  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const payload = verifyAccessToken(token) as { userId: string; role: UserRole };
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const optionalProtect = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const token = readToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    req.user = verifyAccessToken(token) as { userId: string; role: UserRole };
  } catch {
    req.user = undefined;
  }

  next();
};

export const requireRoles = (...roles: UserRole[]) => (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403).json({ message: 'You do not have permission to perform this action' });
    return;
  }

  next();
};
