#!/usr/bin/env node

// 🤖📊 JARVIS DEEP TIER HUD
// Observable tier system monitoring with JARVIS-style interface
// Real-time visualization of tier progression and API access

const express = require('express');
const WebSocket = require('ws');
const DeepTierApiRouter = require('./deep-tier-api-router.js');

class JarvisDeepTierHUD {
    constructor() {
        this.app = express();
        this.port = 9300;
        this.wsPort = 9301;
        
        // Initialize deep tier router
        this.deepTierRouter = new DeepTierApiRouter();
        
        // Real-time monitoring data
        this.realtimeData = {
            currentTier: 0,
            tierProgress: 0,
            activeAPIs: [],
            recentCalls: [],
            systemHealth: 'optimal',
            unlockProgress: {}
        };
        
        // WebSocket connections
        this.wsConnections = new Set();
        
        console.log('🤖📊 JARVIS Deep Tier HUD initializing...');
        this.initializeJarvisHUD();
    }
    
    async initializeJarvisHUD() {
        console.log('🚀 Initializing JARVIS HUD systems...');
        
        // Setup WebSocket server for real-time updates
        this.setupWebSocketServer();
        
        // Start monitoring deep tier system
        this.startTierMonitoring();
        
        // Setup JARVIS interface routes
        this.setupJarvisRoutes();
        
        console.log('✅ JARVIS HUD systems online');
    }
    
    setupWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🔗 JARVIS HUD client connected');
            this.wsConnections.add(ws);
            
            // Send initial data
            ws.send(JSON.stringify({
                type: 'init',
                data: this.realtimeData
            }));
            
