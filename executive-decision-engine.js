#!/usr/bin/env node

/**
 * 🧠 EXECUTIVE DECISION ENGINE
 * Advanced AI decision-making with real-time data, weather awareness, and faction politics
 * Makes strategic decisions using multi-factor analysis and pattern recognition
 */

import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import fetch from 'node-fetch';
import { createHash } from 'crypto';

class ExecutiveDecisionEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            decisionLatency: config.decisionLatency || 2000, // ms
            confidenceThreshold: config.confidenceThreshold || 0.7,
            riskTolerance: config.riskTolerance || 0.5,
            enableLearning: config.enableLearning !== false,
            maxDecisionHistory: config.maxDecisionHistory || 10000,
            weatherApiKey: config.weatherApiKey || null,
            marketApiKey: config.marketApiKey || null,
            ...config
        };
        
        // Decision history and learning
        this.decisionHistory = [];
        this.learningPatterns = new Map();
        this.successPatterns = new Map();
        this.failurePatterns = new Map();
        
        // Real-time data streams
        this.realTimeData = {
            weather: new Map(),
            market: new Map(),
            faction_tensions: new Map(),
            resource_availability: new Map(),
            system_performance: new Map()
        };
        
        // Decision factors and weights
        this.factorWeights = {
            cost: 0.20,
            risk: 0.25,
            benefit: 0.30,
            timing: 0.15,
            politics: 0.10
        };
        
        // Faction relationships matrix
        this.factionRelations = new Map([
            ['tech', { allies: ['neutral'], enemies: ['traditional'], reputation: 0.8 }],
            ['creative', { allies: ['neutral'], enemies: ['corporate'], reputation: 0.6 }],
            ['corporate', { allies: ['traditional'], enemies: ['creative'], reputation: 0.7 }],
            ['traditional', { allies: ['corporate'], enemies: ['tech'], reputation: 0.5 }],
            ['neutral', { allies: ['tech', 'creative'], enemies: [], reputation: 0.9 }]
        ]);
        
        // Decision types and their complexity
        this.decisionTypes = {
            resource_allocation: { complexity: 0.6, impact: 0.7 },
            strategic_pivot: { complexity: 0.9, impact: 0.9 },
            faction_diplomacy: { complexity: 0.8, impact: 0.6 },
            emergency_response: { complexity: 0.7, impact: 0.8 },
            project_approval: { complexity: 0.5, impact: 0.6 },
            technology_adoption: { complexity: 0.7, impact: 0.8 },
            market_timing: { complexity: 0.8, impact: 0.9 },
            weather_adjustment: { complexity: 0.4, impact: 0.5 }
        };
        
        // AI models for different decision types
        this.aiModels = {
            strategic: 'claude-3-opus', // For high-impact strategic decisions
            tactical: 'gpt-4', // For complex tactical decisions
            operational: 'ollama/mistral', // For routine operational decisions
            emergency: 'claude-3-sonnet' // For emergency decisions
        };
        
        // Real-time connections
        this.connections = {
            executiveOS: null,
            restAPI: null,
            weatherService: null,
            marketService: null
        };
        
        this.init();
    }
    
    async init() {
        console.log('🧠 Initializing Executive Decision Engine...');
        
        // Connect to real-time data sources
        await this.connectDataSources();
        
        // Initialize learning system
        this.initializeLearning();
        
        // Start real-time monitoring
        this.startRealTimeMonitoring();
        
        console.log('✅ Decision Engine ready');
    }
    
    async connectDataSources() {
        // Connect to Executive OS
        try {
            this.connections.executiveOS = new WebSocket('ws://localhost:9001');
            this.connections.executiveOS.on('open', () => {
                console.log('🔗 Connected to Executive OS');
            });
            this.connections.executiveOS.on('message', (data) => {
                this.handleExecutiveUpdate(JSON.parse(data));
            });
        } catch (error) {
            console.warn('⚠️ Executive OS not available');
        }
        
        // Connect to REST API for resource data
        this.connections.restAPI = {
            baseUrl: 'http://localhost:8200',
            getResources: async (type, faction) => {
                try {
                    const response = await fetch(`${this.connections.restAPI.baseUrl}/api/resources`, {
                        headers: {
                            'X-Faction': faction || 'neutral'
                        }
                    });
                    return await response.json();
                } catch (error) {
                    console.error('REST API error:', error);
                    return { resources: [] };
                }
            }
        };
        
        // Initialize weather service
        this.connections.weatherService = {
            getWeather: async (location) => {
                try {
                    const response = await fetch(`${this.connections.restAPI.baseUrl}/api/weather/${location}`);
                    return await response.json();
                } catch (error) {
                    return this.generateMockWeather(location);
                }
            }
        };
        
        // Initialize market service
        this.connections.marketService = {
            getMarketData: async (symbol) => {
                try {
                    const response = await fetch(`${this.connections.restAPI.baseUrl}/api/market/${symbol}`);
                    return await response.json();
                } catch (error) {
                    return this.generateMockMarket(symbol);
                }
            }
        };
    }
    
    initializeLearning() {
        // Load historical patterns if available
        this.loadLearningPatterns();
        
        // Initialize pattern recognition
        this.patternRecognition = {
            identifyPattern: (decision) => {
                const features = this.extractFeatures(decision);
                const signature = this.createSignature(features);
                return signature;
            },
            
            updatePattern: (signature, outcome) => {
                if (!this.learningPatterns.has(signature)) {
                    this.learningPatterns.set(signature, {
                        occurrences: 0,
                        successes: 0,
                        failures: 0,
                        avgOutcome: 0
                    });
                }
                
                const pattern = this.learningPatterns.get(signature);
                pattern.occurrences++;
                
                if (outcome.success) {
                    pattern.successes++;
                } else {
                    pattern.failures++;
                }
                
                pattern.avgOutcome = pattern.successes / pattern.occurrences;
            }
        };
    }
    
    startRealTimeMonitoring() {
        // Update real-time data periodically
        setInterval(() => {
            this.updateRealTimeData();
        }, 30000); // Every 30 seconds
        
        // Clean old data periodically
        setInterval(() => {
            this.cleanOldData();
        }, 300000); // Every 5 minutes
        
        // Save learning patterns periodically
        if (this.config.enableLearning) {
            setInterval(() => {
                this.saveLearningPatterns();
            }, 600000); // Every 10 minutes
        }
    }
    
    async makeDecision(request) {
        const startTime = Date.now();
        
        const decision = {
            id: `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            request,
            timestamp: new Date(),
            status: 'analyzing',
            confidence: 0,
            reasoning: [],
            factors: {},
            recommendation: null,
            alternatives: [],
            risks: [],
            opportunities: []
        };
        
        this.emit('decision:started', decision);
        
        try {
            // Step 1: Gather context
            console.log(`🎯 Analyzing decision: ${request.type || 'unknown'}`);
            const context = await this.gatherContext(request);
            decision.context = context;
            
            // Step 2: Multi-factor analysis
            decision.factors = await this.analyzeFactors(request, context);
            
            // Step 3: Risk assessment
            decision.risks = await this.assessRisks(request, context);
            
            // Step 4: Opportunity identification
            decision.opportunities = await this.identifyOpportunities(request, context);
            
            // Step 5: Pattern matching
            const pattern = this.patternRecognition.identifyPattern(decision);
            decision.pattern = pattern;
            const historicalOutcome = this.learningPatterns.get(pattern);
            
            // Step 6: AI-powered reasoning
            decision.aiAnalysis = await this.getAIAnalysis(request, context, decision);
            
            // Step 7: Generate alternatives
            decision.alternatives = await this.generateAlternatives(request, context);
            
            // Step 8: Score options
            const scores = await this.scoreOptions(decision);
            decision.scores = scores;
            
            // Step 9: Make recommendation
            decision.recommendation = this.makeRecommendation(scores, decision);
            decision.confidence = this.calculateConfidence(decision);
            
            // Step 10: Generate reasoning
            decision.reasoning = this.generateReasoning(decision);
            
            // Update status
            decision.status = 'completed';
            decision.duration = Date.now() - startTime;
            
            // Store in history
            this.decisionHistory.push(decision);
            
            // Trim history if needed
            if (this.decisionHistory.length > this.config.maxDecisionHistory) {
                this.decisionHistory.shift();
            }
            
            // Emit completion
            this.emit('decision:completed', decision);
            
            console.log(`✅ Decision completed in ${decision.duration}ms: ${decision.recommendation.action}`);
            
            return decision;
            
        } catch (error) {
            decision.status = 'error';
            decision.error = error.message;
            decision.duration = Date.now() - startTime;
            
            this.emit('decision:error', decision);
            console.error('❌ Decision error:', error);
            
            throw error;
        }
    }
    
    async gatherContext(request) {
        const context = {
            timestamp: new Date(),
            faction: request.faction || 'neutral',
            domain: request.domain || 'default',
            urgency: request.urgency || 'normal',
            weather: null,
            market: null,
            resources: null,
            factionRelations: null,
            systemHealth: null
        };
        
        // Gather weather if location-sensitive
        if (request.location || request.weatherSensitive) {
            const location = request.location || 'global';
            context.weather = await this.connections.weatherService.getWeather(location);
            this.realTimeData.weather.set(location, context.weather);
        }
        
        // Gather market data if financial impact
        if (request.financialImpact || request.marketSensitive) {
            const symbol = request.marketSymbol || 'SPY';
            context.market = await this.connections.marketService.getMarketData(symbol);
            this.realTimeData.market.set(symbol, context.market);
        }
        
        // Get current resources
        if (this.connections.restAPI) {
            context.resources = await this.connections.restAPI.getResources(null, context.faction);
        }
        
        // Get faction relations
        context.factionRelations = this.getFactionRelations(context.faction);
        
        // Get system health
        context.systemHealth = await this.getSystemHealth();
        
        return context;
    }
    
    async analyzeFactors(request, context) {
        const factors = {};
        
        // Cost analysis
        factors.cost = await this.analyzeCost(request, context);
        
        // Risk analysis
        factors.risk = await this.analyzeRisk(request, context);
        
        // Benefit analysis
        factors.benefit = await this.analyzeBenefit(request, context);
        
        // Timing analysis
        factors.timing = await this.analyzeTiming(request, context);
        
        // Political/faction analysis
        factors.politics = await this.analyzePolitics(request, context);
        
        // Weather impact
        if (context.weather) {
            factors.weather = this.analyzeWeatherImpact(request, context.weather);
        }
        
        // Market impact
        if (context.market) {
            factors.market = this.analyzeMarketImpact(request, context.market);
        }
        
        return factors;
    }
    
    async analyzeCost(request, context) {
        const costAnalysis = {
            estimated: request.estimatedCost || 0,
            type: 'monetary',
            confidence: 0.7,
            factors: []
        };
        
        // Resource costs
        if (request.requiredResources) {
            for (const [resource, amount] of Object.entries(request.requiredResources)) {
                const cost = this.getResourceCost(resource, amount, context.faction);
                costAnalysis.estimated += cost;
                costAnalysis.factors.push({
                    type: 'resource',
                    resource,
                    amount,
                    cost
                });
            }
        }
        
        // Opportunity cost
        if (request.alternativeProjects) {
            const opportunityCost = request.alternativeProjects.reduce((sum, proj) => 
                sum + (proj.expectedReturn || 0), 0);
            costAnalysis.opportunityCost = opportunityCost;
        }
        
        // Time cost
        if (request.timeline) {
            const timeCost = this.calculateTimeCost(request.timeline, context);
            costAnalysis.timeCost = timeCost;
        }
        
        // Normalize to 0-1 scale
        costAnalysis.normalized = Math.min(costAnalysis.estimated / 100000, 1);
        
        return costAnalysis;
    }
    
    async analyzeRisk(request, context) {
        const riskAnalysis = {
            overall: 0.5,
            categories: {},
            factors: [],
            mitigation: []
        };
        
        // Technical risk
        if (request.technicalComplexity) {
            riskAnalysis.categories.technical = Math.min(request.technicalComplexity, 1);
            riskAnalysis.factors.push({
                type: 'technical',
                level: riskAnalysis.categories.technical,
                description: 'High technical complexity'
            });
        }
        
        // Market risk
        if (context.market) {
            const volatility = Math.abs(context.market.change) / context.market.price;
            riskAnalysis.categories.market = Math.min(volatility * 10, 1);
        }
        
        // Weather risk
        if (context.weather && request.weatherSensitive) {
            const weatherRisk = this.calculateWeatherRisk(context.weather, request);
            riskAnalysis.categories.weather = weatherRisk;
        }
        
        // Faction risk
        const factionRisk = this.calculateFactionRisk(context.faction, request);
        riskAnalysis.categories.faction = factionRisk;
        
        // Resource availability risk
        if (context.resources) {
            const resourceRisk = this.calculateResourceRisk(request, context.resources);
            riskAnalysis.categories.resource = resourceRisk;
        }
        
        // Calculate overall risk
        const categories = Object.values(riskAnalysis.categories);
        riskAnalysis.overall = categories.length > 0 ? 
            categories.reduce((sum, risk) => sum + risk, 0) / categories.length : 0.5;
        
        // Generate mitigation strategies
        riskAnalysis.mitigation = this.generateRiskMitigation(riskAnalysis);
        
        return riskAnalysis;
    }
    
    async analyzeBenefit(request, context) {
        const benefitAnalysis = {
            expected: 0,
            categories: {},
            confidence: 0.6
        };
        
        // Direct financial benefit
        if (request.expectedRevenue) {
            benefitAnalysis.categories.financial = Math.min(request.expectedRevenue / 100000, 1);
        }
        
        // Strategic benefit
        if (request.strategicValue) {
            benefitAnalysis.categories.strategic = Math.min(request.strategicValue, 1);
        }
        
        // Learning benefit
        if (request.learningOpportunity) {
            benefitAnalysis.categories.learning = 0.3;
        }
        
        // Faction reputation benefit
        const reputationBenefit = this.calculateReputationBenefit(context.faction, request);
        benefitAnalysis.categories.reputation = reputationBenefit;
        
        // Market timing benefit
        if (context.market && context.market.trend === 'bullish') {
            benefitAnalysis.categories.timing = 0.7;
        }
        
        // Calculate expected benefit
        const benefits = Object.values(benefitAnalysis.categories);
        benefitAnalysis.expected = benefits.length > 0 ? 
            benefits.reduce((sum, benefit) => sum + benefit, 0) / benefits.length : 0.5;
        
        return benefitAnalysis;
    }
    
    async analyzeTiming(request, context) {
        const timingAnalysis = {
            score: 0.5,
            factors: [],
            urgency: request.urgency || 'normal'
        };
        
        // Market timing
        if (context.market) {
            if (context.market.trend === 'bullish' && request.type === 'investment') {
                timingAnalysis.score += 0.2;
                timingAnalysis.factors.push('Favorable market conditions');
            } else if (context.market.trend === 'bearish' && request.type === 'cost_reduction') {
                timingAnalysis.score += 0.3;
                timingAnalysis.factors.push('Market downturn favors cost initiatives');
            }
        }
        
        // Seasonal timing
        if (context.weather) {
            const seasonalScore = this.calculateSeasonalTiming(request, context.weather);
            timingAnalysis.score += seasonalScore;
        }
        
        // Resource availability timing
        if (context.resources) {
            const resourceTiming = this.calculateResourceTiming(request, context.resources);
            timingAnalysis.score += resourceTiming;
        }
        
        // Competitive timing
        const competitiveTiming = this.calculateCompetitiveTiming(request, context);
        timingAnalysis.score += competitiveTiming;
        
        // Urgency adjustment
        const urgencyMultiplier = {
            low: 0.8,
            normal: 1.0,
            high: 1.2,
            critical: 1.5
        };
        
        timingAnalysis.score *= urgencyMultiplier[timingAnalysis.urgency] || 1.0;
        timingAnalysis.score = Math.min(timingAnalysis.score, 1);
        
        return timingAnalysis;
    }
    
    async analyzePolitics(request, context) {
        const politicsAnalysis = {
            score: 0.5,
            factionSupport: {},
            conflicts: [],
            opportunities: []
        };
        
        // Faction relationships
        const relations = this.factionRelations.get(context.faction);
        if (relations) {
            // Check support from allies
            for (const ally of relations.allies) {
                politicsAnalysis.factionSupport[ally] = 0.8;
            }
            
            // Check opposition from enemies
            for (const enemy of relations.enemies) {
                politicsAnalysis.factionSupport[enemy] = 0.2;
                politicsAnalysis.conflicts.push(`Potential opposition from ${enemy} faction`);
            }
        }
        
        // Cross-faction implications
        if (request.affectedFactions) {
            for (const faction of request.affectedFactions) {
                const relationship = this.getFactionRelationship(context.faction, faction);
                politicsAnalysis.factionSupport[faction] = relationship;
                
                if (relationship < 0.3) {
                    politicsAnalysis.conflicts.push(`Strong opposition expected from ${faction}`);
                } else if (relationship > 0.7) {
                    politicsAnalysis.opportunities.push(`Strong support expected from ${faction}`);
                }
            }
        }
        
        // Calculate overall political score
        const supportValues = Object.values(politicsAnalysis.factionSupport);
        if (supportValues.length > 0) {
            politicsAnalysis.score = supportValues.reduce((sum, support) => sum + support, 0) / supportValues.length;
        }
        
        return politicsAnalysis;
    }
    
    async getAIAnalysis(request, context, decision) {
        const aiAnalysis = {
            model: this.selectAIModel(request),
            analysis: '',
            confidence: 0,
            recommendations: []
        };
        
        try {
            // Construct AI prompt
            const prompt = this.buildAIPrompt(request, context, decision);
            
            // Get AI response (simplified - would use actual AI API)
            aiAnalysis.analysis = await this.queryAI(aiAnalysis.model, prompt);
            aiAnalysis.confidence = this.calculateAIConfidence(aiAnalysis.analysis);
            aiAnalysis.recommendations = this.extractAIRecommendations(aiAnalysis.analysis);
            
        } catch (error) {
            console.error('AI analysis error:', error);
            aiAnalysis.analysis = 'AI analysis unavailable';
            aiAnalysis.confidence = 0.3;
        }
        
        return aiAnalysis;
    }
    
    selectAIModel(request) {
        const type = request.type || 'operational';
        const impact = request.impact || 'medium';
        const urgency = request.urgency || 'normal';
        
        if (urgency === 'critical') {
            return this.aiModels.emergency;
        } else if (impact === 'high' || type.includes('strategic')) {
            return this.aiModels.strategic;
        } else if (type.includes('tactical') || impact === 'medium') {
            return this.aiModels.tactical;
        } else {
            return this.aiModels.operational;
        }
    }
    
    buildAIPrompt(request, context, decision) {
        return `
        You are an executive decision-making AI. Analyze this decision request:
        
        REQUEST:
        Type: ${request.type}
        Description: ${request.description}
        Faction: ${context.faction}
        Urgency: ${request.urgency}
        
        CONTEXT:
        Weather: ${context.weather ? context.weather.conditions : 'N/A'}
        Market: ${context.market ? `${context.market.trend} (${context.market.change}%)` : 'N/A'}
        Resources: ${context.resources ? context.resources.resources?.length || 0 : 0} available
        
        ANALYSIS:
        Cost: ${decision.factors.cost?.normalized || 0}
        Risk: ${decision.factors.risk?.overall || 0}
        Benefit: ${decision.factors.benefit?.expected || 0}
        Timing: ${decision.factors.timing?.score || 0}
        Politics: ${decision.factors.politics?.score || 0}
        
        Provide a strategic analysis and recommendation. Consider:
        1. Primary risks and how to mitigate them
        2. Key opportunities to capture
        3. Timing considerations
        4. Political/faction implications
        5. Alternative approaches
        
        End with a clear RECOMMEND: APPROVE/CONDITIONAL/REJECT decision.
        `;
    }
    
    async queryAI(model, prompt) {
        // Simplified AI query (would integrate with actual APIs)
        const responses = [
            "Based on the analysis, this presents a balanced risk-reward scenario. The timing appears favorable given current market conditions. Primary risks include resource allocation conflicts and potential faction tensions. Recommend proceeding with enhanced monitoring and risk mitigation measures. RECOMMEND: CONDITIONAL",
            
            "Strategic analysis reveals significant upside potential with manageable downside risk. Weather conditions are favorable, and market timing aligns well with the initiative. Strong faction support expected. Key opportunity to establish market leadership. RECOMMEND: APPROVE",
            
            "High-risk scenario with uncertain returns. Current market volatility and resource constraints create challenging environment. Faction politics may complicate implementation. Consider delaying until more favorable conditions emerge. RECOMMEND: REJECT",
            
            "Moderate opportunity with standard risk profile. Timing is acceptable but not optimal. Faction alignment is neutral. Consider alternative approaches that might yield better risk-adjusted returns. RECOMMEND: CONDITIONAL"
        ];
        
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, this.config.decisionLatency));
        
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    calculateAIConfidence(analysis) {
        const confidenceIndicators = [
            { pattern: /high confidence/i, value: 0.9 },
            { pattern: /confident/i, value: 0.8 },
            { pattern: /likely/i, value: 0.7 },
            { pattern: /uncertain/i, value: 0.4 },
            { pattern: /unclear/i, value: 0.3 },
            { pattern: /recommend: approve/i, value: 0.8 },
            { pattern: /recommend: conditional/i, value: 0.6 },
            { pattern: /recommend: reject/i, value: 0.7 }
        ];
        
        let confidence = 0.5; // Default
        
        for (const indicator of confidenceIndicators) {
            if (indicator.pattern.test(analysis)) {
                confidence = Math.max(confidence, indicator.value);
            }
        }
        
        return confidence;
    }
    
    extractAIRecommendations(analysis) {
        const recommendations = [];
        
        // Extract recommendation patterns
        const lines = analysis.split('\n');
        for (const line of lines) {
            if (line.includes('recommend') || line.includes('suggest') || line.includes('consider')) {
                recommendations.push(line.trim());
            }
        }
        
        return recommendations;
    }
    
    async generateAlternatives(request, context) {
        const alternatives = [];
        
        // Generate alternatives based on request type
        switch (request.type) {
            case 'resource_allocation':
                alternatives.push(
                    { action: 'Gradual allocation', risk: 0.3, benefit: 0.6 },
                    { action: 'Full immediate allocation', risk: 0.7, benefit: 0.8 },
                    { action: 'Conditional allocation', risk: 0.4, benefit: 0.7 }
                );
                break;
                
            case 'strategic_pivot':
                alternatives.push(
                    { action: 'Complete pivot', risk: 0.8, benefit: 0.9 },
                    { action: 'Partial pivot', risk: 0.5, benefit: 0.6 },
                    { action: 'Test and iterate', risk: 0.4, benefit: 0.5 }
                );
                break;
                
            case 'project_approval':
                alternatives.push(
                    { action: 'Full approval', risk: 0.6, benefit: 0.8 },
                    { action: 'Pilot project', risk: 0.3, benefit: 0.5 },
                    { action: 'Reject', risk: 0.1, benefit: 0.2 }
                );
                break;
                
            default:
                alternatives.push(
                    { action: 'Approve as requested', risk: 0.5, benefit: 0.7 },
                    { action: 'Approve with conditions', risk: 0.3, benefit: 0.6 },
                    { action: 'Delay for more analysis', risk: 0.2, benefit: 0.3 },
                    { action: 'Reject', risk: 0.1, benefit: 0.1 }
                );
        }
        
        return alternatives;
    }
    
    async scoreOptions(decision) {
        const scores = {};
        
        // Score the main request
        scores.main = this.calculateScore(decision.factors, decision.request);
        
        // Score alternatives
        for (const alternative of decision.alternatives) {
            const altFactors = this.adjustFactorsForAlternative(decision.factors, alternative);
            scores[alternative.action] = this.calculateScore(altFactors, alternative);
        }
        
        return scores;
    }
    
    calculateScore(factors, option) {
        let score = 0;
        
        // Apply factor weights
        if (factors.cost) {
            score += (1 - factors.cost.normalized) * this.factorWeights.cost;
        }
        
        if (factors.risk) {
            score += (1 - factors.risk.overall) * this.factorWeights.risk;
        }
        
        if (factors.benefit) {
            score += factors.benefit.expected * this.factorWeights.benefit;
        }
        
        if (factors.timing) {
            score += factors.timing.score * this.factorWeights.timing;
        }
        
        if (factors.politics) {
            score += factors.politics.score * this.factorWeights.politics;
        }
        
        // Adjust for option-specific factors
        if (option.risk !== undefined) {
            score *= (1 - option.risk * 0.3); // Reduce score for high risk options
        }
        
        if (option.benefit !== undefined) {
            score *= (1 + option.benefit * 0.2); // Increase score for high benefit options
        }
        
        return Math.max(0, Math.min(1, score));
    }
    
    makeRecommendation(scores, decision) {
        // Find highest scoring option
        let bestOption = 'main';
        let bestScore = scores.main || 0;
        
        for (const [option, score] of Object.entries(scores)) {
            if (score > bestScore) {
                bestScore = score;
                bestOption = option;
            }
        }
        
        // Determine action based on score and confidence
        let action = 'conditional';
        
        if (bestScore > 0.7 && decision.confidence > this.config.confidenceThreshold) {
            action = 'approve';
        } else if (bestScore < 0.3) {
            action = 'reject';
        }
        
        // Risk tolerance check
        const risk = decision.factors.risk?.overall || 0.5;
        if (risk > this.config.riskTolerance && action === 'approve') {
            action = 'conditional';
        }
        
        return {
            action,
            option: bestOption,
            score: bestScore,
            confidence: decision.confidence,
            conditions: action === 'conditional' ? this.generateConditions(decision) : []
        };
    }
    
    generateConditions(decision) {
        const conditions = [];
        
        // Risk-based conditions
        if (decision.factors.risk?.overall > 0.6) {
            conditions.push('Implement additional risk mitigation measures');
        }
        
        // Cost-based conditions
        if (decision.factors.cost?.normalized > 0.7) {
            conditions.push('Secure additional budget approval');
        }
        
        // Political conditions
        if (decision.factors.politics?.conflicts.length > 0) {
            conditions.push('Obtain faction alignment and support');
        }
        
        // Weather conditions
        if (decision.factors.weather?.risk > 0.6) {
            conditions.push('Monitor weather conditions and adjust timeline');
        }
        
        // Market conditions
        if (decision.factors.market?.volatility > 0.7) {
            conditions.push('Wait for market stabilization');
        }
        
        return conditions;
    }
    
    calculateConfidence(decision) {
        let confidence = 0.5;
        
        // Factor completeness
        const factorCount = Object.keys(decision.factors).length;
        confidence += Math.min(factorCount * 0.1, 0.3);
        
        // AI analysis confidence
        if (decision.aiAnalysis) {
            confidence += decision.aiAnalysis.confidence * 0.3;
        }
        
        // Historical pattern confidence
        if (decision.pattern && this.learningPatterns.has(decision.pattern)) {
            const pattern = this.learningPatterns.get(decision.pattern);
            if (pattern.occurrences > 5) {
                confidence += pattern.avgOutcome * 0.2;
            }
        }
        
        // Risk alignment confidence
        const risk = decision.factors.risk?.overall || 0.5;
        if (Math.abs(risk - this.config.riskTolerance) < 0.2) {
            confidence += 0.1;
        }
        
        return Math.max(0, Math.min(1, confidence));
    }
    
    generateReasoning(decision) {
        const reasoning = [];
        
        // Primary factors
        if (decision.factors.benefit?.expected > 0.7) {
            reasoning.push('High expected benefit justifies investment');
        }
        
        if (decision.factors.risk?.overall > 0.7) {
            reasoning.push('Significant risks require careful consideration');
        }
        
        if (decision.factors.timing?.score > 0.7) {
            reasoning.push('Favorable timing supports immediate action');
        } else if (decision.factors.timing?.score < 0.3) {
            reasoning.push('Poor timing suggests delaying action');
        }
        
        // Political considerations
        if (decision.factors.politics?.conflicts.length > 0) {
            reasoning.push('Political tensions may complicate implementation');
        }
        
        // Weather impact
        if (decision.factors.weather) {
            const weather = decision.factors.weather;
            if (weather.risk > 0.6) {
                reasoning.push('Weather conditions pose operational challenges');
            }
        }
        
        // Market impact
        if (decision.factors.market) {
            const market = decision.factors.market;
            if (market.favorability > 0.7) {
                reasoning.push('Market conditions strongly favor this initiative');
            } else if (market.favorability < 0.3) {
                reasoning.push('Market conditions are unfavorable');
            }
        }
        
        // AI insights
        if (decision.aiAnalysis?.recommendations.length > 0) {
            reasoning.push(`AI analysis suggests: ${decision.aiAnalysis.recommendations[0]}`);
        }
        
        // Confidence qualifier
        if (decision.confidence < 0.5) {
            reasoning.push('Low confidence due to limited data or high uncertainty');
        } else if (decision.confidence > 0.8) {
            reasoning.push('High confidence in analysis and recommendation');
        }
        
        return reasoning;
    }
    
    // Helper methods
    
    generateMockWeather(location) {
        return {
            location,
            temperature: Math.floor(Math.random() * 40) + 32,
            conditions: ['sunny', 'cloudy', 'rainy', 'stormy'][Math.floor(Math.random() * 4)],
            humidity: Math.floor(Math.random() * 100),
            wind_speed: Math.floor(Math.random() * 30),
            timestamp: new Date()
        };
    }
    
    generateMockMarket(symbol) {
        return {
            symbol: symbol.toUpperCase(),
            price: Math.random() * 1000 + 10,
            change: (Math.random() - 0.5) * 20,
            trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
            volatility: Math.random(),
            timestamp: new Date()
        };
    }
    
    getFactionRelations(faction) {
        return this.factionRelations.get(faction) || {
            allies: [],
            enemies: [],
            reputation: 0.5
        };
    }
    
    getFactionRelationship(faction1, faction2) {
        const relations1 = this.factionRelations.get(faction1);
        if (!relations1) return 0.5;
        
        if (relations1.allies.includes(faction2)) return 0.8;
        if (relations1.enemies.includes(faction2)) return 0.2;
        return 0.5;
    }
    
    getResourceCost(resource, amount, faction) {
        const baseCosts = {
            compute: 10,
            storage: 5,
            bandwidth: 3,
            human: 100
        };
        
        const factionMultipliers = {
            tech: 0.8,
            corporate: 1.2,
            creative: 0.9,
            neutral: 1.0
        };
        
        const baseCost = baseCosts[resource] || 50;
        const multiplier = factionMultipliers[faction] || 1.0;
        
        return baseCost * amount * multiplier;
    }
    
    calculateTimeCost(timeline, context) {
        // Calculate cost of time based on urgency and resource availability
        const urgencyMultiplier = {
            low: 0.5,
            normal: 1.0,
            high: 2.0,
            critical: 5.0
        };
        
        const baseTimeCost = 1000; // Base cost per unit time
        const urgency = context.urgency || 'normal';
        
        return timeline * baseTimeCost * urgencyMultiplier[urgency];
    }
    
    calculateWeatherRisk(weather, request) {
        if (!request.weatherSensitive) return 0;
        
        const riskFactors = {
            stormy: 0.8,
            rainy: 0.5,
            cloudy: 0.2,
            sunny: 0.1
        };
        
        return riskFactors[weather.conditions] || 0.3;
    }
    
    calculateFactionRisk(faction, request) {
        const relations = this.factionRelations.get(faction);
        if (!relations) return 0.5;
        
        // Lower risk for factions with good reputation
        const reputationBonus = (relations.reputation - 0.5) * 0.3;
        
        // Higher risk if affecting enemy factions
        let enemyRisk = 0;
        if (request.affectedFactions) {
            for (const affectedFaction of request.affectedFactions) {
                if (relations.enemies.includes(affectedFaction)) {
                    enemyRisk += 0.2;
                }
            }
        }
        
        return Math.max(0, Math.min(1, 0.5 - reputationBonus + enemyRisk));
    }
    
    calculateResourceRisk(request, resources) {
        if (!request.requiredResources) return 0;
        
        let riskScore = 0;
        const resourceList = resources.resources || [];
        
        for (const [resourceType, amount] of Object.entries(request.requiredResources)) {
            const available = resourceList.filter(r => r.type === resourceType).length;
            if (available < amount) {
                riskScore += (amount - available) / amount * 0.3;
            }
        }
        
        return Math.min(riskScore, 1);
    }
    
    generateRiskMitigation(riskAnalysis) {
        const mitigation = [];
        
        for (const [category, risk] of Object.entries(riskAnalysis.categories)) {
            if (risk > 0.6) {
                switch (category) {
                    case 'technical':
                        mitigation.push('Conduct technical proof-of-concept');
                        mitigation.push('Assign senior technical lead');
                        break;
                    case 'market':
                        mitigation.push('Implement market hedging strategy');
                        mitigation.push('Monitor market indicators closely');
                        break;
                    case 'weather':
                        mitigation.push('Develop weather contingency plans');
                        break;
                    case 'faction':
                        mitigation.push('Engage in diplomatic negotiations');
                        mitigation.push('Build coalition support');
                        break;
                    case 'resource':
                        mitigation.push('Secure additional resource commitments');
                        mitigation.push('Develop resource sharing agreements');
                        break;
                }
            }
        }
        
        return mitigation;
    }
    
    calculateReputationBenefit(faction, request) {
        const relations = this.factionRelations.get(faction);
        if (!relations) return 0.3;
        
        // Higher reputation factions get more benefit from successful projects
        let benefit = relations.reputation * 0.5;
        
        // Bonus for projects that help allies
        if (request.affectedFactions) {
            for (const affectedFaction of request.affectedFactions) {
                if (relations.allies.includes(affectedFaction)) {
                    benefit += 0.2;
                }
            }
        }
        
        return Math.min(benefit, 1);
    }
    
    calculateSeasonalTiming(request, weather) {
        // Seasonal adjustments based on weather and request type
        const seasonalFactors = {
            outdoor_project: {
                sunny: 0.3,
                cloudy: 0.1,
                rainy: -0.2,
                stormy: -0.4
            },
            launch_event: {
                sunny: 0.2,
                cloudy: 0.0,
                rainy: -0.3,
                stormy: -0.5
            },
            default: {
                sunny: 0.1,
                cloudy: 0.0,
                rainy: 0.0,
                stormy: -0.1
            }
        };
        
        const requestType = request.seasonalType || 'default';
        const factors = seasonalFactors[requestType] || seasonalFactors.default;
        
        return factors[weather.conditions] || 0;
    }
    
    calculateResourceTiming(request, resources) {
        if (!request.requiredResources) return 0;
        
        const resourceList = resources.resources || [];
        let availability = 0;
        let required = 0;
        
        for (const [resourceType, amount] of Object.entries(request.requiredResources)) {
            const available = resourceList.filter(r => r.type === resourceType).length;
            availability += available;
            required += amount;
        }
        
        if (required === 0) return 0;
        
        const ratio = availability / required;
        if (ratio >= 1) return 0.2; // Good availability
        if (ratio >= 0.5) return 0.1; // Moderate availability
        return -0.2; // Poor availability
    }
    
    calculateCompetitiveTiming(request, context) {
        // Simplified competitive analysis
        const competitiveFactors = {
            first_mover: 0.3,
            fast_follower: 0.1,
            late_mover: -0.2
        };
        
        const position = request.competitivePosition || 'fast_follower';
        return competitiveFactors[position] || 0;
    }
    
    analyzeWeatherImpact(request, weather) {
        if (!request.weatherSensitive) {
            return { impact: 0, risk: 0 };
        }
        
        const impacts = {
            stormy: { impact: -0.6, risk: 0.8 },
            rainy: { impact: -0.3, risk: 0.5 },
            cloudy: { impact: -0.1, risk: 0.2 },
            sunny: { impact: 0.2, risk: 0.1 }
        };
        
        return impacts[weather.conditions] || { impact: 0, risk: 0.3 };
    }
    
    analyzeMarketImpact(request, market) {
        if (!request.marketSensitive) {
            return { impact: 0, favorability: 0.5 };
        }
        
        const trendImpact = market.trend === 'bullish' ? 0.3 : -0.2;
        const volatilityPenalty = market.volatility * -0.2;
        
        const impact = trendImpact + volatilityPenalty;
        const favorability = Math.max(0, Math.min(1, 0.5 + impact));
        
        return { impact, favorability, volatility: market.volatility };
    }
    
    adjustFactorsForAlternative(factors, alternative) {
        // Create a copy of factors and adjust for alternative
        const adjusted = JSON.parse(JSON.stringify(factors));
        
        // Adjust risk
        if (alternative.risk !== undefined) {
            adjusted.risk.overall = alternative.risk;
        }
        
        // Adjust benefit
        if (alternative.benefit !== undefined) {
            adjusted.benefit.expected = alternative.benefit;
        }
        
        return adjusted;
    }
    
    extractFeatures(decision) {
        return {
            type: decision.request.type,
            faction: decision.request.faction,
            cost: decision.factors.cost?.normalized || 0,
            risk: decision.factors.risk?.overall || 0,
            benefit: decision.factors.benefit?.expected || 0,
            timing: decision.factors.timing?.score || 0,
            urgency: decision.request.urgency || 'normal'
        };
    }
    
    createSignature(features) {
        const sigString = `${features.type}_${features.faction}_${Math.floor(features.cost * 10)}_${Math.floor(features.risk * 10)}_${features.urgency}`;
        return createHash('md5').update(sigString).digest('hex').substr(0, 8);
    }
    
    async updateRealTimeData() {
        // Update faction tensions (simulate)
        for (const faction of this.factionRelations.keys()) {
            const tension = Math.random();
            this.realTimeData.faction_tensions.set(faction, {
                level: tension,
                timestamp: new Date()
            });
        }
        
        // Update system performance
        this.realTimeData.system_performance.set('overall', {
            cpu: Math.random(),
            memory: Math.random(),
            network: Math.random(),
            timestamp: new Date()
        });
    }
    
    cleanOldData() {
        const cutoff = new Date(Date.now() - 3600000); // 1 hour ago
        
        // Clean weather data
        for (const [location, data] of this.realTimeData.weather) {
            if (data.timestamp < cutoff) {
                this.realTimeData.weather.delete(location);
            }
        }
        
        // Clean market data
        for (const [symbol, data] of this.realTimeData.market) {
            if (data.timestamp < cutoff) {
                this.realTimeData.market.delete(symbol);
            }
        }
    }
    
    async getSystemHealth() {
        try {
            const response = await fetch('http://localhost:8200/api/health');
            return await response.json();
        } catch (error) {
            return { status: 'unknown', error: error.message };
        }
    }
    
    handleExecutiveUpdate(data) {
        // Handle real-time updates from Executive OS
        if (data.type === 'resource_update') {
            this.realTimeData.resource_availability.set(data.resourceType, data);
        } else if (data.type === 'faction_event') {
            this.realTimeData.faction_tensions.set(data.faction, data);
        }
    }
    
    loadLearningPatterns() {
        // Would load from persistent storage
        console.log('📚 Loading learning patterns...');
    }
    
    saveLearningPatterns() {
        // Would save to persistent storage
        console.log('💾 Saving learning patterns...');
    }
    
    // Public API for outcome feedback
    
    async recordOutcome(decisionId, outcome) {
        const decision = this.decisionHistory.find(d => d.id === decisionId);
        if (!decision) {
            throw new Error('Decision not found');
        }
        
        // Record outcome
        decision.outcome = outcome;
        decision.outcome_timestamp = new Date();
        
        // Update learning patterns
        if (this.config.enableLearning && decision.pattern) {
            this.patternRecognition.updatePattern(decision.pattern, outcome);
        }
        
        this.emit('outcome:recorded', { decision, outcome });
        
        console.log(`📊 Recorded outcome for decision ${decisionId}: ${outcome.success ? 'SUCCESS' : 'FAILURE'}`);
    }
    
    getDecisionHistory(filters = {}) {
        let history = [...this.decisionHistory];
        
        if (filters.faction) {
            history = history.filter(d => d.request.faction === filters.faction);
        }
        
        if (filters.type) {
            history = history.filter(d => d.request.type === filters.type);
        }
        
        if (filters.outcome) {
            history = history.filter(d => d.recommendation?.action === filters.outcome);
        }
        
        return history;
    }
    
    getMetrics() {
        const total = this.decisionHistory.length;
        const approved = this.decisionHistory.filter(d => d.recommendation?.action === 'approve').length;
        const rejected = this.decisionHistory.filter(d => d.recommendation?.action === 'reject').length;
        const conditional = this.decisionHistory.filter(d => d.recommendation?.action === 'conditional').length;
        
        const avgConfidence = total > 0 ? 
            this.decisionHistory.reduce((sum, d) => sum + d.confidence, 0) / total : 0;
        
        const avgDuration = total > 0 ?
            this.decisionHistory.reduce((sum, d) => sum + (d.duration || 0), 0) / total : 0;
        
        return {
            total,
            approved,
            rejected,
            conditional,
            approvalRate: total > 0 ? approved / total : 0,
            avgConfidence,
            avgDuration,
            learningPatterns: this.learningPatterns.size
        };
    }
}

// Export for use
export default ExecutiveDecisionEngine;

// Start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const engine = new ExecutiveDecisionEngine();
    
    // Example decision
    setTimeout(async () => {
        console.log('\n🧪 Testing decision engine...');
        
        const testDecision = await engine.makeDecision({
            type: 'project_approval',
            description: 'Launch new AI assistant platform',
            faction: 'tech',
            urgency: 'high',
            estimatedCost: 50000,
            expectedRevenue: 200000,
            requiredResources: { compute: 10, human: 3 },
            weatherSensitive: false,
            marketSensitive: true,
            affectedFactions: ['creative', 'corporate']
        });
        
        console.log('✅ Test decision completed:', testDecision.recommendation);
    }, 3000);
}