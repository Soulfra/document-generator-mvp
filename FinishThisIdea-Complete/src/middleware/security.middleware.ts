/**
 * ENHANCED SECURITY MIDDLEWARE
 * 
 * Comprehensive security hardening with validation, CORS, secrets protection,
 * advanced rate limiting, and threat detection
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { presenceLogger } from '../monitoring/presence-logger';
import { AppError } from '../utils/errors';

// ============================================================================
// 🛡️ REQUEST VALIDATION SCHEMAS
// ============================================================================

export const commonSchemas = {
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),
  
  // Email validation
  email: z.string().email('Invalid email format').max(255),
  
  // Safe string (no XSS patterns)
  safeString: z.string().max(1000).refine(
    (str) => !/<script|javascript:|on\w+=/i.test(str),
    'Potentially unsafe content detected'
  ),
  
  // File upload validation
  fileName: z.string().max(255).refine(
    (name) => /^[a-zA-Z0-9._-]+$/.test(name),
    'Invalid file name format'
  ),
  
  // API key validation
  apiKey: z.string().min(20).max(100).refine(
    (key) => /^[a-zA-Z0-9_-]+$/.test(key),
    'Invalid API key format'
  ),
  
  // Pagination
  pagination: z.object({
    page: z.coerce.number().min(1).max(1000).default(1),
    limit: z.coerce.number().min(1).max(100).default(20)
  })
};

// ============================================================================
// 🚦 ADVANCED RATE LIMITING
// ============================================================================

// Different rate limits for different endpoints
export const rateLimitConfigs = {
  // Very strict for auth endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    message: {
      error: 'Too many authentication attempts',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
      // Use IP + User-Agent for more accurate tracking
      return `${req.ip}-${req.get('User-Agent')?.slice(0, 50) || 'unknown'}`;
    }
  }),

  // Strict for payment endpoints
  payment: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // 3 payment attempts per minute
    message: {
      error: 'Too many payment attempts',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Moderate for API endpoints
  api: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: {
      error: 'API rate limit exceeded',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Lenient for general use
  general: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    message: {
      error: 'Rate limit exceeded',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // Very strict for upload endpoints
  upload: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 uploads per minute
    message: {
      error: 'Upload rate limit exceeded',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false
  })
};

// ============================================================================
// 🐌 SLOW DOWN MIDDLEWARE (Progressive Delays)
// ============================================================================

export const slowDownConfigs = {
  api: slowDown({
    windowMs: 60 * 1000, // 1 minute
    delayAfter: 30, // Allow 30 requests per minute at full speed
    delayMs: 100, // Add 100ms delay per request after delayAfter
    maxDelayMs: 5000 // Maximum delay of 5 seconds
  })
};

// ============================================================================
// 🔍 THREAT DETECTION MIDDLEWARE
// ============================================================================

export function threatDetection() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const threats: string[] = [];
      
      // Check for SQL injection patterns
      const sqlPatterns = [
        /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
        /('|(\\')|(;)|(\*)|(%27)|(\%27)/i
      ];
      
      // Check for XSS patterns
      const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi
      ];
      
      // Check for command injection patterns
      const cmdPatterns = [
        /(\||;|&|`|\$\(|\$\{)/,
        /(nc|netcat|wget|curl|bash|sh|cmd|powershell)/i
      ];
      
      // Analyze request body, query, and headers
      const checkData = [
        JSON.stringify(req.body || {}),
        JSON.stringify(req.query || {}),
        req.get('User-Agent') || '',
        req.url
      ].join(' ');
      
      // Check for SQL injection
      if (sqlPatterns.some(pattern => pattern.test(checkData))) {
        threats.push('SQL_INJECTION');
      }
      
      // Check for XSS
      if (xssPatterns.some(pattern => pattern.test(checkData))) {
        threats.push('XSS_ATTEMPT');
      }
      
      // Check for command injection
      if (cmdPatterns.some(pattern => pattern.test(checkData))) {
        threats.push('COMMAND_INJECTION');
      }
      
      // Check for suspicious headers
      const suspiciousHeaders = [
        'x-forwarded-for',
        'x-real-ip',
        'x-cluster-client-ip'
      ];
      
      suspiciousHeaders.forEach(header => {
        const value = req.get(header);
        if (value && (value.includes('127.0.0.1') || value.includes('localhost'))) {
          threats.push('HEADER_MANIPULATION');
        }
      });
      
      // If threats detected, log and block
      if (threats.length > 0) {
        await presenceLogger.logUserPresence('security_threat_detected', {
          userId: 'anonymous',
          metadata: {
            threats,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            url: req.url,
            method: req.method,
            body: req.body,
            query: req.query
          }
        });
        
        logger.warn('Security threat detected', {
          threats,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          url: req.url,
          method: req.method
        });
        
        return res.status(403).json({
          error: 'Security violation detected',
          code: 'SECURITY_THREAT',
          threats: threats.length // Don't expose exact threats
        });
      }
      
      next();
      
    } catch (error) {
      logger.error('Threat detection middleware error', { error });
      next(); // Don't block request if threat detection fails
    }
  };
}

// ============================================================================
// 🔐 SECRETS PROTECTION MIDDLEWARE
// ============================================================================

export function secretsProtection() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Override JSON.stringify to prevent secrets from being logged
    const originalJson = res.json;
    res.json = function(obj: any) {
      if (obj && typeof obj === 'object') {
        obj = sanitizeSecrets(obj);
      }
      return originalJson.call(this, obj);
    };
    
    next();
  };
}

function sanitizeSecrets(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const secretKeys = [
    'password',
    'secret',
    'key',
    'token',
    'apiKey',
    'api_key',
    'accessToken',
    'refreshToken',
    'privateKey',
    'stripe',
    'anthropic',
    'openai'
  ];
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    const isSecret = secretKeys.some(secretKey => 
      key.toLowerCase().includes(secretKey.toLowerCase())
    );
    
    if (isSecret && typeof value === 'string') {
      // Show only first and last 4 characters
      (sanitized as any)[key] = value.length > 8 
        ? `${value.slice(0, 4)}****${value.slice(-4)}` 
        : '****';
    } else if (value && typeof value === 'object') {
      (sanitized as any)[key] = sanitizeSecrets(value);
    } else {
      (sanitized as any)[key] = value;
    }
  }
  
  return sanitized;
}

// ============================================================================
// 🔒 ENHANCED CORS CONFIGURATION
// ============================================================================

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000'
    ];
    
    // In production, be more restrictive
    if (process.env.NODE_ENV === 'production') {
      const prodDomain = process.env.DOMAIN;
      if (prodDomain) {
        allowedOrigins.push(`https://${prodDomain}`);
        allowedOrigins.push(`https://www.${prodDomain}`);
      }
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked origin', { origin, allowed: allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-ID',
    'X-API-Key',
    'Accept',
    'Origin'
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset'
  ],
  maxAge: 86400 // 24 hours
};

// ============================================================================
// 🛠️ VALIDATION MIDDLEWARE FACTORY
// ============================================================================

export function validateRequest(schema: {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.received
        }));
        
        logger.warn('Request validation failed', {
          url: req.url,
          method: req.method,
          errors: validationErrors
        });
        
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validationErrors
        });
      }
      
      next(error);
    }
  };
}

// ============================================================================
// 🔧 SECURITY HEADERS MIDDLEWARE
// ============================================================================

export function securityHeaders() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Don't send server information
    res.removeHeader('X-Powered-By');
    
    // Permissions policy (restrict dangerous features)
    res.setHeader('Permissions-Policy', 
      'camera=(), microphone=(), geolocation=(), payment=()');
    
    // Content Security Policy (for HTML responses)
    if (req.accepts('html')) {
      res.setHeader('Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'"
      );
    }
    
    next();
  };
}

// ============================================================================
// 📊 SECURITY MONITORING
// ============================================================================

export function securityMonitoring() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    // Monitor for suspicious patterns
    const suspiciousIndicators = [];
    
    // Check for rapid requests from same IP
    if (req.ip) {
      // This would integrate with a Redis-based tracking system
      // For now, just log the request
    }
    
    // Check for unusual request sizes
    const contentLength = parseInt(req.get('content-length') || '0');
    if (contentLength > 50 * 1024 * 1024) { // 50MB
      suspiciousIndicators.push('LARGE_PAYLOAD');
    }
    
    // Check for suspicious user agents
    const userAgent = req.get('User-Agent') || '';
    const suspiciousAgents = ['bot', 'crawler', 'spider', 'scraper'];
    if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
      suspiciousIndicators.push('SUSPICIOUS_USER_AGENT');
    }
    
    // Log security-relevant requests
    const securityEndpoints = ['/api/auth/', '/api/payment/', '/api/api-keys/', '/api/admin/'];
    const isSecurityEndpoint = securityEndpoints.some(endpoint => req.path.startsWith(endpoint));
    
    if (isSecurityEndpoint || suspiciousIndicators.length > 0) {
      await presenceLogger.logUserPresence('security_request', {
        userId: (req as any).user?.id || 'anonymous',
        metadata: {
          endpoint: req.path,
          method: req.method,
          ip: req.ip,
          userAgent,
          suspiciousIndicators,
          contentLength,
          headers: Object.fromEntries(
            Object.entries(req.headers).filter(([key]) => 
              !['authorization', 'cookie'].includes(key.toLowerCase())
            )
          )
        }
      });
    }
    
    // Continue with request
    next();
    
    // Log response (after request completes)
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      
      if (res.statusCode >= 400 || suspiciousIndicators.length > 0) {
        logger.warn('Security-relevant response', {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
          suspiciousIndicators,
          ip: req.ip
        });
      }
    });
  };
}