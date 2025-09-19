#!/usr/bin/env node

/**
 * 🏗️ RING ARCHITECTURE MAPPER
 * Maps existing systems into Ring 0 (Back/Core), Ring 1 (Middle/Logic), Ring 2 (Front/UI)
 * Transforms character tiers into dependency architecture layers
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class RingArchitectureMapper extends EventEmitter {
    constructor() {
        super();
        
        // Ring-based system classification
        this.ringMappings = {
            // RING 0: BACK/CORE - Core dependencies, data, no UI dependencies
            0: {
                name: 'Core/Backend Layer',
                description: 'Dependency-free core systems, databases, APIs, fundamental services',
                color: '#FFD700', // Gold - represents foundational value
                systems: new Map(),
                dependencies: [], // Ring 0 has NO dependencies
                characteristics: [
                    'No user interface dependencies',
                    'Can run independently', 
                    'Provides data/services to other rings',
                    'Database systems, APIs, core logic',
                    'BlameChain, authentication, storage'
                ]
            },
            
            // RING 1: MIDDLE/LOGIC - Business logic, can depend on Ring 0
            1: {
                name: 'Logic/Processing Layer', 
                description: 'Business logic, game engines, AI processing, validation systems',
                color: '#00FF00', // Green - represents processing/active systems
                systems: new Map(),
                dependencies: [0], // Can depend on Ring 0 only
                characteristics: [
                    'Business logic and processing',
                    'Game engines and AI systems',
                    'Can use Ring 0 services',
                    'No direct UI dependencies',
                    'Validation, computation, orchestration'
                ]
            },
            
            // RING 2: FRONT/UI - User interfaces, can depend on Ring 0+1
            2: {
                name: 'Frontend/UI Layer',
                description: 'User interfaces, presentation, display systems, user experience',
                color: '#FF4500', // Orange Red - represents user-facing systems
                systems: new Map(),
                dependencies: [0, 1], // Can depend on Ring 0 and Ring 1
                characteristics: [
                    'User interfaces and presentation',
                    'Web, mobile, desktop, AR/VR',
                    'Can use Ring 0 and Ring 1 services',
                    'Display, interaction, visualization',
                    'Dashboards, games, apps'
                ]
            }
        };
        
        // System registry with Ring classifications
        this.systemRegistry = new Map();
        
        // Dependency graph
        this.dependencyGraph = new Map();
        
        console.log('🏗️ Ring Architecture Mapper initialized');
        this.scanExistingSystems();
    }
    
    /**
     * Scan and classify all existing systems
     */
    async scanExistingSystems() {
        console.log('🔍 Scanning existing systems for Ring classification...\n');
        
        // RING 0 SYSTEMS (Core/Backend)
        this.registerSystem({
            id: 'blamechain',
            name: 'BlameChain Core',
            ring: 0,
            file: 'blamechain.js',
            type: 'core_system',
            description: 'Dependency-free component registration and blame assignment',
            dependencies: [],
            provides: ['component_registry', 'karma_tracking', 'zombie_detection'],
            ports: []
        });
        
        this.registerSystem({
            id: 'kingdom_authority',
            name: 'Kingdom Authority System', 
            ring: 0,
            file: 'kingdom-authority-system.js',
            type: 'permission_system',
            description: 'User hierarchy and permission system (EXILE→KING)',
            dependencies: [],
            provides: ['user_permissions', 'hierarchy_levels', 'reputation_tracking'],
            ports: []
        });
        
        this.registerSystem({
            id: 'database_core',
            name: 'Database Systems',
            ring: 0,
            type: 'data_storage',
            description: 'PostgreSQL, Redis, MinIO core data storage',
            dependencies: [],
            provides: ['data_persistence', 'caching', 'file_storage'],
            ports: [5432, 6379, 9000]
        });
        
        this.registerSystem({
            id: 'authentication',
            name: 'Authentication Core',
            ring: 0,
            file: 'device-pairing-authenticator.js',
            type: 'security',
            description: 'Device pairing and authentication services',
            dependencies: [],
            provides: ['device_auth', 'qr_pairing', 'security_tokens'],
            ports: [11111, 42004]
        });
        
        // RING 1 SYSTEMS (Logic/Processing)  
        this.registerSystem({
            id: 'multi_ring_characters',
            name: 'Multi-Ring Character Evolution',
            ring: 1,
            file: 'multi-ring-character-evolution.js',
            type: 'game_logic',
            description: 'Character evolution and progression logic',
            dependencies: [0], // Depends on Ring 0 (BlameChain, Kingdom Authority)
            provides: ['character_evolution', 'team_mechanics', 'ability_system'],
            ports: []
        });
        
        this.registerSystem({
            id: 'boss_character_integration',
            name: 'Boss Character System',
            ring: 1,
            file: 'boss-character-integration.js', 
            type: 'game_logic',
            description: 'Boss AI, spawn mechanics, game integration',
            dependencies: [0], // Depends on Ring 0 (Kingdom Authority)
            provides: ['boss_ai', 'spawn_mechanics', 'battle_logic'],
            ports: []
        });
        
        this.registerSystem({
            id: 'ai_orchestration',
            name: 'AI Orchestration Layer',
            ring: 1,
            file: 'anonymous-ai-orchestration-layer.js',
            type: 'ai_processing',
            description: 'AI model routing and processing',
            dependencies: [0], // Depends on Ring 0 (authentication, data)
            provides: ['ai_routing', 'model_selection', 'response_processing'],
            ports: [3001]
        });
        
        this.registerSystem({
            id: 'character_processing',
            name: 'Character Processing Pipeline',
            ring: 1,
            type: 'image_processing',
            description: 'Selfie→ASCII→Voxel character processing',
            dependencies: [0], // Depends on Ring 0 (file storage, auth)
            provides: ['image_processing', 'character_generation', 'template_matching'],
            ports: [42007]
        });
        
        // RING 2 SYSTEMS (Frontend/UI)
        this.registerSystem({
            id: 'castle_crashers_hex_world',
            name: 'Castle Crashers Hex World',
            ring: 2,
            file: 'castle-crashers-hex-world.js',
            type: 'game_ui',
            description: 'Visual hex grid interface for character evolution',
            dependencies: [0, 1], // Depends on Ring 0 (auth) and Ring 1 (characters)
            provides: ['visual_interface', 'character_display', 'evolution_ui'],
            ports: [8302]
        });
        
        this.registerSystem({
            id: 'universal_display_kernel',
            name: 'Universal Display Kernel',
            ring: 2,
            file: 'UNIVERSAL-DISPLAY-KERNEL.js',
            type: 'display_system', 
            description: 'Cross-system display management and responsive layouts',
            dependencies: [0, 1], // Depends on Ring 0 and Ring 1
            provides: ['responsive_ui', 'cross_platform_display', 'layout_management'],
            ports: []
        });
        
        this.registerSystem({
            id: 'hex_world_visualizer',
            name: 'Hex World Visualizer',
            ring: 2,
            file: 'hex-world-backend-visualizer.js',
            type: 'visualization',
            description: 'Backend system visualization in hex world format', 
            dependencies: [0, 1], // Depends on Ring 0 (BlameChain) and Ring 1 (processing)
            provides: ['system_visualization', 'backend_display', 'component_mapping'],
            ports: [8300]
        });
        
        this.registerSystem({
            id: 'selfie_pixel_interface',
            name: 'Selfie-to-Pixel Interface',
            ring: 2,
            file: 'SELFIE-TO-PIXEL-CHARACTER-SYSTEM.js',
            type: 'user_interface',
            description: 'Web interface for selfie character creation',
            dependencies: [0, 1], // Depends on Ring 0 (auth, storage) and Ring 1 (processing)
            provides: ['photo_upload', 'character_preview', 'template_selection'],
            ports: [42007]
        });
        
        this.analyzeSystemArchitecture();
    }
    
    /**
     * Register a system in the appropriate ring
     */
    registerSystem(systemConfig) {
        const { id, ring } = systemConfig;
        
        // Add to ring mapping
        this.ringMappings[ring].systems.set(id, systemConfig);
        
        // Add to main registry
        this.systemRegistry.set(id, systemConfig);
        
        // Register dependencies
        this.dependencyGraph.set(id, systemConfig.dependencies || []);
        
        console.log(`📦 Ring ${ring}: ${systemConfig.name} (${systemConfig.type})`);
        
        this.emit('system_registered', systemConfig);
    }
    
    /**
     * Analyze the overall system architecture
     */
    analyzeSystemArchitecture() {
        console.log('\n🏗️ RING ARCHITECTURE ANALYSIS');
        console.log('================================\n');
        
        // Ring summary
        Object.entries(this.ringMappings).forEach(([ringNum, ring]) => {
            console.log(`🔴 RING ${ringNum}: ${ring.name}`);
            console.log(`   📝 ${ring.description}`);
            console.log(`   🎨 Color: ${ring.color}`);
            console.log(`   📊 Systems: ${ring.systems.size}`);
            console.log(`   🔗 Can depend on: Ring ${ring.dependencies.join(', ') || 'None (independent)'}`);
            
            // List systems
            ring.systems.forEach((system, id) => {
                const dependsOn = system.dependencies.length > 0 
                    ? ` (depends on Ring ${system.dependencies.join(', ')})` 
                    : ' (independent)';
                console.log(`      • ${system.name}${dependsOn}`);
            });
            console.log('');
        });
        
        // Dependency validation
        console.log('🔍 DEPENDENCY VALIDATION');
        console.log('=========================');
        this.validateDependencies();
        
        // Architecture recommendations
        console.log('\n💡 ARCHITECTURE RECOMMENDATIONS');  
        console.log('================================');
        this.generateRecommendations();
    }
    
    /**
     * Validate that dependencies follow Ring rules
     */
    validateDependencies() {
        let violations = 0;
        
        this.systemRegistry.forEach((system, id) => {
            const systemRing = system.ring;
            const allowedDependencies = this.ringMappings[systemRing].dependencies;
            
            system.dependencies.forEach(depRing => {
                if (!allowedDependencies.includes(depRing)) {
                    console.log(`❌ VIOLATION: ${system.name} (Ring ${systemRing}) cannot depend on Ring ${depRing}`);
                    violations++;
                }
            });
        });
        
        if (violations === 0) {
            console.log('✅ All dependency rules validated successfully!');
        } else {
            console.log(`⚠️ Found ${violations} dependency violations`);
        }
    }
    
    /**
     * Generate architecture recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        
        // Ring 0 independence check
        const ring0Systems = this.ringMappings[0].systems;
        ring0Systems.forEach((system, id) => {
            if (system.dependencies.length > 0) {
                recommendations.push(`🔧 Move dependencies out of ${system.name} to maintain Ring 0 independence`);
            }
        });
        
        // Ring balance check
        const ring0Count = this.ringMappings[0].systems.size;
        const ring1Count = this.ringMappings[1].systems.size;  
        const ring2Count = this.ringMappings[2].systems.size;
        
        if (ring0Count < 3) {
            recommendations.push('📈 Consider adding more core Ring 0 systems for better foundation');
        }
        
        if (ring2Count > ring1Count * 2) {
            recommendations.push('⚖️ UI systems (Ring 2) may be too heavy - consider consolidation');
        }
        
        // Missing integrations
        recommendations.push('🔗 Create unified character database spanning all rings');
        recommendations.push('🎭 Add MBTI personality system to Ring 0 core attributes');
        recommendations.push('🌉 Build cross-ring character evolution pipeline');
        
        if (recommendations.length === 0) {
            console.log('✨ Architecture is well-balanced! No major recommendations.');
        } else {
            recommendations.forEach(rec => console.log(rec));
        }
    }
    
    /**
     * Get systems by ring
     */
    getSystemsByRing(ringNumber) {
        return Array.from(this.ringMappings[ringNumber].systems.values());
    }
    
    /**
     * Get full architecture map
     */
    getArchitectureMap() {
        return {
            rings: this.ringMappings,
            systems: Array.from(this.systemRegistry.values()),
            dependencies: Array.from(this.dependencyGraph.entries()),
            summary: {
                totalSystems: this.systemRegistry.size,
                ring0Count: this.ringMappings[0].systems.size,
                ring1Count: this.ringMappings[1].systems.size, 
                ring2Count: this.ringMappings[2].systems.size,
                independentSystems: this.getSystemsByRing(0).length,
                uiSystems: this.getSystemsByRing(2).length
            }
        };
    }
    
    /**
     * Export architecture documentation
     */
    exportArchitectureMap() {
        const map = this.getArchitectureMap();
        const exportPath = path.join(__dirname, 'RING-ARCHITECTURE-MAP.json');
        
        fs.writeFileSync(exportPath, JSON.stringify(map, null, 2));
        console.log(`\n📊 Architecture map exported to: ${exportPath}`);
        
        return map;
    }
}

// Auto-run if executed directly
if (require.main === module) {
    console.log('🏗️ RING ARCHITECTURE MAPPER');
    console.log('============================\n');
    
    const mapper = new RingArchitectureMapper();
    
    // Export the architecture map
    const architectureMap = mapper.exportArchitectureMap();
    
    console.log('\n🎯 SUMMARY');
    console.log('==========');
    console.log(`📦 Total Systems: ${architectureMap.summary.totalSystems}`);
    console.log(`🏗️ Ring 0 (Core): ${architectureMap.summary.ring0Count} systems`);
    console.log(`⚙️ Ring 1 (Logic): ${architectureMap.summary.ring1Count} systems`);
    console.log(`🖥️ Ring 2 (UI): ${architectureMap.summary.ring2Count} systems`);
    console.log(`🔒 Independent: ${architectureMap.summary.independentSystems} systems`);
    
    console.log('\n✨ Ring Architecture Mapping Complete!');
}

module.exports = RingArchitectureMapper;