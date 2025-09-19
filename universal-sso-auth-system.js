#!/usr/bin/env node

/**
 * 🔐 UNIVERSAL SSO AUTHENTICATION SYSTEM
 * Single Sign-On hub for your entire 300-domain empire
 * RuneLite-inspired authentication with gaming elements
 * JWT + OAuth2 + Biometric integration
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const EventEmitter = require('events');
const axios = require('axios');
const path = require('path');

class UniversalSSOAuthSystem extends EventEmitter {
    constructor() {
        super();
        
        this.app = express();
        this.port = 7775; // Auth port for empire
        
        // Your 300+ domain empire (expandable)
        this.domainEmpire = [
            'deathtodata.com', 'soulfra.com', 'soulfra.ai',
            'pimpmychrome.com', 'shiprekt.com',
            'vcbash.com', 'ycbash.com',
            'saveorsink.com', 'dealordelete.com', 'cringeproof.com'
        ];
        
        // JWT secrets (in production, use environment variables)
        this.jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
        this.refreshSecret = process.env.REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
        
        // Gaming elements for auth system
        this.gameElements = {
            login_success: '🎯',
            login_fail: '❌',
            token_refresh: '🔄',
            empire_sync: '🌐',
            achievement_unlock: '🏆',
            biometric_auth: '🔒',
            multi_domain: '🚀'
        };
        
        // Auth statistics
        this.authStats = {
            totalLogins: 0,
            activeUsers: 0,
            empireSessions: 0,
            failedAttempts: 0,
            biometricAuths: 0,
            startTime: Date.now()
        };
        
        // Active sessions store (in production, use Redis)
        this.activeSessions = new Map();
        
        this.initDatabase();
        this.setupMiddleware();
        this.setupRoutes();
        this.startBackgroundTasks();
        
        console.log('🔐 Universal SSO Authentication System Initializing...');
        console.log('🏰 Securing your 300-domain empire with gaming-enhanced auth');
    }
    
    initDatabase() {
        this.dbPath = './empire-auth.db';
        this.db = new sqlite3.Database(this.dbPath);
        
        this.db.serialize(() => {
            // Users table
            this.db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                empire_level INTEGER DEFAULT 1,
                total_score INTEGER DEFAULT 0,
                domains_unlocked TEXT DEFAULT '[]',
                biometric_enabled BOOLEAN DEFAULT FALSE,
                biometric_data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                login_count INTEGER DEFAULT 0,
                achievement_count INTEGER DEFAULT 0,
                empire_member BOOLEAN DEFAULT FALSE
            )`);
            
            // Sessions table
            this.db.run(`CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                session_token TEXT UNIQUE,
                refresh_token TEXT UNIQUE,
                domain TEXT,
                ip_address TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                active BOOLEAN DEFAULT TRUE,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`);
            
            // Domain access logs
            this.db.run(`CREATE TABLE IF NOT EXISTS domain_access (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                domain TEXT,
                access_count INTEGER DEFAULT 1,
                last_access DATETIME DEFAULT CURRENT_TIMESTAMP,
                achievements TEXT DEFAULT '[]',
                total_time_spent INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(user_id, domain)
            )`);
            
            // OAuth integrations
            this.db.run(`CREATE TABLE IF NOT EXISTS oauth_integrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                provider TEXT,
                provider_user_id TEXT,
                access_token TEXT,
                refresh_token TEXT,
                expires_at DATETIME,
                scope TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                UNIQUE(user_id, provider)
            )`);
            
            // Gaming achievements
            this.db.run(`CREATE TABLE IF NOT EXISTS achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                achievement_type TEXT,
                achievement_data TEXT,
                domain TEXT,
                points INTEGER DEFAULT 0,
                unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`);
        });
        
        console.log('🗄️ Authentication database initialized');
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        
        // CORS for empire domains
        this.app.use((req, res, next) => {
            const origin = req.headers.origin;
            if (this.isDomainInEmpire(origin)) {
                res.header('Access-Control-Allow-Origin', origin);
            } else {
                res.header('Access-Control-Allow-Origin', '*');
            }
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Empire-Token');
            res.header('Access-Control-Allow-Credentials', 'true');
            next();
        });
        
        // Gaming-style request logging
        this.app.use((req, res, next) => {
            console.log(`${this.gameElements.empire_sync} ${req.method} ${req.path} from ${req.ip}`);
            next();
        });
        
        // Rate limiting for auth endpoints
        this.setupRateLimit();
    }
    
    setupRateLimit() {
        const attempts = new Map();
        
        this.app.use('/auth/login', (req, res, next) => {
            const ip = req.ip;
            const now = Date.now();
            const windowMs = 15 * 60 * 1000; // 15 minutes
            const maxAttempts = 5;
            
            if (!attempts.has(ip)) {
                attempts.set(ip, []);
            }
            
            const userAttempts = attempts.get(ip);
            const recentAttempts = userAttempts.filter(time => now - time < windowMs);
            
            if (recentAttempts.length >= maxAttempts) {
                return res.status(429).json({
                    error: '🛡️ Too many login attempts. Please try again later.',
                    retryAfter: Math.ceil(windowMs / 1000)
                });
            }
            
            attempts.set(ip, [...recentAttempts, now]);
            next();
        });
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'universal-sso-auth',
                port: this.port,
                stats: this.authStats,
                empire_domains: this.domainEmpire.length
            });
        });
        
        // User registration (empire member signup)
        this.app.post('/auth/register', async (req, res) => {
            try {
                const { username, email, password, inviteCode } = req.body;
                
                // Validate empire invite code (optional)
                if (inviteCode && !this.validateInviteCode(inviteCode)) {
                    return res.status(400).json({ error: '❌ Invalid empire invite code' });
                }
                
                // Check if user exists
                const existingUser = await this.getUserByEmail(email);
                if (existingUser) {
                    return res.status(400).json({ error: '❌ User already exists in empire' });
                }
                
                // Hash password
                const passwordHash = await bcrypt.hash(password, 12);
                
                // Create user
                const userId = await this.createUser({
                    username,
                    email,
                    password_hash: passwordHash,
                    empire_member: !!inviteCode
                });
                
                // Generate initial tokens
                const tokens = await this.generateTokens(userId, req);
                
                // Award registration achievement
                await this.awardAchievement(userId, 'empire_joined', {
                    message: 'Welcome to the 300-Domain Empire!',
                    points: 100
                });
                
                console.log(`${this.gameElements.achievement_unlock} New empire member: ${username}`);
                
                res.json({
                    message: '🏰 Welcome to the empire!',
                    user: { id: userId, username, email },
                    tokens,
                    achievement: 'Empire Member Achievement Unlocked!'
                });
                
            } catch (error) {
                console.error('Registration error:', error);
                res.status(500).json({ error: '❌ Registration failed' });
            }
        });
        
        // User login
        this.app.post('/auth/login', async (req, res) => {
            try {
                const { email, password, domain, biometric } = req.body;
                
                // Get user
                const user = await this.getUserByEmail(email);
                if (!user) {
                    this.authStats.failedAttempts++;
                    return res.status(401).json({ error: '❌ Invalid credentials' });
                }
                
                let authValid = false;
                
                // Check biometric auth first if provided
                if (biometric && user.biometric_enabled) {
                    authValid = await this.validateBiometricAuth(user.id, biometric);
                    if (authValid) {
                        this.authStats.biometricAuths++;
                        console.log(`${this.gameElements.biometric_auth} Biometric login: ${user.username}`);
                    }
                }
                
                // Fallback to password auth
                if (!authValid) {
                    authValid = await bcrypt.compare(password, user.password_hash);
                }
                
                if (!authValid) {
                    this.authStats.failedAttempts++;
                    return res.status(401).json({ error: '❌ Invalid credentials' });
                }
                
                // Generate tokens
                const tokens = await this.generateTokens(user.id, req, domain);
                
                // Update user login stats
                await this.updateUserLoginStats(user.id);
                
                // Track domain access
                if (domain) {
                    await this.trackDomainAccess(user.id, domain);
                }
                
                // Check for login achievements
                await this.checkLoginAchievements(user.id);
                
                this.authStats.totalLogins++;
                this.authStats.activeUsers++;
                
                console.log(`${this.gameElements.login_success} Login success: ${user.username}@${domain || 'empire'}`);
                
                res.json({
                    message: '🎯 Empire login successful!',
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        empire_level: user.empire_level,
                        total_score: user.total_score,
                        achievement_count: user.achievement_count
                    },
                    tokens,
                    empire_access: this.domainEmpire
                });
                
            } catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ error: '❌ Login failed' });
            }
        });
        
        // Token refresh
        this.app.post('/auth/refresh', async (req, res) => {
            try {
                const { refreshToken } = req.body;
                
                const decoded = jwt.verify(refreshToken, this.refreshSecret);
                const session = await this.getSession(decoded.sessionId);
                
                if (!session || !session.active) {
                    return res.status(401).json({ error: '❌ Invalid refresh token' });
                }
                
                const tokens = await this.generateTokens(session.user_id, req, session.domain);
                
                console.log(`${this.gameElements.token_refresh} Token refreshed for user ${session.user_id}`);
                
                res.json({
                    message: '🔄 Token refreshed',
                    tokens
                });
                
            } catch (error) {
                res.status(401).json({ error: '❌ Invalid refresh token' });
            }
        });
        
        // Empire-wide logout
        this.app.post('/auth/logout', this.authenticateToken, async (req, res) => {
            try {
                const { sessionId } = req.user;
                
                // Invalidate session
                await this.invalidateSession(sessionId);
                
                // Remove from active sessions
                this.activeSessions.delete(sessionId);
                
                this.authStats.activeUsers = Math.max(0, this.authStats.activeUsers - 1);
                
                res.json({ message: '👋 Logged out from empire' });
                
            } catch (error) {
                res.status(500).json({ error: '❌ Logout failed' });
            }
        });
        
        // Cross-domain authentication check
        this.app.get('/auth/verify/:domain', this.authenticateToken, async (req, res) => {
            try {
                const { domain } = req.params;
                const userId = req.user.userId;
                
                // Check if user has access to this domain
                const hasAccess = await this.checkDomainAccess(userId, domain);
                
                if (hasAccess) {
                    // Track access
                    await this.trackDomainAccess(userId, domain);
                    
                    res.json({
                        authorized: true,
                        domain,
                        user: req.user,
                        message: `${this.gameElements.multi_domain} Access granted to ${domain}`
                    });
                } else {
                    res.status(403).json({
                        authorized: false,
                        domain,
                        error: '🔒 Domain access restricted'
                    });
                }
                
            } catch (error) {
                res.status(500).json({ error: '❌ Verification failed' });
            }
        });
        
        // User profile with gaming stats
        this.app.get('/auth/profile', this.authenticateToken, async (req, res) => {
            try {
                const user = await this.getUserById(req.user.userId);
                const achievements = await this.getUserAchievements(req.user.userId);
                const domainStats = await this.getUserDomainStats(req.user.userId);
                
                res.json({
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        empire_level: user.empire_level,
                        total_score: user.total_score,
                        achievement_count: user.achievement_count,
                        domains_unlocked: JSON.parse(user.domains_unlocked || '[]'),
                        login_count: user.login_count,
                        member_since: user.created_at
                    },
                    achievements,
                    domain_stats: domainStats,
                    empire_access: this.domainEmpire
                });
                
            } catch (error) {
                res.status(500).json({ error: '❌ Profile fetch failed' });
            }
        });
        
        // Enable biometric authentication
        this.app.post('/auth/biometric/enable', this.authenticateToken, async (req, res) => {
            try {
                const { biometricData } = req.body;
                const userId = req.user.userId;
                
                // Store encrypted biometric data
                const encryptedData = this.encryptBiometricData(biometricData);
                
                await this.enableBiometric(userId, encryptedData);
                
                await this.awardAchievement(userId, 'biometric_enabled', {
                    message: 'Biometric Security Enabled!',
                    points: 50
                });
                
                res.json({
                    message: `${this.gameElements.biometric_auth} Biometric authentication enabled`,
                    achievement: 'Security Expert Achievement Unlocked!'
                });
                
            } catch (error) {
                res.status(500).json({ error: '❌ Biometric setup failed' });
            }
        });
        
        // Empire statistics
        this.app.get('/auth/stats', async (req, res) => {
            try {
                const dbStats = await this.getDatabaseStats();
                res.json({
                    runtime: this.authStats,
                    database: dbStats,
                    empire_domains: this.domainEmpire.length,
                    active_sessions: this.activeSessions.size
                });
            } catch (error) {
                res.status(500).json({ error: '❌ Stats unavailable' });
            }
        });
        
        // Authentication dashboard
        this.app.get('/dashboard', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
    }
    
    // Authentication middleware
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'] || req.headers['empire-token'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: '🔒 Access token required' });
        }
        
        try {
            const decoded = jwt.verify(token, this.jwtSecret);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(403).json({ error: '❌ Invalid token' });
        }
    }
    
    // Helper methods
    async generateTokens(userId, req, domain = null) {
        const sessionId = crypto.randomBytes(32).toString('hex');
        
        const payload = {
            userId,
            sessionId,
            domain,
            empire: true
        };
        
        const accessToken = jwt.sign(payload, this.jwtSecret, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ sessionId }, this.refreshSecret, { expiresIn: '7d' });
        
        // Store session
        await this.createSession({
            user_id: userId,
            session_token: accessToken,
            refresh_token: refreshToken,
            domain,
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            expires_at: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        });
        
        this.activeSessions.set(sessionId, { userId, domain, created: Date.now() });
        
        return { accessToken, refreshToken, expiresIn: 3600 };
    }
    
    isDomainInEmpire(domain) {
        if (!domain) return false;
        return this.domainEmpire.some(empireDomain => domain.includes(empireDomain));
    }
    
    validateInviteCode(code) {
        // Simple validation - in production use crypto verification
        const validCodes = ['EMPIRE2024', 'DEATHTODATA', 'SOULFRA300'];
        return validCodes.includes(code.toUpperCase());
    }
    
    async validateBiometricAuth(userId, biometricData) {
        // Simplified biometric validation
        // In production, use proper biometric matching algorithms
        const user = await this.getUserById(userId);
        if (!user.biometric_data) return false;
        
        const storedData = this.decryptBiometricData(user.biometric_data);
        return storedData === biometricData; // Simplified comparison
    }
    
    encryptBiometricData(data) {
        const cipher = crypto.createCipher('aes-256-cbc', this.jwtSecret);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    
    decryptBiometricData(encryptedData) {
        const decipher = crypto.createDecipher('aes-256-cbc', this.jwtSecret);
        let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
    
    // Database operations
    async createUser(userData) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO users (username, email, password_hash, empire_member)
                VALUES (?, ?, ?, ?)
            `;
            this.db.run(query, [
                userData.username,
                userData.email,
                userData.password_hash,
                userData.empire_member
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }
    
    async getUserByEmail(email) {
        return new Promise((resolve) => {
            this.db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                resolve(err ? null : row);
            });
        });
    }
    
    async getUserById(id) {
        return new Promise((resolve) => {
            this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                resolve(err ? null : row);
            });
        });
    }
    
    async createSession(sessionData) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO sessions (user_id, session_token, refresh_token, domain, ip_address, user_agent, expires_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            this.db.run(query, [
                sessionData.user_id,
                sessionData.session_token,
                sessionData.refresh_token,
                sessionData.domain,
                sessionData.ip_address,
                sessionData.user_agent,
                sessionData.expires_at
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }
    
    async getSession(sessionId) {
        return new Promise((resolve) => {
            this.db.get('SELECT * FROM sessions WHERE id = ? AND active = TRUE', [sessionId], (err, row) => {
                resolve(err ? null : row);
            });
        });
    }
    
    async invalidateSession(sessionId) {
        return new Promise((resolve) => {
            this.db.run('UPDATE sessions SET active = FALSE WHERE id = ?', [sessionId], resolve);
        });
    }
    
    async updateUserLoginStats(userId) {
        this.db.run(`
            UPDATE users 
            SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 
            WHERE id = ?
        `, [userId]);
    }
    
    async trackDomainAccess(userId, domain) {
        this.db.run(`
            INSERT INTO domain_access (user_id, domain, access_count, last_access)
            VALUES (?, ?, 1, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, domain) DO UPDATE SET
                access_count = access_count + 1,
                last_access = CURRENT_TIMESTAMP
        `, [userId, domain]);
    }
    
    async checkDomainAccess(userId, domain) {
        // For now, all empire members have access to all domains
        // Later implement role-based access control
        return this.isDomainInEmpire(domain) || domain === 'localhost';
    }
    
    async awardAchievement(userId, type, data) {
        return new Promise((resolve) => {
            this.db.run(`
                INSERT INTO achievements (user_id, achievement_type, achievement_data, points)
                VALUES (?, ?, ?, ?)
            `, [userId, type, JSON.stringify(data), data.points || 0], resolve);
            
            // Update user's total score and achievement count
            this.db.run(`
                UPDATE users 
                SET total_score = total_score + ?, achievement_count = achievement_count + 1
                WHERE id = ?
            `, [data.points || 0, userId]);
        });
    }
    
    async getUserAchievements(userId) {
        return new Promise((resolve) => {
            this.db.all(`
                SELECT * FROM achievements 
                WHERE user_id = ? 
                ORDER BY unlocked_at DESC
            `, [userId], (err, rows) => {
                resolve(err ? [] : rows.map(row => ({
                    ...row,
                    achievement_data: JSON.parse(row.achievement_data || '{}')
                })));
            });
        });
    }
    
    async getUserDomainStats(userId) {
        return new Promise((resolve) => {
            this.db.all(`
                SELECT domain, access_count, last_access, total_time_spent
                FROM domain_access 
                WHERE user_id = ?
                ORDER BY access_count DESC
            `, [userId], (err, rows) => {
                resolve(err ? [] : rows);
            });
        });
    }
    
    async checkLoginAchievements(userId) {
        const user = await this.getUserById(userId);
        
        // Login streak achievements
        if (user.login_count === 10) {
            await this.awardAchievement(userId, 'login_warrior', {
                message: '10 Login Warrior!',
                points: 100
            });
        } else if (user.login_count === 100) {
            await this.awardAchievement(userId, 'login_legend', {
                message: '100 Login Legend!',
                points: 500
            });
        }
    }
    
    async enableBiometric(userId, encryptedData) {
        this.db.run(`
            UPDATE users 
            SET biometric_enabled = TRUE, biometric_data = ? 
            WHERE id = ?
        `, [encryptedData, userId]);
    }
    
    async getDatabaseStats() {
        return new Promise((resolve) => {
            this.db.all(`
                SELECT 
                    (SELECT COUNT(*) FROM users) as total_users,
                    (SELECT COUNT(*) FROM users WHERE empire_member = TRUE) as empire_members,
                    (SELECT COUNT(*) FROM sessions WHERE active = TRUE) as active_sessions,
                    (SELECT COUNT(*) FROM achievements) as total_achievements,
                    (SELECT AVG(total_score) FROM users) as avg_user_score
            `, (err, rows) => {
                resolve(err ? {} : rows[0]);
            });
        });
    }
    
    startBackgroundTasks() {
        // Clean expired sessions
        setInterval(() => {
            this.db.run('UPDATE sessions SET active = FALSE WHERE expires_at < CURRENT_TIMESTAMP');
            console.log('🧹 Cleaned expired sessions');
        }, 60 * 60 * 1000); // Every hour
        
        // Update active user count
        setInterval(() => {
            const now = Date.now();
            for (const [sessionId, session] of this.activeSessions.entries()) {
                if (now - session.created > 60 * 60 * 1000) { // 1 hour timeout
                    this.activeSessions.delete(sessionId);
                    this.authStats.activeUsers = Math.max(0, this.authStats.activeUsers - 1);
                }
            }
        }, 5 * 60 * 1000); // Every 5 minutes
    }
    
    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🔐 Empire SSO Authentication Hub</title>
    <style>
        body { font-family: 'Courier New', monospace; background: #0a0a0a; color: #00ff41; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; border: 2px solid #00ff41; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 20px; }
        .card { background: #1a1a1a; border: 1px solid #00ff41; padding: 20px; border-radius: 5px; }
        .card h3 { color: #00ff41; text-shadow: 0 0 10px #00ff41; margin-top: 0; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .metric-value { color: #ffff00; font-weight: bold; }
        .empire { color: #ffd700; font-weight: bold; }
        .success { color: #00ff00; }
        .fail { color: #ff6666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 EMPIRE SSO AUTHENTICATION HUB 🔐</h1>
            <p>Single Sign-On system for your 300-domain empire</p>
            <p class="empire">RuneLite-inspired authentication with gaming achievements</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>📊 Authentication Stats</h3>
                <div class="metric">
                    <span>Total Logins:</span>
                    <span class="metric-value success">${this.authStats.totalLogins}</span>
                </div>
                <div class="metric">
                    <span>Active Users:</span>
                    <span class="metric-value">${this.authStats.activeUsers}</span>
                </div>
                <div class="metric">
                    <span>Failed Attempts:</span>
                    <span class="metric-value fail">${this.authStats.failedAttempts}</span>
                </div>
                <div class="metric">
                    <span>Biometric Auths:</span>
                    <span class="metric-value">${this.authStats.biometricAuths}</span>
                </div>
                <div class="metric">
                    <span>Active Sessions:</span>
                    <span class="metric-value">${this.activeSessions.size}</span>
                </div>
            </div>
            
            <div class="card">
                <h3>🏰 Empire Domains</h3>
                <div class="metric">
                    <span>Total Domains:</span>
                    <span class="metric-value empire">${this.domainEmpire.length}</span>
                </div>
                <div style="max-height: 150px; overflow-y: auto; margin: 10px 0;">
                    ${this.domainEmpire.map(domain => `<div>• ${domain}</div>`).join('')}
                </div>
            </div>
            
            <div class="card">
                <h3>🎮 Gaming Features</h3>
                <div>✅ Achievement System Active</div>
                <div>✅ Empire Level Progression</div>
                <div>✅ Cross-Domain Score Tracking</div>
                <div>✅ Biometric Authentication</div>
                <div>✅ Gaming UI Integration</div>
            </div>
            
            <div class="card">
                <h3>🚀 API Endpoints</h3>
                <div style="font-size: 12px; line-height: 1.4;">
                    POST /auth/register - Empire signup<br>
                    POST /auth/login - Universal login<br>
                    POST /auth/refresh - Token refresh<br>
                    GET /auth/verify/:domain - Domain auth<br>
                    GET /auth/profile - User profile<br>
                    POST /auth/biometric/enable - Setup biometric
                </div>
            </div>
        </div>
    </div>
</body>
</html>
        `;
    }
    
    async start() {
        const server = this.app.listen(this.port, () => {
            console.log(`
🔐 UNIVERSAL SSO AUTHENTICATION STARTED! 🔐
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Auth API: http://localhost:${this.port}
📊 Dashboard: http://localhost:${this.port}/dashboard
🗄️ Database: ${this.dbPath}
🏰 Empire Domains: ${this.domainEmpire.length} protected

API Endpoints:
  • POST /auth/register - Empire member signup
  • POST /auth/login - Universal SSO login
  • POST /auth/refresh - Token refresh
  • GET  /auth/verify/:domain - Cross-domain verification
  • GET  /auth/profile - User profile with gaming stats
  • POST /auth/biometric/enable - Enable biometric auth

RuneLite-inspired authentication ready! ${this.gameElements.achievement_unlock}
            `);
        });
        
        return server;
    }
}

// Export
module.exports = UniversalSSOAuthSystem;

// Run if called directly
if (require.main === module) {
    const authSystem = new UniversalSSOAuthSystem();
    authSystem.start().catch(console.error);
}