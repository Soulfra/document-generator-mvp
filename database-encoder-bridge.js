#!/usr/bin/env node

/**
 * 🌉 Database Encoder Bridge
 * 
 * Bridges local SQLite and cloud PostgreSQL with encrypted encoding.
 * Transforms data through COBOL → Color → Music → Database layers.
 * 
 * Flow: Local DB → Encoder → Color State → Music Harmony → Decoder → Cloud DB
 */

const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class DatabaseEncoderBridge extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Local SQLite configuration
            localDb: config.localDb || './data/king-queen-local.db',
            
            // Cloud PostgreSQL configuration
            cloudDb: config.cloudDb || {
                host: process.env.CLOUD_DB_HOST || 'localhost',
                port: process.env.CLOUD_DB_PORT || 5432,
                database: process.env.CLOUD_DB_NAME || 'king_queen_cloud',
                user: process.env.CLOUD_DB_USER || 'postgres',
                password: process.env.CLOUD_DB_PASSWORD || 'password'
            },
            
            // Encoding configuration
            encryptionKey: config.encryptionKey || crypto.randomBytes(32),
            compressionLevel: config.compressionLevel || 'medium',
            syncInterval: config.syncInterval || 30000, // 30 seconds
            
            ...config
        };
        
        // Database connections
        this.localConnection = null;
        this.cloudConnection = null;
        
        // COBOL-style data structure definitions
        this.cobolStructures = {
            '01-KING-RECORD': {
                '05-SYSTEM-ID': { PIC: 'X(20)', length: 20 },
                '05-TIMESTAMP': { PIC: '9(14)', length: 14 },
                '05-SERVICE-STATUS': { PIC: 'X(10)', length: 10 },
                '05-ERROR-COUNT': { PIC: '9(5)', length: 5 },
                '05-LATENCY-MS': { PIC: '9(7)', length: 7 },
                '05-CPU-USAGE': { PIC: '9(3)V99', length: 5 },
                '05-MEMORY-USAGE': { PIC: '9(3)V99', length: 5 }
            },
            '01-QUEEN-RECORD': {
                '05-USER-ID': { PIC: 'X(20)', length: 20 },
                '05-TIMESTAMP': { PIC: '9(14)', length: 14 },
                '05-EMOTION-STATE': { PIC: 'X(15)', length: 15 },
                '05-SATISFACTION': { PIC: '9(3)', length: 3 },
                '05-CONFUSION-LEVEL': { PIC: '9(3)', length: 3 },
                '05-JOURNEY-STEP': { PIC: 'X(50)', length: 50 },
                '05-COMPLETION-RATE': { PIC: '9(3)V99', length: 5 }
            },
            '01-DANCE-RECORD': {
                '05-DANCE-ID': { PIC: 'X(16)', length: 16 },
                '05-TIMESTAMP': { PIC: '9(14)', length: 14 },
                '05-DANCE-TYPE': { PIC: 'X(10)', length: 10 },
                '05-SYNC-SCORE': { PIC: '9(3)', length: 3 },
                '05-KING-HARMONY': { PIC: '9(4)', length: 4 },
                '05-QUEEN-HARMONY': { PIC: '9(4)', length: 4 },
                '05-COLOR-STATE': { PIC: 'X(10)', length: 10 }
            }
        };
        
        // Color encoding mappings
        this.colorEncodings = {
            'green': { code: 'GRN', frequency: 528, weight: 1.0 },
            'purple': { code: 'PRP', frequency: 432, weight: 1.5 },
            'gold': { code: 'GLD', frequency: 741, weight: 2.0 },
            'yellow': { code: 'YLW', frequency: 396, weight: 0.8 },
            'red': { code: 'RED', frequency: 963, weight: 0.5 }
        };
        
        // Sync tracking
        this.syncQueue = [];
        this.syncInProgress = false;
        this.lastSyncTime = null;
        this.syncStats = {
            successful: 0,
            failed: 0,
            totalRecords: 0
        };
        
        this.initialized = false;
    }
    
    /**
     * Initialize the database bridge
     */
    async initialize() {
        console.log('🌉 Initializing Database Encoder Bridge...');
        
        try {
            // Initialize local SQLite database
            await this.initializeLocalDatabase();
            
            // Initialize cloud PostgreSQL database
            await this.initializeCloudDatabase();
            
            // Create tables if they don't exist
            await this.createTables();
            
            // Start automatic synchronization
            this.startSyncProcess();
            
            this.initialized = true;
            console.log('✅ Database Encoder Bridge initialized');
            console.log(`📂 Local DB: ${this.config.localDb}`);
            console.log(`☁️ Cloud DB: ${this.config.cloudDb.host}:${this.config.cloudDb.port}`);
            
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Database Encoder Bridge:', error);
            throw error;
        }
    }
    
    /**
     * Initialize local SQLite database
     */
    async initializeLocalDatabase() {
        return new Promise((resolve, reject) => {
            // Ensure data directory exists
            const fs = require('fs');
            const path = require('path');
            const dataDir = path.dirname(this.config.localDb);
            
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            this.localConnection = new sqlite3.Database(this.config.localDb, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('📂 Connected to local SQLite database');
                    resolve();
                }
            });
        });
    }
    
    /**
     * Initialize cloud PostgreSQL database
     */
    async initializeCloudDatabase() {
        try {
            this.cloudConnection = new Pool(this.config.cloudDb);
            
            // Test connection
            const client = await this.cloudConnection.connect();
            await client.query('SELECT NOW()');
            client.release();
            
            console.log('☁️ Connected to cloud PostgreSQL database');
        } catch (error) {
            console.error('❌ Failed to connect to cloud database:', error);
            // Continue without cloud for now
            this.cloudConnection = null;
        }
    }
    
    /**
     * Create necessary tables
     */
    async createTables() {
        const tables = {
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
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`
        };
        
        // Create tables in local SQLite
        for (const [tableName, sql] of Object.entries(tables)) {
            await this.runLocalQuery(sql);
            console.log(`📂 Created local table: ${tableName}`);
        }
        
        // Create tables in cloud PostgreSQL (if available)
        if (this.cloudConnection) {
            for (const [tableName, sql] of Object.entries(tables)) {
                const pgSql = sql
                    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY')
                    .replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/g, 'TIMESTAMP DEFAULT NOW()');
                
                try {
                    await this.cloudConnection.query(pgSql);
                    console.log(`☁️ Created cloud table: ${tableName}`);
                } catch (error) {
                    console.warn(`⚠️ Could not create cloud table ${tableName}:`, error.message);
                }
            }
        }
    }
    
    /**
     * Store King metrics with COBOL encoding
     */
    async storeKingMetrics(metrics) {
        console.log('👑 Storing King metrics...');
        
        // Encode to COBOL structure
        const encoded = this.encodeToCobol('01-KING-RECORD', {
            'SYSTEM-ID': metrics.systemId || 'UNKNOWN',
            'TIMESTAMP': Date.now().toString(),
            'SERVICE-STATUS': metrics.serviceStatus || 'UNKNOWN',
            'ERROR-COUNT': metrics.errorCount || 0,
            'LATENCY-MS': metrics.latencyMs || 0,
            'CPU-USAGE': metrics.cpuUsage || 0,
            'MEMORY-USAGE': metrics.memoryUsage || 0
        });
        
        // Apply color encoding based on metrics
        const colorState = this.determineColorState(metrics, 'king');
        
        // Encrypt the encoded data
        const encryptedData = this.encryptData(encoded);
        
        const record = {
            system_id: metrics.systemId || crypto.randomBytes(8).toString('hex'),
            timestamp: Date.now(),
            service_status: metrics.serviceStatus,
            error_count: metrics.errorCount || 0,
            latency_ms: metrics.latencyMs || 0,
            cpu_usage: metrics.cpuUsage || 0,
            memory_usage: metrics.memoryUsage || 0,
            encoded_data: encryptedData,
            color_state: colorState
        };
        
        // Store in local database
        const query = `
            INSERT INTO king_metrics 
            (system_id, timestamp, service_status, error_count, latency_ms, cpu_usage, memory_usage, encoded_data, color_state)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const id = await this.runLocalQuery(query, Object.values(record));
        
        // Add to sync queue
        this.addToSyncQueue('king_metrics', id, record);
        
        this.emit('king_metrics_stored', { id, record, colorState });
        
        return { id, colorState, encoded: encryptedData };
    }
    
    /**
     * Store Queen metrics with COBOL encoding
     */
    async storeQueenMetrics(metrics) {
        console.log('👸 Storing Queen metrics...');
        
        // Encode to COBOL structure
        const encoded = this.encodeToCobol('01-QUEEN-RECORD', {
            'USER-ID': metrics.userId || 'ANONYMOUS',
            'TIMESTAMP': Date.now().toString(),
            'EMOTION-STATE': metrics.emotionState || 'NEUTRAL',
            'SATISFACTION': metrics.satisfaction || 0,
            'CONFUSION-LEVEL': metrics.confusionLevel || 0,
            'JOURNEY-STEP': metrics.journeyStep || 'UNKNOWN',
            'COMPLETION-RATE': metrics.completionRate || 0
        });
        
        // Apply color encoding
        const colorState = this.determineColorState(metrics, 'queen');
        
        // Encrypt the encoded data
        const encryptedData = this.encryptData(encoded);
        
        const record = {
            user_id: metrics.userId || crypto.randomBytes(8).toString('hex'),
            timestamp: Date.now(),
            emotion_state: metrics.emotionState,
            satisfaction: metrics.satisfaction || 0,
            confusion_level: metrics.confusionLevel || 0,
            journey_step: metrics.journeyStep,
            completion_rate: metrics.completionRate || 0,
            encoded_data: encryptedData,
            color_state: colorState
        };
        
        // Store in local database
        const query = `
            INSERT INTO queen_metrics 
            (user_id, timestamp, emotion_state, satisfaction, confusion_level, journey_step, completion_rate, encoded_data, color_state)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const id = await this.runLocalQuery(query, Object.values(record));
        
        // Add to sync queue
        this.addToSyncQueue('queen_metrics', id, record);
        
        this.emit('queen_metrics_stored', { id, record, colorState });
        
        return { id, colorState, encoded: encryptedData };
    }
    
    /**
     * Store dance event with COBOL encoding
     */
    async storeDanceEvent(danceData) {
        console.log('💃 Storing dance event...');
        
        // Encode to COBOL structure
        const encoded = this.encodeToCobol('01-DANCE-RECORD', {
            'DANCE-ID': danceData.danceId || crypto.randomBytes(8).toString('hex'),
            'TIMESTAMP': Date.now().toString(),
            'DANCE-TYPE': danceData.danceType || 'UNKNOWN',
            'SYNC-SCORE': danceData.syncScore || 0,
            'KING-HARMONY': danceData.kingHarmony || 0,
            'QUEEN-HARMONY': danceData.queenHarmony || 0,
            'COLOR-STATE': danceData.colorState || 'green'
        });
        
        // Encrypt the encoded data
        const encryptedData = this.encryptData(encoded);
        
        const record = {
            dance_id: danceData.danceId || crypto.randomBytes(8).toString('hex'),
            timestamp: Date.now(),
            dance_type: danceData.danceType,
            sync_score: danceData.syncScore || 0,
            king_harmony: danceData.kingHarmony || 0,
            queen_harmony: danceData.queenHarmony || 0,
            color_state: danceData.colorState,
            encoded_data: encryptedData
        };
        
        // Store in local database
        const query = `
            INSERT INTO dance_events 
            (dance_id, timestamp, dance_type, sync_score, king_harmony, queen_harmony, color_state, encoded_data)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const id = await this.runLocalQuery(query, Object.values(record));
        
        // Add to sync queue
        this.addToSyncQueue('dance_events', id, record);
        
        this.emit('dance_event_stored', { id, record });
        
        return { id, encoded: encryptedData };
    }
    
    /**
     * Encode data to COBOL structure
     */
    encodeToCobol(structureName, data) {
        const structure = this.cobolStructures[structureName];
        if (!structure) {
            throw new Error(`Unknown COBOL structure: ${structureName}`);
        }
        
        let encoded = '';
        
        for (const [fieldName, fieldDef] of Object.entries(structure)) {
            const dataKey = fieldName.replace('05-', '').replace(/-/g, '-');
            let value = data[dataKey] || '';
            
            // Format based on PIC clause
            if (fieldDef.PIC.includes('9')) {
                // Numeric field
                value = String(value).padStart(fieldDef.length, '0');
            } else {
                // Alphanumeric field
                value = String(value).padEnd(fieldDef.length, ' ');
            }
            
            // Truncate if too long
            encoded += value.substring(0, fieldDef.length);
        }
        
        return encoded;
    }
    
    /**
     * Determine color state based on metrics
     */
    determineColorState(metrics, source) {
        if (source === 'king') {
            // Technical metrics evaluation
            if (metrics.errorCount > 10 || metrics.latencyMs > 5000) {
                return 'red';
            } else if (metrics.errorCount > 5 || metrics.latencyMs > 2000) {
                return 'yellow';
            } else if (metrics.errorCount === 0 && metrics.latencyMs < 500) {
                return 'gold';
            } else if (metrics.serviceStatus === 'healthy') {
                return 'purple';
            } else {
                return 'green';
            }
        } else if (source === 'queen') {
            // Human experience metrics evaluation
            if (metrics.satisfaction < 30 || metrics.confusionLevel > 80) {
                return 'red';
            } else if (metrics.satisfaction < 60 || metrics.confusionLevel > 50) {
                return 'yellow';
            } else if (metrics.satisfaction > 90 && metrics.confusionLevel < 10) {
                return 'gold';
            } else if (metrics.satisfaction > 75) {
                return 'purple';
            } else {
                return 'green';
            }
        }
        
        return 'green'; // Default
    }
    
    /**
     * Encrypt data
     */
    encryptData(data) {
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
            return null;
        }
    }
    
    /**
     * Add record to sync queue
     */
    addToSyncQueue(table, id, record) {
        this.syncQueue.push({
            table,
            id,
            record,
            timestamp: Date.now(),
            attempts: 0
        });
        
        console.log(`📤 Added to sync queue: ${table}#${id}`);
    }
    
    /**
     * Start automatic synchronization process
     */
    startSyncProcess() {
        if (!this.cloudConnection) {
            console.warn('⚠️ Cloud database not available, skipping sync process');
            return;
        }
        
        setInterval(async () => {
            if (!this.syncInProgress && this.syncQueue.length > 0) {
                await this.processSyncQueue();
            }
        }, this.config.syncInterval);
        
        console.log(`🔄 Started sync process (interval: ${this.config.syncInterval}ms)`);
    }
    
    /**
     * Process the sync queue
     */
    async processSyncQueue() {
        if (this.syncInProgress || !this.cloudConnection) return;
        
        this.syncInProgress = true;
        console.log(`🔄 Processing sync queue (${this.syncQueue.length} items)...`);
        
        const batch = this.syncQueue.splice(0, 10); // Process 10 at a time
        
        for (const item of batch) {
            try {
                await this.syncRecordToCloud(item);
                this.syncStats.successful++;
            } catch (error) {
                console.error(`❌ Sync failed for ${item.table}#${item.id}:`, error.message);
                
                item.attempts++;
                if (item.attempts < 3) {
                    // Re-queue for retry
                    this.syncQueue.push(item);
                }
                this.syncStats.failed++;
            }
        }
        
        this.lastSyncTime = new Date();
        this.syncInProgress = false;
        
        console.log(`✅ Sync batch completed. Success: ${this.syncStats.successful}, Failed: ${this.syncStats.failed}`);
        
        this.emit('sync_completed', {
            processed: batch.length,
            remaining: this.syncQueue.length,
            stats: this.syncStats
        });
    }
    
    /**
     * Sync a record to cloud database
     */
    async syncRecordToCloud(item) {
        const { table, record } = item;
        
        // Convert record for PostgreSQL
        const columns = Object.keys(record);
        const values = Object.values(record);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const query = `
            INSERT INTO ${table} (${columns.join(', ')})
            VALUES (${placeholders})
            ON CONFLICT DO NOTHING
        `;
        
        await this.cloudConnection.query(query, values);
        
        // Mark as synced in local database
        await this.runLocalQuery(
            `UPDATE ${table} SET sync_status = 'synced' WHERE id = ?`,
            [item.id]
        );
        
        console.log(`☁️ Synced ${table}#${item.id} to cloud`);
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
     * Get synchronization statistics
     */
    getSyncStats() {
        return {
            queueLength: this.syncQueue.length,
            syncInProgress: this.syncInProgress,
            lastSyncTime: this.lastSyncTime,
            stats: this.syncStats,
            cloudAvailable: !!this.cloudConnection
        };
    }
    
    /**
     * Get recent records
     */
    async getRecentRecords(table, limit = 10) {
        const query = `SELECT * FROM ${table} ORDER BY timestamp DESC LIMIT ?`;
        return this.runLocalQuery(query, [limit]);
    }
    
    /**
     * Close database connections
     */
    async close() {
        console.log('🌉 Closing Database Encoder Bridge...');
        
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
module.exports = DatabaseEncoderBridge;

// Demo if run directly
if (require.main === module) {
    const bridge = new DatabaseEncoderBridge();
    
    // Event listeners
    bridge.on('initialized', () => {
        console.log('🌉 Bridge initialized, running demo...');
        
        // Demo King metrics
        setTimeout(async () => {
            await bridge.storeKingMetrics({
                systemId: 'master-controller',
                serviceStatus: 'healthy',
                errorCount: 0,
                latencyMs: 125,
                cpuUsage: 45.2,
                memoryUsage: 67.8
            });
        }, 1000);
        
        // Demo Queen metrics
        setTimeout(async () => {
            await bridge.storeQueenMetrics({
                userId: 'user-123',
                emotionState: 'happy',
                satisfaction: 85,
                confusionLevel: 15,
                journeyStep: 'completing-checkout',
                completionRate: 92.5
            });
        }, 2000);
        
        // Demo dance event
        setTimeout(async () => {
            await bridge.storeDanceEvent({
                danceType: 'waltz',
                syncScore: 88,
                kingHarmony: 528,
                queenHarmony: 432,
                colorState: 'purple'
            });
        }, 3000);
        
        // Show stats
        setTimeout(async () => {
            console.log('\n📊 Sync Statistics:');
            console.log(JSON.stringify(bridge.getSyncStats(), null, 2));
            
            console.log('\n📂 Recent King Metrics:');
            const kingRecords = await bridge.getRecentRecords('king_metrics', 5);
            console.log(kingRecords);
            
            // Close after demo
            setTimeout(() => bridge.close(), 2000);
        }, 5000);
    });
    
    bridge.on('sync_completed', (data) => {
        console.log('🔄 Sync completed:', data);
    });
    
    // Initialize
    bridge.initialize().catch(console.error);
}