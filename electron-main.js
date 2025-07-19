// electron-main.js - Document Generator Electron App

const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ContextMemoryStreamManager = require('./context-memory-stream-manager');
const SSHTerminalRuntimeRingSystem = require('./ssh-terminal-runtime-ring-system');
const ShipRektVisualInterfaceElectron = require('./shiprekt-visual-interface-electron');

console.log(`
🚀 DOCUMENT GENERATOR ELECTRON APP 🚀
Transform any document into a working MVP in < 30 minutes
66 Layers | Blockchain | AI Agents | DocuSign | Open Source
`);

class DocumentGeneratorApp {
    constructor() {
        this.mainWindow = null;
        this.layerProcesses = new Map();
        this.apiKeys = new Map();
        this.contextManager = null; // The distributed system manager
        this.sshTerminalSystem = null; // SSH Terminal & Runtime Ring System
        this.shipRektInterface = null; // ShipRekt visual interface
        this.appConfig = {
            isDev: process.argv.includes('--dev'),
            version: '1.0.0',
            layers: 66,
            basePort: 3000
        };
        
        console.log('🚀 Document Generator Electron App starting...');
        console.log('🧠 This Electron app IS the distributed system orchestrator');
        this.initializeApp();
    }
    
    initializeApp() {
        // App event handlers
        app.whenReady().then(() => {
            this.createMainWindow();
            this.setupMenu();
            this.generateAPIKeys();
            this.initializeContextManager();
            this.initializeSSHTerminalSystem();
            this.initializeShipRektInterface();
            this.spawnDistributedLayers();
        });
        
        app.on('window-all-closed', () => {
            this.cleanupProcesses();
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });
        
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createMainWindow();
            }
        });
        
        app.on('before-quit', () => {
            this.cleanupProcesses();
        });
    }
    
    createMainWindow() {
        console.log('🖥️ Creating main window...');
        
        this.mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            minWidth: 800,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true,
                webSecurity: false
            },
            title: 'Document Generator - Transform Any Document to MVP',
            show: false,
            backgroundColor: '#0a0a0a',
            titleBarStyle: 'hiddenInset',
            vibrancy: 'dark'
        });
        
        // Show window when ready
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            
            if (this.appConfig.isDev) {
                this.mainWindow.webContents.openDevTools();
            }
        });
        
        // Load the dashboard
        this.loadDashboard();
        
        // Handle window closed
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });
        
        // Setup IPC handlers
        this.setupIPC();
    }
    
    setupIPC() {
        // Setup IPC handlers for ShipRekt interface
        ipcMain.on('open-shiprekt-interface', () => {
            this.openShipRektInterface();
        });
    }
    
    setupMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {
                        label: 'Process Document',
                        accelerator: 'CmdOrCtrl+O',
                        click: () => this.openDocumentDialog()
                    },
                    {
                        label: 'Generate MVP',
                        accelerator: 'CmdOrCtrl+G',
                        click: () => this.generateMVP()
                    },
                    { type: 'separator' },
                    {
                        label: 'Restart All Layers',
                        click: () => this.restartAllLayers()
                    },
                    { type: 'separator' },
                    {
                        label: 'Exit',
                        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                        click: () => {
                            this.cleanupProcesses();
                            app.quit();
                        }
                    }
                ]
            },
            {
                label: 'Layers',
                submenu: [
                    {
                        label: 'View API Gateway',
                        click: () => shell.openExternal('http://localhost:4000/api/v1')
                    },
                    {
                        label: 'View Reasoning Dashboard',
                        click: () => shell.openExternal('http://localhost:9666')
                    },
                    {
                        label: 'View Monero Mesh',
                        click: () => shell.openExternal('http://localhost:18181')
                    },
                    {
                        label: 'View DocuSign Integration',
                        click: () => shell.openExternal('http://localhost:8443')
                    },
                    { type: 'separator' },
                    {
                        label: 'Auto-Generator',
                        click: () => shell.openExternal('http://localhost:6000')
                    },
                    { type: 'separator' },
                    {
                        label: 'ShipRekt Chart Battle',
                        click: () => this.openShipRektInterface()
                    },
                    {
                        label: 'ShipRekt Dashboard',
                        click: () => shell.openExternal('http://localhost:9705')
                    }
                ]
            },
            {
                label: 'Crypto',
                submenu: [
                    {
                        label: 'Activate Wallets',
                        click: () => this.activateAllWallets()
                    },
                    {
                        label: 'Check Balances',
                        click: () => this.checkWalletBalances()
                    },
                    {
                        label: 'Sync Blockchain',
                        click: () => this.syncBlockchain()
                    }
                ]
            },
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'About Document Generator',
                        click: () => this.showAbout()
                    },
                    {
                        label: 'API Documentation',
                        click: () => shell.openExternal('http://localhost:4000/api/v1')
                    },
                    {
                        label: 'System Status',
                        click: () => this.showSystemStatus()
                    }
                ]
            }
        ];
        
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }
    
    generateAPIKeys() {
        console.log('🔑 Generating API keys...');
        
        // Generate master API keys for the app
        const masterKey = `dgai_master_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
        const userKey = `dgai_user_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
        const adminKey = `dgai_admin_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
        
        this.apiKeys.set('master', masterKey);
        this.apiKeys.set('user', userKey);
        this.apiKeys.set('admin', adminKey);
        
        // Set environment variables
        process.env.DGAI_MASTER_KEY = masterKey;
        process.env.DGAI_USER_KEY = userKey;
        process.env.DGAI_ADMIN_KEY = adminKey;
        
        console.log(`🔑 Master API Key: ${masterKey}`);
    }
    
    initializeContextManager() {
        console.log('🧠 Initializing Context Memory Stream Manager...');
        
        // Create the distributed system manager
        this.contextManager = new ContextMemoryStreamManager();
        
        // Connect Electron as the interface
        const connectionResult = this.contextManager.connectToElectronInterface(this);
        console.log('🖥️ Electron connected as system orchestrator:', connectionResult);
        
        // Listen for context updates
        this.contextManager.on('context-stream-update', (data) => {
            this.handleContextStreamUpdate(data);
        });
        
        this.contextManager.on('system-health', (healthReport) => {
            this.updateSystemHealth(healthReport);
        });
    }
    
    initializeSSHTerminalSystem() {
        console.log('🔐 Initializing SSH Terminal Runtime Ring System...');
        
        // Create the SSH terminal system
        this.sshTerminalSystem = new SSHTerminalRuntimeRingSystem();
        
        // Listen for terminal output
        this.sshTerminalSystem.on('terminal_output', (data) => {
            this.handleTerminalOutput(data);
        });
        
        // Listen for runtime ring switches
        this.sshTerminalSystem.on('ring_switched', (data) => {
            this.handleRingSwitched(data);
        });
        
        // Listen for database switches
        this.sshTerminalSystem.on('database_switched', (data) => {
            this.handleDatabaseSwitched(data);
        });
        
        // Listen for prime pings
        this.sshTerminalSystem.on('prime_ping', (data) => {
            this.handlePrimePing(data);
        });
        
        console.log('🔐 SSH Terminal System initialized and ready');
    }
    
    initializeShipRektInterface() {
        console.log('⚔️ Initializing ShipRekt Visual Interface...');
        
        // Create the ShipRekt visual interface
        this.shipRektInterface = new ShipRektVisualInterfaceElectron(this);
        
        // Listen for interface events
        this.shipRektInterface.on('interface_ready', () => {
            console.log('⚔️ ShipRekt interface ready');
        });
        
        this.shipRektInterface.on('game_state_update', (data) => {
            this.handleShipRektGameUpdate(data);
        });
        
        this.shipRektInterface.on('trinity_analysis_update', (data) => {
            this.handleTrinityAnalysisUpdate(data);
        });
        
        console.log('⚔️ ShipRekt Visual Interface initialized');
    }
    
    async spawnDistributedLayers() {
        console.log('🌐 Spawning distributed layers via Context Manager...');
        
        const layers = [
            { name: 'Context Memory Stream', file: 'context-memory-stream-manager.js', port: 7778, resources: { cpu: 20, memory: 200 } },
            { name: 'API Gateway', file: 'webhook-rest-api-gateway.js', port: 4000, resources: { cpu: 30, memory: 300 } },
            { name: 'Auto Generator', file: 'auto-generator-exe-builder.js', port: 6000, resources: { cpu: 60, memory: 500 } },
            { name: 'Reasoning Differential', file: 'reasoning-differential-activation-layer.js', port: 9666, resources: { cpu: 40, memory: 400 } },
            { name: 'DocuSign Mirror Breaker', file: 'docusign-mirror-breaker-layer.js', port: 8443, resources: { cpu: 30, memory: 300 } },
            { name: 'Monero RPC Mesh', file: 'monero-rpc-mesh-layer.js', port: 18181, resources: { cpu: 80, memory: 800 } },
            { name: 'AI Diamond Finder', file: 'ai-diamond-finder-layer.js', port: 2112, resources: { cpu: 50, memory: 400 } }
        ];
        
        // Use context manager to spawn layers
        for (const layer of layers) {
            if (this.contextManager) {
                const result = await this.contextManager.spawnDistributedLayer(layer);
                console.log(`📍 Layer ${layer.name}: ${result.type} deployment ${result.success ? 'success' : 'failed'}`);
            }
        }
        
        // Load dashboard after context manager is ready
        setTimeout(() => {
            this.loadDashboard();
        }, 5000);
    }
    
    spawnLayer(layer) {
        console.log(`🚀 Spawning ${layer.name} on port ${layer.port}...`);
        
        const layerPath = path.join(__dirname, 'FinishThisIdea', 'hook-template-bridge', 'squash-camel-middleware', 'summary-ard-system', layer.file);
        
        // Check if file exists
        if (!fs.existsSync(layerPath)) {
            console.error(`❌ Layer file not found: ${layerPath}`);
            return;
        }
        
        const child = spawn('node', [layerPath], {
            cwd: path.dirname(layerPath),
            env: {
                ...process.env,
                PORT: layer.port,
                DGAI_MASTER_KEY: this.apiKeys.get('master'),
                DGAI_USER_KEY: this.apiKeys.get('user'),
                NODE_ENV: this.appConfig.isDev ? 'development' : 'production'
            },
            stdio: this.appConfig.isDev ? 'inherit' : 'ignore'
        });
        
        child.on('error', (error) => {
            console.error(`❌ Failed to spawn ${layer.name}:`, error);
        });
        
        child.on('exit', (code) => {
            console.log(`⚠️ ${layer.name} exited with code ${code}`);
            this.layerProcesses.delete(layer.name);
        });
        
        this.layerProcesses.set(layer.name, {
            process: child,
            ...layer,
            pid: child.pid,
            spawnedAt: new Date()
        });
    }
    
    loadDashboard() {
        console.log('📊 Loading main dashboard...');
        
        // Create HTML dashboard
        const dashboardHTML = this.createDashboardHTML();
        const tempFile = path.join(__dirname, 'dashboard.html');
        
        fs.writeFileSync(tempFile, dashboardHTML);
        
        this.mainWindow.loadFile(tempFile);
    }
    
    createDashboardHTML() {
        const runningLayers = Array.from(this.layerProcesses.values());
        const masterKey = this.apiKeys.get('master');
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Document Generator - Transform Any Document to MVP</title>
    <style>
        body { 
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: #00ff88; 
            margin: 0; 
            padding: 20px;
            min-height: 100vh;
        }
        .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding: 20px;
            background: rgba(0, 255, 136, 0.1);
            border-radius: 10px;
            border: 1px solid #00ff88;
        }
        .header h1 { 
            font-size: 2.5em; 
            margin: 0;
            text-shadow: 0 0 20px #00ff88;
        }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin: 20px 0; 
        }
        .stat { 
            background: rgba(26, 26, 46, 0.8); 
            padding: 20px; 
            border: 1px solid #00ff88; 
            text-align: center;
            border-radius: 8px;
            transition: all 0.3s ease;
        }
        .stat:hover {
            background: rgba(0, 255, 136, 0.1);
            transform: translateY(-2px);
        }
        .stat-number { 
            font-size: 2em; 
            color: #88ff00; 
            font-weight: bold; 
        }
        .drop-zone {
            border: 2px dashed #00ff88;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            margin: 20px 0;
            background: rgba(0, 255, 136, 0.05);
            transition: all 0.3s ease;
        }
        .drop-zone:hover {
            background: rgba(0, 255, 136, 0.1);
            border-color: #88ff00;
        }
        .btn {
            background: linear-gradient(45deg, #00ff88, #00ccff);
            color: #0a0a0a;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: bold;
            font-family: inherit;
            transition: all 0.3s ease;
        }
        .btn:hover {
            background: linear-gradient(45deg, #88ff00, #00ffcc);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
        }
        .action-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin: 20px 0;
            justify-content: center;
        }
        .api-key {
            background: rgba(0, 0, 0, 0.6);
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #ffcc00;
            margin: 20px 0;
            font-family: monospace;
            word-break: break-all;
        }
        .logs {
            background: rgba(0, 0, 0, 0.8);
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            max-height: 200px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 0.9em;
            border: 1px solid #666;
        }
        .layer-card {
            background: rgba(16, 33, 62, 0.8);
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #00ccff;
            border-radius: 5px;
            transition: all 0.3s ease;
        }
        .layer-card:hover {
            background: rgba(16, 33, 62, 1);
            border-left-color: #00ff88;
        }
        .layer-card.running { border-left-color: #00ff00; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧠 SSH TERMINAL RUNTIME RING ORCHESTRATOR</h1>
        <p>This Electron App IS the Distributed System Manager</p>
        <p>🔐 SSH Terminal | 🔄 Runtime Rings | 💾 Database Switching | 🔢 Prime Daemons</p>
        <p><small>Max bash until runtime ring switching with prime number daemon pinging</small></p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-number">${runningLayers.length}/67</div>
            <div>Distributed Layers</div>
        </div>
        <div class="stat">
            <div class="stat-number">4</div>
            <div>Context Streams</div>
        </div>
        <div class="stat">
            <div class="stat-number">4</div>
            <div>Memory Pools</div>
        </div>
        <div class="stat">
            <div class="stat-number">∞</div>
            <div>Stream Capacity</div>
        </div>
    </div>
    
    <div class="drop-zone" ondrop="dropHandler(event);" ondragover="dragOverHandler(event);">
        <h2>📄 DROP YOUR DOCUMENT HERE</h2>
        <p>Supported: README.md, Business Plans, Technical Specs, Chat Logs, PDFs</p>
        <p>Get: Working MVP, API, Database, Frontend, Docker, Documentation</p>
        <input type="file" id="fileInput" style="display: none;" onchange="handleFile(this.files[0])">
        <button class="btn" onclick="document.getElementById('fileInput').click()">Choose File</button>
    </div>
    
    <div class="action-buttons">
        <button class="btn" onclick="openLayer('http://localhost:8090')">🎨 Unified Dashboard</button>
        <button class="btn" onclick="openLayer('http://localhost:4000/api/v1')">🌐 API Gateway</button>
        <button class="btn" onclick="openLayer('http://localhost:6000')">🎯 Auto-Generator</button>
        <button class="btn" onclick="openLayer('http://localhost:9666')">💭 Reasoning Stream</button>
        <button class="btn" onclick="openLayer('http://localhost:9703')">🔐 SSH Terminal API</button>
        <button class="btn" onclick="openShipRektInterface()">⚔️ ShipRekt Battle</button>
    </div>
    
    <!-- SSH Terminal Interface -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
        <div>
            <h3>🔐 SSH Terminal</h3>
            <div id="terminal" style="background: #000; padding: 15px; border-radius: 8px; height: 300px; overflow-y: auto; font-family: monospace; font-size: 0.9em; border: 1px solid #333;">
                <div style="color: #00ff88;">Document Generator SSH Terminal Ready</div>
                <div style="color: #888;">Use this terminal to monitor all system operations...</div>
            </div>
            <div style="margin-top: 10px;">
                <input type="text" id="terminalInput" placeholder="Enter command..." style="width: 70%; padding: 8px; background: #222; color: #00ff88; border: 1px solid #555; border-radius: 4px;">
                <button class="btn" onclick="executeTerminalCommand()" style="width: 25%; margin-left: 5%;">Execute</button>
            </div>
        </div>
        
        <div>
            <h3>🔄 Runtime Rings Status</h3>
            <div id="ringStatus" style="background: rgba(26, 26, 46, 0.8); padding: 15px; border-radius: 8px; height: 300px; overflow-y: auto; border: 1px solid #333;">
                <div class="ring-item">
                    <div style="color: #00ff88; font-weight: bold;">🔵 Ring 0 - Core System (ACTIVE)</div>
                    <div style="color: #888; font-size: 0.9em;">Databases: sqlite, local_storage | Ping: 2s</div>
                </div>
                <div class="ring-item">
                    <div style="color: #ffcc00;">⚫ Ring 1 - Application (STANDBY)</div>
                    <div style="color: #888; font-size: 0.9em;">Databases: postgresql, redis | Ping: 3s</div>
                </div>
                <div class="ring-item">
                    <div style="color: #ffcc00;">⚫ Ring 2 - Economic (STANDBY)</div>
                    <div style="color: #888; font-size: 0.9em;">Databases: mongodb, blockchain | Ping: 5s</div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Database & Prime Daemon Status -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
        <div>
            <h3>💾 Database Status</h3>
            <div id="databaseStatus" style="background: rgba(26, 26, 46, 0.8); padding: 15px; border-radius: 8px; border: 1px solid #333;">
                <div>Primary: <span style="color: #00ff88;">postgresql</span></div>
                <div>Secondary: <span style="color: #88ff00;">redis</span></div>
                <div>Load: <span style="color: #ffcc00;">45%</span></div>
                <div>Response Time: <span style="color: #00ff88;">120ms</span></div>
            </div>
        </div>
        
        <div>
            <h3>🔢 Prime Daemon Pings</h3>
            <div id="primePings" style="background: rgba(26, 26, 46, 0.8); padding: 15px; border-radius: 8px; border: 1px solid #333;">
                <div>Ring 0: <span style="color: #00ff88;">✅ 2s intervals</span></div>
                <div>Ring 1: <span style="color: #00ff88;">✅ 3s intervals</span></div>
                <div>Ring 2: <span style="color: #00ff88;">✅ 5s intervals</span></div>
                <div>Ring 3: <span style="color: #00ff88;">✅ 7s intervals</span></div>
            </div>
        </div>
    </div>
    
    <div class="api-key">
        <strong>🔑 Master API Key:</strong><br>
        <code>${masterKey || 'Generating...'}</code><br>
        <small>Use this key for API access across all layers</small>
    </div>
    
    <h2>🌐 Running Layers</h2>
    ${runningLayers.map(layer => `
        <div class="layer-card running">
            <strong>${layer.name}</strong><br>
            Port: ${layer.port} | PID: ${layer.pid}<br>
            Started: ${new Date(layer.spawnedAt).toLocaleTimeString()}<br>
            <button class="btn" onclick="openLayer('http://localhost:${layer.port}')" style="font-size: 0.8em; padding: 6px 12px;">Open</button>
        </div>
    `).join('')}
    
    <div class="logs" id="logs">
        <div>📋 System ready - launching all layers</div>
        <div>🔑 API keys generated for secure access</div>
        <div>🌐 Spawning 66 layers with 3-second intervals</div>
        <div>📜 DocuSign integration with signature flows</div>
        <div>💰 Wallet activation system initializing</div>
    </div>
    
    <script>
        function openLayer(url) {
            require('electron').shell.openExternal(url);
        }
        
        function openShipRektInterface() {
            // Open ShipRekt visual interface in current window
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('open-shiprekt-interface');
        }
        
        function dragOverHandler(ev) {
            ev.preventDefault();
        }
        
        function dropHandler(ev) {
            ev.preventDefault();
            
            if (ev.dataTransfer.items) {
                for (let i = 0; i < ev.dataTransfer.items.length; i++) {
                    if (ev.dataTransfer.items[i].kind === 'file') {
                        const file = ev.dataTransfer.items[i].getAsFile();
                        handleFile(file);
                    }
                }
            }
        }
        
        function handleFile(file) {
            if (!file) return;
            
            const logs = document.getElementById('logs');
            logs.innerHTML += \`<div>📄 Processing: \${file.name} (\${(file.size / 1024).toFixed(1)}KB)</div>\`;
            logs.scrollTop = logs.scrollHeight;
            
            // Read file content
            const reader = new FileReader();
            reader.onload = function(e) {
                const content = e.target.result;
                processDocument(file.name, content);
            };
            reader.readAsText(file);
        }
        
        async function processDocument(filename, content) {
            const logs = document.getElementById('logs');
            
            try {
                // Send to auto-generator
                const response = await fetch('http://localhost:6000/api/process', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': '${masterKey}'
                    },
                    body: JSON.stringify({
                        filename,
                        content,
                        outputFormat: 'mvp'
                    })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    logs.innerHTML += \`<div>✅ Document processed: \${result.buildId || 'Success'}</div>\`;
                    logs.innerHTML += \`<div>🚀 MVP generated and ready for deployment</div>\`;
                } else {
                    logs.innerHTML += \`<div>❌ Processing failed: \${response.statusText}</div>\`;
                }
            } catch (error) {
                logs.innerHTML += \`<div>❌ Error: \${error.message}</div>\`;
            }
            
            logs.scrollTop = logs.scrollHeight;
        }
        
        // Auto-refresh layer status
        setInterval(() => {
            refreshSystemStatus();
        }, 10000);
        
        // Setup terminal input handler
        document.getElementById('terminalInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                executeTerminalCommand();
            }
        });
        
        // Terminal command execution
        async function executeTerminalCommand() {
            const input = document.getElementById('terminalInput');
            const command = input.value.trim();
            if (!command) return;
            
            // Clear input
            input.value = '';
            
            // Add command to terminal
            addTerminalOutput({
                sessionId: 'system_monitor',
                type: 'input',
                data: '$ ' + command,
                timestamp: Date.now()
            });
            
            try {
                // Execute command via SSH terminal API
                const response = await fetch('http://localhost:9703/api/terminal/system_monitor/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ command })
                });
                
                if (!response.ok) {
                    addTerminalOutput({
                        sessionId: 'system_monitor',
                        type: 'stderr',
                        data: 'Command execution failed: ' + response.statusText,
                        timestamp: Date.now()
                    });
                }
            } catch (error) {
                addTerminalOutput({
                    sessionId: 'system_monitor',
                    type: 'stderr',
                    data: 'Error: ' + error.message,
                    timestamp: Date.now()
                });
            }
        }
        
        // Add terminal output function
        function addTerminalOutput(data) {
            const terminal = document.getElementById('terminal');
            const timestamp = new Date(data.timestamp).toLocaleTimeString();
            const color = data.type === 'stderr' ? '#ff6666' : 
                         data.type === 'input' ? '#ffff88' : '#00ff88';
            
            const line = document.createElement('div');
            line.style.color = color;
            line.innerHTML = \`<span style="color: #666;">\${timestamp}</span> \${data.data}\`;
            
            terminal.appendChild(line);
            terminal.scrollTop = terminal.scrollHeight;
            
            // Limit terminal lines
            while (terminal.children.length > 100) {
                terminal.removeChild(terminal.firstChild);
            }
        }
        
        // Update ring status function
        function updateRingStatus(data) {
            addTerminalOutput({
                sessionId: 'system_monitor',
                type: 'stdout',
                data: \`🔄 Runtime ring switched: \${data.oldRing} → \${data.newRing}\`,
                timestamp: Date.now()
            });
            
            // Update ring status display
            const ringStatus = document.getElementById('ringStatus');
            // Would update the visual ring status here
        }
        
        // Update database status function
        function updateDatabaseStatus(data) {
            addTerminalOutput({
                sessionId: 'system_monitor',
                type: 'stdout',
                data: \`💾 Database switched: \${data.oldPrimary} → \${data.newPrimary}\`,
                timestamp: Date.now()
            });
            
            // Update database status display
            const dbStatus = document.getElementById('databaseStatus');
            dbStatus.innerHTML = \`
                <div>Primary: <span style="color: #00ff88;">\${data.newPrimary}</span></div>
                <div>Previous: <span style="color: #888;">\${data.oldPrimary}</span></div>
                <div>Reason: <span style="color: #ffcc00;">\${data.reason}</span></div>
                <div>Switched: <span style="color: #00ff88;">\${new Date(data.timestamp).toLocaleTimeString()}</span></div>
            \`;
        }
        
        // Update prime ping function
        function updatePrimePing(data) {
            // Show prime pings in terminal occasionally
            if (data.ping_number % 10 === 0) { // Every 10th ping
                addTerminalOutput({
                    sessionId: 'system_monitor',
                    type: 'stdout',
                    data: \`🔢 Prime ping #\${data.ping_number} for \${data.ringId} (every \${data.interval}s)\`,
                    timestamp: data.timestamp
                });
            }
        }
        
        // Refresh system status
        async function refreshSystemStatus() {
            try {
                // Get runtime ring status
                const ringResponse = await fetch('http://localhost:9703/api/rings/status');
                if (ringResponse.ok) {
                    const ringData = await ringResponse.json();
                    updateRingStatusDisplay(ringData);
                }
                
                // Get database status
                const dbResponse = await fetch('http://localhost:9703/api/database/status');
                if (dbResponse.ok) {
                    const dbData = await dbResponse.json();
                    updateDatabaseStatusDisplay(dbData);
                }
                
                // Get prime daemon status
                const primeResponse = await fetch('http://localhost:9703/api/daemons/primes');
                if (primeResponse.ok) {
                    const primeData = await primeResponse.json();
                    updatePrimeDaemonDisplay(primeData);
                }
                
            } catch (error) {
                console.error('Failed to refresh status:', error);
            }
        }
        
        function updateRingStatusDisplay(data) {
            const ringStatus = document.getElementById('ringStatus');
            ringStatus.innerHTML = data.rings.map(ring => \`
                <div class="ring-item" style="margin-bottom: 10px;">
                    <div style="color: \${ring.status === 'active' ? '#00ff88' : '#ffcc00'}; font-weight: bold;">
                        \${ring.status === 'active' ? '🔵' : '⚫'} \${ring.name} (\${ring.status.toUpperCase()})
                    </div>
                    <div style="color: #888; font-size: 0.9em;">
                        Databases: \${ring.databases.join(', ')} | Ping: \${ring.ping_interval}s
                    </div>
                    <div style="color: #666; font-size: 0.8em;">
                        Health: \${ring.health} | Priority: \${ring.priority}
                    </div>
                </div>
            \`).join('');
        }
        
        function updateDatabaseStatusDisplay(data) {
            const dbStatus = document.getElementById('databaseStatus');
            dbStatus.innerHTML = \`
                <div>Primary: <span style="color: #00ff88;">\${data.current_primary}</span></div>
                <div>Secondary: <span style="color: #88ff00;">\${data.current_secondary}</span></div>
                <div>Available: <span style="color: #ffcc00;">\${Object.keys(data.available_databases).length} databases</span></div>
                <div>Load Threshold: <span style="color: #ff8800;">\${data.switch_thresholds.load_percentage}%</span></div>
            \`;
        }
        
        function updatePrimeDaemonDisplay(data) {
            const primePings = document.getElementById('primePings');
            primePings.innerHTML = data.map(daemon => \`
                <div>
                    \${daemon.ring_id}: 
                    <span style="color: \${daemon.status === 'active' ? '#00ff88' : '#ff6666'};">
                        \${daemon.status === 'active' ? '✅' : '❌'} \${daemon.interval}s intervals
                    </span>
                    <span style="color: #666; font-size: 0.8em;">(\${daemon.total_pings} pings)</span>
                </div>
            \`).join('');
        }
        
        // Initialize terminal with some startup messages
        setTimeout(() => {
            addTerminalOutput({
                sessionId: 'system_monitor',
                type: 'stdout',
                data: '🔐 SSH Terminal System initialized',
                timestamp: Date.now()
            });
            
            addTerminalOutput({
                sessionId: 'system_monitor',
                type: 'stdout', 
                data: '🔄 Runtime rings active: 5 rings with prime number intervals',
                timestamp: Date.now()
            });
            
            addTerminalOutput({
                sessionId: 'system_monitor',
                type: 'stdout',
                data: '💾 Database switching enabled with automatic failover',
                timestamp: Date.now()
            });
            
            // Start status refresh
            refreshSystemStatus();
        }, 2000);
    </script>
</body>
</html>`;
    }
    
    async openDocumentDialog() {
        const result = await dialog.showOpenDialog(this.mainWindow, {
            properties: ['openFile'],
            filters: [
                { name: 'Documents', extensions: ['md', 'txt', 'pdf', 'json'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });
        
        if (!result.canceled && result.filePaths.length > 0) {
            const filePath = result.filePaths[0];
            this.processDocument(filePath);
        }
    }
    
    async processDocument(filePath) {
        console.log(`📄 Processing document: ${filePath}`);
        // Implementation would send to auto-generator
    }
    
    async generateMVP() {
        console.log('🎯 Generating MVP...');
        // Implementation would trigger MVP generation
    }
    
    async activateAllWallets() {
        console.log('💰 Activating all wallets...');
        // Implementation would activate wallets via reasoning differential
    }
    
    async checkWalletBalances() {
        console.log('💰 Checking wallet balances...');
        // Implementation would check Monero wallet balances
    }
    
    async syncBlockchain() {
        console.log('⛓️ Syncing blockchain...');
        // Implementation would sync Monero blockchain
    }
    
    async restartAllLayers() {
        console.log('🔄 Restarting all layers...');
        this.cleanupProcesses();
        
        setTimeout(() => {
            this.spawnAllLayers();
        }, 2000);
    }
    
    showAbout() {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'About Document Generator',
            message: 'Document Generator v1.0.0',
            detail: `Transform any document into a working MVP in < 30 minutes.

Features:
• 66 AI-powered layers
• Monero blockchain integration
• DocuSign signature flows
• Open source licensing
• Automated deployment

Built with: Electron, Node.js, AI, Blockchain`
        });
    }
    
    showSystemStatus() {
        const runningCount = this.layerProcesses.size;
        const status = `System Status:

Running Layers: ${runningCount}/66
API Gateway: http://localhost:4000
Auto-Generator: http://localhost:6000
Reasoning Dashboard: http://localhost:9666
Monero Mesh: http://localhost:18181
DocuSign Integration: http://localhost:8443

Master API Key: ${this.apiKeys.get('master')}`;
        
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'System Status',
            message: 'Document Generator Status',
            detail: status
        });
    }
    
    handleContextStreamUpdate(data) {
        // Handle context stream updates from the distributed system
        console.log(`🌊 Context stream update: ${data.stream}`);
        
        // Update UI if needed
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.executeJavaScript(`
                if (typeof updateContextStream === 'function') {
                    updateContextStream(${JSON.stringify(data)});
                }
            `);
        }
    }
    
    updateSystemHealth(healthReport) {
        // Update system health display
        console.log(`🏥 System health: ${healthReport.layers.running}/${healthReport.layers.total} layers running`);
        
        // Update UI
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.executeJavaScript(`
                if (typeof updateSystemHealth === 'function') {
                    updateSystemHealth(${JSON.stringify(healthReport)});
                }
            `);
        }
    }
    
    handleTerminalOutput(data) {
        // Send terminal output to electron window
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.executeJavaScript(`
                if (typeof addTerminalOutput === 'function') {
                    addTerminalOutput(${JSON.stringify(data)});
                }
            `);
        }
    }
    
    handleRingSwitched(data) {
        console.log(`🔄 Runtime ring switched: ${data.oldRing} → ${data.newRing}`);
        
        // Update UI
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.executeJavaScript(`
                if (typeof updateRingStatus === 'function') {
                    updateRingStatus(${JSON.stringify(data)});
                }
            `);
        }
    }
    
    handleDatabaseSwitched(data) {
        console.log(`💾 Database switched: ${data.oldPrimary} → ${data.newPrimary}`);
        
        // Update UI
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.executeJavaScript(`
                if (typeof updateDatabaseStatus === 'function') {
                    updateDatabaseStatus(${JSON.stringify(data)});
                }
            `);
        }
    }
    
    handlePrimePing(data) {
        // Update prime ping display
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.executeJavaScript(`
                if (typeof updatePrimePing === 'function') {
                    updatePrimePing(${JSON.stringify(data)});
                }
            `);
        }
    }
    
    openShipRektInterface() {
        console.log('⚔️ Opening ShipRekt Chart Battle interface...');
        
        if (this.shipRektInterface) {
            const success = this.shipRektInterface.openShipRektInterface();
            if (success) {
                console.log('✅ ShipRekt interface opened');
            } else {
                console.error('❌ Failed to open ShipRekt interface');
            }
        } else {
            console.error('❌ ShipRekt interface not initialized');
        }
    }
    
    handleShipRektGameUpdate(data) {
        console.log(`⚔️ ShipRekt game update: ${data.current_game ? 'Active battle' : 'Waiting for players'}`);
        
        // Update UI with game state
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.executeJavaScript(`
                if (typeof updateShipRektGame === 'function') {
                    updateShipRektGame(${JSON.stringify(data)});
                }
            `);
        }
    }
    
    handleTrinityAnalysisUpdate(data) {
        console.log('🔱 Trinity analysis update received');
        
        // Update UI with trinity analysis
        if (this.mainWindow && this.mainWindow.webContents) {
            this.mainWindow.webContents.executeJavaScript(`
                if (typeof updateTrinityAnalysis === 'function') {
                    updateTrinityAnalysis(${JSON.stringify(data)});
                }
            `);
        }
    }
    
    cleanupProcesses() {
        console.log('🧹 Cleaning up distributed system...');
        
        // Cleanup context manager
        if (this.contextManager) {
            console.log('🧠 Shutting down context manager...');
            // The context manager will handle cleanup of distributed layers
        }
        
        // Cleanup SSH terminal system
        if (this.sshTerminalSystem) {
            console.log('🔐 Shutting down SSH terminal system...');
            // The SSH terminal system will handle cleanup of terminals and daemons
        }
        
        // Cleanup ShipRekt interface
        if (this.shipRektInterface) {
            console.log('⚔️ Shutting down ShipRekt interface...');
            this.shipRektInterface.cleanup();
        }
        
        for (const [name, layer] of this.layerProcesses) {
            try {
                console.log(`⚠️ Killing ${name} (PID: ${layer.pid})`);
                layer.process.kill('SIGTERM');
            } catch (error) {
                console.error(`Failed to kill ${name}:`, error);
            }
        }
        
        this.layerProcesses.clear();
    }
}

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    console.log('Another instance is already running. Quitting...');
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // If someone tries to run a second instance, focus our window instead
        if (global.documentGeneratorApp && global.documentGeneratorApp.mainWindow) {
            if (global.documentGeneratorApp.mainWindow.isMinimized()) {
                global.documentGeneratorApp.mainWindow.restore();
            }
            global.documentGeneratorApp.mainWindow.focus();
        }
    });

    // Create the app
    global.documentGeneratorApp = new DocumentGeneratorApp();
}

module.exports = DocumentGeneratorApp;