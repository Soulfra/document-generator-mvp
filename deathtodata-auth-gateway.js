#!/usr/bin/env node

/**
 * 🏰 DEATHTODATA AUTHENTICATION GATEWAY
 * 
 * The entrance to your entire empire - NO FREE ENTRY
 * Old-school username/screenname system like the classic sites
 * Controls access to ALL services including Cal's pirate adventures
 * 
 * Architecture: Login → Gaming Hub → Game Selection → Game Instance
 * Database: empire-auth.blockchain.sql (single-person company control)
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;
const EventEmitter = require('events');

class DeathtodataAuthGateway extends EventEmitter {
    constructor() {
        super();
        
        this.app = express();
        this.port = 8000; // Main empire gateway port
        
        // Empire configuration
        this.empireConfig = {
            name: "DEATHTODATA EMPIRE",
            tagline: "No Free Entry - Earn Your Place",
            version: "1.0.0",
            maxUsers: 1000, // Controlled growth
            allowRegistration: true, // Can be disabled for invite-only
            
            // Available games/services after login
            games: {
                'pirate-adventure': {
                    name: "Cal's Pirate Adventure", 
                    icon: "🏴‍☠️",
                    url: "/games/pirate-adventure",
                    description: "Navigate the seas of data with AI Captain Cal",
                    minLevel: 1,
                    category: "Adventure"
                },
                'death-search': {
                    name: "Death Search Engine",
                    icon: "🔍", 
                    url: "/games/death-search",
                    description: "Battle-hardened search with boss mechanics",
                    minLevel: 5,
                    category: "Utility"
                },
                'ship-combat': {
                    name: "Ship Combat Arena",
                    icon: "⚔️",
                    url: "/games/ship-combat", 
                    description: "PvP naval battles and fleet management",
                    minLevel: 10,
                    category: "Combat"
                }
            }
        };
        
        // JWT secret for sessions
        this.jwtSecret = process.env.EMPIRE_JWT_SECRET || crypto.randomBytes(64).toString('hex');
        
        // Authentication statistics
        this.stats = {
            totalUsers: 0,
            activeUsers: 0,
            totalLogins: 0,
            gamesPlayed: 0,
            achievementsEarned: 0,
            uptime: Date.now()
        };
        
        this.db = null;
        this.activeSessions = new Map();
        
        console.log('🏰 DEATHTODATA Authentication Gateway Initializing...');
        console.log('📋 No Free Entry Policy Active');
        
        this.init();
    }
    
    async init() {
        try {
            console.log('🗄️ Setting up empire database...');
            await this.initDatabase();
            
            console.log('🔧 Configuring express middleware...');
            this.setupMiddleware();
            
            console.log('🛣️ Setting up authentication routes...');
            this.setupRoutes();
            
            console.log('👥 Loading user statistics...');
            await this.loadStats();
            
            this.emit('ready');
            console.log('✅ DEATHTODATA Gateway ready for empire members!');
            
        } catch (error) {
            console.error('❌ Gateway initialization failed:', error);
            this.emit('error', error);
        }
    }
    
    async initDatabase() {
        const dbPath = path.join(__dirname, 'empire-auth.blockchain.sql');
        this.db = new sqlite3.Database(dbPath);
        
        // Create tables with .blockchain.sql convention
        const schema = `
            -- Empire Users Table (old-school username system)
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                
                -- Gaming progression
                empire_level INTEGER DEFAULT 1,
                total_score INTEGER DEFAULT 0,
                total_playtime INTEGER DEFAULT 0,
                
                -- Achievements and unlocks
                achievements TEXT DEFAULT '[]', 
                unlocked_games TEXT DEFAULT '["pirate-adventure"]',
                
                -- Authentication tracking
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                login_count INTEGER DEFAULT 0,
                
                -- Status and permissions
                is_active BOOLEAN DEFAULT TRUE,
                is_empire_founder BOOLEAN DEFAULT FALSE,
                invite_code TEXT
            );
            
            -- Game Sessions (track all gameplay)
            CREATE TABLE IF NOT EXISTS game_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                game_type TEXT NOT NULL,
                session_data TEXT,
                score INTEGER DEFAULT 0,
                duration INTEGER DEFAULT 0,
                achievements_earned TEXT DEFAULT '[]',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                ended_at DATETIME,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            
            -- User Achievements
            CREATE TABLE IF NOT EXISTS user_achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                achievement_type TEXT NOT NULL,
                achievement_data TEXT,
                points INTEGER DEFAULT 0,
                earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                game_context TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            
            -- Login Sessions (JWT tracking)
            CREATE TABLE IF NOT EXISTS login_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (user_id) REFERENCES users (id)
            );
            
            -- Empire Statistics (global tracking)
            CREATE TABLE IF NOT EXISTS empire_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                stat_type TEXT NOT NULL,
                stat_value INTEGER NOT NULL,
                recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        await new Promise((resolve, reject) => {
            this.db.exec(schema, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        console.log('🗄️ Empire database initialized with .blockchain.sql schema');
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.static(path.join(__dirname, 'public')));
        
        // CORS for empire domains only
        this.app.use((req, res, next) => {
            const origin = req.headers.origin;
            if (origin && (origin.includes('deathtodata.com') || origin.includes('localhost'))) {
                res.header('Access-Control-Allow-Origin', origin);
            }
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Empire-Token');
            res.header('Access-Control-Allow-Credentials', 'true');
            next();
        });
        
        // Empire-style request logging
        this.app.use((req, res, next) => {
            const timestamp = new Date().toISOString();
            console.log(`🌐 [${timestamp}] ${req.method} ${req.path} from ${req.ip}`);
            next();
        });
    }
    
    setupRoutes() {
        // Main empire gateway (login page)
        this.app.get('/', (req, res) => {
            res.send(this.generateLoginPage());
        });
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'empire-active',
                service: 'deathtodata-auth-gateway',
                version: this.empireConfig.version,
                stats: this.stats,
                message: 'No Free Entry - Empire Protected'
            });
        });
        
        // User registration (controlled)
        this.app.post('/auth/register', async (req, res) => {
            try {
                const { username, email, password, inviteCode } = req.body;
                
                // Check if registration is allowed
                if (!this.empireConfig.allowRegistration && !inviteCode) {
                    return res.status(403).json({ 
                        error: '🔒 Invite-only empire. Registration disabled.' 
                    });
                }
                
                // Validate invite code if provided
                if (inviteCode && !this.validateInviteCode(inviteCode)) {
                    return res.status(400).json({ 
                        error: '❌ Invalid empire invite code' 
                    });
                }
                
                // Check username requirements (old-school style)
                if (username.length < 3 || username.length > 20) {
                    return res.status(400).json({ 
                        error: '📛 Username must be 3-20 characters (like the old sites!)' 
                    });
                }
                
                // Check if user exists
                const existingUser = await this.getUserByUsernameOrEmail(username, email);
                if (existingUser) {
                    return res.status(400).json({ 
                        error: '❌ Username or email already taken in empire' 
                    });
                }
                
                // Hash password
                const passwordHash = await bcrypt.hash(password, 12);
                
                // Create user in empire
                const userId = await this.createUser({
                    username,
                    email,
                    password_hash: passwordHash,
                    invite_code: inviteCode
                });
                
                // Award first achievement
                await this.awardAchievement(userId, 'empire_joined', {
                    message: 'Welcome to DEATHTODATA Empire!',
                    points: 100
                });
                
                console.log(`👑 New empire member joined: ${username}`);
                
                res.json({
                    success: true,
                    message: `🏰 Welcome to the empire, ${username}!`,
                    user: { id: userId, username },
                    nextStep: 'Please login to access your empire'
                });
                
            } catch (error) {
                console.error('Registration error:', error);
                res.status(500).json({ error: '❌ Empire registration failed' });
            }
        });
        
        // User login (gateway to empire)
        this.app.post('/auth/login', async (req, res) => {
            try {
                const { username, password } = req.body;
                
                // Get user by username or email
                const user = await this.getUserByUsernameOrEmail(username, username);
                if (!user) {
                    return res.status(401).json({ 
                        error: '❌ Invalid credentials - no empire access' 
                    });
                }
                
                // Check if user is active
                if (!user.is_active) {
                    return res.status(401).json({ 
                        error: '🚫 Empire access suspended' 
                    });
                }
                
                // Validate password
                const validPassword = await bcrypt.compare(password, user.password_hash);
                if (!validPassword) {
                    return res.status(401).json({ 
                        error: '❌ Invalid credentials - no empire access' 
                    });
                }
                
                // Generate JWT token
                const token = this.generateToken(user);
                
                // Create session
                await this.createSession(user.id, token, req);
                
                // Update login stats
                await this.updateLoginStats(user.id);
                
                // Get user's achievements and unlocked games
                const achievements = await this.getUserAchievements(user.id);
                const unlockedGames = JSON.parse(user.unlocked_games || '["pirate-adventure"]');
                
                this.stats.totalLogins++;
                this.stats.activeUsers++;
                
                console.log(`🎯 Empire login successful: ${user.username} (Level ${user.empire_level})`);
                
                res.json({
                    success: true,
                    message: `🏰 Welcome back, ${user.username}!`,
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        empire_level: user.empire_level,
                        total_score: user.total_score,
                        achievements_count: achievements.length,
                        unlocked_games: unlockedGames
                    },
                    redirect: '/gaming-hub'
                });
                
            } catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ error: '❌ Empire login failed' });
            }
        });
        
        // Gaming hub (after successful login)
        this.app.get('/gaming-hub', this.authenticateToken, async (req, res) => {
            try {
                const user = await this.getUserById(req.user.userId);
                const achievements = await this.getUserAchievements(req.user.userId);
                const unlockedGames = JSON.parse(user.unlocked_games || '["pirate-adventure"]');
                
                res.send(this.generateGamingHub(user, achievements, unlockedGames));
                
            } catch (error) {
                res.status(500).send('Empire hub unavailable');
            }
        });
        
        // Game access (protected routes)
        this.app.get('/games/:gameId', this.authenticateToken, async (req, res) => {
            try {
                const { gameId } = req.params;
                const user = await this.getUserById(req.user.userId);
                
                // Check if user has access to this game
                const unlockedGames = JSON.parse(user.unlocked_games || '["pirate-adventure"]');
                const game = this.empireConfig.games[gameId];
                
                if (!game) {
                    return res.status(404).send('Game not found in empire');
                }
                
                if (!unlockedGames.includes(gameId)) {
                    return res.status(403).send(`🔒 Game locked - Reach level ${game.minLevel} to unlock`);
                }
                
                if (user.empire_level < game.minLevel) {
                    return res.status(403).send(`🔒 Level ${game.minLevel} required for ${game.name}`);
                }
                
                // Create game session
                const sessionId = await this.createGameSession(user.id, gameId);
                
                // Serve game based on type
                switch (gameId) {
                    case 'pirate-adventure':
                        res.send(this.generatePirateGameWrapper(user, sessionId));
                        break;
                    default:
                        res.status(501).send('Game under construction');
                }
                
            } catch (error) {
                res.status(500).send('Game access failed');
            }
        });
        
        // Logout
        this.app.post('/auth/logout', this.authenticateToken, async (req, res) => {
            try {
                await this.invalidateSession(req.user.sessionId);
                this.stats.activeUsers = Math.max(0, this.stats.activeUsers - 1);
                
                res.json({ 
                    success: true, 
                    message: '👋 Logged out of empire',
                    redirect: '/'
                });
                
            } catch (error) {
                res.status(500).json({ error: 'Logout failed' });
            }
        });
        
        // User profile
        this.app.get('/profile', this.authenticateToken, async (req, res) => {
            try {
                const user = await this.getUserById(req.user.userId);
                const achievements = await this.getUserAchievements(req.user.userId);
                const sessions = await this.getUserGameSessions(req.user.userId);
                
                res.json({
                    user: {
                        id: user.id,
                        username: user.username,
                        empire_level: user.empire_level,
                        total_score: user.total_score,
                        total_playtime: user.total_playtime,
                        login_count: user.login_count,
                        member_since: user.created_at
                    },
                    achievements,
                    recent_sessions: sessions.slice(0, 10),
                    unlocked_games: JSON.parse(user.unlocked_games || '["pirate-adventure"]')
                });
                
            } catch (error) {
                res.status(500).json({ error: 'Profile unavailable' });
            }
        });
        
        // Empire statistics
        this.app.get('/stats', (req, res) => {
            res.json({
                empire: this.empireConfig.name,
                stats: this.stats,
                games_available: Object.keys(this.empireConfig.games).length,
                active_sessions: this.activeSessions.size
            });
        });
    }
    
    // Authentication middleware
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'] || req.headers['empire-token'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.redirect('/?error=login_required');
        }
        
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            req.user = decoded;
            next();
        } catch (error) {
            return res.redirect('/?error=invalid_token');
        }
    }
    
    // Token generation
    generateToken(user) {
        const payload = {
            userId: user.id,
            username: user.username,
            empire_level: user.empire_level,
            sessionId: crypto.randomBytes(16).toString('hex')
        };
        
        return jwt.sign(payload, this.jwtSecret, { expiresIn: '24h' });
    }
    
    validateInviteCode(code) {
        const validCodes = ['EMPIRE2024', 'DEATHTODATA', 'FOUNDER', 'PIRATE'];
        return validCodes.includes(code.toUpperCase());
    }
    
    // Database operations
    async getUserByUsernameOrEmail(username, email) {
        return new Promise((resolve) => {
            this.db.get(
                'SELECT * FROM users WHERE username = ? OR email = ?', 
                [username, email], 
                (err, row) => resolve(err ? null : row)
            );
        });
    }
    
    async getUserById(id) {
        return new Promise((resolve) => {
            this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                resolve(err ? null : row);
            });
        });
    }
    
    async createUser(userData) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO users (username, email, password_hash, invite_code)
                VALUES (?, ?, ?, ?)
            `;
            this.db.run(query, [
                userData.username,
                userData.email, 
                userData.password_hash,
                userData.invite_code
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }
    
    async createSession(userId, token, req) {
        const sessionData = {
            user_id: userId,
            session_token: token,
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        };
        
        return new Promise((resolve) => {
            this.db.run(`
                INSERT INTO login_sessions (user_id, session_token, ip_address, user_agent, expires_at)
                VALUES (?, ?, ?, ?, ?)
            `, [
                sessionData.user_id,
                sessionData.session_token,
                sessionData.ip_address,
                sessionData.user_agent,
                sessionData.expires_at
            ], resolve);
        });
    }
    
    async createGameSession(userId, gameType) {
        return new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO game_sessions (user_id, game_type, session_data)
                VALUES (?, ?, ?)
            `, [userId, gameType, JSON.stringify({ started: Date.now() })], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }
    
    async updateLoginStats(userId) {
        this.db.run(`
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 
            WHERE id = ?
        `, [userId]);
    }
    
    async awardAchievement(userId, type, data) {
        this.db.run(`
            INSERT INTO user_achievements (user_id, achievement_type, achievement_data, points)
            VALUES (?, ?, ?, ?)
        `, [userId, type, JSON.stringify(data), data.points || 0]);
        
        // Update user's total score
        this.db.run(`
            UPDATE users SET total_score = total_score + ? WHERE id = ?
        `, [data.points || 0, userId]);
    }
    
    async getUserAchievements(userId) {
        return new Promise((resolve) => {
            this.db.all(`
                SELECT * FROM user_achievements 
                WHERE user_id = ? 
                ORDER BY earned_at DESC
            `, [userId], (err, rows) => {
                resolve(err ? [] : rows.map(row => ({
                    ...row,
                    achievement_data: JSON.parse(row.achievement_data || '{}')
                })));
            });
        });
    }
    
    async getUserGameSessions(userId) {
        return new Promise((resolve) => {
            this.db.all(`
                SELECT * FROM game_sessions 
                WHERE user_id = ? 
                ORDER BY created_at DESC
            `, [userId], (err, rows) => {
                resolve(err ? [] : rows);
            });
        });
    }
    
    async invalidateSession(sessionId) {
        this.db.run('UPDATE login_sessions SET is_active = FALSE WHERE id = ?', [sessionId]);
    }
    
    async loadStats() {
        this.db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
            if (!err) this.stats.totalUsers = row.count;
        });
    }
    
    // HTML Generation
    generateLoginPage() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏰 DEATHTODATA EMPIRE - Gateway</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: linear-gradient(45deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a0a 100%);
            color: #00ff41;
            font-family: 'Courier New', monospace;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background-attachment: fixed;
        }
        
        .empire-gate {
            background: rgba(0, 0, 0, 0.9);
            border: 3px solid #00ff41;
            border-radius: 10px;
            padding: 40px;
            width: 100%;
            max-width: 500px;
            box-shadow: 
                inset 0 0 30px rgba(0, 255, 65, 0.2),
                0 0 50px rgba(0, 255, 65, 0.3);
            text-align: center;
        }
        
        .empire-title {
            font-size: 28px;
            text-shadow: 0 0 20px #00ff41;
            margin-bottom: 10px;
            color: #00ff41;
        }
        
        .empire-tagline {
            color: #ffff00;
            margin-bottom: 30px;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .auth-form {
            text-align: left;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            color: #00aa00;
            font-weight: bold;
        }
        
        input[type="text"], input[type="email"], input[type="password"] {
            width: 100%;
            padding: 12px;
            background: rgba(0, 20, 0, 0.8);
            border: 2px solid #004400;
            color: #00ff41;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            border-radius: 5px;
            transition: border-color 0.3s;
        }
        
        input:focus {
            outline: none;
            border-color: #00ff41;
            box-shadow: 0 0 10px rgba(0, 255, 65, 0.3);
        }
        
        .empire-button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(45deg, #003300, #006600);
            color: #00ff41;
            border: 2px solid #00ff41;
            font-family: 'Courier New', monospace;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            border-radius: 5px;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s;
        }
        
        .empire-button:hover {
            background: linear-gradient(45deg, #006600, #00aa00);
            box-shadow: 0 0 20px rgba(0, 255, 65, 0.5);
            transform: translateY(-2px);
        }
        
        .toggle-auth {
            margin-top: 20px;
            text-align: center;
        }
        
        .toggle-auth a {
            color: #00aa00;
            text-decoration: none;
            cursor: pointer;
        }
        
        .toggle-auth a:hover {
            color: #00ff41;
            text-shadow: 0 0 5px #00ff41;
        }
        
        .empire-stats {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #004400;
            font-size: 12px;
            color: #008800;
        }
        
        .error-message {
            color: #ff6666;
            text-align: center;
            margin-bottom: 15px;
            padding: 10px;
            background: rgba(255, 0, 0, 0.1);
            border: 1px solid #ff6666;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <div class="empire-gate">
        <h1 class="empire-title">🏰 DEATHTODATA EMPIRE</h1>
        <p class="empire-tagline">${this.empireConfig.tagline}</p>
        
        <div id="error-container"></div>
        
        <!-- Login Form -->
        <form id="login-form" class="auth-form">
            <div class="form-group">
                <label for="username">👤 Username/Email:</label>
                <input type="text" id="username" required placeholder="Enter your empire credentials">
            </div>
            <div class="form-group">
                <label for="password">🔒 Password:</label>
                <input type="password" id="password" required placeholder="Empire access key">
            </div>
            <button type="submit" class="empire-button">🎯 ENTER EMPIRE</button>
        </form>
        
        <!-- Registration Form (hidden by default) -->
        <form id="register-form" class="auth-form" style="display: none;">
            <div class="form-group">
                <label for="reg-username">👤 Choose Username:</label>
                <input type="text" id="reg-username" required placeholder="3-20 characters (old school!)">
            </div>
            <div class="form-group">
                <label for="reg-email">📧 Email:</label>
                <input type="email" id="reg-email" required placeholder="your@email.com">
            </div>
            <div class="form-group">
                <label for="reg-password">🔒 Password:</label>
                <input type="password" id="reg-password" required placeholder="Strong empire password">
            </div>
            <div class="form-group">
                <label for="invite-code">🎫 Invite Code (Optional):</label>
                <input type="text" id="invite-code" placeholder="EMPIRE2024, FOUNDER, etc.">
            </div>
            <button type="submit" class="empire-button">👑 JOIN EMPIRE</button>
        </form>
        
        <div class="toggle-auth">
            <a id="toggle-link" onclick="toggleAuthMode()">New to the empire? Join us!</a>
        </div>
        
        <div class="empire-stats">
            <div>👥 Empire Members: ${this.stats.totalUsers}</div>
            <div>🎮 Active Users: ${this.stats.activeUsers}</div>
            <div>🎯 Total Logins: ${this.stats.totalLogins}</div>
        </div>
    </div>
    
    <script>
        let isLoginMode = true;
        
        function toggleAuthMode() {
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            const toggleLink = document.getElementById('toggle-link');
            
            if (isLoginMode) {
                loginForm.style.display = 'none';
                registerForm.style.display = 'block';
                toggleLink.textContent = 'Already have empire access? Login here!';
                isLoginMode = false;
            } else {
                loginForm.style.display = 'block';
                registerForm.style.display = 'none'; 
                toggleLink.textContent = 'New to the empire? Join us!';
                isLoginMode = true;
            }
        }
        
        function showError(message) {
            const container = document.getElementById('error-container');
            container.innerHTML = '<div class="error-message">' + message + '</div>';
            setTimeout(() => container.innerHTML = '', 5000);
        }
        
        // Login form handler
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    localStorage.setItem('empire-token', data.token);
                    window.location.href = data.redirect;
                } else {
                    showError(data.error);
                }
            } catch (error) {
                showError('Empire gateway connection failed');
            }
        });
        
        // Registration form handler  
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('reg-username').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const inviteCode = document.getElementById('invite-code').value;
            
            try {
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, inviteCode })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    showError('✅ ' + data.message + ' Please login now!');
                    toggleAuthMode(); // Switch back to login
                } else {
                    showError(data.error);
                }
            } catch (error) {
                showError('Empire registration failed');
            }
        });
        
        // Check for URL errors
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('error') === 'login_required') {
            showError('🔒 Empire access required - Please login');
        } else if (urlParams.get('error') === 'invalid_token') {
            showError('❌ Session expired - Please login again');
        }
    </script>
</body>
</html>
        `;
    }
    
    generateGamingHub(user, achievements, unlockedGames) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎮 Empire Gaming Hub - ${user.username}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a0a 50%, #0a0a0a 100%);
            color: #00ff41;
            font-family: 'Courier New', monospace;
            min-height: 100vh;
            background-attachment: fixed;
        }
        
        .empire-header {
            background: rgba(0, 0, 0, 0.9);
            border-bottom: 3px solid #00ff41;
            padding: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 0 30px rgba(0, 255, 65, 0.3);
        }
        
        .empire-title { 
            font-size: 24px; 
            text-shadow: 0 0 15px #00ff41;
        }
        
        .user-stats {
            display: flex;
            gap: 20px;
            font-size: 14px;
        }
        
        .stat-item {
            padding: 8px 15px;
            background: rgba(0, 40, 0, 0.8);
            border: 1px solid #00aa00;
            border-radius: 15px;
        }
        
        .empire-hub {
            max-width: 1200px;
            margin: 40px auto;
            padding: 0 20px;
        }
        
        .games-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .game-card {
            background: rgba(0, 20, 0, 0.9);
            border: 2px solid #004400;
            border-radius: 10px;
            padding: 25px;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        
        .game-card:hover {
            border-color: #00ff41;
            box-shadow: 0 0 25px rgba(0, 255, 65, 0.4);
            transform: translateY(-5px);
        }
        
        .game-card.locked {
            opacity: 0.6;
            border-color: #662200;
        }
        
        .game-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }
        
        .game-title {
            font-size: 20px;
            color: #00ff41;
            margin-bottom: 10px;
        }
        
        .game-description {
            color: #00aa00;
            margin-bottom: 15px;
            line-height: 1.4;
        }
        
        .game-meta {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #008800;
            margin-bottom: 15px;
        }
        
        .play-button {
            width: 100%;
            padding: 12px;
            background: linear-gradient(45deg, #003300, #006600);
            color: #00ff41;
            border: 2px solid #00ff41;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            border-radius: 5px;
            text-transform: uppercase;
            transition: all 0.3s;
        }
        
        .play-button:hover {
            background: linear-gradient(45deg, #006600, #00aa00);
            box-shadow: 0 0 15px rgba(0, 255, 65, 0.5);
        }
        
        .play-button:disabled {
            background: #333;
            color: #666;
            cursor: not-allowed;
            border-color: #666;
        }
        
        .achievements-panel {
            background: rgba(0, 20, 0, 0.9);
            border: 2px solid #00ff41;
            border-radius: 10px;
            padding: 25px;
            margin-top: 30px;
        }
        
        .achievement-item {
            display: flex;
            align-items: center;
            padding: 10px;
            margin: 10px 0;
            background: rgba(0, 40, 0, 0.5);
            border-radius: 5px;
        }
        
        .logout-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: rgba(255, 0, 0, 0.8);
            color: white;
            border: 1px solid #ff4444;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
        }
        
        .locked-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 0, 0, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ff6666;
            font-weight: bold;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div class="empire-header">
        <h1 class="empire-title">🎮 EMPIRE GAMING HUB</h1>
        <div class="user-stats">
            <div class="stat-item">👤 ${user.username}</div>
            <div class="stat-item">⬆️ Level ${user.empire_level}</div>
            <div class="stat-item">🎯 ${user.total_score} Points</div>
            <div class="stat-item">🏆 ${achievements.length} Achievements</div>
        </div>
    </div>
    
    <button class="logout-button" onclick="logout()">👋 Logout</button>
    
    <div class="empire-hub">
        <h2 style="margin-bottom: 30px; text-shadow: 0 0 10px #00ff41;">🎮 Available Games & Services</h2>
        
        <div class="games-grid">
            ${Object.entries(this.empireConfig.games).map(([gameId, game]) => {
                const isUnlocked = unlockedGames.includes(gameId);
                const hasLevel = user.empire_level >= game.minLevel;
                const canPlay = isUnlocked && hasLevel;
                
                return `
                    <div class="game-card ${canPlay ? '' : 'locked'}">
                        ${!canPlay ? `<div class="locked-overlay">🔒 Level ${game.minLevel} Required</div>` : ''}
                        <div class="game-icon">${game.icon}</div>
                        <div class="game-title">${game.name}</div>
                        <div class="game-description">${game.description}</div>
                        <div class="game-meta">
                            <span>Category: ${game.category}</span>
                            <span>Min Level: ${game.minLevel}</span>
                        </div>
                        <button class="play-button" ${canPlay ? `onclick="playGame('${gameId}')"` : 'disabled'}>
                            ${canPlay ? '🎮 PLAY NOW' : '🔒 LOCKED'}
                        </button>
                    </div>
                `;
            }).join('')}
        </div>
        
        <div class="achievements-panel">
            <h3 style="margin-bottom: 20px;">🏆 Recent Achievements</h3>
            ${achievements.slice(0, 5).map(achievement => `
                <div class="achievement-item">
                    <span style="margin-right: 15px; font-size: 20px;">🏆</span>
                    <div>
                        <strong>${achievement.achievement_type.replace('_', ' ').toUpperCase()}</strong><br>
                        <small>${achievement.achievement_data ? JSON.parse(achievement.achievement_data).message : 'Achievement unlocked!'}</small>
                        <span style="float: right; color: #ffff00;">+${achievement.points} pts</span>
                    </div>
                </div>
            `).join('') || '<div style="color: #666;">No achievements yet - start playing to unlock them!</div>'}
        </div>
    </div>
    
    <script>
        function playGame(gameId) {
            const token = localStorage.getItem('empire-token');
            if (token) {
                window.location.href = '/games/' + gameId;
            } else {
                alert('Empire access expired - please login again');
                window.location.href = '/';
            }
        }
        
        async function logout() {
            try {
                const token = localStorage.getItem('empire-token');
                await fetch('/auth/logout', {
                    method: 'POST',
                    headers: { 
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    }
                });
            } catch (error) {
                console.error('Logout error:', error);
            }
            
            localStorage.removeItem('empire-token');
            window.location.href = '/';
        }
        
        // Auto-refresh stats periodically
        setInterval(() => {
            // Could fetch updated user stats here
        }, 30000);
    </script>
</body>
</html>
        `;
    }
    
    generatePirateGameWrapper(user, sessionId) {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏴‍☠️ Cal's Pirate Adventure - ${user.username}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            background: #000; 
            overflow: hidden; 
            font-family: 'Courier New', monospace;
        }
        
        #game-wrapper {
            position: relative;
            width: 100%;
            height: 100vh;
        }
        
        #pirate-game-frame {
            width: 100%;
            height: 100%;
            border: none;
        }
        
        .game-overlay {
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.8);
            color: #00ff41;
            padding: 15px;
            border: 2px solid #00ff41;
            border-radius: 5px;
            font-size: 12px;
        }
        
        .back-button {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 1000;
            padding: 10px 20px;
            background: rgba(0, 100, 0, 0.8);
            color: #00ff41;
            border: 2px solid #00ff41;
            border-radius: 5px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            text-decoration: none;
        }
        
        .back-button:hover {
            background: rgba(0, 150, 0, 0.8);
            box-shadow: 0 0 15px rgba(0, 255, 65, 0.5);
        }
    </style>
</head>
<body>
    <div id="game-wrapper">
        <div class="game-overlay">
            <div>🏴‍☠️ <strong>Cal's Pirate Adventure</strong></div>
            <div>👤 Player: ${user.username} (Level ${user.empire_level})</div>
            <div>🎮 Session: ${sessionId}</div>
            <div>🎯 Score: <span id="current-score">0</span></div>
        </div>
        
        <a href="/gaming-hub" class="back-button">🏠 Return to Empire Hub</a>
        
        <!-- Load the actual pirate game -->
        <iframe id="pirate-game-frame" src="http://localhost:8082"></iframe>
    </div>
    
    <script>
        // Game session tracking
        const gameSession = {
            userId: ${user.id},
            sessionId: ${sessionId},
            startTime: Date.now(),
            score: 0
        };
        
        // Listen for game events
        window.addEventListener('message', (event) => {
            if (event.data.type === 'pirate-game-score') {
                document.getElementById('current-score').textContent = event.data.score;
                gameSession.score = event.data.score;
            }
        });
        
        // Send user data to game
        window.onload = () => {
            const frame = document.getElementById('pirate-game-frame');
            frame.onload = () => {
                frame.contentWindow.postMessage({
                    type: 'empire-user-data',
                    user: {
                        id: ${user.id},
                        username: '${user.username}',
                        empire_level: ${user.empire_level},
                        sessionId: ${sessionId}
                    }
                }, '*');
            };
        };
        
        // Auto-save progress periodically
        setInterval(async () => {
            try {
                const token = localStorage.getItem('empire-token');
                await fetch('/api/game-session/' + gameSession.sessionId, {
                    method: 'PUT',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        score: gameSession.score,
                        playtime: Date.now() - gameSession.startTime
                    })
                });
            } catch (error) {
                console.error('Failed to save game progress:', error);
            }
        }, 30000); // Save every 30 seconds
    </script>
</body>
</html>
        `;
    }
    
    async start() {
        const server = this.app.listen(this.port, () => {
            console.log(`
🏰 DEATHTODATA AUTHENTICATION GATEWAY ACTIVE! 🏰
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Empire Gateway: http://localhost:${this.port}
🎮 Gaming Hub: http://localhost:${this.port}/gaming-hub
🗄️ Database: empire-auth.blockchain.sql
📊 Status: NO FREE ENTRY - Authentication Required

🎯 Available After Login:
  • 🏴‍☠️ Cal's Pirate Adventure
  • 🔍 Death Search Engine  
  • ⚔️ Ship Combat Arena

👑 Empire Stats:
  • Members: ${this.stats.totalUsers}
  • Active: ${this.stats.activeUsers} 
  • Sessions: ${this.activeSessions.size}

🔒 All services protected by empire authentication!
            `);
        });
        
        return server;
    }
}

module.exports = DeathtodataAuthGateway;

// Run if called directly
if (require.main === module) {
    const gateway = new DeathtodataAuthGateway();
    gateway.start().catch(console.error);
}