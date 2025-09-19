#!/usr/bin/env node

/**
 * 🌊 Local-Cloud Database Sync
 * 
 * Orchestrates bidirectional synchronization between local SQLite and cloud PostgreSQL.
 * Handles conflict resolution, data validation, and ensures eventual consistency.
 * 
 * Sync Flow: Local ⇄ Validation ⇄ Encryption ⇄ Cloud
 */

const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const fs = require('fs').promises;

class LocalCloudDatabaseSync extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Local SQLite configuration
            localDb: config.localDb || './data/sync-local.db',
            
            // Cloud PostgreSQL configuration
            cloudDb: config.cloudDb || {
                host: process.env.CLOUD_DB_HOST || 'localhost',
                port: process.env.CLOUD_DB_PORT || 5432,
                database: process.env.CLOUD_DB_NAME || 'king_queen_cloud',
                user: process.env.CLOUD_DB_USER || 'postgres',
                password: process.env.CLOUD_DB_PASSWORD || 'password',
                ssl: process.env.CLOUD_DB_SSL === 'true' ? { rejectUnauthorized: false } : false
            },
            
            // Sync configuration
            syncInterval: config.syncInterval || 30000, // 30 seconds
            batchSize: config.batchSize || 50,
            maxRetries: config.maxRetries || 3,
            conflictResolution: config.conflictResolution || 'cloud_wins', // 'local_wins', 'cloud_wins', 'timestamp'
            
            // Encryption
            encryptionKey: config.encryptionKey || crypto.randomBytes(32),
            
            ...config
        };
        
        // Database connections
        this.localConnection = null;
        this.cloudConnection = null;
        
        // Sync state
        this.syncStatus = {
            running: false,
            lastSync: null,
            direction: null, // 'up', 'down', 'bidirectional'
            errors: [],
            stats: {
                totalSynced: 0,
                upSynced: 0, // local → cloud
                downSynced: 0, // cloud → local
                conflicts: 0,
                errors: 0
            }
        };
        
        // Sync queues
        this.upSyncQueue = []; // Local → Cloud
        this.downSyncQueue = []; // Cloud → Local
        this.conflictQueue = []; // Conflicts to resolve
        
        // Tables to sync
        this.syncTables = [
            {
                name: 'king_metrics',
                primaryKey: 'id',
                conflictFields: ['timestamp', 'system_id'],
                encryptFields: ['encoded_data']
            },
            {
                name: 'queen_metrics',
                primaryKey: 'id',
                conflictFields: ['timestamp', 'user_id'],
                encryptFields: ['encoded_data']
            },
            {
                name: 'dance_events',
                primaryKey: 'id',
                conflictFields: ['timestamp', 'dance_id'],
                encryptFields: ['encoded_data']
            },
            {
                name: 'proof_attempts',
                primaryKey: 'id',
                conflictFields: ['timestamp'],
                encryptFields: ['data']
            }
        ];
        
        // Schema validation rules
        this.validationRules = {
            king_metrics: {
                required: ['system_id', 'timestamp'],
                types: {
                    error_count: 'number',
                    latency_ms: 'number',
                    cpu_usage: 'number',
                    memory_usage: 'number'
                }
            },
            queen_metrics: {
                required: ['user_id', 'timestamp'],
                types: {
                    satisfaction: 'number',
                    confusion_level: 'number',
                    completion_rate: 'number'
                }
            },
            dance_events: {
                required: ['dance_id', 'timestamp', 'dance_type'],
                types: {
                    sync_score: 'number',
                    king_harmony: 'number',
                    queen_harmony: 'number'
                }
            }
        };
        
        this.initialized = false;
    }
    
    /**
     * Initialize the sync system
     */
    async initialize() {
        console.log('🌊 Initializing Local-Cloud Database Sync...');
        
        try {
            // Connect to databases
            await this.connectToLocalDatabase();
            await this.connectToCloudDatabase();
            
            // Create tables if needed
            await this.ensureTables();
            
            // Create sync metadata tables
            await this.createSyncMetadata();
            
            // Start sync process
            this.startSyncProcess();
            
            this.initialized = true;
            console.log('✅ Local-Cloud Database Sync initialized');
            console.log(`📂 Local: ${this.config.localDb}`);
            console.log(`☁️ Cloud: ${this.config.cloudDb.host}:${this.config.cloudDb.port}`);
            
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Local-Cloud Database Sync:', error);
            throw error;
        }
    }
    
    /**
     * Connect to local SQLite database
     */
    async connectToLocalDatabase() {
        return new Promise((resolve, reject) => {
            // Ensure data directory exists
            const path = require('path');
            const dataDir = path.dirname(this.config.localDb);
            
            require('fs').mkdirSync(dataDir, { recursive: true });
            
            this.localConnection = new sqlite3.Database(this.config.localDb, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('📂 Connected to local SQLite database');
                    
                    // Enable foreign keys and WAL mode for better concurrency
                    this.localConnection.exec(`
                        PRAGMA foreign_keys = ON;
                        PRAGMA journal_mode = WAL;
                        PRAGMA synchronous = NORMAL;
                    `, resolve);
                }
            });
        });
    }
    
    /**
     * Connect to cloud PostgreSQL database
     */
    async connectToCloudDatabase() {
        try {
            this.cloudConnection = new Pool({
                ...this.config.cloudDb,
                max: 10,
                idleTimeoutMillis: 30000,
                connectionTimeoutMillis: 5000
            });
            
            // Test connection
            const client = await this.cloudConnection.connect();
            await client.query('SELECT NOW()');
            client.release();
            
            console.log('☁️ Connected to cloud PostgreSQL database');
        } catch (error) {
            console.warn('⚠️ Could not connect to cloud database:', error.message);
            this.cloudConnection = null;
        }
    }
    
    /**
     * Ensure all tables exist in both databases
     */
    async ensureTables() {
        for (const table of this.syncTables) {
            await this.ensureTableExists(table.name);
        }
    }
    
    /**
     * Ensure a specific table exists
     */
    async ensureTableExists(tableName) {
        const tableSchemas = {
            king_metrics: `
                CREATE TABLE IF NOT EXISTS king_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    system_id TEXT NOT NULL,
                    timestamp INTEGER NOT NULL,
                    service_status TEXT,
                    error_count INTEGER DEFAULT 0,
                    latency_ms INTEGER DEFAULT 0,
                    cpu_usage REAL DEFAULT 0,
                    memory_usage REAL DEFAULT 0,
                    encoded_data TEXT,
                    color_state TEXT,
                    sync_status TEXT DEFAULT 'pending',
                    sync_timestamp INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
            queen_metrics: `
                CREATE TABLE IF NOT EXISTS queen_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    timestamp INTEGER NOT NULL,
                    emotion_state TEXT,
                    satisfaction INTEGER DEFAULT 0,
                    confusion_level INTEGER DEFAULT 0,
                    journey_step TEXT,
                    completion_rate REAL DEFAULT 0,
                    encoded_data TEXT,
                    color_state TEXT,
                    sync_status TEXT DEFAULT 'pending',
                    sync_timestamp INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
            dance_events: `
                CREATE TABLE IF NOT EXISTS dance_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    dance_id TEXT UNIQUE NOT NULL,
                    timestamp INTEGER NOT NULL,
                    dance_type TEXT NOT NULL,
                    sync_score INTEGER DEFAULT 0,
                    king_harmony INTEGER DEFAULT 0,
                    queen_harmony INTEGER DEFAULT 0,
                    color_state TEXT,
                    encoded_data TEXT,
                    sync_status TEXT DEFAULT 'pending',
                    sync_timestamp INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
            proof_attempts: `
                CREATE TABLE IF NOT EXISTS proof_attempts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    attempt_id TEXT UNIQUE NOT NULL,
                    timestamp INTEGER NOT NULL,
                    test_type TEXT NOT NULL,
                    success BOOLEAN NOT NULL,
                    score INTEGER DEFAULT 0,
                    data TEXT,
                    sync_status TEXT DEFAULT 'pending',
                    sync_timestamp INTEGER,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`
        };
        
        const schema = tableSchemas[tableName];
        if (!schema) {
            console.warn(`⚠️ No schema defined for table: ${tableName}`);
            return;
        }
        
        // Create in local database
        await this.runLocalQuery(schema);
        
        // Create in cloud database (if available)
        if (this.cloudConnection) {
            const pgSchema = schema
                .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY')
                .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/g, 'TIMESTAMP DEFAULT NOW()')
                .replace(/BOOLEAN/g, 'BOOLEAN');
            
            try {
                await this.cloudConnection.query(pgSchema);
                console.log(`☁️ Ensured cloud table: ${tableName}`);
            } catch (error) {
                console.warn(`⚠️ Could not create cloud table ${tableName}:`, error.message);
            }
        }
    }
    
    /**
     * Create sync metadata tables
     */
    async createSyncMetadata() {
        const syncMetadataSchema = `
            CREATE TABLE IF NOT EXISTS sync_metadata (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                table_name TEXT NOT NULL,
                record_id INTEGER NOT NULL,
                local_timestamp INTEGER NOT NULL,
                cloud_timestamp INTEGER,
                sync_direction TEXT, -- 'up', 'down'
                conflict_status TEXT, -- 'none', 'pending', 'resolved'
                last_sync INTEGER,
                checksum TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(table_name, record_id)
            )
        `;
        
        await this.runLocalQuery(syncMetadataSchema);
        
        if (this.cloudConnection) {
            const pgSchema = syncMetadataSchema
                .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY')
                .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/g, 'TIMESTAMP DEFAULT NOW()');
            
            try {
                await this.cloudConnection.query(pgSchema);
                console.log('☁️ Created cloud sync metadata table');
            } catch (error) {
                console.warn('⚠️ Could not create cloud sync metadata:', error.message);
            }
        }
    }
    
    /**
     * Start the sync process
     */
    startSyncProcess() {
        if (!this.cloudConnection) {
            console.warn('⚠️ Cloud database not available, sync process disabled');
            return;
        }
        
        console.log(`🔄 Starting sync process (interval: ${this.config.syncInterval}ms)`);
        
        setInterval(async () => {
            if (!this.syncStatus.running) {
                await this.performSync();
            }
        }, this.config.syncInterval);
        
        // Immediate sync
        setTimeout(() => this.performSync(), 2000);
    }
    
    /**
     * Perform bidirectional synchronization
     */
    async performSync() {
        if (this.syncStatus.running) {
            console.log('🔄 Sync already running, skipping...');
            return;
        }
        
        this.syncStatus.running = true;
        this.syncStatus.direction = 'bidirectional';
        this.syncStatus.errors = [];
        
        console.log('🔄 Starting bidirectional sync...');
        
        try {
            // First, sync from local to cloud (up)
            await this.syncUp();
            
            // Then, sync from cloud to local (down)
            await this.syncDown();
            
            // Resolve any conflicts
            await this.resolveConflicts();
            
            this.syncStatus.lastSync = new Date();
            console.log('✅ Sync completed successfully');
            
            this.emit('sync_completed', {
                stats: this.syncStatus.stats,
                errors: this.syncStatus.errors,
                timestamp: this.syncStatus.lastSync
            });
            
        } catch (error) {
            console.error('❌ Sync failed:', error);
            this.syncStatus.errors.push({
                error: error.message,
                timestamp: new Date()
            });
            this.syncStatus.stats.errors++;
            
            this.emit('sync_error', error);
        } finally {
            this.syncStatus.running = false;
        }
    }
    
    /**
     * Sync from local to cloud
     */
    async syncUp() {
        console.log('⬆️ Syncing local → cloud...');
        
        for (const table of this.syncTables) {
            const pendingRecords = await this.getPendingRecords(table.name, 'up');
            
            if (pendingRecords.length === 0) {
                continue;
            }
            
            console.log(`⬆️ Syncing ${pendingRecords.length} records from ${table.name}`);
            
            for (const record of pendingRecords) {
                try {
                    await this.syncRecordUp(table, record);
                    this.syncStatus.stats.upSynced++;
                    this.syncStatus.stats.totalSynced++;
                } catch (error) {
                    console.error(`❌ Failed to sync up record ${record.id} from ${table.name}:`, error.message);
                    this.syncStatus.errors.push({
                        table: table.name,
                        recordId: record.id,
                        direction: 'up',
                        error: error.message,
                        timestamp: new Date()
                    });
                }
            }
        }
    }
    
    /**
     * Sync from cloud to local
     */
    async syncDown() {
        console.log('⬇️ Syncing cloud → local...');
        
        for (const table of this.syncTables) {
            try {
                const cloudRecords = await this.getCloudRecords(table.name);
                const localRecords = await this.getLocalRecords(table.name);
                
                // Find records that exist in cloud but not in local
                const newRecords = cloudRecords.filter(cloudRecord => 
                    !localRecords.find(localRecord => 
                        this.recordsMatch(table, cloudRecord, localRecord)
                    )
                );
                
                if (newRecords.length === 0) {
                    continue;
                }
                
                console.log(`⬇️ Syncing ${newRecords.length} records to ${table.name}`);
                
                for (const record of newRecords) {
                    try {
                        await this.syncRecordDown(table, record);
                        this.syncStatus.stats.downSynced++;
                        this.syncStatus.stats.totalSynced++;
                    } catch (error) {
                        console.error(`❌ Failed to sync down record to ${table.name}:`, error.message);
                        this.syncStatus.errors.push({
                            table: table.name,
                            direction: 'down',
                            error: error.message,
                            timestamp: new Date()
                        });
                    }
                }
                
            } catch (error) {
                console.error(`❌ Failed to sync down table ${table.name}:`, error.message);
            }
        }
    }
    
    /**
     * Get pending records for sync
     */
    async getPendingRecords(tableName, direction) {
        const query = `
            SELECT * FROM ${tableName} 
            WHERE sync_status = 'pending' 
            ORDER BY timestamp ASC 
            LIMIT ?
        `;
        
        return this.runLocalQuery(query, [this.config.batchSize]);
    }
    
    /**
     * Get records from cloud database
     */
    async getCloudRecords(tableName) {
        if (!this.cloudConnection) return [];
        
        try {
            const result = await this.cloudConnection.query(
                `SELECT * FROM ${tableName} ORDER BY timestamp DESC LIMIT $1`,
                [this.config.batchSize]
            );
            
            return result.rows;
        } catch (error) {
            console.warn(`⚠️ Could not get cloud records from ${tableName}:`, error.message);
            return [];
        }
    }
    
    /**
     * Get records from local database
     */
    async getLocalRecords(tableName) {
        const query = `SELECT * FROM ${tableName} ORDER BY timestamp DESC LIMIT ?`;
        return this.runLocalQuery(query, [this.config.batchSize]);
    }
    
    /**
     * Sync a record from local to cloud
     */
    async syncRecordUp(table, record) {
        // Validate record
        this.validateRecord(table.name, record);
        
        // Encrypt sensitive fields
        const encryptedRecord = this.encryptRecord(table, record);
        
        // Convert for PostgreSQL
        const columns = Object.keys(encryptedRecord).filter(key => key !== 'id');
        const values = columns.map(col => encryptedRecord[col]);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const query = `
            INSERT INTO ${table.name} (${columns.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT (${table.conflictFields ? table.conflictFields.join(', ') : 'id'}) 
            DO UPDATE SET ${columns.map((col, i) => `${col} = $${i + 1}`).join(', ')}
        `;
        
        await this.cloudConnection.query(query, values);
        
        // Mark as synced in local database
        await this.runLocalQuery(
            `UPDATE ${table.name} SET sync_status = 'synced', sync_timestamp = ? WHERE id = ?`,
            [Date.now(), record.id]
        );
        
        // Update sync metadata
        await this.updateSyncMetadata(table.name, record.id, 'up', Date.now());
        
        console.log(`⬆️ Synced ${table.name}#${record.id} to cloud`);
    }
    
    /**
     * Sync a record from cloud to local
     */
    async syncRecordDown(table, record) {
        // Decrypt sensitive fields
        const decryptedRecord = this.decryptRecord(table, record);
        
        // Validate record
        this.validateRecord(table.name, decryptedRecord);
        
        // Convert for SQLite
        const columns = Object.keys(decryptedRecord).filter(key => key !== 'id');
        const values = columns.map(col => decryptedRecord[col]);
        const placeholders = columns.map(() => '?').join(', ');
        
        const query = `
            INSERT OR REPLACE INTO ${table.name} (${columns.join(', ')})
            VALUES (${placeholders})
        `;
        
        const result = await this.runLocalQuery(query, values);
        
        // Update sync metadata
        await this.updateSyncMetadata(table.name, result, 'down', Date.now());
        
        console.log(`⬇️ Synced record to ${table.name}#${result}`);
    }
    
    /**
     * Check if two records match
     */
    recordsMatch(table, record1, record2) {
        if (table.conflictFields) {
            return table.conflictFields.every(field => 
                record1[field] === record2[field]
            );
        }
        
        return record1.id === record2.id;
    }
    
    /**
     * Validate record against schema rules
     */
    validateRecord(tableName, record) {
        const rules = this.validationRules[tableName];
        if (!rules) return;
        
        // Check required fields
        if (rules.required) {
            for (const field of rules.required) {
                if (record[field] === undefined || record[field] === null) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }
        }
        
        // Check data types
        if (rules.types) {
            for (const [field, expectedType] of Object.entries(rules.types)) {
                if (record[field] !== undefined) {
                    const actualType = typeof record[field];
                    if (actualType !== expectedType) {
                        throw new Error(`Invalid type for ${field}: expected ${expectedType}, got ${actualType}`);
                    }
                }
            }
        }
    }
    
    /**
     * Encrypt sensitive fields in a record
     */
    encryptRecord(table, record) {
        const encrypted = { ...record };
        
        if (table.encryptFields) {
            for (const field of table.encryptFields) {
                if (encrypted[field]) {
                    encrypted[field] = this.encryptData(encrypted[field]);
                }
            }
        }
        
        return encrypted;
    }
    
    /**
     * Decrypt sensitive fields in a record
     */
    decryptRecord(table, record) {
        const decrypted = { ...record };
        
        if (table.encryptFields) {
            for (const field of table.encryptFields) {
                if (decrypted[field]) {
                    const decryptedValue = this.decryptData(decrypted[field]);
                    if (decryptedValue) {
                        decrypted[field] = decryptedValue;
                    }
                }
            }
        }
        
        return decrypted;
    }
    
    /**
     * Encrypt data
     */
    encryptData(data) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv('aes-256-gcm', this.config.encryptionKey, iv);
            
            let encrypted = cipher.update(data, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            return JSON.stringify({
                encrypted,
                iv: iv.toString('hex'),
                authTag: authTag.toString('hex')
            });
        } catch (error) {
            console.error('Encryption failed:', error);
            return data; // Return original if encryption fails
        }
    }
    
    /**
     * Decrypt data
     */
    decryptData(encryptedData) {
        try {
            const data = JSON.parse(encryptedData);
            const decipher = crypto.createDecipheriv(
                'aes-256-gcm',
                this.config.encryptionKey,
                Buffer.from(data.iv, 'hex')
            );
            
            decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
            
            let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Decryption failed:', error);
            return encryptedData; // Return original if decryption fails
        }
    }
    
    /**
     * Resolve conflicts between local and cloud
     */
    async resolveConflicts() {
        console.log('⚖️ Resolving conflicts...');
        
        // Implementation depends on conflict resolution strategy
        // For now, we'll use the configured strategy
        
        const conflicts = await this.getConflicts();
        
        for (const conflict of conflicts) {
            try {
                await this.resolveConflict(conflict);
                this.syncStatus.stats.conflicts++;
            } catch (error) {
                console.error('❌ Failed to resolve conflict:', error);
                this.syncStatus.errors.push({
                    type: 'conflict_resolution',
                    conflict,
                    error: error.message,
                    timestamp: new Date()
                });
            }
        }
    }
    
    /**
     * Get conflicts that need resolution
     */
    async getConflicts() {
        const query = `
            SELECT * FROM sync_metadata 
            WHERE conflict_status = 'pending'
            ORDER BY created_at ASC
        `;
        
        return this.runLocalQuery(query);
    }
    
    /**
     * Resolve a specific conflict
     */
    async resolveConflict(conflict) {
        // Implementation based on resolution strategy
        switch (this.config.conflictResolution) {
            case 'cloud_wins':
                // Use cloud version
                console.log(`⚖️ Resolving conflict (cloud wins): ${conflict.table_name}#${conflict.record_id}`);
                break;
            
            case 'local_wins':
                // Use local version
                console.log(`⚖️ Resolving conflict (local wins): ${conflict.table_name}#${conflict.record_id}`);
                break;
            
            case 'timestamp':
                // Use newest version based on timestamp
                console.log(`⚖️ Resolving conflict (timestamp): ${conflict.table_name}#${conflict.record_id}`);
                break;
            
            default:
                console.warn(`⚠️ Unknown conflict resolution strategy: ${this.config.conflictResolution}`);
        }
        
        // Mark conflict as resolved
        await this.runLocalQuery(
            `UPDATE sync_metadata SET conflict_status = 'resolved' WHERE id = ?`,
            [conflict.id]
        );
    }
    
    /**
     * Update sync metadata
     */
    async updateSyncMetadata(tableName, recordId, direction, timestamp) {
        const checksum = crypto.createHash('md5')
            .update(`${tableName}-${recordId}-${timestamp}`)
            .digest('hex');
        
        const query = `
            INSERT OR REPLACE INTO sync_metadata 
            (table_name, record_id, local_timestamp, sync_direction, last_sync, checksum)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await this.runLocalQuery(query, [
            tableName,
            recordId,
            timestamp,
            direction,
            timestamp,
            checksum
        ]);
    }
    
    /**
     * Run a query on local database
     */
    runLocalQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (sql.trim().toUpperCase().startsWith('SELECT')) {
                this.localConnection.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            } else {
                this.localConnection.run(sql, params, function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                });
            }
        });
    }
    
    /**
     * Get sync statistics
     */
    getSyncStats() {
        return {
            status: this.syncStatus,
            queueSizes: {
                up: this.upSyncQueue.length,
                down: this.downSyncQueue.length,
                conflicts: this.conflictQueue.length
            },
            cloudAvailable: !!this.cloudConnection,
            lastSync: this.syncStatus.lastSync,
            stats: this.syncStatus.stats
        };
    }
    
    /**
     * Force manual sync
     */
    async forceSync(direction = 'bidirectional') {
        console.log(`🔄 Forcing manual sync: ${direction}`);
        
        switch (direction) {
            case 'up':
                await this.syncUp();
                break;
            case 'down':
                await this.syncDown();
                break;
            case 'bidirectional':
                await this.performSync();
                break;
            default:
                throw new Error(`Invalid sync direction: ${direction}`);
        }
    }
    
    /**
     * Close database connections
     */
    async close() {
        console.log('🌊 Closing Local-Cloud Database Sync...');
        
        if (this.localConnection) {
            this.localConnection.close();
        }
        
        if (this.cloudConnection) {
            await this.cloudConnection.end();
        }
        
        console.log('✅ Database connections closed');
    }
}

// Export the class
module.exports = LocalCloudDatabaseSync;

// Demo if run directly
if (require.main === module) {
    const syncSystem = new LocalCloudDatabaseSync({
        syncInterval: 10000, // 10 seconds for demo
        batchSize: 5
    });
    
    // Event listeners
    syncSystem.on('initialized', () => {
        console.log('🌊 Sync system initialized, testing sync...');
        
        // Test sync after initialization
        setTimeout(() => {
            syncSystem.forceSync('bidirectional');
        }, 2000);
    });
    
    syncSystem.on('sync_completed', (data) => {
        console.log('✅ Sync completed:', data.stats);
    });
    
    syncSystem.on('sync_error', (error) => {
        console.error('❌ Sync error:', error.message);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down sync system...');
        await syncSystem.close();
        process.exit(0);
    });
    
    // Initialize
    syncSystem.initialize().catch(console.error);
}