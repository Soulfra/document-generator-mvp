#!/usr/bin/env node

/**
 * ASYNC CONNECTOR
 * Connects Universal Interface to MCP Brain with WebSocket
 * Handles real async communication between layers
 */

const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const MCPBrainReasoningEngine = require('./MCP-BRAIN-REASONING-ENGINE.js');

class AsyncConnector {
    constructor() {
        this.brain = new MCPBrainReasoningEngine();
        this.app = express();
        this.wss = null;
        this.connections = new Map();
        this.activeRequests = new Map();
        
        this.init();
    }
    
    async init() {
        console.log('🔌 ASYNC CONNECTOR STARTING...');
        
        // Setup HTTP server for serving interface
        this.setupHTTPServer();
        
        // Setup WebSocket server for brain communication
        this.setupWebSocketServer();
        
        // Connect brain to async system
        this.connectBrainToAsync();
        
        console.log('✅ ASYNC CONNECTOR READY');
    }
    
    setupHTTPServer() {
        this.app.use(express.static(__dirname));
        this.app.use(express.json());
        
        // Serve the universal interface
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'UNIVERSAL-HUMAN-INTERFACE.html'));
        });
        
        // API endpoint for direct requests
        this.app.post('/api/request', async (req, res) => {
            const { userInput, category } = req.body;
            
            try {
                const requestId = `req_${Date.now()}`;
                
                // Process with brain asynchronously
                const result = await this.brain.processUserRequest(userInput, category);
                
                res.json({
                    success: true,
                    requestId,
                    result,
                    message: 'Request processing started'
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Start HTTP server
        const port = 8080;
        this.app.listen(port, () => {
            console.log(`🌐 HTTP Server running on http://localhost:${port}`);
        });
    }
    
    setupWebSocketServer() {
        this.wss = new WebSocket.Server({ port: 8081 });
        
        this.wss.on('connection', (ws) => {
            const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            console.log(`🔌 New connection: ${connectionId}`);
            
            this.connections.set(connectionId, {
                ws,
                id: connectionId,
                connectedAt: new Date(),
                lastActivity: new Date()
            });
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connection_established',
                connectionId,
                brainStatus: 'online',
                message: 'Connected to MCP Brain Reasoning Engine'
            }));
            
            // Handle messages from interface
            ws.on('message', (message) => {
                this.handleWebSocketMessage(connectionId, message);
            });
            
            // Handle disconnect
            ws.on('close', () => {
                console.log(`🔌 Connection closed: ${connectionId}`);
                this.connections.delete(connectionId);
            });
            
            // Handle errors
            ws.on('error', (error) => {
                console.error(`❌ WebSocket error for ${connectionId}:`, error);
                this.connections.delete(connectionId);
            });
        });
        
        console.log('🔌 WebSocket server running on ws://localhost:8081');
    }
    
    connectBrainToAsync() {
        // Connect brain events to WebSocket broadcasts
        this.brain.on('task_started', (data) => {
            this.broadcastToBrain({
                type: 'task_started',
                data
            });
        });
        
        this.brain.on('task_progress', (data) => {
            this.broadcastToBrain({
                type: 'task_progress', 
                data
            });
        });
        
        this.brain.on('task_completed', (data) => {
            this.broadcastToBrain({
                type: 'task_completed',
                data
            });
        });
        
        this.brain.on('decision_made', (data) => {
            this.broadcastToBrain({
                type: 'decision_made',
                data
            });
        });
        
        console.log('🧠 Brain connected to async communication');
    }
    
    async handleWebSocketMessage(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        connection.lastActivity = new Date();
        
        try {
            const data = JSON.parse(message);
            
            console.log(`📨 Message from ${connectionId}:`, data.type);
            
            switch (data.type) {
                case 'user_request':
                    await this.handleUserRequest(connectionId, data);
                    break;
                    
                case 'ping':
                    this.sendToConnection(connectionId, {
                        type: 'pong',
                        timestamp: new Date()
                    });
                    break;
                    
                case 'get_brain_status':
                    this.sendBrainStatus(connectionId);
                    break;
                    
                case 'get_active_tasks':
                    this.sendActiveTasks(connectionId);
                    break;
                    
                default:
                    console.warn(`Unknown message type: ${data.type}`);
            }
            
        } catch (error) {
            console.error(`Failed to handle message from ${connectionId}:`, error);
            
            this.sendToConnection(connectionId, {
                type: 'error',
                message: 'Failed to process message',
                error: error.message
            });
        }
    }
    
    async handleUserRequest(connectionId, data) {
        const { userInput, category, requestId } = data;
        
        console.log(`🧠 Processing user request: "${userInput}"`);
        
        // Store active request
        this.activeRequests.set(requestId, {
            connectionId,
            userInput,
            category,
            startTime: new Date()
        });
        
        // Send immediate acknowledgment
        this.sendToConnection(connectionId, {
            type: 'request_acknowledged',
            requestId,
            message: 'Brain is processing your request...'
        });
        
        try {
            // Process with brain (this is async)
            const result = await this.brain.processUserRequest(userInput, category);
            
            // Send progress updates
            this.sendToConnection(connectionId, {
                type: 'processing_update',
                requestId,
                stage: 'understanding',
                data: result.understanding
            });
            
            this.sendToConnection(connectionId, {
                type: 'processing_update', 
                requestId,
                stage: 'decision',
                data: result.decision
            });
            
            this.sendToConnection(connectionId, {
                type: 'processing_update',
                requestId,
                stage: 'execution_plan',
                data: result.plan
            });
            
            // Send final result
            this.sendToConnection(connectionId, {
                type: 'request_completed',
                requestId,
                result,
                message: 'Request processed successfully!'
            });
            
        } catch (error) {
            console.error(`Failed to process request ${requestId}:`, error);
            
            this.sendToConnection(connectionId, {
                type: 'request_failed',
                requestId,
                error: error.message
            });
        } finally {
            this.activeRequests.delete(requestId);
        }
    }
    
    sendToConnection(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (connection && connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(JSON.stringify(data));
        }
    }
    
    broadcastToBrain(data) {
        this.connections.forEach((connection, connectionId) => {
            this.sendToConnection(connectionId, data);
        });
    }
    
    sendBrainStatus(connectionId) {
        const status = {
            type: 'brain_status',
            data: {
                status: 'online',
                currentTask: this.brain.reasoning.currentTask?.id || null,
                queueLength: this.brain.reasoning.taskQueue.length,
                activeProcesses: this.brain.executionEngine.activeTaskCount,
                decisionHistory: this.brain.reasoning.decisionHistory.length,
                uptime: process.uptime()
            }
        };
        
        this.sendToConnection(connectionId, status);
    }
    
    sendActiveTasks(connectionId) {
        const tasks = {
            type: 'active_tasks',
            data: {
                current: this.brain.reasoning.currentTask,
                queue: this.brain.reasoning.taskQueue.map(task => ({
                    id: task.id,
                    steps: task.steps.length,
                    priority: task.priority || 0.5,
                    createdAt: task.createdAt
                })),
                activeCount: this.brain.executionEngine.activeTaskCount
            }
        };
        
        this.sendToConnection(connectionId, tasks);
    }
}

