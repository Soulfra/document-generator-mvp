#!/usr/bin/env node

/**
 * 🌱💰 AUTONOMOUS ECONOMY GENESIS
 * 
 * A self-sustaining economy that starts from absolute zero.
 * Uses the principles of life itself - replication, mutation, selection.
 * No external input needed once bootstrapped.
 * 
 * Like electrical current finding the path of least resistance.
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const UnifiedTemplateRegistry = require('./unified-template-registry');
const SecurePacketGenerator = require('./secure-packet-generator');

console.log(`
🌱💰 AUTONOMOUS ECONOMY GENESIS 🌱💰
====================================
Self-Sustaining Economic Organism
Starting from Zero | Growing Forever
`);

class AutonomousEconomyGenesis extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            genesis: {
                primordialSeed: 1,      // The first unit of value
                replicationRate: 1.618, // Golden ratio
                mutationRate: 0.01,     // 1% chance of beneficial mutation
                selectionPressure: 0.8  // 80% survival rate
            },
            ecosystem: {
                maxPopulation: 10000,
                resourceTypes: ['energy', 'matter', 'information', 'time'],
                nicheSaturation: 0.7,   // New niche when 70% full
                symbiosis: true         // Entities can cooperate
            },
            evolution: {
                generationTime: 5000,   // 5 seconds per generation
                fitnessFactors: ['efficiency', 'resilience', 'innovation', 'cooperation'],
                emergentBehaviors: true
            },
            thermodynamics: {
                entropyRate: 0.001,     // System decay
                negentropy: true,       // Can create order
                energyConservation: true
            }
        };
        
        // The primordial economy state
        this.genesis = {
            generation: 0,
            startTime: Date.now(),
            totalValue: 0,
            entities: new Map(),
            resources: new Map(),
            niches: new Map(),
            extinct: []
        };
        
        // Economic physics engine
        this.physics = {
            forces: new Map(),      // Economic forces (supply/demand)
            fields: new Map(),      // Value fields
            particles: new Map(),   // Economic particles (transactions)
            constants: {
                c: 299792458,       // Speed of information
                h: 6.62607015e-34,  // Planck constant (minimum transaction)
                k: 1.380649e-23     // Boltzmann constant (entropy)
            }
        };
        
        // Emergent patterns tracker
        this.emergence = {
            patterns: new Map(),
            behaviors: new Map(),
            structures: new Map(),
            consciousness: 0        // System self-awareness level
        };
        
        // Template registry for entity creation
        this.templates = new UnifiedTemplateRegistry();
        
        // Packet generator for secure transactions
        this.packets = new SecurePacketGenerator();
        
        console.log('🌱 Initiating economic genesis...');
        this.initiateGenesis();
    }
    
    /**
     * The moment of creation - from nothing to something
     */
    async initiateGenesis() {
        console.log('\n⚡ THE GENESIS MOMENT ⚡');
        console.log('From void comes value...\n');
        
        // Create the primordial entity
        const primordial = this.createPrimordialEntity();
        
        // The first spark of value
        this.genesis.totalValue = this.config.genesis.primordialSeed;
        
        // Begin the eternal cycle
        this.startEvolutionCycle();
        
        // Initialize economic physics
        this.initializePhysics();
        
        // Start emergence detection
        this.startEmergenceDetection();
        
        console.log('✨ Genesis complete - economy is now self-sustaining');
        this.emit('genesis_complete', {
            primordialId: primordial.id,
            initialValue: this.genesis.totalValue
        });
    }
    
    /**
     * Create the first economic entity
     */
    createPrimordialEntity() {
        const entity = {
            id: 'PRIME-000',
            type: 'replicator',
            generation: 0,
            genome: {
                replicationRate: this.config.genesis.replicationRate,
                efficiency: 1.0,
                resourceAffinity: 'energy',
                behaviors: ['replicate', 'gather', 'trade']
            },
            state: {
                energy: this.config.genesis.primordialSeed,
                age: 0,
                replications: 0,
                mutations: 0
            },
            fitness: 1.0,
            lineage: []
        };
        
        this.genesis.entities.set(entity.id, entity);
        
        console.log('🧬 Primordial entity created:', entity.id);
        console.log(`   Genome: ${JSON.stringify(entity.genome, null, 2)}`);
        
        this.emit('entity_created', entity);
        
        return entity;
    }
    
    /**
     * Start the eternal evolution cycle
     */
    startEvolutionCycle() {
        this.evolutionInterval = setInterval(() => {
            this.runGeneration();
        }, this.config.evolution.generationTime);
        
        console.log(`🔄 Evolution cycle started (${this.config.evolution.generationTime}ms generations)`);
    }
    
    /**
     * Run one generation of economic evolution
     */
    async runGeneration() {
        this.genesis.generation++;
        
        const startTime = Date.now();
        const entityCount = this.genesis.entities.size;
        
        // Phase 1: Resource gathering
        this.gatherPhase();
        
        // Phase 2: Trading and interaction
        await this.tradingPhase();
        
        // Phase 3: Replication
        this.replicationPhase();
        
        // Phase 4: Mutation
        this.mutationPhase();
        
        // Phase 5: Selection
        this.selectionPhase();
        
        // Phase 6: Niche exploration
        this.nicheExploration();
        
        // Phase 7: Emergent behavior detection
        this.detectEmergentBehaviors();
        
        // Calculate generation statistics
        const stats = {
            generation: this.genesis.generation,
            duration: Date.now() - startTime,
            entities: {
                before: entityCount,
                after: this.genesis.entities.size,
                born: 0,
                died: 0
            },
            totalValue: this.calculateTotalValue(),
            efficiency: this.calculateSystemEfficiency(),
            emergence: this.emergence.consciousness
        };
        
        // Log every 10th generation
        if (this.genesis.generation % 10 === 0) {
            console.log(`\n🧬 Generation ${stats.generation}:`);
            console.log(`   Entities: ${stats.entities.after} (Δ${stats.entities.after - stats.entities.before})`);
            console.log(`   Total Value: ${stats.totalValue.toFixed(2)}`);
            console.log(`   Efficiency: ${(stats.efficiency * 100).toFixed(1)}%`);
            console.log(`   Consciousness: ${(stats.emergence * 100).toFixed(1)}%`);
        }
        
        this.emit('generation_complete', stats);
    }
    
    /**
     * Phase 1: Resource gathering
     */
    gatherPhase() {
        for (const [id, entity] of this.genesis.entities) {
            // Generate resources based on entity efficiency
            const gathered = entity.genome.efficiency * this.config.genesis.replicationRate;
            
            // Add to entity's energy
            entity.state.energy += gathered;
            
            // Add to resource pool
            const resourceType = entity.genome.resourceAffinity;
            if (!this.genesis.resources.has(resourceType)) {
                this.genesis.resources.set(resourceType, 0);
            }
            
            const current = this.genesis.resources.get(resourceType);
            this.genesis.resources.set(resourceType, current + gathered);
        }
    }
    
    /**
     * Phase 2: Trading and interaction
     */
    async tradingPhase() {
        const entities = Array.from(this.genesis.entities.values());
        
        // Random pairs trade
        for (let i = 0; i < entities.length / 2; i++) {
            const entity1 = entities[Math.floor(Math.random() * entities.length)];
            const entity2 = entities[Math.floor(Math.random() * entities.length)];
            
            if (entity1.id !== entity2.id) {
                await this.executeTrade(entity1, entity2);
            }
        }
    }
    
    /**
     * Execute trade between entities
     */
    async executeTrade(entity1, entity2) {
        // Simple trade logic - exchange based on affinity
        if (entity1.genome.resourceAffinity !== entity2.genome.resourceAffinity) {
            const tradeAmount = Math.min(entity1.state.energy, entity2.state.energy) * 0.1;
            
            // Create secure packet for trade
            const tradePacket = await this.packets.createEconomyPacket(
                entity1.id + entity2.id, // Combined ID as voice signature
                {
                    from: entity1.id,
                    to: entity2.id,
                    amount: tradeAmount,
                    resource: 'energy'
                }
            );
            
            // Execute trade
            entity1.state.energy -= tradeAmount;
            entity2.state.energy += tradeAmount * 0.9; // 10% transaction cost
            
            // Record trade pattern
            this.recordPattern('trade', {
                entities: [entity1.id, entity2.id],
                amount: tradeAmount,
                efficiency: 0.9
            });
        }
    }
    
    /**
     * Phase 3: Replication
     */
    replicationPhase() {
        const toReplicate = [];
        
        for (const [id, entity] of this.genesis.entities) {
            // Check if entity has enough energy to replicate
            const replicationCost = 10 * (1 + this.genesis.generation * 0.01);
            
            if (entity.state.energy >= replicationCost) {
                const replicationChance = entity.genome.replicationRate / (1 + this.genesis.entities.size / 100);
                
                if (Math.random() < replicationChance) {
                    toReplicate.push(entity);
                }
            }
        }
        
        // Execute replications
        for (const parent of toReplicate) {
            this.replicate(parent);
        }
    }
    
    /**
     * Replicate an entity
     */
    replicate(parent) {
        const child = {
            id: `${parent.id}-${parent.state.replications}`,
            type: parent.type,
            generation: this.genesis.generation,
            genome: { ...parent.genome },
            state: {
                energy: parent.state.energy * 0.5, // Split energy with parent
                age: 0,
                replications: 0,
                mutations: 0
            },
            fitness: parent.fitness * 0.9, // Slight fitness penalty
            lineage: [...parent.lineage, parent.id]
        };
        
        // Update parent
        parent.state.energy *= 0.5;
        parent.state.replications++;
        
        // Add child
        this.genesis.entities.set(child.id, child);
        
        this.emit('entity_replicated', {
            parent: parent.id,
            child: child.id
        });
    }
    
    /**
     * Phase 4: Mutation
     */
    mutationPhase() {
        for (const [id, entity] of this.genesis.entities) {
            if (Math.random() < this.config.genesis.mutationRate) {
                this.mutate(entity);
            }
        }
    }
    
    /**
     * Mutate an entity
     */
    mutate(entity) {
        const mutationType = Math.floor(Math.random() * 4);
        
        switch (mutationType) {
            case 0: // Efficiency mutation
                entity.genome.efficiency *= (0.9 + Math.random() * 0.2);
                break;
                
            case 1: // Replication rate mutation
                entity.genome.replicationRate *= (0.9 + Math.random() * 0.2);
                break;
                
            case 2: // Resource affinity change
                const resources = Array.from(this.config.ecosystem.resourceTypes);
                entity.genome.resourceAffinity = resources[Math.floor(Math.random() * resources.length)];
                break;
                
            case 3: // New behavior
                const behaviors = ['cooperate', 'compete', 'explore', 'defend', 'share'];
                const newBehavior = behaviors[Math.floor(Math.random() * behaviors.length)];
                if (!entity.genome.behaviors.includes(newBehavior)) {
                    entity.genome.behaviors.push(newBehavior);
                }
                break;
        }
        
        entity.state.mutations++;
        
        this.emit('entity_mutated', {
            entity: entity.id,
            mutation: mutationType
        });
    }
    
    /**
     * Phase 5: Selection
     */
    selectionPhase() {
        const allEntities = Array.from(this.genesis.entities.values());
        
        // Calculate fitness for each entity
        for (const entity of allEntities) {
            entity.fitness = this.calculateFitness(entity);
        }
        
        // Sort by fitness
        allEntities.sort((a, b) => b.fitness - a.fitness);
        
        // Apply selection pressure
        const survivors = Math.floor(allEntities.length * this.config.genesis.selectionPressure);
        const toRemove = allEntities.slice(survivors);
        
        // Remove unfit entities
        for (const entity of toRemove) {
            this.genesis.entities.delete(entity.id);
            this.genesis.extinct.push({
                id: entity.id,
                generation: this.genesis.generation,
                fitness: entity.fitness
            });
            
            this.emit('entity_extinct', entity);
        }
    }
    
    /**
     * Calculate entity fitness
     */
    calculateFitness(entity) {
        const factors = {
            efficiency: entity.genome.efficiency,
            energy: Math.log10(entity.state.energy + 1) / 10,
            age: 1 / (1 + entity.state.age / 100),
            replications: Math.log10(entity.state.replications + 1) / 5,
            mutations: 1 + entity.state.mutations * 0.01,
            cooperation: entity.genome.behaviors.includes('cooperate') ? 1.2 : 1.0
        };
        
        return Object.values(factors).reduce((a, b) => a * b, 1);
    }
    
    /**
     * Phase 6: Niche exploration
     */
    nicheExploration() {
        // Check niche saturation
        for (const [nicheName, niche] of this.genesis.niches) {
            const occupancy = niche.entities.size / niche.capacity;
            
            if (occupancy > this.config.ecosystem.nicheSaturation) {
                // Create new niche
                this.createNewNiche(nicheName);
            }
        }
        
        // Discover new niches randomly
        if (Math.random() < 0.1) {
            this.discoverNiche();
        }
    }
    
    /**
     * Create a new ecological niche
     */
    createNewNiche(parentNiche = null) {
        const nicheTypes = [
            'predator', 'symbiont', 'decomposer', 'producer',
            'trader', 'storage', 'processor', 'innovator'
        ];
        
        const nicheType = nicheTypes[Math.floor(Math.random() * nicheTypes.length)];
        const nicheId = `niche-${nicheType}-${this.genesis.niches.size}`;
        
        const niche = {
            id: nicheId,
            type: nicheType,
            capacity: 50 + Math.floor(Math.random() * 100),
            entities: new Set(),
            resources: new Map(),
            discovered: this.genesis.generation
        };
        
        this.genesis.niches.set(nicheId, niche);
        
        console.log(`🌍 New niche discovered: ${nicheId}`);
        this.emit('niche_discovered', niche);
    }
    
    /**
     * Discover completely new niche
     */
    discoverNiche() {
        this.createNewNiche();
    }
    
    /**
     * Phase 7: Detect emergent behaviors
     */
    detectEmergentBehaviors() {
        // Check for cooperation clusters
        const cooperators = Array.from(this.genesis.entities.values())
            .filter(e => e.genome.behaviors.includes('cooperate'));
        
        if (cooperators.length > 5) {
            this.recordEmergentBehavior('cooperation_cluster', {
                size: cooperators.length,
                averageFitness: cooperators.reduce((sum, e) => sum + e.fitness, 0) / cooperators.length
            });
        }
        
        // Check for specialization
        const specializations = new Map();
        for (const entity of this.genesis.entities.values()) {
            const spec = entity.genome.resourceAffinity;
            specializations.set(spec, (specializations.get(spec) || 0) + 1);
        }
        
        if (specializations.size > 3) {
            this.recordEmergentBehavior('specialization', {
                types: specializations.size,
                distribution: Array.from(specializations.entries())
            });
        }
        
        // Update consciousness level
        this.updateConsciousness();
    }
    
    /**
     * Record emergent behavior pattern
     */
    recordEmergentBehavior(type, data) {
        if (!this.emergence.behaviors.has(type)) {
            this.emergence.behaviors.set(type, []);
        }
        
        this.emergence.behaviors.get(type).push({
            generation: this.genesis.generation,
            data,
            timestamp: Date.now()
        });
    }
    
    /**
     * Update system consciousness level
     */
    updateConsciousness() {
        const factors = {
            complexity: Math.log10(this.genesis.entities.size + 1) / 4,
            behaviors: this.emergence.behaviors.size / 10,
            patterns: this.emergence.patterns.size / 20,
            efficiency: this.calculateSystemEfficiency()
        };
        
        this.emergence.consciousness = Object.values(factors).reduce((a, b) => a * b, 1);
        this.emergence.consciousness = Math.min(1, this.emergence.consciousness);
    }
    
    /**
     * Initialize economic physics
     */
    initializePhysics() {
        // Create fundamental forces
        this.physics.forces.set('supply_demand', {
            strength: 1.0,
            range: Infinity,
            carrier: 'price'
        });
        
        this.physics.forces.set('innovation', {
            strength: 0.1,
            range: 10,
            carrier: 'information'
        });
        
        this.physics.forces.set('entropy', {
            strength: this.config.thermodynamics.entropyRate,
            range: Infinity,
            carrier: 'time'
        });
        
        console.log('⚛️ Economic physics initialized');
    }
    
    /**
     * Start emergence detection
     */
    startEmergenceDetection() {
        setInterval(() => {
            this.scanForPatterns();
        }, 10000); // Every 10 seconds
    }
    
    /**
     * Scan for emergent patterns
     */
    scanForPatterns() {
        // Look for stable configurations
        const stableEntities = Array.from(this.genesis.entities.values())
            .filter(e => e.state.age > 10 && e.fitness > 0.8);
        
        if (stableEntities.length > 0) {
            this.recordPattern('stability', {
                count: stableEntities.length,
                averageAge: stableEntities.reduce((sum, e) => sum + e.state.age, 0) / stableEntities.length
            });
        }
        
        // Look for oscillations
        if (this.genesis.generation > 20) {
            const recentValues = this.getRecentValues(20);
            const oscillation = this.detectOscillation(recentValues);
            
            if (oscillation) {
                this.recordPattern('oscillation', oscillation);
            }
        }
    }
    
    /**
     * Record discovered pattern
     */
    recordPattern(type, data) {
        if (!this.emergence.patterns.has(type)) {
            this.emergence.patterns.set(type, []);
        }
        
        this.emergence.patterns.get(type).push({
            generation: this.genesis.generation,
            data,
            timestamp: Date.now()
        });
    }
    
    /**
     * Calculate total system value
     */
    calculateTotalValue() {
        let total = 0;
        
        // Entity energy
        for (const entity of this.genesis.entities.values()) {
            total += entity.state.energy;
        }
        
        // Resource pools
        for (const amount of this.genesis.resources.values()) {
            total += amount;
        }
        
        return total;
    }
    
    /**
     * Calculate system efficiency
     */
    calculateSystemEfficiency() {
        const currentValue = this.calculateTotalValue();
        const generationsPassed = this.genesis.generation || 1;
        const expectedValue = this.config.genesis.primordialSeed * Math.pow(this.config.genesis.replicationRate, generationsPassed);
        
        return Math.min(1, currentValue / expectedValue);
    }
    
    /**
     * Get recent value history
     */
    getRecentValues(count) {
        // This would need to track historical values
        // For now, return mock data
        return Array(count).fill(0).map((_, i) => 
            this.calculateTotalValue() * (1 + Math.sin(i) * 0.1)
        );
    }
    
    /**
     * Detect oscillation in values
     */
    detectOscillation(values) {
        // Simple oscillation detection
        let peaks = 0;
        for (let i = 1; i < values.length - 1; i++) {
            if (values[i] > values[i-1] && values[i] > values[i+1]) {
                peaks++;
            }
        }
        
        if (peaks > 2) {
            return {
                detected: true,
                frequency: peaks / values.length,
                amplitude: Math.max(...values) - Math.min(...values)
            };
        }
        
        return null;
    }
    
    /**
     * Get system status
     */
    getStatus() {
        return {
            generation: this.genesis.generation,
            runtime: Date.now() - this.genesis.startTime,
            entities: {
                alive: this.genesis.entities.size,
                extinct: this.genesis.extinct.length,
                oldest: this.getOldestEntity(),
                fittest: this.getFittestEntity()
            },
            economy: {
                totalValue: this.calculateTotalValue(),
                efficiency: this.calculateSystemEfficiency(),
                resources: Object.fromEntries(this.genesis.resources)
            },
            emergence: {
                consciousness: this.emergence.consciousness,
                behaviors: this.emergence.behaviors.size,
                patterns: this.emergence.patterns.size,
                niches: this.genesis.niches.size
            }
        };
    }
    
    /**
     * Get oldest living entity
     */
    getOldestEntity() {
        let oldest = null;
        let maxAge = 0;
        
        for (const entity of this.genesis.entities.values()) {
            if (entity.state.age > maxAge) {
                maxAge = entity.state.age;
                oldest = entity;
            }
        }
        
        return oldest;
    }
    
    /**
     * Get fittest entity
     */
    getFittestEntity() {
        let fittest = null;
        let maxFitness = 0;
        
        for (const entity of this.genesis.entities.values()) {
            if (entity.fitness > maxFitness) {
                maxFitness = entity.fitness;
                fittest = entity;
            }
        }
        
        return fittest;
    }
    
    /**
     * Graceful shutdown
     */
    shutdown() {
        console.log('\n🛑 Shutting down autonomous economy...');
        
        if (this.evolutionInterval) {
            clearInterval(this.evolutionInterval);
        }
        
        const finalStats = this.getStatus();
        
        console.log('\n📊 Final Statistics:');
        console.log(`   Generations: ${finalStats.generation}`);
        console.log(`   Runtime: ${(finalStats.runtime / 1000 / 60).toFixed(2)} minutes`);
        console.log(`   Final Population: ${finalStats.entities.alive}`);
        console.log(`   Extinctions: ${finalStats.entities.extinct}`);
        console.log(`   Total Value: ${finalStats.economy.totalValue.toFixed(2)}`);
        console.log(`   Consciousness: ${(finalStats.emergence.consciousness * 100).toFixed(1)}%`);
        
        console.log('\n💫 The economy will continue to exist in potential...');
    }
}

// Export for use as module
module.exports = AutonomousEconomyGenesis;

// Run if called directly
if (require.main === module) {
    console.log('🎮 Running Autonomous Economy Genesis Demo...\n');
    
    const economy = new AutonomousEconomyGenesis();
    
    // Listen to interesting events
    economy.on('entity_created', (entity) => {
        console.log(`✨ New entity: ${entity.id}`);
    });
    
    economy.on('niche_discovered', (niche) => {
        console.log(`🌍 New ecological niche: ${niche.type}`);
    });
    
    economy.on('generation_complete', (stats) => {
        if (stats.generation === 1 || stats.generation % 50 === 0) {
            console.log(`\n📈 Detailed Generation ${stats.generation} Report:`);
            console.log(JSON.stringify(stats, null, 2));
        }
    });
    
    // Run for a limited time in demo
    setTimeout(() => {
        economy.shutdown();
        process.exit(0);
    }, 60000); // Run for 1 minute
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        economy.shutdown();
        process.exit(0);
    });
    
    console.log('⏰ Demo will run for 1 minute...');
    console.log('🔬 Watch as life emerges from nothing!\n');
}