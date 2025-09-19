#!/usr/bin/env node

/**
 * ⚓ SHIP COMBAT ARENA
 * 
 * Naval battles, cannonball physics, fleet management
 * Second distributed game world in the metaverse
 */

const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class ShipCombatArena extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 8100,
            wsPort: config.wsPort || 8101,
            hubUrl: config.hubUrl || 'ws://localhost:7001',
            ...config
        };
        
        // Combat arena state
        this.players = new Map();
        this.ships = new Map();
        this.battles = new Map();
        this.cannonballs = new Map();
        this.ports = new Map();
        
        // Ship types and configurations
        this.shipTypes = new Map([
            ['sloop', {
                id: 'sloop',
                name: 'Swift Sloop',
                health: 100,
                speed: 8,
                cannons: 4,
                crew: 2,
                cost: 1000,
                description: 'Fast and nimble, perfect for hit-and-run tactics'
            }],
            ['frigate', {
                id: 'frigate',
                name: 'Royal Frigate',
                health: 250,
                speed: 6,
                cannons: 12,
                crew: 8,
                cost: 5000,
                description: 'Balanced warship with good firepower and durability'
            }],
            ['galleon', {
                id: 'galleon',
                name: 'War Galleon',
                health: 500,
                speed: 4,
                cannons: 24,
                crew: 20,
                cost: 15000,
                description: 'Massive warship with devastating firepower'
            }],
            ['man-of-war', {
                id: 'man-of-war',
                name: 'Ship of the Line',
                health: 800,
                speed: 3,
                cannons: 40,
                crew: 40,
                cost: 50000,
                description: 'The ultimate naval weapon, feared across all seas'
            }]
        ]);
        
        // Combat zones
        this.combatZones = new Map([
            ['caribbean-waters', {
                id: 'caribbean-waters',
                name: 'Caribbean Battlegrounds',
                difficulty: 2,
                weatherEffects: ['calm', 'trade-winds'],
                hazards: ['reefs', 'storms'],
                description: 'Tropical waters perfect for naval skirmishes'
            }],
            ['north-atlantic', {
                id: 'north-atlantic',
                name: 'North Atlantic Arena',
                difficulty: 5,
                weatherEffects: ['rough-seas', 'fog', 'storms'],
                hazards: ['icebergs', 'whirlpools'],
                description: 'Treacherous waters for experienced captains'
            }],
            ['kraken-depths', {
                id: 'kraken-depths',
                name: 'Kraken\'s Domain',
                difficulty: 8,
                weatherEffects: ['supernatural-storms', 'cursed-fog'],
                hazards: ['tentacles', 'whirlpools', 'ghost-ships'],
                description: 'Where the sea monster rules and legends are born'
            }],
            ['pirates-cove', {
                id: 'pirates-cove',
                name: 'Pirate\'s Cove',
                difficulty: 3,
                weatherEffects: ['calm', 'tropical-storms'],
                hazards: ['hidden-rocks', 'pirate-ambushes'],
                description: 'Lawless waters where anything goes'
            }]
        ]);
        
        // Cannonball types
        this.cannonballTypes = [
            { type: 'iron', damage: 25, speed: 10, cost: 10, description: 'Standard iron cannonball' },
            { type: 'chain', damage: 15, speed: 8, cost: 25, effect: 'disable_sails', description: 'Chain shot to damage rigging' },
            { type: 'explosive', damage: 50, speed: 6, cost: 100, effect: 'splash_damage', description: 'Explosive shells for maximum damage' },
            { type: 'grapeshot', damage: 10, speed: 12, cost: 15, effect: 'crew_damage', description: 'Anti-personnel ammunition' }
        ];
        
        // Connection to universal hub
        this.hubConnection = null;
        
        // Statistics
        this.stats = {
            activePlayers: 0,
            shipsAfloat: 0,
            battlesWon: 0,
            cannonballsFired: 0,
            treasureLooted: 0,
            startTime: Date.now()
        };
        
        console.log('⚓ Initializing Ship Combat Arena...');
        this.initialize();
    }
    
    async initialize() {
        // Connect to Universal Hub
        await this.connectToUniversalHub();
        
        // Setup Express server
        this.setupWebServer();
        
        // Setup WebSocket server for players
        this.setupPlayerWebSocket();
        
        // Initialize combat arena
        this.initializeCombatArena();
        
        // Start battle simulation
        this.startBattleSimulation();
        
        console.log('✅ Ship Combat Arena ready!');
        console.log(`⚓ Naval Interface: http://localhost:${this.config.port}`);
        console.log(`🏴‍☠️ Combat WebSocket: ws://localhost:${this.config.wsPort}`);
        
        this.emit('ship_combat_ready');
    }
    
    async connectToUniversalHub() {
        try {
            this.hubConnection = new WebSocket(this.config.hubUrl);
            
            this.hubConnection.on('open', () => {
                console.log('🔗 Connected to Universal Metaverse Hub');
                this.registerWithHub();
            });
            
            this.hubConnection.on('message', (data) => {
                const message = JSON.parse(data);
                this.handleHubMessage(message);
            });
            
            this.hubConnection.on('close', () => {
                console.log('❌ Lost connection to Universal Hub');
                setTimeout(() => this.connectToUniversalHub(), 5000);
            });
            
        } catch (error) {
            console.error('Failed to connect to Universal Hub:', error.message);
            console.log('⚠️  Running in standalone mode');
        }
    }
    
    registerWithHub() {
        const registrationData = {
            type: 'world_register',
            worldId: 'ship-combat',
            worldData: {
                name: 'Naval Battle Arena',
                description: 'Real-time ship combat with cannonball physics',
                type: 'combat',
                port: this.config.port,
                wsPort: this.config.wsPort,
                features: ['naval-combat', 'ship-building', 'fleet-management', 'treasure-hunting'],
                zones: Array.from(this.combatZones.keys()),
                playerCapacity: 50
            }
        };
        
        this.hubConnection.send(JSON.stringify(registrationData));
        console.log('⚓ Registered Ship Combat Arena with Universal Hub');
    }
    
    handleHubMessage(message) {
        switch (message.type) {
            case 'cross_world_event':
                this.handleCrossWorldEvent(message.event);
                break;
            case 'player_transfer':
                this.handlePlayerTransfer(message);
                break;
            case 'treasure_transfer':
                this.handleTreasureFromOtherWorld(message);
                break;
        }
    }
    
    setupWebServer() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static(__dirname));
        
        // Ship Combat main interface
        this.app.get('/', (req, res) => {
            res.send(this.renderShipCombatArena());
        });
        
        // Ship types API
        this.app.get('/api/ships', (req, res) => {
            res.json({
                shipTypes: Array.from(this.shipTypes.values()),
                totalTypes: this.shipTypes.size
            });
        });
        
        // Purchase ship API
        this.app.post('/api/purchase-ship', async (req, res) => {
            const { playerId, shipType, customization } = req.body;
            const result = await this.purchaseShip(playerId, shipType, customization);
            res.json(result);
        });
        
        // Start battle API
        this.app.post('/api/start-battle', async (req, res) => {
            const { playerId, zoneId, battleType } = req.body;
            const result = await this.startBattle(playerId, zoneId, battleType);
            res.json(result);
        });
        
        // Fire cannons API
        this.app.post('/api/fire-cannons', async (req, res) => {
            const { playerId, targetPosition, cannonballType } = req.body;
            const result = await this.fireCannons(playerId, targetPosition, cannonballType);
            res.json(result);
        });
        
        // Arena statistics
        this.app.get('/api/stats', (req, res) => {
            res.json({
                ...this.stats,
                uptime: Date.now() - this.stats.startTime,
                activePlayers: this.players.size,
                activeShips: this.ships.size,
                activeBattles: this.battles.size
            });
        });
        
        this.app.listen(this.config.port, () => {
            console.log(`⚓ Ship Combat Arena running on port ${this.config.port}`);
        });
    }
    
    setupPlayerWebSocket() {
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🏴‍☠️ New captain connected');
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    await this.handlePlayerMessage(ws, message);
                } catch (error) {
                    console.error('Captain message error:', error);
                }
            });
            
            ws.on('close', () => {
                this.handlePlayerDisconnect(ws);
            });
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome_to_combat',
                worldName: 'Naval Battle Arena',
                shipTypes: Array.from(this.shipTypes.values()),
                combatZones: Array.from(this.combatZones.values()),
                timestamp: Date.now()
            }));
        });
        
        console.log(`🏴‍☠️ Combat WebSocket listening on port ${this.config.wsPort}`);
    }
    
    async handlePlayerMessage(ws, message) {
        switch (message.type) {
            case 'captain_join':
                this.registerPlayer(ws, message);
                break;
                
            case 'purchase_ship':
                await this.handlePurchaseShip(ws, message);
                break;
                
            case 'start_battle':
                await this.handleStartBattle(ws, message);
                break;
                
            case 'fire_cannons':
                await this.handleFireCannons(ws, message);
                break;
                
            case 'move_ship':
                this.handleMoveShip(ws, message);
                break;
                
            case 'repair_ship':
                await this.handleRepairShip(ws, message);
                break;
        }
    }
    
    registerPlayer(ws, message) {
        const player = {
            id: message.playerId,
            ws,
            name: message.playerName || 'Anonymous Captain',
            level: message.level || 1,
            gold: message.gold || 5000, // Starting gold
            reputation: message.reputation || 'Landlubber',
            fleet: message.fleet || [],
            currentShip: null,
            position: { x: 0, y: 0 },
            stats: {
                battlesWon: 0,
                battlesLost: 0,
                shipsDestroyed: 0,
                cannonballsFired: 0,
                treasureLooted: 0
            },
            connectedAt: Date.now()
        };
        
        this.players.set(player.id, player);
        this.stats.activePlayers = this.players.size;
        
        console.log(`🏴‍☠️ Captain registered: ${player.name} (${player.id})`);
        
        // Send player state
        ws.send(JSON.stringify({
            type: 'captain_state',
            player: {
                ...player,
                ws: undefined
            }
        }));
        
        // Notify hub
        this.notifyHubPlayerJoined(player);
    }
    
    async handlePurchaseShip(ws, message) {
        const player = this.getPlayerByWs(ws);
        if (!player) return;
        
        const shipType = this.shipTypes.get(message.shipType);
        if (!shipType) {
            ws.send(JSON.stringify({
                type: 'purchase_error',
                error: 'Ship type not found'
            }));
            return;
        }
        
        if (player.gold < shipType.cost) {
            ws.send(JSON.stringify({
                type: 'purchase_error',
                error: 'Insufficient gold'
            }));
            return;
        }
        
        // Create new ship
        const ship = {
            id: crypto.randomUUID(),
            type: shipType.id,
            name: message.shipName || `${player.name}'s ${shipType.name}`,
            ownerId: player.id,
            health: shipType.health,
            maxHealth: shipType.health,
            speed: shipType.speed,
            cannons: shipType.cannons,
            crew: shipType.crew,
            position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
            heading: Math.random() * 360,
            ammunition: {
                iron: 100,
                chain: 20,
                explosive: 5,
                grapeshot: 50
            },
            upgrades: message.upgrades || {},
            purchasedAt: Date.now()
        };
        
        // Deduct gold and add ship
        player.gold -= shipType.cost;
        player.fleet.push(ship.id);
        this.ships.set(ship.id, ship);
        this.stats.shipsAfloat++;
        
        ws.send(JSON.stringify({
            type: 'ship_purchased',
            ship: ship,
            playerGold: player.gold
        }));
        
        console.log(`⚓ ${player.name} purchased ${ship.name}`);
        
        // Cross-world event for expensive ships
        if (shipType.cost >= 15000) {
            this.sendCrossWorldEvent({
                type: 'flagship_launched',
                playerId: player.id,
                playerName: player.name,
                shipType: shipType.name,
                shipName: ship.name,
                cost: shipType.cost
            });
        }
    }
    
    async handleStartBattle(ws, message) {
        const player = this.getPlayerByWs(ws);
        if (!player || !player.fleet.length) {
            ws.send(JSON.stringify({
                type: 'battle_error',
                error: 'No ships available for battle'
            }));
            return;
        }
        
        const zone = this.combatZones.get(message.zoneId);
        if (!zone) {
            ws.send(JSON.stringify({
                type: 'battle_error',
                error: 'Combat zone not found'
            }));
            return;
        }
        
        // Get player's ship
        const shipId = message.shipId || player.fleet[0];
        const ship = this.ships.get(shipId);
        
        if (!ship || ship.health <= 0) {
            ws.send(JSON.stringify({
                type: 'battle_error',
                error: 'Ship not ready for battle'
            }));
            return;
        }
        
        // Create battle instance
        const battle = {
            id: crypto.randomUUID(),
            zoneId: zone.id,
            players: [player.id],
            ships: [ship.id],
            enemies: this.generateEnemyFleet(zone.difficulty),
            weather: this.generateWeatherConditions(zone),
            hazards: zone.hazards,
            startTime: Date.now(),
            status: 'active',
            turnOrder: [player.id, ...this.generateEnemyIds(zone.difficulty)]
        };
        
        this.battles.set(battle.id, battle);
        player.currentBattle = battle.id;
        
        ws.send(JSON.stringify({
            type: 'battle_started',
            battle: battle,
            ship: ship,
            zone: zone
        }));
        
        console.log(`⚔️ ${player.name} started battle in ${zone.name}`);
        
        // Start battle simulation
        this.simulateBattle(battle.id);
    }
    
    async handleFireCannons(ws, message) {
        const player = this.getPlayerByWs(ws);
        if (!player || !player.currentBattle) return;
        
        const battle = this.battles.get(player.currentBattle);
        const ship = this.ships.get(message.shipId);
        
        if (!battle || !ship || ship.ownerId !== player.id) {
            ws.send(JSON.stringify({
                type: 'cannon_error',
                error: 'Cannot fire cannons'
            }));
            return;
        }
        
        const cannonballType = message.cannonballType || 'iron';
        const ammunition = ship.ammunition[cannonballType];
        
        if (ammunition <= 0) {
            ws.send(JSON.stringify({
                type: 'cannon_error',
                error: `No ${cannonballType} ammunition remaining`
            }));
            return;
        }
        
        // Calculate firing solution
        const firingResult = this.calculateCannonballPhysics(ship, message.targetPosition, cannonballType);
        
        // Create cannonball
        const cannonball = {
            id: crypto.randomUUID(),
            type: cannonballType,
            shipId: ship.id,
            playerId: player.id,
            startPosition: { x: ship.position.x, y: ship.position.y },
            targetPosition: message.targetPosition,
            velocity: firingResult.velocity,
            trajectory: firingResult.trajectory,
            damage: firingResult.damage,
            firedAt: Date.now(),
            impactTime: Date.now() + firingResult.flightTime
        };
        
        this.cannonballs.set(cannonball.id, cannonball);
        
        // Consume ammunition
        ship.ammunition[cannonballType]--;
        player.stats.cannonballsFired++;
        this.stats.cannonballsFired++;
        
        // Broadcast to battle participants
        this.broadcastToBattle(battle.id, {
            type: 'cannons_fired',
            cannonball: cannonball,
            ship: ship
        });
        
        console.log(`💥 ${player.name} fired ${cannonballType} cannonball`);
        
        // Schedule impact
        setTimeout(() => {
            this.handleCannonballImpact(cannonball.id);
        }, firingResult.flightTime);
    }
    
    calculateCannonballPhysics(ship, targetPosition, cannonballType) {
        const cannonball = this.cannonballTypes.find(c => c.type === cannonballType);
        const distance = Math.sqrt(
            Math.pow(targetPosition.x - ship.position.x, 2) + 
            Math.pow(targetPosition.y - ship.position.y, 2)
        );
        
        const flightTime = (distance / cannonball.speed) * 100; // milliseconds
        const accuracy = Math.max(0.5, 1 - (distance / 1000)); // Accuracy decreases with distance
        
        // Add some randomness for realism
        const spread = (1 - accuracy) * 50;
        const actualTarget = {
            x: targetPosition.x + (Math.random() - 0.5) * spread,
            y: targetPosition.y + (Math.random() - 0.5) * spread
        };
        
        return {
            velocity: cannonball.speed,
            trajectory: this.calculateTrajectory(ship.position, actualTarget),
            damage: cannonball.damage,
            flightTime: flightTime,
            accuracy: accuracy,
            actualTarget: actualTarget
        };
    }
    
    calculateTrajectory(start, end) {
        const steps = 10;
        const trajectory = [];
        
        for (let i = 0; i <= steps; i++) {
            const progress = i / steps;
            const height = Math.sin(progress * Math.PI) * 50; // Arc trajectory
            
            trajectory.push({
                x: start.x + (end.x - start.x) * progress,
                y: start.y + (end.y - start.y) * progress,
                z: height
            });
        }
        
        return trajectory;
    }
    
    handleCannonballImpact(cannonballId) {
        const cannonball = this.cannonballs.get(cannonballId);
        if (!cannonball) return;
        
        const battle = this.findBattleByPlayer(cannonball.playerId);
        if (!battle) return;
        
        // Check for hits on enemy ships
        const hits = this.checkForShipHits(cannonball, battle);
        const impact = {
            id: cannonball.id,
            position: cannonball.trajectory[cannonball.trajectory.length - 1],
            damage: cannonball.damage,
            hits: hits,
            splashDamage: cannonball.type === 'explosive',
            timestamp: Date.now()
        };
        
        // Apply damage
        hits.forEach(hit => {
            const ship = this.ships.get(hit.shipId);
            if (ship) {
                ship.health = Math.max(0, ship.health - hit.damage);
                
                if (ship.health <= 0) {
                    this.handleShipDestroyed(ship, battle);
                }
            }
        });
        
        // Broadcast impact
        this.broadcastToBattle(battle.id, {
            type: 'cannonball_impact',
            impact: impact
        });
        
        // Clean up cannonball
        this.cannonballs.delete(cannonballId);
    }
    
    checkForShipHits(cannonball, battle) {
        const hits = [];
        const impactPosition = cannonball.trajectory[cannonball.trajectory.length - 1];
        const hitRadius = cannonball.type === 'explosive' ? 30 : 15;
        
        // Check all ships in battle
        const allShips = [...battle.ships, ...battle.enemies.map(e => e.id)];
        
        for (const shipId of allShips) {
            const ship = this.ships.get(shipId);
            if (!ship || ship.id === cannonball.shipId) continue;
            
            const distance = Math.sqrt(
                Math.pow(ship.position.x - impactPosition.x, 2) +
                Math.pow(ship.position.y - impactPosition.y, 2)
            );
            
            if (distance <= hitRadius) {
                let damage = cannonball.damage;
                
                // Apply special effects
                if (cannonball.type === 'chain' && Math.random() < 0.3) {
                    ship.speed = Math.max(1, ship.speed * 0.7); // Damage sails
                }
                
                if (cannonball.type === 'grapeshot') {
                    ship.crew = Math.max(1, ship.crew - 1); // Reduce crew
                }
                
                hits.push({
                    shipId: ship.id,
                    damage: damage,
                    distance: distance,
                    critical: distance < hitRadius * 0.5
                });
            }
        }
        
        return hits;
    }
    
    handleShipDestroyed(ship, battle) {
        console.log(`💥 Ship destroyed: ${ship.name}`);
        
        // Award points to the battle
        const destroyer = this.findPlayerByShip(battle, ship.id);
        if (destroyer) {
            destroyer.stats.shipsDestroyed++;
            
            // Generate loot
            const loot = this.generateShipLoot(ship);
            destroyer.gold += loot.gold;
            destroyer.stats.treasureLooted += loot.gold;
            
            this.broadcastToBattle(battle.id, {
                type: 'ship_destroyed',
                ship: ship,
                destroyer: destroyer.name,
                loot: loot
            });
            
            // Cross-world event for legendary ship destruction
            if (ship.type === 'man-of-war') {
                this.sendCrossWorldEvent({
                    type: 'legendary_ship_destroyed',
                    destroyerName: destroyer.name,
                    shipName: ship.name,
                    lootValue: loot.gold
                });
            }
        }
        
        // Remove from battle
        battle.ships = battle.ships.filter(id => id !== ship.id);
        battle.enemies = battle.enemies.filter(e => e.id !== ship.id);
        
        // Check if battle is over
        if (battle.ships.length === 0 || battle.enemies.length === 0) {
            this.endBattle(battle.id);
        }
    }
    
    generateShipLoot(ship) {
        const baseGold = 100 * (ship.maxHealth / 100);
        const randomMultiplier = 0.5 + Math.random();
        
        return {
            gold: Math.floor(baseGold * randomMultiplier),
            reputation: Math.floor(ship.maxHealth / 50),
            salvage: {
                wood: Math.floor(ship.maxHealth / 20),
                iron: Math.floor(ship.cannons * 2),
                sailcloth: Math.floor(ship.speed)
            }
        };
    }
    
    generateEnemyFleet(difficulty) {
        const enemyCount = Math.min(1 + Math.floor(difficulty / 2), 4);
        const enemies = [];
        
        for (let i = 0; i < enemyCount; i++) {
            const enemyType = this.selectEnemyShipType(difficulty);
            const enemy = {
                id: `enemy_${crypto.randomUUID()}`,
                type: enemyType.id,
                name: `Enemy ${enemyType.name}`,
                health: enemyType.health,
                maxHealth: enemyType.health,
                cannons: enemyType.cannons,
                ai: true,
                behavior: this.selectEnemyBehavior(),
                position: {
                    x: 400 + Math.random() * 200,
                    y: 400 + Math.random() * 200
                }
            };
            enemies.push(enemy);
        }
        
        return enemies;
    }
    
    selectEnemyShipType(difficulty) {
        const shipArray = Array.from(this.shipTypes.values());
        
        if (difficulty <= 2) {
            return shipArray[0]; // Sloop
        } else if (difficulty <= 4) {
            return shipArray[Math.floor(Math.random() * 2)]; // Sloop or Frigate
        } else if (difficulty <= 6) {
            return shipArray[1 + Math.floor(Math.random() * 2)]; // Frigate or Galleon
        } else {
            return shipArray[Math.floor(Math.random() * shipArray.length)]; // Any ship
        }
    }
    
    selectEnemyBehavior() {
        const behaviors = ['aggressive', 'defensive', 'hit-and-run', 'ramming'];
        return behaviors[Math.floor(Math.random() * behaviors.length)];
    }
    
    generateWeatherConditions(zone) {
        const effect = zone.weatherEffects[Math.floor(Math.random() * zone.weatherEffects.length)];
        
        return {
            type: effect,
            intensity: Math.random(),
            windDirection: Math.random() * 360,
            windSpeed: 5 + Math.random() * 15,
            visibility: effect === 'fog' ? 0.3 : 1.0,
            waveHeight: effect === 'storms' ? 8 : 2
        };
    }
    
    simulateBattle(battleId) {
        const battle = this.battles.get(battleId);
        if (!battle || battle.status !== 'active') return;
        
        // AI enemy actions every 3 seconds
        const battleInterval = setInterval(() => {
            if (!this.battles.has(battleId) || battle.status !== 'active') {
                clearInterval(battleInterval);
                return;
            }
            
            // Process enemy AI turns
            battle.enemies.forEach(enemy => {
                if (enemy.health > 0) {
                    this.processEnemyAI(enemy, battle);
                }
            });
        }, 3000);
    }
    
    processEnemyAI(enemy, battle) {
        // Simple AI behavior
        const playerShips = battle.ships.map(id => this.ships.get(id)).filter(s => s);
        if (playerShips.length === 0) return;
        
        const target = playerShips[0]; // Target first player ship
        const distance = Math.sqrt(
            Math.pow(target.position.x - enemy.position.x, 2) +
            Math.pow(target.position.y - enemy.position.y, 2)
        );
        
        // Fire if in range
        if (distance < 200) {
            const cannonball = {
                id: crypto.randomUUID(),
                type: 'iron',
                shipId: enemy.id,
                playerId: null, // AI enemy
                startPosition: enemy.position,
                targetPosition: target.position,
                damage: 20,
                firedAt: Date.now()
            };
            
            // Broadcast enemy attack
            this.broadcastToBattle(battle.id, {
                type: 'enemy_attack',
                enemy: enemy,
                cannonball: cannonball,
                target: target
            });
            
            // Schedule damage
            setTimeout(() => {
                if (Math.random() < 0.6) { // 60% hit chance for AI
                    target.health = Math.max(0, target.health - cannonball.damage);
                    
                    this.broadcastToBattle(battle.id, {
                        type: 'ship_damaged',
                        ship: target,
                        damage: cannonball.damage,
                        attacker: enemy.name
                    });
                    
                    if (target.health <= 0) {
                        this.handleShipDestroyed(target, battle);
                    }
                }
            }, 2000);
        }
    }
    
    broadcastToBattle(battleId, message) {
        const battle = this.battles.get(battleId);
        if (!battle) return;
        
        const messageStr = JSON.stringify(message);
        
        battle.players.forEach(playerId => {
            const player = this.players.get(playerId);
            if (player && player.ws.readyState === WebSocket.OPEN) {
                player.ws.send(messageStr);
            }
        });
    }
    
    endBattle(battleId) {
        const battle = this.battles.get(battleId);
        if (!battle) return;
        
        battle.status = 'ended';
        battle.endTime = Date.now();
        
        // Determine winner
        const playersAlive = battle.ships.length > 0;
        const winner = playersAlive ? 'players' : 'enemies';
        
        // Award victory rewards
        if (playersAlive) {
            battle.players.forEach(playerId => {
                const player = this.players.get(playerId);
                if (player) {
                    player.stats.battlesWon++;
                    player.gold += 1000; // Victory bonus
                    this.stats.battlesWon++;
                }
            });
        } else {
            battle.players.forEach(playerId => {
                const player = this.players.get(playerId);
                if (player) {
                    player.stats.battlesLost++;
                }
            });
        }
        
        // Broadcast battle end
        this.broadcastToBattle(battleId, {
            type: 'battle_ended',
            winner: winner,
            duration: battle.endTime - battle.startTime,
            rewards: playersAlive ? { gold: 1000, reputation: 10 } : null
        });
        
        // Clean up battle
        setTimeout(() => {
            this.battles.delete(battleId);
        }, 30000); // Keep battle data for 30 seconds
        
        console.log(`⚔️ Battle ${battleId} ended - Winner: ${winner}`);
    }
    
    getPlayerByWs(ws) {
        for (const player of this.players.values()) {
            if (player.ws === ws) {
                return player;
            }
        }
        return null;
    }
    
    findBattleByPlayer(playerId) {
        for (const battle of this.battles.values()) {
            if (battle.players.includes(playerId)) {
                return battle;
            }
        }
        return null;
    }
    
    findPlayerByShip(battle, shipId) {
        for (const playerId of battle.players) {
            const player = this.players.get(playerId);
            if (player && player.fleet.includes(shipId)) {
                return player;
            }
        }
        return null;
    }
    
    sendCrossWorldEvent(eventData) {
        if (this.hubConnection && this.hubConnection.readyState === WebSocket.OPEN) {
            this.hubConnection.send(JSON.stringify({
                type: 'cross_world_action',
                sourceWorld: 'ship-combat',
                ...eventData
            }));
        }
    }
    
    notifyHubPlayerJoined(player) {
        if (this.hubConnection && this.hubConnection.readyState === WebSocket.OPEN) {
            this.hubConnection.send(JSON.stringify({
                type: 'world_event',
                eventType: 'player_joined',
                worldId: 'ship-combat',
                playerId: player.id,
                playerName: player.name
            }));
        }
    }
    
    initializeCombatArena() {
        console.log('⚓ Combat arena initialized with naval battle zones');
    }
    
    startBattleSimulation() {
        console.log('⚔️ Battle simulation engine started');
    }
    
    handlePlayerDisconnect(ws) {
        const player = this.getPlayerByWs(ws);
        if (player) {
            this.players.delete(player.id);
            this.stats.activePlayers = this.players.size;
            console.log(`🏴‍☠️ Captain disconnected: ${player.name}`);
        }
    }
    
    renderShipCombatArena() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>⚓ Naval Battle Arena</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Courier New', monospace;
            background: linear-gradient(180deg, #87CEEB 0%, #4682B4 30%, #2F4F4F 70%, #1e3a5f 100%);
            color: #FFD700;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .ship-hud {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border: 3px solid #FFD700;
            border-radius: 15px;
            min-width: 280px;
        }
        
        .health-bar {
            width: 100%;
            height: 15px;
            background: #660000;
            border: 2px solid #FFD700;
            border-radius: 8px;
            margin: 5px 0;
            position: relative;
        }
        
        .health-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff0000 0%, #ff6600 50%, #00ff00 100%);
            border-radius: 6px;
            transition: width 0.5s;
        }
        
        .ships-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: 25px;
            padding: 20px;
        }
        
        .ship-card {
            border: 3px solid;
            border-radius: 20px;
            padding: 25px;
            position: relative;
            cursor: pointer;
            transition: all 0.3s ease;
            background-size: cover;
            background-position: center;
        }
        
        .ship-card:hover {
            transform: translateY(-8px) rotateY(5deg);
            box-shadow: 0 15px 40px rgba(255, 215, 0, 0.4);
        }
        
        .ship-card.sloop {
            border-color: #00ff00;
            background: linear-gradient(135deg, rgba(0, 255, 0, 0.2), rgba(0, 150, 0, 0.1));
        }
        
        .ship-card.frigate {
            border-color: #ffff00;
            background: linear-gradient(135deg, rgba(255, 255, 0, 0.2), rgba(255, 150, 0, 0.1));
        }
        
        .ship-card.galleon {
            border-color: #ff8800;
            background: linear-gradient(135deg, rgba(255, 136, 0, 0.2), rgba(255, 68, 0, 0.1));
        }
        
        .ship-card.man-of-war {
            border-color: #ff0000;
            background: linear-gradient(135deg, rgba(255, 0, 0, 0.2), rgba(150, 0, 0, 0.1));
        }
        
        .ship-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 15px 0;
        }
        
        .stat-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 10px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
        }
        
        .purchase-btn {
            background: linear-gradient(45deg, #FFD700, #FFA500);
            color: #000;
            border: none;
            padding: 15px 30px;
            border-radius: 10px;
            cursor: pointer;
            font-weight: bold;
            width: 100%;
            margin-top: 15px;
            transition: all 0.3s;
            font-size: 16px;
        }
        
        .purchase-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 8px 20px rgba(255, 215, 0, 0.6);
        }
        
        .battle-zones {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            padding: 20px;
            margin-top: 30px;
        }
        
        .zone-card {
            border: 2px solid #4682B4;
            border-radius: 15px;
            padding: 20px;
            background: rgba(70, 130, 180, 0.1);
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .zone-card:hover {
            border-color: #FFD700;
            background: rgba(255, 215, 0, 0.1);
            transform: translateY(-5px);
        }
        
        .cannon-controls {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border: 3px solid #FFD700;
            border-radius: 15px;
            display: none;
        }
        
        .cannon-controls.active {
            display: block;
        }
        
        .ammo-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin: 10px 0;
        }
        
        .ammo-btn {
            background: #4a4a4a;
            color: #FFD700;
            border: 2px solid #FFD700;
            padding: 10px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .ammo-btn:hover, .ammo-btn.selected {
            background: #FFD700;
            color: #000;
            transform: scale(1.05);
        }
        
        .fleet-status {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border: 3px solid #FFD700;
            border-radius: 15px;
            min-width: 300px;
        }
        
        .combat-log {
            position: fixed;
            top: 50%;
            left: 20px;
            transform: translateY(-50%);
            width: 350px;
            height: 250px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #FFD700;
            border-radius: 10px;
            padding: 15px;
            overflow-y: auto;
        }
        
        .log-entry {
            font-size: 13px;
            margin-bottom: 8px;
            padding: 5px;
            border-radius: 5px;
            background: rgba(255, 215, 0, 0.1);
        }
        
        .log-entry.damage { border-left: 4px solid #ff0000; }
        .log-entry.victory { border-left: 4px solid #00ff00; }
        .log-entry.system { border-left: 4px solid #0099ff; }
        
        @keyframes cannonFire {
            0% { transform: scale(1); }
            50% { transform: scale(1.2) rotate(5deg); }
            100% { transform: scale(1); }
        }
        
        .firing {
            animation: cannonFire 0.5s ease-in-out;
        }
        
        .price-tag {
            position: absolute;
            top: 15px;
            right: 15px;
            background: #FFD700;
            color: #000;
            padding: 8px 15px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 16px;
        }
    </style>
</head>
<body>
    <div class="ship-hud">
        <h3>⚓ Ship Status</h3>
        <div>Captain: <span id="captainName">Unknown</span></div>
        <div>Gold: <span id="playerGold">5000</span> 🪙</div>
        <div>Fleet Size: <span id="fleetSize">0</span></div>
        <div>Current Ship: <span id="currentShip">None</span></div>
        <div style="margin-top: 10px;">Hull Integrity:</div>
        <div class="health-bar">
            <div class="health-fill" id="shipHealth" style="width: 100%"></div>
        </div>
        <div>Crew: <span id="crewCount">0</span> | Cannons: <span id="cannonCount">0</span></div>
    </div>
    
    <div style="text-align: center; padding: 30px;">
        <h1>⚓ NAVAL BATTLE ARENA</h1>
        <p>Build your fleet, master the seas, and become a legendary captain!</p>
        <p><strong>Purchase your warship and sail into battle:</strong></p>
    </div>
    
    <div class="ships-grid" id="shipsGrid">
        <!-- Ships will be populated by JavaScript -->
    </div>
    
    <div style="text-align: center; padding: 20px;">
        <h2>⚔️ BATTLE ZONES</h2>
        <p>Choose your battleground:</p>
    </div>
    
    <div class="battle-zones" id="battleZones">
        <!-- Zones will be populated by JavaScript -->
    </div>
    
    <div class="cannon-controls" id="cannonControls">
        <h4>🎯 Cannon Controls</h4>
        <div>Select ammunition:</div>
        <div class="ammo-grid">
            <div class="ammo-btn" data-ammo="iron">⚫ Iron Ball</div>
            <div class="ammo-btn" data-ammo="chain">⛓️ Chain Shot</div>
            <div class="ammo-btn" data-ammo="explosive">💥 Explosive</div>
            <div class="ammo-btn" data-ammo="grapeshot">🔫 Grapeshot</div>
        </div>
        <button class="purchase-btn" onclick="fireCannons()">🔥 FIRE CANNONS!</button>
    </div>
    
    <div class="fleet-status">
        <h3>🚢 Your Fleet</h3>
        <div>Ships Owned: <span id="shipsOwned">0</span></div>
        <div>Battles Won: <span id="battlesWon">0</span></div>
        <div>Ships Destroyed: <span id="shipsDestroyed">0</span></div>
        <div>Total Loot: <span id="totalLoot">0</span> 🪙</div>
    </div>
    
    <div class="combat-log" id="combatLog">
        <h4>⚔️ Combat Log</h4>
        <div class="log-entry system">Welcome to Naval Battle Arena!</div>
        <div class="log-entry system">Purchase a ship to begin your naval career</div>
    </div>
    
    <script>
        let ws;
        let player = null;
        let shipTypes = [];
        let combatZones = [];
        let selectedAmmo = 'iron';
        let currentBattle = null;
        
        function connectToShipCombat() {
            ws = new WebSocket('ws://localhost:${this.config.wsPort}');
            
            ws.onopen = function() {
                console.log('Connected to Ship Combat Arena');
                addLogEntry('🔗 Connected to Naval Battle Arena', 'system');
                
                // Register captain
                ws.send(JSON.stringify({
                    type: 'captain_join',
                    playerId: 'captain_' + Math.random().toString(36).substr(2, 9),
                    playerName: prompt('Enter your captain name:') || 'Anonymous Captain',
                    level: 1,
                    gold: 5000
                }));
            };
            
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                handleCombatMessage(data);
            };
            
            ws.onclose = function() {
                addLogEntry('❌ Lost connection to Combat Arena', 'system');
                setTimeout(connectToShipCombat, 3000);
            };
        }
        
        function handleCombatMessage(data) {
            switch (data.type) {
                case 'welcome_to_combat':
                    shipTypes = data.shipTypes;
                    combatZones = data.combatZones;
                    renderShips();
                    renderBattleZones();
                    addLogEntry('⚓ Welcome to the high seas!', 'system');
                    break;
                    
                case 'captain_state':
                    player = data.player;
                    updatePlayerDisplay();
                    break;
                    
                case 'ship_purchased':
                    handleShipPurchased(data);
                    break;
                    
                case 'battle_started':
                    handleBattleStarted(data);
                    break;
                    
                case 'cannons_fired':
                    handleCannonsFired(data);
                    break;
                    
                case 'ship_damaged':
                    handleShipDamaged(data);
                    break;
                    
                case 'battle_ended':
                    handleBattleEnded(data);
                    break;
                    
                case 'purchase_error':
                case 'battle_error':
                case 'cannon_error':
                    addLogEntry('⚠️ ' + data.error, 'system');
                    break;
            }
        }
        
        function renderShips() {
            const grid = document.getElementById('shipsGrid');
            
            grid.innerHTML = shipTypes.map(ship => \`
                <div class="ship-card \${ship.id}" onclick="purchaseShip('\${ship.id}')">
                    <div class="price-tag">\${ship.cost.toLocaleString()} 🪙</div>
                    <h3>\${ship.name}</h3>
                    <p>\${ship.description}</p>
                    
                    <div class="ship-stats">
                        <div class="stat-item">
                            <span>Hull:</span>
                            <span>\${ship.health} HP</span>
                        </div>
                        <div class="stat-item">
                            <span>Speed:</span>
                            <span>\${ship.speed} kts</span>
                        </div>
                        <div class="stat-item">
                            <span>Cannons:</span>
                            <span>\${ship.cannons}</span>
                        </div>
                        <div class="stat-item">
                            <span>Crew:</span>
                            <span>\${ship.crew}</span>
                        </div>
                    </div>
                    
                    <button class="purchase-btn">⚓ PURCHASE SHIP</button>
                </div>
            \`).join('');
        }
        
        function renderBattleZones() {
            const zones = document.getElementById('battleZones');
            
            zones.innerHTML = combatZones.map(zone => \`
                <div class="zone-card" onclick="enterBattle('\${zone.id}')">
                    <h3>\${zone.name}</h3>
                    <p>\${zone.description}</p>
                    <div><strong>Difficulty:</strong> ${'★'.repeat(zone.difficulty)}</div>
                    <div><strong>Weather:</strong> \${zone.weatherEffects.join(', ')}</div>
                    <div><strong>Hazards:</strong> \${zone.hazards.join(', ')}</div>
                    <button class="purchase-btn" style="margin-top: 15px;">⚔️ ENTER BATTLE</button>
                </div>
            \`).join('');
        }
        
        function purchaseShip(shipTypeId) {
            if (!player) {
                addLogEntry('⚠️ Player not ready', 'system');
                return;
            }
            
            const shipName = prompt('Name your ship:') || \`\${player.name}'s Ship\`;
            
            ws.send(JSON.stringify({
                type: 'purchase_ship',
                shipType: shipTypeId,
                shipName: shipName
            }));
        }
        
        function handleShipPurchased(data) {
            const ship = data.ship;
            addLogEntry(\`⚓ Purchased \${ship.name}! Hull: \${ship.health}HP, Cannons: \${ship.cannons}\`, 'victory');
            
            if (player) {
                player.gold = data.playerGold;
                player.fleet = player.fleet || [];
                player.fleet.push(ship.id);
                updatePlayerDisplay();
            }
        }
        
        function enterBattle(zoneId) {
            if (!player || !player.fleet || player.fleet.length === 0) {
                addLogEntry('⚠️ You need a ship before entering battle!', 'system');
                return;
            }
            
            ws.send(JSON.stringify({
                type: 'start_battle',
                zoneId: zoneId,
                shipId: player.fleet[0] // Use first ship
            }));
        }
        
        function handleBattleStarted(data) {
            currentBattle = data.battle;
            const zone = data.zone;
            const ship = data.ship;
            
            addLogEntry(\`⚔️ Battle started in \${zone.name}!\`, 'victory');
            addLogEntry(\`🚢 \${ship.name} ready for combat\`, 'system');
            addLogEntry(\`🌊 Weather: \${data.battle.weather.type}\`, 'system');
            
            // Show cannon controls
            document.getElementById('cannonControls').classList.add('active');
            
            // Update ship HUD
            document.getElementById('currentShip').textContent = ship.name;
            document.getElementById('crewCount').textContent = ship.crew;
            document.getElementById('cannonCount').textContent = ship.cannons;
            updateShipHealth(ship.health / ship.maxHealth * 100);
        }
        
        function fireCannons() {
            if (!currentBattle || !player) {
                addLogEntry('⚠️ No active battle', 'system');
                return;
            }
            
            // Simulate target selection
            const targetX = 400 + Math.random() * 200;
            const targetY = 400 + Math.random() * 200;
            
            ws.send(JSON.stringify({
                type: 'fire_cannons',
                shipId: player.fleet[0],
                targetPosition: { x: targetX, y: targetY },
                cannonballType: selectedAmmo
            }));
            
            // Visual feedback
            document.body.classList.add('firing');
            setTimeout(() => document.body.classList.remove('firing'), 500);
        }
        
        function handleCannonsFired(data) {
            const cannonball = data.cannonball;
            addLogEntry(\`💥 \${cannonball.type} cannonball fired!\`, 'system');
        }
        
        function handleShipDamaged(data) {
            const ship = data.ship;
            const damage = data.damage;
            
            addLogEntry(\`💥 \${ship.name} takes \${damage} damage from \${data.attacker}!\`, 'damage');
            
            if (player && player.fleet.includes(ship.id)) {
                updateShipHealth(ship.health / ship.maxHealth * 100);
            }
        }
        
        function handleBattleEnded(data) {
            const winner = data.winner;
            const duration = Math.round(data.duration / 1000);
            
            if (winner === 'players') {
                addLogEntry(\`🏆 Victory! Battle won in \${duration} seconds!\`, 'victory');
                if (data.rewards) {
                    addLogEntry(\`💰 Rewards: \${data.rewards.gold} gold, \${data.rewards.reputation} reputation\`, 'victory');
                }
            } else {
                addLogEntry(\`💀 Defeat! Your ship was destroyed after \${duration} seconds\`, 'damage');
            }
            
            currentBattle = null;
            document.getElementById('cannonControls').classList.remove('active');
        }
        
        function updatePlayerDisplay() {
            if (!player) return;
            
            document.getElementById('captainName').textContent = player.name;
            document.getElementById('playerGold').textContent = player.gold.toLocaleString();
            document.getElementById('fleetSize').textContent = player.fleet ? player.fleet.length : 0;
            document.getElementById('shipsOwned').textContent = player.fleet ? player.fleet.length : 0;
            document.getElementById('battlesWon').textContent = player.stats.battlesWon;
            document.getElementById('shipsDestroyed').textContent = player.stats.shipsDestroyed;
            document.getElementById('totalLoot').textContent = player.stats.treasureLooted;
        }
        
        function updateShipHealth(percentage) {
            document.getElementById('shipHealth').style.width = percentage + '%';
        }
        
        function addLogEntry(message, type = 'system') {
            const log = document.getElementById('combatLog');
            const entry = document.createElement('div');
            entry.className = 'log-entry ' + type;
            entry.textContent = new Date().toLocaleTimeString() + ' - ' + message;
            
            log.appendChild(entry);
            log.scrollTop = log.scrollHeight;
            
            // Keep only last 50 entries
            while (log.children.length > 52) { // +2 for header
                log.removeChild(log.children[2]);
            }
        }
        
        // Ammunition selection
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('ammo-btn')) {
                document.querySelectorAll('.ammo-btn').forEach(btn => 
                    btn.classList.remove('selected'));
                e.target.classList.add('selected');
                selectedAmmo = e.target.dataset.ammo;
                addLogEntry(\`🎯 Selected \${selectedAmmo} ammunition\`, 'system');
            }
        });
        
        // Initialize
        connectToShipCombat();
        
        // Select default ammunition
        setTimeout(() => {
            document.querySelector('.ammo-btn[data-ammo="iron"]').classList.add('selected');
        }, 1000);
    </script>
</body>
</html>`;
    }
}

module.exports = ShipCombatArena;

// Start if executed directly
if (require.main === module) {
    const shipCombat = new ShipCombatArena();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Ship Combat Arena shutting down...');
        process.exit(0);
    });
}