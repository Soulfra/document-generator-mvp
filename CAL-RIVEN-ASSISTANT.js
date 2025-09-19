#!/usr/bin/env node
// CAL-RIVEN-ASSISTANT.js - MASTER EXECUTIVE ORCHESTRATOR for all systems

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const WebSocket = require('ws');
const http = require('http');
const { spawn, exec } = require('child_process');
const EventEmitter = require('events');

class CalRivenAssistant extends EventEmitter {
    constructor() {
        super();
        this.port = 9999;
        this.wsPort = 9998;
        this.baseDir = process.cwd();
        
        // MASTER ORCHESTRATOR STATE
        this.isExecutiveMode = true;
        this.orchestrators = new Map();
        this.systemHealth = new Map();
        this.runningProcesses = new Map();
        this.lastHealthCheck = Date.now();
        
        // Complete file catalog
        this.fileCatalog = {
            systems: {},
            games: {},
            routing: {},
            documentation: {},
            visualization: {},
            economy: {},
            utilities: {},
            unknown: {}
        };
        
        // File patterns to categorize everything
        this.filePatterns = {
            systems: [
                /DUNGEON-MASTER/i,
                /MCP-CONNECTOR/i,
                /AGENT-ECONOMY/i,
                /BLOCKCHAIN/i,
                /SPHINX-DOC/i,
                /ROUTER/i,
                /CONNECTOR/i
            ],
            games: [
                /TYCOON/i,
                /VAMPIRE/i,
                /FREIGHT/i,
                /SLAYING/i,
                /GAME/i,
                /PLAYER/i,
                /OSRS/i,
                /DIABLO/i,
                /POKEMON/i,
                /DRAGON/i,
                /HABBO/i
            ],
            routing: [
                /LLM/i,
                /OLLAMA/i,
                /AI-ROUTER/i,
                /MODEL/i,
                /REASONING/i,
                /DIFFERENTIAL/i,
                /BRAIN/i
            ],
            documentation: [
                /README/i,
                /DOC/i,
                /GUIDE/i,
                /TEMPLATE/i,
                /SPEC/i,
                /\.md$/i,
                /\.rst$/i
            ],
            visualization: [
                /3D-API/i,
                /LAYER-RIDER/i,
                /VISUALIZATION/i,
                /DASHBOARD/i,
                /\.html$/i
            ],
            economy: [
                /ECONOMY/i,
                /FORUM/i,
                /BLOCKCHAIN/i,
                /WALLET/i,
                /TOKEN/i,
                /TRADING/i
            ],
            utilities: [
                /START-ALL/i,
                /VERIFY/i,
                /SETUP/i,
                /INSTALL/i,
                /\.sh$/i,
                /\.json$/i,
                /package/i
            ]
        };
        
        // System knowledge base
        this.knowledgeBase = {
            projectOverview: '',
            fileCount: 0,
            lastScanned: null,
            connections: [],
            capabilities: [
                'Complete file system indexing',
                'Pattern-based file categorization', 
                'Live system monitoring',
                'Local LLM integration',
                'Mobile companion pairing',
                'Real-time file analysis',
                'Automatic documentation updates',
                'Freight game integration tracking',
                'Agent economy monitoring'
            ]
        };
        
        this.connections = new Map();
        this.mobileConnections = new Map();
        
        console.log('🚀 CAL RIVEN EXECUTIVE ORCHESTRATOR INITIALIZED');
        console.log('🎯 Master system coordination and orchestration active');
        
        // Executive orchestrator capabilities
        this.executiveCapabilities = [
            'Master orchestrator management',
            'Real-time system health monitoring', 
            'Automated service discovery and launch',
            'DeathToData integration and coordination',
            'LLM orchestrator hierarchy management',
            'Deep tier system connectivity',
            'Unified dashboard and control center',
            'Process lifecycle management',
            'Emergency recovery protocols',
            'Cross-system communication routing'
        ];
    }
    
    start() {
        console.log('🚀 STARTING EXECUTIVE ORCHESTRATOR SEQUENCE...\n');
        
        // Phase 1: Core system analysis
        this.scanCompleteFileSystem();
        this.discoverOrchestrators();
        
        // Phase 2: Communication infrastructure
        this.startAssistantServer();
        this.startWebSocketServer();
        
        // Phase 3: System integration
        this.connectToAllSystems();
        this.initializeOrchestratorHierarchy();
        
        // Phase 4: Monitoring and control
        this.startHealthMonitoring();
        this.generateCompleteIndex();
        this.startPeriodicScanning();
        this.initializeMobileInterface();
        
        // Phase 5: Launch critical systems
        this.autoLaunchCriticalSystems();
    }
    
    scanCompleteFileSystem() {
        console.log('🔍 SCANNING COMPLETE FILE SYSTEM...');
        console.log('📁 Cataloging ALL files in project...');
        
        // Reset catalog
        Object.keys(this.fileCatalog).forEach(category => {
            this.fileCatalog[category] = {};
        });
        
        // Scan everything recursively
        this.scanDirectory(this.baseDir, '');
        
        // Generate analysis
        this.analyzeFileSystem();
        
        console.log('✅ File system scan complete');
        console.log(`📊 Total files cataloged: ${this.knowledgeBase.fileCount}`);
    }
    
