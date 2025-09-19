#!/usr/bin/env node

/**
 * MASTER SYSTEM ORCHESTRATOR
 * The central hub that connects all multimedia systems, bridges, and integrations
 * Makes everything work together seamlessly
 * 
 * Features:
 * - Instantiates all multimedia systems
 * - Connects bridges and integration layers
 * - Integrates with Cal Orchestration Router
 * - Provides unified API for all operations
 * - Real-time monitoring and health checks
 * - Event orchestration across systems
 */

const EventEmitter = require('events');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// Import all multimedia systems
const MasterUGCOrchestrator = require('./MASTER-UGC-ORCHESTRATOR');
const IntelligentContentAnalyzer = require('./INTELLIGENT-CONTENT-ANALYZER');
const EnhancedVideoProcessingPipeline = require('./ENHANCED-VIDEO-PROCESSING-PIPELINE');
const MultiPlatformContentGenerator = require('./MULTI-PLATFORM-CONTENT-GENERATOR');
const GuardianSystemIntegration = require('./GUARDIAN-SYSTEM-INTEGRATION');
const NostalgicMultimediaEngine = require('./NOSTALGIC-MULTIMEDIA-ENGINE');
const MultiDomainContentHub = require('./MULTI-DOMAIN-CONTENT-HUB');
const ContentCreatorSkillTree = require('./CONTENT-CREATOR-SKILL-TREE');
const RetroInterfaceEngine = require('./RETRO-INTERFACE-ENGINE');
const PolymarketStylePredictionEngine = require('./POLYMARKET-STYLE-PREDICTION-ENGINE');
const CrossDomainViralBettingHub = require('./CROSS-DOMAIN-VIRAL-BETTING-HUB');
const UnifiedDomainDeploymentSystem = require('./UNIFIED-DOMAIN-DEPLOYMENT-SYSTEM');
const DomainSpecificSkinGenerator = require('./DOMAIN-SPECIFIC-SKIN-GENERATOR');
const LiveDevStreamingPlatform = require('./LIVE-DEV-STREAMING-PLATFORM');
const AIAgentResourceManager = require('./AI-AGENT-RESOURCE-MANAGER');
const ConversationToContentProcessor = require('./CONVERSATION-TO-CONTENT-PROCESSOR');

// Import bridges and integration layers
const LegacyCodebaseBridge = require('./LEGACY-CODEBASE-BRIDGE');
const ThreeDContentGenerationBridge = require('./3D-CONTENT-GENERATION-BRIDGE');
const ReactComponentIntegrationLayer = require('./REACT-COMPONENT-INTEGRATION-LAYER');

// Import Cal Orchestration Router
const { CalOrchestrationRouter, CalOrchestrationHelper } = require('./Cal-Orchestration-Router');

console.log(`
🌟🎯🚀 MASTER SYSTEM ORCHESTRATOR 🚀🎯🌟
==========================================
🎬 Multimedia Systems → Connected
🌉 Integration Bridges → Active
⚛️ React Components → Ready
🎮 3D Generation → Online
🤖 Cal Integration → Enabled
📡 Unified API → Running
🔄 Real-time Updates → Streaming
`);

