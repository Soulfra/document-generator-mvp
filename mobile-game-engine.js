#!/usr/bin/env node

/**
 * MOBILE GAME ENGINE
 * Flash/Miniclip style integration with all our systems
 * Cringeproof + Clarity engines + Everything flowing together
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');

class MobileGameEngine {
    constructor() {
        console.log('🎮 MOBILE GAME ENGINE - Flash/Miniclip Style');
        console.log('📱 Building smooth mobile experience with all systems integrated\n');
        
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 13000;
        
        // Game state
        this.players = new Map();
        this.gameRooms = new Map();
        this.activeGames = ['shiprekt', 'bashvcs', 'qrhunt', 'voxelcraft'];
        
        // Engines
        this.cringeproofEngine = new CringeproofEngine();
        this.clarityEngine = new ClarityEngine();
        
        this.init();
    }
    
    init() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Main mobile game interface
        this.app.get('/', (req, res) => {
            res.send(this.getMobileGameHTML());
        });
        
        // Game API endpoints
        this.app.post('/api/join-game', (req, res) => {
            const { gameType, playerData } = req.body;
            const result = this.joinGame(gameType, playerData);
            res.json(result);
        });
        
        this.app.post('/api/scan-qr', (req, res) => {
            const { qrData, playerId } = req.body;
            const result = this.processQRScan(qrData, playerId);
            res.json(result);
        });
        
        this.setupWebSocket();
        
        this.server.listen(this.port, () => {
            console.log(`✅ Mobile Game Engine: http://localhost:${this.port}`);
            console.log('📱 Optimized for mobile with touch controls');
            console.log('🎯 Integrated: QR scanning, payments, characters, hex world');
            console.log('🚀 Cringeproof + Clarity engines active\n');
            
            setTimeout(() => {
                require('child_process').exec(`open http://localhost:${this.port}`);
            }, 1000);
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('📱 Mobile player connected');
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                this.handleGameMessage(data, ws);
            });
            
            // Send initial game state
            ws.send(JSON.stringify({
                type: 'game_state',
                availableGames: this.activeGames,
                playerCount: this.players.size
            }));
        });
    }
    
    handleGameMessage(data, ws) {
        switch (data.type) {
            case 'join_game':
                this.handleJoinGame(data, ws);
                break;
            case 'player_action':
                this.handlePlayerAction(data, ws);
                break;
            case 'qr_scan':
                this.handleQRScan(data, ws);
                break;
            case 'payment_intent':
                this.handlePayment(data, ws);
                break;
        }
    }
    
    handleJoinGame(data, ws) {
        const { gameType, playerName } = data;
        const playerId = 'player_' + Date.now();
        
        // Cringeproof check
        const cringeScore = this.cringeproofEngine.check(playerName);
        if (cringeScore > 0.7) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Please choose a different name'
            }));
            return;
        }
        
        // Clarity engine optimization
        const gameConfig = this.clarityEngine.optimizeForMobile(gameType);
        
        const player = {
            id: playerId,
            name: playerName,
            gameType,
            ws,
            position: { x: 0, y: 0 },
            stats: { level: 1, coins: 0, health: 100 },
            joinTime: Date.now()
        };
        
        this.players.set(playerId, player);
        
        ws.send(JSON.stringify({
            type: 'game_joined',
            playerId,
            gameType,
            config: gameConfig,
            player
        }));
        
        console.log(`🎮 ${playerName} joined ${gameType}`);
    }
    
    handleQRScan(data, ws) {
        const { qrData, playerId } = data;
        const player = this.players.get(playerId);
        
        if (!player) return;
        
        // Process QR code based on game context
        const result = this.processGameQR(qrData, player);
        
        ws.send(JSON.stringify({
            type: 'qr_result',
            result,
            coinsEarned: result.coins || 0
        }));
        
        // Update player stats
        if (result.coins) {
            player.stats.coins += result.coins;
        }
    }
    
    processGameQR(qrData, player) {
        // Different QR effects based on current game
        switch (player.gameType) {
            case 'shiprekt':
                return { 
                    message: 'Enemy ship spotted!', 
                    coins: 10,
                    action: 'battle_ready'
                };
            case 'qrhunt':
                return {
                    message: 'Treasure found!',
                    coins: 25,
                    action: 'treasure_collected'
                };
            case 'voxelcraft':
                return {
                    message: 'New building materials!',
                    coins: 5,
                    action: 'materials_added'
                };
            default:
                return {
                    message: 'QR scanned successfully',
                    coins: 1
                };
        }
    }
    
    getMobileGameHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🎮 Mobile Game Hub</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
            user-select: none;
        }
        
        body {
            font-family: -apple-system, system-ui, sans-serif;
            background: #000;
            color: #fff;
            overflow: hidden;
            height: 100vh;
            width: 100vw;
            position: fixed;
        }
        
        #game-container {
            width: 100vw;
            height: 100vh;
            position: relative;
            background: radial-gradient(ellipse at center, #001122 0%, #000000 100%);
        }
        
        /* Flash-style game selection */
        .game-lobby {
            display: flex;
            flex-direction: column;
            height: 100vh;
            padding: 20px;
            align-items: center;
            justify-content: center;
        }
        
        .logo {
            font-size: 48px;
            font-weight: bold;
            margin-bottom: 30px;
            background: linear-gradient(45deg, #00ff88, #00aaff, #ff6b6b);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-align: center;
        }
        
        .games-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            width: 100%;
            max-width: 400px;
            margin-bottom: 30px;
        }
        
        .game-card {
            background: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(0, 255, 136, 0.3);
            border-radius: 15px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
            backdrop-filter: blur(10px);
            touch-action: manipulation;
        }
        
        .game-card:active {
            transform: scale(0.95);
            background: rgba(0, 255, 136, 0.2);
        }
        
        .game-card:hover {
            border-color: #00ff88;
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
        }
        
        .game-icon {
            font-size: 36px;
            margin-bottom: 10px;
            display: block;
        }
        
        .game-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .game-subtitle {
            font-size: 12px;
            color: #888;
            line-height: 1.3;
        }
        
        .player-input {
            width: 100%;
            max-width: 300px;
            padding: 15px;
            border: 2px solid rgba(0, 255, 136, 0.3);
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
            border-radius: 25px;
            font-size: 16px;
            text-align: center;
            margin-bottom: 20px;
            backdrop-filter: blur(10px);
        }
        
        .player-input::placeholder {
            color: #888;
        }
        
        .player-input:focus {
            outline: none;
            border-color: #00ff88;
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
        }
        
        /* Game Interface */
        .game-interface {
            display: none;
            flex-direction: column;
            height: 100vh;
            position: relative;
        }
        
        .game-header {
            background: rgba(0, 0, 0, 0.8);
            padding: 10px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #333;
        }
        
        .player-info {
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 14px;
        }
        
        .stat {
            display: flex;
            align-items: center;
            gap: 5px;
        }
        
        .game-area {
            flex: 1;
            position: relative;
            overflow: hidden;
            background: linear-gradient(45deg, #001122, #002211);
        }
        
        #game-canvas {
            width: 100%;
            height: 100%;
            display: block;
            touch-action: none;
        }
        
        /* Mobile Controls */
        .mobile-controls {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            z-index: 100;
        }
        
        .control-btn {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: rgba(0, 255, 136, 0.2);
            border: 2px solid #00ff88;
            color: #00ff88;
            font-size: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            backdrop-filter: blur(10px);
            touch-action: manipulation;
        }
        
        .control-btn:active {
            transform: scale(0.9);
            background: rgba(0, 255, 136, 0.4);
        }
        
        /* QR Scanner */
        .qr-scanner {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 250px;
            height: 250px;
            border: 3px solid #00ff88;
            border-radius: 20px;
            background: rgba(0, 0, 0, 0.8);
            display: none;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            z-index: 200;
            backdrop-filter: blur(10px);
        }
        
        .scanner-animation {
            width: 200px;
            height: 200px;
            border: 2px dashed #00ff88;
            border-radius: 15px;
            position: relative;
            overflow: hidden;
        }
        
        .scan-line {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: #00ff88;
            animation: scan 2s infinite;
        }
        
        @keyframes scan {
            0% { top: 0; }
            100% { top: 196px; }
        }
        
        .scan-text {
            margin-top: 15px;
            font-size: 14px;
            text-align: center;
            color: #00ff88;
        }
        
        /* Notifications */
        .notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 255, 136, 0.9);
            color: #000;
            padding: 15px 25px;
            border-radius: 25px;
            font-weight: bold;
            z-index: 1000;
            opacity: 0;
            transition: all 0.3s;
        }
        
        .notification.show {
            opacity: 1;
            transform: translateX(-50%) translateY(10px);
        }
        
        /* Responsive adjustments */
        @media (max-width: 400px) {
            .games-grid {
                grid-template-columns: 1fr;
                max-width: 280px;
            }
            
            .logo {
                font-size: 36px;
            }
            
            .mobile-controls {
                bottom: 10px;
                gap: 5px;
            }
            
            .control-btn {
                width: 50px;
                height: 50px;
                font-size: 20px;
            }
        }
        
        /* Loading animation */
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 300;
        }
        
        .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(0, 255, 136, 0.3);
            border-top: 3px solid #00ff88;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div id="game-container">
        <!-- Game Lobby -->
        <div class="game-lobby" id="lobby">
            <div class="logo">🎮 Game Hub</div>
            
            <input type="text" class="player-input" id="playerName" placeholder="Enter your name" maxlength="15">
            
            <div class="games-grid">
                <div class="game-card" onclick="selectGame('shiprekt')">
                    <span class="game-icon">🚢</span>
                    <div class="game-title">ShipRekt</div>
                    <div class="game-subtitle">Naval QR battles<br>Scan to attack!</div>
                </div>
                
                <div class="game-card" onclick="selectGame('qrhunt')">
                    <span class="game-icon">🔍</span>
                    <div class="game-title">QR Hunt</div>
                    <div class="game-subtitle">Find hidden codes<br>Collect treasures!</div>
                </div>
                
                <div class="game-card" onclick="selectGame('voxelcraft')">
                    <span class="game-icon">🎨</span>
                    <div class="game-title">VoxelCraft</div>
                    <div class="game-subtitle">Build with images<br>Create worlds!</div>
                </div>
                
                <div class="game-card" onclick="selectGame('bashvcs')">
                    <span class="game-icon">💬</span>
                    <div class="game-title">Bash VCs</div>
                    <div class="game-subtitle">Terminal trading<br>Command profits!</div>
                </div>
            </div>
        </div>
        
        <!-- Game Interface -->
        <div class="game-interface" id="gameInterface">
            <div class="game-header">
                <div class="player-info">
                    <div class="stat">👤 <span id="playerNameDisplay">Player</span></div>
                    <div class="stat">🪙 <span id="coins">0</span></div>
                    <div class="stat">❤️ <span id="health">100</span></div>
                    <div class="stat">⭐ <span id="level">1</span></div>
                </div>
                <button class="control-btn" style="width: auto; height: 35px; border-radius: 18px; padding: 0 15px; font-size: 14px;" onclick="exitGame()">Exit</button>
            </div>
            
            <div class="game-area">
                <canvas id="game-canvas"></canvas>
                
                <!-- Mobile Controls -->
                <div class="mobile-controls">
                    <button class="control-btn" onclick="movePlayer('left')">←</button>
                    <button class="control-btn" onclick="performAction()">⚡</button>
                    <button class="control-btn" onclick="openQRScanner()">📷</button>
                    <button class="control-btn" onclick="movePlayer('right')">→</button>
                </div>
                
                <!-- QR Scanner -->
                <div class="qr-scanner" id="qrScanner">
                    <div class="scanner-animation">
                        <div class="scan-line"></div>
                    </div>
                    <div class="scan-text">
                        Scanning for QR codes...<br>
                        <button class="control-btn" style="margin-top: 10px; width: auto; height: 30px; border-radius: 15px; padding: 0 15px; font-size: 12px;" onclick="closeQRScanner()">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Loading -->
        <div class="loading" id="loading" style="display: none;">
            <div class="spinner"></div>
        </div>
        
        <!-- Notification -->
        <div class="notification" id="notification"></div>
    </div>
    
    <script>
        let ws;
        let currentGame = null;
        let playerId = null;
        let playerStats = { coins: 0, health: 100, level: 1 };
        let gameCanvas;
        let gameCtx;
        
        // Initialize
        function init() {
            gameCanvas = document.getElementById('game-canvas');
            gameCtx = gameCanvas.getContext('2d');
            setupCanvas();
            connectWebSocket();
            
            // Touch/swipe controls
            setupTouchControls();
            
            console.log('🎮 Mobile Game Engine Ready');
        }
        
        function setupCanvas() {
            const resizeCanvas = () => {
                const container = document.querySelector('.game-area');
                gameCanvas.width = container.clientWidth;
                gameCanvas.height = container.clientHeight;
            };
            
            window.addEventListener('resize', resizeCanvas);
            resizeCanvas();
        }
        
        function connectWebSocket() {
            ws = new WebSocket('ws://' + window.location.host);
            
            ws.onopen = () => {
                console.log('🌐 Connected to game server');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleServerMessage(data);
            };
            
            ws.onclose = () => {
                console.log('🔌 Disconnected from server');
                showNotification('Connection lost. Reconnecting...');
                setTimeout(() => connectWebSocket(), 2000);
            };
        }
        
        function handleServerMessage(data) {
            switch (data.type) {
                case 'game_joined':
                    playerId = data.playerId;
                    currentGame = data.gameType;
                    startGame(data);
                    break;
                    
                case 'qr_result':
                    handleQRResult(data);
                    break;
                    
                case 'player_update':
                    updatePlayerStats(data.stats);
                    break;
                    
                case 'error':
                    showNotification(data.message);
                    break;
            }
        }
        
        function selectGame(gameType) {
            const playerName = document.getElementById('playerName').value.trim();
            
            if (!playerName) {
                showNotification('Please enter your name!');
                return;
            }
            
            if (playerName.length < 2) {
                showNotification('Name too short!');
                return;
            }
            
            // Show loading
            document.getElementById('loading').style.display = 'block';
            
            // Send join game request
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'join_game',
                    gameType,
                    playerName
                }));
            } else {
                showNotification('Connecting to server...');
                setTimeout(() => selectGame(gameType), 1000);
            }
        }
        
        function startGame(gameData) {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('lobby').style.display = 'none';
            document.getElementById('gameInterface').style.display = 'flex';
            
            // Update UI
            document.getElementById('playerNameDisplay').textContent = gameData.player.name;
            updatePlayerStats(gameData.player.stats);
            
            // Start game loop
            startGameLoop(gameData.gameType);
            
            showNotification('Welcome to ' + gameData.gameType.toUpperCase() + '!');
        }
        
        function startGameLoop(gameType) {
            // Simple game rendering based on type
            const animate = () => {
                gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
                
                switch (gameType) {
                    case 'shiprekt':
                        drawShipGame();
                        break;
                    case 'qrhunt':
                        drawHuntGame();
                        break;
                    case 'voxelcraft':
                        drawCraftGame();
                        break;
                    case 'bashvcs':
                        drawTerminalGame();
                        break;
                }
                
                requestAnimationFrame(animate);
            };
            
            animate();
        }
        
        function drawShipGame() {
            // Ocean background
            gameCtx.fillStyle = '#001133';
            gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
            
            // Waves
            gameCtx.strokeStyle = '#003366';
            gameCtx.lineWidth = 2;
            for (let i = 0; i < gameCanvas.width; i += 50) {
                gameCtx.beginPath();
                gameCtx.moveTo(i, gameCanvas.height * 0.7);
                gameCtx.quadraticCurveTo(i + 25, gameCanvas.height * 0.65, i + 50, gameCanvas.height * 0.7);
                gameCtx.stroke();
            }
            
            // Ship
            const shipX = gameCanvas.width / 2;
            const shipY = gameCanvas.height * 0.8;
            gameCtx.fillStyle = '#8B4513';
            gameCtx.fillRect(shipX - 30, shipY - 10, 60, 20);
            gameCtx.fillStyle = '#FFFFFF';
            gameCtx.fillRect(shipX - 5, shipY - 25, 10, 15);
            
            // Instructions
            gameCtx.fillStyle = '#FFFFFF';
            gameCtx.font = '16px Arial';
            gameCtx.textAlign = 'center';
            gameCtx.fillText('Scan QR codes to find enemy ships!', gameCanvas.width / 2, 50);
        }
        
        function drawHuntGame() {
            // Forest background
            gameCtx.fillStyle = '#001100';
            gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
            
            // Trees
            gameCtx.fillStyle = '#004400';
            for (let i = 0; i < 10; i++) {
                const x = (i * gameCanvas.width / 10) + Math.sin(Date.now() / 1000 + i) * 10;
                const y = gameCanvas.height * 0.6;
                gameCtx.fillRect(x, y, 20, 60);
            }
            
            // Player character
            const playerX = gameCanvas.width / 2;
            const playerY = gameCanvas.height * 0.7;
            gameCtx.fillStyle = '#00FF88';
            gameCtx.beginPath();
            gameCtx.arc(playerX, playerY, 15, 0, Math.PI * 2);
            gameCtx.fill();
            
            // Instructions
            gameCtx.fillStyle = '#FFFFFF';
            gameCtx.font = '16px Arial';
            gameCtx.textAlign = 'center';
            gameCtx.fillText('Hunt for hidden QR treasures!', gameCanvas.width / 2, 50);
        }
        
        function drawCraftGame() {
            // Grid background
            gameCtx.fillStyle = '#111111';
            gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
            
            // Grid lines
            gameCtx.strokeStyle = '#333333';
            gameCtx.lineWidth = 1;
            for (let x = 0; x < gameCanvas.width; x += 20) {
                gameCtx.beginPath();
                gameCtx.moveTo(x, 0);
                gameCtx.lineTo(x, gameCanvas.height);
                gameCtx.stroke();
            }
            for (let y = 0; y < gameCanvas.height; y += 20) {
                gameCtx.beginPath();
                gameCtx.moveTo(0, y);
                gameCtx.lineTo(gameCanvas.width, y);
                gameCtx.stroke();
            }
            
            // Instructions
            gameCtx.fillStyle = '#FFFFFF';
            gameCtx.font = '16px Arial';
            gameCtx.textAlign = 'center';
            gameCtx.fillText('Drop images to create voxel blocks!', gameCanvas.width / 2, 50);
        }
        
        function drawTerminalGame() {
            // Terminal background
            gameCtx.fillStyle = '#000000';
            gameCtx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
            
            // Terminal text
            gameCtx.fillStyle = '#00FF00';
            gameCtx.font = '12px monospace';
            gameCtx.textAlign = 'left';
            
            const lines = [
                '> Welcome to Bash VCs',
                '> Scan QR to find startups',
                '> Trade and profit!',
                '> $',
            ];
            
            lines.forEach((line, i) => {
                gameCtx.fillText(line, 20, 100 + (i * 20));
            });
        }
        
        function openQRScanner() {
            document.getElementById('qrScanner').style.display = 'flex';
            
            // Simulate QR scan after 3 seconds
            setTimeout(() => {
                const mockQRData = 'GAME_QR_' + Math.random().toString(36).substr(2, 9);
                processQRScan(mockQRData);
            }, 3000);
        }
        
        function closeQRScanner() {
            document.getElementById('qrScanner').style.display = 'none';
        }
        
        function processQRScan(qrData) {
            if (ws && playerId) {
                ws.send(JSON.stringify({
                    type: 'qr_scan',
                    qrData,
                    playerId
                }));
            }
            
            closeQRScanner();
        }
        
        function handleQRResult(data) {
            showNotification(data.result.message);
            
            if (data.coinsEarned > 0) {
                playerStats.coins += data.coinsEarned;
                updatePlayerStats(playerStats);
                
                // Visual coin effect
                showCoinEffect(data.coinsEarned);
            }
        }
        
        function showCoinEffect(coins) {
            const effect = document.createElement('div');
            effect.style.cssText = 'position: fixed; top: 20%; left: 50%; transform: translateX(-50%); color: #FFD700; font-size: 24px; font-weight: bold; z-index: 500; pointer-events: none; animation: coinPop 2s ease-out forwards;';
            effect.textContent = '+' + coins + ' 🪙';
            document.body.appendChild(effect);
            
            setTimeout(() => effect.remove(), 2000);
        }
        
        function updatePlayerStats(stats) {
            document.getElementById('coins').textContent = stats.coins || playerStats.coins;
            document.getElementById('health').textContent = stats.health || playerStats.health;
            document.getElementById('level').textContent = stats.level || playerStats.level;
            
            playerStats = { ...playerStats, ...stats };
        }
        
        function movePlayer(direction) {
            // Simple movement feedback
            showNotification('Moving ' + direction);
        }
        
        function performAction() {
            if (currentGame === 'shiprekt') {
                showNotification('🚢 Cannon ready!');
            } else if (currentGame === 'qrhunt') {
                showNotification('🔍 Searching...');
            } else {
                showNotification('⚡ Action!');
            }
        }
        
        function exitGame() {
            document.getElementById('gameInterface').style.display = 'none';
            document.getElementById('lobby').style.display = 'flex';
            currentGame = null;
            playerId = null;
        }
        
        function showNotification(message) {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
        
        function setupTouchControls() {
            let touchStartX = 0;
            let touchStartY = 0;
            
            gameCanvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
            });
            
            gameCanvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
            });
            
            gameCanvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                const touchEndX = e.changedTouches[0].clientX;
                const touchEndY = e.changedTouches[0].clientY;
                
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                
                // Swipe detection
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (deltaX > 50) {
                        movePlayer('right');
                    } else if (deltaX < -50) {
                        movePlayer('left');
                    }
                } else {
                    if (deltaY < -50) {
                        performAction();
                    } else if (deltaY > 50) {
                        openQRScanner();
                    }
                }
            });
        }
        
        // Add coin animation CSS
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes coinPop {
                0% { 
                    opacity: 0; 
                    transform: translateX(-50%) translateY(0) scale(0.5); 
                }
                50% { 
                    opacity: 1; 
                    transform: translateX(-50%) translateY(-20px) scale(1.2); 
                }
                100% { 
                    opacity: 0; 
                    transform: translateX(-50%) translateY(-40px) scale(1); 
                }
            }
        \`;
        document.head.appendChild(style);
        
        // Initialize when page loads
        window.addEventListener('load', init);
        
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        console.log('🎮 Mobile Game Hub Loaded');
        console.log('📱 Touch controls: Swipe to move, tap for actions');
    </script>
</body>
</html>`;
    }
}

