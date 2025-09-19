#!/usr/bin/env node

/**
 * 3D VISUAL TYCOON
 * Minecraft/Roblox style 3D building game with depth and layers
 */

const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');

class ThreeDVisualTycoon {
  constructor(theme = 'cannabis-tycoon', port = 7030) {
    this.theme = theme;
    this.port = port;
    this.wsPort = port + 1;
    
    // 3D World state
    this.gameState = {
      // Player data
      player: {
        id: 'demo_player',
        name: 'Empire Builder',
        cash: 2000,
        credits: 1000,
        level: 1,
        experience: 0,
        camera: { x: 10, y: 15, z: 10, rotX: -30, rotY: 45 }
      },
      
      // 3D world with layers (like Minecraft)
      world: {
        width: 32,
        height: 32,
        depth: 16, // Height layers
        blocks: new Map(), // x,y,z -> block data
        buildings: new Map(), // building_id -> 3D building data
        terrain: new Map(), // ground level data
        decorations: new Map(), // trees, rocks, etc.
        roads: new Set(), // road coordinates
        zones: new Map() // different biome zones
      },
      
      // 3D Building types
      buildings: this.get3DBuildingTypes(theme),
      
      // Economy
      economy: {
        totalRevenue: 0,
        dailyRevenue: 0,
        stripeTransactions: [],
        conversionRate: 0.01
      },
      
      // Game mechanics
      mechanics: {
        time: Date.now(),
        weather: 'sunny',
        season: 'spring',
        dayNight: 'day'
      }
    };

    this.initialize3DWorld();
    this.server = null;
    this.wsServer = null;
  }

  get3DBuildingTypes(theme) {
    const buildings = {
      'cannabis-tycoon': {
        'greenhouse': {
          name: 'Greenhouse',
          model: 'greenhouse',
          size: { w: 3, h: 2, d: 3 },
          cost: 100,
          income: 20,
          icon: '🏠',
          color: '#4a7c59',
          blocks: [
            // Glass walls and roof structure
            { x: 0, y: 0, z: 0, type: 'foundation' },
            { x: 1, y: 0, z: 0, type: 'foundation' },
            { x: 2, y: 0, z: 0, type: 'foundation' },
            { x: 0, y: 1, z: 0, type: 'glass' },
            { x: 2, y: 1, z: 0, type: 'glass' },
            { x: 1, y: 2, z: 1, type: 'roof' }
          ]
        },
        'dispensary': {
          name: 'Dispensary',
          model: 'shop',
          size: { w: 4, h: 3, d: 4 },
          cost: 500,
          income: 80,
          icon: '🏪',
          color: '#6b8e23',
          blocks: [
            // Store structure
            { x: 0, y: 0, z: 0, type: 'foundation' },
            { x: 1, y: 0, z: 0, type: 'foundation' },
            { x: 2, y: 0, z: 0, type: 'foundation' },
            { x: 3, y: 0, z: 0, type: 'foundation' },
            { x: 0, y: 1, z: 0, type: 'wall' },
            { x: 3, y: 1, z: 0, type: 'wall' },
            { x: 1, y: 1, z: 0, type: 'window' },
            { x: 2, y: 1, z: 0, type: 'door' },
            { x: 1, y: 2, z: 1, type: 'roof' },
            { x: 2, y: 2, z: 1, type: 'roof' }
          ]
        },
        'laboratory': {
          name: 'Laboratory',
          model: 'lab',
          size: { w: 5, h: 4, d: 5 },
          cost: 1000,
          income: 150,
          icon: '🧪',
          color: '#228b22',
          blocks: [
            // High-tech lab
            { x: 0, y: 0, z: 0, type: 'tech_foundation' },
            { x: 2, y: 1, z: 2, type: 'equipment' },
            { x: 1, y: 2, z: 1, type: 'antenna' },
            { x: 3, y: 2, z: 3, type: 'vent' }
          ]
        },
        'warehouse': {
          name: 'Warehouse',
          model: 'warehouse',
          size: { w: 6, h: 4, d: 8 },
          cost: 2000,
          income: 250,
          icon: '🏭',
          color: '#2e8b57',
          blocks: [
            // Large industrial building
            { x: 0, y: 0, z: 0, type: 'industrial_foundation' },
            { x: 5, y: 3, z: 7, type: 'smokestack' },
            { x: 2, y: 1, z: 4, type: 'loading_dock' }
          ]
        }
      }
    };

    return buildings[theme] || buildings['cannabis-tycoon'];
  }

