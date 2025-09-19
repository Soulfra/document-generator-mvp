#!/usr/bin/env node

/**
 * 🏰 DOMAIN VAULT SYSTEM
 * Transform git wrapper concept into vault for 300+ domains
 * Secure storage, version control, and deployment management
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const sqlite3 = require('sqlite3').verbose();

class DomainVaultSystem extends EventEmitter {
    constructor() {
        super();
        
        this.port = 7782;
        this.vaultPath = path.join(__dirname, 'empire-vault');
        
        // Vault configuration
        this.vaultConfig = {
            encryption: {
                algorithm: 'aes-256-gcm',
                keyDerivation: 'scrypt',
                iterations: 32768
            },
            versioning: {
                maxVersions: 50,
                compressionLevel: 9,
                deltaStorage: true
            },
            domains: new Map(),
            deployments: new Map()
        };
        
        // Master key management
        this.masterKey = null;
        this.derivedKeys = new Map();
        
        // Vault database
        this.db = null;
        
        // Active vaults
        this.vaults = new Map();
        
        // Statistics
        this.stats = {
            totalDomains: 0,
            totalVersions: 0,
            vaultSize: 0,
            deploymentsActive: 0,
            lastBackup: null
        };
        
        console.log('🏰 Domain Vault System initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Create vault directory
            await this.createVaultStructure();
            
            // Initialize database
            await this.initializeDatabase();
            
            // Load existing vaults
            await this.loadVaults();
            
            // Setup encryption
            await this.setupEncryption();
            
            // Start vault services
            await this.startVaultServices();
            
            console.log('✅ Domain Vault System ready!');
            
        } catch (error) {
            console.error('❌ Vault initialization failed:', error);
            process.exit(1);
        }
    }
    
    async createVaultStructure() {
        const directories = [
            this.vaultPath,
            path.join(this.vaultPath, 'domains'),
            path.join(this.vaultPath, 'versions'),
            path.join(this.vaultPath, 'deployments'),
            path.join(this.vaultPath, 'backups'),
            path.join(this.vaultPath, 'keys'),
            path.join(this.vaultPath, 'metadata')
        ];
        
        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        console.log('📁 Vault structure created');
    }
    
    async initializeDatabase() {
        const dbPath = path.join(this.vaultPath, 'vault.db');
        
        this.db = new sqlite3.Database(dbPath);
        
        await this.runQuery(`
            CREATE TABLE IF NOT EXISTS domains (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain TEXT UNIQUE NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                encrypted BOOLEAN DEFAULT 1,
                active BOOLEAN DEFAULT 1,
                metadata TEXT
            )
        `);
        
        await this.runQuery(`
            CREATE TABLE IF NOT EXISTS versions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain_id INTEGER,
                version_number INTEGER NOT NULL,
                hash TEXT NOT NULL,
                parent_hash TEXT,
                message TEXT,
                author TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                size INTEGER,
                encrypted BOOLEAN DEFAULT 1,
                FOREIGN KEY (domain_id) REFERENCES domains(id)
            )
        `);
        
        await this.runQuery(`
            CREATE TABLE IF NOT EXISTS deployments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain_id INTEGER,
                version_id INTEGER,
                environment TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                deployed_at DATETIME,
                metadata TEXT,
                FOREIGN KEY (domain_id) REFERENCES domains(id),
                FOREIGN KEY (version_id) REFERENCES versions(id)
            )
        `);
        
        await this.runQuery(`
            CREATE TABLE IF NOT EXISTS vault_keys (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key_id TEXT UNIQUE NOT NULL,
                encrypted_key TEXT NOT NULL,
                purpose TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME
            )
        `);
        
        console.log('💾 Vault database initialized');
    }
    
    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }
    
    getQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
    
    allQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
    
    async setupEncryption() {
        // Check for existing master key
        const keyPath = path.join(this.vaultPath, 'keys', 'master.key');
        
        try {
            const encryptedKey = await fs.readFile(keyPath, 'utf8');
            // In production, decrypt with hardware security module or user passphrase
            this.masterKey = Buffer.from(encryptedKey, 'hex');
            console.log('🔐 Master key loaded');
        } catch (error) {
            // Generate new master key
            this.masterKey = crypto.randomBytes(32);
            await fs.writeFile(keyPath, this.masterKey.toString('hex'));
            console.log('🔑 New master key generated');
        }
    }
    
    async loadVaults() {
        const domains = await this.allQuery('SELECT * FROM domains WHERE active = 1');
        
        for (const domain of domains) {
            const vault = await this.loadDomainVault(domain);
            this.vaults.set(domain.domain, vault);
        }
        
        this.stats.totalDomains = this.vaults.size;
        console.log(`📦 Loaded ${this.vaults.size} domain vaults`);
    }
    
    async loadDomainVault(domainRecord) {
        const vault = {
            id: domainRecord.id,
            domain: domainRecord.domain,
            created: new Date(domainRecord.created_at),
            updated: new Date(domainRecord.updated_at),
            encrypted: domainRecord.encrypted,
            metadata: JSON.parse(domainRecord.metadata || '{}'),
            versions: [],
            currentVersion: null
        };
        
        // Load versions
        const versions = await this.allQuery(
            'SELECT * FROM versions WHERE domain_id = ? ORDER BY version_number DESC LIMIT 10',
            [domainRecord.id]
        );
        
        vault.versions = versions;
        vault.currentVersion = versions[0] || null;
        
        return vault;
    }
    
    async createDomainVault(domain, initialData = {}) {
        console.log(`🏗️ Creating vault for ${domain}...`);
        
        // Check if domain already exists
        const existing = await this.getQuery('SELECT id FROM domains WHERE domain = ?', [domain]);
        if (existing) {
            throw new Error(`Domain ${domain} already has a vault`);
        }
        
        // Create domain record
        const result = await this.runQuery(
            'INSERT INTO domains (domain, metadata) VALUES (?, ?)',
            [domain, JSON.stringify(initialData.metadata || {})]
        );
        
        const domainId = result.lastID;
        
        // Create initial version
        const versionData = await this.createVersion(domainId, {
            files: initialData.files || {},
            message: initialData.message || 'Initial vault creation',
            author: initialData.author || 'system'
        });
        
        // Create vault directory
        const vaultDir = path.join(this.vaultPath, 'domains', domain);
        await fs.mkdir(vaultDir, { recursive: true });
        
        // Store encrypted files
        await this.storeVersionFiles(domain, versionData.hash, initialData.files || {});
        
        // Load and cache vault
        const domainRecord = await this.getQuery('SELECT * FROM domains WHERE id = ?', [domainId]);
        const vault = await this.loadDomainVault(domainRecord);
        this.vaults.set(domain, vault);
        
        this.emit('vaultCreated', { domain, vault });
        
        return vault;
    }
    
    async createVersion(domainId, data) {
        // Get current version
        const currentVersion = await this.getQuery(
            'SELECT MAX(version_number) as max_version FROM versions WHERE domain_id = ?',
            [domainId]
        );
        
        const versionNumber = (currentVersion?.max_version || 0) + 1;
        
        // Calculate content hash
        const contentHash = this.calculateContentHash(data.files);
        
        // Get parent hash
        const parentVersion = await this.getQuery(
            'SELECT hash FROM versions WHERE domain_id = ? ORDER BY version_number DESC LIMIT 1',
            [domainId]
        );
        
        // Create version record
        const result = await this.runQuery(
            `INSERT INTO versions (domain_id, version_number, hash, parent_hash, message, author, size) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                domainId,
                versionNumber,
                contentHash,
                parentVersion?.hash || null,
                data.message,
                data.author,
                JSON.stringify(data.files).length
            ]
        );
        
        this.stats.totalVersions++;
        
        return {
            id: result.lastID,
            versionNumber,
            hash: contentHash,
            parentHash: parentVersion?.hash || null
        };
    }
    
    calculateContentHash(files) {
        const hash = crypto.createHash('sha256');
        
        // Sort files for consistent hashing
        const sortedFiles = Object.keys(files).sort();
        
        for (const filename of sortedFiles) {
            hash.update(filename);
            hash.update(files[filename]);
        }
        
        return hash.digest('hex');
    }
    
    async storeVersionFiles(domain, versionHash, files) {
        const versionDir = path.join(this.vaultPath, 'versions', domain, versionHash);
        await fs.mkdir(versionDir, { recursive: true });
        
        for (const [filename, content] of Object.entries(files)) {
            const encrypted = await this.encryptContent(content);
            const filePath = path.join(versionDir, this.sanitizeFilename(filename));
            await fs.writeFile(filePath, encrypted);
        }
    }
    
    async encryptContent(content) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(
            this.vaultConfig.encryption.algorithm,
            this.masterKey,
            iv
        );
        
        const encrypted = Buffer.concat([
            cipher.update(content, 'utf8'),
            cipher.final()
        ]);
        
        const tag = cipher.getAuthTag();
        
        return Buffer.concat([iv, tag, encrypted]);
    }
    
    async decryptContent(encryptedData) {
        const buffer = Buffer.from(encryptedData);
        
        const iv = buffer.slice(0, 16);
        const tag = buffer.slice(16, 32);
        const encrypted = buffer.slice(32);
        
        const decipher = crypto.createDecipheriv(
            this.vaultConfig.encryption.algorithm,
            this.masterKey,
            iv
        );
        
        decipher.setAuthTag(tag);
        
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);
        
        return decrypted.toString('utf8');
    }
    
    sanitizeFilename(filename) {
        return filename.replace(/[^a-z0-9._-]/gi, '_');
    }
    
    async addVersion(domain, files, options = {}) {
        const vault = this.vaults.get(domain);
        if (!vault) {
            throw new Error(`No vault found for domain ${domain}`);
        }
        
        // Check if content has changed
        const newHash = this.calculateContentHash(files);
        if (vault.currentVersion && vault.currentVersion.hash === newHash) {
            console.log('⚠️ No changes detected, skipping version creation');
            return vault.currentVersion;
        }
        
        // Create new version
        const versionData = await this.createVersion(vault.id, {
            files,
            message: options.message || 'Update files',
            author: options.author || 'system'
        });
        
        // Store files
        await this.storeVersionFiles(domain, versionData.hash, files);
        
        // Update vault cache
        vault.versions.unshift(versionData);
        vault.currentVersion = versionData;
        vault.updated = new Date();
        
        // Update database
        await this.runQuery(
            'UPDATE domains SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [vault.id]
        );
        
        this.emit('versionCreated', { domain, version: versionData });
        
        // Auto-backup if needed
        if (vault.versions.length % 10 === 0) {
            await this.backupVault(domain);
        }
        
        return versionData;
    }
    
    async getVersion(domain, versionNumber = null) {
        const vault = this.vaults.get(domain);
        if (!vault) {
            throw new Error(`No vault found for domain ${domain}`);
        }
        
        let version;
        if (versionNumber === null) {
            version = vault.currentVersion;
        } else {
            version = await this.getQuery(
                'SELECT * FROM versions WHERE domain_id = ? AND version_number = ?',
                [vault.id, versionNumber]
            );
        }
        
        if (!version) {
            throw new Error(`Version ${versionNumber} not found for ${domain}`);
        }
        
        // Load files
        const versionDir = path.join(this.vaultPath, 'versions', domain, version.hash);
        const files = {};
        
        try {
            const filenames = await fs.readdir(versionDir);
            
            for (const filename of filenames) {
                const filePath = path.join(versionDir, filename);
                const encryptedContent = await fs.readFile(filePath);
                files[filename] = await this.decryptContent(encryptedContent);
            }
        } catch (error) {
            console.error(`Error loading version files: ${error.message}`);
        }
        
        return {
            ...version,
            files
        };
    }
    
    async deployVersion(domain, versionNumber, environment, options = {}) {
        console.log(`🚀 Deploying ${domain} v${versionNumber} to ${environment}...`);
        
        const vault = this.vaults.get(domain);
        if (!vault) {
            throw new Error(`No vault found for domain ${domain}`);
        }
        
        const version = await this.getVersion(domain, versionNumber);
        
        // Create deployment record
        const result = await this.runQuery(
            `INSERT INTO deployments (domain_id, version_id, environment, metadata) 
             VALUES (?, ?, ?, ?)`,
            [vault.id, version.id, environment, JSON.stringify(options.metadata || {})]
        );
        
        const deploymentId = result.lastID;
        
        // Execute deployment
        try {
            await this.executeDeployment(domain, version, environment, options);
            
            // Update deployment status
            await this.runQuery(
                'UPDATE deployments SET status = ?, deployed_at = CURRENT_TIMESTAMP WHERE id = ?',
                ['success', deploymentId]
            );
            
            this.stats.deploymentsActive++;
            
            this.emit('deploymentSuccess', {
                domain,
                version: versionNumber,
                environment,
                deploymentId
            });
            
        } catch (error) {
            // Update deployment status
            await this.runQuery(
                'UPDATE deployments SET status = ?, metadata = ? WHERE id = ?',
                ['failed', JSON.stringify({ error: error.message }), deploymentId]
            );
            
            this.emit('deploymentFailed', {
                domain,
                version: versionNumber,
                environment,
                error: error.message
            });
            
            throw error;
        }
    }
    
    async executeDeployment(domain, version, environment, options) {
        // This would integrate with your deployment infrastructure
        // For now, simulate deployment
        
        const deploymentDir = path.join(this.vaultPath, 'deployments', environment, domain);
        await fs.mkdir(deploymentDir, { recursive: true });
        
        // Copy version files to deployment
        for (const [filename, content] of Object.entries(version.files)) {
            const deployPath = path.join(deploymentDir, filename);
            await fs.writeFile(deployPath, content);
        }
        
        // Simulate deployment time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log(`✅ Deployed ${domain} to ${environment}`);
    }
    
    async rollbackDeployment(domain, environment) {
        console.log(`⏪ Rolling back ${domain} in ${environment}...`);
        
        const vault = this.vaults.get(domain);
        if (!vault) {
            throw new Error(`No vault found for domain ${domain}`);
        }
        
        // Get previous successful deployment
        const previousDeployment = await this.getQuery(
            `SELECT * FROM deployments 
             WHERE domain_id = ? AND environment = ? AND status = 'success' 
             ORDER BY deployed_at DESC 
             LIMIT 1 OFFSET 1`,
            [vault.id, environment]
        );
        
        if (!previousDeployment) {
            throw new Error('No previous deployment found for rollback');
        }
        
        // Deploy the previous version
        await this.deployVersion(
            domain,
            previousDeployment.version_id,
            environment,
            { metadata: { rollback: true, from_deployment: previousDeployment.id } }
        );
    }
    
    async backupVault(domain) {
        console.log(`💾 Backing up vault for ${domain}...`);
        
        const vault = this.vaults.get(domain);
        if (!vault) {
            throw new Error(`No vault found for domain ${domain}`);
        }
        
        const backupPath = path.join(
            this.vaultPath,
            'backups',
            `${domain}-${Date.now()}.vault`
        );
        
        // Create backup data
        const backupData = {
            domain,
            vault: vault,
            versions: await this.allQuery(
                'SELECT * FROM versions WHERE domain_id = ? ORDER BY version_number',
                [vault.id]
            ),
            deployments: await this.allQuery(
                'SELECT * FROM deployments WHERE domain_id = ?',
                [vault.id]
            ),
            timestamp: new Date().toISOString()
        };
        
        // Encrypt and save backup
        const encrypted = await this.encryptContent(JSON.stringify(backupData));
        await fs.writeFile(backupPath, encrypted);
        
        this.stats.lastBackup = new Date();
        
        console.log(`✅ Backup saved to ${backupPath}`);
    }
    
    async importGitRepo(domain, gitPath) {
        console.log(`📥 Importing git repository for ${domain}...`);
        
        // Read all files from git repo
        const files = {};
        
        const readDirectory = async (dirPath, basePath = '') => {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const relativePath = path.join(basePath, entry.name);
                
                if (entry.isDirectory()) {
                    if (entry.name !== '.git' && entry.name !== 'node_modules') {
                        await readDirectory(fullPath, relativePath);
                    }
                } else {
                    try {
                        const content = await fs.readFile(fullPath, 'utf8');
                        files[relativePath] = content;
                    } catch (error) {
                        console.warn(`Skipping binary file: ${relativePath}`);
                    }
                }
            }
        };
        
        await readDirectory(gitPath);
        
        // Create vault with imported files
        const vault = await this.createDomainVault(domain, {
            files,
            message: 'Imported from git repository',
            metadata: {
                source: 'git',
                importPath: gitPath,
                fileCount: Object.keys(files).length
            }
        });
        
        console.log(`✅ Imported ${Object.keys(files).length} files into vault`);
        
        return vault;
    }
    
    async exportToGit(domain, targetPath, versionNumber = null) {
        console.log(`📤 Exporting ${domain} to git repository...`);
        
        const version = await this.getVersion(domain, versionNumber);
        
        // Create target directory
        await fs.mkdir(targetPath, { recursive: true });
        
        // Write all files
        for (const [filename, content] of Object.entries(version.files)) {
            const filePath = path.join(targetPath, filename);
            const fileDir = path.dirname(filePath);
            
            await fs.mkdir(fileDir, { recursive: true });
            await fs.writeFile(filePath, content);
        }
        
        // Initialize git repo
        const { exec } = require('child_process').promises;
        
        try {
            await exec('git init', { cwd: targetPath });
            await exec('git add .', { cwd: targetPath });
            await exec(`git commit -m "Exported from vault: ${version.message}"`, { cwd: targetPath });
            
            console.log(`✅ Exported to git repository at ${targetPath}`);
        } catch (error) {
            console.warn('Git initialization failed:', error.message);
        }
    }
    
    async startVaultServices() {
        // Start API server
        const express = require('express');
        const app = express();
        
        app.use(express.json({ limit: '50mb' }));
        
        // Vault API endpoints
        app.post('/vault/create', async (req, res) => {
            try {
                const { domain, files, metadata } = req.body;
                const vault = await this.createDomainVault(domain, { files, metadata });
                res.json({ success: true, vault });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        app.post('/vault/:domain/version', async (req, res) => {
            try {
                const { files, message, author } = req.body;
                const version = await this.addVersion(req.params.domain, files, { message, author });
                res.json({ success: true, version });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        app.get('/vault/:domain/version/:version?', async (req, res) => {
            try {
                const version = await this.getVersion(
                    req.params.domain,
                    req.params.version ? parseInt(req.params.version) : null
                );
                res.json({ success: true, version });
            } catch (error) {
                res.status(404).json({ error: error.message });
            }
        });
        
        app.post('/vault/:domain/deploy', async (req, res) => {
            try {
                const { version, environment, metadata } = req.body;
                await this.deployVersion(
                    req.params.domain,
                    version,
                    environment,
                    { metadata }
                );
                res.json({ success: true });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        app.get('/vault/stats', (req, res) => {
            res.json({
                stats: this.stats,
                vaults: Array.from(this.vaults.keys())
            });
        });
        
        app.listen(this.port, () => {
            console.log(`🌐 Vault API running on port ${this.port}`);
        });
        
        // Start backup scheduler
        setInterval(() => {
            this.performScheduledBackups();
        }, 3600000); // Every hour
    }
    
    async performScheduledBackups() {
        console.log('🕐 Performing scheduled backups...');
        
        for (const [domain, vault] of this.vaults) {
            const hoursSinceUpdate = (Date.now() - vault.updated.getTime()) / 3600000;
            
            if (hoursSinceUpdate < 24) {
                // Backup recently updated vaults
                await this.backupVault(domain);
            }
        }
    }
    
    // Statistics and monitoring
    async calculateVaultSize() {
        const vaultStat = await fs.stat(this.vaultPath);
        
        const calculateDirSize = async (dirPath) => {
            let totalSize = 0;
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                const stat = await fs.stat(fullPath);
                
                if (entry.isDirectory()) {
                    totalSize += await calculateDirSize(fullPath);
                } else {
                    totalSize += stat.size;
                }
            }
            
            return totalSize;
        };
        
        this.stats.vaultSize = await calculateDirSize(this.vaultPath);
        return this.stats.vaultSize;
    }
    
    getVaultStats() {
        return {
            ...this.stats,
            vaultCount: this.vaults.size,
            domains: Array.from(this.vaults.keys()),
            uptime: Date.now() - this.startTime
        };
    }
}

// Export
module.exports = DomainVaultSystem;

// Run if called directly
if (require.main === module) {
    const vault = new DomainVaultSystem();
    
    // Example usage
    setTimeout(async () => {
        console.log('\n📝 Example: Creating test vault...');
        
        try {
            await vault.createDomainVault('example.com', {
                files: {
                    'index.html': '<h1>Hello from Vault!</h1>',
                    'style.css': 'body { font-family: sans-serif; }',
                    'app.js': 'console.log("Vault active!");'
                },
                message: 'Initial example vault',
                metadata: {
                    type: 'website',
                    framework: 'vanilla'
                }
            });
            
            console.log('✅ Example vault created!');
            
        } catch (error) {
            console.error('Example failed:', error);
        }
    }, 2000);
    
    console.log(`
🏰 DOMAIN VAULT SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 Encrypted storage for 300+ domains
📦 Version control without git complexity
🚀 Automated deployment management
💾 Scheduled backups and recovery

API Endpoint: http://localhost:7782

Features:
  • Encrypted file storage
  • Version tracking
  • Deployment history
  • Rollback support
  • Import/export to git
  • Automated backups
    `);
}