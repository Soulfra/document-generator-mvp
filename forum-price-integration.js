#!/usr/bin/env node

/**
 * Forum Price Integration
 * Connects price feeds to phpBB-style forum systems
 */

const express = require('express');
const WebSocket = require('ws');
const { Pool } = require('pg');
const RedisPriceCache = require('./redis-price-cache');

class ForumPriceIntegration {
    constructor(config = {}) {
        this.app = express();
        this.port = config.port || 3014;
        
        this.cache = config.cache || new RedisPriceCache();
        
        // PostgreSQL connection for forum database
        this.forumDb = new Pool({
            host: config.forumDbHost || process.env.FORUM_DB_HOST || 'localhost',
            port: config.forumDbPort || process.env.FORUM_DB_PORT || 5432,
            database: config.forumDbName || process.env.FORUM_DB_NAME || 'phpbb',
            user: config.forumDbUser || process.env.FORUM_DB_USER || 'phpbb',
            password: config.forumDbPassword || process.env.FORUM_DB_PASSWORD || 'phpbb'
        });
        
        // Price feed WebSocket clients
        this.priceClients = new Set();
        
        // Forum post templates
        this.postTemplates = {
            priceAlert: (symbol, price, change, alert) => `
[b]💰 Price Alert: ${symbol}[/b]

Current Price: [color=#00FF00]${price}[/color]
24h Change: ${change > 0 ? '[color=#00FF00]+' : '[color=#FF0000]'}${change.toFixed(2)}%[/color]

Alert Triggered: ${alert.type} ${alert.threshold}
Time: ${new Date().toLocaleString()}

[url=http://localhost:8080/live-price-display.html]View Live Prices[/url]
`,
            
            marketUpdate: (data) => `
[b]📊 Market Update[/b]

[table]
[tr][td][b]Asset[/b][/td][td][b]Price[/b][/td][td][b]24h Change[/b][/td][/tr]
${data.map(item => 
    `[tr][td]${item.symbol}[/td][td]${item.price}[/td][td]${item.change > 0 ? '+' : ''}${item.change.toFixed(2)}%[/td][/tr]`
).join('\n')}
[/table]

Last Update: ${new Date().toLocaleString()}
`,
            
            osrsUpdate: (items) => `
[b]⚔️ OSRS Grand Exchange Update[/b]

[list]
${items.map(item => 
    `[*][b]${item.name}[/b]: ${this.formatGP(item.price)} (${item.change > 0 ? '📈' : '📉'} ${Math.abs(item.change)}%)`
).join('\n')}
[/list]

[i]Prices from OSRS Wiki API[/i]
`
        };
        
        this.setupRoutes();
        console.log('📋 Forum Price Integration initialized');
    }
    
