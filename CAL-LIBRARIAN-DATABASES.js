#!/usr/bin/env node

/**
 * 🗄️ CAL LIBRARIAN DATABASES - SPECIALIZED KNOWLEDGE STORAGE
 * 
 * Each Cal librarian maintains their own specialized SQLite database with:
 * - Domain-specific knowledge repositories
 * - Tagged packet storage with source tracking
 * - Trust network relationships with external APIs
 * - Component activation history and performance metrics
 * - Full reasoning chain storage for transparency
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class CalLibrarianDatabases {
    constructor(config = {}) {
        this.config = {
            databasesDir: config.databasesDir || './librarian_databases',
            backupDir: config.backupDir || './librarian_backups',
            enableWAL: config.enableWAL !== false,
            enableFTS: config.enableFTS !== false,
            maxDatabaseSize: config.maxDatabaseSize || '1GB',
            vacuumInterval: config.vacuumInterval || 86400000, // 24 hours
            ...config
        };
        
        this.databases = new Map();
        this.schemas = this.getLibrarianSchemas();
        
        console.log('🗄️ Cal Librarian Databases initializing...');
    }
    
    getLibrarianSchemas() {
        return {
            // Ship Cal - Maritime Domain Database
            'ship-cal': {
                tables: {
                    ship_templates: `
                        CREATE TABLE IF NOT EXISTS ship_templates (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            template_name TEXT NOT NULL,
                            ship_type TEXT NOT NULL,
                            template_data JSON NOT NULL,
                            creator_source TEXT,
                            trust_score REAL DEFAULT 0.5,
                            usage_count INTEGER DEFAULT 0,
                            performance_rating REAL DEFAULT 0.0,
                            tags TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `,
                    
                    design_patterns: `
                        CREATE TABLE IF NOT EXISTS design_patterns (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            pattern_name TEXT NOT NULL,
                            pattern_type TEXT NOT NULL,
                            description TEXT,
                            code_template TEXT,
                            use_cases TEXT,
                            complexity_level INTEGER DEFAULT 1,
                            source_api TEXT,
                            confidence_score REAL DEFAULT 0.5,
                            verification_status TEXT DEFAULT 'unverified',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `,
                    
                    fleet_configurations: `
                        CREATE TABLE IF NOT EXISTS fleet_configurations (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            config_name TEXT NOT NULL,
                            ship_count INTEGER,
                            formation_type TEXT,
                            efficiency_rating REAL,
                            resource_requirements JSON,
                            tactical_notes TEXT,
                            battle_tested BOOLEAN DEFAULT FALSE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `
                },
                
                fts_tables: {
                    ship_templates_fts: `
                        CREATE VIRTUAL TABLE IF NOT EXISTS ship_templates_fts 
                        USING fts5(template_name, ship_type, tags, content='ship_templates', content_rowid='id')
                    `,
                    
                    design_patterns_fts: `
                        CREATE VIRTUAL TABLE IF NOT EXISTS design_patterns_fts 
                        USING fts5(pattern_name, description, use_cases, content='design_patterns', content_rowid='id')
                    `
                }
            },
            
            // Trade Cal - Trading Domain Database
            'trade-cal': {
                tables: {
                    market_data: `
                        CREATE TABLE IF NOT EXISTS market_data (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            item_name TEXT NOT NULL,
                            item_id INTEGER,
                            buy_price INTEGER,
                            sell_price INTEGER,
                            volume INTEGER,
                            margin_gp INTEGER,
                            margin_percent REAL,
                            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            source_api TEXT,
                            reliability_score REAL DEFAULT 0.5,
                            verified BOOLEAN DEFAULT FALSE
                        )
                    `,
                    
                    arbitrage_opportunities: `
                        CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            item_name TEXT NOT NULL,
                            buy_location TEXT,
                            sell_location TEXT,
                            profit_gp INTEGER,
                            profit_percent REAL,
                            volume_available INTEGER,
                            risk_level TEXT,
                            time_sensitive BOOLEAN DEFAULT TRUE,
                            expiry_time TIMESTAMP,
                            detection_algorithm TEXT,
                            confidence_score REAL DEFAULT 0.5,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `,
                    
                    trading_strategies: `
                        CREATE TABLE IF NOT EXISTS trading_strategies (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            strategy_name TEXT NOT NULL,
                            category TEXT,
                            description TEXT,
                            implementation_code TEXT,
                            success_rate REAL,
                            avg_profit_gp INTEGER,
                            risk_level TEXT,
                            time_commitment TEXT,
                            requirements TEXT,
                            user_feedback_score REAL DEFAULT 0.0,
                            times_used INTEGER DEFAULT 0,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `
                },
                
                fts_tables: {
                    market_data_fts: `
                        CREATE VIRTUAL TABLE IF NOT EXISTS market_data_fts 
                        USING fts5(item_name, content='market_data', content_rowid='id')
                    `,
                    
                    arbitrage_fts: `
                        CREATE VIRTUAL TABLE IF NOT EXISTS arbitrage_fts 
                        USING fts5(item_name, buy_location, sell_location, content='arbitrage_opportunities', content_rowid='id')
                    `
                }
            },
            
            // Wiki Cal - Knowledge Domain Database
            'wiki-cal': {
                tables: {
                    knowledge_articles: `
                        CREATE TABLE IF NOT EXISTS knowledge_articles (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            title TEXT NOT NULL,
                            category TEXT,
                            content TEXT NOT NULL,
                            summary TEXT,
                            difficulty_level INTEGER DEFAULT 1,
                            accuracy_score REAL DEFAULT 0.5,
                            source_url TEXT,
                            last_verified TIMESTAMP,
                            view_count INTEGER DEFAULT 0,
                            helpfulness_rating REAL DEFAULT 0.0,
                            tags TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `,
                    
                    learning_paths: `
                        CREATE TABLE IF NOT EXISTS learning_paths (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            path_name TEXT NOT NULL,
                            description TEXT,
                            difficulty_progression JSON,
                            estimated_time_hours INTEGER,
                            prerequisite_paths TEXT,
                            completion_rate REAL DEFAULT 0.0,
                            user_satisfaction REAL DEFAULT 0.0,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `,
                    
                    tutorial_steps: `
                        CREATE TABLE IF NOT EXISTS tutorial_steps (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            learning_path_id INTEGER,
                            step_number INTEGER,
                            step_title TEXT NOT NULL,
                            step_content TEXT NOT NULL,
                            code_example TEXT,
                            completion_criteria TEXT,
                            common_mistakes TEXT,
                            help_resources JSON,
                            FOREIGN KEY (learning_path_id) REFERENCES learning_paths(id)
                        )
                    `
                },
                
                fts_tables: {
                    knowledge_fts: `
                        CREATE VIRTUAL TABLE IF NOT EXISTS knowledge_fts 
                        USING fts5(title, content, summary, tags, content='knowledge_articles', content_rowid='id')
                    `,
                    
                    learning_paths_fts: `
                        CREATE VIRTUAL TABLE IF NOT EXISTS learning_paths_fts 
                        USING fts5(path_name, description, content='learning_paths', content_rowid='id')
                    `
                }
            },
            
            // Combat Cal - Security Domain Database
            'combat-cal': {
                tables: {
                    threat_intelligence: `
                        CREATE TABLE IF NOT EXISTS threat_intelligence (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            threat_type TEXT NOT NULL,
                            severity_level INTEGER,
                            description TEXT NOT NULL,
                            indicators_of_compromise JSON,
                            mitigation_strategies TEXT,
                            detection_rules TEXT,
                            source_feed TEXT,
                            confidence_level REAL DEFAULT 0.5,
                            last_seen TIMESTAMP,
                            status TEXT DEFAULT 'active',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `,
                    
                    security_patterns: `
                        CREATE TABLE IF NOT EXISTS security_patterns (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            pattern_name TEXT NOT NULL,
                            attack_vector TEXT,
                            defense_strategy TEXT,
                            code_example TEXT,
                            effectiveness_rating REAL DEFAULT 0.5,
                            implementation_complexity INTEGER DEFAULT 1,
                            false_positive_rate REAL DEFAULT 0.1,
                            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `,
                    
                    vulnerability_database: `
                        CREATE TABLE IF NOT EXISTS vulnerability_database (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            cve_id TEXT,
                            vulnerability_name TEXT NOT NULL,
                            description TEXT,
                            cvss_score REAL,
                            affected_systems TEXT,
                            patch_availability TEXT,
                            exploit_complexity TEXT,
                            remediation_steps TEXT,
                            discovery_date DATE,
                            patch_date DATE,
                            source_url TEXT
                        )
                    `
                },
                
                fts_tables: {
                    threat_intelligence_fts: `
                        CREATE VIRTUAL TABLE IF NOT EXISTS threat_intelligence_fts 
                        USING fts5(threat_type, description, content='threat_intelligence', content_rowid='id')
                    `,
                    
                    vulnerability_fts: `
                        CREATE VIRTUAL TABLE IF NOT EXISTS vulnerability_fts 
                        USING fts5(vulnerability_name, description, affected_systems, content='vulnerability_database', content_rowid='id')
                    `
                }
            },
            
            // Cal Master - Coordination Domain Database
            'cal-master': {
                tables: {
                    orchestration_patterns: `
                        CREATE TABLE IF NOT EXISTS orchestration_patterns (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            pattern_name TEXT NOT NULL,
                            description TEXT,
                            use_case TEXT,
                            implementation TEXT,
                            success_metrics JSON,
                            complexity_score INTEGER DEFAULT 1,
                            adoption_rate REAL DEFAULT 0.0,
                            performance_impact REAL DEFAULT 0.0,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `,
                    
                    agent_coordination_logs: `
                        CREATE TABLE IF NOT EXISTS agent_coordination_logs (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            coordination_id TEXT NOT NULL,
                            participating_agents TEXT,
                            task_description TEXT,
                            coordination_strategy TEXT,
                            execution_time_ms INTEGER,
                            success_rate REAL,
                            resource_usage JSON,
                            lessons_learned TEXT,
                            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `,
                    
                    system_optimizations: `
                        CREATE TABLE IF NOT EXISTS system_optimizations (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            optimization_name TEXT NOT NULL,
                            target_component TEXT,
                            optimization_type TEXT,
                            implementation_details TEXT,
                            performance_improvement REAL,
                            resource_savings JSON,
                            stability_impact REAL DEFAULT 0.0,
                            rollback_plan TEXT,
                            status TEXT DEFAULT 'proposed',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    `
                },
                
                fts_tables: {
                    orchestration_fts: `
                        CREATE VIRTUAL TABLE IF NOT EXISTS orchestration_fts 
                        USING fts5(pattern_name, description, use_case, content='orchestration_patterns', content_rowid='id')
                    `
                }
            }
        };
    }
    
    async initializeLibrarianDatabase(librarianId) {
        const dbPath = path.join(this.config.databasesDir, `${librarianId}.db`);
        
        // Ensure directory exists
        await fs.mkdir(this.config.databasesDir, { recursive: true });
        
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    console.error(`❌ Failed to create database for ${librarianId}:`, err);
                    reject(err);
                    return;
                }
                
                console.log(`🗄️ Database initialized for ${librarianId}`);
                
                // Enable WAL mode for better concurrency
                if (this.config.enableWAL) {
                    db.run('PRAGMA journal_mode = WAL');
                    db.run('PRAGMA synchronous = NORMAL');
                    db.run('PRAGMA cache_size = 10000');
                    db.run('PRAGMA temp_store = memory');
                }
                
                // Create all tables for this librarian
                this.createLibrarianTables(db, librarianId)
                    .then(() => {
                        this.databases.set(librarianId, db);
                        resolve(db);
                    })
                    .catch(reject);
            });
        });
    }
    
    async createLibrarianTables(db, librarianId) {
        const schema = this.schemas[librarianId];
        if (!schema) {
            throw new Error(`No schema defined for librarian: ${librarianId}`);
        }
        
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                // Create main tables
                for (const [tableName, createSQL] of Object.entries(schema.tables)) {
                    db.run(createSQL, (err) => {
                        if (err) {
                            console.error(`Failed to create table ${tableName}:`, err);
                            reject(err);
                            return;
                        }
                    });
                }
                
                // Create FTS tables if enabled
                if (this.config.enableFTS && schema.fts_tables) {
                    for (const [ftsTableName, createSQL] of Object.entries(schema.fts_tables)) {
                        db.run(createSQL, (err) => {
                            if (err) {
                                console.error(`Failed to create FTS table ${ftsTableName}:`, err);
                                reject(err);
                                return;
                            }
                        });
                    }
                }
                
                // Create shared tables for all librarians
                this.createSharedTables(db)
                    .then(resolve)
                    .catch(reject);
            });
        });
    }
    
    async createSharedTables(db) {
        const sharedTables = {
            // Tagged Packets - Universal for all librarians
            tagged_packets: `
                CREATE TABLE IF NOT EXISTS tagged_packets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    packet_id TEXT UNIQUE NOT NULL,
                    librarian_id TEXT NOT NULL,
                    query_hash TEXT,
                    packet_data JSON NOT NULL,
                    source_components TEXT,
                    trust_sources JSON,
                    confidence_scores JSON,
                    reasoning_chain JSON,
                    execution_time_ms INTEGER,
                    result_quality REAL,
                    user_feedback INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP
                )
            `,
            
            // Trust Network - External API relationships
            trust_network: `
                CREATE TABLE IF NOT EXISTS trust_network (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_name TEXT NOT NULL,
                    source_type TEXT NOT NULL,
                    api_endpoint TEXT,
                    trust_score REAL DEFAULT 0.5,
                    reliability_history JSON,
                    response_time_avg INTEGER,
                    success_rate REAL DEFAULT 1.0,
                    last_verified TIMESTAMP,
                    status TEXT DEFAULT 'active',
                    verification_count INTEGER DEFAULT 0,
                    librarian_id TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `,
            
            // Component Performance Metrics
            component_metrics: `
                CREATE TABLE IF NOT EXISTS component_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    librarian_id TEXT NOT NULL,
                    component_name TEXT NOT NULL,
                    activation_count INTEGER DEFAULT 0,
                    avg_execution_time_ms INTEGER DEFAULT 0,
                    success_rate REAL DEFAULT 1.0,
                    avg_quality_score REAL DEFAULT 0.5,
                    last_used TIMESTAMP,
                    performance_trend TEXT DEFAULT 'stable',
                    resource_usage JSON,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `,
            
            // Reasoning Chain Storage
            reasoning_chains: `
                CREATE TABLE IF NOT EXISTS reasoning_chains (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chain_id TEXT UNIQUE NOT NULL,
                    librarian_id TEXT NOT NULL,
                    query TEXT NOT NULL,
                    steps JSON NOT NULL,
                    sources_consulted JSON,
                    confidence_scores JSON,
                    final_confidence REAL,
                    execution_time_ms INTEGER,
                    components_used TEXT,
                    model_used TEXT,
                    cost_incurred REAL DEFAULT 0.0,
                    user_satisfaction INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `,
            
            // Cross-Librarian Knowledge Sharing
            knowledge_sharing: `
                CREATE TABLE IF NOT EXISTS knowledge_sharing (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    source_librarian TEXT NOT NULL,
                    target_librarian TEXT NOT NULL,
                    knowledge_type TEXT NOT NULL,
                    shared_data JSON NOT NULL,
                    sharing_reason TEXT,
                    effectiveness_score REAL,
                    usage_count INTEGER DEFAULT 0,
                    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP
                )
            `
        };
        
        return new Promise((resolve, reject) => {
            db.serialize(() => {
                for (const [tableName, createSQL] of Object.entries(sharedTables)) {
                    db.run(createSQL, (err) => {
                        if (err) {
                            console.error(`Failed to create shared table ${tableName}:`, err);
                            reject(err);
                            return;
                        }
                    });
                }
                
                // Create indices for better performance
                const indices = [
                    'CREATE INDEX IF NOT EXISTS idx_tagged_packets_librarian ON tagged_packets(librarian_id)',
                    'CREATE INDEX IF NOT EXISTS idx_tagged_packets_query ON tagged_packets(query_hash)',
                    'CREATE INDEX IF NOT EXISTS idx_trust_network_librarian ON trust_network(librarian_id)',
                    'CREATE INDEX IF NOT EXISTS idx_trust_network_source ON trust_network(source_name)',
                    'CREATE INDEX IF NOT EXISTS idx_component_metrics_librarian ON component_metrics(librarian_id)',
                    'CREATE INDEX IF NOT EXISTS idx_reasoning_chains_librarian ON reasoning_chains(librarian_id)',
                    'CREATE INDEX IF NOT EXISTS idx_knowledge_sharing_source ON knowledge_sharing(source_librarian)',
                    'CREATE INDEX IF NOT EXISTS idx_knowledge_sharing_target ON knowledge_sharing(target_librarian)'
                ];
                
                for (const indexSQL of indices) {
                    db.run(indexSQL, (err) => {
                        if (err) {
                            console.error('Failed to create index:', err);
                        }
                    });
                }
                
                resolve();
            });
        });
    }
    
    async initializeAllLibrarians() {
        const librarians = Object.keys(this.schemas);
        const initPromises = librarians.map(librarianId => 
            this.initializeLibrarianDatabase(librarianId)
        );
        
        try {
            await Promise.all(initPromises);
            console.log(`✅ All ${librarians.length} librarian databases initialized`);
            
            // Seed with sample data
            await this.seedSampleData();
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize librarian databases:', error);
            throw error;
        }
    }
    
    async seedSampleData() {
        console.log('🌱 Seeding sample data for librarians...');
        
        try {
            // Seed Ship Cal with sample templates
            await this.insertData('ship-cal', 'ship_templates', {
                template_name: 'Pirate Frigate Mark I',
                ship_type: 'frigate',
                template_data: JSON.stringify({
                    hull_type: 'wooden',
                    sail_count: 3,
                    cannon_count: 12,
                    crew_capacity: 50,
                    cargo_capacity: 100,
                    special_features: ['ram', 'reinforced_hull']
                }),
                creator_source: 'ship-cal-ai',
                trust_score: 0.8,
                tags: 'pirate,frigate,combat,wooden'
            });
            
            // Seed Trade Cal with sample market data
            await this.insertData('trade-cal', 'market_data', {
                item_name: 'Dragon bones',
                item_id: 536,
                buy_price: 2100,
                sell_price: 2150,
                volume: 1000,
                margin_gp: 50,
                margin_percent: 2.38,
                source_api: 'osrs-ge-api',
                reliability_score: 0.9,
                verified: true
            });
            
            // Seed Wiki Cal with sample knowledge
            await this.insertData('wiki-cal', 'knowledge_articles', {
                title: 'Understanding AI Model Routing',
                category: 'AI Systems',
                content: 'Model routing is the process of selecting the most appropriate AI model for a given task based on various criteria such as cost, performance, and domain expertise.',
                summary: 'Guide to AI model routing strategies and implementation',
                difficulty_level: 3,
                accuracy_score: 0.95,
                tags: 'ai,routing,models,optimization'
            });
            
            // Seed Combat Cal with sample threat data
            await this.insertData('combat-cal', 'threat_intelligence', {
                threat_type: 'API Rate Limiting Attack',
                severity_level: 3,
                description: 'Coordinated attempts to exceed API rate limits and cause service degradation',
                indicators_of_compromise: JSON.stringify(['high_request_rate', 'distributed_sources', 'pattern_recognition']),
                mitigation_strategies: 'Implement progressive rate limiting, IP reputation checking, and CAPTCHA challenges',
                source_feed: 'internal-monitoring',
                confidence_level: 0.85
            });
            
            // Seed Trust Network data
            const trustSources = [
                {
                    source_name: 'OSRS Grand Exchange API',
                    source_type: 'market_data',
                    api_endpoint: 'https://services.runescape.com/m=itemdb_rs/api/catalogue/detail.json',
                    trust_score: 0.95,
                    librarian_id: 'trade-cal'
                },
                {
                    source_name: 'RuneLite API',
                    source_type: 'game_data',
                    api_endpoint: 'https://api.runelite.net/',
                    trust_score: 0.90,
                    librarian_id: 'trade-cal'
                },
                {
                    source_name: 'OSRS Wiki API',
                    source_type: 'knowledge_base',
                    api_endpoint: 'https://oldschool.runescape.wiki/api.php',
                    trust_score: 0.98,
                    librarian_id: 'wiki-cal'
                }
            ];
            
            for (const source of trustSources) {
                await this.insertSharedData('trust_network', source);
            }
            
            console.log('✅ Sample data seeded successfully');
            
        } catch (error) {
            console.error('❌ Failed to seed sample data:', error);
        }
    }
    
    async insertData(librarianId, tableName, data) {
        const db = this.databases.get(librarianId);
        if (!db) {
            throw new Error(`Database not found for librarian: ${librarianId}`);
        }
        
        const columns = Object.keys(data);
        const placeholders = columns.map(() => '?').join(', ');
        const values = Object.values(data);
        
        const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        
        return new Promise((resolve, reject) => {
            db.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(this.lastID);
            });
        });
    }
    
    async insertSharedData(tableName, data) {
        // Insert into the first available database (they all have shared tables)
        const firstDb = this.databases.values().next().value;
        if (!firstDb) {
            throw new Error('No databases available');
        }
        
        const columns = Object.keys(data);
        const placeholders = columns.map(() => '?').join(', ');
        const values = Object.values(data);
        
        const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
        
        return new Promise((resolve, reject) => {
            firstDb.run(sql, values, function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(this.lastID);
            });
        });
    }
    
    async queryLibrarian(librarianId, sql, params = []) {
        const db = this.databases.get(librarianId);
        if (!db) {
            throw new Error(`Database not found for librarian: ${librarianId}`);
        }
        
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(rows);
            });
        });
    }
    
    async searchKnowledge(librarianId, searchTerm, limit = 10) {
        const db = this.databases.get(librarianId);
        if (!db) {
            throw new Error(`Database not found for librarian: ${librarianId}`);
        }
        
        const schema = this.schemas[librarianId];
        if (!schema || !schema.fts_tables) {
            throw new Error(`FTS not available for librarian: ${librarianId}`);
        }
        
        // Search across all FTS tables for this librarian
        const searchPromises = Object.keys(schema.fts_tables).map(ftsTable => {
            const sql = `SELECT * FROM ${ftsTable} WHERE ${ftsTable} MATCH ? LIMIT ?`;
            return this.queryLibrarian(librarianId, sql, [searchTerm, limit]);
        });
        
        const results = await Promise.all(searchPromises);
        return results.flat();
    }
    
    async storeTaggedPacket(librarianId, packetData) {
        const packetId = crypto.randomUUID();
        const queryHash = crypto.createHash('sha256').update(packetData.query || '').digest('hex');
        
        const packet = {
            packet_id: packetId,
            librarian_id: librarianId,
            query_hash: queryHash,
            packet_data: JSON.stringify(packetData),
            source_components: packetData.components?.join(',') || '',
            trust_sources: JSON.stringify(packetData.trustSources || []),
            confidence_scores: JSON.stringify(packetData.confidenceScores || {}),
            reasoning_chain: JSON.stringify(packetData.reasoningChain || []),
            execution_time_ms: packetData.executionTime || 0,
            result_quality: packetData.quality || 0.5,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };
        
        return this.insertSharedData('tagged_packets', packet);
    }
    
    async getPerformanceMetrics(librarianId) {
        const queries = [
            'SELECT COUNT(*) as total_packets FROM tagged_packets WHERE librarian_id = ?',
            'SELECT AVG(execution_time_ms) as avg_execution_time FROM tagged_packets WHERE librarian_id = ?',
            'SELECT AVG(result_quality) as avg_quality FROM tagged_packets WHERE librarian_id = ?',
            'SELECT component_name, activation_count, success_rate FROM component_metrics WHERE librarian_id = ?'
        ];
        
        const [totalPackets, avgExecution, avgQuality, componentMetrics] = await Promise.all([
            this.queryLibrarian(librarianId, queries[0], [librarianId]),
            this.queryLibrarian(librarianId, queries[1], [librarianId]),
            this.queryLibrarian(librarianId, queries[2], [librarianId]),
            this.queryLibrarian(librarianId, queries[3], [librarianId])
        ]);
        
        return {
            librarian_id: librarianId,
            total_packets: totalPackets[0]?.total_packets || 0,
            avg_execution_time: avgExecution[0]?.avg_execution_time || 0,
            avg_quality: avgQuality[0]?.avg_quality || 0.5,
            component_performance: componentMetrics
        };
    }
    
    async cleanup() {
        console.log('🧹 Closing librarian databases...');
        
        for (const [librarianId, db] of this.databases.entries()) {
            await new Promise((resolve) => {
                db.close((err) => {
                    if (err) {
                        console.error(`Error closing database for ${librarianId}:`, err);
                    }
                    resolve();
                });
            });
        }
        
        this.databases.clear();
        console.log('✅ All databases closed');
    }
}

module.exports = CalLibrarianDatabases;

// Test if run directly
if (require.main === module) {
    async function testLibrarianDatabases() {
        const dbManager = new CalLibrarianDatabases({
            databasesDir: './test_librarian_dbs'
        });
        
        try {
            console.log('\n🧪 Testing Librarian Databases...\n');
            
            // Initialize all librarians
            await dbManager.initializeAllLibrarians();
            
            // Test search functionality
            console.log('\n🔍 Testing search capabilities...');
            
            const shipResults = await dbManager.searchKnowledge('ship-cal', 'pirate frigate');
            console.log('Ship Cal search results:', shipResults.length);
            
            const tradeResults = await dbManager.searchKnowledge('trade-cal', 'dragon bones');
            console.log('Trade Cal search results:', tradeResults.length);
            
            // Test tagged packet storage
            console.log('\n📦 Testing tagged packet storage...');
            
            const testPacket = {
                query: 'Find best ship template for combat',
                components: ['ship_templates', 'design_patterns'],
                trustSources: ['ship-cal-ai', 'community-templates'],
                confidenceScores: { ship_templates: 0.9, design_patterns: 0.7 },
                reasoningChain: [
                    { step: 1, action: 'search_templates', confidence: 0.9 },
                    { step: 2, action: 'filter_combat', confidence: 0.8 },
                    { step: 3, action: 'rank_by_effectiveness', confidence: 0.85 }
                ],
                executionTime: 1250,
                quality: 0.88
            };
            
            const packetId = await dbManager.storeTaggedPacket('ship-cal', testPacket);
            console.log('✅ Tagged packet stored with ID:', packetId);
            
            // Test performance metrics
            console.log('\n📊 Testing performance metrics...');
            
            const metrics = await dbManager.getPerformanceMetrics('ship-cal');
            console.log('Ship Cal metrics:', JSON.stringify(metrics, null, 2));
            
            // Cleanup
            await dbManager.cleanup();
            
            console.log('\n✅ All librarian database tests passed!');
            
        } catch (error) {
            console.error('❌ Test failed:', error);
            await dbManager.cleanup();
            process.exit(1);
        }
    }
    
    testLibrarianDatabases();
}