#!/usr/bin/env node

/**
 * 🎭 UNIFIED CHARACTER DATABASE
 * Ring 0 (Core) system - Single source of truth for all character data
 * Consolidates: Kingdom Authority, Multi-Ring Evolution, Boss Characters, Selfie Characters, Domingo Characters
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

// Ring 0 dependency - MBTI Personality Core
const MBTIPersonalityCore = require('./MBTI-PERSONALITY-CORE.js');

class UnifiedCharacterDatabase extends EventEmitter {
    constructor() {
        super();
        
        // Ring 0 - No dependencies, pure core system
        this.characters = new Map();
        this.characterTypes = new Map();
        this.evolutionPaths = new Map();
        this.relationships = new Map();
        this.achievements = new Map();
        
        // Initialize MBTI personality system (Ring 0 integration)
        this.mbtiCore = new MBTIPersonalityCore();
        
        // Character system integration mappings
        this.systemMappings = {
            kingdom_authority: 'Kingdom Authority Hierarchy',
            multi_ring: 'Multi-Ring Character Evolution',
            boss_system: 'Boss Character System', 
            selfie_pixel: 'Selfie-to-Pixel Characters',
            domingo: 'Domingo Technical Characters'
        };
        
        // Unified character schema
        this.characterSchema = {
            // Core Identity (Ring 0)
            id: 'string',                    // Unique character identifier
            name: 'string',                  // Display name
            type: 'string',                  // Character type/class
            created_at: 'timestamp',         // Creation time
            updated_at: 'timestamp',         // Last modification
            
            // System Integration
            source_system: 'string',         // Which system created this character
            external_ids: 'object',          // IDs in other systems
            cross_references: 'array',       // Links to other characters/systems
            
            // Core Attributes (Base Stats)
            stats: {
                karma: 'number',             // Universal karma/reputation
                level: 'number',             // General level/progression
                experience: 'number',        // Total experience points
                authority: 'string',         // Kingdom Authority level (EXILE→KING)
                trust_level: 'number',       // Trust/reliability score
                activity_level: 'number'     // How active the character is
            },
            
            // Character Appearance & Identity
            appearance: {
                color_scheme: 'object',      // Primary/secondary/accent colors
                visual_style: 'string',      // Art style (pixel, voxel, realistic, etc.)
                avatar_data: 'object',       // Image/model data
                templates: 'array',          // Applied visual templates
                custom_assets: 'array'       // Custom visual elements
            },
            
            // Personality & Behavior (MBTI integration ready)
            personality: {
                mbti_type: 'string',         // Myers-Briggs type (e.g., INTJ)
                alignment: 'string',         // Moral alignment
                traits: 'array',             // Personality traits
                preferences: 'object',       // User preferences
                behavior_patterns: 'object', // AI behavior settings
                communication_style: 'string' // How they interact
            },
            
            // System-Specific Data
            kingdom_data: 'object',          // Kingdom Authority specific data
            evolution_data: 'object',        // Multi-Ring evolution data
            boss_data: 'object',            // Boss character data
            selfie_data: 'object',          // Selfie-to-pixel data
            technical_data: 'object',       // Domingo technical role data
            
            // Abilities & Capabilities
            abilities: 'array',             // Special abilities/skills
            permissions: 'array',           // System permissions
            access_levels: 'object',        // Access to different features
            specializations: 'array',       // Areas of expertise
            
            // Progression & Evolution
            evolution_tier: 'number',       // Current evolution level (0, 1, 2)
            evolution_path: 'array',        // History of evolutions
            available_evolutions: 'array',  // Possible next evolutions
            requirements_met: 'object',     // Which requirements are satisfied
            
            // Social & Team Data  
            relationships: 'array',         // Relationships with other characters
            team_memberships: 'array',      // Teams this character belongs to
            reputation_history: 'array',    // Karma/reputation changes over time
            achievements_unlocked: 'array', // Unlocked achievements
            
            // Metadata
            tags: 'array',                  // Search/categorization tags
            notes: 'string',                // User or system notes
            flags: 'object',                // System flags (banned, special, etc.)
            last_active: 'timestamp'        // Last activity timestamp
        };
        
        console.log('🎭 Unified Character Database initialized (Ring 0)');
        this.initializeCharacterTypes();
        this.loadExistingCharacters();
    }
    
    /**
     * Initialize character type definitions
     */
    initializeCharacterTypes() {
        // Kingdom Authority Types
        this.registerCharacterType({
            id: 'kingdom_authority',
            name: 'Kingdom Authority Citizen',
            category: 'authority',
            source_system: 'kingdom_authority',
            tiers: ['EXILE', 'PEASANT', 'CITIZEN', 'MERCHANT', 'KNIGHT', 'LORD', 'KING'],
            evolution_type: 'tier_progression',
            base_stats: { karma: 0, level: 1, authority: 'CITIZEN' }
        });
        
        // Multi-Ring Evolution Types
        this.registerCharacterType({
            id: 'blamechain_base',
            name: 'BlameChain Core',
            category: 'evolution',
            source_system: 'multi_ring', 
            tiers: ['Base', 'Mid-Tier', 'Ultimate'],
            evolution_type: 'ring_evolution',
            evolution_paths: ['angel', 'zombie', 'demon', 'mutant', 'dragon', 'mecha'],
            base_stats: { karma: 0, level: 1, accountability: 100 }
        });
        
        // Boss Character Types
        this.registerCharacterType({
            id: 'boss_character',
            name: 'Boss Character',
            category: 'boss',
            source_system: 'boss_system',
            tiers: ['Combat', 'Economic', 'Guardian', 'Legendary'],
            evolution_type: 'power_scaling',
            base_stats: { karma: 0, level: 50, boss_power: 1000 }
        });
        
        // Selfie-Generated Characters
        this.registerCharacterType({
            id: 'selfie_character',
            name: 'Selfie-Generated Character',
            category: 'user_created',
            source_system: 'selfie_pixel',
            tiers: ['Pixel', 'Enhanced', 'Legendary'],
            evolution_type: 'enhancement',
            base_stats: { karma: 10, level: 1, uniqueness: 100 }
        });
        
        // Technical Characters (Domingo)
        this.registerCharacterType({
            id: 'technical_character',
            name: 'Technical Role Character',
            category: 'technical',
            source_system: 'domingo',
            tiers: ['Junior', 'Mid-Level', 'Senior', 'Lead'],
            evolution_type: 'skill_progression',
            specializations: ['Frontend', 'Backend', 'DevOps', 'Security', 'Data', 'Integration'],
            base_stats: { karma: 25, level: 10, technical_expertise: 75 }
        });
        
        console.log(`📝 Registered ${this.characterTypes.size} character types`);
    }
    
    /**
     * Register a character type
     */
    registerCharacterType(typeConfig) {
        this.characterTypes.set(typeConfig.id, typeConfig);
        console.log(`🎭 Registered character type: ${typeConfig.name}`);
    }
    
    /**
     * Create a new unified character
     */
    createCharacter(characterData) {
        const id = this.generateCharacterId();
        const timestamp = Date.now();
        
        const character = {
            // Core Identity
            id: id,
            name: characterData.name || `Character ${id.substring(0, 8)}`,
            type: characterData.type || 'citizen',
            created_at: timestamp,
            updated_at: timestamp,
            
            // System Integration
            source_system: characterData.source_system || 'unified',
            external_ids: characterData.external_ids || {},
            cross_references: [],
            
            // Core Attributes
            stats: {
                karma: characterData.karma || 0,
                level: characterData.level || 1,
                experience: characterData.experience || 0,
                authority: characterData.authority || 'CITIZEN',
                trust_level: characterData.trust_level || 0.5,
                activity_level: characterData.activity_level || 1.0,
                ...characterData.stats
            },
            
            // Appearance
            appearance: {
                color_scheme: characterData.color_scheme || {
                    primary: '#0000FF',   // Default CITIZEN blue
                    secondary: '#FFFFFF',
                    accent: '#000000'
                },
                visual_style: characterData.visual_style || 'pixel',
                avatar_data: characterData.avatar_data || null,
                templates: characterData.templates || [],
                custom_assets: characterData.custom_assets || [],
                ...characterData.appearance
            },
            
            // Personality (ready for MBTI)
            personality: {
                mbti_type: characterData.mbti_type || null,
                alignment: characterData.alignment || 'neutral',
                traits: characterData.traits || [],
                preferences: characterData.preferences || {},
                behavior_patterns: characterData.behavior_patterns || {},
                communication_style: characterData.communication_style || 'friendly',
                ...characterData.personality
            },
            
            // System-Specific Data
            kingdom_data: characterData.kingdom_data || {},
            evolution_data: characterData.evolution_data || {},
            boss_data: characterData.boss_data || {},
            selfie_data: characterData.selfie_data || {},
            technical_data: characterData.technical_data || {},
            
            // Abilities & Capabilities
            abilities: characterData.abilities || [],
            permissions: characterData.permissions || ['view'],
            access_levels: characterData.access_levels || {},
            specializations: characterData.specializations || [],
            
            // Progression & Evolution
            evolution_tier: characterData.evolution_tier || 0,
            evolution_path: characterData.evolution_path || [],
            available_evolutions: characterData.available_evolutions || [],
            requirements_met: characterData.requirements_met || {},
            
            // Social & Team Data
            relationships: [],
            team_memberships: [],
            reputation_history: [{
                timestamp: timestamp,
                change: characterData.karma || 0,
                reason: 'character_created',
                total: characterData.karma || 0
            }],
            achievements_unlocked: [],
            
            // Metadata
            tags: characterData.tags || [],
            notes: characterData.notes || '',
            flags: characterData.flags || {},
            last_active: timestamp
        };
        
        this.characters.set(id, character);
        
        this.emit('character_created', character);
        console.log(`🎭 Created unified character: ${character.name} (${character.type})`);
        
        return character;
    }
    
    /**
     * Get character by ID
     */
    getCharacter(characterId) {
        return this.characters.get(characterId);
    }
    
    /**
     * Update character data
     */
    updateCharacter(characterId, updates) {
        const character = this.characters.get(characterId);
        if (!character) {
            throw new Error(`Character not found: ${characterId}`);
        }
        
        // Deep merge updates
        this.deepMerge(character, updates);
        character.updated_at = Date.now();
        
        this.emit('character_updated', character, updates);
        console.log(`🔄 Updated character: ${character.name}`);
        
        return character;
    }
    
    /**
     * Import character from external system
     */
    importCharacterFromSystem(systemId, externalData) {
        const importConfig = this.getImportConfig(systemId);
        if (!importConfig) {
            throw new Error(`Import config not found for system: ${systemId}`);
        }
        
        // Transform external data to unified format
        const unifiedData = this.transformToUnified(externalData, importConfig);
        unifiedData.source_system = systemId;
        unifiedData.external_ids = { [systemId]: externalData.id };
        
        const character = this.createCharacter(unifiedData);
        
        console.log(`📥 Imported character from ${systemId}: ${character.name}`);
        return character;
    }
    
    /**
     * Export character to external system format
     */
    exportCharacterToSystem(characterId, targetSystemId) {
        const character = this.characters.get(characterId);
        if (!character) {
            throw new Error(`Character not found: ${characterId}`);
        }
        
        const exportConfig = this.getExportConfig(targetSystemId);
        if (!exportConfig) {
            throw new Error(`Export config not found for system: ${targetSystemId}`);
        }
        
        const exportedData = this.transformFromUnified(character, exportConfig);
        
        console.log(`📤 Exported character to ${targetSystemId}: ${character.name}`);
        return exportedData;
    }
    
    /**
     * Find characters by criteria
     */
    findCharacters(criteria) {
        const results = [];
        
        this.characters.forEach(character => {
            let matches = true;
            
            // Check each criteria
            Object.entries(criteria).forEach(([field, value]) => {
                const characterValue = this.getNestedProperty(character, field);
                if (characterValue !== value) {
                    matches = false;
                }
            });
            
            if (matches) {
                results.push(character);
            }
        });
        
        return results;
    }
    
    /**
     * Get characters by system
     */
    getCharactersBySystem(systemId) {
        return this.findCharacters({ source_system: systemId });
    }
    
    /**
     * Get characters by type
     */
    getCharactersByType(characterType) {
        return this.findCharacters({ type: characterType });
    }
    
    /**
     * Create relationship between characters
     */
    createRelationship(characterId1, characterId2, relationshipType, metadata = {}) {
        const char1 = this.characters.get(characterId1);
        const char2 = this.characters.get(characterId2);
        
        if (!char1 || !char2) {
            throw new Error('One or both characters not found');
        }
        
        const relationshipId = this.generateRelationshipId();
        const relationship = {
            id: relationshipId,
            character1: characterId1,
            character2: characterId2,
            type: relationshipType,
            created_at: Date.now(),
            metadata: metadata
        };
        
        this.relationships.set(relationshipId, relationship);
        
        // Add to both characters
        char1.relationships.push(relationshipId);
        char2.relationships.push(relationshipId);
        
        this.emit('relationship_created', relationship);
        console.log(`🤝 Created relationship: ${char1.name} ↔ ${char2.name} (${relationshipType})`);
        
        return relationship;
    }
    
    /**
     * Evolve character
     */
    evolveCharacter(characterId, evolutionType, requirements = {}) {
        const character = this.characters.get(characterId);
        if (!character) {
            throw new Error(`Character not found: ${characterId}`);
        }
        
        // Validate evolution requirements
        const canEvolve = this.validateEvolutionRequirements(character, evolutionType, requirements);
        if (!canEvolve.valid) {
            throw new Error(`Evolution requirements not met: ${canEvolve.reason}`);
        }
        
        // Apply evolution
        const evolutionData = this.getEvolutionData(character.type, evolutionType);
        this.applyEvolution(character, evolutionData);
        
        // Record evolution in path
        character.evolution_path.push({
            timestamp: Date.now(),
            from: character.type,
            to: evolutionType,
            tier: character.evolution_tier
        });
        
        character.type = evolutionType;
        character.evolution_tier += 1;
        character.updated_at = Date.now();
        
        this.emit('character_evolved', character, evolutionType);
        console.log(`✨ Evolved character: ${character.name} → ${evolutionType}`);
        
        return character;
    }
    
    /**
     * Assess and apply MBTI personality to character
     */
    assessCharacterPersonality(characterId, behaviorData) {
        const character = this.characters.get(characterId);
        if (!character) {
            throw new Error(`Character not found: ${characterId}`);
        }
        
        // Assess personality using MBTI core
        const assessment = this.mbtiCore.assessPersonality(character.id, behaviorData);
        
        // Apply personality to character
        character.personality.mbti_type = assessment.mbti_type;
        character.personality.assessment_data = assessment;
        
        // Apply personality-driven recommendations
        const recommendations = assessment.character_recommendations;
        
        // Update Kingdom Authority recommendation
        if (recommendations.kingdom_authority) {
            character.stats.recommended_authority = recommendations.kingdom_authority.recommended_level;
        }
        
        // Update evolution recommendations
        if (recommendations.multi_ring_evolution) {
            character.available_evolutions = recommendations.multi_ring_evolution.recommended_paths;
        }
        
        // Update appearance based on personality
        if (recommendations.selfie_style) {
            character.appearance.personality_style = recommendations.selfie_style.recommended_template;
        }
        
        // Set ideal team role
        if (recommendations.team_role) {
            character.specializations.push(recommendations.team_role.ideal_role.toLowerCase());
        }
        
        character.updated_at = Date.now();
        
        this.emit('personality_assessed', character, assessment);
        console.log(`🧠 Applied ${assessment.mbti_type} personality to ${character.name}`);
        
        return assessment;
    }
    
    /**
     * Get character compatibility with another character
     */
    getCharacterCompatibility(characterId1, characterId2) {
        const char1 = this.characters.get(characterId1);
        const char2 = this.characters.get(characterId2);
        
        if (!char1 || !char2) {
            throw new Error('One or both characters not found');
        }
        
        const mbti1 = char1.personality.mbti_type;
        const mbti2 = char2.personality.mbti_type;
        
        if (!mbti1 || !mbti2) {
            return { error: 'Both characters need MBTI assessment for compatibility check' };
        }
        
        const compatibility = this.mbtiCore.checkCompatibility(mbti1, mbti2);
        
        return {
            character1: { name: char1.name, mbti: mbti1 },
            character2: { name: char2.name, mbti: mbti2 },
            compatibility: compatibility,
            team_potential: compatibility.score >= 70 ? 'High' : compatibility.score >= 50 ? 'Medium' : 'Low'
        };
    }
    
    /**
     * Build optimal team from available characters
     */
    buildOptimalTeam(availableCharacterIds, teamSize = 4) {
        const characters = availableCharacterIds
            .map(id => this.characters.get(id))
            .filter(char => char && char.personality.mbti_type);
        
        if (characters.length < teamSize) {
            throw new Error(`Not enough characters with MBTI assessments. Need ${teamSize}, have ${characters.length}`);
        }
        
        const mbtiTypes = characters.map(char => char.personality.mbti_type);
        const teamComposition = this.mbtiCore.getOptimalTeamComposition(mbtiTypes, teamSize);
        
        // Map MBTI types back to actual characters
        const optimalTeam = teamComposition.optimal_team.map(mbtiType => {
            return characters.find(char => char.personality.mbti_type === mbtiType);
        });
        
        return {
            team_members: optimalTeam.map(char => ({
                id: char.id,
                name: char.name,
                mbti_type: char.personality.mbti_type,
                team_role: char.personality.assessment_data?.character_recommendations?.team_role?.ideal_role,
                authority_level: char.stats.authority
            })),
            team_effectiveness: teamComposition.team_score,
            role_distribution: teamComposition.role_distribution,
            team_strengths: teamComposition.strengths,
            potential_conflicts: teamComposition.potential_conflicts
        };
    }
    
    /**
     * Get personality-driven evolution recommendations
     */
    getPersonalityEvolutionRecommendation(characterId, targetEvolution) {
        const character = this.characters.get(characterId);
        if (!character) {
            throw new Error(`Character not found: ${characterId}`);
        }
        
        const mbtiType = character.personality.mbti_type;
        if (!mbtiType) {
            return { error: 'Character needs MBTI assessment for evolution recommendations' };
        }
        
        const recommendation = this.mbtiCore.getRecommendedEvolution(mbtiType, character.type);
        
        const isRecommended = recommendation.primary_recommendation === targetEvolution ||
                             recommendation.alternative_paths.includes(targetEvolution);
        
        return {
            character: { name: character.name, mbti: mbtiType },
            target_evolution: targetEvolution,
            is_personality_aligned: isRecommended,
            personality_recommendation: recommendation.primary_recommendation,
            alternative_paths: recommendation.alternative_paths,
            alignment_reason: recommendation.personality_reason,
            compatibility_score: isRecommended ? 90 : 60 // High if aligned, medium if not
        };
    }
    
    /**
     * Enhance character with full personality integration
     */
    enhanceCharacterWithPersonality(characterId) {
        const character = this.characters.get(characterId);
        if (!character) {
            throw new Error(`Character not found: ${characterId}`);
        }
        
        const mbtiType = character.personality.mbti_type;
        if (!mbtiType) {
            return { error: 'Character needs MBTI assessment first' };
        }
        
        // Generate comprehensive behavior profile
        const behaviorProfile = this.mbtiCore.generateBehaviorProfile(mbtiType);
        
        // Apply personality-driven enhancements
        character.personality.behavior_patterns = behaviorProfile;
        character.personality.communication_style = behaviorProfile.communication_style;
        
        // Update character abilities based on personality strengths
        const typeData = this.mbtiCore.getPersonalityType(mbtiType);
        if (typeData) {
            character.abilities = character.abilities.concat(
                typeData.strengths.map(strength => `personality_${strength}`)
            );
        }
        
        character.updated_at = Date.now();
        
        this.emit('personality_enhanced', character);
        console.log(`✨ Enhanced ${character.name} with full ${mbtiType} personality integration`);
        
        return {
            character_name: character.name,
            mbti_type: mbtiType,
            behavior_profile: behaviorProfile,
            personality_abilities: character.abilities.filter(a => a.startsWith('personality_')),
            enhancement_complete: true
        };
    }

    /**
     * Get database statistics
     */
    getStatistics() {
        const stats = {
            total_characters: this.characters.size,
            by_system: {},
            by_type: {},
            by_tier: {},
            by_authority: {},
            total_relationships: this.relationships.size,
            active_characters: 0
        };
        
        this.characters.forEach(character => {
            // By system
            stats.by_system[character.source_system] = (stats.by_system[character.source_system] || 0) + 1;
            
            // By type
            stats.by_type[character.type] = (stats.by_type[character.type] || 0) + 1;
            
            // By tier
            stats.by_tier[character.evolution_tier] = (stats.by_tier[character.evolution_tier] || 0) + 1;
            
            // By authority
            stats.by_authority[character.stats.authority] = (stats.by_authority[character.stats.authority] || 0) + 1;
            
            // Active check (active within last 24 hours)
            if (Date.now() - character.last_active < 24 * 60 * 60 * 1000) {
                stats.active_characters++;
            }
        });
        
        return stats;
    }
    
    /**
     * Save database to disk
     */
    saveToDisk() {
        const data = {
            characters: Array.from(this.characters.entries()),
            character_types: Array.from(this.characterTypes.entries()),
            relationships: Array.from(this.relationships.entries()),
            evolution_paths: Array.from(this.evolutionPaths.entries()),
            achievements: Array.from(this.achievements.entries()),
            saved_at: Date.now(),
            version: '1.0.0'
        };
        
        const filePath = path.join(__dirname, 'unified-character-database.json');
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        console.log(`💾 Unified Character Database saved to: ${filePath}`);
        return filePath;
    }
    
    /**
     * Load database from disk
     */
    loadFromDisk() {
        const filePath = path.join(__dirname, 'unified-character-database.json');
        
        if (!fs.existsSync(filePath)) {
            console.log('📁 No existing database file found, starting fresh');
            return;
        }
        
        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            this.characters = new Map(data.characters || []);
            this.characterTypes = new Map(data.character_types || []);
            this.relationships = new Map(data.relationships || []);
            this.evolutionPaths = new Map(data.evolution_paths || []);
            this.achievements = new Map(data.achievements || []);
            
            console.log(`📂 Loaded ${this.characters.size} characters from disk`);
        } catch (error) {
            console.error('❌ Failed to load database:', error.message);
        }
    }
    
    /**
     * Load existing characters from current systems
     */
    async loadExistingCharacters() {
        console.log('🔄 Loading existing characters from current systems...');
        
        // TODO: Implement importers for each system
        // - Kingdom Authority characters
        // - Multi-Ring evolution characters  
        // - Boss characters
        // - Selfie-generated characters
        // - Domingo technical characters
        
        console.log('📊 Character loading complete');
    }
    
    // Utility methods
    generateCharacterId() {
        return `char_${crypto.randomBytes(8).toString('hex')}`;
    }
    
    generateRelationshipId() {
        return `rel_${crypto.randomBytes(6).toString('hex')}`;
    }
    
    deepMerge(target, source) {
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {};
                this.deepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        });
    }
    
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    // Placeholder methods for system integration (to be implemented)
    getImportConfig(systemId) { return {}; }
    getExportConfig(systemId) { return {}; }
    transformToUnified(data, config) { return data; }
    transformFromUnified(character, config) { return character; }
    validateEvolutionRequirements(character, type, requirements) { return { valid: true }; }
    getEvolutionData(characterType, evolutionType) { return {}; }
    applyEvolution(character, evolutionData) {}
}

