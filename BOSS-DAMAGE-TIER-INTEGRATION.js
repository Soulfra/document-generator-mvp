#!/usr/bin/env node

/**
 * 🐉 BOSS-DAMAGE TIER INTEGRATION
 * Ring 1 system - Connects boss system with tier-based damage restrictions
 * Dragons (Tier 3) get magic+physical, other tiers have specific limitations
 */

const EventEmitter = require('events');
const TierBasedDamageSystem = require('./TIER-BASED-DAMAGE-SYSTEM.js');
const NestedStructureNavigator = require('./NESTED-STRUCTURE-NAVIGATOR.js');

class BossDamageTierIntegration extends EventEmitter {
    constructor() {
        super();
        
        // Initialize dependencies
        this.damageSystem = new TierBasedDamageSystem();
        this.navigator = new NestedStructureNavigator();
        
        // Boss tier mapping (connects existing boss types to damage tiers)
        this.bossTierMapping = {
            // Tier 1: Physical only
            'goblin': { tier: 1, baseType: 'goblin warrior' },
            'skeleton': { tier: 1, baseType: 'undead minion' },
            'rat': { tier: 1, baseType: 'vermin' },
            'wolf': { tier: 1, baseType: 'beast' },
            
            // Tier 2: Physical + Ranged
            'archer': { tier: 2, baseType: 'ranged combatant' },
            'knight': { tier: 2, baseType: 'armored warrior' },
            'hunter': { tier: 2, baseType: 'tracker' },
            'bandit': { tier: 2, baseType: 'outlaw' },
            
            // Tier 3: Magic + Physical (DRAGONS!)
            'dragon': { tier: 3, baseType: 'draconic', special: true },
            'elder_dragon': { tier: 3, baseType: 'ancient draconic', special: true },
            'fire_dragon': { tier: 3, baseType: 'elemental draconic', special: true },
            'ice_dragon': { tier: 3, baseType: 'elemental draconic', special: true },
            'lich': { tier: 3, baseType: 'undead mage' },
            'demon': { tier: 3, baseType: 'infernal' },
            
            // Tier 4: All damage types
            'ancient_dragon': { tier: 4, baseType: 'legendary draconic', special: true },
            'void_lord': { tier: 4, baseType: 'dimensional' },
            'god_king': { tier: 4, baseType: 'divine' },
            'titan': { tier: 4, baseType: 'primordial' },
            
            // Tier 5: All + Chaos
            'chaos_dragon': { tier: 5, baseType: 'chaos draconic', special: true },
            'reality_weaver': { tier: 5, baseType: 'reality bender' },
            'time_lord': { tier: 5, baseType: 'temporal' },
            'universe_eater': { tier: 5, baseType: 'cosmic horror' }
        };
        
        // Authority level to boss tier conversion
        this.authorityToTierMapping = {
            'EXILE': 1,
            'PEASANT': 1,
            'CITIZEN': 2,
            'MERCHANT': 2,
            'KNIGHT': 3,  // Knights can summon dragons!
            'LORD': 4,
            'KING': 5
        };
        
        // Dragon-specific configurations
        this.dragonConfigurations = {
            base: {
                breathWeapon: {
                    damageType: 'magic',
                    baseDamage: 35,
                    areaEffect: true,
                    cooldown: 10
                },
                physicalAttacks: {
                    bite: { damageType: 'physical', baseDamage: 25, critChance: 0.2 },
                    claw: { damageType: 'physical', baseDamage: 20, attackCount: 2 },
                    tailSwipe: { damageType: 'physical', baseDamage: 30, areaEffect: true }
                },
                resistances: {
                    magic: 0.3,
                    physical: 0.2,
                    ranged: 0.4
                }
            },
            
            elemental: {
                fire: {
                    breathWeapon: { damageType: 'magic', statusEffect: 'burn', color: '#FF4500' },
                    immunity: 'fire',
                    weakness: 'ice'
                },
                ice: {
                    breathWeapon: { damageType: 'magic', statusEffect: 'freeze', color: '#00BFFF' },
                    immunity: 'ice',
                    weakness: 'fire'
                },
                lightning: {
                    breathWeapon: { damageType: 'magic', statusEffect: 'shock', color: '#FFD700' },
                    immunity: 'shock',
                    weakness: 'earth'
                },
                poison: {
                    breathWeapon: { damageType: 'magic', statusEffect: 'poison', color: '#32CD32' },
                    immunity: 'poison',
                    weakness: 'holy'
                }
            }
        };
        
        // Combat phase modifiers (bosses change tactics based on health)
        this.combatPhases = {
            healthy: { threshold: 0.75, damageModifier: 1.0, defenseModifier: 1.0 },
            wounded: { threshold: 0.50, damageModifier: 1.2, defenseModifier: 0.9 },
            desperate: { threshold: 0.25, damageModifier: 1.5, defenseModifier: 0.8 },
            enraged: { threshold: 0.10, damageModifier: 2.0, defenseModifier: 0.5 }
        };
        
        console.log('🐉 Boss-Damage Tier Integration initialized');
        console.log(`📊 ${Object.keys(this.bossTierMapping).length} boss types mapped`);
        console.log(`🐲 ${Object.keys(this.dragonConfigurations.elemental).length} dragon variants configured`);
    }
    
