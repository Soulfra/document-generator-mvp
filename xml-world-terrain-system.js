#!/usr/bin/env node
// xml-world-terrain-system.js - XML as World/Terrain Data System
// Treats XML like WoW's .ADT files or RuneScape's map chunks
// Loads XML "world data" for instance terrain, objects, NPCs, spawns

const fs = require('fs').promises;
const path = require('path');
const xml2js = require('xml2js');
const { EventEmitter } = require('events');

console.log(`
🗺️ XML WORLD TERRAIN SYSTEM 🗺️
==============================
World of Warcraft .ADT + RuneScape Map Chunk Style
XML files as world/terrain data for gaming instances
Load objects, NPCs, spawns, and terrain from XML specs
`);

class XMLWorldTerrainSystem extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            // World data directories
            worldDataPath: './xml-world-data',
            skeletonDataPath: './xml-skeletons',
            
            // Terrain chunk configuration (like WoW map tiles)
            chunkSize: 533.33333, // WoW-style 533x533 yard chunks
            maxViewDistance: 1066.6666, // 2 chunks in each direction
            
            // Object spawning
            maxObjectsPerChunk: 1000,
            maxNPCsPerChunk: 50,
            maxSpawnPointsPerChunk: 20,
            
            // Performance settings
            cacheSize: 100, // Cache 100 chunks in memory
            streamingEnabled: true,
            levelOfDetailEnabled: true
        };
        
        // World data cache (like WoW's terrain cache)
        this.terrainCache = new Map();
        this.loadedChunks = new Map();
        this.worldObjects = new Map();
        this.npcSpawns = new Map();
        this.playerSpawns = new Map();
        
        // XML parsers
        this.xmlParser = new xml2js.Parser();
        this.xmlBuilder = new xml2js.Builder();
        
        // World templates (different "zones" like WoW)
        this.worldTemplates = {
            // Economic zones (trading floors, markets)
            grandExchange: {
                name: 'Grand Exchange',
                template: 'grand-exchange-world-template.xml',
                terrain: 'trading_floor',
                ambient: 'market_sounds',
                lighting: 'bright_commerce',
                spawns: ['trading_npcs', 'market_stalls', 'price_boards']
            },
            
            // PvP zones (arenas, battlegrounds)
            shipRektArena: {
                name: 'ShipRekt Arena',
                template: 'shiprekt-arena-template.xml',
                terrain: 'battle_arena',
                ambient: 'combat_sounds',
                lighting: 'dramatic_arena',
                spawns: ['arena_npcs', 'weapon_racks', 'scoreboards']
            },
            
            // Social zones (banks, guildhalls)
            tickerTapeFloor: {
                name: 'Ticker Tape Floor',
                template: 'ticker-floor-template.xml',
                terrain: 'social_hub',
                ambient: 'crowd_chatter',
                lighting: 'warm_social',
                spawns: ['bank_npcs', 'information_boards', 'seating_areas']
            },
            
            // Utility zones (skill training, crafting)
            revenueVerification: {
                name: 'Revenue Verification Chamber',
                template: 'revenue-chamber-template.xml',
                terrain: 'office_complex',
                ambient: 'office_sounds',
                lighting: 'professional_bright',
                spawns: ['accountant_npcs', 'calculators', 'filing_cabinets']
            },
            
            // Raid zones (complex multi-room areas)
            unifiedVisualization: {
                name: 'Unified Visualization Raid',
                template: 'unified-raid-template.xml',
                terrain: 'complex_dungeon',
                ambient: 'epic_music',
                lighting: 'dynamic_raid',
                spawns: ['boss_encounters', 'treasure_chests', 'raid_mechanics']
            },
            
            // Bridge zones (portals, transportation)
            extensionBridge: {
                name: 'Cross-Platform Bridge',
                template: 'bridge-nexus-template.xml',
                terrain: 'mystical_nexus',
                ambient: 'portal_hum',
                lighting: 'magical_portals',
                spawns: ['portal_keepers', 'transport_runes', 'platform_gates']
            }
        };
        
        // Initialize the world system
        console.log('🗺️ XML World Terrain System initializing...');
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing world terrain system...');
        
        // Create world data directories
        await this.createWorldDirectories();
        
        // Load existing XML world data
        await this.loadExistingWorldData();
        
        // Generate missing world templates
        await this.generateMissingTemplates();
        
        // Initialize terrain streaming system
        await this.initializeTerrainStreaming();
        
        // Setup world object management
        await this.setupWorldObjectManagement();
        
        console.log('✅ XML World Terrain System ready!');
        console.log(`🗺️ World Templates: ${Object.keys(this.worldTemplates).length} available`);
        console.log(`💾 Cached Chunks: ${this.loadedChunks.size}`);
    }
    
    async createWorldDirectories() {
        console.log('📁 Creating world data directories...');
        
        try {
            await fs.mkdir(this.config.worldDataPath, { recursive: true });
            await fs.mkdir(this.config.skeletonDataPath, { recursive: true });
            
            // Create subdirectories for each world type
            for (const worldId of Object.keys(this.worldTemplates)) {
                await fs.mkdir(path.join(this.config.worldDataPath, worldId), { recursive: true });
                await fs.mkdir(path.join(this.config.skeletonDataPath, worldId), { recursive: true });
            }
            
            console.log('✅ World directories created');
        } catch (error) {
            console.error('❌ Error creating directories:', error.message);
        }
    }
    
    async loadExistingWorldData() {
        console.log('📚 Loading existing XML world data...');
        
        // Look for existing XML files that could be world data
        const existingXMLFiles = [
            'HIERARCHICAL-SYSTEM-XML-MAPPING.xml',
            'HOLLOWTOWN-YELLOWBOOK-SPECIFICATION.xml',
            'system-architecture-map.xml',
            'elemental-system.xml',
            'body-soul-binding.xml',
            'collection-rulebook.xml'
        ];
        
        for (const filename of existingXMLFiles) {
            try {
                const xmlContent = await fs.readFile(filename, 'utf8');
                const worldData = await this.parseXMLWorldData(xmlContent, filename);
                
                if (worldData) {
                    this.terrainCache.set(filename, worldData);
                    console.log(`✅ Loaded world data: ${filename}`);
                }
            } catch (error) {
                // File doesn't exist or can't be read - that's okay
                console.log(`⚠️ Could not load ${filename}, will generate template`);
            }
        }
    }
    
    async parseXMLWorldData(xmlContent, filename) {
        try {
            const parsed = await this.xmlParser.parseStringPromise(xmlContent);
            
            // Extract world-relevant information from XML
            const worldData = {
                filename,
                terrain: this.extractTerrainData(parsed),
                objects: this.extractWorldObjects(parsed),
                spawns: this.extractSpawnPoints(parsed),
                lighting: this.extractLightingData(parsed),
                ambient: this.extractAmbientData(parsed),
                navigation: this.extractNavigationData(parsed),
                interactions: this.extractInteractionData(parsed)
            };
            
            return worldData;
        } catch (error) {
            console.error(`❌ Error parsing XML world data ${filename}:`, error.message);
            return null;
        }
    }
    
    extractTerrainData(parsedXML) {
        // Extract terrain information from XML structure
        const terrain = {
            type: 'default',
            elevation: 0,
            texture: 'grass',
            walkable: true,
            chunks: []
        };
        
        // Look for terrain-related elements
        if (parsedXML.system || parsedXML.frankenstein) {
            terrain.type = 'complex_system';
            terrain.texture = 'technical';
        }
        
        if (parsedXML.hollowtown || parsedXML.yellowbook) {
            terrain.type = 'mystical';
            terrain.texture = 'yellow_glow';
        }
        
        if (parsedXML.collection || parsedXML.rulebook) {
            terrain.type = 'library';
            terrain.texture = 'books_papers';
        }
        
        return terrain;
    }
    
    extractWorldObjects(parsedXML) {
        const objects = [];
        
        // Recursively find objects in XML structure
        const findObjects = (node, path = '') => {
            if (typeof node === 'object' && node !== null) {
                for (const [key, value] of Object.entries(node)) {
                    const objectPath = path ? `${path}.${key}` : key;
                    
                    // Check if this looks like a world object
                    if (this.isWorldObject(key, value)) {
                        objects.push({
                            id: `obj_${objects.length}`,
                            type: key,
                            name: this.generateObjectName(key),
                            position: this.generateObjectPosition(),
                            data: value,
                            interactive: this.isInteractiveObject(key),
                            visible: true,
                            xmlPath: objectPath
                        });
                    }
                    
                    // Recurse into nested objects
                    if (typeof value === 'object') {
                        findObjects(value, objectPath);
                    }
                }
            }
        };
        
        findObjects(parsedXML);
        return objects;
    }
    
    extractSpawnPoints(parsedXML) {
        const spawns = [];
        
        // Generate spawn points based on XML structure
        const spawnTypes = ['player', 'npc', 'object', 'effect'];
        
        for (let i = 0; i < 5; i++) {
            spawns.push({
                id: `spawn_${i}`,
                type: spawnTypes[i % spawnTypes.length],
                position: this.generateSpawnPosition(i),
                enabled: true,
                spawnRate: 1.0,
                maxSpawns: 1
            });
        }
        
        return spawns;
    }
    
    extractLightingData(parsedXML) {
        // Determine lighting based on XML content
        if (parsedXML.hollowtown || parsedXML.yellowbook) {
            return {
                ambient: '#ffff00',
                directional: '#ffffff',
                intensity: 0.8,
                shadows: true,
                fog: { color: '#404040', density: 0.02 }
            };
        }
        
        return {
            ambient: '#ffffff',
            directional: '#ffffff',
            intensity: 1.0,
            shadows: false,
            fog: null
        };
    }
    
    extractAmbientData(parsedXML) {
        // Generate ambient effects based on XML content
        const ambient = {
            sounds: [],
            particles: [],
            weather: 'clear'
        };
        
        if (parsedXML.system) {
            ambient.sounds.push('computer_hum', 'keyboard_clicks');
            ambient.particles.push('data_flow', 'screen_glow');
        }
        
        if (parsedXML.collection) {
            ambient.sounds.push('page_turning', 'writing');
            ambient.particles.push('dust_motes', 'paper_floating');
        }
        
        return ambient;
    }
    
    extractNavigationData(parsedXML) {
        // Generate navigation mesh from XML structure
        return {
            walkableSurfaces: ['ground', 'floor', 'platform'],
            blockedAreas: ['wall', 'obstacle', 'void'],
            teleportPoints: [],
            pathfindingNodes: []
        };
    }
    
    extractInteractionData(parsedXML) {
        const interactions = [];
        
        // Find interactive elements in XML
        const interactiveKeywords = ['button', 'door', 'chest', 'terminal', 'book', 'sign'];
        
        const findInteractions = (node, path = '') => {
            if (typeof node === 'object' && node !== null) {
                for (const [key, value] of Object.entries(node)) {
                    if (interactiveKeywords.some(keyword => key.toLowerCase().includes(keyword))) {
                        interactions.push({
                            id: `interact_${interactions.length}`,
                            type: key,
                            position: this.generateObjectPosition(),
                            action: this.generateInteractionAction(key),
                            data: value
                        });
                    }
                    
                    if (typeof value === 'object') {
                        findInteractions(value, path ? `${path}.${key}` : key);
                    }
                }
            }
        };
        
        findInteractions(parsedXML);
        return interactions;
    }
    
    async generateMissingTemplates() {
        console.log('🏗️ Generating missing world templates...');
        
        for (const [worldId, worldConfig] of Object.entries(this.worldTemplates)) {
            const templatePath = path.join(this.config.worldDataPath, worldId, worldConfig.template);
            
            try {
                await fs.access(templatePath);
                console.log(`✅ Template exists: ${worldConfig.name}`);
            } catch (error) {
                // Template doesn't exist, generate it
                const template = this.generateWorldTemplate(worldId, worldConfig);
                await fs.writeFile(templatePath, template);
                console.log(`🏗️ Generated template: ${worldConfig.name}`);
            }
        }
    }
    
    generateWorldTemplate(worldId, worldConfig) {
        const template = {
            world: {
                $: {
                    id: worldId,
                    name: worldConfig.name,
                    version: '1.0',
                    generated: new Date().toISOString()
                },
                terrain: [{
                    $: { type: worldConfig.terrain },
                    texture: [worldConfig.lighting],
                    elevation: ['0'],
                    walkable: ['true']
                }],
                lighting: [{
                    ambient: [worldConfig.lighting],
                    shadows: ['true'],
                    fog: [{ $: { enabled: 'true', color: '#404040' } }]
                }],
                ambient: [{
                    sounds: worldConfig.ambient,
                    music: ['background_' + worldId],
                    effects: ['particle_' + worldId]
                }],
                objects: this.generateTemplateObjects(worldId, worldConfig),
                spawns: this.generateTemplateSpawns(worldId, worldConfig),
                navigation: [{
                    pathfinding: [{ $: { enabled: 'true' } }],
                    teleports: [{ $: { count: '3' } }]
                }],
                interactions: this.generateTemplateInteractions(worldId, worldConfig),
                instanceConfig: [{
                    maxPlayers: [this.getMaxPlayersForWorld(worldId)],
                    gameStyle: [worldConfig.name],
                    antiCheat: [{ $: { level: 'high' } }]
                }]
            }
        };
        
        return this.xmlBuilder.buildObject(template);
    }
    
    generateTemplateObjects(worldId, worldConfig) {
        const objects = [];
        
        // Generate objects based on world type
        switch (worldId) {
            case 'grandExchange':
                objects.push(
                    { $: { type: 'trading_post', x: '100', y: '100', z: '0' } },
                    { $: { type: 'price_board', x: '200', y: '100', z: '10' } },
                    { $: { type: 'market_stall', x: '150', y: '200', z: '0' } }
                );
                break;
                
            case 'shipRektArena':
                objects.push(
                    { $: { type: 'arena_wall', x: '0', y: '0', z: '20' } },
                    { $: { type: 'scoreboard', x: '250', y: '50', z: '15' } },
                    { $: { type: 'weapon_rack', x: '50', y: '250', z: '0' } }
                );
                break;
                
            default:
                objects.push(
                    { $: { type: 'generic_object', x: '100', y: '100', z: '0' } }
                );
        }
        
        return objects;
    }
    
    generateTemplateSpawns(worldId, worldConfig) {
        return [
            { $: { type: 'player', x: '50', y: '50', z: '0', enabled: 'true' } },
            { $: { type: 'npc', x: '150', y: '150', z: '0', enabled: 'true' } },
            { $: { type: 'object', x: '200', y: '200', z: '0', enabled: 'true' } }
        ];
    }
    
    generateTemplateInteractions(worldId, worldConfig) {
        const interactions = [];
        
        // Generate interactions based on world type
        switch (worldId) {
            case 'grandExchange':
                interactions.push(
                    { $: { type: 'trade', target: 'trading_post', action: 'open_trade_window' } },
                    { $: { type: 'examine', target: 'price_board', action: 'show_prices' } }
                );
                break;
                
            case 'shipRektArena':
                interactions.push(
                    { $: { type: 'battle', target: 'arena_center', action: 'start_battle' } },
                    { $: { type: 'spectate', target: 'scoreboard', action: 'view_scores' } }
                );
                break;
        }
        
        return interactions;
    }
    
    async loadWorldForInstance(worldId, instanceId) {
        console.log(`🗺️ Loading world: ${worldId} for instance: ${instanceId}`);
        
        const worldConfig = this.worldTemplates[worldId];
        if (!worldConfig) {
            throw new Error(`Unknown world type: ${worldId}`);
        }
        
        // Load world template
        const templatePath = path.join(this.config.worldDataPath, worldId, worldConfig.template);
        
        try {
            const templateContent = await fs.readFile(templatePath, 'utf8');
            const worldData = await this.parseXMLWorldData(templateContent, worldConfig.template);
            
            // Cache the loaded world
            const worldKey = `${worldId}_${instanceId}`;
            this.loadedChunks.set(worldKey, {
                worldId,
                instanceId,
                data: worldData,
                loadedAt: Date.now(),
                lastAccessed: Date.now()
            });
            
            console.log(`✅ World loaded: ${worldConfig.name}`);
            
            this.emit('world_loaded', { worldId, instanceId, worldData });
            
            return worldData;
            
        } catch (error) {
            console.error(`❌ Failed to load world ${worldId}:`, error.message);
            throw error;
        }
    }
    
    async unloadWorldForInstance(worldId, instanceId) {
        const worldKey = `${worldId}_${instanceId}`;
        
        if (this.loadedChunks.has(worldKey)) {
            this.loadedChunks.delete(worldKey);
            console.log(`🗺️ Unloaded world: ${worldId} for instance: ${instanceId}`);
            
            this.emit('world_unloaded', { worldId, instanceId });
        }
    }
    
    getWorldObjectsInRadius(worldId, instanceId, centerX, centerY, radius) {
        const worldKey = `${worldId}_${instanceId}`;
        const world = this.loadedChunks.get(worldKey);
        
        if (!world) {
            return [];
        }
        
        // Filter objects within radius
        return world.data.objects.filter(obj => {
            const distance = Math.sqrt(
                Math.pow(obj.position.x - centerX, 2) +
                Math.pow(obj.position.y - centerY, 2)
            );
            return distance <= radius;
        });
    }
    
    getSpawnPointsForWorld(worldId, instanceId, spawnType = 'player') {
        const worldKey = `${worldId}_${instanceId}`;
        const world = this.loadedChunks.get(worldKey);
        
        if (!world) {
            return [];
        }
        
        return world.data.spawns.filter(spawn => 
            spawn.type === spawnType && spawn.enabled
        );
    }
    
    // Utility methods
    isWorldObject(key, value) {
        // Determine if an XML element represents a world object
        const objectKeywords = [
            'object', 'item', 'building', 'structure', 'furniture', 
            'machine', 'terminal', 'station', 'post', 'board'
        ];
        
        return objectKeywords.some(keyword => 
            key.toLowerCase().includes(keyword)
        );
    }
    
    isInteractiveObject(key) {
        const interactiveKeywords = [
            'button', 'door', 'chest', 'terminal', 'book', 
            'sign', 'switch', 'lever', 'panel'
        ];
        
        return interactiveKeywords.some(keyword => 
            key.toLowerCase().includes(keyword)
        );
    }
    
    generateObjectName(key) {
        // Convert XML key to readable object name
        return key.split(/[-_]/).map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    generateObjectPosition() {
        return {
            x: Math.random() * 500,
            y: Math.random() * 500,
            z: 0,
            rotation: Math.random() * 360
        };
    }
    
    generateSpawnPosition(index) {
        const angle = (index / 5) * Math.PI * 2;
        const radius = 100;
        
        return {
            x: 250 + Math.cos(angle) * radius,
            y: 250 + Math.sin(angle) * radius,
            z: 0
        };
    }
    
    generateInteractionAction(key) {
        const actionMap = {
            'button': 'click',
            'door': 'open',
            'chest': 'loot',
            'terminal': 'access',
            'book': 'read',
            'sign': 'examine'
        };
        
        for (const [keyword, action] of Object.entries(actionMap)) {
            if (key.toLowerCase().includes(keyword)) {
                return action;
            }
        }
        
        return 'interact';
    }
    
    getMaxPlayersForWorld(worldId) {
        const playerLimits = {
            grandExchange: 100,
            shipRektArena: 32,
            tickerTapeFloor: 50,
            revenueVerification: 20,
            unifiedVisualization: 16,
            extensionBridge: 1000
        };
        
        return playerLimits[worldId] || 32;
    }
    
    // API methods for external integration
    async getWorldStatus() {
        return {
            loadedWorlds: this.loadedChunks.size,
            availableTemplates: Object.keys(this.worldTemplates).length,
            cacheSize: this.terrainCache.size,
            worldTemplates: Object.keys(this.worldTemplates)
        };
    }
    
    async exportWorldData(worldId, instanceId) {
        const worldKey = `${worldId}_${instanceId}`;
        const world = this.loadedChunks.get(worldKey);
        
        if (!world) {
            throw new Error('World not loaded');
        }
        
        // Export world data as XML
        const exportData = {
            worldExport: {
                $: {
                    worldId,
                    instanceId,
                    exportTime: new Date().toISOString()
                },
                ...world.data
            }
        };
        
        return this.xmlBuilder.buildObject(exportData);
    }
}

// Export for use as module
module.exports = XMLWorldTerrainSystem;

// CLI interface
if (require.main === module) {
    const worldSystem = new XMLWorldTerrainSystem();
    
    // Example usage
    worldSystem.on('world_loaded', ({ worldId, instanceId }) => {
        console.log(`🎮 World ready for gameplay: ${worldId}`);
    });
    
    // Test loading a world
    setTimeout(async () => {
        try {
            await worldSystem.loadWorldForInstance('grandExchange', 'test_instance_1');
            const status = await worldSystem.getWorldStatus();
            console.log('🗺️ World System Status:', status);
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        }
    }, 2000);
    
    console.log('\n🗺️ XML World Terrain System is running!');
    console.log('🏗️ Converting XML files into explorable game worlds!');
}