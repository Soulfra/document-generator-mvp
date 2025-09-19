#!/usr/bin/env node

/**
 * DATABASE CONNECTION MAPPER
 * Audits which services need which databases to fix connection chaos
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class DatabaseConnectionMapper {
    constructor() {
        this.services = new Map();
        this.databases = {
            postgresql: {
                host: 'localhost',
                port: 5432,
                database: 'document_generator',
                type: 'postgresql',
                tables: []
            },
            redis: {
                host: 'localhost', 
                port: 6379,
                type: 'redis'
            },
            sqlite_files: new Map()
        };
        
        this.conflicts = [];
        this.recommendations = [];
    }
    
    async mapConnections() {
        console.log('🔍 DATABASE CONNECTION MAPPER');
        console.log('===============================');
        console.log('Auditing service → database relationships...\n');
        
        // 1. Scan for services with database connections
        await this.scanServices();
        
        // 2. Analyze database schemas
        await this.analyzeDatabaseSchemas();
        
        // 3. Identify conflicts
        this.identifyConflicts();
        
        // 4. Generate recommendations
        this.generateRecommendations();
        
        // 5. Create report
        await this.generateReport();
    }
    
    async scanServices() {
        console.log('📂 Scanning services for database connections...');
        
        // Known service files to check
        const serviceFiles = [
            'master-system-controller.js',
            'unified-ai-debugging-dashboard.js',
            'gaming-ai-bridge.js',
            'carrot-reinforcement-learning-system.js',
            'debug-game-visualizer.js',
            './mcp/src/index.js',
            './services/sovereign-agents/src/index.js'
        ];
        
        // Services from Docker Compose
        const dockerServices = [
            'template-processor',
            'ai-api', 
            'platform-hub',
            'sovereign-agents',
            'analytics'
        ];
        
        for (const file of serviceFiles) {
            if (fs.existsSync(file)) {
                await this.analyzeServiceFile(file);
            }
        }
        
        // Check Docker Compose for database connections
        await this.analyzeDockerCompose();
        
        console.log(`   Found ${this.services.size} services with database connections\n`);
    }
    
    async analyzeServiceFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const serviceName = path.basename(filePath, '.js');
            
            const analysis = {
                file: filePath,
                databases: [],
                connectionTypes: [],
                tables: new Set(),
                issues: []
            };
            
            // Check for PostgreSQL connections
            if (content.match(/postgresql|postgres|pg\./i)) {
                analysis.databases.push('postgresql');
                analysis.connectionTypes.push('postgresql');
                
                // Extract table names
                const tableMatches = content.match(/CREATE TABLE (\w+)|FROM (\w+)|INSERT INTO (\w+)|UPDATE (\w+)/gi);
                if (tableMatches) {
                    tableMatches.forEach(match => {
                        const tableName = match.replace(/CREATE TABLE |FROM |INSERT INTO |UPDATE /gi, '').trim();
                        analysis.tables.add(tableName);
                    });
                }
            }
            
            // Check for SQLite connections
            if (content.match(/sqlite|\.db\s|database.*sqlite/i)) {
                analysis.databases.push('sqlite');
                analysis.connectionTypes.push('sqlite');
                
                // Extract SQLite file names
                const sqliteMatches = content.match(/['"`][\w-]+\.db['"`]/g);
                if (sqliteMatches) {
                    sqliteMatches.forEach(match => {
                        const dbFile = match.replace(/['"`]/g, '');
                        this.databases.sqlite_files.set(dbFile, { 
                            usedBy: [serviceName],
                            tables: []
                        });
                    });
                }
            }
            
            // Check for Redis connections
            if (content.match(/redis|createClient|redis-client/i)) {
                analysis.databases.push('redis');
                analysis.connectionTypes.push('redis');
            }
            
            // Check for connection conflicts
            if (analysis.databases.length > 1) {
                analysis.issues.push(`Uses multiple database types: ${analysis.databases.join(', ')}`);
            }
            
            if (analysis.databases.length === 0) {
                // Check for database imports/requires
                if (content.match(/require.*database|import.*database|DATABASE_URL/i)) {
                    analysis.issues.push('References databases but connection type unclear');
                }
            }
            
            this.services.set(serviceName, analysis);
            
        } catch (error) {
            console.error(`   ❌ Error analyzing ${filePath}:`, error.message);
        }
    }
    
    async analyzeDockerCompose() {
        console.log('   🐳 Analyzing Docker Compose database configurations...');
        
        try {
            const dockerCompose = fs.readFileSync('docker-compose.yml', 'utf8');
            
            // Extract environment variables for each service
            const serviceMatches = dockerCompose.match(/^  \w+:[\s\S]*?(?=^  \w+:|$)/gm);
            
            serviceMatches?.forEach(serviceBlock => {
                const serviceNameMatch = serviceBlock.match(/^  (\w+):/);
                if (!serviceNameMatch) return;
                
                const serviceName = serviceNameMatch[1];
                
                // Skip infrastructure services
                if (['postgres', 'redis', 'minio', 'ollama', 'prometheus', 'grafana', 'nginx'].includes(serviceName)) {
                    return;
                }
                
                const analysis = {
                    file: 'docker-compose.yml',
                    databases: [],
                    connectionTypes: [],
                    tables: new Set(),
                    issues: [],
                    environment: {}
                };
                
                // Extract environment variables
                const envMatches = serviceBlock.match(/DATABASE_URL: (.+)|REDIS_URL: (.+)|POSTGRES_.*: (.+)/g);
                if (envMatches) {
                    envMatches.forEach(env => {
                        const [key, value] = env.split(': ');
                        analysis.environment[key] = value;
                        
                        if (key.includes('DATABASE_URL') && value.includes('postgresql')) {
                            analysis.databases.push('postgresql');
                        }
                        if (key.includes('REDIS_URL')) {
                            analysis.databases.push('redis');
                        }
                    });
                }
                
                // Check dependencies
                const dependsOnMatch = serviceBlock.match(/depends_on:[\s\S]*?condition: service_healthy/g);
                if (dependsOnMatch) {
                    if (dependsOnMatch[0].includes('postgres')) {
                        analysis.databases.push('postgresql');
                    }
                    if (dependsOnMatch[0].includes('redis')) {
                        analysis.databases.push('redis');
                    }
                }
                
                if (analysis.databases.length > 0 || Object.keys(analysis.environment).length > 0) {
                    this.services.set(serviceName, analysis);
                }
            });
            
        } catch (error) {
            console.error('   ❌ Error analyzing docker-compose.yml:', error.message);
        }
    }
    
    async analyzeDatabaseSchemas() {
        console.log('🗃️  Analyzing database schemas...');
        
        // Analyze PostgreSQL tables
        try {
            const pgReport = JSON.parse(fs.readFileSync('database-connectivity-report.json', 'utf8'));
            if (pgReport.results?.postgresql?.details?.tables) {
                this.databases.postgresql.tables = pgReport.results.postgresql.details.tables;
            }
        } catch (error) {
            console.log('   ⚠️  Could not read PostgreSQL tables from connectivity report');
        }
        
        // Analyze SQLite databases
        try {
            const sqliteReport = JSON.parse(fs.readFileSync('database-verification-report.json', 'utf8'));
            sqliteReport.databases?.forEach(db => {
                if (db.status === 'connected') {
                    const dbInfo = {
                        name: db.name,
                        tables: db.tables?.map(t => t.name) || [],
                        totalTables: db.totalTables || 0,
                        usedBy: []
                    };
                    this.databases.sqlite_files.set(`${db.name}.db`, dbInfo);
                }
            });
        } catch (error) {
            console.log('   ⚠️  Could not read SQLite databases from verification report');
        }
        
        console.log(`   PostgreSQL: ${this.databases.postgresql.tables.length} tables`);
        console.log(`   SQLite files: ${this.databases.sqlite_files.size} databases`);
        console.log('');
    }
    
    identifyConflicts() {
        console.log('⚠️  Identifying connection conflicts...');
        
        // Check for table name conflicts between PostgreSQL and SQLite
        const pgTables = new Set(this.databases.postgresql.tables);
        
        this.databases.sqlite_files.forEach((dbInfo, dbFile) => {
            dbInfo.tables?.forEach(table => {
                if (pgTables.has(table)) {
                    this.conflicts.push({
                        type: 'table_name_conflict',
                        table: table,
                        postgresql: true,
                        sqlite_file: dbFile,
                        issue: `Table '${table}' exists in both PostgreSQL and ${dbFile}`
                    });
                }
            });
        });
        
        // Check for services using multiple database types
        this.services.forEach((analysis, serviceName) => {
            if (analysis.databases.length > 1) {
                this.conflicts.push({
                    type: 'multiple_database_types',
                    service: serviceName,
                    databases: analysis.databases,
                    issue: `Service '${serviceName}' uses multiple database types: ${analysis.databases.join(', ')}`
                });
            }
        });
        
        console.log(`   Found ${this.conflicts.length} conflicts\n`);
    }
    
    generateRecommendations() {
        console.log('💡 Generating recommendations...');
        
        // Recommend primary database standardization
        this.recommendations.push({
            priority: 'high',
            type: 'standardization',
            title: 'Use PostgreSQL as primary database',
            description: 'Move shared tables (users, sessions, documents) to PostgreSQL',
            action: 'Migrate common tables from SQLite to PostgreSQL'
        });
        
        // Recommend SQLite for service-specific data
        this.recommendations.push({
            priority: 'medium',
            type: 'optimization',
            title: 'Keep SQLite for service-specific data',
            description: 'Use SQLite for game scores, temporary data, service-specific state',
            action: 'Keep SQLite for: gaming data, AI reasoning logs, temporary caches'
        });
        
        // Environment variable standardization
        this.recommendations.push({
            priority: 'high',
            type: 'configuration',
            title: 'Standardize environment variables',
            description: 'All services should use consistent DATABASE_URL patterns',
            action: 'Create .env template with standard database connection variables'
        });
        
        // Service startup order
        this.recommendations.push({
            priority: 'high',
            type: 'startup',
            title: 'Fix service startup dependencies',
            description: 'Services should wait for databases to be ready',
            action: 'Add database health checks and startup dependency management'
        });
        
        console.log(`   Generated ${this.recommendations.length} recommendations\n`);
    }
    
    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total_services: this.services.size,
                postgresql_services: Array.from(this.services.values()).filter(s => s.databases.includes('postgresql')).length,
                sqlite_services: Array.from(this.services.values()).filter(s => s.databases.includes('sqlite')).length,
                redis_services: Array.from(this.services.values()).filter(s => s.databases.includes('redis')).length,
                conflicts_found: this.conflicts.length
            },
            databases: {
                postgresql: this.databases.postgresql,
                redis: this.databases.redis,
                sqlite_files: Object.fromEntries(this.databases.sqlite_files)
            },
            services: Object.fromEntries(this.services),
            conflicts: this.conflicts,
            recommendations: this.recommendations
        };
        
        // Write detailed report
        fs.writeFileSync('database-connection-mapping-report.json', JSON.stringify(report, null, 2));
        
        // Create summary
        console.log('📊 DATABASE CONNECTION MAPPING REPORT');
        console.log('=====================================');
        console.log(`Services analyzed: ${report.summary.total_services}`);
        console.log(`PostgreSQL services: ${report.summary.postgresql_services}`);
        console.log(`SQLite services: ${report.summary.sqlite_services}`);
        console.log(`Redis services: ${report.summary.redis_services}`);
        console.log(`Conflicts found: ${report.summary.conflicts_found}`);
        console.log('');
        
        if (this.conflicts.length > 0) {
            console.log('⚠️  CRITICAL CONFLICTS:');
            this.conflicts.forEach((conflict, i) => {
                console.log(`${i + 1}. ${conflict.issue}`);
            });
            console.log('');
        }
        
        console.log('💡 TOP RECOMMENDATIONS:');
        this.recommendations.filter(r => r.priority === 'high').forEach((rec, i) => {
            console.log(`${i + 1}. ${rec.title}`);
            console.log(`   ${rec.description}`);
            console.log(`   Action: ${rec.action}`);
            console.log('');
        });
        
        console.log(`📄 Full report saved to: database-connection-mapping-report.json`);
        
        return report;
    }
}

// Run the mapper
if (require.main === module) {
    const mapper = new DatabaseConnectionMapper();
    mapper.mapConnections().catch(console.error);
}

module.exports = DatabaseConnectionMapper;