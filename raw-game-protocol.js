#!/usr/bin/env node

/**
 * 🎮 RAW GAME PROTOCOL
 * How RuneScape/Diablo ACTUALLY worked - raw TCP sockets, binary data
 * No HTTP bullshit, just pure game networking like the old days
 */

const net = require('net');
const dgram = require('dgram');
const crypto = require('crypto');

// Game Protocol Constants (like RuneScape Classic)
const OPCODES = {
    LOGIN_REQUEST: 0x10,
    LOGIN_RESPONSE: 0x11,
    PLAYER_UPDATE: 0x20,
    NPC_UPDATE: 0x21,
    CHAT_MESSAGE: 0x30,
    ITEM_DROP: 0x40,
    SPELL_CAST: 0x50,
    COMBAT_ACTION: 0x60,
    LOGOUT: 0xFF
};

const GAME_STATES = {
    LOBBY: 0,
    IN_GAME: 1,
    COMBAT: 2,
    TRADING: 3
};

class GameProtocolServer {
    constructor(port) {
        this.port = port;
        this.clients = new Map();
        this.world = {
            players: new Map(),
            npcs: new Map(),
            items: new Map(),
            regions: new Map()
        };
        
        // Initialize game world like RuneScape
        this.initializeWorld();
    }
    
    start() {
        const server = net.createServer((socket) => {
            const clientId = crypto.randomUUID();
            console.log(`🎮 Player connected: ${clientId}`);
            
            this.clients.set(clientId, {
                id: clientId,
                socket: socket,
                state: GAME_STATES.LOBBY,
                player: null,
                lastPing: Date.now()
            });
            
            // Raw binary data handler (like RuneScape)
            socket.on('data', (data) => {
                this.handleRawGameData(clientId, data);
            });
            
            socket.on('close', () => {
                console.log(`🚪 Player disconnected: ${clientId}`);
                this.handleLogout(clientId);
            });
            
            socket.on('error', (error) => {
                console.error(`❌ Socket error for ${clientId}:`, error);
                this.clients.delete(clientId);
            });
            
            // Send welcome packet (binary)
            this.sendWelcomePacket(socket);
        });
        
        server.listen(this.port, () => {
            console.log(`🎮 Raw Game Server listening on port ${this.port}`);
            console.log('📡 Using binary protocol like RuneScape Classic');
        });
        
        // Start game loop (like RuneScape's 600ms tick)
        this.startGameLoop();
    }
    
    initializeWorld() {
        // Create NPCs like RuneScape
        for (let i = 0; i < 50; i++) {
            const npcId = `npc_${i}`;
            this.world.npcs.set(npcId, {
                id: npcId,
                type: ['goblin', 'skeleton', 'cow', 'chicken'][Math.floor(Math.random() * 4)],
                x: Math.floor(Math.random() * 100),
                y: Math.floor(Math.random() * 100),
                hp: 100,
                level: Math.floor(Math.random() * 50) + 1,
                respawnTime: 0
            });
        }
        
        // Create items on ground
        for (let i = 0; i < 100; i++) {
            const itemId = `item_${i}`;
            this.world.items.set(itemId, {
                id: itemId,
                type: ['bronze_sword', 'coins', 'bread', 'rune'][Math.floor(Math.random() * 4)],
                x: Math.floor(Math.random() * 100),
                y: Math.floor(Math.random() * 100),
                amount: Math.floor(Math.random() * 100) + 1
            });
        }
        
        console.log(`🌍 World initialized: ${this.world.npcs.size} NPCs, ${this.world.items.size} items`);
    }
    
    handleRawGameData(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        // Parse binary packet (RuneScape style)
        const opcode = data[0];
        const payload = data.slice(1);
        
        console.log(`📦 Packet from ${clientId}: opcode=${opcode}, size=${payload.length}`);
        
        switch (opcode) {
            case OPCODES.LOGIN_REQUEST:
                this.handleLogin(client, payload);
                break;
                
            case OPCODES.PLAYER_UPDATE:
                this.handlePlayerUpdate(client, payload);
                break;
                
            case OPCODES.CHAT_MESSAGE:
                this.handleChatMessage(client, payload);
                break;
                
            case OPCODES.COMBAT_ACTION:
                this.handleCombatAction(client, payload);
                break;
                
            case OPCODES.SPELL_CAST:
                this.handleSpellCast(client, payload);
                break;
                
            case OPCODES.LOGOUT:
                this.handleLogout(clientId);
                break;
                
            default:
                console.log(`❓ Unknown opcode: ${opcode}`);
        }
    }
    
