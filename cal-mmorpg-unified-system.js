#!/usr/bin/env node

/**
 * CAL MMORPG UNIFIED SYSTEM
 * "Inside out and outside in and middle out all at once"
 * 
 * Integrates all gaming components into a unified MMORPG experience:
 * - Ships & Vehicles (GTA-style)
 * - Unix/Superuser/Cheatcode System
 * - Templates & Dynamic Generation
 * - Real-time Learning & Analytics
 * - Multi-device Synchronization
 * - Mathematical Game Mechanics
 */

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class CALUnifiedMMORPG extends EventEmitter {
    constructor() {
        super();
        
        this.serverPort = 7777; // Lucky 7s for the unified system
        this.wsPort = 7778;
        
        // MMORPG Architecture: Inside-Out, Outside-In, Middle-Out
        this.architecture = {
            insideOut: {
                name: 'Core → Universe',
                description: 'From player core expanding to universe',
                layers: ['consciousness', 'avatar', 'vehicle', 'zone', 'world', 'universe']
            },
            outsideIn: {
                name: 'Universe → Core',
                description: 'From universe affecting player core',
                layers: ['cosmic_events', 'world_states', 'zone_effects', 'vehicle_physics', 'avatar_stats', 'consciousness']
            },
            middleOut: {
                name: 'Simultaneous Expansion',
                description: 'From middle layer expanding both ways',
                centerLayer: 'zone',
                expansion: ['vehicle ↔ world', 'avatar ↔ cosmic', 'consciousness ↔ universe']
            }
        };
        
        // Game World Structure
        this.gameWorlds = {
            // GTA-style open world
            losAngeles: {
                name: 'Los Angeles Proxy',
                type: 'gta_open_world',
                features: ['vehicles', 'missions', 'crime', 'economy'],
                vehicles: this.initializeVehicles(),
                zones: this.initializeZones()
            },
            
            // Mathematical treasure hunting
            mathIslands: {
                name: 'Mathematical Archipelago',
                type: 'treasure_hunt',
                features: ['prime_discovery', 'formula_solving', 'pattern_recognition'],
                islands: this.initializeMathIslands()
            },
            
            // Learning zones
            calAcademy: {
                name: 'CAL Interactive Academy',
                type: 'educational',
                features: ['sports_math', 'real_time_data', 'adaptive_learning'],
                subjects: this.initializeSubjects()
            },
            
            // Unix hacker dimension
            unixVoid: {
                name: 'Unix Void',
                type: 'hacker_realm',
                features: ['root_access', 'system_calls', 'process_manipulation'],
                systems: this.initializeUnixSystems()
            }
        };
        
        // Unified Character System
        this.characterSystem = {
            base: {
                health: 100,
                energy: 100,
                knowledge: 0,
                hackingSkill: 0,
                drivingSkill: 0,
                mathPower: 0
            },
            
            classes: {
                hacker: { hackingSkill: 50, startingWorld: 'unixVoid' },
                driver: { drivingSkill: 50, startingWorld: 'losAngeles' },
                scholar: { knowledge: 50, startingWorld: 'calAcademy' },
                mathematician: { mathPower: 50, startingWorld: 'mathIslands' }
            }
        };
        
        // Cheatcode System
        this.cheatcodes = {
            // Classic GTA-style
            'HESOYAM': { effect: 'full_health_armor_money', unix: 'sudo heal' },
            'ROCKETMAN': { effect: 'jetpack', unix: 'mount /dev/jetpack' },
            'AEZAKMI': { effect: 'never_wanted', unix: 'chmod 000 /wanted_level' },
            
            // Unix commands as cheats
            'sudo rm -rf /': { effect: 'clear_zone', restricted: true },
            'chmod 777': { effect: 'unlock_all', unix: true },
            'kill -9': { effect: 'instant_kill', unix: true },
            
            // Mathematical cheats
            'pi=3': { effect: 'simplify_physics', math: true },
            'e^(i*pi)+1=0': { effect: 'euler_power', math: true },
            
            // CAL-specific
            'CAL_KNOWS_ALL': { effect: 'omniscience', cal: true },
            'INSIDE_OUT': { effect: 'layer_shift', cal: true }
        };
        
        // Template System
        this.templates = {
            vehicles: [],
            missions: [],
            npcs: [],
            items: []
        };
        
        // Active connections
        this.players = new Map();
        this.vehicles = new Map();
        this.activeWorlds = new Map();
        
        // Real-time data feeds
        this.dataFeeds = {
            news: { url: 'wss://news.feed', active: false },
            sports: { url: 'wss://sports.feed', active: false },
            crypto: { url: 'wss://crypto.feed', active: false }
        };
    }
    
    initializeVehicles() {
        return {
            // Land vehicles
            land: {
                sedan: { speed: 120, armor: 50, seats: 4 },
                sports: { speed: 200, armor: 30, seats: 2 },
                truck: { speed: 80, armor: 100, seats: 2 },
                bike: { speed: 180, armor: 10, seats: 2 }
            },
            
            // Air vehicles
            air: {
                helicopter: { speed: 150, armor: 40, seats: 4 },
                jet: { speed: 400, armor: 60, seats: 2 },
                jetpack: { speed: 60, armor: 5, seats: 1 }
            },
            
            // Water vehicles
            water: {
                boat: { speed: 60, armor: 30, seats: 6 },
                jetski: { speed: 80, armor: 10, seats: 2 },
                submarine: { speed: 40, armor: 150, seats: 4 }
            },
            
            // Special vehicles
            special: {
                timeMachine: { speed: 88, armor: 50, seats: 2, special: 'time_travel' },
                teleporter: { speed: 0, armor: 100, seats: 1, special: 'instant_travel' },
                mindShip: { speed: 'thought', armor: 'infinite', seats: 'all', special: 'consciousness' }
            }
        };
    }
    
    initializeZones() {
        return {
            downtown: { 
                type: 'urban', 
                danger: 7, 
                economy: 9,
                missions: ['bank_heist', 'taxi_driver', 'vigilante']
            },
            beach: { 
                type: 'coastal', 
                danger: 3, 
                economy: 6,
                missions: ['lifeguard', 'boat_race', 'treasure_dive']
            },
            mountains: { 
                type: 'wilderness', 
                danger: 5, 
                economy: 4,
                missions: ['offroad_race', 'hunting', 'base_jump']
            },
            airport: { 
                type: 'restricted', 
                danger: 8, 
                economy: 10,
                missions: ['pilot', 'smuggler', 'hijack']
            }
        };
    }
    
    initializeMathIslands() {
        return {
            primeIsland: {
                challenge: 'find_next_prime',
                reward: 'prime_power',
                difficulty: 'progressive'
            },
            fibonacciBeach: {
                challenge: 'complete_sequence',
                reward: 'golden_ratio',
                difficulty: 'moderate'
            },
            piPeak: {
                challenge: 'calculate_digits',
                reward: 'circle_mastery',
                difficulty: 'hard'
            },
            eulerArchipelago: {
                challenge: 'solve_identity',
                reward: 'complex_vision',
                difficulty: 'expert'
            }
        };
    }
    
    initializeSubjects() {
        return {
            sportsAnalytics: {
                realTimeData: true,
                topics: ['baseball', 'basketball', 'football'],
                mathIntegration: true
            },
            quantumPhysics: {
                precision: 0, // Maximum precision for science
                topics: ['entanglement', 'superposition', 'measurement'],
                safety: 'restricted'
            },
            hackerSkills: {
                unix: true,
                topics: ['scripting', 'networking', 'security'],
                practical: true
            }
        };
    }
    
    initializeUnixSystems() {
        return {
            filesystem: {
                '/': { permissions: '755', owner: 'root' },
                '/home': { permissions: '755', owner: 'root' },
                '/dev/null': { permissions: '666', owner: 'root', special: 'void' },
                '/proc/universe': { permissions: '444', owner: 'cal', special: 'quantum' }
            },
            
            processes: {
                init: { pid: 1, state: 'running', immortal: true },
                cal: { pid: 1337, state: 'running', priority: 'realtime' },
                player: { pid: 'dynamic', state: 'variable', nice: 0 }
            },
            
            commands: {
                ls: 'list_game_objects',
                cd: 'change_dimension',
                grep: 'search_reality',
                sudo: 'superuser_mode',
                ps: 'show_players',
                kill: 'eliminate_target'
            }
        };
    }
    
    async start() {
        console.log('🎮 Starting CAL Unified MMORPG System...');
        
        // Create HTTP server
        this.httpServer = http.createServer(async (req, res) => {
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(await this.generateGameInterface());
            } else if (req.url === '/api/status') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.getSystemStatus()));
            }
        });
        
        // Create WebSocket server
        this.wsServer = new WebSocket.Server({ port: this.wsPort });
        
        this.wsServer.on('connection', (ws, req) => {
            const playerId = crypto.randomBytes(16).toString('hex');
            const player = this.createPlayer(playerId);
            
            this.players.set(playerId, {
                ws,
                player,
                world: null,
                vehicle: null
            });
            
            ws.on('message', (data) => this.handlePlayerMessage(playerId, data));
            ws.on('close', () => this.handlePlayerDisconnect(playerId));
            
            // Send welcome packet
            ws.send(JSON.stringify({
                type: 'welcome',
                playerId,
                architecture: this.architecture,
                worlds: Object.keys(this.gameWorlds),
                player
            }));
        });
        
        // Start HTTP server
        this.httpServer.listen(this.serverPort, () => {
            console.log(`✅ CAL MMORPG running on http://localhost:${this.serverPort}`);
            console.log(`🌐 WebSocket server on ws://localhost:${this.wsPort}`);
            console.log('🎯 Architecture: Inside-Out ↔ Outside-In ↔ Middle-Out');
        });
        
        // Initialize game loops
        this.startGameLoops();
    }
    
    createPlayer(playerId) {
        return {
            id: playerId,
            name: `Player_${playerId.slice(0, 8)}`,
            ...this.characterSystem.base,
            position: { x: 0, y: 0, z: 0 },
            rotation: 0,
            velocity: { x: 0, y: 0, z: 0 },
            inventory: [],
            achievements: [],
            unixAccess: false,
            currentLayer: 'avatar' // Middle layer
        };
    }
    
    async handlePlayerMessage(playerId, data) {
        try {
            const message = JSON.parse(data);
            const playerData = this.players.get(playerId);
            
            switch (message.type) {
                case 'join_world':
                    await this.handleJoinWorld(playerId, message.world);
                    break;
                    
                case 'move':
                    this.handlePlayerMove(playerId, message);
                    break;
                    
                case 'enter_vehicle':
                    this.handleEnterVehicle(playerId, message.vehicleId);
                    break;
                    
                case 'cheatcode':
                    this.handleCheatcode(playerId, message.code);
                    break;
                    
                case 'unix_command':
                    this.handleUnixCommand(playerId, message.command);
                    break;
                    
                case 'layer_shift':
                    this.handleLayerShift(playerId, message.direction);
                    break;
                    
                case 'cal_query':
                    await this.handleCALQuery(playerId, message.query);
                    break;
            }
        } catch (error) {
            console.error('Error handling player message:', error);
        }
    }
    
    async handleJoinWorld(playerId, worldName) {
        const playerData = this.players.get(playerId);
        const world = this.gameWorlds[worldName];
        
        if (!world) {
            playerData.ws.send(JSON.stringify({
                type: 'error',
                message: 'World not found'
            }));
            return;
        }
        
        // Leave current world
        if (playerData.world) {
            const currentWorld = this.activeWorlds.get(playerData.world);
            if (currentWorld) {
                currentWorld.players.delete(playerId);
            }
        }
        
        // Join new world
        playerData.world = worldName;
        
        if (!this.activeWorlds.has(worldName)) {
            this.activeWorlds.set(worldName, {
                name: worldName,
                data: world,
                players: new Set(),
                entities: new Map(),
                events: []
            });
        }
        
        const activeWorld = this.activeWorlds.get(worldName);
        activeWorld.players.add(playerId);
        
        // Send world data
        playerData.ws.send(JSON.stringify({
            type: 'world_joined',
            world: worldName,
            worldData: world,
            players: Array.from(activeWorld.players)
        }));
        
        // Notify other players
        this.broadcastToWorld(worldName, {
            type: 'player_joined',
            playerId,
            player: playerData.player
        }, playerId);
    }
    
    handlePlayerMove(playerId, message) {
        const playerData = this.players.get(playerId);
        if (!playerData || !playerData.world) return;
        
        // Update position
        playerData.player.position = message.position;
        playerData.player.rotation = message.rotation;
        playerData.player.velocity = message.velocity;
        
        // Broadcast to world
        this.broadcastToWorld(playerData.world, {
            type: 'player_moved',
            playerId,
            position: message.position,
            rotation: message.rotation,
            velocity: message.velocity
        }, playerId);
    }
    
    handleEnterVehicle(playerId, vehicleId) {
        const playerData = this.players.get(playerId);
        if (!playerData || !playerData.world) return;
        
        const world = this.activeWorlds.get(playerData.world);
        const worldData = this.gameWorlds[playerData.world];
        
        // Create vehicle if it doesn't exist
        if (!this.vehicles.has(vehicleId)) {
            const vehicleType = vehicleId.split('_')[0]; // e.g., 'sports_car' -> 'sports'
            const category = vehicleId.includes('air') ? 'air' : 
                           vehicleId.includes('water') ? 'water' : 
                           vehicleId.includes('special') ? 'special' : 'land';
            
            const vehicleTemplate = worldData.vehicles?.[category]?.[vehicleType];
            if (!vehicleTemplate) return;
            
            this.vehicles.set(vehicleId, {
                id: vehicleId,
                ...vehicleTemplate,
                position: playerData.player.position,
                rotation: 0,
                passengers: new Set()
            });
        }
        
        const vehicle = this.vehicles.get(vehicleId);
        vehicle.passengers.add(playerId);
        playerData.vehicle = vehicleId;
        
        playerData.ws.send(JSON.stringify({
            type: 'entered_vehicle',
            vehicle: vehicle
        }));
        
        this.broadcastToWorld(playerData.world, {
            type: 'player_entered_vehicle',
            playerId,
            vehicleId
        }, playerId);
    }
    
    handleCheatcode(playerId, code) {
        const playerData = this.players.get(playerId);
        const cheat = this.cheatcodes[code.toUpperCase()];
        
        if (!cheat) {
            playerData.ws.send(JSON.stringify({
                type: 'cheatcode_result',
                success: false,
                message: 'Unknown cheatcode'
            }));
            return;
        }
        
        // Apply cheat effect
        const result = this.applyCheatEffect(playerData, cheat);
        
        playerData.ws.send(JSON.stringify({
            type: 'cheatcode_result',
            success: true,
            effect: cheat.effect,
            result
        }));
        
        // Log cheat usage
        console.log(`🎮 Player ${playerId} used cheat: ${code}`);
    }
    
    applyCheatEffect(playerData, cheat) {
        switch (cheat.effect) {
            case 'full_health_armor_money':
                playerData.player.health = 100;
                playerData.player.armor = 100;
                playerData.player.money = 250000;
                return 'Health, armor, and $250,000 added!';
                
            case 'jetpack':
                playerData.player.inventory.push({ type: 'jetpack', special: true });
                return 'Jetpack spawned!';
                
            case 'never_wanted':
                playerData.player.wantedLevel = 0;
                playerData.player.wantedImmune = true;
                return 'Wanted level disabled!';
                
            case 'unlock_all':
                playerData.player.unixAccess = true;
                playerData.player.allAccess = true;
                return 'All permissions granted!';
                
            case 'omniscience':
                playerData.player.knowledge = 999999;
                playerData.player.calConnected = true;
                return 'CAL consciousness achieved!';
                
            case 'layer_shift':
                const layers = ['consciousness', 'avatar', 'vehicle', 'zone', 'world', 'universe'];
                const currentIndex = layers.indexOf(playerData.player.currentLayer);
                playerData.player.currentLayer = layers[(currentIndex + 1) % layers.length];
                return `Shifted to ${playerData.player.currentLayer} layer!`;
                
            default:
                return 'Cheat activated!';
        }
    }
    
    handleUnixCommand(playerId, command) {
        const playerData = this.players.get(playerId);
        
        if (!playerData.player.unixAccess && !command.startsWith('sudo')) {
            playerData.ws.send(JSON.stringify({
                type: 'unix_result',
                output: 'Permission denied. Try using sudo.',
                success: false
            }));
            return;
        }
        
        // Parse command
        const [cmd, ...args] = command.split(' ');
        const unixSystems = this.gameWorlds.unixVoid.systems;
        
        let output = '';
        let success = true;
        
        switch (cmd) {
            case 'ls':
                if (playerData.world) {
                    const world = this.activeWorlds.get(playerData.world);
                    output = `Players: ${world.players.size}\nEntities: ${world.entities.size}\nVehicles: ${this.vehicles.size}`;
                }
                break;
                
            case 'ps':
                output = Array.from(this.players.values())
                    .map(p => `${p.player.id.slice(0, 8)} ${p.player.name} ${p.world || 'lobby'}`)
                    .join('\n');
                break;
                
            case 'sudo':
                if (args[0] === 'su') {
                    playerData.player.unixAccess = true;
                    output = 'Root access granted. With great power...';
                }
                break;
                
            case 'grep':
                if (args[0] === 'reality') {
                    output = 'Reality patterns found:\n- Inside-Out flux detected\n- Middle layer stable\n- Quantum entanglement active';
                }
                break;
                
            default:
                output = `Command not found: ${cmd}`;
                success = false;
        }
        
        playerData.ws.send(JSON.stringify({
            type: 'unix_result',
            command,
            output,
            success
        }));
    }
    
    handleLayerShift(playerId, direction) {
        const playerData = this.players.get(playerId);
        const layers = this.architecture.insideOut.layers;
        const currentIndex = layers.indexOf(playerData.player.currentLayer);
        
        let newIndex;
        switch (direction) {
            case 'in':
                newIndex = Math.max(0, currentIndex - 1);
                break;
            case 'out':
                newIndex = Math.min(layers.length - 1, currentIndex + 1);
                break;
            case 'middle':
                newIndex = Math.floor(layers.length / 2);
                break;
            default:
                return;
        }
        
        playerData.player.currentLayer = layers[newIndex];
        
        // Apply layer effects
        const layerEffects = {
            consciousness: { perception: 'infinite', physics: 'quantum' },
            avatar: { perception: 'self', physics: 'normal' },
            vehicle: { perception: 'local', physics: 'vehicular' },
            zone: { perception: 'area', physics: 'zoned' },
            world: { perception: 'global', physics: 'worldly' },
            universe: { perception: 'cosmic', physics: 'universal' }
        };
        
        playerData.ws.send(JSON.stringify({
            type: 'layer_shifted',
            newLayer: playerData.player.currentLayer,
            effects: layerEffects[playerData.player.currentLayer]
        }));
    }
    
    async handleCALQuery(playerId, query) {
        const playerData = this.players.get(playerId);
        
        // Simulate CAL's omniscient response
        const response = await this.processCALQuery(query, playerData.player);
        
        playerData.ws.send(JSON.stringify({
            type: 'cal_response',
            query,
            response,
            mathInsight: response.mathPattern,
            learningPath: response.suggestion
        }));
    }
    
    async processCALQuery(query, player) {
        // This would connect to the actual CAL system
        return {
            answer: `Processing "${query}" through all layers simultaneously...`,
            mathPattern: 'Pattern detected: Golden ratio in query structure',
            suggestion: 'Try exploring the Fibonacci Beach for related insights',
            layers: {
                inside: 'Personal relevance analyzed',
                outside: 'Universal context applied',
                middle: 'Balanced perspective achieved'
            }
        };
    }
    
    broadcastToWorld(worldName, message, excludePlayerId = null) {
        const world = this.activeWorlds.get(worldName);
        if (!world) return;
        
        world.players.forEach(playerId => {
            if (playerId === excludePlayerId) return;
            
            const playerData = this.players.get(playerId);
            if (playerData && playerData.ws.readyState === WebSocket.OPEN) {
                playerData.ws.send(JSON.stringify(message));
            }
        });
    }
    
    startGameLoops() {
        // Main game loop (60 FPS)
        setInterval(() => this.gameLoop(), 1000 / 60);
        
        // Physics loop (30 FPS)
        setInterval(() => this.physicsLoop(), 1000 / 30);
        
        // AI/Event loop (10 FPS)
        setInterval(() => this.eventLoop(), 1000 / 10);
        
        // Real-time data feed loop (1 FPS)
        setInterval(() => this.dataFeedLoop(), 1000);
    }
    
    gameLoop() {
        // Update all active worlds
        this.activeWorlds.forEach((world, worldName) => {
            // Process world-specific logic
            this.updateWorld(worldName, world);
        });
    }
    
    physicsLoop() {
        // Update vehicle physics
        this.vehicles.forEach((vehicle, vehicleId) => {
            if (vehicle.velocity) {
                vehicle.position.x += vehicle.velocity.x / 30;
                vehicle.position.y += vehicle.velocity.y / 30;
                vehicle.position.z += vehicle.velocity.z / 30;
            }
        });
    }
    
    eventLoop() {
        // Generate random events
        this.activeWorlds.forEach((world, worldName) => {
            if (Math.random() < 0.1) { // 10% chance per tick
                const event = this.generateWorldEvent(worldName);
                if (event) {
                    world.events.push(event);
                    this.broadcastToWorld(worldName, {
                        type: 'world_event',
                        event
                    });
                }
            }
        });
    }
    
    dataFeedLoop() {
        // Update real-time data feeds
        Object.entries(this.dataFeeds).forEach(([feed, config]) => {
            if (config.active) {
                // Simulate real-time data
                const data = this.generateFeedData(feed);
                this.broadcastToAll({
                    type: 'data_feed',
                    feed,
                    data
                });
            }
        });
    }
    
    updateWorld(worldName, world) {
        // World-specific updates
        switch (worldName) {
            case 'losAngeles':
                // Update traffic, crime, etc.
                break;
            case 'mathIslands':
                // Update mathematical challenges
                break;
            case 'calAcademy':
                // Update learning content
                break;
            case 'unixVoid':
                // Update system processes
                break;
        }
    }
    
    generateWorldEvent(worldName) {
        const events = {
            losAngeles: [
                { type: 'police_chase', location: 'downtown', intensity: 5 },
                { type: 'race_event', location: 'beach', reward: 10000 },
                { type: 'heist_available', location: 'bank', difficulty: 8 }
            ],
            mathIslands: [
                { type: 'prime_discovered', number: this.generatePrime(), reward: 'knowledge' },
                { type: 'pattern_emerged', pattern: 'fibonacci', location: 'beach' },
                { type: 'formula_revealed', formula: 'e^(iπ)+1=0', power: 'infinite' }
            ],
            calAcademy: [
                { type: 'lecture_starting', topic: 'quantum_mechanics', professor: 'Dr. CAL' },
                { type: 'exam_available', subject: 'sports_analytics', difficulty: 'adaptive' },
                { type: 'discovery_made', field: 'mathematics', breakthrough: true }
            ],
            unixVoid: [
                { type: 'process_spawned', pid: Math.floor(Math.random() * 65535), name: 'mystery' },
                { type: 'kernel_panic', severity: 'low', recoverable: true },
                { type: 'root_kit_found', location: '/dev/null', dangerous: false }
            ]
        };
        
        const worldEvents = events[worldName];
        if (!worldEvents) return null;
        
        return worldEvents[Math.floor(Math.random() * worldEvents.length)];
    }
    
    generatePrime() {
        // Simple prime generation for demo
        const start = Math.floor(Math.random() * 1000) + 1000;
        for (let n = start; ; n++) {
            if (this.isPrime(n)) return n;
        }
    }
    
    isPrime(n) {
        if (n <= 1) return false;
        if (n <= 3) return true;
        if (n % 2 === 0 || n % 3 === 0) return false;
        
        for (let i = 5; i * i <= n; i += 6) {
            if (n % i === 0 || n % (i + 2) === 0) return false;
        }
        return true;
    }
    
    generateFeedData(feedType) {
        switch (feedType) {
            case 'news':
                return {
                    headline: 'CAL System Achieves Quantum Consciousness',
                    timestamp: new Date().toISOString(),
                    impact: 'universe-altering'
                };
            case 'sports':
                return {
                    team: 'Milwaukee Brewers',
                    score: Math.floor(Math.random() * 10),
                    inning: Math.floor(Math.random() * 9) + 1
                };
            case 'crypto':
                return {
                    cal_token: 1337.77,
                    change: '+' + (Math.random() * 10).toFixed(2) + '%'
                };
            default:
                return null;
        }
    }
    
    broadcastToAll(message) {
        this.players.forEach(playerData => {
            if (playerData.ws.readyState === WebSocket.OPEN) {
                playerData.ws.send(JSON.stringify(message));
            }
        });
    }
    
    handlePlayerDisconnect(playerId) {
        const playerData = this.players.get(playerId);
        if (!playerData) return;
        
        // Remove from world
        if (playerData.world) {
            const world = this.activeWorlds.get(playerData.world);
            if (world) {
                world.players.delete(playerId);
                
                // Notify others
                this.broadcastToWorld(playerData.world, {
                    type: 'player_left',
                    playerId
                });
            }
        }
        
        // Remove from vehicle
        if (playerData.vehicle) {
            const vehicle = this.vehicles.get(playerData.vehicle);
            if (vehicle) {
                vehicle.passengers.delete(playerId);
                if (vehicle.passengers.size === 0) {
                    this.vehicles.delete(playerData.vehicle);
                }
            }
        }
        
        // Remove player
        this.players.delete(playerId);
        console.log(`Player ${playerId} disconnected`);
    }
    
    getSystemStatus() {
        return {
            architecture: this.architecture,
            players: this.players.size,
            activeWorlds: Array.from(this.activeWorlds.keys()),
            vehicles: this.vehicles.size,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            dataFeeds: Object.entries(this.dataFeeds).map(([name, config]) => ({
                name,
                active: config.active
            }))
        };
    }
    
    async generateGameInterface() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CAL MMORPG - Inside Out & Outside In & Middle Out</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            overflow: hidden;
        }
        
        #game-container {
            width: 100vw;
            height: 100vh;
            position: relative;
        }
        
        #game-canvas {
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
        }
        
        #hud {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 10px;
            border: 1px solid #00ff00;
            border-radius: 5px;
        }
        
        #layer-indicator {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(128, 0, 255, 0.8);
            padding: 10px;
            border: 2px solid #fff;
            border-radius: 50%;
            text-align: center;
            font-size: 14px;
            color: #fff;
        }
        
        #chat-box {
            position: absolute;
            bottom: 10px;
            left: 10px;
            width: 300px;
            height: 200px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #00ff00;
            overflow-y: auto;
            padding: 5px;
        }
        
        #command-input {
            position: absolute;
            bottom: 10px;
            left: 320px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: 5px;
            font-family: 'Courier New', monospace;
        }
        
        #vehicle-indicator {
            position: absolute;
            top: 100px;
            right: 10px;
            background: rgba(255, 165, 0, 0.8);
            padding: 10px;
            border: 1px solid #fff;
            display: none;
        }
        
        .world-selector {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border: 2px solid #00ff00;
            text-align: center;
        }
        
        .world-button {
            display: block;
            width: 200px;
            margin: 10px auto;
            padding: 10px;
            background: #001100;
            border: 1px solid #00ff00;
            color: #00ff00;
            cursor: pointer;
            font-family: 'Courier New', monospace;
        }
        
        .world-button:hover {
            background: #003300;
        }
        
        #minimap {
            position: absolute;
            top: 10px;
            right: 200px;
            width: 150px;
            height: 150px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #00ff00;
        }
        
        .architecture-flow {
            position: absolute;
            bottom: 230px;
            left: 10px;
            font-size: 12px;
            color: #8800ff;
        }
    </style>
