#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * 🛡️ BULLETPROOF USER STATE LOADER
 * 
 * Simple API: loadUserState(identifier) -> userState
 * Never crashes the system, always returns user state (cached if needed)
 * 
 * Features:
 * - Multiple lookup methods (ID, username, token, file path)
 * - Database connection pooling with circuit breaker
 * - File-based caching for offline access
 * - Memory caching with TTL
 * - Graceful degradation and error recovery
 * - Steam Deck / AMD GPU compatible (no X11 deps)
 */

class BulletproofUserStateLoader {
    constructor(options = {}) {
        this.config = {
            // Database configuration
            dbPath: options.dbPath || path.join(__dirname, 'empire-auth.blockchain.sql'),
            fallbackDbPath: options.fallbackDbPath || path.join(__dirname, 'unified-users.db'),
            
            // Cache configuration  
            cacheDir: options.cacheDir || path.join(__dirname, 'user-cache'),
            cacheTTL: options.cacheTTL || 5 * 60 * 1000, // 5 minutes
            maxCacheSize: options.maxCacheSize || 1000,
            
            // Circuit breaker configuration
            circuitBreakerThreshold: options.circuitBreakerThreshold || 5,
            circuitBreakerTimeout: options.circuitBreakerTimeout || 30000,
            
            // Memory cache configuration
            memCacheSize: options.memCacheSize || 100,
            memCacheTTL: options.memCacheTTL || 60000, // 1 minute
            
            // JWT configuration
            jwtSecret: options.jwtSecret || 'deathtodata-empire-secret-key',
            
            // Resource limits
            maxMemoryMB: options.maxMemoryMB || 50,
            queryTimeout: options.queryTimeout || 5000
        };
        
        this.memoryCache = new Map();
        this.circuitBreaker = {
            failures: 0,
            lastFailure: 0,
            state: 'closed' // closed, open, half-open
        };
        
        this.dbPool = null;
        this.fallbackDbPool = null;
        this.initialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            // Ensure cache directory exists
            await fs.mkdir(this.config.cacheDir, { recursive: true });
            
            // Initialize databases with connection limits
            await this.initializeDatabases();
            
            // Start memory cleanup interval
            this.startMemoryCleanup();
            
            this.initialized = true;
            console.log('🛡️ Bulletproof User State Loader initialized');
        } catch (error) {
            console.warn('⚠️ Initialization warning:', error.message);
            // Continue with degraded mode (cache-only)
            this.initialized = 'degraded';
        }
    }
    
    async initializeDatabases() {
        // Primary database (empire-auth)
        if (await this.fileExists(this.config.dbPath)) {
            this.dbPool = new sqlite3.Database(this.config.dbPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) console.warn('⚠️ Primary DB connection failed:', err.message);
            });
        }
        
        // Fallback database (unified users)
        if (await this.fileExists(this.config.fallbackDbPath)) {
            this.fallbackDbPool = new sqlite3.Database(this.config.fallbackDbPath, sqlite3.OPEN_READONLY, (err) => {
                if (err) console.warn('⚠️ Fallback DB connection failed:', err.message);
            });
        }
    }
    
    /**
     * Main API: Load user state by any identifier
     */
    async loadUserState(identifier) {
        if (!identifier) {
            return this.createEmptyUserState();
        }
        
        const startTime = Date.now();
        let result = null;
        let source = 'unknown';
        
        try {
            // 1. Check memory cache first
            const memCacheKey = this.generateCacheKey(identifier);
            const memCached = this.memoryCache.get(memCacheKey);
            if (memCached && !this.isCacheExpired(memCached)) {
                return { ...memCached.data, _source: 'memory', _loadTime: Date.now() - startTime };
            }
            
            // 2. Check file cache
            const fileCached = await this.loadFromFileCache(identifier);
            if (fileCached && !this.isCacheExpired(fileCached)) {
                this.setMemoryCache(memCacheKey, fileCached.data);
                return { ...fileCached.data, _source: 'file_cache', _loadTime: Date.now() - startTime };
            }
            
            // 3. Try database (with circuit breaker)
            if (this.canTryDatabase()) {
                result = await this.loadFromDatabase(identifier);
                if (result) {
                    source = 'database';
                    await this.saveToFileCache(identifier, result);
                    this.setMemoryCache(memCacheKey, result);
                    this.recordDatabaseSuccess();
                }
            }
            
            // 4. Fallback to expired cache if database fails
            if (!result && fileCached) {
                console.warn('⚠️ Using expired cache for user:', identifier);
                result = fileCached.data;
                source = 'expired_cache';
            }
            
            // 5. Last resort: create empty user state
            if (!result) {
                result = this.createEmptyUserState(identifier);
                source = 'generated';
            }
            
            return {
                ...result,
                _source: source,
                _loadTime: Date.now() - startTime
            };
            
        } catch (error) {
            console.error('❌ Error loading user state:', error.message);
            this.recordDatabaseFailure();
            
            // Return cached data if available, otherwise empty state
            if (fileCached) {
                return { ...fileCached.data, _source: 'error_fallback', _error: error.message };
            }
            
            return { ...this.createEmptyUserState(identifier), _source: 'error_generated', _error: error.message };
        }
    }
    
    async loadFromDatabase(identifier) {
        const identifierType = this.detectIdentifierType(identifier);
        
        // Try primary database first
        if (this.dbPool) {
            try {
                const result = await this.queryDatabase(this.dbPool, identifierType, identifier);
                if (result) return this.normalizeUserState(result, 'empire');
            } catch (error) {
                console.warn('⚠️ Primary DB query failed:', error.message);
            }
        }
        
        // Try fallback database
        if (this.fallbackDbPool) {
            try {
                const result = await this.queryDatabase(this.fallbackDbPool, identifierType, identifier);
                if (result) return this.normalizeUserState(result, 'unified');
            } catch (error) {
                console.warn('⚠️ Fallback DB query failed:', error.message);
            }
        }
        
        return null;
    }
    
    async queryDatabase(db, identifierType, identifier) {
        return new Promise((resolve, reject) => {
            let query;
            let params;
            
            switch (identifierType) {
                case 'user_id':
                    query = 'SELECT * FROM users WHERE id = ? LIMIT 1';
                    params = [parseInt(identifier)];
                    break;
                case 'username':
                    query = 'SELECT * FROM users WHERE username = ? COLLATE NOCASE LIMIT 1';
                    params = [identifier];
                    break;
                case 'email':
                    query = 'SELECT * FROM users WHERE email = ? COLLATE NOCASE LIMIT 1';
                    params = [identifier];
                    break;
                case 'session_token':
                    // First try to decode JWT token
                    try {
                        const decoded = jwt.verify(identifier, this.config.jwtSecret);
                        query = 'SELECT * FROM users WHERE id = ? LIMIT 1';
                        params = [decoded.userId];
                    } catch {
                        // Try sessions table
                        query = 'SELECT u.* FROM users u JOIN sessions s ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > datetime("now") LIMIT 1';
                        params = [identifier];
                    }
                    break;
                default:
                    // Try as user_id first, then username
                    if (/^\d+$/.test(identifier)) {
                        query = 'SELECT * FROM users WHERE id = ? LIMIT 1';
                        params = [parseInt(identifier)];
                    } else {
                        query = 'SELECT * FROM users WHERE username = ? COLLATE NOCASE LIMIT 1';
                        params = [identifier];
                    }
            }
            
            const timeout = setTimeout(() => {
                reject(new Error('Database query timeout'));
            }, this.config.queryTimeout);
            
            db.get(query, params, (err, row) => {
                clearTimeout(timeout);
                if (err) {
                    reject(err);
                } else {
                    resolve(row || null);
                }
            });
        });
    }
    
    detectIdentifierType(identifier) {
        if (typeof identifier === 'number' || /^\d+$/.test(identifier)) {
            return 'user_id';
        }
        
        if (identifier.includes('@')) {
            return 'email';
        }
        
        if (identifier.startsWith('eyJ') || identifier.includes('.')) {
            return 'session_token';
        }
        
        if (identifier.includes('/') || identifier.includes('\\')) {
            return 'file_path';
        }
        
        return 'username';
    }
    
    normalizeUserState(dbRow, schema = 'empire') {
        const normalized = {
            id: dbRow.id,
            username: dbRow.username,
            email: dbRow.email,
            level: dbRow.empire_level || dbRow.unified_level || dbRow.level || 1,
            status: this.determineUserStatus(dbRow),
            games: this.parseJsonField(dbRow.unlocked_games) || ['pirate-adventure'],
            achievements: this.parseJsonField(dbRow.achievements) || [],
            meta: {
                last_activity: dbRow.last_activity || dbRow.last_login,
                color: dbRow.color_status || 'green',
                created_at: dbRow.created_at,
                total_score: dbRow.total_score || 0,
                total_playtime: dbRow.total_playtime || 0
            },
            session: {
                expires: null, // Will be set if loaded via token
                token: null
            },
            _schema: schema,
            _loaded_at: new Date().toISOString()
        };
        
        return normalized;
    }
    
    determineUserStatus(dbRow) {
        if (dbRow.is_active === 0 || dbRow.is_active === false) return 'inactive';
        if (dbRow.banned === 1 || dbRow.banned === true) return 'banned';
        if (dbRow.suspended === 1 || dbRow.suspended === true) return 'suspended';
        return 'active';
    }
    
    parseJsonField(field) {
        if (!field) return null;
        try {
            return typeof field === 'string' ? JSON.parse(field) : field;
        } catch {
            return null;
        }
    }
    
    createEmptyUserState(identifier = null) {
        return {
            id: null,
            username: identifier && this.detectIdentifierType(identifier) === 'username' ? identifier : 'anonymous',
            email: null,
            level: 1,
            status: 'guest',
            games: [],
            achievements: [],
            meta: {
                last_activity: null,
                color: 'gray',
                created_at: null,
                total_score: 0,
                total_playtime: 0
            },
            session: {
                expires: null,
                token: null
            },
            _schema: 'generated',
            _loaded_at: new Date().toISOString()
        };
    }
    
    // File caching methods
    async loadFromFileCache(identifier) {
        try {
            const cacheFile = path.join(this.config.cacheDir, this.generateCacheKey(identifier) + '.json');
            const cacheData = await fs.readFile(cacheFile, 'utf8');
            return JSON.parse(cacheData);
        } catch {
            return null;
        }
    }
    
    async saveToFileCache(identifier, userData) {
        try {
            const cacheFile = path.join(this.config.cacheDir, this.generateCacheKey(identifier) + '.json');
            const cacheData = {
                data: userData,
                cached_at: Date.now(),
                expires_at: Date.now() + this.config.cacheTTL
            };
            
            await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2), 'utf8');
        } catch (error) {
            console.warn('⚠️ Failed to save cache:', error.message);
        }
    }
    
    generateCacheKey(identifier) {
        return crypto.createHash('md5').update(String(identifier)).digest('hex');
    }
    
    // Memory caching methods
    setMemoryCache(key, data) {
        // Implement LRU by removing oldest entries if at capacity
        if (this.memoryCache.size >= this.config.memCacheSize) {
            const firstKey = this.memoryCache.keys().next().value;
            this.memoryCache.delete(firstKey);
        }
        
        this.memoryCache.set(key, {
            data,
            cached_at: Date.now(),
            expires_at: Date.now() + this.config.memCacheTTL
        });
    }
    
    isCacheExpired(cacheEntry) {
        return Date.now() > cacheEntry.expires_at;
    }
    
    // Circuit breaker methods
    canTryDatabase() {
        if (this.circuitBreaker.state === 'closed') return true;
        
        if (this.circuitBreaker.state === 'open') {
            if (Date.now() - this.circuitBreaker.lastFailure > this.config.circuitBreakerTimeout) {
                this.circuitBreaker.state = 'half-open';
                return true;
            }
            return false;
        }
        
        // half-open state
        return true;
    }
    
    recordDatabaseSuccess() {
        this.circuitBreaker.failures = 0;
        this.circuitBreaker.state = 'closed';
    }
    
    recordDatabaseFailure() {
        this.circuitBreaker.failures++;
        this.circuitBreaker.lastFailure = Date.now();
        
        if (this.circuitBreaker.failures >= this.config.circuitBreakerThreshold) {
            this.circuitBreaker.state = 'open';
            console.warn('🔴 Database circuit breaker OPEN - switching to cache-only mode');
        }
    }
    
    // Utility methods
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    startMemoryCleanup() {
        setInterval(() => {
            // Clean expired memory cache entries
            const now = Date.now();
            for (const [key, entry] of this.memoryCache.entries()) {
                if (this.isCacheExpired(entry)) {
                    this.memoryCache.delete(key);
                }
            }
            
            // Log memory usage
            const memUsage = process.memoryUsage();
            const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
            
            if (memUsageMB > this.config.maxMemoryMB) {
                console.warn(`⚠️ High memory usage: ${memUsageMB}MB`);
                // Force garbage collection if available
                if (global.gc) global.gc();
            }
        }, 60000); // Every minute
    }
    
    // Health check and statistics
    getStats() {
        return {
            initialized: this.initialized,
            circuitBreaker: {
                state: this.circuitBreaker.state,
                failures: this.circuitBreaker.failures
            },
            memoryCache: {
                size: this.memoryCache.size,
                maxSize: this.config.memCacheSize
            },
            databases: {
                primary: !!this.dbPool,
                fallback: !!this.fallbackDbPool
            },
            memory: {
                usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
                limit: this.config.maxMemoryMB + 'MB'
            }
        };
    }
    
    // Cleanup method
    async close() {
        if (this.dbPool) {
            this.dbPool.close();
        }
        if (this.fallbackDbPool) {
            this.fallbackDbPool.close();
        }
        this.memoryCache.clear();
        console.log('🛡️ User State Loader closed');
    }
}

