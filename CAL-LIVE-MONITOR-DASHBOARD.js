#!/usr/bin/env node

/**
 * 🔍 CAL LIVE MONITOR DASHBOARD - COMPLETE SYSTEM VISIBILITY
 * 
 * Real-time monitoring dashboard showing everything happening under the hood:
 * - Live API ping tracking with response times and costs
 * - AI model selection decisions with reasoning transparency
 * - Tagged packet flows through the entire system
 * - Cross-market data integration and opportunities
 * - Performance metrics and cost optimization insights
 */

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class CalLiveMonitorDashboard extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            httpPort: process.env.MONITOR_HTTP_PORT || 9300,
            wsPort: process.env.MONITOR_WS_PORT || 9301,
            logRetention: 1000, // Keep last 1000 events
            updateInterval: 1000 // 1 second updates
        };
        
        // Real-time event storage
        this.events = {
            apiCalls: [],
            modelSelections: [],
            taggedPackets: [],
            systemMetrics: [],
            marketData: [],
            alerts: []
        };
        
        // Connected WebSocket clients
        this.wsClients = new Set();
        
        // Performance tracking
        this.performance = {
            totalApiCalls: 0,
            totalCost: 0,
            avgResponseTime: 0,
            systemUptime: Date.now(),
            successRate: 1.0,
            activeLibrarians: new Set(),
            modelsUsed: new Map()
        };
        
        // Market data cache
        this.marketCache = {
            osrs: new Map(),
            crypto: new Map(),
            stocks: new Map(),
            lastUpdated: new Map()
        };
        
        console.log('🔍 Cal Live Monitor Dashboard initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Start HTTP server for the dashboard
        await this.startHttpServer();
        
        // Start WebSocket server for real-time updates
        await this.startWebSocketServer();
        
        // Start background monitoring
        this.startBackgroundMonitoring();
        
        // Hook into existing Cal systems
        this.hookIntoCalSystems();
        
        console.log(`✅ Live Monitor Dashboard ready:`);
        console.log(`   📊 Dashboard: http://localhost:${this.config.httpPort}`);
        console.log(`   🔌 WebSocket: ws://localhost:${this.config.wsPort}`);
        
        this.emit('monitor_ready');
    }
    
    async startHttpServer() {
        this.httpServer = http.createServer(async (req, res) => {
            if (req.url === '/' || req.url === '/dashboard') {
                const html = await this.generateDashboardHtml();
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            } else if (req.url === '/api/events') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.events));
            } else if (req.url === '/api/performance') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.performance));
            } else if (req.url === '/api/market') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    osrs: Object.fromEntries(this.marketCache.osrs),
                    crypto: Object.fromEntries(this.marketCache.crypto),
                    stocks: Object.fromEntries(this.marketCache.stocks)
                }));
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Not Found');
            }
        });
        
        return new Promise((resolve) => {
            this.httpServer.listen(this.config.httpPort, () => {
                resolve();
            });
        });
    }
    
    async startWebSocketServer() {
        this.wsServer = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wsServer.on('connection', (ws) => {
            console.log('🔌 New monitoring client connected');
            this.wsClients.add(ws);
            
            // Send current state to new client
            ws.send(JSON.stringify({
                type: 'initial_state',
                events: this.events,
                performance: this.performance,
                market: {
                    osrs: Object.fromEntries(this.marketCache.osrs),
                    crypto: Object.fromEntries(this.marketCache.crypto),
                    stocks: Object.fromEntries(this.marketCache.stocks)
                }
            }));
            
            ws.on('close', () => {
                console.log('🔌 Monitoring client disconnected');
                this.wsClients.delete(ws);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.wsClients.delete(ws);
            });
        });
    }
    
    startBackgroundMonitoring() {
        // Update performance metrics every second
        setInterval(() => {
            this.updateSystemMetrics();
            this.broadcastToClients({
                type: 'performance_update',
                data: this.performance
            });
        }, this.config.updateInterval);
        
        // Clean old events every minute
        setInterval(() => {
            this.cleanOldEvents();
        }, 60000);
        
        // Generate system health alerts
        setInterval(() => {
            this.checkSystemHealth();
        }, 5000);
    }
    
    hookIntoCalSystems() {
        // Hook into model router for API calls and model selections
        this.hookModelRouter();
        
        // Hook into librarian databases for tagged packets
        this.hookLibrarianDatabases();
        
        // Hook into market data feeds
        this.hookMarketFeeds();
        
        // Hook into system events
        this.hookSystemEvents();
    }
    
    hookModelRouter() {
        // This would integrate with your existing CAL-AI-MODEL-ROUTER.js
        // For now, we'll simulate the integration
        this.on('model_router_api_call', (data) => {
            this.recordApiCall({
                timestamp: Date.now(),
                librarian: data.librarian,
                api_endpoint: data.endpoint,
                response_time: data.responseTime,
                cost: data.cost,
                success: data.success,
                model_selected: data.model,
                reasoning: data.reasoning
            });
        });
        
        this.on('model_selection', (data) => {
            this.recordModelSelection({
                timestamp: Date.now(),
                librarian: data.librarian,
                query: data.query,
                domain_detected: data.domain,
                model_selected: data.model,
                provider: data.provider,
                cost: data.cost,
                reasoning_chain: data.reasoningChain,
                confidence: data.confidence
            });
        });
    }
    
    hookLibrarianDatabases() {
        this.on('tagged_packet_created', (packet) => {
            this.recordTaggedPacket({
                timestamp: Date.now(),
                packet_id: packet.id,
                librarian: packet.librarian,
                query: packet.query,
                components_used: packet.components,
                trust_sources: packet.trustSources,
                confidence_scores: packet.confidenceScores,
                reasoning_chain: packet.reasoningChain,
                execution_time: packet.executionTime,
                quality_score: packet.quality
            });
        });
    }
    
    hookMarketFeeds() {
        this.on('market_data_update', (data) => {
            this.updateMarketCache(data.market, data.symbol, data.data);
            
            this.broadcastToClients({
                type: 'market_update',
                market: data.market,
                symbol: data.symbol,
                data: data.data
            });
        });
    }
    
    hookSystemEvents() {
        this.on('system_event', (event) => {
            this.events.systemMetrics.push({
                timestamp: Date.now(),
                type: event.type,
                message: event.message,
                severity: event.severity || 'info',
                component: event.component,
                data: event.data
            });
            
            this.broadcastToClients({
                type: 'system_event',
                data: event
            });
        });
    }
    
    recordApiCall(callData) {
        this.events.apiCalls.push(callData);
        this.performance.totalApiCalls++;
        this.performance.totalCost += callData.cost || 0;
        
        if (callData.success) {
            // Update average response time
            const currentAvg = this.performance.avgResponseTime || 0;
            const count = this.performance.totalApiCalls;
            this.performance.avgResponseTime = (currentAvg * (count - 1) + callData.response_time) / count;
        }
        
        // Trim old events
        if (this.events.apiCalls.length > this.config.logRetention) {
            this.events.apiCalls.shift();
        }
        
        this.broadcastToClients({
            type: 'api_call',
            data: callData
        });
    }
    
    recordModelSelection(selectionData) {
        this.events.modelSelections.push(selectionData);
        this.performance.activeLibrarians.add(selectionData.librarian);
        
        // Track model usage
        const modelKey = `${selectionData.provider}/${selectionData.model_selected}`;
        this.performance.modelsUsed.set(
            modelKey, 
            (this.performance.modelsUsed.get(modelKey) || 0) + 1
        );
        
        // Trim old events
        if (this.events.modelSelections.length > this.config.logRetention) {
            this.events.modelSelections.shift();
        }
        
        this.broadcastToClients({
            type: 'model_selection',
            data: selectionData
        });
    }
    
    recordTaggedPacket(packetData) {
        this.events.taggedPackets.push(packetData);
        
        // Trim old events
        if (this.events.taggedPackets.length > this.config.logRetention) {
            this.events.taggedPackets.shift();
        }
        
        this.broadcastToClients({
            type: 'tagged_packet',
            data: packetData
        });
    }
    
    updateMarketCache(market, symbol, data) {
        if (!this.marketCache[market]) {
            this.marketCache[market] = new Map();
        }
        
        this.marketCache[market].set(symbol, {
            ...data,
            timestamp: Date.now()
        });
        
        this.marketCache.lastUpdated.set(`${market}:${symbol}`, Date.now());
    }
    
    updateSystemMetrics() {
        const now = Date.now();
        const uptimeSeconds = (now - this.performance.systemUptime) / 1000;
        
        this.performance.systemUptime = uptimeSeconds;
        
        // Calculate success rate from recent API calls
        const recentCalls = this.events.apiCalls.slice(-100); // Last 100 calls
        if (recentCalls.length > 0) {
            const successful = recentCalls.filter(call => call.success).length;
            this.performance.successRate = successful / recentCalls.length;
        }
        
        // Add current metrics to history
        this.events.systemMetrics.push({
            timestamp: now,
            type: 'metrics_update',
            cpu_usage: this.getCpuUsage(),
            memory_usage: this.getMemoryUsage(),
            active_connections: this.wsClients.size,
            total_api_calls: this.performance.totalApiCalls,
            total_cost: this.performance.totalCost,
            avg_response_time: this.performance.avgResponseTime,
            success_rate: this.performance.successRate
        });
        
        // Trim old metrics
        if (this.events.systemMetrics.length > this.config.logRetention) {
            this.events.systemMetrics.shift();
        }
    }
    
    getCpuUsage() {
        const usage = process.cpuUsage();
        return (usage.user + usage.system) / 1000000; // Convert to seconds
    }
    
    getMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            rss: Math.round(usage.rss / 1024 / 1024), // MB
            heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
            heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
            external: Math.round(usage.external / 1024 / 1024) // MB
        };
    }
    
    checkSystemHealth() {
        const alerts = [];
        
        // Check response time
        if (this.performance.avgResponseTime > 5000) {
            alerts.push({
                type: 'performance',
                severity: 'warning',
                message: `High average response time: ${this.performance.avgResponseTime.toFixed(0)}ms`,
                timestamp: Date.now()
            });
        }
        
        // Check success rate
        if (this.performance.successRate < 0.9) {
            alerts.push({
                type: 'reliability',
                severity: 'critical',
                message: `Low success rate: ${(this.performance.successRate * 100).toFixed(1)}%`,
                timestamp: Date.now()
            });
        }
        
        // Check cost
        if (this.performance.totalCost > 50.0) {
            alerts.push({
                type: 'cost',
                severity: 'warning',
                message: `High daily cost: $${this.performance.totalCost.toFixed(2)}`,
                timestamp: Date.now()
            });
        }
        
        // Add alerts to event log
        alerts.forEach(alert => {
            this.events.alerts.push(alert);
            
            this.broadcastToClients({
                type: 'alert',
                data: alert
            });
        });
        
        // Trim old alerts
        if (this.events.alerts.length > 100) {
            this.events.alerts.shift();
        }
    }
    
    cleanOldEvents() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        
        ['apiCalls', 'modelSelections', 'taggedPackets', 'systemMetrics'].forEach(eventType => {
            this.events[eventType] = this.events[eventType].filter(
                event => event.timestamp > cutoff
            );
        });
    }
    
    broadcastToClients(message) {
        const messageStr = JSON.stringify(message);
        
        this.wsClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(messageStr);
                } catch (error) {
                    console.error('Error broadcasting to client:', error);
                    this.wsClients.delete(client);
                }
            }
        });
    }
    
    async generateDashboardHtml() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔍 Cal Live Monitor Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            line-height: 1.6;
            overflow-x: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            padding: 20px;
            border-bottom: 2px solid #00d4ff;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 10px rgba(0, 212, 255, 0.3);
        }
        
        .header h1 {
            display: flex;
            align-items: center;
            gap: 15px;
            font-size: 28px;
            color: #fff;
        }
        
        .status-indicator {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #4ade80;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(74, 222, 128, 0); }
            100% { box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
        }
        
        .container {
            max-width: 1800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 24px;
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
        }
        
        .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 212, 255, 0.15);
            border-color: #00d4ff;
        }
        
        .metric-title {
            font-size: 16px;
            font-weight: 600;
            color: #00d4ff;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .metric-value {
            font-size: 32px;
            font-weight: 700;
            color: #fff;
            margin-bottom: 8px;
        }
        
        .metric-subtitle {
            font-size: 14px;
            color: #888;
        }
        
        .activity-feed {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            height: 600px;
            overflow-y: auto;
            margin-bottom: 20px;
        }
        
        .feed-header {
            padding: 20px;
            border-bottom: 1px solid #333;
            background: #252525;
            font-weight: 600;
            color: #00d4ff;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        .feed-item {
            padding: 16px 20px;
            border-bottom: 1px solid #2a2a2a;
            display: flex;
            align-items: center;
            gap: 12px;
            transition: background 0.2s ease;
        }
        
        .feed-item:hover {
            background: #222;
        }
        
        .feed-icon {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
        }
        
        .feed-icon.api-call { background: #4ade80; }
        .feed-icon.model-selection { background: #fbbf24; }
        .feed-icon.tagged-packet { background: #8b5cf6; }
        .feed-icon.alert { background: #ef4444; }
        
        .feed-content {
            flex: 1;
        }
        
        .feed-title {
            font-weight: 500;
            color: #fff;
            margin-bottom: 4px;
        }
        
        .feed-subtitle {
            font-size: 13px;
            color: #888;
        }
        
        .feed-time {
            font-size: 12px;
            color: #666;
            flex-shrink: 0;
        }
        
        .grid-layout {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
        }
        
        .market-data {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 12px;
            padding: 20px;
        }
        
        .market-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #2a2a2a;
        }
        
        .market-item:last-child {
            border-bottom: none;
        }
        
        .market-symbol {
            font-weight: 600;
            color: #fff;
        }
        
        .market-price {
            font-weight: 500;
        }
        
        .price-up { color: #4ade80; }
        .price-down { color: #ef4444; }
        .price-neutral { color: #888; }
        
        .chart-placeholder {
            height: 200px;
            background: #0a0a0a;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            margin-top: 16px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>
            🔍 Cal Live Monitor Dashboard
            <div class="status-indicator" id="status"></div>
        </h1>
    </div>
    
    <div class="container">
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">🔌 API Calls</div>
                <div class="metric-value" id="total-api-calls">0</div>
                <div class="metric-subtitle">Total requests made</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">💰 Total Cost</div>
                <div class="metric-value" id="total-cost">$0.00</div>
                <div class="metric-subtitle">Across all models and APIs</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">⚡ Avg Response</div>
                <div class="metric-value" id="avg-response">0ms</div>
                <div class="metric-subtitle">Average API response time</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">✅ Success Rate</div>
                <div class="metric-value" id="success-rate">100%</div>
                <div class="metric-subtitle">API call success rate</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">🤖 Active Librarians</div>
                <div class="metric-value" id="active-librarians">0</div>
                <div class="metric-subtitle">Currently processing queries</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">📦 Tagged Packets</div>
                <div class="metric-value" id="tagged-packets">0</div>
                <div class="metric-subtitle">Knowledge packets processed</div>
            </div>
        </div>
        
        <div class="grid-layout">
            <div>
                <div class="activity-feed">
                    <div class="feed-header">
                        🔴 Live Activity Feed
                    </div>
                    <div id="activity-feed">
                        <div class="feed-item">
                            <div class="feed-icon api-call"></div>
                            <div class="feed-content">
                                <div class="feed-title">System starting up...</div>
                                <div class="feed-subtitle">Connecting to monitoring streams</div>
                            </div>
                            <div class="feed-time">Now</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div>
                <div class="market-data">
                    <h3 style="color: #00d4ff; margin-bottom: 16px;">📈 Market Data</h3>
                    <div id="market-data">
                        <div class="market-item">
                            <div class="market-symbol">Connecting...</div>
                            <div class="market-price price-neutral">Loading</div>
                        </div>
                    </div>
                    <div class="chart-placeholder">
                        Live market charts coming soon...
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        class LiveMonitor {
            constructor() {
                this.ws = null;
                this.reconnectInterval = null;
                this.lastActivity = Date.now();
                
                this.connect();
                this.startHeartbeat();
            }
            
            connect() {
                try {
                    this.ws = new WebSocket('ws://localhost:${this.config.wsPort}');
                    
                    this.ws.onopen = () => {
                        console.log('✅ Connected to monitoring WebSocket');
                        this.updateStatus('connected');
                        if (this.reconnectInterval) {
                            clearInterval(this.reconnectInterval);
                            this.reconnectInterval = null;
                        }
                    };
                    
                    this.ws.onmessage = (event) => {
                        this.lastActivity = Date.now();
                        const message = JSON.parse(event.data);
                        this.handleMessage(message);
                    };
                    
                    this.ws.onclose = () => {
                        console.log('❌ Monitoring WebSocket disconnected');
                        this.updateStatus('disconnected');
                        this.startReconnect();
                    };
                    
                    this.ws.onerror = (error) => {
                        console.error('WebSocket error:', error);
                        this.updateStatus('error');
                    };
                    
                } catch (error) {
                    console.error('Connection error:', error);
                    this.startReconnect();
                }
            }
            
            startReconnect() {
                if (!this.reconnectInterval) {
                    this.reconnectInterval = setInterval(() => {
                        console.log('🔄 Attempting to reconnect...');
                        this.connect();
                    }, 5000);
                }
            }
            
            startHeartbeat() {
                setInterval(() => {
                    if (Date.now() - this.lastActivity > 10000) {
                        this.updateStatus('stale');
                    }
                }, 1000);
            }
            
            updateStatus(status) {
                const indicator = document.getElementById('status');
                const colors = {
                    connected: '#4ade80',
                    disconnected: '#ef4444',
                    error: '#fbbf24',
                    stale: '#666'
                };
                indicator.style.background = colors[status] || '#666';
            }
            
            handleMessage(message) {
                switch (message.type) {
                    case 'initial_state':
                        this.updateMetrics(message.performance);
                        this.initializeFeeds(message.events);
                        this.updateMarketData(message.market);
                        break;
                        
                    case 'api_call':
                        this.addFeedItem('api-call', 
                            \`\${message.data.librarian} → \${message.data.api_endpoint}\`,
                            \`\${message.data.response_time}ms, $\${message.data.cost?.toFixed(4) || '0.0000'}\`);
                        break;
                        
                    case 'model_selection':
                        this.addFeedItem('model-selection',
                            \`\${message.data.librarian} selected \${message.data.model_selected}\`,
                            \`Domain: \${message.data.domain_detected}, Cost: $\${message.data.cost?.toFixed(4) || '0.0000'}\`);
                        break;
                        
                    case 'tagged_packet':
                        this.addFeedItem('tagged-packet',
                            \`Tagged packet: \${message.data.packet_id}\`,
                            \`Quality: \${(message.data.quality_score * 100).toFixed(1)}%, \${message.data.execution_time}ms\`);
                        break;
                        
                    case 'alert':
                        this.addFeedItem('alert',
                            \`Alert: \${message.data.message}\`,
                            \`Severity: \${message.data.severity}\`);
                        break;
                        
                    case 'performance_update':
                        this.updateMetrics(message.data);
                        break;
                        
                    case 'market_update':
                        this.updateMarketItem(message.market, message.symbol, message.data);
                        break;
                }
            }
            
            updateMetrics(performance) {
                document.getElementById('total-api-calls').textContent = performance.totalApiCalls || 0;
                document.getElementById('total-cost').textContent = '$' + (performance.totalCost || 0).toFixed(2);
                document.getElementById('avg-response').textContent = Math.round(performance.avgResponseTime || 0) + 'ms';
                document.getElementById('success-rate').textContent = Math.round((performance.successRate || 1) * 100) + '%';
                document.getElementById('active-librarians').textContent = performance.activeLibrarians?.size || 0;
                document.getElementById('tagged-packets').textContent = performance.totalTaggedPackets || 0;
            }
            
            initializeFeeds(events) {
                // Initialize with recent events
                const feed = document.getElementById('activity-feed');
                feed.innerHTML = '';
                
                // Combine and sort all events by timestamp
                const allEvents = [
                    ...events.apiCalls.map(e => ({...e, type: 'api-call'})),
                    ...events.modelSelections.map(e => ({...e, type: 'model-selection'})),
                    ...events.taggedPackets.map(e => ({...e, type: 'tagged-packet'})),
                    ...events.alerts.map(e => ({...e, type: 'alert'}))
                ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
                
                allEvents.forEach(event => {
                    this.addExistingFeedItem(event);
                });
            }
            
            addFeedItem(type, title, subtitle) {
                const feed = document.getElementById('activity-feed');
                const item = document.createElement('div');
                item.className = 'feed-item';
                item.innerHTML = \`
                    <div class="feed-icon \${type}"></div>
                    <div class="feed-content">
                        <div class="feed-title">\${title}</div>
                        <div class="feed-subtitle">\${subtitle}</div>
                    </div>
                    <div class="feed-time">Now</div>
                \`;
                
                feed.insertBefore(item, feed.firstChild);
                
                // Remove old items (keep last 100)
                while (feed.children.length > 100) {
                    feed.removeChild(feed.lastChild);
                }
            }
            
            addExistingFeedItem(event) {
                const feed = document.getElementById('activity-feed');
                const item = document.createElement('div');
                item.className = 'feed-item';
                
                const timeAgo = this.timeAgo(event.timestamp);
                let title, subtitle;
                
                switch (event.type) {
                    case 'api-call':
                        title = \`\${event.librarian} → \${event.api_endpoint}\`;
                        subtitle = \`\${event.response_time}ms, $\${event.cost?.toFixed(4) || '0.0000'}\`;
                        break;
                    case 'model-selection':
                        title = \`\${event.librarian} selected \${event.model_selected}\`;
                        subtitle = \`Domain: \${event.domain_detected}\`;
                        break;
                    case 'tagged-packet':
                        title = \`Tagged packet: \${event.packet_id}\`;
                        subtitle = \`Quality: \${(event.quality_score * 100).toFixed(1)}%\`;
                        break;
                    case 'alert':
                        title = \`Alert: \${event.message}\`;
                        subtitle = \`Severity: \${event.severity}\`;
                        break;
                }
                
                item.innerHTML = \`
                    <div class="feed-icon \${event.type}"></div>
                    <div class="feed-content">
                        <div class="feed-title">\${title}</div>
                        <div class="feed-subtitle">\${subtitle}</div>
                    </div>
                    <div class="feed-time">\${timeAgo}</div>
                \`;
                
                feed.appendChild(item);
            }
            
            updateMarketData(marketData) {
                const container = document.getElementById('market-data');
                container.innerHTML = '';
                
                ['osrs', 'crypto', 'stocks'].forEach(market => {
                    if (marketData[market]) {
                        Object.entries(marketData[market]).forEach(([symbol, data]) => {
                            const item = document.createElement('div');
                            item.className = 'market-item';
                            
                            const priceClass = data.change > 0 ? 'price-up' : 
                                             data.change < 0 ? 'price-down' : 'price-neutral';
                            
                            item.innerHTML = \`
                                <div class="market-symbol">\${symbol} (\${market.toUpperCase()})</div>
                                <div class="market-price \${priceClass}">
                                    \${data.price} \${data.change > 0 ? '+' : ''}\${data.change?.toFixed(2) || ''}%
                                </div>
                            \`;
                            
                            container.appendChild(item);
                        });
                    }
                });
            }
            
            updateMarketItem(market, symbol, data) {
                // Update existing market item or add new one
                this.updateMarketData({[market]: {[symbol]: data}});
            }
            
            timeAgo(timestamp) {
                const now = Date.now();
                const diff = now - timestamp;
                
                if (diff < 60000) return 'Now';
                if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
                if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
                return Math.floor(diff / 86400000) + 'd ago';
            }
        }
        
        // Start the live monitor
        const monitor = new LiveMonitor();
    </script>
</body>
</html>`;
    }
    
    // Public methods for external systems to report events
    reportApiCall(librarian, endpoint, responseTime, cost, success, model, reasoning) {
        this.emit('model_router_api_call', {
            librarian,
            endpoint,
            responseTime,
            cost,
            success,
            model,
            reasoning
        });
    }
    
    reportModelSelection(librarian, query, domain, model, provider, cost, reasoningChain, confidence) {
        this.emit('model_selection', {
            librarian,
            query,
            domain,
            model,
            provider,
            cost,
            reasoningChain,
            confidence
        });
    }
    
    reportTaggedPacket(packet) {
        this.emit('tagged_packet_created', packet);
    }
    
    reportMarketData(market, symbol, data) {
        this.emit('market_data_update', { market, symbol, data });
    }
    
    reportSystemEvent(type, message, severity, component, data) {
        this.emit('system_event', { type, message, severity, component, data });
    }
}

module.exports = CalLiveMonitorDashboard;

// Start the monitor if run directly
if (require.main === module) {
    const monitor = new CalLiveMonitorDashboard();
    
    // Example events for testing
    setTimeout(() => {
        monitor.reportApiCall('trade-cal', 'OSRS Grand Exchange API', 187, 0.0002, true, 'deepseek-coder', 'Optimal for market analysis');
        
        setTimeout(() => {
            monitor.reportModelSelection('ship-cal', 'Generate pirate ship template', 'maritime', 'claude-3-opus', 'anthropic', 0.015, 
                [{ step: 1, action: 'analyze_requirements', confidence: 0.9 }], 0.85);
        }, 2000);
        
        setTimeout(() => {
            monitor.reportMarketData('osrs', 'Dragon bones', { price: 2150, change: 2.3, volume: 1000 });
            monitor.reportMarketData('crypto', 'BTC', { price: 45250, change: -1.2, volume: 2345 });
        }, 3000);
        
    }, 5000);
    
    // Keep the process running
    process.on('SIGINT', () => {
        console.log('\n🔴 Shutting down Cal Live Monitor Dashboard...');
        process.exit(0);
    });
}