// Auto-run if executed directly
if (require.main === module) {
    console.log('🎭 UNIFIED CHARACTER DATABASE');
    console.log('==============================\n');
    
    const database = new UnifiedCharacterDatabase();
    
    // Create sample characters from each system
    console.log('🎮 Creating sample characters...\n');
    
    // Kingdom Authority character
    const alice = database.createCharacter({
        name: 'Alice the Bold',
        type: 'citizen',
        source_system: 'kingdom_authority',
        karma: 50,
        authority: 'CITIZEN',
        color_scheme: {
            primary: '#0000FF',
            secondary: '#FFFFFF',
            accent: '#FFD700'
        }
    });
    
    // Multi-Ring evolution character
    const blameChainHero = database.createCharacter({
        name: 'BlameChain Warrior',
        type: 'blamechain_base',
        source_system: 'multi_ring',
        stats: { accountability: 150, karma: 100 },
        evolution_tier: 0,
        available_evolutions: ['angel', 'zombie', 'demon', 'mutant', 'dragon', 'mecha']
    });
    
    // Boss character
    const dragonBoss = database.createCharacter({
        name: 'Ancient Dragon Boss',
        type: 'legendary_boss',
        source_system: 'boss_system',
        level: 100,
        boss_data: {
            boss_type: 'legendary',
            health: 5000,
            abilities: ['dragon_breath', 'time_manipulation']
        }
    });
    
    // Technical character
    const bobDev = database.createCharacter({
        name: 'Bob the Developer',
        type: 'technical_character',
        source_system: 'domingo',
        specializations: ['frontend', 'react', 'typescript'],
        technical_data: {
            role: 'Frontend Developer',
            seniority: 'Senior',
            skills: ['React', 'TypeScript', 'Node.js']
        }
    });
    
    // Create relationships
    database.createRelationship(alice.id, blameChainHero.id, 'team_member');
    database.createRelationship(blameChainHero.id, dragonBoss.id, 'nemesis');
    
    // MBTI personality assessments
    console.log('\n🧠 Applying MBTI personality assessments...\n');
    
    // Alice - Strategic citizen with leadership potential
    const aliceBehavior = {
        team_preferences: 'small_team',
        leadership_tendency: 'leads_when_needed',
        decision_style: 'data_driven',
        problem_solving: 'systematic',
        conflict_resolution: 'logical_analysis',
        planning_style: 'detailed_structured',
        character_development: 'planned_progression'
    };
    database.assessCharacterPersonality(alice.id, aliceBehavior);
    
    // BlameChain Hero - Innovative and adaptable warrior
    const heroicBehavior = {
        team_preferences: 'large_team',
        leadership_tendency: 'leads_often',
        decision_style: 'intuitive',
        problem_solving: 'creative',
        conflict_resolution: 'direct_confrontation',
        planning_style: 'flexible_adaptive',
        evolution_approach: 'novel_combinations'
    };
    database.assessCharacterPersonality(blameChainHero.id, heroicBehavior);
    
    // Dragon Boss - Ancient wisdom with protective instincts
    const dragonBehavior = {
        team_preferences: 'solo',
        leadership_tendency: 'natural_leader',
        decision_style: 'intuitive',
        problem_solving: 'systematic',
        conflict_resolution: 'strategic_dominance',
        planning_style: 'long_term_strategic',
        character_interaction: 'protective'
    };
    database.assessCharacterPersonality(dragonBoss.id, dragonBehavior);
    
    // Bob Developer - Analytical problem solver
    const devBehavior = {
        team_preferences: 'small_team',
        leadership_tendency: 'technical_lead',
        decision_style: 'data_driven',
        problem_solving: 'systematic',
        conflict_resolution: 'logical_analysis',
        planning_style: 'detailed_structured',
        work_style: 'focused_intensive'
    };
    database.assessCharacterPersonality(bobDev.id, devBehavior);
    
    // Test personality-driven features
    console.log('\n🤝 Testing character compatibility...\n');
    const compatibility = database.getCharacterCompatibility(alice.id, blameChainHero.id);
    console.log(`${compatibility.character1.name} (${compatibility.character1.mbti}) ↔ ${compatibility.character2.name} (${compatibility.character2.mbti})`);
    console.log(`Compatibility: ${compatibility.compatibility.score}% (${compatibility.team_potential} team potential)`);
    
    // Test optimal team building
    console.log('\n👥 Building optimal team...\n');
    const teamIds = [alice.id, blameChainHero.id, dragonBoss.id, bobDev.id];
    try {
        const optimalTeam = database.buildOptimalTeam(teamIds, 4);
        console.log('🏆 Optimal Team Composition:');
        optimalTeam.team_members.forEach((member, index) => {
            console.log(`   ${index + 1}. ${member.name} (${member.mbti_type}) - ${member.team_role}`);
        });
        console.log(`📊 Team Effectiveness Score: ${optimalTeam.team_effectiveness}`);
    } catch (error) {
        console.log(`⚠️ Team building: ${error.message}`);
    }
    
    // Test evolution recommendations
    console.log('\n⚡ Testing personality-based evolution recommendations...\n');
    const evolutionRec = database.getPersonalityEvolutionRecommendation(blameChainHero.id, 'dragon');
    console.log(`Evolution Check: ${evolutionRec.character.name} → ${evolutionRec.target_evolution}`);
    console.log(`Personality Aligned: ${evolutionRec.is_personality_aligned ? '✅ Yes' : '❌ No'}`);
    console.log(`Recommended Path: ${evolutionRec.personality_recommendation}`);
    
    // Enhanced personality integration
    console.log('\n✨ Applying full personality enhancement...\n');
    [alice, blameChainHero, dragonBoss, bobDev].forEach(character => {
        const enhancement = database.enhanceCharacterWithPersonality(character.id);
        if (enhancement.enhancement_complete) {
            console.log(`   ${enhancement.character_name}: ${enhancement.personality_abilities.length} personality abilities added`);
        }
    });
    
    // Show statistics
    console.log('📊 DATABASE STATISTICS');
    console.log('======================');
    const stats = database.getStatistics();
    Object.entries(stats).forEach(([key, value]) => {
        console.log(`${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`);
    });
    
    // Save to disk
    database.saveToDisk();
    
    console.log('\n✨ Unified Character Database demo complete!');
}

module.exports = UnifiedCharacterDatabase;