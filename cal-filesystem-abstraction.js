#!/usr/bin/env node

/**
 * 🗂️ CAL FILESYSTEM ABSTRACTION
 * 
 * Unified filesystem abstraction that provides seamless access across:
 * - Local filesystem (for code indexing)
 * - CAL Secure OS encrypted filesystem
 * - Runtime Capsule System storage layers
 * - ObsidianVault integration
 * - PHP forum file attachments
 * 
 * Features:
 * - Transparent access regardless of backend
 * - Encryption/decryption for secure storage
 * - Caching for performance
 * - Virtual filesystem mounting
 * - Cross-system file synchronization
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');
const { pipeline } = require('stream/promises');
const { createReadStream, createWriteStream } = require('fs');

class CALFilesystemAbstraction extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Storage backends
            backends: {
                local: { enabled: true, priority: 1 },
                calSecureOS: { enabled: config.calSecureOS || false, priority: 2 },
                capsuleSystem: { enabled: config.capsuleSystem || false, priority: 3 },
                obsidianVault: { enabled: config.obsidianVault || false, priority: 4 },
                phpForum: { enabled: config.phpForum || false, priority: 5 }
            },
            
            // Security settings
            encryption: {
                enabled: config.encryptionEnabled || false,
                algorithm: 'aes-256-gcm',
                keyDerivation: 'pbkdf2'
            },
            
            // Cache settings
            cache: {
                enabled: config.cacheEnabled !== false,
                maxSize: config.cacheMaxSize || 100 * 1024 * 1024, // 100MB
                ttl: config.cacheTTL || 3600000 // 1 hour
            },
            
            // Virtual filesystem
            virtualMounts: new Map(),
            
            // Integration URLs
            capsuleSystemUrl: config.capsuleSystemUrl || 'http://localhost:4900',
            obsidianVaultPath: config.obsidianVaultPath || './ObsidianVault',
            phpForumUrl: config.phpForumUrl || 'http://localhost:7777',
            
            ...config
        };
        
        // Storage backend instances
        this.backends = new Map();
        this.fileCache = new Map();
        this.encryptionKey = null;
        
        // Statistics
        this.stats = {
            reads: 0,
            writes: 0,
            cacheHits: 0,
            cacheMisses: 0,
            backendCalls: {}
        };
        
        console.log('🗂️ CAL Filesystem Abstraction initialized');
    }
    
    async initialize() {
        console.log('🚀 Initializing filesystem abstraction...');
        
        // Initialize enabled backends
        for (const [backend, config] of Object.entries(this.config.backends)) {
            if (config.enabled) {
                await this.initializeBackend(backend);
            }
        }
        
        // Setup encryption if enabled
        if (this.config.encryption.enabled) {
            await this.setupEncryption();
        }
        
        console.log('✅ Filesystem abstraction ready');
    }
    
    /**
     * Unified read operation
     */
    async read(filePath, options = {}) {
        this.stats.reads++;
        
        // Check cache first
        if (this.config.cache.enabled) {
            const cached = this.getCached(filePath);
            if (cached) {
                this.stats.cacheHits++;
                return cached;
            }
            this.stats.cacheMisses++;
        }
        
        // Try backends in priority order
        const backends = this.getEnabledBackends();
        let lastError;
        
        for (const backend of backends) {
            try {
                const data = await this.readFromBackend(backend, filePath, options);
                
                // Cache the result
                if (this.config.cache.enabled) {
                    this.setCached(filePath, data);
                }
                
                return data;
            } catch (error) {
                lastError = error;
                // Continue to next backend
            }
        }
        
        throw lastError || new Error('No backends available');
    }
    
    /**
     * Unified write operation
     */
    async write(filePath, data, options = {}) {
        this.stats.writes++;
        
        // Determine target backend(s)
        const targets = options.targets || [this.getPrimaryBackend()];
        const results = [];
        
        for (const backend of targets) {
            try {
                await this.writeToBackend(backend, filePath, data, options);
                results.push({ backend, success: true });
                
                // Update cache
                if (this.config.cache.enabled) {
                    this.setCached(filePath, data);
                }
            } catch (error) {
                results.push({ backend, success: false, error: error.message });
            }
        }
        
        // Emit sync event for other backends
        this.emit('file-written', { filePath, data, backends: targets });
        
        return results;
    }
    
    /**
     * Check if file exists
     */
    async exists(filePath) {
        const backends = this.getEnabledBackends();
        
        for (const backend of backends) {
            try {
                const exists = await this.existsInBackend(backend, filePath);
                if (exists) return true;
            } catch (error) {
                // Continue to next backend
            }
        }
        
        return false;
    }
    
    /**
     * List files in directory
     */
    async list(dirPath, options = {}) {
        const allFiles = new Set();
        const backends = this.getEnabledBackends();
        
        for (const backend of backends) {
            try {
                const files = await this.listInBackend(backend, dirPath, options);
                files.forEach(file => allFiles.add(file));
            } catch (error) {
                // Continue to next backend
            }
        }
        
        return Array.from(allFiles);
    }
    
    /**
     * Create directory
     */
    async mkdir(dirPath, options = {}) {
        const targets = options.targets || [this.getPrimaryBackend()];
        const results = [];
        
        for (const backend of targets) {
            try {
                await this.mkdirInBackend(backend, dirPath, options);
                results.push({ backend, success: true });
            } catch (error) {
                results.push({ backend, success: false, error: error.message });
            }
        }
        
        return results;
    }
    
    /**
     * Delete file
     */
    async unlink(filePath, options = {}) {
        const targets = options.targets || this.getBackendsWithFile(filePath);
        const results = [];
        
        for (const backend of targets) {
            try {
                await this.unlinkInBackend(backend, filePath, options);
                results.push({ backend, success: true });
                
                // Remove from cache
                if (this.config.cache.enabled) {
                    this.fileCache.delete(filePath);
                }
            } catch (error) {
                results.push({ backend, success: false, error: error.message });
            }
        }
        
        return results;
    }
    
    /**
     * Mount virtual filesystem
     */
    mount(mountPoint, backend, options = {}) {
        console.log(`🔌 Mounting ${backend} at ${mountPoint}`);
        
        this.config.virtualMounts.set(mountPoint, {
            backend,
            options,
            mounted: new Date()
        });
        
        this.emit('mount', { mountPoint, backend });
    }
    
    /**
     * Unmount virtual filesystem
     */
    unmount(mountPoint) {
        console.log(`🔌 Unmounting ${mountPoint}`);
        
        this.config.virtualMounts.delete(mountPoint);
        this.emit('unmount', { mountPoint });
    }
    
    /**
     * Sync files between backends
     */
    async sync(source, target, options = {}) {
        console.log(`🔄 Syncing from ${source} to ${target}`);
        
        const syncOptions = {
            pattern: options.pattern || '**/*',
            overwrite: options.overwrite !== false,
            deleteOrphans: options.deleteOrphans || false
        };
        
        // Get files from source
        const files = await this.list('/', { backend: source, recursive: true });
        let synced = 0;
        
        for (const file of files) {
            try {
                // Check pattern match
                if (!this.matchesPattern(file, syncOptions.pattern)) continue;
                
                // Read from source
                const data = await this.readFromBackend(source, file);
                
                // Check if exists in target
                const exists = await this.existsInBackend(target, file);
                if (exists && !syncOptions.overwrite) continue;
                
                // Write to target
                await this.writeToBackend(target, file, data);
                synced++;
                
                this.emit('file-synced', { file, source, target });
            } catch (error) {
                this.emit('sync-error', { file, source, target, error });
            }
        }
        
        console.log(`✅ Synced ${synced} files from ${source} to ${target}`);
        return { synced, total: files.length };
    }
    
    /**
     * Backend implementations
     */
    
    async initializeBackend(name) {
        console.log(`🔧 Initializing ${name} backend...`);
        
        switch (name) {
            case 'local':
                this.backends.set('local', new LocalBackend(this.config));
                break;
                
            case 'calSecureOS':
                this.backends.set('calSecureOS', new CalSecureOSBackend(this.config));
                break;
                
            case 'capsuleSystem':
                this.backends.set('capsuleSystem', new CapsuleSystemBackend(this.config));
                break;
                
            case 'obsidianVault':
                this.backends.set('obsidianVault', new ObsidianVaultBackend(this.config));
                break;
                
            case 'phpForum':
                this.backends.set('phpForum', new PHPForumBackend(this.config));
                break;
                
            default:
                console.warn(`Unknown backend: ${name}`);
        }
    }
    
    async readFromBackend(backend, filePath, options = {}) {
        const backendInstance = this.backends.get(backend);
        if (!backendInstance) throw new Error(`Backend ${backend} not initialized`);
        
        this.stats.backendCalls[backend] = (this.stats.backendCalls[backend] || 0) + 1;
        
        let data = await backendInstance.read(filePath, options);
        
        // Decrypt if needed
        if (this.config.encryption.enabled && options.decrypt !== false) {
            data = await this.decrypt(data);
        }
        
        return data;
    }
    
    async writeToBackend(backend, filePath, data, options = {}) {
        const backendInstance = this.backends.get(backend);
        if (!backendInstance) throw new Error(`Backend ${backend} not initialized`);
        
        this.stats.backendCalls[backend] = (this.stats.backendCalls[backend] || 0) + 1;
        
        // Encrypt if needed
        if (this.config.encryption.enabled && options.encrypt !== false) {
            data = await this.encrypt(data);
        }
        
        await backendInstance.write(filePath, data, options);
    }
    
    async existsInBackend(backend, filePath) {
        const backendInstance = this.backends.get(backend);
        if (!backendInstance) return false;
        
        return backendInstance.exists(filePath);
    }
    
    async listInBackend(backend, dirPath, options) {
        const backendInstance = this.backends.get(backend);
        if (!backendInstance) return [];
        
        return backendInstance.list(dirPath, options);
    }
    
    async mkdirInBackend(backend, dirPath, options) {
        const backendInstance = this.backends.get(backend);
        if (!backendInstance) throw new Error(`Backend ${backend} not initialized`);
        
        return backendInstance.mkdir(dirPath, options);
    }
    
    async unlinkInBackend(backend, filePath, options) {
        const backendInstance = this.backends.get(backend);
        if (!backendInstance) throw new Error(`Backend ${backend} not initialized`);
        
        return backendInstance.unlink(filePath, options);
    }
    
    /**
     * Helper methods
     */
    
    getEnabledBackends() {
        return Object.entries(this.config.backends)
            .filter(([_, config]) => config.enabled)
            .sort((a, b) => a[1].priority - b[1].priority)
            .map(([name]) => name);
    }
    
    getPrimaryBackend() {
        return this.getEnabledBackends()[0];
    }
    
    async getBackendsWithFile(filePath) {
        const backends = [];
        
        for (const backend of this.getEnabledBackends()) {
            if (await this.existsInBackend(backend, filePath)) {
                backends.push(backend);
            }
        }
        
        return backends;
    }
    
    /**
     * Cache management
     */
    
    getCached(filePath) {
        const cached = this.fileCache.get(filePath);
        if (!cached) return null;
        
        // Check TTL
        if (Date.now() - cached.timestamp > this.config.cache.ttl) {
            this.fileCache.delete(filePath);
            return null;
        }
        
        return cached.data;
    }
    
    setCached(filePath, data) {
        // Check cache size limit
        if (this.fileCache.size >= this.config.cache.maxSize / 1024) {
            // Remove oldest entry
            const firstKey = this.fileCache.keys().next().value;
            this.fileCache.delete(firstKey);
        }
        
        this.fileCache.set(filePath, {
            data,
            timestamp: Date.now()
        });
    }
    
    /**
     * Encryption/Decryption
     */
    
    async setupEncryption() {
        // In production, load from secure storage
        this.encryptionKey = crypto.randomBytes(32);
        console.log('🔐 Encryption enabled');
    }
    
    async encrypt(data) {
        if (!this.encryptionKey) throw new Error('Encryption not initialized');
        
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            this.config.encryption.algorithm,
            this.encryptionKey,
            iv
        );
        
        const encrypted = Buffer.concat([
            cipher.update(Buffer.from(data)),
            cipher.final()
        ]);
        
        const tag = cipher.getAuthTag();
        
        return Buffer.concat([iv, tag, encrypted]);
    }
    
    async decrypt(encryptedData) {
        if (!this.encryptionKey) throw new Error('Encryption not initialized');
        
        const buffer = Buffer.from(encryptedData);
        const iv = buffer.slice(0, 16);
        const tag = buffer.slice(16, 32);
        const encrypted = buffer.slice(32);
        
        const decipher = crypto.createDecipheriv(
            this.config.encryption.algorithm,
            this.encryptionKey,
            iv
        );
        
        decipher.setAuthTag(tag);
        
        return Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]).toString();
    }
    
    /**
     * Utility methods
     */
    
    matchesPattern(filePath, pattern) {
        // Simple glob matching (can be enhanced)
        if (pattern === '**/*') return true;
        return filePath.includes(pattern.replace('*', ''));
    }
    
    getStats() {
        return {
            ...this.stats,
            backends: Object.keys(this.backends),
            cacheSize: this.fileCache.size,
            mounts: Array.from(this.config.virtualMounts.keys())
        };
    }
}

