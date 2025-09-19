#!/usr/bin/env node

/**
 * 📊🚦 RATE LIMIT ANALYZER
 * 
 * Advanced rate limiting analysis system that extends existing api-rate-limiter.js.
 * Analyzes platform generation workloads, predicts rate limit breaches, calculates
 * generation odds, optimizes user tier assignments, and provides intelligent
 * throttling recommendations for the integration pipeline.
 * 
 * Determines "if we're on rate or not on rate" and how to phrase/answer prompts accordingly.
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;

// Import existing rate limiter
const APIRateLimiter = require('./api-rate-limiter.js');

console.log(`
📊🚦 RATE LIMIT ANALYZER 📊🚦
=============================
Workload Analysis | Predictive Throttling | Generation Odds Calculation
Rate Limiting Intelligence for Platform Generation Pipeline
`);

class RateLimitAnalyzer extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            // Analysis settings
            analysis: {
                predictionWindow: 300000, // 5 minutes prediction window
                minDataPoints: 10, // Minimum requests for analysis
                anomalyThreshold: 2.5, // Standard deviations for anomaly detection
                generationCostMultiplier: 5, // Platform generation costs 5x normal requests
                batchProcessingThreshold: 0.8 // When to recommend batch processing
            },
            
            // Platform generation workload profiles
            workloadProfiles: {
                'simple_platform': {
                    description: 'Basic website with few components',
                    estimatedRequests: 15,
                    averageProcessingTime: 30000, // 30 seconds
                    rateLimitWeight: 1.0,
                    successProbability: 0.95
                },
                'moderate_platform': {
                    description: 'Medium complexity app with multiple features',
                    estimatedRequests: 45,
                    averageProcessingTime: 120000, // 2 minutes
                    rateLimitWeight: 2.5,
                    successProbability: 0.85
                },
                'complex_platform': {
                    description: 'Full-featured platform with advanced components',
                    estimatedRequests: 120,
                    averageProcessingTime: 300000, // 5 minutes
                    rateLimitWeight: 5.0,
                    successProbability: 0.70
                },
                'enterprise_platform': {
                    description: 'Enterprise-grade platform with custom integrations',
                    estimatedRequests: 300,
                    averageProcessingTime: 600000, // 10 minutes
                    rateLimitWeight: 8.0,
                    successProbability: 0.60
                }
            },
            
            // Tier upgrade recommendations
            tierRecommendations: {
                'free_to_basic': {
                    threshold: 0.6,
                    confidence: 0.8,
                    description: 'Frequent rate limiting detected'
                },
                'basic_to_pro': {
                    threshold: 0.7,
                    confidence: 0.85,
                    description: 'High-frequency generation patterns'
                },
                'pro_to_enterprise': {
                    threshold: 0.8,
                    confidence: 0.9,
                    description: 'Enterprise workload characteristics'
                }
            },
            
            // Throttling strategies
            throttlingStrategies: {
                'queue_and_batch': {
                    description: 'Queue requests and process in batches',
                    applicableWhen: 'high_volume_low_urgency',
                    effectiveness: 0.8
                },
                'progressive_delay': {
                    description: 'Gradually increase delays between requests',
                    applicableWhen: 'consistent_overuse',
                    effectiveness: 0.7
                },
                'tier_upgrade_suggest': {
                    description: 'Recommend tier upgrade for better limits',
                    applicableWhen: 'frequent_limit_hits',
                    effectiveness: 0.9
                },
                'off_peak_scheduling': {
                    description: 'Schedule generation during off-peak hours',
                    applicableWhen: 'non_urgent_requests',
                    effectiveness: 0.6
                }
            }
        };
        
        // Analysis state
        this.analysisState = {
            // Request patterns
            requestPatterns: new Map(),
            
            // User behavior analysis
            userBehaviorProfiles: new Map(),
            
            // Rate limit predictions
            predictions: new Map(),
            
            // Generation odds calculations
            generationOdds: new Map(),
            
            // Workload analysis results
            workloadAnalysis: new Map(),
            
            // Performance metrics
            metrics: {
                totalAnalyses: 0,
                accuratePredictions: 0,
                averageAnalysisTime: 0,
                tierUpgradeRecommendations: 0
            }
        };
        
        // Initialize extended rate limiter
        this.rateLimiter = null;
        
        console.log('📊 Rate Limit Analyzer initialized');
        console.log(`🎯 Workload profiles: ${Object.keys(this.config.workloadProfiles).length}`);
        console.log(`🔄 Throttling strategies: ${Object.keys(this.config.throttlingStrategies).length}`);
        console.log(`📈 Tier recommendations: ${Object.keys(this.config.tierRecommendations).length}`);
        
        this.initialize();
    }
    
    /**
     * Initialize the rate limit analyzer
     */
    async initialize() {
        try {
            // Initialize extended rate limiter with platform-specific tiers
            await this.initializeExtendedRateLimiter();
            
            // Load historical analysis data
            await this.loadAnalysisHistory();
            
            // Start pattern monitoring
            this.startPatternMonitoring();
            
            // Initialize workload profiling
            this.initializeWorkloadProfiling();
            
            console.log('✅ Rate Limit Analyzer system ready');
            this.emit('analyzer_initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Rate Limit Analyzer:', error.message);
            this.emit('analyzer_error', error);
        }
    }
    
    /**
     * Initialize extended rate limiter with platform generation tiers
     */
    async initializeExtendedRateLimiter() {
        console.log('\n🚦 Initializing extended rate limiter...');
        
        // Platform generation specific tiers
        const platformTiers = {
            free: {
                limit: 30, // Lower for platform generation
                window: 300000, // 5 minutes
                burst: 5,
                priority: 1,
                dailyPlatforms: 2 // Max platforms per day
            },
            basic: {
                limit: 100,
                window: 300000,
                burst: 20,
                priority: 2,
                dailyPlatforms: 10
            },
            pro: {
                limit: 500,
                window: 300000,
                burst: 100,
                priority: 3,
                dailyPlatforms: 50
            },
            enterprise: {
                limit: 2000,
                window: 300000,
                burst: 500,
                priority: 4,
                dailyPlatforms: -1 // Unlimited
            },
            patriotic: {
                limit: 10000,
                window: 300000,
                burst: 2000,
                priority: 5,
                dailyPlatforms: -1 // Unlimited with premium features
            }
        };
        
        // Platform generation endpoint limits
        const endpointLimits = {
            '/api/generate-platform': { 
                limit: 5, 
                window: 300000, // Very expensive endpoint
                cost: 10 // Each generation costs 10 regular requests
            },
            '/api/analyze-document': { 
                limit: 50, 
                window: 300000,
                cost: 2
            },
            '/api/preview-platform': { 
                limit: 100, 
                window: 300000,
                cost: 1
            },
            '/api/platform-status': { 
                limit: 1000, 
                window: 300000,
                cost: 0.1
            }
        };
        
        this.rateLimiter = new APIRateLimiter({
            tiers: platformTiers,
            endpointLimits: endpointLimits,
            adaptiveEnabled: true,
            loadThresholds: {
                low: 0.4,
                medium: 0.6,
                high: 0.8,
                critical: 0.95
            }
        });
        
        console.log('✅ Extended rate limiter initialized with platform-specific tiers');
    }
    
    /**
     * Analyze platform generation workload and predict rate limits
     */
    async analyzePlatformGenerationWorkload(userRequest) {
        console.log(`\n📊 Analyzing workload for platform generation...`);
        
        const analysis = {
            sessionId: crypto.randomUUID(),
            userRequest: userRequest,
            timestamp: Date.now(),
            workloadProfile: null,
            estimatedRequests: 0,
            estimatedDuration: 0,
            rateLimitRisk: 0,
            generationOdds: 0,
            recommendations: [],
            throttlingStrategy: null,
            tierRecommendation: null
        };
        
        const startTime = Date.now();
        
        // Classify workload complexity
        analysis.workloadProfile = this.classifyWorkloadComplexity(userRequest);
        
        // Calculate estimated resource requirements
        const resourceEstimates = this.calculateResourceRequirements(analysis.workloadProfile, userRequest);
        analysis.estimatedRequests = resourceEstimates.requests;
        analysis.estimatedDuration = resourceEstimates.duration;
        
        // Analyze current rate limit status
        const rateLimitStatus = await this.analyzeCurrentRateLimitStatus(userRequest.userId, userRequest.tier);
        
        // Calculate rate limit risk
        analysis.rateLimitRisk = this.calculateRateLimitRisk(
            analysis.estimatedRequests, 
            rateLimitStatus, 
            userRequest.tier
        );
        
        // Calculate generation odds
        analysis.generationOdds = this.calculateGenerationOdds(
            analysis.rateLimitRisk,
            rateLimitStatus,
            analysis.workloadProfile
        );
        
        // Generate recommendations
        analysis.recommendations = this.generateWorkloadRecommendations(
            analysis.rateLimitRisk,
            analysis.generationOdds,
            userRequest
        );
        
        // Determine optimal throttling strategy
        analysis.throttlingStrategy = this.determineThrottlingStrategy(
            analysis.rateLimitRisk,
            analysis.workloadProfile,
            rateLimitStatus
        );
        
        // Check for tier upgrade recommendation
        analysis.tierRecommendation = this.evaluateTierUpgrade(
            userRequest.userId,
            analysis.rateLimitRisk,
            analysis.workloadProfile
        );
        
        analysis.processingTime = Date.now() - startTime;
        
        // Cache analysis
        this.analysisState.workloadAnalysis.set(analysis.sessionId, analysis);
        
        // Update metrics
        this.updateAnalysisMetrics(analysis);
        
        console.log(`📈 Workload Analysis Complete:`);
        console.log(`  🎯 Workload: ${analysis.workloadProfile.type}`);
        console.log(`  📊 Estimated Requests: ${analysis.estimatedRequests}`);
        console.log(`  ⚠️ Rate Limit Risk: ${(analysis.rateLimitRisk * 100).toFixed(1)}%`);
        console.log(`  🎲 Generation Odds: ${(analysis.generationOdds * 100).toFixed(1)}%`);
        console.log(`  💡 Recommendations: ${analysis.recommendations.length}`);
        
        this.emit('workload_analyzed', analysis);
        return analysis;
    }
    
    /**
     * Classify workload complexity based on user request
     */
    classifyWorkloadComplexity(userRequest) {
        const { domainIdea, requirements, features } = userRequest;
        
        let complexityScore = 0;
        let indicators = [];
        
        // Analyze domain idea complexity
        if (domainIdea) {
            const domainWords = domainIdea.toLowerCase().split(' ');
            
            // Complex keywords increase score
            const complexKeywords = [
                'enterprise', 'marketplace', 'platform', 'ecosystem', 
                'ai', 'blockchain', 'analytics', 'dashboard', 'crm',
                'e-commerce', 'social', 'gaming', 'financial'
            ];
            
            complexKeywords.forEach(keyword => {
                if (domainWords.some(word => word.includes(keyword))) {
                    complexityScore += 0.2;
                    indicators.push(`complex_keyword: ${keyword}`);
                }
            });
        }
        
        // Analyze requirements
        if (requirements && Array.isArray(requirements)) {
            complexityScore += requirements.length * 0.1;
            indicators.push(`requirements_count: ${requirements.length}`);
        }
        
        // Analyze features
        if (features && Array.isArray(features)) {
            complexityScore += features.length * 0.15;
            indicators.push(`features_count: ${features.length}`);
            
            // Special feature complexity
            const complexFeatures = [
                'authentication', 'payments', 'real-time', 'api',
                'database', 'admin', 'reporting', 'integration'
            ];
            
            features.forEach(feature => {
                if (complexFeatures.some(cf => feature.toLowerCase().includes(cf))) {
                    complexityScore += 0.3;
                    indicators.push(`complex_feature: ${feature}`);
                }
            });
        }
        
        // Determine profile type
        let profileType;
        if (complexityScore <= 1.0) {
            profileType = 'simple_platform';
        } else if (complexityScore <= 2.5) {
            profileType = 'moderate_platform';
        } else if (complexityScore <= 4.0) {
            profileType = 'complex_platform';
        } else {
            profileType = 'enterprise_platform';
        }
        
        const profile = {
            ...this.config.workloadProfiles[profileType],
            type: profileType,
            complexityScore: complexityScore,
            indicators: indicators,
            analysisTimestamp: Date.now()
        };
        
        console.log(`  🎯 Classified as: ${profileType} (score: ${complexityScore.toFixed(2)})`);
        
        return profile;
    }
    
    /**
     * Calculate resource requirements for workload
     */
    calculateResourceRequirements(workloadProfile, userRequest) {
        const baseRequests = workloadProfile.estimatedRequests;
        const baseDuration = workloadProfile.averageProcessingTime;
        
        // Adjust based on specific request characteristics
        let requestMultiplier = 1.0;
        let durationMultiplier = 1.0;
        
        // Custom components increase requirements
        if (userRequest.customComponents) {
            requestMultiplier += userRequest.customComponents.length * 0.2;
            durationMultiplier += userRequest.customComponents.length * 0.15;
        }
        
        // High-quality assets increase requirements
        if (userRequest.qualityLevel === 'premium') {
            requestMultiplier *= 1.5;
            durationMultiplier *= 1.3;
        }
        
        // Real-time features increase requirements
        if (userRequest.realTime) {
            requestMultiplier *= 1.8;
            durationMultiplier *= 1.4;
        }
        
        return {
            requests: Math.ceil(baseRequests * requestMultiplier),
            duration: Math.ceil(baseDuration * durationMultiplier),
            multipliers: { requestMultiplier, durationMultiplier }
        };
    }
    
    /**
     * Analyze current rate limit status for user
     */
    async analyzeCurrentRateLimitStatus(userId, userTier) {
        const status = {
            currentUsage: 0,
            remainingQuota: 0,
            resetTime: 0,
            recentBlocks: 0,
            averageRequestRate: 0,
            burstCapacityAvailable: 0,
            dailyPlatformsUsed: 0
        };
        
        try {
            // Get current usage from rate limiter
            const usage = await this.rateLimiter.getUsage(userId);
            
            if (usage.tokenBucket) {
                status.currentUsage = usage.tokenBucket.used || 0;
                status.remainingQuota = usage.tokenBucket.available || 0;
            }
            
            // Get tier limits
            const tierLimits = this.rateLimiter.config.tiers[userTier] || this.rateLimiter.config.tiers.free;
            status.burstCapacityAvailable = tierLimits.burst;
            
            // Analyze recent behavior
            const userPattern = this.analysisState.requestPatterns.get(userId);
            if (userPattern) {
                status.recentBlocks = userPattern.recentBlocks || 0;
                status.averageRequestRate = userPattern.averageRate || 0;
                status.dailyPlatformsUsed = userPattern.dailyPlatforms || 0;
            }
            
            // Calculate reset time based on current window
            status.resetTime = Date.now() + tierLimits.window;
            
        } catch (error) {
            console.error('Error analyzing rate limit status:', error.message);
        }
        
        return status;
    }
    
    /**
     * Calculate rate limit risk probability
     */
    calculateRateLimitRisk(estimatedRequests, rateLimitStatus, userTier) {
        const tierConfig = this.rateLimiter.config.tiers[userTier] || this.rateLimiter.config.tiers.free;
        
        // Base risk calculation
        const quotaRatio = (rateLimitStatus.currentUsage + estimatedRequests) / tierConfig.limit;
        let risk = Math.min(1.0, Math.max(0.0, quotaRatio - 0.5) * 2); // Risk starts at 50% quota usage
        
        // Increase risk based on recent blocking history
        if (rateLimitStatus.recentBlocks > 0) {
            risk += rateLimitStatus.recentBlocks * 0.1;
        }
        
        // High request rate increases risk
        if (rateLimitStatus.averageRequestRate > tierConfig.limit * 0.5) {
            risk += 0.2;
        }
        
        // Burst capacity can reduce risk
        if (rateLimitStatus.burstCapacityAvailable > estimatedRequests) {
            risk *= 0.8; // 20% risk reduction
        }
        
        // Daily platform limits
        if (tierConfig.dailyPlatforms > 0 && rateLimitStatus.dailyPlatformsUsed >= tierConfig.dailyPlatforms) {
            risk = 1.0; // Guaranteed to hit limit
        }
        
        return Math.min(1.0, Math.max(0.0, risk));
    }
    
    /**
     * Calculate odds of successful generation
     */
    calculateGenerationOdds(rateLimitRisk, rateLimitStatus, workloadProfile) {
        // Start with workload base success probability
        let odds = workloadProfile.successProbability;
        
        // Reduce odds based on rate limit risk
        odds *= (1 - rateLimitRisk * 0.6); // Rate limit risk can reduce odds by up to 60%
        
        // Factor in burst capacity
        if (rateLimitStatus.burstCapacityAvailable > workloadProfile.estimatedRequests) {
            odds *= 1.1; // 10% bonus for sufficient burst capacity
        }
        
        // Recent blocks reduce confidence
        if (rateLimitStatus.recentBlocks > 0) {
            odds *= Math.max(0.5, 1 - rateLimitStatus.recentBlocks * 0.1);
        }
        
        // High remaining quota improves odds
        const quotaHealthScore = rateLimitStatus.remainingQuota / (rateLimitStatus.remainingQuota + rateLimitStatus.currentUsage);
        odds *= (0.7 + 0.3 * quotaHealthScore); // Scale between 70-100% based on quota health
        
        return Math.min(1.0, Math.max(0.1, odds)); // Keep between 10-100%
    }
    
    /**
     * Generate workload-specific recommendations
     */
    generateWorkloadRecommendations(rateLimitRisk, generationOdds, userRequest) {
        const recommendations = [];
        
        // High risk recommendations
        if (rateLimitRisk > 0.8) {
            recommendations.push({
                type: 'high_risk_warning',
                priority: 'critical',
                message: 'Very high probability of hitting rate limits',
                actions: ['consider_tier_upgrade', 'delay_generation', 'simplify_requirements']
            });
        }
        
        // Moderate risk recommendations
        if (rateLimitRisk > 0.5 && rateLimitRisk <= 0.8) {
            recommendations.push({
                type: 'moderate_risk_caution',
                priority: 'high',
                message: 'Moderate rate limit risk detected',
                actions: ['monitor_progress', 'prepare_for_delays', 'consider_batch_processing']
            });
        }
        
        // Low generation odds
        if (generationOdds < 0.7) {
            recommendations.push({
                type: 'low_success_probability',
                priority: 'medium',
                message: `Generation success probability is ${(generationOdds * 100).toFixed(1)}%`,
                actions: ['optimize_request', 'reduce_complexity', 'schedule_off_peak']
            });
        }
        
        // Tier-specific recommendations
        if (userRequest.tier === 'free' && rateLimitRisk > 0.4) {
            recommendations.push({
                type: 'tier_limitation',
                priority: 'medium',
                message: 'Free tier may be insufficient for this workload',
                actions: ['upgrade_to_basic', 'simplify_platform', 'spread_across_days']
            });
        }
        
        // Complex workload recommendations
        if (userRequest.domainIdea && userRequest.domainIdea.split(' ').length > 10) {
            recommendations.push({
                type: 'complexity_optimization',
                priority: 'low',
                message: 'Complex requirements detected',
                actions: ['break_into_phases', 'prioritize_features', 'use_templates']
            });
        }
        
        return recommendations;
    }
    
    /**
     * Determine optimal throttling strategy
     */
    determineThrottlingStrategy(rateLimitRisk, workloadProfile, rateLimitStatus) {
        const strategies = this.config.throttlingStrategies;
        
        // High risk situations
        if (rateLimitRisk > 0.8) {
            return {
                ...strategies.queue_and_batch,
                reason: 'High rate limit risk requires batching',
                parameters: {
                    batchSize: Math.ceil(workloadProfile.estimatedRequests / 5),
                    delayBetweenBatches: 30000 // 30 seconds
                }
            };
        }
        
        // Moderate risk with recent blocks
        if (rateLimitRisk > 0.5 && rateLimitStatus.recentBlocks > 0) {
            return {
                ...strategies.progressive_delay,
                reason: 'Recent blocks indicate need for progressive delays',
                parameters: {
                    initialDelay: 1000, // 1 second
                    progressiveMultiplier: 1.5,
                    maxDelay: 30000 // 30 seconds max
                }
            };
        }
        
        // Consistent moderate risk
        if (rateLimitRisk > 0.6) {
            return {
                ...strategies.tier_upgrade_suggest,
                reason: 'Consistent rate limit pressure suggests tier upgrade needed',
                parameters: {
                    recommendedTier: this.getRecommendedTier(workloadProfile, rateLimitStatus),
                    urgency: 'high'
                }
            };
        }
        
        // Low urgency, high volume
        if (workloadProfile.estimatedRequests > 100 && rateLimitRisk > 0.3) {
            return {
                ...strategies.off_peak_scheduling,
                reason: 'High volume workload better suited for off-peak processing',
                parameters: {
                    suggestedHours: ['2:00-6:00', '14:00-16:00'],
                    timezone: 'UTC'
                }
            };
        }
        
        // Default: no special throttling needed
        return {
            type: 'none',
            description: 'No special throttling required',
            reason: 'Rate limit risk is manageable with current tier',
            effectiveness: 1.0
        };
    }
    
    /**
     * Evaluate tier upgrade recommendation
     */
    evaluateTierUpgrade(userId, rateLimitRisk, workloadProfile) {
        // Get user's behavior pattern
        const userPattern = this.analysisState.userBehaviorProfiles.get(userId);
        
        if (!userPattern) {
            return null; // Need more data
        }
        
        // Check tier upgrade thresholds
        for (const [upgrade, config] of Object.entries(this.config.tierRecommendations)) {
            if (rateLimitRisk >= config.threshold) {
                // Calculate confidence based on historical data
                const confidence = this.calculateUpgradeConfidence(userPattern, workloadProfile, rateLimitRisk);
                
                if (confidence >= config.confidence) {
                    return {
                        type: upgrade,
                        currentTier: userPattern.currentTier,
                        recommendedTier: upgrade.split('_to_')[1],
                        confidence: confidence,
                        rationale: config.description,
                        benefits: this.calculateUpgradeBenefits(upgrade, workloadProfile),
                        urgency: rateLimitRisk > 0.8 ? 'high' : 'medium'
                    };
                }
            }
        }
        
        return null;
    }
    
    /**
     * Determine if we're "on rate" or "not on rate" and how to phrase prompts
     */
    async determineRateStatus(userId, plannedWorkload) {
        console.log(`\n🎯 Determining rate status for planned workload...`);
        
        const analysis = await this.analyzePlatformGenerationWorkload({
            userId: userId,
            ...plannedWorkload
        });
        
        const rateStatus = {
            isOnRate: analysis.generationOdds > 0.8 && analysis.rateLimitRisk < 0.3,
            confidence: analysis.generationOdds,
            riskLevel: analysis.rateLimitRisk,
            recommendation: null,
            promptPhrasing: null,
            processingApproach: null
        };
        
        // Determine processing approach
        if (rateStatus.isOnRate) {
            rateStatus.processingApproach = 'direct_processing';
            rateStatus.promptPhrasing = 'standard';
            rateStatus.recommendation = 'Proceed with normal processing pipeline';
        } else if (analysis.rateLimitRisk > 0.7) {
            rateStatus.processingApproach = 'deferred_processing';
            rateStatus.promptPhrasing = 'apologetic_with_alternative';
            rateStatus.recommendation = 'Defer to off-peak hours or recommend tier upgrade';
        } else if (analysis.generationOdds < 0.6) {
            rateStatus.processingApproach = 'optimized_processing';
            rateStatus.promptPhrasing = 'cautious_with_optimization';
            rateStatus.recommendation = 'Proceed with optimizations and monitoring';
        } else {
            rateStatus.processingApproach = 'monitored_processing';
            rateStatus.promptPhrasing = 'confident_with_monitoring';
            rateStatus.recommendation = 'Proceed with enhanced monitoring';
        }
        
        // Generate specific prompt phrasing recommendations
        rateStatus.promptPhrasing = this.generatePromptPhrasing(rateStatus, analysis);
        
        console.log(`📊 Rate Status Determination:`);
        console.log(`  ✅ On Rate: ${rateStatus.isOnRate ? 'YES' : 'NO'}`);
        console.log(`  🎲 Confidence: ${(rateStatus.confidence * 100).toFixed(1)}%`);
        console.log(`  ⚠️ Risk Level: ${(rateStatus.riskLevel * 100).toFixed(1)}%`);
        console.log(`  🔄 Approach: ${rateStatus.processingApproach}`);
        console.log(`  💬 Phrasing: ${rateStatus.promptPhrasing.style}`);
        
        this.emit('rate_status_determined', rateStatus);
        return rateStatus;
    }
    
    /**
     * Generate prompt phrasing based on rate status
     */
    generatePromptPhrasing(rateStatus, analysis) {
        const phrasings = {
            standard: {
                style: 'standard',
                tone: 'confident',
                messageTemplate: 'I can generate your platform right away. Expected completion: {duration}.',
                alternatives: [],
                urgency: 'normal'
            },
            
            apologetic_with_alternative: {
                style: 'apologetic_with_alternative',
                tone: 'apologetic_helpful',
                messageTemplate: 'I\'d love to generate your platform, but you\'re near your rate limits. I can either: 1) Process it during off-peak hours, 2) Recommend a tier upgrade for immediate processing, or 3) Simplify the requirements.',
                alternatives: ['off_peak_scheduling', 'tier_upgrade', 'requirement_simplification'],
                urgency: 'high'
            },
            
            cautious_with_optimization: {
                style: 'cautious_with_optimization',
                tone: 'careful_optimistic',
                messageTemplate: 'I can generate your platform, but I\'ll optimize the process to work within your current limits. This might take a bit longer but ensures successful completion.',
                alternatives: ['batch_processing', 'progressive_generation'],
                urgency: 'medium'
            },
            
            confident_with_monitoring: {
                style: 'confident_with_monitoring',
                tone: 'confident_prepared',
                messageTemplate: 'I\'ll generate your platform while carefully monitoring our rate limits. I\'ll keep you updated on progress.',
                alternatives: ['real_time_monitoring'],
                urgency: 'low'
            }
        };
        
        let selectedPhrasing = phrasings.standard;
        
        if (rateStatus.processingApproach === 'deferred_processing') {
            selectedPhrasing = phrasings.apologetic_with_alternative;
        } else if (rateStatus.processingApproach === 'optimized_processing') {
            selectedPhrasing = phrasings.cautious_with_optimization;
        } else if (rateStatus.processingApproach === 'monitored_processing') {
            selectedPhrasing = phrasings.confident_with_monitoring;
        }
        
        // Customize message with actual data
        selectedPhrasing.personalizedMessage = selectedPhrasing.messageTemplate.replace(
            '{duration}',
            this.formatDuration(analysis.estimatedDuration)
        );
        
        return selectedPhrasing;
    }
    
    /**
     * Monitor integration pipeline for rate limit health
     */
    async monitorPipelineRateHealth(pipelineStages) {
        console.log(`\n💊 Monitoring pipeline rate health across ${pipelineStages.length} stages...`);
        
        const healthReport = {
            overallHealth: 'healthy',
            stageHealth: new Map(),
            bottlenecks: [],
            recommendations: [],
            timestamp: Date.now()
        };
        
        for (const stage of pipelineStages) {
            const stageHealth = await this.analyzeStageRateHealth(stage);
            healthReport.stageHealth.set(stage.name, stageHealth);
            
            if (stageHealth.health === 'critical') {
                healthReport.overallHealth = 'critical';
                healthReport.bottlenecks.push(stage.name);
            } else if (stageHealth.health === 'warning' && healthReport.overallHealth === 'healthy') {
                healthReport.overallHealth = 'warning';
            }
        }
        
        // Generate pipeline-wide recommendations
        healthReport.recommendations = this.generatePipelineRecommendations(healthReport);
        
        console.log(`💊 Pipeline Health Report:`);
        console.log(`  🎯 Overall Health: ${healthReport.overallHealth.toUpperCase()}`);
        console.log(`  ⚠️ Bottlenecks: ${healthReport.bottlenecks.length}`);
        console.log(`  💡 Recommendations: ${healthReport.recommendations.length}`);
        
        this.emit('pipeline_health_analyzed', healthReport);
        return healthReport;
    }
    
    /**
     * Utility functions
     */
    async analyzeStageRateHealth(stage) {
        // Mock implementation - would analyze actual stage performance
        const randomHealth = Math.random();
        
        if (randomHealth > 0.8) {
            return { health: 'healthy', utilization: randomHealth, issues: [] };
        } else if (randomHealth > 0.6) {
            return { health: 'warning', utilization: randomHealth, issues: ['elevated_usage'] };
        } else {
            return { health: 'critical', utilization: randomHealth, issues: ['rate_limit_exceeded'] };
        }
    }
    
    generatePipelineRecommendations(healthReport) {
        const recommendations = [];
        
        if (healthReport.overallHealth === 'critical') {
            recommendations.push({
                type: 'immediate_action',
                message: 'Critical bottlenecks require immediate attention',
                actions: ['scale_bottlenecks', 'implement_circuit_breakers']
            });
        }
        
        if (healthReport.bottlenecks.length > 1) {
            recommendations.push({
                type: 'architecture_review',
                message: 'Multiple bottlenecks suggest architectural improvements needed',
                actions: ['parallel_processing', 'load_balancing']
            });
        }
        
        return recommendations;
    }
    
    calculateUpgradeConfidence(userPattern, workloadProfile, rateLimitRisk) {
        let confidence = 0.5; // Base confidence
        
        // Historical rate limit hits increase confidence
        if (userPattern.rateLimitHits > 3) {
            confidence += 0.2;
        }
        
        // Workload complexity increases confidence
        if (workloadProfile.complexityScore > 2.0) {
            confidence += 0.15;
        }
        
        // High risk increases confidence
        confidence += rateLimitRisk * 0.3;
        
        return Math.min(1.0, confidence);
    }
    
    calculateUpgradeBenefits(upgrade, workloadProfile) {
        const benefits = [];
        
        benefits.push(`${Math.round(workloadProfile.estimatedRequests * 2)}x higher rate limits`);
        benefits.push(`${Math.round(workloadProfile.averageProcessingTime * 0.7)}ms faster processing`);
        benefits.push('Priority queue access');
        benefits.push('Advanced monitoring and analytics');
        
        return benefits;
    }
    
    getRecommendedTier(workloadProfile, rateLimitStatus) {
        if (workloadProfile.type === 'enterprise_platform') return 'enterprise';
        if (workloadProfile.type === 'complex_platform') return 'pro';
        if (workloadProfile.type === 'moderate_platform') return 'basic';
        return 'basic';
    }
    
    formatDuration(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    }
    
    updateAnalysisMetrics(analysis) {
        const metrics = this.analysisState.metrics;
        
        metrics.totalAnalyses++;
        
        // Update average analysis time
        const currentAvg = metrics.averageAnalysisTime;
        metrics.averageAnalysisTime = (currentAvg + analysis.processingTime) / 2;
        
        // Count tier recommendations
        if (analysis.tierRecommendation) {
            metrics.tierUpgradeRecommendations++;
        }
    }
    
    async loadAnalysisHistory() {
        console.log('📚 Loading analysis history (placeholder)');
    }
    
    startPatternMonitoring() {
        console.log('🔄 Pattern monitoring started');
        
        // Mock pattern monitoring
        setInterval(() => {
            // Would monitor actual request patterns
        }, 30000);
    }
    
    initializeWorkloadProfiling() {
        console.log('🎯 Workload profiling initialized');
    }
    
    /**
     * Get comprehensive analyzer status
     */
    getAnalyzerStatus() {
        return {
            system: {
                initialized: !!this.rateLimiter,
                workloadProfiles: Object.keys(this.config.workloadProfiles).length,
                throttlingStrategies: Object.keys(this.config.throttlingStrategies).length,
                tierRecommendations: Object.keys(this.config.tierRecommendations).length
            },
            
            analysis: {
                totalAnalyses: this.analysisState.metrics.totalAnalyses,
                averageAnalysisTime: this.analysisState.metrics.averageAnalysisTime,
                tierUpgradeRecommendations: this.analysisState.metrics.tierUpgradeRecommendations,
                workloadAnalyses: this.analysisState.workloadAnalysis.size
            },
            
            rateLimiter: {
                initialized: !!this.rateLimiter,
                tiers: this.rateLimiter ? Object.keys(this.rateLimiter.config.tiers).length : 0,
                adaptiveEnabled: this.rateLimiter ? this.rateLimiter.config.adaptiveEnabled : false
            },
            
            patterns: {
                trackedUsers: this.analysisState.requestPatterns.size,
                behaviorProfiles: this.analysisState.userBehaviorProfiles.size,
                activePredictions: this.analysisState.predictions.size
            },
            
            timestamp: Date.now()
        };
    }
}

