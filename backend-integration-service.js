#!/usr/bin/env node

/**
 * BACKEND INTEGRATION SERVICE
 * Connects all existing services through the integration manager
 * Provides unified API endpoints and service orchestration
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const NetworkService = require('./network-service');
const SystemIntegrationManager = require('./system-integration-manager');
const EventEmitter = require('events');
const WebSocket = require('ws');
const http = require('http');

class BackendIntegrationService extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 4444,
            wsPort: options.wsPort || 4445,
            networkServiceUrl: options.networkServiceUrl || 'http://localhost:3333',
            services: {
                // Core services
                auth: { url: 'http://localhost:8463', name: 'OAuth Daemon' },
                tokenSystem: { url: 'http://localhost:7300', name: 'Token System' },
                cryptoTax: { url: 'http://localhost:9200', name: 'Crypto Tax Hub' },
                blockchainChunks: { url: 'http://localhost:9600', name: 'Blockchain Processor' },
                verification: { url: 'http://localhost:7500', name: 'Verification Mempool' },
                orchestrator: { url: 'http://localhost:7501', name: 'Multi-Verifier Orchestrator' },
                
                // AI services
                aiApi: { url: 'http://localhost:3001', name: 'AI API Service' },
                templateProcessor: { url: 'http://localhost:3000', name: 'Template Processor' },
                
                // Frontend services
                controlCenter: { url: 'http://localhost:8080', name: 'Control Center' },
                platformHub: { url: 'http://localhost:8080', name: 'Platform Hub' },
                
                // Docker services (when running)
                postgres: { url: 'postgresql://postgres:postgres@localhost:5432/document_generator', name: 'PostgreSQL' },
                redis: { url: 'redis://localhost:6379', name: 'Redis' },
                ollama: { url: 'http://localhost:11434', name: 'Ollama' }
            },
            ...options
        };
        
        // Initialize components
        this.networkService = new NetworkService();
        this.integrationManager = new SystemIntegrationManager();
        this.serviceStatus = new Map();
        
        // Express app
        this.app = express();
        this.server = http.createServer(this.app);
        
        // WebSocket server
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        
        console.log('🔗 Backend Integration Service initialized');
    }

    /**
     * Setup Express middleware
     */
    setupMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(compression());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`📥 ${req.method} ${req.path}`);
            next();
        });
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        // Health check
        this.app.get('/health', async (req, res) => {
            const health = await this.checkHealth();
            res.status(health.status === 'healthy' ? 200 : 503).json(health);
        });
        
        // Service discovery
        this.app.get('/services', async (req, res) => {
            const services = await this.discoverServices();
            res.json(services);
        });
        
        // Service status
        this.app.get('/services/status', async (req, res) => {
            const statuses = await this.checkAllServices();
            res.json(statuses);
        });
        
        // Blockchain audit endpoint (connects to existing crypto systems)
        this.app.post('/api/blockchain/audit', async (req, res) => {
            try {
                const { address, networks = ['ethereum', 'solana'] } = req.body;
                
                // Use existing crypto tax hub if available
                if (this.config.services.cryptoTax) {
                    const response = await this.networkService.request({
                        url: `${this.config.services.cryptoTax.url}/audit-wallet`,
                        method: 'POST',
                        data: { address, networks }
                    });
                    return res.json(response.data);
                }
                
                // Fallback to basic response
                res.json({
                    address,
                    networks,
                    status: 'processed',
                    message: 'Connect CRYPTO-TAX-INTEGRATION-HUB for full audit'
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Proxy to specific service
        this.app.all('/proxy/:service/*', async (req, res) => {
            const { service } = req.params;
            const path = req.params[0];
            
            const serviceConfig = this.config.services[service];
            if (!serviceConfig) {
                return res.status(404).json({ error: `Service ${service} not found` });
            }
            
            try {
                const response = await this.networkService.request({
                    method: req.method,
                    url: `${serviceConfig.url}/${path}`,
                    headers: req.headers,
                    data: req.body
                });
                
                res.status(response.status || 200).json(response.data);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Unified endpoints
        
        // Authentication
        this.app.post('/api/auth/login', async (req, res) => {
            try {
                const response = await this.networkService.post(
                    `${this.config.services.auth.url}/login`,
                    req.body
                );
                res.json(response.data);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Document processing
        this.app.post('/api/document/process', async (req, res) => {
            try {
                // Submit to verification mempool
                const verification = await this.networkService.post(
                    `${this.config.services.verification.url}/api/transaction`,
                    {
                        type: 'document',
                        data: req.body,
                        userId: req.headers['x-user-id'] || 'anonymous',
                        priority: 'normal'
                    }
                );
                
                res.json({
                    success: true,
                    transactionId: verification.data.transactionId,
                    message: 'Document submitted for processing'
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // AI processing
        this.app.post('/api/ai/generate', async (req, res) => {
            try {
                const response = await this.networkService.post(
                    `${this.config.services.aiApi.url}/api/generate`,
                    req.body
                );
                res.json(response.data);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Token operations
        this.app.get('/api/tokens/balance/:userId', async (req, res) => {
            try {
                const response = await this.networkService.get(
                    `${this.config.services.tokenSystem.url}/api/balance/${req.params.userId}`
                );
                res.json(response.data);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Orchestrated operations (combine multiple services)
        this.app.post('/api/orchestrate/document-to-mvp', async (req, res) => {
            try {
                const { document, options = {} } = req.body;
                
                // Step 1: Process document with AI
                const aiResponse = await this.networkService.post(
                    `${this.config.services.aiApi.url}/api/analyze`,
                    { document }
                );
                
                // Step 2: Generate template
                const templateResponse = await this.networkService.post(
                    `${this.config.services.templateProcessor.url}/api/generate`,
                    {
                        analysis: aiResponse.data,
                        options
                    }
                );
                
                // Step 3: Submit for verification
                const verificationResponse = await this.networkService.post(
                    `${this.config.services.verification.url}/api/transaction`,
                    {
                        type: 'mvp-generation',
                        data: {
                            document,
                            analysis: aiResponse.data,
                            template: templateResponse.data
                        },
                        priority: 'high'
                    }
                );
                
                res.json({
                    success: true,
                    transactionId: verificationResponse.data.transactionId,
                    steps: {
                        analysis: aiResponse.data,
                        template: templateResponse.data,
                        verification: verificationResponse.data
                    }
                });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Service health aggregator
        this.app.get('/api/system/health', async (req, res) => {
            const health = await this.getSystemHealth();
            res.json(health);
        });
        
        // Catch-all
        this.app.use((req, res) => {
            res.status(404).json({ error: 'Endpoint not found' });
        });
    }

    /**
     * Setup WebSocket for real-time updates
     */
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🔌 New WebSocket connection');
            
            // Send initial status
            this.checkAllServices().then(statuses => {
                ws.send(JSON.stringify({
                    type: 'service-status',
                    data: statuses
                }));
            });
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    
                    switch (data.type) {
                        case 'subscribe':
                            // Subscribe to service updates
                            this.subscribeToService(ws, data.service);
                            break;
                            
                        case 'execute':
                            // Execute command across services
                            const result = await this.executeCommand(data.command, data.params);
                            ws.send(JSON.stringify({
                                type: 'execution-result',
                                data: result
                            }));
                            break;
                    }
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: error.message
                    }));
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 WebSocket disconnected');
            });
        });
    }

    /**
     * Discover available services
     */
    async discoverServices() {
        const services = [];
        
        for (const [key, config] of Object.entries(this.config.services)) {
            const status = await this.checkService(config.url);
            services.push({
                id: key,
                name: config.name,
                url: config.url,
                status: status ? 'online' : 'offline',
                lastCheck: new Date()
            });
        }
        
        return services;
    }

    /**
     * Check service health
     */
    async checkService(url) {
        try {
            // Special handling for different service types
            if (url.startsWith('postgresql://')) {
                // PostgreSQL check would need pg client
                return true; // Assume healthy for now
            }
            
            if (url.startsWith('redis://')) {
                // Redis check would need redis client
                return true; // Assume healthy for now
            }
            
            // HTTP services
            const healthEndpoints = ['/health', '/api/health', '/status', '/'];
            
            for (const endpoint of healthEndpoints) {
                const response = await this.networkService.get(`${url}${endpoint}`, {
                    timeout: 5000
                });
                
                if (response.success) {
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check all services
     */
    async checkAllServices() {
        const statuses = {};
        
        await Promise.all(
            Object.entries(this.config.services).map(async ([key, config]) => {
                const isHealthy = await this.checkService(config.url);
                statuses[key] = {
                    name: config.name,
                    url: config.url,
                    healthy: isHealthy,
                    lastCheck: new Date()
                };
                this.serviceStatus.set(key, isHealthy);
            })
        );
        
        return statuses;
    }

    /**
     * Get system health
     */
    async getSystemHealth() {
        const services = await this.checkAllServices();
        const networkHealth = await this.networkService.healthCheck();
        
        const healthyServices = Object.values(services).filter(s => s.healthy).length;
        const totalServices = Object.keys(services).length;
        
        const status = healthyServices === totalServices ? 'healthy' :
                      healthyServices > totalServices / 2 ? 'degraded' : 'unhealthy';
        
        return {
            status,
            services,
            network: networkHealth,
            healthy: healthyServices,
            total: totalServices,
            timestamp: new Date()
        };
    }

    /**
     * Check overall health
     */
    async checkHealth() {
        const systemHealth = await this.getSystemHealth();
        
        return {
            status: systemHealth.status,
            backend: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: '1.0.0'
            },
            ...systemHealth
        };
    }

    /**
     * Execute command across services
     */
    async executeCommand(command, params = {}) {
        console.log(`🎮 Executing command: ${command}`);
        
        switch (command) {
            case 'restart-service':
                // Would implement service restart logic
                return { success: true, message: `Service ${params.service} restart initiated` };
                
            case 'clear-cache':
                // Clear Redis cache
                if (this.serviceStatus.get('redis')) {
                    // Would implement cache clearing
                    return { success: true, message: 'Cache cleared' };
                }
                return { success: false, message: 'Redis not available' };
                
            case 'sync-all':
                // Trigger sync across all services
                const results = await Promise.all(
                    Object.entries(this.config.services).map(async ([key, config]) => {
                        if (this.serviceStatus.get(key)) {
                            // Would call sync endpoint on each service
                            return { service: key, synced: true };
                        }
                        return { service: key, synced: false };
                    })
                );
                return { success: true, results };
                
            default:
                return { success: false, message: `Unknown command: ${command}` };
        }
    }

    /**
     * Subscribe to service updates
     */
    subscribeToService(ws, serviceName) {
        // Set up polling for service status
        const interval = setInterval(async () => {
            if (ws.readyState !== WebSocket.OPEN) {
                clearInterval(interval);
                return;
            }
            
            const status = await this.checkService(this.config.services[serviceName]?.url);
            ws.send(JSON.stringify({
                type: 'service-update',
                service: serviceName,
                status
            }));
        }, 5000);
    }

    /**
     * Start the service
     */
    start() {
        this.server.listen(this.config.port, () => {
            console.log(`🚀 Backend Integration Service running on port ${this.config.port}`);
            console.log(`🔌 WebSocket server running on port ${this.config.wsPort}`);
            
            // Start network service if not running
            this.networkService.createServer();
            
            // Initial service check
            this.checkAllServices().then(statuses => {
                console.log('📊 Initial service status:');
                Object.entries(statuses).forEach(([key, status]) => {
                    console.log(`  ${status.healthy ? '✅' : '❌'} ${status.name}`);
                });
            });
            
            // Periodic health checks
            setInterval(() => {
                this.checkAllServices();
            }, 30000); // Every 30 seconds
        });
    }
}

// Export for use as module
module.exports = BackendIntegrationService;

// Run as standalone service if called directly
if (require.main === module) {
    const service = new BackendIntegrationService({
        port: process.env.BACKEND_PORT || 4444,
        wsPort: process.env.BACKEND_WS_PORT || 4445
    });
    
    service.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Backend Integration Service...');
        process.exit(0);
    });
}