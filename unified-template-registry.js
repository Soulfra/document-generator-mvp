#!/usr/bin/env node

/**
 * 🎭 UNIFIED TEMPLATE REGISTRY
 * 
 * The single source of truth for all templates in the system.
 * Everything is one of 5 core templates - no exceptions.
 * 
 * Stop creating new template layers. Use this instead.
 */

const EventEmitter = require('events');
const crypto = require('crypto');

// Core Template Base Class
class CoreTemplate extends EventEmitter {
    constructor(type, config = {}) {
        super();
        this.type = type;
        this.config = config;
        this.instances = new Map();
    }
    
    instantiate(instanceConfig) {
        const instanceId = crypto.randomUUID();
        const instance = {
            id: instanceId,
            type: this.type,
            config: { ...this.config, ...instanceConfig },
            created: new Date().toISOString(),
            state: 'initialized',
            metrics: {
                created: Date.now(),
                lastUsed: Date.now(),
                useCount: 0,
                revenue: 0
            }
        };
        
        this.instances.set(instanceId, instance);
        this.emit('instance_created', instance);
        
        return this.wrapInstance(instance);
    }
    
    wrapInstance(instance) {
        // Override in subclasses to add type-specific methods
        return instance;
    }
}

// 1. Data Transform Template
class DataTransformTemplate extends CoreTemplate {
    constructor() {
        super('dataTransform', {
            stages: ['input', 'processing', 'output', 'monetization'],
            supportedInputs: ['text', 'audio', 'image', 'data'],
            supportedOutputs: ['text', 'audio', 'image', 'data', 'hybrid']
        });
    }
    
    wrapInstance(instance) {
        instance.transform = async (input, options = {}) => {
            console.log(`🔄 Transforming ${instance.config.input} → ${instance.config.output}`);
            
            // Simulate transformation
            const result = {
                input: input,
                inputType: instance.config.input,
                outputType: instance.config.output,
                transformation: instance.config.processing,
                output: `Transformed_${input}_via_${instance.config.processing}`,
                cost: 0.01 * (options.quality || 1),
                timestamp: Date.now()
            };
            
            // Update metrics
            instance.metrics.useCount++;
            instance.metrics.lastUsed = Date.now();
            instance.metrics.revenue += result.cost;
            
            this.emit('transform_complete', { instance, result });
            
            return result;
        };
        
        return instance;
    }
}

// 2. Resource Management Template
class ResourceManagementTemplate extends CoreTemplate {
    constructor() {
        super('resourceManagement', {
            mechanics: ['depletion', 'replenishment', 'balance'],
            monetization: ['sell_resources', 'sell_boosts', 'sell_automation']
        });
    }
    
    wrapInstance(instance) {
        instance.state = {
            current: instance.config.initialValue || 100,
            max: instance.config.maxValue || 100,
            depletionRate: instance.config.depletionRate || 1,
            replenishmentCost: instance.config.replenishmentCost || 10
        };
        
        instance.deplete = (amount = null) => {
            const depletion = amount || instance.state.depletionRate;
            instance.state.current = Math.max(0, instance.state.current - depletion);
            
            console.log(`📉 ${instance.config.resource} depleted by ${depletion} (now ${instance.state.current}/${instance.state.max})`);
            
            this.emit('resource_depleted', { instance, amount: depletion });
            
            return instance.state.current;
        };
        
        instance.replenish = (amount = null) => {
            const replenishment = amount || instance.config.replenishmentAmount || 10;
            const cost = instance.state.replenishmentCost;
            
            instance.state.current = Math.min(instance.state.max, instance.state.current + replenishment);
            instance.metrics.revenue += cost;
            
            console.log(`📈 ${instance.config.resource} replenished by ${replenishment} for $${cost} (now ${instance.state.current}/${instance.state.max})`);
            
            this.emit('resource_replenished', { instance, amount: replenishment, cost });
            
            return { current: instance.state.current, cost };
        };
        
        return instance;
    }
}

// 3. Competition Template
class CompetitionTemplate extends CoreTemplate {
    constructor() {
        super('competition', {
            formats: ['1v1', 'tournament', 'battle_royale', 'team'],
            scoring: ['points', 'elimination', 'objective'],
            monetization: ['entry_fees', 'advantages', 'spectator_access']
        });
    }
    
