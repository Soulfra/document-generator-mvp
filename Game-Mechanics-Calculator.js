#!/usr/bin/env node

/**
 * ⚔️📊 GAME MECHANICS CALCULATOR
 * 
 * Advanced statistical game systems with aggro mechanics, radius calculations,
 * probability engines, damage formulas, and mathematical balance systems.
 * Integrates with brand themes to create engaging, mathematically sound gameplay.
 * 
 * The statistical engine powering game-like interfaces and interactions.
 */

const EventEmitter = require('events');
const crypto = require('crypto');

console.log(`
⚔️📊 GAME MECHANICS CALCULATOR ⚔️📊
===================================
Aggro Systems | Probability Engines | Statistical Balance
Mathematical Game Theory and Engagement Systems
`);

class GameMechanicsCalculator extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            // Aggro system configuration
            aggro: {
                baseRadius: 100,
                maxRadius: 500,
                decayRate: 0.95,
                buildup: {
                    activity: 0.2,
                    proximity: 0.3,
                    interaction: 0.4,
                    time: 0.1
                },
                thresholds: {
                    minimal: 0.1,
                    low: 0.3,
                    medium: 0.6,
                    high: 0.8,
                    extreme: 0.95
                },
                radiusMultipliers: {
                    minimal: 0.5,
                    low: 0.75,
                    medium: 1.0,
                    high: 1.25,
                    extreme: 1.5
                }
            },
            
            // Probability system
            probability: {
                baseChances: {
                    critical: 0.05,
                    dodge: 0.15,
                    block: 0.25,
                    counter: 0.10,
                    miss: 0.05,
                    fumble: 0.02
                },
                modifiers: {
                    level_difference: 0.02,  // Per level difference
                    equipment_bonus: 0.05,   // Per tier
                    skill_bonus: 0.01,       // Per skill point
                    luck_factor: 0.03,       // Random variance
                    environmental: 0.02      // Environmental effects
                },
                distributions: {
                    normal: { mean: 0, stdDev: 1 },
                    exponential: { lambda: 1 },
                    poisson: { lambda: 5 },
                    uniform: { min: 0, max: 1 }
                }
            },
            
            // Damage calculation system
            damage: {
                baseDamage: {
                    physical: { min: 10, max: 20 },
                    magical: { min: 8, max: 25 },
                    elemental: { min: 12, max: 18 },
                    true: { min: 5, max: 15 }
                },
                scaling: {
                    linear: (base, level) => base * (1 + level * 0.1),
                    exponential: (base, level) => base * Math.pow(1.15, level),
                    logarithmic: (base, level) => base * (1 + Math.log(level + 1) * 0.5),
                    quadratic: (base, level) => base * (1 + level * level * 0.01)
                },
                resistances: {
                    physical: 0.1,
                    magical: 0.15,
                    elemental: 0.2,
                    piercing: 0.05
                }
            },
            
            // Experience and progression
            progression: {
                xpCurves: {
                    linear: (level) => level * 1000,
                    exponential: (level) => Math.pow(level, 1.8) * 500,
                    fibonacci: (level) => this.fibonacci(level) * 100,
                    custom: (level) => Math.floor(level * level * 75 + level * 300)
                },
                rewards: {
                    base: 100,
                    levelMultiplier: 1.2,
                    difficultyBonus: 0.5,
                    streakBonus: 0.25,
                    perfectBonus: 1.0
                }
            },
            
            // Economic systems
            economy: {
                inflation: {
                    rate: 0.02,        // 2% base inflation
                    playerInfluence: 0.0001,  // Player action influence
                    eventMultiplier: 1.5      // Special event effects
                },
                pricing: {
                    baseCost: 100,
                    demandMultiplier: 1.2,
                    supplyMultiplier: 0.8,
                    rarityBonus: {
                        common: 1.0,
                        uncommon: 1.5,
                        rare: 2.5,
                        epic: 5.0,
                        legendary: 10.0
                    }
                },
                taxation: {
                    transaction: 0.05,
                    wealth: 0.01,
                    luxury: 0.15
                }
            },
            
            // Engagement metrics
            engagement: {
                factors: {
                    novelty: 0.3,      // New content/features
                    challenge: 0.25,   // Difficulty appropriateness
                    progress: 0.2,     // Sense of advancement
                    social: 0.15,      // Social interactions
                    rewards: 0.1       // Reward satisfaction
                },
                decay: {
                    daily: 0.95,       // Daily engagement decay
                    weekly: 0.85,      // Weekly retention
                    monthly: 0.7       // Monthly retention
                }
            }
        };
        
        // Game state tracking
        this.gameState = {
            players: new Map(),        // playerId -> player data
            entities: new Map(),       // entityId -> entity data
            events: [],               // Recent game events
            statistics: {
                totalPlayers: 0,
                activePlayers: 0,
                sessionsToday: 0,
                averageSession: 0
            },
            economy: {
                totalGold: 0,
                inflationRate: this.config.economy.inflation.rate,
                marketPrices: new Map()
            }
        };
        
        // Calculation cache for expensive operations
        this.cache = {
            probabilities: new Map(),
            damages: new Map(),
            aggros: new Map(),
            experiences: new Map()
        };
        
        // Random number generators for different distributions
        this.rng = {
            uniform: () => Math.random(),
            normal: this.generateNormalRandom.bind(this),
            exponential: this.generateExponentialRandom.bind(this),
            poisson: this.generatePoissonRandom.bind(this)
        };
        
        console.log('⚔️ Game Mechanics Calculator initialized');
        console.log(`🎯 Aggro thresholds: ${Object.keys(this.config.aggro.thresholds).length}`);
        console.log(`🎲 Probability systems: ${Object.keys(this.config.probability.baseChances).length}`);
        console.log(`💰 Economic models: Inflation, taxation, pricing`);
        console.log(`📈 Progression curves: ${Object.keys(this.config.progression.xpCurves).length}`);
        
        this.initializeSystem();
    }
    
    /**
     * Initialize the game mechanics system
     */
    initializeSystem() {
        // Set up periodic calculations
        this.setupPeriodicCalculations();
        
        // Initialize market prices
        this.initializeEconomy();
        
        console.log('✅ Game mechanics system initialized');
    }
    
    /**
     * Calculate comprehensive aggro system
     */
    calculateAggroSystem(entities, options = {}) {
        console.log(`\n⚔️ Calculating aggro system for ${entities.length} entities...`);
        
        const results = [];
        const currentTime = Date.now();
        
        for (const entity of entities) {
            // Calculate base aggro factors
            const aggroFactors = this.calculateAggroFactors(entity, options);
            
            // Calculate distance-based influence
            const distanceInfluence = this.calculateDistanceInfluence(entity, options);
            
            // Calculate time-based decay
            const timeDecay = this.calculateTimeDecay(entity, currentTime);
            
            // Calculate interaction-based buildup
            const interactionBuildup = this.calculateInteractionBuildup(entity);
            
            // Combine all factors
            let totalAggro = (
                aggroFactors.activity * this.config.aggro.buildup.activity +
                aggroFactors.proximity * this.config.aggro.buildup.proximity +
                aggroFactors.interaction * this.config.aggro.buildup.interaction +
                aggroFactors.time * this.config.aggro.buildup.time
            );
            
            // Apply distance influence
            totalAggro *= distanceInfluence;
            
            // Apply time decay
            totalAggro *= timeDecay;
            
            // Apply interaction buildup
            totalAggro += interactionBuildup;
            
            // Normalize to 0-1 range
            totalAggro = Math.max(0, Math.min(1, totalAggro));
            
            // Determine threat level
            const threatLevel = this.determineThreatLevel(totalAggro);
            
            // Calculate action probabilities
            const actionProbabilities = this.calculateActionProbabilities(totalAggro, entity);
            
            // Calculate effective radius
            const effectiveRadius = this.calculateEffectiveRadius(totalAggro, entity);
            
            // Generate statistical analysis
            const statistics = this.calculateAggroStatistics(totalAggro, aggroFactors, entity);
            
            results.push({
                entityId: entity.id,
                entity: entity,
                aggro: {
                    total: totalAggro,
                    factors: aggroFactors,
                    distanceInfluence: distanceInfluence,
                    timeDecay: timeDecay,
                    interactionBuildup: interactionBuiluup
                },
                threatLevel: threatLevel,
                actionProbabilities: actionProbabilities,
                effectiveRadius: effectiveRadius,
                statistics: statistics,
                recommendations: this.generateAggroRecommendations(totalAggro, entity)
            });
        }
        
        // Calculate system-wide aggro metrics
        const systemMetrics = this.calculateSystemAggroMetrics(results);
        
        console.log(`✅ Aggro system calculated`);
        console.log(`📊 Average aggro: ${systemMetrics.averageAggro.toFixed(3)}`);
        console.log(`⚠️ High threat entities: ${systemMetrics.highThreatCount}`);
        
        const finalResult = {
            entities: results,
            systemMetrics: systemMetrics,
            timestamp: currentTime,
            recommendations: this.generateSystemRecommendations(systemMetrics)
        };
        
        this.emit('aggro_calculated', finalResult);
        return finalResult;
    }
    
    /**
     * Calculate damage with complex formulas and modifiers
     */
    calculateDamage(attacker, target, attack, options = {}) {
        console.log(`\n⚔️ Calculating damage: ${attacker.name || 'Attacker'} -> ${target.name || 'Target'}`);
        
        // Get base damage
        const baseDamage = this.getBaseDamage(attack);
        
        // Apply scaling based on attacker level/stats
        const scaledDamage = this.applyDamageScaling(baseDamage, attacker, attack);
        
        // Calculate critical hit chance and damage
        const criticalResult = this.calculateCriticalHit(attacker, attack, options);
        
        // Apply critical damage if applicable
        let finalDamage = criticalResult.isCritical ? 
            scaledDamage * criticalResult.multiplier : scaledDamage;
        
        // Apply target resistances
        const resistedDamage = this.applyResistances(finalDamage, target, attack);
        
        // Apply random variance (5-15%)
        const variance = 0.05 + (Math.random() * 0.1);
        const varianceDamage = resistedDamage * (1 + (Math.random() < 0.5 ? -variance : variance));
        
        // Apply environmental modifiers
        const environmentalDamage = this.applyEnvironmentalModifiers(varianceDamage, options);
        
        // Calculate overkill and underkill
        const damageAnalysis = this.analyzeDamage(environmentalDamage, target, attack);
        
        const result = {
            baseDamage: baseDamage,
            scaledDamage: scaledDamage,
            finalDamage: Math.max(1, Math.floor(environmentalDamage)), // Minimum 1 damage
            critical: criticalResult,
            resistance: {
                original: finalDamage,
                afterResistance: resistedDamage,
                reductionPercent: ((finalDamage - resistedDamage) / finalDamage) * 100
            },
            variance: {
                applied: variance,
                beforeVariance: resistedDamage,
                afterVariance: varianceDamage
            },
            environmental: {
                modifiers: options.environmental || {},
                beforeEnvironmental: varianceDamage,
                afterEnvironmental: environmentalDamage
            },
            analysis: damageAnalysis,
            breakdown: this.generateDamageBreakdown(baseDamage, environmentalDamage, criticalResult)
        };
        
        console.log(`💥 Damage calculated: ${result.finalDamage} (${criticalResult.isCritical ? 'CRITICAL!' : 'normal'})`);
        
        this.emit('damage_calculated', { attacker, target, attack, result });
        return result;
    }
    
    /**
     * Calculate experience and progression systems
     */
    calculateExperienceProgression(player, action, options = {}) {
        console.log(`\n📈 Calculating experience for ${player.name || 'Player'}...`);
        
        // Get base experience for action
        const baseXP = this.getBaseExperience(action, options);
        
        // Calculate level-based modifiers
        const levelModifiers = this.calculateLevelModifiers(player, action);
        
        // Calculate difficulty bonus
        const difficultyBonus = this.calculateDifficultyBonus(action, options);
        
        // Calculate streak bonus
        const streakBonus = this.calculateStreakBonus(player, action);
        
        // Calculate perfect performance bonus
        const perfectBonus = this.calculatePerfectBonus(action, options);
        
        // Calculate total experience
        let totalXP = baseXP;
        totalXP *= levelModifiers.multiplier;
        totalXP += difficultyBonus;
        totalXP += streakBonus;
        totalXP += perfectBonus;
        
        // Apply diminishing returns for high-level players
        totalXP = this.applyDiminishingReturns(totalXP, player);
        
        // Calculate required XP for next level
        const currentLevel = player.level || 1;
        const nextLevelXP = this.calculateRequiredXP(currentLevel + 1, options.curve || 'exponential');
        const currentLevelXP = this.calculateRequiredXP(currentLevel, options.curve || 'exponential');
        const requiredXP = nextLevelXP - currentLevelXP;
        
        // Calculate progress towards next level
        const currentXP = player.experience || 0;
        const progressXP = currentXP - currentLevelXP;
        const progressPercent = (progressXP / requiredXP) * 100;
        
        // Check if level up occurs
        const newTotalXP = currentXP + totalXP;
        const levelsGained = this.calculateLevelsGained(newTotalXP, currentLevel, options.curve);
        
        // Calculate rewards for level up
        const levelUpRewards = levelsGained > 0 ? 
            this.calculateLevelUpRewards(currentLevel, levelsGained) : {};
        
        const result = {
            baseXP: baseXP,
            totalXP: Math.floor(totalXP),
            modifiers: {
                level: levelModifiers,
                difficulty: difficultyBonus,
                streak: streakBonus,
                perfect: perfectBonus,
                diminishing: totalXP / (baseXP * levelModifiers.multiplier + difficultyBonus + streakBonus + perfectBonus)
            },
            progression: {
                currentLevel: currentLevel,
                newLevel: currentLevel + levelsGained,
                levelsGained: levelsGained,
                currentXP: currentXP,
                newXP: newTotalXP,
                requiredForNext: requiredXP,
                progressPercent: Math.min(100, progressPercent + (totalXP / requiredXP) * 100)
            },
            rewards: levelUpRewards,
            analysis: this.analyzeExperienceGain(totalXP, player, action)
        };
        
        console.log(`📊 Experience calculated: ${result.totalXP} XP`);
        if (levelsGained > 0) {
            console.log(`🎉 Level up! ${currentLevel} -> ${currentLevel + levelsGained}`);
        }
        
        this.emit('experience_calculated', { player, action, result });
        return result;
    }
    
    /**
     * Calculate probability distributions for various game events
     */
    calculateProbabilitySystem(event, context = {}) {
        console.log(`\n🎲 Calculating probability system for event: ${event.type}`);
        
        // Get base probability
        const baseProbability = this.getBaseProbability(event);
        
        // Calculate modifiers based on context
        const modifiers = this.calculateProbabilityModifiers(event, context);
        
        // Apply modifiers to base probability
        let finalProbability = baseProbability;
        for (const [modifier, value] of Object.entries(modifiers)) {
            finalProbability += value;
        }
        
        // Ensure probability is within valid range
        finalProbability = Math.max(0, Math.min(1, finalProbability));
        
        // Generate probability distribution
        const distribution = this.generateProbabilityDistribution(finalProbability, event);
        
        // Calculate confidence intervals
        const confidenceIntervals = this.calculateConfidenceIntervals(finalProbability, event);
        
        // Generate multiple outcomes with probabilities
        const outcomes = this.generateProbabilisticOutcomes(finalProbability, event, context);
        
        // Calculate expected value
        const expectedValue = this.calculateExpectedValue(outcomes);
        
        // Perform statistical tests
        const statisticalTests = this.performStatisticalTests(outcomes, finalProbability);
        
        const result = {
            event: event,
            baseProbability: baseProbability,
            modifiers: modifiers,
            finalProbability: finalProbability,
            distribution: distribution,
            confidenceIntervals: confidenceIntervals,
            outcomes: outcomes,
            expectedValue: expectedValue,
            statisticalTests: statisticalTests,
            recommendations: this.generateProbabilityRecommendations(finalProbability, event)
        };
        
        console.log(`🎯 Final probability: ${(finalProbability * 100).toFixed(1)}%`);
        console.log(`📊 Expected value: ${expectedValue.toFixed(2)}`);
        
        this.emit('probability_calculated', result);
        return result;
    }
    
    /**
     * Calculate economic systems and market dynamics
     */
    calculateEconomicSystem(market, options = {}) {
        console.log(`\n💰 Calculating economic system for market: ${market.name}`);
        
        // Calculate supply and demand
        const supplyDemand = this.calculateSupplyDemand(market);
        
        // Calculate price based on supply/demand
        const basePrice = this.calculateBasePrice(market, supplyDemand);
        
        // Apply inflation
        const inflationAdjustedPrice = this.applyInflation(basePrice, market);
        
        // Calculate market volatility
        const volatility = this.calculateMarketVolatility(market);
        
        // Apply volatility to price
        const volatilePrice = this.applyVolatility(inflationAdjustedPrice, volatility);
        
        // Calculate taxes and fees
        const taxes = this.calculateTaxes(volatilePrice, market, options);
        
        // Calculate final price including taxes
        const finalPrice = volatilePrice + taxes.total;
        
        // Calculate market trends
        const trends = this.calculateMarketTrends(market);
        
        // Calculate economic indicators
        const indicators = this.calculateEconomicIndicators(market, finalPrice);
        
        // Generate price predictions
        const predictions = this.generatePricePredictions(market, trends, indicators);
        
        const result = {
            market: market,
            pricing: {
                base: basePrice,
                inflationAdjusted: inflationAdjustedPrice,
                volatile: volatilePrice,
                final: finalPrice,
                change: ((finalPrice - basePrice) / basePrice) * 100
            },
            supplyDemand: supplyDemand,
            volatility: volatility,
            taxes: taxes,
            trends: trends,
            indicators: indicators,
            predictions: predictions,
            recommendations: this.generateEconomicRecommendations(result)
        };
        
        // Update market state
        this.updateMarketState(market, result);
        
        console.log(`💵 Final price: ${finalPrice.toFixed(2)} (${result.pricing.change.toFixed(1)}% change)`);
        console.log(`📈 Market trend: ${trends.direction} (${trends.strength})`);
        
        this.emit('economy_calculated', result);
        return result;
    }
    
    /**
     * Calculate engagement metrics and player retention
     */
    calculateEngagementMetrics(player, session, options = {}) {
        console.log(`\n📊 Calculating engagement metrics for ${player.name || 'Player'}...`);
        
        // Calculate engagement factors
        const factors = this.calculateEngagementFactors(player, session);
        
        // Calculate retention probabilities
        const retention = this.calculateRetentionProbabilities(player, factors);
        
        // Calculate session quality
        const sessionQuality = this.calculateSessionQuality(session);
        
        // Calculate progression satisfaction
        const progressionSatisfaction = this.calculateProgressionSatisfaction(player, session);
        
        // Calculate social engagement
        const socialEngagement = this.calculateSocialEngagement(player, session);
        
        // Calculate overall engagement score
        const overallScore = this.calculateOverallEngagement(factors, sessionQuality, progressionSatisfaction, socialEngagement);
        
        // Generate engagement insights
        const insights = this.generateEngagementInsights(player, factors, overallScore);
        
        // Calculate churn risk
        const churnRisk = this.calculateChurnRisk(player, overallScore, retention);
        
        // Generate personalized recommendations
        const recommendations = this.generateEngagementRecommendations(player, insights, churnRisk);
        
        const result = {
            player: {
                id: player.id,
                name: player.name,
                level: player.level,
                totalSessions: player.totalSessions || 0
            },
            engagement: {
                factors: factors,
                sessionQuality: sessionQuality,
                progressionSatisfaction: progressionSatisfaction,
                socialEngagement: socialEngagement,
                overallScore: overallScore
            },
            retention: retention,
            churnRisk: churnRisk,
            insights: insights,
            recommendations: recommendations,
            predictions: this.generateEngagementPredictions(player, overallScore)
        };
        
        console.log(`📈 Engagement score: ${(overallScore * 100).toFixed(1)}/100`);
        console.log(`⚠️ Churn risk: ${churnRisk.level} (${(churnRisk.probability * 100).toFixed(1)}%)`);
        
        this.emit('engagement_calculated', result);
        return result;
    }
    
    // ===================
    // UTILITY FUNCTIONS
    // ===================
    
    /**
     * Calculate base aggro factors
     */
    calculateAggroFactors(entity, options) {
        return {
            activity: Math.min(1, (entity.activityLevel || 0.5) * (entity.recentActions || 1) / 10),
            proximity: Math.max(0, 1 - (entity.distance || 100) / this.config.aggro.maxRadius),
            interaction: Math.min(1, (entity.interactions || 0) / 5),
            time: Math.min(1, (Date.now() - (entity.lastSeen || Date.now())) / (60 * 60 * 1000)) // Hours since last seen
        };
    }
    
    calculateDistanceInfluence(entity, options) {
        const distance = entity.distance || this.config.aggro.baseRadius;
        const maxRadius = this.config.aggro.maxRadius;
        
        return Math.max(0.1, 1 - (distance / maxRadius));
    }
    
    calculateTimeDecay(entity, currentTime) {
        const lastUpdate = entity.lastAggroUpdate || currentTime;
        const timeDiff = (currentTime - lastUpdate) / 1000; // seconds
        
        return Math.pow(this.config.aggro.decayRate, timeDiff / 60); // Decay per minute
    }
    
    calculateInteractionBuildup(entity) {
        const recentInteractions = entity.recentInteractions || 0;
        return Math.min(0.5, recentInteractions * 0.1);
    }
    
    determineThreatLevel(aggro) {
        const thresholds = this.config.aggro.thresholds;
        
        if (aggro >= thresholds.extreme) return 'extreme';
        if (aggro >= thresholds.high) return 'high';
        if (aggro >= thresholds.medium) return 'medium';
        if (aggro >= thresholds.low) return 'low';
        return 'minimal';
    }
    
    calculateActionProbabilities(aggro, entity) {
        const baseChances = this.config.probability.baseChances;
        const aggroMultiplier = 1 + aggro;
        
        return {
            attack: Math.min(0.9, aggro * 0.8),
            defend: Math.min(0.8, (1 - aggro) * 0.6 + 0.2),
            flee: Math.min(0.7, (1 - aggro) * 0.5),
            idle: Math.min(0.6, (1 - aggro) * 0.4),
            critical: baseChances.critical * aggroMultiplier,
            dodge: baseChances.dodge * (2 - aggroMultiplier),
            block: baseChances.block * (1.5 - aggro * 0.5)
        };
    }
    
    calculateEffectiveRadius(aggro, entity) {
        const baseRadius = this.config.aggro.baseRadius;
        const threatLevel = this.determineThreatLevel(aggro);
        const multiplier = this.config.aggro.radiusMultipliers[threatLevel];
        
        return baseRadius * multiplier * (1 + (entity.size || 1) * 0.1);
    }
    
    /**
     * Random number generators
     */
    generateNormalRandom(mean = 0, stdDev = 1) {
        let u = 0, v = 0;
        while(u === 0) u = Math.random();
        while(v === 0) v = Math.random();
        
        const normal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return normal * stdDev + mean;
    }
    
    generateExponentialRandom(lambda = 1) {
        return -Math.log(Math.random()) / lambda;
    }
    
    generatePoissonRandom(lambda = 5) {
        const L = Math.exp(-lambda);
        let k = 0;
        let p = 1;
        
        do {
            k++;
            p *= Math.random();
        } while (p > L);
        
        return k - 1;
    }
    
    /**
     * Mathematical utility functions
     */
    fibonacci(n) {
        if (n <= 1) return n;
        let a = 0, b = 1;
        for (let i = 2; i <= n; i++) {
            [a, b] = [b, a + b];
        }
        return b;
    }
    
    calculateMean(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    calculateStandardDeviation(values) {
        const mean = this.calculateMean(values);
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const avgSquaredDiff = this.calculateMean(squaredDiffs);
        return Math.sqrt(avgSquaredDiff);
    }
    
    /**
     * Damage calculation helpers
     */
    getBaseDamage(attack) {
        const damageType = attack.type || 'physical';
        const baseDamageConfig = this.config.damage.baseDamage[damageType] || this.config.damage.baseDamage.physical;
        
        return {
            min: baseDamageConfig.min,
            max: baseDamageConfig.max,
            average: (baseDamageConfig.min + baseDamageConfig.max) / 2,
            rolled: baseDamageConfig.min + Math.random() * (baseDamageConfig.max - baseDamageConfig.min)
        };
    }
    
    applyDamageScaling(baseDamage, attacker, attack) {
        const scalingType = attack.scaling || 'linear';
        const scalingFunction = this.config.damage.scaling[scalingType];
        const level = attacker.level || 1;
        
        return scalingFunction(baseDamage.rolled, level);
    }
    
    calculateCriticalHit(attacker, attack, options) {
        const baseCritChance = this.config.probability.baseChances.critical;
        let critChance = baseCritChance;
        
        // Apply modifiers
        if (attacker.criticalChance) {
            critChance += attacker.criticalChance;
        }
        
        if (attack.criticalBonus) {
            critChance += attack.criticalBonus;
        }
        
        const isCritical = Math.random() < critChance;
        const multiplier = isCritical ? (2.0 + Math.random() * 0.5) : 1.0; // 2.0-2.5x crit
        
        return {
            isCritical: isCritical,
            chance: critChance,
            multiplier: multiplier,
            damage: isCritical ? 'CRITICAL HIT!' : 'normal'
        };
    }
    
    /**
     * System initialization helpers
     */
    setupPeriodicCalculations() {
        // Update aggro decay every minute
        setInterval(() => {
            this.updateAggroDecay();
        }, 60000);
        
        // Update economic inflation every hour
        setInterval(() => {
            this.updateInflation();
        }, 3600000);
    }
    
    initializeEconomy() {
        // Set initial market prices
        const items = ['sword', 'shield', 'potion', 'scroll', 'gem'];
        
        for (const item of items) {
            this.gameState.economy.marketPrices.set(item, {
                basePrice: 100 + Math.random() * 200,
                currentPrice: 0,
                trend: 'stable',
                volatility: 0.1 + Math.random() * 0.2
            });
        }
    }
    
    updateAggroDecay() {
        // Apply global aggro decay
        for (const [entityId, entity] of this.gameState.entities) {
            if (entity.aggro) {
                entity.aggro *= this.config.aggro.decayRate;
                if (entity.aggro < 0.01) {
                    entity.aggro = 0;
                }
            }
        }
    }
    
    updateInflation() {
        // Calculate new inflation rate based on player actions
        const currentInflation = this.gameState.economy.inflationRate;
        const playerInfluence = this.gameState.statistics.activePlayers * this.config.economy.inflation.playerInfluence;
        
        this.gameState.economy.inflationRate = Math.max(0, currentInflation + playerInfluence);
    }
    
    /**
     * Get comprehensive system status
     */
    getSystemStatus() {
        return {
            gameState: {
                players: this.gameState.players.size,
                entities: this.gameState.entities.size,
                events: this.gameState.events.length,
                statistics: this.gameState.statistics
            },
            economy: this.gameState.economy,
            config: {
                aggroThresholds: Object.keys(this.config.aggro.thresholds).length,
                probabilityEvents: Object.keys(this.config.probability.baseChances).length,
                damageTypes: Object.keys(this.config.damage.baseDamage).length,
                progressionCurves: Object.keys(this.config.progression.xpCurves).length
            },
            cache: {
                probabilities: this.cache.probabilities.size,
                damages: this.cache.damages.size,
                aggros: this.cache.aggros.size,
                experiences: this.cache.experiences.size
            },
            uptime: process.uptime(),
            timestamp: Date.now()
        };
    }
}

