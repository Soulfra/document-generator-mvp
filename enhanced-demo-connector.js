#!/usr/bin/env node

/**
 * Enhanced Demo Connector
 * 
 * Connects the enhanced-business-demo.html to actual backend services:
 * - Scythe Price Tracker for real crypto prices
 * - GIF Generation Pipeline for animated GIFs
 * - Sprite conversion services
 * - WebSocket real-time updates
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

// Import our existing components
const ScythePriceTracker = require('./WORKING-MINIMAL-SYSTEM/scythe-price-tracker');
const GIFGenerationPipeline = require('./WORKING-MINIMAL-SYSTEM/gif-generation-pipeline');

class EnhancedDemoConnector {
    constructor(options = {}) {
        this.config = {
            httpPort: options.httpPort || 8090,
            wsPort: options.wsPort || 8091,
            enableCrypto: options.enableCrypto !== false,
            enableGIF: options.enableGIF !== false,
            enableSprites: options.enableSprites !== false
        };
        
        // Initialize services
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = null;
        
        // Component instances
        this.priceTracker = null;
        this.gifPipeline = null;
        
        // Connected clients
        this.clients = new Set();
        
        console.log('🚀 Enhanced Demo Connector initializing...');
    }
    
    async initialize() {
        try {
            // Setup Express
            this.setupExpress();
            
            // Initialize components
            if (this.config.enableCrypto) {
                await this.initializePriceTracker();
            }
            
            if (this.config.enableGIF) {
                await this.initializeGIFPipeline();
            }
            
            // Setup WebSocket
            this.setupWebSocket();
            
            // Start server
            await this.startServer();
            
            console.log('✅ Enhanced Demo Connector ready!');
            console.log(`🌐 HTTP Server: http://localhost:${this.config.httpPort}`);
            console.log(`🔌 WebSocket: ws://localhost:${this.config.httpPort}`);
            console.log(`📄 Demo Page: http://localhost:${this.config.httpPort}/enhanced-business-demo.html`);
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize:', error);
            throw error;
        }
    }
    
    setupExpress() {
        // Middleware
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname)));
        
        // API Routes
        
        // Get current crypto prices
        this.app.get('/api/prices', (req, res) => {
            const prices = this.getCurrentPrices();
            res.json(prices);
        });
        
        // Generate sprite from business data
        this.app.post('/api/generate-sprite', async (req, res) => {
            try {
                const { businessName, location, type } = req.body;
                const sprite = await this.generateBusinessSprite(businessName, location, type);
                res.json({ success: true, sprite });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Generate GIF from price data
        this.app.post('/api/generate-gif', async (req, res) => {
            try {
                const { priceData, animationType } = req.body;
                const gif = await this.generatePriceGIF(priceData, animationType);
                res.json({ success: true, gif });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Street view to sprite conversion
        this.app.post('/api/streetview-to-sprite', async (req, res) => {
            try {
                const { location, address } = req.body;
                const sprite = await this.convertStreetViewToSprite(location, address);
                res.json({ success: true, sprite });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                services: {
                    priceTracker: this.priceTracker ? 'active' : 'disabled',
                    gifPipeline: this.gifPipeline ? 'active' : 'disabled',
                    websocket: this.wss ? 'active' : 'disabled'
                },
                connectedClients: this.clients.size
            });
        });
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 New WebSocket client connected');
            this.clients.add(ws);
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connection',
                message: 'Connected to Enhanced Demo Backend',
                services: {
                    crypto: this.config.enableCrypto,
                    gif: this.config.enableGIF,
                    sprites: this.config.enableSprites
                }
            }));
            
            // Send initial data
            if (this.priceTracker) {
                const prices = this.getCurrentPrices();
                ws.send(JSON.stringify({
                    type: 'price_update',
                    data: prices
                }));
            }
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                this.clients.delete(ws);
                console.log('🔌 Client disconnected');
            });
        });
    }
    
    async initializePriceTracker() {
        console.log('💰 Initializing crypto price tracker...');
        
        this.priceTracker = new ScythePriceTracker({
            priceUpdateInterval: 5000, // 5 seconds for demo
            enablePredictions: true,
            trackedItems: [
                { id: 'btc', name: 'Bitcoin' },
                { id: 'eth', name: 'Ethereum' },
                { id: 'scythe', name: 'SCYTHE Token' }
            ]
        });
        
        await this.priceTracker.initialize();
        
        // Listen for price updates
        this.priceTracker.on('prices_updated', (updates) => {
            this.broadcastPriceUpdate(updates);
        });
        
        this.priceTracker.on('price_alert', (alert) => {
            this.broadcastAlert(alert);
        });
        
        console.log('✅ Price tracker initialized');
    }
    
    async initializeGIFPipeline() {
        console.log('🎬 Initializing GIF generation pipeline...');
        
        this.gifPipeline = new GIFGenerationPipeline({
            outputDir: path.join(__dirname, 'generated-gifs'),
            enableWebSocket: false, // We'll use our own WebSocket
            maxConcurrentGenerations: 5
        });
        
        await this.gifPipeline.initialize();
        
        // Listen for GIF generation events
        this.gifPipeline.on('gifGenerated', (result) => {
            this.broadcastGIFComplete(result);
        });
        
        console.log('✅ GIF pipeline initialized');
    }
    
    async startServer() {
        return new Promise((resolve) => {
            this.server.listen(this.config.httpPort, () => {
                console.log(`🌐 Server running on http://localhost:${this.config.httpPort}`);
                resolve();
            });
        });
    }
    
    // Get current crypto prices
    getCurrentPrices() {
        if (!this.priceTracker) {
            // Return mock data if price tracker not enabled
            return {
                btc: { price: 45234, change: 5.23, symbol: 'BTC' },
                eth: { price: 2843, change: -2.14, symbol: 'ETH' },
                scythe: { price: 127.45, change: 12.67, symbol: 'SCYTHE' }
            };
        }
        
        // Get real data from price tracker
        const btcData = this.priceTracker.getMarketData('btc') || {};
        const ethData = this.priceTracker.getMarketData('eth') || {};
        const scytheData = this.priceTracker.getMarketData('scythe') || {};
        
        return {
            btc: {
                price: btcData.price || 45000,
                change: btcData.changePercent || 0,
                symbol: 'BTC',
                history: this.priceTracker.getPriceHistory('btc', 3600000) // Last hour
            },
            eth: {
                price: ethData.price || 2800,
                change: ethData.changePercent || 0,
                symbol: 'ETH',
                history: this.priceTracker.getPriceHistory('eth', 3600000)
            },
            scythe: {
                price: scytheData.price || 125,
                change: scytheData.changePercent || 0,
                symbol: 'SCYTHE',
                history: this.priceTracker.getPriceHistory('scythe', 3600000)
            }
        };
    }
    
    // Generate business sprite
    async generateBusinessSprite(businessName, location, type) {
        const spriteData = {
            name: businessName,
            size: '128x128',
            colors: this.getBusinessColors(type),
            type: type,
            location: location
        };
        
        // If GIF pipeline available, generate animated sprite
        if (this.gifPipeline) {
            const animationData = {
                type: 'pulse',
                frames: 8,
                duration: 1000
            };
            
            const result = await this.gifPipeline.generateGIF(spriteData, animationData);
            return {
                static: spriteData,
                animated: result.gifPath,
                generationId: result.generationId
            };
        }
        
        // Return static sprite data
        return { static: spriteData };
    }
    
    // Generate price animation GIF
    async generatePriceGIF(priceData, animationType = 'chart') {
        if (!this.gifPipeline) {
            return { error: 'GIF pipeline not available' };
        }
        
        const spriteData = {
            name: `price_${animationType}_${Date.now()}`,
            size: '256x128',
            colors: ['#00ff88', '#ff4444', '#00bbff'],
            data: priceData
        };
        
        const animationData = {
            type: animationType,
            frames: 20,
            duration: 2000,
            loop: true
        };
        
        const result = await this.gifPipeline.generateGIF(spriteData, animationData);
        return {
            gifPath: result.gifPath,
            frameCount: result.frameCount,
            duration: animationData.duration
        };
    }
    
    // Convert street view to sprite (simulated)
    async convertStreetViewToSprite(location, address) {
        // In a real implementation, this would:
        // 1. Fetch street view image from Google Street View API
        // 2. Process image to extract building
        // 3. Convert to pixel art style
        // 4. Generate sprite
        
        const spriteData = {
            name: `streetview_${address.replace(/\s+/g, '_')}`,
            size: '128x128',
            colors: this.generateStreetViewColors(location),
            location: location,
            address: address,
            type: 'building'
        };
        
        if (this.gifPipeline) {
            const animationData = {
                type: 'rotation',
                frames: 12,
                duration: 2000
            };
            
            const result = await this.gifPipeline.generateGIF(spriteData, animationData);
            return {
                sprite: spriteData,
                animation: result.gifPath
            };
        }
        
        return { sprite: spriteData };
    }
    
    // Handle WebSocket messages
    async handleWebSocketMessage(ws, message) {
        switch (message.type) {
            case 'get_prices':
                const prices = this.getCurrentPrices();
                ws.send(JSON.stringify({
                    type: 'price_update',
                    data: prices
                }));
                break;
                
            case 'generate_sprite':
                const sprite = await this.generateBusinessSprite(
                    message.businessName,
                    message.location,
                    message.type
                );
                ws.send(JSON.stringify({
                    type: 'sprite_generated',
                    data: sprite
                }));
                break;
                
            case 'generate_gif':
                const gif = await this.generatePriceGIF(
                    message.priceData,
                    message.animationType
                );
                ws.send(JSON.stringify({
                    type: 'gif_generated',
                    data: gif
                }));
                break;
                
            default:
                console.warn('Unknown message type:', message.type);
        }
    }
    
    // Broadcast price updates to all clients
    broadcastPriceUpdate(updates) {
        const message = JSON.stringify({
            type: 'price_update',
            data: updates,
            timestamp: Date.now()
        });
        
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    // Broadcast alerts
    broadcastAlert(alert) {
        const message = JSON.stringify({
            type: 'price_alert',
            data: alert,
            timestamp: Date.now()
        });
        
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    // Broadcast GIF completion
    broadcastGIFComplete(result) {
        const message = JSON.stringify({
            type: 'gif_complete',
            data: result,
            timestamp: Date.now()
        });
        
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    // Helper methods
    getBusinessColors(type) {
        const colorSchemes = {
            tech: ['#00ff88', '#00bbff', '#ff00ff'],
            finance: ['#ffd700', '#ff8c00', '#ff4500'],
            gaming: ['#ff00ff', '#00ffff', '#ff1493'],
            ai: ['#00bfff', '#1e90ff', '#4169e1'],
            blockchain: ['#ff8c00', '#ffd700', '#ff6347']
        };
        return colorSchemes[type] || ['#808080', '#a9a9a9', '#c0c0c0'];
    }
    
    generateStreetViewColors(location) {
        // Generate colors based on location
        const lat = Math.abs(location.lat);
        const lng = Math.abs(location.lng);
        
        const hue1 = (lat * 3.6) % 360;
        const hue2 = (lng * 3.6) % 360;
        const hue3 = ((lat + lng) * 3.6) % 360;
        
        return [
            `hsl(${hue1}, 70%, 50%)`,
            `hsl(${hue2}, 70%, 50%)`,
            `hsl(${hue3}, 70%, 50%)`
        ];
    }
    
    // Shutdown gracefully
    async shutdown() {
        console.log('🛑 Shutting down Enhanced Demo Connector...');
        
        // Close WebSocket connections
        this.clients.forEach(client => {
            client.close();
        });
        
        if (this.wss) {
            this.wss.close();
        }
        
        // Shutdown components
        if (this.priceTracker) {
            await this.priceTracker.shutdown();
        }
        
        if (this.gifPipeline) {
            await this.gifPipeline.shutdown();
        }
        
        // Close HTTP server
        this.server.close();
        
        console.log('✅ Shutdown complete');
    }
}

// Export for use as module
module.exports = EnhancedDemoConnector;

// Run if called directly
if (require.main === module) {
    const connector = new EnhancedDemoConnector({
        httpPort: process.env.PORT || 8090,
        enableCrypto: true,
        enableGIF: true,
        enableSprites: true
    });
    
    connector.initialize().catch(console.error);
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        await connector.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await connector.shutdown();
        process.exit(0);
    });
}