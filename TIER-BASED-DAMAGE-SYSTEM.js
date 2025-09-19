#!/usr/bin/env node

/**
 * ⚔️ TIER-BASED DAMAGE SYSTEM
 * Ring 1 system - Implements tier-specific damage type restrictions and effectiveness
 * Higher tiers can use more damage types, with Tier 3 (dragons) having magic+physical
 */

const EventEmitter = require('events');

class TierBasedDamageSystem extends EventEmitter {
    constructor() {
        super();
        
        // Tier definitions with damage type restrictions
        this.tierDefinitions = {
            1: {
                name: 'Basic Tier',
                damageTypes: ['physical'],
                colorCoding: {
                    physical: '#8B7355'  // Brown
                },
                description: 'Physical damage only - Basic melee attacks',
                examples: ['Goblin', 'Rat', 'Skeleton'],
                damageRange: { min: 5, max: 15 },
                resistances: {
                    physical: 0,
                    ranged: 0.2,
                    magic: 0.5
                }
            },
            
            2: {
                name: 'Advanced Tier',
                damageTypes: ['physical', 'ranged'],
                colorCoding: {
                    physical: '#8B7355',  // Brown
                    ranged: '#228B22'     // Green
                },
                description: 'Physical + Ranged damage - Archers and warriors',
                examples: ['Archer', 'Knight', 'Hunter'],
                damageRange: { min: 10, max: 25 },
                resistances: {
                    physical: 0.1,
                    ranged: 0.1,
                    magic: 0.4
                }
            },
            
            3: {
                name: 'Elite Tier',
                damageTypes: ['physical', 'magic'],
                colorCoding: {
                    physical: '#DC143C',  // Crimson
                    magic: '#9370DB'      // Purple
                },
                description: 'Magic + Physical damage - Dragons and high-tier bosses',
                examples: ['Dragon', 'Lich', 'Demon Lord'],
                damageRange: { min: 20, max: 40 },
                resistances: {
                    physical: 0.2,
                    ranged: 0.3,
                    magic: 0.1
                }
            },
            
            4: {
                name: 'Legendary Tier',
                damageTypes: ['physical', 'ranged', 'magic', 'true'],
                colorCoding: {
                    physical: '#DC143C',   // Crimson
                    ranged: '#32CD32',     // Lime
                    magic: '#9370DB',      // Purple
                    true: '#FFD700'        // Gold
                },
                description: 'All damage types including true damage - Legendary beings',
                examples: ['Ancient Dragon', 'God King', 'Void Lord'],
                damageRange: { min: 30, max: 60 },
                resistances: {
                    physical: 0.3,
                    ranged: 0.3,
                    magic: 0.2,
                    true: 0
                }
            },
            
            5: {
                name: 'Mythic Tier',
                damageTypes: ['physical', 'ranged', 'magic', 'true', 'chaos'],
                colorCoding: {
                    physical: '#FF69B4',   // Hot Pink
                    ranged: '#00CED1',     // Dark Turquoise
                    magic: '#FF1493',      // Deep Pink
                    true: '#FFD700',       // Gold
                    chaos: '#4B0082'       // Indigo (rainbow effect)
                },
                description: 'All damage types plus chaos - Reality-bending entities',
                examples: ['Chaos Dragon', 'Reality Weaver', 'Time Lord'],
                damageRange: { min: 50, max: 100 },
                resistances: {
                    physical: 0.4,
                    ranged: 0.4,
                    magic: 0.3,
                    true: 0.1,
                    chaos: 0
                }
            }
        };
        
        // Damage type definitions
        this.damageTypes = {
            physical: {
                name: 'Physical',
                icon: '⚔️',
                description: 'Standard melee damage',
                scalingFactor: 1.0,
                critChance: 0.15,
                statusEffects: ['bleed', 'stun']
            },
            
            ranged: {
                name: 'Ranged',
                icon: '🏹',
                description: 'Projectile-based damage',
                scalingFactor: 0.9,
                critChance: 0.25,
                statusEffects: ['slow', 'mark']
            },
            
            magic: {
                name: 'Magic',
                icon: '🔮',
                description: 'Magical damage that bypasses armor',
                scalingFactor: 1.2,
                critChance: 0.20,
                statusEffects: ['burn', 'freeze', 'shock']
            },
            
            true: {
                name: 'True',
                icon: '⚡',
                description: 'Damage that ignores all resistances',
                scalingFactor: 0.8,
                critChance: 0.10,
                statusEffects: ['silence']
            },
            
            chaos: {
                name: 'Chaos',
                icon: '🌀',
                description: 'Unpredictable damage with random effects',
                scalingFactor: 'random', // 0.5x to 2.0x
                critChance: 'random',     // 0% to 50%
                statusEffects: ['confusion', 'polymorph', 'time_warp']
            }
        };
        
        // Combat triangle (RuneScape style)
        this.combatTriangle = {
            physical: {
                strong: ['ranged'],
                weak: ['magic'],
                neutral: ['physical', 'true', 'chaos']
            },
            ranged: {
                strong: ['magic'],
                weak: ['physical'],
                neutral: ['ranged', 'true', 'chaos']
            },
            magic: {
                strong: ['physical'],
                weak: ['ranged'],
                neutral: ['magic', 'true', 'chaos']
            },
            true: {
                strong: [],
                weak: [],
                neutral: ['physical', 'ranged', 'magic', 'true', 'chaos']
            },
            chaos: {
                strong: 'random',
                weak: 'random',
                neutral: []
            }
        };
        
        // Tier progression requirements
        this.tierProgressionRequirements = {
            2: { level: 10, bosses_defeated: 3 },
            3: { level: 25, bosses_defeated: 10, special_item: 'dragon_scale' },
            4: { level: 50, bosses_defeated: 25, special_item: 'legendary_essence' },
            5: { level: 100, bosses_defeated: 100, special_item: 'chaos_fragment' }
        };
        
        console.log('⚔️ Tier-Based Damage System initialized');
        console.log(`📊 ${Object.keys(this.tierDefinitions).length} tiers configured`);
        console.log(`🎯 ${Object.keys(this.damageTypes).length} damage types available`);
    }
    
