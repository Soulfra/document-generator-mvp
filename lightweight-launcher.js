#!/usr/bin/env node

/**
 * LIGHTWEIGHT LAUNCHER
 * Start small, add layers only when needed
 */

const express = require('express');
const { exec } = require('child_process');

class LightweightLauncher {
    constructor() {
        console.log('🚀 LIGHTWEIGHT LAUNCHER - Start Small, Scale Up');
        
        this.app = express();
        this.port = 12000;
        this.runningServices = new Map();
        this.availableLayers = {
            foundation: { port: 9000, file: 'multidimensional-foundation.js', status: 'stopped' },
            backend: { port: 8097, file: 'backend-work-environment.js', status: 'stopped' },
            payments: { port: 8200, file: 'clean-payment-system.js', status: 'stopped' },
            characters: { port: 8300, file: 'image-to-voxel-clean.js', status: 'stopped' },
            hexworld: { port: 8090, file: 'hexagonal-isometric-platform.js', status: 'stopped' },
            dashboard: { port: 8400, file: 'unified-integration-dashboard.js', status: 'stopped' }
        };
        
        this.init();
    }
    
    init() {
        console.log('🎛️  PROGRESSIVE SCALING CONTROL PANEL');
        console.log('💡 Only starts what you need, when you need it\n');
        
        this.app.use(express.json());
        
        // Main control panel
        this.app.get('/', (req, res) => {
            res.send(this.getControlPanelHTML());
        });
        
        // Start a service
        this.app.post('/start/:service', (req, res) => {
            const service = req.params.service;
            this.startService(service).then(result => {
                res.json(result);
            });
        });
        
        // Stop a service
        this.app.post('/stop/:service', (req, res) => {
            const service = req.params.service;
            this.stopService(service);
            res.json({ success: true, message: `${service} stopped` });
        });
        
        // Get status
        this.app.get('/status', (req, res) => {
            res.json({
                layers: this.availableLayers,
                running: Array.from(this.runningServices.keys()),
                memory: process.memoryUsage()
            });
        });
        
        this.app.listen(this.port, () => {
            console.log(`✅ Control Panel: http://localhost:${this.port}`);
            console.log('🎯 Click layers to activate them progressively\n');
            
            setTimeout(() => {
                exec(`open http://localhost:${this.port}`);
            }, 1000);
        });
    }
    
    async startService(serviceName) {
        if (this.runningServices.has(serviceName)) {
            return { success: false, message: `${serviceName} already running` };
        }
        
        const config = this.availableLayers[serviceName];
        if (!config) {
            return { success: false, message: `Unknown service: ${serviceName}` };
        }
        
        console.log(`🔧 Starting ${serviceName}...`);
        
        try {
            const process = exec(`node "${config.file}"`, { cwd: __dirname });
            
            this.runningServices.set(serviceName, {
                process,
                port: config.port,
                startTime: Date.now()
            });
            
            config.status = 'running';
            
            console.log(`✅ ${serviceName} started on port ${config.port}`);
            return { 
                success: true, 
                message: `${serviceName} started on port ${config.port}`,
                url: `http://localhost:${config.port}`
            };
            
        } catch (error) {
            console.error(`❌ Failed to start ${serviceName}:`, error.message);
            return { success: false, message: error.message };
        }
    }
    
    stopService(serviceName) {
        const service = this.runningServices.get(serviceName);
        if (service) {
            service.process.kill();
            this.runningServices.delete(serviceName);
            this.availableLayers[serviceName].status = 'stopped';
            console.log(`⏹️  Stopped ${serviceName}`);
        }
    }
    
    getControlPanelHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🚀 Progressive Launcher</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, system-ui, sans-serif;
            background: #0a0a0a;
            color: #fff;
            padding: 20px;
            min-height: 100vh;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .title {
            font-size: 36px;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #00ff88, #00aaff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .subtitle {
            font-size: 18px;
            color: #888;
            margin-bottom: 20px;
        }
        
        .layer-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .layer-card {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid #333;
            border-radius: 15px;
            padding: 25px;
            transition: all 0.3s;
            cursor: pointer;
            position: relative;
        }
        
        .layer-card:hover {
            background: rgba(0, 255, 136, 0.1);
            border-color: #00ff88;
            transform: translateY(-5px);
        }
        
