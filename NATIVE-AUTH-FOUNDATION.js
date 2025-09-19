#!/usr/bin/env node

/**
 * NATIVE AUTH FOUNDATION
 * 
 * This IS our foundation. Everything flows through here.
 * No external wrappers - this connects our existing systems through auth.
 * 
 * Flow: login.html → this server → dashboard → existing systems
 * - Tycoon (7090), Gacha (7300), Debug Game (8500), etc.
 * 
 * Uses the existing login.html but provides real backend auth.
 */

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class NativeAuthFoundation {
    constructor() {
        this.port = 1337; // The foundation port
        this.app = express();
        
        // Simple in-memory auth (in production would use database)
        this.users = new Map([
            ['matthewmauer', {
                id: 1,
                username: 'matthewmauer',
                password: this.hashPassword('dashboard123'),
                boardAccess: ['tycoon', 'gacha', 'debugGame', 'knowledgeGraph', 'massiveGraph', 'blameChain'],
                permissions: ['admin', 'all_boards']
            }]
        ]);
        
        this.sessions = new Map(); // token -> user data
        
        // Our existing systems (the boards)
        this.boards = {
            tycoon: { 
                name: 'Persistent Tycoon', 
                port: 7090, 
                description: 'Build your empire with offline progression',
                icon: '🏭',
                status: 'unknown'
            },
            gacha: { 
                name: 'Gacha Token System', 
                port: 7300, 
                description: 'Hourly rewards, world bosses, token economy',
                icon: '🎰',
                status: 'unknown'
            },
            debugGame: { 
                name: 'Debug Game Visualizer', 
                port: 8500, 
                description: 'Gamified debugging and traffic analysis',
                icon: '🐛',
                status: 'unknown'
            },
            knowledgeGraph: { 
                name: 'Knowledge Graph & OSS Bridge', 
                port: 9700, 
                description: 'OSS tracking and system connections',
                icon: '🧠',
                status: 'unknown'
            },
            massiveGraph: { 
                name: 'Massive Graph Builder', 
                port: 9800, 
                description: '459-tier architecture mapping',
                icon: '🌌',
                status: 'unknown'
            },
            blameChain: { 
                name: 'BlameChain Integration', 
                port: 6600, 
                description: 'Accountability blockchain system',
                icon: '⛓️',
                status: 'unknown'
            }
        };
        
        this.logFile = 'native-auth-foundation.log';
        this.log('🔐 Native Auth Foundation initializing...');
        
        this.setupExpress();
        this.startSystemMonitoring();
    }
    
    setupExpress() {
        this.app.use(express.json());
        this.app.use(express.static('.'));
        
        // Serve the existing login page
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'login.html'));
        });
        
        // Auth endpoints (what login.html expects)
        this.app.post('/auth/login', (req, res) => {
            const { username, password } = req.body;
            const user = this.authenticateUser(username, password);
            
            if (user) {
                const token = this.generateToken();
                this.sessions.set(token, {
                    userId: user.id,
                    username: user.username,
                    boardAccess: user.boardAccess,
                    permissions: user.permissions,
                    loginTime: new Date()
                });
                
                this.log('🔓 User logged in: ' + username);
                
                res.json({
                    success: true,
                    token: token,
                    user: {
                        id: user.id,
                        username: user.username,
                        boardAccess: user.boardAccess
                    }
                });
            } else {
                res.status(401).json({
                    success: false,
                    error: 'Invalid username or password'
                });
            }
        });
        
        this.app.post('/auth/register', (req, res) => {
            const { username, email, password } = req.body;
            
            if (this.users.has(username)) {
                return res.status(400).json({
                    success: false,
                    error: 'Username already exists'
                });
            }
            
            const user = {
                id: this.users.size + 1,
                username,
                email,
                password: this.hashPassword(password),
                boardAccess: ['tycoon', 'gacha', 'debugGame'],
                permissions: ['user']
            };
            
            this.users.set(username, user);
            this.log('👤 New user registered: ' + username);
            
            res.json({
                success: true,
                message: 'User registered successfully'
            });
        });
        
        this.app.get('/auth/me', (req, res) => {
            const token = this.extractToken(req);
            const session = this.sessions.get(token);
            
            if (session) {
                res.json({
                    user: {
                        id: session.userId,
                        username: session.username,
                        boardAccess: session.boardAccess
                    }
                });
            } else {
                res.status(401).json({ error: 'Not authenticated' });
            }
        });
        
        // Dashboard (where login.html redirects after auth)
        this.app.get('/dashboard', (req, res) => {
            res.send(this.generateDashboard());
        });
        
        // Board access (THE KEY FOUNDATION FEATURE)
        this.app.get('/board/:boardName', (req, res) => {
            const token = this.extractToken(req) || req.query.token;
            const session = this.sessions.get(token);
            
            if (!session) {
                this.log('🚫 Unauthorized board access attempt');
                return res.redirect('/?error=auth_required');
            }
            
            const boardName = req.params.boardName;
            const board = this.boards[boardName];
            
            if (!board) {
                return res.status(404).json({
                    error: 'Board not found: ' + boardName
                });
            }
            
            if (!session.boardAccess.includes(boardName)) {
                return res.status(403).json({
                    error: 'Access denied to board: ' + boardName
                });
            }
            
            this.log('🎮 User ' + session.username + ' accessing board: ' + boardName);
            
            // Redirect to the actual system with auth token
            const redirectUrl = 'http://localhost:' + board.port + '?auth_token=' + token + '&username=' + session.username;
            res.redirect(redirectUrl);
        });
        
        // System status API
        this.app.get('/api/status', (req, res) => {
            res.json({
                foundation: 'active',
                activeSessions: this.sessions.size,
                boards: this.getBoardStatus(),
                users: this.users.size,
                uptime: process.uptime()
            });
        });
        
        // Logout
        this.app.post('/auth/logout', (req, res) => {
            const token = this.extractToken(req);
            if (token && this.sessions.has(token)) {
                const session = this.sessions.get(token);
                this.sessions.delete(token);
                this.log('🔒 User logged out: ' + session.username);
            }
            res.json({ success: true });
        });
        
        this.server = this.app.listen(this.port, () => {
            this.log('🔐 Native Auth Foundation running on http://localhost:' + this.port);
            this.log('🎮 Login at: http://localhost:' + this.port);
        });
    }
    
    startSystemMonitoring() {
        // Check all boards every 30 seconds
        setInterval(() => {
            this.checkBoardHealth();
        }, 30000);
        
        this.log('🔍 Board monitoring started');
    }
    
    async checkBoardHealth() {
        for (const [boardName, board] of Object.entries(this.boards)) {
            try {
                const response = await fetch('http://localhost:' + board.port + '/');
                board.status = response.ok ? 'healthy' : 'unhealthy';
            } catch (error) {
                board.status = 'offline';
            }
        }
    }
    
    authenticateUser(username, password) {
        const user = this.users.get(username);
        if (user && user.password === this.hashPassword(password)) {
            return user;
        }
        return null;
    }
    
    generateToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    hashPassword(password) {
        return crypto.createHash('sha256').update(password + 'foundation-salt').digest('hex');
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
    
    getBoardStatus() {
        const status = {};
        Object.keys(this.boards).forEach(name => {
            const board = this.boards[name];
            status[name] = {
                name: board.name,
                port: board.port,
                status: board.status,
                icon: board.icon
            };
        });
        return status;
    }
    
    generateDashboard() {
        const boardsHtml = Object.entries(this.boards).map(([key, board]) => {
            const statusColor = board.status === 'healthy' ? '#00ff00' : 
                              board.status === 'unhealthy' ? '#ffff00' : '#ff0000';
            
            return `
            <div class="board-card" onclick="accessBoard('${key}')">
                <div class="board-status" style="color: ${statusColor}">●</div>
                <div class="board-icon">${board.icon}</div>
                <h3>${board.name}</h3>
                <p>${board.description}</p>
                <div class="board-port">:${board.port}</div>
            </div>
            `;
        }).join('');
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>🎮 Native Auth Foundation Dashboard</title>
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
                .header { 
                    text-align: center; 
                    margin-bottom: 30px; 
                    border-bottom: 2px solid #00ff00;
                    padding-bottom: 20px;
                }
                .header h1 { 
                    font-size: 2.5em; 
                    text-shadow: 0 0 20px #00ff00; 
                    margin-bottom: 10px;
                }
                .header p { color: #00ffff; }
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
                .logout-btn:hover { background: rgba(255,0,0,0.4); }
                .stats {
                    background: rgba(0,255,255,0.1);
                    border: 1px solid #00ffff;
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 30px;
                    text-align: center;
                }
                .boards-grid { 
                    display: grid; 
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
                    gap: 20px; 
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
                }
                .board-card:hover { 
                    background: rgba(0,255,0,0.2); 
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(0,255,0,0.3);
                }
                .board-status {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    font-size: 1.2em;
                }
                .board-port {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: rgba(0,255,255,0.2);
                    padding: 5px 10px;
                    border-radius: 15px;
                    font-size: 0.8em;
                }
                .board-icon { font-size: 3em; margin-bottom: 15px; }
                .board-card h3 { margin: 15px 0; }
                .board-card p { color: #00ffff; margin-bottom: 0; }
                .foundation-info {
                    background: rgba(0,255,0,0.05);
                    border: 1px solid #00ff00;
                    border-radius: 10px;
                    padding: 20px;
                    margin-top: 30px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="#" class="logout-btn" onclick="logout()">🔒 Logout</a>
                
                <div class="header">
                    <h1>🔐 Native Auth Foundation</h1>
                    <p>THE foundation. Choose your board to access systems.</p>
                </div>
                
                <div class="stats">
                    <h3>📊 Foundation Status</h3>
                    <p>Active Sessions: <span id="sessions">${this.sessions.size}</span> | 
                       Boards Available: ${Object.keys(this.boards).length} | 
                       Uptime: <span id="uptime">${Math.floor(process.uptime())}s</span></p>
                </div>
                
                <div class="boards-grid">
                    ${boardsHtml}
                </div>
                
                <div class="foundation-info">
                    <h3>🏗️ Foundation Architecture</h3>
                    <p><strong>This IS the foundation.</strong> All systems connect through here:</p>
                    <ol>
                        <li>🔐 User logs in through existing login.html</li>
                        <li>🎮 Dashboard shows available boards (systems)</li>
                        <li>🎯 User selects board → authenticated redirect to system</li>
                        <li>⚡ Real-time system monitoring and health checks</li>
                    </ol>
                    <p>No external wrappers. No chainlink nonsense. Just OUR native system.</p>
                </div>
            </div>
            
            <script>
                function accessBoard(boardName) {
                    const token = localStorage.getItem('authToken');
                    if (!token) {
                        alert('Authentication required');
                        window.location.href = '/';
                        return;
                    }
                    
                    window.open('/board/' + boardName + '?token=' + token, '_blank');
                }
                
                async function logout() {
                    try {
                        await fetch('/auth/logout', { method: 'POST' });
                        localStorage.removeItem('authToken');
                        window.location.href = '/';
                    } catch (error) {
                        console.error('Logout error:', error);
                        window.location.href = '/';
                    }
                }
                
                // Auto-refresh stats
                setInterval(async () => {
                    try {
                        const response = await fetch('/api/status');
                        const data = await response.json();
                        document.getElementById('sessions').textContent = data.activeSessions;
                        document.getElementById('uptime').textContent = Math.floor(data.uptime) + 's';
                    } catch (error) {
                        console.error('Status update error:', error);
                    }
                }, 30000);
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

// Start the Native Auth Foundation
const foundation = new NativeAuthFoundation();

process.on('SIGINT', () => {
    foundation.log('🛑 Native Auth Foundation shutting down...');
    process.exit(0);
});