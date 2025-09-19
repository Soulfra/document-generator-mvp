#!/usr/bin/env node
/**
 * 🤖📖 CAL VAULT READER
 * 
 * Main interface for CAL to read and understand the organized Obsidian vault
 * Connects CAL orchestration systems to the 37,375+ organized files
 * 
 * Features:
 * - Reads Obsidian vault structure and metadata
 * - Understands category organization and file relationships  
 * - Provides natural language interface for CAL to query components
 * - Integrates with existing CAL orchestration systems
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class CalVaultReader extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            vaultPath: config.vaultPath || './ObsidianVault',
            indexPath: config.indexPath || './ObsidianVault/00-Index',
            enableRealtime: config.enableRealtime !== false,
            enableNaturalLanguage: config.enableNaturalLanguage !== false,
            maxCacheAge: config.maxCacheAge || 300000, // 5 minutes
            ...config
        };
        
        // Core vault understanding
        this.vaultStructure = null;
        this.categoryMap = new Map();
        this.fileDatabase = new Map();
        this.relationshipGraph = null;
        
        // Query capabilities
        this.queryCache = new Map();
        this.activeScans = new Set();
        
        // Integration with existing CAL systems
        this.calConnections = new Map();
        
        // Statistics
        this.stats = {
            totalFiles: 0,
            categoriesLoaded: 0,
            relationshipsLoaded: 0,
            queriesProcessed: 0,
            packagesCreated: 0,
            lastScanTime: null
        };
        
        console.log('🤖 CAL Vault Reader initialized');
        console.log(`📁 Vault path: ${this.config.vaultPath}`);
    }
    
    /**
     * Initialize CAL vault reader - loads vault structure and indexes
     */
    async initialize() {
        console.log('🔄 Initializing CAL Vault Reader...');
        
        try {
            // Load vault structure
            await this.loadVaultStructure();
            
            // Load category mappings
            await this.loadCategoryMappings();
            
            // Load relationship graph
            await this.loadRelationshipGraph();
            
            // Load file database
            await this.loadFileDatabase();
            
            // Setup real-time monitoring if enabled
            if (this.config.enableRealtime) {
                await this.setupRealtimeMonitoring();
            }
            
            console.log('✅ CAL Vault Reader ready!');
            console.log(`📊 Loaded ${this.stats.totalFiles} files across ${this.stats.categoriesLoaded} categories`);
            
            this.emit('ready', this.stats);
            return this;
            
        } catch (error) {
            console.error('❌ Failed to initialize CAL Vault Reader:', error);
            throw error;
        }
    }
    
    /**
     * Load vault structure and master index
     */
    async loadVaultStructure() {
        console.log('📁 Loading vault structure...');
        
        // Load master index
        const masterIndexPath = path.join(this.config.indexPath, 'Master-Index.md');
        const masterIndex = await fs.readFile(masterIndexPath, 'utf-8');
        
        // Parse categories from master index
        const categoryMatches = masterIndex.match(/- \[\[(.*?)\]\] \((\d+) files\) - (.+)/g) || [];
        
        this.vaultStructure = {
            totalFiles: 0,
            categories: new Map(),
            lastUpdated: new Date()
        };
        
        for (const match of categoryMatches) {
            const [, categoryPath, fileCount, description] = match.match(/- \[\[(.*?)\]\] \((\d+) files\) - (.+)/);
            const categoryName = categoryPath.split('/')[0];
            
            this.vaultStructure.categories.set(categoryName, {
                name: categoryName,
                fileCount: parseInt(fileCount),
                description: description.trim(),
                path: path.join(this.config.vaultPath, categoryName)
            });
            
            this.vaultStructure.totalFiles += parseInt(fileCount);
        }
        
        this.stats.totalFiles = this.vaultStructure.totalFiles;
        this.stats.categoriesLoaded = this.vaultStructure.categories.size;
        
        console.log(`✅ Loaded vault structure: ${this.stats.totalFiles} files in ${this.stats.categoriesLoaded} categories`);
    }
    
    /**
     * Load category mappings and file organization
     */
    async loadCategoryMappings() {
        console.log('🗂️  Loading category mappings...');
        
        for (const [categoryName, categoryInfo] of this.vaultStructure.categories) {
            try {
                // Load category index
                const indexPath = path.join(this.config.indexPath, `${categoryName}-Index.md`);
                
                if (await this.fileExists(indexPath)) {
                    const indexContent = await fs.readFile(indexPath, 'utf-8');
                    const files = this.parseFileListFromIndex(indexContent);
                    
                    this.categoryMap.set(categoryName, {
                        ...categoryInfo,
                        files: files,
                        loadedAt: new Date()
                    });
                }
            } catch (error) {
                console.warn(`⚠️  Could not load category ${categoryName}:`, error.message);
            }
        }
        
        console.log(`✅ Loaded ${this.categoryMap.size} category mappings`);
    }
    
    /**
     * Load relationship graph data
     */
    async loadRelationshipGraph() {
        console.log('🕸️  Loading relationship graph...');
        
        try {
            const graphPath = path.join(this.config.indexPath, 'graph-data.json');
            const graphData = JSON.parse(await fs.readFile(graphPath, 'utf-8'));
            
            this.relationshipGraph = {
                nodes: new Map(graphData.nodes.map(node => [node.id, node])),
                edges: graphData.edges,
                loadedAt: new Date()
            };
            
            this.stats.relationshipsLoaded = graphData.edges.length;
            
            console.log(`✅ Loaded relationship graph: ${graphData.nodes.length} nodes, ${graphData.edges.length} edges`);
        } catch (error) {
            console.warn('⚠️  Could not load relationship graph:', error.message);
            this.relationshipGraph = { nodes: new Map(), edges: [], loadedAt: new Date() };
        }
    }
    
    /**
     * Load complete file database with metadata
     */
    async loadFileDatabase() {
        console.log('📄 Building file database...');
        
        let totalFiles = 0;
        
        for (const [categoryName, categoryData] of this.categoryMap) {
            if (categoryData.files) {
                for (const fileInfo of categoryData.files) {
                    const fileId = this.generateFileId(categoryName, fileInfo.name);
                    
                    this.fileDatabase.set(fileId, {
                        id: fileId,
                        name: fileInfo.name,
                        category: categoryName,
                        size: fileInfo.size || 0,
                        type: this.getFileType(fileInfo.name),
                        connections: fileInfo.connections || 0,
                        path: path.join(this.config.vaultPath, categoryName, fileInfo.name),
                        metadata: {
                            ...fileInfo,
                            indexed: new Date()
                        }
                    });
                    
                    totalFiles++;
                }
            }
        }
        
        console.log(`✅ Built file database: ${totalFiles} files indexed`);
    }
    
    /**
     * Natural language query interface for CAL
     */
    async query(naturalLanguageQuery, options = {}) {
        console.log(`🤖 CAL Query: "${naturalLanguageQuery}"`);
        this.stats.queriesProcessed++;
        
        const queryId = this.generateQueryId(naturalLanguageQuery);
        
        // Check cache first
        if (!options.ignoreCache && this.queryCache.has(queryId)) {
            const cached = this.queryCache.get(queryId);
            if (Date.now() - cached.timestamp < this.config.maxCacheAge) {
                console.log('💨 Returning cached result');
                return cached.result;
            }
        }
        
        try {
            // Parse natural language query
            const parsedQuery = this.parseNaturalLanguageQuery(naturalLanguageQuery);
            
            // Execute query
            const result = await this.executeQuery(parsedQuery);
            
            // Cache result
            this.queryCache.set(queryId, {
                result,
                timestamp: Date.now(),
                query: naturalLanguageQuery
            });
            
            console.log(`✅ Query completed: found ${result.files?.length || 0} files`);
            
            this.emit('query', { query: naturalLanguageQuery, result, queryId });
            
            return result;
            
        } catch (error) {
            console.error('❌ Query failed:', error);
            throw error;
        }
    }
    
    /**
     * Parse natural language queries into structured queries
     */
    parseNaturalLanguageQuery(query) {
        const lowerQuery = query.toLowerCase();
        
        // Intent detection
        let intent = 'search';
        if (lowerQuery.includes('build') || lowerQuery.includes('create') || lowerQuery.includes('generate')) {
            intent = 'build';
        } else if (lowerQuery.includes('connect') || lowerQuery.includes('integrate')) {
            intent = 'integrate';
        } else if (lowerQuery.includes('deploy') || lowerQuery.includes('package')) {
            intent = 'package';
        }
        
        // Entity extraction
        const entities = {
            categories: [],
            technologies: [],
            fileTypes: [],
            concepts: []
        };
        
        // Category matching
        for (const [categoryName] of this.categoryMap) {
            const categoryKeywords = categoryName.toLowerCase().replace(/\d+-/, '').replace(/-/g, ' ');
            if (lowerQuery.includes(categoryKeywords)) {
                entities.categories.push(categoryName);
            }
        }
        
        // Technology detection
        const techPatterns = {
            'api': /api|endpoint|rest|graphql/i,
            'database': /database|db|sql|mongo|postgres/i,
            'auth': /auth|login|security|permission/i,
            'ui': /ui|interface|dashboard|frontend/i,
            'game': /game|gaming|character|player/i,
            'ai': /ai|llm|gpt|claude|anthropic/i,
            'blockchain': /blockchain|crypto|wallet|token/i
        };
        
        for (const [tech, pattern] of Object.entries(techPatterns)) {
            if (pattern.test(lowerQuery)) {
                entities.technologies.push(tech);
            }
        }
        
        return {
            intent,
            entities,
            originalQuery: query,
            confidence: this.calculateQueryConfidence(entities)
        };
    }
    
    /**
     * Execute structured query against vault
     */
    async executeQuery(parsedQuery) {
        const results = {
            intent: parsedQuery.intent,
            files: [],
            categories: [],
            suggestions: [],
            confidence: parsedQuery.confidence
        };
        
        // If specific categories mentioned, search there first
        if (parsedQuery.entities.categories.length > 0) {
            for (const categoryName of parsedQuery.entities.categories) {
                const categoryData = this.categoryMap.get(categoryName);
                if (categoryData) {
                    results.categories.push(categoryName);
                    results.files.push(...(categoryData.files || []));
                }
            }
        }
        
        // Technology-based search
        if (parsedQuery.entities.technologies.length > 0) {
            const techFiles = await this.searchByTechnology(parsedQuery.entities.technologies);
            results.files.push(...techFiles);
        }
        
        // If no specific matches, do broad search
        if (results.files.length === 0) {
            const broadResults = await this.broadSearch(parsedQuery.originalQuery);
            results.files.push(...broadResults);
        }
        
        // Remove duplicates and add metadata
        results.files = this.deduplicateAndEnrichFiles(results.files);
        
        // Generate suggestions for next actions
        results.suggestions = this.generateSuggestions(parsedQuery, results);
        
        return results;
    }
    
    /**
     * Search files by technology patterns
     */
    async searchByTechnology(technologies) {
        const files = [];
        
        for (const tech of technologies) {
            for (const [fileId, fileData] of this.fileDatabase) {
                const fileName = fileData.name.toLowerCase();
                const category = fileData.category.toLowerCase();
                
                if (this.matchesTechnology(fileName, category, tech)) {
                    files.push({
                        ...fileData,
                        matchReason: `Technology: ${tech}`
                    });
                }
            }
        }
        
        return files;
    }
    
    /**
     * Check if file/category matches technology
     */
    matchesTechnology(fileName, category, tech) {
        const techPatterns = {
            'api': /api|endpoint|rest|server|service/,
            'database': /db|database|sql|mongo|postgres|sqlite/,
            'auth': /auth|login|security|permission|oauth/,
            'ui': /ui|dashboard|interface|frontend|html|css/,
            'game': /game|gaming|character|player|npc/,
            'ai': /ai|llm|gpt|claude|anthropic|reasoning/,
            'blockchain': /blockchain|crypto|wallet|token|chain/
        };
        
        const pattern = techPatterns[tech];
        return pattern && (pattern.test(fileName) || pattern.test(category));
    }
    
    /**
     * Broad search when no specific matches found
     */
    async broadSearch(query) {
        const files = [];
        const queryWords = query.toLowerCase().split(/\s+/);
        
        for (const [fileId, fileData] of this.fileDatabase) {
            let score = 0;
            const fileName = fileData.name.toLowerCase();
            
            for (const word of queryWords) {
                if (fileName.includes(word)) {
                    score += 1;
                }
            }
            
            if (score > 0) {
                files.push({
                    ...fileData,
                    matchScore: score,
                    matchReason: 'Keyword match'
                });
            }
        }
        
        return files.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)).slice(0, 50);
    }
    
    /**
     * Remove duplicate files and add enriched metadata
     */
    deduplicateAndEnrichFiles(files) {
        const seen = new Set();
        const unique = [];
        
        for (const file of files) {
            const key = file.id || file.name;
            if (!seen.has(key)) {
                seen.add(key);
                
                // Add relationship data if available
                if (this.relationshipGraph && file.hash) {
                    const node = this.relationshipGraph.nodes.get(file.hash);
                    if (node) {
                        file.connections = node.connections || 0;
                        file.graphSize = node.size || 0;
                    }
                }
                
                unique.push(file);
            }
        }
        
        return unique;
    }
    
    /**
     * Generate suggestions for next actions
     */
    generateSuggestions(parsedQuery, results) {
        const suggestions = [];
        
        if (parsedQuery.intent === 'build' && results.files.length > 0) {
            suggestions.push({
                type: 'package',
                description: `Create a deployable package from ${results.files.length} related files`,
                action: 'package',
                files: results.files.slice(0, 10) // Top 10 files
            });
        }
        
        if (results.categories.length > 0) {
            suggestions.push({
                type: 'explore',
                description: `Explore related files in ${results.categories.join(', ')} categories`,
                action: 'explore',
                categories: results.categories
            });
        }
        
        if (results.files.length > 10) {
            suggestions.push({
                type: 'filter',
                description: 'Narrow down results with more specific criteria',
                action: 'refine',
                currentCount: results.files.length
            });
        }
        
        return suggestions;
    }
    
    /**
     * Get components that can be packaged together
     */
    async getPackageableComponents(query) {
        const results = await this.query(query);
        
        if (results.files.length === 0) {
            return { success: false, message: 'No components found for packaging' };
        }
        
        // Group files by potential packages
        const packages = this.groupFilesForPackaging(results.files);
        
        return {
            success: true,
            packages,
            totalFiles: results.files.length,
            suggestions: results.suggestions
        };
    }
    
    /**
     * Group files into logical packages
     */
    groupFilesForPackaging(files) {
        const packages = new Map();
        
        for (const file of files) {
            let packageKey = 'miscellaneous';
            
            // Group by technology/purpose
            if (file.name.toLowerCase().includes('api')) {
                packageKey = 'api-services';
            } else if (file.name.toLowerCase().includes('auth')) {
                packageKey = 'authentication';
            } else if (file.name.toLowerCase().includes('dashboard') || file.name.includes('.html')) {
                packageKey = 'frontend-ui';
            } else if (file.name.toLowerCase().includes('database') || file.name.toLowerCase().includes('db')) {
                packageKey = 'database';
            } else if (file.category) {
                packageKey = file.category.toLowerCase().replace(/^\d+-/, '');
            }
            
            if (!packages.has(packageKey)) {
                packages.set(packageKey, {
                    name: packageKey,
                    files: [],
                    totalSize: 0,
                    description: this.getPackageDescription(packageKey)
                });
            }
            
            const pkg = packages.get(packageKey);
            pkg.files.push(file);
            pkg.totalSize += file.size || 0;
        }
        
        return Array.from(packages.values());
    }
    
    /**
     * Get description for package type
     */
    getPackageDescription(packageKey) {
        const descriptions = {
            'api-services': 'REST APIs and service endpoints',
            'authentication': 'Authentication and authorization systems',
            'frontend-ui': 'User interfaces and dashboards',
            'database': 'Database schemas and data access layers',
            'core-systems': 'Core system functionality',
            'generators': 'Code and content generators',
            'integrations': 'External service integrations'
        };
        
        return descriptions[packageKey] || `${packageKey.replace(/-/g, ' ')} components`;
    }
    
    /**
     * Setup real-time monitoring of vault changes
     */
    async setupRealtimeMonitoring() {
        // This would watch for file changes and update indexes
        console.log('👁️  Real-time monitoring enabled (placeholder)');
        // Implementation depends on filesystem watching
    }
    
    /**
     * Utility functions
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    parseFileListFromIndex(indexContent) {
        const files = [];
        const fileMatches = indexContent.match(/- \[\[(.*?)\]\].*?(\d+(?:\.\d+)?KB)?(?: → (\d+) links)?(?: ← (\d+) backlinks)?/g) || [];
        
        for (const match of fileMatches) {
            const [, name, size, links, backlinks] = match.match(/- \[\[(.*?)\]\].*?(\d+(?:\.\d+)?KB)?(?: → (\d+) links)?(?: ← (\d+) backlinks)?/) || [];
            
            files.push({
                name,
                size: size ? parseFloat(size) * 1024 : 0,
                links: parseInt(links) || 0,
                backlinks: parseInt(backlinks) || 0,
                connections: (parseInt(links) || 0) + (parseInt(backlinks) || 0)
            });
        }
        
        return files;
    }
    
    getFileType(fileName) {
        const ext = path.extname(fileName).toLowerCase();
        const typeMap = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.md': 'markdown',
            '.html': 'html',
            '.css': 'css',
            '.json': 'json',
            '.sql': 'sql',
            '.py': 'python',
            '.php': 'php'
        };
        
        return typeMap[ext] || 'unknown';
    }
    
    generateFileId(category, fileName) {
        return `${category}/${fileName}`;
    }
    
    generateQueryId(query) {
        return require('crypto').createHash('md5').update(query).digest('hex').substring(0, 8);
    }
    
    calculateQueryConfidence(entities) {
        let score = 0;
        score += entities.categories.length * 0.3;
        score += entities.technologies.length * 0.4;
        score += entities.fileTypes.length * 0.2;
        score += entities.concepts.length * 0.1;
        
        return Math.min(score, 1.0);
    }
    
    /**
     * Get current statistics
     */
    getStats() {
        return {
            ...this.stats,
            cacheSize: this.queryCache.size,
            categoriesLoaded: this.categoryMap.size,
            filesIndexed: this.fileDatabase.size
        };
    }
}

