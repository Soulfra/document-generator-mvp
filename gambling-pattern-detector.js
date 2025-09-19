#!/usr/bin/env node

/**
 * GAMBLING PATTERN DETECTOR
 * 
 * AI-powered pattern detection system that analyzes gambling behavior
 * to identify problematic patterns and predict at-risk players.
 * 
 * Uses machine learning algorithms to detect:
 * - Loss chasing behaviors
 * - Escalating bet patterns
 * - Time-based addiction markers
 * - Financial distress indicators
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class GamblingPatternDetector extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Pattern detection algorithms
            algorithms: {
                randomForest: true,
                neuralNetwork: true,
                anomalyDetection: true,
                timeSeriesAnalysis: true,
                clusteringAnalysis: true
            },
            
            // Pattern definitions based on research
            patterns: {
                // Loss chasing pattern
                lossChasing: {
                    indicators: [
                        'increasing_bet_size_after_loss',
                        'decreasing_time_between_bets',
                        'emotional_betting_markers',
                        'ignoring_win_opportunities'
                    ],
                    weight: 0.35,
                    threshold: 0.7
                },
                
                // Martingale system detection
                martingale: {
                    indicators: [
                        'doubling_after_loss',
                        'reset_after_win',
                        'exponential_bet_growth',
                        'systematic_progression'
                    ],
                    weight: 0.25,
                    threshold: 0.8
                },
                
                // Desperation pattern
                desperation: {
                    indicators: [
                        'max_bet_frequency',
                        'all_in_attempts',
                        'rapid_deposit_cycles',
                        'cancelled_withdrawals'
                    ],
                    weight: 0.4,
                    threshold: 0.6
                },
                
                // Addiction progression
                addictionProgression: {
                    indicators: [
                        'increasing_session_length',
                        'decreasing_break_frequency',
                        'night_time_gambling',
                        'social_isolation_markers'
                    ],
                    weight: 0.45,
                    threshold: 0.65
                },
                
                // Financial distress
                financialDistress: {
                    indicators: [
                        'multiple_payment_methods',
                        'declined_transactions',
                        'borrowing_behavior',
                        'selling_assets_markers'
                    ],
                    weight: 0.5,
                    threshold: 0.6
                }
            },
            
            // Machine learning model parameters
            modelParams: {
                // Random Forest
                randomForest: {
                    trees: 100,
                    maxDepth: 10,
                    minSamplesSplit: 5,
                    features: ['bet_variance', 'time_patterns', 'loss_velocity', 'deposit_frequency']
                },
                
                // Neural Network
                neuralNetwork: {
                    layers: [64, 32, 16, 8],
                    activation: 'relu',
                    learningRate: 0.001,
                    epochs: 100
                },
                
                // Anomaly Detection
                anomalyDetection: {
                    contamination: 0.1,
                    kernels: ['rbf', 'linear'],
                    threshold: 0.95
                }
            },
            
            // Real-time analysis settings
            realTimeAnalysis: true,
            batchSize: 100,
            updateFrequency: 5000, // 5 seconds
            
            ...options
        };
        
        // Pattern detection state
        this.detectionState = {
            models: new Map(),
            patternHistory: new Map(),
            predictions: new Map(),
            alerts: []
        };
        
        // Feature extraction cache
        this.featureCache = new Map();
        
        // Pattern statistics
        this.statistics = {
            patternsDetected: 0,
            accuratePredictions: 0,
            falsePositives: 0,
            interventionsSuggested: 0
        };
        
        this.initialize();
    }
    
    /**
     * Initialize pattern detection system
     */
    async initialize() {
        console.log('🧠 Initializing Gambling Pattern Detector...');
        console.log('🔍 Loading pattern recognition models...');
        console.log('📊 Configuring real-time analysis...');
        
        // Initialize ML models
        await this.initializeModels();
        
        // Start pattern analysis
        this.startPatternAnalysis();
        
        // Initialize feature extractors
        this.initializeFeatureExtractors();
        
        this.emit('detector_ready', {
            algorithms: Object.keys(this.config.algorithms).filter(a => this.config.algorithms[a]),
            patterns: Object.keys(this.config.patterns)
        });
    }
    
    /**
     * Initialize machine learning models
     */
    async initializeModels() {
        // Initialize Random Forest model
        if (this.config.algorithms.randomForest) {
            this.detectionState.models.set('randomForest', {
                type: 'RandomForest',
                trained: false,
                accuracy: 0,
                features: this.config.modelParams.randomForest.features
            });
        }
        
        // Initialize Neural Network
        if (this.config.algorithms.neuralNetwork) {
            this.detectionState.models.set('neuralNetwork', {
                type: 'NeuralNetwork',
                trained: false,
                accuracy: 0,
                layers: this.config.modelParams.neuralNetwork.layers
            });
        }
        
        // Initialize Anomaly Detection
        if (this.config.algorithms.anomalyDetection) {
            this.detectionState.models.set('anomalyDetection', {
                type: 'AnomalyDetection',
                trained: false,
                threshold: this.config.modelParams.anomalyDetection.threshold
            });
        }
        
        console.log(`✅ Initialized ${this.detectionState.models.size} ML models`);
    }
    
    /**
     * Analyze player behavior for patterns
     */
    analyzePlayerBehavior(playerId, behaviorData) {
        const analysis = {
            playerId,
            timestamp: Date.now(),
            patterns: [],
            riskScore: 0,
            predictions: {},
            recommendations: []
        };
        
        // Extract features from behavior data
        const features = this.extractFeatures(behaviorData);
        
        // Cache features for batch processing
        this.featureCache.set(playerId, features);
        
        // Check for each pattern type
        for (const [patternName, patternConfig] of Object.entries(this.config.patterns)) {
            const patternScore = this.detectPattern(features, patternConfig);
            
            if (patternScore >= patternConfig.threshold) {
                analysis.patterns.push({
                    type: patternName,
                    confidence: patternScore,
                    severity: this.calculateSeverity(patternScore, patternConfig.weight)
                });
                
                this.statistics.patternsDetected++;
            }
        }
        
        // Calculate overall risk score
        analysis.riskScore = this.calculateOverallRisk(analysis.patterns);
        
        // Generate predictions
        analysis.predictions = this.generatePredictions(features, analysis.patterns);
        
        // Generate recommendations
        analysis.recommendations = this.generateRecommendations(analysis);
        
        // Store pattern history
        if (!this.detectionState.patternHistory.has(playerId)) {
            this.detectionState.patternHistory.set(playerId, []);
        }
        this.detectionState.patternHistory.get(playerId).push(analysis);
        
        // Emit pattern detection event
        if (analysis.patterns.length > 0) {
            this.emit('patterns_detected', analysis);
        }
        
        // Check for high-risk alerts
        if (analysis.riskScore >= 0.8) {
            this.createAlert(playerId, analysis);
        }
        
        return analysis;
    }
    
    /**
     * Extract features from behavior data
     */
    extractFeatures(behaviorData) {
        const features = {
            // Temporal features
            sessionDuration: behaviorData.currentSessionDuration || 0,
            timeSinceLastBreak: behaviorData.timeSinceLastBreak || Infinity,
            playTimeToday: behaviorData.playTimeToday || 0,
            nightTimePlayRatio: this.calculateNightTimeRatio(behaviorData),
            
            // Betting features
            averageBetSize: behaviorData.averageBetSize || 0,
            betSizeVariance: behaviorData.betSizeVariance || 0,
            betFrequency: behaviorData.playSpeed || 0,
            maxBetRatio: this.calculateMaxBetRatio(behaviorData),
            
            // Financial features
            depositFrequency: behaviorData.depositCount || 0,
            depositVelocity: this.calculateDepositVelocity(behaviorData),
            lossVelocity: this.calculateLossVelocity(behaviorData),
            netPosition: (behaviorData.totalWon || 0) - (behaviorData.totalLost || 0),
            
            // Behavioral features
            winLossRatio: this.calculateWinLossRatio(behaviorData),
            consecutiveLosses: Math.abs(Math.min(0, behaviorData.winLossStreak || 0)),
            betAcceleration: this.calculateBetAcceleration(behaviorData),
            chasingIndicator: behaviorData.isChasingLosses ? 1 : 0,
            
            // Pattern-specific features
            martingaleScore: this.calculateMartingaleScore(behaviorData),
            emotionalityScore: this.calculateEmotionalityScore(behaviorData),
            desperationScore: this.calculateDesperationScore(behaviorData)
        };
        
        return features;
    }
    
    /**
     * Detect specific pattern
     */
    detectPattern(features, patternConfig) {
        let score = 0;
        let indicatorCount = 0;
        
        // Check each indicator
        patternConfig.indicators.forEach(indicator => {
            const indicatorScore = this.evaluateIndicator(indicator, features);
            score += indicatorScore;
            indicatorCount++;
        });
        
        // Normalize score
        const normalizedScore = indicatorCount > 0 ? score / indicatorCount : 0;
        
        // Apply pattern weight
        return normalizedScore * patternConfig.weight;
    }
    
    /**
     * Evaluate pattern indicator
     */
    evaluateIndicator(indicator, features) {
        switch (indicator) {
            // Loss chasing indicators
            case 'increasing_bet_size_after_loss':
                return features.betSizeVariance > 0.5 && features.consecutiveLosses > 3 ? 1 : 0;
                
            case 'decreasing_time_between_bets':
                return features.betAcceleration > 0.3 ? Math.min(1, features.betAcceleration) : 0;
                
            case 'emotional_betting_markers':
                return features.emotionalityScore;
                
            case 'ignoring_win_opportunities':
                return features.winLossRatio < 0.3 && features.betFrequency > 20 ? 1 : 0;
                
            // Martingale indicators
            case 'doubling_after_loss':
                return features.martingaleScore > 0.7 ? 1 : 0;
                
            case 'reset_after_win':
                return features.martingaleScore > 0.5 && features.betSizeVariance > 1 ? 1 : 0;
                
            case 'exponential_bet_growth':
                return features.maxBetRatio > 10 ? Math.min(1, features.maxBetRatio / 20) : 0;
                
            // Desperation indicators
            case 'max_bet_frequency':
                return features.maxBetRatio > 0.8 ? 1 : 0;
                
            case 'all_in_attempts':
                return features.desperationScore > 0.7 ? 1 : 0;
                
            case 'rapid_deposit_cycles':
                return features.depositVelocity > 3 ? Math.min(1, features.depositVelocity / 5) : 0;
                
            // Addiction progression indicators
            case 'increasing_session_length':
                return features.sessionDuration > 14400000 ? 1 : features.sessionDuration / 14400000; // 4 hours
                
            case 'night_time_gambling':
                return features.nightTimePlayRatio;
                
            // Financial distress indicators
            case 'multiple_payment_methods':
                return features.depositFrequency > 5 ? 1 : features.depositFrequency / 5;
                
            case 'declined_transactions':
                return features.depositVelocity > 5 ? 1 : 0;
                
            default:
                return 0;
        }
    }
    
    /**
     * Calculate various metrics
     */
    calculateNightTimeRatio(data) {
        if (!data.betHistory || data.betHistory.length === 0) return 0;
        
        const nightBets = data.betHistory.filter(bet => {
            const hour = new Date(bet.timestamp).getHours();
            return hour >= 22 || hour <= 6; // 10 PM to 6 AM
        });
        
        return nightBets.length / data.betHistory.length;
    }
    
    calculateMaxBetRatio(data) {
        if (!data.betHistory || data.betHistory.length === 0) return 0;
        
        const maxBet = Math.max(...data.betHistory.map(b => b.amount));
        return data.averageBetSize > 0 ? maxBet / data.averageBetSize : 0;
    }
    
    calculateDepositVelocity(data) {
        if (!data.deposits || data.deposits.length < 2) return 0;
        
        const recentDeposits = data.deposits.filter(d => 
            Date.now() - d.timestamp < 3600000 // Last hour
        );
        
        return recentDeposits.length;
    }
    
    calculateLossVelocity(data) {
        if (!data.lossHistory || data.lossHistory.length === 0) return 0;
        
        const recentLosses = data.lossHistory.filter(l => 
            Date.now() - l.timestamp < 3600000 // Last hour
        );
        
        const totalRecentLoss = recentLosses.reduce((sum, l) => sum + l.amount, 0);
        return totalRecentLoss / 3600; // Loss per second
    }
    
    calculateWinLossRatio(data) {
        const totalBets = (data.wins || 0) + (data.losses || 0);
        return totalBets > 0 ? (data.wins || 0) / totalBets : 0.5;
    }
    
    calculateBetAcceleration(data) {
        if (!data.betHistory || data.betHistory.length < 10) return 0;
        
        // Compare recent betting speed to earlier
        const recentBets = data.betHistory.slice(-5);
        const earlierBets = data.betHistory.slice(-10, -5);
        
        const recentAvgTime = this.calculateAverageBetInterval(recentBets);
        const earlierAvgTime = this.calculateAverageBetInterval(earlierBets);
        
        if (earlierAvgTime === 0) return 0;
        
        // Return acceleration factor (negative means slowing down)
        return (earlierAvgTime - recentAvgTime) / earlierAvgTime;
    }
    
    calculateAverageBetInterval(bets) {
        if (bets.length < 2) return 0;
        
        let totalInterval = 0;
        for (let i = 1; i < bets.length; i++) {
            totalInterval += bets[i].timestamp - bets[i-1].timestamp;
        }
        
        return totalInterval / (bets.length - 1);
    }
    
    calculateMartingaleScore(data) {
        if (!data.betHistory || data.betHistory.length < 5) return 0;
        
        let martingaleCount = 0;
        
        for (let i = 1; i < data.betHistory.length; i++) {
            const prevBet = data.betHistory[i-1];
            const currBet = data.betHistory[i];
            
            // Check if bet doubled after loss
            if (prevBet.result === 'loss' && 
                currBet.amount >= prevBet.amount * 1.8 && 
                currBet.amount <= prevBet.amount * 2.2) {
                martingaleCount++;
            }
        }
        
        return martingaleCount / (data.betHistory.length - 1);
    }
    
    calculateEmotionalityScore(data) {
        // Combine various emotional indicators
        let score = 0;
        
        // Erratic betting
        if (data.betSizeVariance > 1) score += 0.25;
        
        // Rapid play after losses
        if (data.betAcceleration > 0.5 && data.consecutiveLosses > 3) score += 0.25;
        
        // Large bets relative to balance
        if (data.maxBetRatio > 5) score += 0.25;
        
        // Multiple deposits in short time
        if (data.depositVelocity > 3) score += 0.25;
        
        return Math.min(1, score);
    }
    
    calculateDesperationScore(data) {
        let score = 0;
        
        // All-in or near all-in bets
        if (data.maxBetRatio > 0.9) score += 0.4;
        
        // Rapid deposits after losses
        if (data.depositVelocity > 5 && data.netPosition < 0) score += 0.3;
        
        // Very high loss velocity
        if (data.lossVelocity > 100) score += 0.3;
        
        return Math.min(1, score);
    }
    
    /**
     * Calculate overall risk score
     */
    calculateOverallRisk(patterns) {
        if (patterns.length === 0) return 0;
        
        // Weight patterns by severity
        let totalRisk = 0;
        let totalWeight = 0;
        
        patterns.forEach(pattern => {
            totalRisk += pattern.confidence * pattern.severity;
            totalWeight += pattern.severity;
        });
        
        return totalWeight > 0 ? Math.min(1, totalRisk / totalWeight) : 0;
    }
    
    /**
     * Calculate pattern severity
     */
    calculateSeverity(confidence, weight) {
        return confidence * weight;
    }
    
    /**
     * Generate predictions using ML models
     */
    generatePredictions(features, detectedPatterns) {
        const predictions = {
            nextHourRisk: 0,
            escalationProbability: 0,
            interventionUrgency: 0,
            selfExclusionLikelihood: 0
        };
        
        // Simple prediction model (would use trained ML in production)
        const riskFactors = [
            features.sessionDuration > 7200000, // 2+ hours
            features.lossVelocity > 50,
            features.depositVelocity > 3,
            features.chasingIndicator === 1,
            features.desperationScore > 0.5
        ];
        
        const riskCount = riskFactors.filter(f => f).length;
        
        // Next hour risk prediction
        predictions.nextHourRisk = Math.min(1, riskCount * 0.2 + features.emotionalityScore * 0.3);
        
        // Escalation probability
        predictions.escalationProbability = detectedPatterns.some(p => 
            p.type === 'lossChasing' || p.type === 'martingale'
        ) ? 0.7 : 0.3;
        
        // Intervention urgency
        predictions.interventionUrgency = Math.max(
            predictions.nextHourRisk,
            features.desperationScore,
            detectedPatterns.length > 2 ? 0.8 : 0.4
        );
        
        // Self-exclusion likelihood
        predictions.selfExclusionLikelihood = features.desperationScore > 0.7 || 
            (features.sessionDuration > 14400000 && features.netPosition < -500) ? 0.6 : 0.2;
        
        return predictions;
    }
    
    /**
     * Generate recommendations based on analysis
     */
    generateRecommendations(analysis) {
        const recommendations = [];
        
        // Pattern-specific recommendations
        analysis.patterns.forEach(pattern => {
            switch (pattern.type) {
                case 'lossChasing':
                    recommendations.push({
                        type: 'immediate',
                        action: 'reality_check',
                        message: 'Player showing loss chasing behavior - immediate intervention recommended'
                    });
                    break;
                    
                case 'martingale':
                    recommendations.push({
                        type: 'warning',
                        action: 'betting_limits',
                        message: 'Martingale betting pattern detected - implement bet size limits'
                    });
                    break;
                    
                case 'desperation':
                    recommendations.push({
                        type: 'critical',
                        action: 'account_freeze',
                        message: 'Desperation pattern detected - consider temporary account freeze'
                    });
                    break;
                    
                case 'addictionProgression':
                    recommendations.push({
                        type: 'support',
                        action: 'counseling_referral',
                        message: 'Addiction progression detected - offer counseling resources'
                    });
                    break;
                    
                case 'financialDistress':
                    recommendations.push({
                        type: 'protective',
                        action: 'payment_limits',
                        message: 'Financial distress indicators - restrict payment methods'
                    });
                    break;
            }
        });
        
        // Risk-based recommendations
        if (analysis.riskScore > 0.8) {
            recommendations.push({
                type: 'urgent',
                action: 'immediate_intervention',
                message: 'High risk score - immediate intervention required'
            });
        }
        
        // Prediction-based recommendations
        if (analysis.predictions.interventionUrgency > 0.7) {
            recommendations.push({
                type: 'proactive',
                action: 'preemptive_break',
                message: 'High intervention urgency - enforce cooling-off period'
            });
        }
        
        if (analysis.predictions.selfExclusionLikelihood > 0.5) {
            recommendations.push({
                type: 'supportive',
                action: 'self_exclusion_offer',
                message: 'High self-exclusion likelihood - proactively offer self-exclusion options'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Create high-risk alert
     */
    createAlert(playerId, analysis) {
        const alert = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            playerId,
            severity: 'high',
            riskScore: analysis.riskScore,
            patterns: analysis.patterns.map(p => p.type),
            urgency: analysis.predictions.interventionUrgency,
            recommendations: analysis.recommendations
        };
        
        this.detectionState.alerts.push(alert);
        
        // Emit alert
        this.emit('high_risk_alert', alert);
        
        // Log alert
        console.log(`🚨 HIGH RISK ALERT: Player ${playerId} - Risk Score: ${(analysis.riskScore * 100).toFixed(1)}%`);
        
        this.statistics.interventionsSuggested++;
    }
    
    /**
     * Start pattern analysis loop
     */
    startPatternAnalysis() {
        if (!this.config.realTimeAnalysis) return;
        
        setInterval(() => {
            // Process batch of cached features
            if (this.featureCache.size >= this.config.batchSize) {
                this.processBatch();
            }
        }, this.config.updateFrequency);
    }
    
    /**
     * Process batch of player data
     */
    processBatch() {
        const batch = Array.from(this.featureCache.entries()).slice(0, this.config.batchSize);
        
        // In production, this would update ML models
        console.log(`Processing batch of ${batch.length} player analyses`);
        
        // Clear processed entries
        batch.forEach(([playerId]) => {
            this.featureCache.delete(playerId);
        });
    }
    
    /**
     * Initialize feature extractors
     */
    initializeFeatureExtractors() {
        console.log('✅ Feature extractors initialized');
    }
    
    /**
     * Get pattern history for player
     */
    getPlayerPatternHistory(playerId) {
        return this.detectionState.patternHistory.get(playerId) || [];
    }
    
    /**
     * Get current alerts
     */
    getCurrentAlerts() {
        // Return recent alerts (last hour)
        const cutoff = Date.now() - 3600000;
        return this.detectionState.alerts.filter(a => a.timestamp > cutoff);
    }
    
    /**
     * Get detection statistics
     */
    getStatistics() {
        return {
            ...this.statistics,
            activeAlerts: this.getCurrentAlerts().length,
            modelsActive: this.detectionState.models.size,
            playersAnalyzed: this.detectionState.patternHistory.size
        };
    }
}

module.exports = GamblingPatternDetector;

// If run directly, demonstrate pattern detection
if (require.main === module) {
    const detector = new GamblingPatternDetector();
    
    console.log('\n📊 Demonstrating pattern detection...\n');
    
    // Simulate problematic gambling behavior
    const problematicBehavior = {
        currentSessionDuration: 5 * 60 * 60 * 1000, // 5 hours
        betHistory: [
            { amount: 10, timestamp: Date.now() - 3600000, result: 'loss' },
            { amount: 20, timestamp: Date.now() - 3500000, result: 'loss' },
            { amount: 40, timestamp: Date.now() - 3400000, result: 'loss' },
            { amount: 80, timestamp: Date.now() - 3300000, result: 'loss' },
            { amount: 160, timestamp: Date.now() - 3200000, result: 'win' },
            { amount: 10, timestamp: Date.now() - 3100000, result: 'loss' },
            { amount: 20, timestamp: Date.now() - 3000000, result: 'loss' }
        ],
        totalWon: 160,
        totalLost: 360,
        averageBetSize: 48.57,
        betSizeVariance: 55.65,
        playSpeed: 25,
        depositCount: 4,
        winLossStreak: -2,
        isChasingLosses: true
    };
    
    // Analyze behavior
    const analysis = detector.analyzePlayerBehavior('demo_player', problematicBehavior);
    
    console.log('Analysis Results:');
    console.log('================');
    console.log(`Risk Score: ${(analysis.riskScore * 100).toFixed(1)}%`);
    console.log(`Patterns Detected: ${analysis.patterns.map(p => p.type).join(', ')}`);
    console.log('\nPredictions:');
    console.log(`- Next Hour Risk: ${(analysis.predictions.nextHourRisk * 100).toFixed(1)}%`);
    console.log(`- Escalation Probability: ${(analysis.predictions.escalationProbability * 100).toFixed(1)}%`);
    console.log(`- Intervention Urgency: ${(analysis.predictions.interventionUrgency * 100).toFixed(1)}%`);
    console.log('\nRecommendations:');
    analysis.recommendations.forEach(rec => {
        console.log(`- [${rec.type.toUpperCase()}] ${rec.message}`);
    });
    
    // Show statistics
    setTimeout(() => {
        console.log('\n📊 Detection Statistics:');
        const stats = detector.getStatistics();
        console.log(JSON.stringify(stats, null, 2));
    }, 1000);
}