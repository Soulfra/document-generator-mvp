#!/usr/bin/env node

/**
 * 🌐 DIMENSIONAL SKILL MATRIX
 * 450+ Skills across all dimensions for true character development
 * Includes financial anomaly detection, mirror systems, and SOTE lore integration
 */

class DimensionalSkillMatrix {
    constructor(unifiedGameNode) {
        this.gameNode = unifiedGameNode;
        this.skillCategories = new Map();
        this.mirrorSystem = new Map();
        this.runeSystem = new Map();
        this.anomalyDetection = new Map();
        this.crystalNetwork = new Map();
        
        this.init();
    }
    
    init() {
        this.setupDimensionalSkills();
        this.setupMirrorSystem();
        this.setupRuneSystem();
        this.setupAnomalyDetection();
        this.setupCrystalNetwork();
        this.setupSOTELore();
        console.log('🌐 Dimensional Skill Matrix loaded - 450+ skills across all realities');
    }
    
    setupDimensionalSkills() {
        // Core 8 skills (existing)
        const coreSkills = {
            'building': { base: true, tier: 1, color: '#8B4513', rune: 'ᚺ' },
            'exploration': { base: true, tier: 1, color: '#228B22', rune: 'ᛖ' },
            'dimensional': { base: true, tier: 1, color: '#9400D3', rune: 'ᛞ' },
            'ai_communication': { base: true, tier: 1, color: '#00CED1', rune: 'ᚨ' },
            'stealth': { base: true, tier: 1, color: '#2F4F4F', rune: 'ᛋ' },
            'combat': { base: true, tier: 1, color: '#DC143C', rune: 'ᚲ' },
            'crafting': { base: true, tier: 1, color: '#FF8C00', rune: 'ᚲᚱ' },
            'programming': { base: true, tier: 1, color: '#4169E1', rune: 'ᛈ' }
        };
        
        // Financial Analysis Skills (Tier 2 - Critical for auditing)
        const financialSkills = {
            'anomaly_detection': { tier: 2, color: '#FF0000', rune: 'ᚨᚾ', req: ['exploration', 'programming'] },
            'pattern_recognition': { tier: 2, color: '#FF4500', rune: 'ᛈᚱ', req: ['ai_communication'] },
            'transaction_forensics': { tier: 2, color: '#FF6347', rune: 'ᛏᚠ', req: ['stealth', 'programming'] },
            'money_flow_mapping': { tier: 2, color: '#FF7F50', rune: 'ᛗᚠ', req: ['exploration', 'dimensional'] },
            'account_reconciliation': { tier: 2, color: '#FFA500', rune: 'ᚨᚱ', req: ['building', 'crafting'] },
            'fraud_investigation': { tier: 2, color: '#FFB347', rune: 'ᚠᛁ', req: ['combat', 'stealth'] },
            'asset_tracking': { tier: 2, color: '#FFCCCB', rune: 'ᚨᛏ', req: ['exploration'] },
            'audit_trail_analysis': { tier: 2, color: '#FFD700', rune: 'ᚨᛏᚨ', req: ['programming', 'pattern_recognition'] }
        };
        
        // Mirror System Skills (Tier 3 - Reflection and Analysis)
        const mirrorSkills = {
            'self_reflection': { tier: 3, color: '#C0C0C0', rune: 'ᛋᚱ', req: ['anomaly_detection'] },
            'system_mirroring': { tier: 3, color: '#A9A9A9', rune: 'ᛋᛗ', req: ['pattern_recognition'] },
            'data_reflection': { tier: 3, color: '#808080', rune: 'ᛞᚱ', req: ['transaction_forensics'] },
            'behavioral_mirroring': { tier: 3, color: '#696969', rune: 'ᛒᛗ', req: ['fraud_investigation'] },
            'financial_reflection': { tier: 3, color: '#778899', rune: 'ᚠᚱ', req: ['money_flow_mapping'] },
            'crystal_scrying': { tier: 3, color: '#B0C4DE', rune: 'ᚲᛋ', req: ['asset_tracking'] },
            'temporal_mirroring': { tier: 3, color: '#E6E6FA', rune: 'ᛏᛗ', req: ['audit_trail_analysis'] },
            'reality_reflection': { tier: 3, color: '#F0F8FF', rune: 'ᚱᚱ', req: ['account_reconciliation'] }
        };
        
        // SOTE Elven Skills (Tier 4 - Ancient Knowledge)
        const elvenSkills = {
            'elven_crystal_singing': { tier: 4, color: '#00FFFF', rune: 'ᛖᚲᛋ', req: ['crystal_scrying'] },
            'priffddinas_navigation': { tier: 4, color: '#AFEEEE', rune: 'ᛈᚾ', req: ['temporal_mirroring'] },
            'seren_communion': { tier: 4, color: '#40E0D0', rune: 'ᛋᚲ', req: ['reality_reflection'] },
            'elven_lore_mastery': { tier: 4, color: '#48D1CC', rune: 'ᛖᛚᛗ', req: ['self_reflection'] },
            'crystal_bow_crafting': { tier: 4, color: '#00CED1', rune: 'ᚲᛒᚲ', req: ['system_mirroring'] },
            'mourning_ritual_knowledge': { tier: 4, color: '#5F9EA0', rune: 'ᛗᚱᚲ', req: ['data_reflection'] },
            'elf_clan_diplomacy': { tier: 4, color: '#4682B4', rune: 'ᛖᚲᛞ', req: ['behavioral_mirroring'] },
            'ancient_elven_magic': { tier: 4, color: '#6495ED', rune: 'ᚨᛖᛗ', req: ['financial_reflection'] }
        };
        
        // Dimensional Layer Skills (Tier 5+ - 459 Layer System)
        const dimensionalLayers = {};
        for (let layer = 1; layer <= 459; layer++) {
            const skills = this.generateLayerSkills(layer);
            Object.assign(dimensionalLayers, skills);
        }
        
        // Combine all skill categories
        this.skillCategories.set('core', coreSkills);
        this.skillCategories.set('financial', financialSkills);
        this.skillCategories.set('mirror', mirrorSkills);
        this.skillCategories.set('elven', elvenSkills);
        this.skillCategories.set('dimensional', dimensionalLayers);
        
        console.log(`📊 Loaded ${this.getTotalSkillCount()} dimensional skills`);
    }
    
