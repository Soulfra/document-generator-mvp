/**
 * Enhanced Input Validation Service
 * Provides comprehensive input sanitization, XSS prevention, and SQL injection detection
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';
import { prometheusMetrics } from '../monitoring/prometheus-metrics.service';

// Initialize DOMPurify with JSDOM for server-side use
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

export interface ValidationConfig {
  enableXSSProtection: boolean;
  enableSQLInjectionDetection: boolean;
  enableFilePathTraversal: boolean;
  enableNoScriptTags: boolean;
  maxStringLength: number;
  allowedTags: string[];
  allowedAttributes: string[];
}

const defaultConfig: ValidationConfig = {
  enableXSSProtection: true,
  enableSQLInjectionDetection: true,
  enableFilePathTraversal: true,
  enableNoScriptTags: true,
  maxStringLength: 10000,
  allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
  allowedAttributes: ['href', 'title', 'target']
};

export class InputValidationService {
  private static instance: InputValidationService;
  private config: ValidationConfig;

  // SQL injection patterns
  private sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b)/gi,
    /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi, // OR
    /((\%27)|(\'))((\%73)|s|(\%53))((\%65)|e|(\%45))((\%6C)|l|(\%4C))((\%65)|e|(\%45))((\%63)|c|(\%43))((\%74)|t|(\%54))/gi, // SELECT
    /((\%3D)|(=))[^\n]*((\%27)|(\')|((\%3C)|<)|((\%3E)|>))/gi,
    /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/gi,
    /((\%27)|(\'))union/gi,
    /exec(\s|\+)+(s|x)p\w+/gi,
    /UNION.*SELECT/gi,
    /1=1|1=1|'='|''=''/gi
  ];

  // Path traversal patterns
  private pathTraversalPatterns = [
    /\.\.\//gi,
    /\.\.\\g/gi,
    /%2e%2e%2f/gi,
    /%2e%2e%5c/gi,
    /\.\.%2f/gi,
    /\.\.%5c/gi
  ];

  // XSS patterns
  private xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<form/gi,
    /vbscript:/gi,
    /data:text\/html/gi
  ];

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  public static getInstance(config?: Partial<ValidationConfig>): InputValidationService {
    if (!InputValidationService.instance) {
      InputValidationService.instance = new InputValidationService(config);
    }
    return InputValidationService.instance;
  }

  /**
   * Sanitize HTML content to prevent XSS
   */
  public sanitizeHTML(input: string): string {
    const start = Date.now();
    
    try {
      const sanitized = purify.sanitize(input, {
        ALLOWED_TAGS: this.config.allowedTags,
        ALLOWED_ATTR: this.config.allowedAttributes,
        ALLOW_DATA_ATTR: false,
        ALLOW_UNKNOWN_PROTOCOLS: false,
        RETURN_DOM: false,
        RETURN_DOM_FRAGMENT: false,
        SANITIZE_DOM: true
      });

      prometheusMetrics.functionDuration.observe(
        { name: 'input_sanitize_html' },
        Date.now() - start
      );

      return sanitized;
    } catch (error) {
      logger.error('HTML sanitization error', error);
      prometheusMetrics.functionErrors.inc({ name: 'input_sanitize_html_error' });
      return '';
    }
  }

  /**
   * Detect SQL injection attempts
   */
  public detectSQLInjection(input: string): boolean {
    if (!this.config.enableSQLInjectionDetection) return false;

    const start = Date.now();
    
    try {
      const detected = this.sqlInjectionPatterns.some(pattern => pattern.test(input));
      
      if (detected) {
        logger.warn('SQL injection attempt detected', { input: input.substring(0, 100) });
        prometheusMetrics.functionErrors.inc({ name: 'sql_injection_detected' });
      }

      prometheusMetrics.functionDuration.observe(
        { name: 'input_sql_injection_check' },
        Date.now() - start
      );

      return detected;
    } catch (error) {
      logger.error('SQL injection detection error', error);
      prometheusMetrics.functionErrors.inc({ name: 'sql_injection_check_error' });
      return false;
    }
  }

  /**
   * Detect path traversal attempts
   */
  public detectPathTraversal(input: string): boolean {
    if (!this.config.enableFilePathTraversal) return false;

    const start = Date.now();
    
    try {
      const detected = this.pathTraversalPatterns.some(pattern => pattern.test(input));
      
      if (detected) {
        logger.warn('Path traversal attempt detected', { input: input.substring(0, 100) });
        prometheusMetrics.functionErrors.inc({ name: 'path_traversal_detected' });
      }

      prometheusMetrics.functionDuration.observe(
        { name: 'input_path_traversal_check' },
        Date.now() - start
      );

      return detected;
    } catch (error) {
      logger.error('Path traversal detection error', error);
      prometheusMetrics.functionErrors.inc({ name: 'path_traversal_check_error' });
      return false;
    }
  }

  /**
   * Detect XSS attempts
   */
  public detectXSS(input: string): boolean {
    if (!this.config.enableXSSProtection) return false;

    const start = Date.now();
    
    try {
      const detected = this.xssPatterns.some(pattern => pattern.test(input));
      
      if (detected) {
        logger.warn('XSS attempt detected', { input: input.substring(0, 100) });
        prometheusMetrics.functionErrors.inc({ name: 'xss_detected' });
      }

      prometheusMetrics.functionDuration.observe(
        { name: 'input_xss_check' },
        Date.now() - start
      );

      return detected;
    } catch (error) {
      logger.error('XSS detection error', error);
      prometheusMetrics.functionErrors.inc({ name: 'xss_check_error' });
      return false;
    }
  }

  /**
   * Comprehensive input validation
   */
  public validateInput(input: any, type: 'string' | 'number' | 'email' | 'url' | 'html' = 'string'): {
    isValid: boolean;
    sanitized: any;
    threats: string[];
  } {
    const threats: string[] = [];
    let sanitized = input;
    let isValid = true;

    if (typeof input === 'string') {
      // Length check
      if (input.length > this.config.maxStringLength) {
        threats.push('INPUT_TOO_LONG');
        isValid = false;
      }

      // Threat detection
      if (this.detectSQLInjection(input)) {
        threats.push('SQL_INJECTION');
        isValid = false;
      }

      if (this.detectPathTraversal(input)) {
        threats.push('PATH_TRAVERSAL');
        isValid = false;
      }

      if (this.detectXSS(input)) {
        threats.push('XSS_ATTEMPT');
        isValid = false;
      }

      // Type-specific validation and sanitization
      switch (type) {
        case 'html':
          sanitized = this.sanitizeHTML(input);
          break;
        case 'email':
          sanitized = input.toLowerCase().trim();
          isValid = isValid && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized);
          break;
        case 'url':
          try {
            new URL(input);
            sanitized = input.trim();
          } catch {
            isValid = false;
            threats.push('INVALID_URL');
          }
          break;
        case 'number':
          const num = Number(input);
          isValid = isValid && !isNaN(num) && isFinite(num);
          sanitized = isValid ? num : null;
          break;
        default:
          // Basic string sanitization
          sanitized = input.trim();
      }
    }

    return { isValid, sanitized, threats };
  }

  /**
   * Express middleware for input validation
   */
  public middleware(options: {
    validateBody?: boolean;
    validateQuery?: boolean;
    validateParams?: boolean;
    allowedFields?: string[];
    requiredFields?: string[];
  } = {}) {
    const {
      validateBody = true,
      validateQuery = true,
      validateParams = true,
      allowedFields = [],
      requiredFields = []
    } = options;

    return (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      const threats: string[] = [];
      let hasInvalidInput = false;

      try {
        // Validate request body
        if (validateBody && req.body) {
          const result = this.validateObject(req.body, allowedFields, requiredFields);
          if (!result.isValid) {
            hasInvalidInput = true;
            threats.push(...result.threats);
          } else {
            req.body = result.sanitized;
          }
        }

        // Validate query parameters
        if (validateQuery && req.query) {
          const result = this.validateObject(req.query, allowedFields);
          if (!result.isValid) {
            hasInvalidInput = true;
            threats.push(...result.threats);
          } else {
            req.query = result.sanitized;
          }
        }

        // Validate URL parameters
        if (validateParams && req.params) {
          const result = this.validateObject(req.params);
          if (!result.isValid) {
            hasInvalidInput = true;
            threats.push(...result.threats);
          } else {
            req.params = result.sanitized;
          }
        }

        if (hasInvalidInput) {
          logger.warn('Input validation failed', {
            method: req.method,
            path: req.path,
            ip: req.ip,
            threats,
            userAgent: req.get('user-agent')
          });

          prometheusMetrics.functionErrors.inc({ name: 'input_validation_failed' });

          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: 'Input validation failed',
              threats: process.env.NODE_ENV === 'development' ? threats : undefined
            }
          });
        }

        prometheusMetrics.functionDuration.observe(
          { name: 'input_validation_middleware' },
          Date.now() - start
        );

        next();

      } catch (error) {
        logger.error('Input validation middleware error', error);
        prometheusMetrics.functionErrors.inc({ name: 'input_validation_middleware_error' });

        res.status(500).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Input validation error'
          }
        });
      }
    };
  }

  /**
   * Validate object fields
   */
  private validateObject(obj: any, allowedFields: string[] = [], requiredFields: string[] = []): {
    isValid: boolean;
    sanitized: any;
    threats: string[];
  } {
    const threats: string[] = [];
    const sanitized: any = {};
    let isValid = true;

    // Check required fields
    for (const field of requiredFields) {
      if (!obj.hasOwnProperty(field) || obj[field] === undefined || obj[field] === null) {
        threats.push(`MISSING_REQUIRED_FIELD_${field.toUpperCase()}`);
        isValid = false;
      }
    }

    // Validate each field
    for (const [key, value] of Object.entries(obj)) {
      // Check if field is allowed
      if (allowedFields.length > 0 && !allowedFields.includes(key)) {
        threats.push(`UNEXPECTED_FIELD_${key.toUpperCase()}`);
        continue;
      }

      if (typeof value === 'string') {
        const result = this.validateInput(value);
        if (!result.isValid) {
          threats.push(...result.threats.map(t => `${key.toUpperCase()}_${t}`));
          isValid = false;
        } else {
          sanitized[key] = result.sanitized;
        }
      } else {
        sanitized[key] = value;
      }
    }

    return { isValid, sanitized, threats };
  }

  /**
   * Create Joi schema with security validation
   */
  public createSecureSchema(schema: Joi.ObjectSchema): Joi.ObjectSchema {
    return schema.custom((value, helpers) => {
      if (typeof value === 'object' && value !== null) {
        const result = this.validateObject(value);
        if (!result.isValid) {
          return helpers.error('any.invalid', { threats: result.threats });
        }
        return result.sanitized;
      }
      return value;
    });
  }
}

// Export singleton instance
export const inputValidationService = InputValidationService.getInstance();