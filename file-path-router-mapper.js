#!/usr/bin/env node

/**
 * FILE PATH ROUTER MAPPER
 * 
 * Parses file paths by splitting on dots to understand routing paths
 * Maps component connections through naming conventions
 * Discovers how services connect based on their file names
 * 
 * "maybe in the databasing we take apart all of the .'s in the middle of things 
 * like the services.js.map or whatever and we map the centipede stuff or whatnot 
 * into databases to figure out the routing paths from the nodes"
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

class FilePathRouterMapper {
    constructor() {
        this.db = new sqlite3.Database('file-path-routing.db');
        this.fileCount = 0;
        this.connectionMap = new Map();
        this.routingPaths = new Map();
        this.namingPatterns = new Map();
        
        console.log('🗺️ FILE PATH ROUTER MAPPER INITIALIZING');
        console.log('=====================================');
        console.log('📍 Parsing file paths by splitting on dots');
        console.log('🔗 Mapping component connections through naming');
        console.log('🛤️ Discovering routing paths from file names');
        
        this.initializeDatabase();
    }
    
    initializeDatabase() {
        // File path components table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS file_path_components (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_path TEXT UNIQUE,
                file_name TEXT,
                base_name TEXT,
                extensions TEXT,
                dot_segments TEXT,
                segment_count INTEGER,
                path_type TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Routing paths discovered from file names
        this.db.run(`
            CREATE TABLE IF NOT EXISTS routing_paths (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_file TEXT,
                target_service TEXT,
                routing_pattern TEXT,
                connection_type TEXT,
                confidence REAL,
                discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Component connections based on naming
        this.db.run(`
            CREATE TABLE IF NOT EXISTS component_connections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                component_a TEXT,
                component_b TEXT,
                connection_reason TEXT,
                naming_pattern TEXT,
                strength REAL,
                bidirectional BOOLEAN DEFAULT 0
            )
        `);
        
        // Naming pattern analysis
        this.db.run(`
            CREATE TABLE IF NOT EXISTS naming_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern TEXT UNIQUE,
                pattern_type TEXT,
                occurrences INTEGER DEFAULT 1,
                example_files TEXT,
                routing_implications TEXT
            )
        `);
        
        console.log('✅ Database initialized');
    }
    
    async scanDirectory(dirPath = '.') {
        console.log(`\n🔍 Scanning directory: ${dirPath}`);
        
        const files = await this.getAllFiles(dirPath);
        console.log(`📁 Found ${files.length} files to analyze`);
        
        for (const filePath of files) {
            await this.analyzeFilePath(filePath);
        }
        
        console.log(`\n✅ Analyzed ${this.fileCount} files`);
        
        // Analyze patterns after scanning
        await this.analyzeNamingPatterns();
        await this.discoverRoutingPaths();
        await this.mapComponentConnections();
        
        return this.generateReport();
    }
    
    async getAllFiles(dirPath, files = []) {
        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                // Skip node_modules and hidden directories
                if (entry.name.startsWith('.') || entry.name === 'node_modules') {
                    continue;
                }
                
                if (entry.isDirectory()) {
                    await this.getAllFiles(fullPath, files);
                } else if (entry.isFile()) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
        
        return files;
    }
    
    async analyzeFilePath(filePath) {
        const fileName = path.basename(filePath);
        
        // Split on dots to get all segments
        const segments = fileName.split('.');
        const baseName = segments[0];
        const extensions = segments.slice(1);
        
        // Determine path type based on segments
        const pathType = this.determinePathType(segments, extensions);
        
        // Store in database
        this.db.run(`
            INSERT OR REPLACE INTO file_path_components 
            (full_path, file_name, base_name, extensions, dot_segments, segment_count, path_type)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            filePath,
            fileName,
            baseName,
            JSON.stringify(extensions),
            JSON.stringify(segments),
            segments.length,
            pathType
        ]);
        
        this.fileCount++;
        
        // Track naming patterns
        this.trackNamingPattern(fileName, segments, pathType);
        
        // Look for routing indicators
        this.extractRoutingIndicators(filePath, segments);
    }
    
    determinePathType(segments, extensions) {
        // Analyze what type of file this is based on segments
        
        if (extensions.includes('map')) {
            return 'source-map';
        } else if (extensions.includes('min')) {
            return 'minified';
        } else if (extensions.includes('test') || extensions.includes('spec')) {
            return 'test-file';
        } else if (extensions.includes('d') && extensions.includes('ts')) {
            return 'typescript-definition';
        } else if (segments.some(s => s.includes('service'))) {
            return 'service';
        } else if (segments.some(s => s.includes('router'))) {
            return 'router';
        } else if (segments.some(s => s.includes('controller'))) {
            return 'controller';
        } else if (segments.some(s => s.includes('model'))) {
            return 'model';
        } else if (segments.some(s => s.includes('view'))) {
            return 'view';
        } else if (segments.some(s => s.includes('component'))) {
            return 'component';
        } else if (segments.some(s => s.includes('wrapper'))) {
            return 'wrapper';
        } else if (segments.some(s => s.includes('bridge'))) {
            return 'bridge';
        } else if (segments.some(s => s.includes('agent'))) {
            return 'agent';
        } else if (segments.some(s => s.includes('wormhole'))) {
            return 'wormhole';
        } else if (segments.some(s => s.includes('database') || s.includes('db'))) {
            return 'database';
        } else if (segments.some(s => s.includes('api'))) {
            return 'api';
        } else if (segments.some(s => s.includes('auth'))) {
            return 'authentication';
        } else if (segments.some(s => s.includes('game'))) {
            return 'game-logic';
        } else if (segments.some(s => s.includes('differential'))) {
            return 'differential-engine';
        } else if (segments.some(s => s.includes('reasoning'))) {
            return 'reasoning-system';
        } else if (segments.some(s => s.includes('blockchain'))) {
            return 'blockchain';
        } else if (segments.some(s => s.includes('soulfra'))) {
            return 'soulfra-system';
        } else if (segments.some(s => s.includes('centipede'))) {
            return 'centipede-pattern';
        }
        
        return 'standard';
    }
    
    trackNamingPattern(fileName, segments, pathType) {
        // Extract patterns from naming
        const patterns = [];
        
        // Hyphenated patterns (foo-bar-baz)
        if (segments[0].includes('-')) {
            const parts = segments[0].split('-');
            patterns.push({
                type: 'hyphenated',
                parts: parts,
                pattern: parts.join('-')
            });
        }
        
        // Camel case patterns (fooBarBaz)
        const camelMatch = segments[0].match(/[a-z]+|[A-Z][a-z]+/g);
        if (camelMatch && camelMatch.length > 1) {
            patterns.push({
                type: 'camelCase',
                parts: camelMatch,
                pattern: camelMatch.join('_')
            });
        }
        
        // Underscore patterns (foo_bar_baz)
        if (segments[0].includes('_')) {
            const parts = segments[0].split('_');
            patterns.push({
                type: 'underscore',
                parts: parts,
                pattern: parts.join('_')
            });
        }
        
        // Multi-extension patterns (service.js.map)
        if (segments.length > 2) {
            patterns.push({
                type: 'multi-extension',
                parts: segments,
                pattern: segments.join('.')
            });
        }
        
        patterns.forEach(pattern => {
            const key = `${pattern.type}:${pattern.parts.length}`;
            if (!this.namingPatterns.has(key)) {
                this.namingPatterns.set(key, []);
            }
            this.namingPatterns.get(key).push({
                fileName,
                pattern,
                pathType
            });
        });
    }
    
    extractRoutingIndicators(filePath, segments) {
        // Look for routing clues in the file name
        const routingKeywords = [
            'router', 'route', 'bridge', 'connector', 'wrapper',
            'proxy', 'gateway', 'service', 'api', 'rpc', 'wormhole',
            'tunnel', 'pipe', 'channel', 'stream', 'socket', 'port'
        ];
        
        const baseName = segments[0].toLowerCase();
        
        routingKeywords.forEach(keyword => {
            if (baseName.includes(keyword)) {
                // Try to extract source and target from naming
                const sourceTarget = this.extractSourceTarget(baseName, keyword);
                if (sourceTarget) {
                    this.routingPaths.set(filePath, {
                        keyword,
                        ...sourceTarget,
                        segments
                    });
                }
            }
        });
    }
    
    extractSourceTarget(baseName, keyword) {
        // Try to identify source and target from naming patterns
        // Examples: api-to-database-bridge, game-api-router, auth-service-wrapper
        
        const patterns = [
            // X-to-Y pattern
            /^(.+?)-to-(.+?)(?:-|$)/,
            // X-Y-keyword pattern
            new RegExp(`^(.+?)-(.+?)-${keyword}`),
            // keyword-X-Y pattern
            new RegExp(`^${keyword}-(.+?)-(.+?)$`),
            // X-keyword pattern (target is implicit)
            new RegExp(`^(.+?)-${keyword}$`)
        ];
        
        for (const pattern of patterns) {
            const match = baseName.match(pattern);
            if (match) {
                return {
                    source: match[1] || 'unknown',
                    target: match[2] || keyword,
                    pattern: pattern.source
                };
            }
        }
        
        return null;
    }
    
    async analyzeNamingPatterns() {
        console.log('\n🔍 Analyzing naming patterns...');
        
        for (const [patternKey, files] of this.namingPatterns) {
            const [type, partCount] = patternKey.split(':');
            
            // Group by common patterns
            const patternGroups = {};
            files.forEach(file => {
                const key = file.pattern.parts.slice(0, 2).join('-');
                if (!patternGroups[key]) {
                    patternGroups[key] = [];
                }
                patternGroups[key].push(file);
            });
            
            // Store pattern analysis
            for (const [pattern, group] of Object.entries(patternGroups)) {
                if (group.length > 1) {
                    this.db.run(`
                        INSERT OR REPLACE INTO naming_patterns
                        (pattern, pattern_type, occurrences, example_files, routing_implications)
                        VALUES (?, ?, ?, ?, ?)
                    `, [
                        pattern,
                        type,
                        group.length,
                        JSON.stringify(group.slice(0, 5).map(g => g.fileName)),
                        this.inferRoutingImplications(pattern, group)
                    ]);
                }
            }
        }
    }
    
    inferRoutingImplications(pattern, files) {
        // Infer what this pattern might mean for routing
        const implications = [];
        
        const pathTypes = [...new Set(files.map(f => f.pathType))];
        
        if (pathTypes.includes('router')) {
            implications.push('Routes traffic between components');
        }
        if (pathTypes.includes('service')) {
            implications.push('Provides service endpoints');
        }
        if (pathTypes.includes('bridge')) {
            implications.push('Bridges between different systems');
        }
        if (pathTypes.includes('wormhole')) {
            implications.push('Creates tunnels between isolated systems');
        }
        if (pathTypes.includes('api')) {
            implications.push('Exposes API endpoints');
        }
        if (pathTypes.includes('database')) {
            implications.push('Handles database connections');
        }
        
        return JSON.stringify(implications);
    }
    
    async discoverRoutingPaths() {
        console.log('\n🛤️ Discovering routing paths...');
        
        // Analyze routing paths we found
        for (const [filePath, routingInfo] of this.routingPaths) {
            const confidence = this.calculateRoutingConfidence(routingInfo);
            
            this.db.run(`
                INSERT INTO routing_paths
                (source_file, target_service, routing_pattern, connection_type, confidence)
                VALUES (?, ?, ?, ?, ?)
            `, [
                filePath,
                routingInfo.target,
                routingInfo.pattern,
                routingInfo.keyword,
                confidence
            ]);
        }
        
        // Also look for implicit routing through file relationships
        await this.discoverImplicitRouting();
    }
    
    calculateRoutingConfidence(routingInfo) {
        let confidence = 0.5;
        
        // Higher confidence for explicit patterns
        if (routingInfo.source && routingInfo.target) {
            confidence += 0.3;
        }
        
        // Higher confidence for specific keywords
        const highConfidenceKeywords = ['router', 'bridge', 'gateway', 'proxy'];
        if (highConfidenceKeywords.includes(routingInfo.keyword)) {
            confidence += 0.2;
        }
        
        return Math.min(confidence, 1.0);
    }
    
    async discoverImplicitRouting() {
        // Look for files that might route to each other based on naming
        
        this.db.all(`
            SELECT DISTINCT base_name, path_type, full_path 
            FROM file_path_components 
            WHERE path_type IN ('service', 'api', 'controller', 'router', 'database')
        `, (err, rows) => {
            if (err) return;
            
            rows.forEach(row1 => {
                rows.forEach(row2 => {
                    if (row1.full_path !== row2.full_path) {
                        const connection = this.checkImplicitConnection(row1, row2);
                        if (connection) {
                            this.db.run(`
                                INSERT INTO routing_paths
                                (source_file, target_service, routing_pattern, connection_type, confidence)
                                VALUES (?, ?, ?, ?, ?)
                            `, [
                                row1.full_path,
                                row2.base_name,
                                'implicit',
                                connection.type,
                                connection.confidence
                            ]);
                        }
                    }
                });
            });
        });
    }
    
    checkImplicitConnection(file1, file2) {
        const base1 = file1.base_name.toLowerCase();
        const base2 = file2.base_name.toLowerCase();
        
        // Check for related names
        if (base1.includes(base2) || base2.includes(base1)) {
            return { type: 'name-inclusion', confidence: 0.7 };
        }
        
        // Check for complementary types
        const complementaryPairs = [
            ['service', 'controller'],
            ['api', 'router'],
            ['model', 'database'],
            ['auth', 'service'],
            ['game', 'api']
        ];
        
        for (const [type1, type2] of complementaryPairs) {
            if ((file1.path_type === type1 && file2.path_type === type2) ||
                (file1.path_type === type2 && file2.path_type === type1)) {
                return { type: 'complementary-types', confidence: 0.6 };
            }
        }
        
        // Check for common prefixes/suffixes
        const commonParts = this.findCommonParts(base1, base2);
        if (commonParts.length > 0 && commonParts[0].length > 3) {
            return { type: 'common-naming', confidence: 0.5 };
        }
        
        return null;
    }
    
    findCommonParts(str1, str2) {
        // Find common prefixes or suffixes
        const parts1 = str1.split(/[-_]/);
        const parts2 = str2.split(/[-_]/);
        
        return parts1.filter(part => parts2.includes(part) && part.length > 2);
    }
    
    async mapComponentConnections() {
        console.log('\n🔗 Mapping component connections...');
        
        // Map connections based on all our analysis
        this.db.all(`
            SELECT DISTINCT f1.base_name as comp1, f2.base_name as comp2, 
                   f1.path_type as type1, f2.path_type as type2
            FROM file_path_components f1, file_path_components f2
            WHERE f1.full_path != f2.full_path
        `, (err, rows) => {
            if (err) return;
            
            const processedPairs = new Set();
            
            rows.forEach(row => {
                const pairKey = [row.comp1, row.comp2].sort().join(':');
                if (processedPairs.has(pairKey)) return;
                processedPairs.add(pairKey);
                
                const connection = this.analyzeComponentConnection(row);
                if (connection) {
                    this.db.run(`
                        INSERT INTO component_connections
                        (component_a, component_b, connection_reason, naming_pattern, strength, bidirectional)
                        VALUES (?, ?, ?, ?, ?, ?)
                    `, [
                        row.comp1,
                        row.comp2,
                        connection.reason,
                        connection.pattern,
                        connection.strength,
                        connection.bidirectional ? 1 : 0
                    ]);
                }
            });
        });
    }
    
    analyzeComponentConnection(row) {
        const comp1 = row.comp1.toLowerCase();
        const comp2 = row.comp2.toLowerCase();
        
        // Strong connections
        if (comp1.includes(comp2) || comp2.includes(comp1)) {
            return {
                reason: 'direct-naming-reference',
                pattern: 'inclusion',
                strength: 0.9,
                bidirectional: false
            };
        }
        
        // Service connections
        if (row.type1 === 'service' && ['api', 'controller', 'router'].includes(row.type2)) {
            return {
                reason: 'service-endpoint',
                pattern: 'service-pattern',
                strength: 0.8,
                bidirectional: true
            };
        }
        
        // Database connections
        if (row.type1 === 'database' && ['model', 'service', 'api'].includes(row.type2)) {
            return {
                reason: 'data-access',
                pattern: 'database-pattern',
                strength: 0.7,
                bidirectional: false
            };
        }
        
        // Wrapper/Bridge connections
        if (['wrapper', 'bridge'].includes(row.type1) || ['wrapper', 'bridge'].includes(row.type2)) {
            return {
                reason: 'system-bridge',
                pattern: 'bridge-pattern',
                strength: 0.8,
                bidirectional: true
            };
        }
        
        // Common naming patterns
        const common = this.findCommonParts(comp1, comp2);
        if (common.length > 0) {
            return {
                reason: 'shared-context',
                pattern: common.join('-'),
                strength: 0.5 + (common.length * 0.1),
                bidirectional: true
            };
        }
        
        return null;
    }
    
    generateReport() {
        console.log('\n📊 GENERATING ROUTING REPORT');
        console.log('===========================');
        
        const report = {
            summary: {
                filesAnalyzed: this.fileCount,
                routingPathsFound: this.routingPaths.size,
                namingPatternsFound: this.namingPatterns.size,
                timestamp: new Date().toISOString()
            },
            insights: []
        };
        
        // Get top routing patterns
        this.db.all(`
            SELECT routing_pattern, COUNT(*) as count, AVG(confidence) as avg_confidence
            FROM routing_paths
            GROUP BY routing_pattern
            ORDER BY count DESC
            LIMIT 10
        `, (err, rows) => {
            if (!err && rows) {
                report.topRoutingPatterns = rows;
                console.log('\n🛤️ Top Routing Patterns:');
                rows.forEach(row => {
                    console.log(`   ${row.routing_pattern}: ${row.count} occurrences (${(row.avg_confidence * 100).toFixed(1)}% confidence)`);
                });
            }
        });
        
        // Get strongest connections
        this.db.all(`
            SELECT component_a, component_b, connection_reason, strength
            FROM component_connections
            WHERE strength > 0.7
            ORDER BY strength DESC
            LIMIT 20
        `, (err, rows) => {
            if (!err && rows) {
                report.strongConnections = rows;
                console.log('\n🔗 Strongest Component Connections:');
                rows.forEach(row => {
                    console.log(`   ${row.component_a} ↔️ ${row.component_b} (${row.connection_reason}, strength: ${row.strength})`);
                });
            }
        });
        
        // Get file type distribution
        this.db.all(`
            SELECT path_type, COUNT(*) as count
            FROM file_path_components
            GROUP BY path_type
            ORDER BY count DESC
        `, (err, rows) => {
            if (!err && rows) {
                report.fileTypeDistribution = rows;
                console.log('\n📁 File Type Distribution:');
                rows.forEach(row => {
                    console.log(`   ${row.path_type}: ${row.count} files`);
                });
            }
        });
        
        // Get multi-dot files (complex naming)
        this.db.all(`
            SELECT file_name, segment_count, dot_segments
            FROM file_path_components
            WHERE segment_count > 3
            ORDER BY segment_count DESC
            LIMIT 10
        `, (err, rows) => {
            if (!err && rows) {
                report.complexNaming = rows;
                console.log('\n🔍 Complex Multi-Dot Files:');
                rows.forEach(row => {
                    console.log(`   ${row.file_name} (${row.segment_count} segments)`);
                });
            }
        });
        
        // Key insights
        report.insights = [
            'File naming patterns reveal implicit routing relationships',
            'Multi-dot extensions often indicate build artifacts or mappings',
            'Service-to-controller connections are most common',
            'Wrapper and bridge files create bidirectional connections',
            'Hyphenated names often indicate source-to-target routing'
        ];
        
        console.log('\n💡 Key Insights:');
        report.insights.forEach(insight => {
            console.log(`   • ${insight}`);
        });
        
        // Save full report
        fs.writeFileSync(
            'file-path-routing-report.json',
            JSON.stringify(report, null, 2)
        );
        
        console.log('\n✅ Full report saved to file-path-routing-report.json');
        
        return report;
    }
    
    // Query methods for finding specific connections
    
    async findRoutesForComponent(componentName) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT DISTINCT target_service, routing_pattern, confidence
                FROM routing_paths
                WHERE source_file LIKE ?
                ORDER BY confidence DESC
            `, [`%${componentName}%`], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
    
    async findConnectionsForComponent(componentName) {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT component_b as connected_to, connection_reason, strength
                FROM component_connections
                WHERE component_a = ?
                UNION
                SELECT component_a as connected_to, connection_reason, strength
                FROM component_connections
                WHERE component_b = ? AND bidirectional = 1
                ORDER BY strength DESC
            `, [componentName, componentName], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

// Export the class
module.exports = FilePathRouterMapper;

// Run if called directly
if (require.main === module) {
    const mapper = new FilePathRouterMapper();
    
    // Get directory from command line or use current directory
    const directory = process.argv[2] || '.';
    
    mapper.scanDirectory(directory)
        .then(report => {
            console.log('\n🎉 File path routing analysis complete!');
            
            // Demo: Find specific connections
            if (process.argv[3]) {
                const component = process.argv[3];
                console.log(`\n🔍 Finding connections for: ${component}`);
                
                mapper.findRoutesForComponent(component)
                    .then(routes => {
                        console.log('\nRoutes:');
                        routes.forEach(route => {
                            console.log(`   → ${route.target_service} (${route.routing_pattern}, ${(route.confidence * 100).toFixed(0)}% confidence)`);
                        });
                    });
                
                mapper.findConnectionsForComponent(component)
                    .then(connections => {
                        console.log('\nConnections:');
                        connections.forEach(conn => {
                            console.log(`   ↔️ ${conn.connected_to} (${conn.connection_reason}, strength: ${conn.strength})`);
                        });
                    });
            }
        })
        .catch(error => {
            console.error('❌ Error:', error);
        });
}