    wrapInstance(instance) {
        instance.state = {
            competitors: instance.config.competitors || [],
            scores: new Map(),
            rounds: 0,
            winner: null
        };
        
        instance.runCompetition = async (options = {}) => {
            console.log(`⚔️ Running ${instance.config.format || '1v1'} competition: ${instance.config.name}`);
            
            instance.state.rounds++;
            
            // Initialize scores
            instance.config.competitors.forEach(competitor => {
                if (!instance.state.scores.has(competitor)) {
                    instance.state.scores.set(competitor, 0);
                }
            });
            
            // Simulate competition
            const results = instance.config.competitors.map(competitor => ({
                competitor,
                score: Math.random() * 100,
                performance: Math.random()
            }));
            
            // Update scores
            results.forEach(result => {
                const currentScore = instance.state.scores.get(result.competitor);
                instance.state.scores.set(result.competitor, currentScore + result.score);
            });
            
            // Determine winner
            const winner = results.sort((a, b) => b.score - a.score)[0];
            instance.state.winner = winner.competitor;
            
            // Calculate revenue
            const revenue = (instance.config.entryFee || 0) * instance.config.competitors.length;
            instance.metrics.revenue += revenue;
            
            console.log(`🏆 Competition complete! Winner: ${winner.competitor} with score ${winner.score.toFixed(2)}`);
            
            this.emit('competition_complete', { instance, results, winner, revenue });
            
            return { results, winner, revenue };
        };
        
        return instance;
    }
}

// 4. Status Template
class StatusTemplate extends CoreTemplate {
    constructor() {
        super('status', {
            stateTypes: ['binary', 'multi', 'gradient'],
            transitions: ['instant', 'timed', 'conditional'],
            visualization: ['color', 'icon', 'animation', 'sound'],
            monetization: ['sell_transitions', 'sell_effects', 'sell_permanence']
        });
    }
    
    wrapInstance(instance) {
        instance.state = {
            current: instance.config.initialState || 'default',
            history: [],
            effects: new Map()
        };
        
        instance.transition = (newState, options = {}) => {
            const oldState = instance.state.current;
            const transition = {
                from: oldState,
                to: newState,
                timestamp: Date.now(),
                cost: instance.config.transitionCost || 0,
                duration: options.duration || 0,
                effect: options.effect || instance.config.defaultEffect
            };
            
            instance.state.current = newState;
            instance.state.history.push(transition);
            instance.metrics.revenue += transition.cost;
            
            console.log(`🔄 Status transition: ${oldState} → ${newState} ${transition.effect ? `(${transition.effect})` : ''}`);
            
            // Apply effects
            if (transition.effect) {
                instance.state.effects.set(transition.effect, {
                    applied: Date.now(),
                    duration: transition.duration
                });
            }
            
            this.emit('status_changed', { instance, transition });
            
            return transition;
        };
        
        instance.getVisualization = () => {
            const stateConfig = instance.config.states?.[instance.state.current] || {};
            return {
                state: instance.state.current,
                color: stateConfig.color || '#808080',
                icon: stateConfig.icon || '❓',
                animation: stateConfig.animation || 'none',
                sound: stateConfig.sound || null,
                effects: Array.from(instance.state.effects.keys())
            };
        };
        
        return instance;
    }
}

// 5. Instance Template
class InstanceTemplate extends CoreTemplate {
    constructor() {
        super('instance', {
            types: ['persistent', 'temporary', 'dynamic'],
            activities: ['exploration', 'combat', 'social', 'economic'],
            monetization: ['access_fees', 'premium_features', 'exclusive_items']
        });
    }
    
    wrapInstance(instance) {
        instance.state = {
            active: false,
            players: new Set(),
            activities: new Map(),
            items: new Map(),
            revenue: 0
        };
        
        instance.start = () => {
            instance.state.active = true;
            console.log(`🌍 Instance started: ${instance.config.name} (${instance.config.type})`);
            
            // Initialize activities
            (instance.config.activities || []).forEach(activity => {
                instance.state.activities.set(activity, {
                    active: true,
                    participants: 0,
                    completions: 0
                });
            });
            
            this.emit('instance_started', { instance });
            
            return { success: true, instanceId: instance.id };
        };
        
        instance.addPlayer = (playerId) => {
            instance.state.players.add(playerId);
            
            // Charge access fee
            const accessFee = instance.config.accessFee || 0;
            instance.state.revenue += accessFee;
            instance.metrics.revenue += accessFee;
            
            console.log(`👤 Player ${playerId} joined ${instance.config.name} (fee: $${accessFee})`);
            
            this.emit('player_joined', { instance, playerId, fee: accessFee });
            
            return { success: true, charged: accessFee };
        };
        
        instance.generateItem = (itemType) => {
            const itemId = crypto.randomUUID();
            const item = {
                id: itemId,
                type: itemType,
                rarity: Math.random() > 0.9 ? 'rare' : Math.random() > 0.7 ? 'uncommon' : 'common',
                value: Math.floor(Math.random() * 100) + 10,
                created: Date.now()
            };
            
            instance.state.items.set(itemId, item);
            
            console.log(`✨ Generated ${item.rarity} ${itemType} worth $${item.value}`);
            
            this.emit('item_generated', { instance, item });
            
            return item;
        };
        
        return instance;
    }
}

