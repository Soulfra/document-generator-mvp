/**
 * ADVANCED ERROR HANDLING UTILITIES
 * 
 * Provides comprehensive error handling with circuit breaker, retry logic,
 * timeout management, and proper error classification
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger, logSecurity } from './logger';
import { SentryUtils } from '../config/sentry';
import { 
  AppError, 
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  SecurityError,
  DatabaseError,
  TimeoutError,
  ConflictError,
  NotFoundError,
  ExternalServiceError,
  isAppError,
  formatErrorResponse
} from './errors';

/**
 * Wrap async functions with error handling and timeout
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string,
  timeout?: number
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting ${context}`, { args: sanitizeArgs(args) });

      // Add timeout wrapper if specified
      if (timeout) {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new TimeoutError(context, timeout)), timeout);
        });

        const result = await Promise.race([fn(...args), timeoutPromise]);
        
        logger.info(`Completed ${context}`, {
          duration: Date.now() - startTime,
          success: true
        });
        
        return result;
      } else {
        const result = await fn(...args);
        
        logger.info(`Completed ${context}`, {
          duration: Date.now() - startTime,
          success: true
        });
        
        return result;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      const err = error instanceof Error ? error : new Error(String(error));
      
      logger.error(`Failed ${context}`, {
        error: err.message,
        stack: err.stack,
        duration,
        args: sanitizeArgs(args)
      });

      // Enhanced Sentry error tracking
      SentryUtils.captureException(err, {
        component: 'error_handler',
        operation: context,
        duration_ms: duration,
        timeout_configured: timeout,
        args_sanitized: sanitizeArgs(args)
      });
      
      // Re-throw operational errors as-is
      if (isOperationalError(err)) {
        throw err;
      }
      
      // Wrap non-operational errors
      throw new AppError(
        `${context} failed: ${err.message}`,
        500,
        'INTERNAL_ERROR',
        { originalError: err.message, context }
      );
    }
  };
}

/**
 * Retry wrapper for functions that might fail temporarily
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    delay?: number;
    backoffMultiplier?: number;
    retryOn?: (error: any) => boolean;
    context?: string;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoffMultiplier = 2,
    retryOn = () => true,
    context = 'operation'
  } = options;

  let lastError: any;
  let currentDelay = delay;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      const result = await operation();
      
      if (attempt > 1) {
        logger.info(`${context} succeeded on attempt ${attempt}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on last attempt or if retry condition is false
      if (attempt > maxRetries || !retryOn(error)) {
        break;
      }
      
      logger.warn(`${context} failed on attempt ${attempt}, retrying in ${currentDelay}ms`, {
        error: err.message,
        attempt,
        maxRetries
      });
      
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      currentDelay *= backoffMultiplier;
    }
  }

  throw lastError;
}

/**
 * Circuit breaker for protecting against cascading failures
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private resetTimeout: number = 30000 // 30 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>, context: string = 'operation'): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        logger.info(`Circuit breaker for ${context} moved to HALF_OPEN state`);
      } else {
        throw new ExternalServiceError(
          context,
          `Circuit breaker is OPEN`,
          { state: this.state, failures: this.failures }
        );
      }
    }

    try {
      const result = await operation();
      
      if (this.state === 'HALF_OPEN') {
        this.reset();
        logger.info(`Circuit breaker for ${context} reset to CLOSED state`);
      }
      
      return result;
    } catch (error) {
      this.recordFailure();
      
      if (this.failures >= this.threshold) {
        this.state = 'OPEN';
        logger.error(`Circuit breaker for ${context} opened due to ${this.failures} failures`);
      }
      
      throw error;
    }
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailTime = Date.now();
  }

  private reset(): void {
    this.failures = 0;
    this.state = 'CLOSED';
    this.lastFailTime = 0;
  }

  getState(): { state: string; failures: number; lastFailTime: number } {
    return {
      state: this.state,
      failures: this.failures,
      lastFailTime: this.lastFailTime
    };
  }
}

/**
 * Express error handler middleware
 */
