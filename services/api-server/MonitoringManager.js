/**
 * Monitoring Manager - System health, metrics, and error recovery
 */

const EventEmitter = require('events');

class MonitoringManager extends EventEmitter {
  constructor(jobQueue, wsManager) {
    super();
    this.jobQueue = jobQueue;
    this.wsManager = wsManager;
    this.metrics = new Map();
    this.healthChecks = new Map();
    this.alerts = [];
    this.startTime = Date.now();
    
    this.setupDefaultHealthChecks();
    this.startMonitoring();
    
    console.log('📊 Monitoring Manager initialized');
  }

  /**
   * Setup default health checks
   */
  setupDefaultHealthChecks() {
    // API Server health
    this.addHealthCheck('api_server', async () => {
      return {
        status: 'healthy',
        uptime: Date.now() - this.startTime,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage()
      };
    });

    // Job Queue health
    this.addHealthCheck('job_queue', async () => {
      const stats = await this.jobQueue.getJobsCount();
      const queueHealth = stats.failed / (stats.total || 1) < 0.1; // Less than 10% failure rate
      
      return {
        status: queueHealth ? 'healthy' : 'degraded',
        totalJobs: stats.total,
        failureRate: stats.failed / (stats.total || 1),
        pendingJobs: stats.queued + stats.processing
      };
    });

    // WebSocket health
    this.addHealthCheck('websocket', async () => {
      const wsStats = this.wsManager.getStats();
      
      return {
        status: 'healthy',
        connections: wsStats.connected,
        activeJobs: wsStats.jobs,
        rooms: wsStats.rooms
      };
    });

    // System resources
    this.addHealthCheck('system_resources', async () => {
      const memUsage = process.memoryUsage();
      const memoryHealthy = memUsage.heapUsed / memUsage.heapTotal < 0.9; // Less than 90% memory usage
      
      return {
        status: memoryHealthy ? 'healthy' : 'warning',
        memory: {
          used: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
          total: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
          usage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100) + '%'
        },
        uptime: Math.round((Date.now() - this.startTime) / 1000) + 's'
      };
    });
  }

  /**
   * Add a health check
   */
  addHealthCheck(name, checkFunction) {
    this.healthChecks.set(name, checkFunction);
  }

  /**
   * Run all health checks
   */
  async runHealthChecks() {
    const results = {};
    let overallStatus = 'healthy';

    for (const [name, checkFn] of this.healthChecks.entries()) {
      try {
        const result = await checkFn();
        results[name] = result;
        
        if (result.status === 'warning' && overallStatus === 'healthy') {
          overallStatus = 'warning';
        } else if (result.status === 'unhealthy' || result.status === 'degraded') {
          overallStatus = 'unhealthy';
        }
        
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          error: error.message
        };
        overallStatus = 'unhealthy';
      }
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results
    };
  }

  /**
   * Record metric
   */
  recordMetric(name, value, tags = {}) {
    const timestamp = Date.now();
    const metricKey = `${name}:${JSON.stringify(tags)}`;
    
    if (!this.metrics.has(metricKey)) {
      this.metrics.set(metricKey, []);
    }
    
    const metricData = this.metrics.get(metricKey);
    metricData.push({ value, timestamp });
    
    // Keep only last 1000 data points
    if (metricData.length > 1000) {
      metricData.shift();
    }
    
    this.emit('metric_recorded', { name, value, tags, timestamp });
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name, tags = {}, timeRange = 3600000) { // 1 hour default
    const metricKey = `${name}:${JSON.stringify(tags)}`;
    const metricData = this.metrics.get(metricKey) || [];
    
    const cutoffTime = Date.now() - timeRange;
    const recentData = metricData.filter(d => d.timestamp > cutoffTime);
    
    if (recentData.length === 0) {
      return null;
    }
    
    const values = recentData.map(d => d.value);
    
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      latest: values[values.length - 1],
      timeRange: timeRange / 1000 / 60 + ' minutes'
    };
  }

  /**
   * Create alert
   */
  createAlert(level, title, message, data = {}) {
    const alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level, // 'info', 'warning', 'error', 'critical'
      title,
      message,
      data,
      timestamp: new Date().toISOString(),
      acknowledged: false
    };
    
    this.alerts.push(alert);
    
    // Keep only last 500 alerts
    if (this.alerts.length > 500) {
      this.alerts.shift();
    }
    
    console.log(`🚨 Alert [${level.toUpperCase()}]: ${title} - ${message}`);
    
    // Emit alert for real-time notifications
    this.emit('alert_created', alert);
    this.wsManager.emitToApp('system:alert', alert);
    
    return alert;
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      this.emit('alert_acknowledged', alert);
    }
    return alert;
  }

  /**
   * Get system statistics
   */
  async getSystemStats() {
    const health = await this.runHealthChecks();
    const jobStats = await this.jobQueue.getJobsCount();
    const wsStats = this.wsManager.getStats();
    
    // Calculate processing metrics
    const processingTimeStats = this.getMetricStats('processing_time');
    const errorRateStats = this.getMetricStats('error_rate');
    
    return {
      health: health.status,
      uptime: Date.now() - this.startTime,
      jobs: {
        total: jobStats.total,
        active: jobStats.queued + jobStats.processing,
        failed: jobStats.failed,
        successRate: jobStats.total > 0 ? ((jobStats.completed / jobStats.total) * 100).toFixed(1) + '%' : '0%'
      },
      websockets: {
        connections: wsStats.connected,
        activeJobs: wsStats.jobs
      },
      performance: {
        avgProcessingTime: processingTimeStats ? processingTimeStats.avg.toFixed(2) + 'ms' : 'N/A',
        errorRate: errorRateStats ? errorRateStats.latest.toFixed(2) + '%' : '0%'
      },
      alerts: {
        total: this.alerts.length,
        unacknowledged: this.alerts.filter(a => !a.acknowledged).length,
        critical: this.alerts.filter(a => a.level === 'critical').length
      }
    };
  }

  /**
   * Start monitoring loop
   */
  startMonitoring() {
    // Run health checks every 30 seconds
    setInterval(async () => {
      try {
        const health = await this.runHealthChecks();
        
        // Create alerts for unhealthy services
        if (health.status === 'unhealthy') {
          const unhealthyServices = Object.entries(health.checks)
            .filter(([name, check]) => check.status === 'unhealthy')
            .map(([name]) => name);
          
          this.createAlert('critical', 'Service Health Alert', 
            `Services unhealthy: ${unhealthyServices.join(', ')}`, 
            { services: unhealthyServices, health });
        }
        
        // Record health metric
        this.recordMetric('system_health', health.status === 'healthy' ? 1 : 0);
        
      } catch (error) {
        console.error('Health check failed:', error);
        this.createAlert('error', 'Health Check Failed', error.message);
      }
    }, 30000);

    // Cleanup old metrics every 5 minutes
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 300000);

    console.log('📊 Monitoring started - health checks every 30s');
  }

  /**
   * Cleanup old metrics
   */
  cleanupOldMetrics() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    let cleanedCount = 0;
    
    for (const [key, data] of this.metrics.entries()) {
      const beforeLength = data.length;
      const filtered = data.filter(d => d.timestamp > cutoffTime);
      this.metrics.set(key, filtered);
      cleanedCount += beforeLength - filtered.length;
    }
    
    if (cleanedCount > 0) {
      console.log(`📊 Cleaned up ${cleanedCount} old metric data points`);
    }
  }

  /**
   * Monitor job processing
   */
  monitorJobProcessing(jobId, startTime) {
    const monitoringInterval = setInterval(async () => {
      try {
        const job = await this.jobQueue.getJob(jobId);
        
        if (!job) {
          clearInterval(monitoringInterval);
          return;
        }
        
        // Record processing time if completed
        if (job.status === 'completed') {
          const processingTime = Date.now() - startTime;
          this.recordMetric('processing_time', processingTime, { jobType: job.type });
          clearInterval(monitoringInterval);
        }
        
        // Check for stuck jobs (processing for more than 30 minutes)
        if (job.status === 'processing' && (Date.now() - startTime) > 1800000) {
          this.createAlert('warning', 'Long Running Job', 
            `Job ${jobId} has been processing for over 30 minutes`, 
            { jobId, status: job.status, startTime });
        }
        
        // Job failed
        if (job.status === 'failed') {
          this.recordMetric('error_rate', 1, { jobType: job.type });
          this.createAlert('error', 'Job Failed', 
            `Job ${jobId} failed: ${job.error}`, 
            { jobId, error: job.error });
          clearInterval(monitoringInterval);
        }
        
      } catch (error) {
        console.error('Job monitoring error:', error);
        clearInterval(monitoringInterval);
      }
    }, 10000); // Check every 10 seconds

    return monitoringInterval;
  }

  /**
   * Get alerts
   */
  getAlerts(options = {}) {
    let alerts = [...this.alerts];
    
    if (options.level) {
      alerts = alerts.filter(a => a.level === options.level);
    }
    
    if (options.unacknowledged) {
      alerts = alerts.filter(a => !a.acknowledged);
    }
    
    if (options.limit) {
      alerts = alerts.slice(-options.limit);
    }
    
    return alerts.reverse(); // Most recent first
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics() {
    const exported = {};
    
    for (const [key, data] of this.metrics.entries()) {
      const [name, tagsStr] = key.split(':');
      const tags = JSON.parse(tagsStr);
      
      if (!exported[name]) {
        exported[name] = [];
      }
      
      exported[name].push({
        tags,
        data: data.slice(-100) // Last 100 data points
      });
    }
    
    return exported;
  }

  /**
   * Force garbage collection if available
   */
  forceGarbageCollection() {
    if (global.gc) {
      global.gc();
      this.createAlert('info', 'Garbage Collection', 'Manual garbage collection triggered');
    }
  }

  /**
   * Get monitoring dashboard data
   */
  async getDashboardData() {
    const stats = await this.getSystemStats();
    const recentAlerts = this.getAlerts({ limit: 10 });
    const health = await this.runHealthChecks();
    
    return {
      overview: stats,
      health: health.checks,
      alerts: recentAlerts,
      metrics: {
        processingTime: this.getMetricStats('processing_time'),
        errorRate: this.getMetricStats('error_rate'),
        systemHealth: this.getMetricStats('system_health')
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = MonitoringManager;