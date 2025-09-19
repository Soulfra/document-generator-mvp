#!/usr/bin/env node

/**
 * 🔍🗄️ RPG DATABASE DISCOVERY TOOL
 * 
 * Automatically discovers database schemas across the project
 * Finds RPG-relevant tables and columns for the AI Agent economy
 * Generates runtime schema maps that APIs can use
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

class RPGDatabaseDiscovery {
    constructor() {
        this.databases = new Map();
        this.rpgSchemas = new Map();
        this.discoveryReport = {
            timestamp: new Date().toISOString(),
            databasesFound: 0,
            rpgTablesFound: 0,
            issues: [],
            recommendations: []
        };
        
        // RPG-relevant column patterns to search for
        this.rpgPatterns = {
            character: ['health', 'mana', 'level', 'xp', 'experience', 'hp', 'mp'],
            economy: ['balance', 'credits', 'gold', 'coins', 'currency', 'wallet'],
            progression: ['compute_used', 'total_trades', 'tasks_completed', 'score', 'points'],
            combat: ['damage', 'defense', 'attack', 'strength', 'power'],
            identity: ['agent_name', 'character_name', 'player_name', 'username'],
            metadata: ['created_at', 'updated_at', 'last_login', 'last_action'],
            zones: ['zone', 'location', 'realm', 'area', 'region'],
            items: ['inventory', 'items', 'equipment', 'loot'],
            stats: ['stats', 'attributes', 'skills', 'abilities']
        };
        
        console.log('🔍🗄️ RPG DATABASE DISCOVERY TOOL');
        console.log('================================');
    }
    
    /**
     * Discover all database files in the project
     */
    async discoverDatabases() {
        console.log('\n📁 Scanning for database files...');
        
        try {
            // Find all .db and .sqlite files
            const patterns = [
                '**/*.db',
                '**/*.sqlite',
                '**/*.sqlite3'
            ];
            
            const allFiles = [];
            for (const pattern of patterns) {
                const files = await glob(pattern, { 
                    cwd: process.cwd(),
                    ignore: ['**/node_modules/**', '**/backup/**', '**/archive/**']
                });
                allFiles.push(...files);
            }
            
            console.log(`✅ Found ${allFiles.length} database files`);
            
            // Test each database
            for (const file of allFiles) {
                await this.analyzeDatabase(file);
            }
            
            this.discoveryReport.databasesFound = this.databases.size;
            
        } catch (error) {
            console.error('❌ Error discovering databases:', error);
            this.discoveryReport.issues.push({
                type: 'discovery_error',
                error: error.message
            });
        }
    }
    
    /**
     * Analyze a single database file
     */
    async analyzeDatabase(dbPath) {
        console.log(`\n🔍 Analyzing: ${dbPath}`);
        
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
        const dbInfo = {
            path: dbPath,
            name: path.basename(dbPath),
            tables: new Map(),
            rpgRelevance: 0,
            errors: []
        };
        
        try {
            // Get all tables
            const tables = await this.runQuery(db, `
                SELECT name FROM sqlite_master 
                WHERE type='table' 
                ORDER BY name
            `);
            
            console.log(`  📋 Found ${tables.length} tables`);
            
            // Analyze each table
            for (const table of tables) {
                const tableInfo = await this.analyzeTable(db, table.name);
                dbInfo.tables.set(table.name, tableInfo);
                
                // Check RPG relevance
                if (tableInfo.rpgScore > 0) {
                    dbInfo.rpgRelevance += tableInfo.rpgScore;
                    console.log(`  ✨ RPG Table: ${table.name} (score: ${tableInfo.rpgScore})`);
                }
            }
            
            this.databases.set(dbPath, dbInfo);
            
            // If this database has RPG relevance, add to RPG schemas
            if (dbInfo.rpgRelevance > 0) {
                this.rpgSchemas.set(dbPath, dbInfo);
                console.log(`  🎮 RPG Database confirmed! Total relevance: ${dbInfo.rpgRelevance}`);
            }
            
        } catch (error) {
            console.error(`  ❌ Error analyzing ${dbPath}:`, error.message);
            dbInfo.errors.push(error.message);
            this.discoveryReport.issues.push({
                type: 'database_error',
                database: dbPath,
                error: error.message
            });
        } finally {
            db.close();
        }
    }
    
    /**
     * Analyze a single table for RPG relevance
     */
    async analyzeTable(db, tableName) {
        const tableInfo = {
            name: tableName,
            columns: [],
            rpgColumns: [],
            rpgScore: 0,
            rowCount: 0
        };
        
        try {
            // Get table schema
            const columns = await this.runQuery(db, `PRAGMA table_info(${tableName})`);
            
            // Analyze each column
            for (const col of columns) {
                const columnInfo = {
                    name: col.name,
                    type: col.type,
                    isRPG: false,
                    rpgCategory: null
                };
                
                // Check if column matches RPG patterns
                const lowerName = col.name.toLowerCase();
                for (const [category, patterns] of Object.entries(this.rpgPatterns)) {
                    if (patterns.some(pattern => lowerName.includes(pattern))) {
                        columnInfo.isRPG = true;
                        columnInfo.rpgCategory = category;
                        tableInfo.rpgScore += this.getColumnScore(category, col.name);
                        tableInfo.rpgColumns.push(columnInfo);
                        break;
                    }
                }
                
                tableInfo.columns.push(columnInfo);
            }
            
            // Get row count
            try {
                const countResult = await this.runQuery(db, `SELECT COUNT(*) as count FROM ${tableName}`);
                tableInfo.rowCount = countResult[0].count;
            } catch (e) {
                // Ignore count errors
            }
            
            // Special bonus for key RPG tables
            if (tableName.toLowerCase().includes('agent') || 
                tableName.toLowerCase().includes('player') ||
                tableName.toLowerCase().includes('character')) {
                tableInfo.rpgScore += 5;
            }
            
        } catch (error) {
            console.error(`    ❌ Error analyzing table ${tableName}:`, error.message);
        }
        
        return tableInfo;
    }
    
    /**
     * Get relevance score for a column
     */
    getColumnScore(category, columnName) {
        const scores = {
            character: 3,    // Core RPG stats
            economy: 3,      // Economic system
            progression: 2,  // Progress tracking
            combat: 2,       // Combat mechanics
            identity: 1,     // Character identity
            metadata: 0.5,   // Supporting data
            zones: 2,        // Zone/location system
            items: 2,        // Item/inventory system
            stats: 2         // General stats
        };
        
        return scores[category] || 1;
    }
    
    /**
     * Generate discovery report
     */
    generateReport() {
        console.log('\n📊 GENERATING DISCOVERY REPORT...\n');
        
        const report = {
            ...this.discoveryReport,
            rpgDatabases: [],
            schemaMap: {},
            recommendations: []
        };
        
        // Process RPG databases
        for (const [dbPath, dbInfo] of this.rpgSchemas) {
            const rpgDb = {
                path: dbPath,
                name: dbInfo.name,
                relevanceScore: dbInfo.rpgRelevance,
                tables: []
            };
            
            // Process RPG tables
            for (const [tableName, tableInfo] of dbInfo.tables) {
                if (tableInfo.rpgScore > 0) {
                    rpgDb.tables.push({
                        name: tableName,
                        score: tableInfo.rpgScore,
                        rowCount: tableInfo.rowCount,
                        rpgColumns: tableInfo.rpgColumns.map(col => ({
                            name: col.name,
                            type: col.type,
                            category: col.rpgCategory
                        }))
                    });
                    
                    // Add to schema map
                    if (!report.schemaMap[dbPath]) {
                        report.schemaMap[dbPath] = {};
                    }
                    report.schemaMap[dbPath][tableName] = tableInfo.rpgColumns.map(c => c.name);
                }
            }
            
            rpgDb.tables.sort((a, b) => b.score - a.score);
            report.rpgDatabases.push(rpgDb);
        }
        
        // Sort databases by relevance
        report.rpgDatabases.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        // Generate recommendations
        if (report.rpgDatabases.length > 0) {
            const bestDb = report.rpgDatabases[0];
            report.recommendations.push({
                type: 'primary_database',
                message: `Use ${bestDb.name} as primary RPG database (score: ${bestDb.relevanceScore})`,
                database: bestDb.path
            });
            
            // Find best tables
            const allTables = [];
            for (const db of report.rpgDatabases) {
                for (const table of db.tables) {
                    allTables.push({ ...table, database: db.path });
                }
            }
            allTables.sort((a, b) => b.score - a.score);
            
            if (allTables.length > 0) {
                report.recommendations.push({
                    type: 'best_tables',
                    message: 'Top RPG tables found:',
                    tables: allTables.slice(0, 5).map(t => ({
                        name: t.name,
                        database: t.database,
                        score: t.score
                    }))
                });
            }
        } else {
            report.recommendations.push({
                type: 'no_rpg_data',
                message: 'No RPG-relevant databases found. Consider initializing RPG schema.',
                action: 'Run RPG-SCHEMA-INIT.js to create proper tables'
            });
        }
        
        report.rpgTablesFound = report.rpgDatabases.reduce((sum, db) => sum + db.tables.length, 0);
        
        return report;
    }
    
    /**
     * Save discovery results
     */
    async saveDiscoveryResults(report) {
        const outputPath = 'RPG-DATABASE-DISCOVERY-RESULTS.json';
        
        try {
            await fs.writeFile(outputPath, JSON.stringify(report, null, 2));
            console.log(`\n✅ Discovery results saved to: ${outputPath}`);
            
            // Also create a runtime config for the RPG API
            const runtimeConfig = {
                primaryDatabase: report.rpgDatabases[0]?.path || null,
                schemaMap: report.schemaMap,
                generated: new Date().toISOString()
            };
            
            await fs.writeFile('RPG-RUNTIME-CONFIG.json', JSON.stringify(runtimeConfig, null, 2));
            console.log(`✅ Runtime config saved to: RPG-RUNTIME-CONFIG.json`);
            
        } catch (error) {
            console.error('❌ Error saving results:', error);
        }
    }
    
    /**
     * Display discovery results
     */
    displayResults(report) {
        console.log('\n🎮 RPG DATABASE DISCOVERY RESULTS');
        console.log('=================================\n');
        
        console.log(`📊 Summary:`);
        console.log(`  • Databases scanned: ${report.databasesFound}`);
        console.log(`  • RPG databases found: ${report.rpgDatabases.length}`);
        console.log(`  • RPG tables found: ${report.rpgTablesFound}`);
        console.log(`  • Issues encountered: ${report.issues.length}`);
        
        if (report.rpgDatabases.length > 0) {
            console.log('\n🏆 Top RPG Databases:');
            report.rpgDatabases.slice(0, 3).forEach((db, i) => {
                console.log(`\n  ${i + 1}. ${db.name} (Score: ${db.relevanceScore})`);
                console.log(`     Path: ${db.path}`);
                console.log(`     Tables: ${db.tables.map(t => t.name).join(', ')}`);
            });
            
            console.log('\n⭐ Best RPG Tables:');
            const topTables = [];
            for (const db of report.rpgDatabases) {
                for (const table of db.tables) {
                    topTables.push({ ...table, dbName: db.name });
                }
            }
            topTables.sort((a, b) => b.score - a.score);
            
            topTables.slice(0, 5).forEach((table, i) => {
                console.log(`\n  ${i + 1}. ${table.name} in ${table.dbName} (Score: ${table.score})`);
                console.log(`     Rows: ${table.rowCount}`);
                console.log(`     RPG Columns: ${table.rpgColumns.map(c => `${c.name} (${c.category})`).join(', ')}`);
            });
        }
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.recommendations.forEach(rec => {
                console.log(`\n  • ${rec.message}`);
                if (rec.tables) {
                    rec.tables.forEach(t => {
                        console.log(`    - ${t.name} (${path.basename(t.database)}) - Score: ${t.score}`);
                    });
                }
            });
        }
        
        if (report.issues.length > 0) {
            console.log('\n⚠️  Issues:');
            report.issues.forEach(issue => {
                console.log(`  • ${issue.type}: ${issue.error}`);
            });
        }
    }
    
    /**
     * Helper to run SQLite queries
     */
    runQuery(db, sql, params = []) {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
    
    /**
     * Main discovery process
     */
    async discover() {
        console.log('🚀 Starting RPG database discovery...\n');
        
        await this.discoverDatabases();
        const report = this.generateReport();
        this.displayResults(report);
        await this.saveDiscoveryResults(report);
        
        console.log('\n✅ Discovery complete!');
        return report;
    }
}

// Export for use in other modules
module.exports = RPGDatabaseDiscovery;

// CLI interface
if (require.main === module) {
    const discovery = new RPGDatabaseDiscovery();
    
    discovery.discover()
        .then(report => {
            console.log('\n🎮 Use the generated RPG-RUNTIME-CONFIG.json in your API!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Discovery failed:', error);
            process.exit(1);
        });
}