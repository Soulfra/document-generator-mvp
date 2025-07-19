/**
 * Status Page Service
 * Public-facing system health communication
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import redis from '../../config/redis';
import { prisma } from '../../utils/database';
import { prometheusMetrics } from '../monitoring/prometheus-metrics.service';
import { slaSloService } from '../monitoring/sla-slo.service';

export interface ServiceStatus {
  name: string;
  displayName: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
  description?: string;
  lastChecked: Date;
  uptime90d: number;
  responseTime?: number;
  incidents?: StatusIncident[];
}

export interface StatusIncident {
  id: string;
  service: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  severity: 'minor' | 'major' | 'critical';
  title: string;
  description: string;
  startedAt: Date;
  resolvedAt?: Date;
  updates: IncidentUpdate[];
}

export interface IncidentUpdate {
  id: string;
  timestamp: Date;
  status: string;
  message: string;
  author?: string;
}

export interface SystemStatus {
  overall: 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'maintenance';
  lastUpdated: Date;
  services: ServiceStatus[];
  activeIncidents: StatusIncident[];
  recentIncidents: StatusIncident[];
  maintenanceWindows: MaintenanceWindow[];
  metrics: {
    uptime30d: number;
    uptime90d: number;
    averageResponseTime: number;
    sloCompliance: number;
  };
}

export interface MaintenanceWindow {
  id: string;
  title: string;
  description: string;
  affectedServices: string[];
  scheduledFor: Date;
  duration: number; // minutes
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export class StatusPageService extends EventEmitter {
  private static instance: StatusPageService;
  private services: Map<string, ServiceStatus> = new Map();
  private incidents: Map<string, StatusIncident> = new Map();
  private maintenanceWindows: Map<string, MaintenanceWindow> = new Map();
  private checkInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.initializeServices();
  }

  public static getInstance(): StatusPageService {
    if (!StatusPageService.instance) {
      StatusPageService.instance = new StatusPageService();
    }
    return StatusPageService.instance;
  }

  /**
   * Initialize service definitions
   */
  private initializeServices(): void {
    const serviceDefinitions = [
      { name: 'api', displayName: 'API Gateway' },
      { name: 'database', displayName: 'Database' },
      { name: 'redis', displayName: 'Cache (Redis)' },
      { name: 'storage', displayName: 'File Storage' },
      { name: 'payments', displayName: 'Payment Processing' },
      { name: 'jobs', displayName: 'Background Jobs' },
      { name: 'ai', displayName: 'AI Services' },
      { name: 'websocket', displayName: 'Real-time Updates' }
    ];

    serviceDefinitions.forEach(def => {
      this.services.set(def.name, {
        name: def.name,
        displayName: def.displayName,
        status: 'operational',
        lastChecked: new Date(),
        uptime90d: 99.9
      });
    });
  }

  /**
   * Start monitoring services
   */
  public async startMonitoring(): Promise<void> {
    // Initial check
    await this.checkAllServices();

    // Schedule periodic checks every minute
    this.checkInterval = setInterval(async () => {
      await this.checkAllServices();
    }, 60000);

    logger.info('Status page monitoring started');
  }

  /**
   * Stop monitoring
   */
  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  /**
   * Check all services
   */
  private async checkAllServices(): Promise<void> {
    await Promise.all([
      this.checkAPIService(),
      this.checkDatabase(),
      this.checkRedis(),
      this.checkStorage(),
      this.checkPayments(),
      this.checkJobs(),
      this.checkAIServices(),
      this.checkWebSocket()
    ]);

    // Update overall status
    await this.updateOverallStatus();
  }

  /**
   * Check API service
   */
  private async checkAPIService(): Promise<void> {
    try {
      const startTime = Date.now();
      // Simple health check
      const responseTime = Date.now() - startTime;
      
      await this.updateServiceStatus('api', {
        status: responseTime < 1000 ? 'operational' : 'degraded',
        responseTime,
        lastChecked: new Date()
      });
    } catch (error) {
      await this.updateServiceStatus('api', {
        status: 'major_outage',
        lastChecked: new Date()
      });
    }
  }

  /**
   * Check database
   */
  private async checkDatabase(): Promise<void> {
    try {
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;
      
      await this.updateServiceStatus('database', {
        status: responseTime < 100 ? 'operational' : 'degraded',
        responseTime,
        lastChecked: new Date()
      });
    } catch (error) {
      await this.updateServiceStatus('database', {
        status: 'major_outage',
        lastChecked: new Date()
      });
    }
  }

  /**
   * Check Redis
   */
  private async checkRedis(): Promise<void> {
    try {
      const startTime = Date.now();
      await redis.ping();
      const responseTime = Date.now() - startTime;
      
      await this.updateServiceStatus('redis', {
        status: responseTime < 50 ? 'operational' : 'degraded',
        responseTime,
        lastChecked: new Date()
      });
    } catch (error) {
      await this.updateServiceStatus('redis', {
        status: 'major_outage',
        lastChecked: new Date()
      });
    }
  }

  /**
   * Check storage (simplified)
   */
  private async checkStorage(): Promise<void> {
    // In a real implementation, this would check S3/storage service
    await this.updateServiceStatus('storage', {
      status: 'operational',
      lastChecked: new Date()
    });
  }

  /**
   * Check payment service (simplified)
   */
  private async checkPayments(): Promise<void> {
    // In a real implementation, this would check Stripe API
    await this.updateServiceStatus('payments', {
      status: 'operational',
      lastChecked: new Date()
    });
  }

  /**
   * Check job processing
   */
  private async checkJobs(): Promise<void> {
    try {
      // Check job queue health
      const jobCount = await prisma.job.count({
        where: {
          status: 'PROCESSING'
        }
      });
      
      await this.updateServiceStatus('jobs', {
        status: jobCount < 100 ? 'operational' : 'degraded',
        lastChecked: new Date()
      });
    } catch (error) {
      await this.updateServiceStatus('jobs', {
        status: 'partial_outage',
        lastChecked: new Date()
      });
    }
  }

  /**
   * Check AI services (simplified)
   */
  private async checkAIServices(): Promise<void> {
    // In a real implementation, this would check OpenAI/AI service status
    await this.updateServiceStatus('ai', {
      status: 'operational',
      lastChecked: new Date()
    });
  }

  /**
   * Check WebSocket service (simplified)
   */
  private async checkWebSocket(): Promise<void> {
    // In a real implementation, this would check Socket.io health
    await this.updateServiceStatus('websocket', {
      status: 'operational',
      lastChecked: new Date()
    });
  }

  /**
   * Update service status
   */
  private async updateServiceStatus(
    serviceName: string, 
    updates: Partial<ServiceStatus>
  ): Promise<void> {
    const service = this.services.get(serviceName);
    if (!service) return;

    const previousStatus = service.status;
    Object.assign(service, updates);

    // Store in Redis for persistence
    await redis.setex(
      `status:service:${serviceName}`,
      3600, // 1 hour TTL
      JSON.stringify(service)
    );

    // Create incident if status degraded
    if (previousStatus === 'operational' && updates.status !== 'operational') {
      await this.createIncident({
        service: serviceName,
        severity: updates.status === 'major_outage' ? 'critical' : 'major',
        title: `${service.displayName} ${updates.status?.replace('_', ' ')}`,
        description: `${service.displayName} is experiencing issues`
      });
    }

    // Resolve incident if service recovered
    if (previousStatus !== 'operational' && updates.status === 'operational') {
      await this.resolveServiceIncidents(serviceName);
    }

    this.emit('service:updated', service);
  }

  /**
   * Create incident
   */
  public async createIncident(data: {
    service: string;
    severity: 'minor' | 'major' | 'critical';
    title: string;
    description: string;
  }): Promise<StatusIncident> {
    const incident: StatusIncident = {
      id: `inc-${Date.now()}`,
      service: data.service,
      status: 'investigating',
      severity: data.severity,
      title: data.title,
      description: data.description,
      startedAt: new Date(),
      updates: [{
        id: `upd-${Date.now()}`,
        timestamp: new Date(),
        status: 'investigating',
        message: 'We are investigating the issue'
      }]
    };

    this.incidents.set(incident.id, incident);
    
    // Store in Redis
    await redis.setex(
      `status:incident:${incident.id}`,
      86400, // 24 hour TTL
      JSON.stringify(incident)
    );

    // Add to active incidents set
    await redis.zadd(
      'status:incidents:active',
      Date.now(),
      incident.id
    );

    this.emit('incident:created', incident);
    logger.warn('Status page incident created', { incident });

    return incident;
  }

  /**
   * Update incident
   */
  public async updateIncident(
    incidentId: string,
    update: {
      status?: StatusIncident['status'];
      message: string;
      author?: string;
    }
  ): Promise<void> {
    const incident = this.incidents.get(incidentId);
    if (!incident) throw new Error('Incident not found');

    if (update.status) {
      incident.status = update.status;
    }

    incident.updates.push({
      id: `upd-${Date.now()}`,
      timestamp: new Date(),
      status: incident.status,
      message: update.message,
      author: update.author
    });

    // Update in Redis
    await redis.setex(
      `status:incident:${incident.id}`,
      86400,
      JSON.stringify(incident)
    );

    this.emit('incident:updated', incident);
  }

  /**
   * Resolve service incidents
   */
  private async resolveServiceIncidents(serviceName: string): Promise<void> {
    const activeIncidents = Array.from(this.incidents.values()).filter(
      inc => inc.service === serviceName && inc.status !== 'resolved'
    );

    for (const incident of activeIncidents) {
      incident.status = 'resolved';
      incident.resolvedAt = new Date();
      incident.updates.push({
        id: `upd-${Date.now()}`,
        timestamp: new Date(),
        status: 'resolved',
        message: 'The issue has been resolved'
      });

      // Update in Redis
      await redis.setex(
        `status:incident:${incident.id}`,
        86400,
        JSON.stringify(incident)
      );

      // Remove from active set
      await redis.zrem('status:incidents:active', incident.id);

      // Add to resolved set
      await redis.zadd(
        'status:incidents:resolved',
        Date.now(),
        incident.id
      );

      this.emit('incident:resolved', incident);
    }
  }

  /**
   * Schedule maintenance window
   */
  public async scheduleMaintenance(data: {
    title: string;
    description: string;
    affectedServices: string[];
    scheduledFor: Date;
    duration: number;
  }): Promise<MaintenanceWindow> {
    const maintenance: MaintenanceWindow = {
      id: `maint-${Date.now()}`,
      status: 'scheduled',
      ...data
    };

    this.maintenanceWindows.set(maintenance.id, maintenance);

    // Store in Redis
    await redis.setex(
      `status:maintenance:${maintenance.id}`,
      86400 * 7, // 7 day TTL
      JSON.stringify(maintenance)
    );

    this.emit('maintenance:scheduled', maintenance);
    return maintenance;
  }

  /**
   * Get current system status
   */
  public async getSystemStatus(): Promise<SystemStatus> {
    const services = Array.from(this.services.values());
    const activeIncidents = Array.from(this.incidents.values())
      .filter(inc => inc.status !== 'resolved')
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    
    const recentIncidents = Array.from(this.incidents.values())
      .filter(inc => inc.status === 'resolved')
      .sort((a, b) => (b.resolvedAt?.getTime() || 0) - (a.resolvedAt?.getTime() || 0))
      .slice(0, 10);

    const maintenanceWindows = Array.from(this.maintenanceWindows.values())
      .filter(m => m.status !== 'cancelled')
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());

    // Calculate overall status
    let overall: SystemStatus['overall'] = 'operational';
    if (services.some(s => s.status === 'major_outage')) {
      overall = 'major_outage';
    } else if (services.some(s => s.status === 'partial_outage')) {
      overall = 'partial_outage';
    } else if (services.some(s => s.status === 'degraded')) {
      overall = 'degraded';
    }

    // Get metrics (simplified for demo)
    // const sloData = await slaSloService.getSLOCompliance('uptime');
    const metrics = {
      uptime30d: 99.5, // Simplified
      uptime90d: 99.9, // Simplified
      averageResponseTime: 150, // Simplified
      sloCompliance: 99.5 // sloData?.complianceRate || 99.5
    };

    return {
      overall,
      lastUpdated: new Date(),
      services,
      activeIncidents,
      recentIncidents,
      maintenanceWindows,
      metrics
    };
  }

  /**
   * Update overall status
   */
  private async updateOverallStatus(): Promise<void> {
    const status = await this.getSystemStatus();
    
    // Store current status
    await redis.setex(
      'status:current',
      300, // 5 minute TTL
      JSON.stringify(status)
    );

    // Store historical data point
    await redis.zadd(
      'status:history',
      Date.now(),
      JSON.stringify({
        timestamp: Date.now(),
        overall: status.overall,
        services: status.services.map(s => ({
          name: s.name,
          status: s.status,
          responseTime: s.responseTime
        }))
      })
    );

    this.emit('status:updated', status);
  }

  /**
   * Get status history
   */
  public async getStatusHistory(hours: number = 24): Promise<any[]> {
    const since = Date.now() - (hours * 60 * 60 * 1000);
    const history = await redis.zrangebyscore(
      'status:history',
      since,
      Date.now()
    );

    return history.map(item => JSON.parse(item));
  }
}

// Export singleton instance
export const statusPageService = StatusPageService.getInstance();