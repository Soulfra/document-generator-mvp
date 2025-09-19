#!/usr/bin/env node

/**
 * 🗺️👁️ XML MAPPING VIEWER
 * ========================
 * Real-time visualization of XML data flow through all five layers
 * Provides comprehensive monitoring and telemetry
 */

const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');
const crypto = require('crypto');
const http = require('http');

class XMLMappingViewer {
    constructor() {
        this.vizDir = path.join(process.cwd(), '.reasoning-viz');
        this.viewerDir = path.join(this.vizDir, 'xml-viewer');
        
        // Viewer HTTP server
        this.httpServer = null;
        this.httpPort = 8099;
        
        // WebSocket server for viewer clients
        this.viewerWsServer = null;
        this.viewerClients = new Set();
        
        // Connections to all five layers
        this.layerConnections = {
            'gaming-engine': { 
                port: 8098, 
                ws: null, 
                connected: false,
                data: new Map(),
                flowRate: 0
            },
            'meta-orchestrator': { 
                port: 8097, 
                ws: null, 
                connected: false,
                data: new Map(),
                flowRate: 0
            },
            'licensing-compliance': { 
                port: 8094, 
                ws: null, 
                connected: false,
                data: new Map(),
                flowRate: 0
            },
            'xml-stream-integration': { 
                port: 8091, 
                ws: null, 
                connected: false,
                data: new Map(),
                flowRate: 0
            }
        };
        
        // XML mapping state
        this.xmlMappingState = {
            totalNodes: 0,
            activeFlows: 0,
            messagesPerSecond: 0,
            dataVolume: 0,
            lastUpdate: null,
            
            // Per-tier tracking
            tierStates: new Map(),
            
            // Flow tracking
            flowHistory: [],
            maxHistorySize: 1000,
            
            // Performance metrics
            latencyMap: new Map(),
            throughputMap: new Map()
        };
        
        // XML flow telemetry
        this.telemetry = {
            startTime: Date.now(),
            totalMessages: 0,
            totalBytes: 0,
            errorCount: 0,
            
            layerMetrics: new Map(),
            tierMetrics: new Map(),
            
            // Real-time metrics
            currentTPS: 0, // Transactions per second
            currentBPS: 0, // Bytes per second
            averageLatency: 0
        };
        
        this.logger = require('./reasoning-logger');
        this.init();
    }
    
    async init() {
        await this.setupViewerDirectories();
        await this.createViewerInterface();
        await this.startHTTPServer();
        await this.startViewerWebSocketServer();
        await this.connectToAllLayers();
        await this.startTelemetryCollection();
        
        console.log('🗺️👁️ XML MAPPING VIEWER ACTIVE');
        console.log('==============================');
        console.log(`🌐 Viewer Interface: http://localhost:${this.httpPort}`);
        console.log('📊 Real-time XML flow visualization');
        console.log('🔍 Multi-layer telemetry monitoring');
        console.log('📈 Performance metrics dashboard');
    }
    