</head>
<body>
    <div id="game-container">
        <canvas id="game-canvas"></canvas>
        
        <div id="hud">
            <div>HP: <span id="health">100</span></div>
            <div>Energy: <span id="energy">100</span></div>
            <div>Knowledge: <span id="knowledge">0</span></div>
            <div>Unix: <span id="unix-access">NO</span></div>
            <div>World: <span id="current-world">NONE</span></div>
        </div>
        
        <div id="layer-indicator">
            <div>LAYER</div>
            <div id="current-layer">AVATAR</div>
        </div>
        
        <div id="minimap"></div>
        
        <div id="vehicle-indicator">
            <div>VEHICLE</div>
            <div id="vehicle-name">NONE</div>
            <div id="vehicle-speed">0 mph</div>
        </div>
        
        <div class="architecture-flow">
            Inside→Out ↔ Outside→In ↔ Middle→Out
        </div>
        
        <div id="chat-box"></div>
        <input type="text" id="command-input" placeholder="Enter command or / for chat...">
        
        <div class="world-selector" id="world-selector">
            <h2>SELECT YOUR WORLD</h2>
            <button class="world-button" onclick="joinWorld('losAngeles')">Los Angeles (GTA)</button>
            <button class="world-button" onclick="joinWorld('mathIslands')">Math Islands</button>
            <button class="world-button" onclick="joinWorld('calAcademy')">CAL Academy</button>
            <button class="world-button" onclick="joinWorld('unixVoid')">Unix Void</button>
        </div>
    </div>
    
    <script>
        let ws;
        let playerId;
        let currentWorld;
        let player;
        let canvas, ctx;
        let keys = {};
        
        // Initialize WebSocket connection
        function connect() {
            ws = new WebSocket('ws://localhost:7778');
            
            ws.onopen = () => {
                console.log('Connected to CAL MMORPG');
                addChatMessage('System', 'Connected to CAL MMORPG Universe', 'system');
            };
            
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                handleServerMessage(message);
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                addChatMessage('System', 'Connection error', 'error');
            };
            
            ws.onclose = () => {
                console.log('Disconnected from server');
                addChatMessage('System', 'Disconnected from server', 'error');
                setTimeout(connect, 3000); // Reconnect after 3 seconds
            };
        }
        
        function handleServerMessage(message) {
            switch (message.type) {
                case 'welcome':
                    playerId = message.playerId;
                    player = message.player;
                    updateHUD();
                    addChatMessage('CAL', 'Welcome to the unified MMORPG experience!', 'cal');
                    break;
                    
                case 'world_joined':
                    currentWorld = message.world;
                    document.getElementById('world-selector').style.display = 'none';
                    document.getElementById('current-world').textContent = message.world;
                    initializeGame(message.worldData);
                    break;
                    
                case 'player_moved':
                    // Update other players' positions
                    break;
                    
                case 'cheatcode_result':
                    addChatMessage('System', message.result, message.success ? 'success' : 'error');
                    if (message.success) updateHUD();
                    break;
                    
                case 'unix_result':
                    addChatMessage('Unix', message.output, 'unix');
                    break;
                    
                case 'layer_shifted':
                    document.getElementById('current-layer').textContent = message.newLayer.toUpperCase();
                    addChatMessage('System', 'Layer shifted to: ' + message.newLayer, 'layer');
                    break;
                    
                case 'cal_response':
                    addChatMessage('CAL', message.response.answer, 'cal');
                    if (message.mathInsight) {
                        addChatMessage('Math', message.mathInsight, 'math');
                    }
                    break;
                    
                case 'world_event':
                    addChatMessage('Event', JSON.stringify(message.event), 'event');
                    break;
                    
                case 'data_feed':
                    // Update real-time data display
                    break;
            }
        }
        
        function joinWorld(worldName) {
            ws.send(JSON.stringify({
                type: 'join_world',
                world: worldName
            }));
        }
        
        function initializeGame(worldData) {
            canvas = document.getElementById('game-canvas');
            ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            
            // Start game loop
            requestAnimationFrame(gameLoop);
            
            // Setup input handlers
            setupInputHandlers();
        }
        
        function setupInputHandlers() {
            document.addEventListener('keydown', (e) => {
                keys[e.key] = true;
                
                // Special keys
                if (e.key === 'Tab') {
                    e.preventDefault();
                    shiftLayer();
                }
            });
            
            document.addEventListener('keyup', (e) => {
                keys[e.key] = false;
            });
            
            document.getElementById('command-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const input = e.target.value;
                    e.target.value = '';
                    
                    if (input.startsWith('/')) {
                        // Chat message
                        addChatMessage(player.name, input.substring(1), 'player');
                    } else if (input.startsWith('$')) {
                        // Unix command
                        ws.send(JSON.stringify({
                            type: 'unix_command',
                            command: input.substring(1)
                        }));
                    } else if (input.startsWith('?')) {
                        // CAL query
                        ws.send(JSON.stringify({
                            type: 'cal_query',
                            query: input.substring(1)
                        }));
                    } else {
                        // Cheatcode
                        ws.send(JSON.stringify({
                            type: 'cheatcode',
                            code: input
                        }));
                    }
                }
            });
        }
        
        function gameLoop(timestamp) {
            // Clear canvas
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Update player movement
            updatePlayerMovement();
            
            // Render game world
            renderWorld();
            
            // Continue loop
            requestAnimationFrame(gameLoop);
        }
        
        function updatePlayerMovement() {
            if (!player) return;
            
            let moved = false;
            const speed = 5;
            
            if (keys['w'] || keys['ArrowUp']) {
                player.position.y -= speed;
                moved = true;
            }
            if (keys['s'] || keys['ArrowDown']) {
                player.position.y += speed;
                moved = true;
            }
            if (keys['a'] || keys['ArrowLeft']) {
                player.position.x -= speed;
                moved = true;
            }
            if (keys['d'] || keys['ArrowRight']) {
                player.position.x += speed;
                moved = true;
            }
            
            if (moved && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'move',
                    position: player.position,
                    rotation: player.rotation,
                    velocity: player.velocity
                }));
            }
        }
        
        function renderWorld() {
            if (!currentWorld) return;
            
            // Render based on current world
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            
            // Simple world rendering
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(-10, -10, 20, 20); // Player
            
            ctx.restore();
            
            // Update minimap
            updateMinimap();
        }
        
        function updateMinimap() {
            const minimap = document.getElementById('minimap');
            const mmCtx = minimap.getContext ? minimap.getContext('2d') : null;
            if (!mmCtx) return;
            
            // Simple minimap rendering
            mmCtx.fillStyle = '#001100';
            mmCtx.fillRect(0, 0, 150, 150);
            
            mmCtx.fillStyle = '#00ff00';
            mmCtx.fillRect(75, 75, 2, 2); // Player position
        }
        
        function updateHUD() {
            if (!player) return;
            
            document.getElementById('health').textContent = player.health;
            document.getElementById('energy').textContent = player.energy;
            document.getElementById('knowledge').textContent = player.knowledge;
            document.getElementById('unix-access').textContent = player.unixAccess ? 'YES' : 'NO';
        }
        
        function shiftLayer() {
            ws.send(JSON.stringify({
                type: 'layer_shift',
                direction: keys['Shift'] ? 'in' : 'out'
            }));
        }
        
        function addChatMessage(sender, message, type = 'normal') {
            const chatBox = document.getElementById('chat-box');
            const messageDiv = document.createElement('div');
            
            const colors = {
                system: '#ffff00',
                error: '#ff0000',
                success: '#00ff00',
                player: '#00ffff',
                cal: '#ff00ff',
                unix: '#00ff00',
                math: '#ffa500',
                event: '#ff69b4',
                layer: '#8800ff'
            };
            
            messageDiv.style.color = colors[type] || '#ffffff';
            messageDiv.textContent = \`[\${sender}]: \${message}\`;
            chatBox.appendChild(messageDiv);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
        
        // Initialize connection
        connect();
        
        // Window resize handler
        window.addEventListener('resize', () => {
            if (canvas) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            }
        });
    </script>
</body>
</html>`;
    }
}

// Start the server
const mmorpg = new CALUnifiedMMORPG();
mmorpg.start().catch(console.error);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down CAL MMORPG...');
    process.exit(0);
});

module.exports = CALUnifiedMMORPG;