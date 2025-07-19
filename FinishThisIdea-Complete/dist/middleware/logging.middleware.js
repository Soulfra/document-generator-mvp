"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
exports.skipLogging = skipLogging;
exports.performanceMonitor = performanceMonitor;
exports.errorContext = errorContext;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
function requestLogger(req, res, next) {
    req.requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    req.startTime = Date.now();
    res.setHeader('X-Request-ID', req.requestId);
    res.locals.requestId = req.requestId;
    logger_1.logger.info('Incoming request', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        referer: req.headers['referer'],
        contentType: req.headers['content-type'],
        contentLength: req.headers['content-length'],
        ...(req.user && { userId: req.user.id })
    });
    const originalSend = res.send;
    const originalJson = res.json;
    let responseBody;
    res.send = function (data) {
        responseBody = data;
        res.send = originalSend;
        return res.send(data);
    };
    res.json = function (data) {
        responseBody = data;
        res.json = originalJson;
        return res.json(data);
    };
    res.on('finish', () => {
        const duration = Date.now() - (req.startTime || 0);
        const logData = {
            requestId: req.requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration,
            contentLength: res.get('content-length'),
            ...(req.user && { userId: req.user.id })
        };
        if (res.statusCode >= 400 && responseBody) {
            try {
                const parsed = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
                if (parsed.error) {
                    logData.errorCode = parsed.error.code;
                    logData.errorMessage = parsed.error.message;
                }
            }
            catch (e) {
            }
        }
        if (res.statusCode >= 500) {
            logger_1.logger.error('Request failed', logData);
        }
        else if (res.statusCode >= 400) {
            logger_1.logger.warn('Request error', logData);
        }
        else {
            logger_1.logger.info('Request completed', logData);
        }
        if (duration > 1000) {
            logger_1.logger.warn('Slow request detected', {
                ...logData,
                threshold: 1000
            });
        }
        logSecurityEvents(req, res, logData);
    });
    next();
}
function logSecurityEvents(req, res, logData) {
    if (res.statusCode === 401) {
        (0, logger_1.logSecurity)('Authentication failure', {
            ...logData,
            attemptedAuth: req.headers['authorization'] ? 'Bearer' : 'None'
        });
    }
    if (res.statusCode === 403) {
        (0, logger_1.logSecurity)('Authorization failure', logData);
    }
    if (res.statusCode === 429) {
        (0, logger_1.logSecurity)('Rate limit exceeded', logData);
    }
    if (req.url.includes('../') || req.url.includes('..\\')) {
        (0, logger_1.logSecurity)('Path traversal attempt detected', logData);
    }
    const suspiciousPatterns = ['union', 'select', 'drop', 'insert', 'delete', '--', ';'];
    const queryString = JSON.stringify(req.query).toLowerCase();
    if (suspiciousPatterns.some(pattern => queryString.includes(pattern))) {
        (0, logger_1.logSecurity)('Suspicious query pattern detected', {
            ...logData,
            query: req.query
        });
    }
}
function skipLogging(paths) {
    return (req, res, next) => {
        if (paths.some(path => req.url.startsWith(path))) {
            return next();
        }
        return requestLogger(req, res, next);
    };
}
function performanceMonitor(req, res, next) {
    const route = req.route?.path || req.path;
    const method = req.method;
    const startTime = process.hrtime.bigint();
    res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000;
        logger_1.logger.debug('Route performance', {
            route,
            method,
            duration,
            statusCode: res.statusCode,
            requestId: req.requestId
        });
        if (duration > 5000) {
            logger_1.logger.warn('Very slow request detected', {
                route,
                method,
                duration,
                requestId: req.requestId,
                threshold: 5000
            });
        }
    });
    next();
}
function errorContext(req, res, next) {
    res.locals.requestContext = {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        userId: req.user ? req.user.id : undefined,
        startTime: req.startTime
    };
    next();
}
//# sourceMappingURL=logging.middleware.js.map