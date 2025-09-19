#!/usr/bin/env node

/**
 * ⚔️📐 RUNESCAPE-STYLE AGGRO SYSTEM
 * Tile-based movement, pathfinding, and aggro mechanics inspired by Old School RuneScape
 * Implements 10-tile aggro range, line-of-sight, and 3+1 pathfinding patterns
 */

const EventEmitter = require('events');

class RuneScapeAggroSystem extends EventEmitter {
    constructor(gridWidth = 100, gridHeight = 100) {
        super();
        
        // Grid-based world (like RuneScape)
        this.gridWidth = gridWidth;
        this.gridHeight = gridHeight;
        this.tiles = new Map(); // x,y -> tile data
        
        // Entities on the grid
        this.entities = new Map(); // entityId -> entity data
        this.entityPositions = new Map(); // "x,y" -> [entityIds]
        
        // Aggro configuration (RuneScape values)
        this.aggroConfig = {
            defaultRange: 10,     // 10 tiles for most aggressive monsters
            maxRange: 15,         // Maximum possible aggro range
            checkInterval: 600,   // Check aggro every 600ms (RuneScape tick)
            pathfindTimeout: 5000, // Give up pathfinding after 5 seconds
            maxPathLength: 25     // Maximum path length before giving up
        };
        
        // Combat configuration
        this.combatConfig = {
            attackSpeed: {
                'fast': 2400,      // 4 ticks (2.4 seconds)
                'medium': 3000,    // 5 ticks (3 seconds) 
                'slow': 3600       // 6 ticks (3.6 seconds)
            },
            accuracy: {
                base: 0.7,         // 70% base accuracy
                levelBonus: 0.002, // +0.2% per level difference
                defenseReduction: 0.001 // -0.1% per defense point
            }
        };
        
        // Initialize empty grid
        this.initializeGrid();
        
        // Start aggro system
        this.startAggroSystem();
        
        console.log('⚔️📐 RuneScape Aggro System initialized');
        console.log(`🗺️ Grid size: ${gridWidth}x${gridHeight} tiles`);
    }
    
    initializeGrid() {
        for (let x = 0; x < this.gridWidth; x++) {
            for (let y = 0; y < this.gridHeight; y++) {
                this.tiles.set(`${x},${y}`, {
                    x: x,
                    y: y,
                    walkable: true,
                    objects: [],
                    height: 0,
                    regionType: 'normal'
                });
            }
        }
        
        // Add some obstacles for pathfinding testing
        this.addObstacles();
    }
    
    addObstacles() {
        // Add some walls and obstacles (like RuneScape map features)
        const obstacles = [
            // Horizontal wall
            {x: 30, y: 30, width: 10, height: 1},
            {x: 35, y: 35, width: 1, height: 10},
            // L-shaped obstacle  
            {x: 50, y: 50, width: 5, height: 1},
            {x: 50, y: 51, width: 1, height: 5},
            // Random scattered rocks
            {x: 20, y: 60, width: 1, height: 1},
            {x: 25, y: 65, width: 1, height: 1},
            {x: 70, y: 20, width: 2, height: 2}
        ];
        
        obstacles.forEach(obstacle => {
            for (let x = obstacle.x; x < obstacle.x + obstacle.width; x++) {
                for (let y = obstacle.y; y < obstacle.y + obstacle.height; y++) {
                    const tile = this.tiles.get(`${x},${y}`);
                    if (tile) {
                        tile.walkable = false;
                        tile.objects.push('obstacle');
                    }
                }
            }
        });
        
        console.log(`🏗️ Added ${obstacles.length} obstacle groups to the map`);
    }
    
    // Add entity to the grid
    addEntity(entityId, data) {
        const entity = {
            id: entityId,
            x: data.x || 10,
            y: data.y || 10,
            size: data.size || 1,  // Entity size in tiles (1x1, 2x2, etc.)
            level: data.level || 1,
            health: data.health || 100,
            maxHealth: data.maxHealth || 100,
            damage: data.damage || 10,
            defense: data.defense || 0,
            attackSpeed: data.attackSpeed || 3000,
            moveSpeed: data.moveSpeed || 1, // tiles per move
            aggroRange: data.aggroRange || this.aggroConfig.defaultRange,
            aggressive: data.aggressive !== false, // Default to aggressive
            target: null,
            lastAttack: 0,
            lastMove: 0,
            path: [],
            combatState: 'idle', // idle, moving, attacking, retreating
            type: data.type || 'monster', // monster, player, npc
            ...data
        };
        
        this.entities.set(entityId, entity);
        this.updateEntityPosition(entityId, entity.x, entity.y);
        
        console.log(`👹 Added ${entity.type}: ${entity.name || entityId} at (${entity.x}, ${entity.y})`);
        
        this.emit('entity_added', entity);
        return entity;
    }
    
