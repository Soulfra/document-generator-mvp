#!/usr/bin/env node

/**
 * 📊 REAL-TIME TICKER TAPE DISPLAY SYSTEM
 * 
 * Live price ticker that connects to the Real-Time Data Oracle
 * and displays actual prices with configurable update intervals
 * based on user tier.
 * 
 * No more fake data - this pulls real prices from real APIs!
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const RealTimeDataOracle = require('./real-time-data-oracle');
const DataAccessControl = require('./middleware/data-access-control');

class RealTimeTickerTape extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 3335,
            wsPort: config.wsPort || 3336,
            maxSymbols: config.maxSymbols || 20,
            scrollSpeed: config.scrollSpeed || 50, // pixels per second
            ...config
        };
        
        // Initialize data sources
        this.oracle = config.oracle || new RealTimeDataOracle();
        this.accessControl = new DataAccessControl({ oracle: this.oracle });
        
        // Update schedules by tier (milliseconds)
        this.updateSchedule = {
            premium: 1000,    // 1 second - real-time
            paid: 5000,       // 5 seconds - near real-time
            free: 60000       // 1 minute - cached/demo
        };
        
        // Active tickers and intervals
        this.activeTickers = new Map();
        this.intervals = new Map();
        this.displays = new Map();
        
        // WebSocket connections
        this.wss = null;
        this.clients = new Map(); // Map of connectionId -> { ws, userId, tier }
        
        // Price history for sparklines
        this.priceHistory = new Map();
        this.historyLimit = 100;
        
        // Express app
        this.app = express();
        this.server = http.createServer(this.app);
        
        this.initialize();
    }
    
    async initialize() {
        console.log('📊 Initializing Real-Time Ticker Tape...');
        
        // Initialize data oracle
        await this.oracle.initializeRedis();
        
        // Setup web server
        this.setupWebServer();
        
        // Setup WebSocket server
        this.setupWebSocketServer();
        
        // Start server
        this.server.listen(this.config.port, () => {
            console.log(`🌐 Ticker Tape UI: http://localhost:${this.config.port}`);
            console.log(`📡 WebSocket: ws://localhost:${this.config.port}`);
            console.log('✅ Real-Time Ticker Tape is LIVE!');
        });
    }
    
    setupWebServer() {
        this.app.use(express.json());
        this.app.use(express.static('.'));
        
        // Serve ticker tape UI
        this.app.get('/', (req, res) => {
            res.sendFile(__dirname + '/ticker-tape-display.html');
        });
        
        // API to start ticker for a user
        this.app.post('/api/ticker/start', async (req, res) => {
            const { userId, symbols, tier } = req.body;
            
            try {
                await this.startTicker(userId, symbols, tier);
                res.json({ 
                    success: true, 
                    message: 'Ticker started',
                    updateInterval: this.updateSchedule[tier]
                });
            } catch (error) {
                res.status(500).json({ 
                    success: false, 
                    error: error.message 
                });
            }
        });
        
        // API to stop ticker
        this.app.post('/api/ticker/stop', async (req, res) => {
            const { userId } = req.body;
            
            this.stopTicker(userId);
            res.json({ success: true, message: 'Ticker stopped' });
        });
        
        // Get current ticker data
        this.app.get('/api/ticker/data', (req, res) => {
            const data = {};
            
            for (const [symbol, ticker] of this.activeTickers) {
                data[symbol] = {
                    ...ticker,
                    history: this.priceHistory.get(symbol) || []
                };
            }
            
            res.json(data);
        });
    }
    
    setupWebSocketServer() {
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.wss.on('connection', (ws, req) => {
            const connectionId = this.generateConnectionId();
            
            // Store connection
            this.clients.set(connectionId, { 
                ws, 
                userId: null, 
                tier: 'free',
                subscribedSymbols: new Set()
            });
            
            console.log(`📱 New ticker connection: ${connectionId}`);
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                connectionId,
                timestamp: Date.now()
            }));
            
            // Handle messages
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(connectionId, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            // Handle disconnect
            ws.on('close', () => {
                const client = this.clients.get(connectionId);
                if (client?.userId) {
                    this.handleUserDisconnect(client.userId);
                }
                this.clients.delete(connectionId);
                console.log(`📱 Ticker connection closed: ${connectionId}`);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });
    }
    
    async handleWebSocketMessage(connectionId, data) {
        const client = this.clients.get(connectionId);
        if (!client) return;
        
        switch (data.type) {
            case 'authenticate':
                // Set user info
                client.userId = data.userId || `anonymous_${connectionId}`;
                client.tier = await this.accessControl.getUserTier(client.userId);
                
                client.ws.send(JSON.stringify({
                    type: 'authenticated',
                    userId: client.userId,
                    tier: client.tier,
                    updateInterval: this.updateSchedule[client.tier]
                }));
                break;
                
            case 'subscribe':
                // Subscribe to symbols
                if (data.symbols && Array.isArray(data.symbols)) {
                    for (const symbol of data.symbols) {
                        client.subscribedSymbols.add(symbol);
                    }
                    
                    // Start ticker if not already running
                    if (!this.intervals.has(client.userId)) {
                        await this.startTicker(
                            client.userId, 
                            Array.from(client.subscribedSymbols), 
                            client.tier
                        );
                    }
                }
                break;
                
            case 'unsubscribe':
                // Unsubscribe from symbols
                if (data.symbols && Array.isArray(data.symbols)) {
                    for (const symbol of data.symbols) {
                        client.subscribedSymbols.delete(symbol);
                    }
                }
                break;
        }
    }
    
    async startTicker(userId, symbols, userTier = 'free') {
        console.log(`🚀 Starting ticker for ${userId} (${userTier}) with symbols:`, symbols);
        
        // Clear existing interval if any
        this.stopTicker(userId);
        
        const interval = this.updateSchedule[userTier];
        
        // Initial fetch
        await this.fetchPrices(userId, symbols, userTier);
        
        // Create interval for updates
        const intervalId = setInterval(async () => {
            await this.fetchPrices(userId, symbols, userTier);
        }, interval);
        
        this.intervals.set(userId, intervalId);
        
        // Emit start event
        this.emit('ticker_started', { userId, symbols, interval });
    }
    
    async fetchPrices(userId, symbols, userTier) {
        const updates = [];
        
        for (const symbol of symbols) {
            try {
                // Determine data type
                const dataType = symbol.includes(':') ? 'sports/espn' : 'crypto/coingecko';
                
                // Get real data from oracle
                const data = await this.oracle.getData(userId, dataType, symbol);
                
                // Calculate price change
                const lastPrice = this.activeTickers.get(symbol)?.price || data.price;
                const priceChange = ((data.price - lastPrice) / lastPrice) * 100;
                
                // Update active ticker
                const tickerData = {
                    symbol,
                    price: data.price,
                    priceChange,
                    change24h: data.changePercent24h || data.percentChange24h || 0,
                    volume24h: data.volume24h || 0,
                    quality: data.quality,
                    source: data.source,
                    timestamp: Date.now()
                };
                
                this.activeTickers.set(symbol, tickerData);
                
                // Update price history
                this.updatePriceHistory(symbol, data.price);
                
                // Add to updates
                updates.push(tickerData);
                
            } catch (error) {
                console.error(`Failed to fetch ${symbol}:`, error.message);
                
                // Send error update
                updates.push({
                    symbol,
                    error: error.message,
                    timestamp: Date.now()
                });
            }
        }
        
        // Broadcast updates to subscribers
        this.broadcastPriceUpdates(userId, updates);
        
        // Emit event
        this.emit('prices_updated', { userId, updates });
    }
    
    updatePriceHistory(symbol, price) {
        if (!this.priceHistory.has(symbol)) {
            this.priceHistory.set(symbol, []);
        }
        
        const history = this.priceHistory.get(symbol);
        history.push({
            price,
            timestamp: Date.now()
        });
        
        // Keep only recent history
        if (history.length > this.historyLimit) {
            history.shift();
        }
    }
    
    broadcastPriceUpdates(userId, updates) {
        // Find all connections for this user
        for (const [connectionId, client] of this.clients) {
            if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
                // Filter updates to only subscribed symbols
                const filteredUpdates = updates.filter(update => 
                    client.subscribedSymbols.has(update.symbol)
                );
                
                if (filteredUpdates.length > 0) {
                    client.ws.send(JSON.stringify({
                        type: 'price_update',
                        updates: filteredUpdates,
                        timestamp: Date.now()
                    }));
                }
            }
        }
    }
    
    stopTicker(userId) {
        const intervalId = this.intervals.get(userId);
        if (intervalId) {
            clearInterval(intervalId);
            this.intervals.delete(userId);
            console.log(`⏹️ Stopped ticker for ${userId}`);
        }
    }
    
    handleUserDisconnect(userId) {
        // Check if user has any other active connections
        let hasOtherConnections = false;
        
        for (const [, client] of this.clients) {
            if (client.userId === userId) {
                hasOtherConnections = true;
                break;
            }
        }
        
        // Stop ticker if no other connections
        if (!hasOtherConnections) {
            this.stopTicker(userId);
        }
    }
    
    generateConnectionId() {
        return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Get ticker statistics
    getStatistics() {
        return {
            activeTickers: this.activeTickers.size,
            activeIntervals: this.intervals.size,
            connectedClients: this.clients.size,
            symbols: Array.from(this.activeTickers.keys()),
            updatesByTier: {
                premium: Array.from(this.clients.values()).filter(c => c.tier === 'premium').length,
                paid: Array.from(this.clients.values()).filter(c => c.tier === 'paid').length,
                free: Array.from(this.clients.values()).filter(c => c.tier === 'free').length
            }
        };
    }
}

module.exports = RealTimeTickerTape;

// Run if executed directly
if (require.main === module) {
    const ticker = new RealTimeTickerTape();
    
    // Example: Auto-start ticker for demo
    setTimeout(async () => {
        console.log('\n📊 Starting demo ticker...');
        await ticker.startTicker(
            'demo_user', 
            ['btc', 'eth', 'sol', 'mlb:nyy', 'nba:lakers'],
            'free'
        );
    }, 2000);
    
    // Show statistics every 30 seconds
    setInterval(() => {
        console.log('\n📈 Ticker Statistics:', ticker.getStatistics());
    }, 30000);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down ticker tape...');
        
        // Stop all intervals
        for (const [userId] of ticker.intervals) {
            ticker.stopTicker(userId);
        }
        
        process.exit(0);
    });
}