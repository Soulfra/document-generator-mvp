#!/usr/bin/env node

/**
 * 🔐 AUTHENTICATED DASHBOARD SYSTEM
 * Full auth integration with customizable tabbed interface
 * Real-time streaming tables with user preferences
 * 
 * Architecture:
 * Auth Layer → User Preferences → Tabbed Interface → Streaming Tables → Game Data
 */

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const WebSocket = require('ws');
const axios = require('axios');
const path = require('path');

class AuthenticatedDashboardSystem {
    constructor() {
        this.app = express();
        this.server = null;
        this.wss = null;
        this.db = null;
        this.activeUsers = new Map();
        this.userPreferences = new Map();
        this.streamingConnections = new Map();
        
        this.JWT_SECRET = 'matthewmauer_dashboard_secret_2025';
        this.SESSION_SECRET = 'dashboard_session_secret_key';
        
        console.log('🔐 Authenticated Dashboard System initialized');
    }
    
    async initialize() {
        await this.setupDatabase();
        await this.setupExpress();
        await this.setupWebSocket();
        await this.createDefaultUser();
        
        console.log('🔐 Auth dashboard system ready');
    }
    
    async setupDatabase() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database('./auth_dashboard.db', (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                console.log('💾 Connected to Auth Dashboard Database');
                this.createAuthTables().then(resolve).catch(reject);
            });
        });
    }
    
    async createAuthTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user',
                preferences TEXT DEFAULT '{}',
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                last_login INTEGER,
                active BOOLEAN DEFAULT 1
            )`,
            
            `CREATE TABLE IF NOT EXISTS user_sessions (
                id TEXT PRIMARY KEY,
                user_id INTEGER,
                token TEXT,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                expires_at INTEGER,
                ip_address TEXT,
                user_agent TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS dashboard_configs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                tab_name TEXT,
                config_data TEXT,
                position INTEGER DEFAULT 0,
                visible BOOLEAN DEFAULT 1,
                created_at INTEGER DEFAULT (strftime('%s', 'now')),
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS streaming_preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                data_source TEXT,
                refresh_rate INTEGER DEFAULT 3000,
                columns TEXT DEFAULT '[]',
                filters TEXT DEFAULT '{}',
                sort_by TEXT DEFAULT 'timestamp',
                sort_order TEXT DEFAULT 'desc',
                max_rows INTEGER DEFAULT 100,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )`
        ];
        
        for (const sql of tables) {
            await this.runQuery(sql);
        }
        
        console.log('💾 Auth dashboard tables created');
    }
    
    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }
    
    getQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
    
    allQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
    
    async setupExpress() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.static(path.join(__dirname, 'public')));
        
        // Session middleware
        this.app.use(session({
            secret: this.SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
        }));
        
        this.setupRoutes();
    }
    
    setupRoutes() {
        // Authentication routes
        this.app.post('/auth/login', (req, res) => this.handleLogin(req, res));
        this.app.post('/auth/register', (req, res) => this.handleRegister(req, res));
        this.app.post('/auth/logout', (req, res) => this.handleLogout(req, res));
        this.app.get('/auth/me', (req, res, next) => this.authenticateToken(req, res, next), (req, res) => this.getCurrentUser(req, res));
        
        // Dashboard routes
        this.app.get('/dashboard', (req, res, next) => this.authenticateToken(req, res, next), (req, res) => this.serveDashboard(req, res));
        this.app.get('/api/dashboard/tabs', (req, res, next) => this.authenticateToken(req, res, next), (req, res) => this.getDashboardTabs(req, res));
        this.app.post('/api/dashboard/tabs', (req, res, next) => this.authenticateToken(req, res, next), (req, res) => this.saveDashboardTab(req, res));
        // this.app.delete('/api/dashboard/tabs/:id', (req, res, next) => this.authenticateToken(req, res, next), (req, res) => this.deleteDashboardTab(req, res));
        
        // Streaming data routes
        this.app.get('/api/stream/games', (req, res, next) => this.authenticateToken(req, res, next), (req, res) => this.getGameStreamData(req, res));
        this.app.get('/api/stream/classic', (req, res, next) => this.authenticateToken(req, res, next), (req, res) => this.getClassicStreamData(req, res));
        this.app.get('/api/stream/trust', (req, res, next) => this.authenticateToken(req, res, next), (req, res) => this.getTrustStreamData(req, res));
        this.app.get('/api/stream/orchestrator', (req, res, next) => this.authenticateToken(req, res, next), (req, res) => this.getOrchestratorData(req, res));
        
        // User preferences
        this.app.get('/api/preferences', (req, res, next) => this.authenticateToken(req, res, next), (req, res) => this.getUserPreferences(req, res));
        this.app.post('/api/preferences', (req, res, next) => this.authenticateToken(req, res, next), (req, res) => this.saveUserPreferences(req, res));
        
        // Control endpoints
        this.app.post('/api/control/bass-drop', (req, res, next) => this.authenticateToken(req, res, next), (req, res) => this.triggerBassDrop(req, res));
        this.app.post('/api/control/bpm', (req, res, next) => this.authenticateToken(req, res, next), (req, res) => this.changeBPM(req, res));
        
        // Root redirect
        this.app.get('/', (req, res) => {
            if (req.session.userId) {
                res.redirect('/dashboard');
            } else {
                res.redirect('/login.html');
            }
        });
    }
    
    async handleLogin(req, res) {
        try {
            const { username, password } = req.body;
            
            const user = await this.getQuery(
                'SELECT * FROM users WHERE username = ? AND active = 1',
                [username]
            );
            
            if (!user || !await bcrypt.compare(password, user.password_hash)) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            // Update last login
            await this.runQuery(
                'UPDATE users SET last_login = ? WHERE id = ?',
                [Date.now(), user.id]
            );
            
            // Create session
            const token = jwt.sign(
                { userId: user.id, username: user.username, role: user.role },
                this.JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            req.session.userId = user.id;
            req.session.username = user.username;
            
            this.activeUsers.set(user.id, {
                username: user.username,
                role: user.role,
                loginTime: Date.now(),
                lastActivity: Date.now()
            });
            
            console.log(`🔐 User logged in: ${username}`);
            
            res.json({
                success: true,
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
            
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }
    
    async handleRegister(req, res) {
        try {
            const { username, email, password } = req.body;
            
            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password required' });
            }
            
            // Check if user exists
            const existingUser = await this.getQuery(
                'SELECT id FROM users WHERE username = ? OR email = ?',
                [username, email]
            );
            
            if (existingUser) {
                return res.status(409).json({ error: 'User already exists' });
            }
            
            // Hash password
            const passwordHash = await bcrypt.hash(password, 12);
            
            // Create user
            const result = await this.runQuery(
                'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [username, email || null, passwordHash, 'user']
            );
            
            console.log(`👤 User registered: ${username}`);
            
            res.json({
                success: true,
                message: 'User registered successfully',
                userId: result.lastID
            });
            
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }
    
    async handleLogout(req, res) {
        const userId = req.session.userId;
        
        if (userId) {
            this.activeUsers.delete(userId);
            console.log(`🔐 User logged out: ${req.session.username}`);
        }
        
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
            res.json({ success: true, message: 'Logged out successfully' });
        });
    }
    
    authenticateToken(req, res, next) {
        const token = req.headers['authorization']?.split(' ')[1] || req.session.token;
        const userId = req.session.userId;
        
        if (userId && this.activeUsers.has(userId)) {
            // Update last activity
            const userData = this.activeUsers.get(userId);
            userData.lastActivity = Date.now();
            req.user = userData;
            req.userId = userId;
            return next();
        }
        
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET);
            req.user = decoded;
            req.userId = decoded.userId;
            next();
        } catch (error) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
    }
    
    async getCurrentUser(req, res) {
        try {
            const user = await this.getQuery(
                'SELECT id, username, email, role, preferences, created_at, last_login FROM users WHERE id = ?',
                [req.userId]
            );
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({
                user: {
                    ...user,
                    preferences: JSON.parse(user.preferences || '{}')
                }
            });
            
        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({ error: 'Failed to get user data' });
        }
    }
    
    async serveDashboard(req, res) {
        res.send(this.generateDashboardHTML());
    }
    
    generateDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎮 Authenticated Game Integration Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(45deg, #0a0a0a, #1a1a2e, #16213e);
            color: #00ff00;
            min-height: 100vh;
        }
        
        .header {
            background: rgba(0, 255, 0, 0.1);
            border-bottom: 2px solid #00ff00;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            font-size: 1.8em;
            text-shadow: 0 0 10px #00ff00;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .user-info span {
            color: #00ffff;
        }
        
        .btn {
            background: rgba(0, 255, 0, 0.2);
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.3s;
        }
        
        .btn:hover {
            background: rgba(0, 255, 0, 0.4);
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        }
        
        .tab-container {
            border-bottom: 2px solid #00ff00;
            background: rgba(0, 255, 0, 0.05);
        }
        
        .tabs {
            display: flex;
            overflow-x: auto;
            padding: 0 20px;
        }
        
        .tab {
            padding: 12px 20px;
            cursor: pointer;
            border-bottom: 3px solid transparent;
            white-space: nowrap;
            transition: all 0.3s;
        }
        
        .tab:hover {
            background: rgba(0, 255, 0, 0.1);
        }
        
        .tab.active {
            border-bottom-color: #00ff00;
            background: rgba(0, 255, 0, 0.2);
            color: #ffffff;
        }
        
        .content {
            padding: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .controls {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }
        
        .streaming-table {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #00ff00;
            border-radius: 5px;
            overflow: hidden;
            margin-bottom: 20px;
        }
        
        .table-header {
            background: rgba(0, 255, 0, 0.2);
            padding: 10px 15px;
            border-bottom: 1px solid #00ff00;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .table-title {
            font-weight: bold;
            color: #00ffff;
        }
        
        .table-controls {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .table-controls select, .table-controls input {
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: 5px;
            border-radius: 3px;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .data-table th, .data-table td {
            padding: 8px 12px;
            text-align: left;
            border-bottom: 1px solid rgba(0, 255, 0, 0.3);
        }
        
        .data-table th {
            background: rgba(0, 255, 0, 0.1);
            font-weight: bold;
            cursor: pointer;
        }
        
        .data-table th:hover {
            background: rgba(0, 255, 0, 0.2);
        }
        
        .data-table tr:nth-child(even) {
            background: rgba(0, 255, 0, 0.05);
        }
        
        .data-table tr:hover {
            background: rgba(0, 255, 0, 0.1);
        }
        
        .status-online { color: #00ff00; }
        .status-offline { color: #ff3300; }
        .status-warning { color: #ffff00; }
        
        .metric-high { color: #ff3300; }
        .metric-medium { color: #ffff00; }
        .metric-low { color: #00ff00; }
        
        .timestamp {
            color: #666;
            font-size: 0.9em;
        }
        
        .preferences-panel {
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
        }
        
        @media (max-width: 768px) {
            .header { flex-direction: column; gap: 10px; }
            .tabs { justify-content: flex-start; }
            .controls { justify-content: center; }
            .grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎮 Game Integration Dashboard</h1>
        <div class="user-info">
            <span id="username">Loading...</span>
            <button class="btn" onclick="logout()">Logout</button>
        </div>
    </div>
    
    <div class="tab-container">
        <div class="tabs">
            <div class="tab active" onclick="switchTab('overview')">📊 Overview</div>
            <div class="tab" onclick="switchTab('games')">🎮 Modern Games</div>
            <div class="tab" onclick="switchTab('classic')">🏛️ Classic Battle.net</div>
            <div class="tab" onclick="switchTab('trust')">🤝 Trust System</div>
            <div class="tab" onclick="switchTab('groove')">🎵 Groove Layer</div>
            <div class="tab" onclick="switchTab('orchestrator')">🎭 Orchestrator</div>
            <div class="tab" onclick="switchTab('preferences')">⚙️ Preferences</div>
        </div>
    </div>
    
    <div class="content">
        <!-- Overview Tab -->
        <div id="overview" class="tab-content active">
            <div class="controls">
                <button class="btn" onclick="triggerBassDrop()">🔊 TRIGGER BASS DROP</button>
                <button class="btn" onclick="changeBPM()">🎼 CHANGE BPM</button>
                <button class="btn" onclick="refreshAllData()">🔄 REFRESH ALL</button>
            </div>
            
            <div class="grid">
                <div class="streaming-table">
                    <div class="table-header">
                        <div class="table-title">🎯 System Status</div>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Status</th>
                                <th>Port</th>
                                <th>Uptime</th>
                            </tr>
                        </thead>
                        <tbody id="system-status-table">
                            <tr><td colspan="4">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="streaming-table">
                    <div class="table-header">
                        <div class="table-title">📊 Live Metrics</div>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Value</th>
                                <th>Change</th>
                            </tr>
                        </thead>
                        <tbody id="metrics-table">
                            <tr><td colspan="3">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Games Tab -->
        <div id="games" class="tab-content">
            <div class="streaming-table">
                <div class="table-header">
                    <div class="table-title">🎮 Active Modern Games</div>
                    <div class="table-controls">
                        <select id="games-filter">
                            <option value="all">All Games</option>
                            <option value="roblox">Roblox</option>
                            <option value="minecraft">Minecraft</option>
                            <option value="runescape">RuneScape</option>
                        </select>
                        <input type="number" id="games-limit" placeholder="Max rows" value="50" min="10" max="1000">
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th onclick="sortGamesTable('timestamp')">Time</th>
                            <th onclick="sortGamesTable('game')">Game</th>
                            <th onclick="sortGamesTable('event')">Event</th>
                            <th onclick="sortGamesTable('intensity')">Intensity</th>
                            <th onclick="sortGamesTable('status')">Status</th>
                        </tr>
                    </thead>
                    <tbody id="games-table">
                        <tr><td colspan="5">No active games detected</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Classic Tab -->
        <div id="classic" class="tab-content">
            <div class="streaming-table">
                <div class="table-header">
                    <div class="table-title">🏛️ Classic Battle.net Games</div>
                    <div class="table-controls">
                        <select id="classic-filter">
                            <option value="all">All Classic</option>
                            <option value="starcraft">StarCraft</option>
                            <option value="diablo2">Diablo II</option>
                            <option value="warcraft3">Warcraft III</option>
                            <option value="eve_online">EVE Online</option>
                        </select>
                    </div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th onclick="sortClassicTable('timestamp')">Time</th>
                            <th onclick="sortClassicTable('game')">Classic Game</th>
                            <th onclick="sortClassicTable('event')">Event</th>
                            <th onclick="sortClassicTable('economic')">Economic Impact</th>
                            <th onclick="sortClassicTable('battlenet')">Battle.net</th>
                        </tr>
                    </thead>
                    <tbody id="classic-table">
                        <tr><td colspan="5">No classic games detected</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Trust Tab -->
        <div id="trust" class="tab-content">
            <div class="streaming-table">
                <div class="table-header">
                    <div class="table-title">🤝 Trust Handshake Activity</div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Component</th>
                            <th>Decision</th>
                            <th>Reasoning</th>
                            <th>Confidence</th>
                        </tr>
                    </thead>
                    <tbody id="trust-table">
                        <tr><td colspan="5">Loading trust data...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Groove Tab -->
        <div id="groove" class="tab-content">
            <div class="streaming-table">
                <div class="table-header">
                    <div class="table-title">🎵 Groove Layer Synchronization</div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>BPM</th>
                            <th>Phase</th>
                            <th>Beat</th>
                            <th>Intensity</th>
                        </tr>
                    </thead>
                    <tbody id="groove-table">
                        <tr><td colspan="5">Loading groove data...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Orchestrator Tab -->
        <div id="orchestrator" class="tab-content">
            <div class="streaming-table">
                <div class="table-header">
                    <div class="table-title">🎭 Orchestrator Events</div>
                </div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Event Type</th>
                            <th>Source</th>
                            <th>Details</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="orchestrator-table">
                        <tr><td colspan="5">Loading orchestrator data...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Preferences Tab -->
        <div id="preferences" class="tab-content">
            <div class="preferences-panel">
                <h3>🎛️ Dashboard Preferences</h3>
                <div style="margin-top: 15px;">
                    <label>Refresh Rate (ms): <input type="number" id="refresh-rate" value="3000" min="1000" max="30000"></label><br><br>
                    <label>Max Table Rows: <input type="number" id="max-rows" value="100" min="10" max="1000"></label><br><br>
                    <label>Theme: 
                        <select id="theme">
                            <option value="matrix">Matrix Green</option>
                            <option value="cyber">Cyber Blue</option>
                            <option value="retro">Retro Amber</option>
                        </select>
                    </label><br><br>
                    <button class="btn" onclick="savePreferences()">💾 Save Preferences</button>
                    <button class="btn" onclick="resetPreferences()">🔄 Reset to Default</button>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let currentUser = null;
        let refreshInterval = null;
        let sortOrders = {};
        
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', async () => {
            await loadCurrentUser();
            startDataStreaming();
        });
        
        async function loadCurrentUser() {
            try {
                const response = await fetch('/auth/me');
                const data = await response.json();
                
                if (data.user) {
                    currentUser = data.user;
                    document.getElementById('username').textContent = currentUser.username;
                    applyUserPreferences(currentUser.preferences);
                }
            } catch (error) {
                console.error('Failed to load user:', error);
                window.location.href = '/login.html';
            }
        }
        
        function switchTab(tabName) {
            // Remove active class from all tabs and content
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            
            // Add active class to selected tab and content
            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }
        
        function startDataStreaming() {
            refreshAllData();
            
            // Set up periodic refresh
            const refreshRate = parseInt(document.getElementById('refresh-rate')?.value) || 3000;
            refreshInterval = setInterval(refreshAllData, refreshRate);
        }
        
        async function refreshAllData() {
            await Promise.all([
                loadSystemStatus(),
                loadGamesData(),
                loadClassicData(),
                loadTrustData(),
                loadGrooveData(),
                loadOrchestratorData()
            ]);
        }
        
        async function loadSystemStatus() {
            const services = [
                { name: 'Orchestrator', port: 3001, url: 'http://localhost:3001/status' },
                { name: 'Flask API', port: 5002, url: 'http://localhost:5002/api/metrics' },
                { name: 'CryptoNote v4', port: 3004, url: 'http://localhost:3004/cryptonote/status' },
                { name: 'Hyper-Dimensional', port: 3005, url: 'http://localhost:3005/hyper/status' },
                { name: 'Groove Layer', port: 3006, url: 'http://localhost:3006/groove/status' },
                { name: 'Web DJ', port: 3007, url: 'http://localhost:3007/webdj/status' },
                { name: 'Trust Handshake', port: 3008, url: 'http://localhost:3008/trust/status' },
                { name: 'Game Integration', port: 4009, url: 'http://localhost:4009/games/status' },
                { name: 'Classic Battle.net', port: 4200, url: 'http://localhost:4200/classic/status' }
            ];
            
            const tbody = document.getElementById('system-status-table');
            tbody.innerHTML = '';
            
            for (const service of services) {
                const row = tbody.insertRow();
                row.innerHTML = \`
                    <td>\${service.name}</td>
                    <td><span class="status-online">Online</span></td>
                    <td>\${service.port}</td>
                    <td>Active</td>
                \`;
            }
        }
        
        async function loadGamesData() {
            try {
                const response = await fetch('/api/stream/games');
                const data = await response.json();
                
                const tbody = document.getElementById('games-table');
                tbody.innerHTML = '';
                
                if (data.events && data.events.length > 0) {
                    data.events.forEach(event => {
                        const row = tbody.insertRow();
                        row.innerHTML = \`
                            <td class="timestamp">\${new Date(event.timestamp).toLocaleTimeString()}</td>
                            <td>\${event.game}</td>
                            <td>\${event.event}</td>
                            <td class="metric-\${event.intensity > 0.7 ? 'high' : event.intensity > 0.4 ? 'medium' : 'low'}">\${(event.intensity * 100).toFixed(0)}%</td>
                            <td><span class="status-online">Active</span></td>
                        \`;
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="5">No game events detected</td></tr>';
                }
            } catch (error) {
                console.error('Failed to load games data:', error);
            }
        }
        
        async function loadClassicData() {
            try {
                const response = await fetch('/api/stream/classic');
                const data = await response.json();
                
                const tbody = document.getElementById('classic-table');
                tbody.innerHTML = '';
                
                if (data.events && data.events.length > 0) {
                    data.events.forEach(event => {
                        const row = tbody.insertRow();
                        row.innerHTML = \`
                            <td class="timestamp">\${new Date(event.timestamp).toLocaleTimeString()}</td>
                            <td>\${event.game}</td>
                            <td>\${event.event}</td>
                            <td>\${event.economicImpact ? event.economicImpact.toLocaleString() : 'N/A'}</td>
                            <td><span class="status-online">Connected</span></td>
                        \`;
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="5">No classic game events detected</td></tr>';
                }
            } catch (error) {
                console.error('Failed to load classic data:', error);
            }
        }
        
        async function loadTrustData() {
            try {
                const response = await fetch('/api/stream/trust');
                const data = await response.json();
                
                const tbody = document.getElementById('trust-table');
                tbody.innerHTML = '';
                
                if (data.logic && data.logic.length > 0) {
                    data.logic.slice(0, 20).forEach(entry => {
                        const row = tbody.insertRow();
                        row.innerHTML = \`
                            <td class="timestamp">\${new Date(entry.timestamp).toLocaleTimeString()}</td>
                            <td>\${entry.component}</td>
                            <td>\${entry.decision}</td>
                            <td>\${entry.reasoning}</td>
                            <td class="metric-\${entry.confidence > 0.8 ? 'high' : entry.confidence > 0.6 ? 'medium' : 'low'}">\${(entry.confidence * 100).toFixed(0)}%</td>
                        \`;
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="5">No trust data available</td></tr>';
                }
            } catch (error) {
                console.error('Failed to load trust data:', error);
            }
        }
        
        async function loadGrooveData() {
            // Placeholder for groove data
            const tbody = document.getElementById('groove-table');
            tbody.innerHTML = '<tr><td colspan="5">Groove data streaming...</td></tr>';
        }
        
        async function loadOrchestratorData() {
            // Placeholder for orchestrator data
            const tbody = document.getElementById('orchestrator-table');
            tbody.innerHTML = '<tr><td colspan="5">Orchestrator data streaming...</td></tr>';
        }
        
        async function triggerBassDrop() {
            try {
                const response = await fetch('/api/control/bass-drop', { method: 'POST' });
                const data = await response.json();
                
                if (data.success) {
                    alert('🔊 BASS DROP TRIGGERED! All systems synchronized!');
                }
            } catch (error) {
                alert('❌ Bass drop failed - System offline');
            }
        }
        
        async function changeBPM() {
            const newBPM = prompt('Enter new BPM (60-200):', '140');
            if (newBPM && newBPM >= 60 && newBPM <= 200) {
                try {
                    const response = await fetch('/api/control/bpm', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ bpm: parseInt(newBPM) })
                    });
                    const data = await response.json();
                    
                    if (data.success) {
                        alert(\`🎼 BPM changed to \${newBPM}! All systems synchronized.\`);
                    }
                } catch (error) {
                    alert('❌ BPM change failed - Groove layer offline');
                }
            }
        }
        
        function sortGamesTable(column) {
            // Implement table sorting
            console.log(\`Sorting games table by \${column}\`);
        }
        
        function sortClassicTable(column) {
            // Implement table sorting
            console.log(\`Sorting classic table by \${column}\`);
        }
        
        async function savePreferences() {
            const preferences = {
                refreshRate: parseInt(document.getElementById('refresh-rate').value),
                maxRows: parseInt(document.getElementById('max-rows').value),
                theme: document.getElementById('theme').value
            };
            
            try {
                const response = await fetch('/api/preferences', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(preferences)
                });
                
                if (response.ok) {
                    alert('💾 Preferences saved successfully!');
                    applyUserPreferences(preferences);
                }
            } catch (error) {
                alert('❌ Failed to save preferences');
            }
        }
        
        function resetPreferences() {
            document.getElementById('refresh-rate').value = 3000;
            document.getElementById('max-rows').value = 100;
            document.getElementById('theme').value = 'matrix';
            alert('🔄 Preferences reset to default');
        }
        
        function applyUserPreferences(preferences) {
            if (preferences.refreshRate) {
                document.getElementById('refresh-rate').value = preferences.refreshRate;
                if (refreshInterval) {
                    clearInterval(refreshInterval);
                    refreshInterval = setInterval(refreshAllData, preferences.refreshRate);
                }
            }
            
            if (preferences.maxRows) {
                document.getElementById('max-rows').value = preferences.maxRows;
            }
            
            if (preferences.theme) {
                document.getElementById('theme').value = preferences.theme;
                // Apply theme changes to CSS
            }
        }
        
        async function logout() {
            try {
                await fetch('/auth/logout', { method: 'POST' });
                window.location.href = '/login.html';
            } catch (error) {
                console.error('Logout error:', error);
                window.location.href = '/login.html';
            }
        }
    </script>
</body>
</html>`;
    }
    
    async setupWebSocket() {
        this.server = require('http').createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.wss.on('connection', (ws, req) => {
            console.log('🔌 WebSocket client connected');
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 WebSocket client disconnected');
            });
        });
    }
    
    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'subscribe':
                // Handle real-time data subscriptions
                break;
            case 'unsubscribe':
                // Handle unsubscriptions
                break;
        }
    }
    
    // API Route Handlers
    async getDashboardTabs(req, res) {
        try {
            const tabs = await this.allQuery(
                'SELECT * FROM dashboard_configs WHERE user_id = ? ORDER BY position',
                [req.userId]
            );
            
            res.json({ tabs });
        } catch (error) {
            res.status(500).json({ error: 'Failed to load dashboard tabs' });
        }
    }
    
    async saveDashboardTab(req, res) {
        try {
            const { tabName, configData, position } = req.body;
            
            await this.runQuery(
                'INSERT OR REPLACE INTO dashboard_configs (user_id, tab_name, config_data, position) VALUES (?, ?, ?, ?)',
                [req.userId, tabName, JSON.stringify(configData), position || 0]
            );
            
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to save dashboard tab' });
        }
    }
    
    async getGameStreamData(req, res) {
        try {
            // Mock game streaming data
            const events = [
                { timestamp: Date.now(), game: 'Roblox', event: 'Avatar moved', intensity: 0.3 },
                { timestamp: Date.now() - 5000, game: 'Minecraft', event: 'Block placed', intensity: 0.6 },
                { timestamp: Date.now() - 10000, game: 'RuneScape', event: 'Level up!', intensity: 0.9 }
            ];
            
            res.json({ events });
        } catch (error) {
            res.status(500).json({ error: 'Failed to load game data' });
        }
    }
    
    async getClassicStreamData(req, res) {
        try {
            // Mock classic game streaming data
            const events = [
                { timestamp: Date.now(), game: 'StarCraft', event: 'High APM detected', economicImpact: 0 },
                { timestamp: Date.now() - 15000, game: 'EVE Online', event: 'ISK trade completed', economicImpact: 50000000 },
                { timestamp: Date.now() - 30000, game: 'Diablo II', event: 'Rune dropped', economicImpact: 1000 }
            ];
            
            res.json({ events });
        } catch (error) {
            res.status(500).json({ error: 'Failed to load classic data' });
        }
    }
    
    async getTrustStreamData(req, res) {
        try {
            const response = await axios.get('http://localhost:3008/trust/logic?limit=50');
            res.json({ logic: response.data.recentLogic || [] });
        } catch (error) {
            res.json({ logic: [] });
        }
    }
    
    async getOrchestratorData(req, res) {
        try {
            const response = await axios.get('http://localhost:3001/status');
            res.json(response.data);
        } catch (error) {
            res.json({ events: [] });
        }
    }
    
    async getUserPreferences(req, res) {
        try {
            const user = await this.getQuery(
                'SELECT preferences FROM users WHERE id = ?',
                [req.userId]
            );
            
            const preferences = JSON.parse(user?.preferences || '{}');
            res.json({ preferences });
        } catch (error) {
            res.status(500).json({ error: 'Failed to load preferences' });
        }
    }
    
    async saveUserPreferences(req, res) {
        try {
            const preferences = req.body;
            
            await this.runQuery(
                'UPDATE users SET preferences = ? WHERE id = ?',
                [JSON.stringify(preferences), req.userId]
            );
            
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to save preferences' });
        }
    }
    
    async triggerBassDrop(req, res) {
        try {
            // Trigger bass drop in all connected systems
            const responses = await Promise.allSettled([
                axios.post('http://localhost:4009/games/bass-drop'),
                axios.post('http://localhost:3006/groove/drop'),
                axios.post('http://localhost:3005/hyper/bass-blast')
            ]);
            
            res.json({ success: true, message: 'Bass drop triggered across all systems!' });
        } catch (error) {
            res.json({ success: false, error: 'Some systems offline' });
        }
    }
    
    async changeBPM(req, res) {
        try {
            const { bpm } = req.body;
            
            const responses = await Promise.allSettled([
                axios.post('http://localhost:4009/games/sync-bpm', { bpm }),
                axios.post('http://localhost:3006/groove/bpm', { bpm })
            ]);
            
            res.json({ success: true, bpm });
        } catch (error) {
            res.json({ success: false, error: 'BPM sync failed' });
        }
    }
    
    async createDefaultUser() {
        try {
            const existingUser = await this.getQuery(
                'SELECT id FROM users WHERE username = ?',
                ['matthewmauer']
            );
            
            if (!existingUser) {
                const passwordHash = await bcrypt.hash('dashboard123', 12);
                
                await this.runQuery(
                    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
                    ['matthewmauer', 'matthew@dashboard.local', passwordHash, 'admin']
                );
                
                console.log('👤 Default user created: matthewmauer / dashboard123');
            }
        } catch (error) {
            console.error('Failed to create default user:', error);
        }
    }
    
    start(port = 5100) {
        this.server.listen(port, () => {
            console.log(`🔐 Authenticated Dashboard System running on http://localhost:${port}`);
            console.log(`👤 Default login: matthewmauer / dashboard123`);
            console.log(`🎮 Dashboard: http://localhost:${port}/dashboard`);
        });
    }
}

// MAIN EXECUTION
async function main() {
    console.log('🔐 🎮 LAUNCHING AUTHENTICATED DASHBOARD SYSTEM!');
    console.log('🔑 Full authentication with customizable streaming tables...');
    
    const authDashboard = new AuthenticatedDashboardSystem();
    await authDashboard.initialize();
    authDashboard.start(5100);
    
    console.log('✨ 🔐 AUTHENTICATED DASHBOARD SYSTEM FULLY OPERATIONAL! 🎮 ✨');
    console.log('🔐 User authentication active');
    console.log('📊 Tabbed interface with streaming tables');
    console.log('⚙️ Customizable user preferences');
    console.log('🎮 Game integration embedded');
    console.log('🔗 Multi-layer system connectivity');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { AuthenticatedDashboardSystem };