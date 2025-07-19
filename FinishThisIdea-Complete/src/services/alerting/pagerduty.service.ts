/**
 * PagerDuty Integration Service
 * Incident management and alerting
 */

import axios from 'axios';
import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { slaSloService } from '../monitoring/sla-slo.service';
import { prometheusMetrics } from '../monitoring/prometheus-metrics.service';

export interface PagerDutyConfig {
  apiKey: string;
  integrationKey: string;
  serviceId?: string;
  escalationPolicyId?: string;
  baseUrl?: string;
  fromEmail?: string;
}

export interface Incident {
  id?: string;
  incidentKey: string;
  title: string;
  description: string;
  urgency: 'high' | 'low';
  severity: 'critical' | 'error' | 'warning' | 'info';
  service?: string;
  component?: string;
  customDetails?: Record<string, any>;
}

export interface OnCallSchedule {
  id: string;
  name: string;
  users: Array<{
    id: string;
    name: string;
    email: string;
    onCallFrom: Date;
    onCallUntil: Date;
  }>;
}

export class PagerDutyService extends EventEmitter {
  private static instance: PagerDutyService;
  private config: PagerDutyConfig;
  private client: any;
  private incidentCache: Map<string, Incident> = new Map();

  constructor(config?: Partial<PagerDutyConfig>) {
    super();
    
    this.config = {
      apiKey: process.env.PAGERDUTY_API_KEY || '',
      integrationKey: process.env.PAGERDUTY_INTEGRATION_KEY || '',
      serviceId: process.env.PAGERDUTY_SERVICE_ID,
      escalationPolicyId: process.env.PAGERDUTY_ESCALATION_POLICY_ID,
      baseUrl: 'https://api.pagerduty.com',
      fromEmail: process.env.PAGERDUTY_FROM_EMAIL || 'alerts@finishthisidea.com',
      ...config
    };

    this.setupEventListeners();
  }

  public static getInstance(config?: Partial<PagerDutyConfig>): PagerDutyService {
    if (!PagerDutyService.instance) {
      PagerDutyService.instance = new PagerDutyService(config);
    }
    return PagerDutyService.instance;
  }

  /**
   * Setup event listeners for automatic incident creation
   */
  private setupEventListeners(): void {
    // Listen to SLO violations
    slaSloService.on('slo:critical', (data) => {
      this.createIncidentFromSLO(data, 'critical');
    });

    slaSloService.on('slo:warning', (data) => {
      this.createIncidentFromSLO(data, 'warning');
    });
  }

  /**
   * Create incident from SLO violation
   */
  private async createIncidentFromSLO(data: any, severity: string): Promise<void> {
    const incident: Incident = {
      incidentKey: `slo-${data.slo.id}-${Date.now()}`,
      title: `SLO Violation: ${data.slo.name}`,
      description: `SLO ${data.slo.name} is at ${data.score.toFixed(2)}% (target: ${data.slo.target}%)`,
      urgency: severity === 'critical' ? 'high' : 'low',
      severity: severity as any,
      service: 'finishthisidea',
      component: 'slo-monitoring',
      customDetails: {
        sloId: data.slo.id,
        score: data.score,
        target: data.slo.target,
        metrics: data.metrics
      }
    };

    await this.createIncident(incident);
  }

  /**
   * Create PagerDuty incident
   */
  public async createIncident(incident: Incident): Promise<string> {
    try {
      if (!this.config.integrationKey) {
        logger.warn('PagerDuty integration key not configured');
        return '';
      }

      const payload = {
        routing_key: this.config.integrationKey,
        event_action: 'trigger',
        dedup_key: incident.incidentKey,
        payload: {
          summary: incident.title,
          source: 'finishthisidea',
          severity: incident.severity,
          component: incident.component,
          group: incident.service,
          custom_details: incident.customDetails || {}
        }
      };

      const response = await axios.post(
        'https://events.pagerduty.com/v2/enqueue',
        payload
      );

      if (response.data.status === 'success') {
        incident.id = response.data.dedup_key;
        this.incidentCache.set(incident.incidentKey, incident);
        
        logger.info('PagerDuty incident created', {
          incidentKey: incident.incidentKey,
          severity: incident.severity
        });

        prometheusMetrics.incidentsCreated.inc({
          severity: incident.severity,
          service: incident.service || 'unknown'
        });

        this.emit('incident:created', incident);
        return incident.id || '';
      }

      throw new Error('Failed to create incident');

    } catch (error) {
      logger.error('Failed to create PagerDuty incident', { incident, error });
      prometheusMetrics.incidentErrors.inc();
      throw error;
    }
  }