    /**
     * Create a tiered boss with appropriate damage restrictions
     */
    async createTieredBoss(bossType, options = {}) {
        const mapping = this.bossTierMapping[bossType.toLowerCase()];
        if (!mapping) {
            throw new Error(`Unknown boss type: ${bossType}`);
        }
        
        // Use damage system to generate base boss
        const boss = this.damageSystem.generateTierBoss(mapping.tier, {
            name: options.name || this.generateBossName(bossType, mapping.tier),
            type: bossType,
            ...options
        });
        
        // Add tier-specific enhancements
        this.enhanceBossWithTierAbilities(boss, mapping);
        
        // Special dragon enhancements
        if (bossType.includes('dragon')) {
            await this.enhanceDragonBoss(boss, options.element);
        }
        
        // Set up combat phase tracking
        boss.currentPhase = 'healthy';
        boss.maxHealth = boss.health;
        
        // Add visual indicators
        boss.visualEffects = this.generateVisualEffects(boss);
        
        this.emit('bossCreated', {
            boss,
            tier: mapping.tier,
            damageTypes: this.damageSystem.getAvailableDamageTypes(mapping.tier)
        });
        
        return boss;
    }
    
    /**
     * Enhance boss with tier-specific abilities
     */
    enhanceBossWithTierAbilities(boss, mapping) {
        const tierDef = this.damageSystem.tierDefinitions[mapping.tier];
        
        // Add tier description
        boss.tierInfo = {
            tier: mapping.tier,
            name: tierDef.name,
            description: tierDef.description,
            colorCoding: tierDef.colorCoding
        };
        
        // Ensure boss only uses allowed damage types
        boss.attacks = boss.attacks.filter(attack => 
            tierDef.damageTypes.includes(attack.damageType)
        );
        
        // Add tier-specific mechanics
        switch (mapping.tier) {
            case 1:
                // Basic tier - simple patterns
                boss.mechanics = ['basic_attack_pattern', 'predictable_movement'];
                break;
                
            case 2:
                // Advanced tier - mix of melee and ranged
                boss.mechanics = ['alternating_attacks', 'positional_advantage'];
                boss.specialAbilities.push({
                    name: 'Volley',
                    damageType: 'ranged',
                    description: 'Fires multiple projectiles'
                });
                break;
                
            case 3:
                // Elite tier - magic/physical combo
                boss.mechanics = ['phase_transitions', 'combo_attacks', 'elemental_resistance'];
                boss.comboAttacks = this.generateComboAttacks(boss.tier);
                break;
                
            case 4:
                // Legendary tier - all damage types
                boss.mechanics = ['adaptive_resistance', 'damage_type_cycling', 'minion_summoning'];
                boss.adaptiveResistance = { active: false, currentResist: null };
                break;
                
            case 5:
                // Mythic tier - reality-bending
                boss.mechanics = ['chaos_mode', 'time_manipulation', 'dimensional_shifts'];
                boss.chaosMode = { active: false, stackCount: 0 };
                break;
        }
    }
    
