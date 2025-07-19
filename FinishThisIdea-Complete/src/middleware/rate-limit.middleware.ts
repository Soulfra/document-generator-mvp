import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from '../utils/errors';
import { logger } from '../utils/logger';
import Redis from 'ioredis';
import crypto from 'crypto';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  slidingWindow?: boolean;
  trustProxy?: boolean;
  whitelist?: string[];
  blacklist?: string[];
  blockDuration?: number;
  skipRateLimitedPaths?: string[];
}

interface IPSecurityOptions {
  maxFailedAttempts: number;
  blockDuration: number;
  keyPrefix: string;
  monitorEndpoints?: string[];
}

/**
 * Get real IP address with proxy support
 */
function getRealIP(req: Request, trustProxy: boolean = true): string {
  if (trustProxy) {
    // Check for forwarded IP headers in order of preference
    const forwarded = req.headers['x-forwarded-for'] as string;
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    const realIP = req.headers['x-real-ip'] as string;
    if (realIP) {
      return realIP;
    }
    
    const cfConnectingIP = req.headers['cf-connecting-ip'] as string;
    if (cfConnectingIP) {
      return cfConnectingIP;
    }
  }
  
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Generate fingerprint for additional security
 */
function generateFingerprint(req: Request): string {
  const components = [
    req.headers['user-agent'] || '',
    req.headers['accept-language'] || '',
    req.headers['accept-encoding'] || '',
    getRealIP(req)
  ];
  
  return crypto
    .createHash('sha256')
    .update(components.join('|'))
    .digest('hex')
    .substring(0, 16);
}

/**
 * Advanced sliding window rate limiter
 */
export function createAdvancedRateLimiter(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyPrefix = 'ratelimit',
    skipFailedRequests = false,
    skipSuccessfulRequests = false,
    slidingWindow = true,
    trustProxy = true,
    whitelist = [],
    blacklist = [],
    blockDuration = 0,
    skipRateLimitedPaths = []
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip rate limiting for certain paths
      if (skipRateLimitedPaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      const ip = getRealIP(req, trustProxy);
      const fingerprint = generateFingerprint(req);
      
      // Check blacklist
      if (blacklist.includes(ip)) {
        logger.warn(`Blacklisted IP attempted access: ${ip}`, {
          ip,
          path: req.path,
          userAgent: req.headers['user-agent']
        });
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }
      
      // Check whitelist
      if (whitelist.length > 0 && !whitelist.includes(ip)) {
        // Skip rate limiting for whitelisted IPs
        if (whitelist.includes(ip)) {
          return next();
        }
      }

      // Check if IP is currently blocked
      const blockKey = `block:${keyPrefix}:${ip}`;
      const isBlocked = await redis.exists(blockKey);
      if (isBlocked) {
        const ttl = await redis.ttl(blockKey);
        return res.status(429).json({
          success: false,
          error: 'IP temporarily blocked due to rate limit violations',
          unblockTime: new Date(Date.now() + (ttl * 1000)).toISOString()
        });
      }

      let key: string;
      let current: number;
      let ttl: number;

      if (slidingWindow) {
        // Sliding window implementation
        const now = Date.now();
        const windowStart = now - windowMs;
        key = `${keyPrefix}:sliding:${ip}`;
        
        // Remove old entries
        await redis.zremrangebyscore(key, 0, windowStart);
        
        // Add current request
        await redis.zadd(key, now, `${now}-${fingerprint}`);
        
        // Count requests in window
        current = await redis.zcard(key);
        
        // Set expiry
        await redis.expire(key, Math.ceil(windowMs / 1000));
        ttl = windowMs;
      } else {
        // Fixed window implementation
        const windowId = Math.floor(Date.now() / windowMs);
        key = `${keyPrefix}:${ip}:${windowId}`;
        
        current = await redis.incr(key);
        
        if (current === 1) {
          await redis.expire(key, Math.ceil(windowMs / 1000));
        }
        
        ttl = await redis.pttl(key);
      }

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current).toString());
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + ttl).toISOString());
      res.setHeader('X-RateLimit-Window', (windowMs / 1000).toString());

      // Check if limit exceeded
      if (current > maxRequests) {
        // Log rate limit violation
        logger.warn(`Rate limit exceeded for IP: ${ip}`, {
          ip,
          fingerprint,
          path: req.path,
          method: req.method,
          userAgent: req.headers['user-agent'],
          current,
          limit: maxRequests
        });

        // Block IP if blockDuration is set
        if (blockDuration > 0) {
          await redis.setex(blockKey, Math.ceil(blockDuration / 1000), '1');
          logger.warn(`IP blocked for ${blockDuration}ms: ${ip}`);
        }
        
        throw new RateLimitError(`Rate limit exceeded. Try again in ${Math.ceil(ttl / 1000)} seconds`);
      }

      // Enhanced skip logic with response monitoring
      if (skipFailedRequests || skipSuccessfulRequests) {
        const originalSend = res.send;
        res.send = function(data) {
          const shouldSkip = 
            (skipFailedRequests && res.statusCode >= 400) ||
            (skipSuccessfulRequests && res.statusCode < 400);

          if (shouldSkip) {
            if (slidingWindow) {
              // Remove the request from sliding window
              redis.zrem(key, `${Date.now()}-${fingerprint}`);
            } else {
              // Decrement fixed window counter
              redis.decr(key);
            }
          }

          return originalSend.call(this, data);
        };
      }

      next();
    } catch (error) {
      if (error instanceof RateLimitError) {
        next(error);
      } else {
        logger.error('Rate limiter error:', error);
        // Don't block requests if Redis is down
        next();
      }
    }
  };
}

