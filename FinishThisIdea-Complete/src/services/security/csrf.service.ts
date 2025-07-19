/**
 * CSRF Protection Service
 * Custom implementation since csurf is deprecated
 * Provides CSRF token generation, validation, and middleware
 */

import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { redis } from '../../config/redis';
import { logger } from '../../utils/logger';
import { prometheusMetrics } from '../monitoring/prometheus-metrics.service';

export interface CSRFConfig {
  secret: string;
  tokenLength: number;
  tokenTTL: number; // seconds
  cookieName: string;
  headerName: string;
  ignoredMethods: string[];
  trustedOrigins: string[];
}

const defaultConfig: CSRFConfig = {
  secret: process.env.CSRF_SECRET || 'csrf-secret-change-in-production',
  tokenLength: 32,
  tokenTTL: 3600, // 1 hour
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000']
};

export class CSRFService {
  private static instance: CSRFService;
  private config: CSRFConfig;

  constructor(config: Partial<CSRFConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    // Validate configuration
    if (this.config.secret === 'csrf-secret-change-in-production' && process.env.NODE_ENV === 'production') {
      throw new Error('CSRF_SECRET must be set in production environment');
    }
  }

  public static getInstance(config?: Partial<CSRFConfig>): CSRFService {
    if (!CSRFService.instance) {
      CSRFService.instance = new CSRFService(config);
    }
    return CSRFService.instance;
  }

  /**
   * Generate a new CSRF token
   */
  public async generateToken(sessionId?: string): Promise<string> {
    const tokenId = crypto.randomBytes(this.config.tokenLength).toString('hex');
    const timestamp = Date.now();
    const payload = { tokenId, timestamp, sessionId };
    
    // Create HMAC signature
    const signature = this.createSignature(JSON.stringify(payload));
    const token = Buffer.from(JSON.stringify({ ...payload, signature })).toString('base64');
    
    // Store token in Redis with TTL
    const redisKey = `csrf:${tokenId}`;
    await redis.setex(redisKey, this.config.tokenTTL, JSON.stringify(payload));
    
    logger.debug('CSRF token generated', { tokenId, sessionId });
    return token;
  }

  /**
   * Validate CSRF token
   */
  public async validateToken(token: string, sessionId?: string): Promise<boolean> {
    try {
      // Decode token
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const { tokenId, timestamp, sessionId: tokenSessionId, signature } = decoded;
      
      // Verify signature
      const payload = { tokenId, timestamp, sessionId: tokenSessionId };
      const expectedSignature = this.createSignature(JSON.stringify(payload));
      
      if (signature !== expectedSignature) {
        logger.warn('CSRF token signature mismatch', { tokenId });
        prometheusMetrics.functionErrors.inc({ name: 'csrf_validation_signature_mismatch' });
        return false;
      }
      
      // Check if token exists in Redis
      const redisKey = `csrf:${tokenId}`;
      const storedData = await redis.get(redisKey);
      
      if (!storedData) {
        logger.warn('CSRF token not found or expired', { tokenId });
        prometheusMetrics.functionErrors.inc({ name: 'csrf_validation_token_expired' });
        return false;
      }
      
      // Validate session ID if provided
      if (sessionId && tokenSessionId && sessionId !== tokenSessionId) {
        logger.warn('CSRF token session mismatch', { tokenId, sessionId, tokenSessionId });
        prometheusMetrics.functionErrors.inc({ name: 'csrf_validation_session_mismatch' });
        return false;
      }
      
      // Check token age
      const age = Date.now() - timestamp;
      if (age > this.config.tokenTTL * 1000) {
        logger.warn('CSRF token too old', { tokenId, age });
        prometheusMetrics.functionErrors.inc({ name: 'csrf_validation_token_too_old' });
        return false;
      }
      
      logger.debug('CSRF token validated successfully', { tokenId });
      return true;
      
    } catch (error) {
      logger.error('CSRF token validation error', error);
      prometheusMetrics.functionErrors.inc({ name: 'csrf_validation_error' });
      return false;
    }
  }

