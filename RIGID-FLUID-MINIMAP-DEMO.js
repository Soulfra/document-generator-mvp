#!/usr/bin/env node

/**
 * 🌊⚡🗺️ RIGID-FLUID-MINIMAP ARCHITECTURE DEMO
 * 
 * This demonstrates the three-layer pattern:
 * 1. RIGID APIs (unchanging contracts)
 * 2. FLUID State (blockchain-like event stream)  
 * 3. MINIMAP View (limited MUD-style viewport)
 */

const express = require('express');
const EventEmitter = require('events');
const crypto = require('crypto');

// ============================================
// LAYER 2: FLUID STATE (Blockchain-like)
// ============================================
class FluidStateManager extends EventEmitter {
    constructor() {
        super();
        this.currentState = {
            agents: new Map(),
            rooms: new Map(),
            globalStats: {
                totalCompute: 0,
                totalTrades: 0,
                activeZones: new Set(['spawn'])
            }
        };
        
        // Blockchain-like event chain
        this.eventChain = [];
        this.stateSnapshots = [];
        
        console.log('🌊 Fluid State Manager initialized');
        
        // Initialize some rooms
        this.initializeWorld();
    }
    
    initializeWorld() {
        // Create the game world
        this.currentState.rooms.set('spawn', {
            name: 'Spawn Point',
            description: 'A shimmering portal where agents materialize',
            agents: new Set(),
            connections: ['tradingPost', 'computeFarm'],
            resources: { compute: 100 }
        });
        
        this.currentState.rooms.set('tradingPost', {
            name: 'Trading Post', 
            description: 'Bustling marketplace where compute is traded',
            agents: new Set(),
            connections: ['spawn', 'demonLayer'],
            resources: { credits: 1000 }
        });
        
        this.currentState.rooms.set('computeFarm', {
            name: 'Compute Farm',
            description: 'Massive server racks humming with calculations',
            agents: new Set(),
            connections: ['spawn', 'demonLayer'],
            resources: { compute: 10000 }
        });
        
        this.currentState.rooms.set('demonLayer', {
            name: 'Demon Layer',
            description: 'Where overloaded agents go to battle for resources',
            agents: new Set(),
            connections: ['tradingPost', 'computeFarm'],
            resources: { compute: 50000, danger: true }
        });
    }
    
    // Blockchain-like append operation
    appendEvent(event) {
        const eventWithHash = {
            ...event,
            timestamp: Date.now(),
            previousHash: this.eventChain.length > 0 ? 
                this.eventChain[this.eventChain.length - 1].hash : 
                '0000000000',
            index: this.eventChain.length
        };
        
        // Calculate event hash
        eventWithHash.hash = crypto
            .createHash('sha256')
            .update(JSON.stringify(eventWithHash))
            .digest('hex')
            .substring(0, 10);
        
        this.eventChain.push(eventWithHash);
        
        // Process event and update state
        this.processEvent(eventWithHash);
        
        // Emit for real-time updates
        this.emit('stateChanged', eventWithHash);
        
        // Take snapshot every 10 events
        if (this.eventChain.length % 10 === 0) {
            this.takeSnapshot();
        }
        
        return eventWithHash;
    }
    
    processEvent(event) {
        switch (event.type) {
            case 'agent.created':
                this.currentState.agents.set(event.agentId, {
                    id: event.agentId,
                    name: event.name,
                    room: 'spawn',
                    compute: 100,
                    balance: 0,
                    level: 1
                });
                this.currentState.rooms.get('spawn').agents.add(event.agentId);
                break;
                
            case 'agent.moved':
                const agent = this.currentState.agents.get(event.agentId);
                if (agent) {
                    const oldRoom = this.currentState.rooms.get(agent.room);
                    const newRoom = this.currentState.rooms.get(event.toRoom);
                    
                    if (oldRoom && newRoom) {
                        oldRoom.agents.delete(event.agentId);
                        newRoom.agents.add(event.agentId);
                        agent.room = event.toRoom;
                        
                        // Consume compute for movement
                        agent.compute -= 10;
                        this.currentState.globalStats.totalCompute += 10;
                    }
                }
                break;
                
            case 'agent.traded':
                const trader = this.currentState.agents.get(event.agentId);
                if (trader) {
                    trader.compute -= event.computeSpent;
                    trader.balance += event.creditsGained;
                    this.currentState.globalStats.totalTrades++;
                    this.currentState.globalStats.totalCompute += event.computeSpent;
                }
                break;
                
            case 'agent.battled':
                const fighter = this.currentState.agents.get(event.agentId);
                if (fighter && event.won) {
                    fighter.level++;
                    fighter.compute += 500; // Reward
                }
                break;
        }
    }
    
    takeSnapshot() {
        this.stateSnapshots.push({
            timestamp: Date.now(),
            eventIndex: this.eventChain.length,
            state: JSON.parse(JSON.stringify({
                agents: Array.from(this.currentState.agents.entries()),
                rooms: Array.from(this.currentState.rooms.entries()).map(([name, room]) => [
                    name,
                    { ...room, agents: Array.from(room.agents) }
                ]),
                globalStats: {
                    ...this.currentState.globalStats,
                    activeZones: Array.from(this.currentState.globalStats.activeZones)
                }
            }))
        });
        
        console.log(`📸 Snapshot taken at event ${this.eventChain.length}`);
    }
    