    /**
     * Calculate damage based on attacker tier, damage type, and defender
     */
    calculateDamage(attacker, defender, damageType, baseDamage) {
        // Validate tier can use this damage type
        if (!this.canUseDamageType(attacker.tier, damageType)) {
            console.warn(`Tier ${attacker.tier} cannot use ${damageType} damage!`);
            return 0;
        }
        
        // Get base damage from tier if not provided
        if (!baseDamage) {
            const tierDef = this.tierDefinitions[attacker.tier];
            baseDamage = this.randomInRange(tierDef.damageRange.min, tierDef.damageRange.max);
        }
        
        // Apply damage type scaling
        let damage = baseDamage;
        const damageTypeDef = this.damageTypes[damageType];
        
        if (damageTypeDef.scalingFactor === 'random') {
            damage *= this.randomInRange(0.5, 2.0);
        } else {
            damage *= damageTypeDef.scalingFactor;
        }
        
        // Apply combat triangle effectiveness
        const effectiveness = this.getCombatEffectiveness(damageType, defender.primaryResistance);
        damage *= effectiveness;
        
        // Apply defender resistances
        const defenderTier = this.tierDefinitions[defender.tier];
        const resistance = defenderTier.resistances[damageType] || 0;
        damage *= (1 - resistance);
        
        // Calculate critical hit
        const critChance = damageTypeDef.critChance === 'random' 
            ? Math.random() * 0.5 
            : damageTypeDef.critChance;
            
        if (Math.random() < critChance) {
            damage *= 2;
            this.emit('criticalHit', { attacker, defender, damageType, damage });
        }
        
        // Apply status effects
        const statusEffect = this.rollStatusEffect(damageType);
        if (statusEffect) {
            this.emit('statusEffect', { 
                target: defender, 
                effect: statusEffect, 
                source: attacker,
                damageType
            });
        }
        
        // Round damage
        damage = Math.round(damage);
        
        // Emit damage event
        this.emit('damageCalculated', {
            attacker,
            defender,
            damageType,
            baseDamage,
            finalDamage: damage,
            effectiveness,
            resistance,
            color: this.getDamageColor(attacker.tier, damageType)
        });
        
        return damage;
    }
    
    /**
     * Check if a tier can use a specific damage type
     */
    canUseDamageType(tier, damageType) {
        const tierDef = this.tierDefinitions[tier];
        return tierDef && tierDef.damageTypes.includes(damageType);
    }
    
