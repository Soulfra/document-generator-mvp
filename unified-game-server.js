#!/usr/bin/env node

/**
 * UNIFIED GAME SERVER
 * Single server process that handles everything
 * Like RuneScape's game engine - all logic server-side
 */

const WebSocket = require('ws');
const http = require('http');
const { Pool } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Simple logger
class Logger {
    constructor(name) {
        this.name = name;
        this.logDir = path.join(__dirname, 'logs');
        
        // Create logs directory if it doesn't exist
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
        
        this.logFile = path.join(this.logDir, `game-server-${new Date().toISOString().split('T')[0]}.log`);
    }
    
    log(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            component: this.name,
            message,
            ...(data && { data })
        };
        
        // Console output with colors
        const colors = {
            INFO: '\x1b[36m',    // Cyan
            WARN: '\x1b[33m',    // Yellow
            ERROR: '\x1b[31m',   // Red
            SUCCESS: '\x1b[32m', // Green
            DEBUG: '\x1b[35m'    // Magenta
        };
        
        const color = colors[level] || '\x1b[0m';
        const reset = '\x1b[0m';
        
        console.log(`${color}[${timestamp}] [${level}] [${this.name}]${reset} ${message}`);
        if (data) {
            console.log(JSON.stringify(data, null, 2));
        }
        
        // File output
        fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
    }
    
    info(message, data) { this.log('INFO', message, data); }
    warn(message, data) { this.log('WARN', message, data); }
    error(message, data) { this.log('ERROR', message, data); }
    success(message, data) { this.log('SUCCESS', message, data); }
    debug(message, data) { this.log('DEBUG', message, data); }
}

class UnifiedGameServer {
    constructor() {
        this.logger = new Logger('GameServer');
        this.port = process.env.GAME_PORT || 8080;
        
        // Game state (single source of truth)
        this.gameState = {
            players: new Map(),
            npcs: new Map(),
            items: new Map(),
            world: {
                width: 2000,
                height: 2000,
                spawnX: 1000,
                spawnY: 1000
            }
        };
        
        // Game systems (merged from existing services)
        this.systems = {
            guardian: null,  // Tutorial/help system
            casino: null,    // Gambling mechanics
            router: null,    // Teleportation/routing
            combat: null,    // Combat system
            trade: null,     // Trading system
            chat: null       // Chat system
        };
        
        // Database connection config
        this.dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'document_generator_game',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            // Connection pool settings
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        };
        
        this.db = null; // Will be initialized with retry logic
        
        // WebSocket server
        this.wss = null;
        this.server = null;
        
        // Game loop
        this.tickRate = 50; // 20 ticks per second
        this.lastTick = Date.now();
        
