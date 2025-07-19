"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackingSuite = exports.analyticsMiddleware = exports.AnalyticsMiddleware = void 0;
const analytics_service_1 = require("../services/analytics/analytics.service");
const logger_1 = require("../utils/logger");
const uuid_1 = require("uuid");
class AnalyticsMiddleware {
    options;
    constructor(options = {}) {
        this.options = {
            trackPageViews: true,
            trackApiCalls: true,
            excludePaths: ['/health', '/metrics', '/favicon.ico'],
            includeRequestData: false,
            sessionTimeout: 1800,
            ...options
        };
    }
    middleware() {
        return async (req, res, next) => {
            try {
                if (this.shouldExcludePath(req.path)) {
                    return next();
                }
                await this.initializeSession(req);
                this.attachAnalyticsHelpers(req);
                if (this.options.trackPageViews && !req.path.startsWith('/api/')) {
                    await this.trackPageView(req);
                }
                if (this.options.trackApiCalls && req.path.startsWith('/api/')) {
                    await this.trackApiCall(req);
                }
                this.addResponseTracking(req, res);
                next();
            }
            catch (error) {
                logger_1.logger.error('Analytics middleware error:', error);
                next();
            }
        };
    }
    sessionMiddleware() {
        return async (req, res, next) => {
            try {
                const sessionId = req.sessionId || req.headers['x-session-id'] || req.cookies?.sessionId;
                if (sessionId) {
                    req.sessionId = sessionId;
                    const session = await analytics_service_1.analyticsService.getSession(sessionId);
                    if (session) {
                        req.sessionId = sessionId;
                    }
                    else {
                        req.sessionId = await this.createNewSession(req);
                    }
                }
                else {
                    req.sessionId = await this.createNewSession(req);
                    res.cookie('sessionId', req.sessionId, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        maxAge: this.options.sessionTimeout * 1000
                    });
                }
                next();
            }
            catch (error) {
                logger_1.logger.error('Session middleware error:', error);
                next();
            }
        };
    }
    userMiddleware() {
        return async (req, res, next) => {
            try {
                const userId = req.user?.id || req.headers['x-user-id'];
                if (userId && req.sessionId) {
                    const session = await analytics_service_1.analyticsService.getSession(req.sessionId);
                    if (session && !session.userId) {
                        session.userId = userId;
                    }
                    if (session && !session.userId) {
                        await analytics_service_1.analyticsService.track({
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
            }
            catch (error) {
                logger_1.logger.error('User middleware error:', error);
                next();
            }
        };
    }
    businessEventsMiddleware() {
        return async (req, res, next) => {
            try {
                const originalSend = res.send;
                const self = this;
                res.send = function (data) {
                    self.trackBusinessEvent(req, res, data);
                    return originalSend.call(this, data);
                };
                next();
            }
            catch (error) {
                logger_1.logger.error('Business events middleware error:', error);
                next();
            }
        };
    }
    shouldExcludePath(path) {
        return this.options.excludePaths.some(excludePath => path.startsWith(excludePath));
    }
    async initializeSession(req) {
        if (!req.sessionId) {
            const sessionId = req.headers['x-session-id'] ||
                req.cookies?.sessionId ||
                (0, uuid_1.v4)();
            req.sessionId = sessionId;
            const existingSession = await analytics_service_1.analyticsService.getSession(sessionId);
            if (!existingSession) {
                await analytics_service_1.analyticsService.startSession({
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
    attachAnalyticsHelpers(req) {
        req.analytics = {
            track: async (event, properties) => {
                await analytics_service_1.analyticsService.track({
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
            identify: async (userId, traits) => {
                await analytics_service_1.analyticsService.identify({
                    userId,
                    ...traits
                });
            },
            pageView: async (page, properties) => {
                await analytics_service_1.analyticsService.trackPageView(req.user?.id || 'anonymous', req.sessionId, page, properties);
            }
        };
    }
    async trackPageView(req) {
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
        await analytics_service_1.analyticsService.trackPageView(userId, req.sessionId, req.path, properties);
    }
    async trackApiCall(req) {
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
        await analytics_service_1.analyticsService.track({
            userId,
            sessionId: req.sessionId,
            event: 'API Call',
            properties
        });
    }
    addResponseTracking(req, res) {
        const startTime = Date.now();
        const originalSend = res.send;
        res.send = function (data) {
            const duration = Date.now() - startTime;
            analytics_service_1.analyticsService.track({
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
    async createNewSession(req) {
        return await analytics_service_1.analyticsService.startSession({
            userId: req.user?.id,
            deviceInfo: {
                userAgent: req.headers['user-agent'] || '',
                ip: this.getClientIP(req),
                browser: this.extractBrowser(req.headers['user-agent']),
                os: this.extractOS(req.headers['user-agent'])
            }
        });
    }
    async trackBusinessEvent(req, res, responseData) {
        try {
            const userId = req.user?.id;
            if (!userId)
                return;
            if (req.path === '/api/jobs' && req.method === 'POST' && res.statusCode === 201) {
                await analytics_service_1.analyticsService.trackJobCreated(userId, responseData.data);
            }
            else if (req.path.match(/\/api\/jobs\/.*\/status/) && req.method === 'PUT') {
                if (responseData.data?.status === 'completed') {
                    await analytics_service_1.analyticsService.trackJobCompleted(userId, responseData.data);
                }
            }
            else if (req.path === '/api/upload' && req.method === 'POST' && res.statusCode === 200) {
                await analytics_service_1.analyticsService.trackFileUploaded(userId, responseData.data);
            }
            else if (req.path === '/api/credits/purchase' && req.method === 'POST' && res.statusCode === 200) {
                await analytics_service_1.analyticsService.trackCreditsPurchased(userId, responseData.data);
            }
            else if (req.path === '/api/auth/register' && req.method === 'POST' && res.statusCode === 201) {
                await analytics_service_1.analyticsService.trackUserRegistered(userId, responseData.data);
            }
        }
        catch (error) {
            logger_1.logger.error('Error tracking business event:', error);
        }
    }
    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0] ||
            req.headers['x-real-ip'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            '';
    }
    extractBrowser(userAgent) {
        if (!userAgent)
            return 'unknown';
        if (userAgent.includes('Chrome'))
            return 'Chrome';
        if (userAgent.includes('Firefox'))
            return 'Firefox';
        if (userAgent.includes('Safari'))
            return 'Safari';
        if (userAgent.includes('Edge'))
            return 'Edge';
        if (userAgent.includes('Opera'))
            return 'Opera';
        return 'unknown';
    }
    extractOS(userAgent) {
        if (!userAgent)
            return 'unknown';
        if (userAgent.includes('Windows'))
            return 'Windows';
        if (userAgent.includes('Mac OS'))
            return 'macOS';
        if (userAgent.includes('Linux'))
            return 'Linux';
        if (userAgent.includes('Android'))
            return 'Android';
        if (userAgent.includes('iOS'))
            return 'iOS';
        return 'unknown';
    }
}
exports.AnalyticsMiddleware = AnalyticsMiddleware;
exports.analyticsMiddleware = new AnalyticsMiddleware();
exports.trackingSuite = {
    analytics: exports.analyticsMiddleware.middleware(),
    session: exports.analyticsMiddleware.sessionMiddleware(),
    user: exports.analyticsMiddleware.userMiddleware(),
    businessEvents: exports.analyticsMiddleware.businessEventsMiddleware()
};
//# sourceMappingURL=analytics.middleware.js.map