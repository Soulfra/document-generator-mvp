"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityMiddleware = exports.SecurityMiddleware = void 0;
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_slow_down_1 = __importDefault(require("express-slow-down"));
const logger_1 = require("../utils/logger");
const prometheus_metrics_service_1 = require("../services/monitoring/prometheus-metrics.service");
const csrf_service_1 = require("../services/security/csrf.service");
const input_validation_service_1 = require("../services/security/input-validation.service");
const session_service_1 = require("../services/security/session.service");
const defaultConfig = {
    enableCORS: true,
    enableRateLimit: true,
    enableCSRF: true,
    enableInputValidation: true,
    enableAttackPrevention: true,
    enableAPIVersioning: true,
    trustedOrigins: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        /^https:\/\/[a-z0-9-]+\.finishthisidea\.com$/,
        /^https:\/\/finishthisidea\.com$/,
        /^http:\/\/localhost:\d+$/
    ],
    rateLimitOptions: {
        windowMs: 15 * 60 * 1000,
        max: 100,
        skipSuccessfulRequests: false
    }
};
class SecurityMiddleware {
    static instance;
    config;
    constructor(config = {}) {
        this.config = { ...defaultConfig, ...config };
    }
    static getInstance(config) {
        if (!SecurityMiddleware.instance) {
            SecurityMiddleware.instance = new SecurityMiddleware(config);
        }
        return SecurityMiddleware.instance;
    }
    getCORSMiddleware() {
        if (!this.config.enableCORS) {
            return (req, res, next) => next();
        }
        return (0, cors_1.default)({
            origin: (origin, callback) => {
                if (!origin)
                    return callback(null, true);
                const isAllowed = this.config.trustedOrigins.some(trusted => {
                    if (typeof trusted === 'string') {
                        return origin === trusted;
                    }
                    if (trusted instanceof RegExp) {
                        return trusted.test(origin);
                    }
                    return false;
                });
                if (isAllowed) {
                    callback(null, true);
                }
                else {
                    logger_1.logger.warn('CORS request blocked', { origin, ip: origin });
                    prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'cors_blocked' });
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-API-Key',
                'X-CSRF-Token',
                'X-Requested-With',
                'X-Request-ID'
            ],
            exposedHeaders: [
                'X-RateLimit-Limit',
                'X-RateLimit-Remaining',
                'X-RateLimit-Reset',
                'X-API-Version',
                'X-Request-ID'
            ],
            maxAge: 86400
        });
    }
    getSecurityHeaders() {
        return (0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                    scriptSrc: [
                        "'self'",
                        "'unsafe-inline'",
                        "'unsafe-eval'",
                        "https://js.stripe.com",
                        "https://checkout.stripe.com"
                    ],
                    imgSrc: [
                        "'self'",
                        "data:",
                        "https:",
                        "https://*.stripe.com",
                        "https://*.amazonaws.com"
                    ],
                    connectSrc: [
                        "'self'",
                        "https://api.stripe.com",
                        "https://checkout.stripe.com",
                        "https://*.finishthisidea.com",
                        "wss://*.finishthisidea.com"
                    ],
                    fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com"],
                    objectSrc: ["'none'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["'none'", "https://js.stripe.com"],
                    childSrc: ["'none'"],
                    workerSrc: ["'self'"],
                    manifestSrc: ["'self'"]
                },
            },
            hsts: {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true
            },
            referrerPolicy: {
                policy: 'strict-origin-when-cross-origin'
            },
            crossOriginEmbedderPolicy: false,
            crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
            crossOriginResourcePolicy: { policy: 'cross-origin' }
        });
    }
    getRateLimitMiddleware() {
        if (!this.config.enableRateLimit) {
            return (req, res, next) => next();
        }
        return (0, express_rate_limit_1.default)({
            windowMs: this.config.rateLimitOptions.windowMs,
            max: (req) => {
                const userTier = req.user?.tier || 'seedling';
                const tierLimits = {
                    seedling: 50,
                    sprout: 100,
                    sapling: 200,
                    tree: 500,
                    forest: 1000
                };
                return tierLimits[userTier] || this.config.rateLimitOptions.max;
            },
            message: {
                success: false,
                error: {
                    code: 'RATE_LIMIT_EXCEEDED',
                    message: 'Too many requests, please try again later'
                }
            },
            standardHeaders: true,
            legacyHeaders: false,
            skipSuccessfulRequests: this.config.rateLimitOptions.skipSuccessfulRequests,
            skip: (req) => {
                return ['/health', '/metrics', '/api/health', '/api/metrics'].includes(req.path);
            },
            keyGenerator: (req) => {
                return req.user?.id || req.ip;
            },
            handler: (req, res) => {
                logger_1.logger.warn('Rate limit exceeded', {
                    ip: req.ip,
                    path: req.path,
                    method: req.method,
                    userAgent: req.get('user-agent'),
                    userId: req.user?.id
                });
                prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'rate_limit_exceeded' });
                res.status(429).json({
                    success: false,
                    error: {
                        code: 'RATE_LIMIT_EXCEEDED',
                        message: 'Too many requests, please try again later'
                    }
                });
            }
        });
    }
    getSlowDownMiddleware() {
        return (0, express_slow_down_1.default)({
            windowMs: 15 * 60 * 1000,
            delayAfter: 20,
            delayMs: 100,
            maxDelayMs: 2000,
            skipSuccessfulRequests: true
        });
    }
    getAttackPreventionMiddleware() {
        if (!this.config.enableAttackPrevention) {
            return (req, res, next) => next();
        }
        return (req, res, next) => {
            const start = Date.now();
            try {
                if (req.body && req.body.__proto__) {
                    logger_1.logger.warn('Prototype pollution attempt', {
                        ip: req.ip,
                        path: req.path,
                        userAgent: req.get('user-agent')
                    });
                    prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'prototype_pollution_blocked' });
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'INVALID_REQUEST',
                            message: 'Invalid request structure'
                        }
                    });
                }
                const contentLength = parseInt(req.get('content-length') || '0');
                const maxSize = 50 * 1024 * 1024;
                if (contentLength > maxSize) {
                    logger_1.logger.warn('Large payload rejected', {
                        ip: req.ip,
                        path: req.path,
                        contentLength
                    });
                    prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'large_payload_blocked' });
                    return res.status(413).json({
                        success: false,
                        error: {
                            code: 'PAYLOAD_TOO_LARGE',
                            message: 'Request entity too large'
                        }
                    });
                }
                const sanitize = (obj) => {
                    if (typeof obj === 'string') {
                        return obj.replace(/\0/g, '');
                    }
                    if (typeof obj === 'object' && obj !== null) {
                        const sanitized = Array.isArray(obj) ? [] : {};
                        for (const key in obj) {
                            if (obj.hasOwnProperty(key)) {
                                sanitized[key] = sanitize(obj[key]);
                            }
                        }
                        return sanitized;
                    }
                    return obj;
                };
                req.body = sanitize(req.body);
                req.query = sanitize(req.query);
                req.params = sanitize(req.params);
                const requestData = JSON.stringify({
                    body: req.body,
                    query: req.query,
                    params: req.params
                });
                if (this.config.enableInputValidation) {
                    const validation = input_validation_service_1.inputValidationService.validateInput(requestData);
                    if (!validation.isValid && validation.threats.length > 0) {
                        logger_1.logger.warn('Suspicious request patterns detected', {
                            ip: req.ip,
                            path: req.path,
                            method: req.method,
                            threats: validation.threats,
                            userAgent: req.get('user-agent')
                        });
                        prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'suspicious_pattern_blocked' });
                        return res.status(400).json({
                            success: false,
                            error: {
                                code: 'INVALID_REQUEST',
                                message: 'Request contains potentially harmful content'
                            }
                        });
                    }
                }
                prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'attack_prevention_middleware' }, Date.now() - start);
                next();
            }
            catch (error) {
                logger_1.logger.error('Attack prevention middleware error', error);
                prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'attack_prevention_error' });
                next();
            }
        };
    }
    getAPIVersioningMiddleware() {
        if (!this.config.enableAPIVersioning) {
            return (req, res, next) => next();
        }
        return (req, res, next) => {
            const version = req.headers['api-version'] ||
                req.headers['x-api-version'] ||
                process.env.API_VERSION ||
                'v1';
            req.apiVersion = version;
            res.setHeader('X-API-Version', version);
            next();
        };
    }
    getRequestTrackingMiddleware() {
        return (req, res, next) => {
            const requestId = req.headers['x-request-id'] ||
                req.headers['x-correlation-id'] ||
                `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            req.requestId = requestId;
            res.setHeader('X-Request-ID', requestId);
            next();
        };
    }
    applySecurityMiddleware(app) {
        logger_1.logger.info('Applying enhanced security middleware stack');
        app.use(this.getRequestTrackingMiddleware());
        app.use(this.getSecurityHeaders());
        app.use(this.getCORSMiddleware());
        app.use(this.getAttackPreventionMiddleware());
        app.use(this.getAPIVersioningMiddleware());
        app.use(session_service_1.sessionService.validationMiddleware());
        app.use(this.getSlowDownMiddleware());
        app.use(this.getRateLimitMiddleware());
        if (this.config.enableCSRF) {
            app.use('/api/csrf/token', (req, res) => csrf_service_1.csrfService.generateTokenHandler(req, res));
            app.use(csrf_service_1.csrfService.middleware());
        }
        if (this.config.enableInputValidation) {
            app.use(input_validation_service_1.inputValidationService.middleware({
                validateBody: true,
                validateQuery: true,
                validateParams: true
            }));
        }
        logger_1.logger.info('Enhanced security middleware stack applied successfully', {
            cors: this.config.enableCORS,
            rateLimit: this.config.enableRateLimit,
            csrf: this.config.enableCSRF,
            inputValidation: this.config.enableInputValidation,
            attackPrevention: this.config.enableAttackPrevention,
            apiVersioning: this.config.enableAPIVersioning
        });
    }
    createEndpointLimiters() {
        return {
            auth: (0, express_rate_limit_1.default)({
                windowMs: 15 * 60 * 1000,
                max: 5,
                message: {
                    success: false,
                    error: {
                        code: 'AUTH_RATE_LIMIT',
                        message: 'Too many authentication attempts'
                    }
                }
            }),
            api: (0, express_rate_limit_1.default)({
                windowMs: 60 * 1000,
                max: 60,
                message: {
                    success: false,
                    error: {
                        code: 'API_RATE_LIMIT',
                        message: 'API rate limit exceeded'
                    }
                }
            }),
            upload: (0, express_rate_limit_1.default)({
                windowMs: 60 * 60 * 1000,
                max: 10,
                message: {
                    success: false,
                    error: {
                        code: 'UPLOAD_RATE_LIMIT',
                        message: 'Upload rate limit exceeded'
                    }
                }
            }),
            payment: (0, express_rate_limit_1.default)({
                windowMs: 60 * 1000,
                max: 3,
                message: {
                    success: false,
                    error: {
                        code: 'PAYMENT_RATE_LIMIT',
                        message: 'Payment rate limit exceeded'
                    }
                }
            })
        };
    }
}
exports.SecurityMiddleware = SecurityMiddleware;
exports.securityMiddleware = SecurityMiddleware.getInstance();
//# sourceMappingURL=security-enhanced.middleware.js.map