export function errorHandler(error: any, req: Request, res: Response, next: NextFunction): void {
  // Skip if response already sent
  if (res.headersSent) {
    return next(error);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationError = new ValidationError('Request validation failed', {
      issues: error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }))
    });
    
    return handleOperationalError(validationError, req, res);
  }

  // Handle Prisma errors
  if (error.code && error.code.startsWith('P')) {
    return handlePrismaError(error, req, res);
  }

  // Handle operational errors
  if (isOperationalError(error)) {
    return handleOperationalError(error, req, res);
  }

  // Handle programming errors
  logger.error('Unhandled programming error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    body: sanitizeArgs([req.body])[0],
    query: req.query,
    params: req.params
  });

  // Enhanced Sentry tracking for programming errors
  SentryUtils.captureException(error, {
    component: 'error_handler',
    operation: 'unhandled_error',
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: sanitizeArgs([req.body])[0],
    query: req.query,
    params: req.params
  });

  // Log security errors
  if (error.name === 'SecurityError' || error.code === 'SECURITY_ERROR') {
    logSecurity('Security error detected', {
      error: error.message,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Track security events in Sentry with high priority
    SentryUtils.captureMessage(
      'Security error detected',
      'error',
      {
        component: 'security',
        event: 'security_error',
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    );
  }

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    requestId: (req as any).requestId || 'unknown'
  });
}

/**
 * Handle operational errors with proper logging and response
 */
function handleOperationalError(error: AppError, req: Request, res: Response): void {
  logger.error('Operational error', {
    error: error.message,
    code: error.code,
    statusCode: error.statusCode,
    details: error.details,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    stack: error.stack
  });

  const response = formatErrorResponse(error, (req as any).requestId);
  
  // Include details for client errors (4xx)
  if (error.statusCode >= 400 && error.statusCode < 500 && error.details) {
    response.error.details = error.details;
  }

  res.status(error.statusCode).json(response);
}

/**
 * Handle Prisma-specific errors
 */
function handlePrismaError(error: any, req: Request, res: Response): void {
  let appError: AppError;

  switch (error.code) {
    case 'P2002':
      appError = new ConflictError('A record with this value already exists', {
        field: error.meta?.target
      });
      break;
    case 'P2003':
      appError = new ValidationError('Invalid reference', {
        field: error.meta?.field_name
      });
      break;
    case 'P2025':
      appError = new NotFoundError('Record not found');
      break;
    case 'P1008':
      appError = new DatabaseError('Database operation timeout');
      break;
    default:
      appError = new DatabaseError('Database operation failed', {
        code: error.code
      });
  }

  handleOperationalError(appError, req, res);
}

/**
 * Check if error is operational (expected) vs programming error
 */
export function isOperationalError(error: any): error is AppError {
  if (isAppError(error)) {
    return error.isOperational;
  }
  
  // Known operational error types
  const operationalErrorTypes = [
    'ValidationError',
    'AuthenticationError',
    'ForbiddenError',
    'NotFoundError',
    'ConflictError',
    'RateLimitError',
    'TimeoutError',
    'FileProcessingError',
    'ResourceLimitError',
    'DatabaseError',
    'SecurityError',
    'PaymentError',
    'ExternalServiceError'
  ];
  
  return operationalErrorTypes.includes(error.name);
}

/**
 * Sanitize function arguments for logging (remove sensitive data)
 */
function sanitizeArgs(args: any[]): any[] {
  return args.map(arg => {
    if (typeof arg === 'string' && arg.length > 1000) {
      return `[Long string: ${arg.length} chars]`;
    }
    
    if (typeof arg === 'object' && arg !== null) {
      const sanitized = { ...arg };
      
      // Remove potentially sensitive fields
      const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'key', 'authorization', 'cookie'];
      sensitiveFields.forEach(field => {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      });
      
      return sanitized;
    }
    
    return arg;
  });
}

/**
 * Global unhandled error handlers
 */
export function setupGlobalErrorHandlers(): void {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception', {
      error: error.message,
      stack: error.stack
    });
    
    // Give time for log to be written
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    logger.error('Unhandled promise rejection', {
      reason: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      promise: promise.toString()
    });
    
    // Convert to uncaught exception
    throw reason;
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
  });
}

// Create circuit breakers for external services
export const llmCircuitBreaker = new CircuitBreaker(3, 60000);
export const s3CircuitBreaker = new CircuitBreaker(5, 30000);
export const stripeCircuitBreaker = new CircuitBreaker(3, 30000);
export const redisCircuitBreaker = new CircuitBreaker(5, 20000);

// Legacy exports for backward compatibility
export {
  AppError as DocumentationError,
  ValidationError,
  TimeoutError,
  ExternalServiceError as LLMError,
} from './errors';