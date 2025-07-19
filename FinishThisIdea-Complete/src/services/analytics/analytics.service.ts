import mixpanel from 'mixpanel';
import Analytics from 'analytics-node';
import { PostHog } from 'posthog-node';
import { redis } from '../../config/redis';
import { logger } from '../../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface AnalyticsEvent {
  userId?: string;
  sessionId?: string;
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
  ip?: string;
  userAgent?: string;
}

export interface UserProfile {
  userId: string;
  email?: string;
  name?: string;
  tier?: string;
  registrationDate?: Date;
  lastActive?: Date;
  totalJobs?: number;
  totalCreditsUsed?: number;
  properties?: Record<string, any>;
}

export interface SessionData {
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  events: AnalyticsEvent[];
  deviceInfo?: {
    userAgent: string;
    ip: string;
    country?: string;
    browser?: string;
    os?: string;
  };
}

export class AnalyticsService {
  private mixpanelClient?: mixpanel.Mixpanel;
  private segmentClient?: Analytics;
  private posthogClient?: PostHog;
  private redisClient = redis;
  private isEnabled: boolean = false;

  constructor() {
    // Redis is already initialized above
    this.initialize();
  }

  private initialize(): void {
    try {
      // Initialize Mixpanel
      if (process.env.MIXPANEL_TOKEN) {
        this.mixpanelClient = mixpanel.init(process.env.MIXPANEL_TOKEN, {
          debug: process.env.NODE_ENV === 'development',
          protocol: 'https'
        });
        logger.info('Mixpanel analytics initialized');
      }

      // Initialize Segment
      if (process.env.SEGMENT_WRITE_KEY) {
        this.segmentClient = new Analytics(process.env.SEGMENT_WRITE_KEY, {
          flushAt: 20,
          flushInterval: 10000
        });
        logger.info('Segment analytics initialized');
      }

      // Initialize PostHog
      if (process.env.POSTHOG_API_KEY) {
        this.posthogClient = new PostHog(process.env.POSTHOG_API_KEY, {
          host: process.env.POSTHOG_HOST || 'https://app.posthog.com'
        });
        logger.info('PostHog analytics initialized');
      }

      this.isEnabled = !!(this.mixpanelClient || this.segmentClient || this.posthogClient);
      
      if (!this.isEnabled) {
        logger.warn('No analytics providers configured - analytics disabled');
      }
    } catch (error) {
      logger.error('Failed to initialize analytics service:', error);
    }
  }

  // Event Tracking
  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const enrichedEvent = await this.enrichEvent(event);
      
      // Track in Mixpanel
      if (this.mixpanelClient && enrichedEvent.userId) {
        this.mixpanelClient.track(enrichedEvent.event, {
          distinct_id: enrichedEvent.userId,
          ...enrichedEvent.properties,
          $ip: enrichedEvent.ip,
          time: enrichedEvent.timestamp?.getTime()
        });
      }

      // Track in Segment
      if (this.segmentClient && enrichedEvent.userId) {
        this.segmentClient.track({
          userId: enrichedEvent.userId,
          event: enrichedEvent.event,
          properties: enrichedEvent.properties,
          context: {
            ip: enrichedEvent.ip,
            userAgent: enrichedEvent.userAgent
          },
          timestamp: enrichedEvent.timestamp
        });
      }

      // Track in PostHog
      if (this.posthogClient) {
        this.posthogClient.capture({
          distinctId: enrichedEvent.userId || enrichedEvent.sessionId || 'anonymous',
          event: enrichedEvent.event,
          properties: {
            ...enrichedEvent.properties,
            $ip: enrichedEvent.ip,
            $useragent: enrichedEvent.userAgent
          },
          timestamp: enrichedEvent.timestamp
        });
      }

      // Store in Redis for real-time analytics
      await this.storeEventInRedis(enrichedEvent);

