"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingError = exports.PaymentError = exports.ExternalServiceError = exports.RateLimitError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
exports.formatErrorResponse = formatErrorResponse;
class AppError extends Error {
    constructor(message, statusCode, code, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, 400, 'VALIDATION_ERROR');
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401, 'AUTHENTICATION_ERROR');
    }
}
exports.AuthenticationError = AuthenticationError;
class ForbiddenError extends AppError {
    constructor(message = 'Access forbidden') {
        super(message, 403, 'FORBIDDEN_ERROR');
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message) {
        super(message, 409, 'CONFLICT_ERROR');
    }
}
exports.ConflictError = ConflictError;
class RateLimitError extends AppError {
    constructor(message = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT_ERROR');
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
    constructor(message) {
        super(message, 500, 'PROCESSING_ERROR');
    }
}
exports.ProcessingError = ProcessingError;
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
//# sourceMappingURL=errors.js.map