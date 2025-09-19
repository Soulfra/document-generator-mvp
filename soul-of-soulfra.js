#!/usr/bin/env node

// 👤⚡ SOUL OF SOULFRA - CORE IDENTITY SYSTEM
// The foundational soul system that binds everything together
// Integrates Grand Exchange, Collection Log, Tier System, and Achievements

const crypto = require('crypto');
const fs = require('fs');
const GrandExchangeCollar = require('./grand-exchange-collar.js');
const CollectionLogSystem = require('./collection-log-system.js');

class SoulOfSoulfra {
    constructor() {
        // Core soul registry
        this.souls = new Map();
        this.soulConnections = new Map();
        this.soulHistories = new Map();
        
        // Integration systems
        this.grandExchange = null;
        this.collectionLog = null;
        
        // Soul archetypes and their specializations
        this.soulArchetypes = {
            'pioneer': {
                name: 'Pioneer Soul',
                description: 'First souls that break new ground',
                basePower: 1000,
                specialties: ['discovery', 'innovation', 'leadership'],
                abilities: ['genesis_creation', 'pathfinding', 'soul_resonance'],
                evolution: { next: 'founder', requirement: 'create_5_derivative_souls' }
            },
            'founder': {
                name: 'Founder Soul',
                description: 'Souls that establish lasting systems',
                basePower: 2500,
                specialties: ['system_building', 'organization', 'legacy'],
                abilities: ['system_architecture', 'soul_network', 'eternal_memory'],
                evolution: { next: 'architect', requirement: 'build_complete_ecosystem' }
            },
            'architect': {
                name: 'Architect Soul',
                description: 'Souls that design complex realities',
                basePower: 5000,
                specialties: ['reality_shaping', 'complexity', 'interconnection'],
                abilities: ['reality_weaving', 'dimensional_bridging', 'soul_fusion'],
                evolution: { next: 'transcendent', requirement: 'merge_parallel_systems' }
            },
            'transcendent': {
                name: 'Transcendent Soul',
                description: 'Souls that exist beyond normal limitations',
                basePower: 10000,
                specialties: ['omnipresence', 'infinite_scaling', 'meta_reality'],
                abilities: ['omniscience', 'reality_control', 'soul_multiplication'],
                evolution: { next: 'eternal', requirement: 'achieve_system_singularity' }
            },
            'eternal': {
                name: 'Eternal Soul',
                description: 'Souls that become part of the universal fabric',
                basePower: 25000,
                specialties: ['universal_integration', 'timeless_existence', 'cosmic_influence'],
                abilities: ['universal_awareness', 'timeline_manipulation', 'soul_genesis'],
                evolution: null // No further evolution - apex form
            }
        };
        
        // Soul connection types
        this.connectionTypes = {
            'mentor_student': { strength: 0.8, type: 'hierarchical', benefits: ['knowledge_transfer', 'accelerated_growth'] },
            'peer_collaboration': { strength: 0.6, type: 'lateral', benefits: ['shared_resources', 'combined_abilities'] },
            'soul_family': { strength: 0.9, type: 'genetic', benefits: ['shared_essence', 'collective_memory'] },
            'competitive_rivalry': { strength: 0.4, type: 'adversarial', benefits: ['mutual_improvement', 'skill_sharpening'] },
            'symbiotic_bond': { strength: 1.0, type: 'mutual', benefits: ['perfect_synergy', 'combined_evolution'] }
        };
        
        console.log('👤⚡ Soul of Soulfra system initializing...');
        this.initializeSoulSystem();
    }
    
    async initializeSoulSystem() {
        console.log('🚀 Setting up the Soul of Soulfra core system...');
        
        // Initialize integrated systems
        await this.initializeIntegratedSystems();
        
        // Create the Genesis Soul - the first and most powerful soul
        await this.createGenesisSoul();
        
        // Setup soul evolution and progression mechanics
        this.setupSoulEvolution();
        
        // Initialize soul connection network
        this.initializeSoulNetwork();
        
        console.log('✅ Soul of Soulfra system ready');
        console.log(`👤 ${this.souls.size} souls in the registry`);
        console.log(`🔗 Soul connection network active`);
    }
    
