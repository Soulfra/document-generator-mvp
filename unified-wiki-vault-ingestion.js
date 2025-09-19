#!/usr/bin/env node

/**
 * UNIFIED WIKI-VAULT INGESTION SYSTEM
 * 
 * Mass ingestion and AI-powered organization of 19,416+ files
 * 
 * Features:
 * ✅ Scan entire codebase automatically
 * ✅ AI-powered categorization via Executive Suite
 * ✅ SIMP tag integration for unified taxonomy
 * ✅ Vault system integration
 * ✅ Real-time progress tracking
 * ✅ Smart deduplication
 * ✅ Hierarchical organization
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class UnifiedWikiVaultIngestion extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Source directories to scan
            sourcePaths: [
                '/Users/matthewmauer/Desktop/Document-Generator'
            ],
            
            // Exclusion patterns
            excludePatterns: [
                '**/node_modules/**',
                '**/backup*/**',
                '**/worktrees/**',
                '**/.git/**',
                '**/logs/**',
                '**/*.log',
                '**/dist/**',
                '**/build/**'
            ],
            
            // File type priorities
            filePriorities: {
                '.js': 10,      // JavaScript - highest priority
                '.md': 9,       // Documentation
                '.json': 8,     // Configuration
                '.sql': 7,      // Database schemas
                '.html': 6,     // UI files
                '.css': 5,      // Styles
                '.ts': 10,      // TypeScript
                '.py': 9,       // Python
                '.sh': 7,       // Scripts
                '.yml': 6,      // YAML configs
                '.yaml': 6,     // YAML configs
                '.env': 8,      // Environment
                '.txt': 4,      // Text files
                '.xml': 6,      // XML files
            },
            
            // AI Executive Suite endpoint
            executiveAPI: 'http://localhost:7999/api/executives/query',
            
            // SIMP Tag Processor endpoint  
            simpTagAPI: 'http://localhost:3333/api/tag',
            
            // Database connection
            database: {
                host: 'localhost',
                port: 5432,
                database: 'document_generator',
                user: 'postgres',
                password: 'postgres'
            },
            
            // Batch processing
            batchSize: 100,
            maxConcurrent: 10,
            
            ...options
        };
        
        // State tracking
        this.stats = {
            totalFiles: 0,
            processedFiles: 0,
            categorizedFiles: 0,
            taggedFiles: 0,
            duplicatesFound: 0,
            errors: 0,
            startTime: null,
            endTime: null
        };
        
        this.processedHashes = new Set();
        this.categorizedFiles = new Map();
        this.fileIndex = new Map();
        this.tagCache = new Map();
        
        console.log('🚀 UNIFIED WIKI-VAULT INGESTION SYSTEM');
        console.log('=====================================');
        console.log(`📁 Source Paths: ${this.config.sourcePaths.length}`);
        console.log(`🚫 Exclusions: ${this.config.excludePatterns.length} patterns`);
        console.log(`🎯 AI Executive API: ${this.config.executiveAPI}`);
        console.log(`🏷️ SIMP Tag API: ${this.config.simpTagAPI}`);
    }
    
    /**
     * Start the mass ingestion process
     */
    async startIngestion() {
        this.stats.startTime = Date.now();
        
        try {
            console.log('\n🔍 PHASE 1: DISCOVERY & INDEXING');
            console.log('=================================');
            
            // Phase 1: Discover all files
            await this.discoverFiles();
            
            console.log('\n🤖 PHASE 2: AI CATEGORIZATION');
            console.log('==============================');
            
            // Phase 2: AI-powered categorization
            await this.categorizeFiles();
            
            console.log('\n🏷️ PHASE 3: TAGGING & TAXONOMY');
            console.log('===============================');
            
            // Phase 3: Apply SIMP tagging system
            await this.tagFiles();
            
            console.log('\n💾 PHASE 4: DATABASE INGESTION');
            console.log('===============================');
            
            // Phase 4: Store in unified database
            await this.ingestToDatabase();
            
            console.log('\n🎉 INGESTION COMPLETE!');
            console.log('======================');
            
            this.stats.endTime = Date.now();
            await this.generateReport();
            
        } catch (error) {
            console.error('❌ Ingestion failed:', error);
            throw error;
        }
    }
    
    /**
     * Phase 1: Discover all files in the system
     */
    async discoverFiles() {
        console.log('📋 Scanning file system...');
        
        const allFiles = [];
        
        for (const sourcePath of this.config.sourcePaths) {
            const files = await this.scanDirectory(sourcePath);
            allFiles.push(...files);
        }
        
        // Filter and deduplicate
        const uniqueFiles = await this.filterAndDeduplicate(allFiles);
        
        this.stats.totalFiles = uniqueFiles.length;
        console.log(`📊 Found ${this.stats.totalFiles} files to process`);
        
        // Create initial file index
        for (const file of uniqueFiles) {
            this.fileIndex.set(file.path, file);
        }
        
        this.emit('discovery_complete', { totalFiles: this.stats.totalFiles });
    }
    
    /**
     * Recursively scan directory for files
     */
    async scanDirectory(dirPath) {
        const files = [];
        
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                // Check exclusion patterns
                if (this.isExcluded(fullPath)) {
                    continue;
                }
                
                if (entry.isDirectory()) {
                    // Recursively scan subdirectories
                    const subFiles = await this.scanDirectory(fullPath);
                    files.push(...subFiles);
                } else if (entry.isFile()) {
                    // Analyze file
                    const fileInfo = await this.analyzeFile(fullPath);
                    if (fileInfo) {
                        files.push(fileInfo);
                    }
                }
            }
        } catch (error) {
            console.warn(`⚠️ Failed to scan ${dirPath}: ${error.message}`);
        }
        
        return files;
    }
    
    /**
     * Check if path should be excluded
     */
    isExcluded(filePath) {
        for (const pattern of this.config.excludePatterns) {
            // Convert glob pattern to regex (simplified)
            const regex = new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*'));
            if (regex.test(filePath)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Analyze individual file
     */
    async analyzeFile(filePath) {
        try {
            const stats = await fs.stat(filePath);
            const ext = path.extname(filePath).toLowerCase();
            
            // Skip very large files (>10MB)
            if (stats.size > 10 * 1024 * 1024) {
                return null;
            }
            
            // Get file hash for deduplication
            const content = await fs.readFile(filePath);
            const hash = crypto.createHash('md5').update(content).digest('hex');
            
            return {
                path: filePath,
                relativePath: path.relative(this.config.sourcePaths[0], filePath),
                name: path.basename(filePath),
                extension: ext,
                size: stats.size,
                modified: stats.mtime,
                created: stats.birthtime,
                hash: hash,
                priority: this.config.filePriorities[ext] || 1,
                content: content.toString('utf8', 0, Math.min(content.length, 50000)) // First 50KB
            };
        } catch (error) {
            console.warn(`⚠️ Failed to analyze ${filePath}: ${error.message}`);
            return null;
        }
    }
    
    /**
     * Filter files and remove duplicates
     */
    async filterAndDeduplicate(files) {
        console.log('🔍 Filtering and deduplicating...');
        
        const uniqueFiles = [];
        const seenHashes = new Set();
        
        // Sort by priority (high priority first)
        files.sort((a, b) => b.priority - a.priority);
        
        for (const file of files) {
            if (seenHashes.has(file.hash)) {
                this.stats.duplicatesFound++;
                continue;
            }
            
            seenHashes.add(file.hash);
            uniqueFiles.push(file);
        }
        
        console.log(`✅ Removed ${this.stats.duplicatesFound} duplicates`);
        return uniqueFiles;
    }
    
    /**
     * Phase 2: AI-powered categorization using Executive Suite
     */
    async categorizeFiles() {
        console.log('🤖 Starting AI categorization...');
        
        const files = Array.from(this.fileIndex.values());
        const batches = this.createBatches(files, this.config.batchSize);
        
        let processedBatches = 0;
        
        for (const batch of batches) {
            try {
                await this.categorizeBatch(batch);
                processedBatches++;
                
                const progress = (processedBatches / batches.length) * 100;
                console.log(`📊 Progress: ${progress.toFixed(1)}% (${processedBatches}/${batches.length} batches)`);
                
                this.emit('categorization_progress', { progress, batch: processedBatches, total: batches.length });
            } catch (error) {
                console.error(`❌ Batch categorization failed:`, error);
                this.stats.errors++;
            }
        }
        
        console.log(`✅ Categorized ${this.stats.categorizedFiles} files`);
    }
    
    /**
     * Categorize batch of files using AI
     */
    async categorizeBatch(batch) {
        // Prepare batch summary for AI
        const batchSummary = batch.map(file => ({
            path: file.relativePath,
            name: file.name,
            extension: file.extension,
            size: file.size,
            preview: file.content.slice(0, 200).replace(/\n/g, ' ')
        }));
        
        try {
            const response = await fetch(this.config.executiveAPI, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `Analyze and categorize these ${batch.length} files. For each file, determine:
1. Primary category (backend, frontend, config, docs, database, scripts, etc.)
2. Secondary category (specific purpose)  
3. Importance level (critical, important, useful, archive)
4. Functional area (auth, api, ui, storage, processing, etc.)

Files to categorize:
${JSON.stringify(batchSummary, null, 2)}

Return a JSON array with categorization for each file.`,
                    context: {
                        task: 'file_categorization',
                        batchSize: batch.length,
                        timestamp: Date.now()
                    }
                }),
                timeout: 60000
            });
            
            if (response.ok) {
                const result = await response.json();
                await this.processCategorizationResults(batch, result);
            } else {
                console.warn('⚠️ AI categorization request failed, using fallback');
                await this.fallbackCategorization(batch);
            }
        } catch (error) {
            console.warn('⚠️ AI categorization error, using fallback:', error.message);
            await this.fallbackCategorization(batch);
        }
    }
    
    /**
     * Process AI categorization results
     */
    async processCategorizationResults(batch, aiResult) {
        try {
            // Extract categorization from AI response
            let categories;
            
            if (aiResult.responses && aiResult.responses.length > 0) {
                // Try to parse JSON from first executive response
                const response = aiResult.responses[0].response;
                const jsonMatch = response.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    categories = JSON.parse(jsonMatch[0]);
                }
            }
            
            if (!categories || !Array.isArray(categories)) {
                throw new Error('Invalid AI categorization format');
            }
            
            // Apply categorization to files
            for (let i = 0; i < batch.length && i < categories.length; i++) {
                const file = batch[i];
                const category = categories[i];
                
                file.category = {
                    primary: category.primary_category || this.getFallbackCategory(file),
                    secondary: category.secondary_category || 'general',
                    importance: category.importance || 'useful',
                    functional_area: category.functional_area || 'misc',
                    ai_confidence: 0.8
                };
                
                this.categorizedFiles.set(file.path, file);
                this.stats.categorizedFiles++;
            }
        } catch (error) {
            console.warn('⚠️ Failed to process AI results, using fallback');
            await this.fallbackCategorization(batch);
        }
    }
    
    /**
     * Fallback categorization based on file patterns
     */
    async fallbackCategorization(batch) {
        for (const file of batch) {
            file.category = {
                primary: this.getFallbackCategory(file),
                secondary: 'general',
                importance: 'useful',
                functional_area: this.getFunctionalArea(file),
                ai_confidence: 0.3
            };
            
            this.categorizedFiles.set(file.path, file);
            this.stats.categorizedFiles++;
        }
    }
    
    /**
     * Get fallback category based on file analysis
     */
    getFallbackCategory(file) {
        const { extension, path: filePath, name } = file;
        
        // Extension-based categorization
        const categoryMap = {
            '.js': 'backend',
            '.ts': 'backend', 
            '.html': 'frontend',
            '.css': 'frontend',
            '.md': 'docs',
            '.json': 'config',
            '.sql': 'database',
            '.sh': 'scripts',
            '.py': 'scripts',
            '.yml': 'config',
            '.yaml': 'config',
            '.env': 'config',
            '.xml': 'config'
        };
        
        if (categoryMap[extension]) {
            return categoryMap[extension];
        }
        
        // Path-based categorization
        if (filePath.includes('test') || filePath.includes('spec')) return 'testing';
        if (filePath.includes('doc') || filePath.includes('readme')) return 'docs';
        if (filePath.includes('config') || filePath.includes('settings')) return 'config';
        if (filePath.includes('api') || filePath.includes('endpoint')) return 'api';
        if (filePath.includes('ui') || filePath.includes('component')) return 'frontend';
        if (filePath.includes('db') || filePath.includes('database')) return 'database';
        if (filePath.includes('auth') || filePath.includes('login')) return 'auth';
        if (filePath.includes('util') || filePath.includes('helper')) return 'utility';
        
        return 'misc';
    }
    
    /**
     * Get functional area based on file analysis
     */
    getFunctionalArea(file) {
        const { path: filePath, name, content } = file;
        
        // Content-based detection
        if (content) {
            if (content.includes('auth') || content.includes('login')) return 'authentication';
            if (content.includes('database') || content.includes('sql')) return 'storage';
            if (content.includes('api') || content.includes('endpoint')) return 'api';
            if (content.includes('ui') || content.includes('component')) return 'interface';
            if (content.includes('test') || content.includes('spec')) return 'testing';
        }
        
        // Path-based detection
        if (filePath.includes('orchestrat')) return 'orchestration';
        if (filePath.includes('ai') || filePath.includes('llm')) return 'ai';
        if (filePath.includes('game') || filePath.includes('wiki')) return 'gaming';
        if (filePath.includes('vault') || filePath.includes('security')) return 'security';
        if (filePath.includes('market') || filePath.includes('economy')) return 'economy';
        
        return 'general';
    }
    
    /**
     * Phase 3: Apply SIMP tagging system
     */
    async tagFiles() {
        console.log('🏷️ Starting SIMP tag processing...');
        
        const categorizedFiles = Array.from(this.categorizedFiles.values());
        
        for (const file of categorizedFiles) {
            try {
                await this.tagFile(file);
                this.stats.taggedFiles++;
                
                if (this.stats.taggedFiles % 100 === 0) {
                    console.log(`🏷️ Tagged ${this.stats.taggedFiles}/${categorizedFiles.length} files`);
                }
            } catch (error) {
                console.warn(`⚠️ Failed to tag ${file.path}:`, error.message);
                this.stats.errors++;
            }
        }
        
        console.log(`✅ Tagged ${this.stats.taggedFiles} files`);
    }
    
    /**
     * Apply SIMP tags to individual file
     */
    async tagFile(file) {
        // Generate tags based on file analysis
        const tags = new Set();
        
        // Category-based tags
        tags.add(file.category.primary);
        tags.add(file.category.secondary);
        tags.add(file.category.importance);
        tags.add(file.category.functional_area);
        
        // Extension-based tags
        tags.add(`ext-${file.extension.slice(1)}`);
        
        // Size-based tags
        if (file.size > 100000) tags.add('large-file');
        else if (file.size > 10000) tags.add('medium-file');
        else tags.add('small-file');
        
        // Content-based tags (if available)
        if (file.content) {
            if (file.content.includes('async') || file.content.includes('await')) tags.add('async');
            if (file.content.includes('class ') || file.content.includes('function ')) tags.add('executable');
            if (file.content.includes('module.exports') || file.content.includes('export ')) tags.add('module');
            if (file.content.includes('test') || file.content.includes('spec')) tags.add('test');
        }
        
        // Convert tags to array and store
        file.tags = Array.from(tags);
        
        // Try to send to SIMP tag processor (optional)
        try {
            await this.sendToSimpProcessor(file);
        } catch (error) {
            // SIMP processor not available, continue with local tags
        }
    }
    
    /**
     * Send file to SIMP tag processor
     */
    async sendToSimpProcessor(file) {
        try {
            const response = await fetch(this.config.simpTagAPI, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file: {
                        path: file.relativePath,
                        name: file.name,
                        extension: file.extension,
                        category: file.category,
                        preview: file.content ? file.content.slice(0, 1000) : ''
                    },
                    operation: 'tag_generation'
                }),
                timeout: 5000
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.tags && Array.isArray(result.tags)) {
                    // Merge with existing tags
                    file.tags = [...new Set([...file.tags, ...result.tags])];
                    file.simp_processed = true;
                }
            }
        } catch (error) {
            // SIMP processor not available, skip
        }
    }
    
    /**
     * Phase 4: Ingest to unified database
     */
    async ingestToDatabase() {
        console.log('💾 Ingesting to unified database...');
        
        // For now, save to JSON files (database integration coming next)
        const outputDir = '/Users/matthewmauer/Desktop/Document-Generator/wiki-vault-data';
        
        try {
            await fs.mkdir(outputDir, { recursive: true });
            
            // Save categorized files
            const filesData = Array.from(this.categorizedFiles.values());
            await fs.writeFile(
                path.join(outputDir, 'categorized-files.json'),
                JSON.stringify(filesData, null, 2)
            );
            
            // Save statistics
            await fs.writeFile(
                path.join(outputDir, 'ingestion-stats.json'),
                JSON.stringify(this.stats, null, 2)
            );
            
            // Save tag index
            const tagIndex = this.buildTagIndex(filesData);
            await fs.writeFile(
                path.join(outputDir, 'tag-index.json'),
                JSON.stringify(tagIndex, null, 2)
            );
            
            console.log(`✅ Data saved to ${outputDir}`);
        } catch (error) {
            console.error('❌ Database ingestion failed:', error);
            throw error;
        }
    }
    
    /**
     * Build tag index for fast searching
     */
    buildTagIndex(files) {
        const index = {};
        
        for (const file of files) {
            if (file.tags) {
                for (const tag of file.tags) {
                    if (!index[tag]) {
                        index[tag] = [];
                    }
                    index[tag].push({
                        path: file.relativePath,
                        name: file.name,
                        category: file.category
                    });
                }
            }
        }
        
        return index;
    }
    
    /**
     * Create processing batches
     */
    createBatches(array, batchSize) {
        const batches = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }
    
    /**
     * Generate final report
     */
    async generateReport() {
        const duration = this.stats.endTime - this.stats.startTime;
        const durationMin = (duration / 1000 / 60).toFixed(2);
        
        console.log('📊 INGESTION REPORT');
        console.log('==================');
        console.log(`⏱️ Duration: ${durationMin} minutes`);
        console.log(`📁 Total Files: ${this.stats.totalFiles}`);
        console.log(`✅ Processed: ${this.stats.processedFiles}`);
        console.log(`🤖 Categorized: ${this.stats.categorizedFiles}`);
        console.log(`🏷️ Tagged: ${this.stats.taggedFiles}`);
        console.log(`🔄 Duplicates: ${this.stats.duplicatesFound}`);
        console.log(`❌ Errors: ${this.stats.errors}`);
        
        // Category breakdown
        const categoryStats = {};
        for (const file of this.categorizedFiles.values()) {
            const cat = file.category.primary;
            categoryStats[cat] = (categoryStats[cat] || 0) + 1;
        }
        
        console.log('\n📊 CATEGORY BREAKDOWN');
        console.log('====================');
        for (const [category, count] of Object.entries(categoryStats).sort((a, b) => b[1] - a[1])) {
            console.log(`${category.padEnd(15)}: ${count}`);
        }
        
        this.emit('ingestion_complete', this.stats);
    }
}

// CLI execution
if (require.main === module) {
    const ingestion = new UnifiedWikiVaultIngestion();
    
    ingestion.on('discovery_complete', (data) => {
        console.log(`🔍 Discovery complete: ${data.totalFiles} files found`);
    });
    
    ingestion.on('categorization_progress', (data) => {
        process.stdout.write(`\r🤖 Categorizing: ${data.progress.toFixed(1)}%`);
    });
    
    ingestion.on('ingestion_complete', (stats) => {
        console.log('\n🎉 Ingestion completed successfully!');
        process.exit(0);
    });
    
    ingestion.startIngestion().catch(error => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
}

module.exports = UnifiedWikiVaultIngestion;