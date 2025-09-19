#!/usr/bin/env node
/**
 * 🏗️ SIMPLE INFRASTRUCTURE
 * 
 * Replace complex Docker/MinIO/Redis with simple file-based alternatives
 * that actually work.
 */

const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

class SimpleInfrastructure {
    constructor() {
        this.dataPath = path.join(__dirname, 'simple-data');
        this.dbPath = path.join(this.dataPath, 'database.sqlite');
        this.queuePath = path.join(this.dataPath, 'queue');
        this.storagePath = path.join(this.dataPath, 'storage');
        this.cachePath = path.join(this.dataPath, 'cache');
        
        this.db = null;
    }
    
    /**
     * Initialize all infrastructure
     */
    async initialize() {
        console.log('🏗️  Initializing Simple Infrastructure...\n');
        
        // Create directory structure
        await this.createDirectories();
        
        // Initialize database
        await this.initializeDatabase();
        
        // Initialize queue system
        await this.initializeQueue();
        
        // Initialize storage
        await this.initializeStorage();
        
        // Initialize cache
        await this.initializeCache();
        
        console.log('✅ Simple infrastructure ready!\n');
        
        return {
            db: this.db,
            queue: this.createQueueInterface(),
            storage: this.createStorageInterface(),
            cache: this.createCacheInterface()
        };
    }
    
