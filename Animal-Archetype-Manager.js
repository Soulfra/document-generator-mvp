/**
 * Animal Archetype Manager System
 * Manages the 6 animal archetypes (frog, owl, water, goldfish, snake, butterfly) for personality-driven decisions
 * Core system that feeds wisdom into all other components: games, pirates, stories, digital twin
 */

class AnimalArchetypeManager {
    constructor(config = {}) {
        this.userId = config.userId || 'default_user';
        this.enableLearning = config.enableLearning !== false;
        
        // Core 6 animal archetypes with expanded wisdom systems
        this.archetypes = {
            frog: {
                id: 'frog',
                name: 'The Frog',
                specialty: 'confusion_resolution',
                element: 'water',
                wisdom: 'Frogs see things from both water and land - dual perspective clarity',
                personality: {
                    strengths: ['adaptability', 'perspective-shifting', 'patience'],
                    approach: 'dual_perspective',
                    decision_style: 'contemplative_observation',
                    stress_response: 'seek_higher_ground'
                },
                guidance: {
                    when_confused: 'Step back and view from both sides like frog on lily pad',
                    decision_making: 'Consider both underwater and surface perspectives',
                    problem_solving: 'Hop between different viewpoints until clarity emerges',
                    stress_relief: 'Find your lily pad - a safe space to observe from'
                },
                energy_level: 'low_temperature', // Calm, deliberate
                wisdom_triggers: ['confusion', 'complex_decisions', 'perspective_needed']
            },

            owl: {
                id: 'owl',
                name: 'The Owl',
                specialty: 'wisdom_analysis',
                element: 'air',
                wisdom: 'Owls see in the dark and turn heads 270° - comprehensive awareness',
                personality: {
                    strengths: ['night_vision', 'silent_observation', 'pattern_recognition'],
                    approach: 'comprehensive_analysis',
                    decision_style: 'informed_deliberation',
                    stress_response: 'seek_solitude_and_observe'
                },
                guidance: {
                    when_confused: 'Turn your head - look at the problem from all angles',
                    decision_making: 'Gather information first, wisdom comes from seeing the full picture',
                    problem_solving: 'Use night vision - see what others miss in the darkness',
                    stress_relief: 'Find a high perch and observe everything quietly'
                },
                energy_level: 'low_temperature', // Patient, observant
                wisdom_triggers: ['need_insight', 'complex_analysis', 'pattern_detection']
            },

            water: {
                id: 'water',
                name: 'The Water',
                specialty: 'flow_optimization',
                element: 'water',
                wisdom: 'Water always finds the easiest path - effortless adaptation',
                personality: {
                    strengths: ['adaptability', 'persistence', 'finding_paths'],
                    approach: 'path_of_least_resistance',
                    decision_style: 'flow_following',
                    stress_response: 'adapt_and_flow_around'
                },
                guidance: {
                    when_confused: 'Flow around obstacles instead of fighting them',
                    decision_making: 'Choose the path that feels most natural and effortless',
                    problem_solving: 'Find the cracks and flow through them',
                    stress_relief: 'Be like water - adapt to the container but maintain your essence'
                },
                energy_level: 'low_temperature', // Effortless, natural
                wisdom_triggers: ['obstacles', 'resistance', 'need_adaptability']
            },

            goldfish: {
                id: 'goldfish',
                name: 'The Goldfish',
                specialty: 'memory_simplification',
                element: 'water',
                wisdom: 'Goldfish forget complexity - fresh perspective every moment',
                personality: {
                    strengths: ['fresh_perspective', 'simplicity', 'present_moment'],
                    approach: 'simplification',
                    decision_style: 'immediate_clarity',
                    stress_response: 'forget_complexity_focus_now'
                },
                guidance: {
                    when_confused: 'Forget the complexity and focus on what matters now',
                    decision_making: 'Strip away all the noise and choose based on immediate clarity',
                    problem_solving: 'Start fresh as if seeing the problem for the first time',
                    stress_relief: 'Reset your mental state - what matters right now?'
                },
                energy_level: 'low_temperature', // Simple, immediate
                wisdom_triggers: ['overwhelm', 'complexity', 'analysis_paralysis']
            },

            snake: {
                id: 'snake',
                name: 'The Snake',
                specialty: 'transformation_stealth',
                element: 'earth',
                wisdom: 'Snakes shed their skin - complete transformation and renewal',
                personality: {
                    strengths: ['transformation', 'stealth', 'renewal'],
                    approach: 'strategic_transformation',
                    decision_style: 'shed_and_renew',
                    stress_response: 'shed_old_patterns'
                },
                guidance: {
                    when_confused: 'Shed your old assumptions like snake sheds skin',
                    decision_making: 'Move quietly and deliberately toward your goal',
                    problem_solving: 'Transform yourself to match the solution needed',
                    stress_relief: 'Release what no longer serves you completely'
                },
                energy_level: 'low_temperature', // Deliberate, transformative
                wisdom_triggers: ['need_change', 'stuck_patterns', 'transformation']
            },

            butterfly: {
                id: 'butterfly',
                name: 'The Butterfly',
                specialty: 'metamorphosis_beauty',
                element: 'air',
                wisdom: 'Butterflies transform completely - from caterpillar to flying beauty',
                personality: {
                    strengths: ['complete_metamorphosis', 'beauty_creation', 'lightness'],
                    approach: 'radical_transformation',
                    decision_style: 'beautiful_emergence',
                    stress_response: 'embrace_metamorphosis'
                },
                guidance: {
                    when_confused: 'Trust the metamorphosis - you are becoming something beautiful',
                    decision_making: 'Choose the path that allows you to emerge as your best self',
                    problem_solving: 'Transform the entire situation into something beautiful',
                    stress_relief: 'You are in chrysalis - transformation is happening'
                },
                energy_level: 'low_temperature', // Graceful, transformative
                wisdom_triggers: ['major_change', 'personal_growth', 'beauty_creation']
            }
        };

        // User's relationship with each archetype
        this.userArchetypeProfile = {
            dominantArchetype: null,
            secondaryArchetype: null,
            archetype_affinities: new Map(),
            usage_history: new Map(),
            decision_patterns: new Map(),
            stress_responses: new Map()
        };

        // Wisdom application tracking
        this.wisdomApplications = new Map();
        this.decisionHistory = [];
        
        // Integration points with other systems
        this.integrations = {
            frogBrainEngine: null,
            companyGameEngine: null,
            pirateShipBuilder: null,
            storySpawner: null,
            digitalTwin: null
        };

        console.log('🦌 Animal Archetype Manager initialized - 6 archetypes ready for wisdom guidance');
    }

