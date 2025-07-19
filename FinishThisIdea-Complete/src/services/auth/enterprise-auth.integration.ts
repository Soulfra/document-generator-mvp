/**
 * Enterprise Authentication Integration Service
 * 
 * Connects our platform with the existing Soulfra enterprise auth system
 * Provides JWT/MFA/SSO capabilities and compliance frameworks
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import axios, { AxiosInstance } from 'axios';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

export interface AuthConfig {
  authServiceUrl?: string;
  autoStart?: boolean;
  soulfraPath?: string;
  port?: number;
  jwtSecret?: string;
  encryptionKey?: string;
  complianceMode?: 'standard' | 'soc2' | 'hipaa' | 'gdpr';
}

export interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
  team?: string;
  roles: string[];
  permissions: string[];
  mfaEnabled: boolean;
  lastLogin?: Date;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  metadata?: Record<string, any>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  scope?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
  rememberMe?: boolean;
  organizationDomain?: string;
}

export interface SSORequest {
  provider: 'google' | 'github' | 'azure' | 'saml';
  assertion?: string;
  code?: string;
  state?: string;
  organizationDomain?: string;
}

export interface MFASetupRequest {
  userId: string;
  method: 'sms' | 'authenticator' | 'email';
  phoneNumber?: string;
  email?: string;
}

export interface OrganizationConfig {
  id: string;
  name: string;
  domain: string;
  ssoEnabled: boolean;
  ssoProvider?: string;
  mfaRequired: boolean;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge?: number;
  };
  sessionTimeout: number;
  complianceFramework: string[];
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure';
  details?: Record<string, any>;
}

export interface SecurityMetrics {
  activeUsers: number;
  failedLogins: number;
  successfulLogins: number;
  mfaAdoption: number;
  ssoUsage: number;
  complianceScore: number;
  threatDetections: number;
  lastAudit: Date;
}

export class EnterpriseAuthIntegration extends EventEmitter {
  private config: AuthConfig;
  private apiClient?: AxiosInstance;
  private authProcess?: ChildProcess;
  private initialized: boolean = false;
  private currentPort?: number;

  constructor(config: AuthConfig = {}) {
    super();
    
    this.config = {
      authServiceUrl: config.authServiceUrl || 'http://localhost:9000',
      autoStart: config.autoStart !== false,
      soulfraPath: config.soulfraPath || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025',
      port: config.port || 9000,
      jwtSecret: config.jwtSecret || process.env.JWT_SECRET,
      encryptionKey: config.encryptionKey || process.env.ENCRYPTION_KEY,
      complianceMode: config.complianceMode || 'standard',
      ...config
    };
  }

  async initialize(): Promise<void> {
    try {
      // Try to connect to existing auth service
      await this.checkAuthService();
      logger.info('Connected to existing enterprise auth service');
      
    } catch (error) {
      if (this.config.autoStart) {
        logger.info('Enterprise auth service not running, starting new instance...');
        await this.startAuthService();
        await this.waitForAuthService();
      } else {
        throw new Error('Enterprise auth service not available and autoStart is disabled');
      }
    }

    // Setup API client
    this.setupApiClient();

    this.initialized = true;
    this.emit('initialized');
    
    logger.info('Enterprise auth integration initialized', {
      url: this.config.authServiceUrl,
      port: this.currentPort,
      complianceMode: this.config.complianceMode
    });
  }

  private async startAuthService(): Promise<void> {
    if (!this.config.soulfraPath) {
      throw new Error('Soulfra path not configured');
    }

    const authServicePath = path.join(this.config.soulfraPath, 'misc', 'auth-service.js');
    
    this.authProcess = spawn('node', [authServicePath], {
      cwd: this.config.soulfraPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: this.config.port!.toString(),
        JWT_SECRET: this.config.jwtSecret,
        ENCRYPTION_KEY: this.config.encryptionKey,
        COMPLIANCE_MODE: this.config.complianceMode,
        NODE_PATH: this.config.soulfraPath
      }
    });

    this.authProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      logger.debug('Enterprise auth stdout:', output);
      
      if (output.includes('Auth service listening')) {
        this.emit('auth-service-ready');
      }
    });

    this.authProcess.stderr?.on('data', (data) => {
      const error = data.toString();
      logger.warn('Enterprise auth stderr:', error);
    });

    this.authProcess.on('exit', (code) => {
      logger.info('Enterprise auth process exited', { code });
      this.authProcess = undefined;
      this.emit('auth-service-stopped', { code });
    });

    this.authProcess.on('error', (error) => {
      logger.error('Enterprise auth process error', error);
      this.emit('auth-service-error', error);
    });
  }

  private async waitForAuthService(): Promise<void> {
    const maxWait = 30000; // 30 seconds
    const interval = 1000; // 1 second
    let waited = 0;

    while (waited < maxWait) {
      try {
        await this.checkAuthService();
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, interval));
        waited += interval;
      }
    }

    throw new Error('Enterprise auth service failed to start within timeout');
  }

  private async checkAuthService(): Promise<boolean> {
    const response = await axios.get(`${this.config.authServiceUrl}/health`);
    return response.data.status === 'healthy';
  }

  private setupApiClient(): void {
    this.apiClient = axios.create({
      baseURL: this.config.authServiceUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FinishThisIdea-Platform/1.0'
      }
    });

    // Add request/response interceptors
    this.apiClient.interceptors.request.use(
      (config) => {
        logger.debug('Enterprise auth API request', { 
          method: config.method, 
          url: config.url 
        });
        return config;
      },
      (error) => {
        logger.error('Enterprise auth API request error', error);
        return Promise.reject(error);
      }
    );

    this.apiClient.interceptors.response.use(
      (response) => {
        logger.debug('Enterprise auth API response', { 
          status: response.status,
          url: response.config.url 
        });
        return response;
      },
      (error) => {
        logger.error('Enterprise auth API error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  // Core Authentication Methods

  async login(request: LoginRequest): Promise<{ user: User; tokens: AuthTokens }> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const response = await this.apiClient.post('/auth/login', request);
    const result = response.data;

    this.emit('user-login', {
      userId: result.user.id,
      email: result.user.email,
      organization: result.user.organization,
      mfaUsed: !!request.mfaCode
    });

    return result;
  }

  async logout(token: string): Promise<void> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    await this.apiClient.post('/auth/logout', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    this.emit('user-logout', { token });
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const response = await this.apiClient.post('/auth/refresh', {
      refreshToken
    });

    return response.data;
  }

  async verifyToken(token: string): Promise<User> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const response = await this.apiClient.get('/auth/verify', {
      headers: { Authorization: `Bearer ${token}` }
    });

    return response.data.user;
  }

  // Single Sign-On Methods

  async initiateSSO(provider: string, organizationDomain?: string): Promise<{
    redirectUrl: string;
    state: string;
  }> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const response = await this.apiClient.post('/auth/sso/initiate', {
      provider,
      organizationDomain
    });

    return response.data;
  }

  async processSSOCallback(request: SSORequest): Promise<{ user: User; tokens: AuthTokens }> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const response = await this.apiClient.post(`/auth/sso/${request.provider}`, request);
    const result = response.data;

    this.emit('sso-login', {
      userId: result.user.id,
      provider: request.provider,
      organization: result.user.organization
    });

    return result;
  }

  // Multi-Factor Authentication

  async setupMFA(request: MFASetupRequest): Promise<{
    secret?: string;
    qrCode?: string;
    backupCodes: string[];
  }> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const response = await this.apiClient.post('/auth/mfa/setup', request);
    
    this.emit('mfa-setup', {
      userId: request.userId,
      method: request.method
    });

    return response.data;
  }

  async verifyMFA(userId: string, code: string): Promise<boolean> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const response = await this.apiClient.post('/auth/mfa/verify', {
      userId,
      code
    });

    return response.data.valid;
  }

  async disableMFA(userId: string, confirmationCode: string): Promise<void> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    await this.apiClient.post('/auth/mfa/disable', {
      userId,
      confirmationCode
    });

    this.emit('mfa-disabled', { userId });
  }

  // Organization Management

  async createOrganization(config: Partial<OrganizationConfig>): Promise<OrganizationConfig> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const response = await this.apiClient.post('/organizations', config);
    
    this.emit('organization-created', response.data);
    
    return response.data;
  }

  async updateOrganization(id: string, config: Partial<OrganizationConfig>): Promise<OrganizationConfig> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const response = await this.apiClient.put(`/organizations/${id}`, config);
    
    this.emit('organization-updated', response.data);
    
    return response.data;
  }

  async getOrganization(id: string): Promise<OrganizationConfig> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const response = await this.apiClient.get(`/organizations/${id}`);
    return response.data;
  }

  // User Management

  async createUser(userData: Partial<User>): Promise<User> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const response = await this.apiClient.post('/users', userData);
    
    this.emit('user-created', response.data);
    
    return response.data;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const response = await this.apiClient.put(`/users/${id}`, userData);
    
    this.emit('user-updated', response.data);
    
    return response.data;
  }

  async getUser(id: string): Promise<User> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const response = await this.apiClient.get(`/users/${id}`);
    return response.data;
  }

  async listUsers(organizationId?: string, teamId?: string): Promise<User[]> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const params: any = {};
    if (organizationId) params.organizationId = organizationId;
    if (teamId) params.teamId = teamId;

    const response = await this.apiClient.get('/users', { params });
    return response.data;
  }

  // Security and Compliance

  async getAuditLogs(options: {
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<AuditLog[]> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const response = await this.apiClient.get('/audit', { params: options });
    return response.data;
  }

  async getSecurityMetrics(organizationId?: string): Promise<SecurityMetrics> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const params = organizationId ? { organizationId } : {};
    const response = await this.apiClient.get('/security/metrics', { params });
    return response.data;
  }

  async runComplianceCheck(framework: string): Promise<{
    framework: string;
    score: number;
    findings: Array<{
      control: string;
      status: 'compliant' | 'non-compliant' | 'not-applicable';
      details: string;
    }>;
    lastCheck: Date;
  }> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const response = await this.apiClient.post('/compliance/check', { framework });
    return response.data;
  }

  // Utility Methods

  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
    features: string[];
  }> {
    if (!this.apiClient) {
      throw new Error('Enterprise auth service not available');
    }

    const response = await this.apiClient.get('/health');
    return response.data;
  }

  async shutdown(): Promise<void> {
    if (this.authProcess) {
      this.authProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          this.authProcess?.kill('SIGKILL');
          resolve();
        }, 5000);

        this.authProcess?.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    this.initialized = false;
    this.emit('shutdown');
    logger.info('Enterprise auth integration shut down');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConfig(): AuthConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const enterpriseAuth = new EnterpriseAuthIntegration({
  autoStart: true,
  complianceMode: process.env.COMPLIANCE_MODE as any || 'standard',
  soulfraPath: process.env.SOULFRA_PATH || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025'
});