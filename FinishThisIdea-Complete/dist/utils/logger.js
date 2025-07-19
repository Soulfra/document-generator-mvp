"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logMetric = exports.logPerformance = exports.logRequest = exports.logPayment = exports.logAuth = exports.logSecurity = exports.logWarn = exports.logDebug = exports.logInfo = exports.logError = exports.stream = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logDir = path_1.default.join(process.cwd(), 'logs');
if (!fs_1.default.existsSync(logDir)) {
    fs_1.default.mkdirSync(logDir, { recursive: true });
}
const logLevel = process.env.LOG_LEVEL || 'info';
const customFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json(), winston_1.default.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        try {
            const safeMetadata = JSON.stringify(metadata, (key, value) => {
                if (typeof value === 'object' && value !== null) {
                    if (seen.has(value)) {
                        return '[Circular]';
                    }
                    seen.add(value);
                }
                return value;
            });
            msg += ` ${safeMetadata}`;
        }
        catch (error) {
            msg += ` [Metadata serialization error: ${error.message}]`;
        }
    }
    return msg;
}));
const seen = new WeakSet();
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, service, userId, requestId, ...meta }) => {
    let logLine = `${timestamp} [${level}]`;
    if (service)
        logLine += ` [${service}]`;
    if (userId)
        logLine += ` [user:${userId}]`;
    if (requestId)
        logLine += ` [req:${requestId.slice(0, 8)}]`;
    logLine += `: ${message}`;
    const metaKeys = Object.keys(meta);
    if (metaKeys.length > 0) {
        const formattedMeta = metaKeys.map(key => {
            const value = meta[key];
            if (typeof value === 'object') {
                return `${key}=${JSON.stringify(value)}`;
            }
            return `${key}=${value}`;
        }).join(' ');
        logLine += ` ${formattedMeta}`;
    }
    return logLine;
}));
exports.logger = winston_1.default.createLogger({
    level: logLevel,
    format: customFormat,
    defaultMeta: {
        service: 'finishthisidea-platform',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        new winston_1.default.transports.Console({
            format: process.env.NODE_ENV === 'production' ?
                winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()) :
                consoleFormat,
        }),
    ],
    exceptionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'exceptions.log'),
            maxsize: 10485760,
            maxFiles: 3
        })
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({
            filename: path_1.default.join(logDir, 'rejections.log'),
            maxsize: 10485760,
            maxFiles: 3
        })
    ]
});
exports.logger.add(new winston_1.default.transports.File({
    filename: path_1.default.join(logDir, 'app.log'),
    maxsize: 10485760,
    maxFiles: 5,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
}));
exports.logger.add(new winston_1.default.transports.File({
    filename: path_1.default.join(logDir, 'error.log'),
    level: 'error',
    maxsize: 10485760,
    maxFiles: 5,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json())
}));
exports.logger.add(new winston_1.default.transports.File({
    filename: path_1.default.join(logDir, 'security.log'),
    level: 'warn',
    maxsize: 10485760,
    maxFiles: 10,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json(), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
        if (meta.security || message.toLowerCase().includes('security') ||
            message.toLowerCase().includes('auth') || message.toLowerCase().includes('attack')) {
            return `${timestamp} [${level.toUpperCase()}]: ${message} ${JSON.stringify(meta)}`;
        }
        return null;
    }))
}));
exports.stream = {
    write: (message) => {
        exports.logger.info(message.trim(), { type: 'http' });
    },
};
const logError = (message, error, meta) => {
    const errorDetails = {
        error: error?.message || String(error),
        stack: error?.stack,
        name: error?.name,
        code: error?.code,
        ...meta
    };
    exports.logger.error(message, errorDetails);
};
exports.logError = logError;
const logInfo = (message, meta) => {
    exports.logger.info(message, meta);
};
exports.logInfo = logInfo;
const logDebug = (message, meta) => {
    exports.logger.debug(message, meta);
};
exports.logDebug = logDebug;
const logWarn = (message, meta) => {
    exports.logger.warn(message, meta);
};
exports.logWarn = logWarn;
const logSecurity = (event, meta) => {
    exports.logger.warn(event, { security: true, ...meta });
};
exports.logSecurity = logSecurity;
const logAuth = (event, userId, meta) => {
    exports.logger.info(event, { type: 'auth', userId, ...meta });
};
exports.logAuth = logAuth;
const logPayment = (event, userId, amount, meta) => {
    exports.logger.info(event, { type: 'payment', userId, amount, ...meta });
};
exports.logPayment = logPayment;
const logRequest = (method, path, statusCode, responseTime, userId, meta) => {
    const level = statusCode >= 400 ? 'warn' : 'info';
    exports.logger.log(level, 'HTTP Request', {
        type: 'request',
        method,
        path,
        statusCode,
        responseTime,
        userId,
        ...meta
    });
};
exports.logRequest = logRequest;
const logPerformance = (operation, duration, meta) => {
    exports.logger.info('Performance metric', {
        type: 'performance',
        operation,
        duration,
        ...meta
    });
};
exports.logPerformance = logPerformance;
const logMetric = (metric, value, unit, meta) => {
    exports.logger.info('Business metric', {
        type: 'metric',
        metric,
        value,
        unit,
        ...meta
    });
};
exports.logMetric = logMetric;
process.on('uncaughtException', (error) => {
    exports.logger.error('Uncaught Exception:', error);
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});
process.on('unhandledRejection', (reason, promise) => {
    exports.logger.error('Unhandled Rejection at:', { promise: promise.toString(), reason });
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});
process.on('SIGTERM', () => {
    exports.logger.info('Received SIGTERM, shutting down gracefully');
});
process.on('SIGINT', () => {
    exports.logger.info('Received SIGINT, shutting down gracefully');
});
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map