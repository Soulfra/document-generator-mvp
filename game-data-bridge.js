#!/usr/bin/env node
// game-data-bridge.js - Real-time bridge between game, data, reasoning, and wiki systems

const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const cors = require('cors');
const crypto = require('crypto');

class GameDataBridge {
    constructor() {
        this.port = 8082;
        this.app = express();
        this.server = http.createServer(this.app);
        
        // WebSocket servers
        this.gameWS = new WebSocket.Server({ noServer: true });
        this.dataWS = new WebSocket.Server({ noServer: true });
        
        // Connected clients
        this.gameClients = new Set();
        this.dataClients = new Set();
        this.dashboardClients = new Set();
        
        // Data streams
        this.eventStream = [];
        this.itemDatabase = new Map();
        this.playerStates = new Map();
        this.lootTables = new Map();
        
        // Reasoning connection
        this.reasoningEndpoint = 'http://localhost:9400';
        
        // Encryption keys (mock)
        this.encryptionKey = crypto.randomBytes(32);
        this.iv = crypto.randomBytes(16);
        
        this.initializeServer();
        this.loadGameData();
        this.connectToSystems();
    }
    
    initializeServer() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // HTTP endpoints
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'operational',
                connections: {
                    game: this.gameClients.size,
                    data: this.dataClients.size,
                    dashboard: this.dashboardClients.size
                },
                events: this.eventStream.length
            });
        });
        
        // Get current game state
        this.app.get('/game/state', (req, res) => {
            res.json({
                players: Array.from(this.playerStates.values()),
                items: Array.from(this.itemDatabase.values()),
                events: this.eventStream.slice(-100)
            });
        });
        
        // Get loot tables
        this.app.get('/game/loot-tables', (req, res) => {
            res.json(Array.from(this.lootTables.entries()));
        });
        
        // Update loot table (dynamic RNG)
        this.app.post('/game/loot-tables/:id', (req, res) => {
            const { id } = req.params;
            const { dropRate, items } = req.body;
            
            this.lootTables.set(id, {
                dropRate,
                items,
                lastModified: Date.now()
            });
            
            res.json({ success: true });
        });
        
        // WebSocket upgrade handling
        this.server.on('upgrade', (request, socket, head) => {
            const pathname = request.url;
            
            if (pathname === '/game') {
                this.gameWS.handleUpgrade(request, socket, head, (ws) => {
                    this.gameWS.emit('connection', ws, request);
                });
            } else if (pathname === '/data') {
                this.dataWS.handleUpgrade(request, socket, head, (ws) => {
                    this.dataWS.emit('connection', ws, request);
                });
            } else {
                socket.destroy();
            }
        });
        
        // Game WebSocket connections
        this.gameWS.on('connection', (ws) => {
            console.log('🎮 New game client connected');
            this.gameClients.add(ws);
            
            ws.on('message', (message) => {
                this.handleGameMessage(ws, message);
            });
            
            ws.on('close', () => {
                this.gameClients.delete(ws);
            });
        });
        
        // Data WebSocket connections
        this.dataWS.on('connection', (ws) => {
            console.log('📊 New data client connected');
            this.dataClients.add(ws);
            
            // Send recent events
            ws.send(JSON.stringify({
                type: 'history',
                events: this.eventStream.slice(-50)
            }));
            
            ws.on('close', () => {
                this.dataClients.delete(ws);
            });
        });
        
        this.server.listen(this.port, () => {
            console.log(`🌉 Game Data Bridge running on port ${this.port}`);
        });
    }
    
    async handleGameMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'player_move':
                    await this.handlePlayerMove(data);
                    break;
                    
                case 'combat':
                    await this.handleCombat(data);
                    break;
                    
                case 'loot_drop':
                    await this.handleLootDrop(data);
                    break;
                    
                case 'item_pickup':
                    await this.handleItemPickup(data);
                    break;
                    
                case 'player_state':
                    this.updatePlayerState(data);
                    break;
                    
                default:
                    console.log('Unknown message type:', data.type);
            }
            
        } catch (error) {
            console.error('Error handling game message:', error);
        }
    }
    
    async handlePlayerMove(data) {
        const event = {
            timestamp: Date.now(),
            type: 'movement',
            actor: data.playerId,
            action: 'move',
            from: data.from,
            to: data.to,
            distance: this.calculateDistance(data.from, data.to)
        };
        
        // Get AI reasoning for movement
        const reasoning = await this.getReasoningForAction(event);
        event.reasoning = reasoning;
        
        // Log event
        this.logEvent(event);
        
        // Broadcast to data clients
        this.broadcastToDataClients(event);
    }
    
    async handleCombat(data) {
        // Calculate damage with RNG
        const baseDamage = data.weapon?.damage || 10;
        const rng = Math.random();
        const criticalHit = rng > 0.9;
        const damage = criticalHit ? baseDamage * 2 : baseDamage + Math.floor(rng * 10);
        
        const event = {
            timestamp: Date.now(),
            type: 'combat',
            actor: data.attacker,
            action: 'attack',
            target: data.target,
            weapon: data.weapon?.name || 'Fists',
            baseDamage,
            actualDamage: damage,
            criticalHit,
            rng: rng.toFixed(4),
            encrypted: this.encrypt(`DMG:${damage}`),
            decrypted: `DMG:${damage}`
        };
        
        // Get AI reasoning
        const reasoning = await this.getReasoningForAction(event);
        event.reasoning = reasoning;
        event.confidence = reasoning?.confidence || 0;
        
        this.logEvent(event);
        this.broadcastToDataClients(event);
    }
    
    async handleLootDrop(data) {
        const lootTable = this.lootTables.get(data.source) || this.getDefaultLootTable();
        const drops = this.calculateLootDrops(lootTable);
        
        for (const drop of drops) {
            const event = {
                timestamp: Date.now(),
                type: 'loot',
                actor: 'System',
                action: 'drop',
                source: data.source,
                item: drop.item,
                quantity: drop.quantity,
                rarity: drop.rarity,
                value: drop.value,
                position: data.position,
                rng: drop.rng,
                dropRate: lootTable.dropRate,
                encrypted: this.encrypt(JSON.stringify(drop)),
                decrypted: drop.item
            };
            
            // Get reasoning for drop
            const reasoning = await this.getReasoningForAction(event);
            event.reasoning = reasoning;
            event.confidence = reasoning?.confidence || 0;
            
            this.logEvent(event);
            this.broadcastToDataClients(event);
            
            // Add to world
            this.addLootToWorld(drop, data.position);
        }
    }
    
    calculateLootDrops(lootTable) {
        const drops = [];
        
        for (const item of lootTable.items) {
            const rng = Math.random();
            
            if (rng <= item.dropChance) {
                const quantity = item.minQuantity + 
                    Math.floor(Math.random() * (item.maxQuantity - item.minQuantity + 1));
                
                drops.push({
                    item: item.name,
                    quantity,
                    rarity: item.rarity,
                    value: item.value * quantity,
                    rng: rng.toFixed(4)
                });
            }
        }
        
        return drops;
    }
    
    async getReasoningForAction(event) {
        try {
            // Query reasoning differential layer
            const response = await fetch(`${this.reasoningEndpoint}/reasoning/differential`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event })
            });
            
            if (response.ok) {
                const reasoning = await response.json();
                return {
                    model: reasoning.model || 'default',
                    confidence: reasoning.confidence || 50,
                    decision: reasoning.decision || 'proceed',
                    reason: reasoning.reason || 'Standard game action',
                    factors: reasoning.factors || []
                };
            }
        } catch (error) {
            console.log('Reasoning service unavailable:', error.message);
        }
        
        // Fallback reasoning
        return {
            model: 'fallback',
            confidence: 75,
            decision: 'proceed',
            reason: 'Default game logic'
        };
    }
    
    encrypt(text) {
        try {
            const cipher = crypto.createCipheriv('aes-256-cbc', this.encryptionKey, this.iv);
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            return encrypted.substring(0, 16) + '...'; // Show partial for UI
        } catch (error) {
            return 'ENC_ERROR';
        }
    }
    
    decrypt(encrypted) {
        try {
            const decipher = crypto.createDecipheriv('aes-256-cbc', this.encryptionKey, this.iv);
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            return 'DEC_ERROR';
        }
    }
    
    logEvent(event) {
        this.eventStream.push(event);
        
        // Keep only last 10000 events
        if (this.eventStream.length > 10000) {
            this.eventStream = this.eventStream.slice(-5000);
        }
        
        // Log to console
        console.log(`📝 Event: ${event.type} - ${event.action} by ${event.actor}`);
    }
    
    broadcastToDataClients(event) {
        const message = JSON.stringify(event);
        
        this.dataClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    updatePlayerState(data) {
        this.playerStates.set(data.playerId, {
            ...data,
            lastUpdate: Date.now()
        });
    }
    
    calculateDistance(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        return Math.sqrt(dx * dx + dy * dy).toFixed(2);
    }
    
    addLootToWorld(loot, position) {
        // This would normally update the game world state
        // For now, just track it
        const lootId = crypto.randomBytes(16).toString('hex');
        this.itemDatabase.set(lootId, {
            ...loot,
            position,
            spawned: Date.now()
        });
    }
    
    loadGameData() {
        // Load default loot tables
        this.lootTables.set('goblin', {
            dropRate: 0.7,
            items: [
                { name: 'Gold', dropChance: 0.9, minQuantity: 1, maxQuantity: 10, value: 1, rarity: 'common' },
                { name: 'Health Potion', dropChance: 0.3, minQuantity: 1, maxQuantity: 1, value: 50, rarity: 'uncommon' },
                { name: 'Iron Sword', dropChance: 0.1, minQuantity: 1, maxQuantity: 1, value: 100, rarity: 'rare' }
            ]
        });
        
        this.lootTables.set('chest', {
            dropRate: 1.0,
            items: [
                { name: 'Gold', dropChance: 1.0, minQuantity: 10, maxQuantity: 50, value: 1, rarity: 'common' },
                { name: 'Magic Ring', dropChance: 0.2, minQuantity: 1, maxQuantity: 1, value: 500, rarity: 'epic' },
                { name: 'Skill Book', dropChance: 0.5, minQuantity: 1, maxQuantity: 1, value: 200, rarity: 'rare' }
            ]
        });
        
        this.lootTables.set('boss', {
            dropRate: 1.0,
            items: [
                { name: 'Gold', dropChance: 1.0, minQuantity: 100, maxQuantity: 500, value: 1, rarity: 'common' },
                { name: 'Legendary Weapon', dropChance: 0.05, minQuantity: 1, maxQuantity: 1, value: 10000, rarity: 'legendary' },
                { name: 'Epic Armor', dropChance: 0.15, minQuantity: 1, maxQuantity: 1, value: 2000, rarity: 'epic' },
                { name: 'Rare Gem', dropChance: 0.3, minQuantity: 1, maxQuantity: 3, value: 300, rarity: 'rare' }
            ]
        });
    }
    
    getDefaultLootTable() {
        return {
            dropRate: 0.5,
            items: [
                { name: 'Gold', dropChance: 0.8, minQuantity: 1, maxQuantity: 5, value: 1, rarity: 'common' }
            ]
        };
    }
    
    async connectToSystems() {
        // Try to connect to reasoning system
        try {
            const response = await fetch(`${this.reasoningEndpoint}/reasoning/upc-depth`);
            if (response.ok) {
                console.log('✅ Connected to Reasoning Differential Layer');
            }
        } catch (error) {
            console.log('⚠️ Reasoning system not available');
        }
        
        // Simulate some test data
        setTimeout(() => {
            this.simulateGameActivity();
        }, 2000);
    }
    
    simulateGameActivity() {
        // Simulate player joining
        this.updatePlayerState({
            playerId: 'player1',
            name: 'TestPlayer',
            level: 1,
            health: 100,
            maxHealth: 100,
            position: { x: 100, y: 100 }
        });
        
        // Simulate some events
        setInterval(() => {
            const eventTypes = ['movement', 'combat', 'loot', 'interaction'];
            const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            
            switch (type) {
                case 'movement':
                    this.handlePlayerMove({
                        playerId: 'player1',
                        from: { x: 100, y: 100 },
                        to: { x: 100 + Math.random() * 50, y: 100 + Math.random() * 50 }
                    });
                    break;
                    
                case 'combat':
                    this.handleCombat({
                        attacker: 'player1',
                        target: 'goblin',
                        weapon: { name: 'Iron Sword', damage: 15 }
                    });
                    break;
                    
                case 'loot':
                    this.handleLootDrop({
                        source: ['goblin', 'chest', 'boss'][Math.floor(Math.random() * 3)],
                        position: { x: Math.random() * 500, y: Math.random() * 500 }
                    });
                    break;
            }
        }, 3000);
    }
}

// Start the bridge
const bridge = new GameDataBridge();

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Game Data Bridge...');
    process.exit(0);
});