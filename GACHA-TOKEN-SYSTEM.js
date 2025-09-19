#!/usr/bin/env node

/**
 * 🎰 GACHA TOKEN SYSTEM
 * Hourly login rewards, token economy, and world boss mechanics
 * Mobile-ready with containerization support
 */

const express = require('express');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

class GachaTokenSystem {
    constructor(port = 7300) {
        this.port = port;
        this.wsPort = port + 1;
        
        // Token economy configuration
        this.tokenConfig = {
            hourlyReward: 100,          // Free tokens per hour
            dailyBonus: 1000,           // Daily login bonus
            weeklyBonus: 5000,          // Weekly streak bonus
            worldBossReward: 500,       // Participation reward
            gachaRollCost: 50,          // Cost per gacha roll
            maxDailyFreeTokens: 2400    // Cap on free tokens
        };
        
        // World boss configuration
        this.worldBoss = {
            active: false,
            health: 1000000,
            maxHealth: 1000000,
            participants: new Map(),
            rewards: {
                damage: 1,              // Tokens per damage point
                topDamage: 10000,       // Top damage dealer bonus
                participation: 500      // Just for joining
            }
        };
        
        // Gacha rates
        this.gachaRates = {
            common: 60,      // 60%
            rare: 30,        // 30%
            epic: 8,         // 8%
            legendary: 2     // 2%
        };
        
        this.setupDatabase();
        this.setupServer();
        this.startHourlyRewardTimer();
        this.startWorldBossTimer();
    }
    
    setupDatabase() {
        this.db = new sqlite3.Database('gacha_tokens.db');
        
        // Create tables
        this.db.serialize(() => {
            // User tokens and login tracking
            this.db.run(`
                CREATE TABLE IF NOT EXISTS user_tokens (
                    user_id INTEGER PRIMARY KEY,
                    tokens INTEGER DEFAULT 0,
                    last_hourly_claim DATETIME,
                    last_daily_claim DATE,
                    login_streak INTEGER DEFAULT 0,
                    total_earned INTEGER DEFAULT 0,
                    total_spent INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Gacha history
            this.db.run(`
                CREATE TABLE IF NOT EXISTS gacha_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    rarity TEXT,
                    item_name TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES user_tokens(user_id)
                )
            `);
            
            // World boss damage tracking
            this.db.run(`
                CREATE TABLE IF NOT EXISTS world_boss_damage (
                    user_id INTEGER,
                    boss_session INTEGER,
                    damage_dealt INTEGER DEFAULT 0,
                    rewards_claimed INTEGER DEFAULT 0,
                    PRIMARY KEY (user_id, boss_session)
                )
            `);
            
            console.log('💾 Gacha database initialized');
        });
    }
    
    setupServer() {
        this.app = express();
        this.app.use(express.json());
        
        // WebSocket for real-time updates
        this.wss = new WebSocket.Server({ port: this.wsPort });
        this.wss.on('connection', (ws) => {
            console.log('🎰 Player connected to gacha system');
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                this.handleWebSocketMessage(ws, data);
            });
        });
        
        // Routes
        this.app.get('/', (req, res) => res.send(this.generateGachaInterface()));
        this.app.post('/api/claim/hourly/:userId', this.claimHourlyReward.bind(this));
        this.app.post('/api/claim/daily/:userId', this.claimDailyBonus.bind(this));
        this.app.post('/api/gacha/roll/:userId', this.performGachaRoll.bind(this));
        this.app.get('/api/tokens/:userId', this.getTokenBalance.bind(this));
        this.app.post('/api/worldboss/attack/:userId', this.attackWorldBoss.bind(this));
        this.app.get('/api/worldboss/status', this.getWorldBossStatus.bind(this));
        
        this.

// Auto-injected health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Gacha Token System',
        port: 7300,
        timestamp: Date.now(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        description: 'Gacha token economy and rewards'
    });
});

app.get('/ready', (req, res) => {
    // Add any readiness checks here
    res.json({
        status: 'ready',
        service: 'Gacha Token System',
        timestamp: Date.now()
    });
});

app.listen(this.port, () => {
            console.log(`🎰 Gacha Token System running on http://localhost:${this.port}`);
            console.log(`💰 Hourly rewards: ${this.tokenConfig.hourlyReward} tokens`);
            console.log(`🎲 Gacha roll cost: ${this.tokenConfig.gachaRollCost} tokens`);
            console.log(`🐉 World boss: Ready to spawn`);
        });
    }
    
