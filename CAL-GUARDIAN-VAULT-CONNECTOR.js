#!/usr/bin/env node
/**
 * 🛡️🔐 CAL GUARDIAN VAULT CONNECTOR
 * Secure storage interface for Guardian decisions with linear processing
 * Implements "no recursion in vaults" architecture principle
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class CalGuardianVaultConnector extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Vault configuration
            vaultDir: process.env.VAULT_DIR || './.vault/guardian',
            backupDir: process.env.BACKUP_DIR || './.vault/backups/guardian',
            
            // Storage layers (linear, no recursion)
            layers: {
                decisions: 'decisions',       // Guardian approval decisions
                proofs: 'proofs',            // Cryptographic proof chains
                audit: 'audit',              // Audit trail
                metadata: 'metadata',        // System metadata
                snapshots: 'snapshots'       // Point-in-time snapshots
            },
            
            // Encryption settings
            encryption: {
                algorithm: 'aes-256-gcm',
                keyLength: 32,
                ivLength: 16,
                tagLength: 16
            },
            
            // Guardian connection
            guardianPort: process.env.GUARDIAN_WS_PORT || 8082,
            guardianHost: process.env.GUARDIAN_HOST || 'localhost',
            
            // Storage policies (linear processing only)
            maxStorageSize: 10 * 1024 * 1024 * 1024, // 10GB
            compressionEnabled: true,
            retentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
            autoArchive: true,
            
            // Security policies
            enableIntegrityChecks: true,
            enableEncryption: true,
            requireSignatures: true,
            
            ...config
        };
        
        // Storage state (flat structure, no nested recursion)
        this.storageCache = new Map();
        this.integrityHashes = new Map();
        this.accessLog = [];
        this.compressionStats = new Map();
        
        // Encryption keys
        this.masterKey = null;
        this.activeKeys = new Map();
        
        // Connection state
        this.guardianConnection = null;
        this.isInitialized = false;
        
        console.log('🔐 Guardian Vault Connector initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Create vault directory structure (linear hierarchy)
            await this.createVaultStructure();
            
            // Initialize encryption system
            await this.initializeEncryption();
            
            // Load existing vault data
            await this.loadVaultData();
            
            // Connect to Guardian system
            await this.connectToGuardian();
            
            // Start maintenance processes
            this.startMaintenanceProcesses();
            
            this.isInitialized = true;
            console.log('✅ Guardian Vault Connector initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Vault Connector:', error.message);
            throw error;
        }
    }
    
    // ==================== VAULT STRUCTURE (LINEAR) ====================
    
    async createVaultStructure() {
        console.log('📁 Creating vault structure...');
        
        // Create main directories (flat structure, no recursion)
        await this.ensureDirectory(this.config.vaultDir);
        await this.ensureDirectory(this.config.backupDir);
        
        // Create layer directories (linear structure)
        for (const layer of Object.values(this.config.layers)) {
            await this.ensureDirectory(path.join(this.config.vaultDir, layer));
        }
        
        // Create utility directories
        const utilDirs = ['keys', 'temp', 'exports', 'imports'];
        for (const dir of utilDirs) {
            await this.ensureDirectory(path.join(this.config.vaultDir, dir));
        }
    }
    
    // ==================== ENCRYPTION SYSTEM ====================
    
    async initializeEncryption() {
        console.log('🔐 Initializing encryption system...');
        
        const masterKeyPath = path.join(this.config.vaultDir, 'keys', 'master.key');
        
        try {
            // Try to load existing master key
            const keyData = await fs.readFile(masterKeyPath, 'utf8');
            const parsedKey = JSON.parse(keyData);
            this.masterKey = Buffer.from(parsedKey.key, 'hex');
        } catch (error) {
            // Generate new master key
            this.masterKey = crypto.randomBytes(this.config.encryption.keyLength);
            
            const keyData = {
                key: this.masterKey.toString('hex'),
                algorithm: this.config.encryption.algorithm,
                created: new Date().toISOString(),
                version: '1.0'
            };
            
            await fs.writeFile(masterKeyPath, JSON.stringify(keyData, null, 2), { mode: 0o600 });
            console.log('🔑 Generated new master key');
        }
        
        // Generate session keys for each layer (linear key derivation)
        for (const [layerName, layerDir] of Object.entries(this.config.layers)) {
            const layerKey = this.deriveLayerKey(layerName);
            this.activeKeys.set(layerName, layerKey);
        }
    }
    
    deriveLayerKey(layerName) {
        // Linear key derivation (no recursive key generation)
        return crypto.pbkdf2Sync(
            this.masterKey,
            layerName,
            100000,
            this.config.encryption.keyLength,
            'sha256'
        );
    }
    
    // ==================== GUARDIAN CONNECTION ====================
    
    async connectToGuardian() {
        return new Promise((resolve, reject) => {
            console.log(`🔌 Connecting to Guardian at localhost:${this.config.guardianPort}...`);
            
            const WebSocket = require('ws');
            this.guardianConnection = new WebSocket(`ws://${this.config.guardianHost}:${this.config.guardianPort}`);
            
            this.guardianConnection.on('open', () => {
                console.log('✅ Connected to Guardian system');
                
                // Identify as vault connector
                this.guardianConnection.send(JSON.stringify({
                    type: 'identify',
                    identity: {
                        system: 'vault-connector',
                        version: '1.0.0',
                        capabilities: ['secure-storage', 'proof-generation', 'audit-trail']
                    }
                }));
                
                resolve();
            });
            
            this.guardianConnection.on('message', (data) => {
                this.handleGuardianMessage(JSON.parse(data));
            });
            
            this.guardianConnection.on('close', () => {
                console.log('🔌 Guardian connection closed');
                setTimeout(() => this.connectToGuardian(), 3000);
            });
            
            this.guardianConnection.on('error', (error) => {
                console.error('❌ Guardian connection error:', error.message);
                reject(error);
            });
        });
    }
    
    handleGuardianMessage(message) {
        try {
            switch (message.type) {
                case 'store-decision':
                    this.handleStoreDecision(message.data);
                    break;
                    
                case 'store-proof':
                    this.handleStoreProof(message.data);
                    break;
                    
                case 'audit-request':
                    this.handleAuditRequest(message.data);
                    break;
                    
                case 'backup-request':
                    this.handleBackupRequest(message.data);
                    break;
                    
                default:
                    console.log(`📨 Unknown Guardian message: ${message.type}`);
            }
        } catch (error) {
            console.error('❌ Error handling Guardian message:', error.message);
        }
    }
    
    handleStoreDecision(data) {
        const { approvalId, decision, context, timestamp } = data;
        
        this.storeSecurely('decisions', approvalId, {
            approvalId,
            decision,
            context,
            timestamp,
            storedAt: new Date().toISOString()
        });
        
        console.log(`💾 Stored decision: ${approvalId}`);
    }
    
    handleStoreProof(data) {
        const { proofId, signature, blockHash, previousHash } = data;
        
        this.storeSecurely('proofs', proofId, {
            proofId,
            signature,
            blockHash,
            previousHash,
            timestamp: new Date().toISOString()
        });
        
        console.log(`🔒 Stored proof: ${proofId}`);
    }
    
    handleAuditRequest(data) {
        const { requestId, criteria, requester } = data;
        
        // Generate audit report (linear processing, no recursion)
        this.generateAuditReport(requestId, criteria).then(report => {
            // Send report back to Guardian
            if (this.guardianConnection && this.guardianConnection.readyState === 1) {
                this.guardianConnection.send(JSON.stringify({
                    type: 'audit-response',
                    requestId,
                    report
                }));
            }
        }).catch(error => {
            console.error('❌ Error generating audit report:', error.message);
        });
    }
    
    handleBackupRequest(data) {
        const { backupId, layers } = data;
        
        this.performBackup(backupId, layers).then(() => {
            console.log(`💾 Backup completed: ${backupId}`);
        }).catch(error => {
            console.error('❌ Backup failed:', error.message);
        });
    }
    
    // ==================== STORAGE OPERATIONS (LINEAR) ====================
    
    async storeSecurely(layer, itemId, data) {
        if (!this.config.layers[layer]) {
            throw new Error(`Invalid storage layer: ${layer}`);
        }
        
        const layerPath = path.join(this.config.vaultDir, this.config.layers[layer]);
        const itemPath = path.join(layerPath, `${itemId}.enc`);
        
        // Linear processing pipeline (no recursion)
        const processedData = await this.processDataLinear(data);
        const encryptedData = await this.encryptData(processedData, layer);
        const compressedData = this.config.compressionEnabled 
            ? await this.compressData(encryptedData)
            : encryptedData;
        
        // Generate integrity hash
        const integrityHash = this.generateIntegrityHash(compressedData);
        
        const storagePackage = {
            data: compressedData,
            integrity: integrityHash,
            metadata: {
                layer,
                itemId,
                timestamp: new Date().toISOString(),
                compressed: this.config.compressionEnabled,
                encrypted: true
            }
        };
        
        await fs.writeFile(itemPath, JSON.stringify(storagePackage));
        
        // Update cache (linear structure)
        this.storageCache.set(`${layer}:${itemId}`, data);
        this.integrityHashes.set(`${layer}:${itemId}`, integrityHash);
        
        // Log access (linear log, no nested structures)
        this.logAccess('write', layer, itemId);
        
        return itemPath;
    }
    
    async retrieveSecurely(layer, itemId) {
        if (!this.config.layers[layer]) {
            throw new Error(`Invalid storage layer: ${layer}`);
        }
        
        // Check cache first (linear lookup)
        const cacheKey = `${layer}:${itemId}`;
        if (this.storageCache.has(cacheKey)) {
            this.logAccess('read_cache', layer, itemId);
            return this.storageCache.get(cacheKey);
        }
        
        const layerPath = path.join(this.config.vaultDir, this.config.layers[layer]);
        const itemPath = path.join(layerPath, `${itemId}.enc`);
        
        try {
            const storagePackage = JSON.parse(await fs.readFile(itemPath, 'utf8'));
            
            // Verify integrity (linear check)
            if (this.config.enableIntegrityChecks) {
                const expectedHash = this.generateIntegrityHash(storagePackage.data);
                if (expectedHash !== storagePackage.integrity) {
                    throw new Error('Integrity check failed');
                }
            }
            
            // Linear processing pipeline (reverse of storage)
            let processedData = storagePackage.data;
            
            if (storagePackage.metadata.compressed) {
                processedData = await this.decompressData(processedData);
            }
            
            if (storagePackage.metadata.encrypted) {
                processedData = await this.decryptData(processedData, layer);
            }
            
            const originalData = await this.unprocessDataLinear(processedData);
            
            // Update cache
            this.storageCache.set(cacheKey, originalData);
            
            // Log access
            this.logAccess('read_disk', layer, itemId);
            
            return originalData;
            
        } catch (error) {
            console.error(`❌ Failed to retrieve ${layer}:${itemId}:`, error.message);
            throw error;
        }
    }
    
    // ==================== DATA PROCESSING (LINEAR) ====================
    
    async processDataLinear(data) {
        // Linear data processing (no recursive operations)
        
        // Step 1: Validate data structure
        this.validateDataStructure(data);
        
        // Step 2: Sanitize data (flat operation)
        const sanitized = this.sanitizeData(data);
        
        // Step 3: Add metadata (flat addition)
        const withMetadata = {
            ...sanitized,
            _vault_meta: {
                processed: true,
                processingTime: new Date().toISOString(),
                version: '1.0'
            }
        };
        
        return withMetadata;
    }
    
    async unprocessDataLinear(data) {
        // Linear data unprocessing (no recursive operations)
        
        // Step 1: Remove vault metadata
        const { _vault_meta, ...cleanData } = data;
        
        // Step 2: Validate structure
        this.validateDataStructure(cleanData);
        
        return cleanData;
    }
    
    validateDataStructure(data) {
        // Linear validation (no recursive traversal)
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data structure');
        }
        
        // Check for prohibited recursive structures
        if (this.hasCircularReferences(data)) {
            throw new Error('Circular references not allowed in vault storage');
        }
    }
    
    hasCircularReferences(obj) {
        // Simple circular reference detection (linear)
        const seen = new Set();
        
        function check(current) {
            if (current === null || typeof current !== 'object') {
                return false;
            }
            
            if (seen.has(current)) {
                return true; // Circular reference found
            }
            
            seen.add(current);
            
            // Check immediate properties only (no deep recursion)
            for (const key in current) {
                if (current.hasOwnProperty(key) && typeof current[key] === 'object') {
                    if (seen.has(current[key])) {
                        return true;
                    }
                }
            }
            
            return false;
        }
        
        return check(obj);
    }
    
    sanitizeData(data) {
        // Linear sanitization (no recursive cleaning)
        const sanitized = {};
        
        for (const [key, value] of Object.entries(data)) {
            // Simple key/value sanitization
            if (typeof key === 'string' && key.length > 0 && !key.startsWith('_system')) {
                if (value !== undefined && value !== null) {
                    sanitized[key] = value;
                }
            }
        }
        
        return sanitized;
    }
    
    // ==================== ENCRYPTION (LINEAR) ====================
    
    async encryptData(data, layer) {
        if (!this.config.enableEncryption) {
            return data;
        }
        
        const layerKey = this.activeKeys.get(layer);
        if (!layerKey) {
            throw new Error(`No encryption key for layer: ${layer}`);
        }
        
        const iv = crypto.randomBytes(this.config.encryption.ivLength);
        const cipher = crypto.createCipher(this.config.encryption.algorithm, layerKey, iv);
        
        const dataString = JSON.stringify(data);
        let encrypted = cipher.update(dataString, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            tag: authTag.toString('hex'),
            algorithm: this.config.encryption.algorithm
        };
    }
    
    async decryptData(encryptedData, layer) {
        if (!this.config.enableEncryption) {
            return encryptedData;
        }
        
        const layerKey = this.activeKeys.get(layer);
        if (!layerKey) {
            throw new Error(`No decryption key for layer: ${layer}`);
        }
        
        const decipher = crypto.createDecipher(
            encryptedData.algorithm,
            layerKey,
            Buffer.from(encryptedData.iv, 'hex')
        );
        
        decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }
    
    // ==================== COMPRESSION ====================
    
    async compressData(data) {
        const zlib = require('zlib');
        const dataString = JSON.stringify(data);
        
        return new Promise((resolve, reject) => {
            zlib.gzip(dataString, (error, compressed) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(compressed.toString('base64'));
                }
            });
        });
    }
    
    async decompressData(compressedData) {
        const zlib = require('zlib');
        const buffer = Buffer.from(compressedData, 'base64');
        
        return new Promise((resolve, reject) => {
            zlib.gunzip(buffer, (error, decompressed) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(JSON.parse(decompressed.toString('utf8')));
                }
            });
        });
    }
    
    // ==================== INTEGRITY & AUDIT ====================
    
    generateIntegrityHash(data) {
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        return crypto.createHash('sha256').update(dataString).digest('hex');
    }
    
    logAccess(operation, layer, itemId) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            operation,
            layer,
            itemId,
            sessionId: process.pid
        };
        
        this.accessLog.push(logEntry);
        
        // Keep log size manageable (linear cleanup)
        if (this.accessLog.length > 10000) {
            this.accessLog.splice(0, 1000); // Remove oldest 1000 entries
        }
    }
    
    async generateAuditReport(requestId, criteria) {
        const report = {
            requestId,
            generatedAt: new Date().toISOString(),
            criteria,
            summary: {
                totalItems: 0,
                itemsByLayer: {},
                accessStats: {},
                integrityStatus: 'verified'
            },
            items: []
        };
        
        // Linear audit processing (no recursive analysis)
        for (const [layer, layerDir] of Object.entries(this.config.layers)) {
            const layerPath = path.join(this.config.vaultDir, layerDir);
            
            try {
                const files = await fs.readdir(layerPath);
                const layerItems = files.filter(f => f.endsWith('.enc'));
                
                report.summary.totalItems += layerItems.length;
                report.summary.itemsByLayer[layer] = layerItems.length;
                
                // Sample items for audit (linear sampling)
                const sampleSize = Math.min(5, layerItems.length);
                const sampledItems = layerItems.slice(0, sampleSize);
                
                for (const itemFile of sampledItems) {
                    const itemId = itemFile.replace('.enc', '');
                    
                    try {
                        const itemPath = path.join(layerPath, itemFile);
                        const stats = await fs.stat(itemPath);
                        
                        report.items.push({
                            layer,
                            itemId,
                            size: stats.size,
                            created: stats.ctime,
                            modified: stats.mtime,
                            integrityVerified: this.integrityHashes.has(`${layer}:${itemId}`)
                        });
                    } catch (error) {
                        console.warn(`Audit warning for ${layer}:${itemId}:`, error.message);
                    }
                }
            } catch (error) {
                console.warn(`Failed to audit layer ${layer}:`, error.message);
            }
        }
        
        // Access statistics (linear aggregation)
        const accessStats = {};
        for (const logEntry of this.accessLog) {
            const key = logEntry.operation;
            accessStats[key] = (accessStats[key] || 0) + 1;
        }
        report.summary.accessStats = accessStats;
        
        return report;
    }
    
    // ==================== BACKUP OPERATIONS ====================
    
    async performBackup(backupId, layers = null) {
        const layersToBackup = layers || Object.keys(this.config.layers);
        const backupDir = path.join(this.config.backupDir, backupId);
        
        await this.ensureDirectory(backupDir);
        
        const manifest = {
            backupId,
            timestamp: new Date().toISOString(),
            layers: layersToBackup,
            items: {}
        };
        
        // Linear backup processing (no recursive copying)
        for (const layer of layersToBackup) {
            const sourceDir = path.join(this.config.vaultDir, this.config.layers[layer]);
            const targetDir = path.join(backupDir, layer);
            
            await this.ensureDirectory(targetDir);
            
            try {
                const files = await fs.readdir(sourceDir);
                const itemFiles = files.filter(f => f.endsWith('.enc'));
                
                manifest.items[layer] = itemFiles.length;
                
                // Copy files (linear operation)
                for (const file of itemFiles) {
                    const sourcePath = path.join(sourceDir, file);
                    const targetPath = path.join(targetDir, file);
                    await fs.copyFile(sourcePath, targetPath);
                }
                
                console.log(`📦 Backed up ${itemFiles.length} items from ${layer}`);
                
            } catch (error) {
                console.error(`❌ Failed to backup layer ${layer}:`, error.message);
                manifest.items[layer] = 0;
            }
        }
        
        // Save backup manifest
        await fs.writeFile(
            path.join(backupDir, 'manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
        
        console.log(`✅ Backup ${backupId} completed`);
    }
    
    // ==================== MAINTENANCE PROCESSES ====================
    
    startMaintenanceProcesses() {
        // Cleanup old cache entries (every 5 minutes)
        setInterval(() => {
            this.performCacheCleanup();
        }, 5 * 60 * 1000);
        
        // Check storage usage (every hour)
        setInterval(() => {
            this.checkStorageUsage();
        }, 60 * 60 * 1000);
        
        // Archive old data (daily)
        setInterval(() => {
            this.performArchival();
        }, 24 * 60 * 60 * 1000);
    }
    
    performCacheCleanup() {
        const maxCacheSize = 1000;
        
        if (this.storageCache.size > maxCacheSize) {
            // Remove oldest cache entries (linear cleanup)
            const entries = Array.from(this.storageCache.entries());
            const toRemove = entries.slice(0, entries.length - maxCacheSize);
            
            for (const [key] of toRemove) {
                this.storageCache.delete(key);
            }
            
            console.log(`🧹 Cleaned up ${toRemove.length} cache entries`);
        }
    }
    
    async checkStorageUsage() {
        let totalSize = 0;
        
        for (const layerDir of Object.values(this.config.layers)) {
            const layerPath = path.join(this.config.vaultDir, layerDir);
            
            try {
                const files = await fs.readdir(layerPath);
                
                for (const file of files) {
                    const filePath = path.join(layerPath, file);
                    const stats = await fs.stat(filePath);
                    totalSize += stats.size;
                }
            } catch (error) {
                console.warn(`Warning checking storage for ${layerDir}:`, error.message);
            }
        }
        
        if (totalSize > this.config.maxStorageSize) {
            console.warn(`⚠️ Storage usage exceeds limit: ${(totalSize / 1024 / 1024 / 1024).toFixed(2)}GB`);
            
            // Request cleanup from Guardian
            if (this.guardianConnection && this.guardianConnection.readyState === 1) {
                this.guardianConnection.send(JSON.stringify({
                    type: 'storage-alert',
                    currentSize: totalSize,
                    maxSize: this.config.maxStorageSize,
                    usagePercent: (totalSize / this.config.maxStorageSize) * 100
                }));
            }
        }
    }
    
    async performArchival() {
        if (!this.config.autoArchive) return;
        
        const cutoffDate = new Date(Date.now() - this.config.retentionPeriod);
        console.log(`📚 Archiving data older than ${cutoffDate.toISOString()}`);
        
        // Linear archival process (no recursive directory traversal)
        for (const [layer, layerDir] of Object.entries(this.config.layers)) {
            const layerPath = path.join(this.config.vaultDir, layerDir);
            
            try {
                const files = await fs.readdir(layerPath);
                let archivedCount = 0;
                
                for (const file of files) {
                    const filePath = path.join(layerPath, file);
                    const stats = await fs.stat(filePath);
                    
                    if (stats.mtime < cutoffDate) {
                        // Archive to backup location
                        const archivePath = path.join(
                            this.config.backupDir,
                            'archive',
                            layer,
                            file
                        );
                        
                        await this.ensureDirectory(path.dirname(archivePath));
                        await fs.rename(filePath, archivePath);
                        
                        archivedCount++;
                    }
                }
                
                if (archivedCount > 0) {
                    console.log(`📚 Archived ${archivedCount} items from ${layer}`);
                }
            } catch (error) {
                console.warn(`Warning during archival of ${layer}:`, error.message);
            }
        }
    }
    
    // ==================== VAULT DATA LOADING ====================
    
    async loadVaultData() {
        console.log('📖 Loading existing vault data...');
        
        let loadedItems = 0;
        
        for (const [layer, layerDir] of Object.entries(this.config.layers)) {
            const layerPath = path.join(this.config.vaultDir, layerDir);
            
            try {
                const files = await fs.readdir(layerPath);
                const itemFiles = files.filter(f => f.endsWith('.enc'));
                
                // Load file metadata only (not full content) for performance
                for (const file of itemFiles) {
                    const itemId = file.replace('.enc', '');
                    const filePath = path.join(layerPath, file);
                    
                    try {
                        const stats = await fs.stat(filePath);
                        const storagePackage = JSON.parse(await fs.readFile(filePath, 'utf8'));
                        
                        // Cache integrity hash
                        this.integrityHashes.set(`${layer}:${itemId}`, storagePackage.integrity);
                        loadedItems++;
                    } catch (error) {
                        console.warn(`Warning loading ${layer}:${itemId}:`, error.message);
                    }
                }
            } catch (error) {
                // Layer directory doesn't exist yet
                console.log(`Creating layer directory: ${layer}`);
            }
        }
        
        console.log(`📖 Loaded metadata for ${loadedItems} vault items`);
    }
    
    // ==================== UTILITY METHODS ====================
    
    async ensureDirectory(dir) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') throw error;
        }
    }
    
    // ==================== API METHODS ====================
    
    // Store a Guardian decision
    async storeDecision(approvalId, decision, context) {
        return this.storeSecurely('decisions', approvalId, {
            approvalId,
            decision,
            context,
            timestamp: new Date().toISOString()
        });
    }
    
    // Store a cryptographic proof
    async storeProof(proofId, proofData) {
        return this.storeSecurely('proofs', proofId, {
            proofId,
            ...proofData,
            timestamp: new Date().toISOString()
        });
    }
    
    // Store audit trail entry
    async storeAuditEntry(entryId, auditData) {
        return this.storeSecurely('audit', entryId, {
            entryId,
            ...auditData,
            timestamp: new Date().toISOString()
        });
    }
    
    // Retrieve data by layer and ID
    async retrieveData(layer, itemId) {
        return this.retrieveSecurely(layer, itemId);
    }
    
    // Get vault statistics
    getVaultStats() {
        return {
            initialized: this.isInitialized,
            cacheSize: this.storageCache.size,
            integrityHashes: this.integrityHashes.size,
            accessLogEntries: this.accessLog.length,
            activeKeys: this.activeKeys.size,
            layers: Object.keys(this.config.layers),
            memoryUsage: process.memoryUsage()
        };
    }
    
    // ==================== CLEANUP ====================
    
    async shutdown() {
        console.log('🛑 Shutting down Guardian Vault Connector...');
        
        // Close Guardian connection
        if (this.guardianConnection) {
            this.guardianConnection.close();
        }
        
        // Clear sensitive data from memory (linear cleanup)
        this.storageCache.clear();
        this.integrityHashes.clear();
        this.activeKeys.clear();
        
        if (this.masterKey) {
            this.masterKey.fill(0);
            this.masterKey = null;
        }
        
        console.log('✅ Guardian Vault Connector shut down');
    }
}

// Export for use in other modules
module.exports = CalGuardianVaultConnector;

// CLI testing
if (require.main === module) {
    const vaultConnector = new CalGuardianVaultConnector();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        await vaultConnector.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await vaultConnector.shutdown();
        process.exit(0);
    });
}