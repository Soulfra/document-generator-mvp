import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics/analytics.service';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      analytics?: {
        track: (event: string, properties?: Record<string, any>) => Promise<void>;
        identify: (userId: string, traits?: Record<string, any>) => Promise<void>;
        pageView: (page: string, properties?: Record<string, any>) => Promise<void>;
      };
    }
  }
}

export interface AnalyticsMiddlewareOptions {
  trackPageViews?: boolean;
  trackApiCalls?: boolean;
  excludePaths?: string[];
  includeRequestData?: boolean;
  sessionTimeout?: number;
}

export class AnalyticsMiddleware {
  private options: AnalyticsMiddlewareOptions;

  constructor(options: AnalyticsMiddlewareOptions = {}) {
    this.options = {
      trackPageViews: true,
      trackApiCalls: true,
      excludePaths: ['/health', '/metrics', '/favicon.ico'],
      includeRequestData: false,
      sessionTimeout: 1800, // 30 minutes
      ...options
    };
  }

  // Main middleware function
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Skip excluded paths
        if (this.shouldExcludePath(req.path)) {
          return next();
        }

        // Initialize session
        await this.initializeSession(req);

        // Add analytics helpers to request
        this.attachAnalyticsHelpers(req);

        // Track page views for non-API routes
        if (this.options.trackPageViews && !req.path.startsWith('/api/')) {
          await this.trackPageView(req);
        }

        // Track API calls
        if (this.options.trackApiCalls && req.path.startsWith('/api/')) {
          await this.trackApiCall(req);
        }

        // Add response tracking
        this.addResponseTracking(req, res);