    /**
     * Get wisdom guidance for a specific situation
     * @param {string} situation - The situation needing guidance
     * @param {Object} context - Additional context about the situation
     */
    async getWisdomGuidance(situation, context = {}) {
        console.log(`🎭 Seeking animal wisdom for: ${situation}`);
        
        // Analyze situation to determine which archetype to consult
        const relevantArchetypes = this.analyzeRelevantArchetypes(situation, context);
        
        // Get guidance from primary archetype
        const primaryGuidance = this.consultArchetype(relevantArchetypes[0], situation, context);
        
        // Get supporting wisdom from secondary archetype
        const secondaryGuidance = relevantArchetypes[1] ? 
            this.consultArchetype(relevantArchetypes[1], situation, context) : null;
        
        // Combine wisdom into actionable guidance
        const combinedWisdom = this.combineWisdom(primaryGuidance, secondaryGuidance, situation);
        
        // Track usage for learning
        this.trackWisdomUsage(relevantArchetypes, situation, combinedWisdom);
        
        return combinedWisdom;
    }

    /**
     * Analyze which archetypes are most relevant to a situation
     */
    analyzeRelevantArchetypes(situation, context) {
        const situationLower = situation.toLowerCase();
        const relevanceScores = new Map();

        // Score each archetype based on situation keywords
        for (const [archetypeId, archetype] of Object.entries(this.archetypes)) {
            let score = 0;
            
            // Check wisdom triggers
            for (const trigger of archetype.wisdom_triggers) {
                if (situationLower.includes(trigger.replace('_', ' '))) {
                    score += 3;
                }
            }
            
            // Check situation type mapping
            const situationTypeScore = this.getSituationTypeScore(archetypeId, situationLower);
            score += situationTypeScore;
            
            // Factor in user's historical affinity
            const userAffinity = this.userArchetypeProfile.archetype_affinities.get(archetypeId) || 0;
            score += userAffinity * 0.5;
            
            relevanceScores.set(archetypeId, score);
        }

        // Sort by relevance score
        const sortedArchetypes = Array.from(relevanceScores.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([archetypeId]) => archetypeId);

        return sortedArchetypes.slice(0, 2); // Return top 2 most relevant
    }

