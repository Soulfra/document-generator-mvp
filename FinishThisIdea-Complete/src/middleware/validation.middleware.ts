import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import DOMPurify from 'isomorphic-dompurify';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

interface ValidationOptions {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
  headers?: Joi.ObjectSchema;
  sanitize?: boolean;
  stripUnknown?: boolean;
  allowUnknown?: boolean;
}

interface SanitizationOptions {
  html?: boolean;
  sql?: boolean;
  xss?: boolean;
  trim?: boolean;
  toLowerCase?: boolean;
}

/**
 * Common Joi schemas for reuse
 */
export const commonSchemas = {
  // Basic types
  uuid: Joi.string().uuid({ version: 'uuidv4' }),
  email: Joi.string().email().max(255),
  password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/),
  url: Joi.string().uri(),
  filename: Joi.string().max(255).pattern(/^[a-zA-Z0-9._-]+$/),
  
  // Numbers
  positiveInteger: Joi.number().integer().positive(),
  nonNegativeInteger: Joi.number().integer().min(0),
  percentage: Joi.number().min(0).max(100),
  
  // Strings with length limits
  shortText: Joi.string().max(255).trim(),
  mediumText: Joi.string().max(1000).trim(),
  longText: Joi.string().max(10000).trim(),
  
  // Platform-specific
  platformTokens: Joi.number().integer().min(0).max(1000000),
  trustTier: Joi.string().valid('seedling', 'sprout', 'sapling', 'tree', 'forest'),
  jobStatus: Joi.string().valid('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'),
  paymentStatus: Joi.string().valid('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'),
  
  // File validation
  fileUpload: Joi.object({
    filename: Joi.string().required(),
    mimetype: Joi.string().valid(
      'application/zip',
      'application/x-zip-compressed',
      'text/plain',
      'text/javascript',
      'text/typescript',
      'application/json'
    ),
    size: Joi.number().max(100 * 1024 * 1024) // 100MB max
  }),
  
  // Pagination
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().max(50),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),
  
  // Date ranges
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate'))
  })
};

/**
 * Sanitization functions
 */
export const sanitizers = {
  /**
   * Remove HTML tags and prevent XSS
   */
  sanitizeHTML: (input: string): string => {
    if (typeof input !== 'string') return input;
    return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  },

  /**
   * Escape SQL injection characters
   */
  sanitizeSQL: (input: string): string => {
    if (typeof input !== 'string') return input;
    return input.replace(/['";\\]/g, '\\$&');
  },

  /**
   * Remove potential script injection
   */
  sanitizeXSS: (input: string): string => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },

  /**
   * Trim whitespace
   */
  trim: (input: string): string => {
    if (typeof input !== 'string') return input;
    return input.trim();
  },

  /**
   * Convert to lowercase
   */
  toLowerCase: (input: string): string => {
    if (typeof input !== 'string') return input;
    return input.toLowerCase();
  },

  /**
   * Sanitize file path
   */
  sanitizeFilePath: (input: string): string => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/\.\./g, '') // Remove parent directory traversal
      .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
      .replace(/^\/+/, '') // Remove leading slashes
      .trim();
  },

  /**
   * Sanitize search query
   */
  sanitizeSearch: (input: string): string => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[^\w\s-_.]/g, '') // Only allow word chars, spaces, hyphens, underscores, dots
      .trim()
      .substring(0, 100); // Limit length
  }
};

/**
 * Apply sanitization to an object recursively
 */
function applySanitization(obj: any, options: SanitizationOptions): any {
  if (typeof obj === 'string') {
    let result = obj;
    
    if (options.trim) {
      result = sanitizers.trim(result);
    }
    
    if (options.toLowerCase) {
      result = sanitizers.toLowerCase(result);
    }
    
    if (options.html) {
      result = sanitizers.sanitizeHTML(result);
    }
    
    if (options.sql) {
      result = sanitizers.sanitizeSQL(result);
    }
    
    if (options.xss) {
      result = sanitizers.sanitizeXSS(result);
    }
    
    return result;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => applySanitization(item, options));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = applySanitization(value, options);
    }
    return sanitized;
  }
  
  return obj;
}

/**
 * Main validation middleware factory
 */
