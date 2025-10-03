import { Request, Response } from 'express';
export interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export interface RequestWithUser extends Request {
  user?: { id: string };
}
