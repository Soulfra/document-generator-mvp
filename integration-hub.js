#!/usr/bin/env node

/**
 * Integration Hub
 * 
 * Central coordination system that connects all AI automation tools
 * and provides a unified interface for complex development workflows.
 */

const { EventEmitter } = require('events');
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');

// Import all automation systems
const AIGitOrchestrator = require('./ai-git-orchestrator');
const CodeTransformerPipeline = require('./code-transformer-pipeline');
const { MultiAgentDevSystem } = require('./multi-agent-dev-system');
const SmartTaggingSystem = require('./smart-tagging-system');
const WorkflowOrchestrator = require('./workflow-orchestrator');

class IntegrationHub extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 8888,
            workingDir: config.workingDir || process.cwd(),
            enableWebUI: config.enableWebUI !== false,
            enableAPI: config.enableAPI !== false,
            enableWebSocket: config.enableWebSocket !== false,
            maxConcurrentWorkflows: config.maxConcurrentWorkflows || 5,
            ...config
        };
        
        // Initialize subsystems
        this.subsystems = {
            git: new AIGitOrchestrator({
                workingDir: this.config.workingDir
            }),
            transformer: new CodeTransformerPipeline(),
            agents: new MultiAgentDevSystem({
                worktreeBase: path.join(this.config.workingDir, 'worktrees')
            }),
            tagging: new SmartTaggingSystem({
                workingDir: this.config.workingDir
            }),
            workflows: new WorkflowOrchestrator({
                workingDir: this.config.workingDir
            })
        };
        
        // State management
        this.state = {
            status: 'initializing',
            activeWorkflows: new Map(),
            queuedTasks: [],
            metrics: {
                totalWorkflows: 0,
                successfulWorkflows: 0,
                failedWorkflows: 0,
                totalCommits: 0,
                totalTransformations: 0,
                agentTasks: 0
            },
            connections: new Set()
        };
        
        // Event aggregation
        this.setupEventAggregation();
    }
    
    /**
     * Initialize the integration hub
     */
    async initialize() {
        console.log('🌐 Initializing Integration Hub...');
        
        try {
            // Initialize subsystems
            await this.initializeSubsystems();
            
            // Setup API server
            if (this.config.enableAPI || this.config.enableWebUI) {
                await this.setupServer();
            }
            
            // Start task processor
            this.startTaskProcessor();
            
            this.state.status = 'ready';
            console.log('✅ Integration Hub ready!');
            console.log(`📡 API: http://localhost:${this.config.port}`);
            console.log(`🌐 WebUI: http://localhost:${this.config.port}/dashboard`);
            
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Integration Hub:', error);
            this.state.status = 'error';
            throw error;
        }
    }
    
    /**
     * Initialize all subsystems
     */
    async initializeSubsystems() {
        const initTasks = [
            { name: 'Git Orchestrator', system: this.subsystems.git },
            { name: 'Multi-Agent System', system: this.subsystems.agents },
        ];
        
        for (const { name, system } of initTasks) {
            if (system.initialize) {
                console.log(`  🔧 Initializing ${name}...`);
                await system.initialize();
            }
        }
    }
    
    /**
     * Setup event aggregation
     */
    setupEventAggregation() {
        // Git events
        this.subsystems.git.on('fileChanged', (data) => {
            this.broadcast({ type: 'git:fileChanged', data });
        });
        
        this.subsystems.git.on('committed', (data) => {
            this.state.metrics.totalCommits++;
            this.broadcast({ type: 'git:committed', data });
        });
        
        // Transformer events
        this.subsystems.transformer.on('fileTransformed', (data) => {
            this.state.metrics.totalTransformations++;
            this.broadcast({ type: 'transformer:fileTransformed', data });
        });
        
        // Agent events
        this.subsystems.agents.on('taskCompleted', (data) => {
            this.state.metrics.agentTasks++;
            this.broadcast({ type: 'agents:taskCompleted', data });
        });
        
        // Workflow events
        this.subsystems.workflows.on('workflowStarted', (data) => {
            this.state.metrics.totalWorkflows++;
            this.broadcast({ type: 'workflow:started', data });
        });
        
        this.subsystems.workflows.on('workflowCompleted', (data) => {
            this.state.metrics.successfulWorkflows++;
            this.broadcast({ type: 'workflow:completed', data });
        });
        
        this.subsystems.workflows.on('workflowFailed', (data) => {
            this.state.metrics.failedWorkflows++;
            this.broadcast({ type: 'workflow:failed', data });
        });
    }
    
    /**
     * Setup HTTP/WebSocket server
     */
    async setupServer() {
        const app = express();
        app.use(express.json());
        app.use(express.static(path.join(__dirname, 'public')));
        
        // API Routes
        this.setupAPIRoutes(app);
        
        // Create HTTP server
        const server = http.createServer(app);
        
        // Setup WebSocket
        if (this.config.enableWebSocket) {
            this.wss = new WebSocket.Server({ server });
            this.setupWebSocket();
        }
        
        // Start server
        await new Promise((resolve) => {
            server.listen(this.config.port, () => {
                resolve();
            });
        });
    }
    
    /**
     * Setup API routes
     */
    setupAPIRoutes(app) {
        // Status endpoint
        app.get('/api/status', (req, res) => {
            res.json({
                status: this.state.status,
                metrics: this.state.metrics,
                activeWorkflows: this.state.activeWorkflows.size,
                queuedTasks: this.state.queuedTasks.length,
                subsystems: this.getSubsystemStatus()
            });
        });
        
        // Workflow endpoints
        app.get('/api/workflows/templates', async (req, res) => {
            try {
                const templates = await this.subsystems.workflows.listTemplates();
                res.json(templates);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        app.post('/api/workflows/execute', async (req, res) => {
            try {
                const { template, inputs } = req.body;
                const workflowId = await this.executeWorkflow(template, inputs);
                res.json({ workflowId, status: 'queued' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        app.get('/api/workflows/:id', (req, res) => {
            const workflow = this.state.activeWorkflows.get(req.params.id);
            if (!workflow) {
                res.status(404).json({ error: 'Workflow not found' });
            } else {
                res.json(workflow);
            }
        });
        
        // Task endpoints
        app.post('/api/tasks/transform', async (req, res) => {
            try {
                const { files, transformations } = req.body;
                const taskId = await this.queueTransformation(files, transformations);
                res.json({ taskId, status: 'queued' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        app.post('/api/tasks/agent', async (req, res) => {
            try {
                const { task } = req.body;
                this.subsystems.agents.queueTask(task);
                res.json({ status: 'queued' });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Analysis endpoints
        app.get('/api/analysis/repository', async (req, res) => {
            try {
                const analysis = await this.subsystems.tagging.analyzeRepository();
                res.json(analysis);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Dashboard UI
        app.get('/dashboard', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
    }
    
    /**
     * Setup WebSocket connections
     */
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🔌 New WebSocket connection');
            this.state.connections.add(ws);
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'connected',
                state: {
                    status: this.state.status,
                    metrics: this.state.metrics
                }
            }));
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: error.message
                    }));
                }
            });
            
            ws.on('close', () => {
                this.state.connections.delete(ws);
            });
        });
    }
    
    /**
     * Handle WebSocket messages
     */
    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'subscribe':
                // Client wants to subscribe to specific events
                ws.subscriptions = data.events || ['all'];
                break;
                
            case 'executeWorkflow':
                const workflowId = await this.executeWorkflow(data.template, data.inputs);
                ws.send(JSON.stringify({
                    type: 'workflowQueued',
                    workflowId
                }));
                break;
                
            case 'getStatus':
                ws.send(JSON.stringify({
                    type: 'status',
                    data: {
                        status: this.state.status,
                        metrics: this.state.metrics
                    }
                }));
                break;
        }
    }
    
    /**
     * Execute a workflow
     */
    async executeWorkflow(template, inputs) {
        const workflowId = `${template}-${Date.now()}`;
        
        this.state.queuedTasks.push({
            id: workflowId,
            type: 'workflow',
            template,
            inputs,
            status: 'queued',
            queuedAt: Date.now()
        });
        
        return workflowId;
    }
    
    /**
     * Queue a transformation task
     */
    async queueTransformation(files, transformations) {
        const taskId = `transform-${Date.now()}`;
        
        this.state.queuedTasks.push({
            id: taskId,
            type: 'transformation',
            files,
            transformations,
            status: 'queued',
            queuedAt: Date.now()
        });
        
        return taskId;
    }
    
    /**
     * Process queued tasks
     */
    async processQueuedTasks() {
        if (this.state.queuedTasks.length === 0) return;
        
        // Check concurrent workflow limit
        const activeWorkflowCount = Array.from(this.state.activeWorkflows.values())
            .filter(w => w.status === 'running').length;
        
        if (activeWorkflowCount >= this.config.maxConcurrentWorkflows) return;
        
        const task = this.state.queuedTasks.shift();
        
        try {
            switch (task.type) {
                case 'workflow':
                    await this.processWorkflowTask(task);
                    break;
                    
                case 'transformation':
                    await this.processTransformationTask(task);
                    break;
            }
        } catch (error) {
            console.error(`❌ Task ${task.id} failed:`, error);
            this.broadcast({
                type: 'task:failed',
                data: { taskId: task.id, error: error.message }
            });
        }
    }
    
    /**
     * Process workflow task
     */
    async processWorkflowTask(task) {
        this.state.activeWorkflows.set(task.id, {
            ...task,
            status: 'running',
            startedAt: Date.now()
        });
        
        try {
            const result = await this.subsystems.workflows.executeWorkflow(
                task.template,
                task.inputs
            );
            
            this.state.activeWorkflows.set(task.id, {
                ...task,
                status: 'completed',
                result,
                completedAt: Date.now()
            });
            
        } catch (error) {
            this.state.activeWorkflows.set(task.id, {
                ...task,
                status: 'failed',
                error: error.message,
                failedAt: Date.now()
            });
            throw error;
        }
    }
    
    /**
     * Process transformation task
     */
    async processTransformationTask(task) {
        const results = await this.subsystems.transformer.transformFiles(
            task.files,
            { transformations: task.transformations }
        );
        
        this.broadcast({
            type: 'transformation:completed',
            data: { taskId: task.id, results }
        });
    }
    
    /**
     * Start task processor
     */
    startTaskProcessor() {
        setInterval(() => {
            this.processQueuedTasks();
        }, 1000);
    }
    
    /**
     * Broadcast event to all WebSocket connections
     */
    broadcast(message) {
        const data = JSON.stringify(message);
        
        for (const ws of this.state.connections) {
            if (ws.readyState === WebSocket.OPEN) {
                // Check if client is subscribed to this event type
                if (!ws.subscriptions || 
                    ws.subscriptions.includes('all') || 
                    ws.subscriptions.includes(message.type)) {
                    ws.send(data);
                }
            }
        }
        
        this.emit('broadcast', message);
    }
    
    /**
     * Get subsystem status
     */
    getSubsystemStatus() {
        return {
            git: {
                pendingChanges: this.subsystems.git.pendingChanges.size,
                currentBranch: this.subsystems.git.currentContext.branch
            },
            transformer: {
                activeTransforms: this.subsystems.transformer.activeTransforms.size
            },
            agents: {
                activeAgents: this.subsystems.agents.agents.size,
                taskQueue: this.subsystems.agents.taskQueue.length
            },
            tagging: {
                currentVersion: this.subsystems.tagging.currentVersion
            }
        };
    }
    
    /**
     * Generate dashboard HTML
     */
    generateDashboardHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Integration Hub Dashboard</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        
        h1 {
            font-size: 2.5em;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        
        .status-bar {
            display: flex;
            gap: 20px;
            margin-top: 20px;
        }
        
        .status-item {
            padding: 10px 20px;
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-ready { background: #4CAF50; }
        .status-busy { background: #FF9800; }
        .status-error { background: #f44336; }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: #1a1a2e;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            border: 1px solid rgba(102, 126, 234, 0.1);
        }
        
        .card h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.3em;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .metric:last-child {
            border-bottom: none;
        }
        
        .metric-value {
            font-weight: bold;
            color: #667eea;
            font-size: 1.2em;
        }
        
        .workflow-list {
            max-height: 400px;
            overflow-y: auto;
        }
        
        .workflow-item {
            padding: 15px;
            margin-bottom: 10px;
            background: rgba(255,255,255,0.03);
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.05);
            transition: all 0.3s ease;
        }
        
        .workflow-item:hover {
            background: rgba(102, 126, 234, 0.1);
            border-color: rgba(102, 126, 234, 0.3);
        }
        
        .workflow-running {
            border-color: #FF9800;
            animation: pulse 2s infinite;
        }
        
        .workflow-completed {
            border-color: #4CAF50;
        }
        
        .workflow-failed {
            border-color: #f44336;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
        
        .controls {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
        }
        
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
            transition: all 0.3s ease;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        }
        
        button:active {
            transform: translateY(0);
        }
        
        .log-viewer {
            background: #0a0a0a;
            border-radius: 8px;
            padding: 20px;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.9em;
            max-height: 400px;
            overflow-y: auto;
            border: 1px solid #1a1a2e;
        }
        
        .log-entry {
            padding: 5px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .log-timestamp {
            color: #666;
            margin-right: 10px;
        }
        
        .log-info { color: #4CAF50; }
        .log-warn { color: #FF9800; }
        .log-error { color: #f44336; }
        
        .connection-status {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #1a1a2e;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🌐 Integration Hub</h1>
            <p>AI-Powered Development Automation Platform</p>
            <div class="status-bar">
                <div class="status-item">
                    <span class="status-indicator status-ready"></span>
                    <span id="status">Connecting...</span>
                </div>
                <div class="status-item">
                    <span id="activeWorkflows">0</span> Active Workflows
                </div>
                <div class="status-item">
                    <span id="queuedTasks">0</span> Queued Tasks
                </div>
            </div>
        </header>
        
        <div class="controls">
            <button onclick="showWorkflowTemplates()">📋 New Workflow</button>
            <button onclick="transformFiles()">🔄 Transform Code</button>
            <button onclick="createAgent()">🤖 Create Agent</button>
            <button onclick="analyzeRepository()">📊 Analyze Repo</button>
        </div>
        
        <div class="grid">
            <div class="card">
                <h2>📊 System Metrics</h2>
                <div class="metric">
                    <span>Total Workflows</span>
                    <span class="metric-value" id="totalWorkflows">0</span>
                </div>
                <div class="metric">
                    <span>Success Rate</span>
                    <span class="metric-value" id="successRate">0%</span>
                </div>
                <div class="metric">
                    <span>Total Commits</span>
                    <span class="metric-value" id="totalCommits">0</span>
                </div>
                <div class="metric">
                    <span>Code Transformations</span>
                    <span class="metric-value" id="totalTransformations">0</span>
                </div>
                <div class="metric">
                    <span>Agent Tasks</span>
                    <span class="metric-value" id="agentTasks">0</span>
                </div>
            </div>
            
            <div class="card">
                <h2>🔄 Active Workflows</h2>
                <div class="workflow-list" id="workflowList">
                    <p style="color: #666;">No active workflows</p>
                </div>
            </div>
            
            <div class="card">
                <h2>🤖 Agent Status</h2>
                <div id="agentStatus">
                    <div class="metric">
                        <span>Active Agents</span>
                        <span class="metric-value" id="activeAgents">0</span>
                    </div>
                    <div class="metric">
                        <span>Task Queue</span>
                        <span class="metric-value" id="agentQueue">0</span>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h2>🌿 Git Status</h2>
                <div id="gitStatus">
                    <div class="metric">
                        <span>Current Branch</span>
                        <span class="metric-value" id="currentBranch">main</span>
                    </div>
                    <div class="metric">
                        <span>Pending Changes</span>
                        <span class="metric-value" id="pendingChanges">0</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2>📜 Activity Log</h2>
            <div class="log-viewer" id="logViewer">
                <div class="log-entry">
                    <span class="log-timestamp">${new Date().toLocaleTimeString()}</span>
                    <span class="log-info">System initializing...</span>
                </div>
            </div>
        </div>
    </div>
    
    <div class="connection-status" id="connectionStatus">
        <span class="status-indicator status-error"></span>
        <span>Disconnected</span>
    </div>
    
    <script>
        const ws = new WebSocket(\`ws://localhost:${this.config.port}\`);
        const logViewer = document.getElementById('logViewer');
        
        function addLog(message, type = 'info') {
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.innerHTML = \`
                <span class="log-timestamp">\${new Date().toLocaleTimeString()}</span>
                <span class="log-\${type}">\${message}</span>
            \`;
            logViewer.appendChild(entry);
            logViewer.scrollTop = logViewer.scrollHeight;
            
            // Keep only last 100 entries
            while (logViewer.children.length > 100) {
                logViewer.removeChild(logViewer.firstChild);
            }
        }
        
        ws.onopen = () => {
            document.getElementById('status').textContent = 'Connected';
            document.getElementById('connectionStatus').innerHTML = \`
                <span class="status-indicator status-ready"></span>
                <span>Connected</span>
            \`;
            addLog('Connected to Integration Hub', 'info');
            
            // Subscribe to all events
            ws.send(JSON.stringify({ type: 'subscribe', events: ['all'] }));
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'connected':
                    updateMetrics(data.state.metrics);
                    break;
                    
                case 'status':
                    updateMetrics(data.data.metrics);
                    break;
                    
                case 'git:committed':
                    addLog(\`Committed: \${data.data.message}\`, 'info');
                    break;
                    
                case 'workflow:started':
                    addLog(\`Workflow started: \${data.data.id}\`, 'info');
                    addWorkflow(data.data);
                    break;
                    
                case 'workflow:completed':
                    addLog(\`Workflow completed: \${data.data.id}\`, 'info');
                    updateWorkflow(data.data.id, 'completed');
                    break;
                    
                case 'workflow:failed':
                    addLog(\`Workflow failed: \${data.data.id}\`, 'error');
                    updateWorkflow(data.data.id, 'failed');
                    break;
                    
                case 'agents:taskCompleted':
                    addLog(\`Agent task completed: \${data.data.task.description}\`, 'info');
                    break;
                    
                case 'transformer:fileTransformed':
                    addLog(\`File transformed: \${data.data.file}\`, 'info');
                    break;
            }
            
            // Request status update
            ws.send(JSON.stringify({ type: 'getStatus' }));
        };
        
        ws.onclose = () => {
            document.getElementById('status').textContent = 'Disconnected';
            document.getElementById('connectionStatus').innerHTML = \`
                <span class="status-indicator status-error"></span>
                <span>Disconnected</span>
            \`;
            addLog('Disconnected from Integration Hub', 'error');
        };
        
        function updateMetrics(metrics) {
            document.getElementById('totalWorkflows').textContent = metrics.totalWorkflows;
            document.getElementById('totalCommits').textContent = metrics.totalCommits;
            document.getElementById('totalTransformations').textContent = metrics.totalTransformations;
            document.getElementById('agentTasks').textContent = metrics.agentTasks;
            
            const successRate = metrics.totalWorkflows > 0 
                ? Math.round((metrics.successfulWorkflows / metrics.totalWorkflows) * 100)
                : 0;
            document.getElementById('successRate').textContent = successRate + '%';
        }
        
        function addWorkflow(workflow) {
            const list = document.getElementById('workflowList');
            if (list.querySelector('p')) {
                list.innerHTML = '';
            }
            
            const item = document.createElement('div');
            item.className = 'workflow-item workflow-running';
            item.id = 'workflow-' + workflow.id;
            item.innerHTML = \`
                <strong>\${workflow.template.name}</strong>
                <br>
                <small>ID: \${workflow.id}</small>
                <br>
                <small>Status: Running...</small>
            \`;
            list.appendChild(item);
        }
        
        function updateWorkflow(workflowId, status) {
            const item = document.getElementById('workflow-' + workflowId);
            if (item) {
                item.className = \`workflow-item workflow-\${status}\`;
                item.querySelector('small:last-child').textContent = \`Status: \${status}\`;
            }
        }
        
        async function showWorkflowTemplates() {
            try {
                const response = await fetch('/api/workflows/templates');
                const templates = await response.json();
                
                const template = prompt(
                    'Available templates:\\n' + 
                    templates.map(t => \`- \${t.name}: \${t.description}\`).join('\\n') + 
                    '\\n\\nEnter template name:'
                );
                
                if (template) {
                    const inputs = prompt('Enter inputs as JSON (e.g., {"feature_name": "auth"}):');
                    if (inputs) {
                        ws.send(JSON.stringify({
                            type: 'executeWorkflow',
                            template,
                            inputs: JSON.parse(inputs)
                        }));
                    }
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        function transformFiles() {
            const files = prompt('Enter files to transform (comma-separated):');
            if (files) {
                fetch('/api/tasks/transform', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        files: files.split(',').map(f => f.trim()),
                        transformations: ['improve-naming', 'add-jsdoc', 'optimize-logic']
                    })
                }).then(() => addLog('Transformation task queued', 'info'));
            }
        }
        
        function createAgent() {
            const task = prompt('Enter task description:');
            if (task) {
                fetch('/api/tasks/agent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        task: {
                            description: task,
                            priority: 'medium'
                        }
                    })
                }).then(() => addLog('Agent task queued', 'info'));
            }
        }
        
        async function analyzeRepository() {
            addLog('Analyzing repository...', 'info');
            try {
                const response = await fetch('/api/analysis/repository');
                const analysis = await response.json();
                
                addLog(\`Analysis complete: v\${analysis.currentVersion} → v\${analysis.newVersion}\`, 'info');
                addLog(\`Changes: \${analysis.commits} commits, \${analysis.changes.breaking.length} breaking\`, 'info');
            } catch (error) {
                addLog('Analysis failed: ' + error.message, 'error');
            }
        }
        
        // Auto-refresh status every 5 seconds
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'getStatus' }));
            }
        }, 5000);
    </script>
</body>
</html>`;
    }
}

// CLI interface
if (require.main === module) {
    const hub = new IntegrationHub({
        port: process.argv.includes('--port') 
            ? parseInt(process.argv[process.argv.indexOf('--port') + 1])
            : 8888
    });
    
    hub.initialize().catch(error => {
        console.error('Failed to start Integration Hub:', error);
        process.exit(1);
    });
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down Integration Hub...');
        
        // Cleanup subsystems
        if (hub.subsystems.git.shutdown) {
            await hub.subsystems.git.shutdown();
        }
        if (hub.subsystems.agents.shutdown) {
            await hub.subsystems.agents.shutdown();
        }
        
        process.exit(0);
    });
}

module.exports = IntegrationHub;