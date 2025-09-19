#!/usr/bin/env node
// algo-trading-unified-layer.js - Complete algo trading integration with visualization
// Connects all trading platforms, charts, and visual components

console.log('📈 Algo Trading Unified Layer - Scaling the visualization empire');

const EventEmitter = require('events');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

class AlgoTradingUnifiedLayer extends EventEmitter {
    constructor() {
        super();
        
        // Core configuration
        this.config = {
            // Trading platforms integration
            platforms: {
                quantman: {
                    name: 'QuantMan',
                    url: 'https://www.quantman.in',
                    features: ['backtesting', 'indicators', 'automation'],
                    api: 'https://api.quantman.in/v1'
                },
                algosoc: {
                    name: 'AlgoSoc',
                    url: 'https://www.algosoc.com',
                    features: ['social-trading', 'copy-trading', 'signals'],
                    api: 'https://api.algosoc.com/v1'
                },
                algobot: {
                    name: 'AlgoBot HK',
                    url: 'https://algobot.hk',
                    features: ['crypto', 'forex', 'stocks'],
                    certificate: 'MIIGvDCCBaSgAwIBAgII...' // From the cert you provided
                }
            },
            
            // Visual components from existing system
            visualComponents: {
                tradingCharts: {
                    path: 'web-interface/agent-trading-charts.html',
                    port: 3335,
                    features: ['candlestick', 'indicators', 'real-time']
                },
                shipRekt: {
                    path: 'shiprekt-charting-game-engine.js',
                    port: 3336,
                    features: ['competitive', 'pattern-detection', 'gaming']
                },
                tickerTape: {
                    path: 'LIVE-TICKER-TAPE-TRADING-FLOOR.js',
                    port: 3334,
                    features: ['central-hub', 'real-time-feeds', 'effects']
                },
                revenueVerification: {
                    path: 'revenue-verification-dashboard.js',
                    port: 4269,
                    features: ['revenue-tracking', 'verification', 'rewards']
                }
            },
            
            // OSRS-style agility shortcuts
            agilityShortcuts: {
                // Trading shortcuts - quick navigation between views
                trading: {
                    'ctrl+1': { action: 'switchToChart', view: 'candlestick' },
                    'ctrl+2': { action: 'switchToChart', view: 'orderbook' },
                    'ctrl+3': { action: 'switchToChart', view: 'heatmap' },
                    'ctrl+d': { action: 'quickDeploy', target: 'algo' },
                    'ctrl+b': { action: 'quickBuy', amount: 'preset' },
                    'ctrl+s': { action: 'quickSell', amount: 'preset' }
                },
                
                // Navigation shortcuts - jump between components
                navigation: {
                    'alt+c': { action: 'jumpTo', component: 'charts' },
                    'alt+t': { action: 'jumpTo', component: 'tickerTape' },
                    'alt+g': { action: 'jumpTo', component: 'gaming' },
                    'alt+r': { action: 'jumpTo', component: 'revenue' },
                    'alt+h': { action: 'toggleHelp', overlay: true }
                },
                
                // Special moves - complex actions
                special: {
                    'ctrl+shift+m': { action: 'marketMaker', mode: 'aggressive' },
                    'ctrl+shift+a': { action: 'arbitrage', scan: 'all' },
                    'ctrl+shift+p': { action: 'patternScan', timeframe: 'multi' }
                }
            },
            
            // Chart types and indicators
            chartTypes: ['candlestick', 'line', 'area', 'heikinAshi', 'renko', 'kagi'],
            indicators: ['RSI', 'MACD', 'BB', 'EMA', 'SMA', 'VWAP', 'ATR', 'ADX'],
            
            // WebSocket configuration
            wsPort: 9998,
            httpPort: 9997
        };
        
        // Active connections
        this.connections = new Map();
        this.platformConnections = new Map();
        this.chartData = new Map();
        
        // Initialize
        this.init();
    }
    
    async init() {
        console.log('🚀 Initializing Algo Trading Unified Layer...');
        
        // Setup HTTP server
        this.setupHTTPServer();
        
        // Setup WebSocket server
        this.setupWebSocketServer();
        
        // Connect to existing components
        await this.connectExistingComponents();
        
        // Initialize platform connections
        await this.initializePlatformConnections();
        
        // Setup agility shortcuts
        this.setupAgilityShortcuts();
        
        // Start data aggregation
        this.startDataAggregation();
        
        console.log('✅ Algo Trading Unified Layer ready');
    }
    
    setupHTTPServer() {
        this.app = express();
        this.server = http.createServer(this.app);
        
        // Serve unified trading interface
        this.app.get('/', (req, res) => {
            res.send(this.generateUnifiedInterface());
        });
        
        // Platform endpoints
        Object.entries(this.config.platforms).forEach(([id, platform]) => {
            this.app.get(`/platform/${id}`, (req, res) => {
                res.json({
                    ...platform,
                    connected: this.platformConnections.has(id),
                    features: platform.features,
                    shortcuts: this.getShortcutsForPlatform(id)
                });
            });
        });
        
        // Chart data endpoint
        this.app.get('/api/chart/:symbol', (req, res) => {
            const symbol = req.params.symbol;
            const data = this.chartData.get(symbol) || this.generateMockChartData(symbol);
            res.json(data);
        });
        
        // Shortcut configuration
        this.app.get('/api/shortcuts', (req, res) => {
            res.json(this.config.agilityShortcuts);
        });
        
        this.server.listen(this.config.httpPort, () => {
            console.log(`📊 HTTP server running on port ${this.config.httpPort}`);
        });
    }
    
    setupWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            console.log(`🔌 New WebSocket connection: ${clientId}`);
            
            // Store connection
            this.connections.set(clientId, {
                ws,
                subscriptions: new Set(),
                platform: null,
                authenticated: false
            });
            
            // Handle messages
            ws.on('message', (message) => {
                this.handleWebSocketMessage(clientId, message);
            });
            
