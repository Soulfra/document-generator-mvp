#!/usr/bin/env node

/**
 * 🚀 EVENT-DRIVEN DAEMON MANAGER
 * 
 * Converts always-running daemons to event-driven activation
 * - Click to activate/deactivate daemons
 * - Stasis mode when not needed  
 * - SMTP/post office addressing for inter-daemon communication
 * - Resource-efficient event-based triggers instead of continuous polling
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const WebSocket = require('ws');

// Import existing daemon systems
const AutonomousSystemGuardian = require('./AUTONOMOUS-SYSTEM-GUARDIAN.js');
const SoulframBackupSystem = require('./SOULFRA-COMPREHENSIVE-BACKUP-REHYDRATION-SYSTEM.js');
const UnifiedEventSpawnOrchestrator = require('./unified-event-spawn-orchestrator.js');

class EventDrivenDaemonManager extends EventEmitter {
    constructor() {
        super();
        
        console.log('🚀 EVENT-DRIVEN DAEMON MANAGER STARTING...');
        console.log('Converting always-running daemons to event-driven activation\n');
        
        // Daemon registry
        this.daemons = new Map();
        this.stasisTimeout = 5 * 60 * 1000; // 5 minutes of inactivity = stasis
        this.lastActivity = new Map();
        
        // SMTP-style addressing system
        this.postOffice = {
            addresses: new Map(), // daemonId -> address
            mailbox: new Map(),   // address -> message queue
            routes: new Map()     // event pattern -> daemon addresses
        };
        
        // Dashboard server
        this.app = express();
        this.port = 4000;
        this.wss = null;
        
        // Initialize daemon definitions
        this.initializeDaemonRegistry();
        
        // Setup post office addressing
        this.setupPostOffice();
        
        // Start dashboard
        this.startDashboard();
        
        // Monitor for stasis
        this.startStasisMonitor();
    }
    
    initializeDaemonRegistry() {
        console.log('📋 Registering available daemons...');
        
        // Guardian Daemon
        this.registerDaemon({
            id: 'guardian',
            name: '🛡️ System Guardian',
            description: 'Autonomous system monitoring and healing',
            class: AutonomousSystemGuardian,
            address: 'guardian@soulfra.local',
            triggers: ['system.error', 'service.down', 'health.check', 'click.activate'],
            resources: { memory: 'high', cpu: 'medium', network: 'low' },
            priority: 'critical',
            autoStart: false,
            stasisEnabled: true
        });
        
        // Backup/Rehydration Daemon  
        this.registerDaemon({
            id: 'backup',
            name: '💾 Backup & Rehydration',
            description: 'Comprehensive backup and restore system',
            class: SoulframBackupSystem,
            address: 'backup@soulfra.local',
            triggers: ['backup.request', 'restore.request', 'schedule.backup', 'click.activate'],
            resources: { memory: 'low', cpu: 'low', network: 'medium' },
            priority: 'high',
            autoStart: false,
            stasisEnabled: true
        });
        
        // Event Spawn Orchestrator
        this.registerDaemon({
            id: 'spawner',
            name: '🌟 Event Spawn Orchestrator',
            description: 'Unified event spawning and orchestration',
            class: UnifiedEventSpawnOrchestrator,
            address: 'spawner@soulfra.local',
            triggers: ['spawn.event', 'game.start', 'user.join', 'click.activate'],
            resources: { memory: 'medium', cpu: 'high', network: 'high' },
            priority: 'medium',
            autoStart: false,
            stasisEnabled: true
        });
        
        console.log(`✅ ${this.daemons.size} daemons registered\n`);
    }
    
    registerDaemon(config) {
        this.daemons.set(config.id, {
            ...config,
            status: 'stasis',
            instance: null,
            lastActivity: 0,
            activationCount: 0,
            resourceUsage: { memory: 0, cpu: 0 }
        });
        
        // Register post office address
        this.postOffice.addresses.set(config.id, config.address);
        this.postOffice.mailbox.set(config.address, []);
        
        // Register event route patterns
        for (const trigger of config.triggers) {
            if (!this.postOffice.routes.has(trigger)) {
                this.postOffice.routes.set(trigger, []);
            }
            this.postOffice.routes.get(trigger).push(config.address);
        }
        
        console.log(`  📦 Registered: ${config.name} (${config.address})`);
    }
    
    setupPostOffice() {
        console.log('📮 Setting up SMTP-style post office...');
        
        // Listen for events that should trigger daemon activation
        this.on('daemon.message', (event) => {
            this.routeMessage(event);
        });
        
        // Setup automatic event routing
        this.setupEventRouting();
        
        console.log('✅ Post office ready for daemon messaging\n');
    }
    
    setupEventRouting() {
        // Convert system events to daemon messages
        const systemEvents = [
            { pattern: /error/i, trigger: 'system.error' },
            { pattern: /backup/i, trigger: 'backup.request' },
            { pattern: /spawn/i, trigger: 'spawn.event' },
            { pattern: /health/i, trigger: 'health.check' }
        ];
        
        // Monitor for these patterns in logs/events
        setInterval(() => {
            this.checkForTriggerEvents();
        }, 30000); // Check every 30 seconds instead of continuous
    }
    
    async checkForTriggerEvents() {
        // Check log files for trigger patterns
        const logFiles = [
            'unified-database.json',
            'startup-verification-report.json'
        ];
        
        for (const logFile of logFiles) {
            try {
                const exists = await fs.access(logFile).then(() => true).catch(() => false);
                if (exists) {
                    const content = await fs.readFile(logFile, 'utf8');
                    
                    // Check for error patterns
                    if (content.includes('error') || content.includes('failed')) {
                        await this.sendMessage('system.error', {
                            source: logFile,
                            timestamp: Date.now(),
                            content: content.substring(0, 1000)
                        });
                    }
                }
            } catch (error) {
                // Ignore parsing errors
            }
        }
    }
    
    async sendMessage(trigger, data) {
        const addresses = this.postOffice.routes.get(trigger) || [];
        
        for (const address of addresses) {
            const message = {
                id: crypto.randomUUID(),
                trigger,
                data,
                timestamp: Date.now(),
                from: 'daemon.manager@soulfra.local',
                to: address
            };
            
            // Add to mailbox
            this.postOffice.mailbox.get(address).push(message);
            
            // Activate daemon if needed
            const daemonId = this.getIdByAddress(address);
            if (daemonId) {
                await this.activateDaemon(daemonId, `Message: ${trigger}`);
            }
        }
    }
    
    getIdByAddress(address) {
        for (const [id, daemon] of this.daemons) {
            if (daemon.address === address) {
                return id;
            }
        }
        return null;
    }
    
    async activateDaemon(daemonId, reason = 'Manual activation') {
        const daemon = this.daemons.get(daemonId);
        if (!daemon) {
            throw new Error(`Daemon ${daemonId} not found`);
        }
        
        console.log(`🚀 Activating daemon: ${daemon.name}`);
        console.log(`   Reason: ${reason}`);
        
        // Already active?
        if (daemon.status === 'active' && daemon.instance) {
            console.log(`   Already active, refreshing activity timer`);
            this.lastActivity.set(daemonId, Date.now());
            return daemon.instance;
        }
        
        // Create instance with event-driven wrapper
        daemon.instance = await this.createEventDrivenWrapper(daemon);
        daemon.status = 'active';
        daemon.activationCount++;
        this.lastActivity.set(daemonId, Date.now());
        
        // Process any queued messages
        await this.processMailbox(daemon.address);
        
        console.log(`✅ Daemon ${daemon.name} activated successfully\n`);
        
        // Emit activation event
        this.emit('daemon.activated', { daemonId, daemon: daemon.name, reason });
        
        return daemon.instance;
    }
    
    async createEventDrivenWrapper(daemon) {
        console.log(`🔧 Creating event-driven wrapper for ${daemon.name}...`);
        
        // Create wrapper that intercepts continuous operations
        const wrapper = {
            daemon: new daemon.class(),
            timers: [],
            intervals: [],
            servers: [],
            originalMethods: {}
        };
        
        // Intercept setInterval calls to make them event-driven
        const originalSetInterval = setInterval;
        wrapper.daemon.setInterval = (callback, ms) => {
            console.log(`🔄 Converting ${ms}ms interval to event-driven trigger`);
            
            // Instead of continuous interval, trigger on events
            const eventTrigger = () => {
                this.lastActivity.set(daemon.id, Date.now());
                callback();
            };
            
            // Store for cleanup
            const intervalId = originalSetInterval(eventTrigger, ms * 5); // 5x less frequent
            wrapper.intervals.push(intervalId);
            
            return intervalId;
        };
        
        // Intercept setTimeout to track activity
        const originalSetTimeout = setTimeout;
        wrapper.daemon.setTimeout = (callback, ms) => {
            const timeoutId = originalSetTimeout(() => {
                this.lastActivity.set(daemon.id, Date.now());
                callback();
            }, ms);
            
            wrapper.timers.push(timeoutId);
            return timeoutId;
        };
        
        // Start the daemon with event-driven modifications
        if (typeof wrapper.daemon.start === 'function') {
            await wrapper.daemon.start();
        }
        
        return wrapper;
    }
    
    async processMailbox(address) {
        const messages = this.postOffice.mailbox.get(address) || [];
        if (messages.length === 0) return;
        
        console.log(`📬 Processing ${messages.length} messages for ${address}`);
        
        const daemonId = this.getIdByAddress(address);
        const daemon = this.daemons.get(daemonId);
        
        for (const message of messages) {
            try {
                // Send message to daemon instance
                if (daemon.instance && daemon.instance.daemon.emit) {
                    daemon.instance.daemon.emit(message.trigger, message.data);
                }
                
                console.log(`   📨 Processed: ${message.trigger}`);
            } catch (error) {
                console.error(`   ❌ Failed to process message: ${error.message}`);
            }
        }
        
        // Clear processed messages
        this.postOffice.mailbox.set(address, []);
    }
    
    async putDaemonInStasis(daemonId, reason = 'Inactivity timeout') {
        const daemon = this.daemons.get(daemonId);
        if (!daemon || daemon.status !== 'active') return;
        
        console.log(`😴 Putting daemon in stasis: ${daemon.name}`);
        console.log(`   Reason: ${reason}`);
        
        // Cleanup resources
        if (daemon.instance) {
            // Clear all intervals and timeouts
            for (const intervalId of daemon.instance.intervals) {
                clearInterval(intervalId);
            }
            for (const timerId of daemon.instance.timers) {
                clearTimeout(timerId);
            }
            
            // Gracefully shutdown daemon
            if (typeof daemon.instance.daemon.stop === 'function') {
                await daemon.instance.daemon.stop();
            }
        }
        
        daemon.instance = null;
        daemon.status = 'stasis';
        
        console.log(`✅ Daemon ${daemon.name} in stasis\n`);
        
        // Emit stasis event
        this.emit('daemon.stasis', { daemonId, daemon: daemon.name, reason });
    }
    
    startStasisMonitor() {
        console.log('😴 Starting stasis monitor...');
        
        // Check for inactive daemons every minute
        setInterval(() => {
            const now = Date.now();
            
            for (const [daemonId, daemon] of this.daemons) {
                if (daemon.status === 'active' && daemon.stasisEnabled) {
                    const lastActivity = this.lastActivity.get(daemonId) || 0;
                    
                    if (now - lastActivity > this.stasisTimeout) {
                        this.putDaemonInStasis(daemonId, 'Inactivity timeout');
                    }
                }
            }
        }, 60000); // Check every minute
        
        console.log('✅ Stasis monitor active\n');
    }
    
    startDashboard() {
        console.log('🎮 Starting daemon control dashboard...');
        
        // Setup static files
        this.app.use(express.static(__dirname));
        this.app.use(express.json());
        
        // API endpoints
        this.setupDashboardAPI();
        
        // WebSocket for real-time updates
        this.startWebSocketServer();
        
        // Create dashboard HTML
        this.createDashboardHTML();
        
        // Start server
        this.app.listen(this.port, () => {
            console.log(`✅ Dashboard running at http://localhost:${this.port}`);
            console.log(`   WebSocket server on ws://localhost:${this.port + 1}\n`);
        });
    }
    
    setupDashboardAPI() {
        // Get all daemon status
        this.app.get('/api/daemons', (req, res) => {
            const daemonList = Array.from(this.daemons.entries()).map(([id, daemon]) => ({
                id,
                name: daemon.name,
                description: daemon.description,
                status: daemon.status,
                address: daemon.address,
                lastActivity: this.lastActivity.get(id) || 0,
                activationCount: daemon.activationCount,
                resources: daemon.resources
            }));
            
            res.json(daemonList);
        });
        
        // Activate daemon
        this.app.post('/api/daemons/:id/activate', async (req, res) => {
            try {
                await this.activateDaemon(req.params.id, 'Dashboard activation');
                res.json({ success: true, message: 'Daemon activated' });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // Put daemon in stasis
        this.app.post('/api/daemons/:id/stasis', async (req, res) => {
            try {
                await this.putDaemonInStasis(req.params.id, 'Manual stasis');
                res.json({ success: true, message: 'Daemon in stasis' });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // Send message to daemon
        this.app.post('/api/daemons/:id/message', async (req, res) => {
            try {
                const { trigger, data } = req.body;
                await this.sendMessage(trigger, data);
                res.json({ success: true, message: 'Message sent' });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // Get system stats
        this.app.get('/api/stats', (req, res) => {
            const stats = {
                totalDaemons: this.daemons.size,
                activeDaemons: Array.from(this.daemons.values()).filter(d => d.status === 'active').length,
                stasisDaemons: Array.from(this.daemons.values()).filter(d => d.status === 'stasis').length,
                totalActivations: Array.from(this.daemons.values()).reduce((sum, d) => sum + d.activationCount, 0),
                totalMessages: Array.from(this.postOffice.mailbox.values()).reduce((sum, box) => sum + box.length, 0),
                uptime: Date.now() - this.startTime
            };
            
            res.json(stats);
        });
    }
    
    startWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.port + 1 });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 Dashboard client connected');
            
            // Send current daemon status
            ws.send(JSON.stringify({
                type: 'daemon_status',
                data: Array.from(this.daemons.entries()).map(([id, daemon]) => ({
                    id,
                    name: daemon.name,
                    status: daemon.status
                }))
            }));
        });
        
        // Broadcast daemon status changes
        this.on('daemon.activated', (data) => {
            this.broadcast({ type: 'daemon_activated', data });
        });
        
        this.on('daemon.stasis', (data) => {
            this.broadcast({ type: 'daemon_stasis', data });
        });
    }
    
    broadcast(message) {
        if (this.wss) {
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(message));
                }
            });
        }
    }
    
    async createDashboardHTML() {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀 Event-Driven Daemon Manager</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0a0a0a, #1a1a2e);
            color: #00ff88;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            border: 2px solid #00ff88;
            border-radius: 15px;
            background: rgba(0, 255, 136, 0.1);
        }
        .header h1 { font-size: 2.5em; text-shadow: 0 0 20px #00ff88; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(0, 20, 40, 0.8);
            border: 1px solid #00ff88;
            border-radius: 10px;
            padding: 15px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            color: #00ffff;
            font-weight: bold;
        }
        .daemons-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
        }
        .daemon-card {
            background: rgba(0, 20, 40, 0.8);
            border: 1px solid #666;
            border-radius: 10px;
            padding: 20px;
            transition: all 0.3s ease;
        }
        .daemon-card.active {
            border-color: #00ff88;
            box-shadow: 0 0 20px rgba(0, 255, 136, 0.3);
        }
        .daemon-card.stasis {
            border-color: #888;
            opacity: 0.7;
        }
        .daemon-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .daemon-name {
            font-size: 1.3em;
            font-weight: bold;
        }
        .status-badge {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.8em;
            text-transform: uppercase;
        }
        .status-active { background: #00ff88; color: #000; }
        .status-stasis { background: #666; color: #fff; }
        .daemon-description {
            color: #aaa;
            margin-bottom: 15px;
            font-size: 0.9em;
        }
        .daemon-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
            font-size: 0.8em;
        }
        .daemon-actions {
            display: flex;
            gap: 10px;
        }
        .btn {
            padding: 8px 16px;
            border: 1px solid #00ff88;
            background: rgba(0, 255, 136, 0.1);
            color: #00ff88;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn:hover {
            background: rgba(0, 255, 136, 0.2);
            box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);
        }
        .btn.danger {
            border-color: #ff4444;
            color: #ff4444;
            background: rgba(255, 68, 68, 0.1);
        }
        .btn.danger:hover {
            background: rgba(255, 68, 68, 0.2);
        }
        .log {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #333;
            border-radius: 5px;
            padding: 15px;
            margin-top: 20px;
            max-height: 300px;
            overflow-y: auto;
            font-size: 0.8em;
        }
        .log-entry {
            margin-bottom: 8px;
            padding: 5px;
            border-left: 3px solid #00ff88;
            padding-left: 10px;
        }
        .log-entry.error { border-left-color: #ff4444; }
        .log-entry.info { border-left-color: #0088ff; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 EVENT-DRIVEN DAEMON MANAGER</h1>
        <p>Click to activate • Stasis when idle • SMTP messaging</p>
    </div>
    
    <div class="stats" id="stats">
        <!-- Stats will be loaded here -->
    </div>
    
    <div class="daemons-grid" id="daemons">
        <!-- Daemon cards will be loaded here -->
    </div>
    
    <div class="log" id="log">
        <div class="log-entry info">🚀 Event-Driven Daemon Manager started</div>
    </div>

    <script>
        let ws = null;
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:4001');
            
            ws.onopen = () => {
                log('🔌 Connected to daemon manager', 'info');
            };
            
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            };
            
            ws.onclose = () => {
                log('❌ Disconnected from daemon manager', 'error');
                setTimeout(connectWebSocket, 5000);
            };
        }
        
        function handleWebSocketMessage(message) {
            switch (message.type) {
                case 'daemon_activated':
                    log(\`🚀 Daemon activated: \${message.data.daemon}\`, 'info');
                    loadDaemons();
                    break;
                case 'daemon_stasis':
                    log(\`😴 Daemon in stasis: \${message.data.daemon}\`, 'info');
                    loadDaemons();
                    break;
            }
        }
        
        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const stats = await response.json();
                
                document.getElementById('stats').innerHTML = \`
                    <div class="stat-card">
                        <div class="stat-value">\${stats.totalDaemons}</div>
                        <div>Total Daemons</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">\${stats.activeDaemons}</div>
                        <div>Active</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">\${stats.stasisDaemons}</div>
                        <div>In Stasis</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">\${stats.totalActivations}</div>
                        <div>Total Activations</div>
                    </div>
                \`;
            } catch (error) {
                log('Error loading stats: ' + error.message, 'error');
            }
        }
        
        async function loadDaemons() {
            try {
                const response = await fetch('/api/daemons');
                const daemons = await response.json();
                
                const daemonsHTML = daemons.map(daemon => \`
                    <div class="daemon-card \${daemon.status}">
                        <div class="daemon-header">
                            <div class="daemon-name">\${daemon.name}</div>
                            <div class="status-badge status-\${daemon.status}">\${daemon.status}</div>
                        </div>
                        <div class="daemon-description">\${daemon.description}</div>
                        <div class="daemon-stats">
                            <div>Address: \${daemon.address}</div>
                            <div>Activations: \${daemon.activationCount}</div>
                            <div>Last Activity: \${daemon.lastActivity ? new Date(daemon.lastActivity).toLocaleTimeString() : 'Never'}</div>
                            <div>Resources: \${daemon.resources.memory}/\${daemon.resources.cpu}/\${daemon.resources.network}</div>
                        </div>
                        <div class="daemon-actions">
                            <button class="btn" onclick="activateDaemon('\${daemon.id}')">
                                🚀 Activate
                            </button>
                            <button class="btn danger" onclick="stasisDaemon('\${daemon.id}')">
                                😴 Stasis
                            </button>
                            <button class="btn" onclick="sendMessage('\${daemon.id}')">
                                📨 Message
                            </button>
                        </div>
                    </div>
                \`).join('');
                
                document.getElementById('daemons').innerHTML = daemonsHTML;
            } catch (error) {
                log('Error loading daemons: ' + error.message, 'error');
            }
        }
        
        async function activateDaemon(daemonId) {
            try {
                const response = await fetch(\`/api/daemons/\${daemonId}/activate\`, {
                    method: 'POST'
                });
                
                const result = await response.json();
                if (result.success) {
                    log(\`🚀 Activated daemon: \${daemonId}\`, 'info');
                } else {
                    log(\`❌ Failed to activate daemon: \${result.error}\`, 'error');
                }
            } catch (error) {
                log('Error activating daemon: ' + error.message, 'error');
            }
        }
        
        async function stasisDaemon(daemonId) {
            try {
                const response = await fetch(\`/api/daemons/\${daemonId}/stasis\`, {
                    method: 'POST'
                });
                
                const result = await response.json();
                if (result.success) {
                    log(\`😴 Put daemon in stasis: \${daemonId}\`, 'info');
                } else {
                    log(\`❌ Failed to put daemon in stasis: \${result.error}\`, 'error');
                }
            } catch (error) {
                log('Error putting daemon in stasis: ' + error.message, 'error');
            }
        }
        
        function sendMessage(daemonId) {
            const trigger = prompt('Enter trigger event:');
            const data = prompt('Enter message data (JSON):');
            
            if (trigger) {
                fetch(\`/api/daemons/\${daemonId}/message\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        trigger,
                        data: data ? JSON.parse(data) : {}
                    })
                }).then(response => response.json())
                .then(result => {
                    if (result.success) {
                        log(\`📨 Sent message to daemon: \${daemonId}\`, 'info');
                    }
                });
            }
        }
        
        function log(message, type = 'info') {
            const logDiv = document.getElementById('log');
            const entry = document.createElement('div');
            entry.className = \`log-entry \${type}\`;
            entry.innerHTML = \`[\${new Date().toLocaleTimeString()}] \${message}\`;
            logDiv.insertBefore(entry, logDiv.firstChild);
            
            // Keep only last 50 entries
            while (logDiv.children.length > 50) {
                logDiv.removeChild(logDiv.lastChild);
            }
        }
        
        // Initialize
        connectWebSocket();
        loadStats();
        loadDaemons();
        
        // Auto-refresh every 10 seconds
        setInterval(() => {
            loadStats();
            loadDaemons();
        }, 10000);
    </script>
</body>
</html>`;
        
        await fs.writeFile('daemon-control-dashboard.html', html);
        
        // Serve dashboard at root
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'daemon-control-dashboard.html'));
        });
    }
    
    // Public API for external systems
    async triggerEvent(eventType, data = {}) {
        console.log(`🎯 External trigger: ${eventType}`);
        await this.sendMessage(eventType, data);
    }
    
    getDaemonStatus(daemonId) {
        const daemon = this.daemons.get(daemonId);
        return daemon ? {
            id: daemonId,
            name: daemon.name,
            status: daemon.status,
            lastActivity: this.lastActivity.get(daemonId) || 0
        } : null;
    }
    
    // Graceful shutdown
    async shutdown() {
        console.log('🛑 Shutting down Event-Driven Daemon Manager...');
        
        // Put all active daemons in stasis
        for (const [daemonId, daemon] of this.daemons) {
            if (daemon.status === 'active') {
                await this.putDaemonInStasis(daemonId, 'System shutdown');
            }
        }
        
        console.log('✅ All daemons in stasis, shutdown complete');
    }
}

// Export for integration
module.exports = EventDrivenDaemonManager;

// CLI interface
if (require.main === module) {
    const manager = new EventDrivenDaemonManager();
    manager.startTime = Date.now();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        await manager.shutdown();
        process.exit(0);
    });
    
    console.log('🎮 Daemon Control Dashboard: http://localhost:4000');
    console.log('🎯 Click to activate daemons, they auto-stasis when idle');
    console.log('📮 SMTP-style messaging between daemons active');
    console.log('💤 5 minute inactivity timeout for stasis mode\n');
}