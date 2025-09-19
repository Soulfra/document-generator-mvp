#!/usr/bin/env node

/**
 * CAL Chat Interface
 * 
 * Discord-style conversational interface for domain-based development.
 * Talk to CAL naturally and watch as complete projects materialize.
 * 
 * Features:
 * - Natural language chat interface
 * - Real-time WebSocket communication
 * - Domain management through conversation
 * - Automatic plugin scaffolding
 * - VC pitch generation
 * - Context-aware responses
 * - Live progress updates
 */

const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');
const EventEmitter = require('events');

class CALChatInterface extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 9090,
            wsPort: config.wsPort || 9091,
            
            // Integration with other CAL services
            calMasterUrl: config.calMasterUrl || 'http://localhost:3336',
            domainManagerUrl: config.domainManagerUrl || 'http://localhost:9092',
            pluginScaffolderUrl: config.pluginScaffolderUrl || 'http://localhost:9093',
            pitchGeneratorUrl: config.pitchGeneratorUrl || 'http://localhost:9094',
            conversationOrchestratorUrl: config.conversationOrchestratorUrl || 'http://localhost:9095',
            
            // Chat settings
            maxMessageHistory: 1000,
            typingIndicatorDelay: 500,
            autoSaveInterval: 30000, // 30 seconds
            
            // User preferences
            defaultTheme: 'dark',
            enableSoundEffects: true,
            enableNotifications: true,
            
            ...config
        };
        
        // Core components
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = null;
        
        // Chat state
        this.conversations = new Map(); // conversationId -> messages
        this.activeUsers = new Map();   // userId -> user info
        this.typingUsers = new Set();   // users currently typing
        this.projectStates = new Map(); // projectId -> project state
        
        // WebSocket connections
        this.wsClients = new Map(); // ws -> client info
        
        // Command handlers
        this.commandHandlers = new Map();
        this.setupCommandHandlers();
        
        // Statistics
        this.stats = {
            messagesProcessed: 0,
            projectsCreated: 0,
            domainsManaged: 0,
            pluginsScaffolded: 0,
            pitchesGenerated: 0,
            uptime: Date.now()
        };
    }
    
    async start() {
        console.log('💬 CAL CHAT INTERFACE STARTING');
        console.log('==============================');
        console.log('');
        console.log('🎯 Natural language development environment');
        console.log('🌐 Chat with CAL to build complete projects');
        console.log('🚀 From domain to deployment in minutes');
        console.log('');
        
        // Setup middleware
        this.setupMiddleware();
        
        // Setup routes
        this.setupRoutes();
        
        // Setup WebSocket server
        await this.setupWebSocketServer();
        
        // Initialize conversation system
        this.initializeConversationSystem();
        
        // Start server
        this.server.listen(this.config.port, () => {
            console.log(`✅ CAL Chat Interface ready!`);
            console.log(`🌐 Web UI: http://localhost:${this.config.port}`);
            console.log(`💬 WebSocket: ws://localhost:${this.config.wsPort}`);
            console.log('');
            console.log('📝 Example commands:');
            console.log('   "Hey CAL, I want to build a SaaS for X"');
            console.log('   "Load my domain example.com"');
            console.log('   "Create a WordPress plugin for analytics"');
            console.log('   "Generate a pitch deck for investors"');
            console.log('');
        });
        
        // Start auto-save
        this.startAutoSave();
        
        this.emit('started', { port: this.config.port });
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));
        
        // CORS for API access
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            next();
        });
    }
    
    setupRoutes() {
        // Main chat interface
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'cal-chat-dashboard.html'));
        });
        
        // API endpoints
        this.app.post('/api/message', this.handleMessageAPI.bind(this));
        this.app.get('/api/conversations/:id', this.getConversation.bind(this));
        this.app.get('/api/projects', this.getProjects.bind(this));
        this.app.get('/api/stats', this.getStats.bind(this));
        this.app.post('/api/upload', this.handleUpload.bind(this));
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                service: 'cal-chat-interface',
                uptime: Date.now() - this.stats.uptime,
                connections: this.wsClients.size
            });
        });
    }
    
    async setupWebSocketServer() {
        const wsServer = http.createServer();
        this.wss = new WebSocket.Server({ server: wsServer });
        
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            const clientInfo = {
                id: clientId,
                connectedAt: new Date(),
                userId: null,
                conversationId: null
            };
            
            this.wsClients.set(ws, clientInfo);
            console.log(`🔌 New chat connection: ${clientId}`);
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                data: {
                    clientId,
                    message: "👋 Hey! I'm CAL. Tell me about your project idea and I'll help you build it!",
                    capabilities: [
                        'Domain management',
                        'Plugin scaffolding',
                        'Full-stack development',
                        'VC pitch generation',
                        'Deployment automation'
                    ]
                }
            }));
            
            ws.on('message', (message) => {
                this.handleWebSocketMessage(ws, message);
            });
            
            ws.on('close', () => {
                this.handleDisconnect(ws);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });
        
        wsServer.listen(this.config.wsPort, () => {
            console.log(`🔌 WebSocket server listening on port ${this.config.wsPort}`);
        });
    }
    
    setupCommandHandlers() {
        // Domain commands
        this.commandHandlers.set('load-domain', this.handleLoadDomain.bind(this));
        this.commandHandlers.set('configure-domain', this.handleConfigureDomain.bind(this));
        this.commandHandlers.set('list-domains', this.handleListDomains.bind(this));
        
        // Project commands
        this.commandHandlers.set('create-project', this.handleCreateProject.bind(this));
        this.commandHandlers.set('scaffold-plugin', this.handleScaffoldPlugin.bind(this));
        this.commandHandlers.set('generate-api', this.handleGenerateAPI.bind(this));
        
        // Business commands
        this.commandHandlers.set('generate-pitch', this.handleGeneratePitch.bind(this));
        this.commandHandlers.set('create-demo', this.handleCreateDemo.bind(this));
        this.commandHandlers.set('export-project', this.handleExportProject.bind(this));
        
        // Development commands
        this.commandHandlers.set('deploy', this.handleDeploy.bind(this));
        this.commandHandlers.set('run-tests', this.handleRunTests.bind(this));
        this.commandHandlers.set('generate-docs', this.handleGenerateDocs.bind(this));
    }
    
    async handleWebSocketMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            const client = this.wsClients.get(ws);
            
            switch (data.type) {
                case 'message':
                    await this.processUserMessage(ws, data);
                    break;
                    
                case 'typing':
                    this.handleTypingIndicator(ws, data);
                    break;
                    
                case 'join-conversation':
                    await this.joinConversation(ws, data);
                    break;
                    
                case 'command':
                    await this.processCommand(ws, data);
                    break;
                    
                case 'upload':
                    await this.processUpload(ws, data);
                    break;
                    
                default:
                    console.log(`Unknown message type: ${data.type}`);
            }
            
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Failed to process message', error: error.message }
            }));
        }
    }
    
    async processUserMessage(ws, data) {
        const client = this.wsClients.get(ws);
        const { message, conversationId } = data.data;
        
        console.log(`💬 User message: "${message}"`);
        this.stats.messagesProcessed++;
        
        // Add to conversation history
        if (!this.conversations.has(conversationId)) {
            this.conversations.set(conversationId, []);
        }
        
        const userMessage = {
            id: this.generateMessageId(),
            userId: client.userId || 'user',
            content: message,
            timestamp: new Date(),
            type: 'user'
        };
        
        this.conversations.get(conversationId).push(userMessage);
        
        // Broadcast user message to other clients
        this.broadcastToConversation(conversationId, {
            type: 'new-message',
            data: userMessage
        }, ws);
        
        // Process with CAL
        const response = await this.processWithCAL(message, conversationId);
        
        // Add CAL's response to conversation
        const calMessage = {
            id: this.generateMessageId(),
            userId: 'cal',
            content: response.message,
            timestamp: new Date(),
            type: 'assistant',
            actions: response.actions,
            metadata: response.metadata
        };
        
        this.conversations.get(conversationId).push(calMessage);
        
        // Send response
        this.broadcastToConversation(conversationId, {
            type: 'new-message',
            data: calMessage
        });
        
        // Execute any actions
        if (response.actions && response.actions.length > 0) {
            for (const action of response.actions) {
                await this.executeAction(conversationId, action);
            }
        }
    }
    
    async processWithCAL(message, conversationId) {
        // Analyze message intent
        const intent = this.analyzeIntent(message);
        console.log(`🧠 Detected intent: ${intent.type}`);
        
        let response = {
            message: '',
            actions: [],
            metadata: {}
        };
        
        switch (intent.type) {
            case 'create-project':
                response = await this.handleProjectCreation(intent, conversationId);
                break;
                
            case 'domain-management':
                response = await this.handleDomainManagement(intent, conversationId);
                break;
                
            case 'plugin-request':
                response = await this.handlePluginRequest(intent, conversationId);
                break;
                
            case 'pitch-request':
                response = await this.handlePitchRequest(intent, conversationId);
                break;
                
            case 'general-help':
                response = await this.handleGeneralHelp(intent, conversationId);
                break;
                
            default:
                response = await this.handleGeneralConversation(message, conversationId);
        }
        
        return response;
    }
    
    analyzeIntent(message) {
        const lower = message.toLowerCase();
        
        // Project creation patterns
        if (lower.includes('build') || lower.includes('create') || lower.includes('make') || 
            lower.includes('want to') || lower.includes('need')) {
            
            if (lower.includes('saas') || lower.includes('app') || lower.includes('platform') ||
                lower.includes('website') || lower.includes('service')) {
                return { type: 'create-project', projectType: this.extractProjectType(message) };
            }
        }
        
        // Domain patterns
        if (lower.includes('domain') || lower.includes('.com') || lower.includes('.io') ||
            lower.includes('dns') || lower.includes('ssl')) {
            return { type: 'domain-management', domain: this.extractDomain(message) };
        }
        
        // Plugin patterns
        if (lower.includes('plugin') || lower.includes('extension') || lower.includes('addon') ||
            lower.includes('integration')) {
            return { type: 'plugin-request', platform: this.extractPlatform(message) };
        }
        
        // Pitch patterns
        if (lower.includes('pitch') || lower.includes('investor') || lower.includes('vc') ||
            lower.includes('presentation') || lower.includes('deck')) {
            return { type: 'pitch-request' };
        }
        
        // Help patterns
        if (lower.includes('help') || lower.includes('how') || lower.includes('what can')) {
            return { type: 'general-help' };
        }
        
        return { type: 'general-conversation' };
    }
    
    async handleProjectCreation(intent, conversationId) {
        const projectId = this.generateProjectId();
        const projectType = intent.projectType || 'web-app';
        
        // Create project state
        this.projectStates.set(projectId, {
            id: projectId,
            conversationId,
            type: projectType,
            status: 'initializing',
            createdAt: new Date(),
            components: [],
            domain: null,
            deployments: []
        });
        
        this.stats.projectsCreated++;
        
        return {
            message: `Awesome! Let's build your ${projectType} together! 🚀\n\nI'll help you create everything from scratch. First, let me ask a few questions:\n\n1. What's the main purpose of your ${projectType}?\n2. Who's your target audience?\n3. Do you have a domain ready, or should I help you find one?\n4. Any specific features you want to include?`,
            actions: [{
                type: 'create-project',
                projectId,
                projectType
            }],
            metadata: {
                projectId,
                stage: 'requirements-gathering'
            }
        };
    }
    
    async handleDomainManagement(intent, conversationId) {
        const domain = intent.domain;
        
        if (!domain) {
            return {
                message: "I can help you manage domains! What domain would you like to work with? You can say something like:\n- 'Load mydomain.com'\n- 'Configure SSL for example.io'\n- 'Show me my domains'",
                actions: [],
                metadata: { needsDomain: true }
            };
        }
        
        this.stats.domainsManaged++;
        
        return {
            message: `Great! I'll set up ${domain} for you. 🌐\n\nConfiguring:\n✅ DNS records\n✅ SSL certificate\n✅ Subdomain routing\n✅ CDN integration\n\nThis will take just a moment...`,
            actions: [{
                type: 'configure-domain',
                domain,
                settings: {
                    ssl: true,
                    cdn: true,
                    subdomains: ['www', 'api', 'admin', 'docs']
                }
            }],
            metadata: { domain }
        };
    }
    
    async handlePluginRequest(intent, conversationId) {
        const platform = intent.platform || 'wordpress';
        
        this.stats.pluginsScaffolded++;
        
        return {
            message: `I'll create a ${platform} plugin for you! 🔌\n\nLet me scaffold:\n- Plugin structure\n- Core functionality\n- Admin interface\n- API endpoints\n- Documentation\n- Deployment scripts\n\nWhat should this plugin do? Give me the main features you need.`,
            actions: [{
                type: 'scaffold-plugin',
                platform,
                template: 'advanced'
            }],
            metadata: { platform }
        };
    }
    
    async handlePitchRequest(intent, conversationId) {
        // Find active project
        const project = Array.from(this.projectStates.values())
            .find(p => p.conversationId === conversationId);
            
        if (!project) {
            return {
                message: "I'd love to help create a pitch deck! First, let me know about your project. What are you building?",
                actions: [],
                metadata: { needsProject: true }
            };
        }
        
        this.stats.pitchesGenerated++;
        
        return {
            message: `Perfect timing! I'll create a comprehensive pitch package for your ${project.type}. 📊\n\nGenerating:\n- 15-slide pitch deck\n- Executive summary\n- Financial projections (3-year)\n- Market analysis\n- Competitive landscape\n- Demo video script\n- One-pager\n\nThis will be ready in about 2 minutes...`,
            actions: [{
                type: 'generate-pitch',
                projectId: project.id,
                format: 'comprehensive'
            }],
            metadata: { projectId: project.id }
        };
    }
    
    async handleGeneralHelp(intent, conversationId) {
        return {
            message: `I'm CAL, your AI development assistant! Here's what I can help you with:\n\n🚀 **Project Creation**\n- "Build a SaaS for managing X"\n- "Create an e-commerce platform"\n- "I need a mobile app for Y"\n\n🌐 **Domain Management**\n- "Load my domain example.com"\n- "Set up SSL for mydomain.io"\n- "Configure subdomains"\n\n🔌 **Plugin Development**\n- "Create a WordPress plugin"\n- "Build a Chrome extension"\n- "Make a Shopify app"\n\n📊 **Business Tools**\n- "Generate a pitch deck"\n- "Create financial projections"\n- "Build a demo site"\n\n💬 Just chat naturally and I'll understand what you need!`,
            actions: [],
            metadata: { type: 'help' }
        };
    }
    
    async executeAction(conversationId, action) {
        console.log(`⚡ Executing action: ${action.type}`);
        
        // Send progress update
        this.broadcastToConversation(conversationId, {
            type: 'action-progress',
            data: {
                action: action.type,
                status: 'started',
                message: `Working on ${action.type}...`
            }
        });
        
        try {
            switch (action.type) {
                case 'create-project':
                    await this.executeCreateProject(conversationId, action);
                    break;
                    
                case 'configure-domain':
                    await this.executeConfigureDomain(conversationId, action);
                    break;
                    
                case 'scaffold-plugin':
                    await this.executeScaffoldPlugin(conversationId, action);
                    break;
                    
                case 'generate-pitch':
                    await this.executeGeneratePitch(conversationId, action);
                    break;
            }
            
            // Send completion
            this.broadcastToConversation(conversationId, {
                type: 'action-progress',
                data: {
                    action: action.type,
                    status: 'completed',
                    message: `✅ ${action.type} completed!`
                }
            });
            
        } catch (error) {
            console.error(`Error executing action ${action.type}:`, error);
            
            this.broadcastToConversation(conversationId, {
                type: 'action-progress',
                data: {
                    action: action.type,
                    status: 'failed',
                    message: `❌ Failed to ${action.type}: ${error.message}`
                }
            });
        }
    }
    
    async executeCreateProject(conversationId, action) {
        const { projectId, projectType } = action;
        
        // Simulate project creation steps
        const steps = [
            { name: 'Setting up project structure', delay: 1000 },
            { name: 'Installing dependencies', delay: 2000 },
            { name: 'Creating database schema', delay: 1500 },
            { name: 'Generating API endpoints', delay: 2000 },
            { name: 'Building frontend components', delay: 2500 },
            { name: 'Setting up authentication', delay: 1000 },
            { name: 'Configuring deployment', delay: 1000 }
        ];
        
        for (const step of steps) {
            this.broadcastToConversation(conversationId, {
                type: 'action-progress',
                data: {
                    action: 'create-project',
                    status: 'progress',
                    message: step.name,
                    progress: (steps.indexOf(step) + 1) / steps.length * 100
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, step.delay));
        }
        
        // Update project state
        const project = this.projectStates.get(projectId);
        if (project) {
            project.status = 'ready';
            project.components = [
                'Frontend (React)',
                'Backend API (Node.js)', 
                'Database (PostgreSQL)',
                'Authentication (JWT)',
                'Admin Dashboard',
                'Documentation'
            ];
        }
    }
    
    broadcastToConversation(conversationId, message, excludeWs = null) {
        const messageStr = JSON.stringify(message);
        
        for (const [ws, client] of this.wsClients.entries()) {
            if (client.conversationId === conversationId && ws !== excludeWs) {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(messageStr);
                }
            }
        }
    }
    
    extractProjectType(message) {
        const lower = message.toLowerCase();
        if (lower.includes('saas')) return 'SaaS platform';
        if (lower.includes('e-commerce') || lower.includes('ecommerce')) return 'e-commerce platform';
        if (lower.includes('mobile app')) return 'mobile app';
        if (lower.includes('api')) return 'API service';
        if (lower.includes('dashboard')) return 'analytics dashboard';
        if (lower.includes('marketplace')) return 'marketplace platform';
        return 'web application';
    }
    
    extractDomain(message) {
        // Extract domain patterns
        const domainRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/;
        const match = message.match(domainRegex);
        return match ? match[1] : null;
    }
    
    extractPlatform(message) {
        const lower = message.toLowerCase();
        if (lower.includes('wordpress') || lower.includes('wp')) return 'wordpress';
        if (lower.includes('shopify')) return 'shopify';
        if (lower.includes('chrome')) return 'chrome';
        if (lower.includes('vscode') || lower.includes('vs code')) return 'vscode';
        if (lower.includes('discord')) return 'discord';
        if (lower.includes('slack')) return 'slack';
        return 'wordpress'; // default
    }
    
    generateClientId() {
        return 'client-' + Math.random().toString(36).substr(2, 9);
    }
    
    generateMessageId() {
        return 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    generateProjectId() {
        return 'proj-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    generateConversationId() {
        return 'conv-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    handleDisconnect(ws) {
        const client = this.wsClients.get(ws);
        if (client) {
            console.log(`🔌 Client disconnected: ${client.id}`);
            this.wsClients.delete(ws);
        }
    }
    
    startAutoSave() {
        setInterval(() => {
            this.saveConversations();
            this.saveProjectStates();
        }, this.config.autoSaveInterval);
    }
    
    saveConversations() {
        // Save to file or database
        try {
            const conversationsData = Array.from(this.conversations.entries());
            fs.writeFileSync(
                './cal-conversations.json',
                JSON.stringify(conversationsData, null, 2)
            );
        } catch (error) {
            console.error('Error saving conversations:', error);
        }
    }
    
    saveProjectStates() {
        try {
            const projectsData = Array.from(this.projectStates.entries());
            fs.writeFileSync(
                './cal-projects.json',
                JSON.stringify(projectsData, null, 2)
            );
        } catch (error) {
            console.error('Error saving projects:', error);
        }
    }
    
    // API handlers
    async handleMessageAPI(req, res) {
        const { message, conversationId } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message required' });
        }
        
        const convId = conversationId || this.generateConversationId();
        const response = await this.processWithCAL(message, convId);
        
        res.json({
            conversationId: convId,
            response
        });
    }
    
    getConversation(req, res) {
        const { id } = req.params;
        const messages = this.conversations.get(id) || [];
        
        res.json({ conversationId: id, messages });
    }
    
    getProjects(req, res) {
        const projects = Array.from(this.projectStates.values());
        res.json({ projects });
    }
    
    getStats(req, res) {
        res.json({
            ...this.stats,
            activeConversations: this.conversations.size,
            activeProjects: this.projectStates.size,
            connectedClients: this.wsClients.size
        });
    }
    
    async handleUpload(req, res) {
        // Handle file uploads for project assets
        res.json({ message: 'Upload endpoint - implementation pending' });
    }
    
    initializeConversationSystem() {
        // Load saved conversations if they exist
        try {
            if (fs.existsSync('./cal-conversations.json')) {
                const data = JSON.parse(fs.readFileSync('./cal-conversations.json', 'utf-8'));
                this.conversations = new Map(data);
                console.log(`📚 Loaded ${this.conversations.size} conversations`);
            }
            
            if (fs.existsSync('./cal-projects.json')) {
                const data = JSON.parse(fs.readFileSync('./cal-projects.json', 'utf-8'));
                this.projectStates = new Map(data);
                console.log(`🚀 Loaded ${this.projectStates.size} projects`);
            }
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }
}

// Start if run directly
if (require.main === module) {
    const chatInterface = new CALChatInterface();
    
    chatInterface.start().catch(error => {
        console.error('Failed to start CAL Chat Interface:', error);
        process.exit(1);
    });
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n💬 CAL Chat Interface shutting down...');
        chatInterface.saveConversations();
        chatInterface.saveProjectStates();
        process.exit(0);
    });
}

module.exports = CALChatInterface;