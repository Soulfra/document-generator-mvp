import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, ForbiddenError } from '../utils/errors';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import Redis from 'ioredis';
import { apiKeyService } from '../services/api-keys/api-key.service';
import { security } from '../config/security.config';
import { prometheusMetrics } from '../services/monitoring/prometheus-metrics.service';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface AuthOptions {
  role?: string;
  optional?: boolean;
  platformTokens?: number;
  trustTier?: string[];
}

interface AuthenticatedUser {
  id: string;
  email?: string;
  displayName?: string;
  platformTokens: number;
  totalEarnings: number;
  referralCode?: string;
  metadata?: any;
  userNumber?: number;
  lastActiveAt?: Date;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      authType?: 'bearer' | 'api-key' | 'session';
    }
  }
}

const JWT_SECRET = security.secrets.jwtSecret;

/**
 * Generate JWT token with enhanced payload
 */
export const generateToken = (payload: any) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY || '24h'
  });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Multi-method authentication middleware
 * Supports: Bearer tokens, API keys, session cookies
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let token: string | null = null;
    let authType: 'bearer' | 'api-key' | 'session' | null = null;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      authType = 'bearer';
    }

    // Check API key header
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) {
      token = apiKey;
      authType = 'api-key';
    }

    // Check session cookie
    if (req.cookies && req.cookies.finishthisidea_session) {
      token = req.cookies.finishthisidea_session;
      authType = 'session';
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    let user: AuthenticatedUser | null = null;

    if (authType === 'bearer' || authType === 'session') {
      // Verify JWT token
      const decoded = verifyToken(token) as any;
      if (!decoded) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }

      // Check token blacklist
      const isBlacklisted = await redis.exists(`blacklist:${token}`);
      if (isBlacklisted) {
        return res.status(401).json({
          success: false,
          error: 'Token has been revoked'
        });
      }

      // Get user from cache or database
      const cachedUser = await redis.get(`user:${decoded.id}`);
      if (cachedUser) {
        user = JSON.parse(cachedUser);
      } else {
        const dbUser = await prisma.user.findUnique({
          where: { id: decoded.id }
        });
        
        if (dbUser) {
          user = {
            id: dbUser.id,
            email: dbUser.email || undefined,
            displayName: dbUser.displayName || undefined,
            platformTokens: dbUser.platformTokens,
            totalEarnings: dbUser.totalEarnings,
            referralCode: dbUser.referralCode || undefined,
            metadata: dbUser.metadata,
            userNumber: dbUser.userNumber || undefined,
            lastActiveAt: dbUser.lastActiveAt || undefined
          };
          
          // Cache user data for 1 hour
          await redis.setex(
            `user:${user.id}`,
            3600,
            JSON.stringify(user)
          );
        }
      }
    } else if (authType === 'api-key') {
      // Use enhanced API key service
      const apiKeyValidation = await apiKeyService.validateApiKey(token);
      
      if (!apiKeyValidation.valid) {
        prometheusMetrics.authAttempts.inc({ status: 'invalid_api_key' });
        return res.status(401).json({
          success: false,
          error: apiKeyValidation.reason || 'Invalid API key'
        });
      }
      
      // Check rate limits for API key
      const rateLimit = await apiKeyService.checkRateLimit(
        apiKeyValidation.apiKey!.id,
        apiKeyValidation.apiKey!.rateLimit
      );
      
      if (!rateLimit.allowed) {
        prometheusMetrics.rateLimitHits.inc({ key: apiKeyValidation.apiKey!.id });
        res.setHeader('X-RateLimit-Limit', apiKeyValidation.apiKey!.rateLimit!.requests.toString());
        res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
        res.setHeader('X-RateLimit-Reset', rateLimit.resetAt.toISOString());
        
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded'
        });
      }
      
      // Use the API key's associated user
      user = {
        id: apiKeyValidation.user!.id,
        email: apiKeyValidation.user!.email || undefined,
        displayName: apiKeyValidation.user!.displayName || undefined,
        platformTokens: apiKeyValidation.user!.platformTokens,
        totalEarnings: apiKeyValidation.user!.totalEarnings,
        referralCode: apiKeyValidation.user!.referralCode || undefined,
        metadata: apiKeyValidation.user!.metadata,
        userNumber: apiKeyValidation.user!.userNumber || undefined,
        lastActiveAt: apiKeyValidation.user!.lastActiveAt || undefined
      };
      
      // Store API key data in request for later use
      (req as any).apiKey = apiKeyValidation.apiKey;
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication credentials'
      });
    }

    // Attach user to request
    req.user = user;
    req.authType = authType;

    // Update last activity
    if (user.id !== 'system') {
      await redis.setex(`activity:${user.id}`, 300, Date.now().toString());
      
      // Update database last active time (async, don't wait)
      prisma.user.update({
        where: { id: user.id },
        data: { lastActiveAt: new Date() }
      }).catch(err => logger.error('Failed to update last active:', err));
    }

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication - doesn't fail if no auth provided
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'];
    const sessionCookie = req.cookies?.finishthisidea_session;

    if (authHeader || apiKey || sessionCookie) {
      // Try to authenticate but don't fail if it doesn't work
      return authenticate(req, res, next);
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

/**
 * Authorize based on platform tokens
 */
export const requireTokens = (requiredTokens: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (req.user.platformTokens < requiredTokens) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient platform tokens',
        required: requiredTokens,
        available: req.user.platformTokens
      });
    }

    next();
  };
};

