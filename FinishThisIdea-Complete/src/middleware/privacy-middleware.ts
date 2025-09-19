import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import fetch from 'node-fetch';

export interface PrivacyMiddlewareOptions {
  enabled?: boolean;
  skipPaths?: string[];
  sensitivityLevel?: 'low' | 'medium' | 'high' | 'strict';
  autoSanitize?: boolean;
  blockOnCritical?: boolean;
  requireApprovalForHigh?: boolean;
}

export interface PrivacyContext {
  scanResult?: any;
  sanitized: boolean;
  privacyApproved: boolean;
  riskScore: number;
  canProceed: boolean;
  userId?: string;
  sessionId?: string;
}

declare global {
  namespace Express {
    interface Request {
      privacy?: PrivacyContext;
    }
  }
}

export class PrivacyMiddleware {
  private privacyScannerUrl: string;
  private options: Required<PrivacyMiddlewareOptions>;

  constructor(options: PrivacyMiddlewareOptions = {}) {
    this.privacyScannerUrl = process.env.PRIVACY_SCANNER_URL || 'http://privacy-scanner:3004';
    this.options = {
      enabled: options.enabled !== false,
      skipPaths: options.skipPaths || ['/health', '/metrics', '/favicon.ico'],
      sensitivityLevel: options.sensitivityLevel || 'high',
      autoSanitize: options.autoSanitize !== false,
      blockOnCritical: options.blockOnCritical !== false,
      requireApprovalForHigh: options.requireApprovalForHigh !== false
    };
  }

  /**
   * Express middleware for privacy scanning
   */
  scanMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Skip if disabled or path is in skip list
      if (!this.options.enabled || this.shouldSkipPath(req.path)) {
        return next();
      }

