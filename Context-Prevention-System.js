/**
 * Context Prevention System
 * Prevents losing context and maintains focus on the core ecosystem
 * Keeps conversations on-topic: animals → games → pirates → stories → digital twin
 * No "weird shit" - simple, adult, low-temperature decision making
 */

class ContextPreventionSystem {
    constructor(config = {}) {
        this.userId = config.userId || 'default_user';
        this.maxContextDepth = config.maxContextDepth || 5;
        this.topicDriftThreshold = config.topicDriftThreshold || 0.3;
        
        // Core ecosystem topics that should always remain in context
        this.coreEcosystemTopics = [
            'animal_archetypes', 'frog_wisdom', 'owl_wisdom', 'water_flow', 'goldfish_simplicity',
            'snake_transformation', 'butterfly_metamorphosis',
            'runescape_skills', 'habbo_hotel', 'company_game', 'business_progression',
            'pirate_ships', 'pirate_economy', 'fleet_management', 'doubloons',
            'story_generation', 'narrative_spawning', 'goodreads_publishing',
            'digital_twin', 'personality_learning', 'life_parsing',
            'low_temperature', 'simple_adult_decisions', 'stress_elimination',
            'binomial_math', 'jquery_components', 'relationship_engineering'
        ];
        
        // Topics that tend to cause context drift and confusion
        this.driftRiskTopics = [
            'complex_technical_details', 'abstract_philosophy', 'unrelated_features',
            'scope_creep', 'feature_bloat', 'over_engineering', 'premature_optimization',
            'irrelevant_comparisons', 'unnecessary_complexity', 'tangential_discussions'
        ];
        
        // Context tracking
        this.conversationContext = {
            currentTopics: new Set(),
            recentTopics: [],
            focusLevel: 1.0, // 0-1 scale
            driftWarnings: 0,
            lastContextCheck: new Date()
        };
        
        // Integration with ecosystem components
        this.integrations = {
            animalArchetypes: null,
            companyGame: null,
            pirateSystem: null,
            storySpawner: null,
            digitalTwin: null
        };
        
        console.log('🎯 Context Prevention System initialized - Keeping conversations focused and productive');
    }

    /**
     * Analyze if a topic or request is within acceptable context
     * @param {string} input - The topic, request, or conversation input to analyze
     * @param {Object} context - Additional context about the request
     */
    analyzeContextAlignment(input, context = {}) {
        console.log(`🔍 Analyzing context alignment for: "${input.substring(0, 100)}..."`);
        
        const analysis = {
            input: input.substring(0, 200),
            timestamp: new Date(),
            
            // Core analysis
            isOnTopic: this.checkTopicAlignment(input),
            focusScore: this.calculateFocusScore(input),
            simplicityScore: this.calculateSimplicityScore(input),
            temperatureLevel: this.assessTemperatureLevel(input),
            
            // Risk assessment
            driftRisk: this.assessDriftRisk(input),
            complexityRisk: this.assessComplexityRisk(input),
            stressRisk: this.assessStressRisk(input),
            
            // Ecosystem alignment
            ecosystemRelevance: this.checkEcosystemRelevance(input),
            animalWisdomNeeded: this.checkAnimalWisdomNeeded(input),
            
            // Recommendations
            shouldProceed: false,
            redirectionNeeded: false,
            simplificationNeeded: false,
            animalGuidanceRecommended: false
        };
        
        // Determine overall assessment
        this.makeContextDecision(analysis);
        
        // Update conversation tracking
        this.updateConversationContext(analysis);
        
        return analysis;
    }

    /**
     * Check if input aligns with core ecosystem topics
     */
    checkTopicAlignment(input) {
        const inputLower = input.toLowerCase();
        let alignmentScore = 0;
        let matchedTopics = [];
        
        for (const topic of this.coreEcosystemTopics) {
            const topicWords = topic.replace('_', ' ').split(' ');
            let topicMatches = 0;
            
            for (const word of topicWords) {
                if (inputLower.includes(word)) {
                    topicMatches++;
                }
            }
            
            if (topicMatches > 0) {
                const topicScore = topicMatches / topicWords.length;
                alignmentScore += topicScore;
                matchedTopics.push({ topic, score: topicScore });
            }
        }
        
        return {
            score: Math.min(alignmentScore, 1.0),
            matchedTopics: matchedTopics.sort((a, b) => b.score - a.score),
            isAligned: alignmentScore > 0.2
        };
    }

