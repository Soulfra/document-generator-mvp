/**
 * SENTRY MIDDLEWARE
 * 
 * Express middleware for Sentry integration with enhanced error tracking,
 * performance monitoring, and user context management
 */

import { Request, Response, NextFunction } from 'express';
import * as Sentry from '@sentry/node';
import { SentryUtils } from '../config/sentry';
import { logger } from '../utils/logger';

// Extend Request type to include Sentry transaction
declare global {
  namespace Express {
    interface Request {
      sentryTransaction?: Sentry.Transaction;
      sentryUser?: {
        id?: string;
        email?: string;
        username?: string;
        tier?: string;
      };
    }
  }
}

/**
 * Initialize Sentry request handling
 * Must be used before any other middleware
 */
export const sentryRequestHandler = Sentry.Handlers.requestHandler({
  user: ['id', 'email', 'username'],
  ip: true,
  request: ['data', 'headers', 'method', 'query_string', 'url'],
  transaction: 'methodPath', // Will use HTTP method + path as transaction name
});

/**
 * Enhanced request tracking middleware
 * Adds custom context and performance monitoring
 */
export function sentryEnhancedTracking(req: Request, res: Response, next: NextFunction): void {
  try {
    // Start performance transaction
    const transaction = Sentry.startTransaction({
      name: `${req.method} ${req.route?.path || req.path}`,
      op: 'http.server',
      tags: {
        method: req.method,
        endpoint: req.path,
        userAgent: req.get('User-Agent'),
      },
    });
    
    // Attach transaction to request for later use
    req.sentryTransaction = transaction;
    
    // Add request context
    Sentry.configureScope((scope) => {
      scope.setTag('route', req.path);
      scope.setTag('method', req.method);
      scope.setContext('request', {
        url: req.url,
        method: req.method,
        headers: {
          'user-agent': req.get('User-Agent'),
          'x-forwarded-for': req.get('x-forwarded-for'),
          'content-type': req.get('content-type'),
        },
        query: req.query,
        ip: req.ip,
      });
    });
    
    // Track API version if present
    const apiVersion = req.headers['x-api-version'] || req.headers['api-version'];
    if (apiVersion) {
      Sentry.setTag('api_version', apiVersion as string);
    }
    
    // Monitor response
    const originalSend = res.send;
    res.send = function(data) {
      const statusCode = res.statusCode;
      
      // Set transaction status based on response
      if (statusCode >= 400) {
        transaction.setStatus('http_error');
        transaction.setHttpStatus(statusCode);
        
        // Add error context for client errors
        if (statusCode >= 400 && statusCode < 500) {
          SentryUtils.addBreadcrumb(
            `Client error: ${statusCode}`,
            'http.response',
            { statusCode, path: req.path, method: req.method }
          );
        }
      } else {
        transaction.setStatus('ok');
        transaction.setHttpStatus(statusCode);
      }
      
      // Add response size
      if (data) {
        const size = Buffer.byteLength(data, 'utf8');
        transaction.setData('response_size', size);
      }
      
      transaction.finish();
      return originalSend.call(this, data);
    };
    
    next();
  } catch (error) {
    logger.error('Sentry tracking middleware error', { error });
    next();
  }
}

/**
 * User context middleware
 * Sets user information for error attribution
 */
export function sentryUserContext(req: Request, res: Response, next: NextFunction): void {
  try {
    // Extract user from JWT or session
    const user = (req as any).user;
    
    if (user) {
      const sentryUser = {
        id: user.id,
        email: user.email,
        username: user.username || user.displayName,
        tier: user.tier || 'free',
      };
      
      req.sentryUser = sentryUser;
      SentryUtils.setUser(sentryUser);
      
      // Add user breadcrumb
      SentryUtils.addBreadcrumb(
        'User authenticated',
        'auth',
        { userId: user.id, tier: user.tier }
      );
    }
    
    next();
  } catch (error) {
    logger.error('Sentry user context middleware error', { error });
    next();
  }
}

/**
 * Performance monitoring middleware for slow requests
 */