      logger.debug('Analytics event tracked:', {
        event: enrichedEvent.event,
        userId: enrichedEvent.userId,
        sessionId: enrichedEvent.sessionId
      });
    } catch (error) {
      logger.error('Failed to track analytics event:', error);
    }
  }

  // User Profile Management
  async identify(profile: UserProfile): Promise<void> {
    if (!this.isEnabled) return;

    try {
      // Identify in Mixpanel
      if (this.mixpanelClient) {
        this.mixpanelClient.people.set(profile.userId, {
          $email: profile.email,
          $name: profile.name,
          tier: profile.tier,
          registrationDate: profile.registrationDate,
          lastActive: profile.lastActive,
          totalJobs: profile.totalJobs,
          totalCreditsUsed: profile.totalCreditsUsed,
          ...profile.properties
        });
      }

      // Identify in Segment
      if (this.segmentClient) {
        this.segmentClient.identify({
          userId: profile.userId,
          traits: {
            email: profile.email,
            name: profile.name,
            tier: profile.tier,
            registrationDate: profile.registrationDate,
            lastActive: profile.lastActive,
            totalJobs: profile.totalJobs,
            totalCreditsUsed: profile.totalCreditsUsed,
            ...profile.properties
          }
        });
      }

      // Identify in PostHog
      if (this.posthogClient) {
        this.posthogClient.identify({
          distinctId: profile.userId,
          properties: {
            email: profile.email,
            name: profile.name,
            tier: profile.tier,
            registrationDate: profile.registrationDate,
            lastActive: profile.lastActive,
            totalJobs: profile.totalJobs,
            totalCreditsUsed: profile.totalCreditsUsed,
            ...profile.properties
          }
        });
      }

      // Store profile in Redis
      await this.redisClient.setex(
        `user_profile:${profile.userId}`,
        86400, // 24 hours
        JSON.stringify(profile)
      );

      logger.debug('User profile identified:', profile.userId);
    } catch (error) {
      logger.error('Failed to identify user profile:', error);
    }
  }

  // Session Management
  async startSession(sessionData: Partial<SessionData>): Promise<string> {
    try {
      const sessionId = sessionData.sessionId || uuidv4();
      const session: SessionData = {
        sessionId,
        userId: sessionData.userId,
        startTime: new Date(),
        pageViews: 0,
        events: [],
        deviceInfo: sessionData.deviceInfo,
        ...sessionData
      };

      await this.redisClient.setex(
        `session:${sessionId}`,
        1800, // 30 minutes
        JSON.stringify(session)
      );

      // Track session start
      await this.track({
        userId: session.userId,
        sessionId,
        event: 'Session Started',
        properties: {
          deviceInfo: session.deviceInfo
        }
      });

      return sessionId;
    } catch (error) {
      logger.error('Failed to start session:', error);
      return '';
    }
  }

  async endSession(sessionId: string): Promise<void> {
    try {
      const sessionData = await this.getSession(sessionId);
      if (sessionData) {
        sessionData.endTime = new Date();
        sessionData.duration = sessionData.endTime.getTime() - sessionData.startTime.getTime();

        // Track session end
        await this.track({
          userId: sessionData.userId,
          sessionId,
          event: 'Session Ended',
          properties: {
            duration: sessionData.duration,
            pageViews: sessionData.pageViews,
            eventCount: sessionData.events.length
          }
        });

        // Update session in Redis
        await this.redisClient.setex(
          `session:${sessionId}`,
          86400, // Keep for 24 hours for analytics
          JSON.stringify(sessionData)
        );
      }
    } catch (error) {
      logger.error('Failed to end session:', error);
    }
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    try {
      const sessionJson = await this.redisClient.get(`session:${sessionId}`);
      if (sessionJson) {
        const session = JSON.parse(sessionJson) as SessionData;
        session.startTime = new Date(session.startTime);
        if (session.endTime) {
          session.endTime = new Date(session.endTime);
        }
        return session;
      }
      return null;
    } catch (error) {
      logger.error('Failed to get session:', error);
      return null;
    }
  }

  // Page View Tracking
  async trackPageView(userId: string, sessionId: string, page: string, properties?: Record<string, any>): Promise<void> {
    try {
      // Update session page views
      const session = await this.getSession(sessionId);
      if (session) {
        session.pageViews++;
        await this.redisClient.setex(
          `session:${sessionId}`,
          1800,
          JSON.stringify(session)
        );
      }

      // Track page view event
      await this.track({
        userId,
        sessionId,
        event: 'Page Viewed',
        properties: {
          page,
          ...properties
        }
      });
    } catch (error) {
      logger.error('Failed to track page view:', error);
    }
  }

  // Business Event Tracking
  async trackJobCreated(userId: string, jobData: any): Promise<void> {
    await this.track({
      userId,
      event: 'Job Created',
      properties: {
        jobType: jobData.type,
        profileId: jobData.profileId,
        priority: jobData.priority,
        estimatedCredits: jobData.estimatedCredits
      }
    });
  }

  async trackJobCompleted(userId: string, jobData: any): Promise<void> {
    await this.track({
      userId,
      event: 'Job Completed',
      properties: {
        jobId: jobData.id,
        jobType: jobData.type,
        duration: jobData.duration,
        creditsUsed: jobData.creditsUsed,
        success: jobData.status === 'completed'
      }
    });
  }

  async trackFileUploaded(userId: string, uploadData: any): Promise<void> {
    await this.track({
      userId,
      event: 'File Uploaded',
      properties: {
        fileSize: uploadData.size,
        fileType: uploadData.type,
        fileName: uploadData.name,
        uploadMethod: uploadData.method
      }
    });
  }

  async trackCreditsPurchased(userId: string, purchaseData: any): Promise<void> {
    await this.track({
      userId,
      event: 'Credits Purchased',
      properties: {
        amount: purchaseData.amount,
        credits: purchaseData.credits,
        paymentMethod: purchaseData.paymentMethod,
        plan: purchaseData.plan
      }
    });
  }

  async trackUserRegistered(userId: string, registrationData: any): Promise<void> {
    await this.track({
      userId,
      event: 'User Registered',
      properties: {
        source: registrationData.source,
        method: registrationData.method,
        tier: registrationData.tier,
        referralCode: registrationData.referralCode
      }
    });
  }

  async trackFeatureUsed(userId: string, feature: string, properties?: Record<string, any>): Promise<void> {
    await this.track({
      userId,
      event: 'Feature Used',
      properties: {
        feature,
        ...properties
      }
    });
  }

  // Real-time Analytics
  async getRealtimeStats(): Promise<any> {
    try {
      const stats = {
        activeUsers: await this.getActiveUsersCount(),
        activeSessions: await this.getActiveSessionsCount(),
        recentEvents: await this.getRecentEvents(50),
        topEvents: await this.getTopEvents()
      };
      return stats;
    } catch (error) {
      logger.error('Failed to get realtime stats:', error);
      return {};
    }
  }

  private async enrichEvent(event: AnalyticsEvent): Promise<AnalyticsEvent> {
    return {
      ...event,
      timestamp: event.timestamp || new Date(),
      properties: {
        ...event.properties,
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version
      }
    };
  }

  private async storeEventInRedis(event: AnalyticsEvent): Promise<void> {
    try {
      // Store for real-time analytics
      const eventKey = `events:${new Date().toISOString().split('T')[0]}`;
      await this.redisClient.lpush(eventKey, JSON.stringify(event));
      await this.redisClient.expire(eventKey, 86400); // Keep for 24 hours

      // Update event counters
      const counterKey = `event_count:${event.event}:${new Date().toISOString().split('T')[0]}`;
      await this.redisClient.incr(counterKey);
      await this.redisClient.expire(counterKey, 86400);

      // Update user activity
      if (event.userId) {
        await this.redisClient.setex(
          `user_last_active:${event.userId}`,
          3600, // 1 hour
          new Date().toISOString()
        );
      }
    } catch (error) {
      logger.error('Failed to store event in Redis:', error);
    }
  }

  private async getActiveUsersCount(): Promise<number> {
    try {
      const keys = await this.redisClient.keys('user_last_active:*');
      return keys.length;
    } catch (error) {
      logger.error('Failed to get active users count:', error);
      return 0;
    }
  }

  private async getActiveSessionsCount(): Promise<number> {
    try {
      const keys = await this.redisClient.keys('session:*');
      return keys.length;
    } catch (error) {
      logger.error('Failed to get active sessions count:', error);
      return 0;
    }
  }

  private async getRecentEvents(limit: number = 50): Promise<AnalyticsEvent[]> {
    try {
      const eventKey = `events:${new Date().toISOString().split('T')[0]}`;
      const events = await this.redisClient.lrange(eventKey, 0, limit - 1);
      return events.map(eventJson => JSON.parse(eventJson));
    } catch (error) {
      logger.error('Failed to get recent events:', error);
      return [];
    }
  }

  private async getTopEvents(): Promise<Array<{ event: string; count: number }>> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const keys = await this.redisClient.keys(`event_count:*:${today}`);
      
      const topEvents = await Promise.all(
        keys.map(async (key) => {
          const count = await this.redisClient.get(key);
          const event = key.split(':')[1];
          return { event, count: parseInt(count || '0') };
        })
      );

      return topEvents.sort((a, b) => b.count - a.count).slice(0, 10);
    } catch (error) {
      logger.error('Failed to get top events:', error);
      return [];
    }
  }

  // Cleanup and shutdown
  async shutdown(): Promise<void> {
    try {
      if (this.segmentClient) {
        await new Promise(resolve => this.segmentClient!.flush(resolve));
      }
      if (this.posthogClient) {
        await this.posthogClient.shutdown();
      }
      logger.info('Analytics service shutdown complete');
    } catch (error) {
      logger.error('Failed to shutdown analytics service:', error);
    }
  }
}

export const analyticsService = new AnalyticsService();