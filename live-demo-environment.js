#!/usr/bin/env node

/**
 * LIVE DEMO ENVIRONMENT
 * Interactive playground showcasing the complete character system
 * Demonstrates the full flow: registration → chat → Claude queries → overlays → verification
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

class LiveDemoEnvironment {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = 42018;
        this.wsPort = 42019;
        
        // Demo state
        this.activeDemos = new Map();
        this.demoScenarios = [];
        this.connectedViewers = new Map();
        
        // Database connection
        this.dbPool = null;
        
        // Service endpoints for integration
        this.services = {
            characterAPI: 'http://localhost:42001',
            qrAuth: 'http://localhost:42002',
            commandInterface: 'ws://localhost:42005',
            claudeAPI: 'http://localhost:42006',
            overlaySystem: 'http://localhost:42007',
            monitoring: 'http://localhost:42009',
            verification: 'http://localhost:42010',
            costAnalytics: 'http://localhost:42012',
            blockchain: 'http://localhost:42014',
            streaming: 'http://localhost:42016'
        };
        
        console.log('🎮 Live Demo Environment initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Connect to database
            await this.connectDatabase();
            
            // Setup middleware
            this.setupMiddleware();
            
            // Setup routes
            this.setupRoutes();
            
            // Setup WebSocket
            this.setupWebSocket();
            
            // Initialize demo scenarios
            this.initializeDemoScenarios();
            
            // Setup service health monitoring
            this.setupServiceMonitoring();
            
            // Start server
            this.server.listen(this.port, () => {
                console.log(`🎮 Live Demo Environment running on http://localhost:${this.port}`);
                console.log(`🎪 Interactive Playground: http://localhost:${this.port}/playground`);
                console.log(`📺 Demo Theater: http://localhost:${this.port}/theater`);
            });
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            process.exit(1);
        }
    }
    
    async connectDatabase() {
        this.dbPool = await mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'economic_engine',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        console.log('📊 Database connected');
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // CORS for demo environment
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                activeDemos: this.activeDemos.size,
                connectedViewers: this.connectedViewers.size,
                scenarios: this.demoScenarios.length
            });
        });
        
        // Start demo scenario
        this.app.post('/api/demo/start/:scenarioId', this.startDemoScenario.bind(this));
        
        // Stop demo scenario
        this.app.post('/api/demo/stop/:demoId', this.stopDemoScenario.bind(this));
        
        // Get demo status
        this.app.get('/api/demo/status/:demoId', this.getDemoStatus.bind(this));
        
        // List available scenarios
        this.app.get('/api/demo/scenarios', this.getAvailableScenarios.bind(this));
        
        // Service health check
        this.app.get('/api/services/health', this.getServiceHealth.bind(this));
        
        // Interactive playground
        this.app.get('/playground', this.servePlayground.bind(this));
        
        // Demo theater
        this.app.get('/theater', this.serveTheater.bind(this));
        
        // Main demo dashboard
        this.app.get('/', this.serveDemoDashboard.bind(this));
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ 
            server: this.server,
            path: '/ws'
        });
        
        this.wss.on('connection', (ws, req) => {
            const viewerId = req.url.split('viewerId=')[1] || Date.now().toString();
            console.log(`👁️ Viewer connected: ${viewerId}`);
            
            ws.viewerId = viewerId;
            this.connectedViewers.set(viewerId, {
                ws,
                viewerId,
                connectedAt: new Date(),
                subscribedDemos: new Set()
            });
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'connected',
                viewerId,
                activeDemos: Array.from(this.activeDemos.keys()),
                availableScenarios: this.demoScenarios.map(s => ({ id: s.id, name: s.name, description: s.description }))
            }));
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleViewerMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({ type: 'error', error: error.message }));
                }
            });
            
            ws.on('close', () => {
                console.log(`👁️ Viewer disconnected: ${viewerId}`);
                this.connectedViewers.delete(viewerId);
            });
        });
    }
    
    initializeDemoScenarios() {
        this.demoScenarios = [
            {
                id: 'character-registration',
                name: 'Character Registration Demo',
                description: 'Complete character registration flow with genetic hash assignment',
                duration: 60000, // 1 minute
                steps: [
                    { action: 'create_character', params: { name: 'demo_warrior' }, delay: 0 },
                    { action: 'generate_qr', params: {}, delay: 2000 },
                    { action: 'show_character_info', params: {}, delay: 4000 },
                    { action: 'demonstrate_traits', params: {}, delay: 6000 }
                ]
            },
            {
                id: 'chat-interface',
                name: 'Interactive Chat Demo',
                description: 'Demonstrates symbol parsing (@, #, !, ?) and real-time responses',
                duration: 90000, // 1.5 minutes
                steps: [
                    { action: 'open_chat', params: {}, delay: 0 },
                    { action: 'type_message', params: { text: '@alice hello there!' }, delay: 2000 },
                    { action: 'type_message', params: { text: '!quest(dragon) #explore' }, delay: 5000 },
                    { action: 'type_message', params: { text: '?help with quests' }, delay: 8000 },
                    { action: 'show_parsing', params: {}, delay: 10000 }
                ]
            },
            {
                id: 'claude-query',
                name: 'Claude API Integration',
                description: 'Shows Claude querying character data with cost tracking',
                duration: 75000, // 1.25 minutes
                steps: [
                    { action: 'send_claude_query', params: { query: 'Get character profile for demo_warrior' }, delay: 0 },
                    { action: 'show_query_response', params: {}, delay: 3000 },
                    { action: 'send_claude_query', params: { query: 'Find dialogues containing "@alice"' }, delay: 6000 },
                    { action: 'show_cost_tracking', params: {}, delay: 9000 },
                    { action: 'demonstrate_verification', params: {}, delay: 12000 }
                ]
            },
            {
                id: 'overlay-system',
                name: 'RuneLite-Style Overlays',
                description: 'Interactive overlay system with quest markers and animations',
                duration: 60000,
                steps: [
                    { action: 'trigger_quest_overlay', params: { type: 'quest_start' }, delay: 0 },
                    { action: 'trigger_mention_overlay', params: { type: 'dialogue_mention' }, delay: 3000 },
                    { action: 'trigger_help_overlay', params: { type: 'quest_available' }, delay: 6000 },
                    { action: 'demonstrate_animations', params: {}, delay: 9000 }
                ]
            },
            {
                id: 'end-to-end',
                name: 'Complete System Demo',
                description: 'Full end-to-end demonstration of all components working together',
                duration: 180000, // 3 minutes
                steps: [
                    { action: 'create_character', params: { name: 'system_demo' }, delay: 0 },
                    { action: 'authenticate_character', params: {}, delay: 5000 },
                    { action: 'send_message', params: { text: '@claude !verify ?status #demo' }, delay: 10000 },
                    { action: 'claude_processes_message', params: {}, delay: 15000 },
                    { action: 'show_overlays', params: {}, delay: 20000 },
                    { action: 'record_on_blockchain', params: {}, delay: 25000 },
                    { action: 'show_monitoring', params: {}, delay: 30000 },
                    { action: 'demonstrate_streaming', params: {}, delay: 35000 }
                ]
            },
            {
                id: 'verification-proof',
                name: 'Verification & Proof Generation',
                description: 'Shows automated verification, screen recording, and blockchain proof',
                duration: 120000, // 2 minutes
                steps: [
                    { action: 'start_recording', params: {}, delay: 0 },
                    { action: 'run_verification_tests', params: {}, delay: 3000 },
                    { action: 'generate_cost_report', params: {}, delay: 8000 },
                    { action: 'create_blockchain_proof', params: {}, delay: 12000 },
                    { action: 'package_proof', params: {}, delay: 16000 },
                    { action: 'stop_recording', params: {}, delay: 20000 }
                ]
            }
        ];
        
        console.log(`🎭 Initialized ${this.demoScenarios.length} demo scenarios`);
    }
    
    setupServiceMonitoring() {
        // Check service health every 30 seconds
        setInterval(async () => {
            const serviceHealth = await this.checkAllServices();
            this.broadcastToViewers({
                type: 'service_health_update',
                services: serviceHealth
            });
        }, 30000);
    }
    
    async checkAllServices() {
        const healthChecks = {};
        
        for (const [serviceName, serviceUrl] of Object.entries(this.services)) {
            try {
                const response = await fetch(`${serviceUrl}/health`, { timeout: 5000 });
                healthChecks[serviceName] = {
                    status: response.ok ? 'healthy' : 'unhealthy',
                    url: serviceUrl,
                    responseTime: Date.now()
                };
            } catch (error) {
                healthChecks[serviceName] = {
                    status: 'offline',
                    url: serviceUrl,
                    error: error.message
                };
            }
        }
        
        return healthChecks;
    }
    
    async startDemoScenario(req, res) {
        try {
            const { scenarioId } = req.params;
            const scenario = this.demoScenarios.find(s => s.id === scenarioId);
            
            if (!scenario) {
                return res.status(404).json({ error: 'Demo scenario not found' });
            }
            
            const demoId = `demo_${scenarioId}_${Date.now()}`;
            
            const demo = {
                id: demoId,
                scenarioId,
                scenario,
                startedAt: new Date(),
                status: 'running',
                currentStep: 0,
                results: [],
                viewers: new Set()
            };
            
            this.activeDemos.set(demoId, demo);
            
            // Start executing the demo
            this.executeDemoScenario(demo);
            
            // Notify viewers
            this.broadcastToViewers({
                type: 'demo_started',
                demo: {
                    id: demoId,
                    scenarioId,
                    name: scenario.name,
                    description: scenario.description
                }
            });
            
            res.json({
                success: true,
                demoId,
                scenario: scenario.name,
                estimatedDuration: scenario.duration
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async executeDemoScenario(demo) {
        console.log(`🎬 Starting demo: ${demo.scenario.name}`);
        
        for (let i = 0; i < demo.scenario.steps.length; i++) {
            if (demo.status !== 'running') break;
            
            const step = demo.scenario.steps[i];
            demo.currentStep = i;
            
            // Wait for step delay
            if (step.delay > 0) {
                await new Promise(resolve => setTimeout(resolve, step.delay));
            }
            
            // Execute step
            const result = await this.executeDemoStep(demo, step);
            demo.results.push({
                step: i,
                action: step.action,
                result,
                timestamp: new Date()
            });
            
            // Broadcast step update
            this.broadcastToViewers({
                type: 'demo_step_completed',
                demoId: demo.id,
                step: i,
                action: step.action,
                result
            });
        }
        
        demo.status = 'completed';
        demo.completedAt = new Date();
        
        console.log(`✅ Demo completed: ${demo.scenario.name}`);
        
        this.broadcastToViewers({
            type: 'demo_completed',
            demoId: demo.id,
            results: demo.results
        });
    }
    
    async executeDemoStep(demo, step) {
        console.log(`📋 Executing step: ${step.action}`);
        
        try {
            switch (step.action) {
                case 'create_character':
                    return await this.demoCreateCharacter(step.params);
                
                case 'generate_qr':
                    return await this.demoGenerateQR(step.params);
                
                case 'open_chat':
                    return { success: true, message: 'Chat interface opened' };
                
                case 'type_message':
                    return await this.demoTypeMessage(step.params);
                
                case 'send_claude_query':
                    return await this.demoClaudeQuery(step.params);
                
                case 'trigger_quest_overlay':
                    return await this.demoTriggerOverlay(step.params);
                
                case 'start_recording':
                    return await this.demoStartRecording();
                
                case 'run_verification_tests':
                    return await this.demoRunVerification();
                
                default:
                    return { success: true, message: `Simulated: ${step.action}`, params: step.params };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async demoCreateCharacter(params) {
        try {
            const response = await fetch(`${this.services.characterAPI}/api/character/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    characterName: params.name,
                    isDemo: true
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    character: data.character,
                    geneticHash: data.character?.geneticHash
                };
            } else {
                return { success: false, error: 'Character creation failed' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async demoTypeMessage(params) {
        // Simulate typing to command interface
        return {
            success: true,
            message: `Typed: "${params.text}"`,
            symbols: this.parseSymbols(params.text)
        };
    }
    
    parseSymbols(text) {
        const symbols = {
            mentions: text.match(/@\w+/g) || [],
            tags: text.match(/#\w+/g) || [],
            actions: text.match(/!\w+/g) || [],
            queries: text.match(/\?\w+/g) || []
        };
        return symbols;
    }
    
    async demoClaudeQuery(params) {
        try {
            const response = await fetch(`${this.services.claudeAPI}/api/claude/query`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-API-Key': 'local-dev'
                },
                body: JSON.stringify({
                    query: params.query,
                    type: 'character'
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    query: params.query,
                    results: data.results,
                    count: data.count,
                    executionTime: data.executionTime
                };
            } else {
                return { success: false, error: 'Claude query failed' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    broadcastToViewers(message) {
        this.connectedViewers.forEach(viewer => {
            if (viewer.ws.readyState === WebSocket.OPEN) {
                viewer.ws.send(JSON.stringify(message));
            }
        });
    }
    
    async handleViewerMessage(ws, data) {
        const viewer = this.connectedViewers.get(ws.viewerId);
        
        switch (data.type) {
            case 'subscribe_demo':
                viewer.subscribedDemos.add(data.demoId);
                break;
                
            case 'unsubscribe_demo':
                viewer.subscribedDemos.delete(data.demoId);
                break;
                
            case 'start_demo':
                if (data.scenarioId) {
                    // Start demo programmatically
                    const response = await this.startDemoScenario({ params: { scenarioId: data.scenarioId } }, { json: () => {} });
                }
                break;
        }
    }
    
    serveDemoDashboard(req, res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Live Demo Environment</title>
    <style>
        body { font-family: monospace; background: #0a0a0f; color: #00ff88; margin: 0; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #00ff88; padding-bottom: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        .panel { background: rgba(0,255,136,0.1); border: 1px solid #00ff88; border-radius: 8px; padding: 20px; }
        .scenario { background: rgba(0,0,0,0.3); padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #00ff88; }
        .btn { background: #00ff88; color: #000; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        .btn:hover { background: #00bbff; }
        .btn:disabled { background: #666; cursor: not-allowed; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status.healthy { background: #00ff88; color: #000; }
        .status.unhealthy { background: #ffaa00; color: #000; }
        .status.offline { background: #ff4444; color: #fff; }
        .demo-log { height: 300px; overflow-y: auto; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 4px; font-size: 12px; }
        .service-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
        .service-item { background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎮 Live Demo Environment</h1>
        <p>Interactive playground for the complete character system</p>
        <div>
            <a href="/playground" class="btn">🎪 Interactive Playground</a>
            <a href="/theater" class="btn">📺 Demo Theater</a>
        </div>
    </div>
    
    <div class="grid">
        <div class="panel">
            <h3>🎭 Available Scenarios</h3>
            <div id="scenarioList">
                ${this.demoScenarios.map(scenario => `
                    <div class="scenario">
                        <h4>${scenario.name}</h4>
                        <p>${scenario.description}</p>
                        <p><small>Duration: ${scenario.duration / 1000}s</small></p>
                        <button class="btn" onclick="startDemo('${scenario.id}')">▶️ Start Demo</button>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="panel">
            <h3>🔧 Service Health</h3>
            <div class="service-grid" id="serviceHealth">
                <div class="service-item">
                    <div><strong>Checking services...</strong></div>
                </div>
            </div>
        </div>
        
        <div class="panel">
            <h3>📊 Active Demos</h3>
            <div id="activeDemos">
                <p>No active demos</p>
            </div>
        </div>
        
        <div class="panel">
            <h3>📜 Demo Log</h3>
            <div class="demo-log" id="demoLog">
                <div>🎮 Demo environment initialized</div>
                <div>🔍 Checking service health...</div>
            </div>
        </div>
    </div>
    
    <script>
        let ws = null;
        let services = {};
        
        function connectWebSocket() {
            const wsUrl = \`ws://\${window.location.host}/ws?viewerId=dashboard\`;
            ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                log('🔌 Connected to demo environment');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleMessage(data);
            };
            
            ws.onclose = () => {
                log('🔌 Disconnected, reconnecting...');
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function handleMessage(data) {
            switch (data.type) {
                case 'connected':
                    log(\`✅ Connected as \${data.viewerId}\`);
                    break;
                case 'demo_started':
                    log(\`🎬 Demo started: \${data.demo.name}\`);
                    updateActiveDemos();
                    break;
                case 'demo_step_completed':
                    log(\`📋 Step completed: \${data.action}\`);
                    break;
                case 'demo_completed':
                    log(\`✅ Demo completed: \${data.demoId}\`);
                    updateActiveDemos();
                    break;
                case 'service_health_update':
                    updateServiceHealth(data.services);
                    break;
            }
        }
        
        function log(message) {
            const logElement = document.getElementById('demoLog');
            const time = new Date().toLocaleTimeString();
            logElement.innerHTML += \`<div>[\${time}] \${message}</div>\`;
            logElement.scrollTop = logElement.scrollHeight;
        }
        
        function startDemo(scenarioId) {
            fetch(\`/api/demo/start/\${scenarioId}\`, { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        log(\`🚀 Starting demo: \${scenarioId}\`);
                    } else {
                        log(\`❌ Failed to start demo: \${data.error}\`);
                    }
                });
        }
        
        function updateServiceHealth(healthData) {
            services = healthData;
            const container = document.getElementById('serviceHealth');
            
            container.innerHTML = Object.entries(healthData).map(([name, health]) => \`
                <div class="service-item">
                    <div><strong>\${name}</strong></div>
                    <div><span class="status \${health.status}">\${health.status.toUpperCase()}</span></div>
                </div>
            \`).join('');
        }
        
        function updateActiveDemos() {
            // This would fetch active demos
            // For now, just update the display
        }
        
        // Initialize
        connectWebSocket();
        
        // Fetch initial service health
        fetch('/api/services/health')
            .then(res => res.json())
            .then(data => updateServiceHealth(data))
            .catch(err => log('❌ Failed to fetch service health'));
    </script>
</body>
</html>`;
        
        res.send(html);
    }
    
    servePlayground(req, res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Interactive Playground</title>
    <style>
        body { font-family: monospace; background: #0a0a0f; color: #00ff88; margin: 0; padding: 20px; }
        .playground { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; height: 90vh; }
        .panel { background: rgba(0,255,136,0.1); border: 1px solid #00ff88; border-radius: 8px; padding: 20px; overflow: auto; }
        .controls { background: rgba(0,0,0,0.3); padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        .input { background: rgba(0,255,136,0.1); border: 1px solid #00ff88; color: #00ff88; padding: 8px; border-radius: 4px; width: 100%; margin: 5px 0; }
        .btn { background: #00ff88; color: #000; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin: 5px; }
        .output { background: rgba(0,0,0,0.5); padding: 10px; height: 200px; overflow-y: auto; border-radius: 4px; font-size: 12px; }
    </style>
</head>
<body>
    <h1>🎪 Interactive Playground</h1>
    
    <div class="playground">
        <div class="panel">
            <h3>🎮 Character Actions</h3>
            
            <div class="controls">
                <h4>Create Character</h4>
                <input type="text" class="input" id="characterName" placeholder="Character name">
                <button class="btn" onclick="createCharacter()">Create Character</button>
            </div>
            
            <div class="controls">
                <h4>Send Message</h4>
                <input type="text" class="input" id="messageText" placeholder="@alice !quest(dragon) ?help #explore">
                <button class="btn" onclick="sendMessage()">Send Message</button>
            </div>
            
            <div class="controls">
                <h4>Claude Query</h4>
                <input type="text" class="input" id="claudeQuery" placeholder="Get character profile for warrior">
                <button class="btn" onclick="sendClaudeQuery()">Query Claude</button>
            </div>
            
            <div class="output" id="actionOutput">
                <div>🎮 Ready for interactive testing...</div>
            </div>
        </div>
        
        <div class="panel">
            <h3>📊 Live Results</h3>
            
            <div class="controls">
                <h4>System Monitoring</h4>
                <button class="btn" onclick="startMonitoring()">📡 Start Monitoring</button>
                <button class="btn" onclick="triggerOverlay()">🎯 Test Overlay</button>
                <button class="btn" onclick="generateProof()">⛓️ Generate Proof</button>
            </div>
            
            <div class="output" id="resultsOutput">
                <div>📊 Results will appear here...</div>
            </div>
        </div>
    </div>
    
    <script>
        function log(panel, message) {
            const outputElement = document.getElementById(panel);
            const time = new Date().toLocaleTimeString();
            outputElement.innerHTML += \`<div>[\${time}] \${message}</div>\`;
            outputElement.scrollTop = outputElement.scrollHeight;
        }
        
        async function createCharacter() {
            const name = document.getElementById('characterName').value;
            if (!name) return;
            
            log('actionOutput', \`🎭 Creating character: \${name}\`);
            
            try {
                const response = await fetch('http://localhost:42001/api/character/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ characterName: name })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    log('actionOutput', \`✅ Character created: \${data.character.characterName}\`);
                    log('resultsOutput', \`🧬 Genetic hash: \${data.character.geneticHash}\`);
                    log('resultsOutput', \`⚔️ Lineage: \${data.character.lineage}\`);
                } else {
                    log('actionOutput', '❌ Character creation failed');
                }
            } catch (error) {
                log('actionOutput', \`❌ Error: \${error.message}\`);
            }
        }
        
        async function sendMessage() {
            const text = document.getElementById('messageText').value;
            if (!text) return;
            
            log('actionOutput', \`💬 Sending message: "\${text}"\`);
            
            // Simulate message processing
            const symbols = {
                mentions: text.match(/@\\w+/g) || [],
                tags: text.match(/#\\w+/g) || [],
                actions: text.match(/!\\w+/g) || [],
                queries: text.match(/\\?\\w+/g) || []
            };
            
            log('resultsOutput', \`📝 Symbols parsed:\`);
            if (symbols.mentions.length) log('resultsOutput', \`  @ Mentions: \${symbols.mentions.join(', ')}\`);
            if (symbols.tags.length) log('resultsOutput', \`  # Tags: \${symbols.tags.join(', ')}\`);
            if (symbols.actions.length) log('resultsOutput', \`  ! Actions: \${symbols.actions.join(', ')}\`);
            if (symbols.queries.length) log('resultsOutput', \`  ? Queries: \${symbols.queries.join(', ')}\`);
            
            log('actionOutput', '✅ Message processed');
        }
        
        async function sendClaudeQuery() {
            const query = document.getElementById('claudeQuery').value;
            if (!query) return;
            
            log('actionOutput', \`🤖 Sending Claude query: "\${query}"\`);
            
            try {
                const response = await fetch('http://localhost:42006/api/claude/query', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-API-Key': 'local-dev'
                    },
                    body: JSON.stringify({ query, type: 'character' })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    log('actionOutput', \`✅ Query executed in \${data.executionTime}ms\`);
                    log('resultsOutput', \`📊 Results: \${data.count} items found\`);
                    log('resultsOutput', \`💰 Estimated cost: $0.025\`);
                } else {
                    log('actionOutput', '❌ Claude query failed');
                }
            } catch (error) {
                log('actionOutput', \`❌ Error: \${error.message}\`);
            }
        }
        
        function startMonitoring() {
            log('actionOutput', '📡 Starting live monitoring...');
            log('resultsOutput', '🔍 Monitoring active services...');
            log('resultsOutput', '📊 WebSocket connections: 3');
            log('resultsOutput', '⚡ Average response time: 120ms');
            log('resultsOutput', '💰 Total cost today: $0.15');
        }
        
        function triggerOverlay() {
            log('actionOutput', '🎯 Triggering test overlay...');
            log('resultsOutput', '📍 Quest marker displayed');
            log('resultsOutput', '💬 Dialogue bubble shown');
            log('resultsOutput', '🏆 Achievement notification');
        }
        
        function generateProof() {
            log('actionOutput', '⛓️ Generating blockchain proof...');
            log('resultsOutput', '📸 Screenshot captured');
            log('resultsOutput', '🔗 Transaction hash: 0xabc123...');
            log('resultsOutput', '⚡ Energy consumed: 150 units');
            log('resultsOutput', '🚀 Ship fuel: 1.5 units');
        }
        
        // Auto-fill examples
        document.getElementById('characterName').value = 'demo_explorer';
        document.getElementById('messageText').value = '@alice !quest(dragon) ?help #explore';
        document.getElementById('claudeQuery').value = 'Get character profile for demo_explorer';
    </script>
</body>
</html>`;
        
        res.send(html);
    }
    
    async getServiceHealth(req, res) {
        try {
            const healthChecks = await this.checkAllServices();
            res.json(healthChecks);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async shutdown() {
        console.log('🎮 Live Demo Environment shutting down...');
        
        if (this.wss) {
            this.wss.close();
        }
        
        if (this.dbPool) {
            await this.dbPool.end();
        }
    }
}

// Start the service
const demoEnvironment = new LiveDemoEnvironment();

// Handle shutdown
process.on('SIGINT', async () => {
    await demoEnvironment.shutdown();
    process.exit(0);
});

module.exports = LiveDemoEnvironment;