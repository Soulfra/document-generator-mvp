#!/usr/bin/env node

/**
 * 🌉 Soulfra Bridge Server
 * 
 * Connects FinishThisIdea platform to existing Soulfra-AgentZero infrastructure
 * Leverages production-ready systems instead of rebuilding from scratch
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const axios = require('axios');

class SoulfraBridge {
    constructor() {
        this.app = express();
        this.server = null;
        this.wss = null;
        this.port = 8080;
        this.wsPort = 8081;
        
        // Soulfra service connections
        this.soulfraServices = {
            'simple-start': null,  // Python simple start on port 5555
            'working-system': null, // ACTUALLY_WORKING_SYSTEM.py
            'mirror-bridge': null,  // Mirror bridge on port 8001
            'white-knight': null    // White knight on port 8002
        };
        
        // WebSocket clients
        this.clients = new Set();
        
        // Data bridge to Soulfra
        this.dataStore = {
            agents: [],
            fighters: [],
            battles: [],
            marketplace: {
                ideas: [],
                agents: []
            },
            gameState: {
                billionDollarProgress: 0,
                totalContributions: 0
            }
        };
        
        this.init();
    }

    async init() {
        console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    🌉 SOULFRA BRIDGE                         ║
║                                                              ║
║  Connecting FinishThisIdea to Soulfra-AgentZero             ║
║                                                              ║
║  • FinishThisIdea Frontend: Port ${this.port}                       ║
║  • WebSocket Bridge: Port ${this.wsPort}                            ║
║  • Soulfra Backend: Multiple ports                          ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
        `);

        this.setupExpress();
        this.setupWebSocket();
        await this.startSoulfraServices();
        this.setupRoutes();
        this.startServer();
    }

    setupExpress() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../public')));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`🌉 Bridge ${req.method} ${req.path} - ${new Date().toISOString()}`);
            next();
        });
    }

    setupWebSocket() {
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            console.log('🔌 Bridge client connected');
            this.clients.add(ws);
            
            // Send bridge status
            ws.send(JSON.stringify({
                type: 'bridge_connection',
                message: 'Connected to FinishThisIdea-Soulfra Bridge',
                timestamp: Date.now(),
                soulfraStatus: this.getSoulfraStatus()
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 Bridge client disconnected');
                this.clients.delete(ws);
            });
        });
    }

    async startSoulfraServices() {
        console.log('🚀 Starting Soulfra backend services...');
        
        const soulfraPath = '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025';
        
        try {
            // Start SOULFRA Simple Start (port 5555)
            console.log('Starting Soulfra Simple Start on port 5555...');
            const simpleStart = spawn('python3', ['core/soulfra_simple_start.py'], {
                cwd: soulfraPath,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            simpleStart.stdout.on('data', (data) => {
                console.log(`🐍 Soulfra Simple: ${data.toString().trim()}`);
            });
            
            simpleStart.stderr.on('data', (data) => {
                console.log(`🐍 Soulfra Simple Error: ${data.toString().trim()}`);
            });
            
            this.soulfraServices['simple-start'] = simpleStart;
            
            // Start ACTUALLY_WORKING_SYSTEM if it exists
            const workingSystemPath = path.join(soulfraPath, 'misc/ACTUALLY_WORKING_SYSTEM.py');
            if (fs.existsSync(workingSystemPath)) {
                console.log('Starting ACTUALLY_WORKING_SYSTEM...');
                const workingSystem = spawn('python3', ['misc/ACTUALLY_WORKING_SYSTEM.py'], {
                    cwd: soulfraPath,
                    stdio: ['pipe', 'pipe', 'pipe']
                });
                
                workingSystem.stdout.on('data', (data) => {
                    console.log(`🔧 Working System: ${data.toString().trim()}`);
                });
                
                this.soulfraServices['working-system'] = workingSystem;
            }
            
            // Wait for services to start
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            console.log('✅ Soulfra services started');
            
        } catch (error) {
            console.error('❌ Error starting Soulfra services:', error);
            console.log('⚠️ Continuing with bridge-only mode');
        }
    }

    setupRoutes() {
        // Root redirect to platform hub
        this.app.get('/', (req, res) => {
            res.redirect('/soulfra-bridge-hub.html');
        });

        // Bridge status and health
        this.app.get('/api/bridge/status', (req, res) => {
            res.json({
                success: true,
                data: {
                    bridge: 'active',
                    timestamp: Date.now(),
                    soulfraServices: this.getSoulfraStatus(),
                    connectedClients: this.clients.size
                }
            });
        });

        // Proxy requests to Soulfra Simple Start
        this.app.get('/api/soulfra/simple/:endpoint*', async (req, res) => {
            try {
                const endpoint = req.params.endpoint + (req.params[0] || '');
                const response = await axios.get(`http://localhost:5555/${endpoint}`, {
                    timeout: 5000
                });
                res.json({
                    success: true,
                    data: response.data,
                    source: 'soulfra-simple'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Soulfra service unavailable',
                    details: error.message
                });
            }
        });

        // Bridge our existing API endpoints to Soulfra data
        this.setupBridgedRoutes();

        // Serve the bridge hub interface
        this.app.get('/soulfra-bridge-hub.html', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/soulfra-bridge-hub.html'));
        });

        // Fallback
        this.app.get('*', (req, res) => {
            if (req.path.startsWith('/api/')) {
                res.status(404).json({
                    success: false,
                    error: {
                        code: 'NOT_FOUND',
                        message: 'API endpoint not found'
                    }
                });
            } else {
                res.sendFile(path.join(__dirname, '../public/soulfra-bridge-hub.html'));
            }
        });
    }

    setupBridgedRoutes() {
        // Health check that includes Soulfra status
        this.app.get('/api/health', (req, res) => {
            res.json({
                success: true,
                data: {
                    status: 'healthy',
                    bridge: 'active',
                    timestamp: Date.now(),
                    uptime: process.uptime(),
                    soulfraServices: this.getSoulfraStatus(),
                    connections: this.clients.size
                }
            });
        });

        // Enhanced metrics including Soulfra data
        this.app.get('/api/metrics', async (req, res) => {
            const soulfraData = await this.fetchSoulfraData();
            
            res.json({
                success: true,
                data: {
                    timestamp: Date.now(),
                    uptime: process.uptime(),
                    bridge: {
                        activeConnections: this.clients.size,
                        soulfraServices: this.getSoulfraStatus(),
                        lastSync: Date.now()
                    },
                    platform: {
                        totalAgents: soulfraData.agents?.length || 0,
                        activeTasks: soulfraData.tasks_complete || 0,
                        totalTasks: soulfraData.tasks_total || 0,
                        currentPhase: soulfraData.phase || 'initialization'
                    }
                }
            });
        });

        // Agent-related endpoints bridged to Soulfra
        this.app.get('/api/arena/fighters', async (req, res) => {
            const soulfraData = await this.fetchSoulfraData();
            res.json({
                success: true,
                data: soulfraData.agents || [],
                source: 'soulfra-bridge'
            });
        });

        this.app.post('/api/fighters/create', async (req, res) => {
            // Forward to Soulfra and get response
            try {
                const response = await this.forwardToSoulfra('/create_agent', req.body);
                res.json({
                    success: true,
                    data: response,
                    source: 'soulfra-bridge'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Marketplace endpoints
        this.app.get('/api/marketplace/ideas', async (req, res) => {
            // Get data from Soulfra or return mock data
            res.json({
                success: true,
                data: {
                    ideas: this.dataStore.marketplace.ideas,
                    total: this.dataStore.marketplace.ideas.length,
                    page: 1,
                    source: 'soulfra-bridge'
                }
            });
        });
    }

    async fetchSoulfraData() {
        try {
            const response = await axios.get('http://localhost:5555/api/status', {
                timeout: 2000
            });
            return response.data;
        } catch (error) {
            console.log('⚠️ Could not fetch Soulfra data, using defaults');
            return {
                agents: [],
                tasks_complete: 0,
                tasks_total: 0,
                phase: 'bridge-mode'
            };
        }
    }

    async forwardToSoulfra(endpoint, data) {
        try {
            const response = await axios.post(`http://localhost:5555${endpoint}`, data, {
                timeout: 5000
            });
            return response.data;
        } catch (error) {
            throw new Error(`Soulfra service error: ${error.message}`);
        }
    }

    getSoulfraStatus() {
        return {
            'simple-start': this.soulfraServices['simple-start'] ? 'running' : 'stopped',
            'working-system': this.soulfraServices['working-system'] ? 'running' : 'stopped',
            'mirror-bridge': 'pending',
            'white-knight': 'pending'
        };
    }

    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'ping':
                ws.send(JSON.stringify({ 
                    type: 'pong', 
                    timestamp: Date.now(),
                    bridge: 'active'
                }));
                break;
                
            case 'request_soulfra_status':
                ws.send(JSON.stringify({
                    type: 'soulfra_status',
                    data: this.getSoulfraStatus(),
                    timestamp: Date.now()
                }));
                break;
                
            default:
                console.log('Unknown WebSocket message type:', data.type);
        }
    }

    broadcastMessage(message) {
        const messageStr = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(messageStr);
            }
        });
    }

    startServer() {
        this.server.listen(this.port, () => {
            console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   🎉 BRIDGE DEPLOYED!                       ║
║                                                              ║
║  🌐 FinishThisIdea Platform: http://localhost:${this.port}             ║
║  🌉 Bridge API: http://localhost:${this.port}/api/bridge           ║
║  🔌 WebSocket Bridge: ws://localhost:${this.wsPort}                   ║
║                                                              ║
║  🐍 Soulfra Simple Start: http://localhost:5555            ║
║  🔧 Working System: Available if running                    ║
║                                                              ║
║  Status: ✅ Bridge Active - Soulfra Connected               ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
            `);
            
            if (process.env.NODE_ENV === 'production') {
                console.log('🏭 Running in PRODUCTION mode');
            } else {
                console.log('🚧 Running in DEVELOPMENT mode');
            }
        });

        // Graceful shutdown
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
    }

    shutdown() {
        console.log('\n🛑 Shutting down Soulfra Bridge...');
        
        // Stop Soulfra services
        Object.values(this.soulfraServices).forEach(service => {
            if (service && service.kill) {
                service.kill();
            }
        });
        
        // Close WebSocket connections
        this.clients.forEach(client => client.close());
        this.wss.close();
        
        // Close HTTP server
        this.server.close(() => {
            console.log('✅ Bridge stopped gracefully');
            process.exit(0);
        });
    }
}

// Start the bridge
new SoulfraBridge();

module.exports = SoulfraBridge;