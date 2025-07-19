import { EventEmitter } from 'events';
interface LicenseConfig {
    id: string;
    name: string;
    type: 'standard' | 'professional' | 'enterprise' | 'whitelabel';
    status: 'active' | 'suspended' | 'expired' | 'pending';
    features: string[];
    limits: {
        users?: number;
        projects?: number;
        apiCalls?: number;
        storage?: number;
        customDomains?: number;
        subLicenses?: number;
    };
    billing: {
        amount: number;
        currency: string;
        interval: 'monthly' | 'yearly' | 'lifetime';
        revenueShare?: number;
    };
    branding: {
        removeBranding: boolean;
        customLogo?: string;
        customColors?: Record<string, string>;
        customDomain?: string;
        customEmails?: boolean;
    };
    tenant?: {
        tenantId: string;
        isolationLevel: 'shared' | 'dedicated';
    };
    parent?: {
        licenseId: string;
        revenueShare: number;
    };
    metadata: Record<string, any>;
    createdAt: Date;
    expiresAt?: Date;
    lastActiveAt: Date;
}
interface LicenseUsage {
    licenseId: string;
    period: Date;
    metrics: {
        activeUsers: number;
        projectsCreated: number;
        apiCallsMade: number;
        storageUsed: number;
        revenue: number;
    };
}
interface RevenueShare {
    licenseId: string;
    parentLicenseId: string;
    amount: number;
    percentage: number;
    period: Date;
    status: 'pending' | 'paid' | 'failed';
    paidAt?: Date;
}
export declare class PlatformLicensingService extends EventEmitter {
    private prisma;
    private paymentService;
    private multiTenantService;
    private emailQueue;
    private licenses;
    private usageTracking;
    private revenueShares;
    constructor();
    private initializeLicenseTypes;
    createLicense(options: {
        type: string;
        name: string;
        email: string;
        company?: string;
        customization?: {
            logo?: string;
            colors?: Record<string, string>;
            domain?: string;
        };
        parentLicenseId?: string;
    }): Promise<LicenseConfig>;
    activateLicense(activationCode: string): Promise<LicenseConfig>;
    validateLicense(licenseKey: string): Promise<{
        valid: boolean;
        license?: LicenseConfig;
        reason?: string;
    }>;
    checkLimits(licenseKey: string, resource: string, amount?: number): Promise<{
        allowed: boolean;
        current?: number;
        limit?: number;
        reason?: string;
    }>;
    trackUsage(licenseKey: string, metric: string, amount?: number): Promise<void>;
    createSubLicense(parentLicenseKey: string, options: {
        name: string;
        email: string;
        type: string;
        customPrice?: number;
    }): Promise<LicenseConfig>;
    calculateRevenueShares(period?: Date): Promise<void>;
    private processRevenuePayout;
    getLicenseDashboard(licenseKey: string): Promise<{
        license: LicenseConfig;
        usage: LicenseUsage;
        subLicenses?: LicenseConfig[];
        revenueShares?: RevenueShare[];
        analytics: {
            totalRevenue: number;
            activeUsers: number;
            projectsCreated: number;
            storageUsed: number;
            apiUsage: number;
        };
    }>;
    suspendLicense(licenseKey: string, reason: string): Promise<void>;
    renewLicense(licenseKey: string, period?: number): Promise<LicenseConfig>;
    transferLicense(licenseKey: string, newOwner: {
        name: string;
        email: string;
        company?: string;
    }): Promise<void>;
    private generateLicenseKey;
    private getLicense;
    private getUsage;
    private saveLicense;
    private loadLicenseFromDatabase;
    private startUsageTracking;
    private licenseTypes;
}
export {};
//# sourceMappingURL=platform-licensing.service.d.ts.map