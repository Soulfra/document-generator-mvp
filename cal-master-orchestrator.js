#!/usr/bin/env node
/**
 * 🎭🤖 CAL MASTER ORCHESTRATOR
 * 
 * The central hub that connects all CAL systems and provides natural language interface
 * Integrates with existing CAL orchestration systems in the codebase
 * 
 * Features:
 * - Natural language commands to CAL
 * - Integration with existing CAL orchestration systems
 * - Unified interface for all CAL operations
 * - Real-time WebSocket API for live interactions
 * - Connection to Obsidian vault and component systems
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const path = require('path');

// Import CAL systems
const CalVaultReader = require('./cal-vault-reader.js');
const CalKnowledgeProcessor = require('./cal-knowledge-processor.js');
const CalComponentPackager = require('./cal-component-packager.js');
const CalDecisionEngine = require('./cal-decision-engine.js');

class CalMasterOrchestrator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 3336,
            wsPort: config.wsPort || 8083,
            enableWebInterface: config.enableWebInterface !== false,
            enableNaturalLanguage: config.enableNaturalLanguage !== false,
            integrationPorts: config.integrationPorts || [3333, 3334, 3335, 8082],
            autoDecisionMode: config.autoDecisionMode !== false,
            ...config
        };
        
        // Core CAL systems
        this.vaultReader = new CalVaultReader(config);
        this.knowledgeProcessor = new CalKnowledgeProcessor(config);
        this.componentPackager = new CalComponentPackager(config);
        this.decisionEngine = new CalDecisionEngine({ ...config, autoMode: false });
        
        // Integration with existing CAL systems
        this.existingCalConnections = new Map();
        this.integrationStatus = new Map();
        
        // WebSocket and HTTP servers
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = null;
        this.activeConnections = new Set();
        
        // Natural language processing
        this.conversationHistory = [];
        this.userSessions = new Map();
        
        // Command registry
        this.commands = new Map();
        this.setupCommands();
        
        // Statistics
        this.stats = {
            uptime: Date.now(),
            commandsProcessed: 0,
            packagesCreated: 0,
            decisionsMode: 0,
            connectionsActive: 0,
            integrationsConnected: 0
        };
        
        console.log('🎭 CAL Master Orchestrator initialized');
        console.log(`🌐 HTTP: http://localhost:${this.config.port}`);
        console.log(`🔌 WebSocket: ws://localhost:${this.config.wsPort}`);
    }
    
    /**
     * Initialize the master orchestrator
     */
    async initialize() {
        console.log('🔄 Initializing CAL Master Orchestrator...');
        
        try {
            // Initialize all CAL systems
            await this.vaultReader.initialize();
            await this.knowledgeProcessor.initialize();
            await this.componentPackager.initialize();
            await this.decisionEngine.initialize();
            
            // Setup web interface
            if (this.config.enableWebInterface) {
                await this.setupWebInterface();
            }
            
            // Setup WebSocket server
            await this.setupWebSocketServer();
            
            // Connect to existing CAL orchestration systems
            await this.connectToExistingCal();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start HTTP server
            this.server.listen(this.config.port, () => {
                console.log(`✅ CAL Master Orchestrator ready!`);
                console.log(`🌐 Web interface: http://localhost:${this.config.port}`);
                console.log(`🔌 WebSocket API: ws://localhost:${this.config.wsPort}`);
            });
            
            this.emit('ready', this.stats);
            return this;
            
        } catch (error) {
            console.error('❌ Failed to initialize Master Orchestrator:', error);
            throw error;
        }
    }
    
    /**
     * Process natural language command
     */
    async processCommand(command, sessionId = 'default', context = {}) {
        const startTime = Date.now();
        console.log(`🤖 CAL Command: "${command}"`);
        
        this.stats.commandsProcessed++;
        
        // Add to conversation history
        const conversation = {
            id: this.generateMessageId(),
            sessionId,
            timestamp: new Date(),
            input: command,
            context,
            response: null,
            processingTime: 0
        };
        
        try {
            // Parse the command
            const parsed = this.parseNaturalLanguageCommand(command);
            
            // Execute the command
            const response = await this.executeCommand(parsed, sessionId, context);
            
            // Complete conversation record
            conversation.response = response;
            conversation.processingTime = Date.now() - startTime;
            conversation.success = true;
            
            this.conversationHistory.push(conversation);
            
            // Broadcast to connected clients
            this.broadcast('command_response', {
                sessionId,
                command,
                response,
                processingTime: conversation.processingTime
            });
            
            console.log(`✅ Command completed in ${conversation.processingTime}ms`);
            
            this.emit('command_completed', conversation);
            
            return response;
            
        } catch (error) {
            conversation.response = {
                success: false,
                error: error.message,
                suggestion: this.suggestAlternativeCommand(command)
            };
            conversation.processingTime = Date.now() - startTime;
            conversation.success = false;
            
            this.conversationHistory.push(conversation);
            
            console.error(`❌ Command failed after ${conversation.processingTime}ms:`, error.message);
            
            this.emit('command_failed', conversation);
            
            return conversation.response;
        }
    }
    
    /**
     * Parse natural language command into structured format
     */
    parseNaturalLanguageCommand(command) {
        const lowerCommand = command.toLowerCase();
        
        // Intent detection
        let intent = 'unknown';
        let entities = {};
        
        if (lowerCommand.includes('build') || lowerCommand.includes('create') || lowerCommand.includes('package')) {
            intent = 'build';
            entities.target = this.extractBuildTarget(command);
        } else if (lowerCommand.includes('find') || lowerCommand.includes('search') || lowerCommand.includes('show')) {
            intent = 'search';
            entities.query = this.extractSearchQuery(command);
        } else if (lowerCommand.includes('status') || lowerCommand.includes('health') || lowerCommand.includes('check')) {
            intent = 'status';
        } else if (lowerCommand.includes('decide') || lowerCommand.includes('recommend')) {
            intent = 'decide';
        } else if (lowerCommand.includes('connect') || lowerCommand.includes('integrate')) {
            intent = 'integrate';
            entities.components = this.extractComponents(command);
        }
        
        return {
            intent,
            entities,
            originalCommand: command,
            confidence: this.calculateParsingConfidence(intent, entities)
        };
    }
    
    /**
     * Execute parsed command
     */
    async executeCommand(parsed, sessionId, context) {
        switch (parsed.intent) {
            case 'build':
                return await this.handleBuildCommand(parsed, sessionId, context);
            
            case 'search':
                return await this.handleSearchCommand(parsed, sessionId, context);
            
            case 'status':
                return await this.handleStatusCommand(parsed, sessionId, context);
            
            case 'decide':
                return await this.handleDecideCommand(parsed, sessionId, context);
            
            case 'integrate':
                return await this.handleIntegrateCommand(parsed, sessionId, context);
            
            default:
                return {
                    success: false,
                    message: `I don't understand the command "${parsed.originalCommand}". Try commands like:`,
                    suggestions: [
                        'build auth system',
                        'find all api endpoints',
                        'show status',
                        'make a decision',
                        'search for gaming components'
                    ]
                };
        }
    }
    
    /**
     * Handle build commands
     */
    async handleBuildCommand(parsed, sessionId, context) {
        const target = parsed.entities.target;
        
        if (!target) {
            // Ask CAL decision engine what to build
            const decision = await this.decisionEngine.makeDecision(context);
            
            if (decision.candidate) {
                const result = await this.decisionEngine.executeDecision(decision);
                
                if (result.success) {
                    this.stats.packagesCreated++;
                    return {
                        success: true,
                        message: `Built ${result.result.name} successfully!`,
                        result: result.result,
                        buildTime: result.buildTime,
                        decision: decision.reasoning
                    };
                } else {
                    return {
                        success: false,
                        message: `Build failed: ${result.error}`,
                        suggestion: 'Try building a smaller component first'
                    };
                }
            } else {
                return {
                    success: false,
                    message: 'No suitable components found to build right now',
                    suggestion: 'Try "find buildable components" to see what\'s available'
                };
            }
        } else {
            // Build specific target
            const components = this.knowledgeProcessor.getBuildableComponents();
            const targetComponent = components.find(c => 
                c.id.includes(target) || c.name.toLowerCase().includes(target)
            );
            
            if (targetComponent) {
                const result = await this.componentPackager.createPackage(targetComponent.id);
                this.stats.packagesCreated++;
                
                return {
                    success: true,
                    message: `Built ${result.name} package successfully!`,
                    result,
                    fileCount: targetComponent.files.length,
                    confidence: Math.round(targetComponent.confidence * 100)
                };
            } else {
                return {
                    success: false,
                    message: `Could not find component matching "${target}"`,
                    suggestion: `Try "find ${target}" to see available options`
                };
            }
        }
    }
    
    /**
     * Handle search commands
     */
    async handleSearchCommand(parsed, sessionId, context) {
        const query = parsed.entities.query || parsed.originalCommand;
        
        const searchResult = await this.vaultReader.query(query, { sessionId });
        
        return {
            success: true,
            message: `Found ${searchResult.files.length} files matching "${query}"`,
            files: searchResult.files.slice(0, 10), // Top 10 results
            totalFound: searchResult.files.length,
            suggestions: searchResult.suggestions,
            intent: searchResult.intent
        };
    }
    
    /**
     * Handle status commands
     */
    async handleStatusCommand(parsed, sessionId, context) {
        const vaultStats = this.vaultReader.getStats();
        const knowledgeStats = this.knowledgeProcessor.getStats();
        const packagerStats = this.componentPackager.getStats();
        const decisionStats = this.decisionEngine.getStatus();
        
        return {
            success: true,
            message: 'CAL Master Orchestrator Status',
            uptime: Date.now() - this.stats.uptime,
            vault: {
                totalFiles: vaultStats.filesIndexed,
                categories: vaultStats.categoriesLoaded,
                queriesProcessed: vaultStats.queriesProcessed || 0
            },
            knowledge: {
                componentsFound: knowledgeStats.componentsFound,
                patternsIdentified: knowledgeStats.patternsIdentified,
                buildablePackages: knowledgeStats.buildablePackages
            },
            packaging: {
                packagesCreated: packagerStats.packagesCreated,
                frontendPackages: packagerStats.frontendPackages,
                backendPackages: packagerStats.backendPackages
            },
            decisions: {
                decisionsTodate: decisionStats.stats.decisionsTodate,
                successfulBuilds: decisionStats.stats.successfulBuilds,
                failedBuilds: decisionStats.stats.failedBuilds,
                activeBuildsCubes: decisionStats.activeBuildsCubes
            },
            integrations: {
                existingCalConnections: this.existingCalConnections.size,
                activeWebSocketConnections: this.activeConnections.size
            }
        };
    }
    
    /**
     * Handle decision commands
     */
    async handleDecideCommand(parsed, sessionId, context) {
        const decision = await this.decisionEngine.makeDecision(context);
        
        if (decision.candidate) {
            return {
                success: true,
                message: 'CAL recommends this action:',
                decision: decision.candidate.description,
                confidence: Math.round(decision.confidence * 100),
                reasoning: decision.reasoning,
                estimatedEffort: decision.candidate.estimated_effort,
                canExecute: true
            };
        } else {
            return {
                success: true,
                message: 'No immediate action recommended',
                reason: 'No suitable build candidates or resource constraints',
                suggestion: 'Check system status or try searching for buildable components'
            };
        }
    }
    
    /**
     * Setup web interface
     */
    async setupWebInterface() {
        // Serve static files
        this.app.use(express.static(path.join(__dirname, 'public')));
        this.app.use(express.json());
        
        // API endpoints
        this.app.post('/api/command', async (req, res) => {
            try {
                const { command, sessionId, context } = req.body;
                const response = await this.processCommand(command, sessionId, context);
                res.json(response);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/status', async (req, res) => {
            const status = await this.handleStatusCommand({}, 'api', {});
            res.json(status);
        });
        
        this.app.get('/api/components', (req, res) => {
            const components = this.knowledgeProcessor.getBuildableComponents();
            res.json(components);
        });
        
        this.app.get('/api/packages', (req, res) => {
            const packages = this.componentPackager.getCreatedPackages();
            res.json(packages);
        });
        
        // Main interface
        this.app.get('/', (req, res) => {
            res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>CAL Master Orchestrator</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .command-input { width: 100%; padding: 15px; font-size: 16px; border: 2px solid #007AFF; border-radius: 8px; margin-bottom: 20px; }
        .response { background: #f5f5f7; padding: 15px; border-radius: 8px; margin-bottom: 15px; }
        .success { border-left: 4px solid #34C759; }
        .error { border-left: 4px solid #FF3B30; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; }
        .stat-card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #007AFF; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🤖 CAL Master Orchestrator</h1>
        <p>Natural Language Interface for AI-Powered Component Generation</p>
    </div>
    
    <input type="text" id="commandInput" class="command-input" placeholder="Ask CAL something... (e.g., 'build auth system', 'find all APIs', 'show status')" />
    
    <div id="responses"></div>
    
    <div class="stats" id="stats"></div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.config.wsPort}');
        const commandInput = document.getElementById('commandInput');
        const responses = document.getElementById('responses');
        const statsDiv = document.getElementById('stats');
        
        // Handle WebSocket messages
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'command_response') {
                displayResponse(data.data.response);
            }
        };
        
        // Handle command input
        commandInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const command = commandInput.value.trim();
                if (command) {
                    commandInput.value = '';
                    await sendCommand(command);
                }
            }
        });
        
        async function sendCommand(command) {
            try {
                const response = await fetch('/api/command', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command, sessionId: 'web-interface' })
                });
                
                const result = await response.json();
                displayResponse(result);
            } catch (error) {
                displayResponse({ success: false, message: error.message });
            }
        }
        
        function displayResponse(response) {
            const div = document.createElement('div');
            div.className = 'response ' + (response.success ? 'success' : 'error');
            
            let content = '<strong>' + (response.success ? '✅' : '❌') + ' ' + response.message + '</strong>';
            
            if (response.result) {
                content += '<br><small>Package: ' + response.result.name + '</small>';
            }
            
            if (response.files && response.files.length > 0) {
                content += '<br><small>Top files: ' + response.files.slice(0, 3).map(f => f.name).join(', ') + '</small>';
            }
            
            if (response.decision) {
                content += '<br><small>Decision: ' + response.decision + '</small>';
            }
            
            div.innerHTML = content;
            responses.insertBefore(div, responses.firstChild);
            
            // Keep only last 10 responses
            while (responses.children.length > 10) {
                responses.removeChild(responses.lastChild);
            }
        }
        
        // Load initial stats
        async function loadStats() {
            try {
                const response = await fetch('/api/status');
                const status = await response.json();
                
                statsDiv.innerHTML = \`
                    <div class="stat-card">
                        <div class="stat-number">\${status.vault.totalFiles}</div>
                        <div>Files in Vault</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">\${status.knowledge.componentsFound}</div>
                        <div>Buildable Components</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">\${status.packaging.packagesCreated}</div>
                        <div>Packages Created</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">\${status.decisions.decisionsTodate}</div>
                        <div>Decisions Made</div>
                    </div>
                \`;
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }
        
        loadStats();
        setInterval(loadStats, 30000); // Update every 30 seconds
    </script>
</body>
</html>
            `);
        });
    }
    
    /**
     * Setup WebSocket server
     */
    async setupWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 New WebSocket connection');
            this.activeConnections.add(ws);
            this.stats.connectionsActive = this.activeConnections.size;
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                message: 'Connected to CAL Master Orchestrator',
                capabilities: ['command', 'status', 'build', 'search']
            }));
            
            // Handle incoming messages
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    
                    if (data.type === 'command') {
                        const response = await this.processCommand(
                            data.command, 
                            data.sessionId || 'websocket', 
                            data.context || {}
                        );
                        
                        ws.send(JSON.stringify({
                            type: 'command_response',
                            id: data.id,
                            response
                        }));
                    }
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: error.message
                    }));
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 WebSocket connection closed');
                this.activeConnections.delete(ws);
                this.stats.connectionsActive = this.activeConnections.size;
            });
        });
        
        console.log(`🔌 WebSocket server started on port ${this.config.wsPort}`);
    }
    
    /**
     * Connect to existing CAL orchestration systems
     */
    async connectToExistingCal() {
        console.log('🔗 Connecting to existing CAL systems...');
        
        // Try to connect to existing CAL orchestration ports
        for (const port of this.config.integrationPorts) {
            try {
                const connection = await this.attemptCalConnection(port);
                if (connection) {
                    this.existingCalConnections.set(port, connection);
                    this.integrationStatus.set(port, 'connected');
                    console.log(`✅ Connected to existing CAL system on port ${port}`);
                }
            } catch (error) {
                this.integrationStatus.set(port, 'failed');
                console.log(`⚠️  Could not connect to CAL system on port ${port}: ${error.message}`);
            }
        }
        
        this.stats.integrationsConnected = this.existingCalConnections.size;
        console.log(`🔗 Connected to ${this.stats.integrationsConnected} existing CAL systems`);
    }
    
    /**
     * Setup command registry
     */
    setupCommands() {
        this.commands.set('help', {
            description: 'Show available commands',
            handler: () => ({
                success: true,
                message: 'Available CAL commands:',
                commands: [
                    'build [component] - Build a component package',
                    'find [query] - Search vault for files',
                    'show status - Display system status', 
                    'make decision - Get AI recommendation',
                    'list components - Show buildable components',
                    'help - Show this help message'
                ]
            })
        });
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen to component packager events
        this.componentPackager.on('package_created', (packageInfo) => {
            this.broadcast('package_created', packageInfo);
        });
        
        // Listen to decision engine events  
        this.decisionEngine.on('decision', (decision) => {
            this.broadcast('decision_made', decision);
        });
        
        // Listen to knowledge processor events
        this.knowledgeProcessor.on('analysis_complete', (analysis) => {
            this.broadcast('analysis_complete', analysis);
        });
    }
    
    /**
     * Broadcast message to all connected clients
     */
    broadcast(type, data) {
        const message = JSON.stringify({ type, data, timestamp: new Date() });
        
        for (const ws of this.activeConnections) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        }
    }
    
    /**
     * Utility functions
     */
    extractBuildTarget(command) {
        const patterns = [
            /build (?:a |an |the )?([a-z-_\s]+?)(?:\s|$)/i,
            /create (?:a |an |the )?([a-z-_\s]+?)(?:\s|$)/i,
            /package (?:the )?([a-z-_\s]+?)(?:\s|$)/i
        ];
        
        for (const pattern of patterns) {
            const match = command.match(pattern);
            if (match) {
                return match[1].trim().replace(/\s+/g, '-');
            }
        }
        
        return null;
    }
    
    extractSearchQuery(command) {
        const patterns = [
            /find (.+)/i,
            /search (?:for )?(.+)/i,
            /show (?:me )?(.+)/i
        ];
        
        for (const pattern of patterns) {
            const match = command.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        
        return command;
    }
    
    extractComponents(command) {
        // This would extract component names from integration commands
        return [];
    }
    
    calculateParsingConfidence(intent, entities) {
        if (intent === 'unknown') return 0.3;
        
        let confidence = 0.7;
        
        if (Object.keys(entities).length > 0) {
            confidence += 0.2;
        }
        
        return Math.min(confidence, 1.0);
    }
    
    suggestAlternativeCommand(command) {
        // Simple suggestion based on keywords
        if (command.includes('build') || command.includes('create')) {
            return 'Try "build auth system" or "make decision"';
        } else if (command.includes('find') || command.includes('search')) {
            return 'Try "find api endpoints" or "search gaming"';
        } else {
            return 'Try "help" to see available commands';
        }
    }
    
    async attemptCalConnection(port) {
        // This would attempt to connect to existing CAL systems
        // For now, just return null (no connection)
        return null;
    }
    
    generateMessageId() {
        return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    
    /**
     * Get current status
     */
    getStatus() {
        return {
            stats: this.stats,
            activeConnections: this.activeConnections.size,
            integrations: this.existingCalConnections.size,
            uptime: Date.now() - this.stats.uptime,
            recentCommands: this.conversationHistory.slice(-10)
        };
    }
}

// CLI interface and startup
if (require.main === module) {
    const orchestrator = new CalMasterOrchestrator();
    
    orchestrator.initialize()
        .then(() => {
            console.log(`
🎭 CAL Master Orchestrator is ready!

Try these commands:
  🌐 Web Interface: http://localhost:${orchestrator.config.port}
  🔌 WebSocket: ws://localhost:${orchestrator.config.wsPort}

Example natural language commands:
  "build auth system"
  "find all API endpoints" 
  "show system status"
  "make a decision"
  "search for gaming components"
            `);
        })
        .catch(error => {
            console.error('❌ Failed to start CAL Master Orchestrator:', error);
            process.exit(1);
        });
}

module.exports = CalMasterOrchestrator;