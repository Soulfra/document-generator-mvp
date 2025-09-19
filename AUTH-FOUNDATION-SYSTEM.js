#!/usr/bin/env node

/**
 * AUTH FOUNDATION SYSTEM
 * 
 * THE FOUNDATION - Everything flows through login first.
 * Users authenticate, then access boards (tycoon, gacha, debug game, etc.)
 * No more external wrappers - this IS our native system.
 * 
 * Flow: Login → Dashboard → Choose Board → Access System
 * - Tycoon Board (port 7090)
 * - Gacha Board (port 7300) 
 * - Debug Game Board (port 8500)
 * - Knowledge Graph Board (port 9700)
 * - All other systems
 */

const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

class AuthFoundationSystem {
    constructor() {
        this.port = 8888; // Main auth server
        this.wsPort = 8889; // WebSocket for real-time updates
        this.app = express();
        this.wss = null;
        this.db = null;
        
        // JWT Secret (in real app would be env var)
        this.jwtSecret = 'auth-foundation-secret-' + crypto.randomBytes(16).toString('hex');
        
        // Connected Systems Registry
        this.connectedSystems = {
            tycoon: { port: 7090, status: 'unknown', users: new Set() },
            gacha: { port: 7300, status: 'unknown', users: new Set() },
            debugGame: { port: 8500, status: 'unknown', users: new Set() },
            knowledgeGraph: { port: 9700, status: 'unknown', users: new Set() },
            massiveGraph: { port: 9800, status: 'unknown', users: new Set() },
            blameChain: { port: 6600, status: 'unknown', users: new Set() }
        };
        
        // Active User Sessions
        this.activeSessions = new Map(); // token -> user data
        this.userConnections = new Map(); // userId -> websocket
        
        this.logFile = 'auth-foundation.log';
        this.log('🔐 Auth Foundation System initializing...');
        
        this.initializeDatabase();
        this.setupExpress();
        this.setupWebSocket();
        this.startSystemMonitoring();
    }
    
