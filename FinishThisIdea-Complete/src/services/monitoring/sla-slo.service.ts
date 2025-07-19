/**
 * SLA/SLO Monitoring Service
 * Service Level Agreement and Objective tracking
 */

import { prometheusMetrics } from './prometheus-metrics.service';
import { logger } from '../../utils/logger';
import { redis } from '../../config/redis';
import { EventEmitter } from 'events';

export interface SLI {
  name: string;
  description: string;
  measurement: 'availability' | 'latency' | 'error_rate' | 'throughput' | 'custom';
  target: number;
  unit: string;
}

export interface SLO {
  id: string;
  name: string;
  description: string;
  slis: SLI[];
  target: number; // Overall target percentage
  window: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  alertThresholds: {
    warning: number;
    critical: number;
  };
}

export interface SLAMetric {
  timestamp: Date;
  sloId: string;
  sliName: string;
  value: number;
  target: number;
  isViolation: boolean;
}

export class SLASLOService extends EventEmitter {
  private static instance: SLASLOService;
  private slos: Map<string, SLO> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  // Default SLOs for FinishThisIdea
  private defaultSLOs: SLO[] = [
    {
      id: 'api-availability',
      name: 'API Availability',
      description: 'Overall API uptime and availability',
      slis: [
        {
          name: 'uptime',
          description: 'Service uptime percentage',
          measurement: 'availability',
          target: 99.9,
          unit: 'percent'
        }
      ],
      target: 99.9,
      window: 'monthly',
      alertThresholds: {
        warning: 99.5,
        critical: 99.0
      }
    },
    {
      id: 'api-performance',
      name: 'API Performance',
      description: 'API response time and throughput',
      slis: [
        {
          name: 'p95_latency',
          description: '95th percentile response time',
          measurement: 'latency',
          target: 500,
          unit: 'ms'
        },
        {
          name: 'p99_latency',
          description: '99th percentile response time',
          measurement: 'latency',
          target: 1000,
          unit: 'ms'
        },
        {
          name: 'throughput',
          description: 'Requests per second',
          measurement: 'throughput',
          target: 100,
          unit: 'rps'
        }
      ],
      target: 95,
      window: 'daily',
      alertThresholds: {
        warning: 90,
        critical: 85
      }
    },
    {
      id: 'job-processing',
      name: 'Job Processing',
      description: 'Document processing job performance',
      slis: [
        {
          name: 'success_rate',
          description: 'Job success rate',
          measurement: 'error_rate',
          target: 99,
          unit: 'percent'
        },
        {
          name: 'processing_time',
          description: 'Average job processing time',
          measurement: 'latency',
          target: 30000,
          unit: 'ms'
        }
      ],
      target: 98,
      window: 'weekly',
      alertThresholds: {
        warning: 95,
        critical: 90
      }
    },
    {
      id: 'data-integrity',
      name: 'Data Integrity',
      description: 'Data accuracy and consistency',
      slis: [
        {
          name: 'backup_success',
          description: 'Backup success rate',
          measurement: 'error_rate',
          target: 100,
          unit: 'percent'
        },
        {
          name: 'data_corruption',
          description: 'Data corruption incidents',
          measurement: 'custom',
          target: 0,
          unit: 'count'
        }
      ],
      target: 99.99,
      window: 'monthly',
      alertThresholds: {
        warning: 99.95,
        critical: 99.9
      }
    }
  ];

  constructor() {
    super();
    this.initializeSLOs();
  }

  public static getInstance(): SLASLOService {
    if (!SLASLOService.instance) {
      SLASLOService.instance = new SLASLOService();
    }
    return SLASLOService.instance;
  }