    /**
     * Get situation-specific relevance score for archetype
     */
    getSituationTypeScore(archetypeId, situation) {
        const situationMappings = {
            frog: ['confused', 'stuck', 'unclear', 'perspective', 'decision'],
            owl: ['analyze', 'research', 'understand', 'insight', 'complex'],
            water: ['obstacle', 'resistance', 'blocked', 'adapt', 'flow'],
            goldfish: ['overwhelmed', 'complicated', 'simple', 'reset', 'focus'],
            snake: ['change', 'transform', 'stuck', 'pattern', 'stealth'],
            butterfly: ['grow', 'beautiful', 'emerge', 'metamorphosis', 'light']
        };

        const keywords = situationMappings[archetypeId] || [];
        return keywords.filter(keyword => situation.includes(keyword)).length;
    }

    /**
     * Consult a specific archetype for wisdom
     */
    consultArchetype(archetypeId, situation, context) {
        const archetype = this.archetypes[archetypeId];
        if (!archetype) return null;

        // Determine the type of guidance needed
        const guidanceType = this.determineGuidanceType(situation, context);
        
        // Get specific guidance from archetype
        const specificGuidance = archetype.guidance[guidanceType] || archetype.guidance.decision_making;
        
        // Personalize the guidance based on context
        const personalizedGuidance = this.personalizeGuidance(archetype, specificGuidance, situation, context);
        
        return {
            archetype: archetypeId,
            archetypeName: archetype.name,
            wisdom: archetype.wisdom,
            guidance: personalizedGuidance,
            approach: archetype.personality.approach,
            energyLevel: archetype.energy_level,
            elementalNature: archetype.element,
            applicationContext: context
        };
    }

    /**
     * Determine what type of guidance is needed
     */
    determineGuidanceType(situation, context) {
        const situationLower = situation.toLowerCase();
        
        if (situationLower.includes('confused') || situationLower.includes('unclear')) {
            return 'when_confused';
        } else if (situationLower.includes('decide') || situationLower.includes('choose')) {
            return 'decision_making';
        } else if (situationLower.includes('problem') || situationLower.includes('solve')) {
            return 'problem_solving';
        } else if (situationLower.includes('stress') || situationLower.includes('anxiety')) {
            return 'stress_relief';
        }
        
        return 'decision_making'; // Default
    }

    /**
     * Personalize guidance based on user context
     */
    personalizeGuidance(archetype, guidance, situation, context) {
        let personalizedGuidance = guidance;
        
        // Add context-specific elements
        if (context.businessContext) {
            personalizedGuidance += ` In your business context, ${this.addBusinessWisdom(archetype, context)}`;
        }
        
        if (context.pirateContext) {
            personalizedGuidance += ` As a pirate captain, ${this.addPirateWisdom(archetype, context)}`;
        }
        
        if (context.gameContext) {
            personalizedGuidance += ` In your game progression, ${this.addGameWisdom(archetype, context)}`;
        }
        
        return personalizedGuidance;
    }

    /**
     * Add business-specific wisdom
     */
    addBusinessWisdom(archetype, context) {
        const businessWisdom = {
            frog: 'consider both the employee and management perspective before deciding',
            owl: 'gather all stakeholder input and market data before proceeding',
            water: 'find the path that creates least resistance in your organization',
            goldfish: 'focus on the immediate business priority and forget the complexity',
            snake: 'be strategic about timing and shed outdated business practices',
            butterfly: 'transform this challenge into a beautiful opportunity for growth'
        };
        
        return businessWisdom[archetype.id] || 'apply this wisdom to your business decisions';
    }

    /**
     * Add pirate-specific wisdom
     */
    addPirateWisdom(archetype, context) {
        const pirateWisdom = {
            frog: 'view the horizon from both the crow\'s nest and the deck',
            owl: 'study the stars and currents before charting your course',
            water: 'let the tides and winds guide your ship\'s path',
            goldfish: 'focus on the treasure right in front of you',
            snake: 'move silently and strike when the moment is perfect',
            butterfly: 'transform this voyage into a legendary adventure'
        };
        
        return pirateWisdom[archetype.id] || 'navigate these waters with wisdom';
    }

