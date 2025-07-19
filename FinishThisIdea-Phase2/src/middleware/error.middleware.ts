import { Request, Response, NextFunction } from 'express';
import { AppError, formatErrorResponse } from '../utils/errors';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err);
  }

  const requestId = req.headers['x-request-id'] as string;

  // Log error details
  logger.error('Error caught in handler:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    requestId,
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    const errorResponse = formatErrorResponse(err, requestId);
    res.status(err.statusCode).json(errorResponse);
    return;
  }

  // Handle Prisma errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
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

  // Handle Stripe errors
  if (err.constructor.name === 'StripeError') {
    const stripeError = err as any;
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

  // Handle validation errors from Joi
  if (err.name === 'ValidationError' && 'details' in err) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: (err as any).details,
      },
      requestId,
    });
    return;
  }

  // Default to 500 internal server error
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