    getBlockchainInfo() {
        return {
            chainLength: this.eventChain.length,
            lastBlock: this.eventChain[this.eventChain.length - 1] || null,
            snapshots: this.stateSnapshots.length,
            globalStats: this.currentState.globalStats
        };
    }
}

// ============================================
// LAYER 1: RIGID APIs (Never change)
// ============================================
class RigidAPILayer {
    constructor(stateManager) {
        this.app = express();
        this.app.use(express.json());
        this.stateManager = stateManager;
        this.port = 3337; // Fixed port - NEVER CHANGES
        
        this.setupEndpoints();
        console.log('⚡ Rigid API Layer initialized');
    }
    
    setupEndpoints() {
        // These endpoints NEVER change their contracts
        
        // POST /api/agent/create - RIGID CONTRACT
        this.app.post('/api/agent/create', (req, res) => {
            const { name } = req.body;
            if (!name) {
                return res.status(400).json({ error: 'name is required' });
            }
            
            const agentId = `agent_${Date.now()}`;
            const event = this.stateManager.appendEvent({
                type: 'agent.created',
                agentId,
                name
            });
            
            res.json({
                success: true,
                agentId,
                eventHash: event.hash
            });
        });
        
        // POST /api/agent/move - RIGID CONTRACT
        this.app.post('/api/agent/move', (req, res) => {
            const { agentId, toRoom } = req.body;
            if (!agentId || !toRoom) {
                return res.status(400).json({ error: 'agentId and toRoom are required' });
            }
            
            const event = this.stateManager.appendEvent({
                type: 'agent.moved',
                agentId,
                toRoom
            });
            
            res.json({
                success: true,
                eventHash: event.hash
            });
        });
        
        // POST /api/agent/trade - RIGID CONTRACT
        this.app.post('/api/agent/trade', (req, res) => {
            const { agentId, computeSpent } = req.body;
            if (!agentId || !computeSpent) {
                return res.status(400).json({ error: 'agentId and computeSpent are required' });
            }
            
            const creditsGained = computeSpent * 10; // Fixed exchange rate
            
            const event = this.stateManager.appendEvent({
                type: 'agent.traded',
                agentId,
                computeSpent,
                creditsGained
            });
            
            res.json({
                success: true,
                creditsGained,
                eventHash: event.hash
            });
        });
        
        // GET /api/blockchain/info - RIGID CONTRACT
        this.app.get('/api/blockchain/info', (req, res) => {
            res.json(this.stateManager.getBlockchainInfo());
        });
        
        // GET /api/blockchain/events - RIGID CONTRACT
        this.app.get('/api/blockchain/events', (req, res) => {
            const limit = parseInt(req.query.limit) || 10;
            const events = this.stateManager.eventChain.slice(-limit);
            res.json({ events, total: this.stateManager.eventChain.length });
        });
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log(`⚡ Rigid API Layer running on http://localhost:${this.port}`);
            console.log('📋 Endpoints (THESE NEVER CHANGE):');
            console.log('   POST /api/agent/create');
            console.log('   POST /api/agent/move');
            console.log('   POST /api/agent/trade');
            console.log('   GET  /api/blockchain/info');
            console.log('   GET  /api/blockchain/events');
        });
    }
}

// ============================================
// LAYER 3: MINIMAP/MUD VIEW (Limited viewport)
// ============================================
class MinimapMUDView {
    constructor(stateManager) {
        this.stateManager = stateManager;
        this.currentAgentId = null;
        this.viewRadius = 1; // Can only see current room
        
        // Listen to state changes
        this.stateManager.on('stateChanged', (event) => {
            this.handleStateChange(event);
        });
        
        console.log('🗺️ Minimap/MUD View initialized');
    }
    
    setViewingAgent(agentId) {
        this.currentAgentId = agentId;
        console.log(`👁️ Now viewing through agent: ${agentId}`);
    }
    
    getVisibleState() {
        if (!this.currentAgentId) {
            return { error: 'No agent selected for viewing' };
        }
        
        const agent = this.stateManager.currentState.agents.get(this.currentAgentId);
        if (!agent) {
            return { error: 'Agent not found' };
        }
        
        const currentRoom = this.stateManager.currentState.rooms.get(agent.room);
        
        // LIMITED VIEW - only see current room
        return {
            you: {
                id: agent.id,
                name: agent.name,
                compute: agent.compute,
                balance: agent.balance,
                level: agent.level
            },
            room: {
                name: currentRoom.name,
                description: currentRoom.description,
                agentCount: currentRoom.agents.size,
                exits: currentRoom.connections,
                resources: currentRoom.resources
            },
            // Can't see other rooms or global state!
            globalAwareness: {
                totalAgents: '???',
                totalCompute: '???',
                otherRooms: 'hidden'
            }
        };
    }
    
