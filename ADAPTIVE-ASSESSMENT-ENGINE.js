#!/usr/bin/env node

/**
 * 🧠 ADAPTIVE ASSESSMENT ENGINE
 * Ring 1 system - Transforms static MBTI into dynamic behavioral analysis
 * Analyzes how users solve problems in the chapter system to build personality profiles
 */

const EventEmitter = require('events');
const FiveAPIConsultationEngine = require('./5-api-consultation-engine.js');
const ChapterProgressionSystem = require('./chapter-system.js');
const MBTIPersonalityCore = require('./MBTI-PERSONALITY-CORE.js');

class AdaptiveAssessmentEngine extends EventEmitter {
    constructor() {
        super();
        
        // Ring 0 dependencies
        this.mbtiCore = new MBTIPersonalityCore();
        this.consultationEngine = new FiveAPIConsultationEngine();
        this.chapterSystem = new ChapterProgressionSystem();
        
        // Problem-solving style tracking
        this.problemSolvingStyles = {
            analytical: {
                patterns: ['reads_all_objectives', 'systematic_approach', 'detailed_planning'],
                indicators: ['thorough_exploration', 'step_by_step', 'validation_focused'],
                mbti_correlation: ['NT', 'TJ']
            },
            intuitive: {
                patterns: ['skips_to_solution', 'pattern_recognition', 'big_picture_first'],
                indicators: ['quick_insights', 'connects_concepts', 'sees_relationships'],
                mbti_correlation: ['NF', 'NP']
            },
            hands_on: {
                patterns: ['tries_immediately', 'learns_by_doing', 'iterative_testing'],
                indicators: ['immediate_action', 'trial_and_error', 'practical_focus'],
                mbti_correlation: ['SP', 'SE']
            },
            collaborative: {
                patterns: ['seeks_feedback', 'discusses_options', 'builds_consensus'],
                indicators: ['people_focused', 'communication_heavy', 'team_oriented'],
                mbti_correlation: ['FE', 'EF']
            },
            methodical: {
                patterns: ['follows_instructions', 'linear_progression', 'rule_adherent'],
                indicators: ['structured_approach', 'careful_execution', 'process_oriented'],
                mbti_correlation: ['SJ', 'SI']
            }
        };
        
        // Cultural personality frameworks
        this.culturalFrameworks = {
            astrology: {
                fire: ['aries', 'leo', 'sagittarius'],
                earth: ['taurus', 'virgo', 'capricorn'],
                air: ['gemini', 'libra', 'aquarius'],
                water: ['cancer', 'scorpio', 'pisces']
            },
            chinese_zodiac: {
                leadership: ['dragon', 'tiger', 'horse'],
                analytical: ['snake', 'monkey', 'rooster'],
                nurturing: ['rabbit', 'sheep', 'pig'],
                independent: ['rat', 'ox', 'dog']
            },
            norse_mythology: {
                warrior: ['thor', 'tyr', 'vidar'],
                wisdom: ['odin', 'mimir', 'saga'],
                nature: ['freyr', 'jord', 'sif'],
                transformation: ['loki', 'hela', 'fenrir']
            },
            greek_mythology: {
                strategy: ['athena', 'apollo', 'hermes'],
                power: ['zeus', 'ares', 'poseidon'],
                creativity: ['dionysus', 'aphrodite', 'artemis'],
                depth: ['hades', 'persephone', 'hecate']
            }
        };
        
        // Learning style vectors
        this.learningVectors = {
            sensory: {
                visual: 'learns through seeing and visualizing',
                auditory: 'learns through hearing and discussing',
                kinesthetic: 'learns through touching and doing',
                reading: 'learns through reading and writing'
            },
            processing: {
                sequential: 'prefers step-by-step linear progression',
                global: 'needs big picture before details',
                active: 'learns by trying and experimenting',
                reflective: 'learns by thinking and contemplating'
            },
            understanding: {
                sensing: 'prefers concrete facts and examples',
                intuitive: 'prefers concepts and theories',
                inductive: 'prefers examples leading to principles',
                deductive: 'prefers principles leading to examples'
            }
        };
        
        // User behavior tracking
        this.userSessions = new Map();
        this.personalityProfiles = new Map();
        
        console.log('🧠 Adaptive Assessment Engine initialized');
        console.log('📊 Tracking problem-solving styles, cultural frameworks, and learning vectors');
    }
    
