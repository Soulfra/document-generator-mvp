import { performance } from 'perf_hooks';
import { logger } from '../../utils/logger';
import { prometheusMetrics } from '../monitoring/prometheus-metrics.service';
import { cacheService } from '../cache/cache.service';

export interface PerformanceMetrics {
  timestamp: number;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  eventLoopDelay: number;
  activeHandles: number;
  activeRequests: number;
}

export interface PerformanceThresholds {
  responseTime: number; // ms
  memoryUsage: number; // bytes
  cpuUsage: number; // percentage
  eventLoopDelay: number; // ms
}

export class PerformanceService {
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsHistory = 1000;
  private monitoringInterval?: NodeJS.Timeout;
  private performanceObserver?: PerformanceObserver;
  private lastCpuUsage = process.cpuUsage();

  private defaultThresholds: PerformanceThresholds = {
    responseTime: 1000, // 1 second
    memoryUsage: 512 * 1024 * 1024, // 512MB
    cpuUsage: 80, // 80%
    eventLoopDelay: 100 // 100ms
  };

  constructor() {
    this.startMonitoring();
    this.setupPerformanceObserver();
  }

  private startMonitoring(): void {
    // Collect performance metrics every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Clean up old metrics
    setInterval(() => {
      this.cleanupMetrics();
    }, 300000); // Every 5 minutes
  }