  /**
   * Acknowledge incident
   */
  public async acknowledgeIncident(incidentKey: string): Promise<void> {
    try {
      const payload = {
        routing_key: this.config.integrationKey,
        event_action: 'acknowledge',
        dedup_key: incidentKey
      };

      await axios.post('https://events.pagerduty.com/v2/enqueue', payload);

      logger.info('PagerDuty incident acknowledged', { incidentKey });
      this.emit('incident:acknowledged', incidentKey);

    } catch (error) {
      logger.error('Failed to acknowledge incident', { incidentKey, error });
      throw error;
    }
  }

  /**
   * Resolve incident
   */
  public async resolveIncident(incidentKey: string): Promise<void> {
    try {
      const payload = {
        routing_key: this.config.integrationKey,
        event_action: 'resolve',
        dedup_key: incidentKey
      };

      await axios.post('https://events.pagerduty.com/v2/enqueue', payload);

      this.incidentCache.delete(incidentKey);
      
      logger.info('PagerDuty incident resolved', { incidentKey });
      prometheusMetrics.incidentsResolved.inc();
      this.emit('incident:resolved', incidentKey);

    } catch (error) {
      logger.error('Failed to resolve incident', { incidentKey, error });
      throw error;
    }
  }

  /**
   * Get incident details
   */
  public async getIncident(incidentId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/incidents/${incidentId}`,
        {
          headers: {
            'Authorization': `Token token=${this.config.apiKey}`,
            'Accept': 'application/vnd.pagerduty+json;version=2'
          }
        }
      );

      return response.data.incident;

    } catch (error) {
      logger.error('Failed to get incident', { incidentId, error });
      throw error;
    }
  }

  /**
   * List incidents
   */
  public async listIncidents(options: {
    status?: string[];
    urgency?: string[];
    since?: Date;
    until?: Date;
    limit?: number;
  } = {}): Promise<any[]> {
    try {
      const params: any = {
        limit: options.limit || 100,
        statuses: options.status || ['triggered', 'acknowledged'],
        urgencies: options.urgency
      };

      if (options.since) {
        params.since = options.since.toISOString();
      }
      if (options.until) {
        params.until = options.until.toISOString();
      }
      if (this.config.serviceId) {
        params.service_ids = [this.config.serviceId];
      }

      const response = await axios.get(
        `${this.config.baseUrl}/incidents`,
        {
          params,
          headers: {
            'Authorization': `Token token=${this.config.apiKey}`,
            'Accept': 'application/vnd.pagerduty+json;version=2'
          }
        }
      );

      return response.data.incidents;

    } catch (error) {
      logger.error('Failed to list incidents', error);
      throw error;
    }
  }

  /**
   * Get on-call users
   */
  public async getOnCallUsers(): Promise<OnCallSchedule[]> {
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/oncalls`,
        {
          params: {
            include: ['users'],
            escalation_policy_ids: this.config.escalationPolicyId ? [this.config.escalationPolicyId] : undefined
          },
          headers: {
            'Authorization': `Token token=${this.config.apiKey}`,
            'Accept': 'application/vnd.pagerduty+json;version=2'
          }
        }
      );

      const schedules: OnCallSchedule[] = [];
      const oncallsBySchedule: Map<string, any[]> = new Map();

      // Group by schedule
      response.data.oncalls.forEach((oncall: any) => {
        const scheduleId = oncall.schedule?.id;
        if (scheduleId) {
          if (!oncallsBySchedule.has(scheduleId)) {
            oncallsBySchedule.set(scheduleId, []);
          }
          oncallsBySchedule.get(scheduleId)!.push(oncall);
        }
      });

      // Create schedule objects
      oncallsBySchedule.forEach((oncalls, scheduleId) => {
        const firstOncall = oncalls[0];
        schedules.push({
          id: scheduleId,
          name: firstOncall.schedule?.summary || 'Unknown Schedule',
          users: oncalls.map(oncall => ({
            id: oncall.user.id,
            name: oncall.user.summary,
            email: oncall.user.email,
            onCallFrom: new Date(oncall.start),
            onCallUntil: new Date(oncall.end)
          }))
        });
      });

