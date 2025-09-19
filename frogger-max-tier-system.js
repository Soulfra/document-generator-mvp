#!/usr/bin/env node

/**
 * MAXED OUT TIER SYSTEM
 * From Bronze to Elder Gods and Beyond
 * Based on RuneScape, Archaeology, and Cosmere-level power scaling
 */

const TIER_SYSTEM = {
  // Basic Metals (Levels 1-60)
  BRONZE: {
    level: 1,
    name: 'Bronze',
    color: '#CD7F32',
    symbol: '[B]',
    rateLimit: 100,
    cooldown: 60,
    description: 'Basic starter tier',
    effects: []
  },
  IRON: {
    level: 10,
    name: 'Iron',
    color: '#434343',
    symbol: '[I]',
    rateLimit: 150,
    cooldown: 50,
    description: 'Slightly better than bronze',
    effects: []
  },
  STEEL: {
    level: 20,
    name: 'Steel',
    color: '#71797E',
    symbol: '[S]',
    rateLimit: 200,
    cooldown: 45,
    description: 'Refined and reliable',
    effects: ['faster_response']
  },
  MITHRIL: {
    level: 30,
    name: 'Mithril',
    color: '#3D5A6C',
    symbol: '[M]',
    rateLimit: 300,
    cooldown: 40,
    description: 'Lightweight and efficient',
    effects: ['faster_response', 'auto_retry']
  },
  ADAMANT: {
    level: 40,
    name: 'Adamant',
    color: '#2F4F2F',
    symbol: '[A]',
    rateLimit: 400,
    cooldown: 35,
    description: 'Strong and dependable',
    effects: ['faster_response', 'auto_retry', 'priority_queue']
  },
  RUNE: {
    level: 50,
    name: 'Rune',
    color: '#5DADE2',
    symbol: '[R]',
    rateLimit: 500,
    cooldown: 30,
    description: 'Magical properties',
    effects: ['faster_response', 'auto_retry', 'priority_queue', 'magic_boost']
  },

  // Advanced Metals (Levels 60-80)
  DRAGON: {
    level: 60,
    name: 'Dragon',
    color: '#DC143C',
    symbol: '[D]',
    rateLimit: 750,
    cooldown: 25,
    description: 'Forged from dragon bones',
    effects: ['faster_response', 'auto_retry', 'priority_queue', 'magic_boost', 'fire_immunity']
  },
  OBSIDIAN: {
    level: 65,
    name: 'Obsidian',
    color: '#0C090A',
    symbol: '[O]',
    rateLimit: 800,
    cooldown: 20,
    description: 'Volcanic glass edge',
    effects: ['faster_response', 'auto_retry', 'priority_queue', 'magic_boost', 'fire_immunity', 'sharp_edge']
  },
  CRYSTAL: {
    level: 70,
    name: 'Crystal',
    color: '#E0FFFF',
    symbol: '[C]',
    rateLimit: 900,
    cooldown: 18,
    description: 'Elven crystal singing',
    effects: ['faster_response', 'auto_retry', 'priority_queue', 'magic_boost', 'crystal_resonance', 'elf_blessing']
  },
  LUNAR: {
    level: 75,
    name: 'Lunar',
    color: '#C0C0C0',
    symbol: '[L]',
    rateLimit: 1000,
    cooldown: 15,
    description: 'Blessed by the moon',
    effects: ['faster_response', 'auto_retry', 'priority_queue', 'magic_boost', 'lunar_phase', 'astral_projection']
  },

  // Archaeology Tiers (Levels 80-99)
  BANE: {
    level: 80,
    name: 'Bane',
    color: '#8B0000',
    symbol: '[BN]',
    rateLimit: 1200,
    cooldown: 12,
    description: 'Tuned to pierce defenses',
    effects: ['all_previous', 'armor_piercing', 'tuned_bane']
  },
  ELDER_RUNE: {
    level: 85,
    name: 'Elder Rune',
    color: '#4B0082',
    symbol: '[ER]',
    rateLimit: 1500,
    cooldown: 10,
    description: 'Ancient smithing mastery',
    effects: ['all_previous', 'elder_power', 'time_dilation']
  },
  THIRD_AGE: {
    level: 90,
    name: 'Third Age',
    color: '#FFD700',
    symbol: '[3A]',
    rateLimit: 2000,
    cooldown: 8,
    description: 'Artifacts of the God Wars',
    effects: ['all_previous', 'god_wars_blessing', 'ancient_knowledge']
  },
  SHADOW: {
    level: 92,
    name: 'Shadow',
    color: '#1C1C1C',
    symbol: '[SH]',
    rateLimit: 2500,
    cooldown: 6,
    description: 'Forged in the Shadow Realm',
    effects: ['all_previous', 'shadow_step', 'void_touched']
  },
  BARROWS: {
    level: 95,
    name: 'Barrows',
    color: '#654321',
    symbol: '[BR]',
    rateLimit: 3000,
    cooldown: 5,
    description: 'Cursed brothers equipment',
    effects: ['all_previous', 'barrows_curse', 'undead_power', 'set_effect']
  },

  // God Tiers (Levels 99-120)
  SARADOMIN: {
    level: 99,
    name: 'Saradomin',
    color: '#00BFFF',
    symbol: '[SA]',
    rateLimit: 5000,
    cooldown: 3,
    description: 'Blessed by order and wisdom',
    effects: ['all_previous', 'holy_blessing', 'order_enforcement', 'wisdom_boost']
  },
  ZAMORAK: {
    level: 100,
    name: 'Zamorak',
    color: '#FF0000',
    symbol: '[ZA]',
    rateLimit: 5000,
    cooldown: 3,
    description: 'Chaos and power',
    effects: ['all_previous', 'chaos_infusion', 'power_surge', 'betrayal_bonus']
  },
  GUTHIX: {
    level: 105,
    name: 'Guthix',
    color: '#00FF00',
    symbol: '[GU]',
    rateLimit: 7500,
    cooldown: 2,
    description: 'Perfect balance',
    effects: ['all_previous', 'balance_mastery', 'nature_attunement', 'equilibrium']
  },
  ARMADYL: {
    level: 110,
    name: 'Armadyl',
    color: '#FFFF00',
    symbol: '[AR]',
    rateLimit: 8000,
    cooldown: 2,
    description: 'Justice from above',
    effects: ['all_previous', 'flight', 'justice_strike', 'aviansie_blessing']
  },
  BANDOS: {
    level: 112,
    name: 'Bandos',
    color: '#8B4513',
    symbol: '[BA]',
    rateLimit: 8500,
    cooldown: 2,
    description: 'War and conquest',
    effects: ['all_previous', 'war_cry', 'brutal_efficiency', 'ork_strength']
  },
  ZAROS: {
    level: 115,
    name: 'Zaros',
    color: '#9400D3',
    symbol: '[ZR]',
    rateLimit: 10000,
    cooldown: 1,
    description: 'The Empty Lord',
    effects: ['all_previous', 'ancient_magicks', 'control_mastery', 'fate_manipulation']
  },

  // Elder God Tiers (Level 120+)
  JAS: {
    level: 120,
    name: 'Jas',
    color: '#4169E1',
    symbol: '[JAS]',
    rateLimit: 15000,
    cooldown: 0.5,
    description: 'Elder of Progression',
    effects: ['all_previous', 'stone_of_jas', 'progression_mastery', 'anima_control']
  },
  FUL: {
    level: 125,
    name: 'Ful',
    color: '#FF4500',
    symbol: '[FUL]',
    rateLimit: 20000,
    cooldown: 0.5,
    description: 'Elder of Constancy',
    effects: ['all_previous', 'eternal_flame', 'rebirth_cycle', 'phoenix_mode']
  },
  WEN: {
    level: 130,
    name: 'Wen',
    color: '#00CED1',
    symbol: '[WEN]',
    rateLimit: 25000,
    cooldown: 0.5,
    description: 'Elder of Ice',
    effects: ['all_previous', 'absolute_zero', 'time_freeze', 'ice_barrage_plus']
  },
  BIK: {
    level: 135,
    name: 'Bik',
    color: '#228B22',
    symbol: '[BIK]',
    rateLimit: 30000,
    cooldown: 0.5,
    description: 'Elder of Forests',
    effects: ['all_previous', 'life_creation', 'nature_override', 'world_tree']
  },
  MAH: {
    level: 140,
    name: 'Mah',
    color: '#8A2BE2',
    symbol: '[MAH]',
    rateLimit: 50000,
    cooldown: 0.25,
    description: 'Elder of Potential',
    effects: ['all_previous', 'nightmare_fuel', 'reality_warp', 'mahjarrat_creation']
  },

  // Transcendent Tiers (Beyond Elder Gods)
  XAUKAN: {
    level: 150,
    name: "Xau-Tak",
    color: '#000080',
    symbol: '[XAU]',
    rateLimit: 100000,
    cooldown: 0.1,
    description: 'From beyond the cosmic ocean',
    effects: ['all_previous', 'eldritch_horror', 'madness_inducing', 'tentacle_reality']
  },
  VOIDBORN: {
    level: 160,
    name: 'Voidborn',
    color: '#000000',
    symbol: '[VOID]',
    rateLimit: 250000,
    cooldown: 0.05,
    description: 'Born from the absence of existence',
    effects: ['all_previous', 'void_consumption', 'reality_deletion', 'null_state']
  },
  ANIMA_MUNDI: {
    level: 170,
    name: 'Anima Mundi',
    color: '#FFFFFF',
    symbol: '[ANIM]',
    rateLimit: 500000,
    cooldown: 0.01,
    description: 'The world soul itself',
    effects: ['all_previous', 'planetary_consciousness', 'ley_line_mastery', 'gielinor_avatar']
  },
  AETHER: {
    level: 180,
    name: 'Aether',
    color: '#F0E68C',
    symbol: '[AETH]',
    rateLimit: 1000000,
    cooldown: 0.001,
    description: 'Pure magical essence',
    effects: ['all_previous', 'reality_rewrite', 'concept_manipulation', 'omnipresence']
  },
  COSMERE: {
    level: 190,
    name: 'Cosmere',
    color: '#FF69B4',
    symbol: '[COSM]',
    rateLimit: 10000000,
    cooldown: 0,
    description: 'Shard of Adonalsium',
    effects: ['all_previous', 'shard_power', 'investiture_control', 'worldhopping', 'perpendicularity']
  },
  WHEEL_OF_TIME: {
    level: 200,
    name: 'Wheel of Time',
    color: '#DAA520',
    symbol: '[WOT]',
    rateLimit: Infinity,
    cooldown: 0,
    description: 'The Pattern itself',
    effects: ['all_previous', 'ta_veren', 'pattern_weaving', 'balefire', 'dragon_reborn']
  }
};

