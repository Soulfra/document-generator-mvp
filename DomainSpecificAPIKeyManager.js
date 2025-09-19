#!/usr/bin/env node
/**
 * DOMAIN-SPECIFIC API KEY MANAGER
 * Enterprise-grade API key management with per-domain isolation and rotation
 * 
 * Features:
 * - Domain-isolated API key storage
 * - Automatic key rotation and expiration
 * - Usage tracking and analytics per domain
 * - Integration with vault system for secure storage
 * - Customer BYOK (Bring Your Own Keys) support
 * - Granular permission management
 * - Real-time monitoring and alerting
 */

// Load environment variables first
require('dotenv').config();

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class DomainSpecificAPIKeyManager {
    constructor(config = {}) {
        this.config = {
            // Storage configuration
            vaultDir: config.vaultDir || './.vault/api-keys',
            backupDir: config.backupDir || './.vault/backups',
            
            // Key management
            keyLength: config.keyLength || 32,
            keyPrefix: config.keyPrefix || 'sf_',
            rotationInterval: config.rotationInterval || 30, // days
            enableAutoRotation: config.enableAutoRotation || false,
            maxKeysPerDomain: config.maxKeysPerDomain || 10,
            
            // Security
            encryption: {
                algorithm: 'aes-256-gcm',
                keyDerivation: 'pbkdf2',
                iterations: 100000,
                saltLength: 32,
                ivLength: 16
            },
            
            // Usage tracking
            enableUsageTracking: config.enableUsageTracking !== false,
            usageRetention: config.usageRetention || 90, // days
            alertThresholds: config.alertThresholds || {
                dailyUsage: 10000,
                errorRate: 0.05,
                suspiciousActivity: 0.8
            },
            
            // Customer settings
            enableBYOK: config.enableBYOK !== false,
            byokValidation: config.byokValidation || {
                minLength: 32,
                requireSpecialChars: true,
                requireNumbers: true
            },
            
            ...config
        };

        // Internal state
        this.domains = new Map();
        this.apiKeys = new Map();
        this.usageData = new Map();
        this.rotationSchedule = new Map();
        
        // Encryption keys (in production, these would be derived from HSM or secure key store)
        this.masterKey = null;
        this.vaultFailed = false; // Track if vault system failed
        
        this.initialize();
    }

    async initialize() {
        console.log('🔑 Initializing Domain-Specific API Key Manager...');
        
        try {
            // Create necessary directories
            await this.ensureDirectories();
            
            // Initialize master key
            await this.initializeMasterKey();
            
            // Load existing domains and keys
            await this.loadDomains();
            await this.loadApiKeys();
            
            console.log(`✅ Initialized API Key Manager with ${this.domains.size} domains`);
        } catch (error) {
            console.warn(`⚠️  Vault system failed, falling back to environment variables: ${error.message}`);
            this.vaultFailed = true;
            
            // Load keys directly from environment variables
            await this.loadEnvironmentKeys();
        }
        
        // Start background processes (only if vault is working)
        if (!this.vaultFailed) {
            this.startRotationScheduler();
            this.startUsageMonitoring();
        }
    }
    
    /**
     * Load API keys directly from environment variables (fallback mode)
     */
    async loadEnvironmentKeys() {
        console.log('🔑 Loading keys from environment variables...');
        
        const envKeys = {
            anthropic: process.env.ANTHROPIC_API_KEY,
            openai: process.env.OPENAI_API_KEY,
            deepseek: process.env.DEEPSEEK_API_KEY,
            gemini: process.env.GEMINI_API_KEY,
            kimi: process.env.KIMI_API_KEY,
            perplexity: process.env.PERPLEXITY_API_KEY
        };
        
        let loadedCount = 0;
        for (const [service, key] of Object.entries(envKeys)) {
            if (key && !this.isPlaceholderKey(key)) {
                const keyConfig = {
                    keyId: `env_${service}`,
                    domain: 'environment',
                    service: service,
                    keyValue: key,
                    source: 'environment',
                    createdAt: new Date(),
                    expiresAt: null,
                    isActive: true
                };
                
                this.apiKeys.set(keyConfig.keyId, keyConfig);
                loadedCount++;
                console.log(`  ✅ Loaded ${service} key from environment`);
            }
        }
        
        console.log(`🔑 Loaded ${loadedCount} keys from environment variables`);
        
        // If no keys found in environment, try loading from .env.template
        if (loadedCount === 0) {
            console.log('⚠️  No keys in environment, checking .env.template...');
            await this.loadTemplateKeys();
        }
    }
    
    /**
     * Load API keys from .env.template (hidden keys fallback)
     */
    async loadTemplateKeys() {
        const fs = require('fs').promises;
        const path = require('path');
        
        try {
            const templatePath = path.join(__dirname, '.env.template');
            const content = await fs.readFile(templatePath, 'utf-8');
            const lines = content.split('\n');
            
            let loadedCount = 0;
            
            for (const line of lines) {
                const match = line.match(/^(ANTHROPIC|OPENAI|DEEPSEEK|GEMINI|PERPLEXITY|KIMI)_API_KEY=(.+)$/);
                if (match) {
                    const service = match[1].toLowerCase();
                    const key = match[2].trim();
                    
                    if (key && !this.isPlaceholderKey(key)) {
                        const keyConfig = {
                            keyId: `template_${service}`,
                            domain: 'template',
                            service: service,
                            keyValue: key,
                            source: 'template',
                            createdAt: new Date(),
                            expiresAt: null,
                            isActive: true
                        };
                        
                        this.apiKeys.set(keyConfig.keyId, keyConfig);
                        loadedCount++;
                        console.log(`  ⛽ Loaded ${service} key from .env.template`);
                    }
                }
            }
            
            console.log(`⛽ Loaded ${loadedCount} keys from .env.template`);
            
        } catch (error) {
            console.warn('⚠️  Could not load .env.template:', error.message);
        }
    }
    
    /**
     * Check if a key is a placeholder
     */
    isPlaceholderKey(key) {
        if (!key) return true;
        
        const placeholderPatterns = [
            'your_',
            '_here',
            'example',
            'placeholder',
            'sk-your',
            'key_your',
            'demo-key',
            'undefined'
        ];
        
        return placeholderPatterns.some(pattern => key.includes(pattern));
    }

    // ==================== DOMAIN MANAGEMENT ====================
    
    async registerDomain(domain, settings = {}) {
        const domainConfig = {
            domain,
            registeredAt: new Date().toISOString(),
            settings: {
                maxKeys: settings.maxKeys || this.config.maxKeysPerDomain,
                rotationInterval: settings.rotationInterval || this.config.rotationInterval,
                enableAutoRotation: settings.enableAutoRotation || false,
                allowBYOK: settings.allowBYOK !== false,
                permissions: settings.permissions || ['read', 'write'],
                usageQuota: settings.usageQuota || null, // unlimited if null
                ...settings
            },
            status: 'active',
            keyCount: 0,
            lastActivity: null
        };

        this.domains.set(domain, domainConfig);
        await this.saveDomainConfig(domain);
        
        console.log(`📝 Registered domain: ${domain}`);
        return domainConfig;
    }

    async unregisterDomain(domain) {
        const domainConfig = this.domains.get(domain);
        if (!domainConfig) {
            throw new Error(`Domain not found: ${domain}`);
        }

        // Remove all keys for this domain
        const domainKeys = Array.from(this.apiKeys.values())
            .filter(key => key.domain === domain);
            
        for (const key of domainKeys) {
            await this.revokeApiKey(key.keyId);
        }

        // Remove domain
        this.domains.delete(domain);
        
        // Clean up files
        await this.cleanupDomainFiles(domain);
        
        console.log(`🗑️ Unregistered domain: ${domain}`);
    }

    // ==================== API KEY GENERATION ====================
    
    async generateApiKey(domain, options = {}) {
        const domainConfig = this.domains.get(domain);
        if (!domainConfig) {
            throw new Error(`Domain not registered: ${domain}`);
        }

        // Check key limits
        if (domainConfig.keyCount >= domainConfig.settings.maxKeys) {
            throw new Error(`Maximum keys reached for domain: ${domain}`);
        }

        const keyId = this.generateKeyId();
        const apiKey = this.generateSecureKey();
        
        const keyConfig = {
            keyId,
            apiKey,
            domain,
            createdAt: new Date().toISOString(),
            expiresAt: options.expiresAt || this.calculateExpiration(domainConfig),
            permissions: options.permissions || domainConfig.settings.permissions,
            description: options.description || '',
            createdBy: options.createdBy || 'system',
            status: 'active',
            usage: {
                totalRequests: 0,
                successfulRequests: 0,
                errorCount: 0,
                lastUsed: null,
                dailyUsage: {}
            },
            metadata: {
                userAgent: options.userAgent || null,
                clientIp: options.clientIp || null,
                ...options.metadata
            }
        };

        // Store encrypted key
        await this.storeApiKey(keyConfig);
        
        // Update domain config
        domainConfig.keyCount++;
        domainConfig.lastActivity = new Date().toISOString();
        await this.saveDomainConfig(domain);
        
        console.log(`🔑 Generated API key for ${domain}: ${keyId}`);
        
        return {
            keyId,
            apiKey, // Only returned once during generation
            domain,
            permissions: keyConfig.permissions,
            expiresAt: keyConfig.expiresAt
        };
    }

    async importCustomerKey(domain, customerKey, options = {}) {
        if (!this.config.enableBYOK) {
            throw new Error('Customer keys not supported');
        }

        const domainConfig = this.domains.get(domain);
        if (!domainConfig) {
            throw new Error(`Domain not registered: ${domain}`);
        }

        if (!domainConfig.settings.allowBYOK) {
            throw new Error(`Domain does not allow customer keys: ${domain}`);
        }

        // Validate customer key
        this.validateCustomerKey(customerKey);

        const keyId = this.generateKeyId();
        
        const keyConfig = {
            keyId,
            apiKey: customerKey,
            domain,
            type: 'customer',
            createdAt: new Date().toISOString(),
            expiresAt: options.expiresAt || null, // Customer keys don't auto-expire
            permissions: options.permissions || domainConfig.settings.permissions,
            description: options.description || 'Customer provided key',
            createdBy: options.createdBy || 'customer',
            status: 'active',
            usage: {
                totalRequests: 0,
                successfulRequests: 0,
                errorCount: 0,
                lastUsed: null,
                dailyUsage: {}
            },
            metadata: {
                imported: true,
                ...options.metadata
            }
        };

        await this.storeApiKey(keyConfig);
        
        domainConfig.keyCount++;
        await this.saveDomainConfig(domain);
        
        console.log(`📥 Imported customer key for ${domain}: ${keyId}`);
        
        return {
            keyId,
            domain,
            permissions: keyConfig.permissions,
            expiresAt: keyConfig.expiresAt
        };
    }

    // ==================== KEY VALIDATION & LOOKUP ====================
    
    async validateApiKey(apiKey, domain = null) {
        try {
            // Find key by value
            const keyConfig = await this.findKeyByValue(apiKey);
            if (!keyConfig) {
                return { valid: false, error: 'Key not found' };
            }

            // Check domain match if specified
            if (domain && keyConfig.domain !== domain) {
                return { valid: false, error: 'Domain mismatch' };
            }

            // Check expiration
            if (keyConfig.expiresAt && new Date() > new Date(keyConfig.expiresAt)) {
                return { valid: false, error: 'Key expired' };
            }

            // Check status
            if (keyConfig.status !== 'active') {
                return { valid: false, error: `Key status: ${keyConfig.status}` };
            }

            // Update usage
            await this.recordKeyUsage(keyConfig.keyId, 'validation');

            return {
                valid: true,
                keyId: keyConfig.keyId,
                domain: keyConfig.domain,
                permissions: keyConfig.permissions,
                metadata: keyConfig.metadata
            };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    async findKeyByValue(apiKey) {
        // In production, this would use indexed lookup
        for (const keyConfig of this.apiKeys.values()) {
            if (keyConfig.apiKey === apiKey) {
                return keyConfig;
            }
        }
        return null;
    }

    // ==================== KEY ROTATION ====================
    
    async rotateApiKey(keyId) {
        const keyConfig = this.apiKeys.get(keyId);
        if (!keyConfig) {
            throw new Error(`API key not found: ${keyId}`);
        }

        if (keyConfig.type === 'customer') {
            throw new Error('Customer keys cannot be automatically rotated');
        }

        // Generate new key
        const newApiKey = this.generateSecureKey();
        const oldApiKey = keyConfig.apiKey;
        
        // Update key config
        keyConfig.apiKey = newApiKey;
        keyConfig.rotatedAt = new Date().toISOString();
        keyConfig.rotationHistory = keyConfig.rotationHistory || [];
        keyConfig.rotationHistory.push({
            rotatedAt: keyConfig.rotatedAt,
            oldKeyHash: this.hashKey(oldApiKey),
            reason: 'manual'
        });

        // Store updated key
        await this.storeApiKey(keyConfig);
        
        console.log(`🔄 Rotated API key: ${keyId}`);
        
        return {
            keyId,
            apiKey: newApiKey,
            domain: keyConfig.domain,
            rotatedAt: keyConfig.rotatedAt
        };
    }

    async scheduleKeyRotation(keyId, rotationDate) {
        this.rotationSchedule.set(keyId, {
            keyId,
            scheduledFor: rotationDate,
            scheduledAt: new Date().toISOString()
        });

        console.log(`📅 Scheduled rotation for key ${keyId} at ${rotationDate}`);
    }

    async revokeApiKey(keyId, reason = 'manual') {
        const keyConfig = this.apiKeys.get(keyId);
        if (!keyConfig) {
            throw new Error(`API key not found: ${keyId}`);
        }

        keyConfig.status = 'revoked';
        keyConfig.revokedAt = new Date().toISOString();
        keyConfig.revocationReason = reason;
        
        await this.storeApiKey(keyConfig);
        
        // Update domain count
        const domainConfig = this.domains.get(keyConfig.domain);
        if (domainConfig) {
            domainConfig.keyCount = Math.max(0, domainConfig.keyCount - 1);
            await this.saveDomainConfig(keyConfig.domain);
        }

        console.log(`❌ Revoked API key: ${keyId} (${reason})`);
    }

    // ==================== USAGE TRACKING ====================
    
    async recordKeyUsage(keyId, operation, metadata = {}) {
        if (!this.config.enableUsageTracking) {
            return;
        }

        const keyConfig = this.apiKeys.get(keyId);
        if (!keyConfig) {
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        
        // Update key usage
        keyConfig.usage.totalRequests++;
        keyConfig.usage.lastUsed = new Date().toISOString();
        
        if (operation === 'success') {
            keyConfig.usage.successfulRequests++;
        } else if (operation === 'error') {
            keyConfig.usage.errorCount++;
        }

        // Update daily usage
        if (!keyConfig.usage.dailyUsage[today]) {
            keyConfig.usage.dailyUsage[today] = { requests: 0, errors: 0 };
        }
        keyConfig.usage.dailyUsage[today].requests++;
        
        if (operation === 'error') {
            keyConfig.usage.dailyUsage[today].errors++;
        }

        await this.storeApiKey(keyConfig);
        
        // Check for alerts
        await this.checkUsageAlerts(keyConfig);
    }

    async checkUsageAlerts(keyConfig) {
        const today = new Date().toISOString().split('T')[0];
        const todayUsage = keyConfig.usage.dailyUsage[today] || { requests: 0, errors: 0 };
        
        // Check daily usage threshold
        if (todayUsage.requests > this.config.alertThresholds.dailyUsage) {
            console.warn(`⚠️ High usage alert for key ${keyConfig.keyId}: ${todayUsage.requests} requests today`);
        }

        // Check error rate
        const errorRate = todayUsage.requests > 0 ? todayUsage.errors / todayUsage.requests : 0;
        if (errorRate > this.config.alertThresholds.errorRate) {
            console.warn(`⚠️ High error rate alert for key ${keyConfig.keyId}: ${(errorRate * 100).toFixed(2)}% error rate`);
        }
    }

    // ==================== STORAGE & ENCRYPTION ====================
    
    async storeApiKey(keyConfig) {
        const encryptedKey = await this.encryptKeyData(keyConfig);
        const filePath = path.join(this.config.vaultDir, keyConfig.domain, `${keyConfig.keyId}.json`);
        
        await this.ensureDirectory(path.dirname(filePath));
        await fs.writeFile(filePath, JSON.stringify(encryptedKey, null, 2));
        
        // Store in memory cache
        this.apiKeys.set(keyConfig.keyId, keyConfig);
    }

    async loadApiKeys() {
        try {
            const domains = await fs.readdir(this.config.vaultDir);
            
            for (const domain of domains) {
                const domainPath = path.join(this.config.vaultDir, domain);
                const stat = await fs.stat(domainPath);
                
                if (stat.isDirectory()) {
                    await this.loadDomainKeys(domain);
                }
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.warn('Failed to load API keys:', error.message);
            }
        }
    }

    async loadDomainKeys(domain) {
        try {
            const domainPath = path.join(this.config.vaultDir, domain);
            const files = await fs.readdir(domainPath);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path.join(domainPath, file);
                        const encryptedData = await fs.readFile(filePath, 'utf8');
                        
                        // Handle empty or invalid files gracefully
                        if (!encryptedData || encryptedData.trim() === '') {
                            console.warn(`Skipping empty file: ${file}`);
                            continue;
                        }
                        
                        let parsedData;
                        try {
                            parsedData = JSON.parse(encryptedData);
                        } catch (parseError) {
                            console.warn(`Failed to parse JSON in ${file}:`, parseError.message);
                            continue;
                        }
                        
                        // Only decrypt if we have valid encrypted data
                        if (parsedData && parsedData.encrypted) {
                            const keyConfig = await this.decryptKeyData(parsedData);
                            this.apiKeys.set(keyConfig.keyId, keyConfig);
                        }
                    } catch (error) {
                        console.warn(`Failed to load key file ${file}:`, error.message);
                    }
                }
            }
        } catch (error) {
            console.warn(`Failed to load keys for domain ${domain}:`, error.message);
        }
    }

    async encryptKeyData(keyConfig) {
        const data = JSON.stringify(keyConfig);
        const salt = crypto.randomBytes(this.config.encryption.saltLength);
        const iv = crypto.randomBytes(this.config.encryption.ivLength);
        
        const key = crypto.pbkdf2Sync(
            this.masterKey,
            salt,
            this.config.encryption.iterations,
            32,
            'sha256'
        );

        const cipher = crypto.createCipheriv(this.config.encryption.algorithm, key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();

        return {
            encrypted,
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            algorithm: this.config.encryption.algorithm
        };
    }

    async decryptKeyData(encryptedData) {
        const key = crypto.pbkdf2Sync(
            this.masterKey,
            Buffer.from(encryptedData.salt, 'hex'),
            this.config.encryption.iterations,
            32,
            'sha256'
        );

        const decipher = crypto.createDecipheriv(
            encryptedData.algorithm,
            key,
            Buffer.from(encryptedData.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }

    // ==================== UTILITY METHODS ====================
    
    generateKeyId() {
        return 'key_' + crypto.randomBytes(16).toString('hex');
    }

    generateSecureKey() {
        const randomBytes = crypto.randomBytes(this.config.keyLength);
        return this.config.keyPrefix + randomBytes.toString('hex');
    }

    hashKey(apiKey) {
        return crypto.createHash('sha256').update(apiKey).digest('hex');
    }

    validateCustomerKey(key) {
        const validation = this.config.byokValidation;
        
        if (key.length < validation.minLength) {
            throw new Error(`Key too short. Minimum length: ${validation.minLength}`);
        }

        if (validation.requireNumbers && !/\d/.test(key)) {
            throw new Error('Key must contain at least one number');
        }

        if (validation.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(key)) {
            throw new Error('Key must contain at least one special character');
        }
    }

    calculateExpiration(domainConfig) {
        const days = domainConfig.settings.rotationInterval;
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + days);
        return expirationDate.toISOString();
    }

    async initializeMasterKey() {
        const keyPath = path.join(this.config.vaultDir, '.master.key');
        
        try {
            const keyData = await fs.readFile(keyPath, 'utf8');
            this.masterKey = keyData.trim();
        } catch (error) {
            // Generate new master key
            this.masterKey = crypto.randomBytes(64).toString('hex');
            await this.ensureDirectory(path.dirname(keyPath));
            await fs.writeFile(keyPath, this.masterKey, { mode: 0o600 });
            console.log('🔐 Generated new master key');
        }
    }

    async ensureDirectories() {
        await this.ensureDirectory(this.config.vaultDir);
        await this.ensureDirectory(this.config.backupDir);
    }

    async ensureDirectory(dir) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') throw error;
        }
    }

    async saveDomainConfig(domain) {
        const domainConfig = this.domains.get(domain);
        const configPath = path.join(this.config.vaultDir, domain, 'config.json');
        
        await this.ensureDirectory(path.dirname(configPath));
        await fs.writeFile(configPath, JSON.stringify(domainConfig, null, 2));
    }

    async loadDomains() {
        try {
            const domains = await fs.readdir(this.config.vaultDir);
            
            for (const domain of domains) {
                if (domain.startsWith('.')) continue; // Skip hidden files
                
                try {
                    const configPath = path.join(this.config.vaultDir, domain, 'config.json');
                    const configData = await fs.readFile(configPath, 'utf8');
                    const domainConfig = JSON.parse(configData);
                    
                    this.domains.set(domain, domainConfig);
                } catch (error) {
                    // Domain config doesn't exist yet, skip
                }
            }
        } catch (error) {
            // Vault directory doesn't exist yet
        }
    }

    async cleanupDomainFiles(domain) {
        const domainPath = path.join(this.config.vaultDir, domain);
        
        try {
            const files = await fs.readdir(domainPath);
            for (const file of files) {
                await fs.unlink(path.join(domainPath, file));
            }
            await fs.rmdir(domainPath);
        } catch (error) {
            console.warn(`Failed to cleanup domain files for ${domain}:`, error.message);
        }
    }

    // ==================== BACKGROUND PROCESSES ====================
    
    startRotationScheduler() {
        setInterval(() => {
            this.processScheduledRotations();
        }, 60 * 60 * 1000); // Check every hour
    }

    startUsageMonitoring() {
        setInterval(() => {
            this.processUsageMonitoring();
        }, 5 * 60 * 1000); // Check every 5 minutes
    }

    async processScheduledRotations() {
        const now = new Date();
        
        for (const [keyId, schedule] of this.rotationSchedule) {
            if (new Date(schedule.scheduledFor) <= now) {
                try {
                    await this.rotateApiKey(keyId);
                    this.rotationSchedule.delete(keyId);
                    console.log(`🔄 Auto-rotated scheduled key: ${keyId}`);
                } catch (error) {
                    console.error(`Failed to rotate scheduled key ${keyId}:`, error.message);
                }
            }
        }
    }

    async processUsageMonitoring() {
        // Clean up old usage data
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.usageRetention);
        const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

        for (const keyConfig of this.apiKeys.values()) {
            // Clean old daily usage data
            for (const date of Object.keys(keyConfig.usage.dailyUsage)) {
                if (date < cutoffDateStr) {
                    delete keyConfig.usage.dailyUsage[date];
                }
            }
        }
    }

    // ==================== REPORTING & ANALYTICS ====================
    
    async generateUsageReport(domain = null, days = 30) {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);

        const report = {
            domain,
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                days
            },
            summary: {
                totalKeys: 0,
                activeKeys: 0,
                totalRequests: 0,
                successfulRequests: 0,
                errorCount: 0,
                errorRate: 0
            },
            topKeys: [],
            dailyBreakdown: {}
        };

        const keysToAnalyze = domain 
            ? Array.from(this.apiKeys.values()).filter(k => k.domain === domain)
            : Array.from(this.apiKeys.values());

        report.summary.totalKeys = keysToAnalyze.length;

        for (const keyConfig of keysToAnalyze) {
            if (keyConfig.status === 'active') {
                report.summary.activeKeys++;
            }

            report.summary.totalRequests += keyConfig.usage.totalRequests;
            report.summary.successfulRequests += keyConfig.usage.successfulRequests;
            report.summary.errorCount += keyConfig.usage.errorCount;

            // Analyze daily usage
            for (const [date, usage] of Object.entries(keyConfig.usage.dailyUsage)) {
                if (date >= startDate.toISOString().split('T')[0] && 
                    date <= endDate.toISOString().split('T')[0]) {
                    
                    if (!report.dailyBreakdown[date]) {
                        report.dailyBreakdown[date] = { requests: 0, errors: 0 };
                    }
                    
                    report.dailyBreakdown[date].requests += usage.requests;
                    report.dailyBreakdown[date].errors += usage.errors;
                }
            }
        }

        report.summary.errorRate = report.summary.totalRequests > 0 
            ? report.summary.errorCount / report.summary.totalRequests 
            : 0;

        // Top keys by usage
        report.topKeys = keysToAnalyze
            .sort((a, b) => b.usage.totalRequests - a.usage.totalRequests)
            .slice(0, 10)
            .map(key => ({
                keyId: key.keyId,
                domain: key.domain,
                totalRequests: key.usage.totalRequests,
                errorRate: key.usage.totalRequests > 0 ? key.usage.errorCount / key.usage.totalRequests : 0,
                lastUsed: key.usage.lastUsed
            }));

        return report;
    }

    getSystemStats() {
        return {
            domains: this.domains.size,
            totalKeys: this.apiKeys.size,
            activeKeys: Array.from(this.apiKeys.values()).filter(k => k.status === 'active').length,
            scheduledRotations: this.rotationSchedule.size,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        };
    }
    
    /**
     * Get API key value for a service (for gas tank integration)
     */
    getAPIKeyForService(service) {
        // Try to find any active key for this service
        for (const [keyId, keyConfig] of this.apiKeys.entries()) {
            if (keyConfig.service === service && keyConfig.isActive && keyConfig.keyValue) {
                return {
                    key: keyConfig.keyValue,
                    source: keyConfig.source,
                    keyId: keyId
                };
            }
        }
        return null;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DomainSpecificAPIKeyManager;
}

