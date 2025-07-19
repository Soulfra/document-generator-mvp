export type APIKeyTier = 'internal' | 'byok' | 'cleanup' | 'developer' | 'team' | 'enterprise';
export interface APIKeyInfo {
    keyId: string;
    userId: string;
    tier: APIKeyTier;
    valid: boolean;
    error?: string;
    customKeys?: {
        anthropic?: string;
        openai?: string;
        [key: string]: string;
    };
    rateLimit: {
        requestsPerMinute: number;
        requestsPerDay: number;
    };
    costLimit: {
        perRequest: number;
        perDay: number;
        perMonth: number;
    };
    features: string[];
}
export interface APIValidationResult {
    valid: boolean;
    keyId?: string;
    userId?: string;
    tier?: APIKeyTier;
    error?: string;
    customKeys?: any;
    rateLimit?: any;
    costLimit?: any;
    features?: string[];
}
export declare function validateAPIKey(apiKey: string): Promise<APIValidationResult>;
export declare const createAPIKey: (params: {
    userId: string;
    tier: APIKeyTier;
    customKeys?: Record<string, string>;
}) => Promise<string>, generateAPIKey: (tier: APIKeyTier, userId: string) => string, generateBYOKKey: (userId: string, customKeys: Record<string, string>) => string, revokeAPIKey: (apiKey: string) => Promise<boolean>;
//# sourceMappingURL=auth.d.ts.map