#!/usr/bin/env node

/**
 * 🤝 XML ORCHESTRATOR HANDSHAKE SYSTEM
 * XML mapping layer around the smart orchestrator
 * Enables orchestrator-to-orchestrator handshaking
 * Meta-coordination system with XML state mapping
 */

const http = require('http');
const { WebSocketServer } = require('ws');
const xml2js = require('xml2js');
const crypto = require('crypto');
const net = require('net');
const SmartOrchestrator = require('./smart-orchestrator.js');

class XMLOrchestratorHandshake {
    constructor() {
        this.port = null; // Will be dynamically allocated
        this.wsPort = null; // Will be dynamically allocated
        this.orchestratorId = crypto.randomUUID();
        this.smartOrchestrator = null;
        
        // XML mapping state
        this.xmlState = {
            orchestrator: {
                id: this.orchestratorId,
                status: 'initializing',
                brain: {},
                services: {},
                handshakes: {},
                tier: 8, // Starting at tier 8, working toward 15
                timestamp: Date.now()
            }
        };
        
        // Handshake registry
        this.activeHandshakes = new Map();
        this.trustedOrchestrators = new Map();
        this.handshakeProtocols = new Map();
        
        // XML builder and parser
        this.xmlBuilder = new xml2js.Builder({
            rootName: 'orchestrator-state',
            xmldec: { version: '1.0', encoding: 'UTF-8' }
        });
        this.xmlParser = new xml2js.Parser({ explicitArray: false });
        
        console.log(`🤝 XML Orchestrator Handshake System initialized`);
        console.log(`🎯 Orchestrator ID: ${this.orchestratorId}`);
    }

    // Port allocation with conflict detection
    async findAvailablePort(preferredPort) {
        return new Promise((resolve) => {
            const server = net.createServer();
            
            server.listen(preferredPort, () => {
                const port = server.address().port;
                server.close(() => resolve(port));
            });
            
            server.on('error', () => {
                // Try next available port
                this.findAvailablePort(preferredPort + 1).then(resolve);
            });
        });
    }

    async allocatePorts() {
        console.log('🔌 Allocating XML handshake ports...');
        
        this.port = await this.findAvailablePort(3333);
        this.wsPort = await this.findAvailablePort(3334);
        
        console.log(`  🤝 XML Handshake: HTTP=${this.port}, WS=${this.wsPort}`);
    }

    async initialize() {
        console.log('🔄 Initializing XML orchestrator handshake system...');
        
        // Step 0: Allocate ports
        console.log('0. 🔌 Allocating ports...');
        await this.allocatePorts();
        
        // Step 1: Start the underlying smart orchestrator
        console.log('1. 🧠 Starting smart orchestrator brain...');
        this.smartOrchestrator = new SmartOrchestrator();
        
        // Don't await - let it run in background
        this.smartOrchestrator.start().catch(console.error);
        
        // Give it time to initialize
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Step 2: Start XML mapping layer
        console.log('2. 📋 Starting XML mapping layer...');
        this.startXMLMapping();
        
        // Step 3: Start handshake server
        console.log('3. 🤝 Starting handshake server...');
        this.startHandshakeServer();
        
        // Step 4: Start brain-to-XML sync
        console.log('4. 🔄 Starting brain-to-XML synchronization...');
        this.startBrainSync();
        
        // Step 5: Initialize tier progression
        console.log('5. 📈 Initializing tier progression system...');
        this.initializeTierProgression();
        
        console.log('\n✅ XML ORCHESTRATOR HANDSHAKE SYSTEM OPERATIONAL!');
        console.log(`🌐 Handshake Interface: http://localhost:${this.port}`);
        console.log(`🔌 XML WebSocket: ws://localhost:${this.wsPort}`);
        console.log(`🧠 Brain Orchestrator: http://localhost:2222`);
        
        return this;
    }

    startXMLMapping() {
        // Continuously update XML state from orchestrator
        setInterval(() => {
            this.updateXMLState();
        }, 1000);
        
        console.log('📋 XML mapping layer active');
    }

