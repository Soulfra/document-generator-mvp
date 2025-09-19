#!/usr/bin/env node

/**
 * WORLD INSTANCE MANAGER
 * Manages multiple world instances (Tokyo, NY, London, etc.)
 * Tracks characters in specific worlds with narrative security integration
 * Handles world-specific schemas, classes, and instance management
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class WorldInstanceManager extends EventEmitter {
    constructor() {
        super();
        
        // World registry - each world is an instance
        this.worlds = new Map();
        
        // Character world mapping
        this.characterLocations = new Map();
        
        // Cross-world travel logs
        this.travelLogs = [];
        
        // World instance schemas
        this.worldSchemas = new Map();
        
        // Active instances
        this.activeInstances = new Map();
        
        // World-specific configurations
        this.worldConfigs = new Map();
        
        // Initialize core worlds
        this.initializeCoreWorlds();
        
        console.log('🌍 WORLD INSTANCE MANAGER INITIALIZED');
    }
    
    async initializeCoreWorlds() {
        console.log('🏗️  Initializing core world instances...');
        
        // Tokyo World - Your reference to tokyo
        await this.createWorldInstance('tokyo', {
            name: 'Neo-Tokyo Cyber District',
            description: 'A cyberpunk metropolis where data flows like neon rivers',
            theme: 'cyberpunk',
            color: '#FF1493', // Hot pink neon
            timezone: 'Asia/Tokyo',
            language: 'ja-JP',
            currency: 'YEN',
            coordinates: { lat: 35.6762, lng: 139.6503 },
            zones: {
                'shibuya_crossing': {
                    name: 'Shibuya Data Crossing',
                    type: 'social_hub',
                    description: 'Where information streams intersect',
                    factionControl: 'tech_purists',
                    maxCharacters: 1000,
                    specialFeatures: ['real_time_data_feed', 'holographic_displays']
                },
                'harajuku_district': {
                    name: 'Harajuku Customization Zone',
                    type: 'character_workshop',
                    description: 'Modify your digital persona',
                    factionControl: 'blood_farmers',
                    maxCharacters: 200,
                    specialFeatures: ['character_customization', 'avatar_creation']
                },
                'akihabara_market': {
                    name: 'Akihabara Data Market',
                    type: 'trading_post',
                    description: 'Buy, sell, and trade digital assets',
                    factionControl: 'desert_wanderers',
                    maxCharacters: 500,
                    specialFeatures: ['asset_trading', 'api_marketplace']
                },
                'shinjuku_towers': {
                    name: 'Shinjuku Corporate Towers',
                    type: 'business_district',
                    description: 'High-level data operations',
                    factionControl: 'fitness_council',
                    maxCharacters: 100,
                    specialFeatures: ['executive_access', 'data_analytics']
                }
            },
            socialRules: {
                'respect_protocol': 'Bow before data exchange',
                'communication_style': 'Precise and efficient',
                'conflict_resolution': 'Ritual combat in virtual arenas'
            },
            narrativeContext: {
                questLine: 'tokyo_cyber_saga',
                mainTheme: 'Technology vs Humanity',
                currentSeason: 'Neon Winter'
            }
        });
        
        // Bloot World - Your reference to bloot
        await this.createWorldInstance('bloot', {
            name: 'Bloot Biomedical Research Station',
            description: 'A floating lab where blood becomes data',
            theme: 'biopunk',
            color: '#8B0000', // Dark red
            timezone: 'UTC',
            language: 'en-US',
            currency: 'BLOOD_CREDITS',
            coordinates: { lat: 0.0, lng: 0.0 }, // Floating station
            zones: {
                'cultivation_pods': {
                    name: 'Blood Cultivation Pods',
                    type: 'farming_zone',
                    description: 'Where blood crops are grown and harvested',
                    factionControl: 'blood_farmers',
                    maxCharacters: 50,
                    specialFeatures: ['blood_farming', 'crop_optimization']
                },
                'purification_chambers': {
                    name: 'Purification Chambers',
                    type: 'processing_zone',
                    description: 'Cleanse corrupted blood samples',
                    factionControl: 'blood_farmers',
                    maxCharacters: 25,
                    specialFeatures: ['vampire_cleansing', 'data_purification']
                },
                'diamond_forge': {
                    name: 'Blood Diamond Forge',
                    type: 'crafting_zone',
                    description: 'Compress blood into valuable diamonds',
                    factionControl: 'blood_farmers',
                    maxCharacters: 10,
                    specialFeatures: ['value_extraction', 'compression_algorithms']
                },
                'research_lab': {
                    name: 'Bio-Data Research Lab',
                    type: 'analysis_zone',
                    description: 'Study the intersection of biology and data',
                    factionControl: 'tech_purists',
                    maxCharacters: 30,
                    specialFeatures: ['bio_analysis', 'research_protocols']
                }
            },
            socialRules: {
                'blood_etiquette': 'Handle blood data with reverence',
                'safety_protocols': 'Always wear protective gear in labs',
                'sharing_rules': 'Research data is communal property'
            },
            narrativeContext: {
                questLine: 'blood_harvest_saga',
                mainTheme: 'Life force as information',
                currentSeason: 'Harvest Moon'
            }
        });
        
        // Desert Oasis - Your Al Kharid reference
        await this.createWorldInstance('desert_oasis', {
            name: 'Al Kharid Timing Oasis',
            description: 'Ancient desert city where time flows differently',
            theme: 'desert_fantasy',
            color: '#F4A460', // Sandy brown
            timezone: 'Asia/Riyadh',
            language: 'ar-SA',
            currency: 'TIME_CRYSTALS',
            coordinates: { lat: 24.7136, lng: 46.6753 },
            zones: {
                'water_gardens': {
                    name: 'Synchronization Water Gardens',
                    type: 'timing_zone',
                    description: 'Where all system clocks align',
                    factionControl: 'desert_wanderers',
                    maxCharacters: 200,
                    specialFeatures: ['time_sync', 'rhythm_matching']
                },
                'caravan_routes': {
                    name: 'Data Caravan Routes',
                    type: 'transport_zone',
                    description: 'Information highways across the digital desert',
                    factionControl: 'desert_wanderers',
                    maxCharacters: 300,
                    specialFeatures: ['data_transport', 'route_optimization']
                },
                'palace_courts': {
                    name: 'Sultan\'s Computing Palace',
                    type: 'governance_zone',
                    description: 'Central command for desert operations',
                    factionControl: 'desert_wanderers',
                    maxCharacters: 50,
                    specialFeatures: ['central_control', 'policy_management']
                },
                'training_grounds': {
                    name: 'Presidential Fitness Grounds',
                    type: 'training_zone',
                    description: 'Where systems prove their performance',
                    factionControl: 'fitness_council',
                    maxCharacters: 100,
                    specialFeatures: ['performance_testing', 'benchmarking']
                }
            },
            socialRules: {
                'time_respect': 'Never waste another\'s time',
                'hospitality': 'Share resources with travelers',
                'honor_system': 'Promises are binding contracts'
            },
            narrativeContext: {
                questLine: 'desert_timing_saga',
                mainTheme: 'Mastery of time and rhythm',
                currentSeason: 'Endless Summer'
            }
        });
        
        console.log(`✅ Initialized ${this.worlds.size} world instances`);
        this.logWorldSummary();
    }
    
    /**
     * Create a new world instance
     */
    async createWorldInstance(worldId, config) {
        const world = {
            id: worldId,
            ...config,
            createdAt: Date.now(),
            lastUpdated: Date.now(),
            status: 'active',
            population: 0,
            characters: new Set(),
            activeEvents: [],
            worldState: {},
            instanceId: crypto.randomBytes(8).toString('hex')
        };
        
        // Initialize world state
        world.worldState = {
            time: Date.now(),
            weather: this.generateWeather(config.theme),
            eventFlags: new Set(),
            resourceLevels: this.generateResources(config.theme),
            socialMood: 'neutral'
        };
        
        // Store world
        this.worlds.set(worldId, world);
        this.activeInstances.set(world.instanceId, worldId);
        
        console.log(`🌍 Created world: ${config.name} (${worldId})`);
        console.log(`   Theme: ${config.theme}`);
        console.log(`   Zones: ${Object.keys(config.zones).length}`);
        console.log(`   Instance ID: ${world.instanceId}`);
        
        // Emit world creation event
        this.emit('world_created', { worldId, world });
        
        return world;
    }
    
    /**
     * Add character to a world
     */
    async addCharacterToWorld(characterId, worldId, zoneId = null) {
        const world = this.worlds.get(worldId);
        if (!world) {
            throw new Error(`World ${worldId} not found`);
        }
        
        // Remove character from current world if exists
        const currentLocation = this.characterLocations.get(characterId);
        if (currentLocation) {
            await this.removeCharacterFromWorld(characterId);
        }
        
        // Add to new world
        world.characters.add(characterId);
        world.population++;
        
        // Set character location
        const location = {
            worldId,
            zoneId: zoneId || Object.keys(world.zones)[0], // Default to first zone
            joinedAt: Date.now(),
            coordinates: this.generateCoordinates(world, zoneId),
            status: 'active'
        };
        
        this.characterLocations.set(characterId, location);
        
        // Log travel
        this.travelLogs.push({
            characterId,
            action: 'enter',
            worldId,
            zoneId: location.zoneId,
            timestamp: Date.now(),
            coordinates: location.coordinates
        });
        
        console.log(`👤 ${characterId} entered ${world.name} → ${world.zones[location.zoneId].name}`);
        
        // Emit character arrival event
        this.emit('character_arrived', {
            characterId,
            worldId,
            zoneId: location.zoneId,
            world
        });
        
        // Check zone capacity
        await this.checkZoneCapacity(worldId, location.zoneId);
        
        return location;
    }
    
    /**
     * Move character between zones within a world
     */
    async moveCharacterToZone(characterId, newZoneId) {
        const location = this.characterLocations.get(characterId);
        if (!location) {
            throw new Error(`Character ${characterId} not in any world`);
        }
        
        const world = this.worlds.get(location.worldId);
        const newZone = world.zones[newZoneId];
        
        if (!newZone) {
            throw new Error(`Zone ${newZoneId} not found in world ${location.worldId}`);
        }
        
        // Check zone access permissions
        const hasAccess = await this.checkZoneAccess(characterId, location.worldId, newZoneId);
        if (!hasAccess.allowed) {
            console.log(`❌ ${characterId} denied access to ${newZone.name}: ${hasAccess.reason}`);
            return { success: false, reason: hasAccess.reason };
        }
        
        // Update location
        const oldZoneId = location.zoneId;
        location.zoneId = newZoneId;
        location.coordinates = this.generateCoordinates(world, newZoneId);
        location.lastMoved = Date.now();
        
        // Log movement
        this.travelLogs.push({
            characterId,
            action: 'move',
            worldId: location.worldId,
            fromZone: oldZoneId,
            toZone: newZoneId,
            timestamp: Date.now(),
            coordinates: location.coordinates
        });
        
        console.log(`🚶 ${characterId} moved: ${world.zones[oldZoneId].name} → ${newZone.name}`);
        
        // Emit movement event
        this.emit('character_moved', {
            characterId,
            worldId: location.worldId,
            fromZone: oldZoneId,
            toZone: newZoneId
        });
        
        return { success: true, location };
    }
    
    /**
     * Check if character can access a zone (faction-based)
     */
    async checkZoneAccess(characterId, worldId, zoneId) {
        const world = this.worlds.get(worldId);
        const zone = world.zones[zoneId];
        
        // Basic access - always allow public zones
        if (zone.type === 'social_hub') {
            return { allowed: true, reason: 'Public zone' };
        }
        
        // Check faction control
        if (zone.factionControl) {
            // This would integrate with your faction system
            // For now, simulate faction check
            const hasFactionAccess = Math.random() > 0.3; // 70% success rate
            
            if (!hasFactionAccess) {
                return {
                    allowed: false,
                    reason: `Requires ${zone.factionControl} faction membership`
                };
            }
        }
        
        // Check zone capacity
        const currentOccupants = Array.from(world.characters).filter(charId => {
            const loc = this.characterLocations.get(charId);
            return loc && loc.zoneId === zoneId;
        });
        
        if (currentOccupants.length >= zone.maxCharacters) {
            return { allowed: false, reason: 'Zone at capacity' };
        }
        
        return { allowed: true, reason: 'Access granted' };
    }
    
    /**
     * Get character's current world and zone info
     */
    getCharacterLocation(characterId) {
        const location = this.characterLocations.get(characterId);
        if (!location) return null;
        
        const world = this.worlds.get(location.worldId);
        const zone = world.zones[location.zoneId];
        
        return {
            character: characterId,
            world: {
                id: location.worldId,
                name: world.name,
                theme: world.theme
            },
            zone: {
                id: location.zoneId,
                name: zone.name,
                type: zone.type,
                description: zone.description
            },
            coordinates: location.coordinates,
            joinedAt: location.joinedAt,
            status: location.status
        };
    }
    
    /**
     * Get all characters in a specific world/zone
     */
    getCharactersInZone(worldId, zoneId = null) {
        const world = this.worlds.get(worldId);
        if (!world) return [];
        
        const characters = [];
        
        for (const characterId of world.characters) {
            const location = this.characterLocations.get(characterId);
            if (location && (zoneId === null || location.zoneId === zoneId)) {
                characters.push({
                    characterId,
                    location: this.getCharacterLocation(characterId)
                });
            }
        }
        
        return characters;
    }
    
    /**
     * Generate coordinates within a zone
     */
    generateCoordinates(world, zoneId) {
        const zone = world.zones[zoneId];
        
        // Generate coordinates within zone bounds
        return {
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            z: zone.type === 'social_hub' ? Math.random() * 100 : 0 // Height for social areas
        };
    }
    
    /**
     * Generate weather appropriate to world theme
     */
    generateWeather(theme) {
        const weatherPatterns = {
            'cyberpunk': ['neon_rain', 'electric_fog', 'data_storm', 'clear_digital'],
            'biopunk': ['blood_mist', 'spore_clouds', 'bio_rain', 'sterile_air'],
            'desert_fantasy': ['sandstorm', 'heat_wave', 'cool_breeze', 'starlight']
        };
        
        const patterns = weatherPatterns[theme] || ['clear', 'cloudy', 'rainy'];
        return patterns[Math.floor(Math.random() * patterns.length)];
    }
    
    /**
     * Generate theme-appropriate resources
     */
    generateResources(theme) {
        const resourceTypes = {
            'cyberpunk': { bandwidth: 85, processing_power: 92, data_storage: 67 },
            'biopunk': { blood_quality: 78, cultivation_space: 55, purity_level: 89 },
            'desert_fantasy': { water_reserves: 45, time_crystals: 71, sync_stability: 88 }
        };
        
        return resourceTypes[theme] || { energy: 50, materials: 50, population: 50 };
    }
    
    /**
     * Check zone capacity and manage overflow
     */
    async checkZoneCapacity(worldId, zoneId) {
        const occupants = this.getCharactersInZone(worldId, zoneId);
        const world = this.worlds.get(worldId);
        const zone = world.zones[zoneId];
        
        if (occupants.length > zone.maxCharacters) {
            console.log(`⚠️  Zone ${zone.name} over capacity: ${occupants.length}/${zone.maxCharacters}`);
            
            // Emit capacity warning
            this.emit('zone_overcapacity', {
                worldId,
                zoneId,
                occupants: occupants.length,
                maxCapacity: zone.maxCharacters
            });
        }
    }
    
    /**
     * Remove character from world
     */
    async removeCharacterFromWorld(characterId) {
        const location = this.characterLocations.get(characterId);
        if (!location) return;
        
        const world = this.worlds.get(location.worldId);
        world.characters.delete(characterId);
        world.population--;
        
        // Log departure
        this.travelLogs.push({
            characterId,
            action: 'leave',
            worldId: location.worldId,
            zoneId: location.zoneId,
            timestamp: Date.now()
        });
        
        console.log(`👋 ${characterId} left ${world.name}`);
        
        // Remove location
        this.characterLocations.delete(characterId);
        
        // Emit departure event
        this.emit('character_departed', {
            characterId,
            worldId: location.worldId
        });
    }
    
    /**
     * Get world instance status
     */
    getWorldStatus(worldId) {
        const world = this.worlds.get(worldId);
        if (!world) return null;
        
        // Calculate zone populations
        const zonePopulations = {};
        for (const zoneId of Object.keys(world.zones)) {
            zonePopulations[zoneId] = this.getCharactersInZone(worldId, zoneId).length;
        }
        
        return {
            world: {
                id: worldId,
                name: world.name,
                theme: world.theme,
                status: world.status
            },
            population: {
                total: world.population,
                byZone: zonePopulations
            },
            state: world.worldState,
            lastUpdated: world.lastUpdated,
            uptime: Date.now() - world.createdAt
        };
    }
    
    /**
     * Log summary of all worlds
     */
    logWorldSummary() {
        console.log('\n🗺️  WORLD INSTANCE SUMMARY:');
        
        for (const [worldId, world] of this.worlds) {
            console.log(`\n${world.color ? `\x1b[38;2;${parseInt(world.color.slice(1,3), 16)};${parseInt(world.color.slice(3,5), 16)};${parseInt(world.color.slice(5,7), 16)}m` : ''}${world.name}\x1b[0m (${worldId})`);
            console.log(`   Theme: ${world.theme} | Population: ${world.population}`);
            console.log(`   Zones: ${Object.keys(world.zones).length} | Status: ${world.status}`);
            console.log(`   Weather: ${world.worldState.weather}`);
        }
        
        console.log(`\n📊 Total active characters: ${this.characterLocations.size}`);
        console.log(`📊 Total travel logs: ${this.travelLogs.length}`);
    }
    
    /**
     * Export world data for backup/analysis
     */
    exportWorldData() {
        return {
            worlds: Object.fromEntries(this.worlds),
            characterLocations: Object.fromEntries(this.characterLocations),
            travelLogs: this.travelLogs,
            activeInstances: Object.fromEntries(this.activeInstances),
            exportedAt: Date.now()
        };
    }
}