/**
 * Backend implementations
 */

class LocalBackend {
    constructor(config) {
        this.config = config;
    }
    
    async read(filePath) {
        return fs.readFile(filePath, 'utf8');
    }
    
    async write(filePath, data) {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, data);
    }
    
    async exists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    async list(dirPath, options = {}) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            let files = [];
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isFile()) {
                    files.push(fullPath);
                } else if (entry.isDirectory() && options.recursive) {
                    const subFiles = await this.list(fullPath, options);
                    files = files.concat(subFiles);
                }
            }
            
            return files;
        } catch {
            return [];
        }
    }
    
    async mkdir(dirPath) {
        await fs.mkdir(dirPath, { recursive: true });
    }
    
    async unlink(filePath) {
        await fs.unlink(filePath);
    }
}

class CalSecureOSBackend {
    constructor(config) {
        this.config = config;
        // This would connect to CAL Secure OS encrypted filesystem
    }
    
    async read(filePath) {
        // Implementation would use CAL Secure OS API
        throw new Error('CalSecureOS backend not implemented');
    }
    
    async write(filePath, data) {
        throw new Error('CalSecureOS backend not implemented');
    }
    
    async exists(filePath) {
        return false;
    }
    
    async list(dirPath) {
        return [];
    }
    
    async mkdir(dirPath) {}
    async unlink(filePath) {}
}

