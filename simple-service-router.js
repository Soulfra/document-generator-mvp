#!/usr/bin/env node

/**
 * 🎯 SIMPLE SERVICE ROUTER 🎯
 * 
 * Lightweight assembly layer: Wire emoji clicks → existing service ports
 * No new systems - just route keyboards → functions → context → feedback
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

class SimpleServiceRouter {
    constructor(options = {}) {
        this.app = express();
        this.port = options.port || 9900;
        
        // Load existing service mappings from STOP-VORTEX-MASTER-PLAN.json
        this.serviceMap = null;
        this.emojiMap = null;
        this.userState = new Map(); // Simple user context
        
        // Known service ports from existing systems
        this.servicePorts = {
            'auth': 8888,
            'chapter7': 3001,
            'colorGames': 8787,
            'iqTesting': 3002,
            'bossBalance': 8888,
            'electron': 8080,
            'quest': 9999,
            'pdf': 7777,
            'mobile': 9800
        };
        
        // Simple emoji → service routing
        this.routingTable = {
            // Gaming & Interactive
            '🎮': { service: 'colorGames', port: 8787, path: '/api/games' },
            '🌈': { service: 'colorGames', port: 8787, path: '/api/pattern-pursuit' },
            '💙': { service: 'colorGames', port: 8787, path: '/api/emotion-explorer' },
            '⚡': { service: 'colorGames', port: 8787, path: '/api/color-clash' },
            
            // Stories & Content
            '📖': { service: 'chapter7', port: 3001, path: '/api/chapter7/story' },
            '📚': { service: 'chapter7', port: 3001, path: '/api/chapter7/library' },
            
            // Intelligence & Testing
            '🧠': { service: 'iqTesting', port: 3002, path: '/api/testing/start' },
            '🔍': { service: 'iqTesting', port: 3002, path: '/api/testing/search' },
            
            // System Tools
            '🔧': { service: 'electron', port: 8080, path: '/api/tools' },
            '⚙️': { service: 'electron', port: 8080, path: '/api/plugins' },
            
            // Security & Defense
            '🛡️': { service: 'auth', port: 8888, path: '/api/security' },
            
            // Boss Battles
            '👑': { service: 'bossBalance', port: 8888, path: '/api/boss/battle' },
            '⚔️': { service: 'bossBalance', port: 8888, path: '/api/boss/tutorial' },
            
            // Quests
            '🗡️': { service: 'quest', port: 9999, path: '/api/quest/active' },
            '🏆': { service: 'quest', port: 9999, path: '/api/quest/achievements' },
            
            // Mobile
            '📱': { service: 'mobile', port: 9800, path: '/api/mobile' }
        };
        
        console.log('🎯 Simple Service Router initializing...');
    }
    
    async initialize() {
        console.log('🔧 Setting up simple assembly layer...');
        
        // Load existing configurations
        await this.loadExistingConfigs();
        
        // Set up middleware
        this.setupMiddleware();
        
        // Set up routes
        this.setupRoutes();
        
        // Start server
        this.server = this.app.listen(this.port, () => {
            console.log(`✅ Simple Service Router running on port ${this.port}`);
            console.log(`📱 Access at: http://localhost:${this.port}`);
        });
    }
    
    async loadExistingConfigs() {
        try {
            // Load STOP-VORTEX master plan
            const vortexPlan = await fs.readFile('./STOP-VORTEX-MASTER-PLAN.json', 'utf-8');
            this.serviceMap = JSON.parse(vortexPlan);
            
            // Load emoji navigation config if it exists
            try {
                const emojiConfig = await fs.readFile('./emoji-navigation-config.json', 'utf-8');
                this.emojiMap = JSON.parse(emojiConfig);
            } catch (e) {
                console.log('   No emoji config found, using defaults');
            }
            
            console.log('   Loaded existing service configurations');
        } catch (error) {
            console.log('   Using default configuration');
        }
    }
    
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Simple user context middleware
        this.app.use((req, res, next) => {
            const userId = req.headers['user-id'] || 'default';
            req.userId = userId;
            
            // Get or create user state
            if (!this.userState.has(userId)) {
                this.userState.set(userId, {
                    id: userId,
                    level: 0,
                    xp: 0,
                    completedQuests: [],
                    availableEmojis: ['🎮', '📖', '🧠', '🔧'], // Start with basics
                    lastActive: new Date()
                });
            }
            
            req.userState = this.userState.get(userId);
            next();
        });
    }
    
    setupRoutes() {
        // Main emoji routing endpoint
        this.app.post('/route/:emoji', async (req, res) => {
            const emoji = req.params.emoji;
            const { userId } = req;
            const userState = req.userState;
            
            console.log(`🎯 Routing ${emoji} for user ${userId}`);
            
            // Check if user has access to this emoji
            if (!userState.availableEmojis.includes(emoji)) {
                return res.json({
                    success: false,
                    message: 'Emoji not unlocked yet!',
                    unlockHint: 'Complete more quests to unlock this feature'
                });
            }
            
            // Get routing info
            const route = this.routingTable[emoji];
            if (!route) {
                return res.json({
                    success: false,
                    message: 'Service not found',
                    availableEmojis: userState.availableEmojis
                });
            }
            
            try {
                // Route to the actual service
                const serviceUrl = `http://localhost:${route.port}${route.path}`;
                const response = await this.callService(serviceUrl, req.body, {
                    userId,
                    userState,
                    emoji
                });
                
                // Update user state based on response
                await this.updateUserProgress(userId, emoji, response);
                
                res.json({
                    success: true,
                    emoji,
                    service: route.service,
                    data: response,
                    userState: this.userState.get(userId)
                });
                
            } catch (error) {
                console.error(`❌ Service routing failed for ${emoji}:`, error.message);
                res.json({
                    success: false,
                    message: 'Service temporarily unavailable',
                    emoji,
                    error: error.message
                });
            }
        });
        
        // Get available emojis for user
        this.app.get('/emojis/:userId', (req, res) => {
            const userId = req.params.userId;
            const userState = this.userState.get(userId) || this.userState.get('default');
            
            const emojiInfo = userState.availableEmojis.map(emoji => ({
                emoji,
                route: this.routingTable[emoji],
                unlocked: true
            }));
            
            // Add locked emojis as preview
            const allEmojis = Object.keys(this.routingTable);
            const lockedEmojis = allEmojis.filter(emoji => !userState.availableEmojis.includes(emoji));
            
            const lockedInfo = lockedEmojis.slice(0, 3).map(emoji => ({
                emoji,
                route: this.routingTable[emoji],
                unlocked: false,
                unlockHint: `Reach level ${Math.ceil(allEmojis.indexOf(emoji) / 2)} to unlock`
            }));
            
            res.json({
                available: emojiInfo,
                locked: lockedInfo,
                userLevel: userState.level,
                userXP: userState.xp
            });
        });
        
        // Simple health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                router: 'simple-service-router',
                services: Object.keys(this.routingTable).length,
                activeUsers: this.userState.size,
                uptime: process.uptime()
            });
        });
        
        // Simple UI for testing
        this.app.get('/', (req, res) => {
            res.send(this.generateSimpleUI());
        });
    }
    
    async callService(serviceUrl, data, context) {
        // In a real implementation, this would make HTTP calls to the services
        // For now, return mock responses based on service type
        
        const { emoji, userId } = context;
        
        // Mock responses for testing
        const mockResponses = {
            '🎮': { action: 'game-started', gameId: 'pattern-pursuit', score: 0 },
            '🌈': { action: 'pattern-game', level: 1, patterns: ['red', 'blue', 'green'] },
            '💙': { action: 'emotion-game', emotions: ['happy', 'sad', 'excited'], colors: ['blue', 'gray', 'yellow'] },
            '📖': { action: 'story-started', chapter: 1, title: 'The Dependency Discovery' },
            '🧠': { action: 'iq-test', questions: 10, timeLimit: 300 },
            '🔧': { action: 'tools-opened', availableTools: ['dependency-analyzer', 'file-categorizer'] },
            '🛡️': { action: 'security-check', status: 'protected', level: 'medium' },
            '👑': { action: 'boss-encounter', boss: 'dependency-hydra', difficulty: 'epic' },
            '📱': { action: 'mobile-optimized', features: ['touch', 'haptic', 'offline'] }
        };
        
        // Simulate service call delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return mockResponses[emoji] || { action: 'generic-response', emoji };
    }
    
    async updateUserProgress(userId, emoji, response) {
        const userState = this.userState.get(userId);
        if (!userState) return;
        
        // Simple XP gain
        userState.xp += 10;
        
        // Level up check
        const newLevel = Math.floor(userState.xp / 100);
        if (newLevel > userState.level) {
            userState.level = newLevel;
            
            // Unlock new emojis based on level
            this.unlockEmojisForLevel(userState, newLevel);
            
            console.log(`🎉 User ${userId} leveled up to ${newLevel}!`);
        }
        
        // Track activity
        userState.lastActive = new Date();
        
        // Simple quest progression (mock)
        if (response.action && !userState.completedQuests.includes(response.action)) {
            userState.completedQuests.push(response.action);
        }
    }
    
    unlockEmojisForLevel(userState, level) {
        const unlockSchedule = {
            1: ['⚡', '📚'],
            2: ['🔍', '⚙️'],
            3: ['🛡️', '🗡️'],
            4: ['👑', '⚔️'],
            5: ['🏆', '📱']
        };
        
        if (unlockSchedule[level]) {
            unlockSchedule[level].forEach(emoji => {
                if (!userState.availableEmojis.includes(emoji)) {
                    userState.availableEmojis.push(emoji);
                }
            });
        }
    }
    
    generateSimpleUI() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Simple Service Router</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            text-align: center; 
        }
        .emoji-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin: 30px 0;
        }
        .emoji-btn {
            background: rgba(255,255,255,0.1);
            border: none;
            border-radius: 12px;
            padding: 20px 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            backdrop-filter: blur(10px);
            color: white;
        }
        .emoji-btn:hover {
            background: rgba(255,255,255,0.2);
            transform: translateY(-2px);
        }
        .emoji {
            font-size: 32px;
            display: block;
            margin-bottom: 8px;
        }
        .label {
            font-size: 12px;
            opacity: 0.9;
        }
        .user-info {
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            backdrop-filter: blur(10px);
        }
        .result {
            background: rgba(0,0,0,0.2);
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            text-align: left;
            font-family: monospace;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 Simple Service Router</h1>
        <p>Click emojis to route to existing services</p>
        
        <div class="user-info">
            <div>User: <span id="userId">default</span></div>
            <div>Level: <span id="userLevel">0</span></div>
            <div>XP: <span id="userXP">0</span></div>
        </div>
        
        <div class="emoji-grid" id="emojiGrid">
            <!-- Emojis will be loaded here -->
        </div>
        
        <div id="result" class="result" style="display:none;"></div>
    </div>

    <script>
        let userId = 'user-' + Math.random().toString(36).substr(2, 9);
        document.getElementById('userId').textContent = userId;
        
        async function loadEmojis() {
            try {
                const response = await fetch(\`/emojis/\${userId}\`);
                const data = await response.json();
                
                document.getElementById('userLevel').textContent = data.userLevel;
                document.getElementById('userXP').textContent = data.userXP;
                
                const grid = document.getElementById('emojiGrid');
                grid.innerHTML = '';
                
                // Available emojis
                data.available.forEach(item => {
                    const btn = document.createElement('button');
                    btn.className = 'emoji-btn';
                    btn.onclick = () => routeEmoji(item.emoji);
                    btn.innerHTML = \`
                        <span class="emoji">\${item.emoji}</span>
                        <span class="label">\${item.route.service}</span>
                    \`;
                    grid.appendChild(btn);
                });
                
                // Locked emojis (preview)
                data.locked.forEach(item => {
                    const btn = document.createElement('button');
                    btn.className = 'emoji-btn';
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                    btn.title = item.unlockHint;
                    btn.innerHTML = \`
                        <span class="emoji">\${item.emoji}</span>
                        <span class="label">🔒 Locked</span>
                    \`;
                    grid.appendChild(btn);
                });
                
            } catch (error) {
                console.error('Failed to load emojis:', error);
            }
        }
        
        async function routeEmoji(emoji) {
            try {
                const response = await fetch(\`/route/\${encodeURIComponent(emoji)}\`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'user-id': userId
                    },
                    body: JSON.stringify({})
                });
                
                const data = await response.json();
                
                document.getElementById('result').style.display = 'block';
                document.getElementById('result').innerHTML = 
                    \`<strong>Response:</strong><br>\${JSON.stringify(data, null, 2)}\`;
                
                // Refresh emojis to show any newly unlocked ones
                setTimeout(loadEmojis, 500);
                
            } catch (error) {
                console.error('Routing failed:', error);
            }
        }
        
        // Load initial emojis
        loadEmojis();
    </script>
</body>
</html>`;
    }
}

// Export for use as module
module.exports = SimpleServiceRouter;

// CLI interface
if (require.main === module) {
    const router = new SimpleServiceRouter();
    
    console.log('🎯 SIMPLE SERVICE ROUTER');
    console.log('======================\n');
    
    router.initialize().catch(console.error);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down router...');
        if (router.server) {
            router.server.close(() => {
                console.log('✅ Router stopped');
                process.exit(0);
            });
        }
    });
}