import { EventEmitter } from 'events';
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
        storage?: number;
    };
    royaltyRate?: number;
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
    period: {
        start: Date;
        end: Date;
    };
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
export declare class LicensingPayoutIntegration extends EventEmitter {
    private config;
    private apiClient?;
    private licensingProcess?;
    private initialized;
    private currentPort?;
    constructor(config?: LicensingConfig);
    initialize(): Promise<void>;
    private startLicensingService;
    private waitForLicensingService;
    private checkLicensingService;
    private setupApiClient;
    createLicense(userId: string, modelId: string, tenantId?: string): Promise<License>;
    getLicense(licenseId: string): Promise<License>;
    updateLicense(licenseId: string, updates: Partial<License>): Promise<License>;
    cancelLicense(licenseId: string, reason?: string): Promise<void>;
    createSubscription(userId: string, modelId: string, paymentMethodId?: string): Promise<{
        subscriptionId: string;
        clientSecret?: string;
        status: string;
    }>;
    cancelSubscription(subscriptionId: string, cancelAtPeriodEnd?: boolean): Promise<void>;
    getSubscriptionMetrics(): Promise<SubscriptionMetrics>;
    createCheckoutSession(options: {
        userId: string;
        modelId: string;
        successUrl: string;
        cancelUrl: string;
        metadata?: Record<string, string>;
    }): Promise<{
        sessionId: string;
        url: string;
    }>;
    createPaymentLink(modelId: string, metadata?: Record<string, string>): Promise<{
        linkId: string;
        url: string;
    }>;
    requestPayout(request: PayoutRequest): Promise<PayoutResult>;
    getPayoutStatus(payoutId: string): Promise<PayoutResult>;
    calculateRevenueShare(licenseId: string, period: {
        start: Date;
        end: Date;
    }): Promise<RevenueShare>;
    processAutomaticPayouts(): Promise<{
        processed: number;
        totalAmount: number;
        failed: number;
        errors: Array<{
            recipientId: string;
            error: string;
        }>;
    }>;
    getAgentRevenue(agentId: string): Promise<AgentRevenue>;
    updateAgentOwnership(agentId: string, ownership: Array<{
        userId: string;
        tokenCount: number;
    }>): Promise<AgentRevenue>;
    triggerAgentBuyback(agentId: string): Promise<{
        success: boolean;
        buybackPrice: number;
        tokensRepurchased: number;
        totalCost: number;
    }>;
    distributeDividends(agentId: string): Promise<{
        totalDividends: number;
        recipientCount: number;
        payoutIds: string[];
    }>;
    trackUsage(licenseId: string, usage: {
        type: 'export' | 'api_call' | 'storage' | 'compute';
        quantity: number;
        metadata?: Record<string, any>;
    }): Promise<void>;
    getUsageMetrics(licenseId: string, period?: {
        start: Date;
        end: Date;
    }): Promise<{
        usage: License['usage'];
        costs: Record<string, number>;
        predictions: Record<string, number>;
    }>;
    createLicenseModel(model: Omit<LicenseModel, 'id'>): Promise<LicenseModel>;
    getLicenseModels(): Promise<LicenseModel[]>;
    updateLicenseModel(modelId: string, updates: Partial<LicenseModel>): Promise<LicenseModel>;
    processWebhook(eventType: string, data: any): Promise<void>;
    checkHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        version: string;
        uptime: number;
        stripe: {
            connected: boolean;
        };
        features: string[];
    }>;
    shutdown(): Promise<void>;
    isInitialized(): boolean;
    getConfig(): LicensingConfig;
}
export declare const licensingPayout: LicensingPayoutIntegration;
//# sourceMappingURL=licensing-payout.integration.d.ts.map