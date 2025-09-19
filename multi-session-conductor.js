#!/usr/bin/env node

/**
 * Multi-Session Conductor
 * 
 * Orchestrates communication and coordination between all CAL tmux sessions.
 * Acts as the central nervous system for the distributed creative workspace.
 * 
 * Sessions Managed:
 * - CAL-CORE: Brain operations (Master orchestrator, knowledge processing)
 * - CAL-PRODUCTION: Package creation and deployment
 * - CAL-CREATIVE: Creative workspace and file monitoring
 * - CAL-AUTH: Smart authentication and approval workflows  
 * - CAL-HUB: Service discovery and system monitoring
 * 
 * Features:
 * - Inter-session message routing
 * - Session health monitoring  
 * - Workflow coordination
 * - Unified control interface
 * - Real-time status dashboard
 * - Cross-session data synchronization
 */

const http = require('http');
const WebSocket = require('ws');
const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class MultiSessionConductor {
    constructor() {
        this.config = {
            // Conductor settings
            conductorPort: 7777,
            wsPort: 7778,
            
            // Session definitions
            sessions: {
                'CAL-CORE': {
                    name: 'CAL-CORE',
                    description: 'Brain operations',
                    services: [
                        { name: 'Master Orchestrator', port: 3336 },
                        { name: 'Vault Reader', port: 3337 },
                        { name: 'Knowledge Processor', port: 3338 },
                        { name: 'Decision Engine', port: 3339 }
                    ],
                    healthCheck: 'curl -f http://localhost:3336/health',
                    priority: 1
                },
                'CAL-PRODUCTION': {
                    name: 'CAL-PRODUCTION',
                    description: 'Package creation and deployment',
                    services: [
                        { name: 'Component Packager', port: 3340 },
                        { name: 'Deployment Manager', port: 3341 },
                        { name: 'Package Monitor', port: 3342 }
                    ],
                    healthCheck: 'ls -la ./generated-packages/',
                    priority: 2
                },
                'CAL-CREATIVE': {
                    name: 'CAL-CREATIVE',
                    description: 'Creative workspace',
                    services: [
                        { name: 'Creative Bridge', port: 8083 },
                        { name: 'Obsidian Sync', port: 8084 },
                        { name: 'File Watcher', port: 8085 }
                    ],
                    healthCheck: 'curl -f http://localhost:8083/health',
                    priority: 3
                },
                'CAL-AUTH': {
                    name: 'CAL-AUTH',
                    description: 'Smart authentication gateway',
                    services: [
                        { name: 'Auth Gateway', port: 9998 },
                        { name: 'Approval Workflow', port: 9999 }
                    ],
                    healthCheck: 'curl -f http://localhost:9998/health',
                    priority: 2
                },
                'CAL-HUB': {
                    name: 'CAL-HUB',
                    description: 'Service discovery and monitoring',
                    services: [
                        { name: 'Service Discovery', port: 7779 },
                        { name: 'System Monitor', port: 7780 }
                    ],
                    healthCheck: 'echo "Hub health check"',
                    priority: 3
                }
            },
            
            // Message routing rules
            routingRules: {
                'build-request': ['CAL-CORE', 'CAL-AUTH', 'CAL-PRODUCTION'],
                'component-ready': ['CAL-PRODUCTION', 'CAL-HUB'],
                'auth-decision': ['CAL-AUTH', 'CAL-CORE'],
                'creative-work': ['CAL-CREATIVE', 'CAL-AUTH'],
                'system-status': ['CAL-HUB'],
                'error-alert': ['CAL-HUB', 'CAL-CORE']
            },
            
            // Monitoring settings
            healthCheckInterval: 30000, // 30 seconds
            messageTimeout: 10000,      // 10 seconds
            maxRetries: 3
        };
        
        this.sessionStates = new Map();
        this.messageQueue = [];
        this.wsClients = [];
        this.isRunning = false;
        this.messageHandlers = new Map();
        this.workflowStates = new Map();
        
        this.initializeSessionStates();
        this.setupWebSocketServer();
        this.setupMessageHandlers();
    }
    
    async start() {
        console.log('🎼 MULTI-SESSION CONDUCTOR STARTING');
        console.log('===================================');
        console.log('');
        console.log('🎯 Managing Sessions:');
        Object.entries(this.config.sessions).forEach(([name, config]) => {
            console.log(`   ${name}: ${config.description}`);
        });
        console.log('');
        console.log(`🌐 Conductor Port: ${this.config.conductorPort}`);
        console.log(`📡 WebSocket Port: ${this.config.wsPort}`);
        console.log('');
        
        this.isRunning = true;
        
        // Start HTTP server for conductor API
        this.startConductorServer();
        
        // Start session monitoring
        this.startSessionMonitoring();
        
        // Start message processing loop
        this.startMessageProcessing();
        
        // Initial session discovery
        await this.discoverSessions();
        
        console.log('✅ Multi-Session Conductor ready!');
        console.log('');
        console.log('🎼 Orchestrating distributed creative workspace...');
        console.log('');
    }
    
    initializeSessionStates() {
        for (const [sessionName, sessionConfig] of Object.entries(this.config.sessions)) {
            this.sessionStates.set(sessionName, {
                name: sessionName,
                config: sessionConfig,
                isActive: false,
                lastSeen: null,
                services: new Map(),
                messageQueue: [],
                health: 'unknown',
                metadata: {}
            });
        }
    }
    
    setupWebSocketServer() {
        const wsServer = http.createServer();
        this.wss = new WebSocket.Server({ server: wsServer });
        
        this.wss.on('connection', (ws, req) => {
            const url = require('url');
            const query = url.parse(req.url, true).query;
            const sessionId = query.sessionId || 'conductor-client';
            
            console.log(`🔌 WebSocket connection from: ${sessionId}`);
            
            ws.sessionId = sessionId;
            this.wsClients.push(ws);
            
            // Send current system state
            ws.send(JSON.stringify({
                type: 'system-state',
                data: this.getSystemState()
            }));
            
            ws.on('message', (message) => {
                this.handleWebSocketMessage(ws, JSON.parse(message));
            });
            
            ws.on('close', () => {
                this.wsClients = this.wsClients.filter(client => client !== ws);
                console.log(`🔌 WebSocket disconnected: ${sessionId}`);
            });
        });
        
        wsServer.listen(this.config.wsPort, () => {
            console.log(`🌐 WebSocket server listening on port ${this.config.wsPort}`);
        });
    }
    
    setupMessageHandlers() {
        this.messageHandlers.set('build-request', this.handleBuildRequest.bind(this));
        this.messageHandlers.set('component-ready', this.handleComponentReady.bind(this));
        this.messageHandlers.set('auth-decision', this.handleAuthDecision.bind(this));
        this.messageHandlers.set('creative-work', this.handleCreativeWork.bind(this));
        this.messageHandlers.set('system-status', this.handleSystemStatus.bind(this));
        this.messageHandlers.set('error-alert', this.handleErrorAlert.bind(this));
    }
    
    startConductorServer() {
        this.server = http.createServer((req, res) => this.handleConductorRequest(req, res));
        
        this.server.listen(this.config.conductorPort, () => {
            console.log(`🎼 Conductor server listening on port ${this.config.conductorPort}`);
        });
    }
    
    async handleConductorRequest(req, res) {
        const url = require('url');
        const parsedUrl = url.parse(req.url, true);
        const path = parsedUrl.pathname;
        
        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        console.log(`🎼 Conductor API: ${req.method} ${path}`);
        
        try {
            if (path === '/api/sessions') {
                await this.handleSessionsRequest(req, res);
            } else if (path === '/api/sessions/health') {
                await this.handleHealthRequest(req, res);
            } else if (path === '/api/messages/send') {
                await this.handleSendMessageRequest(req, res);
            } else if (path === '/api/workflows') {
                await this.handleWorkflowsRequest(req, res);
            } else if (path === '/api/system/restart') {
                await this.handleRestartRequest(req, res);
            } else if (path === '/dashboard') {
                await this.serveDashboard(res);
            } else if (path === '/health') {
                this.sendResponse(res, 200, { status: 'healthy', service: 'multi-session-conductor' });
            } else {
                this.sendResponse(res, 404, { error: 'Endpoint not found' });
            }
        } catch (error) {
            console.error('❌ Conductor API error:', error);
            this.sendResponse(res, 500, { error: 'Internal server error' });
        }
    }
    
    async discoverSessions() {
        console.log('🔍 Discovering tmux sessions...');
        
        return new Promise((resolve) => {
            exec('tmux list-sessions -F "#{session_name}"', (error, stdout, stderr) => {
                if (error) {
                    console.log('⚠️ No tmux sessions found or tmux not running');
                    resolve();
                    return;
                }
                
                const activeSessions = stdout.trim().split('\n').filter(Boolean);
                console.log(`📋 Found tmux sessions: ${activeSessions.join(', ')}`);
                
                // Update session states
                for (const sessionName of activeSessions) {
                    if (this.sessionStates.has(sessionName)) {
                        const state = this.sessionStates.get(sessionName);
                        state.isActive = true;
                        state.lastSeen = new Date();
                        console.log(`✅ Session ${sessionName} is active`);
                    }
                }
                
                resolve();
            });
        });
    }
    
    startSessionMonitoring() {
        console.log(`⏰ Starting session monitoring (every ${this.config.healthCheckInterval / 1000}s)`);
        
        setInterval(async () => {
            if (!this.isRunning) return;
            
            // Rediscover sessions
            await this.discoverSessions();
            
            // Health check active sessions
            for (const [sessionName, state] of this.sessionStates.entries()) {
                if (state.isActive) {
                    await this.checkSessionHealth(sessionName, state);
                }
            }
            
            // Broadcast system state update
            this.broadcastSystemState();
            
        }, this.config.healthCheckInterval);
    }
    
    async checkSessionHealth(sessionName, state) {
        try {
            const healthCommand = state.config.healthCheck;
            
            return new Promise((resolve) => {
                exec(healthCommand, { timeout: 5000 }, (error, stdout, stderr) => {
                    if (error) {
                        state.health = 'unhealthy';
                        console.log(`⚠️ ${sessionName} health check failed: ${error.message}`);
                    } else {
                        state.health = 'healthy';
                        state.lastHealthCheck = new Date();
                    }
                    
                    resolve();
                });
            });
            
        } catch (error) {
            state.health = 'error';
            console.error(`❌ Health check error for ${sessionName}: ${error.message}`);
        }
    }
    
    startMessageProcessing() {
        console.log('📨 Starting message processing loop...');
        
        setInterval(() => {
            this.processMessageQueue();
        }, 1000); // Process every second
    }
    
    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.routeMessage(message);
        }
    }
    
    async routeMessage(message) {
        console.log(`📨 Routing message: ${message.type} from ${message.source}`);
        
        const routingRule = this.config.routingRules[message.type];
        if (!routingRule) {
            console.log(`⚠️ No routing rule for message type: ${message.type}`);
            return;
        }
        
        // Route to specified sessions
        for (const sessionName of routingRule) {
            const state = this.sessionStates.get(sessionName);
            
            if (state && state.isActive && state.health === 'healthy') {
                await this.sendMessageToSession(sessionName, message);
            } else {
                console.log(`⚠️ Cannot route to ${sessionName}: inactive or unhealthy`);
                // Queue message for later delivery
                if (state) {
                    state.messageQueue.push(message);
                }
            }
        }
        
        // Handle message with specific handler
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
            try {
                await handler(message);
            } catch (error) {
                console.error(`❌ Message handler error: ${error.message}`);
            }
        }
    }
    
    async sendMessageToSession(sessionName, message) {
        console.log(`📤 Sending message to ${sessionName}: ${message.type}`);
        
        // For now, we'll use HTTP to send messages to session services
        // In a production system, this could be Unix sockets, Redis, etc.
        
        const state = this.sessionStates.get(sessionName);
        const services = state.config.services;
        
        // Try to deliver to the first available service in the session
        for (const service of services) {
            try {
                await this.makeHTTPRequest({
                    method: 'POST',
                    hostname: 'localhost',
                    port: service.port,
                    path: '/api/conductor-message',
                    headers: { 'Content-Type': 'application/json' }
                }, JSON.stringify(message));
                
                console.log(`✅ Message delivered to ${sessionName}:${service.name}`);
                return;
                
            } catch (error) {
                console.log(`⚠️ Failed to deliver to ${service.name}: ${error.message}`);
                continue;
            }
        }
        
        console.log(`❌ Failed to deliver message to any service in ${sessionName}`);
    }
    
    // Message handlers
    async handleBuildRequest(message) {
        console.log(`🏗️ Processing build request: ${message.data?.name || 'unnamed'}`);
        
        // Create workflow state
        const workflowId = this.generateWorkflowId();
        this.workflowStates.set(workflowId, {
            id: workflowId,
            type: 'build',
            status: 'started',
            startedAt: new Date(),
            steps: [
                { name: 'auth-check', status: 'pending' },
                { name: 'component-analysis', status: 'pending' },
                { name: 'code-generation', status: 'pending' },
                { name: 'packaging', status: 'pending' },
                { name: 'deployment', status: 'pending' }
            ],
            message: message
        });
        
        console.log(`📊 Created workflow ${workflowId} for build request`);
        
        // Broadcast workflow start
        this.broadcastToClients({
            type: 'workflow-started',
            data: { workflowId, type: 'build' }
        });
    }
    
    async handleComponentReady(message) {
        console.log(`🧩 Component ready: ${message.data?.componentName}`);
        
        // Find related workflow
        for (const [workflowId, workflow] of this.workflowStates.entries()) {
            if (workflow.type === 'build' && workflow.status !== 'completed') {
                // Update workflow step
                const step = workflow.steps.find(s => s.name === 'packaging');
                if (step) {
                    step.status = 'completed';
                    step.completedAt = new Date();
                }
                
                // Check if workflow is complete
                const allCompleted = workflow.steps.every(s => s.status === 'completed');
                if (allCompleted) {
                    workflow.status = 'completed';
                    workflow.completedAt = new Date();
                    
                    this.broadcastToClients({
                        type: 'workflow-completed',
                        data: { workflowId, result: message.data }
                    });
                }
                
                break;
            }
        }
    }
    
    async handleAuthDecision(message) {
        console.log(`🔐 Auth decision: ${message.data?.decision} for ${message.data?.approvalId}`);
        
        // Update any related workflows
        for (const [workflowId, workflow] of this.workflowStates.entries()) {
            if (workflow.message?.data?.approvalId === message.data?.approvalId) {
                const step = workflow.steps.find(s => s.name === 'auth-check');
                if (step) {
                    step.status = message.data.decision === 'approved' ? 'completed' : 'failed';
                    step.completedAt = new Date();
                    step.result = message.data;
                }
                
                if (message.data.decision !== 'approved') {
                    workflow.status = 'failed';
                    workflow.failedAt = new Date();
                    workflow.failureReason = 'Authorization denied';
                }
                
                break;
            }
        }
    }
    
    async handleCreativeWork(message) {
        console.log(`🎨 Creative work: ${message.data?.contentType}`);
        
        // Route creative work to appropriate processing pipeline
        const routingMessage = {
            ...message,
            type: 'build-request', // Convert to build request
            routed: true,
            routedAt: new Date()
        };
        
        this.messageQueue.push(routingMessage);
    }
    
    async handleSystemStatus(message) {
        console.log(`📊 System status update from ${message.source}`);
        
        // Update session metadata
        const sessionName = this.findSessionBySource(message.source);
        if (sessionName) {
            const state = this.sessionStates.get(sessionName);
            if (state) {
                state.metadata = { ...state.metadata, ...message.data };
                state.lastStatusUpdate = new Date();
            }
        }
    }
    
    async handleErrorAlert(message) {
        console.log(`🚨 Error alert: ${message.data?.error}`);
        
        // Broadcast error to all connected clients
        this.broadcastToClients({
            type: 'system-error',
            data: {
                source: message.source,
                error: message.data?.error,
                timestamp: new Date()
            }
        });
        
        // Log to error file
        this.logError(message);
    }
    
    findSessionBySource(source) {
        for (const [sessionName, state] of this.sessionStates.entries()) {
            const services = state.config.services;
            if (services.some(service => service.name.toLowerCase().includes(source.toLowerCase()))) {
                return sessionName;
            }
        }
        return null;
    }
    
    // API handlers
    async handleSessionsRequest(req, res) {
        const sessions = Array.from(this.sessionStates.entries()).map(([name, state]) => ({
            name,
            isActive: state.isActive,
            health: state.health,
            lastSeen: state.lastSeen,
            services: state.config.services,
            messageQueue: state.messageQueue.length,
            metadata: state.metadata
        }));
        
        this.sendResponse(res, 200, { sessions });
    }
    
    async handleHealthRequest(req, res) {
        const healthSummary = {
            totalSessions: this.sessionStates.size,
            activeSessions: Array.from(this.sessionStates.values()).filter(s => s.isActive).length,
            healthySessions: Array.from(this.sessionStates.values()).filter(s => s.health === 'healthy').length,
            messageQueueLength: this.messageQueue.length,
            activeWorkflows: this.workflowStates.size,
            connectedClients: this.wsClients.length,
            systemStatus: this.getSystemHealth()
        };
        
        this.sendResponse(res, 200, healthSummary);
    }
    
    async handleSendMessageRequest(req, res) {
        const requestBody = await this.readRequestBody(req);
        const { type, target, data } = requestBody;
        
        const message = {
            id: this.generateMessageId(),
            type,
            source: 'conductor-api',
            target,
            data,
            timestamp: new Date()
        };
        
        if (target === 'broadcast') {
            this.messageQueue.push(message);
        } else {
            await this.sendMessageToSession(target, message);
        }
        
        this.sendResponse(res, 200, { 
            message: 'Message sent',
            messageId: message.id 
        });
    }
    
    async handleWorkflowsRequest(req, res) {
        const workflows = Array.from(this.workflowStates.entries()).map(([id, workflow]) => ({
            id,
            type: workflow.type,
            status: workflow.status,
            startedAt: workflow.startedAt,
            completedAt: workflow.completedAt,
            steps: workflow.steps
        }));
        
        this.sendResponse(res, 200, { workflows });
    }
    
    async handleRestartRequest(req, res) {
        const requestBody = await this.readRequestBody(req);
        const { sessionName } = requestBody;
        
        if (sessionName && this.sessionStates.has(sessionName)) {
            console.log(`🔄 Restarting session: ${sessionName}`);
            
            // Execute tmux command to restart session
            exec(`tmux kill-session -t ${sessionName}`, (error) => {
                if (error) {
                    console.log(`⚠️ Error killing session ${sessionName}: ${error.message}`);
                }
                
                // Wait a moment then restart
                setTimeout(() => {
                    exec(`./start-cal-distributed-workspace.sh`, (error) => {
                        if (error) {
                            console.log(`❌ Error restarting workspace: ${error.message}`);
                        } else {
                            console.log(`✅ Workspace restart initiated`);
                        }
                    });
                }, 2000);
            });
            
            this.sendResponse(res, 200, { message: `Restarting ${sessionName}` });
        } else {
            this.sendResponse(res, 404, { error: 'Session not found' });
        }
    }
    
    async serveDashboard(res) {
        const dashboard = `<!DOCTYPE html>
<html>
<head>
    <title>CAL Multi-Session Conductor</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: #2d3748; color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .sessions-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .session-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .session-header { display: flex; justify-content: between; align-items: center; margin-bottom: 15px; }
        .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .status-healthy { background: #c6f6d5; color: #2f855a; }
        .status-unhealthy { background: #fed7d7; color: #c53030; }
        .status-unknown { background: #e2e8f0; color: #4a5568; }
        .services { margin-top: 10px; }
        .service-item { background: #f7fafc; padding: 8px; margin: 4px 0; border-radius: 4px; font-size: 14px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 15px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .workflows { background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .workflow-item { background: #f7fafc; padding: 15px; margin: 10px 0; border-radius: 8px; }
        .workflow-steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-top: 10px; }
        .step { padding: 8px; border-radius: 4px; text-align: center; font-size: 12px; }
        .step-pending { background: #e2e8f0; }
        .step-completed { background: #c6f6d5; }
        .step-failed { background: #fed7d7; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎼 CAL Multi-Session Conductor</h1>
        <p>Orchestrating distributed creative workspace</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <h3>Sessions</h3>
            <p>${Array.from(this.sessionStates.values()).filter(s => s.isActive).length}/${this.sessionStates.size}</p>
        </div>
        <div class="stat-card">
            <h3>Healthy</h3>
            <p>${Array.from(this.sessionStates.values()).filter(s => s.health === 'healthy').length}</p>
        </div>
        <div class="stat-card">
            <h3>Messages</h3>
            <p>${this.messageQueue.length}</p>
        </div>
        <div class="stat-card">
            <h3>Workflows</h3>
            <p>${this.workflowStates.size}</p>
        </div>
    </div>
    
    <div class="sessions-grid">
        ${Array.from(this.sessionStates.entries()).map(([name, state]) => `
            <div class="session-card">
                <div class="session-header">
                    <h3>${name}</h3>
                    <span class="status-badge status-${state.health}">${state.health}</span>
                </div>
                <p>${state.config.description}</p>
                <p><strong>Active:</strong> ${state.isActive ? 'Yes' : 'No'}</p>
                <p><strong>Last Seen:</strong> ${state.lastSeen ? state.lastSeen.toLocaleString() : 'Never'}</p>
                <div class="services">
                    <strong>Services:</strong>
                    ${state.config.services.map(service => `
                        <div class="service-item">${service.name} (${service.port})</div>
                    `).join('')}
                </div>
            </div>
        `).join('')}
    </div>
    
    <div class="workflows">
        <h2>🔄 Active Workflows</h2>
        ${this.workflowStates.size === 0 ? '<p>No active workflows</p>' : 
            Array.from(this.workflowStates.entries()).map(([id, workflow]) => `
                <div class="workflow-item">
                    <h4>${workflow.type} - ${workflow.status}</h4>
                    <p><strong>Started:</strong> ${workflow.startedAt.toLocaleString()}</p>
                    <div class="workflow-steps">
                        ${workflow.steps.map(step => `
                            <div class="step step-${step.status}">${step.name}</div>
                        `).join('')}
                    </div>
                </div>
            `).join('')
        }
    </div>
    
    <script>
        // Auto-refresh every 10 seconds
        setTimeout(() => location.reload(), 10000);
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(dashboard);
    }
    
    getSystemState() {
        return {
            sessions: Array.from(this.sessionStates.entries()).map(([name, state]) => ({
                name,
                isActive: state.isActive,
                health: state.health,
                services: state.config.services.length
            })),
            messageQueue: this.messageQueue.length,
            workflows: this.workflowStates.size,
            systemHealth: this.getSystemHealth()
        };
    }
    
    getSystemHealth() {
        const activeSessions = Array.from(this.sessionStates.values()).filter(s => s.isActive).length;
        const healthySessions = Array.from(this.sessionStates.values()).filter(s => s.health === 'healthy').length;
        
        if (healthySessions === 0) return 'critical';
        if (healthySessions < activeSessions / 2) return 'degraded';
        if (healthySessions === activeSessions) return 'optimal';
        return 'normal';
    }
    
    broadcastSystemState() {
        this.broadcastToClients({
            type: 'system-state-update',
            data: this.getSystemState()
        });
    }
    
    broadcastToClients(message) {
        const data = JSON.stringify(message);
        this.wsClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    handleWebSocketMessage(ws, message) {
        const { type, data } = message;
        
        if (type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
        } else if (type === 'get-system-state') {
            ws.send(JSON.stringify({
                type: 'system-state',
                data: this.getSystemState()
            }));
        } else if (type === 'send-message') {
            this.messageQueue.push({
                id: this.generateMessageId(),
                type: data.messageType,
                source: 'websocket-client',
                data: data.payload,
                timestamp: new Date()
            });
        }
    }
    
    generateWorkflowId() {
        return 'wf-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    generateMessageId() {
        return 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    
    logError(message) {
        const errorLog = {
            timestamp: new Date(),
            source: message.source,
            type: message.type,
            error: message.data?.error,
            details: message.data
        };
        
        try {
            const logFile = './conductor-errors.log';
            fs.appendFileSync(logFile, JSON.stringify(errorLog) + '\n');
        } catch (error) {
            console.error('❌ Failed to log error:', error.message);
        }
    }
    
    async readRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
                try {
                    resolve(body ? JSON.parse(body) : {});
                } catch (error) {
                    reject(error);
                }
            });
        });
    }
    
    sendResponse(res, statusCode, data) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data, null, 2));
    }
    
    makeHTTPRequest(options, data) {
        return new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => resolve({ statusCode: res.statusCode, body }));
            });
            
            req.on('error', reject);
            req.setTimeout(this.config.messageTimeout, () => reject(new Error('Request timeout')));
            
            if (data) req.write(data);
            req.end();
        });
    }
    
    // Send message to conductor from external sessions
    receiveMessage(message) {
        console.log(`📥 Received message: ${message.type} from ${message.source}`);
        this.messageQueue.push(message);
    }
    
    // CLI interface
    showStatus() {
        console.log('');
        console.log('🎼 MULTI-SESSION CONDUCTOR STATUS');
        console.log('=================================');
        console.log(`Running: ${this.isRunning ? '✅ Yes' : '❌ No'}`);
        console.log(`Total Sessions: ${this.sessionStates.size}`);
        console.log(`Active Sessions: ${Array.from(this.sessionStates.values()).filter(s => s.isActive).length}`);
        console.log(`Healthy Sessions: ${Array.from(this.sessionStates.values()).filter(s => s.health === 'healthy').length}`);
        console.log(`Message Queue: ${this.messageQueue.length}`);
        console.log(`Active Workflows: ${this.workflowStates.size}`);
        console.log(`WebSocket Clients: ${this.wsClients.length}`);
        console.log(`System Health: ${this.getSystemHealth()}`);
        console.log('');
        
        console.log('📋 Session Status:');
        for (const [name, state] of this.sessionStates.entries()) {
            const symbol = state.isActive ? '✅' : '❌';
            const health = state.health === 'healthy' ? '💚' : state.health === 'unhealthy' ? '💛' : '⚪';
            console.log(`   ${symbol} ${health} ${name}: ${state.config.description}`);
        }
        console.log('');
    }
}

// CLI interface
if (require.main === module) {
    const conductor = new MultiSessionConductor();
    
    const command = process.argv[2];
    
    if (command === 'status') {
        conductor.initializeSessionStates();
        conductor.discoverSessions().then(() => {
            conductor.showStatus();
            process.exit(0);
        });
        return;
    }
    
    if (command === 'test-message') {
        const testMessage = {
            id: 'test-123',
            type: 'build-request',
            source: 'cli-test',
            data: { name: 'test-component' },
            timestamp: new Date()
        };
        
        conductor.receiveMessage(testMessage);
        console.log('✅ Test message sent to conductor');
        process.exit(0);
    }
    
    // Start the conductor
    conductor.start().catch(error => {
        console.error('❌ Failed to start Multi-Session Conductor:', error);
        process.exit(1);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\\n🛑 Multi-Session Conductor shutting down...');
        conductor.isRunning = false;
        process.exit(0);
    });
}

module.exports = MultiSessionConductor;