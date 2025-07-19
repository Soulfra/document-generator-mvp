import { Request, Response, NextFunction } from 'express';
import { AuthenticationError } from '../utils/errors';

/**
 * Middleware that ensures req.user exists and is properly typed
 * Use this after authentication middleware when you need guaranteed user access
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AuthenticationError('Authentication required');
  }
  next();
};

/**
 * Type guard to check if user is authenticated
 */
export const isAuthenticated = (req: Request): req is Request & { user: NonNullable<Request['user']> } => {
  return !!req.user;
};

/**
 * Helper to get authenticated user safely
 */
export const getAuthenticatedUser = (req: Request) => {
  if (!req.user) {
    throw new AuthenticationError('User not authenticated');
  }
  return req.user;
};