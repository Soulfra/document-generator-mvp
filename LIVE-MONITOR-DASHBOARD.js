#!/usr/bin/env node
// LIVE-MONITOR-DASHBOARD.js - Live monitoring with routing and lexicon

const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');

class LiveMonitorDashboard {
    constructor() {
        this.port = 7777; // Live monitor port
        this.wsPort = 7778;
        
        // ROUTER SYSTEM
        this.routers = {
            'consensus_router': {
                url: 'http://localhost:6666',
                ws: 'ws://localhost:6667',
                status: 'UNKNOWN',
                lastCheck: null,
                data: null
            },
            'swarm_router': {
                url: 'http://localhost:5555', 
                ws: 'ws://localhost:5556',
                status: 'UNKNOWN',
                lastCheck: null,
                data: null
            },
            'economy_router': {
                url: 'http://localhost:4444',
                ws: 'ws://localhost:4445', 
                status: 'UNKNOWN',
                lastCheck: null,
                data: null
            },
            'search_router': {
                url: 'http://localhost:2020',
                ws: 'ws://localhost:2021',
                status: 'UNKNOWN',
                lastCheck: null,
                data: null
            }
        };
        
        // LEXICON - Translation between systems
        this.lexicon = {
            // Agent Actions
            'COIN_FLIP': '🎲 Coin Flip',
            'VALIDATION': '✅ Validation',
            'FINAL_DECISION': '🧠 Decision',
            'LEDGER_VERIFICATION': '📋 Verification',
            'RULE_ESTABLISHED': '📜 New Rule',
            'DISCUSSION': '💬 Discussion',
            'PROJECT_CONTRIBUTION': '🔨 Building',
            
            // Agent Names
            'FLIPPER_A': '🎲 FlipperAlpha (SOL)',
            'FLIPPER_B': '🎲 FlipperBeta (XMR)', 
            'DECIDER': '🧠 DecisionEngine (ETH)',
            'CHECKER': '📋 LedgerChecker (BTC)',
            'SYSTEM': '⚙️ System',
            
            // Blockchain Territories
            'SOL_TERRITORY': '🌞 Solana Territory',
            'XMR_TERRITORY': '🔒 Monero Territory',
            'ETH_TERRITORY': '💎 Ethereum Territory', 
            'BTC_TERRITORY': '₿ Bitcoin Territory',
            
            // Project Types
            'database_system': '🗄️ Database System',
            'phpbb_fork': '💬 phpBB Forum Fork',
            'git_fork': '🔱 Git Fork',
            'consensus_protocol': '🤝 Consensus Protocol',
            
            // Status Types
            'ACTIVE': '🟢 Active',
            'WORKING': '🔄 Working',
            'DEAD': '💀 Dead',
            'UNKNOWN': '❓ Unknown'
        };
        
        // LIVE DATA FEEDS
        this.liveFeeds = {
            consensus: [],
            agents: [],
            projects: [],
            messages: [],
            system_stats: {}
        };
        
        // CONNECTED CLIENTS
        this.connectedClients = new Set();
        
        console.log('📺 LIVE MONITOR DASHBOARD');
        console.log('========================');
    }
    
    start() {
        this.startRouterChecking();
        this.startLiveDataCollection();
        this.startMonitorServer();
        this.startMonitorWebSocket();
        this.beginLiveStreaming();
    }
    
    startRouterChecking() {
        console.log('🔍 STARTING ROUTER CHECKING...');
        
        // Check all routers every 5 seconds
        setInterval(() => {
            this.checkAllRouters();
        }, 5000);
        
        // Initial check
        this.checkAllRouters();
    }
    
    async checkAllRouters() {
        const promises = Object.entries(this.routers).map(([name, router]) => 
            this.checkRouter(name, router)
        );
        
        await Promise.all(promises);
        
        // Broadcast router status to clients
        this.broadcast({
            type: 'router_status',
            routers: this.routers,
            timestamp: Date.now()
        });
    }
    
