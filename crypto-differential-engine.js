// Live Crypto Differential Engine - Bloomberg/Citadel Style
// Real-time ETH/BTC/XMR arbitrage across Kraken, Coinbase, Binance

const WebSocket = require('ws');
const https = require('https');
const EventEmitter = require('events');

class CryptoDifferentialEngine extends EventEmitter {
    constructor() {
        super();
        
        this.exchanges = {
            kraken: {
                name: 'Kraken',
                url: 'https://api.kraken.com/0/public/Ticker',
                wsUrl: 'wss://ws.kraken.com',
                symbols: { 'BTC': 'XBTUSD', 'ETH': 'ETHUSD', 'XMR': 'XMRUSD' },
                color: '#5741D9'
            },
            coinbase: {
                name: 'Coinbase Pro',
                url: 'https://api.exchange.coinbase.com/products',
                wsUrl: 'wss://ws-feed.exchange.coinbase.com',
                symbols: { 'BTC': 'BTC-USD', 'ETH': 'ETH-USD', 'XMR': 'XMR-USD' },
                color: '#0052FF'
            },
            binance: {
                name: 'Binance',
                url: 'https://api.binance.com/api/v3/ticker/price',
                wsUrl: 'wss://stream.binance.com:9443/ws',
                symbols: { 'BTC': 'BTCUSDT', 'ETH': 'ETHUSDT', 'XMR': 'XMRUSDT' },
                color: '#F0B90B'
            }
        };
        
        this.prices = {
            kraken: { BTC: 0, ETH: 0, XMR: 0, timestamp: 0 },
            coinbase: { BTC: 0, ETH: 0, XMR: 0, timestamp: 0 },
            binance: { BTC: 0, ETH: 0, XMR: 0, timestamp: 0 }
        };
        
        this.arbitrageOpportunities = [];
        this.wsConnections = new Map();
        this.updateInterval = null;
        
        // WebSocket server for broadcasting to frontend
        this.wss = new WebSocket.Server({ port: 47002 });
        this.clients = new Set();
        
        console.log('💰 Crypto Differential Engine initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Setup WebSocket server
        this.wss.on('connection', (ws) => {
            console.log('📊 Trading client connected');
            this.clients.add(ws);
            
            // Send initial data
            ws.send(JSON.stringify({
                type: 'init',
                exchanges: Object.keys(this.exchanges),
                symbols: ['BTC', 'ETH', 'XMR'],
                timestamp: Date.now()
            }));
            
            ws.on('close', () => {
                this.clients.delete(ws);
            });
        });
        
        // Start data fetching
        await this.startDataFeeds();
        
        // Calculate differentials every second
        this.updateInterval = setInterval(() => {
            this.calculateDifferentials();
        }, 1000);
        
        console.log('✅ Crypto engine ready - Broadcasting on ws://localhost:47002');
    }
    
    async startDataFeeds() {
        // Start REST API polling for reliable data
        setInterval(() => this.fetchKrakenData(), 2000);
        setInterval(() => this.fetchCoinbaseData(), 2000);
        setInterval(() => this.fetchBinanceData(), 2000);
        
        // Also setup WebSocket feeds for real-time updates
        this.setupKrakenWS();
        this.setupCoinbaseWS();
        this.setupBinanceWS();
    }
    
    async fetchKrakenData() {
        try {
            const symbols = ['XBTUSD', 'ETHUSD', 'XMRUSD'];
            const url = `https://api.kraken.com/0/public/Ticker?pair=${symbols.join(',')}`;
            
            const data = await this.httpGet(url);
            const parsed = JSON.parse(data);
            
            if (parsed.result) {
                this.prices.kraken.BTC = parseFloat(parsed.result.XXBTZUSD?.c?.[0] || 0);
                this.prices.kraken.ETH = parseFloat(parsed.result.XETHZUSD?.c?.[0] || 0);
                this.prices.kraken.XMR = parseFloat(parsed.result.XXMRZUSD?.c?.[0] || 0);
                this.prices.kraken.timestamp = Date.now();
                
                this.broadcast({
                    type: 'price_update',
                    exchange: 'kraken',
                    prices: this.prices.kraken
                });
            }
        } catch (error) {
            console.error('Kraken fetch error:', error.message);
        }
    }
    
    async fetchCoinbaseData() {
        try {
            const symbols = ['BTC-USD', 'ETH-USD', 'XMR-USD'];
            
            for (const symbol of symbols) {
                const url = `https://api.exchange.coinbase.com/products/${symbol}/ticker`;
                const data = await this.httpGet(url);
                const parsed = JSON.parse(data);
                
                if (parsed.price) {
                    const coin = symbol.split('-')[0];
                    this.prices.coinbase[coin] = parseFloat(parsed.price);
                }
            }
            
            this.prices.coinbase.timestamp = Date.now();
            
            this.broadcast({
                type: 'price_update',
                exchange: 'coinbase',
                prices: this.prices.coinbase
            });
            
        } catch (error) {
            console.error('Coinbase fetch error:', error.message);
        }
    }
    
    async fetchBinanceData() {
        try {
            const url = 'https://api.binance.com/api/v3/ticker/price';
            const data = await this.httpGet(url);
            const parsed = JSON.parse(data);
            
            const symbolMap = { 'BTCUSDT': 'BTC', 'ETHUSDT': 'ETH', 'XMRUSDT': 'XMR' };
            
            parsed.forEach(ticker => {
                const coin = symbolMap[ticker.symbol];
                if (coin) {
                    this.prices.binance[coin] = parseFloat(ticker.price);
                }
            });
            
            this.prices.binance.timestamp = Date.now();
            
            this.broadcast({
                type: 'price_update',
                exchange: 'binance',
                prices: this.prices.binance
            });
            
        } catch (error) {
            console.error('Binance fetch error:', error.message);
        }
    }
    
    setupKrakenWS() {
        const ws = new WebSocket('wss://ws.kraken.com');
        
        ws.on('open', () => {
            console.log('🔌 Kraken WebSocket connected');
            ws.send(JSON.stringify({
                event: 'subscribe',
                pair: ['XBT/USD', 'ETH/USD', 'XMR/USD'],
                subscription: { name: 'ticker' }
            }));
        });
        
        ws.on('message', (data) => {
            try {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed) && parsed[2] === 'ticker') {
                    // Real-time ticker update
                    const tickerData = parsed[1];
                    const pair = parsed[3];
                    
                    if (tickerData.c) {
                        const price = parseFloat(tickerData.c[0]);
                        const coin = this.mapKrakenPair(pair);
                        
                        if (coin) {
                            this.prices.kraken[coin] = price;
                            this.prices.kraken.timestamp = Date.now();
                        }
                    }
                }
            } catch (error) {
                // Ignore parse errors
            }
        });
        
