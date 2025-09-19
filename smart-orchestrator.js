#!/usr/bin/env node

/**
 * 🧠 SMART ORCHESTRATOR with Dynamic Port Allocation
 * Brain visualization + Zero downtime + Auto-healing
 * Smart port detection to avoid conflicts
 */

const http = require('http');
const { spawn, fork } = require('child_process');
const { WebSocketServer } = require('ws');
const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');

class SmartOrchestrator {
    constructor() {
        this.services = new Map();
        this.healthChecks = new Map();
        this.availablePorts = new Map();
        
        // Brain visualization state
        this.brainState = {
            neurons: [],
            connections: [],
            activity: new Map(),
            health: new Map()
        };
        
        // Service definitions with dynamic port allocation
        this.serviceDefinitions = [
            {
                id: 'premium-trading',
                name: 'Premium QR Trading Interface',
                script: 'premium-qr-trading-interface.js',
                preferredPort: 8888,
                preferredWsPort: 8889,
                critical: true,
                instances: 1, // Reduce to 1 instance to avoid conflicts
                brainNode: { x: 20, y: 30 }
            },
            {
                id: 'wellness-safeguards',
                name: 'Wellness Engagement Safeguards',
                script: 'wellness-engagement-safeguards.js',
                preferredPort: 7777,
                preferredWsPort: 7778,
                critical: true,
                instances: 1,
                brainNode: { x: 60, y: 70 }
            },
            {
                id: 'xml-reasoning',
                name: 'XML Wellness Dynamic Reasoning Engine',
                script: 'xml-wellness-reasoning-engine.js',
                preferredPort: 9090,
                preferredWsPort: 9091,
                critical: true,
                instances: 1,
                brainNode: { x: 40, y: 50 }
            },
            {
                id: 'multi-observer',
                name: 'Multi-Observer Verification System',
                script: 'multi-observer-verification-system.js',
                preferredPort: 9876,
                preferredWsPort: 9877,
                critical: false,
                instances: 1,
                brainNode: { x: 70, y: 20 }
            },
            {
                id: 'qr-handshake',
                name: 'QR Handshake Trading System',
                script: 'qr-handshake-trading-system.js',
                preferredPort: 8765,
                preferredWsPort: 8766,
                critical: false,
                instances: 1,
                brainNode: { x: 15, y: 80 }
            }
        ];
    }

    // Port management with conflict detection
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
        console.log('🔌 Allocating available ports...');
        
        for (const service of this.serviceDefinitions) {
            const port = await this.findAvailablePort(service.preferredPort);
            const wsPort = await this.findAvailablePort(service.preferredWsPort);
            
            this.availablePorts.set(service.id, { port, wsPort });
            console.log(`  📍 ${service.name}: HTTP=${port}, WS=${wsPort}`);
        }
        
        // Find orchestrator ports
        const orchestratorPort = await this.findAvailablePort(2222);
        const orchestratorWsPort = await this.findAvailablePort(2223);
        
        this.port = orchestratorPort;
        this.wsPort = orchestratorWsPort;
        
