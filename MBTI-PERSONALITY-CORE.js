#!/usr/bin/env node

/**
 * 🧠 MBTI PERSONALITY CORE SYSTEM
 * Ring 0 (Core) - Myers-Briggs personality system for all character types
 * Provides personality assessment, typing, and behavior prediction across all systems
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class MBTIPersonalityCore extends EventEmitter {
    constructor() {
        super();
        
        // Ring 0 - No dependencies, pure personality logic
        this.personalityTypes = new Map();
        this.assessments = new Map();
        this.behaviorProfiles = new Map();
        this.compatibilityMatrix = new Map();
        
        // Enhanced for adaptive assessment
        this.behaviorPatterns = new Map();
        this.adaptiveAssessments = new Map();
        this.evolutionTracking = new Map();
        
        // MBTI type definitions with character system mappings
        this.mbtiTypes = {
            // Analysts (NT)
            'INTJ': {
                name: 'The Architect',
                category: 'Analyst',
                traits: ['Independent', 'Strategic', 'Analytical', 'Visionary'],
                kingdom_authority_affinity: 'LORD', // Strategic leadership
                multi_ring_affinity: ['dragon', 'mecha'], // Strategic/tech characters
                boss_affinity: 'Guardian', // Protective/strategic
                selfie_style: 'sci-fi', // Future-focused aesthetic
                strengths: ['strategic_thinking', 'independence', 'vision'],
                weaknesses: ['social_interaction', 'emotional_expression'],
                ideal_team_role: 'Strategist',
                evolution_preference: 'long_term_power',
                communication_style: 'direct_analytical'
            },
            
            'INTP': {
                name: 'The Thinker', 
                category: 'Analyst',
                traits: ['Logical', 'Innovative', 'Curious', 'Flexible'],
                kingdom_authority_affinity: 'MERCHANT', // Independent operation
                multi_ring_affinity: ['mutant', 'mecha'], // Adaptive/experimental
                boss_affinity: 'Economic', // Systematic approach
                selfie_style: 'modern', // Clean, minimal
                strengths: ['logical_analysis', 'innovation', 'adaptability'],
                weaknesses: ['practical_implementation', 'routine_tasks'],
                ideal_team_role: 'Analyst',
                evolution_preference: 'experimental_paths',
                communication_style: 'theoretical_exploration'
            },
            
            'ENTJ': {
                name: 'The Commander',
                category: 'Analyst', 
                traits: ['Leader', 'Efficient', 'Strategic', 'Confident'],
                kingdom_authority_affinity: 'KING', // Natural leader
                multi_ring_affinity: ['dragon', 'angel'], // Power/authority characters
                boss_affinity: 'Legendary', // Ultimate leadership
                selfie_style: 'fantasy', // Epic/heroic aesthetic
                strengths: ['leadership', 'strategic_planning', 'efficiency'],
                weaknesses: ['patience', 'emotional_sensitivity'],
                ideal_team_role: 'Leader',
                evolution_preference: 'authority_growth',
                communication_style: 'commanding_decisive'
            },
            
            'ENTP': {
                name: 'The Debater',
                category: 'Analyst',
                traits: ['Innovative', 'Energetic', 'Charismatic', 'Adaptable'],
                kingdom_authority_affinity: 'KNIGHT', // Active engagement
                multi_ring_affinity: ['mutant', 'demon'], // Chaotic/adaptive
                boss_affinity: 'Combat', // Active confrontation
                selfie_style: 'anime', // Expressive/dynamic
                strengths: ['innovation', 'adaptability', 'charisma'],
                weaknesses: ['follow_through', 'routine_work'],
                ideal_team_role: 'Innovator',
                evolution_preference: 'rapid_change',
                communication_style: 'enthusiastic_debate'
            },
            
            // Diplomats (NF)
            'INFJ': {
                name: 'The Advocate',
                category: 'Diplomat',
                traits: ['Idealistic', 'Insightful', 'Principled', 'Passionate'],
                kingdom_authority_affinity: 'LORD', // Principled leadership
                multi_ring_affinity: ['angel', 'dragon'], // Noble/wise characters
                boss_affinity: 'Guardian', // Protective nature
                selfie_style: 'fantasy', // Idealistic aesthetic
                strengths: ['insight', 'empathy', 'principled_action'],
                weaknesses: ['criticism_sensitivity', 'perfectionism'],
                ideal_team_role: 'Guide',
                evolution_preference: 'moral_advancement',
                communication_style: 'empathetic_inspiring'
            },
            
            'INFP': {
                name: 'The Mediator',
                category: 'Diplomat',
                traits: ['Idealistic', 'Loyal', 'Adaptable', 'Curious'],
                kingdom_authority_affinity: 'CITIZEN', // Values-driven
                multi_ring_affinity: ['angel', 'mutant'], // Pure/adaptive characters
                boss_affinity: 'Guardian', // Protective of values
                selfie_style: 'retro', // Nostalgic/artistic
                strengths: ['adaptability', 'loyalty', 'creativity'],
                weaknesses: ['conflict_avoidance', 'decision_making'],
                ideal_team_role: 'Harmonizer', 
                evolution_preference: 'value_alignment',
                communication_style: 'gentle_supportive'
            },
            
            'ENFJ': {
                name: 'The Protagonist',
                category: 'Diplomat',
                traits: ['Charismatic', 'Supportive', 'Inspiring', 'Altruistic'],
                kingdom_authority_affinity: 'KNIGHT', // Service-oriented leadership
                multi_ring_affinity: ['angel', 'dragon'], // Noble/inspiring characters
                boss_affinity: 'Guardian', // Protective leadership
                selfie_style: 'fantasy', // Heroic aesthetic
                strengths: ['leadership', 'empathy', 'inspiration'],
                weaknesses: ['self_neglect', 'criticism_sensitivity'],
                ideal_team_role: 'Motivator',
                evolution_preference: 'team_empowerment',
                communication_style: 'inspiring_supportive'
            },
            
            'ENFP': {
                name: 'The Campaigner',
                category: 'Diplomat',
                traits: ['Enthusiastic', 'Creative', 'Spontaneous', 'Charming'],
                kingdom_authority_affinity: 'MERCHANT', // Social networking
                multi_ring_affinity: ['angel', 'mutant'], // Positive/adaptive
                boss_affinity: 'Economic', // Creative value creation
                selfie_style: 'meme', // Fun/expressive
                strengths: ['enthusiasm', 'creativity', 'social_skills'],
                weaknesses: ['focus', 'routine_work'],
                ideal_team_role: 'Energizer',
                evolution_preference: 'creative_expression',
                communication_style: 'enthusiastic_expressive'
            },
            
            // Sentinels (SJ)
            'ISTJ': {
                name: 'The Logistician',
                category: 'Sentinel',
                traits: ['Practical', 'Responsible', 'Reliable', 'Organized'],
                kingdom_authority_affinity: 'KNIGHT', // Duty and service
                multi_ring_affinity: ['mecha', 'zombie'], // Systematic/persistent
                boss_affinity: 'Guardian', // Reliable protection
                selfie_style: 'modern', // Clean, professional
                strengths: ['reliability', 'organization', 'duty'],
                weaknesses: ['flexibility', 'innovation'],
                ideal_team_role: 'Executor',
                evolution_preference: 'steady_progression',
                communication_style: 'factual_reliable'
            },
            
            'ISFJ': {
                name: 'The Protector',
                category: 'Sentinel',
                traits: ['Warm', 'Responsible', 'Patient', 'Loyal'],
                kingdom_authority_affinity: 'CITIZEN', // Service-oriented
                multi_ring_affinity: ['angel', 'zombie'], // Caring/persistent
                boss_affinity: 'Guardian', // Natural protector
                selfie_style: 'retro', // Warm/nostalgic
                strengths: ['empathy', 'reliability', 'attention_to_detail'],
                weaknesses: ['self_advocacy', 'change_resistance'],
                ideal_team_role: 'Supporter',
                evolution_preference: 'protective_growth',
                communication_style: 'caring_detailed'
            },
            
            'ESTJ': {
                name: 'The Executive',
                category: 'Sentinel',
                traits: ['Efficient', 'Strong-willed', 'Dutiful', 'Results-oriented'],
                kingdom_authority_affinity: 'LORD', // Natural administrator
                multi_ring_affinity: ['dragon', 'mecha'], // Authority/systematic
                boss_affinity: 'Legendary', // Executive presence
                selfie_style: 'modern', // Professional/authoritative
                strengths: ['leadership', 'organization', 'results_focus'],
                weaknesses: ['flexibility', 'emotional_consideration'],
                ideal_team_role: 'Director',
                evolution_preference: 'authority_building',
                communication_style: 'direct_authoritative'
            },
            
            'ESFJ': {
                name: 'The Consul',
                category: 'Sentinel',
                traits: ['Supportive', 'Outgoing', 'Loyal', 'Organized'],
                kingdom_authority_affinity: 'KNIGHT', // Service-oriented
                multi_ring_affinity: ['angel', 'dragon'], // Supportive/social
                boss_affinity: 'Guardian', // Community protection
                selfie_style: 'anime', // Expressive/social
                strengths: ['social_skills', 'loyalty', 'organization'],
                weaknesses: ['conflict_handling', 'criticism_response'],
                ideal_team_role: 'Coordinator',
                evolution_preference: 'social_harmony',
                communication_style: 'warm_organized'
            },
            
            // Explorers (SP)
            'ISTP': {
                name: 'The Virtuoso',
                category: 'Explorer',
                traits: ['Bold', 'Practical', 'Experimental', 'Flexible'],
                kingdom_authority_affinity: 'MERCHANT', // Independent operation
                multi_ring_affinity: ['mecha', 'mutant'], // Technical/adaptive
                boss_affinity: 'Combat', // Hands-on approach
                selfie_style: 'modern', // Practical aesthetic
                strengths: ['practical_skills', 'adaptability', 'problem_solving'],
                weaknesses: ['long_term_planning', 'emotional_expression'],
                ideal_team_role: 'Specialist',
                evolution_preference: 'skill_mastery',
                communication_style: 'practical_direct'
            },
            
            'ISFP': {
                name: 'The Adventurer',
                category: 'Explorer',
                traits: ['Charming', 'Sensitive', 'Curious', 'Artistic'],
                kingdom_authority_affinity: 'CITIZEN', // Values-driven
                multi_ring_affinity: ['angel', 'mutant'], // Pure/creative
                boss_affinity: 'Economic', // Creative value
                selfie_style: 'retro', // Artistic/nostalgic
                strengths: ['creativity', 'empathy', 'flexibility'],
                weaknesses: ['planning', 'criticism_handling'],
                ideal_team_role: 'Creator',
                evolution_preference: 'artistic_expression',
                communication_style: 'gentle_creative'
            },
            
            'ESTP': {
                name: 'The Entrepreneur',
                category: 'Explorer',
                traits: ['Energetic', 'Perceptive', 'Spontaneous', 'Pragmatic'],
                kingdom_authority_affinity: 'MERCHANT', // Active trading
                multi_ring_affinity: ['demon', 'zombie'], // Aggressive/persistent
                boss_affinity: 'Combat', // Action-oriented
                selfie_style: 'modern', // Dynamic/current
                strengths: ['action_orientation', 'adaptability', 'pragmatism'],
                weaknesses: ['long_term_focus', 'theoretical_work'],
                ideal_team_role: 'Activator',
                evolution_preference: 'immediate_power',
                communication_style: 'energetic_practical'
            },
            
            'ESFP': {
                name: 'The Entertainer',
                category: 'Explorer',
                traits: ['Spontaneous', 'Enthusiastic', 'Friendly', 'Supportive'],
                kingdom_authority_affinity: 'CITIZEN', // Social engagement
                multi_ring_affinity: ['angel', 'mutant'], // Positive/expressive
                boss_affinity: 'Economic', // Entertainment value
                selfie_style: 'meme', // Fun/entertaining
                strengths: ['social_skills', 'enthusiasm', 'spontaneity'],
                weaknesses: ['planning', 'criticism_handling'],
                ideal_team_role: 'Energizer',
                evolution_preference: 'social_connection',
                communication_style: 'enthusiastic_social'
            }
        };
        
        // Initialize system
        console.log('🧠 MBTI Personality Core System initialized (Ring 0)');
        this.initializePersonalitySystem();
    }
    
    /**
     * Initialize personality assessment system
     */
    initializePersonalitySystem() {
        // Create compatibility matrix
        this.buildCompatibilityMatrix();
        
        // Create evolution affinity mappings
        this.buildEvolutionAffinities();
        
        // Create team role mappings
        this.buildTeamRoleMappings();
        
        console.log(`🎭 MBTI system ready: ${Object.keys(this.mbtiTypes).length} personality types`);
    }
    
    /**
     * Assess personality from character behavior/preferences
     */
    assessPersonality(userId, behaviorData) {
        const assessment = {
            id: this.generateAssessmentId(),
            user_id: userId,
            timestamp: Date.now(),
            behavior_data: behaviorData,
            
            // MBTI dimensions (calculated from behavior)
            dimensions: {
                // Extraversion vs Introversion
                E_I: this.calculateEI(behaviorData),
                // Sensing vs Intuition  
                S_N: this.calculateSN(behaviorData),
                // Thinking vs Feeling
                T_F: this.calculateTF(behaviorData),
                // Judging vs Perceiving
                J_P: this.calculateJP(behaviorData)
            },
            
            confidence_scores: {},
            mbti_type: null,
            character_recommendations: []
        };
        
        // Calculate MBTI type
        assessment.mbti_type = this.determineMBTIType(assessment.dimensions);
        assessment.confidence_scores = this.calculateConfidenceScores(assessment.dimensions);
        
        // Generate character recommendations
        assessment.character_recommendations = this.generateCharacterRecommendations(assessment.mbti_type);
        
        this.assessments.set(assessment.id, assessment);
        
        this.emit('personality_assessed', assessment);
        console.log(`🧠 Personality assessed: ${userId} → ${assessment.mbti_type}`);
        
        return assessment;
    }
    
    /**
     * Calculate Extraversion vs Introversion
     */
    calculateEI(behaviorData) {
        let score = 0; // Negative = Introversion, Positive = Extraversion
        
        // Social interaction patterns
        if (behaviorData.team_preferences === 'solo') score -= 2;
        if (behaviorData.team_preferences === 'large_team') score += 2;
        if (behaviorData.communication_frequency === 'high') score += 1;
        if (behaviorData.communication_frequency === 'low') score -= 1;
        
        // Gaming/activity preferences
        if (behaviorData.preferred_game_mode === 'multiplayer') score += 1;
        if (behaviorData.preferred_game_mode === 'single_player') score -= 1;
        if (behaviorData.leadership_tendency === 'leads_often') score += 2;
        if (behaviorData.leadership_tendency === 'avoids_leading') score -= 2;
        
        return Math.max(-5, Math.min(5, score)); // Clamp to -5 to +5
    }
    
    /**
     * Calculate Sensing vs Intuition
     */
    calculateSN(behaviorData) {
        let score = 0; // Negative = Sensing, Positive = Intuition
        
        // Information processing preferences
        if (behaviorData.decision_style === 'data_driven') score -= 2;
        if (behaviorData.decision_style === 'intuitive') score += 2;
        if (behaviorData.problem_solving === 'systematic') score -= 1;
        if (behaviorData.problem_solving === 'creative') score += 1;
        
        // Character/evolution preferences
        if (behaviorData.character_preference === 'traditional') score -= 1;
        if (behaviorData.character_preference === 'experimental') score += 1;
        if (behaviorData.evolution_approach === 'proven_paths') score -= 1;
        if (behaviorData.evolution_approach === 'novel_combinations') score += 1;
        
        return Math.max(-5, Math.min(5, score));
    }
    
    /**
     * Calculate Thinking vs Feeling
     */
    calculateTF(behaviorData) {
        let score = 0; // Negative = Thinking, Positive = Feeling
        
        // Decision making style
        if (behaviorData.conflict_resolution === 'logical_analysis') score -= 2;
        if (behaviorData.conflict_resolution === 'harmony_focused') score += 2;
        if (behaviorData.feedback_style === 'direct_critical') score -= 1;
        if (behaviorData.feedback_style === 'supportive_gentle') score += 1;
        
        // Character interaction preferences
        if (behaviorData.character_interaction === 'competitive') score -= 1;
        if (behaviorData.character_interaction === 'collaborative') score += 1;
        if (behaviorData.karma_preference === 'strict_accountability') score -= 1;
        if (behaviorData.karma_preference === 'forgiving_growth') score += 1;
        
        return Math.max(-5, Math.min(5, score));
    }
    
    /**
     * Calculate Judging vs Perceiving
     */
    calculateJP(behaviorData) {
        let score = 0; // Negative = Judging, Positive = Perceiving
        
        // Structure and planning preferences
        if (behaviorData.planning_style === 'detailed_structured') score -= 2;
        if (behaviorData.planning_style === 'flexible_adaptive') score += 2;
        if (behaviorData.work_style === 'scheduled_organized') score -= 1;
        if (behaviorData.work_style === 'spontaneous_reactive') score += 1;
        
        // Character development approach
        if (behaviorData.character_development === 'planned_progression') score -= 1;
        if (behaviorData.character_development === 'opportunistic_growth') score += 1;
        if (behaviorData.system_usage === 'consistent_routine') score -= 1;
        if (behaviorData.system_usage === 'exploratory_varied') score += 1;
        
        return Math.max(-5, Math.min(5, score));
    }
    
    /**
     * Determine MBTI type from dimension scores
     */
    determineMBTIType(dimensions) {
        let type = '';
        
        // Extraversion vs Introversion
        type += dimensions.E_I >= 0 ? 'E' : 'I';
        
        // Sensing vs Intuition
        type += dimensions.S_N >= 0 ? 'N' : 'S';
        
        // Thinking vs Feeling  
        type += dimensions.T_F >= 0 ? 'F' : 'T';
        
        // Judging vs Perceiving
        type += dimensions.J_P >= 0 ? 'P' : 'J';
        
        return type;
    }
    
    /**
     * Calculate confidence scores for assessment
     */
    calculateConfidenceScores(dimensions) {
        const scores = {};
        
        Object.entries(dimensions).forEach(([dimension, score]) => {
            // Convert -5 to +5 range to 0-100% confidence
            const confidence = Math.abs(score) * 20; // 5 = 100%, 1 = 20%
            scores[dimension] = Math.min(100, confidence);
        });
        
        // Overall confidence is average of individual confidences
        const values = Object.values(scores);
        scores.overall = values.reduce((sum, score) => sum + score, 0) / values.length;
        
        return scores;
    }
    
    /**
     * Generate character recommendations based on MBTI type
     */
    generateCharacterRecommendations(mbtiType) {
        const typeData = this.mbtiTypes[mbtiType];
        if (!typeData) return [];
        
        return {
            kingdom_authority: {
                recommended_level: typeData.kingdom_authority_affinity,
                reason: `${typeData.name} types naturally align with ${typeData.kingdom_authority_affinity} authority level`
            },
            
            multi_ring_evolution: {
                recommended_paths: typeData.multi_ring_affinity,
                reason: `Character evolutions matching ${typeData.name} traits and strengths`
            },
            
            boss_character: {
                recommended_type: typeData.boss_affinity,
                reason: `${typeData.boss_affinity} boss type aligns with ${typeData.name} approach`
            },
            
            selfie_style: {
                recommended_template: typeData.selfie_style,
                reason: `${typeData.selfie_style} aesthetic matches ${typeData.name} personality`
            },
            
            team_role: {
                ideal_role: typeData.ideal_team_role,
                reason: `${typeData.name} types excel in ${typeData.ideal_team_role} team positions`
            },
            
            evolution_strategy: {
                approach: typeData.evolution_preference,
                reason: `Optimal evolution path for ${typeData.name} personality type`
            }
        };
    }
    
    /**
     * Get personality type data
     */
    getPersonalityType(mbtiType) {
        return this.mbtiTypes[mbtiType];
    }
    
    /**
     * Check compatibility between two personality types
     */
    checkCompatibility(mbtiType1, mbtiType2) {
        const compatibility = this.compatibilityMatrix.get(`${mbtiType1}_${mbtiType2}`) || 
                             this.compatibilityMatrix.get(`${mbtiType2}_${mbtiType1}`);
        
        if (compatibility) {
            return compatibility;
        }
        
        // Calculate dynamic compatibility
        const type1Data = this.mbtiTypes[mbtiType1];
        const type2Data = this.mbtiTypes[mbtiType2];
        
        if (!type1Data || !type2Data) {
            return { score: 50, reason: 'Unknown type compatibility' };
        }
        
        let compatibilityScore = 50; // Base compatibility
        
        // Same category bonus
        if (type1Data.category === type2Data.category) {
            compatibilityScore += 10;
        }
        
        // Complementary strengths
        const type1Strengths = new Set(type1Data.strengths);
        const type2Strengths = new Set(type2Data.strengths);
        const sharedStrengths = [...type1Strengths].filter(s => type2Strengths.has(s));
        compatibilityScore += sharedStrengths.length * 5;
        
        // Team role compatibility
        const roleCompatibility = this.checkTeamRoleCompatibility(
            type1Data.ideal_team_role,
            type2Data.ideal_team_role
        );
        compatibilityScore += roleCompatibility;
        
        return {
            score: Math.max(0, Math.min(100, compatibilityScore)),
            reason: `${type1Data.name} and ${type2Data.name} compatibility analysis`,
            shared_strengths: sharedStrengths,
            team_dynamic: roleCompatibility > 0 ? 'complementary' : 'similar'
        };
    }
    
    /**
     * Get optimal team composition
     */
    getOptimalTeamComposition(mbtiTypes, teamSize = 4) {
        // Find best combination of personality types for team effectiveness
        const combinations = this.generateTeamCombinations(mbtiTypes, teamSize);
        
        let bestTeam = null;
        let bestScore = 0;
        
        combinations.forEach(team => {
            const score = this.calculateTeamScore(team);
            if (score > bestScore) {
                bestScore = score;
                bestTeam = team;
            }
        });
        
        return {
            optimal_team: bestTeam,
            team_score: bestScore,
            role_distribution: this.analyzeTeamRoles(bestTeam),
            strengths: this.identifyTeamStrengths(bestTeam),
            potential_conflicts: this.identifyPotentialConflicts(bestTeam)
        };
    }
    
    /**
     * Build compatibility matrix for common type pairs
     */
    buildCompatibilityMatrix() {
        // High compatibility pairs
        this.setCompatibility('INTJ', 'ENFP', 90, 'Visionary + Energizer synergy');
        this.setCompatibility('INTP', 'ENTJ', 85, 'Thinker + Commander balance');
        this.setCompatibility('ISFJ', 'ESTP', 80, 'Protector + Entrepreneur balance');
        this.setCompatibility('INFJ', 'ENTP', 88, 'Advocate + Debater dynamic');
        
        // Moderate compatibility pairs  
        this.setCompatibility('ISTJ', 'ESFP', 75, 'Structure + Spontaneity tension');
        this.setCompatibility('ESTJ', 'ISFP', 70, 'Executive + Artist creativity');
        
        console.log(`🤝 Built compatibility matrix with ${this.compatibilityMatrix.size} pairs`);
    }
    
    setCompatibility(type1, type2, score, reason) {
        const key = `${type1}_${type2}`;
        this.compatibilityMatrix.set(key, { score, reason });
    }
    
    /**
     * Build evolution affinity mappings
     */
    buildEvolutionAffinities() {
        // Map MBTI types to preferred evolution paths
        this.evolutionAffinities = {
            // Analysts prefer strategic/technical evolutions
            'NT': ['dragon', 'mecha', 'ancient_dragon', 'cyber_overlord'],
            
            // Diplomats prefer noble/supportive evolutions
            'NF': ['angel', 'dragon', 'seraph', 'ancient_dragon'],
            
            // Sentinels prefer structured/reliable evolutions
            'SJ': ['mecha', 'angel', 'zombie', 'cyber_overlord'],
            
            // Explorers prefer adaptive/action evolutions
            'SP': ['mutant', 'demon', 'zombie', 'apex_mutant']
        };
        
        console.log('🔄 Evolution affinity mappings created');
    }
    
    /**
     * Build team role mappings
     */
    buildTeamRoleMappings() {
        this.teamRoles = {
            'Leader': ['ENTJ', 'ESTJ', 'ENFJ'],
            'Strategist': ['INTJ', 'INTP', 'ENTP'],
            'Supporter': ['ISFJ', 'ESFJ', 'INFP'],
            'Specialist': ['ISTP', 'ISFP', 'ISTJ'],
            'Energizer': ['ESFP', 'ENFP', 'ESTP'],
            'Analyst': ['INTP', 'INTJ', 'ISTP'],
            'Harmonizer': ['INFP', 'ISFJ', 'ESFJ'],
            'Innovator': ['ENTP', 'ENFP', 'INTP']
        };
        
        console.log('👥 Team role mappings created');
    }
    
    /**
     * Get recommended evolution path for personality type
     */
    getRecommendedEvolution(mbtiType, currentCharacterType) {
        const typeData = this.mbtiTypes[mbtiType];
        if (!typeData) return null;
        
        // Get personality category (NT, NF, SJ, SP)
        const category = mbtiType[1] + mbtiType[2]; // e.g., 'NT' from 'INTJ'
        const affinities = this.evolutionAffinities[category] || [];
        
        // Filter by current character possibilities
        let recommendations = typeData.multi_ring_affinity.filter(evo => 
            affinities.includes(evo)
        );
        
        if (recommendations.length === 0) {
            recommendations = typeData.multi_ring_affinity;
        }
        
        return {
            primary_recommendation: recommendations[0],
            alternative_paths: recommendations.slice(1),
            personality_reason: `${typeData.name} types align with these evolution paths`,
            category_affinity: category
        };
    }
    
    /**
     * Generate behavior profile for character AI
     */
    generateBehaviorProfile(mbtiType) {
        const typeData = this.mbtiTypes[mbtiType];
        if (!typeData) return null;
        
        const profile = {
            mbti_type: mbtiType,
            communication_style: typeData.communication_style,
            decision_making: this.getDecisionMakingStyle(mbtiType),
            conflict_handling: this.getConflictHandlingStyle(mbtiType),
            motivation_factors: this.getMotivationFactors(mbtiType),
            stress_responses: this.getStressResponses(mbtiType),
            learning_preferences: this.getLearningPreferences(mbtiType),
            interaction_patterns: this.getInteractionPatterns(mbtiType)
        };
        
        this.behaviorProfiles.set(mbtiType, profile);
        
        return profile;
    }
    
    // Utility methods for behavior profile generation
    getDecisionMakingStyle(mbtiType) {
        const thinkingTypes = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'ISTJ', 'ISTP', 'ESTJ', 'ESTP'];
        return thinkingTypes.includes(mbtiType) ? 'analytical_logical' : 'value_based_empathetic';
    }
    
    getConflictHandlingStyle(mbtiType) {
        const type = this.mbtiTypes[mbtiType];
        if (mbtiType.includes('E') && mbtiType.includes('T')) return 'direct_confrontation';
        if (mbtiType.includes('I') && mbtiType.includes('F')) return 'avoidance_harmony';
        if (mbtiType.includes('E') && mbtiType.includes('F')) return 'collaborative_resolution';
        return 'analytical_problem_solving';
    }
    
    getMotivationFactors(mbtiType) {
        const type = this.mbtiTypes[mbtiType];
        return [
            type.evolution_preference,
            ...type.strengths.slice(0, 2),
            'personal_growth',
            'achievement_recognition'
        ];
    }
    
    getStressResponses(mbtiType) {
        const type = this.mbtiTypes[mbtiType];
        return {
            stress_triggers: type.weaknesses,
            coping_mechanisms: type.strengths,
            recovery_activities: [`${type.selfie_style}_activities`, 'skill_development']
        };
    }
    
    getLearningPreferences(mbtiType) {
        const intuitionTypes = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP'];
        return {
            learning_style: intuitionTypes.includes(mbtiType) ? 'conceptual_theoretical' : 'practical_hands_on',
            feedback_preference: mbtiType.includes('F') ? 'supportive_constructive' : 'direct_analytical',
            pace_preference: mbtiType.includes('J') ? 'structured_steady' : 'flexible_burst'
        };
    }
    
    getInteractionPatterns(mbtiType) {
        const type = this.mbtiTypes[mbtiType];
        return {
            communication_style: type.communication_style,
            team_contribution: type.ideal_team_role.toLowerCase(),
            leadership_style: this.getLeadershipStyle(mbtiType),
            collaboration_preference: this.getCollaborationPreference(mbtiType)
        };
    }
    
    getLeadershipStyle(mbtiType) {
        if (mbtiType.includes('E') && mbtiType.includes('T') && mbtiType.includes('J')) return 'directive_executive';
        if (mbtiType.includes('E') && mbtiType.includes('F') && mbtiType.includes('J')) return 'inspirational_supportive';
        if (mbtiType.includes('I') && mbtiType.includes('T')) return 'analytical_expert';
        if (mbtiType.includes('I') && mbtiType.includes('F')) return 'behind_scenes_supportive';
        return 'situational_adaptive';
    }
    
    getCollaborationPreference(mbtiType) {
        if (mbtiType.includes('E')) return 'active_verbal_collaboration';
        if (mbtiType.includes('I')) return 'focused_written_collaboration';
        return 'flexible_collaboration';
    }
    
    // Utility methods
    generateAssessmentId() {
        return `assess_${crypto.randomBytes(6).toString('hex')}`;
    }
    
    generateTeamCombinations(types, size) {
        // Generate all possible team combinations (simplified for demo)
        const combinations = [];
        for (let i = 0; i < Math.min(10, types.length); i++) {
            combinations.push(types.slice(i, i + size));
        }
        return combinations;
    }
    
    calculateTeamScore(team) {
        // Calculate team effectiveness score based on MBTI composition
        let score = 0;
        
        // Role diversity bonus
        const roles = team.map(type => this.mbtiTypes[type]?.ideal_team_role);
        const uniqueRoles = new Set(roles);
        score += uniqueRoles.size * 10;
        
        // Category balance bonus  
        const categories = team.map(type => this.mbtiTypes[type]?.category);
        const uniqueCategories = new Set(categories);
        score += uniqueCategories.size * 5;
        
        return score;
    }
    
    analyzeTeamRoles(team) {
        const roles = {};
        team.forEach(type => {
            const role = this.mbtiTypes[type]?.ideal_team_role;
            roles[role] = (roles[role] || 0) + 1;
        });
        return roles;
    }
    
    identifyTeamStrengths(team) {
        const allStrengths = [];
        team.forEach(type => {
            const strengths = this.mbtiTypes[type]?.strengths || [];
            allStrengths.push(...strengths);
        });
        
        // Count frequency of strengths
        const strengthCounts = {};
        allStrengths.forEach(strength => {
            strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
        });
        
        return Object.entries(strengthCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([strength, count]) => ({ strength, team_members: count }));
    }
    
    identifyPotentialConflicts(team) {
        const conflicts = [];
        
        // Check for opposing types that might clash
        for (let i = 0; i < team.length; i++) {
            for (let j = i + 1; j < team.length; j++) {
                const compatibility = this.checkCompatibility(team[i], team[j]);
                if (compatibility.score < 60) {
                    conflicts.push({
                        types: [team[i], team[j]],
                        compatibility_score: compatibility.score,
                        potential_issue: compatibility.reason
                    });
                }
            }
        }
        
        return conflicts;
    }
    
    checkTeamRoleCompatibility(role1, role2) {
        // Some roles work better together than others
        const synergies = {
            'Leader': ['Strategist', 'Supporter', 'Specialist'],
            'Strategist': ['Leader', 'Analyst', 'Innovator'],
            'Supporter': ['Leader', 'Harmonizer', 'Energizer'],
            'Specialist': ['Leader', 'Analyst', 'Coordinator'],
            'Energizer': ['Supporter', 'Innovator', 'Coordinator'],
            'Analyst': ['Strategist', 'Specialist', 'Innovator'],
            'Harmonizer': ['Supporter', 'Coordinator', 'Creator'],
            'Innovator': ['Strategist', 'Energizer', 'Analyst']
        };
        
        const role1Synergies = synergies[role1] || [];
        return role1Synergies.includes(role2) ? 15 : 0;
    }
    
    /**
     * ADAPTIVE ASSESSMENT METHODS
     * Enhanced methods for dynamic personality assessment
     */
    
    /**
     * Assess personality from behavioral patterns (adaptive method)
     */
    assessPersonalityFromBehavior(userId, behaviorPatterns, options = {}) {
        console.log(`🧠 Adaptive MBTI assessment for ${userId}...`);
        
        const behaviorAnalysis = this.analyzeBehaviorPatterns(behaviorPatterns);
        const mbtiPrediction = this.predictMBTIFromBehavior(behaviorAnalysis);
        
        // Create adaptive assessment record
        const assessment = {
            user_id: userId,
            assessment_id: this.generateAssessmentId(),
            timestamp: Date.now(),
            method: 'adaptive_behavioral',
            
            // Behavioral analysis
            behavior_analysis: behaviorAnalysis,
            
            // MBTI prediction
            predicted_type: mbtiPrediction.type,
            prediction_confidence: mbtiPrediction.confidence,
            dimension_scores: mbtiPrediction.dimension_scores,
            
            // Supporting evidence
            evidence: mbtiPrediction.evidence,
            pattern_strength: behaviorAnalysis.pattern_strength,
            
            // Adaptive features
            evolution_tracking: {
                baseline: mbtiPrediction.type,
                change_indicators: [],
                stability_score: 0
            },
            
            // Integration data
            cultural_correlations: this.correlateCulturalFrameworks(mbtiPrediction.type),
            learning_style_correlation: this.correlateLearningStyle(mbtiPrediction.type),
            motivation_correlation: this.correlateMotivationalDrivers(mbtiPrediction.type)
        };
        
        this.adaptiveAssessments.set(assessment.assessment_id, assessment);
        this.behaviorPatterns.set(userId, behaviorPatterns);
        
        return assessment;
    }
    
    /**
     * Analyze behavioral patterns for MBTI indicators
     */
    analyzeBehaviorPatterns(patterns) {
        const dimensionIndicators = {
            E: 0, I: 0,  // Extraversion vs Introversion
            S: 0, N: 0,  // Sensing vs Intuition  
            T: 0, F: 0,  // Thinking vs Feeling
            J: 0, P: 0   // Judging vs Perceiving
        };
        
        const patternEvidence = [];
        
        patterns.forEach(pattern => {
            const confidence = pattern.confidence || 50;
            
            // Extraversion indicators
            if (pattern.type.includes('collaborative') || pattern.type.includes('social') || pattern.type.includes('external')) {
                dimensionIndicators.E += confidence;
                patternEvidence.push({ pattern: pattern.type, supports: 'E', confidence });
            }
            
            // Introversion indicators
            if (pattern.type.includes('independent') || pattern.type.includes('internal') || pattern.type.includes('reflective')) {
                dimensionIndicators.I += confidence;
                patternEvidence.push({ pattern: pattern.type, supports: 'I', confidence });
            }
            
            // Sensing indicators
            if (pattern.type.includes('concrete') || pattern.type.includes('practical') || pattern.type.includes('detailed')) {
                dimensionIndicators.S += confidence;
                patternEvidence.push({ pattern: pattern.type, supports: 'S', confidence });
            }
            
            // Intuition indicators
            if (pattern.type.includes('conceptual') || pattern.type.includes('innovative') || pattern.type.includes('big_picture')) {
                dimensionIndicators.N += confidence;
                patternEvidence.push({ pattern: pattern.type, supports: 'N', confidence });
            }
            
            // Thinking indicators
            if (pattern.type.includes('analytical') || pattern.type.includes('logical') || pattern.type.includes('objective')) {
                dimensionIndicators.T += confidence;
                patternEvidence.push({ pattern: pattern.type, supports: 'T', confidence });
            }
            
            // Feeling indicators
            if (pattern.type.includes('empathetic') || pattern.type.includes('value_based') || pattern.type.includes('people_focused')) {
                dimensionIndicators.F += confidence;
                patternEvidence.push({ pattern: pattern.type, supports: 'F', confidence });
            }
            
            // Judging indicators
            if (pattern.type.includes('structured') || pattern.type.includes('planned') || pattern.type.includes('decisive')) {
                dimensionIndicators.J += confidence;
                patternEvidence.push({ pattern: pattern.type, supports: 'J', confidence });
            }
            
            // Perceiving indicators
            if (pattern.type.includes('flexible') || pattern.type.includes('adaptive') || pattern.type.includes('exploratory')) {
                dimensionIndicators.P += confidence;
                patternEvidence.push({ pattern: pattern.type, supports: 'P', confidence });
            }
        });
        
        return {
            dimension_indicators: dimensionIndicators,
            pattern_evidence: patternEvidence,
            pattern_strength: patternEvidence.reduce((sum, p) => sum + p.confidence, 0) / patternEvidence.length,
            total_patterns: patterns.length
        };
    }
    
    /**
     * Predict MBTI type from behavioral analysis
     */
    predictMBTIFromBehavior(behaviorAnalysis) {
        const indicators = behaviorAnalysis.dimension_indicators;
        
        // Determine type
        const type = (
            (indicators.E > indicators.I ? 'E' : 'I') +
            (indicators.S > indicators.N ? 'S' : 'N') +
            (indicators.T > indicators.F ? 'T' : 'F') +
            (indicators.J > indicators.P ? 'J' : 'P')
        );
        
        // Calculate confidence for each dimension
        const dimensionConfidences = {
            'E/I': Math.abs(indicators.E - indicators.I) / Math.max(indicators.E, indicators.I, 1),
            'S/N': Math.abs(indicators.S - indicators.N) / Math.max(indicators.S, indicators.N, 1),
            'T/F': Math.abs(indicators.T - indicators.F) / Math.max(indicators.T, indicators.F, 1),
            'J/P': Math.abs(indicators.J - indicators.P) / Math.max(indicators.J, indicators.P, 1)
        };
        
        // Overall confidence
        const overallConfidence = Object.values(dimensionConfidences).reduce((sum, conf) => sum + conf, 0) / 4 * 100;
        
        return {
            type,
            confidence: Math.round(overallConfidence),
            dimension_scores: indicators,
            dimension_confidences: dimensionConfidences,
            evidence: behaviorAnalysis.pattern_evidence,
            method: 'behavioral_prediction'
        };
    }
    
    /**
     * Track personality evolution over time
     */
    trackPersonalityEvolution(userId, newAssessment) {
        const existingTracking = this.evolutionTracking.get(userId) || {
            userId,
            baseline_assessment: null,
            evolution_history: [],
            stability_indicators: {},
            change_velocity: 0
        };
        
        // Set baseline if first assessment
        if (!existingTracking.baseline_assessment) {
            existingTracking.baseline_assessment = newAssessment;
        }
        
        // Compare with previous assessment
        const previousAssessment = existingTracking.evolution_history[existingTracking.evolution_history.length - 1] || existingTracking.baseline_assessment;
        
        if (previousAssessment) {
            const changes = this.detectPersonalityChanges(previousAssessment, newAssessment);
            
            existingTracking.evolution_history.push({
                assessment: newAssessment,
                changes: changes,
                timestamp: Date.now()
            });
            
            // Update stability indicators
            existingTracking.stability_indicators = this.calculateStabilityIndicators(existingTracking.evolution_history);
            
            // Calculate change velocity
            existingTracking.change_velocity = this.calculateChangeVelocity(existingTracking.evolution_history);
        }
        
        this.evolutionTracking.set(userId, existingTracking);
        
        return existingTracking;
    }
    
    /**
     * Detect changes between personality assessments
     */
    detectPersonalityChanges(previous, current) {
        const changes = {
            type_change: previous.predicted_type !== current.predicted_type,
            confidence_change: Math.abs(previous.prediction_confidence - current.prediction_confidence),
            dimension_changes: {},
            significant_changes: []
        };
        
        // Compare dimension scores
        Object.entries(current.dimension_scores).forEach(([dimension, score]) => {
            const previousScore = previous.dimension_scores?.[dimension] || 0;
            const change = Math.abs(score - previousScore);
            
            changes.dimension_changes[dimension] = {
                previous: previousScore,
                current: score,
                change: change,
                significant: change > 20 // More than 20 point change is significant
            };
            
            if (change > 20) {
                changes.significant_changes.push({
                    dimension,
                    change,
                    direction: score > previousScore ? 'increase' : 'decrease'
                });
            }
        });
        
        return changes;
    }
    
    /**
     * Calculate stability indicators
     */
    calculateStabilityIndicators(evolutionHistory) {
        if (evolutionHistory.length < 2) {
            return { insufficient_data: true };
        }
        
        const typeChanges = evolutionHistory.filter(h => h.changes.type_change).length;
        const avgConfidenceChange = evolutionHistory.reduce((sum, h) => sum + h.changes.confidence_change, 0) / evolutionHistory.length;
        const significantChanges = evolutionHistory.reduce((sum, h) => sum + h.changes.significant_changes.length, 0);
        
        return {
            type_stability: 1 - (typeChanges / evolutionHistory.length),
            confidence_stability: 1 - (avgConfidenceChange / 100),
            dimension_stability: 1 - (significantChanges / (evolutionHistory.length * 4)),
            overall_stability: (
                (1 - (typeChanges / evolutionHistory.length)) +
                (1 - (avgConfidenceChange / 100)) +
                (1 - (significantChanges / (evolutionHistory.length * 4)))
            ) / 3
        };
    }
    
    /**
     * Calculate change velocity
     */
    calculateChangeVelocity(evolutionHistory) {
        if (evolutionHistory.length < 2) return 0;
        
        const recentChanges = evolutionHistory.slice(-3); // Last 3 assessments
        const totalChanges = recentChanges.reduce((sum, h) => sum + h.changes.significant_changes.length, 0);
        const timeSpan = recentChanges[recentChanges.length - 1].timestamp - recentChanges[0].timestamp;
        
        // Changes per day
        return totalChanges / (timeSpan / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Correlate with cultural frameworks
     */
    correlateCulturalFrameworks(mbtiType) {
        const correlations = {};
        
        // Astrology correlation
        const element = this.getAstrologyElement(mbtiType);
        correlations.astrology = {
            primary_element: element,
            compatible_signs: this.getCompatibleSigns(element),
            element_traits: this.getElementTraits(element)
        };
        
        // Chinese zodiac correlation
        const zodiacTrait = this.getChineseZodiacTrait(mbtiType);
        correlations.chinese_zodiac = {
            primary_trait: zodiacTrait,
            compatible_animals: this.getCompatibleAnimals(zodiacTrait),
            trait_characteristics: this.getTraitCharacteristics(zodiacTrait)
        };
        
        return correlations;
    }
    
    /**
     * Get astrology element for MBTI type
     */
    getAstrologyElement(mbtiType) {
        const elementMap = {
            'NT': 'air',     // Analytical, conceptual
            'NF': 'water',   // Intuitive, emotional
            'ST': 'earth',   // Practical, grounded
            'SF': 'water',   // Caring, empathetic
            'E': 'fire',     // Energetic (modifier)
            'J': 'earth'     // Structured (modifier)
        };
        
        const coreType = mbtiType.substring(1, 3); // Get middle letters
        let element = elementMap[coreType] || 'air';
        
        // Apply modifiers
        if (mbtiType.startsWith('E') && ['NT', 'ST'].includes(coreType)) {
            element = 'fire'; // Extraverted thinking types are fiery
        }
        
        return element;
    }
    
    /**
     * Get Chinese zodiac trait for MBTI type
     */
    getChineseZodiacTrait(mbtiType) {
        const traitMap = {
            'ENTJ': 'leadership',
            'INTJ': 'analytical', 
            'ENFJ': 'nurturing',
            'INFJ': 'independent',
            'ENTP': 'leadership',
            'INTP': 'analytical',
            'ENFP': 'nurturing',
            'INFP': 'independent',
            'ESTJ': 'leadership',
            'ISTJ': 'analytical',
            'ESFJ': 'nurturing',
            'ISFJ': 'nurturing',
            'ESTP': 'leadership',
            'ISTP': 'independent',
            'ESFP': 'nurturing',
            'ISFP': 'independent'
        };
        
        return traitMap[mbtiType] || 'independent';
    }
    
    /**
     * Correlate learning style with MBTI
     */
    correlateLearningStyle(mbtiType) {
        const learningMap = {
            'E': 'auditory',      // Extraverts prefer discussion
            'I': 'reading',       // Introverts prefer written
            'S': 'kinesthetic',   // Sensors prefer hands-on
            'N': 'visual',        // Intuitives prefer concepts/diagrams
            'T': 'reading',       // Thinkers prefer analysis
            'F': 'auditory',      // Feelers prefer interpersonal
            'J': 'reading',       // Judgers prefer structured
            'P': 'kinesthetic'    // Perceivers prefer flexible
        };
        
        const scores = { visual: 0, auditory: 0, kinesthetic: 0, reading: 0 };
        
        // Score each learning style based on MBTI dimensions
        mbtiType.split('').forEach(dimension => {
            const style = learningMap[dimension];
            if (style) {
                scores[style] += 25;
            }
        });
        
        const primaryStyle = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        
        return {
            primary_style: primaryStyle,
            scores,
            confidence: scores[primaryStyle],
            correlation_method: 'mbti_dimension_mapping'
        };
    }
    
    /**
     * Correlate motivational drivers with MBTI
     */
    correlateMotivationalDrivers(mbtiType) {
        const motivationMap = {
            'NT': ['mastery', 'achievement'],
            'NF': ['purpose', 'affiliation'],
            'ST': ['achievement', 'autonomy'],
            'SF': ['affiliation', 'purpose']
        };
        
        const coreType = mbtiType.substring(1, 3);
        const primaryDrivers = motivationMap[coreType] || ['achievement'];
        
        return {
            primary_drivers: primaryDrivers,
            explanation: `${coreType} types typically driven by ${primaryDrivers.join(' and ')}`,
            correlation_strength: 0.8
        };
    }
    
    /**
     * Update personality assessment based on new behavioral data
     */
    updateAdaptiveAssessment(userId, newBehaviorData) {
        const existingPatterns = this.behaviorPatterns.get(userId) || [];
        const updatedPatterns = [...existingPatterns, ...newBehaviorData];
        
        // Re-assess with updated patterns
        const newAssessment = this.assessPersonalityFromBehavior(userId, updatedPatterns);
        
        // Track evolution
        const evolution = this.trackPersonalityEvolution(userId, newAssessment);
        
        this.emit('personalityEvolution', {
            userId,
            newAssessment,
            evolution,
            changes: evolution.evolution_history[evolution.evolution_history.length - 1]?.changes
        });
        
        return {
            assessment: newAssessment,
            evolution,
            recommendations: this.generateEvolutionRecommendations(evolution)
        };
    }
    
    /**
     * Generate recommendations based on personality evolution
     */
    generateEvolutionRecommendations(evolution) {
        const recommendations = [];
        
        const stability = evolution.stability_indicators.overall_stability;
        const changeVelocity = evolution.change_velocity;
        
        if (stability < 0.7) {
            recommendations.push('Personality showing significant evolution - continue monitoring');
            recommendations.push('Consider reassessment more frequently');
        }
        
        if (changeVelocity > 0.5) {
            recommendations.push('Rapid personality changes detected - provide adaptive content');
            recommendations.push('Focus on flexible learning approaches');
        }
        
        if (evolution.evolution_history.length > 5) {
            const recentChanges = evolution.evolution_history.slice(-3);
            const consistentChanges = this.findConsistentChangePatterns(recentChanges);
            
            if (consistentChanges.length > 0) {
                recommendations.push(`Consistent evolution toward: ${consistentChanges.join(', ')}`);
                recommendations.push('Adapt system recommendations to emerging personality traits');
            }
        }
        
        return recommendations;
    }
    
    /**
     * Find consistent change patterns in evolution history
     */
    findConsistentChangePatterns(recentEvolution) {
        const consistentPatterns = [];
        
        // Look for dimensions that consistently change in same direction
        const dimensions = ['E', 'I', 'S', 'N', 'T', 'F', 'J', 'P'];
        
        dimensions.forEach(dimension => {
            const changes = recentEvolution.map(evo => {
                const dimChange = evo.changes.dimension_changes[dimension];
                return dimChange ? dimChange.direction : null;
            }).filter(change => change !== null);
            
            // Check if all changes are in same direction
            if (changes.length >= 2 && changes.every(change => change === changes[0])) {
                consistentPatterns.push(`${dimension} ${changes[0]}`);
            }
        });
        
        return consistentPatterns;
    }
    
    /**
     * Get adaptive assessment summary
     */
    getAdaptiveAssessmentSummary(userId) {
        const patterns = this.behaviorPatterns.get(userId);
        const assessments = Array.from(this.adaptiveAssessments.values()).filter(a => a.user_id === userId);
        const evolution = this.evolutionTracking.get(userId);
        
        if (!assessments.length) {
            return { status: 'no_assessments', message: 'No adaptive assessments found for user' };
        }
        
        const latestAssessment = assessments[assessments.length - 1];
        
        return {
            user_id: userId,
            current_type: latestAssessment.predicted_type,
            confidence: latestAssessment.prediction_confidence,
            assessment_method: 'adaptive_behavioral',
            
            stability: evolution?.stability_indicators?.overall_stability || 0,
            change_velocity: evolution?.change_velocity || 0,
            
            total_assessments: assessments.length,
            behavior_patterns_tracked: patterns?.length || 0,
            
            latest_insights: latestAssessment.evidence.slice(0, 5),
            evolution_recommendations: evolution ? this.generateEvolutionRecommendations(evolution) : [],
            
            cultural_correlations: latestAssessment.cultural_correlations,
            learning_correlations: latestAssessment.learning_style_correlation,
            
            last_updated: latestAssessment.timestamp
        };
    }
    
    /**
     * Utility methods for cultural framework support
     */
    getCompatibleSigns(element) {
        const compatibility = {
            fire: ['aries', 'leo', 'sagittarius'],
            earth: ['taurus', 'virgo', 'capricorn'],
            air: ['gemini', 'libra', 'aquarius'],
            water: ['cancer', 'scorpio', 'pisces']
        };
        return compatibility[element] || [];
    }
    
    getElementTraits(element) {
        const traits = {
            fire: ['energetic', 'passionate', 'confident', 'spontaneous'],
            earth: ['practical', 'reliable', 'patient', 'hardworking'],
            air: ['intellectual', 'communicative', 'social', 'adaptable'],
            water: ['emotional', 'intuitive', 'empathetic', 'sensitive']
        };
        return traits[element] || [];
    }
    
    getCompatibleAnimals(trait) {
        const animals = {
            leadership: ['dragon', 'tiger', 'horse'],
            analytical: ['snake', 'monkey', 'rooster'],
            nurturing: ['rabbit', 'sheep', 'pig'],
            independent: ['rat', 'ox', 'dog']
        };
        return animals[trait] || [];
    }
    
    getTraitCharacteristics(trait) {
        const characteristics = {
            leadership: ['confident', 'decisive', 'charismatic'],
            analytical: ['intelligent', 'observant', 'strategic'],
            nurturing: ['caring', 'gentle', 'supportive'],
            independent: ['self-reliant', 'honest', 'loyal']
        };
        return characteristics[trait] || [];
    }
    
    generateAssessmentId() {
        return `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }
}

// Auto-run if executed directly
if (require.main === module) {
    console.log('🧠 MBTI PERSONALITY CORE SYSTEM');
    console.log('=================================\n');
    
    const mbtiCore = new MBTIPersonalityCore();
    
    // Test personality assessment
    console.log('🎯 Testing personality assessment...\n');
    
    const testBehavior = {
        team_preferences: 'small_team',
        communication_frequency: 'moderate',
        preferred_game_mode: 'co_op',
        leadership_tendency: 'leads_when_needed',
        decision_style: 'intuitive',
        problem_solving: 'creative',
        character_preference: 'experimental',
        evolution_approach: 'novel_combinations',
        conflict_resolution: 'harmony_focused',
        feedback_style: 'supportive_gentle',
        character_interaction: 'collaborative',
        karma_preference: 'forgiving_growth',
        planning_style: 'flexible_adaptive',
        work_style: 'spontaneous_reactive',
        character_development: 'opportunistic_growth',
        system_usage: 'exploratory_varied'
    };
    
    const assessment = mbtiCore.assessPersonality('test_user', testBehavior);
    
    console.log(`🎭 Assessed Type: ${assessment.mbti_type}`);
    console.log(`📊 Confidence: ${assessment.confidence_scores.overall.toFixed(1)}%`);
    console.log(`🎯 Recommended Authority: ${assessment.character_recommendations.kingdom_authority.recommended_level}`);
    console.log(`⚡ Recommended Evolutions: ${assessment.character_recommendations.multi_ring_evolution.recommended_paths.join(', ')}`);
    console.log(`👥 Ideal Team Role: ${assessment.character_recommendations.team_role.ideal_role}`);
    
    // Test compatibility
    console.log('\n🤝 Testing type compatibility...\n');
    const compatibility = mbtiCore.checkCompatibility('INTJ', 'ENFP');
    console.log(`INTJ ↔ ENFP Compatibility: ${compatibility.score}% - ${compatibility.reason}`);
    
    // Test optimal team composition
    console.log('\n👥 Testing optimal team composition...\n');
    const teamTypes = ['INTJ', 'ENFP', 'ISTJ', 'ESFP', 'ENTP', 'ISFJ'];
    const optimalTeam = mbtiCore.getOptimalTeamComposition(teamTypes, 4);
    
    console.log(`🏆 Optimal Team: ${optimalTeam.optimal_team.join(', ')}`);
    console.log(`📊 Team Score: ${optimalTeam.team_score}`);
    console.log(`👥 Role Distribution:`, optimalTeam.role_distribution);
    
    console.log('\n✨ MBTI Personality Core System demo complete!');
}

module.exports = MBTIPersonalityCore;