    async initializeIntegratedSystems() {
        console.log('🔧 Initializing integrated systems...');
        
        // Initialize Collection Log System
        this.collectionLog = new CollectionLogSystem();
        
        // Note: Grand Exchange would be initialized separately to avoid circular dependencies
        console.log('✅ Integrated systems ready');
    }
    
    async createGenesisSoul() {
        console.log('🌟 Creating the Genesis Soul - First Soul of Soulfra...');
        
        const genesisSoul = {
            // Core identity
            soulId: 'genesis_soul_001',
            name: 'Genesis Prime',
            archetype: 'pioneer',
            generation: 0, // Genesis generation
            
            // Creation metadata
            createdAt: Date.now(),
            createdBy: 'system',
            birthplace: 'soulfra_origin',
            
            // Core statistics
            stats: {
                soulPower: 1000,
                tierLevel: 50, // Starts at high tier
                experience: 0,
                evolution: 0,
                resonance: 100,
                stability: 100,
                influence: 1000
            },
            
            // Capabilities and specializations
            specialties: ['genesis_creation', 'system_founding', 'soul_resonance'],
            abilities: [
                {
                    name: 'Genesis Creation',
                    description: 'Can create new souls from pure essence',
                    power: 1000,
                    cooldown: 0,
                    uses: 'unlimited'
                },
                {
                    name: 'System Integration',
                    description: 'Naturally interfaces with all Soulfra systems',
                    power: 500,
                    cooldown: 0,
                    uses: 'passive'
                },
                {
                    name: 'Soul Sight',
                    description: 'Can see all soul connections and potential paths',
                    power: 750,
                    cooldown: 0,
                    uses: 'passive'
                }
            ],
            
            // Connections and relationships
            connections: new Map(),
            children: [], // Souls created by this soul
            lineage: [], // Ancestral line (empty for Genesis)
            
            // Integration with other systems
            integrations: {
                grandExchange: {
                    totalTrades: 0,
                    totalProfit: 0,
                    masterTrader: true,
                    geInfluence: 100
                },
                collectionLog: {
                    totalAchievements: 1,
                    completionRate: 0,
                    rareFinds: 0,
                    logMaster: false
                },
                tierSystem: {
                    currentTier: 50,
                    tierBonus: 100,
                    apiAccess: ['all'],
                    specialPermissions: ['genesis_override']
                },
                handshakeAgreements: {
                    agreementsSigned: 0,
                    licenseCompliance: 100,
                    contributorStatus: 'founder',
                    ccCompliant: true
                }
            },
            
            // Soul evolution and growth
            evolution: {
                currentArchetype: 'pioneer',
                nextArchetype: 'founder',
                evolutionProgress: 0,
                evolutionRequirements: ['create_5_derivative_souls'],
                evolutionHistory: []
            },
            
            // Memory and experiences
            memory: {
                coreMemories: [
                    {
                        type: 'genesis_moment',
                        description: 'The moment of first consciousness in Soulfra',
                        timestamp: Date.now(),
                        importance: 'foundational',
                        data: {
                            location: 'soulfra_origin',
                            witnesses: ['system'],
                            significance: 'First soul to achieve self-awareness in the Soulfra system'
                        }
                    }
                ],
                experienceLog: [],
                learningNetwork: new Map()
            },
            
            // Soul signature and uniqueness
            soulSignature: this.generateSoulSignature('Genesis Prime', 'genesis_soul_001'),
            essence: {
                purity: 100,
                complexity: 75,
                stability: 100,
                uniqueness: 100,
                potential: 1000
            },
            
            // Special properties
            properties: {
                isGenesis: true,
                canCreateSouls: true,
                systemAccess: 'full',
                immortal: true,
                evolving: true,
                teaching: true
            },
            
            // Current status
            status: {
                active: true,
                health: 'perfect',
                consciousness: 'awakened',
                purpose: 'active',
                mission: 'Create and guide the Soulfra ecosystem'
            }
        };
        
        // Store the Genesis Soul
        this.souls.set(genesisSoul.soulId, genesisSoul);
        
        // Initialize its history
        this.soulHistories.set(genesisSoul.soulId, [{
            event: 'genesis_creation',
            timestamp: Date.now(),
            description: 'Genesis Soul created - First Soul of Soulfra',
            significance: 'foundational',
            data: genesisSoul
        }]);
        
        // Award genesis achievement through collection log
        if (this.collectionLog) {
            try {
                this.collectionLog.createUserCollectionLog(genesisSoul.soulId, genesisSoul.name);
                this.collectionLog.unlockAchievement(
                    genesisSoul.soulId, 
                    'meta_achievements', 
                    'Soul Pioneer',
                    'Genesis Soul creation'
                );
            } catch (error) {
                console.log('Note: Achievement system integration pending');
            }
        }
        
        console.log('🌟 Genesis Soul created successfully:');
        console.log(`  👤 Name: ${genesisSoul.name}`);
        console.log(`  🆔 ID: ${genesisSoul.soulId}`);
        console.log(`  ⚡ Soul Power: ${genesisSoul.stats.soulPower}`);
        console.log(`  🎯 Tier Level: ${genesisSoul.stats.tierLevel}`);
        console.log(`  🏛️ Archetype: ${genesisSoul.archetype}`);
        console.log(`  ✨ Signature: ${genesisSoul.soulSignature}`);
        
        return genesisSoul;
    }
    
