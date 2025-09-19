#!/usr/bin/env node

// RUNESCAPE ECONOMY XML MAPPER
// Transform the 4-AI reasoning system into a live RuneScape Grand Exchange economy view
// Watch AIs trade, craft, and manipulate the economy in real-time!

const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

class RuneScapeEconomyMapper {
    constructor() {
        this.systemId = `RSECONOMY-${Date.now()}`;
        
        // RuneScape Economy Data
        this.grandExchange = {
            items: new Map(),
            transactions: [],
            players: new Map(),
            marketTrends: new Map(),
            activeOffers: []
        };
        
        // 4 AI Traders (replacing the reasoning engines)
        this.aiTraders = {
            merchant: {
                name: 'AI_MERCHANT',
                color: '\x1b[33m', // Yellow (Gold coins)
                specialty: 'Bulk Trading & Market Manipulation',
                personality: 'Calculative profit maximizer',
                gp: 1000000000, // 1B GP starting
                inventory: new Map(),
                activeOffers: [],
                tradingStrategy: 'buy_low_sell_high',
                currentAction: 'Analyzing market trends...'
            },
            crafter: {
                name: 'AI_CRAFTER',
                color: '\x1b[36m', // Cyan (Smithing)
                specialty: 'Production & Resource Processing',
                personality: 'Efficient resource optimizer',
                gp: 500000000, // 500M GP
                inventory: new Map(),
                activeOffers: [],
                tradingStrategy: 'vertical_integration',
                currentAction: 'Calculating production costs...'
            },
            flipper: {
                name: 'AI_FLIPPER',
                color: '\x1b[35m', // Magenta (Quick profits)
                specialty: 'High-Frequency Trading & Arbitrage',
                personality: 'Fast-paced opportunist',
                gp: 200000000, // 200M GP
                inventory: new Map(),
                activeOffers: [],
                tradingStrategy: 'margin_flipping',
                currentAction: 'Scanning for flip opportunities...'
            },
            investor: {
                name: 'AI_INVESTOR',
                color: '\x1b[32m', // Green (Long-term growth)
                specialty: 'Long-term Investments & Merching',
                personality: 'Patient wealth accumulator',
                gp: 2000000000, // 2B GP
                inventory: new Map(),
                activeOffers: [],
                tradingStrategy: 'long_term_holds',
                currentAction: 'Researching upcoming updates...'
            }
        };
        
        // RuneScape Items Database
        this.itemDatabase = {
            // Combat Equipment
            'Twisted bow': { id: 20997, category: 'Weapons', basePrice: 1200000000, volatility: 0.15 },
            'Scythe of vitur': { id: 22325, category: 'Weapons', basePrice: 800000000, volatility: 0.12 },
            'Bandos chestplate': { id: 11832, category: 'Armour', basePrice: 25000000, volatility: 0.08 },
            'Armadyl crossbow': { id: 11785, category: 'Weapons', basePrice: 45000000, volatility: 0.10 },
            
            // Resources
            'Runite ore': { id: 451, category: 'Mining', basePrice: 12000, volatility: 0.05 },
            'Magic logs': { id: 1513, category: 'Woodcutting', basePrice: 1100, volatility: 0.03 },
            'Dragon bones': { id: 536, category: 'Prayer', basePrice: 2800, volatility: 0.04 },
            'Shark': { id: 385, category: 'Food', basePrice: 900, volatility: 0.02 },
            
            // Crafting Materials
            'Gold ore': { id: 444, category: 'Mining', basePrice: 300, volatility: 0.06 },
            'Pure essence': { id: 7936, category: 'Runecrafting', basePrice: 4, volatility: 0.08 },
            'Vial of water': { id: 227, category: 'Herblore', basePrice: 15, volatility: 0.15 },
            'Feather': { id: 314, category: 'Fletching', basePrice: 8, volatility: 0.20 },
            
            // Rare Items
            'Third age platebody': { id: 10348, category: 'Rare', basePrice: 2100000000, volatility: 0.25 },
            'Elysian spirit shield': { id: 12817, category: 'Shields', basePrice: 750000000, volatility: 0.18 },
            'Harmonised orb': { id: 24423, category: 'Magic', basePrice: 180000000, volatility: 0.20 }
        };
        
        // Market Manipulation Events
        this.marketEvents = [
            'Game update announced - prices fluctuating',
            'Rare drop table changed - investors panicking',
            'New boss released - combat gear spiking',
            'Double XP weekend announced - supplies rising',
            'Merch clan coordinating pump and dump',
            'Streamer recommendation causing item surge',
            'Bug fix affecting drop rates - market chaos',
            'PvP tournament announced - PKing gear rising'
        ];
        
        // XML Stream
        this.xmlStream = {
            active: true,
            buffer: [],
            subscribers: new Set()
        };
        
        this.initializeEconomy();
    }
    
