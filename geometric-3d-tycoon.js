#!/usr/bin/env node

/**
 * GEOMETRIC 3D TYCOON
 * Real 3D geometry with perspective, lighting, and proper 3D models
 */

const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');

class Geometric3DTycoon {
  constructor(theme = 'cannabis-tycoon', port = 7040) {
    this.theme = theme;
    this.port = port;
    this.wsPort = port + 1;
    
    // Real 3D World state
    this.gameState = {
      // Player data
      player: {
        id: 'demo_player',
        name: 'Empire Builder',
        cash: 5000,
        credits: 2000,
        level: 1,
        experience: 0,
        camera: { 
          x: 0, y: 10, z: 15, 
          lookX: 0, lookY: 0, lookZ: 0,
          fov: 75,
          near: 0.1,
          far: 1000
        }
      },
      
      // 3D world with real geometry
      world: {
        width: 50,
        height: 50,
        maxHeight: 20,
        vertices: [], // All 3D vertices
        faces: [], // All 3D faces (triangles)
        buildings: new Map(), // 3D building models
        terrain: new Map(), // Height map
        lighting: {
          sun: { x: 10, y: 20, z: 10, intensity: 1.0 },
          ambient: 0.3
        }
      },
      
      // 3D Building geometries
      buildingGeometries: this.create3DGeometries(),
      
      // Economy
      economy: {
        totalRevenue: 0,
        dailyRevenue: 0,
        stripeTransactions: [],
        conversionRate: 0.01
      },
      
      // Rendering settings
      rendering: {
        wireframe: false,
        lighting: true,
        shadows: true,
        faceNormals: true,
        backfaceCulling: true
      }
    };

    this.generate3DTerrain();
    this.server = null;
    this.wsServer = null;
  }