    handleLogin(client, payload) {
        // Parse login data (username/password)
        const username = payload.toString('utf8', 0, 12).replace(/\0/g, '');
        const password = payload.toString('utf8', 12, 24).replace(/\0/g, '');
        
        console.log(`🔑 Login attempt: ${username}`);
        
        // Create player (like RuneScape)
        const player = {
            id: client.id,
            username: username,
            x: 50 + Math.floor(Math.random() * 10),
            y: 50 + Math.floor(Math.random() * 10),
            hp: 100,
            level: 1,
            xp: 0,
            inventory: [],
            equipment: {}
        };
        
        client.player = player;
        client.state = GAME_STATES.IN_GAME;
        this.world.players.set(client.id, player);
        
        // Send login response packet
        const response = Buffer.alloc(50);
        response[0] = OPCODES.LOGIN_RESPONSE;
        response[1] = 1; // Success
        response.writeInt16BE(player.x, 2);
        response.writeInt16BE(player.y, 4);
        response.writeInt16BE(player.hp, 6);
        
        client.socket.write(response);
        
        console.log(`✅ Player ${username} logged in at (${player.x}, ${player.y})`);
    }
    
    handlePlayerUpdate(client, payload) {
        if (!client.player) return;
        
        // Parse movement (2 bytes for X, 2 bytes for Y)
        const newX = payload.readInt16BE(0);
        const newY = payload.readInt16BE(2);
        
        // Validate movement (anti-cheat like RuneScape)
        const oldX = client.player.x;
        const oldY = client.player.y;
        const distance = Math.sqrt(Math.pow(newX - oldX, 2) + Math.pow(newY - oldY, 2));
        
        if (distance > 2) {
            console.log(`⚠️ Suspicious movement from ${client.player.username}: distance=${distance}`);
            return;
        }
        
        // Update player position
        client.player.x = newX;
        client.player.y = newY;
        
        // Broadcast to nearby players (like RuneScape's region system)
        this.broadcastToRegion(client.player, OPCODES.PLAYER_UPDATE, payload);
        
        console.log(`🚶 ${client.player.username} moved to (${newX}, ${newY})`);
    }
    
    handleChatMessage(client, payload) {
        if (!client.player) return;
        
        const message = payload.toString('utf8').replace(/\0/g, '');
        console.log(`💬 ${client.player.username}: ${message}`);
        
        // Broadcast chat (like RuneScape)
        const chatPacket = Buffer.alloc(100);
        chatPacket[0] = OPCODES.CHAT_MESSAGE;
        chatPacket.writeInt16BE(client.player.x, 1);
        chatPacket.writeInt16BE(client.player.y, 3);
        Buffer.from(client.player.username).copy(chatPacket, 5, 0, 12);
        Buffer.from(message).copy(chatPacket, 17, 0, 80);
        
        this.broadcastToRegion(client.player, OPCODES.CHAT_MESSAGE, chatPacket);
    }
    
    handleCombatAction(client, payload) {
        if (!client.player) return;
        
        const targetId = payload.toString('utf8', 0, 36).replace(/\0/g, '');
        const target = this.world.npcs.get(targetId);
        
        if (!target) return;
        
        // Calculate damage (like RuneScape combat)
        const damage = Math.floor(Math.random() * 20) + 1;
        target.hp -= damage;
        
        console.log(`⚔️ ${client.player.username} attacks ${target.type} for ${damage} damage`);
        
        // XP gain
        client.player.xp += damage;
        
        // Send combat result
        const combatPacket = Buffer.alloc(20);
        combatPacket[0] = OPCODES.COMBAT_ACTION;
        combatPacket.writeInt16BE(damage, 1);
        combatPacket.writeInt16BE(target.hp, 3);
        combatPacket.writeInt32BE(client.player.xp, 5);
        
        client.socket.write(combatPacket);
        
        // Handle NPC death
        if (target.hp <= 0) {
            this.handleNPCDeath(target, client.player);
        }
    }
    