    generateLayerSkills(layer) {
        const layerSkills = {};
        const layerThemes = this.getLayerTheme(layer);
        
        // Generate 3-5 skills per layer
        for (let i = 0; i < layerThemes.skillCount; i++) {
            const skillName = `layer_${layer}_${layerThemes.skills[i]}`;
            layerSkills[skillName] = {
                tier: Math.floor(layer / 50) + 5,
                layer: layer,
                color: layerThemes.color,
                rune: layerThemes.rune + String.fromCharCode(0x16A0 + (i % 24)),
                req: this.generateLayerRequirements(layer, i),
                theme: layerThemes.theme,
                power: layerThemes.power
            };
        }
        
        return layerSkills;
    }
    
    getLayerTheme(layer) {
        const themes = [
            { 
                range: [1, 50], 
                theme: 'Physical Reality', 
                skills: ['matter_manipulation', 'energy_control', 'gravity_mastery', 'time_dilation'],
                skillCount: 4,
                color: '#FF6B6B',
                rune: 'ᛈᚱ',
                power: 'Foundation'
            },
            { 
                range: [51, 100], 
                theme: 'Mental Projection', 
                skills: ['thought_reading', 'memory_editing', 'consciousness_transfer', 'dream_walking'],
                skillCount: 4,
                color: '#4ECDC4',
                rune: 'ᛗᛈ',
                power: 'Psychic'
            },
            { 
                range: [101, 150], 
                theme: 'Digital Archaeology', 
                skills: ['code_archaeology', 'data_necromancy', 'system_resurrection', 'digital_divination'],
                skillCount: 4,
                color: '#45B7D1',
                rune: 'ᛞᚨ',
                power: 'Cyber'
            },
            { 
                range: [151, 200], 
                theme: 'Financial Forensics', 
                skills: ['money_tracking', 'fraud_detection', 'asset_recovery', 'transaction_analysis'],
                skillCount: 4,
                color: '#F7DC6F',
                rune: 'ᚠᚠ',
                power: 'Economic'
            },
            { 
                range: [201, 250], 
                theme: 'Crystal Networks', 
                skills: ['crystal_resonance', 'network_harmonics', 'frequency_control', 'wavelength_mastery'],
                skillCount: 4,
                color: '#BB8FCE',
                rune: 'ᚲᚾ',
                power: 'Harmonic'
            },
            { 
                range: [251, 300], 
                theme: 'Mirror Dimensions', 
                skills: ['reflection_mastery', 'inverse_reality', 'mirror_walking', 'dimensional_flip'],
                skillCount: 4,
                color: '#85C1E9',
                rune: 'ᛗᛞ',
                power: 'Reflective'
            },
            { 
                range: [301, 350], 
                theme: 'Runic Mastery', 
                skills: ['rune_crafting', 'symbol_power', 'ancient_writing', 'runic_combat'],
                skillCount: 4,
                color: '#F8C471',
                rune: 'ᚱᛗ',
                power: 'Runic'
            },
            { 
                range: [351, 400], 
                theme: 'Color Theory', 
                skills: ['chromantic_magic', 'color_healing', 'spectrum_control', 'prismatic_defense'],
                skillCount: 4,
                color: '#82E0AA',
                rune: 'ᚲᛏ',
                power: 'Chromatic'
            },
            { 
                range: [401, 459], 
                theme: 'Ultimate Synthesis', 
                skills: ['reality_weaving', 'dimension_creation', 'universe_maintenance', 'cosmic_balance'],
                skillCount: 4,
                color: '#E8DAEF',
                rune: 'ᚢᛋ',
                power: 'Cosmic'
            }
        ];
        
        return themes.find(theme => layer >= theme.range[0] && layer <= theme.range[1]) || themes[0];
    }
    