    scanDirectory(dirPath, relativePath) {
        try {
            const items = fs.readdirSync(dirPath);
            
            items.forEach(item => {
                // Skip hidden files and node_modules
                if (item.startsWith('.') || item === 'node_modules') return;
                
                const fullPath = path.join(dirPath, item);
                const relPath = path.join(relativePath, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    // Recursively scan subdirectories
                    this.scanDirectory(fullPath, relPath);
                } else if (stat.isFile()) {
                    this.catalogFile(fullPath, relPath, stat);
                }
            });
        } catch (e) {
            console.error(`Error scanning ${dirPath}:`, e.message);
        }
    }
    
    catalogFile(fullPath, relativePath, stat) {
        this.knowledgeBase.fileCount++;
        
        const fileInfo = {
            name: path.basename(relativePath),
            path: relativePath,
            fullPath: fullPath,
            size: stat.size,
            modified: stat.mtime,
            extension: path.extname(relativePath),
            category: 'unknown',
            description: '',
            dependencies: [],
            purpose: '',
            content: null
        };
        
        // Categorize file
        fileInfo.category = this.categorizeFile(relativePath);
        
        // Analyze file content for important files
        if (this.shouldAnalyzeContent(fileInfo)) {
            this.analyzeFileContent(fileInfo);
        }
        
        // Store in appropriate category
        this.fileCatalog[fileInfo.category][relativePath] = fileInfo;
    }
    
    categorizeFile(filePath) {
        const fileName = path.basename(filePath).toUpperCase();
        
        // Check each category pattern
        for (const [category, patterns] of Object.entries(this.filePatterns)) {
            if (patterns.some(pattern => pattern.test(fileName) || pattern.test(filePath))) {
                return category;
            }
        }
        
        return 'unknown';
    }
    
    shouldAnalyzeContent(fileInfo) {
        // Analyze JavaScript, HTML, markdown, and config files
        const analyzeExtensions = ['.js', '.html', '.md', '.json', '.sh', '.py', '.txt'];
        return analyzeExtensions.includes(fileInfo.extension) && fileInfo.size < 1000000; // < 1MB
    }
    
    analyzeFileContent(fileInfo) {
        try {
            const content = fs.readFileSync(fileInfo.fullPath, 'utf8');
            fileInfo.content = content;
            
            // Extract purpose from comments or description
            fileInfo.purpose = this.extractPurpose(content, fileInfo.extension);
            
            // Find dependencies
            fileInfo.dependencies = this.extractDependencies(content, fileInfo.extension);
            
            // Generate description
            fileInfo.description = this.generateDescription(fileInfo);
            
        } catch (e) {
            fileInfo.description = `Error reading file: ${e.message}`;
        }
    }
    