        next();
      } catch (error) {
        logger.error('Analytics middleware error:', error);
        next(); // Continue even if analytics fails
      }
    };
  }

  // Session management middleware
  sessionMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const sessionId = req.sessionId || req.headers['x-session-id'] as string || req.cookies?.sessionId;
        
        if (sessionId) {
          req.sessionId = sessionId;
          // Extend session timeout
          const session = await analyticsService.getSession(sessionId);
          if (session) {
            // Session exists, extend it
            req.sessionId = sessionId;
          } else {
            // Session expired, create new one
            req.sessionId = await this.createNewSession(req);
          }
        } else {
          // No session, create new one
          req.sessionId = await this.createNewSession(req);
          res.cookie('sessionId', req.sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: this.options.sessionTimeout! * 1000
          });
        }

        next();
      } catch (error) {
        logger.error('Session middleware error:', error);
        next();
      }
    };
  }

  // User identification middleware
  userMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id || req.headers['x-user-id'] as string;
        
        if (userId && req.sessionId) {
          // Update session with user ID
          const session = await analyticsService.getSession(req.sessionId);
          if (session && !session.userId) {
            session.userId = userId;
            // Store updated session would happen in analytics service
          }

          // Track user login if this is a new session with user
          if (session && !session.userId) {
            await analyticsService.track({
              userId,
              sessionId: req.sessionId,
              event: 'User Login',
              properties: {
                loginMethod: req.headers['x-login-method'] || 'unknown',
                userAgent: req.headers['user-agent'],
                ip: this.getClientIP(req)
              }
            });
          }
        }

        next();
      } catch (error) {
        logger.error('User middleware error:', error);
        next();
      }
    };
  }

  // Business events middleware for specific routes
  businessEventsMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const originalSend = res.send;
        const self = this;

        res.send = function(data: any) {
          // Track business events based on route and response
          self.trackBusinessEvent(req, res, data);
          return originalSend.call(this, data);
        };

        next();
      } catch (error) {
        logger.error('Business events middleware error:', error);
        next();
      }
    };
  }

  private shouldExcludePath(path: string): boolean {
    return this.options.excludePaths!.some(excludePath => 
      path.startsWith(excludePath)
    );
  }

  private async initializeSession(req: Request): Promise<void> {
    if (!req.sessionId) {
      const sessionId = req.headers['x-session-id'] as string || 
                       req.cookies?.sessionId || 
                       uuidv4();
      
      req.sessionId = sessionId;

      // Create or update session
      const existingSession = await analyticsService.getSession(sessionId);
      if (!existingSession) {
        await analyticsService.startSession({
          sessionId,
          userId: req.user?.id,
          deviceInfo: {
            userAgent: req.headers['user-agent'] || '',
            ip: this.getClientIP(req),
            browser: this.extractBrowser(req.headers['user-agent']),
            os: this.extractOS(req.headers['user-agent'])
          }
        });
      }
    }
  }

  private attachAnalyticsHelpers(req: Request): void {
    req.analytics = {
      track: async (event: string, properties?: Record<string, any>) => {
        await analyticsService.track({
          userId: req.user?.id,
          sessionId: req.sessionId,
          event,
          properties: {
            ...properties,
            path: req.path,
            method: req.method,
            userAgent: req.headers['user-agent'],
            ip: this.getClientIP(req)
          }
        });
      },

      identify: async (userId: string, traits?: Record<string, any>) => {
        await analyticsService.identify({
          userId,
          ...traits
        });
      },

      pageView: async (page: string, properties?: Record<string, any>) => {
        await analyticsService.trackPageView(
          req.user?.id || 'anonymous',
          req.sessionId!,
          page,
          properties
        );
      }
    };
  }

  private async trackPageView(req: Request): Promise<void> {
    const userId = req.user?.id || 'anonymous';
    const properties = {
      path: req.path,
      query: req.query,
      referrer: req.headers.referer,
      userAgent: req.headers['user-agent'],
      ip: this.getClientIP(req)
    };

    if (this.options.includeRequestData) {
      properties.headers = req.headers;
    }

    await analyticsService.trackPageView(userId, req.sessionId!, req.path, properties);
  }

  private async trackApiCall(req: Request): Promise<void> {
    const userId = req.user?.id;
    const properties = {
      method: req.method,
      path: req.path,
      query: req.query,
      userAgent: req.headers['user-agent'],
      ip: this.getClientIP(req),
      contentType: req.headers['content-type']
    };

    if (this.options.includeRequestData && req.method !== 'GET') {
      properties.bodySize = JSON.stringify(req.body).length;
    }

    await analyticsService.track({
      userId,
      sessionId: req.sessionId,
      event: 'API Call',
      properties
    });
  }

  private addResponseTracking(req: Request, res: Response): void {
    const startTime = Date.now();
    
    const originalSend = res.send;
    res.send = function(data: any) {
      const duration = Date.now() - startTime;
      
      // Track response metrics
      analyticsService.track({
        userId: req.user?.id,
        sessionId: req.sessionId,
        event: 'Response Sent',
        properties: {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          responseSize: typeof data === 'string' ? data.length : JSON.stringify(data).length
        }
      });

      return originalSend.call(this, data);
    };
  }

  private async createNewSession(req: Request): Promise<string> {
    return await analyticsService.startSession({
      userId: req.user?.id,
      deviceInfo: {
        userAgent: req.headers['user-agent'] || '',
        ip: this.getClientIP(req),
        browser: this.extractBrowser(req.headers['user-agent']),
        os: this.extractOS(req.headers['user-agent'])
      }
    });
  }

  private async trackBusinessEvent(req: Request, res: Response, responseData: any): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) return;

      // Track specific business events based on routes
      if (req.path === '/api/jobs' && req.method === 'POST' && res.statusCode === 201) {
        await analyticsService.trackJobCreated(userId, responseData.data);
      } else if (req.path.match(/\/api\/jobs\/.*\/status/) && req.method === 'PUT') {
        if (responseData.data?.status === 'completed') {
          await analyticsService.trackJobCompleted(userId, responseData.data);
        }
      } else if (req.path === '/api/upload' && req.method === 'POST' && res.statusCode === 200) {
        await analyticsService.trackFileUploaded(userId, responseData.data);
      } else if (req.path === '/api/credits/purchase' && req.method === 'POST' && res.statusCode === 200) {
        await analyticsService.trackCreditsPurchased(userId, responseData.data);
      } else if (req.path === '/api/auth/register' && req.method === 'POST' && res.statusCode === 201) {
        await analyticsService.trackUserRegistered(userId, responseData.data);
      }
    } catch (error) {
      logger.error('Error tracking business event:', error);
    }
  }

  private getClientIP(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
           req.headers['x-real-ip'] as string ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           '';
  }

  private extractBrowser(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'unknown';
  }

  private extractOS(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    
    return 'unknown';
  }
}

// Create default instance
export const analyticsMiddleware = new AnalyticsMiddleware();

// Export individual middleware functions
export const trackingSuite = {
  analytics: analyticsMiddleware.middleware(),
  session: analyticsMiddleware.sessionMiddleware(),
  user: analyticsMiddleware.userMiddleware(),
  businessEvents: analyticsMiddleware.businessEventsMiddleware()
};