import { User } from '@prisma/client';
export interface ApiKeyData {
    id: string;
    userId: string;
    name: string;
    key: string;
    hashedKey: string;
    prefix: string;
    lastUsedAt?: Date;
    expiresAt?: Date;
    scopes: string[];
    metadata?: Record<string, any>;
    rateLimit?: {
        requests: number;
        window: number;
    };
}
export interface ApiKeyCreateOptions {
    name: string;
    scopes?: string[];
    expiresIn?: number;
    metadata?: Record<string, any>;
    rateLimit?: {
        requests: number;
        window: number;
    };
}
export interface ApiKeyValidationResult {
    valid: boolean;
    apiKey?: ApiKeyData;
    user?: User;
    reason?: string;
}
export declare class ApiKeyService {
    private static instance;
    private prisma;
    private readonly keyPrefix;
    private readonly testKeyPrefix;
    constructor();
    static getInstance(): ApiKeyService;
    createApiKey(userId: string, options: ApiKeyCreateOptions): Promise<{
        apiKey: ApiKeyData;
        plainKey: string;
    }>;
    validateApiKey(plainKey: string): Promise<ApiKeyValidationResult>;
    rotateApiKey(userId: string, apiKeyId: string): Promise<{
        apiKey: ApiKeyData;
        plainKey: string;
    }>;
    revokeApiKey(userId: string, apiKeyId: string): Promise<void>;
    listApiKeys(userId: string, options?: {
        includeExpired?: boolean;
    }): Promise<ApiKeyData[]>;
    checkRateLimit(apiKeyId: string, rateLimit?: any): Promise<{
        allowed: boolean;
        remaining: number;
        resetAt: Date;
    }>;
    updateScopes(userId: string, apiKeyId: string, scopes: string[]): Promise<ApiKeyData>;
    private cacheKeyMetadata;
    private getCachedKeyMetadata;
    private invalidateKeyCache;
    private validateCachedKey;
    private updateLastUsed;
    private maskApiKey;
    private setupRotationCallbacks;
    generateApiKeyDocs(apiKey: ApiKeyData): string;
}
export declare const apiKeyService: ApiKeyService;
//# sourceMappingURL=api-key.service.d.ts.map