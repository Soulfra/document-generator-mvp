#!/usr/bin/env node

/**
 * 🧊 VOXEL EVERYTHING INTERFACE
 * 
 * Unified 3D voxel environment that integrates all systems:
 * - Documents become buildable 3D structures
 * - Learning concepts as explorable worlds
 * - Gaming mechanics in voxel space
 * - Token economy as in-world currency
 * - Real-time collaboration in shared 3D space
 * - Maximum visual integration achieved
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const https = require('https');
const path = require('path');

// Universal HTTP client
const universalFetch = (url, options = {}) => {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const isHttps = urlObj.protocol === 'https:';
        const httpModule = isHttps ? https : http;
        
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port || (isHttps ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };
        
        const req = httpModule.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        data: data ? JSON.parse(data) : null
                    });
                } catch {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        data: data
                    });
                }
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        }
        
        req.end();
    });
};

class VoxelEverythingInterface {
    constructor() {
        console.log('🧊 VOXEL EVERYTHING INTERFACE');
        console.log('==============================');
        console.log('🌐 Unified 3D environment for all systems');
        console.log('📄 Documents → 🏗️ 3D Structures');
        console.log('🎮 Gaming → 🌍 Voxel Worlds');
        console.log('📚 Learning → 🏛️ Knowledge Buildings');
        console.log('🪙 Tokens → 💎 In-World Currency');
        console.log('');
        
        // Configuration
        this.config = {
            port: process.env.VOXEL_PORT || 7300,
            wsPort: process.env.VOXEL_WS_PORT || 7301,
            chunkSize: 16,
            maxViewDistance: 10,
            voxelSize: 1.0,
            worldHeight: 256
        };
        
        // Service connections
        this.services = {
            documents: process.env.DOCUMENT_GENERATOR_URL || 'http://localhost:3000',
            gaming: process.env.GAMING_PLATFORM_URL || 'http://localhost:8800',
            learning: process.env.LEARNING_PLATFORM_URL || 'http://localhost:7000',
            tokens: process.env.TOKEN_ECONOMY_URL || 'http://localhost:9495',
            orchestrator: process.env.INTEGRATION_ORCHESTRATOR_URL || 'http://localhost:9000'
        };
        
        // 3D World State
        this.voxelWorld = {
            chunks: new Map(),        // World chunks
            entities: new Map(),      // Dynamic entities (players, objects)
            structures: new Map(),    // Built structures
            documents: new Map(),     // Document visualizations
            learningAreas: new Map(), // Learning zones
            gamingAreas: new Map(),   // Gaming zones
            tokenStores: new Map()    // Token economy buildings
        };
        
        // Connected clients
        this.clients = new Map();
        
        // Real-time collaboration
        this.collaborativeSessions = new Map();
        
        // Material definitions for different systems
        this.materials = {
            // Document materials
            document: { color: 0x3498db, emission: 0.1, name: 'Document Blue' },
            template: { color: 0x2ecc71, emission: 0.1, name: 'Template Green' },
            mvp: { color: 0xe74c3c, emission: 0.2, name: 'MVP Red' },
            
            // Learning materials
            concept: { color: 0x9b59b6, emission: 0.15, name: 'Concept Purple' },
            skill: { color: 0xf39c12, emission: 0.1, name: 'Skill Orange' },
            achievement: { color: 0xf1c40f, emission: 0.3, name: 'Achievement Gold' },
            
            // Gaming materials
            player: { color: 0x1abc9c, emission: 0.1, name: 'Player Teal' },
            obstacle: { color: 0x34495e, emission: 0.0, name: 'Obstacle Gray' },
            powerup: { color: 0xe67e22, emission: 0.4, name: 'Powerup Orange' },
            
            // Token materials
            token: { color: 0xffd700, emission: 0.5, name: 'Token Gold' },
            reward: { color: 0xff6b6b, emission: 0.3, name: 'Reward Red' },
            store: { color: 0x4ecdc4, emission: 0.2, name: 'Store Cyan' }
        };
        
        // Voxel type mappings for different content
        this.voxelMappings = new Map([
            // Document types
            ['markdown', { material: 'document', height: 5, pattern: 'solid' }],
            ['pdf', { material: 'document', height: 8, pattern: 'layered' }],
            ['code', { material: 'template', height: 12, pattern: 'structured' }],
            ['mvp', { material: 'mvp', height: 20, pattern: 'complex' }],
            
            // Learning types
            ['concept', { material: 'concept', height: 6, pattern: 'crystalline' }],
            ['skill', { material: 'skill', height: 4, pattern: 'organic' }],
            ['milestone', { material: 'achievement', height: 10, pattern: 'monument' }],
            
            // Gaming types
            ['level', { material: 'player', height: 15, pattern: 'terrain' }],
            ['achievement', { material: 'achievement', height: 8, pattern: 'trophy' }],
            ['powerup', { material: 'powerup', height: 3, pattern: 'floating' }],
            
            // Token types
            ['balance', { material: 'token', height: 2, pattern: 'pile' }],
            ['reward', { material: 'reward', height: 4, pattern: 'chest' }],
            ['transaction', { material: 'store', height: 6, pattern: 'building' }]
        ]);
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing voxel everything interface...');
        
        // Initialize world chunks
        await this.initializeVoxelWorld();
        
        // Start HTTP server for 3D client
        await this.startVoxelServer();
        
        // Start WebSocket server for real-time updates
        await this.startWebSocketServer();
        
        // Connect to all integrated systems
        await this.connectToSystems();
        
        // Start data synchronization
        await this.startDataSync();
        
        // Initialize collaborative features
        await this.initializeCollaboration();
        
        console.log('✅ Voxel everything interface ready!');
        console.log(`🌐 3D Interface: http://localhost:${this.config.port}`);
        console.log(`📡 Real-time Updates: ws://localhost:${this.config.wsPort}`);
        console.log(`🧊 Voxel world initialized with all system integration`);
    }
    
    async initializeVoxelWorld() {
        console.log('🌍 Initializing voxel world...');
        
        // Create world zones for different systems
        const zones = {
            documents: { x: 0, z: 0, size: 64, name: 'Document District' },
            learning: { x: 64, z: 0, size: 64, name: 'Learning Campus' },
            gaming: { x: 0, z: 64, size: 64, name: 'Gaming Arena' },
            tokens: { x: 64, z: 64, size: 64, name: 'Token Exchange' },
            collaboration: { x: 32, z: 32, size: 32, name: 'Central Hub' }
        };
        
        // Generate initial world chunks
        for (const [zoneName, zone] of Object.entries(zones)) {
            await this.generateZone(zoneName, zone);
        }
        
        console.log('   ✅ Voxel world zones created');
    }
    
    async generateZone(zoneName, zone) {
        const chunksInZone = Math.ceil(zone.size / this.config.chunkSize);
        
        for (let chunkX = 0; chunkX < chunksInZone; chunkX++) {
            for (let chunkZ = 0; chunkZ < chunksInZone; chunkZ++) {
                const worldChunkX = Math.floor(zone.x / this.config.chunkSize) + chunkX;
                const worldChunkZ = Math.floor(zone.z / this.config.chunkSize) + chunkZ;
                const chunkKey = `${worldChunkX},${worldChunkZ}`;
                
                const chunk = this.generateChunk(worldChunkX, worldChunkZ, zoneName);
                this.voxelWorld.chunks.set(chunkKey, chunk);
            }
        }
    }
    
    generateChunk(chunkX, chunkZ, zoneName) {
        const chunk = {
            x: chunkX,
            z: chunkZ,
            zone: zoneName,
            voxels: new Array(this.config.chunkSize * this.config.chunkSize * this.config.worldHeight).fill(0),
            entities: [],
            lastModified: Date.now(),
            generated: true
        };
        
        // Generate base terrain based on zone type
        switch (zoneName) {
            case 'documents':
                this.generateDocumentTerrain(chunk);
                break;
            case 'learning':
                this.generateLearningTerrain(chunk);
                break;
            case 'gaming':
                this.generateGamingTerrain(chunk);
                break;
            case 'tokens':
                this.generateTokenTerrain(chunk);
                break;
            case 'collaboration':
                this.generateCollaborationTerrain(chunk);
                break;
        }
        
        return chunk;
    }
    
    generateDocumentTerrain(chunk) {
        // Create a library-like terrain with flat areas for document structures
        const { chunkSize, worldHeight } = this.config;
        
        for (let x = 0; x < chunkSize; x++) {
            for (let z = 0; z < chunkSize; z++) {
                // Base ground level
                for (let y = 0; y < 3; y++) {
                    const index = this.getVoxelIndex(x, y, z);
                    chunk.voxels[index] = 1; // Solid ground
                }
                
                // Add occasional pillars for a library aesthetic
                if ((x + z) % 8 === 0 && x > 2 && x < chunkSize - 2 && z > 2 && z < chunkSize - 2) {
                    for (let y = 3; y < 15; y++) {
                        const index = this.getVoxelIndex(x, y, z);
                        chunk.voxels[index] = 2; // Pillar material
                    }
                }
            }
        }
    }
    
    generateLearningTerrain(chunk) {
        // Create campus-like terrain with pathways
        const { chunkSize } = this.config;
        
        for (let x = 0; x < chunkSize; x++) {
            for (let z = 0; z < chunkSize; z++) {
                // Base ground
                for (let y = 0; y < 2; y++) {
                    const index = this.getVoxelIndex(x, y, z);
                    chunk.voxels[index] = 3; // Learning ground material
                }
                
                // Create pathways
                if (x === Math.floor(chunkSize / 2) || z === Math.floor(chunkSize / 2)) {
                    const index = this.getVoxelIndex(x, 2, z);
                    chunk.voxels[index] = 4; // Path material
                }
            }
        }
    }
    
    generateGamingTerrain(chunk) {
        // Create arena-like terrain with varied heights
        const { chunkSize } = this.config;
        
        for (let x = 0; x < chunkSize; x++) {
            for (let z = 0; z < chunkSize; z++) {
                // Varied terrain height for gaming interest
                const height = Math.floor(3 + Math.sin(x * 0.3) * Math.cos(z * 0.3) * 2);
                
                for (let y = 0; y < height; y++) {
                    const index = this.getVoxelIndex(x, y, z);
                    chunk.voxels[index] = 5; // Gaming terrain material
                }
            }
        }
    }
    
    generateTokenTerrain(chunk) {
        // Create exchange-like terrain with platforms
        const { chunkSize } = this.config;
        
        for (let x = 0; x < chunkSize; x++) {
            for (let z = 0; z < chunkSize; z++) {
                // Base level
                for (let y = 0; y < 2; y++) {
                    const index = this.getVoxelIndex(x, y, z);
                    chunk.voxels[index] = 6; // Token ground material
                }
                
                // Create trading platforms
                if ((x % 8 === 0 && z % 8 === 0) && x > 0 && z > 0) {
                    for (let y = 2; y < 5; y++) {
                        for (let px = x; px < Math.min(x + 4, chunkSize); px++) {
                            for (let pz = z; pz < Math.min(z + 4, chunkSize); pz++) {
                                const index = this.getVoxelIndex(px, y, pz);
                                chunk.voxels[index] = 7; // Platform material
                            }
                        }
                    }
                }
            }
        }
    }
    
    generateCollaborationTerrain(chunk) {
        // Create central hub with open space
        const { chunkSize } = this.config;
        const center = Math.floor(chunkSize / 2);
        
        for (let x = 0; x < chunkSize; x++) {
            for (let z = 0; z < chunkSize; z++) {
                // Ground level
                const index = this.getVoxelIndex(x, 0, z);
                chunk.voxels[index] = 8; // Hub ground material
                
                // Central plaza
                const distanceFromCenter = Math.sqrt((x - center) ** 2 + (z - center) ** 2);
                if (distanceFromCenter < 6) {
                    const plazaIndex = this.getVoxelIndex(x, 1, z);
                    chunk.voxels[plazaIndex] = 9; // Plaza material
                }
            }
        }
    }
    
    getVoxelIndex(x, y, z) {
        return x + (z * this.config.chunkSize) + (y * this.config.chunkSize * this.config.chunkSize);
    }
    
    async startVoxelServer() {
        console.log('🌐 Starting voxel HTTP server...');
        
        this.app = express();
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.static(__dirname + '/public'));
        
        // Main 3D interface
        this.app.get('/', (req, res) => {
            res.send(this.generateVoxelInterface());
        });
        
        // Chunk data API
        this.app.get('/api/chunks/:chunkX/:chunkZ', (req, res) => {
            const { chunkX, chunkZ } = req.params;
            const chunkKey = `${chunkX},${chunkZ}`;
            const chunk = this.voxelWorld.chunks.get(chunkKey);
            
            if (chunk) {
                res.json(chunk);
            } else {
                res.status(404).json({ error: 'Chunk not found' });
            }
        });
        
        // World info API
        this.app.get('/api/world/info', (req, res) => {
            res.json({
                chunks: this.voxelWorld.chunks.size,
                entities: this.voxelWorld.entities.size,
                structures: this.voxelWorld.structures.size,
                materials: this.materials,
                config: this.config
            });
        });
        
        // Document visualization API
        this.app.post('/api/visualize/document', this.visualizeDocument.bind(this));
        
        // Learning visualization API
        this.app.post('/api/visualize/learning', this.visualizeLearning.bind(this));
        
        // Gaming visualization API
        this.app.post('/api/visualize/gaming', this.visualizeGaming.bind(this));
        
        // Token visualization API
        this.app.post('/api/visualize/tokens', this.visualizeTokens.bind(this));
        
        // User interaction API
        this.app.post('/api/interact/:userId', this.handleUserInteraction.bind(this));
        
        // Collaborative building API
        this.app.post('/api/build', this.handleCollaborativeBuilding.bind(this));
        
        this.server = this.app.listen(this.config.port, () => {
            console.log(`   ✅ Voxel HTTP server running on port ${this.config.port}`);
        });
    }
    
    generateVoxelInterface() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧊 Voxel Everything Interface</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            font-family: 'Courier New', monospace;
            overflow: hidden;
            color: #00ff41;
        }
        
        #voxel-container {
            position: relative;
            width: 100vw;
            height: 100vh;
        }
        
        #voxel-canvas {
            display: block;
            width: 100%;
            height: 100%;
            background: linear-gradient(180deg, #001122 0%, #000011 100%);
        }
        
        #ui-overlay {
            position: absolute;
            top: 20px;
            left: 20px;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #00ff41;
            min-width: 300px;
        }
        
        #system-tabs {
            position: absolute;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            gap: 10px;
        }
        
        .system-tab {
            background: rgba(0, 255, 65, 0.2);
            border: 2px solid #00ff41;
            color: #00ff41;
            padding: 10px 20px;
            border-radius: 25px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .system-tab:hover {
            background: rgba(0, 255, 65, 0.4);
            transform: scale(1.05);
        }
        
        .system-tab.active {
            background: #00ff41;
            color: #000;
        }
        
        #build-panel {
            position: absolute;
            bottom: 20px;
            left: 20px;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 10px;
            border: 2px solid #ff6600;
            display: flex;
            gap: 10px;
        }
        
        .build-tool {
            background: rgba(255, 102, 0, 0.2);
            border: 1px solid #ff6600;
            color: #ff6600;
            padding: 8px 16px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s ease;
        }
        
        .build-tool:hover {
            background: rgba(255, 102, 0, 0.4);
        }
        
        .build-tool.active {
            background: #ff6600;
            color: #000;
        }
        
        #collaboration-panel {
            position: absolute;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 10px;
            border: 2px solid #9b59b6;
            max-width: 250px;
        }
        
        .user-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin: 2px;
            border: 1px solid #fff;
        }
        
        #chat-box {
            position: absolute;
            top: 50%;
            right: 20px;
            transform: translateY(-50%);
            z-index: 1000;
            background: rgba(0, 0, 0, 0.9);
            border: 1px solid #4ecdc4;
            border-radius: 10px;
            width: 300px;
            height: 200px;
            display: none;
        }
        
        #loading-screen {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            z-index: 2000;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid #333;
            border-top: 3px solid #00ff41;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/controls/OrbitControls.js"></script>
</head>
<body>
    <div id="loading-screen">
        <div class="loading-spinner"></div>
        <p style="margin-top: 20px;">Initializing Voxel Universe...</p>
        <p style="font-size: 12px; opacity: 0.7;">Loading all integrated systems</p>
    </div>
    
    <div id="voxel-container">
        <canvas id="voxel-canvas"></canvas>
        
        <div id="ui-overlay">
            <h3>🧊 Voxel Control Center</h3>
            <div id="system-status">
                <div>📄 Documents: <span id="doc-count">-</span></div>
                <div>🎮 Gaming: <span id="game-status">-</span></div>
                <div>📚 Learning: <span id="learn-progress">-</span></div>
                <div>🪙 Tokens: <span id="token-balance">-</span></div>
            </div>
            <div style="margin-top: 15px;">
                <div>📍 Position: <span id="position">0, 0, 0</span></div>
                <div>🧱 Selected: <span id="selected-voxel">None</span></div>
                <div>👥 Users: <span id="active-users">1</span></div>
            </div>
        </div>
        
        <div id="system-tabs">
            <div class="system-tab active" data-system="all">🌐 All</div>
            <div class="system-tab" data-system="documents">📄 Docs</div>
            <div class="system-tab" data-system="gaming">🎮 Gaming</div>
            <div class="system-tab" data-system="learning">📚 Learning</div>
            <div class="system-tab" data-system="tokens">🪙 Tokens</div>
        </div>
        
        <div id="build-panel">
            <div class="build-tool active" data-tool="select">👆 Select</div>
            <div class="build-tool" data-tool="place">🧱 Place</div>
            <div class="build-tool" data-tool="remove">🗑️ Remove</div>
            <div class="build-tool" data-tool="paint">🎨 Paint</div>
            <div class="build-tool" data-tool="copy">📋 Copy</div>
        </div>
        
        <div id="collaboration-panel">
            <h4>👥 Collaboration</h4>
            <div id="active-users-list">
                <div class="user-indicator" style="background: #00ff41;" title="You"></div>
            </div>
            <button onclick="toggleChat()" style="width: 100%; margin-top: 10px; background: #4ecdc4; border: none; padding: 8px; border-radius: 5px; color: #000; cursor: pointer;">💬 Chat</button>
        </div>
        
        <div id="chat-box">
            <div style="padding: 10px; border-bottom: 1px solid #333; color: #4ecdc4; font-weight: bold;">Collaborative Chat</div>
            <div id="chat-messages" style="height: 120px; overflow-y: auto; padding: 10px; font-size: 12px;"></div>
            <div style="padding: 10px; border-top: 1px solid #333;">
                <input type="text" id="chat-input" placeholder="Type message..." style="width: 100%; background: #333; border: none; color: #4ecdc4; padding: 5px; border-radius: 3px;">
            </div>
        </div>
    </div>
    
    <script>
        class VoxelEverythingInterface {
            constructor() {
                this.scene = null;
                this.camera = null;
                this.renderer = null;
                this.controls = null;
                this.ws = null;
                
                this.voxelMesh = null;
                this.selectedVoxel = null;
                this.currentTool = 'select';
                this.currentSystem = 'all';
                
                this.worldData = {
                    chunks: new Map(),
                    entities: new Map(),
                    structures: new Map()
                };
                
                this.materials = new Map();
                this.users = new Map();
                
                this.init();
            }
            
            async init() {
                console.log('🧊 Initializing Voxel Everything Interface...');
                
                // Initialize Three.js scene
                this.initThreeJS();
                
                // Connect to WebSocket
                this.connectWebSocket();
                
                // Load world data
                await this.loadWorldData();
                
                // Set up event listeners
                this.setupEventListeners();
                
                // Start render loop
                this.animate();
                
                // Hide loading screen
                document.getElementById('loading-screen').style.display = 'none';
                
                console.log('✅ Voxel interface ready!');
            }
            
            initThreeJS() {
                const container = document.getElementById('voxel-container');
                const canvas = document.getElementById('voxel-canvas');
                
                // Scene
                this.scene = new THREE.Scene();
                this.scene.background = new THREE.Color(0x001122);
                
                // Camera
                this.camera = new THREE.PerspectiveCamera(
                    75,
                    window.innerWidth / window.innerHeight,
                    0.1,
                    1000
                );
                this.camera.position.set(50, 50, 50);
                
                // Renderer
                this.renderer = new THREE.WebGLRenderer({ 
                    canvas: canvas,
                    antialias: true 
                });
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.shadowMap.enabled = true;
                this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                
                // Controls
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.05;
                
                // Lighting
                const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
                this.scene.add(ambientLight);
                
                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
                directionalLight.position.set(100, 100, 50);
                directionalLight.castShadow = true;
                directionalLight.shadow.mapSize.width = 2048;
                directionalLight.shadow.mapSize.height = 2048;
                this.scene.add(directionalLight);
                
                // Initialize materials
                this.initMaterials();
                
                console.log('   ✅ Three.js initialized');
            }
            
            initMaterials() {
                const materials = {
                    document: new THREE.MeshLambertMaterial({ color: 0x3498db, transparent: true, opacity: 0.8 }),
                    template: new THREE.MeshLambertMaterial({ color: 0x2ecc71, transparent: true, opacity: 0.8 }),
                    mvp: new THREE.MeshLambertMaterial({ color: 0xe74c3c, emissive: 0x330000 }),
                    concept: new THREE.MeshLambertMaterial({ color: 0x9b59b6, emissive: 0x1a0a1a }),
                    skill: new THREE.MeshLambertMaterial({ color: 0xf39c12, emissive: 0x1a1100 }),
                    achievement: new THREE.MeshLambertMaterial({ color: 0xf1c40f, emissive: 0x2a2000 }),
                    player: new THREE.MeshLambertMaterial({ color: 0x1abc9c }),
                    token: new THREE.MeshLambertMaterial({ color: 0xffd700, emissive: 0x2a2000 }),
                    ground: new THREE.MeshLambertMaterial({ color: 0x34495e })
                };
                
                for (const [name, material] of Object.entries(materials)) {
                    this.materials.set(name, material);
                }
            }
            
            connectWebSocket() {
                const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
                this.ws = new WebSocket(\`\${protocol}//\${location.hostname}:${this.config.wsPort}\`);
                
                this.ws.onopen = () => {
                    console.log('📡 Connected to voxel WebSocket');
                    this.ws.send(JSON.stringify({
                        type: 'client_connected',
                        data: { userAgent: navigator.userAgent }
                    }));
                };
                
                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                };
                
                this.ws.onclose = () => {
                    console.log('📡 Disconnected from voxel WebSocket');
                    setTimeout(() => this.connectWebSocket(), 2000);
                };
            }
            
            handleWebSocketMessage(data) {
                switch (data.type) {
                    case 'world_update':
                        this.updateWorld(data.data);
                        break;
                    case 'user_joined':
                        this.addUser(data.data);
                        break;
                    case 'user_left':
                        this.removeUser(data.data);
                        break;
                    case 'voxel_changed':
                        this.updateVoxel(data.data);
                        break;
                    case 'chat_message':
                        this.addChatMessage(data.data);
                        break;
                    case 'system_data_update':
                        this.updateSystemData(data.data);
                        break;
                }
            }
            
            async loadWorldData() {
                try {
                    const response = await fetch('/api/world/info');
                    const worldInfo = await response.json();
                    
                    console.log('🌍 World info loaded:', worldInfo);
                    
                    // Load initial chunks around origin
                    for (let x = -2; x <= 2; x++) {
                        for (let z = -2; z <= 2; z++) {
                            await this.loadChunk(x, z);
                        }
                    }
                    
                    this.generateVoxelMesh();
                } catch (error) {
                    console.error('Failed to load world data:', error);
                }
            }
            
            async loadChunk(chunkX, chunkZ) {
                try {
                    const response = await fetch(\`/api/chunks/\${chunkX}/\${chunkZ}\`);
                    if (response.ok) {
                        const chunk = await response.json();
                        this.worldData.chunks.set(\`\${chunkX},\${chunkZ}\`, chunk);
                        return chunk;
                    }
                } catch (error) {
                    console.error(\`Failed to load chunk \${chunkX},\${chunkZ}:\`, error);
                }
                return null;
            }
            
            generateVoxelMesh() {
                // Remove existing voxel mesh
                if (this.voxelMesh) {
                    this.scene.remove(this.voxelMesh);
                }
                
                const geometry = new THREE.BufferGeometry();
                const positions = [];
                const colors = [];
                const normals = [];
                
                // Generate mesh data from chunks
                for (const [chunkKey, chunk] of this.worldData.chunks) {
                    this.addChunkToMesh(chunk, positions, colors, normals);
                }
                
                // Set geometry attributes
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
                
                // Create mesh
                const material = new THREE.MeshLambertMaterial({ 
                    vertexColors: true,
                    transparent: true,
                    opacity: 0.9
                });
                
                this.voxelMesh = new THREE.Mesh(geometry, material);
                this.voxelMesh.receiveShadow = true;
                this.voxelMesh.castShadow = true;
                
                this.scene.add(this.voxelMesh);
                
                console.log(\`🧊 Generated voxel mesh with \${positions.length / 3} vertices\`);
            }
            
            addChunkToMesh(chunk, positions, colors, normals) {
                const chunkSize = 16;
                const voxelSize = 1;
                
                for (let x = 0; x < chunkSize; x++) {
                    for (let y = 0; y < 32; y++) { // Limit height for performance
                        for (let z = 0; z < chunkSize; z++) {
                            const voxelIndex = x + (z * chunkSize) + (y * chunkSize * chunkSize);
                            const voxelType = chunk.voxels[voxelIndex];
                            
                            if (voxelType > 0) {
                                const worldX = chunk.x * chunkSize + x;
                                const worldY = y;
                                const worldZ = chunk.z * chunkSize + z;
                                
                                this.addVoxelToMesh(
                                    worldX, worldY, worldZ, 
                                    voxelType, voxelSize,
                                    positions, colors, normals
                                );
                            }
                        }
                    }
                }
            }
            
            addVoxelToMesh(x, y, z, voxelType, size, positions, colors, normals) {
                // Cube vertices (simplified - just top face for performance)
                const vertices = [
                    // Top face
                    x, y + size, z,
                    x + size, y + size, z,
                    x + size, y + size, z + size,
                    x, y + size, z + size
                ];
                
                // Convert to triangles
                const triangles = [
                    0, 1, 2,  0, 2, 3  // Top face triangles
                ];
                
                for (const vertexIndex of triangles) {
                    const baseIndex = vertexIndex * 3;
                    positions.push(
                        vertices[baseIndex],
                        vertices[baseIndex + 1],
                        vertices[baseIndex + 2]
                    );
                    
                    // Color based on voxel type
                    const color = this.getVoxelColor(voxelType);
                    colors.push(color.r, color.g, color.b);
                    
                    // Normal (pointing up for top face)
                    normals.push(0, 1, 0);
                }
            }
            
            getVoxelColor(voxelType) {
                const colorMap = {
                    1: { r: 0.2, g: 0.6, b: 0.8 },  // Document blue
                    2: { r: 0.18, g: 0.8, b: 0.44 }, // Template green
                    3: { r: 0.6, g: 0.35, b: 0.71 }, // Learning purple
                    4: { r: 0.95, g: 0.61, b: 0.07 }, // Skill orange
                    5: { r: 0.11, g: 0.74, b: 0.61 }, // Gaming teal
                    6: { r: 1.0, g: 0.84, b: 0.0 },  // Token gold
                    7: { r: 0.9, g: 0.49, b: 0.13 }, // Platform orange
                    8: { r: 0.2, g: 0.27, b: 0.37 }, // Hub gray
                    9: { r: 0.3, g: 0.77, b: 0.76 }  // Plaza cyan
                };
                
                return colorMap[voxelType] || { r: 0.5, g: 0.5, b: 0.5 };
            }
            
            setupEventListeners() {
                // System tab switching
                document.querySelectorAll('.system-tab').forEach(tab => {
                    tab.addEventListener('click', (e) => {
                        document.querySelectorAll('.system-tab').forEach(t => t.classList.remove('active'));
                        e.target.classList.add('active');
                        this.currentSystem = e.target.dataset.system;
                        this.filterBySystem(this.currentSystem);
                    });
                });
                
                // Build tool switching
                document.querySelectorAll('.build-tool').forEach(tool => {
                    tool.addEventListener('click', (e) => {
                        document.querySelectorAll('.build-tool').forEach(t => t.classList.remove('active'));
                        e.target.classList.add('active');
                        this.currentTool = e.target.dataset.tool;
                    });
                });
                
                // Voxel interaction
                this.renderer.domElement.addEventListener('click', (event) => {
                    this.handleVoxelClick(event);
                });
                
                // Chat input
                const chatInput = document.getElementById('chat-input');
                chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && chatInput.value.trim()) {
                        this.sendChatMessage(chatInput.value);
                        chatInput.value = '';
                    }
                });
                
                // Window resize
                window.addEventListener('resize', () => {
                    this.camera.aspect = window.innerWidth / window.innerHeight;
                    this.camera.updateProjectionMatrix();
                    this.renderer.setSize(window.innerWidth, window.innerHeight);
                });
                
                // Update position display
                this.controls.addEventListener('change', () => {
                    const pos = this.camera.position;
                    document.getElementById('position').textContent = 
                        \`\${Math.round(pos.x)}, \${Math.round(pos.y)}, \${Math.round(pos.z)}\`;
                });
            }
            
            handleVoxelClick(event) {
                // Implement raycasting for voxel selection/interaction
                const mouse = new THREE.Vector2();
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
                
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mouse, this.camera);
                
                if (this.voxelMesh) {
                    const intersects = raycaster.intersectObject(this.voxelMesh);
                    
                    if (intersects.length > 0) {
                        const intersection = intersects[0];
                        this.handleVoxelInteraction(intersection);
                    }
                }
            }
            
            handleVoxelInteraction(intersection) {
                const point = intersection.point;
                const voxelX = Math.floor(point.x);
                const voxelY = Math.floor(point.y);
                const voxelZ = Math.floor(point.z);
                
                document.getElementById('selected-voxel').textContent = 
                    \`\${voxelX}, \${voxelY}, \${voxelZ}\`;
                
                // Handle different tools
                switch (this.currentTool) {
                    case 'select':
                        this.selectVoxel(voxelX, voxelY, voxelZ);
                        break;
                    case 'place':
                        this.placeVoxel(voxelX, voxelY + 1, voxelZ);
                        break;
                    case 'remove':
                        this.removeVoxel(voxelX, voxelY, voxelZ);
                        break;
                    case 'paint':
                        this.paintVoxel(voxelX, voxelY, voxelZ);
                        break;
                }
            }
            
            selectVoxel(x, y, z) {
                this.selectedVoxel = { x, y, z };
                console.log(\`Selected voxel at \${x}, \${y}, \${z}\`);
            }
            
            placeVoxel(x, y, z) {
                // Send voxel placement to server
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'place_voxel',
                        data: { x, y, z, voxelType: 1, system: this.currentSystem }
                    }));
                }
            }
            
            removeVoxel(x, y, z) {
                // Send voxel removal to server
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'remove_voxel',
                        data: { x, y, z }
                    }));
                }
            }
            
            updateSystemData(data) {
                // Update UI with system data
                if (data.documents) {
                    document.getElementById('doc-count').textContent = data.documents.count || '-';
                }
                if (data.gaming) {
                    document.getElementById('game-status').textContent = data.gaming.status || '-';
                }
                if (data.learning) {
                    document.getElementById('learn-progress').textContent = data.learning.progress || '-';
                }
                if (data.tokens) {
                    document.getElementById('token-balance').textContent = data.tokens.balance || '-';
                }
            }
            
            sendChatMessage(message) {
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'chat_message',
                        data: { message, timestamp: Date.now() }
                    }));
                }
            }
            
            addChatMessage(data) {
                const messagesContainer = document.getElementById('chat-messages');
                const messageElement = document.createElement('div');
                messageElement.innerHTML = \`<span style="color: #4ecdc4;">[User]</span> \${data.message}\`;
                messagesContainer.appendChild(messageElement);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
            
            filterBySystem(system) {
                console.log(\`Filtering by system: \${system}\`);
                // Implement system-specific filtering
                // This would hide/show different parts of the voxel world
                // based on the selected system
            }
            
            animate() {
                requestAnimationFrame(() => this.animate());
                
                this.controls.update();
                this.renderer.render(this.scene, this.camera);
            }
        }
        
        // Global functions
        function toggleChat() {
            const chatBox = document.getElementById('chat-box');
            chatBox.style.display = chatBox.style.display === 'none' ? 'block' : 'none';
        }
        
        // Initialize the interface when page loads
        window.addEventListener('load', () => {
            new VoxelEverythingInterface();
        });
    </script>
</body>
</html>`;
    }
    
    async startWebSocketServer() {
        console.log('📡 Starting voxel WebSocket server...');
        
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            const clientId = crypto.randomUUID();
            console.log(`   🔗 New voxel client connected: ${clientId}`);
            
            // Store client connection
            this.clients.set(clientId, {
                id: clientId,
                ws: ws,
                position: { x: 0, y: 0, z: 0 },
                system: 'all',
                connectedAt: Date.now()
            });
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connection_established',
                data: {
                    clientId,
                    worldInfo: {
                        chunks: this.voxelWorld.chunks.size,
                        entities: this.voxelWorld.entities.size,
                        materials: this.materials
                    }
                }
            }));
            
            // Handle messages
            ws.on('message', (data) => {
                this.handleClientMessage(clientId, JSON.parse(data));
            });
            
            // Handle disconnection
            ws.on('close', () => {
                this.clients.delete(clientId);
                this.broadcastToClients('user_left', { clientId });
                console.log(`   📡 Voxel client disconnected: ${clientId}`);
            });
        });
        
        console.log(`   ✅ Voxel WebSocket server running on port ${this.config.wsPort}`);
    }
    
    handleClientMessage(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        switch (message.type) {
            case 'place_voxel':
                this.handlePlaceVoxel(clientId, message.data);
                break;
                
            case 'remove_voxel':
                this.handleRemoveVoxel(clientId, message.data);
                break;
                
            case 'chat_message':
                this.handleChatMessage(clientId, message.data);
                break;
                
            case 'system_filter':
                client.system = message.data.system;
                break;
                
            case 'position_update':
                client.position = message.data.position;
                break;
        }
    }
    
    handlePlaceVoxel(clientId, data) {
        const { x, y, z, voxelType, system } = data;
        
        // Determine chunk coordinates
        const chunkX = Math.floor(x / this.config.chunkSize);
        const chunkZ = Math.floor(z / this.config.chunkSize);
        const chunkKey = `${chunkX},${chunkZ}`;
        
        // Get or create chunk
        let chunk = this.voxelWorld.chunks.get(chunkKey);
        if (!chunk) {
            chunk = this.generateChunk(chunkX, chunkZ, system || 'collaboration');
            this.voxelWorld.chunks.set(chunkKey, chunk);
        }
        
        // Calculate local voxel position
        const localX = x - (chunkX * this.config.chunkSize);
        const localZ = z - (chunkZ * this.config.chunkSize);
        const voxelIndex = this.getVoxelIndex(localX, y, localZ);
        
        // Place voxel
        chunk.voxels[voxelIndex] = voxelType || 1;
        chunk.lastModified = Date.now();
        
        // Broadcast change to all clients
        this.broadcastToClients('voxel_changed', {
            x, y, z, voxelType: voxelType || 1, action: 'placed',
            placedBy: clientId
        });
        
        console.log(`🧊 Voxel placed at ${x},${y},${z} by client ${clientId}`);
    }
    
    handleRemoveVoxel(clientId, data) {
        const { x, y, z } = data;
        
        // Similar to place voxel but set to 0
        const chunkX = Math.floor(x / this.config.chunkSize);
        const chunkZ = Math.floor(z / this.config.chunkSize);
        const chunkKey = `${chunkX},${chunkZ}`;
        
        const chunk = this.voxelWorld.chunks.get(chunkKey);
        if (chunk) {
            const localX = x - (chunkX * this.config.chunkSize);
            const localZ = z - (chunkZ * this.config.chunkSize);
            const voxelIndex = this.getVoxelIndex(localX, y, localZ);
            
            chunk.voxels[voxelIndex] = 0;
            chunk.lastModified = Date.now();
            
            this.broadcastToClients('voxel_changed', {
                x, y, z, voxelType: 0, action: 'removed',
                removedBy: clientId
            });
        }
    }
    
    handleChatMessage(clientId, data) {
        // Broadcast chat message to all clients
        this.broadcastToClients('chat_message', {
            clientId,
            message: data.message,
            timestamp: Date.now()
        });
    }
    
    broadcastToClients(type, data) {
        const message = JSON.stringify({ type, data });
        
        this.clients.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(message);
            }
        });
    }
    
    // API Route Handlers
    
    async visualizeDocument(req, res) {
        const { documentId, documentData, position } = req.body;
        
        try {
            // Convert document to voxel structure
            const structure = this.documentToVoxelStructure(documentData);
            
            // Place in document zone
            const docPosition = position || this.findAvailableDocumentPosition();
            await this.placeStructure(structure, docPosition, 'document');
            
            res.json({
                success: true,
                documentId,
                position: docPosition,
                structure: structure
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    documentToVoxelStructure(documentData) {
        // Convert document content to 3D voxel structure
        const structure = {
            voxels: [],
            metadata: {
                type: 'document',
                size: { width: 0, height: 0, depth: 0 }
            }
        };
        
        // Simple algorithm: height based on content length
        const contentLength = (documentData.content || '').length;
        const height = Math.min(Math.max(Math.floor(contentLength / 100), 3), 20);
        
        // Create document tower
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < 5; x++) {
                for (let z = 0; z < 5; z++) {
                    if (x === 0 || x === 4 || z === 0 || z === 4 || y === 0) {
                        structure.voxels.push({
                            x, y, z, 
                            voxelType: documentData.type === 'mvp' ? 3 : 1,
                            material: documentData.type === 'mvp' ? 'mvp' : 'document'
                        });
                    }
                }
            }
        }
        
        structure.metadata.size = { width: 5, height, depth: 5 };
        return structure;
    }
    
    findAvailableDocumentPosition() {
        // Find empty space in document zone
        return { x: Math.floor(Math.random() * 50), y: 3, z: Math.floor(Math.random() * 50) };
    }
    
    async placeStructure(structure, position, category) {
        const structureId = crypto.randomUUID();
        
        // Place each voxel in the structure
        for (const voxel of structure.voxels) {
            const worldX = position.x + voxel.x;
            const worldY = position.y + voxel.y;
            const worldZ = position.z + voxel.z;
            
            // Similar to handlePlaceVoxel but for structures
            const chunkX = Math.floor(worldX / this.config.chunkSize);
            const chunkZ = Math.floor(worldZ / this.config.chunkSize);
            const chunkKey = `${chunkX},${chunkZ}`;
            
            let chunk = this.voxelWorld.chunks.get(chunkKey);
            if (!chunk) {
                chunk = this.generateChunk(chunkX, chunkZ, category);
                this.voxelWorld.chunks.set(chunkKey, chunk);
            }
            
            const localX = worldX - (chunkX * this.config.chunkSize);
            const localZ = worldZ - (chunkZ * this.config.chunkSize);
            const voxelIndex = this.getVoxelIndex(localX, worldY, localZ);
            
            chunk.voxels[voxelIndex] = voxel.voxelType;
        }
        
        // Store structure metadata
        this.voxelWorld.structures.set(structureId, {
            id: structureId,
            category,
            position,
            structure,
            createdAt: Date.now()
        });
        
        // Broadcast structure placement
        this.broadcastToClients('structure_placed', {
            structureId,
            category,
            position,
            structure
        });
        
        return structureId;
    }
    
    async connectToSystems() {
        console.log('🔗 Connecting to integrated systems...');
        
        // Connect to each service and register for updates
        const connectionPromises = Object.entries(this.services).map(async ([serviceName, url]) => {
            try {
                const response = await universalFetch(`${url}/api/health`);
                if (response.ok) {
                    console.log(`   ✅ Connected to ${serviceName} service`);
                    
                    // Register for events if service supports it
                    try {
                        await universalFetch(`${url}/api/voxel/register`, {
                            method: 'POST',
                            body: {
                                voxelEngineUrl: `http://localhost:${this.config.port}`,
                                capabilities: ['visualization', 'collaboration', '3d_interface']
                            }
                        });
                    } catch (regError) {
                        // Service might not support voxel registration yet
                    }
                } else {
                    console.log(`   ⚠️  ${serviceName} service not available`);
                }
            } catch (error) {
                console.log(`   ❌ Failed to connect to ${serviceName}: ${error.message}`);
            }
        });
        
        await Promise.allSettled(connectionPromises);
    }
    
    async startDataSync() {
        console.log('🔄 Starting data synchronization with all systems...');
        
        // Sync with systems every 30 seconds
        setInterval(async () => {
            await this.syncWithAllSystems();
        }, 30000);
        
        // Initial sync
        await this.syncWithAllSystems();
        
        console.log('   ✅ Data synchronization active');
    }
    
    async syncWithAllSystems() {
        // Sync with each connected system
        const syncPromises = Object.entries(this.services).map(async ([serviceName, url]) => {
            try {
                const response = await universalFetch(`${url}/api/voxel/sync`);
                if (response.ok && response.data) {
                    await this.processSystemSync(serviceName, response.data);
                }
            } catch (error) {
                // Silent fail for now
            }
        });
        
        await Promise.allSettled(syncPromises);
    }
    
    async processSystemSync(serviceName, syncData) {
        // Process sync data from each system and update voxel world accordingly
        switch (serviceName) {
            case 'documents':
                if (syncData.newDocuments) {
                    for (const doc of syncData.newDocuments) {
                        await this.visualizeDocument({ body: { documentData: doc } }, { json: () => {} });
                    }
                }
                break;
                
            case 'gaming':
                if (syncData.achievements) {
                    for (const achievement of syncData.achievements) {
                        await this.visualizeAchievement(achievement);
                    }
                }
                break;
                
            case 'learning':
                if (syncData.concepts) {
                    for (const concept of syncData.concepts) {
                        await this.visualizeConcept(concept);
                    }
                }
                break;
                
            case 'tokens':
                if (syncData.transactions) {
                    for (const transaction of syncData.transactions) {
                        await this.visualizeTransaction(transaction);
                    }
                }
                break;
        }
        
        // Broadcast system update to clients
        this.broadcastToClients('system_data_update', {
            [serviceName]: syncData
        });
    }
    
    async visualizeAchievement(achievement) {
        // Create trophy-like structure for achievements
        const position = this.findAvailablePosition('gaming');
        const structure = this.achievementToVoxelStructure(achievement);
        await this.placeStructure(structure, position, 'achievement');
    }
    
    async visualizeConcept(concept) {
        // Create educational building for concepts
        const position = this.findAvailablePosition('learning');
        const structure = this.conceptToVoxelStructure(concept);
        await this.placeStructure(structure, position, 'concept');
    }
    
    async visualizeTransaction(transaction) {
        // Create coin pile or transaction building
        const position = this.findAvailablePosition('tokens');
        const structure = this.transactionToVoxelStructure(transaction);
        await this.placeStructure(structure, position, 'transaction');
    }
    
    findAvailablePosition(zone) {
        // Find available position in specified zone
        const zoneOffsets = {
            documents: { x: 0, z: 0 },
            gaming: { x: 0, z: 64 },
            learning: { x: 64, z: 0 },
            tokens: { x: 64, z: 64 }
        };
        
        const offset = zoneOffsets[zone] || { x: 32, z: 32 };
        return {
            x: offset.x + Math.floor(Math.random() * 32),
            y: 3,
            z: offset.z + Math.floor(Math.random() * 32)
        };
    }
    
    achievementToVoxelStructure(achievement) {
        // Create trophy structure
        const structure = { voxels: [], metadata: { type: 'achievement' } };
        
        // Trophy base
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                structure.voxels.push({ x, y: 0, z, voxelType: 6, material: 'achievement' });
            }
        }
        
        // Trophy stem
        structure.voxels.push({ x: 0, y: 1, z: 0, voxelType: 6, material: 'achievement' });
        structure.voxels.push({ x: 0, y: 2, z: 0, voxelType: 6, material: 'achievement' });
        
        // Trophy cup
        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                if (x === 0 || z === 0) {
                    structure.voxels.push({ x, y: 3, z, voxelType: 6, material: 'achievement' });
                }
            }
        }
        
        return structure;
    }
    
    conceptToVoxelStructure(concept) {
        // Create crystalline structure for concepts
        const structure = { voxels: [], metadata: { type: 'concept' } };
        
        // Create pyramid-like structure
        for (let y = 0; y < 5; y++) {
            const size = 5 - y;
            for (let x = -Math.floor(size/2); x <= Math.floor(size/2); x++) {
                for (let z = -Math.floor(size/2); z <= Math.floor(size/2); z++) {
                    if (Math.abs(x) === Math.floor(size/2) || Math.abs(z) === Math.floor(size/2)) {
                        structure.voxels.push({ x, y, z, voxelType: 4, material: 'concept' });
                    }
                }
            }
        }
        
        return structure;
    }
    
    transactionToVoxelStructure(transaction) {
        // Create coin pile structure
        const structure = { voxels: [], metadata: { type: 'transaction' } };
        
        // Stack of coins based on transaction amount
        const height = Math.min(Math.max(Math.floor(transaction.amount / 1000), 1), 10);
        
        for (let y = 0; y < height; y++) {
            structure.voxels.push({ x: 0, y, z: 0, voxelType: 7, material: 'token' });
        }
        
        return structure;
    }
    
    async initializeCollaboration() {
        console.log('👥 Initializing collaborative features...');
        
        // Set up collaborative sessions
        // Real-time voxel updates are already handled by WebSocket
        
        console.log('   ✅ Collaborative features ready');
    }
}

// Export for use
module.exports = VoxelEverythingInterface;

// If run directly, start the voxel interface
if (require.main === module) {
    console.log('🧊 Starting Voxel Everything Interface...');
    
    const voxelInterface = new VoxelEverythingInterface();
    
    // Handle shutdown gracefully
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Voxel Everything Interface...');
        process.exit(0);
    });
}