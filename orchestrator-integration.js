#!/usr/bin/env node

/**
 * 🎨 ORCHESTRATOR INTEGRATION LAYER
 * 
 * Properly integrates with existing multi-repo orchestrator system
 * Handles color-coded layers and status page connections
 */

const express = require('express');
const { Pool } = require('pg');
const WebSocket = require('ws');
const path = require('path');

class OrchestratorIntegration {
    constructor() {
        this.app = express();
        this.port = 3006;
        this.layers = {
            blue: { name: 'Database/Storage', port: 5432, status: 'unknown' },
            green: { name: 'API/Service', ports: [3001, 3002], status: 'unknown' },
            yellow: { name: 'Orchestration', port: 3005, status: 'unknown' },
            purple: { name: 'UI/Chat', port: 3006, status: 'starting' },
            orange: { name: 'Real-Estate-Data', port: 3008, status: 'unknown', capabilities: ['scrape-properties', 'analyze-market', 'transcribe-tutorials'] }
        };
        
        this.db = new Pool({
            connectionString: 'postgres://postgres:postgres@localhost:5432/document_generator'
        });
        
        this.setupMiddleware();
        this.setupRoutes();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Layer identification middleware
        this.app.use((req, res, next) => {
            res.setHeader('X-Layer-Color', 'Purple');
            res.setHeader('X-Layer-Name', 'UI-Chat');
            res.setHeader('X-Orchestrator-Connected', 'true');
            next();
        });
    }
    
    setupRoutes() {
        // Orchestrator status endpoint
        this.app.get('/api/orchestrator/status', async (req, res) => {
            const status = await this.checkAllLayers();
            res.json({
                success: true,
                layers: this.layers,
                summary: status,
                timestamp: new Date().toISOString()
            });
        });
        
        // Connect to existing orchestrator
        this.app.post('/api/orchestrator/connect', async (req, res) => {
            try {
                const connectionResult = await this.connectToOrchestrator();
                res.json({
                    success: true,
                    connection: connectionResult,
                    message: 'Connected to multi-repo orchestrator'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Chat with orchestrator integration
        this.app.post('/api/chat/orchestrated', async (req, res) => {
            const { message } = req.body;
            
            // Check orchestrator layer status first
            const orchestratorStatus = await this.checkOrchestratorLayer();
            
            // Generate response with layer-aware context
            const response = await this.generateLayeredResponse(message, orchestratorStatus);
            
            // Save to database with orchestrator metadata
            const chatRecord = await this.saveChatWithOrchestrator(message, response);
            
            res.json({
                success: true,
                message: chatRecord,
                layer: 'purple',
                orchestratorStatus,
                colors: this.getColorsForLayer('purple'),
                sounds: this.getSoundsForLayer('purple')
            });
        });
        
        // Real Estate integration endpoint
        this.app.post('/api/real-estate/connect', async (req, res) => {
            try {
                const realEstateConnection = await this.connectToRealEstate();
                res.json({
                    success: true,
                    realEstate: realEstateConnection,
                    layer: 'orange',
                    message: 'Real Estate Data Service connected'
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Real Estate connection failed'
                });
            }
        });
        
        // Real Estate action proxy endpoint
        this.app.post('/api/real-estate/action', async (req, res) => {
            try {
                const { action, payload } = req.body;
                const result = await this.sendToRealEstateService(action, payload);
                res.json({
                    success: true,
                    result,
                    layer: 'orange',
                    action
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Layer health check
        this.app.get('/api/layers/health', async (req, res) => {
            const health = await this.checkAllLayers();
            res.json({
                success: true,
                layers: health,
                overallStatus: this.calculateOverallHealth(health)
            });
        });
        
        // Serve the integrated interface
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'orchestrated-chat-interface.html'));
        });
    }
    
    async checkAllLayers() {
        const status = {};
        
        // Blue Layer - Database
        try {
            await this.db.query('SELECT 1');
            this.layers.blue.status = 'healthy';
        } catch (error) {
            this.layers.blue.status = 'error';
        }
        
        // Green Layer - API Services
        for (const port of this.layers.green.ports) {
            try {
                const response = await fetch(`http://localhost:${port}/health`, {
                    signal: AbortSignal.timeout(3000)
                });
                this.layers.green.status = response.ok ? 'healthy' : 'warning';
            } catch (error) {
                this.layers.green.status = 'error';
            }
        }
        
        // Yellow Layer - Orchestrator
        try {
            // Try to connect to existing orchestrator on 3005
            const response = await fetch('http://localhost:3005/status', {
                signal: AbortSignal.timeout(3000)
            });
            this.layers.yellow.status = response.ok ? 'healthy' : 'warning';
        } catch (error) {
            this.layers.yellow.status = 'error';
        }
        
        // Orange Layer - Real Estate Data Service
        try {
            const response = await fetch('http://localhost:3008/health', {
                signal: AbortSignal.timeout(3000)
            });
            this.layers.orange.status = response.ok ? 'healthy' : 'warning';
        } catch (error) {
            this.layers.orange.status = 'error';
        }
        
        // Purple Layer - This service
        this.layers.purple.status = 'healthy';
        
        return this.layers;
    }
    
    async connectToOrchestrator() {
        // Try to register with existing orchestrator
        try {
            const response = await fetch('http://localhost:3005/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service: 'chat-system',
                    port: this.port,
                    layer: 'purple',
                    capabilities: ['chat', 'database', 'ui', 'realtime', 'real-estate-integration']
                })
            });
            
            if (response.ok) {
                return { connected: true, orchestrator: 'multi-repo', port: 3005 };
            }
        } catch (error) {
            console.log('🟨 Orchestrator on 3005 not available, running standalone');
        }
        
        return { connected: false, mode: 'standalone' };
    }
    
    async connectToRealEstate() {
        // Connect to Real Estate Data Service
        try {
            const response = await fetch('http://localhost:3008/health');
            if (response.ok) {
                const healthData = await response.json();
                return {
                    connected: true,
                    endpoint: 'http://localhost:3008',
                    capabilities: healthData.capabilities || ['scrape-properties', 'analyze-market', 'transcribe-tutorials'],
                    status: healthData.status
                };
            } else {
                throw new Error('Health check failed');
            }
        } catch (error) {
            throw new Error('Real Estate service connection failed');
        }
    }
    
    async sendToRealEstateService(action, payload) {
        // Send action to real estate service
        try {
            const response = await fetch('http://localhost:3008/api/infinity-action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    sourceMirror: 'orchestrator-integration',
                    targetMirrors: ['document-generator'],
                    payload
                })
            });
            
            if (response.ok) {
                return await response.json();
            } else {
                throw new Error(`Real Estate service returned ${response.status}`);
            }
        } catch (error) {
            throw new Error(`Failed to send to Real Estate service: ${error.message}`);
        }
    }
    
