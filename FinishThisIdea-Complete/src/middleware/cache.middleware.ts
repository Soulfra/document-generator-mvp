import { Request, Response, NextFunction } from 'express';
import { apiCache } from '../services/cache/cache.service';
import { logger } from '../utils/logger';
import crypto from 'crypto';

export interface CacheMiddlewareOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  condition?: (req: Request, res: Response) => boolean;
  skipHeaders?: string[];
  varyBy?: string[]; // Headers to vary cache by
  tags?: string[] | ((req: Request) => string[]);
  compress?: boolean;
}

const DEFAULT_OPTIONS: Required<CacheMiddlewareOptions> = {
  ttl: 300, // 5 minutes
  keyGenerator: (req: Request) => `${req.method}:${req.originalUrl}`,
  condition: (req: Request, res: Response) => req.method === 'GET' && res.statusCode === 200,
  skipHeaders: ['set-cookie', 'authorization'],
  varyBy: ['accept', 'accept-encoding', 'user-agent'],
  tags: [],
  compress: true
};

export interface CachedResponse {
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: any;
  timestamp: number;
  etag?: string;
}

export function cacheMiddleware(options: CacheMiddlewareOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests by default
    if (!config.condition(req, res)) {
      return next();
    }

    const cacheKey = generateCacheKey(req, config);
    
    try {
      // Try to get cached response
      const cached = await apiCache.get<CachedResponse>(cacheKey);
      
      if (cached) {
        // Check if client has a matching ETag
        if (cached.etag && req.headers['if-none-match'] === cached.etag) {
          res.status(304).end();
          return;
        }

        // Serve cached response
        res.status(cached.statusCode);
        
        // Set cached headers (excluding skip headers)
        Object.entries(cached.headers).forEach(([key, value]) => {
          if (!config.skipHeaders.includes(key.toLowerCase())) {
            res.set(key, value);
          }
        });

        // Add cache headers
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Date', new Date(cached.timestamp).toISOString());
        
        if (cached.etag) {
          res.set('ETag', cached.etag);
        }

        logger.debug('Cache hit', { key: cacheKey, method: req.method, url: req.originalUrl });
        return res.json(cached.body);
      }

      // Cache miss - intercept response
      const originalSend = res.json;
      const originalStatus = res.status;
      let statusCode = 200;

      res.status = function(code: number) {
        statusCode = code;
        return originalStatus.call(this, code);
      };

      res.json = function(body: any) {
        // Only cache successful responses
        if (config.condition(req, res) && statusCode >= 200 && statusCode < 300) {
          cacheResponse(req, res, body, statusCode, cacheKey, config);
        }

        res.set('X-Cache', 'MISS');
        logger.debug('Cache miss', { key: cacheKey, method: req.method, url: req.originalUrl });
        
        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error, cacheKey });
      next();
    }
  };
}

function generateCacheKey(req: Request, config: Required<CacheMiddlewareOptions>): string {
  let key = config.keyGenerator(req);

  // Add vary headers to key
  const varyValues = config.varyBy
    .map(header => req.headers[header] || '')
    .join('|');

  if (varyValues) {
    key += `|vary:${crypto.createHash('md5').update(varyValues).digest('hex')}`;
  }

  // Add query parameters (sorted for consistency)
  const queryKeys = Object.keys(req.query).sort();
  if (queryKeys.length > 0) {
    const queryString = queryKeys
      .map(key => `${key}=${req.query[key]}`)
      .join('&');
    key += `|query:${crypto.createHash('md5').update(queryString).digest('hex')}`;
  }

  // Add user context if authenticated
  if (req.user?.id) {
    key += `|user:${req.user.id}`;
  }

  return key;
}