    checkRouter(name, router) {
        return new Promise((resolve) => {
            const http = require('http');
            const req = http.get(router.url, { timeout: 3000 }, (res) => {
                router.status = res.statusCode < 400 ? 'ACTIVE' : 'ERROR';
                router.lastCheck = Date.now();
                
                if (router.status === 'ACTIVE') {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        router.data = data.length;
                        console.log(`✅ ${name}: ${router.status}`);
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
            
            req.on('error', () => {
                router.status = 'OFFLINE';
                router.lastCheck = Date.now();
                console.log(`❌ ${name}: ${router.status}`);
                resolve();
            });
            
            req.on('timeout', () => {
                req.destroy();
                router.status = 'TIMEOUT';
                router.lastCheck = Date.now();
                console.log(`⏰ ${name}: ${router.status}`);
                resolve();
            });
        });
    }
    
    startLiveDataCollection() {
        console.log('📊 STARTING LIVE DATA COLLECTION...');
        
        // Connect to available WebSockets
        this.connectToWebSockets();
        
        // Collect system stats every 10 seconds
        setInterval(() => {
            this.collectSystemStats();
        }, 10000);
    }
    
    connectToWebSockets() {
        Object.entries(this.routers).forEach(([name, router]) => {
            if (router.status === 'ACTIVE') {
                this.connectToWebSocket(name, router.ws);
            }
        });
    }
    
    connectToWebSocket(routerName, wsUrl) {
        try {
            const ws = new WebSocket(wsUrl);
            
            ws.on('open', () => {
                console.log(`🔗 Connected to ${routerName} WebSocket`);
            });
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.processLiveMessage(routerName, message);
                } catch (e) {
                    // Non-JSON message, ignore
                }
            });
            
            ws.on('error', () => {
                console.log(`⚠️ WebSocket error for ${routerName}`);
            });
            
            ws.on('close', () => {
                console.log(`🔌 WebSocket closed for ${routerName}`);
                // Retry connection in 10 seconds
                setTimeout(() => {
                    if (this.routers[routerName].status === 'ACTIVE') {
                        this.connectToWebSocket(routerName, wsUrl);
                    }
                }, 10000);
            });
            
        } catch (e) {
            console.log(`❌ Failed to connect to ${routerName} WebSocket`);
        }
    }
    
    processLiveMessage(routerName, message) {
        // Translate and process messages from different systems
        const translatedMessage = this.translateMessage(message);
        
        // Store in appropriate feed
        switch (message.type) {
            case 'consensus-state':
            case 'dual-economy-state':
            case 'swarm-state':
                this.liveFeeds.consensus.push({
                    router: routerName,
                    message: translatedMessage,
                    timestamp: Date.now()
                });
                break;
                
            default:
                this.liveFeeds.messages.push({
                    router: routerName,
                    message: translatedMessage,
                    timestamp: Date.now()
                });
        }
        
        // Keep feeds limited
        Object.keys(this.liveFeeds).forEach(feed => {
            if (Array.isArray(this.liveFeeds[feed]) && this.liveFeeds[feed].length > 50) {
                this.liveFeeds[feed] = this.liveFeeds[feed].slice(-25);
            }
        });
        
        // Broadcast to clients
        this.broadcast({
            type: 'live_message',
            router: routerName,
            message: translatedMessage,
            timestamp: Date.now()
        });
    }
    
    translateMessage(message) {
        // Use lexicon to translate technical terms to human-readable
        const translated = { ...message };
        
        if (message.type && this.lexicon[message.type]) {
            translated.type_display = this.lexicon[message.type];
        }
        
        // Translate agent names
        if (message.agent && this.lexicon[message.agent]) {
            translated.agent_display = this.lexicon[message.agent];
        }
        
        // Translate message content
        if (message.message && message.message.type && this.lexicon[message.message.type]) {
            translated.message_display = this.lexicon[message.message.type];
        }
        
        return translated;
    }
    
    collectSystemStats() {
        // Collect system statistics
        const stats = {
            timestamp: Date.now(),
            routers_active: Object.values(this.routers).filter(r => r.status === 'ACTIVE').length,
            routers_total: Object.keys(this.routers).length,
            connected_clients: this.connectedClients.size,
            message_count: this.liveFeeds.messages.length,
            uptime: process.uptime()
        };
        
        this.liveFeeds.system_stats = stats;
        
        // Broadcast stats
        this.broadcast({
            type: 'system_stats',
            stats: stats
        });
    }
    
    beginLiveStreaming() {
        console.log('📡 BEGINNING LIVE STREAMING...');
        
        // Stream live updates every 2 seconds
        setInterval(() => {
            this.streamLiveUpdates();
        }, 2000);
    }
    
    streamLiveUpdates() {
        // Get latest activity from all feeds
        const recentActivity = {
            consensus: this.liveFeeds.consensus.slice(-5),
            messages: this.liveFeeds.messages.slice(-10),
            stats: this.liveFeeds.system_stats
        };
        
        this.broadcast({
            type: 'live_stream',
            activity: recentActivity,
            timestamp: Date.now()
        });
    }
    
    startMonitorServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const url = req.url;
            
