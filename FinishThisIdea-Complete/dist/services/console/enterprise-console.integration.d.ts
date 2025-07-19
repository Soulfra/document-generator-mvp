import { EventEmitter } from 'events';
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
        storage: number;
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
        frameworks: string[];
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
export declare class EnterpriseConsoleIntegration extends EventEmitter {
    private config;
    private apiClient?;
    private consoleProcess?;
    private initialized;
    private currentPort?;
    constructor(config?: ConsoleConfig);
    initialize(): Promise<void>;
    private startConsoleService;
    private waitForConsoleService;
    private checkConsoleService;
    private setupApiClient;
    createTenant(request: TenantRequest): Promise<Tenant>;
    getTenant(tenantId: string): Promise<Tenant>;
    updateTenant(tenantId: string, updates: TenantUpdate): Promise<Tenant>;
    listTenants(options?: {
        status?: string;
        plan?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        tenants: Tenant[];
        total: number;
    }>;
    deleteTenant(tenantId: string, options?: {
        preserveData?: boolean;
        gracePeriod?: number;
    }): Promise<void>;
    updateTenantBranding(tenantId: string, branding: {
        logo?: string;
        primaryColor?: string;
        secondaryColor?: string;
        favicon?: string;
        customDomain?: string;
        customCSS?: string;
    }): Promise<Tenant>;
    deployTenantCustomization(tenantId: string): Promise<{
        success: boolean;
        deploymentId: string;
        customDomainConfigured: boolean;
        sslCertificateIssued: boolean;
        cdnConfigured: boolean;
    }>;
    getTenantResourceUsage(tenantId: string): Promise<{
        current: ResourceOptimization['currentUsage'];
        limits: Tenant['limits'];
        optimization: ResourceOptimization;
    }>;
    scaleTenantResources(tenantId: string, resources: {
        cpu?: string;
        memory?: string;
        storage?: string;
        network?: string;
    }): Promise<{
        success: boolean;
        scalingId: string;
        estimatedTime: number;
        cost: number;
    }>;
    optimizeTenantResources(tenantId: string, autoApply?: boolean): Promise<ResourceOptimization>;
    getConsoleMetrics(): Promise<ConsoleMetrics>;
    getDepartmentView(department: DepartmentView['department'], tenantId?: string): Promise<DepartmentView>;
    getTenantAnalytics(tenantId: string, timeRange?: string): Promise<{
        usage: Tenant['billing']['usage'];
        trends: {
            users: Array<{
                date: string;
                value: number;
            }>;
            projects: Array<{
                date: string;
                value: number;
            }>;
            apiCalls: Array<{
                date: string;
                value: number;
            }>;
            storage: Array<{
                date: string;
                value: number;
            }>;
        };
        predictions: {
            nextMonthUsage: Tenant['billing']['usage'];
            costForecast: number;
            growthRate: number;
        };
    }>;
    runComplianceAudit(tenantId: string, framework: string): Promise<{
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
    }>;
    getSecurityStatus(tenantId?: string): Promise<{
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
    }>;
    getTenantBilling(tenantId: string): Promise<{
        subscription: Tenant['billing'];
        invoices: Array<{
            id: string;
            period: {
                start: Date;
                end: Date;
            };
            amount: number;
            status: 'paid' | 'pending' | 'overdue';
            downloadUrl: string;
        }>;
        usage: Tenant['billing']['usage'];
        forecast: {
            nextInvoiceAmount: number;
            projectedMonthlySpend: number;
        };
    }>;
    updateTenantPlan(tenantId: string, plan: string, effective?: Date): Promise<{
        success: boolean;
        effectiveDate: Date;
        proratedAmount: number;
        nextInvoiceDate: Date;
    }>;
    checkHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        version: string;
        uptime: number;
        features: string[];
        witnessValidation: boolean;
    }>;
    shutdown(): Promise<void>;
    isInitialized(): boolean;
    getConfig(): ConsoleConfig;
}
export declare const enterpriseConsole: EnterpriseConsoleIntegration;
//# sourceMappingURL=enterprise-console.integration.d.ts.map