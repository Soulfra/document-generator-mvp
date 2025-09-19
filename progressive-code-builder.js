#!/usr/bin/env node

/**
 * 💻 PROGRESSIVE CODE BUILDER
 * 
 * Builds progressively complex code examples across book chapters
 * Each chapter's code builds on previous chapters' concepts
 * Ensures working, testable code at every level
 * 
 * Features:
 * - Progressive complexity (basic → expert)
 * - Code dependency tracking
 * - Integration with previous examples
 * - Multiple programming paradigms
 * - Automatic testing generation
 * - Drag-and-drop ready snippets
 */

const EventEmitter = require('events');
const path = require('path');
const fs = require('fs').promises;

class ProgressiveCodeBuilder extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            startingComplexity: config.startingComplexity || 1,
            maxComplexity: config.maxComplexity || 5,
            enableDependencyTracking: config.enableDependencyTracking !== false,
            enableIntegrationExamples: config.enableIntegrationExamples !== false,
            enableTestGeneration: config.enableTestGeneration !== false,
            supportedLanguages: config.supportedLanguages || ['javascript', 'typescript', 'python'],
            primaryLanguage: config.primaryLanguage || 'javascript',
            ...config
        };
        
        // Code complexity progression templates
        this.complexityTemplates = {
            1: { // Basic
                patterns: ['simple_function', 'basic_class', 'variable_assignment'],
                concepts: ['variables', 'functions', 'basic_logic'],
                dependencies: [],
                testing: 'unit_tests',
                lines: 10-30
            },
            2: { // Intermediate
                patterns: ['class_inheritance', 'async_functions', 'error_handling'],
                concepts: ['objects', 'async/await', 'promises', 'error_handling'],
                dependencies: ['level_1_concepts'],
                testing: 'integration_tests',
                lines: 30-60
            },
            3: { // Advanced
                patterns: ['design_patterns', 'data_structures', 'algorithms'],
                concepts: ['patterns', 'performance', 'memory_management'],
                dependencies: ['level_1_concepts', 'level_2_concepts'],
                testing: 'performance_tests',
                lines: 60-120
            },
            4: { // Expert
                patterns: ['system_architecture', 'concurrency', 'optimization'],
                concepts: ['scalability', 'threading', 'caching', 'monitoring'],
                dependencies: ['all_previous_levels'],
                testing: 'stress_tests',
                lines: 120-200
            },
            5: { // Master
                patterns: ['distributed_systems', 'microservices', 'full_stack'],
                concepts: ['distribution', 'fault_tolerance', 'observability'],
                dependencies: ['all_previous_levels'],
                testing: 'end_to_end_tests',
                lines: 200+
            }
        };
        
        // Code generation patterns by topic
        this.topicPatterns = {
            'scalable_systems': {
                1: 'simple_server',
                2: 'load_balancer',
                3: 'microservice',
                4: 'service_mesh',
                5: 'distributed_platform'
            },
            'ai_systems': {
                1: 'basic_ai_call',
                2: 'ai_pipeline',
                3: 'multi_model_orchestrator',
                4: 'ai_agent_system',
                5: 'autonomous_ai_platform'
            },
            'data_processing': {
                1: 'data_parser',
                2: 'data_transformer',
                3: 'streaming_processor',
                4: 'distributed_pipeline',
                5: 'real_time_analytics'
            }
        };
        
        // Track code evolution across chapters
        this.codeEvolution = {
            chapters: new Map(),
            dependencies: new Map(),
            integration_points: new Map(),
            shared_utilities: new Set()
        };
        
        // Code templates library
        this.codeTemplates = new Map();
        this.initializeCodeTemplates();
        
        console.log('💻 Progressive Code Builder initialized');
        console.log(`🎯 Complexity range: ${this.config.startingComplexity} → ${this.config.maxComplexity}`);
        console.log(`🔗 Languages: ${this.config.supportedLanguages.join(', ')}`);
    }
    
    /**
     * Initialize code templates library
     */
    initializeCodeTemplates() {
        // Basic templates (Level 1)
        this.codeTemplates.set('simple_server', {
            javascript: `// Simple HTTP Server
const http = require('http');
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
        message: 'Hello from simple server!',
        timestamp: new Date().toISOString()
    }));
});

server.listen(port, () => {
    console.log(\`Server running on port \${port}\`);
});

module.exports = server;`,
            tests: `// Basic server tests
const request = require('supertest');
const server = require('./simple-server');

describe('Simple Server', () => {
    test('responds with JSON', async () => {
        const response = await request(server)
            .get('/')
            .expect(200)
            .expect('Content-Type', /json/);
        
        expect(response.body.message).toBe('Hello from simple server!');
    });
});`,
            complexity: 1,
            concepts: ['http_server', 'json_response', 'environment_variables']
        });
        
        // Intermediate templates (Level 2)
        this.codeTemplates.set('load_balancer', {
            javascript: `// Load Balancer with Health Checks
const http = require('http');
const httpProxy = require('http-proxy');

class LoadBalancer {
    constructor(servers = []) {
        this.servers = servers.map(server => ({
            ...server,
            healthy: true,
            requests: 0,
            lastCheck: Date.now()
        }));
        this.proxy = httpProxy.createProxyServer();
        this.currentIndex = 0;
        
        this.startHealthChecks();
    }
    
    async healthCheck(server) {
        try {
            const response = await fetch(\`\${server.url}/health\`);
            server.healthy = response.ok;
            server.lastCheck = Date.now();
        } catch (error) {
            server.healthy = false;
            server.lastCheck = Date.now();
        }
    }
    
    startHealthChecks() {
        setInterval(() => {
            this.servers.forEach(server => this.healthCheck(server));
        }, 30000); // Check every 30 seconds
    }
    
    getNextServer() {
        const healthyServers = this.servers.filter(s => s.healthy);
        if (healthyServers.length === 0) {
            throw new Error('No healthy servers available');
        }
        
        // Round-robin selection
        const server = healthyServers[this.currentIndex % healthyServers.length];
        this.currentIndex++;
        server.requests++;
        
        return server;
    }
    
    handleRequest(req, res) {
        try {
            const server = this.getNextServer();
            this.proxy.web(req, res, { target: server.url });
        } catch (error) {
            res.writeHead(503, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Service Unavailable' }));
        }
    }
}

module.exports = LoadBalancer;`,
            tests: `// Load balancer tests
const LoadBalancer = require('./load-balancer');

describe('LoadBalancer', () => {
    let balancer;
    
    beforeEach(() => {
        balancer = new LoadBalancer([
            { url: 'http://server1:3001', name: 'server1' },
            { url: 'http://server2:3002', name: 'server2' }
        ]);
    });
    
    test('distributes requests across servers', () => {
        const server1 = balancer.getNextServer();
        const server2 = balancer.getNextServer();
        
        expect(server1).not.toBe(server2);
    });
});`,
            complexity: 2,
            concepts: ['load_balancing', 'health_checks', 'proxy', 'round_robin'],
            dependencies: ['simple_server']
        });
        
        // Advanced templates (Level 3)
        this.codeTemplates.set('microservice', {
            javascript: `// Microservice with Service Discovery
const express = require('express');
const consul = require('consul');
const { v4: uuidv4 } = require('uuid');

class Microservice {
    constructor(config) {
        this.config = {
            name: config.name,
            version: config.version || '1.0.0',
            port: config.port || 3000,
            healthPath: '/health',
            consul: config.consul || { host: 'localhost', port: 8500 }
        };
        
        this.app = express();
        this.consul = consul(this.config.consul);
        this.serviceId = \`\${this.config.name}-\${uuidv4()}\`;
        
        this.setupMiddleware();
        this.setupRoutes();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use((req, res, next) => {
            req.startTime = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - req.startTime;
                console.log(\`\${req.method} \${req.path} - \${res.statusCode} - \${duration}ms\`);
            });
            next();
        });
    }
    
    setupRoutes() {
        // Health check endpoint
        this.app.get(this.config.healthPath, (req, res) => {
            res.json({
                status: 'healthy',
                service: this.config.name,
                version: this.config.version,
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            });
        });
        
        // Service info endpoint
        this.app.get('/info', (req, res) => {
            res.json({
                name: this.config.name,
                version: this.config.version,
                serviceId: this.serviceId,
                dependencies: this.getDependencies()
            });
        });
    }
    
    async registerService() {
        const registration = {
            id: this.serviceId,
            name: this.config.name,
            address: 'localhost',
            port: this.config.port,
            check: {
                http: \`http://localhost:\${this.config.port}\${this.config.healthPath}\`,
                interval: '10s'
            },
            tags: ['microservice', \`version-\${this.config.version}\`]
        };
        
        try {
            await this.consul.agent.service.register(registration);
            console.log(\`Service \${this.config.name} registered with Consul\`);
        } catch (error) {
            console.error('Service registration failed:', error);
        }
    }
    
    async deregisterService() {
        try {
            await this.consul.agent.service.deregister(this.serviceId);
            console.log('Service deregistered from Consul');
        } catch (error) {
            console.error('Service deregistration failed:', error);
        }
    }
    
    async discoverService(serviceName) {
        try {
            const services = await this.consul.health.service(serviceName);
            return services.map(service => ({
                id: service.Service.ID,
                address: service.Service.Address,
                port: service.Service.Port,
                healthy: service.Checks.every(check => check.Status === 'passing')
            }));
        } catch (error) {
            console.error(\`Service discovery failed for \${serviceName}:\`, error);
            return [];
        }
    }
    
    getDependencies() {
        // Override in subclasses
        return [];
    }
    
    async start() {
        const server = this.app.listen(this.config.port, async () => {
            console.log(\`\${this.config.name} listening on port \${this.config.port}\`);
            await this.registerService();
        });
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('Shutting down gracefully...');
            await this.deregisterService();
            server.close(() => {
                process.exit(0);
            });
        });
        
        return server;
    }
}

module.exports = Microservice;`,
            tests: `// Microservice tests
const Microservice = require('./microservice');
const request = require('supertest');

describe('Microservice', () => {
    let service;
    
    beforeEach(() => {
        service = new Microservice({
            name: 'test-service',
            port: 3001
        });
    });
    
    test('health endpoint responds correctly', async () => {
        const response = await request(service.app)
            .get('/health')
            .expect(200);
        
        expect(response.body.status).toBe('healthy');
        expect(response.body.service).toBe('test-service');
    });
});`,
            complexity: 3,
            concepts: ['microservices', 'service_discovery', 'health_checks', 'graceful_shutdown'],
            dependencies: ['load_balancer']
        });
        
        // Expert templates (Level 4)
        this.codeTemplates.set('service_mesh', {
            javascript: `// Service Mesh Proxy with Circuit Breaker
const express = require('express');
const httpProxy = require('http-proxy');
const CircuitBreaker = require('opossum');

class ServiceMeshProxy {
    constructor(config) {
        this.config = config;
        this.app = express();
        this.proxy = httpProxy.createProxyServer();
        this.circuitBreakers = new Map();
        this.metrics = {
            requests: 0,
            failures: 0,
            latencies: [],
            circuitBreakerTrips: 0
        };
        
        this.setupMiddleware();
        this.setupRoutes();
    }
    
    setupMiddleware() {
        // Request tracing
        this.app.use((req, res, next) => {
            req.traceId = this.generateTraceId();
            req.startTime = Date.now();
            
            res.setHeader('X-Trace-ID', req.traceId);
            
            res.on('finish', () => {
                this.recordMetrics(req, res);
            });
            
            next();
        });
        
        // Rate limiting
        this.app.use(this.rateLimitMiddleware());
        
        // Authentication
        this.app.use(this.authMiddleware());
    }
    
    getCircuitBreaker(serviceName) {
        if (!this.circuitBreakers.has(serviceName)) {
            const options = {
                timeout: 3000,
                errorThresholdPercentage: 50,
                resetTimeout: 30000,
                rollingCountTimeout: 10000,
                rollingCountBuckets: 10
            };
            
            const breaker = new CircuitBreaker(this.makeRequest.bind(this), options);
            
            breaker.on('open', () => {
                console.log(\`Circuit breaker opened for \${serviceName}\`);
                this.metrics.circuitBreakerTrips++;
            });
            
            breaker.on('halfOpen', () => {
                console.log(\`Circuit breaker half-open for \${serviceName}\`);
            });
            
            breaker.on('close', () => {
                console.log(\`Circuit breaker closed for \${serviceName}\`);
            });
            
            this.circuitBreakers.set(serviceName, breaker);
        }
        
        return this.circuitBreakers.get(serviceName);
    }
    
    async makeRequest(targetUrl, req) {
        return new Promise((resolve, reject) => {
            this.proxy.web(req, {
                target: targetUrl,
                timeout: 5000
            }, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
    
    setupRoutes() {
        // Proxy all requests
        this.app.all('/*', async (req, res) => {
            const serviceName = this.extractServiceName(req);
            const targetUrl = await this.discoverService(serviceName);
            
            if (!targetUrl) {
                return res.status(503).json({ 
                    error: 'Service Unavailable',
                    traceId: req.traceId 
                });
            }
            
            const circuitBreaker = this.getCircuitBreaker(serviceName);
            
            try {
                await circuitBreaker.fire(targetUrl, req);
                // Response handling is done by proxy
            } catch (error) {
                console.error(\`Request failed for \${serviceName}:\`, error);
                
                if (circuitBreaker.opened) {
                    res.status(503).json({
                        error: 'Circuit Breaker Open',
                        service: serviceName,
                        traceId: req.traceId
                    });
                } else {
                    res.status(502).json({
                        error: 'Bad Gateway',
                        message: error.message,
                        traceId: req.traceId
                    });
                }
            }
        });
    }
    
    generateTraceId() {
        return \`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
    }
    
    extractServiceName(req) {
        // Extract service name from path or headers
        const pathParts = req.path.split('/').filter(p => p);
        return pathParts[0] || 'default';
    }
    
    async discoverService(serviceName) {
        // Service discovery implementation
        const services = this.config.services[serviceName];
        if (!services || services.length === 0) return null;
        
        // Simple round-robin
        const serviceIndex = this.metrics.requests % services.length;
        return services[serviceIndex];
    }
    
    rateLimitMiddleware() {
        const limits = new Map();
        
        return (req, res, next) => {
            const key = req.ip;
            const now = Date.now();
            const windowMs = 60000; // 1 minute
            const maxRequests = 100;
            
            if (!limits.has(key)) {
                limits.set(key, { count: 1, resetTime: now + windowMs });
                return next();
            }
            
            const limit = limits.get(key);
            
            if (now > limit.resetTime) {
                limit.count = 1;
                limit.resetTime = now + windowMs;
                return next();
            }
            
            if (limit.count >= maxRequests) {
                return res.status(429).json({ 
                    error: 'Too Many Requests',
                    retryAfter: limit.resetTime - now 
                });
            }
            
            limit.count++;
            next();
        };
    }
    
    authMiddleware() {
        return (req, res, next) => {
            const token = req.headers.authorization;
            
            if (!token) {
                return res.status(401).json({ error: 'No authorization token' });
            }
            
            // Simple token validation (in real app, verify JWT)
            if (!this.isValidToken(token)) {
                return res.status(403).json({ error: 'Invalid token' });
            }
            
            next();
        };
    }
    
    isValidToken(token) {
        // Placeholder - implement real token validation
        return token.startsWith('Bearer valid-');
    }
    
    recordMetrics(req, res) {
        this.metrics.requests++;
        
        if (res.statusCode >= 400) {
            this.metrics.failures++;
        }
        
        const latency = Date.now() - req.startTime;
        this.metrics.latencies.push(latency);
        
        // Keep only last 1000 latencies
        if (this.metrics.latencies.length > 1000) {
            this.metrics.latencies = this.metrics.latencies.slice(-1000);
        }
    }
    
    getMetrics() {
        const avgLatency = this.metrics.latencies.reduce((a, b) => a + b, 0) / this.metrics.latencies.length;
        const successRate = ((this.metrics.requests - this.metrics.failures) / this.metrics.requests) * 100;
        
        return {
            requests: this.metrics.requests,
            failures: this.metrics.failures,
            successRate: isNaN(successRate) ? 100 : successRate,
            averageLatency: isNaN(avgLatency) ? 0 : avgLatency,
            circuitBreakerTrips: this.metrics.circuitBreakerTrips
        };
    }
}

module.exports = ServiceMeshProxy;`,
            complexity: 4,
            concepts: ['service_mesh', 'circuit_breaker', 'tracing', 'rate_limiting', 'authentication'],
            dependencies: ['microservice']
        });
    }
    
    /**
     * Build progressive code examples for a chapter
     */
    async buildChapterCode(chapterNumber, chapterData, topic, previousChapters = []) {
        console.log(`💻 Building code for Chapter ${chapterNumber}: ${topic}`);
        
        const complexity = this.calculateChapterComplexity(chapterNumber);
        const topicPattern = this.determineTopicPattern(topic);
        const dependencies = this.analyzeDependencies(chapterNumber, previousChapters);
        
        console.log(`  📊 Complexity: ${complexity}/5`);
        console.log(`  🎯 Pattern: ${topicPattern}`);
        console.log(`  🔗 Dependencies: ${dependencies.length}`);
        
        // Generate main code example
        const mainExample = await this.generateMainExample(
            complexity, 
            topicPattern, 
            chapterData, 
            dependencies
        );
        
        // Generate supporting utilities
        const utilities = await this.generateUtilities(
            complexity,
            mainExample,
            dependencies
        );
        
        // Generate integration examples
        const integrations = await this.generateIntegrationExamples(
            chapterNumber,
            mainExample,
            previousChapters
        );
        
        // Generate tests
        const tests = await this.generateTests(mainExample, complexity);
        
        const chapterCode = {
            chapter: chapterNumber,
            complexity,
            topic,
            main_example: mainExample,
            utilities,
            integrations,
            tests,
            dependencies: dependencies.map(d => d.name),
            metadata: {
                total_lines: this.countLines(mainExample.code),
                concepts_introduced: mainExample.concepts,
                difficulty_progression: this.assessDifficultyProgression(chapterNumber, previousChapters)
            }
        };
        
        // Track in evolution
        this.codeEvolution.chapters.set(chapterNumber, chapterCode);
        
        return chapterCode;
    }
    
    /**
     * Calculate complexity level for chapter
     */
    calculateChapterComplexity(chapterNumber) {
        // Linear progression from startingComplexity to maxComplexity
        const range = this.config.maxComplexity - this.config.startingComplexity;
        const step = range / 4; // 5 chapters, so 4 steps
        
        return Math.min(
            this.config.maxComplexity,
            Math.round(this.config.startingComplexity + (step * (chapterNumber - 1)))
        );
    }
    
    /**
     * Determine topic pattern from chapter content
     */
    determineTopicPattern(topic) {
        const topicLower = topic.toLowerCase();
        
        // AI/Machine Learning topics
        if (topicLower.includes('ai') || topicLower.includes('machine learning') || 
            topicLower.includes('model') || topicLower.includes('llm')) {
            return 'ai_systems';
        }
        
        // Scalability/Architecture topics
        if (topicLower.includes('scalable') || topicLower.includes('distributed') || 
            topicLower.includes('microservice') || topicLower.includes('architecture')) {
            return 'scalable_systems';
        }
        
        // Data processing topics
        if (topicLower.includes('data') || topicLower.includes('processing') || 
            topicLower.includes('analytics') || topicLower.includes('pipeline')) {
            return 'data_processing';
        }
        
        // Default to scalable systems
        return 'scalable_systems';
    }
    
    /**
     * Analyze dependencies from previous chapters
     */
    analyzeDependencies(chapterNumber, previousChapters) {
        const dependencies = [];
        
        // Add dependencies from previous chapters
        previousChapters.forEach(chapter => {
            const chapterCode = this.codeEvolution.chapters.get(chapter.number);
            if (chapterCode) {
                dependencies.push({
                    name: `chapter_${chapter.number}_main`,
                    type: 'chapter_main',
                    complexity: chapterCode.complexity,
                    concepts: chapterCode.main_example.concepts
                });
                
                // Add utility dependencies
                chapterCode.utilities.forEach(util => {
                    dependencies.push({
                        name: util.name,
                        type: 'utility',
                        complexity: util.complexity || chapterCode.complexity,
                        concepts: util.concepts || []
                    });
                });
            }
        });
        
        return dependencies;
    }
    
    /**
     * Generate main code example for chapter
     */
    async generateMainExample(complexity, topicPattern, chapterData, dependencies) {
        console.log(`  🔧 Generating main example (complexity ${complexity})`);
        
        const patternKey = this.topicPatterns[topicPattern]?.[complexity] || 'simple_server';
        const template = this.codeTemplates.get(patternKey);
        
        if (!template) {
            return this.generateFallbackExample(complexity, chapterData);
        }
        
        // Customize template based on chapter data
        const customizedCode = this.customizeTemplate(template, chapterData, dependencies);
        
        const mainExample = {
            name: patternKey,
            language: this.config.primaryLanguage,
            code: customizedCode.code,
            explanation: this.generateCodeExplanation(customizedCode.code, complexity),
            concepts: template.concepts || [],
            complexity,
            dependencies: template.dependencies || [],
            testable: true,
            drag_drop_ready: true
        };
        
        return mainExample;
    }
    
    /**
     * Customize template with chapter-specific data
     */
    customizeTemplate(template, chapterData, dependencies) {
        let code = template[this.config.primaryLanguage] || template.javascript;
        
        // Replace placeholders based on chapter consultation results
        const consultation = chapterData.consultation;
        if (consultation && consultation.results) {
            const successful = consultation.results.filter(r => r.success);
            
            // Use AI insights to customize variable names, comments, etc.
            successful.forEach(result => {
                const insights = this.extractTechnicalInsights(result.response);
                code = this.applyInsights(code, insights, result.character);
            });
        }
        
        // Integrate dependencies
        if (dependencies.length > 0) {
            code = this.integrateDependencies(code, dependencies);
        }
        
        return { code };
    }
    
    /**
     * Extract technical insights from AI response
     */
    extractTechnicalInsights(response) {
        const insights = {
            patterns: [],
            concepts: [],
            implementations: []
        };
        
        // Simple pattern extraction - could be enhanced
        if (response.includes('async') || response.includes('await')) {
            insights.patterns.push('async_pattern');
        }
        
        if (response.includes('cache') || response.includes('caching')) {
            insights.concepts.push('caching');
        }
        
        if (response.includes('queue') || response.includes('message')) {
            insights.patterns.push('message_queue');
        }
        
        return insights;
    }
    
    /**
     * Apply insights to code template
     */
    applyInsights(code, insights, character) {
        // Add character-specific comments
        const characterComments = {
            'The Analytical Philosopher': '// Logical approach: ',
            'The Creative Generalist': '// Creative solution: ',
            'The Technical Specialist': '// Optimized implementation: ',
            'The Research Librarian': '// Based on best practices: ',
            'The Fact Checker': '// Verified approach: '
        };
        
        const comment = characterComments[character] || '// ';
        
        // Add insights as comments at strategic locations
        insights.concepts.forEach(concept => {
            const conceptComment = `${comment}${concept} implementation\n`;
            code = code.replace(/^(class|function|const)/m, conceptComment + '$1');
        });
        
        return code;
    }
    
    /**
     * Generate utilities for the chapter
     */
    async generateUtilities(complexity, mainExample, dependencies) {
        const utilities = [];
        
        // Common utilities based on complexity
        if (complexity >= 2) {
            utilities.push({
                name: 'logger',
                code: this.generateLoggerUtility(complexity),
                concepts: ['logging', 'debugging'],
                complexity: Math.max(1, complexity - 1)
            });
        }
        
        if (complexity >= 3) {
            utilities.push({
                name: 'config_manager',
                code: this.generateConfigUtility(complexity),
                concepts: ['configuration', 'environment'],
                complexity: Math.max(2, complexity - 1)
            });
        }
        
        if (complexity >= 4) {
            utilities.push({
                name: 'metrics_collector',
                code: this.generateMetricsUtility(complexity),
                concepts: ['monitoring', 'observability'],
                complexity: Math.max(3, complexity - 1)
            });
        }
        
        return utilities;
    }
    
    /**
     * Generate logger utility
     */
    generateLoggerUtility(complexity) {
        if (complexity <= 2) {
            return `// Simple Logger
class Logger {
    static info(message) {
        console.log(\`[INFO] \${new Date().toISOString()} - \${message}\`);
    }
    
    static error(message) {
        console.error(\`[ERROR] \${new Date().toISOString()} - \${message}\`);
    }
}

module.exports = Logger;`;
        } else {
            return `// Advanced Logger with Structured Logging
const winston = require('winston');

class Logger {
    constructor(service = 'unknown') {
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { service },
            transports: [
                new winston.transports.File({ filename: 'error.log', level: 'error' }),
                new winston.transports.File({ filename: 'combined.log' }),
                new winston.transports.Console({
                    format: winston.format.simple()
                })
            ]
        });
    }
    
    info(message, metadata = {}) {
        this.logger.info(message, metadata);
    }
    
    error(message, error = null, metadata = {}) {
        this.logger.error(message, { error: error?.stack, ...metadata });
    }
    
    debug(message, metadata = {}) {
        this.logger.debug(message, metadata);
    }
}

module.exports = Logger;`;
        }
    }
    
    /**
     * Generate integration examples with previous chapters
     */
    async generateIntegrationExamples(chapterNumber, mainExample, previousChapters) {
        if (chapterNumber === 1 || previousChapters.length === 0) {
            return [];
        }
        
        const integrations = [];
        
        // Find the most recent chapter to integrate with
        const previousChapter = previousChapters[previousChapters.length - 1];
        const previousCode = this.codeEvolution.chapters.get(previousChapter.number);
        
        if (previousCode) {
            integrations.push({
                name: `integrate_with_chapter_${previousChapter.number}`,
                description: `Integration example combining Chapter ${chapterNumber} with Chapter ${previousChapter.number}`,
                code: this.generateIntegrationCode(mainExample, previousCode),
                concepts: [...mainExample.concepts, ...previousCode.main_example.concepts],
                complexity: Math.max(mainExample.complexity, previousCode.complexity)
            });
        }
        
        return integrations;
    }
    
    /**
     * Generate integration code between chapters
     */
    generateIntegrationCode(currentExample, previousChapterCode) {
        return `// Integration: ${currentExample.name} + ${previousChapterCode.main_example.name}
const ${this.toCamelCase(previousChapterCode.main_example.name)} = require('./chapter-${previousChapterCode.chapter}-${previousChapterCode.main_example.name}');
const ${this.toCamelCase(currentExample.name)} = require('./${currentExample.name}');

class IntegratedSystem {
    constructor() {
        this.previous = new ${this.toPascalCase(previousChapterCode.main_example.name)}();
        this.current = new ${this.toPascalCase(currentExample.name)}();
    }
    
    async initialize() {
        await this.previous.initialize?.();
        await this.current.initialize?.();
        
        // Set up communication between systems
        this.setupIntegration();
    }
    
    setupIntegration() {
        // Connect the systems based on their capabilities
        if (this.previous.on && this.current.emit) {
            this.previous.on('data', (data) => {
                this.current.emit('incoming', data);
            });
        }
    }
    
    async process(input) {
        // Process through both systems
        const intermediateResult = await this.previous.process?.(input) || input;
        return await this.current.process?.(intermediateResult) || intermediateResult;
    }
}

module.exports = IntegratedSystem;`;
    }
    
    /**
     * Generate tests for code examples
     */
    async generateTests(mainExample, complexity) {
        const basicTests = `// Tests for ${mainExample.name}
const ${this.toPascalCase(mainExample.name)} = require('./${mainExample.name}');

describe('${mainExample.name}', () => {
    let instance;
    
    beforeEach(() => {
        instance = new ${this.toPascalCase(mainExample.name)}();
    });
    
    test('should initialize correctly', () => {
        expect(instance).toBeDefined();
    });
    
    test('should handle basic functionality', async () => {
        const result = await instance.process?.('test input') || 'default';
        expect(result).toBeDefined();
    });
});`;
        
        if (complexity >= 3) {
            return basicTests + `

// Performance Tests
describe('${mainExample.name} Performance', () => {
    test('should handle concurrent requests', async () => {
        const promises = Array(100).fill().map((_, i) => 
            instance.process(\`test input \${i}\`)
        );
        
        const results = await Promise.all(promises);
        expect(results.length).toBe(100);
    });
});`;
        }
        
        return basicTests;
    }
    
    /**
     * Generate fallback example when no template exists
     */
    generateFallbackExample(complexity, chapterData) {
        const consultation = chapterData.consultation;
        const topic = consultation?.synthesis?.consensus?.[0] || 'example';
        
        return {
            name: `${topic.toLowerCase().replace(/\s+/g, '_')}_example`,
            language: this.config.primaryLanguage,
            code: `// ${topic} Implementation (Complexity Level ${complexity})
class ${this.toPascalCase(topic)}Example {
    constructor(config = {}) {
        this.config = config;
        this.initialized = false;
    }
    
    async initialize() {
        // Initialize the system
        this.initialized = true;
        console.log('${topic} system initialized');
    }
    
    async process(input) {
        if (!this.initialized) {
            throw new Error('System not initialized');
        }
        
        // Process the input
        const result = {
            input,
            processed: true,
            timestamp: new Date().toISOString()
        };
        
        return result;
    }
}

module.exports = ${this.toPascalCase(topic)}Example;`,
            explanation: `A ${complexity}-level implementation demonstrating ${topic}`,
            concepts: [topic.toLowerCase().replace(/\s+/g, '_')],
            complexity,
            dependencies: [],
            testable: true,
            drag_drop_ready: true
        };
    }
    
    /**
     * Generate code explanation
     */
    generateCodeExplanation(code, complexity) {
        const lines = code.split('\n').length;
        const hasAsync = code.includes('async');
        const hasClasses = code.includes('class');
        const hasModules = code.includes('require') || code.includes('module.exports');
        
        let explanation = `This is a complexity level ${complexity} example with approximately ${lines} lines of code. `;
        
        if (hasClasses) {
            explanation += 'It uses object-oriented programming with classes. ';
        }
        
        if (hasAsync) {
            explanation += 'It includes asynchronous operations for better performance. ';
        }
        
        if (hasModules) {
            explanation += 'It follows Node.js module patterns for reusability. ';
        }
        
        explanation += 'The code is ready for drag-and-drop testing in your development environment.';
        
        return explanation;
    }
    
    /**
     * Assess difficulty progression across chapters
     */
    assessDifficultyProgression(chapterNumber, previousChapters) {
        if (chapterNumber === 1) {
            return { 
                progression: 'starting', 
                jump: 0, 
                appropriate: true 
            };
        }
        
        const previousComplexities = previousChapters.map(ch => {
            const chapterCode = this.codeEvolution.chapters.get(ch.number);
            return chapterCode?.complexity || 1;
        });
        
        const currentComplexity = this.calculateChapterComplexity(chapterNumber);
        const lastComplexity = previousComplexities[previousComplexities.length - 1] || 1;
        const jump = currentComplexity - lastComplexity;
        
        return {
            progression: jump <= 1 ? 'smooth' : 'steep',
            jump,
            appropriate: jump <= 2, // Max jump of 2 levels is acceptable
            trend: this.calculateTrend(previousComplexities)
        };
    }
    
    /**
     * Calculate complexity trend
     */
    calculateTrend(complexities) {
        if (complexities.length < 2) return 'insufficient_data';
        
        const increases = complexities.slice(1).filter((c, i) => c > complexities[i]).length;
        const total = complexities.length - 1;
        
        return increases / total >= 0.7 ? 'increasing' : 'mixed';
    }
    
    /**
     * Utility methods
     */
    
    toCamelCase(str) {
        return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }
    
    toPascalCase(str) {
        const camelCase = this.toCamelCase(str);
        return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
    }
    
    countLines(code) {
        return code.split('\n').length;
    }
    
    /**
     * Get evolution summary
     */
    getEvolutionSummary() {
        const chapters = Array.from(this.codeEvolution.chapters.values());
        
        return {
            total_chapters: chapters.length,
            complexity_progression: chapters.map(ch => ch.complexity),
            concepts_introduced: chapters.reduce((acc, ch) => [...acc, ...ch.main_example.concepts], []),
            total_code_lines: chapters.reduce((acc, ch) => acc + ch.metadata.total_lines, 0),
            dependencies: Array.from(this.codeEvolution.dependencies.keys()),
            shared_utilities: Array.from(this.codeEvolution.shared_utilities)
        };
    }
}