    async setupViewerDirectories() {
        const dirs = [
            this.viewerDir,
            path.join(this.viewerDir, 'telemetry'),
            path.join(this.viewerDir, 'snapshots'),
            path.join(this.viewerDir, 'recordings')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    async createViewerInterface() {
        console.log('🎨 Creating XML mapping viewer interface...');
        
        const viewerHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🗺️👁️ XML Mapping Viewer - Live Flow Visualization</title>
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'SF Mono', 'Monaco', monospace;
            background: #0a0a0a;
            color: #00ff00;
            overflow: hidden;
            height: 100vh;
            display: grid;
            grid-template-rows: 60px 1fr 200px;
            grid-template-columns: 300px 1fr 300px;
            gap: 10px;
            padding: 10px;
        }
        
        .header {
            grid-column: 1 / -1;
            background: rgba(0, 20, 0, 0.9);
            border: 1px solid #00ff00;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
        }
        
        .layer-status {
            background: rgba(0, 20, 0, 0.8);
            border: 1px solid #00ff00;
            border-radius: 5px;
            padding: 15px;
            overflow-y: auto;
        }
        
        .main-viewer {
            background: rgba(0, 10, 0, 0.9);
            border: 1px solid #00ff00;
            border-radius: 5px;
            position: relative;
            overflow: hidden;
        }
        
        .tier-monitor {
            background: rgba(0, 20, 0, 0.8);
            border: 1px solid #00ff00;
            border-radius: 5px;
            padding: 15px;
            overflow-y: auto;
        }
        
        .flow-console {
            grid-column: 1 / -1;
            background: rgba(0, 10, 0, 0.9);
            border: 1px solid #00ff00;
            border-radius: 5px;
            padding: 10px;
            overflow-y: auto;
            font-size: 11px;
            font-family: monospace;
        }
        
        #xmlCanvas {
            width: 100%;
            height: 100%;
        }
        
        .layer-item {
            margin: 10px 0;
            padding: 10px;
            background: rgba(0, 30, 0, 0.5);
            border-radius: 3px;
            border-left: 3px solid #444;
            transition: all 0.3s;
        }
        
        .layer-item.connected {
            border-left-color: #00ff00;
        }
        
        .layer-item.active {
            background: rgba(0, 50, 0, 0.5);
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        }
        
        .tier-item {
            margin: 8px 0;
            padding: 8px;
            background: rgba(0, 30, 0, 0.5);
            border-radius: 3px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .tier-health {
            width: 100px;
            height: 8px;
            background: #333;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .tier-health-bar {
            height: 100%;
            background: linear-gradient(90deg, #ff0000, #ffff00, #00ff00);
            transition: width 0.3s;
        }
        
        .flow-line {
            color: #00ff00;
            margin: 2px 0;
            white-space: pre;
            opacity: 0.8;
        }
        
        .flow-line.error {
            color: #ff0000;
        }
        
        .flow-line.warning {
            color: #ffff00;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-size: 12px;
        }
        
        .metric-value {
            color: #00ffff;
            font-weight: bold;
        }
        
        .controls {
            display: flex;
            gap: 10px;
        }
        
        .control-btn {
            background: rgba(0, 50, 0, 0.8);
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: 5px 15px;
            border-radius: 3px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .control-btn:hover {
            background: rgba(0, 100, 0, 0.8);
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);
        }
        
        .control-btn.active {
            background: rgba(0, 150, 0, 0.8);
        }
        
        @keyframes pulse {
            0% { opacity: 0.3; }
            50% { opacity: 1; }
            100% { opacity: 0.3; }
        }
        
        .data-flow {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #00ff00;
            border-radius: 50%;
            animation: pulse 1s infinite;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🗺️ XML Mapping Viewer</h1>
        <div class="controls">
            <button class="control-btn" id="pauseBtn">⏸️ Pause</button>
            <button class="control-btn" id="recordBtn">⏺️ Record</button>
            <button class="control-btn" id="snapshotBtn">📸 Snapshot</button>
            <button class="control-btn" id="clearBtn">🗑️ Clear</button>
        </div>
        <div class="metrics">
            <span>TPS: <span class="metric-value" id="tps">0</span></span> |
            <span>BPS: <span class="metric-value" id="bps">0</span></span> |
            <span>Latency: <span class="metric-value" id="latency">0ms</span></span>
        </div>
    </div>
    
    <div class="layer-status">
        <h3>📡 Layer Status</h3>
        <div id="layerList"></div>
        
        <h3 style="margin-top: 20px;">📊 Telemetry</h3>
        <div class="metric">
            <span>Total Messages:</span>
            <span class="metric-value" id="totalMessages">0</span>
        </div>
        <div class="metric">
            <span>Data Volume:</span>
            <span class="metric-value" id="dataVolume">0 KB</span>
        </div>
        <div class="metric">
            <span>Active Flows:</span>
            <span class="metric-value" id="activeFlows">0</span>
        </div>
        <div class="metric">
            <span>Error Rate:</span>
            <span class="metric-value" id="errorRate">0%</span>
        </div>
    </div>
    
    <div class="main-viewer">
        <canvas id="xmlCanvas"></canvas>
    </div>
    
    <div class="tier-monitor">
        <h3>🏗️ Tier Status</h3>
        <div id="tierList"></div>
    </div>
    
    <div class="flow-console" id="flowConsole">
        <div class="flow-line">🚀 XML Mapping Viewer initialized...</div>
        <div class="flow-line">🔄 Connecting to five-layer architecture...</div>
    </div>
    
    <script>
        class XMLMappingVisualizer {
            constructor() {
                this.canvas = document.getElementById('xmlCanvas');
                this.ctx = this.canvas.getContext('2d');
                this.ws = null;
                
                // Visualization state
                this.layers = new Map();
                this.tiers = new Map();
                this.flows = [];
                this.particles = [];
                
                // UI state
                this.paused = false;
                this.recording = false;
                this.recordedData = [];
                
                // Animation
                this.animationFrame = null;
                
                this.init();
            }
            
            async init() {
                this.setupCanvas();
                this.connectWebSocket();
                this.setupControls();
                this.startAnimation();
                
                console.log('🗺️ XML Mapping Visualizer initialized');
            }
            
            setupCanvas() {
                const resize = () => {
                    const rect = this.canvas.parentElement.getBoundingClientRect();
                    this.canvas.width = rect.width;
                    this.canvas.height = rect.height;
                    this.calculateLayout();
                };
                
                window.addEventListener('resize', resize);
                resize();
            }
            
            calculateLayout() {
                const width = this.canvas.width;
                const height = this.canvas.height;
                const centerX = width / 2;
                const centerY = height / 2;
                
                // Position layers in a circle
                const layerNames = ['gaming-engine', 'meta-orchestrator', 'licensing-compliance', 'xml-stream-integration', 'stream-visualization'];
                const radius = Math.min(width, height) * 0.35;
                
                layerNames.forEach((name, index) => {
                    const angle = (index / layerNames.length) * 2 * Math.PI - Math.PI / 2;
                    const x = centerX + Math.cos(angle) * radius;
                    const y = centerY + Math.sin(angle) * radius;
                    
                    this.layers.set(name, {
                        x: x,
                        y: y,
                        radius: 40,
                        connected: false,
                        active: false,
                        lastActivity: 0
                    });
                });
                
                // Position tiers in inner circle
                const tierRadius = radius * 0.6;
                for (let i = 1; i <= 15; i++) {
                    const angle = ((i - 1) / 15) * 2 * Math.PI;
                    const x = centerX + Math.cos(angle) * tierRadius;
                    const y = centerY + Math.sin(angle) * tierRadius;
                    
                    this.tiers.set(i, {
                        x: x,
                        y: y,
                        radius: 15,
                        health: 100,
                        active: false
                    });
                }
            }
            
            connectWebSocket() {
                try {
                    this.ws = new WebSocket('ws://localhost:8099/xml-viewer');
                    
                    this.ws.onopen = () => {
                        this.addFlowLine('✅ Connected to XML Mapping Viewer', 'success');
                    };
                    
                    this.ws.onmessage = (event) => {
                        const message = JSON.parse(event.data);
                        this.handleMessage(message);
                    };
                    
                    this.ws.onclose = () => {
                        this.addFlowLine('❌ Disconnected from viewer', 'error');
                        setTimeout(() => this.connectWebSocket(), 5000);
                    };
                    
                } catch (error) {
                    console.error('WebSocket error:', error);
                    setTimeout(() => this.connectWebSocket(), 5000);
                }
            }
            
            handleMessage(message) {
                if (this.paused) return;
                
                switch (message.type) {
                    case 'layer-status':
                        this.updateLayerStatus(message.data);
                        break;
                        
                    case 'tier-update':
                        this.updateTierStatus(message.data);
                        break;
                        
                    case 'xml-flow':
                        this.visualizeFlow(message.data);
                        break;
                        
                    case 'telemetry':
                        this.updateTelemetry(message.data);
                        break;
                        
                    case 'error':
                        this.addFlowLine('⚠️ ' + message.data.message, 'error');
                        break;
                }
                
                if (this.recording) {
                    this.recordedData.push({
                        timestamp: Date.now(),
                        message: message
                    });
                }
            }
            
            updateLayerStatus(data) {
                const layer = this.layers.get(data.name);
                if (layer) {
                    layer.connected = data.connected;
                    layer.active = data.active;
                    layer.lastActivity = Date.now();
                }
                
                this.updateLayerUI(data);
            }
            
            updateTierStatus(data) {
                const tier = this.tiers.get(data.tierId);
                if (tier) {
                    tier.health = data.health || 100;
                    tier.active = true;
                    
                    // Create visual effect
                    this.createPulseEffect(tier.x, tier.y, '#00ff00');
                }
                
                this.updateTierUI(data);
            }
            
            visualizeFlow(flowData) {
                const fromLayer = this.layers.get(flowData.from);
                const toLayer = this.layers.get(flowData.to);
                
                if (fromLayer && toLayer) {
                    // Create flow particle
                    this.particles.push({
                        x: fromLayer.x,
                        y: fromLayer.y,
                        targetX: toLayer.x,
                        targetY: toLayer.y,
                        progress: 0,
                        speed: 0.02,
                        color: this.getFlowColor(flowData.type),
                        size: Math.min(flowData.size / 1000, 5) + 2
                    });
                    
                    // Update activity
                    fromLayer.active = true;
                    toLayer.active = true;
                    
                    // Log flow
                    this.addFlowLine(
                        \`🔄 \${flowData.from} → \${flowData.to}: \${flowData.type} (\${flowData.size} bytes)\`,
                        'normal'
                    );
                }
            }
            
            getFlowColor(type) {
                const colors = {
                    'xml-update': '#00ff00',
                    'handshake': '#00ffff',
                    'consensus': '#ffff00',
                    'licensing': '#ff00ff',
                    'error': '#ff0000'
                };
                return colors[type] || '#00ff00';
            }
            
            createPulseEffect(x, y, color) {
                this.flows.push({
                    x: x,
                    y: y,
                    radius: 0,
                    maxRadius: 50,
                    color: color,
                    opacity: 1,
                    growth: 2
                });
            }
            
            updateLayerUI(data) {
                const layerList = document.getElementById('layerList');
                let layerDiv = document.getElementById('layer-' + data.name);
                
                if (!layerDiv) {
                    layerDiv = document.createElement('div');
                    layerDiv.id = 'layer-' + data.name;
                    layerDiv.className = 'layer-item';
                    layerList.appendChild(layerDiv);
                }
                
                layerDiv.className = 'layer-item' + 
                    (data.connected ? ' connected' : '') + 
                    (data.active ? ' active' : '');
                
                layerDiv.innerHTML = \`
                    <div style="font-weight: bold;">\${data.name}</div>
                    <div style="font-size: 11px;">
                        Port: \${data.port} | 
                        Status: \${data.connected ? '🟢' : '🔴'} |
                        Flow: \${data.flowRate}/s
                    </div>
                \`;
            }
            
            updateTierUI(data) {
                const tierList = document.getElementById('tierList');
                let tierDiv = document.getElementById('tier-' + data.tierId);
                
                if (!tierDiv) {
                    tierDiv = document.createElement('div');
                    tierDiv.id = 'tier-' + data.tierId;
                    tierDiv.className = 'tier-item';
                    tierList.appendChild(tierDiv);
                }
                
                tierDiv.innerHTML = \`
                    <span>Tier \${data.tierId}</span>
                    <div class="tier-health">
                        <div class="tier-health-bar" style="width: \${data.health}%"></div>
                    </div>
                    <span>\${data.health}%</span>
                \`;
            }
            
            updateTelemetry(telemetry) {
                document.getElementById('tps').textContent = telemetry.tps.toFixed(1);
                document.getElementById('bps').textContent = this.formatBytes(telemetry.bps);
                document.getElementById('latency').textContent = telemetry.latency.toFixed(1) + 'ms';
                document.getElementById('totalMessages').textContent = telemetry.totalMessages;
                document.getElementById('dataVolume').textContent = this.formatBytes(telemetry.dataVolume);
                document.getElementById('activeFlows').textContent = telemetry.activeFlows;
                document.getElementById('errorRate').textContent = telemetry.errorRate.toFixed(1) + '%';
            }
            
            formatBytes(bytes) {
                if (bytes < 1024) return bytes + ' B';
                if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
                return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
            }
            
            addFlowLine(text, type = 'normal') {
                const console = document.getElementById('flowConsole');
                const line = document.createElement('div');
                line.className = 'flow-line ' + type;
                line.textContent = new Date().toTimeString().split(' ')[0] + ' ' + text;
                
                console.appendChild(line);
                console.scrollTop = console.scrollHeight;
                
                // Limit console lines
                while (console.children.length > 100) {
                    console.removeChild(console.firstChild);
                }
            }
            
            setupControls() {
                document.getElementById('pauseBtn').addEventListener('click', () => {
                    this.paused = !this.paused;
                    document.getElementById('pauseBtn').textContent = this.paused ? '▶️ Resume' : '⏸️ Pause';
                    document.getElementById('pauseBtn').classList.toggle('active', this.paused);
                });
                
                document.getElementById('recordBtn').addEventListener('click', () => {
                    this.recording = !this.recording;
                    if (this.recording) {
                        this.recordedData = [];
                        this.addFlowLine('⏺️ Recording started', 'warning');
                    } else {
                        this.saveRecording();
                        this.addFlowLine('⏹️ Recording saved', 'success');
                    }
                    document.getElementById('recordBtn').classList.toggle('active', this.recording);
                });
                
                document.getElementById('snapshotBtn').addEventListener('click', () => {
                    this.takeSnapshot();
                });
                
                document.getElementById('clearBtn').addEventListener('click', () => {
                    this.flows = [];
                    this.particles = [];
                    const console = document.getElementById('flowConsole');
                    console.innerHTML = '<div class="flow-line">🗑️ Console cleared</div>';
                });
            }
            
            takeSnapshot() {
                // Convert canvas to image
                const dataUrl = this.canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = 'xml-mapping-' + Date.now() + '.png';
                link.href = dataUrl;
                link.click();
                
                this.addFlowLine('📸 Snapshot saved', 'success');
            }
            
            saveRecording() {
                const blob = new Blob([JSON.stringify(this.recordedData, null, 2)], 
                    { type: 'application/json' });
                const link = document.createElement('a');
                link.download = 'xml-recording-' + Date.now() + '.json';
                link.href = URL.createObjectURL(blob);
                link.click();
            }
            
            startAnimation() {
                const animate = () => {
                    this.animationFrame = requestAnimationFrame(animate);
                    
                    if (!this.paused) {
                        this.draw();
                        this.updateParticles();
                        this.updateFlows();
                        this.fadeInactiveElements();
                    }
                };
                
                animate();
            }
            
            draw() {
                // Clear canvas
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Draw connections
                this.drawConnections();
                
                // Draw flows
                this.drawFlows();
                
                // Draw particles
                this.drawParticles();
                
                // Draw tiers
                this.drawTiers();
                
                // Draw layers
                this.drawLayers();
            }
            
            drawConnections() {
                this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
                this.ctx.lineWidth = 1;
                
                // Draw layer connections
                const layerArray = Array.from(this.layers.values());
                for (let i = 0; i < layerArray.length; i++) {
                    for (let j = i + 1; j < layerArray.length; j++) {
                        const layer1 = layerArray[i];
                        const layer2 = layerArray[j];
                        
                        if (layer1.connected && layer2.connected) {
                            this.ctx.beginPath();
                            this.ctx.moveTo(layer1.x, layer1.y);
                            this.ctx.lineTo(layer2.x, layer2.y);
                            this.ctx.stroke();
                        }
                    }
                }
            }
            
            drawFlows() {
                this.flows.forEach((flow, index) => {
                    this.ctx.strokeStyle = flow.color;
                    this.ctx.globalAlpha = flow.opacity;
                    this.ctx.lineWidth = 2;
                    
                    this.ctx.beginPath();
                    this.ctx.arc(flow.x, flow.y, flow.radius, 0, 2 * Math.PI);
                    this.ctx.stroke();
                    
                    // Remove completed flows
                    if (flow.radius >= flow.maxRadius) {
                        this.flows.splice(index, 1);
                    }
                });
                
                this.ctx.globalAlpha = 1;
            }
            
            drawParticles() {
                this.particles.forEach((particle, index) => {
                    const x = particle.x + (particle.targetX - particle.x) * particle.progress;
                    const y = particle.y + (particle.targetY - particle.y) * particle.progress;
                    
                    // Draw particle
                    this.ctx.fillStyle = particle.color;
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, particle.size, 0, 2 * Math.PI);
                    this.ctx.fill();
                    
                    // Draw trail
                    this.ctx.strokeStyle = particle.color;
                    this.ctx.globalAlpha = 0.5;
                    this.ctx.lineWidth = particle.size * 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle.x, particle.y);
                    this.ctx.lineTo(x, y);
                    this.ctx.stroke();
                    this.ctx.globalAlpha = 1;
                    
                    // Remove completed particles
                    if (particle.progress >= 1) {
                        this.particles.splice(index, 1);
                    }
                });
            }
            
            drawTiers() {
                this.tiers.forEach((tier, tierId) => {
                    // Draw tier circle
                    this.ctx.fillStyle = tier.active ? 'rgba(0, 255, 0, 0.3)' : 'rgba(0, 255, 0, 0.1)';
                    this.ctx.strokeStyle = this.getTierColor(tier.health);
                    this.ctx.lineWidth = 2;
                    
                    this.ctx.beginPath();
                    this.ctx.arc(tier.x, tier.y, tier.radius, 0, 2 * Math.PI);
                    this.ctx.fill();
                    this.ctx.stroke();
                    
                    // Draw tier number
                    this.ctx.fillStyle = '#00ff00';
                    this.ctx.font = '10px monospace';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(tierId.toString(), tier.x, tier.y);
                });
            }
            
            getTierColor(health) {
                if (health > 80) return '#00ff00';
                if (health > 60) return '#88ff00';
                if (health > 40) return '#ffff00';
                if (health > 20) return '#ff8800';
                return '#ff0000';
            }
            
            drawLayers() {
                this.layers.forEach((layer, name) => {
                    // Draw layer circle
                    this.ctx.fillStyle = layer.connected ? 
                        (layer.active ? 'rgba(0, 255, 0, 0.4)' : 'rgba(0, 255, 0, 0.2)') : 
                        'rgba(255, 0, 0, 0.2)';
                    this.ctx.strokeStyle = layer.connected ? '#00ff00' : '#ff0000';
                    this.ctx.lineWidth = layer.active ? 3 : 2;
                    
                    this.ctx.beginPath();
                    this.ctx.arc(layer.x, layer.y, layer.radius, 0, 2 * Math.PI);
                    this.ctx.fill();
                    this.ctx.stroke();
                    
                    // Draw layer name
                    this.ctx.fillStyle = '#00ff00';
                    this.ctx.font = '12px monospace';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    
                    // Split name for better display
                    const parts = name.split('-');
                    parts.forEach((part, index) => {
                        this.ctx.fillText(part, layer.x, layer.y + (index - parts.length/2 + 0.5) * 14);
                    });
                });
            }
            
            updateParticles() {
                this.particles.forEach(particle => {
                    particle.progress += particle.speed;
                });
            }
            
            updateFlows() {
                this.flows.forEach(flow => {
                    flow.radius += flow.growth;
                    flow.opacity = 1 - (flow.radius / flow.maxRadius);
                });
            }
            
            fadeInactiveElements() {
                const now = Date.now();
                
                this.layers.forEach(layer => {
                    if (now - layer.lastActivity > 5000) {
                        layer.active = false;
                    }
                });
                
                this.tiers.forEach(tier => {
                    if (tier.active) {
                        tier.active = false;
                    }
                });
            }
        }
        
        // Initialize visualizer
        const visualizer = new XMLMappingVisualizer();
        
        console.log('🗺️👁️ XML Mapping Viewer loaded');
    </script>
</body>
</html>`;
        
        await fs.writeFile(
            path.join(this.viewerDir, 'index.html'),
            viewerHTML
        );
        
        console.log('   ✅ Viewer interface created');
    }
    
    async startHTTPServer() {
        console.log('🌐 Starting HTTP server for viewer...');
        
        this.httpServer = http.createServer(async (req, res) => {
            if (req.url === '/') {
                const html = await fs.readFile(path.join(this.viewerDir, 'index.html'), 'utf8');
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        this.httpServer.listen(this.httpPort);
        console.log(`   ✅ HTTP server running on http://localhost:${this.httpPort}`);
    }
    
    async startViewerWebSocketServer() {
        console.log('🔌 Starting viewer WebSocket server...');
        
        this.viewerWsServer = new WebSocket.Server({
            port: this.httpPort,
            path: '/xml-viewer',
            server: this.httpServer
        });
        
        this.viewerWsServer.on('connection', (ws) => {
            console.log('👁️ Viewer client connected');
            this.viewerClients.add(ws);
            
            // Send initial state
            this.sendInitialState(ws);
            
            ws.on('close', () => {
                this.viewerClients.delete(ws);
            });
        });
        
        console.log(`   ✅ Viewer WebSocket: ws://localhost:${this.httpPort}/xml-viewer`);
    }
    
    async connectToAllLayers() {
        console.log('🔗 Connecting to all five layers...');
        
        for (const [name, config] of Object.entries(this.layerConnections)) {
            this.connectToLayer(name, config);
        }
    }
    
    connectToLayer(name, config) {
        try {
            const ws = new WebSocket(`ws://localhost:${config.port}`);
            
            ws.on('open', () => {
                console.log(`   ✅ Connected to ${name}`);
                config.connected = true;
                config.ws = ws;
                
                // Subscribe to XML flow events
                ws.send(JSON.stringify({
                    type: 'SUBSCRIBE_XML_FLOW',
                    data: { 
                        subscriber: 'xml-mapping-viewer',
                        events: ['all']
                    }
                }));
                
                this.broadcastLayerStatus(name, config);
            });
            
            ws.on('message', (data) => {
                this.handleLayerMessage(name, JSON.parse(data));
            });
            
            ws.on('close', () => {
                console.log(`   ❌ Disconnected from ${name}`);
                config.connected = false;
                config.ws = null;
                this.broadcastLayerStatus(name, config);
                
                // Attempt reconnection
                setTimeout(() => this.connectToLayer(name, config), 5000);
            });
            
        } catch (error) {
            console.error(`   ❌ Failed to connect to ${name}:`, error.message);
            setTimeout(() => this.connectToLayer(name, config), 5000);
        }
    }
    
    handleLayerMessage(layerName, message) {
        const config = this.layerConnections[layerName];
        
        // Track flow rate
        config.flowRate++;
        
        // Process message
        switch (message.type) {
            case 'tier-update':
            case 'xml-tier-update':
                this.processTierUpdate(layerName, message.data);
                break;
                
            case 'handshake':
            case 'handshake-response':
                this.processHandshake(layerName, message);
                break;
                
            case 'consensus-request':
            case 'consensus-vote':
                this.processConsensus(layerName, message);
                break;
                
            case 'licensing-update':
                this.processLicensing(layerName, message);
                break;
                
            default:
                this.processGenericFlow(layerName, message);
        }
        
        // Update telemetry
        this.updateTelemetry(layerName, message);
    }
    
    processTierUpdate(layerName, tierData) {
        const tierId = tierData.tierId || tierData.tier;
        
        // Update tier state
        this.xmlMappingState.tierStates.set(tierId, {
            ...tierData,
            lastUpdate: Date.now(),
            source: layerName
        });
        
        // Broadcast to viewers
        this.broadcastToViewers({
            type: 'tier-update',
            data: {
                tierId: tierId,
                health: tierData.health || 100,
                status: tierData.status || 'active',
                source: layerName
            }
        });
        
        // Track flow
        this.trackFlow(layerName, 'tier-update', tierData);
    }
    
    processHandshake(fromLayer, message) {
        // Determine target layer
        const toLayer = this.determineTargetLayer(fromLayer, message);
        
        if (toLayer) {
            this.visualizeFlow(fromLayer, toLayer, 'handshake', message);
        }
    }
    
    processConsensus(fromLayer, message) {
        // Consensus flows to meta-orchestrator
        if (fromLayer !== 'meta-orchestrator') {
            this.visualizeFlow(fromLayer, 'meta-orchestrator', 'consensus', message);
        }
    }
    
    processLicensing(fromLayer, message) {
        // Licensing flows through compliance layer
        this.visualizeFlow(fromLayer, 'licensing-compliance', 'licensing', message);
    }
    
    processGenericFlow(fromLayer, message) {
        // Determine flow pattern based on message type
        const flowType = message.type || 'data';
        const targetLayer = this.determineTargetLayer(fromLayer, message);
        
        if (targetLayer) {
            this.visualizeFlow(fromLayer, targetLayer, flowType, message);
        }
    }
    
    determineTargetLayer(fromLayer, message) {
        // Layer hierarchy for flow routing
        const hierarchy = {
            'stream-visualization': ['xml-stream-integration'],
            'xml-stream-integration': ['licensing-compliance', 'stream-visualization'],
            'licensing-compliance': ['meta-orchestrator', 'xml-stream-integration'],
            'meta-orchestrator': ['gaming-engine', 'licensing-compliance'],
            'gaming-engine': ['meta-orchestrator']
        };
        
        const targets = hierarchy[fromLayer] || [];
        return targets[0]; // Simple routing, could be enhanced
    }
    
    visualizeFlow(fromLayer, toLayer, flowType, data) {
        const flowData = {
            from: fromLayer,
            to: toLayer,
            type: flowType,
            size: JSON.stringify(data).length,
            timestamp: Date.now()
        };
        
        // Add to flow history
        this.xmlMappingState.flowHistory.push(flowData);
        if (this.xmlMappingState.flowHistory.length > this.xmlMappingState.maxHistorySize) {
            this.xmlMappingState.flowHistory.shift();
        }
        
        // Update active flows
        this.xmlMappingState.activeFlows++;
        
        // Broadcast to viewers
        this.broadcastToViewers({
            type: 'xml-flow',
            data: flowData
        });
    }
    
    trackFlow(layerName, flowType, data) {
        const size = JSON.stringify(data).length;
        
        // Update layer data volume
        const layerData = this.layerConnections[layerName].data;
        const key = `${flowType}-${Date.now()}`;
        layerData.set(key, { type: flowType, size: size, timestamp: Date.now() });
        
        // Clean old data
        if (layerData.size > 100) {
            const oldestKey = layerData.keys().next().value;
            layerData.delete(oldestKey);
        }
    }
    
    updateTelemetry(layerName, message) {
        this.telemetry.totalMessages++;
        this.telemetry.totalBytes += JSON.stringify(message).length;
        
        // Update layer metrics
        if (!this.telemetry.layerMetrics.has(layerName)) {
            this.telemetry.layerMetrics.set(layerName, {
                messages: 0,
                bytes: 0,
                errors: 0
            });
        }
        
        const layerMetrics = this.telemetry.layerMetrics.get(layerName);
        layerMetrics.messages++;
        layerMetrics.bytes += JSON.stringify(message).length;
        
        if (message.type === 'error') {
            layerMetrics.errors++;
            this.telemetry.errorCount++;
        }
    }
    
    async startTelemetryCollection() {
        console.log('📊 Starting telemetry collection...');
        
        // Calculate metrics every second
        setInterval(() => {
            this.calculateMetrics();
            this.broadcastTelemetry();
        }, 1000);
        
        // Reset flow rates
        setInterval(() => {
            Object.values(this.layerConnections).forEach(config => {
                config.flowRate = 0;
            });
            this.xmlMappingState.activeFlows = 0;
        }, 5000);
        
        // Save telemetry snapshots
        setInterval(() => {
            this.saveTelemetrySnapshot();
        }, 60000); // Every minute
        
        console.log('   ✅ Telemetry collection active');
    }
    
    calculateMetrics() {
        const now = Date.now();
        const elapsed = (now - this.telemetry.startTime) / 1000;
        
        // Transactions per second
        this.telemetry.currentTPS = this.telemetry.totalMessages / elapsed;
        
        // Bytes per second
        this.telemetry.currentBPS = this.telemetry.totalBytes / elapsed;
        
        // Average latency (simplified)
        const latencies = Array.from(this.xmlMappingState.latencyMap.values());
        this.telemetry.averageLatency = latencies.length > 0 ?
            latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    }
    
    broadcastTelemetry() {
        const telemetry = {
            tps: this.telemetry.currentTPS,
            bps: this.telemetry.currentBPS,
            latency: this.telemetry.averageLatency,
            totalMessages: this.telemetry.totalMessages,
            dataVolume: this.telemetry.totalBytes,
            activeFlows: this.xmlMappingState.activeFlows,
            errorRate: (this.telemetry.errorCount / Math.max(this.telemetry.totalMessages, 1)) * 100
        };
        
        this.broadcastToViewers({
            type: 'telemetry',
            data: telemetry
        });
    }
    
    broadcastLayerStatus(name, config) {
        this.broadcastToViewers({
            type: 'layer-status',
            data: {
                name: name,
                port: config.port,
                connected: config.connected,
                active: config.flowRate > 0,
                flowRate: config.flowRate
            }
        });
    }
    
    broadcastToViewers(message) {
        const data = JSON.stringify(message);
        this.viewerClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    sendInitialState(ws) {
        // Send layer statuses
        Object.entries(this.layerConnections).forEach(([name, config]) => {
            ws.send(JSON.stringify({
                type: 'layer-status',
                data: {
                    name: name,
                    port: config.port,
                    connected: config.connected,
                    active: false,
                    flowRate: 0
                }
            }));
        });
        
        // Send tier states
        this.xmlMappingState.tierStates.forEach((state, tierId) => {
            ws.send(JSON.stringify({
                type: 'tier-update',
                data: {
                    tierId: tierId,
                    health: state.health || 100,
                    status: state.status || 'active'
                }
            }));
        });
    }
    
    async saveTelemetrySnapshot() {
        const snapshot = {
            timestamp: new Date().toISOString(),
            telemetry: this.telemetry,
            mappingState: {
                totalNodes: this.xmlMappingState.totalNodes,
                activeFlows: this.xmlMappingState.activeFlows,
                tierCount: this.xmlMappingState.tierStates.size
            },
            layerStatus: Object.fromEntries(
                Object.entries(this.layerConnections).map(([name, config]) => [
                    name,
                    {
                        connected: config.connected,
                        dataPoints: config.data.size,
                        flowRate: config.flowRate
                    }
                ])
            )
        };
        
        const filename = `telemetry-${Date.now()}.json`;
        await fs.writeFile(
            path.join(this.viewerDir, 'telemetry', filename),
            JSON.stringify(snapshot, null, 2)
        );
        
        this.logger.system(`Telemetry snapshot saved: ${filename}`);
    }
    
    async getViewerStatus() {
        return {
            httpServer: `http://localhost:${this.httpPort}`,
            wsServer: `ws://localhost:${this.httpPort}/xml-viewer`,
            viewerClients: this.viewerClients.size,
            layers: Object.fromEntries(
                Object.entries(this.layerConnections).map(([name, config]) => [
                    name,
                    {
                        connected: config.connected,
                        port: config.port,
                        flowRate: config.flowRate,
                        dataPoints: config.data.size
                    }
                ])
            ),
            telemetry: {
                totalMessages: this.telemetry.totalMessages,
                totalBytes: this.telemetry.totalBytes,
                tps: this.telemetry.currentTPS,
                bps: this.telemetry.currentBPS,
                errorRate: (this.telemetry.errorCount / Math.max(this.telemetry.totalMessages, 1)) * 100
            },
            mapping: {
                tierStates: this.xmlMappingState.tierStates.size,
                flowHistory: this.xmlMappingState.flowHistory.length,
                activeFlows: this.xmlMappingState.activeFlows
            }
        };
    }
}

module.exports = XMLMappingViewer;

// CLI interface
if (require.main === module) {
    const viewer = new XMLMappingViewer();
    
    const [,, action, ...args] = process.argv;
    
    switch (action) {
        case 'status':
            viewer.getViewerStatus().then(status => {
                console.log('\n🗺️👁️ XML MAPPING VIEWER STATUS');
                console.log('==============================');
                Object.entries(status).forEach(([key, value]) => {
                    console.log(`${key.padEnd(20)}: ${JSON.stringify(value, null, 2)}`);
                });
            });
            break;
            
        default:
            console.log(`
🗺️👁️ XML MAPPING VIEWER

Usage:
  node xml-mapping-viewer.js [action]

Actions:
  status - Show viewer status

Features:
  🌐 Real-time XML flow visualization
  📊 Multi-layer telemetry monitoring
  🎨 Interactive web interface
  📈 Performance metrics dashboard
  💾 Recording and snapshot capabilities
  🔍 Comprehensive flow tracking

Access the viewer at:
  http://localhost:8099
            `);
    }
}