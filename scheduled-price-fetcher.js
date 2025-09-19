#!/usr/bin/env node

/**
 * 📅 SCHEDULED PRICE FETCHER WITH CRON JOBS
 * 
 * Automatically fetches real prices on scheduled intervals
 * and generates game narratives based on price movements
 */

const cron = require('node-cron');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const RealTimeDataOracle = require('./real-time-data-oracle');

class ScheduledPriceFetcher extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            enableCron: config.enableCron !== false,
            logFile: config.logFile || './logs/price-fetcher.log',
            narrativeFile: config.narrativeFile || './logs/game-narratives.log',
            ...config
        };
        
        // Data oracle
        this.oracle = new RealTimeDataOracle();
        
        // Price history for narrative generation
        this.priceHistory = new Map();
        this.narrativeThresholds = {
            major: 10,      // 10% change triggers major narrative
            moderate: 5,    // 5% change triggers moderate narrative
            minor: 2        // 2% change triggers minor narrative
        };
        
        // Scheduled jobs
        this.cronJobs = new Map();
        
        // Statistics
        this.stats = {
            totalFetches: 0,
            successfulFetches: 0,
            failedFetches: 0,
            narrativesGenerated: 0,
            startTime: Date.now()
        };
        
        console.log('📅 Initializing Scheduled Price Fetcher...');
        this.initialize();
    }
    
    async initialize() {
        // Initialize oracle
        await this.oracle.initializeRedis();
        
        // Create log directories
        await this.ensureLogDirectories();
        
        // Setup cron jobs
        if (this.config.enableCron) {
            this.setupCronJobs();
        }
        
        // Initial fetch
        await this.fetchAllPrices();
        
        console.log('✅ Scheduled Price Fetcher ready!');
        this.emit('initialized');
    }
    
    async ensureLogDirectories() {
        const logDir = path.dirname(this.config.logFile);
        const narrativeDir = path.dirname(this.config.narrativeFile);
        
        try {
            await fs.mkdir(logDir, { recursive: true });
            await fs.mkdir(narrativeDir, { recursive: true });
        } catch (error) {
            console.error('Failed to create log directories:', error);
        }
    }
    
    setupCronJobs() {
        console.log('⏰ Setting up cron jobs...');
        
        // Every minute - Quick price check
        this.cronJobs.set('minute', cron.schedule('* * * * *', async () => {
            console.log('⏱️ Running 1-minute price check...');
            await this.fetchCryptoPrices(['btc', 'eth', 'sol']);
        }));
        
        // Every 5 minutes - Full crypto update
        this.cronJobs.set('5minutes', cron.schedule('*/5 * * * *', async () => {
            console.log('⏱️ Running 5-minute full crypto update...');
            await this.fetchAllCryptoPrices();
        }));
        
        // Every 15 minutes - Sports data update
        this.cronJobs.set('15minutes', cron.schedule('*/15 * * * *', async () => {
            console.log('⏱️ Running 15-minute sports update...');
            await this.fetchSportsData();
        }));
        
        // Every hour - Generate hourly report
        this.cronJobs.set('hourly', cron.schedule('0 * * * *', async () => {
            console.log('📊 Generating hourly report...');
            await this.generateHourlyReport();
        }));
        
        // Every day at midnight - Daily summary
        this.cronJobs.set('daily', cron.schedule('0 0 * * *', async () => {
            console.log('📅 Generating daily summary...');
            await this.generateDailySummary();
        }));
        
        // Market open/close narratives (9:30 AM and 4:00 PM EST)
        this.cronJobs.set('marketOpen', cron.schedule('30 9 * * 1-5', async () => {
            await this.generateMarketOpenNarrative();
        }));
        
        this.cronJobs.set('marketClose', cron.schedule('0 16 * * 1-5', async () => {
            await this.generateMarketCloseNarrative();
        }));
        
        console.log(`✅ ${this.cronJobs.size} cron jobs scheduled`);
    }
    
    async fetchAllPrices() {
        console.log('🔄 Fetching all prices...');
        
        await this.fetchAllCryptoPrices();
        await this.fetchSportsData();
        
        this.emit('all_prices_fetched', {
            timestamp: Date.now(),
            stats: this.stats
        });
    }
    
    async fetchCryptoPrices(symbols = ['btc', 'eth', 'sol', 'bnb', 'ada', 'doge', 'xmr']) {
        const results = [];
        
        for (const symbol of symbols) {
            try {
                const data = await this.oracle.getData('scheduler', 'crypto/coingecko', symbol);
                
                // Store in history
                if (!this.priceHistory.has(symbol)) {
                    this.priceHistory.set(symbol, []);
                }
                
                const history = this.priceHistory.get(symbol);
                history.push({
                    price: data.price,
                    timestamp: Date.now(),
                    change24h: data.changePercent24h
                });
                
                // Keep only last 100 entries
                if (history.length > 100) {
                    history.shift();
                }
                
                // Check for narrative triggers
                await this.checkPriceMovement(symbol, data);
                
                results.push({
                    symbol,
                    price: data.price,
                    change24h: data.changePercent24h,
                    volume: data.volume24h
                });
                
                this.stats.totalFetches++;
                this.stats.successfulFetches++;
                
            } catch (error) {
                console.error(`Failed to fetch ${symbol}:`, error.message);
                this.stats.totalFetches++;
                this.stats.failedFetches++;
            }
        }
        
        // Log results
        await this.logPriceFetch(results);
        
        this.emit('crypto_prices_fetched', results);
        return results;
    }
    
    async fetchAllCryptoPrices() {
        return this.fetchCryptoPrices([
            'btc', 'eth', 'sol', 'bnb', 'ada', 'doge', 
            'xmr', 'dot', 'link', 'uni', 'avax', 'matic'
        ]);
    }
    
    async fetchSportsData() {
        const teams = ['mlb:nyy', 'nba:lakers', 'nfl:patriots'];
        const results = [];
        
        for (const team of teams) {
            try {
                const data = await this.oracle.getData('scheduler', 'sports/espn', team);
                results.push({
                    team,
                    ...data
                });
                
                this.stats.totalFetches++;
                this.stats.successfulFetches++;
                
            } catch (error) {
                console.error(`Failed to fetch ${team}:`, error.message);
                this.stats.totalFetches++;
                this.stats.failedFetches++;
            }
        }
        
        this.emit('sports_data_fetched', results);
        return results;
    }
    
    async checkPriceMovement(symbol, currentData) {
        const history = this.priceHistory.get(symbol);
        if (!history || history.length < 2) return;
        
        // Compare with price from 1 hour ago (if available)
        const hourAgo = Date.now() - 3600000;
        const historicalPrice = history.find(h => h.timestamp >= hourAgo);
        
        if (historicalPrice) {
            const changePercent = ((currentData.price - historicalPrice.price) / historicalPrice.price) * 100;
            
            if (Math.abs(changePercent) >= this.narrativeThresholds.major) {
                await this.generateNarrative('major', symbol, currentData, changePercent);
            } else if (Math.abs(changePercent) >= this.narrativeThresholds.moderate) {
                await this.generateNarrative('moderate', symbol, currentData, changePercent);
            } else if (Math.abs(changePercent) >= this.narrativeThresholds.minor) {
                await this.generateNarrative('minor', symbol, currentData, changePercent);
            }
        }
    }
    
    async generateNarrative(severity, symbol, data, changePercent) {
        const narratives = {
            major: {
                positive: [
                    `🚀 BREAKING: ${symbol.toUpperCase()} ROCKETS ${changePercent.toFixed(1)}% TO $${data.price.toLocaleString()}! Bulls stampede through the Grand Exchange!`,
                    `💎 DIAMOND HANDS PREVAIL! ${symbol.toUpperCase()} surges ${changePercent.toFixed(1)}% as believers are rewarded!`,
                    `📈 MARKET ERUPTION: ${symbol.toUpperCase()} explodes higher, gaining ${changePercent.toFixed(1)}% in epic rally!`
                ],
                negative: [
                    `🔻 MARKET CRASH: ${symbol.toUpperCase()} plummets ${Math.abs(changePercent).toFixed(1)}% to $${data.price.toLocaleString()}!`,
                    `💔 BLOODBATH: ${symbol.toUpperCase()} in freefall, down ${Math.abs(changePercent).toFixed(1)}% as panic grips the market!`,
                    `⚠️ EMERGENCY: ${symbol.toUpperCase()} crashes through support, losing ${Math.abs(changePercent).toFixed(1)}%!`
                ]
            },
            moderate: {
                positive: [
                    `📊 ${symbol.toUpperCase()} climbing steadily, up ${changePercent.toFixed(1)}% to $${data.price.toLocaleString()}`,
                    `✨ Nice gains for ${symbol.toUpperCase()} holders, +${changePercent.toFixed(1)}% today`,
                    `🎯 ${symbol.toUpperCase()} hits $${data.price.toLocaleString()}, gaining ${changePercent.toFixed(1)}%`
                ],
                negative: [
                    `📉 ${symbol.toUpperCase()} sliding, down ${Math.abs(changePercent).toFixed(1)}% to $${data.price.toLocaleString()}`,
                    `⬇️ Selling pressure on ${symbol.toUpperCase()}, -${Math.abs(changePercent).toFixed(1)}% today`,
                    `🔴 ${symbol.toUpperCase()} retreats to $${data.price.toLocaleString()}, losing ${Math.abs(changePercent).toFixed(1)}%`
                ]
            },
            minor: {
                positive: [
                    `${symbol.toUpperCase()} edges up ${changePercent.toFixed(1)}% to $${data.price.toLocaleString()}`,
                    `Slight gains for ${symbol.toUpperCase()}, +${changePercent.toFixed(1)}%`,
                    `${symbol.toUpperCase()} ticks higher to $${data.price.toLocaleString()}`
                ],
                negative: [
                    `${symbol.toUpperCase()} dips ${Math.abs(changePercent).toFixed(1)}% to $${data.price.toLocaleString()}`,
                    `Minor pullback for ${symbol.toUpperCase()}, -${Math.abs(changePercent).toFixed(1)}%`,
                    `${symbol.toUpperCase()} eases to $${data.price.toLocaleString()}`
                ]
            }
        };
        
        const type = changePercent > 0 ? 'positive' : 'negative';
        const messages = narratives[severity][type];
        const narrative = messages[Math.floor(Math.random() * messages.length)];
        
        // Log narrative
        await this.logNarrative({
            timestamp: Date.now(),
            severity,
            symbol,
            price: data.price,
            changePercent,
            narrative,
            volume: data.volume24h
        });
        
        // Emit narrative event
        this.emit('narrative_generated', {
            severity,
            symbol,
            narrative,
            changePercent,
            price: data.price
        });
        
        this.stats.narrativesGenerated++;
        console.log(`📖 ${narrative}`);
        
        return narrative;
    }
    
    async generateMarketOpenNarrative() {
        const narrative = {
            timestamp: Date.now(),
            type: 'market_open',
            message: '🔔 MARKET OPEN: Trading day begins! Let the games commence!'
        };
        
        await this.logNarrative(narrative);
        this.emit('market_event', narrative);
    }
    
    async generateMarketCloseNarrative() {
        const narrative = {
            timestamp: Date.now(),
            type: 'market_close',
            message: '🔕 MARKET CLOSE: Trading day ends. Time to count the gains and losses!'
        };
        
        await this.logNarrative(narrative);
        this.emit('market_event', narrative);
    }
    
    async generateHourlyReport() {
        const report = {
            timestamp: Date.now(),
            hour: new Date().getHours(),
            stats: {
                fetches: this.stats.totalFetches,
                success: this.stats.successfulFetches,
                failed: this.stats.failedFetches,
                narratives: this.stats.narrativesGenerated
            },
            topMovers: await this.getTopMovers()
        };
        
        await this.logReport(report);
        this.emit('hourly_report', report);
        
        console.log(`📊 Hourly Report: ${report.stats.fetches} fetches, ${report.stats.narratives} narratives`);
    }
    
    async generateDailySummary() {
        const summary = {
            date: new Date().toISOString().split('T')[0],
            totalFetches: this.stats.totalFetches,
            successRate: (this.stats.successfulFetches / this.stats.totalFetches * 100).toFixed(2),
            narrativesGenerated: this.stats.narrativesGenerated,
            uptime: Date.now() - this.stats.startTime,
            topPerformers: await this.getDailyTopPerformers()
        };
        
        await this.logSummary(summary);
        this.emit('daily_summary', summary);
        
        // Reset daily stats
        this.stats.totalFetches = 0;
        this.stats.successfulFetches = 0;
        this.stats.failedFetches = 0;
        this.stats.narrativesGenerated = 0;
        
        console.log(`📅 Daily Summary: ${summary.totalFetches} fetches, ${summary.successRate}% success rate`);
    }
    
    async getTopMovers() {
        const movers = [];
        
        for (const [symbol, history] of this.priceHistory) {
            if (history.length > 0) {
                const latest = history[history.length - 1];
                movers.push({
                    symbol,
                    price: latest.price,
                    change24h: latest.change24h
                });
            }
        }
        
        return {
            gainers: movers.filter(m => m.change24h > 0).sort((a, b) => b.change24h - a.change24h).slice(0, 3),
            losers: movers.filter(m => m.change24h < 0).sort((a, b) => a.change24h - b.change24h).slice(0, 3)
        };
    }
    
    async getDailyTopPerformers() {
        const performers = [];
        
        for (const [symbol, history] of this.priceHistory) {
            if (history.length >= 2) {
                const first = history[0];
                const last = history[history.length - 1];
                const dailyChange = ((last.price - first.price) / first.price) * 100;
                
                performers.push({
                    symbol,
                    startPrice: first.price,
                    endPrice: last.price,
                    dailyChange
                });
            }
        }
        
        return performers.sort((a, b) => b.dailyChange - a.dailyChange).slice(0, 5);
    }
    
    async logPriceFetch(results) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'price_fetch',
            results: results.map(r => ({
                symbol: r.symbol,
                price: r.price,
                change24h: r.change24h
            }))
        };
        
        try {
            await fs.appendFile(
                this.config.logFile,
                JSON.stringify(logEntry) + '\n'
            );
        } catch (error) {
            console.error('Failed to write log:', error);
        }
    }
    
    async logNarrative(narrative) {
        try {
            await fs.appendFile(
                this.config.narrativeFile,
                JSON.stringify(narrative) + '\n'
            );
        } catch (error) {
            console.error('Failed to write narrative log:', error);
        }
    }
    
    async logReport(report) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'hourly_report',
            ...report
        };
        
        try {
            await fs.appendFile(
                this.config.logFile,
                JSON.stringify(logEntry) + '\n'
            );
        } catch (error) {
            console.error('Failed to write report:', error);
        }
    }
    
    async logSummary(summary) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            type: 'daily_summary',
            ...summary
        };
        
        try {
            await fs.appendFile(
                this.config.logFile,
                JSON.stringify(logEntry) + '\n'
            );
        } catch (error) {
            console.error('Failed to write summary:', error);
        }
    }
    
    // Manual fetch methods
    async fetchNow(symbols = ['btc', 'eth', 'sol']) {
        console.log('🔄 Manual fetch triggered...');
        return await this.fetchCryptoPrices(symbols);
    }
    
    async generateNarrativeNow(symbol, changePercent) {
        const severity = Math.abs(changePercent) >= 10 ? 'major' :
                       Math.abs(changePercent) >= 5 ? 'moderate' : 'minor';
        
        const data = await this.oracle.getData('manual', 'crypto/coingecko', symbol);
        return await this.generateNarrative(severity, symbol, data, changePercent);
    }
    
    // Cleanup
    stop() {
        console.log('🛑 Stopping scheduled price fetcher...');
        
        for (const [name, job] of this.cronJobs) {
            job.stop();
            console.log(`   Stopped ${name} job`);
        }
        
        this.emit('stopped');
    }
    
    getStatistics() {
        return {
            ...this.stats,
            uptime: Date.now() - this.stats.startTime,
            successRate: this.stats.totalFetches > 0 ? 
                (this.stats.successfulFetches / this.stats.totalFetches * 100).toFixed(2) + '%' : 
                '0%',
            cronJobs: this.cronJobs.size,
            priceHistorySize: this.priceHistory.size
        };
    }
}

module.exports = ScheduledPriceFetcher;

// Run if executed directly
if (require.main === module) {
    const fetcher = new ScheduledPriceFetcher();
    
    // Example: Manual fetch every 30 seconds for demo
    setInterval(async () => {
        console.log('\n📊 Demo: Fetching top cryptos...');
        await fetcher.fetchNow(['btc', 'eth', 'sol']);
    }, 30000);
    
    // Show stats every minute
    setInterval(() => {
        console.log('\n📈 Fetcher Statistics:', fetcher.getStatistics());
    }, 60000);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down...');
        fetcher.stop();
        process.exit(0);
    });
}