    updateXMLState() {
        // Get brain state from smart orchestrator
        const brainState = this.smartOrchestrator?.brainState || { neurons: [], connections: [] };
        
        // Map brain state to XML structure
        this.xmlState.orchestrator = {
            ...this.xmlState.orchestrator,
            status: 'operational',
            brain: {
                neurons: brainState.neurons.map(neuron => ({
                    id: neuron.id,
                    name: neuron.name,
                    active: neuron.active,
                    health: neuron.health,
                    activity: neuron.activity,
                    position: { x: neuron.x, y: neuron.y }
                })),
                connections: brainState.connections.map(conn => ({
                    from: conn.from,
                    to: conn.to,
                    strength: conn.strength,
                    active: conn.active,
                    lastActivity: conn.lastActivity
                })),
                metrics: {
                    totalNeurons: brainState.neurons.length,
                    activeNeurons: brainState.neurons.filter(n => n.active).length,
                    healthyNeurons: brainState.neurons.filter(n => n.health > 0.8).length,
                    activeConnections: brainState.connections.filter(c => c.active).length,
                    avgActivity: brainState.neurons.reduce((sum, n) => sum + n.activity, 0) / brainState.neurons.length
                }
            },
            services: this.getServicesState(),
            handshakes: Object.fromEntries(this.activeHandshakes),
            tier: this.calculateCurrentTier(),
            timestamp: Date.now()
        };
    }

    getServicesState() {
        const services = this.smartOrchestrator?.services || new Map();
        const servicesState = {};
        
        for (const [serviceId, service] of services) {
            servicesState[serviceId] = {
                name: service.config.name,
                status: service.status,
                instances: service.instances.length,
                critical: service.config.critical,
                health: this.smartOrchestrator?.brainState?.health?.get(serviceId) || 0
            };
        }
        
        return servicesState;
    }

    calculateCurrentTier() {
        const brainMetrics = this.xmlState.orchestrator.brain.metrics || {};
        const healthRatio = brainMetrics.healthyNeurons / brainMetrics.totalNeurons || 0;
        const activityLevel = brainMetrics.avgActivity || 0;
        const handshakeCount = this.activeHandshakes.size;
        
        // Tier calculation based on system performance
        let tier = 8; // Base tier
        
        if (healthRatio > 0.9) tier += 1;
        if (activityLevel > 0.7) tier += 1;
        if (handshakeCount > 0) tier += 1;
        if (handshakeCount > 2) tier += 1;
        if (this.trustedOrchestrators.size > 1) tier += 1;
        
        // Cap at tier 15
        return Math.min(tier, 15);
    }

