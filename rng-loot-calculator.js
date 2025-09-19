#!/usr/bin/env node

/**
 * 🎲 RNG LOOT CALCULATOR
 * 
 * Converts real market savings into game loot using sophisticated RNG formulas
 * $10 saved = Rare drop, $100 saved = Legendary drop, etc.
 * Market volatility affects critical hit chances and bonus loot
 */

const crypto = require('crypto');

class RNGLootCalculator {
    constructor(config = {}) {
        this.config = {
            baseLootMultiplier: config.baseLootMultiplier || 1.0,
            criticalHitChance: config.criticalHitChance || 0.15,
            volatilityMultiplier: config.volatilityMultiplier || 2.0,
            timeBonusDecay: config.timeBonusDecay || 0.1,
            ...config
        };
        
        // Loot rarity thresholds based on dollar savings
        this.rarityThresholds = {
            'common': { min: 0.01, max: 2.99, multiplier: 1.0 },
            'uncommon': { min: 3.00, max: 9.99, multiplier: 1.5 },
            'rare': { min: 10.00, max: 49.99, multiplier: 2.5 },
            'epic': { min: 50.00, max: 199.99, multiplier: 4.0 },
            'legendary': { min: 200.00, max: 999.99, multiplier: 7.5 },
            'mythic': { min: 1000.00, max: Infinity, multiplier: 15.0 }
        };
        
        // Loot templates for different market types
        this.lootTemplates = {
            'food_delivery': {
                common: [
                    { name: 'Small Delivery Discount', value: 2, description: '5% off next order' },
                    { name: 'Free Beverage Upgrade', value: 1.5, description: 'Upgrade any drink for free' },
                    { name: 'Restaurant Review Boost', value: 1, description: '+1 influence with local restaurants' }
                ],
                uncommon: [
                    { name: 'Priority Delivery Pass', value: 5, description: 'Skip delivery queue for 24 hours' },
                    { name: 'Combo Meal Voucher', value: 8, description: '$8 off combo meals' },
                    { name: 'Ghost Kitchen Access', value: 6, description: 'Access to exclusive delivery-only restaurants' }
                ],
                rare: [
                    { name: 'Platform Partnership Token', value: 25, description: 'Negotiate better rates directly' },
                    { name: 'Bulk Order Multiplier', value: 30, description: '2x rewards on group orders' },
                    { name: 'Restaurant Insider Info', value: 20, description: 'Preview new menu items and discounts' }
                ],
                epic: [
                    { name: 'VIP Delivery Status', value: 100, description: 'Premium delivery perks for 6 months' },
                    { name: 'Ghost Kitchen Franchise Rights', value: 150, description: 'Start your own delivery kitchen' },
                    { name: 'Multi-Platform Arbitrage Tool', value: 120, description: 'Auto-detect price differences' }
                ],
                legendary: [
                    { name: 'Delivery Empire License', value: 500, description: 'Create your own delivery platform' },
                    { name: 'Restaurant Chain Partnership', value: 750, description: 'Exclusive deals with major chains' },
                    { name: 'Market Manipulation Authority', value: 1000, description: 'Influence delivery pricing' }
                ],
                mythic: [
                    { name: 'Global Delivery Monopoly', value: 5000, description: 'Control world food delivery' },
                    { name: 'Time Machine Recipe Book', value: 10000, description: 'Predict future food trends' }
                ]
            },
            
            'shipping': {
                common: [
                    { name: 'Small Package Discount', value: 3, description: '10% off packages under 5 lbs' },
                    { name: 'Express Shipping Voucher', value: 5, description: 'One free express upgrade' },
                    { name: 'Tracking Premium', value: 2, description: 'Real-time GPS tracking' }
                ],
                uncommon: [
                    { name: 'Container Space Token', value: 15, description: 'Guaranteed space on next ship' },
                    { name: 'Port Priority Pass', value: 12, description: 'Skip customs queues' },
                    { name: 'Weather Insurance', value: 8, description: 'Protection against delays' }
                ],
                rare: [
                    { name: 'Direct Shipping Route', value: 50, description: 'Bypass intermediate ports' },
                    { name: 'Bulk Container Rates', value: 75, description: 'Access to wholesale pricing' },
                    { name: 'Port Authority Connections', value: 60, description: 'Insider shipping knowledge' }
                ],
                epic: [
                    { name: 'Freight Network Control', value: 200, description: 'Influence regional shipping' },
                    { name: 'Customs Fast-Track Authority', value: 180, description: 'Bypass international inspections' },
                    { name: 'Maritime Weather Prediction', value: 150, description: 'Predict shipping delays' }
                ],
                legendary: [
                    { name: 'Global Shipping Monopoly', value: 800, description: 'Control international freight' },
                    { name: 'Suez Canal VIP Pass', value: 1200, description: 'Priority canal access' },
                    { name: 'Quantum Teleportation Shipping', value: 1500, description: 'Instant global delivery' }
                ],
                mythic: [
                    { name: 'Reality Shipping Network', value: 8000, description: 'Ship across dimensions' },
                    { name: 'Time Dilation Container', value: 12000, description: 'Slow time during shipping' }
                ]
            },
            
            'technology': {
                common: [
                    { name: 'API Credits Bonus', value: 1, description: '+1000 free API calls' },
                    { name: 'Latency Reducer', value: 2, description: '50ms faster response times' },
                    { name: 'Error Rate Immunity', value: 1.5, description: '99.9% uptime guarantee' }
                ],
                uncommon: [
                    { name: 'Premium Endpoints', value: 8, description: 'Access to beta features' },
                    { name: 'Rate Limit Bypass', value: 10, description: '2x normal request limits' },
                    { name: 'Caching Optimization', value: 6, description: '10x faster cached responses' }
                ],
                rare: [
                    { name: 'Custom API Access', value: 40, description: 'White-label API solutions' },
                    { name: 'Enterprise Features Unlock', value: 35, description: 'Access to all premium features' },
                    { name: 'Direct Server Connection', value: 30, description: 'Bypass CDN for speed' }
                ],
                epic: [
                    { name: 'API Partnership Deal', value: 120, description: 'Revenue sharing agreement' },
                    { name: 'Platform Infrastructure', value: 100, description: 'Your own API platform' },
                    { name: 'AI Model Training Rights', value: 150, description: 'Train custom AI models' }
                ],
                legendary: [
                    { name: 'Global API Monopoly', value: 600, description: 'Control all API access' },
                    { name: 'Quantum Computing Access', value: 800, description: 'Use quantum processors' },
                    { name: 'AGI Development License', value: 1000, description: 'Build artificial general intelligence' }
                ],
                mythic: [
                    { name: 'Reality Programming Interface', value: 7500, description: 'Modify reality through code' },
                    { name: 'Universal API Key', value: 15000, description: 'Access to all systems everywhere' }
                ]
            },
            
            'energy': {
                common: [
                    { name: 'Energy Credits', value: 2, description: '$2 off electricity bill' },
                    { name: 'Off-Peak Rate Access', value: 3, description: 'Use cheaper nighttime rates' },
                    { name: 'Smart Meter Upgrade', value: 1, description: 'Real-time usage monitoring' }
                ],
                uncommon: [
                    { name: 'Green Energy Certificate', value: 8, description: '100% renewable energy for a month' },
                    { name: 'Peak Hour Exemption', value: 12, description: 'Avoid surge pricing' },
                    { name: 'Grid Storage Access', value: 10, description: 'Store energy during low prices' }
                ],
                rare: [
                    { name: 'Solar Panel Installation', value: 45, description: 'Free residential solar setup' },
                    { name: 'Energy Trading License', value: 35, description: 'Buy/sell energy on market' },
                    { name: 'Grid Priority Access', value: 40, description: 'Never lose power during outages' }
                ],
                epic: [
                    { name: 'Power Plant Ownership', value: 180, description: 'Own a small power generation facility' },
                    { name: 'Grid Control Authority', value: 200, description: 'Influence regional power distribution' },
                    { name: 'Fusion Reactor Access', value: 150, description: 'Use experimental fusion power' }
                ],
                legendary: [
                    { name: 'National Grid Control', value: 900, description: 'Control country-wide power grid' },
                    { name: 'Dyson Sphere Construction', value: 1500, description: 'Harness star energy' },
                    { name: 'Zero-Point Energy Tap', value: 2000, description: 'Unlimited free energy' }
                ],
                mythic: [
                    { name: 'Universal Energy Monopoly', value: 10000, description: 'Control all energy in universe' },
                    { name: 'Big Bang Recreator', value: 20000, description: 'Create new universes for energy' }
                ]
            },
            
            'real_estate': {
                common: [
                    { name: 'Property Listing Preview', value: 2, description: 'See listings 24 hours early' },
                    { name: 'Inspection Report', value: 3, description: 'Free property inspection' },
                    { name: 'Market Analysis Access', value: 1.5, description: 'Professional market reports' }
                ],
                uncommon: [
                    { name: 'Agent Network Access', value: 10, description: 'Top real estate agent connections' },
                    { name: 'Pre-Market Opportunities', value: 12, description: 'Buy before public listing' },
                    { name: 'Zoning Information', value: 8, description: 'Future development plans' }
                ],
                rare: [
                    { name: 'Investment Property Rights', value: 50, description: 'First dibs on investment properties' },
                    { name: 'Development Permits', value: 40, description: 'Fast-track construction approvals' },
                    { name: 'Land Use Manipulation', value: 45, description: 'Influence zoning decisions' }
                ],
                epic: [
                    { name: 'Real Estate Empire', value: 200, description: 'Own multiple commercial properties' },
                    { name: 'City Planning Authority', value: 180, description: 'Influence urban development' },
                    { name: 'REIT Control', value: 150, description: 'Control real estate investment trusts' }
                ],
                legendary: [
                    { name: 'Manhattan Monopoly', value: 1200, description: 'Own significant Manhattan real estate' },
                    { name: 'Global Property Network', value: 1000, description: 'Real estate in every major city' },
                    { name: 'Terraforming Rights', value: 1500, description: 'Create new land for development' }
                ],
                mythic: [
                    { name: 'Dimensional Real Estate', value: 12000, description: 'Own property across dimensions' },
                    { name: 'Planet Development License', value: 25000, description: 'Develop entire planets' }
                ]
            }
        };
        
        // Critical hit effects
        this.criticalEffects = [
            { name: 'Double Loot', effect: 'multiply_quantity', value: 2 },
            { name: 'Rarity Upgrade', effect: 'upgrade_rarity', value: 1 },
            { name: 'Bonus Savings', effect: 'multiply_value', value: 1.5 },
            { name: 'Extra Drop', effect: 'additional_drop', value: 1 },
            { name: 'Perfect Quality', effect: 'quality_bonus', value: 0.25 }
        ];
        
        console.log('🎲 RNG Loot Calculator initialized');
    }
    
