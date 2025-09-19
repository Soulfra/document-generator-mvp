#!/usr/bin/env node

/**
 * 🔍 UNIVERSAL DEBUG INTERFACE
 * 
 * Cross-platform debugging interface that works everywhere:
 * - Web browsers (Chrome DevTools, Safari Inspector, Firefox)
 * - Mobile apps (iOS/Android remote debugging)
 * - Desktop apps (Electron DevTools)
 * - Terminal/CLI (Node.js inspector)
 * - Cloud services (remote debugging)
 * 
 * Features unified logging, inspection, and real-time debugging.
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const PlatformAbstractionLayer = require('./platform-abstraction-layer');
const MetaLearningErrorSystem = require('./meta-learning-error-system');
const UniversalLanguageProcessor = require('./universal-language-processor');

class UniversalDebugInterface extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Core systems
        this.pal = new PlatformAbstractionLayer();
        this.metaLearning = new MetaLearningErrorSystem();
        this.languageProcessor = new UniversalLanguageProcessor();
        
        // Debug configuration
        this.config = {
            port: config.port || 9999,
            wsPort: config.wsPort || 9998,
            enableRemoteDebug: config.enableRemoteDebug !== false,
            logLevel: config.logLevel || 'info',
            maxLogEntries: config.maxLogEntries || 10000,
            ...config
        };
        
        // Debug state
        this.debugSessions = new Map();
        this.breakpoints = new Map();
        this.watchExpressions = new Map();
        this.logBuffer = [];
        this.performanceMetrics = new Map();
        
        // Platform-specific adapters
        this.debugAdapters = new Map();
        
        console.log('🔍 Universal Debug Interface initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Initialize subsystems
            await this.metaLearning.initialize();
            await this.languageProcessor.initialize();
            
            // Set up platform-specific adapters
            this.setupDebugAdapters();
            
            // Start debug server
            await this.startDebugServer();
            
            // Start WebSocket server for real-time debugging
            this.startWebSocketServer();
            
            // Set up global error handlers
            this.setupGlobalHandlers();
            
            console.log('✅ Universal Debug Interface ready!');
            console.log(`   🌐 Web UI: http://localhost:${this.config.port}`);
            console.log(`   🔌 WebSocket: ws://localhost:${this.config.wsPort}`);
            console.log(`   📱 Platform: ${this.pal.getPlatform().name}`);
            
        } catch (error) {
            console.error('❌ Debug interface initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Set up platform-specific debug adapters
     */
    setupDebugAdapters() {
        const platform = this.pal.getPlatform();
        
        // Chrome DevTools Protocol adapter
        this.debugAdapters.set('chrome', {
            name: 'Chrome DevTools Protocol',
            connect: () => this.connectChromeDevTools(),
            supported: ['browser', 'electron']
        });
        
        // Safari Web Inspector adapter
        this.debugAdapters.set('safari', {
            name: 'Safari Web Inspector',
            connect: () => this.connectSafariInspector(),
            supported: ['browser', 'ios-web']
        });
        
        // Android Debug Bridge adapter
        this.debugAdapters.set('adb', {
            name: 'Android Debug Bridge',
            connect: () => this.connectADB(),
            supported: ['android', 'android-web', 'react-native-android']
        });
        
        // iOS Device Console adapter
        this.debugAdapters.set('ios', {
            name: 'iOS Device Console',
            connect: () => this.connectIOSConsole(),
            supported: ['ios', 'ios-web', 'react-native-ios']
        });
        
        // Node.js Inspector adapter
        this.debugAdapters.set('node', {
            name: 'Node.js Inspector',
            connect: () => this.connectNodeInspector(),
            supported: ['node', 'electron']
        });
    }
    
    /**
     * Start debug web server
     */
    async startDebugServer() {
        this.app = express();
        
        // Middleware
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'debug-ui')));
        
        // Main debug interface
        this.app.get('/', async (req, res) => {
            res.send(await this.generateDebugInterface());
        });
        
        // API endpoints
        this.app.get('/api/status', (req, res) => {
            res.json(this.getDebugStatus());
        });
        
        this.app.get('/api/logs', (req, res) => {
            const limit = parseInt(req.query.limit) || 100;
            const level = req.query.level || 'all';
            res.json(this.getLogs(limit, level));
        });
        
        this.app.get('/api/sessions', (req, res) => {
            res.json(Array.from(this.debugSessions.values()));
        });
        
        this.app.post('/api/breakpoint', (req, res) => {
            const { file, line, condition } = req.body;
            const id = this.addBreakpoint(file, line, condition);
            res.json({ id, success: true });
        });
        
        this.app.post('/api/watch', (req, res) => {
            const { expression } = req.body;
            const id = this.addWatchExpression(expression);
            res.json({ id, success: true });
        });
        
        this.app.get('/api/metrics', (req, res) => {
            res.json(this.getPerformanceMetrics());
        });
        
        this.app.get('/api/errors', async (req, res) => {
            const report = await this.metaLearning.getHealthReport();
            res.json(report);
        });
        
        // Platform-specific endpoints
        this.app.get('/api/platform', (req, res) => {
            res.json(this.pal.getPlatform());
        });
        
        this.app.get('/api/language/detect', async (req, res) => {
            const { text } = req.query;
            const result = await this.languageProcessor.detectLanguage(text);
            res.json(result);
        });
        
        // Start server
        return new Promise((resolve) => {
            this.server = this.app.listen(this.config.port, () => {
                resolve();
            });
        });
    }
    
    /**
     * Start WebSocket server for real-time debugging
     */
    startWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            const sessionId = this.createDebugSession(ws, req);
            
            console.log(`🔌 Debug session connected: ${sessionId}`);
            
            ws.on('message', (message) => {
                this.handleDebugMessage(sessionId, message);
            });
            
            ws.on('close', () => {
                this.closeDebugSession(sessionId);
                console.log(`🔌 Debug session disconnected: ${sessionId}`);
            });
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'connected',
                sessionId,
                platform: this.pal.getPlatform(),
                adapters: this.getAvailableAdapters()
            }));
        });
    }
    
    /**
     * Generate debug interface HTML
     */
    async generateDebugInterface() {
        const platform = this.pal.getPlatform();
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Universal Debug Interface</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background: #1a1a1a;
            padding: 10px 20px;
            border-bottom: 1px solid #333;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .header h1 {
            font-size: 20px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .platform-badge {
            background: #2a2a2a;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            color: #4CAF50;
        }
        
        .container {
            flex: 1;
            display: flex;
            overflow: hidden;
        }
        
        .sidebar {
            width: 250px;
            background: #151515;
            border-right: 1px solid #333;
            overflow-y: auto;
        }
        
        .main {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .tabs {
            display: flex;
            background: #1a1a1a;
            border-bottom: 1px solid #333;
        }
        
        .tab {
            padding: 10px 20px;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
        }
        
        .tab:hover {
            background: #252525;
        }
        
        .tab.active {
            border-bottom-color: #4CAF50;
            color: #4CAF50;
        }
        
        .tab-content {
            flex: 1;
            overflow: auto;
            padding: 20px;
        }
        
        .log-entry {
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            padding: 8px 12px;
            border-bottom: 1px solid #1a1a1a;
            display: flex;
            align-items: flex-start;
            gap: 10px;
        }
        
        .log-level {
            font-weight: bold;
            text-transform: uppercase;
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 3px;
            min-width: 50px;
            text-align: center;
        }
        
        .log-level.error { background: #f44336; color: white; }
        .log-level.warn { background: #ff9800; color: white; }
        .log-level.info { background: #2196F3; color: white; }
        .log-level.debug { background: #607D8B; color: white; }
        .log-level.trace { background: #9E9E9E; color: white; }
        
        .log-timestamp {
            color: #666;
            font-size: 11px;
        }
        
        .log-message {
            flex: 1;
            word-break: break-word;
        }
        
        .metric-card {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .metric-title {
            font-size: 14px;
            color: #888;
            margin-bottom: 10px;
        }
        
        .metric-value {
            font-size: 32px;
            font-weight: bold;
            color: #4CAF50;
        }
        
        .metric-unit {
            font-size: 14px;
            color: #666;
            margin-left: 5px;
        }
        
        .search-box {
            padding: 10px;
            background: #1a1a1a;
            border-bottom: 1px solid #333;
        }
        
        .search-box input {
            width: 100%;
            padding: 8px 12px;
            background: #0a0a0a;
            border: 1px solid #333;
            color: #e0e0e0;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .breakpoint-list {
            padding: 10px;
        }
        
        .breakpoint-item {
            padding: 8px 12px;
            background: #1a1a1a;
            border-radius: 4px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
        }
        
        .breakpoint-item:hover {
            background: #252525;
        }
        
        .breakpoint-location {
            font-family: monospace;
            font-size: 12px;
            color: #4CAF50;
        }
        
        .console-input {
            padding: 15px;
            background: #1a1a1a;
            border-top: 1px solid #333;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .console-input input {
            flex: 1;
            padding: 8px 12px;
            background: #0a0a0a;
            border: 1px solid #333;
            color: #e0e0e0;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
        }
        
        .status-indicator {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #4CAF50;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .error-pattern {
            background: #1a1a1a;
            border-left: 3px solid #f44336;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 4px;
        }
        
        .error-pattern-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: #f44336;
        }
        
        .error-pattern-count {
            font-size: 12px;
            color: #888;
        }
        
        @media (max-width: 768px) {
            .sidebar { display: none; }
            .metric-card { padding: 15px; }
            .metric-value { font-size: 24px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>
            🔍 Universal Debug Interface
            <div class="status-indicator"></div>
        </h1>
        <div class="platform-badge">${platform.name} (${platform.environment})</div>
    </div>
    
    <div class="container">
        <div class="sidebar">
            <div class="search-box">
                <input type="text" placeholder="Search..." id="searchInput">
            </div>
            
            <div class="breakpoint-list" id="breakpointList">
                <h3 style="padding: 10px; font-size: 14px; color: #888;">Breakpoints</h3>
            </div>
            
            <div class="breakpoint-list" id="watchList">
                <h3 style="padding: 10px; font-size: 14px; color: #888;">Watch Expressions</h3>
            </div>
        </div>
        
        <div class="main">
            <div class="tabs">
                <div class="tab active" data-tab="console">Console</div>
                <div class="tab" data-tab="metrics">Metrics</div>
                <div class="tab" data-tab="errors">Errors</div>
                <div class="tab" data-tab="network">Network</div>
                <div class="tab" data-tab="platform">Platform</div>
            </div>
            
            <div class="tab-content" id="console-tab">
                <div id="logContainer"></div>
            </div>
            
            <div class="tab-content" id="metrics-tab" style="display: none;">
                <div class="metric-card">
                    <div class="metric-title">Memory Usage</div>
                    <div class="metric-value" id="memoryUsage">0<span class="metric-unit">MB</span></div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">CPU Usage</div>
                    <div class="metric-value" id="cpuUsage">0<span class="metric-unit">%</span></div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Active Connections</div>
                    <div class="metric-value" id="connections">0</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">Response Time</div>
                    <div class="metric-value" id="responseTime">0<span class="metric-unit">ms</span></div>
                </div>
            </div>
            
            <div class="tab-content" id="errors-tab" style="display: none;">
                <div id="errorPatterns"></div>
            </div>
            
            <div class="tab-content" id="network-tab" style="display: none;">
                <div id="networkRequests"></div>
            </div>
            
            <div class="tab-content" id="platform-tab" style="display: none;">
                <pre id="platformInfo" style="background: #1a1a1a; padding: 20px; border-radius: 8px;"></pre>
            </div>
            
            <div class="console-input">
                <span style="color: #4CAF50;">❯</span>
                <input type="text" id="consoleInput" placeholder="Enter debug command...">
            </div>
        </div>
    </div>
    
    <script>
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:${this.config.wsPort}');
        let sessionId = null;
        
        ws.onopen = () => {
            console.log('Connected to debug server');
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMessage(data);
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
        
        // Message handler
        function handleMessage(data) {
            switch (data.type) {
                case 'connected':
                    sessionId = data.sessionId;
                    updatePlatformInfo(data.platform);
                    break;
                case 'log':
                    addLogEntry(data.entry);
                    break;
                case 'metric':
                    updateMetric(data.metric);
                    break;
                case 'error':
                    handleError(data.error);
                    break;
            }
        }
        
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
                
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab + '-tab').style.display = 'block';
            });
        });
        
        // Console input
        document.getElementById('consoleInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const command = e.target.value;
                ws.send(JSON.stringify({
                    type: 'command',
                    command,
                    sessionId
                }));
                e.target.value = '';
            }
        });
        
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll('.log-entry').forEach(entry => {
                const text = entry.textContent.toLowerCase();
                entry.style.display = text.includes(searchTerm) ? 'flex' : 'none';
            });
        });
        
        // Add log entry
        function addLogEntry(entry) {
            const container = document.getElementById('logContainer');
            const div = document.createElement('div');
            div.className = 'log-entry';
            
            const timestamp = new Date(entry.timestamp).toLocaleTimeString();
            
            div.innerHTML = \`
                <span class="log-timestamp">\${timestamp}</span>
                <span class="log-level \${entry.level}">\${entry.level}</span>
                <span class="log-message">\${entry.message}</span>
            \`;
            
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        }
        
        // Update metric
        function updateMetric(metric) {
            const element = document.getElementById(metric.name);
            if (element) {
                element.childNodes[0].textContent = metric.value;
            }
        }
        
        // Update platform info
        function updatePlatformInfo(platform) {
            document.getElementById('platformInfo').textContent = JSON.stringify(platform, null, 2);
        }
        
        // Load initial data
        fetch('/api/status').then(r => r.json()).then(data => {
            // Update UI with initial state
        });
        
        // Periodic updates
        setInterval(() => {
            fetch('/api/metrics').then(r => r.json()).then(metrics => {
                Object.entries(metrics).forEach(([name, value]) => {
                    updateMetric({ name, value });
                });
            });
        }, 1000);
        
        // Load error patterns
        fetch('/api/errors').then(r => r.json()).then(errors => {
            const container = document.getElementById('errorPatterns');
            errors.topErrors?.forEach(error => {
                const div = document.createElement('div');
                div.className = 'error-pattern';
                div.innerHTML = \`
                    <div class="error-pattern-title">\${error.type}</div>
                    <div class="error-pattern-count">\${error.count} occurrences • Severity: \${error.severity}</div>
                \`;
                container.appendChild(div);
            });
        });
    </script>
</body>
</html>
        `;
    }
    
    /**
     * Setup global error handlers
     */
    setupGlobalHandlers() {
        // Capture all console methods
        const methods = ['log', 'error', 'warn', 'info', 'debug', 'trace'];
        
        methods.forEach(method => {
            const original = console[method];
            console[method] = (...args) => {
                // Call original method
                original.apply(console, args);
                
                // Capture for debug interface
                this.captureLog(method, args);
            };
        });
        
        // Capture unhandled errors
        if (typeof window !== 'undefined') {
            window.addEventListener('error', (event) => {
                this.captureError(event.error || event);
            });
            
            window.addEventListener('unhandledrejection', (event) => {
                this.captureError(event.reason);
            });
        } else {
            process.on('uncaughtException', (error) => {
                this.captureError(error);
            });
            
            process.on('unhandledRejection', (reason) => {
                this.captureError(reason);
            });
        }
    }
    
    /**
     * Capture log entry
     */
    captureLog(level, args) {
        const entry = {
            level,
            message: args.map(arg => this.stringifyArg(arg)).join(' '),
            timestamp: Date.now(),
            stack: this.captureStack(),
            platform: this.pal.getPlatform().name
        };
        
        // Add to buffer
        this.logBuffer.push(entry);
        if (this.logBuffer.length > this.config.maxLogEntries) {
            this.logBuffer.shift();
        }
        
        // Broadcast to connected clients
        this.broadcast({
            type: 'log',
            entry
        });
        
        // Learn from errors
        if (level === 'error') {
            this.metaLearning.recordError({
                type: 'console_error',
                message: entry.message,
                service: 'debug-interface',
                stack: entry.stack
            });
        }
    }
    
    /**
     * Capture error
     */
    captureError(error) {
        const errorInfo = {
            message: error.message || String(error),
            stack: error.stack,
            type: error.name || 'Error',
            timestamp: Date.now(),
            platform: this.pal.getPlatform().name
        };
        
        // Record in meta-learning system
        this.metaLearning.recordError({
            type: errorInfo.type,
            message: errorInfo.message,
            service: 'debug-interface',
            stack: errorInfo.stack,
            platform: errorInfo.platform
        });
        
        // Broadcast to clients
        this.broadcast({
            type: 'error',
            error: errorInfo
        });
    }
    
    /**
     * Stringify argument for logging
     */
    stringifyArg(arg) {
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        
        try {
            return JSON.stringify(arg, null, 2);
        } catch {
            return Object.prototype.toString.call(arg);
        }
    }
    
    /**
     * Capture stack trace
     */
    captureStack() {
        const stack = new Error().stack;
        const lines = stack.split('\n').slice(3); // Remove internal frames
        return lines.join('\n');
    }
    
    /**
     * Create debug session
     */
    createDebugSession(ws, req) {
        const sessionId = `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        const session = {
            id: sessionId,
            ws,
            platform: this.pal.getPlatform(),
            connectedAt: Date.now(),
            remoteAddress: req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            language: this.languageProcessor.detectLanguage(req.headers['accept-language'] || 'en')
        };
        
        this.debugSessions.set(sessionId, session);
        
        return sessionId;
    }
    
    /**
     * Close debug session
     */
    closeDebugSession(sessionId) {
        this.debugSessions.delete(sessionId);
    }
    
    /**
     * Handle debug message from client
     */
    async handleDebugMessage(sessionId, message) {
        try {
            const data = JSON.parse(message);
            const session = this.debugSessions.get(sessionId);
            
            if (!session) return;
            
            switch (data.type) {
                case 'command':
                    await this.executeCommand(session, data.command);
                    break;
                    
                case 'evaluate':
                    await this.evaluateExpression(session, data.expression);
                    break;
                    
                case 'breakpoint':
                    this.handleBreakpoint(session, data);
                    break;
                    
                case 'step':
                    this.handleStep(session, data.action);
                    break;
                    
                case 'inspect':
                    await this.inspectObject(session, data.objectId);
                    break;
            }
        } catch (error) {
            console.error('Error handling debug message:', error);
        }
    }
    
    /**
     * Execute debug command
     */
    async executeCommand(session, command) {
        console.log(`Executing command: ${command}`);
        
        // Parse command
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        switch (cmd) {
            case 'help':
                this.sendHelp(session);
                break;
                
            case 'clear':
                session.ws.send(JSON.stringify({ type: 'clear' }));
                break;
                
            case 'logs':
                const logs = this.getLogs(parseInt(args[0]) || 50);
                session.ws.send(JSON.stringify({ type: 'logs', logs }));
                break;
                
            case 'metrics':
                const metrics = this.getPerformanceMetrics();
                session.ws.send(JSON.stringify({ type: 'metrics', metrics }));
                break;
                
            case 'errors':
                const errors = await this.metaLearning.getHealthReport();
                session.ws.send(JSON.stringify({ type: 'errors', errors }));
                break;
                
            case 'platform':
                session.ws.send(JSON.stringify({ 
                    type: 'platform', 
                    platform: this.pal.getPlatform() 
                }));
                break;
                
            case 'language':
                if (args[0]) {
                    const detection = await this.languageProcessor.detectLanguage(args.join(' '));
                    session.ws.send(JSON.stringify({ 
                        type: 'language', 
                        detection 
                    }));
                }
                break;
                
            default:
                // Try to evaluate as expression
                await this.evaluateExpression(session, command);
        }
    }
    
    /**
     * Send help information
     */
    sendHelp(session) {
        const help = `
Available commands:
  help          - Show this help
  clear         - Clear console
  logs [n]      - Show last n log entries
  metrics       - Show performance metrics
  errors        - Show error patterns
  platform      - Show platform information
  language TEXT - Detect language of text
  
Debug actions:
  Click on line numbers to set breakpoints
  Use watch panel to monitor expressions
  Network tab shows all requests
  Metrics tab shows real-time performance
        `;
        
        session.ws.send(JSON.stringify({
            type: 'log',
            entry: {
                level: 'info',
                message: help,
                timestamp: Date.now()
            }
        }));
    }
    
    /**
     * Evaluate expression
     */
    async evaluateExpression(session, expression) {
        try {
            // Safe evaluation context
            const result = await this.safeEval(expression);
            
            session.ws.send(JSON.stringify({
                type: 'result',
                expression,
                result: this.stringifyArg(result)
            }));
        } catch (error) {
            session.ws.send(JSON.stringify({
                type: 'error',
                error: {
                    message: error.message,
                    stack: error.stack
                }
            }));
        }
    }
    
    /**
     * Safe expression evaluation
     */
    async safeEval(expression) {
        // Create sandboxed context
        const context = {
            console,
            Math,
            Date,
            JSON,
            platform: this.pal.getPlatform(),
            metrics: this.getPerformanceMetrics()
        };
        
        // Use Function constructor for safer eval
        const fn = new Function(...Object.keys(context), `return ${expression}`);
        return fn(...Object.values(context));
    }
    
    /**
     * Add breakpoint
     */
    addBreakpoint(file, line, condition) {
        const id = `bp-${Date.now()}`;
        
        this.breakpoints.set(id, {
            id,
            file,
            line,
            condition,
            enabled: true,
            hitCount: 0
        });
        
        this.broadcast({
            type: 'breakpoint',
            action: 'added',
            breakpoint: this.breakpoints.get(id)
        });
        
        return id;
    }
    
    /**
     * Add watch expression
     */
    addWatchExpression(expression) {
        const id = `watch-${Date.now()}`;
        
        this.watchExpressions.set(id, {
            id,
            expression,
            value: null,
            error: null
        });
        
        // Evaluate immediately
        this.evaluateWatchExpression(id);
        
        return id;
    }
    
    /**
     * Evaluate watch expression
     */
    async evaluateWatchExpression(id) {
        const watch = this.watchExpressions.get(id);
        if (!watch) return;
        
        try {
            watch.value = await this.safeEval(watch.expression);
            watch.error = null;
        } catch (error) {
            watch.value = null;
            watch.error = error.message;
        }
        
        this.broadcast({
            type: 'watch',
            watch
        });
    }
    
    /**
     * Get debug status
     */
    getDebugStatus() {
        return {
            platform: this.pal.getPlatform(),
            sessions: this.debugSessions.size,
            breakpoints: this.breakpoints.size,
            watches: this.watchExpressions.size,
            logEntries: this.logBuffer.length,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            adapters: this.getAvailableAdapters()
        };
    }
    
    /**
     * Get logs
     */
    getLogs(limit = 100, level = 'all') {
        let logs = this.logBuffer;
        
        if (level !== 'all') {
            logs = logs.filter(log => log.level === level);
        }
        
        return logs.slice(-limit);
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        const memory = process.memoryUsage();
        
        return {
            memoryUsage: Math.round(memory.heapUsed / 1048576), // MB
            cpuUsage: Math.round(process.cpuUsage().user / 1000), // %
            connections: this.debugSessions.size,
            responseTime: Math.round(Math.random() * 100), // Mock for demo
            uptime: Math.round(process.uptime()),
            platform: this.pal.getPlatform().name
        };
    }
    
    /**
     * Get available debug adapters
     */
    getAvailableAdapters() {
        const platform = this.pal.getPlatform();
        const available = [];
        
        for (const [name, adapter] of this.debugAdapters) {
            if (adapter.supported.includes(platform.name) || 
                adapter.supported.includes(platform.environment)) {
                available.push({
                    name: adapter.name,
                    id: name,
                    connected: false // Would check actual connection
                });
            }
        }
        
        return available;
    }
    
    /**
     * Broadcast to all connected clients
     */
    broadcast(data) {
        const message = JSON.stringify(data);
        
        for (const session of this.debugSessions.values()) {
            if (session.ws.readyState === WebSocket.OPEN) {
                session.ws.send(message);
            }
        }
    }
    
    /**
     * Platform-specific adapter connections
     */
    
    async connectChromeDevTools() {
        // Would implement Chrome DevTools Protocol connection
        console.log('Connecting to Chrome DevTools...');
    }
    
    async connectSafariInspector() {
        // Would implement Safari Web Inspector connection
        console.log('Connecting to Safari Web Inspector...');
    }
    
    async connectADB() {
        // Would implement Android Debug Bridge connection
        console.log('Connecting to Android Debug Bridge...');
    }
    
    async connectIOSConsole() {
        // Would implement iOS Device Console connection
        console.log('Connecting to iOS Device Console...');
    }
    
    async connectNodeInspector() {
        // Enable Node.js inspector
        const inspector = require('inspector');
        inspector.open(9229, 'localhost', true);
        console.log('Node.js Inspector enabled on port 9229');
    }
}

// Export for use
module.exports = UniversalDebugInterface;

// Run if executed directly
if (require.main === module) {
    const debugInterface = new UniversalDebugInterface({
        port: 9999,
        wsPort: 9998,
        enableRemoteDebug: true
    });
    
    // Add some test logs
    setTimeout(() => {
        console.log('Debug interface is running');
        console.info('This is an info message');
        console.warn('This is a warning');
        console.error('This is an error message');
        
        // Test error capture
        setTimeout(() => {
            try {
                throw new Error('Test error for meta-learning');
            } catch (error) {
                console.error(error);
            }
        }, 2000);
    }, 1000);
}