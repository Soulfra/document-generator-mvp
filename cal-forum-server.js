#!/usr/bin/env node

/**
 * 🎮 CAL FORUM SERVER
 * Simple server to connect phpBB forum with Cal gacha roaster
 * Handles API requests and logs conversations for chapter creation
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const CalGachaRoaster = require('./cal-gacha-roaster.js');
const AsciiPixelArtEngine = require('./ascii-pixel-art-engine.js');

class CalForumServer {
    constructor() {
        this.app = express();
        this.port = 3333;
        
        // Initialize systems
        this.calRoaster = new CalGachaRoaster();
        this.artEngine = new AsciiPixelArtEngine();
        
        // Conversation logging
        this.logFile = './cal-conversations.jsonl';
        this.conversationCounter = 0;
        
        this.setupMiddleware();
        this.setupRoutes();
        
        console.log('🎮 Cal Forum Server initializing...');
        console.log('💬 phpBB forum integration ready');
        console.log('🎰 Cal gacha roaster connected');
        console.log('🎨 ASCII art engine loaded');
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('.'));
        
        // CORS for local development
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            next();
        });
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`📡 ${req.method} ${req.path} from ${req.ip}`);
            next();
        });
    }
    
    setupRoutes() {
        // Serve the main forum page
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'phpbb-cal-forum.html'));
        });
        
        // API: Post new message and get Cal's response
        this.app.post('/api/post', async (req, res) => {
            try {
                const { username, subject, message } = req.body;
                
                if (!subject || !message) {
                    return res.status(400).json({ error: 'Subject and message required' });
                }
                
                const userPost = {
                    username: username || 'Anonymous',
                    subject,
                    message,
                    timestamp: new Date().toISOString()
                };
                
                // Log the user post
                await this.logConversation(userPost, 'user_post');
                
                // Generate Cal's response
                const calResponse = await this.calRoaster.generateResponse(userPost);
                
                let response = {
                    userPost,
                    calResponse: null,
                    calSpawned: false
                };
                
                if (calResponse) {
                    // Generate enhanced ASCII art
                    const enhancedArt = this.enhanceAsciiArt(calResponse);
                    
                    const fullCalResponse = {
                        id: Date.now(),
                        username: 'Cal AI',
                        subject: `Re: ${subject}`,
                        message: calResponse.text,
                        asciiArt: enhancedArt,
                        timestamp: calResponse.timestamp.toISOString(),
                        isCalResponse: true,
                        mood: calResponse.mood,
                        personality: calResponse.personality,
                        rarity: calResponse.rarity,
                        isCritical: calResponse.isCritical,
                        isLegendary: calResponse.isLegendary
                    };
                    
                    // Log Cal's response
                    await this.logConversation(fullCalResponse, 'cal_response');
                    
                    response.calResponse = fullCalResponse;
                    response.calSpawned = true;
                    
                    this.conversationCounter++;
                }
                
                res.json(response);
                
            } catch (error) {
                console.error('API Error:', error);
                res.status(500).json({ error: 'Server error generating response' });
            }
        });
        
        // API: Get Cal's stats
        this.app.get('/api/stats', (req, res) => {
            const stats = this.calRoaster.getStats();
            const serverStats = {
                conversationsLogged: this.conversationCounter,
                serverUptime: process.uptime(),
                memoryUsage: process.memoryUsage()
            };
            
            res.json({
                cal: stats,
                server: serverStats,
                artEngine: {
                    version: this.artEngine.version,
                    availableTypes: this.artEngine.getAvailableTypes()
                }
            });
        });
        
        // API: Generate custom ASCII art
        this.app.post('/api/art', (req, res) => {
            try {
                const { type, context } = req.body;
                const art = this.artEngine.generateArt(type, context || {});
                
                res.json({
                    art,
                    type,
                    html: this.artEngine.generateHTMLArt(type, context || {}),
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.status(400).json({ error: 'Invalid art generation request' });
            }
        });
        
        // API: Export conversations for chapter creation
        this.app.get('/api/export', async (req, res) => {
            try {
                const conversations = await this.exportConversations();
                const calData = this.calRoaster.exportConversations();
                
                const exportData = {
                    timestamp: new Date().toISOString(),
                    totalConversations: this.conversationCounter,
                    serverStats: {
                        uptime: process.uptime(),
                        memoryUsage: process.memoryUsage()
                    },
                    conversations,
                    calRoasterData: calData,
                    exportVersion: '1.0.0'
                };
                
                res.json(exportData);
                
            } catch (error) {
                console.error('Export error:', error);
                res.status(500).json({ error: 'Export failed' });
            }
        });
        
        // API: Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'Cal Forum Server',
                version: '1.0.0',
                uptime: process.uptime(),
                cal: {
                    ready: !!this.calRoaster,
                    totalRoasts: this.calRoaster.getStats().totalRoasts
                },
                art: {
                    ready: !!this.artEngine,
                    version: this.artEngine.version
                }
            });
        });
        
        // Catch all for SPA
        this.app.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'phpbb-cal-forum.html'));
        });
    }
    
    enhanceAsciiArt(calResponse) {
        // Combine the original art with additional enhancements
        let enhancedArt = calResponse.asciiArt;
        
        // Add rarity indicators
        if (calResponse.isLegendary) {
            enhancedArt = this.artEngine.generateArt('legendary_drop') + '\n\n' + enhancedArt;
        } else if (calResponse.isCritical) {
            enhancedArt = '🔥 CRITICAL HIT! 🔥\n\n' + enhancedArt + '\n\n🔥 EXTRA DAMAGE! 🔥';
        }
        
        // Add personality-specific borders
        if (calResponse.personality === 'savage') {
            const flames = '🔥'.repeat(20);
            enhancedArt = flames + '\n' + enhancedArt + '\n' + flames;
        }
        
        return enhancedArt;
    }
    
    async logConversation(data, type) {
        try {
            const logEntry = {
                timestamp: new Date().toISOString(),
                type,
                data,
                id: this.conversationCounter
            };
            
            const logLine = JSON.stringify(logEntry) + '\n';
            await fs.appendFile(this.logFile, logLine);
            
        } catch (error) {
            console.error('Logging error:', error);
        }
    }
    
    async exportConversations() {
        try {
            const logData = await fs.readFile(this.logFile, 'utf8');
            const lines = logData.trim().split('\n').filter(line => line.length > 0);
            
            return lines.map(line => {
                try {
                    return JSON.parse(line);
                } catch {
                    return null;
                }
            }).filter(Boolean);
            
        } catch (error) {
            console.warn('No conversation log found yet:', error.message);
            return [];
        }
    }
    
    async start() {
        const server = this.app.listen(this.port, () => {
            console.log(`
🎮 CAL FORUM SERVER STARTED! 🎮
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Forum URL: http://localhost:${this.port}
📡 API Base: http://localhost:${this.port}/api/
📊 Stats: http://localhost:${this.port}/api/stats
📦 Export: http://localhost:${this.port}/api/export
❤️ Health: http://localhost:${this.port}/api/health

🎰 Cal Gacha System: READY
🎨 ASCII Art Engine: READY
📝 Conversation Logging: READY

🎯 FEATURES:
  • phpBB-style forum interface
  • Cal AI with RuneScape pet mechanics
  • RNG/gacha response system
  • Screenshot-worthy ASCII art
  • Conversation logging for chapter creation
  • 2D pixel art aesthetics
  • Real-time stats and analytics

💬 Visit the forum to start getting roasted by Cal!
📷 Screenshot the best responses and share them!
            `);
        });
        
        return server;
    }
}

module.exports = CalForumServer;

// Run server if called directly
if (require.main === module) {
    const server = new CalForumServer();
    server.start().catch(console.error);
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('\n🛑 Cal Forum Server shutting down gracefully...');
        process.exit(0);
    });
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Cal Forum Server shutting down gracefully...');
        process.exit(0);
    });
}