    initializeDatabase() {
        this.db = new sqlite3.Database('auth-foundation.db');
        
        // Create users table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                is_active BOOLEAN DEFAULT 1,
                permissions TEXT DEFAULT '[]',
                board_access TEXT DEFAULT '[]'
            )
        `);
        
        // Create sessions table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                token TEXT UNIQUE NOT NULL,
                expires_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                user_agent TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);
        
        // Create system_access_log table
        this.db.run(`
            CREATE TABLE IF NOT EXISTS system_access_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                system_name TEXT,
                action TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip_address TEXT,
                session_token TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        `);
        
        // Insert default user if not exists
        this.db.get("SELECT id FROM users WHERE username = 'matthewmauer'", (err, row) => {
            if (err) {
                console.error('Database error:', err);
                return;
            }
            
            if (!row) {
                const passwordHash = this.hashPassword('dashboard123');
                const boardAccess = JSON.stringify(['tycoon', 'gacha', 'debugGame', 'knowledgeGraph', 'massiveGraph', 'blameChain']);
                const permissions = JSON.stringify(['admin', 'all_boards', 'system_monitor']);
                
                this.db.run(
                    "INSERT INTO users (username, password_hash, board_access, permissions) VALUES (?, ?, ?, ?)",
                    ['matthewmauer', passwordHash, boardAccess, permissions],
                    (err) => {
                        if (err) {
                            console.error('Error creating default user:', err);
                        } else {
                            this.log('👤 Default user created: matthewmauer');
                        }
                    }
                );
            }
        });
        
        this.log('💾 Auth Foundation database initialized');
    }
    
    setupExpress() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Serve login page
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'login.html'));
        });
        
        // Login endpoint
        this.app.post('/auth/login', async (req, res) => {
            try {
                const { username, password } = req.body;
                const user = await this.authenticateUser(username, password);
                
                if (user) {
                    const token = this.generateToken();
                    const session = await this.createSession(user.id, token, req);
                    
                    this.activeSessions.set(token, {
                        userId: user.id,
                        username: user.username,
                        permissions: JSON.parse(user.permissions || '[]'),
                        boardAccess: JSON.parse(user.board_access || '[]'),
                        sessionId: session.id
                    });
                    
                    // Update last login
                    this.db.run("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);
                    
                    this.log('🔓 User logged in: ' + username);
                    
                    res.json({
                        success: true,
                        token: token,
                        user: {
                            id: user.id,
                            username: user.username,
                            boardAccess: JSON.parse(user.board_access || '[]'),
                            permissions: JSON.parse(user.permissions || '[]')
                        }
                    });
                } else {
                    res.status(401).json({
                        success: false,
                        error: 'Invalid username or password'
                    });
                }
            } catch (error) {
                console.error('Login error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error'
                });
            }
        });
        
        // Register endpoint
        this.app.post('/auth/register', async (req, res) => {
            try {
                const { username, email, password } = req.body;
                
                // Check if user exists
                const existingUser = await this.getUser(username);
                if (existingUser) {
                    return res.status(400).json({
                        success: false,
                        error: 'Username already exists'
                    });
                }
                
                const passwordHash = this.hashPassword(password);
                const defaultBoardAccess = JSON.stringify(['tycoon', 'gacha', 'debugGame']);
                const defaultPermissions = JSON.stringify(['user']);
                
                this.db.run(
                    "INSERT INTO users (username, email, password_hash, board_access, permissions) VALUES (?, ?, ?, ?, ?)",
                    [username, email, passwordHash, defaultBoardAccess, defaultPermissions],
                    function(err) {
                        if (err) {
                            console.error('Registration error:', err);
                            res.status(500).json({
                                success: false,
                                error: 'Registration failed'
                            });
                        } else {
                            res.json({
                                success: true,
                                message: 'User registered successfully'
                            });
                        }
                    }
                );
                
                this.log('👤 New user registered: ' + username);
                
            } catch (error) {
                console.error('Registration error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Internal server error'
                });
            }
        });
        
        // Check authentication endpoint
        this.app.get('/auth/me', (req, res) => {
            const token = this.extractToken(req);
            const session = this.activeSessions.get(token);
            
            if (session) {
                res.json({
                    user: {
                        id: session.userId,
                        username: session.username,
                        boardAccess: session.boardAccess,
                        permissions: session.permissions
                    }
                });
            } else {
                res.status(401).json({
                    error: 'Not authenticated'
                });
            }
        });
        
        // Dashboard endpoint
        this.app.get('/dashboard', (req, res) => {
            res.send(this.generateDashboard());
        });
        
        // Board access endpoints
        this.app.get('/board/:boardName', (req, res) => {
            const token = this.extractToken(req);
            const session = this.activeSessions.get(token);
            
            if (!session) {
                return res.redirect('/');
            }
            
            const boardName = req.params.boardName;
            
            if (!session.boardAccess.includes(boardName)) {
                return res.status(403).json({
                    error: 'Access denied to board: ' + boardName
                });
            }
            
            // Log access
            this.logSystemAccess(session.userId, boardName, 'board_access', req);
            
            // Add user to system
            if (this.connectedSystems[boardName]) {
                this.connectedSystems[boardName].users.add(session.userId);
            }
            
            // Redirect to board system
            const system = this.connectedSystems[boardName];
            if (system) {
                res.redirect('http://localhost:' + system.port);
            } else {
                res.status(404).json({
                    error: 'Board system not found: ' + boardName
                });
            }
        });
        
        // System status API
        this.app.get('/api/systems', (req, res) => {
            const systemStatus = {};
            Object.keys(this.connectedSystems).forEach(name => {
                const system = this.connectedSystems[name];
                systemStatus[name] = {
                    port: system.port,
                    status: system.status,
                    activeUsers: system.users.size
                };
            });
            
            res.json({
                systems: systemStatus,
                totalActiveSessions: this.activeSessions.size,
                uptime: process.uptime()
            });
        });
        
        // Logout endpoint
        this.app.post('/auth/logout', (req, res) => {
            const token = this.extractToken(req);
            
            if (token && this.activeSessions.has(token)) {
                const session = this.activeSessions.get(token);
                this.activeSessions.delete(token);
                
                // Remove from all systems
                Object.values(this.connectedSystems).forEach(system => {
                    system.users.delete(session.userId);
                });
                
                // Delete session from database
                this.db.run("DELETE FROM sessions WHERE token = ?", [token]);
                
                this.log('🔒 User logged out: ' + session.username);
            }
            
            res.json({ success: true });
        });
        
        // Token validation endpoint for services
        this.app.post('/api/validate', (req, res) => {
            try {
                const { token } = req.body;
                
                if (!token) {
                    return res.status(400).json({
                        success: false,
                        error: 'Token required'
                    });
                }
                
                const session = this.activeSessions.get(token);
                
                if (session) {
                    // Token is valid, return user data
                    res.json({
                        success: true,
                        user: {
                            id: session.userId,
                            username: session.username,
                            email: session.email,
                            boardAccess: session.boardAccess,
                            permissions: session.permissions,
                            loginTime: session.loginTime
                        }
                    });
                    
                    // Log validation request
                    this.log(`🔍 Token validated for: ${session.username}`);
                } else {
                    // Invalid token
                    res.status(401).json({
                        success: false,
                        error: 'Invalid or expired token'
                    });
                }
                
            } catch (error) {
                console.error('Token validation error:', error);
                res.status(500).json({
                    success: false,
                    error: 'Validation service error'
                });
            }
        });
        
        // Access log endpoint for services
        this.app.post('/api/access-log', (req, res) => {
            try {
                const logEntry = req.body;
                const serviceName = req.headers['x-service-name'] || 'unknown';
                
                this.log(`📊 ${serviceName}: ${logEntry.user} → ${logEntry.method} ${logEntry.path}`);
                
                res.json({ success: true });
            } catch (error) {
                console.error('Access log error:', error);
                res.status(500).json({ success: false });
            }
        });
        
        this.server = this.app.listen(this.port, () => {
            this.log('🔐 Auth Foundation System running on http://localhost:' + this.port);
        });
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            this.log('🔗 Auth Foundation observer connected');
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'auth-state',
                activeSessions: this.activeSessions.size,
                connectedSystems: Object.keys(this.connectedSystems).length,
                systemStatus: this.getSystemStatus()
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(data, ws);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
        });
        
        this.log('🔗 Auth Foundation WebSocket running on ws://localhost:' + this.wsPort);
    }
    
    startSystemMonitoring() {
        // Monitor all connected systems
        setInterval(() => {
            this.checkSystemHealth();
        }, 30000); // Every 30 seconds
        
        // Clean expired sessions
        setInterval(() => {
            this.cleanExpiredSessions();
        }, 300000); // Every 5 minutes
        
        this.log('🔍 System monitoring started');
    }
    
    async checkSystemHealth() {
        for (const [systemName, system] of Object.entries(this.connectedSystems)) {
            try {
                const response = await fetch('http://localhost:' + system.port + '/');
                system.status = response.ok ? 'healthy' : 'unhealthy';
            } catch (error) {
                system.status = 'offline';
            }
        }
    }
    
    authenticateUser(username, password) {
        return new Promise((resolve) => {
            const passwordHash = this.hashPassword(password);
            
            this.db.get(
                "SELECT * FROM users WHERE username = ? AND password_hash = ? AND is_active = 1",
                [username, passwordHash],
                (err, row) => {
                    if (err) {
                        console.error('Auth error:', err);
                        resolve(null);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }
    
    getUser(username) {
        return new Promise((resolve) => {
            this.db.get(
                "SELECT * FROM users WHERE username = ?",
                [username],
                (err, row) => {
                    if (err) {
                        console.error('Get user error:', err);
                        resolve(null);
                    } else {
                        resolve(row);
                    }
                }
            );
        });
    }
    
    createSession(userId, token, req) {
        return new Promise((resolve) => {
            const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');
            
            this.db.run(
                "INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent) VALUES (?, ?, ?, ?, ?)",
                [userId, token, expiresAt, ipAddress, userAgent],
                function(err) {
                    if (err) {
                        console.error('Session creation error:', err);
                        resolve(null);
                    } else {
                        resolve({ id: this.lastID });
                    }
                }
            );
        });
    }
    
    logSystemAccess(userId, systemName, action, req) {
        const ipAddress = req.ip || req.connection.remoteAddress;
        const sessionToken = this.extractToken(req);
        
        this.db.run(
            "INSERT INTO system_access_log (user_id, system_name, action, ip_address, session_token) VALUES (?, ?, ?, ?, ?)",
            [userId, systemName, action, ipAddress, sessionToken]
        );
    }
    
    cleanExpiredSessions() {
        this.db.run("DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP");
        
        // Remove from active sessions
        for (const [token, session] of this.activeSessions.entries()) {
            // Check if session still exists in database
            this.db.get("SELECT id FROM sessions WHERE token = ?", [token], (err, row) => {
                if (err || !row) {
                    this.activeSessions.delete(token);
                    
                    // Remove from all systems
                    Object.values(this.connectedSystems).forEach(system => {
                        system.users.delete(session.userId);
                    });
                }
            });
        }
    }
    
    generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    hashPassword(password) {
        return crypto.createHash('sha256').update(password + 'auth-salt').digest('hex');
    }
    
    extractToken(req) {
        const authHeader = req.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        
        // Check cookies
        const cookies = req.get('Cookie');
        if (cookies) {
            const tokenMatch = cookies.match(/authToken=([^;]+)/);
            if (tokenMatch) {
                return tokenMatch[1];
            }
        }
        
        return null;
    }
    
    getSystemStatus() {
        const status = {};
        Object.keys(this.connectedSystems).forEach(name => {
            const system = this.connectedSystems[name];
            status[name] = {
                status: system.status,
                users: system.users.size,
                port: system.port
            };
        });
        return status;
    }
    
    handleWebSocketMessage(data, ws) {
        switch (data.type) {
            case 'request-system-status':
                ws.send(JSON.stringify({
                    type: 'system-status',
                    systems: this.getSystemStatus(),
                    activeSessions: this.activeSessions.size
                }));
                break;
        }
    }
    
    generateDashboard() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>🎮 Game Dashboard - Auth Foundation</title>
            <style>
                body { 
                    background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
                    color: #00ff00; 
                    font-family: 'Courier New', monospace; 
                    margin: 0; 
                    padding: 20px;
                    min-height: 100vh;
                }
                .container { max-width: 1200px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { 
                    font-size: 2.5em; 
                    text-shadow: 0 0 20px #00ff00; 
                    margin-bottom: 10px;
                }
                .boards-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
                    gap: 20px; 
                    margin-bottom: 30px; 
                }
                .board-card { 
                    background: rgba(0,255,0,0.1); 
                    border: 2px solid #00ff00; 
                    border-radius: 10px; 
                    padding: 20px; 
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s;
                    position: relative;
                    overflow: hidden;
                }
                .board-card:hover { 
                    background: rgba(0,255,0,0.2); 
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(0,255,0,0.3);
                }
                .board-card h3 { font-size: 1.5em; margin-bottom: 15px; }
                .board-card p { color: #00ffff; margin-bottom: 15px; }
                .board-card .port { 
                    position: absolute; 
                    top: 10px; 
                    right: 10px; 
                    background: rgba(0,255,255,0.2);
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 0.8em;
                }
                .board-card .users {
                    position: absolute;
                    bottom: 10px;
                    right: 10px;
                    color: #ffff00;
                    font-size: 0.9em;
                }
                .status-indicator {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    margin-right: 8px;
                }
                .status-healthy { background: #00ff00; }
                .status-unhealthy { background: #ffff00; }
                .status-offline { background: #ff0000; }
                .system-stats {
                    background: rgba(0,255,255,0.1);
                    border: 1px solid #00ffff;
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 20px;
                }
                .logout-btn {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(255,0,0,0.2);
                    border: 1px solid #ff0000;
                    color: #ff0000;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    text-decoration: none;
                }
                .logout-btn:hover {
                    background: rgba(255,0,0,0.4);
                }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="#" class="logout-btn" onclick="logout()">🔒 Logout</a>
                
                <div class="header">
                    <h1>🎮 Game Dashboard</h1>
                    <p>Auth Foundation System - Choose Your Board</p>
                </div>
                
                <div class="system-stats">
                    <h3>📊 System Status</h3>
                    <p>Active Sessions: <span id="active-sessions">Loading...</span></p>
                    <p>Connected Systems: <span id="connected-systems">Loading...</span></p>
                    <p>Foundation Uptime: <span id="uptime">Loading...</span></p>
                </div>
                
                <div class="boards-grid">
                    <div class="board-card" onclick="accessBoard('tycoon')">
                        <div class="port">:7090</div>
                        <div class="users"><span id="tycoon-users">0</span> users</div>
                        <span class="status-indicator" id="tycoon-status"></span>
                        <h3>🏭 Persistent Tycoon</h3>
                        <p>Build your empire with offline progression, real-time economy, and strategic gameplay</p>
                    </div>
                    
                    <div class="board-card" onclick="accessBoard('gacha')">
                        <div class="port">:7300</div>
                        <div class="users"><span id="gacha-users">0</span> users</div>
                        <span class="status-indicator" id="gacha-status"></span>
                        <h3>🎰 Gacha Token System</h3>
                        <p>Hourly rewards, world bosses, token economy, and collectible rewards</p>
                    </div>
                    
                    <div class="board-card" onclick="accessBoard('debugGame')">
                        <div class="port">:8500</div>
                        <div class="users"><span id="debugGame-users">0</span> users</div>
                        <span class="status-indicator" id="debugGame-status"></span>
                        <h3>🐛 Debug Game Visualizer</h3>
                        <p>Gamified debugging, OCR chains, traffic analysis, and bug hunting challenges</p>
                    </div>
                    
                    <div class="board-card" onclick="accessBoard('knowledgeGraph')">
                        <div class="port">:9700</div>
                        <div class="users"><span id="knowledgeGraph-users">0</span> users</div>
                        <span class="status-indicator" id="knowledgeGraph-status"></span>
                        <h3>🧠 Knowledge Graph</h3>
                        <p>OSS tracking, license management, system connections, and ecosystem health</p>
                    </div>
                    
                    <div class="board-card" onclick="accessBoard('massiveGraph')">
                        <div class="port">:9800</div>
                        <div class="users"><span id="massiveGraph-users">0</span> users</div>
                        <span class="status-indicator" id="massiveGraph-status"></span>
                        <h3>🌌 Massive Graph Builder</h3>
                        <p>459-tier architecture, 37 OSS dependencies, enterprise-level complexity mapping</p>
                    </div>
                    
                    <div class="board-card" onclick="accessBoard('blameChain')">
                        <div class="port">:6600</div>
                        <div class="users"><span id="blameChain-users">0</span> users</div>
                        <span class="status-indicator" id="blameChain-status"></span>
                        <h3>⛓️ BlameChain Integration</h3>
                        <p>Accountability blockchain, reputation system, and unified integration layers</p>
                    </div>
                </div>
            </div>
            
            <script>
                // WebSocket connection for real-time updates
                const ws = new WebSocket('ws://localhost:8889');
                
                ws.onopen = () => {
                    console.log('Connected to Auth Foundation');
                    ws.send(JSON.stringify({ type: 'request-system-status' }));
                };
                
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    updateDashboard(data);
                };
                
                function updateDashboard(data) {
                    if (data.type === 'system-status' || data.type === 'auth-state') {
                        document.getElementById('active-sessions').textContent = data.activeSessions || 0;
                        document.getElementById('connected-systems').textContent = Object.keys(data.systems || data.systemStatus || {}).length;
                        
                        // Update system status indicators
                        Object.keys(data.systems || data.systemStatus || {}).forEach(systemName => {
                            const system = (data.systems || data.systemStatus)[systemName];
                            const statusEl = document.getElementById(systemName + '-status');
                            const usersEl = document.getElementById(systemName + '-users');
                            
                            if (statusEl) {
                                statusEl.className = 'status-indicator status-' + (system.status || 'offline');
                            }
                            if (usersEl) {
                                usersEl.textContent = system.users || 0;
                            }
                        });
                    }
                }
                
                function accessBoard(boardName) {
                    window.location.href = '/board/' + boardName;
                }
                
                async function logout() {
                    try {
                        await fetch('/auth/logout', { method: 'POST' });
                        localStorage.removeItem('authToken');
                        window.location.href = '/';
                    } catch (error) {
                        console.error('Logout error:', error);
                    }
                }
                
                // Load system stats
                async function loadStats() {
                    try {
                        const response = await fetch('/api/systems');
                        const data = await response.json();
                        
                        document.getElementById('uptime').textContent = Math.floor(data.uptime) + 's';
                        updateDashboard({ type: 'system-status', systems: data.systems, activeSessions: data.totalActiveSessions });
                    } catch (error) {
                        console.error('Error loading stats:', error);
                    }
                }
                
                // Load stats on page load
                loadStats();
                
                // Auto-refresh stats every 30 seconds
                setInterval(loadStats, 30000);
            </script>
        </body>
        </html>
        `;
    }
    
    log(message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = timestamp + ' → ' + message;
        console.log(logEntry);
        
        // Append to log file
        fs.appendFileSync(this.logFile, logEntry + '\n');
    }
}

// Start the Auth Foundation System
const authFoundation = new AuthFoundationSystem();

process.on('SIGINT', () => {
    authFoundation.log('🛑 Auth Foundation System shutting down...');
    process.exit(0);
});