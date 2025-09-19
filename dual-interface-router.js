#!/usr/bin/env node

/**
 * 🎭 DUAL INTERFACE ROUTER
 * 
 * Routes between two distinct interface experiences:
 * - Deep Diagnostic (AI side): Technical depth, error tracking, connection mapping
 * - Surface Elegant (Human side): Simplified, animated, colorful experience
 * 
 * Features:
 * - Adaptive mode switching based on user behavior
 * - Shared state management between interfaces
 * - Real-time synchronization
 * - Protective buffering between layers
 */

const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const { Pool } = require('pg');

class DualInterfaceRouter {
    constructor() {
        this.app = express();
        this.port = 3007;
        this.wsPort = 8082;
        
        // Shared state between interfaces
        this.sharedState = {
            currentMode: 'surface', // 'surface' or 'deep'
            userBehavior: {
                errorCount: 0,
                complexityPreference: 'simple',
                lastMode: 'surface',
                sessionTime: 0
            },
            systemHealth: {
                layers: {},
                connections: {},
                buffers: {},
                errors: []
            },
            activeConnections: new Set()
        };
        
        this.db = new Pool({
            connectionString: 'postgres://postgres:postgres@localhost:5432/document_generator'
        });
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'dual-interface')));
        
        // Interface detection middleware
        this.app.use((req, res, next) => {
            const userAgent = req.headers['user-agent'] || '';
            const mode = req.query.mode || this.sharedState.currentMode;
            
            // Set interface headers
            res.setHeader('X-Interface-Mode', mode);
            res.setHeader('X-Layer-System', 'Dual-Interface');
            res.setHeader('X-Buffer-Status', 'Active');
            
            req.interfaceMode = mode;
            next();
        });
        
        // Error tracking middleware
        this.app.use((req, res, next) => {
            res.on('finish', () => {
                if (res.statusCode >= 400) {
                    this.trackError(req, res);
                }
            });
            next();
        });
    }
    
    setupRoutes() {
        // Main interface router
        this.app.get('/', (req, res) => {
            const mode = req.query.mode || this.determineOptimalMode(req);
            
            if (mode === 'deep') {
                res.sendFile(path.join(__dirname, 'dual-interface', 'deep-diagnostic.html'));
            } else {
                res.sendFile(path.join(__dirname, 'dual-interface', 'surface-elegant.html'));
            }
        });
        
        // Interface mode switching
        this.app.post('/api/interface/switch', async (req, res) => {
            const { mode, reason } = req.body;
            
            if (mode === 'deep' || mode === 'surface') {
                this.sharedState.currentMode = mode;
                this.sharedState.userBehavior.lastMode = mode;
                
                // Track mode switch
                await this.trackModeSwitch(mode, reason);
                
                // Broadcast to all connected clients
                this.broadcastStateUpdate();
                
                res.json({
                    success: true,
                    mode,
                    sharedState: this.sharedState
                });
            } else {
                res.status(400).json({ error: 'Invalid mode' });
            }
        });
        
        // Shared state endpoint
        this.app.get('/api/interface/state', (req, res) => {
            res.json({
                success: true,
                state: this.sharedState,
                recommendations: this.getInterfaceRecommendations()
            });
        });
        
        // System health for deep interface
        this.app.get('/api/deep/system-health', async (req, res) => {
            const health = await this.getDeepSystemHealth();
            res.json({
                success: true,
                health,
                connections: this.mapConnections(),
                buffers: this.getBufferStatus()
            });
        });
        
        // Error depth analysis
        this.app.get('/api/deep/error-analysis', async (req, res) => {
            const analysis = await this.getErrorDepthAnalysis();
            res.json({
                success: true,
                analysis,
                propagation: this.getErrorPropagation(),
                shields: this.getShieldStatus()
            });
        });
        
        // Surface interface simplified data
        this.app.get('/api/surface/status', (req, res) => {
            const simplified = this.getSimplifiedStatus();
            res.json({
                success: true,
                status: simplified,
                animations: this.getAnimationTriggers(),
                celebrations: this.getCelebrationData()
            });
        });
        
        // User behavior tracking
        this.app.post('/api/interface/behavior', async (req, res) => {
            const { action, context, performance } = req.body;
            
            await this.trackUserBehavior(action, context, performance);
            
            // Update interface recommendations
            const recommendations = this.getInterfaceRecommendations();
            
            res.json({
                success: true,
                recommendations,
                currentMode: this.sharedState.currentMode
            });
        });
        
        // Connection mapping (sat → bit → anchor → thunderbolt)
        this.app.get('/api/connections/map', async (req, res) => {
            const connectionMap = await this.buildConnectionMap();
            res.json({
                success: true,
                map: connectionMap,
                flows: this.getDataFlows(),
                anchors: this.getAnchorPoints()
            });
        });
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            const connectionId = this.generateConnectionId();
            this.sharedState.activeConnections.add(connectionId);
            
            ws.connectionId = connectionId;
            ws.interfaceMode = req.url.includes('deep') ? 'deep' : 'surface';
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'state-sync',
                state: this.sharedState,
                connectionId
            }));
            
            // Handle messages
            ws.on('message', (message) => {
                this.handleWebSocketMessage(ws, JSON.parse(message));
            });
            
            // Handle disconnect
            ws.on('close', () => {
                this.sharedState.activeConnections.delete(connectionId);
                this.broadcastStateUpdate();
            });
        });
        
        console.log(`🔌 WebSocket server running on port ${this.wsPort}`);
    }
    
    determineOptimalMode(req) {
        const behavior = this.sharedState.userBehavior;
        
        // If errors are frequent, suggest deep mode
        if (behavior.errorCount > 3) {
            return 'deep';
        }
        
        // If user prefers complexity, suggest deep mode
        if (behavior.complexityPreference === 'complex') {
            return 'deep';
        }
        
        // Default to surface for simplicity
        return 'surface';
    }
    
    async getDeepSystemHealth() {
        // Deep system analysis for technical interface
        return {
            services: await this.analyzeServiceHealth(),
            connections: await this.analyzeConnections(),
            performance: await this.analyzePerformance(),
            errors: await this.getErrorDepths(),
            buffers: await this.getBufferHealth()
        };
    }
    
    getSimplifiedStatus() {
        // Simplified status for elegant interface
        const health = this.sharedState.systemHealth;
        const overallHealth = this.calculateOverallHealth(health);
        
        return {
            status: overallHealth > 80 ? 'excellent' : overallHealth > 60 ? 'good' : 'attention-needed',
            progress: this.getSimplifiedProgress(),
            message: this.getStatusMessage(overallHealth),
            nextStep: this.getNextStep()
        };
    }
    
    async buildConnectionMap() {
        // Build satellite → bit → anchor → thunderbolt connection mapping
        return {
            satellite: {
                endpoints: ['api-gateway', 'load-balancer'],
                connections: ['bit-layer']
            },
            bit: {
                processors: ['document-parser', 'ai-router', 'template-engine'],
                connections: ['anchor-layer']
            },
            anchor: {
                storage: ['database', 'redis', 'file-system'],
                connections: ['thunderbolt-layer']
            },
            thunderbolt: {
                outputs: ['generated-mvp', 'deployed-app', 'documentation'],
                speed: 'high-performance'
            }
        };
    }
    
    trackError(req, res) {
        this.sharedState.userBehavior.errorCount++;
        this.sharedState.systemHealth.errors.push({
            timestamp: new Date(),
            path: req.path,
            status: res.statusCode,
            userAgent: req.headers['user-agent']
        });
        
        // Suggest deep mode if errors are frequent
        if (this.sharedState.userBehavior.errorCount > 2) {
            this.suggestModeSwitch('deep', 'frequent-errors');
        }
    }
    
    suggestModeSwitch(mode, reason) {
        this.broadcastToAllClients({
            type: 'mode-suggestion',
            suggestedMode: mode,
            reason,
            currentMode: this.sharedState.currentMode
        });
    }
    
    broadcastStateUpdate() {
        this.broadcastToAllClients({
            type: 'state-update',
            state: this.sharedState
        });
    }
    
    broadcastToAllClients(message) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
    
    generateConnectionId() {
        return 'conn_' + Math.random().toString(36).substr(2, 9);
    }
    
    async start() {
        // Initialize database tables
        await this.db.query(`
            CREATE TABLE IF NOT EXISTS interface_sessions (
                id SERIAL PRIMARY KEY,
                mode VARCHAR(20) NOT NULL,
                user_behavior JSONB DEFAULT '{}',
                errors JSONB DEFAULT '[]',
                performance_metrics JSONB DEFAULT '{}',
                timestamp TIMESTAMP DEFAULT NOW()
            );
            
            CREATE TABLE IF NOT EXISTS connection_map (
                id SERIAL PRIMARY KEY,
                layer VARCHAR(50) NOT NULL,
                connections JSONB DEFAULT '{}',
                health_status VARCHAR(20) DEFAULT 'unknown',
                last_check TIMESTAMP DEFAULT NOW()
            );
        `);
        
        // Start health monitoring
        setInterval(() => {
            this.updateSystemHealth();
        }, 10000); // Every 10 seconds
        
        this.app.listen(this.port, () => {
            console.log(`🎭 Dual Interface Router running at http://localhost:${this.port}`);
            console.log(`🔍 Deep Diagnostic: http://localhost:${this.port}?mode=deep`);
            console.log(`🎨 Surface Elegant: http://localhost:${this.port}?mode=surface`);
            console.log(`🔌 WebSocket: ws://localhost:${this.wsPort}`);
        });
    }
    
    async updateSystemHealth() {
        // Update shared state with current system health
        try {
            const health = await this.getDeepSystemHealth();
            this.sharedState.systemHealth = health;
            this.broadcastStateUpdate();
        } catch (error) {
            console.error('Health update failed:', error);
        }
    }
}

// Start the dual interface router
const router = new DualInterfaceRouter();
router.start().catch(console.error);

module.exports = DualInterfaceRouter;