    /**
     * Enhance dragon bosses with special abilities
     */
    async enhanceDragonBoss(boss, element = 'fire') {
        boss.isDragon = true;
        boss.element = element;
        
        // Base dragon abilities
        const dragonBase = this.dragonConfigurations.base;
        
        // Breath weapon (magic damage)
        boss.breathWeapon = {
            ...dragonBase.breathWeapon,
            ...this.dragonConfigurations.elemental[element]?.breathWeapon
        };
        
        // Physical attacks
        Object.entries(dragonBase.physicalAttacks).forEach(([name, attack]) => {
            boss.attacks.push({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                ...attack
            });
        });
        
        // Dragon-specific special abilities
        boss.specialAbilities.push({
            name: 'Dragon Fear',
            description: 'Terrifies enemies, reducing their accuracy',
            cooldown: 20,
            effect: 'fear',
            radius: 10
        });
        
        if (boss.tier >= 3) {
            boss.specialAbilities.push({
                name: 'Wing Buffet',
                description: 'Powerful wind attack that knocks back enemies',
                damageType: 'physical',
                cooldown: 15,
                knockback: true
            });
        }
        
        if (boss.tier >= 4) {
            boss.specialAbilities.push({
                name: 'Ancient Wisdom',
                description: 'Predicts and counters enemy strategies',
                effect: 'counterattack',
                cooldown: 30
            });
        }
        
        // Set dragon visual theme
        boss.visualTheme = {
            primaryColor: this.dragonConfigurations.elemental[element]?.color || '#8B0000',
            scale: 'large',
            wingspan: boss.tier * 5,
            effects: ['scale_shimmer', 'smoke_trail', 'glowing_eyes']
        };
        
        console.log(`🐲 Enhanced ${element} dragon (Tier ${boss.tier})`);
    }
    
    /**
     * Calculate damage with tier restrictions and visual feedback
     */
    calculateTieredDamage(attacker, defender, attackType) {
        // Ensure attacker can use this damage type
        if (!this.damageSystem.canUseDamageType(attacker.tier, attackType)) {
            this.emit('invalidAttack', {
                attacker,
                attackType,
                reason: `Tier ${attacker.tier} cannot use ${attackType} damage`,
                allowedTypes: this.damageSystem.getAvailableDamageTypes(attacker.tier)
            });
            return 0;
        }
        
        // Get current combat phase modifier
        const phaseModifier = this.getPhaseModifier(attacker);
        
        // Calculate base damage using tier system
        let damage = this.damageSystem.calculateDamage(
            attacker,
            defender,
            attackType,
            attacker.attacks.find(a => a.damageType === attackType)?.baseDamage
        );
        
        // Apply phase modifier
        damage *= phaseModifier.damageModifier;
        
        // Special dragon breath weapon handling
        if (attacker.isDragon && attackType === 'magic' && attacker.breathWeapon) {
            damage *= 1.5; // Dragons deal extra magic damage
            
            // Apply elemental effects
            if (attacker.breathWeapon.statusEffect) {
                this.applyElementalEffect(defender, attacker.breathWeapon.statusEffect);
            }
        }
        
        // Create visual feedback
        const visualFeedback = this.createDamageFeedback(damage, attackType, attacker.tier);
        
        this.emit('damageDealt', {
            attacker,
            defender,
            attackType,
            damage: Math.round(damage),
            phase: attacker.currentPhase,
            visualFeedback
        });
        
        return Math.round(damage);
    }
    
    /**
     * Update boss phase based on health
     */
    updateBossPhase(boss) {
        const healthPercent = boss.health / boss.maxHealth;
        let newPhase = 'healthy';
        
        for (const [phase, config] of Object.entries(this.combatPhases)) {
            if (healthPercent <= config.threshold) {
                newPhase = phase;
            }
        }
        
        if (newPhase !== boss.currentPhase) {
            const oldPhase = boss.currentPhase;
            boss.currentPhase = newPhase;
            
            this.emit('phaseChange', {
                boss,
                oldPhase,
                newPhase,
                healthPercent,
                announcement: this.generatePhaseAnnouncement(boss, newPhase)
            });
            
            // Trigger phase-specific abilities
            this.triggerPhaseAbilities(boss, newPhase);
        }
    }
    
    /**
     * Get phase modifier for damage/defense
     */
    getPhaseModifier(boss) {
        return this.combatPhases[boss.currentPhase] || this.combatPhases.healthy;
    }
    
    /**
     * Generate combo attacks for tier 3+ bosses
     */
    generateComboAttacks(tier) {
        const combos = [];
        
        if (tier >= 3) {
            combos.push({
                name: 'Magic-Physical Combo',
                sequence: ['magic', 'physical', 'physical'],
                damageMultiplier: 1.3,
                description: 'Devastating combination of magical and physical strikes'
            });
        }
        
        if (tier >= 4) {
            combos.push({
                name: 'Omni-Strike',
                sequence: ['physical', 'ranged', 'magic', 'true'],
                damageMultiplier: 1.5,
                description: 'Attacks with all available damage types'
            });
        }
        
        if (tier >= 5) {
            combos.push({
                name: 'Chaos Cascade',
                sequence: ['chaos', 'chaos', 'chaos'],
                damageMultiplier: 'random', // 0.5x to 3.0x
                description: 'Unpredictable chaos damage sequence'
            });
        }
        
        return combos;
    }
    
