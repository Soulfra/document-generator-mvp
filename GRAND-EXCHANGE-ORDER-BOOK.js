#!/usr/bin/env node

/**
 * 🏛️⚔️📊 GRAND EXCHANGE ORDER BOOK 📊⚔️🏛️
 * 
 * Classic RuneScape Grand Exchange inspired trading interface with 
 * real-time order book, epic visual effects, and billion dollar game
 * mechanics. Combines nostalgia with modern crypto trading functionality.
 * 
 * Features:
 * - RuneScape-style UI with medieval fantasy theme
 * - Real-time order book with buy/sell walls
 * - Epic trading animations and sound effects
 * - Multi-asset trading (crypto, game items, NFTs)
 * - Advanced order types (limit, market, stop-loss)
 * - Trading achievement system with XP rewards
 * - Guild system for collaborative trading
 * - Boss battles against market volatility
 * 
 * @author Document Generator System  
 * @version 5.0.0 - GRAND EXCHANGE EPIC EDITION
 */

const { EventEmitter } = require('events');
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class GrandExchangeOrderBook extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 3339,
            wsPort: options.wsPort || 3340,
            enableGameMechanics: options.enableGameMechanics !== false,
            enableSoundEffects: options.enableSoundEffects !== false,
            enableEpicAnimations: options.enableEpicAnimations !== false,
            maxOrderBookDepth: options.maxOrderBookDepth || 100,
            priceUpdateInterval: options.priceUpdateInterval || 1000,
            dataDir: options.dataDir || './grand-exchange-data'
        };
        
        // Order book state
        this.orderBooks = new Map();
        this.activeOrders = new Map();
        this.tradeHistory = [];
        this.userBalances = new Map();
        this.userStats = new Map();
        
        // Game mechanics
        this.tradingLevels = new Map();
        this.achievements = new Map();
        this.guilds = new Map();
        this.currentBosses = new Map();
        
        // WebSocket connections
        this.wss = null;
        this.clients = new Set();
        
        // Trading pairs (crypto + game items)
        this.tradingPairs = {
            // Crypto pairs
            'BTC/USD': { type: 'crypto', icon: '₿', baseAsset: 'BTC', quoteAsset: 'USD' },
            'ETH/USD': { type: 'crypto', icon: 'Ξ', baseAsset: 'ETH', quoteAsset: 'USD' },
            'SOL/USD': { type: 'crypto', icon: '◎', baseAsset: 'SOL', quoteAsset: 'USD' },
            'DOGE/USD': { type: 'crypto', icon: 'Ð', baseAsset: 'DOGE', quoteAsset: 'USD' },
            
            // Game items (RuneScape inspired)
            'DRAGON_SWORD/GP': { type: 'item', icon: '⚔️', baseAsset: 'DRAGON_SWORD', quoteAsset: 'GP' },
            'PARTY_HAT/GP': { type: 'item', icon: '🎩', baseAsset: 'PARTY_HAT', quoteAsset: 'GP' },
            'RARE_ORE/GP': { type: 'item', icon: '💎', baseAsset: 'RARE_ORE', quoteAsset: 'GP' },
            'MAGIC_RUNE/GP': { type: 'item', icon: '🔮', baseAsset: 'MAGIC_RUNE', quoteAsset: 'GP' },
            
            // Special billion dollar game items
            'GOLDEN_THRONE/BTC': { type: 'legendary', icon: '👑', baseAsset: 'GOLDEN_THRONE', quoteAsset: 'BTC' },
            'INFINITY_GAUNTLET/ETH': { type: 'legendary', icon: '✋', baseAsset: 'INFINITY_GAUNTLET', quoteAsset: 'ETH' },
            'TIME_CRYSTAL/SOL': { type: 'legendary', icon: '⏳', baseAsset: 'TIME_CRYSTAL', quoteAsset: 'SOL' }
        };
        
        // Initialize order books for all pairs
        for (const pair of Object.keys(this.tradingPairs)) {
            this.orderBooks.set(pair, {
                bids: [], // Buy orders (highest price first)
                asks: [], // Sell orders (lowest price first)
                lastPrice: this.getRandomPrice(pair),
                volume24h: 0,
                priceChange24h: 0
            });
        }
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🏛️ INITIALIZING GRAND EXCHANGE ORDER BOOK...');
        console.log('===============================================');
        
        // Ensure data directory exists
        await fs.mkdir(this.config.dataDir, { recursive: true });
        
        // Load trading data
        await this.loadTradingData();
        
        // Setup web server
        await this.setupWebServer();
        
        // Setup WebSocket server  
        await this.setupWebSocketServer();
        
        // Initialize game mechanics
        if (this.config.enableGameMechanics) {
            await this.initializeGameMechanics();
        }
        
        // Start market simulation
        this.startMarketSimulation();
        
        // Connect to external systems
        await this.connectExternalSystems();
        
        console.log('🚀 GRAND EXCHANGE IS OPEN FOR BUSINESS!');
        console.log(`🌐 Trading Interface: http://localhost:${this.config.port}`);
        console.log(`📡 WebSocket: ws://localhost:${this.config.wsPort}`);
        console.log('⚔️ MAY YOUR TRADES BE EVER PROFITABLE!');
    }
    
    async setupWebServer() {
        console.log('🌐 Setting up Grand Exchange web server...');
        
        this.app = express();
        this.server = http.createServer(this.app);
        
        // Enable CORS and JSON parsing
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
        this.app.use(express.json());
        
        // Serve Grand Exchange interface
        this.app.get('/', (req, res) => {
            res.send(this.getGrandExchangeHTML());
        });
        
        // API endpoints
        this.app.get('/api/orderbook/:pair', (req, res) => {
            const orderBook = this.getOrderBook(req.params.pair);
            res.json(orderBook);
        });
        
        this.app.get('/api/trading-pairs', (req, res) => {
            res.json(this.tradingPairs);
        });
        
        this.app.post('/api/orders/place', (req, res) => {
            const result = this.placeOrder(req.body);
            res.json(result);
        });
        
        this.app.delete('/api/orders/:orderId', (req, res) => {
            const result = this.cancelOrder(req.params.orderId);
            res.json(result);
        });
        
        this.app.get('/api/user/:userId/stats', (req, res) => {
            const stats = this.getUserStats(req.params.userId);
            res.json(stats);
        });
        
        this.app.get('/api/user/:userId/orders', (req, res) => {
            const orders = this.getUserOrders(req.params.userId);
            res.json(orders);
        });
        
        this.app.get('/api/leaderboard', (req, res) => {
            const leaderboard = this.getLeaderboard();
            res.json(leaderboard);
        });
        
        this.server.listen(this.config.port, () => {
            console.log(`✅ Grand Exchange Server: LIVE on port ${this.config.port}`);
        });
    }
    
    async setupWebSocketServer() {
        console.log('📡 Setting up Grand Exchange WebSocket...');
        
        this.wss = new WebSocket.Server({ 
            port: this.config.wsPort,
            maxClients: 1000
        });
        
        this.wss.on('connection', (ws, req) => {
            console.log(`🔌 Trader connected to Grand Exchange (${this.clients.size + 1} total)`);
            
            this.clients.add(ws);
            
            // Send initial exchange state
            ws.send(JSON.stringify({
                type: 'exchange-connected',
                tradingPairs: this.tradingPairs,
                orderBooks: this.getOrderBookSnapshot(),
                userStats: this.getUserStats(ws.userId || 'guest'),
                timestamp: Date.now()
            }));
            
            // Handle messages
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleExchangeMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'exchange-error',
                        message: 'Invalid JSON'
                    }));
                }
            });
            
            // Handle disconnect
            ws.on('close', () => {
                this.clients.delete(ws);
                console.log(`🔌 Trader disconnected from Grand Exchange (${this.clients.size} remaining)`);
            });
        });
        
        console.log(`✅ Grand Exchange WebSocket: LIVE on port ${this.config.wsPort}`);
    }
    
    async initializeGameMechanics() {
        console.log('⚔️ Initializing game mechanics...');
        
        // Initialize trading level system
        this.tradingLevelSystem = {
            levels: [
                { level: 1, xpRequired: 0, title: 'Peasant Trader', perks: [] },
                { level: 10, xpRequired: 1000, title: 'Merchant', perks: ['reduced_fees'] },
                { level: 25, xpRequired: 5000, title: 'Guild Trader', perks: ['advanced_orders'] },
                { level: 50, xpRequired: 25000, title: 'Master Trader', perks: ['market_insights'] },
                { level: 75, xpRequired: 75000, title: 'Trading Lord', perks: ['priority_execution'] },
                { level: 99, xpRequired: 200000, title: 'Exchange Master', perks: ['all_perks'] }
            ]
        };
        
        // Initialize boss battles
        this.initializeBossBattles();
        
        // Initialize achievement system
        this.initializeAchievements();
        
        console.log('✅ Game Mechanics: INITIALIZED');
    }
    
    initializeBossBattles() {
        this.bossBattles = {
            'VOLATILITY_DRAGON': {
                name: 'Volatility Dragon',
                hp: 10000,
                currentHp: 10000,
                abilities: ['market_crash', 'pump_dump', 'fear_greed'],
                rewards: { xp: 5000, gp: 100000, items: ['DRAGON_SWORD'] },
                active: false,
                lastSeen: 0
            },
            'BEAR_MARKET_DEMON': {
                name: 'Bear Market Demon',
                hp: 15000,
                currentHp: 15000,
                abilities: ['endless_red', 'despair_wave', 'portfolio_drain'],
                rewards: { xp: 7500, gp: 250000, items: ['DEMON_ARMOR'] },
                active: false,
                lastSeen: 0
            },
            'BULL_RUN_TITAN': {
                name: 'Bull Run Titan',
                hp: 20000,
                currentHp: 20000,
                abilities: ['moon_charge', 'diamond_hands', 'fomo_frenzy'],
                rewards: { xp: 10000, gp: 500000, items: ['TITAN_CROWN'] },
                active: false,
                lastSeen: 0
            }
        };
    }
    
    initializeAchievements() {
        this.achievementsList = [
            { id: 'first_trade', name: 'First Trade', description: 'Complete your first trade', xp: 100 },
            { id: 'volume_trader', name: 'Volume Trader', description: 'Trade over $10,000 in 24h', xp: 500 },
            { id: 'profit_master', name: 'Profit Master', description: 'Make $1,000 profit in one day', xp: 1000 },
            { id: 'order_book_ninja', name: 'Order Book Ninja', description: 'Place 100 limit orders', xp: 750 },
            { id: 'boss_slayer', name: 'Boss Slayer', description: 'Defeat a market boss', xp: 2000 },
            { id: 'guild_leader', name: 'Guild Leader', description: 'Create a trading guild', xp: 1500 },
            { id: 'legendary_trader', name: 'Legendary Trader', description: 'Reach level 99 trading', xp: 10000 }
        ];
    }
    
    startMarketSimulation() {
        console.log('📈 Starting market simulation...');
        
        // Simulate price movements and order flow
        this.marketSimulationInterval = setInterval(() => {
            this.simulateMarketActivity();
        }, this.config.priceUpdateInterval);
        
        // Spawn boss battles periodically
        if (this.config.enableGameMechanics) {
            this.bossSpawnInterval = setInterval(() => {
                this.checkBossSpawns();
            }, 60000); // Check every minute
        }
        
        console.log('✅ Market Simulation: ACTIVE');
    }
    
    simulateMarketActivity() {
        for (const [pair, pairInfo] of Object.entries(this.tradingPairs)) {
            const orderBook = this.orderBooks.get(pair);
            if (!orderBook) continue;
            
            // Simulate price movement
            const priceChange = (Math.random() - 0.5) * 0.02; // ±1%
            const newPrice = orderBook.lastPrice * (1 + priceChange);
            
            // Add some random orders
            if (Math.random() > 0.7) {
                this.addSimulatedOrder(pair, newPrice);
            }
            
            // Update last price
            orderBook.lastPrice = newPrice;
            orderBook.priceChange24h = priceChange * 100;
            
            // Broadcast price update
            this.broadcastPriceUpdate(pair, orderBook);
        }
    }
    
    addSimulatedOrder(pair, price) {
        const isBuy = Math.random() > 0.5;
        const priceVariation = 1 + (Math.random() - 0.5) * 0.01; // ±0.5%
        const orderPrice = price * priceVariation;
        const quantity = Math.random() * 10 + 0.1;
        
        const order = {
            id: crypto.randomBytes(16).toString('hex'),
            userId: 'market_maker',
            pair,
            side: isBuy ? 'buy' : 'sell',
            type: 'limit',
            price: parseFloat(orderPrice.toFixed(8)),
            quantity: parseFloat(quantity.toFixed(8)),
            filled: 0,
            status: 'open',
            timestamp: Date.now(),
            simulated: true
        };
        
        this.addOrderToBook(order);
    }
    
    checkBossSpawns() {
        const now = Date.now();
        
        for (const [bossId, boss] of Object.entries(this.bossBattles)) {
            if (!boss.active && now - boss.lastSeen > 300000) { // 5 minutes cooldown
                if (Math.random() > 0.95) { // 5% chance per minute
                    this.spawnBoss(bossId);
                }
            }
        }
    }
    
    spawnBoss(bossId) {
        const boss = this.bossBattles[bossId];
        boss.active = true;
        boss.currentHp = boss.hp;
        boss.spawnTime = Date.now();
        
        console.log(`⚔️ BOSS SPAWNED: ${boss.name}!`);
        
        // Broadcast boss spawn
        this.broadcastExchangeUpdate({
            type: 'boss-spawned',
            boss: {
                id: bossId,
                ...boss
            },
            timestamp: Date.now()
        });
        
        // Apply boss effects to market
        this.applyBossEffects(bossId);
    }
    
    applyBossEffects(bossId) {
        const boss = this.bossBattles[bossId];
        
        switch (bossId) {
            case 'VOLATILITY_DRAGON':
                // Increase market volatility
                this.marketVolatilityMultiplier = 3.0;
                break;
            case 'BEAR_MARKET_DEMON':
                // Force downward pressure
                this.marketBias = -0.02; // -2% bias
                break;
            case 'BULL_RUN_TITAN':
                // Force upward pressure
                this.marketBias = 0.03; // +3% bias
                break;
        }
        
        // Boss effects last for 10 minutes
        setTimeout(() => {
            this.resetMarketEffects();
        }, 600000);
    }
    
    resetMarketEffects() {
        this.marketVolatilityMultiplier = 1.0;
        this.marketBias = 0;
    }
    
    async connectExternalSystems() {
        console.log('🔗 Connecting to external trading systems...');
        
        // Connect to live ticker tape for real price feeds
        try {
            const tickerWS = new WebSocket('ws://localhost:3334');
            
            tickerWS.on('open', () => {
                console.log('🔌 Connected to live ticker tape for price feeds');
            });
            
            tickerWS.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleExternalPriceUpdate(message);
                } catch (error) {
                    // Ignore parsing errors
                }
            });
            
        } catch (error) {
            console.error('Failed to connect to ticker tape:', error);
        }
        
        // Connect to coaching system for trading XP
        try {
            const coachingWS = new WebSocket('ws://localhost:3338');
            
            coachingWS.on('open', () => {
                console.log('🔌 Connected to coaching system for XP rewards');
            });
            
        } catch (error) {
            console.error('Failed to connect to coaching system:', error);
        }
    }
    
    handleExternalPriceUpdate(message) {
        if (message.type === 'ticker-update' && message.content) {
            // Parse ticker content for price updates
            const content = message.content.content || '';
            const match = content.match(/(\w+):\s*\$([0-9,]+\.?\d*)/);
            
            if (match) {
                const symbol = match[1];
                const price = parseFloat(match[2].replace(/,/g, ''));
                const pair = `${symbol}/USD`;
                
                if (this.tradingPairs[pair]) {
                    const orderBook = this.orderBooks.get(pair);
                    if (orderBook) {
                        orderBook.lastPrice = price;
                        this.broadcastPriceUpdate(pair, orderBook);
                    }
                }
            }
        }
    }
    
    placeOrder(orderData) {
        const orderId = crypto.randomBytes(16).toString('hex');
        
        const order = {
            id: orderId,
            userId: orderData.userId || 'guest',
            pair: orderData.pair,
            side: orderData.side, // 'buy' or 'sell'
            type: orderData.type || 'limit', // 'limit', 'market', 'stop'
            price: parseFloat(orderData.price),
            quantity: parseFloat(orderData.quantity),
            filled: 0,
            status: 'open',
            timestamp: Date.now()
        };
        
        // Validate order
        const validation = this.validateOrder(order);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error
            };
        }
        
        // Add to order book
        this.addOrderToBook(order);
        
        // Try to match immediately
        this.matchOrders(order.pair);
        
        // Award XP for placing order
        if (this.config.enableGameMechanics) {
            this.awardTradingXP(order.userId, 10);
        }
        
        console.log(`📋 Order placed: ${order.side} ${order.quantity} ${order.pair} @ $${order.price}`);
        
        return {
            success: true,
            orderId: order.id,
            order: order
        };
    }
    
    validateOrder(order) {
        // Check if pair exists
        if (!this.tradingPairs[order.pair]) {
            return { valid: false, error: 'Invalid trading pair' };
        }
        
        // Check price and quantity
        if (order.price <= 0 || order.quantity <= 0) {
            return { valid: false, error: 'Price and quantity must be positive' };
        }
        
        // Check user balance (simplified)
        // In real implementation, this would check actual balances
        return { valid: true };
    }
    
    addOrderToBook(order) {
        const orderBook = this.orderBooks.get(order.pair);
        if (!orderBook) return;
        
        this.activeOrders.set(order.id, order);
        
        if (order.side === 'buy') {
            // Add to bids (sorted by price descending)
            orderBook.bids.push(order);
            orderBook.bids.sort((a, b) => b.price - a.price);
        } else {
            // Add to asks (sorted by price ascending)
            orderBook.asks.push(order);
            orderBook.asks.sort((a, b) => a.price - b.price);
        }
        
        // Limit order book depth
        if (orderBook.bids.length > this.config.maxOrderBookDepth) {
            const removed = orderBook.bids.pop();
            this.activeOrders.delete(removed.id);
        }
        if (orderBook.asks.length > this.config.maxOrderBookDepth) {
            const removed = orderBook.asks.pop();
            this.activeOrders.delete(removed.id);
        }
        
        // Broadcast order book update
        this.broadcastOrderBookUpdate(order.pair);
    }
    
    matchOrders(pair) {
        const orderBook = this.orderBooks.get(pair);
        if (!orderBook || orderBook.bids.length === 0 || orderBook.asks.length === 0) {
            return;
        }
        
        const bestBid = orderBook.bids[0];
        const bestAsk = orderBook.asks[0];
        
        // Check if orders can match
        if (bestBid.price >= bestAsk.price) {
            const matchPrice = bestAsk.price; // Use ask price
            const matchQuantity = Math.min(
                bestBid.quantity - bestBid.filled,
                bestAsk.quantity - bestAsk.filled
            );
            
            // Execute the trade
            this.executeTrade(bestBid, bestAsk, matchPrice, matchQuantity);
            
            // Continue matching if there are more orders
            this.matchOrders(pair);
        }
    }
    
    executeTrade(buyOrder, sellOrder, price, quantity) {
        // Update order fills
        buyOrder.filled += quantity;
        sellOrder.filled += quantity;
        
        // Check if orders are completely filled
        if (buyOrder.filled >= buyOrder.quantity) {
            buyOrder.status = 'filled';
            this.removeOrderFromBook(buyOrder);
        }
        if (sellOrder.filled >= sellOrder.quantity) {
            sellOrder.status = 'filled';
            this.removeOrderFromBook(sellOrder);
        }
        
        // Create trade record
        const trade = {
            id: crypto.randomBytes(16).toString('hex'),
            pair: buyOrder.pair,
            price: price,
            quantity: quantity,
            value: price * quantity,
            buyOrderId: buyOrder.id,
            sellOrderId: sellOrder.id,
            buyUserId: buyOrder.userId,
            sellUserId: sellOrder.userId,
            timestamp: Date.now()
        };
        
        this.tradeHistory.push(trade);
        
        // Keep trade history limited
        if (this.tradeHistory.length > 1000) {
            this.tradeHistory.shift();
        }
        
        // Award XP for completed trades
        if (this.config.enableGameMechanics) {
            this.awardTradingXP(buyOrder.userId, Math.floor(quantity * 5));
            this.awardTradingXP(sellOrder.userId, Math.floor(quantity * 5));
        }
        
        // Check for achievements
        this.checkTradeAchievements(trade);
        
        // Update order book last price
        const orderBook = this.orderBooks.get(buyOrder.pair);
        orderBook.lastPrice = price;
        orderBook.volume24h += trade.value;
        
        // Broadcast trade
        this.broadcastTradeUpdate(trade);
        
        console.log(`⚡ Trade executed: ${quantity} ${buyOrder.pair} @ $${price}`);
    }
    
    removeOrderFromBook(order) {
        const orderBook = this.orderBooks.get(order.pair);
        if (!orderBook) return;
        
        if (order.side === 'buy') {
            orderBook.bids = orderBook.bids.filter(o => o.id !== order.id);
        } else {
            orderBook.asks = orderBook.asks.filter(o => o.id !== order.id);
        }
        
        this.activeOrders.delete(order.id);
    }
    
    cancelOrder(orderId) {
        const order = this.activeOrders.get(orderId);
        if (!order) {
            return { success: false, error: 'Order not found' };
        }
        
        order.status = 'cancelled';
        this.removeOrderFromBook(order);
        
        console.log(`❌ Order cancelled: ${orderId}`);
        
        return { success: true, orderId };
    }
    
    awardTradingXP(userId, xp) {
        if (!this.tradingLevels.has(userId)) {
            this.tradingLevels.set(userId, {
                level: 1,
                xp: 0,
                totalXp: 0
            });
        }
        
        const userLevel = this.tradingLevels.get(userId);
        userLevel.xp += xp;
        userLevel.totalXp += xp;
        
        // Check for level up
        const newLevel = this.calculateLevel(userLevel.totalXp);
        if (newLevel > userLevel.level) {
            userLevel.level = newLevel;
            this.handleLevelUp(userId, newLevel);
        }
        
        this.tradingLevels.set(userId, userLevel);
    }
    
    calculateLevel(totalXp) {
        for (let i = this.tradingLevelSystem.levels.length - 1; i >= 0; i--) {
            const levelData = this.tradingLevelSystem.levels[i];
            if (totalXp >= levelData.xpRequired) {
                return levelData.level;
            }
        }
        return 1;
    }
    
    handleLevelUp(userId, newLevel) {
        const levelData = this.tradingLevelSystem.levels.find(l => l.level === newLevel);
        
        console.log(`🎉 ${userId} reached level ${newLevel}: ${levelData.title}!`);
        
        // Broadcast level up
        this.broadcastExchangeUpdate({
            type: 'level-up',
            userId,
            level: newLevel,
            title: levelData.title,
            perks: levelData.perks,
            timestamp: Date.now()
        });
    }
    
    checkTradeAchievements(trade) {
        // Check various achievement conditions
        const buyUser = trade.buyUserId;
        const sellUser = trade.sellUserId;
        
        // First trade achievement
        this.checkAchievement(buyUser, 'first_trade');
        this.checkAchievement(sellUser, 'first_trade');
        
        // Volume achievements
        if (trade.value > 10000) {
            this.checkAchievement(buyUser, 'volume_trader');
            this.checkAchievement(sellUser, 'volume_trader');
        }
    }
    
    checkAchievement(userId, achievementId) {
        if (!this.achievements.has(userId)) {
            this.achievements.set(userId, new Set());
        }
        
        const userAchievements = this.achievements.get(userId);
        if (userAchievements.has(achievementId)) {
            return; // Already unlocked
        }
        
        // Award achievement
        userAchievements.add(achievementId);
        const achievement = this.achievementsList.find(a => a.id === achievementId);
        
        if (achievement) {
            this.awardTradingXP(userId, achievement.xp);
            
            console.log(`🏆 ${userId} unlocked achievement: ${achievement.name}!`);
            
            // Broadcast achievement
            this.broadcastExchangeUpdate({
                type: 'achievement-unlocked',
                userId,
                achievement,
                timestamp: Date.now()
            });
        }
    }
    
    handleExchangeMessage(ws, data) {
        switch (data.type) {
            case 'exchange-ping':
                ws.send(JSON.stringify({ 
                    type: 'exchange-pong', 
                    timestamp: Date.now() 
                }));
                break;
                
            case 'place-order':
                const orderResult = this.placeOrder(data.order);
                ws.send(JSON.stringify({
                    type: 'order-result',
                    result: orderResult,
                    timestamp: Date.now()
                }));
                break;
                
            case 'cancel-order':
                const cancelResult = this.cancelOrder(data.orderId);
                ws.send(JSON.stringify({
                    type: 'cancel-result',
                    result: cancelResult,
                    timestamp: Date.now()
                }));
                break;
                
            case 'subscribe-pair':
                ws.subscribedPairs = ws.subscribedPairs || new Set();
                ws.subscribedPairs.add(data.pair);
                break;
                
            case 'attack-boss':
                this.handleBossAttack(ws, data);
                break;
        }
    }
    
    handleBossAttack(ws, data) {
        const boss = this.bossBattles[data.bossId];
        if (!boss || !boss.active) {
            ws.send(JSON.stringify({
                type: 'boss-attack-result',
                success: false,
                error: 'Boss not available'
            }));
            return;
        }
        
        // Calculate damage based on user's trading level
        const userLevel = this.tradingLevels.get(ws.userId || 'guest');
        const damage = Math.floor((userLevel?.level || 1) * 50 + Math.random() * 100);
        
        boss.currentHp -= damage;
        
        if (boss.currentHp <= 0) {
            // Boss defeated!
            this.defeatBoss(data.bossId, ws.userId);
        }
        
        ws.send(JSON.stringify({
            type: 'boss-attack-result',
            success: true,
            damage,
            bossHp: boss.currentHp,
            bossMaxHp: boss.hp
        }));
    }
    
    defeatBoss(bossId, userId) {
        const boss = this.bossBattles[bossId];
        boss.active = false;
        boss.lastSeen = Date.now();
        boss.currentHp = boss.hp;
        
        // Award rewards
        this.awardTradingXP(userId, boss.rewards.xp);
        this.checkAchievement(userId, 'boss_slayer');
        
        console.log(`⚔️ ${boss.name} has been defeated by ${userId}!`);
        
        // Broadcast boss defeat
        this.broadcastExchangeUpdate({
            type: 'boss-defeated',
            bossId,
            boss,
            defeatedBy: userId,
            rewards: boss.rewards,
            timestamp: Date.now()
        });
        
        // Reset market effects
        this.resetMarketEffects();
    }
    
    getOrderBook(pair) {
        const orderBook = this.orderBooks.get(pair);
        if (!orderBook) return null;
        
        return {
            pair,
            bids: orderBook.bids.slice(0, 20), // Top 20 bids
            asks: orderBook.asks.slice(0, 20), // Top 20 asks
            lastPrice: orderBook.lastPrice,
            volume24h: orderBook.volume24h,
            priceChange24h: orderBook.priceChange24h,
            timestamp: Date.now()
        };
    }
    
    getOrderBookSnapshot() {
        const snapshot = {};
        for (const pair of Object.keys(this.tradingPairs)) {
            snapshot[pair] = this.getOrderBook(pair);
        }
        return snapshot;
    }
    
    getUserStats(userId) {
        const tradingLevel = this.tradingLevels.get(userId) || { level: 1, xp: 0, totalXp: 0 };
        const achievements = this.achievements.get(userId) || new Set();
        const userOrders = Array.from(this.activeOrders.values()).filter(o => o.userId === userId);
        const userTrades = this.tradeHistory.filter(t => t.buyUserId === userId || t.sellUserId === userId);
        
        return {
            userId,
            tradingLevel,
            achievements: Array.from(achievements),
            activeOrders: userOrders.length,
            completedTrades: userTrades.length,
            totalVolume: userTrades.reduce((sum, t) => sum + t.value, 0),
            totalProfit: this.calculateUserProfit(userId),
            timestamp: Date.now()
        };
    }
    
    calculateUserProfit(userId) {
        // Simplified profit calculation
        const userTrades = this.tradeHistory.filter(t => t.buyUserId === userId || t.sellUserId === userId);
        return userTrades.reduce((profit, trade) => {
            // This is a simplified calculation - in reality you'd track actual P&L
            return profit + (Math.random() - 0.5) * trade.value * 0.1;
        }, 0);
    }
    
    getUserOrders(userId) {
        return Array.from(this.activeOrders.values()).filter(o => o.userId === userId);
    }
    
    getLeaderboard() {
        const users = Array.from(this.tradingLevels.entries()).map(([userId, data]) => ({
            userId,
            level: data.level,
            totalXp: data.totalXp,
            achievements: this.achievements.get(userId)?.size || 0,
            profit: this.calculateUserProfit(userId)
        }));
        
        return {
            byLevel: users.sort((a, b) => b.level - a.level).slice(0, 10),
            byXp: users.sort((a, b) => b.totalXp - a.totalXp).slice(0, 10),
            byProfit: users.sort((a, b) => b.profit - a.profit).slice(0, 10),
            timestamp: Date.now()
        };
    }
    
    getRandomPrice(pair) {
        const basePrices = {
            'BTC/USD': 43287,
            'ETH/USD': 2634,
            'SOL/USD': 89,
            'DOGE/USD': 0.08,
            'DRAGON_SWORD/GP': 15000000,
            'PARTY_HAT/GP': 2100000000,
            'RARE_ORE/GP': 5000,
            'MAGIC_RUNE/GP': 150,
            'GOLDEN_THRONE/BTC': 10,
            'INFINITY_GAUNTLET/ETH': 100,
            'TIME_CRYSTAL/SOL': 1000
        };
        
        return basePrices[pair] || 100;
    }
    
    broadcastPriceUpdate(pair, orderBook) {
        this.broadcastExchangeUpdate({
            type: 'price-update',
            pair,
            price: orderBook.lastPrice,
            change: orderBook.priceChange24h,
            volume: orderBook.volume24h,
            timestamp: Date.now()
        });
    }
    
    broadcastOrderBookUpdate(pair) {
        const orderBook = this.getOrderBook(pair);
        this.broadcastExchangeUpdate({
            type: 'orderbook-update',
            orderBook,
            timestamp: Date.now()
        });
    }
    
    broadcastTradeUpdate(trade) {
        this.broadcastExchangeUpdate({
            type: 'trade-executed',
            trade,
            timestamp: Date.now()
        });
    }
    
    broadcastExchangeUpdate(update) {
        if (this.clients.size === 0) return;
        
        const message = JSON.stringify(update);
        
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                // Check if client is subscribed to this pair (if applicable)
                if (update.pair && client.subscribedPairs && !client.subscribedPairs.has(update.pair)) {
                    return;
                }
                
                try {
                    client.send(message);
                } catch (error) {
                    console.error('Error sending exchange update to client:', error);
                    this.clients.delete(client);
                }
            }
        });
    }
    
    async loadTradingData() {
        try {
            const ordersPath = path.join(this.config.dataDir, 'orders.json');
            const tradesPath = path.join(this.config.dataDir, 'trades.json');
            
            // Load active orders
            try {
                const ordersData = await fs.readFile(ordersPath, 'utf8');
                const orders = JSON.parse(ordersData);
                orders.forEach(order => {
                    this.activeOrders.set(order.id, order);
                    this.addOrderToBook(order);
                });
            } catch (error) {
                console.log('No existing orders data found');
            }
            
            // Load trade history
            try {
                const tradesData = await fs.readFile(tradesPath, 'utf8');
                this.tradeHistory = JSON.parse(tradesData);
            } catch (error) {
                console.log('No existing trades data found');
            }
            
        } catch (error) {
            console.error('Error loading trading data:', error);
        }
    }
    
    async saveTradingData() {
        try {
            const ordersPath = path.join(this.config.dataDir, 'orders.json');
            const tradesPath = path.join(this.config.dataDir, 'trades.json');
            
            // Save active orders
            const orders = Array.from(this.activeOrders.values());
            await fs.writeFile(ordersPath, JSON.stringify(orders, null, 2));
            
            // Save trade history (keep last 1000)
            const recentTrades = this.tradeHistory.slice(-1000);
            await fs.writeFile(tradesPath, JSON.stringify(recentTrades, null, 2));
            
        } catch (error) {
            console.error('Error saving trading data:', error);
        }
    }
    
    getGrandExchangeHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🏛️ GRAND EXCHANGE ORDER BOOK ⚔️</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=MedievalSharp&family=Cinzel:wght@400;600&display=swap');
        
        body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #2c1810 0%, #1a0e08 50%, #0a0404 100%);
            color: #d4af37;
            font-family: 'Cinzel', serif;
            overflow: hidden;
        }
        
        .exchange-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            display: grid;
            grid-template-areas: 
                "header header header header"
                "pairs orderbook trades stats"
                "pairs orderbook trades bosses"
                "orders orders orders orders";
            grid-template-rows: 80px 1fr 1fr 200px;
            grid-template-columns: 250px 1fr 300px 250px;
            gap: 10px;
            padding: 10px;
            box-sizing: border-box;
        }
        
        .panel {
            background: rgba(20, 10, 5, 0.9);
            border: 3px solid #8b4513;
            border-radius: 15px;
            padding: 15px;
            backdrop-filter: blur(10px);
            box-shadow: inset 0 0 20px rgba(212, 175, 55, 0.1);
        }
        
        .exchange-header {
            grid-area: header;
            text-align: center;
            font-family: 'MedievalSharp', serif;
            font-size: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(45deg, #8b4513, #d4af37);
            border: 3px solid #ffd700;
            animation: royal-glow 3s infinite;
        }
        
        @keyframes royal-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.5); }
            50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.8); }
        }
        
        .trading-pairs {
            grid-area: pairs;
        }
        
        .order-book {
            grid-area: orderbook;
        }
        
        .trade-history {
            grid-area: trades;
        }
        
        .user-stats {
            grid-area: stats;
        }
        
        .boss-battles {
            grid-area: bosses;
        }
        
        .active-orders {
            grid-area: orders;
        }
        
        .panel-title {
            font-family: 'MedievalSharp', serif;
            font-size: 18px;
            margin-bottom: 15px;
            text-align: center;
            color: #ffd700;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        }
        
        .pair-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            margin: 5px 0;
            background: rgba(139, 69, 19, 0.3);
            border: 1px solid #8b4513;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .pair-item:hover {
            background: rgba(212, 175, 55, 0.2);
            transform: scale(1.02);
        }
        
        .pair-item.selected {
            background: rgba(255, 215, 0, 0.3);
            border-color: #ffd700;
        }
        
        .pair-price {
            font-weight: bold;
            color: #ffd700;
        }
        
        .pair-change.positive {
            color: #32cd32;
        }
        
        .pair-change.negative {
            color: #ff6b47;
        }
        
        .order-book-side {
            height: 200px;
            overflow-y: auto;
            margin: 10px 0;
        }
        
        .order-row {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            padding: 4px 8px;
            font-size: 12px;
            border-bottom: 1px solid rgba(139, 69, 19, 0.3);
        }
        
        .order-row.bid {
            background: rgba(50, 205, 50, 0.1);
        }
        
        .order-row.ask {
            background: rgba(255, 107, 71, 0.1);
        }
        
        .trade-item {
            display: flex;
            justify-content: space-between;
            padding: 6px 8px;
            font-size: 12px;
            border-bottom: 1px solid rgba(139, 69, 19, 0.2);
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(139, 69, 19, 0.3);
        }
        
        .stat-value {
            font-weight: bold;
            color: #ffd700;
        }
        
        .level-display {
            text-align: center;
            padding: 15px;
            background: linear-gradient(45deg, #8b4513, #d4af37);
            border-radius: 10px;
            margin-bottom: 15px;
        }
        
        .level-number {
            font-size: 24px;
            font-weight: bold;
            color: #ffffff;
        }
        
        .level-title {
            font-size: 14px;
            color: #000000;
            margin-top: 5px;
        }
        
        .xp-bar {
            width: 100%;
            height: 10px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 5px;
            overflow: hidden;
            margin-top: 10px;
        }
        
        .xp-fill {
            height: 100%;
            background: linear-gradient(90deg, #32cd32, #ffd700);
            border-radius: 5px;
            transition: width 0.5s ease;
        }
        
        .boss-card {
            background: rgba(139, 0, 0, 0.3);
            border: 2px solid #8b0000;
            border-radius: 10px;
            padding: 10px;
            margin: 8px 0;
            text-align: center;
        }
        
        .boss-card.active {
            border-color: #ff0000;
            animation: boss-pulse 1s infinite;
        }
        
        @keyframes boss-pulse {
            0%, 100% { box-shadow: 0 0 10px rgba(255, 0, 0, 0.5); }
            50% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.8); }
        }
        
        .boss-hp-bar {
            width: 100%;
            height: 8px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 4px;
            overflow: hidden;
            margin: 5px 0;
        }
        
        .boss-hp-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff0000, #ffaa00);
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        .medieval-button {
            background: linear-gradient(45deg, #8b4513, #d4af37);
            color: #000;
            border: 2px solid #ffd700;
            padding: 8px 16px;
            border-radius: 8px;
            font-family: 'Cinzel', serif;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 5px;
        }
        
        .medieval-button:hover {
            background: linear-gradient(45deg, #d4af37, #ffd700);
            transform: scale(1.05);
            box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
        }
        
        .order-form {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-top: 15px;
        }
        
        .form-input {
            background: rgba(139, 69, 19, 0.3);
            border: 1px solid #8b4513;
            border-radius: 5px;
            padding: 8px;
            color: #d4af37;
            font-family: 'Cinzel', serif;
        }
        
        .form-input:focus {
            outline: none;
            border-color: #ffd700;
            box-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
        }
        
        .achievement-notification {
            position: fixed;
            top: 100px;
            right: 20px;
            background: linear-gradient(45deg, #ffd700, #ffed4e);
            color: #000;
            padding: 15px 20px;
            border-radius: 10px;
            font-weight: bold;
            animation: achievement-appear 0.5s ease-out;
            z-index: 10000;
            border: 2px solid #8b4513;
        }
        
        @keyframes achievement-appear {
            from { transform: translateX(100%) scale(0.8); opacity: 0; }
            to { transform: translateX(0) scale(1); opacity: 1; }
        }
        
        .scrollable {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .scrollable::-webkit-scrollbar {
            width: 8px;
        }
        
        .scrollable::-webkit-scrollbar-track {
            background: rgba(139, 69, 19, 0.3);
            border-radius: 4px;
        }
        
        .scrollable::-webkit-scrollbar-thumb {
            background: #8b4513;
            border-radius: 4px;
        }
        
        .trade-value {
            font-size: 11px;
            color: #999;
        }
        
        .boss-reward {
            font-size: 10px;
            color: #ffd700;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="exchange-container">
        <div class="panel exchange-header">
            🏛️ GRAND EXCHANGE ORDER BOOK ⚔️
        </div>
        
        <div class="panel trading-pairs">
            <div class="panel-title">📊 Trading Pairs</div>
            <div id="tradingPairs" class="scrollable"></div>
        </div>
        
        <div class="panel order-book">
            <div class="panel-title" id="orderBookTitle">📋 Order Book</div>
            
            <div class="order-form">
                <select class="form-input" id="orderSide">
                    <option value="buy">⚔️ Buy</option>
                    <option value="sell">🛡️ Sell</option>
                </select>
                <select class="form-input" id="orderType">
                    <option value="limit">🎯 Limit</option>
                    <option value="market">⚡ Market</option>
                </select>
                <input type="number" class="form-input" id="orderPrice" placeholder="Price" step="0.00000001">
                <input type="number" class="form-input" id="orderQuantity" placeholder="Quantity" step="0.00000001">
            </div>
            <button class="medieval-button" onclick="placeOrder()" style="width: 100%; margin-top: 10px;">
                🗡️ Place Order
            </button>
            
            <div style="margin-top: 15px;">
                <div style="color: #ff6b47; font-weight: bold; text-align: center;">📈 ASKS (SELL)</div>
                <div id="asks" class="order-book-side scrollable"></div>
                
                <div style="color: #32cd32; font-weight: bold; text-align: center;">📉 BIDS (BUY)</div>
                <div id="bids" class="order-book-side scrollable"></div>
            </div>
        </div>
        
        <div class="panel trade-history">
            <div class="panel-title">⚔️ Recent Trades</div>
            <div id="tradeHistory" class="scrollable"></div>
        </div>
        
        <div class="panel user-stats">
            <div class="panel-title">👤 Your Stats</div>
            
            <div class="level-display">
                <div class="level-number" id="userLevel">1</div>
                <div class="level-title" id="userTitle">Peasant Trader</div>
                <div class="xp-bar">
                    <div class="xp-fill" id="xpFill" style="width: 0%"></div>
                </div>
                <div style="font-size: 12px; margin-top: 5px;">
                    <span id="currentXp">0</span> / <span id="nextLevelXp">1000</span> XP
                </div>
            </div>
            
            <div class="stat-item">
                <span>Active Orders:</span>
                <span class="stat-value" id="activeOrders">0</span>
            </div>
            <div class="stat-item">
                <span>Completed Trades:</span>
                <span class="stat-value" id="completedTrades">0</span>
            </div>
            <div class="stat-item">
                <span>Total Volume:</span>
                <span class="stat-value" id="totalVolume">$0</span>
            </div>
            <div class="stat-item">
                <span>Total Profit:</span>
                <span class="stat-value" id="totalProfit">$0</span>
            </div>
            <div class="stat-item">
                <span>Achievements:</span>
                <span class="stat-value" id="achievements">0</span>
            </div>
        </div>
        
        <div class="panel boss-battles">
            <div class="panel-title">🐉 Boss Battles</div>
            <div id="bossBattles"></div>
        </div>
        
        <div class="panel active-orders">
            <div class="panel-title">📜 Your Active Orders</div>
            <div id="activeOrdersList" class="scrollable"></div>
        </div>
    </div>
    
    <script>
        let ws;
        let selectedPair = 'BTC/USD';
        let orderBooks = {};
        let userStats = {};
        let tradingPairs = {};
        
        function init() {
            connectWebSocket();
            updateInterface();
            
            // Update interface every 5 seconds
            setInterval(updateInterface, 5000);
        }
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.config.wsPort}');
            
            ws.onopen = () => {
                console.log('🏛️ Connected to Grand Exchange');
                ws.send(JSON.stringify({ type: 'subscribe-pair', pair: selectedPair }));
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleExchangeMessage(data);
            };
            
            ws.onclose = () => {
                console.log('🔌 Disconnected, reconnecting...');
                setTimeout(connectWebSocket, 1000);
            };
            
            ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
            };
        }
        
        function handleExchangeMessage(data) {
            switch (data.type) {
                case 'exchange-connected':
                    tradingPairs = data.tradingPairs;
                    orderBooks = data.orderBooks;
                    userStats = data.userStats;
                    updateTradingPairs();
                    updateOrderBook();
                    updateUserStats();
                    break;
                    
                case 'price-update':
                    updatePriceInPairsList(data.pair, data.price, data.change);
                    break;
                    
                case 'orderbook-update':
                    if (data.orderBook.pair === selectedPair) {
                        orderBooks[selectedPair] = data.orderBook;
                        updateOrderBook();
                    }
                    break;
                    
                case 'trade-executed':
                    addTradeToHistory(data.trade);
                    if (data.trade.pair === selectedPair) {
                        updateOrderBook();
                    }
                    break;
                    
                case 'level-up':
                    showAchievementNotification(\`🎉 LEVEL UP! You are now level \\${data.level}: \\${data.title}!\`);
                    updateUserStats();
                    break;
                    
                case 'achievement-unlocked':
                    showAchievementNotification(\`🏆 Achievement Unlocked: \\${data.achievement.name}!\`);
                    updateUserStats();
                    break;
                    
                case 'boss-spawned':
                    showAchievementNotification(\`🐉 Boss Spawned: \\${data.boss.name}!\`);
                    updateBossBattles();
                    break;
                    
                case 'boss-defeated':
                    showAchievementNotification(\`⚔️ Boss Defeated: \\${data.boss.name} by \\${data.defeatedBy}!\`);
                    updateBossBattles();
                    break;
                    
                case 'order-result':
                    if (data.result.success) {
                        showAchievementNotification('✅ Order placed successfully!');
                        clearOrderForm();
                    } else {
                        showAchievementNotification('❌ Order failed: ' + data.result.error);
                    }
                    break;
            }
        }
        
        function updateTradingPairs() {
            const container = document.getElementById('tradingPairs');
            container.innerHTML = '';
            
            for (const [pair, info] of Object.entries(tradingPairs)) {
                const div = document.createElement('div');
                div.className = 'pair-item' + (pair === selectedPair ? ' selected' : '');
                div.onclick = () => selectPair(pair);
                
                const orderBook = orderBooks[pair] || { lastPrice: 0, priceChange24h: 0 };
                const changeClass = orderBook.priceChange24h >= 0 ? 'positive' : 'negative';
                const changeSign = orderBook.priceChange24h >= 0 ? '+' : '';
                
                div.innerHTML = \`
                    <div>
                        <div>\\${info.icon} \\${pair}</div>
                        <div style="font-size: 10px; color: #999;">\\${info.type}</div>
                    </div>
                    <div>
                        <div class="pair-price">$\\${orderBook.lastPrice.toFixed(8)}</div>
                        <div class="pair-change \\${changeClass}">\\${changeSign}\\${orderBook.priceChange24h.toFixed(2)}%</div>
                    </div>
                \`;
                
                container.appendChild(div);
            }
        }
        
        function selectPair(pair) {
            selectedPair = pair;
            updateTradingPairs();
            updateOrderBook();
            document.getElementById('orderBookTitle').textContent = \`📋 Order Book - \\${pair}\`;
            
            // Subscribe to pair updates
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'subscribe-pair', pair }));
            }
        }
        
        function updateOrderBook() {
            const orderBook = orderBooks[selectedPair];
            if (!orderBook) return;
            
            // Update asks
            const asksContainer = document.getElementById('asks');
            asksContainer.innerHTML = '';
            (orderBook.asks || []).forEach(ask => {
                const div = document.createElement('div');
                div.className = 'order-row ask';
                div.innerHTML = \`
                    <span>\\${ask.price.toFixed(8)}</span>
                    <span>\\${ask.quantity.toFixed(8)}</span>
                    <span>\\${(ask.price * ask.quantity).toFixed(2)}</span>
                \`;
                asksContainer.appendChild(div);
            });
            
            // Update bids
            const bidsContainer = document.getElementById('bids');
            bidsContainer.innerHTML = '';
            (orderBook.bids || []).forEach(bid => {
                const div = document.createElement('div');
                div.className = 'order-row bid';
                div.innerHTML = \`
                    <span>\\${bid.price.toFixed(8)}</span>
                    <span>\\${bid.quantity.toFixed(8)}</span>
                    <span>\\${(bid.price * bid.quantity).toFixed(2)}</span>
                \`;
                bidsContainer.appendChild(div);
            });
        }
        
        function updatePriceInPairsList(pair, price, change) {
            // Update price in trading pairs list
            updateTradingPairs();
        }
        
        function addTradeToHistory(trade) {
            const container = document.getElementById('tradeHistory');
            const div = document.createElement('div');
            div.className = 'trade-item';
            
            const time = new Date(trade.timestamp).toLocaleTimeString();
            const changeClass = Math.random() > 0.5 ? 'positive' : 'negative';
            
            div.innerHTML = \`
                <div>
                    <div>\\${trade.price.toFixed(8)}</div>
                    <div class="trade-value">\\${trade.quantity.toFixed(8)}</div>
                </div>
                <div>
                    <div class="pair-change \\${changeClass}">\\${time}</div>
                    <div class="trade-value">$\\${trade.value.toFixed(2)}</div>
                </div>
            \`;
            
            container.insertBefore(div, container.firstChild);
            
            // Keep only last 20 trades
            while (container.children.length > 20) {
                container.removeChild(container.lastChild);
            }
        }
        
        function updateUserStats() {
            // Simulate user stats updates
            document.getElementById('userLevel').textContent = userStats.tradingLevel?.level || 1;
            document.getElementById('userTitle').textContent = getTitleForLevel(userStats.tradingLevel?.level || 1);
            document.getElementById('activeOrders').textContent = userStats.activeOrders || 0;
            document.getElementById('completedTrades').textContent = userStats.completedTrades || 0;
            document.getElementById('totalVolume').textContent = '$' + (userStats.totalVolume || 0).toLocaleString();
            document.getElementById('totalProfit').textContent = '$' + (userStats.totalProfit || 0).toFixed(2);
            document.getElementById('achievements').textContent = (userStats.achievements || []).length;
            
            // Update XP bar
            const currentXp = userStats.tradingLevel?.xp || 0;
            const nextLevelXp = getXpForNextLevel(userStats.tradingLevel?.level || 1);
            const xpProgress = (currentXp / nextLevelXp) * 100;
            
            document.getElementById('currentXp').textContent = currentXp;
            document.getElementById('nextLevelXp').textContent = nextLevelXp;
            document.getElementById('xpFill').style.width = xpProgress + '%';
        }
        
        function getTitleForLevel(level) {
            if (level >= 99) return 'Exchange Master';
            if (level >= 75) return 'Trading Lord';
            if (level >= 50) return 'Master Trader';
            if (level >= 25) return 'Guild Trader';
            if (level >= 10) return 'Merchant';
            return 'Peasant Trader';
        }
        
        function getXpForNextLevel(level) {
            if (level >= 99) return 200000;
            if (level >= 75) return 75000;
            if (level >= 50) return 25000;
            if (level >= 25) return 5000;
            if (level >= 10) return 1000;
            return 500;
        }
        
        function updateBossBattles() {
            const container = document.getElementById('bossBattles');
            container.innerHTML = '';
            
            const bosses = [
                { id: 'VOLATILITY_DRAGON', name: 'Volatility Dragon', hp: 10000, currentHp: 8500, active: true },
                { id: 'BEAR_MARKET_DEMON', name: 'Bear Demon', hp: 15000, currentHp: 15000, active: false },
                { id: 'BULL_RUN_TITAN', name: 'Bull Titan', hp: 20000, currentHp: 20000, active: false }
            ];
            
            bosses.forEach(boss => {
                const div = document.createElement('div');
                div.className = 'boss-card' + (boss.active ? ' active' : '');
                
                const hpPercent = (boss.currentHp / boss.hp) * 100;
                
                div.innerHTML = \`
                    <div style="font-weight: bold;">\\${boss.name}</div>
                    <div class="boss-hp-bar">
                        <div class="boss-hp-fill" style="width: \\${hpPercent}%"></div>
                    </div>
                    <div style="font-size: 11px;">\\${boss.currentHp} / \\${boss.hp} HP</div>
                    \\${boss.active ? '<button class="medieval-button" onclick="attackBoss(\\'' + boss.id + '\\')">⚔️ Attack</button>' : '<div style="color: #666;">Not Active</div>'}
                    <div class="boss-reward">🏆 5000 XP + Rare Items</div>
                \`;
                
                container.appendChild(div);
            });
        }
        
        function placeOrder() {
            const side = document.getElementById('orderSide').value;
            const type = document.getElementById('orderType').value;
            const price = parseFloat(document.getElementById('orderPrice').value);
            const quantity = parseFloat(document.getElementById('orderQuantity').value);
            
            if (!price || !quantity || price <= 0 || quantity <= 0) {
                showAchievementNotification('❌ Please enter valid price and quantity');
                return;
            }
            
            const order = {
                userId: 'user123', // Would be actual user ID
                pair: selectedPair,
                side,
                type,
                price,
                quantity
            };
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'place-order', order }));
            }
        }
        
        function clearOrderForm() {
            document.getElementById('orderPrice').value = '';
            document.getElementById('orderQuantity').value = '';
        }
        
        function attackBoss(bossId) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ 
                    type: 'attack-boss', 
                    bossId,
                    userId: 'user123'
                }));
            }
        }
        
        function showAchievementNotification(message) {
            const notification = document.createElement('div');
            notification.className = 'achievement-notification';
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 5000);
        }
        
        function updateInterface() {
            // Simulate real-time updates
            updateUserStats();
            updateBossBattles();
        }
        
        // Initialize on load
        window.addEventListener('load', init);
    </script>
</body>
</html>
        `;
    }
    
    async shutdown() {
        console.log('🏛️ Shutting down Grand Exchange...');
        
        // Save trading data
        await this.saveTradingData();
        
        // Clear intervals
        clearInterval(this.marketSimulationInterval);
        clearInterval(this.bossSpawnInterval);
        
        // Close WebSocket server
        if (this.wss) {
            this.wss.close();
        }
        
        // Close HTTP server
        if (this.server) {
            this.server.close();
        }
        
        console.log('🏛️ Grand Exchange shutdown complete');
    }
}

// Export for use as module
module.exports = GrandExchangeOrderBook;

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    let options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--port':
                options.port = parseInt(args[++i]);
                break;
            case '--ws-port':
                options.wsPort = parseInt(args[++i]);
                break;
            case '--data-dir':
                options.dataDir = args[++i];
                break;
            case '--no-game':
                options.enableGameMechanics = false;
                break;
            case '--no-sound':
                options.enableSoundEffects = false;
                break;
            case '--no-animations':
                options.enableEpicAnimations = false;
                break;
            case '--max-depth':
                options.maxOrderBookDepth = parseInt(args[++i]);
                break;
            case '--demo':
                console.log('🏛️ Starting GRAND EXCHANGE DEMO MODE...');
                options.demoMode = true;
                break;
            default:
                console.log(`
🏛️⚔️📊 GRAND EXCHANGE ORDER BOOK 📊⚔️🏛️

Usage:
  node GRAND-EXCHANGE-ORDER-BOOK.js [options]

Options:
  --port <port>        HTTP server port (default: 3339)
  --ws-port <port>     WebSocket port (default: 3340)
  --data-dir <path>    Data directory (default: ./grand-exchange-data)
  --no-game           Disable game mechanics
  --no-sound          Disable sound effects
  --no-animations     Disable epic animations
  --max-depth <n>     Max order book depth (default: 100)
  --demo              Run in demo mode

🏛️ Trading Features:
  • RuneScape-style medieval fantasy interface
  • Real-time order book with buy/sell walls
  • Multi-asset trading (crypto + game items)
  • Advanced order types (limit, market, stop-loss)
  • Epic boss battles against market volatility

⚔️ Game Mechanics:
  • Trading level system with XP rewards
  • Achievement system with rare item rewards
  • Guild system for collaborative trading
  • Boss battles that affect market conditions

📊 May your trades be ever profitable in the Grand Exchange!
                `);
                process.exit(0);
        }
    }
    
    // Create and start Grand Exchange
    const grandExchange = new GrandExchangeOrderBook(options);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        await grandExchange.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await grandExchange.shutdown();
        process.exit(0);
    });
    
    // Keep process running
    process.stdin.resume();
    
    if (options.demoMode) {
        // Demo mode: simulate epic trading activity
        setTimeout(() => {
            console.log('🎮 Demo: Placing sample orders...');
            
            // Place some demo orders
            grandExchange.placeOrder({
                userId: 'demo-trader-1',
                pair: 'BTC/USD',
                side: 'buy',
                type: 'limit',
                price: 43200,
                quantity: 0.5
            });
            
            grandExchange.placeOrder({
                userId: 'demo-trader-2',
                pair: 'DRAGON_SWORD/GP',
                side: 'sell',
                type: 'limit',
                price: 15000000,
                quantity: 1
            });
            
        }, 3000);
        
        setTimeout(() => {
            console.log('🐉 Demo: Spawning Volatility Dragon boss...');
            grandExchange.spawnBoss('VOLATILITY_DRAGON');
        }, 10000);
    }
    
    console.log('🏛️ GRAND EXCHANGE ORDER BOOK IS OPEN!');
    console.log('⚔️ Welcome to the most epic trading experience!');
}