    generateLayerRequirements(layer, skillIndex) {
        const requirements = [];
        
        // Base requirements from previous layers
        if (layer > 1) {
            const prevLayer = layer - 1;
            requirements.push(`layer_${prevLayer}_${this.getLayerTheme(prevLayer).skills[0]}`);
        }
        
        // Cross-layer requirements for complexity
        if (layer > 50) {
            requirements.push('elven_crystal_singing');
        }
        if (layer > 100) {
            requirements.push('anomaly_detection');
        }
        if (layer > 200) {
            requirements.push('financial_reflection');
        }
        
        return requirements;
    }
    
    setupMirrorSystem() {
        // Mirror system for reflection and analysis
        const mirrors = [
            {
                id: 'financial_mirror',
                name: 'Financial Reflection Mirror',
                description: 'Reflects financial anomalies and stolen money patterns',
                color: '#FFD700',
                rune: 'ᚠᛗ',
                capabilities: ['anomaly_highlighting', 'pattern_reversal', 'transaction_reflection']
            },
            {
                id: 'character_mirror',
                name: 'Character Development Mirror',
                description: 'Shows your true progression across all 450+ skills',
                color: '#C0C0C0',
                rune: 'ᚲᛗ',
                capabilities: ['skill_reflection', 'growth_analysis', 'potential_preview']
            },
            {
                id: 'reality_mirror',
                name: 'Reality Verification Mirror',
                description: 'Distinguishes truth from deception in all dimensions',
                color: '#E0E0E0',
                rune: 'ᚱᛗ',
                capabilities: ['truth_detection', 'illusion_breaking', 'reality_anchoring']
            },
            {
                id: 'crystal_mirror',
                name: 'Elven Crystal Mirror',
                description: 'SOTE-style crystal scrying and future sight',
                color: '#40E0D0',
                rune: 'ᛖᚲᛗ',
                capabilities: ['future_sight', 'crystal_networking', 'elven_communion']
            }
        ];
        
        mirrors.forEach(mirror => {
            this.mirrorSystem.set(mirror.id, mirror);
        });
    }
    