      try {
        // Extract content to scan from request
        const contentToScan = this.extractContentFromRequest(req);
        
        if (!contentToScan) {
          // No content to scan, proceed
          return next();
        }

        // Perform privacy scan
        const scanResult = await this.performPrivacyScan(contentToScan, {
          userId: req.headers['x-user-id'] as string,
          sessionId: req.headers['x-session-id'] as string,
          endpoint: req.path,
          method: req.method
        });

        // Initialize privacy context
        req.privacy = {
          scanResult,
          sanitized: false,
          privacyApproved: req.headers['x-privacy-approved'] === 'true',
          riskScore: scanResult.riskScore || 0,
          canProceed: scanResult.canProceed?.approved || false,
          userId: req.headers['x-user-id'] as string,
          sessionId: req.headers['x-session-id'] as string
        };

        // Handle privacy issues based on severity
        const maxSeverity = scanResult.maxSeverity;
        const issuesFound = scanResult.issuesFound || 0;

        if (issuesFound > 0) {
          logger.info('Privacy issues detected in request', {
            path: req.path,
            method: req.method,
            userId: req.privacy.userId,
            issuesFound,
            severity: maxSeverity,
            riskScore: req.privacy.riskScore
          });

          // Block critical issues immediately
          if (maxSeverity === 'critical' && this.options.blockOnCritical) {
            return this.sendPrivacyError(res, {
              error: 'Critical privacy issues detected',
              details: scanResult,
              blocked: true
            }, 403);
          }

          // Require approval for high severity issues
          if (maxSeverity === 'high' && this.options.requireApprovalForHigh && !req.privacy.privacyApproved) {
            return this.sendPrivacyError(res, {
              error: 'High severity privacy issues require approval',
              details: scanResult,
              requiresApproval: true,
              canContinueWithApproval: true
            }, 400);
          }

          // Auto-sanitize medium/low issues if enabled
          if (this.options.autoSanitize && (maxSeverity === 'medium' || maxSeverity === 'low')) {
            try {
              const sanitizationResult = await this.sanitizeContent(contentToScan, {
                userId: req.privacy.userId,
                sessionId: req.privacy.sessionId
              });

              if (sanitizationResult.applied) {
                // Replace request body/content with sanitized version
                this.applySanitizedContent(req, sanitizationResult.sanitizedContent);
                req.privacy.sanitized = true;
                
                logger.info('Content automatically sanitized', {
                  path: req.path,
                  userId: req.privacy.userId,
                  changesApplied: sanitizationResult.changes?.length || 0
                });
              }
            } catch (sanitizationError) {
              logger.error('Auto-sanitization failed', { error: sanitizationError.message });
            }
          }
        }

        next();

      } catch (error) {
        logger.error('Privacy middleware error', { 
          error: error.message,
          path: req.path,
          method: req.method
        });

        // In case of privacy service failure, decide whether to proceed
        if (this.options.sensitivityLevel === 'strict') {
          return this.sendPrivacyError(res, {
            error: 'Privacy scanning service unavailable',
            details: { message: 'Cannot verify privacy compliance' }
          }, 503);
        }

        // For non-strict mode, log and continue
        logger.warn('Continuing without privacy scan due to service failure');
        req.privacy = {
          sanitized: false,
          privacyApproved: false,
          riskScore: 0,
          canProceed: true,
          userId: req.headers['x-user-id'] as string,
          sessionId: req.headers['x-session-id'] as string
        };
        
        next();
      }
    };
  }

  /**
   * Express middleware for adding privacy headers to responses
   */
  responseMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.privacy) {
        // Add privacy headers to response
        res.setHeader('X-Privacy-Protected', 'true');
        res.setHeader('X-Privacy-Sanitized', req.privacy.sanitized.toString());
        res.setHeader('X-Privacy-Risk-Score', req.privacy.riskScore.toString());
        
        if (req.privacy.scanResult) {
          res.setHeader('X-Privacy-Issues-Found', req.privacy.scanResult.issuesFound.toString());
          res.setHeader('X-Privacy-Max-Severity', req.privacy.scanResult.maxSeverity || 'none');
        }
      }
      
      next();
    };
  }

  /**
   * Static method for quick privacy scanning in services
   */
  static async quickScan(content: string, options: {
    userId?: string;
    sessionId?: string;
    sensitivityLevel?: string;
  } = {}): Promise<any> {
    const privacyScannerUrl = process.env.PRIVACY_SCANNER_URL || 'http://privacy-scanner:3004';
    
    try {
      const response = await fetch(`${privacyScannerUrl}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': options.userId || 'anonymous',
          'X-Session-Id': options.sessionId || 'unknown'
        },
        body: JSON.stringify({
          content,
          options
        })
      });

      if (!response.ok) {
        throw new Error(`Privacy scan failed: ${response.status}`);
      }

      const result = await response.json();
      return result.result;
    } catch (error) {
      logger.error('Quick privacy scan failed', { error: error.message });
      return null;
    }
  }

  /**
   * Static method for content sanitization
   */
  static async quickSanitize(content: string, options: {
    userId?: string;
    sessionId?: string;
    confidenceThreshold?: number;
  } = {}): Promise<string> {
    const privacyScannerUrl = process.env.PRIVACY_SCANNER_URL || 'http://privacy-scanner:3004';
    
    try {
      const response = await fetch(`${privacyScannerUrl}/api/sanitize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': options.userId || 'anonymous',
          'X-Session-Id': options.sessionId || 'unknown'
        },
        body: JSON.stringify({
          content,
          options
        })
      });

      if (!response.ok) {
        throw new Error(`Content sanitization failed: ${response.status}`);
      }

      const result = await response.json();
      return result.result.sanitizedContent;
    } catch (error) {
      logger.error('Quick content sanitization failed', { error: error.message });
      return content; // Return original content if sanitization fails
    }
  }

  private shouldSkipPath(path: string): boolean {
    return this.options.skipPaths.some(skipPath => 
      path.startsWith(skipPath) || path.includes(skipPath)
    );
  }

  private extractContentFromRequest(req: Request): string | null {
    let content = '';

    // Extract from body
    if (req.body) {
      if (typeof req.body === 'string') {
        content += req.body;
      } else if (typeof req.body === 'object') {
        content += JSON.stringify(req.body);
      }
    }

    // Extract from query parameters
    if (req.query && Object.keys(req.query).length > 0) {
      content += ' ' + JSON.stringify(req.query);
    }

    // Extract from specific headers that might contain user content
    const contentHeaders = ['x-content', 'x-user-data', 'x-document-content'];
    contentHeaders.forEach(header => {
      const headerValue = req.headers[header];
      if (headerValue) {
        content += ' ' + headerValue;
      }
    });

    return content.trim() || null;
  }

  private async performPrivacyScan(content: string, context: {
    userId?: string;
    sessionId?: string;
    endpoint: string;
    method: string;
  }): Promise<any> {
    const response = await fetch(`${this.privacyScannerUrl}/api/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': context.userId || 'anonymous',
        'X-Session-Id': context.sessionId || 'unknown'
      },
      body: JSON.stringify({
        content,
        options: {
          endpoint: context.endpoint,
          method: context.method,
          sensitivityLevel: this.options.sensitivityLevel,
          userId: context.userId,
          sessionId: context.sessionId
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Privacy scanning failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.result;
  }

  private async sanitizeContent(content: string, context: {
    userId?: string;
    sessionId?: string;
  }): Promise<{
    sanitizedContent: string;
    applied: boolean;
    changes?: Array<{
      from: string;
      to: string;
      confidence: number;
    }>;
  }> {
    const response = await fetch(`${this.privacyScannerUrl}/api/sanitize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': context.userId || 'anonymous',
        'X-Session-Id': context.sessionId || 'unknown'
      },
      body: JSON.stringify({
        content,
        options: {
          confidenceThreshold: 0.8,
          userId: context.userId,
          sessionId: context.sessionId
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Content sanitization failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result.result;
  }

  private applySanitizedContent(req: Request, sanitizedContent: string): void {
    // Try to parse sanitized content and apply it back to the request
    if (req.body && typeof req.body === 'object') {
      try {
        const sanitizedObject = JSON.parse(sanitizedContent);
        req.body = sanitizedObject;
      } catch {
        // If parsing fails, add sanitized version as a separate field
        req.body.sanitizedVersion = sanitizedContent;
      }
    } else if (typeof req.body === 'string') {
      req.body = sanitizedContent;
    }
  }

  private sendPrivacyError(res: Response, errorData: any, statusCode: number = 400): void {
    res.status(statusCode).json({
      success: false,
      privacyError: true,
      ...errorData,
      timestamp: new Date().toISOString()
    });
  }
}

// Helper functions for common use cases
export const privacyMiddleware = new PrivacyMiddleware();

export const createPrivacyMiddleware = (options?: PrivacyMiddlewareOptions) => {
  return new PrivacyMiddleware(options);
};

export const quickPrivacyScan = PrivacyMiddleware.quickScan;
export const quickSanitize = PrivacyMiddleware.quickSanitize;