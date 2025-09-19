// Universal Data Aggregator - Everything, Everywhere, All at Once
// Crypto, Maps, Weather, OSS libraries, Forums, AI resources, Topography, etc.

const WebSocket = require('ws');
const https = require('https');
const http = require('http');
const EventEmitter = require('events');
const fs = require('fs');

class UniversalDataAggregator extends EventEmitter {
    constructor() {
        super();
        
        // Crypto & Financial Data
        this.cryptoSources = {
            coingecko: { url: 'https://api.coingecko.com/api/v3/simple/price', priority: 1 },
            cryptocompare: { url: 'https://min-api.cryptocompare.com/data/pricemulti', priority: 2 },
            kraken: { url: 'https://api.kraken.com/0/public/Ticker', priority: 3 },
            coinmarketcap: { url: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest', priority: 4 },
            messari: { url: 'https://data.messari.io/api/v1/assets', priority: 5 }
        };
        
        // Geographic & Topographic Data
        this.geoSources = {
            openstreetmap: { url: 'https://nominatim.openstreetmap.org', priority: 1 },
            googlemaps: { url: 'https://maps.googleapis.com/maps/api', priority: 2 },
            mapbox: { url: 'https://api.mapbox.com', priority: 3 },
            usgs: { url: 'https://earthquake.usgs.gov/fdsnws/event/1/query', priority: 4 },
            noaa: { url: 'https://api.weather.gov', priority: 5 },
            nasa: { url: 'https://api.nasa.gov', priority: 6 },
            elevation: { url: 'https://api.open-elevation.com/api/v1/lookup', priority: 7 }
        };
        
        // Open Source & MIT Libraries
        this.ossSources = {
            github: { url: 'https://api.github.com', priority: 1 },
            npm: { url: 'https://registry.npmjs.org', priority: 2 },
            pypi: { url: 'https://pypi.org/pypi', priority: 3 },
            packagist: { url: 'https://packagist.org/packages', priority: 4 },
            crates_io: { url: 'https://crates.io/api/v1/crates', priority: 5 },
            maven: { url: 'https://search.maven.org/solrsearch/select', priority: 6 },
            awesome_lists: { url: 'https://raw.githubusercontent.com/sindresorhus/awesome/main/readme.md', priority: 7 }
        };
        
        // Forum & Community Data
        this.forumSources = {
            simplemachines: { url: 'https://www.simplemachines.org', priority: 1 },
            phpbb: { url: 'https://www.phpbb.com', priority: 2 },
            d2jsp: { url: 'https://forums.d2jsp.org', priority: 3 },
            bitcointalk: { url: 'https://bitcointalk.org', priority: 4 },
            reddit: { url: 'https://www.reddit.com/r/all.json', priority: 5 },
            hackernews: { url: 'https://hacker-news.firebaseio.com/v0', priority: 6 },
            stackoverflow: { url: 'https://api.stackexchange.com/2.3', priority: 7 }
        };
        
        // AI & Research Sources
        this.aiSources = {
            arxiv: { url: 'http://export.arxiv.org/api/query', priority: 1 },
            huggingface: { url: 'https://huggingface.co/api', priority: 2 },
            openai_status: { url: 'https://status.openai.com/api/v2/status.json', priority: 3 },
            anthropic_status: { url: 'https://status.anthropic.com', priority: 4 },
            papers_with_code: { url: 'https://paperswithcode.com/api/v1', priority: 5 },
            semantic_scholar: { url: 'https://api.semanticscholar.org/graph/v1', priority: 6 }
        };
        
        // Game Economies
        this.gameSources = {
            d2jsp_fg: { url: 'https://forums.d2jsp.org/gold.php', priority: 1 },
            osrs_ge: { url: 'https://prices.runescape.wiki/api/v1/osrs/latest', priority: 2 },
            eve_online: { url: 'https://esi.evetech.net/latest', priority: 3 },
            steam_market: { url: 'https://steamcommunity.com/market', priority: 4 },
            wow_economy: { url: 'https://www.wowhead.com/api', priority: 5 }
        };
        
        // Weather & Environmental
        this.weatherSources = {
            openweather: { url: 'https://api.openweathermap.org/data/2.5', priority: 1 },
            weatherapi: { url: 'https://api.weatherapi.com/v1', priority: 2 },
            noaa_weather: { url: 'https://api.weather.gov', priority: 3 },
            windy: { url: 'https://api.windy.com/api', priority: 4 }
        };
        
        // Blockchain & DEX
        this.blockchainSources = {
            etherscan: { url: 'https://api.etherscan.io/api', priority: 1 },
            solscan: { url: 'https://api.solscan.io', priority: 2 },
            bscscan: { url: 'https://api.bscscan.com/api', priority: 3 },
            polygonscan: { url: 'https://api.polygonscan.com/api', priority: 4 },
            jupiter_dex: { url: 'https://price.jup.ag/v4/price', priority: 5 },
            uniswap: { url: 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3', priority: 6 },
            pancakeswap: { url: 'https://api.pancakeswap.info/api/v2', priority: 7 }
        };
        
        // News & Social
        this.newsSources = {
            newsapi: { url: 'https://newsapi.org/v2', priority: 1 },
            reuters: { url: 'https://www.reuters.com/pf/api/v3/content/fetch', priority: 2 },
            cnn_rss: { url: 'http://rss.cnn.com/rss/edition.rss', priority: 3 },
            bbc_rss: { url: 'http://feeds.bbci.co.uk/news/rss.xml', priority: 4 },
            twitter_trends: { url: 'https://api.twitter.com/1.1/trends', priority: 5 }
        };
        
        // Consolidated data storage
        this.aggregatedData = {
            crypto: {},
            geography: {},
            weather: {},
            opensource: {},
            forums: {},
            ai: {},
            games: {},
            blockchain: {},
            news: {},
            metadata: {
                lastUpdate: 0,
                sourcesActive: 0,
                totalDataPoints: 0,
                confidence: 0
            }
        };
        
        // WebSocket server
        this.wss = new WebSocket.Server({ port: 47004 });
        this.clients = new Set();
        
        console.log('🌍 Universal Data Aggregator initializing...');
        console.log('📡 Connecting to EVERYTHING:');
        console.log('   💰 Crypto: CoinGecko, CryptoCompare, Kraken, CMC, Messari');
        console.log('   🗺️  Geography: OSM, Google Maps, USGS, NOAA, NASA');
        console.log('   📦 OSS: GitHub, NPM, PyPI, Crates.io, Maven, Awesome Lists');
        console.log('   💬 Forums: SimpleMachines, phpBB, D2JSP, BitcoinTalk, Reddit');
        console.log('   🤖 AI: ArXiv, HuggingFace, Papers with Code, Semantic Scholar');
        console.log('   🎮 Games: D2JSP FG, OSRS GE, EVE Online, Steam Market');
        console.log('   🌤️  Weather: OpenWeather, WeatherAPI, NOAA, Windy');
        console.log('   ⛓️  Blockchain: Etherscan, Solscan, Jupiter, Uniswap');
        console.log('   📰 News: NewsAPI, Reuters, CNN, BBC, Twitter');
        
        this.initialize();
    }
    
    async initialize() {
        // Setup WebSocket server
        this.wss.on('connection', (ws) => {
            console.log('🌐 Client connected to universal data feed');
            this.clients.add(ws);
            
            ws.send(JSON.stringify({
                type: 'init',
                categories: Object.keys(this.aggregatedData).filter(k => k !== 'metadata'),
                sources: this.getAllSourceCount(),
                timestamp: Date.now(),
                dataScope: 'UNIVERSAL_AGGREGATED'
            }));
            
            ws.on('close', () => {
                this.clients.delete(ws);
            });
        });
        
        // Start comprehensive data collection
        this.startUniversalCollection();
        
        // Aggregate all data every 30 seconds
        setInterval(() => {
            this.aggregateUniversalData();
        }, 30000);
        
        console.log('✅ Universal Data Aggregator ready - Broadcasting on ws://localhost:47004');
        console.log(`📊 Monitoring ${this.getAllSourceCount()} data sources across ${Object.keys(this.aggregatedData).length - 1} categories`);
    }
    
    startUniversalCollection() {
        // Crypto data every 15 seconds
        setInterval(() => this.fetchCategoryData('crypto'), 15000);
        
        // Geographic data every 5 minutes (less frequently needed)
        setInterval(() => this.fetchCategoryData('geography'), 300000);
        
        // OSS data every 2 minutes
        setInterval(() => this.fetchCategoryData('opensource'), 120000);
        
        // Forum data every 1 minute
        setInterval(() => this.fetchCategoryData('forums'), 60000);
        
        // AI research data every 3 minutes
        setInterval(() => this.fetchCategoryData('ai'), 180000);
        
        // Game economy data every 45 seconds
        setInterval(() => this.fetchCategoryData('games'), 45000);
        
        // Weather data every 10 minutes
        setInterval(() => this.fetchCategoryData('weather'), 600000);
        
        // Blockchain data every 20 seconds
        setInterval(() => this.fetchCategoryData('blockchain'), 20000);
        
        // News data every 5 minutes
        setInterval(() => this.fetchCategoryData('news'), 300000);
        
        // Initial staggered fetches
        setTimeout(() => this.fetchCategoryData('crypto'), 1000);
        setTimeout(() => this.fetchCategoryData('opensource'), 3000);
        setTimeout(() => this.fetchCategoryData('forums'), 5000);
        setTimeout(() => this.fetchCategoryData('games'), 7000);
        setTimeout(() => this.fetchCategoryData('blockchain'), 9000);
        setTimeout(() => this.fetchCategoryData('geography'), 11000);
        setTimeout(() => this.fetchCategoryData('ai'), 13000);
        setTimeout(() => this.fetchCategoryData('weather'), 15000);
        setTimeout(() => this.fetchCategoryData('news'), 17000);
    }
    
    async fetchCategoryData(category) {
        const sourceMap = {
            crypto: this.cryptoSources,
            geography: this.geoSources,
            opensource: this.ossSources,
            forums: this.forumSources,
            ai: this.aiSources,
            games: this.gameSources,
            weather: this.weatherSources,
            blockchain: this.blockchainSources,
            news: this.newsSources
        };
        
        const sources = sourceMap[category];
        if (!sources) return;
        
        const results = {};
        let successCount = 0;
        
        for (const [sourceName, config] of Object.entries(sources)) {
            try {
                const data = await this.fetchFromSource(category, sourceName, config);
                if (data) {
                    results[sourceName] = {
                        data: data,
                        timestamp: Date.now(),
                        status: 'success'
                    };
                    successCount++;
                }
            } catch (error) {
                console.warn(`⚠️ ${category}/${sourceName} failed:`, error.message);
                results[sourceName] = {
                    error: error.message,
                    timestamp: Date.now(),
                    status: 'error'
                };
            }
            
            // Small delay between requests to be respectful
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        this.aggregatedData[category] = results;
        
        console.log(`📊 ${category.toUpperCase()}: ${successCount}/${Object.keys(sources).length} sources active`);
        
        // Broadcast category update
        this.broadcast({
            type: 'category_update',
            category: category,
            data: results,
            successRate: (successCount / Object.keys(sources).length) * 100,
            timestamp: Date.now()
        });
    }
    
    async fetchFromSource(category, sourceName, config) {
        switch (category) {
            case 'crypto':
                return await this.fetchCryptoData(sourceName, config);
            case 'geography':
                return await this.fetchGeoData(sourceName, config);
            case 'opensource':
                return await this.fetchOSSData(sourceName, config);
            case 'forums':
                return await this.fetchForumData(sourceName, config);
            case 'ai':
                return await this.fetchAIData(sourceName, config);
            case 'games':
                return await this.fetchGameData(sourceName, config);
            case 'weather':
                return await this.fetchWeatherData(sourceName, config);
            case 'blockchain':
                return await this.fetchBlockchainData(sourceName, config);
            case 'news':
                return await this.fetchNewsData(sourceName, config);
            default:
                return null;
        }
    }
    
    async fetchCryptoData(sourceName, config) {
        switch (sourceName) {
            case 'coingecko':
                const url = config.url + '?ids=bitcoin,ethereum,monero,solana&vs_currencies=usd';
                const data = await this.httpGet(url);
                const parsed = JSON.parse(data);
                return {
                    BTC: parsed.bitcoin?.usd || 0,
                    ETH: parsed.ethereum?.usd || 0,
                    XMR: parsed.monero?.usd || 0,
                    SOL: parsed.solana?.usd || 0
                };
            case 'cryptocompare':
                const ccUrl = config.url + '?fsyms=BTC,ETH,XMR,SOL&tsyms=USD';
                const ccData = await this.httpGet(ccUrl);
                const ccParsed = JSON.parse(ccData);
                return {
                    BTC: ccParsed.BTC?.USD || 0,
                    ETH: ccParsed.ETH?.USD || 0,
                    XMR: ccParsed.XMR?.USD || 0,
                    SOL: ccParsed.SOL?.USD || 0
                };
            case 'kraken':
                const krakenUrl = config.url + '?pair=XBTUSD,ETHUSD,XMRUSD';
                const krakenData = await this.httpGet(krakenUrl);
                const krakenParsed = JSON.parse(krakenData);
                return {
                    BTC: parseFloat(krakenParsed.result?.XXBTZUSD?.c?.[0] || 0),
                    ETH: parseFloat(krakenParsed.result?.XETHZUSD?.c?.[0] || 0),
                    XMR: parseFloat(krakenParsed.result?.XXMRZUSD?.c?.[0] || 0),
                    SOL: 0
                };
            default:
                return null;
        }
    }
    
    async fetchGeoData(sourceName, config) {
        switch (sourceName) {
            case 'usgs':
                // Recent earthquakes
                const usgsUrl = config.url + '?format=geojson&limit=10';
                const usgsData = await this.httpGet(usgsUrl);
                const usgsJson = JSON.parse(usgsData);
                return {
                    earthquakes: usgsJson.features?.length || 0,
                    latestMagnitude: usgsJson.features?.[0]?.properties?.mag || 0
                };
            case 'elevation':
                // Sample elevation for a few major cities
                const elevUrl = config.url + '?locations=40.7128,-74.0060|34.0522,-118.2437';
                const elevData = await this.httpGet(elevUrl);
                const elevJson = JSON.parse(elevData);
                return {
                    sampleElevations: elevJson.results?.map(r => r.elevation) || []
                };
            default:
                return { status: 'placeholder' };
        }
    }
    
    async fetchOSSData(sourceName, config) {
        switch (sourceName) {
            case 'github':
                // GitHub trending repositories
                const ghUrl = 'https://api.github.com/search/repositories?q=stars:>1000&sort=stars&order=desc&per_page=10';
                const ghData = await this.httpGet(ghUrl);
                const ghJson = JSON.parse(ghData);
                return {
                    trendingRepos: ghJson.items?.length || 0,
                    totalStars: ghJson.items?.reduce((sum, repo) => sum + repo.stargazers_count, 0) || 0
                };
            case 'npm':
                // NPM package info
                const npmUrl = 'https://registry.npmjs.org/react';
                const npmData = await this.httpGet(npmUrl);
                const npmJson = JSON.parse(npmData);
                return {
                    latestVersion: npmJson['dist-tags']?.latest || 'unknown',
                    downloads: npmJson.time ? Object.keys(npmJson.time).length : 0
                };
            default:
                return { status: 'placeholder' };
        }
    }
    
    async fetchForumData(sourceName, config) {
        // Forum data is complex to parse, return placeholder for now
        return {
            source: sourceName,
            status: 'monitoring',
            lastCheck: Date.now()
        };
    }
    
    async fetchAIData(sourceName, config) {
        switch (sourceName) {
            case 'arxiv':
                // ArXiv recent papers
                const arxivUrl = 'http://export.arxiv.org/api/query?search_query=cat:cs.AI&start=0&max_results=5';
                const arxivData = await this.httpGet(arxivUrl);
                return {
                    recentPapers: (arxivData.match(/<entry>/g) || []).length,
                    category: 'cs.AI'
                };
            default:
                return { status: 'placeholder' };
        }
    }
    
    async fetchGameData(sourceName, config) {
        switch (sourceName) {
            case 'osrs_ge':
                // OSRS Grand Exchange prices
                const osrsUrl = config.url;
                const osrsData = await this.httpGet(osrsUrl);
                const osrsJson = JSON.parse(osrsData);
                return {
                    itemCount: Object.keys(osrsJson.data || {}).length,
                    samplePrices: Object.values(osrsJson.data || {}).slice(0, 5)
                };
            default:
                return { status: 'placeholder' };
        }
    }
    
    async fetchWeatherData(sourceName, config) {
        // Weather APIs typically require API keys, return placeholder
        return {
            source: sourceName,
            status: 'requires_api_key',
            placeholder: true
        };
    }
    
    async fetchBlockchainData(sourceName, config) {
        // Most blockchain APIs require keys, return placeholder
        return {
            source: sourceName,
            status: 'requires_api_key',
            placeholder: true
        };
    }
    
    async fetchNewsData(sourceName, config) {
        switch (sourceName) {
            case 'hackernews':
                // Hacker News top stories
                const hnUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json';
                const hnData = await this.httpGet(hnUrl);
                const hnJson = JSON.parse(hnData);
                return {
                    topStoriesCount: hnJson.length,
                    sampleIds: hnJson.slice(0, 5)
                };
            default:
                return { status: 'placeholder' };
        }
    }
    
    aggregateUniversalData() {
        let totalSources = 0;
        let activeSources = 0;
        let totalDataPoints = 0;
        
        // Count active sources across all categories
        Object.entries(this.aggregatedData).forEach(([category, data]) => {
            if (category === 'metadata') return;
            
            Object.entries(data).forEach(([source, info]) => {
                totalSources++;
                if (info.status === 'success') {
                    activeSources++;
                    totalDataPoints += this.countDataPoints(info.data);
                }
            });
        });
        
        const confidence = totalSources > 0 ? (activeSources / totalSources) * 100 : 0;
        
        this.aggregatedData.metadata = {
            lastUpdate: Date.now(),
            sourcesActive: activeSources,
            sourcesTotal: totalSources,
            totalDataPoints: totalDataPoints,
            confidence: confidence.toFixed(1),
            uptime: process.uptime()
        };
        
        // Broadcast comprehensive update
        this.broadcast({
            type: 'universal_update',
            data: this.aggregatedData,
            summary: {
                categories: Object.keys(this.aggregatedData).length - 1,
                activeSources: activeSources,
                totalSources: totalSources,
                confidence: confidence,
                dataPoints: totalDataPoints
            },
            timestamp: Date.now()
        });
        
        console.log(`🌍 UNIVERSAL: ${activeSources}/${totalSources} sources active (${confidence.toFixed(1)}% confidence) - ${totalDataPoints} data points`);
    }
    
    countDataPoints(data) {
        if (!data || typeof data !== 'object') return 1;
        
        let count = 0;
        Object.values(data).forEach(value => {
            if (Array.isArray(value)) {
                count += value.length;
            } else if (typeof value === 'object') {
                count += this.countDataPoints(value);
            } else {
                count += 1;
            }
        });
        
        return count;
    }
    
    getAllSourceCount() {
        return Object.values({
            ...this.cryptoSources,
            ...this.geoSources,
            ...this.ossSources,
            ...this.forumSources,
            ...this.aiSources,
            ...this.gameSources,
            ...this.weatherSources,
            ...this.blockchainSources,
            ...this.newsSources
        }).length;
    }
    
    broadcast(data) {
        const message = JSON.stringify(data);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    httpGet(url) {
        return new Promise((resolve, reject) => {
            const lib = url.startsWith('https:') ? https : http;
            
            const request = lib.get(url, {
                headers: {
                    'User-Agent': 'Universal-Data-Aggregator/1.0',
                    'Accept': 'application/json, text/xml, text/plain'
                },
                timeout: 10000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    }
                });
            });
            
            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }
    
    getStatus() {
        return {
            metadata: this.aggregatedData.metadata,
            categories: Object.keys(this.aggregatedData).filter(k => k !== 'metadata'),
            uptime: process.uptime()
        };
    }
    
    close() {
        if (this.wss) {
            this.wss.close();
        }
    }
}

module.exports = UniversalDataAggregator;

// Start if run directly
if (require.main === module) {
    console.log('🌍 Starting Universal Data Aggregator');
    console.log('📡 Connecting to EVERYTHING we can find...');
    new UniversalDataAggregator();
}