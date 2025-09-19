#!/usr/bin/env node

/**
 * 🗄️ UNIX-BASED CUSTOM DATABASE SYSTEM
 * Lightweight, memory-efficient database using Unix principles
 * 
 * Features:
 * - SQLite databases per service
 * - Unix domain sockets for IPC
 * - Memory-mapped files for performance
 * - Event-driven replication
 * - Built-in backup and recovery
 */

const EventEmitter = require('events');
const Database = require('better-sqlite3');
const net = require('net');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { Worker } = require('worker_threads');
const mmap = require('mmap-io');

class UnixCustomDatabase extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            basePath: config.basePath || './databases',
            socketPath: config.socketPath || '/tmp/unix-db-socket',
            mmapPath: config.mmapPath || './mmap-files',
            backupPath: config.backupPath || './backups',
            replicationPort: config.replicationPort || 9001,
            maxConnections: config.maxConnections || 100,
            cacheSize: config.cacheSize || 50 * 1024 * 1024, // 50MB
            pageSize: config.pageSize || 4096,
            walMode: config.walMode || true,
            mmapSize: config.mmapSize || 100 * 1024 * 1024, // 100MB
            ...config
        };
        
        // Database instances
        this.databases = new Map(); // dbName -> Database instance
        this.connections = new Map(); // connectionId -> connection info
        
        // Memory-mapped files
        this.mmapFiles = new Map(); // filename -> mmap buffer
        
        // Unix domain socket server
        this.socketServer = null;
        
        // Replication management
        this.replicationPeers = new Set();
        this.replicationLog = [];
        this.replicationSequence = 0;
        
        // Performance metrics
        this.metrics = {
            queries: 0,
            writes: 0,
            reads: 0,
            cacheHits: 0,
            cacheMisses: 0,
            avgQueryTime: 0,
            connections: 0
        };
        
        // Query cache
        this.queryCache = new Map();
        this.cacheStats = {
            size: 0,
            hits: 0,
            misses: 0,
            evictions: 0
        };
        
        console.log('🗄️ Unix Custom Database System initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Create directories
        await this.createDirectories();
        
        // Initialize core databases
        await this.initializeCoreDatabases();
        
        // Start Unix domain socket server
        await this.startSocketServer();
        
        // Initialize memory-mapped files
        await this.initializeMemoryMappedFiles();
        
        // Start replication listener
        await this.startReplicationListener();
        
        // Start metrics collection
        this.startMetricsCollection();
        
        console.log('✅ Database system ready');
        console.log(`🔌 Unix socket: ${this.config.socketPath}`);
        console.log(`💾 Memory-mapped files: ${this.config.mmapPath}`);
        console.log(`📡 Replication port: ${this.config.replicationPort}`);
    }
    
    async createDirectories() {
        const dirs = [
            this.config.basePath,
            this.config.mmapPath,
            this.config.backupPath,
            path.join(this.config.basePath, 'wal'),
            path.join(this.config.basePath, 'shared')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    async initializeCoreDatabases() {
        // Initialize core system databases
        const coreDatabases = [
            { name: 'users', schema: this.getUserSchema() },
            { name: 'teams', schema: this.getTeamSchema() },
            { name: 'economy', schema: this.getEconomySchema() },
            { name: 'themes', schema: this.getThemeSchema() },
            { name: 'collaboration', schema: this.getCollaborationSchema() },
            { name: 'system', schema: this.getSystemSchema() }
        ];
        
        for (const { name, schema } of coreDatabases) {
            const db = await this.createDatabase(name);
            
            // Execute schema
            for (const statement of schema) {
                db.prepare(statement).run();
            }
            
            console.log(`📊 Initialized database: ${name}`);
        }
    }
    
    async createDatabase(name, options = {}) {
        const dbPath = path.join(this.config.basePath, `${name}.db`);
        
        const db = new Database(dbPath, {
            verbose: options.verbose || false,
            memory: options.memory || false,
            readonly: options.readonly || false,
            fileMustExist: options.fileMustExist || false,
            timeout: options.timeout || 5000,
            nativeBinding: options.nativeBinding
        });
        
        // Enable WAL mode for better concurrency
        if (this.config.walMode && !options.memory) {
            db.pragma('journal_mode = WAL');
            db.pragma('synchronous = NORMAL');
        }
        
        // Set cache size
        db.pragma(`cache_size = -${Math.floor(this.config.cacheSize / 1024)}`);
        
        // Set page size
        db.pragma(`page_size = ${this.config.pageSize}`);
        
        // Enable foreign keys
        db.pragma('foreign_keys = ON');
        
        // Store database instance
        this.databases.set(name, db);
        
        // Set up prepared statements cache
        db.statements = new Map();
        
        return db;
    }
    
    async startSocketServer() {
        // Remove existing socket file if it exists
        try {
            await fs.unlink(this.config.socketPath);
        } catch (error) {
            // Ignore if doesn't exist
        }
        
        this.socketServer = net.createServer(async (socket) => {
            const connectionId = crypto.randomUUID();
            
            this.connections.set(connectionId, {
                socket,
                authenticated: false,
                databases: new Set(),
                startTime: Date.now()
            });
            
            this.metrics.connections++;
            
            socket.on('data', async (data) => {
                try {
                    const messages = data.toString().split('\n').filter(m => m);
                    
                    for (const message of messages) {
                        const request = JSON.parse(message);
                        await this.handleSocketRequest(connectionId, request);
                    }
                } catch (error) {
                    socket.write(JSON.stringify({
                        error: error.message,
                        code: 'PARSE_ERROR'
                    }) + '\n');
                }
            });
            
            socket.on('close', () => {
                this.connections.delete(connectionId);
                this.metrics.connections--;
            });
            
            socket.on('error', (error) => {
                console.error('Socket error:', error);
                this.connections.delete(connectionId);
            });
            
            // Send welcome message
            socket.write(JSON.stringify({
                type: 'welcome',
                connectionId,
                version: '1.0.0'
            }) + '\n');
        });
        
        this.socketServer.listen(this.config.socketPath, () => {
            console.log(`🔌 Unix socket server listening: ${this.config.socketPath}`);
        });
    }
    
    async handleSocketRequest(connectionId, request) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        const { socket } = connection;
        const startTime = Date.now();
        
        try {
            let response;
            
            switch (request.type) {
                case 'auth':
                    response = await this.handleAuth(connectionId, request);
                    break;
                    
                case 'query':
                    response = await this.handleQuery(connectionId, request);
                    break;
                    
                case 'execute':
                    response = await this.handleExecute(connectionId, request);
                    break;
                    
                case 'transaction':
                    response = await this.handleTransaction(connectionId, request);
                    break;
                    
                case 'subscribe':
                    response = await this.handleSubscribe(connectionId, request);
                    break;
                    
                case 'mmap-read':
                    response = await this.handleMmapRead(connectionId, request);
                    break;
                    
                case 'mmap-write':
                    response = await this.handleMmapWrite(connectionId, request);
                    break;
                    
                default:
                    response = { error: 'Unknown request type' };
            }
            
            // Add timing info
            response.elapsed = Date.now() - startTime;
            
            socket.write(JSON.stringify(response) + '\n');
            
            // Update metrics
            this.metrics.queries++;
            this.metrics.avgQueryTime = 
                (this.metrics.avgQueryTime * (this.metrics.queries - 1) + response.elapsed) / 
                this.metrics.queries;
                
        } catch (error) {
            socket.write(JSON.stringify({
                error: error.message,
                stack: error.stack,
                elapsed: Date.now() - startTime
            }) + '\n');
        }
    }
    
    async handleQuery(connectionId, request) {
        const { database, sql, params = [] } = request;
        
        const connection = this.connections.get(connectionId);
        if (!connection.authenticated) {
            throw new Error('Not authenticated');
        }
        
        if (!connection.databases.has(database)) {
            throw new Error('Access denied to database');
        }
        
        const db = this.databases.get(database);
        if (!db) {
            throw new Error('Database not found');
        }
        
        // Check query cache
        const cacheKey = `${database}:${sql}:${JSON.stringify(params)}`;
        if (this.queryCache.has(cacheKey)) {
            this.cacheStats.hits++;
            this.metrics.cacheHits++;
            return {
                type: 'result',
                data: this.queryCache.get(cacheKey),
                cached: true
            };
        }
        
        this.cacheStats.misses++;
        this.metrics.cacheMisses++;
        
        // Prepare statement if not cached
        let stmt = db.statements.get(sql);
        if (!stmt) {
            stmt = db.prepare(sql);
            db.statements.set(sql, stmt);
        }
        
        // Execute query
        const result = stmt.all(...params);
        
        // Cache result
        this.cacheQuery(cacheKey, result);
        
        this.metrics.reads++;
        
        return {
            type: 'result',
            data: result,
            cached: false
        };
    }
    
    async handleExecute(connectionId, request) {
        const { database, sql, params = [] } = request;
        
        const connection = this.connections.get(connectionId);
        if (!connection.authenticated) {
            throw new Error('Not authenticated');
        }
        
        if (!connection.databases.has(database)) {
            throw new Error('Access denied to database');
        }
        
        const db = this.databases.get(database);
        if (!db) {
            throw new Error('Database not found');
        }
        
        // Prepare statement
        let stmt = db.statements.get(sql);
        if (!stmt) {
            stmt = db.prepare(sql);
            db.statements.set(sql, stmt);
        }
        
        // Execute statement
        const result = stmt.run(...params);
        
        // Invalidate related cache entries
        this.invalidateCache(database);
        
        // Log for replication
        this.logReplication({
            type: 'execute',
            database,
            sql,
            params,
            timestamp: Date.now(),
            sequence: ++this.replicationSequence
        });
        
        this.metrics.writes++;
        
        return {
            type: 'result',
            changes: result.changes,
            lastInsertRowid: result.lastInsertRowid
        };
    }
    
    async handleTransaction(connectionId, request) {
        const { database, operations } = request;
        
        const connection = this.connections.get(connectionId);
        if (!connection.authenticated) {
            throw new Error('Not authenticated');
        }
        
        const db = this.databases.get(database);
        if (!db) {
            throw new Error('Database not found');
        }
        
        const results = [];
        
        const transaction = db.transaction((ops) => {
            for (const op of ops) {
                const stmt = db.prepare(op.sql);
                const result = op.type === 'query' ? 
                    stmt.all(...(op.params || [])) : 
                    stmt.run(...(op.params || []));
                results.push(result);
            }
        });
        
        try {
            transaction(operations);
            
            // Invalidate cache
            this.invalidateCache(database);
            
            // Log for replication
            this.logReplication({
                type: 'transaction',
                database,
                operations,
                timestamp: Date.now(),
                sequence: ++this.replicationSequence
            });
            
            return {
                type: 'transaction-result',
                results,
                success: true
            };
        } catch (error) {
            return {
                type: 'transaction-result',
                error: error.message,
                success: false
            };
        }
    }
    
    async initializeMemoryMappedFiles() {
        // Create shared memory files for high-performance data access
        const sharedFiles = [
            { name: 'presence', size: 1024 * 1024 }, // 1MB for presence data
            { name: 'metrics', size: 512 * 1024 }, // 512KB for metrics
            { name: 'cache', size: 10 * 1024 * 1024 }, // 10MB for cache
            { name: 'queue', size: 5 * 1024 * 1024 } // 5MB for message queue
        ];
        
        for (const { name, size } of sharedFiles) {
            const filePath = path.join(this.config.mmapPath, `${name}.mmap`);
            
            try {
                // Create file if it doesn't exist
                const fd = await fs.open(filePath, 'w+');
                await fd.truncate(size);
                await fd.close();
                
                // Memory map the file
                const buffer = mmap.map(
                    size,
                    mmap.PROT_READ | mmap.PROT_WRITE,
                    mmap.MAP_SHARED,
                    await fs.open(filePath, 'r+'),
                    0,
                    mmap.MADV_RANDOM
                );
                
                this.mmapFiles.set(name, buffer);
                
                console.log(`📍 Memory-mapped file: ${name} (${size} bytes)`);
            } catch (error) {
                console.error(`Failed to create mmap file ${name}:`, error);
            }
        }
    }
    
    async handleMmapRead(connectionId, request) {
        const { file, offset, length } = request;
        
        const buffer = this.mmapFiles.get(file);
        if (!buffer) {
            throw new Error('Memory-mapped file not found');
        }
        
        const data = buffer.slice(offset, offset + length);
        
        return {
            type: 'mmap-data',
            data: data.toString('base64'),
            length: data.length
        };
    }
    
    async handleMmapWrite(connectionId, request) {
        const { file, offset, data } = request;
        
        const buffer = this.mmapFiles.get(file);
        if (!buffer) {
            throw new Error('Memory-mapped file not found');
        }
        
        const writeBuffer = Buffer.from(data, 'base64');
        writeBuffer.copy(buffer, offset);
        
        // Sync to disk
        mmap.sync(buffer, offset, writeBuffer.length, mmap.MS_SYNC);
        
        return {
            type: 'mmap-write-result',
            written: writeBuffer.length
        };
    }
    
    async startReplicationListener() {
        const server = net.createServer((socket) => {
            const peerId = crypto.randomUUID();
            
            this.replicationPeers.add({
                id: peerId,
                socket,
                lastSequence: 0
            });
            
            socket.on('data', async (data) => {
                try {
                    const request = JSON.parse(data.toString());
                    
                    if (request.type === 'sync') {
                        // Send all operations since peer's last sequence
                        const operations = this.replicationLog.filter(
                            op => op.sequence > request.lastSequence
                        );
                        
                        socket.write(JSON.stringify({
                            type: 'sync-data',
                            operations,
                            currentSequence: this.replicationSequence
                        }) + '\n');
                    }
                } catch (error) {
                    console.error('Replication error:', error);
                }
            });
            
            socket.on('close', () => {
                this.replicationPeers.delete(
                    Array.from(this.replicationPeers).find(p => p.id === peerId)
                );
            });
        });
        
        server.listen(this.config.replicationPort, () => {
            console.log(`📡 Replication server listening on port ${this.config.replicationPort}`);
        });
    }
    
    logReplication(operation) {
        this.replicationLog.push(operation);
        
        // Keep only last 10000 operations
        if (this.replicationLog.length > 10000) {
            this.replicationLog = this.replicationLog.slice(-10000);
        }
        
        // Broadcast to peers
        this.replicationPeers.forEach(peer => {
            try {
                peer.socket.write(JSON.stringify({
                    type: 'operation',
                    operation
                }) + '\n');
                peer.lastSequence = operation.sequence;
            } catch (error) {
                // Peer disconnected
            }
        });
    }
    
    cacheQuery(key, result) {
        // Simple LRU cache implementation
        const maxCacheSize = 1000;
        
        if (this.queryCache.size >= maxCacheSize) {
            // Evict oldest entry
            const firstKey = this.queryCache.keys().next().value;
            this.queryCache.delete(firstKey);
            this.cacheStats.evictions++;
        }
        
        this.queryCache.set(key, result);
        this.cacheStats.size = this.queryCache.size;
    }
    
    invalidateCache(database) {
        // Invalidate all cache entries for this database
        for (const key of this.queryCache.keys()) {
            if (key.startsWith(`${database}:`)) {
                this.queryCache.delete(key);
            }
        }
    }
    
    startMetricsCollection() {
        setInterval(() => {
            // Write metrics to memory-mapped file
            const metricsBuffer = this.mmapFiles.get('metrics');
            if (metricsBuffer) {
                const metricsData = Buffer.from(JSON.stringify({
                    ...this.metrics,
                    cache: this.cacheStats,
                    timestamp: Date.now()
                }));
                
                metricsData.copy(metricsBuffer, 0);
                mmap.sync(metricsBuffer, 0, metricsData.length, mmap.MS_SYNC);
            }
            
            // Emit metrics event
            this.emit('metrics', this.metrics);
        }, 1000);
    }
    
    // Database schemas
    getUserSchema() {
        return [
            `CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                updated_at INTEGER DEFAULT (strftime('%s', 'now'))
            )`,
            `CREATE TABLE IF NOT EXISTS user_profiles (
                user_id TEXT PRIMARY KEY,
                display_name TEXT,
                avatar TEXT,
                bio TEXT,
                theme_id TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,
            `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
            `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
        ];
    }
    
    getTeamSchema() {
        return [
            `CREATE TABLE IF NOT EXISTS teams (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                owner_id TEXT NOT NULL,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (owner_id) REFERENCES users(id)
            )`,
            `CREATE TABLE IF NOT EXISTS team_members (
                team_id TEXT,
                user_id TEXT,
                role TEXT DEFAULT 'member',
                joined_at INTEGER DEFAULT (strftime('%s', 'now')),
                PRIMARY KEY (team_id, user_id),
                FOREIGN KEY (team_id) REFERENCES teams(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`
        ];
    }
    
    getEconomySchema() {
        return [
            `CREATE TABLE IF NOT EXISTS wallets (
                user_id TEXT,
                token_type TEXT,
                balance REAL DEFAULT 0,
                updated_at INTEGER DEFAULT (strftime('%s', 'now')),
                PRIMARY KEY (user_id, token_type),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,
            `CREATE TABLE IF NOT EXISTS transactions (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                from_user TEXT,
                to_user TEXT,
                token_type TEXT,
                amount REAL,
                fee REAL DEFAULT 0,
                status TEXT DEFAULT 'pending',
                created_at INTEGER DEFAULT (strftime('%s', 'now'))
            )`,
            `CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                type TEXT NOT NULL,
                pair TEXT NOT NULL,
                side TEXT NOT NULL,
                price REAL,
                amount REAL,
                filled REAL DEFAULT 0,
                status TEXT DEFAULT 'open',
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,
            `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`,
            `CREATE INDEX IF NOT EXISTS idx_orders_pair ON orders(pair)`
        ];
    }
    
    getThemeSchema() {
        return [
            `CREATE TABLE IF NOT EXISTS themes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                creator_id TEXT NOT NULL,
                preview_url TEXT,
                config JSON,
                downloads INTEGER DEFAULT 0,
                rating REAL DEFAULT 0,
                price REAL DEFAULT 0,
                currency TEXT DEFAULT 'FART',
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (creator_id) REFERENCES users(id)
            )`,
            `CREATE TABLE IF NOT EXISTS theme_purchases (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                theme_id TEXT NOT NULL,
                price REAL,
                currency TEXT,
                purchased_at INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (theme_id) REFERENCES themes(id)
            )`
        ];
    }
    
    getCollaborationSchema() {
        return [
            `CREATE TABLE IF NOT EXISTS workspaces (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                owner_id TEXT NOT NULL,
                type TEXT DEFAULT 'project',
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (owner_id) REFERENCES users(id)
            )`,
            `CREATE TABLE IF NOT EXISTS workspace_members (
                workspace_id TEXT,
                user_id TEXT,
                permissions TEXT DEFAULT 'read',
                joined_at INTEGER DEFAULT (strftime('%s', 'now')),
                PRIMARY KEY (workspace_id, user_id),
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )`,
            `CREATE TABLE IF NOT EXISTS files (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                path TEXT NOT NULL,
                content TEXT,
                version INTEGER DEFAULT 1,
                created_by TEXT NOT NULL,
                updated_at INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`
        ];
    }
    
    getSystemSchema() {
        return [
            `CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at INTEGER DEFAULT (strftime('%s', 'now'))
            )`,
            `CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT,
                action TEXT NOT NULL,
                resource TEXT,
                details JSON,
                ip_address TEXT,
                timestamp INTEGER DEFAULT (strftime('%s', 'now'))
            )`,
            `CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp)`
        ];
    }
    
    // Backup and recovery
    async backup(database, backupPath) {
        const db = this.databases.get(database);
        if (!db) {
            throw new Error('Database not found');
        }
        
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const backupFile = backupPath || 
            path.join(this.config.backupPath, `${database}-${timestamp}.db`);
        
        await db.backup(backupFile);
        
        console.log(`💾 Backup created: ${backupFile}`);
        
        return backupFile;
    }
    
    async restore(database, backupFile) {
        // Close existing database
        const existingDb = this.databases.get(database);
        if (existingDb) {
            existingDb.close();
            this.databases.delete(database);
        }
        
        // Copy backup file
        const dbPath = path.join(this.config.basePath, `${database}.db`);
        await fs.copyFile(backupFile, dbPath);
        
        // Reopen database
        await this.createDatabase(database);
        
        console.log(`♻️ Database restored from: ${backupFile}`);
    }
    
    // Client library
    createClient() {
        return new UnixDatabaseClient(this.config.socketPath);
    }
}

// Client class for connecting to the database
class UnixDatabaseClient extends EventEmitter {
    constructor(socketPath) {
        super();
        this.socketPath = socketPath;
        this.socket = null;
        this.connected = false;
        this.requestQueue = new Map();
    }
    
    async connect(auth) {
        return new Promise((resolve, reject) => {
            this.socket = net.createConnection(this.socketPath, () => {
                this.connected = true;
                
                // Send auth
                this.socket.write(JSON.stringify({
                    type: 'auth',
                    ...auth
                }) + '\n');
                
                resolve();
            });
            
            this.socket.on('data', (data) => {
                const messages = data.toString().split('\n').filter(m => m);
                
                messages.forEach(message => {
                    try {
                        const response = JSON.parse(message);
                        
                        if (response.requestId && this.requestQueue.has(response.requestId)) {
                            const { resolve, reject } = this.requestQueue.get(response.requestId);
                            this.requestQueue.delete(response.requestId);
                            
                            if (response.error) {
                                reject(new Error(response.error));
                            } else {
                                resolve(response);
                            }
                        } else {
                            this.emit('message', response);
                        }
                    } catch (error) {
                        console.error('Failed to parse response:', error);
                    }
                });
            });
            
            this.socket.on('error', reject);
            
            this.socket.on('close', () => {
                this.connected = false;
                this.emit('close');
            });
        });
    }
    
    async query(database, sql, params = []) {
        return this.request({ type: 'query', database, sql, params });
    }
    
    async execute(database, sql, params = []) {
        return this.request({ type: 'execute', database, sql, params });
    }
    
    async transaction(database, operations) {
        return this.request({ type: 'transaction', database, operations });
    }
    
    async request(data) {
        if (!this.connected) {
            throw new Error('Not connected');
        }
        
        const requestId = crypto.randomUUID();
        
        return new Promise((resolve, reject) => {
            this.requestQueue.set(requestId, { resolve, reject });
            
            this.socket.write(JSON.stringify({
                ...data,
                requestId
            }) + '\n');
            
            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.requestQueue.has(requestId)) {
                    this.requestQueue.delete(requestId);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }
    
    close() {
        if (this.socket) {
            this.socket.end();
        }
    }
}

// Export classes
module.exports = { UnixCustomDatabase, UnixDatabaseClient };

// Start the database if run directly
if (require.main === module) {
    const db = new UnixCustomDatabase();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🔌 Shutting down Unix Database System...');
        
        // Close all databases
        for (const [name, database] of db.databases) {
            database.close();
        }
        
        // Close socket server
        if (db.socketServer) {
            db.socketServer.close();
        }
        
        process.exit(0);
    });
}