/**
 * Secrets Management Service
 * Centralized secrets storage with encryption and rotation
 * Inspired by vault patterns from soulfra-agentzero
 */

import { EventEmitter } from 'events';
import { cryptoService } from '../crypto/crypto.service';
import { logger } from '../../utils/logger';
import { redis } from '../../config/redis';
import { AppError } from '../../utils/errors';
import { prometheusMetrics } from '../monitoring/prometheus-metrics.service';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Secret {
  id: string;
  name: string;
  value: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface EncryptedSecret {
  id: string;
  name: string;
  encrypted: string;
  iv: string;
  tag: string;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface SecretsConfig {
  storageBackend: 'redis' | 'file' | 'memory';
  encryptionEnabled: boolean;
  rotationCheckInterval: number; // milliseconds
  defaultTTL: number; // seconds
  auditEnabled: boolean;
  cacheEnabled: boolean;
  cacheTTL: number; // seconds
}

const defaultConfig: SecretsConfig = {
  storageBackend: 'redis',
  encryptionEnabled: true,
  rotationCheckInterval: 3600000, // 1 hour
  defaultTTL: 0, // No expiration by default
  auditEnabled: true,
  cacheEnabled: true,
  cacheTTL: 300 // 5 minutes
};

export class SecretsManagerService extends EventEmitter {
  private static instance: SecretsManagerService;
  private config: SecretsConfig;
  private cache: Map<string, { secret: Secret; expires: number }> = new Map();
  private rotationCallbacks: Map<string, (newValue: string) => Promise<void>> = new Map();
  private fileStoragePath: string = './secrets';

  constructor(config: Partial<SecretsConfig> = {}) {
    super();
    this.config = { ...defaultConfig, ...config };
    
    // Start rotation checker
    if (this.config.rotationCheckInterval > 0) {
      setInterval(() => this.checkRotations(), this.config.rotationCheckInterval);
    }
    
    // Initialize file storage if needed
    if (this.config.storageBackend === 'file') {
      this.initFileStorage();
    }
  }

  public static getInstance(config?: Partial<SecretsConfig>): SecretsManagerService {
    if (!SecretsManagerService.instance) {
      SecretsManagerService.instance = new SecretsManagerService(config);
    }
    return SecretsManagerService.instance;
  }

  /**
   * Store a secret
   */
  public async setSecret(
    name: string,
    value: string,
    options: {
      ttl?: number;
      metadata?: Record<string, any>;
      tags?: string[];
      overwrite?: boolean;
    } = {}
  ): Promise<Secret> {
    const start = Date.now();
    
    try {
      // Check if secret exists and overwrite is not allowed
      if (!options.overwrite) {
        const existing = await this.getSecret(name, { skipCache: true });
        if (existing) {
          throw new AppError('Secret already exists', 409);
        }
      }

      const secret: Secret = {
        id: cryptoService.generateSecureToken(16),
        name,
        value,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: options.metadata,
        tags: options.tags
      };

      if (options.ttl && options.ttl > 0) {
        secret.expiresAt = new Date(Date.now() + options.ttl * 1000);
      }

      // Store based on backend
      await this.store(secret);

      // Audit log
      if (this.config.auditEnabled) {
        await this.auditLog('set_secret', { name, version: secret.version });
      }

      // Cache if enabled
      if (this.config.cacheEnabled) {
        this.cacheSecret(secret);
      }

      // Emit event
      this.emit('secret:created', { name, id: secret.id });

      prometheusMetrics.functionDuration.observe(
        { name: 'secrets_set' },
        Date.now() - start
      );

      return { ...secret, value: this.maskValue(secret.value) };

    } catch (error) {
      logger.error('Failed to set secret', { name, error });
      prometheusMetrics.functionErrors.inc({ name: 'secrets_set_error' });
      throw error;
    }
  }

  /**
   * Get a secret
   */
  public async getSecret(
    name: string,
    options: { version?: number; skipCache?: boolean } = {}
  ): Promise<Secret | null> {
    const start = Date.now();
    
    try {
      // Check cache first
      if (this.config.cacheEnabled && !options.skipCache) {
        const cached = this.getCachedSecret(name);
        if (cached) {
          prometheusMetrics.cacheHits.inc({ cache: 'secrets' });
          return cached;
        }
      }

      prometheusMetrics.cacheMisses.inc({ cache: 'secrets' });

      // Retrieve from storage
      const secret = await this.retrieve(name, options.version);
      
      if (!secret) {
        return null;
      }

      // Check expiration
      if (secret.expiresAt && new Date() > secret.expiresAt) {
        await this.deleteSecret(name);
        return null;
      }

      // Cache if enabled
      if (this.config.cacheEnabled) {
        this.cacheSecret(secret);
      }

      // Audit log
      if (this.config.auditEnabled) {
        await this.auditLog('get_secret', { name, version: secret.version });
      }

      prometheusMetrics.functionDuration.observe(
        { name: 'secrets_get' },
        Date.now() - start
      );

      return secret;

    } catch (error) {
      logger.error('Failed to get secret', { name, error });
      prometheusMetrics.functionErrors.inc({ name: 'secrets_get_error' });
      throw error;
    }
  }

  /**
   * Update a secret (creates new version)
   */
  public async updateSecret(
    name: string,
    value: string,
    metadata?: Record<string, any>
  ): Promise<Secret> {
    const start = Date.now();
    
    try {
      const existing = await this.getSecret(name, { skipCache: true });
      if (!existing) {
        throw new AppError('Secret not found', 404);
      }

      const updated: Secret = {
        ...existing,
        value,
        version: existing.version + 1,
        updatedAt: new Date(),
        metadata: metadata || existing.metadata
      };

      // Store new version
      await this.store(updated);

      // Trigger rotation callbacks
      const callback = this.rotationCallbacks.get(name);
      if (callback) {
        await callback(value);
      }

      // Invalidate cache
      this.invalidateCache(name);

      // Audit log
      if (this.config.auditEnabled) {
        await this.auditLog('update_secret', { 
          name, 
          oldVersion: existing.version,
          newVersion: updated.version 
        });
      }

      // Emit event
      this.emit('secret:updated', { name, version: updated.version });

      prometheusMetrics.functionDuration.observe(
        { name: 'secrets_update' },
        Date.now() - start
      );

      return { ...updated, value: this.maskValue(updated.value) };

    } catch (error) {
      logger.error('Failed to update secret', { name, error });
      prometheusMetrics.functionErrors.inc({ name: 'secrets_update_error' });
      throw error;
    }
  }

  /**
   * Delete a secret
   */
  public async deleteSecret(name: string): Promise<void> {
    const start = Date.now();
    
    try {
      const existing = await this.getSecret(name, { skipCache: true });
      if (!existing) {
        throw new AppError('Secret not found', 404);
      }

      // Delete from storage
      await this.remove(name);

      // Invalidate cache
      this.invalidateCache(name);

      // Remove rotation callback
      this.rotationCallbacks.delete(name);

      // Audit log
      if (this.config.auditEnabled) {
        await this.auditLog('delete_secret', { name });
      }

      // Emit event
      this.emit('secret:deleted', { name });

      prometheusMetrics.functionDuration.observe(
        { name: 'secrets_delete' },
        Date.now() - start
      );

    } catch (error) {
      logger.error('Failed to delete secret', { name, error });
      prometheusMetrics.functionErrors.inc({ name: 'secrets_delete_error' });
      throw error;
    }
  }

  /**
   * List secrets
   */
  public async listSecrets(options: {
    tags?: string[];
    prefix?: string;
    includeExpired?: boolean;
  } = {}): Promise<Array<Omit<Secret, 'value'>>> {
    try {
      const secrets = await this.list();
      
      let filtered = secrets;

      // Filter by tags
      if (options.tags && options.tags.length > 0) {
        filtered = filtered.filter(s => 
          s.tags && options.tags!.some(tag => s.tags!.includes(tag))
        );
      }

      // Filter by prefix
      if (options.prefix) {
        filtered = filtered.filter(s => s.name.startsWith(options.prefix!));
      }

      // Filter expired
      if (!options.includeExpired) {
        const now = new Date();
        filtered = filtered.filter(s => !s.expiresAt || s.expiresAt > now);
      }

      // Remove values
      return filtered.map(({ value, ...rest }) => rest);

    } catch (error) {
      logger.error('Failed to list secrets', error);
      throw error;
    }
  }

  /**
   * Register rotation callback
   */
  public registerRotationCallback(
    name: string,
    callback: (newValue: string) => Promise<void>
  ): void {
    this.rotationCallbacks.set(name, callback);
  }

  /**
   * Rotate a secret
   */
  public async rotateSecret(
    name: string,
    generator?: () => string | Promise<string>
  ): Promise<Secret> {
    try {
      const existing = await this.getSecret(name);
      if (!existing) {
        throw new AppError('Secret not found', 404);
      }

      // Generate new value
      const newValue = generator 
        ? await generator()
        : cryptoService.generateSecureToken(32);

      // Update secret
      const updated = await this.updateSecret(name, newValue);

      logger.info('Secret rotated', { name, version: updated.version });

      return updated;

    } catch (error) {
      logger.error('Failed to rotate secret', { name, error });
      throw error;
    }
  }

  /**
   * Bulk import secrets
   */
  public async importSecrets(
    secrets: Array<{ name: string; value: string; metadata?: any }>
  ): Promise<number> {
    let imported = 0;
    
    for (const secret of secrets) {
      try {
        await this.setSecret(secret.name, secret.value, {
          metadata: secret.metadata,
          overwrite: true
        });
        imported++;
      } catch (error) {
        logger.error('Failed to import secret', { name: secret.name, error });
      }
    }

    return imported;
  }

  /**
   * Export secrets (values masked)
   */
  public async exportSecrets(
    options: { unmask?: boolean } = {}
  ): Promise<Array<Partial<Secret>>> {
    const secrets = await this.listSecrets({ includeExpired: true });
    
    if (options.unmask) {
      // Only for backup purposes, requires special permission
      logger.warn('Exporting unmasked secrets');
      const fullSecrets = [];
      for (const secretInfo of secrets) {
        const secret = await this.getSecret(secretInfo.name);
        if (secret) {
          fullSecrets.push(secret);
        }
      }
      return fullSecrets;
    }

    return secrets;
  }

  /**
   * Storage backend methods
   */
  private async store(secret: Secret): Promise<void> {
    const encrypted = this.config.encryptionEnabled
      ? this.encryptSecret(secret)
      : secret;

    switch (this.config.storageBackend) {
      case 'redis':
        await this.storeInRedis(encrypted);
        break;
      case 'file':
        await this.storeInFile(encrypted);
        break;
      case 'memory':
        await this.storeInMemory(encrypted);
        break;
    }
  }

  private async retrieve(name: string, version?: number): Promise<Secret | null> {
    let encrypted: any;

    switch (this.config.storageBackend) {
      case 'redis':
        encrypted = await this.retrieveFromRedis(name, version);
        break;
      case 'file':
        encrypted = await this.retrieveFromFile(name, version);
        break;
      case 'memory':
        encrypted = await this.retrieveFromMemory(name, version);
        break;
    }

    if (!encrypted) return null;

    return this.config.encryptionEnabled
      ? this.decryptSecret(encrypted)
      : encrypted;
  }

  private async remove(name: string): Promise<void> {
    switch (this.config.storageBackend) {
      case 'redis':
        await this.removeFromRedis(name);
        break;
      case 'file':
        await this.removeFromFile(name);
        break;
      case 'memory':
        await this.removeFromMemory(name);
        break;
    }
  }

  private async list(): Promise<Secret[]> {
    switch (this.config.storageBackend) {
      case 'redis':
        return this.listFromRedis();
      case 'file':
        return this.listFromFile();
      case 'memory':
        return this.listFromMemory();
    }
  }

  /**
   * Redis storage implementation
   */
  private async storeInRedis(secret: any): Promise<void> {
    const key = `secrets:${secret.name}:v${secret.version}`;
    const currentKey = `secrets:${secret.name}:current`;
    
    const pipeline = redis.pipeline();
    
    // Store versioned secret
    if (this.config.defaultTTL > 0) {
      pipeline.setex(key, this.config.defaultTTL, JSON.stringify(secret));
    } else {
      pipeline.set(key, JSON.stringify(secret));
    }
    
    // Update current version pointer
    pipeline.set(currentKey, secret.version.toString());
    
    // Add to index
    pipeline.sadd('secrets:index', secret.name);
    
    await pipeline.exec();
  }

  private async retrieveFromRedis(name: string, version?: number): Promise<any> {
    const currentKey = `secrets:${name}:current`;
    const v = version || parseInt(await redis.get(currentKey) || '0');
    
    if (!v) return null;
    
    const key = `secrets:${name}:v${v}`;
    const data = await redis.get(key);
    
    return data ? JSON.parse(data) : null;
  }

  private async removeFromRedis(name: string): Promise<void> {
    const currentKey = `secrets:${name}:current`;
    const version = await redis.get(currentKey);
    
    if (version) {
      const pipeline = redis.pipeline();
      
      // Remove all versions
      for (let v = 1; v <= parseInt(version); v++) {
        pipeline.del(`secrets:${name}:v${v}`);
      }
      
      pipeline.del(currentKey);
      pipeline.srem('secrets:index', name);
      
      await pipeline.exec();
    }
  }

  private async listFromRedis(): Promise<Secret[]> {
    const names = await redis.smembers('secrets:index');
    const secrets: Secret[] = [];
    
    for (const name of names) {
      const secret = await this.retrieve(name);
      if (secret) {
        secrets.push(secret);
      }
    }
    
    return secrets;
  }

  /**
   * File storage implementation
   */
  private async initFileStorage(): Promise<void> {
    try {
      await fs.mkdir(this.fileStoragePath, { recursive: true });
    } catch (error) {
      logger.error('Failed to initialize file storage', error);
    }
  }

  private async storeInFile(secret: any): Promise<void> {
    const dir = path.join(this.fileStoragePath, secret.name);
    await fs.mkdir(dir, { recursive: true });
    
    const file = path.join(dir, `v${secret.version}.json`);
    await fs.writeFile(file, JSON.stringify(secret, null, 2));
    
    // Update current version pointer
    const currentFile = path.join(dir, 'current');
    await fs.writeFile(currentFile, secret.version.toString());
  }

  private async retrieveFromFile(name: string, version?: number): Promise<any> {
    try {
      const dir = path.join(this.fileStoragePath, name);
      
      let v = version;
      if (!v) {
        const currentFile = path.join(dir, 'current');
        v = parseInt(await fs.readFile(currentFile, 'utf-8'));
      }
      
      const file = path.join(dir, `v${v}.json`);
      const data = await fs.readFile(file, 'utf-8');
      
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  private async removeFromFile(name: string): Promise<void> {
    const dir = path.join(this.fileStoragePath, name);
    await fs.rm(dir, { recursive: true, force: true });
  }

  private async listFromFile(): Promise<Secret[]> {
    try {
      const dirs = await fs.readdir(this.fileStoragePath);
      const secrets: Secret[] = [];
      
      for (const name of dirs) {
        const secret = await this.retrieve(name);
        if (secret) {
          secrets.push(secret);
        }
      }
      
      return secrets;
    } catch (error) {
      return [];
    }
  }

  /**
   * Memory storage implementation
   */
  private memoryStore = new Map<string, any>();

  private async storeInMemory(secret: any): Promise<void> {
    this.memoryStore.set(`${secret.name}:v${secret.version}`, secret);
    this.memoryStore.set(`${secret.name}:current`, secret.version);
  }

  private async retrieveFromMemory(name: string, version?: number): Promise<any> {
    const v = version || this.memoryStore.get(`${name}:current`);
    if (!v) return null;
    
    return this.memoryStore.get(`${name}:v${v}`);
  }

  private async removeFromMemory(name: string): Promise<void> {
    const version = this.memoryStore.get(`${name}:current`);
    
    if (version) {
      for (let v = 1; v <= version; v++) {
        this.memoryStore.delete(`${name}:v${v}`);
      }
      this.memoryStore.delete(`${name}:current`);
    }
  }

  private async listFromMemory(): Promise<Secret[]> {
    const secrets: Secret[] = [];
    const names = new Set<string>();
    
    for (const key of this.memoryStore.keys()) {
      if (key.endsWith(':current')) {
        names.add(key.replace(':current', ''));
      }
    }
    
    for (const name of names) {
      const secret = await this.retrieve(name);
      if (secret) {
        secrets.push(secret);
      }
    }
    
    return secrets;
  }

  /**
   * Encryption helpers
   */
  private encryptSecret(secret: Secret): EncryptedSecret {
    const { encrypted, iv, tag } = cryptoService.encrypt(secret.value);
    
    return {
      ...secret,
      encrypted,
      iv,
      tag,
      value: undefined as any
    };
  }

  private decryptSecret(encrypted: EncryptedSecret): Secret {
    const value = cryptoService.decrypt(encrypted.encrypted, encrypted.iv, encrypted.tag);
    
    const { encrypted: _, iv: __, tag: ___, ...rest } = encrypted;
    return {
      ...rest,
      value
    };
  }

  /**
   * Cache helpers
   */
  private cacheSecret(secret: Secret): void {
    const expires = Date.now() + (this.config.cacheTTL * 1000);
    this.cache.set(secret.name, { secret, expires });
  }

  private getCachedSecret(name: string): Secret | null {
    const cached = this.cache.get(name);
    
    if (!cached) return null;
    
    if (Date.now() > cached.expires) {
      this.cache.delete(name);
      return null;
    }
    
    return cached.secret;
  }

  private invalidateCache(name: string): void {
    this.cache.delete(name);
  }

  /**
   * Utility methods
   */
  private maskValue(value: string): string {
    if (value.length <= 8) {
      return '********';
    }
    
    const visibleChars = 4;
    const prefix = value.substring(0, visibleChars);
    const suffix = value.substring(value.length - visibleChars);
    
    return `${prefix}****${suffix}`;
  }

  private async auditLog(action: string, details: any): Promise<void> {
    try {
      const entry = {
        timestamp: new Date(),
        action,
        details,
        user: 'system' // TODO: Get from context
      };
      
      await redis.lpush('secrets:audit', JSON.stringify(entry));
      await redis.ltrim('secrets:audit', 0, 9999); // Keep last 10k entries
      
    } catch (error) {
      logger.error('Failed to write audit log', error);
    }
  }

  /**
   * Check for secrets that need rotation
   */
  private async checkRotations(): Promise<void> {
    try {
      const secrets = await this.listSecrets();
      
      for (const secretInfo of secrets) {
        const secret = await this.getSecret(secretInfo.name);
        if (!secret) continue;
        
        // Check if secret has rotation metadata
        if (secret.metadata?.rotationInterval) {
          const rotationInterval = secret.metadata.rotationInterval * 1000; // Convert to ms
          const timeSinceUpdate = Date.now() - secret.updatedAt.getTime();
          
          if (timeSinceUpdate >= rotationInterval) {
            logger.info('Secret rotation needed', { name: secret.name });
            this.emit('secret:rotation-needed', { name: secret.name });
            
            // Auto-rotate if callback is registered
            if (this.rotationCallbacks.has(secret.name)) {
              await this.rotateSecret(secret.name);
            }
          }
        }
      }
    } catch (error) {
      logger.error('Failed to check rotations', error);
    }
  }
}

// Export singleton instance
export const secretsManager = SecretsManagerService.getInstance();