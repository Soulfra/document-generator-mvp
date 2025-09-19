#!/usr/bin/env node

/**
 * SIMPLE ITEM REGISTRY
 * Lightweight item management that integrates with character command interface
 * Uses simple HTTP API and can communicate with other services
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class SimpleItemRegistry {
    constructor() {
        this.port = 42006;
        this.characterServiceUrl = 'http://localhost:42004';
        
        // In-memory item storage (production would use database)
        this.items = new Map();
        this.playerInventories = new Map();
        this.itemCategories = new Map();
        
        // Initialize default items
        this.initializeDefaultItems();
        
        // Setup HTTP server
        this.setupServer();
        
        console.log('📦 Simple Item Registry initializing...');
    }
    
    initializeDefaultItems() {
        console.log('🎒 Initializing default items...');
        
        // Item categories from the gaming equipment schema
        this.itemCategories.set('weapon', { icon: '⚔️', description: 'Combat weapons' });
        this.itemCategories.set('armor', { icon: '🛡️', description: 'Protective equipment' });
        this.itemCategories.set('shield', { icon: '🛡️', description: 'Defensive equipment' });
        this.itemCategories.set('accessory', { icon: '💍', description: 'Rings and necklaces' });
        this.itemCategories.set('consumable', { icon: '🧪', description: 'Potions and food' });
        this.itemCategories.set('material', { icon: '🪨', description: 'Crafting materials' });
        
        // Default items
        const defaultItems = [
            { id: 'iron_sword', name: 'Iron Sword', category: 'weapon', icon: '⚔️', value: 50, rarity: 'common' },
            { id: 'steel_shield', name: 'Steel Shield', category: 'shield', icon: '🛡️', value: 100, rarity: 'common' },
            { id: 'health_potion', name: 'Health Potion', category: 'consumable', icon: '🧪', value: 25, rarity: 'common' },
            { id: 'mithril_sword', name: 'Mithril Sword', category: 'weapon', icon: '⚔️', value: 800, rarity: 'rare' },
            { id: 'dragon_shield', name: 'Dragon Shield', category: 'shield', icon: '🛡️', value: 2000, rarity: 'epic' },
            { id: 'tournament_trophy', name: 'Tournament Trophy', category: 'accessory', icon: '🏆', value: 5000, rarity: 'legendary' }
        ];
        
        for (const item of defaultItems) {
            this.items.set(item.id, {
                ...item,
                totalQuantity: 0,
                worldDrops: 0,
                ownersCount: 0,
                createdAt: new Date().toISOString()
            });
        }
        
        console.log(`   📦 Loaded ${defaultItems.length} default items`);
    }
    
    setupServer() {
        this.server = http.createServer((req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.setHeader('Content-Type', 'application/json');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const url = new URL(req.url, `http://localhost:${this.port}`);
            const path = url.pathname;
            const method = req.method;
            
            this.handleRequest(req, res, path, method);
        });
        
        this.server.listen(this.port, () => {
            console.log(`📦 Simple Item Registry running on http://localhost:${this.port}`);
            console.log('📊 Endpoints:');
            console.log(`   • Health: http://localhost:${this.port}/health`);
            console.log(`   • Items: http://localhost:${this.port}/api/items`);
            console.log(`   • Inventory: http://localhost:${this.port}/api/inventory/:playerId`);
            console.log(`   • Give Item: POST http://localhost:${this.port}/api/give`);
            
            // Test connection to character service
            this.testCharacterConnection();
        });
    }
    
    async handleRequest(req, res, path, method) {
        try {
            if (path === '/health') {
                this.sendResponse(res, 200, {
                    status: 'healthy',
                    service: 'simple-item-registry',
                    itemsCount: this.items.size,
                    playersCount: this.playerInventories.size,
                    timestamp: new Date().toISOString()
                });
            } else if (path === '/api/items' && method === 'GET') {
                this.handleGetItems(req, res);
            } else if (path.startsWith('/api/inventory/') && method === 'GET') {
                const playerId = path.split('/').pop();
                this.handleGetInventory(req, res, playerId);
            } else if (path === '/api/give' && method === 'POST') {
                this.handleGiveItem(req, res);
            } else if (path === '/api/tournament-reward' && method === 'POST') {
                this.handleTournamentReward(req, res);
            } else if (path === '/api/character-items' && method === 'POST') {
                this.handleCharacterItems(req, res);
            } else {
                this.sendResponse(res, 404, { error: 'Endpoint not found' });
            }
        } catch (error) {
            console.error('Request error:', error);
            this.sendResponse(res, 500, { error: error.message });
        }
    }
    
    handleGetItems(req, res) {
        const itemsList = Array.from(this.items.values());
        this.sendResponse(res, 200, {
            success: true,
            items: itemsList,
            categories: Object.fromEntries(this.itemCategories)
        });
    }
    
    handleGetInventory(req, res, playerId) {
        const inventory = this.playerInventories.get(playerId) || [];
        this.sendResponse(res, 200, {
            success: true,
            playerId,
            inventory,
            totalItems: inventory.length
        });
    }
    
    async handleGiveItem(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
            try {
                const { playerId, itemId, quantity = 1, reason = 'manual' } = JSON.parse(body);
                
                if (!playerId || !itemId) {
                    this.sendResponse(res, 400, { error: 'playerId and itemId are required' });
                    return;
                }
                
                const item = this.items.get(itemId);
                if (!item) {
                    this.sendResponse(res, 404, { error: 'Item not found' });
                    return;
                }
                
                // Add to player inventory
                if (!this.playerInventories.has(playerId)) {
                    this.playerInventories.set(playerId, []);
                }
                
                const inventory = this.playerInventories.get(playerId);
                const existingItem = inventory.find(i => i.itemId === itemId);
                
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    inventory.push({
                        itemId,
                        name: item.name,
                        icon: item.icon,
                        category: item.category,
                        quantity,
                        receivedAt: new Date().toISOString(),
                        reason
                    });
                }
                
                // Update item statistics
                item.totalQuantity += quantity;
                item.ownersCount = new Set([...Array.from(this.playerInventories.keys())].filter(id => 
                    this.playerInventories.get(id).some(i => i.itemId === itemId)
                )).size;
                
                console.log(`📦 Gave ${quantity}x ${item.name} to player ${playerId} (reason: ${reason})`);
                
                this.sendResponse(res, 200, {
                    success: true,
                    message: `Gave ${quantity}x ${item.name} to player ${playerId}`,
                    item: { itemId, name: item.name, quantity },
                    newInventorySize: inventory.length
                });
                
            } catch (error) {
                this.sendResponse(res, 400, { error: 'Invalid JSON' });
            }
        });
    }
    
    async handleTournamentReward(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { winnerId, tournamentData, rewards } = JSON.parse(body);
                
                console.log(`🏆 Processing tournament rewards for winner: ${winnerId}`);
                console.log(`📊 Tournament data:`, tournamentData);
                
                // Give tournament trophy
                await this.giveItemToPlayer(winnerId, 'tournament_trophy', 1, 'tournament_victory');
                
                // Give additional rewards based on tournament performance
                if (rewards && Array.isArray(rewards)) {
                    for (const reward of rewards) {
                        await this.giveItemToPlayer(winnerId, reward.itemId, reward.quantity, 'tournament_reward');
                    }
                } else {
                    // Default tournament rewards
                    await this.giveItemToPlayer(winnerId, 'mithril_sword', 1, 'tournament_prize');
                    await this.giveItemToPlayer(winnerId, 'health_potion', 5, 'tournament_prize');
                }
                
                this.sendResponse(res, 200, {
                    success: true,
                    message: `Tournament rewards distributed to ${winnerId}`,
                    rewards: this.playerInventories.get(winnerId) || []
                });
                
            } catch (error) {
                this.sendResponse(res, 400, { error: 'Invalid request data' });
            }
        });
    }
    
    async handleCharacterItems(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
            try {
                const { characterId, action, itemData } = JSON.parse(body);
                
                console.log(`🎭 Character ${characterId} action: ${action}`);
                
                let result;
                switch (action) {
                    case 'get_inventory':
                        result = this.playerInventories.get(characterId) || [];
                        break;
                    case 'add_item':
                        result = await this.giveItemToPlayer(characterId, itemData.itemId, itemData.quantity, 'character_action');
                        break;
                    case 'use_item':
                        result = await this.useItem(characterId, itemData.itemId, itemData.quantity);
                        break;
                    default:
                        throw new Error('Unknown action');
                }
                
                this.sendResponse(res, 200, {
                    success: true,
                    characterId,
                    action,
                    result
                });
                
            } catch (error) {
                this.sendResponse(res, 400, { error: error.message });
            }
        });
    }
    
    async giveItemToPlayer(playerId, itemId, quantity, reason) {
        const item = this.items.get(itemId);
        if (!item) throw new Error('Item not found');
        
        if (!this.playerInventories.has(playerId)) {
            this.playerInventories.set(playerId, []);
        }
        
        const inventory = this.playerInventories.get(playerId);
        const existingItem = inventory.find(i => i.itemId === itemId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            inventory.push({
                itemId,
                name: item.name,
                icon: item.icon,
                category: item.category,
                quantity,
                receivedAt: new Date().toISOString(),
                reason
            });
        }
        
        item.totalQuantity += quantity;
        
        return { itemId, name: item.name, quantity, totalInInventory: existingItem ? existingItem.quantity : quantity };
    }
    
    async useItem(playerId, itemId, quantity = 1) {
        const inventory = this.playerInventories.get(playerId);
        if (!inventory) throw new Error('Player has no inventory');
        
        const itemIndex = inventory.findIndex(i => i.itemId === itemId);
        if (itemIndex === -1) throw new Error('Item not in inventory');
        
        const inventoryItem = inventory[itemIndex];
        if (inventoryItem.quantity < quantity) {
            throw new Error('Not enough items');
        }
        
        inventoryItem.quantity -= quantity;
        if (inventoryItem.quantity === 0) {
            inventory.splice(itemIndex, 1);
        }
        
        const item = this.items.get(itemId);
        item.totalQuantity -= quantity;
        
        return { itemId, name: item.name, used: quantity, remaining: inventoryItem.quantity || 0 };
    }
    
    async testCharacterConnection() {
        try {
            console.log('🔗 Testing connection to character service...');
            
            const response = await this.makeHttpRequest(this.characterServiceUrl + '/health');
            if (response.status === 'healthy') {
                console.log('✅ Character service connection successful');
                console.log(`   📊 Active connections: ${response.connections}`);
                console.log(`   🎭 Active sessions: ${response.activeSessions}`);
                
                // Register with character service
                await this.registerWithCharacterService();
            }
        } catch (error) {
            console.log('❌ Character service connection failed:', error.message);
        }
    }
    
    async registerWithCharacterService() {
        console.log('📝 Registering item registry with character service...');
        // In a real implementation, we'd register our endpoints with the character service
        console.log('✅ Item registry available for character interactions');
    }
    
    makeHttpRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: options.headers || {}
            };
            
            const req = http.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch (error) {
                        resolve({ raw: data });
                    }
                });
            });
            
            req.on('error', reject);
            
            if (options.body) {
                req.write(JSON.stringify(options.body));
            }
            
            req.end();
        });
    }
    
    sendResponse(res, statusCode, data) {
        res.writeHead(statusCode);
        res.end(JSON.stringify(data, null, 2));
    }
    
    shutdown() {
        console.log('📦 Simple Item Registry shutting down...');
        if (this.server) {
            this.server.close();
        }
    }
}

// Start the service
const itemRegistry = new SimpleItemRegistry();

// Handle shutdown
process.on('SIGINT', () => {
    itemRegistry.shutdown();
    process.exit(0);
});

module.exports = SimpleItemRegistry;