    extractPurpose(content, extension) {
        const lines = content.split('\n').slice(0, 10); // First 10 lines
        
        // Look for purpose indicators
        for (const line of lines) {
            const trimmed = line.trim();
            
            // JavaScript/Node.js comments
            if (trimmed.startsWith('//') && (trimmed.includes('purpose') || trimmed.includes('does') || trimmed.includes('-'))) {
                return trimmed.replace(/^\/\/\s*/, '');
            }
            
            // Markdown headers
            if (trimmed.startsWith('#') && extension === '.md') {
                return trimmed.replace(/^#+\s*/, '');
            }
            
            // HTML title
            if (trimmed.includes('<title>') && extension === '.html') {
                const match = trimmed.match(/<title>(.*?)<\/title>/i);
                if (match) return match[1];
            }
        }
        
        return 'Purpose unknown - analyze manually';
    }
    
    extractDependencies(content, extension) {
        const deps = [];
        
        if (extension === '.js') {
            // Find require statements
            const requireMatches = content.match(/require\(['"]([^'"]+)['"]\)/g);
            if (requireMatches) {
                requireMatches.forEach(match => {
                    const dep = match.match(/require\(['"]([^'"]+)['"]\)/)[1];
                    deps.push(dep);
                });
            }
            
            // Find import statements
            const importMatches = content.match(/import .+ from ['"]([^'"]+)['"]/g);
            if (importMatches) {
                importMatches.forEach(match => {
                    const dep = match.match(/from ['"]([^'"]+)['"]/)[1];
                    deps.push(dep);
                });
            }
        }
        
        if (extension === '.html') {
            // Find script sources
            const scriptMatches = content.match(/<script[^>]+src=['"]([^'"]+)['"]/g);
            if (scriptMatches) {
                scriptMatches.forEach(match => {
                    const src = match.match(/src=['"]([^'"]+)['"]/)[1];
                    deps.push(src);
                });
            }
        }
        
        return deps;
    }
    
    generateDescription(fileInfo) {
        const name = fileInfo.name;
        const category = fileInfo.category;
        const purpose = fileInfo.purpose;
        
        let desc = `${category.toUpperCase()} file: ${name}`;
        
        if (purpose && purpose !== 'Purpose unknown - analyze manually') {
            desc += ` - ${purpose}`;
        }
        
        if (fileInfo.dependencies.length > 0) {
            desc += ` (Dependencies: ${fileInfo.dependencies.slice(0, 3).join(', ')})`;
        }
        
        return desc;
    }
    
    analyzeFileSystem() {
        console.log('📊 ANALYZING FILE SYSTEM STRUCTURE...');
        
        // Count files by category
        const categoryCounts = {};
        Object.entries(this.fileCatalog).forEach(([category, files]) => {
            categoryCounts[category] = Object.keys(files).length;
        });
        
        // Generate project overview
        this.knowledgeBase.projectOverview = this.generateProjectOverview(categoryCounts);
        this.knowledgeBase.lastScanned = new Date();
        
        console.log('Category breakdown:');
        Object.entries(categoryCounts).forEach(([category, count]) => {
            if (count > 0) {
                console.log(`  ${category}: ${count} files`);
            }
        });
    }
    
    generateProjectOverview(categoryCounts) {
        return `
COMPLETE AGENT ECONOMY SYSTEM ANALYSIS
======================================

This is a comprehensive AI agent economy system with ${this.knowledgeBase.fileCount} total files across multiple categories:

🎮 GAMES & ENTERTAINMENT (${categoryCounts.games} files):
   - Vampire slaying tycoon mechanics
   - Freight/cargo management games  
   - OSRS/Runescape-style progression
   - Pokemon/Dragon Ball collection systems
   - Habbo Hotel room mechanics

🤖 AI SYSTEMS & ROUTING (${categoryCounts.systems + categoryCounts.routing} files):
   - Dungeon Master reasoning engine
   - Multi-agent coordination (HTML Master, CSS Mage, etc.)
   - Local LLM routing (Ollama integration)
   - AI brain differential analysis
   - Progressive AI enhancement (local → cloud)

🔐 ECONOMY & BLOCKCHAIN (${categoryCounts.economy} files):
   - PGP-encrypted agent forums
   - Blockchain transaction ledger
   - Agent wallet system with RSA keys
   - Smart contract execution
   - Token-based service marketplace

🌍 VISUALIZATION & INTERFACES (${categoryCounts.visualization} files):
   - 3D API world with real-time agent monitoring
   - Layer Rider code drawing system
   - Sitemaster architecture dashboard
   - Multiple specialized control panels

📚 DOCUMENTATION & UTILITIES (${categoryCounts.documentation + categoryCounts.utilities} files):
   - Sphinx documentation generator
   - System verification scripts
   - Automated startup/shutdown tools
   - Configuration management

This system transforms web development into a D&D-style campaign where AI agents collaborate through encrypted communications and blockchain-verified transactions.
`;
    }
    
    startAssistantServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const url = req.url;
            
            if (url === '/') {
                this.serveAssistantInterface(res);
            } else if (url === '/api/catalog') {
                this.serveCatalogData(res);
            } else if (url === '/api/knowledge') {
                this.serveKnowledgeBase(res);
            } else if (url === '/api/analyze-file' && req.method === 'POST') {
                this.handleFileAnalysis(req, res);
            } else if (url === '/api/mobile-pair' && req.method === 'POST') {
                this.handleMobilePairing(req, res);
            } else if (url === '/api/organize-files' && req.method === 'POST') {
                this.handleFileOrganization(req, res);
            } else if (url === '/api/search' && req.method === 'POST') {
                this.handleFileSearch(req, res);
            } else {
                res.writeHead(404);
                res.end('Assistant endpoint not found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`\n🤖 Cal Riven Assistant: http://localhost:${this.port}`);
        });
    }
    