    /**
     * Start adaptive assessment session for a user
     */
    async startAssessmentSession(userId, options = {}) {
        const sessionId = this.generateSessionId();
        
        const session = {
            id: sessionId,
            userId,
            startTime: Date.now(),
            chapterProgress: {},
            behaviorData: {},
            problemSolvingPatterns: [],
            learningStyleData: {},
            culturalAffinities: {},
            currentChapter: 1,
            interactionHistory: [],
            adaptiveInsights: []
        };
        
        this.userSessions.set(sessionId, session);
        
        console.log(`🎯 Started adaptive assessment session: ${sessionId}`);
        console.log(`👤 User: ${userId}`);
        
        // Set up chapter system event listeners for this session
        this.setupChapterEventListeners(sessionId);
        
        return session;
    }
    
    /**
     * Track user interaction with chapter system
     */
    async trackChapterInteraction(sessionId, interaction) {
        const session = this.userSessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        // Record the interaction
        session.interactionHistory.push({
            timestamp: Date.now(),
            chapter: interaction.chapter,
            type: interaction.type,
            action: interaction.action,
            timeToAction: interaction.timeToAction,
            approach: interaction.approach
        });
        
        // Analyze problem-solving style from this interaction
        const styleIndicators = this.analyzeProblemSolvingStyle(interaction);
        session.problemSolvingPatterns.push(...styleIndicators);
        
        // Update learning style data
        this.updateLearningStyleData(session, interaction);
        
        // Detect cultural affinities from behavior
        this.updateCulturalAffinities(session, interaction);
        
        // Generate adaptive insights using 5-API consultation
        if (session.interactionHistory.length % 3 === 0) { // Every 3 interactions
            const insight = await this.generateAdaptiveInsight(session);
            session.adaptiveInsights.push(insight);
        }
        
        // Update personality profile in real-time
        await this.updatePersonalityProfile(session);
        
        this.emit('interactionTracked', {
            sessionId,
            interaction,
            currentProfile: this.getSessionProfile(sessionId)
        });
        
        return session;
    }
    
    /**
     * Analyze problem-solving style from interaction
     */
    analyzeProblemSolvingStyle(interaction) {
        const indicators = [];
        
        // Time-based analysis
        if (interaction.timeToAction < 5000) { // Less than 5 seconds
            indicators.push('quick_decision_maker');
            indicators.push('intuitive_approach');
        } else if (interaction.timeToAction > 30000) { // More than 30 seconds
            indicators.push('deliberate_thinker');
            indicators.push('analytical_approach');
        }
        
        // Action-based analysis
        switch (interaction.type) {
            case 'flash_test':
                if (interaction.approach === 'immediate') {
                    indicators.push('hands_on_learner');
                } else {
                    indicators.push('methodical_explorer');
                }
                break;
                
            case 'integration_simulator':
                indicators.push('systematic_thinker');
                indicators.push('process_oriented');
                break;
                
            case 'lightning_strike':
                indicators.push('action_oriented');
                indicators.push('completion_focused');
                break;
                
            case 'system_inventory':
                indicators.push('detail_oriented');
                indicators.push('comprehensive_approach');
                break;
        }
        
        // Chapter progression analysis
        if (interaction.chapter > 1) {
            if (interaction.action === 'skipped_prerequisites') {
                indicators.push('big_picture_first');
                indicators.push('impatient_with_details');
            } else if (interaction.action === 'reviewed_previous') {
                indicators.push('sequential_learner');
                indicators.push('builds_on_foundation');
            }
        }
        
        return indicators.map(indicator => ({
            type: indicator,
            chapter: interaction.chapter,
            confidence: this.calculateIndicatorConfidence(indicator, interaction),
            timestamp: Date.now()
        }));
    }
    