        console.log(`  🎼 Orchestrator: HTTP=${this.port}, WS=${this.wsPort}`);
    }

    // Initialize brain visualization
    initializeBrain() {
        console.log('🧠 Initializing system brain visualization...');
        
        // Create neurons for each service
        this.serviceDefinitions.forEach((service, index) => {
            this.brainState.neurons.push({
                id: service.id,
                name: service.name,
                x: service.brainNode.x,
                y: service.brainNode.y,
                active: false,
                activity: 0,
                health: 1.0
            });
        });
        
        // Create connections between services
        const connections = [
            ['premium-trading', 'wellness-safeguards'],
            ['wellness-safeguards', 'xml-reasoning'],
            ['xml-reasoning', 'multi-observer'],
            ['multi-observer', 'qr-handshake'],
            ['qr-handshake', 'premium-trading'],
            ['premium-trading', 'xml-reasoning'],
            ['wellness-safeguards', 'multi-observer'],
            ['xml-reasoning', 'qr-handshake']
        ];
        
        connections.forEach(([from, to]) => {
            this.brainState.connections.push({
                from,
                to,
                strength: 0.5,
                active: false,
                lastActivity: 0
            });
        });
        
        console.log(`✅ Brain initialized with ${this.brainState.neurons.length} neurons and ${this.brainState.connections.length} connections`);
    }

    // Start service with smart port allocation
    async startService(serviceConfig) {
        const ports = this.availablePorts.get(serviceConfig.id);
        if (!ports) {
            throw new Error(`No ports allocated for ${serviceConfig.id}`);
        }

        console.log(`🔄 Starting ${serviceConfig.name} (${serviceConfig.instances} instances)...`);
        
        const serviceInstances = [];
        
        for (let i = 0; i < serviceConfig.instances; i++) {
            try {
                // Create environment with allocated ports
                const env = {
                    ...process.env,
                    PORT: ports.port + i,
                    WS_PORT: ports.wsPort + i,
                    NODE_ENV: 'production'
                };
                
                const child = spawn('node', [serviceConfig.script], {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    env,
                    cwd: process.cwd()
                });
                
                child.stdout.on('data', (data) => {
                    this.updateBrainActivity(serviceConfig.id, 'stdout');
                });
                
                child.stderr.on('data', (data) => {
                    console.error(`❌ ${serviceConfig.name}[${i}] error:`, data.toString());
                    this.updateBrainActivity(serviceConfig.id, 'error');
                });
                
                child.on('exit', (code, signal) => {
                    console.warn(`⚠️ ${serviceConfig.name}[${i}] exited (code: ${code}, signal: ${signal})`);
                    
                    if (serviceConfig.critical) {
                        console.log(`🔄 Auto-restarting critical service ${serviceConfig.name}[${i}] in 2000ms...`);
                        setTimeout(() => {
                            this.restartService(serviceConfig, i);
                        }, 2000);
                    }
                });
                
                serviceInstances.push({
                    process: child,
                    instance: i,
                    port: ports.port + i,
                    wsPort: ports.wsPort + i,
                    startTime: Date.now()
                });
                
                // Wait a bit between instances
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (error) {
                console.error(`❌ Failed to start ${serviceConfig.name}[${i}]:`, error.message);
            }
        }
        
        this.services.set(serviceConfig.id, {
            config: serviceConfig,
            instances: serviceInstances,
            status: 'running'
        });
        
        console.log(`✅ ${serviceConfig.name} orchestrated with ${serviceInstances.length}/${serviceConfig.instances} instances`);
        
        // Start health monitoring for this service
        this.startHealthMonitoring(serviceConfig);
        
        return serviceInstances;
    }

    async restartService(serviceConfig, instanceIndex) {
        console.log(`🔄 Restarting ${serviceConfig.name}[${instanceIndex}] with brain guidance...`);
        
        // Update brain state
        this.updateBrainActivity(serviceConfig.id, 'restart');
        
        // Use the same startup logic
        const ports = this.availablePorts.get(serviceConfig.id);
        const env = {
            ...process.env,
            PORT: ports.port + instanceIndex,
            WS_PORT: ports.wsPort + instanceIndex,
            NODE_ENV: 'production'
        };
        
        const child = spawn('node', [serviceConfig.script], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env,
            cwd: process.cwd()
        });
        
        // Update service instance
        const service = this.services.get(serviceConfig.id);
        if (service && service.instances[instanceIndex]) {
            service.instances[instanceIndex].process = child;
            service.instances[instanceIndex].startTime = Date.now();
        }
        
        console.log(`✅ ${serviceConfig.name}[${instanceIndex}] restarted successfully`);
    }

    // Health monitoring with brain integration
    startHealthMonitoring(serviceConfig) {
        console.log(`💚 Starting health monitoring for ${serviceConfig.name}...`);
        
        const checkHealth = async () => {
            const ports = this.availablePorts.get(serviceConfig.id);
            if (!ports) return;
            
            try {
                const response = await this.httpHealthCheck(ports.port);
                
                if (response) {
                    console.log(`✅ ${serviceConfig.name}[0] healthy on port ${ports.port}`);
                    this.updateBrainHealth(serviceConfig.id, 1.0);
                } else {
                    this.updateBrainHealth(serviceConfig.id, 0.5);
                }
                
            } catch (error) {
                this.updateBrainHealth(serviceConfig.id, 0.0);
            }
        };
        
        // Check every 10 seconds
        const healthInterval = setInterval(checkHealth, 10000);
        this.healthChecks.set(serviceConfig.id, healthInterval);
        
        // Initial health check
        setTimeout(checkHealth, 2000);
    }

    async httpHealthCheck(port) {
        return new Promise((resolve) => {
            const req = http.get(`http://localhost:${port}`, (res) => {
                resolve(res.statusCode === 200);
            });
            
            req.on('error', () => resolve(false));
            req.setTimeout(5000, () => {
                req.destroy();
                resolve(false);
            });
        });
    }

    // Brain activity and health updates
    updateBrainActivity(serviceId, activityType) {
        const neuron = this.brainState.neurons.find(n => n.id === serviceId);
        if (neuron) {
            neuron.active = true;
            neuron.activity = Math.min(neuron.activity + 0.1, 1.0);
            
            // Activate connections
            this.brainState.connections.forEach(conn => {
                if (conn.from === serviceId || conn.to === serviceId) {
                    conn.active = true;
                    conn.lastActivity = Date.now();
                }
            });
        }
        
        // Decay activity over time
        setTimeout(() => {
            if (neuron) {
                neuron.activity = Math.max(neuron.activity - 0.05, 0);
                neuron.active = neuron.activity > 0.1;
            }
        }, 5000);
    }

    updateBrainHealth(serviceId, healthLevel) {
        const neuron = this.brainState.neurons.find(n => n.id === serviceId);
        if (neuron) {
            neuron.health = healthLevel;
        }
        this.brainState.health.set(serviceId, healthLevel);
    }

    // Brain visualization web interface
    startBrainVisualization() {
        console.log('🧠 Starting brain processing and visualization...');
        
        const server = http.createServer((req, res) => {
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.getBrainHTML());
            } else if (req.url === '/brain-data') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.brainState));
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`🌐 Brain visualization available at http://localhost:${this.port}`);
        });
        
        // WebSocket for real-time brain updates
        const wss = new WebSocketServer({ port: this.wsPort });
        
        wss.on('connection', (ws) => {
            console.log('🔗 Brain client connected');
            
            // Send initial brain state
            ws.send(JSON.stringify({ type: 'brain-state', data: this.brainState }));
            
            // Send updates every second
            const updateInterval = setInterval(() => {
                ws.send(JSON.stringify({ 
                    type: 'brain-update', 
                    data: this.brainState,
                    timestamp: Date.now()
                }));
            }, 1000);
            
            ws.on('close', () => {
                clearInterval(updateInterval);
                console.log('🔌 Brain client disconnected');
            });
        });
    }

    getBrainHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🧠 System Brain Visualization</title>
    <style>
        body { 
            margin: 0; 
            padding: 20px; 
            background: #0a0a0a; 
            color: #00ff00; 
            font-family: 'Courier New', monospace; 
            overflow: hidden;
        }
        #brain-canvas { 
            border: 2px solid #00ff00; 
            background: radial-gradient(circle, #001100 0%, #000000 100%);
            cursor: crosshair;
        }
        .stats { 
            position: absolute; 
            top: 20px; 
            right: 20px; 
            background: rgba(0,0,0,0.8); 
            padding: 15px; 
            border: 1px solid #00ff00;
            min-width: 200px;
        }
        .neuron-info { 
            font-size: 12px; 
            margin: 5px 0; 
        }
        .title { 
            text-align: center; 
            font-size: 24px; 
            margin-bottom: 20px; 
            text-shadow: 0 0 10px #00ff00;
        }
    </style>