  /**
   * Initialize SLOs
   */
  private initializeSLOs(): void {
    // Load default SLOs
    this.defaultSLOs.forEach(slo => {
      this.slos.set(slo.id, slo);
    });

    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Start SLO monitoring
   */
  private startMonitoring(): void {
    // Check SLOs every minute
    this.checkInterval = setInterval(() => {
      this.checkAllSLOs();
    }, 60000); // 1 minute

    // Initial check
    this.checkAllSLOs();
  }

  /**
   * Check all SLOs
   */
  private async checkAllSLOs(): Promise<void> {
    for (const [id, slo] of this.slos) {
      try {
        await this.checkSLO(slo);
      } catch (error) {
        logger.error('Failed to check SLO', { sloId: id, error });
      }
    }
  }

  /**
   * Check individual SLO
   */
  private async checkSLO(slo: SLO): Promise<void> {
    const metrics: SLAMetric[] = [];
    let totalScore = 0;
    let violations = 0;

    for (const sli of slo.slis) {
      const metric = await this.measureSLI(sli, slo);
      metrics.push(metric);

      if (metric.isViolation) {
        violations++;
      } else {
        totalScore += 100;
      }
    }

    const sloScore = totalScore / slo.slis.length;
    const errorBudgetRemaining = this.calculateErrorBudget(sloScore, slo.target);

    // Store metrics
    await this.storeMetrics(slo, metrics, sloScore, errorBudgetRemaining);

    // Check alerts
    if (sloScore <= slo.alertThresholds.critical) {
      this.emit('slo:critical', { slo, score: sloScore, metrics });
      logger.error('SLO critical violation', { sloId: slo.id, score: sloScore });
    } else if (sloScore <= slo.alertThresholds.warning) {
      this.emit('slo:warning', { slo, score: sloScore, metrics });
      logger.warn('SLO warning threshold', { sloId: slo.id, score: sloScore });
    }

    // Update Prometheus metrics
    prometheusMetrics.sloCompliance.set(
      { slo: slo.id },
      sloScore
    );
    prometheusMetrics.errorBudgetRemaining.set(
      { slo: slo.id },
      errorBudgetRemaining
    );
  }

  /**
   * Measure individual SLI
   */
  private async measureSLI(sli: SLI, slo: SLO): Promise<SLAMetric> {
    let value: number;
    let isViolation = false;

    switch (sli.measurement) {
      case 'availability':
        value = await this.measureAvailability();
        isViolation = value < sli.target;
        break;

      case 'latency':
        value = await this.measureLatency(sli.name);
        isViolation = value > sli.target;
        break;

      case 'error_rate':
        value = await this.measureErrorRate(sli.name);
        isViolation = sli.name.includes('success') ? value < sli.target : value > sli.target;
        break;

      case 'throughput':
        value = await this.measureThroughput();
        isViolation = value < sli.target;
        break;

      case 'custom':
        value = await this.measureCustom(sli.name);
        isViolation = value > sli.target;
        break;

      default:
        value = 0;
    }

    return {
      timestamp: new Date(),
      sloId: slo.id,
      sliName: sli.name,
      value,
      target: sli.target,
      isViolation
    };
  }

  /**
   * Measure availability
   */
  private async measureAvailability(): Promise<number> {
    // Get uptime from Redis or monitoring
    const uptimeKey = 'monitoring:uptime:current';
    const uptime = await redis.get(uptimeKey);
    
    return uptime ? parseFloat(uptime) : 100;
  }

  /**
   * Measure latency
   */
  private async measureLatency(type: string): Promise<number> {
    // Get from Prometheus metrics or Redis
    const latencyKey = `monitoring:latency:${type}`;
    const latency = await redis.get(latencyKey);
    
    return latency ? parseFloat(latency) : 0;
  }

  /**
   * Measure error rate
   */
  private async measureErrorRate(type: string): Promise<number> {
    if (type === 'success_rate') {
      // Job success rate
      const stats = await redis.hgetall('job:stats:daily');
      const total = parseInt(stats.total || '0');
      const failed = parseInt(stats.failed || '0');
      
      return total > 0 ? ((total - failed) / total) * 100 : 100;
    }
    
    // API error rate
    const errorKey = 'monitoring:errors:rate';
    const errorRate = await redis.get(errorKey);
    
    return errorRate ? parseFloat(errorRate) : 0;
  }

  /**
   * Measure throughput
   */
  private async measureThroughput(): Promise<number> {
    const throughputKey = 'monitoring:throughput:current';
    const throughput = await redis.get(throughputKey);
    
    return throughput ? parseFloat(throughput) : 0;
  }

  /**
   * Measure custom metrics
   */
  private async measureCustom(name: string): Promise<number> {
    const customKey = `monitoring:custom:${name}`;
    const value = await redis.get(customKey);
    
    return value ? parseFloat(value) : 0;
  }

  /**
   * Calculate error budget
   */
  private calculateErrorBudget(currentScore: number, target: number): number {
    const budgetUsed = (100 - currentScore) / (100 - target);
    return Math.max(0, 100 - (budgetUsed * 100));
  }

  /**
   * Store metrics
   */
  private async storeMetrics(
    slo: SLO,
    metrics: SLAMetric[],
    score: number,
    errorBudget: number
  ): Promise<void> {
    const timestamp = Date.now();
    const key = `slo:metrics:${slo.id}:${timestamp}`;
    
    const data = {
      timestamp: new Date(timestamp),
      sloId: slo.id,
      score,
      errorBudget,
      metrics,
      window: slo.window
    };

    // Store in Redis with TTL based on window
    const ttl = this.getRetentionTTL(slo.window);
    await redis.setex(key, ttl, JSON.stringify(data));

    // Add to sorted set for easy retrieval
    await redis.zadd(`slo:history:${slo.id}`, timestamp, key);
    
    // Trim old entries
    const cutoff = timestamp - (ttl * 1000);
    await redis.zremrangebyscore(`slo:history:${slo.id}`, 0, cutoff);
  }

  /**
   * Get retention TTL based on window
   */
  private getRetentionTTL(window: string): number {
    const ttlMap = {
      daily: 7 * 24 * 60 * 60,       // 7 days
      weekly: 30 * 24 * 60 * 60,     // 30 days
      monthly: 90 * 24 * 60 * 60,    // 90 days
      quarterly: 365 * 24 * 60 * 60  // 1 year
    };
    
    return ttlMap[window] || ttlMap.daily;
  }

  /**
   * Get SLO status
   */
  public async getSLOStatus(sloId?: string): Promise<any> {
    if (sloId) {
      const slo = this.slos.get(sloId);
      if (!slo) {
        throw new Error(`SLO ${sloId} not found`);
      }
      
      return this.getSingleSLOStatus(slo);
    }

    // Get all SLO statuses
    const statuses = [];
    for (const [id, slo] of this.slos) {
      const status = await this.getSingleSLOStatus(slo);
      statuses.push(status);
    }
    
    return statuses;
  }

  /**
   * Get single SLO status
   */
  private async getSingleSLOStatus(slo: SLO): Promise<any> {
    // Get latest metrics
    const latestKey = await redis.zrevrange(`slo:history:${slo.id}`, 0, 0);
    let currentMetrics = null;
    
    if (latestKey.length > 0) {
      const data = await redis.get(latestKey[0]);
      if (data) {
        currentMetrics = JSON.parse(data);
      }
    }

    // Get historical data
    const history = await this.getSLOHistory(slo.id, slo.window);
    
    return {
      slo,
      current: currentMetrics,
      history,
      status: this.calculateStatus(currentMetrics, slo)
    };
  }

  /**
   * Get SLO history
   */
  public async getSLOHistory(sloId: string, window: string): Promise<any[]> {
    const windowMs = this.getWindowMilliseconds(window);
    const cutoff = Date.now() - windowMs;
    
    const keys = await redis.zrangebyscore(
      `slo:history:${sloId}`,
      cutoff,
      Date.now()
    );
    
    const history = [];
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        history.push(JSON.parse(data));
      }
    }
    
