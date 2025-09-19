#!/usr/bin/env node

/**
 * MODEL-MANAGER.js
 * Poetry/LoRAX-style model orchestration system for Cal Agent Ecosystem
 * Manages model deployment, fine-tuning, health checks, and cost optimization
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const express = require('express');
const toml = require('@iarna/toml');
const axios = require('axios');
const { WebSocketServer } = require('ws');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

class ModelManager {
    constructor() {
        this.config = null;
        this.db = null;
        this.server = null;
        this.wss = null;
        this.healthChecks = new Map();
        this.modelStates = new Map();
        this.deploymentHistory = [];
        this.costTracker = {
            daily: 0,
            total: 0,
            byModel: new Map(),
            byAgent: new Map()
        };
        
        // Initialize
        this.init();
    }

    async init() {
        console.log('🤖 Initializing Model Manager...');
        
        try {
            // Load configuration
            await this.loadConfig();
            
            // Setup database
            await this.setupDatabase();
            
            // Setup HTTP server
            await this.setupServer();
            
            // Setup WebSocket for real-time updates
            await this.setupWebSocket();
            
            // Start model health checks
            await this.startHealthChecks();
            
            // Initial model deployment
            await this.deployModels();
            
            console.log('🚀 Model Manager ready!');
            console.log(`📊 Dashboard: http://localhost:${this.config.deployment?.docker?.health_check_port || 3004}`);
            console.log(`📡 WebSocket: ws://localhost:${this.config.deployment?.docker?.health_check_port || 3004}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize Model Manager:', error);
            process.exit(1);
        }
    }

    async loadConfig() {
        const configPath = process.env.MODELS_CONFIG_PATH || './models.toml';
        
        try {
            const configContent = await fs.readFile(configPath, 'utf8');
            this.config = toml.parse(configContent);
            console.log('✅ Loaded models.toml configuration');
            
            // Validate configuration
            this.validateConfig();
            
        } catch (error) {
            throw new Error(`Failed to load configuration: ${error.message}`);
        }
    }

    validateConfig() {
        // Check required sections
        const required = ['agents', 'deployment', 'registry'];
        for (const section of required) {
            if (!this.config[section]) {
                throw new Error(`Missing required section: ${section}`);
            }
        }
        
        // Validate Ollama instances
        if (!this.config.deployment.ollama?.instances) {
            throw new Error('No Ollama instances configured');
        }
        
        console.log('✅ Configuration validated');
    }

    async setupDatabase() {
        const dbPath = './data/model_manager.db';
        
        // Ensure data directory exists
        await fs.mkdir('./data', { recursive: true });
        
        this.db = new sqlite3.Database(dbPath);
        const dbRun = promisify(this.db.run.bind(this.db));
        const dbGet = promisify(this.db.get.bind(this.db));
        const dbAll = promisify(this.db.all.bind(this.db));
        
        // Create tables
        await dbRun(`
            CREATE TABLE IF NOT EXISTS model_deployments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT NOT NULL,
                model_name TEXT NOT NULL,
                instance_name TEXT NOT NULL,
                status TEXT NOT NULL,
                deployed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                health_status TEXT DEFAULT 'unknown',
                last_health_check DATETIME,
                resource_usage TEXT,
                performance_metrics TEXT
            )
        `);
        
        await dbRun(`
            CREATE TABLE IF NOT EXISTS model_usage (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id TEXT NOT NULL,
                model_name TEXT NOT NULL,
                requests INTEGER DEFAULT 0,
                total_tokens INTEGER DEFAULT 0,
                total_cost REAL DEFAULT 0.0,
                avg_latency REAL DEFAULT 0.0,
                success_rate REAL DEFAULT 1.0,
                last_used DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await dbRun(`
            CREATE TABLE IF NOT EXISTS fine_tuning_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                base_model TEXT NOT NULL,
                output_name TEXT NOT NULL,
                training_file TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                progress REAL DEFAULT 0.0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                started_at DATETIME,
                completed_at DATETIME,
                config TEXT,
                metrics TEXT
            )
        `);
        
        this.dbRun = dbRun;
        this.dbGet = dbGet;
        this.dbAll = dbAll;
        
        console.log('✅ Database initialized');
    }

    async setupServer() {
        const app = express();
        app.use(express.json());
        app.use(express.static('./public'));
        
        // Model status endpoint
        app.get('/api/models', async (req, res) => {
            try {
                const models = await this.getModelStatus();
                res.json({ success: true, models });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Agent status endpoint
        app.get('/api/agents', async (req, res) => {
            try {
                const agents = await this.getAgentStatus();
                res.json({ success: true, agents });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Deploy model endpoint
        app.post('/api/deploy', async (req, res) => {
            try {
                const { agentId, modelName, instanceName } = req.body;
                await this.deployModel(agentId, modelName, instanceName);
                res.json({ success: true, message: 'Model deployment started' });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Fine-tuning endpoint
        app.post('/api/finetune', async (req, res) => {
            try {
                const { baseModel, outputName, trainingFile, config } = req.body;
                const jobId = await this.startFineTuning(baseModel, outputName, trainingFile, config);
                res.json({ success: true, jobId });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Health check endpoint
        app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                models_deployed: this.modelStates.size
            });
        });
        
        // Cost analytics endpoint
        app.get('/api/costs', async (req, res) => {
            try {
                const costs = await this.getCostAnalytics();
                res.json({ success: true, costs });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        const port = process.env.PORT || 3004;
        this.server = app.listen(port, () => {
            console.log(`✅ HTTP Server listening on port ${port}`);
        });
    }

    async setupWebSocket() {
        this.wss = new WebSocketServer({ server: this.server });
        
        this.wss.on('connection', (ws) => {
            console.log('📡 Dashboard connected');
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'initial_state',
                models: Array.from(this.modelStates.entries()),
                costs: this.costTracker
            }));
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: error.message
                    }));
                }
            });
        });
        
        console.log('✅ WebSocket server ready');
    }

    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'get_model_status':
                const status = await this.getModelStatus();
                ws.send(JSON.stringify({
                    type: 'model_status',
                    status
                }));
                break;
                
            case 'deploy_model':
                await this.deployModel(data.agentId, data.modelName, data.instanceName);
                ws.send(JSON.stringify({
                    type: 'deployment_started',
                    agentId: data.agentId,
                    modelName: data.modelName
                }));
                break;
                
            case 'health_check':
                await this.performHealthCheck(data.instanceName);
                break;
        }
    }

    async startHealthChecks() {
        const instances = this.config.deployment.ollama.instances;
        
        for (const instance of instances) {
            // Start health check for each instance
            this.startInstanceHealthCheck(instance);
        }
        
        console.log(`✅ Started health checks for ${instances.length} Ollama instances`);
    }

    startInstanceHealthCheck(instance) {
        const checkInterval = this.config.monitoring?.health_check_interval || 30000;
        
        const performCheck = async () => {
            try {
                const url = `http://localhost:${instance.port}/api/tags`;
                const response = await axios.get(url, { timeout: 5000 });
                
                const healthData = {
                    status: 'healthy',
                    models: response.data.models || [],
                    lastCheck: new Date(),
                    responseTime: Date.now() - startTime
                };
                
                this.healthChecks.set(instance.name, healthData);
                
                // Update database
                await this.updateHealthStatus(instance.name, 'healthy', healthData);
                
                // Broadcast to WebSocket clients
                this.broadcast({
                    type: 'health_update',
                    instance: instance.name,
                    health: healthData
                });
                
            } catch (error) {
                const healthData = {
                    status: 'unhealthy',
                    error: error.message,
                    lastCheck: new Date()
                };
                
                this.healthChecks.set(instance.name, healthData);
                
                // Update database
                await this.updateHealthStatus(instance.name, 'unhealthy', healthData);
                
                // Broadcast to WebSocket clients
                this.broadcast({
                    type: 'health_update',
                    instance: instance.name,
                    health: healthData
                });
                
                console.warn(`⚠️  Health check failed for ${instance.name}:`, error.message);
            }
        };
        
        // Initial check
        const startTime = Date.now();
        performCheck();
        
        // Schedule recurring checks
        setInterval(performCheck, checkInterval);
    }

    async deployModels() {
        console.log('🚀 Starting model deployment...');
        
        const agents = Object.entries(this.config.agents);
        const instances = this.config.deployment.ollama.instances;
        
        for (const [agentId, agentConfig] of agents) {
            // Find corresponding Ollama instance
            const instanceName = `${agentId}-ollama`;
            const instance = instances.find(i => i.name === instanceName);
            
            if (!instance) {
                console.warn(`⚠️  No Ollama instance found for agent: ${agentId}`);
                continue;
            }
            
            // Deploy preferred models
            const preferredModel = agentConfig.models[0]; // Highest priority model
            if (preferredModel.provider === 'ollama') {
                await this.deployModel(agentId, preferredModel.name, instanceName);
            }
        }
        
        console.log('✅ Initial model deployment completed');
    }

    async deployModel(agentId, modelName, instanceName) {
        try {
            console.log(`🚀 Deploying ${modelName} for ${agentId} on ${instanceName}...`);
            
            // Find instance configuration
            const instance = this.config.deployment.ollama.instances.find(i => i.name === instanceName);
            if (!instance) {
                throw new Error(`Instance ${instanceName} not found`);
            }
            
            // Pull model if needed
            await this.pullModel(instance.port, modelName);
            
            // Update deployment record
            await this.dbRun(`
                INSERT OR REPLACE INTO model_deployments 
                (agent_id, model_name, instance_name, status)
                VALUES (?, ?, ?, 'deployed')
            `, [agentId, modelName, instanceName]);
            
            // Update model state
            this.modelStates.set(`${agentId}-${modelName}`, {
                agentId,
                modelName,
                instanceName,
                status: 'deployed',
                deployedAt: new Date(),
                endpoint: `http://localhost:${instance.port}`
            });
            
            // Broadcast deployment success
            this.broadcast({
                type: 'model_deployed',
                agentId,
                modelName,
                instanceName,
                endpoint: `http://localhost:${instance.port}`
            });
            
            console.log(`✅ Successfully deployed ${modelName} for ${agentId}`);
            
        } catch (error) {
            console.error(`❌ Failed to deploy ${modelName} for ${agentId}:`, error);
            
            // Update deployment record with error
            await this.dbRun(`
                INSERT OR REPLACE INTO model_deployments 
                (agent_id, model_name, instance_name, status)
                VALUES (?, ?, ?, 'failed')
            `, [agentId, modelName, instanceName]);
            
            throw error;
        }
    }

    async pullModel(port, modelName) {
        try {
            console.log(`📥 Pulling model ${modelName} on port ${port}...`);
            
            const response = await axios.post(
                `http://localhost:${port}/api/pull`,
                { name: modelName },
                { 
                    timeout: 300000, // 5 minutes
                    responseType: 'stream'
                }
            );
            
            // Stream the pull progress
            response.data.on('data', (chunk) => {
                const lines = chunk.toString().split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.status) {
                            console.log(`📥 ${modelName}: ${data.status}`);
                            
                            // Broadcast progress
                            this.broadcast({
                                type: 'model_pull_progress',
                                modelName,
                                progress: data
                            });
                        }
                    } catch (e) {
                        // Ignore malformed JSON
                    }
                }
            });
            
            return new Promise((resolve, reject) => {
                response.data.on('end', () => {
                    console.log(`✅ Successfully pulled ${modelName}`);
                    resolve();
                });
                
                response.data.on('error', reject);
            });
            
        } catch (error) {
            console.error(`❌ Failed to pull ${modelName}:`, error.message);
            throw error;
        }
    }

    async startFineTuning(baseModel, outputName, trainingFile, config = {}) {
        try {
            console.log(`🎯 Starting fine-tuning: ${baseModel} -> ${outputName}`);
            
            // Record fine-tuning job
            const result = await this.dbRun(`
                INSERT INTO fine_tuning_jobs 
                (base_model, output_name, training_file, config, status)
                VALUES (?, ?, ?, ?, 'started')
            `, [baseModel, outputName, trainingFile, JSON.stringify(config)]);
            
            const jobId = result.lastID;
            
            // Start fine-tuning process (simplified)
            this.performFineTuning(jobId, baseModel, outputName, trainingFile, config);
            
            return jobId;
            
        } catch (error) {
            console.error(`❌ Failed to start fine-tuning:`, error);
            throw error;
        }
    }

    async performFineTuning(jobId, baseModel, outputName, trainingFile, config) {
        try {
            // Update job status
            await this.dbRun(`
                UPDATE fine_tuning_jobs 
                SET status = 'training', started_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `, [jobId]);
            
            // Broadcast training started
            this.broadcast({
                type: 'fine_tuning_started',
                jobId,
                baseModel,
                outputName
            });
            
            // Simulate fine-tuning progress
            for (let progress = 0; progress <= 100; progress += 10) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
                
                // Update progress
                await this.dbRun(`
                    UPDATE fine_tuning_jobs 
                    SET progress = ?
                    WHERE id = ?
                `, [progress / 100, jobId]);
                
                // Broadcast progress
                this.broadcast({
                    type: 'fine_tuning_progress',
                    jobId,
                    progress: progress / 100,
                    baseModel,
                    outputName
                });
            }
            
            // Mark as completed
            await this.dbRun(`
                UPDATE fine_tuning_jobs 
                SET status = 'completed', completed_at = CURRENT_TIMESTAMP, progress = 1.0
                WHERE id = ?
            `, [jobId]);
            
            // Broadcast completion
            this.broadcast({
                type: 'fine_tuning_completed',
                jobId,
                baseModel,
                outputName
            });
            
            console.log(`✅ Fine-tuning completed: ${outputName}`);
            
        } catch (error) {
            console.error(`❌ Fine-tuning failed for job ${jobId}:`, error);
            
            // Mark as failed
            await this.dbRun(`
                UPDATE fine_tuning_jobs 
                SET status = 'failed'
                WHERE id = ?
            `, [jobId]);
            
            // Broadcast failure
            this.broadcast({
                type: 'fine_tuning_failed',
                jobId,
                error: error.message
            });
        }
    }

    async getModelStatus() {
        const models = [];
        
        for (const [key, state] of this.modelStates.entries()) {
            const health = this.healthChecks.get(state.instanceName) || { status: 'unknown' };
            
            models.push({
                ...state,
                health: health.status,
                lastHealthCheck: health.lastCheck,
                responseTime: health.responseTime
            });
        }
        
        return models;
    }

    async getAgentStatus() {
        const agents = [];
        
        for (const [agentId, agentConfig] of Object.entries(this.config.agents)) {
            const models = await this.dbAll(`
                SELECT * FROM model_deployments 
                WHERE agent_id = ? AND status = 'deployed'
            `, [agentId]);
            
            const usage = await this.dbGet(`
                SELECT * FROM model_usage 
                WHERE agent_id = ?
            `, [agentId]) || {};
            
            agents.push({
                id: agentId,
                name: agentConfig.display_name,
                role: agentConfig.role,
                capabilities: agentConfig.capabilities,
                models: models,
                usage: {
                    requests: usage.requests || 0,
                    totalTokens: usage.total_tokens || 0,
                    totalCost: usage.total_cost || 0,
                    successRate: usage.success_rate || 1.0
                }
            });
        }
        
        return agents;
    }

    async getCostAnalytics() {
        const daily = await this.dbGet(`
            SELECT 
                SUM(total_cost) as daily_cost,
                SUM(total_tokens) as daily_tokens,
                COUNT(*) as daily_requests
            FROM model_usage 
            WHERE DATE(last_used) = DATE('now')
        `) || {};
        
        const byModel = await this.dbAll(`
            SELECT 
                model_name,
                SUM(total_cost) as cost,
                SUM(total_tokens) as tokens,
                SUM(requests) as requests
            FROM model_usage 
            GROUP BY model_name
        `);
        
        const byAgent = await this.dbAll(`
            SELECT 
                agent_id,
                SUM(total_cost) as cost,
                SUM(total_tokens) as tokens,
                SUM(requests) as requests
            FROM model_usage 
            GROUP BY agent_id
        `);
        
        return {
            daily: {
                cost: daily.daily_cost || 0,
                tokens: daily.daily_tokens || 0,
                requests: daily.daily_requests || 0
            },
            byModel: byModel.reduce((acc, row) => {
                acc[row.model_name] = {
                    cost: row.cost,
                    tokens: row.tokens,
                    requests: row.requests
                };
                return acc;
            }, {}),
            byAgent: byAgent.reduce((acc, row) => {
                acc[row.agent_id] = {
                    cost: row.cost,
                    tokens: row.tokens,
                    requests: row.requests
                };
                return acc;
            }, {})
        };
    }

    async updateHealthStatus(instanceName, status, data) {
        try {
            await this.dbRun(`
                UPDATE model_deployments 
                SET health_status = ?, last_health_check = CURRENT_TIMESTAMP,
                    performance_metrics = ?
                WHERE instance_name = ?
            `, [status, JSON.stringify(data), instanceName]);
        } catch (error) {
            console.error('Failed to update health status:', error);
        }
    }

    broadcast(message) {
        if (!this.wss) return;
        
        this.wss.clients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(JSON.stringify(message));
            }
        });
    }

    async shutdown() {
        console.log('🔄 Shutting down Model Manager...');
        
        if (this.server) {
            this.server.close();
        }
        
        if (this.db) {
            this.db.close();
        }
        
        console.log('✅ Model Manager shutdown complete');
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    if (global.modelManager) {
        await global.modelManager.shutdown();
    }
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    if (global.modelManager) {
        await global.modelManager.shutdown();
    }
    process.exit(0);
});

// Start the Model Manager
if (require.main === module) {
    global.modelManager = new ModelManager();
}

module.exports = ModelManager;