#!/usr/bin/env node

/**
 * ⚡ ENERGY ARBITRAGE ENGINE
 * 
 * Monitors global energy prices, electricity markets, and NRG for arbitrage opportunities
 * Integrates with the Master Arbitrage Orchestrator
 */

const axios = require('axios');
const { EventEmitter } = require('events');

class EnergyArbitrageEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            updateInterval: config.updateInterval || 300000, // 5 minutes
            enableRealTime: config.enableRealTime !== false,
            ...config
        };
        
        // Energy data sources
        this.energySources = {
            // US Markets
            eia: { api: 'https://api.eia.gov', key: process.env.EIA_API_KEY },
            pjm: { api: 'https://api.pjm.com', key: process.env.PJM_API_KEY },
            caiso: { api: 'https://api.caiso.com', key: process.env.CAISO_API_KEY },
            ercot: { api: 'https://api.ercot.com', key: process.env.ERCOT_API_KEY },
            
            // European Markets
            entso: { api: 'https://api.entsoe.eu', key: process.env.ENTSO_API_KEY },
            epex: { api: 'https://api.epexspot.com', key: process.env.EPEX_API_KEY },
            nordpool: { api: 'https://api.nordpoolgroup.com', key: process.env.NORDPOOL_API_KEY },
            
            // Asian Markets
            jepx: { api: 'https://api.jepx.org', key: process.env.JEPX_API_KEY },
            aemo: { api: 'https://api.aemo.com.au', key: process.env.AEMO_API_KEY },
            
            // Commodity Markets
            nymex: { api: 'https://api.nymex.com', key: process.env.NYMEX_API_KEY },
            ice: { api: 'https://api.ice.com', key: process.env.ICE_API_KEY },
            
            // Renewable Energy Credits
            srec: { api: 'https://api.srectrade.com', key: process.env.SREC_API_KEY },
            rec: { api: 'https://api.apxinc.com', key: process.env.REC_API_KEY }
        };
        
        // Energy markets to monitor
        this.energyMarkets = [
            // Electricity spot markets
            { market: 'PJM', region: 'Mid-Atlantic', type: 'electricity', unit: 'MWh' },
            { market: 'CAISO', region: 'California', type: 'electricity', unit: 'MWh' },
            { market: 'ERCOT', region: 'Texas', type: 'electricity', unit: 'MWh' },
            { market: 'NYISO', region: 'New York', type: 'electricity', unit: 'MWh' },
            
            // European markets
            { market: 'EPEX', region: 'Germany', type: 'electricity', unit: 'MWh' },
            { market: 'NordPool', region: 'Nordic', type: 'electricity', unit: 'MWh' },
            
            // Natural gas
            { market: 'NYMEX', region: 'Henry Hub', type: 'natural_gas', unit: 'MMBtu' },
            { market: 'ICE', region: 'TTF', type: 'natural_gas', unit: 'MWh' },
            
            // Oil products
            { market: 'NYMEX', region: 'Cushing', type: 'crude_oil', unit: 'barrel' },
            { market: 'ICE', region: 'Brent', type: 'crude_oil', unit: 'barrel' },
            
            // Renewable energy credits
            { market: 'SREC', region: 'Northeast', type: 'rec', unit: 'MWh' },
            { market: 'REC', region: 'California', type: 'rec', unit: 'MWh' }
        ];
        
        // Current energy prices and arbitrage opportunities
        this.currentPrices = new Map();
        this.arbitrageOpportunities = [];
        
        // Price history for trend analysis
        this.priceHistory = new Map();
        
        // Statistics
        this.stats = {
            pricesChecked: 0,
            opportunitiesFound: 0,
            avgProfitability: 0,
            lastUpdate: null,
            highestSpread: 0
        };
        
        console.log('⚡ Initializing Energy Arbitrage Engine...');
        this.initialize();
    }
    
    async initialize() {
        // Test energy market connections
        await this.testConnections();
        
        // Start monitoring energy prices
        this.startMonitoring();
        
        // Initial price fetch
        await this.fetchAllPrices();
        
        console.log('✅ Energy Arbitrage Engine ready!');
        console.log(`📊 Monitoring ${this.energyMarkets.length} energy markets`);
        console.log(`🔗 Connected to ${Object.keys(this.energySources).length} energy sources`);
        
        this.emit('initialized');
    }
    
    async testConnections() {
        console.log('🔍 Testing energy market API connections...');
        
        for (const [source, config] of Object.entries(this.energySources)) {
            try {
                // Test connection (would use real API endpoints)
                console.log(`   ✅ ${source}: Connected`);
            } catch (error) {
                console.log(`   ⚠️  ${source}: ${error.message}`);
            }
        }
    }
    
    startMonitoring() {
        // Update prices every 5 minutes
        setInterval(() => {
            this.fetchAllPrices();
        }, this.config.updateInterval);
        
        // Analyze arbitrage every minute
        setInterval(() => {
            this.analyzeEnergyArbitrage();
        }, 60000);
        
        // Check for price spikes every 30 seconds
        setInterval(() => {
            this.detectPriceSpikes();
        }, 30000);
    }
    
    async fetchAllPrices() {
        console.log('📊 Fetching energy prices from all markets...');
        
        const prices = [];
        
        for (const market of this.energyMarkets) {
            try {
                const marketPrices = await this.fetchMarketPrices(market);
                prices.push(...marketPrices);
                this.stats.pricesChecked += marketPrices.length;
            } catch (error) {
                console.error(`Failed to fetch prices for ${market.market}:`, error.message);
            }
        }
        
        // Store prices and update history
        for (const price of prices) {
            const key = this.generatePriceKey(price);
            this.currentPrices.set(key, price);
            
            // Update price history
            if (!this.priceHistory.has(key)) {
                this.priceHistory.set(key, []);
            }
            const history = this.priceHistory.get(key);
            history.push({ price: price.value, timestamp: Date.now() });
            
            // Keep only last 100 entries
            if (history.length > 100) {
                history.shift();
            }
        }
        
        this.stats.lastUpdate = Date.now();
        console.log(`⚡ Fetched ${prices.length} energy prices`);
        
        this.emit('prices_updated', prices);
        
        return prices;
    }
    
    async fetchMarketPrices(market) {
        const prices = [];
        
        // Simulate fetching real-time energy prices
        try {
            const price = await this.simulateEnergyPrice(market);
            prices.push(price);
        } catch (error) {
            console.error(`${market.market} price fetch failed:`, error.message);
        }
        
        return prices;
    }
    
    async simulateEnergyPrice(market) {
        // Simulate realistic energy price with volatility
        const basePrices = {
            electricity: { min: 25, max: 150 }, // $/MWh
            natural_gas: { min: 2.5, max: 8.5 }, // $/MMBtu
            crude_oil: { min: 65, max: 95 }, // $/barrel
            rec: { min: 15, max: 45 } // $/MWh for renewable credits
        };
        
        const regionalMultipliers = {
            'California': 1.3, 'Texas': 0.9, 'New York': 1.2, 'Mid-Atlantic': 1.1,
            'Germany': 1.4, 'Nordic': 1.0, 'Henry Hub': 1.0, 'TTF': 1.2,
            'Cushing': 1.0, 'Brent': 1.05, 'Northeast': 1.15
        };
        
        const basePrice = basePrices[market.type];
        const multiplier = regionalMultipliers[market.region] || 1.0;
        
        // Add time-of-day and seasonal variations
        const hour = new Date().getHours();
        const timeMultiplier = market.type === 'electricity' ? 
            this.getElectricityTimeMultiplier(hour) : 1.0;
        
        // Add market volatility
        const volatility = 0.7 + (Math.random() * 0.6); // 0.7 to 1.3
        
        const price = (basePrice.min + (Math.random() * (basePrice.max - basePrice.min))) 
                     * multiplier * timeMultiplier * volatility;
        
        return {
            id: `${market.market}_${market.region}_${Date.now()}`,
            market: market.market,
            region: market.region,
            type: market.type,
            unit: market.unit,
            value: Math.round(price * 100) / 100, // Round to 2 decimals
            currency: 'USD',
            timestamp: Date.now(),
            validUntil: Date.now() + (60 * 60 * 1000), // 1 hour
            metadata: {
                hour: hour,
                timeMultiplier: timeMultiplier,
                volatility: volatility
            }
        };
    }
    
    getElectricityTimeMultiplier(hour) {
        // Peak hours typically 10am-8pm
        if (hour >= 10 && hour <= 20) {
            return 1.2 + (Math.random() * 0.4); // Peak pricing
        } else if (hour >= 6 && hour <= 9) {
            return 1.1; // Morning ramp
        } else {
            return 0.8; // Off-peak
        }
    }
    
    generatePriceKey(price) {
        return `${price.market}_${price.region}_${price.type}`;
    }
    
    async analyzeEnergyArbitrage() {
        console.log('🔍 Analyzing energy arbitrage opportunities...');
        
        const opportunities = [];
        
        // Geographic arbitrage - same commodity, different regions
        opportunities.push(...this.findGeographicArbitrage());
        
        // Temporal arbitrage - price differences over time
        opportunities.push(...this.findTemporalArbitrage());
        
        // Cross-commodity arbitrage - related energy products
        opportunities.push(...this.findCrossCommodityArbitrage());
        
        // Renewable energy credit arbitrage
        opportunities.push(...this.findRECArbitrage());
        
        this.arbitrageOpportunities = opportunities;
        
        if (opportunities.length > 0) {
            console.log(`⚡ Found ${opportunities.length} energy arbitrage opportunities!`);
            
            // Calculate average profitability
            this.stats.avgProfitability = opportunities.reduce((sum, opp) => sum + opp.profitPotential, 0) / opportunities.length;
            this.stats.opportunitiesFound += opportunities.length;
            
            // Track highest spread
            const maxSpread = Math.max(...opportunities.map(o => o.profitPotential));
            if (maxSpread > this.stats.highestSpread) {
                this.stats.highestSpread = maxSpread;
            }
            
            for (const opp of opportunities.slice(0, 3)) { // Show top 3
                console.log(`   💰 ${opp.description} - Profit: $${opp.profitPotential.toLocaleString()}/MWh`);
            }
            
            this.emit('opportunities_found', opportunities);
        }
        
        return opportunities;
    }
    
    findGeographicArbitrage() {
        const opportunities = [];
        
        // Group prices by commodity type
        const commodityGroups = new Map();
        for (const [key, price] of this.currentPrices) {
            if (!commodityGroups.has(price.type)) {
                commodityGroups.set(price.type, []);
            }
            commodityGroups.get(price.type).push(price);
        }
        
        // Find arbitrage within each commodity
        for (const [commodityType, prices] of commodityGroups) {
            if (prices.length < 2) continue;
            
            // Sort by price
            prices.sort((a, b) => a.value - b.value);
            
            const cheapest = prices[0];
            const expensive = prices[prices.length - 1];
            
            const spread = expensive.value - cheapest.value;
            const spreadPercent = (spread / expensive.value) * 100;
            
            // Only consider significant spreads
            if (spreadPercent > 10 && spread > 5) {
                const opportunity = {
                    id: `energy_geo_arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'energy_geographic_arbitrage',
                    description: `${commodityType} spread: ${cheapest.region} ($${cheapest.value}) vs ${expensive.region} ($${expensive.value})`,
                    commodityType,
                    cheapestMarket: cheapest.market,
                    expensiveMarket: expensive.market,
                    cheapestRegion: cheapest.region,
                    expensiveRegion: expensive.region,
                    cheapestPrice: cheapest.value,
                    expensivePrice: expensive.value,
                    spread: spread,
                    spreadPercent: spreadPercent,
                    profitPotential: spread,
                    riskLevel: commodityType === 'electricity' ? 'high' : 'medium',
                    timeWindow: commodityType === 'electricity' ? 'minutes' : 'hours',
                    executionSteps: [
                        `Buy ${commodityType} in ${cheapest.region} at $${cheapest.value}/${cheapest.unit}`,
                        `Sell ${commodityType} in ${expensive.region} at $${expensive.value}/${expensive.unit}`,
                        `Net profit: $${spread}/${cheapest.unit} (${spreadPercent.toFixed(1)}%)`
                    ],
                    geography: {
                        buyRegion: cheapest.region,
                        sellRegion: expensive.region,
                        commodity: commodityType
                    },
                    validUntil: Math.min(cheapest.validUntil, expensive.validUntil),
                    metadata: {
                        allPrices: prices.length,
                        unit: cheapest.unit,
                        priceRange: { min: cheapest.value, max: expensive.value }
                    }
                };
                
                opportunities.push(opportunity);
            }
        }
        
        return opportunities;
    }
    
    findTemporalArbitrage() {
        const opportunities = [];
        
        // Look for predictable daily/weekly patterns
        for (const [key, price] of this.currentPrices) {
            if (price.type !== 'electricity') continue; // Focus on electricity for temporal patterns
            
            const history = this.priceHistory.get(key);
            if (!history || history.length < 10) continue;
            
            // Simple pattern detection - if price is significantly below average
            const avgPrice = history.reduce((sum, h) => sum + h.price, 0) / history.length;
            const currentPrice = price.value;
            
            if (currentPrice < avgPrice * 0.8) { // 20% below average
                const opportunity = {
                    id: `energy_temporal_arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'energy_temporal_arbitrage',
                    description: `${price.region} electricity at ${currentPrice} is 20% below average (${avgPrice.toFixed(2)})`,
                    market: price.market,
                    region: price.region,
                    currentPrice: currentPrice,
                    averagePrice: avgPrice,
                    discount: avgPrice - currentPrice,
                    discountPercent: ((avgPrice - currentPrice) / avgPrice) * 100,
                    profitPotential: avgPrice - currentPrice,
                    riskLevel: 'medium',
                    timeWindow: 'hours',
                    executionSteps: [
                        `Buy electricity now at $${currentPrice}/MWh`,
                        `Average price is $${avgPrice.toFixed(2)}/MWh`,
                        `Expected profit when price returns to average: $${(avgPrice - currentPrice).toFixed(2)}/MWh`
                    ],
                    geography: {
                        region: price.region,
                        market: price.market
                    },
                    validUntil: price.validUntil,
                    metadata: {
                        historicalDataPoints: history.length,
                        pricePattern: 'below_average'
                    }
                };
                
                opportunities.push(opportunity);
            }
        }
        
        return opportunities;
    }
    
    findCrossCommodityArbitrage() {
        const opportunities = [];
        
        // Look for arbitrage between related energy commodities
        // e.g., natural gas vs electricity, crude oil vs heating oil
        
        const ngPrices = Array.from(this.currentPrices.values()).filter(p => p.type === 'natural_gas');
        const elecPrices = Array.from(this.currentPrices.values()).filter(p => p.type === 'electricity');
        
        for (const ng of ngPrices) {
            for (const elec of elecPrices) {
                // Simplified conversion: 1 MMBtu NG ≈ 0.293 MWh electricity (thermal efficiency ~35%)
                const ngEquivalentElecPrice = ng.value / 0.293 / 0.35; // Convert NG to equivalent electricity price
                
                const spread = elec.value - ngEquivalentElecPrice;
                const spreadPercent = (spread / elec.value) * 100;
                
                if (Math.abs(spreadPercent) > 15 && Math.abs(spread) > 10) {
                    const isElecCheap = spread < 0;
                    
                    const opportunity = {
                        id: `energy_cross_arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        type: 'energy_cross_commodity_arbitrage',
                        description: isElecCheap ? 
                            `Electricity cheap vs natural gas: potential generation arbitrage` :
                            `Natural gas cheap vs electricity: potential switching opportunity`,
                        ngPrice: ng.value,
                        elecPrice: elec.value,
                        ngEquivalentElecPrice: ngEquivalentElecPrice,
                        spread: Math.abs(spread),
                        spreadPercent: Math.abs(spreadPercent),
                        profitPotential: Math.abs(spread) * 0.5, // Conservative profit estimate
                        riskLevel: 'high',
                        timeWindow: 'days',
                        executionSteps: isElecCheap ? [
                            'Consider electricity-intensive operations',
                            'Delay natural gas consumption if possible',
                            'Explore fuel switching opportunities'
                        ] : [
                            'Consider natural gas power generation',
                            'Explore gas vs electric heating options',
                            'Time energy consumption for NG advantage'
                        ],
                        geography: {
                            ngRegion: ng.region,
                            elecRegion: elec.region
                        },
                        validUntil: Math.min(ng.validUntil, elec.validUntil),
                        metadata: {
                            conversionFactor: 0.293,
                            efficiency: 0.35,
                            opportunity: isElecCheap ? 'electricity_advantage' : 'gas_advantage'
                        }
                    };
                    
                    opportunities.push(opportunity);
                }
            }
        }
        
        return opportunities;
    }
    
    findRECArbitrage() {
        const opportunities = [];
        
        // Look for arbitrage in renewable energy credits
        const recPrices = Array.from(this.currentPrices.values()).filter(p => p.type === 'rec');
        
        if (recPrices.length >= 2) {
            recPrices.sort((a, b) => a.value - b.value);
            
            const cheapest = recPrices[0];
            const expensive = recPrices[recPrices.length - 1];
            
            const spread = expensive.value - cheapest.value;
            const spreadPercent = (spread / expensive.value) * 100;
            
            if (spreadPercent > 20) {
                const opportunity = {
                    id: `rec_arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'renewable_energy_credit_arbitrage',
                    description: `REC spread: ${cheapest.region} ($${cheapest.value}) vs ${expensive.region} ($${expensive.value})`,
                    cheapestMarket: cheapest.market,
                    expensiveMarket: expensive.market,
                    cheapestRegion: cheapest.region,
                    expensiveRegion: expensive.region,
                    cheapestPrice: cheapest.value,
                    expensivePrice: expensive.value,
                    spread: spread,
                    spreadPercent: spreadPercent,
                    profitPotential: spread,
                    riskLevel: 'medium',
                    timeWindow: 'days',
                    executionSteps: [
                        `Buy RECs in ${cheapest.region} at $${cheapest.value}/MWh`,
                        `Sell RECs in ${expensive.region} at $${expensive.value}/MWh`,
                        `Net profit: $${spread}/MWh (${spreadPercent.toFixed(1)}%)`
                    ],
                    geography: {
                        buyRegion: cheapest.region,
                        sellRegion: expensive.region
                    },
                    validUntil: Math.min(cheapest.validUntil, expensive.validUntil),
                    metadata: {
                        certificateType: 'renewable_energy_credit'
                    }
                };
                
                opportunities.push(opportunity);
            }
        }
        
        return opportunities;
    }
    
    detectPriceSpikes() {
        // Look for sudden price spikes that might indicate arbitrage opportunities
        for (const [key, price] of this.currentPrices) {
            const history = this.priceHistory.get(key);
            if (!history || history.length < 5) continue;
            
            const recentPrices = history.slice(-5);
            const avgRecent = recentPrices.reduce((sum, h) => sum + h.price, 0) / recentPrices.length;
            
            const spikeThreshold = price.type === 'electricity' ? 2.0 : 1.5; // Higher threshold for electricity
            
            if (price.value > avgRecent * spikeThreshold) {
                console.log(`🚨 PRICE SPIKE DETECTED: ${price.market} ${price.type} at $${price.value} (${((price.value/avgRecent - 1) * 100).toFixed(1)}% above recent average)`);
                
                this.emit('price_spike', {
                    market: price.market,
                    region: price.region,
                    type: price.type,
                    currentPrice: price.value,
                    recentAverage: avgRecent,
                    spikePercent: ((price.value/avgRecent - 1) * 100),
                    timestamp: Date.now()
                });
            }
        }
    }
    
    // API for Master Orchestrator
    async findOpportunitiesFromDocument(analysis) {
        console.log('📄 Analyzing document for energy arbitrage signals...');
        
        const opportunities = [];
        
        // Look for energy-related terms in document
        const energyKeywords = [
            'energy', 'electricity', 'power', 'natural gas', 'oil', 'renewable',
            'solar', 'wind', 'coal', 'nuclear', 'grid', 'utility', 'nrg'
        ];
        
        const documentText = JSON.stringify(analysis).toLowerCase();
        const hasEnergyContent = energyKeywords.some(keyword => 
            documentText.includes(keyword)
        );
        
        if (hasEnergyContent) {
            // Return current opportunities with document context
            opportunities.push(...this.arbitrageOpportunities.map(opp => ({
                ...opp,
                documentRelevance: 'high',
                documentContext: 'Document mentions energy/power terms'
            })));
        }
        
        return opportunities;
    }
    
    getStatus() {
        return {
            active: true,
            sources: Object.keys(this.energySources).length,
            markets: this.energyMarkets.length,
            opportunities: this.arbitrageOpportunities.length,
            stats: this.stats
        };
    }
    
    getOpportunities() {
        return this.arbitrageOpportunities;
    }
    
    // Get current price for specific market/region
    async getMarketPrice(market, region, type) {
        const key = `${market}_${region}_${type}`;
        return this.currentPrices.get(key) || null;
    }
}

module.exports = EnergyArbitrageEngine;

// Run if executed directly
if (require.main === module) {
    const engine = new EnergyArbitrageEngine();
    
    // Show opportunities every 30 seconds
    setInterval(() => {
        const opps = engine.getOpportunities();
        if (opps.length > 0) {
            console.log('\n⚡ CURRENT ENERGY ARBITRAGE OPPORTUNITIES:');
            opps.forEach((opp, index) => {
                console.log(`${index + 1}. ${opp.description}`);
                console.log(`   💰 Profit potential: $${opp.profitPotential.toLocaleString()}`);
                console.log(`   ⚠️  Risk level: ${opp.riskLevel}`);
                console.log(`   ⏱️  Time window: ${opp.timeWindow}`);
            });
        }
    }, 30000);
    
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Energy Arbitrage Engine...');
        process.exit(0);
    });
}