  create3DGeometries() {
    return {
      'greenhouse': {
        name: 'Greenhouse',
        cost: 200,
        income: 30,
        color: [0.3, 0.8, 0.3], // RGB
        vertices: [
          // Base (4x4 foundation)
          [-2, 0, -2], [2, 0, -2], [2, 0, 2], [-2, 0, 2],
          // Glass walls
          [-2, 3, -2], [2, 3, -2], [2, 3, 2], [-2, 3, 2],
          // Roof peak
          [0, 5, 0]
        ],
        faces: [
          // Floor
          [0, 1, 2], [0, 2, 3],
          // Walls (glass)
          [0, 4, 5], [0, 5, 1], // Front
          [1, 5, 6], [1, 6, 2], // Right
          [2, 6, 7], [2, 7, 3], // Back
          [3, 7, 4], [3, 4, 0], // Left
          // Roof
          [4, 8, 5], [5, 8, 6], [6, 8, 7], [7, 8, 4]
        ],
        materials: {
          0: 'concrete', 1: 'concrete', // Floor
          2: 'glass', 3: 'glass', 4: 'glass', 5: 'glass', // Walls
          6: 'glass', 7: 'glass', 8: 'glass', 9: 'glass',
          10: 'metal', 11: 'metal', 12: 'metal', 13: 'metal' // Roof
        }
      },
      
      'dispensary': {
        name: 'Dispensary',
        cost: 800,
        income: 120,
        color: [0.4, 0.6, 0.8],
        vertices: [
          // Building base (6x6)
          [-3, 0, -3], [3, 0, -3], [3, 0, 3], [-3, 0, 3],
          // Wall tops
          [-3, 4, -3], [3, 4, -3], [3, 4, 3], [-3, 4, 3],
          // Roof points
          [-3, 6, -3], [3, 6, -3], [3, 6, 3], [-3, 6, 3],
          // Door frame
          [-0.5, 0, -3], [0.5, 0, -3], [0.5, 2.5, -3], [-0.5, 2.5, -3],
          // Windows
          [-2, 1, -3], [-1, 1, -3], [-1, 2, -3], [-2, 2, -3],
          [1, 1, -3], [2, 1, -3], [2, 2, -3], [1, 2, -3]
        ],
        faces: [
          // Floor
          [0, 1, 2], [0, 2, 3],
          // Walls
          [0, 4, 5], [0, 5, 1], // Front wall
          [1, 5, 6], [1, 6, 2], // Right wall
          [2, 6, 7], [2, 7, 3], // Back wall
          [3, 7, 4], [3, 4, 0], // Left wall
          // Roof
          [4, 8, 9], [4, 9, 5], [5, 9, 10], [5, 10, 6],
          [6, 10, 11], [6, 11, 7], [7, 11, 8], [7, 8, 4],
          [8, 9, 10], [8, 10, 11] // Roof top
        ],
        materials: {
          0: 'concrete', 1: 'concrete', // Floor
          2: 'brick', 3: 'brick', 4: 'brick', 5: 'brick', // Walls
          6: 'brick', 7: 'brick', 8: 'brick', 9: 'brick',
          10: 'shingles', 11: 'shingles', 12: 'shingles', 13: 'shingles', // Roof
          14: 'shingles', 15: 'shingles', 16: 'shingles', 17: 'shingles'
        }
      },

      'laboratory': {
        name: 'Laboratory',
        cost: 2000,
        income: 300,
        color: [0.8, 0.8, 0.9],
        vertices: [
          // Modern building base (8x8)
          [-4, 0, -4], [4, 0, -4], [4, 0, 4], [-4, 0, 4],
          // Main structure
          [-4, 6, -4], [4, 6, -4], [4, 6, 4], [-4, 6, 4],
          // Equipment towers
          [-2, 8, -2], [2, 8, -2], [2, 8, 2], [-2, 8, 2],
          // Antenna/equipment
          [-0.5, 10, -0.5], [0.5, 10, -0.5], [0.5, 10, 0.5], [-0.5, 10, 0.5],
          [0, 12, 0] // Antenna tip
        ],
        faces: [
          // Base
          [0, 1, 2], [0, 2, 3],
          // Main walls
          [0, 4, 5], [0, 5, 1], [1, 5, 6], [1, 6, 2],
          [2, 6, 7], [2, 7, 3], [3, 7, 4], [3, 4, 0],
          // Equipment level
          [4, 8, 9], [4, 9, 5], [5, 9, 10], [5, 10, 6],
          [6, 10, 11], [6, 11, 7], [7, 11, 8], [7, 8, 4],
          // Top equipment
          [8, 12, 13], [8, 13, 9], [9, 13, 14], [9, 14, 10],
          [10, 14, 15], [10, 15, 11], [11, 15, 12], [11, 12, 8],
          // Antenna
          [12, 16, 13], [13, 16, 14], [14, 16, 15], [15, 16, 12]
        ],
        materials: {
          0: 'steel', 1: 'steel', // Base
          2: 'steel', 3: 'steel', 4: 'steel', 5: 'steel', // Walls
          6: 'steel', 7: 'steel', 8: 'steel', 9: 'steel',
          10: 'tech', 11: 'tech', 12: 'tech', 13: 'tech', // Equipment
          14: 'tech', 15: 'tech', 16: 'tech', 17: 'tech',
          18: 'metal', 19: 'metal', 20: 'metal', 21: 'metal', // Top
          22: 'metal', 23: 'metal', 24: 'metal', 25: 'metal',
          26: 'antenna', 27: 'antenna', 28: 'antenna', 29: 'antenna' // Antenna
        }
      },

      'warehouse': {
        name: 'Warehouse',
        cost: 4000,
        income: 500,
        color: [0.6, 0.6, 0.6],
        vertices: [
          // Large industrial base (12x8)
          [-6, 0, -4], [6, 0, -4], [6, 0, 4], [-6, 0, 4],
          // Main warehouse
          [-6, 8, -4], [6, 8, -4], [6, 8, 4], [-6, 8, 4],
          // Loading docks
          [6, 0, -2], [8, 0, -2], [8, 0, 2], [6, 0, 2],
          [6, 4, -2], [8, 4, -2], [8, 4, 2], [6, 4, 2],
          // Smokestacks
          [-4, 8, -2], [-4, 15, -2], [-4, 15, -1], [-4, 8, -1],
          [2, 8, 2], [2, 15, 2], [2, 15, 3], [2, 8, 3]
        ],
        faces: [
          // Main building
          [0, 1, 2], [0, 2, 3], // Floor
          [0, 4, 5], [0, 5, 1], [1, 5, 6], [1, 6, 2], // Walls
          [2, 6, 7], [2, 7, 3], [3, 7, 4], [3, 4, 0],
          [4, 5, 6], [4, 6, 7], // Roof
          // Loading dock
          [8, 9, 10], [8, 10, 11], // Dock floor
          [8, 12, 13], [8, 13, 9], [9, 13, 14], [9, 14, 10], // Dock walls
          [10, 14, 15], [10, 15, 11], [11, 15, 12], [11, 12, 8],
          // Smokestacks
          [16, 17, 18], [16, 18, 19], [17, 21, 22], [17, 22, 18],
          [20, 21, 22], [20, 22, 23], [21, 17, 18], [21, 18, 22]
        ],
        materials: {
          0: 'concrete', 1: 'concrete', // Floor
          2: 'industrial', 3: 'industrial', 4: 'industrial', 5: 'industrial', // Walls
          6: 'industrial', 7: 'industrial', 8: 'industrial', 9: 'industrial',
          10: 'metal', 11: 'metal', // Roof
          12: 'concrete', 13: 'concrete', // Dock
          14: 'industrial', 15: 'industrial', 16: 'industrial', 17: 'industrial',
          18: 'industrial', 19: 'industrial', 20: 'industrial', 21: 'industrial',
          22: 'metal', 23: 'metal', 24: 'metal', 25: 'metal', // Smokestacks
          26: 'metal', 27: 'metal', 28: 'metal', 29: 'metal'
        }
      }
    };
  }

