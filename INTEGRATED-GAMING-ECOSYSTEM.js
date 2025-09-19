#!/usr/bin/env node

/**
 * 🌍 INTEGRATED GAMING ECOSYSTEM
 * Connects all systems: Document Generator → Games → Tokens → World Boss
 * Mobile-ready with containerization support
 */

const express = require('express');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

class IntegratedGamingEcosystem {
    constructor(port = 9000) {
        this.port = port;
        this.wsPort = port + 1;
        
        // Service connections
        this.services = {
            docGen: 'http://localhost:3333',      // Document generator bridge
            tycoon: 'http://localhost:7090',      // Persistent tycoon
            security: 'http://localhost:7200',    // Security layer
            cheats: 'http://localhost:7100',      // Cheat codes
            gacha: 'http://localhost:7300',       // Gacha tokens
            master: 'http://localhost:8800'       // Master platform
        };
        
        // World state
        this.worldState = {
            totalPlayers: 0,
            totalTokensCirculating: 0,
            worldBossActive: false,
            globalEvents: [],
            economyHealth: 100
        };
        
        // Real-time connections
        this.connections = new Map();
        
        this.setupDatabase();
        this.setupServer();
        this.startWorldEventTimer();
    }
    
    setupDatabase() {
        this.db = new sqlite3.Database('ecosystem.db');
        
        this.db.serialize(() => {
            // Global economy tracking
            this.db.run(`
                CREATE TABLE IF NOT EXISTS economy_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    total_tokens INTEGER DEFAULT 0,
                    total_players INTEGER DEFAULT 0,
                    tokens_generated INTEGER DEFAULT 0,
                    tokens_spent INTEGER DEFAULT 0,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Cross-game achievements
            this.db.run(`
                CREATE TABLE IF NOT EXISTS global_achievements (
                    user_id INTEGER,
                    achievement_id TEXT,
                    game_source TEXT,
                    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id, achievement_id)
                )
            `);
            
            // Document to game conversions
            this.db.run(`
                CREATE TABLE IF NOT EXISTS doc_conversions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    document_hash TEXT UNIQUE,
                    game_type TEXT,
                    conversion_data TEXT,
                    player_count INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            console.log('🌍 Ecosystem database initialized');
        });
    }
    