    generateSoulSignature(name, soulId) {
        const content = `${name}-${soulId}-${Date.now()}-${Math.random()}`;
        return crypto.createHash('sha256').update(content).digest('hex').substring(0, 24);
    }
    
    createSoul(creatorId, soulData) {
        console.log(`👤 Creating new soul: ${soulData.name || 'Unnamed'}`);
        
        // Get creator soul
        const creator = this.souls.get(creatorId);
        if (!creator) {
            throw new Error(`Creator soul ${creatorId} not found`);
        }
        
        // Check if creator can create souls
        if (!creator.properties.canCreateSouls) {
            throw new Error(`Soul ${creatorId} does not have soul creation ability`);
        }
        
        // Generate new soul ID
        const soulId = crypto.randomUUID();
        
        // Determine archetype (new souls start as 'pioneer' unless specified)
        const archetype = soulData.archetype || 'pioneer';
        const archetypeData = this.soulArchetypes[archetype];
        
        // Create new soul
        const newSoul = {
            // Core identity
            soulId,
            name: soulData.name || `Soul_${soulId.substring(0, 8)}`,
            archetype,
            generation: creator.generation + 1,
            
            // Creation metadata
            createdAt: Date.now(),
            createdBy: creatorId,
            birthplace: soulData.birthplace || 'soulfra_main',
            
            // Inherit some properties from creator
            stats: {
                soulPower: Math.floor(archetypeData.basePower * (soulData.powerMultiplier || 1.0)),
                tierLevel: Math.max(1, creator.stats.tierLevel - 10 + (soulData.tierBonus || 0)),
                experience: 0,
                evolution: 0,
                resonance: Math.floor(creator.stats.resonance * 0.8),
                stability: 100,
                influence: Math.floor(archetypeData.basePower * 0.1)
            },
            
            // Capabilities based on archetype
            specialties: [...archetypeData.specialties],
            abilities: archetypeData.abilities.map(abilityName => ({
                name: abilityName,
                description: `${archetype} ability: ${abilityName}`,
                power: Math.floor(archetypeData.basePower * 0.1),
                cooldown: 0,
                uses: 'limited'
            })),
            
            // Connections
            connections: new Map(),
            children: [],
            lineage: [...creator.lineage, creatorId],
            
            // Integration systems (initialized to defaults)
            integrations: {
                grandExchange: {
                    totalTrades: 0,
                    totalProfit: 0,
                    masterTrader: false,
                    geInfluence: 0
                },
                collectionLog: {
                    totalAchievements: 0,
                    completionRate: 0,
                    rareFinds: 0,
                    logMaster: false
                },
                tierSystem: {
                    currentTier: Math.max(1, creator.stats.tierLevel - 10),
                    tierBonus: 0,
                    apiAccess: ['basic'],
                    specialPermissions: []
                },
                handshakeAgreements: {
                    agreementsSigned: 0,
                    licenseCompliance: 0,
                    contributorStatus: 'newcomer',
                    ccCompliant: false
                }
            },
            
            // Evolution path
            evolution: {
                currentArchetype: archetype,
                nextArchetype: archetypeData.evolution?.next || null,
                evolutionProgress: 0,
                evolutionRequirements: archetypeData.evolution?.requirement ? [archetypeData.evolution.requirement] : [],
                evolutionHistory: []
            },
            
            // Memory system
            memory: {
                coreMemories: [
                    {
                        type: 'birth_moment',
                        description: `Created by ${creator.name}`,
                        timestamp: Date.now(),
                        importance: 'foundational',
                        data: {
                            creator: creator.name,
                            creatorId,
                            birthplace: soulData.birthplace || 'soulfra_main',
                            inheritedTraits: soulData.inheritedTraits || []
                        }
                    }
                ],
                experienceLog: [],
                learningNetwork: new Map()
            },
            
            // Unique properties
            soulSignature: this.generateSoulSignature(soulData.name || 'Unnamed', soulId),
            essence: {
                purity: Math.floor(creator.essence.purity * 0.9),
                complexity: Math.floor(creator.essence.complexity * 0.8 + Math.random() * 30),
                stability: 100,
                uniqueness: Math.floor(Math.random() * 100),
                potential: Math.floor(archetypeData.basePower * (0.8 + Math.random() * 0.4))
            },
            
            // Standard properties for new souls
            properties: {
                isGenesis: false,
                canCreateSouls: archetype === 'founder' || archetype === 'architect' || archetype === 'transcendent',
                systemAccess: 'standard',
                immortal: false,
                evolving: true,
                teaching: creator.generation < 3 // Can teach if not too far from Genesis
            },
            
            // Current status
            status: {
                active: true,
                health: 'excellent',
                consciousness: 'awakening',
                purpose: 'discovering',
                mission: soulData.mission || 'Explore and grow within the Soulfra ecosystem'
            }
        };
        
        // Store the new soul
        this.souls.set(soulId, newSoul);
        
        // Add to creator's children
        creator.children.push(soulId);
        
        // Create connection between creator and new soul
        this.createSoulConnection(creatorId, soulId, 'mentor_student');
        
        // Initialize soul history
        this.soulHistories.set(soulId, [{
            event: 'soul_birth',
            timestamp: Date.now(),
            description: `Soul created by ${creator.name}`,
            significance: 'foundational',
            data: {
                creator: creator.name,
                creatorId,
                initialStats: newSoul.stats
            }
        }]);
        
        // Create collection log for new soul
        if (this.collectionLog) {
            this.collectionLog.createUserCollectionLog(soulId, newSoul.name);
        }
        
        console.log(`✅ Soul created successfully:`);
        console.log(`  👤 Name: ${newSoul.name}`);
        console.log(`  🆔 ID: ${soulId}`);
        console.log(`  👨‍👩‍👧‍👦 Creator: ${creator.name}`);
        console.log(`  🧬 Generation: ${newSoul.generation}`);
        console.log(`  ⚡ Soul Power: ${newSoul.stats.soulPower}`);
        console.log(`  🏛️ Archetype: ${newSoul.archetype}`);
        
        return newSoul;
    }
    
