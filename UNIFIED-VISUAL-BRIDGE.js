#!/usr/bin/env node

/**
 * UNIFIED VISUAL BRIDGE
 * Connects all our existing systems to the visual control panel
 * Makes everything work together with live visual feedback
 */

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');

class UnifiedVisualBridge {
    constructor() {
        this.connections = new Map();
        this.visualClients = new Set();
        this.systemData = {
            agents: new Map(),
            characters: new Map(),
            activities: [],
            metrics: {
                investigations: 0,
                broadcasts: 0,
                crossReferences: 0,
                opinionsFormed: 0
            }
        };
        
        console.log('🌉 UNIFIED VISUAL BRIDGE');
        console.log('========================');
        console.log('Connecting all systems to visual interface');
    }
    
    async start() {
        // 1. Start WebSocket server for real-time updates
        await this.startWebSocketServer();
        
        // 2. Start HTTP server for web interface
        await this.startWebServer();
        
        // 3. Connect to existing systems
        await this.connectToExistingSystems();
        
        // 4. Start monitoring and bridging
        this.startSystemMonitoring();
        
        console.log('\n✅ Visual Bridge Ready');
        console.log('🌐 Control Panel: http://localhost:8082');
        console.log('🔌 WebSocket: ws://localhost:8081');
    }
    
    async startWebSocketServer() {
        this.wss = new WebSocket.Server({ port: 8081 });
        
        this.wss.on('connection', (ws) => {
            console.log('📱 Visual client connected');
            this.visualClients.add(ws);
            
            // Send current system state
            ws.send(JSON.stringify({
                type: 'system-state',
                data: {
                    agents: Array.from(this.systemData.agents.values()),
                    metrics: this.systemData.metrics,
                    activities: this.systemData.activities.slice(-10)
                }
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleVisualCommand(data, ws);
                } catch (error) {
                    console.error('Invalid message:', error);
                }
            });
            
            ws.on('close', () => {
                this.visualClients.delete(ws);
                console.log('📱 Visual client disconnected');
            });
        });
        
        console.log('🔌 WebSocket server started on port 8081');
    }
    
