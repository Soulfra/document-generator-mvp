#!/usr/bin/env node

/**
 * 🌐 SPATIAL ARPANET ROUTER - Location-Based Service Routing
 * 
 * Routes chat, messaging, forums based on spatial proximity in game world
 * Global chat system with intelligent layering and proximity routing
 */

const http = require('http');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const EventEmitter = require('events');

class SpatialARPANETRouter extends EventEmitter {
    constructor() {
        super();
        
        this.routerPort = 8800;
        this.wsPort = 8801;
        
        // Spatial grid system (divide world into zones)
        this.worldGrid = {
            size: 1000,      // 1000x1000 world
            zoneSize: 100,   // 100x100 zones  
            zones: new Map() // zone_id -> services
        };
        
        // Service types with spatial behavior
        this.spatialServices = new Map([
            // Chat services - proximity based
            ['local-chat', { 
                type: 'proximity', 
                range: 50, 
                ports: new Map(),
                priority: 'high' 
            }],
            ['area-chat', { 
                type: 'zone', 
                range: 100, 
                ports: new Map(),
                priority: 'medium' 
            }],
            ['global-chat', { 
                type: 'broadcast', 
                range: Infinity, 
                ports: new Map([['global', 8500]]),
                priority: 'low' 
            }],
            
            // Friend/social services - relationship based
            ['friend-chat', { 
                type: 'social-graph', 
                range: Infinity, 
                ports: new Map([['friends', 8600]]),
                priority: 'high' 
            }],
            ['guild-chat', { 
                type: 'group', 
                range: Infinity, 
                ports: new Map(),
                priority: 'medium' 
            }],
            
            // Forum services - area/topic based  
            ['area-forums', { 
                type: 'zone-persistent', 
                range: 100, 
                ports: new Map(),
                priority: 'low' 
            }],
            ['topic-forums', { 
                type: 'interest-graph', 
                range: Infinity, 
                ports: new Map([['forums', 8700]]),
                priority: 'low' 
            }],
            
            // Game services - existing ones
            ['gaming-engine', { 
                type: 'zone', 
                range: 200, 
                ports: new Map([['central', 8888]]),
                priority: 'critical' 
            }],
            ['character-theater', { 
                type: 'zone', 
                range: 150, 
                ports: new Map([['north', 9950]]),
                priority: 'high' 
            }]
        ]);
        
        // Player tracking
        this.players = new Map(); // playerId -> {x, y, zone, services}
        this.playerConnections = new Map(); // playerId -> websocket
        
        // Message routing tables
        this.routingTables = new Map();
        this.messageQueue = [];
        
        this.initDatabase();
        this.init();
    }
    
