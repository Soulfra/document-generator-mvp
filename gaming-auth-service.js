#!/usr/bin/env node

/**
 * 🔐 GAMING AUTH SERVICE - Lightweight auth integration for gaming platform
 * 
 * Provides authentication for gaming system without complex dependencies
 * Integrates with existing gaming routers and services
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs').promises;
const { EventEmitter } = require('events');

class GamingAuthService extends EventEmitter {
    constructor() {
        super();
        
        this.authPort = 6666;
        this.adminPort = 6667;
        
        // Simple user database (in production, use real DB)
        this.users = new Map();
        this.sessions = new Map();
        this.gamingSessions = new Map();
        
        // Gaming-specific user data
        this.playerProfiles = new Map();
        this.achievements = new Map();
        this.leaderboards = new Map();
        
        // Auth configuration
        this.config = {
            sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
            maxLoginAttempts: 5,
            lockoutTime: 15 * 60 * 1000, // 15 minutes
            jwtSecret: process.env.JWT_SECRET || 'gaming-platform-secret'
        };
        
        // Default users for testing
        this.createDefaultUsers();
        
        this.init();
    }
    
    async init() {
        console.log('🔐 Starting Gaming Auth Service...');
        
        // Start main auth server
        this.startAuthServer();
        
        // Start admin interface
        this.startAdminInterface();
        
        // Load existing data
        await this.loadUserData();
        
        console.log(`✅ Gaming Auth Service running on port ${this.authPort}`);
        console.log(`🎮 Admin interface on port ${this.adminPort}`);
        console.log('🎯 Ready for gaming platform integration!');
    }
    
    createDefaultUsers() {
        // Create some default gaming users
        const defaultUsers = [
            { username: 'admin', password: 'admin123', role: 'admin', tier: 'unlimited' },
            { username: 'alice', password: 'password', role: 'player', tier: 'premium' },
            { username: 'bob', password: 'password', role: 'player', tier: 'free' },
            { username: 'charlie', password: 'password', role: 'player', tier: 'premium' },
            { username: 'diana', password: 'password', role: 'player', tier: 'free' },
            { username: 'guest', password: 'guest', role: 'guest', tier: 'limited' }
        ];
        
        for (const user of defaultUsers) {
            const userId = this.generateUserId();
            const hashedPassword = this.hashPassword(user.password);
            
            this.users.set(userId, {
                id: userId,
                username: user.username,
                password: hashedPassword,
                role: user.role,
                tier: user.tier,
                email: `${user.username}@gaming.local`,
                created: new Date(),
                lastLogin: null,
                loginAttempts: 0,
                locked: false
            });
            
            // Create gaming profile
            this.playerProfiles.set(userId, {
                playerId: userId,
                displayName: user.username,
                level: Math.floor(Math.random() * 50) + 1,
                experience: Math.floor(Math.random() * 10000),
                gamesPlayed: Math.floor(Math.random() * 100),
                totalPlayTime: Math.floor(Math.random() * 100000),
                achievements: [],
                friends: [],
                stats: {
                    wins: Math.floor(Math.random() * 50),
                    losses: Math.floor(Math.random() * 30),
                    draws: Math.floor(Math.random() * 10)
                }
            });
        }
        
        console.log(`🎮 Created ${defaultUsers.length} default gaming users`);
    }
    
    startAuthServer() {
        const server = http.createServer((req, res) => {
            this.handleAuthRequest(req, res);
        });
        
        server.listen(this.authPort);
    }
    
    startAdminInterface() {
        const server = http.createServer((req, res) => {
            this.handleAdminRequest(req, res);
        });
        
        server.listen(this.adminPort);
    }
    
    async handleAuthRequest(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const method = req.method;
        const path = url.pathname;
        
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-player-id');
        
        if (method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        try {
            if (path === '/') {
                await this.showAuthDashboard(res);
            } else if (path === '/api/login' && method === 'POST') {
                await this.handleLogin(req, res);
            } else if (path === '/api/register' && method === 'POST') {
                await this.handleRegister(req, res);
            } else if (path === '/api/logout' && method === 'POST') {
                await this.handleLogout(req, res);
            } else if (path === '/api/verify' && method === 'GET') {
                await this.handleVerifyToken(req, res);
            } else if (path === '/api/profile' && method === 'GET') {
                await this.handleGetProfile(req, res);
            } else if (path === '/api/gaming/profile' && method === 'GET') {
                await this.handleGetGamingProfile(req, res);
            } else if (path === '/api/gaming/session/start' && method === 'POST') {
                await this.handleStartGamingSession(req, res);
            } else if (path === '/api/gaming/session/end' && method === 'POST') {
                await this.handleEndGamingSession(req, res);
            } else if (path === '/api/gaming/leaderboard') {
                await this.handleGetLeaderboard(req, res);
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Endpoint not found' }));
            }
        } catch (error) {
            console.error('Auth request error:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal server error' }));
        }
    }
    
    async handleLogin(req, res) {
        const body = await this.getRequestBody(req);
        const { username, password } = JSON.parse(body);
        
        if (!username || !password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Username and password required' }));
            return;
        }
        
        // Find user
        const user = Array.from(this.users.values()).find(u => u.username === username);
        
        if (!user || user.locked) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid credentials or account locked' }));
            return;
        }
        
        // Verify password
        if (!this.verifyPassword(password, user.password)) {
            user.loginAttempts++;
            if (user.loginAttempts >= this.config.maxLoginAttempts) {
                user.locked = true;
                setTimeout(() => {
                    user.locked = false;
                    user.loginAttempts = 0;
                }, this.config.lockoutTime);
            }
            
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid credentials' }));
            return;
        }
        
        // Create session
        const sessionToken = this.generateSessionToken();
        const session = {
            token: sessionToken,
            userId: user.id,
            username: user.username,
            role: user.role,
            tier: user.tier,
            created: new Date(),
            expires: new Date(Date.now() + this.config.sessionTimeout)
        };
        
        this.sessions.set(sessionToken, session);
        
        // Update user
        user.lastLogin = new Date();
        user.loginAttempts = 0;
        user.locked = false;
        
        console.log(`✅ User logged in: ${username} (${user.role})`);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            token: sessionToken,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                tier: user.tier,
                email: user.email
            },
            gaming: this.playerProfiles.get(user.id)
        }));
    }
    
    async handleRegister(req, res) {
        const body = await this.getRequestBody(req);
        const { username, password, email } = JSON.parse(body);
        
        if (!username || !password) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Username and password required' }));
            return;
        }
        
        // Check if user exists
        const existingUser = Array.from(this.users.values()).find(u => u.username === username);
        if (existingUser) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Username already exists' }));
            return;
        }
        
        // Create new user
        const userId = this.generateUserId();
        const hashedPassword = this.hashPassword(password);
        
        const newUser = {
            id: userId,
            username,
            password: hashedPassword,
            email: email || `${username}@gaming.local`,
            role: 'player',
            tier: 'free',
            created: new Date(),
            lastLogin: null,
            loginAttempts: 0,
            locked: false
        };
        
        this.users.set(userId, newUser);
        
        // Create gaming profile
        this.playerProfiles.set(userId, {
            playerId: userId,
            displayName: username,
            level: 1,
            experience: 0,
            gamesPlayed: 0,
            totalPlayTime: 0,
            achievements: [],
            friends: [],
            stats: { wins: 0, losses: 0, draws: 0 }
        });
        
        console.log(`🎮 New user registered: ${username}`);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            message: 'User registered successfully',
            user: {
                id: userId,
                username,
                role: newUser.role,
                tier: newUser.tier
            }
        }));
    }
    
    async handleVerifyToken(req, res) {
        const token = req.headers.authorization?.replace('Bearer ', '') || 
                     req.headers['x-session-token'];
        
        if (!token) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'No token provided' }));
            return;
        }
        
        const session = this.sessions.get(token);
        
        if (!session || session.expires < new Date()) {
            if (session) this.sessions.delete(token);
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid or expired token' }));
            return;
        }
        
        const user = this.users.get(session.userId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            valid: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                tier: user.tier
            },
            session: {
                created: session.created,
                expires: session.expires
            }
        }));
    }
    
    async handleGetGamingProfile(req, res) {
        const session = await this.validateSession(req);
        if (!session) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }
        
        const profile = this.playerProfiles.get(session.userId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            profile,
            activeSessions: Array.from(this.gamingSessions.values())
                .filter(s => s.playerId === session.userId && s.active)
        }));
    }
    
    async handleStartGamingSession(req, res) {
        const session = await this.validateSession(req);
        if (!session) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized' }));
            return;
        }
        
        const body = await this.getRequestBody(req);
        const { gameType, gameMode } = JSON.parse(body);
        
        const sessionId = this.generateSessionToken();
        const gamingSession = {
            sessionId,
            playerId: session.userId,
            gameType: gameType || 'general',
            gameMode: gameMode || 'casual',
            startTime: new Date(),
            active: true,
            stats: { actions: 0, score: 0 }
        };
        
        this.gamingSessions.set(sessionId, gamingSession);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            success: true,
            sessionId,
            message: 'Gaming session started'
        }));
    }
    
    async validateSession(req) {
        const token = req.headers.authorization?.replace('Bearer ', '') || 
                     req.headers['x-session-token'];
        
        if (!token) return null;
        
        const session = this.sessions.get(token);
        if (!session || session.expires < new Date()) {
            if (session) this.sessions.delete(token);
            return null;
        }
        
        return session;
    }
    
    generateUserId() {
        return 'user_' + crypto.randomBytes(8).toString('hex');
    }
    
    generateSessionToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    hashPassword(password) {
        return crypto.createHash('sha256').update(password + 'salt').digest('hex');
    }
    
    verifyPassword(password, hashedPassword) {
        return this.hashPassword(password) === hashedPassword;
    }
    
    async getRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => resolve(body));
            req.on('error', reject);
        });
    }
    
    async showAuthDashboard(res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>🔐 Gaming Auth Service</title>
    <style>
        body { font-family: monospace; background: #000; color: #00ff00; padding: 20px; }
        .auth-form { background: #111; padding: 20px; margin: 20px 0; border: 1px solid #00ff00; }
        input { background: #000; color: #00ff00; border: 1px solid #00ff00; padding: 5px; margin: 5px; }
        button { background: #00ff00; color: #000; border: none; padding: 10px 20px; cursor: pointer; }
        .user-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; }
        .user-card { background: #112; padding: 10px; border: 1px solid #333; }
        .admin { border-color: #ff00ff; }
        .premium { border-color: #ffff00; }
        .free { border-color: #888; }
    </style>
</head>
<body>
    <h1>🔐 GAMING AUTH SERVICE</h1>
    <p>Status: <span style="color: #00ff00;">ONLINE</span></p>
    <p>Active Users: ${this.users.size}</p>
    <p>Active Sessions: ${this.sessions.size}</p>
    
    <div class="auth-form">
        <h2>🎮 LOGIN</h2>
        <input type="text" id="loginUsername" placeholder="Username">
        <input type="password" id="loginPassword" placeholder="Password">
        <button onclick="login()">LOGIN</button>
        <div id="loginResult"></div>
    </div>
    
    <div class="auth-form">
        <h2>📝 REGISTER</h2>
        <input type="text" id="regUsername" placeholder="Username">
        <input type="password" id="regPassword" placeholder="Password">
        <input type="email" id="regEmail" placeholder="Email (optional)">
        <button onclick="register()">REGISTER</button>
        <div id="registerResult"></div>
    </div>
    
    <h2>👥 REGISTERED USERS</h2>
    <div class="user-list">
        ${Array.from(this.users.values()).map(user => `
            <div class="user-card ${user.role}">
                <strong>${user.username}</strong><br>
                Role: ${user.role}<br>
                Tier: ${user.tier}<br>
                Last Login: ${user.lastLogin ? user.lastLogin.toLocaleString() : 'Never'}
            </div>
        `).join('')}
    </div>
    
    <script>
        async function login() {
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    document.getElementById('loginResult').innerHTML = 
                        '<span style="color: #00ff00;">✅ LOGIN SUCCESS!</span><br>' +
                        'Token: ' + result.token.substring(0, 16) + '...<br>' +
                        'Role: ' + result.user.role + '<br>' +
                        'Tier: ' + result.user.tier;
                    localStorage.setItem('authToken', result.token);
                } else {
                    document.getElementById('loginResult').innerHTML = 
                        '<span style="color: #ff0000;">❌ ' + result.error + '</span>';
                }
            } catch (error) {
                document.getElementById('loginResult').innerHTML = 
                    '<span style="color: #ff0000;">❌ Login failed</span>';
            }
        }
        
        async function register() {
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const email = document.getElementById('regEmail').value;
            
            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, email })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    document.getElementById('registerResult').innerHTML = 
                        '<span style="color: #00ff00;">✅ REGISTRATION SUCCESS!</span><br>' +
                        'User ID: ' + result.user.id + '<br>' +
                        'Role: ' + result.user.role;
                    setTimeout(() => location.reload(), 2000);
                } else {
                    document.getElementById('registerResult').innerHTML = 
                        '<span style="color: #ff0000;">❌ ' + result.error + '</span>';
                }
            } catch (error) {
                document.getElementById('registerResult').innerHTML = 
                    '<span style="color: #ff0000;">❌ Registration failed</span>';
            }
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    async handleAdminRequest(req, res) {
        // Simple admin interface
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            service: 'Gaming Auth Admin',
            users: this.users.size,
            sessions: this.sessions.size,
            gamingSessions: this.gamingSessions.size,
            uptime: process.uptime()
        }));
    }
    
    async loadUserData() {
        // In production, load from database
        console.log('📂 User data loaded from memory');
    }
}

// Start the service
if (require.main === module) {
    const authService = new GamingAuthService();
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Gaming Auth Service shutting down...');
        process.exit(0);
    });
}

module.exports = GamingAuthService;