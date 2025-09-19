#!/usr/bin/env node

// 🏪⚡ GRAND EXCHANGE COLLAR SYSTEM
// Captures, tracks, and collars all trading activity, collection logs, and achievements
// Creates the foundational "Soul of Soulfra" - the core identity achievement system

const express = require('express');
const WebSocket = require('ws');
const fs = require('fs');
const crypto = require('crypto');

class GrandExchangeCollar {
    constructor() {
        this.app = express();
        this.port = 9600;
        this.wsPort = 9601;
        
        // Core data structures
        this.tradingHistory = new Map();
        this.collectionLogs = new Map();
        this.soulfraSouls = new Map();
        this.exchangeData = new Map();
        this.achievementRegistry = new Map();
        
        // Grand Exchange item categories
        this.itemCategories = {
            'weapons': { multiplier: 1.5, soulValue: 10 },
            'armor': { multiplier: 1.3, soulValue: 8 },
            'resources': { multiplier: 1.0, soulValue: 3 },
            'consumables': { multiplier: 0.8, soulValue: 2 },
            'rare_items': { multiplier: 3.0, soulValue: 25 },
            'quest_items': { multiplier: 2.0, soulValue: 15 },
            'cosmetics': { multiplier: 1.2, soulValue: 5 },
            'tools': { multiplier: 1.1, soulValue: 4 }
        };
        
        // Soulfra achievement types
        this.achievementTypes = {
            'first_trade': { soulReward: 50, tierBonus: 5, description: 'First Grand Exchange trade' },
            'trade_master': { soulReward: 200, tierBonus: 15, description: '1000 successful trades' },
            'collection_hunter': { soulReward: 300, tierBonus: 20, description: '500 unique items collected' },
            'profit_king': { soulReward: 500, tierBonus: 25, description: '1M GP profit from trading' },
            'rare_collector': { soulReward: 750, tierBonus: 30, description: 'Obtained 50 rare items' },
            'soul_pioneer': { soulReward: 1000, tierBonus: 50, description: 'First Soul of Soulfra created' }
        };
        
        // WebSocket connections
        this.wsConnections = new Set();
        
        console.log('🏪⚡ Grand Exchange Collar initializing...');
        this.initializeGrandExchangeCollar();
    }
    
    async initializeGrandExchangeCollar() {
        console.log('🚀 Setting up Grand Exchange capture system...');
        
        // Initialize mock RuneScape Grand Exchange data
        await this.initializeMockGrandExchange();
        
        // Setup Collection Log system
        await this.initializeCollectionLogSystem();
        
        // Create the first Soul of Soulfra
        await this.createFirstSoulOfSoulfra();
        
        // Setup WebSocket for real-time updates
        this.setupWebSocketServer();
        
        // Setup web routes
        this.setupGrandExchangeRoutes();
        
        console.log('✅ Grand Exchange Collar system ready');
    }
    
    async initializeMockGrandExchange() {
        console.log('🏪 Initializing Grand Exchange data...');
        
        // Mock Grand Exchange items (simulating RuneScape items)
        const mockItems = [
            // Weapons
            { id: 1, name: 'Abyssal Whip', category: 'weapons', price: 2500000, volume: 1500 },
            { id: 2, name: 'Dragon Scimitar', category: 'weapons', price: 100000, volume: 5000 },
            { id: 3, name: 'Godsword Shard', category: 'weapons', price: 15000000, volume: 50 },
            
            // Armor
            { id: 4, name: 'Bandos Chestplate', category: 'armor', price: 20000000, volume: 200 },
            { id: 5, name: 'Dragon Platebody', category: 'armor', price: 500000, volume: 800 },
            
            // Resources
            { id: 6, name: 'Runite Ore', category: 'resources', price: 12000, volume: 10000 },
            { id: 7, name: 'Magic Logs', category: 'resources', price: 1500, volume: 25000 },
            { id: 8, name: 'Shark', category: 'consumables', price: 800, volume: 50000 },
            
            // Rare Items
            { id: 9, name: 'Third Age Longsword', category: 'rare_items', price: 1000000000, volume: 1 },
            { id: 10, name: 'Santa Hat', category: 'rare_items', price: 500000000, volume: 5 },
            { id: 11, name: 'Party Hat Set', category: 'rare_items', price: 2000000000, volume: 2 },
            
            // Quest Items
            { id: 12, name: 'Fire Cape', category: 'quest_items', price: 0, volume: 0 }, // Untradeable
            { id: 13, name: 'Quest Point Cape', category: 'quest_items', price: 0, volume: 0 },
            
            // Tools
            { id: 14, name: 'Dragon Pickaxe', category: 'tools', price: 8000000, volume: 300 },
            { id: 15, name: 'Crystal Hatchet', category: 'tools', price: 1200000, volume: 150 }
        ];
        
        // Store items in exchange data
        for (const item of mockItems) {
            this.exchangeData.set(item.id, {
                ...item,
                priceHistory: this.generatePriceHistory(item.price),
                lastUpdated: Date.now(),
                tradingActivity: this.generateTradingActivity()
            });
        }
        
        console.log(`✅ Initialized ${mockItems.length} Grand Exchange items`);
    }
    