            ws.on('close', () => {
                this.wsConnections.delete(ws);
                console.log('❌ JARVIS HUD client disconnected');
            });
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleJarvisCommand(data, ws);
                } catch (error) {
                    console.error('🚨 JARVIS command error:', error);
                }
            });
        });
        
        console.log(`🌐 JARVIS WebSocket server running on ws://localhost:${this.wsPort}`);
    }
    
    handleJarvisCommand(command, ws) {
        console.log('🤖 JARVIS command received:', command.type);
        
        switch (command.type) {
            case 'calculate_tier':
                this.calculateAndUpdateTier(command.metrics, ws);
                break;
                
            case 'test_api':
                this.testApiAccess(command.api, command.params, ws);
                break;
                
            case 'unlock_progress':
                this.checkUnlockProgress(ws);
                break;
                
            case 'system_status':
                this.getSystemStatus(ws);
                break;
                
            default:
                ws.send(JSON.stringify({
                    type: 'error',
                    message: `Unknown command: ${command.type}`
                }));
        }
    }
    
    async calculateAndUpdateTier(metrics, ws) {
        try {
            const userId = 'jarvis_user';
            const tier = this.deepTierRouter.calculateUserTier(userId, metrics);
            const access = this.deepTierRouter.getApiAccessForTier(tier);
            
            this.realtimeData.currentTier = tier;
            this.realtimeData.tierProgress = Math.min(100, (tier / 200) * 100);
            this.realtimeData.activeAPIs = Object.keys(access.endpoints);
            
            // Calculate unlock progress
            this.updateUnlockProgress(tier);
            
            // Broadcast update to all connected clients
            this.broadcastUpdate({
                type: 'tier_update',
                data: {
                    tier,
                    progress: this.realtimeData.tierProgress,
                    activeAPIs: this.realtimeData.activeAPIs,
                    unlockProgress: this.realtimeData.unlockProgress
                }
            });
            
            console.log(`🎯 JARVIS: Tier calculated - ${tier}`);
            
        } catch (error) {
            console.error('🚨 JARVIS tier calculation error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Tier calculation failed'
            }));
        }
    }
    
    updateUnlockProgress(currentTier) {
        const thresholds = [
            { tier: 51, name: 'Game APIs', apis: ['RuneScape', 'OSRS', 'D2JSP'] },
            { tier: 108, name: 'Financial APIs', apis: ['Coinbase', 'TradingView'] },
            { tier: 153, name: 'AI APIs', apis: ['Anthropic', 'OpenAI'] },
            { tier: 201, name: 'Everything', apis: ['All APIs'] }
        ];
        
        this.realtimeData.unlockProgress = {};
        
        for (const threshold of thresholds) {
            if (currentTier >= threshold.tier) {
                this.realtimeData.unlockProgress[threshold.name] = {
                    status: 'unlocked',
                    progress: 100,
                    apis: threshold.apis
                };
            } else {
                const progress = Math.min(100, (currentTier / threshold.tier) * 100);
                this.realtimeData.unlockProgress[threshold.name] = {
                    status: 'locked',
                    progress,
                    remaining: threshold.tier - currentTier,
                    apis: threshold.apis
                };
            }
        }
    }
    
    async testApiAccess(apiName, params, ws) {
        try {
            const userId = 'jarvis_user';
            const result = await this.deepTierRouter.routeApiCall(userId, apiName, 'player_stats', params);
            
            // Add to recent calls
            this.realtimeData.recentCalls.unshift({
                api: apiName,
                result: result.success ? 'success' : 'failed',
                timestamp: Date.now(),
                error: result.error || null
            });
            
            // Keep only last 10 calls
            this.realtimeData.recentCalls = this.realtimeData.recentCalls.slice(0, 10);
            
            this.broadcastUpdate({
                type: 'api_test_result',
                data: {
                    result,
                    recentCalls: this.realtimeData.recentCalls
                }
            });
            
            console.log(`🔗 JARVIS: API test - ${apiName} - ${result.success ? 'SUCCESS' : 'FAILED'}`);
            
        } catch (error) {
            console.error('🚨 JARVIS API test error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'API test failed'
            }));
        }
    }
    
    startTierMonitoring() {
        // Monitor system every 5 seconds
        setInterval(() => {
            this.updateSystemHealth();
            this.broadcastSystemUpdate();
        }, 5000);
        
        console.log('📊 JARVIS tier monitoring started');
    }
    
    updateSystemHealth() {
        // Simple health check logic
        const apiErrorRate = this.realtimeData.recentCalls
            .slice(0, 5)
            .filter(call => call.result === 'failed').length / 5;
        
        if (apiErrorRate > 0.5) {
            this.realtimeData.systemHealth = 'degraded';
        } else if (apiErrorRate > 0.2) {
            this.realtimeData.systemHealth = 'warning';
        } else {
            this.realtimeData.systemHealth = 'optimal';
        }
    }
    
    broadcastSystemUpdate() {
        this.broadcastUpdate({
            type: 'system_update',
            data: {
                health: this.realtimeData.systemHealth,
                timestamp: Date.now()
            }
        });
    }
    
    broadcastUpdate(message) {
        const messageStr = JSON.stringify(message);
        this.wsConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        });
    }
    
    setupJarvisRoutes() {
        this.app.use(express.json());
        this.app.use(express.static(__dirname));
        
        // Main JARVIS HUD interface
        this.app.get('/', (req, res) => {
            res.send(this.renderJarvisHUD());
        });
        
        // API endpoints
        this.app.get('/api/status', (req, res) => {
            res.json(this.realtimeData);
        });
        
        this.app.post('/api/jarvis/command', (req, res) => {
            // Handle REST API commands (alternative to WebSocket)
            const { command, data } = req.body;
            
            // Process command and return result
            res.json({
                success: true,
                message: `JARVIS command ${command} processed`
            });
        });
    }
    
    renderJarvisHUD() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🤖📊 JARVIS Deep Tier HUD</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Consolas', 'Monaco', monospace;
            background: radial-gradient(circle at 20% 50%, #001122 0%, #000511 100%);
            color: #00ffff;
            overflow: hidden;
            height: 100vh;
        }
        
        .jarvis-container {
            position: relative;
            width: 100vw;
            height: 100vh;
            display: grid;
            grid-template-areas: 
                "header header header"
                "tier-display api-status unlock-progress"
                "tier-controls recent-calls system-health";
            grid-template-columns: 1fr 1fr 1fr;
            grid-template-rows: 80px 1fr 1fr;
            gap: 10px;
            padding: 10px;
        }
        
        .jarvis-panel {
            background: linear-gradient(135deg, 
                rgba(0, 255, 255, 0.1) 0%, 
                rgba(0, 100, 255, 0.1) 100%);
            border: 2px solid #00ffff;
            border-radius: 10px;
            padding: 15px;
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
        }
        
        .jarvis-panel::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, #00ffff, transparent);
            animation: scan 3s linear infinite;
        }
        
        @keyframes scan {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .header { grid-area: header; text-align: center; }
        .tier-display { grid-area: tier-display; }
        .api-status { grid-area: api-status; }
        .unlock-progress { grid-area: unlock-progress; }
        .tier-controls { grid-area: tier-controls; }
        .recent-calls { grid-area: recent-calls; }
        .system-health { grid-area: system-health; }
        
        .tier-circle {
            width: 150px;
            height: 150px;
            border: 3px solid #00ffff;
            border-radius: 50%;
            margin: 0 auto 20px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
        }
        
        .tier-progress {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: conic-gradient(#00ffff 0deg, transparent 0deg);
            transition: all 0.5s ease;
        }
        
        .api-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
            gap: 10px;
            margin-top: 10px;
        }
        
        .api-badge {
            background: rgba(0, 255, 255, 0.2);
            padding: 5px 10px;
            border-radius: 15px;
            text-align: center;
            font-size: 12px;
            border: 1px solid #00ffff;
        }
        
        .api-badge.active {
            background: rgba(0, 255, 255, 0.4);
            box-shadow: 0 0 10px #00ffff;
        }
        
        .unlock-item {
            margin: 10px 0;
            padding: 10px;
            border-left: 3px solid #666;
            background: rgba(0, 0, 0, 0.3);
        }
        
        .unlock-item.unlocked {
            border-left-color: #00ff00;
            background: rgba(0, 255, 0, 0.1);
        }
        
        .unlock-item.progress {
            border-left-color: #ffff00;
            background: rgba(255, 255, 0, 0.1);
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            margin: 5px 0;
            overflow: hidden;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00ffff, #0066ff);
            transition: width 0.5s ease;
        }
        
        .call-log {
            font-size: 12px;
            max-height: 200px;
            overflow-y: auto;
        }
        
        .call-entry {
            margin: 5px 0;
            padding: 5px;
            border-radius: 3px;
            background: rgba(0, 0, 0, 0.2);
        }
        
        .call-entry.success {
            border-left: 3px solid #00ff00;
        }
        
        .call-entry.failed {
            border-left: 3px solid #ff0000;
        }
        
        .health-indicator {
            text-align: center;
            font-size: 18px;
            font-weight: bold;
        }
        
        .health-optimal { color: #00ff00; }
        .health-warning { color: #ffff00; }
        .health-degraded { color: #ff0000; }
        
        input, button {
            background: rgba(0, 255, 255, 0.1);
            border: 1px solid #00ffff;
            color: #00ffff;
            padding: 8px;
            border-radius: 5px;
            margin: 5px;
        }
        
        button {
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        button:hover {
            background: rgba(0, 255, 255, 0.3);
            box-shadow: 0 0 10px #00ffff;
        }
        
        .status-text {
            font-size: 12px;
            opacity: 0.8;
            margin-top: 10px;
        }
        
        .jarvis-title {
            font-size: 28px;
            font-weight: bold;
            text-shadow: 0 0 20px #00ffff;
            animation: glow 2s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
            from { text-shadow: 0 0 20px #00ffff; }
            to { text-shadow: 0 0 30px #00ffff, 0 0 40px #0066ff; }
        }
    </style>
</head>
<body>
    <div class="jarvis-container">
        <div class="jarvis-panel header">
            <div class="jarvis-title">🤖📊 JARVIS DEEP TIER HUD</div>
            <div class="status-text">Real-time tier system monitoring and API access control</div>
        </div>
        
        <div class="jarvis-panel tier-display">
            <h3>🎯 Current Tier</h3>
            <div class="tier-circle">
                <div class="tier-progress" id="tierProgress"></div>
                <span id="currentTier">0</span>
            </div>
            <div class="status-text">
                Progress: <span id="tierProgressText">0%</span>
            </div>
        </div>
        
        <div class="jarvis-panel api-status">
            <h3>🔗 Active APIs</h3>
            <div class="api-grid" id="apiGrid">
                <div class="api-badge">No APIs</div>
            </div>
            <div class="status-text">
                <span id="apiCount">0</span> APIs available
            </div>
        </div>
        
        <div class="jarvis-panel unlock-progress">
            <h3>🔓 Unlock Progress</h3>
            <div id="unlockList">
                <div class="unlock-item">
                    <strong>Game APIs (Tier 51+)</strong>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <small>RuneScape, OSRS, D2JSP</small>
                </div>
                <div class="unlock-item">
                    <strong>Financial APIs (Tier 108+)</strong>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <small>Coinbase, TradingView</small>
                </div>
                <div class="unlock-item">
                    <strong>AI APIs (Tier 153+)</strong>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <small>Anthropic, OpenAI</small>
                </div>
            </div>
        </div>
        
        <div class="jarvis-panel tier-controls">
            <h3>⚙️ Tier Controls</h3>
            <div>
                <input type="number" id="systemsBuilt" placeholder="Systems Built" min="0" value="10">
                <input type="number" id="apisIntegrated" placeholder="APIs Integrated" min="0" value="5">
            </div>
            <div>
                <input type="number" id="yearsExperience" placeholder="Years Experience" min="0" value="3">
                <input type="number" id="projectsDeployed" placeholder="Projects Deployed" min="0" value="8">
            </div>
            <div>
                <label><input type="checkbox" id="hasBuiltAI"> Built AI System (+30)</label>
                <label><input type="checkbox" id="hasBuiltGame" checked> Built Game (+20)</label>
            </div>
            <button onclick="calculateTier()">🧮 Calculate Tier</button>
            <button onclick="testAPI()">🚀 Test API</button>
        </div>
        
        <div class="jarvis-panel recent-calls">
            <h3>📊 Recent API Calls</h3>
            <div class="call-log" id="callLog">
                <div class="call-entry">No recent calls</div>
            </div>
        </div>
        
        <div class="jarvis-panel system-health">
            <h3>💚 System Health</h3>
            <div class="health-indicator health-optimal" id="healthStatus">
                OPTIMAL
            </div>
            <div class="status-text">
                WebSocket: <span id="wsStatus">Connecting...</span><br>
                Deep Tier Router: <span id="routerStatus">Starting...</span><br>
                Last Update: <span id="lastUpdate">--:--:--</span>
            </div>
        </div>
    </div>
    
    <script>
        let ws;
        let currentTierValue = 0;
        
        function initWebSocket() {
            ws = new WebSocket('ws://localhost:${this.wsPort}');
            
            ws.onopen = function() {
                console.log('🤖 JARVIS HUD connected');
                document.getElementById('wsStatus').textContent = 'Connected';
                document.getElementById('routerStatus').textContent = 'Online';
            };
            
            ws.onmessage = function(event) {
                const message = JSON.parse(event.data);
                handleJarvisUpdate(message);
            };
            
            ws.onclose = function() {
                console.log('🤖 JARVIS HUD disconnected');
                document.getElementById('wsStatus').textContent = 'Disconnected';
                setTimeout(initWebSocket, 3000); // Reconnect
            };
            
            ws.onerror = function(error) {
                console.error('🚨 JARVIS WebSocket error:', error);
                document.getElementById('wsStatus').textContent = 'Error';
            };
        }
        
        function handleJarvisUpdate(message) {
            console.log('🤖 JARVIS update:', message.type);
            
            switch (message.type) {
                case 'init':
                case 'tier_update':
                    updateTierDisplay(message.data);
                    break;
                    
                case 'api_test_result':
                    updateRecentCalls(message.data.recentCalls);
                    break;
                    
                case 'system_update':
                    updateSystemHealth(message.data.health);
                    break;
            }
            
            document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
        }
        
        function updateTierDisplay(data) {
            if (data.tier !== undefined) {
                currentTierValue = data.tier;
                document.getElementById('currentTier').textContent = data.tier;
                document.getElementById('tierProgressText').textContent = Math.round(data.progress) + '%';
                
                // Update tier progress circle
                const progressElement = document.getElementById('tierProgress');
                progressElement.style.background = 
                    \`conic-gradient(#00ffff \${data.progress * 3.6}deg, transparent \${data.progress * 3.6}deg)\`;
            }
            
            if (data.activeAPIs) {
                updateAPIGrid(data.activeAPIs);
            }
            
            if (data.unlockProgress) {
                updateUnlockProgress(data.unlockProgress);
            }
        }
        
        function updateAPIGrid(apis) {
            const grid = document.getElementById('apiGrid');
            document.getElementById('apiCount').textContent = apis.length;
            
            if (apis.length === 0) {
                grid.innerHTML = '<div class="api-badge">No APIs</div>';
                return;
            }
            
            grid.innerHTML = apis.map(api => 
                \`<div class="api-badge active">\${api}</div>\`
            ).join('');
        }
        
        function updateUnlockProgress(unlockData) {
            const unlockList = document.getElementById('unlockList');
            let html = '';
            
            for (const [name, data] of Object.entries(unlockData)) {
                const statusClass = data.status === 'unlocked' ? 'unlocked' : 'progress';
                html += \`
                    <div class="unlock-item \${statusClass}">
                        <strong>\${name}</strong>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: \${data.progress}%"></div>
                        </div>
                        <small>\${data.apis.join(', ')}</small>
                        \${data.remaining ? \`<small>(\${data.remaining} tiers remaining)</small>\` : ''}
                    </div>
                \`;
            }
            
            unlockList.innerHTML = html;
        }
        
        function updateRecentCalls(calls) {
            const callLog = document.getElementById('callLog');
            
            if (!calls || calls.length === 0) {
                callLog.innerHTML = '<div class="call-entry">No recent calls</div>';
                return;
            }
            
            callLog.innerHTML = calls.map(call => \`
                <div class="call-entry \${call.result}">
                    <strong>\${call.api}</strong> - \${call.result}
                    <br><small>\${new Date(call.timestamp).toLocaleTimeString()}</small>
                    \${call.error ? \`<br><small style="color: #ff6666;">\${call.error}</small>\` : ''}
                </div>
            \`).join('');
        }
        
        function updateSystemHealth(health) {
            const healthElement = document.getElementById('healthStatus');
            healthElement.textContent = health.toUpperCase();
            healthElement.className = 'health-indicator health-' + health;
        }
        
        function calculateTier() {
            const metrics = {
                systemsBuilt: parseInt(document.getElementById('systemsBuilt').value) || 0,
                apisIntegrated: parseInt(document.getElementById('apisIntegrated').value) || 0,
                yearsExperience: parseInt(document.getElementById('yearsExperience').value) || 0,
                projectsDeployed: parseInt(document.getElementById('projectsDeployed').value) || 0,
                hasBuiltAI: document.getElementById('hasBuiltAI').checked,
                hasBuiltGame: document.getElementById('hasBuiltGame').checked
            };
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'calculate_tier',
                    metrics: metrics
                }));
            }
        }
        
        function testAPI() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'test_api',
                    api: 'runescape',
                    params: { username: 'Zezima' }
                }));
            }
        }
        
        // Initialize JARVIS HUD
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🤖 JARVIS HUD initializing...');
            initWebSocket();
            
            // Auto-calculate tier on load
            setTimeout(calculateTier, 2000);
        });
    </script>
</body>
</html>`;
    }
    
    async start() {
        return new Promise((resolve) => {
            this.app.listen(this.port, () => {
                console.log(`🤖📊 JARVIS Deep Tier HUD running on port ${this.port}`);
                console.log(`🌐 HUD Interface: http://localhost:${this.port}`);
                console.log(`📡 WebSocket: ws://localhost:${this.wsPort}`);
                console.log(`🎯 Real-time tier monitoring active`);
                console.log(`🔗 Deep tier API integration ready`);
                resolve();
            });
        });
    }
}

if (require.main === module) {
    const jarvisHUD = new JarvisDeepTierHUD();
    jarvisHUD.start().catch(console.error);
}

module.exports = JarvisDeepTierHUD;