    /**
     * Calculate focus score (higher = more focused)
     */
    calculateFocusScore(input) {
        const inputWords = input.toLowerCase().split(/\s+/);
        let focusKeywords = 0;
        let distractionKeywords = 0;
        
        const focusWords = [
            'focus', 'simple', 'clear', 'direct', 'specific', 'precise',
            'frog', 'owl', 'water', 'goldfish', 'snake', 'butterfly',
            'pirate', 'ship', 'game', 'story', 'twin', 'wisdom'
        ];
        
        const distractionWords = [
            'complicated', 'complex', 'abstract', 'theoretical', 'maybe',
            'various', 'multiple', 'different', 'options', 'possibilities'
        ];
        
        for (const word of inputWords) {
            if (focusWords.includes(word)) focusKeywords++;
            if (distractionWords.includes(word)) distractionKeywords++;
        }
        
        const rawScore = (focusKeywords - distractionKeywords) / Math.max(inputWords.length, 1);
        return Math.max(0, Math.min(1, rawScore + 0.5));
    }

    /**
     * Calculate simplicity score (higher = simpler)
     */
    calculateSimplicityScore(input) {
        const complexityIndicators = {
            longSentences: input.split('.').some(sentence => sentence.split(' ').length > 25),
            technicalJargon: /\b(implementation|architecture|infrastructure|optimization|algorithms)\b/i.test(input),
            multipleConditions: (input.match(/\b(if|when|unless|except|however|although)\b/gi) || []).length > 3,
            abstractConcepts: /\b(paradigm|methodology|framework|abstraction|conceptual)\b/i.test(input),
            multiplePriorities: (input.match(/\b(also|additionally|furthermore|moreover|besides)\b/gi) || []).length > 2
        };
        
        const complexityCount = Object.values(complexityIndicators).filter(Boolean).length;
        return Math.max(0, 1 - (complexityCount * 0.2));
    }

    /**
     * Assess temperature level (low temperature = calm, simple decisions)
     */
    assessTemperatureLevel(input) {
        const highTemperatureWords = [
            'urgent', 'immediately', 'asap', 'critical', 'emergency', 'rush',
            'stress', 'pressure', 'anxiety', 'worry', 'panic', 'overwhelm'
        ];
        
        const lowTemperatureWords = [
            'calm', 'peaceful', 'deliberate', 'thoughtful', 'steady', 'gentle',
            'simple', 'clear', 'easy', 'natural', 'flow', 'wisdom'
        ];
        
        const inputLower = input.toLowerCase();
        let highTempCount = 0;
        let lowTempCount = 0;
        
        for (const word of highTemperatureWords) {
            if (inputLower.includes(word)) highTempCount++;
        }
        
        for (const word of lowTemperatureWords) {
            if (inputLower.includes(word)) lowTempCount++;
        }
        
        return {
            level: lowTempCount > highTempCount ? 'low' : 'high',
            score: Math.max(0, 1 - (highTempCount * 0.2)),
            isLowTemperature: lowTempCount > highTempCount
        };
    }

    /**
     * Assess risk of context drift
     */
    assessDriftRisk(input) {
        const inputLower = input.toLowerCase();
        let riskScore = 0;
        let riskFactors = [];
        
        // Check for drift risk topics
        for (const riskTopic of this.driftRiskTopics) {
            if (inputLower.includes(riskTopic.replace('_', ' '))) {
                riskScore += 0.2;
                riskFactors.push(riskTopic);
            }
        }
        
        // Check for scope expansion indicators
        const scopeExpansionWords = ['also', 'additionally', 'what about', 'we should also', 'maybe we could'];
        for (const phrase of scopeExpansionWords) {
            if (inputLower.includes(phrase)) {
                riskScore += 0.15;
                riskFactors.push('scope_expansion');
            }
        }
        
        // Check for vague language
        const vagueWords = ['maybe', 'perhaps', 'possibly', 'various', 'different', 'multiple'];
        let vagueCount = 0;
        for (const word of vagueWords) {
            if (inputLower.includes(word)) vagueCount++;
        }
        if (vagueCount > 2) {
            riskScore += 0.1;
            riskFactors.push('vague_language');
        }
        
        return {
            score: Math.min(riskScore, 1.0),
            level: riskScore < 0.3 ? 'low' : riskScore < 0.6 ? 'medium' : 'high',
            factors: riskFactors,
            isDriftRisk: riskScore > 0.3
        };
    }

