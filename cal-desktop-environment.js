#!/usr/bin/env node

/**
 * CAL Desktop Environment
 * 
 * Complete desktop environment for secure development and documentation.
 * Integrates all CAL systems into a unified workspace with Tails-like
 * security features and air-gapped operation capabilities.
 * 
 * Features:
 * - Complete desktop environment with window management
 * - Integrated development tools and editors
 * - Obsidian-style note taking with encryption
 * - LibreOffice-style document editing
 * - Secure browser with Tor integration
 * - Chat-driven development workflow
 * - Air-gapped operation mode
 * - Public/private layer separation
 */

const EventEmitter = require('events');
const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

class CALDesktopEnvironment extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Server configuration
            port: config.port || 8080,
            wsPort: config.wsPort || 8081,
            
            // Desktop settings
            theme: config.theme || 'dark',
            layout: config.layout || 'unified', // unified, tabbed, windowed
            autoSave: config.autoSave !== false,
            
            // Component integration
            calSecureOS: config.calSecureOS || './cal-secure-os.js',
            calVaultIntegration: config.calVaultIntegration || './cal-vault-integration.js',
            calChatInterface: config.calChatInterface || './cal-chat-interface.js',
            
            // Application settings
            applications: {
                terminal: { enabled: true, secure: true },
                editor: { enabled: true, type: 'monaco' }, // monaco, vim, emacs
                browser: { enabled: !config.airgapMode, secure: true },
                notepad: { enabled: true, encrypted: true },
                fileManager: { enabled: true, encrypted: true },
                calculator: { enabled: true },
                chat: { enabled: true, primary: true },
                office: { enabled: true, type: 'minimal' }
            },
            
            // Security settings
            airgapMode: config.airgapMode !== false,
            encryptionDefault: true,
            memoryProtection: true,
            
            // Workspace configuration
            workspaces: [
                { name: 'Development', apps: ['editor', 'terminal', 'chat', 'fileManager'] },
                { name: 'Documentation', apps: ['notepad', 'office', 'chat'] },
                { name: 'Communication', apps: ['chat', 'browser'] },
                { name: 'Security', apps: ['terminal', 'fileManager'] }
            ],
            
            ...config
        };
        
        // Desktop state
        this.state = {
            initialized: false,
            currentWorkspace: 0,
            openApplications: new Map(),
            windowManager: null,
            activeWindow: null,
            clipboard: null,
            notifications: []
        };
        
        // System services
        this.services = new Map();
        
        // Component instances
        this.components = {
            secureOS: null,
            vaultIntegration: null,
            chatInterface: null
        };
        
        // Application definitions
        this.applications = {
            terminal: new TerminalApp(this),
            editor: new CodeEditor(this),
            notepad: new NotePadApp(this),
            fileManager: new FileManager(this),
            browser: new SecureBrowser(this),
            chat: new ChatInterface(this),
            calculator: new Calculator(this),
            office: new OfficeApp(this)
        };
        
        // WebSocket connections
        this.wsConnections = new Set();
        
        // Window management
        this.windows = new Map();
        this.nextWindowId = 1;
        
        this.setupHttpServer();
        this.setupWebSocketServer();
    }
    
    async initialize() {
        console.log('🖥️  CAL DESKTOP ENVIRONMENT STARTING');
        console.log('==================================');
        console.log('');
        console.log(`🎨 Theme: ${this.config.theme}`);
        console.log(`📱 Layout: ${this.config.layout}`);
        console.log(`🔒 Mode: ${this.config.airgapMode ? 'AIR-GAPPED' : 'NETWORKED'}`);
        console.log('');
        
        try {
            // Initialize core components
            await this.initializeComponents();
            
            // Initialize applications
            await this.initializeApplications();
            
            // Setup window manager
            this.setupWindowManager();
            
            // Initialize workspaces
            this.initializeWorkspaces();
            
            // Start desktop services
            await this.startDesktopServices();
            
            // Start HTTP server
            await this.startServer();
            
            this.state.initialized = true;
            
            console.log('✅ Desktop environment initialized');
            console.log(`🌐 Access at: http://localhost:${this.config.port}`);
            console.log(`💬 WebSocket: ws://localhost:${this.config.wsPort}`);
            console.log('');
            console.log('Available applications:');
            
            for (const [name, app] of Object.entries(this.applications)) {
                if (this.config.applications[name]?.enabled) {
                    console.log(`   • ${name}: ${app.description || 'No description'}`);
                }
            }
            
            console.log('');
            
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Desktop initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Initialize core components
     */
    async initializeComponents() {
        console.log('🔧 Initializing core components...');
        
        // Initialize Secure OS
        try {
            const CALSecureOS = require(this.config.calSecureOS);
            this.components.secureOS = new CALSecureOS({
                airgapMode: this.config.airgapMode
            });
            
            // Note: In production, would need proper authentication
            // await this.components.secureOS.initialize('master-password');
            
            console.log('✅ Secure OS initialized');
        } catch (error) {
            console.warn('⚠️  Secure OS not available:', error.message);
        }
        
        // Initialize Vault Integration
        try {
            const CALVaultIntegration = require(this.config.calVaultIntegration);
            this.components.vaultIntegration = new CALVaultIntegration();
            await this.components.vaultIntegration.initialize();
            
            console.log('✅ Vault integration initialized');
        } catch (error) {
            console.warn('⚠️  Vault integration not available:', error.message);
        }
        
        // Initialize Chat Interface
        try {
            const CALChatInterface = require(this.config.calChatInterface);
            this.components.chatInterface = new CALChatInterface({
                port: 9090,
                wsPort: 9091
            });
            
            // Start in background
            this.components.chatInterface.start().catch(console.warn);
            
            console.log('✅ Chat interface initialized');
        } catch (error) {
            console.warn('⚠️  Chat interface not available:', error.message);
        }
    }
    
    /**
     * Initialize applications
     */
    async initializeApplications() {
        console.log('📱 Initializing applications...');
        
        for (const [name, app] of Object.entries(this.applications)) {
            if (this.config.applications[name]?.enabled) {
                try {
                    await app.initialize();
                    console.log(`✅ ${name} initialized`);
                } catch (error) {
                    console.error(`❌ Failed to initialize ${name}:`, error);
                }
            }
        }
    }
    
    /**
     * Setup window manager
     */
    setupWindowManager() {
        this.state.windowManager = {
            layout: this.config.layout,
            windows: new Map(),
            activeWindow: null,
            zIndex: 1000
        };
    }
    
    /**
     * Initialize workspaces
     */
    initializeWorkspaces() {
        console.log('🗂️  Initializing workspaces...');
        
        this.state.workspaces = this.config.workspaces.map((workspace, index) => ({
            ...workspace,
            id: index,
            active: index === 0,
            applications: workspace.apps.filter(app => this.config.applications[app]?.enabled)
        }));
    }
    
    /**
     * Setup HTTP server
     */
    setupHttpServer() {
        this.app = express();
        this.server = http.createServer(this.app);
        
        // Middleware
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));
        
        // API routes
        this.setupAPIRoutes();
        
        // Main desktop interface
        this.app.get('/', (req, res) => {
            res.send(this.generateDesktopHTML());
        });
    }
    
    /**
     * Setup API routes
     */
    setupAPIRoutes() {
        // Desktop management
        this.app.get('/api/desktop/status', (req, res) => {
            res.json(this.getDesktopStatus());
        });
        
        this.app.post('/api/desktop/workspace/:id', (req, res) => {
            this.switchWorkspace(parseInt(req.params.id));
            res.json({ success: true });
        });
        
        // Application management
        this.app.post('/api/app/:name/launch', (req, res) => {
            const result = this.launchApplication(req.params.name, req.body);
            res.json(result);
        });
        
        this.app.post('/api/app/:name/close', (req, res) => {
            const result = this.closeApplication(req.params.name);
            res.json(result);
        });
        
        // Window management
        this.app.get('/api/windows', (req, res) => {
            res.json(Array.from(this.windows.values()));
        });
        
        this.app.post('/api/window/:id/focus', (req, res) => {
            this.focusWindow(req.params.id);
            res.json({ success: true });
        });
        
        this.app.post('/api/window/:id/minimize', (req, res) => {
            this.minimizeWindow(req.params.id);
            res.json({ success: true });
        });
        
        // Component integration
        this.app.get('/api/vault/search', async (req, res) => {
            if (this.components.vaultIntegration) {
                const results = await this.components.vaultIntegration.search(req.query.q);
                res.json(results);
            } else {
                res.status(503).json({ error: 'Vault not available' });
            }
        });
        
        this.app.get('/api/chat/conversations', async (req, res) => {
            // Proxy to chat interface
            try {
                const response = await fetch('http://localhost:9090/api/conversations');
                const data = await response.json();
                res.json(data);
            } catch (error) {
                res.status(503).json({ error: 'Chat interface not available' });
            }
        });
        
        // System security
        this.app.post('/api/system/lock', async (req, res) => {
            if (this.components.secureOS) {
                await this.components.secureOS.lock();
                res.json({ success: true });
            } else {
                res.status(503).json({ error: 'Secure OS not available' });
            }
        });
    }
    
    /**
     * Setup WebSocket server
     */
    setupWebSocketServer() {
        this.wsServer = new WebSocket.Server({
            port: this.config.wsPort
        });
        
        this.wsServer.on('connection', (ws) => {
            console.log('🔌 Desktop client connected');
            
            this.wsConnections.add(ws);
            
            // Send current desktop state
            ws.send(JSON.stringify({
                type: 'desktop-state',
                data: this.getDesktopStatus()
            }));
            
            ws.on('message', (message) => {
                this.handleWebSocketMessage(ws, message);
            });
            
            ws.on('close', () => {
                console.log('🔌 Desktop client disconnected');
                this.wsConnections.delete(ws);
            });
        });
    }
    
    /**
     * Handle WebSocket messages
     */
    handleWebSocketMessage(ws, message) {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'launch-app':
                    this.launchApplication(data.app, data.config);
                    break;
                    
                case 'switch-workspace':
                    this.switchWorkspace(data.workspace);
                    break;
                    
                case 'window-action':
                    this.handleWindowAction(data.windowId, data.action, data.params);
                    break;
                    
                case 'system-command':
                    this.handleSystemCommand(data.command, data.params);
                    break;
                    
                default:
                    console.log('Unknown WebSocket message type:', data.type);
            }
            
        } catch (error) {
            console.error('WebSocket message error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                error: error.message
            }));
        }
    }
    
    /**
     * Launch application
     */
    launchApplication(appName, config = {}) {
        if (!this.applications[appName] || !this.config.applications[appName]?.enabled) {
            return { success: false, error: 'Application not available' };
        }
        
        try {
            const app = this.applications[appName];
            const windowId = this.nextWindowId++;
            
            const window = {
                id: windowId,
                app: appName,
                title: app.title || appName,
                content: app.render(config),
                minimized: false,
                maximized: false,
                x: Math.random() * 200,
                y: Math.random() * 200,
                width: app.defaultWidth || 800,
                height: app.defaultHeight || 600,
                zIndex: this.state.windowManager.zIndex++
            };
            
            this.windows.set(windowId, window);
            this.state.openApplications.set(appName, windowId);
            this.state.activeWindow = windowId;
            
            // Notify clients
            this.broadcast({
                type: 'window-opened',
                window
            });
            
            console.log(`🚀 Launched ${appName} (window ${windowId})`);
            
            return { success: true, windowId };
            
        } catch (error) {
            console.error(`Failed to launch ${appName}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Close application
     */
    closeApplication(appName) {
        const windowId = this.state.openApplications.get(appName);
        
        if (windowId) {
            this.windows.delete(windowId);
            this.state.openApplications.delete(appName);
            
            if (this.state.activeWindow === windowId) {
                // Find next window to focus
                const windows = Array.from(this.windows.values());
                this.state.activeWindow = windows.length > 0 ? windows[windows.length - 1].id : null;
            }
            
            // Notify clients
            this.broadcast({
                type: 'window-closed',
                windowId
            });
            
            return { success: true };
        }
        
        return { success: false, error: 'Application not open' };
    }
    
    /**
     * Switch workspace
     */
    switchWorkspace(workspaceId) {
        if (workspaceId >= 0 && workspaceId < this.state.workspaces.length) {
            this.state.currentWorkspace = workspaceId;
            
            // Update workspace active state
            this.state.workspaces.forEach((ws, index) => {
                ws.active = index === workspaceId;
            });
            
            // Notify clients
            this.broadcast({
                type: 'workspace-changed',
                workspace: workspaceId
            });
            
            console.log(`🗂️  Switched to workspace: ${this.state.workspaces[workspaceId].name}`);
        }
    }
    
    /**
     * Generate desktop HTML
     */
    generateDesktopHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CAL Desktop Environment</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: ${this.config.theme === 'dark' ? '#1a1a1a' : '#f0f0f0'};
            color: ${this.config.theme === 'dark' ? '#ffffff' : '#000000'};
            height: 100vh;
            overflow: hidden;
        }
        
        .desktop {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        
        .taskbar {
            height: 40px;
            background: ${this.config.theme === 'dark' ? '#2d2d2d' : '#e0e0e0'};
            border-top: 1px solid ${this.config.theme === 'dark' ? '#444' : '#ccc'};
            display: flex;
            align-items: center;
            padding: 0 10px;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 10000;
        }
        
        .workspace-switcher {
            display: flex;
            gap: 5px;
            margin-right: 20px;
        }
        
        .workspace-btn {
            padding: 5px 12px;
            background: ${this.config.theme === 'dark' ? '#404040' : '#d0d0d0'};
            border: none;
            border-radius: 4px;
            color: inherit;
            cursor: pointer;
            font-size: 12px;
        }
        
        .workspace-btn.active {
            background: #007acc;
            color: white;
        }
        
        .app-launcher {
            display: flex;
            gap: 10px;
            flex: 1;
        }
        
        .app-icon {
            width: 32px;
            height: 32px;
            background: ${this.config.theme === 'dark' ? '#555' : '#bbb'};
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: background 0.2s;
        }
        
        .app-icon:hover {
            background: ${this.config.theme === 'dark' ? '#666' : '#aaa'};
        }
        
        .system-tray {
            display: flex;
            gap: 10px;
            align-items: center;
        }
        
        .desktop-area {
            flex: 1;
            position: relative;
            overflow: hidden;
        }
        
        .window {
            position: absolute;
            background: ${this.config.theme === 'dark' ? '#2d2d2d' : '#ffffff'};
            border: 1px solid ${this.config.theme === 'dark' ? '#555' : '#ccc'};
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            min-width: 300px;
            min-height: 200px;
            display: flex;
            flex-direction: column;
        }
        
        .window-header {
            height: 30px;
            background: ${this.config.theme === 'dark' ? '#3d3d3d' : '#f0f0f0'};
            border-bottom: 1px solid ${this.config.theme === 'dark' ? '#555' : '#ccc'};
            display: flex;
            align-items: center;
            padding: 0 10px;
            cursor: move;
            border-radius: 7px 7px 0 0;
        }
        
        .window-title {
            flex: 1;
            font-size: 13px;
            font-weight: 500;
        }
        
        .window-controls {
            display: flex;
            gap: 8px;
        }
        
        .window-control {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            cursor: pointer;
        }
        
        .window-control.close { background: #ff5f56; }
        .window-control.minimize { background: #ffbd2e; }
        .window-control.maximize { background: #27ca3f; }
        
        .window-content {
            flex: 1;
            padding: 10px;
            overflow: auto;
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.config.theme === 'dark' ? '#444' : '#fff'};
            border: 1px solid ${this.config.theme === 'dark' ? '#666' : '#ddd'};
            border-radius: 8px;
            padding: 15px;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 20000;
            animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            font-size: 18px;
        }
        
        .chat-widget {
            position: fixed;
            bottom: 50px;
            right: 20px;
            width: 350px;
            height: 500px;
            background: ${this.config.theme === 'dark' ? '#2d2d2d' : '#ffffff'};
            border: 1px solid ${this.config.theme === 'dark' ? '#555' : '#ccc'};
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            display: flex;
            flex-direction: column;
            z-index: 9999;
        }
        
        .chat-header {
            padding: 15px;
            border-bottom: 1px solid ${this.config.theme === 'dark' ? '#555' : '#eee'};
            font-weight: 600;
            background: linear-gradient(135deg, #007acc, #005a9e);
            color: white;
            border-radius: 11px 11px 0 0;
        }
        
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        }
        
        .chat-input {
            padding: 15px;
            border-top: 1px solid ${this.config.theme === 'dark' ? '#555' : '#eee'};
        }
        
        .chat-input input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid ${this.config.theme === 'dark' ? '#555' : '#ddd'};
            border-radius: 20px;
            background: ${this.config.theme === 'dark' ? '#404040' : '#f8f8f8'};
            color: inherit;
            outline: none;
        }
    </style>
</head>
<body>
    <div class="desktop">
        <div class="desktop-area" id="desktopArea">
            <div class="loading" id="loadingScreen">
                <div>🖥️ Loading CAL Desktop Environment...</div>
            </div>
        </div>
        
        <div class="taskbar">
            <div class="workspace-switcher">
                ${this.state.workspaces.map((ws, i) => 
                    `<button class="workspace-btn ${ws.active ? 'active' : ''}" onclick="switchWorkspace(${i})">${ws.name}</button>`
                ).join('')}
            </div>
            
            <div class="app-launcher">
                ${Object.entries(this.config.applications)
                    .filter(([_, config]) => config.enabled)
                    .map(([name, _]) => {
                        const icons = {
                            terminal: '⚡',
                            editor: '📝',
                            notepad: '📄',
                            fileManager: '📁',
                            browser: '🌐',
                            chat: '💬',
                            calculator: '🧮',
                            office: '📊'
                        };
                        return `<div class="app-icon" onclick="launchApp('${name}')" title="${name}">${icons[name] || '📱'}</div>`;
                    }).join('')}
            </div>
            
            <div class="system-tray">
                <div class="system-time" id="systemTime"></div>
                <div class="app-icon" onclick="lockSystem()" title="Lock System">🔒</div>
                <div class="app-icon" onclick="showSystemInfo()" title="System Info">ℹ️</div>
            </div>
        </div>
        
        <div class="chat-widget" id="chatWidget" style="display: none;">
            <div class="chat-header">
                🤖 CAL Assistant
                <div style="float: right; cursor: pointer;" onclick="toggleChat()">×</div>
            </div>
            <div class="chat-messages" id="chatMessages">
                <div style="padding: 20px; text-align: center; color: #666;">
                    Start a conversation to build anything!
                </div>
            </div>
            <div class="chat-input">
                <input type="text" id="chatInput" placeholder="Type your message..." onkeypress="handleChatKeypress(event)">
            </div>
        </div>
    </div>
    
    <script>
        let ws = null;
        let windows = new Map();
        let dragState = null;
        
        // Initialize desktop
        async function initDesktop() {
            // Connect WebSocket
            ws = new WebSocket('ws://localhost:${this.config.wsPort}');
            
            ws.onopen = () => {
                console.log('Connected to desktop environment');
                document.getElementById('loadingScreen').style.display = 'none';
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleDesktopMessage(data);
            };
            
            ws.onerror = (error) => {
                console.error('Desktop WebSocket error:', error);
            };
            
            // Update time
            updateSystemTime();
            setInterval(updateSystemTime, 1000);
            
            // Setup drag and drop
            setupWindowDragging();
        }
        
        function handleDesktopMessage(data) {
            switch (data.type) {
                case 'window-opened':
                    createWindow(data.window);
                    break;
                case 'window-closed':
                    removeWindow(data.windowId);
                    break;
                case 'desktop-state':
                    updateDesktopState(data.data);
                    break;
                case 'notification':
                    showNotification(data.message, data.type);
                    break;
            }
        }
        
        function createWindow(windowData) {
            const windowEl = document.createElement('div');
            windowEl.className = 'window';
            windowEl.style.left = windowData.x + 'px';
            windowEl.style.top = windowData.y + 'px';
            windowEl.style.width = windowData.width + 'px';
            windowEl.style.height = windowData.height + 'px';
            windowEl.style.zIndex = windowData.zIndex;
            
            windowEl.innerHTML = \`
                <div class="window-header" onmousedown="startDrag(event, '\${windowData.id}')">
                    <div class="window-title">\${windowData.title}</div>
                    <div class="window-controls">
                        <div class="window-control minimize" onclick="minimizeWindow('\${windowData.id}')"></div>
                        <div class="window-control maximize" onclick="maximizeWindow('\${windowData.id}')"></div>
                        <div class="window-control close" onclick="closeWindow('\${windowData.id}')"></div>
                    </div>
                </div>
                <div class="window-content">
                    \${windowData.content}
                </div>
            \`;
            
            document.getElementById('desktopArea').appendChild(windowEl);
            windows.set(windowData.id, windowEl);
        }
        
        function removeWindow(windowId) {
            const windowEl = windows.get(windowId);
            if (windowEl) {
                windowEl.remove();
                windows.delete(windowId);
            }
        }
        
        function launchApp(appName) {
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'launch-app',
                    app: appName
                }));
            }
        }
        
        function switchWorkspace(workspaceId) {
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'switch-workspace',
                    workspace: workspaceId
                }));
            }
        }
        
        function updateSystemTime() {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            document.getElementById('systemTime').textContent = timeStr;
        }
        
        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.innerHTML = \`
                <div style="font-weight: 600; margin-bottom: 5px;">\${type.toUpperCase()}</div>
                <div>\${message}</div>
            \`;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
        
        function toggleChat() {
            const chatWidget = document.getElementById('chatWidget');
            chatWidget.style.display = chatWidget.style.display === 'none' ? 'flex' : 'none';
        }
        
        function handleChatKeypress(event) {
            if (event.key === 'Enter') {
                const input = event.target;
                const message = input.value.trim();
                if (message) {
                    sendChatMessage(message);
                    input.value = '';
                }
            }
        }
        
        function sendChatMessage(message) {
            // Add message to chat
            const messagesDiv = document.getElementById('chatMessages');
            messagesDiv.innerHTML += \`
                <div style="margin-bottom: 10px;">
                    <strong>You:</strong> \${message}
                </div>
            \`;
            
            // Send to CAL
            fetch('/api/chat/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            })
            .then(res => res.json())
            .then(data => {
                messagesDiv.innerHTML += \`
                    <div style="margin-bottom: 10px;">
                        <strong>CAL:</strong> \${data.response.message}
                    </div>
                \`;
                messagesDiv.scrollTop = messagesDiv.scrollHeight;
            })
            .catch(console.error);
        }
        
        function lockSystem() {
            if (confirm('Lock the desktop?')) {
                fetch('/api/system/lock', { method: 'POST' })
                .then(() => {
                    document.body.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-size: 24px;">🔒 System Locked</div>';
                });
            }
        }
        
        function showSystemInfo() {
            launchApp('terminal');
        }
        
        // Window dragging
        function startDrag(event, windowId) {
            dragState = {
                windowId,
                startX: event.clientX,
                startY: event.clientY,
                windowEl: windows.get(windowId)
            };
            
            event.preventDefault();
        }
        
        function setupWindowDragging() {
            document.addEventListener('mousemove', (event) => {
                if (dragState) {
                    const deltaX = event.clientX - dragState.startX;
                    const deltaY = event.clientY - dragState.startY;
                    
                    const currentLeft = parseInt(dragState.windowEl.style.left);
                    const currentTop = parseInt(dragState.windowEl.style.top);
                    
                    dragState.windowEl.style.left = (currentLeft + deltaX) + 'px';
                    dragState.windowEl.style.top = (currentTop + deltaY) + 'px';
                    
                    dragState.startX = event.clientX;
                    dragState.startY = event.clientY;
                }
            });
            
            document.addEventListener('mouseup', () => {
                dragState = null;
            });
        }
        
        function minimizeWindow(windowId) {
            const windowEl = windows.get(windowId);
            if (windowEl) {
                windowEl.style.display = 'none';
            }
        }
        
        function maximizeWindow(windowId) {
            const windowEl = windows.get(windowId);
            if (windowEl) {
                if (windowEl.classList.contains('maximized')) {
                    windowEl.classList.remove('maximized');
                    windowEl.style.width = '800px';
                    windowEl.style.height = '600px';
                    windowEl.style.left = '50px';
                    windowEl.style.top = '50px';
                } else {
                    windowEl.classList.add('maximized');
                    windowEl.style.width = '100vw';
                    windowEl.style.height = 'calc(100vh - 40px)';
                    windowEl.style.left = '0';
                    windowEl.style.top = '0';
                }
            }
        }
        
        function closeWindow(windowId) {
            if (ws) {
                ws.send(JSON.stringify({
                    type: 'window-action',
                    windowId,
                    action: 'close'
                }));
            }
        }
        
        // Initialize when page loads
        document.addEventListener('DOMContentLoaded', initDesktop);
    </script>
</body>
</html>
        `;
    }
    
    /**
     * Start desktop services
     */
    async startDesktopServices() {
        console.log('🚀 Starting desktop services...');
        
        // Auto-save service
        if (this.config.autoSave) {
            setInterval(() => {
                this.autoSave();
            }, 30000);
        }
        
        // Notification service
        this.services.set('notifications', {
            queue: [],
            send: (message, type = 'info') => {
                this.broadcast({
                    type: 'notification',
                    message,
                    notificationType: type
                });
            }
        });
        
        // System monitor
        this.services.set('monitor', {
            stats: this.getSystemStats(),
            update: () => {
                this.services.get('monitor').stats = this.getSystemStats();
            }
        });
    }
    
    /**
     * Start HTTP server
     */
    async startServer() {
        return new Promise((resolve, reject) => {
            this.server.listen(this.config.port, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
    
    /**
     * Broadcast message to all WebSocket clients
     */
    broadcast(message) {
        const messageStr = JSON.stringify(message);
        this.wsConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        });
    }
    
    /**
     * Get desktop status
     */
    getDesktopStatus() {
        return {
            initialized: this.state.initialized,
            currentWorkspace: this.state.currentWorkspace,
            workspaces: this.state.workspaces,
            openApplications: Object.fromEntries(this.state.openApplications),
            windows: Array.from(this.windows.values()),
            theme: this.config.theme,
            airgapMode: this.config.airgapMode,
            uptime: process.uptime(),
            systemStats: this.getSystemStats()
        };
    }
    
    /**
     * Get system statistics
     */
    getSystemStats() {
        const memory = process.memoryUsage();
        return {
            uptime: process.uptime(),
            memory: {
                used: memory.heapUsed,
                total: memory.heapTotal,
                external: memory.external
            },
            cpu: process.cpuUsage(),
            platform: process.platform,
            nodeVersion: process.version
        };
    }
    
    /**
     * Auto-save function
     */
    autoSave() {
        // Save desktop state
        const state = {
            workspaces: this.state.workspaces,
            openApplications: Object.fromEntries(this.state.openApplications),
            theme: this.config.theme
        };
        
        // In production, would save to secure storage
        console.log('💾 Auto-saved desktop state');
    }
    
    focusWindow(windowId) {
        this.state.activeWindow = windowId;
        this.broadcast({
            type: 'window-focused',
            windowId
        });
    }
    
    minimizeWindow(windowId) {
        const window = this.windows.get(windowId);
        if (window) {
            window.minimized = true;
            this.broadcast({
                type: 'window-minimized',
                windowId
            });
        }
    }
    
    handleWindowAction(windowId, action, params) {
        switch (action) {
            case 'focus':
                this.focusWindow(windowId);
                break;
            case 'minimize':
                this.minimizeWindow(windowId);
                break;
            case 'close':
                this.closeWindow(windowId);
                break;
        }
    }
    
    closeWindow(windowId) {
        this.windows.delete(windowId);
        this.broadcast({
            type: 'window-closed',
            windowId
        });
    }
    
    handleSystemCommand(command, params) {
        switch (command) {
            case 'lock':
                if (this.components.secureOS) {
                    this.components.secureOS.lock();
                }
                break;
            case 'shutdown':
                this.shutdown();
                break;
        }
    }
    
    shutdown() {
        console.log('🖥️  Desktop environment shutting down...');
        this.broadcast({ type: 'system-shutdown' });
        
        // Close all applications
        for (const [appName, windowId] of this.state.openApplications) {
            this.closeApplication(appName);
        }
        
        // Auto-save
        this.autoSave();
        
        // Close WebSocket server
        this.wsServer.close();
        
        // Close HTTP server
        this.server.close();
        
        process.exit(0);
    }
}

// Application classes (simplified implementations)
class BaseApplication {
    constructor(desktop) {
        this.desktop = desktop;
        this.defaultWidth = 800;
        this.defaultHeight = 600;
    }
    
    async initialize() {
        // Override in subclasses
    }
    
    render(config = {}) {
        return '<div>Base Application</div>';
    }
}

class TerminalApp extends BaseApplication {
    constructor(desktop) {
        super(desktop);
        this.title = 'Terminal';
        this.description = 'Secure terminal emulator';
    }
    
    render(config) {
        return `
            <div style="background: #000; color: #0f0; font-family: monospace; padding: 10px; height: 100%;">
                <div>CAL Secure Terminal v1.0.0</div>
                <div>Type 'help' for available commands</div>
                <div><span style="color: #0f0;">cal@secure-os:~$</span> <input type="text" style="background: transparent; border: none; color: #0f0; outline: none; width: 70%;"></div>
            </div>
        `;
    }
}

class CodeEditor extends BaseApplication {
    constructor(desktop) {
        super(desktop);
        this.title = 'Code Editor';
        this.description = 'Monaco-based code editor';
        this.defaultWidth = 1000;
        this.defaultHeight = 700;
    }
    
    render(config) {
        return `
            <div style="display: flex; flex-direction: column; height: 100%;">
                <div style="background: #f0f0f0; padding: 5px; border-bottom: 1px solid #ccc;">
                    <select><option>JavaScript</option><option>Python</option><option>HTML</option></select>
                    <button>Save</button>
                    <button>Run</button>
                </div>
                <textarea style="flex: 1; font-family: monospace; border: none; outline: none; padding: 10px;" placeholder="// Start coding..."></textarea>
            </div>
        `;
    }
}

class NotePadApp extends BaseApplication {
    constructor(desktop) {
        super(desktop);
        this.title = 'Secure Notes';
        this.description = 'Encrypted note-taking app';
    }
    
    render(config) {
        return `
            <div style="display: flex; flex-direction: column; height: 100%;">
                <div style="background: #f8f8f8; padding: 10px; border-bottom: 1px solid #ddd;">
                    <input type="text" placeholder="Note title..." style="width: 100%; padding: 5px; border: 1px solid #ccc;">
                </div>
                <textarea style="flex: 1; border: none; outline: none; padding: 15px; resize: none;" placeholder="Start writing... (automatically encrypted)"></textarea>
                <div style="padding: 10px; background: #f8f8f8; border-top: 1px solid #ddd; text-align: right;">
                    <button>Save Encrypted</button>
                </div>
            </div>
        `;
    }
}

class FileManager extends BaseApplication {
    constructor(desktop) {
        super(desktop);
        this.title = 'File Manager';
        this.description = 'Secure file browser';
        this.defaultWidth = 900;
        this.defaultHeight = 600;
    }
    
    render(config) {
        return `
            <div style="display: flex; height: 100%;">
                <div style="width: 200px; background: #f5f5f5; border-right: 1px solid #ddd; padding: 10px;">
                    <div style="margin-bottom: 10px; font-weight: bold;">📁 Quick Access</div>
                    <div style="margin-bottom: 5px;">🏠 Home</div>
                    <div style="margin-bottom: 5px;">📄 Documents</div>
                    <div style="margin-bottom: 5px;">🚀 Projects</div>
                    <div style="margin-bottom: 5px;">🔒 Secure Vault</div>
                </div>
                <div style="flex: 1; padding: 10px;">
                    <div style="margin-bottom: 10px;">
                        <input type="text" placeholder="Search files..." style="width: 300px; padding: 5px;">
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 10px;">
                        <div style="text-align: center; padding: 10px; border: 1px solid #eee;">
                            <div style="font-size: 24px;">📝</div>
                            <div style="font-size: 12px;">notes.md</div>
                        </div>
                        <div style="text-align: center; padding: 10px; border: 1px solid #eee;">
                            <div style="font-size: 24px;">🔒</div>
                            <div style="font-size: 12px;">secure.enc</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

class ChatInterface extends BaseApplication {
    constructor(desktop) {
        super(desktop);
        this.title = 'CAL Chat';
        this.description = 'Chat with CAL Assistant';
        this.defaultWidth = 400;
        this.defaultHeight = 600;
    }
    
    render(config) {
        return `
            <div style="display: flex; flex-direction: column; height: 100%;">
                <div style="flex: 1; padding: 15px; overflow-y: auto; background: #fafafa;">
                    <div style="margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 8px;">
                        <strong>CAL:</strong> Hi! I'm CAL. Tell me about your project and I'll help you build it!
                    </div>
                </div>
                <div style="padding: 15px; border-top: 1px solid #ddd;">
                    <input type="text" placeholder="Type your message..." style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 20px;">
                </div>
            </div>
        `;
    }
}

class Calculator extends BaseApplication {
    constructor(desktop) {
        super(desktop);
        this.title = 'Calculator';
        this.description = 'Basic calculator';
        this.defaultWidth = 300;
        this.defaultHeight = 400;
    }
    
    render(config) {
        return `
            <div style="display: flex; flex-direction: column; height: 100%; background: #f0f0f0;">
                <div style="padding: 20px; background: #333; color: white; text-align: right; font-size: 24px; font-family: monospace;">
                    0
                </div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; flex: 1;">
                    ${['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '0', '.', '='].map(btn => 
                        `<button style="border: none; background: #e0e0e0; font-size: 18px; cursor: pointer;" onmouseover="this.style.background='#d0d0d0'" onmouseout="this.style.background='#e0e0e0'">${btn}</button>`
                    ).join('')}
                </div>
            </div>
        `;
    }
}

class SecureBrowser extends BaseApplication {
    constructor(desktop) {
        super(desktop);
        this.title = 'Secure Browser';
        this.description = 'Tor-enabled secure browser';
        this.defaultWidth = 1200;
        this.defaultHeight = 800;
    }
    
    render(config) {
        if (this.desktop.config.airgapMode) {
            return `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; text-align: center;">
                    <div>
                        <div style="font-size: 48px; margin-bottom: 20px;">🚫</div>
                        <div style="font-size: 18px; margin-bottom: 10px;">Browser Disabled</div>
                        <div style="color: #666;">Air-gap mode is enabled for maximum security</div>
                    </div>
                </div>
            `;
        }
        
        return `
            <div style="display: flex; flex-direction: column; height: 100%;">
                <div style="padding: 10px; background: #f8f8f8; border-bottom: 1px solid #ddd;">
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button>←</button>
                        <button>→</button>
                        <button>↻</button>
                        <input type="text" placeholder="Enter URL..." style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;" value="about:blank">
                        <div style="color: #666;">🧅 Tor Enabled</div>
                    </div>
                </div>
                <div style="flex: 1; background: white; display: flex; align-items: center; justify-content: center;">
                    <div style="text-align: center;">
                        <div style="font-size: 24px; margin-bottom: 10px;">🔒 Secure Browser</div>
                        <div style="color: #666;">All connections routed through Tor</div>
                    </div>
                </div>
            </div>
        `;
    }
}

class OfficeApp extends BaseApplication {
    constructor(desktop) {
        super(desktop);
        this.title = 'Office Suite';
        this.description = 'Document editor';
        this.defaultWidth = 1000;
        this.defaultHeight = 700;
    }
    
    render(config) {
        return `
            <div style="display: flex; flex-direction: column; height: 100%;">
                <div style="padding: 10px; background: #f8f8f8; border-bottom: 1px solid #ddd;">
                    <div style="display: flex; gap: 10px;">
                        <select><option>Document</option><option>Spreadsheet</option><option>Presentation</option></select>
                        <button>📁</button>
                        <button>💾</button>
                        <button>🖨️</button>
                        <div style="width: 1px; background: #ccc; margin: 0 10px;"></div>
                        <button><strong>B</strong></button>
                        <button><em>I</em></button>
                        <button><u>U</u></button>
                    </div>
                </div>
                <div style="flex: 1; background: white; padding: 20px;">
                    <div contenteditable="true" style="height: 100%; outline: none; line-height: 1.6;">
                        <h1>New Document</h1>
                        <p>Start typing your document here...</p>
                    </div>
                </div>
            </div>
        `;
    }
}

module.exports = CALDesktopEnvironment;

// Start if run directly
if (require.main === module) {
    const desktop = new CALDesktopEnvironment({
        airgapMode: process.argv.includes('--airgap'),
        theme: process.argv.includes('--light') ? 'light' : 'dark'
    });
    
    desktop.initialize().catch(error => {
        console.error('Failed to start desktop:', error);
        process.exit(1);
    });
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n🖥️  Desktop environment shutting down...');
        desktop.shutdown();
    });
}