    handleNPCDeath(npc, killer) {
        console.log(`💀 ${npc.type} killed by ${killer.username}`);
        
        // Drop items (like RuneScape)
        const drops = ['coins', 'bones'];
        if (Math.random() > 0.9) {
            drops.push('rare_item');
        }
        
        drops.forEach(itemType => {
            const itemId = `drop_${Date.now()}_${Math.random()}`;
            this.world.items.set(itemId, {
                id: itemId,
                type: itemType,
                x: npc.x,
                y: npc.y,
                amount: Math.floor(Math.random() * 50) + 1,
                droppedBy: killer.id
            });
        });
        
        // Respawn NPC after delay
        npc.hp = 100;
        npc.respawnTime = Date.now() + 30000; // 30 seconds
    }
    
    broadcastToRegion(player, opcode, data) {
        // Send to players in same region (like RuneScape's region system)
        this.world.players.forEach((otherPlayer, playerId) => {
            if (playerId === player.id) return;
            
            const distance = Math.sqrt(
                Math.pow(otherPlayer.x - player.x, 2) + 
                Math.pow(otherPlayer.y - player.y, 2)
            );
            
            // Only send to nearby players (like RuneScape's viewing distance)
            if (distance <= 15) {
                const client = this.clients.get(playerId);
                if (client && client.socket) {
                    client.socket.write(data);
                }
            }
        });
    }
    
    startGameLoop() {
        // RuneScape Classic ran at 600ms ticks
        setInterval(() => {
            this.gameLoop();
        }, 600);
    }
    
    gameLoop() {
        // Update NPCs
        this.world.npcs.forEach(npc => {
            // Random NPC movement
            if (Math.random() > 0.8) {
                npc.x += Math.floor(Math.random() * 3) - 1;
                npc.y += Math.floor(Math.random() * 3) - 1;
                
                // Keep NPCs in bounds
                npc.x = Math.max(0, Math.min(99, npc.x));
                npc.y = Math.max(0, Math.min(99, npc.y));
            }
            
            // Handle respawns
            if (npc.hp <= 0 && Date.now() > npc.respawnTime) {
                npc.hp = 100;
                console.log(`🔄 ${npc.type} respawned at (${npc.x}, ${npc.y})`);
            }
        });
        
        // Send world updates to players
        this.sendWorldUpdates();
    }
    
    sendWorldUpdates() {
        this.clients.forEach(client => {
            if (client.state !== GAME_STATES.IN_GAME || !client.player) return;
            
            // Send NPC updates (like RuneScape)
            const npcPacket = Buffer.alloc(1000);
            let offset = 0;
            npcPacket[offset++] = OPCODES.NPC_UPDATE;
            
            let npcCount = 0;
            this.world.npcs.forEach(npc => {
                const distance = Math.sqrt(
                    Math.pow(npc.x - client.player.x, 2) + 
                    Math.pow(npc.y - client.player.y, 2)
                );
                
                if (distance <= 15 && npcCount < 50) {
                    npcPacket.writeInt16BE(npc.x, offset); offset += 2;
                    npcPacket.writeInt16BE(npc.y, offset); offset += 2;
                    npcPacket.writeInt16BE(npc.hp, offset); offset += 2;
                    npcPacket.writeInt8(npc.type.length, offset); offset += 1;
                    Buffer.from(npc.type).copy(npcPacket, offset); offset += npc.type.length;
                    npcCount++;
                }
            });
            
            if (npcCount > 0) {
                client.socket.write(npcPacket.slice(0, offset));
            }
        });
    }
    
    sendWelcomePacket(socket) {
        const welcome = Buffer.alloc(100);
        welcome[0] = 0x01; // Welcome opcode
        Buffer.from('RuneScape Protocol Server v1.0').copy(welcome, 1);
        socket.write(welcome);
    }
    
    handleLogout(clientId) {
        const client = this.clients.get(clientId);
        if (client && client.player) {
            this.world.players.delete(clientId);
            console.log(`👋 ${client.player.username} logged out`);
        }
        this.clients.delete(clientId);
    }
}

// Simple Game Client (like RuneScape client)
class GameClient {
    constructor(host, port) {
        this.host = host;
        this.port = port;
        this.socket = null;
        this.player = null;
    }
    
    connect() {
        this.socket = net.connect(this.port, this.host, () => {
            console.log('🎮 Connected to game server');
            
            // Send login packet
            setTimeout(() => {
                this.login('TestPlayer', 'password123');
            }, 1000);
        });
        
        this.socket.on('data', (data) => {
            this.handleServerData(data);
        });
        
        this.socket.on('error', (error) => {
            console.error('❌ Connection error:', error);
        });
    }
    