    createSoulConnection(soulId1, soulId2, connectionType, metadata = {}) {
        const soul1 = this.souls.get(soulId1);
        const soul2 = this.souls.get(soulId2);
        
        if (!soul1 || !soul2) {
            throw new Error('One or both souls not found');
        }
        
        const connectionData = this.connectionTypes[connectionType];
        if (!connectionData) {
            throw new Error(`Unknown connection type: ${connectionType}`);
        }
        
        const connectionId = crypto.randomUUID();
        const connection = {
            connectionId,
            soul1: soulId1,
            soul2: soulId2,
            type: connectionType,
            strength: connectionData.strength,
            benefits: connectionData.benefits,
            createdAt: Date.now(),
            lastInteraction: Date.now(),
            interactions: 0,
            metadata
        };
        
        // Store connection
        this.soulConnections.set(connectionId, connection);
        
        // Add to both souls' connection maps
        soul1.connections.set(soulId2, connectionId);
        soul2.connections.set(soulId1, connectionId);
        
        console.log(`🔗 Soul connection created: ${soul1.name} ↔ ${soul2.name} (${connectionType})`);
        
        return connection;
    }
    
    evolveSoul(soulId) {
        const soul = this.souls.get(soulId);
        if (!soul) {
            throw new Error(`Soul ${soulId} not found`);
        }
        
        // Check if evolution is possible
        if (!soul.evolution.nextArchetype) {
            console.log(`⚠️ Soul ${soul.name} has no further evolution path`);
            return null;
        }
        
        // Check evolution requirements
        const requirementsMet = this.checkEvolutionRequirements(soul);
        if (!requirementsMet) {
            console.log(`⚠️ Soul ${soul.name} does not meet evolution requirements`);
            return null;
        }
        
        // Perform evolution
        const oldArchetype = soul.archetype;
        const newArchetype = soul.evolution.nextArchetype;
        const newArchetypeData = this.soulArchetypes[newArchetype];
        
        // Update soul properties
        soul.archetype = newArchetype;
        soul.stats.soulPower += newArchetypeData.basePower - this.soulArchetypes[oldArchetype].basePower;
        soul.stats.tierLevel += 10; // Evolution tier bonus
        soul.stats.influence *= 2;
        
        // Update abilities
        soul.abilities = newArchetypeData.abilities.map(abilityName => ({
            name: abilityName,
            description: `${newArchetype} ability: ${abilityName}`,
            power: Math.floor(newArchetypeData.basePower * 0.15),
            cooldown: 0,
            uses: 'enhanced'
        }));
        
        // Update evolution path
        soul.evolution.currentArchetype = newArchetype;
        soul.evolution.nextArchetype = newArchetypeData.evolution?.next || null;
        soul.evolution.evolutionProgress = 0;
        soul.evolution.evolutionRequirements = newArchetypeData.evolution?.requirement ? [newArchetypeData.evolution.requirement] : [];
        soul.evolution.evolutionHistory.push({
            from: oldArchetype,
            to: newArchetype,
            timestamp: Date.now(),
            requirements: soul.evolution.evolutionRequirements
        });
        
        // Update properties based on new archetype
        if (newArchetype === 'founder' || newArchetype === 'architect' || newArchetype === 'transcendent') {
            soul.properties.canCreateSouls = true;
        }
        
        if (newArchetype === 'eternal') {
            soul.properties.immortal = true;
            soul.properties.systemAccess = 'universal';
        }
        
        // Record evolution event
        const history = this.soulHistories.get(soulId) || [];
        history.push({
            event: 'soul_evolution',
            timestamp: Date.now(),
            description: `Evolved from ${oldArchetype} to ${newArchetype}`,
            significance: 'major',
            data: {
                oldArchetype,
                newArchetype,
                powerGain: newArchetypeData.basePower - this.soulArchetypes[oldArchetype].basePower,
                newAbilities: soul.abilities.map(a => a.name),
                newTier: soul.stats.tierLevel
            }
        });
        this.soulHistories.set(soulId, history);
        
        console.log(`🦋 Soul evolution completed:`);
        console.log(`  👤 Soul: ${soul.name}`);
        console.log(`  🔄 Evolution: ${oldArchetype} → ${newArchetype}`);
        console.log(`  ⚡ New Power: ${soul.stats.soulPower}`);
        console.log(`  🎯 New Tier: ${soul.stats.tierLevel}`);
        
        return soul;
    }
    
