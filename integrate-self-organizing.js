#!/usr/bin/env node

/**
 * Self-Organizing System Integration
 * Connects all components into a unified system
 */

const http = require('http');
const WebSocket = require('ws');
const express = require('express');
const path = require('path');

// Import our components
const SelfOrganizingMaster = require('./self-organizing-master');
const UniversalFormatTranslator = require('./universal-format-translator');
const CharacterRouterSystem = require('./character-router-system');
const DebugFlowOrchestrator = require('./debug-flow-orchestrator');

class SelfOrganizingIntegration {
    constructor() {
        this.components = {};
        this.server = null;
        this.wss = null;
        this.app = express();
        this.clients = new Set();
    }

    async initialize() {
        console.log('🚀 Initializing Self-Organizing System Integration...\n');
        
        // Initialize all components
        await this.initializeComponents();
        
        // Set up inter-component communication
        await this.setupCommunication();
        
        // Start web server and WebSocket
        await this.startServer();
        
        // Set up API endpoints
        this.setupAPI();
        
        // Start system monitoring
        this.startMonitoring();
        
        console.log('\n✨ Self-Organizing System is fully integrated and running!');
        console.log('📊 Dashboard: http://localhost:8080');
        console.log('🔌 WebSocket: ws://localhost:8081');
        console.log('🌐 API: http://localhost:8080/api\n');
        
        return this;
    }

    async initializeComponents() {
        console.log('📦 Initializing components...');
        
        // Initialize each component
        try {
            this.components.master = new SelfOrganizingMaster();
            await this.components.master.initialize();
            console.log('  ✓ Self-Organizing Master');
            
            this.components.translator = new UniversalFormatTranslator();
            console.log('  ✓ Universal Format Translator');
            
            this.components.router = new CharacterRouterSystem();
            await this.components.router.initialize();
            console.log('  ✓ Character Router System');
            
            this.components.debugger = new DebugFlowOrchestrator();
            await this.components.debugger.initialize();
            console.log('  ✓ Debug Flow Orchestrator');
        } catch (error) {
            console.error('❌ Failed to initialize components:', error);
            throw error;
        }
    }

    async setupCommunication() {
        console.log('\n🔗 Setting up inter-component communication...');
        
        // Master -> Router: Route files to characters
        this.components.master.on('file:indexed', async (data) => {
            if (data.owner) {
                const task = {
                    type: 'file-processing',
                    description: `Process ${data.type} file: ${data.path}`,
                    language: data.type,
                    filePath: data.path,
                    complexity: 'medium'
                };
                
                await this.components.router.routeTask(task);
            }
            
            // Broadcast to dashboard
            this.broadcast({
                type: 'file:indexed',
                data
            });
        });
        
        // Router -> Debugger: Handle errors from character tasks
        this.components.router.on('task:error', async (error) => {
            await this.components.debugger.handleError(error.error, {
                source: 'character-task',
                character: error.character,
                taskId: error.taskId
            });
        });
        
        // Debugger -> Router: Route debug tasks to characters
        this.components.debugger.on('debug:needsCharacter', async (data) => {
            const task = {
                type: 'debug-assistance',
                description: `Help debug ${data.category} error`,
                category: data.category,
                errorId: data.errorId,
                priority: 8
            };
            
            await this.components.router.routeTask(task);
        });
        
        // Master -> Translator: Translate file formats when needed
        this.components.master.on('translation:needed', async (data) => {
            try {
                const result = await this.components.translator.translate(
                    data.content,
                    data.from,
                    data.to
                );
                
                this.broadcast({
                    type: 'translation:completed',
                    data: {
                        from: data.from,
                        to: data.to,
                        size: result.length
                    }
                });
            } catch (error) {
                console.error('Translation error:', error);
            }
        });
        
        // Router -> Master: Request human approval
        this.components.router.on('approval:needed', async (data) => {
            await this.components.master.requestHumanApproval(
                'task-assignment',
                data
            );
            
            this.broadcast({
                type: 'approval:needed',
                data
            });
        });
        
        // All components -> Dashboard: Status updates
        const broadcastEvents = [
            'task:routed',
            'task:completed',
            'error:detected',
            'error:resolved',
            'debug:progress',
            'file:processed'
        ];
        
        for (const component of Object.values(this.components)) {
            for (const event of broadcastEvents) {
                component.on(event, (data) => {
                    this.broadcast({
                        type: event,
                        data
                    });
                });
            }
        }
        
        console.log('  ✓ Communication channels established');
    }

