/**
 * Enhanced Security Middleware
 * Consolidates patterns from soulfra-agentzero and existing implementations
 * Provides enterprise-grade security protection
 */

import { Request, Response, NextFunction, Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { logger } from '../utils/logger';
import { prometheusMetrics } from '../services/monitoring/prometheus-metrics.service';
import { csrfService } from '../services/security/csrf.service';
import { inputValidationService } from '../services/security/input-validation.service';
import { sessionService } from '../services/security/session.service';

export interface SecurityConfig {
  enableCORS: boolean;
  enableRateLimit: boolean;
  enableCSRF: boolean;
  enableInputValidation: boolean;
  enableAttackPrevention: boolean;
  enableAPIVersioning: boolean;
  trustedOrigins: string[];
  rateLimitOptions: {
    windowMs: number;
    max: number;
    skipSuccessfulRequests: boolean;
  };
}

const defaultConfig: SecurityConfig = {
  enableCORS: true,
  enableRateLimit: true,
  enableCSRF: true,
  enableInputValidation: true,
  enableAttackPrevention: true,
  enableAPIVersioning: true,
  trustedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    /^https:\/\/[a-z0-9-]+\.finishthisidea\.com$/,
    /^https:\/\/finishthisidea\.com$/,
    /^http:\/\/localhost:\d+$/ // Development
  ],
  rateLimitOptions: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
    skipSuccessfulRequests: false
  }
};

