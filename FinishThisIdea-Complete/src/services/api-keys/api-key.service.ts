/**
 * Enhanced API Key Management Service
 * Secure API key generation, validation, and rotation
 * Based on patterns from soulfra-agentzero
 */

import { PrismaClient, ApiKey, User } from '@prisma/client';
import { cryptoService } from '../crypto/crypto.service';
import { secretsManager } from '../secrets/secrets-manager.service';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errors';
import { redis } from '../../config/redis';
import { prometheusMetrics } from '../monitoring/prometheus-metrics.service';

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
    window: number; // seconds
  };
}

export interface ApiKeyCreateOptions {
  name: string;
  scopes?: string[];
  expiresIn?: number; // seconds
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

export class ApiKeyService {
  private static instance: ApiKeyService;
  private prisma: PrismaClient;
  private readonly keyPrefix = 'sk';
  private readonly testKeyPrefix = 'sk-test';

  constructor() {
    this.prisma = new PrismaClient();
    this.setupRotationCallbacks();
  }

  public static getInstance(): ApiKeyService {
    if (!ApiKeyService.instance) {
      ApiKeyService.instance = new ApiKeyService();
    }
    return ApiKeyService.instance;
  }

  /**
   * Create a new API key
   */
  public async createApiKey(
    userId: string,
    options: ApiKeyCreateOptions
  ): Promise<{ apiKey: ApiKeyData; plainKey: string }> {
    const start = Date.now();
    
    try {
      // Generate secure API key
      const isTestKey = process.env.NODE_ENV !== 'production';
      const prefix = isTestKey ? this.testKeyPrefix : this.keyPrefix;
      const plainKey = cryptoService.generateApiKey(prefix);
      
      // Hash the key for storage
      const hashedKey = await cryptoService.hashWithSalt(plainKey);
      
      // Create key data
      const apiKeyData: Omit<ApiKeyData, 'key'> = {
        id: cryptoService.generateSecureToken(16),
        userId,
        name: options.name,
        hashedKey,
        prefix,
        scopes: options.scopes || ['read'],
        metadata: options.metadata,
        rateLimit: options.rateLimit
      };

      if (options.expiresIn) {
        apiKeyData.expiresAt = new Date(Date.now() + options.expiresIn * 1000);
      }

      // Store in database
      const apiKey = await this.prisma.apiKey.create({
        data: {
          id: apiKeyData.id,
          userId,
          name: apiKeyData.name,
          hashedKey: apiKeyData.hashedKey,
          prefix: apiKeyData.prefix,
          scopes: apiKeyData.scopes,
          metadata: apiKeyData.metadata as any,
          expiresAt: apiKeyData.expiresAt,
          lastUsedAt: null
        }
      });

      // Store key metadata in Redis for fast lookup
      await this.cacheKeyMetadata(plainKey, apiKeyData);

      // Store in secrets manager for rotation
      await secretsManager.setSecret(`apikey:${apiKey.id}`, plainKey, {
        metadata: {
          userId,
          name: options.name,
          rotationInterval: 7776000 // 90 days
        },
        tags: ['api-key', `user:${userId}`]
      });

      logger.info('API key created', { 
        userId, 
        keyId: apiKey.id,
        name: options.name,
        scopes: options.scopes
      });

      prometheusMetrics.apiKeysCreated.inc({ prefix });
      prometheusMetrics.functionDuration.observe(
        { name: 'api_key_create' },
        Date.now() - start
      );

      return {
        apiKey: {
          ...apiKeyData,
          key: this.maskApiKey(plainKey)
        } as ApiKeyData,
        plainKey
      };

    } catch (error) {
      logger.error('Failed to create API key', { userId, error });
      prometheusMetrics.functionErrors.inc({ name: 'api_key_create_error' });
      throw error;
    }
  }

