#!/usr/bin/env node

/**
 * 🌐 CROSS-MARKET DATA HUB - UNIFIED MARKET INTELLIGENCE
 * 
 * Integrates data from multiple markets with tagged packet system:
 * - OSRS Grand Exchange (prices, volumes, trends)
 * - Cryptocurrency markets (Bitcoin, Ethereum, major altcoins)
 * - Traditional stock markets (S&P 500, tech stocks)
 * - Commodity markets (gold, silver, oil)
 * - All data tagged with source tracking and confidence scores
 */

const axios = require('axios');
const EventEmitter = require('events');
const crypto = require('crypto');

class CrossMarketDataHub extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            osrs: {
                geApiUrl: 'https://services.runescape.com/m=itemdb_oldschool/api/catalogue/detail.json',
                runeliteApiUrl: 'https://prices.runescape.wiki/api/v1/osrs',
                updateInterval: 30000 // 30 seconds
            },
            crypto: {
                coinGeckoUrl: 'https://api.coingecko.com/api/v3',
                binanceUrl: 'https://api.binance.com/api/v3',
                updateInterval: 10000 // 10 seconds
            },
            stocks: {
                alphaVantageUrl: 'https://www.alphavantage.co/query',
                alphaVantageKey: process.env.ALPHA_VANTAGE_KEY,
                updateInterval: 60000 // 1 minute
            },
            commodities: {
                metalsPriceUrl: 'https://api.metals.live/v1/spot',
                updateInterval: 300000 // 5 minutes
            }
        };
        
        // Market data cache with tagged packets
        this.marketData = {
            osrs: new Map(),
            crypto: new Map(),
            stocks: new Map(),
            commodities: new Map()
        };
        
        // API call tracking for monitoring
        this.apiStats = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            avgResponseTime: 0,
            callsByEndpoint: new Map(),
            lastUpdateTime: new Map()
        };
        
        // Cross-market correlation tracking
        this.correlations = new Map();
        
        // Arbitrage opportunity tracker
        this.opportunities = [];
        
        console.log('🌐 Cross-Market Data Hub initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Start all market data feeds
        this.startOSRSDataFeed();
        this.startCryptoDataFeed();
        this.startStockDataFeed();
        this.startCommodityDataFeed();
        
        // Start cross-market analysis
        this.startCorrelationAnalysis();
        
        // Start opportunity detection
        this.startOpportunityDetection();
        
        console.log('✅ Cross-Market Data Hub ready');
        this.emit('market_hub_ready');
    }
    
    startOSRSDataFeed() {
        const updateOSRSData = async () => {
            try {
                // High-value OSRS items to track
                const trackedItems = [
                    { id: 536, name: 'Dragon bones' },
                    { id: 2434, name: 'Prayer potion(4)' },
                    { id: 4151, name: 'Abyssal whip' },
                    { id: 11802, name: 'Barrows gloves' },
                    { id: 1961, name: 'Sharks' },
                    { id: 385, name: 'Raw shark' },
                    { id: 1513, name: 'Magic logs' },
                    { id: 1615, name: 'Dragonstone' },
                    { id: 995, name: 'Coins' } // For GP rates
                ];
                
                for (const item of trackedItems) {
                    await this.fetchOSRSItemData(item);
                    await this.sleep(100); // Rate limiting
                }
                
                this.apiStats.lastUpdateTime.set('osrs', Date.now());
                
            } catch (error) {
                console.error('❌ OSRS data feed error:', error.message);
                this.apiStats.failedCalls++;
            }
        };
        
        // Initial update
        updateOSRSData();
        
        // Set up interval
        setInterval(updateOSRSData, this.config.osrs.updateInterval);
    }
    
    async fetchOSRSItemData(item) {
        const startTime = Date.now();
        
        try {
            // Fetch from RuneLite Wiki API (more reliable)
            const response = await this.makeApiCall(
                `${this.config.osrs.runeliteApiUrl}/latest?id=${item.id}`,
                'GET',
                'osrs-runelite'
            );
            
            if (response && response.data && response.data[item.id]) {
                const itemData = response.data[item.id];
                
                const taggedPacket = this.createTaggedPacket({
                    market: 'osrs',
                    symbol: item.name,
                    item_id: item.id,
                    buy_price: itemData.high,
                    sell_price: itemData.low,
                    volume: itemData.highTime ? Math.floor((Date.now() - itemData.highTime) / 1000) : 0,
                    last_updated: itemData.highTime,
                    source: 'runelite-wiki-api',
                    trust_score: 0.95,
                    response_time: Date.now() - startTime
                });
                
                // Calculate arbitrage margin
                if (itemData.high && itemData.low) {
                    taggedPacket.data.margin_gp = itemData.high - itemData.low;
                    taggedPacket.data.margin_percent = ((itemData.high - itemData.low) / itemData.low) * 100;
                }
                
                this.marketData.osrs.set(item.name, taggedPacket);
                this.emit('market_data_update', 'osrs', item.name, taggedPacket);
                
                // Check for arbitrage opportunities
                this.checkArbitrageOpportunity('osrs', item.name, taggedPacket);
            }
            
        } catch (error) {
            console.error(`Failed to fetch OSRS data for ${item.name}:`, error.message);
            this.apiStats.failedCalls++;
        }
    }
    
    startCryptoDataFeed() {
        const updateCryptoData = async () => {
            try {
                // Major cryptocurrencies to track
                const cryptos = ['bitcoin', 'ethereum', 'cardano', 'polkadot', 'chainlink', 'litecoin'];
                
                // Fetch from CoinGecko
                const response = await this.makeApiCall(
                    `${this.config.crypto.coinGeckoUrl}/simple/price?ids=${cryptos.join(',')}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`,
                    'GET',
                    'coingecko'
                );
                
                if (response && response.data) {
                    for (const [cryptoId, data] of Object.entries(response.data)) {
                        const taggedPacket = this.createTaggedPacket({
                            market: 'crypto',
                            symbol: cryptoId.toUpperCase(),
                            price: data.usd,
                            change_24h: data.usd_24h_change,
                            volume_24h: data.usd_24h_vol,
                            source: 'coingecko-api',
                            trust_score: 0.92,
                            response_time: Date.now() - performance.now()
                        });
                        
                        this.marketData.crypto.set(cryptoId, taggedPacket);
                        this.emit('market_data_update', 'crypto', cryptoId, taggedPacket);
                    }
                }
                
                this.apiStats.lastUpdateTime.set('crypto', Date.now());
                
            } catch (error) {
                console.error('❌ Crypto data feed error:', error.message);
                this.apiStats.failedCalls++;
            }
        };
        
        // Initial update
        updateCryptoData();
        
        // Set up interval
        setInterval(updateCryptoData, this.config.crypto.updateInterval);
    }
    
    startStockDataFeed() {
        if (!this.config.stocks.alphaVantageKey) {
            console.log('⚠️ No Alpha Vantage API key provided, skipping stock data');
            return;
        }
        
        const updateStockData = async () => {
            try {
                // Major tech stocks to track
                const stocks = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'NVDA'];
                
                for (const symbol of stocks) {
                    try {
                        const response = await this.makeApiCall(
                            `${this.config.stocks.alphaVantageUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.config.stocks.alphaVantageKey}`,
                            'GET',
                            'alpha-vantage'
                        );
                        
                        if (response && response.data && response.data['Global Quote']) {
                            const quote = response.data['Global Quote'];
                            
                            const taggedPacket = this.createTaggedPacket({
                                market: 'stocks',
                                symbol: symbol,
                                price: parseFloat(quote['05. price']),
                                change_percent: parseFloat(quote['10. change percent'].replace('%', '')),
                                volume: parseInt(quote['06. volume']),
                                high: parseFloat(quote['03. high']),
                                low: parseFloat(quote['04. low']),
                                source: 'alpha-vantage-api',
                                trust_score: 0.98,
                                response_time: Date.now() - performance.now()
                            });
                            
                            this.marketData.stocks.set(symbol, taggedPacket);
                            this.emit('market_data_update', 'stocks', symbol, taggedPacket);
                        }
                        
                        await this.sleep(12000); // Alpha Vantage rate limit: 5 calls per minute
                        
                    } catch (error) {
                        console.error(`Failed to fetch stock data for ${symbol}:`, error.message);
                    }
                }
                
                this.apiStats.lastUpdateTime.set('stocks', Date.now());
                
            } catch (error) {
                console.error('❌ Stock data feed error:', error.message);
                this.apiStats.failedCalls++;
            }
        };
        
        // Initial update (delayed to avoid rate limits)
        setTimeout(updateStockData, 5000);
        
        // Set up interval
        setInterval(updateStockData, this.config.stocks.updateInterval);
    }
    
    startCommodityDataFeed() {
        const updateCommodityData = async () => {
            try {
                // Fetch precious metals data
                const response = await this.makeApiCall(
                    `${this.config.commodities.metalsPriceUrl}`,
                    'GET',
                    'metals-api'
                );
                
                if (response && response.data) {
                    const commodities = ['gold', 'silver', 'platinum', 'palladium'];
                    
                    for (const metal of commodities) {
                        if (response.data[metal]) {
                            const taggedPacket = this.createTaggedPacket({
                                market: 'commodities',
                                symbol: metal.toUpperCase(),
                                price: response.data[metal],
                                unit: 'USD/oz',
                                source: 'metals-live-api',
                                trust_score: 0.90,
                                response_time: Date.now() - performance.now()
                            });
                            
                            this.marketData.commodities.set(metal, taggedPacket);
                            this.emit('market_data_update', 'commodities', metal, taggedPacket);
                        }
                    }
                }
                
                this.apiStats.lastUpdateTime.set('commodities', Date.now());
                
            } catch (error) {
                console.error('❌ Commodity data feed error:', error.message);
                this.apiStats.failedCalls++;
            }
        };
        
        // Initial update
        updateCommodityData();
        
        // Set up interval
        setInterval(updateCommodityData, this.config.commodities.updateInterval);
    }
    
    startCorrelationAnalysis() {
        setInterval(() => {
            try {
                this.analyzeCorrelations();
            } catch (error) {
                console.error('Correlation analysis error:', error);
            }
        }, 60000); // Every minute
    }
    
    analyzeCorrelations() {
        // Analyze correlations between different markets
        const correlationPairs = [
            ['crypto:bitcoin', 'stocks:TSLA'],
            ['crypto:ethereum', 'stocks:NVDA'],
            ['osrs:Dragon bones', 'crypto:bitcoin'], // Fun correlation to track
            ['commodities:gold', 'crypto:bitcoin'],
            ['stocks:AAPL', 'stocks:MSFT']
        ];
        
        for (const [market1, market2] of correlationPairs) {
            const [market1Type, symbol1] = market1.split(':');
            const [market2Type, symbol2] = market2.split(':');
            
            const data1 = this.marketData[market1Type]?.get(symbol1.toLowerCase());
            const data2 = this.marketData[market2Type]?.get(symbol2);
            
            if (data1 && data2) {
                const correlation = this.calculateCorrelation(data1, data2);
                
                if (Math.abs(correlation) > 0.5) { // Strong correlation
                    const correlationPacket = this.createTaggedPacket({
                        type: 'correlation',
                        pair: `${market1} <-> ${market2}`,
                        correlation_coefficient: correlation,
                        strength: Math.abs(correlation) > 0.8 ? 'strong' : 'moderate',
                        market1_data: data1.data,
                        market2_data: data2.data,
                        analysis_time: Date.now(),
                        source: 'cross-market-analyzer',
                        trust_score: 0.75
                    });
                    
                    this.correlations.set(`${market1}-${market2}`, correlationPacket);
                    this.emit('correlation_detected', correlationPacket);
                }
            }
        }
    }
    
    calculateCorrelation(data1, data2) {
        // Simple correlation calculation based on price changes
        const change1 = data1.data.change_24h || data1.data.margin_percent || 0;
        const change2 = data2.data.change_24h || data2.data.change_percent || 0;
        
        // This is a simplified correlation - in reality you'd want historical data
        return Math.random() * 2 - 1; // Mock correlation for now
    }
    
    startOpportunityDetection() {
        setInterval(() => {
            try {
                this.detectArbitrageOpportunities();
                this.detectTrendOpportunities();
            } catch (error) {
                console.error('Opportunity detection error:', error);
            }
        }, 30000); // Every 30 seconds
    }
    
    checkArbitrageOpportunity(market, symbol, packet) {
        if (market === 'osrs' && packet.data.margin_percent > 5) {
            const opportunity = {
                id: crypto.randomUUID(),
                type: 'arbitrage',
                market: market,
                symbol: symbol,
                profit_percent: packet.data.margin_percent,
                profit_gp: packet.data.margin_gp,
                buy_price: packet.data.sell_price,
                sell_price: packet.data.buy_price,
                confidence: packet.confidence_score,
                detected_at: Date.now(),
                expires_at: Date.now() + (5 * 60 * 1000), // 5 minute expiry
                source_packet: packet.id
            };
            
            this.opportunities.push(opportunity);
            this.emit('arbitrage_opportunity', opportunity);
            
            console.log(`💰 Arbitrage opportunity: ${symbol} - ${packet.data.margin_percent.toFixed(2)}% margin`);
        }
    }
    
    detectArbitrageOpportunities() {
        // Clean expired opportunities
        this.opportunities = this.opportunities.filter(opp => opp.expires_at > Date.now());
    }
    
    detectTrendOpportunities() {
        // Analyze trends across markets for opportunities
        for (const [market, dataMap] of Object.entries(this.marketData)) {
            for (const [symbol, packet] of dataMap.entries()) {
                const change = packet.data.change_24h || packet.data.change_percent || packet.data.margin_percent || 0;
                
                if (Math.abs(change) > 10) { // Significant movement
                    const trendOpportunity = {
                        id: crypto.randomUUID(),
                        type: 'trend',
                        market: market,
                        symbol: symbol,
                        direction: change > 0 ? 'bullish' : 'bearish',
                        magnitude: Math.abs(change),
                        confidence: packet.confidence_score * (Math.abs(change) / 20), // Scale by magnitude
                        detected_at: Date.now(),
                        source_packet: packet.id
                    };
                    
                    this.emit('trend_opportunity', trendOpportunity);
                }
            }
        }
    }
    
    createTaggedPacket(data) {
        const packet = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            data: data,
            source_tracking: {
                api_endpoint: data.source,
                response_time: data.response_time,
                trust_score: data.trust_score,
                data_freshness: Date.now()
            },
            confidence_score: data.trust_score || 0.5,
            hash: this.hashData(data)
        };
        
        return packet;
    }
    
    hashData(data) {
        return crypto.createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex')
            .substring(0, 16);
    }
    
    async makeApiCall(url, method = 'GET', endpoint_name) {
        const startTime = Date.now();
        
        try {
            this.apiStats.totalCalls++;
            
            const response = await axios({
                method: method,
                url: url,
                timeout: 10000,
                headers: {
                    'User-Agent': 'Cross-Market-Data-Hub/1.0'
                }
            });
            
            const responseTime = Date.now() - startTime;
            
            // Update stats
            this.apiStats.successfulCalls++;
            this.updateResponseTime(responseTime);
            this.updateEndpointStats(endpoint_name, true, responseTime);
            
            // Emit API call event for monitoring
            this.emit('api_call_made', {
                endpoint: endpoint_name,
                url: url,
                method: method,
                response_time: responseTime,
                success: true,
                status_code: response.status
            });
            
            return response;
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            this.apiStats.failedCalls++;
            this.updateEndpointStats(endpoint_name, false, responseTime);
            
            this.emit('api_call_made', {
                endpoint: endpoint_name,
                url: url,
                method: method,
                response_time: responseTime,
                success: false,
                error: error.message
            });
            
            throw error;
        }
    }
    
    updateResponseTime(responseTime) {
        const count = this.apiStats.successfulCalls;
        if (count === 1) {
            this.apiStats.avgResponseTime = responseTime;
        } else {
            this.apiStats.avgResponseTime = (this.apiStats.avgResponseTime * (count - 1) + responseTime) / count;
        }
    }
    
    updateEndpointStats(endpoint, success, responseTime) {
        if (!this.apiStats.callsByEndpoint.has(endpoint)) {
            this.apiStats.callsByEndpoint.set(endpoint, {
                total: 0,
                successful: 0,
                failed: 0,
                avgResponseTime: 0
            });
        }
        
        const stats = this.apiStats.callsByEndpoint.get(endpoint);
        stats.total++;
        
        if (success) {
            stats.successful++;
            stats.avgResponseTime = (stats.avgResponseTime * (stats.successful - 1) + responseTime) / stats.successful;
        } else {
            stats.failed++;
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Public API for getting market data
    getMarketData(market, symbol) {
        return this.marketData[market]?.get(symbol);
    }
    
    getAllMarketData() {
        const result = {};
        for (const [market, dataMap] of Object.entries(this.marketData)) {
            result[market] = Object.fromEntries(dataMap);
        }
        return result;
    }
    
    getApiStats() {
        return {
            ...this.apiStats,
            callsByEndpoint: Object.fromEntries(this.apiStats.callsByEndpoint),
            lastUpdateTime: Object.fromEntries(this.apiStats.lastUpdateTime)
        };
    }
    
    getOpportunities() {
        return this.opportunities.filter(opp => opp.expires_at > Date.now());
    }
    
    getCorrelations() {
        return Object.fromEntries(this.correlations);
    }
}

module.exports = CrossMarketDataHub;

// Test if run directly
if (require.main === module) {
    const hub = new CrossMarketDataHub();
    
    // Set up event listeners for monitoring
    hub.on('market_data_update', (market, symbol, packet) => {
        console.log(`📊 ${market.toUpperCase()} update: ${symbol}`);
    });
    
    hub.on('api_call_made', (callData) => {
        console.log(`🔌 API call: ${callData.endpoint} (${callData.response_time}ms) ${callData.success ? '✅' : '❌'}`);
    });
    
    hub.on('arbitrage_opportunity', (opportunity) => {
        console.log(`💰 ARBITRAGE: ${opportunity.symbol} - ${opportunity.profit_percent.toFixed(2)}% profit`);
    });
    
    hub.on('correlation_detected', (correlation) => {
        console.log(`🔗 CORRELATION: ${correlation.data.pair} - ${correlation.data.correlation_coefficient.toFixed(3)}`);
    });
    
    // Show stats every 30 seconds
    setInterval(() => {
        const stats = hub.getApiStats();
        console.log('\n📈 Market Hub Stats:');
        console.log(`   Total API calls: ${stats.totalCalls}`);
        console.log(`   Success rate: ${((stats.successfulCalls / stats.totalCalls) * 100).toFixed(1)}%`);
        console.log(`   Avg response time: ${Math.round(stats.avgResponseTime)}ms`);
        console.log(`   Active opportunities: ${hub.getOpportunities().length}`);
        
        const marketStats = hub.getAllMarketData();
        Object.keys(marketStats).forEach(market => {
            console.log(`   ${market.toUpperCase()} items: ${Object.keys(marketStats[market]).length}`);
        });
        console.log('');
    }, 30000);
    
    // Keep the process running
    process.on('SIGINT', () => {
        console.log('\n🔴 Shutting down Cross-Market Data Hub...');
        process.exit(0);
    });
}