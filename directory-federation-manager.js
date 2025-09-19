#!/usr/bin/env node

/**
 * 📁 DIRECTORY FEDERATION MANAGER
 * Handles deep directory structures, symlinks, and federated file searching
 * Integrates with OAuth router and RAG engine for unified file access
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

class DirectoryFederationManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            federationRoot: options.federationRoot || process.cwd(),
            maxDepth: options.maxDepth || 15,
            maxFiles: options.maxFiles || 50000,
            excludePatterns: options.excludePatterns || [
                'node_modules',
                '.git',
                '.DS_Store',
                '*.tmp',
                '*.log',
                'temp',
                'cache'
            ],
            symlinkPolicy: options.symlinkPolicy || 'follow', // 'follow', 'ignore', 'report'
            indexRefreshInterval: options.indexRefreshInterval || 300000, // 5 minutes
            watchForChanges: options.watchForChanges !== false
        };
        
        // Federation state
        this.federationIndex = new Map();
        this.symlinkRegistry = new Map();
        this.directoryTree = new Map();
        this.fileMetadata = new Map();
        this.accessPatterns = new Map();
        
        // Search indexes
        this.pathIndex = new Map();
        this.extensionIndex = new Map();
        this.sizeIndex = new Map();
        this.modifiedIndex = new Map();
        this.contentTypeIndex = new Map();
        
        // Federation statistics
        this.stats = {
            totalDirectories: 0,
            totalFiles: 0,
            totalSymlinks: 0,
            brokenSymlinks: 0,
            maxDepthReached: 0,
            lastScanTime: null,
            scanDuration: 0,
            excludedItems: 0
        };
        
        // File watchers
        this.watchers = new Map();
        this.watcherEnabled = false;
        
        console.log('📁 Directory Federation Manager initialized');
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Starting Directory Federation Manager...');
        
        try {
            // Validate federation root
            await this.validateFederationRoot();
            
            // Perform initial scan
            await this.performFullScan();
            
            // Build search indexes
            await this.buildSearchIndexes();
            
            // Start file watching if enabled
            if (this.config.watchForChanges) {
                await this.startFileWatching();
            }
            
            // Schedule periodic refresh
            this.schedulePeriodicRefresh();
            
            console.log('✅ Directory Federation Manager ready');
            this.emit('federation:ready');
            
        } catch (error) {
            console.error('❌ Directory Federation Manager initialization failed:', error);
            throw error;
        }
    }
    
    async validateFederationRoot() {
        try {
            const stats = await fs.stat(this.config.federationRoot);
            if (!stats.isDirectory()) {
                throw new Error(`Federation root is not a directory: ${this.config.federationRoot}`);
            }
            
            console.log(`📁 Federation root validated: ${this.config.federationRoot}`);
        } catch (error) {
            throw new Error(`Invalid federation root: ${error.message}`);
        }
    }
    
    async performFullScan() {
        console.log('🔍 Performing full directory scan...');
        
        const startTime = Date.now();
        
        // Reset statistics
        this.stats = {
            totalDirectories: 0,
            totalFiles: 0,
            totalSymlinks: 0,
            brokenSymlinks: 0,
            maxDepthReached: 0,
            lastScanTime: startTime,
            scanDuration: 0,
            excludedItems: 0
        };
        
        // Clear existing indexes
        this.federationIndex.clear();
        this.symlinkRegistry.clear();
        this.directoryTree.clear();
        this.fileMetadata.clear();
        
        try {
            // Start recursive scan
            await this.scanDirectory(this.config.federationRoot, 0);
            
            // Process symlinks
            await this.processSymlinks();
            
            // Calculate statistics
            this.stats.scanDuration = Date.now() - startTime;
            
            console.log('✅ Full scan complete');
            this.logScanStatistics();
            
            this.emit('scan:complete', this.stats);
            
        } catch (error) {
            console.error('❌ Full scan failed:', error);
            throw error;
        }
    }
    
    async scanDirectory(dirPath, depth) {
        if (depth > this.config.maxDepth) {
            return;
        }
        
        if (this.stats.totalFiles + this.stats.totalDirectories > this.config.maxFiles) {
            console.warn('⚠️  Maximum file limit reached, stopping scan');
            return;
        }
        
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            const relativePath = path.relative(this.config.federationRoot, dirPath);
            
            // Update max depth
            this.stats.maxDepthReached = Math.max(this.stats.maxDepthReached, depth);
            
            // Create directory entry
            if (depth > 0) { // Don't include root
                this.federationIndex.set(relativePath, {
                    type: 'directory',
                    path: dirPath,
                    relativePath,
                    depth,
                    parent: path.dirname(relativePath),
                    children: [],
                    created: Date.now(),
                    scanned: Date.now()
                });
                
                this.stats.totalDirectories++;
            }
            
            // Process entries
            for (const entry of entries) {
                const entryPath = path.join(dirPath, entry.name);
                const entryRelativePath = path.relative(this.config.federationRoot, entryPath);
                
                // Check exclusion patterns
                if (this.shouldExclude(entry.name, entryPath)) {
                    this.stats.excludedItems++;
                    continue;
                }
                
                if (entry.isDirectory()) {
                    // Add to parent's children
                    if (depth > 0) {
                        const parentEntry = this.federationIndex.get(relativePath);
                        if (parentEntry) {
                            parentEntry.children.push(entry.name);
                        }
                    }
                    
                    // Recurse into subdirectory
                    await this.scanDirectory(entryPath, depth + 1);
                    
                } else if (entry.isSymbolicLink()) {
                    await this.processSymlink(entryPath, entryRelativePath, depth);
                    
                } else if (entry.isFile()) {
                    await this.processFile(entryPath, entryRelativePath, depth);
                }
            }
            
        } catch (error) {
            console.warn(`⚠️  Skipped directory ${dirPath}:`, error.message);
        }
    }
    
    async processFile(filePath, relativePath, depth) {
        try {
            const stats = await fs.stat(filePath);
            const fileName = path.basename(filePath);
            const fileExtension = path.extname(fileName).toLowerCase();
            const fileDir = path.dirname(relativePath);
            
            // Create file entry
            const fileEntry = {
                type: 'file',
                path: filePath,
                relativePath,
                name: fileName,
                extension: fileExtension,
                depth,
                parent: fileDir,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                accessed: stats.atime,
                contentType: this.detectContentType(fileName, fileExtension),
                scanned: Date.now()
            };
            
            this.federationIndex.set(relativePath, fileEntry);
            
            // Store additional metadata
            this.fileMetadata.set(relativePath, {
                permissions: stats.mode,
                uid: stats.uid,
                gid: stats.gid,
                blocks: stats.blocks,
                hash: await this.calculateFileHash(filePath, stats.size)
            });
            
            this.stats.totalFiles++;
            
            // Add to parent's children
            const parentEntry = this.federationIndex.get(fileDir);
            if (parentEntry && parentEntry.type === 'directory') {
                parentEntry.children.push(fileName);
            }
            
        } catch (error) {
            console.warn(`⚠️  Skipped file ${filePath}:`, error.message);
        }
    }
    
    async processSymlink(linkPath, relativePath, depth) {
        try {
            const linkTarget = await fs.readlink(linkPath);
            const resolvedTarget = path.resolve(path.dirname(linkPath), linkTarget);
            const linkName = path.basename(linkPath);
            
            // Check if target exists
            let targetExists = false;
            let targetType = 'unknown';
            
            try {
                const targetStats = await fs.stat(resolvedTarget);
                targetExists = true;
                targetType = targetStats.isDirectory() ? 'directory' : 'file';
            } catch {
                targetExists = false;
                this.stats.brokenSymlinks++;
            }
            
            // Create symlink entry
            const symlinkEntry = {
                type: 'symlink',
                path: linkPath,
                relativePath,
                name: linkName,
                depth,
                parent: path.dirname(relativePath),
                target: linkTarget,
                resolvedTarget,
                targetExists,
                targetType,
                created: Date.now(),
                scanned: Date.now()
            };
            
            this.federationIndex.set(relativePath, symlinkEntry);
            this.symlinkRegistry.set(relativePath, symlinkEntry);
            
            this.stats.totalSymlinks++;
            
            // Handle symlink based on policy
            if (this.config.symlinkPolicy === 'follow' && targetExists && targetType === 'directory') {
                // Follow symlink to directory (be careful of cycles)
                if (!this.wouldCreateCycle(resolvedTarget, linkPath)) {
                    await this.scanDirectory(resolvedTarget, depth + 1);
                }
            }
            
        } catch (error) {
            console.warn(`⚠️  Skipped symlink ${linkPath}:`, error.message);
        }
    }
    
    wouldCreateCycle(targetPath, linkPath) {
        // Simple cycle detection - check if target is ancestor of link
        const linkDir = path.dirname(linkPath);
        const relativePath = path.relative(targetPath, linkDir);
        return !relativePath.startsWith('..');
    }
    
    async processSymlinks() {
        console.log('🔗 Processing symlinks...');
        
        for (const [relativePath, symlinkEntry] of this.symlinkRegistry) {
            // Create mapping between symlink and target
            if (symlinkEntry.targetExists) {
                const targetRelative = path.relative(this.config.federationRoot, symlinkEntry.resolvedTarget);
                
                // Create bidirectional mapping
                if (!this.directoryTree.has('symlink_mappings')) {
                    this.directoryTree.set('symlink_mappings', new Map());
                }
                
                const mappings = this.directoryTree.get('symlink_mappings');
                mappings.set(relativePath, targetRelative);
                
                // Also map target to symlinks pointing to it
                if (!mappings.has(targetRelative)) {
                    mappings.set(targetRelative, []);
                }
                mappings.get(targetRelative).push(relativePath);
            }
        }
        
        console.log(`🔗 Processed ${this.symlinkRegistry.size} symlinks`);
    }
    
    async buildSearchIndexes() {
        console.log('🔍 Building search indexes...');
        
        // Clear existing indexes
        this.pathIndex.clear();
        this.extensionIndex.clear();
        this.sizeIndex.clear();
        this.modifiedIndex.clear();
        this.contentTypeIndex.clear();
        
        for (const [relativePath, entry] of this.federationIndex) {
            // Path index (for quick lookups)
            const pathParts = relativePath.split(path.sep).filter(p => p);
            pathParts.forEach(part => {
                if (!this.pathIndex.has(part.toLowerCase())) {
                    this.pathIndex.set(part.toLowerCase(), []);
                }
                this.pathIndex.get(part.toLowerCase()).push(relativePath);
            });
            
            // Extension index
            if (entry.extension) {
                if (!this.extensionIndex.has(entry.extension)) {
                    this.extensionIndex.set(entry.extension, []);
                }
                this.extensionIndex.get(entry.extension).push(relativePath);
            }
            
            // Size index (for files)
            if (entry.type === 'file' && entry.size !== undefined) {
                const sizeCategory = this.getSizeCategory(entry.size);
                if (!this.sizeIndex.has(sizeCategory)) {
                    this.sizeIndex.set(sizeCategory, []);
                }
                this.sizeIndex.get(sizeCategory).push(relativePath);
            }
            
            // Modified time index
            if (entry.modified) {
                const modifiedCategory = this.getModifiedCategory(entry.modified);
                if (!this.modifiedIndex.has(modifiedCategory)) {
                    this.modifiedIndex.set(modifiedCategory, []);
                }
                this.modifiedIndex.get(modifiedCategory).push(relativePath);
            }
            
            // Content type index
            if (entry.contentType) {
                if (!this.contentTypeIndex.has(entry.contentType)) {
                    this.contentTypeIndex.set(entry.contentType, []);
                }
                this.contentTypeIndex.get(entry.contentType).push(relativePath);
            }
        }
        
        console.log('✅ Search indexes built');
        this.logIndexStatistics();
    }
    
    async startFileWatching() {
        if (this.watcherEnabled) return;
        
        console.log('👁️  Starting file watching...');
        
        try {
            // Watch root directory recursively
            const watcher = await fs.watch(this.config.federationRoot, { recursive: true });
            
            this.watchers.set(this.config.federationRoot, watcher);
            this.watcherEnabled = true;
            
            // Handle file system events
            watcher.on('change', (eventType, filename) => {
                this.handleFileSystemEvent(eventType, filename);
            });
            
            console.log('👁️  File watching started');
            
        } catch (error) {
            console.warn('⚠️  File watching not available:', error.message);
        }
    }
    
    handleFileSystemEvent(eventType, filename) {
        if (!filename) return;
        
        const fullPath = path.join(this.config.federationRoot, filename);
        const relativePath = filename;
        
        // Debounce rapid events
        const debounceKey = `${eventType}:${relativePath}`;
        clearTimeout(this.debounceTimers?.[debounceKey]);
        
        if (!this.debounceTimers) this.debounceTimers = {};
        
        this.debounceTimers[debounceKey] = setTimeout(async () => {
            try {
                await this.updatePathEntry(fullPath, relativePath);
            } catch (error) {
                console.warn(`⚠️  Failed to update ${relativePath}:`, error.message);
            }
        }, 1000);
    }
    
    async updatePathEntry(fullPath, relativePath) {
        try {
            const stats = await fs.stat(fullPath);
            const depth = relativePath.split(path.sep).length - 1;
            
            if (stats.isFile()) {
                await this.processFile(fullPath, relativePath, depth);
            } else if (stats.isDirectory()) {
                // Directory changed - might need to rescan
                await this.scanDirectory(fullPath, depth);
            }
            
            // Rebuild affected indexes
            await this.rebuildIndexesForPath(relativePath);
            
            this.emit('file:updated', { path: fullPath, relativePath });
            
        } catch (error) {
            // File might have been deleted
            if (this.federationIndex.has(relativePath)) {
                this.federationIndex.delete(relativePath);
                this.fileMetadata.delete(relativePath);
                
                await this.rebuildIndexesForPath(relativePath);
                
                this.emit('file:deleted', { relativePath });
            }
        }
    }
    
    async rebuildIndexesForPath(relativePath) {
        // Remove from indexes
        this.removeFromIndexes(relativePath);
        
        // Re-add if entry still exists
        const entry = this.federationIndex.get(relativePath);
        if (entry) {
            await this.addToIndexes(relativePath, entry);
        }
    }
    
    removeFromIndexes(relativePath) {
        // Remove from all indexes
        for (const index of [this.pathIndex, this.extensionIndex, this.sizeIndex, this.modifiedIndex, this.contentTypeIndex]) {
            for (const [key, paths] of index) {
                const filtered = paths.filter(p => p !== relativePath);
                if (filtered.length === 0) {
                    index.delete(key);
                } else {
                    index.set(key, filtered);
                }
            }
        }
    }
    
    async addToIndexes(relativePath, entry) {
        // Re-add to indexes (simplified version of buildSearchIndexes for single entry)
        const pathParts = relativePath.split(path.sep).filter(p => p);
        pathParts.forEach(part => {
            if (!this.pathIndex.has(part.toLowerCase())) {
                this.pathIndex.set(part.toLowerCase(), []);
            }
            this.pathIndex.get(part.toLowerCase()).push(relativePath);
        });
        
        if (entry.extension) {
            if (!this.extensionIndex.has(entry.extension)) {
                this.extensionIndex.set(entry.extension, []);
            }
            this.extensionIndex.get(entry.extension).push(relativePath);
        }
        
        // ... (similar for other indexes)
    }
    
    schedulePeriodicRefresh() {
        setInterval(async () => {
            try {
                await this.performIncrementalScan();
            } catch (error) {
                console.error('❌ Periodic refresh failed:', error);
            }
        }, this.config.indexRefreshInterval);
    }
    
    async performIncrementalScan() {
        console.log('🔄 Performing incremental scan...');
        
        // Only scan directories that have been modified since last scan
        const modifiedDirectories = await this.findModifiedDirectories();
        
        for (const dirPath of modifiedDirectories) {
            const relativePath = path.relative(this.config.federationRoot, dirPath);
            const depth = relativePath.split(path.sep).length - 1;
            
            await this.scanDirectory(dirPath, depth);
        }
        
        if (modifiedDirectories.length > 0) {
            await this.buildSearchIndexes();
            console.log(`🔄 Incremental scan complete: ${modifiedDirectories.length} directories updated`);
        }
    }
    
    async findModifiedDirectories() {
        const modifiedDirs = [];
        const lastScanTime = this.stats.lastScanTime;
        
        for (const [relativePath, entry] of this.federationIndex) {
            if (entry.type === 'directory') {
                try {
                    const stats = await fs.stat(entry.path);
                    if (stats.mtime > lastScanTime) {
                        modifiedDirs.push(entry.path);
                    }
                } catch (error) {
                    // Directory might have been deleted
                    modifiedDirs.push(entry.path);
                }
            }
        }
        
        return modifiedDirs;
    }
    
    // Search methods
    async searchPaths(query, options = {}) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        // Search by path components
        if (this.pathIndex.has(queryLower)) {
            const paths = this.pathIndex.get(queryLower);
            paths.forEach(path => {
                const entry = this.federationIndex.get(path);
                if (entry) {
                    results.push({
                        type: 'exact_path_match',
                        confidence: 1.0,
                        path,
                        entry
                    });
                }
            });
        }
        
        // Fuzzy search in path components
        for (const [component, paths] of this.pathIndex) {
            if (component.includes(queryLower) || queryLower.includes(component)) {
                const similarity = this.calculateSimilarity(queryLower, component);
                if (similarity > 0.5) {
                    paths.forEach(path => {
                        const entry = this.federationIndex.get(path);
                        if (entry) {
                            results.push({
                                type: 'fuzzy_path_match',
                                confidence: similarity,
                                path,
                                entry,
                                matchedComponent: component
                            });
                        }
                    });
                }
            }
        }
        
        // Apply filters
        let filteredResults = results;
        
        if (options.fileType) {
            filteredResults = filteredResults.filter(r => r.entry.contentType === options.fileType);
        }
        
        if (options.extension) {
            filteredResults = filteredResults.filter(r => r.entry.extension === options.extension);
        }
        
        if (options.maxDepth !== undefined) {
            filteredResults = filteredResults.filter(r => r.entry.depth <= options.maxDepth);
        }
        
        if (options.sizeRange) {
            filteredResults = filteredResults.filter(r => {
                if (r.entry.type !== 'file') return true;
                return r.entry.size >= options.sizeRange.min && r.entry.size <= options.sizeRange.max;
            });
        }
        
        // Sort by confidence
        filteredResults.sort((a, b) => b.confidence - a.confidence);
        
        return {
            query,
            totalResults: filteredResults.length,
            results: filteredResults.slice(0, options.limit || 50),
            searchTime: Date.now()
        };
    }
    
    async resolveSymlinks(paths) {
        const resolved = [];
        
        for (const inputPath of paths) {
            const entry = this.federationIndex.get(inputPath);
            
            if (entry && entry.type === 'symlink') {
                if (entry.targetExists) {
                    const targetRelative = path.relative(this.config.federationRoot, entry.resolvedTarget);
                    const targetEntry = this.federationIndex.get(targetRelative);
                    
                    resolved.push({
                        originalPath: inputPath,
                        resolvedPath: targetRelative,
                        symlink: entry,
                        target: targetEntry
                    });
                } else {
                    resolved.push({
                        originalPath: inputPath,
                        resolvedPath: null,
                        symlink: entry,
                        target: null,
                        error: 'broken_symlink'
                    });
                }
            } else {
                resolved.push({
                    originalPath: inputPath,
                    resolvedPath: inputPath,
                    symlink: null,
                    target: entry
                });
            }
        }
        
        return resolved;
    }
    
    async getDirectoryTree(rootPath = '', maxDepth = 5) {
        const tree = {
            path: rootPath,
            type: 'directory',
            children: []
        };
        
        await this.buildTreeRecursive(tree, rootPath, 0, maxDepth);
        
        return tree;
    }
    
    async buildTreeRecursive(node, currentPath, depth, maxDepth) {
        if (depth >= maxDepth) return;
        
        const entry = this.federationIndex.get(currentPath);
        if (!entry || entry.type !== 'directory') return;
        
        for (const childName of entry.children || []) {
            const childPath = currentPath ? path.join(currentPath, childName) : childName;
            const childEntry = this.federationIndex.get(childPath);
            
            if (childEntry) {
                const childNode = {
                    path: childPath,
                    name: childName,
                    type: childEntry.type,
                    size: childEntry.size,
                    modified: childEntry.modified,
                    children: childEntry.type === 'directory' ? [] : undefined
                };
                
                if (childEntry.type === 'directory') {
                    await this.buildTreeRecursive(childNode, childPath, depth + 1, maxDepth);
                }
                
                node.children.push(childNode);
            }
        }
        
        // Sort children
        node.children.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    }
    
    // Utility methods
    shouldExclude(name, fullPath) {
        return this.config.excludePatterns.some(pattern => {
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                return regex.test(name);
            }
            return name === pattern;
        });
    }
    
    detectContentType(fileName, extension) {
        const typeMap = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.html': 'html',
            '.css': 'css',
            '.json': 'json',
            '.xml': 'xml',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.md': 'markdown',
            '.txt': 'text',
            '.pdf': 'pdf',
            '.doc': 'document',
            '.docx': 'document',
            '.jpg': 'image',
            '.jpeg': 'image',
            '.png': 'image',
            '.gif': 'image',
            '.mp4': 'video',
            '.mp3': 'audio',
            '.zip': 'archive',
            '.tar': 'archive',
            '.gz': 'archive'
        };
        
        return typeMap[extension] || 'unknown';
    }
    
    async calculateFileHash(filePath, fileSize) {
        // For large files, only hash first and last chunks
        if (fileSize > 1024 * 1024) { // 1MB
            try {
                const fd = await fs.open(filePath, 'r');
                const buffer1 = Buffer.alloc(1024);
                const buffer2 = Buffer.alloc(1024);
                
                await fd.read(buffer1, 0, 1024, 0);
                await fd.read(buffer2, 0, 1024, Math.max(0, fileSize - 1024));
                await fd.close();
                
                const hash = crypto.createHash('sha256');
                hash.update(buffer1);
                hash.update(buffer2);
                hash.update(fileSize.toString());
                
                return hash.digest('hex').substring(0, 16);
            } catch {
                return null;
            }
        } else {
            try {
                const content = await fs.readFile(filePath);
                return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
            } catch {
                return null;
            }
        }
    }
    
    getSizeCategory(size) {
        if (size < 1024) return 'tiny';
        if (size < 1024 * 1024) return 'small';
        if (size < 10 * 1024 * 1024) return 'medium';
        if (size < 100 * 1024 * 1024) return 'large';
        return 'huge';
    }
    
    getModifiedCategory(modifiedTime) {
        const now = Date.now();
        const age = now - modifiedTime.getTime();
        
        if (age < 24 * 60 * 60 * 1000) return 'today';
        if (age < 7 * 24 * 60 * 60 * 1000) return 'this_week';
        if (age < 30 * 24 * 60 * 60 * 1000) return 'this_month';
        if (age < 365 * 24 * 60 * 60 * 1000) return 'this_year';
        return 'old';
    }
    
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    logScanStatistics() {
        console.log('\n📊 Directory Scan Statistics:');
        console.log(`  📁 Directories: ${this.stats.totalDirectories}`);
        console.log(`  📄 Files: ${this.stats.totalFiles}`);
        console.log(`  🔗 Symlinks: ${this.stats.totalSymlinks} (${this.stats.brokenSymlinks} broken)`);
        console.log(`  📏 Max depth: ${this.stats.maxDepthReached}`);
        console.log(`  ⏱️  Scan time: ${this.stats.scanDuration}ms`);
        console.log(`  🚫 Excluded: ${this.stats.excludedItems}`);
    }
    
    logIndexStatistics() {
        console.log('\n🔍 Search Index Statistics:');
        console.log(`  🛤️  Path components: ${this.pathIndex.size}`);
        console.log(`  📎 Extensions: ${this.extensionIndex.size}`);
        console.log(`  📏 Size categories: ${this.sizeIndex.size}`);
        console.log(`  📅 Modified categories: ${this.modifiedIndex.size}`);
        console.log(`  📋 Content types: ${this.contentTypeIndex.size}`);
    }
    
    getFederationStats() {
        return {
            ...this.stats,
            indexSizes: {
                pathComponents: this.pathIndex.size,
                extensions: this.extensionIndex.size,
                sizeCategories: this.sizeIndex.size,
                modifiedCategories: this.modifiedIndex.size,
                contentTypes: this.contentTypeIndex.size
            },
            federationSize: this.federationIndex.size,
            symlinkCount: this.symlinkRegistry.size,
            watcherEnabled: this.watcherEnabled
        };
    }
    
    async shutdown() {
        console.log('🛑 Shutting down Directory Federation Manager...');
        
        // Stop file watchers
        for (const [path, watcher] of this.watchers) {
            watcher.close();
        }
        this.watchers.clear();
        this.watcherEnabled = false;
        
        // Clear debounce timers
        if (this.debounceTimers) {
            Object.values(this.debounceTimers).forEach(timer => clearTimeout(timer));
        }
        
        console.log('✅ Directory Federation Manager shutdown complete');
    }
}

// CLI execution
if (require.main === module) {
    console.log('📁 DIRECTORY FEDERATION MANAGER');
    console.log('=================================');
    
    const args = process.argv.slice(2);
    const federationRoot = args[0] || process.cwd();
    
    const manager = new DirectoryFederationManager({
        federationRoot,
        maxDepth: 10,
        watchForChanges: true
    });
    
    manager.on('federation:ready', async () => {
        console.log('\n✅ Federation ready! Available commands:');
        console.log('  search <query>     - Search paths');
        console.log('  tree [path]        - Show directory tree');
        console.log('  stats              - Show statistics');
        console.log('  symlinks           - List symlinks');
        console.log('  exit               - Exit');
        
        // Interactive mode
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: 'federation> '
        });
        
        rl.prompt();
        
        rl.on('line', async (input) => {
            const [command, ...args] = input.trim().split(' ');
            
            try {
                switch (command) {
                    case 'search':
                        if (args.length > 0) {
                            const result = await manager.searchPaths(args.join(' '));
                            console.log(`Found ${result.totalResults} results:`);
                            result.results.slice(0, 10).forEach(r => {
                                console.log(`  ${r.confidence.toFixed(2)} - ${r.path} (${r.entry.type})`);
                            });
                        } else {
                            console.log('Usage: search <query>');
                        }
                        break;
                        
                    case 'tree':
                        const rootPath = args[0] || '';
                        const tree = await manager.getDirectoryTree(rootPath, 3);
                        console.log(JSON.stringify(tree, null, 2));
                        break;
                        
                    case 'stats':
                        const stats = manager.getFederationStats();
                        console.log(JSON.stringify(stats, null, 2));
                        break;
                        
                    case 'symlinks':
                        const symlinks = Array.from(manager.symlinkRegistry.values());
                        console.log(`${symlinks.length} symlinks:`);
                        symlinks.forEach(link => {
                            const status = link.targetExists ? '✅' : '❌';
                            console.log(`  ${status} ${link.relativePath} -> ${link.target}`);
                        });
                        break;
                        
                    case 'exit':
                        await manager.shutdown();
                        rl.close();
                        process.exit(0);
                        break;
                        
                    default:
                        console.log('Unknown command. Available: search, tree, stats, symlinks, exit');
                }
            } catch (error) {
                console.error('Error:', error.message);
            }
            
            rl.prompt();
        });
    });
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        await manager.shutdown();
        process.exit(0);
    });
}

module.exports = DirectoryFederationManager;