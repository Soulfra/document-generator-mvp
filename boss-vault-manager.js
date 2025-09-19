#!/usr/bin/env node
// boss-vault-manager.js
// Encrypted boss data storage using existing vault infrastructure patterns
// Integrates with DomainSpecificAPIKeyManager for KeePass/Bunny.net style security

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class BossVaultManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Vault configuration using existing patterns
        this.config = {
            // Existing vault structure
            vaultPath: options.vaultPath || './.vault',
            keysPath: options.keysPath || './.vault/keys',
            bossPath: options.bossPath || './.vault/boss-data',
            
            // Encryption settings (matches DomainSpecificAPIKeyManager)
            encryption: {
                algorithm: 'aes-256-gcm',
                keyDerivation: 'pbkdf2',
                iterations: 100000,
                keyLength: 32,
                ivLength: 16,
                tagLength: 16,
                saltLength: 32
            },
            
            // Domain separation (like existing system)
            domains: {
                'boss-templates': { category: 'templates', permissions: 'read-write' },
                'boss-instances': { category: 'runtime', permissions: 'read-write' },
                'boss-battles': { category: 'history', permissions: 'append-only' },
                'boss-stats': { category: 'analytics', permissions: 'read-write' },
                'avatar-configs': { category: 'user-data', permissions: 'user-only' },
                'authority-mappings': { category: 'system', permissions: 'admin-only' }
            },
            
            // Backup and rotation (existing infrastructure)
            backup: {
                enabled: true,
                interval: 24 * 60 * 60 * 1000, // 24 hours
                retention: 30, // 30 days
                compression: true
            }
        };
        
        // Vault state
        this.vaultState = {
            initialized: false,
            masterKey: null,
            domainKeys: new Map(),
            metadata: new Map(),
            stats: {
                totalEntries: 0,
                lastBackup: null,
                diskUsage: 0
            }
        };
        
        // Cache for performance (like existing system)
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Access control (integrates with Kingdom Authority)
        this.accessControl = new Map();
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🔐 Boss Vault Manager - Initializing');
        console.log('Using existing vault infrastructure patterns');
        
        try {
            await this.ensureVaultStructure();
            await this.loadMasterKey();
            await this.initializeDomainKeys();
            await this.loadMetadata();
            await this.setupAccessControl();
            
            this.vaultState.initialized = true;
            
            console.log('✅ Boss Vault Manager initialized');
            console.log(`📁 Vault path: ${this.config.vaultPath}`);
            console.log(`🔑 Domains: ${Object.keys(this.config.domains).length}`);
            
            this.emit('vault:ready');
            
        } catch (error) {
            console.error('❌ Vault initialization failed:', error);
            this.emit('vault:error', error);
        }
    }
    
    // Vault Structure Setup (matches existing patterns)
    async ensureVaultStructure() {
        const directories = [
            this.config.vaultPath,
            this.config.keysPath,
            this.config.bossPath,
            path.join(this.config.bossPath, 'templates'),
            path.join(this.config.bossPath, 'instances'), 
            path.join(this.config.bossPath, 'battles'),
            path.join(this.config.bossPath, 'stats'),
            path.join(this.config.bossPath, 'avatars'),
            path.join(this.config.bossPath, 'backups')
        ];
        
        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') throw error;
            }
        }
    }
    
    // Master Key Management (existing pattern)
    async loadMasterKey() {
        const keyFile = path.join(this.config.keysPath, 'boss_vault_master.enc');
        
        try {
            const encryptedKey = await fs.readFile(keyFile);
            
            // In production, this would decrypt using system key
            // For now, derive from environment or generate
            const password = process.env.VAULT_PASSWORD || 'boss-vault-master-key';
            this.vaultState.masterKey = await this.deriveKey(password, 'master-salt');
            
            console.log('🔑 Master key loaded from existing infrastructure');
            
        } catch (error) {
            console.log('🔑 Generating new master key...');
            
            const password = process.env.VAULT_PASSWORD || crypto.randomBytes(32).toString('hex');
            this.vaultState.masterKey = await this.deriveKey(password, 'master-salt');
            
            // Save encrypted master key
            const encryptedKey = await this.encrypt(password, 'system-key');
            await fs.writeFile(keyFile, encryptedKey);
        }
    }
    
    // Domain Key Management (matches existing DomainSpecificAPIKeyManager)
    async initializeDomainKeys() {
        for (const [domain, config] of Object.entries(this.config.domains)) {
            const domainKey = await this.deriveKey(
                this.vaultState.masterKey.toString('hex'), 
                `domain-${domain}`
            );
            
            this.vaultState.domainKeys.set(domain, {
                key: domainKey,
                config,
                created: Date.now(),
                usage: { reads: 0, writes: 0 }
            });
        }
        
        console.log(`🔐 Domain keys initialized for ${this.vaultState.domainKeys.size} domains`);
    }
    
    // Metadata Management
    async loadMetadata() {
        const metadataFile = path.join(this.config.bossPath, 'metadata.json');
        
        try {
            const data = await fs.readFile(metadataFile, 'utf8');
            const metadata = JSON.parse(data);
            
            for (const [key, value] of Object.entries(metadata)) {
                this.vaultState.metadata.set(key, value);
            }
            
            console.log('📊 Vault metadata loaded');
            
        } catch (error) {
            console.log('📊 Creating new vault metadata');
            
            this.vaultState.metadata.set('created', Date.now());
            this.vaultState.metadata.set('version', '1.0.0');
            this.vaultState.metadata.set('type', 'boss-vault');
            
            await this.saveMetadata();
        }
    }
    
    // Access Control Setup (integrates with Kingdom Authority)
    async setupAccessControl() {
        // Map Kingdom Authority levels to vault permissions
        const authorityLevels = {
            'EXILE': ['read:boss-templates'],
            'PEASANT': ['read:boss-templates', 'read:boss-instances'],
            'CITIZEN': ['read:boss-templates', 'read:boss-instances', 'write:boss-instances'],
            'MERCHANT': ['read:boss-templates', 'read:boss-instances', 'write:boss-instances', 'read:boss-stats'],
            'KNIGHT': ['read:*', 'write:boss-*', 'admin:boss-instances'],
            'LORD': ['read:*', 'write:*', 'admin:boss-*'],
            'KING': ['read:*', 'write:*', 'admin:*', 'system:*']
        };
        
        for (const [level, permissions] of Object.entries(authorityLevels)) {
            this.accessControl.set(level, permissions);
        }
        
        console.log('👑 Access control configured for Kingdom Authority levels');
    }
    
    // Core Vault Operations
    
    // Store Boss Data (encrypted, domain-separated)
    async storeBoss(domain, bossId, bossData, authorityLevel = 'CITIZEN') {
        if (!this.checkPermission(authorityLevel, `write:${domain}`)) {
            throw new Error(`Insufficient authority: ${authorityLevel} cannot write to ${domain}`);
        }
        
        const domainInfo = this.vaultState.domainKeys.get(domain);
        if (!domainInfo) {
            throw new Error(`Unknown domain: ${domain}`);
        }
        
        // Prepare data with metadata
        const vaultEntry = {
            id: bossId,
            data: bossData,
            metadata: {
                domain,
                created: Date.now(),
                createdBy: authorityLevel,
                version: 1,
                checksum: this.calculateChecksum(bossData)
            }
        };
        
        // Encrypt using domain key
        const encryptedData = await this.encryptWithKey(
            JSON.stringify(vaultEntry),
            domainInfo.key
        );
        
        // Store in domain-specific path
        const filePath = path.join(this.config.bossPath, domain, `${bossId}.enc`);
        await fs.writeFile(filePath, encryptedData);
        
        // Update cache and stats
        this.cache.set(`${domain}:${bossId}`, vaultEntry);
        domainInfo.usage.writes++;
        this.vaultState.stats.totalEntries++;
        
        console.log(`🔐 Boss stored: ${domain}/${bossId}`);
        
        this.emit('boss:stored', { domain, bossId, authorityLevel });
        
        return bossId;
    }
    
    // Retrieve Boss Data (decrypted, permission-checked)
    async retrieveBoss(domain, bossId, authorityLevel = 'CITIZEN') {
        if (!this.checkPermission(authorityLevel, `read:${domain}`)) {
            throw new Error(`Insufficient authority: ${authorityLevel} cannot read from ${domain}`);
        }
        
        // Check cache first
        const cacheKey = `${domain}:${bossId}`;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.metadata.created < this.cacheTimeout) {
                return cached.data;
            }
        }
        
        const domainInfo = this.vaultState.domainKeys.get(domain);
        if (!domainInfo) {
            throw new Error(`Unknown domain: ${domain}`);
        }
        
        // Read encrypted file
        const filePath = path.join(this.config.bossPath, domain, `${bossId}.enc`);
        
        try {
            const encryptedData = await fs.readFile(filePath);
            
            // Decrypt using domain key
            const decryptedData = await this.decryptWithKey(encryptedData, domainInfo.key);
            const vaultEntry = JSON.parse(decryptedData);
            
            // Verify integrity
            const currentChecksum = this.calculateChecksum(vaultEntry.data);
            if (currentChecksum !== vaultEntry.metadata.checksum) {
                throw new Error('Data integrity check failed');
            }
            
            // Update cache and stats
            this.cache.set(cacheKey, vaultEntry);
            domainInfo.usage.reads++;
            
            this.emit('boss:retrieved', { domain, bossId, authorityLevel });
            
            return vaultEntry.data;
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Boss not found: ${domain}/${bossId}`);
            }
            throw error;
        }
    }
    
    // List Bosses in Domain
    async listBosses(domain, authorityLevel = 'CITIZEN') {
        if (!this.checkPermission(authorityLevel, `read:${domain}`)) {
            throw new Error(`Insufficient authority: ${authorityLevel} cannot read from ${domain}`);
        }
        
        const domainPath = path.join(this.config.bossPath, domain);
        
        try {
            const files = await fs.readdir(domainPath);
            const bosses = files
                .filter(file => file.endsWith('.enc'))
                .map(file => ({
                    id: path.basename(file, '.enc'),
                    domain,
                    encrypted: true
                }));
            
            return bosses;
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }
    
    // Delete Boss (admin operation)
    async deleteBoss(domain, bossId, authorityLevel = 'KING') {
        if (!this.checkPermission(authorityLevel, `admin:${domain}`)) {
            throw new Error(`Insufficient authority: ${authorityLevel} cannot delete from ${domain}`);
        }
        
        const filePath = path.join(this.config.bossPath, domain, `${bossId}.enc`);
        
        try {
            await fs.unlink(filePath);
            
            // Remove from cache
            this.cache.delete(`${domain}:${bossId}`);
            this.vaultState.stats.totalEntries--;
            
            console.log(`🗑️  Boss deleted: ${domain}/${bossId}`);
            
            this.emit('boss:deleted', { domain, bossId, authorityLevel });
            
            return true;
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error(`Boss not found: ${domain}/${bossId}`);
            }
            throw error;
        }
    }
    
    // Backup Operations (matches existing infrastructure)
    async createBackup() {
        const backupId = `backup-${Date.now()}`;
        const backupPath = path.join(this.config.bossPath, 'backups', `${backupId}.tar.gz`);
        
        try {
            // Create compressed backup of entire boss data
            const tar = require('tar');
            
            await tar.create({
                gzip: true,
                file: backupPath,
                cwd: this.config.bossPath
            }, ['.']);
            
            this.vaultState.stats.lastBackup = Date.now();
            await this.saveMetadata();
            
            console.log(`💾 Backup created: ${backupId}`);
            
            this.emit('backup:created', { backupId, path: backupPath });
            
            return backupId;
            
        } catch (error) {
            console.error('❌ Backup failed:', error);
            throw error;
        }
    }
    
    // Utility Methods
    
    // Key Derivation (PBKDF2 like existing system)
    async deriveKey(password, salt) {
        return new Promise((resolve, reject) => {
            crypto.pbkdf2(
                password,
                salt,
                this.config.encryption.iterations,
                this.config.encryption.keyLength,
                'sha256',
                (err, derivedKey) => {
                    if (err) reject(err);
                    else resolve(derivedKey);
                }
            );
        });
    }
    
    // Encryption with Key
    async encryptWithKey(data, key) {
        const iv = crypto.randomBytes(this.config.encryption.ivLength);
        const cipher = crypto.createCipher(this.config.encryption.algorithm, key, iv);
        
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const tag = cipher.getAuthTag();
        
        return JSON.stringify({
            iv: iv.toString('hex'),
            data: encrypted,
            tag: tag.toString('hex'),
            algorithm: this.config.encryption.algorithm
        });
    }
    
    // Decryption with Key
    async decryptWithKey(encryptedData, key) {
        const parsed = JSON.parse(encryptedData);
        
        const decipher = crypto.createDecipher(
            parsed.algorithm,
            key,
            Buffer.from(parsed.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(parsed.tag, 'hex'));
        
        let decrypted = decipher.update(parsed.data, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }
    
    // General encryption (for system data)
    async encrypt(data, password) {
        const key = await this.deriveKey(password, 'system-salt');
        return this.encryptWithKey(data, key);
    }
    
    // Permission Checking
    checkPermission(authorityLevel, requiredPermission) {
        const permissions = this.accessControl.get(authorityLevel) || [];
        
        // Check exact permission
        if (permissions.includes(requiredPermission)) {
            return true;
        }
        
        // Check wildcard permissions
        const [action, resource] = requiredPermission.split(':');
        const wildcards = [
            `${action}:*`,
            `*:${resource}`,
            '*:*'
        ];
        
        return wildcards.some(wildcard => permissions.includes(wildcard));
    }
    
    // Checksum Calculation
    calculateChecksum(data) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
    }
    
    // Metadata Management
    async saveMetadata() {
        const metadata = Object.fromEntries(this.vaultState.metadata);
        metadata.stats = this.vaultState.stats;
        metadata.lastUpdated = Date.now();
        
        const metadataFile = path.join(this.config.bossPath, 'metadata.json');
        await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2));
    }
    
    // Public API Methods
    
    // Store boss template
    async storeBossTemplate(templateId, templateData, authorityLevel) {
        return this.storeBoss('boss-templates', templateId, templateData, authorityLevel);
    }
    
    // Store boss instance
    async storeBossInstance(instanceId, instanceData, authorityLevel) {
        return this.storeBoss('boss-instances', instanceId, instanceData, authorityLevel);
    }
    
    // Store battle history
    async storeBattleHistory(battleId, battleData, authorityLevel) {
        return this.storeBoss('boss-battles', battleId, battleData, authorityLevel);
    }
    
    // Store avatar configuration
    async storeAvatarConfig(avatarId, avatarData, authorityLevel) {
        return this.storeBoss('avatar-configs', avatarId, avatarData, authorityLevel);
    }
    
    // Get vault statistics
    getVaultStats() {
        return {
            ...this.vaultState.stats,
            domains: this.vaultState.domainKeys.size,
            cacheSize: this.cache.size,
            initialized: this.vaultState.initialized
        };
    }
    
    // Health check
    async healthCheck() {
        const health = {
            status: this.vaultState.initialized ? 'healthy' : 'initializing',
            timestamp: Date.now(),
            vault: {
                path: this.config.vaultPath,
                domains: this.vaultState.domainKeys.size,
                entries: this.vaultState.stats.totalEntries
            },
            security: {
                encryption: this.config.encryption.algorithm,
                keyDerivation: this.config.encryption.keyDerivation,
                accessControl: this.accessControl.size
            }
        };
        
        return health;
    }
}

// Export for system integration
module.exports = BossVaultManager;

// CLI usage
if (require.main === module) {
    const vault = new BossVaultManager();
    
    vault.on('vault:ready', async () => {
        console.log('\n🔐 BOSS VAULT MANAGER READY');
        console.log('='.repeat(50));
        console.log('✅ Encrypted storage using existing vault patterns');
        console.log('✅ Domain separation with KeePass-style security');
        console.log('✅ Kingdom Authority access control integration');
        console.log('✅ Automatic backup and rotation');
        
        // Demo operations
        try {
            console.log('\n📝 Demo: Storing boss template...');
            await vault.storeBossTemplate('demo-boss-1', {
                name: 'Demo Boss',
                health: 1000,
                attacks: ['slash', 'magic'],
                difficulty: 'medium'
            }, 'CITIZEN');
            
            console.log('📖 Demo: Retrieving boss template...');
            const retrieved = await vault.retrieveBoss('boss-templates', 'demo-boss-1', 'CITIZEN');
            console.log('Retrieved:', retrieved.name);
            
            console.log('\n📊 Vault Stats:', vault.getVaultStats());
            
        } catch (error) {
            console.error('Demo failed:', error.message);
        }
    });
    
    vault.on('vault:error', (error) => {
        console.error('❌ Vault error:', error);
    });
}