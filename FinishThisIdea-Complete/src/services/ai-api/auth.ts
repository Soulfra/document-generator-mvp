/**
 * AI API AUTHENTICATION & AUTHORIZATION
 * 
 * Handles different API key tiers:
 * - internal: Internal FinishThisIdea services (unlimited, Ollama-first)
 * - byok: Bring Your Own Keys (user provides their own LLM API keys)
 * - free: Free tier with limits
 * - paid: Paid tier with higher limits
 * - enterprise: Enterprise with custom limits
 */

import crypto from 'crypto';
import { logger } from '../../utils/logger';
import { prisma } from '../../utils/database';

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

class APIKeyManager {
  private internalKeys: Set<string> = new Set();
  private keyCache: Map<string, APIKeyInfo> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeInternalKeys();
  }

  private initializeInternalKeys() {
    // Initialize internal API keys for FinishThisIdea services
    const internalKey = process.env.INTERNAL_API_KEY || this.generateInternalKey();
    this.internalKeys.add(internalKey);
    
    logger.info('Initialized API key manager', {
      internalKeys: this.internalKeys.size,
      cacheEnabled: true
    });
  }

  private generateInternalKey(): string {
    // Generate a secure internal key
    const key = `fti_internal_${crypto.randomBytes(32).toString('hex')}`;
    logger.warn('Generated new internal API key - set INTERNAL_API_KEY environment variable', {
      key: `${key.substring(0, 20)}...`
    });
    return key;
  }

  async validateAPIKey(apiKey: string): Promise<APIValidationResult> {
    try {
      // Check cache first
      const cached = this.getCachedKey(apiKey);
      if (cached) {
        return this.apiKeyInfoToValidationResult(cached);
      }

      // Check if it's an internal key
      if (this.internalKeys.has(apiKey)) {
        const keyInfo: APIKeyInfo = {
          keyId: apiKey.substring(0, 20),
          userId: 'internal',
          tier: 'internal',
          valid: true,
          rateLimit: {
            requestsPerMinute: 10000,
            requestsPerDay: 1000000
          },
          costLimit: {
            perRequest: 0, // No cost limits for internal
            perDay: 0,
            perMonth: 0
          },
          features: ['all']
        };
        
        this.setCachedKey(apiKey, keyInfo);
        return this.apiKeyInfoToValidationResult(keyInfo);
      }

      // Check database for external keys
      const dbKey = await this.validateDatabaseKey(apiKey);
      if (dbKey.valid) {
        this.setCachedKey(apiKey, dbKey as APIKeyInfo);
        return this.apiKeyInfoToValidationResult(dbKey as APIKeyInfo);
      }

      // Check if it's a BYOK format
      if (apiKey.startsWith('byok_')) {
        return await this.validateBYOKKey(apiKey);
      }

      return {
        valid: false,
        error: 'INVALID_KEY'
      };

    } catch (error) {
      logger.error('API key validation error', { error: error.message });
      return {
        valid: false,
        error: 'VALIDATION_ERROR'
      };
    }
  }

  private async validateDatabaseKey(apiKey: string): Promise<APIValidationResult> {
    try {
      // This would check the database for the API key
      // For now, using mock validation
      
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      // Mock database lookup
      const mockKeys: Record<string, any> = {
        'fti_cleanup_demo123': {
          keyId: 'key_demo123',
          userId: 'user_demo',
          tier: 'cleanup',
          active: true
        },
        'fti_developer_abc456': {
          keyId: 'key_abc456',
          userId: 'user_developer',
          tier: 'developer',
          active: true
        },
        'fti_team_xyz789': {
          keyId: 'key_xyz789',
          userId: 'user_team',
          tier: 'team',
          active: true
        },
        'fti_enterprise_ent999': {
          keyId: 'key_ent999',
          userId: 'user_enterprise',
          tier: 'enterprise',
          active: true
        }
      };

      const keyData = mockKeys[apiKey];
      if (!keyData || !keyData.active) {
        return { valid: false, error: 'KEY_NOT_FOUND' };
      }

      return {
        valid: true,
        keyId: keyData.keyId,
        userId: keyData.userId,
        tier: keyData.tier,
        rateLimit: this.getRateLimitForTier(keyData.tier),
        costLimit: this.getCostLimitForTier(keyData.tier),
        features: this.getFeaturesForTier(keyData.tier)
      };

    } catch (error) {
      logger.error('Database key validation error', { error: error.message });
      return { valid: false, error: 'DB_ERROR' };
    }
  }

  private async validateBYOKKey(apiKey: string): Promise<APIValidationResult> {
    try {
      // BYOK format: byok_userId_customKeys
      const parts = apiKey.split('_');
      if (parts.length < 3) {
        return { valid: false, error: 'INVALID_BYOK_FORMAT' };
      }

      const userId = parts[1];
      const encodedKeys = parts.slice(2).join('_');
      
      // Decode custom keys (base64 encoded JSON)
      let customKeys: any = {};
      try {
        const decoded = Buffer.from(encodedKeys, 'base64').toString();
        customKeys = JSON.parse(decoded);
      } catch (error) {
        return { valid: false, error: 'INVALID_BYOK_KEYS' };
      }

      // Validate that at least one provider key is present
      const hasValidKey = customKeys.anthropic || customKeys.openai || customKeys.azure;
      if (!hasValidKey) {
        return { valid: false, error: 'NO_VALID_PROVIDER_KEYS' };
      }

      return {
        valid: true,
        keyId: `byok_${userId}`,
        userId,
        tier: 'byok',
        customKeys,
        rateLimit: this.getRateLimitForTier('byok'),
        costLimit: this.getCostLimitForTier('byok'),
        features: this.getFeaturesForTier('byok')
      };

    } catch (error) {
      logger.error('BYOK key validation error', { error: error.message });
      return { valid: false, error: 'BYOK_VALIDATION_ERROR' };
    }
  }

  private getRateLimitForTier(tier: APIKeyTier): { requestsPerMinute: number; requestsPerDay: number } {
    const limits = {
      'internal': { requestsPerMinute: 10000, requestsPerDay: 1000000 },
      'byok': { requestsPerMinute: 500, requestsPerDay: 50000 },
      'cleanup': { requestsPerMinute: 10, requestsPerDay: 100 },      // $1 cleanup tier
      'developer': { requestsPerMinute: 100, requestsPerDay: 500 },   // $5 developer tier  
      'team': { requestsPerMinute: 500, requestsPerDay: 5000 },       // $25 team tier
      'enterprise': { requestsPerMinute: 2000, requestsPerDay: 500000 } // Enterprise tier
    };
    
    return limits[tier] || limits.cleanup;
  }

  private getCostLimitForTier(tier: APIKeyTier): { perRequest: number; perDay: number; perMonth: number } {
    const limits = {
      'internal': { perRequest: 0, perDay: 0, perMonth: 0 },
      'byok': { perRequest: 0, perDay: 0, perMonth: 0 }, // User pays with their own keys
      'cleanup': { perRequest: 0, perDay: 0, perMonth: 0 },           // $1 cleanup - no additional AI costs
      'developer': { perRequest: 0.10, perDay: 5.00, perMonth: 50.00 }, // $5 developer tier
      'team': { perRequest: 0.50, perDay: 25.00, perMonth: 250.00 },     // $25 team tier
      'enterprise': { perRequest: 5.00, perDay: 500.00, perMonth: 5000.00 } // Enterprise tier
    };
    
    return limits[tier] || limits.cleanup;
  }

  private getFeaturesForTier(tier: APIKeyTier): string[] {
    const features = {
      'internal': ['all'],
      'byok': ['analyze', 'cleanup', 'structure', 'generate', 'custom_models'],
      'cleanup': ['analyze', 'cleanup'],                                        // $1 cleanup tier
      'developer': ['analyze', 'cleanup', 'structure', 'agents'],              // $5 developer tier
      'team': ['analyze', 'cleanup', 'structure', 'generate', 'agents', 'collaborations'], // $25 team tier
      'enterprise': ['analyze', 'cleanup', 'structure', 'generate', 'agents', 'collaborations', 'custom_models', 'priority_support'] // Enterprise
    };
    
    return features[tier] || features.cleanup;
  }

  private getCachedKey(apiKey: string): APIKeyInfo | null {
    const cached = this.keyCache.get(apiKey);
    const expiry = this.cacheExpiry.get(apiKey);
    
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }
    
    // Clean up expired cache
    this.keyCache.delete(apiKey);
    this.cacheExpiry.delete(apiKey);
    return null;
  }

  private setCachedKey(apiKey: string, keyInfo: APIKeyInfo): void {
    this.keyCache.set(apiKey, keyInfo);
    this.cacheExpiry.set(apiKey, Date.now() + this.CACHE_TTL);
  }

  private apiKeyInfoToValidationResult(keyInfo: APIKeyInfo): APIValidationResult {
    return {
      valid: keyInfo.valid,
      keyId: keyInfo.keyId,
      userId: keyInfo.userId,
      tier: keyInfo.tier,
      customKeys: keyInfo.customKeys,
      rateLimit: keyInfo.rateLimit,
      costLimit: keyInfo.costLimit,
      features: keyInfo.features
    };
  }

  // Utility methods for API key generation
  generateAPIKey(tier: APIKeyTier, userId: string): string {
    const prefix = `fti_${tier}`;
    const randomPart = crypto.randomBytes(16).toString('hex');
    return `${prefix}_${randomPart}`;
  }

  generateBYOKKey(userId: string, customKeys: Record<string, string>): string {
    const encodedKeys = Buffer.from(JSON.stringify(customKeys)).toString('base64');
    return `byok_${userId}_${encodedKeys}`;
  }

  // Administrative methods
  async createAPIKey(params: {
    userId: string;
    tier: APIKeyTier;
    customKeys?: Record<string, string>;
  }): Promise<string> {
    const { userId, tier, customKeys } = params;
    
    if (tier === 'byok' && customKeys) {
      return this.generateBYOKKey(userId, customKeys);
    }
    
    const apiKey = this.generateAPIKey(tier, userId);
    
    // Store in database (mock for now)
    logger.info('Created new API key', {
      keyId: apiKey.substring(0, 20),
      userId,
      tier
    });
    
    return apiKey;
  }

  async revokeAPIKey(apiKey: string): Promise<boolean> {
    // Remove from cache
    this.keyCache.delete(apiKey);
    this.cacheExpiry.delete(apiKey);
    
    // Remove from database (mock for now)
    logger.info('Revoked API key', {
      keyId: apiKey.substring(0, 20)
    });
    
    return true;
  }

  // Cleanup method
  cleanupCache(): void {
    const now = Date.now();
    for (const [key, expiry] of this.cacheExpiry.entries()) {
      if (now >= expiry) {
        this.keyCache.delete(key);
        this.cacheExpiry.delete(key);
      }
    }
  }
}

// Singleton instance
const apiKeyManager = new APIKeyManager();

// Cleanup cache periodically
setInterval(() => {
  apiKeyManager.cleanupCache();
}, 5 * 60 * 1000); // Every 5 minutes

// Export validation function
export async function validateAPIKey(apiKey: string): Promise<APIValidationResult> {
  return apiKeyManager.validateAPIKey(apiKey);
}

// Export management functions
export const {
  createAPIKey,
  generateAPIKey,
  generateBYOKKey,
  revokeAPIKey
} = apiKeyManager;