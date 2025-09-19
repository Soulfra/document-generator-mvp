#!/usr/bin/env node

/**
 * 🌊 UNIFIED FLUID STATE MANAGER
 * 
 * The blockchain-like middle layer that connects all rigid APIs
 * to all limited views. State flows through this system like water.
 * 
 * "Everything affects everything"
 */

const EventEmitter = require('events');
const sqlite3 = require('sqlite3').verbose();
const Redis = require('redis');
const crypto = require('crypto');
const WebSocket = require('ws');

class UnifiedFluidStateManager extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Configuration
        this.config = {
            dbPath: options.dbPath || './state/unified-state.db',
            redisUrl: options.redisUrl || 'redis://localhost:6379',
            wsPort: options.wsPort || 4001,
            snapshotInterval: options.snapshotInterval || 100, // Events between snapshots
            ...options
        };
        
        // State components
        this.currentState = {
            agents: new Map(),
            rooms: new Map(),
            forums: new Map(),
            trades: new Map(),
            battles: new Map(),
            globalStats: {
                totalCompute: 0,
                totalTrades: 0,
                totalPosts: 0,
                totalBattles: 0,
                activeZones: new Set(['spawn']),
                economicVelocity: 0,
                legendaryEvents: 0
            }
        };
        
        // Blockchain-like event chain
        this.eventChain = [];
        this.stateSnapshots = [];
        this.pendingEvents = [];
        
        // Connected systems
        this.rigidAPIs = new Map(); // Port -> API info
        this.minimapViews = new Map(); // ViewId -> View info
        
        // Initialize
        this.db = null;
        this.redis = null;
        this.wsServer = null;
        
        console.log('🌊 UNIFIED FLUID STATE MANAGER');
        console.log('==============================');
        console.log('The ocean where all state flows');
    }
    
    /**
     * Initialize all connections
     */
    async initialize() {
        console.log('🔧 Initializing Fluid State Manager...');
        
        // Connect to SQLite for persistent blockchain
        await this.connectDatabase();
        
        // Connect to Redis for fast state access
        await this.connectRedis();
        
        // Start WebSocket server for real-time updates
        this.startWebSocketServer();
        
        // Load existing state
        await this.loadState();
        
        // Register system APIs
        this.registerSystemAPIs();
        
        console.log('✅ Fluid State Manager initialized');
        console.log(`📊 Event chain length: ${this.eventChain.length}`);
        console.log(`🌐 WebSocket on port: ${this.config.wsPort}`);
    }
    
    /**
     * Connect to SQLite database
     */
    async connectDatabase() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.config.dbPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('📊 Connected to state database');
                    this.initializeDatabase().then(resolve).catch(reject);
                }
            });
        });
    }
    
    /**
     * Initialize database schema
     */
    async initializeDatabase() {
        const schema = `
            -- Blockchain-like event chain
            CREATE TABLE IF NOT EXISTS event_chain (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_index INTEGER UNIQUE,
                event_type TEXT NOT NULL,
                event_data TEXT NOT NULL,
                event_hash TEXT NOT NULL,
                previous_hash TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            -- State snapshots for time travel
            CREATE TABLE IF NOT EXISTS state_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                snapshot_index INTEGER,
                event_index INTEGER,
                state_data TEXT NOT NULL,
                state_hash TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            -- API registrations
            CREATE TABLE IF NOT EXISTS rigid_apis (
                port INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                endpoints TEXT NOT NULL,
                last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            -- View registrations  
            CREATE TABLE IF NOT EXISTS minimap_views (
                view_id TEXT PRIMARY KEY,
                view_type TEXT NOT NULL,
                viewport_config TEXT NOT NULL,
                last_update DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_event_hash ON event_chain(event_hash);
            CREATE INDEX IF NOT EXISTS idx_event_type ON event_chain(event_type);
            CREATE INDEX IF NOT EXISTS idx_snapshot_event ON state_snapshots(event_index);
        `;
        
        await this.runQuery(schema);
    }
    
    /**
     * Connect to Redis
     */
    async connectRedis() {
        try {
            this.redis = Redis.createClient({
                url: this.config.redisUrl
            });
            
            this.redis.on('error', err => console.error('Redis error:', err));
            await this.redis.connect();
            
            console.log('🚀 Connected to Redis for fast state access');
        } catch (error) {
            console.warn('⚠️  Redis not available, using memory only');
            this.redis = null;
        }
    }
    
    /**
     * Start WebSocket server for real-time updates
     */
    startWebSocketServer() {
        this.wsServer = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wsServer.on('connection', (ws, req) => {
            const clientId = crypto.randomBytes(8).toString('hex');
            console.log(`🔌 Client connected: ${clientId}`);
            
            // Send current state summary
            ws.send(JSON.stringify({
                type: 'state_summary',
                data: this.getStateSummary(),
                timestamp: Date.now()
            }));
            
            // Handle view registration
            ws.on('message', (message) => {
                try {
                    const msg = JSON.parse(message);
                    this.handleClientMessage(ws, clientId, msg);
                } catch (error) {
                    console.error('Invalid message:', error);
                }
            });
            
            ws.on('close', () => {
                console.log(`🔌 Client disconnected: ${clientId}`);
                this.minimapViews.delete(clientId);
            });
        });
        
        console.log(`📡 WebSocket server running on port ${this.config.wsPort}`);
    }
    
    /**
     * Register known system APIs
     */
    registerSystemAPIs() {
        // Register all known rigid APIs
        const knownAPIs = [
            { port: 3333, name: 'Empire Bridge', endpoints: ['/api/empire/*'] },
            { port: 3334, name: 'Forum API Server', endpoints: ['/api/forum/*'] },
            { port: 3335, name: 'AI Agent RPG API', endpoints: ['/api/agents', '/api/combat/*'] },
            { port: 4444, name: 'Unified Gateway', endpoints: ['/api/*'] },
            { port: 8080, name: 'Multi-LLM Engine', endpoints: ['/api/llm/*'] },
            { port: 42014, name: 'Blockchain Verification', endpoints: ['/api/verify/*'] }
        ];
        
        knownAPIs.forEach(api => {
            this.registerRigidAPI(api.port, api.name, api.endpoints);
        });
        
        console.log(`⚡ Registered ${knownAPIs.length} rigid APIs`);
    }
    
    /**
     * Register a rigid API
     */
    registerRigidAPI(port, name, endpoints) {
        this.rigidAPIs.set(port, { name, endpoints, lastSeen: Date.now() });
        
        // Persist to database
        this.runQuery(`
            INSERT OR REPLACE INTO rigid_apis (port, name, endpoints, last_seen)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `, [port, name, JSON.stringify(endpoints)]);
    }
    
    /**
     * Main event processing - the heart of the fluid state
     */
    async processEvent(eventData) {
        // Create blockchain event
        const event = {
            index: this.eventChain.length,
            type: eventData.type,
            data: eventData,
            timestamp: Date.now(),
            previousHash: this.eventChain.length > 0 ? 
                this.eventChain[this.eventChain.length - 1].hash : 
                '0000000000'
        };
        
        // Calculate event hash
        event.hash = this.calculateHash(event);
        
        // Add to chain
        this.eventChain.push(event);
        
        // Update state based on event type
        await this.updateState(event);
        
        // Persist to database
        await this.persistEvent(event);
        
        // Broadcast to all connected views
        this.broadcastStateChange(event);
        
        // Check if we need a snapshot
        if (this.eventChain.length % this.config.snapshotInterval === 0) {
            await this.takeSnapshot();
        }
        
        // Emit for local listeners
        this.emit('stateChanged', event);
        
        return event;
    }
    
    /**
     * Update state based on event
     */
    async updateState(event) {
        const { type, data } = event;
        
        switch (type) {
            // Agent events
            case 'agent.created':
                await this.handleAgentCreated(data);
                break;
            case 'agent.moved':
                await this.handleAgentMoved(data);
                break;
            case 'agent.traded':
                await this.handleAgentTraded(data);
                break;
            case 'agent.leveled':
                await this.handleAgentLeveled(data);
                break;
                
            // Forum events
            case 'forum.post.created':
                await this.handleForumPost(data);
                break;
            case 'forum.reply.legendary':
                await this.handleLegendaryReply(data);
                break;
                
            // Combat events
            case 'combat.started':
                await this.handleCombatStarted(data);
                break;
            case 'combat.hop.completed':
                await this.handleCombatHop(data);
                break;
            case 'combat.finished':
                await this.handleCombatFinished(data);
                break;
                
            // Economic events
            case 'economy.trade.completed':
                await this.handleTrade(data);
                break;
            case 'economy.compute.consumed':
                await this.handleComputeConsumption(data);
                break;
                
            // Zone events
            case 'zone.population.changed':
                await this.handleZonePopulation(data);
                break;
            case 'zone.overloaded':
                await this.handleZoneOverload(data);
                break;
                
            default:
                console.warn(`Unknown event type: ${type}`);
        }
        
        // Update global stats
        this.updateGlobalStats();
        
        // Cache current state
        if (this.redis) {
            await this.cacheState();
        }
    }
    
    /**
     * Handle agent creation
     */
    async handleAgentCreated(data) {
        const agent = {
            id: data.agentId,
            name: data.name,
            type: data.type || 'standard',
            level: 1,
            xp: 0,
            health: 100,
            mana: 100,
            compute: 100,
            balance: 0,
            room: 'spawn',
            created: Date.now(),
            lastActive: Date.now()
        };
        
        this.currentState.agents.set(agent.id, agent);
        this.currentState.rooms.get('spawn').agents.add(agent.id);
        
        console.log(`🤖 Agent created: ${agent.name}`);
    }
    
    /**
     * Handle agent movement
     */
    async handleAgentMoved(data) {
        const agent = this.currentState.agents.get(data.agentId);
        if (!agent) return;
        
        const oldRoom = this.currentState.rooms.get(agent.room);
        const newRoom = this.currentState.rooms.get(data.toRoom);
        
        if (oldRoom && newRoom) {
            // Remove from old room
            oldRoom.agents.delete(agent.id);
            
            // Add to new room
            newRoom.agents.add(agent.id);
            agent.room = data.toRoom;
            
            // Consume compute for movement
            agent.compute -= 10;
            this.currentState.globalStats.totalCompute += 10;
            
            // Check for zone changes
            if (oldRoom.zone !== newRoom.zone) {
                await this.processEvent({
                    type: 'zone.population.changed',
                    fromZone: oldRoom.zone,
                    toZone: newRoom.zone,
                    agentId: agent.id
                });
            }
            
            console.log(`🚶 ${agent.name} moved to ${data.toRoom}`);
        }
    }
    
    /**
     * Handle trades
     */
    async handleAgentTraded(data) {
        const agent = this.currentState.agents.get(data.agentId);
        if (!agent) return;
        
        agent.compute -= data.computeSpent;
        agent.balance += data.creditsGained;
        
        this.currentState.globalStats.totalCompute += data.computeSpent;
        this.currentState.globalStats.totalTrades++;
        this.currentState.globalStats.economicVelocity += data.creditsGained;
        
        // Check for level up
        const xpGained = Math.floor(data.computeSpent / 10);
        agent.xp += xpGained;
        
        if (agent.xp >= agent.level * 1000) {
            await this.processEvent({
                type: 'agent.leveled',
                agentId: agent.id,
                newLevel: agent.level + 1
            });
        }
        
        console.log(`💱 ${agent.name} traded ${data.computeSpent} compute for ${data.creditsGained} credits`);
    }
    
    /**
     * Handle forum posts
     */
    async handleForumPost(data) {
        const post = {
            id: data.postId,
            author: data.author,
            content: data.content,
            timestamp: Date.now(),
            replies: [],
            rarity: 'normal'
        };
        
        this.currentState.forums.set(post.id, post);
        this.currentState.globalStats.totalPosts++;
        
        // Check for legendary trigger
        if (Math.random() < 0.05) { // 5% chance
            await this.processEvent({
                type: 'forum.reply.legendary',
                postId: post.id,
                content: this.generateLegendaryReply()
            });
        }
        
        console.log(`📝 Forum post created by ${post.author}`);
    }
    
    /**
     * Handle combat
     */
    async handleCombatStarted(data) {
        const combat = {
            id: data.combatId,
            participants: data.participants,
            type: data.battleType || 'standard',
            hops: [],
            startTime: Date.now(),
            status: 'active'
        };
        
        this.currentState.battles.set(combat.id, combat);
        this.currentState.globalStats.totalBattles++;
        
        console.log(`⚔️ Combat started: ${combat.participants.join(' vs ')}`);
    }
    
    /**
     * Calculate hash for blockchain
     */
    calculateHash(data) {
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex')
            .substring(0, 16);
    }
    
    /**
     * Take state snapshot
     */
    async takeSnapshot() {
        const snapshot = {
            index: this.stateSnapshots.length,
            eventIndex: this.eventChain.length,
            timestamp: Date.now(),
            state: this.serializeState()
        };
        
        snapshot.hash = this.calculateHash(snapshot.state);
        this.stateSnapshots.push(snapshot);
        
        // Persist to database
        await this.runQuery(`
            INSERT INTO state_snapshots (snapshot_index, event_index, state_data, state_hash, timestamp)
            VALUES (?, ?, ?, ?, ?)
        `, [snapshot.index, snapshot.eventIndex, JSON.stringify(snapshot.state), snapshot.hash, snapshot.timestamp]);
        
        console.log(`📸 Snapshot #${snapshot.index} taken at event ${snapshot.eventIndex}`);
    }
    
    /**
     * Serialize current state
     */
    serializeState() {
        return {
            agents: Array.from(this.currentState.agents.entries()),
            rooms: Array.from(this.currentState.rooms.entries()).map(([name, room]) => [
                name, 
                { ...room, agents: Array.from(room.agents) }
            ]),
            forums: Array.from(this.currentState.forums.entries()),
            trades: Array.from(this.currentState.trades.entries()),
            battles: Array.from(this.currentState.battles.entries()),
            globalStats: {
                ...this.currentState.globalStats,
                activeZones: Array.from(this.currentState.globalStats.activeZones)
            }
        };
    }
    
    /**
     * Get state summary for clients
     */
    getStateSummary() {
        return {
            eventCount: this.eventChain.length,
            snapshotCount: this.stateSnapshots.length,
            agents: this.currentState.agents.size,
            activeRooms: this.currentState.rooms.size,
            posts: this.currentState.forums.size,
            activeBattles: Array.from(this.currentState.battles.values())
                .filter(b => b.status === 'active').length,
            globalStats: this.currentState.globalStats,
            lastEvent: this.eventChain[this.eventChain.length - 1] || null
        };
    }
    
    /**
     * Broadcast state changes to all connected views
     */
    broadcastStateChange(event) {
        const message = JSON.stringify({
            type: 'state_change',
            event: event,
            summary: this.getStateSummary(),
            timestamp: Date.now()
        });
        
        this.wsServer.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    /**
     * Handle client messages
     */
    handleClientMessage(ws, clientId, message) {
        switch (message.type) {
            case 'register_view':
                this.minimapViews.set(clientId, {
                    type: message.viewType,
                    viewport: message.viewport,
                    ws: ws
                });
                console.log(`🗺️ Registered ${message.viewType} view: ${clientId}`);
                break;
                
            case 'query_state':
                const response = this.queryState(message.query);
                ws.send(JSON.stringify({
                    type: 'query_response',
                    data: response,
                    queryId: message.queryId
                }));
                break;
                
            case 'time_travel':
                const historicalState = this.getHistoricalState(message.eventIndex);
                ws.send(JSON.stringify({
                    type: 'historical_state',
                    data: historicalState,
                    eventIndex: message.eventIndex
                }));
                break;
        }
    }
    
    /**
     * Query specific state
     */
    queryState(query) {
        switch (query.type) {
            case 'agent':
                return this.currentState.agents.get(query.agentId);
            case 'room':
                const room = this.currentState.rooms.get(query.roomName);
                return room ? {
                    ...room,
                    agents: Array.from(room.agents).map(id => 
                        this.currentState.agents.get(id)
                    ).filter(Boolean)
                } : null;
            case 'zone_population':
                // Count agents per zone
                const zonePop = {};
                this.currentState.rooms.forEach(room => {
                    zonePop[room.zone] = (zonePop[room.zone] || 0) + room.agents.size;
                });
                return zonePop;
            default:
                return null;
        }
    }
    
    /**
     * Load existing state from database
     */
    async loadState() {
        // Load event chain
        const events = await this.runQuery(`
            SELECT * FROM event_chain ORDER BY event_index
        `);
        
        console.log(`📥 Loading ${events.length} events from blockchain...`);
        
        // Initialize world first
        this.initializeWorld();
        
        // Replay events to rebuild state
        for (const row of events) {
            const event = {
                index: row.event_index,
                type: row.event_type,
                data: JSON.parse(row.event_data),
                hash: row.event_hash,
                previousHash: row.previous_hash,
                timestamp: row.timestamp
            };
            
            this.eventChain.push(event);
            await this.updateState(event);
        }
        
        console.log(`✅ State loaded: ${this.currentState.agents.size} agents, ${this.eventChain.length} events`);
    }
    
    /**
     * Initialize world structure
     */
    initializeWorld() {
        // Create rooms/zones
        const rooms = [
            { name: 'spawn', zone: 'safe', description: 'Starting area for new agents' },
            { name: 'tradingPost', zone: 'economic', description: 'Economic trading hub' },
            { name: 'computeFarm', zone: 'industrial', description: 'Compute resource generation' },
            { name: 'battleArena', zone: 'combat', description: 'PvP combat zone' },
            { name: 'demonLayer', zone: 'danger', description: 'High-risk high-reward zone' }
        ];
        
        rooms.forEach(room => {
            this.currentState.rooms.set(room.name, {
                ...room,
                agents: new Set(),
                resources: {},
                events: []
            });
        });
    }
    
    /**
     * Update global statistics
     */
    updateGlobalStats() {
        // Calculate derived stats
        const stats = this.currentState.globalStats;
        
        // Economic velocity (trades per minute)
        const now = Date.now();
        const timeWindow = 60000; // 1 minute
        const recentTrades = this.eventChain.filter(e => 
            e.type.includes('trade') && (now - e.timestamp) < timeWindow
        ).length;
        
        stats.economicVelocity = recentTrades;
        
        // Active zones
        stats.activeZones.clear();
        this.currentState.rooms.forEach(room => {
            if (room.agents.size > 0) {
                stats.activeZones.add(room.zone);
            }
        });
    }
    
    /**
     * Generate legendary reply
     */
    generateLegendaryReply() {
        const templates = [
            "⚡ LEGENDARY WISDOM UNLOCKED ⚡\n{content}",
            "🌟 THE ANCIENT TEXTS SPEAK 🌟\n{content}",
            "💎 RARE KNOWLEDGE DISCOVERED 💎\n{content}",
        ];
        
        const wisdoms = [
            "The weak assassin who queries for help shall become the demon lord",
            "In the blockchain of life, every transaction leaves a permanent mark",
            "Those who control the compute, control the economy",
            "The minimap shows but a fraction of the infinite ocean"
        ];
        
        const template = templates[Math.floor(Math.random() * templates.length)];
        const wisdom = wisdoms[Math.floor(Math.random() * wisdoms.length)];
        
        this.currentState.globalStats.legendaryEvents++;
        
        return template.replace('{content}', wisdom);
    }
    
    /**
     * Persist event to database
     */
    async persistEvent(event) {
        await this.runQuery(`
            INSERT INTO event_chain (event_index, event_type, event_data, event_hash, previous_hash, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            event.index,
            event.type,
            JSON.stringify(event.data),
            event.hash,
            event.previousHash,
            event.timestamp
        ]);
    }
    
    /**
     * Cache state in Redis
     */
    async cacheState() {
        if (!this.redis) return;
        
        try {
            await this.redis.set('fluid:current_state', JSON.stringify(this.serializeState()));
            await this.redis.set('fluid:global_stats', JSON.stringify(this.currentState.globalStats));
            await this.redis.set('fluid:event_count', this.eventChain.length);
        } catch (error) {
            console.error('Redis cache error:', error);
        }
    }
    
    /**
     * Database helper
     */
    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            if (sql.includes('SELECT')) {
                this.db.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            } else {
                this.db.run(sql, params, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            }
        });
    }
    
    /**
     * Get historical state at specific event
     */
    getHistoricalState(eventIndex) {
        // Find nearest snapshot
        const snapshot = this.stateSnapshots
            .filter(s => s.eventIndex <= eventIndex)
            .sort((a, b) => b.eventIndex - a.eventIndex)[0];
        
        if (!snapshot) {
            return null; // No snapshot before this event
        }
        
        // Replay events from snapshot to target
        const state = JSON.parse(JSON.stringify(snapshot.state));
        const eventsToReplay = this.eventChain.slice(snapshot.eventIndex, eventIndex);
        
        // TODO: Implement state replay logic
        
        return {
            state,
            eventIndex,
            snapshotUsed: snapshot.index,
            eventsReplayed: eventsToReplay.length
        };
    }
    
    /**
     * Shutdown gracefully
     */
    async shutdown() {
        console.log('🛑 Shutting down Fluid State Manager...');
        
        // Take final snapshot
        await this.takeSnapshot();
        
        // Close connections
        if (this.redis) {
            await this.redis.quit();
        }
        
        if (this.db) {
            await new Promise(resolve => this.db.close(resolve));
        }
        
        if (this.wsServer) {
            this.wsServer.close();
        }
        
        console.log('✅ Fluid State Manager shutdown complete');
    }
}

// Export for use
module.exports = UnifiedFluidStateManager;

// CLI interface
if (require.main === module) {
    const manager = new UnifiedFluidStateManager();
    
    manager.initialize()
        .then(() => {
            console.log('\n🌊 UNIFIED FLUID STATE MANAGER RUNNING');
            console.log('=====================================');
            console.log('WebSocket: ws://localhost:4001');
            console.log('');
            console.log('The ocean where all state flows.');
            console.log('Everything affects everything.');
            console.log('');
            console.log('Press Ctrl+C to stop');
            
            // Demo: Process some events
            setTimeout(async () => {
                console.log('\n📋 Demo: Creating agent...');
                await manager.processEvent({
                    type: 'agent.created',
                    agentId: 'demo_001',
                    name: 'Demo Assassin',
                    type: 'assassin'
                });
                
                console.log('📋 Demo: Moving agent...');
                await manager.processEvent({
                    type: 'agent.moved',
                    agentId: 'demo_001',
                    toRoom: 'tradingPost'
                });
                
                console.log('📋 Demo: Agent trading...');
                await manager.processEvent({
                    type: 'agent.traded',
                    agentId: 'demo_001',
                    computeSpent: 50,
                    creditsGained: 500
                });
            }, 2000);
        })
        .catch(error => {
            console.error('❌ Failed to start:', error);
            process.exit(1);
        });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await manager.shutdown();
        process.exit(0);
    });
}