    handleStateChange(event) {
        // Only notify if it affects the current view
        if (this.currentAgentId) {
            const agent = this.stateManager.currentState.agents.get(this.currentAgentId);
            if (!agent) return;
            
            // Check if event affects current room
            if (event.type === 'agent.moved' && 
                (event.toRoom === agent.room || event.fromRoom === agent.room)) {
                console.log(`🗺️ [MUD View] Someone entered/left your room`);
            } else if (event.agentId === this.currentAgentId) {
                console.log(`🗺️ [MUD View] You performed action: ${event.type}`);
            }
            // Most events are invisible to the limited view!
        }
    }
    
    displayView() {
        const view = this.getVisibleState();
        console.log('\n========== MUD VIEW ==========');
        if (view.error) {
            console.log(`ERROR: ${view.error}`);
        } else {
            console.log(`You are ${view.you.name} (Level ${view.you.level})`);
            console.log(`Compute: ${view.you.compute} | Credits: ${view.you.balance}`);
            console.log(`\nLocation: ${view.room.name}`);
            console.log(`${view.room.description}`);
            console.log(`\nOther agents here: ${view.room.agentCount - 1}`);
            console.log(`Exits: ${view.room.exits.join(', ')}`);
            console.log('\n[Your view is limited - the world is much larger]');
        }
        console.log('==============================\n');
    }
}

// ============================================
// DEMO: Putting it all together
// ============================================
class RigidFluidMinimapDemo {
    constructor() {
        // Create the three layers
        this.stateManager = new FluidStateManager();
        this.apiLayer = new RigidAPILayer(this.stateManager);
        this.mudView = new MinimapMUDView(this.stateManager);
        
        console.log('\n🎮 RIGID-FLUID-MINIMAP DEMO READY!\n');
    }
    
    async runDemo() {
        // Start the API server
        this.apiLayer.start();
        
        // Wait a moment for server to start
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('\n📖 DEMO SCENARIO:');
        console.log('1. Create agents through RIGID API');
        console.log('2. Watch FLUID state flow through blockchain');
        console.log('3. See LIMITED view through MUD minimap\n');
        
        // Demo sequence
        await this.createDemoAgent('Alice');
        await this.createDemoAgent('Bob');
        
        // Set MUD view to Alice
        this.mudView.setViewingAgent('agent_alice');
        this.mudView.displayView();
        
        // Move Alice
        await this.moveAgent('agent_alice', 'tradingPost');
        this.mudView.displayView();
        
        // Trade some compute
        await this.tradeCompute('agent_alice', 50);
        this.mudView.displayView();
        
        // Show blockchain info
        await this.showBlockchainInfo();
        
        console.log('\n✨ DEMO COMPLETE!');
        console.log('\nKEY INSIGHTS:');
        console.log('1. APIs remain RIGID - same endpoints, same contracts');
        console.log('2. State flows FLUIDLY - blockchain tracks everything');
        console.log('3. MUD shows LIMITED view - you only see your room');
        console.log('\nThis is why it feels confusing - three different paradigms!');
    }
    
    async createDemoAgent(name) {
        console.log(`\n🤖 Creating agent: ${name}`);
        
        // Override the ID generation for demo
        const originalAppend = this.stateManager.appendEvent;
        this.stateManager.appendEvent = function(event) {
            if (event.type === 'agent.created') {
                event.agentId = `agent_${name.toLowerCase()}`;
            }
            return originalAppend.call(this, event);
        };
        
        const event = this.stateManager.appendEvent({
            type: 'agent.created',
            name
        });
        
        // Restore original
        this.stateManager.appendEvent = originalAppend;
        
        console.log(`   ✅ Created with hash: ${event.hash}`);
    }
    
    async moveAgent(agentId, toRoom) {
        console.log(`\n🚶 Moving ${agentId} to ${toRoom}`);
        const event = this.stateManager.appendEvent({
            type: 'agent.moved',
            agentId,
            toRoom
        });
        console.log(`   ✅ Moved with hash: ${event.hash}`);
    }
    
    async tradeCompute(agentId, amount) {
        console.log(`\n💱 Trading ${amount} compute`);
        const event = this.stateManager.appendEvent({
            type: 'agent.traded',
            agentId,
            computeSpent: amount,
            creditsGained: amount * 10
        });
        console.log(`   ✅ Traded with hash: ${event.hash}`);
    }
    
    async showBlockchainInfo() {
        console.log('\n⛓️ BLOCKCHAIN STATE:');
        const info = this.stateManager.getBlockchainInfo();
        console.log(`   Chain Length: ${info.chainLength} events`);
        console.log(`   Snapshots: ${info.snapshots}`);
        console.log(`   Total Compute Used: ${info.globalStats.totalCompute}`);
        console.log(`   Total Trades: ${info.globalStats.totalTrades}`);
        
        console.log('\n   Recent Events:');
        this.stateManager.eventChain.slice(-5).forEach(event => {
            console.log(`   [${event.index}] ${event.type} - Hash: ${event.hash}`);
        });
    }
}

// Run the demo if called directly
if (require.main === module) {
    const demo = new RigidFluidMinimapDemo();
    demo.runDemo().catch(console.error);
}

module.exports = { FluidStateManager, RigidAPILayer, MinimapMUDView };