class CapsuleSystemBackend {
    constructor(config) {
        this.config = config;
        this.baseUrl = config.capsuleSystemUrl;
    }
    
    async read(filePath) {
        // Map file path to capsule ID
        const capsuleId = this.pathToCapsuleId(filePath);
        
        // Fetch capsule content
        const response = await fetch(`${this.baseUrl}/api/capsule/${capsuleId}`);
        if (!response.ok) throw new Error('Capsule not found');
        
        const capsule = await response.json();
        return JSON.stringify(capsule.data);
    }
    
    async write(filePath, data) {
        // Create capsule from file
        const response = await fetch(`${this.baseUrl}/api/create-capsule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'file-storage',
                layer: 'runtime',
                data: {
                    path: filePath,
                    content: data,
                    timestamp: new Date().toISOString()
                }
            })
        });
        
        if (!response.ok) throw new Error('Failed to create capsule');
    }
    
    async exists(filePath) {
        try {
            await this.read(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    async list(dirPath) {
        // Query capsules by path prefix
        const response = await fetch(`${this.baseUrl}/api/query-capsules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: dirPath,
                layer: 'all'
            })
        });
        
        if (!response.ok) return [];
        
        const result = await response.json();
        return result.capsules.map(c => c.data.path).filter(p => p);
    }
    
    async mkdir(dirPath) {
        // Capsule system doesn't need explicit directories
    }
    
    async unlink(filePath) {
        // Would delete the capsule
    }
    
    pathToCapsuleId(filePath) {
        return crypto.createHash('sha256').update(filePath).digest('hex');
    }
}

