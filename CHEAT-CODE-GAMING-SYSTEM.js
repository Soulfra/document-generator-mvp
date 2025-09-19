#!/usr/bin/env node

/**
 * 🎮 CHEAT CODE GAMING SYSTEM
 * Classic gaming with built-in cheat codes like the good old days
 * IDDQD, IDKFA, up-up-down-down-left-right-left-right-B-A
 */

const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');

class CheatCodeGamingSystem {
    constructor(port = 7100) {
        this.port = port;
        this.wsPort = port + 1;
        
        // Classic cheat codes
        this.cheatCodes = {
            'IDDQD': { name: 'God Mode', effect: 'invincible', active: false },
            'IDKFA': { name: 'All Weapons', effect: 'unlock_all', active: false },
            'IDSPISPOPD': { name: 'No Clip', effect: 'walk_through_walls', active: false },
            'ABACABB': { name: 'Blood Code', effect: 'enable_gore', active: false },
            'UUDDLRLRBA': { name: 'Konami Code', effect: '30_lives', active: false },
            'thereisnocowlevel': { name: 'Secret Level', effect: 'unlock_secret', active: false },
            'showmethemoney': { name: 'Instant Cash', effect: 'add_10000', active: false },
            'poweroverwhelming': { name: 'God Mode SC', effect: 'invincible', active: false },
            'allyourbasearebelongtous': { name: 'Instant Win', effect: 'win_game', active: false },
            'rosebud': { name: 'Money Cheat', effect: 'add_1000', active: false },
            'motherlode': { name: 'Mega Money', effect: 'add_50000', active: false },
            'pepperonipizza': { name: 'Food', effect: 'max_food', active: false },
            'howdoyouturnthison': { name: 'Car', effect: 'spawn_car', active: false },
            'blacksheepwall': { name: 'Map Reveal', effect: 'reveal_map', active: false },
            'operation cwal': { name: 'Fast Build', effect: 'instant_build', active: false }
        };
        
        // Game state
        this.gameState = {
            player: {
                name: 'Player 1',
                cash: 1000,
                credits: 100,
                level: 1,
                godMode: false,
                buildings: []
            },
            cheatsUsed: [],
            konamiProgress: [],
            secretsUnlocked: 0
        };
        
        this.setupServer();
    }
    
    setupServer() {
        this.app = express();
        this.app.use(express.json());
        
        // WebSocket for real-time cheat activation
        this.wss = new WebSocket.Server({ port: this.wsPort });
        this.wss.on('connection', (ws) => {
            console.log('🎮 Player connected');
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                if (data.type === 'cheat_code') {
                    this.processCheatCode(data.code, ws);
                }
            });
        });
        
        // Routes
        this.app.get('/', (req, res) => res.send(this.generateMainPage()));
        this.app.post('/api/cheat', this.enterCheatCode.bind(this));
        this.app.get('/api/gamestate', (req, res) => res.json(this.gameState));
        this.app.post('/api/konami', this.konamiInput.bind(this));
        this.app.get('/api/cheats', (req, res) => res.json(this.cheatCodes));
        
        this.

// Auto-injected health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Gaming Cheat System',
        port: 7100,
        timestamp: Date.now(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        description: 'Gaming cheat detection and management'
    });
});

app.get('/ready', (req, res) => {
    // Add any readiness checks here
    res.json({
        status: 'ready',
        service: 'Gaming Cheat System',
        timestamp: Date.now()
    });
});

