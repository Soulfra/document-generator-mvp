export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number, code?: string, details?: any, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', details?: any) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden', details?: any) {
    super(message, 403, 'FORBIDDEN_ERROR', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: any) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests', details?: any) {
    super(message, 429, 'RATE_LIMIT_ERROR', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string, service?: string) {
    super(message, 503, 'EXTERNAL_SERVICE_ERROR');
    if (service) {
      this.message = `${service}: ${message}`;
    }
  }
}

export class PaymentError extends AppError {
  constructor(message: string) {
    super(message, 402, 'PAYMENT_ERROR');
  }
}

export class ProcessingError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'PROCESSING_ERROR', details);
  }
}

// Additional error types for comprehensive classification
export class FileProcessingError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 422, 'FILE_PROCESSING_ERROR', details);
  }
}

export class TimeoutError extends AppError {
  constructor(operation: string, timeout: number) {
    super(`Operation '${operation}' timed out after ${timeout}ms`, 408, 'TIMEOUT_ERROR', {
      operation,
      timeout
    });
  }
}

export class ResourceLimitError extends AppError {
  constructor(resource: string, limit: number, actual: number) {
    super(
      `${resource} limit exceeded: ${actual} > ${limit}`,
      413,
      'RESOURCE_LIMIT_ERROR',
      { resource, limit, actual }
    );
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 503, 'DATABASE_ERROR', details);
  }
}

export class SecurityError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 403, 'SECURITY_ERROR', details);
  }
}

// Error response formatter
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  requestId?: string;
}

export function formatErrorResponse(error: AppError, requestId?: string): ErrorResponse {
  return {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message,
    },
    ...(requestId && { requestId }),
  };
}

/**
 * Type guard to check if error is an instance of Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Safely extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  return 'An unknown error occurred';
}

/**
 * Convert unknown error to AppError
 */
export function toAppError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  
  const message = getErrorMessage(error);
  return new AppError(message, 500, 'INTERNAL_ERROR');
}

/**
 * Safe error handler for catch blocks
 */
export function handleError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }
  
  // Handle common error types
  if (isError(error)) {
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return new ValidationError(error.message);
    }
    if (error.name === 'CastError') {
      return new ValidationError('Invalid data format');
    }
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return new ProcessingError('Database operation failed');
    }
    if (error.name === 'JsonWebTokenError') {
      return new AuthenticationError('Invalid authentication token');
    }
    if (error.name === 'TokenExpiredError') {
      return new AuthenticationError('Authentication token expired');
    }
  }
  
  // Default to internal error
  return new ProcessingError(getErrorMessage(error));
}