    setupServer() {
        this.app = express();
        this.app.use(express.json());
        
        // WebSocket for real-time updates
        this.wss = new WebSocket.Server({ port: this.wsPort });
        this.wss.on('connection', (ws) => {
            const connectionId = crypto.randomBytes(16).toString('hex');
            this.connections.set(connectionId, ws);
            
            console.log(`🌐 New connection: ${connectionId}`);
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                this.handleMessage(connectionId, data);
            });
            
            ws.on('close', () => {
                this.connections.delete(connectionId);
            });
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'world_state',
                data: this.worldState
            }));
        });
        
        // Routes
        this.app.get('/', (req, res) => res.send(this.generateEcosystemDashboard()));
        
        // Document → Game conversion
        this.app.post('/api/convert/document', this.convertDocumentToGame.bind(this));
        
        // Global economy endpoints
        this.app.get('/api/economy/stats', this.getEconomyStats.bind(this));
        this.app.post('/api/economy/transaction', this.recordTransaction.bind(this));
        
        // World events
        this.app.get('/api/world/events', (req, res) => res.json(this.worldState.globalEvents));
        this.app.post('/api/world/trigger-boss', this.triggerWorldBoss.bind(this));
        
        // Cross-game achievements
        this.app.post('/api/achievements/unlock', this.unlockAchievement.bind(this));
        this.app.get('/api/achievements/:userId', this.getUserAchievements.bind(this));
        
        // Mobile app endpoints
        this.app.get('/api/mobile/quickplay', this.mobileQuickPlay.bind(this));
        this.app.post('/api/mobile/claim-all', this.mobileClaimAll.bind(this));
        
        this.app.listen(this.port, () => {
            console.log(`🌍 Integrated Gaming Ecosystem running on http://localhost:${this.port}`);
            console.log(`🔗 WebSocket: ws://localhost:${this.wsPort}`);
            console.log(`📱 Mobile Ready: Yes`);
            console.log(`🐳 Docker Ready: Yes`);
        });
    }
    
    async convertDocumentToGame(req, res) {
        const { document, type = 'auto' } = req.body;
        
        try {
            // Hash document for deduplication
            const docHash = crypto.createHash('sha256').update(document).digest('hex');
            
            // Check if already converted
            this.db.get(
                'SELECT * FROM doc_conversions WHERE document_hash = ?',
                [docHash],
                async (err, existing) => {
                    if (existing) {
                        return res.json({
                            success: true,
                            gameId: existing.id,
                            gameType: existing.game_type,
                            message: 'Document already converted',
                            playUrl: `/play/${existing.id}`
                        });
                    }
                    
                    // Send to document generator bridge
                    const response = await this.makeRequest(this.services.docGen + '/api/process', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ document, outputType: 'game' })
                    });
                    
                    const result = await response.json();
                    
                    // Store conversion
                    this.db.run(
                        'INSERT INTO doc_conversions (document_hash, game_type, conversion_data) VALUES (?, ?, ?)',
                        [docHash, result.gameType || 'tycoon', JSON.stringify(result)],
                        function(err) {
                            if (err) {
                                return res.status(500).json({ error: 'Failed to store conversion' });
                            }
                            
                            // Award tokens for creating content
                            const creatorReward = 500;
                            
                            res.json({
                                success: true,
                                gameId: this.lastID,
                                gameType: result.gameType || 'tycoon',
                                creatorReward,
                                playUrl: `/play/${this.lastID}`,
                                message: 'Document converted to game!'
                            });
                            
                            // Broadcast new game
                            this.broadcast({
                                type: 'new_game',
                                gameId: this.lastID,
                                gameType: result.gameType
                            });
                        }.bind(this)
                    );
                }
            );
        } catch (error) {
            console.error('Document conversion error:', error);
            res.status(500).json({ error: 'Conversion failed' });
        }
    }
    
    async triggerWorldBoss(req, res) {
        if (this.worldState.worldBossActive) {
            return res.json({
                success: false,
                message: 'World boss already active'
            });
        }
        
        // Trigger world boss across all systems
        const bossData = {
            id: crypto.randomBytes(8).toString('hex'),
            name: this.generateBossName(),
            health: 10000000,
            rewards: {
                participation: 1000,
                topDamage: 50000,
                completion: 5000
            }
        };
        
        this.worldState.worldBossActive = true;
        this.worldState.globalEvents.push({
            type: 'world_boss_spawned',
            data: bossData,
            timestamp: Date.now()
        });
        
        // Notify all connected services
        this.broadcast({
            type: 'world_boss_alert',
            boss: bossData
        });
        
        // Trigger in gacha system
        await this.makeRequest(this.services.gacha + '/api/worldboss/spawn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bossData)
        });
        
        res.json({
            success: true,
            boss: bossData,
            message: 'World boss spawned across all games!'
        });
    }
    
    generateBossName() {
        const prefixes = ['Ancient', 'Corrupted', 'Eternal', 'Shadow', 'Crystal'];
        const names = ['Dragon', 'Titan', 'Leviathan', 'Phoenix', 'Behemoth'];
        const suffixes = ['of Doom', 'the Destroyer', 'of Chaos', 'the Endless', 'of the Void'];
        
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${names[Math.floor(Math.random() * names.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
    }
    
    async mobileQuickPlay(req, res) {
        // Quick play for mobile - jump into any available game
        const games = [
            { type: 'tycoon', url: this.services.tycoon + '/game' },
            { type: 'gacha', url: this.services.gacha },
            { type: 'cheats', url: this.services.cheats }
        ];
        
        const randomGame = games[Math.floor(Math.random() * games.length)];
        
        res.json({
            game: randomGame.type,
            url: randomGame.url,
            mobileOptimized: true,
            tokens: 100 // Bonus tokens for mobile play
        });
    }
    
    async mobileClaimAll(req, res) {
        const { userId } = req.body;
        const claims = [];
        
        try {
            // Claim from all systems
            const hourlyResponse = await this.makeRequest(
                this.services.gacha + `/api/claim/hourly/${userId}`,
                { method: 'POST' }
            );
            claims.push({ type: 'hourly', result: await hourlyResponse.json() });
            
            const dailyResponse = await this.makeRequest(
                this.services.gacha + `/api/claim/daily/${userId}`,
                { method: 'POST' }
            );
            claims.push({ type: 'daily', result: await dailyResponse.json() });
            
            // Calculate total rewards
            const totalRewards = claims.reduce((sum, claim) => {
                return sum + (claim.result.reward || 0);
            }, 0);
            
            res.json({
                success: true,
                claims,
                totalRewards,
                message: `Claimed ${totalRewards} tokens from all sources!`
            });
            
        } catch (error) {
            console.error('Mobile claim error:', error);
            res.status(500).json({ error: 'Failed to claim rewards' });
        }
    }
    
    async getEconomyStats(req, res) {
        this.db.get(
            'SELECT * FROM economy_stats ORDER BY timestamp DESC LIMIT 1',
            (err, stats) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                
                res.json({
                    totalTokens: stats?.total_tokens || 0,
                    totalPlayers: this.worldState.totalPlayers,
                    tokensGenerated: stats?.tokens_generated || 0,
                    tokensSpent: stats?.tokens_spent || 0,
                    economyHealth: this.worldState.economyHealth,
                    circulationRate: this.calculateCirculationRate(stats)
                });
            }
        );
    }
    
    calculateCirculationRate(stats) {
        if (!stats || stats.tokens_generated === 0) return 0;
        return ((stats.tokens_spent / stats.tokens_generated) * 100).toFixed(2);
    }
    
    recordTransaction(req, res) {
        const { type, amount, userId } = req.body;
        
        this.db.get(
            'SELECT * FROM economy_stats ORDER BY timestamp DESC LIMIT 1',
            (err, stats) => {
                const current = stats || { tokens_generated: 0, tokens_spent: 0, total_tokens: 0 };
                
                if (type === 'generate') {
                    current.tokens_generated += amount;
                    current.total_tokens += amount;
                } else if (type === 'spend') {
                    current.tokens_spent += amount;
                    current.total_tokens -= amount;
                }
                
                this.db.run(
                    'INSERT INTO economy_stats (total_tokens, tokens_generated, tokens_spent, total_players) VALUES (?, ?, ?, ?)',
                    [current.total_tokens, current.tokens_generated, current.tokens_spent, this.worldState.totalPlayers],
                    (err) => {
                        if (err) return res.status(500).json({ error: 'Failed to record transaction' });
                        res.json({ success: true, newTotal: current.total_tokens });
                    }
                );
            }
        );
    }
    
    unlockAchievement(req, res) {
        const { userId, achievementId, gameSource } = req.body;
        
        this.db.run(
            'INSERT OR IGNORE INTO global_achievements (user_id, achievement_id, game_source) VALUES (?, ?, ?)',
            [userId, achievementId, gameSource],
            (err) => {
                if (err) return res.status(500).json({ error: 'Failed to unlock achievement' });
                
                // Award bonus tokens for achievements
                const reward = this.getAchievementReward(achievementId);
                
                res.json({
                    success: true,
                    achievement: achievementId,
                    reward,
                    message: `Achievement unlocked! +${reward} tokens`
                });
                
                // Broadcast achievement
                this.broadcast({
                    type: 'achievement_unlocked',
                    userId,
                    achievement: achievementId,
                    gameSource
                });
            }
        );
    }
    
    getAchievementReward(achievementId) {
        const rewards = {
            'first_game': 100,
            'world_boss_participant': 500,
            'gacha_legendary': 1000,
            'cheat_master': 250,
            'document_creator': 500,
            'economy_contributor': 300
        };
        
        return rewards[achievementId] || 100;
    }
    
    getUserAchievements(req, res) {
        const userId = req.params.userId;
        
        this.db.all(
            'SELECT * FROM global_achievements WHERE user_id = ? ORDER BY unlocked_at DESC',
            [userId],
            (err, achievements) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                
                res.json({
                    userId,
                    achievements,
                    totalCount: achievements.length,
                    totalRewards: achievements.reduce((sum, a) => sum + this.getAchievementReward(a.achievement_id), 0)
                });
            }
        );
    }
    
    handleMessage(connectionId, data) {
        const ws = this.connections.get(connectionId);
        
        switch (data.type) {
            case 'join_world':
                this.worldState.totalPlayers++;
                this.broadcast({
                    type: 'player_joined',
                    totalPlayers: this.worldState.totalPlayers
                });
                break;
                
            case 'chat':
                this.broadcast({
                    type: 'chat_message',
                    message: data.message,
                    userId: data.userId,
                    timestamp: Date.now()
                });
                break;
                
            case 'request_state':
                ws.send(JSON.stringify({
                    type: 'world_state',
                    data: this.worldState
                }));
                break;
        }
    }
    
    broadcast(message) {
        const data = JSON.stringify(message);
        this.connections.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });
    }
    
    startWorldEventTimer() {
        // Random world events every 30 minutes
        setInterval(() => {
            const events = [
                { type: 'double_tokens', duration: 600000 }, // 10 minutes
                { type: 'boss_incoming', countdown: 300000 }, // 5 minute warning
                { type: 'gacha_rate_up', multiplier: 2, duration: 900000 }, // 15 minutes
                { type: 'pvp_tournament', prizes: [10000, 5000, 2500] }
            ];
            
            const event = events[Math.floor(Math.random() * events.length)];
            event.timestamp = Date.now();
            
            this.worldState.globalEvents.push(event);
            
            // Keep only last 10 events
            if (this.worldState.globalEvents.length > 10) {
                this.worldState.globalEvents.shift();
            }
            
            this.broadcast({
                type: 'world_event',
                event
            });
            
            console.log(`🌟 World event triggered: ${event.type}`);
        }, 30 * 60 * 1000); // 30 minutes
    }
    
    makeRequest(url, options = {}) {
        const http = require('http');
        const https = require('https');
        
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const httpModule = urlObj.protocol === 'https:' ? https : http;
            
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: options.headers || {}
            };
            
            const req = httpModule.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        json: () => Promise.resolve(JSON.parse(data)),
                        text: () => Promise.resolve(data),
                        status: res.statusCode,
                        ok: res.statusCode >= 200 && res.statusCode < 300
                    });
                });
            });
            
            req.on('error', reject);
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }
    
    generateEcosystemDashboard() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🌍 Integrated Gaming Ecosystem</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .title {
            font-size: 3rem;
            margin-bottom: 10px;
            text-shadow: 0 2px 20px rgba(0,0,0,0.3);
        }
        
        .subtitle {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            text-align: center;
            transition: transform 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-value {
            font-size: 2.5rem;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .stat-label {
            opacity: 0.8;
            text-transform: uppercase;
            font-size: 0.9rem;
        }
        
        .games-section {
            margin-bottom: 40px;
        }
        
        .section-title {
            font-size: 2rem;
            margin-bottom: 20px;
        }
        
        .game-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .game-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            transition: all 0.3s;
            cursor: pointer;
        }
        
        .game-card:hover {
            background: rgba(255,255,255,0.2);
            transform: scale(1.05);
        }
        
        .game-icon {
            font-size: 3rem;
            margin-bottom: 15px;
        }
        
        .game-title {
            font-size: 1.5rem;
            margin-bottom: 10px;
        }
        
        .game-description {
            opacity: 0.9;
            margin-bottom: 15px;
        }
        
        .play-btn {
            background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
            border: none;
            color: white;
            padding: 12px 30px;
            border-radius: 25px;
            font-size: 1rem;
            cursor: pointer;
            width: 100%;
            transition: all 0.3s;
        }
        
        .play-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        }
        
        .world-events {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 40px;
        }
        
        .event-list {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .event-item {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .event-icon {
            font-size: 2rem;
        }
        
        .upload-section {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            margin-bottom: 40px;
        }
        
        .upload-area {
            border: 3px dashed rgba(255,255,255,0.3);
            border-radius: 15px;
            padding: 40px;
            margin: 20px 0;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .upload-area:hover {
            border-color: rgba(255,255,255,0.6);
            background: rgba(255,255,255,0.05);
        }
        
        .mobile-banner {
            background: linear-gradient(45deg, #11998e 0%, #38ef7d 100%);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 40px;
        }
        
        @media (max-width: 768px) {
            .title { font-size: 2rem; }
            .stat-value { font-size: 2rem; }
            .container { padding: 10px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🌍 Integrated Gaming Ecosystem</h1>
            <p class="subtitle">Document → Game → Tokens → Glory</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-label">Total Players</div>
                <div class="stat-value" id="totalPlayers">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Tokens in Circulation</div>
                <div class="stat-value" id="totalTokens">0</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Active Games</div>
                <div class="stat-value" id="activeGames">5</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">World Boss</div>
                <div class="stat-value" id="bossStatus">🟢 Ready</div>
            </div>
        </div>
        
        <div class="mobile-banner">
            <h2>📱 Mobile Optimized!</h2>
            <p>Play on any device - Phone, Tablet, or Desktop</p>
            <button class="play-btn" onclick="quickPlay()">Quick Play</button>
        </div>
        
        <div class="upload-section">
            <h2 class="section-title">📄 Convert Document to Game</h2>
            <div class="upload-area" onclick="uploadDocument()">
                <div style="font-size: 3rem;">📤</div>
                <p>Drop any document here to create a game!</p>
                <p style="font-size: 0.9rem; opacity: 0.7;">Supports: PDF, TXT, MD, Chat Logs</p>
            </div>
        </div>
        
        <div class="games-section">
            <h2 class="section-title">🎮 Available Games</h2>
            <div class="game-grid">
                <div class="game-card" onclick="playGame('tycoon')">
                    <div class="game-icon">🏭</div>
                    <div class="game-title">Persistent Tycoon</div>
                    <div class="game-description">Build your empire with 3D graphics and database persistence</div>
                    <button class="play-btn">Play Now</button>
                </div>
                
                <div class="game-card" onclick="playGame('gacha')">
                    <div class="game-icon">🎰</div>
                    <div class="game-title">Gacha Tokens</div>
                    <div class="game-description">Collect hourly rewards and roll for legendary items</div>
                    <button class="play-btn">Play Now</button>
                </div>
                
                <div class="game-card" onclick="playGame('cheats')">
                    <div class="game-icon">💀</div>
                    <div class="game-title">Classic Cheats</div>
                    <div class="game-description">IDDQD, showmethemoney, and more!</div>
                    <button class="play-btn">Play Now</button>
                </div>
                
                <div class="game-card" onclick="playGame('world-boss')">
                    <div class="game-icon">🐉</div>
                    <div class="game-title">World Boss</div>
                    <div class="game-description">Unite with all players to defeat epic bosses</div>
                    <button class="play-btn">Join Battle</button>
                </div>
            </div>
        </div>
        
        <div class="world-events">
            <h2 class="section-title">🌟 World Events</h2>
            <div class="event-list" id="eventList">
                <div class="event-item">
                    <div class="event-icon">🎉</div>
                    <div>
                        <strong>Welcome Event</strong>
                        <p>All new players get 1000 bonus tokens!</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let ws = null;
        let worldState = {};
        
        // Connect to WebSocket
        function connect() {
            ws = new WebSocket('ws://localhost:9001');
            
            ws.onopen = () => {
                console.log('Connected to ecosystem');
                ws.send(JSON.stringify({ type: 'join_world' }));
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleMessage(data);
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            ws.onclose = () => {
                console.log('Disconnected, reconnecting...');
                setTimeout(connect, 3000);
            };
        }
        
        function handleMessage(data) {
            switch (data.type) {
                case 'world_state':
                    updateWorldState(data.data);
                    break;
                case 'player_joined':
                    document.getElementById('totalPlayers').textContent = data.totalPlayers;
                    break;
                case 'world_event':
                    addWorldEvent(data.event);
                    break;
                case 'world_boss_alert':
                    showBossAlert(data.boss);
                    break;
            }
        }
        
        function updateWorldState(state) {
            worldState = state;
            document.getElementById('totalPlayers').textContent = state.totalPlayers;
            document.getElementById('bossStatus').textContent = state.worldBossActive ? '🔴 ACTIVE!' : '🟢 Ready';
        }
        
        function playGame(gameType) {
            const urls = {
                'tycoon': 'http://localhost:7090/game',
                'gacha': 'http://localhost:7300',
                'cheats': 'http://localhost:7100',
                'world-boss': 'http://localhost:7300'
            };
            
            window.open(urls[gameType], '_blank');
        }
        
        async function quickPlay() {
            try {
                const response = await fetch('/api/mobile/quickplay');
                const data = await response.json();
                window.open(data.url, '_blank');
            } catch (error) {
                console.error('Quick play error:', error);
            }
        }
        
        function uploadDocument() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.txt,.md,.pdf,.json';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const response = await fetch('/api/convert/document', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                document: event.target.result,
                                type: 'auto'
                            })
                        });
                        
                        const result = await response.json();
                        
                        if (result.success) {
                            alert('Document converted! You earned ' + result.creatorReward + ' tokens!');
                            window.open(result.playUrl, '_blank');
                        }
                    } catch (error) {
                        alert('Conversion failed: ' + error.message);
                    }
                };
                
                reader.readAsText(file);
            };
            
            input.click();
        }
        
        function addWorldEvent(event) {
            const eventList = document.getElementById('eventList');
            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            
            const icons = {
                'double_tokens': '💰',
                'boss_incoming': '🐉',
                'gacha_rate_up': '🎰',
                'pvp_tournament': '⚔️'
            };
            
            eventItem.innerHTML = '<div class="event-icon">' + (icons[event.type] || '🌟') + '</div><div><strong>' + event.type.replace(/_/g, ' ').toUpperCase() + '</strong><p>Event active now!</p></div>';
            
            eventList.insertBefore(eventItem, eventList.firstChild);
            
            // Keep only last 5 events
            while (eventList.children.length > 5) {
                eventList.removeChild(eventList.lastChild);
            }
        }
        
        function showBossAlert(boss) {
            const alert = document.createElement('div');
            alert.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(231, 76, 60, 0.9); padding: 40px; border-radius: 20px; text-align: center; z-index: 1000;';
            
            alert.innerHTML = '<h1 style="font-size: 3rem; margin-bottom: 20px;">🐉 WORLD BOSS SPAWNED!</h1><h2>' + boss.name + '</h2><p>Unite to defeat the boss and earn massive rewards!</p><button class="play-btn" onclick="playGame(\'world-boss\')">Join Battle</button>';
            
            document.body.appendChild(alert);
            
            setTimeout(() => alert.remove(), 10000);
        }
        
        // Auto-update stats
        async function updateStats() {
            try {
                const response = await fetch('/api/economy/stats');
                const stats = await response.json();
                document.getElementById('totalTokens').textContent = stats.totalTokens.toLocaleString();
            } catch (error) {
                console.error('Stats update error:', error);
            }
        }
        
        // Initialize
        connect();
        updateStats();
        setInterval(updateStats, 30000); // Update every 30 seconds
    </script>
</body>
</html>`;
    }
}

// Start the integrated ecosystem
if (require.main === module) {
    new IntegratedGamingEcosystem(9000);
}

module.exports = IntegratedGamingEcosystem;