// Main Registry Class
class UnifiedTemplateRegistry extends EventEmitter {
    constructor() {
        super();
        
        console.log('🎭 Initializing Unified Template Registry...');
        
        // Initialize the 5 core templates
        this.templates = new Map([
            ['dataTransform', new DataTransformTemplate()],
            ['resourceManagement', new ResourceManagementTemplate()],
            ['competition', new CompetitionTemplate()],
            ['status', new StatusTemplate()],
            ['instance', new InstanceTemplate()]
        ]);
        
        // Track all instances across all templates
        this.allInstances = new Map();
        
        // Set up event forwarding
        this.templates.forEach((template, type) => {
            template.on('instance_created', (instance) => {
                this.allInstances.set(instance.id, instance);
                this.emit('instance_created', { type, instance });
            });
        });
        
        console.log('✅ Registry initialized with 5 core templates');
    }
    
    // Create a new system from a template
    createSystem(templateType, config) {
        const template = this.templates.get(templateType);
        
        if (!template) {
            const availableTypes = Array.from(this.templates.keys()).join(', ');
            throw new Error(`Unknown template type: ${templateType}. Available types: ${availableTypes}`);
        }
        
        console.log(`🏗️ Creating ${templateType} system: ${config.name || 'unnamed'}`);
        
        return template.instantiate(config);
    }
    
    // Get template information
    getTemplateInfo(templateType) {
        const template = this.templates.get(templateType);
        
        if (!template) {
            return null;
        }
        
        return {
            type: template.type,
            config: template.config,
            instanceCount: template.instances.size,
            instances: Array.from(template.instances.values()).map(i => ({
                id: i.id,
                name: i.config.name,
                created: i.created,
                metrics: i.metrics
            }))
        };
    }
    
    // List all templates
    listTemplates() {
        return Array.from(this.templates.entries()).map(([type, template]) => ({
            type,
            description: this.getTemplateDescription(type),
            instanceCount: template.instances.size,
            totalRevenue: Array.from(template.instances.values())
                .reduce((sum, instance) => sum + (instance.metrics?.revenue || 0), 0)
        }));
    }
    
    // Get human-readable template descriptions
    getTemplateDescription(type) {
        const descriptions = {
            dataTransform: 'Transform any input into any output (documents→apps, voice→music, etc.)',
            resourceManagement: 'Manage depleting resources and sell replenishment (buckets, health, etc.)',
            competition: 'Run competitions and sell advantages (battles, debates, tournaments)',
            status: 'Manage state changes and sell transitions (potions, effects, buffs)',
            instance: 'Create worlds/environments and sell access/items (dungeons, zones)'
        };
        
        return descriptions[type] || 'Unknown template type';
    }
    
    // Find instances by criteria
    findInstances(criteria = {}) {
        return Array.from(this.allInstances.values()).filter(instance => {
            if (criteria.type && instance.type !== criteria.type) return false;
            if (criteria.name && !instance.config.name?.includes(criteria.name)) return false;
            if (criteria.minRevenue && instance.metrics.revenue < criteria.minRevenue) return false;
            
            return true;
        });
    }
    
    // Get system statistics
    getStats() {
        const stats = {
            templateCount: this.templates.size,
            totalInstances: this.allInstances.size,
            instancesByType: {},
            totalRevenue: 0,
            mostUsedTemplate: null,
            mostProfitableTemplate: null
        };
        
        // Calculate stats per template
        const templateStats = new Map();
        
        this.templates.forEach((template, type) => {
            const instances = Array.from(template.instances.values());
            const revenue = instances.reduce((sum, i) => sum + (i.metrics?.revenue || 0), 0);
            const uses = instances.reduce((sum, i) => sum + (i.metrics?.useCount || 0), 0);
            
            templateStats.set(type, { instances: instances.length, revenue, uses });
            stats.instancesByType[type] = instances.length;
            stats.totalRevenue += revenue;
        });
        
        // Find most used and most profitable
        let maxUses = 0;
        let maxRevenue = 0;
        
        templateStats.forEach((stat, type) => {
            if (stat.uses > maxUses) {
                maxUses = stat.uses;
                stats.mostUsedTemplate = type;
            }
            if (stat.revenue > maxRevenue) {
                maxRevenue = stat.revenue;
                stats.mostProfitableTemplate = type;
            }
        });
        
        return stats;
    }
}