    // Remove entity from grid
    removeEntity(entityId) {
        const entity = this.entities.get(entityId);
        if (entity) {
            this.clearEntityPosition(entityId, entity.x, entity.y);
            this.entities.delete(entityId);
            
            console.log(`👻 Removed entity: ${entity.name || entityId}`);
            this.emit('entity_removed', entity);
        }
    }
    
    // Update entity position on grid
    updateEntityPosition(entityId, newX, newY) {
        const entity = this.entities.get(entityId);
        if (!entity) return false;
        
        // Clear old position
        this.clearEntityPosition(entityId, entity.x, entity.y);
        
        // Check if new position is valid
        if (!this.isPositionWalkable(newX, newY, entity.size)) {
            return false;
        }
        
        // Update entity position
        entity.x = newX;
        entity.y = newY;
        
        // Update position mapping
        for (let x = newX; x < newX + entity.size; x++) {
            for (let y = newY; y < newY + entity.size; y++) {
                const posKey = `${x},${y}`;
                if (!this.entityPositions.has(posKey)) {
                    this.entityPositions.set(posKey, []);
                }
                this.entityPositions.get(posKey).push(entityId);
            }
        }
        
        return true;
    }
    
    clearEntityPosition(entityId, x, y) {
        const entity = this.entities.get(entityId);
        if (!entity) return;
        
        for (let ex = x; ex < x + entity.size; ex++) {
            for (let ey = y; ey < y + entity.size; ey++) {
                const posKey = `${ex},${ey}`;
                const entitiesAtPos = this.entityPositions.get(posKey) || [];
                const index = entitiesAtPos.indexOf(entityId);
                if (index > -1) {
                    entitiesAtPos.splice(index, 1);
                    if (entitiesAtPos.length === 0) {
                        this.entityPositions.delete(posKey);
                    }
                }
            }
        }
    }
    