// Export for use as module
module.exports = GameMechanicsCalculator;

// Demo if run directly
if (require.main === module) {
    console.log('⚔️ Running Game Mechanics Calculator Demo...\n');
    
    const gameMechanics = new GameMechanicsCalculator();
    
    // Listen for events
    gameMechanics.on('aggro_calculated', (result) => {
        console.log(`\n📊 Aggro system calculated for ${result.entities.length} entities`);
    });
    
    gameMechanics.on('damage_calculated', ({ attacker, target, result }) => {
        console.log(`\n💥 Damage calculated: ${result.finalDamage} damage dealt`);
    });
    
    gameMechanics.on('experience_calculated', ({ player, result }) => {
        console.log(`\n📈 ${player.name} gained ${result.totalXP} XP`);
    });
    
    // Demo aggro system
    setTimeout(() => {
        console.log('\n🎮 Demo: Aggro System Calculation...');
        
        const entities = [
            {
                id: 1,
                name: 'Goblin Warrior',
                activityLevel: 0.7,
                distance: 120,
                interactions: 3,
                recentActions: 5,
                lastSeen: Date.now() - 300000 // 5 minutes ago
            },
            {
                id: 2,
                name: 'Orc Berserker',
                activityLevel: 0.9,
                distance: 80,
                interactions: 8,
                recentActions: 12,
                lastSeen: Date.now() - 60000 // 1 minute ago
            },
            {
                id: 3,
                name: 'Peaceful Merchant',
                activityLevel: 0.2,
                distance: 300,
                interactions: 1,
                recentActions: 1,
                lastSeen: Date.now() - 1800000 // 30 minutes ago
            }
        ];
        
        const aggroResult = gameMechanics.calculateAggroSystem(entities);
        
        console.log(`📊 Aggro Results:`);
        for (const entity of aggroResult.entities) {
            console.log(`   ${entity.entity.name}: ${(entity.aggro.total * 100).toFixed(1)}% (${entity.threatLevel})`);
        }
        
    }, 1000);
    
    // Demo damage calculation
    setTimeout(() => {
        console.log('\n🎮 Demo: Damage Calculation...');
        
        const attacker = {
            name: 'Player Knight',
            level: 15,
            criticalChance: 0.15
        };
        
        const target = {
            name: 'Dragon',
            level: 20,
            physicalResistance: 0.3
        };
        
        const attack = {
            type: 'physical',
            scaling: 'exponential',
            criticalBonus: 0.05
        };
        
        const damageResult = gameMechanics.calculateDamage(attacker, target, attack);
        
        console.log(`💥 Damage breakdown:`);
        console.log(`   Base: ${damageResult.baseDamage.rolled.toFixed(0)}`);
        console.log(`   Scaled: ${damageResult.scaledDamage.toFixed(0)}`);
        console.log(`   Final: ${damageResult.finalDamage}`);
        console.log(`   Critical: ${damageResult.critical.isCritical ? 'YES' : 'No'}`);
        
    }, 3000);
    
    // Demo experience calculation
    setTimeout(() => {
        console.log('\n🎮 Demo: Experience Calculation...');
        
        const player = {
            name: 'Player Mage',
            level: 8,
            experience: 15000
        };
        
        const action = {
            type: 'kill_monster',
            difficulty: 'medium',
            monster: 'Orc',
            perfect: true
        };
        
        const xpResult = gameMechanics.calculateExperienceProgression(player, action);
        
        console.log(`📈 Experience breakdown:`);
        console.log(`   Base XP: ${xpResult.baseXP}`);
        console.log(`   Total XP: ${xpResult.totalXP}`);
        console.log(`   Current Level: ${xpResult.progression.currentLevel}`);
        if (xpResult.progression.levelsGained > 0) {
            console.log(`   🎉 LEVEL UP! New level: ${xpResult.progression.newLevel}`);
        }
        
    }, 5000);
    
    // Show system status
    setTimeout(() => {
        console.log('\n📊 System Status:');
        const status = gameMechanics.getSystemStatus();
        console.log(`🎮 Game State: ${status.gameState.players} players, ${status.gameState.entities} entities`);
        console.log(`💰 Economy: ${status.economy.inflationRate.toFixed(4)} inflation rate`);
        console.log(`⚙️ Config: ${status.config.aggroThresholds} aggro thresholds, ${status.config.damageTypes} damage types`);
        console.log(`🗄️ Cache: ${Object.values(status.cache).reduce((a, b) => a + b, 0)} cached calculations`);
        
        console.log('\n✨ Game Mechanics Calculator Demo Complete!');
    }, 7000);
}