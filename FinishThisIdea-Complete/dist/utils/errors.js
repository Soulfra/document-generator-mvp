"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityError = exports.DatabaseError = exports.ResourceLimitError = exports.TimeoutError = exports.FileProcessingError = exports.ProcessingError = exports.PaymentError = exports.ExternalServiceError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
exports.formatErrorResponse = formatErrorResponse;
exports.isError = isError;
exports.isAppError = isAppError;
exports.getErrorMessage = getErrorMessage;
exports.toAppError = toAppError;
exports.handleError = handleError;
class AppError extends Error {
    statusCode;
    isOperational;
    code;
    details;
    constructor(message, statusCode, code, details, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, details) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed', details) {
        super(message, 401, 'AUTHENTICATION_ERROR', details);
    }
}
exports.AuthenticationError = AuthenticationError;
class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden', details) {
        super(message, 403, 'FORBIDDEN_ERROR', details);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found', details) {
        super(message, 404, 'NOT_FOUND', details);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message, details) {
        super(message, 409, 'CONFLICT_ERROR', details);
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AppError {
    constructor(message = 'Too many requests', details) {
        super(message, 429, 'RATE_LIMIT_ERROR', details);
    }
}
exports.RateLimitError = RateLimitError;
class ExternalServiceError extends AppError {
    constructor(message, service) {
        super(message, 503, 'EXTERNAL_SERVICE_ERROR');
        if (service) {
            this.message = `${service}: ${message}`;
        }
    }
}
exports.ExternalServiceError = ExternalServiceError;
class PaymentError extends AppError {
    constructor(message) {
        super(message, 402, 'PAYMENT_ERROR');
    }
}
exports.PaymentError = PaymentError;
class ProcessingError extends AppError {
    constructor(message, details) {
        super(message, 500, 'PROCESSING_ERROR', details);
    }
}
exports.ProcessingError = ProcessingError;
class FileProcessingError extends AppError {
    constructor(message, details) {
        super(message, 422, 'FILE_PROCESSING_ERROR', details);
    }
}
exports.FileProcessingError = FileProcessingError;
class TimeoutError extends AppError {
    constructor(operation, timeout) {
        super(`Operation '${operation}' timed out after ${timeout}ms`, 408, 'TIMEOUT_ERROR', {
            operation,
            timeout
        });
    }
}
exports.TimeoutError = TimeoutError;
class ResourceLimitError extends AppError {
    constructor(resource, limit, actual) {
        super(`${resource} limit exceeded: ${actual} > ${limit}`, 413, 'RESOURCE_LIMIT_ERROR', { resource, limit, actual });
    }
}
exports.ResourceLimitError = ResourceLimitError;
class DatabaseError extends AppError {
    constructor(message, details) {
        super(message, 503, 'DATABASE_ERROR', details);
    }
}
exports.DatabaseError = DatabaseError;
class SecurityError extends AppError {
    constructor(message, details) {
        super(message, 403, 'SECURITY_ERROR', details);
    }
}
exports.SecurityError = SecurityError;
function formatErrorResponse(error, requestId) {
    return {
        success: false,
        error: {
            code: error.code || 'INTERNAL_ERROR',
            message: error.message,
        },
        ...(requestId && { requestId }),
    };
}
function isError(error) {
    return error instanceof Error;
}
function isAppError(error) {
    return error instanceof AppError;
}
function getErrorMessage(error) {
    if (isError(error)) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
        return String(error.message);
    }
    return 'An unknown error occurred';
}
function toAppError(error) {
    if (isAppError(error)) {
        return error;
    }
    const message = getErrorMessage(error);
    return new AppError(message, 500, 'INTERNAL_ERROR');
}
function handleError(error) {
    if (isAppError(error)) {
        return error;
    }
    if (isError(error)) {
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
    return new ProcessingError(getErrorMessage(error));
}
//# sourceMappingURL=errors.js.map