// Export for use in other systems
module.exports = WorldInstanceManager;

// Demo functionality
if (require.main === module) {
    async function runDemo() {
        console.log('🎮 WORLD INSTANCE MANAGER DEMO\n');
        
        const worldManager = new WorldInstanceManager();
        
        // Add some characters to different worlds
        console.log('\n👥 ADDING CHARACTERS TO WORLDS:');
        await worldManager.addCharacterToWorld('alice', 'tokyo', 'shibuya_crossing');
        await worldManager.addCharacterToWorld('bob', 'bloot', 'cultivation_pods');
        await worldManager.addCharacterToWorld('charlie', 'desert_oasis', 'water_gardens');
        await worldManager.addCharacterToWorld('eve', 'tokyo', 'harajuku_district');
        
        // Move characters between zones
        console.log('\n🚶 CHARACTER MOVEMENT:');
        await worldManager.moveCharacterToZone('alice', 'akihabara_market');
        await worldManager.moveCharacterToZone('bob', 'diamond_forge');
        
        // Show character locations
        console.log('\n📍 CHARACTER LOCATIONS:');
        for (const characterId of ['alice', 'bob', 'charlie', 'eve']) {
            const location = worldManager.getCharacterLocation(characterId);
            if (location) {
                console.log(`   ${characterId}: ${location.world.name} → ${location.zone.name}`);
            }
        }
        
        // Show world status
        console.log('\n📊 WORLD STATUS:');
        for (const worldId of ['tokyo', 'bloot', 'desert_oasis']) {
            const status = worldManager.getWorldStatus(worldId);
            console.log(`   ${status.world.name}: ${status.population.total} characters`);
        }
        
        // Show zone populations
        console.log('\n🏙️  ZONE POPULATIONS:');
        const tokyoChars = worldManager.getCharactersInZone('tokyo');
        console.log(`   Tokyo total: ${tokyoChars.length} characters`);
        tokyoChars.forEach(char => {
            console.log(`     - ${char.characterId} in ${char.location.zone.name}`);
        });
        
        console.log('\n✨ World management demonstration complete!');
    }
    
    runDemo().catch(console.error);
}