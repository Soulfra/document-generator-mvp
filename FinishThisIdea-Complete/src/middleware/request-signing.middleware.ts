/**
 * Request Signing Middleware
 * Validates HMAC signatures for critical API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { hmacService } from '../services/crypto/hmac.service';
import { apiKeyService } from '../services/api-keys/api-key.service';
import { secretsManager } from '../services/secrets/secrets-manager.service';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import { prometheusMetrics } from '../services/monitoring/prometheus-metrics.service';

export interface RequestSigningOptions {
  required?: boolean;
  endpoints?: string[];
  methods?: string[];
  skipPaths?: string[];
  allowUnsigned?: boolean;
}

const defaultOptions: RequestSigningOptions = {
  required: true,
  methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  skipPaths: ['/health', '/api/health', '/api/auth/login', '/api/auth/register'],
  allowUnsigned: false
};

/**
 * Create request signing middleware
 */
export function createRequestSigningMiddleware(
  options: RequestSigningOptions = {}
): (req: Request, res: Response, next: NextFunction) => Promise<void> {
  const config = { ...defaultOptions, ...options };

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const start = Date.now();
    
    try {
      // Skip paths that don't require signing
      if (config.skipPaths?.includes(req.path)) {
        return next();
      }

      // Check if method requires signing
      if (config.methods && !config.methods.includes(req.method)) {
        return next();
      }

      // Check if endpoint requires signing
      if (config.endpoints && !config.endpoints.some(ep => req.path.startsWith(ep))) {
        return next();
      }

      // Check for signature header
      const signature = req.headers['x-signature'] as string;
      const apiKey = req.headers['x-api-key'] as string;

      if (!signature || !apiKey) {
        if (config.allowUnsigned) {
          return next();
        }
        
        prometheusMetrics.authAttempts.inc({ status: 'missing_signature' });
        throw new AppError('Request signature required', 401);
      }

      // Validate API key first
      const keyValidation = await apiKeyService.validateApiKey(apiKey);
      
      if (!keyValidation.valid) {
        prometheusMetrics.authAttempts.inc({ status: 'invalid_api_key' });
        throw new AppError('Invalid API key', 401);
      }

      // Get API secret for the key
      const apiKeyId = keyValidation.apiKey!.id;
      const secretData = await secretsManager.getSecret(`apikey:${apiKeyId}`);
      
      if (!secretData) {
        logger.error('API secret not found', { apiKeyId });
        throw new AppError('Invalid API configuration', 500);
      }

      // Verify request signature
      const verification = await hmacService.verifyRequest(req, secretData.value);
      
      if (!verification.valid) {
        prometheusMetrics.authAttempts.inc({ status: 'invalid_signature' });
        logger.warn('Invalid request signature', {
          apiKeyId,
          reason: verification.reason,
          path: req.path,
          method: req.method
        });
        throw new AppError(`Invalid request signature: ${verification.reason}`, 401);
      }

      // Check rate limits
      const rateLimit = await apiKeyService.checkRateLimit(
        apiKeyId,
        keyValidation.apiKey!.rateLimit
      );
      
      if (!rateLimit.allowed) {
        prometheusMetrics.rateLimitHits.inc({ key: apiKeyId });
        res.setHeader('X-RateLimit-Limit', keyValidation.apiKey!.rateLimit!.requests);
        res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
        res.setHeader('X-RateLimit-Reset', rateLimit.resetAt.toISOString());
        
        throw new AppError('Rate limit exceeded', 429);
      }

      // Add rate limit headers
      if (keyValidation.apiKey!.rateLimit) {
        res.setHeader('X-RateLimit-Limit', keyValidation.apiKey!.rateLimit.requests);
        res.setHeader('X-RateLimit-Remaining', rateLimit.remaining);
        res.setHeader('X-RateLimit-Reset', rateLimit.resetAt.toISOString());
      }

      // Attach validated data to request
      (req as any).apiKey = keyValidation.apiKey;
      (req as any).user = keyValidation.user;
      (req as any).signatureVerified = true;

      prometheusMetrics.authAttempts.inc({ status: 'success' });
      prometheusMetrics.functionDuration.observe(
        { name: 'request_signing_validation' },
        Date.now() - start
      );

      next();

    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      } else {
        logger.error('Request signing middleware error', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  };
}

/**
 * Middleware for critical endpoints only
 */
export const requireSignature = createRequestSigningMiddleware({
  required: true,
  allowUnsigned: false
});

/**
 * Middleware for optional signature validation
 */
export const optionalSignature = createRequestSigningMiddleware({
  required: false,
  allowUnsigned: true
});

/**
 * Helper to sign outgoing webhook requests
 */
export async function signWebhookRequest(
  url: string,
  payload: any,
  webhookSecret: string
): Promise<{
  headers: Record<string, string>;
  signature: string;
}> {
  const { signature, timestamp, header } = cryptoService.generateWebhookSignature(
    payload,
    webhookSecret
  );

  return {
    headers: {
      'X-Webhook-Signature': header,
      'X-Webhook-Timestamp': timestamp.toString(),
      'Content-Type': 'application/json'
    },
    signature
  };
}

/**
 * Express route decorator for signature requirement
 */
export function RequireSignature(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function(req: Request, res: Response, next: NextFunction) {
    // Check if signature was verified
    if (!(req as any).signatureVerified) {
      return res.status(401).json({
        success: false,
        error: 'Request signature required'
      });
    }

    return originalMethod.call(this, req, res, next);
  };

  return descriptor;
}

/**
 * Validate webhook signature middleware
 */
export function validateWebhookSignature(
  secretKey: string
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const signatureHeader = req.headers['x-webhook-signature'] as string;
      
      if (!signatureHeader) {
        throw new AppError('Missing webhook signature', 401);
      }

      // Get webhook secret
      const secret = process.env[secretKey] || '';
      
      if (!secret) {
        logger.error('Webhook secret not configured', { secretKey });
        throw new AppError('Webhook configuration error', 500);
      }

      // Verify signature
      const isValid = cryptoService.verifyWebhookSignature(
        req.body,
        signatureHeader,
        secret,
        300 // 5 minute window
      );

      if (!isValid) {
        prometheusMetrics.webhookValidationFailures.inc({ webhook: secretKey });
        throw new AppError('Invalid webhook signature', 401);
      }

      prometheusMetrics.webhookValidationSuccess.inc({ webhook: secretKey });
      next();

    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({
          success: false,
          error: error.message
        });
      } else {
        logger.error('Webhook validation error', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error'
        });
      }
    }
  };
}