    /**
     * Update learning style data based on interactions
     */
    updateLearningStyleData(session, interaction) {
        // Sensory preferences
        if (interaction.type === 'flash_test' || interaction.action.includes('visual')) {
            session.learningStyleData.visual = (session.learningStyleData.visual || 0) + 1;
        }
        
        if (interaction.type === 'integration_simulator') {
            session.learningStyleData.kinesthetic = (session.learningStyleData.kinesthetic || 0) + 1;
        }
        
        // Processing preferences
        if (interaction.approach === 'sequential') {
            session.learningStyleData.sequential = (session.learningStyleData.sequential || 0) + 1;
        } else if (interaction.approach === 'random_access') {
            session.learningStyleData.global = (session.learningStyleData.global || 0) + 1;
        }
        
        // Understanding preferences
        if (interaction.action.includes('example') || interaction.action.includes('concrete')) {
            session.learningStyleData.sensing = (session.learningStyleData.sensing || 0) + 1;
        } else if (interaction.action.includes('theory') || interaction.action.includes('concept')) {
            session.learningStyleData.intuitive = (session.learningStyleData.intuitive || 0) + 1;
        }
    }
    
    /**
     * Update cultural affinities based on behavior patterns
     */
    updateCulturalAffinities(session, interaction) {
        // Astrology element affinities
        if (interaction.approach === 'aggressive' || interaction.timeToAction < 3000) {
            session.culturalAffinities.fire = (session.culturalAffinities.fire || 0) + 1;
        } else if (interaction.approach === 'methodical' || interaction.action.includes('careful')) {
            session.culturalAffinities.earth = (session.culturalAffinities.earth || 0) + 1;
        } else if (interaction.approach === 'communicative' || interaction.action.includes('discuss')) {
            session.culturalAffinities.air = (session.culturalAffinities.air || 0) + 1;
        } else if (interaction.approach === 'intuitive' || interaction.action.includes('feel')) {
            session.culturalAffinities.water = (session.culturalAffinities.water || 0) + 1;
        }
        
        // Chinese zodiac traits
        if (interaction.type === 'lightning_strike' || interaction.action.includes('lead')) {
            session.culturalAffinities.leadership = (session.culturalAffinities.leadership || 0) + 1;
        } else if (interaction.approach === 'analytical') {
            session.culturalAffinities.analytical = (session.culturalAffinities.analytical || 0) + 1;
        }
    }
    
    /**
     * Generate adaptive insight using 5-API consultation
     */
    async generateAdaptiveInsight(session) {
        console.log(`🔍 Generating adaptive insight for session ${session.id}...`);
        
        const behaviorSummary = this.createBehaviorSummary(session);
        
        const consultation = await this.consultationEngine.consult(
            `Analyze this user's learning behavior and provide personality insights:
            
            ${behaviorSummary}
            
            Based on this behavior, what MBTI type best fits? What learning adaptations should we make? What cultural personality frameworks align with their style?`,
            'personality_analysis',
            { maxTokens: 400 }
        );
        
        return {
            timestamp: Date.now(),
            behaviorSummary,
            aiInsights: consultation.synthesis.weightedSynthesis,
            recommendations: consultation.synthesis.recommendations,
            confidence: consultation.synthesis.confidence,
            cost: consultation.totalCost
        };
    }
    