      return schedules;

    } catch (error) {
      logger.error('Failed to get on-call users', error);
      throw error;
    }
  }

  /**
   * Create incident note
   */
  public async addIncidentNote(
    incidentId: string,
    note: string,
    userId?: string
  ): Promise<void> {
    try {
      const payload = {
        note: {
          content: note
        }
      };

      await axios.post(
        `${this.config.baseUrl}/incidents/${incidentId}/notes`,
        payload,
        {
          headers: {
            'Authorization': `Token token=${this.config.apiKey}`,
            'Accept': 'application/vnd.pagerduty+json;version=2',
            'From': userId || this.config.fromEmail
          }
        }
      );

      logger.info('Added note to incident', { incidentId });

    } catch (error) {
      logger.error('Failed to add incident note', { incidentId, error });
      throw error;
    }
  }

  /**
   * Trigger escalation
   */
  public async escalateIncident(incidentId: string): Promise<void> {
    try {
      await axios.put(
        `${this.config.baseUrl}/incidents/${incidentId}/escalate`,
        {},
        {
          headers: {
            'Authorization': `Token token=${this.config.apiKey}`,
            'Accept': 'application/vnd.pagerduty+json;version=2',
            'From': this.config.fromEmail
          }
        }
      );

      logger.info('Incident escalated', { incidentId });
      this.emit('incident:escalated', incidentId);

    } catch (error) {
      logger.error('Failed to escalate incident', { incidentId, error });
      throw error;
    }
  }

  /**
   * Create maintenance window
   */
  public async createMaintenanceWindow(
    description: string,
    startTime: Date,
    endTime: Date,
    serviceIds?: string[]
  ): Promise<string> {
    try {
      const payload = {
        maintenance_window: {
          type: 'maintenance_window',
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          description,
          services: serviceIds?.map(id => ({
            id,
            type: 'service_reference'
          })) || (this.config.serviceId ? [{
            id: this.config.serviceId,
            type: 'service_reference'
          }] : [])
        }
      };

      const response = await axios.post(
        `${this.config.baseUrl}/maintenance_windows`,
        payload,
        {
          headers: {
            'Authorization': `Token token=${this.config.apiKey}`,
            'Accept': 'application/vnd.pagerduty+json;version=2',
            'From': this.config.fromEmail
          }
        }
      );

      logger.info('Maintenance window created', {
        id: response.data.maintenance_window.id,
        start: startTime,
        end: endTime
      });

      return response.data.maintenance_window.id;

    } catch (error) {
      logger.error('Failed to create maintenance window', error);
      throw error;
    }
  }

  /**
   * Test PagerDuty connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.config.baseUrl}/abilities`,
        {
          headers: {
            'Authorization': `Token token=${this.config.apiKey}`,
            'Accept': 'application/vnd.pagerduty+json;version=2'
          }
        }
      );

      return response.status === 200;

    } catch (error) {
      logger.error('PagerDuty connection test failed', error);
      return false;
    }
  }

  /**
   * Get incident metrics
   */
  public async getIncidentMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const incidents = await this.listIncidents({
      since: startDate,
      until: endDate,
      status: ['triggered', 'acknowledged', 'resolved']
    });

    const metrics = {
      total: incidents.length,
      byUrgency: {
        high: 0,
        low: 0
      },
      bySeverity: {
        critical: 0,
        error: 0,
        warning: 0,
        info: 0
      },
      byStatus: {
        triggered: 0,
        acknowledged: 0,
        resolved: 0
      },
      averageResolutionTime: 0,
      totalResolutionTime: 0
    };

    incidents.forEach(incident => {
      // By urgency
      if (incident.urgency === 'high') metrics.byUrgency.high++;
      else metrics.byUrgency.low++;

      // By status
      metrics.byStatus[incident.status]++;

      // Resolution time
      if (incident.status === 'resolved' && incident.created_at && incident.resolved_at) {
        const created = new Date(incident.created_at);
        const resolved = new Date(incident.resolved_at);
        const resolutionTime = resolved.getTime() - created.getTime();
        metrics.totalResolutionTime += resolutionTime;
      }
    });

    // Calculate average resolution time
    const resolvedCount = metrics.byStatus.resolved;
    if (resolvedCount > 0) {
      metrics.averageResolutionTime = metrics.totalResolutionTime / resolvedCount;
    }

    return metrics;
  }
}

// Export singleton instance
export const pagerDuty = PagerDutyService.getInstance();