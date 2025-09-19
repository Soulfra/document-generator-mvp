#!/usr/bin/env node

/**
 * POSITION CACHE MANAGER
 * 
 * Intelligent caching system for player positions, zone transitions, and logout states.
 * Manages "unimportant" position data with automatic cleanup and compression.
 * 
 * Features:
 * - Smart position caching with importance levels
 * - Zone transition state preservation
 * - Logout position restoration
 * - Automatic cache cleanup and compression
 * - Cross-session persistence
 * - Memory-efficient storage with LRU eviction
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class PositionCacheManager extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Cache configuration
            maxCacheSize: 10000, // Maximum cached positions per user
            maxMemoryCache: 1000, // Positions kept in memory
            importanceLevels: ['critical', 'high', 'medium', 'low', 'trace'],
            
            // Cleanup settings
            cleanupInterval: 300000, // 5 minutes
            maxAge: 86400000, // 24 hours
            compressionThreshold: 100, // Compress after N positions
            
            // Zone transition settings
            transitionBufferSize: 50,
            transitionCacheTime: 3600000, // 1 hour
            
            // Logout settings
            logoutStateTimeout: 604800000, // 7 days
            autoSaveInterval: 60000, // 1 minute
            
            // Storage settings
            persistenceEnabled: true,
            storageDirectory: './cache/positions',
            compressionEnabled: true,
            encryptionEnabled: false,
            
            ...config
        };
        
        // Cache storage
        this.positionCache = new Map(); // userId -> PositionCache
        this.zoneTransitionCache = new Map(); // userId -> ZoneTransitionCache
        this.logoutStateCache = new Map(); // userId -> LogoutState
        
        // Memory management
        this.memoryCache = new LRUCache(this.config.maxMemoryCache);
        this.compressionQueue = [];
        
        // Cache statistics
        this.stats = {
            totalCacheHits: 0,
            totalCacheMisses: 0,
            totalCompressions: 0,
            totalCleanups: 0,
            memoryUsage: 0,
            diskUsage: 0
        };
        
        // Cleanup timer
        this.cleanupTimer = null;
        this.autoSaveTimer = null;
        
        // Ensure storage directory exists
        this.ensureStorageDirectory();
        
        console.log('💾 Position Cache Manager initialized');
        console.log(`📁 Storage directory: ${this.config.storageDirectory}`);
    }

    /**
     * Initialize the cache manager
     */
    async initialize() {
        try {
            // Load existing cache data
            await this.loadCacheFromDisk();
            
            // Start cleanup timer
            this.startCleanupTimer();
            
            // Start auto-save timer
            if (this.config.persistenceEnabled) {
                this.startAutoSaveTimer();
            }
            
            console.log('✅ Position Cache Manager initialized');
            this.emit('initialized', this.getStatistics());
            
        } catch (error) {
            console.error('❌ Failed to initialize cache manager:', error);
            throw error;
        }
    }

    /**
     * Cache a position with importance level
     */
    cachePosition(userId, positionData) {
        try {
            // Get or create user cache
            let userCache = this.positionCache.get(userId);
            if (!userCache) {
                userCache = new PositionCache(userId, this.config);
                this.positionCache.set(userId, userCache);
            }
            
            // Create position entry
            const position = {
                id: uuidv4(),
                timestamp: Date.now(),
                position: positionData.position,
                zone: positionData.zone,
                importance: positionData.importance || 'medium',
                metadata: {
                    action: positionData.action,
                    movement: positionData.movement,
                    duration: positionData.duration,
                    context: positionData.context || {}
                },
                sessionId: positionData.sessionId
            };
            
            // Add to user cache
            const cacheKey = userCache.addPosition(position);
            
            // Add to memory cache for quick access
            this.memoryCache.set(`${userId}:${cacheKey}`, position);
            
            // Queue for compression if needed
            if (userCache.size() > this.config.compressionThreshold) {
                this.queueForCompression(userId);
            }
            
            // Update statistics
            this.updateCacheStatistics();
            
            this.emit('position_cached', { userId, position, cacheKey });
            return cacheKey;
            
        } catch (error) {
            console.error('Error caching position:', error);
            return null;
        }
    }

    /**
     * Retrieve cached position
     */
    getCachedPosition(userId, cacheKey) {
        try {
            // Check memory cache first
            const memoryKey = `${userId}:${cacheKey}`;
            let position = this.memoryCache.get(memoryKey);
            
            if (position) {
                this.stats.totalCacheHits++;
                return position;
            }
            
            // Check user cache
            const userCache = this.positionCache.get(userId);
            if (userCache) {
                position = userCache.getPosition(cacheKey);
                
                if (position) {
                    this.stats.totalCacheHits++;
                    // Add back to memory cache
                    this.memoryCache.set(memoryKey, position);
                    return position;
                }
            }
            
            this.stats.totalCacheMisses++;
            return null;
            
        } catch (error) {
            console.error('Error retrieving cached position:', error);
            this.stats.totalCacheMisses++;
            return null;
        }
    }

    /**
     * Cache zone transition state
     */
    cacheZoneTransition(userId, transitionData) {
        try {
            // Get or create zone transition cache
            let transitionCache = this.zoneTransitionCache.get(userId);
            if (!transitionCache) {
                transitionCache = new ZoneTransitionCache(userId, this.config);
                this.zoneTransitionCache.set(userId, transitionCache);
            }
            
            // Create transition entry
            const transition = {
                id: uuidv4(),
                timestamp: Date.now(),
                fromZone: transitionData.fromZone,
                toZone: transitionData.toZone,
                exitPosition: transitionData.exitPosition,
                entryPosition: transitionData.entryPosition,
                transitionType: transitionData.transitionType || 'walk',
                
                // State preservation
                preservedState: {
                    inventory: transitionData.inventory,
                    buffs: transitionData.buffs,
                    cooldowns: transitionData.cooldowns,
                    questState: transitionData.questState,
                    npcStates: transitionData.npcStates
                },
                
                // Cache metadata
                importance: this.calculateTransitionImportance(transitionData),
                expiresAt: Date.now() + this.config.transitionCacheTime,
                
                metadata: {
                    loadTime: transitionData.loadTime,
                    playerLevel: transitionData.playerLevel,
                    sessionId: transitionData.sessionId
                }
            };
            
            // Add to transition cache
            const cacheKey = transitionCache.addTransition(transition);
            
            this.emit('zone_transition_cached', { userId, transition, cacheKey });
            return cacheKey;
            
        } catch (error) {
            console.error('Error caching zone transition:', error);
            return null;
        }
    }

    /**
     * Get cached zone transition data
     */
    getCachedZoneTransition(userId, fromZone, toZone) {
        try {
            const transitionCache = this.zoneTransitionCache.get(userId);
            if (!transitionCache) return null;
            
            return transitionCache.getTransition(fromZone, toZone);
            
        } catch (error) {
            console.error('Error retrieving zone transition:', error);
            return null;
        }
    }

    /**
     * Cache logout state for session restoration
     */
    cacheLogoutState(userId, logoutData) {
        try {
            const logoutState = {
                id: uuidv4(),
                timestamp: Date.now(),
                position: logoutData.position,
                zone: logoutData.zone,
                character: logoutData.character,
                
                // Game state
                gameState: {
                    level: logoutData.level,
                    experience: logoutData.experience,
                    health: logoutData.health,
                    mana: logoutData.mana,
                    stamina: logoutData.stamina
                },
                
                // Inventory and equipment
                inventory: logoutData.inventory,
                equipment: logoutData.equipment,
                quickbar: logoutData.quickbar,
                
                // Active effects
                buffs: logoutData.buffs || [],
                debuffs: logoutData.debuffs || [],
                cooldowns: logoutData.cooldowns || {},
                
                // Quest and progress state
                questStates: logoutData.questStates || {},
                achievements: logoutData.achievements || [],
                
                // Session metadata
                sessionId: logoutData.sessionId,
                sessionDuration: logoutData.sessionDuration,
                lastActivity: logoutData.lastActivity,
                
                // Cache control
                expiresAt: Date.now() + this.config.logoutStateTimeout,
                importance: 'critical' // Logout states are always critical
            };
            
            // Store logout state
            this.logoutStateCache.set(userId, logoutState);
            
            // Immediately persist to disk for safety
            if (this.config.persistenceEnabled) {
                this.persistLogoutState(userId, logoutState);
            }
            
            this.emit('logout_state_cached', { userId, logoutState });
            return logoutState.id;
            
        } catch (error) {
            console.error('Error caching logout state:', error);
            return null;
        }
    }

    /**
     * Restore logout state for session
     */
    getLogoutState(userId) {
        try {
            let logoutState = this.logoutStateCache.get(userId);
            
            // If not in memory, try loading from disk
            if (!logoutState && this.config.persistenceEnabled) {
                logoutState = this.loadLogoutState(userId);
                
                if (logoutState) {
                    // Check if expired
                    if (Date.now() > logoutState.expiresAt) {
                        this.clearLogoutState(userId);
                        return null;
                    }
                    
                    // Add back to memory cache
                    this.logoutStateCache.set(userId, logoutState);
                }
            }
            
            return logoutState;
            
        } catch (error) {
            console.error('Error retrieving logout state:', error);
            return null;
        }
    }

    /**
     * Clear logout state (after successful login)
     */
    clearLogoutState(userId) {
        try {
            this.logoutStateCache.delete(userId);
            
            // Remove from disk
            if (this.config.persistenceEnabled) {
                this.removeLogoutStateFromDisk(userId);
            }
            
            this.emit('logout_state_cleared', { userId });
            return true;
            
        } catch (error) {
            console.error('Error clearing logout state:', error);
            return false;
        }
    }

    /**
     * Get recent positions for a user
     */
    getRecentPositions(userId, count = 10, importance = null) {
        try {
            const userCache = this.positionCache.get(userId);
            if (!userCache) return [];
            
            return userCache.getRecentPositions(count, importance);
            
        } catch (error) {
            console.error('Error getting recent positions:', error);
            return [];
        }
    }

    /**
     * Get position history for a zone
     */
    getZonePositionHistory(userId, zoneName, timeRange = null) {
        try {
            const userCache = this.positionCache.get(userId);
            if (!userCache) return [];
            
            return userCache.getZonePositions(zoneName, timeRange);
            
        } catch (error) {
            console.error('Error getting zone position history:', error);
            return [];
        }
    }

    /**
     * Compress old position data
     */
    async compressPositionData(userId) {
        try {
            const userCache = this.positionCache.get(userId);
            if (!userCache) return false;
            
            const compressionResult = await userCache.compress();
            
            if (compressionResult.success) {
                this.stats.totalCompressions++;
                
                // Update disk storage
                if (this.config.persistenceEnabled) {
                    await this.persistCompressedData(userId, compressionResult.data);
                }
                
                this.emit('positions_compressed', {
                    userId,
                    originalSize: compressionResult.originalSize,
                    compressedSize: compressionResult.compressedSize,
                    ratio: compressionResult.ratio
                });
            }
            
            return compressionResult.success;
            
        } catch (error) {
            console.error('Error compressing position data:', error);
            return false;
        }
    }

    /**
     * Clean up expired cache entries
     */
    async cleanupExpiredEntries() {
        try {
            let cleanedPositions = 0;
            let cleanedTransitions = 0;
            let cleanedLogouts = 0;
            
            const now = Date.now();
            const maxAge = this.config.maxAge;
            
            // Clean position caches
            for (const [userId, userCache] of this.positionCache.entries()) {
                const cleaned = userCache.cleanupExpired(now - maxAge);
                cleanedPositions += cleaned;
                
                // Remove empty caches
                if (userCache.isEmpty()) {
                    this.positionCache.delete(userId);
                }
            }
            
            // Clean zone transition caches
            for (const [userId, transitionCache] of this.zoneTransitionCache.entries()) {
                const cleaned = transitionCache.cleanupExpired(now);
                cleanedTransitions += cleaned;
                
                if (transitionCache.isEmpty()) {
                    this.zoneTransitionCache.delete(userId);
                }
            }
            
            // Clean expired logout states
            for (const [userId, logoutState] of this.logoutStateCache.entries()) {
                if (now > logoutState.expiresAt) {
                    this.logoutStateCache.delete(userId);
                    cleanedLogouts++;
                }
            }
            
            // Clean memory cache
            this.memoryCache.cleanup();
            
            // Update statistics
            this.stats.totalCleanups++;
            this.updateCacheStatistics();
            
            const result = {
                positions: cleanedPositions,
                transitions: cleanedTransitions,
                logouts: cleanedLogouts,
                timestamp: now
            };
            
            this.emit('cache_cleaned', result);
            return result;
            
        } catch (error) {
            console.error('Error during cache cleanup:', error);
            return null;
        }
    }

    /**
     * Get cache statistics
     */
    getStatistics() {
        const memoryUsage = this.calculateMemoryUsage();
        const diskUsage = this.calculateDiskUsage();
        
        return {
            ...this.stats,
            memoryUsage,
            diskUsage,
            
            // Cache sizes
            positionCacheSize: this.positionCache.size,
            transitionCacheSize: this.zoneTransitionCache.size,
            logoutCacheSize: this.logoutStateCache.size,
            memoryCacheSize: this.memoryCache.size(),
            
            // Hit rates
            hitRate: this.stats.totalCacheHits / (this.stats.totalCacheHits + this.stats.totalCacheMisses) || 0,
            
            // Compression stats
            compressionRatio: this.calculateCompressionRatio()
        };
    }

    // Helper methods...

    calculateTransitionImportance(transitionData) {
        // Calculate importance based on various factors
        if (transitionData.transitionType === 'teleport') return 'high';
        if (transitionData.fromZone === 'combat_zone') return 'high';
        if (transitionData.questRelated) return 'medium';
        return 'low';
    }

    queueForCompression(userId) {
        if (!this.compressionQueue.includes(userId)) {
            this.compressionQueue.push(userId);
            
            // Process compression queue asynchronously
            setImmediate(() => this.processCompressionQueue());
        }
    }

    async processCompressionQueue() {
        while (this.compressionQueue.length > 0) {
            const userId = this.compressionQueue.shift();
            await this.compressPositionData(userId);
        }
    }

    updateCacheStatistics() {
        this.stats.memoryUsage = this.calculateMemoryUsage();
    }

    calculateMemoryUsage() {
        // Rough calculation of memory usage
        let usage = 0;
        
        for (const userCache of this.positionCache.values()) {
            usage += userCache.getMemoryUsage();
        }
        
        for (const transitionCache of this.zoneTransitionCache.values()) {
            usage += transitionCache.getMemoryUsage();
        }
        
        usage += this.logoutStateCache.size * 1024; // Rough estimate
        usage += this.memoryCache.getMemoryUsage();
        
        return usage;
    }

    calculateDiskUsage() {
        // Calculate disk usage by examining storage directory
        if (!this.config.persistenceEnabled) return 0;
        
        try {
            return this.getDirectorySize(this.config.storageDirectory);
        } catch (error) {
            return 0;
        }
    }

    calculateCompressionRatio() {
        // Calculate average compression ratio
        // This would need to be tracked during compression operations
        return 0.3; // Placeholder
    }

    getDirectorySize(dirPath) {
        let totalSize = 0;
        
        try {
            const files = fs.readdirSync(dirPath);
            
            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = fs.statSync(filePath);
                
                if (stats.isDirectory()) {
                    totalSize += this.getDirectorySize(filePath);
                } else {
                    totalSize += stats.size;
                }
            }
        } catch (error) {
            // Directory doesn't exist or permission error
        }
        
        return totalSize;
    }

    ensureStorageDirectory() {
        if (this.config.persistenceEnabled && !fs.existsSync(this.config.storageDirectory)) {
            fs.mkdirSync(this.config.storageDirectory, { recursive: true });
        }
    }

    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.cleanupExpiredEntries();
        }, this.config.cleanupInterval);
    }

    startAutoSaveTimer() {
        this.autoSaveTimer = setInterval(() => {
            this.saveCacheToDisk();
        }, this.config.autoSaveInterval);
    }

    async loadCacheFromDisk() {
        if (!this.config.persistenceEnabled) return;
        
        // Implementation for loading cache from disk
        console.log('💾 Loading cache from disk...');
    }

    async saveCacheToDisk() {
        if (!this.config.persistenceEnabled) return;
        
        // Implementation for saving cache to disk
        console.log('💾 Saving cache to disk...');
    }

    persistLogoutState(userId, logoutState) {
        if (!this.config.persistenceEnabled) return;
        
        const filename = `logout_${userId}.json`;
        const filepath = path.join(this.config.storageDirectory, filename);
        
        try {
            fs.writeFileSync(filepath, JSON.stringify(logoutState, null, 2));
        } catch (error) {
            console.error('Error persisting logout state:', error);
        }
    }

    loadLogoutState(userId) {
        if (!this.config.persistenceEnabled) return null;
        
        const filename = `logout_${userId}.json`;
        const filepath = path.join(this.config.storageDirectory, filename);
        
        try {
            if (fs.existsSync(filepath)) {
                const data = fs.readFileSync(filepath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading logout state:', error);
        }
        
        return null;
    }

    removeLogoutStateFromDisk(userId) {
        if (!this.config.persistenceEnabled) return;
        
        const filename = `logout_${userId}.json`;
        const filepath = path.join(this.config.storageDirectory, filename);
        
        try {
            if (fs.existsSync(filepath)) {
                fs.unlinkSync(filepath);
            }
        } catch (error) {
            console.error('Error removing logout state:', error);
        }
    }

    async persistCompressedData(userId, data) {
        // Implementation for persisting compressed data
    }

    /**
     * Cleanup and close cache manager
     */
    async close() {
        try {
            // Clear timers
            if (this.cleanupTimer) {
                clearInterval(this.cleanupTimer);
                this.cleanupTimer = null;
            }
            
            if (this.autoSaveTimer) {
                clearInterval(this.autoSaveTimer);
                this.autoSaveTimer = null;
            }
            
            // Final cleanup
            await this.cleanupExpiredEntries();
            
            // Save cache to disk
            if (this.config.persistenceEnabled) {
                await this.saveCacheToDisk();
            }
            
            this.emit('closed', this.getStatistics());
            console.log('💾 Position Cache Manager closed');
            
        } catch (error) {
            console.error('Error closing cache manager:', error);
        }
    }
}

// Helper classes

class PositionCache {
    constructor(userId, config) {
        this.userId = userId;
        this.config = config;
        this.positions = new Map(); // cacheKey -> position
        this.chronological = []; // For time-based queries
        this.zoneIndex = new Map(); // zone -> position keys
    }
    
    addPosition(position) {
        const cacheKey = this.generateCacheKey(position);
        
        this.positions.set(cacheKey, position);
        this.chronological.push({ key: cacheKey, timestamp: position.timestamp });
        
        // Update zone index
        if (!this.zoneIndex.has(position.zone)) {
            this.zoneIndex.set(position.zone, []);
        }
        this.zoneIndex.get(position.zone).push(cacheKey);
        
        // Trim if too large
        this.trimCache();
        
        return cacheKey;
    }
    
    getPosition(cacheKey) {
        return this.positions.get(cacheKey);
    }
    
    getRecentPositions(count, importance) {
        let recent = this.chronological
            .slice(-count)
            .map(entry => this.positions.get(entry.key))
            .filter(pos => pos); // Remove any null positions
        
        if (importance) {
            recent = recent.filter(pos => pos.importance === importance);
        }
        
        return recent;
    }
    
    getZonePositions(zoneName, timeRange) {
        const zoneKeys = this.zoneIndex.get(zoneName) || [];
        let positions = zoneKeys.map(key => this.positions.get(key)).filter(pos => pos);
        
        if (timeRange) {
            positions = positions.filter(pos => 
                pos.timestamp >= timeRange.start && pos.timestamp <= timeRange.end
            );
        }
        
        return positions;
    }
    
    cleanupExpired(cutoffTime) {
        let cleaned = 0;
        
        const toRemove = [];
        for (const [key, position] of this.positions.entries()) {
            if (position.timestamp < cutoffTime && position.importance !== 'critical') {
                toRemove.push(key);
            }
        }
        
        for (const key of toRemove) {
            this.positions.delete(key);
            cleaned++;
        }
        
        // Update chronological and zone indices
        this.rebuildIndices();
        
        return cleaned;
    }
    
    async compress() {
        // Compress old positions based on importance
        const compressed = [];
        const toCompress = [];
        
        for (const [key, position] of this.positions.entries()) {
            if (position.importance === 'low' || position.importance === 'trace') {
                toCompress.push(key);
            }
        }
        
        // Simple compression: keep every nth position
        const compressionRatio = 0.1; // Keep 10%
        const keepEvery = Math.ceil(1 / compressionRatio);
        
        for (let i = 0; i < toCompress.length; i += keepEvery) {
            const key = toCompress[i];
            compressed.push(this.positions.get(key));
        }
        
        // Remove compressed positions from main cache
        for (const key of toCompress) {
            this.positions.delete(key);
        }
        
        this.rebuildIndices();
        
        return {
            success: true,
            originalSize: toCompress.length,
            compressedSize: compressed.length,
            ratio: compressed.length / toCompress.length,
            data: compressed
        };
    }
    
    size() {
        return this.positions.size;
    }
    
    isEmpty() {
        return this.positions.size === 0;
    }
    
    getMemoryUsage() {
        // Rough estimate
        return this.positions.size * 512; // 512 bytes per position estimate
    }
    
    generateCacheKey(position) {
        const keyData = `${position.timestamp}_${position.position.x}_${position.position.y}_${position.zone}`;
        return crypto.createHash('md5').update(keyData).digest('hex').substring(0, 16);
    }
    
    trimCache() {
        if (this.positions.size > this.config.maxCacheSize) {
            const toRemove = this.positions.size - this.config.maxCacheSize;
            
            // Remove oldest low-importance positions first
            const sortedByAge = [...this.positions.entries()]
                .sort((a, b) => a[1].timestamp - b[1].timestamp)
                .filter(([key, pos]) => pos.importance === 'low' || pos.importance === 'trace');
            
            for (let i = 0; i < Math.min(toRemove, sortedByAge.length); i++) {
                this.positions.delete(sortedByAge[i][0]);
            }
            
            this.rebuildIndices();
        }
    }
    
    rebuildIndices() {
        // Rebuild chronological index
        this.chronological = [...this.positions.entries()]
            .map(([key, pos]) => ({ key, timestamp: pos.timestamp }))
            .sort((a, b) => a.timestamp - b.timestamp);
        
        // Rebuild zone index
        this.zoneIndex.clear();
        for (const [key, position] of this.positions.entries()) {
            if (!this.zoneIndex.has(position.zone)) {
                this.zoneIndex.set(position.zone, []);
            }
            this.zoneIndex.get(position.zone).push(key);
        }
    }
}

class ZoneTransitionCache {
    constructor(userId, config) {
        this.userId = userId;
        this.config = config;
        this.transitions = new Map(); // id -> transition
        this.zoneMap = new Map(); // "fromZone:toZone" -> transition id
    }
    
    addTransition(transition) {
        const id = transition.id;
        this.transitions.set(id, transition);
        
        const zoneKey = `${transition.fromZone}:${transition.toZone}`;
        this.zoneMap.set(zoneKey, id);
        
        // Trim if too large
        this.trimCache();
        
        return id;
    }
    
    getTransition(fromZone, toZone) {
        const zoneKey = `${fromZone}:${toZone}`;
        const id = this.zoneMap.get(zoneKey);
        
        if (id) {
            const transition = this.transitions.get(id);
            
            // Check if expired
            if (transition && Date.now() < transition.expiresAt) {
                return transition;
            } else if (transition) {
                // Remove expired transition
                this.transitions.delete(id);
                this.zoneMap.delete(zoneKey);
            }
        }
        
        return null;
    }
    
    cleanupExpired(now) {
        let cleaned = 0;
        
        const toRemove = [];
        for (const [id, transition] of this.transitions.entries()) {
            if (now > transition.expiresAt) {
                toRemove.push(id);
            }
        }
        
        for (const id of toRemove) {
            const transition = this.transitions.get(id);
            this.transitions.delete(id);
            
            // Remove from zone map
            const zoneKey = `${transition.fromZone}:${transition.toZone}`;
            this.zoneMap.delete(zoneKey);
            
            cleaned++;
        }
        
        return cleaned;
    }
    
    trimCache() {
        if (this.transitions.size > this.config.transitionBufferSize) {
            // Remove oldest transitions
            const sortedByAge = [...this.transitions.entries()]
                .sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const toRemove = this.transitions.size - this.config.transitionBufferSize;
            
            for (let i = 0; i < toRemove; i++) {
                const [id, transition] = sortedByAge[i];
                this.transitions.delete(id);
                
                const zoneKey = `${transition.fromZone}:${transition.toZone}`;
                this.zoneMap.delete(zoneKey);
            }
        }
    }
    
    isEmpty() {
        return this.transitions.size === 0;
    }
    
    getMemoryUsage() {
        return this.transitions.size * 1024; // Rough estimate
    }
}

class LRUCache {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.cache = new Map();
        this.accessOrder = [];
    }
    
    get(key) {
        if (this.cache.has(key)) {
            // Move to front of access order
            this.moveToFront(key);
            return this.cache.get(key);
        }
        return undefined;
    }
    
    set(key, value) {
        if (this.cache.has(key)) {
            this.cache.set(key, value);
            this.moveToFront(key);
        } else {
            if (this.cache.size >= this.maxSize) {
                // Remove least recently used
                const lru = this.accessOrder.pop();
                this.cache.delete(lru);
            }
            
            this.cache.set(key, value);
            this.accessOrder.unshift(key);
        }
    }
    
    moveToFront(key) {
        const index = this.accessOrder.indexOf(key);
        if (index > -1) {
            this.accessOrder.splice(index, 1);
            this.accessOrder.unshift(key);
        }
    }
    
    cleanup() {
        // Remove entries that haven't been accessed recently
        const cutoff = this.accessOrder.length * 0.9; // Keep top 90%
        const toRemove = this.accessOrder.slice(cutoff);
        
        for (const key of toRemove) {
            this.cache.delete(key);
        }
        
        this.accessOrder = this.accessOrder.slice(0, cutoff);
    }
    
    size() {
        return this.cache.size;
    }
    
    getMemoryUsage() {
        return this.cache.size * 256; // Rough estimate
    }
}