    login(username, password) {
        const loginPacket = Buffer.alloc(25);
        loginPacket[0] = OPCODES.LOGIN_REQUEST;
        Buffer.from(username).copy(loginPacket, 1, 0, 12);
        Buffer.from(password).copy(loginPacket, 13, 0, 12);
        
        this.socket.write(loginPacket);
        console.log(`🔑 Logging in as ${username}...`);
    }
    
    move(x, y) {
        const movePacket = Buffer.alloc(5);
        movePacket[0] = OPCODES.PLAYER_UPDATE;
        movePacket.writeInt16BE(x, 1);
        movePacket.writeInt16BE(y, 3);
        
        this.socket.write(movePacket);
        console.log(`🚶 Moving to (${x}, ${y})`);
    }
    
    chat(message) {
        const chatPacket = Buffer.alloc(101);
        chatPacket[0] = OPCODES.CHAT_MESSAGE;
        Buffer.from(message).copy(chatPacket, 1, 0, 100);
        
        this.socket.write(chatPacket);
        console.log(`💬 Saying: ${message}`);
    }
    
    attack(targetId) {
        const attackPacket = Buffer.alloc(37);
        attackPacket[0] = OPCODES.COMBAT_ACTION;
        Buffer.from(targetId).copy(attackPacket, 1, 0, 36);
        
        this.socket.write(attackPacket);
        console.log(`⚔️ Attacking: ${targetId}`);
    }
    
    handleServerData(data) {
        const opcode = data[0];
        const payload = data.slice(1);
        
        switch (opcode) {
            case OPCODES.LOGIN_RESPONSE:
                const success = payload[0];
                if (success) {
                    const x = payload.readInt16BE(1);
                    const y = payload.readInt16BE(3);
                    const hp = payload.readInt16BE(5);
                    
                    this.player = { x, y, hp };
                    console.log(`✅ Login successful! Spawned at (${x}, ${y}) with ${hp} HP`);
                    
                    // Start random actions
                    this.startRandomActions();
                } else {
                    console.log('❌ Login failed');
                }
                break;
                
            case OPCODES.NPC_UPDATE:
                console.log(`👹 NPC update received (${payload.length} bytes)`);
                break;
                
            case OPCODES.COMBAT_ACTION:
                const damage = payload.readInt16BE(0);
                const targetHp = payload.readInt16BE(2);
                const xp = payload.readInt32BE(4);
                console.log(`⚔️ Combat result: ${damage} damage, target HP: ${targetHp}, XP: ${xp}`);
                break;
        }
    }
    
    startRandomActions() {
        // Simulate player behavior like bots
        setInterval(() => {
            if (!this.player) return;
            
            const action = Math.random();
            
            if (action < 0.3) {
                // Move randomly
                const newX = this.player.x + Math.floor(Math.random() * 3) - 1;
                const newY = this.player.y + Math.floor(Math.random() * 3) - 1;
                this.move(Math.max(0, Math.min(99, newX)), Math.max(0, Math.min(99, newY)));
                this.player.x = newX;
                this.player.y = newY;
            } else if (action < 0.5) {
                // Chat
                const messages = ['hello world', 'nice weather', 'buying items', 'selling stuff'];
                this.chat(messages[Math.floor(Math.random() * messages.length)]);
            } else if (action < 0.7) {
                // Attack nearby NPC
                this.attack(`npc_${Math.floor(Math.random() * 50)}`);
            }
        }, 2000 + Math.random() * 3000);
    }
}

// Start server and test clients
async function startGameSystem() {
    console.log('🎮 STARTING RAW GAME PROTOCOL SYSTEM');
    console.log('===================================');
    console.log('Like RuneScape Classic - raw TCP, binary protocols');
    console.log('');
    
    // Start game server
    const server = new GameProtocolServer(43594); // RuneScape Classic port
    server.start();
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start test clients
    console.log('🤖 Starting test clients...');
    
    for (let i = 0; i < 3; i++) {
        const client = new GameClient('localhost', 43594);
        client.connect();
        
        // Stagger connections
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('');
    console.log('✅ Raw game system running!');
    console.log('🎮 Game Server: localhost:43594');
    console.log('📡 Using binary protocol like the old days');
    console.log('');
    console.log('This is how RuneScape/Diablo ACTUALLY worked:');
    console.log('- Raw TCP sockets, no HTTP');
    console.log('- Binary packet protocols');
    console.log('- 600ms game ticks');
    console.log('- Region-based updates');
    console.log('- Real-time combat and movement');
}

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down game system...');
    process.exit(0);
});

// Start the system
startGameSystem().catch(console.error);