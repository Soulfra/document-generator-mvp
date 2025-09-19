#!/usr/bin/env node

/**
 * 🎮 ENHANCED GAME PROTOCOL
 * Raw TCP game protocol with visual client, guilds, economy, and AI integration
 * Next-level MMO networking without HTTP overhead
 */

const net = require('net');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');

// Enhanced game protocol constants
const OPCODES = {
    LOGIN_REQUEST: 0x10,
    LOGIN_RESPONSE: 0x11,
    PLAYER_UPDATE: 0x20,
    NPC_UPDATE: 0x21,
    CHAT_MESSAGE: 0x30,
    GUILD_MESSAGE: 0x31,
    ITEM_DROP: 0x40,
    ITEM_PICKUP: 0x41,
    TRADE_REQUEST: 0x42,
    SPELL_CAST: 0x50,
    COMBAT_ACTION: 0x60,
    QUEST_UPDATE: 0x70,
    ACHIEVEMENT_UNLOCK: 0x71,
    ECONOMY_UPDATE: 0x80,
    GUILD_CREATE: 0x90,
    GUILD_JOIN: 0x91,
    GUILD_LEAVE: 0x92,
    AI_ACTION: 0xA0,
    PERFORMANCE_STATS: 0xB0,
    LOGOUT: 0xFF
};

const GAME_STATES = {
    LOBBY: 0,
    IN_GAME: 1,
    COMBAT: 2,
    TRADING: 3,
    IN_GUILD: 4
};

const PLAYER_CLASSES = {
    WARRIOR: 0,
    MAGE: 1,
    ARCHER: 2,
    MERCHANT: 3,
    AI_BOT: 4
};

class EnhancedGameServer {
    constructor(gamePort, webPort) {
        this.gamePort = gamePort;
        this.webPort = webPort;
        this.clients = new Map();
        this.aiClients = new Map();
        this.guilds = new Map();
        this.marketplace = new Map();
        this.achievements = new Map();
        this.leaderboards = {
            xp: [],
            wealth: [],
            combat: [],
            guilds: []
        };
        
        this.world = {
            players: new Map(),
            npcs: new Map(),
            items: new Map(),
            regions: new Map(),
            quests: new Map(),
            economy: {
                totalGold: 0,
                inflation: 1.0,
                marketTrends: new Map()
            }
        };
        
        this.gameStats = {
            totalLogins: 0,
            totalCombats: 0,
            totalTrades: 0,
            totalGuildActions: 0,
            averageLatency: 0,
            peakPlayers: 0,
            aiEfficiency: 0
        };
        
        this.initializeEnhancedWorld();
    }
    
    async start() {
        console.log('🎮 STARTING ENHANCED GAME PROTOCOL');
        console.log('=================================');
        console.log('Next-level MMO with visual client and AI integration');
        console.log('');
        
        // Start game server
        this.startGameServer();
        
        // Start web client server
        this.startWebServer();
        
        // Start AI bots
        this.startAIBots();
        
        // Start enhanced game loop
        this.startEnhancedGameLoop();
        
        console.log('✅ Enhanced Game System running!');
        console.log('');
        console.log(`🎮 Game Server: localhost:${this.gamePort}`);
        console.log(`🌐 Web Client: http://localhost:${this.webPort}`);
        console.log('📊 Features: Guilds, Economy, AI Bots, Achievements');
    }
    
    initializeEnhancedWorld() {
        // Create enhanced NPCs with AI behaviors
        for (let i = 0; i < 100; i++) {
            const npcId = `npc_${i}`;
            const npcTypes = ['goblin', 'skeleton', 'dragon', 'merchant', 'quest_giver'];
            const type = npcTypes[Math.floor(Math.random() * npcTypes.length)];
            
            this.world.npcs.set(npcId, {
                id: npcId,
                type: type,
                x: Math.floor(Math.random() * 200),
                y: Math.floor(Math.random() * 200),
                hp: type === 'dragon' ? 500 : 100,
                maxHp: type === 'dragon' ? 500 : 100,
                level: Math.floor(Math.random() * 100) + 1,
                respawnTime: 0,
                ai: {
                    behavior: type === 'merchant' ? 'trade' : type === 'quest_giver' ? 'quest' : 'wander',
                    lastAction: Date.now(),
                    target: null,
                    inventory: this.generateNPCInventory(type)
                },
                guild: type === 'goblin' ? 'goblin_clan' : null
            });
        }
        
        // Create starter guilds
        this.guilds.set('goblin_clan', {
            id: 'goblin_clan',
            name: 'Goblin Clan',
            members: ['npc_0', 'npc_1', 'npc_2'],
            leader: 'npc_0',
            treasury: 1000,
            level: 5,
            created: Date.now()
        });
        
        // Create quests
        this.world.quests.set('kill_goblins', {
            id: 'kill_goblins',
            name: 'Goblin Slayer',
            description: 'Kill 10 goblins',
            requirements: { kill: { goblin: 10 } },
            rewards: { xp: 500, gold: 100 },
            active: true
        });
        
        // Initialize achievements
        this.achievements.set('first_kill', {
            id: 'first_kill',
            name: 'First Blood',
            description: 'Kill your first monster',
            reward: { xp: 100 },
            unlocked: new Set()
        });
        
        console.log(`🌍 Enhanced world initialized: ${this.world.npcs.size} AI NPCs, ${this.guilds.size} guilds`);
    }
    