    async checkOrchestratorLayer() {
        // Check if we can reach the orchestrator layer
        try {
            const response = await fetch('http://localhost:3005/api/status', {
                signal: AbortSignal.timeout(2000)
            });
            return response.ok ? 'connected' : 'degraded';
        } catch (error) {
            return 'disconnected';
        }
    }
    
    async generateLayeredResponse(message, orchestratorStatus) {
        // Generate response based on layer status and orchestrator connectivity
        if (orchestratorStatus === 'connected') {
            return `🎨 [Layer: Purple] Connected to orchestrator! Your message: "${message}" is being processed across all layers.`;
        } else if (orchestratorStatus === 'degraded') {
            return `🟨 [Layer: Yellow] Orchestrator connection degraded. Processing "${message}" in standalone mode.`;
        } else {
            return `🟪 [Layer: Purple] Operating standalone. Your message: "${message}" saved to local database.`;
        }
    }
    
    async saveChatWithOrchestrator(message, response) {
        const result = await this.db.query(
            `INSERT INTO chat_messages (user_message, ai_response, layer_status, orchestrator_connected, timestamp) 
             VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
            [message, response, 'purple', await this.checkOrchestratorLayer()]
        );
        return result.rows[0];
    }
    
    getColorsForLayer(layer) {
        const colors = {
            blue: { background: '#3b82f6', text: '#ffffff', border: '#1d4ed8' },
            green: { background: '#10b981', text: '#ffffff', border: '#047857' },
            yellow: { background: '#f59e0b', text: '#000000', border: '#d97706' },
            purple: { background: '#8b5cf6', text: '#ffffff', border: '#7c3aed' },
            orange: { background: '#f97316', text: '#ffffff', border: '#ea580c' }
        };
        return colors[layer] || colors.purple;
    }
    
    getSoundsForLayer(layer) {
        const sounds = {
            blue: ['database-connect'],
            green: ['api-success'],
            yellow: ['orchestrator-ping'],
            purple: ['chat-message'],
            orange: ['real-estate-scrape', 'property-found', 'market-analysis']
        };
        return sounds[layer] || ['chat-message'];
    }
    
    calculateOverallHealth(layers) {
        const healthyCount = Object.values(layers).filter(layer => layer.status === 'healthy').length;
        const totalLayers = Object.keys(layers).length;
        const healthPercentage = (healthyCount / totalLayers) * 100;
        
        if (healthPercentage >= 80) return 'healthy';
        if (healthPercentage >= 60) return 'warning';
        return 'critical';
    }
    
    async start() {
        // Initialize database tables
        await this.db.query(`
            CREATE TABLE IF NOT EXISTS chat_messages (
                id SERIAL PRIMARY KEY,
                user_message TEXT NOT NULL,
                ai_response TEXT,
                layer_status VARCHAR(20) DEFAULT 'purple',
                orchestrator_connected VARCHAR(20),
                timestamp TIMESTAMP DEFAULT NOW()
            );
        `);
        
        // Try to connect to orchestrator
        const orchestratorConnection = await this.connectToOrchestrator();
        
        this.app.listen(this.port, () => {
            console.log(`🎨 Orchestrator Integration running at http://localhost:${this.port}`);
            console.log(`🟪 Layer: Purple (UI/Chat)`);
            console.log(`🟨 Orchestrator: ${orchestratorConnection.connected ? 'Connected' : 'Standalone'}`);
            console.log(`🎯 Color System: Blue→Green→Yellow→Purple→Orange`);
        });
        
        // Start layer monitoring
        setInterval(() => {
            this.checkAllLayers();
        }, 30000); // Check every 30 seconds
    }
}

// Start the integration layer
const integration = new OrchestratorIntegration();
integration.start().catch(console.error);

module.exports = OrchestratorIntegration;