    claimHourlyReward(req, res) {
        const userId = parseInt(req.params.userId);
        const now = new Date();
        
        this.db.get(
            'SELECT * FROM user_tokens WHERE user_id = ?',
            [userId],
            (err, user) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                
                // Create user if doesn't exist
                if (!user) {
                    this.createUser(userId, (err) => {
                        if (err) return res.status(500).json({ error: 'Failed to create user' });
                        this.claimHourlyReward(req, res);
                    });
                    return;
                }
                
                // Check if can claim
                const lastClaim = user.last_hourly_claim ? new Date(user.last_hourly_claim) : new Date(0);
                const hoursSinceLastClaim = (now - lastClaim) / (1000 * 60 * 60);
                
                if (hoursSinceLastClaim < 1) {
                    const minutesLeft = Math.ceil((1 - hoursSinceLastClaim) * 60);
                    return res.json({
                        success: false,
                        message: `Next claim in ${minutesLeft} minutes`,
                        minutesLeft
                    });
                }
                
                // Award tokens
                const reward = this.tokenConfig.hourlyReward;
                this.db.run(
                    'UPDATE user_tokens SET tokens = tokens + ?, last_hourly_claim = ?, total_earned = total_earned + ? WHERE user_id = ?',
                    [reward, now.toISOString(), reward, userId],
                    (err) => {
                        if (err) return res.status(500).json({ error: 'Failed to award tokens' });
                        
                        // Broadcast update
                        this.broadcastTokenUpdate(userId, user.tokens + reward);
                        
                        res.json({
                            success: true,
                            reward,
                            newBalance: user.tokens + reward,
                            message: `Claimed ${reward} tokens!`
                        });
                    }
                );
            }
        );
    }
    
    claimDailyBonus(req, res) {
        const userId = parseInt(req.params.userId);
        const today = new Date().toISOString().split('T')[0];
        
        this.db.get(
            'SELECT * FROM user_tokens WHERE user_id = ?',
            [userId],
            (err, user) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                
                // Check if already claimed today
                const lastDaily = user.last_daily_claim;
                if (lastDaily === today) {
                    return res.json({
                        success: false,
                        message: 'Daily bonus already claimed'
                    });
                }
                
                // Calculate streak
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];
                
                const newStreak = lastDaily === yesterdayStr ? user.login_streak + 1 : 1;
                const streakBonus = Math.min(newStreak * 100, 1000); // Max 1000 bonus
                const totalReward = this.tokenConfig.dailyBonus + streakBonus;
                
                this.db.run(
                    'UPDATE user_tokens SET tokens = tokens + ?, last_daily_claim = ?, login_streak = ?, total_earned = total_earned + ? WHERE user_id = ?',
                    [totalReward, today, newStreak, totalReward, userId],
                    (err) => {
                        if (err) return res.status(500).json({ error: 'Failed to award bonus' });
                        
                        res.json({
                            success: true,
                            reward: totalReward,
                            baseReward: this.tokenConfig.dailyBonus,
                            streakBonus,
                            streak: newStreak,
                            newBalance: user.tokens + totalReward
                        });
                    }
                );
            }
        );
    }
    
    performGachaRoll(req, res) {
        const userId = parseInt(req.params.userId);
        const { rolls = 1 } = req.body;
        const cost = this.tokenConfig.gachaRollCost * rolls;
        
        this.db.get(
            'SELECT tokens FROM user_tokens WHERE user_id = ?',
            [userId],
            (err, user) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                if (!user) return res.status(404).json({ error: 'User not found' });
                
                if (user.tokens < cost) {
                    return res.json({
                        success: false,
                        message: 'Insufficient tokens',
                        required: cost,
                        current: user.tokens
                    });
                }
                
                // Perform rolls
                const results = [];
                for (let i = 0; i < rolls; i++) {
                    const roll = this.rollGacha();
                    results.push(roll);
                    
                    // Save to history
                    this.db.run(
                        'INSERT INTO gacha_history (user_id, rarity, item_name) VALUES (?, ?, ?)',
                        [userId, roll.rarity, roll.item]
                    );
                }
                
                // Deduct tokens
                this.db.run(
                    'UPDATE user_tokens SET tokens = tokens - ?, total_spent = total_spent + ? WHERE user_id = ?',
                    [cost, cost, userId],
                    (err) => {
                        if (err) return res.status(500).json({ error: 'Failed to deduct tokens' });
                        
                        res.json({
                            success: true,
                            results,
                            cost,
                            newBalance: user.tokens - cost
                        });
                    }
                );
            }
        );
    }
    
    rollGacha() {
        const roll = Math.random() * 100;
        let rarity, item;
        
        if (roll < this.gachaRates.common) {
            rarity = 'common';
            item = this.getRandomItem('common');
        } else if (roll < this.gachaRates.common + this.gachaRates.rare) {
            rarity = 'rare';
            item = this.getRandomItem('rare');
        } else if (roll < this.gachaRates.common + this.gachaRates.rare + this.gachaRates.epic) {
            rarity = 'epic';
            item = this.getRandomItem('epic');
        } else {
            rarity = 'legendary';
            item = this.getRandomItem('legendary');
        }
        
        return { rarity, item };
    }
    
    getRandomItem(rarity) {
        const items = {
            common: ['Wood Sword', 'Basic Shield', 'Health Potion', 'Copper Coin'],
            rare: ['Steel Sword', 'Magic Shield', 'Greater Potion', 'Silver Coin'],
            epic: ['Mithril Sword', 'Dragon Shield', 'Epic Elixir', 'Gold Coin'],
            legendary: ['Excalibur', 'Aegis Shield', 'Phoenix Feather', 'Diamond']
        };
        
        const rarityItems = items[rarity];
        return rarityItems[Math.floor(Math.random() * rarityItems.length)];
    }
    
    attackWorldBoss(req, res) {
        const userId = parseInt(req.params.userId);
        const { damage } = req.body;
        
        if (!this.worldBoss.active) {
            return res.json({
                success: false,
                message: 'No active world boss'
            });
        }
        
        // Record damage
        if (!this.worldBoss.participants.has(userId)) {
            this.worldBoss.participants.set(userId, 0);
        }
        
        const currentDamage = this.worldBoss.participants.get(userId);
        this.worldBoss.participants.set(userId, currentDamage + damage);
        this.worldBoss.health = Math.max(0, this.worldBoss.health - damage);
        
        // Broadcast boss update
        this.broadcastWorldBossUpdate();
        
        // Check if boss defeated
        if (this.worldBoss.health === 0) {
            this.distributeWorldBossRewards();
        }
        
        res.json({
            success: true,
            damage,
            bossHealth: this.worldBoss.health,
            totalDamage: currentDamage + damage
        });
    }
    
    distributeWorldBossRewards() {
        // Sort participants by damage
        const sorted = Array.from(this.worldBoss.participants.entries())
            .sort((a, b) => b[1] - a[1]);
        
        sorted.forEach(([userId, damage], index) => {
            let reward = this.worldBoss.rewards.participation;
            
            // Damage bonus
            reward += Math.floor(damage * this.worldBoss.rewards.damage);
            
            // Top damage bonus
            if (index === 0) {
                reward += this.worldBoss.rewards.topDamage;
            }
            
            // Award tokens
            this.db.run(
                'UPDATE user_tokens SET tokens = tokens + ? WHERE user_id = ?',
                [reward, userId]
            );
            
            // Save to database
            this.db.run(
                'INSERT INTO world_boss_damage (user_id, boss_session, damage_dealt, rewards_claimed) VALUES (?, ?, ?, ?)',
                [userId, Date.now(), damage, reward]
            );
        });
        
        // Reset boss
        this.worldBoss.active = false;
        this.worldBoss.participants.clear();
    }
    
    getWorldBossStatus(req, res) {
        res.json({
            active: this.worldBoss.active,
            health: this.worldBoss.health,
            maxHealth: this.worldBoss.maxHealth,
            participants: this.worldBoss.participants.size,
            rewards: this.worldBoss.rewards
        });
    }
    
    getTokenBalance(req, res) {
        const userId = parseInt(req.params.userId);
        
        this.db.get(
            'SELECT tokens, login_streak FROM user_tokens WHERE user_id = ?',
            [userId],
            (err, user) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                
                res.json({
                    tokens: user ? user.tokens : 0,
                    streak: user ? user.login_streak : 0
                });
            }
        );
    }
    
    createUser(userId, callback) {
        this.db.run(
            'INSERT INTO user_tokens (user_id, tokens) VALUES (?, ?)',
            [userId, this.tokenConfig.hourlyReward], // Start with hourly reward
            callback
        );
    }
    
    startHourlyRewardTimer() {
        // Check every minute for users eligible for hourly rewards
        setInterval(() => {
            const now = new Date();
            console.log(`⏰ Hourly reward check at ${now.toLocaleTimeString()}`);
        }, 60000); // Every minute
    }
    
    startWorldBossTimer() {
        // Spawn world boss every 2 hours
        setInterval(() => {
            if (!this.worldBoss.active) {
                this.spawnWorldBoss();
            }
        }, 2 * 60 * 60 * 1000); // 2 hours
        
        // Spawn first boss in 5 minutes
        setTimeout(() => this.spawnWorldBoss(), 5 * 60 * 1000);
    }
    
    spawnWorldBoss() {
        this.worldBoss.active = true;
        this.worldBoss.health = this.worldBoss.maxHealth;
        this.worldBoss.participants.clear();
        
        console.log('🐉 WORLD BOSS SPAWNED!');
        this.broadcastWorldBossUpdate();
    }
    
    broadcastTokenUpdate(userId, newBalance) {
        const message = JSON.stringify({
            type: 'token_update',
            userId,
            tokens: newBalance
        });
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    broadcastWorldBossUpdate() {
        const message = JSON.stringify({
            type: 'world_boss_update',
            boss: {
                active: this.worldBoss.active,
                health: this.worldBoss.health,
                maxHealth: this.worldBoss.maxHealth,
                participants: this.worldBoss.participants.size
            }
        });
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'subscribe':
                ws.userId = data.userId;
                ws.send(JSON.stringify({ type: 'subscribed', userId: data.userId }));
                break;
            
            case 'chat':
                // Broadcast chat to all connected users
                this.broadcastChat(data.userId, data.message);
                break;
        }
    }
    
    broadcastChat(userId, message) {
        const chatMessage = JSON.stringify({
            type: 'chat',
            userId,
            message,
            timestamp: Date.now()
        });
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(chatMessage);
            }
        });
    }
    
    generateGachaInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🎰 Gacha Token System</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 0;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .title {
            font-size: 3rem;
            text-shadow: 0 0 20px rgba(255,255,255,0.5);
            margin-bottom: 10px;
        }
        .token-display {
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 20px;
            display: inline-block;
            font-size: 1.5rem;
            backdrop-filter: blur(10px);
        }
        .main-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .card {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 25px;
            backdrop-filter: blur(10px);
            transition: transform 0.3s;
        }
        .card:hover {
            transform: translateY(-5px);
        }
        .btn {
            background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
            border: none;
            color: white;
            padding: 15px 30px;
            border-radius: 30px;
            font-size: 1.1rem;
            cursor: pointer;
            width: 100%;
            margin: 10px 0;
            transition: all 0.3s;
        }
        .btn:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        }
        .btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .gacha-machine {
            text-align: center;
            padding: 30px;
            background: rgba(255,255,255,0.2);
            border-radius: 20px;
            margin: 20px 0;
        }
        .gacha-result {
            margin: 20px 0;
            padding: 20px;
            border-radius: 10px;
            background: rgba(255,255,255,0.1);
            min-height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-wrap: wrap;
        }
        .item {
            margin: 10px;
            padding: 15px;
            border-radius: 10px;
            animation: itemAppear 0.5s;
        }
        @keyframes itemAppear {
            from { transform: scale(0) rotate(360deg); opacity: 0; }
            to { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        .common { background: #95a5a6; }
        .rare { background: #3498db; }
        .epic { background: #9b59b6; }
        .legendary { 
            background: linear-gradient(45deg, #f39c12, #f1c40f);
            box-shadow: 0 0 20px rgba(241, 196, 15, 0.5);
        }
        .world-boss {
            background: rgba(231, 76, 60, 0.2);
            border: 2px solid #e74c3c;
            padding: 30px;
            border-radius: 20px;
            text-align: center;
        }
        .boss-health {
            width: 100%;
            height: 40px;
            background: rgba(0,0,0,0.3);
            border-radius: 20px;
            overflow: hidden;
            margin: 20px 0;
        }
        .boss-health-bar {
            height: 100%;
            background: linear-gradient(90deg, #e74c3c 0%, #c0392b 100%);
            transition: width 0.3s;
        }
        .chat-box {
            background: rgba(0,0,0,0.3);
            border-radius: 10px;
            padding: 20px;
            height: 200px;
            overflow-y: auto;
            margin-top: 20px;
        }
        .timer {
            font-size: 1.2rem;
            color: #f1c40f;
            margin: 10px 0;
        }
        .streak {
            display: inline-block;
            background: rgba(255,215,0,0.3);
            padding: 5px 15px;
            border-radius: 20px;
            margin-left: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🎰 Gacha Token System 🎰</h1>
            <div class="token-display">
                💰 Tokens: <span id="tokenCount">0</span>
                <span class="streak">🔥 Streak: <span id="streakCount">0</span></span>
            </div>
        </div>
        
        <div class="main-content">
            <div class="card">
                <h2>⏰ Hourly Reward</h2>
                <p>Claim 100 tokens every hour!</p>
                <button class="btn" id="claimHourly" onclick="claimHourly()">
                    Claim Hourly Reward
                </button>
                <div class="timer" id="hourlyTimer">Ready to claim!</div>
            </div>
            
            <div class="card">
                <h2>📅 Daily Login</h2>
                <p>Get 1000+ tokens daily! Streak bonus included!</p>
                <button class="btn" id="claimDaily" onclick="claimDaily()">
                    Claim Daily Bonus
                </button>
                <div id="dailyStatus"></div>
            </div>
            
            <div class="card">
                <h2>🎲 Gacha Machine</h2>
                <p>50 tokens per roll - Try your luck!</p>
                <div class="gacha-machine">
                    <button class="btn" onclick="rollGacha(1)">
                        Roll x1 (50 tokens)
                    </button>
                    <button class="btn" onclick="rollGacha(10)">
                        Roll x10 (500 tokens)
                    </button>
                    <div class="gacha-result" id="gachaResult">
                        <p style="opacity: 0.5;">Your prizes will appear here!</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="world-boss" id="worldBoss" style="display: none;">
            <h2>🐉 WORLD BOSS EVENT 🐉</h2>
            <p>Work together to defeat the boss!</p>
            <div class="boss-health">
                <div class="boss-health-bar" id="bossHealthBar" style="width: 100%"></div>
            </div>
            <p id="bossStatus">HP: 1,000,000 / 1,000,000</p>
            <button class="btn" onclick="attackBoss()">⚔️ Attack Boss (Free!)</button>
            <p>Participants: <span id="participants">0</span></p>
        </div>
        
        <div class="chat-box" id="chatBox">
            <h3>💬 Global Chat</h3>
            <div id="chatMessages"></div>
            <input type="text" id="chatInput" placeholder="Type a message..." style="width: 100%; margin-top: 10px; padding: 10px; border-radius: 5px; border: none;">
        </div>
    </div>
    
    <script>
        let ws = null;
        let userId = Math.floor(Math.random() * 10000); // Demo user ID
        let tokens = 0;
        let streak = 0;
        
        // Connect WebSocket
        function connectWS() {
            ws = new WebSocket('ws://localhost:7301');
            
            ws.onopen = () => {
                console.log('Connected to gacha system');
                ws.send(JSON.stringify({ type: 'subscribe', userId }));
                loadUserData();
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWSMessage(data);
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            ws.onclose = () => {
                console.log('Disconnected, reconnecting...');
                setTimeout(connectWS, 3000);
            };
        }
        
        function handleWSMessage(data) {
            switch (data.type) {
                case 'token_update':
                    if (data.userId === userId) {
                        updateTokenDisplay(data.tokens);
                    }
                    break;
                
                case 'world_boss_update':
                    updateWorldBoss(data.boss);
                    break;
                
                case 'chat':
                    addChatMessage(data.userId, data.message);
                    break;
            }
        }
        
        async function loadUserData() {
            try {
                const response = await fetch('/api/tokens/' + userId);
                const data = await response.json();
                updateTokenDisplay(data.tokens);
                updateStreakDisplay(data.streak);
            } catch (error) {
                console.error('Failed to load user data:', error);
            }
        }
        
        async function claimHourly() {
            try {
                const response = await fetch('/api/claim/hourly/' + userId, { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    updateTokenDisplay(result.newBalance);
                    showNotification('✅ ' + result.message, 'success');
                } else {
                    showNotification('⏰ ' + result.message, 'warning');
                    startHourlyTimer(result.minutesLeft);
                }
            } catch (error) {
                showNotification('❌ Failed to claim reward', 'error');
            }
        }
        
        async function claimDaily() {
            try {
                const response = await fetch('/api/claim/daily/' + userId, { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    updateTokenDisplay(result.newBalance);
                    updateStreakDisplay(result.streak);
                    showNotification('🎉 Daily bonus claimed! +' + result.reward + ' tokens!', 'success');
                } else {
                    showNotification('📅 ' + result.message, 'warning');
                }
            } catch (error) {
                showNotification('❌ Failed to claim daily bonus', 'error');
            }
        }
        
        async function rollGacha(count) {
            const cost = count * 50;
            if (tokens < cost) {
                showNotification('❌ Not enough tokens! Need ' + cost, 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/gacha/roll/' + userId, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rolls: count })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    updateTokenDisplay(result.newBalance);
                    displayGachaResults(result.results);
                } else {
                    showNotification('❌ ' + result.message, 'error');
                }
            } catch (error) {
                showNotification('❌ Failed to roll gacha', 'error');
            }
        }
        
        function displayGachaResults(results) {
            const resultDiv = document.getElementById('gachaResult');
            resultDiv.innerHTML = '';
            
            results.forEach((result, index) => {
                setTimeout(() => {
                    const item = document.createElement('div');
                    item.className = 'item ' + result.rarity;
                    item.textContent = result.item;
                    resultDiv.appendChild(item);
                    
                    if (result.rarity === 'legendary') {
                        showNotification('🌟 LEGENDARY ITEM! ' + result.item, 'legendary');
                    }
                }, index * 200);
            });
        }
        
        async function attackBoss() {
            const damage = Math.floor(Math.random() * 10000) + 1000;
            
            try {
                const response = await fetch('/api/worldboss/attack/' + userId, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ damage })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showNotification('⚔️ Dealt ' + damage + ' damage!', 'success');
                }
            } catch (error) {
                showNotification('❌ Failed to attack boss', 'error');
            }
        }
        
        async function checkWorldBoss() {
            try {
                const response = await fetch('/api/worldboss/status');
                const data = await response.json();
                updateWorldBoss(data);
            } catch (error) {
                console.error('Failed to check world boss:', error);
            }
        }
        
        function updateWorldBoss(boss) {
            const bossDiv = document.getElementById('worldBoss');
            
            if (boss.active) {
                bossDiv.style.display = 'block';
                const healthPercent = (boss.health / boss.maxHealth) * 100;
                document.getElementById('bossHealthBar').style.width = healthPercent + '%';
                document.getElementById('bossStatus').textContent = 'HP: ' + boss.health.toLocaleString() + ' / ' + boss.maxHealth.toLocaleString();
                document.getElementById('participants').textContent = boss.participants;
            } else {
                bossDiv.style.display = 'none';
            }
        }
        
        function updateTokenDisplay(newTokens) {
            tokens = newTokens;
            document.getElementById('tokenCount').textContent = tokens.toLocaleString();
        }
        
        function updateStreakDisplay(newStreak) {
            streak = newStreak;
            document.getElementById('streakCount').textContent = streak;
        }
        
        function startHourlyTimer(minutes) {
            const timer = document.getElementById('hourlyTimer');
            const btn = document.getElementById('claimHourly');
            btn.disabled = true;
            
            const interval = setInterval(() => {
                minutes--;
                if (minutes <= 0) {
                    clearInterval(interval);
                    timer.textContent = 'Ready to claim!';
                    btn.disabled = false;
                } else {
                    timer.textContent = 'Next claim in ' + minutes + ' minutes';
                }
            }, 60000);
            
            timer.textContent = 'Next claim in ' + minutes + ' minutes';
        }
        
        function showNotification(message, type) {
            // Create floating notification
            const notif = document.createElement('div');
            notif.style.cssText = 'position: fixed; top: 20px; right: 20px; padding: 20px; border-radius: 10px; color: white; font-weight: bold; z-index: 1000; animation: slideIn 0.3s;';
            
            switch (type) {
                case 'success':
                    notif.style.background = 'linear-gradient(45deg, #2ecc71, #27ae60)';
                    break;
                case 'error':
                    notif.style.background = 'linear-gradient(45deg, #e74c3c, #c0392b)';
                    break;
                case 'warning':
                    notif.style.background = 'linear-gradient(45deg, #f39c12, #e67e22)';
                    break;
                case 'legendary':
                    notif.style.background = 'linear-gradient(45deg, #f39c12, #f1c40f)';
                    notif.style.boxShadow = '0 0 30px rgba(241, 196, 15, 0.8)';
                    break;
            }
            
            notif.textContent = message;
            document.body.appendChild(notif);
            
            setTimeout(() => {
                notif.style.animation = 'slideOut 0.3s';
                setTimeout(() => notif.remove(), 300);
            }, 3000);
        }
        
        function addChatMessage(userId, message) {
            const chat = document.getElementById('chatMessages');
            const msg = document.createElement('div');
            msg.innerHTML = '<strong>User' + userId + ':</strong> ' + message;
            chat.appendChild(msg);
            chat.scrollTop = chat.scrollHeight;
        }
        
        // Chat input
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        type: 'chat',
                        userId,
                        message: e.target.value
                    }));
                    e.target.value = '';
                }
            }
        });
        
        // CSS animations
        const style = document.createElement('style');
        style.textContent = '@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } } @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }';
        document.head.appendChild(style);
        
        // Initialize
        connectWS();
        setInterval(checkWorldBoss, 10000); // Check every 10 seconds
        
        // Sparkle effect
        function createSparkle() {
            const sparkle = document.createElement('div');
            sparkle.style.cssText = 'position: fixed; width: 4px; height: 4px; background: white; border-radius: 50%; pointer-events: none; animation: sparkle 3s linear;';
            sparkle.style.left = Math.random() * window.innerWidth + 'px';
            sparkle.style.top = Math.random() * window.innerHeight + 'px';
            document.body.appendChild(sparkle);
            
            setTimeout(() => sparkle.remove(), 3000);
        }
        
        // Create sparkles periodically
        setInterval(createSparkle, 300);
        
        // Add sparkle animation
        const sparkleStyle = document.createElement('style');
        sparkleStyle.textContent = '@keyframes sparkle { 0% { transform: translateY(0) scale(0); opacity: 1; } 50% { transform: translateY(-20px) scale(1); opacity: 1; } 100% { transform: translateY(-40px) scale(0); opacity: 0; } }';
        document.head.appendChild(sparkleStyle);
    </script>
</body>
</html>`;
    }
}

// Start the gacha token system
if (require.main === module) {
    new GachaTokenSystem(7300);
}

module.exports = GachaTokenSystem;