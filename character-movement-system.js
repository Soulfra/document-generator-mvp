#!/usr/bin/env node

/**
 * SoulFRA Character Movement & Collision Detection System
 * 
 * Implements 2D grid-based navigation with physics-based movement, collision detection,
 * and smooth pathfinding for the RuneScape-style character progression system.
 * 
 * Features:
 * - 2D grid-based movement with collision detection
 * - Environmental obstacles (tree stumps, barriers, etc.)
 * - Smooth character gliding with physics simulation
 * - A* pathfinding for intelligent routing
 * - Real-time multiplayer position synchronization
 * - Visual mini-map representation
 * - Integration with OSRS data and immortal character system
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const crypto = require('crypto');

class CharacterMovementSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Grid Configuration
            grid: {
                width: config.gridWidth || 100,        // Grid width in tiles
                height: config.gridHeight || 100,      // Grid height in tiles  
                tileSize: config.tileSize || 32,       // Pixels per tile
                coordinateSystem: 'osrs'               // OSRS-style coordinates
            },
            
            // Movement Physics
            physics: {
                maxSpeed: config.maxSpeed || 2.5,      // Tiles per second
                acceleration: config.acceleration || 8.0,
                friction: config.friction || 0.8,
                collisionMargin: config.collisionMargin || 0.1,
                smoothing: config.smoothing || 0.1     // Movement interpolation
            },
            
            // Collision Detection
            collision: {
                enabled: true,
                types: ['solid', 'water', 'tree', 'building', 'player'],
                dynamicChecking: true,
                predictionDistance: 3                   // Tiles ahead to check
            },
            
            // Pathfinding
            pathfinding: {
                algorithm: 'astar',                     // A* pathfinding
                heuristic: 'manhattan',                 // Distance calculation
                maxDistance: 25,                        // Max pathfinding distance
                allowDiagonal: true,
                smoothPaths: true
            },
            
            // Multiplayer
            multiplayer: {
                enabled: true,
                syncInterval: 100,                      // Position sync in ms
                interpolation: true,
                predictionTime: 150                     // Client prediction in ms
            },
            
            // Visual
            visual: {
                showGrid: config.debug || false,
                showCollisions: config.debug || false,
                showPaths: config.debug || false,
                miniMap: true,
                characterDots: true
            }
        };
        
        this.state = {
            // Grid state
            grid: this.initializeGrid(),
            obstacles: new Map(),                       // obstacleId -> ObstacleData
            
            // Character tracking
            characters: new Map(),                      // characterId -> CharacterState  
            localCharacter: null,                       // Currently controlled character
            
            // Movement state
            activeMovements: new Map(),                 // characterId -> MovementData
            pathfindingCache: new Map(),               // Cache calculated paths
            
            // Physics simulation
            physicsTime: Date.now(),
            simulationStep: 1000 / 60,                 // 60 FPS simulation
            
            // Networking
            wsConnections: new Set(),
            lastSync: Date.now(),
            
            // Visual state
            miniMap: {
                scale: 0.1,                            // Mini-map scale factor
                viewport: { x: 0, y: 0, width: 20, height: 20 }
            },
            
            // Statistics
            stats: {
                totalMovements: 0,
                collisionsDetected: 0,
                pathsCalculated: 0,
                charactersTracked: 0
            }
        };
        
        // Initialize the system
        this.initializeMovementSystem();
        
        console.log('🎮 SoulFRA Character Movement System initialized');
        console.log(`📏 Grid: ${this.config.grid.width}x${this.config.grid.height} tiles`);
        console.log(`⚡ Physics: ${this.config.physics.maxSpeed} tiles/sec max speed`);
    }
    
    /**
     * Initialize the movement system
     */
    async initializeMovementSystem() {
        try {
            // Setup physics simulation loop
            this.startPhysicsSimulation();
            
            // Setup networking if multiplayer enabled
            if (this.config.multiplayer.enabled) {
                await this.initializeNetworking();
            }
            
            // Load default obstacles (tree stumps, barriers, etc.)
            this.loadDefaultObstacles();
            
            // Initialize visual components
            this.initializeVisuals();
            
            console.log('✅ Character movement system ready');
            this.emit('system:ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize movement system:', error);
            throw error;
        }
    }
    
    /**
     * Initialize the grid with default tiles
     */
    initializeGrid() {
        const grid = [];
        
        for (let y = 0; y < this.config.grid.height; y++) {
            grid[y] = [];
            for (let x = 0; x < this.config.grid.width; x++) {
                grid[y][x] = {
                    x, y,
                    type: 'grass',                     // Default tile type
                    walkable: true,
                    height: 0,                         // Z-coordinate for 3D later
                    objects: [],                       // Objects on this tile
                    lastUpdate: Date.now()
                };
            }
        }
        
        return grid;
    }
    
    /**
     * Load default environmental obstacles
     */
    loadDefaultObstacles() {
        // Create tree stumps and barriers as mentioned by user
        const obstacles = [
            // Tree stumps cluster
            { x: 15, y: 15, type: 'tree_stump', size: 1, solid: true },
            { x: 16, y: 15, type: 'tree_stump', size: 1, solid: true },
            { x: 15, y: 16, type: 'tree_stump', size: 1, solid: true },
            
            // Rock barriers
            { x: 30, y: 20, type: 'rock', size: 2, solid: true },
            { x: 32, y: 20, type: 'rock', size: 2, solid: true },
            
            // Water tiles
            { x: 50, y: 50, type: 'water', size: 5, solid: false, slow: true },
            
            // Building structures
            { x: 70, y: 70, type: 'building', size: 3, solid: true },
            
            // Training areas (combat dummies)
            { x: 85, y: 85, type: 'dummy', size: 1, solid: true, interactive: true }
        ];
        
        obstacles.forEach(obstacle => {
            this.addObstacle(obstacle);
        });
        
        console.log(`🌳 Loaded ${obstacles.length} environmental obstacles`);
    }
    
    /**
     * Add an obstacle to the grid
     */
    addObstacle(obstacleData) {
        const obstacleId = crypto.randomUUID();
        const obstacle = {
            id: obstacleId,
            x: obstacleData.x,
            y: obstacleData.y,
            type: obstacleData.type,
            size: obstacleData.size || 1,
            solid: obstacleData.solid !== false,   // Default to solid
            slow: obstacleData.slow || false,      // Slows movement
            interactive: obstacleData.interactive || false,
            created: Date.now(),
            ...obstacleData
        };
        
        // Mark grid tiles as occupied
        for (let dy = 0; dy < obstacle.size; dy++) {
            for (let dx = 0; dx < obstacle.size; dx++) {
                const tileX = obstacle.x + dx;
                const tileY = obstacle.y + dy;
                
                if (this.isValidTile(tileX, tileY)) {
                    this.state.grid[tileY][tileX].walkable = !obstacle.solid;
                    this.state.grid[tileY][tileX].type = obstacle.type;
                    this.state.grid[tileY][tileX].objects.push(obstacleId);
                    
                    if (obstacle.slow) {
                        this.state.grid[tileY][tileX].moveModifier = 0.5;  // Half speed
                    }
                }
            }
        }
        
        this.state.obstacles.set(obstacleId, obstacle);
        this.emit('obstacle:added', obstacle);
        
        return obstacleId;
    }
    
    /**
     * Create a new character
     */
    createCharacter(characterData) {
        const characterId = characterData.id || crypto.randomUUID();
        
        const character = {
            id: characterId,
            name: characterData.name || `Character_${characterId.slice(0, 8)}`,
            
            // Position
            position: {
                x: characterData.x || 10,
                y: characterData.y || 10,
                z: characterData.z || 0
            },
            
            // Movement state
            velocity: { x: 0, y: 0 },
            targetPosition: null,
            movePath: [],
            isMoving: false,
            
            // Character properties
            type: characterData.type || 'player',
            speed: characterData.speed || this.config.physics.maxSpeed,
            
            // OSRS Integration
            osrsData: {
                username: characterData.osrsUsername,
                combatLevel: characterData.combatLevel || 3,
                totalLevel: characterData.totalLevel || 32,
                immortalityScore: characterData.immortalityScore || 0
            },
            
            // Visual
            appearance: {
                color: characterData.color || '#00ff00',
                size: characterData.size || 1,
                symbol: characterData.symbol || '●'
            },
            
            // Multiplayer
            ownedBy: characterData.ownedBy || 'local',
            lastUpdate: Date.now(),
            networkSync: true,
            
            created: Date.now()
        };
        
        // Validate starting position
        if (!this.isValidPosition(character.position.x, character.position.y)) {
            // Find nearest valid position
            const validPos = this.findNearestValidPosition(character.position.x, character.position.y);
            character.position.x = validPos.x;
            character.position.y = validPos.y;
        }
        
        this.state.characters.set(characterId, character);
        this.state.stats.charactersTracked++;
        
        console.log(`👤 Created character: ${character.name} at (${character.position.x}, ${character.position.y})`);
        this.emit('character:created', character);
        
        return characterId;
    }
    
    /**
     * Move character to target position with pathfinding
     */
    moveCharacter(characterId, targetX, targetY) {
        const character = this.state.characters.get(characterId);
        if (!character) {
            console.warn(`❌ Character ${characterId} not found`);
            return false;
        }
        
        // Validate target position
        if (!this.isValidPosition(targetX, targetY)) {
            console.warn(`❌ Invalid target position: (${targetX}, ${targetY})`);
            return false;
        }
        
        const startPos = character.position;
        const pathKey = `${startPos.x},${startPos.y}->${targetX},${targetY}`;
        
        // Check path cache first
        let path = this.state.pathfindingCache.get(pathKey);
        
        if (!path) {
            // Calculate new path using A*
            path = this.calculatePath(startPos.x, startPos.y, targetX, targetY);
            
            if (!path || path.length === 0) {
                console.warn(`❌ No valid path found for character ${characterId}`);
                return false;
            }
            
            // Cache the path
            this.state.pathfindingCache.set(pathKey, path);
            this.state.stats.pathsCalculated++;
        }
        
        // Set character movement data
        character.targetPosition = { x: targetX, y: targetY };
        character.movePath = [...path];
        character.isMoving = true;
        character.lastUpdate = Date.now();
        
        // Store active movement data
        this.state.activeMovements.set(characterId, {
            startTime: Date.now(),
            startPosition: { ...startPos },
            targetPosition: { x: targetX, y: targetY },
            path: [...path],
            currentPathIndex: 0,
            estimatedDuration: path.length * (1000 / character.speed)
        });
        
        this.state.stats.totalMovements++;
        
        console.log(`🚶 Moving ${character.name} from (${startPos.x}, ${startPos.y}) to (${targetX}, ${targetY}) via ${path.length} tiles`);
        this.emit('character:moveStart', { characterId, character, path });
        
        return true;
    }
    
    /**
     * A* Pathfinding algorithm implementation
     */
    calculatePath(startX, startY, targetX, targetY) {
        const openSet = [];
        const closedSet = new Set();
        const cameFrom = new Map();
        
        const gScore = new Map();
        const fScore = new Map();
        
        const startKey = `${startX},${startY}`;
        const targetKey = `${targetX},${targetY}`;
        
        openSet.push({ x: startX, y: startY, key: startKey });
        gScore.set(startKey, 0);
        fScore.set(startKey, this.heuristic(startX, startY, targetX, targetY));
        
        const directions = [
            { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }  // Cardinal
        ];
        
        // Add diagonal directions if enabled
        if (this.config.pathfinding.allowDiagonal) {
            directions.push(
                { x: 1, y: -1 }, { x: 1, y: 1 }, { x: -1, y: 1 }, { x: -1, y: -1 }
            );
        }
        
        while (openSet.length > 0) {
            // Find node with lowest fScore
            let current = openSet.reduce((min, node) => 
                fScore.get(node.key) < fScore.get(min.key) ? node : min
            );
            
            if (current.key === targetKey) {
                // Reconstruct path
                return this.reconstructPath(cameFrom, current, startX, startY);
            }
            
            // Remove current from openSet
            const currentIndex = openSet.findIndex(node => node.key === current.key);
            openSet.splice(currentIndex, 1);
            closedSet.add(current.key);
            
            // Check neighbors
            for (const direction of directions) {
                const neighborX = current.x + direction.x;
                const neighborY = current.y + direction.y;
                const neighborKey = `${neighborX},${neighborY}`;
                
                if (closedSet.has(neighborKey) || !this.isValidPosition(neighborX, neighborY)) {
                    continue;
                }
                
                const isDiagonal = Math.abs(direction.x) + Math.abs(direction.y) === 2;
                const moveCost = isDiagonal ? 1.414 : 1.0;  // √2 for diagonal
                const tentativeGScore = gScore.get(current.key) + moveCost;
                
                if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeGScore);
                    fScore.set(neighborKey, tentativeGScore + this.heuristic(neighborX, neighborY, targetX, targetY));
                    
                    if (!openSet.find(node => node.key === neighborKey)) {
                        openSet.push({ x: neighborX, y: neighborY, key: neighborKey });
                    }
                }
            }
        }
        
        return null; // No path found
    }
    
    /**
     * Reconstruct path from A* algorithm
     */
    reconstructPath(cameFrom, current, startX, startY) {
        const path = [{ x: current.x, y: current.y }];
        
        while (cameFrom.has(current.key)) {
            current = cameFrom.get(current.key);
            path.unshift({ x: current.x, y: current.y });
        }
        
        // Remove the starting position
        if (path.length > 0 && path[0].x === startX && path[0].y === startY) {
            path.shift();
        }
        
        return path;
    }
    
    /**
     * Calculate heuristic distance for pathfinding
     */
    heuristic(x1, y1, x2, y2) {
        switch (this.config.pathfinding.heuristic) {
            case 'manhattan':
                return Math.abs(x1 - x2) + Math.abs(y1 - y2);
            case 'euclidean':
                return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
            case 'diagonal':
                const dx = Math.abs(x1 - x2);
                const dy = Math.abs(y1 - y2);
                return Math.max(dx, dy) + (1.414 - 1) * Math.min(dx, dy);
            default:
                return Math.abs(x1 - x2) + Math.abs(y1 - y2);
        }
    }
    
    /**
     * Physics simulation loop
     */
    startPhysicsSimulation() {
        const simulationLoop = () => {
            const now = Date.now();
            const deltaTime = (now - this.state.physicsTime) / 1000;
            this.state.physicsTime = now;
            
            // Update all moving characters
            this.updateCharacterMovements(deltaTime);
            
            // Check for collisions
            this.checkCollisions();
            
            // Sync positions if multiplayer enabled
            if (this.config.multiplayer.enabled && 
                now - this.state.lastSync > this.config.multiplayer.syncInterval) {
                this.syncCharacterPositions();
                this.state.lastSync = now;
            }
            
            // Continue simulation
            setTimeout(simulationLoop, this.state.simulationStep);
        };
        
        simulationLoop();
        console.log('⚡ Physics simulation started');
    }
    
    /**
     * Update character movements with smooth interpolation
     */
    updateCharacterMovements(deltaTime) {
        for (const [characterId, character] of this.state.characters) {
            if (!character.isMoving || character.movePath.length === 0) {
                continue;
            }
            
            const movement = this.state.activeMovements.get(characterId);
            if (!movement) continue;
            
            // Get current target tile
            const currentTarget = character.movePath[0];
            if (!currentTarget) {
                this.stopCharacterMovement(characterId);
                continue;
            }
            
            // Calculate movement vector
            const dx = currentTarget.x - character.position.x;
            const dy = currentTarget.y - character.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 0.1) {
                // Reached current tile, move to next
                character.position.x = currentTarget.x;
                character.position.y = currentTarget.y;
                character.movePath.shift();
                movement.currentPathIndex++;
                
                if (character.movePath.length === 0) {
                    // Reached final destination
                    this.stopCharacterMovement(characterId);
                    continue;
                }
            } else {
                // Move towards current target
                const moveSpeed = character.speed * deltaTime;
                const normalizedDx = (dx / distance) * moveSpeed;
                const normalizedDy = (dy / distance) * moveSpeed;
                
                // Apply physics and collision checking
                const newX = character.position.x + normalizedDx;
                const newY = character.position.y + normalizedDy;
                
                if (this.checkPositionCollision(newX, newY, characterId)) {
                    this.handleMovementCollision(characterId, newX, newY);
                } else {
                    character.position.x = newX;
                    character.position.y = newY;
                    character.velocity.x = normalizedDx / deltaTime;
                    character.velocity.y = normalizedDy / deltaTime;
                }
            }
            
            character.lastUpdate = Date.now();
            this.emit('character:positionUpdate', { characterId, character });
        }
    }
    
    /**
     * Stop character movement
     */
    stopCharacterMovement(characterId) {
        const character = this.state.characters.get(characterId);
        if (!character) return;
        
        character.isMoving = false;
        character.velocity.x = 0;
        character.velocity.y = 0;
        character.targetPosition = null;
        character.movePath = [];
        
        this.state.activeMovements.delete(characterId);
        
        console.log(`⏹️ Character ${character.name} stopped at (${character.position.x}, ${character.position.y})`);
        this.emit('character:moveStop', { characterId, character });
    }
    
    /**
     * Check if position is valid (walkable and in bounds)
     */
    isValidPosition(x, y) {
        // Check bounds
        if (x < 0 || x >= this.config.grid.width || y < 0 || y >= this.config.grid.height) {
            return false;
        }
        
        // Check if tile is walkable
        const tile = this.state.grid[Math.floor(y)][Math.floor(x)];
        return tile && tile.walkable;
    }
    
    /**
     * Check if tile coordinates are valid
     */
    isValidTile(x, y) {
        return x >= 0 && x < this.config.grid.width && y >= 0 && y < this.config.grid.height;
    }
    
    /**
     * Find nearest valid position to given coordinates
     */
    findNearestValidPosition(x, y, maxRadius = 10) {
        // First check if current position is valid
        if (this.isValidPosition(x, y)) {
            return { x, y };
        }
        
        // Spiral outward to find nearest valid position
        for (let radius = 1; radius <= maxRadius; radius++) {
            for (let dx = -radius; dx <= radius; dx++) {
                for (let dy = -radius; dy <= radius; dy++) {
                    if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
                        const testX = x + dx;
                        const testY = y + dy;
                        
                        if (this.isValidPosition(testX, testY)) {
                            return { x: testX, y: testY };
                        }
                    }
                }
            }
        }
        
        // Default fallback
        return { x: 10, y: 10 };
    }
    
    /**
     * Check for collision at specific position
     */
    checkPositionCollision(x, y, excludeCharacterId = null) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);
        
        // Check grid collision
        if (!this.isValidPosition(x, y)) {
            return true;
        }
        
        // Check character-to-character collisions
        for (const [characterId, character] of this.state.characters) {
            if (characterId === excludeCharacterId) continue;
            
            const charTileX = Math.floor(character.position.x);
            const charTileY = Math.floor(character.position.y);
            
            if (charTileX === tileX && charTileY === tileY) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Handle movement collision
     */
    handleMovementCollision(characterId, attemptedX, attemptedY) {
        const character = this.state.characters.get(characterId);
        if (!character) return;
        
        this.state.stats.collisionsDetected++;
        
        // Try to find alternative path
        if (character.targetPosition) {
            const newPath = this.calculatePath(
                character.position.x, 
                character.position.y,
                character.targetPosition.x,
                character.targetPosition.y
            );
            
            if (newPath && newPath.length > 0) {
                character.movePath = newPath;
                console.log(`🔄 Recalculated path for ${character.name} due to collision`);
            } else {
                this.stopCharacterMovement(characterId);
                console.log(`🛑 Stopped ${character.name} due to collision - no alternative path`);
            }
        } else {
            this.stopCharacterMovement(characterId);
        }
        
        this.emit('character:collision', { characterId, character, attemptedX, attemptedY });
    }
    
    /**
     * Check all collisions in the system
     */
    checkCollisions() {
        // This can be expanded for more sophisticated collision detection
        // Currently handled in updateCharacterMovements
    }
    
    /**
     * Initialize networking for multiplayer
     */
    async initializeNetworking() {
        // Create WebSocket server for real-time updates
        const wss = new WebSocket.Server({ 
            port: 8090,
            path: '/character-movement'
        });
        
        wss.on('connection', (ws) => {
            console.log('🔌 New character movement client connected');
            this.state.wsConnections.add(ws);
            
            // Send current character states
            const characterStates = Array.from(this.state.characters.values());
            ws.send(JSON.stringify({
                type: 'initial_state',
                characters: characterStates,
                obstacles: Array.from(this.state.obstacles.values())
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleNetworkMessage(ws, data);
                } catch (error) {
                    console.error('❌ Invalid network message:', error);
                }
            });
            
            ws.on('close', () => {
                this.state.wsConnections.delete(ws);
                console.log('🔌 Character movement client disconnected');
            });
        });
        
        console.log('🌐 Character movement networking initialized on port 8090');
    }
    
    /**
     * Handle network messages
     */
    handleNetworkMessage(ws, data) {
        switch (data.type) {
            case 'move_character':
                if (data.characterId && data.targetX !== undefined && data.targetY !== undefined) {
                    this.moveCharacter(data.characterId, data.targetX, data.targetY);
                }
                break;
                
            case 'create_character':
                if (data.characterData) {
                    this.createCharacter(data.characterData);
                }
                break;
                
            case 'get_character_state':
                if (data.characterId) {
                    const character = this.state.characters.get(data.characterId);
                    ws.send(JSON.stringify({
                        type: 'character_state',
                        character
                    }));
                }
                break;
        }
    }
    
    /**
     * Sync character positions to all connected clients
     */
    syncCharacterPositions() {
        if (this.state.wsConnections.size === 0) return;
        
        const positionUpdates = [];
        
        for (const [characterId, character] of this.state.characters) {
            positionUpdates.push({
                id: characterId,
                position: character.position,
                velocity: character.velocity,
                isMoving: character.isMoving,
                lastUpdate: character.lastUpdate
            });
        }
        
        const message = JSON.stringify({
            type: 'position_sync',
            timestamp: Date.now(),
            characters: positionUpdates
        });
        
        this.state.wsConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
    
    /**
     * Initialize visual components
     */
    initializeVisuals() {
        if (this.config.visual.miniMap) {
            this.initializeMiniMap();
        }
        
        console.log('🎨 Visual components initialized');
    }
    
    /**
     * Initialize mini-map system
     */
    initializeMiniMap() {
        this.state.miniMap = {
            scale: 0.1,
            viewport: { x: 0, y: 0, width: 20, height: 20 },
            canvas: null,  // Would be canvas element in browser
            ctx: null
        };
    }
    
    /**
     * Get mini-map data for rendering
     */
    getMiniMapData() {
        const viewport = this.state.miniMap.viewport;
        const data = {
            grid: [],
            characters: [],
            obstacles: [],
            viewport
        };
        
        // Extract grid data for viewport
        for (let y = viewport.y; y < viewport.y + viewport.height; y++) {
            for (let x = viewport.x; x < viewport.x + viewport.width; x++) {
                if (this.isValidTile(x, y)) {
                    data.grid.push({
                        x, y,
                        type: this.state.grid[y][x].type,
                        walkable: this.state.grid[y][x].walkable
                    });
                }
            }
        }
        
        // Extract character positions
        for (const character of this.state.characters.values()) {
            if (character.position.x >= viewport.x && 
                character.position.x < viewport.x + viewport.width &&
                character.position.y >= viewport.y && 
                character.position.y < viewport.y + viewport.height) {
                data.characters.push({
                    id: character.id,
                    position: character.position,
                    appearance: character.appearance,
                    isMoving: character.isMoving
                });
            }
        }
        
        // Extract obstacles
        for (const obstacle of this.state.obstacles.values()) {
            if (obstacle.x >= viewport.x && obstacle.x < viewport.x + viewport.width &&
                obstacle.y >= viewport.y && obstacle.y < viewport.y + viewport.height) {
                data.obstacles.push({
                    x: obstacle.x,
                    y: obstacle.y,
                    type: obstacle.type,
                    size: obstacle.size
                });
            }
        }
        
        return data;
    }
    
    /**
     * Get system status and statistics
     */
    getSystemStatus() {
        return {
            grid: {
                width: this.config.grid.width,
                height: this.config.grid.height,
                totalTiles: this.config.grid.width * this.config.grid.height
            },
            characters: {
                total: this.state.characters.size,
                moving: Array.from(this.state.characters.values()).filter(c => c.isMoving).length,
                active: this.state.activeMovements.size
            },
            obstacles: {
                total: this.state.obstacles.size,
                solid: Array.from(this.state.obstacles.values()).filter(o => o.solid).length
            },
            performance: {
                pathfindingCacheSize: this.state.pathfindingCache.size,
                lastSimulationTime: this.state.physicsTime,
                simulationFPS: 1000 / this.state.simulationStep
            },
            network: {
                connections: this.state.wsConnections.size,
                lastSync: this.state.lastSync
            },
            stats: { ...this.state.stats },
            uptime: Date.now() - this.state.stats.uptime || Date.now()
        };
    }
    
    /**
     * Clear pathfinding cache
     */
    clearPathfindingCache() {
        this.state.pathfindingCache.clear();
        console.log('🗑️ Pathfinding cache cleared');
    }
    
    /**
     * Export character data for integration with OSRS/SoulFRA systems
     */
    exportCharacterData() {
        const exportData = {
            characters: {},
            immortalProgression: {},
            movementHistory: {}
        };
        
        for (const [characterId, character] of this.state.characters) {
            exportData.characters[characterId] = {
                id: character.id,
                name: character.name,
                position: character.position,
                osrsData: character.osrsData,
                created: character.created,
                lastUpdate: character.lastUpdate
            };
            
            // Calculate immortal progression based on movement
            const movement = this.state.activeMovements.get(characterId);
            if (movement) {
                exportData.immortalProgression[characterId] = {
                    totalMovements: this.state.stats.totalMovements,
                    pathsCalculated: this.state.stats.pathsCalculated,
                    collisionsHandled: this.state.stats.collisionsDetected,
                    immortalityScore: this.calculateMovementImmortalityScore(character)
                };
            }
        }
        
        return exportData;
    }
    
    /**
     * Calculate immortality score based on movement patterns
     */
    calculateMovementImmortalityScore(character) {
        let score = 0;
        
        // Base score from position diversity
        score += Math.abs(character.position.x) + Math.abs(character.position.y);
        
        // Bonus for OSRS integration
        if (character.osrsData.immortalityScore) {
            score += character.osrsData.immortalityScore;
        }
        
        // Bonus for successful pathfinding
        score += this.state.stats.pathsCalculated * 10;
        
        // Penalty for collisions (encourages smart movement)
        score -= this.state.stats.collisionsDetected * 5;
        
        return Math.max(0, Math.floor(score));
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterMovementSystem;
} else if (typeof window !== 'undefined') {
    window.CharacterMovementSystem = CharacterMovementSystem;
}

// Auto-start if run directly
if (require.main === module) {
    const movementSystem = new CharacterMovementSystem({
        debug: true,
        gridWidth: 50,
        gridHeight: 50,
        maxSpeed: 3.0
    });
    
    // Create test characters
    const character1 = movementSystem.createCharacter({
        name: 'CarStomper',
        x: 5, y: 5,
        osrsUsername: 'CarStomper',
        combatLevel: 126,
        color: '#ff0000'
    });
    
    const character2 = movementSystem.createCharacter({
        name: 'RoughSparks', 
        x: 45, y: 45,
        osrsUsername: 'RoughSparks',
        totalLevel: 2277,
        color: '#0000ff'
    });
    
    // Test movement after system is ready
    movementSystem.on('system:ready', () => {
        console.log('🎮 Testing character movement...');
        
        // Move CarStomper to RoughSparks
        movementSystem.moveCharacter(character1, 43, 43);
        
        // Move RoughSparks around obstacles
        setTimeout(() => {
            movementSystem.moveCharacter(character2, 15, 15); // Near tree stumps
        }, 2000);
        
        // Show status every 5 seconds
        setInterval(() => {
            const status = movementSystem.getSystemStatus();
            console.log('📊 Movement System Status:', {
                charactersMoving: status.characters.moving,
                pathfindingCache: status.performance.pathfindingCacheSize,
                totalMovements: status.stats.totalMovements,
                collisions: status.stats.collisionsDetected
            });
        }, 5000);
    });
    
    console.log('🚀 Character Movement System demo started!');
    console.log('🌐 WebSocket server on ws://localhost:8090/character-movement');
    console.log('📍 Grid: 50x50 tiles with tree stumps at (15,15)');
}