    /**
     * Assess complexity risk
     */
    assessComplexityRisk(input) {
        const inputWords = input.split(/\s+/);
        let complexityFactors = [];
        let riskScore = 0;
        
        // Check sentence length
        const avgSentenceLength = input.split('.').reduce((sum, sentence) => 
            sum + sentence.split(' ').length, 0) / Math.max(input.split('.').length, 1);
        
        if (avgSentenceLength > 20) {
            riskScore += 0.2;
            complexityFactors.push('long_sentences');
        }
        
        // Check for nested concepts
        const nestedIndicators = ['within', 'inside', 'containing', 'including', 'comprised of'];
        for (const indicator of nestedIndicators) {
            if (input.toLowerCase().includes(indicator)) {
                riskScore += 0.1;
                complexityFactors.push('nested_concepts');
                break;
            }
        }
        
        // Check for multiple conditions
        const conditionWords = (input.match(/\b(if|when|unless|except|provided|assuming)\b/gi) || []).length;
        if (conditionWords > 2) {
            riskScore += 0.15;
            complexityFactors.push('multiple_conditions');
        }
        
        return {
            score: Math.min(riskScore, 1.0),
            level: riskScore < 0.2 ? 'low' : riskScore < 0.5 ? 'medium' : 'high',
            factors: complexityFactors,
            isComplexityRisk: riskScore > 0.3
        };
    }

    /**
     * Assess stress risk (anti-low-temperature)
     */
    assessStressRisk(input) {
        const stressIndicators = [
            'urgent', 'deadline', 'pressure', 'stress', 'overwhelm', 'panic',
            'immediately', 'asap', 'critical', 'emergency', 'rush', 'hurry'
        ];
        
        const calmIndicators = [
            'calm', 'peaceful', 'gentle', 'steady', 'patient', 'deliberate',
            'natural', 'flow', 'easy', 'simple', 'clear', 'wisdom'
        ];
        
        const inputLower = input.toLowerCase();
        let stressCount = 0;
        let calmCount = 0;
        
        for (const word of stressIndicators) {
            if (inputLower.includes(word)) stressCount++;
        }
        
        for (const word of calmIndicators) {
            if (inputLower.includes(word)) calmCount++;
        }
        
        const stressRatio = stressCount / Math.max(calmCount + stressCount, 1);
        
        return {
            score: stressRatio,
            level: stressRatio < 0.2 ? 'low' : stressRatio < 0.5 ? 'medium' : 'high',
            stressWords: stressCount,
            calmWords: calmCount,
            isStressRisk: stressRatio > 0.3
        };
    }

    /**
     * Check ecosystem relevance
     */
    checkEcosystemRelevance(input) {
        const ecosystemComponents = {
            animals: ['frog', 'owl', 'water', 'goldfish', 'snake', 'butterfly', 'archetype', 'wisdom'],
            games: ['runescape', 'habbo', 'skills', 'level', 'quest', 'progression', 'character'],
            pirates: ['ship', 'pirate', 'captain', 'crew', 'doubloon', 'treasure', 'voyage', 'fleet'],
            stories: ['story', 'narrative', 'chapter', 'plot', 'character', 'goodreads', 'publish'],
            digitalTwin: ['twin', 'learning', 'personality', 'parse', 'analyze', 'insight', 'behavior']
        };
        
        const inputLower = input.toLowerCase();
        const relevance = {};
        let totalRelevance = 0;
        
        for (const [component, keywords] of Object.entries(ecosystemComponents)) {
            let componentScore = 0;
            for (const keyword of keywords) {
                if (inputLower.includes(keyword)) {
                    componentScore += 1;
                }
            }
            relevance[component] = componentScore / keywords.length;
            totalRelevance += relevance[component];
        }
        
        return {
            overall: Math.min(totalRelevance, 1.0),
            byComponent: relevance,
            strongestComponent: Object.entries(relevance).sort((a, b) => b[1] - a[1])[0],
            isEcosystemRelevant: totalRelevance > 0.2
        };
    }