    /**
     * Create damage feedback with tier-appropriate visuals
     */
    createDamageFeedback(damage, damageType, tier) {
        const tierDef = this.damageSystem.tierDefinitions[tier];
        const color = tierDef.colorCoding[damageType] || '#FFFFFF';
        
        return {
            text: `${damage}`,
            color,
            icon: this.damageSystem.damageTypes[damageType].icon,
            size: this.calculateDamageTextSize(damage, tier),
            animation: this.selectDamageAnimation(damageType, tier),
            particleEffect: this.generateParticleEffect(damageType, tier),
            screenShake: damage > 50 ? Math.min(damage / 10, 10) : 0
        };
    }
    
    /**
     * Generate visual effects for boss
     */
    generateVisualEffects(boss) {
        const effects = {
            aura: this.generateAuraEffect(boss.tier),
            particles: this.generateParticleSystem(boss.tier, boss.type),
            colorScheme: this.damageSystem.tierDefinitions[boss.tier].colorCoding,
            scale: 1 + (boss.tier * 0.2), // Bigger bosses for higher tiers
            glowIntensity: boss.tier * 20
        };
        
        // Special effects for dragons
        if (boss.isDragon) {
            effects.special = {
                wingAnimation: true,
                breathParticles: true,
                scaleShimmer: true,
                tailTrail: true
            };
        }
        
        return effects;
    }
    
    /**
     * Search for boss-related files using navigator
     */
    async findBossFiles(searchTerm) {
        // Build index if not already done
        if (this.navigator.searchIndex.size === 0) {
            await this.navigator.buildSearchIndex();
        }
        
        // Search for boss-related files
        const results = await this.navigator.search(searchTerm, {
            searchType: 'all',
            maxResults: 20
        });
        
        // Filter for boss-specific files
        const bossFiles = results.filter(file => 
            file.type === 'boss' || 
            file.name.toLowerCase().includes('boss') ||
            file.name.toLowerCase().includes('dragon')
        );
        
        return bossFiles;
    }
    
    /**
     * Helper methods
     */
    generateBossName(type, tier) {
        const tierPrefixes = {
            1: ['Lesser', 'Young', 'Weak'],
            2: ['Standard', 'Adult', 'Trained'],
            3: ['Elder', 'Ancient', 'Powerful'],
            4: ['Legendary', 'Mythical', 'Supreme'],
            5: ['Primordial', 'Cosmic', 'Reality-Bending']
        };
        
        const prefix = tierPrefixes[tier][Math.floor(Math.random() * tierPrefixes[tier].length)];
        const formattedType = type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
        
        return `${prefix} ${formattedType}`;
    }
    
    generatePhaseAnnouncement(boss, phase) {
        const announcements = {
            wounded: `${boss.name} is wounded and fighting more aggressively!`,
            desperate: `${boss.name} grows desperate, attacks becoming wild!`,
            enraged: `${boss.name} enters an enraged state! Extreme caution advised!`
        };
        
        return announcements[phase] || `${boss.name} continues fighting...`;
    }
    
    triggerPhaseAbilities(boss, phase) {
        if (phase === 'enraged' && boss.tier >= 3) {
            // Unlock special enrage abilities
            boss.specialAbilities.push({
                name: 'Enraged Fury',
                description: 'Attacks twice as fast',
                duration: -1 // Permanent
            });
        }
    }
    
    calculateDamageTextSize(damage, tier) {
        const baseSize = 16;
        const tierBonus = tier * 2;
        const damageScale = Math.log10(damage + 1) * 5;
        
        return Math.min(baseSize + tierBonus + damageScale, 72);
    }
    
    selectDamageAnimation(damageType, tier) {
        const animations = {
            physical: ['slash', 'impact', 'crack'],
            ranged: ['pierce', 'arrow_hit', 'bullet_hole'],
            magic: ['explosion', 'sparkle', 'energy_burst'],
            true: ['reality_tear', 'void_ripple', 'golden_flash'],
            chaos: ['spiral', 'glitch', 'rainbow_burst']
        };
        
        const typeAnimations = animations[damageType] || animations.physical;
        return typeAnimations[Math.min(tier - 1, typeAnimations.length - 1)];
    }
    
    generateParticleEffect(damageType, tier) {
        return {
            type: damageType,
            count: tier * 10,
            spread: tier * 5,
            lifetime: 1000 + (tier * 200),
            color: this.damageSystem.tierDefinitions[tier].colorCoding[damageType]
        };
    }
    