    /**
     * Create behavior summary for AI analysis
     */
    createBehaviorSummary(session) {
        const interactions = session.interactionHistory;
        const patterns = session.problemSolvingPatterns;
        
        let summary = `User Behavior Summary:\n`;
        summary += `- Total interactions: ${interactions.length}\n`;
        summary += `- Average time to action: ${this.calculateAverageTimeToAction(interactions)}ms\n`;
        summary += `- Chapter progression: ${session.currentChapter}/6\n\n`;
        
        summary += `Problem-solving patterns detected:\n`;
        const patternCounts = this.countPatterns(patterns);
        Object.entries(patternCounts).forEach(([pattern, count]) => {
            summary += `- ${pattern}: ${count} times\n`;
        });
        
        summary += `\nLearning style indicators:\n`;
        Object.entries(session.learningStyleData).forEach(([style, score]) => {
            summary += `- ${style}: ${score}\n`;
        });
        
        summary += `\nCultural affinities:\n`;
        Object.entries(session.culturalAffinities).forEach(([trait, score]) => {
            summary += `- ${trait}: ${score}\n`;
        });
        
        return summary;
    }
    
    /**
     * Update personality profile in real-time
     */
    async updatePersonalityProfile(session) {
        const profile = this.personalityProfiles.get(session.userId) || {
            userId: session.userId,
            mbti_type: 'unknown',
            confidence: 0,
            learning_style: {},
            problem_solving_style: {},
            cultural_alignment: {},
            adaptive_recommendations: [],
            last_updated: Date.now(),
            evolution_history: []
        };
        
        // Analyze current behavior patterns
        const currentPatterns = this.analyzeCurrentPatterns(session);
        
        // Predict MBTI type from patterns
        const predictedMBTI = this.predictMBTIFromBehavior(currentPatterns);
        
        // Update profile
        if (predictedMBTI.type !== profile.mbti_type && predictedMBTI.confidence > 70) {
            profile.evolution_history.push({
                from: profile.mbti_type,
                to: predictedMBTI.type,
                timestamp: Date.now(),
                trigger: 'behavioral_analysis',
                confidence: predictedMBTI.confidence
            });
            
            profile.mbti_type = predictedMBTI.type;
            profile.confidence = predictedMBTI.confidence;
        }
        
        // Update learning style
        profile.learning_style = this.synthesizeLearningStyle(session);
        
        // Update problem-solving style
        profile.problem_solving_style = this.synthesizeProblemSolvingStyle(session);
        
        // Update cultural alignment
        profile.cultural_alignment = this.synthesizeCulturalAlignment(session);
        
        // Generate adaptive recommendations
        profile.adaptive_recommendations = await this.generateAdaptiveRecommendations(profile, session);
        
        profile.last_updated = Date.now();
        
        this.personalityProfiles.set(session.userId, profile);
        
        this.emit('profileUpdated', {
            userId: session.userId,
            profile,
            session: session.id
        });
        
        return profile;
    }
    
    /**
     * Predict MBTI type from behavioral patterns
     */
    predictMBTIFromBehavior(patterns) {
        const mbtiScores = {
            E: 0, I: 0,  // Extraversion vs Introversion
            S: 0, N: 0,  // Sensing vs Intuition
            T: 0, F: 0,  // Thinking vs Feeling
            J: 0, P: 0   // Judging vs Perceiving
        };
        
        // Analyze each pattern
        patterns.forEach(pattern => {
            // Extraversion indicators
            if (pattern.includes('collaborative') || pattern.includes('communication')) {
                mbtiScores.E += pattern.confidence;
            } else if (pattern.includes('independent') || pattern.includes('solitary')) {
                mbtiScores.I += pattern.confidence;
            }
            
            // Sensing vs Intuition
            if (pattern.includes('concrete') || pattern.includes('detailed') || pattern.includes('methodical')) {
                mbtiScores.S += pattern.confidence;
            } else if (pattern.includes('big_picture') || pattern.includes('pattern') || pattern.includes('conceptual')) {
                mbtiScores.N += pattern.confidence;
            }
            
            // Thinking vs Feeling
            if (pattern.includes('analytical') || pattern.includes('logical') || pattern.includes('systematic')) {
                mbtiScores.T += pattern.confidence;
            } else if (pattern.includes('people') || pattern.includes('harmony') || pattern.includes('collaborative')) {
                mbtiScores.F += pattern.confidence;
            }
            
            // Judging vs Perceiving
            if (pattern.includes('structured') || pattern.includes('planned') || pattern.includes('organized')) {
                mbtiScores.J += pattern.confidence;
            } else if (pattern.includes('flexible') || pattern.includes('spontaneous') || pattern.includes('adaptive')) {
                mbtiScores.P += pattern.confidence;
            }
        });
        
        // Determine type
        const type = (
            (mbtiScores.E > mbtiScores.I ? 'E' : 'I') +
            (mbtiScores.S > mbtiScores.N ? 'S' : 'N') +
            (mbtiScores.T > mbtiScores.F ? 'T' : 'F') +
            (mbtiScores.J > mbtiScores.P ? 'J' : 'P')
        );
        
        // Calculate confidence
        const totalPatterns = patterns.length;
        const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / totalPatterns;
        
        return {
            type,
            confidence: Math.round(avgConfidence),
            scores: mbtiScores,
            evidence: patterns.slice(0, 5) // Top 5 supporting patterns
        };
    }
    
