import { logger } from '../../utils/logger';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export interface MetricData {
  name: string;
  value: number;
  timestamp: Date;
  labels?: Record<string, string>;
}

export interface SystemMetrics {
  requests: {
    total: number;
    success: number;
    errors: number;
    rate: number;
  };
  database: {
    connections: number;
    queries: number;
    avgQueryTime: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  memory: {
    used: number;
    total: number;
    usage: number;
  };
}

class MetricsService {
  private metrics: Map<string, MetricData[]> = new Map();

  /**
   * Record a metric value
   */
  async recordMetric(name: string, value: number, labels?: Record<string, string>): Promise<void> {
    try {
      const metric: MetricData = {
        name,
        value,
        timestamp: new Date(),
        labels
      };

      // Store in memory
      if (!this.metrics.has(name)) {
        this.metrics.set(name, []);
      }
      this.metrics.get(name)!.push(metric);

      // Keep only last 1000 entries per metric
      const metricArray = this.metrics.get(name)!;
      if (metricArray.length > 1000) {
        metricArray.splice(0, metricArray.length - 1000);
      }

      // Store in Redis for aggregation
      const key = `metrics:${name}`;
      await redis.zadd(key, Date.now(), JSON.stringify(metric));
      await redis.expire(key, 86400); // 24 hours

      logger.debug('Metric recorded', { name, value, labels });
    } catch (error) {
      logger.error('Failed to record metric', { error, name, value });
    }
  }

  /**
   * Increment a counter metric
   */
  async incrementCounter(name: string, labels?: Record<string, string>): Promise<void> {
    await this.recordMetric(name, 1, labels);
  }

  /**
   * Record timing metric
   */
  async recordTiming(name: string, duration: number, labels?: Record<string, string>): Promise<void> {
    await this.recordMetric(`${name}_duration`, duration, labels);
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    try {
      const [
        totalRequests,
        successRequests,
        errorRequests,
        dbConnections,
        memoryUsage
      ] = await Promise.all([
        this.getMetricSum('http_requests_total'),
        this.getMetricSum('http_requests_success'),
        this.getMetricSum('http_requests_error'),
        this.getCurrentValue('db_connections'),
        this.getMemoryUsage()
      ]);

      const cacheHits = await this.getMetricSum('cache_hits');
      const cacheMisses = await this.getMetricSum('cache_misses');
      const hitRate = cacheHits + cacheMisses > 0 ? (cacheHits / (cacheHits + cacheMisses)) * 100 : 0;

      return {
        requests: {
          total: totalRequests,
          success: successRequests,
          errors: errorRequests,
          rate: await this.getRequestRate()
        },
        database: {
          connections: dbConnections,
          queries: await this.getMetricSum('db_queries'),
          avgQueryTime: await this.getAverageMetric('db_query_duration')
        },
        cache: {
          hits: cacheHits,
          misses: cacheMisses,
          hitRate
        },
        memory: memoryUsage
      };
    } catch (error) {
      logger.error('Failed to get system metrics', { error });
      return this.getDefaultMetrics();
    }
  }

  /**
   * Get metric by name and time range
   */
  async getMetricHistory(name: string, hours: number = 24): Promise<MetricData[]> {
    try {
      const key = `metrics:${name}`;
      const since = Date.now() - (hours * 60 * 60 * 1000);
      
      const results = await redis.zrangebyscore(key, since, '+inf');
      return results.map(result => JSON.parse(result) as MetricData);
    } catch (error) {
      logger.error('Failed to get metric history', { error, name });
      return [];
    }
  }

  /**
   * Get current value of a metric
   */
  async getCurrentValue(name: string): Promise<number> {
    try {
      const key = `metrics:${name}`;
      const latest = await redis.zrevrange(key, 0, 0);
      if (latest.length > 0) {
        const metric = JSON.parse(latest[0]) as MetricData;
        return metric.value;
      }
      return 0;
    } catch (error) {
      logger.error('Failed to get current value', { error, name });
      return 0;
    }
  }