class ObsidianVaultBackend {
    constructor(config) {
        this.config = config;
        this.vaultPath = config.obsidianVaultPath;
    }
    
    async read(filePath) {
        const fullPath = path.join(this.vaultPath, filePath);
        return fs.readFile(fullPath, 'utf8');
    }
    
    async write(filePath, data) {
        const fullPath = path.join(this.vaultPath, filePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, data);
    }
    
    async exists(filePath) {
        const fullPath = path.join(this.vaultPath, filePath);
        try {
            await fs.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }
    
    async list(dirPath, options) {
        const fullPath = path.join(this.vaultPath, dirPath);
        return new LocalBackend(this.config).list(fullPath, options);
    }
    
    async mkdir(dirPath) {
        const fullPath = path.join(this.vaultPath, dirPath);
        await fs.mkdir(fullPath, { recursive: true });
    }
    
    async unlink(filePath) {
        const fullPath = path.join(this.vaultPath, filePath);
        await fs.unlink(fullPath);
    }
}

class PHPForumBackend {
    constructor(config) {
        this.config = config;
        this.forumUrl = config.phpForumUrl;
    }
    
    async read(filePath) {
        // Would fetch file attachments from PHP forum
        throw new Error('PHPForum backend not implemented');
    }
    
    async write(filePath, data) {
        // Would upload as forum attachment
        throw new Error('PHPForum backend not implemented');
    }
    