    /**
     * Add game-specific wisdom
     */
    addGameWisdom(archetype, context) {
        const gameWisdom = {
            frog: 'consider both your current level and your long-term character development',
            owl: 'study the skill trees and plan your progression path carefully',
            water: 'level up in areas where you face least resistance and most enjoyment',
            goldfish: 'focus on the immediate quest and don\'t worry about the endgame',
            snake: 'develop stealth skills and shed ineffective strategies',
            butterfly: 'transform your character into something beautiful and unique'
        };
        
        return gameWisdom[archetype.id] || 'level up with this archetype\'s wisdom';
    }

    /**
     * Combine wisdom from multiple archetypes
     */
    combineWisdom(primaryGuidance, secondaryGuidance, situation) {
        const combinedWisdom = {
            situation,
            primary: primaryGuidance,
            secondary: secondaryGuidance,
            
            // Synthesized guidance
            actionGuidance: this.synthesizeActionGuidance(primaryGuidance, secondaryGuidance),
            energyApproach: primaryGuidance.energyLevel, // Always low-temperature
            elementalBalance: this.getElementalBalance(primaryGuidance, secondaryGuidance),
            
            // Decision support
            nextSteps: this.generateNextSteps(primaryGuidance, secondaryGuidance, situation),
            contemplationPrompts: this.generateContemplationPrompts(primaryGuidance, secondaryGuidance),
            
            timestamp: new Date(),
            wisdomId: `wisdom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        return combinedWisdom;
    }

    /**
     * Synthesize actionable guidance from multiple archetypes
     */
    synthesizeActionGuidance(primary, secondary) {
        let synthesis = `Primary wisdom (${primary.archetypeName}): ${primary.guidance}`;
        
        if (secondary) {
            synthesis += `\n\nSupporting wisdom (${secondary.archetypeName}): ${secondary.guidance}`;
            synthesis += `\n\nSynthesis: Combine ${primary.archetype} ${primary.approach} with ${secondary.archetype} ${secondary.approach} for balanced action.`;
        }
        
        return synthesis;
    }

    /**
     * Get elemental balance from archetypes
     */
    getElementalBalance(primary, secondary) {
        const elements = [primary.elementalNature];
        if (secondary) elements.push(secondary.elementalNature);
        
        return {
            dominantElement: primary.elementalNature,
            secondaryElement: secondary?.elementalNature,
            balance: elements.join(' + '),
            energyType: 'low_temperature' // Always maintain low-temperature approach
        };
    }

    /**
     * Generate next steps based on archetype wisdom
     */
    generateNextSteps(primary, secondary, situation) {
        const steps = [];
        
        // Primary archetype step
        steps.push({
            step: 1,
            action: `Apply ${primary.archetypeName} approach: ${primary.approach}`,
            method: primary.guidance,
            energyLevel: 'low_temperature'
        });
        
        // Secondary archetype step if available
        if (secondary) {
            steps.push({
                step: 2,
                action: `Support with ${secondary.archetypeName} perspective: ${secondary.approach}`,
                method: secondary.guidance,
                energyLevel: 'low_temperature'
            });
        }
        
        // Integration step
        steps.push({
            step: steps.length + 1,
            action: 'Integrate wisdom and take calm, deliberate action',
            method: 'Combine archetype wisdom while maintaining low-temperature approach',
            energyLevel: 'low_temperature'
        });
        
        return steps;
    }

    /**
     * Generate contemplation prompts for deeper wisdom
     */
    generateContemplationPrompts(primary, secondary) {
        const prompts = [
            `How would ${primary.archetypeName} see this situation differently?`,
            `What does ${primary.elementalNature} energy teach about this challenge?`,
            `If I embody ${primary.archetype} wisdom, how do I proceed?`
        ];
        
        if (secondary) {
            prompts.push(`How does ${secondary.archetypeName} complement ${primary.archetypeName}'s guidance?`);
            prompts.push(`What emerges when I balance ${primary.elementalNature} and ${secondary.elementalNature}?`);
        }
        
        prompts.push('What would low-temperature wisdom look like in this situation?');
        
        return prompts;
    }