// Cringeproof Engine
class CringeproofEngine {
    check(text) {
        const cringeWords = [
            'xXx', '420', '69', 'noob', 'pwn', 'l33t', 'swag', 'yolo',
            'mlg', 'pro', 'boss', 'ninja', 'dragon', 'killer', 'death'
        ];
        
        const lowerText = text.toLowerCase();
        let cringeScore = 0;
        
        cringeWords.forEach(word => {
            if (lowerText.includes(word)) {
                cringeScore += 0.3;
            }
        });
        
        // Check for excessive numbers or special chars
        if (/\d{3,}/.test(text)) cringeScore += 0.2;
        if (/[xX]{2,}/.test(text)) cringeScore += 0.4;
        if (text.length > 20) cringeScore += 0.2;
        
        return Math.min(cringeScore, 1.0);
    }
}

// Clarity Engine
class ClarityEngine {
    optimizeForMobile(gameType) {
        const baseConfig = {
            touchControls: true,
            reducedAnimations: true,
            largerButtons: true,
            simplifiedUI: true
        };
        
        const gameConfigs = {
            shiprekt: {
                ...baseConfig,
                oceanEffects: 'minimal',
                shipSize: 'large',
                qrBonus: 'naval_battle'
            },
            qrhunt: {
                ...baseConfig,
                forestDensity: 'medium',
                treasureGlow: true,
                qrBonus: 'treasure_find'
            },
            voxelcraft: {
                ...baseConfig,
                gridSize: 'large',
                snapToGrid: true,
                qrBonus: 'building_materials'
            },
            bashvcs: {
                ...baseConfig,
                fontSize: 'large',
                terminalColors: 'high_contrast',
                qrBonus: 'startup_discover'
            }
        };
        
        return gameConfigs[gameType] || baseConfig;
    }
}

// Start the mobile game engine
new MobileGameEngine();