    // Main loot calculation function
    calculateLoot(marketData) {
        const {
            savings,
            marketType,
            volatility = 0.1,
            timeBonus = 0,
            playerLevel = 1,
            playerLuck = 0,
            bossMultiplier = 1.0
        } = marketData;
        
        console.log(`🎲 Calculating loot for $${savings} ${marketType} savings...`);
        
        // Determine base rarity from savings amount
        const baseRarity = this.determineRarity(savings);
        
        // Calculate critical hit chance
        const critChance = this.calculateCriticalChance(volatility, playerLevel, playerLuck);
        const isCritical = Math.random() < critChance;
        
        // Generate base loot
        let loot = this.generateBaseLoot(marketType, baseRarity, savings);
        
        // Apply critical hit effects
        if (isCritical) {
            loot = this.applyCriticalEffects(loot, marketType);
            console.log(`🔥 CRITICAL HIT! Applied special effects to loot`);
        }
        
        // Apply time-sensitive bonuses
        if (timeBonus > 0) {
            loot = this.applyTimeBonus(loot, timeBonus);
        }
        
        // Apply boss multipliers
        if (bossMultiplier > 1.0) {
            loot = this.applyBossMultiplier(loot, bossMultiplier);
        }
        
        // Apply player level scaling
        loot = this.applyPlayerScaling(loot, playerLevel);
        
        // Calculate final statistics
        const lootStats = this.calculateLootStatistics(loot, savings, isCritical);
        
        console.log(`✨ Generated ${loot.items.length} items (${loot.rarity}) worth $${loot.totalValue}`);
        
        return {
            ...loot,
            stats: lootStats,
            critical: isCritical,
            originalSavings: savings,
            marketType: marketType
        };
    }
    