    /**
     * Track wisdom usage for learning
     */
    trackWisdomUsage(archetypes, situation, wisdom) {
        // Update archetype usage history
        for (const archetypeId of archetypes) {
            const currentUsage = this.userArchetypeProfile.usage_history.get(archetypeId) || 0;
            this.userArchetypeProfile.usage_history.set(archetypeId, currentUsage + 1);
        }
        
        // Store wisdom application
        this.wisdomApplications.set(wisdom.wisdomId, {
            archetypes,
            situation,
            wisdom,
            applied: false,
            effectiveness: null,
            feedback: null
        });
        
        // Add to decision history
        this.decisionHistory.push({
            timestamp: new Date(),
            situation,
            archetypes,
            wisdomId: wisdom.wisdomId
        });
        
        // Update dominant archetype if needed
        this.updateDominantArchetype();
    }

    /**
     * Update user's dominant archetype based on usage
     */
    updateDominantArchetype() {
        const usageArray = Array.from(this.userArchetypeProfile.usage_history.entries())
            .sort((a, b) => b[1] - a[1]);
        
        if (usageArray.length > 0) {
            this.userArchetypeProfile.dominantArchetype = usageArray[0][0];
            if (usageArray.length > 1) {
                this.userArchetypeProfile.secondaryArchetype = usageArray[1][0];
            }
        }
    }

    /**
     * Provide feedback on wisdom effectiveness
     */
    async provideFeedback(wisdomId, effectiveness, feedback = '') {
        const application = this.wisdomApplications.get(wisdomId);
        if (!application) return false;
        
        application.applied = true;
        application.effectiveness = effectiveness; // 1-10 scale
        application.feedback = feedback;
        
        // Update archetype affinity based on effectiveness
        for (const archetypeId of application.archetypes) {
            const currentAffinity = this.userArchetypeProfile.archetype_affinities.get(archetypeId) || 0;
            const affinityChange = (effectiveness - 5) * 0.2; // -1 to +1 change
            this.userArchetypeProfile.archetype_affinities.set(archetypeId, currentAffinity + affinityChange);
        }
        
        console.log(`📊 Wisdom feedback recorded: ${effectiveness}/10 effectiveness`);
        return true;
    }

    /**
     * Get personalized archetype recommendations
     */
    getPersonalizedRecommendations() {
        const recommendations = {
            dominantArchetype: this.userArchetypeProfile.dominantArchetype,
            secondaryArchetype: this.userArchetypeProfile.secondaryArchetype,
            
            strengthsToLeverage: this.getArchetypeStrengths(),
            areasForGrowth: this.getArchetypeGrowthAreas(),
            wisdomPatterns: this.analyzeWisdomPatterns(),
            
            nextArchetypeToExplore: this.suggestNextArchetype(),
            personalizedGuidance: this.getPersonalizedGuidance()
        };
        
        return recommendations;
    }

    /**
     * Get user's archetype strengths
     */
    getArchetypeStrengths() {
        const dominant = this.archetypes[this.userArchetypeProfile.dominantArchetype];
        const secondary = this.archetypes[this.userArchetypeProfile.secondaryArchetype];
        
        const strengths = [];
        if (dominant) strengths.push(...dominant.personality.strengths);
        if (secondary) strengths.push(...secondary.personality.strengths);
        
        return [...new Set(strengths)]; // Remove duplicates
    }

    /**
     * Get archetype growth areas
     */
    getArchetypeGrowthAreas() {
        const unusedArchetypes = Object.keys(this.archetypes).filter(archetypeId => 
            !this.userArchetypeProfile.usage_history.has(archetypeId)
        );
        
        return unusedArchetypes.map(archetypeId => ({
            archetype: archetypeId,
            name: this.archetypes[archetypeId].name,
            specialty: this.archetypes[archetypeId].specialty,
            potential: this.archetypes[archetypeId].wisdom
        }));
    }

    /**
     * Analyze user's wisdom patterns
     */
    analyzeWisdomPatterns() {
        const patterns = {
            mostUsedArchetype: this.userArchetypeProfile.dominantArchetype,
            preferredElement: this.getMostUsedElement(),
            decisionStyle: this.getDecisionStyle(),
            wisdomEvolution: this.getWisdomEvolution()
        };
        
        return patterns;
    }