async function cacheResponse(
  req: Request,
  res: Response,
  body: any,
  statusCode: number,
  cacheKey: string,
  config: Required<CacheMiddlewareOptions>
) {
  try {
    // Generate ETag
    const etag = `"${crypto.createHash('md5').update(JSON.stringify(body)).digest('hex')}"`;

    // Prepare headers to cache (excluding sensitive ones)
    const headers: Record<string, string | string[]> = {};
    Object.entries(res.getHeaders()).forEach(([key, value]) => {
      if (!config.skipHeaders.includes(key.toLowerCase()) && value !== undefined) {
        headers[key] = value as string | string[];
      }
    });

    const cachedResponse: CachedResponse = {
      statusCode,
      headers,
      body,
      timestamp: Date.now(),
      etag
    };

    // Get tags for cache invalidation
    const tags = typeof config.tags === 'function' ? config.tags(req) : config.tags;

    // Cache the response
    await apiCache.set(cacheKey, cachedResponse, {
      ttl: config.ttl,
      tags,
      compress: config.compress
    });

    // Set ETag header
    res.set('ETag', etag);
    
    logger.debug('Response cached', { 
      key: cacheKey, 
      ttl: config.ttl,
      size: JSON.stringify(body).length,
      tags 
    });
  } catch (error) {
    logger.error('Cache response error', { error, cacheKey });
  }
}

// Specific cache middleware for different use cases
export const shortCache = cacheMiddleware({
  ttl: 60, // 1 minute
  tags: ['short-lived']
});

export const mediumCache = cacheMiddleware({
  ttl: 300, // 5 minutes
  tags: ['medium-lived']
});

export const longCache = cacheMiddleware({
  ttl: 3600, // 1 hour
  tags: ['long-lived']
});

export const userSpecificCache = cacheMiddleware({
  ttl: 300,
  keyGenerator: (req: Request) => `user:${req.user?.id}:${req.method}:${req.originalUrl}`,
  condition: (req: Request) => !!req.user?.id,
  tags: (req: Request) => [`user:${req.user?.id}`]
});

export const publicCache = cacheMiddleware({
  ttl: 600, // 10 minutes
  condition: (req: Request) => !req.user?.id, // Only cache for unauthenticated users
  tags: ['public']
});

// Cache invalidation helpers
export async function invalidateUserCache(userId: string): Promise<void> {
  try {
    await apiCache.invalidateByTag(`user:${userId}`);
    logger.info('User cache invalidated', { userId });
  } catch (error) {
    logger.error('Failed to invalidate user cache', { userId, error });
  }
}

export async function invalidateRouteCache(route: string): Promise<void> {
  try {
    await apiCache.invalidateByPattern(`*${route}*`);
    logger.info('Route cache invalidated', { route });
  } catch (error) {
    logger.error('Failed to invalidate route cache', { route, error });
  }
}

export async function invalidateTaggedCache(tag: string): Promise<void> {
  try {
    await apiCache.invalidateByTag(tag);
    logger.info('Tagged cache invalidated', { tag });
  } catch (error) {
    logger.error('Failed to invalidate tagged cache', { tag, error });
  }
}

// Conditional caching based on request size
export function conditionalCache(options: CacheMiddlewareOptions & {
  maxRequestSize?: number;
  minResponseSize?: number;
}) {
  const maxRequestSize = options.maxRequestSize || 1024; // 1KB
  const minResponseSize = options.minResponseSize || 100; // 100 bytes

  return cacheMiddleware({
    ...options,
    condition: (req: Request, res: Response) => {
      // Check request size
      const requestSize = JSON.stringify(req.body || {}).length;
      if (requestSize > maxRequestSize) {
        return false;
      }

      // Check if original condition passes
      const originalCondition = options.condition || DEFAULT_OPTIONS.condition;
      return originalCondition(req, res);
    }
  });
}

// Smart caching with automatic TTL adjustment
export function smartCache(baseOptions: CacheMiddlewareOptions = {}) {
  return cacheMiddleware({
    ...baseOptions,
    ttl: baseOptions.ttl || 300,
    keyGenerator: (req: Request) => {
      // Adjust TTL based on route patterns
      let ttl = baseOptions.ttl || 300;
      
      if (req.path.includes('/stats') || req.path.includes('/metrics')) {
        ttl = 60; // 1 minute for frequently changing data
      } else if (req.path.includes('/profile') || req.path.includes('/settings')) {
        ttl = 900; // 15 minutes for user data
      } else if (req.path.includes('/public') || req.path.includes('/static')) {
        ttl = 3600; // 1 hour for static content
      }

      return `${req.method}:${req.originalUrl}:ttl${ttl}`;
    }
  });
}