    determineRarity(savings) {
        for (const [rarity, threshold] of Object.entries(this.rarityThresholds)) {
            if (savings >= threshold.min && savings <= threshold.max) {
                return rarity;
            }
        }
        return 'common';
    }
    
    calculateCriticalChance(volatility, playerLevel, playerLuck) {
        let critChance = this.config.criticalHitChance;
        
        // Market volatility increases crit chance
        critChance += volatility * this.config.volatilityMultiplier * 0.1;
        
        // Player level increases crit chance
        critChance += (playerLevel - 1) * 0.01;
        
        // Player luck stat
        critChance += playerLuck * 0.05;
        
        // Cap at 50% max crit chance
        return Math.min(0.5, critChance);
    }
    
    generateBaseLoot(marketType, rarity, savings) {
        const templates = this.lootTemplates[marketType] || this.lootTemplates['food_delivery'];
        const rarityTemplate = templates[rarity] || templates['common'];
        
        // Select random items from the rarity tier
        const numItems = this.calculateNumItems(rarity, savings);
        const selectedItems = [];
        
        for (let i = 0; i < numItems; i++) {
            const item = rarityTemplate[Math.floor(Math.random() * rarityTemplate.length)];
            const scaledItem = this.scaleItemValue(item, savings, rarity);
            selectedItems.push(scaledItem);
        }
        
        return {
            items: selectedItems,
            rarity: rarity,
            totalValue: selectedItems.reduce((sum, item) => sum + item.scaledValue, 0),
            baseValue: savings,
            marketType: marketType
        };
    }
    