  /**
   * Validate API key
   */
  public async validateApiKey(plainKey: string): Promise<ApiKeyValidationResult> {
    const start = Date.now();
    
    try {
      // Check format
      if (!cryptoService.validateApiKeyFormat(plainKey)) {
        prometheusMetrics.authAttempts.inc({ status: 'invalid_format' });
        return { valid: false, reason: 'Invalid API key format' };
      }

      // Check cache first
      const cached = await this.getCachedKeyMetadata(plainKey);
      
      if (cached) {
        prometheusMetrics.cacheHits.inc({ cache: 'api_keys' });
        
        // Validate cached data
        const validation = await this.validateCachedKey(cached, plainKey);
        if (validation.valid) {
          // Update last used
          this.updateLastUsed(cached.id);
          prometheusMetrics.authAttempts.inc({ status: 'success' });
          return validation;
        }
      }

      prometheusMetrics.cacheMisses.inc({ cache: 'api_keys' });

      // Fallback to database lookup
      const apiKeys = await this.prisma.apiKey.findMany({
        where: {
          prefix: plainKey.split('_')[0]
        },
        include: {
          user: true
        }
      });

      for (const apiKey of apiKeys) {
        const isValid = await cryptoService.verifyHash(plainKey, apiKey.hashedKey);
        
        if (isValid) {
          // Check if expired
          if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
            prometheusMetrics.authAttempts.inc({ status: 'expired' });
            return { valid: false, reason: 'API key expired' };
          }

          // Check if user is active
          if (!apiKey.user.isActive) {
            prometheusMetrics.authAttempts.inc({ status: 'user_inactive' });
            return { valid: false, reason: 'User account is inactive' };
          }

          // Cache for future lookups
          const apiKeyData: ApiKeyData = {
            id: apiKey.id,
            userId: apiKey.userId,
            name: apiKey.name,
            key: this.maskApiKey(plainKey),
            hashedKey: apiKey.hashedKey,
            prefix: apiKey.prefix,
            lastUsedAt: apiKey.lastUsedAt || undefined,
            expiresAt: apiKey.expiresAt || undefined,
            scopes: apiKey.scopes,
            metadata: apiKey.metadata as any,
            rateLimit: apiKey.metadata?.rateLimit as any
          };

          await this.cacheKeyMetadata(plainKey, apiKeyData);

          // Update last used
          this.updateLastUsed(apiKey.id);

          prometheusMetrics.authAttempts.inc({ status: 'success' });
          prometheusMetrics.functionDuration.observe(
            { name: 'api_key_validate' },
            Date.now() - start
          );

          return {
            valid: true,
            apiKey: apiKeyData,
            user: apiKey.user
          };
        }
      }

      prometheusMetrics.authAttempts.inc({ status: 'invalid_key' });
      return { valid: false, reason: 'Invalid API key' };

    } catch (error) {
      logger.error('Failed to validate API key', error);
      prometheusMetrics.functionErrors.inc({ name: 'api_key_validate_error' });
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Rotate API key
   */
  public async rotateApiKey(
    userId: string,
    apiKeyId: string
  ): Promise<{ apiKey: ApiKeyData; plainKey: string }> {
    const start = Date.now();
    
    try {
      // Get existing key
      const existing = await this.prisma.apiKey.findFirst({
        where: { id: apiKeyId, userId }
      });

      if (!existing) {
        throw new AppError('API key not found', 404);
      }

      // Generate new key
      const result = await this.createApiKey(userId, {
        name: `${existing.name} (rotated)`,
        scopes: existing.scopes,
        metadata: {
          ...existing.metadata as any,
          rotatedFrom: existing.id,
          rotatedAt: new Date()
        },
        rateLimit: existing.metadata?.rateLimit as any
      });

      // Mark old key as rotated
      await this.prisma.apiKey.update({
        where: { id: apiKeyId },
        data: {
          metadata: {
            ...existing.metadata as any,
            rotatedTo: result.apiKey.id,
            rotatedAt: new Date()
          },
          expiresAt: new Date(Date.now() + 86400000) // Expire in 24 hours
        }
      });

      logger.info('API key rotated', {
        userId,
        oldKeyId: apiKeyId,
        newKeyId: result.apiKey.id
      });

      prometheusMetrics.apiKeysRotated.inc();
      prometheusMetrics.functionDuration.observe(
        { name: 'api_key_rotate' },
        Date.now() - start
      );

      return result;

    } catch (error) {
      logger.error('Failed to rotate API key', { userId, apiKeyId, error });
      prometheusMetrics.functionErrors.inc({ name: 'api_key_rotate_error' });
      throw error;
    }
  }

  /**
   * Revoke API key
   */
  public async revokeApiKey(userId: string, apiKeyId: string): Promise<void> {
    try {
      const apiKey = await this.prisma.apiKey.findFirst({
        where: { id: apiKeyId, userId }
      });

      if (!apiKey) {
        throw new AppError('API key not found', 404);
      }

      // Delete from database
      await this.prisma.apiKey.delete({
        where: { id: apiKeyId }
      });

      // Remove from cache
      await this.invalidateKeyCache(apiKey.prefix);

      // Remove from secrets manager
      await secretsManager.deleteSecret(`apikey:${apiKeyId}`);

      logger.info('API key revoked', { userId, apiKeyId });
      prometheusMetrics.apiKeysRevoked.inc();

    } catch (error) {
      logger.error('Failed to revoke API key', { userId, apiKeyId, error });
      throw error;
    }
  }

  /**
   * List user's API keys
   */
  public async listApiKeys(
    userId: string,
    options: { includeExpired?: boolean } = {}
  ): Promise<ApiKeyData[]> {
    try {
      const where: any = { userId };
      
      if (!options.includeExpired) {
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ];
      }

      const apiKeys = await this.prisma.apiKey.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      return apiKeys.map(key => ({
        id: key.id,
        userId: key.userId,
        name: key.name,
        key: this.maskApiKey(`${key.prefix}_hidden`),
        hashedKey: key.hashedKey,
        prefix: key.prefix,
        lastUsedAt: key.lastUsedAt || undefined,
        expiresAt: key.expiresAt || undefined,
        scopes: key.scopes,
        metadata: key.metadata as any
      }));

    } catch (error) {
      logger.error('Failed to list API keys', { userId, error });
      throw error;
    }
  }