    /**
     * Synthesize learning style from session data
     */
    synthesizeLearningStyle(session) {
        const style = {};
        
        // Determine primary sensory preference
        const sensoryScores = ['visual', 'auditory', 'kinesthetic', 'reading']
            .map(type => ({ type, score: session.learningStyleData[type] || 0 }))
            .sort((a, b) => b.score - a.score);
        
        style.primary_sensory = sensoryScores[0].type;
        style.sensory_distribution = sensoryScores;
        
        // Determine processing preference
        const processingScores = ['sequential', 'global', 'active', 'reflective']
            .map(type => ({ type, score: session.learningStyleData[type] || 0 }))
            .sort((a, b) => b.score - a.score);
        
        style.primary_processing = processingScores[0].type;
        style.processing_distribution = processingScores;
        
        // Determine understanding preference
        const understandingScores = ['sensing', 'intuitive', 'inductive', 'deductive']
            .map(type => ({ type, score: session.learningStyleData[type] || 0 }))
            .sort((a, b) => b.score - a.score);
        
        style.primary_understanding = understandingScores[0].type;
        style.understanding_distribution = understandingScores;
        
        return style;
    }
    
    /**
     * Synthesize problem-solving style
     */
    synthesizeProblemSolvingStyle(session) {
        const patternCounts = this.countPatterns(session.problemSolvingPatterns);
        
        // Find dominant style
        const styleScores = Object.entries(this.problemSolvingStyles).map(([style, config]) => {
            const score = config.patterns.reduce((sum, pattern) => {
                return sum + (patternCounts[pattern] || 0);
            }, 0);
            
            return { style, score, patterns: config.patterns };
        }).sort((a, b) => b.score - a.score);
        
        return {
            primary_style: styleScores[0].style,
            style_distribution: styleScores,
            confidence: styleScores[0].score > 0 ? Math.min(95, styleScores[0].score * 20) : 0
        };
    }
    
    /**
     * Synthesize cultural alignment
     */
    synthesizeCulturalAlignment(session) {
        const alignment = {};
        
        // Astrology elements
        const elements = ['fire', 'earth', 'air', 'water'];
        const elementScores = elements.map(element => ({
            element,
            score: session.culturalAffinities[element] || 0
        })).sort((a, b) => b.score - a.score);
        
        alignment.astrology = {
            primary_element: elementScores[0].element,
            distribution: elementScores
        };
        
        // Chinese zodiac traits
        const zodiacTraits = ['leadership', 'analytical', 'nurturing', 'independent'];
        const zodiacScores = zodiacTraits.map(trait => ({
            trait,
            score: session.culturalAffinities[trait] || 0
        })).sort((a, b) => b.score - a.score);
        
        alignment.chinese_zodiac = {
            primary_trait: zodiacScores[0].trait,
            distribution: zodiacScores
        };
        
        return alignment;
    }
    
