/**
 * Prometheus Metrics Collection Service
 * Comprehensive metrics collection for FinishThisIdea Platform
 */

import client from 'prom-client';
import { Express, Request, Response, NextFunction } from 'express';
import responseTime from 'response-time';
import os from 'os';
import { prisma } from '../../utils/database';
import { redis } from '../../config/redis';
import { logger } from '../../utils/logger';

export class PrometheusMetricsService {
  private static instance: PrometheusMetricsService;
  
  // HTTP Metrics
  public httpRequestDuration: client.Histogram<string>;
  public httpRequestTotal: client.Counter<string>;
  public httpRequestSizeBytes: client.Histogram<string>;
  public httpResponseSizeBytes: client.Histogram<string>;
  
  // Business Metrics
  public jobsTotal: client.Counter<string>;
  public jobsCurrentlyProcessing: client.Gauge<string>;
  public uploadsTotal: client.Counter<string>;
  public apiKeysUsage: client.Counter<string>;
  public paymentsTotal: client.Counter<string>;
  public usersRegistered: client.Gauge<string>;
  
  // System Metrics
  public nodeVersion: client.Gauge<string>;
  public processStartTime: client.Gauge<string>;
  public processUptime: client.Gauge<string>;
  public databaseConnections: client.Gauge<string>;
  public redisConnections: client.Gauge<string>;
  
  // Performance Metrics
  public memoryUsage: client.Gauge<string>;
  public cpuUsage: client.Gauge<string>;
  public eventLoopLag: client.Histogram<string>;
  
  // Custom Application Metrics
  public aiRequestsTotal: client.Counter<string>;
  public qrCodesGenerated: client.Counter<string>;
  public socialSharesTotal: client.Counter<string>;
  public achievementsUnlocked: client.Counter<string>;
  
  // SLA/SLO Metrics
  public sloCompliance: client.Gauge<string>;
  public errorBudgetRemaining: client.Gauge<string>;
  
  // Incident Management Metrics
  public incidentsCreated: client.Counter<string>;
  public incidentsResolved: client.Counter<string>;
  public incidentErrors: client.Counter<string>;
  
  // Backup Metrics
  public backupsScheduled: client.Counter<string>;
  public backupsCompleted: client.Counter<string>;
  public backupErrors: client.Counter<string>;
  
  private registry: client.Registry;
  
  constructor() {
    this.registry = client.register;
    
    // Clear existing metrics to avoid conflicts
    this.registry.clear();
    
    this.initializeMetrics();
    this.setupDefaultMetrics();
    this.startPeriodicCollection();
  }
  
  public static getInstance(): PrometheusMetricsService {
    if (!PrometheusMetricsService.instance) {
      PrometheusMetricsService.instance = new PrometheusMetricsService();
    }
    return PrometheusMetricsService.instance;
  }
  
