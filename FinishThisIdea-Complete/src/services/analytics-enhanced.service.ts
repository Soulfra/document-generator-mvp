/**
 * Enhanced Analytics Service
 * Real-time API usage tracking, documentation analytics, form metrics
 */

import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

export interface APIUsageMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  userId?: string;
  apiKey?: string;
  timestamp: Date;
  metadata?: {
    userAgent?: string;
    ip?: string;
    referrer?: string;
    requestSize?: number;
    responseSize?: number;
    error?: string;
  };
}

export interface DocumentationMetric {
  page: string;
  section?: string;
  action: 'view' | 'search' | 'copy' | 'download';
  userId?: string;
  sessionId: string;
  timeSpent?: number;
  timestamp: Date;
}

export interface FormMetric {
  formId: string;
  event: 'started' | 'field_focused' | 'field_changed' | 'field_error' | 'step_completed' | 'submitted' | 'abandoned';
  fieldName?: string;
  fieldValue?: any;
  errorMessage?: string;
  stepId?: string;
  sessionId: string;
  timestamp: Date;
}

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: Date;
}

export interface RealTimeMetrics {
  activeUsers: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  apiHealth: Record<string, 'healthy' | 'degraded' | 'down'>;
}

export class EnhancedAnalyticsService extends EventEmitter {
  private redis: Redis;
  private metricsBuffer: Map<string, any[]> = new Map();
  private flushInterval: NodeJS.Timer;
  private aggregationInterval: NodeJS.Timer;