  /**
   * Check rate limit for API key
   */
  public async checkRateLimit(apiKeyId: string, rateLimit?: any): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    if (!rateLimit) {
      return { allowed: true, remaining: -1, resetAt: new Date() };
    }

    const key = `ratelimit:apikey:${apiKeyId}`;
    const window = rateLimit.window || 3600; // Default 1 hour
    const limit = rateLimit.requests || 1000;
    
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, window);
    }

    const ttl = await redis.ttl(key);
    const resetAt = new Date(Date.now() + ttl * 1000);

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
      resetAt
    };
  }

  /**
   * Update API key scopes
   */
  public async updateScopes(
    userId: string,
    apiKeyId: string,
    scopes: string[]
  ): Promise<ApiKeyData> {
    try {
      const apiKey = await this.prisma.apiKey.update({
        where: { id: apiKeyId, userId },
        data: { scopes }
      });

      // Invalidate cache
      await this.invalidateKeyCache(apiKey.prefix);

      logger.info('API key scopes updated', { userId, apiKeyId, scopes });

      return {
        id: apiKey.id,
        userId: apiKey.userId,
        name: apiKey.name,
        key: this.maskApiKey(`${apiKey.prefix}_hidden`),
        hashedKey: apiKey.hashedKey,
        prefix: apiKey.prefix,
        lastUsedAt: apiKey.lastUsedAt || undefined,
        expiresAt: apiKey.expiresAt || undefined,
        scopes: apiKey.scopes,
        metadata: apiKey.metadata as any
      };

    } catch (error) {
      logger.error('Failed to update API key scopes', { userId, apiKeyId, error });
      throw error;
    }
  }

  /**
   * Cache helpers
   */
  private async cacheKeyMetadata(plainKey: string, metadata: any): Promise<void> {
    const cacheKey = `apikey:meta:${cryptoService.hash(plainKey)}`;
    await redis.setex(cacheKey, 3600, JSON.stringify(metadata)); // 1 hour TTL
  }

  private async getCachedKeyMetadata(plainKey: string): Promise<any> {
    const cacheKey = `apikey:meta:${cryptoService.hash(plainKey)}`;
    const cached = await redis.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  }

  private async invalidateKeyCache(prefix: string): Promise<void> {
    // Since we hash the keys, we can't directly invalidate by prefix
    // This is a trade-off for security
    // In production, consider using a more sophisticated cache invalidation strategy
    logger.info('Cache invalidation requested for prefix', { prefix });
  }

  /**
   * Validate cached key data
   */
  private async validateCachedKey(
    cached: any,
    plainKey: string
  ): Promise<ApiKeyValidationResult> {
    // Re-verify the hash to ensure cache wasn't tampered with
    const isValid = await cryptoService.verifyHash(plainKey, cached.hashedKey);
    
    if (!isValid) {
      return { valid: false, reason: 'Cache validation failed' };
    }

    // Check expiration
    if (cached.expiresAt && new Date() > new Date(cached.expiresAt)) {
      return { valid: false, reason: 'API key expired' };
    }

    // Get user data
    const user = await this.prisma.user.findUnique({
      where: { id: cached.userId }
    });

    if (!user || !user.isActive) {
      return { valid: false, reason: 'User inactive' };
    }

    return {
      valid: true,
      apiKey: cached,
      user
    };
  }

  /**
   * Update last used timestamp
   */
  private async updateLastUsed(apiKeyId: string): Promise<void> {
    // Update asynchronously to not block the request
    setImmediate(async () => {
      try {
        await this.prisma.apiKey.update({
          where: { id: apiKeyId },
          data: { lastUsedAt: new Date() }
        });
      } catch (error) {
        logger.error('Failed to update last used', { apiKeyId, error });
      }
    });
  }

  /**
   * Mask API key for display
   */
  private maskApiKey(key: string): string {
    const parts = key.split('_');
    if (parts.length < 2) return '********';
    
    const prefix = parts[0];
    const visibleChars = 4;
    const lastPart = parts[parts.length - 1];
    const suffix = lastPart.substring(Math.max(0, lastPart.length - visibleChars));
    
    return `${prefix}_****${suffix}`;
  }

  /**
   * Setup rotation callbacks
   */
  private setupRotationCallbacks(): void {
    // Register callback for automatic API key rotation
    secretsManager.on('secret:rotation-needed', async ({ name }) => {
      if (name.startsWith('apikey:')) {
        const apiKeyId = name.replace('apikey:', '');
        
        try {
          const apiKey = await this.prisma.apiKey.findUnique({
            where: { id: apiKeyId }
          });
          
          if (apiKey && !apiKey.metadata?.noAutoRotate) {
            await this.rotateApiKey(apiKey.userId, apiKey.id);
          }
        } catch (error) {
          logger.error('Auto-rotation failed', { apiKeyId, error });
        }
      }
    });
  }

  /**
   * Generate API documentation for a key
   */
  public generateApiKeyDocs(apiKey: ApiKeyData): string {
    return `
# API Key: ${apiKey.name}

## Details
- Key ID: ${apiKey.id}
- Created: ${apiKey.metadata?.createdAt || 'Unknown'}
- Expires: ${apiKey.expiresAt || 'Never'}
- Last Used: ${apiKey.lastUsedAt || 'Never'}

## Scopes
${apiKey.scopes.map(scope => `- ${scope}`).join('\n')}

## Rate Limits
${apiKey.rateLimit ? `- ${apiKey.rateLimit.requests} requests per ${apiKey.rateLimit.window} seconds` : '- No rate limits'}

## Usage Example

\`\`\`bash
curl -H "X-API-Key: YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     https://api.finishthisidea.com/v1/endpoint
\`\`\`

## Security Notes
- Keep your API key secret
- Rotate regularly (recommended: every 90 days)
- Use HTTPS for all API requests
- Set appropriate scopes for least privilege
`;
  }
}

// Export singleton instance
export const apiKeyService = ApiKeyService.getInstance();