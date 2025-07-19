"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.secretsManager = exports.SecretsManagerService = void 0;
const events_1 = require("events");
const crypto_service_1 = require("../crypto/crypto.service");
const logger_1 = require("../../utils/logger");
const redis_1 = require("../../config/redis");
const errors_1 = require("../../utils/errors");
const prometheus_metrics_service_1 = require("../monitoring/prometheus-metrics.service");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const defaultConfig = {
    storageBackend: 'redis',
    encryptionEnabled: true,
    rotationCheckInterval: 3600000,
    defaultTTL: 0,
    auditEnabled: true,
    cacheEnabled: true,
    cacheTTL: 300
};
class SecretsManagerService extends events_1.EventEmitter {
    static instance;
    config;
    cache = new Map();
    rotationCallbacks = new Map();
    fileStoragePath = './secrets';
    constructor(config = {}) {
        super();
        this.config = { ...defaultConfig, ...config };
        if (this.config.rotationCheckInterval > 0) {
            setInterval(() => this.checkRotations(), this.config.rotationCheckInterval);
        }
        if (this.config.storageBackend === 'file') {
            this.initFileStorage();
        }
    }
    static getInstance(config) {
        if (!SecretsManagerService.instance) {
            SecretsManagerService.instance = new SecretsManagerService(config);
        }
        return SecretsManagerService.instance;
    }
    async setSecret(name, value, options = {}) {
        const start = Date.now();
        try {
            if (!options.overwrite) {
                const existing = await this.getSecret(name, { skipCache: true });
                if (existing) {
                    throw new errors_1.AppError('Secret already exists', 409);
                }
            }
            const secret = {
                id: crypto_service_1.cryptoService.generateSecureToken(16),
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
            await this.store(secret);
            if (this.config.auditEnabled) {
                await this.auditLog('set_secret', { name, version: secret.version });
            }
            if (this.config.cacheEnabled) {
                this.cacheSecret(secret);
            }
            this.emit('secret:created', { name, id: secret.id });
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'secrets_set' }, Date.now() - start);
            return { ...secret, value: this.maskValue(secret.value) };
        }
        catch (error) {
            logger_1.logger.error('Failed to set secret', { name, error });
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'secrets_set_error' });
            throw error;
        }
    }
    async getSecret(name, options = {}) {
        const start = Date.now();
        try {
            if (this.config.cacheEnabled && !options.skipCache) {
                const cached = this.getCachedSecret(name);
                if (cached) {
                    prometheus_metrics_service_1.prometheusMetrics.cacheHits.inc({ cache: 'secrets' });
                    return cached;
                }
            }
            prometheus_metrics_service_1.prometheusMetrics.cacheMisses.inc({ cache: 'secrets' });
            const secret = await this.retrieve(name, options.version);
            if (!secret) {
                return null;
            }
            if (secret.expiresAt && new Date() > secret.expiresAt) {
                await this.deleteSecret(name);
                return null;
            }
            if (this.config.cacheEnabled) {
                this.cacheSecret(secret);
            }
            if (this.config.auditEnabled) {
                await this.auditLog('get_secret', { name, version: secret.version });
            }
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'secrets_get' }, Date.now() - start);
            return secret;
        }
        catch (error) {
            logger_1.logger.error('Failed to get secret', { name, error });
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'secrets_get_error' });
            throw error;
        }
    }
    async updateSecret(name, value, metadata) {
        const start = Date.now();
        try {
            const existing = await this.getSecret(name, { skipCache: true });
            if (!existing) {
                throw new errors_1.AppError('Secret not found', 404);
            }
            const updated = {
                ...existing,
                value,
                version: existing.version + 1,
                updatedAt: new Date(),
                metadata: metadata || existing.metadata
            };
            await this.store(updated);
            const callback = this.rotationCallbacks.get(name);
            if (callback) {
                await callback(value);
            }
            this.invalidateCache(name);
            if (this.config.auditEnabled) {
                await this.auditLog('update_secret', {
                    name,
                    oldVersion: existing.version,
                    newVersion: updated.version
                });
            }
            this.emit('secret:updated', { name, version: updated.version });
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'secrets_update' }, Date.now() - start);
            return { ...updated, value: this.maskValue(updated.value) };
        }
        catch (error) {
            logger_1.logger.error('Failed to update secret', { name, error });
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'secrets_update_error' });
            throw error;
        }
    }
    async deleteSecret(name) {
        const start = Date.now();
        try {
            const existing = await this.getSecret(name, { skipCache: true });
            if (!existing) {
                throw new errors_1.AppError('Secret not found', 404);
            }
            await this.remove(name);
            this.invalidateCache(name);
            this.rotationCallbacks.delete(name);
            if (this.config.auditEnabled) {
                await this.auditLog('delete_secret', { name });
            }
            this.emit('secret:deleted', { name });
            prometheus_metrics_service_1.prometheusMetrics.functionDuration.observe({ name: 'secrets_delete' }, Date.now() - start);
        }
        catch (error) {
            logger_1.logger.error('Failed to delete secret', { name, error });
            prometheus_metrics_service_1.prometheusMetrics.functionErrors.inc({ name: 'secrets_delete_error' });
            throw error;
        }
    }
    async listSecrets(options = {}) {
        try {
            const secrets = await this.list();
            let filtered = secrets;
            if (options.tags && options.tags.length > 0) {
                filtered = filtered.filter(s => s.tags && options.tags.some(tag => s.tags.includes(tag)));
            }
            if (options.prefix) {
                filtered = filtered.filter(s => s.name.startsWith(options.prefix));
            }
            if (!options.includeExpired) {
                const now = new Date();
                filtered = filtered.filter(s => !s.expiresAt || s.expiresAt > now);
            }
            return filtered.map(({ value, ...rest }) => rest);
        }
        catch (error) {
            logger_1.logger.error('Failed to list secrets', error);
            throw error;
        }
    }
    registerRotationCallback(name, callback) {
        this.rotationCallbacks.set(name, callback);
    }
    async rotateSecret(name, generator) {
        try {
            const existing = await this.getSecret(name);
            if (!existing) {
                throw new errors_1.AppError('Secret not found', 404);
            }
            const newValue = generator
                ? await generator()
                : crypto_service_1.cryptoService.generateSecureToken(32);
            const updated = await this.updateSecret(name, newValue);
            logger_1.logger.info('Secret rotated', { name, version: updated.version });
            return updated;
        }
        catch (error) {
            logger_1.logger.error('Failed to rotate secret', { name, error });
            throw error;
        }
    }
    async importSecrets(secrets) {
        let imported = 0;
        for (const secret of secrets) {
            try {
                await this.setSecret(secret.name, secret.value, {
                    metadata: secret.metadata,
                    overwrite: true
                });
                imported++;
            }
            catch (error) {
                logger_1.logger.error('Failed to import secret', { name: secret.name, error });
            }
        }
        return imported;
    }
    async exportSecrets(options = {}) {
        const secrets = await this.listSecrets({ includeExpired: true });
        if (options.unmask) {
            logger_1.logger.warn('Exporting unmasked secrets');
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
    async store(secret) {
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
    async retrieve(name, version) {
        let encrypted;
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
        if (!encrypted)
            return null;
        return this.config.encryptionEnabled
            ? this.decryptSecret(encrypted)
            : encrypted;
    }
    async remove(name) {
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
    async list() {
        switch (this.config.storageBackend) {
            case 'redis':
                return this.listFromRedis();
            case 'file':
                return this.listFromFile();
            case 'memory':
                return this.listFromMemory();
        }
    }
    async storeInRedis(secret) {
        const key = `secrets:${secret.name}:v${secret.version}`;
        const currentKey = `secrets:${secret.name}:current`;
        const pipeline = redis_1.redis.pipeline();
        if (this.config.defaultTTL > 0) {
            pipeline.setex(key, this.config.defaultTTL, JSON.stringify(secret));
        }
        else {
            pipeline.set(key, JSON.stringify(secret));
        }
        pipeline.set(currentKey, secret.version.toString());
        pipeline.sadd('secrets:index', secret.name);
        await pipeline.exec();
    }
    async retrieveFromRedis(name, version) {
        const currentKey = `secrets:${name}:current`;
        const v = version || parseInt(await redis_1.redis.get(currentKey) || '0');
        if (!v)
            return null;
        const key = `secrets:${name}:v${v}`;
        const data = await redis_1.redis.get(key);
        return data ? JSON.parse(data) : null;
    }
    async removeFromRedis(name) {
        const currentKey = `secrets:${name}:current`;
        const version = await redis_1.redis.get(currentKey);
        if (version) {
            const pipeline = redis_1.redis.pipeline();
            for (let v = 1; v <= parseInt(version); v++) {
                pipeline.del(`secrets:${name}:v${v}`);
            }
            pipeline.del(currentKey);
            pipeline.srem('secrets:index', name);
            await pipeline.exec();
        }
    }
    async listFromRedis() {
        const names = await redis_1.redis.smembers('secrets:index');
        const secrets = [];
        for (const name of names) {
            const secret = await this.retrieve(name);
            if (secret) {
                secrets.push(secret);
            }
        }
        return secrets;
    }
    async initFileStorage() {
        try {
            await fs.mkdir(this.fileStoragePath, { recursive: true });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize file storage', error);
        }
    }
    async storeInFile(secret) {
        const dir = path.join(this.fileStoragePath, secret.name);
        await fs.mkdir(dir, { recursive: true });
        const file = path.join(dir, `v${secret.version}.json`);
        await fs.writeFile(file, JSON.stringify(secret, null, 2));
        const currentFile = path.join(dir, 'current');
        await fs.writeFile(currentFile, secret.version.toString());
    }
    async retrieveFromFile(name, version) {
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
        }
        catch (error) {
            return null;
        }
    }
    async removeFromFile(name) {
        const dir = path.join(this.fileStoragePath, name);
        await fs.rm(dir, { recursive: true, force: true });
    }
    async listFromFile() {
        try {
            const dirs = await fs.readdir(this.fileStoragePath);
            const secrets = [];
            for (const name of dirs) {
                const secret = await this.retrieve(name);
                if (secret) {
                    secrets.push(secret);
                }
            }
            return secrets;
        }
        catch (error) {
            return [];
        }
    }
    memoryStore = new Map();
    async storeInMemory(secret) {
        this.memoryStore.set(`${secret.name}:v${secret.version}`, secret);
        this.memoryStore.set(`${secret.name}:current`, secret.version);
    }
    async retrieveFromMemory(name, version) {
        const v = version || this.memoryStore.get(`${name}:current`);
        if (!v)
            return null;
        return this.memoryStore.get(`${name}:v${v}`);
    }
    async removeFromMemory(name) {
        const version = this.memoryStore.get(`${name}:current`);
        if (version) {
            for (let v = 1; v <= version; v++) {
                this.memoryStore.delete(`${name}:v${v}`);
            }
            this.memoryStore.delete(`${name}:current`);
        }
    }
    async listFromMemory() {
        const secrets = [];
        const names = new Set();
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
    encryptSecret(secret) {
        const { encrypted, iv, tag } = crypto_service_1.cryptoService.encrypt(secret.value);
        return {
            ...secret,
            encrypted,
            iv,
            tag,
            value: undefined
        };
    }
    decryptSecret(encrypted) {
        const value = crypto_service_1.cryptoService.decrypt(encrypted.encrypted, encrypted.iv, encrypted.tag);
        const { encrypted: _, iv: __, tag: ___, ...rest } = encrypted;
        return {
            ...rest,
            value
        };
    }
    cacheSecret(secret) {
        const expires = Date.now() + (this.config.cacheTTL * 1000);
        this.cache.set(secret.name, { secret, expires });
    }
    getCachedSecret(name) {
        const cached = this.cache.get(name);
        if (!cached)
            return null;
        if (Date.now() > cached.expires) {
            this.cache.delete(name);
            return null;
        }
        return cached.secret;
    }
    invalidateCache(name) {
        this.cache.delete(name);
    }
    maskValue(value) {
        if (value.length <= 8) {
            return '********';
        }
        const visibleChars = 4;
        const prefix = value.substring(0, visibleChars);
        const suffix = value.substring(value.length - visibleChars);
        return `${prefix}****${suffix}`;
    }
    async auditLog(action, details) {
        try {
            const entry = {
                timestamp: new Date(),
                action,
                details,
                user: 'system'
            };
            await redis_1.redis.lpush('secrets:audit', JSON.stringify(entry));
            await redis_1.redis.ltrim('secrets:audit', 0, 9999);
        }
        catch (error) {
            logger_1.logger.error('Failed to write audit log', error);
        }
    }
    async checkRotations() {
        try {
            const secrets = await this.listSecrets();
            for (const secretInfo of secrets) {
                const secret = await this.getSecret(secretInfo.name);
                if (!secret)
                    continue;
                if (secret.metadata?.rotationInterval) {
                    const rotationInterval = secret.metadata.rotationInterval * 1000;
                    const timeSinceUpdate = Date.now() - secret.updatedAt.getTime();
                    if (timeSinceUpdate >= rotationInterval) {
                        logger_1.logger.info('Secret rotation needed', { name: secret.name });
                        this.emit('secret:rotation-needed', { name: secret.name });
                        if (this.rotationCallbacks.has(secret.name)) {
                            await this.rotateSecret(secret.name);
                        }
                    }
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to check rotations', error);
        }
    }
}
exports.SecretsManagerService = SecretsManagerService;
exports.secretsManager = SecretsManagerService.getInstance();
//# sourceMappingURL=secrets-manager.service.js.map