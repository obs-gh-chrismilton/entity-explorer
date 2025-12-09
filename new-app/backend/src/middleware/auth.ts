// Authentication middleware for protecting routes

import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.session.observeToken || !req.session.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'You must be logged in to access this resource',
    });
    return;
  }

  // Attach user to request for downstream use
  (req as AuthenticatedRequest).user = req.session.user;
  next();
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.session.user) {
    (req as AuthenticatedRequest).user = req.session.user;
  }
  next();
};

export default requireAuth;
