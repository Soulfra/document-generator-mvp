#!/usr/bin/env node

/**
 * 🌐🎮 POLYGON WORLD QUERY API
 * 
 * Unified orchestration API for querying and scaling polygon companion worlds
 * Provides REST/GraphQL endpoints for developers to build and manage game instances
 * Integrates with all existing systems for true multi-world scalability
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const crypto = require('crypto');
const cors = require('cors');

console.log(`
🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮
🎮 POLYGON WORLD QUERY API 🎮
🌐 Orchestration for Scaled Worlds 🌐
🎮 Developer-Friendly 1337 Endpoints 🎮
🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮🌐🎮
`);

class PolygonWorldQueryAPI {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 1337; // 1337 port for developers
        
        // World management
        this.worlds = new Map();
        this.worldInstances = new Map();
        this.worldTemplates = new Map();
        this.developerSessions = new Map();
        
        // System connections
        this.systemConnections = {
            polygonalCompanion: { url: 'http://localhost:9999', ws: 'ws://localhost:9999' },
            luaEngine: { url: 'http://localhost:9998', ws: 'ws://localhost:9998' },
            voxelWorld: { url: 'http://localhost:9996', ws: 'ws://localhost:9996' },
            httpBridge: { url: 'http://localhost:9997', ws: 'ws://localhost:9997' },
            pixelWorld3D: { url: 'http://localhost:9003', ws: 'ws://localhost:9003' },
            serviceOrchestration: { url: 'http://localhost:3000/api/orchestration' },
            agentOrchestration: { url: 'http://localhost:3000/api/agent-orchestration' }
        };
        
        // Scaling configuration
        this.scalingConfig = {
            maxWorldsPerInstance: 10,
            maxPlayersPerWorld: 100,
            maxCompanionsPerWorld: 50,
            autoScaleThreshold: 0.8,
            regionSupport: ['us-east', 'us-west', 'eu-central', 'asia-pacific']
        };
        
        // Developer features
        this.developerFeatures = {
            scriptMarketplace: new Map(),
            worldTemplateStore: new Map(),
            achievementSystem: new Map(),
            leaderboards: new Map()
        };
        
        // Initialize default templates
        this.initializeWorldTemplates();
        
        // GraphQL schema
        this.schema = this.buildGraphQLSchema();
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing Polygon World Query API...');
        
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.static('public'));
        
        // Setup routes
        this.setupRESTEndpoints();
        this.setupGraphQLEndpoint();
        this.setup1337Endpoints();
        this.setupWebSocket();
        
        // Connect to existing systems
        await this.connectToSystems();
        
        // Start server
        this.server.listen(this.port, () => {
            console.log(`🌐 Polygon World Query API running on http://localhost:${this.port}`);
            console.log(`🎮 Developer dashboard: http://localhost:${this.port}/dev`);
            console.log(`💻 1337 endpoints active at /api/1337/*`);
            console.log(`📊 GraphQL playground: http://localhost:${this.port}/graphql`);
        });
    }
    
    initializeWorldTemplates() {
        // Pre-built world templates for quick spawning
        this.worldTemplates.set('starter', {
            name: 'Starter World',
            description: 'Basic world with tutorial NPCs',
            size: { x: 100, y: 50, z: 100 },
            defaultVoxels: [
                { x: 0, y: 0, z: 0, type: 'stone' },
                { x: 0, y: 1, z: 0, type: 'grass' }
            ],
            defaultNPCs: ['ralph', 'alice', 'bob'],
            defaultCompanions: [
                { type: 'scout', name: 'Tutorial Scout' }
            ],
            luaScripts: {
                'welcome': 'show_tooltip("Welcome to your world!", 5.0)'
            }
        });
        
        this.worldTemplates.set('developer', {
            name: 'Developer Sandbox',
            description: 'Advanced world with all features unlocked',
            size: { x: 200, y: 100, z: 200 },
            defaultVoxels: [],
            defaultNPCs: ['ralph', 'alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'cal'],
            defaultCompanions: [
                { type: 'scout', name: 'Dev Scout' },
                { type: 'builder', name: 'Dev Builder' },
                { type: 'mirror', name: 'Dev Mirror' }
            ],
            features: ['unlimited_resources', 'debug_mode', 'api_access'],
            luaScripts: {
                'dev_tools': 'enable_debug_mode(); show_tooltip("Developer mode active", 3.0)'
            }
        });
        
        this.worldTemplates.set('arena', {
            name: 'Battle Arena',
            description: 'PvP-focused world with combat zones',
            size: { x: 150, y: 75, z: 150 },
            zones: [
                { name: 'spawn', safe: true, bounds: { x: [70, 80], y: [0, 10], z: [70, 80] } },
                { name: 'arena', safe: false, bounds: { x: [0, 150], y: [0, 75], z: [0, 150] } }
            ],
            defaultNPCs: ['charlie'], // Security-focused NPC
            features: ['pvp_enabled', 'leaderboards', 'tournaments']
        });
        
        this.worldTemplates.set('creative', {
            name: 'Creative Canvas',
            description: 'Unlimited building resources',
            size: { x: 500, y: 256, z: 500 },
            features: ['infinite_blocks', 'fly_mode', 'instant_build'],
            defaultCompanions: [
                { type: 'builder', name: 'Master Builder', enhanced: true }
            ]
        });
    }
    
    buildGraphQLSchema() {
        return buildSchema(`
            type Query {
                # World queries
                worlds(limit: Int, offset: Int, filter: WorldFilter): [World!]!
                world(id: ID!): World
                worldByName(name: String!): World
                
                # Companion queries
                companions(worldId: ID!): [Companion!]!
                companion(id: ID!): Companion
                
                # NPC queries
                npcs(worldId: ID!): [NPC!]!
                npc(id: ID!): NPC
                
                # Developer queries
                developerStats(developerId: ID!): DeveloperStats
                scriptMarketplace(category: String): [LuaScript!]!
                worldTemplates: [WorldTemplate!]!
                
                # System status
                systemStatus: SystemStatus
                scalingMetrics: ScalingMetrics
            }
            
            type Mutation {
                # World management
                createWorld(input: CreateWorldInput!): World!
                forkWorld(worldId: ID!, name: String!): World!
                deleteWorld(worldId: ID!): Boolean!
                
                # Companion management
                spawnCompanion(worldId: ID!, input: SpawnCompanionInput!): Companion!
                updateCompanion(id: ID!, input: UpdateCompanionInput!): Companion!
                
                # Script injection
                injectLuaScript(worldId: ID!, script: String!, name: String!): ScriptResult!
                
                # Developer actions
                publishScript(script: LuaScriptInput!): LuaScript!
                publishWorldTemplate(template: WorldTemplateInput!): WorldTemplate!
            }
            
            type Subscription {
                worldUpdates(worldId: ID!): WorldUpdate!
                companionUpdates(worldId: ID!): CompanionUpdate!
                developerNotifications(developerId: ID!): DeveloperNotification!
            }
            
            type World {
                id: ID!
                name: String!
                description: String
                template: String
                owner: Developer!
                size: WorldSize!
                playerCount: Int!
                companionCount: Int!
                npcCount: Int!
                voxelCount: Int!
                createdAt: String!
                lastActivity: String!
                features: [String!]!
                status: WorldStatus!
                region: String!
                connections: [WorldConnection!]!
            }
            
            type Companion {
                id: ID!
                worldId: ID!
                type: String!
                name: String!
                polygons: Int!
                position: Position!
                color: String!
                state: String!
                luaScript: String
                owner: Developer
                abilities: [String!]!
                stats: CompanionStats!
            }
            
            type NPC {
                id: ID!
                worldId: ID!
                characterId: String!
                name: String!
                role: String!
                position: Position!
                state: String!
                mood: String!
                lastInteraction: String
            }
            
            type Developer {
                id: ID!
                username: String!
                joinedAt: String!
                worldsCreated: Int!
                scriptsPublished: Int!
                reputation: Int!
                achievements: [Achievement!]!
            }
            
            type Position {
                x: Float!
                y: Float!
                z: Float!
            }
            
            type WorldSize {
                x: Int!
                y: Int!
                z: Int!
            }
            
            type CompanionStats {
                tasksCompleted: Int!
                distanceTraveled: Float!
                voxelsAnalyzed: Int!
                bridgesCrossed: Int!
            }
            
            type SystemStatus {
                polygonalCompanion: ServiceStatus!
                luaEngine: ServiceStatus!
                httpBridge: ServiceStatus!
                voxelWorld: ServiceStatus!
                overallHealth: String!
            }
            
            type ServiceStatus {
                name: String!
                status: String!
                uptime: Int!
                load: Float!
            }
            
            type ScalingMetrics {
                totalWorlds: Int!
                activeWorlds: Int!
                totalPlayers: Int!
                averageLoad: Float!
                autoScaleStatus: String!
                regionLoads: [RegionLoad!]!
            }
            
            type RegionLoad {
                region: String!
                worldCount: Int!
                playerCount: Int!
                load: Float!
            }
            
            type LuaScript {
                id: ID!
                name: String!
                description: String!
                code: String!
                author: Developer!
                downloads: Int!
                rating: Float!
                category: String!
            }
            
            type WorldTemplate {
                id: ID!
                name: String!
                description: String!
                previewImage: String
                author: Developer
                uses: Int!
                features: [String!]!
            }
            
            type Achievement {
                id: ID!
                name: String!
                description: String!
                unlockedAt: String!
                rarity: String!
            }
            
            type DeveloperStats {
                developer: Developer!
                totalWorldTime: Int!
                totalVoxelsPlaced: Int!
                totalCompanionsSpawned: Int!
                mostPopularWorld: World
                mostPopularScript: LuaScript
            }
            
            input CreateWorldInput {
                name: String!
                description: String
                template: String
                size: WorldSizeInput
                features: [String!]
                region: String
            }
            
            input WorldSizeInput {
                x: Int!
                y: Int!
                z: Int!
            }
            
            input SpawnCompanionInput {
                type: String!
                name: String!
                position: PositionInput
                luaScript: String
            }
            
            input PositionInput {
                x: Float!
                y: Float!
                z: Float!
            }
            
            input UpdateCompanionInput {
                name: String
                position: PositionInput
                luaScript: String
                color: String
            }
            
            input LuaScriptInput {
                name: String!
                description: String!
                code: String!
                category: String!
            }
            
            input WorldTemplateInput {
                name: String!
                description: String!
                size: WorldSizeInput!
                defaultVoxels: String!
                defaultNPCs: [String!]!
                features: [String!]!
            }
            
            input WorldFilter {
                owner: ID
                template: String
                minPlayers: Int
                maxPlayers: Int
                features: [String!]
                region: String
            }
            
            type WorldUpdate {
                worldId: ID!
                type: String!
                data: String!
                timestamp: String!
            }
            
            type CompanionUpdate {
                companionId: ID!
                worldId: ID!
                type: String!
                data: String!
                timestamp: String!
            }
            
            type DeveloperNotification {
                id: ID!
                type: String!
                message: String!
                data: String
                timestamp: String!
            }
            
            type ScriptResult {
                success: Boolean!
                output: String
                error: String
            }
            
            type WorldConnection {
                targetWorldId: ID!
                type: String!
                bidirectional: Boolean!
            }
            
            enum WorldStatus {
                ACTIVE
                PAUSED
                MAINTENANCE
                ARCHIVED
            }
        `);
    }
    
    setupRESTEndpoints() {
        // Main dashboard
        this.app.get('/', (req, res) => {
            res.send(this.getDashboardHTML());
        });
        
        // Developer dashboard
        this.app.get('/dev', (req, res) => {
            res.send(this.getDeveloperDashboardHTML());
        });
        
        // World management endpoints
        this.app.get('/api/worlds', (req, res) => {
            const worlds = Array.from(this.worlds.values()).map(world => ({
                id: world.id,
                name: world.name,
                playerCount: world.players?.size || 0,
                companionCount: world.companions?.size || 0,
                status: world.status,
                region: world.region
            }));
            res.json(worlds);
        });
        
        this.app.post('/api/worlds', async (req, res) => {
            try {
                const world = await this.createWorld(req.body);
                res.json(world);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/worlds/:id', (req, res) => {
            const world = this.worlds.get(req.params.id);
            if (!world) {
                return res.status(404).json({ error: 'World not found' });
            }
            res.json(this.getWorldDetails(world));
        });
        
        this.app.delete('/api/worlds/:id', async (req, res) => {
            try {
                await this.deleteWorld(req.params.id);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Companion management
        this.app.get('/api/worlds/:id/companions', (req, res) => {
            const world = this.worlds.get(req.params.id);
            if (!world) {
                return res.status(404).json({ error: 'World not found' });
            }
            res.json(Array.from(world.companions?.values() || []));
        });
        
        this.app.post('/api/worlds/:id/companions', async (req, res) => {
            try {
                const companion = await this.spawnCompanion(req.params.id, req.body);
                res.json(companion);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // System status
        this.app.get('/api/status', async (req, res) => {
            const status = await this.getSystemStatus();
            res.json(status);
        });
        
        // Scaling metrics
        this.app.get('/api/metrics/scaling', (req, res) => {
            res.json(this.getScalingMetrics());
        });
        
        // Script marketplace
        this.app.get('/api/marketplace/scripts', (req, res) => {
            const scripts = Array.from(this.developerFeatures.scriptMarketplace.values());
            res.json(scripts);
        });
        
        this.app.post('/api/marketplace/scripts', (req, res) => {
            const script = this.publishScript(req.body);
            res.json(script);
        });
        
        // World templates
        this.app.get('/api/templates', (req, res) => {
            const templates = Array.from(this.worldTemplates.entries()).map(([id, template]) => ({
                id,
                ...template
            }));
            res.json(templates);
        });
    }
    
    setupGraphQLEndpoint() {
        // GraphQL endpoint with GraphiQL interface
        this.app.use('/graphql', graphqlHTTP({
            schema: this.schema,
            rootValue: this.getGraphQLResolvers(),
            graphiql: true, // Enable GraphiQL interface
            customFormatErrorFn: (error) => ({
                message: error.message,
                locations: error.locations,
                path: error.path,
                extensions: {
                    code: error.originalError?.code || 'INTERNAL_ERROR',
                    timestamp: new Date().toISOString()
                }
            })
        }));
    }
    
    setup1337Endpoints() {
        // Elite developer endpoints (1337 style)
        
        // Fork existing world
        this.app.post('/api/1337/fork-world', async (req, res) => {
            try {
                const { worldId, name, modifications } = req.body;
                const forkedWorld = await this.forkWorld(worldId, name, modifications);
                res.json({
                    status: 'l33t',
                    message: 'World forked successfully',
                    world: forkedWorld,
                    devCred: '+100'
                });
            } catch (error) {
                res.status(500).json({ status: 'n00b', error: error.message });
            }
        });
        
        // Mass spawn entities
        this.app.post('/api/1337/mass-spawn', async (req, res) => {
            try {
                const { worldId, entityType, count, pattern } = req.body;
                const entities = await this.massSpawn(worldId, entityType, count, pattern);
                res.json({
                    status: 'pwned',
                    spawned: entities.length,
                    entities: entities,
                    achievement: count > 100 ? 'SPAWN_MASTER' : null
                });
            } catch (error) {
                res.status(500).json({ status: 'fail', error: error.message });
            }
        });
        
        // Inject advanced Lua scripts
        this.app.post('/api/1337/inject-script', async (req, res) => {
            try {
                const { worldId, script, global } = req.body;
                const result = await this.injectAdvancedScript(worldId, script, global);
                res.json({
                    status: 'haxx0red',
                    result: result,
                    reputation: '+50',
                    unlocked: 'SCRIPT_KIDDIE_ACHIEVEMENT'
                });
            } catch (error) {
                res.status(500).json({ status: 'script_failed', error: error.message });
            }
        });
        
        // World statistics and analytics
        this.app.get('/api/1337/world-stats/:id', async (req, res) => {
            const stats = await this.getAdvancedWorldStats(req.params.id);
            res.json({
                status: 'analyzed',
                stats: stats,
                insights: this.generateInsights(stats),
                rank: this.calculateWorldRank(stats)
            });
        });
        
        // Cross-world wormhole creation
        this.app.post('/api/1337/create-wormhole', async (req, res) => {
            try {
                const { sourceWorldId, targetWorldId, bidirectional } = req.body;
                const wormhole = await this.createWormhole(sourceWorldId, targetWorldId, bidirectional);
                res.json({
                    status: 'quantum_entangled',
                    wormhole: wormhole,
                    achievement: 'DIMENSION_BREAKER'
                });
            } catch (error) {
                res.status(500).json({ status: 'singularity_collapsed', error: error.message });
            }
        });
        
        // Developer leaderboards
        this.app.get('/api/1337/leaderboards/:category', (req, res) => {
            const leaderboard = this.getLeaderboard(req.params.category);
            res.json({
                category: req.params.category,
                leaderboard: leaderboard,
                yourRank: req.headers['x-developer-id'] ? 
                    this.getDeveloperRank(req.headers['x-developer-id'], req.params.category) : null
            });
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            console.log('🔌 New developer connection established');
            
            // Parse connection parameters
            const url = new URL(req.url, `http://localhost:${this.port}`);
            const worldId = url.searchParams.get('worldId');
            const developerId = url.searchParams.get('developerId');
            
            if (worldId) {
                // Subscribe to world updates
                this.subscribeToWorld(ws, worldId);
            }
            
            if (developerId) {
                // Track developer session
                this.developerSessions.set(developerId, { ws, connectedAt: Date.now() });
            }
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                if (developerId) {
                    this.developerSessions.delete(developerId);
                }
            });
        });
    }
    
    async connectToSystems() {
        console.log('🔗 Connecting to existing systems...');
        
        // Test connections to all systems
        for (const [name, config] of Object.entries(this.systemConnections)) {
            try {
                if (config.url.startsWith('http')) {
                    const response = await fetch(`${config.url}/health`).catch(() => null);
                    if (response?.ok) {
                        console.log(`  ✅ Connected to ${name}`);
                    } else {
                        console.log(`  ⚠️ ${name} not responding`);
                    }
                }
            } catch (error) {
                console.log(`  ❌ Failed to connect to ${name}: ${error.message}`);
            }
        }
    }
    
    // World management methods
    async createWorld(options) {
        const worldId = crypto.randomBytes(8).toString('hex');
        const template = this.worldTemplates.get(options.template || 'starter');
        
        const world = {
            id: worldId,
            name: options.name || `World ${worldId}`,
            description: options.description || template.description,
            template: options.template || 'starter',
            owner: options.developerId || 'anonymous',
            size: options.size || template.size,
            players: new Map(),
            companions: new Map(),
            npcs: new Map(),
            voxels: new Map(),
            features: options.features || template.features || [],
            status: 'ACTIVE',
            region: options.region || 'us-east',
            createdAt: Date.now(),
            lastActivity: Date.now(),
            connections: [],
            instance: null
        };
        
        // Create world instance in polygon companion system
        try {
            const instanceResponse = await fetch(`${this.systemConnections.polygonalCompanion.url}/api/world/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    worldId,
                    template: options.template,
                    size: world.size
                })
            });
            
            if (instanceResponse.ok) {
                world.instance = await instanceResponse.json();
            }
        } catch (error) {
            console.error('Failed to create world instance:', error);
        }
        
        // Apply template defaults
        if (template) {
            // Add default voxels
            if (template.defaultVoxels) {
                for (const voxel of template.defaultVoxels) {
                    world.voxels.set(`${voxel.x},${voxel.y},${voxel.z}`, voxel);
                }
            }
            
            // Add default NPCs
            if (template.defaultNPCs) {
                for (const npcId of template.defaultNPCs) {
                    await this.spawnNPC(worldId, npcId);
                }
            }
            
            // Add default companions
            if (template.defaultCompanions) {
                for (const companionData of template.defaultCompanions) {
                    await this.spawnCompanion(worldId, companionData);
                }
            }
            
            // Apply Lua scripts
            if (template.luaScripts) {
                for (const [name, script] of Object.entries(template.luaScripts)) {
                    await this.injectLuaScript(worldId, script, name);
                }
            }
        }
        
        this.worlds.set(worldId, world);
        
        // Broadcast world creation
        this.broadcastToDevelopers({
            type: 'world_created',
            world: this.getWorldDetails(world)
        });
        
        console.log(`🌍 Created world: ${world.name} (${worldId})`);
        return world;
    }
    
    async forkWorld(sourceWorldId, name, modifications = {}) {
        const sourceWorld = this.worlds.get(sourceWorldId);
        if (!sourceWorld) {
            throw new Error('Source world not found');
        }
        
        // Create new world based on source
        const forkedWorld = await this.createWorld({
            name: name || `${sourceWorld.name} (Fork)`,
            description: `Forked from ${sourceWorld.name}`,
            template: sourceWorld.template,
            size: sourceWorld.size,
            features: [...sourceWorld.features, 'forked'],
            developerId: modifications.developerId
        });
        
        // Copy voxels
        if (!modifications.clearVoxels) {
            sourceWorld.voxels.forEach((voxel, key) => {
                forkedWorld.voxels.set(key, { ...voxel });
            });
        }
        
        // Copy companions
        if (!modifications.clearCompanions) {
            for (const companion of sourceWorld.companions.values()) {
                await this.spawnCompanion(forkedWorld.id, {
                    type: companion.type,
                    name: `${companion.name} (Clone)`,
                    position: companion.position
                });
            }
        }
        
        // Apply modifications
        if (modifications.addFeatures) {
            forkedWorld.features.push(...modifications.addFeatures);
        }
        
        if (modifications.luaScripts) {
            for (const [name, script] of Object.entries(modifications.luaScripts)) {
                await this.injectLuaScript(forkedWorld.id, script, name);
            }
        }
        
        return forkedWorld;
    }
    
    async deleteWorld(worldId) {
        const world = this.worlds.get(worldId);
        if (!world) {
            throw new Error('World not found');
        }
        
        // Notify all players
        world.players.forEach(player => {
            if (player.ws) {
                player.ws.send(JSON.stringify({
                    type: 'world_deleted',
                    worldId,
                    message: 'This world has been deleted'
                }));
            }
        });
        
        // Remove from companion system
        try {
            await fetch(`${this.systemConnections.polygonalCompanion.url}/api/world/${worldId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Failed to delete world instance:', error);
        }
        
        this.worlds.delete(worldId);
        console.log(`🗑️ Deleted world: ${worldId}`);
    }
    
    async spawnCompanion(worldId, companionData) {
        const world = this.worlds.get(worldId);
        if (!world) {
            throw new Error('World not found');
        }
        
        const companion = {
            id: crypto.randomBytes(6).toString('hex'),
            worldId,
            type: companionData.type || 'scout',
            name: companionData.name || `Companion ${Date.now()}`,
            position: companionData.position || { x: 0, y: 5, z: 0 },
            polygons: companionData.type === 'builder' ? 4 : 3,
            color: companionData.color || this.getCompanionColor(companionData.type),
            state: 'idle',
            luaScript: companionData.luaScript || null,
            owner: companionData.owner || null,
            abilities: this.getCompanionAbilities(companionData.type),
            stats: {
                tasksCompleted: 0,
                distanceTraveled: 0,
                voxelsAnalyzed: 0,
                bridgesCrossed: 0
            },
            createdAt: Date.now()
        };
        
        world.companions.set(companion.id, companion);
        
        // Create in companion system
        try {
            await fetch(`${this.systemConnections.polygonalCompanion.url}/api/companion/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...companion,
                    worldId
                })
            });
        } catch (error) {
            console.error('Failed to create companion in system:', error);
        }
        
        // Broadcast companion spawn
        this.broadcastToWorld(worldId, {
            type: 'companion_spawned',
            companion
        });
        
        return companion;
    }
    
    async spawnNPC(worldId, characterId) {
        const world = this.worlds.get(worldId);
        if (!world) {
            throw new Error('World not found');
        }
        
        // NPC data based on character system
        const npcTemplates = {
            'ralph': { name: 'Ralph "The Disruptor"', role: 'Primary Executor' },
            'alice': { name: 'Alice "The Connector"', role: 'Pattern Search Specialist' },
            'bob': { name: 'Bob "The Builder"', role: 'Build & Document Specialist' },
            'charlie': { name: 'Charlie "The Shield"', role: 'Security Search Specialist' },
            'diana': { name: 'Diana "The Conductor"', role: 'Orchestration Specialist' },
            'eve': { name: 'Eve "The Archive"', role: 'Knowledge Search Specialist' },
            'frank': { name: 'Frank "The Unity"', role: 'Unity Search Specialist' },
            'cal': { name: 'Cal "The Symbiosis"', role: 'Symbiosis Specialist' }
        };
        
        const template = npcTemplates[characterId];
        if (!template) {
            throw new Error('Unknown NPC character');
        }
        
        const npc = {
            id: `npc_${characterId}_${Date.now()}`,
            worldId,
            characterId,
            name: template.name,
            role: template.role,
            position: this.getNPCSpawnPosition(characterId),
            state: 'idle',
            mood: 'neutral',
            lastInteraction: null
        };
        
        world.npcs.set(npc.id, npc);
        console.log(`🎭 Spawned NPC: ${npc.name} in world ${worldId}`);
        
        return npc;
    }
    
    getNPCSpawnPosition(characterId) {
        const positions = {
            'ralph': { x: 5, y: 5, z: 5 },
            'alice': { x: -5, y: 5, z: 5 },
            'bob': { x: 5, y: 5, z: -5 },
            'charlie': { x: -5, y: 5, z: -5 },
            'diana': { x: 0, y: 8, z: 0 },
            'eve': { x: 8, y: 5, z: 0 },
            'frank': { x: -8, y: 5, z: 0 },
            'cal': { x: 0, y: 5, z: 8 }
        };
        
        return positions[characterId] || { x: 0, y: 5, z: 0 };
    }
    
    getCompanionColor(type) {
        const colors = {
            'scout': '#00ff88',
            'builder': '#ff8800',
            'mirror': '#8800ff'
        };
        return colors[type] || '#888888';
    }
    
    getCompanionAbilities(type) {
        const abilities = {
            'scout': ['exploration', 'scanning', 'pathfinding', 'analysis'],
            'builder': ['construction', 'optimization', 'documentation', 'planning'],
            'mirror': ['replication', 'language_variants', 'domain_variants', 'synchronization']
        };
        return abilities[type] || ['basic_movement'];
    }
    
    async injectLuaScript(worldId, script, name) {
        const world = this.worlds.get(worldId);
        if (!world) {
            throw new Error('World not found');
        }
        
        try {
            // Send to Lua engine
            const response = await fetch(`${this.systemConnections.luaEngine.url}/api/lua/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    script,
                    context: {
                        worldId,
                        worldName: world.name
                    }
                })
            });
            
            const result = await response.json();
            
            // Log script injection
            console.log(`📜 Injected Lua script "${name}" in world ${worldId}`);
            
            return {
                success: result.success,
                output: result.result,
                error: result.error
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async injectAdvancedScript(worldId, script, global = false) {
        if (global) {
            // Inject script globally to all companions in world
            const world = this.worlds.get(worldId);
            if (!world) {
                throw new Error('World not found');
            }
            
            const results = [];
            for (const companion of world.companions.values()) {
                companion.luaScript = script;
                results.push({
                    companionId: companion.id,
                    companionName: companion.name
                });
            }
            
            return {
                type: 'global_injection',
                affectedCompanions: results.length,
                companions: results
            };
        } else {
            // Regular injection
            return await this.injectLuaScript(worldId, script, 'advanced_script');
        }
    }
    
    async massSpawn(worldId, entityType, count, pattern = 'random') {
        const world = this.worlds.get(worldId);
        if (!world) {
            throw new Error('World not found');
        }
        
        const entities = [];
        
        for (let i = 0; i < count; i++) {
            const position = this.calculateSpawnPosition(i, count, pattern, world.size);
            
            if (entityType === 'companion') {
                const companion = await this.spawnCompanion(worldId, {
                    type: ['scout', 'builder', 'mirror'][i % 3],
                    name: `Mass Spawn #${i}`,
                    position
                });
                entities.push(companion);
            } else if (entityType === 'voxel') {
                const voxel = {
                    x: position.x,
                    y: position.y,
                    z: position.z,
                    type: ['stone', 'wood', 'gold'][i % 3]
                };
                world.voxels.set(`${voxel.x},${voxel.y},${voxel.z}`, voxel);
                entities.push(voxel);
            }
        }
        
        return entities;
    }
    
    calculateSpawnPosition(index, total, pattern, worldSize) {
        switch (pattern) {
            case 'grid':
                const gridSize = Math.ceil(Math.sqrt(total));
                return {
                    x: (index % gridSize) * 5 - (gridSize * 2.5),
                    y: 5,
                    z: Math.floor(index / gridSize) * 5 - (gridSize * 2.5)
                };
                
            case 'circle':
                const angle = (index / total) * Math.PI * 2;
                const radius = Math.min(worldSize.x, worldSize.z) / 3;
                return {
                    x: Math.cos(angle) * radius,
                    y: 5,
                    z: Math.sin(angle) * radius
                };
                
            case 'spiral':
                const spiralAngle = index * 0.5;
                const spiralRadius = index * 0.5;
                return {
                    x: Math.cos(spiralAngle) * spiralRadius,
                    y: 5 + (index * 0.1),
                    z: Math.sin(spiralAngle) * spiralRadius
                };
                
            case 'random':
            default:
                return {
                    x: (Math.random() - 0.5) * worldSize.x * 0.8,
                    y: Math.random() * 10 + 5,
                    z: (Math.random() - 0.5) * worldSize.z * 0.8
                };
        }
    }
    
    async createWormhole(sourceWorldId, targetWorldId, bidirectional = true) {
        const sourceWorld = this.worlds.get(sourceWorldId);
        const targetWorld = this.worlds.get(targetWorldId);
        
        if (!sourceWorld || !targetWorld) {
            throw new Error('Both worlds must exist');
        }
        
        const wormholeId = crypto.randomBytes(6).toString('hex');
        
        // Add connection to source world
        sourceWorld.connections.push({
            id: wormholeId,
            targetWorldId,
            type: 'wormhole',
            bidirectional
        });
        
        // Add reverse connection if bidirectional
        if (bidirectional) {
            targetWorld.connections.push({
                id: wormholeId,
                targetWorldId: sourceWorldId,
                type: 'wormhole',
                bidirectional: true
            });
        }
        
        // Notify both worlds
        this.broadcastToWorld(sourceWorldId, {
            type: 'wormhole_created',
            wormhole: {
                id: wormholeId,
                targetWorld: targetWorld.name,
                targetWorldId
            }
        });
        
        if (bidirectional) {
            this.broadcastToWorld(targetWorldId, {
                type: 'wormhole_created',
                wormhole: {
                    id: wormholeId,
                    targetWorld: sourceWorld.name,
                    targetWorldId: sourceWorldId
                }
            });
        }
        
        return {
            id: wormholeId,
            sourceWorldId,
            targetWorldId,
            bidirectional,
            createdAt: Date.now()
        };
    }
    
    // Advanced analytics methods
    async getAdvancedWorldStats(worldId) {
        const world = this.worlds.get(worldId);
        if (!world) {
            throw new Error('World not found');
        }
        
        const stats = {
            basic: {
                playerCount: world.players.size,
                companionCount: world.companions.size,
                npcCount: world.npcs.size,
                voxelCount: world.voxels.size,
                connectionCount: world.connections.length
            },
            activity: {
                uptime: Date.now() - world.createdAt,
                lastActivity: Date.now() - world.lastActivity,
                averageSessionLength: this.calculateAverageSession(world),
                peakPlayers: world.peakPlayers || world.players.size
            },
            companion: {
                typeDistribution: this.getCompanionTypeDistribution(world),
                averageStats: this.getAverageCompanionStats(world),
                mostActive: this.getMostActiveCompanion(world)
            },
            building: {
                voxelTypeDistribution: this.getVoxelTypeDistribution(world),
                structureCount: this.detectStructures(world),
                buildRate: this.calculateBuildRate(world)
            },
            social: {
                totalInteractions: world.totalInteractions || 0,
                averageInteractionsPerPlayer: (world.totalInteractions || 0) / Math.max(world.players.size, 1),
                npcInteractions: this.countNPCInteractions(world)
            }
        };
        
        return stats;
    }
    
    getCompanionTypeDistribution(world) {
        const distribution = {};
        world.companions.forEach(companion => {
            distribution[companion.type] = (distribution[companion.type] || 0) + 1;
        });
        return distribution;
    }
    
    getAverageCompanionStats(world) {
        let totals = {
            tasksCompleted: 0,
            distanceTraveled: 0,
            voxelsAnalyzed: 0,
            bridgesCrossed: 0
        };
        
        world.companions.forEach(companion => {
            Object.keys(totals).forEach(key => {
                totals[key] += companion.stats[key] || 0;
            });
        });
        
        const count = world.companions.size || 1;
        Object.keys(totals).forEach(key => {
            totals[key] = totals[key] / count;
        });
        
        return totals;
    }
    
    getMostActiveCompanion(world) {
        let mostActive = null;
        let highestScore = 0;
        
        world.companions.forEach(companion => {
            const score = (companion.stats.tasksCompleted || 0) * 10 +
                         (companion.stats.distanceTraveled || 0) +
                         (companion.stats.voxelsAnalyzed || 0) * 5 +
                         (companion.stats.bridgesCrossed || 0) * 20;
            
            if (score > highestScore) {
                highestScore = score;
                mostActive = companion;
            }
        });
        
        return mostActive;
    }
    
    getVoxelTypeDistribution(world) {
        const distribution = {};
        world.voxels.forEach(voxel => {
            distribution[voxel.type] = (distribution[voxel.type] || 0) + 1;
        });
        return distribution;
    }
    
    detectStructures(world) {
        // Simple structure detection (would be more complex in production)
        const structures = {
            towers: 0,
            houses: 0,
            bridges: 0,
            sculptures: 0
        };
        
        // Check for vertical stacks (towers)
        const heightMap = new Map();
        world.voxels.forEach((voxel, key) => {
            const baseKey = `${voxel.x},${voxel.z}`;
            heightMap.set(baseKey, Math.max(heightMap.get(baseKey) || 0, voxel.y));
        });
        
        heightMap.forEach(height => {
            if (height > 5) structures.towers++;
        });
        
        return structures;
    }
    
    calculateBuildRate(world) {
        const timeElapsed = (Date.now() - world.createdAt) / 1000 / 60; // minutes
        return world.voxels.size / Math.max(timeElapsed, 1);
    }
    
    calculateAverageSession(world) {
        // Simplified calculation
        return 30 * 60 * 1000; // 30 minutes default
    }
    
    countNPCInteractions(world) {
        let count = 0;
        world.npcs.forEach(npc => {
            if (npc.lastInteraction) count++;
        });
        return count;
    }
    
    generateInsights(stats) {
        const insights = [];
        
        if (stats.basic.companionCount > stats.basic.playerCount * 3) {
            insights.push('High companion-to-player ratio suggests automation focus');
        }
        
        if (stats.building.buildRate > 10) {
            insights.push('Rapid building pace indicates engaged creative community');
        }
        
        if (stats.social.averageInteractionsPerPlayer > 20) {
            insights.push('Highly social world with active player interactions');
        }
        
        if (stats.companion.typeDistribution.scout > stats.companion.typeDistribution.builder) {
            insights.push('Exploration-focused world with emphasis on discovery');
        }
        
        return insights;
    }
    
    calculateWorldRank(stats) {
        let score = 0;
        
        // Activity score
        score += Math.min(stats.basic.playerCount * 10, 100);
        score += Math.min(stats.basic.companionCount * 5, 50);
        score += Math.min(stats.basic.voxelCount / 10, 50);
        
        // Engagement score
        score += Math.min(stats.social.averageInteractionsPerPlayer * 2, 30);
        score += stats.basic.connectionCount * 20; // Wormholes are valuable
        
        // Time bonus
        const ageBonus = Math.min((stats.activity.uptime / 1000 / 60 / 60), 24); // Hours
        score += ageBonus;
        
        // Rank calculation
        if (score > 300) return 'LEGENDARY';
        if (score > 200) return 'EPIC';
        if (score > 100) return 'RARE';
        if (score > 50) return 'UNCOMMON';
        return 'COMMON';
    }
    
    // System status methods
    async getSystemStatus() {
        const status = {
            polygonalCompanion: await this.checkServiceHealth('polygonalCompanion'),
            luaEngine: await this.checkServiceHealth('luaEngine'),
            httpBridge: await this.checkServiceHealth('httpBridge'),
            voxelWorld: await this.checkServiceHealth('voxelWorld'),
            overallHealth: 'HEALTHY'
        };
        
        // Determine overall health
        const unhealthyCount = Object.values(status).filter(s => s.status === 'DOWN').length;
        if (unhealthyCount === 0) {
            status.overallHealth = 'HEALTHY';
        } else if (unhealthyCount < 2) {
            status.overallHealth = 'DEGRADED';
        } else {
            status.overallHealth = 'CRITICAL';
        }
        
        return status;
    }
    
    async checkServiceHealth(serviceName) {
        const config = this.systemConnections[serviceName];
        if (!config) return { name: serviceName, status: 'UNKNOWN' };
        
        try {
            const response = await fetch(`${config.url}/health`).catch(() => null);
            return {
                name: serviceName,
                status: response?.ok ? 'UP' : 'DOWN',
                uptime: response?.ok ? 999999 : 0, // Would track real uptime
                load: Math.random() // Would get real load
            };
        } catch (error) {
            return {
                name: serviceName,
                status: 'DOWN',
                uptime: 0,
                load: 0
            };
        }
    }
    
    getScalingMetrics() {
        const metrics = {
            totalWorlds: this.worlds.size,
            activeWorlds: 0,
            totalPlayers: 0,
            averageLoad: 0,
            autoScaleStatus: 'IDLE',
            regionLoads: []
        };
        
        // Calculate metrics
        const regionData = {};
        
        this.worlds.forEach(world => {
            if (world.status === 'ACTIVE') {
                metrics.activeWorlds++;
                metrics.totalPlayers += world.players.size;
                
                if (!regionData[world.region]) {
                    regionData[world.region] = {
                        worldCount: 0,
                        playerCount: 0,
                        load: 0
                    };
                }
                
                regionData[world.region].worldCount++;
                regionData[world.region].playerCount += world.players.size;
            }
        });
        
        // Calculate average load
        Object.values(regionData).forEach(region => {
            region.load = region.playerCount / (region.worldCount * this.scalingConfig.maxPlayersPerWorld);
            metrics.averageLoad += region.load;
        });
        
        metrics.averageLoad = metrics.averageLoad / Math.max(Object.keys(regionData).length, 1);
        
        // Determine auto-scale status
        if (metrics.averageLoad > this.scalingConfig.autoScaleThreshold) {
            metrics.autoScaleStatus = 'SCALING_UP';
        } else if (metrics.averageLoad < 0.2) {
            metrics.autoScaleStatus = 'SCALING_DOWN';
        }
        
        // Format region loads
        metrics.regionLoads = Object.entries(regionData).map(([region, data]) => ({
            region,
            worldCount: data.worldCount,
            playerCount: data.playerCount,
            load: data.load
        }));
        
        return metrics;
    }
    
    // Script marketplace methods
    publishScript(scriptData) {
        const scriptId = crypto.randomBytes(6).toString('hex');
        const script = {
            id: scriptId,
            name: scriptData.name,
            description: scriptData.description,
            code: scriptData.code,
            author: scriptData.developerId || 'anonymous',
            downloads: 0,
            rating: 0,
            ratings: [],
            category: scriptData.category || 'general',
            publishedAt: Date.now()
        };
        
        this.developerFeatures.scriptMarketplace.set(scriptId, script);
        
        console.log(`📜 Published script: ${script.name} by ${script.author}`);
        return script;
    }
    
    // Leaderboard methods
    getLeaderboard(category) {
        const leaderboard = this.developerFeatures.leaderboards.get(category) || [];
        
        // Generate leaderboard data based on category
        switch (category) {
            case 'worlds_created':
                return this.generateWorldsCreatedLeaderboard();
                
            case 'companions_spawned':
                return this.generateCompanionsSpawnedLeaderboard();
                
            case 'scripts_published':
                return this.generateScriptsPublishedLeaderboard();
                
            case 'voxels_placed':
                return this.generateVoxelsPlacedLeaderboard();
                
            default:
                return [];
        }
    }
    
    generateWorldsCreatedLeaderboard() {
        const developers = new Map();
        
        this.worlds.forEach(world => {
            const count = developers.get(world.owner) || 0;
            developers.set(world.owner, count + 1);
        });
        
        return Array.from(developers.entries())
            .map(([developer, count]) => ({ developer, score: count }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }
    
    generateCompanionsSpawnedLeaderboard() {
        const developers = new Map();
        
        this.worlds.forEach(world => {
            world.companions.forEach(companion => {
                const owner = companion.owner || world.owner;
                const count = developers.get(owner) || 0;
                developers.set(owner, count + 1);
            });
        });
        
        return Array.from(developers.entries())
            .map(([developer, count]) => ({ developer, score: count }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }
    
    generateScriptsPublishedLeaderboard() {
        const developers = new Map();
        
        this.developerFeatures.scriptMarketplace.forEach(script => {
            const count = developers.get(script.author) || 0;
            developers.set(script.author, count + 1);
        });
        
        return Array.from(developers.entries())
            .map(([developer, count]) => ({ developer, score: count }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }
    
    generateVoxelsPlacedLeaderboard() {
        // Simplified - would track per developer
        return [
            { developer: 'builder_master', score: 10000 },
            { developer: 'voxel_artist', score: 8500 },
            { developer: 'block_ninja', score: 7200 }
        ];
    }
    
    getDeveloperRank(developerId, category) {
        const leaderboard = this.getLeaderboard(category);
        const index = leaderboard.findIndex(entry => entry.developer === developerId);
        return index === -1 ? null : index + 1;
    }
    
    // GraphQL resolvers
    getGraphQLResolvers() {
        return {
            // Query resolvers
            worlds: (args) => {
                let worlds = Array.from(this.worlds.values());
                
                // Apply filters
                if (args.filter) {
                    if (args.filter.owner) {
                        worlds = worlds.filter(w => w.owner === args.filter.owner);
                    }
                    if (args.filter.template) {
                        worlds = worlds.filter(w => w.template === args.filter.template);
                    }
                    if (args.filter.region) {
                        worlds = worlds.filter(w => w.region === args.filter.region);
                    }
                }
                
                // Apply pagination
                const start = args.offset || 0;
                const end = start + (args.limit || 10);
                
                return worlds.slice(start, end).map(w => this.getWorldDetails(w));
            },
            
            world: (args) => {
                const world = this.worlds.get(args.id);
                return world ? this.getWorldDetails(world) : null;
            },
            
            companions: (args) => {
                const world = this.worlds.get(args.worldId);
                return world ? Array.from(world.companions.values()) : [];
            },
            
            systemStatus: () => this.getSystemStatus(),
            
            scalingMetrics: () => this.getScalingMetrics(),
            
            // Mutation resolvers
            createWorld: async (args) => {
                const world = await this.createWorld(args.input);
                return this.getWorldDetails(world);
            },
            
            forkWorld: async (args) => {
                const world = await this.forkWorld(args.worldId, args.name);
                return this.getWorldDetails(world);
            },
            
            spawnCompanion: async (args) => {
                return await this.spawnCompanion(args.worldId, args.input);
            },
            
            injectLuaScript: async (args) => {
                return await this.injectLuaScript(args.worldId, args.script, args.name);
            }
        };
    }
    
    getWorldDetails(world) {
        return {
            id: world.id,
            name: world.name,
            description: world.description,
            template: world.template,
            owner: { id: world.owner, username: world.owner }, // Simplified
            size: world.size,
            playerCount: world.players.size,
            companionCount: world.companions.size,
            npcCount: world.npcs.size,
            voxelCount: world.voxels.size,
            createdAt: new Date(world.createdAt).toISOString(),
            lastActivity: new Date(world.lastActivity).toISOString(),
            features: world.features,
            status: world.status,
            region: world.region,
            connections: world.connections
        };
    }
    
    // WebSocket communication
    subscribeToWorld(ws, worldId) {
        const world = this.worlds.get(worldId);
        if (!world) {
            ws.send(JSON.stringify({ error: 'World not found' }));
            return;
        }
        
        // Add WebSocket to world subscribers
        if (!world.subscribers) {
            world.subscribers = new Set();
        }
        world.subscribers.add(ws);
        
        // Send initial world state
        ws.send(JSON.stringify({
            type: 'world_state',
            world: this.getWorldDetails(world)
        }));
        
        // Cleanup on disconnect
        ws.on('close', () => {
            world.subscribers.delete(ws);
        });
    }
    
    broadcastToWorld(worldId, message) {
        const world = this.worlds.get(worldId);
        if (!world || !world.subscribers) return;
        
        const data = JSON.stringify(message);
        world.subscribers.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });
    }
    
    broadcastToDevelopers(message) {
        const data = JSON.stringify(message);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    handleWebSocketMessage(ws, message) {
        switch (message.type) {
            case 'subscribe_world':
                this.subscribeToWorld(ws, message.worldId);
                break;
                
            case 'query_worlds':
                ws.send(JSON.stringify({
                    type: 'worlds_list',
                    worlds: Array.from(this.worlds.values()).map(w => this.getWorldDetails(w))
                }));
                break;
                
            case 'execute_command':
                this.handleDeveloperCommand(ws, message.command, message.params);
                break;
        }
    }
    
    handleDeveloperCommand(ws, command, params) {
        // Handle 1337 developer commands via WebSocket
        console.log(`🎮 Developer command: ${command}`, params);
        
        // Implementation would handle various developer commands
        ws.send(JSON.stringify({
            type: 'command_result',
            command,
            result: 'Command executed successfully'
        }));
    }
    
    // Dashboard HTML
    getDashboardHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🌐🎮 Polygon World Query API</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #0a0e27;
            color: #fff;
            font-family: 'Courier New', monospace;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 15px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            padding: 25px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
        }
        
        .stat-card h3 {
            margin: 0 0 15px 0;
            color: #667eea;
        }
        
        .worlds-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .world-card {
            background: rgba(255, 255, 255, 0.03);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease;
        }
        
        .world-card:hover {
            background: rgba(255, 255, 255, 0.08);
            transform: translateY(-2px);
        }
        
        .api-section {
            background: rgba(0, 0, 0, 0.5);
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 40px;
        }
        
        .code-block {
            background: #000;
            padding: 15px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            overflow-x: auto;
            margin: 10px 0;
        }
        
        .endpoint {
            color: #00ff88;
        }
        
        .status-active { color: #00ff88; }
        .status-inactive { color: #ff6b6b; }
        
        button {
            background: #667eea;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin: 5px;
        }
        
        button:hover {
            background: #764ba2;
        }
        
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .feature-item {
            background: rgba(102, 126, 234, 0.1);
            padding: 15px;
            border-radius: 5px;
            border: 1px solid rgba(102, 126, 234, 0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐🎮 Polygon World Query API</h1>
            <p>Unified orchestration for scaled polygon companion worlds</p>
            <p>Developer API on port 1337 • GraphQL • REST • WebSocket</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <h3>📊 System Overview</h3>
                <div id="system-stats">Loading...</div>
            </div>
            
            <div class="stat-card">
                <h3>🌍 World Statistics</h3>
                <div id="world-stats">Loading...</div>
            </div>
            
            <div class="stat-card">
                <h3>🚀 Scaling Metrics</h3>
                <div id="scaling-stats">Loading...</div>
            </div>
        </div>
        
        <div class="api-section">
            <h2>🔧 Quick Start API Examples</h2>
            
            <h3>Create a New World</h3>
            <div class="code-block">
POST <span class="endpoint">http://localhost:1337/api/worlds</span>
{
  "name": "My Epic World",
  "template": "developer",
  "size": { "x": 200, "y": 100, "z": 200 }
}
            </div>
            
            <h3>Spawn a Companion</h3>
            <div class="code-block">
POST <span class="endpoint">http://localhost:1337/api/worlds/{worldId}/companions</span>
{
  "type": "scout",
  "name": "Explorer Bot",
  "luaScript": "scan_area(10); bridge_to_system('documentToMVP', {action: 'analyze'})"
}
            </div>
            
            <h3>1337 Developer Endpoints</h3>
            <div class="code-block">
POST <span class="endpoint">http://localhost:1337/api/1337/fork-world</span>
POST <span class="endpoint">http://localhost:1337/api/1337/mass-spawn</span>
POST <span class="endpoint">http://localhost:1337/api/1337/inject-script</span>
POST <span class="endpoint">http://localhost:1337/api/1337/create-wormhole</span>
            </div>
            
            <h3>GraphQL Playground</h3>
            <p>Interactive GraphQL interface available at <a href="/graphql" style="color: #667eea;">/graphql</a></p>
        </div>
        
        <div class="api-section">
            <h2>🎮 World Templates</h2>
            <div class="feature-grid">
                <div class="feature-item">
                    <h4>🌱 Starter World</h4>
                    <p>Basic world with tutorial NPCs</p>
                </div>
                <div class="feature-item">
                    <h4>💻 Developer Sandbox</h4>
                    <p>All features unlocked, debug mode</p>
                </div>
                <div class="feature-item">
                    <h4>⚔️ Battle Arena</h4>
                    <p>PvP-focused with combat zones</p>
                </div>
                <div class="feature-item">
                    <h4>🎨 Creative Canvas</h4>
                    <p>Unlimited resources, instant build</p>
                </div>
            </div>
        </div>
        
        <div class="api-section">
            <h2>🌍 Active Worlds</h2>
            <div id="worlds-list" class="worlds-grid">Loading worlds...</div>
        </div>
        
        <div class="api-section">
            <h2>🔗 System Connections</h2>
            <div id="connections-status">Checking connections...</div>
        </div>
    </div>
    
    <script>
        // Connect to WebSocket
        const ws = new WebSocket('ws://localhost:1337');
        
        ws.onopen = () => {
            console.log('Connected to Query API');
            loadDashboardData();
        };
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            handleServerMessage(message);
        };
        
        async function loadDashboardData() {
            // Load system stats
            try {
                const statusResponse = await fetch('/api/status');
                const status = await statusResponse.json();
                updateSystemStats(status);
                
                const metricsResponse = await fetch('/api/metrics/scaling');
                const metrics = await metricsResponse.json();
                updateScalingStats(metrics);
                
                const worldsResponse = await fetch('/api/worlds');
                const worlds = await worldsResponse.json();
                updateWorldsList(worlds);
                updateWorldStats(worlds);
                
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            }
        }
        
        function updateSystemStats(status) {
            const html = \`
                <div>Overall Health: <span class="status-\${status.overallHealth.toLowerCase()}">\${status.overallHealth}</span></div>
                <div>Polygon Companions: <span class="status-\${status.polygonalCompanion.status.toLowerCase()}">\${status.polygonalCompanion.status}</span></div>
                <div>Lua Engine: <span class="status-\${status.luaEngine.status.toLowerCase()}">\${status.luaEngine.status}</span></div>
                <div>HTTP Bridge: <span class="status-\${status.httpBridge.status.toLowerCase()}">\${status.httpBridge.status}</span></div>
            \`;
            document.getElementById('system-stats').innerHTML = html;
        }
        
        function updateWorldStats(worlds) {
            const totalPlayers = worlds.reduce((sum, w) => sum + w.playerCount, 0);
            const totalCompanions = worlds.reduce((sum, w) => sum + w.companionCount, 0);
            
            const html = \`
                <div>Total Worlds: <strong>\${worlds.length}</strong></div>
                <div>Active Players: <strong>\${totalPlayers}</strong></div>
                <div>Total Companions: <strong>\${totalCompanions}</strong></div>
                <div>Average Players/World: <strong>\${(totalPlayers / Math.max(worlds.length, 1)).toFixed(1)}</strong></div>
            \`;
            document.getElementById('world-stats').innerHTML = html;
        }
        
        function updateScalingStats(metrics) {
            const html = \`
                <div>Auto-scale Status: <strong>\${metrics.autoScaleStatus}</strong></div>
                <div>Average Load: <strong>\${(metrics.averageLoad * 100).toFixed(1)}%</strong></div>
                <div>Active Regions: <strong>\${metrics.regionLoads.length}</strong></div>
                <div>Total Players: <strong>\${metrics.totalPlayers}</strong></div>
            \`;
            document.getElementById('scaling-stats').innerHTML = html;
        }
        
        function updateWorldsList(worlds) {
            const html = worlds.slice(0, 6).map(world => \`
                <div class="world-card">
                    <h4>\${world.name}</h4>
                    <p>ID: \${world.id}</p>
                    <p>Players: \${world.playerCount} | Companions: \${world.companionCount}</p>
                    <p>Region: \${world.region} | Status: <span class="status-\${world.status.toLowerCase()}">\${world.status}</span></p>
                    <button onclick="window.open('/api/worlds/\${world.id}', '_blank')">View Details</button>
                </div>
            \`).join('');
            
            document.getElementById('worlds-list').innerHTML = html || '<p>No active worlds</p>';
        }
        
        function handleServerMessage(message) {
            switch (message.type) {
                case 'world_created':
                case 'world_updated':
                    loadDashboardData(); // Refresh all data
                    break;
            }
        }
        
        // Auto-refresh every 30 seconds
        setInterval(loadDashboardData, 30000);
    </script>
</body>
</html>`;
    }
    
    getDeveloperDashboardHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>💻 Developer Dashboard - 1337 Mode</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #000;
            color: #00ff00;
            font-family: 'Courier New', monospace;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border: 2px solid #00ff00;
            padding: 20px;
            position: relative;
        }
        
        .header::before,
        .header::after {
            content: '';
            position: absolute;
            width: 100%;
            height: 2px;
            background: repeating-linear-gradient(90deg, #00ff00 0, #00ff00 10px, transparent 10px, transparent 20px);
            animation: slide 1s linear infinite;
        }
        
        .header::before { top: -2px; }
        .header::after { bottom: -2px; }
        
        @keyframes slide {
            0% { transform: translateX(0); }
            100% { transform: translateX(20px); }
        }
        
        .code-section {
            background: #0a0a0a;
            border: 1px solid #00ff00;
            padding: 20px;
            margin: 20px 0;
            position: relative;
        }
        
        .code-section::before {
            content: '> ';
            color: #00ff00;
        }
        
        pre {
            margin: 0;
            white-space: pre-wrap;
        }
        
        .endpoint {
            color: #ffff00;
        }
        
        .l33t-button {
            background: transparent;
            color: #00ff00;
            border: 1px solid #00ff00;
            padding: 10px 20px;
            cursor: pointer;
            text-transform: uppercase;
            margin: 5px;
            transition: all 0.3s;
        }
        
        .l33t-button:hover {
            background: #00ff00;
            color: #000;
            box-shadow: 0 0 10px #00ff00;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 30px 0;
        }
        
        .status-box {
            border: 1px solid #00ff00;
            padding: 15px;
            text-align: center;
        }
        
        .achievement {
            display: inline-block;
            margin: 5px;
            padding: 5px 10px;
            border: 1px solid #ffff00;
            color: #ffff00;
        }
        
        #terminal {
            background: #000;
            border: 1px solid #00ff00;
            padding: 20px;
            height: 400px;
            overflow-y: auto;
            font-size: 14px;
            margin: 20px 0;
        }
        
        .command-line {
            display: flex;
            margin-top: 10px;
        }
        
        .command-line input {
            flex: 1;
            background: transparent;
            border: none;
            color: #00ff00;
            outline: none;
            font-family: inherit;
            font-size: 14px;
        }
        
        .blink {
            animation: blink 1s infinite;
        }
        
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💻 1337 DEVELOPER DASHBOARD</h1>
            <p>ELITE ACCESS GRANTED</p>
        </div>
        
        <div class="status-grid">
            <div class="status-box">
                <h3>REPUTATION</h3>
                <div id="reputation">0</div>
            </div>
            <div class="status-box">
                <h3>WORLDS OWNED</h3>
                <div id="worlds-owned">0</div>
            </div>
            <div class="status-box">
                <h3>SCRIPTS PUBLISHED</h3>
                <div id="scripts-published">0</div>
            </div>
        </div>
        
        <div class="code-section">
            <h3>1337 QUICK COMMANDS</h3>
            <button class="l33t-button" onclick="forkWorld()">FORK WORLD</button>
            <button class="l33t-button" onclick="massSpawn()">MASS SPAWN</button>
            <button class="l33t-button" onclick="injectScript()">INJECT SCRIPT</button>
            <button class="l33t-button" onclick="createWormhole()">CREATE WORMHOLE</button>
            <button class="l33t-button" onclick="showLeaderboard()">LEADERBOARDS</button>
        </div>
        
        <div class="code-section">
            <h3>ACHIEVEMENTS</h3>
            <div id="achievements">
                <span class="achievement">FIRST_WORLD</span>
                <span class="achievement">SCRIPT_KIDDIE</span>
            </div>
        </div>
        
        <div id="terminal">
            <div id="terminal-output">
> POLYGON WORLD QUERY API v1.3.3.7
> Developer Terminal Ready
> Type 'help' for commands
            </div>
            <div class="command-line">
                > <input type="text" id="terminal-input" autofocus>
                <span class="blink">_</span>
            </div>
        </div>
        
        <div class="code-section">
            <h3>API ENDPOINTS</h3>
            <pre>
POST <span class="endpoint">/api/1337/fork-world</span>      // Fork any world with modifications
POST <span class="endpoint">/api/1337/mass-spawn</span>      // Spawn up to 1000 entities at once
POST <span class="endpoint">/api/1337/inject-script</span>   // Inject Lua globally to all companions
GET  <span class="endpoint">/api/1337/world-stats/:id</span> // Advanced analytics and insights
POST <span class="endpoint">/api/1337/create-wormhole</span> // Connect worlds across dimensions
            </pre>
        </div>
    </div>
    
    <script>
        const terminalOutput = document.getElementById('terminal-output');
        const terminalInput = document.getElementById('terminal-input');
        
        // Terminal command handler
        terminalInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const command = terminalInput.value;
                addTerminalLine('> ' + command);
                processCommand(command);
                terminalInput.value = '';
            }
        });
        
        function addTerminalLine(text) {
            const line = document.createElement('div');
            line.textContent = text;
            terminalOutput.appendChild(line);
            terminalOutput.scrollTop = terminalOutput.scrollHeight;
        }
        
        function processCommand(command) {
            const [cmd, ...args] = command.toLowerCase().split(' ');
            
            switch (cmd) {
                case 'help':
                    addTerminalLine('Available commands:');
                    addTerminalLine('  worlds       - List your worlds');
                    addTerminalLine('  create       - Create new world');
                    addTerminalLine('  stats        - Show your stats');
                    addTerminalLine('  hack <id>    - Hack into world (1337 only)');
                    addTerminalLine('  clear        - Clear terminal');
                    break;
                    
                case 'worlds':
                    fetchWorlds();
                    break;
                    
                case 'stats':
                    showStats();
                    break;
                    
                case 'hack':
                    if (args[0]) {
                        hackWorld(args[0]);
                    } else {
                        addTerminalLine('Usage: hack <world-id>');
                    }
                    break;
                    
                case 'clear':
                    terminalOutput.innerHTML = '';
                    break;
                    
                default:
                    addTerminalLine('Unknown command. Type "help" for commands.');
            }
        }
        
        async function fetchWorlds() {
            try {
                const response = await fetch('/api/worlds');
                const worlds = await response.json();
                addTerminalLine('Your worlds:');
                worlds.forEach(world => {
                    addTerminalLine(\`  [\${world.id}] \${world.name} - \${world.playerCount} players\`);
                });
            } catch (error) {
                addTerminalLine('ERROR: Failed to fetch worlds');
            }
        }
        
        async function showStats() {
            addTerminalLine('Developer Stats:');
            addTerminalLine('  Reputation: 1337');
            addTerminalLine('  Worlds Created: 42');
            addTerminalLine('  Scripts Published: 17');
            addTerminalLine('  Companions Spawned: 256');
            addTerminalLine('  Rank: ELITE');
        }
        
        async function hackWorld(worldId) {
            addTerminalLine('Initiating world hack...');
            setTimeout(() => addTerminalLine('[■□□□□□□□□□] 10%'), 100);
            setTimeout(() => addTerminalLine('[■■■□□□□□□□] 30%'), 300);
            setTimeout(() => addTerminalLine('[■■■■■□□□□□] 50%'), 500);
            setTimeout(() => addTerminalLine('[■■■■■■■□□□] 70%'), 700);
            setTimeout(() => addTerminalLine('[■■■■■■■■■□] 90%'), 900);
            setTimeout(() => {
                addTerminalLine('[■■■■■■■■■■] 100%');
                addTerminalLine('ACCESS GRANTED - You now have admin access to world ' + worldId);
                addTerminalLine('Achievement Unlocked: WORLD_HACKER');
            }, 1100);
        }
        
        async function forkWorld() {
            const worldId = prompt('Enter world ID to fork:');
            const name = prompt('Enter name for forked world:');
            
            if (worldId && name) {
                try {
                    const response = await fetch('/api/1337/fork-world', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ worldId, name })
                    });
                    
                    const result = await response.json();
                    addTerminalLine('World forked successfully!');
                    addTerminalLine('New world ID: ' + result.world.id);
                } catch (error) {
                    addTerminalLine('ERROR: Fork failed');
                }
            }
        }
        
        async function massSpawn() {
            const worldId = prompt('Enter world ID:');
            const count = prompt('Number of entities to spawn (max 1000):');
            const type = prompt('Entity type (companion/voxel):');
            
            if (worldId && count && type) {
                try {
                    const response = await fetch('/api/1337/mass-spawn', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            worldId,
                            entityType: type,
                            count: parseInt(count),
                            pattern: 'spiral'
                        })
                    });
                    
                    const result = await response.json();
                    addTerminalLine(\`Mass spawn complete! Spawned \${result.spawned} entities\`);
                    if (result.achievement) {
                        addTerminalLine('Achievement Unlocked: ' + result.achievement);
                    }
                } catch (error) {
                    addTerminalLine('ERROR: Mass spawn failed');
                }
            }
        }
        
        async function injectScript() {
            const worldId = prompt('Enter world ID:');
            const script = prompt('Enter Lua script:');
            
            if (worldId && script) {
                try {
                    const response = await fetch('/api/1337/inject-script', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            worldId,
                            script,
                            global: true
                        })
                    });
                    
                    const result = await response.json();
                    addTerminalLine('Script injected successfully!');
                    addTerminalLine('Status: ' + result.status);
                } catch (error) {
                    addTerminalLine('ERROR: Script injection failed');
                }
            }
        }
        
        async function createWormhole() {
            const sourceWorldId = prompt('Enter source world ID:');
            const targetWorldId = prompt('Enter target world ID:');
            
            if (sourceWorldId && targetWorldId) {
                try {
                    const response = await fetch('/api/1337/create-wormhole', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            sourceWorldId,
                            targetWorldId,
                            bidirectional: true
                        })
                    });
                    
                    const result = await response.json();
                    addTerminalLine('Wormhole created!');
                    addTerminalLine('Status: ' + result.status);
                    addTerminalLine('Achievement: ' + result.achievement);
                } catch (error) {
                    addTerminalLine('ERROR: Wormhole creation failed');
                }
            }
        }
        
        async function showLeaderboard() {
            const category = prompt('Category (worlds_created/companions_spawned/scripts_published):');
            
            if (category) {
                try {
                    const response = await fetch(\`/api/1337/leaderboards/\${category}\`);
                    const result = await response.json();
                    
                    addTerminalLine(\`\\nLEADERBOARD - \${category.toUpperCase()}\\n\`);
                    result.leaderboard.forEach((entry, index) => {
                        addTerminalLine(\`\${index + 1}. \${entry.developer} - \${entry.score}\`);
                    });
                    
                    if (result.yourRank) {
                        addTerminalLine(\`\\nYour Rank: #\${result.yourRank}\`);
                    }
                } catch (error) {
                    addTerminalLine('ERROR: Failed to fetch leaderboard');
                }
            }
        }
        
        // Initialize
        addTerminalLine('\\nWelcome, 1337 developer!');
        addTerminalLine('Your access level: ELITE');
        addTerminalLine('Type "help" to begin\\n');
    </script>
</body>
</html>`;
    }
}

// Start the API
if (require.main === module) {
    new PolygonWorldQueryAPI();
}

module.exports = PolygonWorldQueryAPI;