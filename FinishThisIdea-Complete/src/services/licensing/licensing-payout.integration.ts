/**
 * Licensing and Payout Integration Service
 * 
 * Connects our platform with the existing Soulfra licensing and Stripe automation system
 * Provides automated payouts, revenue sharing, and subscription management
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import axios, { AxiosInstance } from 'axios';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

export interface LicensingConfig {
  serviceUrl?: string;
  autoStart?: boolean;
  soulfraPath?: string;
  port?: number;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  enableAutoBuyback?: boolean;
}

export interface LicenseModel {
  id: string;
  type: 'subscription' | 'one-time' | 'usage-based' | 'royalty';
  name: string;
  description: string;
  price: number;
  currency: string;
  interval?: 'month' | 'year' | 'day';
  features: string[];
  limits: {
    users?: number;
    projects?: number;
    exports?: number;
    apiCalls?: number;
    storage?: number; // in GB
  };
  royaltyRate?: number; // percentage for revenue sharing
  metadata?: Record<string, any>;
}

export interface License {
  id: string;
  userId: string;
  tenantId?: string;
  modelId: string;
  status: 'active' | 'inactive' | 'suspended' | 'cancelled' | 'expired';
  subscriptionId?: string;
  customerId: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  usage: {
    users: number;
    projects: number;
    exports: number;
    apiCalls: number;
    storage: number;
  };
  revenue: {
    totalEarned: number;
    ownerShare: number;
    platformShare: number;
    lastPayout: Date;
    pendingPayout: number;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayoutRequest {
  recipientId: string;
  amount: number;
  currency: string;
  reason: string;
  sourceType: 'revenue_share' | 'royalty' | 'commission' | 'bonus';
  sourceId: string;
  metadata?: Record<string, any>;
}

export interface PayoutResult {
  id: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  transferId?: string;
  failureReason?: string;
  processedAt?: Date;
  estimatedArrival?: Date;
}

export interface RevenueShare {
  licenseId: string;
  period: { start: Date; end: Date };
  totalRevenue: number;
  ownerShare: number;
  platformShare: number;
  breakdown: {
    subscriptionRevenue: number;
    usageRevenue: number;
    exportRevenue: number;
    royalties: number;
  };
  payoutStatus: 'pending' | 'processed' | 'failed';
  payoutDate?: Date;
}

export interface SubscriptionMetrics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  lifetimeValue: number;
  revenueGrowth: number;
  topPlans: Array<{
    modelId: string;
    name: string;
    subscribers: number;
    revenue: number;
  }>;
}

export interface AgentRevenue {
  agentId: string;
  ownerId: string;
  ownershipPercentage: number;
  totalRevenue: number;
  dividendsPaid: number;
  buybackThreshold: number;
  buybackTriggered: boolean;
  buybackPrice?: number;
  tokenHolders: Array<{
    userId: string;
    tokenCount: number;
    dividendShare: number;
  }>;
}

export class LicensingPayoutIntegration extends EventEmitter {
  private config: LicensingConfig;
  private apiClient?: AxiosInstance;
  private licensingProcess?: ChildProcess;
  private initialized: boolean = false;
  private currentPort?: number;

  constructor(config: LicensingConfig = {}) {
    super();
    
    this.config = {
      serviceUrl: config.serviceUrl || 'http://localhost:6000',
      autoStart: config.autoStart !== false,
      soulfraPath: config.soulfraPath || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025',
      port: config.port || 6000,
      stripeSecretKey: config.stripeSecretKey || process.env.STRIPE_SECRET_KEY,
      stripeWebhookSecret: config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET,
      enableAutoBuyback: config.enableAutoBuyback !== false,
      ...config
    };
  }

  async initialize(): Promise<void> {
    try {
      // Try to connect to existing licensing service
      await this.checkLicensingService();
      logger.info('Connected to existing licensing and payout service');
      
    } catch (error) {
      if (this.config.autoStart) {
        logger.info('Licensing service not running, starting new instance...');
        await this.startLicensingService();
        await this.waitForLicensingService();
      } else {
        throw new Error('Licensing service not available and autoStart is disabled');
      }
    }

    // Setup API client
    this.setupApiClient();

    this.initialized = true;
    this.emit('initialized');
    
    logger.info('Licensing and payout integration initialized', {
      url: this.config.serviceUrl,
      port: this.currentPort,
      autoBuyback: this.config.enableAutoBuyback
    });
  }

  private async startLicensingService(): Promise<void> {
    if (!this.config.soulfraPath) {
      throw new Error('Soulfra path not configured');
    }

    const licensingPath = path.join(this.config.soulfraPath, 'misc', 'stripe-integration.js');
    
    this.licensingProcess = spawn('node', [licensingPath], {
      cwd: this.config.soulfraPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: this.config.port!.toString(),
        STRIPE_SECRET_KEY: this.config.stripeSecretKey,
        STRIPE_WEBHOOK_SECRET: this.config.stripeWebhookSecret,
        ENABLE_AUTO_BUYBACK: this.config.enableAutoBuyback!.toString(),
        NODE_PATH: this.config.soulfraPath
      }
    });

    this.licensingProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      logger.debug('Licensing service stdout:', output);
      
      if (output.includes('Licensing service listening')) {
        this.emit('licensing-service-ready');
      }
    });

    this.licensingProcess.stderr?.on('data', (data) => {
      const error = data.toString();
      logger.warn('Licensing service stderr:', error);
    });

    this.licensingProcess.on('exit', (code) => {
      logger.info('Licensing service process exited', { code });
      this.licensingProcess = undefined;
      this.emit('licensing-service-stopped', { code });
    });

    this.licensingProcess.on('error', (error) => {
      logger.error('Licensing service process error', error);
      this.emit('licensing-service-error', error);
    });
  }

  private async waitForLicensingService(): Promise<void> {
    const maxWait = 30000; // 30 seconds
    const interval = 1000; // 1 second
    let waited = 0;

    while (waited < maxWait) {
      try {
        await this.checkLicensingService();
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, interval));
        waited += interval;
      }
    }

    throw new Error('Licensing service failed to start within timeout');
  }

  private async checkLicensingService(): Promise<boolean> {
    const response = await axios.get(`${this.config.serviceUrl}/health`);
    return response.data.status === 'healthy';
  }

  private setupApiClient(): void {
    this.apiClient = axios.create({
      baseURL: this.config.serviceUrl,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FinishThisIdea-Platform/1.0'
      }
    });

    // Add request/response interceptors
    this.apiClient.interceptors.request.use(
      (config) => {
        logger.debug('Licensing API request', { 
          method: config.method, 
          url: config.url 
        });
        return config;
      },
      (error) => {
        logger.error('Licensing API request error', error);
        return Promise.reject(error);
      }
    );

    this.apiClient.interceptors.response.use(
      (response) => {
        logger.debug('Licensing API response', { 
          status: response.status,
          url: response.config.url 
        });
        return response;
      },
      (error) => {
        logger.error('Licensing API error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  // License Management

  async createLicense(userId: string, modelId: string, tenantId?: string): Promise<License> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.post('/licenses', {
      userId,
      modelId,
      tenantId
    });

    const license = response.data;

    this.emit('license-created', {
      licenseId: license.id,
      userId,
      modelId,
      tenantId
    });

    return license;
  }

  async getLicense(licenseId: string): Promise<License> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.get(`/licenses/${licenseId}`);
    return response.data;
  }

  async updateLicense(licenseId: string, updates: Partial<License>): Promise<License> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.put(`/licenses/${licenseId}`, updates);
    
    this.emit('license-updated', {
      licenseId,
      updates
    });

    return response.data;
  }

  async cancelLicense(licenseId: string, reason?: string): Promise<void> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    await this.apiClient.delete(`/licenses/${licenseId}`, {
      data: { reason }
    });

    this.emit('license-cancelled', {
      licenseId,
      reason
    });
  }

  // Subscription Management

  async createSubscription(userId: string, modelId: string, paymentMethodId?: string): Promise<{
    subscriptionId: string;
    clientSecret?: string;
    status: string;
  }> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.post('/subscriptions', {
      userId,
      modelId,
      paymentMethodId
    });

    const subscription = response.data;

    this.emit('subscription-created', {
      subscriptionId: subscription.subscriptionId,
      userId,
      modelId
    });

    return subscription;
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true): Promise<void> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    await this.apiClient.delete(`/subscriptions/${subscriptionId}`, {
      data: { cancelAtPeriodEnd }
    });

    this.emit('subscription-cancelled', {
      subscriptionId,
      cancelAtPeriodEnd
    });
  }

  async getSubscriptionMetrics(): Promise<SubscriptionMetrics> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.get('/metrics/subscriptions');
    return response.data;
  }

  // Payment and Checkout

  async createCheckoutSession(options: {
    userId: string;
    modelId: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<{
    sessionId: string;
    url: string;
  }> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.post('/checkout/session', options);
    return response.data;
  }

  async createPaymentLink(modelId: string, metadata?: Record<string, string>): Promise<{
    linkId: string;
    url: string;
  }> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.post('/checkout/payment-link', {
      modelId,
      metadata
    });

    return response.data;
  }

  // Revenue Sharing and Payouts

  async requestPayout(request: PayoutRequest): Promise<PayoutResult> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.post('/payouts', request);
    const payout = response.data;

    this.emit('payout-requested', {
      payoutId: payout.id,
      recipientId: request.recipientId,
      amount: request.amount,
      reason: request.reason
    });

    return payout;
  }

  async getPayoutStatus(payoutId: string): Promise<PayoutResult> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.get(`/payouts/${payoutId}`);
    return response.data;
  }

  async calculateRevenueShare(licenseId: string, period: { start: Date; end: Date }): Promise<RevenueShare> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.post(`/licenses/${licenseId}/revenue-share`, {
      startDate: period.start.toISOString(),
      endDate: period.end.toISOString()
    });

    return response.data;
  }

  async processAutomaticPayouts(): Promise<{
    processed: number;
    totalAmount: number;
    failed: number;
    errors: Array<{ recipientId: string; error: string }>;
  }> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.post('/payouts/process-automatic');
    const result = response.data;

    this.emit('automatic-payouts-processed', {
      processed: result.processed,
      totalAmount: result.totalAmount,
      failed: result.failed
    });

    return result;
  }

  // Agent Revenue System

  async getAgentRevenue(agentId: string): Promise<AgentRevenue> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.get(`/agents/${agentId}/revenue`);
    return response.data;
  }

  async updateAgentOwnership(agentId: string, ownership: Array<{
    userId: string;
    tokenCount: number;
  }>): Promise<AgentRevenue> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.put(`/agents/${agentId}/ownership`, {
      ownership
    });

    this.emit('agent-ownership-updated', {
      agentId,
      ownership
    });

    return response.data;
  }

  async triggerAgentBuyback(agentId: string): Promise<{
    success: boolean;
    buybackPrice: number;
    tokensRepurchased: number;
    totalCost: number;
  }> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.post(`/agents/${agentId}/buyback`);
    const result = response.data;

    this.emit('agent-buyback-triggered', {
      agentId,
      buybackPrice: result.buybackPrice,
      tokensRepurchased: result.tokensRepurchased
    });

    return result;
  }

  async distributeDividends(agentId: string): Promise<{
    totalDividends: number;
    recipientCount: number;
    payoutIds: string[];
  }> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.post(`/agents/${agentId}/dividends`);
    const result = response.data;

    this.emit('dividends-distributed', {
      agentId,
      totalDividends: result.totalDividends,
      recipientCount: result.recipientCount
    });

    return result;
  }

  // Usage Tracking

  async trackUsage(licenseId: string, usage: {
    type: 'export' | 'api_call' | 'storage' | 'compute';
    quantity: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    await this.apiClient.post(`/licenses/${licenseId}/usage`, usage);

    this.emit('usage-tracked', {
      licenseId,
      type: usage.type,
      quantity: usage.quantity
    });
  }

  async getUsageMetrics(licenseId: string, period?: { start: Date; end: Date }): Promise<{
    usage: License['usage'];
    costs: Record<string, number>;
    predictions: Record<string, number>;
  }> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const params = period ? {
      startDate: period.start.toISOString(),
      endDate: period.end.toISOString()
    } : {};

    const response = await this.apiClient.get(`/licenses/${licenseId}/usage-metrics`, { params });
    return response.data;
  }

  // License Models

  async createLicenseModel(model: Omit<LicenseModel, 'id'>): Promise<LicenseModel> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.post('/models', model);
    
    this.emit('license-model-created', response.data);
    
    return response.data;
  }

  async getLicenseModels(): Promise<LicenseModel[]> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.get('/models');
    return response.data;
  }

  async updateLicenseModel(modelId: string, updates: Partial<LicenseModel>): Promise<LicenseModel> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.put(`/models/${modelId}`, updates);
    
    this.emit('license-model-updated', {
      modelId,
      updates
    });

    return response.data;
  }

  // Webhook Handling

  async processWebhook(eventType: string, data: any): Promise<void> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    await this.apiClient.post('/webhooks/stripe', {
      type: eventType,
      data
    });

    this.emit('webhook-processed', {
      eventType,
      timestamp: Date.now()
    });
  }

  // Utility Methods

  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
    stripe: { connected: boolean; };
    features: string[];
  }> {
    if (!this.apiClient) {
      throw new Error('Licensing service not available');
    }

    const response = await this.apiClient.get('/health');
    return response.data;
  }

  async shutdown(): Promise<void> {
    if (this.licensingProcess) {
      this.licensingProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          this.licensingProcess?.kill('SIGKILL');
          resolve();
        }, 5000);

        this.licensingProcess?.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    this.initialized = false;
    this.emit('shutdown');
    logger.info('Licensing and payout integration shut down');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConfig(): LicensingConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const licensingPayout = new LicensingPayoutIntegration({
  autoStart: true,
  enableAutoBuyback: true,
  soulfraPath: process.env.SOULFRA_PATH || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025'
});