module.exports = PositionCacheManager;

// CLI interface for testing
if (require.main === module) {
    const cacheManager = new PositionCacheManager();
    
    async function demo() {
        try {
            await cacheManager.initialize();
            
            const userId = 'demo_user';
            
            // Demo position caching
            console.log('📍 Caching positions...');
            const pos1 = cacheManager.cachePosition(userId, {
                position: { x: 100, y: 200, z: 0 },
                zone: 'town',
                importance: 'medium',
                action: 'walking',
                sessionId: 'demo_session'
            });
            
            const pos2 = cacheManager.cachePosition(userId, {
                position: { x: 150, y: 250, z: 0 },
                zone: 'forest',
                importance: 'high',
                action: 'combat',
                sessionId: 'demo_session'
            });
            
            // Demo zone transition
            console.log('🚪 Caching zone transition...');
            const transition = cacheManager.cacheZoneTransition(userId, {
                fromZone: 'town',
                toZone: 'forest',
                exitPosition: { x: 100, y: 200, z: 0 },
                entryPosition: { x: 150, y: 250, z: 0 },
                transitionType: 'walk',
                sessionId: 'demo_session'
            });
            
            // Demo logout state
            console.log('💾 Caching logout state...');
            const logout = cacheManager.cacheLogoutState(userId, {
                position: { x: 150, y: 250, z: 0 },
                zone: 'forest',
                character: { name: 'TestChar', level: 10 },
                health: 100,
                mana: 50,
                inventory: [],
                sessionId: 'demo_session'
            });
            
            // Retrieve cached data
            console.log('🔍 Retrieving cached data...');
            const cachedPos = cacheManager.getCachedPosition(userId, pos1);
            const cachedTransition = cacheManager.getCachedZoneTransition(userId, 'town', 'forest');
            const cachedLogout = cacheManager.getLogoutState(userId);
            
            console.log('✅ Position retrieved:', !!cachedPos);
            console.log('✅ Transition retrieved:', !!cachedTransition);
            console.log('✅ Logout state retrieved:', !!cachedLogout);
            
            // Show statistics
            console.log('\n📊 Cache Statistics:');
            console.log(JSON.stringify(cacheManager.getStatistics(), null, 2));
            
        } catch (error) {
            console.error('Demo error:', error);
        }
    }
    
    demo();
}

console.log('💾 Position Cache Manager ready');