export class SecurityMiddleware {
  private static instance: SecurityMiddleware;
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  public static getInstance(config?: Partial<SecurityConfig>): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware(config);
    }
    return SecurityMiddleware.instance;
  }

  /**
   * Configure CORS with domain validation
   */
  public getCORSMiddleware() {
    if (!this.config.enableCORS) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    return cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        const isAllowed = this.config.trustedOrigins.some(trusted => {
          if (typeof trusted === 'string') {
            return origin === trusted;
          }
          if (trusted instanceof RegExp) {
            return trusted.test(origin);
          }
          return false;
        });

        if (isAllowed) {
          callback(null, true);
        } else {
          logger.warn('CORS request blocked', { origin, ip: origin });
          prometheusMetrics.functionErrors.inc({ name: 'cors_blocked' });
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-API-Key',
        'X-CSRF-Token',
        'X-Requested-With',
        'X-Request-ID'
      ],
      exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'X-API-Version',
        'X-Request-ID'
      ],
      maxAge: 86400 // 24 hours
    });
  }

  /**
   * Configure security headers with Helmet
   */
  public getSecurityHeaders() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'", // For development - remove in production
            "'unsafe-eval'", // For development - remove in production
            "https://js.stripe.com",
            "https://checkout.stripe.com"
          ],
          imgSrc: [
            "'self'",
            "data:",
            "https:",
            "https://*.stripe.com",
            "https://*.amazonaws.com"
          ],
          connectSrc: [
            "'self'",
            "https://api.stripe.com",
            "https://checkout.stripe.com",
            "https://*.finishthisidea.com",
            "wss://*.finishthisidea.com"
          ],
          fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'", "https://js.stripe.com"],
          childSrc: ["'none'"],
          workerSrc: ["'self'"],
          manifestSrc: ["'self'"]
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
      },
      crossOriginEmbedderPolicy: false, // Disable for now to avoid breaking functionality
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    });
  }

  /**
   * Advanced rate limiting with tier-based limits
   */
  public getRateLimitMiddleware() {
    if (!this.config.enableRateLimit) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    return rateLimit({
      windowMs: this.config.rateLimitOptions.windowMs,
      max: (req: Request) => {
        // Tier-based rate limiting
        const userTier = (req as any).user?.tier || 'seedling';
        const tierLimits = {
          seedling: 50,
          sprout: 100,
          sapling: 200,
          tree: 500,
          forest: 1000
        };
        return tierLimits[userTier as keyof typeof tierLimits] || this.config.rateLimitOptions.max;
      },
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later'
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: this.config.rateLimitOptions.skipSuccessfulRequests,
      skip: (req: Request) => {
        // Skip rate limiting for health checks and metrics
        return ['/health', '/metrics', '/api/health', '/api/metrics'].includes(req.path);
      },
      keyGenerator: (req: Request) => {
        // Use user ID if authenticated, otherwise IP
        return (req as any).user?.id || req.ip;
      },
      handler: (req: Request, res: Response) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          method: req.method,
          userAgent: req.get('user-agent'),
          userId: (req as any).user?.id
        });

        prometheusMetrics.functionErrors.inc({ name: 'rate_limit_exceeded' });

        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests, please try again later'
          }
        });
      }
    });
  }

  /**
   * Request slowdown middleware (before rate limiting kicks in)
   */
  public getSlowDownMiddleware() {
    return slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 20, // allow 20 requests per windowMs without delay
      delayMs: 100, // add 100ms delay per request after delayAfter
      maxDelayMs: 2000, // maximum delay of 2 seconds
      skipSuccessfulRequests: true
    });
  }

  /**
   * Request sanitization and attack prevention
   */
  public getAttackPreventionMiddleware() {
    if (!this.config.enableAttackPrevention) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();

      try {
        // Prevent prototype pollution
        if (req.body && req.body.__proto__) {
          logger.warn('Prototype pollution attempt', {
            ip: req.ip,
            path: req.path,
            userAgent: req.get('user-agent')
          });

          prometheusMetrics.functionErrors.inc({ name: 'prototype_pollution_blocked' });

          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_REQUEST',
              message: 'Invalid request structure'
            }
          });
        }

        // Prevent large payloads
        const contentLength = parseInt(req.get('content-length') || '0');
        const maxSize = 50 * 1024 * 1024; // 50MB

        if (contentLength > maxSize) {
          logger.warn('Large payload rejected', {
            ip: req.ip,
            path: req.path,
            contentLength
          });

          prometheusMetrics.functionErrors.inc({ name: 'large_payload_blocked' });

          return res.status(413).json({
            success: false,
            error: {
              code: 'PAYLOAD_TOO_LARGE',
              message: 'Request entity too large'
            }
          });
        }

        // Remove null bytes from request
        const sanitize = (obj: any): any => {
          if (typeof obj === 'string') {
            return obj.replace(/\0/g, '');
          }
          if (typeof obj === 'object' && obj !== null) {
            const sanitized = Array.isArray(obj) ? [] : {};
            for (const key in obj) {
              if (obj.hasOwnProperty(key)) {
                sanitized[key] = sanitize(obj[key]);
              }
            }
            return sanitized;
          }
          return obj;
        };

        req.body = sanitize(req.body);
        req.query = sanitize(req.query);
        req.params = sanitize(req.params);

        // Check for suspicious patterns using our input validation service
        const requestData = JSON.stringify({
          body: req.body,
          query: req.query,
          params: req.params
        });

        // Use our enhanced input validation service for threat detection
        if (this.config.enableInputValidation) {
          const validation = inputValidationService.validateInput(requestData);
          if (!validation.isValid && validation.threats.length > 0) {
            logger.warn('Suspicious request patterns detected', {
              ip: req.ip,
              path: req.path,
              method: req.method,
              threats: validation.threats,
              userAgent: req.get('user-agent')
            });

            prometheusMetrics.functionErrors.inc({ name: 'suspicious_pattern_blocked' });

            return res.status(400).json({
              success: false,
              error: {
                code: 'INVALID_REQUEST',
                message: 'Request contains potentially harmful content'
              }
            });
          }
        }

        prometheusMetrics.functionDuration.observe(
          { name: 'attack_prevention_middleware' },
          Date.now() - start
        );

        next();

      } catch (error) {
        logger.error('Attack prevention middleware error', error);
        prometheusMetrics.functionErrors.inc({ name: 'attack_prevention_error' });
        next();
      }
    };
  }

  /**
   * API versioning middleware
   */
  public getAPIVersioningMiddleware() {
    if (!this.config.enableAPIVersioning) {
      return (req: Request, res: Response, next: NextFunction) => next();
    }

    return (req: Request, res: Response, next: NextFunction) => {
      const version = req.headers['api-version'] || 
                     req.headers['x-api-version'] || 
                     process.env.API_VERSION || 
                     'v1';

      (req as any).apiVersion = version;
      res.setHeader('X-API-Version', version);
      next();
    };
  }

  /**
   * Request ID tracking middleware
   */
  public getRequestTrackingMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const requestId = req.headers['x-request-id'] || 
                       req.headers['x-correlation-id'] || 
                       `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      (req as any).requestId = requestId;
      res.setHeader('X-Request-ID', requestId);
      next();
    };
  }

  /**
   * Apply all security middleware to Express app
   */
  public applySecurityMiddleware(app: Express): void {
    logger.info('Applying enhanced security middleware stack');

    // 1. Request tracking (first to ensure all requests have IDs)
    app.use(this.getRequestTrackingMiddleware());

    // 2. Security headers
    app.use(this.getSecurityHeaders());

    // 3. CORS
    app.use(this.getCORSMiddleware());

    // 4. Request sanitization and attack prevention
    app.use(this.getAttackPreventionMiddleware());

    // 5. API versioning
    app.use(this.getAPIVersioningMiddleware());

    // 6. Session validation (if using sessions)
    app.use(sessionService.validationMiddleware());

    // 7. Slow down (warning before rate limiting)
    app.use(this.getSlowDownMiddleware());

    // 8. Rate limiting
    app.use(this.getRateLimitMiddleware());

    // 9. CSRF protection for state-changing operations
    if (this.config.enableCSRF) {
      app.use('/api/csrf/token', (req, res) => csrfService.generateTokenHandler(req, res));
      app.use(csrfService.middleware());
    }

    // 10. Enhanced input validation for all routes
    if (this.config.enableInputValidation) {
      app.use(inputValidationService.middleware({
        validateBody: true,
        validateQuery: true,
        validateParams: true
      }));
    }

    logger.info('Enhanced security middleware stack applied successfully', {
      cors: this.config.enableCORS,
      rateLimit: this.config.enableRateLimit,
      csrf: this.config.enableCSRF,
      inputValidation: this.config.enableInputValidation,
      attackPrevention: this.config.enableAttackPrevention,
      apiVersioning: this.config.enableAPIVersioning
    });
  }

  /**
   * Create endpoint-specific rate limiters
   */
  public createEndpointLimiters() {
    return {
      // Strict limits for sensitive endpoints
      auth: rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5, // 5 attempts per window
        message: {
          success: false,
          error: {
            code: 'AUTH_RATE_LIMIT',
            message: 'Too many authentication attempts'
          }
        }
      }),

      // Moderate limits for API operations
      api: rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 60, // 60 requests per minute
        message: {
          success: false,
          error: {
            code: 'API_RATE_LIMIT',
            message: 'API rate limit exceeded'
          }
        }
      }),

      // Tight limits for expensive operations
      upload: rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // 10 uploads per hour
        message: {
          success: false,
          error: {
            code: 'UPLOAD_RATE_LIMIT',
            message: 'Upload rate limit exceeded'
          }
        }
      }),

      // Very strict limits for payment operations
      payment: rateLimit({
        windowMs: 60 * 1000, // 1 minute
        max: 3, // 3 payment attempts per minute
        message: {
          success: false,
          error: {
            code: 'PAYMENT_RATE_LIMIT',
            message: 'Payment rate limit exceeded'
          }
        }
      })
    };
  }
}

// Export singleton instance
export const securityMiddleware = SecurityMiddleware.getInstance();