/**
 * IP-based security middleware for detecting suspicious activity
 */
export function createIPSecurityMiddleware(options: IPSecurityOptions) {
  const { maxFailedAttempts, blockDuration, keyPrefix, monitorEndpoints = [] } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = getRealIP(req);
    const failureKey = `${keyPrefix}:failures:${ip}`;
    
    // Monitor specific endpoints if configured
    const shouldMonitor = monitorEndpoints.length === 0 || 
                         monitorEndpoints.some(endpoint => req.path.startsWith(endpoint));
    
    if (!shouldMonitor) {
      return next();
    }

    // Check if IP has too many failures
    const failures = await redis.get(failureKey);
    const failureCount = parseInt(failures || '0', 10);
    
    if (failureCount >= maxFailedAttempts) {
      logger.warn(`IP blocked due to security violations: ${ip}`, {
        ip,
        failures: failureCount,
        path: req.path
      });
      
      return res.status(403).json({
        success: false,
        error: 'Access denied due to security policy'
      });
    }

    // Monitor response to track failures
    const originalSend = res.send;
    res.send = function(data) {
      // Consider 401, 403, 429 as security-relevant failures
      if ([401, 403, 429].includes(res.statusCode)) {
        redis.incr(failureKey);
        redis.expire(failureKey, Math.ceil(blockDuration / 1000));
        
        logger.info(`Security failure recorded for IP: ${ip}`, {
          ip,
          statusCode: res.statusCode,
          path: req.path,
          failures: failureCount + 1
        });
      } else if (res.statusCode < 400) {
        // Reset counter on successful request
        redis.del(failureKey);
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Legacy rate limiter for backward compatibility
 */
export function createRateLimiter(options: RateLimitOptions) {
  return createAdvancedRateLimiter(options);
}

// Enhanced rate limiters with security features
export const rateLimiter = createAdvancedRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  slidingWindow: true,
  blockDuration: 5 * 60 * 1000, // 5 minutes block
});

export const strictRateLimiter = createAdvancedRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 requests per minute
  keyPrefix: 'ratelimit:strict',
  slidingWindow: true,
  blockDuration: 15 * 60 * 1000, // 15 minutes block
});

export const uploadRateLimiter = createAdvancedRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 20, // 20 uploads per hour
  keyPrefix: 'ratelimit:upload',
  skipFailedRequests: true,
  slidingWindow: true,
  blockDuration: 60 * 60 * 1000, // 1 hour block
});

export const authRateLimiter = createAdvancedRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 auth attempts per 15 minutes
  keyPrefix: 'ratelimit:auth',
  skipSuccessfulRequests: true,
  slidingWindow: true,
  blockDuration: 30 * 60 * 1000, // 30 minutes block
});

export const apiRateLimiter = createAdvancedRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 API calls per minute
  keyPrefix: 'ratelimit:api',
  slidingWindow: true,
  skipRateLimitedPaths: ['/health', '/metrics'],
});

// IP security middleware
export const ipSecurityMiddleware = createIPSecurityMiddleware({
  maxFailedAttempts: 10,
  blockDuration: 60 * 60 * 1000, // 1 hour
  keyPrefix: 'security',
  monitorEndpoints: ['/api/auth', '/api/payment', '/api/upload']
});

/**
 * DDoS protection middleware
 */
export const ddosProtection = createAdvancedRateLimiter({
  windowMs: 1000, // 1 second
  maxRequests: 20, // 20 requests per second
  keyPrefix: 'ddos',
  slidingWindow: true,
  blockDuration: 10 * 60 * 1000, // 10 minutes block
  skipRateLimitedPaths: ['/health']
});