    initializeEconomy() {
        console.clear();
        this.displayWelcome();
        this.setupWebSocketServer();
        this.startEconomicSimulation();
        this.startXMLGeneration();
        this.displayLiveEconomy();
    }
    
    displayWelcome() {
        console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║        🏰 RUNESCAPE GRAND EXCHANGE XML ECONOMY MAPPER 🏰        ║
║                                                                  ║
║   Watch 4 AI traders battle for GP supremacy in real-time!      ║
║   Every transaction mapped to XML for maximum visibility         ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

🤖 AI TRADERS:
  ${this.aiTraders.merchant.color}AI_MERCHANT${'\x1b[0m'} - Bulk trading with ${this.formatGP(this.aiTraders.merchant.gp)} GP
  ${this.aiTraders.crafter.color}AI_CRAFTER${'\x1b[0m'} - Production chain with ${this.formatGP(this.aiTraders.crafter.gp)} GP  
  ${this.aiTraders.flipper.color}AI_FLIPPER${'\x1b[0m'} - High-frequency trading with ${this.formatGP(this.aiTraders.flipper.gp)} GP
  ${this.aiTraders.investor.color}AI_INVESTOR${'\x1b[0m'} - Long-term investing with ${this.formatGP(this.aiTraders.investor.gp)} GP

📊 LIVE FEATURES:
  • Real-time Grand Exchange price tracking
  • AI trading strategy visualization  
  • Market manipulation detection
  • XML transaction streaming
  • WebSocket live updates

🌐 Access Points:
  • Economy Dashboard: http://localhost:9999/economy
  • XML Stream: http://localhost:9999/xml
  • WebSocket: ws://localhost:9998
  • Live Trader View: Terminal below

`);
        
        // Initialize item prices
        Object.entries(this.itemDatabase).forEach(([name, data]) => {
            this.grandExchange.items.set(name, {
                ...data,
                currentPrice: data.basePrice,
                volume: 0,
                buyers: 0,
                sellers: 0,
                trend: 'stable',
                lastUpdate: Date.now()
            });
        });
    }
    
    formatGP(amount) {
        if (amount >= 1000000000) return `${(amount / 1000000000).toFixed(1)}B`;
        if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
        return amount.toString();
    }
    
    setupWebSocketServer() {
        // HTTP Server for dashboard
        this.server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            
            if (req.url === '/economy') {
                this.serveEconomyDashboard(res);
            } else if (req.url === '/xml') {
                this.serveXMLStream(res);
            } else {
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('RuneScape Economy Mapper - Use /economy or /xml endpoints');
            }
        });
        
        this.server.listen(9999, () => {
            console.log('📡 Economy server listening on http://localhost:9999');
        });
        
        // WebSocket for real-time updates
        this.wss = new WebSocket.Server({ port: 9998 });
        this.wss.on('connection', (ws) => {
            console.log('🔌 New WebSocket connection established');
            this.xmlStream.subscribers.add(ws);
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'INITIAL_STATE',
                traders: this.aiTraders,
                items: Array.from(this.grandExchange.items.entries()),
                transactions: this.grandExchange.transactions.slice(-20)
            }));
            
            ws.on('close', () => {
                this.xmlStream.subscribers.delete(ws);
            });
        });
    }
    
    serveEconomyDashboard(res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>RuneScape Economy Mapper</title>
    <style>
        body { font-family: 'Courier New', monospace; background: #1a1a1a; color: #00ff00; margin: 0; padding: 20px; }
        .header { text-align: center; border: 2px solid #00ff00; padding: 20px; margin-bottom: 20px; }
        .traders { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
        .trader { border: 1px solid #333; padding: 15px; background: #2a2a2a; }
        .items { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .item { border: 1px solid #444; padding: 10px; background: #333; }
        .price-up { color: #00ff00; }
        .price-down { color: #ff0000; }
        .transactions { max-height: 300px; overflow-y: auto; border: 1px solid #333; padding: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏰 RUNESCAPE GRAND EXCHANGE ECONOMY 🏰</h1>
        <p>Live AI Trading Simulation</p>
    </div>
    
    <div class="traders" id="traders"></div>
    <div class="items" id="items"></div>
    <div class="transactions" id="transactions">
        <h3>Recent Transactions</h3>
        <div id="txList"></div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:9998');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'INITIAL_STATE' || data.type === 'UPDATE') {
                updateTraders(data.traders);
                updateItems(data.items);
                updateTransactions(data.transactions);
            }
        };
        
        function updateTraders(traders) {
            const tradersDiv = document.getElementById('traders');
            tradersDiv.innerHTML = Object.values(traders).map(trader => 
                \`<div class="trader">
                    <h3>\${trader.name}</h3>
                    <p>GP: \${formatGP(trader.gp)}</p>
                    <p>Strategy: \${trader.tradingStrategy}</p>
                    <p>Action: \${trader.currentAction}</p>
                    <p>Active Offers: \${trader.activeOffers.length}</p>
                </div>\`
            ).join('');
        }
        
        function updateItems(items) {
            const itemsDiv = document.getElementById('items');
            itemsDiv.innerHTML = items.map(([name, data]) => 
                \`<div class="item">
                    <strong>\${name}</strong><br>
                    Price: \${formatGP(data.currentPrice)}<br>
                    Trend: \${data.trend}<br>
                    Volume: \${data.volume}
                </div>\`
            ).join('');
        }
        
        function updateTransactions(transactions) {
            const txList = document.getElementById('txList');
            txList.innerHTML = transactions.slice(-10).map(tx => 
                \`<div>\${new Date(tx.timestamp).toLocaleTimeString()}: \${tx.buyer} bought \${tx.quantity}x \${tx.item} for \${formatGP(tx.price)} each</div>\`
            ).join('');
        }
        
        function formatGP(amount) {
            if (amount >= 1000000000) return (amount / 1000000000).toFixed(1) + 'B';
            if (amount >= 1000000) return (amount / 1000000).toFixed(1) + 'M';
            if (amount >= 1000) return (amount / 1000).toFixed(1) + 'K';
            return amount.toString();
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveXMLStream(res) {
        res.writeHead(200, { 
            'Content-Type': 'application/xml',
            'Access-Control-Allow-Origin': '*'
        });
        
        const xml = this.generateCurrentXML();
        res.end(xml);
    }
    
    startEconomicSimulation() {
        // Each AI trader acts every 1-3 seconds
        Object.values(this.aiTraders).forEach(trader => {
            this.startTraderLoop(trader);
        });
        
        // Market events every 10-30 seconds
        setInterval(() => {
            this.triggerMarketEvent();
        }, 10000 + Math.random() * 20000);
        
        // Price fluctuations every 2 seconds
        setInterval(() => {
            this.updateMarketPrices();
        }, 2000);
    }
    
    startTraderLoop(trader) {
        const executeAction = () => {
            this.executeTraderAction(trader);
            
            // Random interval between actions (1-3 seconds)
            const nextAction = 1000 + Math.random() * 2000;
            setTimeout(executeAction, nextAction);
        };
        
        // Start with random delay
        setTimeout(executeAction, Math.random() * 3000);
    }
    
    executeTraderAction(trader) {
        const actions = this.getTraderActions(trader);
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        switch (action.type) {
            case 'BUY_ORDER':
                this.executeBuyOrder(trader, action);
                break;
            case 'SELL_ORDER':
                this.executeSellOrder(trader, action);
                break;
            case 'CANCEL_OFFER':
                this.cancelOffer(trader);
                break;
            case 'MARKET_ANALYSIS':
                this.performMarketAnalysis(trader);
                break;
        }
    }
    
    getTraderActions(trader) {
        const baseActions = [
            { type: 'BUY_ORDER', weight: 3 },
            { type: 'SELL_ORDER', weight: 3 },
            { type: 'CANCEL_OFFER', weight: 1 },
            { type: 'MARKET_ANALYSIS', weight: 2 }
        ];
        
        // Strategy-specific action weights
        const strategyModifiers = {
            'buy_low_sell_high': { 'BUY_ORDER': 4, 'SELL_ORDER': 4 },
            'vertical_integration': { 'BUY_ORDER': 5, 'MARKET_ANALYSIS': 3 },
            'margin_flipping': { 'BUY_ORDER': 6, 'SELL_ORDER': 6, 'CANCEL_OFFER': 2 },
            'long_term_holds': { 'BUY_ORDER': 3, 'MARKET_ANALYSIS': 4 }
        };
        
        return baseActions;
    }
    
    executeBuyOrder(trader, action) {
        const items = Array.from(this.grandExchange.items.keys());
        const item = items[Math.floor(Math.random() * items.length)];
        const itemData = this.grandExchange.items.get(item);
        
        // Determine quantity and price based on strategy
        const quantity = this.calculateQuantity(trader, item, 'buy');
        const offerPrice = this.calculateOfferPrice(trader, itemData, 'buy');
        const totalCost = quantity * offerPrice;
        
        if (trader.gp >= totalCost) {
            const offer = {
                id: `${trader.name}-${Date.now()}`,
                trader: trader.name,
                type: 'buy',
                item,
                quantity,
                price: offerPrice,
                filled: 0,
                timestamp: Date.now()
            };
            
            trader.activeOffers.push(offer);
            trader.gp -= totalCost;
            trader.currentAction = `Buying ${quantity}x ${item} @ ${this.formatGP(offerPrice)} each`;
            
            // Simulate order filling (instant for demo)
            this.fillOrder(offer);
            
            // Record transaction
            this.recordTransaction({
                buyer: trader.name,
                seller: 'Grand Exchange',
                item,
                quantity,
                price: offerPrice,
                timestamp: Date.now()
            });
        }
    }
    
    executeSellOrder(trader, action) {
        // Check if trader has items to sell
        if (trader.inventory.size === 0) return;
        
        const items = Array.from(trader.inventory.keys());
        const item = items[Math.floor(Math.random() * items.length)];
        const available = trader.inventory.get(item);
        const itemData = this.grandExchange.items.get(item);
        
        const quantity = Math.min(available, this.calculateQuantity(trader, item, 'sell'));
        const offerPrice = this.calculateOfferPrice(trader, itemData, 'sell');
        
        const offer = {
            id: `${trader.name}-${Date.now()}`,
            trader: trader.name,
            type: 'sell',
            item,
            quantity,
            price: offerPrice,
            filled: 0,
            timestamp: Date.now()
        };
        
        trader.activeOffers.push(offer);
        trader.inventory.set(item, available - quantity);
        trader.currentAction = `Selling ${quantity}x ${item} @ ${this.formatGP(offerPrice)} each`;
        
        // Simulate order filling
        this.fillOrder(offer);
        
        // Record transaction
        this.recordTransaction({
            buyer: 'Grand Exchange',
            seller: trader.name,
            item,
            quantity,
            price: offerPrice,
            timestamp: Date.now()
        });
    }
    
    calculateQuantity(trader, item, orderType) {
        const itemData = this.grandExchange.items.get(item);
        
        // Base quantity based on item value
        let baseQty;
        if (itemData.basePrice > 100000000) baseQty = 1; // Expensive items
        else if (itemData.basePrice > 1000000) baseQty = Math.floor(Math.random() * 10) + 1;
        else if (itemData.basePrice > 10000) baseQty = Math.floor(Math.random() * 100) + 1;
        else baseQty = Math.floor(Math.random() * 1000) + 1;
        
        // Strategy modifiers
        const strategyMultipliers = {
            'buy_low_sell_high': 1.5,
            'vertical_integration': 2.0,
            'margin_flipping': 0.8,
            'long_term_holds': 1.2
        };
        
        return Math.floor(baseQty * (strategyMultipliers[trader.tradingStrategy] || 1));
    }
    
    calculateOfferPrice(trader, itemData, orderType) {
        const currentPrice = itemData.currentPrice;
        const volatility = itemData.volatility;
        
        // Strategy-based pricing
        let priceModifier = 0;
        
        switch (trader.tradingStrategy) {
            case 'buy_low_sell_high':
                priceModifier = orderType === 'buy' ? -0.05 : 0.05; // Buy 5% below, sell 5% above
                break;
            case 'margin_flipping':
                priceModifier = orderType === 'buy' ? -0.02 : 0.02; // Tight margins
                break;
            case 'vertical_integration':
                priceModifier = orderType === 'buy' ? -0.03 : 0.04; // Focus on production
                break;
            case 'long_term_holds':
                priceModifier = orderType === 'buy' ? -0.08 : 0.15; // Patient buying, premium selling
                break;
        }
        
        return Math.floor(currentPrice * (1 + priceModifier + (Math.random() - 0.5) * volatility));
    }
    
    fillOrder(offer) {
        // Simulate order filling based on market conditions
        const fillChance = Math.random();
        
        if (fillChance > 0.3) { // 70% chance to fill
            offer.filled = offer.quantity;
            
            const trader = this.aiTraders[offer.trader.toLowerCase().replace('ai_', '')];
            
            if (offer.type === 'buy') {
                // Add items to inventory
                const current = trader.inventory.get(offer.item) || 0;
                trader.inventory.set(offer.item, current + offer.quantity);
            } else {
                // Add GP from sale
                trader.gp += offer.quantity * offer.price;
            }
            
            // Remove from active offers
            trader.activeOffers = trader.activeOffers.filter(o => o.id !== offer.id);
            
            // Update market data
            this.updateItemVolume(offer.item, offer.quantity);
        }
    }
    
    updateItemVolume(item, quantity) {
        const itemData = this.grandExchange.items.get(item);
        if (itemData) {
            itemData.volume += quantity;
            itemData.lastUpdate = Date.now();
        }
    }
    
    recordTransaction(transaction) {
        this.grandExchange.transactions.push(transaction);
        
        // Keep only last 1000 transactions
        if (this.grandExchange.transactions.length > 1000) {
            this.grandExchange.transactions = this.grandExchange.transactions.slice(-1000);
        }
    }
    
    cancelOffer(trader) {
        if (trader.activeOffers.length > 0) {
            const offerToCancel = trader.activeOffers[Math.floor(Math.random() * trader.activeOffers.length)];
            
            // Return GP if it was a buy order
            if (offerToCancel.type === 'buy') {
                const refund = (offerToCancel.quantity - offerToCancel.filled) * offerToCancel.price;
                trader.gp += refund;
            }
            
            // Return items if it was a sell order
            if (offerToCancel.type === 'sell') {
                const returned = offerToCancel.quantity - offerToCancel.filled;
                const current = trader.inventory.get(offerToCancel.item) || 0;
                trader.inventory.set(offerToCancel.item, current + returned);
            }
            
            // Remove offer
            trader.activeOffers = trader.activeOffers.filter(o => o.id !== offerToCancel.id);
            trader.currentAction = `Cancelled ${offerToCancel.type} order for ${offerToCancel.item}`;
        }
    }
    
    performMarketAnalysis(trader) {
        const thoughts = [
            'Analyzing price trends for arbitrage opportunities...',
            'Checking for market manipulation signals...',
            'Evaluating risk/reward ratios across categories...',
            'Monitoring whale wallet movements...',
            'Calculating optimal position sizing...',
            'Studying historical volume patterns...',
            'Assessing market sentiment indicators...',
            'Identifying undervalued assets...'
        ];
        
        trader.currentAction = thoughts[Math.floor(Math.random() * thoughts.length)];
    }
    
    updateMarketPrices() {
        this.grandExchange.items.forEach((itemData, itemName) => {
            const baseVolatility = itemData.volatility;
            const priceChange = (Math.random() - 0.5) * baseVolatility * 2;
            
            // Ensure prices don't go negative
            const newPrice = Math.max(1, Math.floor(itemData.currentPrice * (1 + priceChange)));
            
            // Update trend
            const oldPrice = itemData.currentPrice;
            if (newPrice > oldPrice * 1.01) itemData.trend = 'rising';
            else if (newPrice < oldPrice * 0.99) itemData.trend = 'falling';
            else itemData.trend = 'stable';
            
            itemData.currentPrice = newPrice;
        });
    }
    
    triggerMarketEvent() {
        const event = this.marketEvents[Math.floor(Math.random() * this.marketEvents.length)];
        
        console.log(`\n📰 MARKET EVENT: ${event}\n`);
        
        // Apply event effects to random items
        const affectedItems = Array.from(this.grandExchange.items.keys())
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.floor(Math.random() * 5) + 1);
        
        affectedItems.forEach(item => {
            const itemData = this.grandExchange.items.get(item);
            const eventMultiplier = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
            itemData.currentPrice = Math.floor(itemData.currentPrice * eventMultiplier);
        });
        
        // Notify all traders
        Object.values(this.aiTraders).forEach(trader => {
            trader.currentAction = `Reacting to market event: ${event.slice(0, 30)}...`;
        });
    }
    
    startXMLGeneration() {
        setInterval(() => {
            const xml = this.generateCurrentXML();
            this.xmlStream.buffer.push(xml);
            
            // Keep only last 100 XML snapshots
            if (this.xmlStream.buffer.length > 100) {
                this.xmlStream.buffer.shift();
            }
            
            // Broadcast to WebSocket subscribers
            this.broadcastUpdate();
        }, 1000);
    }
    
    generateCurrentXML() {
        const timestamp = new Date().toISOString();
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>
<runescape_economy timestamp="${timestamp}" system_id="${this.systemId}">
    <grand_exchange>
        <market_status>ACTIVE</market_status>
        <total_volume>${this.grandExchange.transactions.length}</total_volume>
        
        <ai_traders>`;
        
        Object.values(this.aiTraders).forEach(trader => {
            xml += `
            <trader id="${trader.name}">
                <gp>${trader.gp}</gp>
                <strategy>${trader.tradingStrategy}</strategy>
                <current_action>${trader.currentAction}</current_action>
                <active_offers>${trader.activeOffers.length}</active_offers>
                <inventory_items>${trader.inventory.size}</inventory_items>
            </trader>`;
        });
        
        xml += `
        </ai_traders>
        
        <items>`;
        
        this.grandExchange.items.forEach((data, name) => {
            xml += `
            <item name="${name}" id="${data.id}">
                <price>${data.currentPrice}</price>
                <trend>${data.trend}</trend>
                <volume>${data.volume}</volume>
                <category>${data.category}</category>
                <volatility>${data.volatility}</volatility>
            </item>`;
        });
        
        xml += `
        </items>
        
        <recent_transactions>`;
        
        this.grandExchange.transactions.slice(-10).forEach(tx => {
            xml += `
            <transaction timestamp="${tx.timestamp}">
                <buyer>${tx.buyer}</buyer>
                <seller>${tx.seller}</seller>
                <item>${tx.item}</item>
                <quantity>${tx.quantity}</quantity>
                <price>${tx.price}</price>
            </transaction>`;
        });
        
        xml += `
        </recent_transactions>
    </grand_exchange>
</runescape_economy>`;
        
        return xml;
    }
    
