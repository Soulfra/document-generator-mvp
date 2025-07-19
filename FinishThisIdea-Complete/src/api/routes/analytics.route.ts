import { Router, Request, Response } from 'express';
import { analyticsService } from '../../services/analytics/analytics.service';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { rateLimit } from '../../middleware/rate-limit.middleware';
import Joi from 'joi';
import { logger } from '../../utils/logger';

const router = Router();

// Validation schemas
const trackEventSchema = Joi.object({
  event: Joi.string().required().min(1).max(100),
  properties: Joi.object().optional(),
  userId: Joi.string().optional(),
  sessionId: Joi.string().optional()
});

const identifyUserSchema = Joi.object({
  userId: Joi.string().required(),
  traits: Joi.object({
    email: Joi.string().email().optional(),
    name: Joi.string().optional(),
    tier: Joi.string().optional(),
    properties: Joi.object().optional()
  }).optional()
});

const pageViewSchema = Joi.object({
  page: Joi.string().required(),
  properties: Joi.object().optional(),
  userId: Joi.string().optional(),
  sessionId: Joi.string().optional()
});

// Rate limiting for analytics endpoints
const analyticsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many analytics requests'
});

// Track custom event
router.post('/track', 
  analyticsRateLimit,
  validate(trackEventSchema),
  async (req: Request, res: Response) => {
    try {
      const { event, properties, userId, sessionId } = req.body;
      
      await analyticsService.track({
        event,
        properties,
        userId: userId || req.user?.id,
        sessionId: sessionId || req.sessionId,
        ip: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.status(200).json({
        success: true,
        message: 'Event tracked successfully'
      });
    } catch (error) {
      logger.error('Error tracking event:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track event'
      });
    }
  }
);

// Identify user
router.post('/identify',
  analyticsRateLimit,
  validate(identifyUserSchema),
  async (req: Request, res: Response) => {
    try {
      const { userId, traits } = req.body;
      
      await analyticsService.identify({
        userId,
        email: traits?.email,
        name: traits?.name,
        tier: traits?.tier,
        properties: traits?.properties,
        lastActive: new Date()
      });

      res.status(200).json({
        success: true,
        message: 'User identified successfully'
      });
    } catch (error) {
      logger.error('Error identifying user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to identify user'
      });
    }
  }
);

// Track page view
router.post('/pageview',
  analyticsRateLimit,
  validate(pageViewSchema),
  async (req: Request, res: Response) => {
    try {
      const { page, properties, userId, sessionId } = req.body;
      
      await analyticsService.trackPageView(
        userId || req.user?.id || 'anonymous',
        sessionId || req.sessionId || '',
        page,
        {
          ...properties,
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          timestamp: new Date()
        }
      );

      res.status(200).json({
        success: true,
        message: 'Page view tracked successfully'
      });
    } catch (error) {
      logger.error('Error tracking page view:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track page view'
      });
    }
  }
);

// Get session data
router.get('/session/:sessionId',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const session = await analyticsService.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Only return session if it belongs to the authenticated user
      if (session.userId && session.userId !== req.user?.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      res.status(200).json({
        success: true,
        data: session
      });
    } catch (error) {
      logger.error('Error getting session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get session'
      });
    }
  }
);

// End session
router.post('/session/:sessionId/end',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const session = await analyticsService.getSession(sessionId);
      
      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Only allow ending session if it belongs to the authenticated user
      if (session.userId && session.userId !== req.user?.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied'
        });
      }

      await analyticsService.endSession(sessionId);

      res.status(200).json({
        success: true,
        message: 'Session ended successfully'
      });
    } catch (error) {
      logger.error('Error ending session:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to end session'
      });
    }
  }
);

// Get real-time analytics (admin only)
router.get('/realtime',
  authenticate(['admin', 'forest']),
  async (req: Request, res: Response) => {
    try {
      const stats = await analyticsService.getRealtimeStats();
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Error getting realtime stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get realtime analytics'
      });
    }
  }
);

// Business event tracking endpoints
router.post('/business/job-created',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      await analyticsService.trackJobCreated(userId, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Job creation tracked'
      });
    } catch (error) {
      logger.error('Error tracking job creation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track job creation'
      });
    }
  }
);

router.post('/business/job-completed',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      await analyticsService.trackJobCompleted(userId, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Job completion tracked'
      });
    } catch (error) {
      logger.error('Error tracking job completion:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track job completion'
      });
    }
  }
);

router.post('/business/file-uploaded',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      await analyticsService.trackFileUploaded(userId, req.body);
      
      res.status(200).json({
        success: true,
        message: 'File upload tracked'
      });
    } catch (error) {
      logger.error('Error tracking file upload:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track file upload'
      });
    }
  }
);

