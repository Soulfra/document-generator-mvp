#!/usr/bin/env node

/**
 * 📊 FLOW MONITOR DASHBOARD
 * 
 * Real-time monitoring of the complete data flow
 * WebSocket server + HTTP dashboard for visualizing the entire pipeline
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

class FlowMonitorDashboard {
    constructor(config = {}) {
        this.port = config.port || 8091;
        this.wsPort = config.wsPort || 8092;
        
        // Express app for dashboard
        this.app = express();
        this.server = http.createServer(this.app);
        
        // WebSocket server for real-time updates
        this.wsServer = new WebSocket.Server({ port: this.wsPort });
        
        // State tracking
        this.flowStates = new Map();
        this.systemStats = {
            uptime: Date.now(),
            totalFlows: 0,
            activeFlows: 0,
            completedFlows: 0,
            failedFlows: 0,
            stageMetrics: {}
        };
        
        // Connected clients
        this.clients = new Set();
        
        // Setup
        this.setupRoutes();
        this.setupWebSocket();
        
        console.log('📊 Flow Monitor Dashboard initialized');
    }
    
    setupRoutes() {
        // Serve static files
        this.app.use(express.static(path.join(__dirname, 'public')));
        
        // API endpoints
        this.app.get('/api/flows/active', (req, res) => {
            const activeFlows = Array.from(this.flowStates.values())
                .filter(flow => flow.status === 'active');
            res.json(activeFlows);
        });
        
        this.app.get('/api/flows/history', (req, res) => {
            const limit = parseInt(req.query.limit) || 50;
            const history = Array.from(this.flowStates.values())
                .filter(flow => flow.status !== 'active')
                .sort((a, b) => b.startTime - a.startTime)
                .slice(0, limit);
            res.json(history);
        });
        
        this.app.get('/api/flows/:flowId', (req, res) => {
            const flow = this.flowStates.get(req.params.flowId);
            if (flow) {
                res.json(flow);
            } else {
                res.status(404).json({ error: 'Flow not found' });
            }
        });
        
        this.app.get('/api/stats', (req, res) => {
            res.json({
                ...this.systemStats,
                uptime: Date.now() - this.systemStats.uptime,
                activeFlows: Array.from(this.flowStates.values())
                    .filter(f => f.status === 'active').length
            });
        });
        
        // Dashboard HTML
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
    }
    
    setupWebSocket() {
        this.wsServer.on('connection', (ws) => {
            console.log('🔌 New dashboard client connected');
            this.clients.add(ws);
            
            // Send current state to new client
            ws.send(JSON.stringify({
                type: 'initial_state',
                flows: Array.from(this.flowStates.values()),
                stats: this.systemStats
            }));
            
            ws.on('close', () => {
                console.log('🔌 Dashboard client disconnected');
                this.clients.delete(ws);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });
        });
    }
    
    // Track flow through the pipeline
    async trackFlow(flowId, stage, data) {
        const state = this.flowStates.get(flowId) || {
            id: flowId,
            stages: [],
            startTime: Date.now(),
            status: 'active'
        };
        
        // Add stage data
        state.stages.push({
            stage,
            data: this.sanitizeData(data),
            timestamp: Date.now()
        });
        
        // Update stage-specific metrics
        if (!this.systemStats.stageMetrics[stage]) {
            this.systemStats.stageMetrics[stage] = {
                count: 0,
                totalTime: 0,
                avgTime: 0
            };
        }
        
        const stageMetrics = this.systemStats.stageMetrics[stage];
        stageMetrics.count++;
        
        // Calculate stage time if not the first stage
        if (state.stages.length > 1) {
            const prevStage = state.stages[state.stages.length - 2];
            const stageTime = state.stages[state.stages.length - 1].timestamp - prevStage.timestamp;
            stageMetrics.totalTime += stageTime;
            stageMetrics.avgTime = stageMetrics.totalTime / stageMetrics.count;
        }
        
        // Update flow state
        state.currentStage = stage;
        state.lastUpdate = Date.now();
        state.progress = this.calculateProgress(state);
        
        this.flowStates.set(flowId, state);
        
        // Broadcast update to all clients
        this.broadcast({
            type: 'flow_update',
            flowId,
            stage,
            data: state,
            progress: state.progress
        });
    }
    
    // Update flow status
    updateFlowStatus(flowId, status, error = null) {
        const flow = this.flowStates.get(flowId);
        if (!flow) return;
        
        flow.status = status;
        flow.endTime = Date.now();
        flow.duration = flow.endTime - flow.startTime;
        
        if (error) {
            flow.error = error;
        }
        
        // Update stats
        this.systemStats.totalFlows++;
        if (status === 'completed') {
            this.systemStats.completedFlows++;
        } else if (status === 'failed') {
            this.systemStats.failedFlows++;
        }
        
        // Broadcast status update
        this.broadcast({
            type: 'flow_status_update',
            flowId,
            status,
            flow
        });
    }
    
    // Calculate flow progress percentage
    calculateProgress(state) {
        const totalStages = 6; // MVP, Forum, Game, Gaming, Database, Learning
        const completedStages = state.stages.length;
        return Math.round((completedStages / totalStages) * 100);
    }
    
    // Sanitize data for transmission
    sanitizeData(data) {
        // Remove sensitive information
        const sanitized = { ...data };
        
        if (sanitized.encryptionKey) {
            sanitized.encryptionKey = '[REDACTED]';
        }
        
        if (sanitized.apiKeys) {
            sanitized.apiKeys = '[REDACTED]';
        }
        
        return sanitized;
    }
    
    // Broadcast message to all connected clients
    broadcast(message) {
        const data = JSON.stringify(message);
        
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    // Start the dashboard server
    start() {
        this.server.listen(this.port, () => {
            console.log(`📊 Flow Monitor Dashboard running at http://localhost:${this.port}`);
            console.log(`🔌 WebSocket server running on port ${this.wsPort}`);
        });
        
        // Connect to orchestrator events
        this.connectToOrchestrator();
    }
    
    // Connect to the orchestrator for real-time updates
    connectToOrchestrator() {
        try {
            const UnifiedFlowOrchestrator = require('./unified-flow-orchestrator');
            const orchestrator = new UnifiedFlowOrchestrator();
            
            // Listen to orchestrator events
            orchestrator.on('flow:started', (data) => {
                this.trackFlow(data.flowId, 'started', data);
                this.broadcast({
                    type: 'flow_started',
                    ...data
                });
            });
            
            orchestrator.on('flow:stage:complete', (data) => {
                this.trackFlow(data.flowId, data.stage, data.data);
            });
            
            orchestrator.on('flow:completed', (data) => {
                this.updateFlowStatus(data.flowId, 'completed');
                this.broadcast({
                    type: 'flow_completed',
                    ...data
                });
            });
            
            orchestrator.on('flow:failed', (data) => {
                this.updateFlowStatus(data.flowId, 'failed', data.error);
                this.broadcast({
                    type: 'flow_failed',
                    ...data
                });
            });
            
            orchestrator.on('flow:progress', (data) => {
                this.broadcast({
                    type: 'flow_progress',
                    ...data
                });
            });
            
            console.log('✅ Connected to Flow Orchestrator');
        } catch (error) {
            console.log('⚠️ Orchestrator not available, running in standalone mode');
        }
    }
    
    // Generate dashboard HTML
    generateDashboardHTML() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Flow Monitor Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f0f0f;
            color: #fff;
            padding: 20px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #333;
        }
        
        h1 { font-size: 28px; }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #333;
        }
        
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            color: #4CAF50;
            margin: 10px 0;
        }
        
        .flows-container {
            display: grid;
            gap: 20px;
        }
        
        .flow-card {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #333;
            transition: all 0.3s ease;
        }
        
        .flow-card.active {
            border-color: #4CAF50;
            box-shadow: 0 0 20px rgba(76, 175, 80, 0.3);
        }
        
        .flow-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .flow-id {
            font-family: monospace;
            font-size: 12px;
            opacity: 0.7;
        }
        
        .flow-status {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .status-active { background: #2196F3; }
        .status-completed { background: #4CAF50; }
        .status-failed { background: #f44336; }
        
        .progress-bar {
            height: 10px;
            background: #333;
            border-radius: 5px;
            overflow: hidden;
            margin: 15px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            transition: width 0.3s ease;
        }
        
        .stages {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 15px;
        }
        
        .stage {
            padding: 5px 10px;
            background: #333;
            border-radius: 5px;
            font-size: 12px;
            opacity: 0.5;
            transition: all 0.3s ease;
        }
        
        .stage.complete {
            background: #4CAF50;
            opacity: 1;
        }
        
        .stage.current {
            background: #2196F3;
            opacity: 1;
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        
        .connection-status {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #333;
            border-radius: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #4CAF50;
            animation: pulse 2s infinite;
        }
        
        .status-dot.disconnected {
            background: #f44336;
            animation: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔄 Flow Monitor Dashboard</h1>
        <div id="uptime">Uptime: 0s</div>
    </div>
    
    <div class="stats" id="stats">
        <div class="stat-card">
            <div class="stat-label">Total Flows</div>
            <div class="stat-value" id="total-flows">0</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Active Flows</div>
            <div class="stat-value" id="active-flows">0</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Completed</div>
            <div class="stat-value" id="completed-flows">0</div>
        </div>
        <div class="stat-card">
            <div class="stat-label">Failed</div>
            <div class="stat-value" id="failed-flows">0</div>
        </div>
    </div>
    
    <h2>Active Flows</h2>
    <div class="flows-container" id="active-flows-container"></div>
    
    <h2 style="margin-top: 30px;">Recent Flows</h2>
    <div class="flows-container" id="recent-flows-container"></div>
    
    <div class="connection-status">
        <div class="status-dot" id="connection-dot"></div>
        <span id="connection-text">Connecting...</span>
    </div>
    
    <script>
        const WS_URL = 'ws://localhost:${this.wsPort}';
        let ws = null;
        let flows = new Map();
        let stats = {};
        
        function connect() {
            ws = new WebSocket(WS_URL);
            
            ws.onopen = () => {
                console.log('Connected to monitor');
                updateConnectionStatus(true);
            };
            
            ws.onclose = () => {
                console.log('Disconnected from monitor');
                updateConnectionStatus(false);
                setTimeout(connect, 3000);
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleMessage(data);
            };
        }
        
        function handleMessage(data) {
            switch (data.type) {
                case 'initial_state':
                    data.flows.forEach(flow => flows.set(flow.id, flow));
                    stats = data.stats;
                    updateDisplay();
                    break;
                    
                case 'flow_update':
                case 'flow_status_update':
                    flows.set(data.flowId, data.data || data.flow);
                    updateDisplay();
                    break;
                    
                case 'flow_started':
                    console.log('Flow started:', data.flowId);
                    break;
                    
                case 'flow_completed':
                case 'flow_failed':
                    const flow = flows.get(data.flowId);
                    if (flow) {
                        flow.status = data.type === 'flow_completed' ? 'completed' : 'failed';
                        updateDisplay();
                    }
                    break;
            }
        }
        
        function updateDisplay() {
            updateStats();
            updateFlows();
        }
        
        function updateStats() {
            document.getElementById('total-flows').textContent = stats.totalFlows || 0;
            document.getElementById('active-flows').textContent = 
                Array.from(flows.values()).filter(f => f.status === 'active').length;
            document.getElementById('completed-flows').textContent = stats.completedFlows || 0;
            document.getElementById('failed-flows').textContent = stats.failedFlows || 0;
        }
        
        function updateFlows() {
            const activeFlows = Array.from(flows.values())
                .filter(f => f.status === 'active')
                .sort((a, b) => b.startTime - a.startTime);
                
            const recentFlows = Array.from(flows.values())
                .filter(f => f.status !== 'active')
                .sort((a, b) => b.startTime - a.startTime)
                .slice(0, 10);
            
            document.getElementById('active-flows-container').innerHTML = 
                activeFlows.map(f => createFlowCard(f)).join('');
                
            document.getElementById('recent-flows-container').innerHTML = 
                recentFlows.map(f => createFlowCard(f)).join('');
        }
        
        function createFlowCard(flow) {
            const stages = ['mvp_generation', 'forum_posting', 'game_transformation', 
                           'gaming_layer', 'database_persistence', 'learning'];
            const currentStageIndex = flow.stages ? flow.stages.length - 1 : -1;
            
            return \`
                <div class="flow-card \${flow.status}">
                    <div class="flow-header">
                        <div>
                            <div class="flow-id">\${flow.id}</div>
                            <div>Started: \${new Date(flow.startTime).toLocaleTimeString()}</div>
                        </div>
                        <div class="flow-status status-\${flow.status}">\${flow.status}</div>
                    </div>
                    
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: \${flow.progress || 0}%"></div>
                    </div>
                    
                    <div class="stages">
                        \${stages.map((stage, i) => \`
                            <div class="stage \${i < currentStageIndex ? 'complete' : ''} 
                                        \${i === currentStageIndex ? 'current' : ''}">
                                \${stage.replace('_', ' ')}
                            </div>
                        \`).join('')}
                    </div>
                    
                    \${flow.error ? \`<div style="color: #f44336; margin-top: 10px;">Error: \${flow.error}</div>\` : ''}
                </div>
            \`;
        }
        
        function updateConnectionStatus(connected) {
            const dot = document.getElementById('connection-dot');
            const text = document.getElementById('connection-text');
            
            if (connected) {
                dot.classList.remove('disconnected');
                text.textContent = 'Connected';
            } else {
                dot.classList.add('disconnected');
                text.textContent = 'Disconnected';
            }
        }
        
        // Update uptime
        setInterval(() => {
            if (stats.uptime) {
                const uptime = Math.floor((Date.now() - stats.uptime) / 1000);
                const hours = Math.floor(uptime / 3600);
                const minutes = Math.floor((uptime % 3600) / 60);
                const seconds = uptime % 60;
                
                document.getElementById('uptime').textContent = 
                    \`Uptime: \${hours}h \${minutes}m \${seconds}s\`;
            }
        }, 1000);
        
        // Start connection
        connect();
    </script>
</body>
</html>`;
    }
}

module.exports = FlowMonitorDashboard;

// Start if run directly
if (require.main === module) {
    const dashboard = new FlowMonitorDashboard();
    dashboard.start();
    
    // Demo: Simulate some flows for testing
    setTimeout(() => {
        console.log('📊 Simulating test flows...');
        
        // Simulate a successful flow
        const flowId1 = 'test-flow-' + Date.now();
        dashboard.trackFlow(flowId1, 'started', { request: 'Test MVP Generation' });
        
        setTimeout(() => dashboard.trackFlow(flowId1, 'mvp_generation', { mvpId: 'mvp-123' }), 1000);
        setTimeout(() => dashboard.trackFlow(flowId1, 'forum_posting', { postId: 456 }), 2000);
        setTimeout(() => dashboard.trackFlow(flowId1, 'game_transformation', { eventId: 'event-789' }), 3000);
        setTimeout(() => dashboard.trackFlow(flowId1, 'gaming_layer', { outcome: 'success' }), 4000);
        setTimeout(() => dashboard.trackFlow(flowId1, 'database_persistence', { dbId: 'db-101' }), 5000);
        setTimeout(() => dashboard.updateFlowStatus(flowId1, 'completed'), 6000);
        
        // Simulate a failed flow
        const flowId2 = 'test-flow-fail-' + Date.now();
        dashboard.trackFlow(flowId2, 'started', { request: 'Test Failed Flow' });
        
        setTimeout(() => dashboard.trackFlow(flowId2, 'mvp_generation', { mvpId: 'mvp-456' }), 1500);
        setTimeout(() => dashboard.updateFlowStatus(flowId2, 'failed', 'Forum API timeout'), 2500);
        
    }, 2000);
}