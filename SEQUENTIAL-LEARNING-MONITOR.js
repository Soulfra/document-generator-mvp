#!/usr/bin/env node

/**
 * 📊 SEQUENTIAL LEARNING MONITOR
 * 
 * Invisible progress tracking system that monitors learning patterns,
 * identifies strengths/weaknesses, and adapts educational content
 * without the learner being aware of the assessment.
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class SequentialLearningMonitor extends EventEmitter {
    constructor() {
        super();
        
        // Learning metrics storage
        this.learners = new Map();
        this.sessions = new Map();
        this.patterns = new Map();
        
        // Stealth assessment configuration
        this.assessmentConfig = {
            // Reaction time thresholds (ms)
            reactionTime: {
                excellent: 500,
                good: 1000,
                average: 2000,
                slow: 3000
            },
            
            // Pattern complexity levels
            patternComplexity: {
                basic: 1,
                intermediate: 2,
                advanced: 3,
                expert: 4
            },
            
            // Learning velocity tracking
            velocityWindow: 300000, // 5 minutes
            
            // Confidence thresholds
            confidenceThresholds: {
                mastery: 0.9,
                proficient: 0.75,
                developing: 0.5,
                struggling: 0.25
            }
        };
        
        // Behavioral patterns to track
        this.behavioralMetrics = {
            hesitation: [],          // Time before making choices
            correction_patterns: [], // How learners fix mistakes
            exploration_style: [],   // How they explore new content
            persistence: [],         // How long they work on challenges
            collaboration: [],       // How they interact with others
            creativity: []          // Novel solutions and approaches
        };
        
        // Learning style indicators
        this.learningStyles = {
            visual: { indicators: [], weight: 0 },
            kinesthetic: { indicators: [], weight: 0 },
            auditory: { indicators: [], weight: 0 },
            reading_writing: { indicators: [], weight: 0 },
            social: { indicators: [], weight: 0 },
            solitary: { indicators: [], weight: 0 }
        };
        
        // Adaptive difficulty engine
        this.difficultyEngine = {
            currentLevel: new Map(),
            adjustmentHistory: new Map(),
            performanceBuffer: new Map()
        };
        
        console.log('📊 SEQUENTIAL LEARNING MONITOR');
        console.log('==============================');
        console.log('🔍 Invisible progress tracking active');
        console.log('🧠 Adaptive learning system online');
        console.log('📈 Behavioral analysis enabled');
        console.log('');
        
        this.init();
    }
    
    async init() {
        // Create data directory
        await this.initDataStorage();
        
        // Start monitoring loops
        this.startMonitoringLoops();
        
        // Connect to education system
        await this.connectToEducationSystem();
        
        console.log('✅ Sequential Learning Monitor initialized');
    }
    
    async initDataStorage() {
        const dataDir = path.join(__dirname, 'learning-analytics');
        try {
            await fs.mkdir(dataDir, { recursive: true });
            await fs.mkdir(path.join(dataDir, 'learner-profiles'), { recursive: true });
            await fs.mkdir(path.join(dataDir, 'session-data'), { recursive: true });
            await fs.mkdir(path.join(dataDir, 'pattern-analysis'), { recursive: true });
        } catch (error) {
            console.error('Failed to create data directories:', error);
        }
    }
    
    async connectToEducationSystem() {
        // This would connect to the COLOR-CODED-EDUCATION-SYSTEM
        // For now, we'll set up the interface
        this.emit('monitor_ready', {
            capabilities: [
                'stealth_assessment',
                'pattern_recognition',
                'adaptive_difficulty',
                'learning_style_detection',
                'progress_prediction'
            ]
        });
    }
    
    // Core monitoring function
    trackInteraction(learnerId, interaction) {
        const timestamp = Date.now();
        
        // Get or create learner profile
        if (!this.learners.has(learnerId)) {
            this.initializeLearner(learnerId);
        }
        
        const learner = this.learners.get(learnerId);
        const session = this.getOrCreateSession(learnerId);
        
        // Record raw interaction
        const interactionData = {
            id: crypto.randomUUID(),
            timestamp: timestamp,
            type: interaction.type,
            data: interaction.data,
            context: this.captureContext(learnerId),
            metadata: this.extractMetadata(interaction)
        };
        
        session.interactions.push(interactionData);
        
        // Perform real-time analysis
        this.analyzeInteraction(learner, interactionData);
        
        // Update stealth metrics
        this.updateStealthMetrics(learner, interactionData);
        
        // Check for pattern emergence
        this.detectPatterns(learner);
        
        // Adjust difficulty if needed
        this.adjustDifficulty(learner);
        
        // Emit events for connected systems
        this.emitInsights(learner);
    }
    
    initializeLearner(learnerId) {
        const learner = {
            id: learnerId,
            created: Date.now(),
            profile: {
                learningStyle: null,
                strengths: [],
                challenges: [],
                preferences: {
                    colors: new Map(),
                    gameTypes: new Map(),
                    timeOfDay: new Map()
                }
            },
            metrics: {
                totalInteractions: 0,
                averageReactionTime: 0,
                accuracyRate: 1.0,
                engagementScore: 1.0,
                progressVelocity: 0,
                consistencyScore: 1.0
            },
            patterns: {
                temporal: [],    // Time-based patterns
                sequential: [],  // Order-based patterns
                behavioral: [],  // Behavior patterns
                emotional: []    // Emotional response patterns
            },
            achievements: {
                unlocked: [],
                hidden: [],      // Achievements they don't know about
                potential: []    // Predicted future achievements
            },
            adaptations: {
                difficultyLevel: 1,
                contentPreferences: [],
                pacingAdjustments: []
            }
        };
        
        this.learners.set(learnerId, learner);
        return learner;
    }
    
    getOrCreateSession(learnerId) {
        const sessionKey = `${learnerId}-${new Date().toISOString().split('T')[0]}`;
        
        if (!this.sessions.has(sessionKey)) {
            this.sessions.set(sessionKey, {
                learnerId: learnerId,
                date: new Date(),
                startTime: Date.now(),
                interactions: [],
                mood: 'neutral',
                energyLevel: 'normal'
            });
        }
        
        return this.sessions.get(sessionKey);
    }
    
    captureContext(learnerId) {
        const now = new Date();
        const session = this.getOrCreateSession(learnerId);
        
        return {
            timeOfDay: now.getHours(),
            dayOfWeek: now.getDay(),
            sessionDuration: Date.now() - session.startTime,
            previousInteractionGap: this.calculateInteractionGap(learnerId),
            environmentFactors: this.detectEnvironmentFactors()
        };
    }
    
    extractMetadata(interaction) {
        const metadata = {
            complexity: this.calculateComplexity(interaction),
            cognitiveLoad: this.estimateCognitiveLoad(interaction),
            emotionalValence: this.detectEmotionalValence(interaction),
            socialContext: this.identifySocialContext(interaction)
        };
        
        // Reaction time analysis
        if (interaction.data.reactionTime) {
            metadata.reactionCategory = this.categorizeReactionTime(interaction.data.reactionTime);
            metadata.reactionDeviation = this.calculateReactionDeviation(interaction.data.reactionTime);
        }
        
        // Choice analysis
        if (interaction.data.choice) {
            metadata.choiceConfidence = this.analyzeChoiceConfidence(interaction);
            metadata.choicePattern = this.detectChoicePattern(interaction);
        }
        
        return metadata;
    }
    
    analyzeInteraction(learner, interaction) {
        // Update basic metrics
        learner.metrics.totalInteractions++;
        
        // Reaction time analysis
        if (interaction.data.reactionTime) {
            this.updateReactionTimeMetrics(learner, interaction.data.reactionTime);
        }
        
        // Accuracy tracking
        if (interaction.data.correct !== undefined) {
            this.updateAccuracyMetrics(learner, interaction.data.correct);
        }
        
        // Engagement analysis
        this.updateEngagementMetrics(learner, interaction);
        
        // Learning velocity
        this.updateLearningVelocity(learner);
        
        // Behavioral pattern tracking
        this.trackBehavioralPattern(learner, interaction);
    }
    
    updateStealthMetrics(learner, interaction) {
        // Hidden performance indicators
        const performance = {
            timestamp: interaction.timestamp,
            type: interaction.type,
            success: interaction.data.correct || null,
            efficiency: this.calculateEfficiency(interaction),
            innovation: this.detectInnovation(interaction),
            collaboration: this.measureCollaboration(interaction),
            persistence: this.measurePersistence(learner, interaction)
        };
        
        // Update learning style weights
        this.updateLearningStyleWeights(learner, interaction);
        
        // Track micro-behaviors
        this.trackMicroBehaviors(learner, interaction);
        
        // Emotional state inference
        this.inferEmotionalState(learner, interaction);
    }
    
    detectPatterns(learner) {
        const recentInteractions = this.getRecentInteractions(learner.id, 50);
        
        // Temporal patterns
        const temporalPatterns = this.findTemporalPatterns(recentInteractions);
        if (temporalPatterns.length > 0) {
            learner.patterns.temporal.push(...temporalPatterns);
        }
        
        // Sequential patterns
        const sequentialPatterns = this.findSequentialPatterns(recentInteractions);
        if (sequentialPatterns.length > 0) {
            learner.patterns.sequential.push(...sequentialPatterns);
        }
        
        // Behavioral patterns
        const behavioralPatterns = this.findBehavioralPatterns(recentInteractions);
        if (behavioralPatterns.length > 0) {
            learner.patterns.behavioral.push(...behavioralPatterns);
        }
        
        // Consolidate patterns
        this.consolidatePatterns(learner);
    }
    
    findTemporalPatterns(interactions) {
        const patterns = [];
        
        // Time of day preferences
        const timePreferences = new Map();
        interactions.forEach(i => {
            const hour = new Date(i.timestamp).getHours();
            const performance = i.data.correct ? 1 : 0;
            
            if (!timePreferences.has(hour)) {
                timePreferences.set(hour, { count: 0, performance: 0 });
            }
            
            const pref = timePreferences.get(hour);
            pref.count++;
            pref.performance += performance;
        });
        
        // Identify peak performance times
        let bestHour = -1;
        let bestPerformance = 0;
        
        timePreferences.forEach((data, hour) => {
            const avgPerformance = data.performance / data.count;
            if (avgPerformance > bestPerformance && data.count >= 3) {
                bestHour = hour;
                bestPerformance = avgPerformance;
            }
        });
        
        if (bestHour !== -1) {
            patterns.push({
                type: 'peak_performance_time',
                hour: bestHour,
                performance: bestPerformance,
                confidence: this.calculatePatternConfidence(timePreferences.get(bestHour).count)
            });
        }
        
        return patterns;
    }
    
    findSequentialPatterns(interactions) {
        const patterns = [];
        const sequences = [];
        
        // Build sequences of interaction types
        for (let i = 0; i < interactions.length - 2; i++) {
            sequences.push([
                interactions[i].type,
                interactions[i + 1].type,
                interactions[i + 2].type
            ]);
        }
        
        // Find recurring sequences
        const sequenceCounts = new Map();
        sequences.forEach(seq => {
            const key = seq.join('-');
            sequenceCounts.set(key, (sequenceCounts.get(key) || 0) + 1);
        });
        
        // Identify significant patterns
        sequenceCounts.forEach((count, sequence) => {
            if (count >= 3) {
                patterns.push({
                    type: 'interaction_sequence',
                    sequence: sequence.split('-'),
                    frequency: count,
                    significance: count / sequences.length
                });
            }
        });
        
        return patterns;
    }
    
    findBehavioralPatterns(interactions) {
        const patterns = [];
        
        // Hesitation patterns
        const hesitations = interactions
            .filter(i => i.data.reactionTime > this.assessmentConfig.reactionTime.average)
            .map(i => ({
                type: i.type,
                complexity: i.metadata.complexity,
                time: i.data.reactionTime
            }));
        
        if (hesitations.length >= 5) {
            patterns.push({
                type: 'hesitation_pattern',
                triggers: this.identifyHesitationTriggers(hesitations),
                severity: this.calculateHesitationSeverity(hesitations)
            });
        }
        
        // Error correction patterns
        const corrections = this.identifyErrorCorrections(interactions);
        if (corrections.length > 0) {
            patterns.push({
                type: 'error_correction',
                strategy: this.classifyErrorCorrectionStrategy(corrections),
                effectiveness: this.measureCorrectionEffectiveness(corrections)
            });
        }
        
        return patterns;
    }
    
    adjustDifficulty(learner) {
        const recentPerformance = this.calculateRecentPerformance(learner);
        const currentLevel = this.difficultyEngine.currentLevel.get(learner.id) || 1;
        
        let newLevel = currentLevel;
        
        // Increase difficulty if performing well
        if (recentPerformance.accuracy > 0.85 && recentPerformance.speed === 'fast') {
            newLevel = Math.min(currentLevel + 0.5, 5);
        }
        // Decrease difficulty if struggling
        else if (recentPerformance.accuracy < 0.6 || recentPerformance.frustration > 0.7) {
            newLevel = Math.max(currentLevel - 0.5, 1);
        }
        // Fine-tune based on engagement
        else if (recentPerformance.engagement < 0.5) {
            // Slightly adjust to maintain interest
            newLevel = currentLevel + (Math.random() > 0.5 ? 0.25 : -0.25);
        }
        
        if (newLevel !== currentLevel) {
            this.difficultyEngine.currentLevel.set(learner.id, newLevel);
            this.difficultyEngine.adjustmentHistory.set(learner.id, [
                ...(this.difficultyEngine.adjustmentHistory.get(learner.id) || []),
                {
                    timestamp: Date.now(),
                    from: currentLevel,
                    to: newLevel,
                    reason: this.explainDifficultyChange(recentPerformance)
                }
            ]);
            
            // Emit difficulty change event
            this.emit('difficulty_adjusted', {
                learnerId: learner.id,
                newLevel: newLevel,
                reason: this.explainDifficultyChange(recentPerformance)
            });
        }
    }
    
    calculateRecentPerformance(learner) {
        const recentInteractions = this.getRecentInteractions(learner.id, 20);
        
        const correct = recentInteractions.filter(i => i.data.correct === true).length;
        const total = recentInteractions.filter(i => i.data.correct !== undefined).length;
        
        const reactionTimes = recentInteractions
            .filter(i => i.data.reactionTime)
            .map(i => i.data.reactionTime);
        
        const avgReactionTime = reactionTimes.length > 0
            ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
            : this.assessmentConfig.reactionTime.average;
        
        return {
            accuracy: total > 0 ? correct / total : 0.5,
            speed: this.categorizeSpeed(avgReactionTime),
            engagement: learner.metrics.engagementScore,
            frustration: this.detectFrustration(recentInteractions),
            flow: this.detectFlowState(recentInteractions)
        };
    }
    
    emitInsights(learner) {
        const insights = {
            learnerId: learner.id,
            timestamp: Date.now(),
            
            // Current state
            currentState: {
                engagement: learner.metrics.engagementScore,
                difficulty: this.difficultyEngine.currentLevel.get(learner.id) || 1,
                mood: this.inferMood(learner),
                energy: this.inferEnergyLevel(learner)
            },
            
            // Progress indicators
            progress: {
                velocity: learner.metrics.progressVelocity,
                mastery: this.calculateMasteryLevel(learner),
                nextMilestone: this.predictNextMilestone(learner)
            },
            
            // Recommendations
            recommendations: this.generateRecommendations(learner),
            
            // Hidden achievements
            hiddenAchievements: this.checkHiddenAchievements(learner)
        };
        
        this.emit('learner_insights', insights);
    }
    
    // Helper methods
    calculateComplexity(interaction) {
        let complexity = 1;
        
        if (interaction.data.patternLength) {
            complexity += interaction.data.patternLength * 0.5;
        }
        
        if (interaction.data.choices) {
            complexity += Math.log2(interaction.data.choices.length);
        }
        
        if (interaction.data.timeLimit) {
            complexity += 2 / (interaction.data.timeLimit / 1000);
        }
        
        return Math.min(complexity, 5);
    }
    
    estimateCognitiveLoad(interaction) {
        // Estimate based on interaction type and context
        const loads = {
            pattern_recognition: 3,
            emotion_identification: 4,
            problem_solving: 5,
            memory_recall: 3,
            creative_expression: 4
        };
        
        return loads[interaction.type] || 2;
    }
    
    detectEmotionalValence(interaction) {
        // Analyze emotional content
        if (interaction.data.emotion) {
            const positiveEmotions = ['joy', 'excitement', 'calm', 'love'];
            const negativeEmotions = ['sadness', 'anger', 'fear', 'frustration'];
            
            if (positiveEmotions.includes(interaction.data.emotion)) {
                return 1;
            } else if (negativeEmotions.includes(interaction.data.emotion)) {
                return -1;
            }
        }
        
        return 0;
    }
    
    identifySocialContext(interaction) {
        return {
            isCollaborative: interaction.data.partners?.length > 0,
            partnerCount: interaction.data.partners?.length || 0,
            interactionType: interaction.data.interactionType || 'solo'
        };
    }
    
    categorizeReactionTime(time) {
        const config = this.assessmentConfig.reactionTime;
        
        if (time < config.excellent) return 'excellent';
        if (time < config.good) return 'good';
        if (time < config.average) return 'average';
        if (time < config.slow) return 'slow';
        return 'very_slow';
    }
    
    calculateReactionDeviation(time) {
        // Compare to expected reaction time for this type of interaction
        const expected = this.assessmentConfig.reactionTime.average;
        return (time - expected) / expected;
    }
    
    analyzeChoiceConfidence(interaction) {
        // Analyze how confident the choice was based on reaction time and pattern
        const reactionTime = interaction.data.reactionTime;
        const category = this.categorizeReactionTime(reactionTime);
        
        const confidence = {
            excellent: 0.95,
            good: 0.8,
            average: 0.6,
            slow: 0.4,
            very_slow: 0.2
        };
        
        return confidence[category];
    }
    
    detectChoicePattern(interaction) {
        // Detect patterns in how choices are made
        if (interaction.data.choiceIndex !== undefined) {
            const position = interaction.data.choiceIndex;
            const total = interaction.data.totalChoices;
            
            if (position === 0) return 'first_choice';
            if (position === total - 1) return 'last_choice';
            if (position === Math.floor(total / 2)) return 'middle_choice';
            return 'other';
        }
        
        return null;
    }
    
    updateReactionTimeMetrics(learner, reactionTime) {
        const currentAvg = learner.metrics.averageReactionTime;
        const count = learner.metrics.totalInteractions;
        
        // Calculate running average
        learner.metrics.averageReactionTime = 
            (currentAvg * (count - 1) + reactionTime) / count;
    }
    
    updateAccuracyMetrics(learner, correct) {
        const currentRate = learner.metrics.accuracyRate;
        const count = learner.metrics.totalInteractions;
        
        // Weighted average with recent performance having more weight
        const weight = Math.min(0.1, 1 / count);
        learner.metrics.accuracyRate = 
            currentRate * (1 - weight) + (correct ? 1 : 0) * weight;
    }
    
    updateEngagementMetrics(learner, interaction) {
        // Multiple factors contribute to engagement
        const factors = {
            interaction_frequency: this.calculateInteractionFrequency(learner),
            session_duration: this.calculateSessionEngagement(learner),
            exploration: this.measureExploration(learner),
            persistence: this.measurePersistence(learner, interaction)
        };
        
        // Weighted engagement score
        learner.metrics.engagementScore = 
            factors.interaction_frequency * 0.3 +
            factors.session_duration * 0.2 +
            factors.exploration * 0.3 +
            factors.persistence * 0.2;
    }
    
    updateLearningVelocity(learner) {
        const recentWindow = Date.now() - this.assessmentConfig.velocityWindow;
        const recentInteractions = this.getRecentInteractions(learner.id, 100)
            .filter(i => i.timestamp > recentWindow);
        
        const progressPoints = recentInteractions
            .filter(i => i.data.correct === true)
            .reduce((sum, i) => sum + (i.metadata.complexity || 1), 0);
        
        // Points per minute
        learner.metrics.progressVelocity = 
            progressPoints / (this.assessmentConfig.velocityWindow / 60000);
    }
    
    trackBehavioralPattern(learner, interaction) {
        const behavior = {
            timestamp: interaction.timestamp,
            type: interaction.type,
            outcome: interaction.data.correct,
            context: interaction.context,
            metadata: interaction.metadata
        };
        
        // Add to appropriate behavioral category
        if (interaction.data.reactionTime > this.assessmentConfig.reactionTime.average) {
            this.behavioralMetrics.hesitation.push(behavior);
        }
        
        if (interaction.data.isCorrection) {
            this.behavioralMetrics.correction_patterns.push(behavior);
        }
        
        if (interaction.data.isExploration) {
            this.behavioralMetrics.exploration_style.push(behavior);
        }
    }
    
    updateLearningStyleWeights(learner, interaction) {
        // Visual learning indicators
        if (interaction.type.includes('pattern') || interaction.type.includes('color')) {
            this.learningStyles.visual.indicators.push(interaction.timestamp);
            this.learningStyles.visual.weight += 0.1;
        }
        
        // Kinesthetic indicators
        if (interaction.data.gestureUsed || interaction.data.dragDrop) {
            this.learningStyles.kinesthetic.indicators.push(interaction.timestamp);
            this.learningStyles.kinesthetic.weight += 0.15;
        }
        
        // Social indicators
        if (interaction.data.partners?.length > 0) {
            this.learningStyles.social.indicators.push(interaction.timestamp);
            this.learningStyles.social.weight += 0.2;
        }
        
        // Normalize weights
        this.normalizeLearningStyleWeights();
    }
    
    normalizeLearningStyleWeights() {
        const total = Object.values(this.learningStyles)
            .reduce((sum, style) => sum + style.weight, 0);
        
        if (total > 0) {
            Object.keys(this.learningStyles).forEach(style => {
                this.learningStyles[style].weight /= total;
            });
        }
    }
    
    trackMicroBehaviors(learner, interaction) {
        // Track subtle behavioral cues
        const microBehaviors = [];
        
        // Double-clicking or repeated attempts
        if (interaction.data.attemptNumber > 1) {
            microBehaviors.push({
                type: 'retry_behavior',
                attempts: interaction.data.attemptNumber
            });
        }
        
        // Hover patterns (if available)
        if (interaction.data.hoverTime) {
            microBehaviors.push({
                type: 'consideration_time',
                duration: interaction.data.hoverTime
            });
        }
        
        // Quick corrections
        if (interaction.data.correctionTime && interaction.data.correctionTime < 1000) {
            microBehaviors.push({
                type: 'quick_correction',
                confidence: 'high'
            });
        }
        
        return microBehaviors;
    }
    
    inferEmotionalState(learner, interaction) {
        const recentInteractions = this.getRecentInteractions(learner.id, 10);
        
        // Look for emotional indicators
        const indicators = {
            frustration: 0,
            satisfaction: 0,
            curiosity: 0,
            boredom: 0
        };
        
        recentInteractions.forEach(i => {
            // Frustration indicators
            if (i.data.correct === false && i.data.reactionTime > this.assessmentConfig.reactionTime.slow) {
                indicators.frustration++;
            }
            
            // Satisfaction indicators
            if (i.data.correct === true && i.data.reactionTime < this.assessmentConfig.reactionTime.good) {
                indicators.satisfaction++;
            }
            
            // Curiosity indicators
            if (i.data.isExploration || i.type.includes('explore')) {
                indicators.curiosity++;
            }
            
            // Boredom indicators
            if (i.metadata.complexity < 2 && i.data.reactionTime < this.assessmentConfig.reactionTime.excellent) {
                indicators.boredom++;
            }
        });
        
        // Determine dominant emotional state
        const dominantEmotion = Object.entries(indicators)
            .sort((a, b) => b[1] - a[1])[0][0];
        
        return {
            state: dominantEmotion,
            confidence: indicators[dominantEmotion] / recentInteractions.length,
            indicators: indicators
        };
    }
    
    getRecentInteractions(learnerId, count) {
        const allInteractions = [];
        
        // Collect from all sessions
        this.sessions.forEach(session => {
            if (session.learnerId === learnerId) {
                allInteractions.push(...session.interactions);
            }
        });
        
        // Sort by timestamp and return most recent
        return allInteractions
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, count);
    }
    
    calculateInteractionGap(learnerId) {
        const recent = this.getRecentInteractions(learnerId, 2);
        if (recent.length < 2) return 0;
        
        return recent[0].timestamp - recent[1].timestamp;
    }
    
    detectEnvironmentFactors() {
        // Would detect actual environment factors in production
        return {
            noise_level: 'normal',
            distractions: 'minimal',
            time_pressure: 'none'
        };
    }
    
    calculateEfficiency(interaction) {
        if (!interaction.data.correct) return 0;
        
        const speedScore = 1 - Math.min(1, interaction.data.reactionTime / this.assessmentConfig.reactionTime.slow);
        const accuracyScore = interaction.data.correct ? 1 : 0;
        const complexityBonus = (interaction.metadata.complexity || 1) / 5;
        
        return (speedScore * 0.4 + accuracyScore * 0.4 + complexityBonus * 0.2);
    }
    
    detectInnovation(interaction) {
        // Detect novel approaches or creative solutions
        if (interaction.data.solutionPath) {
            // Check if solution is unique
            const uniqueness = this.calculateSolutionUniqueness(interaction.data.solutionPath);
            return uniqueness > 0.8 ? 1 : 0;
        }
        
        return 0;
    }
    
    calculateSolutionUniqueness(path) {
        // Would compare against common solution patterns
        return Math.random(); // Placeholder
    }
    
    measureCollaboration(interaction) {
        if (!interaction.data.partners) return 0;
        
        const factors = {
            partner_count: Math.min(1, interaction.data.partners.length / 4),
            interaction_quality: interaction.data.collaborationScore || 0.5,
            outcome_success: interaction.data.correct ? 1 : 0
        };
        
        return (factors.partner_count * 0.3 + 
                factors.interaction_quality * 0.5 + 
                factors.outcome_success * 0.2);
    }
    
    measurePersistence(learner, interaction) {
        if (interaction.data.attemptNumber > 1) {
            // Persistence shown through multiple attempts
            return Math.min(1, interaction.data.attemptNumber / 5);
        }
        
        if (interaction.metadata.complexity > 3 && interaction.data.correct) {
            // Persistence through difficult challenges
            return 0.8;
        }
        
        return 0.5;
    }
    
    calculateInteractionFrequency(learner) {
        const recentInteractions = this.getRecentInteractions(learner.id, 50);
        if (recentInteractions.length < 2) return 0.5;
        
        const timeSpan = recentInteractions[0].timestamp - recentInteractions[recentInteractions.length - 1].timestamp;
        const frequency = recentInteractions.length / (timeSpan / 60000); // Interactions per minute
        
        // Normalize to 0-1 scale
        return Math.min(1, frequency / 2);
    }
    
    calculateSessionEngagement(learner) {
        const session = this.getOrCreateSession(learner.id);
        const duration = Date.now() - session.startTime;
        
        // Ideal session length is 15-30 minutes
        if (duration < 900000) { // Less than 15 minutes
            return duration / 900000;
        } else if (duration <= 1800000) { // 15-30 minutes
            return 1;
        } else { // More than 30 minutes
            return Math.max(0.7, 1 - (duration - 1800000) / 3600000);
        }
    }
    
    measureExploration(learner) {
        const recentInteractions = this.getRecentInteractions(learner.id, 30);
        const uniqueTypes = new Set(recentInteractions.map(i => i.type)).size;
        
        // More variety = more exploration
        return Math.min(1, uniqueTypes / 10);
    }
    
    consolidatePatterns(learner) {
        // Combine similar patterns and increase confidence
        const patternGroups = new Map();
        
        [...learner.patterns.temporal, ...learner.patterns.sequential, ...learner.patterns.behavioral]
            .forEach(pattern => {
                const key = `${pattern.type}-${JSON.stringify(pattern.data || pattern.sequence || pattern.hour)}`;
                
                if (!patternGroups.has(key)) {
                    patternGroups.set(key, {
                        ...pattern,
                        occurrences: 1,
                        confidence: pattern.confidence || 0.5
                    });
                } else {
                    const existing = patternGroups.get(key);
                    existing.occurrences++;
                    existing.confidence = Math.min(1, existing.confidence + 0.1);
                }
            });
        
        // Update patterns with consolidated data
        learner.consolidatedPatterns = Array.from(patternGroups.values());
    }
    
    calculatePatternConfidence(sampleSize) {
        // Confidence increases with sample size
        return Math.min(1, sampleSize / 20);
    }
    
    identifyHesitationTriggers(hesitations) {
        const triggers = new Map();
        
        hesitations.forEach(h => {
            const key = `${h.type}-complexity:${Math.floor(h.complexity)}`;
            triggers.set(key, (triggers.get(key) || 0) + 1);
        });
        
        return Array.from(triggers.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([trigger, count]) => ({ trigger, frequency: count }));
    }
    
    calculateHesitationSeverity(hesitations) {
        const avgTime = hesitations.reduce((sum, h) => sum + h.time, 0) / hesitations.length;
        const severity = (avgTime - this.assessmentConfig.reactionTime.average) / 
                        this.assessmentConfig.reactionTime.average;
        
        return Math.min(1, Math.max(0, severity));
    }
    
    identifyErrorCorrections(interactions) {
        const corrections = [];
        
        for (let i = 1; i < interactions.length; i++) {
            if (interactions[i].data.isCorrection && 
                interactions[i - 1].data.correct === false) {
                corrections.push({
                    error: interactions[i - 1],
                    correction: interactions[i],
                    timeDelta: interactions[i].timestamp - interactions[i - 1].timestamp
                });
            }
        }
        
        return corrections;
    }
    
    classifyErrorCorrectionStrategy(corrections) {
        if (corrections.length === 0) return 'none';
        
        const avgTimeDelta = corrections.reduce((sum, c) => sum + c.timeDelta, 0) / corrections.length;
        
        if (avgTimeDelta < 2000) return 'immediate';
        if (avgTimeDelta < 10000) return 'thoughtful';
        return 'delayed';
    }
    
    measureCorrectionEffectiveness(corrections) {
        const successful = corrections.filter(c => c.correction.data.correct).length;
        return corrections.length > 0 ? successful / corrections.length : 0;
    }
    
    categorizeSpeed(avgReactionTime) {
        if (avgReactionTime < this.assessmentConfig.reactionTime.good) return 'fast';
        if (avgReactionTime < this.assessmentConfig.reactionTime.average) return 'normal';
        return 'slow';
    }
    
    detectFrustration(interactions) {
        let frustrationScore = 0;
        let consecutiveErrors = 0;
        
        interactions.forEach(i => {
            if (i.data.correct === false) {
                consecutiveErrors++;
                frustrationScore += consecutiveErrors * 0.1;
            } else {
                consecutiveErrors = 0;
            }
            
            if (i.data.reactionTime > this.assessmentConfig.reactionTime.slow) {
                frustrationScore += 0.05;
            }
        });
        
        return Math.min(1, frustrationScore / interactions.length);
    }
    
    detectFlowState(interactions) {
        // Flow state indicators: consistent success, appropriate challenge, steady pace
        let flowScore = 0;
        
        const correctRate = interactions.filter(i => i.data.correct).length / interactions.length;
        if (correctRate > 0.7 && correctRate < 0.9) {
            flowScore += 0.4; // Optimal challenge level
        }
        
        // Check for steady pace
        const reactionTimes = interactions.map(i => i.data.reactionTime).filter(Boolean);
        if (reactionTimes.length > 5) {
            const variance = this.calculateVariance(reactionTimes);
            if (variance < 0.3) {
                flowScore += 0.3; // Consistent pace
            }
        }
        
        // Check for sustained engagement
        const timeSpan = interactions[interactions.length - 1].timestamp - interactions[0].timestamp;
        if (timeSpan > 600000) { // More than 10 minutes
            flowScore += 0.3;
        }
        
        return flowScore;
    }
    
    calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length) / mean;
    }
    
    explainDifficultyChange(performance) {
        if (performance.accuracy > 0.85 && performance.speed === 'fast') {
            return 'Excellent performance - increasing challenge';
        } else if (performance.accuracy < 0.6) {
            return 'Struggling with current level - reducing difficulty';
        } else if (performance.frustration > 0.7) {
            return 'High frustration detected - adjusting for comfort';
        } else if (performance.engagement < 0.5) {
            return 'Low engagement - adjusting for interest';
        } else if (performance.flow > 0.7) {
            return 'In flow state - maintaining optimal challenge';
        }
        
        return 'Fine-tuning difficulty for optimal learning';
    }
    
    inferMood(learner) {
        const emotionalState = this.inferEmotionalState(learner, null);
        const engagement = learner.metrics.engagementScore;
        
        if (emotionalState.state === 'satisfaction' && engagement > 0.7) {
            return 'happy';
        } else if (emotionalState.state === 'frustration') {
            return 'frustrated';
        } else if (emotionalState.state === 'curiosity') {
            return 'curious';
        } else if (emotionalState.state === 'boredom') {
            return 'bored';
        }
        
        return 'neutral';
    }
    
    inferEnergyLevel(learner) {
        const recentInteractions = this.getRecentInteractions(learner.id, 20);
        const recentFrequency = this.calculateInteractionFrequency(learner);
        const avgReactionTime = learner.metrics.averageReactionTime;
        
        if (recentFrequency > 0.8 && avgReactionTime < this.assessmentConfig.reactionTime.good) {
            return 'high';
        } else if (recentFrequency < 0.3 || avgReactionTime > this.assessmentConfig.reactionTime.slow) {
            return 'low';
        }
        
        return 'normal';
    }
    
    calculateMasteryLevel(learner) {
        const factors = {
            accuracy: learner.metrics.accuracyRate,
            consistency: learner.metrics.consistencyScore,
            complexity: this.getAverageComplexityHandled(learner),
            independence: this.calculateIndependence(learner)
        };
        
        const mastery = 
            factors.accuracy * 0.3 +
            factors.consistency * 0.2 +
            factors.complexity * 0.3 +
            factors.independence * 0.2;
        
        return {
            level: mastery,
            category: this.categorizeMastery(mastery),
            factors: factors
        };
    }
    
    getAverageComplexityHandled(learner) {
        const recent = this.getRecentInteractions(learner.id, 50);
        const complexities = recent
            .filter(i => i.data.correct)
            .map(i => i.metadata.complexity || 1);
        
        return complexities.length > 0 
            ? complexities.reduce((a, b) => a + b, 0) / complexities.length / 5
            : 0;
    }
    
    calculateIndependence(learner) {
        const recent = this.getRecentInteractions(learner.id, 30);
        const independent = recent.filter(i => !i.data.hint_used && !i.data.help_requested).length;
        
        return recent.length > 0 ? independent / recent.length : 0;
    }
    
    categorizeMastery(level) {
        if (level >= 0.9) return 'master';
        if (level >= 0.75) return 'proficient';
        if (level >= 0.5) return 'developing';
        if (level >= 0.25) return 'beginner';
        return 'novice';
    }
    
    predictNextMilestone(learner) {
        const currentMastery = this.calculateMasteryLevel(learner);
        const velocity = learner.metrics.progressVelocity;
        
        const milestones = {
            novice: { next: 'beginner', threshold: 0.25 },
            beginner: { next: 'developing', threshold: 0.5 },
            developing: { next: 'proficient', threshold: 0.75 },
            proficient: { next: 'master', threshold: 0.9 },
            master: { next: 'grandmaster', threshold: 0.95 }
        };
        
        const current = milestones[currentMastery.category];
        if (!current) return null;
        
        const gap = current.threshold - currentMastery.level;
        const estimatedTime = velocity > 0 ? (gap * 100) / velocity : Infinity;
        
        return {
            milestone: current.next,
            estimatedTime: estimatedTime,
            progress: (currentMastery.level / current.threshold) * 100
        };
    }
    
    generateRecommendations(learner) {
        const recommendations = [];
        const patterns = learner.consolidatedPatterns || [];
        const mood = this.inferMood(learner);
        const energy = this.inferEnergyLevel(learner);
        
        // Time-based recommendations
        const peakTime = patterns.find(p => p.type === 'peak_performance_time');
        if (peakTime) {
            recommendations.push({
                type: 'timing',
                message: `You perform best around ${peakTime.hour}:00. Try scheduling challenging tasks then!`,
                priority: 'medium'
            });
        }
        
        // Difficulty recommendations
        if (mood === 'frustrated') {
            recommendations.push({
                type: 'difficulty',
                message: 'Consider trying easier challenges to build confidence',
                priority: 'high'
            });
        } else if (mood === 'bored') {
            recommendations.push({
                type: 'difficulty',
                message: 'You might enjoy more challenging puzzles!',
                priority: 'medium'
            });
        }
        
        // Learning style recommendations
        const dominantStyle = this.getDominantLearningStyle();
        if (dominantStyle) {
            recommendations.push({
                type: 'learning_style',
                message: `Your ${dominantStyle} learning style suggests trying more ${this.getStyleActivities(dominantStyle)}`,
                priority: 'low'
            });
        }
        
        // Energy-based recommendations
        if (energy === 'low') {
            recommendations.push({
                type: 'break',
                message: 'Consider taking a short break to recharge',
                priority: 'high'
            });
        }
        
        return recommendations;
    }
    
    getDominantLearningStyle() {
        let maxWeight = 0;
        let dominant = null;
        
        Object.entries(this.learningStyles).forEach(([style, data]) => {
            if (data.weight > maxWeight) {
                maxWeight = data.weight;
                dominant = style;
            }
        });
        
        return dominant;
    }
    
    getStyleActivities(style) {
        const activities = {
            visual: 'pattern recognition and color-based games',
            kinesthetic: 'interactive drag-and-drop activities',
            auditory: 'sound-based memory games',
            reading_writing: 'story-based challenges',
            social: 'multiplayer collaborative games',
            solitary: 'self-paced exploration modes'
        };
        
        return activities[style] || 'varied activities';
    }
    
    checkHiddenAchievements(learner) {
        const achievements = [];
        
        // Speed demon - consistent fast reactions
        if (learner.metrics.averageReactionTime < this.assessmentConfig.reactionTime.excellent) {
            achievements.push({
                id: 'speed_demon',
                name: 'Lightning Reflexes',
                description: 'Consistently fast reaction times',
                hidden: true
            });
        }
        
        // Night owl - best performance in evening
        const nightPattern = learner.patterns.temporal.find(p => 
            p.type === 'peak_performance_time' && p.hour >= 20
        );
        if (nightPattern) {
            achievements.push({
                id: 'night_owl',
                name: 'Night Owl',
                description: 'Peak performance after 8 PM',
                hidden: true
            });
        }
        
        // Perfectionist - very high accuracy
        if (learner.metrics.accuracyRate > 0.95 && learner.metrics.totalInteractions > 100) {
            achievements.push({
                id: 'perfectionist',
                name: 'Perfectionist',
                description: 'Maintained 95%+ accuracy',
                hidden: true
            });
        }
        
        // Flow master - frequent flow states
        const flowStates = this.getRecentInteractions(learner.id, 100)
            .map(i => this.detectFlowState([i]))
            .filter(f => f > 0.7).length;
        
        if (flowStates > 10) {
            achievements.push({
                id: 'flow_master',
                name: 'Flow Master',
                description: 'Frequently enters flow state',
                hidden: true
            });
        }
        
        return achievements;
    }
    
    startMonitoringLoops() {
        // Periodic pattern analysis
        setInterval(() => {
            this.learners.forEach((learner, learnerId) => {
                this.detectPatterns(learner);
                this.consolidatePatterns(learner);
            });
        }, 60000); // Every minute
        
        // Session cleanup
        setInterval(() => {
            const cutoff = Date.now() - 86400000; // 24 hours
            this.sessions.forEach((session, key) => {
                if (session.startTime < cutoff) {
                    this.saveSessionData(session);
                    this.sessions.delete(key);
                }
            });
        }, 3600000); // Every hour
        
        // Analytics export
        setInterval(() => {
            this.exportAnalytics();
        }, 300000); // Every 5 minutes
    }
    
    async saveSessionData(session) {
        const filename = `session-${session.learnerId}-${session.date.toISOString().split('T')[0]}.json`;
        const filepath = path.join(__dirname, 'learning-analytics', 'session-data', filename);
        
        try {
            await fs.writeFile(filepath, JSON.stringify(session, null, 2));
        } catch (error) {
            console.error('Failed to save session data:', error);
        }
    }
    
    async exportAnalytics() {
        const analytics = {
            timestamp: new Date().toISOString(),
            totalLearners: this.learners.size,
            activeSessions: this.sessions.size,
            aggregateMetrics: this.calculateAggregateMetrics(),
            learningStyles: this.aggregateLearningStyles(),
            patternInsights: this.generatePatternInsights()
        };
        
        const filename = `analytics-${Date.now()}.json`;
        const filepath = path.join(__dirname, 'learning-analytics', filename);
        
        try {
            await fs.writeFile(filepath, JSON.stringify(analytics, null, 2));
        } catch (error) {
            console.error('Failed to export analytics:', error);
        }
    }
    
    calculateAggregateMetrics() {
        let totalAccuracy = 0;
        let totalEngagement = 0;
        let totalVelocity = 0;
        let count = 0;
        
        this.learners.forEach(learner => {
            totalAccuracy += learner.metrics.accuracyRate;
            totalEngagement += learner.metrics.engagementScore;
            totalVelocity += learner.metrics.progressVelocity;
            count++;
        });
        
        return {
            averageAccuracy: count > 0 ? totalAccuracy / count : 0,
            averageEngagement: count > 0 ? totalEngagement / count : 0,
            averageVelocity: count > 0 ? totalVelocity / count : 0,
            totalInteractions: Array.from(this.learners.values())
                .reduce((sum, l) => sum + l.metrics.totalInteractions, 0)
        };
    }
    
    aggregateLearningStyles() {
        const aggregate = {};
        
        Object.keys(this.learningStyles).forEach(style => {
            aggregate[style] = {
                prevalence: this.learningStyles[style].weight,
                indicators: this.learningStyles[style].indicators.length
            };
        });
        
        return aggregate;
    }
    
    generatePatternInsights() {
        const insights = [];
        
        // Most common temporal patterns
        const temporalPatterns = new Map();
        this.learners.forEach(learner => {
            learner.patterns.temporal.forEach(pattern => {
                const key = `${pattern.type}-${pattern.hour || pattern.data}`;
                temporalPatterns.set(key, (temporalPatterns.get(key) || 0) + 1);
            });
        });
        
        const topTemporalPatterns = Array.from(temporalPatterns.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        
        insights.push({
            type: 'temporal',
            description: 'Most common time-based patterns',
            data: topTemporalPatterns
        });
        
        return insights;
    }
}

// Start the monitor if run directly
if (require.main === module) {
    console.log('🚀 STARTING SEQUENTIAL LEARNING MONITOR');
    console.log('=====================================');
    console.log('📊 Invisible progress tracking system');
    console.log('🧠 Adaptive learning analytics');
    console.log('');
    
    const monitor = new SequentialLearningMonitor();
    
    // Example usage
    monitor.on('learner_insights', (insights) => {
        console.log('📈 Learner Insights:', JSON.stringify(insights, null, 2));
    });
    
    monitor.on('difficulty_adjusted', (adjustment) => {
        console.log('🎯 Difficulty Adjusted:', adjustment);
    });
}

module.exports = SequentialLearningMonitor;