    generateNPCInventory(type) {
        const items = [];
        switch (type) {
            case 'merchant':
                items.push({ type: 'health_potion', quantity: 10, price: 50 });
                items.push({ type: 'sword', quantity: 3, price: 200 });
                break;
            case 'dragon':
                items.push({ type: 'dragon_scale', quantity: 1, price: 1000 });
                items.push({ type: 'treasure', quantity: 5, price: 500 });
                break;
        }
        return items;
    }
    
    startGameServer() {
        const server = net.createServer((socket) => {
            const clientId = crypto.randomUUID();
            console.log(`🎮 Player connected: ${clientId}`);
            
            this.clients.set(clientId, {
                id: clientId,
                socket: socket,
                state: GAME_STATES.LOBBY,
                player: null,
                lastPing: Date.now(),
                performance: {
                    packetsReceived: 0,
                    bytesSent: 0,
                    latency: 0
                }
            });
            
            socket.on('data', (data) => {
                this.handleEnhancedGameData(clientId, data);
            });
            
            socket.on('close', () => {
                console.log(`🚪 Player disconnected: ${clientId}`);
                this.handleLogout(clientId);
            });
            
            socket.on('error', (error) => {
                console.error(`❌ Socket error for ${clientId}:`, error.message);
                this.clients.delete(clientId);
            });
            
            this.sendWelcomePacket(socket);
        });
        
        server.listen(this.gamePort, () => {
            console.log(`🎮 Enhanced Game Server listening on port ${this.gamePort}`);
        });
    }
    
    startWebServer() {
        const server = http.createServer((req, res) => {
            const url = new URL(req.url, `http://localhost:${this.webPort}`);
            
            if (url.pathname === '/') {
                this.serveGameClient(res);
            } else if (url.pathname === '/api/stats') {
                this.serveGameStats(res);
            } else if (url.pathname === '/api/leaderboards') {
                this.serveLeaderboards(res);
            } else if (url.pathname === '/api/guilds') {
                this.serveGuilds(res);
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        server.listen(this.webPort, () => {
            console.log(`🌐 Web client server running on port ${this.webPort}`);
        });
    }
    
    startAIBots() {
        console.log('🤖 Starting AI bots...');
        
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const bot = new EnhancedAIBot('localhost', this.gamePort, `AI_Bot_${i}`);
                bot.connect();
                this.aiClients.set(`ai_${i}`, bot);
            }, i * 2000);
        }
    }
    
    handleEnhancedGameData(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        client.performance.packetsReceived++;
        const opcode = data[0];
        const payload = data.slice(1);
        
        const startTime = Date.now();
        
        switch (opcode) {
            case OPCODES.LOGIN_REQUEST:
                this.handleEnhancedLogin(client, payload);
                break;
            case OPCODES.PLAYER_UPDATE:
                this.handleEnhancedPlayerUpdate(client, payload);
                break;
            case OPCODES.COMBAT_ACTION:
                this.handleEnhancedCombat(client, payload);
                break;
            case OPCODES.GUILD_CREATE:
                this.handleGuildCreate(client, payload);
                break;
            case OPCODES.GUILD_JOIN:
                this.handleGuildJoin(client, payload);
                break;
            case OPCODES.TRADE_REQUEST:
                this.handleTradeRequest(client, payload);
                break;
            case OPCODES.ITEM_PICKUP:
                this.handleItemPickup(client, payload);
                break;
            default:
                console.log(`❓ Unknown opcode: ${opcode}`);
        }
        
        // Track performance
        client.performance.latency = Date.now() - startTime;
        this.updateGameStats();
    }
    
    handleEnhancedLogin(client, payload) {
        const username = payload.toString('utf8', 0, 12).replace(/\0/g, '');
        const playerClass = payload.readUInt8(24) || PLAYER_CLASSES.WARRIOR;
        
        console.log(`🔑 Enhanced login: ${username} (Class: ${Object.keys(PLAYER_CLASSES)[playerClass]})`);
        
        const player = {
            id: client.id,
            username: username,
            class: playerClass,
            x: 100 + Math.floor(Math.random() * 20),
            y: 100 + Math.floor(Math.random() * 20),
            hp: 100,
            maxHp: 100,
            level: 1,
            xp: 0,
            gold: 1000,
            inventory: [
                { type: 'bronze_sword', quantity: 1 },
                { type: 'health_potion', quantity: 5 }
            ],
            equipment: {},
            guild: null,
            achievements: [],
            quests: [],
            stats: {
                kills: 0,
                deaths: 0,
                trades: 0,
                guildActions: 0
            }
        };
        
        client.player = player;
        client.state = GAME_STATES.IN_GAME;
        this.world.players.set(client.id, player);
        this.gameStats.totalLogins++;
        
        // Send enhanced login response
        const response = Buffer.alloc(100);
        response[0] = OPCODES.LOGIN_RESPONSE;
        response[1] = 1; // Success
        response.writeInt16BE(player.x, 2);
        response.writeInt16BE(player.y, 4);
        response.writeInt16BE(player.hp, 6);
        response.writeInt32BE(player.gold, 8);
        response.writeInt32BE(player.xp, 12);
        
        client.socket.write(response);
        
        // Send initial world state (placeholder for now)
        console.log(`🌍 Sending initial world state to ${username}`);
        
        console.log(`✅ ${username} logged in at (${player.x}, ${player.y}) with ${player.gold} gold`);
    }
    
