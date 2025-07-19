/**
 * API KEY MANAGEMENT SERVICE
 * 
 * Manages API key lifecycle for users based on their pricing tier
 * Integrates with payment system and viral economics
 */

import crypto from 'crypto';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { presenceLogger } from '../monitoring/presence-logger';
import { PRICING_TIERS } from './pricing.service';
import { APIKeyTier } from './ai-api/auth';

export interface UserAPIKey {
  id: string;
  keyId: string;
  keyHash: string; // Hashed version for security
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

export class APIKeyManagementService {
  
  /**
   * Generate a new API key for a user based on their current tier
   */
  async generateAPIKeyForUser(
    userId: string, 
    tier: APIKeyTier, 
    options: {
      name?: string;
      description?: string;
      expiresInDays?: number;
    } = {}
  ): Promise<{ apiKey: string; keyInfo: UserAPIKey }> {
    try {
      // Generate the actual API key
      const keyPrefix = `fti_${tier}`;
      const randomPart = crypto.randomBytes(24).toString('hex');
      const apiKey = `${keyPrefix}_${randomPart}`;
      
      // Create hash for storage (never store plain text)
      const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
      
      // Calculate expiration
      let expiresAt: Date | undefined;
      if (options.expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + options.expiresInDays);
      }
      
      // Create key record in database (extend schema later)
      const keyInfo: UserAPIKey = {
        id: crypto.randomUUID(),
        keyId: `key_${randomPart.substring(0, 12)}`,
        keyHash,
        tier,
        userId,
        isActive: true,
        createdAt: new Date(),
        expiresAt,
        usageCount: 0,
        metadata: {
          name: options.name || `${tier} API Key`,
          description: options.description || `Generated for ${tier} tier access`,
        }
      };
      
      // Log the key generation
      await presenceLogger.logUserPresence('api_key_generated', {
        userId,
        metadata: {
          tier,
          keyId: keyInfo.keyId,
          expiresAt: expiresAt?.toISOString()
        }
      });
      
      logger.info('API key generated for user', {
        userId,
        tier,
        keyId: keyInfo.keyId,
        expiresAt
      });
      
      return { apiKey, keyInfo };
      
    } catch (error) {
      logger.error('Failed to generate API key', { error, userId, tier });
      throw error;
    }
  }
  
  /**
   * Issue API key when user completes payment for a tier
   */
  async issueAPIKeyForPayment(
    userId: string,
    tierId: string,
    paymentId: string
  ): Promise<{ apiKey: string; keyInfo: UserAPIKey }> {
    const tier = this.mapPricingTierToAPITier(tierId);
    
    // Deactivate any existing keys for this tier
    await this.deactivateUserKeysForTier(userId, tier);
    
    // Generate new key
    const result = await this.generateAPIKeyForUser(userId, tier, {
      name: `${PRICING_TIERS[tierId]?.name} Access`,
      description: `Access key for ${tierId} tier (Payment: ${paymentId})`,
      expiresInDays: this.getExpirationDaysForTier(tier)
    });
    
    // Log payment-linked key generation
    await presenceLogger.logUserPresence('payment_api_key_issued', {
      userId,
      metadata: {
        tier,
        tierId,
        paymentId,
        keyId: result.keyInfo.keyId
      }
    });
    
    return result;
  }
  
  /**
   * Get user's active API keys
   */
  async getUserAPIKeys(userId: string): Promise<UserAPIKey[]> {
    // In a real implementation, this would query the database
    // For now, return mock data based on user
    return [];
  }
  
  /**
   * Deactivate an API key
   */
  async deactivateAPIKey(userId: string, keyId: string): Promise<boolean> {
    try {
      // In real implementation, update database
      // For now, just log the action
      
      await presenceLogger.logUserPresence('api_key_deactivated', {
        userId,
        metadata: { keyId }
      });
      
      logger.info('API key deactivated', { userId, keyId });
      return true;
      
    } catch (error) {
      logger.error('Failed to deactivate API key', { error, userId, keyId });
      return false;
    }
  }
  