    /**
     * Get combat triangle effectiveness multiplier
     */
    getCombatEffectiveness(attackType, defendType) {
        const triangle = this.combatTriangle[attackType];
        
        if (!triangle) return 1.0;
        
        // Handle chaos randomness
        if (triangle.strong === 'random' || triangle.weak === 'random') {
            return this.randomInRange(0.5, 1.5);
        }
        
        if (triangle.strong.includes(defendType)) {
            return 1.25; // 25% bonus damage
        } else if (triangle.weak.includes(defendType)) {
            return 0.75; // 25% reduced damage
        }
        
        return 1.0; // Neutral
    }
    
    /**
     * Roll for status effect application
     */
    rollStatusEffect(damageType) {
        const effects = this.damageTypes[damageType].statusEffects;
        
        // 30% chance to apply status effect
        if (Math.random() < 0.3) {
            return effects[Math.floor(Math.random() * effects.length)];
        }
        
        return null;
    }
    
    /**
     * Get damage color for visual feedback
     */
    getDamageColor(tier, damageType) {
        const tierDef = this.tierDefinitions[tier];
        return tierDef.colorCoding[damageType] || '#FFFFFF';
    }
    
    /**
     * Get available damage types for a tier
     */
    getAvailableDamageTypes(tier) {
        const tierDef = this.tierDefinitions[tier];
        if (!tierDef) return [];
        
        return tierDef.damageTypes.map(type => ({
            type,
            ...this.damageTypes[type],
            color: tierDef.colorCoding[type]
        }));
    }
    
    /**
     * Check if entity can progress to next tier
     */
    canProgressToNextTier(entity) {
        const currentTier = entity.tier;
        const nextTier = currentTier + 1;
        
        if (!this.tierDefinitions[nextTier]) {
            return { canProgress: false, reason: 'Already at max tier' };
        }
        
        const requirements = this.tierProgressionRequirements[nextTier];
        
        // Check level requirement
        if (entity.level < requirements.level) {
            return { 
                canProgress: false, 
                reason: `Need level ${requirements.level} (current: ${entity.level})`
            };
        }
        
        // Check bosses defeated
        if (entity.bossesDefeated < requirements.bosses_defeated) {
            return { 
                canProgress: false, 
                reason: `Need to defeat ${requirements.bosses_defeated} bosses (current: ${entity.bossesDefeated})`
            };
        }
        
        // Check special item
        if (requirements.special_item && !entity.inventory?.includes(requirements.special_item)) {
            return { 
                canProgress: false, 
                reason: `Need special item: ${requirements.special_item}`
            };
        }
        
        return { canProgress: true, nextTier };
    }
    
    /**
     * Progress entity to next tier
     */
    progressToNextTier(entity) {
        const progression = this.canProgressToNextTier(entity);
        
        if (!progression.canProgress) {
            return { success: false, reason: progression.reason };
        }
        
        const oldTier = entity.tier;
        entity.tier = progression.nextTier;
        
        // Grant new abilities
        const newDamageTypes = this.tierDefinitions[entity.tier].damageTypes
            .filter(type => !this.tierDefinitions[oldTier].damageTypes.includes(type));
        
        this.emit('tierProgression', {
            entity,
            oldTier,
            newTier: entity.tier,
            newDamageTypes,
            announcement: `${entity.name} has advanced to ${this.tierDefinitions[entity.tier].name}!`
        });
        
        return { 
            success: true, 
            newTier: entity.tier,
            newDamageTypes,
            newAbilities: this.getAvailableDamageTypes(entity.tier)
        };
    }
    