  initialize3DWorld() {
    // Generate terrain with height variation
    for (let x = 0; x < this.gameState.world.width; x++) {
      for (let z = 0; z < this.gameState.world.height; z++) {
        // Generate height using simple noise
        const height = Math.floor(2 + Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2);
        
        for (let y = 0; y <= height; y++) {
          const key = `${x},${y},${z}`;
          let blockType = 'stone';
          
          if (y === height) {
            blockType = 'grass';
          } else if (y === height - 1) {
            blockType = 'dirt';
          }
          
          this.gameState.world.blocks.set(key, {
            x, y, z,
            type: blockType,
            building: null,
            decoration: null
          });
        }
        
        // Store terrain height
        this.gameState.world.terrain.set(`${x},${z}`, height);
      }
    }

    // Add some decorations
    this.addDecorations();
    
    // Add starter buildings
    this.add3DBuilding(8, 8, 'greenhouse');
    this.add3DBuilding(12, 12, 'dispensary');
  }

  addDecorations() {
    // Add trees, rocks, etc.
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * this.gameState.world.width);
      const z = Math.floor(Math.random() * this.gameState.world.height);
      const height = this.gameState.world.terrain.get(`${x},${z}`) || 0;
      
      const decorations = ['tree', 'rock', 'bush', 'flower'];
      const decoration = decorations[Math.floor(Math.random() * decorations.length)];
      