// Special abilities for each tier
const TIER_ABILITIES = {
  faster_response: {
    name: 'Faster Response',
    description: 'Reduces API response time by 10%',
    multiplier: 0.9
  },
  auto_retry: {
    name: 'Auto Retry',
    description: 'Automatically retries failed requests',
    retries: 3
  },
  priority_queue: {
    name: 'Priority Queue',
    description: 'Jumps to front of rate limit queue',
    priority: true
  },
  magic_boost: {
    name: 'Magic Boost',
    description: 'Increases success rate by 5%',
    successBonus: 0.05
  },
  fire_immunity: {
    name: 'Fire Immunity',
    description: 'Immune to server heat throttling',
    heatImmune: true
  },
  crystal_resonance: {
    name: 'Crystal Resonance',
    description: 'Harmonizes with server frequency',
    resonance: true
  },
  shadow_step: {
    name: 'Shadow Step',
    description: 'Bypasses some rate limits',
    bypassChance: 0.2
  },
  god_wars_blessing: {
    name: 'God Wars Blessing',
    description: 'Protected by ancient powers',
    protection: true
  },
  ancient_magicks: {
    name: 'Ancient Magicks',
    description: 'Access to forbidden endpoints',
    forbidden: true
  },
  stone_of_jas: {
    name: 'Stone of Jas',
    description: 'Exponentially increases power',
    powerMultiplier: 10
  },
  reality_warp: {
    name: 'Reality Warp',
    description: 'Can alter API responses',
    canAlterReality: true
  },
  worldhopping: {
    name: 'Worldhopping',
    description: 'Access to cross-dimensional APIs',
    dimensional: true
  },
  ta_veren: {
    name: "Ta'veren",
    description: 'The Pattern bends around your requests',
    patternBending: true,
    luckMultiplier: 100
  }
};

