import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

type WorkspaceEvent =
  | 'project:created'
  | 'task:created'
  | 'task:updated'
  | 'user:created';

type Client = {
  id: number;
  userId: string;
  role: string;
  response: Response;
};

let nextClientId = 1;
const clients = new Map<number, Client>();

export const openWorkspaceStream = (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const client: Client = {
    id: nextClientId,
    userId: req.user.userId,
    role: req.user.role,
    response: res,
  };
  nextClientId += 1;
  clients.set(client.id, client);

  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  req.on('close', () => {
    clients.delete(client.id);
  });
};

export const broadcastWorkspaceEvent = (event: WorkspaceEvent, payload: unknown): void => {
  const message = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  clients.forEach((client) => {
    client.response.write(message);
  });
};
