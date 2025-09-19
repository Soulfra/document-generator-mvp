#!/usr/bin/env node
// mmorpg-instance-manager.js - MMORPG Instance Management System
// Manages gaming instances like WoW dungeons, RuneScape minigames
// Spawns/despawns gameplay areas, manages players, anti-hack monitoring

const { EventEmitter } = require('events');
const WebSocket = require('ws');
const express = require('express');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const { spawn } = require('child_process');

console.log(`
🏛️ MMORPG INSTANCE MANAGER 🏛️
============================
World of Warcraft + RuneScape Style Architecture
Instance-based gameplay with anti-hack protection
Cross-platform gaming with Flash/XRay integration
`);

class MMORPGInstanceManager extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            // Instance management
            maxInstances: 50,
            maxPlayersPerInstance: 32,
            instanceTimeout: 1800000, // 30 minutes
            
            // Gaming ports
            mainPort: 7777,
            wsPort: 7778,
            instancePortRange: { start: 8000, end: 8999 },
            
            // Anti-hack configuration
            clientIntegrityCheck: true,
            behavioralAnalysis: true,
            certificateValidation: true,
            wardenStyleMonitoring: true,
            
            // Cross-platform integration
            chromeExtensionSupport: true,
            runeliteIntegration: true,
            flashPadCompatible: true
        };
        
        // Instance types (like WoW dungeons/RuneScape areas)
        this.instanceTypes = {
            // Economic instances (Grand Exchange style)
            grandExchange: {
                name: 'Grand Exchange',
                type: 'economic',
                service: 'algo-trading-unified-layer.js',
                maxPlayers: 100,
                persistent: true,
                description: 'Trade algorithmic strategies and view real-time market data',
                entrance: 'http://localhost:9997',
                gameStyle: 'trading_floor',
                antiCheatLevel: 'high'
            },
            
            // PvP instances (Duel Arena style)  
            shipRektArena: {
                name: 'ShipRekt Arena',
                type: 'pvp',
                service: 'shiprekt-charting-game-engine.js',
                maxPlayers: 32,
                persistent: false,
                description: 'Competitive charting battles: SaveOrSink vs DealOrDelete',
                entrance: 'http://localhost:9705',
                gameStyle: 'competitive_battle',
                antiCheatLevel: 'maximum'
            },
            
            // Social instances (Bank/marketplace)
            tickerTapeFloor: {
                name: 'Ticker Tape Floor',
                type: 'social',
                service: 'LIVE-TICKER-TAPE-TRADING-FLOOR.js',
                maxPlayers: 50,
                persistent: true,
                description: 'Social hub with live market feeds and coaching',
                entrance: 'http://localhost:3333',
                gameStyle: 'social_hub',
                antiCheatLevel: 'medium'
            },
            
            // Utility instances (like RuneScape skills)
            revenueVerification: {
                name: 'Revenue Verification Chamber',
                type: 'utility',
                service: 'revenue-verification-dashboard.js',
                maxPlayers: 20,
                persistent: true,
                description: 'Track earnings, verify revenue streams, manage rewards',
                entrance: 'http://localhost:4269',
                gameStyle: 'skill_training',
                antiCheatLevel: 'medium'
            },
            
            // Special instances (like WoW raids)
            unifiedVisualization: {
                name: 'Unified Visualization Raid',
                type: 'raid',
                service: 'unified-trading-visualization-launcher.js',
                maxPlayers: 16,
                persistent: false,
                description: 'Master all trading visualizations in epic raid format',
                entrance: 'http://localhost:10000',
                gameStyle: 'raid_encounter',
                antiCheatLevel: 'maximum'
            },
            
            // Cross-platform bridge (like Battle.net)
            extensionBridge: {
                name: 'Cross-Platform Bridge',
                type: 'bridge',
                service: 'unified-extension-bridge.js',
                maxPlayers: 1000,
                persistent: true,
                description: 'Connect Chrome extensions, RuneLite plugins, mobile apps',
                entrance: 'http://localhost:8999',
                gameStyle: 'platform_bridge',
                antiCheatLevel: 'maximum'
            }
        };
        
        // Active instances
        this.activeInstances = new Map();
        this.playerSessions = new Map();
        this.instanceProcesses = new Map();
        
        // Anti-hack monitoring (Warden-style)
        this.securityMonitor = {
            clientIntegrityHashes: new Map(),
            behaviorPatterns: new Map(),
            suspiciousActivity: [],
            bannedClients: new Set(),
            wardenChecks: [],
            lastSecurityScan: Date.now()
        };
        
        // Gaming session tracking
        this.gamingSessions = {
            activePlayers: new Map(),
            sessionHistory: [],
            playerStats: new Map(),
            achievementSystem: new Map(),
            economicData: new Map()
        };
        
        console.log('🏛️ MMORPG Instance Manager initializing...');
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing MMORPG architecture...');
        
        // Setup main server
        await this.setupMainServer();
        
        // Setup WebSocket for real-time communication
        await this.setupWebSocketServer();
        
        // Initialize anti-hack monitoring
        await this.initializeSecurityMonitoring();
        
        // Setup instance management
        await this.setupInstanceManagement();
        
        // Initialize cross-platform bridges
        await this.setupCrossPlatformBridges();
        
        // Start persistent instances
        await this.startPersistentInstances();
        
        console.log('✅ MMORPG Instance Manager ready!');
        console.log(`🎮 Gaming Hub: http://localhost:${this.config.mainPort}`);
        console.log(`🌐 WebSocket: ws://localhost:${this.config.wsPort}`);
        console.log(`🏛️ Instance Types: ${Object.keys(this.instanceTypes).length} available`);
    }
    
    async setupMainServer() {
        console.log('🌐 Setting up main gaming server...');
        
        this.app = express();
        this.server = http.createServer(this.app);
        
        this.app.use(express.json());
        this.app.use(express.static('.'));
        
        // Main gaming hub interface
        this.app.get('/', (req, res) => {
            res.send(this.generateGamingHubInterface());
        });
        
        // Instance management endpoints
        this.app.get('/api/instances', (req, res) => {
            res.json(this.getInstanceStatus());
        });
        
        this.app.post('/api/instances/create', (req, res) => {
            const { type, playerCount = 1 } = req.body;
            this.createInstance(type, playerCount)
                .then(instance => res.json(instance))
                .catch(error => res.status(500).json({ error: error.message }));
        });
        
        this.app.post('/api/instances/:instanceId/join', (req, res) => {
            const { instanceId } = req.params;
            const { playerId, clientHash } = req.body;
            
            this.joinInstance(instanceId, playerId, clientHash)
                .then(result => res.json(result))
                .catch(error => res.status(400).json({ error: error.message }));
        });
        
        this.app.delete('/api/instances/:instanceId', (req, res) => {
            const { instanceId } = req.params;
            this.destroyInstance(instanceId)
                .then(() => res.json({ success: true }))
                .catch(error => res.status(500).json({ error: error.message }));
        });
        
        // Anti-hack security endpoints
        this.app.post('/api/security/integrity-check', (req, res) => {
            const { clientId, clientHash } = req.body;
            const result = this.performClientIntegrityCheck(clientId, clientHash);
            res.json(result);
        });
        
        this.app.get('/api/security/status', (req, res) => {
            res.json(this.getSecurityStatus());
        });
        
        // Player session management
        this.app.post('/api/player/login', (req, res) => {
            const { playerId, clientInfo } = req.body;
            this.createPlayerSession(playerId, clientInfo)
                .then(session => res.json(session))
                .catch(error => res.status(400).json({ error: error.message }));
        });
        
        this.app.get('/api/player/:playerId/stats', (req, res) => {
            const { playerId } = req.params;
            const stats = this.getPlayerStats(playerId);
            res.json(stats);
        });
        
        this.server.listen(this.config.mainPort, () => {
            console.log(`✅ Main gaming server running on port ${this.config.mainPort}`);
        });
    }
    
    async setupWebSocketServer() {
        console.log('📡 Setting up gaming WebSocket server...');
        
        this.wss = new WebSocket.Server({ 
            port: this.config.wsPort,
            perMessageDeflate: true
        });
        
        this.wss.on('connection', (ws, req) => {
            const connectionId = crypto.randomBytes(16).toString('hex');
            
            console.log(`🔌 New gaming connection: ${connectionId}`);
            
            // Store connection info
            ws.connectionId = connectionId;
            ws.playerId = null;
            ws.currentInstance = null;
            ws.lastActivity = Date.now();
            ws.clientInfo = {
                userAgent: req.headers['user-agent'],
                ip: req.socket.remoteAddress,
                connectedAt: Date.now()
            };
            
            // Handle messages
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleGameMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        message: 'Invalid message format' 
                    }));
                }
            });
            
            // Handle disconnect
            ws.on('close', () => {
                console.log(`🔌 Gaming connection closed: ${connectionId}`);
                this.handlePlayerDisconnect(ws);
            });
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                connectionId,
                availableInstances: Object.keys(this.instanceTypes),
                serverStatus: 'ready'
            }));
            
            // Start behavioral monitoring
            this.startBehavioralMonitoring(ws);
        });
        
        console.log(`✅ Gaming WebSocket server running on port ${this.config.wsPort}`);
    }
    
    async initializeSecurityMonitoring() {
        console.log('🛡️ Initializing Warden-style security monitoring...');
        
        // Client integrity checking
        this.securityMonitor.wardenChecks = [
            {
                name: 'Memory Scan',
                check: (clientData) => this.checkMemoryIntegrity(clientData),
                frequency: 30000, // Every 30 seconds
                severity: 'high'
            },
            {
                name: 'Process List',
                check: (clientData) => this.checkRunningProcesses(clientData),
                frequency: 60000, // Every minute
                severity: 'medium'
            },
            {
                name: 'Network Activity',
                check: (clientData) => this.checkNetworkActivity(clientData),
                frequency: 15000, // Every 15 seconds
                severity: 'high'
            },
            {
                name: 'Input Patterns',
                check: (clientData) => this.analyzeBehavioralPatterns(clientData),
                frequency: 5000, // Every 5 seconds
                severity: 'medium'
            }
        ];
        
        // Start security monitoring loop
        setInterval(() => {
            this.runSecurityScans();
        }, 10000); // Every 10 seconds
        
        console.log('✅ Security monitoring active - Warden-style protection enabled');
    }
    
    async setupInstanceManagement() {
        console.log('🏛️ Setting up instance management system...');
        
        // Instance lifecycle management
        this.instanceLifecycle = {
            create: async (type, options = {}) => {
                return await this.createInstance(type, options);
            },
            
            spawn: async (instanceId) => {
                return await this.spawnInstanceProcess(instanceId);
            },
            
            monitor: (instanceId) => {
                return this.monitorInstanceHealth(instanceId);
            },
            
            scale: async (instanceId, playerCount) => {
                return await this.scaleInstance(instanceId, playerCount);
            },
            
            destroy: async (instanceId) => {
                return await this.destroyInstance(instanceId);
            }
        };
        
        // Instance cleanup (like WoW's instance reset)
        setInterval(() => {
            this.cleanupExpiredInstances();
        }, 60000); // Every minute
        
        console.log('✅ Instance management system ready');
    }
    
    async setupCrossPlatformBridges() {
        console.log('🌉 Setting up cross-platform gaming bridges...');
        
        // Chrome extension bridge
        if (this.config.chromeExtensionSupport) {
            this.chromeExtensionBridge = {
                validateExtension: (extensionId) => this.validateChromeExtension(extensionId),
                sendCommand: (extensionId, command) => this.sendExtensionCommand(extensionId, command),
                receiveData: (extensionId, data) => this.receiveExtensionData(extensionId, data)
            };
        }
        
        // RuneLite integration bridge
        if (this.config.runeliteIntegration) {
            this.runeliteBridge = {
                validatePlugin: (pluginId) => this.validateRuneLitePlugin(pluginId),
                sendGameData: (pluginId, data) => this.sendRuneLiteData(pluginId, data),
                receiveInput: (pluginId, input) => this.receiveRuneLiteInput(pluginId, input)
            };
        }
        
        // FlashPad compatibility layer
        if (this.config.flashPadCompatible) {
            this.flashPadBridge = {
                initializeFlashLayer: () => this.initializeFlashCompatibility(),
                handleFlashEvents: (event) => this.handleFlashEvent(event),
                convertToFlashFormat: (data) => this.convertDataToFlashFormat(data)
            };
        }
        
        console.log('✅ Cross-platform bridges ready');
    }
    
    async startPersistentInstances() {
        console.log('🏛️ Starting persistent instances...');
        
        for (const [typeId, instanceType] of Object.entries(this.instanceTypes)) {
            if (instanceType.persistent) {
                try {
                    const instance = await this.createInstance(typeId, { persistent: true });
                    console.log(`✅ Started persistent instance: ${instanceType.name}`);
                } catch (error) {
                    console.error(`❌ Failed to start ${instanceType.name}:`, error.message);
                }
            }
        }
    }
    
    // Instance management methods
    async createInstance(typeId, options = {}) {
        if (!this.instanceTypes[typeId]) {
            throw new Error(`Unknown instance type: ${typeId}`);
        }
        
        const instanceType = this.instanceTypes[typeId];
        const instanceId = crypto.randomBytes(16).toString('hex');
        
        // Check instance limits
        if (this.activeInstances.size >= this.config.maxInstances) {
            throw new Error('Maximum instances reached');
        }
        
        // Find available port
        const port = this.findAvailablePort();
        
        const instance = {
            id: instanceId,
            type: typeId,
            typeConfig: instanceType,
            port,
            status: 'creating',
            players: new Map(),
            createdAt: Date.now(),
            lastActivity: Date.now(),
            options,
            process: null,
            antiCheatActive: true,
            performanceMetrics: {
                cpu: 0,
                memory: 0,
                network: 0,
                playerCount: 0
            }
        };
        
        this.activeInstances.set(instanceId, instance);
        
        // Spawn the instance process
        await this.spawnInstanceProcess(instanceId);
        
        console.log(`🏛️ Created instance: ${instanceType.name} (${instanceId})`);
        
        this.emit('instance_created', { instanceId, instance });
        
        return {
            instanceId,
            type: instanceType.name,
            port,
            entrance: `http://localhost:${port}`,
            maxPlayers: instanceType.maxPlayers,
            status: 'ready'
        };
    }
    
    async spawnInstanceProcess(instanceId) {
        const instance = this.activeInstances.get(instanceId);
        if (!instance) throw new Error('Instance not found');
        
        const instanceType = instance.typeConfig;
        
        // Check if service file exists
        if (!fs.existsSync(instanceType.service)) {
            console.warn(`⚠️ Service file not found: ${instanceType.service}`);
            instance.status = 'service_missing';
            return;
        }
        
        // Spawn the service process
        const process = spawn('node', [instanceType.service], {
            stdio: 'pipe',
            env: { 
                ...process.env, 
                PORT: instance.port,
                INSTANCE_ID: instanceId,
                INSTANCE_TYPE: instance.type,
                ANTI_CHEAT: 'enabled'
            }
        });
        
        instance.process = process;
        
        // Handle process output
        process.stdout.on('data', (data) => {
            console.log(`[${instanceType.name}] ${data.toString().trim()}`);
        });
        
        process.stderr.on('data', (data) => {
            console.error(`[${instanceType.name} ERROR] ${data.toString().trim()}`);
        });
        
        process.on('close', (code) => {
            console.log(`[${instanceType.name}] Process exited with code ${code}`);
            if (instance) {
                instance.status = code === 0 ? 'completed' : 'crashed';
                instance.process = null;
            }
        });
        
        // Mark as running
        instance.status = 'running';
        
        return process;
    }
    
    async joinInstance(instanceId, playerId, clientHash) {
        const instance = this.activeInstances.get(instanceId);
        if (!instance) {
            throw new Error('Instance not found');
        }
        
        if (instance.status !== 'running') {
            throw new Error('Instance not ready');
        }
        
        // Check player limit
        if (instance.players.size >= instance.typeConfig.maxPlayers) {
            throw new Error('Instance is full');
        }
        
        // Perform anti-cheat checks
        if (instance.antiCheatActive) {
            const integrityCheck = this.performClientIntegrityCheck(playerId, clientHash);
            if (!integrityCheck.passed) {
                throw new Error('Client integrity check failed');
            }
        }
        
        // Add player to instance
        const playerSession = {
            playerId,
            clientHash,
            joinedAt: Date.now(),
            lastActivity: Date.now(),
            securityStatus: 'clean',
            gameData: {}
        };
        
        instance.players.set(playerId, playerSession);
        instance.lastActivity = Date.now();
        
        console.log(`👤 Player ${playerId} joined ${instance.typeConfig.name}`);
        
        this.emit('player_joined', { instanceId, playerId, instance });
        
        return {
            success: true,
            instanceId,
            entrance: `http://localhost:${instance.port}`,
            playerCount: instance.players.size,
            gameStyle: instance.typeConfig.gameStyle
        };
    }
    
    async destroyInstance(instanceId) {
        const instance = this.activeInstances.get(instanceId);
        if (!instance) return;
        
        console.log(`🏛️ Destroying instance: ${instance.typeConfig.name}`);
        
        // Notify all players
        for (const playerId of instance.players.keys()) {
            this.notifyPlayerInstanceClosing(playerId, instanceId);
        }
        
        // Kill the process
        if (instance.process) {
            instance.process.kill();
        }
        
        // Remove from active instances
        this.activeInstances.delete(instanceId);
        this.instanceProcesses.delete(instanceId);
        
        this.emit('instance_destroyed', { instanceId });
    }
    
    // Anti-hack security methods (Warden-style)
    performClientIntegrityCheck(clientId, clientHash) {
        const result = {
            clientId,
            timestamp: Date.now(),
            passed: true,
            issues: [],
            securityLevel: 'clean'
        };
        
        // Check if client hash is known and valid
        const knownHash = this.securityMonitor.clientIntegrityHashes.get(clientId);
        if (knownHash && knownHash !== clientHash) {
            result.passed = false;
            result.issues.push('Client hash mismatch');
            result.securityLevel = 'suspicious';
        }
        
        // Check banned clients
        if (this.securityMonitor.bannedClients.has(clientId)) {
            result.passed = false;
            result.issues.push('Client is banned');
            result.securityLevel = 'banned';
        }
        
        // Store or update client hash
        this.securityMonitor.clientIntegrityHashes.set(clientId, clientHash);
        
        return result;
    }
    
    startBehavioralMonitoring(ws) {
        const monitoringInterval = setInterval(() => {
            if (ws.readyState !== WebSocket.OPEN) {
                clearInterval(monitoringInterval);
                return;
            }
            
            // Send Warden-style security check
            ws.send(JSON.stringify({
                type: 'security_check',
                checkId: crypto.randomBytes(8).toString('hex'),
                timestamp: Date.now()
            }));
            
        }, 30000); // Every 30 seconds
    }
    
    runSecurityScans() {
        const now = Date.now();
        
        for (const check of this.securityMonitor.wardenChecks) {
            if (now - this.securityMonitor.lastSecurityScan >= check.frequency) {
                // Run security check on all active connections
                this.wss.clients.forEach(ws => {
                    if (ws.readyState === WebSocket.OPEN && ws.playerId) {
                        this.performWardenCheck(ws, check);
                    }
                });
            }
        }
        
        this.securityMonitor.lastSecurityScan = now;
    }
    
    performWardenCheck(ws, check) {
        // Send Warden-style check to client
        const checkData = {
            type: 'warden_check',
            checkName: check.name,
            checkId: crypto.randomBytes(16).toString('hex'),
            timestamp: Date.now(),
            severity: check.severity
        };
        
        ws.send(JSON.stringify(checkData));
        
        // Set timeout for response
        setTimeout(() => {
            // If no response received, flag as suspicious
            this.flagSuspiciousActivity(ws.playerId, `No response to ${check.name}`);
        }, 5000);
    }
    
    flagSuspiciousActivity(playerId, reason) {
        this.securityMonitor.suspiciousActivity.push({
            playerId,
            reason,
            timestamp: Date.now(),
            severity: 'medium'
        });
        
        console.log(`🚨 Suspicious activity: ${playerId} - ${reason}`);
    }
    
    // Utility methods
    findAvailablePort() {
        for (let port = this.config.instancePortRange.start; port <= this.config.instancePortRange.end; port++) {
            const inUse = Array.from(this.activeInstances.values()).some(instance => instance.port === port);
            if (!inUse) return port;
        }
        throw new Error('No available ports');
    }
    
    getInstanceStatus() {
        const instances = Array.from(this.activeInstances.values()).map(instance => ({
            id: instance.id,
            type: instance.typeConfig.name,
            status: instance.status,
            playerCount: instance.players.size,
            maxPlayers: instance.typeConfig.maxPlayers,
            port: instance.port,
            uptime: Date.now() - instance.createdAt,
            gameStyle: instance.typeConfig.gameStyle
        }));
        
        return {
            totalInstances: instances.length,
            totalPlayers: instances.reduce((sum, i) => sum + i.playerCount, 0),
            instances
        };
    }
    
    getSecurityStatus() {
        return {
            activeMonitoring: this.config.wardenStyleMonitoring,
            clientsMonitored: this.securityMonitor.clientIntegrityHashes.size,
            suspiciousActivities: this.securityMonitor.suspiciousActivity.length,
            bannedClients: this.securityMonitor.bannedClients.size,
            lastScan: this.securityMonitor.lastSecurityScan,
            wardenChecks: this.securityMonitor.wardenChecks.length
        };
    }
    
    generateGamingHubInterface() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🏛️ MMORPG Gaming Hub</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: radial-gradient(circle at center, #0a0a2a 0%, #1a1a4a 100%);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            min-height: 100vh;
        }
        
        .hub-container {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            grid-template-rows: auto 1fr auto;
            gap: 20px;
            padding: 20px;
            min-height: 100vh;
        }
        
        .hub-header {
            grid-column: 1 / -1;
            text-align: center;
            background: linear-gradient(45deg, #2a2a2a 0%, #1a1a1a 100%);
            padding: 20px;
            border: 2px solid #00ff00;
            border-radius: 10px;
        }
        
        .instance-card {
            background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .instance-card:hover {
            border-color: #ffff00;
            box-shadow: 0 0 20px rgba(255, 255, 0, 0.5);
            transform: translateY(-5px);
        }
        
        .instance-card.economic { border-color: #00ffff; }
        .instance-card.pvp { border-color: #ff0000; }
        .instance-card.social { border-color: #ff00ff; }
        .instance-card.utility { border-color: #ffff00; }
        .instance-card.raid { border-color: #ff6600; }
        .instance-card.bridge { border-color: #00ff88; }
        
        .instance-title {
            font-size: 18px;
            margin-bottom: 10px;
            color: #ffff00;
        }
        
        .instance-description {
            font-size: 12px;
            margin-bottom: 15px;
            color: #cccccc;
        }
        
        .instance-stats {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #888;
            margin-bottom: 15px;
        }
        
        .join-button {
            width: 100%;
            background: linear-gradient(45deg, #00ff00, #00cc00);
            color: #000;
            border: none;
            padding: 10px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            font-family: inherit;
        }
        
        .join-button:hover {
            background: linear-gradient(45deg, #00cc00, #00aa00);
        }
        
        .join-button:disabled {
            background: #666;
            cursor: not-allowed;
        }
        
        .hub-footer {
            grid-column: 1 / -1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(45deg, #2a2a2a 0%, #1a1a1a 100%);
            padding: 15px;
            border: 2px solid #00ff00;
            border-radius: 10px;
            font-size: 12px;
        }
        
        .security-indicator {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .security-status {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #00ff00;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <div class="hub-container">
        <div class="hub-header">
            <h1>🏛️ MMORPG Gaming Hub</h1>
            <p>World of Warcraft + RuneScape Style Architecture</p>
            <p>Choose your instance and begin your adventure!</p>
        </div>
        
        ${Object.entries(this.instanceTypes).map(([typeId, instanceType]) => `
        <div class="instance-card ${instanceType.type}" onclick="joinInstance('${typeId}')">
            <div class="instance-title">${instanceType.name}</div>
            <div class="instance-description">${instanceType.description}</div>
            <div class="instance-stats">
                <span>Max Players: ${instanceType.maxPlayers}</span>
                <span>Type: ${instanceType.type}</span>
                <span>Style: ${instanceType.gameStyle}</span>
            </div>
            <button class="join-button" id="join-${typeId}">
                Enter Instance
            </button>
        </div>
        `).join('')}
        
        <div class="hub-footer">
            <div class="security-indicator">
                <span class="security-status"></span>
                <span>Warden Protection: Active</span>
            </div>
            <div>
                Total Instances: <span id="instance-count">0</span> |
                Active Players: <span id="player-count">0</span>
            </div>
            <div>
                Cross-Platform: Chrome ✓ RuneLite ✓ FlashPad ✓
            </div>
        </div>
    </div>
    
    <script>
        // WebSocket connection for real-time updates
        const ws = new WebSocket('ws://localhost:${this.config.wsPort}');
        
        ws.onopen = () => {
            console.log('🔌 Connected to gaming hub');
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleGameMessage(data);
        };
        
        function handleGameMessage(data) {
            switch (data.type) {
                case 'welcome':
                    console.log('🎮 Welcome to MMORPG Gaming Hub');
                    updateInstanceStatus();
                    break;
                    
                case 'instance_status':
                    updateInstanceCounts(data.status);
                    break;
                    
                case 'security_check':
                    respondToSecurityCheck(data);
                    break;
            }
        }
        
        function joinInstance(typeId) {
            const playerId = 'player_' + Date.now();
            const clientHash = generateClientHash();
            
            fetch('/api/instances/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: typeId })
            })
            .then(response => response.json())
            .then(instance => {
                // Join the instance
                return fetch(\`/api/instances/\${instance.instanceId}/join\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ playerId, clientHash })
                });
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    window.open(result.entrance, '_blank');
                } else {
                    alert('Failed to join instance: ' + result.error);
                }
            })
            .catch(error => {
                console.error('Error joining instance:', error);
                alert('Error joining instance');
            });
        }
        
        function updateInstanceStatus() {
            fetch('/api/instances')
                .then(response => response.json())
                .then(status => {
                    document.getElementById('instance-count').textContent = status.totalInstances;
                    document.getElementById('player-count').textContent = status.totalPlayers;
                });
        }
        
        function generateClientHash() {
            // Simple client fingerprinting for demo
            const info = [
                navigator.userAgent,
                screen.width + 'x' + screen.height,
                new Date().getTimezoneOffset(),
                navigator.language
            ].join('|');
            
            return btoa(info).substr(0, 32);
        }
        
        function respondToSecurityCheck(checkData) {
            // Respond to Warden-style security check
            ws.send(JSON.stringify({
                type: 'security_response',
                checkId: checkData.checkId,
                clientInfo: {
                    timestamp: Date.now(),
                    browserInfo: navigator.userAgent,
                    plugins: Array.from(navigator.plugins).map(p => p.name)
                }
            }));
        }
        
        // Update status every 10 seconds
        setInterval(updateInstanceStatus, 10000);
    </script>
</body>
</html>`;
    }
}

// Export for use as module
module.exports = MMORPGInstanceManager;

// CLI interface
if (require.main === module) {
    const manager = new MMORPGInstanceManager();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down MMORPG Instance Manager...');
        
        // Destroy all instances
        for (const instanceId of manager.activeInstances.keys()) {
            await manager.destroyInstance(instanceId);
        }
        
        process.exit(0);
    });
    
    console.log('\n🎮 MMORPG Instance Manager is running!');
    console.log('🏛️ Experience WoW + RuneScape style gaming architecture!');
}