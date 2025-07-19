import winston from 'winston';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '../../utils/database';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface LogContext {
  service: string;
  jobId?: string;
  userId?: string;
  sessionId?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  context: LogContext;
  stack?: string;
  errorCode?: string;
  recovery?: {
    attempted: boolean;
    successful: boolean;
    strategy: string;
  };
}

interface PerformanceMetrics {
  operation: string;
  duration: number;
  memory: {
    used: number;
    total: number;
  };
  cpu: number;
  timestamp: string;
}

export class PlatformLoggerService {
  private logger: winston.Logger;
  private errorLogsPath: string;
  private performanceLogsPath: string;
  private metricsBuffer: PerformanceMetrics[] = [];
  private errorBuffer: ErrorLog[] = [];
  private flushInterval: NodeJS.Timer;

  constructor() {
    this.errorLogsPath = path.join(process.cwd(), 'logs', 'errors');
    this.performanceLogsPath = path.join(process.cwd(), 'logs', 'performance');
    
    this.initializeDirectories();
    this.setupLogger();
    this.startMetricsCollection();
  }

  private async initializeDirectories() {
    await fs.mkdir(this.errorLogsPath, { recursive: true });
    await fs.mkdir(this.performanceLogsPath, { recursive: true });
  }

  private setupLogger() {
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.prettyPrint()
    );

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports: [
        // Console transport
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        }),
        // Error file transport
        new winston.transports.File({
          filename: path.join(this.errorLogsPath, 'error.log'),
          level: 'error',
          maxsize: 10485760, // 10MB
          maxFiles: 5
        }),
        // Combined file transport
        new winston.transports.File({
          filename: path.join(this.errorLogsPath, 'combined.log'),
          maxsize: 10485760, // 10MB
          maxFiles: 10
        })
      ],
      exceptionHandlers: [
        new winston.transports.File({
          filename: path.join(this.errorLogsPath, 'exceptions.log')
        })
      ],
      rejectionHandlers: [
        new winston.transports.File({
          filename: path.join(this.errorLogsPath, 'rejections.log')
        })
      ]
    });
  }

  /**
   * Log an error with context and recovery information
   */
  async logError(
    error: Error | any, 
    context: LogContext, 
    recovery?: { attempted: boolean; successful: boolean; strategy: string }
  ): Promise<void> {
    const errorLog: ErrorLog = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message || 'Unknown error',
      context,
      stack: error.stack,
      errorCode: error.code || 'UNKNOWN',
      recovery
    };

    // Add to buffer
    this.errorBuffer.push(errorLog);
    
    // Log immediately for errors
    this.logger.error(errorLog.message, errorLog);
    
    // Store in Redis for real-time monitoring
    await this.cacheError(errorLog);
    
    // Alert if critical
    if (this.isCriticalError(error)) {
      await this.alertCriticalError(errorLog);
    }
  }

  /**
   * Log a warning
   */
  async logWarning(message: string, context: LogContext): Promise<void> {
    const warning = {
      timestamp: new Date().toISOString(),
      level: 'warn' as const,
      message,
      context
    };

    this.logger.warn(message, warning);
    
    // Cache warnings for analysis
    await redis.lpush(
      `platform:warnings:${context.service}`,
      JSON.stringify(warning)
    );
    await redis.expire(`platform:warnings:${context.service}`, 86400); // 24 hours
  }

  /**
   * Log an info message
   */
  logInfo(message: string, context: LogContext): void {
    this.logger.info(message, { ...context, timestamp: new Date().toISOString() });
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(operation: string, duration: number, context?: LogContext): Promise<void> {
    const metrics: PerformanceMetrics = {
      operation,
      duration,
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024
      },
      cpu: process.cpuUsage().user / 1000000, // Convert to seconds
      timestamp: new Date().toISOString()
    };

    this.metricsBuffer.push(metrics);
    
    // Log slow operations immediately
    if (duration > 5000) { // 5 seconds
      this.logger.warn('Slow operation detected', { ...metrics, context });
    }
    
    // Store in Redis for real-time dashboards
    await redis.lpush('platform:metrics:performance', JSON.stringify(metrics));
    await redis.ltrim('platform:metrics:performance', 0, 999); // Keep last 1000
  }

  /**
   * Get system health status
   */
  async getHealthStatus(): Promise<any> {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    
    // Get recent errors
    const recentErrors = await redis.lrange('platform:errors:stream', 0, 100);
    const errorCount = recentErrors.filter(e => {
      const error = JSON.parse(e);
      return new Date(error.timestamp).getTime() > oneHourAgo;
    }).length;

    // Get performance metrics
    const perfMetrics = await redis.lrange('platform:metrics:performance', 0, 100);
    const avgDuration = perfMetrics.reduce((sum, m) => {
      const metric = JSON.parse(m);
      return sum + metric.duration;
    }, 0) / (perfMetrics.length || 1);

    // Get memory usage
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

  /**
   * Get error analytics
   */
  async getErrorAnalytics(timeRange = '24h'): Promise<any> {
    const errors = await redis.lrange('platform:errors:stream', 0, -1);
    
    const analytics = {
      totalErrors: errors.length,
      byType: {} as Record<string, number>,
      byService: {} as Record<string, number>,
      byErrorCode: {} as Record<string, number>,
      recoveryRate: 0,
      timeline: [] as any[]
    };

    let recoveredCount = 0;
    
    errors.forEach(e => {
      const error = JSON.parse(e);
      
      // Count by service
      analytics.byService[error.context.service] = 
        (analytics.byService[error.context.service] || 0) + 1;
      
      // Count by error code
      analytics.byErrorCode[error.errorCode] = 
        (analytics.byErrorCode[error.errorCode] || 0) + 1;
      
      // Track recovery
      if (error.recovery?.successful) {
        recoveredCount++;
      }
    });

    analytics.recoveryRate = errors.length > 0 
      ? (recoveredCount / errors.length) * 100 
      : 100;

    return analytics;
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection() {
    // Flush buffers every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushBuffers();
    }, 30000);

    // Ensure cleanup on exit
    process.on('beforeExit', () => {
      clearInterval(this.flushInterval);
      this.flushBuffers();
    });
  }

  /**
   * Flush buffered logs to disk
   */
  private async flushBuffers() {
    // Flush error buffer
    if (this.errorBuffer.length > 0) {
      const date = new Date().toISOString().split('T')[0];
      const errorFile = path.join(this.errorLogsPath, `errors-${date}.jsonl`);
      
      const errorLines = this.errorBuffer.map(e => JSON.stringify(e)).join('\n') + '\n';
      await fs.appendFile(errorFile, errorLines);
      
      this.errorBuffer = [];
    }

    // Flush metrics buffer
    if (this.metricsBuffer.length > 0) {
      const date = new Date().toISOString().split('T')[0];
      const metricsFile = path.join(this.performanceLogsPath, `metrics-${date}.jsonl`);
      
      const metricLines = this.metricsBuffer.map(m => JSON.stringify(m)).join('\n') + '\n';
      await fs.appendFile(metricsFile, metricLines);
      
      this.metricsBuffer = [];
    }
  }

  /**
   * Cache error in Redis
   */
  private async cacheError(error: ErrorLog): Promise<void> {
    try {
      await redis.lpush('platform:errors:stream', JSON.stringify(error));
      await redis.ltrim('platform:errors:stream', 0, 999); // Keep last 1000
      
      // Also add to service-specific stream
      await redis.lpush(
        `platform:errors:${error.context.service}`,
        JSON.stringify(error)
      );
      await redis.expire(`platform:errors:${error.context.service}`, 86400); // 24 hours
    } catch (err) {
      console.error('Failed to cache error in Redis:', err);
    }
  }

  /**
   * Check if error is critical
   */
  private isCriticalError(error: Error | any): boolean {
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

  /**
   * Alert critical error (webhook, email, etc.)
   */
  private async alertCriticalError(error: ErrorLog): Promise<void> {
    // Store critical error
    await redis.lpush('platform:errors:critical', JSON.stringify(error));
    await redis.expire('platform:errors:critical', 604800); // 7 days
    
    // In production, this would send alerts via:
    // - Discord webhook
    // - Email
    // - SMS
    // - PagerDuty
    
    this.logger.error('🚨 CRITICAL ERROR DETECTED', {
      service: error.context.service,
      error: error.message,
      jobId: error.context.jobId
    });
  }

  /**
   * Get critical error count
   */
  private async getCriticalErrorCount(): Promise<number> {
    const criticalErrors = await redis.lrange('platform:errors:critical', 0, -1);
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    return criticalErrors.filter(e => {
      const error = JSON.parse(e);
      return new Date(error.timestamp).getTime() > oneHourAgo;
    }).length;
  }

  /**
   * Create a context-aware logger for a specific service
   */
  createServiceLogger(service: string, defaultContext?: Partial<LogContext>) {
    return {
      info: (message: string, context?: Partial<LogContext>) => {
        this.logInfo(message, { service, ...defaultContext, ...context });
      },
      warn: (message: string, context?: Partial<LogContext>) => {
        this.logWarning(message, { service, ...defaultContext, ...context });
      },
      error: (error: Error | any, context?: Partial<LogContext>, recovery?: any) => {
        this.logError(error, { service, ...defaultContext, ...context }, recovery);
      },
      track: (operation: string, duration: number, context?: Partial<LogContext>) => {
        this.trackPerformance(operation, duration, { service, ...defaultContext, ...context });
      }
    };
  }
}

// Export singleton instance
export const platformLogger = new PlatformLoggerService();