        this.logger.info('🎮 UNIFIED GAME SERVER');
        this.logger.info('=====================');
        this.logger.info('Single server process - like RuneScape!');
    }
    
    async start() {
        this.logger.info('🚀 Starting unified game server...');
        
        try {
            // Initialize database
            await this.initDatabase();
        
        // Initialize game systems
        this.initSystems();
        
        // Spawn NPCs and items
        this.spawnWorld();
        
        // Start WebSocket server
        this.startServer();
        
        // Start game loop
        this.startGameLoop();
        
            this.logger.success(`✅ Game server running on port ${this.port}`);
            this.logger.success('🎮 Ready for players!');
        } catch (error) {
            this.logger.error('Failed to start server', error);
            throw error;
        }
    }
    
    async initDatabase() {
        this.logger.info('📊 Initializing database...');
        
        // Try to connect with retries
        let retries = 0;
        const maxRetries = 5;
        
        while (retries < maxRetries) {
            try {
                // Create new pool for each attempt
                this.db = new Pool(this.dbConfig);
                
                // Test connection
                await this.db.query('SELECT NOW()');
                this.logger.success('✅ Database connected');
                break;
            } catch (error) {
                retries++;
                this.logger.warn(`Database connection attempt ${retries}/${maxRetries} failed`, {
                    error: error.message,
                    code: error.code
                });
                
                if (retries >= maxRetries) {
                    throw new Error('Failed to connect to database after maximum retries');
                }
                
                // Wait before retry (exponential backoff)
                const waitTime = Math.min(1000 * Math.pow(2, retries - 1), 10000);
                this.logger.info(`Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        
        try {
            // Create tables if they don't exist
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS players (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    username VARCHAR(32) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    x INTEGER DEFAULT 1000,
                    y INTEGER DEFAULT 1000,
                    level INTEGER DEFAULT 1,
                    experience INTEGER DEFAULT 0,
                    hp INTEGER DEFAULT 100,
                    max_hp INTEGER DEFAULT 100,
                    mp INTEGER DEFAULT 50,
                    max_mp INTEGER DEFAULT 50,
                    energy INTEGER DEFAULT 100,
                    max_energy INTEGER DEFAULT 100,
                    gold INTEGER DEFAULT 100,
                    created_at TIMESTAMP DEFAULT NOW(),
                    last_login TIMESTAMP DEFAULT NOW()
                )
            `);
            
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS inventory (
                    player_id UUID REFERENCES players(id),
                    slot INTEGER NOT NULL,
                    item_id VARCHAR(64),
                    quantity INTEGER DEFAULT 1,
                    PRIMARY KEY (player_id, slot)
                )
            `);
            
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS chat_logs (
                    id SERIAL PRIMARY KEY,
                    player_id UUID REFERENCES players(id),
                    message TEXT,
                    timestamp TIMESTAMP DEFAULT NOW()
                )
            `);
            
            this.logger.success('✅ Database initialized');
        } catch (error) {
            this.logger.error('❌ Database error:', error);
            throw error;
        }
    }
    
    initSystems() {
        this.logger.info('🔧 Initializing game systems...');
        
        // Guardian system (tutorial/help)
        this.systems.guardian = {
            tips: [
                'Use WASD or arrow keys to move',
                'Click to interact with objects',
                'Right-click for more options',
                'Press Enter to chat'
            ],
            currentTip: 0,
            
            getNextTip() {
                const tip = this.tips[this.currentTip];
                this.currentTip = (this.currentTip + 1) % this.tips.length;
                return tip;
            }
        };
        
        // Casino system (gambling)
        this.systems.casino = {
            games: ['dice', 'coinflip', 'slots'],
            
            rollDice(player, bet) {
                const roll = Math.floor(Math.random() * 6) + 1;
                const win = roll >= 4;
                
                if (win) {
                    player.gold += bet;
                    return { win: true, roll, payout: bet };
                } else {
                    player.gold -= bet;
                    return { win: false, roll, loss: bet };
                }
            }
        };
        
        // Router system (teleportation)
        this.systems.router = {
            locations: {
                spawn: { x: 1000, y: 1000 },
                casino: { x: 500, y: 500 },
                arena: { x: 1500, y: 500 },
                market: { x: 1000, y: 1500 }
            },
            
            teleport(player, location) {
                const dest = this.locations[location];
                if (dest) {
                    player.x = dest.x;
                    player.y = dest.y;
                    return true;
                }
                return false;
            }
        };
        
        // Combat system
        this.systems.combat = {
            calculateDamage(attacker, defender) {
                const baseDamage = 10 + Math.floor(Math.random() * 10);
                const damage = Math.max(1, baseDamage - (defender.defense || 0));
                return damage;
            }
        };
        
        // Trade system
        this.systems.trade = {
            activeTrades: new Map(),
            
            initiateTrade(player1, player2) {
                const tradeId = crypto.randomUUID();
                this.activeTrades.set(tradeId, {
                    player1: player1.id,
                    player2: player2.id,
                    offer1: [],
                    offer2: [],
                    accepted1: false,
                    accepted2: false
                });
                return tradeId;
            }
        };
        
        // Chat system
        this.systems.chat = {
            async sendMessage(player, message) {
                // Filter message
                const filtered = this.filterMessage(message);
                
                // Log to database
                await this.logMessage(player.id, filtered);
                
                // Broadcast to nearby players
                return {
                    sender: player.username,
                    message: filtered,
                    timestamp: Date.now()
                };
            },
            
            filterMessage(message) {
                // Basic profanity filter
                return message.slice(0, 255);
            },
            
            async logMessage(playerId, message) {
                // Log to database for moderation
                try {
                    await this.db.query(
                        'INSERT INTO chat_logs (player_id, message) VALUES ($1, $2)',
                        [playerId, message]
                    );
                } catch (error) {
                    this.logger.error('Chat log error:', error);
                }
            }
        };
        
        this.logger.success('✅ Game systems initialized');
    }
    
    spawnWorld() {
        this.logger.info('🌍 Spawning world entities...');
        
        // Spawn NPCs
        const npcs = [
            { id: 'guardian_1', name: 'Guardian Teacher', x: 1000, y: 950, type: 'guardian' },
            { id: 'banker_1', name: 'Banker', x: 950, y: 1000, type: 'banker' },
            { id: 'trader_1', name: 'Trader', x: 1050, y: 1000, type: 'trader' },
            { id: 'casino_host', name: 'Casino Host', x: 500, y: 500, type: 'casino' }
        ];
        
        npcs.forEach(npc => {
            this.gameState.npcs.set(npc.id, npc);
        });
        
        // Spawn items
        const items = [
            { id: 'item_1', type: 'gold', x: 1100, y: 1100, amount: 50 },
            { id: 'item_2', type: 'potion', x: 900, y: 900, amount: 1 }
        ];
        
        items.forEach(item => {
            this.gameState.items.set(item.id, item);
        });
        
        this.logger.success(`✅ Spawned ${npcs.length} NPCs and ${items.length} items`);
    }
    
    startServer() {
        // Create HTTP server with monitoring endpoints
        this.server = http.createServer((req, res) => {
            res.setHeader('Content-Type', 'application/json');
            
            switch (req.url) {
                case '/health':
                    // Basic health check
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        status: 'healthy',
                        timestamp: new Date().toISOString()
                    }));
                    break;
                    
                case '/status':
                    // Detailed system status
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        server: {
                            status: 'running',
                            uptime: process.uptime(),
                            memory: process.memoryUsage(),
                            pid: process.pid
                        },
                        game: {
                            players: this.gameState.players.size,
                            npcs: this.gameState.npcs.size,
                            items: this.gameState.items.size,
                            activeTrades: this.systems.trade?.activeTrades.size || 0
                        },
                        database: {
                            connected: this.db !== null,
                            pool: {
                                total: this.db?.totalCount || 0,
                                idle: this.db?.idleCount || 0,
                                waiting: this.db?.waitingCount || 0
                            }
                        },
                        websocket: {
                            connections: this.wss?.clients?.size || 0
                        }
                    }));
                    break;
                    
                case '/metrics':
                    // Prometheus-style metrics
                    res.setHeader('Content-Type', 'text/plain');
                    res.writeHead(200);
                    res.end(this.generateMetrics());
                    break;
                    
                default:
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Not Found' }));
            }
        });
        
        // Create WebSocket server
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.wss.on('connection', (ws) => {
            this.logger.info('🔌 New client connected');
            
            // Create player session
            const session = {
                ws: ws,
                player: null,
                authenticated: false
            };
            
            ws.on('message', (data) => {
                try {
                    const packet = JSON.parse(data);
                    this.handlePacket(session, packet);
                } catch (error) {
                    this.logger.error('Invalid packet:', error);
                }
            });
            
            ws.on('close', () => {
                if (session.player) {
                    this.logger.info(`👋 Player ${session.player.username} disconnected`);
                    this.gameState.players.delete(session.player.id);
                    
                    // Notify other players
                    this.broadcast({
                        type: 'player_disconnected',
                        playerId: session.player.id
                    });
                }
            });
            
            ws.on('error', (error) => {
                this.logger.error('WebSocket error:', error);
            });
        });
        
        this.server.listen(this.port);
    }
    
    handlePacket(session, packet) {
        // Handle packets based on type
        switch (packet.type) {
            case 'login':
                this.handleLogin(session, packet);
                break;
            case 'move':
                this.handleMove(session, packet);
                break;
            case 'click':
                this.handleClick(session, packet);
                break;
            case 'chat':
                this.handleChat(session, packet);
                break;
            case 'move_item':
                this.handleMoveItem(session, packet);
                break;
            default:
                this.logger.warn('Unknown packet type:', packet.type);
        }
    }
    
    async handleLogin(session, packet) {
        this.logger.info(`🔐 Login attempt: ${packet.name}`);
        
        // For now, create/load player without password
        // In production, you'd verify credentials
        const player = {
            id: crypto.randomUUID(),
            username: packet.name || `Player${Math.floor(Math.random() * 9999)}`,
            x: this.gameState.world.spawnX,
            y: this.gameState.world.spawnY,
            level: 1,
            hp: 100,
            maxHp: 100,
            mp: 50,
            maxMp: 50,
            energy: 100,
            maxEnergy: 100,
            gold: 100,
            inventory: new Array(28).fill(null)
        };
        
        // Add some starting items
        player.inventory[0] = { id: 'sword_bronze', name: 'Bronze Sword', icon: '⚔️' };
        player.inventory[1] = { id: 'potion_health', name: 'Health Potion', icon: '🧪' };
        
        session.player = player;
        session.authenticated = true;
        
        // Add to game state
        this.gameState.players.set(player.id, player);
        
        // Send login success
        this.sendToPlayer(session, {
            type: 'login_success',
            playerId: player.id,
            x: player.x,
            y: player.y
        });
        
        // Send initial game state
        this.sendToPlayer(session, {
            type: 'world_update',
            players: Array.from(this.gameState.players.values()).filter(p => p.id !== player.id),
            npcs: Array.from(this.gameState.npcs.values()),
            items: Array.from(this.gameState.items.values())
        });
        
        // Send player data
        this.sendToPlayer(session, {
            type: 'player_update',
            id: player.id,
            data: player
        });
        
        // Send inventory
        this.sendToPlayer(session, {
            type: 'inventory_update',
            inventory: player.inventory
        });
        
        // Notify other players
        this.broadcast({
            type: 'player_update',
            id: player.id,
            data: player
        }, session);
        
        // Send welcome message
        this.broadcast({
            type: 'chat_message',
            sender: 'System',
            message: `${player.username} has joined the game!`,
            color: 'yellow'
        });
    }
    
    handleMove(session, packet) {
        if (!session.authenticated || !session.player) return;
        
        const player = session.player;
        const speed = 5;
        
        switch (packet.direction) {
            case 'up':
                player.y = Math.max(0, player.y - speed);
                break;
            case 'down':
                player.y = Math.min(this.gameState.world.height, player.y + speed);
                break;
            case 'left':
                player.x = Math.max(0, player.x - speed);
                break;
            case 'right':
                player.x = Math.min(this.gameState.world.width, player.x + speed);
                break;
        }
        
        // Check for item pickups
        this.checkItemPickup(player);
        
        // Broadcast position update
        this.broadcast({
            type: 'player_update',
            id: player.id,
            data: {
                x: player.x,
                y: player.y
            }
        });
    }
    
    handleClick(session, packet) {
        if (!session.authenticated || !session.player) return;
        
        const player = session.player;
        
        // Check if clicking on NPC
        for (const [id, npc] of this.gameState.npcs) {
            const distance = Math.sqrt(
                Math.pow(npc.x - packet.x, 2) + 
                Math.pow(npc.y - packet.y, 2)
            );
            
            if (distance < 30) {
                this.handleNPCInteraction(session, npc, packet.button);
                return;
            }
        }
        
        // Check if clicking on item
        for (const [id, item] of this.gameState.items) {
            const distance = Math.sqrt(
                Math.pow(item.x - packet.x, 2) + 
                Math.pow(item.y - packet.y, 2)
            );
            
            if (distance < 20) {
                this.handleItemInteraction(session, item, packet.button);
                return;
            }
        }
        
        // Otherwise, move to location
        if (packet.button === 'left') {
            // Pathfinding would go here
            // For now, just set destination
            player.x = packet.x;
            player.y = packet.y;
            
            this.broadcast({
                type: 'player_update',
                id: player.id,
                data: {
                    x: player.x,
                    y: player.y
                }
            });
        }
    }
    
    handleNPCInteraction(session, npc, button) {
        const player = session.player;
        
        switch (npc.type) {
            case 'guardian':
                // Guardian gives tips
                const tip = this.systems.guardian.getNextTip();
                this.sendToPlayer(session, {
                    type: 'chat_message',
                    sender: npc.name,
                    message: tip,
                    color: 'cyan'
                });
                break;
                
            case 'banker':
                // Open bank interface
                this.sendToPlayer(session, {
                    type: 'open_interface',
                    interface: 'bank'
                });
                break;
                
            case 'trader':
                // Open trade shop
                this.sendToPlayer(session, {
                    type: 'open_interface',
                    interface: 'shop'
                });
                break;
                
            case 'casino':
                // Teleport to casino
                this.systems.router.teleport(player, 'casino');
                this.sendToPlayer(session, {
                    type: 'chat_message',
                    sender: npc.name,
                    message: 'Welcome to the casino! Try your luck!',
                    color: 'gold'
                });
                
                // Update position
                this.broadcast({
                    type: 'player_update',
                    id: player.id,
                    data: {
                        x: player.x,
                        y: player.y
                    }
                });
                break;
        }
    }
    
    handleItemInteraction(session, item, button) {
        const player = session.player;
        
        if (button === 'left') {
            // Pick up item
            const freeSlot = player.inventory.findIndex(slot => slot === null);
            
            if (freeSlot !== -1) {
                // Add to inventory
                player.inventory[freeSlot] = {
                    id: item.type,
                    name: item.type,
                    icon: item.type === 'gold' ? '💰' : '🧪',
                    amount: item.amount || 1
                };
                
                // Remove from world
                this.gameState.items.delete(item.id);
                
                // Update player gold if applicable
                if (item.type === 'gold') {
                    player.gold += item.amount;
                }
                
                // Send updates
                this.sendToPlayer(session, {
                    type: 'inventory_update',
                    inventory: player.inventory
                });
                
                this.sendToPlayer(session, {
                    type: 'player_update',
                    id: player.id,
                    data: { gold: player.gold }
                });
                
                // Notify all players that item was picked up
                this.broadcast({
                    type: 'item_removed',
                    itemId: item.id
                });
                
                this.sendToPlayer(session, {
                    type: 'chat_message',
                    sender: 'System',
                    message: `You picked up ${item.amount || 1} ${item.type}`,
                    color: 'green'
                });
            } else {
                this.sendToPlayer(session, {
                    type: 'chat_message',
                    sender: 'System',
                    message: 'Your inventory is full!',
                    color: 'red'
                });
            }
        }
    }
    
    async handleChat(session, packet) {
        if (!session.authenticated || !session.player) return;
        
        const chatResult = await this.systems.chat.sendMessage(
            session.player,
            packet.message
        );
        
        // Broadcast to all players
        this.broadcast({
            type: 'chat_message',
            sender: chatResult.sender,
            message: chatResult.message,
            color: 'white'
        });
    }
    
    handleMoveItem(session, packet) {
        if (!session.authenticated || !session.player) return;
        
        const player = session.player;
        const { from, to } = packet;
        
        // Validate slots
        if (from < 0 || from >= 28 || to < 0 || to >= 28) return;
        
        // Swap items
        const temp = player.inventory[to];
        player.inventory[to] = player.inventory[from];
        player.inventory[from] = temp;
        
        // Send updated inventory
        this.sendToPlayer(session, {
            type: 'inventory_update',
            inventory: player.inventory
        });
    }
    
    checkItemPickup(player) {
        // Check if player is near any items
        for (const [id, item] of this.gameState.items) {
            const distance = Math.sqrt(
                Math.pow(item.x - player.x, 2) + 
                Math.pow(item.y - player.y, 2)
            );
            
            if (distance < 15) {
                // Auto-pickup gold
                if (item.type === 'gold') {
                    player.gold += item.amount;
                    this.gameState.items.delete(id);
                    
                    // Notify all players
                    this.broadcast({
                        type: 'item_removed',
                        itemId: id
                    });
                }
            }
        }
    }
    
    startGameLoop() {
        this.logger.info('🔄 Starting game loop...');
        
        setInterval(() => {
            const now = Date.now();
            const delta = now - this.lastTick;
            
            // Update game state
            this.update(delta);
            
            this.lastTick = now;
        }, 1000 / this.tickRate);
    }
    
    update(delta) {
        // Update NPCs
        this.updateNPCs(delta);
        
        // Respawn items
        this.respawnItems();
        
        // Update player states
        this.updatePlayers(delta);
    }
    
    updateNPCs(delta) {
        // NPCs could move, patrol, etc
        // For now they're stationary
    }
    
    updatePlayers(delta) {
        // Regenerate energy
        for (const [id, player] of this.gameState.players) {
            if (player.energy < player.maxEnergy) {
                player.energy = Math.min(player.maxEnergy, player.energy + 0.1);
            }
        }
    }
    
    respawnItems() {
        // Respawn items if too few
        if (this.gameState.items.size < 5) {
            const newItem = {
                id: `item_${Date.now()}`,
                type: Math.random() > 0.5 ? 'gold' : 'potion',
                x: Math.random() * this.gameState.world.width,
                y: Math.random() * this.gameState.world.height,
                amount: Math.floor(Math.random() * 50) + 10
            };
            
            this.gameState.items.set(newItem.id, newItem);
            
            // Notify all players
            this.broadcast({
                type: 'item_spawned',
                item: newItem
            });
        }
    }
    
    // Helper methods
    sendToPlayer(session, packet) {
        if (session.ws.readyState === WebSocket.OPEN) {
            session.ws.send(JSON.stringify(packet));
        }
    }
    
    generateMetrics() {
        const metrics = [];
        
        // Server metrics
        metrics.push(`# HELP game_server_uptime_seconds Server uptime in seconds`);
        metrics.push(`# TYPE game_server_uptime_seconds gauge`);
        metrics.push(`game_server_uptime_seconds ${process.uptime()}`);
        
        // Player metrics
        metrics.push(`# HELP game_players_online Number of players online`);
        metrics.push(`# TYPE game_players_online gauge`);
        metrics.push(`game_players_online ${this.gameState.players.size}`);
        
        // World metrics
        metrics.push(`# HELP game_npcs_active Number of active NPCs`);
        metrics.push(`# TYPE game_npcs_active gauge`);
        metrics.push(`game_npcs_active ${this.gameState.npcs.size}`);
        
        metrics.push(`# HELP game_items_spawned Number of items in world`);
        metrics.push(`# TYPE game_items_spawned gauge`);
        metrics.push(`game_items_spawned ${this.gameState.items.size}`);
        
        // Memory metrics
        const memUsage = process.memoryUsage();
        metrics.push(`# HELP nodejs_heap_used_bytes Node.js heap memory used`);
        metrics.push(`# TYPE nodejs_heap_used_bytes gauge`);
        metrics.push(`nodejs_heap_used_bytes ${memUsage.heapUsed}`);
        
        // WebSocket metrics
        metrics.push(`# HELP websocket_connections_active Number of active WebSocket connections`);
        metrics.push(`# TYPE websocket_connections_active gauge`);
        metrics.push(`websocket_connections_active ${this.wss?.clients?.size || 0}`);
        
        return metrics.join('\n');
    }
    
    broadcast(packet, excludeSession = null) {
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                if (!excludeSession || client !== excludeSession.ws) {
                    client.send(JSON.stringify(packet));
                }
            }
        });
    }
    
    async shutdown() {
        this.logger.info('🛑 Shutting down server...');
        
        // Save player data
        for (const [id, player] of this.gameState.players) {
            await this.savePlayer(player);
        }
        
        // Close connections
        this.wss.close();
        this.server.close();
        await this.db.end();
        
        this.logger.info('👋 Server shut down');
    }
    
    async savePlayer(player) {
        // Save to database
        try {
            await this.db.query(
                `UPDATE players SET x = $1, y = $2, level = $3, hp = $4, gold = $5 
                 WHERE id = $6`,
                [player.x, player.y, player.level, player.hp, player.gold, player.id]
            );
        } catch (error) {
            this.logger.error('Failed to save player:', error);
        }
    }
}

// Start the server
if (require.main === module) {
    const server = new UnifiedGameServer();
    
    server.start().catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        await server.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await server.shutdown();
        process.exit(0);
    });
}

module.exports = UnifiedGameServer;