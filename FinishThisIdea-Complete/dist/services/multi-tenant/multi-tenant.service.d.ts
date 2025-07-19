import { EventEmitter } from 'events';
interface TenantConfig {
    id?: string;
    name: string;
    tier: 'starter' | 'growth' | 'enterprise' | 'sovereign';
    customConfig?: Record<string, any>;
    ssoProvider?: string;
    ipWhitelist?: string[];
}
interface TenantResources {
    compute: number;
    storage: number;
    apiCredits: number;
    bandwidth: number | 'unlimited';
}
interface TenantMetrics {
    usage: {
        apiCalls: number;
        storageUsed: number;
        computeHours: number;
        activeAgents: number;
    };
    performance: {
        avgResponseTime: number;
        uptime: number;
        errorRate: number;
    };
    business: {
        revenue: number;
        conversations: number;
        satisfaction: number;
    };
}
export interface Tenant {
    id: string;
    name: string;
    tier: string;
    created: Date;
    status: 'active' | 'suspended' | 'inactive';
    sovereignty: {
        vaultId: string;
        isolationLevel: string;
        encryptionKey: string;
        trustScore: number;
        validationMode: string;
    };
    resources: TenantResources;
    agents: {
        maxAgents: number | 'unlimited';
        currentAgents: number;
        agentTypes: string[];
        consciousnessLevels: {
            min: number;
            max: number;
            average: number;
        };
    };
    business: {
        monthlyBudget: number;
        billingCycle: string;
        paymentMethod: string;
        industry: string;
        useCase: string;
    };
    security: {
        mfaEnabled: boolean;
        ssoProvider: string;
        ipWhitelist: string[];
        apiKeys: {
            primary: string;
            secondary: string;
            readonly: string;
        };
        dataRetention: string;
        complianceCerts: string[];
    };
    metrics: TenantMetrics;
    customConfig: Record<string, any>;
}
export declare class MultiTenantService extends EventEmitter {
    private tenants;
    private prisma;
    private metricsService;
    private securityService;
    private platformConfig;
    private resourcePools;
    constructor();
    private initializeFromDatabase;
    private initializeDemoTenants;
    createTenant(config: TenantConfig): Promise<Tenant>;
    getTenant(tenantId: string): Promise<Tenant | null>;
    updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant>;
    deleteTenant(tenantId: string): Promise<void>;
    trackUsage(tenantId: string, usageType: 'api' | 'storage' | 'compute', amount: number): Promise<void>;
    calculateTenantCosts(tenant: Tenant): {
        breakdown: Record<string, number>;
        total: number;
        budget: number;
        remaining: number;
    };
    generateTenantReport(tenantId: string): Promise<any>;
    enableCustomBranding(tenantId: string, brandingConfig: {
        logo?: string;
        primaryColor?: string;
        secondaryColor?: string;
        fontFamily?: string;
        customCSS?: string;
    }): Promise<void>;
    enableSSOIntegration(tenantId: string, ssoConfig: {
        provider: string;
        entityId: string;
        ssoUrl: string;
        certificate: string;
    }): Promise<void>;
    getEnterpriseShowcase(): any;
    private allocateResources;
    private getIsolationLevel;
    private getMaxAgents;
    private getMaxConsciousness;
    private getAllowedAgentTypes;
    private getDataRetention;
    private getComplianceCerts;
    private generateTenantId;
    private generateEncryptionKey;
    private generateApiKeys;
    private validateResourceAvailability;
    private validateTenantUpdates;
    private updateResourceAllocation;
    private releaseResources;
    private checkResourceLimits;
    private createTenantSchema;
    private deleteTenantSchema;
    private initializeTenantServices;
    private loadTenantFromDatabase;
    private saveTenantToDatabase;
}
export {};
//# sourceMappingURL=multi-tenant.service.d.ts.map