  /**
   * Validate API key and return tier information
   */
  async validateAPIKey(apiKey: string): Promise<{
    valid: boolean;
    keyInfo?: UserAPIKey;
    tier?: APIKeyTier;
    error?: string;
  }> {
    try {
      // Extract tier from key prefix
      const parts = apiKey.split('_');
      if (parts.length < 3 || parts[0] !== 'fti') {
        return { valid: false, error: 'INVALID_KEY_FORMAT' };
      }
      
      const tier = parts[1] as APIKeyTier;
      
      // For now, validate format and return tier
      // In real implementation, check against database
      const isValidTier = ['internal', 'byok', 'cleanup', 'developer', 'team', 'enterprise'].includes(tier);
      
      if (!isValidTier) {
        return { valid: false, error: 'INVALID_TIER' };
      }
      
      // Mock key info
      const keyInfo: UserAPIKey = {
        id: 'mock-id',
        keyId: parts[2].substring(0, 12),
        keyHash: crypto.createHash('sha256').update(apiKey).digest('hex'),
        tier,
        userId: 'mock-user',
        isActive: true,
        createdAt: new Date(),
        usageCount: 0
      };
      
      return { valid: true, keyInfo, tier };
      
    } catch (error) {
      logger.error('API key validation error', { error });
      return { valid: false, error: 'VALIDATION_ERROR' };
    }
  }
  
  /**
   * Track API key usage
   */
  async trackAPIKeyUsage(
    apiKey: string, 
    endpoint: string, 
    cost: number = 0
  ): Promise<void> {
    try {
      const validation = await this.validateAPIKey(apiKey);
      if (!validation.valid || !validation.keyInfo) return;
      
      // Log usage
      await presenceLogger.logUserPresence('api_key_usage', {
        userId: validation.keyInfo.userId,
        metadata: {
          keyId: validation.keyInfo.keyId,
          endpoint,
          cost,
          tier: validation.tier
        }
      });
      
    } catch (error) {
      logger.error('Failed to track API key usage', { error });
    }
  }
  
  /**
   * Upgrade user's API key to new tier
   */
  async upgradeAPIKey(
    userId: string, 
    fromTier: APIKeyTier, 
    toTier: APIKeyTier
  ): Promise<{ apiKey: string; keyInfo: UserAPIKey }> {
    // Deactivate old tier key
    await this.deactivateUserKeysForTier(userId, fromTier);
    
    // Generate new tier key
    const result = await this.generateAPIKeyForUser(userId, toTier, {
      name: `${toTier} Tier Access (Upgraded)`,
      description: `Upgraded from ${fromTier} to ${toTier}`,
      expiresInDays: this.getExpirationDaysForTier(toTier)
    });
    
    await presenceLogger.logUserPresence('api_key_upgraded', {
      userId,
      metadata: {
        fromTier,
        toTier,
        newKeyId: result.keyInfo.keyId
      }
    });
    
    return result;
  }
  
  // ============================================================================
  // 🛠️ HELPER METHODS
  // ============================================================================
  
  private mapPricingTierToAPITier(pricingTierId: string): APIKeyTier {
    const mapping: Record<string, APIKeyTier> = {
      'cleanup': 'cleanup',
      'developer': 'developer', 
      'team': 'team',
      'enterprise': 'enterprise'
    };
    
    return mapping[pricingTierId] || 'cleanup';
  }
  
  private getExpirationDaysForTier(tier: APIKeyTier): number {
    const expirationDays = {
      'internal': 0, // Never expires
      'byok': 365, // 1 year
      'cleanup': 30, // 30 days
      'developer': 90, // 3 months
      'team': 365, // 1 year
      'enterprise': 0 // Never expires
    };
    
    return expirationDays[tier] || 30;
  }
  
  private async deactivateUserKeysForTier(userId: string, tier: APIKeyTier): Promise<void> {
    // In real implementation, update database to set isActive = false
    logger.info('Deactivating existing keys for tier', { userId, tier });
  }
  
  /**
   * Get API key statistics for a user
   */
  async getAPIKeyStats(userId: string): Promise<{
    totalKeys: number;
    activeKeys: number;
    totalUsage: number;
    tierBreakdown: Record<APIKeyTier, number>;
  }> {
    // Mock implementation
    return {
      totalKeys: 0,
      activeKeys: 0,
      totalUsage: 0,
      tierBreakdown: {
        internal: 0,
        byok: 0,
        cleanup: 0,
        developer: 0,
        team: 0,
        enterprise: 0
      }
    };
  }
}

// Singleton instance
export const apiKeyManagementService = new APIKeyManagementService();