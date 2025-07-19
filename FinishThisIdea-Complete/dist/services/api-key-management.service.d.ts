import { APIKeyTier } from './ai-api/auth';
export interface UserAPIKey {
    id: string;
    keyId: string;
    keyHash: string;
    tier: APIKeyTier;
    userId: string;
    isActive: boolean;
    createdAt: Date;
    expiresAt?: Date;
    lastUsedAt?: Date;
    usageCount: number;
    metadata?: {
        name?: string;
        description?: string;
        ipWhitelist?: string[];
        [key: string]: any;
    };
}
export declare class APIKeyManagementService {
    generateAPIKeyForUser(userId: string, tier: APIKeyTier, options?: {
        name?: string;
        description?: string;
        expiresInDays?: number;
    }): Promise<{
        apiKey: string;
        keyInfo: UserAPIKey;
    }>;
    issueAPIKeyForPayment(userId: string, tierId: string, paymentId: string): Promise<{
        apiKey: string;
        keyInfo: UserAPIKey;
    }>;
    getUserAPIKeys(userId: string): Promise<UserAPIKey[]>;
    deactivateAPIKey(userId: string, keyId: string): Promise<boolean>;
    validateAPIKey(apiKey: string): Promise<{
        valid: boolean;
        keyInfo?: UserAPIKey;
        tier?: APIKeyTier;
        error?: string;
    }>;
    trackAPIKeyUsage(apiKey: string, endpoint: string, cost?: number): Promise<void>;
    upgradeAPIKey(userId: string, fromTier: APIKeyTier, toTier: APIKeyTier): Promise<{
        apiKey: string;
        keyInfo: UserAPIKey;
    }>;
    private mapPricingTierToAPITier;
    private getExpirationDaysForTier;
    private deactivateUserKeysForTier;
    getAPIKeyStats(userId: string): Promise<{
        totalKeys: number;
        activeKeys: number;
        totalUsage: number;
        tierBreakdown: Record<APIKeyTier, number>;
    }>;
}
export declare const apiKeyManagementService: APIKeyManagementService;
//# sourceMappingURL=api-key-management.service.d.ts.map