    generateAuraEffect(tier) {
        return {
            radius: tier * 2,
            intensity: tier * 0.2,
            pulseSpeed: 2 - (tier * 0.2),
            color: tier >= 4 ? 'rainbow' : 'monochrome'
        };
    }
    
    generateParticleSystem(tier, type) {
        const system = {
            emissionRate: tier * 5,
            particleLifetime: 2000,
            spread: 360,
            speed: tier * 10
        };
        
        if (type.includes('dragon')) {
            system.special = 'smoke_and_embers';
        }
        
        return system;
    }
    
    applyElementalEffect(target, effect) {
        this.emit('elementalEffect', {
            target,
            effect,
            duration: 3000,
            visual: `${effect}_overlay`
        });
    }
}

module.exports = BossDamageTierIntegration;

// CLI testing
if (require.main === module) {
    async function test() {
        console.log('🐉 Testing Boss-Damage Tier Integration\n');
        
        const integration = new BossDamageTierIntegration();
        
        // Create different tier bosses
        console.log('🎮 CREATING TIERED BOSSES:');
        console.log('==========================');
        
        // Tier 1 boss (physical only)
        const goblin = await integration.createTieredBoss('goblin', { name: 'Goblin Grunt' });
        console.log(`\nTier 1 - ${goblin.name}:`);
        console.log(`  Damage Types: ${goblin.tierInfo.colorCoding ? Object.keys(goblin.tierInfo.colorCoding).join(', ') : 'none'}`);
        console.log(`  Attacks: ${goblin.attacks.map(a => `${a.name} (${a.damageType})`).join(', ')}`);
        
        // Tier 3 dragon (magic + physical)
        const dragon = await integration.createTieredBoss('dragon', { 
            name: 'Crimson Dragon',
            element: 'fire'
        });
        console.log(`\nTier 3 - ${dragon.name}:`);
        console.log(`  Damage Types: ${Object.keys(dragon.tierInfo.colorCoding).join(', ')}`);
        console.log(`  Special: Breath Weapon (${dragon.breathWeapon.damageType})`);
        console.log(`  Dragon Abilities: ${dragon.specialAbilities.map(a => a.name).join(', ')}`);
        
        // Tier 5 chaos dragon
        const chaosDragon = await integration.createTieredBoss('chaos_dragon', {
            name: 'Void-Touched Chaos Dragon'
        });
        console.log(`\nTier 5 - ${chaosDragon.name}:`);
        console.log(`  Damage Types: ${Object.keys(chaosDragon.tierInfo.colorCoding).join(', ')}`);
        console.log(`  Mechanics: ${chaosDragon.mechanics.join(', ')}`);
        
        console.log('\n⚔️ DAMAGE CALCULATIONS:');
        console.log('=======================');
        
        // Test goblin trying to use magic (should fail)
        console.log('\nGoblin tries magic attack:');
        const goblinMagic = integration.calculateTieredDamage(goblin, dragon, 'magic');
        console.log(`  Result: ${goblinMagic} damage (should be 0)`);
        
        // Test dragon using both damage types
        console.log('\nDragon attacks with magic and physical:');
        const dragonMagic = integration.calculateTieredDamage(dragon, goblin, 'magic');
        const dragonPhysical = integration.calculateTieredDamage(dragon, goblin, 'physical');
        console.log(`  Magic damage: ${dragonMagic}`);
        console.log(`  Physical damage: ${dragonPhysical}`);
        
        console.log('\n🔄 PHASE TRANSITIONS:');
        console.log('=====================');
        
        // Simulate boss taking damage
        dragon.health = dragon.maxHealth * 0.4; // 40% health
        integration.updateBossPhase(dragon);
        console.log(`Dragon at 40% health: Phase = ${dragon.currentPhase}`);
        
        dragon.health = dragon.maxHealth * 0.09; // 9% health
        integration.updateBossPhase(dragon);
        console.log(`Dragon at 9% health: Phase = ${dragon.currentPhase}`);
        
        console.log('\n🔍 BOSS FILE SEARCH:');
        console.log('====================');
        const bossFiles = await integration.findBossFiles('dragon');
        console.log(`Found ${bossFiles.length} dragon-related files:`);
        bossFiles.slice(0, 5).forEach(file => {
            console.log(`  - ${file.name} (Ring ${file.ring || 'unknown'})`);
        });
        
        console.log('\n✅ Boss-Damage Tier Integration test complete!');
    }
    
    test().catch(console.error);
}