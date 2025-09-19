#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * 📦 USER CACHE MANAGER
 * 
 * Handles file-based caching for user state data
 * - Automatic cache cleanup and rotation
 * - Compression for large user states
 * - Backup and recovery mechanisms
 * - Cache analytics and optimization
 */

class UserCacheManager {
    constructor(options = {}) {
        this.config = {
            cacheDir: options.cacheDir || path.join(__dirname, 'user-cache'),
            backupDir: options.backupDir || path.join(__dirname, 'user-cache-backup'),
            maxCacheFiles: options.maxCacheFiles || 10000,
            maxCacheAge: options.maxCacheAge || 7 * 24 * 60 * 60 * 1000, // 7 days
            compressionThreshold: options.compressionThreshold || 1024, // 1KB
            cleanupInterval: options.cleanupInterval || 60 * 60 * 1000, // 1 hour
            enableCompression: options.enableCompression || false,
            enableBackups: options.enableBackups || true
        };
        
        this.stats = {
            hits: 0,
            misses: 0,
            writes: 0,
            errors: 0,
            cleanups: 0
        };
        
        this.init();
    }
    
    async init() {
        try {
            // Create directories
            await fs.mkdir(this.config.cacheDir, { recursive: true });
            if (this.config.enableBackups) {
                await fs.mkdir(this.config.backupDir, { recursive: true });
            }
            
            // Start cleanup interval
            this.startCleanupInterval();
            
            console.log('📦 User Cache Manager initialized');
        } catch (error) {
            console.warn('⚠️ Cache manager init warning:', error.message);
        }
    }
    
    /**
     * Get cached user data
     */
    async get(identifier) {
        try {
            const cacheKey = this.generateCacheKey(identifier);
            const cacheFile = this.getCacheFilePath(cacheKey);
            
            const cacheData = await fs.readFile(cacheFile, 'utf8');
            const parsed = JSON.parse(cacheData);
            
            // Check if expired
            if (this.isCacheExpired(parsed)) {
                this.stats.misses++;
                return null;
            }
            
            this.stats.hits++;
            
            // Decompress if needed
            if (parsed.compressed) {
                parsed.data = await this.decompress(parsed.data);
            }
            
            return parsed;
        } catch (error) {
            this.stats.misses++;
            return null;
        }
    }
    
    /**
     * Set cached user data
     */
    async set(identifier, userData, ttl = null) {
        try {
            const cacheKey = this.generateCacheKey(identifier);
            const cacheFile = this.getCacheFilePath(cacheKey);
            
            // Prepare cache data
            let cacheData = {
                data: userData,
                cached_at: Date.now(),
                expires_at: Date.now() + (ttl || this.config.maxCacheAge),
                identifier,
                size: JSON.stringify(userData).length,
                compressed: false
            };
            
            // Compress if data is large
            if (this.config.enableCompression && cacheData.size > this.config.compressionThreshold) {
                cacheData.data = await this.compress(cacheData.data);
                cacheData.compressed = true;
                cacheData.originalSize = cacheData.size;
                cacheData.size = JSON.stringify(cacheData.data).length;
            }
            
            // Write to cache file
            await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2), 'utf8');
            
            // Create backup if enabled
            if (this.config.enableBackups) {
                await this.createBackup(cacheKey, cacheData);
            }
            
