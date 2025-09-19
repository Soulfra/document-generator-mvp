#!/usr/bin/env node

/**
 * ISOMETRIC WORLD MAP EDITOR
 * 3rd person RTS-style map editor with Warcraft/StarCraft/Diablo inspired map generation
 * Watch and edit your mascot world in classic isometric perspective
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs').promises;

class IsometricWorldMapEditor {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 9970;
        
        this.worldState = {
            map: {
                width: 64,
                height: 64,
                tiles: new Map(),
                structures: new Map(),
                mascots: new Map(),
                resources: new Map(),
                terrain_features: new Map()
            },
            editor: {
                current_tool: 'select',
                brush_size: 1,
                selected_terrain: 'grass',
                selected_structure: 'basic_building',
                grid_visible: true,
                camera: { x: 32, y: 32, zoom: 1.0 }
            },
            generation: {
                seed: Math.floor(Math.random() * 1000000),
                biomes: ['forest', 'plains', 'mountains', 'desert', 'swamp'],
                structure_density: 0.3,
                resource_density: 0.2
            }
        };

        this.terrainTypes = {
            grass: { color: '#4CAF50', walkable: true, build_cost: 1 },
            stone: { color: '#757575', walkable: true, build_cost: 2 },
            water: { color: '#2196F3', walkable: false, build_cost: 0 },
            sand: { color: '#FFC107', walkable: true, build_cost: 1 },
            dirt: { color: '#8D6E63', walkable: true, build_cost: 1 },
            lava: { color: '#F44336', walkable: false, build_cost: 0 },
            ice: { color: '#E1F5FE', walkable: true, build_cost: 3 },
            crystal: { color: '#9C27B0', walkable: true, build_cost: 5 }
        };

        this.structureTypes = {
            basic_building: { 
                name: 'Basic Building', 
                size: { w: 2, h: 2 }, 
                color: '#8D6E63',
                hitpoints: 100,
                function: 'housing'
            },
            mascot_home: { 
                name: 'Mascot Home', 
                size: { w: 3, h: 3 }, 
                color: '#FF9800',
                hitpoints: 150,
                function: 'residence'
            },
            workshop: { 
                name: 'Workshop', 
                size: { w: 4, h: 3 }, 
                color: '#607D8B',
                hitpoints: 200,
                function: 'production'
            },
            tower: { 
                name: 'Tower', 
                size: { w: 2, h: 2 }, 
                color: '#3F51B5',
                hitpoints: 300,
                function: 'defense'
            },
            portal: { 
                name: 'Portal', 
                size: { w: 2, h: 2 }, 
                color: '#9C27B0',
                hitpoints: 50,
                function: 'transport'
            },
            resource_mine: { 
                name: 'Resource Mine', 
                size: { w: 3, h: 3 }, 
                color: '#FF5722',
                hitpoints: 250,
                function: 'resource_generation'
            }
        };

        this.setupMapGeneration();
        this.connectToMascotTheater();
        this.setupRoutes();
        this.setupWebSocket();
        this.startMapUpdateLoop();
    }

    setupMapGeneration() {
        console.log('🗺️ Initializing isometric map generation...');
        this.generateInitialTerrain();
        this.placeInitialStructures();
        this.generateResources();
    }

    generateInitialTerrain() {
        // Generate Perlin-like noise for terrain
        const { width, height } = this.worldState.map;
        
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const tileId = `${x},${y}`;
                
                // Use noise function to determine terrain
                const noiseValue = this.simpleNoise(x * 0.1, y * 0.1, this.worldState.generation.seed);
                let terrainType = 'grass';
                
                if (noiseValue < -0.3) terrainType = 'water';
                else if (noiseValue < -0.1) terrainType = 'sand';
                else if (noiseValue < 0.1) terrainType = 'grass';
                else if (noiseValue < 0.3) terrainType = 'dirt';
                else if (noiseValue < 0.5) terrainType = 'stone';
                else terrainType = 'crystal';
                
                this.worldState.map.tiles.set(tileId, {
                    x, y,
                    terrain: terrainType,
                    elevation: Math.floor((noiseValue + 1) * 5),
                    discovered: false,
                    ...this.terrainTypes[terrainType]
                });
            }
        }
        
        console.log(`🌍 Generated ${width}x${height} terrain map with seed ${this.worldState.generation.seed}`);
    }

    simpleNoise(x, y, seed) {
        // Simple pseudo-noise function
        const n = Math.sin(x + seed) * Math.cos(y + seed) + 
                  Math.sin(x * 2.1 + seed * 1.3) * Math.cos(y * 1.7 + seed * 0.8) * 0.5 +
                  Math.sin(x * 0.8 + seed * 2.1) * Math.cos(y * 2.3 + seed * 1.5) * 0.25;
        return Math.max(-1, Math.min(1, n));
    }

    placeInitialStructures() {
        const { width, height } = this.worldState.map;
        const structureCount = Math.floor(width * height * this.worldState.generation.structure_density / 100);
        
        for (let i = 0; i < structureCount; i++) {
            const x = Math.floor(Math.random() * (width - 5)) + 2;
            const y = Math.floor(Math.random() * (height - 5)) + 2;
            
            const structureTypes = Object.keys(this.structureTypes);
            const structureType = structureTypes[Math.floor(Math.random() * structureTypes.length)];
            
            if (this.canPlaceStructure(x, y, structureType)) {
                this.placeStructure(x, y, structureType, null, true);
            }
        }
        
        console.log(`🏗️ Placed ${this.worldState.map.structures.size} initial structures`);
    }

    generateResources() {
        const { width, height } = this.worldState.map;
        const resourceTypes = ['gold', 'wood', 'stone', 'crystal', 'food'];
        const resourceCount = Math.floor(width * height * this.worldState.generation.resource_density / 100);
        
        for (let i = 0; i < resourceCount; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            
            const resourceId = `resource_${x}_${y}`;
            this.worldState.map.resources.set(resourceId, {
                id: resourceId,
                x, y,
                type: resourceType,
                amount: Math.floor(Math.random() * 1000) + 100,
                respawn_rate: Math.floor(Math.random() * 10) + 1
            });
        }
        
        console.log(`💎 Generated ${this.worldState.map.resources.size} resource nodes`);
    }

    connectToMascotTheater() {
        // Connect to the existing mascot theater
        try {
            this.mascotConnection = new WebSocket('ws://localhost:9965');
            
            this.mascotConnection.on('open', () => {
                console.log('🎭 Connected to mascot theater for live mascot data');
            });

            this.mascotConnection.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleMascotUpdate(message);
                } catch (e) {
                    // Invalid message, ignore
                }
            });

            this.mascotConnection.on('error', () => {
                console.log('🏠 Running map editor in standalone mode');
            });

        } catch (error) {
            console.log('🏠 Map editor running standalone');
        }
    }

    handleMascotUpdate(message) {
        switch (message.type) {
            case 'mascot_spawned':
                this.addMascotToMap(message.mascot);
                break;
            case 'building_completed':
                this.addBuildingToMap(message.room);
                break;
            case 'mascot_cheered':
                this.animateMascot(message.mascot.id, 'celebration');
                break;
        }
    }

    addMascotToMap(mascot) {
        // Find a good spawn location
        const spawnLocation = this.findSpawnLocation();
        
        this.worldState.map.mascots.set(mascot.id, {
            id: mascot.id,
            name: mascot.name,
            personality: mascot.personality,
            x: spawnLocation.x,
            y: spawnLocation.y,
            activity: mascot.activity,
            energy: mascot.energy,
            mood: mascot.mood,
            animation: 'idle',
            path: [],
            destination: null
        });

        this.broadcast({
            type: 'mascot_added_to_map',
            mascot: this.worldState.map.mascots.get(mascot.id)
        });
    }

    addBuildingToMap(room) {
        const location = this.findBuildingLocation();
        const structureType = this.roomTypeToStructure(room.type);
        
        if (this.canPlaceStructure(location.x, location.y, structureType)) {
            const buildingId = this.placeStructure(location.x, location.y, structureType, room.owner);
            
            this.broadcast({
                type: 'building_added_to_map',
                building: this.worldState.map.structures.get(buildingId),
                room: room
            });
        }
    }

    roomTypeToStructure(roomType) {
        const mapping = {
            'Studio': 'workshop',
            'Workshop': 'workshop',
            'Lounge': 'mascot_home',
            'Gallery': 'basic_building',
            'Hideout': 'tower',
            'Lab': 'workshop',
            'Garden': 'mascot_home'
        };
        return mapping[roomType] || 'basic_building';
    }

    findSpawnLocation() {
        const { width, height } = this.worldState.map;
        let attempts = 0;
        
        while (attempts < 100) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            const tile = this.worldState.map.tiles.get(`${x},${y}`);
            
            if (tile && tile.walkable && !this.isLocationOccupied(x, y)) {
                return { x, y };
            }
            attempts++;
        }
        
        return { x: Math.floor(width/2), y: Math.floor(height/2) };
    }

    findBuildingLocation() {
        const { width, height } = this.worldState.map;
        let attempts = 0;
        
        while (attempts < 100) {
            const x = Math.floor(Math.random() * (width - 5)) + 2;
            const y = Math.floor(Math.random() * (height - 5)) + 2;
            
            if (this.canPlaceStructure(x, y, 'basic_building')) {
                return { x, y };
            }
            attempts++;
        }
        
        return { x: Math.floor(width/2), y: Math.floor(height/2) };
    }

    canPlaceStructure(x, y, structureType) {
        const structure = this.structureTypes[structureType];
        const { w, h } = structure.size;
        
        for (let dx = 0; dx < w; dx++) {
            for (let dy = 0; dy < h; dy++) {
                const checkX = x + dx;
                const checkY = y + dy;
                const tile = this.worldState.map.tiles.get(`${checkX},${checkY}`);
                
                if (!tile || !tile.walkable || this.isLocationOccupied(checkX, checkY)) {
                    return false;
                }
            }
        }
        
        return true;
    }

    placeStructure(x, y, structureType, owner = null, isGenerated = false) {
        const structureId = `structure_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const structure = this.structureTypes[structureType];
        
        this.worldState.map.structures.set(structureId, {
            id: structureId,
            x, y,
            type: structureType,
            name: structure.name,
            size: structure.size,
            color: structure.color,
            hitpoints: structure.hitpoints,
            max_hitpoints: structure.hitpoints,
            function: structure.function,
            owner: owner,
            built_at: new Date().toISOString(),
            is_generated: isGenerated
        });
        
        return structureId;
    }

    isLocationOccupied(x, y) {
        // Check if any structure occupies this location
        for (const structure of this.worldState.map.structures.values()) {
            const { w, h } = structure.size;
            if (x >= structure.x && x < structure.x + w &&
                y >= structure.y && y < structure.y + h) {
                return true;
            }
        }
        
        // Check if any mascot is at this location
        for (const mascot of this.worldState.map.mascots.values()) {
            if (mascot.x === x && mascot.y === y) {
                return true;
            }
        }
        
        return false;
    }

    setupRoutes() {
        this.app.use(express.json());
        this.app.use(express.static('public'));

        this.app.get('/', (req, res) => {
            res.send(this.getIsometricEditorHTML());
        });

        this.app.get('/api/map', (req, res) => {
            res.json({
                map: {
                    width: this.worldState.map.width,
                    height: this.worldState.map.height,
                    tiles: Array.from(this.worldState.map.tiles.entries()),
                    structures: Array.from(this.worldState.map.structures.values()),
                    mascots: Array.from(this.worldState.map.mascots.values()),
                    resources: Array.from(this.worldState.map.resources.values())
                },
                editor: this.worldState.editor,
                generation: this.worldState.generation
            });
        });

        this.app.post('/api/map/generate', (req, res) => {
            const { seed, biome, structure_density, resource_density } = req.body;
            
            if (seed) this.worldState.generation.seed = seed;
            if (structure_density) this.worldState.generation.structure_density = structure_density;
            if (resource_density) this.worldState.generation.resource_density = resource_density;
            
            // Clear existing map
            this.worldState.map.tiles.clear();
            this.worldState.map.structures.clear();
            this.worldState.map.resources.clear();
            
            // Regenerate
            this.generateInitialTerrain();
            this.placeInitialStructures();
            this.generateResources();
            
            this.broadcast({
                type: 'map_regenerated',
                seed: this.worldState.generation.seed
            });
            
            res.json({ status: 'map_regenerated', seed: this.worldState.generation.seed });
        });

        this.app.post('/api/map/place-structure', (req, res) => {
            const { x, y, structure_type, owner } = req.body;
            
            if (this.canPlaceStructure(x, y, structure_type)) {
                const structureId = this.placeStructure(x, y, structure_type, owner);
                const structure = this.worldState.map.structures.get(structureId);
                
                this.broadcast({
                    type: 'structure_placed',
                    structure: structure
                });
                
                res.json({ status: 'structure_placed', structure });
            } else {
                res.json({ status: 'cannot_place', reason: 'location_occupied_or_invalid' });
            }
        });

        this.app.post('/api/map/set-terrain', (req, res) => {
            const { x, y, terrain_type } = req.body;
            const tileId = `${x},${y}`;
            const tile = this.worldState.map.tiles.get(tileId);
            
            if (tile && this.terrainTypes[terrain_type]) {
                tile.terrain = terrain_type;
                Object.assign(tile, this.terrainTypes[terrain_type]);
                
                this.broadcast({
                    type: 'terrain_changed',
                    tile: tile
                });
                
                res.json({ status: 'terrain_changed', tile });
            } else {
                res.json({ status: 'invalid_location_or_terrain' });
            }
        });

        this.app.get('/api/map/export', (req, res) => {
            const mapData = {
                metadata: {
                    width: this.worldState.map.width,
                    height: this.worldState.map.height,
                    seed: this.worldState.generation.seed,
                    generated_at: new Date().toISOString()
                },
                tiles: Array.from(this.worldState.map.tiles.entries()),
                structures: Array.from(this.worldState.map.structures.values()),
                resources: Array.from(this.worldState.map.resources.values()),
                mascots: Array.from(this.worldState.map.mascots.values())
            };
            
            res.setHeader('Content-Disposition', `attachment; filename="isometric_map_${this.worldState.generation.seed}.json"`);
            res.json(mapData);
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🗺️ New map editor user connected');
            
            ws.send(JSON.stringify({
                type: 'map_editor_welcome',
                map_size: { width: this.worldState.map.width, height: this.worldState.map.height },
                seed: this.worldState.generation.seed,
                tools_available: ['select', 'terrain', 'structure', 'erase', 'mascot_move']
            }));

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleEditorCommand(data);
                } catch (e) {
                    console.log('Invalid editor command:', e);
                }
            });
        });
    }

    handleEditorCommand(data) {
        switch (data.type) {
            case 'editor_tool_change':
                this.worldState.editor.current_tool = data.tool;
                this.broadcast({ type: 'tool_changed', tool: data.tool });
                break;
            case 'camera_move':
                this.worldState.editor.camera.x = data.x;
                this.worldState.editor.camera.y = data.y;
                this.worldState.editor.camera.zoom = data.zoom || this.worldState.editor.camera.zoom;
                break;
            case 'regenerate_map':
                this.worldState.generation.seed = data.seed || Math.floor(Math.random() * 1000000);
                this.setupMapGeneration();
                this.broadcast({ type: 'map_regenerated', seed: this.worldState.generation.seed });
                break;
        }
    }

    startMapUpdateLoop() {
        // Update mascot positions and animations
        setInterval(() => {
            this.updateMascotPositions();
            this.updateResources();
            
            if (this.worldState.map.mascots.size > 0 || this.worldState.map.structures.size > 0) {
                this.broadcast({
                    type: 'map_update',
                    mascots: Array.from(this.worldState.map.mascots.values()),
                    timestamp: new Date().toISOString()
                });
            }
        }, 1000);

        console.log('🎮 Map update loop started - 1 second intervals');
    }

    updateMascotPositions() {
        for (const mascot of this.worldState.map.mascots.values()) {
            // Simple random movement if no destination
            if (!mascot.destination && Math.random() < 0.1) {
                const directions = [
                    { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                    { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
                    { dx: -1, dy: -1 }, { dx: 1, dy: 1 },
                    { dx: -1, dy: 1 }, { dx: 1, dy: -1 }
                ];
                
                const direction = directions[Math.floor(Math.random() * directions.length)];
                const newX = Math.max(0, Math.min(this.worldState.map.width - 1, mascot.x + direction.dx));
                const newY = Math.max(0, Math.min(this.worldState.map.height - 1, mascot.y + direction.dy));
                
                const tile = this.worldState.map.tiles.get(`${newX},${newY}`);
                if (tile && tile.walkable && !this.isLocationOccupied(newX, newY)) {
                    mascot.x = newX;
                    mascot.y = newY;
                    mascot.animation = 'walking';
                } else {
                    mascot.animation = 'idle';
                }
            }
        }
    }

    updateResources() {
        for (const resource of this.worldState.map.resources.values()) {
            if (resource.amount < 1000 && Math.random() < 0.05) {
                resource.amount += resource.respawn_rate;
            }
        }
    }

    broadcast(data) {
        const message = JSON.stringify(data);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    getIsometricEditorHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🗺️ Isometric World Map Editor</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Courier New', monospace;
            background: #1a1a1a;
            color: #ffffff;
            overflow: hidden;
            height: 100vh;
        }

        .editor-container {
            display: flex;
            height: 100vh;
        }

        .toolbar {
            width: 250px;
            background: #2d2d2d;
            border-right: 2px solid #444;
            padding: 15px;
            overflow-y: auto;
        }

        .map-viewport {
            flex: 1;
            position: relative;
            background: #0f0f0f;
            overflow: hidden;
        }

        .canvas-container {
            position: relative;
            width: 100%;
            height: 100%;
        }

        #map-canvas {
            display: block;
            cursor: crosshair;
            image-rendering: pixelated;
        }

        .toolbar h3 {
            color: #ffd700;
            margin-bottom: 10px;
            border-bottom: 1px solid #444;
            padding-bottom: 5px;
        }

        .tool-section {
            margin-bottom: 20px;
        }

        .tool-btn {
            width: 100%;
            padding: 8px;
            margin: 2px 0;
            background: #404040;
            border: 1px solid #666;
            color: white;
            cursor: pointer;
            font-family: inherit;
            transition: all 0.2s;
        }

        .tool-btn:hover {
            background: #505050;
            border-color: #888;
        }

        .tool-btn.active {
            background: #1976d2;
            border-color: #42a5f5;
        }

        .terrain-palette {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 3px;
            margin-top: 10px;
        }

        .terrain-swatch {
            width: 40px;
            height: 40px;
            border: 2px solid #666;
            cursor: pointer;
            transition: border-color 0.2s;
            position: relative;
        }

        .terrain-swatch:hover {
            border-color: #999;
        }

        .terrain-swatch.selected {
            border-color: #ffd700;
            box-shadow: 0 0 5px #ffd700;
        }

        .structure-list {
            max-height: 200px;
            overflow-y: auto;
        }

        .structure-item {
            padding: 5px;
            margin: 2px 0;
            background: #404040;
            border: 1px solid #666;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }

        .structure-item:hover {
            background: #505050;
        }

        .structure-item.selected {
            background: #1976d2;
        }

        .map-info {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.8);
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            color: #ccc;
        }

        .minimap {
            position: absolute;
            bottom: 10px;
            right: 10px;
            width: 150px;
            height: 150px;
            background: rgba(0,0,0,0.8);
            border: 2px solid #444;
            border-radius: 5px;
        }

        #minimap-canvas {
            width: 100%;
            height: 100%;
            image-rendering: pixelated;
        }

        .controls {
            margin-top: 15px;
        }

        .input-group {
            margin: 10px 0;
        }

        .input-group label {
            display: block;
            margin-bottom: 5px;
            color: #ccc;
            font-size: 12px;
        }

        .input-group input, .input-group select {
            width: 100%;
            padding: 5px;
            background: #404040;
            border: 1px solid #666;
            color: white;
            font-family: inherit;
        }

        .mascot-indicator {
            position: absolute;
            width: 8px;
            height: 8px;
            background: #ff4444;
            border-radius: 50%;
            pointer-events: none;
            z-index: 10;
            animation: mascotPulse 2s infinite;
        }

        @keyframes mascotPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.5); opacity: 0.7; }
        }

        .building-indicator {
            position: absolute;
            border: 2px solid #00ff00;
            pointer-events: none;
            z-index: 5;
            background: rgba(0,255,0,0.1);
        }

        .status-bar {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 30px;
            background: #2d2d2d;
            border-top: 1px solid #444;
            display: flex;
            align-items: center;
            padding: 0 15px;
            font-size: 12px;
            color: #ccc;
        }

        .zoom-controls {
            position: absolute;
            top: 10px;
            left: 10px;
            display: flex;
            gap: 5px;
        }

        .zoom-btn {
            width: 30px;
            height: 30px;
            background: rgba(0,0,0,0.8);
            border: 1px solid #666;
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }

        .zoom-btn:hover {
            background: rgba(50,50,50,0.8);
        }
    </style>
</head>
<body>
    <div class="editor-container">
        <div class="toolbar">
            <h3>🛠️ Tools</h3>
            <div class="tool-section">
                <button class="tool-btn active" data-tool="select">👆 Select</button>
                <button class="tool-btn" data-tool="terrain">🌍 Terrain</button>
                <button class="tool-btn" data-tool="structure">🏗️ Structure</button>
                <button class="tool-btn" data-tool="erase">🗑️ Erase</button>
                <button class="tool-btn" data-tool="mascot_move">🎭 Move Mascot</button>
            </div>

            <h3>🌍 Terrain</h3>
            <div class="terrain-palette" id="terrain-palette">
                <!-- Terrain swatches will be populated by JavaScript -->
            </div>

            <h3>🏗️ Structures</h3>
            <div class="structure-list" id="structure-list">
                <!-- Structure list will be populated by JavaScript -->
            </div>

            <h3>⚙️ Generation</h3>
            <div class="controls">
                <div class="input-group">
                    <label>Map Seed:</label>
                    <input type="number" id="map-seed" placeholder="Random seed">
                </div>
                <div class="input-group">
                    <label>Structure Density:</label>
                    <input type="range" id="structure-density" min="0" max="1" step="0.1" value="0.3">
                </div>
                <div class="input-group">
                    <label>Resource Density:</label>
                    <input type="range" id="resource-density" min="0" max="1" step="0.1" value="0.2">
                </div>
                <button class="tool-btn" onclick="regenerateMap()">🎲 Generate New Map</button>
                <button class="tool-btn" onclick="exportMap()">💾 Export Map</button>
            </div>

            <h3>📊 Map Stats</h3>
            <div id="map-stats">
                <div>Tiles: <span id="tile-count">0</span></div>
                <div>Structures: <span id="structure-count">0</span></div>
                <div>Mascots: <span id="mascot-count">0</span></div>
                <div>Resources: <span id="resource-count">0</span></div>
            </div>
        </div>

        <div class="map-viewport">
            <div class="zoom-controls">
                <button class="zoom-btn" onclick="changeZoom(0.1)">+</button>
                <button class="zoom-btn" onclick="changeZoom(-0.1)">-</button>
            </div>

            <div class="map-info">
                <div>Seed: <span id="current-seed">Loading...</span></div>
                <div>Camera: <span id="camera-pos">0, 0</span></div>
                <div>Tool: <span id="current-tool">select</span></div>
                <div>Connected: <span id="connection-status">Connecting...</span></div>
            </div>

            <div class="canvas-container">
                <canvas id="map-canvas" width="800" height="600"></canvas>
                <div id="mascot-overlays"></div>
                <div id="building-overlays"></div>
            </div>

            <div class="minimap">
                <canvas id="minimap-canvas" width="150" height="150"></canvas>
            </div>

            <div class="status-bar">
                <span id="status-text">Isometric World Map Editor - Ready</span>
            </div>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:9970');
        let mapData = null;
        let currentTool = 'select';
        let selectedTerrain = 'grass';
        let selectedStructure = 'basic_building';
        let camera = { x: 32, y: 32, zoom: 1.0 };
        let tileSize = 32;
        
        const canvas = document.getElementById('map-canvas');
        const ctx = canvas.getContext('2d');
        const minimapCanvas = document.getElementById('minimap-canvas');
        const minimapCtx = minimapCanvas.getContext('2d');

        const terrainColors = {
            grass: '#4CAF50',
            stone: '#757575',
            water: '#2196F3',
            sand: '#FFC107',
            dirt: '#8D6E63',
            lava: '#F44336',
            ice: '#E1F5FE',
            crystal: '#9C27B0'
        };

        const structureTypes = {
            basic_building: { name: 'Basic Building', color: '#8D6E63' },
            mascot_home: { name: 'Mascot Home', color: '#FF9800' },
            workshop: { name: 'Workshop', color: '#607D8B' },
            tower: { name: 'Tower', color: '#3F51B5' },
            portal: { name: 'Portal', color: '#9C27B0' },
            resource_mine: { name: 'Resource Mine', color: '#FF5722' }
        };

        ws.onopen = () => {
            console.log('🗺️ Connected to map editor!');
            document.getElementById('connection-status').textContent = 'Connected';
            loadMap();
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMapUpdate(data);
        };

        function handleMapUpdate(data) {
            switch (data.type) {
                case 'map_editor_welcome':
                    document.getElementById('current-seed').textContent = data.seed;
                    updateStatus('Map editor ready');
                    break;
                case 'map_regenerated':
                    document.getElementById('current-seed').textContent = data.seed;
                    loadMap();
                    updateStatus('Map regenerated');
                    break;
                case 'structure_placed':
                    loadMap();
                    updateStatus('Structure placed');
                    break;
                case 'mascot_added_to_map':
                    loadMap();
                    updateStatus(\`Mascot \${data.mascot.name} added to map\`);
                    break;
                case 'map_update':
                    if (mapData) {
                        mapData.mascots = data.mascots;
                        renderMap();
                    }
                    break;
            }
        }

        function loadMap() {
            fetch('/api/map')
                .then(response => response.json())
                .then(data => {
                    mapData = data.map;
                    camera = data.editor.camera;
                    document.getElementById('current-seed').textContent = data.generation.seed;
                    document.getElementById('structure-density').value = data.generation.structure_density;
                    document.getElementById('resource-density').value = data.generation.resource_density;
                    
                    updateMapStats();
                    initializeUI();
                    renderMap();
                    renderMinimap();
                });
        }

        function initializeUI() {
            // Initialize terrain palette
            const terrainPalette = document.getElementById('terrain-palette');
            terrainPalette.innerHTML = '';
            
            Object.entries(terrainColors).forEach(([terrain, color]) => {
                const swatch = document.createElement('div');
                swatch.className = 'terrain-swatch';
                swatch.style.backgroundColor = color;
                swatch.title = terrain;
                swatch.dataset.terrain = terrain;
                swatch.onclick = () => selectTerrain(terrain);
                terrainPalette.appendChild(swatch);
            });

            // Initialize structure list
            const structureList = document.getElementById('structure-list');
            structureList.innerHTML = '';
            
            Object.entries(structureTypes).forEach(([type, info]) => {
                const item = document.createElement('div');
                item.className = 'structure-item';
                item.innerHTML = \`<div style="color: \${info.color}">■</div><div>\${info.name}</div>\`;
                item.dataset.structure = type;
                item.onclick = () => selectStructure(type);
                structureList.appendChild(item);
            });

            // Initialize tool buttons
            document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
                btn.onclick = () => selectTool(btn.dataset.tool);
            });
        }

        function selectTool(tool) {
            currentTool = tool;
            document.getElementById('current-tool').textContent = tool;
            
            document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector(\`[data-tool="\${tool}"]\`).classList.add('active');
            
            ws.send(JSON.stringify({ type: 'editor_tool_change', tool: tool }));
        }

        function selectTerrain(terrain) {
            selectedTerrain = terrain;
            document.querySelectorAll('.terrain-swatch').forEach(s => s.classList.remove('selected'));
            document.querySelector(\`[data-terrain="\${terrain}"]\`).classList.add('selected');
        }

        function selectStructure(structure) {
            selectedStructure = structure;
            document.querySelectorAll('.structure-item').forEach(s => s.classList.remove('selected'));
            document.querySelector(\`[data-structure="\${structure}"]\`).classList.add('selected');
        }

        function renderMap() {
            if (!mapData) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            const viewWidth = Math.floor(canvas.width / (tileSize * camera.zoom));
            const viewHeight = Math.floor(canvas.height / (tileSize * camera.zoom));
            const startX = Math.max(0, camera.x - Math.floor(viewWidth / 2));
            const startY = Math.max(0, camera.y - Math.floor(viewHeight / 2));
            
            // Render terrain tiles
            for (let x = startX; x < Math.min(mapData.width, startX + viewWidth); x++) {
                for (let y = startY; y < Math.min(mapData.height, startY + viewHeight); y++) {
                    const tile = mapData.tiles.find(([id, tileData]) => {
                        const [tileX, tileY] = id.split(',').map(Number);
                        return tileX === x && tileY === y;
                    });
                    
                    if (tile) {
                        const [, tileData] = tile;
                        const screenX = (x - startX) * tileSize * camera.zoom;
                        const screenY = (y - startY) * tileSize * camera.zoom;
                        const size = tileSize * camera.zoom;
                        
                        // Isometric offset
                        const isoX = screenX - screenY + canvas.width / 2;
                        const isoY = (screenX + screenY) / 2;
                        
                        ctx.fillStyle = terrainColors[tileData.terrain] || '#666';
                        
                        // Draw diamond shape for isometric view
                        ctx.beginPath();
                        ctx.moveTo(isoX, isoY - size/4);
                        ctx.lineTo(isoX + size/2, isoY);
                        ctx.lineTo(isoX, isoY + size/4);
                        ctx.lineTo(isoX - size/2, isoY);
                        ctx.closePath();
                        ctx.fill();
                        
                        // Add elevation shading
                        if (tileData.elevation > 0) {
                            ctx.fillStyle = 'rgba(255,255,255,0.1)';
                            ctx.fill();
                        }
                    }
                }
            }
            
            // Render structures
            mapData.structures.forEach(structure => {
                if (structure.x >= startX && structure.x < startX + viewWidth &&
                    structure.y >= startY && structure.y < startY + viewHeight) {
                    
                    const screenX = (structure.x - startX) * tileSize * camera.zoom;
                    const screenY = (structure.y - startY) * tileSize * camera.zoom;
                    const size = tileSize * camera.zoom;
                    
                    const isoX = screenX - screenY + canvas.width / 2;
                    const isoY = (screenX + screenY) / 2;
                    
                    ctx.fillStyle = structure.color;
                    ctx.fillRect(isoX - size/4, isoY - size/2, size/2, size);
                    
                    // Structure name
                    if (camera.zoom > 0.5) {
                        ctx.fillStyle = 'white';
                        ctx.font = '10px monospace';
                        ctx.textAlign = 'center';
                        ctx.fillText(structure.name.substring(0, 8), isoX, isoY + size/2 + 12);
                    }
                }
            });
            
            // Render mascots
            mapData.mascots.forEach(mascot => {
                if (mascot.x >= startX && mascot.x < startX + viewWidth &&
                    mascot.y >= startY && mascot.y < startY + viewHeight) {
                    
                    const screenX = (mascot.x - startX) * tileSize * camera.zoom;
                    const screenY = (mascot.y - startY) * tileSize * camera.zoom;
                    const size = tileSize * camera.zoom;
                    
                    const isoX = screenX - screenY + canvas.width / 2;
                    const isoY = (screenX + screenY) / 2;
                    
                    // Mascot indicator
                    ctx.fillStyle = '#ff4444';
                    ctx.beginPath();
                    ctx.arc(isoX, isoY - size/4, 4 * camera.zoom, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Mascot name
                    if (camera.zoom > 0.3) {
                        ctx.fillStyle = 'yellow';
                        ctx.font = '8px monospace';
                        ctx.textAlign = 'center';
                        ctx.fillText(mascot.name.substring(0, 10), isoX, isoY - size/4 - 8);
                    }
                }
            });
            
            updateCameraPos();
        }

        function renderMinimap() {
            if (!mapData) return;

            minimapCtx.clearRect(0, 0, 150, 150);
            
            const scaleX = 150 / mapData.width;
            const scaleY = 150 / mapData.height;
            
            // Render terrain on minimap
            mapData.tiles.forEach(([id, tileData]) => {
                const [x, y] = id.split(',').map(Number);
                const screenX = x * scaleX;
                const screenY = y * scaleY;
                
                minimapCtx.fillStyle = terrainColors[tileData.terrain] || '#666';
                minimapCtx.fillRect(screenX, screenY, scaleX + 1, scaleY + 1);
            });
            
            // Render structures on minimap
            mapData.structures.forEach(structure => {
                const screenX = structure.x * scaleX;
                const screenY = structure.y * scaleY;
                
                minimapCtx.fillStyle = structure.color;
                minimapCtx.fillRect(screenX, screenY, scaleX * 2, scaleY * 2);
            });
            
            // Render mascots on minimap
            mapData.mascots.forEach(mascot => {
                const screenX = mascot.x * scaleX;
                const screenY = mascot.y * scaleY;
                
                minimapCtx.fillStyle = '#ff4444';
                minimapCtx.fillRect(screenX - 1, screenY - 1, 3, 3);
            });
            
            // Camera viewport indicator
            const viewWidth = Math.floor(canvas.width / (tileSize * camera.zoom));
            const viewHeight = Math.floor(canvas.height / (tileSize * camera.zoom));
            const viewX = camera.x * scaleX - (viewWidth * scaleX) / 2;
            const viewY = camera.y * scaleY - (viewHeight * scaleY) / 2;
            
            minimapCtx.strokeStyle = '#ffffff';
            minimapCtx.strokeRect(viewX, viewY, viewWidth * scaleX, viewHeight * scaleY);
        }

        function updateMapStats() {
            if (!mapData) return;
            
            document.getElementById('tile-count').textContent = mapData.tiles.length;
            document.getElementById('structure-count').textContent = mapData.structures.length;
            document.getElementById('mascot-count').textContent = mapData.mascots.length;
            document.getElementById('resource-count').textContent = mapData.resources.length;
        }

        function updateCameraPos() {
            document.getElementById('camera-pos').textContent = \`\${Math.floor(camera.x)}, \${Math.floor(camera.y)}\`;
        }

        function updateStatus(text) {
            document.getElementById('status-text').textContent = text;
        }

        function regenerateMap() {
            const seed = document.getElementById('map-seed').value || Math.floor(Math.random() * 1000000);
            const structureDensity = document.getElementById('structure-density').value;
            const resourceDensity = document.getElementById('resource-density').value;
            
            fetch('/api/map/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    seed: parseInt(seed),
                    structure_density: parseFloat(structureDensity),
                    resource_density: parseFloat(resourceDensity)
                })
            })
            .then(response => response.json())
            .then(data => {
                updateStatus(\`Map regenerated with seed \${data.seed}\`);
            });
        }

        function exportMap() {
            window.open('/api/map/export', '_blank');
        }

        function changeZoom(delta) {
            camera.zoom = Math.max(0.1, Math.min(3.0, camera.zoom + delta));
            renderMap();
        }

        // Canvas event handlers
        canvas.onmousedown = (e) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Convert screen coordinates to map coordinates
            const viewWidth = Math.floor(canvas.width / (tileSize * camera.zoom));
            const viewHeight = Math.floor(canvas.height / (tileSize * camera.zoom));
            const startX = Math.max(0, camera.x - Math.floor(viewWidth / 2));
            const startY = Math.max(0, camera.y - Math.floor(viewHeight / 2));
            
            const mapX = Math.floor(mouseX / (tileSize * camera.zoom)) + startX;
            const mapY = Math.floor(mouseY / (tileSize * camera.zoom)) + startY;
            
            handleMapClick(mapX, mapY);
        };

        canvas.onmousemove = (e) => {
            // Handle camera panning if middle mouse is down
            if (e.buttons === 4) { // Middle mouse button
                const rect = canvas.getBoundingClientRect();
                const deltaX = (e.clientX - rect.left - canvas.width / 2) / (tileSize * camera.zoom);
                const deltaY = (e.clientY - rect.top - canvas.height / 2) / (tileSize * camera.zoom);
                
                camera.x = Math.max(0, Math.min(mapData?.width || 64, camera.x + deltaX * 0.1));
                camera.y = Math.max(0, Math.min(mapData?.height || 64, camera.y + deltaY * 0.1));
                renderMap();
            }
        };

        function handleMapClick(x, y) {
            switch (currentTool) {
                case 'terrain':
                    fetch('/api/map/set-terrain', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ x, y, terrain_type: selectedTerrain })
                    });
                    break;
                    
                case 'structure':
                    fetch('/api/map/place-structure', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ x, y, structure_type: selectedStructure })
                    });
                    break;
                    
                case 'select':
                    updateStatus(\`Selected tile at (\${x}, \${y})\`);
                    break;
            }
        }

        // Initialize
        loadMap();
        
        // Render loop
        setInterval(() => {
            if (mapData) {
                renderMap();
                renderMinimap();
            }
        }, 1000);
    </script>
</body>
</html>
        `;
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🗺️ Isometric World Map Editor: http://localhost:${this.port}`);
            console.log('🎮 Classic RTS-style map editor ready');
            console.log('🎭 Mascot theater integration active');
            console.log('⚙️ Warcraft/StarCraft/Diablo inspired map generation');
        });
    }
}

// Start the isometric map editor
const mapEditor = new IsometricWorldMapEditor();
mapEditor.start();

module.exports = IsometricWorldMapEditor;