    handleEnhancedCombat(client, payload) {
        if (!client.player) return;
        
        const targetId = payload.toString('utf8', 0, 36).replace(/\0/g, '');
        const target = this.world.npcs.get(targetId);
        
        if (!target) return;
        
        // Enhanced combat calculation
        const baseDamage = Math.floor(Math.random() * 20) + 1;
        const classDamage = client.player.class === PLAYER_CLASSES.WARRIOR ? 5 : 
                          client.player.class === PLAYER_CLASSES.MAGE ? 3 : 
                          client.player.class === PLAYER_CLASSES.ARCHER ? 4 : 0;
        const damage = baseDamage + classDamage;
        
        target.hp -= damage;
        client.player.xp += damage;
        this.gameStats.totalCombats++;
        
        console.log(`⚔️ ${client.player.username} attacks ${target.type} for ${damage} damage`);
        
        // Check for achievements
        if (client.player.stats.kills === 0) {
            this.unlockAchievement(client.player, 'first_kill');
        }
        client.player.stats.kills++;
        
        // Send combat result with enhanced data
        const combatPacket = Buffer.alloc(50);
        combatPacket[0] = OPCODES.COMBAT_ACTION;
        combatPacket.writeInt16BE(damage, 1);
        combatPacket.writeInt16BE(target.hp, 3);
        combatPacket.writeInt32BE(client.player.xp, 5);
        combatPacket.writeInt32BE(client.player.gold, 9);
        combatPacket.writeInt16BE(client.player.stats.kills, 13);
        
        client.socket.write(combatPacket);
        
        // Handle NPC death with enhanced drops
        if (target.hp <= 0) {
            this.handleEnhancedNPCDeath(target, client.player);
        }
        
        // Update leaderboards
        this.updateLeaderboards();
    }
    
    handleEnhancedNPCDeath(npc, killer) {
        console.log(`💀 ${npc.type} killed by ${killer.username}`);
        
        // Enhanced loot drops
        const drops = ['coins'];
        const goldDrop = Math.floor(Math.random() * 100) + 50;
        
        if (npc.type === 'dragon') {
            drops.push('dragon_scale', 'rare_gem');
            killer.gold += goldDrop * 10;
        } else {
            killer.gold += goldDrop;
        }
        
        if (Math.random() > 0.85) {
            drops.push('rare_item');
        }
        
        // Update economy
        this.world.economy.totalGold += goldDrop;
        this.world.economy.inflation += 0.001;
        
        // Drop items in world
        drops.forEach(itemType => {
            const itemId = `drop_${Date.now()}_${Math.random()}`;
            this.world.items.set(itemId, {
                id: itemId,
                type: itemType,
                x: npc.x,
                y: npc.y,
                amount: itemType === 'coins' ? goldDrop : 1,
                droppedBy: killer.id,
                droppedAt: Date.now()
            });
        });
        
        // Enhanced respawn with AI behavior
        npc.hp = npc.maxHp;
        npc.respawnTime = Date.now() + (npc.type === 'dragon' ? 300000 : 30000); // Dragons respawn in 5min
        npc.x = Math.floor(Math.random() * 200);
        npc.y = Math.floor(Math.random() * 200);
    }
    
    handleGuildCreate(client, payload) {
        if (!client.player) return;
        
        const guildName = payload.toString('utf8', 0, 32).replace(/\0/g, '');
        const guildId = crypto.randomUUID();
        
        if (client.player.gold < 1000) {
            console.log(`❌ ${client.player.username} can't afford guild creation (1000 gold needed)`);
            return;
        }
        
        client.player.gold -= 1000;
        client.player.guild = guildId;
        
        this.guilds.set(guildId, {
            id: guildId,
            name: guildName,
            members: [client.player.id],
            leader: client.player.id,
            treasury: 0,
            level: 1,
            created: Date.now()
        });
        
        console.log(`🏰 Guild "${guildName}" created by ${client.player.username}`);
        
        // Send guild creation response
        const response = Buffer.alloc(50);
        response[0] = OPCODES.GUILD_CREATE;
        response[1] = 1; // Success
        Buffer.from(guildName).copy(response, 2, 0, 32);
        response.writeInt32BE(client.player.gold, 34);
        
        client.socket.write(response);
        
        this.gameStats.totalGuildActions++;
    }
    
    unlockAchievement(player, achievementId) {
        const achievement = this.achievements.get(achievementId);
        if (!achievement || achievement.unlocked.has(player.id)) return;
        
        achievement.unlocked.add(player.id);
        player.achievements.push(achievementId);
        
        if (achievement.reward.xp) player.xp += achievement.reward.xp;
        if (achievement.reward.gold) player.gold += achievement.reward.gold;
        
        console.log(`🏆 ${player.username} unlocked achievement: ${achievement.name}`);
        
        // Send achievement notification
        const client = this.clients.get(player.id);
        if (client) {
            const packet = Buffer.alloc(100);
            packet[0] = OPCODES.ACHIEVEMENT_UNLOCK;
            Buffer.from(achievement.name).copy(packet, 1, 0, 50);
            packet.writeInt32BE(achievement.reward.xp || 0, 51);
            packet.writeInt32BE(achievement.reward.gold || 0, 55);
            
            client.socket.write(packet);
        }
    }
    
    startEnhancedGameLoop() {
        // Enhanced game loop with AI behaviors
        setInterval(() => {
            this.enhancedGameLoop();
        }, 300); // Faster tick rate for better performance
    }
    
    enhancedGameLoop() {
        // Update AI NPCs with enhanced behaviors
        this.world.npcs.forEach(npc => {
            this.updateNPCAI(npc);
        });
        
        // Update economy
        this.updateEconomy();
        
        // Send enhanced world updates
        this.sendEnhancedWorldUpdates();
        
        // Update performance stats
        this.updatePerformanceStats();
    }
    