// Enhanced Universal Interface with Async Connection
const enhancedInterfaceHTML = `
<!-- Enhanced Universal Interface with Real Brain Connection -->
<script>
class AsyncBrainConnection {
    constructor() {
        this.ws = null;
        this.connectionStatus = 'disconnected';
        this.activeRequests = new Map();
        
        this.connect();
    }
    
    connect() {
        try {
            this.ws = new WebSocket('ws://localhost:8081');
            
            this.ws.onopen = () => {
                console.log('🧠 Connected to MCP Brain');
                this.connectionStatus = 'connected';
                this.updateUI();
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleBrainMessage(data);
            };
            
            this.ws.onclose = () => {
                console.log('🔌 Brain connection closed');
                this.connectionStatus = 'disconnected';
                this.updateUI();
                
                // Attempt reconnection
                setTimeout(() => this.connect(), 5000);
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ Brain connection error:', error);
                this.connectionStatus = 'error';
                this.updateUI();
            };
            
        } catch (error) {
            console.error('Failed to connect to brain:', error);
            this.connectionStatus = 'error';
        }
    }
    
    sendToBrain(userInput, category) {
        if (this.connectionStatus !== 'connected') {
            console.error('Not connected to brain');
            return null;
        }
        
        const requestId = \`req_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
        
        this.ws.send(JSON.stringify({
            type: 'user_request',
            userInput,
            category,
            requestId
        }));
        
        this.activeRequests.set(requestId, {
            userInput,
            category,
            startTime: new Date()
        });
        
        return requestId;
    }
    
    handleBrainMessage(data) {
        console.log('🧠 Brain message:', data.type);
        
        switch (data.type) {
            case 'connection_established':
                this.showMessage('🧠 Brain connected and ready!');
                break;
                
            case 'request_acknowledged':
                this.showMessage('🤔 Brain is thinking...');
                break;
                
            case 'processing_update':
                this.showProgress(data);
                break;
                
            case 'request_completed':
                this.showResult(data);
                break;
                
            case 'request_failed':
                this.showError(data);
                break;
                
            case 'task_started':
                this.showTaskUpdate('Task started', data.data);
                break;
                
            case 'task_completed':
                this.showTaskUpdate('Task completed', data.data);
                break;
        }
    }
    
    showMessage(message) {
        const responseArea = document.getElementById('response-area');
        const responseText = document.getElementById('response-text');
        
        responseText.innerHTML = message;
        responseArea.classList.add('show');
        
        setTimeout(() => {
            responseArea.classList.remove('show');
        }, 3000);
    }
    
    showProgress(data) {
        const progressMessage = \`\${data.stage.toUpperCase()}: Processing your request...\`;
        this.showMessage(progressMessage);
    }
    
    showResult(data) {
        const result = data.result;
        const message = \`✅ Complete! \${result.understanding.intent} executed successfully.\`;
        this.showMessage(message);
        
        // Show what was actually accomplished
        if (result.plan && result.plan.steps) {
            setTimeout(() => {
                const accomplishments = result.plan.steps.map(step => 
                    \`• \${step.id} completed\`
                ).join('\\n');
                this.showMessage(\`🎯 Accomplished:\\n\${accomplishments}\`);
            }, 2000);
        }
    }
    
    showError(data) {
        this.showMessage(\`❌ Error: \${data.error}\`);
    }
    
    showTaskUpdate(type, taskData) {
        if (taskData && taskData.id) {
            this.showMessage(\`📋 \${type}: \${taskData.id}\`);
        }
    }
    
    updateUI() {
        const indicator = document.getElementById('connection-status');
        if (indicator) {
            indicator.textContent = this.connectionStatus;
            indicator.className = \`status-\${this.connectionStatus}\`;
        }
    }
}

// Initialize brain connection
let brainConnection;

// Override the processUserInput function to use real brain
window.addEventListener('load', () => {
    brainConnection = new AsyncBrainConnection();
    
    // Add connection status indicator
    const statusDiv = document.createElement('div');
    statusDiv.innerHTML = \`
        <div style="position: absolute; top: 10px; right: 10px; padding: 10px; background: rgba(0,0,0,0.7); border-radius: 10px;">
            🧠 Brain: <span id="connection-status">connecting...</span>
        </div>
    \`;
    document.body.appendChild(statusDiv);
});

// Enhanced handleSimpleRequest function
function handleSimpleRequest(request) {
    console.log('Simple request via brain:', request);
    
    if (brainConnection && brainConnection.connectionStatus === 'connected') {
        const category = request.toLowerCase().includes('money') ? 'money' :
                        request.toLowerCase().includes('build') ? 'build' :
                        request.toLowerCase().includes('learn') ? 'learn' : 'talk';
        
        brainConnection.sendToBrain(request, category);
    } else {
        universalInterface.processUserInput(request);
    }
}
</script>
`;

// Write enhanced interface
require('fs').writeFileSync(
    path.join(__dirname, 'ENHANCED-UNIVERSAL-INTERFACE.html'),
    require('fs').readFileSync(path.join(__dirname, 'UNIVERSAL-HUMAN-INTERFACE.html'), 'utf8') + enhancedInterfaceHTML
);

// Start the connector
if (require.main === module) {
    const connector = new AsyncConnector();
    
    console.log('\n🚀 ASYNC CONNECTOR RUNNING');
    console.log('📱 Interface: http://localhost:8080');
    console.log('🔌 WebSocket: ws://localhost:8081');
    console.log('🧠 Brain: Connected and reasoning');
    console.log('\n✅ READY FOR REAL ASYNC REQUESTS!');
}

module.exports = AsyncConnector;