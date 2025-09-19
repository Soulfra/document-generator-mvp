#!/usr/bin/env node

/**
 * 🎯 HEX WORLD BACKEND VISUALIZER
 * Uses the hex world as a system backend visualization layer
 * Each hex tile = microservice/component
 * Characters = data flows/processes
 * Colors = Kingdom Authority levels & system health
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const crypto = require('crypto');

class HexWorldBackendVisualizer {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 8301;
        
        // Kingdom Authority color mapping (from Slack-like status)
        this.authorityColors = {
            'EXILE': '#8B0000',      // Dark Red - offline/error
            'PEASANT': '#FF0000',    // Red - minimal access
            'CITIZEN': '#FFA500',    // Orange - basic user
            'MERCHANT': '#FFFF00',   // Yellow - away/caution
            'KNIGHT': '#00FF00',     // Green - online/trusted
            'LORD': '#0000FF',       // Blue - moderator
            'KING': '#FFD700'        // Gold - admin
        };
        
        // Backend system components as hex tiles
        this.systemComponents = new Map();
        this.dataFlows = new Map();
        this.processCharacters = new Map();
        
        // Viewer modes
        this.viewerModes = {
            'user': 'Pretty 3D characters for end users',
            'backend': 'Raw system process visualization',
            'debug': 'Detailed system internals',
            'architect': 'System architecture overview'
        };
        
        console.log('🎯 HEX WORLD BACKEND VISUALIZER');
        console.log('🔧 System components as hex tiles');
        console.log('👥 Data flows as moving characters');
        console.log('🎨 Kingdom Authority color coding');
        
        this.init();
        this.setupSystemComponents();
    }
    
    init() {
        this.app.use(express.json());
        
        // Main interface with mode switcher
        this.app.get('/', (req, res) => {
            const mode = req.query.mode || 'backend';
            res.send(this.getInterface(mode));
        });
        
        // API endpoints
        this.app.post('/api/register-component', (req, res) => {
            const { name, position, type, health } = req.body;
            this.registerSystemComponent(name, position, type, health);
            res.json({ success: true });
        });
        
        this.app.post('/api/create-dataflow', (req, res) => {
            const { from, to, data, priority } = req.body;
            const flow = this.createDataFlow(from, to, data, priority);
            res.json({ success: true, flowId: flow.id });
        });
        
        this.setupWebSocket();
        
        this.server.listen(this.port, () => {
            console.log(`\n✅ BACKEND VISUALIZER: http://localhost:${this.port}`);
            console.log('\n🎯 VIEW MODES:');
            console.log('   ?mode=user     - Pretty character view');
            console.log('   ?mode=backend  - System process view (default)');
            console.log('   ?mode=debug    - Detailed internals');
            console.log('   ?mode=architect - Architecture overview');
        });
    }
    
    setupSystemComponents() {
        // Core system components as hex tiles
        const components = [
            { name: 'auth-service', position: { q: 0, r: 0 }, type: 'core', health: 1.0 },
            { name: 'database', position: { q: 2, r: -1 }, type: 'storage', health: 0.9 },
            { name: 'api-gateway', position: { q: -2, r: 1 }, type: 'network', health: 0.95 },
            { name: 'cache-redis', position: { q: 1, r: 1 }, type: 'storage', health: 1.0 },
            { name: 'ai-service', position: { q: -1, r: -1 }, type: 'compute', health: 0.8 },
            { name: 'queue-system', position: { q: 0, r: 2 }, type: 'messaging', health: 0.85 },
            { name: 'file-storage', position: { q: 3, r: 0 }, type: 'storage', health: 0.75 }
        ];
        
        components.forEach(comp => {
            this.registerSystemComponent(comp.name, comp.position, comp.type, comp.health);
        });
        
        // Create some initial data flows
        this.createDataFlow('api-gateway', 'auth-service', { type: 'login_request' });
        this.createDataFlow('auth-service', 'database', { type: 'user_lookup' });
        this.createDataFlow('database', 'cache-redis', { type: 'cache_update' });
    }
    
    registerSystemComponent(name, position, type, health = 1.0) {
        const component = {
            id: `comp_${crypto.randomBytes(6).toString('hex')}`,
            name,
            position,
            type,
            health,
            connections: [],
            load: 0,
            authorityLevel: this.getComponentAuthority(health)
        };
        
        this.systemComponents.set(name, component);
        
        // Broadcast new component
        this.broadcast({
            type: 'new_component',
            component
        });
        
        console.log(`📍 Registered component: ${name} at (${position.q}, ${position.r})`);
    }
    
    getComponentAuthority(health) {
        // Map system health to Kingdom Authority levels
        if (health >= 0.95) return 'KING';      // Perfect health
        if (health >= 0.85) return 'LORD';      // Good health
        if (health >= 0.70) return 'KNIGHT';    // Normal health
        if (health >= 0.50) return 'MERCHANT';  // Warning state
        if (health >= 0.30) return 'CITIZEN';   // Degraded
        if (health >= 0.10) return 'PEASANT';   // Critical
        return 'EXILE';                         // Failed/Offline
    }
    
    createDataFlow(fromComponent, toComponent, data, priority = 'normal') {
        const from = this.systemComponents.get(fromComponent);
        const to = this.systemComponents.get(toComponent);
        
        if (!from || !to) {
            console.error(`Cannot create flow: component not found`);
            return null;
        }
        
        const flowId = `flow_${crypto.randomBytes(6).toString('hex')}`;
        
        // Create a character to represent this data flow
        const character = {
            id: flowId,
            name: `${data.type || 'data'}_flow`,
            position: { ...from.position },
            destination: to.position,
            data,
            priority,
            speed: priority === 'high' ? 0.5 : 0.2,
            color: this.getFlowColor(priority, data.type),
            created: Date.now()
        };
        
        this.processCharacters.set(flowId, character);
        
        // Start moving the character
        this.animateDataFlow(character, from, to);
        
        return character;
    }
    
    getFlowColor(priority, dataType) {
        // Color based on data type and priority
        const typeColors = {
            'login_request': '#00FF00',    // Green for auth
            'user_lookup': '#0000FF',      // Blue for database
            'cache_update': '#FFFF00',     // Yellow for cache
            'error': '#FF0000',            // Red for errors
            'ai_request': '#FF00FF'        // Magenta for AI
        };
        
        return typeColors[dataType] || '#FFFFFF';
    }
    
    animateDataFlow(character, from, to) {
        const steps = 20;
        let step = 0;
        
        const interval = setInterval(() => {
            if (step >= steps) {
                // Flow complete
                clearInterval(interval);
                this.processCharacters.delete(character.id);
                
                // Update component loads
                from.load = Math.max(0, from.load - 0.1);
                to.load = Math.min(1, to.load + 0.1);
                
                this.broadcast({
                    type: 'flow_complete',
                    characterId: character.id,
                    from: from.name,
                    to: to.name
                });
                
                return;
            }
            
            // Interpolate position
            const progress = step / steps;
            character.position = {
                q: from.position.q + (to.position.q - from.position.q) * progress,
                r: from.position.r + (to.position.r - from.position.r) * progress
            };
            
            // Broadcast movement
            this.broadcast({
                type: 'character_move',
                character
            });
            
            step++;
        }, 100 / character.speed);
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🔌 Backend viewer connected');
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'system_state',
                components: Array.from(this.systemComponents.values()),
                characters: Array.from(this.processCharacters.values())
            }));
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                this.handleViewerCommand(data, ws);
            });
        });
    }
    
    handleViewerCommand(data, ws) {
        switch (data.type) {
            case 'change_mode':
                // Mode change handled client-side
                break;
                
            case 'simulate_load':
                this.simulateSystemLoad();
                break;
                
            case 'simulate_failure':
                this.simulateComponentFailure(data.componentName);
                break;
        }
    }
    
    simulateSystemLoad() {
        // Create multiple data flows to simulate load
        const components = Array.from(this.systemComponents.keys());
        
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const from = components[Math.floor(Math.random() * components.length)];
                const to = components[Math.floor(Math.random() * components.length)];
                
                if (from !== to) {
                    this.createDataFlow(from, to, {
                        type: 'load_test',
                        size: Math.random() * 1000
                    }, Math.random() > 0.5 ? 'high' : 'normal');
                }
            }, i * 200);
        }
    }
    
    simulateComponentFailure(componentName) {
        const component = this.systemComponents.get(componentName);
        if (component) {
            component.health = 0.1;
            component.authorityLevel = 'EXILE';
            
            this.broadcast({
                type: 'component_failure',
                component
            });
        }
    }
    
    broadcast(data) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
    
    getInterface(mode) {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🎯 Hex World Backend Visualizer - ${mode} mode</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Courier New', monospace;
            background: #000;
            color: #0f0;
            overflow: hidden;
        }
        
        #canvas {
            width: 100vw;
            height: 100vh;
            display: block;
        }
        
        #mode-selector {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #0f0;
            padding: 10px;
            border-radius: 5px;
        }
        
        .mode-btn {
            background: transparent;
            border: 1px solid #0f0;
            color: #0f0;
            padding: 5px 10px;
            margin: 2px;
            cursor: pointer;
            font-family: inherit;
            font-size: 12px;
        }
        
        .mode-btn.active {
            background: #0f0;
            color: #000;
        }
        
        #info-panel {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #0f0;
            padding: 15px;
            border-radius: 5px;
            max-width: 300px;
        }
        
        .component-info {
            margin: 5px 0;
            font-size: 12px;
        }
        
        .health-bar {
            width: 100%;
            height: 5px;
            background: #333;
            margin: 3px 0;
        }
        
        .health-fill {
            height: 100%;
            transition: width 0.3s, background-color 0.3s;
        }
        
        #controls {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #0f0;
            padding: 10px;
            border-radius: 5px;
        }
        
        .control-btn {
            background: transparent;
            border: 1px solid #0f0;
            color: #0f0;
            padding: 10px 15px;
            margin: 0 5px;
            cursor: pointer;
            font-family: inherit;
        }
        
        .control-btn:hover {
            background: #0f0;
            color: #000;
        }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    
    <div id="mode-selector">
        <div style="margin-bottom: 10px; font-size: 14px;">VIEWER MODE:</div>
        <button class="mode-btn ${mode === 'user' ? 'active' : ''}" onclick="changeMode('user')">USER</button>
        <button class="mode-btn ${mode === 'backend' ? 'active' : ''}" onclick="changeMode('backend')">BACKEND</button>
        <button class="mode-btn ${mode === 'debug' ? 'active' : ''}" onclick="changeMode('debug')">DEBUG</button>
        <button class="mode-btn ${mode === 'architect' ? 'active' : ''}" onclick="changeMode('architect')">ARCHITECT</button>
    </div>
    
    <div id="info-panel">
        <div style="font-size: 16px; margin-bottom: 10px;">SYSTEM STATUS</div>
        <div id="system-info"></div>
    </div>
    
    <div id="controls">
        <button class="control-btn" onclick="simulateLoad()">SIMULATE LOAD</button>
        <button class="control-btn" onclick="simulateFailure()">SIMULATE FAILURE</button>
        <button class="control-btn" onclick="resetView()">RESET VIEW</button>
    </div>
    
    <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        let ws;
        let currentMode = '${mode}';
        let components = new Map();
        let characters = new Map();
        let hexSize = 40;
        let centerX, centerY;
        
        // Authority colors
        const authorityColors = {
            'EXILE': '#8B0000',
            'PEASANT': '#FF0000',
            'CITIZEN': '#FFA500',
            'MERCHANT': '#FFFF00',
            'KNIGHT': '#00FF00',
            'LORD': '#0000FF',
            'KING': '#FFD700'
        };
        
        function init() {
            resizeCanvas();
            connectWebSocket();
            animate();
        }
        
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            centerX = canvas.width / 2;
            centerY = canvas.height / 2;
        }
        
        function connectWebSocket() {
            ws = new WebSocket(\`ws://\${window.location.host}\`);
            
            ws.onopen = () => {
                console.log('Connected to backend visualizer');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleServerMessage(data);
            };
        }
        
        function handleServerMessage(data) {
            switch (data.type) {
                case 'system_state':
                    data.components.forEach(comp => {
                        components.set(comp.name, comp);
                    });
                    data.characters.forEach(char => {
                        characters.set(char.id, char);
                    });
                    updateInfoPanel();
                    break;
                    
                case 'new_component':
                    components.set(data.component.name, data.component);
                    updateInfoPanel();
                    break;
                    
                case 'character_move':
                    characters.set(data.character.id, data.character);
                    break;
                    
                case 'flow_complete':
                    characters.delete(data.characterId);
                    break;
                    
                case 'component_failure':
                    components.set(data.component.name, data.component);
                    updateInfoPanel();
                    break;
            }
        }
        
        function drawHexGrid() {
            ctx.strokeStyle = currentMode === 'backend' ? '#0f0' : '#333';
            ctx.lineWidth = 1;
            
            for (let q = -10; q <= 10; q++) {
                for (let r = -10; r <= 10; r++) {
                    drawHex(q, r);
                }
            }
        }
        
        function drawHex(q, r, filled = false, color = null) {
            const x = hexSize * 3/2 * q + centerX;
            const y = hexSize * Math.sqrt(3) * (r + q/2) + centerY;
            
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const xPos = x + hexSize * Math.cos(angle);
                const yPos = y + hexSize * Math.sin(angle);
                
                if (i === 0) {
                    ctx.moveTo(xPos, yPos);
                } else {
                    ctx.lineTo(xPos, yPos);
                }
            }
            ctx.closePath();
            
            if (filled && color) {
                ctx.fillStyle = color;
                ctx.fill();
            }
            ctx.stroke();
        }
        
        function drawComponents() {
            components.forEach(comp => {
                const color = authorityColors[comp.authorityLevel];
                
                if (currentMode === 'backend' || currentMode === 'debug') {
                    // Draw as hex tile
                    drawHex(comp.position.q, comp.position.r, true, color + '40');
                    
                    // Draw label
                    const x = hexSize * 3/2 * comp.position.q + centerX;
                    const y = hexSize * Math.sqrt(3) * (comp.position.r + comp.position.q/2) + centerY;
                    
                    ctx.fillStyle = color;
                    ctx.font = '12px Courier New';
                    ctx.textAlign = 'center';
                    ctx.fillText(comp.name, x, y);
                    
                    if (currentMode === 'debug') {
                        ctx.font = '10px Courier New';
                        ctx.fillText(\`Health: \${(comp.health * 100).toFixed(0)}%\`, x, y + 15);
                        ctx.fillText(\`Load: \${(comp.load * 100).toFixed(0)}%\`, x, y + 25);
                    }
                } else if (currentMode === 'user') {
                    // Pretty 3D-like view
                    const x = hexSize * 3/2 * comp.position.q + centerX;
                    const y = hexSize * Math.sqrt(3) * (comp.position.r + comp.position.q/2) + centerY;
                    
                    // Draw shadow
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    ctx.beginPath();
                    ctx.arc(x + 5, y + 5, hexSize * 0.8, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Draw component as circle
                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(x, y, hexSize * 0.8, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Add glow effect
                    ctx.shadowColor = color;
                    ctx.shadowBlur = 20;
                    ctx.strokeStyle = color;
                    ctx.stroke();
                    ctx.shadowBlur = 0;
                }
            });
        }
        
        function drawCharacters() {
            characters.forEach(char => {
                const x = hexSize * 3/2 * char.position.q + centerX;
                const y = hexSize * Math.sqrt(3) * (char.position.r + char.position.q/2) + centerY;
                
                if (currentMode === 'backend' || currentMode === 'debug') {
                    // Draw as data packet
                    ctx.fillStyle = char.color;
                    ctx.fillRect(x - 5, y - 5, 10, 10);
                    
                    if (currentMode === 'debug') {
                        ctx.font = '8px Courier New';
                        ctx.fillText(char.name, x, y - 10);
                    }
                } else if (currentMode === 'user') {
                    // Draw as character sprite
                    ctx.fillStyle = char.color;
                    ctx.beginPath();
                    ctx.arc(x, y, 8, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Trail effect
                    ctx.strokeStyle = char.color + '40';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            });
        }
        
        function updateInfoPanel() {
            const panel = document.getElementById('system-info');
            let html = '';
            
            components.forEach(comp => {
                const healthPercent = comp.health * 100;
                const healthColor = authorityColors[comp.authorityLevel];
                
                html += \`
                    <div class="component-info">
                        <div style="color: \${healthColor}">\${comp.name.toUpperCase()}</div>
                        <div class="health-bar">
                            <div class="health-fill" style="width: \${healthPercent}%; background: \${healthColor}"></div>
                        </div>
                        <div style="font-size: 10px;">Type: \${comp.type} | Auth: \${comp.authorityLevel}</div>
                    </div>
                \`;
            });
            
            panel.innerHTML = html;
        }
        
        function animate() {
            ctx.fillStyle = currentMode === 'user' ? '#111' : '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            drawHexGrid();
            drawComponents();
            drawCharacters();
            
            requestAnimationFrame(animate);
        }
        
        function changeMode(mode) {
            currentMode = mode;
            window.location.href = \`?mode=\${mode}\`;
        }
        
        function simulateLoad() {
            ws.send(JSON.stringify({ type: 'simulate_load' }));
        }
        
        function simulateFailure() {
            const componentName = prompt('Which component to fail?', 'database');
            if (componentName) {
                ws.send(JSON.stringify({ 
                    type: 'simulate_failure',
                    componentName 
                }));
            }
        }
        
        function resetView() {
            components.clear();
            characters.clear();
            location.reload();
        }
        
        window.addEventListener('resize', resizeCanvas);
        init();
    </script>
</body>
</html>`;
    }
}

// Start the backend visualizer
new HexWorldBackendVisualizer();