        this.wsConnections.set('kraken', ws);
    }
    
    setupCoinbaseWS() {
        const ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
        
        ws.on('open', () => {
            console.log('🔌 Coinbase WebSocket connected');
            ws.send(JSON.stringify({
                type: 'subscribe',
                channels: ['ticker'],
                product_ids: ['BTC-USD', 'ETH-USD', 'XMR-USD']
            }));
        });
        
        ws.on('message', (data) => {
            try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'ticker' && parsed.price) {
                    const coin = parsed.product_id.split('-')[0];
                    this.prices.coinbase[coin] = parseFloat(parsed.price);
                    this.prices.coinbase.timestamp = Date.now();
                }
            } catch (error) {
                // Ignore parse errors
            }
        });
        
        this.wsConnections.set('coinbase', ws);
    }
    
    setupBinanceWS() {
        const streams = ['btcusdt@ticker', 'ethusdt@ticker', 'xmrusdt@ticker'];
        const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams.join('/')}`;
        
        const ws = new WebSocket(wsUrl);
        
        ws.on('open', () => {
            console.log('🔌 Binance WebSocket connected');
        });
        
        ws.on('message', (data) => {
            try {
                const parsed = JSON.parse(data);
                if (parsed.data && parsed.data.c) {
                    const symbol = parsed.data.s;
                    const price = parseFloat(parsed.data.c);
                    
                    const symbolMap = { 'BTCUSDT': 'BTC', 'ETHUSDT': 'ETH', 'XMRUSDT': 'XMR' };
                    const coin = symbolMap[symbol];
                    
                    if (coin) {
                        this.prices.binance[coin] = price;
                        this.prices.binance.timestamp = Date.now();
                    }
                }
            } catch (error) {
                // Ignore parse errors
            }
        });
        
        this.wsConnections.set('binance', ws);
    }
    
    mapKrakenPair(pair) {
        const mapping = {
            'XBT/USD': 'BTC',
            'ETH/USD': 'ETH', 
            'XMR/USD': 'XMR'
        };
        return mapping[pair];
    }
    
    calculateDifferentials() {
        const coins = ['BTC', 'ETH', 'XMR'];
        const exchanges = ['kraken', 'coinbase', 'binance'];
        
        this.arbitrageOpportunities = [];
        
        coins.forEach(coin => {
            const prices = exchanges.map(ex => ({
                exchange: ex,
                price: this.prices[ex][coin],
                timestamp: this.prices[ex].timestamp
            })).filter(p => p.price > 0);
            
            if (prices.length >= 2) {
                // Find min and max prices
                const sorted = prices.sort((a, b) => a.price - b.price);
                const min = sorted[0];
                const max = sorted[sorted.length - 1];
                
                const spreadPct = ((max.price - min.price) / min.price) * 100;
                const spreadUsd = max.price - min.price;
                
                if (spreadPct > 0.1) { // Only show opportunities > 0.1%
                    this.arbitrageOpportunities.push({
                        coin,
                        buyExchange: min.exchange,
                        sellExchange: max.exchange,
                        buyPrice: min.price,
                        sellPrice: max.price,
                        spreadPct: spreadPct.toFixed(3),
                        spreadUsd: spreadUsd.toFixed(2),
                        volume: this.calculateMaxVolume(coin, min.exchange, max.exchange),
                        profit: this.calculateProfit(spreadUsd, 1), // Profit for 1 unit
                        timestamp: Date.now()
                    });
                }
            }
        });
        
        // Broadcast differentials
        this.broadcast({
            type: 'differentials',
            opportunities: this.arbitrageOpportunities,
            summary: {
                totalOpportunities: this.arbitrageOpportunities.length,
                maxSpread: Math.max(...this.arbitrageOpportunities.map(o => parseFloat(o.spreadPct)), 0),
                totalPotentialProfit: this.arbitrageOpportunities.reduce((sum, o) => sum + parseFloat(o.profit), 0)
            }
        });
        
        // Also broadcast current price matrix
        this.broadcast({
            type: 'price_matrix',
            matrix: this.prices,
            timestamp: Date.now()
        });
    }
    
    calculateMaxVolume(coin, buyExchange, sellExchange) {
        // Simplified volume calculation
        const baseVolumes = { BTC: 10, ETH: 100, XMR: 50 };
        return baseVolumes[coin] || 1;
    }
    
    calculateProfit(spreadUsd, volume) {
        // Simple profit calculation (spread * volume - fees)
        const fees = spreadUsd * 0.002; // 0.2% total fees
        return ((spreadUsd * volume) - fees).toFixed(2);
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
            https.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        });
    }
    
    close() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        this.wsConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        });
        
        if (this.wss) {
            this.wss.close();
        }
    }
}

module.exports = CryptoDifferentialEngine;

// Start if run directly
if (require.main === module) {
    new CryptoDifferentialEngine();
}