    initDatabase() {
        this.db = new sqlite3.Database(':memory:');
        
        // Create spatial tables
        this.db.serialize(() => {
            // Player positions and zones
            this.db.run(`
                CREATE TABLE player_positions (
                    player_id TEXT PRIMARY KEY,
                    x REAL NOT NULL,
                    y REAL NOT NULL,
                    zone_id TEXT NOT NULL,
                    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Zone-based service assignments
            this.db.run(`
                CREATE TABLE zone_services (
                    zone_id TEXT,
                    service_type TEXT,
                    port INTEGER,
                    load_factor REAL DEFAULT 0.0,
                    PRIMARY KEY (zone_id, service_type)
                )
            `);
            
            // Message routing logs
            this.db.run(`
                CREATE TABLE message_routes (
                    message_id TEXT PRIMARY KEY,
                    from_player TEXT,
                    to_zone TEXT,
                    service_type TEXT,
                    route_path TEXT,
                    latency_ms INTEGER,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Social graph for friend routing
            this.db.run(`
                CREATE TABLE social_connections (
                    player_a TEXT,
                    player_b TEXT,
                    relationship_type TEXT,
                    strength REAL DEFAULT 1.0,
                    PRIMARY KEY (player_a, player_b)
                )
            `);
        });
        
        console.log('🗃️ Spatial database initialized');
    }
    
    async init() {
        console.log('🌐 Starting Spatial ARPANET Router...');
        
        // Initialize world grid
        this.initializeWorldGrid();
        
        // Start HTTP router
        this.startHTTPRouter();
        
        // Start WebSocket server for real-time
        this.startWebSocketServer();
        
        // Start spatial optimization
        this.startSpatialOptimization();
        
        console.log(`✅ Spatial Router running on port ${this.routerPort}`);
        console.log(`🔌 WebSocket server on port ${this.wsPort}`);
    }
    
    initializeWorldGrid() {
        const { size, zoneSize } = this.worldGrid;
        const zonesPerSide = Math.ceil(size / zoneSize);
        
        for (let x = 0; x < zonesPerSide; x++) {
            for (let y = 0; y < zonesPerSide; y++) {
                const zoneId = `zone_${x}_${y}`;
                this.worldGrid.zones.set(zoneId, {
                    x: x * zoneSize,
                    y: y * zoneSize,
                    width: zoneSize,
                    height: zoneSize,
                    services: new Map(),
                    playerCount: 0
                });
            }
        }
        
        console.log(`🗺️ Initialized ${this.worldGrid.zones.size} world zones`);
    }
    
    startHTTPRouter() {
        const server = http.createServer((req, res) => {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const pathParts = url.pathname.split('/').filter(p => p);
            
            if (pathParts.length === 0) {
                this.showSpatialStatus(res);
                return;
            }
            
            const serviceType = pathParts[0];
            const playerId = req.headers['x-player-id'] || 'anonymous';
            const playerPos = this.parsePlayerPosition(req.headers);
            
            // Update player position
            if (playerPos) {
                this.updatePlayerPosition(playerId, playerPos.x, playerPos.y);
            }
            
            // Route based on spatial logic
            this.routeMessage(serviceType, playerId, req, res);
        });
        
        server.listen(this.routerPort);
    }
    
    startWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            const url = new URL(req.url, `ws://${req.headers.host}`);
            const playerId = url.searchParams.get('player') || 'anonymous';
            
            console.log(`🔌 Player ${playerId} connected to spatial network`);
            
            this.playerConnections.set(playerId, ws);
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(playerId, message);
                } catch (error) {
                    console.error('❌ WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                console.log(`🔌 Player ${playerId} disconnected`);
                this.playerConnections.delete(playerId);
                this.players.delete(playerId);
            });
        });
    }
    
    handleWebSocketMessage(playerId, message) {
        switch (message.type) {
            case 'position-update':
                this.updatePlayerPosition(playerId, message.x, message.y);
                break;
                
            case 'chat-message':
                this.routeChatMessage(playerId, message);
                break;
                
            case 'friend-request':
                this.routeFriendRequest(playerId, message);
                break;
                
            case 'forum-post':
                this.routeForumPost(playerId, message);
                break;
                
            default:
                console.log(`🤔 Unknown message type: ${message.type}`);
        }
    }
    
    updatePlayerPosition(playerId, x, y) {
        const zoneId = this.getZoneId(x, y);
        
        // Update in memory
        this.players.set(playerId, { x, y, zoneId, lastUpdate: Date.now() });
        
        // Update in database
        this.db.run(`
            INSERT OR REPLACE INTO player_positions (player_id, x, y, zone_id)
            VALUES (?, ?, ?, ?)
        `, [playerId, x, y, zoneId]);
        
        // Update zone player count
        const zone = this.worldGrid.zones.get(zoneId);
        if (zone) {
            zone.playerCount = this.getPlayersInZone(zoneId).length;
        }
        
        // Broadcast position to nearby players
        this.broadcastToNearbyPlayers(playerId, {
            type: 'player-moved',
            playerId,
            x, y, zoneId
        });
    }
    
    getZoneId(x, y) {
        const { zoneSize } = this.worldGrid;
        const zoneX = Math.floor(x / zoneSize);
        const zoneY = Math.floor(y / zoneSize);
        return `zone_${zoneX}_${zoneY}`;
    }
    
    getPlayersInZone(zoneId) {
        return Array.from(this.players.entries())
            .filter(([playerId, data]) => data.zoneId === zoneId)
            .map(([playerId, data]) => ({ playerId, ...data }));
    }
    
    routeChatMessage(playerId, message) {
        const player = this.players.get(playerId);
        if (!player) return;
        
        switch (message.scope) {
            case 'local':
                this.broadcastToNearbyPlayers(playerId, {
                    type: 'chat-message',
                    scope: 'local',
                    from: playerId,
                    message: message.text,
                    range: 50
                }, 50);
                break;
                
            case 'area':
                this.broadcastToZone(player.zoneId, {
                    type: 'chat-message',
                    scope: 'area',
                    from: playerId,
                    message: message.text
                });
                break;
                
            case 'global':
                this.broadcastToAll({
                    type: 'chat-message',
                    scope: 'global',
                    from: playerId,
                    message: message.text
                });
                break;
        }
    }
    
    broadcastToNearbyPlayers(playerId, message, range = 100) {
        const player = this.players.get(playerId);
        if (!player) return;
        
        for (const [otherPlayerId, otherPlayer] of this.players) {
            if (otherPlayerId === playerId) continue;
            
            const distance = Math.sqrt(
                Math.pow(player.x - otherPlayer.x, 2) + 
                Math.pow(player.y - otherPlayer.y, 2)
            );
            
            if (distance <= range) {
                const ws = this.playerConnections.get(otherPlayerId);
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify(message));
                }
            }
        }
    }
    
    broadcastToZone(zoneId, message) {
        const playersInZone = this.getPlayersInZone(zoneId);
        
        for (const player of playersInZone) {
            const ws = this.playerConnections.get(player.playerId);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        }
    }
    
    broadcastToAll(message) {
        for (const [playerId, ws] of this.playerConnections) {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        }
    }
    
    startSpatialOptimization() {
        setInterval(() => {
            this.optimizeSpatialRouting();
        }, 10000);
        
        console.log('🧠 Spatial optimization started');
    }
    
    optimizeSpatialRouting() {
        // Analyze player density and redistribute services
        for (const [zoneId, zone] of this.worldGrid.zones) {
            if (zone.playerCount > 20) {
                console.log(`🔥 High load zone ${zoneId}: ${zone.playerCount} players`);
                this.scaleZoneServices(zoneId);
            }
        }
    }
    
    scaleZoneServices(zoneId) {
        const zone = this.worldGrid.zones.get(zoneId);
        
        // Add chat servers for high-load zones
        if (!zone.services.has('local-chat')) {
            const port = 8500 + Math.floor(Math.random() * 100);
            zone.services.set('local-chat', port);
            console.log(`🚀 Scaled local-chat to port ${port} for zone ${zoneId}`);
        }
    }
    
    parsePlayerPosition(headers) {
        const x = parseFloat(headers['x-player-x']);
        const y = parseFloat(headers['x-player-y']);
        
        if (!isNaN(x) && !isNaN(y)) {
            return { x, y };
        }
        
        return null;
    }
    
    showSpatialStatus(res) {
        const status = {
            router: 'Spatial ARPANET Router',
            timestamp: new Date().toISOString(),
            worldGrid: {
                size: this.worldGrid.size,
                zoneSize: this.worldGrid.zoneSize,
                totalZones: this.worldGrid.zones.size
            },
            services: Object.fromEntries(this.spatialServices),
            players: {
                online: this.players.size,
                byZone: this.getPlayersByZone()
            },
            usage: {
                http: `http://localhost:${this.routerPort}/{service-type}`,
                websocket: `ws://localhost:${this.wsPort}?player={player-id}`,
                headers: [
                    'x-player-id: your-player-id',
                    'x-player-x: 100.5',
                    'x-player-y: 200.3'
                ]
            },
            examples: [
                `curl -H "x-player-id: alice" -H "x-player-x: 100" -H "x-player-y: 200" http://localhost:${this.routerPort}/local-chat`,
                `curl http://localhost:${this.routerPort}/global-chat`,
                `curl http://localhost:${this.routerPort}/friend-chat`
            ]
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
    }
    
    getPlayersByZone() {
        const byZone = {};
        for (const [playerId, player] of this.players) {
            if (!byZone[player.zoneId]) {
                byZone[player.zoneId] = 0;
            }
            byZone[player.zoneId]++;
        }
        return byZone;
    }
}

// Start the spatial router
if (require.main === module) {
    const router = new SpatialARPANETRouter();
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Spatial ARPANET Router shutting down...');
        process.exit(0);
    });
}

module.exports = SpatialARPANETRouter;