    // Check if position is walkable
    isPositionWalkable(x, y, size = 1) {
        for (let ex = x; ex < x + size; ex++) {
            for (let ey = y; ey < y + size; ey++) {
                // Check bounds
                if (ex < 0 || ex >= this.gridWidth || ey < 0 || ey >= this.gridHeight) {
                    return false;
                }
                
                // Check tile walkability
                const tile = this.tiles.get(`${ex},${ey}`);
                if (!tile || !tile.walkable) {
                    return false;
                }
                
                // Check for other entities (collision)
                const entitiesAtPos = this.entityPositions.get(`${ex},${ey}`) || [];
                if (entitiesAtPos.length > 0) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // Calculate distance between two points (RuneScape Chebyshev distance)
    calculateDistance(x1, y1, x2, y2) {
        return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
    }
    
    // Check line of sight between two positions
    hasLineOfSight(x1, y1, x2, y2) {
        // Bresenham's line algorithm to check line of sight
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);
        const sx = x1 < x2 ? 1 : -1;
        const sy = y1 < y2 ? 1 : -1;
        let err = dx - dy;
        
        let x = x1;
        let y = y1;
        
        while (true) {
            // Check if current tile blocks line of sight
            const tile = this.tiles.get(`${x},${y}`);
            if (!tile || !tile.walkable) {
                return false;
            }
            
            // Reached destination
            if (x === x2 && y === y2) {
                return true;
            }
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
    }
    
    // Find path using A* pathfinding (RuneScape-style)
    findPath(startX, startY, targetX, targetY, entitySize = 1) {
        const start = `${startX},${startY}`;
        const target = `${targetX},${targetY}`;
        
        if (start === target) {
            return [];
        }
        
        const openSet = new Set([start]);
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        
        gScore.set(start, 0);
        fScore.set(start, this.calculateDistance(startX, startY, targetX, targetY));
        
        const getNeighbors = (x, y) => {
            const neighbors = [];
            // 8-directional movement (like RuneScape)
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (this.isPositionWalkable(nx, ny, entitySize)) {
                        neighbors.push({x: nx, y: ny});
                    }
                }
            }
            return neighbors;
        };
        
        let iterations = 0;
        const maxIterations = 1000;
        
        while (openSet.size > 0 && iterations < maxIterations) {
            iterations++;
            
            // Find node with lowest fScore
            let current = null;
            let lowestF = Infinity;
            
            for (const node of openSet) {
                const f = fScore.get(node) || Infinity;
                if (f < lowestF) {
                    lowestF = f;
                    current = node;
                }
            }
            
            if (!current) break;
            
            const [currentX, currentY] = current.split(',').map(Number);
            
            if (current === target) {
                // Reconstruct path
                const path = [];
                let pathNode = current;
                
                while (cameFrom.has(pathNode)) {
                    const [x, y] = pathNode.split(',').map(Number);
                    path.unshift({x, y});
                    pathNode = cameFrom.get(pathNode);
                }
                
                return path;
            }
            
            openSet.delete(current);
            
            for (const neighbor of getNeighbors(currentX, currentY)) {
                const neighborKey = `${neighbor.x},${neighbor.y}`;
                
                // Calculate movement cost (diagonal costs more)
                const isDiagonal = Math.abs(neighbor.x - currentX) === 1 && Math.abs(neighbor.y - currentY) === 1;
                const moveCost = isDiagonal ? 1.4 : 1.0;
                const tentativeG = (gScore.get(current) || 0) + moveCost;
                
                if (tentativeG < (gScore.get(neighborKey) || Infinity)) {
                    cameFrom.set(neighborKey, current);
                    gScore.set(neighborKey, tentativeG);
                    fScore.set(neighborKey, tentativeG + this.calculateDistance(neighbor.x, neighbor.y, targetX, targetY));
                    
                    if (!openSet.has(neighborKey)) {
                        openSet.add(neighborKey);
                    }
                }
            }
        }
        
        // No path found
        return [];
    }
    
    // Get entities within aggro range
    getEntitiesInRange(entity, range = null) {
        const aggroRange = range || entity.aggroRange;
        const nearbyEntities = [];
        
        this.entities.forEach((otherEntity, otherId) => {
            if (otherId === entity.id) return;
            
            const distance = this.calculateDistance(entity.x, entity.y, otherEntity.x, otherEntity.y);
            
            if (distance <= aggroRange) {
                // Check line of sight
                if (this.hasLineOfSight(entity.x, entity.y, otherEntity.x, otherEntity.y)) {
                    nearbyEntities.push({
                        entity: otherEntity,
                        distance: distance
                    });
                }
            }
        });
        
        // Sort by distance (closest first)
        nearbyEntities.sort((a, b) => a.distance - b.distance);
        
        return nearbyEntities;
    }
    
    // RuneScape-style 3+1 movement pattern
    moveTowardsTarget(entity, targetX, targetY) {
        if (!entity.path || entity.path.length === 0) {
            // Generate new path
            entity.path = this.findPath(entity.x, entity.y, targetX, targetY, entity.size);
            
            if (entity.path.length === 0) {
                // Can't reach target
                return false;
            }
        }
        
        // Take up to 3 steps + 1 optimal step (RuneScape movement pattern)
        const now = Date.now();
        const timeSinceLastMove = now - entity.lastMove;
        const moveDelay = 600; // RuneScape tick rate
        
        if (timeSinceLastMove < moveDelay) {
            return false; // Too soon to move
        }
        
        let stepsToTake = Math.min(entity.moveSpeed, entity.path.length);
        let stepsTaken = 0;
        
        while (stepsTaken < stepsToTake && entity.path.length > 0) {
            const nextStep = entity.path[0];
            
            // Try to move to next step
            if (this.updateEntityPosition(entity.id, nextStep.x, nextStep.y)) {
                entity.path.shift(); // Remove completed step
                stepsTaken++;
                entity.lastMove = now;
                
                // Emit movement event
                this.emit('entity_moved', {
                    entity: entity,
                    newX: nextStep.x,
                    newY: nextStep.y,
                    stepsTaken: stepsTaken
                });
            } else {
                // Path blocked, recalculate
                entity.path = this.findPath(entity.x, entity.y, targetX, targetY, entity.size);
                break;
            }
        }
        
        return stepsTaken > 0;
    }
    
    // Combat system
    attemptAttack(attacker, target) {
        const now = Date.now();
        const timeSinceLastAttack = now - attacker.lastAttack;
        
        if (timeSinceLastAttack < attacker.attackSpeed) {
            return false; // Still on attack cooldown
        }
        
        // Check if target is in range (adjacent for melee)
        const distance = this.calculateDistance(attacker.x, attacker.y, target.x, target.y);
        const attackRange = 1; // Melee range
        
        if (distance > attackRange) {
            return false; // Target not in range
        }
        
        // Calculate hit chance (RuneScape-style)
        const levelDiff = attacker.level - target.level;
        const accuracy = this.combatConfig.accuracy.base + 
                        (levelDiff * this.combatConfig.accuracy.levelBonus) -
                        (target.defense * this.combatConfig.accuracy.defenseReduction);
        
        const hitChance = Math.max(0.05, Math.min(0.95, accuracy)); // 5-95% hit chance
        const hit = Math.random() < hitChance;
        
        attacker.lastAttack = now;
        
        if (hit) {
            // Calculate damage
            const baseDamage = attacker.damage;
            const randomFactor = 0.8 + Math.random() * 0.4; // 80-120% damage variance
            const finalDamage = Math.floor(baseDamage * randomFactor);
            
            // Apply damage
            target.health -= finalDamage;
            target.health = Math.max(0, target.health);
            
            console.log(`⚔️ ${attacker.name || attacker.id} hits ${target.name || target.id} for ${finalDamage} damage! (${target.health}/${target.maxHealth} HP)`);
            
            this.emit('combat_hit', {
                attacker: attacker,
                target: target,
                damage: finalDamage,
                hitChance: hitChance
            });
            
            // Check for death
            if (target.health <= 0) {
                this.handleEntityDeath(target, attacker);
            }
            
            return true;
        } else {
            console.log(`🛡️ ${attacker.name || attacker.id} misses ${target.name || target.id}!`);
            
            this.emit('combat_miss', {
                attacker: attacker,
                target: target,
                hitChance: hitChance
            });
            
            return false;
        }
    }
    
    handleEntityDeath(deadEntity, killer) {
        console.log(`💀 ${deadEntity.name || deadEntity.id} has been defeated by ${killer.name || killer.id}!`);
        
        // Clear target if someone was targeting the dead entity
        this.entities.forEach(entity => {
            if (entity.target === deadEntity.id) {
                entity.target = null;
                entity.combatState = 'idle';
                entity.path = [];
            }
        });
        
        this.emit('entity_death', {
            deceased: deadEntity,
            killer: killer
        });
        
        // Remove dead entity after a brief delay
        setTimeout(() => {
            this.removeEntity(deadEntity.id);
        }, 2000);
    }
    
    // Main aggro system loop (runs every RuneScape tick)
    startAggroSystem() {
        setInterval(() => {
            this.processAggro();
        }, this.aggroConfig.checkInterval);
        
        console.log(`⚔️ Aggro system started (${this.aggroConfig.checkInterval}ms tick rate)`);
    }
    
    processAggro() {
        this.entities.forEach((entity) => {
            if (!entity.aggressive || entity.health <= 0) return;
            
            // Find potential targets
            const nearbyEntities = this.getEntitiesInRange(entity);
            const potentialTargets = nearbyEntities.filter(nearby => {
                const target = nearby.entity;
                return target.type === 'player' && target.health > 0;
            });
            
            if (potentialTargets.length === 0) {
                // No targets, return to idle
                if (entity.combatState !== 'idle') {
                    entity.combatState = 'idle';
                    entity.target = null;
                    entity.path = [];
                }
                return;
            }
            
            // Get current target or select new one
            let currentTarget = null;
            if (entity.target) {
                const targetEntity = this.entities.get(entity.target);
                if (targetEntity && targetEntity.health > 0) {
                    const distance = this.calculateDistance(entity.x, entity.y, targetEntity.x, targetEntity.y);
                    if (distance <= entity.aggroRange && this.hasLineOfSight(entity.x, entity.y, targetEntity.x, targetEntity.y)) {
                        currentTarget = targetEntity;
                    }
                }
            }
            
            // Select new target if needed
            if (!currentTarget) {
                currentTarget = potentialTargets[0].entity; // Closest target
                entity.target = currentTarget.id;
                console.log(`🎯 ${entity.name || entity.id} is now targeting ${currentTarget.name || currentTarget.id}`);
            }
            
            // Combat logic
            const distance = this.calculateDistance(entity.x, entity.y, currentTarget.x, currentTarget.y);
            
            if (distance === 1) {
                // In melee range, attack
                entity.combatState = 'attacking';
                this.attemptAttack(entity, currentTarget);
            } else {
                // Move towards target
                entity.combatState = 'moving';
                this.moveTowardsTarget(entity, currentTarget.x, currentTarget.y);
            }
        });
    }
    
    // Debug methods
    printGridAround(x, y, radius = 5) {
        console.log(`\n🗺️ Grid around (${x}, ${y}):`);
        
        for (let dy = -radius; dy <= radius; dy++) {
            let row = '';
            for (let dx = -radius; dx <= radius; dx++) {
                const tx = x + dx;
                const ty = y + dy;
                
                if (tx < 0 || tx >= this.gridWidth || ty < 0 || ty >= this.gridHeight) {
                    row += '██'; // Out of bounds
                    continue;
                }
                
                const tile = this.tiles.get(`${tx},${ty}`);
                const entitiesAtPos = this.entityPositions.get(`${tx},${ty}`) || [];
                
                if (entitiesAtPos.length > 0) {
                    const entity = this.entities.get(entitiesAtPos[0]);
                    if (entity.type === 'player') {
                        row += '🟦'; // Player
                    } else {
                        row += '🟥'; // Monster
                    }
                } else if (!tile.walkable) {
                    row += '⬛'; // Obstacle
                } else {
                    row += '⬜'; // Empty walkable
                }
            }
            console.log(row);
        }
        console.log('');
    }
    
    getSystemStats() {
        const entities = Array.from(this.entities.values());
        const monsters = entities.filter(e => e.type === 'monster');
        const players = entities.filter(e => e.type === 'player');
        const inCombat = entities.filter(e => e.combatState === 'attacking' || e.combatState === 'moving');
        
        return {
            totalEntities: entities.length,
            monsters: monsters.length,
            players: players.length,
            inCombat: inCombat.length,
            gridSize: `${this.gridWidth}x${this.gridHeight}`,
            tickRate: `${this.aggroConfig.checkInterval}ms`
        };
    }
}

// Auto-run demonstration if called directly
if (require.main === module) {
    console.log('⚔️📐 RuneScape Aggro System Demo');
    console.log('================================\n');
    
    const aggroSystem = new RuneScapeAggroSystem(50, 50);
    
    // Add some test entities
    console.log('👹 Adding test entities...\n');
    
    // Add player
    aggroSystem.addEntity('player1', {
        name: 'TestPlayer',
        type: 'player',
        x: 25,
        y: 25,
        level: 50,
        health: 100,
        damage: 25,
        defense: 10
    });
    
    // Add aggressive monsters
    aggroSystem.addEntity('goblin1', {
        name: 'Aggressive Goblin',
        type: 'monster',
        x: 35,
        y: 35,
        level: 10,
        health: 50,
        damage: 8,
        defense: 2,
        aggroRange: 10,
        aggressive: true
    });
    
    aggroSystem.addEntity('orc1', {
        name: 'Orc Warrior',
        type: 'monster', 
        x: 20,
        y: 30,
        level: 25,
        health: 150,
        damage: 18,
        defense: 8,
        aggroRange: 12,
        aggressive: true,
        size: 2 // 2x2 monster
    });
    
    // Show initial state
    console.log('📊 Initial system state:');
    console.log(aggroSystem.getSystemStats());
    
    aggroSystem.printGridAround(25, 25, 8);
    
    // Set up event listeners for demo
    aggroSystem.on('combat_hit', (event) => {
        console.log(`💥 COMBAT: ${event.attacker.name} → ${event.target.name} (${event.damage} dmg, ${(event.hitChance * 100).toFixed(1)}% chance)`);
    });
    
    aggroSystem.on('entity_death', (event) => {
        console.log(`💀 DEATH: ${event.deceased.name} killed by ${event.killer.name}`);
    });
    
    aggroSystem.on('entity_moved', (event) => {
        console.log(`🚶 MOVE: ${event.entity.name} → (${event.newX}, ${event.newY}) [${event.stepsTaken} steps]`);
    });
    
    console.log('\n⚔️ Combat simulation running... Press Ctrl+C to stop\n');
    
    // Periodic status updates
    setInterval(() => {
        console.log('\n📊 System Status:', aggroSystem.getSystemStats());
    }, 10000);
}

module.exports = RuneScapeAggroSystem;