    /**
     * Check if animal wisdom is needed
     */
    checkAnimalWisdomNeeded(input) {
        const wisdomTriggers = [
            'confused', 'unclear', 'stuck', 'decision', 'choice', 'help',
            'guidance', 'advice', 'wisdom', 'perspective', 'approach'
        ];
        
        const inputLower = input.toLowerCase();
        let wisdomNeeded = false;
        let triggers = [];
        
        for (const trigger of wisdomTriggers) {
            if (inputLower.includes(trigger)) {
                wisdomNeeded = true;
                triggers.push(trigger);
            }
        }
        
        return {
            needed: wisdomNeeded,
            triggers,
            suggestedArchetype: this.suggestArchetypeForSituation(input)
        };
    }

    /**
     * Suggest which archetype would be most helpful
     */
    suggestArchetypeForSituation(input) {
        const inputLower = input.toLowerCase();
        
        if (inputLower.includes('confused') || inputLower.includes('unclear')) {
            return 'frog'; // Confusion resolution
        } else if (inputLower.includes('complex') || inputLower.includes('analyze')) {
            return 'owl'; // Wisdom analysis
        } else if (inputLower.includes('obstacle') || inputLower.includes('blocked')) {
            return 'water'; // Flow optimization
        } else if (inputLower.includes('overwhelm') || inputLower.includes('complicated')) {
            return 'goldfish'; // Memory simplification
        } else if (inputLower.includes('change') || inputLower.includes('transform')) {
            return 'snake'; // Transformation stealth
        } else if (inputLower.includes('beautiful') || inputLower.includes('growth')) {
            return 'butterfly'; // Metamorphosis beauty
        }
        
        return 'frog'; // Default to frog for general confusion
    }

    /**
     * Make context decision based on analysis
     */
    makeContextDecision(analysis) {
        // Should proceed if aligned, focused, simple, and low temperature
        analysis.shouldProceed = 
            analysis.isOnTopic.isAligned &&
            analysis.focusScore > 0.5 &&
            analysis.simplicityScore > 0.5 &&
            analysis.temperatureLevel.isLowTemperature &&
            analysis.driftRisk.level !== 'high';
        
        // Need redirection if off-topic or high drift risk
        analysis.redirectionNeeded = 
            !analysis.isOnTopic.isAligned ||
            analysis.driftRisk.level === 'high' ||
            !analysis.ecosystemRelevance.isEcosystemRelevant;
        
        // Need simplification if too complex or high stress
        analysis.simplificationNeeded = 
            analysis.simplicityScore < 0.5 ||
            analysis.complexityRisk.level === 'high' ||
            analysis.stressRisk.level === 'high';
        
        // Recommend animal guidance if wisdom is needed
        analysis.animalGuidanceRecommended = 
            analysis.animalWisdomNeeded.needed ||
            analysis.temperatureLevel.level === 'high' ||
            analysis.simplicityScore < 0.3;
    }

