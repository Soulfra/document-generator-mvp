export declare enum TrustTier {
    BRONZE = "BRONZE",
    SILVER = "SILVER",
    GOLD = "GOLD",
    PLATINUM = "PLATINUM"
}
interface TierFeatures {
    maxFileSize: number;
    maxFilesPerUpload: number;
    allowedFileTypes: string[];
    maxJobsPerDay: number;
    maxJobsPerMonth: number;
    allowClaude: boolean;
    allowBulkOperations: boolean;
    allowAdvancedFeatures: boolean;
    backupRetentionDays: number;
    priorityProcessing: boolean;
    customProfiles: number;
}
interface UserTrustMetrics {
    userId: string;
    currentTier: TrustTier;
    totalJobs: number;
    successfulJobs: number;
    failedJobs: number;
    successRate: number;
    totalSpent: number;
    accountAge: number;
    violations: number;
    lastViolation?: Date;
}
export declare class TrustTierService {
    getUserTrustMetrics(userId: string): Promise<UserTrustMetrics>;
    private calculateUserTier;
    checkTierPermission(userId: string, feature: keyof TierFeatures, value?: any): Promise<{
        allowed: boolean;
        reason?: string;
    }>;
    checkRateLimits(userId: string): Promise<{
        allowed: boolean;
        remaining?: number;
        resetAt?: Date;
        reason?: string;
    }>;
    recordViolation(userId: string, type: string, description: string): Promise<void>;
    getTierFeatures(tier: TrustTier): TierFeatures;
    getAllTiers(): {
        tier: string;
        features: TierFeatures;
        requirements: {
            minJobs: number;
            minSuccessRate: number;
            minSpent: number;
            minAccountAge: number;
            maxViolations: number;
        } | {
            minJobs: number;
            minSuccessRate: number;
            minSpent: number;
            minAccountAge: number;
            maxViolations: number;
        } | {
            minJobs: number;
            minSuccessRate: number;
            minSpent: number;
            minAccountAge: number;
            maxViolations: number;
        };
    }[];
    private getRequiredTierForFeature;
    checkForTierUpgrade(userId: string): Promise<{
        shouldUpgrade: boolean;
        newTier?: TrustTier;
        currentTier: TrustTier;
    }>;
}
export declare const trustTierService: TrustTierService;
export {};
//# sourceMappingURL=trust-tier.service.d.ts.map