    generatePriceHistory(basePrice) {
        const history = [];
        let currentPrice = basePrice;
        
        // Generate 30 days of price history
        for (let i = 30; i >= 0; i--) {
            const variance = (Math.random() - 0.5) * 0.1; // ±10% variance
            currentPrice = Math.floor(currentPrice * (1 + variance));
            
            history.push({
                date: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)),
                price: currentPrice,
                volume: Math.floor(Math.random() * 1000) + 100
            });
        }
        
        return history;
    }
    
    generateTradingActivity() {
        return {
            buyOffers: Math.floor(Math.random() * 500) + 50,
            sellOffers: Math.floor(Math.random() * 500) + 50,
            avgBuyPrice: 0,
            avgSellPrice: 0,
            lastTrade: Date.now() - Math.floor(Math.random() * 3600000) // Random time within last hour
        };
    }
    
    async initializeCollectionLogSystem() {
        console.log('📋 Initializing Collection Log system...');
        
        // Collection log categories
        const collectionCategories = {
            'bosses': {
                name: 'Boss Collection',
                items: ['Abyssal Whip', 'Godsword Shard', 'Dragon Chainbody'],
                soulMultiplier: 2.0
            },
            'skilling': {
                name: 'Skilling Collection', 
                items: ['Runite Ore', 'Magic Logs', 'Raw Shark'],
                soulMultiplier: 1.2
            },
            'rare_drops': {
                name: 'Rare Drops',
                items: ['Third Age Longsword', 'Santa Hat', 'Party Hat Set'],
                soulMultiplier: 5.0
            },
            'quest_rewards': {
                name: 'Quest Rewards',
                items: ['Fire Cape', 'Quest Point Cape', 'Barrows Gloves'],
                soulMultiplier: 3.0
            },
            'achievement_diaries': {
                name: 'Achievement Diaries',
                items: ['Varrock Armor 4', 'Morytania Legs 4', 'Desert Amulet 4'],
                soulMultiplier: 2.5
            }
        };
        
        // Store collection categories
        for (const [categoryId, category] of Object.entries(collectionCategories)) {
            this.achievementRegistry.set(categoryId, {
                ...category,
                completionRewards: {
                    soulValue: category.items.length * 10 * category.soulMultiplier,
                    tierBonus: Math.floor(category.items.length / 2),
                    specialReward: `Master of ${category.name}`
                }
            });
        }
        
        console.log(`✅ Collection Log system ready with ${Object.keys(collectionCategories).length} categories`);
    }
    
    async createFirstSoulOfSoulfra() {
        console.log('👤 Creating the first Soul of Soulfra...');
        
        const firstSoul = {
            soulId: crypto.randomUUID(),
            name: 'Genesis Soul',
            type: 'founder',
            createdAt: Date.now(),
            achievements: [],
            stats: {
                totalTrades: 0,
                totalProfit: 0,
                uniqueItems: 0,
                collectionLogSlots: 0,
                soulPower: 1000, // Starting soul power
                tierLevel: 1,
                reputation: 'Soul Pioneer'
            },
            inventory: {
                items: [],
                gp: 10000000, // Starting GP
                capacity: 28
            },
            collectionLog: {
                totalSlots: 0,
                completedCategories: [],
                rareFinds: [],
                firstAchievements: []
            },
            tradingHistory: [],
            soulSignature: this.generateSoulSignature('Genesis Soul'),
            specialAbilities: [
                'Exchange Sight - Can see all Grand Exchange data',
                'Collection Instinct - Detects rare items nearby', 
                'Trading Mastery - Reduced Grand Exchange fees',
                'Soul Resonance - Can create derivative souls'
            ]
        };
        
        // Award the soul pioneer achievement
        firstSoul.achievements.push({
            id: 'soul_pioneer',
            name: 'Soul Pioneer',
            description: 'Created the first Soul of Soulfra',
            earnedAt: Date.now(),
            soulReward: 1000,
            tierBonus: 50,
            rarity: 'legendary'
        });
        
        // Store the first soul
        this.soulfraSouls.set(firstSoul.soulId, firstSoul);
        
        console.log(`✅ First Soul of Soulfra created: ${firstSoul.soulId}`);
        console.log(`👤 Soul Name: ${firstSoul.name}`);
        console.log(`⚡ Soul Power: ${firstSoul.stats.soulPower}`);
        console.log(`🏆 Starting Achievement: ${firstSoul.achievements[0].name}`);
        
        return firstSoul;
    }
    
    generateSoulSignature(soulName) {
        const content = `${soulName}-${Date.now()}-${Math.random()}`;
        return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    }
    
    async collarTradingData(userId, tradeData) {
        console.log(`🔗 Collaring trading data for user: ${userId}`);
        
        // Initialize user trading history if not exists
        if (!this.tradingHistory.has(userId)) {
            this.tradingHistory.set(userId, []);
        }
        
        // Create trade record
        const tradeRecord = {
            tradeId: crypto.randomUUID(),
            userId,
            itemId: tradeData.itemId,
            itemName: tradeData.itemName,
            quantity: tradeData.quantity,
            pricePerItem: tradeData.pricePerItem,
            totalValue: tradeData.quantity * tradeData.pricePerItem,
            tradeType: tradeData.tradeType, // 'buy' or 'sell'
            timestamp: Date.now(),
            geSlot: tradeData.geSlot || 1,
            completed: tradeData.completed || false,
            profit: tradeData.profit || 0
        };
        
        // Add to user's trading history
        this.tradingHistory.get(userId).push(tradeRecord);
        
        // Update user's soul if they have one
        await this.updateSoulFromTrade(userId, tradeRecord);
        
        // Check for achievements
        await this.checkTradingAchievements(userId, tradeRecord);
        
        // Broadcast update to connected clients
        this.broadcastUpdate({
            type: 'trade_collared',
            userId,
            trade: tradeRecord
        });
        
        console.log(`✅ Trade collared: ${tradeRecord.itemName} x${tradeRecord.quantity}`);
        return tradeRecord;
    }
    
    async updateSoulFromTrade(userId, tradeRecord) {
        // Find user's soul
        const userSoul = Array.from(this.soulfraSouls.values())
            .find(soul => soul.userId === userId);
        
        if (!userSoul) return;
        
        // Update soul stats
        userSoul.stats.totalTrades++;
        userSoul.stats.totalProfit += tradeRecord.profit;
        
        // Add to trading history
        userSoul.tradingHistory.push({
            itemName: tradeRecord.itemName,
            profit: tradeRecord.profit,
            timestamp: tradeRecord.timestamp
        });
        
        // Keep only last 100 trades in soul
        if (userSoul.tradingHistory.length > 100) {
            userSoul.tradingHistory = userSoul.tradingHistory.slice(-100);
        }
        
        // Update soul power based on trading performance
        const powerGain = Math.floor(Math.abs(tradeRecord.profit) / 1000);
        userSoul.stats.soulPower += powerGain;
        
        console.log(`⚡ Soul power increased by ${powerGain} for ${userSoul.name}`);
    }
    
    async collarCollectionLogEntry(userId, itemData) {
        console.log(`📋 Collaring collection log entry for user: ${userId}`);
        
        // Initialize user collection log if not exists
        if (!this.collectionLogs.has(userId)) {
            this.collectionLogs.set(userId, {
                totalEntries: 0,
                categories: new Map(),
                recentEntries: [],
                milestones: []
            });
        }
        
        const userLog = this.collectionLogs.get(userId);
        
        // Create collection log entry
        const logEntry = {
            entryId: crypto.randomUUID(),
            itemId: itemData.itemId,
            itemName: itemData.itemName,
            category: itemData.category,
            rarity: itemData.rarity || 'common',
            source: itemData.source, // boss, skill, quest, etc.
            timestamp: Date.now(),
            killCount: itemData.killCount || null,
            dropRate: itemData.dropRate || null,
            soulValue: this.calculateItemSoulValue(itemData)
        };
        
        // Add to user's collection log
        if (!userLog.categories.has(itemData.category)) {
            userLog.categories.set(itemData.category, []);
        }
        
        userLog.categories.get(itemData.category).push(logEntry);
        userLog.totalEntries++;
        userLog.recentEntries.unshift(logEntry);
        
        // Keep only last 50 recent entries
        if (userLog.recentEntries.length > 50) {
            userLog.recentEntries = userLog.recentEntries.slice(0, 50);
        }
        
        // Update user's soul
        await this.updateSoulFromCollection(userId, logEntry);
        
        // Check for collection achievements
        await this.checkCollectionAchievements(userId, logEntry);
        
        // Broadcast update
        this.broadcastUpdate({
            type: 'collection_entry',
            userId,
            entry: logEntry
        });
        
        console.log(`✅ Collection entry collared: ${logEntry.itemName} (${logEntry.rarity})`);
        return logEntry;
    }
    
    async updateSoulFromCollection(userId, logEntry) {
        const userSoul = Array.from(this.soulfraSouls.values())
            .find(soul => soul.userId === userId);
        
        if (!userSoul) return;
        
        // Update collection log stats
        userSoul.stats.uniqueItems++;
        userSoul.stats.collectionLogSlots++;
        userSoul.stats.soulPower += logEntry.soulValue;
        
        // Add to collection log
        userSoul.collectionLog.totalSlots++;
        
        // Check if this is a rare find
        if (logEntry.rarity === 'rare' || logEntry.rarity === 'very_rare') {
            userSoul.collectionLog.rareFinds.push({
                itemName: logEntry.itemName,
                rarity: logEntry.rarity,
                timestamp: logEntry.timestamp
            });
        }
        
        console.log(`📋 Soul collection updated: +${logEntry.soulValue} soul power`);
    }
    
    calculateItemSoulValue(itemData) {
        let baseValue = 5; // Base soul value
        
        // Rarity multipliers
        const rarityMultipliers = {
            'common': 1,
            'uncommon': 2,
            'rare': 5,
            'very_rare': 10,
            'legendary': 25
        };
        
        baseValue *= rarityMultipliers[itemData.rarity] || 1;
        
        // Category multipliers
        const category = this.achievementRegistry.get(itemData.category);
        if (category && category.soulMultiplier) {
            baseValue *= category.soulMultiplier;
        }
        
        return Math.floor(baseValue);
    }
    
    async checkTradingAchievements(userId, tradeRecord) {
        const userTrades = this.tradingHistory.get(userId) || [];
        const userSoul = Array.from(this.soulfraSouls.values())
            .find(soul => soul.userId === userId);
        
        if (!userSoul) return;
        
        // Check first trade achievement
        if (userTrades.length === 1) {
            await this.awardAchievement(userId, 'first_trade');
        }
        
        // Check trade master achievement
        if (userTrades.length === 1000) {
            await this.awardAchievement(userId, 'trade_master');
        }
        
        // Check profit king achievement
        const totalProfit = userTrades.reduce((sum, trade) => sum + trade.profit, 0);
        if (totalProfit >= 1000000 && !userSoul.achievements.find(a => a.id === 'profit_king')) {
            await this.awardAchievement(userId, 'profit_king');
        }
    }
    
    async checkCollectionAchievements(userId, logEntry) {
        const userLog = this.collectionLogs.get(userId);
        const userSoul = Array.from(this.soulfraSouls.values())
            .find(soul => soul.userId === userId);
        
        if (!userSoul || !userLog) return;
        
        // Check collection hunter achievement
        if (userLog.totalEntries === 500) {
            await this.awardAchievement(userId, 'collection_hunter');
        }
        
        // Check rare collector achievement
        const rareItems = userSoul.collectionLog.rareFinds.length;
        if (rareItems === 50) {
            await this.awardAchievement(userId, 'rare_collector');
        }
    }
    
    async awardAchievement(userId, achievementId) {
        const achievement = this.achievementTypes[achievementId];
        if (!achievement) return;
        
        const userSoul = Array.from(this.soulfraSouls.values())
            .find(soul => soul.userId === userId);
        
        if (!userSoul) return;
        
        // Check if already awarded
        if (userSoul.achievements.find(a => a.id === achievementId)) return;
        
        // Award achievement
        const awardedAchievement = {
            id: achievementId,
            name: achievement.description,
            description: achievement.description,
            earnedAt: Date.now(),
            soulReward: achievement.soulReward,
            tierBonus: achievement.tierBonus,
            rarity: 'epic'
        };
        
        userSoul.achievements.push(awardedAchievement);
        userSoul.stats.soulPower += achievement.soulReward;
        userSoul.stats.tierLevel += achievement.tierBonus;
        
        // Broadcast achievement
        this.broadcastUpdate({
            type: 'achievement_earned',
            userId,
            achievement: awardedAchievement
        });
        
        console.log(`🏆 Achievement awarded: ${achievement.description} (+${achievement.soulReward} soul power)`);
    }
    
    setupWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🔗 Grand Exchange client connected');
            this.wsConnections.add(ws);
            
            // Send initial data
            ws.send(JSON.stringify({
                type: 'init',
                exchangeItems: Array.from(this.exchangeData.values()),
                totalSouls: this.soulfraSouls.size
            }));
            
            ws.on('close', () => {
                this.wsConnections.delete(ws);
                console.log('❌ Grand Exchange client disconnected');
            });
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleClientMessage(data, ws);
                } catch (error) {
                    console.error('🚨 WebSocket message error:', error);
                }
            });
        });
        
        console.log(`🌐 Grand Exchange WebSocket server running on ws://localhost:${this.wsPort}`);
    }
    
    handleClientMessage(message, ws) {
        switch (message.type) {
            case 'collar_trade':
                this.collarTradingData(message.userId, message.tradeData);
                break;
                
            case 'collar_collection':
                this.collarCollectionLogEntry(message.userId, message.itemData);
                break;
                
            case 'create_soul':
                this.createUserSoul(message.userId, message.soulData);
                break;
                
            case 'get_soul_status':
                this.getSoulStatus(message.userId, ws);
                break;
        }
    }
    
    broadcastUpdate(message) {
        const messageStr = JSON.stringify(message);
        this.wsConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        });
    }
    
    setupGrandExchangeRoutes() {
        this.app.use(express.json());
        this.app.use(express.static(__dirname));
        
        // Main Grand Exchange interface
        this.app.get('/', (req, res) => {
            res.send(this.renderGrandExchangeInterface());
        });
        
        // Get Grand Exchange data
        this.app.get('/api/ge/items', (req, res) => {
            const items = Array.from(this.exchangeData.values());
            res.json({
                items,
                totalItems: items.length,
                lastUpdated: Date.now()
            });
        });
        
        // Collar a trade
        this.app.post('/api/ge/collar-trade', async (req, res) => {
            try {
                const { userId, tradeData } = req.body;
                const tradeRecord = await this.collarTradingData(userId, tradeData);
                
                res.json({
                    success: true,
                    trade: tradeRecord,
                    message: 'Trade successfully collared'
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Collar collection log entry
        this.app.post('/api/collection/collar-entry', async (req, res) => {
            try {
                const { userId, itemData } = req.body;
                const logEntry = await this.collarCollectionLogEntry(userId, itemData);
                
                res.json({
                    success: true,
                    entry: logEntry,
                    message: 'Collection entry successfully collared'
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Get user's soul
        this.app.get('/api/soul/:userId', (req, res) => {
            const { userId } = req.params;
            const userSoul = Array.from(this.soulfraSouls.values())
                .find(soul => soul.userId === userId);
            
            if (!userSoul) {
                return res.status(404).json({
                    success: false,
                    message: 'Soul not found'
                });
            }
            
            res.json({
                success: true,
                soul: userSoul
            });
        });
        
        // Create new soul
        this.app.post('/api/soul/create', async (req, res) => {
            try {
                const { userId, soulName } = req.body;
                const newSoul = await this.createUserSoul(userId, { name: soulName });
                
                res.json({
                    success: true,
                    soul: newSoul,
                    message: 'Soul of Soulfra created successfully'
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Get all souls (leaderboard)
        this.app.get('/api/souls/leaderboard', (req, res) => {
            const souls = Array.from(this.soulfraSouls.values())
                .sort((a, b) => b.stats.soulPower - a.stats.soulPower)
                .slice(0, 100);
            
            res.json({
                souls: souls.map(soul => ({
                    name: soul.name,
                    soulPower: soul.stats.soulPower,
                    tierLevel: soul.stats.tierLevel,
                    totalTrades: soul.stats.totalTrades,
                    achievements: soul.achievements.length
                })),
                totalSouls: this.soulfraSouls.size
            });
        });
        
        // Get system stats
        this.app.get('/api/stats', (req, res) => {
            const totalTrades = Array.from(this.tradingHistory.values())
                .reduce((sum, trades) => sum + trades.length, 0);
            
            const totalCollectionEntries = Array.from(this.collectionLogs.values())
                .reduce((sum, log) => sum + log.totalEntries, 0);
            
            res.json({
                totalSouls: this.soulfraSouls.size,
                totalTrades,
                totalCollectionEntries,
                totalItems: this.exchangeData.size,
                systemUptime: Date.now()
            });
        });
    }
    
    async createUserSoul(userId, soulData) {
        const newSoul = {
            soulId: crypto.randomUUID(),
            userId,
            name: soulData.name || `Soul of ${userId}`,
            type: 'player',
            createdAt: Date.now(),
            achievements: [],
            stats: {
                totalTrades: 0,
                totalProfit: 0,
                uniqueItems: 0,
                collectionLogSlots: 0,
                soulPower: 100, // Starting soul power
                tierLevel: 1,
                reputation: 'Novice Trader'
            },
            inventory: {
                items: [],
                gp: 1000000, // Starting GP
                capacity: 28
            },
            collectionLog: {
                totalSlots: 0,
                completedCategories: [],
                rareFinds: [],
                firstAchievements: []
            },
            tradingHistory: [],
            soulSignature: this.generateSoulSignature(soulData.name || userId),
            specialAbilities: []
        };
        
        this.soulfraSouls.set(newSoul.soulId, newSoul);
        
        console.log(`👤 New Soul of Soulfra created: ${newSoul.name}`);
        return newSoul;
    }
    
    renderGrandExchangeInterface() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🏪⚡ Grand Exchange Collar - Soul of Soulfra</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #2a1810 0%, #1a3a1a 50%, #1a1a3a 100%);
            color: #ffaa00;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .ge-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            grid-template-rows: auto auto 1fr 1fr;
            gap: 20px;
            min-height: 100vh;
        }
        
        .header {
            grid-column: 1 / -1;
            text-align: center;
            background: rgba(255, 170, 0, 0.1);
            border: 2px solid #ffaa00;
            border-radius: 15px;
            padding: 20px;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255, 170, 0, 0.3), transparent);
            animation: goldScan 4s linear infinite;
        }
        
        @keyframes goldScan {
            0% { left: -100%; }
            100% { left: 100%; }
        }
        
        .ge-panel {
            background: rgba(255, 170, 0, 0.1);
            border: 2px solid #cc8800;
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
            position: relative;
        }
        
        .soul-stats {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .stat-card {
            background: rgba(0, 0, 0, 0.4);
            padding: 15px;
            border-radius: 10px;
            border-left: 4px solid #ffaa00;
            text-align: center;
        }
        
        .stat-number {
            font-size: 24px;
            font-weight: bold;
            color: #ff6600;
        }
        
        .item-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .item-card {
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            border-radius: 8px;
            border: 1px solid #ffaa00;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .item-card:hover {
            border-color: #ff6600;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 170, 0, 0.3);
        }
        
        .item-price {
            color: #00ff00;
            font-weight: bold;
        }
        
        .rare-item {
            border-color: #ff0080;
            background: rgba(255, 0, 128, 0.1);
        }
        
        .trading-form {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        
        input, select, button {
            background: rgba(255, 170, 0, 0.1);
            border: 1px solid #ffaa00;
            color: #ffaa00;
            padding: 10px;
            border-radius: 8px;
            font-family: inherit;
        }
        
        button {
            background: linear-gradient(45deg, #ffaa00, #ff6600);
            color: white;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(255, 170, 0, 0.4);
        }
        
        .achievement-list {
            max-height: 200px;
            overflow-y: auto;
        }
        
        .achievement-item {
            background: rgba(0, 0, 0, 0.3);
            padding: 10px;
            margin: 5px 0;
            border-radius: 8px;
            border-left: 4px solid #ff6600;
        }
        
        .achievement-item.legendary {
            border-left-color: #ff0080;
            background: rgba(255, 0, 128, 0.1);
        }
        
        .collection-log {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 5px;
        }
        
        .collection-slot {
            width: 40px;
            height: 40px;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #666;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
        }
        
        .collection-slot.filled {
            background: rgba(255, 170, 0, 0.3);
            border-color: #ffaa00;
        }
        
        .collection-slot.rare {
            background: rgba(255, 0, 128, 0.3);
            border-color: #ff0080;
        }
        
        .soul-power-bar {
            width: 100%;
            height: 20px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .soul-power-fill {
            height: 100%;
            background: linear-gradient(90deg, #ffaa00, #ff6600);
            transition: width 0.5s ease;
        }
        
        .real-time-feed {
            max-height: 200px;
            overflow-y: auto;
            font-size: 12px;
        }
        
        .feed-item {
            padding: 5px;
            margin: 2px 0;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 3px;
        }
        
        .feed-item.trade {
            border-left: 3px solid #00ff00;
        }
        
        .feed-item.collection {
            border-left: 3px solid #0088ff;
        }
        
        .feed-item.achievement {
            border-left: 3px solid #ff6600;
        }
        
        @media (max-width: 768px) {
            .ge-container {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="ge-container">
        <div class="header">
            <h1>🏪⚡ Grand Exchange Collar</h1>
            <h2>👤 Soul of Soulfra System</h2>
            <p>Capture, track, and collar all your RuneScape trading and collection activities</p>
        </div>
        
        <div class="ge-panel soul-stats">
            <div class="stat-card">
                <div class="stat-number" id="totalSouls">1</div>
                <div>Total Souls</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="totalTrades">0</div>
                <div>Trades Collared</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="totalItems">15</div>
                <div>GE Items</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" id="collectionEntries">0</div>
                <div>Collection Entries</div>
            </div>
        </div>
        
        <div class="ge-panel">
            <h2>🏪 Grand Exchange Items</h2>
            <div class="item-grid" id="itemGrid">
                <!-- Populated by JavaScript -->
            </div>
        </div>
        
        <div class="ge-panel">
            <h2>⚡ Collar Trading Activity</h2>
            <div class="trading-form">
                <input type="text" id="userId" placeholder="User ID" value="test_user">
                <select id="tradeItem">
                    <option value="">Select Item...</option>
                </select>
                <input type="number" id="quantity" placeholder="Quantity" value="1">
                <input type="number" id="pricePerItem" placeholder="Price per Item">
                <select id="tradeType">
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                </select>
                <button onclick="collarTrade()">🔗 Collar Trade</button>
            </div>
            
            <div id="tradeResult" style="margin-top: 15px; display: none;">
                <!-- Trade results -->
            </div>
        </div>
        
        <div class="ge-panel">
            <h2>📋 Collection Log System</h2>
            <div class="trading-form">
                <input type="text" id="collectionUserId" placeholder="User ID" value="test_user">
                <input type="text" id="itemName" placeholder="Item Name">
                <select id="itemCategory">
                    <option value="bosses">Boss Drop</option>
                    <option value="skilling">Skilling</option>
                    <option value="rare_drops">Rare Drop</option>
                    <option value="quest_rewards">Quest Reward</option>
                </select>
                <select id="itemRarity">
                    <option value="common">Common</option>
                    <option value="uncommon">Uncommon</option>
                    <option value="rare">Rare</option>
                    <option value="very_rare">Very Rare</option>
                    <option value="legendary">Legendary</option>
                </select>
                <button onclick="collarCollection()">📋 Collar Collection Entry</button>
            </div>
        </div>
        
        <div class="ge-panel">
            <h2>👤 Soul Status</h2>
            <div id="soulStatus">
                <div><strong>Genesis Soul</strong></div>
                <div>Soul Power: <span id="soulPower">1000</span></div>
                <div class="soul-power-bar">
                    <div class="soul-power-fill" id="soulPowerBar" style="width: 50%"></div>
                </div>
                <div>Tier Level: <span id="tierLevel">1</span></div>
                <div>Achievements: <span id="achievementCount">1</span></div>
                <button onclick="createSoul()">👤 Create New Soul</button>
            </div>
        </div>
        
        <div class="ge-panel">
            <h2>🏆 Recent Achievements</h2>
            <div class="achievement-list" id="achievementList">
                <div class="achievement-item legendary">
                    <strong>Soul Pioneer</strong><br>
                    <small>Created the first Soul of Soulfra</small><br>
                    <small>+1000 Soul Power, +50 Tier Bonus</small>
                </div>
            </div>
        </div>
        
        <div class="ge-panel">
            <h2>📊 Real-time Feed</h2>
            <div class="real-time-feed" id="realTimeFeed">
                <div class="feed-item">System initialized - Ready to collar activities</div>
            </div>
        </div>
    </div>
    
    <script>
        let ws;
        let geItems = [];
        let currentSoul = null;
        
        // Initialize interface
        document.addEventListener('DOMContentLoaded', function() {
            initWebSocket();
            loadGrandExchangeItems();
            loadSystemStats();
        });
        
        function initWebSocket() {
            ws = new WebSocket('ws://localhost:${this.wsPort}');
            
            ws.onopen = function() {
                console.log('🔗 Connected to Grand Exchange Collar');
                addFeedItem('Connected to Grand Exchange Collar system', 'system');
            };
            
            ws.onmessage = function(event) {
                const message = JSON.parse(event.data);
                handleRealtimeUpdate(message);
            };
            
            ws.onclose = function() {
                console.log('❌ Disconnected from Grand Exchange Collar');
                setTimeout(initWebSocket, 3000); // Reconnect
            };
        }
        
        function handleRealtimeUpdate(message) {
            switch (message.type) {
                case 'init':
                    geItems = message.exchangeItems;
                    updateItemGrid();
                    updateItemSelect();
                    break;
                    
                case 'trade_collared':
                    addFeedItem(\`Trade collared: \${message.trade.itemName} x\${message.trade.quantity}\`, 'trade');
                    updateStats();
                    break;
                    
                case 'collection_entry':
                    addFeedItem(\`Collection entry: \${message.entry.itemName} (\${message.entry.rarity})\`, 'collection');
                    updateStats();
                    break;
                    
                case 'achievement_earned':
                    addFeedItem(\`Achievement earned: \${message.achievement.name}\`, 'achievement');
                    updateAchievements();
                    break;
            }
        }
        
        async function loadGrandExchangeItems() {
            try {
                const response = await fetch('/api/ge/items');
                const data = await response.json();
                geItems = data.items;
                updateItemGrid();
                updateItemSelect();
            } catch (error) {
                console.error('Failed to load GE items:', error);
            }
        }
        
        function updateItemGrid() {
            const grid = document.getElementById('itemGrid');
            
            grid.innerHTML = geItems.slice(0, 12).map(item => \`
                <div class="item-card \${item.category === 'rare_items' ? 'rare-item' : ''}" 
                     onclick="selectItem('\${item.id}', '\${item.name}', \${item.price})">
                    <div><strong>\${item.name}</strong></div>
                    <div class="item-price">\${item.price.toLocaleString()} gp</div>
                    <small>\${item.category}</small>
                </div>
            \`).join('');
        }
        
        function updateItemSelect() {
            const select = document.getElementById('tradeItem');
            
            select.innerHTML = '<option value="">Select Item...</option>' + 
                geItems.map(item => \`
                    <option value="\${item.id}" data-name="\${item.name}" data-price="\${item.price}">
                        \${item.name} - \${item.price.toLocaleString()} gp
                    </option>
                \`).join('');
        }
        
        function selectItem(id, name, price) {
            document.getElementById('tradeItem').value = id;
            document.getElementById('pricePerItem').value = price;
        }
        
        async function collarTrade() {
            const userId = document.getElementById('userId').value;
            const itemSelect = document.getElementById('tradeItem');
            const selectedOption = itemSelect.options[itemSelect.selectedIndex];
            
            if (!selectedOption.value) {
                alert('Please select an item');
                return;
            }
            
            const tradeData = {
                itemId: parseInt(selectedOption.value),
                itemName: selectedOption.dataset.name,
                quantity: parseInt(document.getElementById('quantity').value),
                pricePerItem: parseInt(document.getElementById('pricePerItem').value),
                tradeType: document.getElementById('tradeType').value,
                completed: true,
                profit: Math.floor(Math.random() * 100000) - 50000 // Random profit/loss
            };
            
            try {
                const response = await fetch('/api/ge/collar-trade', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, tradeData })
                });
                
                const result = await response.json();
                
                document.getElementById('tradeResult').innerHTML = \`
                    <div style="background: rgba(0, 255, 0, 0.1); padding: 10px; border-radius: 5px;">
                        ✅ Trade Collared Successfully<br>
                        <strong>\${result.trade.itemName}</strong> x\${result.trade.quantity}<br>
                        Total Value: \${result.trade.totalValue.toLocaleString()} gp<br>
                        Profit: \${result.trade.profit.toLocaleString()} gp
                    </div>
                \`;
                document.getElementById('tradeResult').style.display = 'block';
                
            } catch (error) {
                console.error('Failed to collar trade:', error);
            }
        }
        
        async function collarCollection() {
            const userId = document.getElementById('collectionUserId').value;
            const itemData = {
                itemId: Math.floor(Math.random() * 1000),
                itemName: document.getElementById('itemName').value,
                category: document.getElementById('itemCategory').value,
                rarity: document.getElementById('itemRarity').value,
                source: 'manual_entry'
            };
            
            try {
                const response = await fetch('/api/collection/collar-entry', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, itemData })
                });
                
                const result = await response.json();
                
                addFeedItem(\`Collection entry collared: \${result.entry.itemName}\`, 'collection');
                
            } catch (error) {
                console.error('Failed to collar collection entry:', error);
            }
        }
        
        async function createSoul() {
            const soulName = prompt('Enter soul name:');
            if (!soulName) return;
            
            try {
                const response = await fetch('/api/soul/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        userId: 'test_user', 
                        soulName 
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    addFeedItem(\`New Soul created: \${result.soul.name}\`, 'achievement');
                    updateStats();
                }
                
            } catch (error) {
                console.error('Failed to create soul:', error);
            }
        }
        
        async function loadSystemStats() {
            try {
                const response = await fetch('/api/stats');
                const stats = await response.json();
                
                document.getElementById('totalSouls').textContent = stats.totalSouls;
                document.getElementById('totalTrades').textContent = stats.totalTrades;
                document.getElementById('totalItems').textContent = stats.totalItems;
                document.getElementById('collectionEntries').textContent = stats.totalCollectionEntries;
                
            } catch (error) {
                console.error('Failed to load system stats:', error);
            }
        }
        
        function updateStats() {
            loadSystemStats();
        }
        
        function updateAchievements() {
            // Refresh achievement display
            console.log('Achievements updated');
        }
        
        function addFeedItem(message, type) {
            const feed = document.getElementById('realTimeFeed');
            const item = document.createElement('div');
            item.className = \`feed-item \${type}\`;
            item.innerHTML = \`<small>\${new Date().toLocaleTimeString()}</small> \${message}\`;
            
            feed.insertBefore(item, feed.firstChild);
            
            // Keep only last 50 items
            while (feed.children.length > 50) {
                feed.removeChild(feed.lastChild);
            }
        }
    </script>
</body>
</html>`;
    }
    
    async start() {
        return new Promise((resolve) => {
            this.app.listen(this.port, () => {
                console.log(`🏪⚡ Grand Exchange Collar running on port ${this.port}`);
                console.log(`🌐 Interface: http://localhost:${this.port}`);
                console.log(`📡 WebSocket: ws://localhost:${this.wsPort}`);
                console.log(`👤 Soul of Soulfra system operational`);
                console.log(`🔗 Ready to collar trading and collection activities`);
                resolve();
            });
        });
    }
}

if (require.main === module) {
    const geCollar = new GrandExchangeCollar();
    geCollar.start().catch(console.error);
}

module.exports = GrandExchangeCollar;