    setupRuneSystem() {
        // Comprehensive runic system for navigation and power
        const runeCategories = {
            'elder_futhark': {
                'ᚠ': { name: 'Fehu', meaning: 'Wealth', power: 'financial_mastery' },
                'ᚢ': { name: 'Uruz', meaning: 'Strength', power: 'character_power' },
                'ᚦ': { name: 'Thurisaz', meaning: 'Giant', power: 'dimensional_force' },
                'ᚨ': { name: 'Ansuz', meaning: 'God', power: 'divine_communication' },
                'ᚱ': { name: 'Raidho', meaning: 'Journey', power: 'exploration_mastery' },
                'ᚲ': { name: 'Kenaz', meaning: 'Torch', power: 'illumination' },
                'ᚷ': { name: 'Gebo', meaning: 'Gift', power: 'exchange_mastery' },
                'ᚹ': { name: 'Wunjo', meaning: 'Joy', power: 'harmony_creation' }
            },
            'elven_crystal_runes': {
                'ᛖᚲ': { name: 'Crystal Song', meaning: 'Harmony', power: 'crystal_resonance' },
                'ᛋᚱ': { name: 'Seren\'s Light', meaning: 'Guidance', power: 'divine_guidance' },
                'ᛈᚱ': { name: 'Priff Gate', meaning: 'Passage', power: 'dimensional_travel' },
                'ᛗᚱ': { name: 'Mirror Truth', meaning: 'Reflection', power: 'truth_seeing' }
            },
            'financial_audit_runes': {
                'ᚨᚾ': { name: 'Anomaly', meaning: 'Irregularity', power: 'fraud_detection' },
                'ᛏᚠ': { name: 'Trail Follow', meaning: 'Tracking', power: 'money_tracing' },
                'ᚠᚱ': { name: 'Flow Reverse', meaning: 'Recovery', power: 'asset_recovery' },
                'ᚨᚱ': { name: 'Audit Reveal', meaning: 'Truth', power: 'corruption_exposure' }
            }
        };
        
        Object.entries(runeCategories).forEach(([category, runes]) => {
            this.runeSystem.set(category, runes);
        });
    }
    
    setupAnomalyDetection() {
        // Financial anomaly detection patterns
        const anomalyPatterns = [
            {
                id: 'round_number_transactions',
                name: 'Round Number Transactions',
                description: 'Suspicious perfectly round amounts',
                severity: 'medium',
                pattern: /\$\d+[05]00\.00/,
                rune: 'ᚱᚾᛏ',
                xp_reward: 50
            },
            {
                id: 'rapid_fire_transfers',
                name: 'Rapid Fire Transfers',
                description: 'Multiple transfers in short time spans',
                severity: 'high',
                pattern: 'time_analysis',
                rune: 'ᚱᚠᛏ',
                xp_reward: 100
            },
            {
                id: 'shell_company_loops',
                name: 'Shell Company Loops',
                description: 'Money cycling through fake companies',
                severity: 'critical',
                pattern: 'network_analysis',
                rune: 'ᛋᚲᛚ',
                xp_reward: 200
            },
            {
                id: 'decimal_discrepancies',
                name: 'Decimal Discrepancies',
                description: 'Tiny amounts siphoned off repeatedly',
                severity: 'medium',
                pattern: /\.\d{3,}[1-9]$/,
                rune: 'ᛞᛞ',
                xp_reward: 75
            },
            {
                id: 'timezone_manipulation',
                name: 'Timezone Manipulation',
                description: 'Exploiting different time zones for fraud',
                severity: 'high',
                pattern: 'temporal_analysis',
                rune: 'ᛏᛉᛗ',
                xp_reward: 150
            }
        ];
        
        anomalyPatterns.forEach(pattern => {
            this.anomalyDetection.set(pattern.id, pattern);
        });
    }
    
