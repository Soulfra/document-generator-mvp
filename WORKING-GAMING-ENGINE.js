#!/usr/bin/env node

/**
 * 🎮 WORKING PIXEL→VOXEL→PIXEL GAMING ENGINE
 * 
 * Actually functional gaming engine that connects all your components
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const { EventEmitter } = require('events');

class WorkingGamingEngine extends EventEmitter {
    constructor() {
        super();
        this.port = 8888;
        
        // Core game state
        this.world = {
            pixels: new Map(),
            voxels: new Map(),
            entities: new Map(),
            chunks: new Map()
        };
        
        // Character connection
        this.character = {
            eyes: { scanning: false, focus: null },
            ears: { listening: false },
            face: { expression: 'gaming' },
            hands: { swiping: false, gesture: null },
            position: { x: 0, y: 0, z: 0 }
        };
        
        // Error prediction
        this.errors = [];
        this.predictions = [];
        
        // Performance
        this.frameTime = 16;
        this.fps = 60;
        this.lastFrame = Date.now();
        
        console.log('🎮 WORKING GAMING ENGINE');
        console.log('========================');
        console.log('🔥 Actually functional this time');
        
        this.init();
    }
    
    async init() {
        try {
            // 1. Initialize world
            await this.initWorld();
            
            // 2. Start server
            await this.startServer();
            
            // 3. Connect to character system
            await this.connectCharacter();
            
            // 4. Start game loop
            this.startGameLoop();
            
            console.log('✅ GAMING ENGINE READY!');
            console.log(`🎮 Play: http://localhost:${this.port}/game`);
            console.log(`📊 API: http://localhost:${this.port}/api/status`);
            
        } catch (error) {
            console.error('💥 Init failed:', error);
            this.handleError(error);
        }
    }
    
    async initWorld() {
        console.log('🌍 Initializing world...');
        
        // Create basic world
        for (let x = -10; x <= 10; x++) {
            for (let z = -10; z <= 10; z++) {
                const key = `${x},0,${z}`;
                this.world.voxels.set(key, {
                    type: 'ground',
                    color: [34, 139, 34],
                    position: { x, y: 0, z }
                });
            }
        }
        
        // Add player entity
        this.world.entities.set('player', {
            id: 'player',
            position: { x: 0, y: 1, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            type: 'character'
        });
        
        console.log(`✅ World created: ${this.world.voxels.size} voxels`);
    }
    
    async startServer() {
        const server = http.createServer(async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            
            if (req.url === '/game') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.getGameHTML());
            } else if (req.url === '/api/status') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'running',
                    world: {
                        voxels: this.world.voxels.size,
                        entities: this.world.entities.size
                    },
                    character: this.character,
                    performance: {
                        fps: this.fps,
                        frameTime: this.frameTime
                    },
                    errors: this.errors.length,
                    predictions: this.predictions.length
                }));
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`🌐 Server running on port ${this.port}`);
        });
        
        // WebSocket for real-time updates
        this.wss = new WebSocket.Server({ server });
        this.clients = new Set();
        
        this.wss.on('connection', (ws) => {
            console.log('🔗 Client connected');
            this.clients.add(ws);
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'init',
                world: this.getWorldData(),
                character: this.character
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleInput(data, ws);
                } catch (error) {
                    this.predictError('websocket_parse', error);
                }
            });
            
            ws.on('close', () => {
                this.clients.delete(ws);
                console.log('👋 Client disconnected');
            });
        });
    }
    
    async connectCharacter() {
        try {
            // Try to connect to your existing character system
            const response = await fetch('http://localhost:6969/api/character/status').catch(() => null);
            
            if (response && response.ok) {
                this.character = await response.json();
                console.log('✅ Connected to character interface');
                
                // Connect WebSocket to character
                this.characterWS = new WebSocket('ws://localhost:6969');
                this.characterWS.on('message', (data) => {
                    const update = JSON.parse(data);
                    if (update.type === 'character_state') {
                        this.character = update.data;
                        this.broadcastUpdate('character_update', this.character);
                    }
                });
                
            } else {
                console.log('⚠️ Character interface not available, using embedded');
            }
            
        } catch (error) {
            console.log('⚠️ Character connection failed, using embedded');
        }
    }
    
    handleInput(data, ws) {
        switch (data.type) {
            case 'move':
                this.movePlayer(data.direction);
                break;
            case 'character_action':
                this.handleCharacterAction(data.action, data.params);
                break;
            case 'interact':
                this.handleInteraction(data.position, data.action);
                break;
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
        }
    }
    
    movePlayer(direction) {
        const player = this.world.entities.get('player');
        if (!player) return;
        
        const moves = {
            up: { x: 0, y: 0, z: -1 },
            down: { x: 0, y: 0, z: 1 },
            left: { x: -1, y: 0, z: 0 },
            right: { x: 1, y: 0, z: 0 },
            jump: { x: 0, y: 1, z: 0 }
        };
        
        const move = moves[direction];
        if (move) {
            player.position.x += move.x;
            player.position.y += move.y;
            player.position.z += move.z;
            
            // Update character position
            this.character.position = player.position;
            
            this.broadcastUpdate('player_moved', {
                position: player.position,
                direction: direction
            });
        }
    }
    
    handleCharacterAction(action, params) {
        switch (action) {
            case 'eye_scan':
                this.character.eyes.scanning = true;
                this.character.eyes.focus = params?.target || 'forward';
                break;
            case 'ear_listen':
                this.character.ears.listening = !this.character.ears.listening;
                break;
            case 'hand_gesture':
                this.character.hands.swiping = true;
                this.character.hands.gesture = params?.gesture || 'wave';
                setTimeout(() => {
                    this.character.hands.swiping = false;
                }, 1000);
                break;
        }
        
        this.broadcastUpdate('character_action', this.character);
    }
    
    handleInteraction(position, action) {
        const key = `${position.x},${position.y},${position.z}`;
        
        switch (action) {
            case 'place':
                this.world.voxels.set(key, {
                    type: 'player_block',
                    color: [255, 0, 0],
                    position: position
                });
                break;
            case 'break':
                this.world.voxels.delete(key);
                break;
        }
        
        this.broadcastUpdate('world_changed', {
            position: position,
            action: action,
            voxel: this.world.voxels.get(key)
        });
    }
    
    startGameLoop() {
        setInterval(() => {
            const now = Date.now();
            const deltaTime = now - this.lastFrame;
            this.lastFrame = now;
            
            // Update performance
            this.frameTime = deltaTime;
            this.fps = Math.round(1000 / deltaTime);
            
            // Predict errors
            this.checkPredictions();
            
            // Send updates if needed
            if (this.clients.size > 0) {
                this.broadcastUpdate('tick', {
                    timestamp: now,
                    performance: {
                        fps: this.fps,
                        frameTime: this.frameTime
                    }
                });
            }
            
        }, 16); // ~60fps
        
        console.log('🔄 Game loop started');
    }
    
    checkPredictions() {
        // Predict memory issues
        if (this.world.voxels.size > 10000) {
            this.addPrediction('memory_warning', 'High voxel count detected');
        }
        
        // Predict performance issues
        if (this.frameTime > 33) { // Below 30fps
            this.addPrediction('performance_warning', 'Low FPS detected');
        }
        
        // Predict connection issues
        if (this.clients.size === 0) {
            this.addPrediction('connection_warning', 'No clients connected');
        }
    }
    
    addPrediction(type, message) {
        this.predictions.push({
            type,
            message,
            timestamp: Date.now()
        });
        
        // Keep only recent predictions
        if (this.predictions.length > 100) {
            this.predictions.shift();
        }
    }
    
    handleError(error) {
        this.errors.push({
            message: error.message,
            stack: error.stack,
            timestamp: Date.now()
        });
        
        console.error('🚨 Error logged:', error.message);
        
        // Broadcast error to clients
        this.broadcastUpdate('error', {
            message: error.message,
            timestamp: Date.now()
        });
    }
    
    predictError(type, error) {
        this.addPrediction(`error_${type}`, `Potential ${type} error: ${error.message}`);
        this.handleError(error);
    }
    
    broadcastUpdate(type, data) {
        const message = JSON.stringify({
            type,
            data,
            timestamp: Date.now()
        });
        
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                } catch (error) {
                    this.predictError('broadcast', error);
                }
            }
        });
    }
    
    getWorldData() {
        return {
            voxels: Array.from(this.world.voxels.entries()).map(([key, voxel]) => ({
                key,
                ...voxel
            })),
            entities: Array.from(this.world.entities.values()),
            stats: {
                voxelCount: this.world.voxels.size,
                entityCount: this.world.entities.size
            }
        };
    }
    
    getGameHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎮 Pixel→Voxel Gaming Engine</title>
    <style>
        body {
            margin: 0;
            background: #000;
            font-family: 'Courier New', monospace;
            color: #00ff41;
            overflow: hidden;
        }
        
        #gameCanvas {
            display: block;
            width: 100vw;
            height: 100vh;
            background: #001122;
            cursor: crosshair;
        }
        
        #hud {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border: 1px solid #00ff41;
            font-size: 12px;
        }
        
        #character {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border: 1px solid #ff4444;
            font-size: 12px;
        }
        
        #controls {
            position: absolute;
            bottom: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border: 1px solid #4444ff;
            font-size: 12px;
        }
        
        .active { color: #00ff41; text-shadow: 0 0 5px #00ff41; }
        .inactive { color: #666; }
    </style>
</head>
<body>
    <canvas id="gameCanvas"></canvas>
    
    <div id="hud">
        <div>🎮 PIXEL→VOXEL ENGINE</div>
        <div>Position: <span id="position">0, 1, 0</span></div>
        <div>FPS: <span id="fps">60</span></div>
        <div>Voxels: <span id="voxelCount">0</span></div>
        <div>Errors: <span id="errorCount">0</span></div>
    </div>
    
    <div id="character">
        <div>👁️ Eyes: <span id="eyes" class="inactive">Idle</span></div>
        <div>👂 Ears: <span id="ears" class="inactive">Idle</span></div>
        <div>🗣️ Face: <span id="face">Gaming</span></div>
        <div>👋 Hands: <span id="hands" class="inactive">Still</span></div>
    </div>
    
    <div id="controls">
        <div>🎯 CONTROLS</div>
        <div>WASD: Move</div>
        <div>Space: Jump</div>
        <div>E: Eye Scan</div>
        <div>Q: Ear Listen</div>
        <div>R: Hand Gesture</div>
        <div>Click: Interact</div>
    </div>
    
    <script>
        class PixelVoxelGame {
            constructor() {
                this.canvas = document.getElementById('gameCanvas');
                this.ctx = this.canvas.getContext('2d');
                this.ws = null;
                
                this.world = { voxels: [], entities: [] };
                this.character = null;
                this.player = { x: 0, y: 1, z: 0 };
                
                this.keys = {};
                this.scale = 20;
                
                this.init();
            }
            
            init() {
                this.setupCanvas();
                this.setupInput();
                this.connectWebSocket();
                this.startRenderLoop();
                
                console.log('🎮 Game initialized');
            }
            
            setupCanvas() {
                this.canvas.width = window.innerWidth;
                this.canvas.height = window.innerHeight;
                
                this.ctx.imageSmoothingEnabled = false;
                
                window.addEventListener('resize', () => {
                    this.canvas.width = window.innerWidth;
                    this.canvas.height = window.innerHeight;
                });
            }
            
            setupInput() {
                document.addEventListener('keydown', (e) => {
                    this.keys[e.code] = true;
                    this.handleKeyDown(e.code);
                });
                
                document.addEventListener('keyup', (e) => {
                    this.keys[e.code] = false;
                });
                
                this.canvas.addEventListener('click', (e) => {
                    const rect = this.canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    this.handleClick(x, y);
                });
            }
            
            handleKeyDown(code) {
                const moves = {
                    'KeyW': 'up',
                    'KeyS': 'down', 
                    'KeyA': 'left',
                    'KeyD': 'right',
                    'Space': 'jump'
                };
                
                if (moves[code]) {
                    this.sendMessage('move', { direction: moves[code] });
                }
                
                if (code === 'KeyE') {
                    this.sendMessage('character_action', { 
                        action: 'eye_scan', 
                        params: { target: 'forward' } 
                    });
                }
                
                if (code === 'KeyQ') {
                    this.sendMessage('character_action', { action: 'ear_listen' });
                }
                
                if (code === 'KeyR') {
                    this.sendMessage('character_action', { 
                        action: 'hand_gesture', 
                        params: { gesture: 'wave' } 
                    });
                }
            }
            
            handleClick(x, y) {
                const worldX = Math.floor((x - this.canvas.width/2) / this.scale) + this.player.x;
                const worldZ = Math.floor((y - this.canvas.height/2) / this.scale) + this.player.z;
                
                this.sendMessage('interact', {
                    position: { x: worldX, y: 0, z: worldZ },
                    action: 'place'
                });
            }
            
            connectWebSocket() {
                const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
                this.ws = new WebSocket(protocol + '//' + location.host);
                
                this.ws.onopen = () => {
                    console.log('🔗 Connected to server');
                };
                
                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleServerMessage(data);
                };
                
                this.ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                };
                
                this.ws.onclose = () => {
                    console.log('🔌 Disconnected');
                    setTimeout(() => this.connectWebSocket(), 2000);
                };
            }
            
            handleServerMessage(data) {
                switch (data.type) {
                    case 'init':
                        this.world = data.world;
                        this.character = data.character;
                        this.updateHUD();
                        break;
                    case 'player_moved':
                        this.player = data.data.position;
                        this.updateHUD();
                        break;
                    case 'character_action':
                    case 'character_update':
                        this.character = data.data;
                        this.updateCharacterDisplay();
                        break;
                    case 'world_changed':
                        // Update world voxels
                        this.world.voxels = this.world.voxels || [];
                        break;
                    case 'tick':
                        if (data.data.performance) {
                            document.getElementById('fps').textContent = data.data.performance.fps;
                        }
                        break;
                    case 'error':
                        console.error('Server error:', data.data.message);
                        break;
                }
            }
            
            sendMessage(type, data) {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({ type, ...data }));
                }
            }
            
            startRenderLoop() {
                const render = () => {
                    this.render();
                    requestAnimationFrame(render);
                };
                render();
            }
            
            render() {
                // Clear screen
                this.ctx.fillStyle = '#001122';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Render world (top-down view)
                this.renderWorld();
                
                // Render player
                this.renderPlayer();
                
                // Render UI elements
                this.renderCrosshair();
            }
            
            renderWorld() {
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                
                // Draw grid
                this.ctx.strokeStyle = '#003344';
                this.ctx.lineWidth = 1;
                
                for (let i = -20; i <= 20; i++) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(centerX + i * this.scale, centerY - 400);
                    this.ctx.lineTo(centerX + i * this.scale, centerY + 400);
                    this.ctx.stroke();
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(centerX - 400, centerY + i * this.scale);
                    this.ctx.lineTo(centerX + 400, centerY + i * this.scale);
                    this.ctx.stroke();
                }
                
                // Draw voxels
                if (this.world.voxels) {
                    this.world.voxels.forEach(voxel => {
                        const screenX = centerX + (voxel.position.x - this.player.x) * this.scale;
                        const screenY = centerY + (voxel.position.z - this.player.z) * this.scale;
                        
                        const [r, g, b] = voxel.color;
                        this.ctx.fillStyle = \`rgb(\${r}, \${g}, \${b})\`;
                        this.ctx.fillRect(screenX - this.scale/2, screenY - this.scale/2, this.scale, this.scale);
                    });
                }
            }
            
            renderPlayer() {
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                
                // Player dot
                this.ctx.fillStyle = '#ff4444';
                this.ctx.fillRect(centerX - 5, centerY - 5, 10, 10);
                
                // Player direction indicator
                this.ctx.strokeStyle = '#ff4444';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, centerY);
                this.ctx.lineTo(centerX, centerY - 15);
                this.ctx.stroke();
            }
            
            renderCrosshair() {
                const centerX = this.canvas.width / 2;
                const centerY = this.canvas.height / 2;
                
                this.ctx.strokeStyle = '#00ff41';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(centerX - 10, centerY);
                this.ctx.lineTo(centerX + 10, centerY);
                this.ctx.moveTo(centerX, centerY - 10);
                this.ctx.lineTo(centerX, centerY + 10);
                this.ctx.stroke();
            }
            
            updateHUD() {
                document.getElementById('position').textContent = 
                    \`\${this.player.x}, \${this.player.y}, \${this.player.z}\`;
                
                if (this.world.stats) {
                    document.getElementById('voxelCount').textContent = this.world.stats.voxelCount;
                }
            }
            
            updateCharacterDisplay() {
                if (!this.character) return;
                
                const eyes = document.getElementById('eyes');
                eyes.textContent = this.character.eyes.scanning ? 'Scanning' : 'Idle';
                eyes.className = this.character.eyes.scanning ? 'active' : 'inactive';
                
                const ears = document.getElementById('ears');
                ears.textContent = this.character.ears.listening ? 'Listening' : 'Idle';
                ears.className = this.character.ears.listening ? 'active' : 'inactive';
                
                document.getElementById('face').textContent = this.character.face.expression;
                
                const hands = document.getElementById('hands');
                hands.textContent = this.character.hands.swiping ? 'Gesturing' : 'Still';
                hands.className = this.character.hands.swiping ? 'active' : 'inactive';
            }
        }
        
        // Start the game
        window.addEventListener('load', () => {
            new PixelVoxelGame();
        });
    </script>
</body>
</html>`;
    }
}

// Start the engine
if (require.main === module) {
    console.log('🚀 STARTING WORKING GAMING ENGINE');
    console.log('=================================');
    
    new WorkingGamingEngine();
}

module.exports = WorkingGamingEngine;