    calculateNumItems(rarity, savings) {
        const baseItems = {
            'common': 1,
            'uncommon': 1,
            'rare': 2,
            'epic': 2,
            'legendary': 3,
            'mythic': 4
        };
        
        let numItems = baseItems[rarity] || 1;
        
        // Bonus items for very high savings
        if (savings > 500) numItems += 1;
        if (savings > 1000) numItems += 1;
        if (savings > 5000) numItems += 2;
        
        return numItems;
    }
    
    scaleItemValue(item, savings, rarity) {
        const rarityMultiplier = this.rarityThresholds[rarity]?.multiplier || 1.0;
        const savingsScale = Math.max(1, savings / 100);
        
        return {
            ...item,
            scaledValue: item.value * rarityMultiplier * savingsScale,
            originalValue: item.value,
            rarity: rarity,
            id: crypto.randomUUID()
        };
    }
    
    applyCriticalEffects(loot, marketType) {
        const effect = this.criticalEffects[Math.floor(Math.random() * this.criticalEffects.length)];
        
        switch (effect.effect) {
            case 'multiply_quantity':
                // Double the number of items
                const additionalItems = [...loot.items];
                loot.items.push(...additionalItems);
                loot.totalValue *= 2;
                break;
                
            case 'upgrade_rarity':
                // Upgrade to next rarity tier
                const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
                const currentIndex = rarities.indexOf(loot.rarity);
                if (currentIndex < rarities.length - 1) {
                    const newRarity = rarities[currentIndex + 1];
                    loot = this.generateBaseLoot(marketType, newRarity, loot.baseValue);
                }
                break;
                
            case 'multiply_value':
                // Increase value of all items
                loot.items.forEach(item => {
                    item.scaledValue *= effect.value;
                });
                loot.totalValue *= effect.value;
                break;
                
            case 'additional_drop':
                // Add one more random item from higher tier
                const higherTier = this.getHigherRarityTier(loot.rarity);
                if (higherTier) {
                    const templates = this.lootTemplates[marketType] || this.lootTemplates['food_delivery'];
                    const higherTierTemplate = templates[higherTier];
                    if (higherTierTemplate) {
                        const bonusItem = higherTierTemplate[Math.floor(Math.random() * higherTierTemplate.length)];
                        const scaledBonus = this.scaleItemValue(bonusItem, loot.baseValue, higherTier);
                        loot.items.push(scaledBonus);
                        loot.totalValue += scaledBonus.scaledValue;
                    }
                }
                break;
                
            case 'quality_bonus':
                // Add quality bonus to all items
                loot.items.forEach(item => {
                    item.quality = 'perfect';
                    item.scaledValue *= (1 + effect.value);
                    item.description += ' [Perfect Quality]';
                });
                loot.totalValue *= (1 + effect.value);
                break;
        }
        
        loot.criticalEffect = effect;
        return loot;
    }
    