    /**
     * Generate adaptive recommendations
     */
    async generateAdaptiveRecommendations(profile, session) {
        const recommendations = [];
        
        // Learning style recommendations
        const learningStyle = profile.learning_style.primary_sensory;
        switch (learningStyle) {
            case 'visual':
                recommendations.push('Provide more visual feedback and diagrams');
                recommendations.push('Use color coding and visual organization');
                break;
            case 'kinesthetic':
                recommendations.push('Emphasize hands-on interactive elements');
                recommendations.push('Provide immediate feedback on actions');
                break;
            case 'auditory':
                recommendations.push('Include audio explanations and discussions');
                recommendations.push('Use verbal feedback and narration');
                break;
        }
        
        // Problem-solving style recommendations
        const problemStyle = profile.problem_solving_style.primary_style;
        switch (problemStyle) {
            case 'analytical':
                recommendations.push('Provide detailed breakdowns and step-by-step guides');
                recommendations.push('Include validation checkpoints');
                break;
            case 'intuitive':
                recommendations.push('Start with big picture concepts');
                recommendations.push('Allow exploration and discovery');
                break;
            case 'hands_on':
                recommendations.push('Minimize explanations, maximize doing');
                recommendations.push('Provide immediate testing opportunities');
                break;
        }
        
        // Cultural framework recommendations
        const culturalElement = profile.cultural_alignment.astrology.primary_element;
        switch (culturalElement) {
            case 'fire':
                recommendations.push('Fast-paced challenges and quick rewards');
                break;
            case 'earth':
                recommendations.push('Structured progression and stable foundations');
                break;
            case 'air':
                recommendations.push('Social learning and collaborative elements');
                break;
            case 'water':
                recommendations.push('Emotional connection and intuitive guidance');
                break;
        }
        
        return recommendations;
    }
    
    /**
     * Get current session profile
     */
    getSessionProfile(sessionId) {
        const session = this.userSessions.get(sessionId);
        if (!session) return null;
        
        const profile = this.personalityProfiles.get(session.userId);
        
        return {
            session: {
                id: sessionId,
                duration: Date.now() - session.startTime,
                interactions: session.interactionHistory.length,
                currentChapter: session.currentChapter
            },
            personality: profile || { mbti_type: 'analyzing...', confidence: 0 },
            realTimeInsights: session.adaptiveInsights.slice(-3), // Last 3 insights
            nextRecommendations: profile?.adaptive_recommendations || []
        };
    }
    
    /**
     * Setup chapter system event listeners
     */
    setupChapterEventListeners(sessionId) {
        const session = this.userSessions.get(sessionId);
        
        this.chapterSystem.on('chapterStarted', (data) => {
            this.trackChapterInteraction(sessionId, {
                chapter: data.chapter,
                type: 'chapter_start',
                action: 'started_chapter',
                timeToAction: 0,
                approach: 'sequential'
            });
        });
        
        this.chapterSystem.on('interactionExecuted', (data) => {
            this.trackChapterInteraction(sessionId, {
                chapter: data.chapterNumber,
                type: data.elementId,
                action: 'executed_interaction',
                timeToAction: 5000, // Placeholder - would track actual time
                approach: this.inferApproachFromElement(data.elementId)
            });
        });
        
        this.chapterSystem.on('achievementEarned', (data) => {
            this.trackChapterInteraction(sessionId, {
                chapter: data.achievement.chapter,
                type: 'achievement',
                action: 'earned_achievement',
                timeToAction: 0,
                approach: 'completion_focused'
            });
        });
    }
    
    /**
     * Infer approach from interaction element
     */
    inferApproachFromElement(elementId) {
        const approaches = {
            'flash_test': 'visual',
            'integration_simulator': 'systematic',
            'lightning_strike': 'aggressive',
            'system_inventory': 'methodical',
            'anatomy_mapping': 'analytical',
            'skeleton_builder': 'constructive',
            'user_journey_mapper': 'comprehensive',
            'organism_monitor': 'observational'
        };
        
        return approaches[elementId] || 'standard';
    }
    
