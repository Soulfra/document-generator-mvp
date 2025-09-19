#!/usr/bin/env node

/**
 * 🔷 HEXAGONAL ISOMETRIC PLATFORM
 * 3rd person hexagonal movement with fractal refractive visuals
 * Diving/space game feel with x-ray vision mechanics
 * Like Sims/RuneScape/Habbo but with hexagonal grids and refractals
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');

class HexagonalIsometricPlatform {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 8095;
        
        // Hexagonal world state
        this.worldState = {
            hexGrid: {
                radius: 20,      // Hex grid radius
                hexSize: 32,     // Size of each hex
                tiles: new Map(),
                entities: new Map(),
                fractals: new Map(),
                layers: new Map()  // Multiple layers for diving/x-ray
            },
            camera: {
                x: 0, y: 0, z: 0,
                rotation: { x: -30, y: 0, z: 45 },  // Isometric angle
                zoom: 1.0,
                layer: 0,        // Current visible layer
                xrayMode: false,
                refractionEnabled: true
            },
            player: {
                q: 0, r: 0, s: 0,  // Hexagonal coordinates (q+r+s=0)
                layer: 0,
                facing: 0,         // 0-5 for hex directions
                isMoving: false,
                avatar: 'explorer'
            },
            platform: {
                services: new Map(),
                accessLevels: new Map(),
                refractionMap: new Map()
            }
        };

        // Hexagonal direction vectors (6 directions)
        this.hexDirections = [
            { q: 1, r: -1, s: 0 },   // NE
            { q: 1, r: 0, s: -1 },   // E
            { q: 0, r: 1, s: -1 },   // SE
            { q: -1, r: 1, s: 0 },   // SW
            { q: -1, r: 0, s: 1 },   // W
            { q: 0, r: -1, s: 1 }    // NW
        ];

        // Fractal refraction patterns
        this.refractionPatterns = {
            'mandelbrot': { complexity: 0.8, colorShift: 0.3, depth: 5 },
            'julia': { complexity: 0.6, colorShift: 0.5, depth: 4 },
            'sierpinski': { complexity: 0.4, colorShift: 0.2, depth: 6 },
            'dragon': { complexity: 0.7, colorShift: 0.4, depth: 5 },
            'crystal': { complexity: 0.9, colorShift: 0.6, depth: 7 }
        };

        // Platform services with hex positioning
        this.initializePlatformServices();
        
        console.log('🔷 Hexagonal Isometric Platform initializing...');
        this.init();
    }

    initializePlatformServices() {
        // Each service gets a hex position and fractal signature
        const services = [
            {
                id: 'onion_search',
                name: '🔍 Onion Search Game',
                hex: { q: 2, r: -1, s: -1 },
                layer: 0,
                fractalType: 'mandelbrot',
                xrayVisible: true,
                access: 'free'
            },
            {
                id: 'enterprise_security',
                name: '🛡️ Enterprise Security',
                hex: { q: -1, r: 2, s: -1 },
                layer: 1,
                fractalType: 'crystal',
                xrayVisible: false,
                access: 'authenticated'
            },
            {
                id: 'financial_analyzer',
                name: '💰 Financial Analyzer',
                hex: { q: 1, r: 1, s: -2 },
                layer: 2,
                fractalType: 'julia',
                xrayVisible: true,
                access: 'authenticated'
            },
            {
                id: 'data_reversal',
                name: '🔄 Data Reversal',
                hex: { q: -2, r: 0, s: 2 },
                layer: 3,
                fractalType: 'dragon',
                xrayVisible: false,
                access: 'authenticated'
            },
            {
                id: 'gaming_hub',
                name: '🎮 3D Gaming Hub',
                hex: { q: 0, r: -2, s: 2 },
                layer: 0,
                fractalType: 'sierpinski',
                xrayVisible: true,
                access: 'free'
            },
            {
                id: 'platform_licensing',
                name: '⚡ Platform Licensing',
                hex: { q: -1, r: -1, s: 2 },
                layer: 4,
                fractalType: 'crystal',
                xrayVisible: false,
                access: 'premium'
            }
        ];

        services.forEach(service => {
            this.worldState.platform.services.set(service.id, service);
            
            // Create hex tile for service
            const hexKey = `${service.hex.q},${service.hex.r},${service.hex.s}`;
            this.worldState.hexGrid.tiles.set(hexKey, {
                type: 'service_node',
                serviceId: service.id,
                fractalPattern: this.refractionPatterns[service.fractalType],
                layer: service.layer,
                walkable: true,
                interactive: true
            });
        });
    }

    init() {
        this.setupExpress();
        this.setupWebSocket();
        this.generateHexWorld();
        this.startRenderLoop();
        
        this.server.listen(this.port, () => {
            console.log(`🔷 Hexagonal Isometric Platform: http://localhost:${this.port}`);
            console.log('🎯 Features:');
            console.log('   • Hexagonal movement (6-direction)');
            console.log('   • Fractal refractive visuals');
            console.log('   • X-ray layer diving');
            console.log('   • 3rd person isometric view');
            console.log('   • Space/diving game mechanics');
        });
    }

    setupExpress() {
        this.app.use(express.json());
        
        this.app.get('/', (req, res) => {
            res.send(this.getHexagonalPlatformHTML());
        });
        
        this.app.get('/api/world', (req, res) => {
            res.json({
                hexGrid: {
                    radius: this.worldState.hexGrid.radius,
                    hexSize: this.worldState.hexGrid.hexSize,
                    tiles: Array.from(this.worldState.hexGrid.tiles.entries())
                },
                player: this.worldState.player,
                camera: this.worldState.camera,
                services: Array.from(this.worldState.platform.services.values())
            });
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🔷 Player connected to hex platform');
            
            // Send initial world state
            ws.send(JSON.stringify({
                type: 'world_init',
                worldState: this.worldState
            }));

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handlePlayerCommand(data, ws);
                } catch (e) {
                    console.log('Invalid hex command:', e);
                }
            });
        });
    }

    handlePlayerCommand(data, ws) {
        switch (data.type) {
            case 'hex_move':
                this.movePlayerHex(data.direction);
                this.broadcastPlayerUpdate();
                break;
            case 'layer_dive':
                this.changeLayer(data.layer);
                this.broadcastLayerChange();
                break;
            case 'toggle_xray':
                this.worldState.camera.xrayMode = !this.worldState.camera.xrayMode;
                this.broadcastCameraUpdate();
                break;
            case 'adjust_refraction':
                this.worldState.camera.refractionEnabled = data.enabled;
                this.broadcastCameraUpdate();
                break;
            case 'interact_service':
                this.interactWithService(data.serviceId, ws);
                break;
        }
    }

    movePlayerHex(direction) {
        if (direction >= 0 && direction < 6) {
            const dir = this.hexDirections[direction];
            const newQ = this.worldState.player.q + dir.q;
            const newR = this.worldState.player.r + dir.r;
            const newS = this.worldState.player.s + dir.s;
            
            // Check if hex is walkable
            const hexKey = `${newQ},${newR},${newS}`;
            const tile = this.worldState.hexGrid.tiles.get(hexKey);
            
            if (!tile || tile.walkable) {
                this.worldState.player.q = newQ;
                this.worldState.player.r = newR;
                this.worldState.player.s = newS;
                this.worldState.player.facing = direction;
                this.worldState.player.isMoving = true;
                
                // Check for service interaction
                if (tile && tile.type === 'service_node') {
                    this.triggerServiceProximity(tile.serviceId);
                }
                
                setTimeout(() => {
                    this.worldState.player.isMoving = false;
                }, 500);
            }
        }
    }

    changeLayer(targetLayer) {
        this.worldState.camera.layer = Math.max(0, Math.min(4, targetLayer));
        this.worldState.player.layer = this.worldState.camera.layer;
    }

    generateHexWorld() {
        // Generate hex tiles in a spiral pattern
        for (let q = -this.worldState.hexGrid.radius; q <= this.worldState.hexGrid.radius; q++) {
            for (let r = Math.max(-this.worldState.hexGrid.radius, -q - this.worldState.hexGrid.radius); 
                 r <= Math.min(this.worldState.hexGrid.radius, -q + this.worldState.hexGrid.radius); r++) {
                const s = -q - r;
                const hexKey = `${q},${r},${s}`;
                
                if (!this.worldState.hexGrid.tiles.has(hexKey)) {
                    const distance = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
                    const terrain = this.generateHexTerrain(q, r, s, distance);
                    
                    this.worldState.hexGrid.tiles.set(hexKey, terrain);
                }
            }
        }
        
        console.log(`🔷 Generated ${this.worldState.hexGrid.tiles.size} hex tiles`);
    }

    generateHexTerrain(q, r, s, distance) {
        const terrainTypes = ['space', 'crystal', 'void', 'data_stream', 'fractal_zone'];
        const fractalTypes = Object.keys(this.refractionPatterns);
        
        return {
            type: terrainTypes[Math.floor(Math.random() * terrainTypes.length)],
            fractalPattern: this.refractionPatterns[fractalTypes[Math.floor(Math.random() * fractalTypes.length)]],
            layer: Math.floor(distance / 5),
            walkable: Math.random() > 0.1,
            interactive: Math.random() > 0.8,
            refractionIntensity: Math.random(),
            coordinates: { q, r, s }
        };
    }

    startRenderLoop() {
        setInterval(() => {
            this.updateFractals();
            this.updateRefractions();
        }, 100);
    }

    updateFractals() {
        // Animate fractal patterns
        this.worldState.hexGrid.tiles.forEach((tile, key) => {
            if (tile.fractalPattern) {
                tile.fractalPattern.phase = (tile.fractalPattern.phase || 0) + 0.02;
                if (tile.fractalPattern.phase > Math.PI * 2) {
                    tile.fractalPattern.phase = 0;
                }
            }
        });
    }

    updateRefractions() {
        // Update refraction map based on camera position and x-ray mode
        this.worldState.platform.refractionMap.clear();
        
        this.worldState.platform.services.forEach(service => {
            const distance = this.getHexDistance(
                this.worldState.player,
                service.hex
            );
            
            if (distance <= 3 || this.worldState.camera.xrayMode) {
                this.worldState.platform.refractionMap.set(service.id, {
                    intensity: Math.max(0, 1 - distance / 5),
                    visible: service.xrayVisible || distance <= 2
                });
            }
        });
    }

    getHexDistance(hex1, hex2) {
        return Math.max(
            Math.abs(hex1.q - hex2.q),
            Math.abs(hex1.r - hex2.r),
            Math.abs(hex1.s - hex2.s)
        );
    }

    broadcastPlayerUpdate() {
        this.broadcast({
            type: 'player_moved',
            player: this.worldState.player
        });
    }

    broadcastLayerChange() {
        this.broadcast({
            type: 'layer_changed',
            camera: this.worldState.camera
        });
    }

    broadcastCameraUpdate() {
        this.broadcast({
            type: 'camera_updated',
            camera: this.worldState.camera
        });
    }

    broadcast(data) {
        const message = JSON.stringify(data);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    getHexagonalPlatformHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🔷 Hexagonal Isometric Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Courier New', monospace;
            background: radial-gradient(circle, #0a0a2e, #000);
            color: #fff;
            overflow: hidden;
            height: 100vh;
        }

        .platform-container {
            display: flex;
            height: 100vh;
        }

        .control-panel {
            width: 280px;
            background: linear-gradient(135deg, #1a1a3a, #2a1a3a);
            border-right: 2px solid #4a4aff;
            padding: 20px;
            overflow-y: auto;
        }

        .hex-viewport {
            flex: 1;
            position: relative;
            background: #000;
            overflow: hidden;
        }

        #hex-canvas {
            display: block;
            width: 100%;
            height: 100%;
            cursor: crosshair;
        }

        .control-section {
            margin-bottom: 25px;
            border: 1px solid #4a4aff;
            padding: 15px;
            border-radius: 8px;
            background: rgba(74, 74, 255, 0.1);
        }

        .control-section h3 {
            color: #6a6aff;
            margin-bottom: 12px;
            text-align: center;
            border-bottom: 1px solid #4a4aff;
            padding-bottom: 8px;
        }

        .hex-movement {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 8px;
            margin: 15px 0;
        }

        .hex-btn {
            background: linear-gradient(135deg, #3a3aaa, #5a5aff);
            border: 1px solid #7a7aff;
            color: white;
            padding: 12px;
            cursor: pointer;
            border-radius: 6px;
            font-family: inherit;
            font-size: 12px;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }

        .hex-btn:hover {
            background: linear-gradient(135deg, #5a5aff, #7a7aff);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(90, 90, 255, 0.4);
        }

        .hex-btn:active {
            transform: translateY(0);
        }

        .movement-grid {
            display: grid;
            grid-template-areas: 
                ". ne ."
                "w . e"
                ". se .";
            gap: 5px;
            justify-items: center;
        }

        .move-ne { grid-area: ne; }
        .move-e { grid-area: e; }
        .move-se { grid-area: se; }
        .move-w { grid-area: w; }

        .layer-controls {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .layer-slider {
            width: 100%;
            background: #3a3aaa;
            border-radius: 4px;
            outline: none;
        }

        .vision-controls {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .toggle-btn {
            background: linear-gradient(135deg, #aa3a3a, #ff5a5a);
            border: 1px solid #ff7a7a;
            color: white;
            padding: 10px;
            cursor: pointer;
            border-radius: 6px;
            font-family: inherit;
            transition: all 0.3s;
        }

        .toggle-btn.active {
            background: linear-gradient(135deg, #3aaa3a, #5aff5a);
            border-color: #7aff7a;
        }

        .status-display {
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #4a4aff;
            border-radius: 6px;
            padding: 12px;
        }

        .status-line {
            margin: 4px 0;
            font-size: 11px;
            color: #aaaaff;
        }

        .service-list {
            max-height: 200px;
            overflow-y: auto;
        }

        .service-item {
            background: rgba(74, 74, 255, 0.2);
            border: 1px solid #4a4aff;
            margin: 6px 0;
            padding: 10px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
        }

        .service-item:hover {
            background: rgba(74, 74, 255, 0.4);
            transform: translateX(4px);
        }

        .service-item.nearby {
            border-color: #ffaa4a;
            box-shadow: 0 0 8px rgba(255, 170, 74, 0.3);
        }

        .service-item.xray-visible {
            border-color: #aa4aff;
            background: rgba(170, 74, 255, 0.2);
        }

        .fractal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            background: 
                radial-gradient(circle at 20% 30%, rgba(255, 74, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(74, 255, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 80%, rgba(255, 255, 74, 0.1) 0%, transparent 50%);
            animation: fractalPulse 4s ease-in-out infinite;
        }

        @keyframes fractalPulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(1.05); }
        }

        .hex-grid-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            background-image: 
                repeating-linear-gradient(30deg, rgba(74, 74, 255, 0.1) 0px, transparent 1px, transparent 30px, rgba(74, 74, 255, 0.1) 32px),
                repeating-linear-gradient(-30deg, rgba(74, 74, 255, 0.1) 0px, transparent 1px, transparent 30px, rgba(74, 74, 255, 0.1) 32px);
        }
    </style>
</head>
<body>
    <div class="platform-container">
        <div class="control-panel">
            <div class="control-section">
                <h3>🔷 HEX MOVEMENT</h3>
                <div class="movement-grid">
                    <button class="hex-btn move-ne" onclick="moveHex(0)">⬈ NE</button>
                    <button class="hex-btn move-e" onclick="moveHex(1)">➡ E</button>
                    <button class="hex-btn move-se" onclick="moveHex(2)">⬊ SE</button>
                    <button class="hex-btn move-w" onclick="moveHex(4)">⬅ W</button>
                </div>
                <div style="text-align: center; margin-top: 10px;">
                    <button class="hex-btn" onclick="moveHex(3)">⬋ SW</button>
                    <button class="hex-btn" onclick="moveHex(5)">⬉ NW</button>
                </div>
            </div>

            <div class="control-section">
                <h3>🌊 LAYER DIVING</h3>
                <div class="layer-controls">
                    <label>Depth: <span id="layer-display">0</span></label>
                    <input type="range" id="layer-slider" class="layer-slider" 
                           min="0" max="4" value="0" onchange="changeLayer(this.value)">
                    <small>0: Surface • 4: Deep Core</small>
                </div>
            </div>

            <div class="control-section">
                <h3>👁️ VISION MODES</h3>
                <div class="vision-controls">
                    <button id="xray-btn" class="toggle-btn" onclick="toggleXRay()">
                        🔍 X-Ray Vision
                    </button>
                    <button id="refraction-btn" class="toggle-btn active" onclick="toggleRefraction()">
                        ✨ Fractal Refraction
                    </button>
                </div>
            </div>

            <div class="control-section">
                <h3>📊 STATUS</h3>
                <div class="status-display">
                    <div class="status-line">Position: <span id="hex-coords">0,0,0</span></div>
                    <div class="status-line">Layer: <span id="current-layer">0</span></div>
                    <div class="status-line">Direction: <span id="facing">NE</span></div>
                    <div class="status-line">X-Ray: <span id="xray-status">OFF</span></div>
                    <div class="status-line">Refractions: <span id="refraction-status">ON</span></div>
                </div>
            </div>

            <div class="control-section">
                <h3>🎯 SERVICES</h3>
                <div id="service-list" class="service-list">
                    <!-- Services populated by JavaScript -->
                </div>
            </div>
        </div>

        <div class="hex-viewport">
            <canvas id="hex-canvas"></canvas>
            <div class="fractal-overlay"></div>
            <div class="hex-grid-overlay"></div>
        </div>
    </div>

    <script>
        let ws;
        let worldState = null;
        let canvas, ctx;
        let animationFrame;

        // Hex math constants
        const HEX_SIZE = 32;
        const HEX_WIDTH = HEX_SIZE * 2;
        const HEX_HEIGHT = Math.sqrt(3) * HEX_SIZE;

        // Direction names
        const DIRECTIONS = ['NE', 'E', 'SE', 'SW', 'W', 'NW'];

        function init() {
            canvas = document.getElementById('hex-canvas');
            ctx = canvas.getContext('2d');
            
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            
            connectWebSocket();
            startRenderLoop();
        }

        function resizeCanvas() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        function connectWebSocket() {
            ws = new WebSocket(\`ws://\${window.location.host}\`);
            
            ws.onopen = () => {
                console.log('🔷 Connected to hex platform');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onclose = () => {
                console.log('🔷 Disconnected from hex platform');
                setTimeout(connectWebSocket, 2000);
            };
        }

        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'world_init':
                    worldState = data.worldState;
                    updateUI();
                    break;
                case 'player_moved':
                    if (worldState) {
                        worldState.player = data.player;
                        updateUI();
                    }
                    break;
                case 'layer_changed':
                    if (worldState) {
                        worldState.camera = data.camera;
                        updateUI();
                    }
                    break;
                case 'camera_updated':
                    if (worldState) {
                        worldState.camera = data.camera;
                        updateUI();
                    }
                    break;
            }
        }

        function moveHex(direction) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'hex_move',
                    direction: direction
                }));
            }
        }

        function changeLayer(layer) {
            const layerNum = parseInt(layer);
            document.getElementById('layer-display').textContent = layerNum;
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'layer_dive',
                    layer: layerNum
                }));
            }
        }

        function toggleXRay() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'toggle_xray'
                }));
            }
        }

        function toggleRefraction() {
            const btn = document.getElementById('refraction-btn');
            const enabled = !btn.classList.contains('active');
            
            if (enabled) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'adjust_refraction',
                    enabled: enabled
                }));
            }
        }

        function updateUI() {
            if (!worldState) return;
            
            // Update status display
            document.getElementById('hex-coords').textContent = 
                \`\${worldState.player.q},\${worldState.player.r},\${worldState.player.s}\`;
            document.getElementById('current-layer').textContent = worldState.camera.layer;
            document.getElementById('facing').textContent = DIRECTIONS[worldState.player.facing];
            document.getElementById('xray-status').textContent = worldState.camera.xrayMode ? 'ON' : 'OFF';
            document.getElementById('refraction-status').textContent = worldState.camera.refractionEnabled ? 'ON' : 'OFF';
            
            // Update layer slider
            document.getElementById('layer-slider').value = worldState.camera.layer;
            document.getElementById('layer-display').textContent = worldState.camera.layer;
            
            // Update X-Ray button
            const xrayBtn = document.getElementById('xray-btn');
            if (worldState.camera.xrayMode) {
                xrayBtn.classList.add('active');
            } else {
                xrayBtn.classList.remove('active');
            }
            
            // Update services list
            updateServicesList();
        }

        function updateServicesList() {
            if (!worldState) return;
            
            const serviceList = document.getElementById('service-list');
            serviceList.innerHTML = '';
            
            Array.from(worldState.platform.services.values()).forEach(service => {
                const item = document.createElement('div');
                item.className = 'service-item';
                
                const distance = getHexDistance(worldState.player, service.hex);
                if (distance <= 3) {
                    item.classList.add('nearby');
                }
                
                if (service.xrayVisible && worldState.camera.xrayMode) {
                    item.classList.add('xray-visible');
                }
                
                item.innerHTML = \`
                    <div>\${service.name}</div>
                    <small>Layer \${service.layer} • Distance: \${distance}</small>
                \`;
                
                item.onclick = () => {
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            type: 'interact_service',
                            serviceId: service.id
                        }));
                    }
                };
                
                serviceList.appendChild(item);
            });
        }

        function getHexDistance(hex1, hex2) {
            return Math.max(
                Math.abs(hex1.q - hex2.q),
                Math.abs(hex1.r - hex2.r),
                Math.abs(hex1.s - hex2.s)
            );
        }

        function hexToPixel(q, r) {
            const x = HEX_SIZE * (3/2 * q);
            const y = HEX_SIZE * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
            return { x, y };
        }

        function drawHexagon(centerX, centerY, size, color, fractalPattern) {
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = i * Math.PI / 3;
                const x = centerX + size * Math.cos(angle);
                const y = centerY + size * Math.sin(angle);
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.closePath();
            
            // Apply fractal pattern if refraction is enabled
            if (worldState && worldState.camera.refractionEnabled && fractalPattern) {
                const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, size);
                const phase = fractalPattern.phase || 0;
                const hue = (fractalPattern.colorShift * 360 + phase * 57.3) % 360;
                
                gradient.addColorStop(0, \`hsla(\${hue}, 70%, 60%, 0.8)\`);
                gradient.addColorStop(0.6, \`hsla(\${(hue + 60) % 360}, 50%, 40%, 0.4)\`);
                gradient.addColorStop(1, \`hsla(\${(hue + 120) % 360}, 30%, 20%, 0.2)\`);
                
                ctx.fillStyle = gradient;
            } else {
                ctx.fillStyle = color;
            }
            
            ctx.fill();
            ctx.strokeStyle = '#4a4aff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        function render() {
            if (!worldState || !ctx) return;
            
            // Clear canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            
            // Calculate camera offset based on player position
            const playerPixel = hexToPixel(worldState.player.q, worldState.player.r);
            const offsetX = centerX - playerPixel.x;
            const offsetY = centerY - playerPixel.y;
            
            // Draw hex tiles
            worldState.hexGrid.tiles.forEach((tile, key) => {
                const [q, r, s] = key.split(',').map(Number);
                
                // Layer visibility logic
                const layerDiff = Math.abs(tile.layer - worldState.camera.layer);
                if (layerDiff > 1 && !worldState.camera.xrayMode) return;
                
                const pixel = hexToPixel(q, r);
                const screenX = pixel.x + offsetX;
                const screenY = pixel.y + offsetY;
                
                // Only draw if on screen
                if (screenX > -HEX_SIZE && screenX < canvas.width + HEX_SIZE &&
                    screenY > -HEX_SIZE && screenY < canvas.height + HEX_SIZE) {
                    
                    let color = '#222';
                    let alpha = 1;
                    
                    // Tile type colors
                    switch (tile.type) {
                        case 'space': color = '#001122'; break;
                        case 'crystal': color = '#220044'; break;
                        case 'void': color = '#110011'; break;
                        case 'data_stream': color = '#004422'; break;
                        case 'fractal_zone': color = '#442200'; break;
                        case 'service_node': color = '#440044'; break;
                    }
                    
                    // X-ray transparency
                    if (worldState.camera.xrayMode && layerDiff > 0) {
                        alpha = 0.3;
                    }
                    
                    ctx.globalAlpha = alpha;
                    drawHexagon(screenX, screenY, HEX_SIZE * 0.9, color, tile.fractalPattern);
                    ctx.globalAlpha = 1;
                }
            });
            
            // Draw player
            const playerPixelPos = hexToPixel(worldState.player.q, worldState.player.r);
            const playerScreenX = playerPixelPos.x + offsetX;
            const playerScreenY = playerPixelPos.y + offsetY;
            
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(playerScreenX, playerScreenY, 8, 0, Math.PI * 2);
            ctx.fill();
            
            // Player direction indicator
            const dirAngle = worldState.player.facing * Math.PI / 3;
            const dirX = playerScreenX + Math.cos(dirAngle) * 15;
            const dirY = playerScreenY + Math.sin(dirAngle) * 15;
            
            ctx.strokeStyle = '#ffff44';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(playerScreenX, playerScreenY);
            ctx.lineTo(dirX, dirY);
            ctx.stroke();
        }

        function startRenderLoop() {
            function animate() {
                render();
                animationFrame = requestAnimationFrame(animate);
            }
            animate();
        }

        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'w': case 'ArrowUp': moveHex(0); break;      // NE
                case 'd': case 'ArrowRight': moveHex(1); break;   // E
                case 'x': moveHex(2); break;                      // SE
                case 'z': moveHex(3); break;                      // SW
                case 'a': case 'ArrowLeft': moveHex(4); break;    // W
                case 'q': case 'ArrowDown': moveHex(5); break;    // NW
                case ' ': e.preventDefault(); toggleXRay(); break;
                case 'r': toggleRefraction(); break;
                case '1': case '2': case '3': case '4': case '5':
                    changeLayer(parseInt(e.key) - 1);
                    break;
            }
        });

        // Initialize when page loads
        window.addEventListener('load', init);
    </script>
</body>
</html>`;
    }
}

// Start the platform
const platform = new HexagonalIsometricPlatform();

module.exports = HexagonalIsometricPlatform;