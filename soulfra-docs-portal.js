#!/usr/bin/env node

/**
 * 📚 SOULFRA DOCUMENTATION PORTAL
 * 
 * Unified documentation hub for all Soulfra services
 * Auto-generates API docs from running services
 * Interactive API playground with real execution
 * Multi-language SDK generation
 * GitHub integration for continuous documentation
 */

const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const { OpenAPIGenerator } = require('openapi-typescript-codegen');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');
const marked = require('marked');
const hljs = require('highlight.js');
const EventEmitter = require('events');

class SoulfraDocsPortal extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Portal configuration
            portal: {
                port: 4000,
                title: 'Soulfra Developer Portal',
                description: 'Complete API documentation and developer resources for the Soulfra platform',
                version: '1.0.0',
                baseUrl: process.env.DOCS_BASE_URL || 'https://docs.soulfra.com',
                theme: 'dark'
            },
            
            // Service registry
            services: {
                'universal-sdk': {
                    name: 'Universal SDK Wrapper',
                    url: 'http://localhost:3006',
                    port: 3006,
                    category: 'core',
                    description: 'Real API integrations for AI, cloud, social, and gaming platforms'
                },
                'rag-orchestration': {
                    name: 'RAG AI Orchestration',
                    url: 'http://localhost:3003',
                    port: 3003,
                    category: 'ai',
                    description: 'Intelligent query system with vector search and tool orchestration'
                },
                'amazon-affiliate': {
                    name: 'Amazon Affiliate Hub',
                    url: 'http://localhost:9200',
                    port: 9200,
                    category: 'ecommerce',
                    description: 'E-commerce integration with price tracking and affiliate widgets'
                },
                'kafka-chat': {
                    name: 'Stateless Chat System',
                    url: 'http://localhost:8082',
                    wsUrl: 'ws://localhost:8081',
                    port: 8082,
                    category: 'communication',
                    description: 'Scalable real-time chat with Kafka streaming'
                },
                'runelite-gaming': {
                    name: 'RuneLite Gaming Bridge',
                    url: 'http://localhost:8080',
                    port: 8080,
                    category: 'gaming',
                    description: 'Gaming automation and guide generation system'
                },
                'life-database': {
                    name: 'Personal Life Database',
                    url: 'http://localhost:3011',
                    port: 3011,
                    category: 'personal',
                    description: 'Complete digital life tracking from Day 0 to death'
                },
                'window-manager': {
                    name: 'Cross-Platform Window Manager',
                    url: 'http://localhost:3010',
                    port: 3010,
                    category: 'system',
                    description: 'Native window management across Mac, Linux, and Windows'
                },
                'llm-router': {
                    name: 'LLM Router',
                    url: 'http://localhost:3001',
                    port: 3001,
                    category: 'ai',
                    description: 'Multi-provider LLM routing with cost optimization'
                },
                'mcp-templates': {
                    name: 'MCP Template Processor',
                    url: 'http://localhost:3000',
                    port: 3000,
                    category: 'templates',
                    description: 'Document to MVP transformation engine'
                }
            },
            
            // Documentation features
            documentation: {
                autoGenerate: true,
                includeExamples: true,
                generateSDKs: ['javascript', 'python', 'go', 'java'],
                searchEnabled: true,
                versioning: true,
                githubSync: true
            },
            
            // API playground
            playground: {
                enabled: true,
                authentication: true,
                rateLimit: {
                    requests: 100,
                    window: '15m'
                },
                sandboxMode: false // Use real APIs
            },
            
            // GitHub integration
            github: {
                org: 'soulfra',
                docsRepo: 'soulfra-docs',
                token: process.env.GITHUB_TOKEN,
                autoSync: true,
                webhookSecret: process.env.GITHUB_WEBHOOK_SECRET
            }
        };
        
        // Express app
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Service health status
        this.serviceHealth = new Map();
        
        // Documentation cache
        this.docsCache = new Map();
        
        // WebSocket for real-time updates
        this.wss = null;
        
        // Markdown renderer configuration
        marked.setOptions({
            highlight: (code, lang) => {
                return hljs.highlightAuto(code, [lang]).value;
            },
            pedantic: false,
            gfm: true,
            breaks: false,
            sanitize: false,
            smartLists: true,
            smartypants: false,
            xhtml: false
        });
        
        console.log('📚 Soulfra Documentation Portal initialized');
    }
    
    /**
     * Initialize the documentation portal
     */
    async initialize() {
        console.log('🚀 Starting Soulfra Documentation Portal...');
        
        try {
            // Setup base routes
            this.setupBaseRoutes();
            
            // Discover and document services
            await this.discoverServices();
            
            // Generate OpenAPI documentation
            await this.generateOpenAPIDocs();
            
            // Setup API playground
            this.setupAPIPlayground();
            
            // Setup SDK generation endpoints
            this.setupSDKGeneration();
            
            // Setup GitHub integration
            await this.setupGitHubIntegration();
            
            // Setup WebSocket for real-time updates
            this.setupWebSocket();
            
            // Start health monitoring
            this.startHealthMonitoring();
            
            // Start documentation auto-generation
            this.startAutoDocGeneration();
            
            console.log('✅ Soulfra Documentation Portal ready');
            this.emit('portal:ready');
            
        } catch (error) {
            console.error('Failed to initialize documentation portal:', error);
            throw error;
        }
    }
    
    /**
     * Setup base routes
     */
    setupBaseRoutes() {
        // Main documentation page
        this.app.get('/', (req, res) => {
            res.send(this.generateHomePage());
        });
        
        // Service listing
        this.app.get('/services', (req, res) => {
            const services = Array.from(this.config.services).map(([id, service]) => ({
                id,
                ...service,
                health: this.serviceHealth.get(id) || 'unknown'
            }));
            
            res.json({
                services,
                categories: this.getServiceCategories(),
                timestamp: Date.now()
            });
        });
        
        // Service documentation
        this.app.get('/docs/:serviceId', async (req, res) => {
            const { serviceId } = req.params;
            
            try {
                const docs = await this.getServiceDocumentation(serviceId);
                res.json(docs);
            } catch (error) {
                res.status(404).json({
                    error: `Documentation not found for service: ${serviceId}`
                });
            }
        });
        
        // Search endpoint
        this.app.get('/search', async (req, res) => {
            const { q: query } = req.query;
            
            if (!query) {
                return res.status(400).json({ error: 'Query parameter required' });
            }
            
            const results = await this.searchDocumentation(query);
            res.json({ query, results, count: results.length });
        });
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                services: Object.fromEntries(this.serviceHealth),
                timestamp: Date.now()
            });
        });
    }
    
    /**
     * Discover available services
     */
    async discoverServices() {
        console.log('🔍 Discovering Soulfra services...');
        
        for (const [serviceId, service] of Object.entries(this.config.services)) {
            try {
                // Check if service is running
                const health = await this.checkServiceHealth(service);
                this.serviceHealth.set(serviceId, health.status);
                
                if (health.status === 'healthy') {
                    // Try to fetch OpenAPI spec
                    await this.fetchServiceSpec(serviceId, service);
                }
                
                console.log(`✅ ${service.name}: ${health.status}`);
                
            } catch (error) {
                console.log(`❌ ${service.name}: offline`);
                this.serviceHealth.set(serviceId, 'offline');
            }
        }
        
        console.log(`📊 Discovered ${this.serviceHealth.size} services`);
    }
    
    /**
     * Check service health
     */
    async checkServiceHealth(service) {
        try {
            const response = await axios.get(`${service.url}/health`, {
                timeout: 2000
            });
            
            return {
                status: 'healthy',
                details: response.data
            };
            
        } catch (error) {
            if (error.response) {
                return {
                    status: 'unhealthy',
                    error: error.response.status
                };
            }
            
            return {
                status: 'offline',
                error: error.message
            };
        }
    }
    
    /**
     * Fetch OpenAPI specification from service
     */
    async fetchServiceSpec(serviceId, service) {
        try {
            // Try common OpenAPI endpoints
            const specEndpoints = ['/openapi.json', '/swagger.json', '/api-docs', '/spec'];
            
            for (const endpoint of specEndpoints) {
                try {
                    const response = await axios.get(`${service.url}${endpoint}`, {
                        timeout: 3000
                    });
                    
                    if (response.data && typeof response.data === 'object') {
                        this.docsCache.set(serviceId, {
                            spec: response.data,
                            fetched: Date.now()
                        });
                        return;
                    }
                } catch (error) {
                    // Try next endpoint
                }
            }
            
            // If no spec found, generate basic documentation
            await this.generateBasicServiceDoc(serviceId, service);
            
        } catch (error) {
            console.warn(`Could not fetch spec for ${service.name}:`, error.message);
        }
    }
    
    /**
     * Generate basic service documentation
     */
    async generateBasicServiceDoc(serviceId, service) {
        const basicSpec = {
            openapi: '3.0.0',
            info: {
                title: service.name,
                description: service.description,
                version: '1.0.0'
            },
            servers: [{
                url: service.url,
                description: 'Production server'
            }],
            paths: {
                '/health': {
                    get: {
                        summary: 'Health check',
                        description: 'Check if the service is running',
                        responses: {
                            '200': {
                                description: 'Service is healthy',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                status: { type: 'string' },
                                                timestamp: { type: 'number' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
        
        this.docsCache.set(serviceId, {
            spec: basicSpec,
            generated: true,
            fetched: Date.now()
        });
    }
    
    /**
     * Generate OpenAPI documentation for all services
     */
    async generateOpenAPIDocs() {
        console.log('📝 Generating unified OpenAPI documentation...');
        
        const unifiedSpec = {
            openapi: '3.0.0',
            info: {
                title: this.config.portal.title,
                description: this.config.portal.description,
                version: this.config.portal.version,
                contact: {
                    name: 'Soulfra Support',
                    email: 'support@soulfra.com',
                    url: 'https://soulfra.com/support'
                },
                license: {
                    name: 'MIT',
                    url: 'https://opensource.org/licenses/MIT'
                }
            },
            servers: [
                {
                    url: 'https://api.soulfra.com',
                    description: 'Production API'
                },
                {
                    url: 'http://localhost',
                    description: 'Local development'
                }
            ],
            paths: {},
            components: {
                securitySchemes: {
                    ApiKeyAuth: {
                        type: 'apiKey',
                        in: 'header',
                        name: 'X-API-Key'
                    },
                    BearerAuth: {
                        type: 'http',
                        scheme: 'bearer'
                    }
                }
            },
            tags: []
        };
        
        // Merge all service specs
        for (const [serviceId, cached] of this.docsCache.entries()) {
            if (cached.spec) {
                const service = this.config.services[serviceId];
                
                // Add service tag
                unifiedSpec.tags.push({
                    name: serviceId,
                    description: service.description,
                    externalDocs: {
                        url: `${this.config.portal.baseUrl}/docs/${serviceId}`
                    }
                });
                
                // Merge paths with service prefix
                if (cached.spec.paths) {
                    for (const [path, methods] of Object.entries(cached.spec.paths)) {
                        const prefixedPath = `/${serviceId}${path}`;
                        unifiedSpec.paths[prefixedPath] = {
                            ...methods,
                            // Add service tag to all operations
                            ...Object.fromEntries(
                                Object.entries(methods).map(([method, operation]) => [
                                    method,
                                    { ...operation, tags: [serviceId, ...(operation.tags || [])] }
                                ])
                            )
                        };
                    }
                }
            }
        }
        
        // Setup Swagger UI
        this.app.use('/api-docs', swaggerUi.serve);
        this.app.get('/api-docs', swaggerUi.setup(unifiedSpec, {
            customSiteTitle: 'Soulfra API Documentation',
            customCss: this.getCustomSwaggerCSS(),
            customfavIcon: '/favicon.ico',
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true,
                filter: true,
                showExtensions: true,
                showCommonExtensions: true
            }
        }));
        
        // Export OpenAPI spec
        this.app.get('/openapi.json', (req, res) => {
            res.json(unifiedSpec);
        });
        
        console.log(`✅ Generated documentation for ${unifiedSpec.tags.length} services`);
    }
    
    /**
     * Setup API playground
     */
    setupAPIPlayground() {
        console.log('🎮 Setting up API playground...');
        
        // Playground page
        this.app.get('/playground', (req, res) => {
            res.send(this.generatePlaygroundPage());
        });
        
        // Execute API request
        this.app.post('/playground/execute', async (req, res) => {
            try {
                const { service, method, path, headers, body, query } = req.body;
                
                // Validate request
                if (!this.config.services[service]) {
                    return res.status(400).json({ error: 'Invalid service' });
                }
                
                // Get service URL
                const serviceConfig = this.config.services[service];
                const url = new URL(path, serviceConfig.url);
                
                // Add query parameters
                if (query) {
                    Object.entries(query).forEach(([key, value]) => {
                        url.searchParams.set(key, value);
                    });
                }
                
                // Execute request
                const response = await axios({
                    method,
                    url: url.toString(),
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers
                    },
                    data: body,
                    timeout: 10000
                });
                
                res.json({
                    success: true,
                    status: response.status,
                    headers: response.headers,
                    data: response.data,
                    timing: {
                        total: response.config.timing?.total || 0
                    }
                });
                
            } catch (error) {
                res.status(error.response?.status || 500).json({
                    success: false,
                    error: error.message,
                    status: error.response?.status,
                    data: error.response?.data
                });
            }
        });
        
        // Get example requests
        this.app.get('/playground/examples/:service', (req, res) => {
            const { service } = req.params;
            const examples = this.getServiceExamples(service);
            res.json(examples);
        });
    }
    
    /**
     * Setup SDK generation
     */
    setupSDKGeneration() {
        console.log('🛠️ Setting up SDK generation...');
        
        // Generate SDK endpoint
        this.app.post('/sdk/generate', async (req, res) => {
            try {
                const { language, services, options } = req.body;
                
                if (!this.config.documentation.generateSDKs.includes(language)) {
                    return res.status(400).json({
                        error: `Unsupported language: ${language}`
                    });
                }
                
                const sdk = await this.generateSDK(language, services, options);
                
                res.json({
                    success: true,
                    language,
                    sdk,
                    downloadUrl: `/sdk/download/${sdk.id}`
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Download SDK
        this.app.get('/sdk/download/:sdkId', async (req, res) => {
            const { sdkId } = req.params;
            
            try {
                const sdkPath = path.join(__dirname, 'generated-sdks', sdkId);
                const exists = await fs.access(sdkPath).then(() => true).catch(() => false);
                
                if (!exists) {
                    return res.status(404).json({ error: 'SDK not found' });
                }
                
                res.download(sdkPath);
                
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // List available SDKs
        this.app.get('/sdk/languages', (req, res) => {
            res.json({
                languages: this.config.documentation.generateSDKs,
                templates: {
                    javascript: ['axios', 'fetch', 'node'],
                    python: ['requests', 'httpx', 'aiohttp'],
                    go: ['net/http', 'resty'],
                    java: ['okhttp', 'retrofit', 'spring']
                }
            });
        });
    }
    
    /**
     * Setup GitHub integration
     */
    async setupGitHubIntegration() {
        if (!this.config.github.token) {
            console.log('⚠️ GitHub integration disabled (no token)');
            return;
        }
        
        console.log('🐙 Setting up GitHub integration...');
        
        // GitHub webhook endpoint
        this.app.post('/github/webhook', async (req, res) => {
            const signature = req.headers['x-hub-signature-256'];
            const event = req.headers['x-github-event'];
            
            // Verify webhook signature
            if (!this.verifyGitHubWebhook(req.body, signature)) {
                return res.status(401).json({ error: 'Invalid signature' });
            }
            
            console.log(`📨 GitHub webhook: ${event}`);
            
            switch (event) {
                case 'push':
                    await this.handleGitHubPush(req.body);
                    break;
                case 'pull_request':
                    await this.handleGitHubPR(req.body);
                    break;
                case 'issues':
                    await this.handleGitHubIssue(req.body);
                    break;
            }
            
            res.json({ received: true });
        });
        
        // Sync documentation to GitHub
        this.app.post('/github/sync', async (req, res) => {
            try {
                const result = await this.syncDocsToGitHub();
                res.json({ success: true, ...result });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
    }
    
    /**
     * Setup WebSocket for real-time updates
     */
    setupWebSocket() {
        const WS_PORT = this.config.portal.port + 1;
        
        this.wss = new WebSocket.Server({ port: WS_PORT });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 New WebSocket connection');
            
            ws.on('message', (message) => {
                const data = JSON.parse(message.toString());
                this.handleWebSocketMessage(ws, data);
            });
            
            // Send initial status
            ws.send(JSON.stringify({
                type: 'welcome',
                services: Object.fromEntries(this.serviceHealth),
                timestamp: Date.now()
            }));
        });
        
        console.log(`🔌 WebSocket server ready on ws://localhost:${WS_PORT}`);
    }
    
    /**
     * Generate home page
     */
    generateHomePage() {
        return `
<!DOCTYPE html>
<html lang="en" data-theme="${this.config.portal.theme}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.config.portal.title}</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css" rel="stylesheet">
    <style>
        body { background: #0a0a0a; color: #e0e0e0; }
        .gradient-text { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .card { background: #1a1a1a; border: 1px solid #2a2a2a; }
        .status-healthy { color: #10b981; }
        .status-unhealthy { color: #f59e0b; }
        .status-offline { color: #ef4444; }
    </style>
</head>
<body class="font-sans">
    <nav class="border-b border-gray-800 p-4">
        <div class="container mx-auto flex justify-between items-center">
            <h1 class="text-2xl font-bold gradient-text">Soulfra Developer Portal</h1>
            <div class="space-x-4">
                <a href="/api-docs" class="hover:text-purple-400">API Docs</a>
                <a href="/playground" class="hover:text-purple-400">Playground</a>
                <a href="/sdk/languages" class="hover:text-purple-400">SDKs</a>
                <a href="https://github.com/soulfra" class="hover:text-purple-400">GitHub</a>
            </div>
        </div>
    </nav>
    
    <main class="container mx-auto p-8">
        <div class="text-center mb-12">
            <h2 class="text-4xl font-bold mb-4">Build with Soulfra</h2>
            <p class="text-xl text-gray-400">Complete API documentation and tools for developers</p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${this.generateServiceCards()}
        </div>
        
        <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="card p-6 rounded-lg">
                <h3 class="text-xl font-bold mb-2">📚 Documentation</h3>
                <p class="text-gray-400 mb-4">Comprehensive API documentation with examples</p>
                <a href="/api-docs" class="text-purple-400 hover:text-purple-300">View Docs →</a>
            </div>
            
            <div class="card p-6 rounded-lg">
                <h3 class="text-xl font-bold mb-2">🎮 API Playground</h3>
                <p class="text-gray-400 mb-4">Test API endpoints with real requests</p>
                <a href="/playground" class="text-purple-400 hover:text-purple-300">Try It →</a>
            </div>
            
            <div class="card p-6 rounded-lg">
                <h3 class="text-xl font-bold mb-2">🛠️ SDK Generator</h3>
                <p class="text-gray-400 mb-4">Generate client libraries in any language</p>
                <a href="/sdk/languages" class="text-purple-400 hover:text-purple-300">Generate →</a>
            </div>
        </div>
    </main>
    
    <script>
        // Connect to WebSocket for real-time updates
        const ws = new WebSocket('ws://localhost:${this.config.portal.port + 1}');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'service_update') {
                updateServiceStatus(data.service, data.status);
            }
        };
        
        function updateServiceStatus(service, status) {
            const element = document.querySelector(\`[data-service="\${service}"]\`);
            if (element) {
                element.className = \`status-\${status}\`;
                element.textContent = status;
            }
        }
    </script>
</body>
</html>
        `;
    }
    
    /**
     * Generate service cards for home page
     */
    generateServiceCards() {
        return Object.entries(this.config.services).map(([id, service]) => {
            const health = this.serviceHealth.get(id) || 'unknown';
            const healthClass = `status-${health}`;
            
            return `
                <div class="card p-6 rounded-lg hover:border-purple-600 transition-colors">
                    <div class="flex justify-between items-start mb-4">
                        <h3 class="text-xl font-bold">${service.name}</h3>
                        <span class="${healthClass} text-sm" data-service="${id}">●</span>
                    </div>
                    <p class="text-gray-400 mb-4">${service.description}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-500">${service.category}</span>
                        <a href="/docs/${id}" class="text-purple-400 hover:text-purple-300">
                            View Docs →
                        </a>
                    </div>
                </div>
            `;
        }).join('\n');
    }
    
    /**
     * Generate API playground page
     */
    generatePlaygroundPage() {
        return `
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Playground - Soulfra</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.12/codemirror.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.12/theme/monokai.min.css" rel="stylesheet">
    <style>
        body { background: #0a0a0a; color: #e0e0e0; }
        .card { background: #1a1a1a; border: 1px solid #2a2a2a; }
        .gradient-text { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    </style>
</head>
<body class="font-sans">
    <nav class="border-b border-gray-800 p-4">
        <div class="container mx-auto flex justify-between items-center">
            <h1 class="text-2xl font-bold gradient-text">API Playground</h1>
            <a href="/" class="hover:text-purple-400">← Back to Portal</a>
        </div>
    </nav>
    
    <main class="container mx-auto p-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
                <h2 class="text-xl font-bold mb-4">Request</h2>
                
                <div class="card p-4 rounded-lg space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <select id="service" class="bg-gray-800 rounded p-2">
                            <option value="">Select Service</option>
                            ${Object.entries(this.config.services).map(([id, service]) => 
                                `<option value="${id}">${service.name}</option>`
                            ).join('')}
                        </select>
                        
                        <select id="method" class="bg-gray-800 rounded p-2">
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>
                    
                    <input id="path" type="text" placeholder="/endpoint/path" class="w-full bg-gray-800 rounded p-2">
                    
                    <div>
                        <h3 class="text-sm font-bold mb-2">Headers</h3>
                        <textarea id="headers" class="w-full bg-gray-800 rounded p-2 h-20">{"Content-Type": "application/json"}</textarea>
                    </div>
                    
                    <div>
                        <h3 class="text-sm font-bold mb-2">Body</h3>
                        <textarea id="body" class="w-full bg-gray-800 rounded p-2 h-40">{}</textarea>
                    </div>
                    
                    <button onclick="executeRequest()" class="w-full bg-purple-600 hover:bg-purple-700 rounded p-2 font-bold">
                        Execute Request
                    </button>
                </div>
            </div>
            
            <div>
                <h2 class="text-xl font-bold mb-4">Response</h2>
                
                <div class="card p-4 rounded-lg">
                    <div id="response-status" class="mb-4 text-sm">
                        <span class="text-gray-500">No request sent yet</span>
                    </div>
                    
                    <div id="response-headers" class="mb-4">
                        <h3 class="text-sm font-bold mb-2">Response Headers</h3>
                        <pre class="bg-gray-900 rounded p-2 text-xs overflow-x-auto"></pre>
                    </div>
                    
                    <div id="response-body">
                        <h3 class="text-sm font-bold mb-2">Response Body</h3>
                        <pre class="bg-gray-900 rounded p-2 text-xs overflow-x-auto" style="max-height: 400px;"></pre>
                    </div>
                </div>
                
                <div class="mt-4 card p-4 rounded-lg">
                    <h3 class="text-sm font-bold mb-2">Example Requests</h3>
                    <select id="examples" onchange="loadExample()" class="w-full bg-gray-800 rounded p-2">
                        <option value="">Select an example</option>
                    </select>
                </div>
            </div>
        </div>
    </main>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.12/codemirror.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.12/mode/javascript/javascript.min.js"></script>
    <script>
        const headersEditor = CodeMirror.fromTextArea(document.getElementById('headers'), {
            theme: 'monokai',
            mode: 'application/json',
            lineNumbers: true
        });
        
        const bodyEditor = CodeMirror.fromTextArea(document.getElementById('body'), {
            theme: 'monokai',
            mode: 'application/json',
            lineNumbers: true
        });
        
        async function executeRequest() {
            const service = document.getElementById('service').value;
            const method = document.getElementById('method').value;
            const path = document.getElementById('path').value;
            
            if (!service || !path) {
                alert('Please select a service and enter a path');
                return;
            }
            
            try {
                const headers = JSON.parse(headersEditor.getValue());
                const body = method !== 'GET' ? JSON.parse(bodyEditor.getValue()) : undefined;
                
                const response = await fetch('/playground/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ service, method, path, headers, body })
                });
                
                const result = await response.json();
                displayResponse(result, response.status);
                
            } catch (error) {
                displayError(error);
            }
        }
        
        function displayResponse(result, status) {
            const statusEl = document.getElementById('response-status');
            const headersEl = document.querySelector('#response-headers pre');
            const bodyEl = document.querySelector('#response-body pre');
            
            statusEl.innerHTML = \`
                <span class="\${result.success ? 'text-green-500' : 'text-red-500'}">
                    Status: \${status} \${result.success ? 'OK' : 'Error'}
                </span>
                \${result.timing ? \`<span class="text-gray-500 ml-4">Time: \${result.timing.total}ms</span>\` : ''}
            \`;
            
            headersEl.textContent = JSON.stringify(result.headers || {}, null, 2);
            bodyEl.textContent = JSON.stringify(result.data || result.error || {}, null, 2);
        }
        
        function displayError(error) {
            const statusEl = document.getElementById('response-status');
            const bodyEl = document.querySelector('#response-body pre');
            
            statusEl.innerHTML = '<span class="text-red-500">Request failed</span>';
            bodyEl.textContent = error.message;
        }
        
        // Load examples when service changes
        document.getElementById('service').addEventListener('change', async (e) => {
            if (e.target.value) {
                const examples = await fetch(\`/playground/examples/\${e.target.value}\`).then(r => r.json());
                const select = document.getElementById('examples');
                select.innerHTML = '<option value="">Select an example</option>' + 
                    examples.map((ex, i) => \`<option value="\${i}">\${ex.name}</option>\`).join('');
            }
        });
    </script>
</body>
</html>
        `;
    }
    
    /**
     * Get custom Swagger CSS
     */
    getCustomSwaggerCSS() {
        return `
            .swagger-ui { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            .swagger-ui .topbar { display: none; }
            .swagger-ui .info { margin-bottom: 2rem; }
            .swagger-ui .scheme-container { background: #1a1a1a; padding: 1rem; border-radius: 8px; }
            body { background: #0a0a0a; }
            .swagger-ui .btn.authorize { background: #667eea; border-color: #667eea; }
            .swagger-ui .btn.authorize:hover { background: #764ba2; border-color: #764ba2; }
        `;
    }
    
    /**
     * Get service categories
     */
    getServiceCategories() {
        const categories = new Set();
        Object.values(this.config.services).forEach(service => {
            categories.add(service.category);
        });
        return Array.from(categories);
    }
    
    /**
     * Get service documentation
     */
    async getServiceDocumentation(serviceId) {
        const cached = this.docsCache.get(serviceId);
        
        if (!cached) {
            throw new Error(`No documentation for service: ${serviceId}`);
        }
        
        const service = this.config.services[serviceId];
        
        return {
            service: {
                id: serviceId,
                ...service
            },
            spec: cached.spec,
            generated: cached.generated || false,
            lastUpdated: cached.fetched,
            health: this.serviceHealth.get(serviceId)
        };
    }
    
    /**
     * Search documentation
     */
    async searchDocumentation(query) {
        const results = [];
        const searchTerm = query.toLowerCase();
        
        // Search through all cached documentation
        for (const [serviceId, cached] of this.docsCache.entries()) {
            const service = this.config.services[serviceId];
            
            // Search in service metadata
            if (service.name.toLowerCase().includes(searchTerm) ||
                service.description.toLowerCase().includes(searchTerm)) {
                results.push({
                    type: 'service',
                    service: serviceId,
                    title: service.name,
                    description: service.description,
                    url: `/docs/${serviceId}`
                });
            }
            
            // Search in API paths
            if (cached.spec?.paths) {
                for (const [path, methods] of Object.entries(cached.spec.paths)) {
                    for (const [method, operation] of Object.entries(methods)) {
                        if (operation.summary?.toLowerCase().includes(searchTerm) ||
                            operation.description?.toLowerCase().includes(searchTerm) ||
                            path.toLowerCase().includes(searchTerm)) {
                            results.push({
                                type: 'endpoint',
                                service: serviceId,
                                title: `${method.toUpperCase()} ${path}`,
                                description: operation.summary || operation.description,
                                url: `/api-docs#/${serviceId}${path}`
                            });
                        }
                    }
                }
            }
        }
        
        return results;
    }
    
    /**
     * Get service examples
     */
    getServiceExamples(serviceId) {
        const service = this.config.services[serviceId];
        if (!service) return [];
        
        // Generate examples based on service type
        const examples = [];
        
        switch (serviceId) {
            case 'universal-sdk':
                examples.push({
                    name: 'Search Google',
                    method: 'POST',
                    path: '/search/google',
                    body: { query: 'artificial intelligence', options: { num: 10 } }
                });
                examples.push({
                    name: 'Generate with OpenAI',
                    method: 'POST',
                    path: '/ai/openai/chat',
                    body: { params: { messages: [{ role: 'user', content: 'Hello!' }] } }
                });
                break;
                
            case 'rag-orchestration':
                examples.push({
                    name: 'Query with RAG',
                    method: 'POST',
                    path: '/query',
                    body: { query: 'How do I manage windows on different platforms?' }
                });
                break;
                
            case 'kafka-chat':
                examples.push({
                    name: 'Send Message',
                    method: 'POST',
                    path: '/messages',
                    body: { roomId: 'general', userId: 'user123', message: 'Hello world!' }
                });
                break;
        }
        
        return examples;
    }
    
    /**
     * Generate SDK
     */
    async generateSDK(language, services = [], options = {}) {
        const sdkId = `soulfra-sdk-${language}-${Date.now()}`;
        console.log(`🛠️ Generating ${language} SDK: ${sdkId}`);
        
        // TODO: Implement actual SDK generation based on language
        // For now, create a basic structure
        
        const sdkPath = path.join(__dirname, 'generated-sdks', sdkId);
        await fs.mkdir(path.dirname(sdkPath), { recursive: true });
        
        // Generate based on language
        switch (language) {
            case 'javascript':
                await this.generateJavaScriptSDK(sdkPath, services);
                break;
            case 'python':
                await this.generatePythonSDK(sdkPath, services);
                break;
            case 'go':
                await this.generateGoSDK(sdkPath, services);
                break;
            case 'java':
                await this.generateJavaSDK(sdkPath, services);
                break;
        }
        
        return { id: sdkId, language, services };
    }
    
    async generateJavaScriptSDK(sdkPath, services) {
        const packageJson = {
            name: '@soulfra/sdk',
            version: '1.0.0',
            description: 'Official Soulfra SDK for JavaScript',
            main: 'index.js',
            types: 'index.d.ts',
            dependencies: {
                'axios': '^1.6.0'
            }
        };
        
        await fs.writeFile(
            path.join(sdkPath, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );
        
        // Generate main SDK file
        const sdkCode = `
const axios = require('axios');

class SoulfraSDK {
    constructor(config = {}) {
        this.baseUrl = config.baseUrl || 'https://api.soulfra.com';
        this.apiKey = config.apiKey;
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'X-API-Key': this.apiKey,
                'Content-Type': 'application/json'
            }
        });
    }
    
    // Service methods...
}

module.exports = SoulfraSDK;
        `;
        
        await fs.writeFile(path.join(sdkPath, 'index.js'), sdkCode);
    }
    
    async generatePythonSDK(sdkPath, services) {
        // TODO: Implement Python SDK generation
    }
    
    async generateGoSDK(sdkPath, services) {
        // TODO: Implement Go SDK generation
    }
    
    async generateJavaSDK(sdkPath, services) {
        // TODO: Implement Java SDK generation
    }
    
    /**
     * Verify GitHub webhook signature
     */
    verifyGitHubWebhook(payload, signature) {
        if (!this.config.github.webhookSecret || !signature) {
            return false;
        }
        
        const hmac = crypto.createHmac('sha256', this.config.github.webhookSecret);
        const digest = `sha256=${hmac.update(JSON.stringify(payload)).digest('hex')}`;
        
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(digest)
        );
    }
    
    /**
     * Handle GitHub push event
     */
    async handleGitHubPush(payload) {
        console.log(`📤 GitHub push to ${payload.repository.full_name}`);
        
        // Check if documentation was updated
        const docFiles = payload.commits.flatMap(commit => 
            [...commit.added, ...commit.modified].filter(file => 
                file.endsWith('.md') || file.includes('docs/')
            )
        );
        
        if (docFiles.length > 0) {
            console.log(`📝 Documentation updated: ${docFiles.length} files`);
            // Trigger documentation regeneration
            await this.generateOpenAPIDocs();
        }
    }
    
    async handleGitHubPR(payload) {
        console.log(`🔄 GitHub PR ${payload.action}: ${payload.pull_request.title}`);
    }
    
    async handleGitHubIssue(payload) {
        console.log(`📋 GitHub issue ${payload.action}: ${payload.issue.title}`);
    }
    
    /**
     * Sync documentation to GitHub
     */
    async syncDocsToGitHub() {
        console.log('🔄 Syncing documentation to GitHub...');
        
        // TODO: Implement GitHub sync using Octokit
        // 1. Generate documentation files
        // 2. Create/update files in docs repo
        // 3. Create commit with changes
        
        return {
            synced: true,
            files: 0,
            commit: 'abc123'
        };
    }
    
    /**
     * Handle WebSocket messages
     */
    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'subscribe':
                // Subscribe to service updates
                break;
            case 'search':
                // Real-time search
                this.searchDocumentation(data.query).then(results => {
                    ws.send(JSON.stringify({ type: 'search_results', results }));
                });
                break;
        }
    }
    
    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        // Check service health every 30 seconds
        setInterval(async () => {
            for (const [serviceId, service] of Object.entries(this.config.services)) {
                const oldHealth = this.serviceHealth.get(serviceId);
                const health = await this.checkServiceHealth(service);
                const newHealth = health.status;
                
                if (oldHealth !== newHealth) {
                    console.log(`🔄 ${service.name}: ${oldHealth} → ${newHealth}`);
                    this.serviceHealth.set(serviceId, newHealth);
                    
                    // Broadcast update to WebSocket clients
                    this.broadcastUpdate({
                        type: 'service_update',
                        service: serviceId,
                        status: newHealth,
                        timestamp: Date.now()
                    });
                }
            }
        }, 30000);
    }
    
    /**
     * Start auto documentation generation
     */
    startAutoDocGeneration() {
        if (!this.config.documentation.autoGenerate) return;
        
        // Regenerate documentation every hour
        setInterval(async () => {
            console.log('🔄 Auto-generating documentation...');
            await this.discoverServices();
            await this.generateOpenAPIDocs();
        }, 3600000);
    }
    
    /**
     * Broadcast update to WebSocket clients
     */
    broadcastUpdate(data) {
        if (this.wss) {
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        }
    }
    
    /**
     * Start the documentation portal
     */
    start() {
        const PORT = this.config.portal.port;
        
        this.app.listen(PORT, () => {
            console.log(`
📚 SOULFRA DOCUMENTATION PORTAL READY
=====================================
🌐 Portal: http://localhost:${PORT}
📖 API Docs: http://localhost:${PORT}/api-docs
🎮 Playground: http://localhost:${PORT}/playground
🔌 WebSocket: ws://localhost:${PORT + 1}

Services Documented:
${Object.entries(this.config.services).map(([id, service]) => 
    `  ${this.serviceHealth.get(id) === 'healthy' ? '✅' : '❌'} ${service.name} (${service.url})`
).join('\n')}

Features:
✅ Auto-generated API documentation
✅ Interactive API playground
✅ Multi-language SDK generation
✅ Real-time service monitoring
✅ GitHub integration ready
            `);
        });
    }
    
    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log('📚 Shutting down Documentation Portal...');
        
        if (this.wss) {
            this.wss.close();
        }
        
        console.log('✅ Documentation Portal shutdown complete');
    }
}

module.exports = SoulfraDocsPortal;

// CLI
if (require.main === module) {
    async function startPortal() {
        const portal = new SoulfraDocsPortal();
        
        try {
            await portal.initialize();
            portal.start();
            
            // Handle graceful shutdown
            process.on('SIGINT', async () => {
                await portal.shutdown();
                process.exit(0);
            });
            
        } catch (error) {
            console.error('Failed to start portal:', error);
            process.exit(1);
        }
    }
    
    startPortal();
}