/**
 * Rate limiting based on user tier/tokens
 */
export const tokenBasedRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next();
  }

  // Rate limits based on platform tokens
  const limits = {
    free: { window: 60, max: 10 },      // 0-99 tokens: 10 requests per minute
    bronze: { window: 60, max: 30 },    // 100-999 tokens: 30 requests per minute
    silver: { window: 60, max: 60 },    // 1000-4999 tokens: 60 requests per minute
    gold: { window: 60, max: 120 },     // 5000-19999 tokens: 120 requests per minute
    platinum: { window: 60, max: 300 }  // 20000+ tokens: 300 requests per minute
  };

  let tierLimit;
  if (req.user.platformTokens >= 20000) {
    tierLimit = limits.platinum;
  } else if (req.user.platformTokens >= 5000) {
    tierLimit = limits.gold;
  } else if (req.user.platformTokens >= 1000) {
    tierLimit = limits.silver;
  } else if (req.user.platformTokens >= 100) {
    tierLimit = limits.bronze;
  } else {
    tierLimit = limits.free;
  }

  const key = `rate:${req.user.id}:${Math.floor(Date.now() / (tierLimit.window * 1000))}`;
  
  const count = await redis.incr(key);
  
  if (count === 1) {
    await redis.expire(key, tierLimit.window);
  }

  if (count > tierLimit.max) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      retry_after: tierLimit.window,
      current_tokens: req.user.platformTokens
    });
  }

  res.setHeader('X-RateLimit-Limit', tierLimit.max.toString());
  res.setHeader('X-RateLimit-Remaining', Math.max(0, tierLimit.max - count).toString());
  res.setHeader('X-RateLimit-Reset', new Date((Math.floor(Date.now() / (tierLimit.window * 1000)) + 1) * tierLimit.window * 1000).toISOString());

  next();
};

/**
 * Generate API key for user
 */
export const generateApiKey = async (userId: string, name: string, options?: any): Promise<{ key: string; masked: string }> => {
  const result = await apiKeyService.createApiKey(userId, {
    name,
    scopes: options?.scopes || ['read', 'write'],
    expiresIn: options?.expiresIn,
    metadata: options?.metadata,
    rateLimit: options?.rateLimit
  });
  
  return {
    key: result.plainKey,
    masked: result.apiKey.key
  };
};

/**
 * Revoke token by adding to blacklist
 */
export const revokeToken = async (token: string): Promise<void> => {
  await redis.setex(`blacklist:${token}`, 86400 * 7, '1'); // 7 days TTL
};

/**
 * Legacy function for backward compatibility
 */
export function authentication(options: AuthOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // First authenticate
    await authenticate(req, res, () => {});
    
    if (!req.user && !options.optional) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check platform tokens if specified
    if (options.platformTokens && req.user && req.user.platformTokens < options.platformTokens) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient platform tokens',
        required: options.platformTokens,
        available: req.user.platformTokens
      });
    }

    next();
  };
}

/**
 * Simple API key authentication for certain endpoints
 */
export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required'
    });
  }
  
  // Delegate to main authenticate function with API key
  req.headers['x-api-key'] = apiKey;
  return authenticate(req, res, next);
}

export function generateTokenLegacy(userId: string, role?: string): string {
  return jwt.sign(
    { id: userId, role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}