            this.stats.writes++;
            return true;
            
        } catch (error) {
            this.stats.errors++;
            console.warn('⚠️ Cache write error:', error.message);
            return false;
        }
    }
    
    /**
     * Remove cached data
     */
    async remove(identifier) {
        try {
            const cacheKey = this.generateCacheKey(identifier);
            const cacheFile = this.getCacheFilePath(cacheKey);
            
            await fs.unlink(cacheFile);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Check if cache exists for identifier
     */
    async has(identifier) {
        const cacheKey = this.generateCacheKey(identifier);
        const cacheFile = this.getCacheFilePath(cacheKey);
        
        try {
            await fs.access(cacheFile);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * Get all cached identifiers
     */
    async list() {
        try {
            const files = await fs.readdir(this.config.cacheDir);
            const cacheFiles = files.filter(f => f.endsWith('.json'));
            
            const results = [];
            for (const file of cacheFiles) {
                try {
                    const filePath = path.join(this.config.cacheDir, file);
                    const stat = await fs.stat(filePath);
                    const content = await fs.readFile(filePath, 'utf8');
                    const parsed = JSON.parse(content);
                    
                    results.push({
                        identifier: parsed.identifier,
                        cacheKey: file.replace('.json', ''),
                        size: stat.size,
                        cached_at: parsed.cached_at,
                        expires_at: parsed.expires_at,
                        expired: this.isCacheExpired(parsed)
                    });
                } catch (error) {
                    // Skip corrupted cache files
                    console.warn('⚠️ Corrupted cache file:', file);
                }
            }
            
            return results.sort((a, b) => b.cached_at - a.cached_at);
        } catch (error) {
            console.warn('⚠️ Cache list error:', error.message);
            return [];
        }
    }
    
    /**
     * Clean up expired and old cache files
     */
    async cleanup() {
        try {
            const files = await fs.readdir(this.config.cacheDir);
            const cacheFiles = files.filter(f => f.endsWith('.json'));
            
            let removed = 0;
            const now = Date.now();
            
            // Sort files by modification time (oldest first)
            const fileStats = [];
            for (const file of cacheFiles) {
                try {
                    const filePath = path.join(this.config.cacheDir, file);
                    const stat = await fs.stat(filePath);
                    const content = await fs.readFile(filePath, 'utf8');
                    const parsed = JSON.parse(content);
                    
                    fileStats.push({
                        file,
                        filePath,
                        mtime: stat.mtime.getTime(),
                        expires_at: parsed.expires_at || 0,
                        size: stat.size
                    });
                } catch {
                    // Remove corrupted files
                    const filePath = path.join(this.config.cacheDir, file);
                    await fs.unlink(filePath);
                    removed++;
                }
            }
            
            // Remove expired files
            for (const fileInfo of fileStats) {
                if (fileInfo.expires_at < now) {
                    await fs.unlink(fileInfo.filePath);
                    removed++;
                }
            }
            
            // Remove oldest files if over limit
            const remaining = fileStats.filter(f => f.expires_at >= now);
            if (remaining.length > this.config.maxCacheFiles) {
                remaining.sort((a, b) => a.mtime - b.mtime);
                const toRemove = remaining.slice(0, remaining.length - this.config.maxCacheFiles);
                
                for (const fileInfo of toRemove) {
                    await fs.unlink(fileInfo.filePath);
                    removed++;
                }
            }
            
            this.stats.cleanups++;
            if (removed > 0) {
                console.log(`🧹 Cache cleanup: removed ${removed} files`);
            }
            
            return removed;
        } catch (error) {
            this.stats.errors++;
            console.warn('⚠️ Cache cleanup error:', error.message);
            return 0;
        }
    }
    
    /**
     * Get cache statistics
     */
    async getStats() {
        try {
            const files = await fs.readdir(this.config.cacheDir);
            const cacheFiles = files.filter(f => f.endsWith('.json'));
            
            let totalSize = 0;
            let expiredCount = 0;
            let compressedCount = 0;
            
            for (const file of cacheFiles) {
                try {
                    const filePath = path.join(this.config.cacheDir, file);
                    const stat = await fs.stat(filePath);
                    const content = await fs.readFile(filePath, 'utf8');
                    const parsed = JSON.parse(content);
                    
                    totalSize += stat.size;
                    if (this.isCacheExpired(parsed)) expiredCount++;
                    if (parsed.compressed) compressedCount++;
                } catch {
                    // Skip corrupted files
                }
            }
            
            return {
                ...this.stats,
                files: cacheFiles.length,
                totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
                expiredFiles: expiredCount,
                compressedFiles: compressedCount,
                hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
            };
        } catch {
            return { ...this.stats, files: 0, totalSizeMB: 0 };
        }
    }
    
    /**
     * Export cache data for backup
     */
    async exportCache() {
        try {
            const list = await this.list();
            const exportData = [];
            
            for (const item of list) {
                if (!item.expired) {
                    const cached = await this.get(item.identifier);
                    if (cached) {
                        exportData.push({
                            identifier: item.identifier,
                            data: cached.data,
                            cached_at: cached.cached_at
                        });
                    }
                }
            }
            
            return exportData;
        } catch (error) {
            console.warn('⚠️ Cache export error:', error.message);
            return [];
        }
    }
    
    /**
     * Import cache data from backup
     */
    async importCache(exportData) {
        try {
            let imported = 0;
            
            for (const item of exportData) {
                const success = await this.set(item.identifier, item.data);
                if (success) imported++;
            }
            
            console.log(`📥 Cache import: ${imported}/${exportData.length} items`);
            return imported;
        } catch (error) {
            console.warn('⚠️ Cache import error:', error.message);
            return 0;
        }
    }
    
    // Helper methods
    generateCacheKey(identifier) {
        return crypto.createHash('md5').update(String(identifier)).digest('hex');
    }
    
    getCacheFilePath(cacheKey) {
        return path.join(this.config.cacheDir, cacheKey + '.json');
    }
    
    isCacheExpired(cacheEntry) {
        return Date.now() > cacheEntry.expires_at;
    }
    
    async createBackup(cacheKey, cacheData) {
        try {
            if (!this.config.enableBackups) return;
            
            const backupFile = path.join(this.config.backupDir, cacheKey + '.backup.json');
            await fs.writeFile(backupFile, JSON.stringify(cacheData, null, 2), 'utf8');
        } catch (error) {
            // Backup failure shouldn't break main operation
            console.warn('⚠️ Backup creation failed:', error.message);
        }
    }
    
    async compress(data) {
        // Simple JSON minification (could be enhanced with actual compression)
        return JSON.stringify(data);
    }
    
    async decompress(data) {
        return JSON.parse(data);
    }
    
    startCleanupInterval() {
        setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);
    }
}

// CLI interface
if (require.main === module) {
    const command = process.argv[2];
    const manager = new UserCacheManager();
    
    switch (command) {
        case 'list':
            manager.list().then(list => {
                console.log('Cache Contents:');
                list.forEach(item => {
                    const status = item.expired ? '❌ EXPIRED' : '✅ VALID';
                    const size = Math.round(item.size / 1024 * 100) / 100;
                    console.log(`${status} ${item.identifier} (${size}KB) - ${new Date(item.cached_at).toLocaleString()}`);
                });
            });
            break;
            
        case 'stats':
            manager.getStats().then(stats => {
                console.log('Cache Statistics:');
                console.log(JSON.stringify(stats, null, 2));
            });
            break;
            
        case 'cleanup':
            manager.cleanup().then(removed => {
                console.log(`Cleanup complete: removed ${removed} files`);
            });
            break;
            
        case 'export':
            manager.exportCache().then(data => {
                const filename = `cache-export-${Date.now()}.json`;
                require('fs').writeFileSync(filename, JSON.stringify(data, null, 2));
                console.log(`Exported ${data.length} items to ${filename}`);
            });
            break;
            
        default:
            console.log('Usage: node user-cache-manager.js <command>');
            console.log('Commands: list, stats, cleanup, export');
    }
}

module.exports = UserCacheManager;