        .layer-card.running {
            border-color: #00ff88;
            background: rgba(0, 255, 136, 0.1);
        }
        
        .layer-card.running::after {
            content: '●';
            position: absolute;
            top: 15px;
            right: 15px;
            color: #00ff88;
            font-size: 20px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .layer-icon {
            font-size: 48px;
            margin-bottom: 15px;
            display: block;
        }
        
        .layer-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #fff;
        }
        
        .layer-description {
            font-size: 14px;
            color: #aaa;
            margin-bottom: 15px;
            line-height: 1.4;
        }
        
        .layer-port {
            font-size: 12px;
            color: #666;
            margin-bottom: 15px;
            font-family: monospace;
        }
        
        .layer-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .btn {
            padding: 8px 16px;
            border: 1px solid #00ff88;
            background: rgba(0, 255, 136, 0.1);
            color: #00ff88;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.2s;
            text-decoration: none;
            display: inline-block;
        }
        
        .btn:hover {
            background: #00ff88;
            color: #000;
        }
        
        .btn.stop {
            border-color: #ff4444;
            color: #ff4444;
            background: rgba(255, 68, 68, 0.1);
        }
        
        .btn.stop:hover {
            background: #ff4444;
            color: #fff;
        }
        
        .status-bar {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            padding: 15px 20px;
            border-radius: 10px;
            border: 1px solid #00ff88;
            backdrop-filter: blur(10px);
        }
        
        .memory-usage {
            font-size: 12px;
            color: #888;
            margin-top: 5px;
        }
        
        .quick-actions {
            text-align: center;
            margin: 30px 0;
        }
        
