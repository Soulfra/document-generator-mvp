"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.staticCompression = exports.apiCompression = exports.defaultCompression = void 0;
exports.smartCompression = smartCompression;
exports.adaptiveCompression = adaptiveCompression;
exports.monitoredCompression = monitoredCompression;
exports.brotliCompression = brotliCompression;
exports.responseSizeOptimizer = responseSizeOptimizer;
exports.contentTypeCompression = contentTypeCompression;
const compression_1 = __importDefault(require("compression"));
const logger_1 = require("../utils/logger");
const prometheus_metrics_service_1 = require("../services/monitoring/prometheus-metrics.service");
function smartCompression(options = {}) {
    const config = {
        level: options.level || 6,
        threshold: options.threshold || 1024,
        chunkSize: options.chunkSize || 16384,
        windowBits: options.windowBits || 15,
        memLevel: options.memLevel || 8,
        filter: options.filter || defaultFilter
    };
    return (0, compression_1.default)({
        level: config.level,
        threshold: config.threshold,
        chunkSize: config.chunkSize,
        windowBits: config.windowBits,
        memLevel: config.memLevel,
        filter: (req, res) => {
            const shouldCompress = config.filter(req, res);
            if (shouldCompress) {
                prometheus_metrics_service_1.prometheusMetrics.compressionAttempts.inc({ type: 'attempted' });
            }
            else {
                prometheus_metrics_service_1.prometheusMetrics.compressionAttempts.inc({ type: 'skipped' });
            }
            return shouldCompress;
        }
    });
}
function defaultFilter(req, res) {
    const contentType = res.getHeader('content-type');
    if (!contentType) {
        return false;
    }
    const alreadyCompressed = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/',
        'audio/',
        'application/zip',
        'application/gzip',
        'application/x-rar',
        'application/pdf'
    ];
    for (const type of alreadyCompressed) {
        if (contentType.includes(type)) {
            return false;
        }
    }
    const compressibleTypes = [
        'text/',
        'application/json',
        'application/javascript',
        'application/xml',
        'application/rss+xml',
        'application/atom+xml',
        'image/svg+xml'
    ];
    return compressibleTypes.some(type => contentType.includes(type));
}
function adaptiveCompression() {
    return (req, res, next) => {
        const acceptEncoding = req.headers['accept-encoding'] || '';
        const userAgent = req.headers['user-agent'] || '';
        let compressionLevel = 6;
        if (userAgent.includes('Mobile') || userAgent.includes('Android')) {
            compressionLevel = 8;
        }
        if (userAgent.includes('Chrome') || userAgent.includes('Firefox')) {
            compressionLevel = 4;
        }
        const compressionMiddleware = smartCompression({
            level: compressionLevel,
            filter: (req, res) => {
                const contentLength = res.getHeader('content-length');
                if (contentLength && parseInt(contentLength) < 500) {
                    return false;
                }
                return defaultFilter(req, res);
            }
        });
        compressionMiddleware(req, res, next);
    };
}
function monitoredCompression(options = {}) {
    return (req, res, next) => {
        const startTime = Date.now();
        let originalSize = 0;
        let compressedSize = 0;
        const originalWrite = res.write;
        const originalEnd = res.end;
        res.write = function (chunk, encoding, callback) {
            if (chunk) {
                originalSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
            }
            return originalWrite.call(this, chunk, encoding, callback);
        };
        res.end = function (chunk, encoding, callback) {
            if (chunk) {
                originalSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
            }
            const duration = Date.now() - startTime;
            const contentEncoding = res.getHeader('content-encoding');
            const wasCompressed = !!contentEncoding && contentEncoding.toString().includes('gzip');
            if (wasCompressed) {
                const compressionRatio = originalSize > 0 ? (1 - (compressedSize / originalSize)) * 100 : 0;
                prometheus_metrics_service_1.prometheusMetrics.compressionRatio.observe(compressionRatio);
                prometheus_metrics_service_1.prometheusMetrics.compressionSavings.inc(originalSize - compressedSize);
                logger_1.logger.debug('Response compressed', {
                    path: req.path,
                    originalSize,
                    compressionRatio: `${compressionRatio.toFixed(1)}%`,
                    duration: `${duration}ms`
                });
            }
            return originalEnd.call(this, chunk, encoding, callback);
        };
        const compressionMiddleware = smartCompression(options);
        compressionMiddleware(req, res, next);
    };
}
function brotliCompression() {
    return (req, res, next) => {
        const acceptEncoding = req.headers['accept-encoding'] || '';
        if (acceptEncoding.includes('br')) {
            res.set('Content-Encoding', 'br');
        }
        next();
    };
}
function responseSizeOptimizer() {
    return (req, res, next) => {
        const originalJson = res.json;
        res.json = function (obj) {
            const optimized = removeEmptyValues(obj);
            if (Array.isArray(optimized) && optimized.length > 100) {
                logger_1.logger.warn('Large array response', {
                    path: req.path,
                    size: optimized.length,
                    recommendation: 'Consider implementing pagination'
                });
            }
            return originalJson.call(this, optimized);
        };
        next();
    };
}
function removeEmptyValues(obj) {
    if (Array.isArray(obj)) {
        return obj.map(removeEmptyValues);
    }
    if (obj !== null && typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value !== null && value !== undefined) {
                result[key] = removeEmptyValues(value);
            }
        }
        return result;
    }
    return obj;
}
function contentTypeCompression() {
    return (req, res, next) => {
        const path = req.path.toLowerCase();
        if (path.endsWith('.json') || path.includes('/api/')) {
            smartCompression({ level: 8, threshold: 256 })(req, res, next);
        }
        else if (path.endsWith('.js') || path.endsWith('.css')) {
            smartCompression({ level: 6, threshold: 1024 })(req, res, next);
        }
        else if (path.endsWith('.html')) {
            smartCompression({ level: 4, threshold: 512 })(req, res, next);
        }
        else {
            smartCompression()(req, res, next);
        }
    };
}
exports.defaultCompression = smartCompression({
    level: 6,
    threshold: 1024,
    filter: defaultFilter
});
exports.apiCompression = smartCompression({
    level: 8,
    threshold: 256,
    filter: (req, res) => {
        const contentType = res.getHeader('content-type');
        return contentType && contentType.includes('application/json');
    }
});
exports.staticCompression = smartCompression({
    level: 9,
    threshold: 2048,
    filter: (req, res) => {
        const contentType = res.getHeader('content-type');
        return contentType && (contentType.includes('text/') ||
            contentType.includes('application/javascript') ||
            contentType.includes('text/css'));
    }
});
//# sourceMappingURL=compression.middleware.js.map