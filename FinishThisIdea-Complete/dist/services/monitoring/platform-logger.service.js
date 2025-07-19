"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.platformLogger = exports.PlatformLoggerService = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
class PlatformLoggerService {
    logger;
    errorLogsPath;
    performanceLogsPath;
    metricsBuffer = [];
    errorBuffer = [];
    flushInterval;
    constructor() {
        this.errorLogsPath = path_1.default.join(process.cwd(), 'logs', 'errors');
        this.performanceLogsPath = path_1.default.join(process.cwd(), 'logs', 'performance');
        this.initializeDirectories();
        this.setupLogger();
        this.startMetricsCollection();
    }
    async initializeDirectories() {
        await promises_1.default.mkdir(this.errorLogsPath, { recursive: true });
        await promises_1.default.mkdir(this.performanceLogsPath, { recursive: true });
    }
    setupLogger() {
        const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.prettyPrint());
        this.logger = winston_1.default.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: logFormat,
            transports: [
                new winston_1.default.transports.Console({
                    format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
                }),
                new winston_1.default.transports.File({
                    filename: path_1.default.join(this.errorLogsPath, 'error.log'),
                    level: 'error',
                    maxsize: 10485760,
                    maxFiles: 5
                }),
                new winston_1.default.transports.File({
                    filename: path_1.default.join(this.errorLogsPath, 'combined.log'),
                    maxsize: 10485760,
                    maxFiles: 10
                })
            ],
            exceptionHandlers: [
                new winston_1.default.transports.File({
                    filename: path_1.default.join(this.errorLogsPath, 'exceptions.log')
                })
            ],
            rejectionHandlers: [
                new winston_1.default.transports.File({
                    filename: path_1.default.join(this.errorLogsPath, 'rejections.log')
                })
            ]
        });
    }
    async logError(error, context, recovery) {
        const errorLog = {
            id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            level: 'error',
            message: error.message || 'Unknown error',
            context,
            stack: error.stack,
            errorCode: error.code || 'UNKNOWN',
            recovery
        };
        this.errorBuffer.push(errorLog);
        this.logger.error(errorLog.message, errorLog);
        await this.cacheError(errorLog);
        if (this.isCriticalError(error)) {
            await this.alertCriticalError(errorLog);
        }
    }
    async logWarning(message, context) {
        const warning = {
            timestamp: new Date().toISOString(),
            level: 'warn',
            message,
            context
        };
        this.logger.warn(message, warning);
        await redis.lpush(`platform:warnings:${context.service}`, JSON.stringify(warning));
        await redis.expire(`platform:warnings:${context.service}`, 86400);
    }
    logInfo(message, context) {
        this.logger.info(message, { ...context, timestamp: new Date().toISOString() });
    }
    async trackPerformance(operation, duration, context) {
        const metrics = {
            operation,
            duration,
            memory: {
                used: process.memoryUsage().heapUsed / 1024 / 1024,
                total: process.memoryUsage().heapTotal / 1024 / 1024
            },
            cpu: process.cpuUsage().user / 1000000,
            timestamp: new Date().toISOString()
        };
        this.metricsBuffer.push(metrics);
        if (duration > 5000) {
            this.logger.warn('Slow operation detected', { ...metrics, context });
        }
        await redis.lpush('platform:metrics:performance', JSON.stringify(metrics));
        await redis.ltrim('platform:metrics:performance', 0, 999);
    }
    async getHealthStatus() {
        const now = Date.now();
        const oneHourAgo = now - 60 * 60 * 1000;
        const recentErrors = await redis.lrange('platform:errors:stream', 0, 100);
        const errorCount = recentErrors.filter(e => {
            const error = JSON.parse(e);
            return new Date(error.timestamp).getTime() > oneHourAgo;
        }).length;
        const perfMetrics = await redis.lrange('platform:metrics:performance', 0, 100);
        const avgDuration = perfMetrics.reduce((sum, m) => {
            const metric = JSON.parse(m);
            return sum + metric.duration;
        }, 0) / (perfMetrics.length || 1);
        const memUsage = process.memoryUsage();
        return {
            status: errorCount > 10 ? 'degraded' : 'healthy',
            timestamp: new Date().toISOString(),
            errors: {
                lastHour: errorCount,
                criticalErrors: await this.getCriticalErrorCount()
            },
            performance: {
                averageResponseTime: Math.round(avgDuration),
                slowOperations: perfMetrics.filter(m => JSON.parse(m).duration > 5000).length
            },
            resources: {
                memory: {
                    used: Math.round(memUsage.heapUsed / 1024 / 1024),
                    total: Math.round(memUsage.heapTotal / 1024 / 1024),
                    percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
                },
                uptime: Math.round(process.uptime())
            }
        };
    }
    async getErrorAnalytics(timeRange = '24h') {
        const errors = await redis.lrange('platform:errors:stream', 0, -1);
        const analytics = {
            totalErrors: errors.length,
            byType: {},
            byService: {},
            byErrorCode: {},
            recoveryRate: 0,
            timeline: []
        };
        let recoveredCount = 0;
        errors.forEach(e => {
            const error = JSON.parse(e);
            analytics.byService[error.context.service] =
                (analytics.byService[error.context.service] || 0) + 1;
            analytics.byErrorCode[error.errorCode] =
                (analytics.byErrorCode[error.errorCode] || 0) + 1;
            if (error.recovery?.successful) {
                recoveredCount++;
            }
        });
        analytics.recoveryRate = errors.length > 0
            ? (recoveredCount / errors.length) * 100
            : 100;
        return analytics;
    }
    startMetricsCollection() {
        this.flushInterval = setInterval(() => {
            this.flushBuffers();
        }, 30000);
        process.on('beforeExit', () => {
            clearInterval(this.flushInterval);
            this.flushBuffers();
        });
    }
    async flushBuffers() {
        if (this.errorBuffer.length > 0) {
            const date = new Date().toISOString().split('T')[0];
            const errorFile = path_1.default.join(this.errorLogsPath, `errors-${date}.jsonl`);
            const errorLines = this.errorBuffer.map(e => JSON.stringify(e)).join('\n') + '\n';
            await promises_1.default.appendFile(errorFile, errorLines);
            this.errorBuffer = [];
        }
        if (this.metricsBuffer.length > 0) {
            const date = new Date().toISOString().split('T')[0];
            const metricsFile = path_1.default.join(this.performanceLogsPath, `metrics-${date}.jsonl`);
            const metricLines = this.metricsBuffer.map(m => JSON.stringify(m)).join('\n') + '\n';
            await promises_1.default.appendFile(metricsFile, metricLines);
            this.metricsBuffer = [];
        }
    }
    async cacheError(error) {
        try {
            await redis.lpush('platform:errors:stream', JSON.stringify(error));
            await redis.ltrim('platform:errors:stream', 0, 999);
            await redis.lpush(`platform:errors:${error.context.service}`, JSON.stringify(error));
            await redis.expire(`platform:errors:${error.context.service}`, 86400);
        }
        catch (err) {
            console.error('Failed to cache error in Redis:', err);
        }
    }
    isCriticalError(error) {
        const criticalPatterns = [
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND',
            'database',
            'payment',
            'security',
            'authentication'
        ];
        const errorString = `${error.message} ${error.code} ${error.stack}`.toLowerCase();
        return criticalPatterns.some(pattern => errorString.includes(pattern));
    }
    async alertCriticalError(error) {
        await redis.lpush('platform:errors:critical', JSON.stringify(error));
        await redis.expire('platform:errors:critical', 604800);
        this.logger.error('🚨 CRITICAL ERROR DETECTED', {
            service: error.context.service,
            error: error.message,
            jobId: error.context.jobId
        });
    }
    async getCriticalErrorCount() {
        const criticalErrors = await redis.lrange('platform:errors:critical', 0, -1);
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        return criticalErrors.filter(e => {
            const error = JSON.parse(e);
            return new Date(error.timestamp).getTime() > oneHourAgo;
        }).length;
    }
    createServiceLogger(service, defaultContext) {
        return {
            info: (message, context) => {
                this.logInfo(message, { service, ...defaultContext, ...context });
            },
            warn: (message, context) => {
                this.logWarning(message, { service, ...defaultContext, ...context });
            },
            error: (error, context, recovery) => {
                this.logError(error, { service, ...defaultContext, ...context }, recovery);
            },
            track: (operation, duration, context) => {
                this.trackPerformance(operation, duration, { service, ...defaultContext, ...context });
            }
        };
    }
}
exports.PlatformLoggerService = PlatformLoggerService;
exports.platformLogger = new PlatformLoggerService();
//# sourceMappingURL=platform-logger.service.js.map