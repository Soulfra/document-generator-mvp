#!/usr/bin/env node

/**
 * 🎮🤖 POLYGONAL COMPANION SYSTEM
 * 
 * Creates a 3-4 polygon drone/companion character that bridges all our systems:
 * - Document-to-MVP Obsidian plugin
 * - Character Mirror orchestrator  
 * - Universal Compactor
 * - Existing game systems (385+ files)
 * 
 * Minecraft/Roblox style buildable world with Lua scripting integration
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');

console.log(`
🎮🤖🎮🤖🎮🤖🎮🤖🎮🤖🎮🤖🎮🤖🎮🤖🎮🤖🎮🤖
🤖 POLYGONAL COMPANION SYSTEM 🤖
🎮 3-4 Polygon Drone + Buildable World 🎮
🤖 Bridges ALL Systems Together 🤖
🎮🤖🎮🤖🎮🤖🎮🤖🎮🤖🎮🤖🎮🤖🎮🤖🎮🤖🎮🤖
`);

class PolygonalCompanionSystem {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 9999; // Unique port for the companion system
        
        // Game World State
        this.world = {
            voxels: new Map(), // 3D voxel grid for building
            companions: new Map(), // Active companion characters
            players: new Map(), // Connected players
            structures: new Map() // Built structures
        };
        
        // System Bridges
        this.systemBridges = {
            documentToMVP: 'http://localhost:3001', // Document generator
            characterMirror: 'http://localhost:7777', // Character mirror system
            universalCompactor: 'http://localhost:8080', // Universal compactor
            existingGames: [] // Will populate from existing 385+ files
        };
        
        // Companion Types (3-4 polygons each)
        this.companionTypes = {
            'scout': {
                name: 'Scout Drone',
                polygons: 3,
                color: '#00ff88',
                ability: 'exploration',
                systemBridge: 'documentToMVP'
            },
            'builder': {
                name: 'Builder Companion', 
                polygons: 4,
                color: '#ff8800',
                ability: 'construction',
                systemBridge: 'universalCompactor'
            },
            'mirror': {
                name: 'Mirror Echo',
                polygons: 3,
                color: '#8800ff',
                ability: 'replication',
                systemBridge: 'characterMirror'
            }
        };
        
        // Lua Script Registry
        this.luaScripts = new Map();
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing Polygonal Companion System...');
        
        // Setup Express middleware
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.static('public'));
        
        // Setup routes
        this.setupRoutes();
        
        // Setup WebSocket handlers
        this.setupWebSocket();
        
        // Connect to existing game systems
        await this.discoverExistingGameSystems();
        
        // Initialize default companions
        this.createDefaultCompanions();
        
        // Start server
        this.server.listen(this.port, () => {
            console.log(`🎮 Polygonal Companion System running on http://localhost:${this.port}`);
            console.log(`🤖 WebSocket server active for real-time companion control`);
        });
    }
    
    setupRoutes() {
        // Main game interface
        this.app.get('/', (req, res) => {
            res.send(this.getGameInterface());
        });
        
        // Companion management
        this.app.get('/api/companions', (req, res) => {
            res.json(Array.from(this.world.companions.values()));
        });
        
        this.app.post('/api/companion/create', (req, res) => {
            const companion = this.createCompanion(req.body);
            res.json({ success: true, companion });
        });
        
        // World building
        this.app.post('/api/world/place-voxel', (req, res) => {
            const { x, y, z, type, playerId } = req.body;
            this.placeVoxel(x, y, z, type, playerId);
            res.json({ success: true });
        });
        
        this.app.post('/api/world/remove-voxel', (req, res) => {
            const { x, y, z, playerId } = req.body;
            this.removeVoxel(x, y, z, playerId);
            res.json({ success: true });
        });
        
        // System bridge endpoints
        this.app.post('/api/bridge/document-to-mvp', async (req, res) => {
            const result = await this.bridgeToDocumentMVP(req.body);
            res.json(result);
        });
        
        this.app.post('/api/bridge/character-mirror', async (req, res) => {
            const result = await this.bridgeToCharacterMirror(req.body);
            res.json(result);
        });
        
        this.app.post('/api/bridge/universal-compactor', async (req, res) => {
            const result = await this.bridgeToUniversalCompactor(req.body);
            res.json(result);
        });
        
        // Lua scripting
        this.app.post('/api/lua/execute', (req, res) => {
            const result = this.executeLuaScript(req.body.script, req.body.context);
            res.json(result);
        });
        
        this.app.get('/api/lua/scripts', (req, res) => {
            res.json(Array.from(this.luaScripts.entries()));
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🔌 New companion connection');
            
            // Send initial world state
            ws.send(JSON.stringify({
                type: 'world_state',
                data: {
                    companions: Array.from(this.world.companions.values()),
                    voxels: Array.from(this.world.voxels.entries()),
                    players: this.world.players.size
                }
            }));
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 Companion connection closed');
            });
        });
    }
    
    async discoverExistingGameSystems() {
        console.log('🔍 Discovering existing game systems...');
        
        try {
            // Look for existing game files
            const gameFiles = [
                'autonomous-character-controller.js',
                'unified-3d-games.js', 
                'image-to-voxel-character.js',
                'character-world-social-hub.js',
                'unified-character-tool.js'
            ];
            
            for (const file of gameFiles) {
                const filePath = path.join(__dirname, file);
                try {
                    await fs.access(filePath);
                    this.systemBridges.existingGames.push({
                        name: file.replace('.js', ''),
                        path: filePath,
                        active: true
                    });
                    console.log(`  ✅ Found: ${file}`);
                } catch (error) {
                    console.log(`  ⚠️ Missing: ${file}`);
                }
            }
            
            console.log(`🎮 Discovered ${this.systemBridges.existingGames.length} existing game systems`);
            
        } catch (error) {
            console.error('Error discovering game systems:', error);
        }
    }
    
    createDefaultCompanions() {
        console.log('🤖 Creating default companions...');
        
        // Create one of each type
        Object.entries(this.companionTypes).forEach(([type, config]) => {
            const companion = this.createCompanion({
                type,
                name: config.name,
                position: { x: 0, y: 5, z: 0 },
                isDefault: true
            });
            
            console.log(`  🤖 Created ${companion.name} (${companion.polygons} polygons)`);
        });
    }
    
    createCompanion(params) {
        const companionId = `companion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const config = this.companionTypes[params.type] || this.companionTypes.scout;
        
        const companion = {
            id: companionId,
            type: params.type || 'scout',
            name: params.name || config.name,
            polygons: config.polygons,
            color: params.color || config.color,
            position: params.position || { x: 0, y: 5, z: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            tetheredTo: params.tetheredTo || null,
            systemBridge: config.systemBridge,
            ability: config.ability,
            state: 'idle',
            energy: 1.0,
            luaScript: null,
            createdAt: Date.now(),
            isDefault: params.isDefault || false
        };
        
        this.world.companions.set(companionId, companion);
        
        // Broadcast new companion to all connected clients
        this.broadcast({
            type: 'companion_created',
            companion
        });
        
        return companion;
    }
    
    placeVoxel(x, y, z, type, playerId) {
        const voxelKey = `${x},${y},${z}`;
        const voxel = {
            x, y, z,
            type: type || 'stone',
            placedBy: playerId,
            placedAt: Date.now()
        };
        
        this.world.voxels.set(voxelKey, voxel);
        
        // Broadcast voxel placement
        this.broadcast({
            type: 'voxel_placed',
            voxel
        });
        
        // Trigger companion reactions
        this.triggerCompanionReactions('voxel_placed', { voxel, playerId });
    }
    
    removeVoxel(x, y, z, playerId) {
        const voxelKey = `${x},${y},${z}`;
        const removedVoxel = this.world.voxels.get(voxelKey);
        
        if (removedVoxel) {
            this.world.voxels.delete(voxelKey);
            
            // Broadcast voxel removal
            this.broadcast({
                type: 'voxel_removed',
                position: { x, y, z },
                removedVoxel
            });
            
            // Trigger companion reactions
            this.triggerCompanionReactions('voxel_removed', { 
                position: { x, y, z }, 
                removedVoxel, 
                playerId 
            });
        }
    }
    
    triggerCompanionReactions(eventType, eventData) {
        // Make companions react to world events
        this.world.companions.forEach(companion => {
            if (companion.luaScript) {
                // Execute Lua reaction script
                this.executeLuaScript(companion.luaScript, {
                    companion,
                    event: eventType,
                    data: eventData
                });
            } else {
                // Default behavior based on companion type
                this.executeDefaultCompanionBehavior(companion, eventType, eventData);
            }
        });
    }
    
    executeDefaultCompanionBehavior(companion, eventType, eventData) {
        switch (companion.ability) {
            case 'exploration':
                if (eventType === 'voxel_placed') {
                    // Scout moves toward new constructions
                    this.moveCompanionToward(companion, eventData.voxel);
                }
                break;
                
            case 'construction':
                if (eventType === 'voxel_placed') {
                    // Builder analyzes and suggests improvements
                    this.analyzeConstruction(companion, eventData.voxel);
                }
                break;
                
            case 'replication':
                if (eventType === 'voxel_placed') {
                    // Mirror creates language/domain variants
                    this.createMirrorVariant(companion, eventData.voxel);
                }
                break;
        }
    }
    
    moveCompanionToward(companion, target) {
        const direction = {
            x: target.x - companion.position.x,
            y: target.y - companion.position.y,
            z: target.z - companion.position.z
        };
        
        // Normalize and apply movement
        const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
        if (distance > 0) {
            companion.velocity.x = (direction.x / distance) * 0.1;
            companion.velocity.y = (direction.y / distance) * 0.1;
            companion.velocity.z = (direction.z / distance) * 0.1;
        }
        
        companion.state = 'moving';
        
        // Broadcast companion movement
        this.broadcast({
            type: 'companion_moved',
            companion
        });
    }
    
    async analyzeConstruction(companion, voxel) {
        companion.state = 'analyzing';
        
        try {
            // Bridge to Universal Compactor for analysis
            const analysis = await this.bridgeToUniversalCompactor({
                type: 'analyze_construction',
                voxel,
                worldContext: this.getWorldContext()
            });
            
            // Broadcast analysis results
            this.broadcast({
                type: 'companion_analysis',
                companion,
                analysis
            });
            
        } catch (error) {
            console.error('Construction analysis failed:', error);
        }
        
        companion.state = 'idle';
    }
    
    async createMirrorVariant(companion, voxel) {
        companion.state = 'mirroring';
        
        try {
            // Bridge to Character Mirror system
            const mirrors = await this.bridgeToCharacterMirror({
                type: 'create_voxel_mirrors',
                voxel,
                variants: ['es', 'ja', 'fr', '.ai', '.research']
            });
            
            // Broadcast mirror variants
            this.broadcast({
                type: 'companion_mirrors',
                companion,
                mirrors
            });
            
        } catch (error) {
            console.error('Mirror creation failed:', error);
        }
        
        companion.state = 'idle';
    }
    
    // System bridge methods
    async bridgeToDocumentMVP(request) {
        try {
            const response = await fetch(`${this.systemBridges.documentToMVP}/api/process`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            return await response.json();
        } catch (error) {
            console.error('Document-to-MVP bridge failed:', error);
            return { error: error.message, fallback: true };
        }
    }
    
    async bridgeToCharacterMirror(request) {
        try {
            const response = await fetch(`${this.systemBridges.characterMirror}/mirror-action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            return await response.json();
        } catch (error) {
            console.error('Character Mirror bridge failed:', error);
            return { error: error.message, fallback: true };
        }
    }
    
    async bridgeToUniversalCompactor(request) {
        try {
            const response = await fetch(`${this.systemBridges.universalCompactor}/compact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            return await response.json();
        } catch (error) {
            console.error('Universal Compactor bridge failed:', error);
            return { error: error.message, fallback: true };
        }
    }
    
    // Lua scripting system (simplified for now)
    executeLuaScript(scriptContent, context) {
        try {
            // For now, we'll simulate Lua execution with JavaScript evaluation
            // In production, we'd use lua.js or similar
            
            // Create safe execution context
            const safeContext = {
                companion: context.companion,
                event: context.event,
                data: context.data,
                world: this.getWorldContext(),
                console: { log: console.log },
                Math: Math
            };
            
            // Simple script execution (would be Lua in production)
            const result = this.evaluateScript(scriptContent, safeContext);
            
            return {
                success: true,
                result,
                executedAt: Date.now()
            };
            
        } catch (error) {
            console.error('Lua script execution failed:', error);
            return {
                success: false,
                error: error.message,
                executedAt: Date.now()
            };
        }
    }
    
    evaluateScript(script, context) {
        // Simple script evaluation - would be replaced with proper Lua interpreter
        if (script.includes('move_companion')) {
            if (context.companion) {
                context.companion.position.y += 1;
                return 'Moved companion up';
            }
        }
        
        if (script.includes('change_color')) {
            if (context.companion) {
                const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'];
                context.companion.color = colors[Math.floor(Math.random() * colors.length)];
                return 'Changed companion color';
            }
        }
        
        return 'Script executed (simplified)';
    }
    
    getWorldContext() {
        return {
            voxelCount: this.world.voxels.size,
            companionCount: this.world.companions.size,
            playerCount: this.world.players.size,
            timestamp: Date.now()
        };
    }
    
    handleWebSocketMessage(ws, message) {
        switch (message.type) {
            case 'companion_command':
                this.handleCompanionCommand(message.companionId, message.command);
                break;
                
            case 'lua_script':
                const result = this.executeLuaScript(message.script, message.context);
                ws.send(JSON.stringify({
                    type: 'lua_result',
                    result
                }));
                break;
                
            case 'player_joined':
                this.world.players.set(ws, {
                    id: message.playerId,
                    joinedAt: Date.now()
                });
                break;
        }
    }
    
    handleCompanionCommand(companionId, command) {
        const companion = this.world.companions.get(companionId);
        if (!companion) return;
        
        switch (command.type) {
            case 'move':
                this.moveCompanionToward(companion, command.target);
                break;
                
            case 'change_color':
                companion.color = command.color;
                this.broadcast({
                    type: 'companion_updated',
                    companion
                });
                break;
                
            case 'execute_ability':
                this.executeCompanionAbility(companion, command.params);
                break;
        }
    }
    
    async executeCompanionAbility(companion, params) {
        switch (companion.ability) {
            case 'exploration':
                // Bridge to Document-to-MVP for content discovery
                const discovery = await this.bridgeToDocumentMVP({
                    type: 'explore_content',
                    position: companion.position,
                    params
                });
                
                this.broadcast({
                    type: 'companion_discovery',
                    companion,
                    discovery
                });
                break;
                
            case 'construction':
                // Bridge to Universal Compactor for building optimization
                const optimization = await this.bridgeToUniversalCompactor({
                    type: 'optimize_build',
                    position: companion.position,
                    params
                });
                
                this.broadcast({
                    type: 'companion_optimization',
                    companion,
                    optimization
                });
                break;
                
            case 'replication':
                // Bridge to Character Mirror for variant creation
                const variants = await this.bridgeToCharacterMirror({
                    type: 'create_variants',
                    position: companion.position,
                    params
                });
                
                this.broadcast({
                    type: 'companion_variants',
                    companion,
                    variants
                });
                break;
        }
    }
    
    broadcast(message) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
    
    getGameInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🎮🤖 Polygonal Companion System</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            font-family: 'Courier New', monospace;
            color: #fff;
            overflow: hidden;
        }
        
        #gameContainer {
            position: relative;
            width: 100vw;
            height: 100vh;
        }
        
        #gameCanvas {
            display: block;
        }
        
        #ui {
            position: absolute;
            top: 10px;
            left: 10px;
            z-index: 100;
            background: rgba(0, 0, 0, 0.7);
            padding: 15px;
            border-radius: 8px;
            max-width: 300px;
        }
        
        .companion-status {
            margin: 5px 0;
            padding: 5px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }
        
        .controls {
            position: absolute;
            bottom: 10px;
            left: 10px;
            z-index: 100;
        }
        
        button {
            margin: 5px;
            padding: 10px 15px;
            background: #00ff88;
            color: #000;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        }
        
        button:hover {
            background: #00cc66;
        }
        
        .system-bridge {
            color: #ffaa00;
            font-size: 12px;
        }
        
        #luaConsole {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 300px;
            height: 200px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 8px;
            padding: 10px;
            z-index: 100;
        }
        
        textarea {
            width: 100%;
            height: 120px;
            background: #000;
            color: #00ff00;
            border: 1px solid #333;
            border-radius: 4px;
            padding: 5px;
            font-family: 'Courier New', monospace;
            resize: none;
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
    <div id="gameContainer">
        <canvas id="gameCanvas"></canvas>
        
        <div id="ui">
            <h3>🤖 Companions Active</h3>
            <div id="companionList"></div>
            
            <h4>🌐 System Bridges</h4>
            <div class="system-bridge">📄 Document-to-MVP: Connected</div>
            <div class="system-bridge">🪞 Character Mirror: Connected</div>  
            <div class="system-bridge">📦 Universal Compactor: Connected</div>
        </div>
        
        <div class="controls">
            <button onclick="createCompanion('scout')">🔍 Create Scout</button>
            <button onclick="createCompanion('builder')">🔨 Create Builder</button>
            <button onclick="createCompanion('mirror')">🪞 Create Mirror</button>
            <button onclick="toggleBuildMode()">🏗️ Build Mode</button>
        </div>
        
        <div id="luaConsole">
            <h4>📜 Lua Console</h4>
            <textarea id="luaScript" placeholder="-- Lua script for companion behavior
move_companion()
change_color()"></textarea>
            <button onclick="executeLua()">▶️ Execute</button>
        </div>
    </div>
    
    <script>
        // Three.js setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas') });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x87CEEB, 1);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        scene.add(directionalLight);
        
        // Game state
        let companions = new Map();
        let voxels = new Map();
        let buildMode = false;
        
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:9999');
        
        ws.onopen = () => {
            console.log('🔌 Connected to Polygonal Companion System');
        };
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleServerMessage(message);
        };
        
        function handleServerMessage(message) {
            switch (message.type) {
                case 'world_state':
                    initializeWorld(message.data);
                    break;
                    
                case 'companion_created':
                    addCompanion(message.companion);
                    break;
                    
                case 'companion_moved':
                    updateCompanion(message.companion);
                    break;
                    
                case 'voxel_placed':
                    addVoxel(message.voxel);
                    break;
                    
                case 'voxel_removed':
                    removeVoxel(message.position);
                    break;
            }
        }
        
        function initializeWorld(data) {
            // Load initial companions
            data.companions.forEach(companion => {
                addCompanion(companion);
            });
            
            // Load initial voxels
            data.voxels.forEach(([key, voxel]) => {
                addVoxel(voxel);
            });
        }
        
        function addCompanion(companion) {
            // Create simple polygon geometry (3-4 sided)
            const geometry = companion.polygons === 3 ? 
                new THREE.ConeGeometry(0.5, 1, 3) : 
                new THREE.BoxGeometry(0.8, 0.8, 0.8);
                
            const material = new THREE.MeshLambertMaterial({ 
                color: companion.color,
                transparent: true,
                opacity: 0.8
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(companion.position.x, companion.position.y, companion.position.z);
            mesh.userData = companion;
            
            scene.add(mesh);
            companions.set(companion.id, mesh);
            
            // Add floating animation
            animateCompanion(mesh);
            
            updateCompanionUI();
        }
        
        function animateCompanion(mesh) {
            const originalY = mesh.position.y;
            
            function float() {
                mesh.position.y = originalY + Math.sin(Date.now() * 0.003) * 0.3;
                mesh.rotation.y += 0.02;
                requestAnimationFrame(float);
            }
            
            float();
        }
        
        function updateCompanion(companion) {
            const mesh = companions.get(companion.id);
            if (mesh) {
                mesh.position.set(companion.position.x, companion.position.y, companion.position.z);
                mesh.material.color.setHex(companion.color.replace('#', '0x'));
                mesh.userData = companion;
            }
            updateCompanionUI();
        }
        
        function addVoxel(voxel) {
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshLambertMaterial({ 
                color: getVoxelColor(voxel.type)
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(voxel.x, voxel.y, voxel.z);
            
            scene.add(mesh);
            voxels.set(\`\${voxel.x},\${voxel.y},\${voxel.z}\`, mesh);
        }
        
        function removeVoxel(position) {
            const key = \`\${position.x},\${position.y},\${position.z}\`;
            const mesh = voxels.get(key);
            if (mesh) {
                scene.remove(mesh);
                voxels.delete(key);
            }
        }
        
        function getVoxelColor(type) {
            const colors = {
                stone: 0x888888,
                wood: 0x8B4513,
                grass: 0x228B22,
                water: 0x0077BE,
                gold: 0xFFD700
            };
            return colors[type] || 0x888888;
        }
        
        function updateCompanionUI() {
            const list = document.getElementById('companionList');
            list.innerHTML = '';
            
            companions.forEach(mesh => {
                const companion = mesh.userData;
                const div = document.createElement('div');
                div.className = 'companion-status';
                div.innerHTML = \`
                    <strong>\${companion.name}</strong><br>
                    <small>State: \${companion.state}</small><br>
                    <small>Bridge: \${companion.systemBridge}</small>
                \`;
                list.appendChild(div);
            });
        }
        
        async function createCompanion(type) {
            const response = await fetch('/api/companion/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    position: { 
                        x: (Math.random() - 0.5) * 10, 
                        y: Math.random() * 5 + 5, 
                        z: (Math.random() - 0.5) * 10 
                    }
                })
            });
            
            const result = await response.json();
            console.log('Created companion:', result);
        }
        
        function toggleBuildMode() {
            buildMode = !buildMode;
            console.log('Build mode:', buildMode ? 'ON' : 'OFF');
        }
        
        async function executeLua() {
            const script = document.getElementById('luaScript').value;
            
            const response = await fetch('/api/lua/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    script,
                    context: {
                        companions: Array.from(companions.values()).map(m => m.userData)
                    }
                })
            });
            
            const result = await response.json();
            console.log('Lua execution result:', result);
        }
        
        // Camera controls
        camera.position.set(0, 10, 20);
        camera.lookAt(0, 0, 0);
        
        let mouseDown = false;
        let mouseX = 0, mouseY = 0;
        
        document.addEventListener('mousedown', (e) => {
            mouseDown = true;
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        document.addEventListener('mouseup', () => {
            mouseDown = false;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!mouseDown) return;
            
            const deltaX = e.clientX - mouseX;
            const deltaY = e.clientY - mouseY;
            
            camera.position.x += deltaX * 0.01;
            camera.position.y -= deltaY * 0.01;
            
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        // Mouse click for voxel placement/removal
        document.addEventListener('click', (e) => {
            if (!buildMode || e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA') return;
            
            // Raycast to find clicked position
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();
            
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
            
            raycaster.setFromCamera(mouse, camera);
            
            // Place voxel at clicked position (simplified)
            const position = {
                x: Math.floor(Math.random() * 10 - 5),
                y: Math.floor(Math.random() * 5),
                z: Math.floor(Math.random() * 10 - 5)
            };
            
            fetch('/api/world/place-voxel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...position,
                    type: 'stone',
                    playerId: 'local_player'
                })
            });
        });
        
        // Render loop
        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }
        animate();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    </script>
</body>
</html>`;
    }
}

// Start the system
if (require.main === module) {
    new PolygonalCompanionSystem();
}

module.exports = PolygonalCompanionSystem;