// Singleton instance for global use
let globalLoader = null;

// Main API functions
async function loadUserState(identifier, options = {}) {
    if (!globalLoader) {
        globalLoader = new BulletproofUserStateLoader(options);
        await new Promise(resolve => setTimeout(resolve, 100)); // Allow initialization
    }
    
    return globalLoader.loadUserState(identifier);
}

async function getUserStats() {
    if (!globalLoader) return null;
    return globalLoader.getStats();
}

async function closeUserStateLoader() {
    if (globalLoader) {
        await globalLoader.close();
        globalLoader = null;
    }
}

// CLI interface
if (require.main === module) {
    const identifier = process.argv[2];
    
    if (!identifier) {
        console.log('Usage: node user-state-loader.js <identifier>');
        console.log('Examples:');
        console.log('  node user-state-loader.js 123           # Load by user ID');
        console.log('  node user-state-loader.js cal_pirate    # Load by username');
        console.log('  node user-state-loader.js user@email.com # Load by email');
        console.log('  node user-state-loader.js eyJ...        # Load by JWT token');
        process.exit(1);
    }
    
    loadUserState(identifier)
        .then(userState => {
            console.log('✅ User state loaded:');
            console.log(JSON.stringify(userState, null, 2));
            return closeUserStateLoader();
        })
        .then(() => process.exit(0))
        .catch(error => {
            console.error('❌ Error:', error.message);
            process.exit(1);
        });
}

module.exports = {
    BulletproofUserStateLoader,
    loadUserState,
    getUserStats,
    closeUserStateLoader
};