"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sentryErrorHandler = exports.sentryRequestHandler = void 0;
exports.sentryEnhancedTracking = sentryEnhancedTracking;
exports.sentryUserContext = sentryUserContext;
exports.sentryPerformanceMonitoring = sentryPerformanceMonitoring;
exports.sentryBusinessEvents = sentryBusinessEvents;
exports.sentrySecurity = sentrySecurity;
exports.sentryEnhancedErrorHandler = sentryEnhancedErrorHandler;
exports.sentryCleanup = sentryCleanup;
const Sentry = __importStar(require("@sentry/node"));
const sentry_1 = require("../config/sentry");
const logger_1 = require("../utils/logger");
exports.sentryRequestHandler = Sentry.Handlers.requestHandler({
    user: ['id', 'email', 'username'],
    ip: true,
    request: ['data', 'headers', 'method', 'query_string', 'url'],
    transaction: 'methodPath',
});
function sentryEnhancedTracking(req, res, next) {
    try {
        const transaction = Sentry.startTransaction({
            name: `${req.method} ${req.route?.path || req.path}`,
            op: 'http.server',
            tags: {
                method: req.method,
                endpoint: req.path,
                userAgent: req.get('User-Agent'),
            },
        });
        req.sentryTransaction = transaction;
        Sentry.configureScope((scope) => {
            scope.setTag('route', req.path);
            scope.setTag('method', req.method);
            scope.setContext('request', {
                url: req.url,
                method: req.method,
                headers: {
                    'user-agent': req.get('User-Agent'),
                    'x-forwarded-for': req.get('x-forwarded-for'),
                    'content-type': req.get('content-type'),
                },
                query: req.query,
                ip: req.ip,
            });
        });
        const apiVersion = req.headers['x-api-version'] || req.headers['api-version'];
        if (apiVersion) {
            Sentry.setTag('api_version', apiVersion);
        }
        const originalSend = res.send;
        res.send = function (data) {
            const statusCode = res.statusCode;
            if (statusCode >= 400) {
                transaction.setStatus('http_error');
                transaction.setHttpStatus(statusCode);
                if (statusCode >= 400 && statusCode < 500) {
                    sentry_1.SentryUtils.addBreadcrumb(`Client error: ${statusCode}`, 'http.response', { statusCode, path: req.path, method: req.method });
                }
            }
            else {
                transaction.setStatus('ok');
                transaction.setHttpStatus(statusCode);
            }
            if (data) {
                const size = Buffer.byteLength(data, 'utf8');
                transaction.setData('response_size', size);
            }
            transaction.finish();
            return originalSend.call(this, data);
        };
        next();
    }
    catch (error) {
        logger_1.logger.error('Sentry tracking middleware error', { error });
        next();
    }
}
function sentryUserContext(req, res, next) {
    try {
        const user = req.user;
        if (user) {
            const sentryUser = {
                id: user.id,
                email: user.email,
                username: user.username || user.displayName,
                tier: user.tier || 'free',
            };
            req.sentryUser = sentryUser;
            sentry_1.SentryUtils.setUser(sentryUser);
            sentry_1.SentryUtils.addBreadcrumb('User authenticated', 'auth', { userId: user.id, tier: user.tier });
        }
        next();
    }
    catch (error) {
        logger_1.logger.error('Sentry user context middleware error', { error });
        next();
    }
}
function sentryPerformanceMonitoring(req, res, next) {
    const startTime = Date.now();
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        const transaction = req.sentryTransaction;
        if (transaction) {
            transaction.setData('duration_ms', duration);
            if (duration > 5000) {
                sentry_1.SentryUtils.captureMessage(`Slow request detected: ${req.method} ${req.path}`, 'warning', {
                    component: 'performance',
                    duration_ms: duration,
                    method: req.method,
                    path: req.path,
                    user_id: req.sentryUser?.id,
                });
            }
            if (duration > 2000) {
                sentry_1.SentryUtils.addBreadcrumb('Database-heavy request', 'performance', { duration_ms: duration, path: req.path });
            }
        }
        return originalSend.call(this, data);
    };
    next();
}
function sentryBusinessEvents(req, res, next) {
    const originalSend = res.send;
    res.send = function (data) {
        const statusCode = res.statusCode;
        const path = req.path;
        const method = req.method;
        if (statusCode === 200 || statusCode === 201) {
            if (method === 'POST' && path.includes('/jobs')) {
                sentry_1.SentryUtils.addBreadcrumb('Job created successfully', 'business.job', { user_id: req.sentryUser?.id, path });
            }
            if (path.includes('/payment')) {
                sentry_1.SentryUtils.addBreadcrumb('Payment processed', 'business.payment', { user_id: req.sentryUser?.id, method, path });
            }
            if (method === 'POST' && path.includes('/auth/register')) {
                sentry_1.SentryUtils.captureMessage('New user registration', 'info', { component: 'auth', event: 'registration' });
            }
            if (method === 'POST' && path.includes('/upload')) {
                sentry_1.SentryUtils.addBreadcrumb('File uploaded', 'business.upload', { user_id: req.sentryUser?.id });
            }
        }
        return originalSend.call(this, data);
    };
    next();
}
function sentrySecurity(req, res, next) {
    const originalSend = res.send;
    res.send = function (data) {
        const statusCode = res.statusCode;
        if (statusCode === 401) {
            sentry_1.SentryUtils.captureMessage('Unauthorized access attempt', 'warning', {
                component: 'security',
                event: 'unauthorized_access',
                ip: req.ip,
                path: req.path,
                userAgent: req.get('User-Agent'),
            });
        }
        if (statusCode === 403) {
            sentry_1.SentryUtils.captureMessage('Forbidden access attempt', 'warning', {
                component: 'security',
                event: 'forbidden_access',
                ip: req.ip,
                path: req.path,
                user_id: req.sentryUser?.id,
            });
        }
        if (statusCode === 429) {
            sentry_1.SentryUtils.captureMessage('Rate limit exceeded', 'warning', {
                component: 'security',
                event: 'rate_limit_exceeded',
                ip: req.ip,
                path: req.path,
            });
        }
        return originalSend.call(this, data);
    };
    next();
}
exports.sentryErrorHandler = Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
        const skipErrors = [
            'ValidationError',
            'AuthenticationError',
            'AuthorizationError',
        ];
        return !skipErrors.some(skipError => error.name === skipError);
    },
});
function sentryEnhancedErrorHandler(error, req, res, next) {
    try {
        Sentry.withScope((scope) => {
            scope.setTag('error_boundary', 'middleware');
            scope.setLevel('error');
            scope.setContext('request_details', {
                url: req.url,
                method: req.method,
                headers: req.headers,
                body: req.body,
                query: req.query,
                params: req.params,
            });
            if (req.sentryUser) {
                scope.setUser(req.sentryUser);
            }
            scope.setContext('error_details', {
                name: error.name,
                message: error.message,
                stack: error.stack,
            });
            sentry_1.SentryUtils.captureException(error, {
                component: 'middleware',
                operation: 'error_handling',
                path: req.path,
                method: req.method,
            });
        });
    }
    catch (sentryError) {
        logger_1.logger.error('Sentry error handler failed', { error: sentryError });
    }
    next(error);
}
function sentryCleanup(req, res, next) {
    res.on('finish', () => {
        Sentry.configureScope((scope) => {
            scope.clear();
        });
    });
    next();
}
exports.default = {
    requestHandler: exports.sentryRequestHandler,
    enhancedTracking: sentryEnhancedTracking,
    userContext: sentryUserContext,
    performanceMonitoring: sentryPerformanceMonitoring,
    businessEvents: sentryBusinessEvents,
    security: sentrySecurity,
    errorHandler: exports.sentryErrorHandler,
    enhancedErrorHandler: sentryEnhancedErrorHandler,
    cleanup: sentryCleanup,
};
//# sourceMappingURL=sentry.middleware.js.map