// CLI interface
if (require.main === module) {
    const reader = new CalVaultReader();
    
    reader.initialize()
        .then(async () => {
            const args = process.argv.slice(2);
            
            if (args.length === 0) {
                console.log(`
🤖 CAL Vault Reader

Usage: node cal-vault-reader.js [query]

Examples:
  node cal-vault-reader.js "build an authentication system"
  node cal-vault-reader.js "find all API endpoints"
  node cal-vault-reader.js "create a dashboard package"
  node cal-vault-reader.js "show me gaming components"

Statistics:
  Total files: ${reader.stats.totalFiles}
  Categories: ${reader.stats.categoriesLoaded}
  Relationships: ${reader.stats.relationshipsLoaded}
                `);
                return;
            }
            
            const query = args.join(' ');
            const result = await reader.query(query);
            
            console.log('\n🔍 Query Results:');
            console.log(`Intent: ${result.intent}`);
            console.log(`Found: ${result.files.length} files`);
            
            if (result.files.length > 0) {
                console.log('\n📁 Top Files:');
                result.files.slice(0, 10).forEach((file, i) => {
                    console.log(`${i + 1}. ${file.name} (${file.category}) ${file.matchReason ? '- ' + file.matchReason : ''}`);
                });
            }
            
            if (result.suggestions.length > 0) {
                console.log('\n💡 Suggestions:');
                result.suggestions.forEach((suggestion, i) => {
                    console.log(`${i + 1}. ${suggestion.description}`);
                });
            }
        })
        .catch(console.error);
}

module.exports = CalVaultReader;