    setupCrystalNetwork() {
        // SOTE-style crystal network for communication and power
        const crystalNodes = [
            {
                id: 'priffddinas_central',
                name: 'Priffddinas Central Crystal',
                location: 'Elven City Center',
                frequency: 432.0,
                color: '#40E0D0',
                power: 'city_coordination',
                connections: ['trahaearn', 'iorwerth', 'cadarn', 'amlodd']
            },
            {
                id: 'mourning_crystal',
                name: 'Mourning\'s End Crystal',
                location: 'Underground Pass',
                frequency: 528.0,
                color: '#8A2BE2',
                power: 'shadow_access',
                connections: ['dark_lord_shrine', 'underground_tunnels']
            },
            {
                id: 'financial_audit_crystal',
                name: 'Financial Audit Crystal',
                location: 'Your Character\'s Domain',
                frequency: 741.0,
                color: '#FFD700',
                power: 'money_tracking',
                connections: ['bank_networks', 'transaction_flows', 'audit_trails']
            },
            {
                id: 'mirror_dimension_crystal',
                name: 'Mirror Dimension Crystal',
                location: 'Reflection Realm',
                frequency: 852.0,
                color: '#C0C0C0',
                power: 'reality_reflection',
                connections: ['all_mirrors', 'dimensional_echoes']
            }
        ];
        
        crystalNodes.forEach(crystal => {
            this.crystalNetwork.set(crystal.id, crystal);
        });
    }
    
    setupSOTELore() {
        // Song of the Elves lore integration with trap avoidance
        this.soteLore = {
            questLine: {
                'mournings_end_part_1': {
                    lessons: ['Trust no one completely', 'Dark elves manipulate truth'],
                    traps: ['false_allies', 'corrupted_crystals'],
                    xmlMapping: '<trust level="verify" source="all"/>',
                    skills_unlocked: ['shadow_detection', 'elf_politics']
                },
                'mournings_end_part_2': {
                    lessons: ['Underground has hidden dangers', 'Light and shadow must balance'],
                    traps: ['maze_confusion', 'shadow_creatures'],
                    xmlMapping: '<balance light="truth" shadow="hidden_knowledge"/>',
                    skills_unlocked: ['underground_navigation', 'light_magic']
                },
                'song_of_the_elves': {
                    lessons: ['City building requires all clans', 'Past mistakes create present problems'],
                    traps: ['clan_favoritism', 'incomplete_solutions'],
                    xmlMapping: '<city cooperation="required" isolation="failure"/>',
                    skills_unlocked: ['city_planning', 'clan_diplomacy', 'crystal_mastery']
                }
            },
            trapAvoidance: {
                'xml_structure_rules': [
                    'Always close tags properly to avoid corruption',
                    'Use namespaces to prevent conflicts',
                    'Validate against schema to catch errors',
                    'Escape special characters to prevent injection'
                ],
                'financial_audit_traps': [
                    'Correlation vs causation confusion',
                    'Focusing on large amounts while missing small systematic theft',
                    'Trusting automated systems without verification',
                    'Ignoring timezone and timing anomalies'
                ]
            }
        };
    }
    
    // Character interaction methods
    async levelUpSkill(playerId, skillName, xpGained) {
        const player = await this.getPlayerProfile(playerId);
        if (!player) return null;
        
        const skill = this.findSkill(skillName);
        if (!skill) return null;
        
        const oldLevel = player.skills[skillName]?.level || 1;
        const oldXp = player.skills[skillName]?.xp || 0;
        const newXp = oldXp + xpGained;
        const newLevel = this.calculateLevel(newXp);
        
        // Update player skill
        if (!player.skills[skillName]) {
            player.skills[skillName] = { level: 1, xp: 0 };
        }
        player.skills[skillName].xp = newXp;
        player.skills[skillName].level = newLevel;
        
        // Check for anomaly detection
        if (skillName.includes('anomaly') || skillName.includes('financial')) {
            this.runAnomalyCheck(playerId, skillName, newLevel);
        }
        
        // Crystal network resonance
        this.updateCrystalResonance(playerId, skillName, newLevel);
        
        return {
            skillName,
            oldLevel,
            newLevel,
            xpGained,
            totalXp: newXp,
            skill: skill,
            anomaliesDetected: this.getRecentAnomalies(playerId)
        };
    }
    