            if (url === '/') {
                this.serveLiveMonitorInterface(res);
            } else if (url === '/routers') {
                this.serveRouterData(res);
            } else if (url === '/feeds') {
                this.serveFeedData(res);
            } else if (url === '/lexicon') {
                this.serveLexiconData(res);
            } else {
                res.writeHead(404);
                res.end('Monitor endpoint not found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`\\n📺 Live Monitor Dashboard: http://localhost:7777`);
        });
    }
    
    startMonitorWebSocket() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws) => {
            console.log('👁️ Live monitor observer connected');
            this.connectedClients.add(ws);
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'monitor_connected',
                routers: this.routers,
                feeds: this.liveFeeds,
                lexicon: this.lexicon,
                timestamp: Date.now()
            }));
            
            ws.on('close', () => {
                this.connectedClients.delete(ws);
                console.log('👁️ Live monitor observer disconnected');
            });
            
            ws.on('error', () => {
                this.connectedClients.delete(ws);
            });
        });
        
        console.log(`📡 Live Monitor WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    broadcast(data) {
        const message = JSON.stringify(data);
        this.connectedClients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
    
    serveLiveMonitorInterface(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>📺 Live Monitor Dashboard</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #333333 100%);
            color: #00ff00; 
            margin: 0; 
            padding: 10px;
            min-height: 100vh;
            overflow-x: hidden;
        }
        .header { 
            text-align: center; 
            font-size: 2em; 
            text-shadow: 0 0 20px #00ff00;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.8; }
            100% { opacity: 1; }
        }
        .monitor-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr; 
            gap: 15px; 
            max-width: 1800px; 
            margin: 0 auto;
        }
        .panel { 
            border: 2px solid #00ff00;
            border-radius: 10px; 
            padding: 15px;
            background: rgba(0, 255, 0, 0.05);
            backdrop-filter: blur(5px);
            max-height: 400px;
            overflow-y: auto;
        }
        .router-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid;
            border-radius: 8px;
            padding: 10px;
            margin: 8px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .status-active { border-color: #00ff00; }
        .status-offline { border-color: #ff0000; }
        .status-timeout { border-color: #ffff00; }
        .status-unknown { border-color: #808080; }
        .live-feed {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 10px;
            margin: 10px 0;
            max-height: 300px;
            overflow-y: auto;
        }
        .feed-item {
            background: rgba(0, 255, 0, 0.1);
            border-left: 3px solid #00ff00;
            padding: 8px;
            margin: 5px 0;
            border-radius: 0 5px 5px 0;
            font-size: 0.9em;
            animation: slideIn 0.5s ease-out;
        }
        @keyframes slideIn {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 10px 0;
        }
        .stat-box {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 5px;
            padding: 10px;
            text-align: center;
        }
        .lexicon-item {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 5px;
            padding: 8px;
            margin: 3px 0;
            display: flex;
            justify-content: space-between;
        }
        .timestamp {
            font-size: 0.8em;
            opacity: 0.7;
            float: right;
        }
        .blink {
            animation: blink 1s infinite;
        }
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0.3; }
        }
        .streaming-indicator {
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 255, 0, 0.2);
            border: 2px solid #00ff00;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: pulse 1s infinite;
        }
    </style>
</head>
<body>
    <div class="streaming-indicator" title="Live Streaming"></div>
    
    <div class="header">
        📺 LIVE MONITOR DASHBOARD
    </div>
    
    <div class="monitor-grid">
        <div class="panel">
            <h2>🔍 Router Status</h2>
            <div id="router-status">Checking routers...</div>
            
            <h3>📊 System Stats</h3>
            <div class="stats-grid">
                <div class="stat-box">
                    <div id="active-routers">0</div>
                    <div>Active Routers</div>
                </div>
                <div class="stat-box">
                    <div id="connected-clients">0</div>
                    <div>Connected</div>
                </div>
            </div>
        </div>
        
        <div class="panel">
            <h2>📡 Live Message Feed</h2>
            <div class="live-feed" id="live-feed">
                <div class="feed-item">📡 Initializing live feed...</div>
            </div>
        </div>
        
        <div class="panel">
            <h2>📚 System Lexicon</h2>
            <div id="lexicon-display" style="max-height: 350px; overflow-y: auto;">
                Loading lexicon...
            </div>
        </div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:7778');
        let monitorData = {};
        
        ws.onopen = () => {
            console.log('📡 Connected to live monitor');
            document.querySelector('.streaming-indicator').classList.add('blink');
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMonitorUpdate(data);
        };
        
        ws.onclose = () => {
            console.log('📡 Disconnected from live monitor');
            document.querySelector('.streaming-indicator').classList.remove('blink');
        };
        
        function handleMonitorUpdate(data) {
            switch (data.type) {
                case 'monitor_connected':
                    monitorData = data;
                    updateInterface();
                    break;
                case 'router_status':
                    monitorData.routers = data.routers;
                    updateRouterStatus();
                    break;
                case 'live_message':
                    addLiveMessage(data);
                    break;
                case 'live_stream':
                    updateLiveStream(data);
                    break;
                case 'system_stats':
                    updateSystemStats(data.stats);
                    break;
            }
        }
        
        function updateInterface() {
            updateRouterStatus();
            updateLexicon();
            updateSystemStats(monitorData.feeds?.system_stats);
        }
        
        function updateRouterStatus() {
            const routersDiv = document.getElementById('router-status');
            
            if (!monitorData.routers) return;
            
            const routersHtml = Object.entries(monitorData.routers).map(([name, router]) => {
                const statusClass = \`status-\${router.status.toLowerCase()}\`;
                const lastCheck = router.lastCheck ? 
                    new Date(router.lastCheck).toLocaleTimeString() : 'Never';
                
                return \`
                    <div class="router-item \${statusClass}">
                        <div>
                            <strong>\${name.replace('_', ' ').toUpperCase()}</strong><br>
                            <small>\${router.url}</small>
                        </div>
                        <div>
                            <div>\${router.status}</div>
                            <small>\${lastCheck}</small>
                        </div>
                    </div>
                \`;
            }).join('');
            
            routersDiv.innerHTML = routersHtml;
        }
        
        function updateLexicon() {
            const lexiconDiv = document.getElementById('lexicon-display');
            
            if (!monitorData.lexicon) return;
            
            const lexiconHtml = Object.entries(monitorData.lexicon).map(([key, value]) => \`
                <div class="lexicon-item">
                    <code>\${key}</code>
                    <span>\${value}</span>
                </div>
            \`).join('');
            
            lexiconDiv.innerHTML = lexiconHtml;
        }
        
        function addLiveMessage(data) {
            const feedDiv = document.getElementById('live-feed');
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'feed-item';
            messageDiv.innerHTML = \`
                <strong>[\${data.router}]</strong> 
                \${data.message.type_display || data.message.type || 'Message'}
                <span class="timestamp">\${new Date(data.timestamp).toLocaleTimeString()}</span>
            \`;
            
            feedDiv.appendChild(messageDiv);
            
            // Keep only last 20 messages
            while (feedDiv.children.length > 20) {
                feedDiv.removeChild(feedDiv.firstChild);
            }
            
            // Auto-scroll to bottom
            feedDiv.scrollTop = feedDiv.scrollHeight;
        }
        
        function updateLiveStream(data) {
            // Add any new messages from the stream
            if (data.activity.messages) {
                data.activity.messages.forEach(msg => {
                    addLiveMessage({
                        router: msg.router,
                        message: msg.message,
                        timestamp: msg.timestamp
                    });
                });
            }
        }
        
        function updateSystemStats(stats) {
            if (!stats) return;
            
            document.getElementById('active-routers').textContent = stats.routers_active || 0;
            document.getElementById('connected-clients').textContent = stats.connected_clients || 0;
        }
        
        // Auto-refresh interface every 10 seconds
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                // Updates come via WebSocket
            }
        }, 10000);
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveRouterData(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            routers: this.routers,
            timestamp: Date.now()
        }));
    }
    
    serveFeedData(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            feeds: this.liveFeeds,
            timestamp: Date.now()
        }));
    }
    
    serveLexiconData(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            lexicon: this.lexicon,
            timestamp: Date.now()
        }));
    }
}

// Start the Live Monitor Dashboard
if (require.main === module) {
    console.log('📺 STARTING LIVE MONITOR DASHBOARD');
    console.log('==================================');
    console.log('🔍 Router monitoring for all systems');
    console.log('📡 Live data feeds with WebSocket streaming');
    console.log('📚 Lexicon translation for technical terms');
    console.log('👁️ Real-time visualization of agent activity');
    console.log('');
    
    const monitor = new LiveMonitorDashboard();
    monitor.start();
    
    console.log('\\n📺 Live Monitor Dashboard: http://localhost:7777');
    console.log('📡 Monitor WebSocket: ws://localhost:7778');
    console.log('');
    console.log('👁️ Now you can see everything happening live!');
}

module.exports = LiveMonitorDashboard;