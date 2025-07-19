/**
 * Enhanced Session Management Service
 * Provides Redis-backed session storage with concurrent session limits and blacklisting
 */

import { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import ConnectRedis from 'connect-redis';
import { redis } from '../../config/redis';
import { logger } from '../../utils/logger';
import { prometheusMetrics } from '../monitoring/prometheus-metrics.service';
import crypto from 'crypto';

export interface SessionConfig {
  secret: string;
  maxAge: number; // milliseconds
  maxConcurrentSessions: number;
  cookieName: string;
  domain?: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  enableSessionRotation: boolean;
  rotationInterval: number; // minutes
}

export interface SessionData {
  userId?: string;
  email?: string;
  role?: string;
  tier?: string;
  loginTime: number;
  lastActivity: number;
  ipAddress: string;
  userAgent: string;
  csrfToken?: string;
  permissions?: string[];
}

const defaultConfig: SessionConfig = {
  secret: process.env.SESSION_SECRET || 'session-secret-change-in-production',
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  maxConcurrentSessions: 5,
  cookieName: 'finishthisidea.sid',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  enableSessionRotation: true,
  rotationInterval: 30 // minutes
};

export class SessionService {
  private static instance: SessionService;
  private config: SessionConfig;
  private redisStore: ConnectRedis;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    // Validate configuration
    if (this.config.secret === 'session-secret-change-in-production' && process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET must be set in production environment');
    }

    // Initialize Redis store
    this.redisStore = new ConnectRedis({
      client: redis,
      prefix: 'sess:',
      ttl: Math.floor(this.config.maxAge / 1000) // Convert to seconds
    });
  }

  public static getInstance(config?: Partial<SessionConfig>): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService(config);
    }
    return SessionService.instance;
  }

  /**
   * Get Express session middleware
   */
  public getSessionMiddleware() {
    return session({
      store: this.redisStore,
      secret: this.config.secret,
      name: this.config.cookieName,
      resave: false,
      saveUninitialized: false,
      rolling: true, // Refresh cookie on each request
      cookie: {
        maxAge: this.config.maxAge,
        httpOnly: this.config.httpOnly,
        secure: this.config.secure,
        sameSite: this.config.sameSite,
        domain: this.config.domain
      }
    });
  }

  /**
   * Create a new session for user
   */
  public async createSession(
    userId: string,
    userData: Partial<SessionData>,
    req: Request
  ): Promise<string> {
    const start = Date.now();
    
    try {
      // Check concurrent sessions limit
      await this.enforceSessionLimit(userId);
      
      // Generate session ID
      const sessionId = this.generateSessionId();
      
      // Prepare session data
      const sessionData: SessionData = {
        userId,
        loginTime: Date.now(),
        lastActivity: Date.now(),
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        ...userData
      };
      
      // Store session in Redis
      const sessionKey = `sess:${sessionId}`;
      await redis.setex(
        sessionKey,
        Math.floor(this.config.maxAge / 1000),
        JSON.stringify(sessionData)
      );
      
      // Add to user's active sessions
      const userSessionsKey = `user_sessions:${userId}`;
      await redis.sadd(userSessionsKey, sessionId);
      await redis.expire(userSessionsKey, Math.floor(this.config.maxAge / 1000));
      
      // Log session creation
      logger.info('Session created', {
        userId,
        sessionId,
        ipAddress: sessionData.ipAddress,
        userAgent: sessionData.userAgent.substring(0, 100)
      });
      
      prometheusMetrics.functionDuration.observe(
        { name: 'session_create' },
        Date.now() - start
      );
      
      return sessionId;
      
    } catch (error) {
      logger.error('Session creation error', error);
      prometheusMetrics.functionErrors.inc({ name: 'session_create_error' });
      throw error;
    }
  }

  /**
   * Get session data
   */
  public async getSession(sessionId: string): Promise<SessionData | null> {
    const start = Date.now();
    
    try {
      const sessionKey = `sess:${sessionId}`;
      const data = await redis.get(sessionKey);
      
      if (!data) {
        return null;
      }
      
      const sessionData: SessionData = JSON.parse(data);
      
      // Update last activity
      sessionData.lastActivity = Date.now();
      await redis.setex(
        sessionKey,
        Math.floor(this.config.maxAge / 1000),
        JSON.stringify(sessionData)
      );
      
      prometheusMetrics.functionDuration.observe(
        { name: 'session_get' },
        Date.now() - start
      );
      
      return sessionData;
      
    } catch (error) {
      logger.error('Session retrieval error', error);
      prometheusMetrics.functionErrors.inc({ name: 'session_get_error' });
      return null;
    }
  }

  /**
   * Update session data
   */
  public async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<void> {
    const start = Date.now();
    
    try {
      const currentData = await this.getSession(sessionId);
      if (!currentData) {
        throw new Error('Session not found');
      }
      
      const updatedData = { ...currentData, ...updates, lastActivity: Date.now() };
      
      const sessionKey = `sess:${sessionId}`;
      await redis.setex(
        sessionKey,
        Math.floor(this.config.maxAge / 1000),
        JSON.stringify(updatedData)
      );
      
      prometheusMetrics.functionDuration.observe(
        { name: 'session_update' },
        Date.now() - start
      );
      
    } catch (error) {
      logger.error('Session update error', error);
      prometheusMetrics.functionErrors.inc({ name: 'session_update_error' });
      throw error;
    }
  }

  /**
   * Destroy a specific session
   */
  public async destroySession(sessionId: string): Promise<void> {
    const start = Date.now();
    
    try {
      // Get session data to find user
      const sessionData = await this.getSession(sessionId);
      
      // Remove session
      const sessionKey = `sess:${sessionId}`;
      await redis.del(sessionKey);
      
      // Remove from user's active sessions
      if (sessionData?.userId) {
        const userSessionsKey = `user_sessions:${sessionData.userId}`;
        await redis.srem(userSessionsKey, sessionId);
        
        logger.info('Session destroyed', {
          userId: sessionData.userId,
          sessionId,
          ipAddress: sessionData.ipAddress
        });
      }
      
      prometheusMetrics.functionDuration.observe(
        { name: 'session_destroy' },
        Date.now() - start
      );
      
    } catch (error) {
      logger.error('Session destruction error', error);
      prometheusMetrics.functionErrors.inc({ name: 'session_destroy_error' });
    }
  }

  /**
   * Destroy all sessions for a user
   */
  public async destroyAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    const start = Date.now();
    
    try {
      const userSessionsKey = `user_sessions:${userId}`;
      const sessionIds = await redis.smembers(userSessionsKey);
      
      const sessionsToDestroy = exceptSessionId 
        ? sessionIds.filter(id => id !== exceptSessionId)
        : sessionIds;
      
      // Remove sessions
      for (const sessionId of sessionsToDestroy) {
        const sessionKey = `sess:${sessionId}`;
        await redis.del(sessionKey);
        await redis.srem(userSessionsKey, sessionId);
      }
      
      logger.info('All user sessions destroyed', {
        userId,
        destroyedCount: sessionsToDestroy.length,
        exceptSessionId
      });
      
      prometheusMetrics.functionDuration.observe(
        { name: 'session_destroy_all_user' },
        Date.now() - start
      );
      
    } catch (error) {
      logger.error('User sessions destruction error', error);
      prometheusMetrics.functionErrors.inc({ name: 'session_destroy_all_user_error' });
    }
  }

  /**
   * Enforce concurrent session limit
   */
  private async enforceSessionLimit(userId: string): Promise<void> {
    const userSessionsKey = `user_sessions:${userId}`;
    const sessionIds = await redis.smembers(userSessionsKey);
    
    if (sessionIds.length >= this.config.maxConcurrentSessions) {
      // Sort by last activity and remove oldest
      const sessionsWithActivity: Array<{ id: string; lastActivity: number }> = [];
      
      for (const sessionId of sessionIds) {
        const sessionData = await this.getSession(sessionId);
        if (sessionData) {
          sessionsWithActivity.push({
            id: sessionId,
            lastActivity: sessionData.lastActivity
          });
        } else {
          // Clean up invalid session
          await redis.srem(userSessionsKey, sessionId);
        }
      }
      
      // Remove oldest sessions
      sessionsWithActivity.sort((a, b) => a.lastActivity - b.lastActivity);
      const toRemove = sessionsWithActivity.slice(0, -this.config.maxConcurrentSessions + 1);
      
      for (const session of toRemove) {
        await this.destroySession(session.id);
      }
      
      logger.info('Session limit enforced', {
        userId,
        removedSessions: toRemove.length,
        limit: this.config.maxConcurrentSessions
      });
    }
  }

  /**
   * Generate secure session ID
   */
  private generateSessionId(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Blacklist session (for security breaches)
   */
  public async blacklistSession(sessionId: string, reason: string): Promise<void> {
    const start = Date.now();
    
    try {
      // Add to blacklist
      const blacklistKey = `blacklist:${sessionId}`;
      await redis.setex(blacklistKey, this.config.maxAge / 1000, reason);
      
      // Destroy the session
      await this.destroySession(sessionId);
      
      logger.warn('Session blacklisted', { sessionId, reason });
      
      prometheusMetrics.functionDuration.observe(
        { name: 'session_blacklist' },
        Date.now() - start
      );
      
    } catch (error) {
      logger.error('Session blacklisting error', error);
      prometheusMetrics.functionErrors.inc({ name: 'session_blacklist_error' });
    }
  }

  /**
   * Check if session is blacklisted
   */
  public async isSessionBlacklisted(sessionId: string): Promise<boolean> {
    try {
      const blacklistKey = `blacklist:${sessionId}`;
      const result = await redis.exists(blacklistKey);
      return result === 1;
    } catch (error) {
      logger.error('Session blacklist check error', error);
      return false;
    }
  }

  /**
   * Session validation middleware
   */
  public validationMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      try {
        const sessionId = req.sessionID;
        
        if (!sessionId) {
          return next();
        }
        
        // Check if session is blacklisted
        if (await this.isSessionBlacklisted(sessionId)) {
          logger.warn('Blacklisted session attempted access', {
            sessionId,
            ip: req.ip,
            path: req.path
          });
          
          req.session?.destroy(() => {});
          return res.status(401).json({
            success: false,
            error: {
              code: 'SESSION_BLACKLISTED',
              message: 'Session has been terminated for security reasons'
            }
          });
        }
        
        // Rotate session ID periodically
        if (this.config.enableSessionRotation && req.session && this.shouldRotateSession(req.session)) {
          req.session.regenerate((err) => {
            if (err) {
              logger.error('Session rotation error', err);
            } else {
              logger.debug('Session rotated', { oldSessionId: sessionId, newSessionId: req.sessionID });
            }
          });
        }
        
        prometheusMetrics.functionDuration.observe(
          { name: 'session_validation_middleware' },
          Date.now() - start
        );
        
        next();
        
      } catch (error) {
        logger.error('Session validation middleware error', error);
        prometheusMetrics.functionErrors.inc({ name: 'session_validation_middleware_error' });
        next();
      }
    };
  }

  /**
   * Check if session should be rotated
   */
  private shouldRotateSession(session: any): boolean {
    if (!session.lastRotation) {
      session.lastRotation = Date.now();
      return false;
    }
    
    const timeSinceRotation = Date.now() - session.lastRotation;
    const rotationInterval = this.config.rotationInterval * 60 * 1000; // Convert to milliseconds
    
    if (timeSinceRotation > rotationInterval) {
      session.lastRotation = Date.now();
      return true;
    }
    
    return false;
  }

  /**
   * Get active sessions for user
   */
  public async getUserActiveSessions(userId: string): Promise<Array<Partial<SessionData>>> {
    try {
      const userSessionsKey = `user_sessions:${userId}`;
      const sessionIds = await redis.smembers(userSessionsKey);
      
      const sessions: Array<Partial<SessionData>> = [];
      
      for (const sessionId of sessionIds) {
        const sessionData = await this.getSession(sessionId);
        if (sessionData) {
          sessions.push({
            loginTime: sessionData.loginTime,
            lastActivity: sessionData.lastActivity,
            ipAddress: sessionData.ipAddress,
            userAgent: sessionData.userAgent
          });
        }
      }
      
      return sessions.sort((a, b) => (b.lastActivity || 0) - (a.lastActivity || 0));
      
    } catch (error) {
      logger.error('Get user active sessions error', error);
      return [];
    }
  }

  /**
   * Cleanup expired sessions (for scheduled cleanup)
   */
  public async cleanupExpiredSessions(): Promise<number> {
    try {
      const pattern = 'sess:*';
      const keys = await redis.keys(pattern);
      let cleanedCount = 0;
      
      for (const key of keys) {
        const ttl = await redis.ttl(key);
        if (ttl <= 0) {
          await redis.del(key);
          cleanedCount++;
        }
      }
      
      logger.info('Session cleanup completed', { cleanedCount, totalKeys: keys.length });
      return cleanedCount;
      
    } catch (error) {
      logger.error('Session cleanup error', error);
      return 0;
    }
  }
}

// Export singleton instance
export const sessionService = SessionService.getInstance();