// Tier progression manager
class TierProgressionSystem {
  constructor() {
    this.currentLevel = 1;
    this.experience = 0;
    this.unlockedTiers = new Set(['BRONZE']);
    this.activeTier = 'BRONZE';
    this.achievements = new Map();
  }

  getTier(tierName) {
    return TIER_SYSTEM[tierName];
  }

  getCurrentTier() {
    return this.getTier(this.activeTier);
  }

  getAllTiers() {
    return Object.entries(TIER_SYSTEM)
      .map(([key, tier]) => ({
        key,
        ...tier,
        unlocked: this.unlockedTiers.has(key),
        canUse: this.currentLevel >= tier.level
      }));
  }

  gainExperience(amount) {
    this.experience += amount;
    
    // Level up check
    const newLevel = Math.floor(Math.sqrt(this.experience / 100)) + 1;
    
    if (newLevel > this.currentLevel) {
      this.currentLevel = newLevel;
      this.checkUnlocks();
      
      return {
        levelUp: true,
        newLevel: this.currentLevel,
        unlockedTiers: this.getNewUnlocks()
      };
    }
    
    return { levelUp: false };
  }

  checkUnlocks() {
    for (const [key, tier] of Object.entries(TIER_SYSTEM)) {
      if (this.currentLevel >= tier.level && !this.unlockedTiers.has(key)) {
        this.unlockedTiers.add(key);
        this.logAchievement(`Unlocked ${tier.name} Tier!`, tier);
      }
    }
  }