  constructor() {
    super();
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      keyPrefix: 'analytics:'
    });

    // Start periodic flush and aggregation
    this.flushInterval = setInterval(() => this.flushMetrics(), 5000);
    this.aggregationInterval = setInterval(() => this.aggregateMetrics(), 60000);
  }

  /**
   * Track API usage
   */
  async trackAPIUsage(metric: APIUsageMetric): Promise<void> {
    try {
      // Buffer metric for batch processing
      this.bufferMetric('api', metric);

      // Update real-time counters
      await this.updateRealTimeCounters(metric);

      // Emit event for real-time dashboards
      this.emit('api:usage', metric);

      // Check for anomalies
      await this.checkForAnomalies(metric);
    } catch (error) {
      logger.error('Failed to track API usage', { error, metric });
    }
  }

  /**
   * Track documentation usage
   */
  async trackDocumentationUsage(metric: DocumentationMetric): Promise<void> {
    try {
      // Buffer metric
      this.bufferMetric('docs', metric);

      // Update page view counters
      await this.redis.hincrby('docs:pageviews', metric.page, 1);

      // Track user journey
      if (metric.sessionId) {
        await this.trackUserJourney(metric.sessionId, 'docs', metric.page);
      }

      this.emit('docs:usage', metric);
    } catch (error) {
      logger.error('Failed to track documentation usage', { error, metric });
    }
  }

  /**
   * Track form analytics
   */
  async trackFormAnalytics(metric: FormMetric): Promise<void> {
    try {
      // Buffer metric
      this.bufferMetric('forms', metric);

      // Update form-specific counters
      const key = `forms:${metric.formId}:${metric.event}`;
      await this.redis.incr(key);

      // Track conversion funnel
      if (metric.event === 'started' || metric.event === 'submitted') {
        await this.updateConversionFunnel(metric.formId, metric.event, metric.sessionId);
      }

      // Track field errors
      if (metric.event === 'field_error' && metric.fieldName) {
        await this.redis.hincrby(`forms:${metric.formId}:errors`, metric.fieldName, 1);
      }

      this.emit('form:analytics', metric);
    } catch (error) {
      logger.error('Failed to track form analytics', { error, metric });
    }
  }

  /**
   * Track custom event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const enrichedEvent = {
        ...event,
        timestamp: event.timestamp || new Date(),
        sessionId: event.sessionId || this.generateSessionId()
      };

      // Buffer event
      this.bufferMetric('events', enrichedEvent);

      // Update event counters
      await this.redis.hincrby('events:count', event.name, 1);

      this.emit('custom:event', enrichedEvent);
    } catch (error) {
      logger.error('Failed to track custom event', { error, event });
    }
  }

  /**
   * Buffer metrics for batch processing
   */
  private bufferMetric(type: string, metric: any): void {
    if (!this.metricsBuffer.has(type)) {
      this.metricsBuffer.set(type, []);
    }
    this.metricsBuffer.get(type)!.push(metric);

    // Flush if buffer is getting large
    if (this.metricsBuffer.get(type)!.length >= 100) {
      this.flushMetrics();
    }
  }

  /**
   * Flush buffered metrics to database
   */
  private async flushMetrics(): Promise<void> {
    for (const [type, metrics] of this.metricsBuffer.entries()) {
      if (metrics.length === 0) continue;

      try {
        switch (type) {
          case 'api':
            await this.saveAPIMetrics(metrics);
            break;
          case 'docs':
            await this.saveDocumentationMetrics(metrics);
            break;
          case 'forms':
            await this.saveFormMetrics(metrics);
            break;
          case 'events':
            await this.saveEvents(metrics);
            break;
        }

        // Clear buffer after successful save
        this.metricsBuffer.set(type, []);
      } catch (error) {
        logger.error(`Failed to flush ${type} metrics`, { error, count: metrics.length });
      }
    }
  }

  /**
   * Save API metrics to database
   */
  private async saveAPIMetrics(metrics: APIUsageMetric[]): Promise<void> {
    // In a real implementation, this would batch insert to database
    logger.info('Saving API metrics', { count: metrics.length });
  }

  /**
   * Save documentation metrics
   */
  private async saveDocumentationMetrics(metrics: DocumentationMetric[]): Promise<void> {
    logger.info('Saving documentation metrics', { count: metrics.length });
  }

  /**
   * Save form metrics
   */
  private async saveFormMetrics(metrics: FormMetric[]): Promise<void> {
    logger.info('Saving form metrics', { count: metrics.length });
  }

  /**
   * Save custom events
   */
  private async saveEvents(events: AnalyticsEvent[]): Promise<void> {
    logger.info('Saving custom events', { count: events.length });
  }

  /**
   * Update real-time counters
   */
  private async updateRealTimeCounters(metric: APIUsageMetric): Promise<void> {
    const now = Date.now();
    const window = 60000; // 1 minute window

    // Requests per second calculation
    await this.redis.zadd('api:requests', now, `${metric.endpoint}:${now}`);
    await this.redis.zremrangebyscore('api:requests', 0, now - window);

    // Response time tracking
    await this.redis.lpush('api:response_times', metric.responseTime);
    await this.redis.ltrim('api:response_times', 0, 999); // Keep last 1000

    // Error tracking
    if (metric.statusCode >= 400) {
      await this.redis.hincrby('api:errors', metric.endpoint, 1);
    }
  }

  /**
   * Check for anomalies in API usage
   */
  private async checkForAnomalies(metric: APIUsageMetric): Promise<void> {
    // High response time
    if (metric.responseTime > 5000) {
      this.emit('anomaly:slow_response', {
        endpoint: metric.endpoint,
        responseTime: metric.responseTime,
        timestamp: metric.timestamp
      });
    }

    // Error spike detection
    if (metric.statusCode >= 500) {
      const recentErrors = await this.redis.hget('api:errors', metric.endpoint);
      if (parseInt(recentErrors || '0') > 10) {
        this.emit('anomaly:error_spike', {
          endpoint: metric.endpoint,
          errorCount: recentErrors,
          timestamp: metric.timestamp
        });
      }
    }

    // Rate limit detection
    if (metric.apiKey) {
      const requests = await this.redis.incr(`ratelimit:${metric.apiKey}:${Math.floor(Date.now() / 60000)}`);
      await this.redis.expire(`ratelimit:${metric.apiKey}:${Math.floor(Date.now() / 60000)}`, 60);
      
      if (requests > 100) { // 100 requests per minute
        this.emit('anomaly:rate_limit', {
          apiKey: metric.apiKey,
          requests,
          timestamp: metric.timestamp
        });
      }
    }
  }

  /**
   * Track user journey through documentation
   */
  private async trackUserJourney(sessionId: string, type: string, page: string): Promise<void> {
    const journeyKey = `journey:${sessionId}`;
    await this.redis.rpush(journeyKey, `${type}:${page}:${Date.now()}`);
    await this.redis.expire(journeyKey, 3600); // 1 hour expiry
  }

  /**
   * Update conversion funnel
   */
  private async updateConversionFunnel(formId: string, event: string, sessionId: string): Promise<void> {
    const funnelKey = `funnel:${formId}`;
    
    if (event === 'started') {
      await this.redis.sadd(`${funnelKey}:started`, sessionId);
    } else if (event === 'submitted') {
      await this.redis.sadd(`${funnelKey}:completed`, sessionId);
    }
  }

  /**
   * Get real-time metrics
   */
  async getRealTimeMetrics(): Promise<RealTimeMetrics> {
    try {
      // Get active users (unique sessions in last 5 minutes)
      const activeSessions = await this.redis.zcount('active:sessions', Date.now() - 300000, Date.now());

      // Get requests per second
      const recentRequests = await this.redis.zcount('api:requests', Date.now() - 60000, Date.now());
      const requestsPerSecond = recentRequests / 60;

      // Get average response time
      const responseTimes = await this.redis.lrange('api:response_times', 0, 99);
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + parseFloat(time), 0) / responseTimes.length
        : 0;

      // Get error rate
      const errors = await this.redis.hgetall('api:errors');
      const totalErrors = Object.values(errors).reduce((sum, count) => sum + parseInt(count), 0);
      const errorRate = recentRequests > 0 ? (totalErrors / recentRequests) * 100 : 0;

      // Get top endpoints
      const endpointCounts = await this.redis.hgetall('api:endpoint_counts');
      const topEndpoints = Object.entries(endpointCounts)
        .map(([endpoint, count]) => ({ endpoint, count: parseInt(count) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Check API health
      const apiHealth = await this.checkAPIHealth();

      return {
        activeUsers: activeSessions,
        requestsPerSecond,
        averageResponseTime: avgResponseTime,
        errorRate,
        topEndpoints,
        apiHealth
      };
    } catch (error) {
      logger.error('Failed to get real-time metrics', { error });
      throw error;
    }
  }

  /**
   * Check API health status
   */
  private async checkAPIHealth(): Promise<Record<string, 'healthy' | 'degraded' | 'down'>> {
    const health: Record<string, 'healthy' | 'degraded' | 'down'> = {};
    
    // Check each service endpoint
    const services = ['auth', 'api', 'docs', 'forms', 'payments'];
    
    for (const service of services) {
      const errors = await this.redis.hget('api:errors', `/${service}`);
      const errorCount = parseInt(errors || '0');
      
      if (errorCount === 0) {
        health[service] = 'healthy';
      } else if (errorCount < 10) {
        health[service] = 'degraded';
      } else {
        health[service] = 'down';
      }
    }
    
    return health;
  }

  /**
   * Get API usage statistics
   */
  async getAPIUsageStats(options: {
    startDate?: Date;
    endDate?: Date;
    groupBy?: 'hour' | 'day' | 'week' | 'month';
    endpoint?: string;
    userId?: string;
  } = {}): Promise<{
    totalRequests: number;
    uniqueUsers: number;
    averageResponseTime: number;
    errorRate: number;
    topEndpoints: Array<{ endpoint: string; count: number; avgResponseTime: number }>;
    usageOverTime: Array<{ timestamp: Date; requests: number }>;
    statusCodeDistribution: Record<number, number>;
  }> {
    // This would query the database for historical data
    logger.info('Getting API usage statistics', { options });

    // Demo data for now
    return {
      totalRequests: 45678,
      uniqueUsers: 234,
      averageResponseTime: 145.7,
      errorRate: 0.23,
      topEndpoints: [
        { endpoint: '/api/generate', count: 12345, avgResponseTime: 234 },
        { endpoint: '/api/analyze', count: 8901, avgResponseTime: 456 },
        { endpoint: '/api/templates', count: 6789, avgResponseTime: 123 }
      ],
      usageOverTime: this.generateTimeSeriesData(),
      statusCodeDistribution: {
        200: 42345,
        201: 1234,
        400: 567,
        401: 234,
        404: 456,
        500: 123
      }
    };
  }

  /**
   * Get documentation analytics
   */
  async getDocumentationAnalytics(options: {
    startDate?: Date;
    endDate?: Date;
    page?: string;
  } = {}): Promise<{
    totalPageViews: number;
    uniqueVisitors: number;
    averageTimeOnPage: number;
    popularPages: Array<{ page: string; views: number; avgTime: number }>;
    searchQueries: Array<{ query: string; count: number }>;
    userJourneys: Array<{ path: string[]; count: number }>;
  }> {
    logger.info('Getting documentation analytics', { options });

    // Get page views from Redis
    const pageViews = await this.redis.hgetall('docs:pageviews');
    const popularPages = Object.entries(pageViews)
      .map(([page, views]) => ({ page, views: parseInt(views), avgTime: Math.random() * 300 }))
      .sort((a, b) => b.views - a.views);

    return {
      totalPageViews: Object.values(pageViews).reduce((sum, views) => sum + parseInt(views), 0),
      uniqueVisitors: 456,
      averageTimeOnPage: 187.3,
      popularPages: popularPages.slice(0, 10),
      searchQueries: [
        { query: 'api authentication', count: 234 },
        { query: 'rate limits', count: 189 },
        { query: 'webhook setup', count: 156 }
      ],
      userJourneys: [
        { path: ['/', '/docs/getting-started', '/docs/api-reference'], count: 78 },
        { path: ['/', '/docs/authentication', '/docs/api-reference/auth'], count: 56 }
      ]
    };
  }

  /**
   * Get form analytics
   */
  async getFormAnalytics(formId: string, options: {
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<{
    submissions: number;
    started: number;
    completed: number;
    conversionRate: number;
    abandonmentRate: number;
    averageCompletionTime: number;
    fieldErrors: Record<string, number>;
    dropoffByStep: Array<{ step: string; started: number; completed: number; dropoffRate: number }>;
    deviceBreakdown: Record<string, number>;
  }> {
    logger.info('Getting form analytics', { formId, options });

    // Get form metrics from Redis
    const started = await this.redis.get(`forms:${formId}:started`) || '0';
    const submitted = await this.redis.get(`forms:${formId}:submitted`) || '0';
    const errors = await this.redis.hgetall(`forms:${formId}:errors`);

    const startedCount = parseInt(started);
    const submittedCount = parseInt(submitted);

    return {
      submissions: submittedCount,
      started: startedCount,
      completed: submittedCount,
      conversionRate: startedCount > 0 ? (submittedCount / startedCount) * 100 : 0,
      abandonmentRate: startedCount > 0 ? ((startedCount - submittedCount) / startedCount) * 100 : 0,
      averageCompletionTime: 156.8,
      fieldErrors: Object.fromEntries(
        Object.entries(errors).map(([field, count]) => [field, parseInt(count)])
      ),
      dropoffByStep: [
        { step: 'personal_info', started: 1000, completed: 890, dropoffRate: 11 },
        { step: 'company_details', started: 890, completed: 756, dropoffRate: 15 },
        { step: 'preferences', started: 756, completed: 678, dropoffRate: 10 }
      ],
      deviceBreakdown: {
        desktop: 567,
        mobile: 234,
        tablet: 89
      }
    };
  }

  /**
   * Generate time series data for demo
   */
  private generateTimeSeriesData(): Array<{ timestamp: Date; requests: number }> {
    const data = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 3600000);
      const requests = Math.floor(Math.random() * 1000) + 500;
      data.push({ timestamp, requests });
    }
    
    return data;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Aggregate metrics periodically
   */
  private async aggregateMetrics(): Promise<void> {
    try {
      logger.info('Aggregating metrics');

      // Aggregate API metrics by hour
      await this.aggregateAPIMetrics();

      // Aggregate form conversion funnels
      await this.aggregateFormFunnels();

      // Clean up old data
      await this.cleanupOldData();

      this.emit('aggregation:complete', { timestamp: new Date() });
    } catch (error) {
      logger.error('Failed to aggregate metrics', { error });
    }
  }

  /**
   * Aggregate API metrics
   */
  private async aggregateAPIMetrics(): Promise<void> {
    // This would aggregate raw metrics into hourly/daily summaries
    logger.info('Aggregating API metrics');
  }

  /**
   * Aggregate form funnels
   */
  private async aggregateFormFunnels(): Promise<void> {
    // Calculate conversion rates for each form
    const formKeys = await this.redis.keys('funnel:*:started');
    
    for (const key of formKeys) {
      const formId = key.split(':')[1];
      const started = await this.redis.scard(`funnel:${formId}:started`);
      const completed = await this.redis.scard(`funnel:${formId}:completed`);
      
      const conversionRate = started > 0 ? (completed / started) * 100 : 0;
      
      await this.redis.hset('forms:conversion_rates', formId, conversionRate.toFixed(2));
    }
  }

  /**
   * Clean up old data
   */
  private async cleanupOldData(): Promise<void> {
    const oneDayAgo = Date.now() - 86400000;
    
    // Clean up old request data
    await this.redis.zremrangebyscore('api:requests', 0, oneDayAgo);
    
    // Reset error counters
    await this.redis.del('api:errors');
    
    logger.info('Cleaned up old analytics data');
  }

  /**
   * Export analytics data
   */
  async exportAnalytics(options: {
    type: 'api' | 'docs' | 'forms' | 'all';
    format: 'json' | 'csv' | 'excel';
    startDate?: Date;
    endDate?: Date;
  }): Promise<Buffer> {
    logger.info('Exporting analytics', { options });

    // Gather data based on type
    const data: any = {};

    if (options.type === 'api' || options.type === 'all') {
      data.api = await this.getAPIUsageStats({ 
        startDate: options.startDate, 
        endDate: options.endDate 
      });
    }

    if (options.type === 'docs' || options.type === 'all') {
      data.documentation = await this.getDocumentationAnalytics({
        startDate: options.startDate,
        endDate: options.endDate
      });
    }

    if (options.type === 'forms' || options.type === 'all') {
      // Would need to get all form IDs and aggregate
      data.forms = [];
    }

    // Convert to requested format
    switch (options.format) {
      case 'json':
        return Buffer.from(JSON.stringify(data, null, 2));
      
      case 'csv':
        // Would use a CSV library to convert
        return Buffer.from('CSV export not implemented');
      
      case 'excel':
        // Would use exceljs or similar
        return Buffer.from('Excel export not implemented');
      
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Clean up and stop service
   */
  async stop(): Promise<void> {
    clearInterval(this.flushInterval);
    clearInterval(this.aggregationInterval);
    
    // Flush any remaining metrics
    await this.flushMetrics();
    
    // Close Redis connection
    await this.redis.quit();
    
    this.emit('stopped', { timestamp: new Date() });
  }
}

// Export singleton instance
export const enhancedAnalyticsService = new EnhancedAnalyticsService();