    async runAnomalyCheck(playerId, skillName, level) {
        // Simulate financial anomaly detection based on skill level
        const anomalies = [];
        const detectionPower = level * 10; // Higher level = better detection
        
        for (const [id, pattern] of this.anomalyDetection) {
            const detectionChance = Math.min(0.9, detectionPower / 100);
            if (Math.random() < detectionChance) {
                anomalies.push({
                    id,
                    pattern,
                    timestamp: new Date(),
                    severity: pattern.severity,
                    rune: pattern.rune,
                    message: `${skillName} detected: ${pattern.description}`
                });
            }
        }
        
        if (anomalies.length > 0) {
            console.log(`🚨 ANOMALIES DETECTED by ${playerId}: ${anomalies.length} patterns found`);
            this.presentAnomalies(playerId, anomalies);
        }
        
        return anomalies;
    }
    
    presentAnomalies(playerId, anomalies) {
        // Present anomalies on the game layer / notification system
        const presentation = {
            playerId,
            timestamp: new Date(),
            anomalies: anomalies.map(a => ({
                type: a.pattern.name,
                severity: a.severity,
                rune: a.rune,
                description: a.pattern.description,
                notification: `🔍 ${a.rune} ${a.pattern.name}: ${a.pattern.description}`
            })),
            totalSeverity: anomalies.reduce((sum, a) => {
                const severityValues = { low: 1, medium: 3, high: 7, critical: 15 };
                return sum + severityValues[a.severity];
            }, 0)
        };
        
        // Store for retrieval by unified game node
        if (!this.recentAnomalies) this.recentAnomalies = new Map();
        this.recentAnomalies.set(playerId, presentation);
        
        return presentation;
    }
    
    updateCrystalResonance(playerId, skillName, level) {
        // Update crystal network based on skill progression
        for (const [id, crystal] of this.crystalNetwork) {
            const resonance = this.calculateResonance(skillName, level, crystal);
            if (resonance > 0.5) {
                console.log(`🔮 Crystal ${crystal.name} resonating at ${(resonance * 100).toFixed(1)}% with ${skillName}`);
            }
        }
    }
    
    calculateResonance(skillName, level, crystal) {
        // Calculate how much a skill resonates with a crystal
        const baseResonance = level / 100;
        
        if (skillName.includes('financial') && crystal.power === 'money_tracking') {
            return Math.min(1.0, baseResonance * 2);
        }
        if (skillName.includes('elven') && crystal.power === 'city_coordination') {
            return Math.min(1.0, baseResonance * 1.5);
        }
        if (skillName.includes('mirror') && crystal.power === 'reality_reflection') {
            return Math.min(1.0, baseResonance * 1.8);
        }
        
        return baseResonance;
    }
    
    findSkill(skillName) {
        for (const [category, skills] of this.skillCategories) {
            if (skills[skillName]) {
                return { ...skills[skillName], category };
            }
        }
        return null;
    }
    
    getTotalSkillCount() {
        let total = 0;
        for (const [category, skills] of this.skillCategories) {
            total += Object.keys(skills).length;
        }
        return total;
    }
    
    calculateLevel(xp) {
        // OSRS-style XP formula but for 450+ skills
        return Math.floor(Math.pow(xp / 83, 1/3) + 1);
    }
    
    async getPlayerProfile(playerId) {
        // Get player from unified game node
        return this.gameNode.achievements?.getPlayerProfile(playerId);
    }
    
    getRecentAnomalies(playerId) {
        return this.recentAnomalies?.get(playerId) || null;
    }
    
    // API methods for unified game node integration
    getAllSkills() {
        const allSkills = {};
        for (const [category, skills] of this.skillCategories) {
            allSkills[category] = skills;
        }
        return allSkills;
    }
    
    getMirrorSystems() {
        return Array.from(this.mirrorSystem.values());
    }
    
    getRuneSystems() {
        return Array.from(this.runeSystem.values());
    }
    
    getCrystalNetwork() {
        return Array.from(this.crystalNetwork.values());
    }
    
    getSOTELore() {
        return this.soteLore;
    }
}

module.exports = DimensionalSkillMatrix;