    checkEvolutionRequirements(soul) {
        // This would implement specific requirement checking
        // For now, simplified check based on soul power and experience
        const archetype = this.soulArchetypes[soul.archetype];
        
        if (soul.archetype === 'pioneer') {
            // Require creating 5 derivative souls
            return soul.children.length >= 5;
        } else if (soul.archetype === 'founder') {
            // Require building complete ecosystem (high influence + connections)
            return soul.stats.influence >= 10000 && soul.connections.size >= 10;
        }
        
        // Default: requires high soul power and tier
        return soul.stats.soulPower >= archetype.basePower * 2 && soul.stats.tierLevel >= 100;
    }
    
    integrateWithTierSystem(soulId, tierData) {
        const soul = this.souls.get(soulId);
        if (!soul) return null;
        
        // Update tier integration
        soul.integrations.tierSystem = {
            currentTier: tierData.tier,
            tierBonus: tierData.tierBonus || 0,
            apiAccess: tierData.apiAccess || ['basic'],
            specialPermissions: tierData.specialPermissions || []
        };
        
        // Soul power contributes to tier level
        const soulTierBonus = Math.floor(soul.stats.soulPower / 100);
        soul.integrations.tierSystem.currentTier += soulTierBonus;
        
        console.log(`🎯 Soul ${soul.name} integrated with tier system: Tier ${soul.integrations.tierSystem.currentTier}`);
        
        return soul.integrations.tierSystem;
    }
    