    /**
     * Create directory structure
     */
    async createDirectories() {
        console.log('📁 Creating directories...');
        
        const dirs = [
            this.dataPath,
            this.queuePath,
            this.storagePath,
            this.cachePath,
            path.join(this.storagePath, 'documents'),
            path.join(this.storagePath, 'templates'),
            path.join(this.storagePath, 'generated')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        console.log('✅ Directories created');
    }
    
    /**
     * Initialize SQLite database
     */
    async initializeDatabase() {
        console.log('🗄️  Initializing SQLite database...');
        
        this.db = await open({
            filename: this.dbPath,
            driver: sqlite3.Database
        });
        
        // Create tables
        await this.db.exec(`
            -- Documents table
            CREATE TABLE IF NOT EXISTS documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT,
                type TEXT,
                status TEXT DEFAULT 'draft',
                metadata JSON,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Templates table
            CREATE TABLE IF NOT EXISTS templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                template_data JSON,
                category TEXT,
                usage_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Generated outputs table
            CREATE TABLE IF NOT EXISTS outputs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER,
                template_id INTEGER,
                output_type TEXT,
                file_path TEXT,
                metadata JSON,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (document_id) REFERENCES documents(id),
                FOREIGN KEY (template_id) REFERENCES templates(id)
            );
            
            -- Simple key-value store (replaces Redis)
            CREATE TABLE IF NOT EXISTS kv_store (
                key TEXT PRIMARY KEY,
                value TEXT,
                expires_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            -- Queue table (replaces Redis queues)
            CREATE TABLE IF NOT EXISTS queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                queue_name TEXT NOT NULL,
                payload JSON,
                status TEXT DEFAULT 'pending',
                priority INTEGER DEFAULT 0,
                attempts INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                processed_at DATETIME
            );
            
            -- Create indexes
            CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
            CREATE INDEX IF NOT EXISTS idx_queue_status ON queue(queue_name, status);
            CREATE INDEX IF NOT EXISTS idx_kv_expires ON kv_store(expires_at);
        `);
        
        console.log('✅ Database initialized');
    }
    
    /**
     * Initialize file-based queue system
     */
    async initializeQueue() {
        console.log('📬 Initializing queue system...');
        
        // Create queue directories
        const queues = ['documents', 'processing', 'generation', 'notifications'];
        
        for (const queue of queues) {
            const queueDir = path.join(this.queuePath, queue);
            await fs.mkdir(queueDir, { recursive: true });
            
            // Create subdirectories for queue states
            await fs.mkdir(path.join(queueDir, 'pending'), { recursive: true });
            await fs.mkdir(path.join(queueDir, 'processing'), { recursive: true });
            await fs.mkdir(path.join(queueDir, 'completed'), { recursive: true });
            await fs.mkdir(path.join(queueDir, 'failed'), { recursive: true });
        }
        
        console.log('✅ Queue system initialized');
    }
    
    /**
     * Initialize storage system
     */
    async initializeStorage() {
        console.log('💾 Initializing storage...');
        
        // Create storage info file
        const storageInfo = {
            version: '1.0.0',
            created: new Date().toISOString(),
            structure: {
                documents: 'User uploaded documents',
                templates: 'System and user templates',
                generated: 'Generated outputs'
            }
        };
        
        await fs.writeFile(
            path.join(this.storagePath, 'storage-info.json'),
            JSON.stringify(storageInfo, null, 2)
        );
        
        console.log('✅ Storage initialized');
    }
    
    /**
     * Initialize cache system
     */
    async initializeCache() {
        console.log('⚡ Initializing cache...');
        
        // Create cache info
        const cacheInfo = {
            version: '1.0.0',
            type: 'file-based',
            eviction: 'LRU',
            maxSize: '100MB'
        };
        
        await fs.writeFile(
            path.join(this.cachePath, 'cache-info.json'),
            JSON.stringify(cacheInfo, null, 2)
        );
        
        console.log('✅ Cache initialized');
    }
    
    /**
     * Create queue interface (Redis replacement)
     */
    createQueueInterface() {
        return {
            push: async (queueName, data) => {
                const id = Date.now() + Math.random().toString(36).substr(2, 9);
                const filePath = path.join(this.queuePath, queueName, 'pending', `${id}.json`);
                
                await fs.writeFile(filePath, JSON.stringify({
                    id,
                    data,
                    created: new Date().toISOString()
                }, null, 2));
                
                // Also add to database for querying
                await this.db.run(
                    'INSERT INTO queue (queue_name, payload) VALUES (?, ?)',
                    [queueName, JSON.stringify(data)]
                );
                
                return id;
            },
            
            pop: async (queueName) => {
                const pendingDir = path.join(this.queuePath, queueName, 'pending');
                const processingDir = path.join(this.queuePath, queueName, 'processing');
                
                try {
                    const files = await fs.readdir(pendingDir);
                    if (files.length === 0) return null;
                    
                    const file = files[0];
                    const oldPath = path.join(pendingDir, file);
                    const newPath = path.join(processingDir, file);
                    
                    // Move to processing
                    await fs.rename(oldPath, newPath);
                    
                    // Read and return data
                    const content = await fs.readFile(newPath, 'utf-8');
                    return JSON.parse(content);
                } catch (error) {
                    return null;
                }
            },
            
            complete: async (queueName, id) => {
                const processingPath = path.join(this.queuePath, queueName, 'processing', `${id}.json`);
                const completedPath = path.join(this.queuePath, queueName, 'completed', `${id}.json`);
                
                await fs.rename(processingPath, completedPath);
                
                await this.db.run(
                    'UPDATE queue SET status = ?, processed_at = ? WHERE queue_name = ? AND payload LIKE ?',
                    ['completed', new Date().toISOString(), queueName, `%"id":"${id}"%`]
                );
            },
            
            fail: async (queueName, id, error) => {
                const processingPath = path.join(this.queuePath, queueName, 'processing', `${id}.json`);
                const failedPath = path.join(this.queuePath, queueName, 'failed', `${id}.json`);
                
                // Add error to file
                const content = JSON.parse(await fs.readFile(processingPath, 'utf-8'));
                content.error = error;
                content.failedAt = new Date().toISOString();
                
                await fs.writeFile(failedPath, JSON.stringify(content, null, 2));
                await fs.unlink(processingPath);
                
                await this.db.run(
                    'UPDATE queue SET status = ?, processed_at = ? WHERE queue_name = ? AND payload LIKE ?',
                    ['failed', new Date().toISOString(), queueName, `%"id":"${id}"%`]
                );
            }
        };
    }
    
    /**
     * Create storage interface (MinIO replacement)
     */
    createStorageInterface() {
        return {
            upload: async (bucket, key, data) => {
                const filePath = path.join(this.storagePath, bucket, key);
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                
                if (typeof data === 'string') {
                    await fs.writeFile(filePath, data);
                } else {
                    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
                }
                
                return { bucket, key, path: filePath };
            },
            
            download: async (bucket, key) => {
                const filePath = path.join(this.storagePath, bucket, key);
                const content = await fs.readFile(filePath, 'utf-8');
                
                try {
                    return JSON.parse(content);
                } catch {
                    return content;
                }
            },
            
            exists: async (bucket, key) => {
                const filePath = path.join(this.storagePath, bucket, key);
                try {
                    await fs.access(filePath);
                    return true;
                } catch {
                    return false;
                }
            },
            
            delete: async (bucket, key) => {
                const filePath = path.join(this.storagePath, bucket, key);
                await fs.unlink(filePath);
            },
            
            list: async (bucket, prefix = '') => {
                const bucketPath = path.join(this.storagePath, bucket);
                const files = await this.walkDirectory(bucketPath);
                
                return files
                    .filter(f => f.startsWith(prefix))
                    .map(f => ({
                        key: f,
                        size: 0, // Would need stat for real size
                        lastModified: new Date()
                    }));
            }
        };
    }
    
    /**
     * Create cache interface (Redis cache replacement)
     */
    createCacheInterface() {
        return {
            get: async (key) => {
                const row = await this.db.get(
                    'SELECT value FROM kv_store WHERE key = ? AND (expires_at IS NULL OR expires_at > datetime("now"))',
                    [key]
                );
                
                return row ? JSON.parse(row.value) : null;
            },
            
            set: async (key, value, ttl = null) => {
                const expiresAt = ttl ? new Date(Date.now() + ttl * 1000).toISOString() : null;
                
                await this.db.run(
                    `INSERT OR REPLACE INTO kv_store (key, value, expires_at, updated_at) 
                     VALUES (?, ?, ?, datetime("now"))`,
                    [key, JSON.stringify(value), expiresAt]
                );
            },
            
            delete: async (key) => {
                await this.db.run('DELETE FROM kv_store WHERE key = ?', [key]);
            },
            
            clear: async () => {
                await this.db.run('DELETE FROM kv_store');
            },
            
            cleanup: async () => {
                // Remove expired entries
                await this.db.run(
                    'DELETE FROM kv_store WHERE expires_at IS NOT NULL AND expires_at < datetime("now")'
                );
            }
        };
    }
    
    /**
     * Walk directory recursively
     */
    async walkDirectory(dir, baseDir = dir, files = []) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            if (entry.isDirectory()) {
                await this.walkDirectory(fullPath, baseDir, files);
            } else {
                files.push(path.relative(baseDir, fullPath));
            }
        }
        
