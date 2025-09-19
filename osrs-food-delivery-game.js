#!/usr/bin/env node

/**
 * 🍕 OSRS-STYLE FOOD DELIVERY GAME
 * 
 * Complete RuneScape-style food delivery game with:
 * - Gnome Restaurant mechanics
 * - Grand Exchange food trading
 * - Cooking skill integration
 * - Real delivery data affects game economy
 */

const express = require('express');
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const LocalDeliveryArbitrageEngine = require('./local-delivery-arbitrage-engine');

class OSRSFoodDeliveryGame extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 6500,
            wsPort: config.wsPort || 6501,
            gameTickRate: config.gameTickRate || 600, // 0.6 seconds like OSRS
            ...config
        };
        
        // Initialize delivery engine
        this.deliveryEngine = new LocalDeliveryArbitrageEngine();
        
        // Game world state
        this.gameWorld = {
            players: new Map(),
            restaurants: new Map(),
            activeOrders: new Map(),
            grandExchange: new Map(),
            leaderboards: {
                totalDeliveries: [],
                fastestDelivery: [],
                highestTips: [],
                cookingLevel: []
            }
        };
        
        // OSRS-style areas
        this.gameAreas = {
            lumbridge: { 
                name: 'Lumbridge Kitchen', 
                level: 1, 
                npcs: ['Cook', 'Duke Horacio'],
                speciality: 'basic_meals'
            },
            varrock: { 
                name: 'Blue Moon Inn', 
                level: 10, 
                npcs: ['Bartender', 'King Roald'],
                speciality: 'pub_food'
            },
            falador: { 
                name: "Rising Sun Inn", 
                level: 20, 
                npcs: ['Emily', 'Sir Amik Varze'],
                speciality: 'hearty_meals'
            },
            ardougne: { 
                name: 'Flying Horse Inn', 
                level: 30, 
                npcs: ['Lucien', 'King Lathas'],
                speciality: 'exotic_cuisine'
            },
            gnome_stronghold: { 
                name: 'Grand Tree Restaurant', 
                level: 40, 
                npcs: ['King Narnode', 'Gnome Waiter'],
                speciality: 'gnome_delicacies'
            },
            prifddinas: { 
                name: 'Crystal Restaurant', 
                level: 75, 
                npcs: ['Lord Iorwerth', 'Elena'],
                speciality: 'elven_cuisine'
            }
        };
        
        // Food items with OSRS-style properties
        this.foodItems = {
            // Basic foods
            'shrimp': { level: 1, heal: 3, xp: 30, examineText: 'Some nicely cooked shrimp.' },
            'chicken': { level: 1, heal: 3, xp: 30, examineText: 'Freshly cooked chicken.' },
            'meat': { level: 1, heal: 3, xp: 30, examineText: 'Freshly cooked meat.' },
            
            // Intermediate foods
            'trout': { level: 15, heal: 7, xp: 70, examineText: 'Fresh trout from the river.' },
            'pizza': { level: 35, heal: 9, xp: 143, examineText: 'A cheese and tomato pizza.' },
            'meat_pizza': { level: 45, heal: 11, xp: 169, examineText: 'A meaty pizza.' },
            
            // High-level foods
            'lobster': { level: 40, heal: 12, xp: 120, examineText: 'A freshly cooked lobster.' },
            'swordfish': { level: 45, heal: 14, xp: 140, examineText: 'A nicely cooked swordfish.' },
            'monkfish': { level: 62, heal: 16, xp: 150, examineText: 'A tasty monkfish.' },
            'shark': { level: 80, heal: 20, xp: 210, examineText: 'A perfectly cooked shark.' },
            
            // Special foods (from real restaurants)
            'burger': { level: 48, heal: 18, xp: 180, examineText: 'A juicy burger from the real world.' },
            'sushi': { level: 65, heal: 22, xp: 220, examineText: 'Fresh sushi rolls.' },
            'taco': { level: 25, heal: 10, xp: 100, examineText: 'Spicy tacos!' },
            'pasta': { level: 55, heal: 20, xp: 200, examineText: 'Italian pasta perfection.' }
        };
        
        // Achievements (like OSRS diary tasks)
        this.achievements = {
            'first_delivery': { name: 'Novice Deliverer', points: 10, requirement: 'Complete 1 delivery' },
            'speed_demon': { name: 'Speed Demon', points: 25, requirement: 'Complete delivery in under 15 minutes' },
            'big_tipper': { name: 'Big Tipper', points: 50, requirement: 'Receive 100+ coins in tips' },
            'master_chef': { name: 'Master Chef', points: 100, requirement: 'Reach 99 Cooking' },
            'arbitrage_master': { name: 'Arbitrage Master', points: 75, requirement: 'Save $50 using platform arbitrage' },
            'gnome_friend': { name: 'Friend of the Gnomes', points: 50, requirement: 'Complete 25 gnome deliveries' }
        };
        
        // Game tick system
        this.gameTickInterval = null;
        this.currentTick = 0;
        
        // Statistics
        this.stats = {
            totalPlayers: 0,
            activeDeliveries: 0,
            totalDeliveries: 0,
            totalTips: 0,
            popularFood: new Map()
        };
        
        console.log('🍕 Initializing OSRS Food Delivery Game...');
        this.initialize();
    }
    
    async initialize() {
        // Initialize delivery engine
        await this.deliveryEngine.initialize();
        
        // Setup game server
        this.setupGameServer();
        
        // Setup WebSocket for real-time gameplay
        this.setupWebSocket();
        
        // Initialize Grand Exchange for food trading
        this.initializeGrandExchange();
        
        // Start game tick system
        this.startGameTick();
        
        // Connect real delivery data to game economy
        this.connectRealWorldData();
        
        console.log('✅ OSRS Food Delivery Game ready!');
        console.log(`🎮 Game Interface: http://localhost:${this.config.port}`);
        console.log(`📡 WebSocket: ws://localhost:${this.config.wsPort}`);
        
        this.emit('game_initialized');
    }
    
    setupGameServer() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Enable CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', '*');
            res.header('Access-Control-Allow-Methods', '*');
            next();
        });
        
        // Main game interface
        this.app.get('/', (req, res) => {
            res.send(this.renderGameInterface());
        });
        
        // Player endpoints
        this.app.post('/api/player/create', (req, res) => {
            const { username } = req.body;
            const player = this.createPlayer(username);
            res.json({ success: true, player });
        });
        
        this.app.get('/api/player/:id', (req, res) => {
            const player = this.gameWorld.players.get(req.params.id);
            res.json({ success: !!player, player });
        });
        
        // Quest/Order endpoints
        this.app.get('/api/quests/available', (req, res) => {
            const quests = this.deliveryEngine.getActiveQuests();
            res.json({ quests });
        });
        
        this.app.post('/api/quest/accept', (req, res) => {
            const { playerId, questId } = req.body;
            const result = this.deliveryEngine.acceptQuest(playerId, questId);
            res.json(result);
        });
        
        this.app.post('/api/quest/complete', (req, res) => {
            const { playerId, platformUsed } = req.body;
            const result = this.deliveryEngine.completeQuest(playerId, platformUsed);
            
            if (result.success) {
                this.updateGameWorld(playerId, result);
            }
            
            res.json(result);
        });
        
        // Grand Exchange endpoints
        this.app.get('/api/ge/offers', (req, res) => {
            const offers = Array.from(this.gameWorld.grandExchange.values());
            res.json({ offers });
        });
        
        this.app.post('/api/ge/offer', (req, res) => {
            const { playerId, itemName, quantity, price, type } = req.body;
            const offer = this.createGEOffer(playerId, itemName, quantity, price, type);
            res.json({ success: true, offer });
        });
        
        // Leaderboards
        this.app.get('/api/leaderboards', (req, res) => {
            res.json({ leaderboards: this.gameWorld.leaderboards });
        });
        
        // Real-time arbitrage opportunities
        this.app.get('/api/arbitrage/current', (req, res) => {
            const opportunities = this.deliveryEngine.getOpportunities();
            res.json({ opportunities });
        });
        
        this.app.listen(this.config.port, () => {
            console.log(`🎮 Game server running on port ${this.config.port}`);
        });
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🔗 Player connected to game');
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    await this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            // Send initial game state
            ws.send(JSON.stringify({
                type: 'game_state',
                areas: this.gameAreas,
                foodItems: this.foodItems,
                tick: this.currentTick
            }));
        });
        
        console.log(`📡 Game WebSocket listening on port ${this.config.wsPort}`);
    }
    
    async handleWebSocketMessage(ws, message) {
        switch (message.type) {
            case 'player_move':
                this.handlePlayerMovement(message.playerId, message.position);
                break;
                
            case 'start_delivery':
                const delivery = this.startDelivery(message.playerId, message.orderId);
                ws.send(JSON.stringify({
                    type: 'delivery_started',
                    delivery
                }));
                break;
                
            case 'cook_food':
                const result = this.cookFood(message.playerId, message.foodType);
                ws.send(JSON.stringify({
                    type: 'cooking_result',
                    result
                }));
                break;
                
            case 'chat':
                this.broadcastChat(message.playerId, message.text);
                break;
        }
    }
    
    createPlayer(username) {
        const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const player = {
            id: playerId,
            username: username,
            combatLevel: 3, // Classic OSRS starting level
            skills: {
                cooking: { level: 1, xp: 0 },
                delivery: { level: 1, xp: 0 }, // Custom skill for our game
                agility: { level: 1, xp: 0 }    // Affects delivery speed
            },
            position: { x: 3222, y: 3218 }, // Lumbridge spawn point
            area: 'lumbridge',
            inventory: [],
            equipment: {
                cape: null,
                head: null,
                neck: null,
                weapon: null,
                body: null,
                shield: null,
                legs: null,
                gloves: null,
                boots: null,
                ring: null,
                ammo: null
            },
            coins: 25, // Starting coins
            questPoints: 0,
            achievements: [],
            statistics: {
                deliveriesCompleted: 0,
                totalTipsEarned: 0,
                fastestDelivery: null,
                favoriteFood: null,
                totalCooked: 0
            },
            createdAt: Date.now()
        };
        
        this.gameWorld.players.set(playerId, player);
        this.stats.totalPlayers++;
        
        this.emit('player_created', player);
        
        return player;
    }
    
    initializeGrandExchange() {
        console.log('💰 Initializing Grand Exchange for food items...');
        
        // Seed initial GE offers based on food items
        for (const [itemName, itemData] of Object.entries(this.foodItems)) {
            // Create some initial sell offers
            for (let i = 0; i < 3; i++) {
                const price = Math.floor(itemData.level * 10 + Math.random() * 50);
                const quantity = Math.floor(Math.random() * 100) + 10;
                
                this.createGEOffer('system', itemName, quantity, price, 'sell');
            }
        }
        
        // Update GE prices based on real delivery data
        this.deliveryEngine.on('opportunities_found', (opportunities) => {
            this.updateGEPricesFromRealData(opportunities);
        });
    }
    
    createGEOffer(playerId, itemName, quantity, price, type) {
        const offerId = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const offer = {
            id: offerId,
            playerId: playerId,
            itemName: itemName,
            quantity: quantity,
            price: price,
            type: type, // 'buy' or 'sell'
            status: 'active',
            filled: 0,
            createdAt: Date.now()
        };
        
        this.gameWorld.grandExchange.set(offerId, offer);
        
        // Try to match offers
        this.matchGEOffers(offer);
        
        return offer;
    }
    
    matchGEOffers(newOffer) {
        // Simple order matching like OSRS GE
        for (const [offerId, offer] of this.gameWorld.grandExchange) {
            if (offer.id === newOffer.id) continue;
            if (offer.itemName !== newOffer.itemName) continue;
            if (offer.type === newOffer.type) continue;
            if (offer.status !== 'active') continue;
            
            // Check if prices match
            if ((newOffer.type === 'buy' && offer.price <= newOffer.price) ||
                (newOffer.type === 'sell' && offer.price >= newOffer.price)) {
                
                // Execute trade
                const tradeQuantity = Math.min(
                    offer.quantity - offer.filled,
                    newOffer.quantity - newOffer.filled
                );
                
                offer.filled += tradeQuantity;
                newOffer.filled += tradeQuantity;
                
                if (offer.filled >= offer.quantity) {
                    offer.status = 'completed';
                }
                
                if (newOffer.filled >= newOffer.quantity) {
                    newOffer.status = 'completed';
                }
                
                console.log(`💰 GE Trade: ${tradeQuantity}x ${offer.itemName} @ ${offer.price}gp`);
                
                // Transfer items and coins
                this.executeGETrade(offer, newOffer, tradeQuantity, offer.price);
                
                if (newOffer.status === 'completed') break;
            }
        }
    }
    
    executeGETrade(offer1, offer2, quantity, price) {
        const buyOffer = offer1.type === 'buy' ? offer1 : offer2;
        const sellOffer = offer1.type === 'sell' ? offer1 : offer2;
        
        const buyer = this.gameWorld.players.get(buyOffer.playerId);
        const seller = this.gameWorld.players.get(sellOffer.playerId);
        
        if (buyer) {
            buyer.coins -= quantity * price;
            // Add items to inventory
            for (let i = 0; i < quantity; i++) {
                buyer.inventory.push({
                    name: buyOffer.itemName,
                    ...this.foodItems[buyOffer.itemName]
                });
            }
        }
        
        if (seller) {
            seller.coins += quantity * price;
            // Items already removed when offer was created
        }
        
        this.emit('ge_trade_executed', {
            item: buyOffer.itemName,
            quantity,
            price,
            buyer: buyOffer.playerId,
            seller: sellOffer.playerId
        });
    }
    
    updateGEPricesFromRealData(opportunities) {
        // Map real restaurant types to game food items
        const foodMapping = {
            'pizza': 'meat_pizza',
            'burger': 'burger',
            'sushi': 'sushi',
            'tacos': 'taco',
            'chinese': 'monkfish',
            'pasta': 'pasta'
        };
        
        for (const opp of opportunities) {
            const restaurantType = this.getRestaurantType(opp.restaurant);
            const gameFood = foodMapping[restaurantType];
            
            if (gameFood) {
                // Adjust GE prices based on real-world demand
                const priceMultiplier = 1 + (opp.savingsPercent / 100);
                
                // Update system offers
                for (const [offerId, offer] of this.gameWorld.grandExchange) {
                    if (offer.itemName === gameFood && offer.playerId === 'system') {
                        offer.price = Math.floor(offer.price * priceMultiplier);
                    }
                }
            }
        }
    }
    
    getRestaurantType(restaurantName) {
        const name = restaurantName.toLowerCase();
        if (name.includes('pizza')) return 'pizza';
        if (name.includes('burger')) return 'burger';
        if (name.includes('sushi')) return 'sushi';
        if (name.includes('taco')) return 'tacos';
        if (name.includes('chinese')) return 'chinese';
        if (name.includes('pasta') || name.includes('italian')) return 'pasta';
        return 'chicken';
    }
    
    startDelivery(playerId, orderId) {
        const player = this.gameWorld.players.get(playerId);
        if (!player) return null;
        
        // Create delivery tracking
        const delivery = {
            id: `delivery_${Date.now()}`,
            playerId: playerId,
            orderId: orderId,
            startTime: Date.now(),
            startPosition: { ...player.position },
            status: 'in_progress',
            route: this.calculateDeliveryRoute(player.position, orderId)
        };
        
        this.gameWorld.activeOrders.set(delivery.id, delivery);
        this.stats.activeDeliveries++;
        
        return delivery;
    }
    
    calculateDeliveryRoute(playerPos, orderId) {
        // Simple pathfinding for delivery route
        // In real implementation would use A* or similar
        return [
            playerPos,
            { x: playerPos.x + 10, y: playerPos.y },
            { x: playerPos.x + 10, y: playerPos.y + 10 },
            { x: playerPos.x, y: playerPos.y + 10 }
        ];
    }
    
    cookFood(playerId, foodType) {
        const player = this.gameWorld.players.get(playerId);
        if (!player) return { success: false, error: 'Player not found' };
        
        const food = this.foodItems[foodType];
        if (!food) return { success: false, error: 'Unknown food type' };
        
        if (player.skills.cooking.level < food.level) {
            return {
                success: false,
                error: `You need level ${food.level} Cooking to make ${foodType}`
            };
        }
        
        // Cooking success rate based on level
        const successRate = Math.min(0.95, 0.5 + (player.skills.cooking.level / 200));
        const success = Math.random() < successRate;
        
        if (success) {
            // Add cooked food to inventory
            player.inventory.push({
                name: foodType,
                ...food,
                cookedBy: playerId,
                cookedAt: Date.now()
            });
            
            // Grant XP
            player.skills.cooking.xp += food.xp;
            const newLevel = this.calculateSkillLevel(player.skills.cooking.xp);
            if (newLevel > player.skills.cooking.level) {
                player.skills.cooking.level = newLevel;
                this.emit('level_up', {
                    playerId,
                    skill: 'cooking',
                    newLevel
                });
            }
            
            player.statistics.totalCooked++;
            
            return {
                success: true,
                message: `You successfully cook the ${foodType}.`,
                xpGained: food.xp
            };
        } else {
            return {
                success: false,
                message: `You burn the ${foodType}.`,
                xpGained: Math.floor(food.xp * 0.3) // Still get some XP
            };
        }
    }
    
    calculateSkillLevel(xp) {
        // OSRS leveling formula
        let level = 1;
        let points = 0;
        
        for (let lvl = 1; lvl < 99; lvl++) {
            points += Math.floor(lvl + 300 * Math.pow(2, lvl / 7));
            if (points / 4 > xp) {
                return lvl;
            }
            level = lvl + 1;
        }
        
        return Math.min(99, level);
    }
    
    handlePlayerMovement(playerId, newPosition) {
        const player = this.gameWorld.players.get(playerId);
        if (!player) return;
        
        player.position = newPosition;
        
        // Check if player entered new area
        const newArea = this.getAreaFromPosition(newPosition);
        if (newArea !== player.area) {
            player.area = newArea;
            this.emit('player_area_change', {
                playerId,
                oldArea: player.area,
                newArea
            });
        }
        
        // Broadcast position to nearby players
        this.broadcastPlayerPosition(playerId, newPosition);
    }
    
    getAreaFromPosition(position) {
        // Simplified area detection
        // In real implementation would use proper coordinate ranges
        if (position.x < 3250 && position.y < 3250) return 'lumbridge';
        if (position.x < 3300 && position.y < 3400) return 'varrock';
        if (position.x < 3000 && position.y < 3400) return 'falador';
        return 'wilderness'; // Default dangerous area
    }
    
    broadcastPlayerPosition(playerId, position) {
        const message = JSON.stringify({
            type: 'player_position_update',
            playerId,
            position,
            timestamp: Date.now()
        });
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    broadcastChat(playerId, text) {
        const player = this.gameWorld.players.get(playerId);
        if (!player) return;
        
        const message = JSON.stringify({
            type: 'chat_message',
            playerId,
            username: player.username,
            text: text.slice(0, 80), // Limit chat length
            timestamp: Date.now()
        });
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    startGameTick() {
        // OSRS-style game tick system (0.6 seconds)
        this.gameTickInterval = setInterval(() => {
            this.currentTick++;
            this.processGameTick();
        }, this.config.gameTickRate);
    }
    
    processGameTick() {
        // Process active deliveries
        for (const [deliveryId, delivery] of this.gameWorld.activeOrders) {
            if (delivery.status === 'in_progress') {
                // Check if delivery should complete
                const timeElapsed = Date.now() - delivery.startTime;
                if (timeElapsed > 30000) { // 30 seconds for testing
                    delivery.status = 'completed';
                    this.completeDelivery(deliveryId);
                }
            }
        }
        
        // Random events (like OSRS random events)
        if (this.currentTick % 100 === 0) {
            this.triggerRandomEvent();
        }
        
        // Update leaderboards every 50 ticks
        if (this.currentTick % 50 === 0) {
            this.updateLeaderboards();
        }
    }
    
    completeDelivery(deliveryId) {
        const delivery = this.gameWorld.activeOrders.get(deliveryId);
        if (!delivery) return;
        
        const player = this.gameWorld.players.get(delivery.playerId);
        if (!player) return;
        
        const timeElapsed = Date.now() - delivery.startTime;
        const tips = Math.floor(Math.random() * 50) + 10;
        
        player.statistics.deliveriesCompleted++;
        player.statistics.totalTipsEarned += tips;
        
        if (!player.statistics.fastestDelivery || timeElapsed < player.statistics.fastestDelivery) {
            player.statistics.fastestDelivery = timeElapsed;
        }
        
        this.stats.totalDeliveries++;
        this.stats.totalTips += tips;
        
        this.emit('delivery_completed', {
            deliveryId,
            playerId: delivery.playerId,
            timeElapsed,
            tips
        });
        
        this.gameWorld.activeOrders.delete(deliveryId);
        this.stats.activeDeliveries--;
    }
    
    triggerRandomEvent() {
        // OSRS-style random events adapted for food delivery
        const events = [
            {
                name: 'Hungry Troll',
                message: 'A hungry troll blocks your path! Give him food or fight!',
                options: ['Give food', 'Fight', 'Run away']
            },
            {
                name: 'Mystery Box',
                message: 'You found a mystery food box!',
                reward: () => {
                    const foods = Object.keys(this.foodItems);
                    return foods[Math.floor(Math.random() * foods.length)];
                }
            },
            {
                name: 'Double Tips',
                message: 'Happy customer! Your next delivery gets double tips!',
                effect: 'double_tips'
            }
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        
        // Pick random online player
        const players = Array.from(this.gameWorld.players.values());
        if (players.length > 0) {
            const player = players[Math.floor(Math.random() * players.length)];
            
            this.emit('random_event', {
                playerId: player.id,
                event
            });
        }
    }
    
    updateLeaderboards() {
        // Update various leaderboards
        const players = Array.from(this.gameWorld.players.values());
        
        // Total deliveries leaderboard
        this.gameWorld.leaderboards.totalDeliveries = players
            .sort((a, b) => b.statistics.deliveriesCompleted - a.statistics.deliveriesCompleted)
            .slice(0, 10)
            .map(p => ({
                username: p.username,
                value: p.statistics.deliveriesCompleted
            }));
        
        // Cooking level leaderboard
        this.gameWorld.leaderboards.cookingLevel = players
            .sort((a, b) => b.skills.cooking.level - a.skills.cooking.level)
            .slice(0, 10)
            .map(p => ({
                username: p.username,
                value: p.skills.cooking.level
            }));
    }
    
    connectRealWorldData() {
        // Connect real delivery data to game events
        this.deliveryEngine.on('opportunities_found', (opportunities) => {
            // Create special in-game events based on real arbitrage
            for (const opp of opportunities.slice(0, 3)) { // Top 3 opportunities
                this.createSpecialDeliveryQuest(opp);
            }
        });
        
        this.deliveryEngine.on('trends_updated', (trends) => {
            // Update food demand in game based on real trends
            for (const trend of trends) {
                this.updateFoodDemand(trend);
            }
        });
    }
    
    createSpecialDeliveryQuest(arbitrageOpp) {
        // Create special quest based on real arbitrage opportunity
        const quest = {
            id: `special_${Date.now()}`,
            name: `${arbitrageOpp.restaurant} Rush Order`,
            description: `Deliver from ${arbitrageOpp.cheapestPlatform} to save ${arbitrageOpp.savings.toFixed(2)}!`,
            rewards: {
                coins: Math.floor(arbitrageOpp.savings * 100),
                xp: Math.floor(arbitrageOpp.savingsPercent * 10),
                special: true
            },
            realWorldData: arbitrageOpp,
            expiresAt: arbitrageOpp.validUntil
        };
        
        this.emit('special_quest_available', quest);
    }
    
    updateFoodDemand(trend) {
        // Map trending items to game foods
        const trendMapping = {
            'korean_bbq': 'monkfish',
            'plant_based': 'salad',
            'breakfast_burrito': 'taco',
            'ghost_kitchen': 'shark'
        };
        
        const gameFood = trendMapping[trend.item];
        if (gameFood && this.foodItems[gameFood]) {
            // Increase GE prices for trending items
            for (const [offerId, offer] of this.gameWorld.grandExchange) {
                if (offer.itemName === gameFood && offer.type === 'sell') {
                    offer.price = Math.floor(offer.price * trend.multiplier);
                }
            }
            
            console.log(`📈 ${gameFood} prices increased due to ${trend.source} trend!`);
        }
    }
    
    updateGameWorld(playerId, questResult) {
        const player = this.gameWorld.players.get(playerId);
        if (!player) return;
        
        // Update player with quest rewards
        player.coins += questResult.rewards.coins;
        player.skills.delivery.xp += questResult.rewards.xp;
        
        // Check for level ups
        const newDeliveryLevel = this.calculateSkillLevel(player.skills.delivery.xp);
        if (newDeliveryLevel > player.skills.delivery.level) {
            player.skills.delivery.level = newDeliveryLevel;
            
            this.emit('level_up', {
                playerId,
                skill: 'delivery',
                newLevel: newDeliveryLevel
            });
        }
        
        // Check achievements
        this.checkAchievements(player);
    }
    
    checkAchievements(player) {
        for (const [achievementId, achievement] of Object.entries(this.achievements)) {
            if (player.achievements.includes(achievementId)) continue;
            
            let earned = false;
            
            switch (achievementId) {
                case 'first_delivery':
                    earned = player.statistics.deliveriesCompleted >= 1;
                    break;
                case 'master_chef':
                    earned = player.skills.cooking.level >= 99;
                    break;
                case 'big_tipper':
                    earned = player.statistics.totalTipsEarned >= 100;
                    break;
            }
            
            if (earned) {
                player.achievements.push(achievementId);
                player.questPoints += achievement.points;
                
                this.emit('achievement_earned', {
                    playerId: player.id,
                    achievement: achievement
                });
            }
        }
    }
    
    renderGameInterface() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🍕 OSRS Food Delivery</title>
    <style>
        @font-face {
            font-family: 'RuneScape';
            src: url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        }
        
        body {
            margin: 0;
            padding: 0;
            background: #3e3e3e;
            color: #ffff00;
            font-family: 'Courier New', monospace;
            image-rendering: pixelated;
        }
        
        .game-container {
            display: grid;
            grid-template-columns: 200px 1fr 300px;
            height: 100vh;
        }
        
        .sidebar {
            background: #494949;
            border: 3px solid #000;
            border-radius: 5px;
            margin: 5px;
            padding: 10px;
        }
        
        .main-view {
            background: #000;
            border: 3px solid #000;
            border-radius: 5px;
            margin: 5px;
            position: relative;
            overflow: hidden;
        }
        
        .chat-panel {
            background: #494949;
            border: 3px solid #000;
            border-radius: 5px;
            margin: 5px;
            padding: 10px;
            display: flex;
            flex-direction: column;
        }
        
        .skill-box {
            background: #5a5a5a;
            border: 2px solid #000;
            border-radius: 3px;
            padding: 5px;
            margin: 5px 0;
            text-align: center;
        }
        
        .skill-box:hover {
            background: #6a6a6a;
            cursor: pointer;
        }
        
        .skill-level {
            font-size: 20px;
            font-weight: bold;
            color: #00ff00;
        }
        
        .quest-list {
            background: #5a5a5a;
            border: 2px solid #000;
            border-radius: 3px;
            padding: 10px;
            margin: 10px 0;
            max-height: 300px;
            overflow-y: auto;
        }
        
        .quest-item {
            background: #4a4a4a;
            border: 1px solid #000;
            padding: 5px;
            margin: 5px 0;
            cursor: pointer;
        }
        
        .quest-item:hover {
            background: #5a5a5a;
        }
        
        .quest-item.special {
            border-color: #ff6600;
            background: #5a3a3a;
        }
        
        .ge-panel {
            background: #5a5a5a;
            border: 2px solid #000;
            border-radius: 3px;
            padding: 10px;
            margin: 10px 0;
        }
        
        .ge-offer {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            padding: 3px;
            border-bottom: 1px solid #333;
        }
        
        .ge-offer.buy { color: #00ff00; }
        .ge-offer.sell { color: #ff0000; }
        
        .inventory-grid {
            display: grid;
            grid-template-columns: repeat(4, 40px);
            gap: 2px;
            margin: 10px 0;
        }
        
        .inventory-slot {
            width: 40px;
            height: 40px;
            background: #3a3a3a;
            border: 1px solid #000;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
        }
        
        .inventory-slot:hover {
            background: #4a4a4a;
        }
        
        .inventory-slot img {
            width: 32px;
            height: 32px;
        }
        
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            background: #3a3a3a;
            border: 1px solid #000;
            padding: 5px;
            margin-bottom: 10px;
        }
        
        .chat-message {
            margin: 2px 0;
            font-size: 12px;
        }
        
        .chat-input {
            background: #2a2a2a;
            border: 1px solid #000;
            color: #ffff00;
            padding: 5px;
            width: 100%;
        }
        
        .minimap {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 150px;
            height: 150px;
            background: #1a1a1a;
            border: 2px solid #000;
            border-radius: 50%;
        }
        
        .player-dot {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #ff0000;
            border-radius: 50%;
            transform: translate(-50%, -50%);
        }
        
        .button-osrs {
            background: #5a5a5a;
            border: 2px solid #000;
            color: #ffff00;
            padding: 5px 10px;
            cursor: pointer;
            margin: 5px;
            font-family: inherit;
        }
        
        .button-osrs:hover {
            background: #6a6a6a;
        }
        
        .achievement-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #4a4a4a;
            border: 3px solid #ffff00;
            padding: 20px;
            text-align: center;
            z-index: 1000;
            animation: popup 0.3s ease-out;
        }
        
        @keyframes popup {
            from {
                transform: translate(-50%, -50%) scale(0);
            }
            to {
                transform: translate(-50%, -50%) scale(1);
            }
        }
        
        .level-up {
            color: #00ff00;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 2px 2px #000;
        }
    </style>
</head>
<body>
    <div class="game-container">
        <!-- Left Sidebar - Skills -->
        <div class="sidebar">
            <h3>Skills</h3>
            <div class="skill-box">
                <img src="/icons/cooking.png" width="20" alt="Cooking">
                <div>Cooking</div>
                <div class="skill-level" id="cooking-level">1</div>
            </div>
            <div class="skill-box">
                <img src="/icons/delivery.png" width="20" alt="Delivery">
                <div>Delivery</div>
                <div class="skill-level" id="delivery-level">1</div>
            </div>
            <div class="skill-box">
                <img src="/icons/agility.png" width="20" alt="Agility">
                <div>Agility</div>
                <div class="skill-level" id="agility-level">1</div>
            </div>
            
            <h3>Stats</h3>
            <div>Coins: <span id="coins">25</span>gp</div>
            <div>Quest Points: <span id="qp">0</span></div>
            <div>Deliveries: <span id="deliveries">0</span></div>
            
            <h3>Inventory</h3>
            <div class="inventory-grid" id="inventory">
                <!-- 28 slots like OSRS -->
            </div>
        </div>
        
        <!-- Main Game View -->
        <div class="main-view" id="game-view">
            <canvas id="game-canvas" width="800" height="600"></canvas>
            <div class="minimap">
                <div class="player-dot" style="top: 50%; left: 50%;"></div>
            </div>
        </div>
        
        <!-- Right Panel - Quests/GE/Chat -->
        <div class="chat-panel">
            <h3>Food Delivery Quests</h3>
            <div class="quest-list" id="quest-list">
                <!-- Quests populate here -->
            </div>
            
            <h3>Grand Exchange</h3>
            <div class="ge-panel">
                <div class="ge-offer">
                    <span>Item</span>
                    <span>Qty</span>
                    <span>Price</span>
                    <span>Type</span>
                </div>
                <div id="ge-offers">
                    <!-- GE offers populate here -->
                </div>
                <button class="button-osrs" onclick="openGE()">Trade</button>
            </div>
            
            <h3>Chat</h3>
            <div class="chat-messages" id="chat">
                <div class="chat-message" style="color: #ff0000;">Welcome to OSRS Food Delivery!</div>
            </div>
            <input type="text" class="chat-input" id="chat-input" placeholder="Press Enter to chat..." onkeypress="handleChat(event)">
        </div>
    </div>
    
    <script>
        let ws;
        let playerId = null;
        let gameState = {};
        
        // Initialize WebSocket connection
        function initWebSocket() {
            ws = new WebSocket('ws://localhost:${this.config.wsPort}');
            
            ws.onopen = () => {
                console.log('Connected to game server');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleGameMessage(data);
            };
            
            ws.onclose = () => {
                console.log('Disconnected from game server');
                setTimeout(initWebSocket, 3000);
            };
        }
        
        function handleGameMessage(data) {
            switch (data.type) {
                case 'game_state':
                    gameState = data;
                    updateUI();
                    break;
                    
                case 'quest_available':
                    addQuestToList(data.quest);
                    break;
                    
                case 'chat_message':
                    addChatMessage(data.username + ': ' + data.text);
                    break;
                    
                case 'level_up':
                    showLevelUp(data.skill, data.newLevel);
                    break;
                    
                case 'achievement_earned':
                    showAchievement(data.achievement);
                    break;
            }
        }
        
        async function createPlayer() {
            const username = prompt('Enter your username:');
            if (!username) return;
            
            const response = await fetch('/api/player/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            
            const data = await response.json();
            if (data.success) {
                playerId = data.player.id;
                localStorage.setItem('playerId', playerId);
                loadQuests();
                loadGEOffers();
            }
        }
        
        async function loadQuests() {
            const response = await fetch('/api/quests/available');
            const data = await response.json();
            
            const questList = document.getElementById('quest-list');
            questList.innerHTML = '';
            
            data.quests.forEach(quest => {
                addQuestToList(quest);
            });
        }
        
        function addQuestToList(quest) {
            const questList = document.getElementById('quest-list');
            const questDiv = document.createElement('div');
            questDiv.className = quest.arbitrageBonus ? 'quest-item special' : 'quest-item';
            questDiv.innerHTML = \`
                <strong>\${quest.name}</strong><br>
                \${quest.npc.name}: "\${quest.dialogue}"<br>
                Reward: \${quest.rewards.xp} XP, \${quest.rewards.coins}gp
                \${quest.arbitrageBonus ? '<br><em>Save $' + quest.arbitrageBonus.savings.toFixed(2) + ' with ' + quest.arbitrageBonus.platform + '!</em>' : ''}
            \`;
            questDiv.onclick = () => acceptQuest(quest.id);
            questList.appendChild(questDiv);
        }
        
        async function acceptQuest(questId) {
            if (!playerId) {
                alert('Please create a player first!');
                return;
            }
            
            const response = await fetch('/api/quest/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId, questId })
            });
            
            const data = await response.json();
            if (data.success) {
                addChatMessage(data.message);
                loadQuests();
            } else {
                alert(data.error);
            }
        }
        
        async function loadGEOffers() {
            const response = await fetch('/api/ge/offers');
            const data = await response.json();
            
            const geDiv = document.getElementById('ge-offers');
            geDiv.innerHTML = '';
            
            data.offers.filter(o => o.status === 'active').forEach(offer => {
                const offerDiv = document.createElement('div');
                offerDiv.className = 'ge-offer ' + offer.type;
                offerDiv.innerHTML = \`
                    <span>\${offer.itemName}</span>
                    <span>\${offer.quantity}</span>
                    <span>\${offer.price}gp</span>
                    <span>\${offer.type}</span>
                \`;
                geDiv.appendChild(offerDiv);
            });
        }
        
        function addChatMessage(message) {
            const chat = document.getElementById('chat');
            const msgDiv = document.createElement('div');
            msgDiv.className = 'chat-message';
            msgDiv.textContent = message;
            chat.appendChild(msgDiv);
            chat.scrollTop = chat.scrollHeight;
        }
        
        function handleChat(event) {
            if (event.key === 'Enter' && ws && ws.readyState === WebSocket.OPEN) {
                const input = document.getElementById('chat-input');
                const text = input.value.trim();
                if (text) {
                    ws.send(JSON.stringify({
                        type: 'chat',
                        playerId,
                        text
                    }));
                    input.value = '';
                }
            }
        }
        
        function showLevelUp(skill, newLevel) {
            const popup = document.createElement('div');
            popup.className = 'achievement-popup';
            popup.innerHTML = \`
                <div class="level-up">LEVEL UP!</div>
                <div>\${skill} is now level \${newLevel}!</div>
            \`;
            document.body.appendChild(popup);
            
            setTimeout(() => {
                popup.remove();
            }, 3000);
            
            updateSkillLevel(skill, newLevel);
        }
        
        function showAchievement(achievement) {
            const popup = document.createElement('div');
            popup.className = 'achievement-popup';
            popup.innerHTML = \`
                <div style="color: #ffff00; font-size: 18px;">Achievement Unlocked!</div>
                <div>\${achievement.name}</div>
                <div style="font-size: 12px;">\${achievement.requirement}</div>
                <div>+\${achievement.points} Quest Points</div>
            \`;
            document.body.appendChild(popup);
            
            setTimeout(() => {
                popup.remove();
            }, 4000);
        }
        
        function updateSkillLevel(skill, level) {
            const element = document.getElementById(skill + '-level');
            if (element) {
                element.textContent = level;
            }
        }
        
        function updateUI() {
            // Update UI based on game state
            // This would be more complex in full implementation
        }
        
        function openGE() {
            // Open Grand Exchange interface
            alert('Grand Exchange coming soon!');
        }
        
        // Initialize game
        window.onload = () => {
            initWebSocket();
            
            // Check for existing player
            const savedPlayerId = localStorage.getItem('playerId');
            if (savedPlayerId) {
                playerId = savedPlayerId;
                loadQuests();
                loadGEOffers();
            } else {
                createPlayer();
            }
            
            // Setup game canvas
            const canvas = document.getElementById('game-canvas');
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#3e3e3e';
            ctx.fillRect(0, 0, 800, 600);
            ctx.fillStyle = '#ffff00';
            ctx.font = '20px Courier New';
            ctx.fillText('OSRS Food Delivery - Game World Loading...', 200, 300);
            
            // Auto-refresh quests and GE
            setInterval(loadQuests, 30000);
            setInterval(loadGEOffers, 20000);
        };
    </script>
</body>
</html>`;
    }
    
    getStatus() {
        return {
            players: this.gameWorld.players.size,
            activeDeliveries: this.stats.activeDeliveries,
            totalDeliveries: this.stats.totalDeliveries,
            grandExchangeOffers: this.gameWorld.grandExchange.size,
            currentTick: this.currentTick
        };
    }
}

module.exports = OSRSFoodDeliveryGame;

// Run if executed directly
if (require.main === module) {
    const game = new OSRSFoodDeliveryGame();
    
    // Show game stats every minute
    setInterval(() => {
        const status = game.getStatus();
        console.log('\n🎮 GAME STATUS:');
        console.log(`   Players: ${status.players}`);
        console.log(`   Active Deliveries: ${status.activeDeliveries}`);
        console.log(`   Total Deliveries: ${status.totalDeliveries}`);
        console.log(`   GE Offers: ${status.grandExchangeOffers}`);
        console.log(`   Game Tick: ${status.currentTick}`);
    }, 60000);
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down OSRS Food Delivery Game...');
        clearInterval(game.gameTickInterval);
        process.exit(0);
    });
}