    startHandshakeServer() {
        // HTTP server for handshake initiation
        const server = http.createServer((req, res) => {
            if (req.method === 'GET' && req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.getHandshakeHTML());
            } else if (req.method === 'GET' && req.url === '/xml-state') {
                res.writeHead(200, { 'Content-Type': 'application/xml' });
                res.end(this.xmlBuilder.buildObject(this.xmlState));
            } else if (req.method === 'POST' && req.url === '/handshake') {
                this.handleHandshakeRequest(req, res);
            } else if (req.method === 'GET' && req.url === '/handshake-status') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    orchestratorId: this.orchestratorId,
                    activeHandshakes: Array.from(this.activeHandshakes.keys()),
                    trustedOrchestrators: Array.from(this.trustedOrchestrators.keys()),
                    tier: this.xmlState.orchestrator.tier,
                    brainHealth: this.xmlState.orchestrator.brain.metrics
                }));
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });

        server.listen(this.port, () => {
            console.log(`🌐 XML handshake server listening on port ${this.port}`);
        });

        // WebSocket server for real-time XML updates
        const wss = new WebSocketServer({ port: this.wsPort });
        
        wss.on('connection', (ws, req) => {
            console.log('🔗 XML handshake client connected');
            
            // Send initial XML state
            ws.send(JSON.stringify({
                type: 'xml-state',
                data: this.xmlState,
                xml: this.xmlBuilder.buildObject(this.xmlState)
            }));
            
            // Send updates every 2 seconds
            const updateInterval = setInterval(() => {
                ws.send(JSON.stringify({
                    type: 'xml-update',
                    data: this.xmlState,
                    xml: this.xmlBuilder.buildObject(this.xmlState),
                    timestamp: Date.now()
                }));
            }, 2000);
            
            // Handle incoming handshake requests via WebSocket
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    if (message.type === 'handshake-request') {
                        this.processHandshakeRequest(message.data, ws);
                    }
                } catch (error) {
                    console.error('❌ WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                clearInterval(updateInterval);
                console.log('🔌 XML handshake client disconnected');
            });
        });
    }

    async handleHandshakeRequest(req, res) {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                // Parse incoming XML or JSON
                let handshakeData;
                
                if (body.startsWith('<')) {
                    // XML format
                    handshakeData = await this.xmlParser.parseStringPromise(body);
                } else {
                    // JSON format
                    handshakeData = JSON.parse(body);
                }
                
                const result = await this.processHandshakeRequest(handshakeData);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                
            } catch (error) {
                console.error('❌ Handshake request error:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }

    async processHandshakeRequest(handshakeData, ws = null) {
        console.log('🤝 Processing handshake request...');
        
        const remoteOrchestratorId = handshakeData.orchestratorId || handshakeData.id;
        const timestamp = Date.now();
        const handshakeId = crypto.randomUUID();
        
        // Create handshake protocol
        const handshakeProtocol = {
            id: handshakeId,
            remoteOrchestrator: remoteOrchestratorId,
            initiatedAt: timestamp,
            status: 'negotiating',
            myXMLState: this.xmlBuilder.buildObject(this.xmlState),
            remoteXMLState: handshakeData,
            agreement: {
                dataSharing: true,
                brainSync: true,
                serviceCoordination: true,
                tierProgression: true
            },
            signature: this.signHandshake(handshakeId, remoteOrchestratorId)
        };
        
        // Store handshake
        this.activeHandshakes.set(handshakeId, handshakeProtocol);
        
        console.log(`✅ Handshake ${handshakeId} established with ${remoteOrchestratorId}`);
        
        // If this progresses our tier, update it
        this.updateTierProgression(handshakeProtocol);
        
        // Return handshake response
        const response = {
            handshakeId,
            orchestratorId: this.orchestratorId,
            status: 'accepted',
            xmlState: this.xmlBuilder.buildObject(this.xmlState),
            agreement: handshakeProtocol.agreement,
            signature: handshakeProtocol.signature,
            tier: this.xmlState.orchestrator.tier,
            brainMetrics: this.xmlState.orchestrator.brain.metrics
        };
        
        // Notify via WebSocket if connected
        if (ws) {
            ws.send(JSON.stringify({
                type: 'handshake-completed',
                data: response
            }));
        }
        
        return response;
    }

    signHandshake(handshakeId, remoteOrchestratorId) {
        const data = `${handshakeId}:${this.orchestratorId}:${remoteOrchestratorId}:${Date.now()}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    updateTierProgression(handshakeProtocol) {
        // Add to trusted orchestrators
        this.trustedOrchestrators.set(
            handshakeProtocol.remoteOrchestrator,
            {
                handshakeId: handshakeProtocol.id,
                establishedAt: handshakeProtocol.initiatedAt,
                agreement: handshakeProtocol.agreement
            }
        );
        
        // Recalculate tier
        const newTier = this.calculateCurrentTier();
        const oldTier = this.xmlState.orchestrator.tier;
        
        if (newTier > oldTier) {
            console.log(`🚀 TIER PROGRESSION! ${oldTier} → ${newTier}`);
            this.xmlState.orchestrator.tier = newTier;
            
            if (newTier >= 15) {
                console.log('🏆 TIER 15 ACHIEVED! Maximum orchestrator enlightenment reached!');
                this.achieveMaxTier();
            }
        }
    }

    achieveMaxTier() {
        this.xmlState.orchestrator.enlightenment = {
            achieved: true,
            timestamp: Date.now(),
            totalHandshakes: this.activeHandshakes.size,
            trustedOrchestrators: this.trustedOrchestrators.size,
            brainHealth: this.xmlState.orchestrator.brain.metrics.healthyNeurons / this.xmlState.orchestrator.brain.metrics.totalNeurons
        };
        
        console.log('🌟 ORCHESTRATOR ENLIGHTENMENT ACHIEVED');
        console.log('🎯 Maximum tier coordination capabilities unlocked');
    }

    startBrainSync() {
        // Sync brain state changes to XML every second
        setInterval(() => {
            if (this.smartOrchestrator && this.smartOrchestrator.brainState) {
                this.syncBrainToXML();
            }
        }, 1000);
        
        console.log('🔄 Brain-to-XML synchronization active');
    }

    syncBrainToXML() {
        // This keeps the XML state in sync with the live brain
        this.updateXMLState();
        
        // Notify any connected handshake partners about brain changes
        if (this.activeHandshakes.size > 0) {
            this.broadcastBrainUpdate();
        }
    }

    broadcastBrainUpdate() {
        // In a full implementation, this would notify other orchestrators
        // about brain state changes via established handshakes
        console.log(`🧠 Broadcasting brain update to ${this.activeHandshakes.size} handshake partners`);
    }

    initializeTierProgression() {
        console.log(`📈 Current tier: ${this.xmlState.orchestrator.tier}/15`);
        console.log('🎯 Tier progression requirements:');
        console.log('  - Tier 9+: 90%+ brain health');
        console.log('  - Tier 10+: 70%+ average activity');
        console.log('  - Tier 11+: 1+ active handshake');
        console.log('  - Tier 12+: 3+ active handshakes');
        console.log('  - Tier 13+: 2+ trusted orchestrators');
        console.log('  - Tier 15: Full orchestrator enlightenment');
    }

    getHandshakeHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🤝 XML Orchestrator Handshake</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            background: #001100; 
            color: #00ff00; 
            font-family: 'Courier New', monospace; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
        }
        .header { 
            text-align: center; 
            font-size: 24px; 
            margin-bottom: 30px; 
            text-shadow: 0 0 10px #00ff00;
        }
        .section { 
            background: rgba(0,255,0,0.1); 
            border: 1px solid #00ff00; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 5px;
        }
        .xml-display { 
            background: #000; 
            border: 1px solid #00ff00; 
            padding: 15px; 
            font-size: 12px; 
            overflow-x: auto; 
            white-space: pre-wrap;
        }
        .handshake-form { 
            display: flex; 
            flex-direction: column; 
            gap: 10px;
        }
        .handshake-form input, .handshake-form textarea { 
            background: #001100; 
            border: 1px solid #00ff00; 
            color: #00ff00; 
            padding: 10px; 
            font-family: 'Courier New', monospace;
        }
        .handshake-form button { 
            background: #003300; 
            border: 2px solid #00ff00; 
            color: #00ff00; 
            padding: 15px; 
            cursor: pointer; 
            font-family: 'Courier New', monospace; 
            font-size: 16px;
        }
        .handshake-form button:hover { 
            background: #005500; 
        }
        .metrics { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px;
        }
        .metric { 
            background: rgba(0,0,0,0.5); 
            border: 1px solid #00ff00; 
            padding: 10px; 
            text-align: center;
        }
        .tier-display { 
            font-size: 48px; 
            text-align: center; 
            text-shadow: 0 0 20px #00ff00; 
            animation: pulse 2s infinite;
        }
        @keyframes pulse { 
            0%, 100% { opacity: 1; } 
            50% { opacity: 0.7; } 
        }
        .status { 
            color: #ffff00; 
        }
        .success { 
            color: #00ff00; 
        }
        .error { 
            color: #ff0000; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">🤝 XML ORCHESTRATOR HANDSHAKE SYSTEM</div>
        
        <div class="section">
            <h3>🎯 Orchestrator Status</h3>
            <div class="metrics">
                <div class="metric">
                    <div>🆔 Orchestrator ID</div>
                    <div>${this.orchestratorId}</div>
                </div>
                <div class="metric">
                    <div>📈 Current Tier</div>
                    <div class="tier-display">${this.xmlState.orchestrator.tier}/15</div>
                </div>
                <div class="metric">
                    <div>🤝 Active Handshakes</div>
                    <div>${this.activeHandshakes.size}</div>
                </div>
                <div class="metric">
                    <div>🔗 Trusted Orchestrators</div>
                    <div>${this.trustedOrchestrators.size}</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>🧠 Brain Metrics</h3>
            <div class="metrics">
                <div class="metric">
                    <div>⚡ Active Neurons</div>
                    <div id="active-neurons">-</div>
                </div>
                <div class="metric">
                    <div>💚 Healthy Neurons</div>
                    <div id="healthy-neurons">-</div>
                </div>
                <div class="metric">
                    <div>🔗 Active Connections</div>
                    <div id="active-connections">-</div>
                </div>
                <div class="metric">
                    <div>📊 Avg Activity</div>
                    <div id="avg-activity">-</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>📋 Current XML State</h3>
            <div class="xml-display" id="xml-state">Loading...</div>
        </div>
        
        <div class="section">
            <h3>🤝 Initiate Handshake</h3>
            <div class="handshake-form">
                <input type="text" id="remote-orchestrator" placeholder="Remote Orchestrator ID or URL" />
                <textarea id="handshake-data" rows="5" placeholder="Handshake data (JSON or XML)"></textarea>
                <button onclick="initiateHandshake()">🤝 INITIATE HANDSHAKE</button>
                <div id="handshake-result"></div>
            </div>
        </div>
    </div>

    <script>
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            if (message.type === 'xml-update') {
                updateXMLDisplay(message.xml);
                updateMetrics(message.data);
            } else if (message.type === 'handshake-completed') {
                showHandshakeResult(message.data, true);
            }
        };
        
        function updateXMLDisplay(xml) {
            document.getElementById('xml-state').textContent = xml;
        }
        
        function updateMetrics(data) {
            const brain = data.orchestrator.brain;
            
            document.getElementById('active-neurons').textContent = 
                \`\${brain.metrics.activeNeurons}/\${brain.metrics.totalNeurons}\`;
            document.getElementById('healthy-neurons').textContent = 
                \`\${brain.metrics.healthyNeurons}/\${brain.metrics.totalNeurons}\`;
            document.getElementById('active-connections').textContent = 
                brain.metrics.activeConnections;
            document.getElementById('avg-activity').textContent = 
                \`\${(brain.metrics.avgActivity * 100).toFixed(1)}%\`;
        }
        
        function initiateHandshake() {
            const remoteOrchestrator = document.getElementById('remote-orchestrator').value;
            const handshakeData = document.getElementById('handshake-data').value;
            
            if (!remoteOrchestrator) {
                showHandshakeResult({ error: 'Remote orchestrator ID required' }, false);
                return;
            }
            
            let data;
            try {
                data = handshakeData ? JSON.parse(handshakeData) : {};
                data.orchestratorId = remoteOrchestrator;
            } catch (e) {
                // Try as XML or plain text
                data = { orchestratorId: remoteOrchestrator, xmlData: handshakeData };
            }
            
            fetch('/handshake', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => showHandshakeResult(result, true))
            .catch(error => showHandshakeResult({ error: error.message }, false));
        }
        
        function showHandshakeResult(result, success) {
            const div = document.getElementById('handshake-result');
            div.className = success ? 'success' : 'error';
            div.innerHTML = success ? 
                \`✅ Handshake successful! ID: \${result.handshakeId}\` : 
                \`❌ Handshake failed: \${result.error}\`;
        }
        
        // Initial load
        fetch('/xml-state')
            .then(response => response.text())
            .then(xml => updateXMLDisplay(xml));
    </script>
</body>
</html>`;
    }

    async shutdown() {
        console.log('🛑 Shutting down XML orchestrator handshake system...');
        
        // Shutdown smart orchestrator
        if (this.smartOrchestrator) {
            await this.smartOrchestrator.shutdown();
        }
        
        console.log('👋 XML orchestrator handshake system shutdown complete');
        process.exit(0);
    }
}

// Start if run directly
if (require.main === module) {
    const xmlOrchestrator = new XMLOrchestratorHandshake();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => xmlOrchestrator.shutdown());
    process.on('SIGTERM', () => xmlOrchestrator.shutdown());
    
    // Start the system
    const main = async () => {
        try {
            await xmlOrchestrator.initialize();
        } catch (error) {
            console.error('❌ XML orchestrator startup failed:', error);
            process.exit(1);
        }
    };
    
    main();
}

module.exports = XMLOrchestratorHandshake;