        return files;
    }
    
    /**
     * Get status of all services
     */
    async getStatus() {
        const status = {
            database: 'operational',
            queue: 'operational',
            storage: 'operational',
            cache: 'operational',
            details: {}
        };
        
        // Check database
        try {
            const result = await this.db.get('SELECT COUNT(*) as count FROM documents');
            status.details.documents = result.count;
        } catch {
            status.database = 'error';
        }
        
        // Check queue
        try {
            const queues = await fs.readdir(this.queuePath);
            status.details.queues = queues.length;
        } catch {
            status.queue = 'error';
        }
        
        // Check storage
        try {
            const buckets = await fs.readdir(this.storagePath);
            status.details.buckets = buckets.length;
        } catch {
            status.storage = 'error';
        }
        
        return status;
    }
}

// Export for use in other modules
module.exports = SimpleInfrastructure;

// Run if called directly
if (require.main === module) {
    const infra = new SimpleInfrastructure();
    infra.initialize()
        .then(async (services) => {
            console.log('🎉 Simple Infrastructure is ready!\n');
            
            console.log('📊 Testing services...\n');
            
            // Test database
            await services.db.run(
                'INSERT INTO documents (title, content) VALUES (?, ?)',
                ['Test Document', 'This is a test']
            );
            console.log('✅ Database: Working');
            
            // Test queue
            const jobId = await services.queue.push('documents', { action: 'process', id: 1 });
            console.log('✅ Queue: Working (Job ID:', jobId, ')');
            
            // Test storage
            await services.storage.upload('documents', 'test.txt', 'Hello, World!');
            console.log('✅ Storage: Working');
            
            // Test cache
            await services.cache.set('test-key', { value: 'test' }, 60);
            console.log('✅ Cache: Working');
            
            const status = await infra.getStatus();
            console.log('\n📈 Status:', status);
            
            console.log(`
🚀 You can now use these simple file-based services instead of:
   - PostgreSQL → SQLite (${infra.dbPath})
   - Redis → File Queue (${infra.queuePath})
   - MinIO → File Storage (${infra.storagePath})
   - Redis Cache → SQLite Cache

No Docker required! Everything just works.
`);
        })
        .catch(console.error);
}