    /**
     * Get most used elemental approach
     */
    getMostUsedElement() {
        const elementUsage = new Map();
        
        for (const [archetypeId, usage] of this.userArchetypeProfile.usage_history) {
            const element = this.archetypes[archetypeId].element;
            elementUsage.set(element, (elementUsage.get(element) || 0) + usage);
        }
        
        return Array.from(elementUsage.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'water';
    }

    /**
     * Analyze user's decision style
     */
    getDecisionStyle() {
        const styles = [];
        
        for (const [archetypeId, usage] of this.userArchetypeProfile.usage_history) {
            const style = this.archetypes[archetypeId].personality.decision_style;
            styles.push({ style, weight: usage });
        }
        
        return styles.sort((a, b) => b.weight - a.weight)[0]?.style || 'contemplative_observation';
    }

    /**
     * Track wisdom evolution over time
     */
    getWisdomEvolution() {
        const recentDecisions = this.decisionHistory.slice(-10);
        const oldDecisions = this.decisionHistory.slice(-20, -10);
        
        const recentArchetypes = recentDecisions.flatMap(d => d.archetypes);
        const oldArchetypes = oldDecisions.flatMap(d => d.archetypes);
        
        return {
            recentTrends: this.countArchetypes(recentArchetypes),
            pastTrends: this.countArchetypes(oldArchetypes),
            evolution: 'becoming_more_wise' // Always evolving toward wisdom
        };
    }

    /**
     * Count archetype usage
     */
    countArchetypes(archetypeList) {
        const counts = new Map();
        for (const archetype of archetypeList) {
            counts.set(archetype, (counts.get(archetype) || 0) + 1);
        }
        return Object.fromEntries(counts);
    }

    /**
     * Suggest next archetype to explore
     */
    suggestNextArchetype() {
        const leastUsed = Array.from(this.userArchetypeProfile.usage_history.entries())
            .sort((a, b) => a[1] - b[1])[0];
        
        const unused = Object.keys(this.archetypes).find(archetypeId => 
            !this.userArchetypeProfile.usage_history.has(archetypeId)
        );
        
        const suggestion = unused || leastUsed?.[0] || 'frog';
        
        return {
            archetype: suggestion,
            name: this.archetypes[suggestion].name,
            reason: unused ? 'unexplored_wisdom' : 'underutilized_strength',
            specialty: this.archetypes[suggestion].specialty,
            guidance: this.archetypes[suggestion].wisdom
        };
    }

    /**
     * Get personalized guidance for user
     */
    getPersonalizedGuidance() {
        const dominant = this.archetypes[this.userArchetypeProfile.dominantArchetype];
        if (!dominant) return 'Explore the animal archetypes to discover your wisdom path';
        
        return `Your dominant archetype is ${dominant.name}. You excel at ${dominant.specialty}. 
                Continue developing this strength while exploring ${this.suggestNextArchetype().name} 
                for balanced wisdom. Remember: always maintain low-temperature energy in all decisions.`;
    }

    /**
     * Connect with other system components
     */
    connectSystems(systems) {
        this.integrations = { ...this.integrations, ...systems };
        
        // Set up cross-system wisdom sharing
        if (this.integrations.frogBrainEngine) {
            this.integrations.frogBrainEngine.setAnimalArchetypeManager(this);
        }
        
        if (this.integrations.digitalTwin) {
            this.integrations.digitalTwin.setArchetypeWisdomSource(this);
        }
        
        console.log('🔗 Animal Archetype Manager connected to ecosystem');
    }

    /**
     * Export user's archetype profile
     */
    exportArchetypeProfile() {
        return {
            userId: this.userId,
            profile: this.userArchetypeProfile,
            wisdomHistory: Array.from(this.wisdomApplications.values()),
            decisionHistory: this.decisionHistory,
            recommendations: this.getPersonalizedRecommendations(),
            exportedAt: new Date().toISOString()
        };
    }
}

// Specialized archetype consultants for different contexts
class ArchetypeSpecialists {
    constructor(archetypeManager) {
        this.manager = archetypeManager;
    }

    /**
     * Business decision specialist
     */
    async getBusinessWisdom(businessSituation, companyContext) {
        return await this.manager.getWisdomGuidance(businessSituation, {
            businessContext: true,
            companyStage: companyContext.stage,
            industry: companyContext.industry,
            teamSize: companyContext.teamSize
        });
    }

