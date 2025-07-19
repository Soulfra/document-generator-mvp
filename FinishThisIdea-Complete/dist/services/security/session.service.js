"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionService = exports.SessionService = void 0;
const express_session_1 = __importDefault(require("express-session"));
const connect_redis_1 = __importDefault(require("connect-redis"));
const redis_1 = require("../../config/redis");
const logger_1 = require("../../utils/logger");
const prometheus_metrics_service_1 = require("../monitoring/prometheus-metrics.service");
const crypto_1 = __importDefault(require("crypto"));
const defaultConfig = {
    secret: process.env.SESSION_SECRET || 'session-secret-change-in-production',
    maxAge: 24 * 60 * 60 * 1000,
    maxConcurrentSessions: 5,
    cookieName: 'finishthisidea.sid',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    enableSessionRotation: true,
    rotationInterval: 30
};
class SessionService {
    static instance;
    config;
    redisStore;
    constructor(config = {}) {
        this.config = { ...defaultConfig, ...config };
        if (this.config.secret === 'session-secret-change-in-production' && process.env.NODE_ENV === 'production') {
            throw new Error('SESSION_SECRET must be set in production environment');
        }
        this.redisStore = new connect_redis_1.default({
            client: redis_1.redis,
            prefix: 'sess:',
            ttl: Math.floor(this.config.maxAge / 1000)
        });
    }
    static getInstance(config) {
        if (!SessionService.instance) {
            SessionService.instance = new SessionService(config);
        }
        return SessionService.instance;
    }
    getSessionMiddleware() {
        return (0, express_session_1.default)({
            store: this.redisStore,
            secret: this.config.secret,
            name: this.config.cookieName,
            resave: false,
            saveUninitialized: false,
            rolling: true,
            cookie: {
                maxAge: this.config.maxAge,
                httpOnly: this.config.httpOnly,
                secure: this.config.secure,
                sameSite: this.config.sameSite,
                domain: this.config.domain
            }
        });
    }
    async createSession(userId, userData, req) {
        const start = Date.now();
        try {
            await this.enforceSessionLimit(userId);
            const sessionId = this.generateSessionId();
            const sessionData = {
                userId,
                loginTime: Date.now(),
                lastActivity: Date.now(),
                ipAddress: req.ip || 'unknown',
                userAgent: req.get('user-agent') || 'unknown',
                ...userData
            };
            const sessionKey = `sess:${sessionId}`;
            await redis_1.redis.setex(sessionKey, Math.floor(this.config.maxAge / 1000), JSON.stringify(sessionData));
            const userSessionsKey = `user_sessions:${userId}`;
            await redis_1.redis.sadd(userSessionsKey, sessionId);
            await redis_1.redis.expire(userSessionsKey, Math.floor(this.config.maxAge / 1000));
            logger_1.logger.info('Session created', {
                userId,
                sessionId,
                ipAddress: sessionData.ipAddress,
                userAgent: sessionData.userAgent.substring(0, 100)
            });
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'session_create' }, Date.now() - start);
            return sessionId;
        }
        catch (error) {
            logger_1.logger.error('Session creation error', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'session_create_error' });
            throw error;
        }
    }
    async getSession(sessionId) {
        const start = Date.now();
        try {
            const sessionKey = `sess:${sessionId}`;
            const data = await redis_1.redis.get(sessionKey);
            if (!data) {
                return null;
            }
            const sessionData = JSON.parse(data);
            sessionData.lastActivity = Date.now();
            await redis_1.redis.setex(sessionKey, Math.floor(this.config.maxAge / 1000), JSON.stringify(sessionData));
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'session_get' }, Date.now() - start);
            return sessionData;
        }
        catch (error) {
            logger_1.logger.error('Session retrieval error', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'session_get_error' });
            return null;
        }
    }
    async updateSession(sessionId, updates) {
        const start = Date.now();
        try {
            const currentData = await this.getSession(sessionId);
            if (!currentData) {
                throw new Error('Session not found');
            }
            const updatedData = { ...currentData, ...updates, lastActivity: Date.now() };
            const sessionKey = `sess:${sessionId}`;
            await redis_1.redis.setex(sessionKey, Math.floor(this.config.maxAge / 1000), JSON.stringify(updatedData));
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'session_update' }, Date.now() - start);
        }
        catch (error) {
            logger_1.logger.error('Session update error', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'session_update_error' });
            throw error;
        }
    }
    async destroySession(sessionId) {
        const start = Date.now();
        try {
            const sessionData = await this.getSession(sessionId);
            const sessionKey = `sess:${sessionId}`;
            await redis_1.redis.del(sessionKey);
            if (sessionData?.userId) {
                const userSessionsKey = `user_sessions:${sessionData.userId}`;
                await redis_1.redis.srem(userSessionsKey, sessionId);
                logger_1.logger.info('Session destroyed', {
                    userId: sessionData.userId,
                    sessionId,
                    ipAddress: sessionData.ipAddress
                });
            }
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'session_destroy' }, Date.now() - start);
        }
        catch (error) {
            logger_1.logger.error('Session destruction error', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'session_destroy_error' });
        }
    }
    async destroyAllUserSessions(userId, exceptSessionId) {
        const start = Date.now();
        try {
            const userSessionsKey = `user_sessions:${userId}`;
            const sessionIds = await redis_1.redis.smembers(userSessionsKey);
            const sessionsToDestroy = exceptSessionId
                ? sessionIds.filter(id => id !== exceptSessionId)
                : sessionIds;
            for (const sessionId of sessionsToDestroy) {
                const sessionKey = `sess:${sessionId}`;
                await redis_1.redis.del(sessionKey);
                await redis_1.redis.srem(userSessionsKey, sessionId);
            }
            logger_1.logger.info('All user sessions destroyed', {
                userId,
                destroyedCount: sessionsToDestroy.length,
                exceptSessionId
            });
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'session_destroy_all_user' }, Date.now() - start);
        }
        catch (error) {
            logger_1.logger.error('User sessions destruction error', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'session_destroy_all_user_error' });
        }
    }
    async enforceSessionLimit(userId) {
        const userSessionsKey = `user_sessions:${userId}`;
        const sessionIds = await redis_1.redis.smembers(userSessionsKey);
        if (sessionIds.length >= this.config.maxConcurrentSessions) {
            const sessionsWithActivity = [];
            for (const sessionId of sessionIds) {
                const sessionData = await this.getSession(sessionId);
                if (sessionData) {
                    sessionsWithActivity.push({
                        id: sessionId,
                        lastActivity: sessionData.lastActivity
                    });
                }
                else {
                    await redis_1.redis.srem(userSessionsKey, sessionId);
                }
            }
            sessionsWithActivity.sort((a, b) => a.lastActivity - b.lastActivity);
            const toRemove = sessionsWithActivity.slice(0, -this.config.maxConcurrentSessions + 1);
            for (const session of toRemove) {
                await this.destroySession(session.id);
            }
            logger_1.logger.info('Session limit enforced', {
                userId,
                removedSessions: toRemove.length,
                limit: this.config.maxConcurrentSessions
            });
        }
    }
    generateSessionId() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
    async blacklistSession(sessionId, reason) {
        const start = Date.now();
        try {
            const blacklistKey = `blacklist:${sessionId}`;
            await redis_1.redis.setex(blacklistKey, this.config.maxAge / 1000, reason);
            await this.destroySession(sessionId);
            logger_1.logger.warn('Session blacklisted', { sessionId, reason });
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'session_blacklist' }, Date.now() - start);
        }
        catch (error) {
            logger_1.logger.error('Session blacklisting error', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'session_blacklist_error' });
        }
    }
    async isSessionBlacklisted(sessionId) {
        try {
            const blacklistKey = `blacklist:${sessionId}`;
            const result = await redis_1.redis.exists(blacklistKey);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error('Session blacklist check error', error);
            return false;
        }
    }
    validationMiddleware() {
        return async (req, res, next) => {
            const start = Date.now();
            try {
                const sessionId = req.sessionID;
                if (!sessionId) {
                    return next();
                }
                if (await this.isSessionBlacklisted(sessionId)) {
                    logger_1.logger.warn('Blacklisted session attempted access', {
                        sessionId,
                        ip: req.ip,
                        path: req.path
                    });
                    req.session?.destroy(() => { });
                    return res.status(401).json({
                        success: false,
                        error: {
                            code: 'SESSION_BLACKLISTED',
                            message: 'Session has been terminated for security reasons'
                        }
                    });
                }
                if (this.config.enableSessionRotation && req.session && this.shouldRotateSession(req.session)) {
                    req.session.regenerate((err) => {
                        if (err) {
                            logger_1.logger.error('Session rotation error', err);
                        }
                        else {
                            logger_1.logger.debug('Session rotated', { oldSessionId: sessionId, newSessionId: req.sessionID });
                        }
                    });
                }
                prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'session_validation_middleware' }, Date.now() - start);
                next();
            }
            catch (error) {
                logger_1.logger.error('Session validation middleware error', error);
                prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'session_validation_middleware_error' });
                next();
            }
        };
    }
    shouldRotateSession(session) {
        if (!session.lastRotation) {
            session.lastRotation = Date.now();
            return false;
        }
        const timeSinceRotation = Date.now() - session.lastRotation;
        const rotationInterval = this.config.rotationInterval * 60 * 1000;
        if (timeSinceRotation > rotationInterval) {
            session.lastRotation = Date.now();
            return true;
        }
        return false;
    }
    async getUserActiveSessions(userId) {
        try {
            const userSessionsKey = `user_sessions:${userId}`;
            const sessionIds = await redis_1.redis.smembers(userSessionsKey);
            const sessions = [];
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
        }
        catch (error) {
            logger_1.logger.error('Get user active sessions error', error);
            return [];
        }
    }
    async cleanupExpiredSessions() {
        try {
            const pattern = 'sess:*';
            const keys = await redis_1.redis.keys(pattern);
            let cleanedCount = 0;
            for (const key of keys) {
                const ttl = await redis_1.redis.ttl(key);
                if (ttl <= 0) {
                    await redis_1.redis.del(key);
                    cleanedCount++;
                }
            }
            logger_1.logger.info('Session cleanup completed', { cleanedCount, totalKeys: keys.length });
            return cleanedCount;
        }
        catch (error) {
            logger_1.logger.error('Session cleanup error', error);
            return 0;
        }
    }
}
exports.SessionService = SessionService;
exports.sessionService = SessionService.getInstance();
//# sourceMappingURL=session.service.js.map