class MasterSystemOrchestrator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Server configuration
            server: {
                httpPort: config.server?.httpPort || 3000,
                wsPort: config.server?.wsPort || 3001,
                apiPrefix: config.server?.apiPrefix || '/api/v1',
                enableCORS: config.server?.enableCORS !== false,
                enableWebSocket: config.server?.enableWebSocket !== false
            },
            
            // System configuration
            systems: {
                autoStart: config.systems?.autoStart !== false,
                healthCheckInterval: config.systems?.healthCheckInterval || 30000,
                reconnectAttempts: config.systems?.reconnectAttempts || 5,
                enableMonitoring: config.systems?.enableMonitoring !== false
            },
            
            // Cal integration
            cal: {
                enabled: config.cal?.enabled !== false,
                autoRegister: config.cal?.autoRegister !== false,
                intentMappings: config.cal?.intentMappings || {},
                fallbackBehavior: config.cal?.fallbackBehavior || 'sequential'
            },
            
            // Database connections
            database: {
                postgres: {
                    host: config.database?.postgres?.host || 'localhost',
                    port: config.database?.postgres?.port || 5433,
                    database: config.database?.postgres?.database || 'document_generator',
                    user: config.database?.postgres?.user || 'postgres',
                    password: config.database?.postgres?.password || 'postgres'
                },
                redis: {
                    host: config.database?.redis?.host || 'localhost',
                    port: config.database?.redis?.port || 6380
                }
            },
            
            // AI services
            ai: {
                ollama: {
                    host: config.ai?.ollama?.host || 'localhost',
                    port: config.ai?.ollama?.port || 11435
                }
            },
            
            ...config
        };
        
        // System instances
        this.systems = {
            ugcOrchestrator: null,
            contentAnalyzer: null,
            videoProcessor: null,
            contentGenerator: null,
            guardianSystem: null,
            nostalgicEngine: null,
            contentHub: null,
            skillTree: null,
            retroInterface: null,
            predictionEngine: null,
            bettingHub: null,
            deploymentSystem: null,
            skinGenerator: null,
            streamingPlatform: null,
            resourceManager: null,
            conversationProcessor: null
        };
        
        // Bridge instances
        this.bridges = {
            legacyBridge: null,
            threeDGenerator: null,
            reactLayer: null
        };
        
        // Cal integration
        this.calRouter = null;
        this.calHelper = null;
        
        // Server instances
        this.httpServer = null;
        this.wsServer = null;
        
        // System state
        this.systemStatus = new Map();
        this.connections = new Map();
        this.metrics = {
            requestsProcessed: 0,
            eventsEmitted: 0,
            systemUptime: Date.now(),
            lastHealthCheck: null
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing Master System Orchestrator...');
        
        try {
            // Initialize all multimedia systems
            await this.initializeMultimediaSystems();
            
            // Initialize bridges
            await this.initializeBridges();
            
            // Connect systems through bridges
            await this.connectSystems();
            
            // Initialize Cal integration
            await this.initializeCalIntegration();
            
            // Start servers
            await this.startServers();
            
            // Start health monitoring
            if (this.config.systems.enableMonitoring) {
                this.startHealthMonitoring();
            }
            
            console.log('✅ Master System Orchestrator initialized!');
            console.log('🌐 Access the system at http://localhost:' + this.config.server.httpPort);
            
            this.emit('orchestrator_ready', {
                systems: Object.keys(this.systems),
                bridges: Object.keys(this.bridges),
                calEnabled: this.config.cal.enabled,
                apiEndpoint: `http://localhost:${this.config.server.httpPort}${this.config.server.apiPrefix}`
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize orchestrator:', error);
            throw error;
        }
    }
    
    /**
     * Initialize all multimedia systems
     */
    async initializeMultimediaSystems() {
        console.log('🎬 Initializing multimedia systems...');
        
        // Create system instances
        this.systems.ugcOrchestrator = new MasterUGCOrchestrator();
        this.systems.contentAnalyzer = new IntelligentContentAnalyzer();
        this.systems.videoProcessor = new EnhancedVideoProcessingPipeline();
        this.systems.contentGenerator = new MultiPlatformContentGenerator();
        this.systems.guardianSystem = new GuardianSystemIntegration();
        this.systems.nostalgicEngine = new NostalgicMultimediaEngine();
        this.systems.contentHub = new MultiDomainContentHub();
        this.systems.skillTree = new ContentCreatorSkillTree();
        this.systems.retroInterface = new RetroInterfaceEngine();
        this.systems.predictionEngine = new PolymarketStylePredictionEngine();
        this.systems.bettingHub = new CrossDomainViralBettingHub();
        this.systems.deploymentSystem = new UnifiedDomainDeploymentSystem();
        this.systems.skinGenerator = new DomainSpecificSkinGenerator();
        this.systems.streamingPlatform = new LiveDevStreamingPlatform();
        this.systems.resourceManager = new AIAgentResourceManager();
        this.systems.conversationProcessor = new ConversationToContentProcessor();
        
        // Wait for all systems to initialize
        const initPromises = Object.entries(this.systems).map(async ([name, system]) => {
            if (system && system.on) {
                // Wait for system ready event
                await new Promise((resolve) => {
                    system.once('ready', resolve);
                    system.once('initialized', resolve);
                    // Fallback timeout
                    setTimeout(resolve, 5000);
                });
                
                this.systemStatus.set(name, {
                    status: 'online',
                    lastSeen: Date.now(),
                    errors: 0
                });
                
                console.log(`✅ ${name} initialized`);
            }
        });
        
        await Promise.all(initPromises);
        
        console.log('✅ All multimedia systems initialized');
    }
    
    /**
     * Initialize integration bridges
     */
    async initializeBridges() {
        console.log('🌉 Initializing integration bridges...');
        
        // Create bridge instances
        this.bridges.legacyBridge = new LegacyCodebaseBridge({
            bridge: {
                enableReactAdapters: true,
                enable3DBridges: true,
                enableGameIntegration: true,
                enableEncryptionBridge: true,
                enableAPICompatibility: true
            }
        });
        
        this.bridges.threeDGenerator = new ThreeDContentGenerationBridge({
            generation: {
                quality: 'high',
                targetFramerate: 60
            },
            platforms: {
                youtube: { enabled: true },
                tiktok: { enabled: true },
                instagram: { enabled: true }
            }
        });
        
        this.bridges.reactLayer = new ReactComponentIntegrationLayer({
            react: {
                typescript: true,
                strictMode: true
            },
            ui: {
                framework: 'shadcn',
                darkMode: true
            }
        });
        
        // Wait for bridges to be ready
        await Promise.all([
            new Promise(resolve => this.bridges.legacyBridge.once('bridge_ready', resolve)),
            new Promise(resolve => this.bridges.threeDGenerator.once('bridge_ready', resolve)),
            new Promise(resolve => this.bridges.reactLayer.once('layer_ready', resolve))
        ]);
        
        console.log('✅ All bridges initialized');
    }
    
    /**
     * Connect systems through bridges
     */
    async connectSystems() {
        console.log('🔌 Connecting systems through bridges...');
        
        // Connect multimedia systems to legacy bridge
        await this.bridges.legacyBridge.connectMultimediaSystems(this.systems);
        
        // Connect systems to 3D generation bridge
        await this.bridges.threeDGenerator.connectSystems({
            videoProcessor: this.systems.videoProcessor,
            contentAnalyzer: this.systems.contentAnalyzer,
            nostalgicEngine: this.systems.nostalgicEngine,
            legacyBridge: this.bridges.legacyBridge
        });
        
        // Connect systems to React layer
        await this.bridges.reactLayer.connectSystems({
            ...this.systems,
            legacyBridge: this.bridges.legacyBridge,
            threeDGenerator: this.bridges.threeDGenerator
        });
        
        // Create cross-system event connections
        this.createEventConnections();
        
        console.log('✅ All systems connected');
    }
    
    /**
     * Create event connections between systems
     */
    createEventConnections() {
        // UGC → Content Analyzer
        this.systems.ugcOrchestrator.on('content_uploaded', async (content) => {
            const analysis = await this.systems.contentAnalyzer.analyzeContent(content);
            this.emit('content_analyzed', { content, analysis });
        });
        
        // Content Analyzer → Video Processor
        this.systems.contentAnalyzer.on('analysis_complete', async (analysis) => {
            if (analysis.hasVideo) {
                await this.systems.videoProcessor.processVideo(analysis.content);
            }
        });
        
        // Video Processor → 3D Generator
        this.systems.videoProcessor.on('clip_ready', async (clip) => {
            await this.bridges.threeDGenerator.generateFrom3DVideo(clip);
        });
        
        // Prediction Engine → Betting Hub
        this.systems.predictionEngine.on('market_created', async (market) => {
            await this.systems.bettingHub.addMarket(market);
        });
        
        // Streaming Platform → Resource Manager
        this.systems.streamingPlatform.on('viewer_action', async (action) => {
            await this.systems.resourceManager.processViewerAction(action);
        });
        
        // Conversation Processor → Content Generator
        this.systems.conversationProcessor.on('insights_extracted', async (insights) => {
            await this.systems.contentGenerator.generateFromInsights(insights);
        });
    }
    
    /**
     * Initialize Cal integration
     */
    async initializeCalIntegration() {
        if (!this.config.cal.enabled) {
            console.log('⚠️ Cal integration disabled');
            return;
        }
        
        console.log('🤖 Initializing Cal integration...');
        
        // Create Cal router
        this.calRouter = new CalOrchestrationRouter({
            enableCaching: true,
            enableRateLimiting: true,
            enableCircuitBreaker: true
        });
        
        this.calHelper = new CalOrchestrationHelper(this.calRouter);
        
        // Register multimedia services with Cal
        await this.registerServicesWithCal();
        
        // Create intent mappings
        await this.createCalIntentMappings();
        
        console.log('✅ Cal integration initialized');
    }
    
    /**
     * Register services with Cal
     */
    async registerServicesWithCal() {
        // Register UGC service
        this.calRouter.registerService('ugc', {
            protocol: 'rest',
            baseUrl: `http://localhost:${this.config.server.httpPort}/api/v1/ugc`,
            auth: { type: 'none' },
            handler: async (request) => {
                return await this.systems.ugcOrchestrator.orchestrate(request);
            }
        });
        
        // Register content analysis service
        this.calRouter.registerService('content-analysis', {
            protocol: 'rest',
            baseUrl: `http://localhost:${this.config.server.httpPort}/api/v1/analyze`,
            auth: { type: 'none' },
            handler: async (request) => {
                return await this.systems.contentAnalyzer.analyze(request.content);
            }
        });
        
        // Register video processing service
        this.calRouter.registerService('video-processing', {
            protocol: 'rest',
            baseUrl: `http://localhost:${this.config.server.httpPort}/api/v1/video`,
            auth: { type: 'none' },
            handler: async (request) => {
                return await this.systems.videoProcessor.process(request.video);
            }
        });
        
        // Register 3D generation service
        this.calRouter.registerService('3d-generation', {
            protocol: 'rest',
            baseUrl: `http://localhost:${this.config.server.httpPort}/api/v1/3d`,
            auth: { type: 'none' },
            handler: async (request) => {
                return await this.bridges.threeDGenerator.generateFrom3DVideo(request.video);
            }
        });
        
        console.log('✅ Services registered with Cal');
    }
    
    /**
     * Create Cal intent mappings
     */
    async createCalIntentMappings() {
        // Content creation intents
        this.calRouter.registerIntentMapping('create-content', [
            'ugc', 'content-analysis', 'content-generation'
        ]);
        
        // Video processing intents
        this.calRouter.registerIntentMapping('process-video', [
            'video-processing', '3d-generation'
        ]);
        
        // Analysis intents
        this.calRouter.registerIntentMapping('analyze', [
            'content-analysis', 'prediction-engine'
        ]);
        
        // Streaming intents
        this.calRouter.registerIntentMapping('stream', [
            'streaming-platform', 'resource-manager'
        ]);
        
        // Deployment intents
        this.calRouter.registerIntentMapping('deploy', [
            'deployment-system', 'domain-generator'
        ]);
    }
    
    /**
     * Start HTTP and WebSocket servers
     */
    async startServers() {
        console.log('🌐 Starting servers...');
        
        // Create HTTP server
        this.httpServer = http.createServer(async (req, res) => {
            // Enable CORS if configured
            if (this.config.server.enableCORS) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
                res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            }
            
            // Handle preflight
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            // Route requests
            try {
                await this.handleRequest(req, res);
            } catch (error) {
                console.error('Request error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
        
        // Start HTTP server
        this.httpServer.listen(this.config.server.httpPort, () => {
            console.log(`✅ HTTP server listening on port ${this.config.server.httpPort}`);
        });
        
        // Create WebSocket server if enabled
        if (this.config.server.enableWebSocket) {
            this.wsServer = new WebSocket.Server({ 
                port: this.config.server.wsPort 
            });
            
            this.wsServer.on('connection', (ws) => {
                console.log('🔌 New WebSocket connection');
                
                // Handle WebSocket messages
                ws.on('message', async (message) => {
                    try {
                        const data = JSON.parse(message);
                        await this.handleWebSocketMessage(ws, data);
                    } catch (error) {
                        ws.send(JSON.stringify({ 
                            error: error.message,
                            type: 'error'
                        }));
                    }
                });
                
                // Send welcome message
                ws.send(JSON.stringify({
                    type: 'connected',
                    message: 'Connected to Master System Orchestrator',
                    systems: Object.keys(this.systems),
                    timestamp: new Date()
                }));
            });
            
            console.log(`✅ WebSocket server listening on port ${this.config.server.wsPort}`);
        }
    }
    
    /**
     * Handle HTTP requests
     */
    async handleRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.config.server.httpPort}`);
        const path = url.pathname;
        
        // Health check
        if (path === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'healthy',
                uptime: Date.now() - this.metrics.systemUptime,
                systems: Object.fromEntries(this.systemStatus),
                metrics: this.metrics
            }));
            return;
        }
        
        // API routes
        if (path.startsWith(this.config.server.apiPrefix)) {
            const apiPath = path.slice(this.config.server.apiPrefix.length);
            
            // System status
            if (apiPath === '/status') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.getSystemStatus()));
                return;
            }
            
            // Cal orchestration
            if (apiPath === '/cal/orchestrate' && req.method === 'POST') {
                const body = await this.getRequestBody(req);
                const result = await this.calRouter.orchestrate(body);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                return;
            }
            
            // System-specific endpoints
            const systemMatch = apiPath.match(/^\/([^\/]+)\/(.*)/);
            if (systemMatch) {
                const [, systemName, action] = systemMatch;
                if (this.systems[systemName]) {
                    const body = req.method === 'POST' ? await this.getRequestBody(req) : {};
                    const result = await this.handleSystemRequest(systemName, action, body);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                    return;
                }
            }
        }
        
        // Default response
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            error: 'Not found',
            availableEndpoints: [
                '/health',
                `${this.config.server.apiPrefix}/status`,
                `${this.config.server.apiPrefix}/cal/orchestrate`,
                `${this.config.server.apiPrefix}/{system}/{action}`
            ]
        }));
    }
    
    /**
     * Handle WebSocket messages
     */
    async handleWebSocketMessage(ws, data) {
        const { type, payload } = data;
        
        switch (type) {
            case 'subscribe':
                // Subscribe to system events
                const handler = (event) => {
                    ws.send(JSON.stringify({
                        type: 'event',
                        system: payload.system,
                        event: event
                    }));
                };
                
                if (this.systems[payload.system]) {
                    this.systems[payload.system].on(payload.event, handler);
                    this.connections.set(ws, { system: payload.system, event: payload.event, handler });
                }
                break;
                
            case 'command':
                // Execute system command
                const result = await this.handleSystemRequest(
                    payload.system,
                    payload.action,
                    payload.data
                );
                
                ws.send(JSON.stringify({
                    type: 'result',
                    id: data.id,
                    result
                }));
                break;
                
            case 'cal':
                // Cal orchestration via WebSocket
                const calResult = await this.calRouter.orchestrate(payload);
                ws.send(JSON.stringify({
                    type: 'cal-result',
                    id: data.id,
                    result: calResult
                }));
                break;
        }
    }
    
    /**
     * Handle system-specific requests
     */
    async handleSystemRequest(systemName, action, data) {
        const system = this.systems[systemName];
        if (!system) {
            throw new Error(`System not found: ${systemName}`);
        }
        
        // Check if action method exists
        if (typeof system[action] === 'function') {
            return await system[action](data);
        }
        
        // Default actions
        switch (action) {
            case 'status':
                return this.systemStatus.get(systemName);
            case 'stats':
                return system.getStats ? await system.getStats() : {};
            case 'config':
                return system.config || {};
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
    
    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        console.log('💓 Starting health monitoring...');
        
        setInterval(async () => {
            for (const [name, system] of Object.entries(this.systems)) {
                try {
                    // Check if system is responsive
                    if (system && system.getStats) {
                        await system.getStats();
                        this.systemStatus.set(name, {
                            status: 'online',
                            lastSeen: Date.now(),
                            errors: 0
                        });
                    }
                } catch (error) {
                    const status = this.systemStatus.get(name);
                    this.systemStatus.set(name, {
                        status: 'error',
                        lastSeen: status?.lastSeen || 0,
                        errors: (status?.errors || 0) + 1,
                        lastError: error.message
                    });
                }
            }
            
            this.metrics.lastHealthCheck = Date.now();
            this.emit('health_check', Object.fromEntries(this.systemStatus));
            
        }, this.config.systems.healthCheckInterval);
    }
    
    /**
     * Get system status
     */
    getSystemStatus() {
        return {
            orchestrator: {
                version: '1.0.0',
                uptime: Date.now() - this.metrics.systemUptime,
                requests: this.metrics.requestsProcessed,
                events: this.metrics.eventsEmitted
            },
            systems: Object.fromEntries(this.systemStatus),
            bridges: {
                legacy: this.bridges.legacyBridge?.getBridgeStatus() || {},
                threeD: this.bridges.threeDGenerator?.getGenerationStats() || {},
                react: this.bridges.reactLayer?.getIntegrationStatus() || {}
            },
            cal: {
                enabled: this.config.cal.enabled,
                services: this.calRouter?.getServiceHealth() || {}
            },
            connections: {
                http: `http://localhost:${this.config.server.httpPort}`,
                websocket: `ws://localhost:${this.config.server.wsPort}`,
                api: `http://localhost:${this.config.server.httpPort}${this.config.server.apiPrefix}`
            }
        };
    }
    
    /**
     * Get request body
     */
    async getRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (error) {
                    resolve({});
                }
            });
            req.on('error', reject);
        });
    }
    
    /**
     * Shutdown orchestrator
     */
    async shutdown() {
        console.log('🛑 Shutting down orchestrator...');
        
        // Close servers
        if (this.httpServer) {
            this.httpServer.close();
        }
        
        if (this.wsServer) {
            this.wsServer.close();
        }
        
        // Shutdown systems
        for (const system of Object.values(this.systems)) {
            if (system && system.shutdown) {
                await system.shutdown();
            }
        }
        
        console.log('✅ Orchestrator shutdown complete');
    }
}

module.exports = MasterSystemOrchestrator;

// Run if called directly
if (require.main === module) {
    const orchestrator = new MasterSystemOrchestrator({
        server: {
            httpPort: 3000,
            wsPort: 3001
        },
        cal: {
            enabled: true,
            autoRegister: true
        }
    });
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        console.log('\n⚡ Received SIGINT, shutting down gracefully...');
        await orchestrator.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\n⚡ Received SIGTERM, shutting down gracefully...');
        await orchestrator.shutdown();
        process.exit(0);
    });
}