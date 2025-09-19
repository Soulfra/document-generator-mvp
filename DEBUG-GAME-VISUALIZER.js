#!/usr/bin/env node

/**
 * 🐛 DEBUG GAME VISUALIZER
 * Turn debugging into a game where players watch web traffic and solve bugs
 * OCR chain verification + reverse lookup + interactive debugging
 */

const express = require('express');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class DebugGameVisualizer {
    constructor(port = 8500) {
        this.port = port;
        this.wsPort = port + 1;
        
        // Game state
        this.gameState = {
            bugs: new Map(),           // Active bugs to solve
            players: new Map(),        // Connected players
            webTraffic: [],           // Live web traffic
            ocrChain: [],             // OCR verification chain
            debugSession: null,       // Current debug session
            leaderboard: new Map()     // Player scores
        };
        
        // Bug types and rewards
        this.bugTypes = {
            'memory_leak': { reward: 500, difficulty: 'medium', icon: '💧' },
            'infinite_loop': { reward: 1000, difficulty: 'hard', icon: '🔄' },
            'null_pointer': { reward: 300, difficulty: 'easy', icon: '❌' },
            'race_condition': { reward: 800, difficulty: 'hard', icon: '🏃' },
            'buffer_overflow': { reward: 1200, difficulty: 'expert', icon: '🌊' },
            'css_broken': { reward: 200, difficulty: 'easy', icon: '🎨' },
            'api_timeout': { reward: 400, difficulty: 'medium', icon: '⏰' }
        };
        
        this.setupDatabase();
        this.setupServer();
        this.startTrafficMonitoring();
        this.startBugSpawner();
    }
    
    setupDatabase() {
        this.db = new sqlite3.Database('debug_game.db');
        
        this.db.serialize(() => {
            // Debug sessions
            this.db.run(`
                CREATE TABLE IF NOT EXISTS debug_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    player_id TEXT,
                    bug_type TEXT,
                    difficulty TEXT,
                    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                    end_time DATETIME,
                    solved BOOLEAN DEFAULT 0,
                    solution_code TEXT,
                    reward INTEGER DEFAULT 0
                )
            `);
            
            // OCR verification chain
            this.db.run(`
                CREATE TABLE IF NOT EXISTS ocr_chain (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    image_hash TEXT,
                    ocr_text TEXT,
                    verification_status TEXT,
                    player_verified TEXT,
                    chain_hash TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Web traffic log
            this.db.run(`
                CREATE TABLE IF NOT EXISTS traffic_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    method TEXT,
                    url TEXT,
                    status_code INTEGER,
                    response_time INTEGER,
                    user_agent TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    gamified BOOLEAN DEFAULT 0
                )
            `);
            
            console.log('🐛 Debug game database initialized');
        });
    }
    
    setupServer() {
        this.app = express();
        this.app.use(express.json());
        
        // Middleware to capture all traffic for gamification
        this.app.use((req, res, next) => {
            const start = Date.now();
            
            res.on('finish', () => {
                const responseTime = Date.now() - start;
                this.logTraffic(req, res, responseTime);
            });
            
            next();
        });
        
        // WebSocket for real-time debugging game
        this.wss = new WebSocket.Server({ port: this.wsPort });
        this.wss.on('connection', (ws) => {
            const playerId = crypto.randomBytes(8).toString('hex');
            this.gameState.players.set(playerId, {
                ws,
                score: 0,
                bugsFixed: 0,
                streak: 0,
                specialization: 'generalist'
            });
            
            console.log(`🎮 Debug player joined: ${playerId}`);
            
            ws.on('message', (message) => {
                this.handleGameMessage(playerId, JSON.parse(message));
            });
            
            ws.on('close', () => {
                this.gameState.players.delete(playerId);
            });
            
            // Send welcome package
            ws.send(JSON.stringify({
                type: 'player_joined',
                playerId,
                currentBugs: Array.from(this.gameState.bugs.values()),
                leaderboard: this.getLeaderboard()
            }));
        });
        
        // Routes
        this.app.get('/', (req, res) => res.send(this.generateDebugGameInterface()));
        this.app.get('/api/bugs/active', (req, res) => res.json(Array.from(this.gameState.bugs.values())));
        this.app.post('/api/bugs/solve', this.solveBug.bind(this));
        this.app.get('/api/traffic/live', (req, res) => res.json(this.gameState.webTraffic.slice(-50)));
        this.app.post('/api/ocr/verify', this.verifyOCR.bind(this));
        this.app.get('/api/debug/session/:sessionId', (req, res) => {
            res.json({ sessionId: req.params.sessionId, status: 'active' });
        });
        
        // Debug visualization endpoints
        this.app.get('/api/visual/memory', this.getMemoryVisualization.bind(this));
        this.app.get('/api/visual/network', this.getNetworkVisualization.bind(this));
        this.app.get('/api/visual/errors', this.getErrorVisualization.bind(this));
        
        this.app.listen(this.port, () => {
            console.log(`🐛 Debug Game Visualizer running on http://localhost:${this.port}`);
            console.log(`🎮 WebSocket Game: ws://localhost:${this.wsPort}`);
            console.log(`👀 OCR Chain: Active`);
            console.log(`🔍 Traffic Monitor: Active`);
        });
    }
    
    logTraffic(req, res, responseTime) {
        const traffic = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime,
            userAgent: req.get('User-Agent') || 'Unknown',
            timestamp: Date.now()
        };
        
        // Add to live traffic
        this.gameState.webTraffic.push(traffic);
        
        // Keep only last 1000 entries
        if (this.gameState.webTraffic.length > 1000) {
            this.gameState.webTraffic.shift();
        }
        
        // Store in database
        this.db.run(
            'INSERT INTO traffic_log (method, url, status_code, response_time, user_agent) VALUES (?, ?, ?, ?, ?)',
            [traffic.method, traffic.url, traffic.statusCode, traffic.responseTime, traffic.userAgent]
        );
        
        // Gamify interesting traffic
        this.gamifyTraffic(traffic);
        
        // Broadcast to players
        this.broadcast({
            type: 'traffic_update',
            traffic
        });
    }
    
    gamifyTraffic(traffic) {
        // Turn errors into bugs
        if (traffic.statusCode >= 400) {
            this.spawnBug('api_timeout', {
                url: traffic.url,
                statusCode: traffic.statusCode,
                method: traffic.method
            });
        }
        
        // Long response times become performance bugs
        if (traffic.responseTime > 5000) {
            this.spawnBug('memory_leak', {
                url: traffic.url,
                responseTime: traffic.responseTime
            });
        }
    }
    
    spawnBug(type, context = {}) {
        const bugId = crypto.randomBytes(8).toString('hex');
        const bugInfo = this.bugTypes[type];
        
        const bug = {
            id: bugId,
            type,
            ...bugInfo,
            context,
            spawnTime: Date.now(),
            solvers: new Set(),
            attempts: 0
        };
        
        this.gameState.bugs.set(bugId, bug);
        
        // Broadcast new bug
        this.broadcast({
            type: 'bug_spawned',
            bug
        });
        
        console.log(`🐛 New bug spawned: ${type} (${bugId})`);
        
        // Auto-remove after 10 minutes if not solved
        setTimeout(() => {
            if (this.gameState.bugs.has(bugId)) {
                this.gameState.bugs.delete(bugId);
                this.broadcast({
                    type: 'bug_expired',
                    bugId
                });
            }
        }, 10 * 60 * 1000);
    }
    
    handleGameMessage(playerId, message) {
        const player = this.gameState.players.get(playerId);
        if (!player) return;
        
        switch (message.type) {
            case 'attempt_bug':
                this.attemptBugFix(playerId, message.bugId, message.solution);
                break;
                
            case 'request_hint':
                this.sendHint(playerId, message.bugId);
                break;
                
            case 'ocr_scan':
                this.processOCRScan(playerId, message.imageData);
                break;
                
            case 'reverse_lookup':
                this.performReverseLookup(playerId, message.data);
                break;
                
            case 'chain_verify':
                this.verifyChain(playerId, message.chainData);
                break;
        }
    }
    
    attemptBugFix(playerId, bugId, solution) {
        const bug = this.gameState.bugs.get(bugId);
        const player = this.gameState.players.get(playerId);
        
        if (!bug || !player) return;
        
        bug.attempts++;
        bug.solvers.add(playerId);
        
        // Simple solution validation
        const isCorrect = this.validateSolution(bug, solution);
        
        if (isCorrect) {
            // Bug solved!
            const reward = bug.reward + (bug.solvers.size === 1 ? 200 : 0); // First solver bonus
            
            player.score += reward;
            player.bugsFixed++;
            player.streak++;
            
            // Store debug session
            this.db.run(
                'INSERT INTO debug_sessions (player_id, bug_type, difficulty, solved, solution_code, reward) VALUES (?, ?, ?, ?, ?, ?)',
                [playerId, bug.type, bug.difficulty, 1, solution, reward]
            );
            
            // Remove bug
            this.gameState.bugs.delete(bugId);
            
            // Broadcast success
            this.broadcast({
                type: 'bug_solved',
                bugId,
                solvedBy: playerId,
                reward,
                solution
            });
            
            console.log(`✅ Bug ${bugId} solved by ${playerId} for ${reward} points`);
            
        } else {
            // Wrong solution
            player.ws.send(JSON.stringify({
                type: 'solution_incorrect',
                bugId,
                hint: this.getHint(bug)
            }));
        }
    }
    
    validateSolution(bug, solution) {
        // Simple validation based on bug type
        const keywords = {
            'memory_leak': ['free', 'delete', 'cleanup', 'garbage', 'collect'],
            'infinite_loop': ['break', 'condition', 'counter', 'exit', 'return'],
            'null_pointer': ['null', 'check', 'validate', 'guard', 'defensive'],
            'race_condition': ['lock', 'mutex', 'synchronize', 'atomic', 'thread'],
            'buffer_overflow': ['bounds', 'check', 'limit', 'size', 'validate'],
            'css_broken': ['style', 'css', 'class', 'selector', 'property'],
            'api_timeout': ['timeout', 'retry', 'cache', 'async', 'promise']
        };
        
        const bugKeywords = keywords[bug.type] || [];
        const solutionLower = solution.toLowerCase();
        
        return bugKeywords.some(keyword => solutionLower.includes(keyword));
    }
    
    getHint(bug) {
        const hints = {
            'memory_leak': 'Look for objects that aren\'t being cleaned up properly',
            'infinite_loop': 'Check loop conditions and exit criteria',
            'null_pointer': 'Add null checks before accessing properties',
            'race_condition': 'Consider synchronization mechanisms',
            'buffer_overflow': 'Validate input sizes and bounds',
            'css_broken': 'Check CSS syntax and selectors',
            'api_timeout': 'Implement proper timeout handling'
        };
        
        return hints[bug.type] || 'Think about the root cause';
    }
    
    processOCRScan(playerId, imageData) {
        // Simulate OCR processing
        const ocrText = this.simulateOCR(imageData);
        const imageHash = crypto.createHash('sha256').update(imageData).digest('hex');
        
        // Add to OCR chain
        const chainEntry = {
            id: crypto.randomBytes(8).toString('hex'),
            imageHash,
            ocrText,
            playerId,
            timestamp: Date.now(),
            verified: false
        };
        
        this.gameState.ocrChain.push(chainEntry);
        
        // Store in database
        this.db.run(
            'INSERT INTO ocr_chain (image_hash, ocr_text, verification_status, player_verified) VALUES (?, ?, ?, ?)',
            [imageHash, ocrText, 'pending', playerId]
        );
        
        // Reward for OCR contribution
        const player = this.gameState.players.get(playerId);
        if (player) {
            player.score += 50;
        }
        
        // Broadcast OCR result
        this.broadcast({
            type: 'ocr_processed',
            chainEntry
        });
    }
    
    simulateOCR(imageData) {
        // Simulate OCR text extraction
        const samples = [
            'Error: Cannot read property \'value\' of null',
            'TypeError: fetch is not a function',
            'ReferenceError: $ is not defined',
            'SyntaxError: Unexpected token',
            'Memory usage: 2.4GB / 4GB',
            'Response time: 3.2s',
            'Status: 500 Internal Server Error'
        ];
        
        return samples[Math.floor(Math.random() * samples.length)];
    }
    
    performReverseLookup(playerId, data) {
        // Reverse lookup web traffic patterns
        const patterns = this.analyzeTrafficPatterns(data);
        
        const player = this.gameState.players.get(playerId);
        if (player) {
            player.ws.send(JSON.stringify({
                type: 'reverse_lookup_result',
                patterns,
                score: patterns.length * 25 // Points for finding patterns
            }));
            
            player.score += patterns.length * 25;
        }
    }
    
    analyzeTrafficPatterns(data) {
        const traffic = this.gameState.webTraffic;
        const patterns = [];
        
        // Find error patterns
        const errors = traffic.filter(t => t.statusCode >= 400);
        if (errors.length > 5) {
            patterns.push({
                type: 'error_spike',
                count: errors.length,
                description: 'High error rate detected'
            });
        }
        
        // Find slow endpoints
        const slowRequests = traffic.filter(t => t.responseTime > 2000);
        if (slowRequests.length > 3) {
            patterns.push({
                type: 'performance_issue',
                count: slowRequests.length,
                description: 'Slow response times detected'
            });
        }
        
        return patterns;
    }
    
    verifyChain(playerId, chainData) {
        // Verify blockchain-style chain integrity
        const isValid = this.validateChainIntegrity(chainData);
        
        const player = this.gameState.players.get(playerId);
        if (player && isValid) {
            player.score += 100;
            player.ws.send(JSON.stringify({
                type: 'chain_verified',
                valid: true,
                reward: 100
            }));
        }
    }
    
    validateChainIntegrity(chainData) {
        // Simple chain validation
        return chainData && chainData.length > 0;
    }
    
    startTrafficMonitoring() {
        // Monitor system processes and create bugs
        setInterval(() => {
            // Simulate finding bugs in running processes
            const randomBugTypes = Object.keys(this.bugTypes);
            const bugType = randomBugTypes[Math.floor(Math.random() * randomBugTypes.length)];
            
            if (Math.random() < 0.3) { // 30% chance to spawn bug
                this.spawnBug(bugType, {
                    source: 'system_monitor',
                    pid: Math.floor(Math.random() * 10000),
                    memoryUsage: Math.floor(Math.random() * 1000) + 'MB'
                });
            }
        }, 30000); // Every 30 seconds
    }
    
    startBugSpawner() {
        // Spawn bugs based on actual system state
        setInterval(() => {
            this.checkSystemHealth();
        }, 60000); // Every minute
    }
    
    checkSystemHealth() {
        // Check actual system metrics and turn anomalies into bugs
        const processes = require('child_process');
        
        // Check memory usage
        processes.exec('ps aux | head -20', (error, stdout) => {
            if (stdout) {
                const lines = stdout.split('\n');
                lines.forEach(line => {
                    const parts = line.split(/\s+/);
                    if (parts.length > 3) {
                        const memPercent = parseFloat(parts[3]);
                        if (memPercent > 80) {
                            this.spawnBug('memory_leak', {
                                process: parts[10],
                                memoryPercent: memPercent
                            });
                        }
                    }
                });
            }
        });
    }
    
    broadcast(message) {
        const data = JSON.stringify(message);
        this.gameState.players.forEach(player => {
            if (player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(data);
            }
        });
    }
    
    getLeaderboard() {
        return Array.from(this.gameState.players.entries())
            .map(([id, player]) => ({
                id,
                score: player.score,
                bugsFixed: player.bugsFixed,
                streak: player.streak,
                specialization: player.specialization
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }
    
    solveBug(req, res) {
        const { bugId, solution, playerId } = req.body;
        this.attemptBugFix(playerId, bugId, solution);
        res.json({ success: true });
    }
    
    verifyOCR(req, res) {
        const { imageData, playerId } = req.body;
        this.processOCRScan(playerId, imageData);
        res.json({ success: true, reward: 50 });
    }
    
    getMemoryVisualization(req, res) {
        const memData = {
            usage: Math.floor(Math.random() * 100),
            leaks: Array.from(this.gameState.bugs.values()).filter(b => b.type === 'memory_leak'),
            history: Array.from({ length: 20 }, () => Math.floor(Math.random() * 100))
        };
        res.json(memData);
    }
    
    getNetworkVisualization(req, res) {
        const networkData = {
            requests: this.gameState.webTraffic.slice(-20),
            errors: this.gameState.webTraffic.filter(t => t.statusCode >= 400).slice(-10),
            latency: this.gameState.webTraffic.map(t => t.responseTime).slice(-20)
        };
        res.json(networkData);
    }
    
    getErrorVisualization(req, res) {
        const errorData = {
            activeBugs: Array.from(this.gameState.bugs.values()),
            recentFixes: [], // Would come from database
            errorRate: this.gameState.webTraffic.filter(t => t.statusCode >= 400).length / this.gameState.webTraffic.length * 100
        };
        res.json(errorData);
    }
    
    generateDebugGameInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🐛 Debug Game Visualizer</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Courier New', monospace;
            background: #0a0a0a;
            color: #00ff00;
            overflow: hidden;
        }
        
        .game-container {
            display: grid;
            grid-template-columns: 300px 1fr 250px;
            grid-template-rows: 60px 1fr;
            height: 100vh;
            gap: 2px;
        }
        
        .header {
            grid-column: 1 / -1;
            background: #111;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            border-bottom: 2px solid #00ff00;
        }
        
        .title {
            font-size: 1.5rem;
            text-shadow: 0 0 10px #00ff00;
        }
        
        .score {
            font-size: 1.2rem;
            color: #ffff00;
        }
        
        .sidebar {
            background: #111;
            padding: 15px;
            overflow-y: auto;
            border-right: 2px solid #00ff00;
        }
        
        .main-view {
            background: #000;
            position: relative;
            overflow: hidden;
        }
        
        .right-panel {
            background: #111;
            padding: 15px;
            overflow-y: auto;
            border-left: 2px solid #00ff00;
        }
        
        .section {
            margin-bottom: 20px;
        }
        
        .section-title {
            color: #ffff00;
            font-weight: bold;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #333;
        }
        
        .bug-item {
            background: #222;
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
            border-left: 4px solid #ff0000;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .bug-item:hover {
            background: #333;
            transform: translateX(5px);
        }
        
        .bug-type {
            font-weight: bold;
            color: #ff4444;
        }
        
        .bug-reward {
            color: #44ff44;
            float: right;
        }
        
        .traffic-item {
            font-size: 0.8rem;
            padding: 5px;
            margin: 2px 0;
            background: #1a1a1a;
            border-radius: 3px;
        }
        
        .error { color: #ff4444; }
        .success { color: #44ff44; }
        .warning { color: #ffaa44; }
        
        .visualization {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        
        .network-graph {
            display: grid;
            grid-template-columns: repeat(10, 1fr);
            grid-template-rows: repeat(10, 1fr);
            gap: 2px;
            padding: 20px;
            height: 100%;
        }
        
        .node {
            background: #222;
            border: 1px solid #444;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .node:hover {
            background: #444;
            transform: scale(1.1);
        }
        
        .bug-node { border-color: #ff4444; color: #ff4444; }
        .normal-node { border-color: #444; }
        .solved-node { border-color: #44ff44; color: #44ff44; }
        
        .solution-panel {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #000;
            border: 2px solid #00ff00;
            padding: 30px;
            border-radius: 10px;
            display: none;
            z-index: 1000;
            min-width: 400px;
        }
        
        .solution-input {
            width: 100%;
            background: #111;
            border: 1px solid #444;
            color: #00ff00;
            padding: 10px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
        }
        
        .btn {
            background: #333;
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: 10px 20px;
            cursor: pointer;
            margin: 5px;
            font-family: 'Courier New', monospace;
        }
        
        .btn:hover {
            background: #00ff00;
            color: #000;
        }
        
        .ocr-area {
            border: 2px dashed #444;
            padding: 20px;
            text-align: center;
            margin: 10px 0;
            cursor: pointer;
        }
        
        .ocr-area:hover {
            border-color: #00ff00;
        }
        
        .chain-visualization {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .chain-block {
            background: #222;
            padding: 10px;
            border-left: 3px solid #00ff00;
            font-size: 0.8rem;
        }
        
        .stats {
            display: flex;
            gap: 20px;
            font-size: 0.9rem;
        }
        
        .stat-item {
            color: #aaa;
        }
        
        .stat-value {
            color: #00ff00;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="game-container">
        <div class="header">
            <div class="title">🐛 DEBUG GAME VISUALIZER</div>
            <div class="stats">
                <div class="stat-item">Score: <span class="stat-value" id="playerScore">0</span></div>
                <div class="stat-item">Bugs Fixed: <span class="stat-value" id="bugsFixed">0</span></div>
                <div class="stat-item">Streak: <span class="stat-value" id="streak">0</span></div>
            </div>
        </div>
        
        <div class="sidebar">
            <div class="section">
                <div class="section-title">🐛 ACTIVE BUGS</div>
                <div id="bugList"></div>
            </div>
            
            <div class="section">
                <div class="section-title">👁️ OCR SCAN</div>
                <div class="ocr-area" onclick="triggerOCR()">
                    📷 Drop image or click to scan
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">🔗 VERIFICATION CHAIN</div>
                <div class="chain-visualization" id="chainViz"></div>
            </div>
        </div>
        
        <div class="main-view">
            <div class="visualization">
                <div class="network-graph" id="networkGraph"></div>
            </div>
        </div>
        
        <div class="right-panel">
            <div class="section">
                <div class="section-title">🌐 LIVE TRAFFIC</div>
                <div id="trafficLog"></div>
            </div>
            
            <div class="section">
                <div class="section-title">🏆 LEADERBOARD</div>
                <div id="leaderboard"></div>
            </div>
            
            <div class="section">
                <div class="section-title">🔍 REVERSE LOOKUP</div>
                <button class="btn" onclick="performReverseLookup()">Analyze Patterns</button>
            </div>
        </div>
    </div>
    
    <div class="solution-panel" id="solutionPanel">
        <h3 id="bugTitle">Fix this bug:</h3>
        <p id="bugDescription"></p>
        <textarea class="solution-input" id="solutionInput" placeholder="Enter your solution..."></textarea>
        <div>
            <button class="btn" onclick="submitSolution()">Submit Fix</button>
            <button class="btn" onclick="requestHint()">Get Hint</button>
            <button class="btn" onclick="closeSolutionPanel()">Cancel</button>
        </div>
    </div>
    
    <script>
        let ws = null;
        let playerId = null;
        let currentBug = null;
        let gameState = {
            score: 0,
            bugsFixed: 0,
            streak: 0
        };
        
        // Connect to debug game
        function connect() {
            ws = new WebSocket('ws://localhost:8501');
            
            ws.onopen = () => {
                console.log('Connected to debug game');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleGameMessage(data);
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            ws.onclose = () => {
                console.log('Disconnected, reconnecting...');
                setTimeout(connect, 3000);
            };
        }
        
        function handleGameMessage(data) {
            switch (data.type) {
                case 'player_joined':
                    playerId = data.playerId;
                    updateBugList(data.currentBugs);
                    updateLeaderboard(data.leaderboard);
                    break;
                    
                case 'bug_spawned':
                    addBugToList(data.bug);
                    updateNetworkGraph();
                    break;
                    
                case 'bug_solved':
                    removeBugFromList(data.bugId);
                    if (data.solvedBy === playerId) {
                        gameState.score += data.reward;
                        gameState.bugsFixed++;
                        gameState.streak++;
                        updatePlayerStats();
                    }
                    break;
                    
                case 'traffic_update':
                    addTrafficEntry(data.traffic);
                    break;
                    
                case 'ocr_processed':
                    addChainEntry(data.chainEntry);
                    break;
                    
                case 'solution_incorrect':
                    alert('Solution incorrect! Hint: ' + data.hint);
                    break;
            }
        }
        
        function updateBugList(bugs) {
            const bugList = document.getElementById('bugList');
            bugList.innerHTML = '';
            
            bugs.forEach(bug => addBugToList(bug));
        }
        
        function addBugToList(bug) {
            const bugList = document.getElementById('bugList');
            const bugDiv = document.createElement('div');
            bugDiv.className = 'bug-item';
            bugDiv.onclick = () => selectBug(bug);
            
            bugDiv.innerHTML = '<div class="bug-type">' + bug.icon + ' ' + bug.type.replace(/_/g, ' ').toUpperCase() + '</div><div class="bug-reward">+' + bug.reward + '</div><div style="font-size: 0.8rem; color: #aaa;">' + bug.difficulty + '</div>';
            
            bugList.appendChild(bugDiv);
        }
        
        function removeBugFromList(bugId) {
            // Remove bug from UI
            updateNetworkGraph();
        }
        
        function selectBug(bug) {
            currentBug = bug;
            document.getElementById('bugTitle').textContent = 'Fix: ' + bug.type.replace(/_/g, ' ');
            document.getElementById('bugDescription').textContent = 'Difficulty: ' + bug.difficulty + ' | Reward: ' + bug.reward + ' tokens';
            document.getElementById('solutionPanel').style.display = 'block';
        }
        
        function submitSolution() {
            const solution = document.getElementById('solutionInput').value;
            if (solution && currentBug && ws) {
                ws.send(JSON.stringify({
                    type: 'attempt_bug',
                    bugId: currentBug.id,
                    solution: solution
                }));
                closeSolutionPanel();
            }
        }
        
        function requestHint() {
            if (currentBug && ws) {
                ws.send(JSON.stringify({
                    type: 'request_hint',
                    bugId: currentBug.id
                }));
            }
        }
        
        function closeSolutionPanel() {
            document.getElementById('solutionPanel').style.display = 'none';
            document.getElementById('solutionInput').value = '';
            currentBug = null;
        }
        
        function addTrafficEntry(traffic) {
            const trafficLog = document.getElementById('trafficLog');
            const entry = document.createElement('div');
            entry.className = 'traffic-item';
            
            let className = 'success';
            if (traffic.statusCode >= 400) className = 'error';
            else if (traffic.responseTime > 2000) className = 'warning';
            
            entry.innerHTML = '<span class="' + className + '">' + traffic.method + ' ' + traffic.url + ' (' + traffic.statusCode + ')</span>';
            
            trafficLog.insertBefore(entry, trafficLog.firstChild);
            
            // Keep only last 20 entries
            while (trafficLog.children.length > 20) {
                trafficLog.removeChild(trafficLog.lastChild);
            }
        }
        
        function triggerOCR() {
            // Simulate OCR scan
            const simulatedImageData = 'simulated_screenshot_' + Date.now();
            
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'ocr_scan',
                    imageData: simulatedImageData
                }));
            }
        }
        
        function addChainEntry(entry) {
            const chainViz = document.getElementById('chainViz');
            const block = document.createElement('div');
            block.className = 'chain-block';
            block.innerHTML = '<div>🔗 ' + entry.id.slice(0, 8) + '</div><div style="font-size: 0.7rem;">' + entry.ocrText.slice(0, 30) + '...</div>';
            
            chainViz.insertBefore(block, chainViz.firstChild);
            
            // Keep only last 5 entries
            while (chainViz.children.length > 5) {
                chainViz.removeChild(chainViz.lastChild);
            }
        }
        
        function performReverseLookup() {
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'reverse_lookup',
                    data: { timestamp: Date.now() }
                }));
            }
        }
        
        function updateNetworkGraph() {
            const graph = document.getElementById('networkGraph');
            graph.innerHTML = '';
            
            // Create 100 nodes (10x10 grid)
            for (let i = 0; i < 100; i++) {
                const node = document.createElement('div');
                node.className = 'node normal-node';
                
                // Randomly assign node types
                const rand = Math.random();
                if (rand < 0.1) {
                    node.className = 'node bug-node';
                    node.textContent = '🐛';
                } else if (rand < 0.2) {
                    node.className = 'node solved-node';
                    node.textContent = '✅';
                } else {
                    node.textContent = '⚪';
                }
                
                graph.appendChild(node);
            }
        }
        
        function updatePlayerStats() {
            document.getElementById('playerScore').textContent = gameState.score;
            document.getElementById('bugsFixed').textContent = gameState.bugsFixed;
            document.getElementById('streak').textContent = gameState.streak;
        }
        
        function updateLeaderboard(leaderboard) {
            const board = document.getElementById('leaderboard');
            board.innerHTML = '';
            
            leaderboard.forEach((player, index) => {
                const entry = document.createElement('div');
                entry.innerHTML = (index + 1) + '. Player ' + player.id.slice(0, 6) + ' (' + player.score + ')';
                entry.style.color = index < 3 ? '#ffff00' : '#aaa';
                board.appendChild(entry);
            });
        }
        
        // Initialize
        connect();
        updateNetworkGraph();
        
        // Auto-refresh network graph
        setInterval(updateNetworkGraph, 5000);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeSolutionPanel();
            }
        });
    </script>
</body>
</html>`;
    }
}

// Start the debug game visualizer
if (require.main === module) {
    new DebugGameVisualizer(8500);
}

module.exports = DebugGameVisualizer;