router.post('/business/credits-purchased',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      await analyticsService.trackCreditsPurchased(userId, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Credit purchase tracked'
      });
    } catch (error) {
      logger.error('Error tracking credit purchase:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track credit purchase'
      });
    }
  }
);

router.post('/business/feature-used',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { feature, properties } = req.body;
      
      await analyticsService.trackFeatureUsed(userId, feature, properties);
      
      res.status(200).json({
        success: true,
        message: 'Feature usage tracked'
      });
    } catch (error) {
      logger.error('Error tracking feature usage:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to track feature usage'
      });
    }
  }
);

// Analytics dashboard data endpoints
router.get('/dashboard/overview',
  authenticate(['admin', 'forest']),
  async (req: Request, res: Response) => {
    try {
      const { timeRange = '24h' } = req.query;
      
      // Get dashboard data based on time range
      const dashboardData = {
        totalUsers: await getTotalUsers(timeRange as string),
        activeUsers: await getActiveUsers(timeRange as string),
        totalSessions: await getTotalSessions(timeRange as string),
        avgSessionDuration: await getAvgSessionDuration(timeRange as string),
        topEvents: await getTopEvents(timeRange as string),
        topPages: await getTopPages(timeRange as string),
        userGrowth: await getUserGrowth(timeRange as string),
        featureUsage: await getFeatureUsage(timeRange as string)
      };
      
      res.status(200).json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      logger.error('Error getting dashboard overview:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get dashboard data'
      });
    }
  }
);

router.get('/dashboard/users',
  authenticate(['admin', 'forest']),
  async (req: Request, res: Response) => {
    try {
      const { timeRange = '7d', page = 1, limit = 50 } = req.query;
      
      const userData = {
        users: await getUserAnalytics(timeRange as string, Number(page), Number(limit)),
        segments: await getUserSegments(),
        cohorts: await getCohortAnalysis(timeRange as string),
        retention: await getRetentionAnalysis(timeRange as string)
      };
      
      res.status(200).json({
        success: true,
        data: userData
      });
    } catch (error) {
      logger.error('Error getting user analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user analytics'
      });
    }
  }
);

router.get('/dashboard/events',
  authenticate(['admin', 'forest']),
  async (req: Request, res: Response) => {
    try {
      const { timeRange = '7d', eventType } = req.query;
      
      const eventData = {
        events: await getEventAnalytics(timeRange as string, eventType as string),
        funnels: await getFunnelAnalysis(),
        conversions: await getConversionRates(timeRange as string)
      };
      
      res.status(200).json({
        success: true,
        data: eventData
      });
    } catch (error) {
      logger.error('Error getting event analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get event analytics'
      });
    }
  }
);

// Health check for analytics service
router.get('/health',
  async (req: Request, res: Response) => {
    try {
      const health = {
        analytics: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      };
      
      res.status(200).json({
        success: true,
        data: health
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Analytics service unhealthy'
      });
    }
  }
);

// Helper functions for dashboard data (implement based on your analytics needs)
async function getTotalUsers(timeRange: string): Promise<number> {
  // Implementation would query your analytics data
  return 0;
}

async function getActiveUsers(timeRange: string): Promise<number> {
  // Implementation would query your analytics data
  return 0;
}

async function getTotalSessions(timeRange: string): Promise<number> {
  // Implementation would query your analytics data
  return 0;
}

async function getAvgSessionDuration(timeRange: string): Promise<number> {
  // Implementation would query your analytics data
  return 0;
}

async function getTopEvents(timeRange: string): Promise<any[]> {
  // Implementation would query your analytics data
  return [];
}

async function getTopPages(timeRange: string): Promise<any[]> {
  // Implementation would query your analytics data
  return [];
}

async function getUserGrowth(timeRange: string): Promise<any[]> {
  // Implementation would query your analytics data
  return [];
}

async function getFeatureUsage(timeRange: string): Promise<any[]> {
  // Implementation would query your analytics data
  return [];
}

async function getUserAnalytics(timeRange: string, page: number, limit: number): Promise<any[]> {
  // Implementation would query your analytics data
  return [];
}

async function getUserSegments(): Promise<any[]> {
  // Implementation would query your analytics data
  return [];
}

async function getCohortAnalysis(timeRange: string): Promise<any[]> {
  // Implementation would query your analytics data
  return [];
}

async function getRetentionAnalysis(timeRange: string): Promise<any[]> {
  // Implementation would query your analytics data
  return [];
}

async function getEventAnalytics(timeRange: string, eventType?: string): Promise<any[]> {
  // Implementation would query your analytics data
  return [];
}

async function getFunnelAnalysis(): Promise<any[]> {
  // Implementation would query your analytics data
  return [];
}

async function getConversionRates(timeRange: string): Promise<any[]> {
  // Implementation would query your analytics data
  return [];
}

export { router as analyticsRouter };