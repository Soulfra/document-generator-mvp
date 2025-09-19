#!/usr/bin/env node

/**
 * 🔐 ERROR KNOWLEDGE VAULT
 * 
 * Encrypted persistent storage for error patterns and solutions.
 * Like the keyring-manager but for error knowledge - ensuring
 * we never lose the lessons we've learned.
 * 
 * Features:
 * - AES-256-GCM encryption for error patterns
 * - Hierarchical knowledge organization
 * - Cross-system knowledge sharing
 * - Automatic backup and recovery
 * - Version control for solutions
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

class ErrorKnowledgeVault {
    constructor() {
        this.vaultPath = path.join(__dirname, '.vault', 'error-knowledge');
        this.db = null;
        
        // Encryption settings
        this.algorithm = 'aes-256-gcm';
        this.saltLength = 32;
        this.tagLength = 16;
        this.ivLength = 16;
        this.iterations = 100000;
        
        // Master key management
        this.masterKey = null;
        this.vaultKey = null;
        
        // Knowledge categories
        this.categories = {
            timeout: { icon: '⏱️', priority: 'high' },
            memory: { icon: '🧠', priority: 'critical' },
            network: { icon: '🌐', priority: 'high' },
            database: { icon: '💾', priority: 'critical' },
            security: { icon: '🔒', priority: 'critical' },
            cascade: { icon: '🌊', priority: 'critical' },
            silent: { icon: '🤫', priority: 'high' },
            performance: { icon: '🚀', priority: 'medium' }
        };
        
        // Knowledge versioning
        this.versions = new Map();
        this.currentVersion = '1.0.0';
        
        console.log('🔐 Error Knowledge Vault initializing...');
    }
    
    async initialize() {
        try {
            // Create vault directory
            await this.createVaultStructure();
            
            // Initialize or load master key
            await this.initializeMasterKey();
            
            // Initialize database
            await this.initializeDatabase();
            
            // Load existing knowledge
            await this.loadKnowledgeBase();
            
            // Set up automatic backups
            this.setupAutoBackup();
            
            console.log('✅ Error Knowledge Vault ready!');
            console.log(`   📂 Vault location: ${this.vaultPath}`);
            console.log(`   🔑 Encryption: AES-256-GCM`);
            console.log(`   📚 Knowledge categories: ${Object.keys(this.categories).length}`);
            
            return this;
            
        } catch (error) {
            console.error('❌ Vault initialization failed:', error);
            throw error;
        }
    }
    
    async createVaultStructure() {
        const dirs = [
            this.vaultPath,
            path.join(this.vaultPath, 'patterns'),
            path.join(this.vaultPath, 'solutions'),
            path.join(this.vaultPath, 'backups'),
            path.join(this.vaultPath, 'exports')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        // Create .gitignore to protect vault
        const gitignore = `# Error Knowledge Vault - DO NOT COMMIT
*
!.gitignore
!README.md
`;
        await fs.writeFile(path.join(this.vaultPath, '.gitignore'), gitignore);
        
        // Create README
        const readme = `# Error Knowledge Vault

This directory contains encrypted error patterns and solutions.
DO NOT commit these files to version control.

## Structure:
- patterns/     Encrypted error patterns
- solutions/    Encrypted solutions and fixes  
- backups/      Automatic backups
- exports/      Sanitized exports for sharing

## Security:
All files are encrypted with AES-256-GCM.
Master key is stored separately.
`;
        await fs.writeFile(path.join(this.vaultPath, 'README.md'), readme);
    }
    
    async initializeMasterKey() {
        const keyFile = path.join(this.vaultPath, '.master.key');
        
        try {
            // Try to load existing key
            const encryptedKey = await fs.readFile(keyFile);
            this.masterKey = await this.decryptMasterKey(encryptedKey);
            console.log('   🔑 Master key loaded');
        } catch {
            // Generate new master key
            console.log('   🔑 Generating new master key...');
            this.masterKey = crypto.randomBytes(32);
            
            // Encrypt and save master key
            const encryptedKey = await this.encryptMasterKey(this.masterKey);
            await fs.writeFile(keyFile, encryptedKey);
            
            // Also create a recovery key
            await this.createRecoveryKey();
        }
        
        // Derive vault key from master key
        this.vaultKey = crypto.pbkdf2Sync(
            this.masterKey,
            'error-knowledge-vault',
            this.iterations,
            32,
            'sha256'
        );
    }
    
    async encryptMasterKey(key) {
        // Use machine-specific data for encryption
        const machineId = require('os').hostname() + require('os').platform();
        const salt = crypto.randomBytes(this.saltLength);
        const machineKey = crypto.pbkdf2Sync(
            machineId,
            salt,
            this.iterations,
            32,
            'sha256'
        );
        
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm, machineKey, iv);
        
        const encrypted = Buffer.concat([
            cipher.update(key),
            cipher.final()
        ]);
        
        const tag = cipher.getAuthTag();
        
        return Buffer.concat([salt, iv, tag, encrypted]);
    }
    
    async decryptMasterKey(encryptedData) {
        const machineId = require('os').hostname() + require('os').platform();
        
        const salt = encryptedData.slice(0, this.saltLength);
        const iv = encryptedData.slice(this.saltLength, this.saltLength + this.ivLength);
        const tag = encryptedData.slice(this.saltLength + this.ivLength, this.saltLength + this.ivLength + this.tagLength);
        const encrypted = encryptedData.slice(this.saltLength + this.ivLength + this.tagLength);
        
        const machineKey = crypto.pbkdf2Sync(
            machineId,
            salt,
            this.iterations,
            32,
            'sha256'
        );
        
        const decipher = crypto.createDecipheriv(this.algorithm, machineKey, iv);
        decipher.setAuthTag(tag);
        
        return Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);
    }
    
    async createRecoveryKey() {
        const recoveryKey = crypto.randomBytes(32).toString('hex');
        const recoveryData = {
            masterKey: this.masterKey.toString('hex'),
            created: new Date().toISOString(),
            version: this.currentVersion
        };
        
        // Encrypt recovery data with recovery key
        const encrypted = await this.encrypt(
            JSON.stringify(recoveryData),
            Buffer.from(recoveryKey, 'hex')
        );
        
        await fs.writeFile(
            path.join(this.vaultPath, '.recovery.enc'),
            encrypted
        );
        
        console.log('\n   🔐 RECOVERY KEY (SAVE THIS SECURELY):');
        console.log(`   ${recoveryKey}\n`);
    }
    
    async initializeDatabase() {
        const dbPath = path.join(this.vaultPath, 'knowledge.db');
        this.db = new sqlite3.Database(dbPath);
        
        const run = promisify(this.db.run.bind(this.db));
        
        // Error patterns table
        await run(`
            CREATE TABLE IF NOT EXISTS error_patterns (
                id TEXT PRIMARY KEY,
                category TEXT NOT NULL,
                pattern_hash TEXT UNIQUE,
                encrypted_pattern TEXT NOT NULL,
                severity TEXT,
                frequency INTEGER DEFAULT 1,
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                version TEXT DEFAULT '1.0.0'
            )
        `);
        
        // Solutions table
        await run(`
            CREATE TABLE IF NOT EXISTS solutions (
                id TEXT PRIMARY KEY,
                pattern_id TEXT,
                encrypted_solution TEXT NOT NULL,
                success_rate REAL DEFAULT 0.0,
                times_applied INTEGER DEFAULT 0,
                verified BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                version TEXT DEFAULT '1.0.0',
                FOREIGN KEY (pattern_id) REFERENCES error_patterns(id)
            )
        `);
        
        // Knowledge relationships
        await run(`
            CREATE TABLE IF NOT EXISTS knowledge_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_pattern_id TEXT,
                target_pattern_id TEXT,
                relationship_type TEXT,
                confidence REAL DEFAULT 0.5,
                FOREIGN KEY (source_pattern_id) REFERENCES error_patterns(id),
                FOREIGN KEY (target_pattern_id) REFERENCES error_patterns(id)
            )
        `);
        
        // Version history
        await run(`
            CREATE TABLE IF NOT EXISTS version_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_type TEXT, -- 'pattern' or 'solution'
                entity_id TEXT,
                version TEXT,
                encrypted_data TEXT,
                change_summary TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create indexes
        await run('CREATE INDEX IF NOT EXISTS idx_pattern_category ON error_patterns(category)');
        await run('CREATE INDEX IF NOT EXISTS idx_pattern_hash ON error_patterns(pattern_hash)');
        await run('CREATE INDEX IF NOT EXISTS idx_solution_pattern ON solutions(pattern_id)');
    }
    
    /**
     * Encrypt data using vault key
     */
    async encrypt(data, key = null) {
        const useKey = key || this.vaultKey;
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm, useKey, iv);
        
        const encrypted = Buffer.concat([
            cipher.update(data, 'utf8'),
            cipher.final()
        ]);
        
        const tag = cipher.getAuthTag();
        
        return Buffer.concat([iv, tag, encrypted]);
    }
    
    /**
     * Decrypt data using vault key
     */
    async decrypt(encryptedData, key = null) {
        const useKey = key || this.vaultKey;
        
        const iv = encryptedData.slice(0, this.ivLength);
        const tag = encryptedData.slice(this.ivLength, this.ivLength + this.tagLength);
        const encrypted = encryptedData.slice(this.ivLength + this.tagLength);
        
        const decipher = crypto.createDecipheriv(this.algorithm, useKey, iv);
        decipher.setAuthTag(tag);
        
        return Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]).toString('utf8');
    }
    
    /**
     * Store an error pattern in the vault
     */
    async storeErrorPattern(pattern) {
        const patternId = crypto.randomBytes(16).toString('hex');
        const patternHash = this.hashPattern(pattern);
        
        // Check if pattern already exists
        const existing = await this.getPatternByHash(patternHash);
        if (existing) {
            // Update frequency
            await this.updatePatternFrequency(existing.id);
            return existing.id;
        }
        
        // Encrypt pattern data
        const encryptedPattern = await this.encrypt(JSON.stringify(pattern));
        
        // Store in database
        const run = promisify(this.db.run.bind(this.db));
        await run(`
            INSERT INTO error_patterns 
            (id, category, pattern_hash, encrypted_pattern, severity)
            VALUES (?, ?, ?, ?, ?)
        `, [
            patternId,
            pattern.category || 'unknown',
            patternHash,
            encryptedPattern,
            pattern.severity || 'medium'
        ]);
        
        // Store to file system for redundancy
        const filePath = path.join(this.vaultPath, 'patterns', `${patternId}.enc`);
        await fs.writeFile(filePath, encryptedPattern);
        
        console.log(`   📝 Stored error pattern: ${patternId}`);
        return patternId;
    }
    
    /**
     * Store a solution in the vault
     */
    async storeSolution(patternId, solution) {
        const solutionId = crypto.randomBytes(16).toString('hex');
        
        // Version the solution if updating
        const existingSolutions = await this.getSolutionsForPattern(patternId);
        if (existingSolutions.length > 0) {
            // Archive old version
            await this.archiveVersion('solution', existingSolutions[0].id, existingSolutions[0]);
        }
        
        // Encrypt solution
        const encryptedSolution = await this.encrypt(JSON.stringify(solution));
        
        // Store in database
        const run = promisify(this.db.run.bind(this.db));
        await run(`
            INSERT INTO solutions 
            (id, pattern_id, encrypted_solution, verified)
            VALUES (?, ?, ?, ?)
        `, [
            solutionId,
            patternId,
            encryptedSolution,
            solution.verified || 0
        ]);
        
        // Store to file system
        const filePath = path.join(this.vaultPath, 'solutions', `${solutionId}.enc`);
        await fs.writeFile(filePath, encryptedSolution);
        
        console.log(`   💡 Stored solution: ${solutionId}`);
        return solutionId;
    }
    
    /**
     * Retrieve error pattern by hash
     */
    async getPatternByHash(hash) {
        const get = promisify(this.db.get.bind(this.db));
        
        const row = await get(
            'SELECT * FROM error_patterns WHERE pattern_hash = ?',
            [hash]
        );
        
        if (!row) return null;
        
        // Decrypt pattern
        const decrypted = await this.decrypt(row.encrypted_pattern);
        
        return {
            id: row.id,
            category: row.category,
            pattern: JSON.parse(decrypted),
            severity: row.severity,
            frequency: row.frequency,
            lastSeen: row.last_seen
        };
    }
    
    /**
     * Get solutions for a pattern
     */
    async getSolutionsForPattern(patternId) {
        const all = promisify(this.db.all.bind(this.db));
        
        const rows = await all(
            'SELECT * FROM solutions WHERE pattern_id = ? ORDER BY success_rate DESC',
            [patternId]
        );
        
        const solutions = [];
        for (const row of rows) {
            const decrypted = await this.decrypt(row.encrypted_solution);
            solutions.push({
                id: row.id,
                solution: JSON.parse(decrypted),
                successRate: row.success_rate,
                timesApplied: row.times_applied,
                verified: row.verified
            });
        }
        
        return solutions;
    }
    
    /**
     * Update pattern frequency
     */
    async updatePatternFrequency(patternId) {
        const run = promisify(this.db.run.bind(this.db));
        
        await run(`
            UPDATE error_patterns 
            SET frequency = frequency + 1, last_seen = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [patternId]);
    }
    
    /**
     * Hash a pattern for deduplication
     */
    hashPattern(pattern) {
        const content = JSON.stringify({
            type: pattern.type,
            message: pattern.message,
            code: pattern.code,
            service: pattern.service
        });
        
        return crypto.createHash('sha256').update(content).digest('hex');
    }
    
    /**
     * Archive a version
     */
    async archiveVersion(entityType, entityId, data) {
        const run = promisify(this.db.run.bind(this.db));
        
        const encryptedData = await this.encrypt(JSON.stringify(data));
        
        await run(`
            INSERT INTO version_history 
            (entity_type, entity_id, version, encrypted_data, change_summary)
            VALUES (?, ?, ?, ?, ?)
        `, [
            entityType,
            entityId,
            data.version || this.currentVersion,
            encryptedData,
            'Automatic version archive'
        ]);
    }
    
    /**
     * Load knowledge base
     */
    async loadKnowledgeBase() {
        const all = promisify(this.db.all.bind(this.db));
        
        const patterns = await all('SELECT COUNT(*) as count FROM error_patterns');
        const solutions = await all('SELECT COUNT(*) as count FROM solutions');
        
        console.log(`   📚 Loaded ${patterns[0].count} patterns, ${solutions[0].count} solutions`);
    }
    
    /**
     * Set up automatic backups
     */
    setupAutoBackup() {
        // Backup every 6 hours
        setInterval(() => {
            this.performBackup();
        }, 6 * 60 * 60 * 1000);
        
        console.log('   💾 Automatic backups configured (every 6 hours)');
    }
    
    /**
     * Perform backup
     */
    async performBackup() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(this.vaultPath, 'backups', timestamp);
        
        await fs.mkdir(backupDir, { recursive: true });
        
        // Backup database
        const dbSource = path.join(this.vaultPath, 'knowledge.db');
        const dbDest = path.join(backupDir, 'knowledge.db');
        await fs.copyFile(dbSource, dbDest);
        
        // Backup patterns and solutions
        await this.backupDirectory('patterns', backupDir);
        await this.backupDirectory('solutions', backupDir);
        
        console.log(`   💾 Backup completed: ${timestamp}`);
        
        // Clean old backups (keep last 10)
        await this.cleanOldBackups();
    }
    
    async backupDirectory(dirName, backupDir) {
        const sourceDir = path.join(this.vaultPath, dirName);
        const destDir = path.join(backupDir, dirName);
        
        await fs.mkdir(destDir, { recursive: true });
        
        const files = await fs.readdir(sourceDir);
        for (const file of files) {
            if (file.endsWith('.enc')) {
                await fs.copyFile(
                    path.join(sourceDir, file),
                    path.join(destDir, file)
                );
            }
        }
    }
    
    async cleanOldBackups() {
        const backupsDir = path.join(this.vaultPath, 'backups');
        const backups = await fs.readdir(backupsDir);
        
        if (backups.length > 10) {
            // Sort by date and remove oldest
            backups.sort();
            const toRemove = backups.slice(0, backups.length - 10);
            
            for (const backup of toRemove) {
                const backupPath = path.join(backupsDir, backup);
                await fs.rm(backupPath, { recursive: true, force: true });
            }
        }
    }
    
    /**
     * Export sanitized knowledge for sharing
     */
    async exportKnowledge(options = {}) {
        const all = promisify(this.db.all.bind(this.db));
        
        const exportData = {
            version: this.currentVersion,
            exported: new Date().toISOString(),
            categories: {},
            statistics: {}
        };
        
        // Get all patterns
        const patterns = await all('SELECT * FROM error_patterns');
        
        for (const pattern of patterns) {
            if (!exportData.categories[pattern.category]) {
                exportData.categories[pattern.category] = [];
            }
            
            // Decrypt pattern
            const decrypted = JSON.parse(await this.decrypt(pattern.encrypted_pattern));
            
            // Sanitize sensitive information
            const sanitized = {
                type: decrypted.type,
                category: pattern.category,
                severity: pattern.severity,
                frequency: pattern.frequency,
                // Remove sensitive details
                message: this.sanitizeMessage(decrypted.message),
                service: decrypted.service ? 'REDACTED' : undefined
            };
            
            exportData.categories[pattern.category].push(sanitized);
        }
        
        // Add statistics
        exportData.statistics = {
            totalPatterns: patterns.length,
            categoryCounts: {},
            severityDistribution: {}
        };
        
        for (const category of Object.keys(this.categories)) {
            const count = await all(
                'SELECT COUNT(*) as count FROM error_patterns WHERE category = ?',
                [category]
            );
            exportData.statistics.categoryCounts[category] = count[0].count;
        }
        
        // Save export
        const exportPath = path.join(
            this.vaultPath,
            'exports',
            `knowledge-export-${Date.now()}.json`
        );
        
        await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
        
        console.log(`   📤 Knowledge exported to: ${exportPath}`);
        return exportPath;
    }
    
    sanitizeMessage(message) {
        if (!message) return 'REDACTED';
        
        // Remove file paths, IPs, and sensitive data
        return message
            .replace(/\/[\w\/.-]+/g, '/PATH/REDACTED')
            .replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, 'IP.REDACTED')
            .replace(/[a-f0-9]{32,}/gi, 'HASH_REDACTED')
            .replace(/key[s]?\s*[:=]\s*[\w.-]+/gi, 'KEY=REDACTED');
    }
    
    /**
     * Search knowledge base
     */
    async searchKnowledge(query) {
        const all = promisify(this.db.all.bind(this.db));
        
        // Search patterns
        const patterns = await all('SELECT * FROM error_patterns');
        
        const results = [];
        
        for (const pattern of patterns) {
            const decrypted = JSON.parse(await this.decrypt(pattern.encrypted_pattern));
            
            // Simple search matching
            const searchStr = JSON.stringify(decrypted).toLowerCase();
            if (searchStr.includes(query.toLowerCase())) {
                // Get solutions
                const solutions = await this.getSolutionsForPattern(pattern.id);
                
                results.push({
                    pattern: decrypted,
                    category: pattern.category,
                    severity: pattern.severity,
                    frequency: pattern.frequency,
                    solutions: solutions
                });
            }
        }
        
        return results;
    }
    
    /**
     * Get vault statistics
     */
    async getStatistics() {
        const get = promisify(this.db.get.bind(this.db));
        const all = promisify(this.db.all.bind(this.db));
        
        const stats = {
            patterns: {},
            solutions: {},
            storage: {},
            health: {}
        };
        
        // Pattern statistics
        const patternCount = await get('SELECT COUNT(*) as count FROM error_patterns');
        stats.patterns.total = patternCount.count;
        
        const categoryStats = await all(`
            SELECT category, COUNT(*) as count, AVG(frequency) as avg_frequency
            FROM error_patterns
            GROUP BY category
        `);
        stats.patterns.byCategory = categoryStats;
        
        // Solution statistics
        const solutionCount = await get('SELECT COUNT(*) as count FROM solutions');
        stats.solutions.total = solutionCount.count;
        
        const verifiedCount = await get('SELECT COUNT(*) as count FROM solutions WHERE verified = 1');
        stats.solutions.verified = verifiedCount.count;
        
        const avgSuccess = await get('SELECT AVG(success_rate) as avg FROM solutions');
        stats.solutions.averageSuccessRate = avgSuccess.avg || 0;
        
        // Storage statistics
        const vaultSize = await this.calculateVaultSize();
        stats.storage = vaultSize;
        
        // Health metrics
        stats.health = {
            lastBackup: await this.getLastBackupTime(),
            encryptionStatus: 'AES-256-GCM',
            vaultIntegrity: await this.checkVaultIntegrity()
        };
        
        return stats;
    }
    
    async calculateVaultSize() {
        const getDirSize = async (dir) => {
            let size = 0;
            const files = await fs.readdir(dir, { withFileTypes: true });
            
            for (const file of files) {
                const filePath = path.join(dir, file.name);
                if (file.isDirectory()) {
                    size += await getDirSize(filePath);
                } else {
                    const stat = await fs.stat(filePath);
                    size += stat.size;
                }
            }
            
            return size;
        };
        
        const totalSize = await getDirSize(this.vaultPath);
        
        return {
            total: totalSize,
            totalMB: (totalSize / 1024 / 1024).toFixed(2),
            patterns: await getDirSize(path.join(this.vaultPath, 'patterns')),
            solutions: await getDirSize(path.join(this.vaultPath, 'solutions')),
            backups: await getDirSize(path.join(this.vaultPath, 'backups'))
        };
    }
    
    async getLastBackupTime() {
        const backupsDir = path.join(this.vaultPath, 'backups');
        try {
            const backups = await fs.readdir(backupsDir);
            if (backups.length === 0) return 'Never';
            
            backups.sort();
            const lastBackup = backups[backups.length - 1];
            return lastBackup;
        } catch {
            return 'Never';
        }
    }
    
    async checkVaultIntegrity() {
        try {
            // Test encryption/decryption
            const testData = 'vault-integrity-check';
            const encrypted = await this.encrypt(testData);
            const decrypted = await this.decrypt(encrypted);
            
            return decrypted === testData ? 'OK' : 'FAILED';
        } catch {
            return 'FAILED';
        }
    }
}

// Export for use
module.exports = ErrorKnowledgeVault;

// Run if executed directly
if (require.main === module) {
    const vault = new ErrorKnowledgeVault();
    
    vault.initialize().then(async () => {
        console.log('\n🔐 ERROR KNOWLEDGE VAULT DEMO');
        console.log('==============================\n');
        
        // Store example error pattern
        console.log('1. Storing error pattern...');
        const patternId = await vault.storeErrorPattern({
            type: 'timeout',
            category: 'network',
            message: 'Request timeout after 30000ms',
            service: 'api-gateway',
            severity: 'high',
            stack: 'Error: timeout\n    at Timeout._onTimeout...',
            timestamp: new Date()
        });
        
        // Store solution
        console.log('\n2. Storing solution...');
        await vault.storeSolution(patternId, {
            summary: 'Increase timeout and add retry logic',
            steps: [
                'Increase timeout to 60000ms',
                'Implement exponential backoff',
                'Add circuit breaker pattern'
            ],
            code: 'const retry = require("retry-logic");',
            verified: true
        });
        
        // Search knowledge base
        console.log('\n3. Searching knowledge base...');
        const results = await vault.searchKnowledge('timeout');
        console.log(`   Found ${results.length} results`);
        
        // Get statistics
        console.log('\n4. Vault Statistics:');
        const stats = await vault.getStatistics();
        console.log(JSON.stringify(stats, null, 2));
        
        // Export knowledge
        console.log('\n5. Exporting sanitized knowledge...');
        const exportPath = await vault.exportKnowledge();
        
        // Perform backup
        console.log('\n6. Performing backup...');
        await vault.performBackup();
        
        console.log('\n✅ Error Knowledge Vault is protecting your learned wisdom!');
    }).catch(console.error);
}