"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = exports.slowDownConfigs = exports.rateLimitConfigs = exports.commonSchemas = void 0;
exports.threatDetection = threatDetection;
exports.secretsProtection = secretsProtection;
exports.validateRequest = validateRequest;
exports.securityHeaders = securityHeaders;
exports.securityMonitoring = securityMonitoring;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const express_slow_down_1 = __importDefault(require("express-slow-down"));
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const presence_logger_1 = require("../monitoring/presence-logger");
exports.commonSchemas = {
    uuid: zod_1.z.string().uuid('Invalid UUID format'),
    email: zod_1.z.string().email('Invalid email format').max(255),
    safeString: zod_1.z.string().max(1000).refine((str) => !/<script|javascript:|on\w+=/i.test(str), 'Potentially unsafe content detected'),
    fileName: zod_1.z.string().max(255).refine((name) => /^[a-zA-Z0-9._-]+$/.test(name), 'Invalid file name format'),
    apiKey: zod_1.z.string().min(20).max(100).refine((key) => /^[a-zA-Z0-9_-]+$/.test(key), 'Invalid API key format'),
    pagination: zod_1.z.object({
        page: zod_1.z.coerce.number().min(1).max(1000).default(1),
        limit: zod_1.z.coerce.number().min(1).max(100).default(20)
    })
};
exports.rateLimitConfigs = {
    auth: (0, express_rate_limit_1.default)({
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: {
            error: 'Too many authentication attempts',
            retryAfter: '15 minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
        keyGenerator: (req) => {
            return `${req.ip}-${req.get('User-Agent')?.slice(0, 50) || 'unknown'}`;
        }
    }),
    payment: (0, express_rate_limit_1.default)({
        windowMs: 60 * 1000,
        max: 3,
        message: {
            error: 'Too many payment attempts',
            retryAfter: '1 minute'
        },
        standardHeaders: true,
        legacyHeaders: false
    }),
    api: (0, express_rate_limit_1.default)({
        windowMs: 60 * 1000,
        max: 60,
        message: {
            error: 'API rate limit exceeded',
            retryAfter: '1 minute'
        },
        standardHeaders: true,
        legacyHeaders: false
    }),
    general: (0, express_rate_limit_1.default)({
        windowMs: 60 * 1000,
        max: 100,
        message: {
            error: 'Rate limit exceeded',
            retryAfter: '1 minute'
        },
        standardHeaders: true,
        legacyHeaders: false
    }),
    upload: (0, express_rate_limit_1.default)({
        windowMs: 60 * 1000,
        max: 5,
        message: {
            error: 'Upload rate limit exceeded',
            retryAfter: '1 minute'
        },
        standardHeaders: true,
        legacyHeaders: false
    })
};
exports.slowDownConfigs = {
    api: (0, express_slow_down_1.default)({
        windowMs: 60 * 1000,
        delayAfter: 30,
        delayMs: 100,
        maxDelayMs: 5000
    })
};
function threatDetection() {
    return async (req, res, next) => {
        try {
            const threats = [];
            const sqlPatterns = [
                /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i,
                /('|(\\')|(;)|(\*)|(%27)|(\%27)/i
            ];
            const xssPatterns = [
                /<script[^>]*>.*?<\/script>/gi,
                /javascript:/gi,
                /on\w+\s*=/gi,
                /<iframe[^>]*>.*?<\/iframe>/gi
            ];
            const cmdPatterns = [
                /(\||;|&|`|\$\(|\$\{)/,
                /(nc|netcat|wget|curl|bash|sh|cmd|powershell)/i
            ];
            const checkData = [
                JSON.stringify(req.body || {}),
                JSON.stringify(req.query || {}),
                req.get('User-Agent') || '',
                req.url
            ].join(' ');
            if (sqlPatterns.some(pattern => pattern.test(checkData))) {
                threats.push('SQL_INJECTION');
            }
            if (xssPatterns.some(pattern => pattern.test(checkData))) {
                threats.push('XSS_ATTEMPT');
            }
            if (cmdPatterns.some(pattern => pattern.test(checkData))) {
                threats.push('COMMAND_INJECTION');
            }
            const suspiciousHeaders = [
                'x-forwarded-for',
                'x-real-ip',
                'x-cluster-client-ip'
            ];
            suspiciousHeaders.forEach(header => {
                const value = req.get(header);
                if (value && (value.includes('127.0.0.1') || value.includes('localhost'))) {
                    threats.push('HEADER_MANIPULATION');
                }
            });
            if (threats.length > 0) {
                await presence_logger_1.presenceLogger.logUserPresence('security_threat_detected', {
                    userId: 'anonymous',
                    metadata: {
                        threats,
                        ip: req.ip,
                        userAgent: req.get('User-Agent'),
                        url: req.url,
                        method: req.method,
                        body: req.body,
                        query: req.query
                    }
                });
                logger_1.logger.warn('Security threat detected', {
                    threats,
                    ip: req.ip,
                    userAgent: req.get('User-Agent'),
                    url: req.url,
                    method: req.method
                });
                return res.status(403).json({
                    error: 'Security violation detected',
                    code: 'SECURITY_THREAT',
                    threats: threats.length
                });
            }
            next();
        }
        catch (error) {
            logger_1.logger.error('Threat detection middleware error', { error });
            next();
        }
    };
}
function secretsProtection() {
    return (req, res, next) => {
        const originalJson = res.json;
        res.json = function (obj) {
            if (obj && typeof obj === 'object') {
                obj = sanitizeSecrets(obj);
            }
            return originalJson.call(this, obj);
        };
        next();
    };
}
function sanitizeSecrets(obj) {
    if (!obj || typeof obj !== 'object')
        return obj;
    const secretKeys = [
        'password',
        'secret',
        'key',
        'token',
        'apiKey',
        'api_key',
        'accessToken',
        'refreshToken',
        'privateKey',
        'stripe',
        'anthropic',
        'openai'
    ];
    const sanitized = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
        const isSecret = secretKeys.some(secretKey => key.toLowerCase().includes(secretKey.toLowerCase()));
        if (isSecret && typeof value === 'string') {
            sanitized[key] = value.length > 8
                ? `${value.slice(0, 4)}****${value.slice(-4)}`
                : '****';
        }
        else if (value && typeof value === 'object') {
            sanitized[key] = sanitizeSecrets(value);
        }
        else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}
exports.corsOptions = {
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        const allowedOrigins = [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000'
        ];
        if (process.env.NODE_ENV === 'production') {
            const prodDomain = process.env.DOMAIN;
            if (prodDomain) {
                allowedOrigins.push(`https://${prodDomain}`);
                allowedOrigins.push(`https://www.${prodDomain}`);
            }
        }
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            logger_1.logger.warn('CORS blocked origin', { origin, allowed: allowedOrigins });
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Request-ID',
        'X-API-Key',
        'Accept',
        'Origin'
    ],
    exposedHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset'
    ],
    maxAge: 86400
};
function validateRequest(schema) {
    return (req, res, next) => {
        try {
            if (schema.body) {
                req.body = schema.body.parse(req.body);
            }
            if (schema.query) {
                req.query = schema.query.parse(req.query);
            }
            if (schema.params) {
                req.params = schema.params.parse(req.params);
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const validationErrors = error.errors.map(err => ({
                    field: err.path.join('.'),
                    message: err.message,
                    received: err.received
                }));
                logger_1.logger.warn('Request validation failed', {
                    url: req.url,
                    method: req.method,
                    errors: validationErrors
                });
                return res.status(400).json({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: validationErrors
                });
            }
            next(error);
        }
    };
}
function securityHeaders() {
    return (req, res, next) => {
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.removeHeader('X-Powered-By');
        res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
        if (req.accepts('html')) {
            res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'");
        }
        next();
    };
}
function securityMonitoring() {
    return async (req, res, next) => {
        const startTime = Date.now();
        const suspiciousIndicators = [];
        if (req.ip) {
        }
        const contentLength = parseInt(req.get('content-length') || '0');
        if (contentLength > 50 * 1024 * 1024) {
            suspiciousIndicators.push('LARGE_PAYLOAD');
        }
        const userAgent = req.get('User-Agent') || '';
        const suspiciousAgents = ['bot', 'crawler', 'spider', 'scraper'];
        if (suspiciousAgents.some(agent => userAgent.toLowerCase().includes(agent))) {
            suspiciousIndicators.push('SUSPICIOUS_USER_AGENT');
        }
        const securityEndpoints = ['/api/auth/', '/api/payment/', '/api/api-keys/', '/api/admin/'];
        const isSecurityEndpoint = securityEndpoints.some(endpoint => req.path.startsWith(endpoint));
        if (isSecurityEndpoint || suspiciousIndicators.length > 0) {
            await presence_logger_1.presenceLogger.logUserPresence('security_request', {
                userId: req.user?.id || 'anonymous',
                metadata: {
                    endpoint: req.path,
                    method: req.method,
                    ip: req.ip,
                    userAgent,
                    suspiciousIndicators,
                    contentLength,
                    headers: Object.fromEntries(Object.entries(req.headers).filter(([key]) => !['authorization', 'cookie'].includes(key.toLowerCase())))
                }
            });
        }
        next();
        res.on('finish', () => {
            const responseTime = Date.now() - startTime;
            if (res.statusCode >= 400 || suspiciousIndicators.length > 0) {
                logger_1.logger.warn('Security-relevant response', {
                    path: req.path,
                    method: req.method,
                    statusCode: res.statusCode,
                    responseTime,
                    suspiciousIndicators,
                    ip: req.ip
                });
            }
        });
    };
}
//# sourceMappingURL=security.middleware.js.map