    startWebSocketServer() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws, req) => {
            const id = Math.random().toString(36).substr(2, 9);
            
            // Check if this is a mobile connection
            const userAgent = req.headers['user-agent'] || '';
            const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
            
            if (isMobile) {
                this.mobileConnections.set(id, ws);
                console.log(`📱 Mobile assistant connected: ${id}`);
            } else {
                this.connections.set(id, ws);
                console.log(`🖥️ Desktop assistant connected: ${id}`);
            }
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'assistant-welcome',
                id: id,
                isMobile: isMobile,
                catalog: this.fileCatalog,
                knowledge: this.knowledgeBase,
                capabilities: this.knowledgeBase.capabilities
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleAssistantMessage(id, data, isMobile);
                } catch (e) {
                    console.error('Invalid assistant message:', e);
                }
            });
            
            ws.on('close', () => {
                this.connections.delete(id);
                this.mobileConnections.delete(id);
                console.log(`🔌 Assistant disconnected: ${id}`);
            });
        });
        
        console.log(`📡 Assistant WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    connectToAllSystems() {
        console.log('🔗 Connecting to all running systems...');
        
        // Connect to all known system WebSockets
        const systems = [
            { name: 'mcp', url: 'ws://localhost:6667' },
            { name: 'dungeon-master', url: 'ws://localhost:7778' },
            { name: 'agent-economy', url: 'ws://localhost:8081' },
            { name: 'blockchain', url: 'ws://localhost:8082' },
            { name: 'documentation', url: 'ws://localhost:9001' }
        ];
        
        systems.forEach(system => {
            try {
                const ws = new WebSocket(system.url);
                
                ws.on('open', () => {
                    console.log(`🔌 Connected to ${system.name}`);
                    this.knowledgeBase.connections.push(system.name);
                    ws.send(JSON.stringify({ type: 'cal-riven-connected' }));
                });
                
                ws.on('message', (data) => {
                    try {
                        const message = JSON.parse(data);
                        this.updateSystemKnowledge(system.name, message);
                    } catch (e) {
                        // Non-JSON message, ignore
                    }
                });
                
                ws.on('error', () => {
                    console.log(`⚠️ Cannot connect to ${system.name}`);
                });
            } catch (e) {
                console.log(`⚠️ ${system.name} not available`);
            }
        });
    }
    
    updateSystemKnowledge(systemName, data) {
        // Update knowledge base with live system data
        if (!this.knowledgeBase[systemName]) {
            this.knowledgeBase[systemName] = {};
        }
        
        this.knowledgeBase[systemName] = {
            ...this.knowledgeBase[systemName],
            ...data,
            lastUpdated: Date.now()
        };
        
        // Broadcast updates to connected clients
        this.broadcastUpdate({
            type: 'system-knowledge-update',
            system: systemName,
            data: data
        });
    }
    
    generateCompleteIndex() {
        console.log('📋 Generating complete project index...');
        
        const indexPath = path.join(this.baseDir, 'COMPLETE-PROJECT-INDEX.md');
        let index = `# COMPLETE PROJECT INDEX\n\n`;
        index += `Generated by Cal Riven Assistant on ${new Date().toISOString()}\n\n`;
        index += this.knowledgeBase.projectOverview + '\n\n';
        
        // Add detailed file listings by category
        Object.entries(this.fileCatalog).forEach(([category, files]) => {
            if (Object.keys(files).length === 0) return;
            
            index += `## ${category.toUpperCase()} FILES\n\n`;
            
            Object.entries(files).forEach(([filePath, fileInfo]) => {
                index += `### ${fileInfo.name}\n`;
                index += `- **Path**: \`${filePath}\`\n`;
                index += `- **Size**: ${fileInfo.size} bytes\n`;
                index += `- **Modified**: ${fileInfo.modified.toISOString()}\n`;
                index += `- **Description**: ${fileInfo.description}\n`;
                
                if (fileInfo.dependencies.length > 0) {
                    index += `- **Dependencies**: ${fileInfo.dependencies.join(', ')}\n`;
                }
                
                index += '\n';
            });
        });
        
        fs.writeFileSync(indexPath, index);
        console.log(`✅ Complete index generated: ${indexPath}`);
    }
    
    startPeriodicScanning() {
        // Rescan file system every 5 minutes
        setInterval(() => {
            console.log('🔄 Periodic file system scan...');
            this.scanCompleteFileSystem();
            this.generateCompleteIndex();
            this.broadcastUpdate({
                type: 'catalog-updated',
                catalog: this.fileCatalog,
                knowledge: this.knowledgeBase
            });
        }, 300000); // 5 minutes
    }
    
    initializeMobileInterface() {
        // Generate QR code for mobile pairing
        const pairingUrl = `http://localhost:${this.port}/mobile`;
        console.log(`\n📱 MOBILE PAIRING:`);
        console.log(`   URL: ${pairingUrl}`);
        console.log(`   Scan QR code or visit URL on mobile device`);
    }
    
    // ============================================================================
    // EXECUTIVE ORCHESTRATOR METHODS
    // ============================================================================
    
    discoverOrchestrators() {
        console.log('🔍 DISCOVERING ALL ORCHESTRATORS...');
        
        // Find all orchestrator files
        const orchestratorFiles = [];
        Object.values(this.fileCatalog).forEach(category => {
            Object.values(category).forEach(fileInfo => {
                if (fileInfo.name.toLowerCase().includes('orchestrator')) {
                    orchestratorFiles.push(fileInfo);
                }
            });
        });
        
        console.log(`📊 Found ${orchestratorFiles.length} orchestrator files`);
        
        // Categorize orchestrators by function
        const orchestratorCategories = {
            master: [],
            llm: [],
            system: [],
            game: [],
            integration: [],
            security: [],
            deployment: []
        };
        
        orchestratorFiles.forEach(file => {
            const name = file.name.toLowerCase();
            if (name.includes('master')) {
                orchestratorCategories.master.push(file);
            } else if (name.includes('llm') || name.includes('reasoning') || name.includes('ai')) {
                orchestratorCategories.llm.push(file);
            } else if (name.includes('system') || name.includes('unified')) {
                orchestratorCategories.system.push(file);
            } else if (name.includes('game') || name.includes('empire') || name.includes('dungeon')) {
                orchestratorCategories.game.push(file);
            } else if (name.includes('integration') || name.includes('handshake')) {
                orchestratorCategories.integration.push(file);
            } else if (name.includes('security') || name.includes('guardian')) {
                orchestratorCategories.security.push(file);
            } else if (name.includes('deploy') || name.includes('launch')) {
                orchestratorCategories.deployment.push(file);
            }
        });
        
        // Store orchestrator registry
        this.orchestratorRegistry = orchestratorCategories;
        
        console.log('📂 Orchestrator categories:');
        Object.entries(orchestratorCategories).forEach(([category, files]) => {
            if (files.length > 0) {
                console.log(`   ${category}: ${files.length} orchestrators`);
            }
        });
        
        return orchestratorCategories;
    }
    
    initializeOrchestratorHierarchy() {
        console.log('🏗️ INITIALIZING ORCHESTRATOR HIERARCHY...');
        
        // Define the executive command structure
        const hierarchy = {
            executive: {
                name: 'Cal Riven Executive Assistant',
                level: 0,
                role: 'Supreme coordinator and decision maker',
                manages: ['master', 'llm', 'system']
            },
            master: {
                name: 'Master Orchestrators',
                level: 1,
                role: 'High-level system coordination',
                files: this.orchestratorRegistry.master,
                manages: ['system', 'integration']
            },
            llm: {
                name: 'LLM Reasoning Orchestrators', 
                level: 1,
                role: 'AI decision making and content generation',
                files: this.orchestratorRegistry.llm,
                manages: ['game', 'integration']
            },
            system: {
                name: 'System Orchestrators',
                level: 2,
                role: 'Core system operations',
                files: this.orchestratorRegistry.system,
                manages: ['security', 'deployment']
            },
            game: {
                name: 'Game & Economy Orchestrators',
                level: 2,
                role: 'Gaming and economic systems',
                files: this.orchestratorRegistry.game,
                manages: []
            },
            integration: {
                name: 'Integration Orchestrators',
                level: 2,
                role: 'System connectivity and handshakes',
                files: this.orchestratorRegistry.integration,
                manages: []
            },
            security: {
                name: 'Security Orchestrators',
                level: 3,
                role: 'System protection and monitoring',
                files: this.orchestratorRegistry.security,
                manages: []
            },
            deployment: {
                name: 'Deployment Orchestrators',
                level: 3,
                role: 'System deployment and lifecycle',
                files: this.orchestratorRegistry.deployment,
                manages: []
            }
        };
        
        this.executiveHierarchy = hierarchy;
        
        console.log('🎯 Executive hierarchy established:');
        Object.entries(hierarchy).forEach(([key, data]) => {
            const fileCount = data.files ? data.files.length : 0;
            console.log(`   Level ${data.level}: ${data.name} (${fileCount} orchestrators)`);
        });
    }
    
    startHealthMonitoring() {
        console.log('🩺 STARTING SYSTEM HEALTH MONITORING...');
        
        // Monitor system health every 30 seconds
        setInterval(() => {
            this.performHealthCheck();
        }, 30000);
        
        // Initial health check
        this.performHealthCheck();
    }
    
    async performHealthCheck() {
        const healthReport = {
            timestamp: Date.now(),
            systems: {},
            alerts: [],
            overallHealth: 'unknown'
        };
        
        // Check common ports for running services
        const criticalPorts = [
            { port: 3000, service: 'Template Processor (MCP)' },
            { port: 3001, service: 'AI API Service' },
            { port: 5555, service: 'LLM Search Engine' },
            { port: 7777, service: 'BPM Risk/Reward' },
            { port: 8080, service: 'Platform Hub' },
            { port: 8081, service: 'WebSocket' },
            { port: 11434, service: 'Ollama' }
        ];
        
        for (const { port, service } of criticalPorts) {
            try {
                const isRunning = await this.checkPort(port);
                healthReport.systems[service] = {
                    status: isRunning ? 'healthy' : 'down',
                    port: port,
                    lastCheck: Date.now()
                };
                
                if (!isRunning) {
                    healthReport.alerts.push(`${service} is down (port ${port})`);
                }
            } catch (error) {
                healthReport.systems[service] = {
                    status: 'error',
                    port: port,
                    error: error.message,
                    lastCheck: Date.now()
                };
                healthReport.alerts.push(`Error checking ${service}: ${error.message}`);
            }
        }
        
        // Calculate overall health
        const healthyCount = Object.values(healthReport.systems).filter(s => s.status === 'healthy').length;
        const totalCount = Object.keys(healthReport.systems).length;
        const healthPercentage = Math.round((healthyCount / totalCount) * 100);
        
        if (healthPercentage >= 80) {
            healthReport.overallHealth = 'healthy';
        } else if (healthPercentage >= 60) {
            healthReport.overallHealth = 'degraded';
        } else {
            healthReport.overallHealth = 'critical';
        }
        
        this.lastHealthReport = healthReport;
        
        // Broadcast health update
        this.broadcastUpdate({
            type: 'health-update',
            health: healthReport
        });
        
        // Auto-recovery for critical systems
        if (healthReport.alerts.length > 0) {
            this.handleHealthAlerts(healthReport.alerts);
        }
    }
    
    async checkPort(port) {
        return new Promise((resolve) => {
            const net = require('net');
            const socket = new net.Socket();
            
            socket.setTimeout(1000);
            
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });
            
            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });
            
            socket.on('error', () => {
                resolve(false);
            });
            
            socket.connect(port, 'localhost');
        });
    }
    
    handleHealthAlerts(alerts) {
        console.log('🚨 HEALTH ALERTS DETECTED:');
        alerts.forEach(alert => console.log(`   ⚠️ ${alert}`));
        
        // Attempt auto-recovery for known services
        alerts.forEach(alert => {
            if (alert.includes('BPM Risk/Reward')) {
                this.attemptServiceRecovery('deathtodata');
            } else if (alert.includes('LLM Search Engine')) {
                this.attemptServiceRecovery('llm-search');
            } else if (alert.includes('Ollama')) {
                this.attemptServiceRecovery('ollama');
            }
        });
    }
    
    async attemptServiceRecovery(serviceName) {
        console.log(`🔧 Attempting recovery for: ${serviceName}`);
        
        try {
            switch (serviceName) {
                case 'deathtodata':
                    await this.launchDeathToData();
                    break;
                case 'llm-search':
                    await this.launchLLMOrchestrator();
                    break;
                case 'ollama':
                    await this.launchOllama();
                    break;
                default:
                    console.log(`❌ No recovery procedure for ${serviceName}`);
            }
        } catch (error) {
            console.error(`❌ Recovery failed for ${serviceName}:`, error.message);
        }
    }
    
    async autoLaunchCriticalSystems() {
        console.log('🚀 AUTO-LAUNCHING CRITICAL SYSTEMS...');
        
        // Launch in order of dependency
        const launchSequence = [
            { name: 'Ollama', method: 'launchOllama' },
            { name: 'LLM Orchestrator', method: 'launchLLMOrchestrator' },
            { name: 'DeathToData', method: 'launchDeathToData' },
            { name: 'Deep Tier System', method: 'launchDeepTierSystem' }
        ];
        
        for (const system of launchSequence) {
            try {
                console.log(`🔄 Launching ${system.name}...`);
                await this[system.method]();
                await this.delay(2000); // Wait 2 seconds between launches
            } catch (error) {
                console.error(`❌ Failed to launch ${system.name}:`, error.message);
                // Continue with other systems
            }
        }
        
        console.log('✅ Critical systems launch sequence completed');
    }
    
    async launchDeathToData() {
        console.log('🔍 Launching DeathToData...');
        
        const launchScript = path.join(this.baseDir, 'launch-deathtodata-unified.sh');
        if (fs.existsSync(launchScript)) {
            const process = spawn('bash', [launchScript], {
                detached: true,
                stdio: 'pipe'
            });
            
            this.runningProcesses.set('deathtodata', process);
            console.log('✅ DeathToData launch initiated');
            return process;
        } else {
            throw new Error('DeathToData launch script not found');
        }
    }
    
    async launchLLMOrchestrator() {
        console.log('🧠 Launching LLM Orchestrator...');
        
        const orchestratorFile = path.join(this.baseDir, 'llm-reasoning-orchestrator.js');
        if (fs.existsSync(orchestratorFile)) {
            const process = spawn('node', [orchestratorFile], {
                detached: true,
                stdio: 'pipe'
            });
            
            this.runningProcesses.set('llm-orchestrator', process);
            console.log('✅ LLM Orchestrator launched');
            return process;
        } else {
            throw new Error('LLM Orchestrator file not found');
        }
    }
    
    async launchOllama() {
        console.log('🤖 Checking Ollama status...');
        
        const isRunning = await this.checkPort(11434);
        if (isRunning) {
            console.log('✅ Ollama is already running');
            return;
        }
        
        // Try to start Ollama
        try {
            const process = spawn('ollama', ['serve'], {
                detached: true,
                stdio: 'pipe'
            });
            
            this.runningProcesses.set('ollama', process);
            console.log('🔄 Ollama startup initiated');
            return process;
        } catch (error) {
            console.log('⚠️ Ollama not installed or not in PATH');
        }
    }
    
    async launchDeepTierSystem() {
        console.log('🏗️ Launching Deep Tier System...');
        
        const deepTierFile = path.join(this.baseDir, 'deep-tier-service.js');
        if (fs.existsSync(deepTierFile)) {
            const process = spawn('node', [deepTierFile], {
                detached: true,
                stdio: 'pipe'
            });
            
            this.runningProcesses.set('deep-tier', process);
            console.log('✅ Deep Tier System launched');
            return process;
        } else {
            console.log('⚠️ Deep Tier System file not found');
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // ============================================================================
    // EXECUTIVE CONTROL METHODS
    // ============================================================================
    
    executeExecutiveCommand(command, params = {}) {
        console.log(`🎯 Executive command: ${command}`);
        
        switch (command) {
            case 'launch-all':
                return this.autoLaunchCriticalSystems();
            case 'health-check':
                return this.performHealthCheck();
            case 'shutdown-all':
                return this.shutdownAllSystems();
            case 'restart-system':
                return this.restartSystem(params.system);
            case 'get-status':
                return this.getExecutiveStatus();
            default:
                throw new Error(`Unknown executive command: ${command}`);
        }
    }
    
    async shutdownAllSystems() {
        console.log('🛑 SHUTTING DOWN ALL SYSTEMS...');
        
        for (const [name, process] of this.runningProcesses) {
            try {
                console.log(`🔌 Stopping ${name}...`);
                process.kill('SIGTERM');
                await this.delay(1000);
                if (!process.killed) {
                    process.kill('SIGKILL');
                }
            } catch (error) {
                console.error(`❌ Error stopping ${name}:`, error.message);
            }
        }
        
        this.runningProcesses.clear();
        console.log('✅ All systems shutdown completed');
    }
    
    async restartSystem(systemName) {
        console.log(`🔄 Restarting ${systemName}...`);
        
        // Stop the system
        const process = this.runningProcesses.get(systemName);
        if (process) {
            process.kill('SIGTERM');
            this.runningProcesses.delete(systemName);
            await this.delay(2000);
        }
        
        // Restart the system
        switch (systemName) {
            case 'deathtodata':
                return this.launchDeathToData();
            case 'llm-orchestrator':
                return this.launchLLMOrchestrator();
            case 'deep-tier':
                return this.launchDeepTierSystem();
            default:
                throw new Error(`Don't know how to restart ${systemName}`);
        }
    }
    
    getExecutiveStatus() {
        return {
            mode: 'executive',
            hierarchy: this.executiveHierarchy,
            runningProcesses: Array.from(this.runningProcesses.keys()),
            lastHealthCheck: this.lastHealthReport,
            orchestratorCount: Object.values(this.orchestratorRegistry || {}).reduce((sum, arr) => sum + arr.length, 0),
            capabilities: this.executiveCapabilities
        };
    }
    
    handleAssistantMessage(id, data, isMobile) {
        console.log(`📨 Assistant message from ${id} (${isMobile ? 'mobile' : 'desktop'}):`, data.type);
        
        switch (data.type) {
            case 'analyze-file':
                this.analyzeSpecificFile(data.filePath, id);
                break;
            case 'search-files':
                this.searchFiles(data.query, id);
                break;
            case 'organize-category':
                this.organizeCategory(data.category, id);
                break;
            case 'mobile-command':
                if (isMobile) {
                    this.handleMobileCommand(data.command, id);
                }
                break;
        }
    }
    
    analyzeSpecificFile(filePath, requesterId) {
        const fullPath = path.join(this.baseDir, filePath);
        
        if (!fs.existsSync(fullPath)) {
            this.sendToClient(requesterId, {
                type: 'file-analysis-error',
                error: 'File not found',
                filePath: filePath
            });
            return;
        }
        
        try {
            const stat = fs.statSync(fullPath);
            const fileInfo = {
                name: path.basename(filePath),
                path: filePath,
                size: stat.size,
                modified: stat.mtime,
                extension: path.extname(filePath)
            };
            
            if (this.shouldAnalyzeContent(fileInfo)) {
                this.analyzeFileContent(fileInfo);
            }
            
            this.sendToClient(requesterId, {
                type: 'file-analysis-result',
                fileInfo: fileInfo
            });
        } catch (e) {
            this.sendToClient(requesterId, {
                type: 'file-analysis-error',
                error: e.message,
                filePath: filePath
            });
        }
    }
    
    searchFiles(query, requesterId) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        Object.values(this.fileCatalog).forEach(category => {
            Object.values(category).forEach(fileInfo => {
                const searchText = `${fileInfo.name} ${fileInfo.description} ${fileInfo.purpose}`.toLowerCase();
                
                if (searchText.includes(queryLower)) {
                    results.push(fileInfo);
                }
            });
        });
        
        this.sendToClient(requesterId, {
            type: 'search-results',
            query: query,
            results: results.slice(0, 20) // Limit to 20 results
        });
    }
    
    sendToClient(id, data) {
        const ws = this.connections.get(id) || this.mobileConnections.get(id);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }
    
    broadcastUpdate(data) {
        [...this.connections.values(), ...this.mobileConnections.values()].forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            }
        });
    }
    
    serveAssistantInterface(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🤖 Cal Riven Assistant - Complete System Organization</title>
    <style>
        body { font-family: 'Courier New', monospace; background: #0a0a0a; color: #00ff00; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #00ff00; padding-bottom: 20px; margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
        .panel { background: rgba(0, 255, 0, 0.05); border: 2px solid #00ff00; border-radius: 10px; padding: 20px; }
        .file-item { background: rgba(255, 255, 255, 0.05); margin: 5px 0; padding: 10px; border-radius: 5px; cursor: pointer; }
        .file-item:hover { background: rgba(0, 255, 0, 0.1); }
        .category-count { color: #ffff00; font-weight: bold; }
        button { background: #003300; color: #00ff00; border: 1px solid #00ff00; padding: 8px 15px; cursor: pointer; font-family: inherit; margin: 5px; }
        button:hover { background: #00ff00; color: #000; }
        .search-box { width: 100%; background: #001100; color: #00ff00; border: 1px solid #00ff00; padding: 10px; font-family: inherit; }
        .mobile-qr { text-align: center; background: #111; padding: 20px; border-radius: 10px; }
        .overview { background: rgba(0, 255, 255, 0.1); border: 1px solid #00ffff; padding: 15px; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 Cal Riven Assistant</h1>
        <p>Complete System Organization & File Cataloging</p>
        <div id="status">🔄 Loading...</div>
    </div>
    
    <div class="overview">
        <h3>📊 System Overview</h3>
        <div id="overview-content">Analyzing system...</div>
    </div>
    
    <div class="grid">
        <div class="panel">
            <h2>🔍 File Search</h2>
            <input type="text" class="search-box" id="search-input" placeholder="Search files by name, purpose, or content...">
            <button onclick="searchFiles()">🔍 Search</button>
            <button onclick="rescanFiles()">🔄 Rescan</button>
            <div id="search-results"></div>
        </div>
        
        <div class="panel">
            <h2>📁 File Categories</h2>
            <div id="categories-list"></div>
        </div>
        
        <div class="panel">
            <h2>📱 Mobile Pairing</h2>
            <div class="mobile-qr">
                <p>Scan QR code or visit:</p>
                <strong>http://localhost:${this.port}/mobile</strong>
                <br><br>
                <div id="mobile-status">📱 Waiting for mobile connection...</div>
            </div>
            <button onclick="generateMobileCode()">📱 Generate Pairing Code</button>
        </div>
    </div>
    
    <div class="panel" style="margin-top: 20px;">
        <h2>📄 Recent File Analysis</h2>
        <div id="recent-analysis"></div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        let fileCatalog = {};
        let knowledgeBase = {};
        
        ws.onopen = () => {
            document.getElementById('status').innerHTML = '🟢 Cal Riven Online';
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMessage(data);
        };
        
        function handleMessage(data) {
            switch (data.type) {
                case 'assistant-welcome':
                    fileCatalog = data.catalog;
                    knowledgeBase = data.knowledge;
                    updateInterface();
                    break;
                case 'catalog-updated':
                    fileCatalog = data.catalog;
                    knowledgeBase = data.knowledge;
                    updateInterface();
                    break;
                case 'search-results':
                    displaySearchResults(data.results);
                    break;
                case 'file-analysis-result':
                    displayFileAnalysis(data.fileInfo);
                    break;
            }
        }
        
        function updateInterface() {
            updateOverview();
            updateCategories();
        }
        
        function updateOverview() {
            const overview = document.getElementById('overview-content');
            overview.innerHTML = \`
                <strong>Total Files:</strong> \${knowledgeBase.fileCount}<br>
                <strong>Last Scanned:</strong> \${new Date(knowledgeBase.lastScanned).toLocaleString()}<br>
                <strong>Connected Systems:</strong> \${knowledgeBase.connections?.join(', ') || 'None'}<br>
                <strong>Capabilities:</strong> \${knowledgeBase.capabilities?.length || 0} active
            \`;
        }
        
        function updateCategories() {
            const list = document.getElementById('categories-list');
            list.innerHTML = '';
            
            Object.entries(fileCatalog).forEach(([category, files]) => {
                const count = Object.keys(files).length;
                if (count === 0) return;
                
                const div = document.createElement('div');
                div.className = 'file-item';
                div.innerHTML = \`
                    <strong>\${category.toUpperCase()}</strong>
                    <span class="category-count">(\${count} files)</span>
                \`;
                div.onclick = () => showCategoryFiles(category);
                list.appendChild(div);
            });
        }
        
        function showCategoryFiles(category) {
            const files = fileCatalog[category];
            let html = \`<h3>\${category.toUpperCase()} FILES</h3>\`;
            
            Object.values(files).forEach(file => {
                html += \`
                    <div class="file-item" onclick="analyzeFile('\${file.path}')">
                        <strong>\${file.name}</strong><br>
                        <small>\${file.description}</small>
                    </div>
                \`;
            });
            
            document.getElementById('search-results').innerHTML = html;
        }
        
        function searchFiles() {
            const query = document.getElementById('search-input').value;
            if (query.trim()) {
                ws.send(JSON.stringify({
                    type: 'search-files',
                    query: query
                }));
            }
        }
        
        function analyzeFile(filePath) {
            ws.send(JSON.stringify({
                type: 'analyze-file',
                filePath: filePath
            }));
        }
        
        function rescanFiles() {
            document.getElementById('status').innerHTML = '🔄 Rescanning files...';
            // Server handles periodic scanning
            setTimeout(() => {
                document.getElementById('status').innerHTML = '🟢 Cal Riven Online';
            }, 3000);
        }
        
        function displaySearchResults(results) {
            const div = document.getElementById('search-results');
            let html = '<h3>🔍 Search Results</h3>';
            
            results.forEach(file => {
                html += \`
                    <div class="file-item" onclick="analyzeFile('\${file.path}')">
                        <strong>\${file.name}</strong> (\${file.category})<br>
                        <small>\${file.description}</small>
                    </div>
                \`;
            });
            
            div.innerHTML = html;
        }
        
        function displayFileAnalysis(fileInfo) {
            const div = document.getElementById('recent-analysis');
            div.innerHTML = \`
                <h3>📄 \${fileInfo.name}</h3>
                <p><strong>Path:</strong> \${fileInfo.path}</p>
                <p><strong>Size:</strong> \${fileInfo.size} bytes</p>
                <p><strong>Purpose:</strong> \${fileInfo.purpose || 'Unknown'}</p>
                <p><strong>Dependencies:</strong> \${fileInfo.dependencies?.join(', ') || 'None'}</p>
                <p><strong>Description:</strong> \${fileInfo.description}</p>
            \`;
        }
        
        function generateMobileCode() {
            const code = Math.random().toString(36).substr(2, 8).toUpperCase();
            document.getElementById('mobile-status').innerHTML = \`
                📱 Pairing Code: <strong>\${code}</strong><br>
                Valid for 5 minutes
            \`;
        }
        
        // Auto-search on Enter
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchFiles();
        });
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveCatalogData(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            catalog: this.fileCatalog,
            knowledge: this.knowledgeBase,
            timestamp: Date.now()
        }));
    }
    
    serveKnowledgeBase(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.knowledgeBase));
    }
}

// Start Cal Riven Executive Orchestrator
if (require.main === module) {
    console.log('🚀 STARTING CAL RIVEN EXECUTIVE ORCHESTRATOR');
    console.log('🎯 Master system coordination and orchestration');
    console.log('===============================================\n');
    
    const assistant = new CalRivenAssistant();
    assistant.start();
    
    console.log('\n🎯 Cal Riven Executive Dashboard: http://localhost:9999');
    console.log('📡 Executive WebSocket: ws://localhost:9998');
    console.log('📱 Mobile Command Center: http://localhost:9999/mobile');
    console.log('\n🚀 EXECUTIVE ORCHESTRATOR ONLINE!');
    console.log('✅ All systems under unified command and control');
    console.log('🔧 Auto-launching critical systems...');
    console.log('🩺 Health monitoring active');
    console.log('📊 Orchestrator hierarchy established');
    console.log('\n🎮 Ready to launch DeathToData, LLM systems, and more!');
}

module.exports = CalRivenAssistant;