    /**
     * Update conversation context tracking
     */
    updateConversationContext(analysis) {
        // Add matched topics to current context
        if (analysis.isOnTopic.matchedTopics.length > 0) {
            for (const match of analysis.isOnTopic.matchedTopics) {
                this.conversationContext.currentTopics.add(match.topic);
            }
        }
        
        // Update recent topics
        this.conversationContext.recentTopics.push({
            timestamp: new Date(),
            topics: analysis.isOnTopic.matchedTopics.map(m => m.topic),
            focusScore: analysis.focusScore,
            onTopic: analysis.isOnTopic.isAligned
        });
        
        // Keep only recent topics (last 10)
        if (this.conversationContext.recentTopics.length > 10) {
            this.conversationContext.recentTopics = this.conversationContext.recentTopics.slice(-10);
        }
        
        // Update focus level
        const recentFocusScores = this.conversationContext.recentTopics.map(t => t.focusScore);
        this.conversationContext.focusLevel = recentFocusScores.reduce((sum, score) => sum + score, 0) / 
            Math.max(recentFocusScores.length, 1);
        
        // Track drift warnings
        if (analysis.driftRisk.isDriftRisk) {
            this.conversationContext.driftWarnings++;
        }
        
        this.conversationContext.lastContextCheck = new Date();
    }

    /**
     * Generate context guidance for staying on track
     */
    generateContextGuidance(analysis) {
        const guidance = {
            status: analysis.shouldProceed ? 'proceed' : 'redirect',
            message: '',
            actionSteps: [],
            animalWisdom: null,
            ecosystemAlignment: analysis.ecosystemRelevance.strongestComponent
        };
        
        if (analysis.shouldProceed) {
            guidance.message = 'Great! This aligns well with our ecosystem. Let\'s proceed with low-temperature wisdom.';
            guidance.actionSteps.push('Continue with the current focus');
            guidance.actionSteps.push('Apply relevant animal archetype wisdom');
            guidance.actionSteps.push('Maintain simple, adult decision-making');
            
        } else if (analysis.redirectionNeeded) {
            guidance.message = 'Let\'s redirect this back to our core ecosystem: animals → games → pirates → stories → digital twin.';
            guidance.actionSteps.push('Identify which ecosystem component this relates to');
            guidance.actionSteps.push('Frame the request within that component');
            guidance.actionSteps.push('Apply appropriate animal wisdom');
            
        } else if (analysis.simplificationNeeded) {
            guidance.message = 'Let\'s simplify this to maintain low-temperature decision making.';
            guidance.actionSteps.push('Break down into simple yes/no decisions');
            guidance.actionSteps.push('Focus on immediate next step only');
            guidance.actionSteps.push('Eliminate complexity and stress');
        }
        
        // Add animal wisdom if recommended
        if (analysis.animalGuidanceRecommended) {
            const suggestedArchetype = analysis.animalWisdomNeeded.suggestedArchetype;
            guidance.animalWisdom = {
                archetype: suggestedArchetype,
                reason: `${suggestedArchetype} wisdom would help with this situation`,
                guidance: `Consult the ${suggestedArchetype} archetype for low-temperature guidance`
            };
        }
        
        return guidance;
    }

    /**
     * Prevent context loss during system integration
     */
    maintainIntegrationContext(componentName, operation, data) {
        console.log(`🔗 Maintaining context during ${componentName} ${operation}`);
        
        const contextData = {
            component: componentName,
            operation,
            timestamp: new Date(),
            ecosystemPosition: this.getEcosystemPosition(componentName),
            contextPreservation: {
                currentTopics: Array.from(this.conversationContext.currentTopics),
                focusLevel: this.conversationContext.focusLevel,
                temperatureLevel: 'low' // Always maintain low temperature
            }
        };
        
        // Ensure operation aligns with ecosystem flow
        const alignmentCheck = this.checkOperationAlignment(componentName, operation);
        
        if (!alignmentCheck.isAligned) {
            console.warn(`⚠️ Operation ${operation} on ${componentName} may cause context drift`);
            return this.redirectToEcosystemFlow(componentName, operation, alignmentCheck);
        }
        
        return contextData;
    }

    /**
     * Get component's position in ecosystem flow
     */
    getEcosystemPosition(componentName) {
        const ecosystemFlow = {
            'animal-archetypes': { position: 1, flows_to: ['games', 'pirates', 'stories'] },
            'company-game': { position: 2, flows_to: ['pirates', 'stories'] },
            'pirate-system': { position: 3, flows_to: ['stories'] },
            'story-spawner': { position: 4, flows_to: ['digital-twin'] },
            'digital-twin': { position: 5, flows_to: ['animal-archetypes'] } // Circular learning
        };
        
        return ecosystemFlow[componentName] || { position: 0, flows_to: [] };
    }

