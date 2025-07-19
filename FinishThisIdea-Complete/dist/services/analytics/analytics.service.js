"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsService = exports.AnalyticsService = void 0;
const mixpanel_1 = __importDefault(require("mixpanel"));
const analytics_node_1 = __importDefault(require("analytics-node"));
const posthog_node_1 = require("posthog-node");
const redis_service_1 = require("../redis/redis.service");
const logger_1 = require("../../utils/logger");
const uuid_1 = require("uuid");
class AnalyticsService {
    mixpanelClient;
    segmentClient;
    posthogClient;
    redisService;
    isEnabled = false;
    constructor() {
        this.redisService = redis_service_1.RedisService.getInstance();
        this.initialize();
    }
    initialize() {
        try {
            if (process.env.MIXPANEL_TOKEN) {
                this.mixpanelClient = mixpanel_1.default.init(process.env.MIXPANEL_TOKEN, {
                    debug: process.env.NODE_ENV === 'development',
                    protocol: 'https'
                });
                logger_1.logger.info('Mixpanel analytics initialized');
            }
            if (process.env.SEGMENT_WRITE_KEY) {
                this.segmentClient = new analytics_node_1.default(process.env.SEGMENT_WRITE_KEY, {
                    flushAt: 20,
                    flushInterval: 10000
                });
                logger_1.logger.info('Segment analytics initialized');
            }
            if (process.env.POSTHOG_API_KEY) {
                this.posthogClient = new posthog_node_1.PostHog(process.env.POSTHOG_API_KEY, {
                    host: process.env.POSTHOG_HOST || 'https://app.posthog.com'
                });
                logger_1.logger.info('PostHog analytics initialized');
            }
            this.isEnabled = !!(this.mixpanelClient || this.segmentClient || this.posthogClient);
            if (!this.isEnabled) {
                logger_1.logger.warn('No analytics providers configured - analytics disabled');
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize analytics service:', error);
        }
    }
    async track(event) {
        if (!this.isEnabled)
            return;
        try {
            const enrichedEvent = await this.enrichEvent(event);
            if (this.mixpanelClient && enrichedEvent.userId) {
                this.mixpanelClient.track(enrichedEvent.event, {
                    distinct_id: enrichedEvent.userId,
                    ...enrichedEvent.properties,
                    $ip: enrichedEvent.ip,
                    time: enrichedEvent.timestamp?.getTime()
                });
            }
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
            await this.storeEventInRedis(enrichedEvent);
            logger_1.logger.debug('Analytics event tracked:', {
                event: enrichedEvent.event,
                userId: enrichedEvent.userId,
                sessionId: enrichedEvent.sessionId
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to track analytics event:', error);
        }
    }
    async identify(profile) {
        if (!this.isEnabled)
            return;
        try {
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
            await this.redisService.setex(`user_profile:${profile.userId}`, 86400, JSON.stringify(profile));
            logger_1.logger.debug('User profile identified:', profile.userId);
        }
        catch (error) {
            logger_1.logger.error('Failed to identify user profile:', error);
        }
    }
    async startSession(sessionData) {
        try {
            const sessionId = sessionData.sessionId || (0, uuid_1.v4)();
            const session = {
                sessionId,
                userId: sessionData.userId,
                startTime: new Date(),
                pageViews: 0,
                events: [],
                deviceInfo: sessionData.deviceInfo,
                ...sessionData
            };
            await this.redisService.setex(`session:${sessionId}`, 1800, JSON.stringify(session));
            await this.track({
                userId: session.userId,
                sessionId,
                event: 'Session Started',
                properties: {
                    deviceInfo: session.deviceInfo
                }
            });
            return sessionId;
        }
        catch (error) {
            logger_1.logger.error('Failed to start session:', error);
            return '';
        }
    }
    async endSession(sessionId) {
        try {
            const sessionData = await this.getSession(sessionId);
            if (sessionData) {
                sessionData.endTime = new Date();
                sessionData.duration = sessionData.endTime.getTime() - sessionData.startTime.getTime();
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
                await this.redisService.setex(`session:${sessionId}`, 86400, JSON.stringify(sessionData));
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to end session:', error);
        }
    }
    async getSession(sessionId) {
        try {
            const sessionJson = await this.redisService.get(`session:${sessionId}`);
            if (sessionJson) {
                const session = JSON.parse(sessionJson);
                session.startTime = new Date(session.startTime);
                if (session.endTime) {
                    session.endTime = new Date(session.endTime);
                }
                return session;
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get session:', error);
            return null;
        }
    }
    async trackPageView(userId, sessionId, page, properties) {
        try {
            const session = await this.getSession(sessionId);
            if (session) {
                session.pageViews++;
                await this.redisService.setex(`session:${sessionId}`, 1800, JSON.stringify(session));
            }
            await this.track({
                userId,
                sessionId,
                event: 'Page Viewed',
                properties: {
                    page,
                    ...properties
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to track page view:', error);
        }
    }
    async trackJobCreated(userId, jobData) {
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
    async trackJobCompleted(userId, jobData) {
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
    async trackFileUploaded(userId, uploadData) {
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
    async trackCreditsPurchased(userId, purchaseData) {
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
    async trackUserRegistered(userId, registrationData) {
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
    async trackFeatureUsed(userId, feature, properties) {
        await this.track({
            userId,
            event: 'Feature Used',
            properties: {
                feature,
                ...properties
            }
        });
    }
    async getRealtimeStats() {
        try {
            const stats = {
                activeUsers: await this.getActiveUsersCount(),
                activeSessions: await this.getActiveSessionsCount(),
                recentEvents: await this.getRecentEvents(50),
                topEvents: await this.getTopEvents()
            };
            return stats;
        }
        catch (error) {
            logger_1.logger.error('Failed to get realtime stats:', error);
            return {};
        }
    }
    async enrichEvent(event) {
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
    async storeEventInRedis(event) {
        try {
            const eventKey = `events:${new Date().toISOString().split('T')[0]}`;
            await this.redisService.lpush(eventKey, JSON.stringify(event));
            await this.redisService.expire(eventKey, 86400);
            const counterKey = `event_count:${event.event}:${new Date().toISOString().split('T')[0]}`;
            await this.redisService.incr(counterKey);
            await this.redisService.expire(counterKey, 86400);
            if (event.userId) {
                await this.redisService.setex(`user_last_active:${event.userId}`, 3600, new Date().toISOString());
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to store event in Redis:', error);
        }
    }
    async getActiveUsersCount() {
        try {
            const keys = await this.redisService.keys('user_last_active:*');
            return keys.length;
        }
        catch (error) {
            logger_1.logger.error('Failed to get active users count:', error);
            return 0;
        }
    }
    async getActiveSessionsCount() {
        try {
            const keys = await this.redisService.keys('session:*');
            return keys.length;
        }
        catch (error) {
            logger_1.logger.error('Failed to get active sessions count:', error);
            return 0;
        }
    }
    async getRecentEvents(limit = 50) {
        try {
            const eventKey = `events:${new Date().toISOString().split('T')[0]}`;
            const events = await this.redisService.lrange(eventKey, 0, limit - 1);
            return events.map(eventJson => JSON.parse(eventJson));
        }
        catch (error) {
            logger_1.logger.error('Failed to get recent events:', error);
            return [];
        }
    }
    async getTopEvents() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const keys = await this.redisService.keys(`event_count:*:${today}`);
            const topEvents = await Promise.all(keys.map(async (key) => {
                const count = await this.redisService.get(key);
                const event = key.split(':')[1];
                return { event, count: parseInt(count || '0') };
            }));
            return topEvents.sort((a, b) => b.count - a.count).slice(0, 10);
        }
        catch (error) {
            logger_1.logger.error('Failed to get top events:', error);
            return [];
        }
    }
    async shutdown() {
        try {
            if (this.segmentClient) {
                await new Promise(resolve => this.segmentClient.flush(resolve));
            }
            if (this.posthogClient) {
                await this.posthogClient.shutdown();
            }
            logger_1.logger.info('Analytics service shutdown complete');
        }
        catch (error) {
            logger_1.logger.error('Failed to shutdown analytics service:', error);
        }
    }
}
exports.AnalyticsService = AnalyticsService;
exports.analyticsService = new AnalyticsService();
//# sourceMappingURL=analytics.service.js.map