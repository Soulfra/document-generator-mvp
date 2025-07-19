/**
 * Enterprise Console Integration Service
 * 
 * Connects our platform with the existing Soulfra enterprise console system
 * Provides multi-tenancy, white-label support, and enterprise administration
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import axios, { AxiosInstance } from 'axios';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

export interface ConsoleConfig {
  consoleUrl?: string;
  autoStart?: boolean;
  soulfraPath?: string;
  port?: number;
  witnessValidation?: boolean;
  enableWhiteLabel?: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  subdomain?: string;
  status: 'active' | 'inactive' | 'suspended' | 'provisioning';
  plan: 'starter' | 'professional' | 'enterprise' | 'custom';
  features: string[];
  limits: {
    users: number;
    projects: number;
    storage: number; // in GB
    apiCalls: number;
    agents: number;
  };
  customization: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    favicon?: string;
    customDomain?: string;
    whiteLabel: boolean;
  };
  compliance: {
    frameworks: string[]; // GDPR, SOC2, HIPAA, ISO27001
    dataResidency: string;
    encryption: boolean;
    auditLogging: boolean;
  };
  resources: {
    namespace: string;
    cpu: string;
    memory: string;
    storage: string;
    network: string;
  };
  billing: {
    stripeCustomerId?: string;
    subscriptionId?: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    usage: {
      users: number;
      projects: number;
      storage: number;
      apiCalls: number;
      compute: number;
    };
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsoleMetrics {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalProjects: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
  revenueMetrics: {
    monthlyRecurringRevenue: number;
    averageRevenuePerUser: number;
    customerLifetimeValue: number;
    churnRate: number;
  };
  complianceStatus: {
    gdpr: number;
    soc2: number;
    hipaa: number;
    iso27001: number;
  };
  systemHealth: {
    uptime: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
}

export interface TenantRequest {
  name: string;
  domain?: string;
  plan: string;
  adminEmail: string;
  adminName: string;
  features?: string[];
  customization?: Partial<Tenant['customization']>;
  compliance?: Partial<Tenant['compliance']>;
}

export interface TenantUpdate {
  name?: string;
  domain?: string;
  status?: string;
  plan?: string;
  features?: string[];
  limits?: Partial<Tenant['limits']>;
  customization?: Partial<Tenant['customization']>;
  compliance?: Partial<Tenant['compliance']>;
}

export interface DepartmentView {
  department: 'hr' | 'it' | 'finance' | 'operations' | 'executive';
  metrics: Record<string, any>;
  alerts: Array<{
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
  }>;
  insights: Array<{
    type: 'trend' | 'anomaly' | 'recommendation';
    title: string;
    description: string;
    actionable: boolean;
  }>;
}

export interface ResourceOptimization {
  tenantId: string;
  currentUsage: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
  recommendedAllocation: {
    cpu: string;
    memory: string;
    storage: string;
    network: string;
  };
  potentialSavings: number;
  optimizationScore: number;
  autoScalingEnabled: boolean;
}

export class EnterpriseConsoleIntegration extends EventEmitter {
  private config: ConsoleConfig;
  private apiClient?: AxiosInstance;
  private consoleProcess?: ChildProcess;
  private initialized: boolean = false;
  private currentPort?: number;

  constructor(config: ConsoleConfig = {}) {
    super();
    
    this.config = {
      consoleUrl: config.consoleUrl || 'http://localhost:7000',
      autoStart: config.autoStart !== false,
      soulfraPath: config.soulfraPath || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025',
      port: config.port || 7000,
      witnessValidation: config.witnessValidation !== false,
      enableWhiteLabel: config.enableWhiteLabel !== false,
      ...config
    };
  }

  async initialize(): Promise<void> {
    try {
      // Try to connect to existing console service
      await this.checkConsoleService();
      logger.info('Connected to existing enterprise console service');
      
    } catch (error) {
      if (this.config.autoStart) {
        logger.info('Enterprise console service not running, starting new instance...');
        await this.startConsoleService();
        await this.waitForConsoleService();
      } else {
        throw new Error('Enterprise console service not available and autoStart is disabled');
      }
    }

    // Setup API client
    this.setupApiClient();

    this.initialized = true;
    this.emit('initialized');
    
    logger.info('Enterprise console integration initialized', {
      url: this.config.consoleUrl,
      port: this.currentPort,
      witnessValidation: this.config.witnessValidation,
      whiteLabel: this.config.enableWhiteLabel
    });
  }

  private async startConsoleService(): Promise<void> {
    if (!this.config.soulfraPath) {
      throw new Error('Soulfra path not configured');
    }

    const consolePath = path.join(this.config.soulfraPath, 'misc', 'enterprise-console-hooks.js');
    
    this.consoleProcess = spawn('node', [consolePath], {
      cwd: this.config.soulfraPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: this.config.port!.toString(),
        WITNESS_VALIDATION: this.config.witnessValidation!.toString(),
        WHITE_LABEL_ENABLED: this.config.enableWhiteLabel!.toString(),
        NODE_PATH: this.config.soulfraPath
      }
    });

    this.consoleProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      logger.debug('Enterprise console stdout:', output);
      
      if (output.includes('Console service listening')) {
        this.emit('console-service-ready');
      }
    });

    this.consoleProcess.stderr?.on('data', (data) => {
      const error = data.toString();
      logger.warn('Enterprise console stderr:', error);
    });

    this.consoleProcess.on('exit', (code) => {
      logger.info('Enterprise console process exited', { code });
      this.consoleProcess = undefined;
      this.emit('console-service-stopped', { code });
    });

    this.consoleProcess.on('error', (error) => {
      logger.error('Enterprise console process error', error);
      this.emit('console-service-error', error);
    });
  }

  private async waitForConsoleService(): Promise<void> {
    const maxWait = 30000; // 30 seconds
    const interval = 1000; // 1 second
    let waited = 0;

    while (waited < maxWait) {
      try {
        await this.checkConsoleService();
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, interval));
        waited += interval;
      }
    }

    throw new Error('Enterprise console service failed to start within timeout');
  }

  private async checkConsoleService(): Promise<boolean> {
    const response = await axios.get(`${this.config.consoleUrl}/health`);
    return response.data.status === 'healthy';
  }

  private setupApiClient(): void {
    this.apiClient = axios.create({
      baseURL: this.config.consoleUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FinishThisIdea-Platform/1.0'
      }
    });

    // Add request/response interceptors
    this.apiClient.interceptors.request.use(
      (config) => {
        logger.debug('Enterprise console API request', { 
          method: config.method, 
          url: config.url 
        });
        return config;
      },
      (error) => {
        logger.error('Enterprise console API request error', error);
        return Promise.reject(error);
      }
    );

    this.apiClient.interceptors.response.use(
      (response) => {
        logger.debug('Enterprise console API response', { 
          status: response.status,
          url: response.config.url 
        });
        return response;
      },
      (error) => {
        logger.error('Enterprise console API error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  // Tenant Management Methods

  async createTenant(request: TenantRequest): Promise<Tenant> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    const response = await this.apiClient.post('/tenants', request);
    const tenant = response.data;

    this.emit('tenant-created', {
      tenantId: tenant.id,
      name: tenant.name,
      domain: tenant.domain,
      plan: tenant.plan
    });

    return tenant;
  }

  async getTenant(tenantId: string): Promise<Tenant> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    const response = await this.apiClient.get(`/tenants/${tenantId}`);
    return response.data;
  }

  async updateTenant(tenantId: string, updates: TenantUpdate): Promise<Tenant> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    const response = await this.apiClient.put(`/tenants/${tenantId}`, updates);
    const tenant = response.data;

    this.emit('tenant-updated', {
      tenantId,
      updates,
      tenant
    });

    return tenant;
  }

  async listTenants(options: {
    status?: string;
    plan?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ tenants: Tenant[]; total: number }> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    const response = await this.apiClient.get('/tenants', { params: options });
    return response.data;
  }

  async deleteTenant(tenantId: string, options: {
    preserveData?: boolean;
    gracePeriod?: number;
  } = {}): Promise<void> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    await this.apiClient.delete(`/tenants/${tenantId}`, { data: options });

    this.emit('tenant-deleted', {
      tenantId,
      preserveData: options.preserveData || false
    });
  }

  // White-Label Management

  async updateTenantBranding(tenantId: string, branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    favicon?: string;
    customDomain?: string;
    customCSS?: string;
  }): Promise<Tenant> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    const response = await this.apiClient.put(`/tenants/${tenantId}/branding`, branding);
    
    this.emit('tenant-branding-updated', {
      tenantId,
      branding
    });

    return response.data;
  }

  async deployTenantCustomization(tenantId: string): Promise<{
    success: boolean;
    deploymentId: string;
    customDomainConfigured: boolean;
    sslCertificateIssued: boolean;
    cdnConfigured: boolean;
  }> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    const response = await this.apiClient.post(`/tenants/${tenantId}/deploy-customization`);
    
    this.emit('tenant-customization-deployed', {
      tenantId,
      deployment: response.data
    });

    return response.data;
  }

  // Resource Management

  async getTenantResourceUsage(tenantId: string): Promise<{
    current: ResourceOptimization['currentUsage'];
    limits: Tenant['limits'];
    optimization: ResourceOptimization;
  }> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    const response = await this.apiClient.get(`/tenants/${tenantId}/resources`);
    return response.data;
  }

  async scaleTenantResources(tenantId: string, resources: {
    cpu?: string;
    memory?: string;
    storage?: string;
    network?: string;
  }): Promise<{
    success: boolean;
    scalingId: string;
    estimatedTime: number;
    cost: number;
  }> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    const response = await this.apiClient.post(`/tenants/${tenantId}/scale`, resources);
    
    this.emit('tenant-scaled', {
      tenantId,
      resources,
      result: response.data
    });

    return response.data;
  }

  async optimizeTenantResources(tenantId: string, autoApply: boolean = false): Promise<ResourceOptimization> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    const response = await this.apiClient.post(`/tenants/${tenantId}/optimize`, {
      autoApply
    });

    if (autoApply) {
      this.emit('tenant-optimized', {
        tenantId,
        optimization: response.data
      });
    }

    return response.data;
  }

  // Analytics and Metrics

  async getConsoleMetrics(): Promise<ConsoleMetrics> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    const response = await this.apiClient.get('/metrics');
    return response.data;
  }

  async getDepartmentView(department: DepartmentView['department'], tenantId?: string): Promise<DepartmentView> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    const params = tenantId ? { tenantId } : {};
    const response = await this.apiClient.get(`/departments/${department}`, { params });
    return response.data;
  }

  async getTenantAnalytics(tenantId: string, timeRange: string = '30d'): Promise<{
    usage: Tenant['billing']['usage'];
    trends: {
      users: Array<{ date: string; value: number }>;
      projects: Array<{ date: string; value: number }>;
      apiCalls: Array<{ date: string; value: number }>;
      storage: Array<{ date: string; value: number }>;
    };
    predictions: {
      nextMonthUsage: Tenant['billing']['usage'];
      costForecast: number;
      growthRate: number;
    };
  }> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    const response = await this.apiClient.get(`/tenants/${tenantId}/analytics`, {
      params: { timeRange }
    });
    return response.data;
  }

  // Compliance and Security

  async runComplianceAudit(tenantId: string, framework: string): Promise<{
    framework: string;
    score: number;
    findings: Array<{
      control: string;
      status: 'compliant' | 'non-compliant' | 'not-applicable';
      details: string;
      remediation?: string;
    }>;
    lastAudit: Date;
    nextAudit: Date;
  }> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    const response = await this.apiClient.post(`/tenants/${tenantId}/compliance/audit`, {
      framework
    });
    
    this.emit('compliance-audit-completed', {
      tenantId,
      framework,
      score: response.data.score
    });

    return response.data;
  }

  async getSecurityStatus(tenantId?: string): Promise<{
    overallScore: number;
    categories: {
      dataProtection: number;
      accessControl: number;
      networkSecurity: number;
      encryption: number;
      monitoring: number;
    };
    vulnerabilities: Array<{
      id: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      remediation: string;
      dueDate: Date;
    }>;
    certificates: Array<{
      type: string;
      status: 'valid' | 'expiring' | 'expired';
      expiryDate: Date;
    }>;
  }> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    const params = tenantId ? { tenantId } : {};
    const response = await this.apiClient.get('/security/status', { params });
    return response.data;
  }

  // Billing and Revenue

  async getTenantBilling(tenantId: string): Promise<{
    subscription: Tenant['billing'];
    invoices: Array<{
      id: string;
      period: { start: Date; end: Date };
      amount: number;
      status: 'paid' | 'pending' | 'overdue';
      downloadUrl: string;
    }>;
    usage: Tenant['billing']['usage'];
    forecast: {
      nextInvoiceAmount: number;
      projectedMonthlySpend: number;
    };
  }> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    const response = await this.apiClient.get(`/tenants/${tenantId}/billing`);
    return response.data;
  }

  async updateTenantPlan(tenantId: string, plan: string, effective?: Date): Promise<{
    success: boolean;
    effectiveDate: Date;
    proratedAmount: number;
    nextInvoiceDate: Date;
  }> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    const response = await this.apiClient.put(`/tenants/${tenantId}/plan`, {
      plan,
      effectiveDate: effective
    });

    this.emit('tenant-plan-updated', {
      tenantId,
      newPlan: plan,
      effectiveDate: response.data.effectiveDate
    });

    return response.data;
  }

  // Utility Methods

  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
    features: string[];
    witnessValidation: boolean;
  }> {
    if (!this.apiClient) {
      throw new Error('Enterprise console service not available');
    }

    const response = await this.apiClient.get('/health');
    return response.data;
  }

  async shutdown(): Promise<void> {
    if (this.consoleProcess) {
      this.consoleProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          this.consoleProcess?.kill('SIGKILL');
          resolve();
        }, 5000);

        this.consoleProcess?.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    this.initialized = false;
    this.emit('shutdown');
    logger.info('Enterprise console integration shut down');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConfig(): ConsoleConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const enterpriseConsole = new EnterpriseConsoleIntegration({
  autoStart: true,
  witnessValidation: true,
  enableWhiteLabel: true,
  soulfraPath: process.env.SOULFRA_PATH || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025'
});