// CLI usage and testing
if (require.main === module) {
    async function main() {
        console.log('🔑 Testing Domain-Specific API Key Manager...');
        
        const keyManager = new DomainSpecificAPIKeyManager({
            enableUsageTracking: true,
            enableBYOK: true
        });

        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Register a test domain
        await keyManager.registerDomain('example.com', {
            maxKeys: 5,
            enableAutoRotation: true
        });

        // Generate an API key
        const newKey = await keyManager.generateApiKey('example.com', {
            description: 'Test API key',
            permissions: ['read', 'write']
        });

        console.log('🔑 Generated key:', newKey);

        // Validate the key
        const validation = await keyManager.validateApiKey(newKey.apiKey, 'example.com');
        console.log('✅ Validation result:', validation);

        // Record some usage
        await keyManager.recordKeyUsage(newKey.keyId, 'success');
        await keyManager.recordKeyUsage(newKey.keyId, 'error');

        // Generate usage report
        const report = await keyManager.generateUsageReport('example.com');
        console.log('📊 Usage report:', JSON.stringify(report, null, 2));

        // Get system stats
        const stats = keyManager.getSystemStats();
        console.log('📈 System stats:', stats);

        console.log('\n✅ Domain-Specific API Key Manager test complete!');
    }
    
    main().catch(console.error);
}

// Create Express app if running standalone
if (require.main === module) {
    const express = require('express');
    const app = express();
    
    app.use(express.json());
    
    // API Key Management endpoints
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            service: 'Domain-Specific API Key Manager',
            port: 8888,
            timestamp: Date.now(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            description: 'Enterprise API key management with domain isolation'
        });
    });

    app.get('/ready', (req, res) => {
        res.json({
            status: 'ready',
            service: 'Domain-Specific API Key Manager',
            timestamp: Date.now()
        });
    });
    
    // Start server
    app.listen(8888, () => {
        console.log('🔑 Domain-Specific API Key Manager running on port 8888');
    });
}
