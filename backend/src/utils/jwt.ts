import jwt from 'jsonwebtoken';

export const generateAccessToken = (userId: string, role: string): string =>
  jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET || 'access-secret', { expiresIn: '15m' });

export const generateRefreshToken = (userId: string): string =>
  jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET || 'refresh-secret', { expiresIn: '7d' });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'access-secret');

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh-secret');