    /**
     * Generate tier-based boss
     */
    generateTierBoss(tier, options = {}) {
        const tierDef = this.tierDefinitions[tier];
        if (!tierDef) {
            throw new Error(`Invalid tier: ${tier}`);
        }
        
        const boss = {
            id: `boss_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: options.name || this.generateBossName(tier),
            tier,
            level: this.generateBossLevel(tier),
            health: this.generateBossHealth(tier),
            damageTypes: tierDef.damageTypes,
            primaryDamageType: tierDef.damageTypes[Math.floor(Math.random() * tierDef.damageTypes.length)],
            primaryResistance: tierDef.damageTypes[0], // Resist own primary type
            resistances: tierDef.resistances,
            attacks: this.generateBossAttacks(tier),
            specialAbilities: this.generateSpecialAbilities(tier),
            loot: this.generateBossLoot(tier),
            ...options
        };
        
        // Special handling for dragons (Tier 3)
        if (tier === 3 && (!options.type || options.type === 'dragon')) {
            boss.type = 'dragon';
            boss.specialAbilities.push({
                name: 'Dragon Breath',
                damageType: 'magic',
                description: 'Devastating magical breath attack',
                cooldown: 10,
                damage: { min: 30, max: 50 }
            });
            boss.specialAbilities.push({
                name: 'Tail Sweep',
                damageType: 'physical',
                description: 'Powerful physical sweep attack',
                cooldown: 5,
                damage: { min: 20, max: 35 }
            });
        }
        
        return boss;
    }
    
    /**
     * Generate boss attacks based on tier
     */
    generateBossAttacks(tier) {
        const tierDef = this.tierDefinitions[tier];
        const attacks = [];
        
        tierDef.damageTypes.forEach(damageType => {
            const damageTypeDef = this.damageTypes[damageType];
            attacks.push({
                name: `${damageTypeDef.name} Strike`,
                damageType,
                baseDamage: this.randomInRange(tierDef.damageRange.min, tierDef.damageRange.max),
                accuracy: 0.8 + (tier * 0.02),
                speed: 2.5 - (tier * 0.2),
                description: `A ${damageType} attack dealing ${damageTypeDef.name} damage`
            });
        });
        
        return attacks;
    }
    
    /**
     * Generate special abilities based on tier
     */
    generateSpecialAbilities(tier) {
        const abilities = [];
        const count = Math.min(tier, 3); // Max 3 special abilities
        
        const abilityTemplates = {
            1: ['Enrage', 'Defensive Stance'],
            2: ['Multi-Shot', 'Evasion', 'Power Strike'],
            3: ['Area Effect', 'Summon Minions', 'Phase Shift'],
            4: ['Time Warp', 'Invulnerability', 'Ultimate Strike'],
            5: ['Reality Tear', 'Chaos Storm', 'Dimension Shift']
        };
        
        const tierAbilities = abilityTemplates[tier] || [];
        
        for (let i = 0; i < count && i < tierAbilities.length; i++) {
            abilities.push({
                name: tierAbilities[i],
                cooldown: 15 + (tier * 5),
                description: `Tier ${tier} special ability`
            });
        }
        
        return abilities;
    }
    
    /**
     * Generate boss loot based on tier
     */
    generateBossLoot(tier) {
        const loot = {
            experience: tier * 1000,
            gold: tier * 500 + this.randomInRange(0, tier * 200),
            items: []
        };
        
        // Chance for special items
        if (Math.random() < (0.1 * tier)) {
            const specialItems = {
                2: 'enchanted_bow',
                3: 'dragon_scale',
                4: 'legendary_essence',
                5: 'chaos_fragment'
            };
            
            if (specialItems[tier]) {
                loot.items.push({
                    id: specialItems[tier],
                    name: specialItems[tier].replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    rarity: 'rare',
                    tier
                });
            }
        }
        
        return loot;
    }
    
    /**
     * Helper methods
     */
    generateBossName(tier) {
        const prefixes = {
            1: ['Lesser', 'Young', 'Minor'],
            2: ['Greater', 'Elder', 'Major'],
            3: ['Ancient', 'Mighty', 'Terrible'],
            4: ['Legendary', 'Eternal', 'Supreme'],
            5: ['Mythic', 'Primordial', 'Cosmic']
        };
        
        const types = {
            1: ['Goblin', 'Skeleton', 'Wolf'],
            2: ['Knight', 'Archer', 'Mage'],
            3: ['Dragon', 'Demon', 'Lich'],
            4: ['Titan', 'Avatar', 'Overlord'],
            5: ['God', 'Void Lord', 'Chaos Weaver']
        };
        
        const prefix = prefixes[tier][Math.floor(Math.random() * prefixes[tier].length)];
        const type = types[tier][Math.floor(Math.random() * types[tier].length)];
        
        return `${prefix} ${type}`;
    }
    
    generateBossLevel(tier) {
        const baseLevels = { 1: 5, 2: 15, 3: 30, 4: 60, 5: 100 };
        return baseLevels[tier] + this.randomInRange(0, tier * 5);
    }
    
    generateBossHealth(tier) {
        const baseHealth = { 1: 100, 2: 500, 3: 2000, 4: 10000, 5: 50000 };
        return baseHealth[tier] + this.randomInRange(0, baseHealth[tier] * 0.2);
    }
    
    randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * Create visual damage indicator
     */
    createDamageIndicator(damage, damageType, tier) {
        const color = this.getDamageColor(tier, damageType);
        const icon = this.damageTypes[damageType].icon;
        
        return {
            text: `${icon} ${damage}`,
            color,
            fontSize: Math.min(12 + Math.log(damage) * 2, 48),
            animation: damageType === 'chaos' ? 'spiral' : 'float',
            duration: 2000
        };
    }
}

module.exports = TierBasedDamageSystem;

// CLI testing
if (require.main === module) {
    async function test() {
        console.log('⚔️ Testing Tier-Based Damage System\n');
        
        const damageSystem = new TierBasedDamageSystem();
        
        // Create test entities
        const goblin = {
            name: 'Goblin Warrior',
            tier: 1,
            level: 5,
            primaryResistance: 'physical'
        };
        
        const dragon = {
            name: 'Elder Dragon',
            tier: 3,
            level: 35,
            primaryResistance: 'magic'
        };
        
        const legendary = {
            name: 'Void Lord',
            tier: 4,
            level: 75,
            primaryResistance: 'true'
        };
        
        console.log('🎮 TIER CAPABILITIES:');
        console.log('=====================');
        for (let tier = 1; tier <= 5; tier++) {
            const tierDef = damageSystem.tierDefinitions[tier];
            console.log(`\nTier ${tier} - ${tierDef.name}:`);
            console.log(`  Damage Types: ${tierDef.damageTypes.join(', ')}`);
            console.log(`  Description: ${tierDef.description}`);
            console.log(`  Examples: ${tierDef.examples.join(', ')}`);
        }
        
        console.log('\n⚔️ DAMAGE CALCULATIONS:');
        console.log('=======================');
        
        // Test goblin (Tier 1) - can only do physical
        console.log('\nGoblin attacks Dragon:');
        const goblinDamage = damageSystem.calculateDamage(goblin, dragon, 'physical');
        console.log(`  Physical damage: ${goblinDamage}`);
        
        // Try invalid damage type for goblin
        const invalidDamage = damageSystem.calculateDamage(goblin, dragon, 'magic');
        console.log(`  Magic damage (invalid): ${invalidDamage}`);
        
        // Test dragon (Tier 3) - can do physical and magic
        console.log('\nDragon attacks Goblin:');
        const dragonPhysical = damageSystem.calculateDamage(dragon, goblin, 'physical');
        const dragonMagic = damageSystem.calculateDamage(dragon, goblin, 'magic');
        console.log(`  Physical damage: ${dragonPhysical}`);
        console.log(`  Magic damage: ${dragonMagic}`);
        
        // Test legendary (Tier 4) - can use all damage types
        console.log('\nVoid Lord attacks Dragon:');
        const legendaryTrue = damageSystem.calculateDamage(legendary, dragon, 'true');
        console.log(`  True damage (ignores resistance): ${legendaryTrue}`);
        
        console.log('\n🐉 DRAGON BOSS GENERATION:');
        console.log('==========================');
        const dragonBoss = damageSystem.generateTierBoss(3, { type: 'dragon' });
        console.log('Generated Dragon Boss:', JSON.stringify(dragonBoss, null, 2));
        
        console.log('\n📈 TIER PROGRESSION CHECK:');
        console.log('===========================');
        const player = {
            name: 'Hero',
            tier: 2,
            level: 24,
            bossesDefeated: 9,
            inventory: []
        };
        
        const canProgress = damageSystem.canProgressToNextTier(player);
        console.log(`Player (Tier ${player.tier}, Level ${player.level}):`, canProgress);
        
        // Give player dragon scale and check again
        player.level = 25;
        player.bossesDefeated = 10;
        player.inventory.push('dragon_scale');
        
        const canProgressNow = damageSystem.canProgressToNextTier(player);
        console.log(`After meeting requirements:`, canProgressNow);
        
        if (canProgressNow.canProgress) {
            const progression = damageSystem.progressToNextTier(player);
            console.log('Progression result:', progression);
        }
        
        console.log('\n✅ Tier-Based Damage System test complete!');
    }
    
    test().catch(console.error);
}