  /**
   * Get sum of metric values over time period
   */
  private async getMetricSum(name: string, hours: number = 1): Promise<number> {
    try {
      const history = await this.getMetricHistory(name, hours);
      return history.reduce((sum, metric) => sum + metric.value, 0);
    } catch (error) {
      logger.error('Failed to get metric sum', { error, name });
      return 0;
    }
  }

  /**
   * Get average of metric values over time period
   */
  private async getAverageMetric(name: string, hours: number = 1): Promise<number> {
    try {
      const history = await this.getMetricHistory(name, hours);
      if (history.length === 0) return 0;
      const sum = history.reduce((sum, metric) => sum + metric.value, 0);
      return sum / history.length;
    } catch (error) {
      logger.error('Failed to get metric average', { error, name });
      return 0;
    }
  }

  /**
   * Get request rate (requests per minute)
   */
  private async getRequestRate(): Promise<number> {
    try {
      const history = await this.getMetricHistory('http_requests_total', 1);
      return history.length; // Simple approximation
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get memory usage metrics
   */
  private getMemoryUsage(): { used: number; total: number; usage: number } {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    
    return {
      used: usedMemory,
      total: totalMemory,
      usage: (usedMemory / totalMemory) * 100
    };
  }

  /**
   * Get default metrics when system metrics fail
   */
  private getDefaultMetrics(): SystemMetrics {
    return {
      requests: { total: 0, success: 0, errors: 0, rate: 0 },
      database: { connections: 0, queries: 0, avgQueryTime: 0 },
      cache: { hits: 0, misses: 0, hitRate: 0 },
      memory: { used: 0, total: 0, usage: 0 }
    };
  }

  /**
   * Clean up old metrics
   */
  async cleanupOldMetrics(): Promise<void> {
    try {
      const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
      const keys = await redis.keys('metrics:*');
      
      for (const key of keys) {
        await redis.zremrangebyscore(key, 0, cutoff);
      }
      
      logger.info('Cleaned up old metrics', { keys: keys.length });
    } catch (error) {
      logger.error('Failed to cleanup old metrics', { error });
    }
  }

  /**
   * Export metrics for Prometheus
   */
  async exportPrometheusMetrics(): Promise<string> {
    try {
      const metrics = await this.getSystemMetrics();
      
      const lines = [
        `# HELP http_requests_total Total HTTP requests`,
        `# TYPE http_requests_total counter`,
        `http_requests_total ${metrics.requests.total}`,
        ``,
        `# HELP http_requests_success Successful HTTP requests`,
        `# TYPE http_requests_success counter`,
        `http_requests_success ${metrics.requests.success}`,
        ``,
        `# HELP http_requests_error Failed HTTP requests`,
        `# TYPE http_requests_error counter`,
        `http_requests_error ${metrics.requests.errors}`,
        ``,
        `# HELP memory_usage_bytes Memory usage in bytes`,
        `# TYPE memory_usage_bytes gauge`,
        `memory_usage_bytes ${metrics.memory.used}`,
        ``,
        `# HELP cache_hit_rate Cache hit rate percentage`,
        `# TYPE cache_hit_rate gauge`,
        `cache_hit_rate ${metrics.cache.hitRate}`,
        ``
      ];
      
      return lines.join('\n');
    } catch (error) {
      logger.error('Failed to export Prometheus metrics', { error });
      return '';
    }
  }
}

export const metricsService = new MetricsService();

// Middleware to automatically track HTTP requests
export const metricsMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  metricsService.incrementCounter('http_requests_total', {
    method: req.method,
    path: req.path
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    metricsService.recordTiming('http_request_duration', duration, {
      method: req.method,
      path: req.path,
      status: res.statusCode.toString()
    });

    if (res.statusCode >= 200 && res.statusCode < 400) {
      metricsService.incrementCounter('http_requests_success', {
        method: req.method,
        path: req.path
      });
    } else {
      metricsService.incrementCounter('http_requests_error', {
        method: req.method,
        path: req.path,
        status: res.statusCode.toString()
      });
    }
  });

  next();
};

export default metricsService;