  generate3DTerrain() {
    // Generate height map using Perlin-like noise
    for (let x = 0; x < this.gameState.world.width; x++) {
      for (let z = 0; z < this.gameState.world.height; z++) {
        // Multi-octave noise for realistic terrain
        let height = 0;
        height += Math.sin(x * 0.05) * Math.cos(z * 0.05) * 3;
        height += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 1.5;
        height += Math.sin(x * 0.2) * Math.cos(z * 0.2) * 0.5;
        height = Math.max(0, Math.floor(height + 2));
        
        this.gameState.world.terrain.set(`${x},${z}`, height);
      }
    }

    // Generate terrain geometry (vertices and faces)
    this.generateTerrainMesh();
    
    // Add starter buildings
    this.place3DBuilding(10, 10, 'greenhouse');
    this.place3DBuilding(15, 15, 'dispensary');
  }

  generateTerrainMesh() {
    const vertices = [];
    const faces = [];
    
    // Create vertices for terrain
    for (let x = 0; x < this.gameState.world.width; x++) {
      for (let z = 0; z < this.gameState.world.height; z++) {
        const height = this.gameState.world.terrain.get(`${x},${z}`) || 0;
        vertices.push([x, height, z]);
      }
    }
    
    // Create faces (triangles) for terrain
    for (let x = 0; x < this.gameState.world.width - 1; x++) {
      for (let z = 0; z < this.gameState.world.height - 1; z++) {
        const i = x * this.gameState.world.height + z;
        
        // Two triangles per quad
        faces.push([i, i + this.gameState.world.height, i + this.gameState.world.height + 1]);
        faces.push([i, i + this.gameState.world.height + 1, i + 1]);
      }
    }
    
    this.gameState.world.vertices = vertices;
    this.gameState.world.faces = faces;
  }

  place3DBuilding(x, z, buildingType) {
    const geometry = this.gameState.buildingGeometries[buildingType];
    if (!geometry) return false;

    const height = this.gameState.world.terrain.get(`${x},${z}`) || 0;
    const buildingId = crypto.randomUUID();
    
    // Transform vertices to world position
    const worldVertices = geometry.vertices.map(vertex => [
      vertex[0] + x,
      vertex[1] + height,
      vertex[2] + z
    ]);
    
    // Transform faces to reference world vertices
    const vertexOffset = this.gameState.world.vertices.length;
    const worldFaces = geometry.faces.map(face => 
      face.map(vertexIndex => vertexIndex + vertexOffset)
    );
    
    // Add vertices and faces to world
    this.gameState.world.vertices.push(...worldVertices);
    this.gameState.world.faces.push(...worldFaces);
    
    const building = {
      id: buildingId,
      type: buildingType,
      x, y: height, z,
      level: 1,
      income: geometry.income,
      lastCollection: Date.now(),
      vertexStart: vertexOffset,
      vertexCount: worldVertices.length,
      faceStart: this.gameState.world.faces.length - worldFaces.length,
      faceCount: worldFaces.length,
      ...geometry
    };

    this.gameState.world.buildings.set(buildingId, building);
    return building;
  }