  /**
   * Invalidate a CSRF token
   */
  public async invalidateToken(token: string): Promise<void> {
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
      const { tokenId } = decoded;
      
      const redisKey = `csrf:${tokenId}`;
      await redis.del(redisKey);
      
      logger.debug('CSRF token invalidated', { tokenId });
    } catch (error) {
      logger.error('CSRF token invalidation error', error);
    }
  }

  /**
   * Create HMAC signature
   */
  private createSignature(data: string): string {
    return crypto.createHmac('sha256', this.config.secret).update(data).digest('hex');
  }

  /**
   * Express middleware for CSRF protection
   */
  public middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      try {
        // Skip CSRF check for ignored methods
        if (this.config.ignoredMethods.includes(req.method)) {
          return next();
        }
        
        // Skip CSRF check for trusted origins (API-to-API calls)
        const origin = req.get('origin') || req.get('referer');
        if (origin && this.config.trustedOrigins.some(trusted => origin.startsWith(trusted))) {
          return next();
        }
        
        // Get token from header or body
        const token = req.get(this.config.headerName) || 
                     req.body?._csrf || 
                     req.query._csrf as string;
        
        if (!token) {
          logger.warn('CSRF token missing', { 
            method: req.method, 
            path: req.path, 
            ip: req.ip,
            userAgent: req.get('user-agent')
          });
          
          prometheusMetrics.functionErrors.inc({ name: 'csrf_token_missing' });
          
          return res.status(403).json({
            success: false,
            error: {
              code: 'CSRF_TOKEN_MISSING',
              message: 'CSRF token is required for this request'
            }
          });
        }
        
        // Validate token
        const sessionId = req.session?.id || req.sessionID;
        const isValid = await this.validateToken(token, sessionId);
        
        if (!isValid) {
          logger.warn('CSRF token validation failed', {
            method: req.method,
            path: req.path,
            ip: req.ip,
            sessionId,
            userAgent: req.get('user-agent')
          });
          
          prometheusMetrics.functionErrors.inc({ name: 'csrf_token_invalid' });
          
          return res.status(403).json({
            success: false,
            error: {
              code: 'CSRF_TOKEN_INVALID',
              message: 'Invalid or expired CSRF token'
            }
          });
        }
        
        // Token is valid, proceed
        logger.debug('CSRF validation passed', { path: req.path, sessionId });
        prometheusMetrics.functionDuration.observe(
          { name: 'csrf_validation' },
          Date.now() - start
        );
        
        next();
        
      } catch (error) {
        logger.error('CSRF middleware error', error);
        prometheusMetrics.functionErrors.inc({ name: 'csrf_middleware_error' });
        
        res.status(500).json({
          success: false,
          error: {
            code: 'CSRF_MIDDLEWARE_ERROR',
            message: 'Internal security error'
          }
        });
      }
    };
  }

  /**
   * Generate token endpoint handler
   */
  public async generateTokenHandler(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.session?.id || req.sessionID;
      const token = await this.generateToken(sessionId);
      
      // Set token in cookie for frontend access
      res.cookie(this.config.cookieName, token, {
        httpOnly: false, // Allow frontend to read
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: this.config.tokenTTL * 1000
      });
      
      res.json({
        success: true,
        data: {
          token,
          headerName: this.config.headerName,
          expires: new Date(Date.now() + this.config.tokenTTL * 1000)
        }
      });
      
    } catch (error) {
      logger.error('CSRF token generation error', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TOKEN_GENERATION_ERROR',
          message: 'Failed to generate CSRF token'
        }
      });
    }
  }

  /**
   * Cleanup expired tokens (for scheduled cleanup)
   */
  public async cleanupExpiredTokens(): Promise<number> {
    try {
      const pattern = 'csrf:*';
      const keys = await redis.keys(pattern);
      let deletedCount = 0;
      
      for (const key of keys) {
        const ttl = await redis.ttl(key);
        if (ttl <= 0) {
          await redis.del(key);
          deletedCount++;
        }
      }
      
      logger.info('CSRF token cleanup completed', { deletedCount, totalKeys: keys.length });
      return deletedCount;
      
    } catch (error) {
      logger.error('CSRF token cleanup error', error);
      return 0;
    }
  }
}

// Export singleton instance
export const csrfService = CSRFService.getInstance();