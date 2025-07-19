"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.csrfService = exports.CSRFService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const redis_1 = require("../../config/redis");
const logger_1 = require("../../utils/logger");
const prometheus_metrics_service_1 = require("../monitoring/prometheus-metrics.service");
const defaultConfig = {
    secret: process.env.CSRF_SECRET || 'csrf-secret-change-in-production',
    tokenLength: 32,
    tokenTTL: 3600,
    cookieName: 'csrf-token',
    headerName: 'x-csrf-token',
    ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    trustedOrigins: [process.env.FRONTEND_URL || 'http://localhost:3000']
};
class CSRFService {
    static instance;
    config;
    constructor(config = {}) {
        this.config = { ...defaultConfig, ...config };
        if (this.config.secret === 'csrf-secret-change-in-production' && process.env.NODE_ENV === 'production') {
            throw new Error('CSRF_SECRET must be set in production environment');
        }
    }
    static getInstance(config) {
        if (!CSRFService.instance) {
            CSRFService.instance = new CSRFService(config);
        }
        return CSRFService.instance;
    }
    async generateToken(sessionId) {
        const tokenId = crypto_1.default.randomBytes(this.config.tokenLength).toString('hex');
        const timestamp = Date.now();
        const payload = { tokenId, timestamp, sessionId };
        const signature = this.createSignature(JSON.stringify(payload));
        const token = Buffer.from(JSON.stringify({ ...payload, signature })).toString('base64');
        const redisKey = `csrf:${tokenId}`;
        await redis_1.redis.setex(redisKey, this.config.tokenTTL, JSON.stringify(payload));
        logger_1.logger.debug('CSRF token generated', { tokenId, sessionId });
        return token;
    }
    async validateToken(token, sessionId) {
        try {
            const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
            const { tokenId, timestamp, sessionId: tokenSessionId, signature } = decoded;
            const payload = { tokenId, timestamp, sessionId: tokenSessionId };
            const expectedSignature = this.createSignature(JSON.stringify(payload));
            if (signature !== expectedSignature) {
                logger_1.logger.warn('CSRF token signature mismatch', { tokenId });
                prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'csrf_validation_signature_mismatch' });
                return false;
            }
            const redisKey = `csrf:${tokenId}`;
            const storedData = await redis_1.redis.get(redisKey);
            if (!storedData) {
                logger_1.logger.warn('CSRF token not found or expired', { tokenId });
                prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'csrf_validation_token_expired' });
                return false;
            }
            if (sessionId && tokenSessionId && sessionId !== tokenSessionId) {
                logger_1.logger.warn('CSRF token session mismatch', { tokenId, sessionId, tokenSessionId });
                prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'csrf_validation_session_mismatch' });
                return false;
            }
            const age = Date.now() - timestamp;
            if (age > this.config.tokenTTL * 1000) {
                logger_1.logger.warn('CSRF token too old', { tokenId, age });
                prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'csrf_validation_token_too_old' });
                return false;
            }
            logger_1.logger.debug('CSRF token validated successfully', { tokenId });
            return true;
        }
        catch (error) {
            logger_1.logger.error('CSRF token validation error', error);
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'csrf_validation_error' });
            return false;
        }
    }
    async invalidateToken(token) {
        try {
            const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
            const { tokenId } = decoded;
            const redisKey = `csrf:${tokenId}`;
            await redis_1.redis.del(redisKey);
            logger_1.logger.debug('CSRF token invalidated', { tokenId });
        }
        catch (error) {
            logger_1.logger.error('CSRF token invalidation error', error);
        }
    }
    createSignature(data) {
        return crypto_1.default.createHmac('sha256', this.config.secret).update(data).digest('hex');
    }
    middleware() {
        return async (req, res, next) => {
            const start = Date.now();
            try {
                if (this.config.ignoredMethods.includes(req.method)) {
                    return next();
                }
                const origin = req.get('origin') || req.get('referer');
                if (origin && this.config.trustedOrigins.some(trusted => origin.startsWith(trusted))) {
                    return next();
                }
                const token = req.get(this.config.headerName) ||
                    req.body?._csrf ||
                    req.query._csrf;
                if (!token) {
                    logger_1.logger.warn('CSRF token missing', {
                        method: req.method,
                        path: req.path,
                        ip: req.ip,
                        userAgent: req.get('user-agent')
                    });
                    prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'csrf_token_missing' });
                    return res.status(403).json({
                        success: false,
                        error: {
                            code: 'CSRF_TOKEN_MISSING',
                            message: 'CSRF token is required for this request'
                        }
                    });
                }
                const sessionId = req.session?.id || req.sessionID;
                const isValid = await this.validateToken(token, sessionId);
                if (!isValid) {
                    logger_1.logger.warn('CSRF token validation failed', {
                        method: req.method,
                        path: req.path,
                        ip: req.ip,
                        sessionId,
                        userAgent: req.get('user-agent')
                    });
                    prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'csrf_token_invalid' });
                    return res.status(403).json({
                        success: false,
                        error: {
                            code: 'CSRF_TOKEN_INVALID',
                            message: 'Invalid or expired CSRF token'
                        }
                    });
                }
                logger_1.logger.debug('CSRF validation passed', { path: req.path, sessionId });
                prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'csrf_validation' }, Date.now() - start);
                next();
            }
            catch (error) {
                logger_1.logger.error('CSRF middleware error', error);
                prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'csrf_middleware_error' });
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
    async generateTokenHandler(req, res) {
        try {
            const sessionId = req.session?.id || req.sessionID;
            const token = await this.generateToken(sessionId);
            res.cookie(this.config.cookieName, token, {
                httpOnly: false,
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
        }
        catch (error) {
            logger_1.logger.error('CSRF token generation error', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'TOKEN_GENERATION_ERROR',
                    message: 'Failed to generate CSRF token'
                }
            });
        }
    }
    async cleanupExpiredTokens() {
        try {
            const pattern = 'csrf:*';
            const keys = await redis_1.redis.keys(pattern);
            let deletedCount = 0;
            for (const key of keys) {
                const ttl = await redis_1.redis.ttl(key);
                if (ttl <= 0) {
                    await redis_1.redis.del(key);
                    deletedCount++;
                }
            }
            logger_1.logger.info('CSRF token cleanup completed', { deletedCount, totalKeys: keys.length });
            return deletedCount;
        }
        catch (error) {
            logger_1.logger.error('CSRF token cleanup error', error);
            return 0;
        }
    }
}
exports.CSRFService = CSRFService;
exports.csrfService = CSRFService.getInstance();
//# sourceMappingURL=csrf.service.js.map