    /**
     * Calculate indicator confidence
     */
    calculateIndicatorConfidence(indicator, interaction) {
        // Base confidence on time to action and chapter complexity
        let confidence = 50;
        
        if (interaction.timeToAction < 5000) confidence += 20;
        if (interaction.timeToAction > 30000) confidence += 15;
        if (interaction.chapter > 3) confidence += 10; // More confident in later chapters
        
        return Math.min(95, confidence);
    }
    
    /**
     * Utility methods
     */
    calculateAverageTimeToAction(interactions) {
        if (interactions.length === 0) return 0;
        const total = interactions.reduce((sum, i) => sum + i.timeToAction, 0);
        return Math.round(total / interactions.length);
    }
    
    countPatterns(patterns) {
        const counts = {};
        patterns.forEach(pattern => {
            counts[pattern.type] = (counts[pattern.type] || 0) + 1;
        });
        return counts;
    }
    
    analyzeCurrentPatterns(session) {
        return session.problemSolvingPatterns.map(p => ({
            type: p.type,
            confidence: p.confidence,
            frequency: this.countPatterns(session.problemSolvingPatterns)[p.type]
        }));
    }
    
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    }
    
    /**
     * Export session data for analysis
     */
    async exportSessionData(sessionId) {
        const session = this.userSessions.get(sessionId);
        const profile = this.personalityProfiles.get(session.userId);
        
        return {
            session,
            profile,
            analysis: {
                total_interactions: session.interactionHistory.length,
                assessment_insights: session.adaptiveInsights.length,
                behavior_patterns: session.problemSolvingPatterns.length,
                learning_adaptations: profile?.adaptive_recommendations.length || 0
            },
            export_timestamp: Date.now()
        };
    }
}

module.exports = AdaptiveAssessmentEngine;

// CLI testing
if (require.main === module) {
    async function test() {
        console.log('🧠 Testing Adaptive Assessment Engine\n');
        
        const engine = new AdaptiveAssessmentEngine();
        
        // Start a test session
        const session = await engine.startAssessmentSession('user_test_123');
        
        // Simulate user interactions through chapter system
        const testInteractions = [
            {
                chapter: 1,
                type: 'system_inventory',
                action: 'reviewed_all_systems',
                timeToAction: 15000,
                approach: 'methodical'
            },
            {
                chapter: 1,
                type: 'flash_test',
                action: 'executed_immediately',
                timeToAction: 2000,
                approach: 'hands_on'
            },
            {
                chapter: 2,
                type: 'anatomy_mapping',
                action: 'created_detailed_map',
                timeToAction: 25000,
                approach: 'analytical'
            },
            {
                chapter: 3,
                type: 'integration_simulator',
                action: 'tested_all_connections',
                timeToAction: 18000,
                approach: 'systematic'
            }
        ];
        
        // Process each interaction
        for (let i = 0; i < testInteractions.length; i++) {
            console.log(`🔄 Processing interaction ${i + 1}...`);
            await engine.trackChapterInteraction(session.id, testInteractions[i]);
            
            // Show current profile after each interaction
            const profile = engine.getSessionProfile(session.id);
            console.log(`   Current MBTI prediction: ${profile.personality.mbti_type} (${profile.personality.confidence}%)`);
        }
        
        // Show final assessment
        console.log('\n📊 FINAL ASSESSMENT:');
        console.log('====================');
        const finalProfile = engine.getSessionProfile(session.id);
        console.log('Personality:', finalProfile.personality);
        console.log('Recommendations:', finalProfile.nextRecommendations);
        
        // Export session data
        const exportData = await engine.exportSessionData(session.id);
        console.log('\n💾 Session export completed');
        console.log('Analysis:', exportData.analysis);
        
    }
    
    test().catch(console.error);
}