    async startServer() {
        // Serve static files
        this.app.use(express.static(__dirname));
        this.app.use(express.json());
        
        // Serve dashboard
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'self-organizing-dashboard.html'));
        });
        
        // Create HTTP server
        this.server = http.createServer(this.app);
        
        // Create WebSocket server
        this.wss = new WebSocket.Server({ port: 8081 });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 New dashboard connection');
            this.clients.add(ws);
            
            // Send initial status
            ws.send(JSON.stringify({
                type: 'connected',
                data: {
                    timestamp: new Date().toISOString(),
                    components: Object.keys(this.components)
                }
            }));
            
            ws.on('close', () => {
                this.clients.delete(ws);
                console.log('🔌 Dashboard disconnected');
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });
        
        // Start HTTP server
        this.server.listen(8080, () => {
            console.log('  ✓ Web server started on port 8080');
        });
    }

    setupAPI() {
        // System status endpoint
        this.app.get('/api/status', async (req, res) => {
            const status = {
                master: await this.components.master.getSystemStatus(),
                router: await this.components.router.getCharacterWorkload(),
                debugger: await this.components.debugger.getDebugStatistics(),
                uptime: process.uptime(),
                memory: process.memoryUsage()
            };
            
            res.json(status);
        });
        
        // Translate endpoint
        this.app.post('/api/translate', async (req, res) => {
            try {
                const { content, from, to } = req.body;
                const result = await this.components.translator.translate(content, from, to);
                res.json({ success: true, result });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });
        
        // Route task endpoint
        this.app.post('/api/task', async (req, res) => {
            try {
                const result = await this.components.router.routeTask(req.body);
                res.json({ success: true, result });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });
        
        // Human approval endpoint
        this.app.post('/api/approval/:id', async (req, res) => {
            try {
                const { approved, response } = req.body;
                await this.components.master.processHumanResponse(
                    req.params.id,
                    approved,
                    response
                );
                res.json({ success: true });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });
        
        // Debug analysis endpoint
        this.app.post('/api/debug', async (req, res) => {
            try {
                const result = await this.components.debugger.handleError(
                    new Error(req.body.error),
                    req.body.context
                );
                res.json({ success: true, result });
            } catch (error) {
                res.status(400).json({ success: false, error: error.message });
            }
        });
        
        // Organization suggestions endpoint
        this.app.get('/api/suggestions', async (req, res) => {
            const suggestions = await this.components.master.suggestOrganization();
            res.json(suggestions);
        });
    }

    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }

    startMonitoring() {
        // System health check every 30 seconds
        setInterval(async () => {
            const health = {
                components: {},
                timestamp: new Date().toISOString()
            };
            
            // Check each component
            for (const [name, component] of Object.entries(this.components)) {
                health.components[name] = {
                    status: 'healthy', // Would implement actual health checks
                    lastActivity: component.lastActivity || new Date().toISOString()
                };
            }
            
            this.broadcast({
                type: 'health:update',
                data: health
            });
        }, 30000);
        
        // Performance metrics every 10 seconds
        setInterval(() => {
            const metrics = {
                cpu: process.cpuUsage(),
                memory: process.memoryUsage(),
                uptime: process.uptime()
            };
            
            this.broadcast({
                type: 'metrics:update',
                data: metrics
            });
        }, 10000);
    }

    // Graceful shutdown
    async shutdown() {
        console.log('\n🛑 Shutting down Self-Organizing System...');
        
        // Close WebSocket connections
        this.clients.forEach(client => client.close());
        this.wss.close();
        
        // Stop HTTP server
        this.server.close();
        
        // Shutdown components
        // (Would implement cleanup methods in each component)
        
        console.log('✅ Shutdown complete');
        process.exit(0);
    }
}

// Export for use in other modules
module.exports = SelfOrganizingIntegration;

// Run if called directly
if (require.main === module) {
    const integration = new SelfOrganizingIntegration();
    
    // Handle shutdown signals
    process.on('SIGINT', () => integration.shutdown());
    process.on('SIGTERM', () => integration.shutdown());
    
    // Start the system
    integration.initialize().catch(error => {
        console.error('❌ Failed to start system:', error);
        process.exit(1);
    });
    
    // Example: Demonstrate the system in action
    setTimeout(async () => {
        console.log('\n🎯 Demonstrating Self-Organizing System...\n');
        
        // Example 1: Route a task
        console.log('1️⃣ Routing a system architecture task...');
        await integration.components.router.routeTask({
            type: 'system-architecture',
            description: 'Review and optimize the self-organizing system',
            complexity: 'high',
            requiresApproval: false
        });
        
        // Example 2: Translate between formats
        setTimeout(async () => {
            console.log('\n2️⃣ Translating JSON to Python...');
            const jsonData = { config: { theme: 'dark', debug: true } };
            const python = await integration.components.translator.translate(
                JSON.stringify(jsonData),
                'json',
                'python'
            );
            console.log('Result:', python);
        }, 2000);
        
        // Example 3: Handle an error
        setTimeout(() => {
            console.log('\n3️⃣ Simulating an error...');
            integration.components.debugger.handleError(
                new TypeError("Cannot read property 'foo' of undefined"),
                { source: 'demo' }
            );
        }, 4000);
        
    }, 3000);
}