    /**
     * Pirate adventure specialist
     */
    async getPirateWisdom(maritimeSituation, shipContext) {
        return await this.manager.getWisdomGuidance(maritimeSituation, {
            pirateContext: true,
            shipType: shipContext.shipType,
            crewSize: shipContext.crewSize,
            treasureObjective: shipContext.treasureObjective
        });
    }

    /**
     * Game progression specialist
     */
    async getGameWisdom(gameSituation, characterContext) {
        return await this.manager.getWisdomGuidance(gameSituation, {
            gameContext: true,
            characterLevel: characterContext.level,
            skillFocus: characterContext.skillFocus,
            questType: characterContext.questType
        });
    }

    /**
     * Story creation specialist
     */
    async getStoryWisdom(narrativeSituation, storyContext) {
        return await this.manager.getWisdomGuidance(narrativeSituation, {
            storyContext: true,
            genre: storyContext.genre,
            character: storyContext.protagonist,
            theme: storyContext.theme
        });
    }
}

module.exports = { AnimalArchetypeManager, ArchetypeSpecialists };

// Example usage
if (require.main === module) {
    async function demonstrateArchetypeManager() {
        console.log('🚀 Animal Archetype Manager Demo\n');
        
        // Initialize manager
        const manager = new AnimalArchetypeManager({
            userId: 'demo_user',
            enableLearning: true
        });
        
        // Demonstrate wisdom guidance for different situations
        console.log('=== Business Decision Scenario ===');
        const businessWisdom = await manager.getWisdomGuidance(
            'I am confused about whether to expand my team or focus on automation',
            { businessContext: true, companyStage: 'growth' }
        );
        console.log('Business Wisdom:');
        console.log(`Primary: ${businessWisdom.primary.archetypeName} - ${businessWisdom.primary.guidance}`);
        if (businessWisdom.secondary) {
            console.log(`Secondary: ${businessWisdom.secondary.archetypeName} - ${businessWisdom.secondary.guidance}`);
        }
        
        console.log('\n=== Pirate Adventure Scenario ===');
        const pirateWisdom = await manager.getWisdomGuidance(
            'There are three islands ahead and I need to choose which one to explore first',
            { pirateContext: true, shipType: 'frigate', treasureObjective: 'legendary_artifact' }
        );
        console.log('Pirate Wisdom:');
        console.log(`Primary: ${pirateWisdom.primary.archetypeName} - ${pirateWisdom.primary.guidance}`);
        
        console.log('\n=== Game Progression Scenario ===');
        const gameWisdom = await manager.getWisdomGuidance(
            'I need to decide which skill tree to focus on next for my character',
            { gameContext: true, characterLevel: 15, skillFocus: 'combat' }
        );
        console.log('Game Wisdom:');
        console.log(`Primary: ${gameWisdom.primary.archetypeName} - ${gameWisdom.primary.guidance}`);
        
        // Provide feedback on wisdom effectiveness
        console.log('\n=== Providing Feedback ===');
        await manager.provideFeedback(businessWisdom.wisdomId, 8, 'Very helpful for clarity');
        await manager.provideFeedback(pirateWisdom.wisdomId, 9, 'Perfect guidance for adventure');
        
        // Get personalized recommendations
        console.log('\n=== Personalized Recommendations ===');
        const recommendations = manager.getPersonalizedRecommendations();
        console.log('Your archetype profile:');
        console.log(`Dominant: ${recommendations.dominantArchetype}`);
        console.log(`Secondary: ${recommendations.secondaryArchetype}`);
        console.log(`Strengths: ${recommendations.strengthsToLeverage.join(', ')}`);
        console.log(`Next to explore: ${recommendations.nextArchetypeToExplore.name}`);
        
        // Demonstrate specialists
        console.log('\n=== Archetype Specialists Demo ===');
        const specialists = new ArchetypeSpecialists(manager);
        
        const businessSpecialistWisdom = await specialists.getBusinessWisdom(
            'Should I pivot our product strategy?',
            { stage: 'startup', industry: 'tech', teamSize: 5 }
        );
        console.log(`Business Specialist: ${businessSpecialistWisdom.primary.archetypeName} wisdom applied`);
        
        console.log('\n🎉 Animal Archetype Manager demo complete!');
        console.log('🌟 All guidance maintains low-temperature energy for stress-free decisions');
    }
    
    demonstrateArchetypeManager();
}