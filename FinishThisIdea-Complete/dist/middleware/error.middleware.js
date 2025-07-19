"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    const requestId = req.headers['x-request-id'];
    logger_1.logger.error('Error caught in handler:', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        requestId,
    });
    if (err instanceof errors_1.AppError) {
        const errorResponse = (0, errors_1.formatErrorResponse)(err, requestId);
        res.status(err.statusCode).json(errorResponse);
        return;
    }
    if (err.constructor.name === 'PrismaClientKnownRequestError') {
        const prismaError = err;
        if (prismaError.code === 'P2002') {
            res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_ENTRY',
                    message: 'A record with this value already exists',
                },
                requestId,
            });
            return;
        }
        if (prismaError.code === 'P2025') {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Record not found',
                },
                requestId,
            });
            return;
        }
    }
    if (err.constructor.name === 'StripeError') {
        const stripeError = err;
        res.status(402).json({
            success: false,
            error: {
                code: 'PAYMENT_ERROR',
                message: stripeError.message || 'Payment processing failed',
            },
            requestId,
        });
        return;
    }
    if (err.name === 'ValidationError' && 'details' in err) {
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request data',
                details: err.details,
            },
            requestId,
        });
        return;
    }
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : err.message,
        },
        requestId,
    });
}
//# sourceMappingURL=error.middleware.js.map