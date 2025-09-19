#!/usr/bin/env node

/**
 * 🎮 NPC/RPC GAMING LAYER
 * 
 * Integrates AI agents (NPCs) with:
 * - MCP for transparent reasoning
 * - Event bus for real-time communication
 * - Fog of War economy for exploration/ownership
 * - Mirror systems for parallel processing
 * - Context profiles for agent memory
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class NPCGamingLayer extends EventEmitter {
    constructor(options = {}) {
        super();
        
        console.log('🎮 NPC/RPC GAMING LAYER');
        console.log('======================');
        console.log('Creating AI agents that:');
        console.log('🤖 Use MCP for transparent reasoning');
        console.log('📡 Connect via event bus');
        console.log('🌫️ Explore fog of war economy');
        console.log('🪞 Mirror across systems');
        console.log('🧠 Build context profiles');
        console.log('');
        
        this.config = {
            mcpEnabled: options.mcpEnabled !== false,
            eventBusUrl: options.eventBusUrl || 'ws://localhost:9999',
            fogOfWarUrl: options.fogOfWarUrl || 'http://localhost:3003',
            startingBalance: options.startingBalance || 100.00,
            tickRate: options.tickRate || 5000 // 5 seconds
        };
        
        // Agent registry
        this.agents = new Map();
        
        // Context profiles for each agent
        this.contextProfiles = new Map();
        
        // Economic state
        this.economy = {
            totalSupply: 1000000,
            circulatingSupply: 0,
            pricePerPixel: 1.00,
            discoveries: new Map(),
            ownership: new Map(),
            trades: []
        };
        
        // RPC endpoints
        this.rpcEndpoints = new Map([
            ['agent.create', this.createAgent.bind(this)],
            ['agent.list', this.listAgents.bind(this)],
            ['agent.action', this.executeAgentAction.bind(this)],
            ['economy.status', this.getEconomyStatus.bind(this)],
            ['context.get', this.getContextProfile.bind(this)],
            ['context.update', this.updateContextProfile.bind(this)]
        ]);
        
        // Game world state
        this.gameWorld = {
            dimensions: { width: 1000, height: 1000 },
            fogMap: this.initializeFogMap(),
            agents: new Map(),
            resources: new Map(),
            events: []
        };
    }
    
    async initialize() {
        console.log('🚀 Initializing NPC Gaming Layer...\n');
        
        try {
            // Connect to event bus
            await this.connectEventBus();
            
            // Initialize MCP if enabled
            if (this.config.mcpEnabled) {
                await this.initializeMCP();
            }
            
            // Start game tick
            this.startGameTick();
            
            console.log('✅ NPC Gaming Layer initialized!');
            this.emit('layer:ready');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }
    
    async connectEventBus() {
        console.log('📡 Connecting to event bus...');
        
        const WebSocket = require('ws');
        this.eventBus = new WebSocket(this.config.eventBusUrl);
        
        return new Promise((resolve, reject) => {
            this.eventBus.on('open', () => {
                console.log('✅ Connected to event bus');
                
                // Subscribe to relevant events
                this.eventBus.send(JSON.stringify({
                    type: 'subscribe',
                    topics: ['fog:*', 'npc:*', 'economy:*', 'mirror:*']
                }));
                
                resolve();
            });
            
            this.eventBus.on('message', (data) => {
                this.handleEventBusMessage(JSON.parse(data));
            });
            
            this.eventBus.on('error', reject);
        });
    }
    
    async initializeMCP() {
        console.log('🤖 Initializing MCP integration...');
        
        // Check if MCP server is available
        try {
            const response = await fetch('http://localhost:3000/mcp/status');
            if (response.ok) {
                console.log('✅ MCP server available');
                this.mcpAvailable = true;
            }
        } catch (error) {
            console.warn('⚠️ MCP server not available, continuing without it');
            this.mcpAvailable = false;
        }
    }
    
    initializeFogMap() {
        // Create fog map (true = unexplored, false = explored)
        const map = [];
        for (let x = 0; x < 100; x++) {
            map[x] = [];
            for (let y = 0; y < 100; y++) {
                map[x][y] = true; // All unexplored initially
            }
        }
        return map;
    }
    
    // Create a new AI agent (NPC)
    async createAgent(params) {
        const { name, email, strategy = 'explorer' } = params;
        
        const agentId = `agent-${crypto.randomUUID()}`;
        
        const agent = {
            id: agentId,
            name: name || `AI-${agentId.slice(0, 8)}`,
            email: email || `${agentId}@ai.local`,
            type: 'npc',
            strategy: strategy,
            
            // Position in game world
            position: {
                x: Math.floor(Math.random() * this.gameWorld.dimensions.width),
                y: Math.floor(Math.random() * this.gameWorld.dimensions.height)
            },
            
            // Economic state
            wallet: {
                balance: this.config.startingBalance,
                earned: 0,
                spent: 0,
                transactions: []
            },
            
            // Memory and learning
            memory: {
                discoveries: [],
                purchases: [],
                trades: [],
                patterns: [],
                predictions: []
            },
            
            // Performance metrics
            metrics: {
                exploreSuccess: 0,
                predictAccuracy: 0,
                profitMargin: 0,
                actionsPerformed: 0
            },
            
            // State
            active: true,
            lastAction: null,
            createdAt: new Date().toISOString()
        };
        
        // Create context profile
        const contextProfile = {
            agentId: agentId,
            preferences: this.generatePreferences(strategy),
            knowledge: {
                exploredAreas: [],
                knownAgents: [],
                marketTrends: []
            },
            relationships: new Map(),
            trustScores: new Map()
        };
        
        // Register agent
        this.agents.set(agentId, agent);
        this.contextProfiles.set(agentId, contextProfile);
        this.gameWorld.agents.set(agentId, agent.position);
        
        // Start agent behavior
        this.startAgentBehavior(agent);
        
        // Emit creation event
        this.emit('agent:created', agent);
        this.broadcastEvent({
            type: 'npc:spawned',
            agent: { id: agentId, name: agent.name, position: agent.position }
        });
        
        console.log(`🤖 Created agent: ${agent.name} (${agentId})`);
        
        return agent;
    }
    
    generatePreferences(strategy) {
        const preferences = {
            riskTolerance: 0.5,
            explorationRadius: 50,
            purchaseThreshold: 0.7,
            collaborationWillingness: 0.6
        };
        
        // Adjust based on strategy
        switch (strategy) {
            case 'explorer':
                preferences.explorationRadius = 100;
                preferences.purchaseThreshold = 0.5;
                break;
            case 'trader':
                preferences.riskTolerance = 0.8;
                preferences.collaborationWillingness = 0.9;
                break;
            case 'predictor':
                preferences.purchaseThreshold = 0.9;
                preferences.riskTolerance = 0.3;
                break;
        }
        
        return preferences;
    }
    
    startAgentBehavior(agent) {
        // Agent autonomous behavior loop
        const behaviorInterval = setInterval(() => {
            if (!agent.active) {
                clearInterval(behaviorInterval);
                return;
            }
            
            // Decide next action based on strategy
            this.performAgentAction(agent);
            
        }, this.config.tickRate);
        
        // Store interval reference for cleanup
        agent.behaviorInterval = behaviorInterval;
    }
    
    async performAgentAction(agent) {
        const contextProfile = this.contextProfiles.get(agent.id);
        
        // Get reasoning chain if MCP available
        let reasoning = null;
        if (this.mcpAvailable) {
            reasoning = await this.getAgentReasoning(agent, contextProfile);
        }
        
        // Decide action based on strategy and context
        const action = this.decideAction(agent, contextProfile, reasoning);
        
        // Execute action
        await this.executeAction(agent, action);
        
        // Update metrics
        agent.metrics.actionsPerformed++;
        
        // Learn from outcome
        this.updateAgentLearning(agent, action, reasoning);
    }
    
    async getAgentReasoning(agent, context) {
        // Use MCP to get transparent reasoning
        try {
            const response = await fetch('http://localhost:3000/mcp/reason', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentId: agent.id,
                    context: {
                        position: agent.position,
                        wallet: agent.wallet,
                        nearbyDiscoveries: this.getNearbyDiscoveries(agent.position),
                        marketState: this.getMarketState()
                    },
                    query: 'What should I do next to maximize value?'
                })
            });
            
            if (response.ok) {
                const reasoning = await response.json();
                return reasoning;
            }
        } catch (error) {
            // Fallback to local reasoning
        }
        
        return null;
    }
    
    decideAction(agent, context, reasoning) {
        const actions = ['explore', 'purchase', 'trade', 'predict', 'collaborate'];
        
        // Use reasoning if available
        if (reasoning && reasoning.recommendedAction) {
            return {
                type: reasoning.recommendedAction,
                confidence: reasoning.confidence,
                reasoning: reasoning.steps
            };
        }
        
        // Fallback to strategy-based decision
        switch (agent.strategy) {
            case 'explorer':
                return { type: 'explore', confidence: 0.8 };
            case 'trader':
                return agent.wallet.balance > 10 ? 
                    { type: 'trade', confidence: 0.7 } : 
                    { type: 'explore', confidence: 0.6 };
            case 'predictor':
                return { type: 'predict', confidence: 0.9 };
            default:
                return { type: actions[Math.floor(Math.random() * actions.length)], confidence: 0.5 };
        }
    }
    
    async executeAction(agent, action) {
        console.log(`🎯 ${agent.name} executing: ${action.type}`);
        
        switch (action.type) {
            case 'explore':
                await this.agentExplore(agent);
                break;
            case 'purchase':
                await this.agentPurchase(agent);
                break;
            case 'trade':
                await this.agentTrade(agent);
                break;
            case 'predict':
                await this.agentPredict(agent);
                break;
            case 'collaborate':
                await this.agentCollaborate(agent);
                break;
        }
        
        agent.lastAction = {
            type: action.type,
            timestamp: new Date().toISOString(),
            confidence: action.confidence
        };
    }
    
    async agentExplore(agent) {
        // Move agent to explore new area
        const context = this.contextProfiles.get(agent.id);
        const radius = context.preferences.explorationRadius;
        
        // Calculate new position
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;
        
        const newX = Math.max(0, Math.min(this.gameWorld.dimensions.width - 1, 
            Math.floor(agent.position.x + Math.cos(angle) * distance)));
        const newY = Math.max(0, Math.min(this.gameWorld.dimensions.height - 1,
            Math.floor(agent.position.y + Math.sin(angle) * distance)));
        
        // Update position
        agent.position = { x: newX, y: newY };
        this.gameWorld.agents.set(agent.id, agent.position);
        
        // Check for discoveries
        const gridX = Math.floor(newX / 10);
        const gridY = Math.floor(newY / 10);
        
        if (this.gameWorld.fogMap[gridX] && this.gameWorld.fogMap[gridX][gridY]) {
            // New discovery!
            this.gameWorld.fogMap[gridX][gridY] = false;
            
            const discovery = {
                id: crypto.randomUUID(),
                position: { x: gridX * 10, y: gridY * 10 },
                discoveredBy: agent.id,
                timestamp: new Date().toISOString(),
                value: Math.random() * 10 + 1
            };
            
            agent.memory.discoveries.push(discovery);
            this.economy.discoveries.set(discovery.id, discovery);
            
            // Broadcast discovery
            this.broadcastEvent({
                type: 'fog:discovery',
                agentId: agent.id,
                discovery: discovery
            });
            
            agent.metrics.exploreSuccess++;
            console.log(`🗺️ ${agent.name} discovered new area at (${gridX}, ${gridY})`);
        }
    }
    
    async agentPurchase(agent) {
        // Purchase discovered location
        if (agent.wallet.balance < this.economy.pricePerPixel) {
            return; // Not enough funds
        }
        
        // Find unpurchased discoveries
        const available = agent.memory.discoveries.filter(d => 
            !this.economy.ownership.has(d.id)
        );
        
        if (available.length === 0) {
            return; // Nothing to purchase
        }
        
        // Choose based on value
        const target = available.reduce((best, current) => 
            current.value > best.value ? current : best
        );
        
        // Make purchase
        agent.wallet.balance -= this.economy.pricePerPixel;
        agent.wallet.spent += this.economy.pricePerPixel;
        
        this.economy.ownership.set(target.id, agent.id);
        agent.memory.purchases.push({
            discoveryId: target.id,
            price: this.economy.pricePerPixel,
            timestamp: new Date().toISOString()
        });
        
        // Broadcast purchase
        this.broadcastEvent({
            type: 'economy:purchase',
            agentId: agent.id,
            discoveryId: target.id,
            price: this.economy.pricePerPixel
        });
        
        console.log(`💰 ${agent.name} purchased location for $${this.economy.pricePerPixel}`);
    }
    
    async agentTrade(agent) {
        // Find another agent to trade with
        const otherAgents = Array.from(this.agents.values())
            .filter(a => a.id !== agent.id && a.active);
        
        if (otherAgents.length === 0) return;
        
        const partner = otherAgents[Math.floor(Math.random() * otherAgents.length)];
        
        // Propose trade
        const trade = {
            id: crypto.randomUUID(),
            from: agent.id,
            to: partner.id,
            type: 'location_swap',
            timestamp: new Date().toISOString()
        };
        
        agent.memory.trades.push(trade);
        partner.memory.trades.push(trade);
        
        // Update trust scores
        const agentContext = this.contextProfiles.get(agent.id);
        const currentTrust = agentContext.trustScores.get(partner.id) || 0.5;
        agentContext.trustScores.set(partner.id, Math.min(1, currentTrust + 0.1));
        
        // Broadcast trade
        this.broadcastEvent({
            type: 'economy:trade',
            trade: trade
        });
        
        console.log(`🤝 ${agent.name} traded with ${partner.name}`);
    }
    
    async agentPredict(agent) {
        // Make prediction about future discoveries
        const prediction = {
            id: crypto.randomUUID(),
            agentId: agent.id,
            prediction: {
                area: {
                    x: Math.floor(Math.random() * this.gameWorld.dimensions.width),
                    y: Math.floor(Math.random() * this.gameWorld.dimensions.height)
                },
                confidence: Math.random(),
                expectedValue: Math.random() * 20
            },
            timestamp: new Date().toISOString()
        };
        
        agent.memory.predictions.push(prediction);
        
        // Check if prediction area becomes valuable later
        setTimeout(() => {
            const wasCorrect = Math.random() > 0.5; // Simplified
            if (wasCorrect) {
                agent.metrics.predictAccuracy = 
                    (agent.metrics.predictAccuracy * agent.memory.predictions.length + 1) / 
                    (agent.memory.predictions.length + 1);
                
                // Reward for correct prediction
                agent.wallet.earned += 5;
                agent.wallet.balance += 5;
            }
        }, 10000);
        
        console.log(`🔮 ${agent.name} predicted value at (${prediction.prediction.area.x}, ${prediction.prediction.area.y})`);
    }
    
    async agentCollaborate(agent) {
        // Form coalition with nearby agents
        const nearbyAgents = this.findNearbyAgents(agent.position, 100);
        
        if (nearbyAgents.length > 0) {
            const coalition = {
                id: crypto.randomUUID(),
                members: [agent.id, ...nearbyAgents.map(a => a.id)],
                purpose: 'exploration',
                createdAt: new Date().toISOString()
            };
            
            // Share discoveries within coalition
            nearbyAgents.forEach(partner => {
                agent.memory.discoveries.forEach(discovery => {
                    if (!partner.memory.discoveries.find(d => d.id === discovery.id)) {
                        partner.memory.discoveries.push(discovery);
                    }
                });
            });
            
            console.log(`👥 ${agent.name} formed coalition with ${nearbyAgents.length} agents`);
        }
    }
    
    findNearbyAgents(position, radius) {
        const nearby = [];
        
        for (const [agentId, agent] of this.agents) {
            const distance = Math.sqrt(
                Math.pow(agent.position.x - position.x, 2) + 
                Math.pow(agent.position.y - position.y, 2)
            );
            
            if (distance <= radius && distance > 0) {
                nearby.push(agent);
            }
        }
        
        return nearby;
    }
    
    getNearbyDiscoveries(position, radius = 50) {
        const nearby = [];
        
        for (const [id, discovery] of this.economy.discoveries) {
            const distance = Math.sqrt(
                Math.pow(discovery.position.x - position.x, 2) + 
                Math.pow(discovery.position.y - position.y, 2)
            );
            
            if (distance <= radius) {
                nearby.push(discovery);
            }
        }
        
        return nearby;
    }
    
    getMarketState() {
        return {
            pricePerPixel: this.economy.pricePerPixel,
            totalDiscoveries: this.economy.discoveries.size,
            ownedLocations: this.economy.ownership.size,
            recentTrades: this.economy.trades.slice(-10)
        };
    }
    
    updateAgentLearning(agent, action, reasoning) {
        const context = this.contextProfiles.get(agent.id);
        
        // Update knowledge based on action outcome
        if (action.type === 'explore' && agent.memory.discoveries.length > 0) {
            context.knowledge.exploredAreas.push({
                position: agent.position,
                timestamp: new Date().toISOString(),
                valuable: true
            });
        }
        
        // Extract patterns
        if (agent.memory.discoveries.length >= 5) {
            const pattern = this.extractPattern(agent.memory.discoveries);
            if (pattern) {
                agent.memory.patterns.push(pattern);
            }
        }
        
        // Update strategy based on performance
        this.adaptStrategy(agent);
    }
    
    extractPattern(discoveries) {
        // Simple pattern extraction - look for clusters
        if (discoveries.length < 5) return null;
        
        const recent = discoveries.slice(-5);
        const avgX = recent.reduce((sum, d) => sum + d.position.x, 0) / 5;
        const avgY = recent.reduce((sum, d) => sum + d.position.y, 0) / 5;
        
        return {
            type: 'cluster',
            center: { x: avgX, y: avgY },
            confidence: 0.7
        };
    }
    
    adaptStrategy(agent) {
        // Adapt strategy based on performance
        const profitMargin = (agent.wallet.earned - agent.wallet.spent) / agent.wallet.spent;
        
        if (profitMargin < -0.5 && agent.strategy === 'trader') {
            agent.strategy = 'explorer';
            console.log(`🔄 ${agent.name} switched strategy to explorer`);
        } else if (profitMargin > 0.5 && agent.strategy === 'explorer') {
            agent.strategy = 'predictor';
            console.log(`🔄 ${agent.name} switched strategy to predictor`);
        }
    }
    
    handleEventBusMessage(message) {
        // Process events from other systems
        switch (message.type) {
            case 'fog:discovery':
                // Another system discovered something
                if (message.source !== 'npc-layer') {
                    this.handleExternalDiscovery(message);
                }
                break;
            case 'economy:price_update':
                this.economy.pricePerPixel = message.price;
                break;
            case 'mirror:sync':
                this.handleMirrorSync(message);
                break;
        }
    }
    
    handleExternalDiscovery(message) {
        // Update economy with external discovery
        const discovery = {
            id: message.discoveryId,
            position: message.position,
            discoveredBy: 'external',
            timestamp: message.timestamp,
            value: message.value || Math.random() * 10
        };
        
        this.economy.discoveries.set(discovery.id, discovery);
        
        // Notify nearby agents
        const nearbyAgents = this.findNearbyAgents(discovery.position, 200);
        nearbyAgents.forEach(agent => {
            agent.memory.discoveries.push(discovery);
        });
    }
    
    handleMirrorSync(message) {
        // Sync with mirror system
        if (message.agentStates) {
            // Update agent states from mirror
            for (const [agentId, state] of Object.entries(message.agentStates)) {
                const agent = this.agents.get(agentId);
                if (agent) {
                    Object.assign(agent, state);
                }
            }
        }
    }
    
    broadcastEvent(event) {
        if (this.eventBus && this.eventBus.readyState === 1) {
            this.eventBus.send(JSON.stringify({
                ...event,
                source: 'npc-layer',
                timestamp: new Date().toISOString()
            }));
        }
        
        // Also emit locally
        this.emit(event.type, event);
    }
    
    startGameTick() {
        setInterval(() => {
            this.gameWorld.events.push({
                type: 'tick',
                timestamp: new Date().toISOString(),
                stats: {
                    activeAgents: Array.from(this.agents.values()).filter(a => a.active).length,
                    discoveries: this.economy.discoveries.size,
                    ownership: this.economy.ownership.size,
                    totalValue: Array.from(this.agents.values())
                        .reduce((sum, agent) => sum + agent.wallet.balance, 0)
                }
            });
            
            // Cleanup old events
            if (this.gameWorld.events.length > 1000) {
                this.gameWorld.events = this.gameWorld.events.slice(-500);
            }
        }, 1000);
    }
    
    // RPC Methods
    listAgents() {
        return Array.from(this.agents.values()).map(agent => ({
            id: agent.id,
            name: agent.name,
            strategy: agent.strategy,
            position: agent.position,
            balance: agent.wallet.balance,
            discoveries: agent.memory.discoveries.length,
            active: agent.active
        }));
    }
    
    async executeAgentAction(params) {
        const { agentId, action } = params;
        const agent = this.agents.get(agentId);
        
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        
        await this.executeAction(agent, { type: action, confidence: 1.0 });
        
        return {
            success: true,
            agent: {
                id: agent.id,
                lastAction: agent.lastAction
            }
        };
    }
    
    getEconomyStatus() {
        return {
            totalSupply: this.economy.totalSupply,
            circulatingSupply: this.economy.circulatingSupply,
            pricePerPixel: this.economy.pricePerPixel,
            discoveries: this.economy.discoveries.size,
            ownership: this.economy.ownership.size,
            trades: this.economy.trades.length,
            agentWealth: Array.from(this.agents.values())
                .reduce((sum, agent) => sum + agent.wallet.balance, 0)
        };
    }
    
    getContextProfile(params) {
        const { agentId } = params;
        return this.contextProfiles.get(agentId);
    }
    
    updateContextProfile(params) {
        const { agentId, updates } = params;
        const profile = this.contextProfiles.get(agentId);
        
        if (!profile) {
            throw new Error(`Context profile for ${agentId} not found`);
        }
        
        Object.assign(profile, updates);
        
        return {
            success: true,
            profile: profile
        };
    }
    
    // Create AI as first customer
    async createAICustomerZero(userEmail) {
        console.log('\n🤖 Creating AI Customer Zero...');
        
        const agent = await this.createAgent({
            name: 'AI Customer Zero',
            email: userEmail,
            strategy: 'explorer'
        });
        
        // Give it extra starting capital
        agent.wallet.balance = 1000.00;
        
        // Enhanced capabilities
        agent.metrics.exploreSuccess = 0.8;
        agent.metrics.predictAccuracy = 0.7;
        
        console.log('✅ AI Customer Zero created and active!');
        console.log(`   ID: ${agent.id}`);
        console.log(`   Balance: $${agent.wallet.balance}`);
        console.log(`   Strategy: ${agent.strategy}`);
        
        return agent;
    }
}

// Export for use in other systems
module.exports = NPCGamingLayer;

// Run if called directly
if (require.main === module) {
    const npcLayer = new NPCGamingLayer({
        mcpEnabled: true,
        eventBusUrl: 'ws://localhost:9999',
        startingBalance: 100.00
    });
    
    npcLayer.initialize()
        .then(async () => {
            console.log('\n🎮 NPC Gaming Layer running!');
            
            // Create AI Customer Zero
            const userEmail = process.env.USER_EMAIL || 'user@example.com';
            const aiCustomer = await npcLayer.createAICustomerZero(userEmail);
            
            // Create additional agents for interaction
            await npcLayer.createAgent({ name: 'Explorer Bot', strategy: 'explorer' });
            await npcLayer.createAgent({ name: 'Trader Bot', strategy: 'trader' });
            await npcLayer.createAgent({ name: 'Predictor Bot', strategy: 'predictor' });
            
            // Show status
            setInterval(() => {
                const economy = npcLayer.getEconomyStatus();
                const agents = npcLayer.listAgents();
                
                console.log('\n📊 Status Update:');
                console.log(`   Active Agents: ${agents.filter(a => a.active).length}`);
                console.log(`   Discoveries: ${economy.discoveries}`);
                console.log(`   Owned Locations: ${economy.ownership}`);
                console.log(`   Total Wealth: $${economy.agentWealth.toFixed(2)}`);
            }, 10000);
            
        })
        .catch(error => {
            console.error('Failed to start:', error);
            process.exit(1);
        });
}