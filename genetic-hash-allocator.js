#!/usr/bin/env node

/**
 * GENETIC HASH ALLOCATOR
 * Monitors the RNG/Deep Tier stream and maintains a pool of unassigned genetic hashes
 * Ensures fair distribution and prevents duplicate assignments
 */

const http = require('http');
const fs = require('fs');
const readline = require('readline');
const mysql = require('mysql2/promise');
const { EventEmitter } = require('events');

// Import genetic decoder
const GeneticHashDecoder = require('./test-genetic-decoder');

class GeneticHashAllocator extends EventEmitter {
    constructor() {
        super();
        
        this.geneticDecoder = new GeneticHashDecoder();
        this.dbPool = null;
        
        // Allocator configuration
        this.config = {
            deepTierUrl: 'http://localhost:40000',
            rngLayerUrl: 'http://localhost:39000',
            
            dbHost: process.env.DB_HOST || 'localhost',
            dbUser: process.env.DB_USER || 'root',
            dbPassword: process.env.DB_PASSWORD || '',
            dbName: process.env.DB_NAME || 'economic_engine',
            
            minPoolSize: 100,      // Minimum hashes to maintain
            maxPoolSize: 1000,     // Maximum to prevent overflow
            qualityThreshold: 40,  // Minimum quality score
            
            checkInterval: 5000,   // Check stream every 5 seconds
            poolCheckInterval: 30000, // Check pool health every 30 seconds
            
            streamFiles: [
                'rng-to-deeptier.jsonl',
                'stream-verification.jsonl',
                'deep-tier-output.jsonl'
            ]
        };
        
        // Tracking state
        this.state = {
            totalProcessed: 0,
            totalAllocated: 0,
            totalRejected: 0,
            poolSize: 0,
            lastCheck: null,
            isMonitoring: false
        };
        
        // In-memory cache of recent hashes to prevent duplicates
        this.recentHashes = new Set();
        this.maxRecentSize = 10000;
        
        console.log('🧬 Genetic Hash Allocator initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Connect to database
            await this.connectDatabase();
            
            // Load existing pool state
            await this.loadPoolState();
            
            // Process any existing stream files
            await this.processExistingStreams();
            
            // Start monitoring streams
            this.startStreamMonitoring();
            
            // Start pool health monitoring
            this.startPoolHealthMonitoring();
            
            // Try to connect to Deep Tier directly
            this.connectToDeepTier();
            
            console.log('🧬 Genetic Hash Allocator ready');
            console.log(`📊 Current pool size: ${this.state.poolSize} hashes`);
            
            this.emit('ready', this.state);
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.emit('error', error);
        }
    }
    
    async connectDatabase() {
        this.dbPool = await mysql.createPool({
            host: this.config.dbHost,
            user: this.config.dbUser,
            password: this.config.dbPassword,
            database: this.config.dbName,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        // Test connection
        const connection = await this.dbPool.getConnection();
        await connection.ping();
        connection.release();
        
        console.log('📊 Database connected');
    }
    
    async loadPoolState() {
        try {
            // Get current pool size
            const [poolResult] = await this.dbPool.execute(
                'SELECT COUNT(*) as count FROM genetic_hash_pool WHERE is_assigned = FALSE'
            );
            this.state.poolSize = poolResult[0].count;
            
            // Get allocation stats
            const [statsResult] = await this.dbPool.execute(
                `SELECT 
                    COUNT(CASE WHEN is_assigned = TRUE THEN 1 END) as allocated,
                    COUNT(*) as total
                FROM genetic_hash_pool`
            );
            
            this.state.totalAllocated = statsResult[0].allocated;
            this.state.totalProcessed = statsResult[0].total;
            
            // Load recent hashes to prevent duplicates
            const [recentResult] = await this.dbPool.execute(
                'SELECT hash FROM genetic_hash_pool ORDER BY created_at DESC LIMIT ?',
                [this.maxRecentSize]
            );
            
            recentResult.forEach(row => {
                this.recentHashes.add(row.hash);
            });
            
            console.log(`📊 Loaded pool state: ${this.state.poolSize} available, ${this.state.totalAllocated} allocated`);
            
        } catch (error) {
            console.error('Error loading pool state:', error);
        }
    }
    
    async processExistingStreams() {
        console.log('🔍 Processing existing stream files...');
        
        for (const filename of this.config.streamFiles) {
            if (fs.existsSync(filename)) {
                await this.processStreamFile(filename);
            }
        }
    }
    
    async processStreamFile(filename) {
        try {
            const fileStream = fs.createReadStream(filename);
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });
            
            let processedCount = 0;
            let addedCount = 0;
            
            for await (const line of rl) {
                if (line.trim()) {
                    try {
                        const data = JSON.parse(line);
                        const hash = this.extractHash(data);
                        
                        if (hash && await this.processHash(hash, data)) {
                            addedCount++;
                        }
                        processedCount++;
                        
                    } catch (error) {
                        // Skip malformed lines
                    }
                }
            }
            
            if (addedCount > 0) {
                console.log(`📥 Processed ${filename}: ${addedCount} new hashes added (${processedCount} total lines)`);
            }
            
        } catch (error) {
            console.error(`Error processing ${filename}:`, error);
        }
    }
    