  private initializeMetrics(): void {
    // HTTP Metrics
    this.httpRequestDuration = new client.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      registers: [this.registry],
    });
    
    this.httpRequestTotal = new client.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });
    
    this.httpRequestSizeBytes = new client.Histogram({
      name: 'http_request_size_bytes',
      help: 'Size of HTTP requests in bytes',
      labelNames: ['method', 'route'],
      buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
      registers: [this.registry],
    });
    
    this.httpResponseSizeBytes = new client.Histogram({
      name: 'http_response_size_bytes',
      help: 'Size of HTTP responses in bytes',
      labelNames: ['method', 'route'],
      buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
      registers: [this.registry],
    });
    
    // Business Metrics
    this.jobsTotal = new client.Counter({
      name: 'finishthisidea_jobs_total',
      help: 'Total number of cleanup jobs processed',
      labelNames: ['status', 'tier'],
      registers: [this.registry],
    });
    
    this.jobsCurrentlyProcessing = new client.Gauge({
      name: 'finishthisidea_jobs_processing_current',
      help: 'Number of jobs currently being processed',
      labelNames: ['tier'],
      registers: [this.registry],
    });
    
    this.uploadsTotal = new client.Counter({
      name: 'finishthisidea_uploads_total',
      help: 'Total number of file uploads',
      labelNames: ['file_type', 'status'],
      registers: [this.registry],
    });
    
    this.apiKeysUsage = new client.Counter({
      name: 'finishthisidea_api_keys_usage_total',
      help: 'Total API key usage',
      labelNames: ['key_id', 'tier', 'endpoint'],
      registers: [this.registry],
    });
    
    this.paymentsTotal = new client.Counter({
      name: 'finishthisidea_payments_total',
      help: 'Total payments processed',
      labelNames: ['status', 'amount_range'],
      registers: [this.registry],
    });
    
    this.usersRegistered = new client.Gauge({
      name: 'finishthisidea_users_registered_total',
      help: 'Total number of registered users',
      labelNames: ['tier'],
      registers: [this.registry],
    });
    
    // System Metrics
    this.nodeVersion = new client.Gauge({
      name: 'nodejs_version_info',
      help: 'Node.js version info',
      labelNames: ['version'],
      registers: [this.registry],
    });
    
    this.processStartTime = new client.Gauge({
      name: 'process_start_time_seconds',
      help: 'Start time of the process since unix epoch in seconds',
      registers: [this.registry],
    });
    
    this.processUptime = new client.Gauge({
      name: 'process_uptime_seconds',
      help: 'Process uptime in seconds',
      registers: [this.registry],
    });
    
    this.databaseConnections = new client.Gauge({
      name: 'finishthisidea_database_connections_active',
      help: 'Number of active database connections',
      registers: [this.registry],
    });
    
    this.redisConnections = new client.Gauge({
      name: 'finishthisidea_redis_connections_active',
      help: 'Number of active Redis connections',
      registers: [this.registry],
    });
    
    // Performance Metrics
    this.memoryUsage = new client.Gauge({
      name: 'process_memory_usage_bytes',
      help: 'Process memory usage in bytes',
      labelNames: ['type'],
      registers: [this.registry],
    });
    
    this.cpuUsage = new client.Gauge({
      name: 'process_cpu_usage_percent',
      help: 'Process CPU usage percentage',
      registers: [this.registry],
    });
    
    this.eventLoopLag = new client.Histogram({
      name: 'nodejs_eventloop_lag_seconds',
      help: 'Lag of event loop in seconds',
      buckets: [0.001, 0.01, 0.1, 1, 10],
      registers: [this.registry],
    });
    
    // Cache Performance Metrics
    this.cacheOperations = new client.Counter({
      name: 'finishthisidea_cache_operations_total',
      help: 'Total cache operations',
      labelNames: ['operation', 'cache'],
      registers: [this.registry],
    });
    
    this.cacheHits = new client.Counter({
      name: 'finishthisidea_cache_hits_total',
      help: 'Total cache hits',
      labelNames: ['cache'],
      registers: [this.registry],
    });
    
    this.cacheMisses = new client.Counter({
      name: 'finishthisidea_cache_misses_total',
      help: 'Total cache misses',
      labelNames: ['cache'],
      registers: [this.registry],
    });
    
    this.cacheErrors = new client.Counter({
      name: 'finishthisidea_cache_errors_total',
      help: 'Total cache errors',
      labelNames: ['operation'],
      registers: [this.registry],
    });
    
    // Compression Metrics
    this.compressionAttempts = new client.Counter({
      name: 'finishthisidea_compression_attempts_total',
      help: 'Total compression attempts',
      labelNames: ['type'],
      registers: [this.registry],
    });
    
    this.compressionRatio = new client.Histogram({
      name: 'finishthisidea_compression_ratio_percent',
      help: 'Compression ratio percentage',
      buckets: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
      registers: [this.registry],
    });
    
    this.compressionSavings = new client.Counter({
      name: 'finishthisidea_compression_savings_bytes',
      help: 'Total bytes saved through compression',
      registers: [this.registry],
    });
    
    // Database Performance Metrics
    this.databaseQueryDuration = new client.Histogram({
      name: 'finishthisidea_database_query_duration_ms',
      help: 'Database query duration in milliseconds',
      labelNames: ['query'],
      buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
      registers: [this.registry],
    });
    
    this.databaseErrors = new client.Counter({
      name: 'finishthisidea_database_errors_total',
      help: 'Total database errors',
      labelNames: ['operation', 'model'],
      registers: [this.registry],
    });
    
    // Performance Monitoring Metrics
    this.performanceMeasurements = new client.Histogram({
      name: 'finishthisidea_performance_measurements_ms',
      help: 'Performance measurements in milliseconds',
      labelNames: ['name'],
      buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
      registers: [this.registry],
    });
    
    this.performanceAlerts = new client.Counter({
      name: 'finishthisidea_performance_alerts_total',
      help: 'Total performance alerts triggered',
      labelNames: ['type'],
      registers: [this.registry],
    });
    
    this.functionDuration = new client.Histogram({
      name: 'finishthisidea_function_duration_ms',
      help: 'Function execution duration in milliseconds',
      labelNames: ['name'],
      buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000],
      registers: [this.registry],
    });
    
    this.functionErrors = new client.Counter({
      name: 'finishthisidea_function_errors_total',
      help: 'Total function execution errors',
      labelNames: ['name'],
      registers: [this.registry],
    });
    
    // SLA/SLO Metrics
    this.sloCompliance = new client.Gauge({
      name: 'finishthisidea_slo_compliance_percent',
      help: 'SLO compliance percentage',
      labelNames: ['slo'],
      registers: [this.registry],
    });
    
    this.errorBudgetRemaining = new client.Gauge({
      name: 'finishthisidea_error_budget_remaining_percent',
      help: 'Error budget remaining percentage',
      labelNames: ['slo'],
      registers: [this.registry],
    });
    
    // Incident Management Metrics
    this.incidentsCreated = new client.Counter({
      name: 'finishthisidea_incidents_created_total',
      help: 'Total incidents created',
      labelNames: ['severity', 'service'],
      registers: [this.registry],
    });
    
    this.incidentsResolved = new client.Counter({
      name: 'finishthisidea_incidents_resolved_total',
      help: 'Total incidents resolved',
      registers: [this.registry],
    });
    
    this.incidentErrors = new client.Counter({
      name: 'finishthisidea_incident_errors_total',
      help: 'Total incident management errors',
      registers: [this.registry],
    });
    
    // Backup Metrics
    this.backupsScheduled = new client.Counter({
      name: 'finishthisidea_backups_scheduled_total',
      help: 'Total backups scheduled',
      labelNames: ['type'],
      registers: [this.registry],
    });
    
    this.backupsCompleted = new client.Counter({
      name: 'finishthisidea_backups_completed_total',
      help: 'Total backups completed successfully',
      labelNames: ['type'],
      registers: [this.registry],
    });
    
    this.backupErrors = new client.Counter({
      name: 'finishthisidea_backup_errors_total',
      help: 'Total backup errors',
      labelNames: ['type'],
      registers: [this.registry],
    });
    
    // Custom Application Metrics
    this.aiRequestsTotal = new client.Counter({
      name: 'finishthisidea_ai_requests_total',
      help: 'Total AI API requests',
      labelNames: ['provider', 'model', 'status'],
      registers: [this.registry],
    });
    
    this.qrCodesGenerated = new client.Counter({
      name: 'finishthisidea_qr_codes_generated_total',
      help: 'Total QR codes generated',
      labelNames: ['type'],
      registers: [this.registry],
    });
    
    this.socialSharesTotal = new client.Counter({
      name: 'finishthisidea_social_shares_total',
      help: 'Total social media shares',
      labelNames: ['platform', 'content_type'],
      registers: [this.registry],
    });
    
    this.achievementsUnlocked = new client.Counter({
      name: 'finishthisidea_achievements_unlocked_total',
      help: 'Total achievements unlocked by users',
      labelNames: ['achievement_type', 'tier'],
      registers: [this.registry],
    });
  }
  
  private setupDefaultMetrics(): void {
    try {
      // Clear any existing default metrics to avoid duplicate registration
      this.registry.clear();
      
      // Enable default Node.js metrics
      client.collectDefaultMetrics({
        register: this.registry,
        gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
      });
      
      // Set static metrics
      this.nodeVersion.set({ version: process.version }, 1);
      this.processStartTime.set(Date.now() / 1000 - process.uptime());
    } catch (error) {
      logger.warn('Default metrics may already be registered:', error);
    }
  }
  
  private startPeriodicCollection(): void {
    // Update process uptime every 30 seconds
    setInterval(() => {
      this.processUptime.set(process.uptime());
      this.updateMemoryMetrics();
      this.updateSystemMetrics();
    }, 30000);
    
    // Update business metrics every minute
    setInterval(() => {
      this.updateBusinessMetrics();
    }, 60000);
  }
  
  private updateMemoryMetrics(): void {
    const memUsage = process.memoryUsage();
    this.memoryUsage.set({ type: 'rss' }, memUsage.rss);
    this.memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
    this.memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
    this.memoryUsage.set({ type: 'external' }, memUsage.external);
  }
  
  private updateSystemMetrics(): void {
    // CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
    this.cpuUsage.set(cpuPercent);
  }
  
  private async updateBusinessMetrics(): Promise<void> {
    try {
      // Update user counts by tier
      const userCounts = await prisma.user.groupBy({
        by: ['tier'],
        _count: { id: true },
      });
      
      userCounts.forEach(({ tier, _count }) => {
        this.usersRegistered.set({ tier }, _count.id);
      });
      
      // Update job counts by status
      const jobCounts = await prisma.job.groupBy({
        by: ['status'],
        _count: { id: true },
      });
      
      jobCounts.forEach(({ status, _count }) => {
        this.jobsCurrentlyProcessing.set({ tier: 'all' }, _count.id);
      });
      
    } catch (error) {
      logger.error('Failed to update business metrics:', error);
    }
  }
  
  /**
   * Express middleware factory for HTTP metrics collection
   */
  public createHttpMetricsMiddleware() {
    return responseTime((req: Request, res: Response, time: number) => {
      const route = this.normalizeRoute(req.route?.path || req.path);
      const method = req.method;
      const statusCode = res.statusCode.toString();
      
      // Record HTTP metrics
      this.httpRequestDuration.observe(
        { method, route, status_code: statusCode },
        time / 1000 // Convert to seconds
      );
      
      this.httpRequestTotal.inc({ method, route, status_code: statusCode });
      
      // Record request/response sizes
      const reqSize = parseInt(req.get('content-length') || '0', 10);
      const resSize = parseInt(res.get('content-length') || '0', 10);
      
      if (reqSize > 0) {
        this.httpRequestSizeBytes.observe({ method, route }, reqSize);
      }
      
      if (resSize > 0) {
        this.httpResponseSizeBytes.observe({ method, route }, resSize);
      }
    });
  }
  
  /**
   * Normalize route paths for consistent labeling
   */
  private normalizeRoute(path: string): string {
    return path
      .replace(/\/\d+/g, '/:id')
      .replace(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/g, '/:uuid')
      .replace(/\/[a-zA-Z0-9]{10,}/g, '/:token')
      || '/unknown';
  }
  
  /**
   * Record business metrics
   */
  public recordJobCreated(tier: string): void {
    this.jobsTotal.inc({ status: 'created', tier });
  }
  
  public recordJobCompleted(status: string, tier: string): void {
    this.jobsTotal.inc({ status, tier });
  }
  
  public recordUpload(fileType: string, status: string): void {
    this.uploadsTotal.inc({ file_type: fileType, status });
  }
  
  public recordApiKeyUsage(keyId: string, tier: string, endpoint: string): void {
    this.apiKeysUsage.inc({ key_id: keyId, tier, endpoint });
  }
  
  public recordPayment(status: string, amount: number): void {
    const amountRange = this.getAmountRange(amount);
    this.paymentsTotal.inc({ status, amount_range: amountRange });
  }
  
  public recordAiRequest(provider: string, model: string, status: string): void {
    this.aiRequestsTotal.inc({ provider, model, status });
  }
  
  public recordQrCodeGenerated(type: string): void {
    this.qrCodesGenerated.inc({ type });
  }
  
  public recordSocialShare(platform: string, contentType: string): void {
    this.socialSharesTotal.inc({ platform, content_type: contentType });
  }
  
  public recordAchievementUnlocked(achievementType: string, tier: string): void {
    this.achievementsUnlocked.inc({ achievement_type: achievementType, tier });
  }
  
  private getAmountRange(amount: number): string {
    if (amount < 100) return '0-99';
    if (amount < 500) return '100-499';
    if (amount < 1000) return '500-999';
    if (amount < 5000) return '1000-4999';
    if (amount < 10000) return '5000-9999';
    return '10000+';
  }
  
  /**
   * Get all metrics in Prometheus format
   */
  public async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
  
  /**
   * Get registry for custom use
   */
  public getRegistry(): client.Registry {
    return this.registry;
  }
  
  /**
   * Reset all metrics (useful for testing)
   */
  public reset(): void {
    this.registry.resetMetrics();
  }
}

// Export singleton instance
export const prometheusMetrics = PrometheusMetricsService.getInstance();