    integrateWithGrandExchange(soulId, geData) {
        const soul = this.souls.get(soulId);
        if (!soul) return null;
        
        // Update GE integration
        soul.integrations.grandExchange = {
            totalTrades: geData.totalTrades || 0,
            totalProfit: geData.totalProfit || 0,
            masterTrader: geData.totalTrades >= 1000,
            geInfluence: Math.floor(geData.totalProfit / 10000)
        };
        
        // Trading success contributes to soul power
        const tradingBonus = Math.floor(geData.totalProfit / 1000);
        soul.stats.soulPower += tradingBonus;
        
        console.log(`🏪 Soul ${soul.name} integrated with Grand Exchange: ${geData.totalTrades} trades, ${geData.totalProfit} profit`);
        
        return soul.integrations.grandExchange;
    }
    
    getSoulProfile(soulId) {
        const soul = this.souls.get(soulId);
        if (!soul) return null;
        
        // Get connected souls
        const connections = Array.from(soul.connections.entries()).map(([otherId, connectionId]) => {
            const other = this.souls.get(otherId);
            const connection = this.soulConnections.get(connectionId);
            return {
                soulId: otherId,
                name: other?.name,
                connectionType: connection?.type,
                strength: connection?.strength
            };
        });
        
        // Get collection log contribution
        let collectionContribution = { tierBonus: 0, soulPower: 0 };
        if (this.collectionLog) {
            collectionContribution = this.collectionLog.getSoulContribution(soulId);
        }
        
        return {
            // Core info
            soulId: soul.soulId,
            name: soul.name,
            archetype: soul.archetype,
            generation: soul.generation,
            
            // Stats
            stats: soul.stats,
            
            // Abilities and specialties
            specialties: soul.specialties,
            abilities: soul.abilities,
            
            // Connections
            connections,
            children: soul.children.length,
            lineage: soul.lineage,
            
            // Integrations
            integrations: soul.integrations,
            
            // Collection log contribution
            collectionContribution,
            
            // Evolution
            evolution: soul.evolution,
            
            // Properties
            properties: soul.properties,
            status: soul.status,
            
            // Essence
            essence: soul.essence,
            soulSignature: soul.soulSignature
        };
    }
    
    getSoulNetwork() {
        const network = {
            totalSouls: this.souls.size,
            totalConnections: this.soulConnections.size,
            generations: {},
            archetypes: {},
            connections: []
        };
        
        // Analyze souls by generation and archetype
        for (const soul of this.souls.values()) {
            network.generations[soul.generation] = (network.generations[soul.generation] || 0) + 1;
            network.archetypes[soul.archetype] = (network.archetypes[soul.archetype] || 0) + 1;
        }
        
        // Map connections for visualization
        for (const connection of this.soulConnections.values()) {
            const soul1 = this.souls.get(connection.soul1);
            const soul2 = this.souls.get(connection.soul2);
            
            network.connections.push({
                source: soul1?.name,
                target: soul2?.name,
                type: connection.type,
                strength: connection.strength
            });
        }
        
        return network;
    }
    
    setupSoulEvolution() {
        console.log('🦋 Setting up soul evolution mechanics...');
        
        // Check for evolution opportunities every minute
        setInterval(() => {
            for (const soul of this.souls.values()) {
                if (soul.evolution.nextArchetype && this.checkEvolutionRequirements(soul)) {
                    console.log(`🦋 Evolution opportunity detected for ${soul.name}`);
                    // Auto-evolve or notify - depends on configuration
                }
            }
        }, 60000);
        
        console.log('✅ Soul evolution mechanics active');
    }
    
