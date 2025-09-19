#!/usr/bin/env node

/**
 * ⏰🧠📊 TIMELINE/MEMORY SYSTEM
 * 
 * Phase 3B: Tracks limit patterns and builds learning system to predict/prevent future issues
 * 
 * Solves the original problem: "i hit my limit and its 7am not 9pm for the limit"
 * 
 * Core Functions:
 * - Track usage patterns over time (hourly, daily, weekly)
 * - Learn from past limit hits to predict future issues
 * - Build memory of timezone behaviors and reset patterns
 * - Proactively warn before limits based on learned patterns
 * - Optimize development workflows based on usage history
 * - Prevent timing confusion through pattern recognition
 * 
 * Memory Types:
 * - Short-term: Current session and recent usage patterns
 * - Medium-term: Weekly/monthly usage cycles and workflows  
 * - Long-term: Historical patterns and seasonal variations
 * - Meta-memory: Learning about the learning system itself
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const PersonalUsageLimitMonitor = require('./personal-usage-limit-monitor.js');
const PersonalLLMUsageAnalyzer = require('./personal-llm-usage-analyzer.js');
const DocumentationPipelineOrchestrator = require('./documentation-pipeline-orchestrator.js');

class TimelineMemorySystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Memory system configuration
            systemName: options.systemName || 'Timeline Memory & Pattern Learning System',
            learningMode: options.learningMode || 'adaptive', // passive, active, adaptive
            predictionAccuracy: options.targetAccuracy || 0.85, // Target 85% accuracy
            
            // Memory retention periods
            memoryRetention: {
                shortTerm: options.shortTermDays || 7,      // 1 week
                mediumTerm: options.mediumTermDays || 90,   // 3 months
                longTerm: options.longTermDays || 365,      // 1 year
                metaMemory: options.metaMemoryDays || 730   // 2 years
            },
            
            // Learning parameters
            learningRates: {
                usage_patterns: 0.1,        // How quickly to adapt to usage changes
                timezone_behaviors: 0.05,   // Slow learning for timezone patterns
                workflow_optimization: 0.2,  // Fast learning for workflow improvements
                prediction_accuracy: 0.15   // Learning rate for prediction tuning
            },
            
            // Prediction settings
            predictionHorizons: {
                immediate: 1 * 60 * 60 * 1000,      // 1 hour
                short: 6 * 60 * 60 * 1000,          // 6 hours  
                medium: 24 * 60 * 60 * 1000,        // 24 hours
                long: 7 * 24 * 60 * 60 * 1000       // 7 days
            },
            
            // Integration settings
            integrateWithUsageMonitor: options.integrateWithUsageMonitor !== false,
            integrateWithAnalyzer: options.integrateWithAnalyzer !== false,
            integrateWithPipeline: options.integrateWithPipeline !== false,
            enableProactivePredictions: options.enableProactivePredictions !== false,
            
            // Storage and persistence
            memoryDir: options.memoryDir || path.join(__dirname, 'timeline-memory'),
            backupInterval: options.backupInterval || 6 * 60 * 60 * 1000, // 6 hours
            compressionThreshold: options.compressionThreshold || 1000, // Compress after 1000 entries
            
            ...options
        };
        
        // Initialize integrated systems
        this.usageMonitor = null;
        this.usageAnalyzer = null;
        this.pipelineOrchestrator = null;
        
        // Memory storage structures
        this.memory = {
            // Usage pattern memory
            usagePatterns: {
                hourlyPatterns: new Map(),      // Hour of day → usage stats
                dailyPatterns: new Map(),       // Day of week → usage stats  
                weeklyPatterns: new Map(),      // Week of year → usage stats
                monthlyPatterns: new Map(),     // Month → usage stats
                seasonalPatterns: new Map()     // Season → usage stats
            },
            
            // Limit behavior memory
            limitBehaviors: {
                limitHits: [],                  // Historical limit hits with context
                resetTimes: [],                 // Actual reset time observations
                timezoneConfusion: [],          // Timezone confusion incidents
                warningEffectiveness: new Map() // How effective warnings were
            },
            
            // Workflow memory
            workflowPatterns: {
                productiveHours: new Map(),     // Hour → productivity score
                workflowEfficiency: new Map(),  // Workflow type → efficiency
                contextSwitching: [],           // Context switch patterns
                deepWorkSessions: []            // Deep work session patterns
            },
            
            // Prediction memory
            predictions: {
                made: [],                       // Predictions made
                accuracy: new Map(),            // Prediction type → accuracy stats
                false_positives: [],           // Wrong predictions
                false_negatives: [],           // Missed predictions
                learningAdjustments: []        // Adjustments made to improve accuracy
            },
            
            // Meta-memory (learning about learning)
            metaMemory: {
                systemPerformance: [],          // How well the system is learning
                userBehaviorChanges: [],        // Changes in user behavior over time
                effectivenessMetrics: new Map(), // What interventions work
                systemEvolution: []             // How the system has evolved
            }
        };
        
        // Current state and active learning
        this.currentState = {
            learningActive: false,
            lastAnalysis: null,
            activePredictions: new Map(),
            recentObservations: [],
            adaptationQueue: [],
            
            // Real-time pattern tracking
            sessionPatterns: {
                startTime: Date.now(),
                usageTrajectory: [],
                predictionAccuracy: 0,
                adaptationsApplied: 0
            }
        };
        
        // Pattern recognition algorithms
        this.patternRecognition = {
            // Time-based pattern detection
            timePatterns: {
                findCyclicPatterns: this.findCyclicPatterns.bind(this),
                detectAnomalies: this.detectAnomalies.bind(this),
                predictNextCycle: this.predictNextCycle.bind(this)
            },
            
            // Usage behavior pattern detection
            usagePatterns: {
                identifyUsageTypes: this.identifyUsageTypes.bind(this),
                detectWorkflowShifts: this.detectWorkflowShifts.bind(this),
                predictUsageSpikes: this.predictUsageSpikes.bind(this)
            },
            
            // Learning pattern optimization
            learningOptimization: {
                adjustLearningRates: this.adjustLearningRates.bind(this),
                optimizePredictionModels: this.optimizePredictionModels.bind(this),
                adaptToUserChanges: this.adaptToUserChanges.bind(this)
            }
        };
        
        this.init();
    }
    
    async init() {
        try {
            console.log('⏰ Initializing Timeline Memory System...');
            
            // Create memory directories
            await this.createMemoryDirectories();
            
            // Load existing memory
            await this.loadMemoryFromDisk();
            
            // Initialize integrated systems
            await this.initializeIntegrations();
            
            // Start memory collection
            this.startMemoryCollection();
            
            // Start pattern analysis
            this.startPatternAnalysis();
            
            // Start predictive system
            if (this.config.enableProactivePredictions) {
                this.startPredictiveSystem();
            }
            
            // Start learning loops
            this.startLearningLoops();
            
            console.log('✅ Timeline Memory System ready');
            console.log(`🧠 Learning mode: ${this.config.learningMode}`);
            console.log(`🎯 Target accuracy: ${(this.config.predictionAccuracy * 100).toFixed(1)}%`);
            console.log(`📊 Memory retention: ${this.config.memoryRetention.longTerm} days`);
            console.log(`⚡ Proactive predictions: ${this.config.enableProactivePredictions ? 'ENABLED' : 'DISABLED'}`);
            
            this.currentState.learningActive = true;
            
            this.emit('memory_system_ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Timeline Memory System:', error.message);
            this.emit('memory_system_error', error);
        }
    }
    
    /**
     * Initialize integrations with other systems
     */
    async initializeIntegrations() {
        console.log('🔗 Initializing system integrations...');
        
        // Integrate with Personal Usage Monitor
        if (this.config.integrateWithUsageMonitor) {
            try {
                this.usageMonitor = new PersonalUsageLimitMonitor({
                    userId: 'timeline_memory_user'
                });
                
                // Listen for usage events
                this.usageMonitor.on('usage_recorded', (interaction) => {
                    this.recordUsageObservation(interaction);
                });
                
                this.usageMonitor.on('usage_warning', (warning) => {
                    this.recordLimitBehavior('warning_issued', warning);
                });
                
                this.usageMonitor.on('daily_reset', (data) => {
                    this.recordLimitBehavior('daily_reset', data);
                });
                
                this.usageMonitor.on('timezone_issue_detected', (issue) => {
                    this.recordTimezoneConfusion(issue);
                });
                
                console.log('✅ Integrated with Personal Usage Limit Monitor');
                
            } catch (error) {
                console.warn('⚠️ Could not integrate with Usage Monitor:', error.message);
            }
        }
        
        // Integrate with Usage Analyzer
        if (this.config.integrateWithAnalyzer) {
            try {
                this.usageAnalyzer = new PersonalLLMUsageAnalyzer({
                    userId: 'timeline_memory_user'
                });
                
                this.usageAnalyzer.on('personal_usage_analyzed', (data) => {
                    this.recordWorkflowPattern(data);
                });
                
                console.log('✅ Integrated with Personal LLM Usage Analyzer');
                
            } catch (error) {
                console.warn('⚠️ Could not integrate with Usage Analyzer:', error.message);
            }
        }
        
        // Integrate with Pipeline Orchestrator
        if (this.config.integrateWithPipeline) {
            try {
                this.pipelineOrchestrator = new DocumentationPipelineOrchestrator({
                    enablePipelineAnalytics: true
                });
                
                this.pipelineOrchestrator.on('devlog_entry_routed', (data) => {
                    this.recordDocumentationPattern('devlog_routed', data);
                });
                
                this.pipelineOrchestrator.on('magazine_published_with_pipeline_analysis', (data) => {
                    this.recordDocumentationPattern('magazine_published', data);
                });
                
                console.log('✅ Integrated with Documentation Pipeline Orchestrator');
                
            } catch (error) {
                console.warn('⚠️ Could not integrate with Pipeline Orchestrator:', error.message);
            }
        }
    }
    
    /**
     * Record a usage observation for pattern learning
     */
    async recordUsageObservation(interaction) {
        const observation = {
            timestamp: Date.now(),
            type: 'usage_observation',
            data: {
                tokensUsed: interaction.tokensUsed,
                requestType: interaction.requestType,
                projectPhase: interaction.projectPhase,
                urgency: interaction.urgency,
                hour: new Date().getHours(),
                dayOfWeek: new Date().getDay(),
                weekOfYear: this.getWeekOfYear(),
                month: new Date().getMonth()
            }
        };
        
        // Add to recent observations
        this.currentState.recentObservations.push(observation);
        
        // Keep only recent observations
        if (this.currentState.recentObservations.length > 100) {
            this.currentState.recentObservations = this.currentState.recentObservations.slice(-50);
        }
        
        // Update usage patterns
        await this.updateUsagePatterns(observation);
        
        // Check for immediate predictions
        await this.evaluateImmediatePredictions(observation);
        
        console.log(`🧠 Recorded usage observation: ${interaction.tokensUsed} tokens at ${observation.data.hour}:00`);
    }
    
    /**
     * Record limit behavior for learning
     */
    async recordLimitBehavior(behaviorType, data) {
        const behavior = {
            timestamp: Date.now(),
            type: behaviorType,
            data: data,
            context: {
                hour: new Date().getHours(),
                dayOfWeek: new Date().getDay(),
                recentUsage: this.getRecentUsageContext()
            }
        };
        
        this.memory.limitBehaviors[behaviorType === 'warning_issued' ? 'warningEffectiveness' : 'limitHits'].push
        
        if (behaviorType === 'daily_reset') {
            this.memory.limitBehaviors.resetTimes.push({
                actualTime: behavior.timestamp,
                expectedTime: this.calculateExpectedResetTime(),
                timeDiff: this.calculateTimeDifference(behavior.timestamp)
            });
        }
        
        // Learn from this behavior
        await this.learnFromLimitBehavior(behavior);
        
        console.log(`📊 Recorded limit behavior: ${behaviorType} at ${new Date().toTimeString()}`);
    }
    
    /**
     * Record timezone confusion incidents
     */
    async recordTimezoneConfusion(issue) {
        const confusion = {
            timestamp: Date.now(),
            issue: issue,
            context: {
                expectedReset: issue.suspectedResetTime,
                actualTime: issue.currentTime,
                usageAtTime: await this.getCurrentUsageLevel()
            }
        };
        
        this.memory.limitBehaviors.timezoneConfusion.push(confusion);
        
        // This is a critical learning opportunity
        await this.learnFromTimezoneConfusion(confusion);
        
        console.log(`⚠️ Recorded timezone confusion: Expected ${issue.suspectedResetTime}, Actual ${issue.currentTime}`);
        
        this.emit('timezone_confusion_learned', confusion);
    }
    
    /**
     * Record workflow patterns for optimization
     */
    async recordWorkflowPattern(analysisData) {
        const pattern = {
            timestamp: Date.now(),
            efficiency: analysisData.efficiency,
            profile: analysisData.profile,
            insights: analysisData.insights,
            adaptations: analysisData.adaptations,
            context: {
                hour: new Date().getHours(),
                dayOfWeek: new Date().getDay()
            }
        };
        
        // Update workflow memory
        const hour = pattern.context.hour;
        if (!this.memory.workflowPatterns.productiveHours.has(hour)) {
            this.memory.workflowPatterns.productiveHours.set(hour, []);
        }
        
        this.memory.workflowPatterns.productiveHours.get(hour).push({
            efficiency: pattern.efficiency,
            timestamp: pattern.timestamp
        });
        
        // Learn optimal workflow patterns
        await this.learnWorkflowOptimizations(pattern);
        
        console.log(`⚡ Recorded workflow pattern: ${(pattern.efficiency * 100).toFixed(1)}% efficiency at ${hour}:00`);
    }
    
    /**
     * Update usage patterns based on observations
     */
    async updateUsagePatterns(observation) {
        const { hour, dayOfWeek, weekOfYear, month } = observation.data;
        const tokensUsed = observation.data.tokensUsed;
        
        // Update hourly patterns
        if (!this.memory.usagePatterns.hourlyPatterns.has(hour)) {
            this.memory.usagePatterns.hourlyPatterns.set(hour, {
                totalUsage: 0,
                observations: 0,
                averageUsage: 0,
                peakUsage: 0,
                usageHistory: []
            });
        }
        
        const hourlyPattern = this.memory.usagePatterns.hourlyPatterns.get(hour);
        hourlyPattern.totalUsage += tokensUsed;
        hourlyPattern.observations++;
        hourlyPattern.averageUsage = hourlyPattern.totalUsage / hourlyPattern.observations;
        hourlyPattern.peakUsage = Math.max(hourlyPattern.peakUsage, tokensUsed);
        hourlyPattern.usageHistory.push({ timestamp: observation.timestamp, usage: tokensUsed });
        
        // Keep history manageable
        if (hourlyPattern.usageHistory.length > 100) {
            hourlyPattern.usageHistory = hourlyPattern.usageHistory.slice(-50);
        }
        
        // Update daily patterns
        this.updateDailyPattern(dayOfWeek, tokensUsed, observation.timestamp);
        
        // Update weekly and monthly patterns
        this.updateWeeklyPattern(weekOfYear, tokensUsed);
        this.updateMonthlyPattern(month, tokensUsed);
    }
    
    /**
     * Start pattern analysis system
     */
    startPatternAnalysis() {
        console.log('📊 Starting pattern analysis...');
        
        // Analyze patterns every 15 minutes
        setInterval(async () => {
            await this.performPatternAnalysis();
        }, 15 * 60 * 1000);
        
        // Initial analysis
        setTimeout(() => this.performPatternAnalysis(), 60000);
    }
    
    /**
     * Perform comprehensive pattern analysis
     */
    async performPatternAnalysis() {
        console.log('🔍 Performing pattern analysis...');
        
        try {
            // Analyze usage patterns
            const usageInsights = await this.analyzeUsagePatterns();
            
            // Analyze limit behaviors  
            const limitInsights = await this.analyzeLimitBehaviors();
            
            // Analyze workflow patterns
            const workflowInsights = await this.analyzeWorkflowPatterns();
            
            // Generate predictions
            const predictions = await this.generatePredictions(usageInsights, limitInsights, workflowInsights);
            
            // Update learning models
            await this.updateLearningModels(usageInsights, limitInsights, workflowInsights);
            
            const analysis = {
                timestamp: Date.now(),
                usageInsights,
                limitInsights,
                workflowInsights,
                predictions,
                recommendedActions: this.generateRecommendedActions(predictions)
            };
            
            this.currentState.lastAnalysis = analysis;
            
            console.log(`✅ Pattern analysis complete: ${predictions.length} predictions generated`);
            
            this.emit('pattern_analysis_complete', analysis);
            
        } catch (error) {
            console.error('❌ Pattern analysis failed:', error.message);
        }
    }
    
    /**
     * Analyze usage patterns for insights
     */
    async analyzeUsagePatterns() {
        const insights = {
            peakUsageHours: [],
            lowUsageHours: [],
            cyclicPatterns: [],
            anomalies: [],
            trends: []
        };
        
        // Analyze hourly patterns
        for (const [hour, pattern] of this.memory.usagePatterns.hourlyPatterns.entries()) {
            if (pattern.averageUsage > 0) {
                if (pattern.averageUsage > 5000) { // High usage threshold
                    insights.peakUsageHours.push({
                        hour,
                        averageUsage: pattern.averageUsage,
                        peakUsage: pattern.peakUsage
                    });
                } else if (pattern.averageUsage < 1000) { // Low usage threshold
                    insights.lowUsageHours.push({
                        hour,
                        averageUsage: pattern.averageUsage
                    });
                }
            }
        }
        
        // Find cyclic patterns
        insights.cyclicPatterns = await this.patternRecognition.timePatterns.findCyclicPatterns(
            this.memory.usagePatterns.hourlyPatterns
        );
        
        // Detect anomalies
        insights.anomalies = await this.patternRecognition.timePatterns.detectAnomalies(
            this.currentState.recentObservations
        );
        
        return insights;
    }
    
    /**
     * Analyze limit behaviors for patterns
     */
    async analyzeLimitBehaviors() {
        const insights = {
            resetTimeBehavior: null,
            warningEffectiveness: 0,
            timezoneIssues: [],
            limitHitPatterns: []
        };
        
        // Analyze reset time behavior
        if (this.memory.limitBehaviors.resetTimes.length > 0) {
            const resetTimes = this.memory.limitBehaviors.resetTimes;
            const avgTimeDiff = resetTimes.reduce((sum, reset) => sum + reset.timeDiff, 0) / resetTimes.length;
            
            insights.resetTimeBehavior = {
                consistentResetTime: Math.abs(avgTimeDiff) < 30 * 60 * 1000, // Within 30 minutes
                averageTimeDiff: avgTimeDiff,
                resetTimeVariability: this.calculateResetTimeVariability(resetTimes)
            };
        }
        
        // Analyze timezone confusion
        insights.timezoneIssues = this.memory.limitBehaviors.timezoneConfusion.map(confusion => ({
            timestamp: confusion.timestamp,
            expectedVsActual: confusion.context.expectedReset,
            severity: this.calculateTimezoneConfusionSeverity(confusion)
        }));
        
        return insights;
    }
    
    /**
     * Analyze workflow patterns for optimization opportunities
     */
    async analyzeWorkflowPatterns() {
        const insights = {
            mostProductiveHours: [],
            leastProductiveHours: [],
            workflowOptimizations: [],
            efficiencyTrends: []
        };
        
        // Analyze productive hours
        for (const [hour, efficiencies] of this.memory.workflowPatterns.productiveHours.entries()) {
            if (efficiencies.length > 0) {
                const avgEfficiency = efficiencies.reduce((sum, e) => sum + e.efficiency, 0) / efficiencies.length;
                
                if (avgEfficiency > 0.8) {
                    insights.mostProductiveHours.push({ hour, avgEfficiency });
                } else if (avgEfficiency < 0.5) {
                    insights.leastProductiveHours.push({ hour, avgEfficiency });
                }
            }
        }
        
        // Sort by efficiency
        insights.mostProductiveHours.sort((a, b) => b.avgEfficiency - a.avgEfficiency);
        insights.leastProductiveHours.sort((a, b) => a.avgEfficiency - b.avgEfficiency);
        
        return insights;
    }
    
    /**
     * Generate predictions based on learned patterns
     */
    async generatePredictions(usageInsights, limitInsights, workflowInsights) {
        const predictions = [];
        const currentHour = new Date().getHours();
        
        // Predict limit approach based on usage patterns
        const limitPrediction = await this.predictLimitApproach(usageInsights, currentHour);
        if (limitPrediction) {
            predictions.push(limitPrediction);
        }
        
        // Predict productivity windows
        const productivityPrediction = await this.predictProductivityWindows(workflowInsights, currentHour);
        if (productivityPrediction) {
            predictions.push(productivityPrediction);
        }
        
        // Predict timezone issues
        const timezonePrediction = await this.predictTimezoneIssues(limitInsights);
        if (timezonePrediction) {
            predictions.push(timezonePrediction);
        }
        
        // Store predictions for accuracy tracking
        predictions.forEach(prediction => {
            prediction.id = `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            prediction.madeAt = Date.now();
            this.memory.predictions.made.push(prediction);
            this.currentState.activePredictions.set(prediction.id, prediction);
        });
        
        return predictions;
    }
    
    /**
     * Predict when user might approach usage limits
     */
    async predictLimitApproach(usageInsights, currentHour) {
        // Get current usage trajectory
        const recentUsage = this.currentState.recentObservations
            .filter(obs => Date.now() - obs.timestamp < 2 * 60 * 60 * 1000) // Last 2 hours
            .reduce((sum, obs) => sum + obs.data.tokensUsed, 0);
        
        // Get historical patterns for current hour
        const hourlyPattern = this.memory.usagePatterns.hourlyPatterns.get(currentHour);
        if (!hourlyPattern) return null;
        
        // Calculate predicted trajectory
        const avgHourlyUsage = hourlyPattern.averageUsage;
        const currentUsage = await this.getCurrentUsageLevel();
        const hoursUntilReset = await this.getHoursUntilReset();
        
        const projectedUsage = currentUsage + (avgHourlyUsage * hoursUntilReset);
        const dailyLimit = 200000; // Default limit
        
        if (projectedUsage > dailyLimit * 0.9) {
            return {
                type: 'limit_approach_warning',
                severity: projectedUsage > dailyLimit ? 'critical' : 'warning',
                projectedUsage,
                currentUsage,
                timeToLimit: this.calculateTimeToLimit(currentUsage, avgHourlyUsage, dailyLimit),
                confidence: this.calculatePredictionConfidence('limit_approach', hourlyPattern),
                recommendations: [
                    'Reduce token usage per request',
                    'Batch similar requests',
                    'Consider pausing non-essential work',
                    'Plan remaining work carefully'
                ]
            };
        }
        
        return null;
    }
    
    /**
     * Predict optimal productivity windows
     */
    async predictProductivityWindows(workflowInsights, currentHour) {
        const upcomingHours = [];
        
        // Look ahead 8 hours
        for (let i = 1; i <= 8; i++) {
            const futureHour = (currentHour + i) % 24;
            const productiveHour = workflowInsights.mostProductiveHours.find(h => h.hour === futureHour);
            
            if (productiveHour) {
                upcomingHours.push({
                    hour: futureHour,
                    efficiency: productiveHour.avgEfficiency,
                    hoursFromNow: i
                });
            }
        }
        
        if (upcomingHours.length > 0) {
            return {
                type: 'productivity_window_prediction',
                upcomingProductiveHours: upcomingHours,
                nextBestHour: upcomingHours[0],
                confidence: 0.75,
                recommendations: [
                    `Peak productivity predicted at ${upcomingHours[0].hour}:00`,
                    'Plan complex tasks for high-efficiency windows',
                    'Use low-productivity hours for planning and setup'
                ]
            };
        }
        
        return null;
    }
    
    /**
     * Start predictive system for proactive warnings
     */
    startPredictiveSystem() {
        console.log('🔮 Starting predictive system...');
        
        // Make predictions every 30 minutes
        setInterval(async () => {
            await this.makePredictionsAndAlerts();
        }, 30 * 60 * 1000);
        
        // Evaluate prediction accuracy every hour
        setInterval(async () => {
            await this.evaluatePredictionAccuracy();
        }, 60 * 60 * 1000);
    }
    
    /**
     * Make predictions and issue proactive alerts
     */
    async makePredictionsAndAlerts() {
        if (!this.currentState.lastAnalysis) return;
        
        const predictions = this.currentState.lastAnalysis.predictions;
        
        for (const prediction of predictions) {
            if (prediction.type === 'limit_approach_warning' && prediction.severity === 'critical') {
                console.log('🚨 PROACTIVE ALERT: Limit approach predicted');
                console.log(`📊 Projected usage: ${prediction.projectedUsage.toLocaleString()} tokens`);
                console.log(`⏰ Time to limit: ${prediction.timeToLimit}`);
                
                this.emit('proactive_limit_warning', prediction);
            }
            
            if (prediction.type === 'productivity_window_prediction' && prediction.nextBestHour.hoursFromNow <= 2) {
                console.log(`⚡ PRODUCTIVITY ALERT: Peak efficiency window in ${prediction.nextBestHour.hoursFromNow} hours`);
                
                this.emit('productivity_window_alert', prediction);
            }
        }
    }
    
    /**
     * Start learning loops for continuous improvement
     */
    startLearningLoops() {
        console.log('🧠 Starting learning loops...');
        
        // Adapt learning rates every 6 hours
        setInterval(async () => {
            await this.adaptLearningRates();
        }, 6 * 60 * 60 * 1000);
        
        // Optimize prediction models daily
        setInterval(async () => {
            await this.optimizePredictionModels();
        }, 24 * 60 * 60 * 1000);
        
        // Clean and compress memory weekly
        setInterval(async () => {
            await this.cleanAndCompressMemory();
        }, 7 * 24 * 60 * 60 * 1000);
    }
    
    /**
     * Learn from timezone confusion incidents
     */
    async learnFromTimezoneConfusion(confusion) {
        console.log('🧠 Learning from timezone confusion incident...');
        
        // This is critical - we need to adjust our understanding of reset times
        const actualResetHour = new Date(confusion.timestamp).getHours();
        
        // Update our internal timezone knowledge
        this.memory.limitBehaviors.resetTimes.push({
            actualTime: confusion.timestamp,
            observedHour: actualResetHour,
            previousExpectation: confusion.issue.suspectedResetTime,
            confidence: 0.9 // High confidence since this is observed behavior
        });
        
        // Adjust prediction models
        await this.adjustResetTimePredictions(actualResetHour);
        
        console.log(`🎯 Learned: Limits likely reset at ${actualResetHour}:00, not at expected time`);
    }
    
    /**
     * Pattern recognition implementations
     */
    async findCyclicPatterns(hourlyPatterns) {
        const cycles = [];
        const hours = Array.from(hourlyPatterns.keys()).sort((a, b) => a - b);
        
        // Look for daily cycles (repeating every 24 hours)
        if (hours.length >= 24) {
            const morningUsage = hours.slice(6, 12).reduce((sum, hour) => {
                const pattern = hourlyPatterns.get(hour);
                return sum + (pattern ? pattern.averageUsage : 0);
            }, 0) / 6;
            
            const afternoonUsage = hours.slice(12, 18).reduce((sum, hour) => {
                const pattern = hourlyPatterns.get(hour);
                return sum + (pattern ? pattern.averageUsage : 0);
            }, 0) / 6;
            
            const eveningUsage = hours.slice(18, 24).reduce((sum, hour) => {
                const pattern = hourlyPatterns.get(hour);
                return sum + (pattern ? pattern.averageUsage : 0);
            }, 0) / 6;
            
            cycles.push({
                type: 'daily_cycle',
                pattern: 'morning_afternoon_evening',
                phases: {
                    morning: morningUsage,
                    afternoon: afternoonUsage,
                    evening: eveningUsage
                },
                strength: this.calculateCycleStrength([morningUsage, afternoonUsage, eveningUsage])
            });
        }
        
        return cycles;
    }
    
    async detectAnomalies(observations) {
        const anomalies = [];
        
        if (observations.length < 10) return anomalies;
        
        // Calculate baseline metrics
        const usageValues = observations.map(obs => obs.data.tokensUsed);
        const mean = usageValues.reduce((sum, val) => sum + val, 0) / usageValues.length;
        const variance = usageValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / usageValues.length;
        const stdDev = Math.sqrt(variance);
        
        // Find outliers (values more than 2 standard deviations from mean)
        observations.forEach(obs => {
            const deviation = Math.abs(obs.data.tokensUsed - mean) / stdDev;
            if (deviation > 2) {
                anomalies.push({
                    timestamp: obs.timestamp,
                    tokensUsed: obs.data.tokensUsed,
                    deviation,
                    expectedRange: [mean - 2 * stdDev, mean + 2 * stdDev],
                    severity: deviation > 3 ? 'high' : 'medium'
                });
            }
        });
        
        return anomalies;
    }
    
    // Utility methods
    getWeekOfYear() {
        const date = new Date();
        const start = new Date(date.getFullYear(), 0, 1);
        return Math.ceil((((date - start) / 86400000) + start.getDay() + 1) / 7);
    }
    
    updateDailyPattern(dayOfWeek, tokensUsed, timestamp) {
        if (!this.memory.usagePatterns.dailyPatterns.has(dayOfWeek)) {
            this.memory.usagePatterns.dailyPatterns.set(dayOfWeek, {
                totalUsage: 0,
                observations: 0,
                averageUsage: 0,
                history: []
            });
        }
        
        const dailyPattern = this.memory.usagePatterns.dailyPatterns.get(dayOfWeek);
        dailyPattern.totalUsage += tokensUsed;
        dailyPattern.observations++;
        dailyPattern.averageUsage = dailyPattern.totalUsage / dailyPattern.observations;
        dailyPattern.history.push({ timestamp, usage: tokensUsed });
    }
    
    updateWeeklyPattern(weekOfYear, tokensUsed) {
        if (!this.memory.usagePatterns.weeklyPatterns.has(weekOfYear)) {
            this.memory.usagePatterns.weeklyPatterns.set(weekOfYear, {
                totalUsage: 0,
                observations: 0,
                averageUsage: 0
            });
        }
        
        const weeklyPattern = this.memory.usagePatterns.weeklyPatterns.get(weekOfYear);
        weeklyPattern.totalUsage += tokensUsed;
        weeklyPattern.observations++;
        weeklyPattern.averageUsage = weeklyPattern.totalUsage / weeklyPattern.observations;
    }
    
    updateMonthlyPattern(month, tokensUsed) {
        if (!this.memory.usagePatterns.monthlyPatterns.has(month)) {
            this.memory.usagePatterns.monthlyPatterns.set(month, {
                totalUsage: 0,
                observations: 0,
                averageUsage: 0
            });
        }
        
        const monthlyPattern = this.memory.usagePatterns.monthlyPatterns.get(month);
        monthlyPattern.totalUsage += tokensUsed;
        monthlyPattern.observations++;
        monthlyPattern.averageUsage = monthlyPattern.totalUsage / monthlyPattern.observations;
    }
    
    calculateCycleStrength(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return variance > 0 ? Math.min(1.0, variance / (mean * mean)) : 0;
    }
    
    async getCurrentUsageLevel() {
        if (this.usageMonitor) {
            const status = this.usageMonitor.getUsageStatus();
            return status.current.tokensUsed;
        }
        return 0;
    }
    
    async getHoursUntilReset() {
        if (this.usageMonitor) {
            const status = this.usageMonitor.getUsageStatus();
            return status.timing.hoursUntilReset;
        }
        return 12; // Default assumption
    }
    
    calculateTimeToLimit(currentUsage, avgHourlyUsage, dailyLimit) {
        const remainingTokens = dailyLimit - currentUsage;
        if (avgHourlyUsage <= 0) return 'Unknown';
        
        const hoursToLimit = remainingTokens / avgHourlyUsage;
        
        if (hoursToLimit < 1) {
            return `${Math.ceil(hoursToLimit * 60)} minutes`;
        } else {
            return `${Math.ceil(hoursToLimit)} hours`;
        }
    }
    
    calculatePredictionConfidence(predictionType, patternData) {
        // Base confidence on amount of historical data
        const dataPoints = patternData.observations || 1;
        const baseConfidence = Math.min(0.9, dataPoints / 100);
        
        // Adjust based on pattern consistency
        const consistencyFactor = patternData.usageHistory ? 
            this.calculatePatternConsistency(patternData.usageHistory) : 0.5;
        
        return baseConfidence * consistencyFactor;
    }
    
    calculatePatternConsistency(history) {
        if (history.length < 3) return 0.5;
        
        const values = history.map(h => h.usage);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const coefficientOfVariation = Math.sqrt(variance) / mean;
        
        // Lower coefficient of variation = higher consistency
        return Math.max(0.1, 1 - Math.min(1.0, coefficientOfVariation));
    }
    
    generateRecommendedActions(predictions) {
        const actions = [];
        
        predictions.forEach(prediction => {
            if (prediction.recommendations) {
                actions.push({
                    predictionId: prediction.id,
                    type: prediction.type,
                    severity: prediction.severity || 'medium',
                    actions: prediction.recommendations
                });
            }
        });
        
        return actions;
    }
    
    // File operations and persistence
    async createMemoryDirectories() {
        const dirs = ['usage-patterns', 'limit-behaviors', 'workflow-patterns', 'predictions', 'meta-memory', 'backups'];
        
        for (const dir of dirs) {
            await fs.mkdir(path.join(this.config.memoryDir, dir), { recursive: true });
        }
    }
    
    async loadMemoryFromDisk() {
        console.log('📚 Loading memory from disk...');
        // Placeholder for loading memory from persistent storage
    }
    
    async saveMemoryToDisk() {
        console.log('💾 Saving memory to disk...');
        // Placeholder for saving memory to persistent storage
    }
    
    // Placeholder implementations for missing methods
    getRecentUsageContext() { return {}; }
    calculateExpectedResetTime() { return Date.now(); }
    calculateTimeDifference() { return 0; }
    learnFromLimitBehavior() {}
    learnWorkflowOptimizations() {}
    evaluateImmediatePredictions() {}
    updateLearningModels() {}
    calculateResetTimeVariability() { return 0; }
    calculateTimezoneConfusionSeverity() { return 'medium'; }
    predictTimezoneIssues() { return null; }
    adjustResetTimePredictions() {}
    adaptLearningRates() {}
    optimizePredictionModels() {}
    cleanAndCompressMemory() {}
    evaluatePredictionAccuracy() {}
    recordDocumentationPattern() {}
    predictNextCycle() {}
    identifyUsageTypes() {}
    detectWorkflowShifts() {}
    predictUsageSpikes() {}
    adjustLearningRates() {}
    adaptToUserChanges() {}
    startMemoryCollection() {}
    
    /**
     * Get comprehensive system status
     */
    getSystemStatus() {
        return {
            learningActive: this.currentState.learningActive,
            memorySize: {
                usagePatterns: this.memory.usagePatterns.hourlyPatterns.size,
                limitBehaviors: this.memory.limitBehaviors.limitHits.length,
                workflowPatterns: this.memory.workflowPatterns.productiveHours.size,
                predictions: this.memory.predictions.made.length
            },
            currentPredictions: this.currentState.activePredictions.size,
            lastAnalysis: this.currentState.lastAnalysis?.timestamp,
            integrations: {
                usageMonitor: !!this.usageMonitor,
                usageAnalyzer: !!this.usageAnalyzer,
                pipelineOrchestrator: !!this.pipelineOrchestrator
            },
            learningRates: this.config.learningRates,
            targetAccuracy: this.config.predictionAccuracy
        };
    }
}

// Export for integration
module.exports = TimelineMemorySystem;

// CLI interface and testing
if (require.main === module) {
    console.log('⏰ Starting Timeline Memory System...\n');
    
    const memorySystem = new TimelineMemorySystem({
        learningMode: 'adaptive',
        targetAccuracy: 0.85,
        enableProactivePredictions: true
    });
    
    // Event listeners
    memorySystem.on('memory_system_ready', () => {
        console.log('✅ Timeline Memory System ready');
    });
    
    memorySystem.on('pattern_analysis_complete', (analysis) => {
        console.log(`📊 Analysis complete: ${analysis.predictions.length} predictions, ${analysis.usageInsights.peakUsageHours.length} peak hours identified`);
    });
    
    memorySystem.on('proactive_limit_warning', (prediction) => {
        console.log(`🚨 PROACTIVE WARNING: Limit approach predicted with ${(prediction.confidence * 100).toFixed(1)}% confidence`);
    });
    
    memorySystem.on('productivity_window_alert', (prediction) => {
        console.log(`⚡ PRODUCTIVITY ALERT: Peak window at ${prediction.nextBestHour.hour}:00 (${(prediction.nextBestHour.efficiency * 100).toFixed(1)}% efficiency)`);
    });
    
    memorySystem.on('timezone_confusion_learned', (confusion) => {
        console.log(`🧠 LEARNING: Timezone confusion pattern recorded and learned`);
    });
    
    // Test system status
    setTimeout(() => {
        const status = memorySystem.getSystemStatus();
        console.log('\n📊 System Status:');
        console.log(`Learning active: ${status.learningActive}`);
        console.log(`Memory patterns: ${status.memorySize.usagePatterns}`);
        console.log(`Active predictions: ${status.currentPredictions}`);
        console.log(`Integrations: Monitor: ${status.integrations.usageMonitor}, Analyzer: ${status.integrations.usageAnalyzer}, Pipeline: ${status.integrations.pipelineOrchestrator}`);
        console.log(`Target accuracy: ${(status.targetAccuracy * 100).toFixed(1)}%`);
    }, 5000);
}