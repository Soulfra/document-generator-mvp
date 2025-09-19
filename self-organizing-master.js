#!/usr/bin/env node

/**
 * Self-Organizing Master Hub
 * Integrates XML mapping, Cal-Riven assistant, and human-in-the-loop orchestration
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const sqlite3 = require('sqlite3').verbose();

class SelfOrganizingMaster extends EventEmitter {
    constructor() {
        super();
        this.db = null;
        this.mappings = new Map();
        this.characterSystems = new Map();
        this.humanApprovalQueue = [];
        this.xmlSchemas = new Map();
        this.systemState = {
            initialized: false,
            lastScan: null,
            totalFiles: 0,
            mappedFiles: 0,
            pendingApprovals: 0
        };
    }

    async initialize() {
        console.log('🧠 Initializing Self-Organizing Master Hub...');
        
        // Initialize database
        await this.initializeDatabase();
        
        // Load existing XML mappings
        await this.loadXMLMappings();
        
        // Initialize Cal-Riven assistant
        await this.initializeCalRiven();
        
        // Start file watcher
        await this.startFileWatcher();
        
        // Load character systems
        await this.loadCharacterSystems();
        
        this.systemState.initialized = true;
        console.log('✅ Self-Organizing Master Hub initialized');
        
        return this;
    }

    async initializeDatabase() {
        this.db = new sqlite3.Database('./self-organizing.db');
        
        await new Promise((resolve, reject) => {
            this.db.run(`
                CREATE TABLE IF NOT EXISTS file_mappings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    file_path TEXT UNIQUE,
                    file_type TEXT,
                    xml_schema TEXT,
                    character_owner TEXT,
                    last_modified DATETIME,
                    processing_status TEXT,
                    metadata TEXT
                )
            `, (err) => err ? reject(err) : resolve());
        });

        await new Promise((resolve, reject) => {
            this.db.run(`
                CREATE TABLE IF NOT EXISTS system_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_type TEXT,
                    source TEXT,
                    target TEXT,
                    payload TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `, (err) => err ? reject(err) : resolve());
        });

        await new Promise((resolve, reject) => {
            this.db.run(`
                CREATE TABLE IF NOT EXISTS human_approvals (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    request_type TEXT,
                    request_data TEXT,
                    status TEXT DEFAULT 'pending',
                    response TEXT,
                    requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    responded_at DATETIME
                )
            `, (err) => err ? reject(err) : resolve());
        });
    }

    async loadXMLMappings() {
        console.log('📄 Loading XML mapping schemas...');
        
        // Check for existing XML mapping files
        const xmlMappers = [
            'master-xml-system-mapper.js',
            'dynamic-xml-mapper.js',
            'hierarchical-system-xml-mapping.xml',
            'master-xml-drone-mapper.js'
        ];

        for (const mapper of xmlMappers) {
            try {
                const exists = await fs.access(mapper).then(() => true).catch(() => false);
                if (exists) {
                    console.log(`  ✓ Found XML mapper: ${mapper}`);
                    this.xmlSchemas.set(mapper, {
                        loaded: true,
                        path: mapper
                    });
                }
            } catch (error) {
                // Mapper not found, continue
            }
        }
    }

    async initializeCalRiven() {
        console.log('🤖 Initializing Cal-Riven Assistant...');
        
        // Check for Cal-Riven components
        const calRivenPath = './cal-riven-assistant.js';
        const calRivenExists = await fs.access(calRivenPath).then(() => true).catch(() => false);
        
        if (calRivenExists) {
            try {
                const CalRiven = require(calRivenPath);
                this.calRiven = new CalRiven();
                console.log('  ✓ Cal-Riven assistant loaded');
            } catch (error) {
                console.log('  ⚠️  Cal-Riven found but could not be loaded:', error.message);
            }
        }
    }

    async startFileWatcher() {
        console.log('👁️  Starting file system watcher...');
        
        // Scan current directory structure
        await this.scanDirectory('.');
        
        // Set up periodic scanning (every 5 minutes)
        setInterval(() => {
            this.scanDirectory('.');
        }, 5 * 60 * 1000);
    }

    async scanDirectory(dir) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            
            // Skip certain directories
            if (entry.isDirectory() && ['.git', 'node_modules', '.trash'].includes(entry.name)) {
                continue;
            }
            
            if (entry.isDirectory()) {
                await this.scanDirectory(fullPath);
            } else {
                await this.processFile(fullPath);
            }
        }
    }

    async processFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const fileName = path.basename(filePath);
        
        // Determine file type and appropriate handler
        let fileType = 'unknown';
        let characterOwner = null;
        
        // Map file extensions to types
        const typeMap = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.py': 'python',
            '.html': 'html',
            '.xml': 'xml',
            '.json': 'json',
            '.md': 'markdown',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.sql': 'sql',
            '.sh': 'shell'
        };
        
        fileType = typeMap[ext] || 'unknown';
        
        // Determine character ownership based on file patterns
        if (fileName.includes('cal-') || fileName.includes('CAL-')) {
            characterOwner = 'Cal';
        } else if (fileName.includes('ralph-') || fileName.includes('test')) {
            characterOwner = 'Ralph';
        } else if (fileName.includes('arty-') || fileName.includes('heal') || fileName.includes('optimize')) {
            characterOwner = 'Arty';
        }
        
        // Update database
        await new Promise((resolve, reject) => {
            this.db.run(`
                INSERT OR REPLACE INTO file_mappings 
                (file_path, file_type, character_owner, last_modified, processing_status)
                VALUES (?, ?, ?, datetime('now'), 'indexed')
            `, [filePath, fileType, characterOwner], (err) => err ? reject(err) : resolve());
        });
        
        this.systemState.totalFiles++;
        
        // Emit event for other systems
        this.emit('file:indexed', {
            path: filePath,
            type: fileType,
            owner: characterOwner
        });
    }

    async loadCharacterSystems() {
        console.log('🎭 Loading character systems...');
        
        // Define character profiles
        const characters = {
            'Cal': {
                role: 'System Orchestrator',
                languages: ['javascript', 'typescript', 'python'],
                specialties: ['architecture', 'reasoning', 'documentation'],
                decision_style: 'analytical'
            },
            'Ralph': {
                role: 'System Tester',
                languages: ['shell', 'python', 'javascript'],
                specialties: ['testing', 'debugging', 'validation'],
                decision_style: 'aggressive'
            },
            'Arty': {
                role: 'System Healer',
                languages: ['javascript', 'yaml', 'json'],
                specialties: ['optimization', 'refactoring', 'integration'],
                decision_style: 'harmonious'
            }
        };
        
        for (const [name, profile] of Object.entries(characters)) {
            this.characterSystems.set(name, profile);
            console.log(`  ✓ Loaded character: ${name} (${profile.role})`);
        }
    }

    async requestHumanApproval(requestType, data) {
        console.log(`\n❓ Human approval requested for: ${requestType}`);
        
        const request = {
            type: requestType,
            data: data,
            timestamp: new Date().toISOString()
        };
        
        // Store in database
        await new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO human_approvals (request_type, request_data)
                VALUES (?, ?)
            `, [requestType, JSON.stringify(data)], (err) => err ? reject(err) : resolve());
        });
        
        this.humanApprovalQueue.push(request);
        this.systemState.pendingApprovals++;
        
        // Emit event for dashboard
        this.emit('approval:requested', request);
        
        console.log('  ⏳ Waiting for human response...');
        return request;
    }

    async processHumanResponse(requestId, approved, response) {
        await new Promise((resolve, reject) => {
            this.db.run(`
                UPDATE human_approvals 
                SET status = ?, response = ?, responded_at = datetime('now')
                WHERE id = ?
            `, [approved ? 'approved' : 'rejected', response, requestId], 
            (err) => err ? reject(err) : resolve());
        });
        
        this.systemState.pendingApprovals--;
        
        // Emit event
        this.emit('approval:processed', {
            requestId,
            approved,
            response
        });
    }

    async getSystemStatus() {
        // Get file statistics
        const fileStats = await new Promise((resolve, reject) => {
            this.db.all(`
                SELECT file_type, COUNT(*) as count 
                FROM file_mappings 
                GROUP BY file_type
            `, (err, rows) => err ? reject(err) : resolve(rows));
        });
        
        // Get character workload
        const characterStats = await new Promise((resolve, reject) => {
            this.db.all(`
                SELECT character_owner, COUNT(*) as count 
                FROM file_mappings 
                WHERE character_owner IS NOT NULL
                GROUP BY character_owner
            `, (err, rows) => err ? reject(err) : resolve(rows));
        });
        
        return {
            state: this.systemState,
            fileTypes: fileStats,
            characterWorkload: characterStats,
            pendingApprovals: this.humanApprovalQueue.length,
            xmlSchemas: Array.from(this.xmlSchemas.keys())
        };
    }

    async suggestOrganization() {
        console.log('\n🔍 Analyzing project structure for organization suggestions...');
        
        // Get all files grouped by type
        const filesByType = await new Promise((resolve, reject) => {
            this.db.all(`
                SELECT file_type, file_path 
                FROM file_mappings 
                ORDER BY file_type, file_path
            `, (err, rows) => err ? reject(err) : resolve(rows));
        });
        
        const suggestions = [];
        
        // Group files by similarity
        const groups = new Map();
        filesByType.forEach(file => {
            const key = `${file.file_type}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(file.file_path);
        });
        
        // Generate suggestions
        for (const [type, files] of groups.entries()) {
            if (files.length > 10) {
                suggestions.push({
                    type: 'consolidation',
                    message: `Consider consolidating ${files.length} ${type} files`,
                    files: files.slice(0, 5).concat(['...'])
                });
            }
        }
        
        return suggestions;
    }
}

// Export for use in other modules
module.exports = SelfOrganizingMaster;

// Run if called directly
if (require.main === module) {
    const master = new SelfOrganizingMaster();
    
    master.initialize().then(async () => {
        console.log('\n📊 System Status:');
        const status = await master.getSystemStatus();
        console.log(JSON.stringify(status, null, 2));
        
        console.log('\n💡 Organization Suggestions:');
        const suggestions = await master.suggestOrganization();
        suggestions.forEach(s => console.log(`  - ${s.message}`));
        
        // Keep process running
        console.log('\n✨ Self-Organizing Master Hub is running...');
        console.log('Press Ctrl+C to stop\n');
    }).catch(error => {
        console.error('Failed to initialize:', error);
        process.exit(1);
    });
}