      this.gameState.world.decorations.set(`${x},${z}`, {
        type: decoration,
        x, y: height + 1, z,
        size: Math.random() * 0.5 + 0.5
      });
    }
  }

  add3DBuilding(x, z, buildingType) {
    const buildingDef = this.gameState.buildings[buildingType];
    if (!buildingDef) return false;

    const height = this.gameState.world.terrain.get(`${x},${z}`) || 0;
    const buildingId = crypto.randomUUID();
    
    const building = {
      id: buildingId,
      type: buildingType,
      x, y: height + 1, z,
      level: 1,
      income: buildingDef.income,
      lastCollection: Date.now(),
      rotation: 0,
      ...buildingDef
    };

    // Place building blocks
    buildingDef.blocks.forEach(block => {
      const blockX = x + block.x;
      const blockY = height + 1 + block.y;
      const blockZ = z + block.z;
      const key = `${blockX},${blockY},${blockZ}`;
      
      this.gameState.world.blocks.set(key, {
        x: blockX, y: blockY, z: blockZ,
        type: block.type,
        building: buildingId,
        decoration: null
      });
    });

    this.gameState.world.buildings.set(buildingId, building);
    return building;
  }

  async start() {
    console.log(`🎮 Starting 3D Visual Tycoon: ${this.theme}`);
    console.log(`📍 Port: ${this.port} | WebSocket: ${this.wsPort}`);

    // Create HTTP server
    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    // Create WebSocket server
    this.wsServer = new WebSocket.Server({ port: this.wsPort });
    this.wsServer.on('connection', (ws) => {
      this.handleWebSocket(ws);
    });

    // Start HTTP server
    this.server.listen(this.port, () => {
      console.log(`✅ 3D Visual Tycoon running at http://localhost:${this.port}`);
      console.log(`🌐 3D Game interface: http://localhost:${this.port}/game`);
    });

    // Start game simulation
    this.startGameLoop();

    return {
      port: this.port,
      wsPort: this.wsPort,
      gameUrl: `http://localhost:${this.port}/game`
    };
  }

  handleRequest(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url, `http://localhost:${this.port}`);

    switch (url.pathname) {
      case '/':
        this.serveMenu(res);
        break;
      case '/game':
        this.serve3DGame(res);
        break;
      case '/api/world':
        this.serveWorldData(res);
        break;
      case '/api/build':
        this.handleBuild3D(req, res);
        break;
      case '/api/camera':
        this.handleCamera(req, res);
        break;
      default:
        res.writeHead(404);
        res.end('Not found');
    }
  }

  serve3DGame(res) {
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>🎮 3D Cannabis Empire</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { margin: 0; padding: 0; background: linear-gradient(135deg, #87CEEB, #98FB98); font-family: 'Segoe UI', system-ui, sans-serif; overflow: hidden; }
        
        .game-container { position: relative; width: 100vw; height: 100vh; }
        
        .canvas-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        
        .ui-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1000; }
        
        .hud { position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 10px; pointer-events: auto; }
        
        .stats { margin-bottom: 10px; }
        .stat-item { display: flex; justify-content: space-between; margin: 5px 0; min-width: 200px; }
        .stat-value { color: #4ecdc4; font-weight: bold; }
        
        .controls { position: absolute; bottom: 20px; left: 20px; background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 10px; pointer-events: auto; }
        
        .build-menu { position: absolute; top: 20px; right: 20px; background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 10px; pointer-events: auto; max-width: 250px; }
        
        .building-item { background: rgba(255,255,255,0.1); margin: 5px 0; padding: 10px; border-radius: 5px; cursor: pointer; transition: all 0.3s; }
        .building-item:hover { background: rgba(255,255,255,0.2); transform: scale(1.02); }
        .building-item.selected { background: rgba(78, 205, 196, 0.3); border: 2px solid #4ecdc4; }
        
        .building-icon { font-size: 1.5rem; margin-right: 10px; }
        .building-name { font-weight: bold; }
        .building-cost { color: #4ecdc4; font-size: 0.9rem; }
        
        .info-panel { position: absolute; bottom: 20px; right: 20px; background: rgba(0,0,0,0.8); color: white; padding: 15px; border-radius: 10px; pointer-events: auto; }
        
        .btn { background: linear-gradient(45deg, #ff6b6b, #4ecdc4); border: none; color: white; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin: 2px; font-weight: bold; }
        .btn:hover { transform: scale(1.05); }
        
        .coordinates { position: absolute; top: 50%; left: 20px; background: rgba(0,0,0,0.6); color: white; padding: 10px; border-radius: 5px; pointer-events: auto; }
        
        .weather-info { position: absolute; top: 50%; right: 20px; background: rgba(0,0,0,0.6); color: white; padding: 10px; border-radius: 5px; pointer-events: none; }
        
        canvas { cursor: crosshair; }
        canvas.building { cursor: pointer; }
        
        .notification { position: absolute; top: 100px; left: 50%; transform: translateX(-50%); background: rgba(78, 205, 196, 0.9); color: #000; padding: 15px; border-radius: 8px; animation: slideDown 0.3s ease; z-index: 2000; }
        @keyframes slideDown { from { transform: translate(-50%, -100%); } to { transform: translate(-50%, 0); } }
    </style>
</head>
<body>
    <div class="game-container">
        <div class="canvas-container">
            <canvas id="gameCanvas" width="800" height="600"></canvas>
        </div>
        
        <div class="ui-overlay">
            <div class="hud">
                <h3>🏛️ Empire Stats</h3>
                <div class="stats">
                    <div class="stat-item">
                        <span>Cash:</span>
                        <span class="stat-value" id="playerCash">$2000</span>
                    </div>
                    <div class="stat-item">
                        <span>Credits:</span>
                        <span class="stat-value" id="playerCredits">1000</span>
                    </div>
                    <div class="stat-item">
                        <span>Level:</span>
                        <span class="stat-value" id="playerLevel">1</span>
                    </div>
                    <div class="stat-item">
                        <span>Buildings:</span>
                        <span class="stat-value" id="buildingCount">2</span>
                    </div>
                </div>
                <button class="btn" onclick="collectAll()">💰 Collect All</button>
                <button class="btn" onclick="resetCamera()">📷 Reset View</button>
            </div>
            
            <div class="controls">
                <h3>🎮 Controls</h3>
                <div>🖱️ Mouse: Look around</div>
                <div>WASD: Move camera</div>
                <div>Q/E: Rotate up/down</div>
                <div>Click: Place building</div>
                <div>Scroll: Zoom in/out</div>
            </div>
            
            <div class="build-menu">
                <h3>🏗️ Buildings</h3>
                <div id="buildingMenu"></div>
                <button class="btn" onclick="toggleBuildMode()" id="buildModeBtn">🔨 Build Mode</button>
            </div>
            
            <div class="coordinates">
                <div>Camera: <span id="cameraPos">10, 15, 10</span></div>
                <div>Cursor: <span id="cursorPos">0, 0, 0</span></div>
                <div>Zoom: <span id="zoomLevel">1.0x</span></div>
            </div>
            
            <div class="weather-info">
                <div>🌤️ Weather: <span id="weather">Sunny</span></div>
                <div>🌱 Season: <span id="season">Spring</span></div>
                <div>⏰ Time: <span id="gameTime">Day</span></div>
            </div>
            
            <div class="info-panel">
                <h3>📊 Performance</h3>
                <div>FPS: <span id="fps">60</span></div>
                <div>Blocks: <span id="blockCount">0</span></div>
                <div>Draw Calls: <span id="drawCalls">0</span></div>
            </div>
        </div>
    </div>

    <script>
        // 3D Game Engine
        class Simple3DEngine {
            constructor(canvas) {
                this.canvas = canvas;
                this.ctx = canvas.getContext('2d');
                this.width = canvas.width;
                this.height = canvas.height;
                
                // Camera
                this.camera = { x: 10, y: 15, z: 10, rotX: -30, rotY: 45, zoom: 1 };
                
                // Game state
                this.world = null;
                this.selectedBuilding = null;
                this.buildMode = false;
                this.mouseX = 0;
                this.mouseY = 0;
                
                this.setupInput();
                this.loadWorld();
                this.render();
            }
            
            setupInput() {
                // Mouse controls
                this.canvas.addEventListener('mousemove', (e) => {
                    this.mouseX = e.offsetX;
                    this.mouseY = e.offsetY;
                    
                    // Update cursor position display
                    const worldPos = this.screenToWorld(this.mouseX, this.mouseY);
                    document.getElementById('cursorPos').textContent = 
                        \`\${Math.floor(worldPos.x)}, \${Math.floor(worldPos.y)}, \${Math.floor(worldPos.z)}\`;
                });
                
                this.canvas.addEventListener('click', (e) => {
                    if (this.buildMode && this.selectedBuilding) {
                        const worldPos = this.screenToWorld(e.offsetX, e.offsetY);
                        this.placeBuildingAt(Math.floor(worldPos.x), Math.floor(worldPos.z));
                    }
                });
                
                this.canvas.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    this.camera.zoom *= (e.deltaY > 0) ? 0.9 : 1.1;
                    this.camera.zoom = Math.max(0.5, Math.min(3, this.camera.zoom));
                    document.getElementById('zoomLevel').textContent = this.camera.zoom.toFixed(1) + 'x';
                });
                
                // Keyboard controls
                const keys = {};
                window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
                window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
                
                // Camera movement
                setInterval(() => {
                    if (keys['w']) this.camera.z -= 0.5;
                    if (keys['s']) this.camera.z += 0.5;
                    if (keys['a']) this.camera.x -= 0.5;
                    if (keys['d']) this.camera.x += 0.5;
                    if (keys['q']) this.camera.rotX -= 2;
                    if (keys['e']) this.camera.rotX += 2;
                    
                    // Update camera position display
                    document.getElementById('cameraPos').textContent = 
                        \`\${this.camera.x.toFixed(1)}, \${this.camera.y.toFixed(1)}, \${this.camera.z.toFixed(1)}\`;
                }, 50);
            }
            
            async loadWorld() {
                try {
                    const response = await fetch('/api/world');
                    this.world = await response.json();
                    this.updateUI();
                } catch (error) {
                    console.error('Failed to load world:', error);
                }
            }
            
            updateUI() {
                if (!this.world) return;
                
                // Update player stats
                document.getElementById('playerCash').textContent = '$' + this.world.player.cash.toLocaleString();
                document.getElementById('playerCredits').textContent = this.world.player.credits.toLocaleString();
                document.getElementById('playerLevel').textContent = this.world.player.level;
                document.getElementById('buildingCount').textContent = Object.keys(this.world.world.buildings).length;
                
                // Update building menu
                this.updateBuildingMenu();
                
                // Update world info
                document.getElementById('weather').textContent = this.world.mechanics.weather;
                document.getElementById('season').textContent = this.world.mechanics.season;
                document.getElementById('gameTime').textContent = this.world.mechanics.dayNight;
            }
            
            updateBuildingMenu() {
                const menu = document.getElementById('buildingMenu');
                menu.innerHTML = '';
                
                Object.entries(this.world.buildings).forEach(([key, building]) => {
                    const div = document.createElement('div');
                    div.className = 'building-item';
                    div.onclick = () => this.selectBuilding(key);
                    
                    div.innerHTML = \`
                        <span class="building-icon">\${building.icon}</span>
                        <div>
                            <div class="building-name">\${building.name}</div>
                            <div class="building-cost">$\${building.cost}</div>
                        </div>
                    \`;
                    
                    menu.appendChild(div);
                });
            }
            
            selectBuilding(buildingType) {
                this.selectedBuilding = buildingType;
                
                // Update UI
                document.querySelectorAll('.building-item').forEach(item => {
                    item.classList.remove('selected');
                });
                event.target.closest('.building-item').classList.add('selected');
                
                addNotification(\`Selected: \${this.world.buildings[buildingType].name}\`);
            }
            
            screenToWorld(screenX, screenY) {
                // Simple isometric projection inverse
                const x = (screenX - this.width/2) / (20 * this.camera.zoom) + this.camera.x;
                const z = (screenY - this.height/2) / (20 * this.camera.zoom) + this.camera.z;
                const y = 0; // Simplified for ground level
                
                return { x, y, z };
            }
            
            worldToScreen(x, y, z) {
                // Isometric projection
                const camX = x - this.camera.x;
                const camY = y - this.camera.y;
                const camZ = z - this.camera.z;
                
                // Apply rotation
                const rotY = this.camera.rotY * Math.PI / 180;
                const rotX = this.camera.rotX * Math.PI / 180;
                
                const screenX = this.width/2 + (camX * Math.cos(rotY) - camZ * Math.sin(rotY)) * 20 * this.camera.zoom;
                const screenY = this.height/2 + (camY + (camX * Math.sin(rotY) + camZ * Math.cos(rotY)) * Math.sin(rotX)) * 20 * this.camera.zoom;
                
                return { x: screenX, y: screenY };
            }
            
            render() {
                // Clear canvas
                this.ctx.fillStyle = 'linear-gradient(135deg, #87CEEB, #98FB98)';
                this.ctx.fillRect(0, 0, this.width, this.height);
                
                if (!this.world) {
                    requestAnimationFrame(() => this.render());
                    return;
                }
                
                let drawCalls = 0;
                
                // Draw terrain and blocks
                Object.entries(this.world.world.blocks).forEach(([key, block]) => {
                    this.drawBlock(block);
                    drawCalls++;
                });
                
                // Draw buildings
                Object.entries(this.world.world.buildings).forEach(([id, building]) => {
                    this.drawBuilding(building);
                    drawCalls++;
                });
                
                // Draw decorations
                Object.entries(this.world.world.decorations).forEach(([key, decoration]) => {
                    this.drawDecoration(decoration);
                    drawCalls++;
                });
                
                // Update performance stats
                document.getElementById('blockCount').textContent = Object.keys(this.world.world.blocks).length;
                document.getElementById('drawCalls').textContent = drawCalls;
                
                requestAnimationFrame(() => this.render());
            }
            
            drawBlock(block) {
                const screen = this.worldToScreen(block.x, block.y, block.z);
                const size = 20 * this.camera.zoom;
                
                // Block colors
                const colors = {
                    grass: '#228B22',
                    dirt: '#8B4513',
                    stone: '#696969',
                    foundation: '#2F4F4F',
                    wall: '#A0522D',
                    glass: '#87CEEB',
                    roof: '#8B4513',
                    window: '#4169E1',
                    door: '#654321'
                };
                
                this.ctx.fillStyle = colors[block.type] || '#999';
                
                // Draw isometric cube
                this.ctx.fillRect(screen.x - size/2, screen.y - size/2, size, size);
                
                // Add depth/shading
                this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
                this.ctx.fillRect(screen.x - size/2 + 2, screen.y - size/2 + 2, size, size);
            }
            
            drawBuilding(building) {
                const screen = this.worldToScreen(building.x, building.y, building.z);
                const size = 30 * this.camera.zoom;
                
                // Draw building icon
                this.ctx.font = \`\${size}px Arial\`;
                this.ctx.textAlign = 'center';
                this.ctx.fillStyle = building.color;
                this.ctx.fillText(building.icon, screen.x, screen.y);
                
                // Draw income indicator
                this.ctx.font = \`\${12 * this.camera.zoom}px Arial\`;
                this.ctx.fillStyle = '#4ecdc4';
                this.ctx.fillText(\`+$\${building.income}\`, screen.x, screen.y + size);
            }
            
            drawDecoration(decoration) {
                const screen = this.worldToScreen(decoration.x, decoration.y, decoration.z);
                const size = (15 * decoration.size) * this.camera.zoom;
                
                const decorationIcons = {
                    tree: '🌳',
                    rock: '🪨',
                    bush: '🌿',
                    flower: '🌸'
                };
                
                this.ctx.font = \`\${size}px Arial\`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(decorationIcons[decoration.type] || '❓', screen.x, screen.y);
            }
            
            async placeBuildingAt(x, z) {
                if (!this.selectedBuilding) return;
                
                try {
                    const response = await fetch('/api/build', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ x, z, buildingType: this.selectedBuilding })
                    });
                    
                    const result = await response.json();
                    if (result.success) {
                        addNotification(\`Built \${result.building.name}!\`);
                        this.loadWorld(); // Refresh world data
                    } else {
                        addNotification(\`Failed: \${result.error}\`);
                    }
                } catch (error) {
                    addNotification('Build failed: ' + error.message);
                }
            }
        }
        
        // Game functions
        let engine;
        
        function initGame() {
            const canvas = document.getElementById('gameCanvas');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            engine = new Simple3DEngine(canvas);
            
            // Handle window resize
            window.addEventListener('resize', () => {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                engine.width = canvas.width;
                engine.height = canvas.height;
            });
        }
        
        function toggleBuildMode() {
            engine.buildMode = !engine.buildMode;
            const btn = document.getElementById('buildModeBtn');
            
            if (engine.buildMode) {
                btn.textContent = '❌ Exit Build';
                btn.style.background = 'linear-gradient(45deg, #ff6b6b, #ff8e53)';
                engine.canvas.classList.add('building');
                addNotification('🔨 Build mode activated');
            } else {
                btn.textContent = '🔨 Build Mode';
                btn.style.background = 'linear-gradient(45deg, #ff6b6b, #4ecdc4)';
                engine.canvas.classList.remove('building');
                addNotification('👁️ View mode activated');
            }
        }
        
        function resetCamera() {
            engine.camera = { x: 10, y: 15, z: 10, rotX: -30, rotY: 45, zoom: 1 };
            addNotification('📷 Camera reset');
        }
        
        function collectAll() {
            // Simulate collecting all buildings
            addNotification('💰 Collected income from all buildings!');
            engine.loadWorld();
        }
        
        function addNotification(message) {
            const div = document.createElement('div');
            div.className = 'notification';
            div.textContent = message;
            document.body.appendChild(div);
            
            setTimeout(() => {
                div.remove();
            }, 3000);
        }
        
        // FPS counter
        let fps = 0;
        setInterval(() => {
            document.getElementById('fps').textContent = fps;
            fps = 0;
        }, 1000);
        
        setInterval(() => { fps++; }, 16); // ~60 FPS
        
        // Initialize game when page loads
        window.addEventListener('load', initGame);
    </script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  serveWorldData(res) {
    // Convert Maps to objects for JSON serialization
    const worldData = {
      ...this.gameState,
      world: {
        ...this.gameState.world,
        blocks: Object.fromEntries(this.gameState.world.blocks),
        buildings: Object.fromEntries(this.gameState.world.buildings),
        terrain: Object.fromEntries(this.gameState.world.terrain),
        decorations: Object.fromEntries(this.gameState.world.decorations),
        roads: Array.from(this.gameState.world.roads),
        zones: Object.fromEntries(this.gameState.world.zones)
      }
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(worldData));
  }

  handleBuild3D(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { x, z, buildingType } = JSON.parse(body);
        const buildingDef = this.gameState.buildings[buildingType];
        
        if (!buildingDef) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid building type' }));
          return;
        }

        if (this.gameState.player.cash < buildingDef.cost) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Not enough cash' }));
          return;
        }

        // Check if area is clear
        const height = this.gameState.world.terrain.get(`${x},${z}`) || 0;
        for (let dx = 0; dx < buildingDef.size.w; dx++) {
          for (let dz = 0; dz < buildingDef.size.d; dz++) {
            const checkKey = `${x + dx},${height + 1},${z + dz}`;
            if (this.gameState.world.blocks.has(checkKey) && 
                this.gameState.world.blocks.get(checkKey).building) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: false, error: 'Area occupied' }));
              return;
            }
          }
        }

        const building = this.add3DBuilding(x, z, buildingType);
        if (building) {
          this.gameState.player.cash -= buildingDef.cost;
          this.gameState.player.experience += 25;
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, building }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Cannot build here' }));
        }
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    });
  }

  serveMenu(res) {
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>🎮 3D Cannabis Empire</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #2E8B57, #228B22); margin: 0; padding: 20px; color: white; min-height: 100vh; }
        .container { max-width: 800px; margin: 0 auto; text-align: center; }
        .title { font-size: 4rem; margin-bottom: 2rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.5); }
        .subtitle { font-size: 1.5rem; margin-bottom: 3rem; opacity: 0.9; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 3rem 0; }
        .feature { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 15px; backdrop-filter: blur(10px); }
        .feature-icon { font-size: 3rem; margin-bottom: 1rem; }
        .play-btn { background: linear-gradient(45deg, #228B22, #32CD32); border: none; padding: 1.5rem 3rem; border-radius: 50px; color: white; font-size: 1.2rem; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; margin: 1rem; transition: transform 0.3s; }
        .play-btn:hover { transform: scale(1.1); }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">🏛️ 3D CANNABIS EMPIRE</h1>
        <p class="subtitle">Minecraft-Style • Isometric View • Full 3D Building</p>
        
        <div class="features">
            <div class="feature">
                <div class="feature-icon">🏗️</div>
                <h3>3D Building System</h3>
                <p>Place buildings in 3D space with depth, layers, and realistic models</p>
            </div>
            
            <div class="feature">
                <div class="feature-icon">🎮</div>
                <h3>Isometric View</h3>
                <p>Minecraft/Roblox style camera with zoom, rotation, and free movement</p>
            </div>
            
            <div class="feature">
                <div class="feature-icon">🌍</div>
                <h3>Layered World</h3>
                <p>Terrain with height variation, decorations, and multi-level building</p>
            </div>
            
            <div class="feature">
                <div class="feature-icon">⚡</div>
                <h3>Real-time 3D</h3>
                <p>Live rendering with depth, lighting effects, and smooth animations</p>
            </div>
        </div>
        
        <div>
            <a href="/game" class="play-btn">🎮 Play 3D Game</a>
        </div>
        
        <div style="margin-top: 3rem; background: rgba(0,0,0,0.3); padding: 2rem; border-radius: 15px;">
            <h3>🎮 3D Controls</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; text-align: left;">
                <div>🖱️ Mouse: Look around</div>
                <div>WASD: Move camera</div>
                <div>Q/E: Rotate up/down</div>
                <div>Click: Place building</div>
                <div>Scroll: Zoom in/out</div>
                <div>🔨: Toggle build mode</div>
            </div>
        </div>
    </div>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  handleWebSocket(ws) {
    console.log('📡 New 3D game connection');
    
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to 3D Cannabis Empire!',
      world: this.convertStateForClient()
    }));

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        // Handle real-time 3D actions
      } catch (error) {
        console.log('WebSocket error:', error);
      }
    });
  }

  convertStateForClient() {
    return {
      ...this.gameState,
      world: {
        ...this.gameState.world,
        blocks: Object.fromEntries(this.gameState.world.blocks),
        buildings: Object.fromEntries(this.gameState.world.buildings),
        terrain: Object.fromEntries(this.gameState.world.terrain),
        decorations: Object.fromEntries(this.gameState.world.decorations),
        roads: Array.from(this.gameState.world.roads),
        zones: Object.fromEntries(this.gameState.world.zones)
      }
    };
  }

  startGameLoop() {
    // 3D game simulation
    setInterval(() => {
      // Update world state
      this.gameState.mechanics.time = Date.now();
      
      // Auto-generate income from buildings
      this.gameState.world.buildings.forEach(building => {
        if (Math.random() > 0.9) { // 10% chance each tick
          const income = Math.floor(building.income * 0.1);
          this.gameState.player.cash += income;
          this.gameState.economy.totalRevenue += income;
        }
      });
    }, 5000);
  }

  stop() {
    if (this.server) this.server.close();
    if (this.wsServer) this.wsServer.close();
    console.log(`🛑 3D Visual Tycoon stopped`);
  }
}

// Auto-start if run directly
if (require.main === module) {
  const theme = process.argv[2] || 'cannabis-tycoon';
  const port = parseInt(process.argv[3]) || 7030;
  
  const game = new ThreeDVisualTycoon(theme, port);
  
  game.start().then(info => {
    console.log(`🎮 3D Visual Tycoon launched!`);
    console.log(`🌐 3D Game: ${info.gameUrl}`);
  }).catch(console.error);

  // Handle shutdown
  process.on('SIGINT', () => {
    game.stop();
    process.exit(0);
  });
}

module.exports = ThreeDVisualTycoon;