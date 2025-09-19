#!/usr/bin/env node

/**
 * 💾 Dance Memory Vault
 * 
 * Stores shared dance choreography and memories in an encrypted vault.
 * Supports version control, rollback, and cross-system memory sharing.
 * 
 * Each dance is remembered, each step is preserved!
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class DanceMemoryVault extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            vaultPath: config.vaultPath || './dance-vault',
            maxVersions: config.maxVersions || 10,
            autoSave: config.autoSave !== false,
            ...config
        };
        
        // Dance choreography library
        this.choreographyLibrary = new Map();
        
        // Shared memories between King and Queen
        this.sharedMemories = new Map();
        
        // Dance history (who danced what, when)
        this.danceHistory = [];
        
        // Version control for choreographies
        this.versions = new Map();
        
        // Encryption for vault
        this.vaultKey = null;
        
        // Initialize vault
        this.initialized = false;
    }
    
    /**
     * Initialize the vault
     */
    async initialize() {
        console.log('💾 Initializing Dance Memory Vault...');
        
        // Ensure vault directory exists
        await this.ensureVaultDirectory();
        
        // Load or generate vault key
        await this.loadVaultKey();
        
        // Load existing choreographies
        await this.loadChoreographies();
        
        // Load shared memories
        await this.loadSharedMemories();
        
        // Load dance history
        await this.loadDanceHistory();
        
        this.initialized = true;
        console.log('✅ Dance Memory Vault initialized');
        console.log(`📁 Vault location: ${this.config.vaultPath}`);
        console.log(`💃 Choreographies loaded: ${this.choreographyLibrary.size}`);
        console.log(`🧠 Shared memories: ${this.sharedMemories.size}`);
    }
    
    /**
     * Ensure vault directory exists
     */
    async ensureVaultDirectory() {
        try {
            await fs.mkdir(this.config.vaultPath, { recursive: true });
            await fs.mkdir(path.join(this.config.vaultPath, 'choreographies'), { recursive: true });
            await fs.mkdir(path.join(this.config.vaultPath, 'memories'), { recursive: true });
            await fs.mkdir(path.join(this.config.vaultPath, 'history'), { recursive: true });
            await fs.mkdir(path.join(this.config.vaultPath, 'versions'), { recursive: true });
        } catch (error) {
            console.error('Error creating vault directories:', error);
        }
    }
    
    /**
     * Load or generate vault encryption key
     */
    async loadVaultKey() {
        const keyPath = path.join(this.config.vaultPath, '.vault.key');
        
        try {
            const keyData = await fs.readFile(keyPath, 'utf8');
            this.vaultKey = Buffer.from(keyData.trim(), 'hex');
            console.log('🔐 Loaded existing vault key');
        } catch (error) {
            // Generate new key
            this.vaultKey = crypto.randomBytes(32);
            await fs.writeFile(keyPath, this.vaultKey.toString('hex'));
            console.log('🔐 Generated new vault key');
        }
    }
    
    /**
     * Store a dance choreography
     */
    async storeChoreography(danceName, choreography) {
        console.log(`💃 Storing choreography: ${danceName}`);
        
        // Version control
        const version = await this.createVersion(danceName, choreography);
        
        // Store in memory
        this.choreographyLibrary.set(danceName, {
            ...choreography,
            version,
            lastModified: new Date(),
            checksum: this.calculateChecksum(choreography)
        });
        
        // Persist to disk (encrypted)
        if (this.config.autoSave) {
            await this.saveChoreography(danceName, choreography);
        }
        
        // Emit event
        this.emit('choreography_stored', { 
            dance: danceName, 
            version,
            timestamp: new Date() 
        });
        
        return version;
    }
    
    /**
     * Retrieve a dance choreography
     */
    async getChoreography(danceName, version = null) {
        if (version) {
            // Get specific version
            return await this.getVersion(danceName, version);
        }
        
        // Get current version
        const choreography = this.choreographyLibrary.get(danceName);
        
        if (!choreography) {
            // Try loading from disk
            return await this.loadChoreographyFromDisk(danceName);
        }
        
        return choreography;
    }
    
    /**
     * Save choreography to disk (encrypted)
     */
    async saveChoreography(danceName, choreography) {
        const filePath = path.join(
            this.config.vaultPath, 
            'choreographies', 
            `${danceName}.dance`
        );
        
        const encrypted = this.encrypt(choreography);
        await fs.writeFile(filePath, JSON.stringify(encrypted));
    }
    
    /**
     * Load choreographies from disk
     */
    async loadChoreographies() {
        const choreoDir = path.join(this.config.vaultPath, 'choreographies');
        
        try {
            const files = await fs.readdir(choreoDir);
            
            for (const file of files) {
                if (file.endsWith('.dance')) {
                    const danceName = file.replace('.dance', '');
                    const choreography = await this.loadChoreographyFromDisk(danceName);
                    
                    if (choreography) {
                        this.choreographyLibrary.set(danceName, choreography);
                    }
                }
            }
        } catch (error) {
            console.log('No existing choreographies found');
        }
    }
    
    /**
     * Load choreography from disk
     */
    async loadChoreographyFromDisk(danceName) {
        const filePath = path.join(
            this.config.vaultPath, 
            'choreographies', 
            `${danceName}.dance`
        );
        
        try {
            const encryptedData = await fs.readFile(filePath, 'utf8');
            const encrypted = JSON.parse(encryptedData);
            const choreography = this.decrypt(encrypted);
            
            return {
                ...choreography,
                loadedFromDisk: true,
                lastAccessed: new Date()
            };
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Store shared memory between King and Queen
     */
    async storeSharedMemory(key, memory, metadata = {}) {
        console.log(`🧠 Storing shared memory: ${key}`);
        
        const memoryRecord = {
            key,
            value: memory,
            metadata: {
                ...metadata,
                timestamp: new Date(),
                checksum: this.calculateChecksum(memory)
            }
        };
        
        // Store in memory
        this.sharedMemories.set(key, memoryRecord);
        
        // Persist to disk
        if (this.config.autoSave) {
            await this.saveSharedMemory(key, memoryRecord);
        }
        
        // Add to history
        this.recordMemoryAccess('store', key, metadata.system || 'unknown');
        
        this.emit('memory_stored', { key, timestamp: new Date() });
        
        return memoryRecord;
    }
    
    /**
     * Retrieve shared memory
     */
    async getSharedMemory(key) {
        let memory = this.sharedMemories.get(key);
        
        if (!memory) {
            // Try loading from disk
            memory = await this.loadSharedMemoryFromDisk(key);
        }
        
        if (memory) {
            // Record access
            this.recordMemoryAccess('retrieve', key);
            
            // Update last accessed
            memory.metadata.lastAccessed = new Date();
        }
        
        return memory;
    }
    
    /**
     * Save shared memory to disk
     */
    async saveSharedMemory(key, memory) {
        const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '_');
        const filePath = path.join(
            this.config.vaultPath,
            'memories',
            `${safeKey}.memory`
        );
        
        const encrypted = this.encrypt(memory);
        await fs.writeFile(filePath, JSON.stringify(encrypted));
    }
    
    /**
     * Load shared memories from disk
     */
    async loadSharedMemories() {
        const memoryDir = path.join(this.config.vaultPath, 'memories');
        
        try {
            const files = await fs.readdir(memoryDir);
            
            for (const file of files) {
                if (file.endsWith('.memory')) {
                    const key = file.replace('.memory', '');
                    const memory = await this.loadSharedMemoryFromDisk(key);
                    
                    if (memory) {
                        this.sharedMemories.set(key, memory);
                    }
                }
            }
        } catch (error) {
            console.log('No existing shared memories found');
        }
    }
    
    /**
     * Load shared memory from disk
     */
    async loadSharedMemoryFromDisk(key) {
        const safeKey = key.replace(/[^a-zA-Z0-9-_]/g, '_');
        const filePath = path.join(
            this.config.vaultPath,
            'memories',
            `${safeKey}.memory`
        );
        
        try {
            const encryptedData = await fs.readFile(filePath, 'utf8');
            const encrypted = JSON.parse(encryptedData);
            return this.decrypt(encrypted);
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Record dance event in history
     */
    async recordDance(danceName, participants, result) {
        const danceEvent = {
            id: crypto.randomBytes(16).toString('hex'),
            dance: danceName,
            participants,
            result,
            timestamp: new Date(),
            choreographyVersion: this.choreographyLibrary.get(danceName)?.version
        };
        
        this.danceHistory.push(danceEvent);
        
        // Keep history size manageable
        if (this.danceHistory.length > 1000) {
            this.danceHistory = this.danceHistory.slice(-1000);
        }
        
        // Save to disk
        if (this.config.autoSave) {
            await this.saveDanceHistory();
        }
        
        this.emit('dance_recorded', danceEvent);
        
        return danceEvent;
    }
    
    /**
     * Get dance history
     */
    getDanceHistory(filter = {}) {
        let history = [...this.danceHistory];
        
        if (filter.dance) {
            history = history.filter(h => h.dance === filter.dance);
        }
        
        if (filter.participant) {
            history = history.filter(h => 
                h.participants.includes(filter.participant)
            );
        }
        
        if (filter.startDate) {
            history = history.filter(h => 
                new Date(h.timestamp) >= new Date(filter.startDate)
            );
        }
        
        if (filter.endDate) {
            history = history.filter(h => 
                new Date(h.timestamp) <= new Date(filter.endDate)
            );
        }
        
        return history;
    }
    
    /**
     * Save dance history
     */
    async saveDanceHistory() {
        const historyPath = path.join(
            this.config.vaultPath,
            'history',
            `dance_history_${new Date().toISOString().split('T')[0]}.json`
        );
        
        const encrypted = this.encrypt(this.danceHistory);
        await fs.writeFile(historyPath, JSON.stringify(encrypted));
    }
    
    /**
     * Load dance history
     */
    async loadDanceHistory() {
        const historyDir = path.join(this.config.vaultPath, 'history');
        
        try {
            const files = await fs.readdir(historyDir);
            const sortedFiles = files.sort().reverse(); // Most recent first
            
            if (sortedFiles.length > 0) {
                const latestFile = sortedFiles[0];
                const historyPath = path.join(historyDir, latestFile);
                const encryptedData = await fs.readFile(historyPath, 'utf8');
                const encrypted = JSON.parse(encryptedData);
                this.danceHistory = this.decrypt(encrypted) || [];
            }
        } catch (error) {
            console.log('No dance history found');
            this.danceHistory = [];
        }
    }
    
    /**
     * Create version of choreography
     */
    async createVersion(danceName, choreography) {
        const version = {
            number: Date.now(),
            hash: this.calculateChecksum(choreography),
            timestamp: new Date(),
            changes: this.detectChanges(danceName, choreography)
        };
        
        // Get version history
        let versions = this.versions.get(danceName) || [];
        versions.push(version);
        
        // Keep only max versions
        if (versions.length > this.config.maxVersions) {
            versions = versions.slice(-this.config.maxVersions);
        }
        
        this.versions.set(danceName, versions);
        
        // Save version to disk
        const versionPath = path.join(
            this.config.vaultPath,
            'versions',
            danceName,
            `v${version.number}.json`
        );
        
        await fs.mkdir(path.dirname(versionPath), { recursive: true });
        const encrypted = this.encrypt({ version, choreography });
        await fs.writeFile(versionPath, JSON.stringify(encrypted));
        
        return version.number;
    }
    
    /**
     * Get specific version of choreography
     */
    async getVersion(danceName, versionNumber) {
        const versionPath = path.join(
            this.config.vaultPath,
            'versions',
            danceName,
            `v${versionNumber}.json`
        );
        
        try {
            const encryptedData = await fs.readFile(versionPath, 'utf8');
            const encrypted = JSON.parse(encryptedData);
            const data = this.decrypt(encrypted);
            return data.choreography;
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Rollback to specific version
     */
    async rollback(danceName, versionNumber) {
        const choreography = await this.getVersion(danceName, versionNumber);
        
        if (!choreography) {
            throw new Error(`Version ${versionNumber} not found for ${danceName}`);
        }
        
        // Store as current version
        await this.storeChoreography(danceName, choreography);
        
        this.emit('rollback_complete', {
            dance: danceName,
            version: versionNumber,
            timestamp: new Date()
        });
        
        return choreography;
    }
    
    /**
     * Detect changes between versions
     */
    detectChanges(danceName, newChoreography) {
        const current = this.choreographyLibrary.get(danceName);
        
        if (!current) {
            return { type: 'new', changes: [] };
        }
        
        const changes = [];
        
        // Simple change detection (could be more sophisticated)
        const currentStr = JSON.stringify(current);
        const newStr = JSON.stringify(newChoreography);
        
        if (currentStr !== newStr) {
            changes.push({
                type: 'modified',
                before: current.checksum,
                after: this.calculateChecksum(newChoreography)
            });
        }
        
        return { type: 'update', changes };
    }
    
    /**
     * Record memory access
     */
    recordMemoryAccess(action, key, system = 'unknown') {
        const access = {
            action,
            key,
            system,
            timestamp: new Date()
        };
        
        // Could persist this for audit trail
        this.emit('memory_access', access);
    }
    
    /**
     * Calculate checksum for data
     */
    calculateChecksum(data) {
        const str = typeof data === 'object' ? JSON.stringify(data) : String(data);
        return crypto.createHash('sha256').update(str).digest('hex');
    }
    
    /**
     * Encrypt data
     */
    encrypt(data) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.vaultKey, iv);
        
        const dataStr = JSON.stringify(data);
        let encrypted = cipher.update(dataStr, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }
    
    /**
     * Decrypt data
     */
    decrypt(encryptedData) {
        try {
            const decipher = crypto.createDecipheriv(
                'aes-256-gcm',
                this.vaultKey,
                Buffer.from(encryptedData.iv, 'hex')
            );
            
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
            
            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return JSON.parse(decrypted);
        } catch (error) {
            console.error('Decryption failed:', error.message);
            return null;
        }
    }
    
    /**
     * Export vault statistics
     */
    getVaultStats() {
        return {
            choreographies: this.choreographyLibrary.size,
            sharedMemories: this.sharedMemories.size,
            danceHistory: this.danceHistory.length,
            versions: Array.from(this.versions.entries()).map(([dance, versions]) => ({
                dance,
                versionCount: versions.length
            })),
            vaultPath: this.config.vaultPath,
            encrypted: true
        };
    }
    
    /**
     * Backup entire vault
     */
    async backup(backupPath) {
        console.log(`💾 Creating vault backup to ${backupPath}`);
        
        const backup = {
            timestamp: new Date(),
            choreographies: Object.fromEntries(this.choreographyLibrary),
            memories: Object.fromEntries(this.sharedMemories),
            history: this.danceHistory,
            versions: Object.fromEntries(this.versions)
        };
        
        const encrypted = this.encrypt(backup);
        await fs.writeFile(backupPath, JSON.stringify(encrypted));
        
        console.log('✅ Backup complete');
        return true;
    }
}

// Export
module.exports = DanceMemoryVault;

// Demo if run directly
if (require.main === module) {
    const vault = new DanceMemoryVault();
    
    vault.on('choreography_stored', (event) => {
        console.log('💃 Choreography stored:', event);
    });
    
    vault.on('memory_stored', (event) => {
        console.log('🧠 Memory stored:', event);
    });
    
    vault.on('dance_recorded', (event) => {
        console.log('📝 Dance recorded:', event);
    });
    
    async function demo() {
        await vault.initialize();
        
        // Store a waltz choreography
        await vault.storeChoreography('waltz', {
            steps: [
                { king: 'step-forward', queen: 'step-back', count: 1 },
                { king: 'turn-right', queen: 'turn-left', count: 2 },
                { king: 'dip', queen: 'lean', count: 3 }
            ],
            tempo: 120,
            difficulty: 'medium'
        });
        
        // Store shared memory
        await vault.storeSharedMemory('last_dance_feeling', {
            king: { technical: 'smooth', performance: 95 },
            queen: { emotional: 'joyful', satisfaction: 98 }
        }, { system: 'bridge' });
        
        // Record a dance
        await vault.recordDance('waltz', ['king', 'queen'], {
            success: true,
            duration: 180,
            synchronization: 92
        });
        
        // Get stats
        console.log('\n📊 Vault Statistics:');
        console.log(JSON.stringify(vault.getVaultStats(), null, 2));
    }
    
    demo().catch(console.error);
}