// Export for use as module
module.exports = RateLimitAnalyzer;

// Demo if run directly
if (require.main === module) {
    console.log('📊 Running Rate Limit Analyzer Demo...\n');
    
    const rateLimitAnalyzer = new RateLimitAnalyzer();
    
    // Listen for events
    rateLimitAnalyzer.on('analyzer_initialized', () => {
        console.log('✅ Rate Limit Analyzer initialized successfully');
    });
    
    rateLimitAnalyzer.on('workload_analyzed', (analysis) => {
        console.log(`📊 Workload analyzed: ${analysis.workloadProfile.type}`);
    });
    
    rateLimitAnalyzer.on('rate_status_determined', (status) => {
        console.log(`🎯 Rate status: ${status.isOnRate ? 'ON RATE' : 'NOT ON RATE'}`);
    });
    
    rateLimitAnalyzer.on('pipeline_health_analyzed', (health) => {
        console.log(`💊 Pipeline health: ${health.overallHealth.toUpperCase()}`);
    });
    
    // Demo workload analysis
    setTimeout(async () => {
        try {
            console.log('\n🎮 Demo: Analyzing platform generation workload...');
            
            const sampleWorkload = {
                userId: 'demo-user-123',
                tier: 'basic',
                domainIdea: 'AI-powered e-commerce marketplace with real-time analytics and blockchain payments',
                requirements: [
                    'User authentication',
                    'Product catalog',
                    'Shopping cart',
                    'Payment processing',
                    'Admin dashboard',
                    'Analytics reporting',
                    'API endpoints'
                ],
                features: [
                    'real-time notifications',
                    'advanced search',
                    'recommendation engine',
                    'blockchain integration',
                    'mobile app'
                ],
                customComponents: ['custom_ai_chat', 'blockchain_wallet', 'analytics_dashboard'],
                qualityLevel: 'premium',
                realTime: true
            };
            
            const workloadAnalysis = await rateLimitAnalyzer.analyzePlatformGenerationWorkload(sampleWorkload);
            
            // Determine rate status
            const rateStatus = await rateLimitAnalyzer.determineRateStatus(sampleWorkload.userId, sampleWorkload);
            
            console.log('\n📈 Demo Results:');
            console.log(`  🎯 Workload Type: ${workloadAnalysis.workloadProfile.type}`);
            console.log(`  📊 Estimated Requests: ${workloadAnalysis.estimatedRequests}`);
            console.log(`  ⏱️ Estimated Duration: ${rateLimitAnalyzer.formatDuration(workloadAnalysis.estimatedDuration)}`);
            console.log(`  ⚠️ Rate Limit Risk: ${(workloadAnalysis.rateLimitRisk * 100).toFixed(1)}%`);
            console.log(`  🎲 Generation Odds: ${(workloadAnalysis.generationOdds * 100).toFixed(1)}%`);
            console.log(`  💡 Recommendations: ${workloadAnalysis.recommendations.length}`);
            
            console.log('\n🎯 Rate Status Analysis:');
            console.log(`  ✅ On Rate: ${rateStatus.isOnRate ? 'YES' : 'NO'}`);
            console.log(`  💬 Prompt Phrasing: ${rateStatus.promptPhrasing.style}`);
            console.log(`  📝 Suggested Message: "${rateStatus.promptPhrasing.personalizedMessage}"`);
            
            // Demo pipeline health monitoring
            setTimeout(async () => {
                console.log('\n💊 Demo: Pipeline health monitoring...');
                
                const mockPipeline = [
                    { name: 'document_analysis', endpoint: '/api/analyze-document' },
                    { name: 'platform_generation', endpoint: '/api/generate-platform' },
                    { name: 'asset_processing', endpoint: '/api/process-assets' },
                    { name: 'deployment', endpoint: '/api/deploy-platform' }
                ];
                
                const healthReport = await rateLimitAnalyzer.monitorPipelineRateHealth(mockPipeline);
                
                console.log('\n💊 Pipeline Health Summary:');
                console.log(`  🎯 Overall Status: ${healthReport.overallHealth.toUpperCase()}`);
                console.log(`  ⚠️ Bottlenecks: ${healthReport.bottlenecks.join(', ') || 'None'}`);
                console.log(`  💡 Action Items: ${healthReport.recommendations.length}`);
                
            }, 2000);
            
        } catch (error) {
            console.error('❌ Demo failed:', error.message);
        }
    }, 2000);
    
    // Show system status
    setTimeout(() => {
        console.log('\n📊 System Status:');
        const status = rateLimitAnalyzer.getAnalyzerStatus();
        console.log(`📊 Rate limit analyzer: ${status.system.initialized ? 'Ready' : 'Not Ready'}`);
        console.log(`🎯 Workload profiles: ${status.system.workloadProfiles}`);
        console.log(`🔄 Throttling strategies: ${status.system.throttlingStrategies}`);
        console.log(`📈 Analyses performed: ${status.analysis.totalAnalyses}`);
        console.log(`👥 Users tracked: ${status.patterns.trackedUsers}`);
    }, 6000);
    
    // Cleanup
    setTimeout(() => {
        console.log('\n✨ Rate Limit Analyzer Demo Complete!');
        console.log('💡 The system can now analyze workloads, predict rate limits, and determine optimal processing approaches');
    }, 8000);
}