export function validate(options: ValidationOptions) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors: string[] = [];

      // Validate and sanitize body
      if (options.body) {
        const { error, value } = options.body.validate(req.body, {
          stripUnknown: options.stripUnknown ?? true,
          allowUnknown: options.allowUnknown ?? false,
          abortEarly: false
        });

        if (error) {
          errors.push(...error.details.map(detail => `Body: ${detail.message}`));
        } else {
          req.body = value;
        }
      }

      // Validate query parameters
      if (options.query) {
        const { error, value } = options.query.validate(req.query, {
          stripUnknown: options.stripUnknown ?? true,
          allowUnknown: options.allowUnknown ?? false,
          abortEarly: false
        });

        if (error) {
          errors.push(...error.details.map(detail => `Query: ${detail.message}`));
        } else {
          req.query = value;
        }
      }

      // Validate path parameters
      if (options.params) {
        const { error, value } = options.params.validate(req.params, {
          stripUnknown: options.stripUnknown ?? true,
          allowUnknown: options.allowUnknown ?? false,
          abortEarly: false
        });

        if (error) {
          errors.push(...error.details.map(detail => `Params: ${detail.message}`));
        } else {
          req.params = value;
        }
      }

      // Validate headers
      if (options.headers) {
        const { error, value } = options.headers.validate(req.headers, {
          stripUnknown: options.stripUnknown ?? true,
          allowUnknown: options.allowUnknown ?? true, // Allow unknown headers by default
          abortEarly: false
        });

        if (error) {
          errors.push(...error.details.map(detail => `Headers: ${detail.message}`));
        }
        // Don't modify req.headers as it can break Express
      }

      // Apply sanitization if enabled
      if (options.sanitize) {
        const sanitizationOptions: SanitizationOptions = {
          html: true,
          sql: true,
          xss: true,
          trim: true
        };

        req.body = applySanitization(req.body, sanitizationOptions);
        req.query = applySanitization(req.query, sanitizationOptions);
        req.params = applySanitization(req.params, sanitizationOptions);
      }

      // If there are validation errors, return them
      if (errors.length > 0) {
        logger.warn('Validation error', {
          path: req.path,
          method: req.method,
          errors,
          ip: req.ip
        });

        throw new ValidationError('Validation failed', errors);
      }

      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        next(error);
      } else {
        logger.error('Validation middleware error:', error);
        next(new ValidationError('Validation failed due to server error'));
      }
    }
  };
}

/**
 * Pre-built validation schemas for common endpoints
 */
export const validationSchemas = {
  // Authentication
  login: {
    body: Joi.object({
      email: commonSchemas.email.required(),
      password: Joi.string().required().max(128)
    })
  },

  register: {
    body: Joi.object({
      email: commonSchemas.email.required(),
      password: commonSchemas.password.required(),
      displayName: commonSchemas.shortText.optional(),
      referralCode: Joi.string().max(50).optional()
    })
  },

  // Job creation
  createJob: {
    body: Joi.object({
      type: Joi.string().valid('cleanup', 'documentation', 'analysis').required(),
      inputFileUrl: commonSchemas.url.required(),
      originalFileName: commonSchemas.filename.required(),
      fileSizeBytes: commonSchemas.positiveInteger.required(),
      fileCount: commonSchemas.nonNegativeInteger.optional(),
      contextProfileId: commonSchemas.uuid.optional(),
      metadata: Joi.object().optional()
    })
  },

  // Job queries
  getJobs: {
    query: Joi.object({
      ...commonSchemas.pagination,
      status: commonSchemas.jobStatus.optional(),
      type: Joi.string().max(50).optional(),
      userId: commonSchemas.uuid.optional()
    })
  },

  // Payment
  createPayment: {
    body: Joi.object({
      jobId: commonSchemas.uuid.required(),
      amount: commonSchemas.positiveInteger.required(),
      currency: Joi.string().valid('usd', 'eur', 'gbp').default('usd'),
      stripeCustomerId: Joi.string().max(255).optional()
    })
  },

  // File upload
  uploadFile: {
    body: Joi.object({
      filename: commonSchemas.filename.required(),
      contentType: Joi.string().max(100).required(),
      size: commonSchemas.positiveInteger.required()
    })
  },

  // Context profiles
  createProfile: {
    body: Joi.object({
      name: commonSchemas.shortText.required(),
      description: commonSchemas.mediumText.required(),
      language: Joi.string().max(50).optional(),
      framework: Joi.string().max(50).optional(),
      data: Joi.object().required(),
      isPublic: Joi.boolean().default(false)
    })
  },

  // User updates
  updateUser: {
    body: Joi.object({
      displayName: commonSchemas.shortText.optional(),
      email: commonSchemas.email.optional(),
      metadata: Joi.object().optional()
    })
  },

  // Viral/Treasury
  createShowcase: {
    body: Joi.object({
      title: commonSchemas.shortText.required(),
      description: commonSchemas.mediumText.required(),
      beforeCode: commonSchemas.longText.required(),
      afterCode: commonSchemas.longText.required(),
      improvements: Joi.array().items(Joi.string().max(500)).required(),
      technologies: Joi.array().items(Joi.string().max(50)).required(),
      isPublic: Joi.boolean().default(true)
    })
  },

  // Agent creation
  createAgent: {
    body: Joi.object({
      templateId: commonSchemas.uuid.required(),
      customName: commonSchemas.shortText.required(),
      specializations: Joi.array().items(Joi.string().max(100)).required(),
      isPublic: Joi.boolean().default(false)
    })
  },

  // Common path parameters
  uuidParam: {
    params: Joi.object({
      id: commonSchemas.uuid.required()
    })
  },

  slugParam: {
    params: Joi.object({
      slug: Joi.string().max(100).pattern(/^[a-z0-9-]+$/).required()
    })
  }
};