    /**
     * Check if operation aligns with ecosystem flow
     */
    checkOperationAlignment(componentName, operation) {
        const allowedOperations = {
            'animal-archetypes': ['get_wisdom', 'consult_archetype', 'provide_guidance'],
            'company-game': ['level_skill', 'complete_quest', 'upgrade_office'],
            'pirate-system': ['build_ship', 'manage_fleet', 'trade_doubloons'],
            'story-spawner': ['generate_story', 'publish_narrative', 'extract_insights'],
            'digital-twin': ['learn_from_story', 'analyze_personality', 'predict_behavior']
        };
        
        const allowed = allowedOperations[componentName] || [];
        const isAligned = allowed.some(allowedOp => operation.includes(allowedOp));
        
        return {
            isAligned,
            allowedOperations: allowed,
            suggestion: isAligned ? 'proceed' : 'redirect_to_allowed_operation'
        };
    }

    /**
     * Redirect to ecosystem flow if needed
     */
    redirectToEcosystemFlow(componentName, operation, alignmentCheck) {
        console.log(`🔄 Redirecting ${componentName} operation to ecosystem flow`);
        
        return {
            redirect: true,
            originalComponent: componentName,
            originalOperation: operation,
            suggestedComponent: this.suggestAlternativeComponent(operation),
            suggestedOperation: alignmentCheck.allowedOperations[0],
            contextPreservation: 'redirect_maintains_low_temperature_flow'
        };
    }

    /**
     * Suggest alternative component for operation
     */
    suggestAlternativeComponent(operation) {
        const operationMappings = {
            'analyze': 'animal-archetypes', // Owl wisdom
            'decide': 'animal-archetypes',  // Frog wisdom
            'build': 'pirate-system',       // Ship building
            'learn': 'digital-twin',        // Learning system
            'create': 'story-spawner',      // Story creation
            'progress': 'company-game'      // Skill progression
        };
        
        for (const [keyword, component] of Object.entries(operationMappings)) {
            if (operation.toLowerCase().includes(keyword)) {
                return component;
            }
        }
        
        return 'animal-archetypes'; // Default to wisdom guidance
    }

    /**
     * Get context health report
     */
    getContextHealthReport() {
        const health = {
            overallHealth: this.calculateOverallContextHealth(),
            focusLevel: this.conversationContext.focusLevel,
            driftWarnings: this.conversationContext.driftWarnings,
            ecosystemAlignment: this.calculateEcosystemAlignment(),
            temperatureLevel: 'low', // Always maintain low temperature
            
            recommendations: [],
            strengths: [],
            concerns: []
        };
        
        // Generate recommendations
        if (health.focusLevel < 0.5) {
            health.recommendations.push('Increase focus by staying within ecosystem topics');
            health.concerns.push('Low focus level detected');
        } else {
            health.strengths.push('Good focus maintenance');
        }
        
        if (health.driftWarnings > 3) {
            health.recommendations.push('Apply animal archetype wisdom to reduce drift');
            health.concerns.push('Multiple context drift warnings');
        } else {
            health.strengths.push('Context drift well controlled');
        }
        
        if (health.ecosystemAlignment > 0.7) {
            health.strengths.push('Strong ecosystem alignment');
        } else {
            health.recommendations.push('Return to core ecosystem components');
            health.concerns.push('Weak ecosystem alignment');
        }
        
        return health;
    }

    /**
     * Calculate overall context health
     */
    calculateOverallContextHealth() {
        const focusWeight = 0.3;
        const alignmentWeight = 0.4;
        const driftWeight = 0.3;
        
        const focusScore = this.conversationContext.focusLevel;
        const alignmentScore = this.calculateEcosystemAlignment();
        const driftScore = Math.max(0, 1 - (this.conversationContext.driftWarnings * 0.1));
        
        return (focusScore * focusWeight) + 
               (alignmentScore * alignmentWeight) + 
               (driftScore * driftWeight);
    }

