"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
exports.skipLogging = skipLogging;
const uuid_1 = require("uuid");
const logger_1 = require("../utils/logger");
function requestLogger(req, res, next) {
    // Generate unique request ID
    req.requestId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    req.startTime = Date.now();
    // Add request ID to response headers
    res.setHeader('X-Request-ID', req.requestId);
    // Log request
    logger_1.logger.info('Incoming request', {
        requestId: req.requestId,
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
    });
    // Log response on finish
    const originalSend = res.send;
    res.send = function (data) {
        res.send = originalSend;
        const duration = Date.now() - (req.startTime || 0);
        logger_1.logger.info('Request completed', {
            requestId: req.requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration,
        });
        return res.send(data);
    };
    next();
}
// Skip logging for certain paths
function skipLogging(paths) {
    return (req, res, next) => {
        if (paths.some(path => req.url.startsWith(path))) {
            return next();
        }
        return requestLogger(req, res, next);
    };
}
//# sourceMappingURL=logging.middleware.js.map