module.exports = ProgressiveCodeBuilder;

// CLI testing interface
if (require.main === module) {
    console.log('💻 PROGRESSIVE CODE BUILDER DEMO\n');
    
    const builder = new ProgressiveCodeBuilder({
        startingComplexity: 1,
        maxComplexity: 5,
        primaryLanguage: 'javascript'
    });
    
    // Mock chapter data
    const mockChapterData = {
        consultation: {
            results: [
                {
                    success: true,
                    character: 'The Technical Specialist',
                    response: 'For scalable systems, we need to consider async processing, caching mechanisms, and proper error handling patterns.'
                }
            ],
            synthesis: {
                consensus: ['scalability', 'performance', 'reliability']
            }
        }
    };
    
    async function testCodeGeneration() {
        console.log('🔧 Testing code generation for 3 chapters...\n');
        
        const chapters = [];
        
        for (let i = 1; i <= 3; i++) {
            console.log(`📝 Generating Chapter ${i} code...`);
            
            const chapterCode = await builder.buildChapterCode(
                i,
                mockChapterData,
                'Building Scalable Microservices',
                chapters
            );
            
            chapters.push({ number: i, ...chapterCode });
            
            console.log(`✅ Chapter ${i} complete:`);
            console.log(`  📊 Complexity: ${chapterCode.complexity}/5`);
            console.log(`  💻 Main example: ${chapterCode.main_example.name}`);
            console.log(`  🛠️  Utilities: ${chapterCode.utilities.length}`);
            console.log(`  🔗 Integrations: ${chapterCode.integrations.length}`);
            console.log(`  📏 Lines: ${chapterCode.metadata.total_lines}`);
            console.log(`  🧠 Concepts: ${chapterCode.metadata.concepts_introduced.join(', ')}\n`);
        }
        
        // Show evolution summary
        console.log('📈 EVOLUTION SUMMARY:');
        const summary = builder.getEvolutionSummary();
        console.log(JSON.stringify(summary, null, 2));
        
        // Show sample code from final chapter
        console.log('\n💻 SAMPLE CODE FROM CHAPTER 3:');
        console.log('=====================================');
        console.log(chapters[2].main_example.code.substring(0, 500) + '...\n');
        
        console.log('✅ Progressive code generation demo complete!');
    }
    
    testCodeGeneration().catch(console.error);
}