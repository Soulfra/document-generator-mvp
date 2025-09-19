#!/usr/bin/env node

/**
 * SIMPLE MOBILE GAME
 * One game that actually works properly
 */

const express = require('express');
const http = require('http');

class SimpleMobileGame {
    constructor() {
        console.log('📱 SIMPLE MOBILE GAME - Making it work!');
        
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = 14000;
        
        this.players = new Map();
        this.gameState = {
            totalPlayers: 0,
            coinsCollected: 0
        };
        
        this.init();
    }
    
    init() {
        this.app.use(express.json());
        
        // Main game
        this.app.get('/', (req, res) => {
            res.send(this.getGameHTML());
        });
        
        // API endpoints
        this.app.post('/api/join', (req, res) => {
            const { playerName } = req.body;
            const playerId = 'player_' + Date.now();
            
            this.players.set(playerId, {
                id: playerId,
                name: playerName,
                coins: 0,
                level: 1,
                joinTime: Date.now()
            });
            
            this.gameState.totalPlayers = this.players.size;
            
            res.json({
                success: true,
                playerId,
                player: this.players.get(playerId)
            });
        });
        
        this.app.post('/api/scan-qr', (req, res) => {
            const { playerId, qrData } = req.body;
            const player = this.players.get(playerId);
            
            if (!player) {
                return res.json({ success: false, message: 'Player not found' });
            }
            
            // Give coins for QR scan
            const coinsEarned = Math.floor(Math.random() * 20) + 5;
            player.coins += coinsEarned;
            this.gameState.coinsCollected += coinsEarned;
            
            // Level up logic
            if (player.coins >= player.level * 100) {
                player.level++;
            }
            
            res.json({
                success: true,
                coinsEarned,
                player,
                gameState: this.gameState
            });
        });
        
        this.app.get('/api/stats', (req, res) => {
            res.json({
                gameState: this.gameState,
                playerCount: this.players.size
            });
        });
        
        this.server.listen(this.port, () => {
            console.log(`✅ Simple Mobile Game: http://localhost:${this.port}`);
            console.log('📱 Touch-friendly QR treasure hunt');
            console.log('🎯 Scan QR codes to collect coins and level up\n');
            
            setTimeout(() => {
                require('child_process').exec(`open http://localhost:${this.port}`);
            }, 1000);
        });
    }
    
    getGameHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>📱 QR Treasure Hunt</title>
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <style>
        * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }
        
        body {
            font-family: -apple-system, system-ui, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            height: 100vh;
            overflow: hidden;
        }
        
        .game-container {
            height: 100vh;
            display: flex;
            flex-direction: column;
            position: relative;
        }
        
        /* Start Screen */
        .start-screen {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .game-title {
            font-size: 48px;
            margin-bottom: 20px;
            text-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .game-subtitle {
            font-size: 18px;
            margin-bottom: 40px;
            text-align: center;
            opacity: 0.9;
        }
        
        .name-input {
            width: 100%;
            max-width: 300px;
            padding: 15px 20px;
            font-size: 18px;
            border: none;
            border-radius: 25px;
            background: rgba(255,255,255,0.2);
            color: #fff;
            text-align: center;
            margin-bottom: 30px;
            backdrop-filter: blur(10px);
        }
        
        .name-input::placeholder {
            color: rgba(255,255,255,0.7);
        }
        
        .start-btn {
            padding: 15px 40px;
            font-size: 20px;
            font-weight: bold;
            border: none;
            border-radius: 25px;
            background: linear-gradient(45deg, #ff6b6b, #ffd93d);
            color: #fff;
            cursor: pointer;
            transition: transform 0.2s;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }
        
        .start-btn:active {
            transform: scale(0.98);
        }
        
        /* Game Screen */
        .game-screen {
            display: none;
            flex: 1;
            flex-direction: column;
        }
        
        .game-header {
            background: rgba(0,0,0,0.2);
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            backdrop-filter: blur(10px);
        }
        
        .player-info {
            display: flex;
            align-items: center;
            gap: 20px;
        }
        
        .stat {
            display: flex;
            align-items: center;
            gap: 5px;
            font-weight: bold;
        }
        
        .game-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
        }
        
        .treasure-map {
            width: 100%;
            max-width: 400px;
            height: 300px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            margin-bottom: 30px;
            position: relative;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255,255,255,0.2);
        }
        
        .treasure-spot {
            position: absolute;
            width: 40px;
            height: 40px;
            background: radial-gradient(circle, #ffd93d, #ff6b6b);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            animation: pulse 2s infinite;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(255, 215, 61, 0.4);
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        .scan-btn {
            width: 120px;
            height: 120px;
            border-radius: 50%;
            background: linear-gradient(45deg, #4ecdc4, #44a08d);
            border: none;
            color: #fff;
            font-size: 48px;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 8px 25px rgba(78, 205, 196, 0.3);
            margin-bottom: 20px;
        }
        
        .scan-btn:active {
            transform: scale(0.95);
        }
        
        .scan-text {
            font-size: 18px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 30px;
        }
        
        /* Notifications */
        .notification {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: #fff;
            padding: 20px 30px;
            border-radius: 15px;
            font-size: 18px;
            font-weight: bold;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s;
            backdrop-filter: blur(10px);
            border: 2px solid #ffd93d;
        }
        
        .notification.show {
            opacity: 1;
        }
        
        /* Coin animation */
        .coin-popup {
            position: fixed;
            top: 30%;
            left: 50%;
            transform: translateX(-50%);
            font-size: 36px;
            font-weight: bold;
            color: #ffd93d;
            z-index: 999;
            pointer-events: none;
            animation: coinBounce 2s ease-out forwards;
        }
        
        @keyframes coinBounce {
            0% {
                opacity: 0;
                transform: translateX(-50%) translateY(50px) scale(0.5);
            }
            50% {
                opacity: 1;
                transform: translateX(-50%) translateY(-20px) scale(1.2);
            }
            100% {
                opacity: 0;
                transform: translateX(-50%) translateY(-100px) scale(1);
            }
        }
        
        .stats-footer {
            background: rgba(0,0,0,0.2);
            padding: 15px 20px;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        
        .global-stats {
            display: flex;
            justify-content: space-around;
            font-size: 14px;
            opacity: 0.8;
        }
        
        /* Responsive */
        @media (max-width: 400px) {
            .game-title {
                font-size: 36px;
            }
            
            .scan-btn {
                width: 100px;
                height: 100px;
                font-size: 36px;
            }
            
            .treasure-map {
                height: 250px;
            }
        }
    </style>
</head>
<body>
    <div class="game-container">
        <!-- Start Screen -->
        <div class="start-screen" id="startScreen">
            <div class="game-title">🏴‍☠️</div>
            <div class="game-title">QR Treasure Hunt</div>
            <div class="game-subtitle">Scan QR codes around you to find hidden treasure!<br>Collect coins and level up your pirate!</div>
            
            <input type="text" class="name-input" id="playerName" placeholder="Enter your pirate name" maxlength="15">
            <button class="start-btn" onclick="startGame()">⚡ Start Adventure</button>
        </div>
        
        <!-- Game Screen -->
        <div class="game-screen" id="gameScreen">
            <div class="game-header">
                <div class="player-info">
                    <div class="stat">👤 <span id="playerNameDisplay">Pirate</span></div>
                    <div class="stat">🪙 <span id="coins">0</span></div>
                    <div class="stat">⭐ <span id="level">1</span></div>
                </div>
            </div>
            
            <div class="game-area">
                <div class="treasure-map" id="treasureMap">
                    <!-- Treasure spots will be added here -->
                </div>
                
                <button class="scan-btn" onclick="scanQR()">📷</button>
                <div class="scan-text">Tap to scan for treasure!</div>
                
                <div style="font-size: 14px; text-align: center; opacity: 0.7; margin-top: 20px;">
                    Look for QR codes around you or tap the camera button to simulate finding treasure
                </div>
            </div>
            
            <div class="stats-footer">
                <div class="global-stats">
                    <div>🌍 <span id="totalPlayers">0</span> pirates</div>
                    <div>💰 <span id="totalCoins">0</span> coins found</div>
                </div>
            </div>
        </div>
        
        <!-- Notification -->
        <div class="notification" id="notification"></div>
    </div>
    
    <script>
        let currentPlayer = null;
        let playerId = null;
        let gameData = { totalPlayers: 0, coinsCollected: 0 };
        
        // Generate random treasure spots
        function generateTreasureSpots() {
            const map = document.getElementById('treasureMap');
            const spots = 8;
            
            for (let i = 0; i < spots; i++) {
                const spot = document.createElement('div');
                spot.className = 'treasure-spot';
                spot.innerHTML = '💰';
                spot.style.left = Math.random() * 80 + 10 + '%';
                spot.style.top = Math.random() * 70 + 15 + '%';
                spot.onclick = () => foundTreasure(spot);
                map.appendChild(spot);
            }
        }
        
        function startGame() {
            const playerName = document.getElementById('playerName').value.trim();
            
            if (!playerName) {
                showNotification('⚠️ Please enter your pirate name!');
                return;
            }
            
            if (playerName.length < 2) {
                showNotification('⚠️ Name too short, matey!');
                return;
            }
            
            // Join game
            fetch('/api/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerName })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currentPlayer = data.player;
                    playerId = data.playerId;
                    
                    // Switch to game screen
                    document.getElementById('startScreen').style.display = 'none';
                    document.getElementById('gameScreen').style.display = 'flex';
                    
                    // Update UI
                    document.getElementById('playerNameDisplay').textContent = currentPlayer.name;
                    updatePlayerStats();
                    generateTreasureSpots();
                    
                    showNotification('🏴‍☠️ Welcome aboard, ' + currentPlayer.name + '!');
                    updateGlobalStats();
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('⚠️ Failed to join game. Try again!');
            });
        }
        
        function scanQR() {
            if (!playerId) return;
            
            showNotification('🔍 Scanning for treasure...');
            
            // Simulate QR scan
            setTimeout(() => {
                const mockQRData = 'TREASURE_' + Math.random().toString(36).substr(2, 9);
                
                fetch('/api/scan-qr', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        playerId: playerId,
                        qrData: mockQRData 
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        currentPlayer = data.player;
                        gameData = data.gameState;
                        
                        showCoinAnimation(data.coinsEarned);
                        updatePlayerStats();
                        updateGlobalStats();
                        
                        const messages = [
                            '🏴‍☠️ Found buried treasure!',
                            '💰 Discovered gold coins!',
                            '⚡ Lightning struck treasure!',
                            '🗝️ Unlocked a treasure chest!',
                            '🌟 Found a rare gem!'
                        ];
                        
                        showNotification(messages[Math.floor(Math.random() * messages.length)]);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('⚠️ Treasure hunt failed. Try again!');
                });
                
            }, 1500);
        }
        
        function foundTreasure(spot) {
            spot.style.animation = 'none';
            spot.style.transform = 'scale(1.3)';
            spot.innerHTML = '✨';
            
            setTimeout(() => {
                spot.remove();
                scanQR();
            }, 200);
        }
        
        function updatePlayerStats() {
            if (currentPlayer) {
                document.getElementById('coins').textContent = currentPlayer.coins;
                document.getElementById('level').textContent = currentPlayer.level;
            }
        }
        
        function updateGlobalStats() {
            document.getElementById('totalPlayers').textContent = gameData.totalPlayers || 1;
            document.getElementById('totalCoins').textContent = gameData.coinsCollected || 0;
        }
        
        function showNotification(message) {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
        
        function showCoinAnimation(coins) {
            const coinPopup = document.createElement('div');
            coinPopup.className = 'coin-popup';
            coinPopup.textContent = '+' + coins + ' 🪙';
            document.body.appendChild(coinPopup);
            
            setTimeout(() => {
                coinPopup.remove();
            }, 2000);
        }
        
        // Update global stats periodically
        setInterval(() => {
            fetch('/api/stats')
                .then(response => response.json())
                .then(data => {
                    gameData = data.gameState;
                    updateGlobalStats();
                })
                .catch(error => console.error('Stats error:', error));
        }, 10000);
        
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        console.log('🏴‍☠️ QR Treasure Hunt Ready!');
        console.log('📱 Mobile-optimized pirate adventure');
    </script>
</body>
</html>`;
    }
}

// Start the simple mobile game
new SimpleMobileGame();