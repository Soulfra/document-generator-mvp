#!/usr/bin/env node

/**
 * 📚 ORDERED DATABASE READER
 * 
 * Ensures consistent read ordering across all databases with:
 * - Priority queue for read operations
 * - FIFO/LIFO ordering options
 * - Transaction ordering for consistency
 * - Cross-database transaction IDs
 * - Read sequence logging
 * 
 * Integrates with all existing database systems.
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();

class OrderedDatabaseReader extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Read queue configuration
        this.queueMode = config.queueMode || 'FIFO'; // FIFO, LIFO, PRIORITY
        this.maxConcurrentReads = config.maxConcurrentReads || 10;
        this.readTimeout = config.readTimeout || 30000; // 30 seconds
        
        // Read queues
        this.readQueue = [];
        this.activeReads = new Map();
        this.completedReads = new Map();
        
        // Transaction management
        this.transactions = new Map();
        this.transactionOrder = [];
        
        // Read sequence tracking
        this.readSequence = [];
        this.sequenceDb = new sqlite3.Database('./read-sequence.db');
        
        // Database connections registry
        this.databases = new Map();
        this.databasePriorities = new Map();
        
        // Metrics
        this.metrics = {
            totalReads: 0,
            successfulReads: 0,
            failedReads: 0,
            averageReadTime: 0,
            queueDepth: 0
        };
        
        console.log('📚 Ordered Database Reader initialized');
        console.log(`   Queue Mode: ${this.queueMode}`);
        console.log(`   Max Concurrent: ${this.maxConcurrentReads}`);
        
        this.initialize();
    }
    
    async initialize() {
        // Create read sequence tracking table
        await this.createSequenceTables();
        
        // Start queue processor
        this.startQueueProcessor();
        
        // Set up cleanup interval
        setInterval(() => this.cleanupCompletedReads(), 300000); // 5 minutes
    }
    
    async createSequenceTables() {
        return new Promise((resolve, reject) => {
            this.sequenceDb.serialize(() => {
                // Read sequence table
                this.sequenceDb.run(`
                    CREATE TABLE IF NOT EXISTS read_sequence (
                        sequence_id INTEGER PRIMARY KEY AUTOINCREMENT,
                        read_id TEXT UNIQUE NOT NULL,
                        transaction_id TEXT,
                        database_name TEXT NOT NULL,
                        table_name TEXT,
                        operation TEXT NOT NULL,
                        priority INTEGER DEFAULT 5,
                        
                        -- Timing
                        queued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        started_at TIMESTAMP,
                        completed_at TIMESTAMP,
                        duration_ms INTEGER,
                        
                        -- Status
                        status TEXT DEFAULT 'queued',
                        error_message TEXT,
                        
                        -- Results
                        row_count INTEGER,
                        data_size INTEGER,
                        
                        -- Ordering
                        depends_on TEXT, -- comma-separated read_ids
                        blocks TEXT,     -- comma-separated read_ids
                        
                        INDEX idx_transaction (transaction_id),
                        INDEX idx_status (status),
                        INDEX idx_queued (queued_at)
                    )
                `);
                
                // Cross-database transactions
                this.sequenceDb.run(`
                    CREATE TABLE IF NOT EXISTS cross_db_transactions (
                        transaction_id TEXT PRIMARY KEY,
                        name TEXT,
                        databases TEXT NOT NULL, -- JSON array
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        completed_at TIMESTAMP,
                        status TEXT DEFAULT 'active',
                        read_count INTEGER DEFAULT 0,
                        error_count INTEGER DEFAULT 0
                    )
                `);
                
                // Database registry
                this.sequenceDb.run(`
                    CREATE TABLE IF NOT EXISTS database_registry (
                        database_name TEXT PRIMARY KEY,
                        database_type TEXT NOT NULL,
                        connection_string TEXT,
                        priority INTEGER DEFAULT 5,
                        max_concurrent INTEGER DEFAULT 5,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                resolve();
            });
        });
    }
    
    /**
     * Register a database connection
     */
    registerDatabase(name, connection, options = {}) {
        this.databases.set(name, {
            connection,
            type: options.type || 'unknown',
            priority: options.priority || 5,
            maxConcurrent: options.maxConcurrent || 5,
            activeReads: 0
        });
        
        this.databasePriorities.set(name, options.priority || 5);
        
        // Store in registry
        this.sequenceDb.run(`
            INSERT OR REPLACE INTO database_registry 
            (database_name, database_type, priority, max_concurrent)
            VALUES (?, ?, ?, ?)
        `, [name, options.type || 'unknown', options.priority || 5, options.maxConcurrent || 5]);
        
        console.log(`   📁 Registered database: ${name} (priority: ${options.priority || 5})`);
    }
    
    /**
     * Start a cross-database transaction
     */
    async startTransaction(name = null) {
        const transactionId = uuidv4();
        
        const transaction = {
            id: transactionId,
            name: name || `transaction-${Date.now()}`,
            databases: new Set(),
            reads: [],
            startTime: Date.now(),
            status: 'active'
        };
        
        this.transactions.set(transactionId, transaction);
        this.transactionOrder.push(transactionId);
        
        // Record in database
        await new Promise((resolve, reject) => {
            this.sequenceDb.run(`
                INSERT INTO cross_db_transactions 
                (transaction_id, name, databases, status)
                VALUES (?, ?, ?, ?)
            `, [transactionId, transaction.name, '[]', 'active'], 
            err => err ? reject(err) : resolve());
        });
        
        return transactionId;
    }
    
    /**
     * Queue a read operation
     */
    async queueRead(databaseName, query, options = {}) {
        const readId = uuidv4();
        
        const readOperation = {
            id: readId,
            databaseName,
            query,
            transactionId: options.transactionId || null,
            priority: options.priority || 5,
            tableName: options.tableName || this.extractTableName(query),
            operation: options.operation || this.detectOperation(query),
            dependsOn: options.dependsOn || [],
            timeout: options.timeout || this.readTimeout,
            queuedAt: Date.now(),
            status: 'queued',
            callback: null,
            promise: null
        };
        
        // Create promise for this read
        const promise = new Promise((resolve, reject) => {
            readOperation.callback = { resolve, reject };
        });
        readOperation.promise = promise;
        
        // Add to transaction if specified
        if (readOperation.transactionId) {
            const transaction = this.transactions.get(readOperation.transactionId);
            if (transaction) {
                transaction.reads.push(readId);
                transaction.databases.add(databaseName);
            }
        }
        
        // Record in sequence database
        await this.recordReadSequence(readOperation);
        
        // Add to queue based on mode
        this.addToQueue(readOperation);
        
        // Update metrics
        this.metrics.queueDepth = this.readQueue.length;
        
        // Emit event
        this.emit('read:queued', {
            readId,
            databaseName,
            priority: readOperation.priority,
            queueDepth: this.readQueue.length
        });
        
        return {
            readId,
            promise
        };
    }
    
    /**
     * Add read operation to queue based on mode
     */
    addToQueue(readOperation) {
        switch (this.queueMode) {
            case 'FIFO':
                this.readQueue.push(readOperation);
                break;
                
            case 'LIFO':
                this.readQueue.unshift(readOperation);
                break;
                
            case 'PRIORITY':
                // Insert based on priority (higher number = higher priority)
                let inserted = false;
                for (let i = 0; i < this.readQueue.length; i++) {
                    if (readOperation.priority > this.readQueue[i].priority) {
                        this.readQueue.splice(i, 0, readOperation);
                        inserted = true;
                        break;
                    }
                }
                if (!inserted) {
                    this.readQueue.push(readOperation);
                }
                break;
                
            default:
                this.readQueue.push(readOperation);
        }
    }
    
    /**
     * Process the read queue
     */
    startQueueProcessor() {
        setInterval(() => {
            this.processQueue();
        }, 100); // Check every 100ms
    }
    
    async processQueue() {
        // Check if we can process more reads
        if (this.activeReads.size >= this.maxConcurrentReads) {
            return;
        }
        
        // Find next eligible read
        const nextRead = this.findNextEligibleRead();
        if (!nextRead) {
            return;
        }
        
        // Remove from queue
        const index = this.readQueue.indexOf(nextRead);
        if (index > -1) {
            this.readQueue.splice(index, 1);
        }
        
        // Execute read
        this.executeRead(nextRead);
    }
    
    /**
     * Find next eligible read (considering dependencies)
     */
    findNextEligibleRead() {
        for (const read of this.readQueue) {
            // Check if all dependencies are completed
            if (this.areDependenciesSatisfied(read)) {
                // Check if database has capacity
                const db = this.databases.get(read.databaseName);
                if (db && db.activeReads < db.maxConcurrent) {
                    return read;
                }
            }
        }
        return null;
    }
    
    /**
     * Check if dependencies are satisfied
     */
    areDependenciesSatisfied(read) {
        if (!read.dependsOn || read.dependsOn.length === 0) {
            return true;
        }
        
        for (const dependencyId of read.dependsOn) {
            const dependency = this.completedReads.get(dependencyId);
            if (!dependency || dependency.status !== 'completed') {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Execute a read operation
     */
    async executeRead(readOperation) {
        const startTime = Date.now();
        
        // Mark as active
        readOperation.status = 'active';
        readOperation.startedAt = startTime;
        this.activeReads.set(readOperation.id, readOperation);
        
        // Update database active count
        const db = this.databases.get(readOperation.databaseName);
        if (db) {
            db.activeReads++;
        }
        
        // Update sequence database
        await this.updateReadStatus(readOperation.id, 'active', { startedAt: startTime });
        
        // Emit event
        this.emit('read:started', {
            readId: readOperation.id,
            databaseName: readOperation.databaseName,
            transactionId: readOperation.transactionId
        });
        
        try {
            // Set timeout
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Read timeout')), readOperation.timeout);
            });
            
            // Execute query
            const executePromise = this.executeQuery(
                readOperation.databaseName,
                readOperation.query
            );
            
            // Race between query and timeout
            const result = await Promise.race([executePromise, timeoutPromise]);
            
            // Success
            const duration = Date.now() - startTime;
            readOperation.status = 'completed';
            readOperation.completedAt = Date.now();
            readOperation.duration = duration;
            readOperation.result = result;
            
            // Update metrics
            this.metrics.successfulReads++;
            this.updateAverageReadTime(duration);
            
            // Move to completed
            this.activeReads.delete(readOperation.id);
            this.completedReads.set(readOperation.id, readOperation);
            
            // Update database active count
            if (db) {
                db.activeReads--;
            }
            
            // Update sequence database
            await this.updateReadStatus(readOperation.id, 'completed', {
                completedAt: readOperation.completedAt,
                duration,
                rowCount: result.rows ? result.rows.length : 0
            });
            
            // Resolve promise
            readOperation.callback.resolve(result);
            
            // Emit event
            this.emit('read:completed', {
                readId: readOperation.id,
                databaseName: readOperation.databaseName,
                duration,
                rowCount: result.rows ? result.rows.length : 0
            });
            
        } catch (error) {
            // Failure
            const duration = Date.now() - startTime;
            readOperation.status = 'failed';
            readOperation.completedAt = Date.now();
            readOperation.duration = duration;
            readOperation.error = error.message;
            
            // Update metrics
            this.metrics.failedReads++;
            
            // Move to completed
            this.activeReads.delete(readOperation.id);
            this.completedReads.set(readOperation.id, readOperation);
            
            // Update database active count
            if (db) {
                db.activeReads--;
            }
            
            // Update sequence database
            await this.updateReadStatus(readOperation.id, 'failed', {
                completedAt: readOperation.completedAt,
                duration,
                errorMessage: error.message
            });
            
            // Reject promise
            readOperation.callback.reject(error);
            
            // Emit event
            this.emit('read:failed', {
                readId: readOperation.id,
                databaseName: readOperation.databaseName,
                error: error.message
            });
        }
        
        // Process next item in queue
        this.processQueue();
    }
    
    /**
     * Execute query on specific database
     */
    async executeQuery(databaseName, query) {
        const db = this.databases.get(databaseName);
        if (!db) {
            throw new Error(`Database ${databaseName} not registered`);
        }
        
        // Execute based on database type
        switch (db.type) {
            case 'postgresql':
                return this.executePostgreSQLQuery(db.connection, query);
                
            case 'mysql':
                return this.executeMySQLQuery(db.connection, query);
                
            case 'sqlite':
                return this.executeSQLiteQuery(db.connection, query);
                
            case 'redis':
                return this.executeRedisQuery(db.connection, query);
                
            default:
                throw new Error(`Unsupported database type: ${db.type}`);
        }
    }
    
    /**
     * Execute PostgreSQL query
     */
    async executePostgreSQLQuery(connection, query) {
        const result = await connection.query(query);
        return {
            rows: result.rows,
            rowCount: result.rowCount,
            fields: result.fields
        };
    }
    
    /**
     * Execute MySQL query
     */
    async executeMySQLQuery(connection, query) {
        const [rows, fields] = await connection.execute(query);
        return {
            rows,
            rowCount: rows.length,
            fields
        };
    }
    
    /**
     * Execute SQLite query
     */
    executeSQLiteQuery(connection, query) {
        return new Promise((resolve, reject) => {
            connection.all(query, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve({
                        rows,
                        rowCount: rows.length
                    });
                }
            });
        });
    }
    
    /**
     * Execute Redis query
     */
    async executeRedisQuery(connection, query) {
        // Parse Redis command from query string
        const parts = query.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        const result = await connection[command](...args);
        
        return {
            result,
            command,
            args
        };
    }
    
    /**
     * Record read in sequence database
     */
    async recordReadSequence(readOperation) {
        return new Promise((resolve, reject) => {
            this.sequenceDb.run(`
                INSERT INTO read_sequence 
                (read_id, transaction_id, database_name, table_name, operation, priority, depends_on)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                readOperation.id,
                readOperation.transactionId,
                readOperation.databaseName,
                readOperation.tableName,
                readOperation.operation,
                readOperation.priority,
                readOperation.dependsOn.join(',')
            ], err => err ? reject(err) : resolve());
        });
    }
    
    /**
     * Update read status in sequence database
     */
    async updateReadStatus(readId, status, updates = {}) {
        const fields = ['status = ?'];
        const values = [status];
        
        if (updates.startedAt) {
            fields.push('started_at = datetime(?, "unixepoch")');
            values.push(Math.floor(updates.startedAt / 1000));
        }
        
        if (updates.completedAt) {
            fields.push('completed_at = datetime(?, "unixepoch")');
            values.push(Math.floor(updates.completedAt / 1000));
        }
        
        if (updates.duration !== undefined) {
            fields.push('duration_ms = ?');
            values.push(updates.duration);
        }
        
        if (updates.rowCount !== undefined) {
            fields.push('row_count = ?');
            values.push(updates.rowCount);
        }
        
        if (updates.errorMessage) {
            fields.push('error_message = ?');
            values.push(updates.errorMessage);
        }
        
        values.push(readId);
        
        return new Promise((resolve, reject) => {
            this.sequenceDb.run(
                `UPDATE read_sequence SET ${fields.join(', ')} WHERE read_id = ?`,
                values,
                err => err ? reject(err) : resolve()
            );
        });
    }
    
    /**
     * Complete a transaction
     */
    async completeTransaction(transactionId) {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) {
            throw new Error(`Transaction ${transactionId} not found`);
        }
        
        transaction.status = 'completed';
        transaction.completedAt = Date.now();
        
        // Wait for all reads in transaction to complete
        const pendingReads = transaction.reads.filter(readId => {
            const read = this.activeReads.get(readId) || this.readQueue.find(r => r.id === readId);
            return read && read.status !== 'completed';
        });
        
        if (pendingReads.length > 0) {
            throw new Error(`Transaction has ${pendingReads.length} pending reads`);
        }
        
        // Update database
        await new Promise((resolve, reject) => {
            this.sequenceDb.run(`
                UPDATE cross_db_transactions 
                SET status = 'completed', 
                    completed_at = datetime('now'),
                    read_count = (
                        SELECT COUNT(*) FROM read_sequence 
                        WHERE transaction_id = ?
                    )
                WHERE transaction_id = ?
            `, [transactionId, transactionId], 
            err => err ? reject(err) : resolve());
        });
        
        this.emit('transaction:completed', { transactionId });
        
        return transaction;
    }
    
    /**
     * Get read sequence for a time range
     */
    async getReadSequence(startTime, endTime) {
        return new Promise((resolve, reject) => {
            this.sequenceDb.all(`
                SELECT * FROM read_sequence 
                WHERE queued_at BETWEEN datetime(?, 'unixepoch') AND datetime(?, 'unixepoch')
                ORDER BY sequence_id
            `, [
                Math.floor(startTime / 1000),
                Math.floor(endTime / 1000)
            ], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
    
    /**
     * Get transaction history
     */
    async getTransactionHistory(limit = 100) {
        return new Promise((resolve, reject) => {
            this.sequenceDb.all(`
                SELECT * FROM cross_db_transactions 
                ORDER BY created_at DESC 
                LIMIT ?
            `, [limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
    
    /**
     * Extract table name from query
     */
    extractTableName(query) {
        const match = query.match(/(?:FROM|INTO|UPDATE)\s+(\w+)/i);
        return match ? match[1] : 'unknown';
    }
    
    /**
     * Detect operation type
     */
    detectOperation(query) {
        const firstWord = query.trim().split(/\s+/)[0].toUpperCase();
        return firstWord;
    }
    
    /**
     * Update average read time
     */
    updateAverageReadTime(duration) {
        const total = this.metrics.totalReads;
        const currentAvg = this.metrics.averageReadTime;
        
        this.metrics.averageReadTime = (currentAvg * total + duration) / (total + 1);
        this.metrics.totalReads++;
    }
    
    /**
     * Clean up old completed reads
     */
    cleanupCompletedReads() {
        const cutoffTime = Date.now() - 3600000; // 1 hour ago
        
        for (const [readId, read] of this.completedReads) {
            if (read.completedAt < cutoffTime) {
                this.completedReads.delete(readId);
            }
        }
    }
    
    /**
     * Get current metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeReads: this.activeReads.size,
            queueDepth: this.readQueue.length,
            completedReads: this.completedReads.size,
            activeTransactions: Array.from(this.transactions.values())
                .filter(t => t.status === 'active').length
        };
    }
    
    /**
     * Set queue mode
     */
    setQueueMode(mode) {
        if (['FIFO', 'LIFO', 'PRIORITY'].includes(mode)) {
            this.queueMode = mode;
            console.log(`   Queue mode changed to: ${mode}`);
        }
    }
}

// Export for use
module.exports = OrderedDatabaseReader;

// Run demo if executed directly
if (require.main === module) {
    (async () => {
        const reader = new OrderedDatabaseReader({
            queueMode: 'PRIORITY',
            maxConcurrentReads: 5
        });
        
        console.log('\n📚 Ordered Database Reader Demo');
        console.log('================================\n');
        
        // Register mock databases
        const mockDb = {
            all: (query, callback) => {
                setTimeout(() => {
                    callback(null, [
                        { id: 1, name: 'Test 1' },
                        { id: 2, name: 'Test 2' }
                    ]);
                }, Math.random() * 1000);
            }
        };
        
        reader.registerDatabase('main', mockDb, { type: 'sqlite', priority: 10 });
        reader.registerDatabase('cache', mockDb, { type: 'sqlite', priority: 5 });
        reader.registerDatabase('analytics', mockDb, { type: 'sqlite', priority: 3 });
        
        // Start a transaction
        console.log('Starting cross-database transaction...');
        const txId = await reader.startTransaction('demo-transaction');
        console.log(`Transaction ID: ${txId}\n`);
        
        // Queue some reads
        console.log('Queueing reads with different priorities...');
        
        const reads = [
            reader.queueRead('analytics', 'SELECT * FROM events', { 
                priority: 3, 
                transactionId: txId 
            }),
            reader.queueRead('main', 'SELECT * FROM users', { 
                priority: 10, 
                transactionId: txId 
            }),
            reader.queueRead('cache', 'SELECT * FROM sessions', { 
                priority: 5, 
                transactionId: txId,
                dependsOn: [] // Will wait for first read
            })
        ];
        
        // Wait for all reads
        console.log('\nWaiting for reads to complete...\n');
        
        const results = await Promise.all(reads.map(r => r.promise));
        
        console.log('All reads completed!');
        results.forEach((result, i) => {
            console.log(`Read ${i + 1}: ${result.rowCount} rows`);
        });
        
        // Complete transaction
        await reader.completeTransaction(txId);
        console.log('\nTransaction completed!');
        
        // Show metrics
        console.log('\nMetrics:');
        console.log(JSON.stringify(reader.getMetrics(), null, 2));
        
        // Get read sequence
        const sequence = await reader.getReadSequence(Date.now() - 60000, Date.now());
        console.log(`\nRead sequence (last minute): ${sequence.length} reads`);
    })();
}