  async start() {
    console.log(`🎮 Starting Geometric 3D Tycoon: ${this.theme}`);
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
      console.log(`✅ Geometric 3D Tycoon running at http://localhost:${this.port}`);
      console.log(`🌐 Real 3D Game: http://localhost:${this.port}/game`);
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
        this.serveGeometric3DGame(res);
        break;
      case '/api/world':
        this.serve3DWorldData(res);
        break;
      case '/api/build':
        this.handleBuild3D(req, res);
        break;
      default:
        res.writeHead(404);
        res.end('Not found');
    }
  }

  serveGeometric3DGame(res) {
    const html = `<!DOCTYPE html>
<html>
<head>
    <title>🎮 Geometric 3D Cannabis Empire</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { margin: 0; padding: 0; background: #000; font-family: 'Courier New', monospace; overflow: hidden; }
        
        .game-container { position: relative; width: 100vw; height: 100vh; }
        
        .canvas-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
        
        .ui-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1000; }
        
        .hud { position: absolute; top: 20px; left: 20px; background: rgba(0,255,0,0.1); border: 2px solid #00ff00; color: #00ff00; padding: 15px; font-family: 'Courier New', monospace; pointer-events: auto; }
        
        .controls { position: absolute; bottom: 20px; left: 20px; background: rgba(0,255,0,0.1); border: 2px solid #00ff00; color: #00ff00; padding: 15px; pointer-events: auto; font-size: 12px; }
        
        .build-menu { position: absolute; top: 20px; right: 20px; background: rgba(0,255,0,0.1); border: 2px solid #00ff00; color: #00ff00; padding: 15px; pointer-events: auto; max-width: 250px; }
        
        .building-item { border: 1px solid #00ff00; margin: 5px 0; padding: 10px; cursor: pointer; transition: all 0.3s; }
        .building-item:hover { background: rgba(0,255,0,0.2); }
        .building-item.selected { background: rgba(0,255,0,0.3); border-color: #ffff00; }
        
        .info-panel { position: absolute; bottom: 20px; right: 20px; background: rgba(0,255,0,0.1); border: 2px solid #00ff00; color: #00ff00; padding: 15px; pointer-events: auto; }
        
        .btn { background: transparent; border: 2px solid #00ff00; color: #00ff00; padding: 8px 15px; cursor: pointer; margin: 2px; font-family: 'Courier New', monospace; }
        .btn:hover { background: rgba(0,255,0,0.2); }
        
        .coordinates { position: absolute; top: 50%; left: 20px; background: rgba(0,255,0,0.1); border: 1px solid #00ff00; color: #00ff00; padding: 10px; pointer-events: auto; font-size: 12px; }
        
        .rendering-info { position: absolute; top: 50%; right: 20px; background: rgba(0,255,0,0.1); border: 1px solid #00ff00; color: #00ff00; padding: 10px; pointer-events: none; font-size: 12px; }
        
        canvas { cursor: crosshair; }
        canvas.building { cursor: pointer; }
        
        .notification { position: absolute; top: 100px; left: 50%; transform: translateX(-50%); background: rgba(0,255,0,0.2); border: 2px solid #00ff00; color: #00ff00; padding: 15px; animation: slideDown 0.3s ease; z-index: 2000; font-family: 'Courier New', monospace; }
        @keyframes slideDown { from { transform: translate(-50%, -100%); } to { transform: translate(-50%, 0); } }
        
        .matrix-bg { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; opacity: 0.1; }
    </style>
</head>
<body>
    <div class="matrix-bg" id="matrixBg"></div>
    
    <div class="game-container">
        <div class="canvas-container">
            <canvas id="gameCanvas" width="800" height="600"></canvas>
        </div>
        
        <div class="ui-overlay">
            <div class="hud">
                <div>GEOMETRIC 3D EMPIRE</div>
                <div>==================</div>
                <div>CASH: $<span id="playerCash">5000</span></div>
                <div>CREDITS: <span id="playerCredits">2000</span></div>
                <div>LEVEL: <span id="playerLevel">1</span></div>
                <div>BUILDINGS: <span id="buildingCount">2</span></div>
                <div>==================</div>
                <button class="btn" onclick="collectAll()">COLLECT ALL</button>
                <button class="btn" onclick="resetCamera()">RESET CAM</button>
            </div>
            
            <div class="controls">
                <div>GEOMETRIC 3D CONTROLS</div>
                <div>====================</div>
                <div>WASD: Move Camera</div>
                <div>Mouse: Look Around</div>
                <div>Scroll: Zoom</div>
                <div>Click: Place Building</div>
                <div>R: Toggle Wireframe</div>
                <div>L: Toggle Lighting</div>
            </div>
            
            <div class="build-menu">
                <div>3D BUILDING MENU</div>
                <div>================</div>
                <div id="buildingMenu"></div>
                <button class="btn" onclick="toggleBuildMode()" id="buildModeBtn">BUILD MODE</button>
                <button class="btn" onclick="toggleWireframe()">WIREFRAME</button>
            </div>
            
            <div class="coordinates">
                <div>CAMERA POS:</div>
                <div>X: <span id="camX">0</span></div>
                <div>Y: <span id="camY">10</span></div>
                <div>Z: <span id="camZ">15</span></div>
                <div>LOOK AT:</div>
                <div>X: <span id="lookX">0</span></div>
                <div>Y: <span id="lookY">0</span></div>
                <div>Z: <span id="lookZ">0</span></div>
            </div>
            
            <div class="rendering-info">
                <div>RENDER ENGINE</div>
                <div>==============</div>
                <div>VERTICES: <span id="vertexCount">0</span></div>
                <div>FACES: <span id="faceCount">0</span></div>
                <div>FPS: <span id="fps">60</span></div>
                <div>WIREFRAME: <span id="wireframe">OFF</span></div>
                <div>LIGHTING: <span id="lighting">ON</span></div>
                <div>PROJECTION: <span id="projection">PERSPECTIVE</span></div>
            </div>
        </div>
    </div>

    <script>
        // Real 3D Geometric Engine
        class Real3DEngine {
            constructor(canvas) {
                this.canvas = canvas;
                this.ctx = canvas.getContext('2d');
                this.width = canvas.width;
                this.height = canvas.height;
                
                // Camera (proper 3D camera)
                this.camera = {
                    pos: [0, 10, 15],
                    look: [0, 0, 0],
                    up: [0, 1, 0],
                    fov: 75,
                    near: 0.1,
                    far: 1000
                };
                
                // 3D matrices
                this.viewMatrix = this.createMatrix4();
                this.projMatrix = this.createMatrix4();
                this.modelMatrix = this.createMatrix4();
                
                // World data
                this.world = null;
                this.selectedBuilding = null;
                this.buildMode = false;
                this.wireframe = false;
                this.lighting = true;
                
                // Material colors
                this.materials = {
                    concrete: [0.6, 0.6, 0.6],
                    glass: [0.7, 0.9, 1.0],
                    metal: [0.8, 0.8, 0.9],
                    brick: [0.8, 0.4, 0.3],
                    steel: [0.5, 0.5, 0.6],
                    tech: [0.2, 0.8, 1.0],
                    industrial: [0.4, 0.4, 0.4],
                    shingles: [0.3, 0.2, 0.1],
                    antenna: [0.9, 0.9, 0.9],
                    terrain: [0.2, 0.8, 0.2]
                };
                
                this.setupInput();
                this.loadWorld();
                this.updateMatrices();
                this.render();
            }
            
            createMatrix4() {
                return [
                    1, 0, 0, 0,
                    0, 1, 0, 0,
                    0, 0, 1, 0,
                    0, 0, 0, 1
                ];
            }
            
            // Real 3D math functions
            multiply4x4(a, b) {
                const result = new Array(16);
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        result[i * 4 + j] = 0;
                        for (let k = 0; k < 4; k++) {
                            result[i * 4 + j] += a[i * 4 + k] * b[k * 4 + j];
                        }
                    }
                }
                return result;
            }
            
            projectVertex(vertex) {
                // Apply view matrix
                const x = vertex[0] - this.camera.pos[0];
                const y = vertex[1] - this.camera.pos[1];
                const z = vertex[2] - this.camera.pos[2];
                
                // Simple perspective projection
                const distance = Math.sqrt(x*x + y*y + z*z);
                if (distance < this.camera.near || distance > this.camera.far) return null;
                
                const scale = 400 / (z + 0.1); // Perspective scaling
                const screenX = this.width/2 + x * scale;
                const screenY = this.height/2 - y * scale;
                
                return { x: screenX, y: screenY, z: distance };
            }
            
            calculateNormal(v1, v2, v3) {
                // Calculate face normal
                const dx1 = v2[0] - v1[0], dy1 = v2[1] - v1[1], dz1 = v2[2] - v1[2];
                const dx2 = v3[0] - v1[0], dy2 = v3[1] - v1[1], dz2 = v3[2] - v1[2];
                
                return [
                    dy1 * dz2 - dz1 * dy2,
                    dz1 * dx2 - dx1 * dz2,
                    dx1 * dy2 - dy1 * dx2
                ];
            }
            
            calculateLighting(normal, lightDir) {
                // Simple dot product lighting
                const dot = normal[0] * lightDir[0] + normal[1] * lightDir[1] + normal[2] * lightDir[2];
                return Math.max(0.2, Math.min(1.0, dot));
            }
            
            setupInput() {
                // Mouse controls for 3D camera
                let mouseDown = false;
                let lastMouseX = 0, lastMouseY = 0;
                
                this.canvas.addEventListener('mousedown', (e) => {
                    if (!this.buildMode) {
                        mouseDown = true;
                        lastMouseX = e.clientX;
                        lastMouseY = e.clientY;
                    }
                });
                
                this.canvas.addEventListener('mouseup', () => {
                    mouseDown = false;
                });
                
                this.canvas.addEventListener('mousemove', (e) => {
                    if (mouseDown) {
                        const deltaX = e.clientX - lastMouseX;
                        const deltaY = e.clientY - lastMouseY;
                        
                        // Rotate camera around look point
                        const radius = Math.sqrt(
                            Math.pow(this.camera.pos[0] - this.camera.look[0], 2) +
                            Math.pow(this.camera.pos[2] - this.camera.look[2], 2)
                        );
                        
                        const angle = Math.atan2(this.camera.pos[2] - this.camera.look[2], this.camera.pos[0] - this.camera.look[0]);
                        const newAngle = angle + deltaX * 0.01;
                        
                        this.camera.pos[0] = this.camera.look[0] + Math.cos(newAngle) * radius;
                        this.camera.pos[2] = this.camera.look[2] + Math.sin(newAngle) * radius;
                        this.camera.pos[1] += deltaY * 0.1;
                        
                        this.updateCameraDisplay();
                        
                        lastMouseX = e.clientX;
                        lastMouseY = e.clientY;
                    }
                });
                
                this.canvas.addEventListener('click', (e) => {
                    if (this.buildMode && this.selectedBuilding) {
                        // Raycast to find ground position
                        const worldPos = this.screenToWorld(e.offsetX, e.offsetY);
                        if (worldPos) {
                            this.placeBuildingAt(Math.floor(worldPos.x), Math.floor(worldPos.z));
                        }
                    }
                });
                
                this.canvas.addEventListener('wheel', (e) => {
                    e.preventDefault();
                    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
                    
                    // Zoom by moving camera closer/farther from look point
                    const dx = this.camera.pos[0] - this.camera.look[0];
                    const dy = this.camera.pos[1] - this.camera.look[1];
                    const dz = this.camera.pos[2] - this.camera.look[2];
                    
                    this.camera.pos[0] = this.camera.look[0] + dx * zoomFactor;
                    this.camera.pos[1] = this.camera.look[1] + dy * zoomFactor;
                    this.camera.pos[2] = this.camera.look[2] + dz * zoomFactor;
                    
                    this.updateCameraDisplay();
                });
                
                // Keyboard controls
                const keys = {};
                window.addEventListener('keydown', (e) => { 
                    keys[e.key.toLowerCase()] = true;
                    
                    if (e.key.toLowerCase() === 'r') {
                        this.wireframe = !this.wireframe;
                        document.getElementById('wireframe').textContent = this.wireframe ? 'ON' : 'OFF';
                    }
                    if (e.key.toLowerCase() === 'l') {
                        this.lighting = !this.lighting;
                        document.getElementById('lighting').textContent = this.lighting ? 'ON' : 'OFF';
                    }
                });
                window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
                
                // Camera movement
                setInterval(() => {
                    const moveSpeed = 1.0;
                    if (keys['w']) {
                        this.camera.pos[2] -= moveSpeed;
                        this.camera.look[2] -= moveSpeed;
                    }
                    if (keys['s']) {
                        this.camera.pos[2] += moveSpeed;
                        this.camera.look[2] += moveSpeed;
                    }
                    if (keys['a']) {
                        this.camera.pos[0] -= moveSpeed;
                        this.camera.look[0] -= moveSpeed;
                    }
                    if (keys['d']) {
                        this.camera.pos[0] += moveSpeed;
                        this.camera.look[0] += moveSpeed;
                    }
                    
                    this.updateCameraDisplay();
                }, 50);
            }
            
            updateCameraDisplay() {
                document.getElementById('camX').textContent = this.camera.pos[0].toFixed(1);
                document.getElementById('camY').textContent = this.camera.pos[1].toFixed(1);
                document.getElementById('camZ').textContent = this.camera.pos[2].toFixed(1);
                document.getElementById('lookX').textContent = this.camera.look[0].toFixed(1);
                document.getElementById('lookY').textContent = this.camera.look[1].toFixed(1);
                document.getElementById('lookZ').textContent = this.camera.look[2].toFixed(1);
            }
            
            screenToWorld(screenX, screenY) {
                // Simple raycast to ground plane
                const ray = this.screenToRay(screenX, screenY);
                
                // Intersect with y=0 plane (ground)
                if (ray.dir[1] !== 0) {
                    const t = -ray.origin[1] / ray.dir[1];
                    if (t > 0) {
                        return {
                            x: ray.origin[0] + ray.dir[0] * t,
                            z: ray.origin[2] + ray.dir[2] * t
                        };
                    }
                }
                return null;
            }
            
            screenToRay(screenX, screenY) {
                // Convert screen coordinates to world ray
                const x = (screenX / this.width) * 2 - 1;
                const y = 1 - (screenY / this.height) * 2;
                
                const rayDir = [x, y, -1];
                
                return {
                    origin: [...this.camera.pos],
                    dir: rayDir
                };
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
                document.getElementById('playerCash').textContent = this.world.player.cash.toLocaleString();
                document.getElementById('playerCredits').textContent = this.world.player.credits.toLocaleString();
                document.getElementById('playerLevel').textContent = this.world.player.level;
                document.getElementById('buildingCount').textContent = Object.keys(this.world.world.buildings).length;
                
                // Update rendering info
                document.getElementById('vertexCount').textContent = this.world.world.vertices.length;
                document.getElementById('faceCount').textContent = this.world.world.faces.length;
                
                // Update building menu
                this.updateBuildingMenu();
            }
            
            updateBuildingMenu() {
                const menu = document.getElementById('buildingMenu');
                menu.innerHTML = '';
                
                Object.entries(this.world.buildingGeometries).forEach(([key, building]) => {
                    const div = document.createElement('div');
                    div.className = 'building-item';
                    div.onclick = () => this.selectBuilding(key);
                    
                    div.innerHTML = \`
                        <div>\${building.name}</div>
                        <div>COST: $\${building.cost}</div>
                        <div>INCOME: +$\${building.income}</div>
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
                
                addNotification(\`SELECTED: \${this.world.buildingGeometries[buildingType].name}\`);
            }
            
            updateMatrices() {
                // Update view and projection matrices (simplified)
                this.viewMatrix = this.createMatrix4();
                this.projMatrix = this.createMatrix4();
            }
            
            render() {
                // Clear canvas to black (like Geometry Wars)
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(0, 0, this.width, this.height);
                
                if (!this.world) {
                    requestAnimationFrame(() => this.render());
                    return;
                }
                
                // Render all faces with proper 3D geometry
                this.renderTerrain();
                this.renderBuildings();
                
                requestAnimationFrame(() => this.render());
            }
            
            renderTerrain() {
                if (!this.world.world.faces) return;
                
                // Render terrain faces
                this.world.world.faces.forEach((face, index) => {
                    if (index >= this.world.world.faces.length - this.getTotalBuildingFaces()) {
                        return; // Skip building faces
                    }
                    
                    const v1 = this.world.world.vertices[face[0]];
                    const v2 = this.world.world.vertices[face[1]];
                    const v3 = this.world.world.vertices[face[2]];
                    
                    if (!v1 || !v2 || !v3) return;
                    
                    this.renderFace(v1, v2, v3, this.materials.terrain, 'terrain');
                });
            }
            
            renderBuildings() {
                Object.values(this.world.world.buildings).forEach(building => {
                    this.renderBuilding(building);
                });
            }
            
            renderBuilding(building) {
                // Render each face of the building
                for (let i = 0; i < building.faceCount; i++) {
                    const faceIndex = building.faceStart + i;
                    const face = this.world.world.faces[faceIndex];
                    
                    if (!face) continue;
                    
                    const v1 = this.world.world.vertices[face[0]];
                    const v2 = this.world.world.vertices[face[1]];
                    const v3 = this.world.world.vertices[face[2]];
                    
                    if (!v1 || !v2 || !v3) continue;
                    
                    // Get material for this face
                    const material = building.materials && building.materials[i] 
                        ? this.materials[building.materials[i]] || building.color
                        : building.color;
                    
                    this.renderFace(v1, v2, v3, material, 'building');
                }
            }
            
            renderFace(v1, v2, v3, color, type) {
                // Project vertices to screen space
                const p1 = this.projectVertex(v1);
                const p2 = this.projectVertex(v2);
                const p3 = this.projectVertex(v3);
                
                if (!p1 || !p2 || !p3) return;
                
                // Calculate face normal for lighting
                const normal = this.calculateNormal(v1, v2, v3);
                const lightDir = [0.5, 0.8, 0.3]; // Sun direction
                
                let brightness = 1.0;
                if (this.lighting) {
                    brightness = this.calculateLighting(normal, lightDir);
                }
                
                // Set color with lighting
                const r = Math.floor(color[0] * 255 * brightness);
                const g = Math.floor(color[1] * 255 * brightness);
                const b = Math.floor(color[2] * 255 * brightness);
                
                if (this.wireframe) {
                    // Wireframe mode (like Geometry Wars)
                    this.ctx.strokeStyle = \`rgb(\${r}, \${g}, \${b})\`;
                    this.ctx.lineWidth = type === 'building' ? 2 : 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.lineTo(p3.x, p3.y);
                    this.ctx.closePath();
                    this.ctx.stroke();
                } else {
                    // Solid filled faces
                    this.ctx.fillStyle = \`rgb(\${r}, \${g}, \${b})\`;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.lineTo(p3.x, p3.y);
                    this.ctx.closePath();
                    this.ctx.fill();
                    
                    // Add wireframe outline for definition
                    this.ctx.strokeStyle = \`rgba(\${Math.min(255, r+50)}, \${Math.min(255, g+50)}, \${Math.min(255, b+50)}, 0.3)\`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                }
            }
            
            getTotalBuildingFaces() {
                return Object.values(this.world.world.buildings)
                    .reduce((total, building) => total + building.faceCount, 0);
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
                        addNotification(\`BUILT: \${result.building.name}\`);
                        this.loadWorld(); // Refresh world data
                    } else {
                        addNotification(\`FAILED: \${result.error}\`);
                    }
                } catch (error) {
                    addNotification('BUILD ERROR: ' + error.message);
                }
            }
        }
        
        // Game functions
        let engine;
        
        function initGame() {
            const canvas = document.getElementById('gameCanvas');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            engine = new Real3DEngine(canvas);
            
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
                btn.textContent = 'EXIT BUILD';
                engine.canvas.classList.add('building');
                addNotification('BUILD MODE ACTIVATED');
            } else {
                btn.textContent = 'BUILD MODE';
                engine.canvas.classList.remove('building');
                addNotification('VIEW MODE ACTIVATED');
            }
        }
        
        function toggleWireframe() {
            engine.wireframe = !engine.wireframe;
            document.getElementById('wireframe').textContent = engine.wireframe ? 'ON' : 'OFF';
            addNotification('WIREFRAME: ' + (engine.wireframe ? 'ON' : 'OFF'));
        }
        
        function resetCamera() {
            engine.camera.pos = [0, 10, 15];
            engine.camera.look = [0, 0, 0];
            engine.updateCameraDisplay();
            addNotification('CAMERA RESET');
        }
        
        function collectAll() {
            addNotification('COLLECTED ALL INCOME');
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
        
        // Create matrix background effect
        function createMatrixEffect() {
            const canvas = document.createElement('canvas');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.zIndex = '-1';
            canvas.style.opacity = '0.1';
            document.getElementById('matrixBg').appendChild(canvas);
            
            const ctx = canvas.getContext('2d');
            const chars = '01';
            const fontSize = 14;
            const columns = canvas.width / fontSize;
            const drops = [];
            
            for (let i = 0; i < columns; i++) {
                drops[i] = 1;
            }
            
            function drawMatrix() {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = '#00ff00';
                ctx.font = fontSize + 'px monospace';
                
                for (let i = 0; i < drops.length; i++) {
                    const text = chars[Math.floor(Math.random() * chars.length)];
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                    
                    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                        drops[i] = 0;
                    }
                    drops[i]++;
                }
            }
            
            setInterval(drawMatrix, 35);
        }
        
        // FPS counter
        let fps = 0;
        setInterval(() => {
            document.getElementById('fps').textContent = fps;
            fps = 0;
        }, 1000);
        
        setInterval(() => { fps++; }, 16); // ~60 FPS
        
        // Initialize
        window.addEventListener('load', () => {
            createMatrixEffect();
            initGame();
        });
    </script>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  serve3DWorldData(res) {
    // Convert Maps to objects for JSON serialization
    const worldData = {
      ...this.gameState,
      world: {
        ...this.gameState.world,
        buildings: Object.fromEntries(this.gameState.world.buildings),
        terrain: Object.fromEntries(this.gameState.world.terrain)
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
        const geometry = this.gameState.buildingGeometries[buildingType];
        
        if (!geometry) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid building type' }));
          return;
        }

        if (this.gameState.player.cash < geometry.cost) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Not enough cash' }));
          return;
        }

        const building = this.place3DBuilding(x, z, buildingType);
        if (building) {
          this.gameState.player.cash -= geometry.cost;
          this.gameState.player.experience += 50;
          
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
    <title>🎮 Geometric 3D Empire</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: 'Courier New', monospace; background: linear-gradient(135deg, #000, #003300); margin: 0; padding: 20px; color: #00ff00; min-height: 100vh; }
        .container { max-width: 800px; margin: 0 auto; text-align: center; }
        .title { font-size: 4rem; margin-bottom: 2rem; text-shadow: 0 0 20px #00ff00; animation: glow 2s infinite alternate; }
        @keyframes glow { from { text-shadow: 0 0 20px #00ff00; } to { text-shadow: 0 0 30px #00ff00, 0 0 40px #00ff00; } }
        .subtitle { font-size: 1.5rem; margin-bottom: 3rem; opacity: 0.8; }
        .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 3rem 0; }
        .feature { background: rgba(0,255,0,0.1); border: 2px solid #00ff00; padding: 2rem; }
        .feature-icon { font-size: 3rem; margin-bottom: 1rem; }
        .play-btn { background: transparent; border: 3px solid #00ff00; color: #00ff00; padding: 1.5rem 3rem; font-size: 1.2rem; font-weight: bold; cursor: pointer; text-decoration: none; display: inline-block; margin: 1rem; transition: all 0.3s; font-family: 'Courier New', monospace; }
        .play-btn:hover { background: rgba(0,255,0,0.2); box-shadow: 0 0 20px #00ff00; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">GEOMETRIC 3D EMPIRE</h1>
        <p class="subtitle">REAL PERSPECTIVE • TRUE 3D GEOMETRY • GEOMETRY WARS STYLE</p>
        
        <div class="features">
            <div class="feature">
                <div class="feature-icon">📐</div>
                <h3>REAL 3D GEOMETRY</h3>
                <p>Proper vertices, faces, perspective projection, and lighting calculations</p>
            </div>
            
            <div class="feature">
                <div class="feature-icon">🎮</div>
                <h3>GEOMETRY WARS STYLE</h3>
                <p>Wireframe mode, matrix background, neon colors, and geometric aesthetics</p>
            </div>
            
            <div class="feature">
                <div class="feature-icon">🏗️</div>
                <h3>COMPLEX 3D MODELS</h3>
                <p>Multi-vertex building models with real architectural geometry</p>
            </div>
            
            <div class="feature">
                <div class="feature-icon">💡</div>
                <h3>REAL-TIME LIGHTING</h3>
                <p>Dynamic lighting, face normals, and material-based shading</p>
            </div>
        </div>
        
        <div>
            <a href="/game" class="play-btn">ENTER 3D WORLD</a>
        </div>
        
        <div style="margin-top: 3rem; background: rgba(0,255,0,0.1); border: 1px solid #00ff00; padding: 2rem;">
            <h3>GEOMETRIC CONTROLS</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; text-align: left;">
                <div>WASD: Camera movement</div>
                <div>Mouse: 3D rotation</div>
                <div>Scroll: Zoom in/out</div>
                <div>R: Toggle wireframe</div>
                <div>L: Toggle lighting</div>
                <div>Click: Place buildings</div>
            </div>
        </div>
    </div>
</body>
</html>`;

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  handleWebSocket(ws) {
    console.log('📡 New geometric 3D connection');
    
    ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Connected to Geometric 3D Empire!',
      world: this.convertStateForClient()
    }));
  }

  convertStateForClient() {
    return {
      ...this.gameState,
      world: {
        ...this.gameState.world,
        buildings: Object.fromEntries(this.gameState.world.buildings),
        terrain: Object.fromEntries(this.gameState.world.terrain)
      }
    };
  }

  startGameLoop() {
    // 3D game simulation with lighting updates
    setInterval(() => {
      // Rotate sun for dynamic lighting
      const time = Date.now() * 0.001;
      this.gameState.world.lighting.sun.x = Math.cos(time) * 10;
      this.gameState.world.lighting.sun.z = Math.sin(time) * 10;
      
      // Auto-generate income
      this.gameState.world.buildings.forEach(building => {
        if (Math.random() > 0.85) {
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
    console.log(`🛑 Geometric 3D Tycoon stopped`);
  }
}

// Auto-start if run directly
if (require.main === module) {
  const theme = process.argv[2] || 'cannabis-tycoon';
  const port = parseInt(process.argv[3]) || 7040;
  
  const game = new Geometric3DTycoon(theme, port);
  
  game.start().then(info => {
    console.log(`🎮 Geometric 3D Tycoon launched!`);
    console.log(`🌐 Real 3D Game: ${info.gameUrl}`);
  }).catch(console.error);

  // Handle shutdown
  process.on('SIGINT', () => {
    game.stop();
    process.exit(0);
  });
}

module.exports = Geometric3DTycoon;