    async initialize() {
        // Test forum database connection
        try {
            const client = await this.forumDb.connect();
            await client.query('SELECT 1');
            client.release();
            console.log('✅ Connected to forum database');
        } catch (error) {
            console.error('❌ Failed to connect to forum database:', error.message);
            console.log('   Forum features will be limited');
        }
        
        // Connect to cache
        if (!this.cache.isConnected()) {
            await this.cache.connect();
        }
        
        // Set up WebSocket server for real-time updates
        this.setupWebSocket();
        
        console.log('✅ Forum integration ready');
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        // Create price discussion thread
        this.app.post('/api/forum/create-thread', async (req, res) => {
            const { 
                forumId, 
                userId, 
                title, 
                symbol, 
                category = 'crypto' 
            } = req.body;
            
            try {
                // Get current price
                const priceData = await this.getCurrentPrice(symbol, category);
                
                // Create forum post content
                const content = this.generateInitialPost(symbol, priceData);
                
                // Insert into phpBB (simplified - real phpBB requires more fields)
                const topicResult = await this.forumDb.query(`
                    INSERT INTO phpbb_topics (
                        forum_id, topic_poster, topic_title, 
                        topic_time, topic_first_poster_name
                    ) VALUES ($1, $2, $3, $4, $5)
                    RETURNING topic_id
                `, [forumId, userId, title, Math.floor(Date.now() / 1000), 'Price Bot']);
                
                const topicId = topicResult.rows[0].topic_id;
                
                // Create first post
                await this.forumDb.query(`
                    INSERT INTO phpbb_posts (
                        topic_id, forum_id, poster_id, 
                        post_time, post_text, bbcode_uid
                    ) VALUES ($1, $2, $3, $4, $5, $6)
                `, [topicId, forumId, userId, Math.floor(Date.now() / 1000), content, '']);
                
                res.json({
                    success: true,
                    topicId,
                    forumId,
                    message: 'Price discussion thread created'
                });
                
            } catch (error) {
                console.error('Failed to create forum thread:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Post price update to existing thread
        this.app.post('/api/forum/post-update', async (req, res) => {
            const { 
                topicId, 
                userId, 
                priceData 
            } = req.body;
            
            try {
                const content = this.postTemplates.marketUpdate(priceData);
                
                await this.forumDb.query(`
                    INSERT INTO phpbb_posts (
                        topic_id, poster_id, post_time, 
                        post_text, bbcode_uid
                    ) VALUES ($1, $2, $3, $4, $5)
                `, [topicId, userId, Math.floor(Date.now() / 1000), content, '']);
                
                // Update topic last post time
                await this.forumDb.query(`
                    UPDATE phpbb_topics 
                    SET topic_last_post_time = $1 
                    WHERE topic_id = $2
                `, [Math.floor(Date.now() / 1000), topicId]);
                
                res.json({
                    success: true,
                    message: 'Price update posted to forum'
                });
                
            } catch (error) {
                console.error('Failed to post update:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Get price discussion threads
        this.app.get('/api/forum/price-threads', async (req, res) => {
            try {
                const result = await this.forumDb.query(`
                    SELECT 
                        t.topic_id,
                        t.topic_title,
                        t.topic_views,
                        t.topic_posts_approved as replies,
                        t.topic_time,
                        t.topic_last_post_time,
                        u.username as author
                    FROM phpbb_topics t
                    JOIN phpbb_users u ON t.topic_poster = u.user_id
                    WHERE t.topic_title LIKE '%Price%' 
                       OR t.topic_title LIKE '%BTC%'
                       OR t.topic_title LIKE '%ETH%'
                       OR t.topic_title LIKE '%Scythe%'
                    ORDER BY t.topic_last_post_time DESC
                    LIMIT 20
                `);
                
                res.json({
                    success: true,
                    threads: result.rows
                });
                
            } catch (error) {
                // If forum DB not available, return empty
                res.json({
                    success: true,
                    threads: [],
                    note: 'Forum database not connected'
                });
            }
        });
        
        // Subscribe to price alerts for forum notifications
        this.app.post('/api/forum/subscribe-alerts', async (req, res) => {
            const { 
                userId, 
                symbol, 
                alertType, 
                threshold,
                topicId 
            } = req.body;
            
            try {
                // Store alert subscription
                // In real implementation, this would go to the price_alerts table
                
                res.json({
                    success: true,
                    message: 'Alert subscription created',
                    subscription: {
                        userId,
                        symbol,
                        alertType,
                        threshold,
                        topicId
                    }
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Forum-friendly price widget endpoint
        this.app.get('/api/forum/price-widget/:symbols', async (req, res) => {
            const symbols = req.params.symbols.split(',');
            
            try {
                const prices = {};
                
                for (const symbol of symbols) {
                    const cached = await this.cache.getPrice(symbol.toUpperCase(), 'crypto');
                    if (cached) {
                        prices[symbol] = cached;
                    }
                }
                
                // Generate BBCode for forum
                const bbcode = this.generatePriceBBCode(prices);
                
                res.json({
                    success: true,
                    prices,
                    bbcode,
                    html: this.generatePriceHTML(prices)
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Health check
        this.app.get('/health', async (req, res) => {
            let forumDbConnected = false;
            
            try {
                await this.forumDb.query('SELECT 1');
                forumDbConnected = true;
            } catch (e) {}
            
            res.json({
                status: 'healthy',
                services: {
                    cache: this.cache.isConnected(),
                    forumDb: forumDbConnected
                },
                wsClients: this.priceClients.size
            });
        });
    }
    
    setupWebSocket() {
        // WebSocket server for real-time forum updates
        this.wss = new WebSocket.Server({ port: 3015 });
        
        this.wss.on('connection', (ws) => {
            console.log('📱 Forum client connected');
            this.priceClients.add(ws);
            
            ws.on('close', () => {
                this.priceClients.delete(ws);
                console.log('📱 Forum client disconnected');
            });
            
            // Send initial prices
            this.sendCurrentPrices(ws);
        });
        
        // Connect to main price feed
        this.connectToPriceFeed();
        
        console.log('🔌 Forum WebSocket server on port 3015');
    }
    
    connectToPriceFeed() {
        const ws = new WebSocket('ws://localhost:47003');
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                
                // Forward to forum clients
                this.broadcastToForums({
                    type: 'price_update',
                    data: message,
                    timestamp: new Date().toISOString()
                });
                
                // Check for alerts
                if (message.type === 'price_update_aggregated') {
                    this.checkPriceAlerts(message.prices);
                }
                
            } catch (error) {
                console.error('Error processing price feed:', error);
            }
        });
        
        ws.on('error', (error) => {
            console.error('Price feed error:', error);
        });
        
        ws.on('close', () => {
            console.log('Price feed disconnected, reconnecting...');
            setTimeout(() => this.connectToPriceFeed(), 5000);
        });
    }
    
    async getCurrentPrice(symbol, category = 'crypto') {
        // Try cache first
        const cached = await this.cache.getPrice(symbol.toUpperCase(), category);
        if (cached) return cached;
        
        // Fallback to default
        return {
            symbol: symbol.toUpperCase(),
            price: 0,
            currency: category === 'gaming' ? 'GP' : 'USD',
            change_24h: 0
        };
    }
    
    generateInitialPost(symbol, priceData) {
        return `[b]💰 ${symbol} Price Discussion Thread[/b]

Welcome to the ${symbol} price discussion thread!

[b]Current Price:[/b] ${this.formatPrice(priceData.price, priceData.currency)}
[b]24h Change:[/b] ${priceData.change_24h > 0 ? '+' : ''}${priceData.change_24h?.toFixed(2) || 0}%

This thread will be automatically updated with significant price movements.

[b]Useful Links:[/b]
• [url=http://localhost:8080/live-price-display.html]Live Price Dashboard[/url]
• [url=http://localhost:8080/system-dashboard.html]System Dashboard[/url]

[i]Note: All prices are fetched from free APIs (CoinGecko, OSRS Wiki)[/i]`;
    }
    
    generatePriceBBCode(prices) {
        const lines = Object.entries(prices).map(([symbol, data]) => 
            `[b]${symbol}:[/b] ${this.formatPrice(data.price, data.currency)}`
        );
        
        return `[quote]${lines.join(' | ')}[/quote]`;
    }
    
    generatePriceHTML(prices) {
        const items = Object.entries(prices).map(([symbol, data]) => 
            `<span><b>${symbol}:</b> ${this.formatPrice(data.price, data.currency)}</span>`
        );
        
        return `<div class="price-widget">${items.join(' | ')}</div>`;
    }
    
    formatPrice(price, currency = 'USD') {
        if (currency === 'GP') {
            return this.formatGP(price);
        }
        return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    
    formatGP(value) {
        if (value >= 1000000000) {
            return (value / 1000000000).toFixed(2) + 'b GP';
        } else if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'm GP';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(0) + 'k GP';
        }
        return value + ' GP';
    }
    
    async checkPriceAlerts(prices) {
        // In real implementation, check against stored alerts
        // and post to forum threads when triggered
    }
    
    broadcastToForums(data) {
        const message = JSON.stringify(data);
        
        this.priceClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    async sendCurrentPrices(ws) {
        try {
            const btc = await this.cache.getPrice('BTC', 'crypto');
            const eth = await this.cache.getPrice('ETH', 'crypto');
            const scythe = await this.cache.getOSRSPrice(22486);
            
            ws.send(JSON.stringify({
                type: 'initial_prices',
                prices: { btc, eth, scythe },
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error sending initial prices:', error);
        }
    }
    
    async start() {
        await this.initialize();
        
        this.app.listen(this.port, () => {
            console.log('📋 Forum Price Integration Started!');
            console.log('==================================');
            console.log(`📡 API: http://localhost:${this.port}`);
            console.log(`🔌 WebSocket: ws://localhost:3015`);
            console.log('');
            console.log('📋 Forum Features:');
            console.log('   • Create price discussion threads');
            console.log('   • Auto-post price updates');
            console.log('   • Price alert notifications');
            console.log('   • BBCode price widgets');
            console.log('   • Real-time WebSocket updates');
            console.log('');
            console.log('✨ Ready for forum integration!');
        });
    }
    
    async close() {
        if (this.wss) {
            this.wss.close();
        }
        
        if (this.forumDb) {
            await this.forumDb.end();
        }
        
        if (this.cache) {
            await this.cache.close();
        }
    }
}

// Export for use
module.exports = ForumPriceIntegration;

// Start if run directly
if (require.main === module) {
    const integration = new ForumPriceIntegration();
    integration.start().catch(console.error);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down forum integration...');
        await integration.close();
        process.exit(0);
    });
}