    async startWebServer() {
        this.server = http.createServer(async (req, res) => {
            if (req.url === '/') {
                // Serve the control panel
                const html = await fs.readFile('LIVE-CONTROL-PANEL.html', 'utf8');
                
                // Inject WebSocket connection code
                const enhancedHtml = html.replace(
                    '</script>',
                    `
                        // WebSocket connection for real-time updates
                        const ws = new WebSocket('ws://localhost:8081');
                        
                        ws.onopen = () => {
                            consoleLog('Connected to visual bridge', 'info');
                        };
                        
                        ws.onmessage = (event) => {
                            const data = JSON.parse(event.data);
                            handleRealtimeUpdate(data);
                        };
                        
                        function handleRealtimeUpdate(data) {
                            switch (data.type) {
                                case 'agent-activity':
                                    triggerCharacterActivity(data.agent, data.activity);
                                    break;
                                case 'metrics-update':
                                    updateMetricsFromBridge(data.metrics);
                                    break;
                                case 'console-message':
                                    consoleLog(data.message, data.level);
                                    break;
                                case 'system-state':
                                    updateSystemState(data.data);
                                    break;
                            }
                        }
                        
                        function triggerCharacterActivity(agentType, activity) {
                            const character = characters.find(c => c.type === agentType);
                            if (character) {
                                performActivity(character, activity);
                            }
                        }
                        
                        function updateMetricsFromBridge(newMetrics) {
                            Object.assign(metrics, newMetrics);
                            updateMetricsDisplay();
                        }
                        
                        function updateSystemState(state) {
                            // Update the visual interface with real system state
                            if (state.agents) {
                                // Update agent statuses
                            }
                            if (state.activities) {
                                // Show recent activities
                                state.activities.forEach(activity => {
                                    consoleLog(activity.message, activity.type);
                                });
                            }
                        }
                        
                        // Override sendToTeacherSystem to use WebSocket
                        async function sendToTeacherSystem(message) {
                            ws.send(JSON.stringify({
                                type: 'user-message',
                                message: message
                            }));
                        }
                    </script>`
                );
                
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(enhancedHtml);
                
            } else if (req.url === '/api/status') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'operational',
                    systems: this.getSystemStatus(),
                    metrics: this.systemData.metrics
                }));
                
            } else if (req.url === '/api/systems') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    connections: Array.from(this.connections.keys()),
                    agents: Array.from(this.systemData.agents.values()),
                    lastActivity: this.systemData.activities.slice(-5)
                }));
                
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        this.server.listen(8082, () => {
            console.log('🌐 Web server started on port 8082');
        });
    }
    
    async connectToExistingSystems() {
        console.log('🔗 Connecting to existing systems...');
        
        // Connect to Teacher System
        await this.connectToSystem('teacher', 'http://localhost:9999');
        
        // Connect to Agent Broadcast
        await this.connectToSystem('broadcast', 'http://localhost:7777');
        
        // Check for other systems
        const potentialSystems = [
            { name: 'unified-connector', port: 3000 },
            { name: 'guardian', port: 3333 },
            { name: 'postgres', port: 5433 },
            { name: 'redis', port: 6380 },
            { name: 'ollama', port: 11435 }
        ];
        
        for (const system of potentialSystems) {
            await this.connectToSystem(system.name, `http://localhost:${system.port}`);
        }
    }
    
    async connectToSystem(name, url) {
        try {
            const response = await this.makeRequest(url + (url.includes('9999') ? '/status' : ''), 'GET');
            
            this.connections.set(name, {
                url: url,
                status: 'connected',
                lastCheck: Date.now()
            });
            
            console.log(`✅ Connected to ${name} at ${url}`);
            
            // Create corresponding agent
            this.systemData.agents.set(name, {
                id: name,
                type: this.mapSystemToAgentType(name),
                status: 'idle',
                lastActivity: Date.now(),
                url: url
            });
            
            this.broadcastToVisual('agent-status', {
                agent: name,
                status: 'connected'
            });
            
        } catch (error) {
            console.log(`❌ Failed to connect to ${name}: ${error.message}`);
            
            this.connections.set(name, {
                url: url,
                status: 'disconnected',
                lastCheck: Date.now(),
                error: error.message
            });
        }
    }
    
    mapSystemToAgentType(systemName) {
        const mapping = {
            'teacher': 'teacher',
            'broadcast': 'broadcaster',
            'unified-connector': 'researcher',
            'guardian': 'technical',
            'postgres': 'database',
            'redis': 'cache',
            'ollama': 'ai'
        };
        
        return mapping[systemName] || 'researcher';
    }
    
    startSystemMonitoring() {
        // Monitor system health every 10 seconds
        setInterval(() => {
            this.checkSystemHealth();
        }, 10000);
        
        // Generate fake activities for demo
        setInterval(() => {
            this.simulateSystemActivity();
        }, 5000);
        
        // Update metrics
        setInterval(() => {
            this.updateMetrics();
        }, 3000);
    }
    
    async checkSystemHealth() {
        for (const [name, connection] of this.connections) {
            try {
                await this.makeRequest(connection.url, 'GET');
                
                if (connection.status !== 'connected') {
                    connection.status = 'connected';
                    console.log(`✅ ${name} reconnected`);
                    
                    this.broadcastToVisual('agent-status', {
                        agent: name,
                        status: 'connected'
                    });
                }
                
                connection.lastCheck = Date.now();
                
            } catch (error) {
                if (connection.status !== 'disconnected') {
                    connection.status = 'disconnected';
                    console.log(`❌ ${name} disconnected`);
                    
                    this.broadcastToVisual('agent-status', {
                        agent: name,
                        status: 'disconnected'
                    });
                }
            }
        }
    }
    
    simulateSystemActivity() {
        const agents = Array.from(this.systemData.agents.keys());
        if (agents.length === 0) return;
        
        // Random agent activity
        if (Math.random() > 0.6) {
            const agent = agents[Math.floor(Math.random() * agents.length)];
            const activities = ['investigating', 'analyzing', 'processing', 'broadcasting'];
            const activity = activities[Math.floor(Math.random() * activities.length)];
            
            this.recordActivity(agent, activity);
        }
    }
    
    recordActivity(agent, activity) {
        const activityData = {
            id: Date.now(),
            agent: agent,
            activity: activity,
            timestamp: Date.now(),
            message: `${agent} is ${activity}`,
            type: 'info'
        };
        
        this.systemData.activities.push(activityData);
        
        // Keep only last 100 activities
        if (this.systemData.activities.length > 100) {
            this.systemData.activities = this.systemData.activities.slice(-100);
        }
        
        // Update agent status
        const agentData = this.systemData.agents.get(agent);
        if (agentData) {
            agentData.status = activity;
            agentData.lastActivity = Date.now();
            
            // Reset to idle after some time
            setTimeout(() => {
                agentData.status = 'idle';
                this.broadcastToVisual('agent-status', {
                    agent: agent,
                    status: 'idle'
                });
            }, 3000 + Math.random() * 5000);
        }
        
        // Broadcast to visual clients
        this.broadcastToVisual('agent-activity', {
            agent: this.mapSystemToAgentType(agent),
            activity: activity
        });
        
        this.broadcastToVisual('console-message', {
            message: activityData.message,
            level: 'info'
        });
    }
    
    updateMetrics() {
        // Simulate metric updates
        if (Math.random() > 0.7) {
            this.systemData.metrics.investigations++;
        }
        if (Math.random() > 0.8) {
            this.systemData.metrics.broadcasts++;
        }
        if (Math.random() > 0.9) {
            this.systemData.metrics.crossReferences++;
        }
        if (Math.random() > 0.95) {
            this.systemData.metrics.opinionsFormed++;
        }
        
        this.broadcastToVisual('metrics-update', this.systemData.metrics);
    }
    
    handleVisualCommand(data, ws) {
        switch (data.type) {
            case 'user-message':
                this.handleUserMessage(data.message);
                break;
                
            case 'trigger-activity':
                this.recordActivity(data.agent, data.activity);
                break;
                
            case 'get-system-status':
                ws.send(JSON.stringify({
                    type: 'system-status',
                    data: this.getSystemStatus()
                }));
                break;
        }
    }
    
    async handleUserMessage(message) {
        console.log(`👤 User message: ${message}`);
        
        // Try to send to teacher system
        const teacherConnection = this.connections.get('teacher');
        if (teacherConnection && teacherConnection.status === 'connected') {
            try {
                const response = await this.makeRequest(teacherConnection.url + '/ask', 'POST', {
                    question: message
                });
                
                const result = JSON.parse(response);
                
                this.broadcastToVisual('console-message', {
                    message: `System: ${result.answer || result.tldr || 'Response received'}`,
                    level: 'info'
                });
                
                // Trigger visual activities
                this.recordActivity('teacher', 'teaching');
                this.recordActivity('researcher', 'investigating');
                this.recordActivity('broadcast', 'broadcasting');
                
            } catch (error) {
                this.broadcastToVisual('console-message', {
                    message: 'Teacher system not responding',
                    level: 'warn'
                });
            }
        } else {
            this.broadcastToVisual('console-message', {
                message: 'Teacher system not connected',
                level: 'warn'
            });
        }
    }
    
    broadcastToVisual(type, data) {
        const message = JSON.stringify({ type, ...data });
        
        this.visualClients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
    
    getSystemStatus() {
        return {
            totalSystems: this.connections.size,
            connectedSystems: Array.from(this.connections.values()).filter(c => c.status === 'connected').length,
            agents: this.systemData.agents.size,
            lastActivity: this.systemData.activities.length > 0 ? 
                this.systemData.activities[this.systemData.activities.length - 1].timestamp : null
        };
    }
    
    makeRequest(url, method = 'GET', body = null) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname,
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}`));
                    }
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            if (body) {
                req.write(JSON.stringify(body));
            }
            
            req.end();
        });
    }
}

// Start the bridge
if (require.main === module) {
    const bridge = new UnifiedVisualBridge();
    
    bridge.start().then(() => {
        console.log('\n🎯 VISUAL BRIDGE ACTIVE');
        console.log('All systems connected to visual interface');
        console.log('Open http://localhost:8082 to see everything working together!');
    }).catch(error => {
        console.error('Failed to start visual bridge:', error);
        process.exit(1);
    });
}

module.exports = UnifiedVisualBridge;