// Export the registry
module.exports = UnifiedTemplateRegistry;

// CLI Demo
if (require.main === module) {
    console.log('\n🎮 UNIFIED TEMPLATE REGISTRY DEMO\n');
    
    const registry = new UnifiedTemplateRegistry();
    
    // Show available templates
    console.log('📋 Available Templates:');
    registry.listTemplates().forEach(template => {
        console.log(`   ${template.type}: ${template.description}`);
    });
    
    console.log('\n🔧 Creating Example Systems:\n');
    
    // Example 1: Tempoross (Resource Management)
    console.log('1️⃣ Creating Tempoross Boss (Resource Management):');
    const tempoross = registry.createSystem('resourceManagement', {
        name: 'Tempoross',
        resource: 'boat_health',
        initialValue: 100,
        maxValue: 100,
        depletionRate: 5,
        replenishmentAmount: 20,
        replenishmentCost: 50,
        depletion: 'water_damage',
        replenishment: 'buckets',
        monetization: 'sell_buckets'
    });
    
    // Simulate some gameplay
    tempoross.deplete(10);
    tempoross.replenish();
    
    // Example 2: AI Debate (Competition)
    console.log('\n2️⃣ Creating AI Debate Arena (Competition):');
    const aiDebate = registry.createSystem('competition', {
        name: 'AI Grand Debate',
        competitors: ['Claude', 'GPT-4', 'Gemini', 'Llama'],
        format: 'tournament',
        rules: 'reasoning_quality',
        scoring: 'argument_strength',
        entryFee: 100,
        monetization: 'sell_transcripts'
    });
    
    // Run a competition
    aiDebate.runCompetition();
    
    // Example 3: Voice to Music (Data Transform)
    console.log('\n3️⃣ Creating Voice-to-Music Converter (Data Transform):');
    const voiceToMusic = registry.createSystem('dataTransform', {
        name: 'Magical Voice Transformer',
        input: 'voice_recording',
        processing: 'neural_synthesis',
        output: 'binaural_music',
        monetization: 'sell_generated_tracks'
    });
    
    // Transform some audio
    voiceToMusic.transform('user_voice_sample.wav', { quality: 2 });
    
    // Example 4: Hollowtown Potions (Status)
    console.log('\n4️⃣ Creating Hollowtown Color Potions (Status):');
    const potions = registry.createSystem('status', {
        name: 'Hollowtown Status Effects',
        states: {
            online: { color: '#00FF00', icon: '🟢', animation: 'pulse' },
            admin: { color: '#000000', icon: '⚫', animation: 'void' },
            busy: { color: '#FFA500', icon: '🟠', animation: 'spin' }
        },
        initialState: 'online',
        transitionCost: 25,
        defaultEffect: 'color_change'
    });
    
    // Change status
    potions.transition('admin', { effect: 'void_transformation' });
    console.log('   Current visualization:', potions.getVisualization());
    
    // Example 5: Grand Exchange (Instance)
    console.log('\n5️⃣ Creating Grand Exchange (Instance):');
    const grandExchange = registry.createSystem('instance', {
        name: 'Grand Exchange',
        type: 'persistent',
        activities: ['trading', 'socializing', 'price_checking'],
        accessFee: 0,
        monetization: 'transaction_fees'
    });
    
    // Start instance and add player
    grandExchange.start();
    grandExchange.addPlayer('player123');
    grandExchange.generateItem('rare_commodity');
    
    // Show final statistics
    console.log('\n📊 Registry Statistics:');
    const stats = registry.getStats();
    console.log(`   Total Templates: ${stats.templateCount}`);
    console.log(`   Total Instances: ${stats.totalInstances}`);
    console.log(`   Total Revenue: $${stats.totalRevenue.toFixed(2)}`);
    console.log(`   Most Used: ${stats.mostUsedTemplate || 'none'}`);
    console.log(`   Most Profitable: ${stats.mostProfitableTemplate || 'none'}`);
    
    console.log('\n✅ Demo complete! Remember: Everything is one of these 5 templates.\n');
}