  private setupPerformanceObserver(): void {
    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            prometheusMetrics.performanceMeasurements.observe(
              { name: entry.name },
              entry.duration
            );
          }
        });
      });

      this.performanceObserver.observe({ 
        entryTypes: ['measure', 'navigation', 'resource'] 
      });
    } catch (error) {
      logger.warn('Performance Observer not available', { error });
    }
  }

  private collectMetrics(): void {
    try {
      const now = Date.now();
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage(this.lastCpuUsage);
      this.lastCpuUsage = process.cpuUsage();

      // Calculate CPU percentage
      const cpuPercent = ((cpuUsage.user + cpuUsage.system) / 1000000) / 30 * 100; // 30 second interval

      // Measure event loop delay
      const start = performance.now();
      setImmediate(() => {
        const eventLoopDelay = performance.now() - start;

        const metrics: PerformanceMetrics = {
          timestamp: now,
          duration: eventLoopDelay,
          memoryUsage,
          cpuUsage,
          eventLoopDelay,
          activeHandles: (process as any)._getActiveHandles().length,
          activeRequests: (process as any)._getActiveRequests().length
        };

        this.metrics.push(metrics);

        // Update Prometheus metrics
        prometheusMetrics.memoryUsage.set({ type: 'rss' }, memoryUsage.rss);
        prometheusMetrics.memoryUsage.set({ type: 'heapUsed' }, memoryUsage.heapUsed);
        prometheusMetrics.memoryUsage.set({ type: 'heapTotal' }, memoryUsage.heapTotal);
        prometheusMetrics.memoryUsage.set({ type: 'external' }, memoryUsage.external);
        
        prometheusMetrics.cpuUsage.set(cpuPercent);
        prometheusMetrics.eventLoopLag.set(eventLoopDelay);

        // Check thresholds and alert if necessary
        this.checkThresholds(metrics, cpuPercent);
      });
    } catch (error) {
      logger.error('Failed to collect performance metrics', { error });
    }
  }

  private checkThresholds(metrics: PerformanceMetrics, cpuPercent: number): void {
    const alerts: string[] = [];

    if (metrics.memoryUsage.heapUsed > this.defaultThresholds.memoryUsage) {
      alerts.push(`High memory usage: ${Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024)}MB`);
    }

    if (cpuPercent > this.defaultThresholds.cpuUsage) {
      alerts.push(`High CPU usage: ${cpuPercent.toFixed(1)}%`);
    }

    if (metrics.eventLoopDelay > this.defaultThresholds.eventLoopDelay) {
      alerts.push(`High event loop delay: ${metrics.eventLoopDelay.toFixed(1)}ms`);
    }

    if (alerts.length > 0) {
      logger.warn('Performance threshold exceeded', { alerts, metrics });
      prometheusMetrics.performanceAlerts.inc({ type: 'threshold_exceeded' });
    }
  }

  private cleanupMetrics(): void {
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  // Measure function execution time
  measure<T>(name: string, fn: () => T): T;
  measure<T>(name: string, fn: () => Promise<T>): Promise<T>;
  measure<T>(name: string, fn: () => T | Promise<T>): T | Promise<T> {
    const startMark = `${name}-start`;
    const endMark = `${name}-end`;
    const measureName = `${name}-duration`;

    performance.mark(startMark);

    const result = fn();

    if (result instanceof Promise) {
      return result.finally(() => {
        performance.mark(endMark);
        performance.measure(measureName, startMark, endMark);
        performance.clearMarks(startMark);
        performance.clearMarks(endMark);
      });
    } else {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      return result;
    }
  }

  // Measure async function with detailed metrics
  async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>,
    options: { includeMemory?: boolean; cacheResult?: boolean } = {}
  ): Promise<T> {
    const start = performance.now();
    const startMemory = options.includeMemory ? process.memoryUsage() : null;

    try {
      const result = await fn();
      const duration = performance.now() - start;

      if (options.includeMemory && startMemory) {
        const endMemory = process.memoryUsage();
        const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
        
        logger.debug('Function performance', {
          name,
          duration: `${duration.toFixed(2)}ms`,
          memoryDelta: `${Math.round(memoryDelta / 1024)}KB`
        });
      }

      prometheusMetrics.functionDuration.observe({ name }, duration);

      // Cache result if requested and operation was expensive
      if (options.cacheResult && duration > 100) {
        await cacheService.set(`perf:${name}`, result, { ttl: 300 });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      prometheusMetrics.functionErrors.inc({ name });
      logger.error('Function performance error', { name, duration: `${duration.toFixed(2)}ms`, error });
      throw error;
    }
  }

  // Get performance statistics
  getStats(timeframe: number = 300000): {
    summary: {
      avgResponseTime: number;
      maxResponseTime: number;
      avgMemoryUsage: number;
      maxMemoryUsage: number;
      avgCpuUsage: number;
      avgEventLoopDelay: number;
    };
    recent: PerformanceMetrics[];
    trends: {
      memoryTrend: 'increasing' | 'decreasing' | 'stable';
      responseTrend: 'improving' | 'degrading' | 'stable';
    };
  } {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp <= timeframe);

    if (recentMetrics.length === 0) {
      return {
        summary: {
          avgResponseTime: 0,
          maxResponseTime: 0,
          avgMemoryUsage: 0,
          maxMemoryUsage: 0,
          avgCpuUsage: 0,
          avgEventLoopDelay: 0
        },
        recent: [],
        trends: {
          memoryTrend: 'stable',
          responseTrend: 'stable'
        }
      };
    }

    const summary = {
      avgResponseTime: recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length,
      maxResponseTime: Math.max(...recentMetrics.map(m => m.duration)),
      avgMemoryUsage: recentMetrics.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0) / recentMetrics.length,
      maxMemoryUsage: Math.max(...recentMetrics.map(m => m.memoryUsage.heapUsed)),
      avgCpuUsage: recentMetrics.reduce((sum, m) => sum + ((m.cpuUsage.user + m.cpuUsage.system) / 1000000), 0) / recentMetrics.length,
      avgEventLoopDelay: recentMetrics.reduce((sum, m) => sum + m.eventLoopDelay, 0) / recentMetrics.length
    };

    // Calculate trends
    const halfPoint = Math.floor(recentMetrics.length / 2);
    const firstHalf = recentMetrics.slice(0, halfPoint);
    const secondHalf = recentMetrics.slice(halfPoint);

    const firstHalfMemory = firstHalf.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0) / firstHalf.length;
    const secondHalfMemory = secondHalf.reduce((sum, m) => sum + m.memoryUsage.heapUsed, 0) / secondHalf.length;
    const memoryDelta = secondHalfMemory - firstHalfMemory;

    const firstHalfResponse = firstHalf.reduce((sum, m) => sum + m.duration, 0) / firstHalf.length;
    const secondHalfResponse = secondHalf.reduce((sum, m) => sum + m.duration, 0) / secondHalf.length;
    const responseDelta = secondHalfResponse - firstHalfResponse;

    const trends = {
      memoryTrend: Math.abs(memoryDelta) < 1024 * 1024 ? 'stable' : memoryDelta > 0 ? 'increasing' : 'decreasing' as const,
      responseTrend: Math.abs(responseDelta) < 10 ? 'stable' : responseDelta > 0 ? 'degrading' : 'improving' as const
    };

    return {
      summary,
      recent: recentMetrics.slice(-10), // Last 10 metrics
      trends
    };
  }

  // Get resource recommendations
  getRecommendations(): string[] {
    const stats = this.getStats();
    const recommendations: string[] = [];

    if (stats.summary.avgMemoryUsage > this.defaultThresholds.memoryUsage * 0.8) {
      recommendations.push('Consider increasing memory allocation or implementing memory optimization');
    }

    if (stats.summary.avgEventLoopDelay > this.defaultThresholds.eventLoopDelay * 0.8) {
      recommendations.push('Event loop delay is high - consider using worker threads for CPU-intensive tasks');
    }

    if (stats.trends.memoryTrend === 'increasing') {
      recommendations.push('Memory usage is trending upward - check for memory leaks');
    }

    if (stats.trends.responseTrend === 'degrading') {
      recommendations.push('Response times are getting slower - investigate performance bottlenecks');
    }

    if (stats.summary.avgResponseTime > this.defaultThresholds.responseTime * 0.8) {
      recommendations.push('Consider implementing caching or optimizing database queries');
    }

    return recommendations;
  }

  // Performance profiler for debugging
  startProfiling(duration: number = 60000): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const samples: PerformanceMetrics[] = [];

      const sampleInterval = setInterval(() => {
        this.collectMetrics();
        samples.push(this.metrics[this.metrics.length - 1]);
      }, 1000); // Sample every second

      setTimeout(() => {
        clearInterval(sampleInterval);
        
        const endTime = Date.now();
        const profilingData = {
          duration: endTime - startTime,
          samples: samples.length,
          averageMemory: samples.reduce((sum, s) => sum + s.memoryUsage.heapUsed, 0) / samples.length,
          peakMemory: Math.max(...samples.map(s => s.memoryUsage.heapUsed)),
          averageEventLoopDelay: samples.reduce((sum, s) => sum + s.eventLoopDelay, 0) / samples.length,
          maxEventLoopDelay: Math.max(...samples.map(s => s.eventLoopDelay))
        };

        logger.info('Performance profiling completed', profilingData);
        resolve();
      }, duration);
    });
  }

  // Cleanup when shutting down
  shutdown(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    logger.info('Performance service shutdown');
  }
}

export const performanceService = new PerformanceService();