    broadcastUpdate() {
        const updateData = {
            type: 'UPDATE',
            traders: this.aiTraders,
            items: Array.from(this.grandExchange.items.entries()),
            transactions: this.grandExchange.transactions.slice(-20),
            timestamp: Date.now()
        };
        
        this.xmlStream.subscribers.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(updateData));
            }
        });
    }
    
    displayLiveEconomy() {
        setInterval(() => {
            console.clear();
            console.log('🏰 RUNESCAPE GRAND EXCHANGE - LIVE ECONOMY 🏰');
            console.log('═'.repeat(80));
            
            // AI Trader Status
            console.log('\n🤖 AI TRADERS:');
            Object.values(this.aiTraders).forEach(trader => {
                const profitLoss = trader.gp - (trader.name === 'AI_MERCHANT' ? 1000000000 : 
                                                trader.name === 'AI_CRAFTER' ? 500000000 :
                                                trader.name === 'AI_FLIPPER' ? 200000000 : 2000000000);
                const plColor = profitLoss >= 0 ? '\x1b[32m' : '\x1b[31m';
                
                console.log(`${trader.color}${trader.name}\x1b[0m: ${this.formatGP(trader.gp)} GP (${plColor}${profitLoss >= 0 ? '+' : ''}${this.formatGP(profitLoss)}\x1b[0m)`);
                console.log(`  Action: ${trader.currentAction}`);
                console.log(`  Offers: ${trader.activeOffers.length} | Inventory: ${trader.inventory.size} items`);
            });
            
            // Top Items by Volume
            console.log('\n📊 TOP TRADED ITEMS:');
            const topItems = Array.from(this.grandExchange.items.entries())
                .sort(([,a], [,b]) => b.volume - a.volume)
                .slice(0, 8);
            
            topItems.forEach(([name, data]) => {
                const trendColor = data.trend === 'rising' ? '\x1b[32m' : 
                                 data.trend === 'falling' ? '\x1b[31m' : '\x1b[33m';
                console.log(`  ${name.padEnd(20)} ${this.formatGP(data.currentPrice).padStart(8)} GP ${trendColor}${data.trend}\x1b[0m (Vol: ${data.volume})`);
            });
            
            // Recent Transactions
            console.log('\n💰 RECENT TRANSACTIONS:');
            this.grandExchange.transactions.slice(-5).forEach(tx => {
                const timeAgo = Math.floor((Date.now() - tx.timestamp) / 1000);
                console.log(`  ${timeAgo}s ago: ${tx.buyer} ← ${tx.quantity}x ${tx.item} ← ${tx.seller} @ ${this.formatGP(tx.price)} each`);
            });
            
            console.log('\n🌐 Access: http://localhost:9999/economy | XML: http://localhost:9999/xml');
            console.log('📡 WebSocket: ws://localhost:9998');
            console.log('\nPress Ctrl+C to stop the economy simulation...');
            
        }, 1000);
    }
}

// Start the RuneScape Economy Mapper
console.log('🏰 Starting RuneScape Grand Exchange Economy Mapper...\n');

setTimeout(() => {
    new RuneScapeEconomyMapper();
}, 1000);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🏰 Grand Exchange closing for maintenance! 🏰\n');
    process.exit(0);
});