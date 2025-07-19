import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger, logSecurity } from '../utils/logger';

// Extend Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      startTime?: number;
    }
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Generate unique request ID
  req.requestId = req.headers['x-request-id'] as string || uuidv4();
  req.startTime = Date.now();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);
  
  // Store requestId on response locals for error handler
  res.locals.requestId = req.requestId;

  // Log request with additional security context
  logger.info('Incoming request', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    referer: req.headers['referer'],
    contentType: req.headers['content-type'],
    contentLength: req.headers['content-length'],
    ...(req.user && { userId: (req.user as any).id })
  });

  // Capture response data for better logging
  const originalSend = res.send;
  const originalJson = res.json;
  let responseBody: any;

  res.send = function(data) {
    responseBody = data;
    res.send = originalSend;
    return res.send(data);
  };

  res.json = function(data) {
    responseBody = data;
    res.json = originalJson;
    return res.json(data);
  };

  // Log response on finish with enhanced details
  res.on('finish', () => {
    const duration = Date.now() - (req.startTime || 0);
    
    const logData: any = {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length'),
      ...(req.user && { userId: (req.user as any).id })
    };

    // Add error details for error responses
    if (res.statusCode >= 400 && responseBody) {
      try {
        const parsed = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
        if (parsed.error) {
          logData.errorCode = parsed.error.code;
          logData.errorMessage = parsed.error.message;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Choose log level based on status code
    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request error', logData);
    } else {
      logger.info('Request completed', logData);
    }

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        ...logData,
        threshold: 1000
      });
    }

    // Log security events
    logSecurityEvents(req, res, logData);
  });

  next();
}

/**
 * Log security events based on status codes and request patterns
 */
function logSecurityEvents(req: Request, res: Response, logData: any) {
  // Log authentication failures
  if (res.statusCode === 401) {
    logSecurity('Authentication failure', {
      ...logData,
      attemptedAuth: req.headers['authorization'] ? 'Bearer' : 'None'
    });
  }

  // Log authorization failures
  if (res.statusCode === 403) {
    logSecurity('Authorization failure', logData);
  }

  // Log rate limit violations
  if (res.statusCode === 429) {
    logSecurity('Rate limit exceeded', logData);
  }

  // Log suspicious patterns
  if (req.url.includes('../') || req.url.includes('..\\')) {
    logSecurity('Path traversal attempt detected', logData);
  }

  // Log SQL injection attempts in query parameters
  const suspiciousPatterns = ['union', 'select', 'drop', 'insert', 'delete', '--', ';'];
  const queryString = JSON.stringify(req.query).toLowerCase();
  if (suspiciousPatterns.some(pattern => queryString.includes(pattern))) {
    logSecurity('Suspicious query pattern detected', {
      ...logData,
      query: req.query
    });
  }
}

// Skip logging for certain paths
export function skipLogging(paths: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (paths.some(path => req.url.startsWith(path))) {
      return next();
    }
    return requestLogger(req, res, next);
  };
}

/**
 * Performance monitoring middleware
 * Tracks request processing time by route
 */
export function performanceMonitor(req: Request, res: Response, next: NextFunction) {
  const route = req.route?.path || req.path;
  const method = req.method;
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    logger.debug('Route performance', {
      route,
      method,
      duration,
      statusCode: res.statusCode,
      requestId: req.requestId
    });

    // Log performance issues
    if (duration > 5000) { // 5 seconds
      logger.warn('Very slow request detected', {
        route,
        method,
        duration,
        requestId: req.requestId,
        threshold: 5000
      });
    }
  });

  next();
}

/**
 * Error context middleware
 * Adds additional context for error logging
 */
export function errorContext(req: Request, res: Response, next: NextFunction) {
  // Add request context to locals for error handler
  res.locals.requestContext = {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
    userId: req.user ? (req.user as any).id : undefined,
    startTime: req.startTime
  };

  next();
}