        .quick-btn {
            margin: 0 10px;
            padding: 12px 24px;
            font-size: 16px;
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 255, 136, 0.9);
            color: #000;
            padding: 15px 25px;
            border-radius: 8px;
            font-weight: bold;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s;
        }
        
        .notification.show {
            transform: translateX(0);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">🚀 Progressive Launcher</div>
        <div class="subtitle">Start small, scale up as needed • Only use what you need</div>
    </div>
    
    <div class="quick-actions">
        <button class="btn quick-btn" onclick="startBasic()">⚡ Start Basic (Characters + Hex)</button>
        <button class="btn quick-btn" onclick="startAll()">🔥 Start All Layers</button>
        <button class="btn quick-btn stop" onclick="stopAll()">⏹️ Stop All</button>
    </div>
    
    <div class="layer-grid">
        <div class="layer-card" id="foundation-card">
            <span class="layer-icon">🌌</span>
            <div class="layer-title">Foundation</div>
            <div class="layer-description">5-dimensional reality engine. Core system that everything flows through.</div>
            <div class="layer-port">Port: 9000</div>
            <div class="layer-actions">
                <button class="btn" onclick="toggleService('foundation')">Start</button>
                <a href="http://localhost:9000" target="_blank" class="btn" style="display: none;">Open</a>
            </div>
        </div>
        
        <div class="layer-card" id="backend-card">
            <span class="layer-icon">⚙️</span>
            <div class="layer-title">Backend Engine</div>
            <div class="layer-description">The engine room. Database tools, thread rippers, and control systems.</div>
            <div class="layer-port">Port: 8097</div>
            <div class="layer-actions">
                <button class="btn" onclick="toggleService('backend')">Start</button>
                <a href="http://localhost:8097" target="_blank" class="btn" style="display: none;">Open</a>
            </div>
        </div>
        
        <div class="layer-card" id="payments-card">
            <span class="layer-icon">💳</span>
            <div class="layer-title">Payment System</div>
            <div class="layer-description">QR/RFID verification with Stripe integration. Clean payment processing.</div>
            <div class="layer-port">Port: 8200</div>
            <div class="layer-actions">
                <button class="btn" onclick="toggleService('payments')">Start</button>
                <a href="http://localhost:8200" target="_blank" class="btn" style="display: none;">Open</a>
            </div>
        </div>
        
        <div class="layer-card" id="characters-card">
            <span class="layer-icon">🎨</span>
            <div class="layer-title">Voxel Characters</div>
            <div class="layer-description">Drag & drop images to create 3D voxel characters for the game world.</div>
            <div class="layer-port">Port: 8300</div>
            <div class="layer-actions">
                <button class="btn" onclick="toggleService('characters')">Start</button>
                <a href="http://localhost:8300" target="_blank" class="btn" style="display: none;">Open</a>
            </div>
        </div>
        
        <div class="layer-card" id="hexworld-card">
            <span class="layer-icon">🎮</span>
            <div class="layer-title">Hex World</div>
            <div class="layer-description">Isometric 3rd person game world. Like RuneScape meets Habbo Hotel.</div>
            <div class="layer-port">Port: 8090</div>
            <div class="layer-actions">
                <button class="btn" onclick="toggleService('hexworld')">Start</button>
                <a href="http://localhost:8090" target="_blank" class="btn" style="display: none;">Open</a>
            </div>
        </div>
        
        <div class="layer-card" id="dashboard-card">
            <span class="layer-icon">📊</span>
            <div class="layer-title">Dashboard</div>
            <div class="layer-description">Unified control center that brings everything together in one interface.</div>
            <div class="layer-port">Port: 8400</div>
            <div class="layer-actions">
                <button class="btn" onclick="toggleService('dashboard')">Start</button>
                <a href="http://localhost:8400" target="_blank" class="btn" style="display: none;">Open</a>
            </div>
        </div>
    </div>
    
    <div class="status-bar">
        <div>🖥️ System Status</div>
        <div id="running-count">Running: 0 services</div>
        <div class="memory-usage" id="memory-usage">Memory: Checking...</div>
    </div>
    
    <div class="notification" id="notification"></div>
    
    <script>
        async function toggleService(serviceName) {
            const card = document.getElementById(serviceName + '-card');
            const button = card.querySelector('.btn');
            const openLink = card.querySelector('a');
            
            if (card.classList.contains('running')) {
                // Stop service
                button.textContent = 'Stopping...';
                try {
                    await fetch('/stop/' + serviceName, { method: 'POST' });
                    card.classList.remove('running');
                    button.textContent = 'Start';
                    openLink.style.display = 'none';
                    showNotification(serviceName + ' stopped');
                } catch (error) {
                    showNotification('Failed to stop ' + serviceName);
                }
            } else {
                // Start service
                button.textContent = 'Starting...';
                try {
                    const response = await fetch('/start/' + serviceName, { method: 'POST' });
                    const result = await response.json();
                    
                    if (result.success) {
                        card.classList.add('running');
                        button.textContent = 'Stop';
                        openLink.style.display = 'inline-block';
                        showNotification(serviceName + ' started on port ' + result.url.split(':').pop());
                    } else {
                        showNotification('Failed to start ' + serviceName + ': ' + result.message);
                        button.textContent = 'Start';
                    }
                } catch (error) {
                    showNotification('Error starting ' + serviceName);
                    button.textContent = 'Start';
                }
            }
            
            updateStatus();
        }
        
        async function startBasic() {
            showNotification('Starting basic setup...');
            await toggleService('characters');
            setTimeout(() => toggleService('hexworld'), 2000);
        }
        
        async function startAll() {
            showNotification('Starting all services...');
            const services = ['foundation', 'backend', 'payments', 'characters', 'hexworld', 'dashboard'];
            
            for (let i = 0; i < services.length; i++) {
                const service = services[i];
                const card = document.getElementById(service + '-card');
                if (!card.classList.contains('running')) {
                    await toggleService(service);
                    if (i < services.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
        }
        
        async function stopAll() {
            showNotification('Stopping all services...');
            const services = ['dashboard', 'hexworld', 'characters', 'payments', 'backend', 'foundation'];
            
            for (const service of services) {
                const card = document.getElementById(service + '-card');
                if (card.classList.contains('running')) {
                    await toggleService(service);
                }
            }
        }
        
        async function updateStatus() {
            try {
                const response = await fetch('/status');
                const status = await response.json();
                
                document.getElementById('running-count').textContent = 
                    'Running: ' + status.running.length + ' services';
                    
                const memoryMB = Math.round(status.memory.rss / 1024 / 1024);
                document.getElementById('memory-usage').textContent = 
                    'Memory: ' + memoryMB + ' MB';
                    
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        }
        
        function showNotification(message) {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
        
        // Update status every 5 seconds
        setInterval(updateStatus, 5000);
        updateStatus();
        
        console.log('🚀 Progressive Launcher Ready');
        console.log('💡 Start with just what you need, scale up progressively');
    </script>
</body>
</html>`;
    }
}

// Start the lightweight launcher
new LightweightLauncher();