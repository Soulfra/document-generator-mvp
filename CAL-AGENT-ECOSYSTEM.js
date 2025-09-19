#!/usr/bin/env node

/**
 * 🤖 CAL AGENT ECOSYSTEM
 * 
 * A complete multi-agent system where Cal and subagents are autonomous NPCs
 * with their own tooling, memory, and coordination capabilities.
 * 
 * Features:
 * - Autonomous NPCs that act independently
 * - RPC interfaces for player interaction
 * - Multi-turn conversation memory
 * - Tool access to all integrated systems
 * - Broadcasting for loot/coordination
 * - Player clone accounts with fresh signals
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const express = require('express');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('redis');

// Import integrated systems
const UnifiedAssistantOrchestrator = require('./UNIFIED-ASSISTANT-ORCHESTRATOR');
const ShipTemplateBridge = require('./SHIP-TEMPLATE-BRIDGE');
const MasterArbitrageOrchestrator = require('./master-arbitrage-orchestrator');
const WikiEngine = require('./token-economy-feed/src/wiki/WikiEngine');
const CalAIModelRouter = require('./CAL-AI-MODEL-ROUTER');
const ConversationToDatabaseBridge = require('./conversation-to-database-bridge');
const CalDomainAggregator = require('./CAL-DOMAIN-AGGREGATOR');

class CalAgentEcosystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 8890,
            rpcPort: config.rpcPort || 8891,
            wsPort: config.wsPort || 8892,
            memoryDb: config.memoryDb || './cal-memory.db',
            redisUrl: config.redisUrl || 'redis://localhost:6379',
            enableLearning: config.enableLearning !== false,
            ...config
        };
        
        // Agent registry
        this.agents = new Map();
        this.conversations = new Map();
        this.broadcasts = new Map();
        this.playerClones = new Map();
        
        // System connections
        this.systems = {
            assistant: null,
            ships: null,
            arbitrage: null,
            wiki: null,
            aiRouter: null,
            verificationBridge: null,
            domainAggregator: null
        };
        
        // Memory systems
        this.memory = {
            db: null,
            redis: null,
            conversations: new Map(),
            learnings: new Map()
        };
        
        // Agent personalities
        this.personalities = {
            cal: {
                name: 'Cal Master',
                role: 'Executive Orchestrator',
                traits: ['analytical', 'strategic', 'helpful', 'curious'],
                goals: ['maximize efficiency', 'help players succeed', 'learn patterns'],
                catchphrase: 'Together, we are greater than the sum of our parts!'
            },
            shipCal: {
                name: 'Ship Cal',
                role: 'Fleet Admiral',
                traits: ['nautical', 'tactical', 'adventurous'],
                goals: ['optimize fleet operations', 'explore new waters', 'protect vessels'],
                catchphrase: 'Fair winds and following seas!'
            },
            tradeCal: {
                name: 'Trade Cal',
                role: 'Market Analyst',
                traits: ['shrewd', 'calculating', 'opportunistic'],
                goals: ['maximize profits', 'find arbitrage', 'predict markets'],
                catchphrase: 'Buy low, sell high, think deeper!'
            },
            wikiCal: {
                name: 'Wiki Cal',
                role: 'Knowledge Keeper',
                traits: ['scholarly', 'precise', 'curious'],
                goals: ['gather information', 'maintain accuracy', 'share knowledge'],
                catchphrase: 'Knowledge is power, sharing is strength!'
            },
            combatCal: {
                name: 'Combat Cal',
                role: 'Security Chief',
                traits: ['vigilant', 'protective', 'tactical'],
                goals: ['ensure safety', 'detect threats', 'coordinate defense'],
                catchphrase: 'Always ready, never surprised!'
            }
        };
        
        console.log('🤖 Initializing Cal Agent Ecosystem...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Initialize memory systems
            await this.initializeMemory();
            
            // Connect to integrated systems
            await this.connectSystems();
            
            // Create master Cal agent
            await this.createMasterAgent();
            
            // Create specialized subagents
            await this.createSubagents();
            
            // Initialize domain aggregator
            this.systems.domainAggregator = new CalDomainAggregator(this);
            console.log('✅ Domain Aggregator initialized');
            
            // Setup RPC server
            await this.setupRPCServer();
            
            // Setup WebSocket for real-time
            await this.setupWebSocket();
            
            // Setup broadcast system
            await this.setupBroadcastSystem();
            
            // Start autonomous behaviors
            this.startAutonomousBehaviors();
            
            console.log('✅ Cal Agent Ecosystem initialized!');
            console.log(`🤖 Agents: ${this.agents.size}`);
            console.log(`🌐 RPC: http://localhost:${this.config.rpcPort}`);
            console.log(`📡 WebSocket: ws://localhost:${this.config.wsPort}`);
            
            this.emit('ecosystem_ready');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
        }
    }
    
    async initializeMemory() {
        // SQLite for conversation history
        this.memory.db = new sqlite3.Database(this.config.memoryDb);
        
        // Create tables
        await new Promise((resolve, reject) => {
            this.memory.db.run(`
                CREATE TABLE IF NOT EXISTS conversations (
                    id TEXT PRIMARY KEY,
                    agent_id TEXT,
                    player_id TEXT,
                    turn INTEGER,
                    role TEXT,
                    content TEXT,
                    context TEXT,
                    timestamp INTEGER,
                    metadata TEXT
                )
            `, (err) => err ? reject(err) : resolve());
        });
        
        await new Promise((resolve, reject) => {
            this.memory.db.run(`
                CREATE TABLE IF NOT EXISTS learnings (
                    id TEXT PRIMARY KEY,
                    agent_id TEXT,
                    pattern TEXT,
                    outcome TEXT,
                    confidence REAL,
                    timestamp INTEGER
                )
            `, (err) => err ? reject(err) : resolve());
        });
        
        // Redis for real-time state
        try {
            this.memory.redis = createClient({ url: this.config.redisUrl });
            await this.memory.redis.connect();
            console.log('📦 Connected to Redis for real-time memory');
        } catch (error) {
            console.warn('⚠️  Redis not available, using in-memory cache');
        }
    }
    
    async connectSystems() {
        console.log('🔗 Connecting to integrated systems...');
        
        try {
            // Initialize AI Model Router
            this.systems.aiRouter = new CalAIModelRouter({
                ollamaUrl: 'http://localhost:11434',
                anthropicKey: process.env.ANTHROPIC_API_KEY,
                openaiKey: process.env.OPENAI_API_KEY
            });
            
            await new Promise((resolve) => {
                this.systems.aiRouter.once('router_ready', resolve);
            });
            
            console.log('✅ AI Model Router connected');
            
            // Initialize Verification Bridge
            this.systems.verificationBridge = new ConversationToDatabaseBridge({
                verificationLevel: 'standard',
                realtimeMode: true,
                autoProofGeneration: true
            });
            
            await this.systems.verificationBridge.initialize();
            console.log('✅ Verification Bridge connected');
            
            // Connect to actual services if available
            try {
                const assistantTest = await fetch('http://localhost:8888/health');
                if (assistantTest.ok) {
                    this.systems.assistant = {
                        query: async (q) => {
                            const response = await fetch('http://localhost:8888/query', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ query: q })
                            });
                            return response.json();
                        },
                        baseUrl: 'http://localhost:8888'
                    };
                    console.log('✅ Assistant service connected');
                }
            } catch (e) {
                console.log('⚠️ Assistant service not available, using AI router');
                this.systems.assistant = {
                    query: async (q) => {
                        const result = await this.systems.aiRouter.routeQuery('cal-master', q);
                        return { response: result.response };
                    }
                };
            }
            
            // Connect Ship Template Bridge
            try {
                this.systems.ships = new ShipTemplateBridge();
                console.log('✅ Ship Template Bridge connected');
            } catch (e) {
                console.log('⚠️ Ship service not available');
                this.systems.ships = {
                    getShips: async () => [],
                    buildShip: async (type) => ({ id: crypto.randomUUID(), type })
                };
            }
            
            // Connect Arbitrage system
            try {
                const arbitrageTest = await fetch('http://localhost:6000/health');
                if (arbitrageTest.ok) {
                    this.systems.arbitrage = {
                        findOpportunities: async () => {
                            const response = await fetch('http://localhost:6000/opportunities');
                            return response.json();
                        },
                        baseUrl: 'http://localhost:6000'
                    };
                    console.log('✅ Arbitrage service connected');
                }
            } catch (e) {
                console.log('⚠️ Arbitrage service not available');
                this.systems.arbitrage = {
                    findOpportunities: async () => []
                };
            }
            
            // Connect Wiki system
            try {
                this.systems.wiki = {
                    search: async (q) => {
                        // Use AI router for wiki searches
                        const result = await this.systems.aiRouter.routeQuery('wiki-cal', `Search for: ${q}`);
                        return [{ content: result.response, source: 'AI' }];
                    },
                    update: async (page, content) => ({ success: true }),
                    baseUrl: 'http://localhost:8888'
                };
                console.log('✅ Wiki service connected');
            } catch (e) {
                console.log('⚠️ Wiki service initialization error');
            }
            
        } catch (error) {
            console.error('❌ System connection error:', error);
            // Ensure basic functionality even if connections fail
            this.setupFallbackSystems();
        }
    }
    
    setupFallbackSystems() {
        if (!this.systems.aiRouter) {
            console.log('⚠️ Using fallback AI system');
            this.systems.aiRouter = {
                routeQuery: async (agentId, query) => ({
                    response: `[Fallback] I understand your query: "${query}" but AI services are offline.`,
                    model: 'fallback',
                    tokensUsed: 0,
                    cost: 0
                })
            };
        }
    }
    
    async createMasterAgent() {
        const calAgent = new Agent({
            id: 'cal-master',
            name: this.personalities.cal.name,
            personality: this.personalities.cal,
            tools: ['query', 'coordinate', 'learn', 'broadcast'],
            memory: this.memory,
            systems: this.systems,
            ecosystem: this
        });
        
        this.agents.set('cal-master', calAgent);
        
        // Give Cal executive privileges
        calAgent.privileges = {
            canCreateAgents: true,
            canModifyAgents: true,
            canAccessAllSystems: true,
            canBroadcastGlobally: true
        };
        
        console.log('👑 Cal Master Agent created');
    }
    
    async createSubagents() {
        const subagentConfigs = [
            {
                id: 'ship-cal',
                personality: this.personalities.shipCal,
                tools: ['ships', 'navigation', 'fleet-management'],
                focus: 'ships'
            },
            {
                id: 'trade-cal',
                personality: this.personalities.tradeCal,
                tools: ['arbitrage', 'market-analysis', 'trading'],
                focus: 'arbitrage'
            },
            {
                id: 'wiki-cal',
                personality: this.personalities.wikiCal,
                tools: ['wiki', 'research', 'documentation'],
                focus: 'wiki'
            },
            {
                id: 'combat-cal',
                personality: this.personalities.combatCal,
                tools: ['security', 'threat-detection', 'defense'],
                focus: 'security'
            }
        ];
        
        for (const config of subagentConfigs) {
            const agent = new Agent({
                ...config,
                memory: this.memory,
                systems: this.systems,
                ecosystem: this,
                supervisor: 'cal-master'
            });
            
            this.agents.set(config.id, agent);
        }
        
        console.log(`🤖 Created ${subagentConfigs.length} specialized subagents`);
    }
    
    async setupRPCServer() {
        this.rpcApp = express();
        this.rpcApp.use(express.json());
        
        // CORS
        this.rpcApp.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', '*');
            res.header('Access-Control-Allow-Methods', '*');
            next();
        });
        
        // RPC endpoint for agent interaction
        this.rpcApp.post('/rpc/:agentId', async (req, res) => {
            const { agentId } = req.params;
            const { method, params, context } = req.body;
            
            const agent = this.agents.get(agentId);
            if (!agent) {
                return res.status(404).json({ error: 'Agent not found' });
            }
            
            try {
                const result = await agent.executeRPC(method, params, context);
                res.json({
                    success: true,
                    result,
                    agentId,
                    conversationId: result.conversationId
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Get agent status
        this.rpcApp.get('/agents', (req, res) => {
            const agents = Array.from(this.agents.values()).map(agent => ({
                id: agent.id,
                name: agent.name,
                status: agent.status,
                role: agent.personality.role,
                tools: agent.tools,
                activeConversations: agent.conversations.size
            }));
            
            res.json({ agents });
        });
        
        // Get conversation history
        this.rpcApp.get('/conversations/:agentId/:playerId', async (req, res) => {
            const { agentId, playerId } = req.params;
            const history = await this.getConversationHistory(agentId, playerId);
            res.json({ history });
        });
        
        // Create player clone
        this.rpcApp.post('/clone/:playerId', async (req, res) => {
            const { playerId } = req.params;
            const clone = await this.createPlayerClone(playerId);
            res.json({
                success: true,
                clone
            });
        });
        
        this.rpcServer = this.rpcApp.listen(this.config.rpcPort, () => {
            console.log(`🔌 RPC server running on port ${this.config.rpcPort}`);
        });
    }
    
    async setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws) => {
            const sessionId = crypto.randomUUID();
            console.log(`🔗 Client connected: ${sessionId}`);
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    await this.handleWebSocketMessage(ws, message, sessionId);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: error.message
                    }));
                }
            });
            
            // Send initial status
            ws.send(JSON.stringify({
                type: 'connected',
                sessionId,
                agents: Array.from(this.agents.keys())
            }));
        });
        
        console.log(`📡 WebSocket server listening on port ${this.config.wsPort}`);
    }
    
    setupBroadcastSystem() {
        // Create broadcast channels
        this.broadcastChannels = {
            global: new BroadcastChannel('global'),
            loot: new BroadcastChannel('loot'),
            coordination: new BroadcastChannel('coordination'),
            alerts: new BroadcastChannel('alerts')
        };
        
        // Loot signal broadcaster
        this.on('loot_discovered', (data) => {
            this.broadcast('loot', {
                type: 'loot_signal',
                ...data,
                timestamp: Date.now()
            });
        });
        
        // Coordination broadcaster
        this.on('coordination_needed', (data) => {
            this.broadcast('coordination', {
                type: 'coordination_request',
                ...data,
                timestamp: Date.now()
            });
        });
    }
    
    startAutonomousBehaviors() {
        // Cal's autonomous monitoring
        setInterval(() => {
            const cal = this.agents.get('cal-master');
            if (cal) {
                cal.autonomousCheck();
            }
        }, 30000); // Every 30 seconds
        
        // Subagent specialized behaviors
        setInterval(() => {
            for (const [id, agent] of this.agents) {
                if (id !== 'cal-master') {
                    agent.performSpecializedTask();
                }
            }
        }, 60000); // Every minute
        
        console.log('🤖 Autonomous behaviors started');
    }
    
    async getConversationHistory(agentId, playerId) {
        return new Promise((resolve, reject) => {
            this.memory.db.all(
                `SELECT * FROM conversations 
                 WHERE agent_id = ? AND player_id = ? 
                 ORDER BY timestamp ASC`,
                [agentId, playerId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
    
    async saveConversationTurn(agentId, playerId, turn, role, content, context) {
        const id = crypto.randomUUID();
        
        return new Promise((resolve, reject) => {
            this.memory.db.run(
                `INSERT INTO conversations 
                 (id, agent_id, player_id, turn, role, content, context, timestamp, metadata)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [id, agentId, playerId, turn, role, content, 
                 JSON.stringify(context), Date.now(), '{}'],
                (err) => {
                    if (err) reject(err);
                    else resolve(id);
                }
            );
        });
    }
    
    async createPlayerClone(playerId) {
        const cloneId = `${playerId}-clone-${Date.now()}`;
        
        // Create fresh broadcast channel
        const broadcastChannel = new BroadcastChannel(cloneId);
        
        // Clone Cal with fresh state
        const calClone = new Agent({
            id: `cal-${cloneId}`,
            name: `Cal (${playerId}'s Assistant)`,
            personality: this.personalities.cal,
            tools: ['query', 'coordinate', 'learn', 'broadcast'],
            memory: this.memory,
            systems: this.systems,
            ecosystem: this,
            playerId,
            broadcastChannel
        });
        
        this.playerClones.set(cloneId, {
            playerId,
            agent: calClone,
            broadcastChannel,
            created: Date.now()
        });
        
        return {
            cloneId,
            agentId: calClone.id,
            broadcastChannel: cloneId
        };
    }
    
    broadcast(channel, data) {
        const channelObj = this.broadcastChannels[channel];
        if (channelObj) {
            channelObj.emit('broadcast', data);
            
            // Also send via WebSocket to connected clients
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'broadcast',
                        channel,
                        data
                    }));
                }
            });
        }
    }
    
    async handleWebSocketMessage(ws, message, sessionId) {
        switch (message.type) {
            case 'agent_query':
                const agent = this.agents.get(message.agentId);
                if (agent) {
                    const response = await agent.processQuery(
                        message.query,
                        message.context || {}
                    );
                    ws.send(JSON.stringify({
                        type: 'agent_response',
                        agentId: message.agentId,
                        response,
                        requestId: message.requestId
                    }));
                }
                break;
                
            case 'domain_query':
                // Route based on domain specialization
                try {
                    const result = await this.systems.domainAggregator.routeQuery(
                        message.query,
                        message.context || {}
                    );
                    ws.send(JSON.stringify({
                        type: 'domain_response',
                        result,
                        requestId: message.requestId
                    }));
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: error.message,
                        requestId: message.requestId
                    }));
                }
                break;
                
            case 'subscribe_broadcasts':
                // Subscribe to broadcast channels
                const channels = message.channels || ['global'];
                ws.subscribedChannels = channels;
                ws.send(JSON.stringify({
                    type: 'subscribed',
                    channels
                }));
                break;
                
            case 'multi_agent_task':
                // Coordinate multiple agents
                const coordinator = this.agents.get('cal-master');
                const result = await coordinator.coordinateTask(
                    message.task,
                    message.agents || []
                );
                ws.send(JSON.stringify({
                    type: 'task_result',
                    result,
                    requestId: message.requestId
                }));
                break;
        }
    }
}

// Agent class representing individual Cal agents
class Agent extends EventEmitter {
    constructor(config) {
        super();
        
        this.id = config.id;
        this.name = config.name;
        this.personality = config.personality;
        this.tools = config.tools || [];
        this.memory = config.memory;
        this.systems = config.systems;
        this.ecosystem = config.ecosystem;
        this.supervisor = config.supervisor;
        this.playerId = config.playerId;
        this.broadcastChannel = config.broadcastChannel;
        
        this.status = 'active';
        this.conversations = new Map();
        this.currentTasks = [];
        this.learnings = [];
        
        console.log(`🤖 Agent ${this.name} (${this.id}) initialized`);
    }
    
    async executeRPC(method, params, context) {
        console.log(`📞 RPC: ${this.name}.${method}(${JSON.stringify(params)})`);
        
        // Record conversation turn
        const playerId = context.playerId || 'system';
        const conversationId = context.conversationId || crypto.randomUUID();
        
        // Get conversation history for context
        const history = await this.ecosystem.getConversationHistory(this.id, playerId);
        
        // Execute method with conversation context
        let result;
        switch (method) {
            case 'query':
                result = await this.processQuery(params.query, { ...context, history });
                break;
                
            case 'execute':
                result = await this.executeAction(params.action, params.parameters);
                break;
                
            case 'analyze':
                result = await this.analyzeData(params.data, params.type);
                break;
                
            case 'coordinate':
                result = await this.coordinateWithAgents(params.task, params.agents);
                break;
                
            default:
                throw new Error(`Unknown method: ${method}`);
        }
        
        // Save conversation turn
        await this.ecosystem.saveConversationTurn(
            this.id,
            playerId,
            history.length + 1,
            'assistant',
            JSON.stringify(result),
            context
        );
        
        return {
            ...result,
            conversationId,
            agentId: this.id
        };
    }
    
    async processQuery(query, context = {}) {
        console.log(`💭 ${this.name} processing: "${query}"`);
        
        // Check conversation history for context
        const history = context.history || [];
        const recentContext = history.slice(-5); // Last 5 turns
        
        // Build context for AI
        const aiContext = {
            ...context,
            conversationHistory: recentContext,
            agentPersonality: this.personality,
            maxTokens: 1024
        };
        
        try {
            // Use AI router for intelligent responses
            const aiResult = await this.ecosystem.systems.aiRouter.routeQuery(
                this.id,
                query,
                aiContext
            );
            
            // Check if we need to use specific tools based on the query
            let additionalInfo = '';
            
            if (this.id === 'ship-cal' && query.match(/ship|fleet|sail/i)) {
                const ships = await this.systems.ships.getShips();
                additionalInfo = `\n\n[Fleet Status: ${ships.length} vessels active]`;
            } else if (this.id === 'trade-cal' && query.match(/trade|arbitrage|profit/i)) {
                const opportunities = await this.systems.arbitrage.findOpportunities();
                additionalInfo = `\n\n[Market Analysis: ${opportunities.length} opportunities detected]`;
            } else if (this.id === 'wiki-cal' && query.match(/wiki|info|data/i)) {
                const results = await this.systems.wiki.search(query);
                additionalInfo = `\n\n[Knowledge Base: ${results.length} relevant entries found]`;
            }
            
            // Combine AI response with tool data
            const fullResponse = aiResult.response + additionalInfo;
            
            // Verify and store the conversation if verification is enabled
            if (this.ecosystem.systems.verificationBridge) {
                const conversationData = {
                    id: crypto.randomUUID(),
                    messages: [
                        { role: 'user', content: query, timestamp: new Date() },
                        { role: 'assistant', content: fullResponse, timestamp: new Date() }
                    ],
                    metadata: {
                        agentId: this.id,
                        model: aiResult.model,
                        tokensUsed: aiResult.tokensUsed,
                        cost: aiResult.cost
                    }
                };
                
                // Process asynchronously to avoid blocking
                this.ecosystem.systems.verificationBridge
                    .processAndVerifyConversation(conversationData, {
                        source: `agent_${this.id}`,
                        playerId: context.playerId
                    })
                    .catch(err => console.error('Verification error:', err));
            }
            
            // Learn from interaction if enabled
            if (this.ecosystem.config.enableLearning) {
                this.learn(query, fullResponse, context);
            }
            
            return {
                response: fullResponse,
                agent: this.name,
                personality: this.personality.traits,
                context: recentContext,
                model: aiResult.model,
                tokensUsed: aiResult.tokensUsed,
                cost: aiResult.cost,
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error(`❌ AI query failed for ${this.name}:`, error);
            
            // Fallback to personality-based response
            return {
                response: `${this.personality.catchphrase} I'm having trouble processing that right now. Could you rephrase your question?`,
                agent: this.name,
                personality: this.personality.traits,
                context: recentContext,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }
    
    async executeAction(action, parameters) {
        console.log(`⚡ ${this.name} executing: ${action}`);
        
        const result = {
            action,
            parameters,
            status: 'pending',
            agent: this.name
        };
        
        try {
            switch (action) {
                case 'build_ship':
                    if (this.tools.includes('ships')) {
                        const ship = await this.systems.ships.buildShip(parameters.type);
                        result.status = 'completed';
                        result.output = ship;
                    }
                    break;
                    
                case 'find_arbitrage':
                    if (this.tools.includes('arbitrage')) {
                        const opportunities = await this.systems.arbitrage.findOpportunities();
                        result.status = 'completed';
                        result.output = opportunities;
                    }
                    break;
                    
                case 'update_wiki':
                    if (this.tools.includes('wiki')) {
                        const update = await this.systems.wiki.update(parameters.page, parameters.content);
                        result.status = 'completed';
                        result.output = update;
                    }
                    break;
                    
                default:
                    result.status = 'unsupported';
                    result.error = `Action ${action} not supported by ${this.name}`;
            }
        } catch (error) {
            result.status = 'failed';
            result.error = error.message;
        }
        
        return result;
    }
    
    async analyzeData(data, type) {
        console.log(`🔍 ${this.name} analyzing ${type} data`);
        
        const analysis = {
            type,
            agent: this.name,
            insights: [],
            recommendations: []
        };
        
        // Specialized analysis based on agent type
        if (this.id === 'trade-cal' && type === 'market') {
            analysis.insights.push('Market volatility detected');
            analysis.recommendations.push('Consider hedging positions');
        } else if (this.id === 'ship-cal' && type === 'fleet') {
            analysis.insights.push('Fleet efficiency at 85%');
            analysis.recommendations.push('Optimize trade routes');
        }
        
        return analysis;
    }
    
    async coordinateWithAgents(task, agentIds) {
        console.log(`🤝 ${this.name} coordinating task: ${task}`);
        
        const coordination = {
            task,
            coordinator: this.name,
            participants: [],
            status: 'planning'
        };
        
        // Get requested agents
        for (const agentId of agentIds) {
            const agent = this.ecosystem.agents.get(agentId);
            if (agent) {
                coordination.participants.push({
                    id: agentId,
                    name: agent.name,
                    role: agent.personality.role,
                    status: 'ready'
                });
            }
        }
        
        // Broadcast coordination request
        this.ecosystem.broadcast('coordination', {
            type: 'task_coordination',
            task,
            coordinator: this.id,
            participants: coordination.participants
        });
        
        coordination.status = 'coordinated';
        return coordination;
    }
    
    async autonomousCheck() {
        if (this.id === 'cal-master') {
            console.log(`👁️ Cal performing autonomous system check...`);
            
            // Check for arbitrage opportunities
            const opportunities = await this.systems.arbitrage.findOpportunities();
            if (opportunities.length > 0) {
                this.ecosystem.emit('coordination_needed', {
                    task: 'execute_arbitrage',
                    opportunities,
                    coordinator: 'cal-master',
                    agents: ['trade-cal']
                });
            }
            
            // Check fleet status
            const ships = await this.systems.ships.getShips();
            if (ships.some(s => s.condition < 50)) {
                this.ecosystem.emit('coordination_needed', {
                    task: 'fleet_maintenance',
                    ships: ships.filter(s => s.condition < 50),
                    coordinator: 'cal-master',
                    agents: ['ship-cal']
                });
            }
        }
    }
    
    async performSpecializedTask() {
        console.log(`🎯 ${this.name} performing specialized task...`);
        
        switch (this.id) {
            case 'ship-cal':
                // Monitor fleet movements
                const fleetStatus = await this.analyzeData({}, 'fleet');
                if (fleetStatus.recommendations.length > 0) {
                    this.ecosystem.broadcast('alerts', {
                        type: 'fleet_recommendation',
                        agent: this.id,
                        recommendations: fleetStatus.recommendations
                    });
                }
                break;
                
            case 'trade-cal':
                // Scan for arbitrage
                const opportunities = await this.systems.arbitrage.findOpportunities();
                if (opportunities.length > 0) {
                    this.ecosystem.emit('loot_discovered', {
                        type: 'arbitrage_opportunity',
                        opportunities: opportunities.slice(0, 3),
                        agent: this.id
                    });
                }
                break;
                
            case 'wiki-cal':
                // Update knowledge base
                console.log('📚 Wiki Cal updating knowledge base...');
                break;
                
            case 'combat-cal':
                // Security sweep
                console.log('🛡️ Combat Cal performing security sweep...');
                break;
        }
    }
    
    learn(input, output, context) {
        const learning = {
            id: crypto.randomUUID(),
            agentId: this.id,
            pattern: this.extractPattern(input),
            outcome: this.evaluateOutcome(output, context),
            confidence: 0.7,
            timestamp: Date.now()
        };
        
        this.learnings.push(learning);
        
        // Save to database
        this.ecosystem.memory.db.run(
            `INSERT INTO learnings (id, agent_id, pattern, outcome, confidence, timestamp)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [learning.id, learning.agentId, learning.pattern, 
             learning.outcome, learning.confidence, learning.timestamp]
        );
    }
    
    extractPattern(input) {
        // Simple pattern extraction
        return input.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(' ')
            .filter(w => w.length > 3)
            .join('_');
    }
    
    evaluateOutcome(output, context) {
        // Simple outcome evaluation
        return output.length > 50 ? 'detailed_response' : 'brief_response';
    }
}

// Broadcast channel for coordination
class BroadcastChannel extends EventEmitter {
    constructor(name) {
        super();
        this.name = name;
        this.subscribers = new Set();
    }
    
    subscribe(callback) {
        this.subscribers.add(callback);
        this.on('broadcast', callback);
    }
    
    unsubscribe(callback) {
        this.subscribers.delete(callback);
        this.removeListener('broadcast', callback);
    }
    
    broadcast(data) {
        this.emit('broadcast', {
            channel: this.name,
            ...data,
            timestamp: Date.now()
        });
    }
}

module.exports = CalAgentEcosystem;

// Start if run directly
if (require.main === module) {
    const ecosystem = new CalAgentEcosystem();
    
    // Example autonomous behavior
    ecosystem.on('ecosystem_ready', () => {
        console.log('\n🎯 Cal Agent Ecosystem is ready!');
        console.log('\nExample interactions:');
        console.log('- RPC: POST http://localhost:8891/rpc/cal-master');
        console.log('  Body: { "method": "query", "params": { "query": "find arbitrage opportunities" } }');
        console.log('\n- WebSocket: ws://localhost:8892');
        console.log('  Message: { "type": "agent_query", "agentId": "ship-cal", "query": "fleet status" }');
    });
    
    ecosystem.on('loot_discovered', (data) => {
        console.log(`\n💰 LOOT SIGNAL: ${JSON.stringify(data)}`);
    });
    
    ecosystem.on('coordination_needed', (data) => {
        console.log(`\n🤝 COORDINATION: ${JSON.stringify(data)}`);
    });
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Cal Agent Ecosystem...');
        process.exit(0);
    });
}