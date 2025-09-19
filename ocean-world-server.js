#!/usr/bin/env node

/**
 * 🌊 OCEAN WORLD SERVER
 * 
 * Deep sea exploration, treasure diving, underwater combat
 * First distributed game world in the metaverse
 */

const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class OceanWorldServer extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 8000,
            wsPort: config.wsPort || 8001,
            hubUrl: config.hubUrl || 'ws://localhost:7001',
            ...config
        };
        
        // Ocean world state
        this.players = new Map();
        this.treasures = new Map();
        this.seaCreatures = new Map();
        this.divingSites = new Map();
        this.submarines = new Map();
        
        // Ocean zones with different depths and difficulties
        this.oceanZones = new Map([
            ['shallow-reef', {
                id: 'shallow-reef',
                name: 'Coral Reef Gardens',
                depth: 30,
                difficulty: 1,
                treasureSpawnRate: 0.3,
                creatures: ['tropical-fish', 'sea-turtle', 'harmless-shark'],
                description: 'Colorful coral reefs perfect for beginners'
            }],
            ['twilight-zone', {
                id: 'twilight-zone',
                name: 'Twilight Depths',
                depth: 200,
                difficulty: 3,
                treasureSpawnRate: 0.6,
                creatures: ['jellyfish', 'octopus', 'barracuda'],
                description: 'Mysterious waters where sunlight fades'
            }],
            ['abyssal-depths', {
                id: 'abyssal-depths',
                name: 'Abyssal Trenches',
                depth: 2000,
                difficulty: 8,
                treasureSpawnRate: 0.9,
                creatures: ['giant-squid', 'anglerfish', 'deep-sea-dragon'],
                description: 'Crushing depths hide the greatest treasures'
            }],
            ['shipwreck-graveyard', {
                id: 'shipwreck-graveyard',
                name: 'Shipwreck Graveyard',
                depth: 800,
                difficulty: 5,
                treasureSpawnRate: 1.0,
                creatures: ['skeleton-crew', 'ghost-shark', 'cursed-octopus'],
                description: 'Ancient ships rest with their treasures... and guardians'
            }]
        ]);
        
        // Treasure types
        this.treasureTypes = [
            { type: 'doubloons', value: 100, rarity: 'common', description: 'Pirate gold coins' },
            { type: 'pearl', value: 500, rarity: 'uncommon', description: 'Lustrous ocean pearl' },
            { type: 'ruby', value: 1000, rarity: 'rare', description: 'Blood-red ruby' },
            { type: 'ancient-artifact', value: 5000, rarity: 'legendary', description: 'Mysterious ancient relic' },
            { type: 'kraken-scale', value: 10000, rarity: 'mythic', description: 'Scale from the great Kraken' }
        ];
        
        // Connection to universal hub
        this.hubConnection = null;
        this.worldRegistered = false;
        
        // Statistics
        this.stats = {
            playersActive: 0,
            treasuresFound: 0,
            creaturesDefeated: 0,
            depthsExplored: 0,
            startTime: Date.now()
        };
        
        console.log('🌊 Initializing Ocean World Server...');
        this.initialize();
    }
    
    async initialize() {
        // Connect to Universal Hub
        await this.connectToUniversalHub();
        
        // Setup Express server
        this.setupWebServer();
        
        // Setup WebSocket server for players
        this.setupPlayerWebSocket();
        
        // Initialize ocean world
        this.initializeOceanWorld();
        
        // Start world simulation
        this.startWorldSimulation();
        
        console.log('✅ Ocean World Server ready!');
        console.log(`🌊 Ocean Interface: http://localhost:${this.config.port}`);
        console.log(`🐠 Player WebSocket: ws://localhost:${this.config.wsPort}`);
        
        this.emit('ocean_world_ready');
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
            worldId: 'ocean-world',
            worldData: {
                name: 'Deep Sea Explorer',
                description: 'Underwater treasure hunting and diving adventures',
                type: 'exploration',
                port: this.config.port,
                wsPort: this.config.wsPort,
                features: ['diving', 'treasure-hunting', 'underwater-combat', 'submarine-crafting'],
                zones: Array.from(this.oceanZones.keys()),
                playerCapacity: 100
            }
        };
        
        this.hubConnection.send(JSON.stringify(registrationData));
        this.worldRegistered = true;
        console.log('🌊 Registered Ocean World with Universal Hub');
    }
    
    handleHubMessage(message) {
        switch (message.type) {
            case 'cross_world_event':
                this.handleCrossWorldEvent(message.event);
                break;
            case 'player_transfer':
                this.handlePlayerTransfer(message);
                break;
            case 'universal_economy_update':
                this.updateTreasureValues(message.priceUpdates);
                break;
        }
    }
    
    setupWebServer() {
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static(__dirname));
        
        // Ocean World main interface
        this.app.get('/', (req, res) => {
            res.send(this.renderOceanWorld());
        });
        
        // Ocean zones API
        this.app.get('/api/zones', (req, res) => {
            res.json({
                zones: Array.from(this.oceanZones.values()),
                totalZones: this.oceanZones.size
            });
        });
        
        // Diving expedition API
        this.app.post('/api/dive', async (req, res) => {
            const { playerId, zoneId, equipment } = req.body;
            const result = await this.startDivingExpedition(playerId, zoneId, equipment);
            res.json(result);
        });
        
        // Treasure collection API
        this.app.post('/api/collect-treasure', async (req, res) => {
            const { playerId, treasureId } = req.body;
            const result = await this.collectTreasure(playerId, treasureId);
            res.json(result);
        });
        
        // Submarine crafting API
        this.app.post('/api/craft-submarine', async (req, res) => {
            const { playerId, submarineType, materials } = req.body;
            const result = await this.craftSubmarine(playerId, submarineType, materials);
            res.json(result);
        });
        
        // Ocean world statistics
        this.app.get('/api/stats', (req, res) => {
            res.json({
                ...this.stats,
                uptime: Date.now() - this.stats.startTime,
                activePlayers: this.players.size,
                spawnedTreasures: this.treasures.size,
                livingCreatures: this.seaCreatures.size
            });
        });
        
        this.app.listen(this.config.port, () => {
            console.log(`🌊 Ocean World running on port ${this.config.port}`);
        });
    }
    
    setupPlayerWebSocket() {
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🐠 New diver connected');
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    await this.handlePlayerMessage(ws, message);
                } catch (error) {
                    console.error('Player message error:', error);
                }
            });
            
            ws.on('close', () => {
                this.handlePlayerDisconnect(ws);
            });
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome_to_ocean',
                worldName: 'Deep Sea Explorer',
                zones: Array.from(this.oceanZones.values()),
                timestamp: Date.now()
            }));
        });
        
        console.log(`🐠 Player WebSocket listening on port ${this.config.wsPort}`);
    }
    
    async handlePlayerMessage(ws, message) {
        switch (message.type) {
            case 'player_join':
                this.registerPlayer(ws, message);
                break;
                
            case 'start_diving':
                await this.handleStartDiving(ws, message);
                break;
                
            case 'collect_treasure':
                await this.handleCollectTreasure(ws, message);
                break;
                
            case 'attack_creature':
                await this.handleCreatureCombat(ws, message);
                break;
                
            case 'surface':
                this.handlePlayerSurface(ws, message);
                break;
                
            case 'cross_world_travel':
                this.handleCrossWorldTravel(ws, message);
                break;
        }
    }
    
    registerPlayer(ws, message) {
        const player = {
            id: message.playerId,
            ws,
            name: message.playerName || 'Anonymous Diver',
            level: message.level || 1,
            equipment: message.equipment || { suit: 'basic', tank: 'standard' },
            currentZone: 'surface',
            position: { x: 0, y: 0, depth: 0 },
            inventory: message.inventory || [],
            stats: {
                treasuresFound: 0,
                creaturesDefeated: 0,
                maxDepthReached: 0,
                timeUnderwater: 0
            },
            connectedAt: Date.now()
        };
        
        this.players.set(player.id, player);
        this.stats.playersActive = this.players.size;
        
        console.log(`🐠 Player registered: ${player.name} (${player.id})`);
        
        // Send player state
        ws.send(JSON.stringify({
            type: 'player_state',
            player: {
                ...player,
                ws: undefined // Don't send WebSocket object
            }
        }));
        
        // Notify hub of new player
        this.notifyHubPlayerJoined(player);
    }
    
    async handleStartDiving(ws, message) {
        const player = this.getPlayerByWs(ws);
        if (!player) return;
        
        const zone = this.oceanZones.get(message.zoneId);
        if (!zone) {
            ws.send(JSON.stringify({
                type: 'diving_error',
                error: 'Zone not found'
            }));
            return;
        }
        
        // Check if player has proper equipment for depth
        if (!this.canDiveToZone(player, zone)) {
            ws.send(JSON.stringify({
                type: 'diving_error',
                error: 'Insufficient equipment for this depth'
            }));
            return;
        }
        
        // Start diving
        player.currentZone = zone.id;
        player.position.depth = zone.depth;
        player.stats.maxDepthReached = Math.max(player.stats.maxDepthReached, zone.depth);
        
        // Generate diving encounter
        const encounter = this.generateDivingEncounter(zone);
        
        ws.send(JSON.stringify({
            type: 'diving_started',
            zone: zone,
            encounter: encounter,
            player: {
                ...player,
                ws: undefined
            }
        }));
        
        console.log(`🐠 ${player.name} started diving in ${zone.name}`);
        
        // Cross-world event if significant dive
        if (zone.depth > 1000) {
            this.sendCrossWorldEvent({
                type: 'deep_dive_achievement',
                playerId: player.id,
                playerName: player.name,
                depth: zone.depth,
                zoneName: zone.name
            });
        }
    }
    
    generateDivingEncounter(zone) {
        const encounter = {
            id: crypto.randomUUID(),
            zoneId: zone.id,
            treasures: [],
            creatures: [],
            hazards: [],
            specialEvents: []
        };
        
        // Generate treasures based on zone spawn rate
        if (Math.random() < zone.treasureSpawnRate) {
            const treasureCount = 1 + Math.floor(Math.random() * zone.difficulty);
            
            for (let i = 0; i < treasureCount; i++) {
                const treasure = this.generateTreasure(zone);
                encounter.treasures.push(treasure);
                this.treasures.set(treasure.id, treasure);
            }
        }
        
        // Generate sea creatures
        const creatureCount = Math.floor(Math.random() * 3);
        for (let i = 0; i < creatureCount; i++) {
            const creature = this.generateSeaCreature(zone);
            encounter.creatures.push(creature);
            this.seaCreatures.set(creature.id, creature);
        }
        
        // Add zone-specific special events
        if (zone.id === 'shipwreck-graveyard' && Math.random() < 0.1) {
            encounter.specialEvents.push({
                type: 'ghost_ship_sighting',
                description: 'A spectral ship emerges from the darkness...',
                effect: 'bonus_treasure_chance'
            });
        }
        
        return encounter;
    }
    
    generateTreasure(zone) {
        const rarity = this.calculateTreasureRarity(zone.difficulty);
        const availableTreasures = this.treasureTypes.filter(t => {
            if (rarity === 'common') return ['common'].includes(t.rarity);
            if (rarity === 'uncommon') return ['common', 'uncommon'].includes(t.rarity);
            if (rarity === 'rare') return ['common', 'uncommon', 'rare'].includes(t.rarity);
            return true; // legendary and mythic zones can spawn anything
        });
        
        const treasureType = availableTreasures[Math.floor(Math.random() * availableTreasures.length)];
        
        return {
            id: crypto.randomUUID(),
            type: treasureType.type,
            value: treasureType.value * (1 + zone.difficulty * 0.1),
            rarity: treasureType.rarity,
            description: treasureType.description,
            zoneId: zone.id,
            spawnedAt: Date.now(),
            collected: false
        };
    }
    
    generateSeaCreature(zone) {
        const possibleCreatures = zone.creatures;
        const creatureType = possibleCreatures[Math.floor(Math.random() * possibleCreatures.length)];
        
        return {
            id: crypto.randomUUID(),
            type: creatureType,
            level: zone.difficulty + Math.floor(Math.random() * 3),
            health: 100 + (zone.difficulty * 20),
            attack: 10 + (zone.difficulty * 5),
            defense: 5 + (zone.difficulty * 3),
            zoneId: zone.id,
            hostile: this.isCreatureHostile(creatureType),
            spawnedAt: Date.now()
        };
    }
    
    isCreatureHostile(creatureType) {
        const hostileCreatures = [
            'barracuda', 'giant-squid', 'deep-sea-dragon', 
            'skeleton-crew', 'ghost-shark', 'cursed-octopus'
        ];
        return hostileCreatures.includes(creatureType);
    }
    
    calculateTreasureRarity(difficulty) {
        const roll = Math.random();
        if (difficulty <= 2) {
            return roll < 0.8 ? 'common' : 'uncommon';
        } else if (difficulty <= 4) {
            return roll < 0.5 ? 'common' : roll < 0.8 ? 'uncommon' : 'rare';
        } else if (difficulty <= 6) {
            return roll < 0.3 ? 'uncommon' : roll < 0.7 ? 'rare' : 'legendary';
        } else {
            return roll < 0.2 ? 'rare' : roll < 0.6 ? 'legendary' : 'mythic';
        }
    }
    
    async handleCollectTreasure(ws, message) {
        const player = this.getPlayerByWs(ws);
        const treasure = this.treasures.get(message.treasureId);
        
        if (!player || !treasure || treasure.collected) {
            ws.send(JSON.stringify({
                type: 'collection_failed',
                error: 'Treasure not available'
            }));
            return;
        }
        
        // Mark treasure as collected
        treasure.collected = true;
        treasure.collectedBy = player.id;
        treasure.collectedAt = Date.now();
        
        // Add to player inventory
        player.inventory.push(treasure);
        player.stats.treasuresFound++;
        this.stats.treasuresFound++;
        
        ws.send(JSON.stringify({
            type: 'treasure_collected',
            treasure: treasure,
            playerStats: player.stats
        }));
        
        console.log(`💰 ${player.name} found ${treasure.type} worth ${treasure.value} coins`);
        
        // Cross-world event for rare treasures
        if (['legendary', 'mythic'].includes(treasure.rarity)) {
            this.sendCrossWorldEvent({
                type: 'rare_treasure_found',
                playerId: player.id,
                playerName: player.name,
                treasure: treasure,
                sourceWorld: 'ocean-world'
            });
        }
        
        // Update universal soul
        this.updatePlayerSoul(player, {
            oceanTreasuresFound: player.stats.treasuresFound,
            lastTreasureValue: treasure.value,
            maxDepthReached: player.stats.maxDepthReached
        });
    }
    
    getPlayerByWs(ws) {
        for (const player of this.players.values()) {
            if (player.ws === ws) {
                return player;
            }
        }
        return null;
    }
    
    canDiveToZone(player, zone) {
        // Basic equipment checks
        if (zone.depth > 100 && !player.equipment.deepSuit) {
            return false;
        }
        if (zone.depth > 500 && !player.equipment.pressureSuit) {
            return false;
        }
        if (zone.depth > 1000 && !player.equipment.submarine) {
            return false;
        }
        return true;
    }
    
    sendCrossWorldEvent(eventData) {
        if (this.hubConnection && this.hubConnection.readyState === WebSocket.OPEN) {
            this.hubConnection.send(JSON.stringify({
                type: 'cross_world_action',
                sourceWorld: 'ocean-world',
                ...eventData
            }));
        }
    }
    
    updatePlayerSoul(player, oceanData) {
        if (this.hubConnection && this.hubConnection.readyState === WebSocket.OPEN) {
            this.hubConnection.send(JSON.stringify({
                type: 'soul_update',
                playerId: player.id,
                worldId: 'ocean-world',
                soulData: {
                    oceanWorld: oceanData
                }
            }));
        }
    }
    
    notifyHubPlayerJoined(player) {
        if (this.hubConnection && this.hubConnection.readyState === WebSocket.OPEN) {
            this.hubConnection.send(JSON.stringify({
                type: 'world_event',
                eventType: 'player_joined',
                worldId: 'ocean-world',
                playerId: player.id,
                playerName: player.name
            }));
        }
    }
    
    initializeOceanWorld() {
        // Pre-spawn some treasures in each zone for atmosphere
        for (const zone of this.oceanZones.values()) {
            const treasureCount = Math.floor(zone.treasureSpawnRate * 5);
            
            for (let i = 0; i < treasureCount; i++) {
                const treasure = this.generateTreasure(zone);
                this.treasures.set(treasure.id, treasure);
            }
        }
        
        console.log(`🏴‍☠️ Pre-spawned ${this.treasures.size} treasures across all zones`);
    }
    
    startWorldSimulation() {
        // Spawn new treasures periodically
        setInterval(() => {
            for (const zone of this.oceanZones.values()) {
                if (Math.random() < zone.treasureSpawnRate / 10) { // Slower spawn rate
                    const treasure = this.generateTreasure(zone);
                    this.treasures.set(treasure.id, treasure);
                }
            }
        }, 30000); // Every 30 seconds
        
        // Clean up old collected treasures
        setInterval(() => {
            const oneHourAgo = Date.now() - 3600000;
            
            for (const [treasureId, treasure] of this.treasures) {
                if (treasure.collected && treasure.collectedAt < oneHourAgo) {
                    this.treasures.delete(treasureId);
                }
            }
        }, 300000); // Every 5 minutes
    }
    
    handlePlayerDisconnect(ws) {
        const player = this.getPlayerByWs(ws);
        if (player) {
            this.players.delete(player.id);
            this.stats.playersActive = this.players.size;
            console.log(`🐠 Player disconnected: ${player.name}`);
        }
    }
    
    renderOceanWorld() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🌊 Deep Sea Explorer</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Courier New', monospace;
            background: linear-gradient(180deg, #001a3d 0%, #003366 30%, #004080 60%, #000d1a 100%);
            color: #00ccff;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .ocean-surface {
            height: 100px;
            background: linear-gradient(180deg, #87CEEB 0%, #4682B4 100%);
            position: relative;
            animation: waves 3s ease-in-out infinite;
        }
        
        @keyframes waves {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
        }
        
        .submarine-hud {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border: 2px solid #00ccff;
            border-radius: 10px;
            min-width: 250px;
        }
        
        .depth-meter {
            margin-bottom: 10px;
        }
        
        .depth-bar {
            width: 100%;
            height: 10px;
            background: #000033;
            border: 1px solid #00ccff;
            position: relative;
        }
        
        .depth-fill {
            height: 100%;
            background: linear-gradient(90deg, #00ff00 0%, #ffff00 50%, #ff0000 100%);
            transition: width 0.5s;
        }
        
        .zones-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            padding: 20px;
        }
        
        .zone-card {
            border: 2px solid;
            border-radius: 15px;
            padding: 20px;
            position: relative;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .zone-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 204, 255, 0.3);
        }
        
        .zone-card.difficulty-1 { border-color: #00ff00; background: rgba(0, 255, 0, 0.1); }
        .zone-card.difficulty-3 { border-color: #ffff00; background: rgba(255, 255, 0, 0.1); }
        .zone-card.difficulty-5 { border-color: #ff8800; background: rgba(255, 136, 0, 0.1); }
        .zone-card.difficulty-8 { border-color: #ff0000; background: rgba(255, 0, 0, 0.1); }
        
        .difficulty-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .treasure-indicator {
            display: flex;
            align-items: center;
            gap: 5px;
            margin: 10px 0;
        }
        
        .treasure-stars {
            color: #ffd700;
        }
        
        .dive-button {
            background: linear-gradient(45deg, #00ccff, #0099cc);
            color: #000;
            border: none;
            padding: 12px 25px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            width: 100%;
            margin-top: 15px;
            transition: all 0.3s;
        }
        
        .dive-button:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(0, 204, 255, 0.4);
        }
        
        .player-status {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border: 2px solid #00ccff;
            border-radius: 10px;
            min-width: 300px;
        }
        
        .inventory-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 5px;
            margin-top: 10px;
        }
        
        .inventory-slot {
            width: 40px;
            height: 40px;
            border: 1px solid #00ccff;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            background: rgba(0, 50, 100, 0.3);
        }
        
        .inventory-slot.filled {
            background: rgba(255, 215, 0, 0.3);
        }
        
        .chat-feed {
            position: fixed;
            top: 50%;
            left: 20px;
            transform: translateY(-50%);
            width: 300px;
            height: 200px;
            background: rgba(0, 0, 0, 0.7);
            border: 1px solid #00ccff;
            border-radius: 10px;
            padding: 10px;
            overflow-y: auto;
        }
        
        .chat-message {
            font-size: 12px;
            margin-bottom: 5px;
            padding: 3px;
            border-radius: 3px;
            background: rgba(0, 204, 255, 0.1);
        }
        
        .rarity-common { color: #ffffff; }
        .rarity-uncommon { color: #00ff00; }
        .rarity-rare { color: #0099ff; }
        .rarity-legendary { color: #ff8800; }
        .rarity-mythic { color: #ff0099; }
    </style>
</head>
<body>
    <div class="ocean-surface"></div>
    
    <div class="submarine-hud">
        <h3>🚢 Submarine Control</h3>
        <div class="depth-meter">
            <div>Depth: <span id="currentDepth">0</span>m</div>
            <div class="depth-bar">
                <div class="depth-fill" id="depthFill" style="width: 0%"></div>
            </div>
        </div>
        <div>O² Level: <span id="oxygenLevel">100</span>%</div>
        <div>Pressure: <span id="pressure">1</span> ATM</div>
        <div>Equipment: <span id="equipment">Basic Gear</span></div>
    </div>
    
    <div style="text-align: center; padding: 20px;">
        <h1>🌊 DEEP SEA EXPLORER</h1>
        <p>Dive into the ocean depths and discover ancient treasures</p>
        <p><strong>Choose your diving zone:</strong></p>
    </div>
    
    <div class="zones-grid" id="zonesGrid">
        <!-- Zones will be populated by JavaScript -->
    </div>
    
    <div class="player-status">
        <h3>🐠 Player Status</h3>
        <div>Name: <span id="playerName">Anonymous Diver</span></div>
        <div>Level: <span id="playerLevel">1</span></div>
        <div>Treasures Found: <span id="treasuresFound">0</span></div>
        <div>Max Depth: <span id="maxDepth">0</span>m</div>
        
        <h4>🎒 Inventory</h4>
        <div class="inventory-grid" id="inventoryGrid">
            ${Array.from({length: 10}, () => '<div class="inventory-slot"></div>').join('')}
        </div>
    </div>
    
    <div class="chat-feed" id="chatFeed">
        <h4>🌊 Ocean Updates</h4>
        <div class="chat-message">Welcome to Deep Sea Explorer!</div>
        <div class="chat-message">Choose a diving zone to begin your adventure</div>
    </div>
    
    <script>
        let ws;
        let player = null;
        let zones = [];
        
        function connectToOceanWorld() {
            ws = new WebSocket('ws://localhost:${this.config.wsPort}');
            
            ws.onopen = function() {
                console.log('Connected to Ocean World');
                addChatMessage('🔗 Connected to Ocean World');
                
                // Register player
                ws.send(JSON.stringify({
                    type: 'player_join',
                    playerId: 'diver_' + Math.random().toString(36).substr(2, 9),
                    playerName: prompt('Enter your diver name:') || 'Anonymous Diver',
                    level: 1
                }));
            };
            
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                handleOceanMessage(data);
            };
            
            ws.onclose = function() {
                addChatMessage('❌ Lost connection to Ocean World');
                setTimeout(connectToOceanWorld, 3000);
            };
        }
        
        function handleOceanMessage(data) {
            switch (data.type) {
                case 'welcome_to_ocean':
                    zones = data.zones;
                    renderZones();
                    addChatMessage('🌊 Welcome to the ocean depths!');
                    break;
                    
                case 'player_state':
                    player = data.player;
                    updatePlayerDisplay();
                    break;
                    
                case 'diving_started':
                    handleDivingStarted(data);
                    break;
                    
                case 'treasure_collected':
                    handleTreasureCollected(data);
                    break;
                    
                case 'diving_error':
                    addChatMessage('⚠️ ' + data.error);
                    break;
            }
        }
        
        function renderZones() {
            const grid = document.getElementById('zonesGrid');
            
            grid.innerHTML = zones.map(zone => {
                const treasureStars = '★'.repeat(Math.floor(zone.treasureSpawnRate * 5));
                
                return \`
                    <div class="zone-card difficulty-\${zone.difficulty}" onclick="startDiving('\${zone.id}')">
                        <div class="difficulty-badge" style="background: \${getDifficultyColor(zone.difficulty)}">
                            Level \${zone.difficulty}
                        </div>
                        <h3>\${zone.name}</h3>
                        <p>\${zone.description}</p>
                        <div><strong>Depth:</strong> \${zone.depth}m</div>
                        <div class="treasure-indicator">
                            <span>Treasure Rate:</span>
                            <span class="treasure-stars">\${treasureStars}</span>
                        </div>
                        <div><strong>Creatures:</strong> \${zone.creatures.slice(0, 2).join(', ')}</div>
                        <button class="dive-button">🤿 DIVE</button>
                    </div>
                \`;
            }).join('');
        }
        
        function getDifficultyColor(difficulty) {
            if (difficulty <= 2) return '#00ff00';
            if (difficulty <= 4) return '#ffff00';
            if (difficulty <= 6) return '#ff8800';
            return '#ff0000';
        }
        
        function startDiving(zoneId) {
            if (!player) {
                addChatMessage('⚠️ Player not ready');
                return;
            }
            
            const zone = zones.find(z => z.id === zoneId);
            addChatMessage(\`🤿 Starting dive to \${zone.name} at \${zone.depth}m depth...\`);
            
            ws.send(JSON.stringify({
                type: 'start_diving',
                zoneId: zoneId
            }));
            
            // Simulate depth change
            animateDepthChange(zone.depth);
        }
        
        function handleDivingStarted(data) {
            const zone = data.zone;
            const encounter = data.encounter;
            
            addChatMessage(\`🌊 Diving to \${zone.name}! Found \${encounter.treasures.length} treasures and \${encounter.creatures.length} creatures\`);
            
            // Show treasures
            encounter.treasures.forEach(treasure => {
                addChatMessage(\`💰 \${treasure.type} spotted! (\${treasure.rarity})\`, 'rarity-' + treasure.rarity);
                
                // Auto-collect treasure for demo
                setTimeout(() => {
                    ws.send(JSON.stringify({
                        type: 'collect_treasure',
                        treasureId: treasure.id
                    }));
                }, 2000);
            });
        }
        
        function handleTreasureCollected(data) {
            const treasure = data.treasure;
            addChatMessage(\`✨ Collected \${treasure.type}! Value: $\${treasure.value}\`, 'rarity-' + treasure.rarity);
            
            // Update inventory display
            updateInventoryDisplay(treasure);
            
            // Update stats
            if (player) {
                player.stats = data.playerStats;
                updatePlayerDisplay();
            }
        }
        
        function animateDepthChange(targetDepth) {
            const depthElement = document.getElementById('currentDepth');
            const fillElement = document.getElementById('depthFill');
            const pressureElement = document.getElementById('pressure');
            const oxygenElement = document.getElementById('oxygenLevel');
            
            let currentDepth = parseInt(depthElement.textContent);
            const maxDepth = 2000; // Max depth for meter
            
            const interval = setInterval(() => {
                if (currentDepth < targetDepth) {
                    currentDepth += 10;
                    depthElement.textContent = currentDepth;
                    fillElement.style.width = (currentDepth / maxDepth * 100) + '%';
                    pressureElement.textContent = (1 + currentDepth / 100).toFixed(1);
                    oxygenElement.textContent = Math.max(20, 100 - currentDepth / 20).toFixed(0);
                } else {
                    clearInterval(interval);
                }
            }, 50);
        }
        
        function updatePlayerDisplay() {
            if (!player) return;
            
            document.getElementById('playerName').textContent = player.name;
            document.getElementById('playerLevel').textContent = player.level;
            document.getElementById('treasuresFound').textContent = player.stats.treasuresFound;
            document.getElementById('maxDepth').textContent = player.stats.maxDepthReached;
        }
        
        function updateInventoryDisplay(treasure) {
            const slots = document.querySelectorAll('.inventory-slot');
            const emptySlot = Array.from(slots).find(slot => !slot.classList.contains('filled'));
            
            if (emptySlot) {
                emptySlot.classList.add('filled');
                emptySlot.textContent = getTreasureEmoji(treasure.type);
                emptySlot.title = \`\${treasure.type} - $\${treasure.value}\`;
            }
        }
        
        function getTreasureEmoji(treasureType) {
            const emojiMap = {
                'doubloons': '🪙',
                'pearl': '🦪',
                'ruby': '💎',
                'ancient-artifact': '🏺',
                'kraken-scale': '🐙'
            };
            return emojiMap[treasureType] || '💰';
        }
        
        function addChatMessage(message, className = '') {
            const feed = document.getElementById('chatFeed');
            const messageEl = document.createElement('div');
            messageEl.className = 'chat-message ' + className;
            messageEl.textContent = new Date().toLocaleTimeString() + ' - ' + message;
            
            feed.appendChild(messageEl);
            feed.scrollTop = feed.scrollHeight;
            
            // Keep only last 50 messages
            while (feed.children.length > 52) { // +2 for header
                feed.removeChild(feed.children[2]);
            }
        }
        
        // Initialize
        connectToOceanWorld();
    </script>
</body>
</html>`;
    }
}

module.exports = OceanWorldServer;

// Start if executed directly
if (require.main === module) {
    const oceanWorld = new OceanWorldServer();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Ocean World shutting down...');
        process.exit(0);
    });
}