app.listen(this.port, () => {
            console.log(`🎮 Cheat Code Gaming System running on http://localhost:${this.port}`);
            console.log(`🔐 Remember: ↑↑↓↓←→←→BA`);
            console.log(`💀 IDDQD = God Mode`);
            console.log(`💰 showmethemoney = Instant Cash`);
        });
    }
    
    processCheatCode(code, ws) {
        const upperCode = code.toUpperCase();
        const lowerCode = code.toLowerCase();
        
        // Check both cases
        let cheat = this.cheatCodes[upperCode] || this.cheatCodes[lowerCode] || this.cheatCodes[code];
        
        if (cheat) {
            console.log(`🎮 CHEAT ACTIVATED: ${cheat.name}`);
            
            // Apply cheat effect
            switch (cheat.effect) {
                case 'invincible':
                    this.gameState.player.godMode = true;
                    break;
                case 'add_10000':
                    this.gameState.player.cash += 10000;
                    break;
                case 'add_1000':
                    this.gameState.player.cash += 1000;
                    break;
                case 'add_50000':
                    this.gameState.player.cash += 50000;
                    break;
                case 'unlock_all':
                    this.gameState.player.level = 99;
                    this.gameState.player.credits += 9999;
                    break;
                case 'win_game':
                    this.gameState.player.cash = 999999;
                    this.gameState.player.level = 100;
                    break;
                case '30_lives':
                    this.gameState.player.credits += 30;
                    break;
                case 'reveal_map':
                    this.gameState.secretsUnlocked = 10;
                    break;
                case 'instant_build':
                    this.gameState.player.buildings.push({
                        type: 'mega_factory',
                        income: 1000,
                        built: Date.now()
                    });
                    break;
            }
            
            cheat.active = true;
            this.gameState.cheatsUsed.push({
                code: code,
                name: cheat.name,
                timestamp: Date.now()
            });
            
            // Send response
            ws.send(JSON.stringify({
                type: 'cheat_activated',
                cheat: cheat.name,
                effect: cheat.effect,
                gameState: this.gameState
            }));
        } else {
            ws.send(JSON.stringify({
                type: 'cheat_invalid',
                message: 'Invalid cheat code!'
            }));
        }
    }
    
    enterCheatCode(req, res) {
        const { code } = req.body;
        
        const upperCode = code.toUpperCase();
        const lowerCode = code.toLowerCase();
        
        let cheat = this.cheatCodes[upperCode] || this.cheatCodes[lowerCode] || this.cheatCodes[code];
        
        if (cheat) {
            // Apply effect
            this.applyCheatEffect(cheat);
            
            res.json({
                success: true,
                cheat: cheat.name,
                effect: cheat.effect,
                message: `${cheat.name} ACTIVATED!`,
                gameState: this.gameState
            });
        } else {
            res.json({
                success: false,
                message: 'Invalid cheat code! Try IDDQD or showmethemoney'
            });
        }
    }
    
    applyCheatEffect(cheat) {
        switch (cheat.effect) {
            case 'invincible':
                this.gameState.player.godMode = true;
                break;
            case 'add_10000':
                this.gameState.player.cash += 10000;
                break;
            case 'add_1000':
                this.gameState.player.cash += 1000;
                break;
            case 'add_50000':
                this.gameState.player.cash += 50000;
                break;
            case 'unlock_all':
                this.gameState.player.level = 99;
                this.gameState.player.credits += 9999;
                break;
            case 'win_game':
                this.gameState.player.cash = 999999;
                this.gameState.player.level = 100;
                break;
            case '30_lives':
                this.gameState.player.credits += 30;
                break;
            case 'reveal_map':
                this.gameState.secretsUnlocked = 10;
                break;
            case 'instant_build':
                this.gameState.player.buildings.push({
                    type: 'mega_factory',
                    income: 1000,
                    built: Date.now()
                });
                break;
            case 'unlock_secret':
                this.gameState.secretsUnlocked++;
                break;
            case 'spawn_car':
                this.gameState.player.buildings.push({
                    type: 'car',
                    income: 0,
                    special: 'vroom vroom',
                    built: Date.now()
                });
                break;
        }
        
        cheat.active = true;
        this.gameState.cheatsUsed.push({
            code: Object.keys(this.cheatCodes).find(key => this.cheatCodes[key] === cheat),
            name: cheat.name,
            timestamp: Date.now()
        });
    }
    
    konamiInput(req, res) {
        const { input } = req.body;
        const konamiCode = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
        
        this.gameState.konamiProgress.push(input);
        
        // Keep only last 10 inputs
        if (this.gameState.konamiProgress.length > 10) {
            this.gameState.konamiProgress.shift();
        }
        
        // Check if Konami code completed
        const progress = this.gameState.konamiProgress.join(',');
        const target = konamiCode.join(',');
        
        if (progress === target) {
            this.applyCheatEffect(this.cheatCodes['UUDDLRLRBA']);
            res.json({
                success: true,
                message: 'KONAMI CODE ACTIVATED! +30 LIVES!',
                gameState: this.gameState
            });
        } else if (target.startsWith(progress)) {
            res.json({
                success: true,
                progress: this.gameState.konamiProgress.length,
                message: 'Keep going...'
            });
        } else {
            this.gameState.konamiProgress = [];
            res.json({
                success: false,
                message: 'Wrong sequence, try again!'
            });
        }
    }
    
    generateMainPage() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🎮 Cheat Code Gaming System</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: #000; 
            color: #0f0; 
            margin: 0; 
            padding: 20px;
            image-rendering: pixelated;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .title { 
            font-size: 3rem; 
            text-align: center; 
            text-shadow: 0 0 20px #0f0;
            margin-bottom: 2rem;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        .game-screen {
            background: #111;
            border: 4px solid #0f0;
            padding: 20px;
            margin: 20px 0;
            border-radius: 0;
            box-shadow: 0 0 30px #0f0;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
            margin: 20px 0;
        }
        .stat {
            background: rgba(0,255,0,0.1);
            border: 2px solid #0f0;
            padding: 10px;
            text-align: center;
        }
        .cheat-input {
            background: #000;
            border: 2px solid #0f0;
            color: #0f0;
            padding: 10px;
            font-family: 'Courier New', monospace;
            font-size: 1.2rem;
            width: 100%;
            margin: 10px 0;
            text-transform: uppercase;
        }
        .btn {
            background: #000;
            border: 2px solid #0f0;
            color: #0f0;
            padding: 10px 20px;
            font-family: 'Courier New', monospace;
            cursor: pointer;
            margin: 5px;
        }
        .btn:hover {
            background: #0f0;
            color: #000;
        }
        .cheat-list {
            background: rgba(0,255,0,0.05);
            border: 1px solid #0f0;
            padding: 20px;
            margin: 20px 0;
        }
        .cheat-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px dashed #0f0;
        }
        .konami-pad {
            display: grid;
            grid-template-columns: repeat(3, 60px);
            gap: 5px;
            margin: 20px auto;
            width: fit-content;
        }
        .konami-btn {
            width: 60px;
            height: 60px;
            background: #111;
            border: 2px solid #0f0;
            color: #0f0;
            font-size: 24px;
            cursor: pointer;
        }
        .konami-btn:active {
            background: #0f0;
            color: #000;
        }
        .message {
            text-align: center;
            font-size: 1.5rem;
            margin: 20px 0;
            height: 30px;
        }
        .active-cheats {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0,0,0,0.9);
            border: 2px solid #0f0;
            padding: 10px;
            max-width: 200px;
        }
        .retro-text {
            font-family: monospace;
            color: #0f0;
            text-shadow: 0 0 10px #0f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="title">🎮 CHEAT CODE GAMING SYSTEM 🎮</div>
        
        <div class="game-screen">
            <div class="stats">
                <div class="stat">
                    <div>💰 CASH</div>
                    <div id="cash">$1000</div>
                </div>
                <div class="stat">
                    <div>⭐ CREDITS</div>
                    <div id="credits">100</div>
                </div>
                <div class="stat">
                    <div>📊 LEVEL</div>
                    <div id="level">1</div>
                </div>
                <div class="stat">
                    <div>🏭 BUILDINGS</div>
                    <div id="buildings">0</div>
                </div>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
                <h2>ENTER CHEAT CODE</h2>
                <input type="text" id="cheatInput" class="cheat-input" placeholder="TYPE CHEAT CODE HERE..." onkeypress="handleCheatInput(event)">
                <button class="btn" onclick="submitCheat()">ACTIVATE</button>
            </div>
            
            <div class="message" id="message"></div>
            
            <div style="text-align: center;">
                <h3>🎮 KONAMI CODE 🎮</h3>
                <div class="konami-pad">
                    <div></div>
                    <button class="konami-btn" onclick="konamiInput('up')">↑</button>
                    <div></div>
                    <button class="konami-btn" onclick="konamiInput('left')">←</button>
                    <button class="konami-btn" onclick="konamiInput('down')">↓</button>
                    <button class="konami-btn" onclick="konamiInput('right')">→</button>
                    <div></div>
                    <button class="konami-btn" onclick="konamiInput('b')">B</button>
                    <button class="konami-btn" onclick="konamiInput('a')">A</button>
                </div>
            </div>
        </div>
        
        <div class="cheat-list">
            <h3>📜 CLASSIC CHEAT CODES 📜</h3>
            <div class="cheat-item">
                <span>IDDQD</span>
                <span>God Mode (DOOM)</span>
            </div>
            <div class="cheat-item">
                <span>IDKFA</span>
                <span>All Weapons (DOOM)</span>
            </div>
            <div class="cheat-item">
                <span>showmethemoney</span>
                <span>+$10,000 (StarCraft)</span>
            </div>
            <div class="cheat-item">
                <span>allyourbasearebelongtous</span>
                <span>Instant Win</span>
            </div>
            <div class="cheat-item">
                <span>rosebud</span>
                <span>+$1,000 (The Sims)</span>
            </div>
            <div class="cheat-item">
                <span>motherlode</span>
                <span>+$50,000 (The Sims)</span>
            </div>
            <div class="cheat-item">
                <span>thereisnocowlevel</span>
                <span>Secret Level</span>
            </div>
            <div class="cheat-item">
                <span>operation cwal</span>
                <span>Fast Build (StarCraft)</span>
            </div>
            <div class="cheat-item">
                <span>↑↑↓↓←→←→BA</span>
                <span>+30 Lives (Konami)</span>
            </div>
        </div>
        
        <div style="text-align: center; margin: 20px 0; color: #666;">
            <p>Just like the old days - type a cheat code and press ENTER!</p>
            <p>These cheats actually work and modify the game state.</p>
        </div>
    </div>
    
    <div class="active-cheats" id="activeCheats">
        <h4>🎮 ACTIVE CHEATS</h4>
        <div id="cheatsList"></div>
    </div>
    
    <script>
        let ws = null;
        let gameState = null;
        
        // Connect WebSocket
        function connectWS() {
            ws = new WebSocket('ws://localhost:7101');
            
            ws.onopen = () => {
                console.log('Connected to cheat system');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'cheat_activated') {
                    showMessage('✅ ' + data.cheat + ' ACTIVATED!', 'success');
                    updateGameState(data.gameState);
                    updateActiveCheats();
                } else if (data.type === 'cheat_invalid') {
                    showMessage('❌ Invalid cheat code!', 'error');
                }
            };
        }
        
        function handleCheatInput(event) {
            if (event.key === 'Enter') {
                submitCheat();
            }
        }
        
        async function submitCheat() {
            const input = document.getElementById('cheatInput');
            const code = input.value.trim();
            
            if (!code) return;
            
            // Check for classic codes
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'cheat_code', code: code }));
            } else {
                // Fallback to HTTP
                try {
                    const response = await fetch('/api/cheat', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ code })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showMessage('✅ ' + result.message, 'success');
                        updateGameState(result.gameState);
                    } else {
                        showMessage('❌ ' + result.message, 'error');
                    }
                } catch (error) {
                    showMessage('❌ Error submitting cheat', 'error');
                }
            }
            
            input.value = '';
        }
        
        async function konamiInput(input) {
            try {
                const response = await fetch('/api/konami', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ input })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    if (result.gameState) {
                        showMessage(result.message, 'success');
                        updateGameState(result.gameState);
                    } else {
                        showMessage(result.message, 'info');
                    }
                } else {
                    showMessage(result.message, 'error');
                }
            } catch (error) {
                console.error('Konami input error:', error);
            }
        }
        
        function updateGameState(state) {
            gameState = state;
            document.getElementById('cash').textContent = '$' + state.player.cash;
            document.getElementById('credits').textContent = state.player.credits;
            document.getElementById('level').textContent = state.player.level;
            document.getElementById('buildings').textContent = state.player.buildings.length;
            
            updateActiveCheats();
        }
        
        function updateActiveCheats() {
            if (!gameState) return;
            
            const cheatsList = document.getElementById('cheatsList');
            cheatsList.innerHTML = '';
            
            if (gameState.player.godMode) {
                cheatsList.innerHTML += '<div>• God Mode</div>';
            }
            
            gameState.cheatsUsed.forEach(cheat => {
                cheatsList.innerHTML += '<div>• ' + cheat.name + '</div>';
            });
        }
        
        function showMessage(text, type) {
            const message = document.getElementById('message');
            message.textContent = text;
            message.style.color = type === 'success' ? '#0f0' : type === 'error' ? '#f00' : '#ff0';
            
            setTimeout(() => {
                message.textContent = '';
            }, 3000);
        }
        
        // Load initial state
        async function loadGameState() {
            try {
                const response = await fetch('/api/gamestate');
                const state = await response.json();
                updateGameState(state);
            } catch (error) {
                console.error('Failed to load game state:', error);
            }
        }
        
        // Initialize
        connectWS();
        loadGameState();
        
        // Auto-refresh state
        setInterval(loadGameState, 5000);
    </script>
</body>
</html>`;
    }
}

// Start the cheat code gaming system
if (require.main === module) {
    new CheatCodeGamingSystem(7100);
}

module.exports = CheatCodeGamingSystem;