    getHigherRarityTier(currentRarity) {
        const rarities = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
        const currentIndex = rarities.indexOf(currentRarity);
        return currentIndex < rarities.length - 1 ? rarities[currentIndex + 1] : null;
    }
    
    applyTimeBonus(loot, timeBonus) {
        // Time-sensitive opportunities get bonus loot
        const timeBonusMultiplier = 1 + (timeBonus * this.config.timeBonusDecay);
        
        loot.items.forEach(item => {
            item.scaledValue *= timeBonusMultiplier;
            if (timeBonus > 0.5) {
                item.description += ' [Time Critical Bonus]';
            }
        });
        
        loot.totalValue *= timeBonusMultiplier;
        loot.timeBonus = timeBonus;
        
        return loot;
    }
    
    applyBossMultiplier(loot, bossMultiplier) {
        // Boss difficulty affects loot quality
        loot.items.forEach(item => {
            item.scaledValue *= bossMultiplier;
            if (bossMultiplier >= 2.0) {
                item.description += ' [Legendary Boss Drop]';
            } else if (bossMultiplier >= 1.5) {\n                item.description += ' [Elite Boss Drop]';\n            }\n        });\n        \n        loot.totalValue *= bossMultiplier;\n        loot.bossMultiplier = bossMultiplier;\n        \n        return loot;\n    }\n    \n    applyPlayerScaling(loot, playerLevel) {\n        // Higher level players get slightly better loot\n        const levelBonus = 1 + ((playerLevel - 1) * 0.05);\n        \n        loot.items.forEach(item => {\n            item.scaledValue *= levelBonus;\n        });\n        \n        loot.totalValue *= levelBonus;\n        loot.playerLevelBonus = levelBonus;\n        \n        return loot;\n    }\n    \n    calculateLootStatistics(loot, originalSavings, isCritical) {\n        return {\n            efficiency: loot.totalValue / originalSavings,\n            itemCount: loot.items.length,\n            avgItemValue: loot.totalValue / loot.items.length,\n            rarityBonus: this.rarityThresholds[loot.rarity]?.multiplier || 1.0,\n            critical: isCritical,\n            valueIncrease: ((loot.totalValue - originalSavings) / originalSavings) * 100\n        };\n    }\n    \n    // Batch processing for multiple opportunities\n    calculateBatchLoot(marketDataArray) {\n        console.log(`🎲 Processing batch of ${marketDataArray.length} opportunities...`);\n        \n        const results = [];\n        let totalValue = 0;\n        let criticalCount = 0;\n        \n        for (const marketData of marketDataArray) {\n            const loot = this.calculateLoot(marketData);\n            results.push(loot);\n            totalValue += loot.totalValue;\n            if (loot.critical) criticalCount++;\n        }\n        \n        return {\n            individual: results,\n            summary: {\n                totalOpportunities: marketDataArray.length,\n                totalValue: totalValue,\n                criticalHits: criticalCount,\n                criticalRate: (criticalCount / marketDataArray.length) * 100,\n                averageValue: totalValue / marketDataArray.length\n            }\n        };\n    }\n    \n    // Special event loot calculations\n    calculateEventLoot(eventType, baseMarketData) {\n        const eventMultipliers = {\n            'double_xp_weekend': { valueMultiplier: 1.5, critBonus: 0.1 },\n            'market_crash': { valueMultiplier: 0.8, critBonus: 0.3 },\n            'bull_market': { valueMultiplier: 2.0, critBonus: 0.05 },\n            'flash_crash': { valueMultiplier: 0.5, critBonus: 0.5 },\n            'holiday_bonus': { valueMultiplier: 1.25, critBonus: 0.15 },\n            'viral_trend': { valueMultiplier: 3.0, critBonus: 0.2 }\n        };\n        \n        const eventConfig = eventMultipliers[eventType];\n        if (!eventConfig) {\n            return this.calculateLoot(baseMarketData);\n        }\n        \n        // Modify market data for event\n        const modifiedData = {\n            ...baseMarketData,\n            savings: baseMarketData.savings * eventConfig.valueMultiplier,\n            volatility: (baseMarketData.volatility || 0.1) + eventConfig.critBonus\n        };\n        \n        const loot = this.calculateLoot(modifiedData);\n        loot.eventType = eventType;\n        loot.eventBonus = eventConfig;\n        \n        return loot;\n    }\n    \n    // Quality assessment of loot drops\n    assessLootQuality(loot) {\n        const qualityMetrics = {\n            value: loot.totalValue,\n            efficiency: loot.stats.efficiency,\n            rarity: loot.rarity,\n            itemCount: loot.items.length,\n            critical: loot.critical\n        };\n        \n        let qualityScore = 0;\n        \n        // Value scoring (0-40 points)\n        if (qualityMetrics.value >= 1000) qualityScore += 40;\n        else if (qualityMetrics.value >= 100) qualityScore += 30;\n        else if (qualityMetrics.value >= 10) qualityScore += 20;\n        else qualityScore += 10;\n        \n        // Efficiency scoring (0-20 points)\n        if (qualityMetrics.efficiency >= 3.0) qualityScore += 20;\n        else if (qualityMetrics.efficiency >= 2.0) qualityScore += 15;\n        else if (qualityMetrics.efficiency >= 1.5) qualityScore += 10;\n        else qualityScore += 5;\n        \n        // Rarity scoring (0-25 points)\n        const rarityScores = {\n            'mythic': 25,\n            'legendary': 20,\n            'epic': 15,\n            'rare': 10,\n            'uncommon': 6,\n            'common': 3\n        };\n        qualityScore += rarityScores[qualityMetrics.rarity] || 0;\n        \n        // Item count bonus (0-10 points)\n        qualityScore += Math.min(10, qualityMetrics.itemCount * 2);\n        \n        // Critical hit bonus (0-5 points)\n        if (qualityMetrics.critical) qualityScore += 5;\n        \n        return {\n            score: qualityScore,\n            grade: this.getQualityGrade(qualityScore),\n            metrics: qualityMetrics\n        };\n    }\n    \n    getQualityGrade(score) {\n        if (score >= 90) return 'S+';\n        if (score >= 80) return 'S';\n        if (score >= 70) return 'A+';\n        if (score >= 60) return 'A';\n        if (score >= 50) return 'B+';\n        if (score >= 40) return 'B';\n        if (score >= 30) return 'C+';\n        if (score >= 20) return 'C';\n        return 'D';\n    }\n    \n    // Convert loot to game format\n    formatForGame(loot) {\n        return {\n            id: crypto.randomUUID(),\n            timestamp: Date.now(),\n            rarity: loot.rarity,\n            critical: loot.critical,\n            items: loot.items.map(item => ({\n                id: item.id,\n                name: item.name,\n                description: item.description,\n                value: Math.floor(item.scaledValue),\n                rarity: item.rarity,\n                type: loot.marketType,\n                quality: item.quality || 'normal'\n            })),\n            totalValue: Math.floor(loot.totalValue),\n            originalSavings: loot.originalSavings,\n            stats: loot.stats,\n            quality: this.assessLootQuality(loot)\n        };\n    }\n    \n    // Integration with market data\n    processArbitrageForLoot(arbitrageOpportunities) {\n        const lootResults = [];\n        \n        for (const opportunity of arbitrageOpportunities) {\n            const marketData = {\n                savings: opportunity.profitPotential || opportunity.savings || 0,\n                marketType: this.classifyMarketType(opportunity),\n                volatility: opportunity.volatility || Math.random() * 0.3,\n                timeBonus: this.calculateTimeBonus(opportunity),\n                playerLevel: 1, // Would come from actual player data\n                playerLuck: 0   // Would come from actual player data\n            };\n            \n            const loot = this.calculateLoot(marketData);\n            const gameLoot = this.formatForGame(loot);\n            \n            lootResults.push({\n                opportunity: opportunity,\n                loot: gameLoot\n            });\n        }\n        \n        return lootResults;\n    }\n    \n    classifyMarketType(opportunity) {\n        const description = (opportunity.description || '').toLowerCase();\n        \n        if (description.includes('delivery') || description.includes('food')) {\n            return 'food_delivery';\n        }\n        if (description.includes('freight') || description.includes('shipping')) {\n            return 'shipping';\n        }\n        if (description.includes('api') || description.includes('technology')) {\n            return 'technology';\n        }\n        if (description.includes('energy') || description.includes('power')) {\n            return 'energy';\n        }\n        if (description.includes('real estate') || description.includes('property')) {\n            return 'real_estate';\n        }\n        \n        return 'food_delivery'; // Default\n    }\n    \n    calculateTimeBonus(opportunity) {\n        const timeWindow = opportunity.timeWindow || 'normal';\n        \n        switch (timeWindow) {\n            case 'immediate': return 1.0;\n            case 'urgent': return 0.8;\n            case 'short': return 0.5;\n            case 'medium': return 0.2;\n            case 'long': return 0.0;\n            default: return 0.1;\n        }\n    }\n}\n\nmodule.exports = RNGLootCalculator;\n\n// Run if executed directly\nif (require.main === module) {\n    const lootCalc = new RNGLootCalculator();\n    \n    console.log('\\n🎲 RNG LOOT CALCULATOR DEMO');\n    console.log('=============================');\n    \n    // Test different savings amounts\n    const testCases = [\n        { savings: 5.50, marketType: 'food_delivery', volatility: 0.2 },\n        { savings: 25.00, marketType: 'shipping', volatility: 0.4 },\n        { savings: 150.00, marketType: 'technology', volatility: 0.1 },\n        { savings: 750.00, marketType: 'energy', volatility: 0.6 },\n        { savings: 2500.00, marketType: 'real_estate', volatility: 0.3 }\n    ];\n    \n    testCases.forEach((testCase, index) => {\n        console.log(`\\n📦 Test Case ${index + 1}: $${testCase.savings} ${testCase.marketType}`);\n        const loot = lootCalc.calculateLoot(testCase);\n        const quality = lootCalc.assessLootQuality(loot);\n        \n        console.log(`   Rarity: ${loot.rarity.toUpperCase()}`);\n        console.log(`   Items: ${loot.items.length}`);\n        console.log(`   Total Value: $${loot.totalValue.toFixed(2)}`);\n        console.log(`   Critical: ${loot.critical ? 'YES' : 'No'}`);\n        console.log(`   Quality: ${quality.grade} (${quality.score}/100)`);\n        \n        loot.items.forEach((item, i) => {\n            console.log(`     ${i + 1}. ${item.name} - $${item.scaledValue.toFixed(2)}`);\n        });\n    });\n    \n    // Test batch processing\n    console.log('\\n🎯 Batch Processing Test:');\n    const batchResults = lootCalc.calculateBatchLoot(testCases);\n    console.log(`   Processed: ${batchResults.summary.totalOpportunities} opportunities`);\n    console.log(`   Total Value: $${batchResults.summary.totalValue.toFixed(2)}`);\n    console.log(`   Critical Rate: ${batchResults.summary.criticalRate.toFixed(1)}%`);\n    \n    // Test event loot\n    console.log('\\n🎉 Event Loot Test:');\n    const eventLoot = lootCalc.calculateEventLoot('viral_trend', testCases[2]);\n    console.log(`   Event: ${eventLoot.eventType}`);\n    console.log(`   Enhanced Value: $${eventLoot.totalValue.toFixed(2)}`);\n    console.log(`   Critical: ${eventLoot.critical ? 'YES' : 'No'}`);\n}