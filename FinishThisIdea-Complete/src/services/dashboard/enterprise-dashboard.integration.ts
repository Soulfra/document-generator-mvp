/**
 * Enterprise Dashboard Integration Service
 * 
 * Connects our platform with the existing Soulfra enterprise dashboard engines
 * Provides Fortune 500-grade analytics, real-time metrics, and business intelligence
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import axios, { AxiosInstance } from 'axios';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

export interface DashboardConfig {
  serviceUrl?: string;
  autoStart?: boolean;
  soulfraPath?: string;
  port?: number;
  enableExports?: boolean;
  enableRealTime?: boolean;
}

export interface DashboardMetrics {
  revenue: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    averageRevenuePerUser: number;
    revenueGrowth: number;
    customerLifetimeValue: number;
  };
  users: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    churnRate: number;
    engagementScore: number;
  };
  performance: {
    timeSavings: number;
    productivityGain: number;
    automationRate: number;
    errorReduction: number;
    roiScore: number;
  };
  platform: {
    uptime: number;
    responseTime: number;
    throughput: number;
    errorRate: number;
    resourceUtilization: number;
  };
  business: {
    customerSatisfaction: number;
    supportTickets: number;
    featureUsage: Record<string, number>;
    conversionRate: number;
    marketShare: number;
  };
}

export interface DepartmentView {
  department: 'executive' | 'hr' | 'it' | 'finance' | 'operations' | 'sales' | 'marketing';
  metrics: Record<string, any>;
  kpis: Array<{
    name: string;
    value: number;
    target: number;
    trend: 'up' | 'down' | 'stable';
    status: 'good' | 'warning' | 'critical';
  }>;
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    actionRequired?: string;
  }>;
  insights: Array<{
    type: 'trend' | 'anomaly' | 'opportunity' | 'recommendation';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    actionable: boolean;
    suggestedActions?: string[];
  }>;
}

export interface IndustryDashboard {
  industry: 'healthcare' | 'fintech' | 'education' | 'gaming' | 'ecommerce' | 'manufacturing' | 'government';
  metrics: DashboardMetrics;
  industrySpecific: Record<string, any>;
  benchmarks: Record<string, number>;
  compliance: {
    frameworks: string[];
    scores: Record<string, number>;
    auditStatus: string;
  };
}

export interface RealtimeData {
  timestamp: Date;
  activeUsers: number;
  systemLoad: number;
  transactionsPerSecond: number;
  revenue: number;
  alerts: number;
  events: Array<{
    type: string;
    description: string;
    timestamp: Date;
    severity?: 'low' | 'medium' | 'high';
  }>;
}

export interface DashboardExport {
  type: 'pdf' | 'powerpoint' | 'excel' | 'csv';
  title: string;
  timeRange: { start: Date; end: Date };
  sections: string[];
  includeCharts: boolean;
  includeData: boolean;
  customBranding?: {
    logo: string;
    colors: string[];
    companyName: string;
  };
}

export interface PredictiveAnalytics {
  category: 'revenue' | 'users' | 'performance' | 'market';
  predictions: Array<{
    metric: string;
    currentValue: number;
    predictedValue: number;
    confidence: number;
    timeframe: string;
    factors: string[];
  }>;
  scenarios: Array<{
    name: string;
    description: string;
    impact: Record<string, number>;
    probability: number;
  }>;
  recommendations: Array<{
    action: string;
    expectedImpact: string;
    priority: 'low' | 'medium' | 'high';
    timeline: string;
  }>;
}

export interface CustomWidget {
  id: string;
  name: string;
  type: 'chart' | 'metric' | 'table' | 'gauge' | 'map' | 'timeline';
  config: {
    dataSource: string;
    visualization: Record<string, any>;
    filters: Record<string, any>;
    refreshInterval: number;
  };
  permissions: {
    viewRoles: string[];
    editRoles: string[];
  };
}

export class EnterpriseDashboardIntegration extends EventEmitter {
  private config: DashboardConfig;
  private apiClient?: AxiosInstance;
  private dashboardProcess?: ChildProcess;
  private initialized: boolean = false;
  private currentPort?: number;
  private realtimeConnection?: WebSocket;

  constructor(config: DashboardConfig = {}) {
    super();
    
    this.config = {
      serviceUrl: config.serviceUrl || 'http://localhost:5000',
      autoStart: config.autoStart !== false,
      soulfraPath: config.soulfraPath || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025',
      port: config.port || 5000,
      enableExports: config.enableExports !== false,
      enableRealTime: config.enableRealTime !== false,
      ...config
    };
  }

  async initialize(): Promise<void> {
    try {
      // Try to connect to existing dashboard service
      await this.checkDashboardService();
      logger.info('Connected to existing enterprise dashboard service');
      
    } catch (error) {
      if (this.config.autoStart) {
        logger.info('Dashboard service not running, starting new instance...');
        await this.startDashboardService();
        await this.waitForDashboardService();
      } else {
        throw new Error('Dashboard service not available and autoStart is disabled');
      }
    }

    // Setup API client
    this.setupApiClient();

    // Setup real-time connection if enabled
    if (this.config.enableRealTime) {
      await this.setupRealtimeConnection();
    }

    this.initialized = true;
    this.emit('initialized');
    
    logger.info('Enterprise dashboard integration initialized', {
      url: this.config.serviceUrl,
      port: this.currentPort,
      realtime: this.config.enableRealTime,
      exports: this.config.enableExports
    });
  }

  private async startDashboardService(): Promise<void> {
    if (!this.config.soulfraPath) {
      throw new Error('Soulfra path not configured');
    }

    const dashboardPath = path.join(this.config.soulfraPath, 'misc', 'enterprise-dashboard-engine_tier-minus20.js');
    
    this.dashboardProcess = spawn('node', [dashboardPath], {
      cwd: this.config.soulfraPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: this.config.port!.toString(),
        ENABLE_EXPORTS: this.config.enableExports!.toString(),
        ENABLE_REALTIME: this.config.enableRealTime!.toString(),
        NODE_PATH: this.config.soulfraPath
      }
    });

    this.dashboardProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      logger.debug('Dashboard service stdout:', output);
      
      if (output.includes('Dashboard service listening')) {
        this.emit('dashboard-service-ready');
      }
    });

    this.dashboardProcess.stderr?.on('data', (data) => {
      const error = data.toString();
      logger.warn('Dashboard service stderr:', error);
    });

    this.dashboardProcess.on('exit', (code) => {
      logger.info('Dashboard service process exited', { code });
      this.dashboardProcess = undefined;
      this.emit('dashboard-service-stopped', { code });
    });

    this.dashboardProcess.on('error', (error) => {
      logger.error('Dashboard service process error', error);
      this.emit('dashboard-service-error', error);
    });
  }

  private async waitForDashboardService(): Promise<void> {
    const maxWait = 30000; // 30 seconds
    const interval = 1000; // 1 second
    let waited = 0;

    while (waited < maxWait) {
      try {
        await this.checkDashboardService();
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, interval));
        waited += interval;
      }
    }

    throw new Error('Dashboard service failed to start within timeout');
  }

  private async checkDashboardService(): Promise<boolean> {
    const response = await axios.get(`${this.config.serviceUrl}/health`);
    return response.data.status === 'healthy';
  }

  private setupApiClient(): void {
    this.apiClient = axios.create({
      baseURL: this.config.serviceUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FinishThisIdea-Platform/1.0'
      }
    });

    // Add request/response interceptors
    this.apiClient.interceptors.request.use(
      (config) => {
        logger.debug('Dashboard API request', { 
          method: config.method, 
          url: config.url 
        });
        return config;
      },
      (error) => {
        logger.error('Dashboard API request error', error);
        return Promise.reject(error);
      }
    );

    this.apiClient.interceptors.response.use(
      (response) => {
        logger.debug('Dashboard API response', { 
          status: response.status,
          url: response.config.url 
        });
        return response;
      },
      (error) => {
        logger.error('Dashboard API error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  private async setupRealtimeConnection(): Promise<void> {
    const wsUrl = this.config.serviceUrl!.replace('http', 'ws') + '/realtime';
    
    this.realtimeConnection = new WebSocket(wsUrl);

    this.realtimeConnection.onopen = () => {
      logger.info('Real-time dashboard connection established');
      this.emit('realtime-connected');
    };

    this.realtimeConnection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('realtime-data', data);
      } catch (error) {
        logger.error('Failed to parse real-time data', error);
      }
    };

    this.realtimeConnection.onclose = () => {
      logger.warn('Real-time dashboard connection closed');
      this.emit('realtime-disconnected');
      
      // Attempt to reconnect after 5 seconds
      setTimeout(() => {
        if (this.initialized) {
          this.setupRealtimeConnection();
        }
      }, 5000);
    };

    this.realtimeConnection.onerror = (error) => {
      logger.error('Real-time dashboard connection error', error);
      this.emit('realtime-error', error);
    };
  }

  // Core Dashboard Methods

  async getDashboardMetrics(timeRange?: { start: Date; end: Date }): Promise<DashboardMetrics> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const params = timeRange ? {
      startDate: timeRange.start.toISOString(),
      endDate: timeRange.end.toISOString()
    } : {};

    const response = await this.apiClient.get('/metrics', { params });
    return response.data;
  }

  async getDepartmentView(department: DepartmentView['department'], tenantId?: string): Promise<DepartmentView> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const params = tenantId ? { tenantId } : {};
    const response = await this.apiClient.get(`/departments/${department}`, { params });
    return response.data;
  }

  async getIndustryDashboard(industry: IndustryDashboard['industry'], tenantId?: string): Promise<IndustryDashboard> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const params = tenantId ? { tenantId } : {};
    const response = await this.apiClient.get(`/industry/${industry}`, { params });
    return response.data;
  }

  async getRealtimeData(): Promise<RealtimeData> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const response = await this.apiClient.get('/realtime');
    return response.data;
  }

  // Analytics and Predictions

  async getPredictiveAnalytics(category: PredictiveAnalytics['category'], timeframe: string = '30d'): Promise<PredictiveAnalytics> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const response = await this.apiClient.get(`/analytics/predictive/${category}`, {
      params: { timeframe }
    });
    return response.data;
  }

  async generateInsights(dataPoints: string[], timeRange?: { start: Date; end: Date }): Promise<Array<{
    type: 'trend' | 'anomaly' | 'opportunity' | 'recommendation';
    title: string;
    description: string;
    confidence: number;
    impact: 'low' | 'medium' | 'high';
    actionable: boolean;
  }>> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const response = await this.apiClient.post('/analytics/insights', {
      dataPoints,
      timeRange
    });
    return response.data;
  }

  async runBusinessIntelligence(query: {
    metrics: string[];
    filters: Record<string, any>;
    groupBy?: string[];
    timeRange?: { start: Date; end: Date };
  }): Promise<{
    data: Array<Record<string, any>>;
    summary: Record<string, number>;
    insights: string[];
  }> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const response = await this.apiClient.post('/analytics/business-intelligence', query);
    return response.data;
  }

  // Custom Dashboards and Widgets

  async createCustomWidget(widget: Omit<CustomWidget, 'id'>): Promise<CustomWidget> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const response = await this.apiClient.post('/widgets', widget);
    const createdWidget = response.data;

    this.emit('widget-created', {
      widgetId: createdWidget.id,
      name: createdWidget.name,
      type: createdWidget.type
    });

    return createdWidget;
  }

  async updateCustomWidget(widgetId: string, updates: Partial<CustomWidget>): Promise<CustomWidget> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const response = await this.apiClient.put(`/widgets/${widgetId}`, updates);
    
    this.emit('widget-updated', {
      widgetId,
      updates
    });

    return response.data;
  }

  async getCustomWidgets(userId?: string): Promise<CustomWidget[]> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const params = userId ? { userId } : {};
    const response = await this.apiClient.get('/widgets', { params });
    return response.data;
  }

  async deleteCustomWidget(widgetId: string): Promise<void> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    await this.apiClient.delete(`/widgets/${widgetId}`);
    
    this.emit('widget-deleted', { widgetId });
  }

  // Export and Reporting

  async exportDashboard(exportConfig: DashboardExport): Promise<{
    exportId: string;
    downloadUrl: string;
    expiresAt: Date;
  }> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const response = await this.apiClient.post('/exports', exportConfig);
    const exportResult = response.data;

    this.emit('dashboard-exported', {
      exportId: exportResult.exportId,
      type: exportConfig.type,
      title: exportConfig.title
    });

    return exportResult;
  }

  async getExportStatus(exportId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    downloadUrl?: string;
    error?: string;
  }> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const response = await this.apiClient.get(`/exports/${exportId}`);
    return response.data;
  }

  async scheduleReport(schedule: {
    name: string;
    dashboard: string;
    format: 'pdf' | 'excel';
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    timeRange: 'last7days' | 'last30days' | 'lastQuarter';
  }): Promise<{
    scheduleId: string;
    nextRun: Date;
  }> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const response = await this.apiClient.post('/reports/schedule', schedule);
    
    this.emit('report-scheduled', {
      scheduleId: response.data.scheduleId,
      name: schedule.name,
      frequency: schedule.frequency
    });

    return response.data;
  }

  // Alerting and Monitoring

  async createAlert(alert: {
    name: string;
    metric: string;
    condition: 'above' | 'below' | 'equals';
    threshold: number;
    recipients: string[];
    channels: ('email' | 'slack' | 'webhook')[];
  }): Promise<{
    alertId: string;
    status: 'active' | 'inactive';
  }> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const response = await this.apiClient.post('/alerts', alert);
    
    this.emit('alert-created', {
      alertId: response.data.alertId,
      name: alert.name,
      metric: alert.metric
    });

    return response.data;
  }

  async getActiveAlerts(): Promise<Array<{
    id: string;
    name: string;
    metric: string;
    currentValue: number;
    threshold: number;
    status: 'triggered' | 'resolved';
    triggeredAt: Date;
  }>> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const response = await this.apiClient.get('/alerts/active');
    return response.data;
  }

  // Performance Monitoring

  async getSystemPerformance(): Promise<{
    uptime: number;
    responseTime: number;
    throughput: number;
    errorRate: number;
    resourceUsage: {
      cpu: number;
      memory: number;
      storage: number;
      network: number;
    };
    bottlenecks: Array<{
      component: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
      recommendation: string;
    }>;
  }> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const response = await this.apiClient.get('/performance');
    return response.data;
  }

  async getBusinessMetrics(department?: string): Promise<{
    revenue: Record<string, number>;
    customers: Record<string, number>;
    operations: Record<string, number>;
    satisfaction: Record<string, number>;
  }> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const params = department ? { department } : {};
    const response = await this.apiClient.get('/business-metrics', { params });
    return response.data;
  }

  // Utility Methods

  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
    features: string[];
    realtime: boolean;
    exports: boolean;
  }> {
    if (!this.apiClient) {
      throw new Error('Dashboard service not available');
    }

    const response = await this.apiClient.get('/health');
    return response.data;
  }

  async shutdown(): Promise<void> {
    // Close real-time connection
    if (this.realtimeConnection) {
      this.realtimeConnection.close();
      this.realtimeConnection = undefined;
    }

    // Stop dashboard process
    if (this.dashboardProcess) {
      this.dashboardProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          this.dashboardProcess?.kill('SIGKILL');
          resolve();
        }, 5000);

        this.dashboardProcess?.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    this.initialized = false;
    this.emit('shutdown');
    logger.info('Enterprise dashboard integration shut down');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  hasRealtimeConnection(): boolean {
    return this.realtimeConnection?.readyState === WebSocket.OPEN;
  }

  getConfig(): DashboardConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const enterpriseDashboard = new EnterpriseDashboardIntegration({
  autoStart: true,
  enableExports: true,
  enableRealTime: true,
  soulfraPath: process.env.SOULFRA_PATH || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025'
});