/**
 * Convenience functions for common validations
 */
export const validators = {
  // Quick validators
  validateUUID: validate({ params: validationSchemas.uuidParam.params }),
  validateSlug: validate({ params: validationSchemas.slugParam.params }),
  validatePagination: validate({ query: commonSchemas.pagination }),
  
  // Auth validators
  validateLogin: validate({ ...validationSchemas.login, sanitize: true }),
  validateRegister: validate({ ...validationSchemas.register, sanitize: true }),
  
  // Job validators
  validateCreateJob: validate({ ...validationSchemas.createJob, sanitize: true }),
  validateGetJobs: validate({ ...validationSchemas.getJobs }),
  
  // Payment validators
  validateCreatePayment: validate({ ...validationSchemas.createPayment }),
  
  // File validators
  validateUploadFile: validate({ ...validationSchemas.uploadFile, sanitize: true }),
  
  // User validators
  validateUpdateUser: validate({ ...validationSchemas.updateUser, sanitize: true }),
  
  // Viral validators
  validateCreateShowcase: validate({ ...validationSchemas.createShowcase, sanitize: true }),
  validateCreateAgent: validate({ ...validationSchemas.createAgent, sanitize: true })
};

/**
 * Custom validation middleware for specific security checks
 */
export function securityValidation() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check for common attack patterns
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
      /eval\(/i,
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i,
      /update\s+.*set/i,
      /\.\.\/\.\.\//,  // Directory traversal
      /\/etc\/passwd/,
      /\/proc\/self/
    ];

    const checkForSuspiciousContent = (obj: any, path = ''): boolean => {
      if (typeof obj === 'string') {
        return suspiciousPatterns.some(pattern => pattern.test(obj));
      }
      
      if (Array.isArray(obj)) {
        return obj.some((item, index) => 
          checkForSuspiciousContent(item, `${path}[${index}]`)
        );
      }
      
      if (obj && typeof obj === 'object') {
        return Object.entries(obj).some(([key, value]) =>
          checkForSuspiciousContent(value, path ? `${path}.${key}` : key)
        );
      }
      
      return false;
    };

    // Check all request data
    const requests = [
      { data: req.body, type: 'body' },
      { data: req.query, type: 'query' },
      { data: req.params, type: 'params' }
    ];

    for (const { data, type } of requests) {
      if (checkForSuspiciousContent(data)) {
        logger.warn(`Suspicious content detected in ${type}`, {
          path: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          data: JSON.stringify(data)
        });

        return res.status(400).json({
          success: false,
          error: 'Request contains potentially malicious content'
        });
      }
    }

    next();
  };
}

export default validate;