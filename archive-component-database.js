/**
 * 📦🔍 ARCHIVE COMPONENT DATABASE WITH VISUAL METADATA
 * USA 250th Anniversary Enhanced Component Management System
 * 
 * Manages 5299+ components with visual metadata, search, and spawning integration
 * Supports patriotic themes, billing tiers, and real-time component discovery
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');
const sqlite3 = require('sqlite3').verbose();

class ArchiveComponentDatabase extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Database configuration
            databasePath: './data/components/archive.db',
            backupPath: './data/components/backups',
            
            // Archive data sources
            archiveDataPath: './wayback-summary.json',
            componentsBasePath: '/Users/matthewmauer/Desktop/Document-Generator',
            
            // Visual metadata configuration
            generateThumbnails: true,
            thumbnailSize: { width: 300, height: 200 },
            extractColorSchemes: true,
            analyzeLayoutStructure: true,
            
            // Patriotic enhancement
            patrioticAnalysis: true,
            anniversaryBonusCalculation: true,
            freedomLevelAssignment: true,
            
            // Performance settings
            batchSize: 100,
            enableIndexing: true,
            enableFullTextSearch: true,
            cacheMetadata: true,
            
            // Integration settings
            enableWebSocket: true,
            enableAPIEndpoints: true,
            enableRealTimeUpdates: true,
            
            ...config
        };
        
        // Database state
        this.dbState = {
            connection: null,
            isInitialized: false,
            totalComponents: 0,
            indexedComponents: 0,
            lastSyncTime: null,
            
            // Caches
            componentCache: new Map(),
            searchCache: new Map(),
            visualMetadataCache: new Map(),
            
            // Statistics
            stats: {
                totalQueries: 0,
                averageQueryTime: 0,
                cacheHitRate: 0,
                indexingProgress: 0
            }
        };
        
        console.log('📦 Archive Component Database initializing...');
        this.initialize();
    }
    
    /**
     * Initialize the database system
     */
    async initialize() {
        try {
            // Setup database directories
            await this.setupDirectories();
            
            // Initialize SQLite database
            await this.initializeDatabase();
            
            // Create database schema
            await this.createSchema();
            
            // Load and process archive data
            await this.loadArchiveData();
            
            // Build indexes and metadata
            await this.buildIndexes();
            
            // Setup real-time features
            if (this.config.enableWebSocket) {
                await this.setupRealTimeFeatures();
            }
            
            // Setup API endpoints
            if (this.config.enableAPIEndpoints) {
                await this.setupAPIEndpoints();
            }
            
            this.dbState.isInitialized = true;
            this.dbState.lastSyncTime = Date.now();
            
            console.log('✅ Archive Component Database ready');
            console.log(`📊 Indexed ${this.dbState.indexedComponents} components`);
            console.log(`🎨 Visual metadata: ${this.config.generateThumbnails ? 'Enabled' : 'Disabled'}`);
            console.log(`🇺🇸 Patriotic analysis: ${this.config.patrioticAnalysis ? 'Enabled' : 'Disabled'}`);
            
            this.emit('database_ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Archive Component Database:', error);
            throw error;
        }
    }
    
    /**
     * Setup required directories
     */
    async setupDirectories() {
        const dirs = [
            path.dirname(this.config.databasePath),
            this.config.backupPath,
            './data/components/thumbnails',
            './data/components/metadata',
            './data/components/exports'
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        console.log('📁 Database directories ready');
    }
    
    /**
     * Initialize SQLite database connection
     */
    async initializeDatabase() {
        return new Promise((resolve, reject) => {
            this.dbState.connection = new sqlite3.Database(this.config.databasePath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('💾 SQLite database connected');
                    resolve();
                }
            });
        });
    }
    
    /**
     * Create database schema
     */
    async createSchema() {
        const schemas = [
            // Main components table
            `CREATE TABLE IF NOT EXISTS components (
                id TEXT PRIMARY KEY,
                path TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                size INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_accessed DATETIME,
                access_count INTEGER DEFAULT 0,
                
                -- Categorization
                purposes TEXT, -- JSON array
                patterns TEXT, -- JSON array
                categories TEXT, -- JSON array
                tags TEXT, -- JSON array
                
                -- Billing and access
                tier TEXT DEFAULT 'free',
                billing_tier TEXT DEFAULT 'free',
                access_level INTEGER DEFAULT 1,
                
                -- Patriotic metadata
                patriotic_value INTEGER DEFAULT 0,
                freedom_level INTEGER DEFAULT 0,
                anniversary_bonus BOOLEAN DEFAULT FALSE,
                historical_significance TEXT,
                
                -- Status and quality
                status TEXT DEFAULT 'active',
                quality_score REAL DEFAULT 0.0,
                completeness REAL DEFAULT 0.0,
                documentation_score REAL DEFAULT 0.0,
                
                -- Metadata
                metadata TEXT, -- JSON object
                description TEXT,
                readme_content TEXT,
                license TEXT,
                dependencies TEXT -- JSON array
            )`,
            
            // Visual metadata table
            `CREATE TABLE IF NOT EXISTS visual_metadata (
                component_id TEXT PRIMARY KEY,
                
                -- Visual analysis
                color_scheme TEXT,
                primary_colors TEXT, -- JSON array of hex colors
                secondary_colors TEXT, -- JSON array
                background_color TEXT,
                text_color TEXT,
                
                -- Layout analysis
                layout_type TEXT, -- grid, flex, absolute, etc.
                layout_structure TEXT, -- JSON describing structure
                responsive BOOLEAN DEFAULT FALSE,
                viewport_sizes TEXT, -- JSON array
                
                -- Thumbnails and previews
                thumbnail_path TEXT,
                preview_path TEXT,
                screenshot_path TEXT,
                generated_thumbnail BOOLEAN DEFAULT FALSE,
                
                -- UI/UX metrics
                complexity_score REAL DEFAULT 0.0,
                accessibility_score REAL DEFAULT 0.0,
                mobile_friendly BOOLEAN DEFAULT FALSE,
                performance_score REAL DEFAULT 0.0,
                
                -- Theme compatibility
                theme_compatibility TEXT, -- JSON object
                color_scheme_variants TEXT, -- JSON array
                css_framework TEXT,
                
                -- Animation and effects
                has_animations BOOLEAN DEFAULT FALSE,
                animation_types TEXT, -- JSON array
                has_interactions BOOLEAN DEFAULT FALSE,
                interaction_types TEXT, -- JSON array
                
                -- Generated metadata
                generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                analysis_version TEXT DEFAULT '1.0',
                
                FOREIGN KEY (component_id) REFERENCES components (id) ON DELETE CASCADE
            )`,
            
            // Search index table
            `CREATE TABLE IF NOT EXISTS search_index (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                component_id TEXT NOT NULL,
                search_text TEXT NOT NULL,
                search_type TEXT NOT NULL, -- name, description, content, tags
                relevance_score REAL DEFAULT 1.0,
                
                FOREIGN KEY (component_id) REFERENCES components (id) ON DELETE CASCADE
            )`,
            
            // Usage statistics table
            `CREATE TABLE IF NOT EXISTS usage_statistics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                component_id TEXT NOT NULL,
                event_type TEXT NOT NULL, -- view, spawn, download, etc.
                user_id TEXT,
                session_id TEXT,
                tier TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                metadata TEXT, -- JSON object
                
                FOREIGN KEY (component_id) REFERENCES components (id) ON DELETE CASCADE
            )`,
            
            // Patriotic achievements table
            `CREATE TABLE IF NOT EXISTS patriotic_achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                component_id TEXT NOT NULL,
                achievement_type TEXT NOT NULL,
                achievement_name TEXT NOT NULL,
                achievement_description TEXT,
                patriotic_value INTEGER DEFAULT 0,
                historical_date TEXT,
                milestone_year INTEGER,
                granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (component_id) REFERENCES components (id) ON DELETE CASCADE
            )`,
            
            // Component relationships table
            `CREATE TABLE IF NOT EXISTS component_relationships (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                parent_id TEXT NOT NULL,
                child_id TEXT NOT NULL,
                relationship_type TEXT NOT NULL, -- depends_on, extends, includes, similar_to
                strength REAL DEFAULT 1.0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                FOREIGN KEY (parent_id) REFERENCES components (id) ON DELETE CASCADE,
                FOREIGN KEY (child_id) REFERENCES components (id) ON DELETE CASCADE,
                UNIQUE(parent_id, child_id, relationship_type)
            )`,
            
            // Billing integration table
            `CREATE TABLE IF NOT EXISTS billing_integration (
                component_id TEXT PRIMARY KEY,
                stripe_product_id TEXT,
                stripe_price_id TEXT,
                base_price REAL DEFAULT 0.0,
                tier_pricing TEXT, -- JSON object {free: 0, premium: 5, enterprise: 10}
                patriotic_multiplier REAL DEFAULT 1.0,
                anniversary_discount REAL DEFAULT 0.0,
                revenue_generated REAL DEFAULT 0.0,
                subscription_count INTEGER DEFAULT 0,
                
                FOREIGN KEY (component_id) REFERENCES components (id) ON DELETE CASCADE
            )`
        ];
        
        for (const schema of schemas) {
            await this.runQuery(schema);
        }
        
        // Create indexes for performance
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_components_type ON components(type)',
            'CREATE INDEX IF NOT EXISTS idx_components_tier ON components(tier)',
            'CREATE INDEX IF NOT EXISTS idx_components_patriotic ON components(patriotic_value)',
            'CREATE INDEX IF NOT EXISTS idx_components_status ON components(status)',
            'CREATE INDEX IF NOT EXISTS idx_visual_color_scheme ON visual_metadata(color_scheme)',
            'CREATE INDEX IF NOT EXISTS idx_search_text ON search_index(search_text)',
            'CREATE INDEX IF NOT EXISTS idx_search_component ON search_index(component_id)',
            'CREATE INDEX IF NOT EXISTS idx_usage_component ON usage_statistics(component_id)',
            'CREATE INDEX IF NOT EXISTS idx_usage_timestamp ON usage_statistics(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_relationships_parent ON component_relationships(parent_id)',
            'CREATE INDEX IF NOT EXISTS idx_relationships_child ON component_relationships(child_id)'
        ];
        
        for (const index of indexes) {
            await this.runQuery(index);
        }
        
        console.log('🗄️ Database schema created');
    }
    
    /**
     * Load and process archive data
     */
    async loadArchiveData() {
        try {
            console.log('📥 Loading archive data...');
            
            // Load wayback summary
            const archiveData = await fs.readFile(this.config.archiveDataPath, 'utf-8');
            const archive = JSON.parse(archiveData);
            
            this.dbState.totalComponents = archive.totalFiles || 0;
            
            // Process unified files
            if (archive.unifiedFiles) {
                await this.processUnifiedFiles(archive.unifiedFiles);
            }
            
            // Process specialized categories
            const categories = ['launchers', 'gamingSystems', 'aiSystems', 'blockchainSystems'];
            for (const category of categories) {
                if (archive[category]) {
                    await this.processSpecializedComponents(archive[category], category);
                }
            }
            
            console.log(`📦 Processed ${this.dbState.indexedComponents} components`);
            
        } catch (error) {
            console.error('❌ Failed to load archive data:', error);
            throw error;
        }
    }
    
    /**
     * Process unified files from archive
     */
    async processUnifiedFiles(unifiedFiles) {
        console.log('🔄 Processing unified files...');
        
        const batch = [];
        
        for (const component of unifiedFiles) {
            const componentData = await this.analyzeComponent(component);
            batch.push(componentData);
            
            // Process in batches for performance
            if (batch.length >= this.config.batchSize) {
                await this.insertComponentBatch(batch);
                batch.length = 0; // Clear batch
            }
        }
        
        // Process remaining batch
        if (batch.length > 0) {
            await this.insertComponentBatch(batch);
        }
    }
    
    /**
     * Analyze a single component
     */
    async analyzeComponent(rawComponent) {
        const componentId = this.generateComponentId(rawComponent.path);
        
        // Basic component analysis
        const component = {
            id: componentId,
            path: rawComponent.path,
            name: this.extractComponentName(rawComponent.path),
            type: this.determineComponentType(rawComponent),
            size: rawComponent.size || 0,
            purposes: JSON.stringify(rawComponent.purposes || []),
            patterns: JSON.stringify(rawComponent.patterns || []),
            categories: JSON.stringify([]),
            tags: JSON.stringify(this.generateTags(rawComponent)),
            tier: this.determineComponentTier(rawComponent),
            billing_tier: this.determineBillingTier(rawComponent),
            access_level: this.calculateAccessLevel(rawComponent),
            status: 'active',
            quality_score: this.calculateQualityScore(rawComponent),
            completeness: this.calculateCompleteness(rawComponent),
            metadata: JSON.stringify(this.extractMetadata(rawComponent))
        };
        
        // Patriotic analysis
        if (this.config.patrioticAnalysis) {
            const patrioticData = this.analyzePatrioticValue(rawComponent);
            component.patriotic_value = patrioticData.value;
            component.freedom_level = patrioticData.freedomLevel;
            component.anniversary_bonus = patrioticData.anniversaryBonus;
            component.historical_significance = patrioticData.historicalSignificance;
        }
        
        // Visual metadata analysis
        const visualMetadata = await this.analyzeVisualMetadata(rawComponent);
        
        return {
            component,
            visualMetadata,
            searchTerms: this.generateSearchTerms(component, rawComponent)
        };
    }
    
    /**
     * Analyze visual metadata for a component
     */
    async analyzeVisualMetadata(rawComponent) {
        const visualData = {
            component_id: this.generateComponentId(rawComponent.path),
            color_scheme: this.detectColorScheme(rawComponent),
            layout_type: this.detectLayoutType(rawComponent),
            responsive: this.detectResponsive(rawComponent),
            complexity_score: this.calculateComplexityScore(rawComponent),
            accessibility_score: this.calculateAccessibilityScore(rawComponent),
            mobile_friendly: this.detectMobileFriendly(rawComponent),
            performance_score: this.calculatePerformanceScore(rawComponent),
            theme_compatibility: JSON.stringify(this.analyzeThemeCompatibility(rawComponent)),
            has_animations: this.detectAnimations(rawComponent),
            has_interactions: this.detectInteractions(rawComponent),
            analysis_version: '1.0'
        };
        
        // Generate thumbnail if enabled
        if (this.config.generateThumbnails) {
            visualData.thumbnail_path = await this.generateThumbnail(rawComponent);
            visualData.generated_thumbnail = true;
        }
        
        // Extract color palette
        const colors = this.extractColorPalette(rawComponent);
        visualData.primary_colors = JSON.stringify(colors.primary);
        visualData.secondary_colors = JSON.stringify(colors.secondary);
        visualData.background_color = colors.background;
        visualData.text_color = colors.text;
        
        return visualData;
    }
    
    /**
     * Insert batch of components into database
     */
    async insertComponentBatch(batch) {
        const componentInserts = [];
        const visualInserts = [];
        const searchInserts = [];
        
        for (const item of batch) {
            componentInserts.push(item.component);
            visualInserts.push(item.visualMetadata);
            
            // Add search terms
            for (const term of item.searchTerms) {
                searchInserts.push({
                    component_id: item.component.id,
                    search_text: term.text,
                    search_type: term.type,
                    relevance_score: term.relevance
                });
            }
        }
        
        // Insert components
        await this.insertComponents(componentInserts);
        
        // Insert visual metadata
        await this.insertVisualMetadata(visualInserts);
        
        // Insert search terms
        await this.insertSearchTerms(searchInserts);
        
        this.dbState.indexedComponents += batch.length;
        
        // Emit progress update
        this.emit('indexing_progress', {
            completed: this.dbState.indexedComponents,
            total: this.dbState.totalComponents,
            percentage: (this.dbState.indexedComponents / this.dbState.totalComponents) * 100
        });
    }
    
    /**
     * Search components with visual and metadata filters
     */
    async searchComponents(query = {}) {
        const startTime = Date.now();
        
        try {
            // Build search query
            const sqlQuery = this.buildSearchQuery(query);
            
            // Execute search
            const results = await this.runQuery(sqlQuery.sql, sqlQuery.params);
            
            // Enhance results with visual metadata
            const enhancedResults = await this.enhanceSearchResults(results);
            
            // Update statistics
            const queryTime = Date.now() - startTime;
            this.updateSearchStatistics(queryTime);
            
            return {
                results: enhancedResults,
                total: enhancedResults.length,
                queryTime,
                query: query
            };
            
        } catch (error) {
            console.error('❌ Search failed:', error);
            throw error;
        }
    }
    
    /**
     * Build SQL search query from filters
     */
    buildSearchQuery(query) {
        let sql = `
            SELECT DISTINCT c.*, vm.color_scheme, vm.primary_colors, vm.thumbnail_path
            FROM components c
            LEFT JOIN visual_metadata vm ON c.id = vm.component_id
            WHERE c.status = 'active'
        `;
        
        const params = [];
        const conditions = [];
        
        // Text search
        if (query.text) {
            conditions.push(`c.id IN (
                SELECT si.component_id FROM search_index si 
                WHERE si.search_text LIKE ? 
                ORDER BY si.relevance_score DESC
            )`);
            params.push(`%${query.text}%`);
        }
        
        // Type filter
        if (query.type) {
            conditions.push('c.type = ?');
            params.push(query.type);
        }
        
        // Tier filter
        if (query.tier) {
            conditions.push('c.tier = ?');
            params.push(query.tier);
        }
        
        // Billing tier filter
        if (query.billingTier) {
            conditions.push('c.billing_tier = ?');
            params.push(query.billingTier);
        }
        
        // Color scheme filter
        if (query.colorScheme) {
            conditions.push('vm.color_scheme = ?');
            params.push(query.colorScheme);
        }
        
        // Patriotic filter
        if (query.patriotic) {
            conditions.push('c.patriotic_value > ?');
            params.push(query.patriotic === true ? 0 : query.patriotic);
        }
        
        // Purpose filter
        if (query.purposes && Array.isArray(query.purposes)) {
            const purposeConditions = query.purposes.map(() => 'c.purposes LIKE ?');
            conditions.push(`(${purposeConditions.join(' OR ')})`);
            query.purposes.forEach(purpose => {
                params.push(`%"${purpose}"%`);
            });
        }
        
        // Size filter
        if (query.minSize !== undefined) {
            conditions.push('c.size >= ?');
            params.push(query.minSize);
        }
        
        if (query.maxSize !== undefined) {
            conditions.push('c.size <= ?');
            params.push(query.maxSize);
        }
        
        // Quality filter
        if (query.minQuality !== undefined) {
            conditions.push('c.quality_score >= ?');
            params.push(query.minQuality);
        }
        
        // Add conditions to SQL
        if (conditions.length > 0) {
            sql += ' AND ' + conditions.join(' AND ');
        }
        
        // Add sorting
        if (query.sortBy) {
            switch (query.sortBy) {
                case 'name':
                    sql += ' ORDER BY c.name';
                    break;
                case 'size':
                    sql += ' ORDER BY c.size DESC';
                    break;
                case 'patriotic':
                    sql += ' ORDER BY c.patriotic_value DESC, c.freedom_level DESC';
                    break;
                case 'quality':
                    sql += ' ORDER BY c.quality_score DESC';
                    break;
                case 'recent':
                    sql += ' ORDER BY c.updated_at DESC';
                    break;
                default:
                    sql += ' ORDER BY c.access_count DESC, c.quality_score DESC';
            }
        } else {
            sql += ' ORDER BY c.access_count DESC, c.quality_score DESC';
        }
        
        // Add limit
        if (query.limit) {
            sql += ' LIMIT ?';
            params.push(query.limit);
        }
        
        return { sql, params };
    }
    
    /**
     * Enhance search results with additional metadata
     */
    async enhanceSearchResults(results) {
        return Promise.all(results.map(async (result) => {
            // Parse JSON fields
            result.purposes = JSON.parse(result.purposes || '[]');
            result.patterns = JSON.parse(result.patterns || '[]');
            result.categories = JSON.parse(result.categories || '[]');
            result.tags = JSON.parse(result.tags || '[]');
            result.metadata = JSON.parse(result.metadata || '{}');
            
            // Add billing information
            const billingInfo = await this.getBillingInfo(result.id);
            result.billing = billingInfo;
            
            // Add usage statistics
            const usageStats = await this.getUsageStats(result.id);
            result.usage = usageStats;
            
            // Add patriotic achievements if applicable
            if (result.patriotic_value > 0) {
                const achievements = await this.getPatrioticAchievements(result.id);
                result.patriotic_achievements = achievements;
            }
            
            return result;
        }));
    }
    
    /**
     * Get component by ID with full metadata
     */
    async getComponent(componentId) {
        try {
            // Get basic component data
            const component = await this.runQuery(
                'SELECT * FROM components WHERE id = ?',
                [componentId]
            );
            
            if (!component || component.length === 0) {
                return null;
            }
            
            const result = component[0];
            
            // Get visual metadata
            const visualMetadata = await this.runQuery(
                'SELECT * FROM visual_metadata WHERE component_id = ?',
                [componentId]
            );
            
            // Get relationships
            const relationships = await this.runQuery(`
                SELECT cr.*, c.name as related_name, c.type as related_type
                FROM component_relationships cr
                JOIN components c ON (cr.child_id = c.id OR cr.parent_id = c.id)
                WHERE cr.parent_id = ? OR cr.child_id = ?
            `, [componentId, componentId]);
            
            // Enhance result
            result.purposes = JSON.parse(result.purposes || '[]');
            result.patterns = JSON.parse(result.patterns || '[]');
            result.categories = JSON.parse(result.categories || '[]');
            result.tags = JSON.parse(result.tags || '[]');
            result.metadata = JSON.parse(result.metadata || '{}');
            result.visual_metadata = visualMetadata[0] || null;
            result.relationships = relationships;
            result.billing = await this.getBillingInfo(componentId);
            result.usage = await this.getUsageStats(componentId);
            
            // Update access statistics
            await this.recordComponentAccess(componentId);
            
            return result;
            
        } catch (error) {
            console.error('❌ Failed to get component:', error);
            throw error;
        }
    }
    
    /**
     * Update component metadata
     */
    async updateComponent(componentId, updates) {
        try {
            const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updates);
            values.push(componentId);
            
            await this.runQuery(
                `UPDATE components SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                values
            );
            
            // Clear cache
            this.dbState.componentCache.delete(componentId);
            
            this.emit('component_updated', { componentId, updates });
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to update component:', error);
            throw error;
        }
    }
    
    /**
     * Record component usage for analytics
     */
    async recordComponentUsage(componentId, eventType, userId = null, metadata = {}) {
        try {
            await this.runQuery(`
                INSERT INTO usage_statistics (component_id, event_type, user_id, metadata)
                VALUES (?, ?, ?, ?)
            `, [componentId, eventType, userId, JSON.stringify(metadata)]);
            
            // Update access count
            await this.runQuery(
                'UPDATE components SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = ?',
                [componentId]
            );
            
        } catch (error) {
            console.error('❌ Failed to record usage:', error);
        }
    }
    
    // Component analysis helper methods
    
    generateComponentId(filePath) {
        return crypto.createHash('md5').update(filePath).digest('hex').substring(0, 12);
    }
    
    extractComponentName(filePath) {
        const basename = path.basename(filePath);
        return basename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ');
    }
    
    determineComponentType(component) {
        const purposes = component.purposes || [];
        
        if (purposes.includes('launcher')) return 'launcher';
        if (purposes.includes('gaming')) return 'gaming';
        if (purposes.includes('ai')) return 'ai';
        if (purposes.includes('blockchain')) return 'blockchain';
        if (purposes.includes('api')) return 'api';
        if (purposes.includes('database')) return 'database';
        
        const fileName = component.path.toLowerCase();
        if (fileName.includes('game')) return 'gaming';
        if (fileName.includes('ai') || fileName.includes('ml')) return 'ai';
        if (fileName.includes('blockchain') || fileName.includes('crypto')) return 'blockchain';
        if (fileName.includes('api')) return 'api';
        if (fileName.includes('db') || fileName.includes('database')) return 'database';
        
        return 'utility';
    }
    
    determineComponentTier(component) {
        const size = component.size || 0;
        const purposes = component.purposes || [];
        
        if (purposes.includes('enterprise') || size > 50000) return 'enterprise';
        if (purposes.includes('blockchain') || purposes.includes('ai') || size > 20000) return 'premium';
        return 'free';
    }
    
    determineBillingTier(component) {
        // Map component tier to billing tier
        const tier = this.determineComponentTier(component);
        return tier;
    }
    
    calculateAccessLevel(component) {
        const purposes = component.purposes || [];
        let level = 1;
        
        if (purposes.includes('launcher') || purposes.includes('config')) level = 1;
        else if (purposes.includes('api') || purposes.includes('database')) level = 2;
        else if (purposes.includes('ai') || purposes.includes('blockchain')) level = 3;
        else if (purposes.includes('enterprise')) level = 4;
        
        return level;
    }
    
    calculateQualityScore(component) {
        let score = 0.5; // Base score
        
        const size = component.size || 0;
        const purposes = component.purposes || [];
        const patterns = component.patterns || [];
        
        // Size-based scoring
        if (size > 1000) score += 0.1;
        if (size > 10000) score += 0.1;
        if (size < 100000) score += 0.1; // Not too large
        
        // Purpose diversity
        score += Math.min(purposes.length * 0.05, 0.2);
        
        // Pattern recognition
        score += Math.min(patterns.length * 0.1, 0.2);
        
        // File type bonus
        const fileName = component.path.toLowerCase();
        if (fileName.endsWith('.js') || fileName.endsWith('.ts')) score += 0.1;
        if (fileName.endsWith('.html') || fileName.endsWith('.css')) score += 0.1;
        
        return Math.min(score, 1.0);
    }
    
    calculateCompleteness(component) {
        let completeness = 0.3; // Base completeness
        
        const purposes = component.purposes || [];
        const patterns = component.patterns || [];
        const size = component.size || 0;
        
        // Has purposes defined
        if (purposes.length > 0) completeness += 0.2;
        
        // Has patterns
        if (patterns.length > 0) completeness += 0.1;
        
        // Reasonable size
        if (size > 500) completeness += 0.2;
        
        // File extension suggests completeness
        const fileName = component.path.toLowerCase();
        if (fileName.includes('readme')) completeness += 0.1;
        if (fileName.includes('test')) completeness += 0.1;
        
        return Math.min(completeness, 1.0);
    }
    
    extractMetadata(component) {
        return {
            originalPath: component.path,
            archiveSize: component.size,
            indexedAt: new Date().toISOString(),
            purposes: component.purposes || [],
            patterns: component.patterns || [],
            version: '1.0'
        };
    }
    
    analyzePatrioticValue(component) {
        const fileName = component.path.toLowerCase();
        let value = 0;
        let freedomLevel = 0;
        let anniversaryBonus = false;
        let historicalSignificance = null;
        
        // Direct patriotic keywords
        if (fileName.includes('american') || fileName.includes('usa')) {
            value += 10;
            freedomLevel += 20;
        }
        
        if (fileName.includes('patriotic') || fileName.includes('freedom')) {
            value += 8;
            freedomLevel += 15;
        }
        
        if (fileName.includes('liberty') || fileName.includes('independence')) {
            value += 6;
            freedomLevel += 12;
        }
        
        // Historical references
        if (fileName.includes('1776')) {
            value += 15;
            freedomLevel += 25;
            anniversaryBonus = true;
            historicalSignificance = 'Declaration of Independence - July 4, 1776';
        }
        
        if (fileName.includes('250')) {
            value += 12;
            freedomLevel += 20;
            anniversaryBonus = true;
            historicalSignificance = 'USA 250th Anniversary - 2026';
        }
        
        // Founding fathers
        const foundingFathers = ['washington', 'jefferson', 'franklin', 'adams', 'hamilton'];
        for (const father of foundingFathers) {
            if (fileName.includes(father)) {
                value += 5;
                freedomLevel += 10;
                historicalSignificance = `Reference to Founding Father: ${father}`;
                break;
            }
        }
        
        // Cap values
        value = Math.min(value, 20);
        freedomLevel = Math.min(freedomLevel, 100);
        
        return {
            value,
            freedomLevel,
            anniversaryBonus,
            historicalSignificance
        };
    }
    
    generateTags(component) {
        const tags = new Set();
        
        // Extract from purposes
        if (component.purposes) {
            component.purposes.forEach(purpose => tags.add(purpose));
        }
        
        // Extract from patterns
        if (component.patterns) {
            component.patterns.forEach(pattern => tags.add(pattern));
        }
        
        // Extract from filename
        const fileName = path.basename(component.path).toLowerCase();
        const words = fileName.split(/[^a-z0-9]+/);
        words.forEach(word => {
            if (word.length > 2) tags.add(word);
        });
        
        return Array.from(tags);
    }
    
    generateSearchTerms(component, rawComponent) {
        const terms = [];
        
        // Component name
        terms.push({
            text: component.name,
            type: 'name',
            relevance: 1.0
        });
        
        // Purposes
        const purposes = JSON.parse(component.purposes);
        purposes.forEach(purpose => {
            terms.push({
                text: purpose,
                type: 'purpose',
                relevance: 0.8
            });
        });
        
        // Tags
        const tags = JSON.parse(component.tags);
        tags.forEach(tag => {
            terms.push({
                text: tag,
                type: 'tag',
                relevance: 0.6
            });
        });
        
        // File path segments
        const pathSegments = component.path.split('/');
        pathSegments.forEach(segment => {
            if (segment.length > 2) {
                terms.push({
                    text: segment,
                    type: 'path',
                    relevance: 0.4
                });
            }
        });
        
        return terms;
    }
    
    // Visual analysis methods
    
    detectColorScheme(component) {
        const fileName = component.path.toLowerCase();
        
        if (fileName.includes('patriotic') || fileName.includes('american')) return 'patriotic';
        if (fileName.includes('hacker') || fileName.includes('matrix')) return 'hacker';
        if (fileName.includes('bitcoin') || fileName.includes('crypto')) return 'bitcoin';
        if (fileName.includes('dark') || fileName.includes('black')) return 'dark';
        if (fileName.includes('light') || fileName.includes('white')) return 'light';
        
        return 'default';
    }
    
    detectLayoutType(component) {
        const fileName = component.path.toLowerCase();
        
        if (fileName.includes('grid')) return 'grid';
        if (fileName.includes('flex')) return 'flex';
        if (fileName.includes('absolute')) return 'absolute';
        if (fileName.includes('responsive')) return 'responsive';
        
        return 'flow';
    }
    
    detectResponsive(component) {
        const fileName = component.path.toLowerCase();
        return fileName.includes('responsive') || fileName.includes('mobile');
    }
    
    calculateComplexityScore(component) {
        const size = component.size || 0;
        const purposes = component.purposes || [];
        
        let complexity = 0.1;
        
        // Size-based complexity
        if (size > 10000) complexity += 0.2;
        if (size > 50000) complexity += 0.3;
        if (size > 100000) complexity += 0.4;
        
        // Purpose-based complexity
        complexity += purposes.length * 0.1;
        
        return Math.min(complexity, 1.0);
    }
    
    calculateAccessibilityScore(component) {
        // Basic heuristics for accessibility
        const fileName = component.path.toLowerCase();
        let score = 0.5;
        
        if (fileName.includes('accessibility') || fileName.includes('a11y')) score += 0.3;
        if (fileName.includes('aria')) score += 0.2;
        
        return Math.min(score, 1.0);
    }
    
    detectMobileFriendly(component) {
        const fileName = component.path.toLowerCase();
        return fileName.includes('mobile') || fileName.includes('responsive');
    }
    
    calculatePerformanceScore(component) {
        const size = component.size || 0;
        let score = 0.8;
        
        // Penalty for large files
        if (size > 100000) score -= 0.3;
        else if (size > 50000) score -= 0.2;
        else if (size > 20000) score -= 0.1;
        
        return Math.max(score, 0.1);
    }
    
    analyzeThemeCompatibility(component) {
        const fileName = component.path.toLowerCase();
        const compatibility = {
            redblack: 0.5,
            whiteblack: 0.5,
            grey: 0.5,
            hacker: 0.5,
            patriotic: 0.5,
            bitcoin: 0.5
        };
        
        if (fileName.includes('patriotic') || fileName.includes('american')) {
            compatibility.patriotic = 1.0;
            compatibility.redblack = 0.8;
        }
        
        if (fileName.includes('hacker') || fileName.includes('matrix')) {
            compatibility.hacker = 1.0;
            compatibility.redblack = 0.7;
        }
        
        if (fileName.includes('bitcoin') || fileName.includes('crypto')) {
            compatibility.bitcoin = 1.0;
            compatibility.grey = 0.7;
        }
        
        return compatibility;
    }
    
    detectAnimations(component) {
        const fileName = component.path.toLowerCase();
        return fileName.includes('animation') || fileName.includes('animate') || fileName.includes('transition');
    }
    
    detectInteractions(component) {
        const fileName = component.path.toLowerCase();
        return fileName.includes('interactive') || fileName.includes('click') || fileName.includes('hover');
    }
    
    extractColorPalette(component) {
        const fileName = component.path.toLowerCase();
        
        // Default color palette
        let palette = {
            primary: ['#00ff41', '#0066cc'],
            secondary: ['#ffffff', '#cccccc'],
            background: '#000000',
            text: '#ffffff'
        };
        
        // Patriotic theme
        if (fileName.includes('patriotic') || fileName.includes('american')) {
            palette = {
                primary: ['#ff0000', '#0000ff'],
                secondary: ['#ffffff', '#ffff00'],
                background: '#001166',
                text: '#ffffff'
            };
        }
        
        // Hacker theme
        if (fileName.includes('hacker') || fileName.includes('matrix')) {
            palette = {
                primary: ['#00ff41', '#00ff88'],
                secondary: ['#ffffff', '#cccccc'],
                background: '#000000',
                text: '#00ff41'
            };
        }
        
        // Bitcoin theme
        if (fileName.includes('bitcoin') || fileName.includes('crypto')) {
            palette = {
                primary: ['#f7931a', '#ffaa00'],
                secondary: ['#ffffff', '#cccccc'],
                background: '#331100',
                text: '#f7931a'
            };
        }
        
        return palette;
    }
    
    async generateThumbnail(component) {
        // Mock thumbnail generation
        const thumbnailName = `${this.generateComponentId(component.path)}.png`;
        const thumbnailPath = `./data/components/thumbnails/${thumbnailName}`;
        
        // In a real implementation, this would generate actual thumbnails
        // For now, we'll just return the path
        return thumbnailPath;
    }
    
    // Database helper methods
    
    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.dbState.connection.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }
    
    async insertComponents(components) {
        const placeholders = components.map(() => 
            '(' + Object.keys(components[0]).map(() => '?').join(',') + ')'
        ).join(',');
        
        const sql = `INSERT OR REPLACE INTO components (${Object.keys(components[0]).join(',')}) VALUES ${placeholders}`;
        const values = components.flatMap(comp => Object.values(comp));
        
        await this.runQuery(sql, values);
    }
    
    async insertVisualMetadata(visualData) {
        for (const data of visualData) {
            const keys = Object.keys(data);
            const placeholders = keys.map(() => '?').join(',');
            const sql = `INSERT OR REPLACE INTO visual_metadata (${keys.join(',')}) VALUES (${placeholders})`;
            
            await this.runQuery(sql, Object.values(data));
        }
    }
    
    async insertSearchTerms(searchTerms) {
        const sql = 'INSERT INTO search_index (component_id, search_text, search_type, relevance_score) VALUES (?, ?, ?, ?)';
        
        for (const term of searchTerms) {
            await this.runQuery(sql, [term.component_id, term.search_text, term.search_type, term.relevance_score]);
        }
    }
    
    async getBillingInfo(componentId) {
        const result = await this.runQuery(
            'SELECT * FROM billing_integration WHERE component_id = ?',
            [componentId]
        );
        return result[0] || null;
    }
    
    async getUsageStats(componentId) {
        const result = await this.runQuery(`
            SELECT 
                COUNT(*) as total_uses,
                COUNT(DISTINCT user_id) as unique_users,
                MAX(timestamp) as last_used
            FROM usage_statistics 
            WHERE component_id = ?
        `, [componentId]);
        
        return result[0] || { total_uses: 0, unique_users: 0, last_used: null };
    }
    
    async getPatrioticAchievements(componentId) {
        return await this.runQuery(
            'SELECT * FROM patriotic_achievements WHERE component_id = ?',
            [componentId]
        );
    }
    
    async recordComponentAccess(componentId) {
        await this.runQuery(
            'UPDATE components SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = ?',
            [componentId]
        );
    }
    
    updateSearchStatistics(queryTime) {
        this.dbState.stats.totalQueries++;
        
        // Update average query time
        const currentAvg = this.dbState.stats.averageQueryTime;
        const totalQueries = this.dbState.stats.totalQueries;
        this.dbState.stats.averageQueryTime = ((currentAvg * (totalQueries - 1)) + queryTime) / totalQueries;
    }
    
    // Additional methods would continue here...
    // This provides a comprehensive foundation for the archive component database
    
    async buildIndexes() {
        console.log('🔍 Building search indexes...');
        // Additional indexing logic would go here
    }
    
    async setupRealTimeFeatures() {
        console.log('⚡ Setting up real-time features...');
        // WebSocket setup would go here
    }
    
    async setupAPIEndpoints() {
        console.log('🔌 Setting up API endpoints...');
        // Express.js API setup would go here
    }
    
    async processSpecializedComponents(components, category) {
        console.log(`🎯 Processing ${category} components...`);
        // Process specialized component categories
    }
    
    async close() {
        if (this.dbState.connection) {
            this.dbState.connection.close();
            console.log('📦 Database connection closed');
        }
    }
}

module.exports = ArchiveComponentDatabase;

// Example usage
if (require.main === module) {
    const database = new ArchiveComponentDatabase({
        databasePath: './data/components/archive.db',
        archiveDataPath: './wayback-summary.json',
        generateThumbnails: true,
        patrioticAnalysis: true
    });
    
    database.on('database_ready', async () => {
        console.log('🚀 Testing database functionality...');
        
        try {
            // Test search
            const searchResults = await database.searchComponents({
                text: 'american',
                patriotic: true,
                limit: 5
            });
            
            console.log('🔍 Search results:', searchResults.total);
            
            // Test component retrieval
            if (searchResults.results.length > 0) {
                const component = await database.getComponent(searchResults.results[0].id);
                console.log('📦 Component details:', component.name);
            }
            
        } catch (error) {
            console.error('❌ Test failed:', error);
        }
    });
    
    database.on('indexing_progress', (progress) => {
        console.log(`📊 Indexing progress: ${progress.percentage.toFixed(1)}%`);
    });
}