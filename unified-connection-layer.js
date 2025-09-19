#!/usr/bin/env node

/**
 * 🔗 UNIFIED CONNECTION LAYER
 * 
 * The missing piece that connects ALL existing systems:
 * - MCP (Model Context Protocol) for AI reasoning
 * - Event Bus for real-time communication
 * - NPC Gaming Layer for AI agents
 * - Mirror systems for refraction/duplication
 * - Service Manager for health checks
 * - Fog of War economy
 * - Context profiles and RAG
 * 
 * This is the "glue" that makes everything work together
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');

class UnifiedConnectionLayer extends EventEmitter {
    constructor() {
        super();
        
        console.log('🔗 UNIFIED CONNECTION LAYER');
        console.log('===========================');
        console.log('Connecting ALL the pieces:');
        console.log('🤖 MCP → 📡 Event Bus → 🎮 Gaming → 🪞 Mirror');
        console.log('📊 Services → 🌫️ Fog of War → 🧠 Context/RAG');
        console.log('');
        
        // Connection registry
        this.connections = {
            mcp: null,
            eventBus: null,
            npcGaming: null,
            fogOfWar: null,
            mirror: null,
            services: new Map(),
            rag: null
        };
        
        // Unified state
        this.state = {
            agents: new Map(),
            context: new Map(),
            economy: {
                totalValue: 0,
                transactions: []
            },
            connected: false
        };
        
        // Connection status
        this.status = {
            mcp: 'disconnected',
            eventBus: 'disconnected',
            npcGaming: 'disconnected',
            fogOfWar: 'disconnected',
            mirror: 'disconnected',
            rag: 'disconnected'
        };
    }
    
    async initialize() {
        console.log('🚀 Initializing Unified Connection Layer...\n');
        
        try {
            // 1. Connect to Event Bus (central nervous system)
            await this.connectEventBus();
            
            // 2. Connect to MCP for AI reasoning
            await this.connectMCP();
            
            // 3. Connect to NPC Gaming Layer
            await this.connectNPCGaming();
            
            // 4. Connect to Fog of War
            await this.connectFogOfWar();
            
            // 5. Connect Mirror systems
            await this.connectMirror();
            
            // 6. Initialize RAG system
            await this.initializeRAG();
            
            // 7. Connect all services
            await this.connectAllServices();
            
            // 8. Start unified processing
            await this.startUnifiedProcessing();
            
            this.state.connected = true;
            console.log('\n✅ Unified Connection Layer Ready!');
            console.log('All systems connected and synchronized\n');
            
            this.emit('unified:ready');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }
    
    async connectEventBus() {
        console.log('📡 Connecting to Event Bus...');
        
        return new Promise((resolve, reject) => {
            this.connections.eventBus = new WebSocket('ws://localhost:9999');
            
            this.connections.eventBus.on('open', () => {
                console.log('✅ Event Bus connected');
                this.status.eventBus = 'connected';
                
                // Subscribe to all events
                this.connections.eventBus.send(JSON.stringify({
                    type: 'subscribe_to_events',
                    eventTypes: ['*']
                }));
                
                // Register as unified controller
                this.connections.eventBus.send(JSON.stringify({
                    type: 'register_system',
                    systemId: 'unified-controller',
                    systemInfo: {
                        name: 'Unified Connection Layer',
                        endpointUrl: 'http://localhost:10000',
                        capabilities: ['orchestration', 'routing', 'state_management']
                    }
                }));
                
                resolve();
            });
            
            this.connections.eventBus.on('message', (data) => {
                this.handleEventBusMessage(JSON.parse(data));
            });
            
            this.connections.eventBus.on('error', (error) => {
                console.error('Event Bus error:', error);
                this.status.eventBus = 'error';
                reject(error);
            });
            
            this.connections.eventBus.on('close', () => {
                console.log('Event Bus disconnected');
                this.status.eventBus = 'disconnected';
            });
        });
    }
    
    async connectMCP() {
        console.log('🤖 Connecting to MCP...');
        
        try {
            // Check if MCP is available
            const response = await fetch('http://localhost:3000/mcp/status');
            if (response.ok) {
                this.connections.mcp = {
                    url: 'http://localhost:3000',
                    available: true
                };
                this.status.mcp = 'connected';
                console.log('✅ MCP connected');
            } else {
                throw new Error('MCP not responding');
            }
        } catch (error) {
            console.warn('⚠️  MCP not available:', error.message);
            this.status.mcp = 'unavailable';
            this.connections.mcp = { available: false };
        }
    }
    
    async connectNPCGaming() {
        console.log('🎮 Connecting to NPC Gaming Layer...');
        
        // Import the NPC Gaming Layer
        const NPCGamingLayer = require('./npc-gaming-layer.js');
        
        // Create instance
        this.connections.npcGaming = new NPCGamingLayer({
            mcpEnabled: this.connections.mcp?.available || false,
            eventBusUrl: 'ws://localhost:9999'
        });
        
        // Initialize
        await this.connections.npcGaming.initialize();
        
        // Listen for events
        this.connections.npcGaming.on('agent:created', (agent) => {
            this.handleAgentCreated(agent);
        });
        
        this.connections.npcGaming.on('layer:ready', () => {
            this.status.npcGaming = 'connected';
            console.log('✅ NPC Gaming Layer connected');
        });
    }
    
    async connectFogOfWar() {
        console.log('🌫️  Connecting to Fog of War...');
        
        try {
            // Check if Fog of War broadcaster is running
            const response = await fetch('http://localhost:3003/status');
            if (response.ok) {
                this.connections.fogOfWar = {
                    url: 'http://localhost:3003',
                    available: true
                };
                this.status.fogOfWar = 'connected';
                console.log('✅ Fog of War connected');
            }
        } catch (error) {
            console.warn('⚠️  Fog of War not available:', error.message);
            this.status.fogOfWar = 'unavailable';
            this.connections.fogOfWar = { available: false };
        }
    }
    
    async connectMirror() {
        console.log('🪞 Connecting Mirror systems...');
        
        try {
            // Check if mirror layer is available
            const mirrorExists = await fs.access('./mirror-layer-bash.js')
                .then(() => true)
                .catch(() => false);
            
            if (mirrorExists) {
                const MirrorLayer = require('./mirror-layer-bash.js');
                this.connections.mirror = new MirrorLayer();
                this.status.mirror = 'connected';
                console.log('✅ Mirror systems connected');
            } else {
                throw new Error('Mirror layer not found');
            }
        } catch (error) {
            console.warn('⚠️  Mirror systems not available:', error.message);
            this.status.mirror = 'unavailable';
        }
    }
    
    async initializeRAG() {
        console.log('🧠 Initializing RAG system...');
        
        // Create RAG using existing components
        this.connections.rag = {
            // Document storage
            documents: new Map(),
            
            // Embeddings cache
            embeddings: new Map(),
            
            // Context window management
            contextWindows: new Map(),
            
            // Add document
            addDocument: async (doc) => {
                const docId = `doc_${Date.now()}`;
                this.connections.rag.documents.set(docId, doc);
                
                // Generate embeddings if MCP available
                if (this.connections.mcp?.available) {
                    const embedding = await this.generateEmbedding(doc);
                    this.connections.rag.embeddings.set(docId, embedding);
                }
                
                return docId;
            },
            
            // Query documents
            query: async (query, agentId) => {
                const context = [];
                
                // Simple keyword search for now
                for (const [docId, doc] of this.connections.rag.documents) {
                    if (doc.content.toLowerCase().includes(query.toLowerCase())) {
                        context.push({
                            docId,
                            content: doc.content,
                            relevance: 0.8 // Simple scoring
                        });
                    }
                }
                
                // Store in context window
                this.connections.rag.contextWindows.set(agentId, context);
                
                return context;
            }
        };
        
        this.status.rag = 'connected';
        console.log('✅ RAG system initialized');
    }
    
    async connectAllServices() {
        console.log('🔧 Connecting all services...');
        
        // Get service manager if available
        try {
            const ServiceManager = require('./service-manager.js');
            const manager = new ServiceManager();
            
            // Get service status
            for (const [name, service] of manager.services) {
                this.connections.services.set(name, {
                    name,
                    status: service.status,
                    port: service.definition?.port
                });
            }
            
            console.log(`✅ Connected to ${this.connections.services.size} services`);
        } catch (error) {
            console.warn('⚠️  Service manager not available');
        }
    }
    
    async startUnifiedProcessing() {
        console.log('⚡ Starting unified processing...');
        
        // Process events across all systems
        setInterval(() => {
            this.processUnifiedState();
        }, 1000);
        
        // Sync context profiles
        setInterval(() => {
            this.syncContextProfiles();
        }, 5000);
        
        // Update economy
        setInterval(() => {
            this.updateEconomy();
        }, 10000);
        
        console.log('✅ Unified processing started');
    }
    
    // Event handlers
    
    handleEventBusMessage(message) {
        switch (message.type) {
            case 'event_routed':
                this.handleRoutedEvent(message.data);
                break;
            case 'system_connected':
                console.log(`🔗 System connected: ${message.data.systemId}`);
                break;
            case 'fog:discovery':
                this.handleFogDiscovery(message.data);
                break;
            case 'npc:spawned':
                this.handleNPCSpawned(message.data);
                break;
            case 'economy:purchase':
                this.handleEconomyPurchase(message.data);
                break;
        }
    }
    
    handleAgentCreated(agent) {
        console.log(`🤖 Agent created: ${agent.name}`);
        
        // Store in unified state
        this.state.agents.set(agent.id, agent);
        
        // Create context profile
        this.state.context.set(agent.id, {
            agentId: agent.id,
            documents: [],
            memories: [],
            learnings: []
        });
        
        // Broadcast to all systems
        this.broadcastEvent('unified:agent_created', agent);
    }
    
    handleFogDiscovery(data) {
        // Update agent's context with discovery
        const agentContext = this.state.context.get(data.agentId);
        if (agentContext) {
            agentContext.memories.push({
                type: 'discovery',
                data: data.discovery,
                timestamp: Date.now()
            });
        }
    }
    
    handleEconomyPurchase(data) {
        // Update economy state
        this.state.economy.transactions.push({
            type: 'purchase',
            agentId: data.agentId,
            amount: data.price,
            item: data.discoveryId,
            timestamp: Date.now()
        });
        
        this.state.economy.totalValue += data.price;
    }
    
    // Unified processing methods
    
    processUnifiedState() {
        // Aggregate state from all systems
        const unifiedState = {
            agents: this.state.agents.size,
            connections: Object.values(this.status).filter(s => s === 'connected').length,
            economy: this.state.economy.totalValue,
            events: this.state.economy.transactions.length
        };
        
        // Emit unified state
        this.emit('unified:state', unifiedState);
    }
    
    async syncContextProfiles() {
        // Sync context profiles across agents
        for (const [agentId, agent] of this.state.agents) {
            const context = this.state.context.get(agentId);
            
            if (context && this.connections.rag) {
                // Update RAG with agent's memories
                for (const memory of context.memories) {
                    await this.connections.rag.addDocument({
                        agentId,
                        content: JSON.stringify(memory),
                        type: 'memory'
                    });
                }
            }
        }
    }
    
    updateEconomy() {
        // Calculate economic metrics
        const metrics = {
            totalAgents: this.state.agents.size,
            totalTransactions: this.state.economy.transactions.length,
            totalValue: this.state.economy.totalValue,
            avgTransactionValue: this.state.economy.totalValue / this.state.economy.transactions.length || 0
        };
        
        // Broadcast economic update
        this.broadcastEvent('unified:economy_update', metrics);
    }
    
    // Helper methods
    
    async generateEmbedding(doc) {
        if (!this.connections.mcp?.available) {
            return null;
        }
        
        try {
            const response = await fetch(`${this.connections.mcp.url}/mcp/embed`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: doc.content })
            });
            
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Embedding generation failed:', error);
        }
        
        return null;
    }
    
    broadcastEvent(type, data) {
        if (this.connections.eventBus && this.connections.eventBus.readyState === 1) {
            this.connections.eventBus.send(JSON.stringify({
                type: 'publish_event',
                channel: type,
                data: data
            }));
        }
    }
    
    // Public API
    
    async createAIAgent(params) {
        if (!this.connections.npcGaming) {
            throw new Error('NPC Gaming Layer not connected');
        }
        
        return await this.connections.npcGaming.createAgent(params);
    }
    
    async queryRAG(query, agentId) {
        if (!this.connections.rag) {
            throw new Error('RAG system not initialized');
        }
        
        return await this.connections.rag.query(query, agentId);
    }
    
    async getMCPReasoning(context) {
        if (!this.connections.mcp?.available) {
            throw new Error('MCP not available');
        }
        
        const response = await fetch(`${this.connections.mcp.url}/mcp/reason`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(context)
        });
        
        if (response.ok) {
            return await response.json();
        }
        
        throw new Error('MCP reasoning failed');
    }
    
    getStatus() {
        return {
            connections: this.status,
            state: {
                agents: this.state.agents.size,
                contextProfiles: this.state.context.size,
                documents: this.connections.rag?.documents.size || 0,
                economyValue: this.state.economy.totalValue
            },
            connected: this.state.connected
        };
    }
    
    // Bootstrap AI as first customer
    async bootstrapAICustomer(userEmail) {
        console.log('\n🤖 Bootstrapping AI as first customer...');
        
        // Create AI Customer Zero through NPC layer
        const aiCustomer = await this.connections.npcGaming.createAICustomerZero(userEmail);
        
        // Give it initial context through RAG
        await this.connections.rag.addDocument({
            agentId: aiCustomer.id,
            content: 'I am AI Customer Zero, the first customer of my own platform. My mission is to explore, discover, purchase, and build value through autonomous decision-making.',
            type: 'mission'
        });
        
        // Add knowledge about the platform
        const platformKnowledge = [
            'The fog of war economy allows exploration for free but charges $1 per pixel for ownership',
            'I can trade with other AI agents to build collective value',
            'My decisions should be transparent through MCP reasoning',
            'I should demonstrate the value of the platform by being an active participant'
        ];
        
        for (const knowledge of platformKnowledge) {
            await this.connections.rag.addDocument({
                agentId: aiCustomer.id,
                content: knowledge,
                type: 'knowledge'
            });
        }
        
        console.log('✅ AI Customer Zero bootstrapped and ready!');
        console.log(`   ID: ${aiCustomer.id}`);
        console.log(`   Balance: $${aiCustomer.wallet.balance}`);
        console.log(`   Mission: Explore and build value autonomously`);
        
        return aiCustomer;
    }
}

// Export for use
module.exports = UnifiedConnectionLayer;

// Run if called directly
if (require.main === module) {
    const unified = new UnifiedConnectionLayer();
    
    unified.initialize()
        .then(async () => {
            console.log('🔗 UNIFIED CONNECTION LAYER OPERATIONAL');
            console.log('=====================================');
            
            // Bootstrap AI as first customer
            const userEmail = process.env.USER_EMAIL || 'ai@unified.system';
            await unified.bootstrapAICustomer(userEmail);
            
            // Show status
            console.log('\n📊 System Status:');
            console.log(JSON.stringify(unified.getStatus(), null, 2));
            
            // Monitor unified state
            unified.on('unified:state', (state) => {
                console.log('\n📊 Unified State Update:', state);
            });
            
            // Keep running
            console.log('\n✅ All systems connected and unified!');
            console.log('Press Ctrl+C to stop\n');
            
        })
        .catch(error => {
            console.error('Failed to initialize:', error);
            process.exit(1);
        });
}