    updateNPCAI(npc) {
        if (npc.hp <= 0 && Date.now() < npc.respawnTime) return;
        
        const now = Date.now();
        if (now - npc.ai.lastAction < 2000) return; // AI action cooldown
        
        switch (npc.ai.behavior) {
            case 'wander':
                // Random movement with some intelligence
                if (Math.random() > 0.7) {
                    npc.x += Math.floor(Math.random() * 6) - 3;
                    npc.y += Math.floor(Math.random() * 6) - 3;
                    npc.x = Math.max(0, Math.min(199, npc.x));
                    npc.y = Math.max(0, Math.min(199, npc.y));
                }
                break;
                
            case 'trade':
                // Merchant AI - move toward players with low health
                const nearbyPlayers = Array.from(this.world.players.values()).filter(p => {
                    const distance = Math.sqrt(Math.pow(p.x - npc.x, 2) + Math.pow(p.y - npc.y, 2));
                    return distance <= 20 && p.hp < p.maxHp * 0.5;
                });
                
                if (nearbyPlayers.length > 0) {
                    const target = nearbyPlayers[0];
                    const dx = target.x - npc.x;
                    const dy = target.y - npc.y;
                    npc.x += dx > 0 ? 1 : dx < 0 ? -1 : 0;
                    npc.y += dy > 0 ? 1 : dy < 0 ? -1 : 0;
                }
                break;
                
            case 'quest':
                // Quest giver - stay near spawn point
                break;
        }
        
        npc.ai.lastAction = now;
    }
    
    updateEconomy() {
        // Simulate market fluctuations
        this.world.economy.inflation += (Math.random() - 0.5) * 0.0001;
        this.world.economy.inflation = Math.max(0.5, Math.min(2.0, this.world.economy.inflation));
        
        // Update market trends
        const items = ['sword', 'health_potion', 'rare_item'];
        items.forEach(item => {
            const currentPrice = this.world.economy.marketTrends.get(item) || 100;
            const change = (Math.random() - 0.5) * 10;
            this.world.economy.marketTrends.set(item, Math.max(10, currentPrice + change));
        });
    }
    
    updateLeaderboards() {
        // Update XP leaderboard
        this.leaderboards.xp = Array.from(this.world.players.values())
            .sort((a, b) => b.xp - a.xp)
            .slice(0, 10);
            
        // Update wealth leaderboard
        this.leaderboards.wealth = Array.from(this.world.players.values())
            .sort((a, b) => b.gold - a.gold)
            .slice(0, 10);
            
        // Update combat leaderboard
        this.leaderboards.combat = Array.from(this.world.players.values())
            .sort((a, b) => b.stats.kills - a.stats.kills)
            .slice(0, 10);
            
        // Update guild leaderboard
        this.leaderboards.guilds = Array.from(this.guilds.values())
            .sort((a, b) => b.level - a.level)
            .slice(0, 10);
    }
    
    updateGameStats() {
        const totalPlayers = this.world.players.size;
        if (totalPlayers > this.gameStats.peakPlayers) {
            this.gameStats.peakPlayers = totalPlayers;
        }
        
        // Calculate average latency
        const clients = Array.from(this.clients.values());
        if (clients.length > 0) {
            const totalLatency = clients.reduce((sum, client) => sum + client.performance.latency, 0);
            this.gameStats.averageLatency = totalLatency / clients.length;
        }
        
        // AI efficiency calculation
        const aiClients = Array.from(this.aiClients.values());
        this.gameStats.aiEfficiency = aiClients.length > 0 ? 
            (aiClients.filter(ai => ai.connected).length / aiClients.length) * 100 : 0;
    }
    
    updatePerformanceStats() {
        // Update performance metrics for the dashboard
        const clients = Array.from(this.clients.values());
        let totalPackets = 0;
        let totalBytes = 0;
        
        clients.forEach(client => {
            totalPackets += client.performance.packetsReceived;
            totalBytes += client.performance.bytesSent;
        });
        
        this.gameStats.totalPackets = totalPackets;
        this.gameStats.totalBytes = totalBytes;
        this.gameStats.packetsPerSecond = totalPackets / (Date.now() / 1000);
    }
    
    sendEnhancedWorldUpdates() {
        this.clients.forEach(client => {
            if (client.state !== GAME_STATES.IN_GAME || !client.player) return;
            
            // Send optimized world updates with spatial partitioning
            this.sendSpatialUpdates(client);
        });
    }
    
    sendSpatialUpdates(client) {
        const player = client.player;
        const viewDistance = 25;
        
        // Create spatial update packet
        const packet = Buffer.alloc(2000);
        let offset = 0;
        packet[offset++] = OPCODES.NPC_UPDATE;
        
        let entityCount = 0;
        
        // Add nearby NPCs
        this.world.npcs.forEach(npc => {
            const distance = Math.sqrt(
                Math.pow(npc.x - player.x, 2) + 
                Math.pow(npc.y - player.y, 2)
            );
            
            if (distance <= viewDistance && entityCount < 50) {
                packet.writeInt16BE(npc.x, offset); offset += 2;
                packet.writeInt16BE(npc.y, offset); offset += 2;
                packet.writeInt16BE(npc.hp, offset); offset += 2;
                packet.writeInt16BE(npc.level, offset); offset += 2;
                packet.writeInt8(npc.type.length, offset); offset += 1;
                Buffer.from(npc.type).copy(packet, offset); offset += npc.type.length;
                entityCount++;
            }
        });
        
        // Add nearby items
        this.world.items.forEach(item => {
            const distance = Math.sqrt(
                Math.pow(item.x - player.x, 2) + 
                Math.pow(item.y - player.y, 2)
            );
            
            if (distance <= viewDistance && entityCount < 50) {
                packet.writeInt16BE(item.x, offset); offset += 2;
                packet.writeInt16BE(item.y, offset); offset += 2;
                packet.writeInt16BE(item.amount, offset); offset += 2;
                packet.writeInt8(item.type.length, offset); offset += 1;
                Buffer.from(item.type).copy(packet, offset); offset += item.type.length;
                entityCount++;
            }
        });
        
        if (entityCount > 0) {
            client.socket.write(packet.slice(0, offset));
            client.performance.bytesSent += offset;
        }
    }
    