    /**
     * Calculate ecosystem alignment score
     */
    calculateEcosystemAlignment() {
        const recentTopics = this.conversationContext.recentTopics.slice(-5);
        if (recentTopics.length === 0) return 1.0;
        
        const alignedTopics = recentTopics.filter(topic => topic.onTopic).length;
        return alignedTopics / recentTopics.length;
    }

    /**
     * Connect with other ecosystem components
     */
    connectSystems(systems) {
        this.integrations = { ...this.integrations, ...systems };
        console.log('🔗 Context Prevention System connected to ecosystem');
        
        // Set up context monitoring for each system
        for (const [systemName, system] of Object.entries(systems)) {
            if (system && typeof system.on === 'function') {
                system.on('operation', (operation, data) => {
                    this.maintainIntegrationContext(systemName, operation, data);
                });
            }
        }
    }
}

module.exports = { ContextPreventionSystem };

// Example usage
if (require.main === module) {
    async function demonstrateContextPrevention() {
        console.log('🚀 Context Prevention System Demo\n');
        
        // Initialize system
        const contextPrevention = new ContextPreventionSystem({
            userId: 'demo_user',
            maxContextDepth: 5,
            topicDriftThreshold: 0.3
        });
        
        // Test scenarios
        const testInputs = [
            // Good: On-topic, simple, low-temperature
            'I need frog wisdom to help me decide which pirate ship to build for my company game progression',
            
            // Bad: Off-topic, complex
            'Can you help me implement a complex distributed microservices architecture with advanced caching strategies and multiple database optimization techniques?',
            
            // Medium: On-topic but high-stress
            'I urgently need to immediately optimize all my RuneScape skills and build 10 pirate ships right now!',
            
            // Good: Ecosystem relevant, simple
            'The goldfish archetype suggests I should focus on simple story generation for my digital twin learning',
            
            // Bad: Context drift
            'What about adding blockchain integration and AI-powered analytics to track user engagement across multiple social media platforms?'
        ];
        
        for (let i = 0; i < testInputs.length; i++) {
            console.log(`\n=== Test ${i + 1} ===`);
            console.log(`Input: "${testInputs[i].substring(0, 80)}..."`);
            
            const analysis = contextPrevention.analyzeContextAlignment(testInputs[i]);
            
            console.log(`Focus Score: ${analysis.focusScore.toFixed(2)}`);
            console.log(`Simplicity Score: ${analysis.simplicityScore.toFixed(2)}`);
            console.log(`Temperature Level: ${analysis.temperatureLevel.level}`);
            console.log(`Drift Risk: ${analysis.driftRisk.level}`);
            console.log(`Should Proceed: ${analysis.shouldProceed ? '✅' : '❌'}`);
            
            if (analysis.animalWisdomNeeded.needed) {
                console.log(`🐸 Suggested Archetype: ${analysis.animalWisdomNeeded.suggestedArchetype}`);
            }
            
            const guidance = contextPrevention.generateContextGuidance(analysis);
            console.log(`Guidance: ${guidance.message}`);
            
            if (guidance.actionSteps.length > 0) {
                console.log(`Action Steps: ${guidance.actionSteps.join(', ')}`);
            }
        }
        
        // Context health report
        console.log('\n=== Context Health Report ===');
        const healthReport = contextPrevention.getContextHealthReport();
        console.log(`Overall Health: ${(healthReport.overallHealth * 100).toFixed(1)}%`);
        console.log(`Focus Level: ${(healthReport.focusLevel * 100).toFixed(1)}%`);
        console.log(`Drift Warnings: ${healthReport.driftWarnings}`);
        console.log(`Strengths: ${healthReport.strengths.join(', ')}`);
        if (healthReport.concerns.length > 0) {
            console.log(`Concerns: ${healthReport.concerns.join(', ')}`);
        }
        if (healthReport.recommendations.length > 0) {
            console.log(`Recommendations: ${healthReport.recommendations.join(', ')}`);
        }
        
        console.log('\n🎉 Context Prevention System demo complete!');
        console.log('🌟 System maintains low-temperature focus on ecosystem flow');
    }
    
    demonstrateContextPrevention();
}