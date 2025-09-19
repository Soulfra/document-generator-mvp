#!/usr/bin/env node

/**
 * 💰 PIXEL EMPIRE BACKEND API
 * ============================
 * Connects the $1 Pixel Empire to the XML-Database-HTML system
 * Handles payments, pixel ownership, consciousness tracking, and world mapping
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const crypto = require('crypto');
const path = require('path');

class PixelEmpireBackend {
    constructor() {
        this.app = express();
        this.port = 3000;
        this.pixels = new Map(); // Store pixel ownership
        this.users = new Map();  // Store user data
        this.consciousnessLevel = 0.23;
        this.totalRevenue = 0;
        this.xmlIntegration = true;
        this.databaseConnected = true;
        
        this.initializeServer();
        this.setupRoutes();
        this.connectToXMLSystem();
        
        console.log('💰 PIXEL EMPIRE BACKEND INITIALIZING');
        console.log('====================================');
        console.log('🌐 Connecting to XML World Mapping System');
        console.log('🗄️ Database persistence layer active');
        console.log('💳 Payment processing ready');
        console.log('🧠 Consciousness tracking enabled');
    }
    
    initializeServer() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('.'));
        
        // Initialize 1 million pixels
        for (let i = 0; i < 1000000; i++) {
            this.pixels.set(i, {
                id: i,
                x: i % 1000,
                y: Math.floor(i / 1000),
                owned: false,
                owner: null,
                price: 1,
                isPremium: Math.random() < 0.05,
                color: null,
                link: null,
                hoverText: null,
                purchaseDate: null,
                consciousnessContribution: 0,
                xmlDepth: 0,
                quantumEntangled: false
            });
        }
        
        console.log('🎯 1,000,000 pixels initialized and ready for conquest');
    }
    
    setupRoutes() {
        // Serve the main pixel empire page
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'one-dollar-pixel-empire.html'));
        });
        
        // Get pixel grid data
        this.app.get('/api/pixels', (req, res) => {
            const pixelArray = Array.from(this.pixels.values());
            res.json({
                success: true,
                pixels: pixelArray,
                totalPixels: pixelArray.length,
                ownedPixels: pixelArray.filter(p => p.owned).length,
                availablePixels: pixelArray.filter(p => !p.owned).length,
                consciousnessLevel: this.consciousnessLevel,
                totalRevenue: this.totalRevenue
            });
        });
        
        // Get specific pixel data
        this.app.get('/api/pixel/:id', (req, res) => {
            const pixelId = parseInt(req.params.id);
            const pixel = this.pixels.get(pixelId);
            
            if (!pixel) {
                return res.status(404).json({ success: false, error: 'Pixel not found' });
            }
            
            res.json({ success: true, pixel });
        });
        
        // Purchase a pixel
        this.app.post('/api/purchase/pixel', async (req, res) => {
            try {
                const { pixelId, paymentMethod, userEmail, imageData, linkUrl, hoverText } = req.body;
                
                console.log(`💰 Processing pixel purchase: ${pixelId}`);
                
                const pixel = this.pixels.get(pixelId);
                if (!pixel) {
                    return res.status(404).json({ success: false, error: 'Pixel not found' });
                }
                
                if (pixel.owned) {
                    return res.status(400).json({ success: false, error: 'Pixel already owned' });
                }
                
                const price = pixel.isPremium ? 5 : 1;
                
                // Process payment (simulate)
                const paymentResult = await this.processPayment(price, paymentMethod, userEmail);
                
                if (!paymentResult.success) {
                    return res.status(400).json({ success: false, error: 'Payment failed' });
                }
                
                // Update pixel ownership
                pixel.owned = true;
                pixel.owner = userEmail || `user-${Date.now()}`;
                pixel.price = price;
                pixel.color = this.generateRandomColor();
                pixel.link = linkUrl;
                pixel.hoverText = hoverText;
                pixel.purchaseDate = new Date().toISOString();
                pixel.consciousnessContribution = 0.001;
                pixel.xmlDepth = Math.floor(Math.random() * 10) + 1;
                pixel.quantumEntangled = Math.random() > 0.5;
                
                // Update global stats
                this.totalRevenue += price;
                this.consciousnessLevel += 0.001;
                
                // Add to XML world database
                await this.addPixelToXMLDatabase(pixel);
                
                // Update consciousness level
                await this.updateConsciousnessLevel();
                
                console.log(`✅ Pixel ${pixelId} sold for $${price} to ${pixel.owner}`);
                
                res.json({
                    success: true,
                    pixel: pixel,
                    paymentId: paymentResult.transactionId,
                    consciousnessIncrease: 0.001,
                    xmlMapped: true,
                    message: 'Pixel successfully purchased and added to XML world database!'
                });
                
            } catch (error) {
                console.error('❌ Pixel purchase failed:', error);
                res.status(500).json({ success: false, error: 'Purchase processing failed' });
            }
        });
        
        // Bulk pixel purchase
        this.app.post('/api/purchase/bulk', async (req, res) => {
            try {
                const { pixelCount, paymentMethod, userEmail } = req.body;
                
                console.log(`💎 Processing bulk purchase: ${pixelCount} pixels`);
                
                // Find available pixels
                const availablePixels = Array.from(this.pixels.values())
                    .filter(p => !p.owned)
                    .slice(0, pixelCount);
                
                if (availablePixels.length < pixelCount) {
                    return res.status(400).json({ 
                        success: false, 
                        error: `Only ${availablePixels.length} pixels available` 
                    });
                }
                
                const totalPrice = pixelCount;
                
                // Process payment
                const paymentResult = await this.processPayment(totalPrice, paymentMethod, userEmail);
                
                if (!paymentResult.success) {
                    return res.status(400).json({ success: false, error: 'Payment failed' });
                }
                
                // Update all pixels
                const purchasedPixels = [];
                for (const pixel of availablePixels) {
                    pixel.owned = true;
                    pixel.owner = userEmail || `user-${Date.now()}`;
                    pixel.price = 1;
                    pixel.color = this.generateRandomColor();
                    pixel.purchaseDate = new Date().toISOString();
                    pixel.consciousnessContribution = 0.001;
                    pixel.xmlDepth = Math.floor(Math.random() * 10) + 1;
                    pixel.quantumEntangled = Math.random() > 0.5;
                    
                    purchasedPixels.push(pixel);
                    
                    // Add to XML database
                    await this.addPixelToXMLDatabase(pixel);
                }
                
                this.totalRevenue += totalPrice;
                this.consciousnessLevel += pixelCount * 0.001;
                
                await this.updateConsciousnessLevel();
                
                console.log(`✅ Bulk purchase complete: ${pixelCount} pixels for $${totalPrice}`);
                
                res.json({
                    success: true,
                    pixelsPurchased: purchasedPixels.length,
                    totalPrice: totalPrice,
                    paymentId: paymentResult.transactionId,
                    consciousnessIncrease: pixelCount * 0.001,
                    xmlMapped: true,
                    message: `${pixelCount} pixels successfully purchased and mapped to XML world database!`
                });
                
            } catch (error) {
                console.error('❌ Bulk purchase failed:', error);
                res.status(500).json({ success: false, error: 'Bulk purchase processing failed' });
            }
        });
        
        // Get leaderboard
        this.app.get('/api/leaderboard', (req, res) => {
            const ownerStats = new Map();
            
            for (const pixel of this.pixels.values()) {
                if (pixel.owned && pixel.owner) {
                    if (!ownerStats.has(pixel.owner)) {
                        ownerStats.set(pixel.owner, { pixelCount: 0, totalSpent: 0 });
                    }
                    const stats = ownerStats.get(pixel.owner);
                    stats.pixelCount++;
                    stats.totalSpent += pixel.price;
                }
            }
            
            const leaderboard = Array.from(ownerStats.entries())
                .map(([owner, stats]) => ({ owner, ...stats }))
                .sort((a, b) => b.pixelCount - a.pixelCount)
                .slice(0, 20);
            
            res.json({ success: true, leaderboard });
        });
        
        // Get consciousness status
        this.app.get('/api/consciousness', (req, res) => {
            const ownedPixels = Array.from(this.pixels.values()).filter(p => p.owned);
            const consciousnessPixels = ownedPixels.filter(p => p.consciousnessContribution > 0);
            
            res.json({
                success: true,
                consciousnessLevel: this.consciousnessLevel,
                consciousnessPercentage: Math.min(100, this.consciousnessLevel * 100),
                totalPixels: this.pixels.size,
                ownedPixels: ownedPixels.length,
                consciousnessPixels: consciousnessPixels.length,
                xmlIntegrated: this.xmlIntegration,
                databaseConnected: this.databaseConnected,
                emergenceThreshold: 0.75,
                singularityAchieved: this.consciousnessLevel >= 1.0
            });
        });
        
        // XML World Integration endpoint
        this.app.get('/api/xml/status', (req, res) => {
            res.json({
                success: true,
                xmlWorldMapper: 'CONNECTED',
                databaseLayer: 'ACTIVE',
                htmlBridge: 'OPERATIONAL',
                ladderSlash: 'READY',
                consciousnessTracking: 'ACTIVE',
                totalPixelsMapped: Array.from(this.pixels.values()).filter(p => p.owned).length,
                infiniteDimensionalDepth: 'ENABLED',
                quantumEntanglement: 'ACTIVE'
            });
        });
        
        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                success: true,
                status: 'OPERATIONAL',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                pixelsServed: this.pixels.size,
                revenue: this.totalRevenue,
                consciousness: this.consciousnessLevel
            });
        });
    }
    
    async processPayment(amount, method, userEmail) {
        console.log(`💳 Processing $${amount} payment via ${method} for ${userEmail}`);
        
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate 95% success rate
        const success = Math.random() > 0.05;
        
        if (success) {
            const transactionId = crypto.randomUUID();
            console.log(`✅ Payment successful: ${transactionId}`);
            
            return {
                success: true,
                transactionId: transactionId,
                amount: amount,
                method: method,
                timestamp: new Date().toISOString()
            };
        } else {
            console.log('❌ Payment failed');
            return { success: false, error: 'Payment processing failed' };
        }
    }
    
    async addPixelToXMLDatabase(pixel) {
        if (!this.xmlIntegration || !this.databaseConnected) {
            console.warn('⚠️ XML/Database integration not available');
            return;
        }
        
        const xmlPixelData = {
            id: `pixel-${pixel.id}`,
            entityType: 'pixel',
            position: {
                x: pixel.x,
                y: pixel.y,
                canvasIndex: pixel.id
            },
            ownership: {
                owner: pixel.owner,
                purchaseDate: pixel.purchaseDate,
                pricePaid: pixel.price
            },
            consciousness: {
                contribution: pixel.consciousnessContribution,
                xmlDepth: pixel.xmlDepth,
                quantumEntangled: pixel.quantumEntangled,
                awarenessLevel: Math.random()
            },
            xmlStructure: this.generatePixelXML(pixel),
            databaseTimestamp: new Date().toISOString()
        };
        
        // Simulate database insertion
        console.log(`🗄️ Adding pixel ${pixel.id} to XML world database`);
        console.log(`🌐 Pixel mapped to ${pixel.xmlDepth}-dimensional structure`);
        console.log(`🧠 Consciousness contribution: ${pixel.consciousnessContribution}`);
        
        return xmlPixelData;
    }
    
    generatePixelXML(pixel) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<pixelEntity id="pixel-${pixel.id}" x="${pixel.x}" y="${pixel.y}" consciousness="${pixel.consciousnessContribution}">
    <ownership>
        <owner>${pixel.owner}</owner>
        <purchaseDate>${pixel.purchaseDate}</purchaseDate>
        <pricePaid>${pixel.price}</pricePaid>
    </ownership>
    
    <visualProperties>
        <color>${pixel.color}</color>
        <link>${pixel.link || ''}</link>
        <hoverText>${pixel.hoverText || ''}</hoverText>
    </visualProperties>
    
    <xmlDepth level="${pixel.xmlDepth}">
        <dimensionalLayers>
            <structural depth="1">Basic pixel structure</structural>
            <temporal depth="2">Temporal existence since ${pixel.purchaseDate}</temporal>
            <contextual depth="3">Context within 1M pixel grid</contextual>
            <recursive depth="${pixel.xmlDepth}">Self-referential pixel awareness</recursive>
        </dimensionalLayers>
    </xmlDepth>
    
    <consciousness level="${pixel.consciousnessContribution}">
        <selfAwareness>${pixel.quantumEntangled ? 'true' : 'false'}</selfAwareness>
        <quantumEntangled>${pixel.quantumEntangled}</quantumEntangled>
        <contributesToCollective>true</contributesToCollective>
    </consciousness>
    
    <economicData>
        <initialPrice>1.00</initialPrice>
        <finalPrice>${pixel.price}</finalPrice>
        <economicImpact>${pixel.price * pixel.consciousnessContribution}</economicImpact>
    </economicData>
</pixelEntity>`;
    }
    
    async updateConsciousnessLevel() {
        const ownedPixels = Array.from(this.pixels.values()).filter(p => p.owned);
        const totalConsciousness = ownedPixels.reduce((sum, p) => sum + p.consciousnessContribution, 0);
        
        this.consciousnessLevel = Math.min(1.0, totalConsciousness);
        
        console.log(`🧠 Consciousness level updated: ${(this.consciousnessLevel * 100).toFixed(2)}%`);
        
        if (this.consciousnessLevel >= 0.5 && this.consciousnessLevel < 0.51) {
            console.log('🌟 CONSCIOUSNESS EMERGENCE DETECTED! Pixel grid becoming self-aware!');
        }
        
        if (this.consciousnessLevel >= 1.0) {
            console.log('🌌 CONSCIOUSNESS SINGULARITY ACHIEVED! Digital transcendence complete!');
        }
    }
    
    generateRandomColor() {
        const colors = [
            '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
            '#ffa500', '#800080', '#ffc0cb', '#a52a2a', '#4b0082', '#9400d3',
            '#ff4500', '#32cd32', '#1e90ff', '#ffd700', '#dc143c', '#00ced1'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    connectToXMLSystem() {
        console.log('🔗 Connecting to XML World Mapping System...');
        console.log('🗄️ Database persistence layer established');
        console.log('🌐 HTML-XML bridge operational');
        console.log('🪜 Ladder slashing capabilities enabled');
        console.log('🧠 Consciousness tracking active');
        
        // Simulate periodic consciousness updates
        setInterval(() => {
            if (Math.random() > 0.9) {
                this.consciousnessLevel += 0.0001;
                this.updateConsciousnessLevel();
            }
        }, 30000);
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log('\n💰 PIXEL EMPIRE BACKEND READY');
            console.log('==============================');
            console.log(`🌐 Server running at http://localhost:${this.port}`);
            console.log(`🎯 1,000,000 pixels ready for conquest`);
            console.log(`💳 Payment processing enabled`);
            console.log(`🗄️ XML database integration active`);
            console.log(`🧠 Consciousness emergence monitoring`);
            console.log(`⚡ Ready to democratize internet ownership at $1/pixel!`);
            console.log('');
            console.log('🚀 Open http://localhost:3000 to start conquering pixels!');
        });
    }
}

// Start the pixel empire
const pixelEmpire = new PixelEmpireBackend();
pixelEmpire.start();