    serveGameClient(res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>🎮 Enhanced MMO Client</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; background: #1a1a2e; color: #fff; font-family: monospace; overflow: hidden; }
        .game-container { display: flex; height: 100vh; }
        .game-canvas-container { flex: 1; position: relative; }
        .ui-panel { width: 300px; background: rgba(0,0,0,0.8); padding: 15px; overflow-y: auto; }
        
        #gameCanvas { 
            background: linear-gradient(45deg, #0f3460, #16213e);
            border: 2px solid #0f0;
            cursor: crosshair;
        }
        
        .ui-section { 
            background: rgba(0,255,0,0.1); 
            border: 1px solid #0f0; 
            margin: 10px 0; 
            padding: 10px; 
            border-radius: 5px;
        }
        
        .stat-bar { 
            background: #333; 
            height: 20px; 
            border-radius: 10px; 
            overflow: hidden; 
            margin: 5px 0;
        }
        
        .stat-fill { 
            height: 100%; 
            transition: width 0.3s ease;
        }
        
        .hp-fill { background: linear-gradient(90deg, #ff0000, #ff6666); }
        .xp-fill { background: linear-gradient(90deg, #0066ff, #66aaff); }
        
        .leaderboard { font-size: 12px; }
        .leaderboard-item { 
            display: flex; 
            justify-content: space-between; 
            padding: 2px 0; 
            border-bottom: 1px solid rgba(0,255,0,0.2);
        }
        
        .guild-panel { 
            background: rgba(138, 43, 226, 0.2);
            border: 1px solid #8A2BE2;
        }
        
        .achievement { 
            background: rgba(255, 215, 0, 0.2);
            border-left: 3px solid gold;
            padding: 5px;
            margin: 3px 0;
            font-size: 11px;
        }
        
        .economy-ticker { 
            background: rgba(0,255,255,0.1);
            padding: 5px;
            font-size: 10px;
            white-space: nowrap;
            overflow: hidden;
        }
        
        .controls { 
            position: absolute; 
            bottom: 10px; 
            left: 10px; 
            background: rgba(0,0,0,0.7);
            padding: 10px;
            border-radius: 5px;
        }
        
        .btn { 
            background: #0f0; 
            color: #000; 
            border: none; 
            padding: 5px 10px; 
            margin: 2px; 
            cursor: pointer; 
            border-radius: 3px;
        }
        
        .btn:hover { background: #0f0; opacity: 0.8; }
        
        .chat-box { 
            background: rgba(0,0,0,0.8); 
            position: absolute; 
            bottom: 50px; 
            left: 10px; 
            width: 300px; 
            height: 100px; 
            overflow-y: auto; 
            font-size: 12px; 
            padding: 5px;
        }
        
        .performance-stats {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.7);
            padding: 10px;
            font-size: 11px;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="game-container">
        <div class="game-canvas-container">
            <canvas id="gameCanvas" width="800" height="600"></canvas>
            
            <div class="performance-stats">
                <div>FPS: <span id="fps">0</span></div>
                <div>Latency: <span id="latency">0ms</span></div>
                <div>Players: <span id="playerCount">0</span></div>
                <div>NPCs: <span id="npcCount">0</span></div>
            </div>
            
            <div class="controls">
                <button class="btn" onclick="connectToGame()">🎮 Connect</button>
                <button class="btn" onclick="createGuild()">🏰 Create Guild</button>
                <button class="btn" onclick="toggleAI()">🤖 AI Mode</button>
                <button class="btn" onclick="openMarketplace()">💰 Market</button>
            </div>
            
            <div class="chat-box" id="chatBox">
                <div style="color: #0f0;">🎮 Enhanced MMO Client Ready</div>
                <div style="color: #ff0;">📡 Click Connect to join the game</div>
            </div>
        </div>
        
        <div class="ui-panel">
            <div class="ui-section">
                <h3>🎯 Player Stats</h3>
                <div>Level: <span id="playerLevel">1</span></div>
                <div>Gold: <span id="playerGold">0</span></div>
                <div>Kills: <span id="playerKills">0</span></div>
                
                <div>HP: <span id="playerHP">100</span>/<span id="playerMaxHP">100</span></div>
                <div class="stat-bar">
                    <div class="stat-fill hp-fill" id="hpBar" style="width: 100%"></div>
                </div>
                
                <div>XP: <span id="playerXP">0</span></div>
                <div class="stat-bar">
                    <div class="stat-fill xp-fill" id="xpBar" style="width: 0%"></div>
                </div>
            </div>
            
            <div class="ui-section guild-panel">
                <h3>🏰 Guild</h3>
                <div id="guildInfo">No guild</div>
                <div id="guildMembers"></div>
            </div>
            
            <div class="ui-section">
                <h3>🏆 Achievements</h3>
                <div id="achievementsList">
                    <div class="achievement">🎯 Kill your first monster</div>
                </div>
            </div>
            
            <div class="ui-section">
                <h3>📊 Leaderboards</h3>
                <div class="leaderboard">
                    <strong>🏅 Top XP:</strong>
                    <div id="xpLeaderboard">Loading...</div>
                </div>
                <div class="leaderboard">
                    <strong>💰 Richest:</strong>
                    <div id="wealthLeaderboard">Loading...</div>
                </div>
            </div>
            
            <div class="ui-section">
                <h3>💹 Economy</h3>
                <div class="economy-ticker">
                    <div>Inflation: <span id="inflation">1.00x</span></div>
                    <div>Total Gold: <span id="totalGold">0</span></div>
                </div>
                <div id="marketPrices">
                    <div>⚔️ Sword: <span id="swordPrice">100</span>g</div>
                    <div>🧪 Potion: <span id="potionPrice">50</span>g</div>
                </div>
            </div>
            
            <div class="ui-section">
                <h3>🎮 Game Stats</h3>
                <div>Peak Players: <span id="peakPlayers">0</span></div>
                <div>Total Logins: <span id="totalLogins">0</span></div>
                <div>Total Combats: <span id="totalCombats">0</span></div>
                <div>AI Efficiency: <span id="aiEfficiency">0</span>%</div>
            </div>
        </div>
    </div>
    
    <script>
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        
        let gameState = {
            connected: false,
            player: null,
            npcs: [],
            items: [],
            otherPlayers: [],
            camera: { x: 0, y: 0 }
        };
        
        let socket = null;
        let lastFrameTime = 0;
        let fps = 0;
        
        function connectToGame() {
            // In a real implementation, this would connect to the raw TCP server
            // For demo purposes, we'll simulate the connection
            addChatMessage('🔗 Connecting to game server...');
            
            setTimeout(() => {
                gameState.connected = true;
                gameState.player = {
                    x: 100,
                    y: 100,
                    hp: 100,
                    maxHp: 100,
                    level: 1,
                    xp: 0,
                    gold: 1000,
                    kills: 0
                };
                
                // Simulate some NPCs
                for (let i = 0; i < 10; i++) {
                    gameState.npcs.push({
                        x: 50 + Math.random() * 200,
                        y: 50 + Math.random() * 200,
                        type: ['goblin', 'skeleton', 'dragon'][Math.floor(Math.random() * 3)],
                        hp: 100,
                        level: Math.floor(Math.random() * 10) + 1
                    });
                }
                
                addChatMessage('✅ Connected to Enhanced MMO!');
                addChatMessage('🎯 Use WASD to move, click to attack');
                startGameLoop();
            }, 2000);
        }
        
        function startGameLoop() {
            function gameLoop(timestamp) {
                const deltaTime = timestamp - lastFrameTime;
                lastFrameTime = timestamp;
                
                // Calculate FPS
                fps = Math.round(1000 / deltaTime);
                document.getElementById('fps').textContent = fps;
                
                // Update game
                updateGame(deltaTime);
                
                // Render game
                renderGame();
                
                requestAnimationFrame(gameLoop);
            }
            
            requestAnimationFrame(gameLoop);
        }
        
        function updateGame(deltaTime) {
            if (!gameState.connected || !gameState.player) return;
            
            // Update camera to follow player
            gameState.camera.x = gameState.player.x - canvas.width / 2;
            gameState.camera.y = gameState.player.y - canvas.height / 2;
            
            // Simulate NPC movement
            gameState.npcs.forEach(npc => {
                if (Math.random() > 0.98) {
                    npc.x += (Math.random() - 0.5) * 4;
                    npc.y += (Math.random() - 0.5) * 4;
                }
            });
            
            // Update UI
            updateUI();
        }
        
        function renderGame() {
            // Clear canvas
            ctx.fillStyle = '#0f3460';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw grid
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
            ctx.lineWidth = 1;
            
            for (let x = 0; x < canvas.width; x += 50) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            
            for (let y = 0; y < canvas.height; y += 50) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
            
            if (!gameState.connected || !gameState.player) {
                ctx.fillStyle = '#ff0';
                ctx.font = '24px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('Click Connect to join the game', canvas.width / 2, canvas.height / 2);
                return;
            }
            
            // Draw NPCs
            gameState.npcs.forEach(npc => {
                const screenX = npc.x - gameState.camera.x;
                const screenY = npc.y - gameState.camera.y;
                
                if (screenX >= -50 && screenX <= canvas.width + 50 && 
                    screenY >= -50 && screenY <= canvas.height + 50) {
                    
                    // NPC body
                    ctx.fillStyle = npc.type === 'dragon' ? '#f00' : 
                                   npc.type === 'skeleton' ? '#ccc' : '#090';
                    ctx.fillRect(screenX - 10, screenY - 10, 20, 20);
                    
                    // NPC health bar
                    const hpPercent = npc.hp / 100;
                    ctx.fillStyle = '#f00';
                    ctx.fillRect(screenX - 12, screenY - 18, 24, 4);
                    ctx.fillStyle = '#0f0';
                    ctx.fillRect(screenX - 12, screenY - 18, 24 * hpPercent, 4);
                    
                    // NPC label
                    ctx.fillStyle = '#fff';
                    ctx.font = '10px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText(npc.type + ' L' + npc.level, screenX, screenY - 22);
                }
            });
            
            // Draw player
            const playerScreenX = gameState.player.x - gameState.camera.x;
            const playerScreenY = gameState.player.y - gameState.camera.y;
            
            ctx.fillStyle = '#00f';
            ctx.fillRect(playerScreenX - 12, playerScreenY - 12, 24, 24);
            
            // Player health bar
            const playerHpPercent = gameState.player.hp / gameState.player.maxHp;
            ctx.fillStyle = '#f00';
            ctx.fillRect(playerScreenX - 15, playerScreenY - 20, 30, 5);
            ctx.fillStyle = '#0f0';
            ctx.fillRect(playerScreenX - 15, playerScreenY - 20, 30 * playerHpPercent, 5);
            
            // Player name
            ctx.fillStyle = '#0ff';
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('YOU', playerScreenX, playerScreenY - 25);
        }
        
        function updateUI() {
            if (!gameState.player) return;
            
            document.getElementById('playerLevel').textContent = gameState.player.level;
            document.getElementById('playerGold').textContent = gameState.player.gold;
            document.getElementById('playerKills').textContent = gameState.player.kills;
            document.getElementById('playerHP').textContent = gameState.player.hp;
            document.getElementById('playerMaxHP').textContent = gameState.player.maxHp;
            document.getElementById('playerXP').textContent = gameState.player.xp;
            
            const hpPercent = (gameState.player.hp / gameState.player.maxHp) * 100;
            document.getElementById('hpBar').style.width = hpPercent + '%';
            
            const xpPercent = (gameState.player.xp % 1000) / 10; // XP to next level
            document.getElementById('xpBar').style.width = xpPercent + '%';
            
            document.getElementById('playerCount').textContent = 1 + gameState.otherPlayers.length;
            document.getElementById('npcCount').textContent = gameState.npcs.length;
        }
        
        function addChatMessage(message) {
            const chatBox = document.getElementById('chatBox');
            const div = document.createElement('div');
            div.innerHTML = message;
            chatBox.appendChild(div);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
        
        function createGuild() {
            if (!gameState.connected) {
                addChatMessage('❌ Connect to game first');
                return;
            }
            
            const guildName = prompt('Enter guild name:');
            if (guildName) {
                addChatMessage('🏰 Creating guild: ' + guildName);
                // In real implementation, send guild creation packet
            }
        }
        
        function toggleAI() {
            addChatMessage('🤖 AI mode toggled');
        }
        
        function openMarketplace() {
            addChatMessage('💰 Marketplace opened');
        }
        
        // Keyboard controls
        const keys = new Set();
        
        document.addEventListener('keydown', (e) => {
            keys.add(e.key.toLowerCase());
            
            if (!gameState.connected || !gameState.player) return;
            
            if (keys.has('w') || keys.has('arrowup')) {
                gameState.player.y -= 5;
            }
            if (keys.has('s') || keys.has('arrowdown')) {
                gameState.player.y += 5;
            }
            if (keys.has('a') || keys.has('arrowleft')) {
                gameState.player.x -= 5;
            }
            if (keys.has('d') || keys.has('arrowright')) {
                gameState.player.x += 5;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            keys.delete(e.key.toLowerCase());
        });
        
        // Mouse controls for attacking
        canvas.addEventListener('click', (e) => {
            if (!gameState.connected || !gameState.player) return;
            
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left + gameState.camera.x;
            const clickY = e.clientY - rect.top + gameState.camera.y;
            
            // Check if clicked on NPC
            gameState.npcs.forEach(npc => {
                const distance = Math.sqrt(
                    Math.pow(clickX - npc.x, 2) + Math.pow(clickY - npc.y, 2)
                );
                
                if (distance <= 20) {
                    const damage = Math.floor(Math.random() * 15) + 5;
                    npc.hp -= damage;
                    gameState.player.xp += damage;
                    gameState.player.kills++;
                    
                    addChatMessage('⚔️ Attacked ' + npc.type + ' for ' + damage + ' damage');
                    
                    if (npc.hp <= 0) {
                        addChatMessage('💀 ' + npc.type + ' defeated! +' + damage + ' XP');
                        npc.hp = 100;
                        npc.x = 50 + Math.random() * 200;
                        npc.y = 50 + Math.random() * 200;
                        
                        const goldReward = Math.floor(Math.random() * 50) + 25;
                        gameState.player.gold += goldReward;
                        addChatMessage('💰 Found ' + goldReward + ' gold');
                    }
                }
            });
        });
        
        // Update game stats periodically
        setInterval(async () => {
            try {
                const response = await fetch('/api/stats');
                const stats = await response.json();
                
                document.getElementById('peakPlayers').textContent = stats.peakPlayers;
                document.getElementById('totalLogins').textContent = stats.totalLogins;
                document.getElementById('totalCombats').textContent = stats.totalCombats;
                document.getElementById('aiEfficiency').textContent = Math.round(stats.aiEfficiency);
                document.getElementById('latency').textContent = Math.round(stats.averageLatency) + 'ms';
                
            } catch (error) {
                console.error('Stats update error:', error);
            }
        }, 5000);
        
        // Initial setup
        addChatMessage('🎮 Enhanced MMO Client v2.0');
        addChatMessage('🚀 Features: Guilds, Economy, AI, Achievements');
        addChatMessage('📊 Real-time stats and leaderboards');
    </script>
</body>
</html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveGameStats(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.gameStats));
    }
    
    serveLeaderboards(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.leaderboards));
    }
    
    serveGuilds(res) {
        const guildData = Array.from(this.guilds.values());
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(guildData));
    }
    
    sendWelcomePacket(socket) {
        const welcome = Buffer.alloc(150);
        welcome[0] = 0x01;
        Buffer.from('Enhanced MMO Protocol Server v2.0').copy(welcome, 1);
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

// Enhanced AI Bot with better behaviors
class EnhancedAIBot {
    constructor(host, port, name) {
        this.host = host;
        this.port = port;
        this.name = name;
        this.socket = null;
        this.player = null;
        this.connected = false;
        this.lastAction = Date.now();
        this.behavior = {
            mode: 'aggressive', // aggressive, defensive, merchant, explorer
            target: null,
            cooldown: 0
        };
    }
    
    connect() {
        this.socket = net.connect(this.port, this.host, () => {
            console.log(`🤖 AI Bot ${this.name} connected`);
            this.connected = true;
            
            setTimeout(() => {
                this.login();
            }, 1000);
        });
        
        this.socket.on('data', (data) => {
            this.handleServerData(data);
        });
        
        this.socket.on('error', (error) => {
            console.error(`❌ AI Bot ${this.name} error:`, error.message);
            this.connected = false;
        });
        
        this.socket.on('close', () => {
            console.log(`🚪 AI Bot ${this.name} disconnected`);
            this.connected = false;
        });
    }
    
    login() {
        const loginPacket = Buffer.alloc(30);
        loginPacket[0] = OPCODES.LOGIN_REQUEST;
        Buffer.from(this.name).copy(loginPacket, 1, 0, 12);
        Buffer.from('aipassword').copy(loginPacket, 13, 0, 12);
        loginPacket.writeUInt8(PLAYER_CLASSES.AI_BOT, 24);
        
        this.socket.write(loginPacket);
        console.log(`🔑 AI Bot ${this.name} logging in...`);
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
                    const gold = payload.readInt32BE(8);
                    
                    this.player = { x, y, hp, gold, xp: 0 };
                    console.log(`✅ AI Bot ${this.name} spawned at (${x}, ${y})`);
                    
                    this.startAIBehavior();
                }
                break;
                
            case OPCODES.COMBAT_ACTION:
                const damage = payload.readInt16BE(0);
                const xp = payload.readInt32BE(4);
                console.log(`🤖 ${this.name} dealt ${damage} damage, gained ${xp} XP`);
                break;
        }
    }
    
    startAIBehavior() {
        setInterval(() => {
            if (!this.connected || !this.player) return;
            
            const now = Date.now();
            if (now - this.lastAction < 2000) return;
            
            this.performAIAction();
            this.lastAction = now;
        }, 3000);
    }
    
    performAIAction() {
        const action = Math.random();
        
        switch (this.behavior.mode) {
            case 'aggressive':
                if (action < 0.6) {
                    this.attackNearbyNPC();
                } else if (action < 0.8) {
                    this.moveRandomly();
                } else {
                    this.chat(['Grr!', 'Fight me!', 'Looking for combat'][Math.floor(Math.random() * 3)]);
                }
                break;
                
            case 'explorer':
                if (action < 0.7) {
                    this.moveRandomly();
                } else {
                    this.chat(['Exploring...', 'What\'s over here?', 'New territories!'][Math.floor(Math.random() * 3)]);
                }
                break;
                
            case 'merchant':
                if (action < 0.3) {
                    this.moveRandomly();
                } else {
                    this.chat(['Selling items!', 'Best prices!', 'Trade with me!'][Math.floor(Math.random() * 3)]);
                }
                break;
        }
    }
    
    moveRandomly() {
        if (!this.player) return;
        
        const newX = Math.max(0, Math.min(199, this.player.x + (Math.random() - 0.5) * 10));
        const newY = Math.max(0, Math.min(199, this.player.y + (Math.random() - 0.5) * 10));
        
        const movePacket = Buffer.alloc(5);
        movePacket[0] = OPCODES.PLAYER_UPDATE;
        movePacket.writeInt16BE(newX, 1);
        movePacket.writeInt16BE(newY, 3);
        
        this.socket.write(movePacket);
        this.player.x = newX;
        this.player.y = newY;
    }
    
    attackNearbyNPC() {
        const targetId = `npc_${Math.floor(Math.random() * 100)}`;
        
        const attackPacket = Buffer.alloc(37);
        attackPacket[0] = OPCODES.COMBAT_ACTION;
        Buffer.from(targetId).copy(attackPacket, 1, 0, 36);
        
        this.socket.write(attackPacket);
    }
    
    chat(message) {
        const chatPacket = Buffer.alloc(101);
        chatPacket[0] = OPCODES.CHAT_MESSAGE;
        Buffer.from(message).copy(chatPacket, 1, 0, 100);
        
        this.socket.write(chatPacket);
    }
}

// Start the enhanced game system
async function startEnhancedGameSystem() {
    console.log('🎮 STARTING ENHANCED GAME PROTOCOL SYSTEM');
    console.log('=========================================');
    console.log('Next-generation MMO with visual client and AI');
    console.log('');
    
    const server = new EnhancedGameServer(43594, 8899);
    await server.start();
    
    console.log('');
    console.log('🎯 Enhanced Features Active:');
    console.log('  🏰 Guild System with Treasury');
    console.log('  💰 Dynamic Economy with Market');
    console.log('  🏆 Achievement System');
    console.log('  📊 Real-time Leaderboards');
    console.log('  🤖 AI Bots with Different Behaviors');
    console.log('  🎨 Visual HTML5 Client');
    console.log('  ⚡ Optimized Binary Protocol');
    console.log('  📈 Performance Analytics');
}

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down enhanced game system...');
    process.exit(0);
});

// Start the enhanced system
startEnhancedGameSystem().catch(console.error);