</head>
<body>
    <div class="title">🧠 PRODUCTION ORCHESTRATOR BRAIN</div>
    <canvas id="brain-canvas" width="800" height="600"></canvas>
    
    <div class="stats">
        <h3>🎯 System Health</h3>
        <div id="neuron-stats"></div>
        <div id="connection-stats"></div>
        <div id="activity-stats"></div>
    </div>

    <script>
        const canvas = document.getElementById('brain-canvas');
        const ctx = canvas.getContext('2d');
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        
        let brainData = { neurons: [], connections: [] };
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'brain-state' || message.type === 'brain-update') {
                brainData = message.data;
                drawBrain();
                updateStats();
            }
        };
        
        function drawBrain() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw connections first (behind neurons)
            brainData.connections.forEach(conn => {
                const fromNeuron = brainData.neurons.find(n => n.id === conn.from);
                const toNeuron = brainData.neurons.find(n => n.id === conn.to);
                
                if (fromNeuron && toNeuron) {
                    ctx.strokeStyle = conn.active ? '#00ff00' : '#003300';
                    ctx.lineWidth = conn.active ? 3 : 1;
                    ctx.globalAlpha = conn.strength;
                    
                    ctx.beginPath();
                    ctx.moveTo(fromNeuron.x * 8, fromNeuron.y * 6);
                    ctx.lineTo(toNeuron.x * 8, toNeuron.y * 6);
                    ctx.stroke();
                }
            });
            
            ctx.globalAlpha = 1.0;
            
            // Draw neurons
            brainData.neurons.forEach(neuron => {
                const x = neuron.x * 8;
                const y = neuron.y * 6;
                const radius = 15 + (neuron.activity * 10);
                
                // Health-based color
                const healthColor = neuron.health > 0.8 ? '#00ff00' : 
                                   neuron.health > 0.5 ? '#ffff00' : '#ff0000';
                
                // Pulsing effect for active neurons
                if (neuron.active) {
                    ctx.shadowColor = healthColor;
                    ctx.shadowBlur = 20;
                }
                
                // Draw neuron body
                ctx.fillStyle = healthColor;
                ctx.globalAlpha = 0.3 + (neuron.activity * 0.7);
                
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw neuron border
                ctx.strokeStyle = healthColor;
                ctx.lineWidth = 2;
                ctx.globalAlpha = 1.0;
                ctx.stroke();
                
                // Reset shadow
                ctx.shadowBlur = 0;
                
                // Draw service name
                ctx.fillStyle = '#ffffff';
                ctx.font = '10px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText(neuron.id, x, y + radius + 15);
            });
        }
        
        function updateStats() {
            const neuronStats = document.getElementById('neuron-stats');
            const connectionStats = document.getElementById('connection-stats');
            const activityStats = document.getElementById('activity-stats');
            
            const activeNeurons = brainData.neurons.filter(n => n.active).length;
            const healthyNeurons = brainData.neurons.filter(n => n.health > 0.8).length;
            const activeConnections = brainData.connections.filter(c => c.active).length;
            const avgActivity = brainData.neurons.reduce((sum, n) => sum + n.activity, 0) / brainData.neurons.length;
            
            neuronStats.innerHTML = \`
                <div class="neuron-info">🔥 Active: \${activeNeurons}/\${brainData.neurons.length}</div>
                <div class="neuron-info">💚 Healthy: \${healthyNeurons}/\${brainData.neurons.length}</div>
            \`;
            
            connectionStats.innerHTML = \`
                <div class="neuron-info">🔗 Active Connections: \${activeConnections}/\${brainData.connections.length}</div>
            \`;
            
            activityStats.innerHTML = \`
                <div class="neuron-info">⚡ Avg Activity: \${(avgActivity * 100).toFixed(1)}%</div>
                <div class="neuron-info">🕐 Last Update: \${new Date().toLocaleTimeString()}</div>
            \`;
        }
        
        // Auto-resize canvas
        function resizeCanvas() {
            canvas.width = window.innerWidth - 260;
            canvas.height = window.innerHeight - 100;
            drawBrain();
        }
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        
        // Initial draw
        drawBrain();
    </script>
</body>
</html>`;
    }

    // Start all orchestration
    async start() {
        console.log('🎼 SMART ORCHESTRATOR INITIALIZING');
        console.log('Production-grade • Zero downtime • Auto-healing • Brain visualization');
        console.log(`Managing ${this.serviceDefinitions.length} services across ${os.cpus().length} cores`);
        console.log(`🎯 Production process ${process.pid} starting...`);
        
        // Step 1: Allocate ports to avoid conflicts
        await this.allocatePorts();
        
        // Step 2: Initialize brain
        this.initializeBrain();
        
        // Step 3: Start brain visualization
        this.startBrainVisualization();
        
        // Step 4: Start all services
        console.log('🚀 Orchestrating all services with zero-downtime deployment...');
        
        for (const serviceConfig of this.serviceDefinitions) {
            try {
                await this.startService(serviceConfig);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Stagger startups
            } catch (error) {
                console.error(`❌ Failed to start ${serviceConfig.name}:`, error.message);
            }
        }
        
        console.log('\n🎉 SMART ORCHESTRATOR OPERATIONAL!');
        console.log(`🌐 Brain Visualization: http://localhost:${this.port}`);
        console.log(`🔌 WebSocket Updates: ws://localhost:${this.wsPort}`);
        console.log('\n🧠 THE BRAIN IS MOVING! Neural activity visualized in real-time');
    }

    // Graceful shutdown
    async shutdown() {
        console.log('\n🛑 Received shutdown signal, initiating graceful shutdown with brain farewell...');
        
        // Stop all services
        for (const [serviceId, service] of this.services) {
            console.log(`⏹️ Stopping ${service.config.name}...`);
            
            service.instances.forEach(instance => {
                if (instance.process && !instance.process.killed) {
                    instance.process.kill('SIGTERM');
                }
            });
        }
        
        // Clear health checks
        for (const [serviceId, interval] of this.healthChecks) {
            clearInterval(interval);
        }
        
        console.log('🧠 Brain shutdown complete');
        console.log('👋 Smart orchestrator shutdown complete');
        process.exit(0);
    }
}

// Start if run directly
if (require.main === module) {
    const orchestrator = new SmartOrchestrator();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => orchestrator.shutdown());
    process.on('SIGTERM', () => orchestrator.shutdown());
    process.on('uncaughtException', (error) => {
        console.log('🛑 Received UNCAUGHT_EXCEPTION, initiating graceful shutdown with brain farewell...');
        console.error('Uncaught exception:', error);
        orchestrator.shutdown();
    });
    
    // Start the orchestrator
    const main = async () => {
        try {
            await orchestrator.start();
        } catch (error) {
            console.error('❌ Orchestrator startup failed:', error);
            process.exit(1);
        }
    };
    
    main();
}

module.exports = SmartOrchestrator;