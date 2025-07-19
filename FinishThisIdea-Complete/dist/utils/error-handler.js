"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMError = exports.TimeoutError = exports.ValidationError = exports.DocumentationError = exports.redisCircuitBreaker = exports.stripeCircuitBreaker = exports.s3CircuitBreaker = exports.llmCircuitBreaker = exports.CircuitBreaker = void 0;
exports.withErrorHandling = withErrorHandling;
exports.withRetry = withRetry;
exports.errorHandler = errorHandler;
exports.isOperationalError = isOperationalError;
exports.setupGlobalErrorHandlers = setupGlobalErrorHandlers;
const zod_1 = require("zod");
const logger_1 = require("./logger");
const sentry_1 = require("../config/sentry");
const errors_1 = require("./errors");
function withErrorHandling(fn, context, timeout) {
    return async (...args) => {
        const startTime = Date.now();
        try {
            logger_1.logger.info(`Starting ${context}`, { args: sanitizeArgs(args) });
            if (timeout) {
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new errors_1.TimeoutError(context, timeout)), timeout);
                });
                const result = await Promise.race([fn(...args), timeoutPromise]);
                logger_1.logger.info(`Completed ${context}`, {
                    duration: Date.now() - startTime,
                    success: true
                });
                return result;
            }
            else {
                const result = await fn(...args);
                logger_1.logger.info(`Completed ${context}`, {
                    duration: Date.now() - startTime,
                    success: true
                });
                return result;
            }
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const err = error instanceof Error ? error : new Error(String(error));
            logger_1.logger.error(`Failed ${context}`, {
                error: err.message,
                stack: err.stack,
                duration,
                args: sanitizeArgs(args)
            });
            sentry_1.SentryUtils.captureException(err, {
                component: 'error_handler',
                operation: context,
                duration_ms: duration,
                timeout_configured: timeout,
                args_sanitized: sanitizeArgs(args)
            });
            if (isOperationalError(err)) {
                throw err;
            }
            throw new errors_1.AppError(`${context} failed: ${err.message}`, 500, 'INTERNAL_ERROR', { originalError: err.message, context });
        }
    };
}
async function withRetry(operation, options = {}) {
    const { maxRetries = 3, delay = 1000, backoffMultiplier = 2, retryOn = () => true, context = 'operation' } = options;
    let lastError;
    let currentDelay = delay;
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            const result = await operation();
            if (attempt > 1) {
                logger_1.logger.info(`${context} succeeded on attempt ${attempt}`);
            }
            return result;
        }
        catch (error) {
            lastError = error;
            const err = error instanceof Error ? error : new Error(String(error));
            if (attempt > maxRetries || !retryOn(error)) {
                break;
            }
            logger_1.logger.warn(`${context} failed on attempt ${attempt}, retrying in ${currentDelay}ms`, {
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
class CircuitBreaker {
    threshold;
    resetTimeout;
    failures = 0;
    lastFailTime = 0;
    state = 'CLOSED';
    constructor(threshold = 5, resetTimeout = 30000) {
        this.threshold = threshold;
        this.resetTimeout = resetTimeout;
    }
    async execute(operation, context = 'operation') {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailTime > this.resetTimeout) {
                this.state = 'HALF_OPEN';
                logger_1.logger.info(`Circuit breaker for ${context} moved to HALF_OPEN state`);
            }
            else {
                throw new errors_1.ExternalServiceError(context, `Circuit breaker is OPEN`, { state: this.state, failures: this.failures });
            }
        }
        try {
            const result = await operation();
            if (this.state === 'HALF_OPEN') {
                this.reset();
                logger_1.logger.info(`Circuit breaker for ${context} reset to CLOSED state`);
            }
            return result;
        }
        catch (error) {
            this.recordFailure();
            if (this.failures >= this.threshold) {
                this.state = 'OPEN';
                logger_1.logger.error(`Circuit breaker for ${context} opened due to ${this.failures} failures`);
            }
            throw error;
        }
    }
    recordFailure() {
        this.failures++;
        this.lastFailTime = Date.now();
    }
    reset() {
        this.failures = 0;
        this.state = 'CLOSED';
        this.lastFailTime = 0;
    }
    getState() {
        return {
            state: this.state,
            failures: this.failures,
            lastFailTime: this.lastFailTime
        };
    }
}
exports.CircuitBreaker = CircuitBreaker;
function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }
    if (error instanceof zod_1.ZodError) {
        const validationError = new errors_1.ValidationError('Request validation failed', {
            issues: error.issues.map(issue => ({
                path: issue.path.join('.'),
                message: issue.message,
                code: issue.code
            }))
        });
        return handleOperationalError(validationError, req, res);
    }
    if (error.code && error.code.startsWith('P')) {
        return handlePrismaError(error, req, res);
    }
    if (isOperationalError(error)) {
        return handleOperationalError(error, req, res);
    }
    logger_1.logger.error('Unhandled programming error', {
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
    sentry_1.SentryUtils.captureException(error, {
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
    if (error.name === 'SecurityError' || error.code === 'SECURITY_ERROR') {
        (0, logger_1.logSecurity)('Security error detected', {
            error: error.message,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
        sentry_1.SentryUtils.captureMessage('Security error detected', 'error', {
            component: 'security',
            event: 'security_error',
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });
    }
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        requestId: req.requestId || 'unknown'
    });
}
function handleOperationalError(error, req, res) {
    logger_1.logger.error('Operational error', {
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
    const response = (0, errors_1.formatErrorResponse)(error, req.requestId);
    if (error.statusCode >= 400 && error.statusCode < 500 && error.details) {
        response.error.details = error.details;
    }
    res.status(error.statusCode).json(response);
}
function handlePrismaError(error, req, res) {
    let appError;
    switch (error.code) {
        case 'P2002':
            appError = new errors_1.ConflictError('A record with this value already exists', {
                field: error.meta?.target
            });
            break;
        case 'P2003':
            appError = new errors_1.ValidationError('Invalid reference', {
                field: error.meta?.field_name
            });
            break;
        case 'P2025':
            appError = new errors_1.NotFoundError('Record not found');
            break;
        case 'P1008':
            appError = new errors_1.DatabaseError('Database operation timeout');
            break;
        default:
            appError = new errors_1.DatabaseError('Database operation failed', {
                code: error.code
            });
    }
    handleOperationalError(appError, req, res);
}
function isOperationalError(error) {
    if ((0, errors_1.isAppError)(error)) {
        return error.isOperational;
    }
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
function sanitizeArgs(args) {
    return args.map(arg => {
        if (typeof arg === 'string' && arg.length > 1000) {
            return `[Long string: ${arg.length} chars]`;
        }
        if (typeof arg === 'object' && arg !== null) {
            const sanitized = { ...arg };
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
function setupGlobalErrorHandlers() {
    process.on('uncaughtException', (error) => {
        logger_1.logger.error('Uncaught exception', {
            error: error.message,
            stack: error.stack
        });
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    });
    process.on('unhandledRejection', (reason, promise) => {
        logger_1.logger.error('Unhandled promise rejection', {
            reason: reason instanceof Error ? reason.message : String(reason),
            stack: reason instanceof Error ? reason.stack : undefined,
            promise: promise.toString()
        });
        throw reason;
    });
    process.on('SIGTERM', () => {
        logger_1.logger.info('SIGTERM received, shutting down gracefully');
        process.exit(0);
    });
    process.on('SIGINT', () => {
        logger_1.logger.info('SIGINT received, shutting down gracefully');
        process.exit(0);
    });
}
exports.llmCircuitBreaker = new CircuitBreaker(3, 60000);
exports.s3CircuitBreaker = new CircuitBreaker(5, 30000);
exports.stripeCircuitBreaker = new CircuitBreaker(3, 30000);
exports.redisCircuitBreaker = new CircuitBreaker(5, 20000);
var errors_2 = require("./errors");
Object.defineProperty(exports, "DocumentationError", { enumerable: true, get: function () { return errors_2.AppError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return errors_2.ValidationError; } });
Object.defineProperty(exports, "TimeoutError", { enumerable: true, get: function () { return errors_2.TimeoutError; } });
Object.defineProperty(exports, "LLMError", { enumerable: true, get: function () { return errors_2.ExternalServiceError; } });
//# sourceMappingURL=error-handler.js.map