            // Handle disconnect
            ws.on('close', () => {
                console.log(`🔌 Disconnected: ${clientId}`);
                this.connections.delete(clientId);
            });
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                clientId,
                platforms: Object.keys(this.config.platforms),
                shortcuts: Object.keys(this.config.agilityShortcuts)
            }));
        });
        
        console.log(`🌐 WebSocket server running on port ${this.config.wsPort}`);
    }
    
    async connectExistingComponents() {
        console.log('🔗 Connecting to existing visual components...');
        
        // Connect to each component's WebSocket if available
        for (const [id, component] of Object.entries(this.config.visualComponents)) {
            try {
                const ws = new WebSocket(`ws://localhost:${component.port}`);
                
                ws.on('open', () => {
                    console.log(`✅ Connected to ${id} on port ${component.port}`);
                    
                    // Subscribe to data feeds
                    ws.send(JSON.stringify({
                        type: 'subscribe',
                        channels: ['prices', 'trades', 'events']
                    }));
                });
                
                ws.on('message', (data) => {
                    this.handleComponentData(id, data);
                });
                
                ws.on('error', (error) => {
                    console.log(`⚠️ Could not connect to ${id}: ${error.message}`);
                });
                
                this.platformConnections.set(id, ws);
                
            } catch (error) {
                console.log(`❌ Failed to connect to ${id}`);
            }
        }
    }
    
    async initializePlatformConnections() {
        console.log('🏦 Initializing platform connections...');
        
        // Mock connections to trading platforms
        for (const [id, platform] of Object.entries(this.config.platforms)) {
            // In production, would use actual API connections
            this.platformConnections.set(id, {
                connected: true,
                lastUpdate: Date.now(),
                mockData: true
            });
            
            console.log(`✅ Initialized connection to ${platform.name}`);
        }
    }
    
    setupAgilityShortcuts() {
        console.log('⌨️ Setting up OSRS-style agility shortcuts...');
        
        // Create shortcut handler
        this.shortcutHandler = {
            execute: (shortcut, context) => {
                const shortcuts = this.config.agilityShortcuts;
                
                // Find matching shortcut
                for (const [category, bindings] of Object.entries(shortcuts)) {
                    if (bindings[shortcut]) {
                        const action = bindings[shortcut];
                        this.executeShortcutAction(action, context);
                        return true;
                    }
                }
                
                return false;
            }
        };
        
        console.log('✅ Agility shortcuts configured');
    }
    
    executeShortcutAction(action, context) {
        console.log(`⚡ Executing shortcut action: ${action.action}`);
        
        switch (action.action) {
            case 'switchToChart':
                this.broadcastToAll({
                    type: 'switchChart',
                    view: action.view
                });
                break;
                
            case 'jumpTo':
                this.broadcastToAll({
                    type: 'navigate',
                    component: action.component
                });
                break;
                
            case 'quickBuy':
            case 'quickSell':
                this.executeQuickTrade(action.action, action.amount);
                break;
                
            case 'marketMaker':
                this.activateMarketMaker(action.mode);
                break;
                
            case 'arbitrage':
                this.scanArbitrage(action.scan);
                break;
                
            case 'patternScan':
                this.scanPatterns(action.timeframe);
                break;
        }
    }
    
    startDataAggregation() {
        console.log('📊 Starting data aggregation...');
        
        // Aggregate data from all sources
        setInterval(() => {
            this.aggregateMarketData();
            this.updateCharts();
            this.checkAlerts();
        }, 1000); // Every second
        
        // Pattern detection
        setInterval(() => {
            this.detectPatterns();
            this.findArbitrageOpportunities();
        }, 5000); // Every 5 seconds
    }
    
    aggregateMarketData() {
        // Collect data from all connected platforms
        const aggregatedData = {
            timestamp: Date.now(),
            prices: {},
            volumes: {},
            trades: []
        };
        
        // Mock data generation
        const symbols = ['BTC/USD', 'ETH/USD', 'AAPL', 'GOOGL'];
        symbols.forEach(symbol => {
            const lastPrice = this.chartData.get(symbol)?.lastPrice || 50000;
            const change = (Math.random() - 0.5) * 100;
            
            aggregatedData.prices[symbol] = lastPrice + change;
            aggregatedData.volumes[symbol] = Math.floor(Math.random() * 1000000);
        });
        
        // Broadcast to all connected clients
        this.broadcastToAll({
            type: 'marketData',
            data: aggregatedData
        });
    }
    
    updateCharts() {
        // Update chart data for all symbols
        const symbols = ['BTC/USD', 'ETH/USD', 'AAPL', 'GOOGL'];
        
        symbols.forEach(symbol => {
            const data = this.chartData.get(symbol) || {
                symbol,
                candles: [],
                lastPrice: 50000
            };
            
            // Add new candle
            const lastPrice = data.lastPrice + (Math.random() - 0.5) * 100;
            const candle = {
                timestamp: Date.now(),
                open: data.lastPrice,
                high: Math.max(data.lastPrice, lastPrice) + Math.random() * 50,
                low: Math.min(data.lastPrice, lastPrice) - Math.random() * 50,
                close: lastPrice,
                volume: Math.floor(Math.random() * 10000)
            };
            
            data.candles.push(candle);
            data.lastPrice = lastPrice;
            
            // Keep only last 100 candles
            if (data.candles.length > 100) {
                data.candles = data.candles.slice(-100);
            }
            
            this.chartData.set(symbol, data);
            
            // Calculate indicators
            const indicators = this.calculateIndicators(data.candles);
            
            // Broadcast update
            this.broadcastToAll({
                type: 'chartUpdate',
                symbol,
                candle,
                indicators
            });
        });
    }
    
    calculateIndicators(candles) {
        // Simple indicator calculations
        const closes = candles.map(c => c.close);
        
        return {
            sma20: this.calculateSMA(closes, 20),
            rsi: this.calculateRSI(closes, 14),
            macd: this.calculateMACD(closes),
            bb: this.calculateBollingerBands(closes, 20, 2)
        };
    }
    
    calculateSMA(values, period) {
        if (values.length < period) return null;
        const sum = values.slice(-period).reduce((a, b) => a + b, 0);
        return sum / period;
    }
    
    calculateRSI(closes, period = 14) {
        if (closes.length < period + 1) return 50;
        
        // Simplified RSI calculation
        let gains = 0, losses = 0;
        for (let i = closes.length - period; i < closes.length; i++) {
            const change = closes[i] - closes[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / (avgLoss || 1);
        return 100 - (100 / (1 + rs));
    }
    
    calculateMACD(closes) {
        // Simplified MACD
        const ema12 = this.calculateSMA(closes.slice(-12), 12);
        const ema26 = this.calculateSMA(closes.slice(-26), 26);
        
        return {
            macd: ema12 - ema26,
            signal: 0,
            histogram: 0
        };
    }
    
    calculateBollingerBands(closes, period = 20, stdDev = 2) {
        const sma = this.calculateSMA(closes, period);
        if (!sma) return null;
        
        const values = closes.slice(-period);
        const variance = values.reduce((sum, val) => sum + Math.pow(val - sma, 2), 0) / period;
        const std = Math.sqrt(variance);
        
        return {
            upper: sma + (std * stdDev),
            middle: sma,
            lower: sma - (std * stdDev)
        };
    }
    
    detectPatterns() {
        // Pattern detection across all symbols
        this.chartData.forEach((data, symbol) => {
            if (data.candles.length < 20) return;
            
            const patterns = [];
            
            // Detect simple patterns
            const lastCandles = data.candles.slice(-5);
            
            // Bullish engulfing
            if (lastCandles[3].close < lastCandles[3].open &&
                lastCandles[4].close > lastCandles[4].open &&
                lastCandles[4].open < lastCandles[3].close &&
                lastCandles[4].close > lastCandles[3].open) {
                patterns.push({ type: 'bullishEngulfing', strength: 0.8 });
            }
            
            // Head and shoulders (simplified)
            const highs = lastCandles.map(c => c.high);
            if (highs[1] < highs[2] && highs[3] < highs[2] && highs[0] < highs[2] && highs[4] < highs[2]) {
                patterns.push({ type: 'headAndShoulders', strength: 0.7 });
            }
            
            if (patterns.length > 0) {
                this.broadcastToAll({
                    type: 'patternDetected',
                    symbol,
                    patterns,
                    timestamp: Date.now()
                });
            }
        });
    }
    
    findArbitrageOpportunities() {
        // Find price differences across platforms
        const opportunities = [];
        
        // Mock arbitrage detection
        if (Math.random() > 0.95) {
            opportunities.push({
                symbol: 'BTC/USD',
                buyPlatform: 'quantman',
                sellPlatform: 'algosoc',
                priceDiff: Math.random() * 100,
                profitPercent: Math.random() * 2,
                timestamp: Date.now()
            });
            
            this.broadcastToAll({
                type: 'arbitrageOpportunity',
                opportunities
            });
        }
    }
    
    checkAlerts() {
        // Check for alert conditions
        this.chartData.forEach((data, symbol) => {
            const price = data.lastPrice;
            
            // Price alerts
            if (price > 51000 && symbol === 'BTC/USD') {
                this.broadcastToAll({
                    type: 'alert',
                    severity: 'info',
                    message: `${symbol} above $51,000`,
                    timestamp: Date.now()
                });
            }
            
            // RSI alerts
            const rsi = this.calculateRSI(data.candles.map(c => c.close), 14);
            if (rsi > 70) {
                this.broadcastToAll({
                    type: 'alert',
                    severity: 'warning',
                    message: `${symbol} RSI overbought (${rsi.toFixed(2)})`,
                    timestamp: Date.now()
                });
            }
        });
    }
    
    executeQuickTrade(action, amount) {
        console.log(`💰 Executing quick ${action}: ${amount}`);
        
        // Mock trade execution
        const trade = {
            id: this.generateTradeId(),
            action,
            amount: amount === 'preset' ? 0.1 : amount,
            symbol: 'BTC/USD',
            price: this.chartData.get('BTC/USD')?.lastPrice || 50000,
            timestamp: Date.now(),
            status: 'executed'
        };
        
        this.broadcastToAll({
            type: 'tradeExecuted',
            trade
        });
    }
    
    activateMarketMaker(mode) {
        console.log(`🤖 Activating market maker in ${mode} mode`);
        
        this.broadcastToAll({
            type: 'marketMakerActivated',
            mode,
            spreads: {
                tight: 0.1,
                normal: 0.25,
                wide: 0.5
            }
        });
    }
    
    scanArbitrage(scan) {
        console.log(`🔍 Scanning for arbitrage: ${scan}`);
        this.findArbitrageOpportunities();
    }
    
    scanPatterns(timeframe) {
        console.log(`📊 Scanning patterns on ${timeframe} timeframe`);
        this.detectPatterns();
    }
    
    handleWebSocketMessage(clientId, message) {
        try {
            const data = JSON.parse(message);
            const client = this.connections.get(clientId);
            
            switch (data.type) {
                case 'subscribe':
                    data.channels.forEach(channel => {
                        client.subscriptions.add(channel);
                    });
                    break;
                    
                case 'unsubscribe':
                    data.channels.forEach(channel => {
                        client.subscriptions.delete(channel);
                    });
                    break;
                    
                case 'shortcut':
                    this.shortcutHandler.execute(data.shortcut, { clientId });
                    break;
                    
                case 'authenticate':
                    // Certificate-based auth
                    if (data.certificate === this.config.platforms.algobot.certificate) {
                        client.authenticated = true;
                        client.platform = 'algobot';
                    }
                    break;
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
        }
    }
    
    handleComponentData(componentId, data) {
        // Process data from connected components
        try {
            const parsed = JSON.parse(data);
            
            // Relay to appropriate handlers
            if (parsed.type === 'priceUpdate') {
                this.updateChartData(parsed.symbol, parsed.price);
            } else if (parsed.type === 'trade') {
                this.processTrade(parsed);
            }
        } catch (error) {
            console.error(`Error processing data from ${componentId}:`, error);
        }
    }
    
    broadcastToAll(message) {
        const messageStr = JSON.stringify(message);
        
        this.connections.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(messageStr);
            }
        });
    }
    
    generateUnifiedInterface() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>📈 Algo Trading Unified Layer</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: #0a0a0a;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            overflow: hidden;
        }
        
        .main-container {
            display: grid;
            grid-template-columns: 250px 1fr 300px;
            grid-template-rows: 60px 1fr 100px;
            height: 100vh;
            gap: 1px;
            background: #333;
        }
        
        .header {
            grid-column: 1 / -1;
            background: #1a1a1a;
            display: flex;
            align-items: center;
            padding: 0 20px;
            border-bottom: 2px solid #00ff00;
        }
        
        .sidebar {
            background: #0f0f0f;
            padding: 10px;
            overflow-y: auto;
        }
        
        .main-chart {
            background: #000;
            position: relative;
            overflow: hidden;
        }
        
        .right-panel {
            background: #0f0f0f;
            padding: 10px;
            overflow-y: auto;
        }
        
        .ticker-tape {
            grid-column: 1 / -1;
            background: #1a1a1a;
            display: flex;
            align-items: center;
            overflow: hidden;
            border-top: 2px solid #00ff00;
        }
        
        canvas {
            width: 100%;
            height: 100%;
        }
        
        .shortcut-hint {
            position: fixed;
            bottom: 110px;
            right: 10px;
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
        }
        
        .platform-badge {
            display: inline-block;
            padding: 2px 8px;
            margin: 2px;
            background: #00ff00;
            color: #000;
            border-radius: 3px;
            font-size: 10px;
        }
        
        .indicator {
            margin: 5px 0;
            padding: 5px;
            background: rgba(0, 255, 0, 0.1);
            border-left: 3px solid #00ff00;
        }
        
        @keyframes flash {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
        }
        
        .alert {
            animation: flash 1s infinite;
            color: #ff0;
        }
    </style>