    extractHash(data) {
        // Try different locations where hash might be stored
        return data.verification?.hash || 
               data.hash || 
               data.data?.hash ||
               data.geneticHash ||
               null;
    }
    
    async processHash(hash, metadata = {}) {
        // Check if we've seen this hash recently
        if (this.recentHashes.has(hash)) {
            return false;
        }
        
        // Validate hash format (16 hex characters)
        if (!/^[a-f0-9]{16}$/i.test(hash)) {
            this.state.totalRejected++;
            return false;
        }
        
        try {
            // Decode genetic traits
            const decoded = this.geneticDecoder.decodeHash(hash);
            
            // Check quality threshold
            if (decoded.qualityScore < this.config.qualityThreshold) {
                this.state.totalRejected++;
                this.emit('hashRejected', { hash, reason: 'low_quality', quality: decoded.qualityScore });
                return false;
            }
            
            // Add to database pool
            const [result] = await this.dbPool.execute(
                `INSERT IGNORE INTO genetic_hash_pool 
                (hash, parent_hash, lineage_code, temperature, quality_score, decoded_traits, source) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    hash,
                    metadata.parentHash || decoded.parentHash || null,
                    hash.substring(0, 4),
                    decoded.temperature,
                    decoded.qualityScore,
                    JSON.stringify(decoded),
                    metadata.source || 'STREAM'
                ]
            );
            
            if (result.affectedRows > 0) {
                this.recentHashes.add(hash);
                this.state.totalProcessed++;
                this.state.poolSize++;
                
                // Trim recent hashes if too large
                if (this.recentHashes.size > this.maxRecentSize) {
                    const firstHash = this.recentHashes.values().next().value;
                    this.recentHashes.delete(firstHash);
                }
                
                this.emit('hashAdded', {
                    hash,
                    lineage: decoded.lineage,
                    quality: decoded.qualityScore,
                    temperature: decoded.temperature
                });
                
                return true;
            }
            
        } catch (error) {
            console.error('Error processing hash:', error);
        }
        
        return false;
    }
    
    startStreamMonitoring() {
        this.state.isMonitoring = true;
        
        // Monitor each stream file for changes
        this.config.streamFiles.forEach(filename => {
            if (fs.existsSync(filename)) {
                let lastSize = fs.statSync(filename).size;
                
                fs.watchFile(filename, { interval: this.config.checkInterval }, async (curr, prev) => {
                    if (curr.size > lastSize) {
                        // File has grown, process new lines
                        await this.processNewLines(filename, lastSize);
                        lastSize = curr.size;
                    }
                });
                
                console.log(`👁️ Monitoring ${filename} for new hashes`);
            }
        });
    }
    
    async processNewLines(filename, startPosition) {
        try {
            const stream = fs.createReadStream(filename, { start: startPosition });
            const rl = readline.createInterface({
                input: stream,
                crlfDelay: Infinity
            });
            
            let newCount = 0;
            
            for await (const line of rl) {
                if (line.trim()) {
                    try {
                        const data = JSON.parse(line);
                        const hash = this.extractHash(data);
                        
                        if (hash && await this.processHash(hash, data)) {
                            newCount++;
                        }
                        
                    } catch (error) {
                        // Skip malformed lines
                    }
                }
            }
            
            if (newCount > 0) {
                console.log(`📥 Added ${newCount} new hashes from ${filename}`);
                this.emit('poolUpdated', { added: newCount, total: this.state.poolSize });
            }
            
        } catch (error) {
            console.error(`Error processing new lines from ${filename}:`, error);
        }
    }
    
    connectToDeepTier() {
        // Try to establish direct connection to Deep Tier service
        const checkDeepTier = () => {
            http.get(`${this.config.deepTierUrl}/status`, (res) => {
                if (res.statusCode === 200) {
                    console.log('✅ Connected to Deep Tier service');
                    this.monitorDeepTierStream();
                }
            }).on('error', () => {
                // Deep Tier not available, rely on file monitoring
            });
        };
        
        // Check every 30 seconds
        checkDeepTier();
        setInterval(checkDeepTier, 30000);
    }
    
    monitorDeepTierStream() {
        // In a real implementation, would establish WebSocket or SSE connection
        console.log('📡 Monitoring Deep Tier stream directly');
    }
    
    startPoolHealthMonitoring() {
        setInterval(async () => {
            await this.checkPoolHealth();
        }, this.config.poolCheckInterval);
    }
    
    async checkPoolHealth() {
        try {
            // Get current pool statistics
            const [poolStats] = await this.dbPool.execute(
                `SELECT 
                    COUNT(CASE WHEN is_assigned = FALSE THEN 1 END) as available,
                    COUNT(CASE WHEN is_assigned = TRUE THEN 1 END) as assigned,
                    COUNT(*) as total,
                    JSON_EXTRACT(decoded_traits, '$.lineage') as lineage,
                    AVG(quality_score) as avg_quality
                FROM genetic_hash_pool
                GROUP BY JSON_EXTRACT(decoded_traits, '$.lineage')`
            );
            
            // Update state
            const available = poolStats.reduce((sum, row) => sum + parseInt(row.available), 0);
            this.state.poolSize = available;
            
            // Check if pool is low
            if (available < this.config.minPoolSize) {
                console.log(`⚠️ Hash pool low: ${available}/${this.config.minPoolSize} minimum`);
                this.emit('poolLow', { available, minimum: this.config.minPoolSize });
                
                // Could trigger more aggressive hash collection here
            }
            
            // Check if pool is too large
            if (available > this.config.maxPoolSize) {
                console.log(`⚠️ Hash pool overflow: ${available}/${this.config.maxPoolSize} maximum`);
                // Could implement cleanup of low-quality hashes
            }
            
            // Log lineage distribution
            console.log('📊 Pool health check:');
            poolStats.forEach(stat => {
                if (stat.lineage) {
                    const lineage = stat.lineage.replace(/"/g, '');
                    console.log(`   ${lineage}: ${stat.available} available, ${stat.assigned} assigned (avg quality: ${parseFloat(stat.avg_quality).toFixed(1)})`);
                }
            });
            
            this.state.lastCheck = new Date();
            this.emit('healthCheck', {
                available,
                stats: poolStats,
                timestamp: this.state.lastCheck
            });
            
        } catch (error) {
            console.error('Pool health check error:', error);
        }
    }
    
    /**
     * Allocate a hash for character creation
     */
    async allocateHash(lineagePreference = null, minQuality = null) {
        const connection = await this.dbPool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Build query based on preferences
            let query = `
                SELECT * FROM genetic_hash_pool 
                WHERE is_assigned = FALSE
            `;
            const params = [];
            
            if (lineagePreference) {
                query += ` AND JSON_EXTRACT(decoded_traits, '$.lineage') = ?`;
                params.push(lineagePreference);
            }
            
            if (minQuality !== null) {
                query += ` AND quality_score >= ?`;
                params.push(minQuality);
            } else {
                query += ` AND quality_score >= ?`;
                params.push(this.config.qualityThreshold);
            }
            
            query += ` ORDER BY quality_score DESC LIMIT 1 FOR UPDATE`;
            
            const [hashes] = await connection.execute(query, params);
            
            if (hashes.length === 0) {
                throw new Error('No suitable hashes available');
            }
            
            const hash = hashes[0];
            
            // Mark as assigned
            await connection.execute(
                'UPDATE genetic_hash_pool SET is_assigned = TRUE, assigned_at = NOW() WHERE id = ?',
                [hash.id]
            );
            
            await connection.commit();
            
            this.state.totalAllocated++;
            this.state.poolSize--;
            
            console.log(`🎯 Allocated hash: ${hash.hash} (${JSON.parse(hash.decoded_traits).lineage})`);
            
            this.emit('hashAllocated', {
                hash: hash.hash,
                traits: JSON.parse(hash.decoded_traits),
                quality: hash.quality_score
            });
            
            return hash;
            
        } catch (error) {
            await connection.rollback();
            console.error('Hash allocation error:', error);
            throw error;
            
        } finally {
            connection.release();
        }
    }
    
    /**
     * Get allocation statistics
     */
    async getStats() {
        const stats = {
            ...this.state,
            lineageDistribution: {}
        };
        
        try {
            const [lineages] = await this.dbPool.execute(
                `SELECT 
                    JSON_EXTRACT(decoded_traits, '$.lineage') as lineage,
                    COUNT(CASE WHEN is_assigned = FALSE THEN 1 END) as available,
                    COUNT(CASE WHEN is_assigned = TRUE THEN 1 END) as assigned
                FROM genetic_hash_pool
                GROUP BY JSON_EXTRACT(decoded_traits, '$.lineage')`
            );
            
            lineages.forEach(row => {
                if (row.lineage) {
                    const lineage = row.lineage.replace(/"/g, '');
                    stats.lineageDistribution[lineage] = {
                        available: parseInt(row.available),
                        assigned: parseInt(row.assigned)
                    };
                }
            });
            
        } catch (error) {
            console.error('Error getting stats:', error);
        }
        
        return stats;
    }
    
    /**
     * Cleanup and shutdown
     */
    async shutdown() {
        console.log('🧬 Genetic Hash Allocator shutting down...');
        
        this.state.isMonitoring = false;
        
        // Stop watching files
        this.config.streamFiles.forEach(filename => {
            if (fs.existsSync(filename)) {
                fs.unwatchFile(filename);
            }
        });
        
        if (this.dbPool) {
            await this.dbPool.end();
        }
        
        this.emit('shutdown');
    }
}

module.exports = GeneticHashAllocator;

// If run directly, start the allocator
if (require.main === module) {
    const allocator = new GeneticHashAllocator();
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        await allocator.shutdown();
        process.exit(0);
    });
    
    // Monitor events
    allocator.on('ready', (state) => {
        console.log('\n🧬 GENETIC HASH ALLOCATOR READY');
        console.log('==================================');
        console.log(`Pool size: ${state.poolSize} hashes`);
        console.log(`Total processed: ${state.totalProcessed}`);
        console.log(`Total allocated: ${state.totalAllocated}`);
    });
    
    allocator.on('hashAdded', (data) => {
        console.log(`➕ New ${data.lineage} hash (quality: ${data.quality.toFixed(1)})`);
    });
    
    allocator.on('poolUpdated', (data) => {
        console.log(`🔄 Pool updated: ${data.added} added, ${data.total} total`);
    });
    
    allocator.on('poolLow', (data) => {
        console.log(`⚠️ POOL LOW: Only ${data.available} hashes available!`);
    });
    
    // Show stats every minute
    setInterval(async () => {
        const stats = await allocator.getStats();
        console.log('\n📊 ALLOCATOR STATS:');
        console.log(`   Pool size: ${stats.poolSize}`);
        console.log(`   Total allocated: ${stats.totalAllocated}`);
        console.log(`   Lineage distribution:`);
        Object.entries(stats.lineageDistribution).forEach(([lineage, counts]) => {
            console.log(`     ${lineage}: ${counts.available} available, ${counts.assigned} assigned`);
        });
    }, 60000);
}