  getNewUnlocks() {
    return Object.entries(TIER_SYSTEM)
      .filter(([key, tier]) => 
        this.currentLevel >= tier.level && 
        this.currentLevel - 1 < tier.level
      )
      .map(([key, tier]) => ({ key, ...tier }));
  }

  switchTier(tierKey) {
    if (this.unlockedTiers.has(tierKey)) {
      this.activeTier = tierKey;
      return true;
    }
    return false;
  }

  getActiveEffects() {
    const tier = this.getCurrentTier();
    const effects = [];
    
    for (const effectKey of tier.effects) {
      if (effectKey === 'all_previous') {
        // Get all effects from previous tiers
        const tierList = Object.values(TIER_SYSTEM);
        const currentIndex = tierList.findIndex(t => t.name === tier.name);
        
        for (let i = 0; i < currentIndex; i++) {
          effects.push(...tierList[i].effects.filter(e => e !== 'all_previous'));
        }
      } else if (TIER_ABILITIES[effectKey]) {
        effects.push(TIER_ABILITIES[effectKey]);
      }
    }
    
    return effects;
  }

  calculateEndpointPower(tierKey) {
    const tier = this.getTier(tierKey);
    if (!tier) return 0;
    
    let power = tier.rateLimit;
    
    // Apply effect multipliers
    const effects = this.getActiveEffects();
    for (const effect of effects) {
      if (effect.powerMultiplier) {
        power *= effect.powerMultiplier;
      }
    }
    
    return power;
  }

  logAchievement(message, tier) {
    const achievement = {
      message,
      tier: tier.name,
      timestamp: new Date(),
      level: this.currentLevel
    };
    
    if (!this.achievements.has(tier.name)) {
      this.achievements.set(tier.name, []);
    }
    
    this.achievements.get(tier.name).push(achievement);
  }

  getProgressToNextTier() {
    const tiers = Object.values(TIER_SYSTEM).sort((a, b) => a.level - b.level);
    const nextTier = tiers.find(t => t.level > this.currentLevel);
    
    if (!nextTier) {
      return { percentage: 100, nextTier: null };
    }
    
    const currentLevelXP = Math.pow(this.currentLevel - 1, 2) * 100;
    const nextLevelXP = Math.pow(nextTier.level - 1, 2) * 100;
    const currentXP = this.experience - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    
    return {
      percentage: Math.floor((currentXP / neededXP) * 100),
      nextTier: nextTier,
      currentXP,
      neededXP
    };
  }
}

module.exports = {
  TIER_SYSTEM,
  TIER_ABILITIES,
  TierProgressionSystem
};