</head>
<body>
    <div class="main-container">
        <div class="header">
            <h1>📈 Algo Trading Unified Layer</h1>
            <div style="margin-left: auto;">
                <span class="platform-badge">QuantMan</span>
                <span class="platform-badge">AlgoSoc</span>
                <span class="platform-badge">AlgoBot HK</span>
            </div>
        </div>
        
        <div class="sidebar">
            <h3>Platforms</h3>
            <div id="platforms"></div>
            
            <h3 style="margin-top: 20px;">Indicators</h3>
            <div id="indicators">
                <div class="indicator">RSI: <span id="rsi">--</span></div>
                <div class="indicator">MACD: <span id="macd">--</span></div>
                <div class="indicator">BB: <span id="bb">--</span></div>
            </div>
            
            <h3 style="margin-top: 20px;">Patterns</h3>
            <div id="patterns"></div>
        </div>
        
        <div class="main-chart">
            <canvas id="chart"></canvas>
        </div>
        
        <div class="right-panel">
            <h3>Order Book</h3>
            <div id="orderbook"></div>
            
            <h3 style="margin-top: 20px;">Trades</h3>
            <div id="trades"></div>
            
            <h3 style="margin-top: 20px;">Alerts</h3>
            <div id="alerts"></div>
        </div>
        
        <div class="ticker-tape">
            <div id="ticker-content"></div>
        </div>
    </div>
    
    <div class="shortcut-hint">
        <b>Shortcuts:</b><br>
        Ctrl+1-3: Chart Views<br>
        Alt+C/T/G/R: Navigate<br>
        Ctrl+B/S: Quick Trade<br>
        Ctrl+Shift+M: Market Maker<br>
        Ctrl+Shift+A: Arbitrage<br>
        Alt+H: Toggle Help
    </div>
    
    <script>
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:9998');
        const canvas = document.getElementById('chart');
        const ctx = canvas.getContext('2d');
        
        // Chart data
        let chartData = [];
        let currentSymbol = 'BTC/USD';
        
        // Resize canvas
        function resizeCanvas() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        
        // WebSocket handlers
        ws.onopen = () => {
            console.log('Connected to Algo Trading Layer');
            ws.send(JSON.stringify({
                type: 'subscribe',
                channels: ['marketData', 'chartUpdate', 'alerts', 'patterns']
            }));
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMessage(data);
        };
        
        // Handle messages
        function handleMessage(data) {
            switch (data.type) {
                case 'chartUpdate':
                    updateChart(data);
                    updateIndicators(data.indicators);
                    break;
                    
                case 'alert':
                    showAlert(data);
                    break;
                    
                case 'patternDetected':
                    showPattern(data);
                    break;
                    
                case 'marketData':
                    updateTicker(data.data);
                    break;
            }
        }
        
        // Update chart
        function updateChart(data) {
            if (data.symbol !== currentSymbol) return;
            
            chartData.push(data.candle);
            if (chartData.length > 100) chartData.shift();
            
            drawChart();
        }
        
        // Draw candlestick chart
        function drawChart() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (chartData.length === 0) return;
            
            const width = canvas.width / chartData.length;
            const maxPrice = Math.max(...chartData.map(c => c.high));
            const minPrice = Math.min(...chartData.map(c => c.low));
            const priceRange = maxPrice - minPrice;
            
            chartData.forEach((candle, i) => {
                const x = i * width;
                const color = candle.close > candle.open ? '#00ff00' : '#ff0000';
                
                // Candle body
                ctx.fillStyle = color;
                const bodyHeight = Math.abs(candle.close - candle.open) / priceRange * canvas.height;
                const bodyY = (maxPrice - Math.max(candle.open, candle.close)) / priceRange * canvas.height;
                ctx.fillRect(x + width * 0.2, bodyY, width * 0.6, bodyHeight);
                
                // Wicks
                ctx.strokeStyle = color;
                ctx.beginPath();
                const highY = (maxPrice - candle.high) / priceRange * canvas.height;
                const lowY = (maxPrice - candle.low) / priceRange * canvas.height;
                ctx.moveTo(x + width * 0.5, highY);
                ctx.lineTo(x + width * 0.5, lowY);
                ctx.stroke();
            });
        }
        
        // Update indicators
        function updateIndicators(indicators) {
            if (indicators.rsi) document.getElementById('rsi').textContent = indicators.rsi.toFixed(2);
            if (indicators.macd) document.getElementById('macd').textContent = indicators.macd.macd.toFixed(2);
            if (indicators.bb) document.getElementById('bb').textContent = 
                \`U: \${indicators.bb.upper.toFixed(2)} L: \${indicators.bb.lower.toFixed(2)}\`;
        }
        
        // Show alerts
        function showAlert(alert) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert';
            alertDiv.textContent = alert.message;
            document.getElementById('alerts').appendChild(alertDiv);
            
            setTimeout(() => alertDiv.remove(), 5000);
        }
        
        // Show patterns
        function showPattern(data) {
            const patternDiv = document.createElement('div');
            patternDiv.className = 'indicator';
            patternDiv.innerHTML = \`\${data.symbol}: \${data.patterns.map(p => p.type).join(', ')}\`;
            document.getElementById('patterns').appendChild(patternDiv);
            
            setTimeout(() => patternDiv.remove(), 10000);
        }
        
        // Update ticker
        function updateTicker(data) {
            const ticker = document.getElementById('ticker-content');
            ticker.innerHTML = Object.entries(data.prices)
                .map(([symbol, price]) => \`\${symbol}: $\${price.toFixed(2)}\`)
                .join(' | ');
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            const shortcut = [];
            if (e.ctrlKey) shortcut.push('ctrl');
            if (e.shiftKey) shortcut.push('shift');
            if (e.altKey) shortcut.push('alt');
            shortcut.push(e.key.toLowerCase());
            
            ws.send(JSON.stringify({
                type: 'shortcut',
                shortcut: shortcut.join('+')
            }));
        });
        
        // Initial draw
        drawChart();
    </script>
</body>
</html>`;
    }
    
    generateClientId() {
        return Math.random().toString(36).substr(2, 9);
    }
    
    generateTradeId() {
        return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    getShortcutsForPlatform(platformId) {
        // Return relevant shortcuts for each platform
        const shortcuts = {
            quantman: ['ctrl+1', 'ctrl+2', 'ctrl+3', 'ctrl+shift+p'],
            algosoc: ['ctrl+b', 'ctrl+s', 'ctrl+shift+m'],
            algobot: ['ctrl+shift+a', 'alt+c', 'alt+t']
        };
        
        return shortcuts[platformId] || [];
    }
    
    generateMockChartData(symbol) {
        const candles = [];
        let price = symbol.includes('BTC') ? 50000 : symbol.includes('ETH') ? 3000 : 100;
        
        for (let i = 0; i < 100; i++) {
            const change = (Math.random() - 0.5) * price * 0.02;
            const open = price;
            const close = price + change;
            
            candles.push({
                timestamp: Date.now() - (100 - i) * 60000,
                open,
                high: Math.max(open, close) + Math.random() * 50,
                low: Math.min(open, close) - Math.random() * 50,
                close,
                volume: Math.floor(Math.random() * 10000)
            });
            
            price = close;
        }
        
        return {
            symbol,
            candles,
            lastPrice: price
        };
    }
}

// Initialize and export
const algoLayer = new AlgoTradingUnifiedLayer();

module.exports = AlgoTradingUnifiedLayer;