    return history;
  }

  /**
   * Get window in milliseconds
   */
  private getWindowMilliseconds(window: string): number {
    const windowMap = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
      quarterly: 90 * 24 * 60 * 60 * 1000
    };
    
    return windowMap[window] || windowMap.daily;
  }

  /**
   * Calculate status
   */
  private calculateStatus(metrics: any, slo: SLO): string {
    if (!metrics) return 'unknown';
    
    if (metrics.score >= slo.target) {
      return 'healthy';
    } else if (metrics.score >= slo.alertThresholds.warning) {
      return 'warning';
    } else {
      return 'critical';
    }
  }

  /**
   * Create custom SLO
   */
  public createSLO(slo: SLO): void {
    this.slos.set(slo.id, slo);
    logger.info('Created custom SLO', { sloId: slo.id });
  }

  /**
   * Update SLO
   */
  public updateSLO(sloId: string, updates: Partial<SLO>): void {
    const slo = this.slos.get(sloId);
    if (!slo) {
      throw new Error(`SLO ${sloId} not found`);
    }
    
    Object.assign(slo, updates);
    this.slos.set(sloId, slo);
    logger.info('Updated SLO', { sloId });
  }

  /**
   * Delete SLO
   */
  public async deleteSLO(sloId: string): Promise<void> {
    this.slos.delete(sloId);
    
    // Clean up historical data
    await redis.del(`slo:history:${sloId}`);
    
    logger.info('Deleted SLO', { sloId });
  }

  /**
   * Generate SLO report
   */
  public async generateReport(sloId: string, startDate: Date, endDate: Date): Promise<any> {
    const slo = this.slos.get(sloId);
    if (!slo) {
      throw new Error(`SLO ${sloId} not found`);
    }

    const history = await this.getSLOHistory(sloId, slo.window);
    const filtered = history.filter(h => {
      const timestamp = new Date(h.timestamp);
      return timestamp >= startDate && timestamp <= endDate;
    });

    // Calculate statistics
    const scores = filtered.map(h => h.score);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const violations = filtered.filter(h => h.score < slo.target).length;
    const violationRate = (violations / filtered.length) * 100;

    return {
      slo,
      period: {
        start: startDate,
        end: endDate
      },
      statistics: {
        averageScore: avgScore,
        minScore,
        maxScore,
        violations,
        violationRate,
        totalMeasurements: filtered.length
      },
      history: filtered
    };
  }

  /**
   * Shutdown service
   */
  public shutdown(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

// Export singleton instance
export const slaSloService = SLASLOService.getInstance();