import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, ForbiddenError } from '../utils/errors';
import jwt from 'jsonwebtoken';

interface AuthOptions {
  role?: string;
  optional?: boolean;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role?: string;
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';

export function authentication(options: AuthOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // For MVP, we'll use simple session-based auth
      // In production, implement proper JWT or session management
      
      const token = extractToken(req);
      
      if (!token) {
        if (options.optional) {
          return next();
        }
        throw new AuthenticationError('No authentication token provided');
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        req.user = {
          id: decoded.id,
          role: decoded.role,
        };

        // Check role if specified
        if (options.role && req.user.role !== options.role) {
          throw new ForbiddenError('Insufficient permissions');
        }

        next();
      } catch (jwtError) {
        throw new AuthenticationError('Invalid authentication token');
      }
    } catch (error) {
      next(error);
    }
  };
}

function extractToken(req: Request): string | null {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookie (for web app)
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }

  // Check query parameter (for download links)
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }

  return null;
}

// Helper to generate tokens
export function generateToken(userId: string, role?: string): string {
  return jwt.sign(
    { id: userId, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// For MVP: Simple API key authentication for certain endpoints
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    next(new AuthenticationError('Invalid API key'));
    return;
  }
  
  next();
}