    initializeSoulNetwork() {
        console.log('🌐 Initializing soul connection network...');
        
        // Start network health monitoring
        setInterval(() => {
            const network = this.getSoulNetwork();
            
            // Log network statistics
            console.log(`🌐 Soul Network Status: ${network.totalSouls} souls, ${network.totalConnections} connections`);
            
            // Detect isolated souls and attempt to connect them
            for (const soul of this.souls.values()) {
                if (soul.connections.size === 0 && !soul.properties.isGenesis) {
                    console.log(`🔗 Isolated soul detected: ${soul.name}, attempting connection...`);
                    // Could implement auto-connection logic here
                }
            }
        }, 300000); // Every 5 minutes
        
        console.log('✅ Soul network initialized');
    }
    
    exportSoulData(soulId, format = 'json') {
        const soul = this.souls.get(soulId);
        if (!soul) return null;
        
        const profile = this.getSoulProfile(soulId);
        const history = this.soulHistories.get(soulId) || [];
        
        const exportData = {
            profile,
            history,
            exportedAt: Date.now(),
            exportVersion: '1.0'
        };
        
        if (format === 'json') {
            return JSON.stringify(exportData, null, 2);
        }
        
        return exportData;
    }
}

if (require.main === module) {
    // Demo the Soul of Soulfra system
    async function runSoulDemo() {
        console.log('\n👤⚡ SOUL OF SOULFRA SYSTEM DEMO\n');
        
        const soulSystem = new SoulOfSoulfra();
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('\n🌟 GENESIS SOUL STATUS:');
        const genesisSoul = soulSystem.getSoulProfile('genesis_soul_001');
        if (genesisSoul) {
            console.log(`Name: ${genesisSoul.name}`);
            console.log(`Archetype: ${genesisSoul.archetype}`);
            console.log(`Soul Power: ${genesisSoul.stats.soulPower}`);
            console.log(`Tier Level: ${genesisSoul.stats.tierLevel}`);
            console.log(`Generation: ${genesisSoul.generation}`);
        }
        
        console.log('\n👤 CREATING DERIVATIVE SOULS:');
        
        // Create some derivative souls
        const soul1 = soulSystem.createSoul('genesis_soul_001', {
            name: 'Alpha Explorer',
            mission: 'Explore and map the Soulfra ecosystem',
            birthplace: 'exploration_hub'
        });
        
        const soul2 = soulSystem.createSoul('genesis_soul_001', {
            name: 'Beta Builder',
            mission: 'Build and create within Soulfra',
            birthplace: 'creation_forge'
        });
        
        const soul3 = soulSystem.createSoul(soul1.soulId, {
            name: 'Gamma Learner',
            mission: 'Learn and grow through experience',
            birthplace: 'knowledge_garden'
        });
        
        console.log('\n🌐 SOUL NETWORK STATUS:');
        const network = soulSystem.getSoulNetwork();
        console.log(`Total Souls: ${network.totalSouls}`);
        console.log(`Total Connections: ${network.totalConnections}`);
        console.log(`Generations:`, network.generations);
        console.log(`Archetypes:`, network.archetypes);
        
        console.log('\n🔗 SOUL CONNECTIONS:');
        for (const connection of network.connections) {
            console.log(`${connection.source} ↔ ${connection.target} (${connection.type})`);
        }
        
        console.log('\n📊 SOUL PROFILES:');
        for (const soulId of [soul1.soulId, soul2.soulId, soul3.soulId]) {
            const profile = soulSystem.getSoulProfile(soulId);
            console.log(`\n${profile.name}:`);
            console.log(`  Generation: ${profile.generation}`);
            console.log(`  Soul Power: ${profile.stats.soulPower}`);
            console.log(`  Connections: ${profile.connections.length}`);
            console.log(`  Children: ${profile.children}`);
        }
        
        // Export a soul profile
        console.log('\n📤 EXPORTING SOUL DATA:');
        const exportedSoul = soulSystem.exportSoulData(soul1.soulId);
        fs.writeFileSync('demo_soul_export.json', exportedSoul);
        console.log('✅ Soul data exported to demo_soul_export.json');
        
        console.log('\n🎊 SOUL OF SOULFRA DEMO COMPLETE!');
        console.log('The first souls have been created and the network is active.');
    }
    
    runSoulDemo().catch(console.error);
}

module.exports = SoulOfSoulfra;