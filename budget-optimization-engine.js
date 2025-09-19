#!/usr/bin/env node

/**
 * 💰 BUDGET OPTIMIZATION ENGINE
 * 
 * Sophisticated budget management system for OSRS trading
 * - Dynamic allocation across multiple trading strategies
 * - Portfolio optimization using modern portfolio theory
 * - Risk-adjusted returns calculation
 * - Cashflow management and liquidity monitoring
 * - Real-time rebalancing based on market conditions
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class BudgetOptimizationEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Portfolio configuration
        this.totalBudget = options.totalBudget || 0;
        this.reserveFund = options.reserveFund || 0.1; // 10% default reserve
        
        // Strategy allocations (percentages)
        this.strategyAllocations = {
            highVolume: options.highVolumeAllocation || 0.65,    // 65% default
            slowCollection: options.slowCollectionAllocation || 0.25, // 25% default
            reserve: this.reserveFund                             // 10% default
        };
        
        // Current positions and allocations
        this.positions = new Map(); // itemId -> position details
        this.activeOffers = new Map(); // offerId -> offer details
        this.strategyPerformance = new Map(); // strategy -> performance metrics
        
        // Risk management parameters
        this.riskParams = {
            maxPositionSize: options.maxPositionSize || 0.15, // 15% max per position
            stopLossThreshold: options.stopLossThreshold || -0.20, // 20% stop loss
            volatilityLimit: options.volatilityLimit || 0.30, // 30% max volatility
            liquidityRequirement: options.liquidityRequirement || 0.05 // 5% must stay liquid
        };
        
        // Performance tracking
        this.performanceHistory = [];
        this.portfolioMetrics = {
            totalValue: 0,
            unrealizedPL: 0,
            realizedPL: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            winRate: 0
        };
        
        // Market condition analysis
        this.marketConditions = {
            volatility: 'medium',
            trend: 'neutral',
            volume: 'normal',
            sentiment: 'neutral'
        };
        
        console.log('💰 BUDGET OPTIMIZATION ENGINE');
        console.log(`📊 Managing ${this.totalBudget.toLocaleString()} GP budget`);
        console.log(`⚖️ High Volume: ${(this.strategyAllocations.highVolume * 100)}%`);
        console.log(`🎯 Slow Collection: ${(this.strategyAllocations.slowCollection * 100)}%`);
        console.log(`🛡️ Reserve Fund: ${(this.strategyAllocations.reserve * 100)}%`);
    }
    
    /**
     * 🚀 Initialize Budget Engine
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Budget Optimization Engine...');
            
            // Load historical performance data
            await this.loadPerformanceHistory();
            
            // Initialize strategy performance tracking
            this.initializeStrategyTracking();
            
            // Start performance monitoring
            this.startPerformanceMonitoring();
            
            // Start rebalancing scheduler
            this.startRebalancingScheduler();
            
            console.log('✅ Budget Optimization Engine ready');
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Budget Optimization Engine:', error);
            throw error;
        }
    }
    
    /**
     * 📊 Calculate Optimal Budget Allocation
     */
    calculateOptimalAllocation(marketData, opportunities) {
        console.log('📊 Calculating optimal budget allocation...');
        
        // Analyze current market conditions
        this.analyzeMarketConditions(marketData);
        
        // Calculate expected returns for each strategy
        const expectedReturns = this.calculateExpectedReturns(opportunities);
        
        // Calculate risk metrics for each strategy
        const riskMetrics = this.calculateRiskMetrics(opportunities);
        
        // Optimize allocation using modern portfolio theory
        const optimalAllocation = this.optimizePortfolio(expectedReturns, riskMetrics);
        
        // Adjust for current market conditions
        const adjustedAllocation = this.adjustForMarketConditions(optimalAllocation);
        
        // Ensure risk limits are respected
        const finalAllocation = this.enforceRiskLimits(adjustedAllocation);
        
        console.log('✅ Optimal allocation calculated:', finalAllocation);
        return finalAllocation;
    }
    
    /**
     * 🎯 Allocate Budget to Strategies
     */
    async allocateBudget(allocation, opportunities) {
        const budgetPlan = {
            timestamp: new Date(),
            totalBudget: this.totalBudget,
            allocations: {},
            expectedReturns: {},
            riskMetrics: {}
        };
        
        // High Volume Strategy Allocation
        const highVolumeAmount = this.totalBudget * allocation.highVolume;
        budgetPlan.allocations.highVolume = {
            amount: highVolumeAmount,
            percentage: allocation.highVolume,
            positions: await this.allocateHighVolumeStrategy(highVolumeAmount, opportunities.highVolume)
        };
        
        // Slow Collection Strategy Allocation
        const slowCollectionAmount = this.totalBudget * allocation.slowCollection;
        budgetPlan.allocations.slowCollection = {
            amount: slowCollectionAmount,
            percentage: allocation.slowCollection,
            positions: await this.allocateSlowCollectionStrategy(slowCollectionAmount, opportunities.slowCollection)
        };
        
        // Reserve Fund
        const reserveAmount = this.totalBudget * allocation.reserve;
        budgetPlan.allocations.reserve = {
            amount: reserveAmount,
            percentage: allocation.reserve,
            purpose: 'Emergency opportunities and liquidity buffer'
        };
        
        // Store the allocation plan
        await this.saveBudgetPlan(budgetPlan);
        
        // Emit allocation event
        this.emit('budget_allocated', budgetPlan);
        
        return budgetPlan;
    }
    
    /**
     * ⚡ Allocate High Volume Strategy
     */
    async allocateHighVolumeStrategy(budget, opportunities) {
        const positions = [];
        let allocatedAmount = 0;
        
        // Sort opportunities by volume and margin
        const sortedOpportunities = opportunities
            .filter(opp => opp.volume > 1000 && opp.margin > 0.05) // Min 1k volume, 5% margin
            .sort((a, b) => {
                const scoreA = a.volume * a.margin * a.confidence;
                const scoreB = b.volume * b.margin * b.confidence;
                return scoreB - scoreA;
            });
        
        for (const opportunity of sortedOpportunities) {
            if (allocatedAmount >= budget * 0.95) break; // Use 95% of allocated budget
            
            // Calculate position size based on risk and opportunity
            const positionSize = this.calculateHighVolumePositionSize(
                opportunity, 
                budget - allocatedAmount,
                this.riskParams
            );
            
            if (positionSize > 0) {
                const position = {
                    itemId: opportunity.itemId,
                    itemName: opportunity.itemName,
                    strategy: 'highVolume',
                    positionSize: positionSize,
                    targetPrice: opportunity.buyPrice,
                    sellPrice: opportunity.sellPrice,
                    expectedMargin: opportunity.margin,
                    expectedVolume: opportunity.volume,
                    maxHoldTime: 3600000, // 1 hour max
                    confidence: opportunity.confidence,
                    createdAt: new Date()
                };
                
                positions.push(position);
                allocatedAmount += positionSize;
            }
        }
        
        console.log(`⚡ High Volume Strategy: ${positions.length} positions, ${allocatedAmount.toLocaleString()} GP allocated`);
        return positions;
    }
    
    /**
     * 🎯 Allocate Slow Collection Strategy
     */
    async allocateSlowCollectionStrategy(budget, opportunities) {
        const positions = [];
        let allocatedAmount = 0;
        
        // Sort opportunities by potential margin and rarity
        const sortedOpportunities = opportunities
            .filter(opp => opp.margin > 0.15 && opp.rarity > 0.3) // Min 15% margin, moderate rarity
            .sort((a, b) => {
                const scoreA = a.margin * a.rarity * a.dumperLikelihood;
                const scoreB = b.margin * b.rarity * b.dumperLikelihood;
                return scoreB - scoreA;
            });
        
        for (const opportunity of sortedOpportunities) {
            if (allocatedAmount >= budget * 0.90) break; // Use 90% of allocated budget
            
            // Calculate position size for slow collection
            const positionSize = this.calculateSlowCollectionPositionSize(
                opportunity,
                budget - allocatedAmount,
                this.riskParams
            );
            
            if (positionSize > 0) {
                const position = {
                    itemId: opportunity.itemId,
                    itemName: opportunity.itemName,
                    strategy: 'slowCollection',
                    positionSize: positionSize,
                    lowBallPrice: opportunity.lowBallPrice,
                    marketPrice: opportunity.marketPrice,
                    expectedMargin: opportunity.margin,
                    dumperLikelihood: opportunity.dumperLikelihood,
                    maxHoldTime: 7 * 24 * 3600000, // 7 days max
                    patience: opportunity.patience || 0.8,
                    confidence: opportunity.confidence,
                    createdAt: new Date()
                };
                
                positions.push(position);
                allocatedAmount += positionSize;
            }
        }
        
        console.log(`🎯 Slow Collection Strategy: ${positions.length} positions, ${allocatedAmount.toLocaleString()} GP allocated`);
        return positions;
    }
    
    /**
     * ⚖️ Calculate High Volume Position Size
     */
    calculateHighVolumePositionSize(opportunity, availableBudget, riskParams) {
        // Base position size on volume and confidence
        const baseSize = Math.min(
            opportunity.volume * opportunity.buyPrice * 0.1, // 10% of daily volume
            availableBudget * 0.2, // Max 20% of available budget
            this.totalBudget * riskParams.maxPositionSize // Max position size limit
        );
        
        // Adjust for confidence and volatility
        const confidenceAdjustment = opportunity.confidence;
        const volatilityAdjustment = Math.max(0.5, 1 - opportunity.volatility);
        
        const adjustedSize = baseSize * confidenceAdjustment * volatilityAdjustment;
        
        // Ensure minimum viable position
        const minPosition = opportunity.buyPrice * 10; // At least 10 items
        
        return Math.max(minPosition, Math.floor(adjustedSize));
    }
    
    /**
     * 🎯 Calculate Slow Collection Position Size
     */
    calculateSlowCollectionPositionSize(opportunity, availableBudget, riskParams) {
        // Larger positions for slow collection due to higher margins
        const baseSize = Math.min(
            availableBudget * 0.3, // Up to 30% of available budget
            this.totalBudget * riskParams.maxPositionSize * 1.5 // Higher position size limit
        );
        
        // Adjust for dumper likelihood and item rarity
        const dumperAdjustment = opportunity.dumperLikelihood;
        const rarityAdjustment = opportunity.rarity;
        
        const adjustedSize = baseSize * dumperAdjustment * rarityAdjustment;
        
        // Ensure minimum viable position
        const minPosition = opportunity.lowBallPrice * 5; // At least 5 items
        
        return Math.max(minPosition, Math.floor(adjustedSize));
    }
    
    /**
     * 📈 Analyze Market Conditions
     */
    analyzeMarketConditions(marketData) {
        // Calculate market volatility
        const priceChanges = marketData.map(item => Math.abs(item.priceChange || 0));
        const avgVolatility = priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length;
        
        // Determine volatility level
        if (avgVolatility > 0.15) {
            this.marketConditions.volatility = 'high';
        } else if (avgVolatility > 0.05) {
            this.marketConditions.volatility = 'medium';
        } else {
            this.marketConditions.volatility = 'low';
        }
        
        // Calculate market trend
        const positiveChanges = marketData.filter(item => (item.priceChange || 0) > 0).length;
        const trendRatio = positiveChanges / marketData.length;
        
        if (trendRatio > 0.6) {
            this.marketConditions.trend = 'bullish';
        } else if (trendRatio < 0.4) {
            this.marketConditions.trend = 'bearish';
        } else {
            this.marketConditions.trend = 'neutral';
        }
        
        // Calculate volume conditions
        const totalVolume = marketData.reduce((sum, item) => sum + (item.volume || 0), 0);
        const avgVolume = totalVolume / marketData.length;
        
        if (avgVolume > 5000) {
            this.marketConditions.volume = 'high';
        } else if (avgVolume > 1000) {
            this.marketConditions.volume = 'normal';
        } else {
            this.marketConditions.volume = 'low';
        }
        
        console.log('📊 Market Conditions:', this.marketConditions);
    }
    
    /**
     * 💹 Calculate Expected Returns
     */
    calculateExpectedReturns(opportunities) {
        const returns = {
            highVolume: 0,
            slowCollection: 0
        };
        
        // High Volume Strategy Expected Return
        if (opportunities.highVolume && opportunities.highVolume.length > 0) {
            const highVolumeReturns = opportunities.highVolume.map(opp => 
                opp.margin * opp.confidence * (opp.volume / 10000) // Volume factor
            );
            returns.highVolume = highVolumeReturns.reduce((a, b) => a + b, 0) / highVolumeReturns.length;
        }
        
        // Slow Collection Strategy Expected Return
        if (opportunities.slowCollection && opportunities.slowCollection.length > 0) {
            const slowReturns = opportunities.slowCollection.map(opp => 
                opp.margin * opp.confidence * opp.dumperLikelihood
            );
            returns.slowCollection = slowReturns.reduce((a, b) => a + b, 0) / slowReturns.length;
        }
        
        console.log('💹 Expected Returns:', returns);
        return returns;
    }
    
    /**
     * ⚠️ Calculate Risk Metrics
     */
    calculateRiskMetrics(opportunities) {
        const risks = {
            highVolume: { volatility: 0, liquidityRisk: 0, concentrationRisk: 0 },
            slowCollection: { volatility: 0, liquidityRisk: 0, concentrationRisk: 0 }
        };
        
        // High Volume Risk Metrics
        if (opportunities.highVolume && opportunities.highVolume.length > 0) {
            const hvOpps = opportunities.highVolume;
            risks.highVolume = {
                volatility: hvOpps.reduce((sum, opp) => sum + (opp.volatility || 0.1), 0) / hvOpps.length,
                liquidityRisk: 0.05, // Low liquidity risk due to high volume
                concentrationRisk: Math.min(0.3, 1 / hvOpps.length) // Decreases with more opportunities
            };
        }
        
        // Slow Collection Risk Metrics
        if (opportunities.slowCollection && opportunities.slowCollection.length > 0) {
            const scOpps = opportunities.slowCollection;
            risks.slowCollection = {
                volatility: scOpps.reduce((sum, opp) => sum + (opp.volatility || 0.2), 0) / scOpps.length,
                liquidityRisk: 0.3, // Higher liquidity risk due to slow turnover
                concentrationRisk: Math.min(0.5, 1 / scOpps.length)
            };
        }
        
        console.log('⚠️ Risk Metrics:', risks);
        return risks;
    }
    
    /**
     * 🧮 Optimize Portfolio Using Modern Portfolio Theory
     */
    optimizePortfolio(expectedReturns, riskMetrics) {
        // Simplified MPT optimization
        const strategies = ['highVolume', 'slowCollection'];
        let optimalAllocation = { ...this.strategyAllocations };
        
        // Risk-adjusted return calculation
        const riskAdjustedReturns = {};
        for (const strategy of strategies) {
            const totalRisk = riskMetrics[strategy].volatility + 
                             riskMetrics[strategy].liquidityRisk + 
                             riskMetrics[strategy].concentrationRisk;
            
            riskAdjustedReturns[strategy] = expectedReturns[strategy] / Math.max(totalRisk, 0.01);
        }
        
        // Calculate optimal weights based on risk-adjusted returns
        const totalRiskAdjustedReturn = Object.values(riskAdjustedReturns).reduce((a, b) => a + b, 0);
        
        if (totalRiskAdjustedReturn > 0) {
            optimalAllocation.highVolume = Math.min(0.8, Math.max(0.4, 
                riskAdjustedReturns.highVolume / totalRiskAdjustedReturn * 0.9
            ));
            
            optimalAllocation.slowCollection = Math.min(0.4, Math.max(0.1,
                0.9 - optimalAllocation.highVolume
            ));
            
            optimalAllocation.reserve = 0.1; // Always maintain 10% reserve
        }
        
        console.log('🧮 Optimized Portfolio Allocation:', optimalAllocation);
        return optimalAllocation;
    }
    
    /**
     * 🌡️ Adjust for Market Conditions
     */
    adjustForMarketConditions(allocation) {
        const adjusted = { ...allocation };
        
        // High volatility: Increase reserve, reduce slow collection
        if (this.marketConditions.volatility === 'high') {
            adjusted.reserve = Math.min(0.2, adjusted.reserve * 1.5);
            adjusted.slowCollection = Math.max(0.15, adjusted.slowCollection * 0.8);
            adjusted.highVolume = 1 - adjusted.reserve - adjusted.slowCollection;
        }
        
        // Low volume market: Increase slow collection
        if (this.marketConditions.volume === 'low') {
            adjusted.slowCollection = Math.min(0.35, adjusted.slowCollection * 1.2);
            adjusted.highVolume = Math.max(0.5, 1 - adjusted.reserve - adjusted.slowCollection);
        }
        
        // Bearish trend: Increase reserve and reduce positions
        if (this.marketConditions.trend === 'bearish') {
            adjusted.reserve = Math.min(0.25, adjusted.reserve * 1.3);
            const remaining = 1 - adjusted.reserve;
            adjusted.highVolume = remaining * 0.7;
            adjusted.slowCollection = remaining * 0.3;
        }
        
        console.log('🌡️ Market-Adjusted Allocation:', adjusted);
        return adjusted;
    }
    
    /**
     * 🛡️ Enforce Risk Limits
     */
    enforceRiskLimits(allocation) {
        const limited = { ...allocation };
        
        // Ensure minimum reserve fund
        limited.reserve = Math.max(this.riskParams.liquidityRequirement, limited.reserve);
        
        // Ensure no strategy exceeds maximum allocation
        limited.highVolume = Math.min(0.75, limited.highVolume);
        limited.slowCollection = Math.min(0.4, limited.slowCollection);
        
        // Normalize to ensure total equals 100%
        const total = limited.highVolume + limited.slowCollection + limited.reserve;
        if (total !== 1.0) {
            const factor = 1.0 / total;
            limited.highVolume *= factor;
            limited.slowCollection *= factor;
            limited.reserve *= factor;
        }
        
        console.log('🛡️ Risk-Limited Allocation:', limited);
        return limited;
    }
    
    /**
     * 💾 Save Budget Plan
     */
    async saveBudgetPlan(budgetPlan) {
        try {
            const planPath = path.join(__dirname, 'data', 'budget-plans', 
                `budget-plan-${Date.now()}.json`);
            
            await fs.mkdir(path.dirname(planPath), { recursive: true });
            await fs.writeFile(planPath, JSON.stringify(budgetPlan, null, 2));
            
            console.log(`💾 Budget plan saved: ${planPath}`);
        } catch (error) {
            console.error('Failed to save budget plan:', error);
        }
    }
    
    /**
     * 📊 Initialize Strategy Tracking
     */
    initializeStrategyTracking() {
        const strategies = ['highVolume', 'slowCollection', 'reserve'];
        
        strategies.forEach(strategy => {
            this.strategyPerformance.set(strategy, {
                totalInvested: 0,
                totalReturns: 0,
                totalTrades: 0,
                successfulTrades: 0,
                avgHoldTime: 0,
                bestTrade: 0,
                worstTrade: 0,
                sharpeRatio: 0,
                maxDrawdown: 0,
                currentPositions: 0
            });
        });
    }
    
    /**
     * 🔄 Start Performance Monitoring
     */
    startPerformanceMonitoring() {
        setInterval(async () => {
            await this.updatePerformanceMetrics();
            await this.checkRebalancingNeeds();
        }, 60000); // Every minute
    }
    
    /**
     * ⏰ Start Rebalancing Scheduler
     */
    startRebalancingScheduler() {
        // Major rebalancing every 4 hours
        setInterval(async () => {
            console.log('⏰ Scheduled portfolio rebalancing...');
            await this.rebalancePortfolio();
        }, 4 * 3600000); // 4 hours
        
        // Minor adjustments every hour
        setInterval(async () => {
            await this.checkMinorAdjustments();
        }, 3600000); // 1 hour
    }
    
    /**
     * ⚖️ Rebalance Portfolio
     */
    async rebalancePortfolio() {
        try {
            console.log('⚖️ Starting portfolio rebalancing...');
            
            // Get current positions and market data
            const currentPositions = await this.getCurrentPositions();
            const marketData = await this.getLatestMarketData();
            
            // Calculate current allocation
            const currentAllocation = this.calculateCurrentAllocation(currentPositions);
            
            // Calculate optimal allocation
            const optimalAllocation = this.calculateOptimalAllocation(marketData, {
                highVolume: [], // Would be populated with real opportunities
                slowCollection: []
            });
            
            // Generate rebalancing actions
            const rebalancingActions = this.generateRebalancingActions(
                currentAllocation, 
                optimalAllocation,
                currentPositions
            );
            
            // Execute rebalancing if needed
            if (rebalancingActions.length > 0) {
                console.log(`📋 Executing ${rebalancingActions.length} rebalancing actions`);
                await this.executeRebalancingActions(rebalancingActions);
                
                this.emit('portfolio_rebalanced', {
                    from: currentAllocation,
                    to: optimalAllocation,
                    actions: rebalancingActions
                });
            } else {
                console.log('✅ Portfolio is optimally balanced');
            }
            
        } catch (error) {
            console.error('❌ Portfolio rebalancing failed:', error);
        }
    }
    
    /**
     * 📊 Get Budget Optimization Stats
     */
    getStats() {
        return {
            totalBudget: this.totalBudget,
            strategyAllocations: this.strategyAllocations,
            marketConditions: this.marketConditions,
            portfolioMetrics: this.portfolioMetrics,
            activePositions: this.positions.size,
            activeOffers: this.activeOffers.size,
            strategyPerformance: Object.fromEntries(this.strategyPerformance)
        };
    }
    
    /**
     * 💾 Load Performance History
     */
    async loadPerformanceHistory() {
        try {
            const historyPath = path.join(__dirname, 'data', 'performance-history.json');
            const data = await fs.readFile(historyPath, 'utf8');
            this.performanceHistory = JSON.parse(data);
            console.log(`📊 Loaded ${this.performanceHistory.length} performance records`);
        } catch (error) {
            console.log('📊 No existing performance history found, starting fresh');
            this.performanceHistory = [];
        }
    }
    
    /**
     * 📈 Update Performance Metrics (Placeholder)
     */
    async updatePerformanceMetrics() {
        // This would be implemented to track actual performance
        // For now, it's a placeholder that would integrate with real trading data
    }
    
    /**
     * 🔍 Check Rebalancing Needs (Placeholder) 
     */
    async checkRebalancingNeeds() {
        // This would check if current allocation deviates significantly from target
    }
    
    /**
     * 📊 Calculate Current Allocation (Placeholder)
     */
    calculateCurrentAllocation(positions) {
        // This would calculate current allocation based on actual positions
        return this.strategyAllocations;
    }
    
    /**
     * 📊 Get Current Positions (Placeholder)
     */
    async getCurrentPositions() {
        // This would return current trading positions
        return [];
    }
    
    /**
     * 📊 Get Latest Market Data (Placeholder)
     */
    async getLatestMarketData() {
        // This would get real-time market data
        return [];
    }
}

module.exports = BudgetOptimizationEngine;