export function sentryPerformanceMonitoring(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Monitor for slow requests
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const transaction = req.sentryTransaction;
    
    if (transaction) {
      transaction.setData('duration_ms', duration);
      
      // Flag slow requests
      if (duration > 5000) { // 5 seconds
        SentryUtils.captureMessage(
          `Slow request detected: ${req.method} ${req.path}`,
          'warning',
          {
            component: 'performance',
            duration_ms: duration,
            method: req.method,
            path: req.path,
            user_id: req.sentryUser?.id,
          }
        );
      }
      
      // Track database-heavy requests
      if (duration > 2000) { // 2 seconds
        SentryUtils.addBreadcrumb(
          'Database-heavy request',
          'performance',
          { duration_ms: duration, path: req.path }
        );
      }
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

/**
 * Business logic tracking middleware
 * Tracks important business events
 */
export function sentryBusinessEvents(req: Request, res: Response, next: NextFunction): void {
  const originalSend = res.send;
  
  res.send = function(data) {
    const statusCode = res.statusCode;
    const path = req.path;
    const method = req.method;
    
    // Track important business events
    if (statusCode === 200 || statusCode === 201) {
      // Job creation
      if (method === 'POST' && path.includes('/jobs')) {
        SentryUtils.addBreadcrumb(
          'Job created successfully',
          'business.job',
          { user_id: req.sentryUser?.id, path }
        );
      }
      
      // Payment events
      if (path.includes('/payment')) {
        SentryUtils.addBreadcrumb(
          'Payment processed',
          'business.payment',
          { user_id: req.sentryUser?.id, method, path }
        );
      }
      
      // User registration
      if (method === 'POST' && path.includes('/auth/register')) {
        SentryUtils.captureMessage(
          'New user registration',
          'info',
          { component: 'auth', event: 'registration' }
        );
      }
      
      // File uploads
      if (method === 'POST' && path.includes('/upload')) {
        SentryUtils.addBreadcrumb(
          'File uploaded',
          'business.upload',
          { user_id: req.sentryUser?.id }
        );
      }
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

/**
 * Security event tracking middleware
 * Integrates with existing security monitoring
 */
export function sentrySecurity(req: Request, res: Response, next: NextFunction): void {
  const originalSend = res.send;
  
  res.send = function(data) {
    const statusCode = res.statusCode;
    
    // Track security-relevant events
    if (statusCode === 401) {
      SentryUtils.captureMessage(
        'Unauthorized access attempt',
        'warning',
        {
          component: 'security',
          event: 'unauthorized_access',
          ip: req.ip,
          path: req.path,
          userAgent: req.get('User-Agent'),
        }
      );
    }
    
    if (statusCode === 403) {
      SentryUtils.captureMessage(
        'Forbidden access attempt',
        'warning',
        {
          component: 'security',
          event: 'forbidden_access',
          ip: req.ip,
          path: req.path,
          user_id: req.sentryUser?.id,
        }
      );
    }
    
    if (statusCode === 429) {
      SentryUtils.captureMessage(
        'Rate limit exceeded',
        'warning',
        {
          component: 'security',
          event: 'rate_limit_exceeded',
          ip: req.ip,
          path: req.path,
        }
      );
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

/**
 * Sentry error handler
 * Must be used after all other middleware but before error handlers
 */
export const sentryErrorHandler = Sentry.Handlers.errorHandler({
  shouldHandleError(error: Error) {
    // Only handle errors that should be reported to Sentry
    const skipErrors = [
      'ValidationError',
      'AuthenticationError',
      'AuthorizationError',
    ];
    
    return !skipErrors.some(skipError => error.name === skipError);
  },
});

/**
 * Enhanced error tracking middleware
 * Adds additional context to errors before Sentry processes them
 */
export function sentryEnhancedErrorHandler(error: Error, req: Request, res: Response, next: NextFunction): void {
  try {
    // Add enhanced error context
    Sentry.withScope((scope) => {
      scope.setTag('error_boundary', 'middleware');
      scope.setLevel('error');
      
      // Add request context
      scope.setContext('request_details', {
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Add user context if available
      if (req.sentryUser) {
        scope.setUser(req.sentryUser);
      }
      
      // Add error details
      scope.setContext('error_details', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      
      // Capture the error
      SentryUtils.captureException(error, {
        component: 'middleware',
        operation: 'error_handling',
        path: req.path,
        method: req.method,
      });
    });
  } catch (sentryError) {
    logger.error('Sentry error handler failed', { error: sentryError });
  }
  
  // Continue to the next error handler
  next(error);
}

/**
 * Cleanup middleware for end of request
 */
export function sentryCleanup(req: Request, res: Response, next: NextFunction): void {
  // Clean up Sentry scope at the end of request
  res.on('finish', () => {
    Sentry.configureScope((scope) => {
      scope.clear();
    });
  });
  
  next();
}

export default {
  requestHandler: sentryRequestHandler,
  enhancedTracking: sentryEnhancedTracking,
  userContext: sentryUserContext,
  performanceMonitoring: sentryPerformanceMonitoring,
  businessEvents: sentryBusinessEvents,
  security: sentrySecurity,
  errorHandler: sentryErrorHandler,
  enhancedErrorHandler: sentryEnhancedErrorHandler,
  cleanup: sentryCleanup,
};