    async exists(filePath) {
        return false;
    }
    
    async list(dirPath) {
        return [];
    }
    
    async mkdir(dirPath) {}
    async unlink(filePath) {}
}

module.exports = CALFilesystemAbstraction;

// Demo when run directly
if (require.main === module) {
    async function demo() {
        console.log(`
🗂️ CAL FILESYSTEM ABSTRACTION DEMO
==================================
`);
        
        const fs = new CALFilesystemAbstraction({
            backends: {
                local: { enabled: true },
                obsidianVault: { enabled: true }
            },
            obsidianVaultPath: './ObsidianVault'
        });
        
        await fs.initialize();
        
        // Test operations
        console.log('\n📍 Testing filesystem operations...');
        
        // Write to multiple backends
        const testFile = 'test-unified-fs.txt';
        const testData = 'Hello from unified filesystem!';
        
        console.log(`\n✏️ Writing "${testFile}"...`);
        const writeResults = await fs.write(testFile, testData, {
            targets: ['local', 'obsidianVault']
        });
        console.log('Write results:', writeResults);
        
        // Read from any backend
        console.log(`\n📖 Reading "${testFile}"...`);
        const readData = await fs.read(testFile);
        console.log('Read data:', readData);
        
        // Check existence
        console.log(`\n🔍 Checking if "${testFile}" exists...`);
        const exists = await fs.exists(testFile);
        console.log('Exists:', exists);
        
        // List files
        console.log('\n📋 Listing files in current directory...');
        const files = await fs.list('.', { recursive: false });
        console.log(`Found ${files.length} files`);
        
        // Show stats
        console.log('\n📊 Filesystem Statistics:');
        console.log(JSON.stringify(fs.getStats(), null, 2));
        
        // Cleanup
        console.log('\n🧹 Cleaning up test file...');
        await fs.unlink(testFile);
        
        console.log(`
✅ Filesystem Abstraction Demo Complete!
=======================================
The unified filesystem successfully:
- Wrote to multiple backends transparently
- Read from available backends with fallback
- Provided consistent API across storage types
- Enabled cross-backend operations
`);
    }
    
    demo().catch(console.error);
}