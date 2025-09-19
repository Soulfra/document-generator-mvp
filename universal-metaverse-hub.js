#!/usr/bin/env node

/**
 * 🌍 UNIVERSAL METAVERSE HUB
 * 
 * Central coordination system for the distributed MMORPG universe
 * Connects multiple GitHub repositories/game worlds with real-time data
 */

const express = require('express');
const WebSocket = require('ws');
const Redis = require('redis');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class UniversalMetaverseHub extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 7000,
            wsPort: config.wsPort || 7001,
            redisUrl: config.redisUrl || 'redis://localhost:6379',
            enableCORS: config.enableCORS !== false,
            ...config
        };
        
        // Game world registry
        this.gameWorlds = new Map([
            ['trading-floor', {
                id: 'trading-floor',
                name: 'Trading Floor Hub',
                repo: 'Document-Generator',
                url: 'http://localhost:9600',
                wsUrl: 'ws://localhost:9601',
                type: 'economic',
                status: 'online',
                description: 'Real-time trading and market data'
            }],
            ['ocean-world', {
                id: 'ocean-world',
                name: 'Deep Sea Explorer',
                repo: 'ocean-world-server',
                url: 'http://localhost:8000',
                wsUrl: 'ws://localhost:8001',
                type: 'exploration',
                status: 'planned',
                description: 'Underwater treasure hunting and diving'
            }],
            ['ship-combat', {
                id: 'ship-combat',
                name: 'Naval Battle Arena',
                repo: 'ship-combat-arena',
                url: 'http://localhost:8100',
                wsUrl: 'ws://localhost:8101',
                type: 'combat',
                status: 'planned',
                description: 'Cannonball battles and fleet management'
            }],
            ['sky-realm', {
                id: 'sky-realm',
                name: 'Aerial Combat Zone',
                repo: 'sky-realm-battles',
                url: 'http://localhost:8200',
                wsUrl: 'ws://localhost:8201',
                type: 'combat',
                status: 'planned',
                description: 'Flying ship battles in the clouds'
            }],
            ['underground', {
                id: 'underground',
                name: 'Mining Operations',
                repo: 'underground-miners',
                url: 'http://localhost:8300',
                wsUrl: 'ws://localhost:8301',
                type: 'resource',
                status: 'planned',
                description: 'Cave exploration and resource extraction'
            }]
        ]);
        
        // Universal player system
        this.souls = new Map(); // All player souls across worlds
        this.crossWorldEvents = new Map(); // Events affecting multiple worlds
        this.globalLeaderboards = new Map(); // Universal rankings
        
        // WebSocket connections from game worlds
        this.worldConnections = new Map();
        this.playerConnections = new Map(); // Direct player connections
        
        // Redis for persistent data
        this.redis = null;
        
        // Statistics
        this.stats = {
            totalPlayers: 0,
            activeWorlds: 0,
            crossWorldEvents: 0,
            dataPacketsProcessed: 0,
            startTime: Date.now()
        };
        
        console.log('🌍 Initializing Universal Metaverse Hub...');
        this.initialize();
    }
    
    async initialize() {
        // Connect to Redis
        await this.initializeRedis();
        
        // Setup Express server
        this.setupWebServer();
        
        // Setup WebSocket server for cross-world communication
        this.setupWebSocketServer();
        
        // Load existing soul data
        await this.loadUniversalData();
        
        // Start periodic tasks
        this.startPeriodicTasks();
        
        console.log('✅ Universal Metaverse Hub ready!');
        console.log(`🌐 Web Interface: http://localhost:${this.config.port}`);
        console.log(`📡 WebSocket Hub: ws://localhost:${this.config.wsPort}`);
        
        this.emit('hub_ready');
    }
    
    async initializeRedis() {
        try {
            this.redis = Redis.createClient({ url: this.config.redisUrl });
            await this.redis.connect();
            console.log('📦 Connected to Redis for universal data storage');
        } catch (error) {
            console.error('Redis connection failed:', error.message);
            console.log('⚠️  Running without Redis - data will not persist');
        }
    }
    
    setupWebServer() {
        this.app = express();
        this.app.use(express.json({ limit: '10mb' }));
        
        if (this.config.enableCORS) {
            this.app.use((req, res, next) => {
                res.header('Access-Control-Allow-Origin', '*');
                res.header('Access-Control-Allow-Headers', '*');
                res.header('Access-Control-Allow-Methods', '*');
                next();
            });
        }
        
        // Universal metaverse dashboard
        this.app.get('/', (req, res) => {
            res.send(this.renderMetaverseDashboard());
        });
        
        // Game world registry
        this.app.get('/api/worlds', (req, res) => {
            res.json({
                worlds: Array.from(this.gameWorlds.values()),
                totalWorlds: this.gameWorlds.size,
                activeWorlds: this.stats.activeWorlds
            });
        });
        
        // Universal player identity
        this.app.get('/api/souls/:playerId', async (req, res) => {
            const { playerId } = req.params;
            const soul = await this.getUniversalSoul(playerId);
            
            if (soul) {
                res.json({ success: true, soul });
            } else {
                res.status(404).json({ success: false, error: 'Soul not found' });
            }
        });
        
        // Create/update universal soul
        this.app.post('/api/souls', async (req, res) => {
            const { playerId, soulData } = req.body;
            const soul = await this.createOrUpdateSoul(playerId, soulData);
            res.json({ success: true, soul });
        });
        
        // Cross-world events
        this.app.post('/api/events/cross-world', async (req, res) => {
            const event = await this.createCrossWorldEvent(req.body);
            res.json({ success: true, event });
        });
        
        // Global leaderboards
        this.app.get('/api/leaderboards/:category', async (req, res) => {
            const { category } = req.params;
            const leaderboard = await this.getGlobalLeaderboard(category);
            res.json(leaderboard);
        });
        
        // World registration (for new game servers)
        this.app.post('/api/worlds/register', (req, res) => {
            const worldData = req.body;
            const registered = this.registerGameWorld(worldData);
            res.json({ success: registered, world: worldData });
        });
        
        // Hub statistics
        this.app.get('/api/stats', (req, res) => {
            res.json({
                ...this.stats,
                uptime: Date.now() - this.stats.startTime,
                worlds: this.gameWorlds.size,
                connectedWorlds: this.worldConnections.size,
                connectedPlayers: this.playerConnections.size
            });
        });
        
        this.app.listen(this.config.port, () => {
            console.log(`🌐 Metaverse Hub API running on port ${this.config.port}`);
        });
    }
    
    setupWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            console.log('🔗 New connection to Universal Hub');
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    await this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                this.handleDisconnection(ws);
            });
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'hub_welcome',
                hubId: 'universal-metaverse',
                availableWorlds: Array.from(this.gameWorlds.keys()),
                timestamp: Date.now()
            }));
        });
        
        console.log(`📡 WebSocket server listening on port ${this.config.wsPort}`);
    }
    
    async handleWebSocketMessage(ws, message) {
        this.stats.dataPacketsProcessed++;
        
        switch (message.type) {
            case 'world_register':
                // Game world registering with hub
                this.registerWorldConnection(ws, message);
                break;
                
            case 'player_connect':
                // Player connecting to hub
                this.registerPlayerConnection(ws, message);
                break;
                
            case 'cross_world_action':
                // Action that affects multiple worlds
                await this.processCrossWorldAction(message);
                break;
                
            case 'soul_update':
                // Player soul data updated in one world
                await this.updateUniversalSoul(message);
                break;
                
            case 'world_event':
                // Event happening in one world that others should know about
                this.broadcastWorldEvent(message, ws);
                break;
                
            case 'leaderboard_update':
                // Update global leaderboards
                await this.updateGlobalLeaderboard(message);
                break;
                
            default:
                console.log('Unknown message type:', message.type);
        }
    }
    
    registerWorldConnection(ws, message) {
        const worldId = message.worldId;
        
        if (this.gameWorlds.has(worldId)) {
            this.worldConnections.set(worldId, {
                ws,
                worldData: message.worldData,
                connectedAt: Date.now(),
                lastPing: Date.now()
            });
            
            // Update world status
            const world = this.gameWorlds.get(worldId);
            world.status = 'online';
            world.connectedAt = Date.now();
            
            this.stats.activeWorlds = this.worldConnections.size;
            
            console.log(`🌍 Game world registered: ${worldId}`);
            
            // Notify all connections about new world
            this.broadcastToAll({
                type: 'world_online',
                worldId,
                worldData: world
            });
        }
    }
    
    registerPlayerConnection(ws, message) {
        const playerId = message.playerId;
        
        this.playerConnections.set(playerId, {
            ws,
            playerId,
            currentWorld: message.currentWorld,
            connectedAt: Date.now()
        });
        
        this.stats.totalPlayers = this.playerConnections.size;
        
        console.log(`👤 Player connected: ${playerId}`);
        
        // Send player's universal soul data
        ws.send(JSON.stringify({
            type: 'soul_data',
            soul: this.souls.get(playerId) || null
        }));
    }
    
    async processCrossWorldAction(message) {
        console.log('🌐 Processing cross-world action:', message.action);
        
        const event = {
            id: crypto.randomUUID(),
            type: 'cross_world_action',
            action: message.action,
            sourceWorld: message.sourceWorld,
            playerId: message.playerId,
            data: message.data,
            timestamp: Date.now(),
            affectedWorlds: message.affectedWorlds || Array.from(this.gameWorlds.keys())
        };
        
        // Store event
        this.crossWorldEvents.set(event.id, event);
        
        // Broadcast to affected worlds
        for (const worldId of event.affectedWorlds) {
            const worldConnection = this.worldConnections.get(worldId);
            if (worldConnection) {
                worldConnection.ws.send(JSON.stringify({
                    type: 'cross_world_event',
                    event
                }));
            }
        }
        
        this.stats.crossWorldEvents++;
        this.emit('cross_world_action', event);
    }
    
    async createOrUpdateSoul(playerId, soulData) {
        const existingSoul = this.souls.get(playerId);
        
        const soul = {
            playerId,
            ...existingSoul,
            ...soulData,
            lastUpdated: Date.now(),
            universeStats: {
                totalWorlds: existingSoul?.universeStats?.totalWorlds || 0,
                worldsVisited: existingSoul?.universeStats?.worldsVisited || [],
                universalLevel: existingSoul?.universeStats?.universalLevel || 1,
                crossWorldAchievements: existingSoul?.universeStats?.crossWorldAchievements || [],
                ...soulData.universeStats
            }
        };
        
        this.souls.set(playerId, soul);
        
        // Save to Redis
        if (this.redis) {
            await this.redis.set(`soul:${playerId}`, JSON.stringify(soul));
        }
        
        console.log(`👤 Soul updated: ${playerId}`);
        return soul;
    }
    
    async getUniversalSoul(playerId) {
        let soul = this.souls.get(playerId);
        
        if (!soul && this.redis) {
            try {
                const data = await this.redis.get(`soul:${playerId}`);
                if (data) {
                    soul = JSON.parse(data);
                    this.souls.set(playerId, soul);
                }
            } catch (error) {
                console.error('Error loading soul from Redis:', error);
            }
        }
        
        return soul;
    }
    
    registerGameWorld(worldData) {
        if (!worldData.id || !worldData.name) {
            return false;
        }
        
        this.gameWorlds.set(worldData.id, {
            ...worldData,
            registeredAt: Date.now(),
            status: 'registered'
        });
        
        console.log(`🌍 New game world registered: ${worldData.name} (${worldData.id})`);
        return true;
    }
    
    broadcastToAll(message) {
        const messageStr = JSON.stringify(message);
        
        // Broadcast to all world connections
        for (const connection of this.worldConnections.values()) {
            if (connection.ws.readyState === WebSocket.OPEN) {
                connection.ws.send(messageStr);
            }
        }
        
        // Broadcast to all player connections
        for (const connection of this.playerConnections.values()) {
            if (connection.ws.readyState === WebSocket.OPEN) {
                connection.ws.send(messageStr);
            }
        }
    }
    
    broadcastWorldEvent(message, senderWs) {
        const messageStr = JSON.stringify(message);
        
        // Broadcast to all connections except sender
        for (const connection of this.worldConnections.values()) {
            if (connection.ws !== senderWs && connection.ws.readyState === WebSocket.OPEN) {
                connection.ws.send(messageStr);
            }
        }
    }
    
    handleDisconnection(ws) {
        // Find and remove from world connections
        for (const [worldId, connection] of this.worldConnections) {
            if (connection.ws === ws) {
                this.worldConnections.delete(worldId);
                
                // Update world status
                const world = this.gameWorlds.get(worldId);
                if (world) {
                    world.status = 'offline';
                }
                
                console.log(`🌍 Game world disconnected: ${worldId}`);
                break;
            }
        }
        
        // Find and remove from player connections
        for (const [playerId, connection] of this.playerConnections) {
            if (connection.ws === ws) {
                this.playerConnections.delete(playerId);
                console.log(`👤 Player disconnected: ${playerId}`);
                break;
            }
        }
        
        this.stats.activeWorlds = this.worldConnections.size;
        this.stats.totalPlayers = this.playerConnections.size;
    }
    
    async loadUniversalData() {
        if (!this.redis) return;
        
        try {
            // Load all souls
            const soulKeys = await this.redis.keys('soul:*');
            for (const key of soulKeys) {
                const data = await this.redis.get(key);
                const soul = JSON.parse(data);
                this.souls.set(soul.playerId, soul);
            }
            
            console.log(`👥 Loaded ${this.souls.size} universal souls`);
        } catch (error) {
            console.error('Error loading universal data:', error);
        }
    }
    
    startPeriodicTasks() {
        // Health check every 30 seconds
        setInterval(() => {
            this.performHealthCheck();
        }, 30000);
        
        // Save data every 5 minutes
        setInterval(() => {
            this.saveUniversalData();
        }, 300000);
        
        // Clean up old events every hour
        setInterval(() => {
            this.cleanupOldEvents();
        }, 3600000);
    }
    
    performHealthCheck() {
        // Check all world connections
        for (const [worldId, connection] of this.worldConnections) {
            if (connection.ws.readyState !== WebSocket.OPEN) {
                this.worldConnections.delete(worldId);
                
                const world = this.gameWorlds.get(worldId);
                if (world) {
                    world.status = 'offline';
                }
            } else {
                // Send ping
                connection.ws.ping();
            }
        }
        
        this.stats.activeWorlds = this.worldConnections.size;
    }
    
    async saveUniversalData() {
        if (!this.redis) return;
        
        try {
            // Save all souls
            for (const [playerId, soul] of this.souls) {
                await this.redis.set(`soul:${playerId}`, JSON.stringify(soul));
            }
            
            console.log(`💾 Saved ${this.souls.size} souls to universal database`);
        } catch (error) {
            console.error('Error saving universal data:', error);
        }
    }
    
    cleanupOldEvents() {
        const oneHourAgo = Date.now() - 3600000;
        
        for (const [eventId, event] of this.crossWorldEvents) {
            if (event.timestamp < oneHourAgo) {
                this.crossWorldEvents.delete(eventId);
            }
        }
    }
    
    renderMetaverseDashboard() {
        const worlds = Array.from(this.gameWorlds.values());
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🌍 Universal Metaverse Hub</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0a0a1a 0%, #1a0a2a 50%, #2a0a1a 100%);
            color: #00ff88;
            min-height: 100vh;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            border: 2px solid #00ff88;
            border-radius: 15px;
            background: rgba(0, 255, 136, 0.1);
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            padding: 20px;
            border: 1px solid #00ff88;
            border-radius: 10px;
            background: rgba(0, 0, 0, 0.3);
            text-align: center;
        }
        
        .stat-value {
            font-size: 32px;
            color: #ff6600;
            margin-bottom: 10px;
        }
        
        .worlds-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
        }
        
        .world-card {
            border: 2px solid;
            border-radius: 15px;
            padding: 20px;
            position: relative;
            transition: all 0.3s ease;
        }
        
        .world-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
        }
        
        .world-card.online {
            border-color: #00ff88;
            background: rgba(0, 255, 136, 0.1);
        }
        
        .world-card.planned {
            border-color: #ffaa00;
            background: rgba(255, 170, 0, 0.1);
        }
        
        .world-card.offline {
            border-color: #ff4444;
            background: rgba(255, 68, 68, 0.1);
        }
        
        .world-status {
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .world-status.online { background: #00ff88; color: #000; }
        .world-status.planned { background: #ffaa00; color: #000; }
        .world-status.offline { background: #ff4444; color: #fff; }
        
        .world-type {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 15px;
            font-size: 11px;
            margin-bottom: 10px;
            background: rgba(255, 255, 255, 0.2);
        }
        
        .launch-btn {
            background: linear-gradient(45deg, #00ff88, #00aaff);
            color: #000;
            border: none;
            padding: 10px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
        }
        
        .launch-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(0, 255, 136, 0.4);
        }
        
        .launch-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .real-time-feed {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            max-height: 200px;
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #00ff88;
            border-radius: 10px;
            padding: 15px;
            overflow-y: auto;
        }
        
        .feed-item {
            font-size: 12px;
            margin-bottom: 8px;
            padding: 5px;
            background: rgba(0, 255, 136, 0.1);
            border-radius: 5px;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .online .world-status {
            animation: pulse 2s infinite;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌍 UNIVERSAL METAVERSE HUB</h1>
        <p>Connecting all game worlds in the distributed MMORPG universe</p>
        <p><strong>Everything Everywhere All At Once</strong></p>
    </div>
    
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-value" id="totalWorlds">${worlds.length}</div>
            <div>Total Worlds</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="activeWorlds">${worlds.filter(w => w.status === 'online').length}</div>
            <div>Online Now</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="totalPlayers">0</div>
            <div>Connected Players</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" id="crossWorldEvents">0</div>
            <div>Cross-World Events</div>
        </div>
    </div>
    
    <h2>🎮 GAME WORLDS</h2>
    <div class="worlds-grid">
        ${worlds.map(world => `
            <div class="world-card ${world.status}">
                <div class="world-status ${world.status}">${world.status.toUpperCase()}</div>
                <div class="world-type">${world.type}</div>
                <h3>${world.name}</h3>
                <p>${world.description}</p>
                <p style="margin: 10px 0; font-size: 12px;">
                    <strong>Repo:</strong> ${world.repo}<br>
                    <strong>URL:</strong> ${world.url}
                </p>
                <button class="launch-btn" 
                        onclick="launchWorld('${world.id}')"
                        ${world.status !== 'online' ? 'disabled' : ''}>
                    ${world.status === 'online' ? 'ENTER WORLD' : world.status === 'planned' ? 'COMING SOON' : 'OFFLINE'}
                </button>
            </div>
        `).join('')}
    </div>
    
    <div class="real-time-feed">
        <h4>📡 Live Feed</h4>
        <div id="liveFeed">
            <div class="feed-item">Universal Hub initialized</div>
            <div class="feed-item">Monitoring ${worlds.length} game worlds</div>
            <div class="feed-item">Ready for cross-world events</div>
        </div>
    </div>
    
    <script>
        let ws;
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.config.wsPort}');
            
            ws.onopen = function() {
                console.log('Connected to Universal Hub');
                addFeedItem('🔗 Connected to Universal Hub');
            };
            
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                handleHubMessage(data);
            };
            
            ws.onclose = function() {
                addFeedItem('❌ Disconnected from Hub');
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function handleHubMessage(data) {
            switch (data.type) {
                case 'world_online':
                    addFeedItem(\`🌍 \${data.worldData.name} came online\`);
                    updateWorldStatus(data.worldId, 'online');
                    break;
                case 'cross_world_event':
                    addFeedItem(\`🌐 Cross-world event: \${data.event.action}\`);
                    break;
                case 'hub_stats':
                    updateStats(data.stats);
                    break;
            }
        }
        
        function updateWorldStatus(worldId, status) {
            // Update UI to reflect world status
            location.reload(); // Simple refresh for now
        }
        
        function addFeedItem(message) {
            const feed = document.getElementById('liveFeed');
            const item = document.createElement('div');
            item.className = 'feed-item';
            item.textContent = new Date().toLocaleTimeString() + ' - ' + message;
            
            feed.insertBefore(item, feed.firstChild);
            
            while (feed.children.length > 10) {
                feed.removeChild(feed.lastChild);
            }
        }
        
        function launchWorld(worldId) {
            const world = ${JSON.stringify(Object.fromEntries(this.gameWorlds))};
            if (world[worldId] && world[worldId].status === 'online') {
                window.open(world[worldId].url, '_blank');
                addFeedItem(\`🚀 Launched \${world[worldId].name}\`);
            }
        }
        
        // Auto-update stats every 5 seconds
        setInterval(async () => {
            try {
                const response = await fetch('/api/stats');
                const stats = await response.json();
                
                document.getElementById('totalPlayers').textContent = stats.connectedPlayers;
                document.getElementById('activeWorlds').textContent = stats.connectedWorlds;
                document.getElementById('crossWorldEvents').textContent = stats.crossWorldEvents;
                
            } catch (error) {
                console.error('Failed to update stats:', error);
            }
        }, 5000);
        
        // Initialize
        connectWebSocket();
    </script>
</body>
</html>`;
    }
}

module.exports = UniversalMetaverseHub;

// Start if executed directly
if (require.main === module) {
    const hub = new UniversalMetaverseHub();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Universal Metaverse Hub...');
        process.exit(0);
    });
}