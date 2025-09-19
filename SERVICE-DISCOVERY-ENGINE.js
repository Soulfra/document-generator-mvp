#!/usr/bin/env node

/**
 * 🔍 SERVICE DISCOVERY ENGINE
 * 
 * Accurately discovers and maps all running services in the ecosystem
 * Fixes routing and labeling issues by providing real-time service registry
 * Creates proper integration between Document Generator and Gaming systems
 * 
 * ENHANCED VERSION:
 * - Advanced service analysis and code scanning
 * - Auto-discovers services from unified-vault
 * - Maps service dependencies and connections
 * - Generates comprehensive service registry
 * - Integrates with UNIFIED-SYSTEM-ORCHESTRATOR.js
 */

const express = require('express');
const http = require('http');
const https = require('https');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');

class ServiceDiscoveryEngine {
    constructor(config = {}) {
        console.log('🔍 SERVICE DISCOVERY ENGINE');
        console.log('==========================');
        console.log('🌐 Discovering and mapping all running services');
        console.log('🔗 Fixing routing and labeling issues');
        console.log('📊 Creating real-time service registry');
        console.log('🔬 Enhanced with advanced service analysis');
        console.log('');
        
        // Configuration
        this.config = {
            unifiedVaultPath: config.unifiedVaultPath || './unified-vault',
            additionalPaths: config.additionalPaths || [
                './FinishThisIdea/ai-os-clean/src/services',
                './services',
                './src/services'
            ],
            deepAnalysis: config.deepAnalysis !== false,
            ...config
        };
        
        // Service registry
        this.serviceRegistry = new Map();
        this.serviceHistory = new Map();
        
        // Enhanced discovery data
        this.discoveredServices = new Map();
        this.serviceConnections = new Map();
        this.serviceDependencies = new Map();
        this.serviceAPIs = new Map();
        this.connectionGraph = new Map();
        
        // Known service patterns - Updated with comprehensive 23+ service map
        this.servicePatterns = [
            // Core Document Generator Services
            { port: 3000, name: 'Template Processor (MCP)', type: 'document', priority: 'critical', health: '/health' },
            { port: 3001, name: 'AI API Service', type: 'document', priority: 'critical', health: '/health' },
            { port: 3002, name: 'Analytics Service', type: 'document', priority: 'high', health: '/health' },
            { port: 3003, name: 'LLM Orchestration', type: 'document', priority: 'critical', health: '/api/health' },
            { port: 4000, name: 'Master Orchestrator', type: 'document', priority: 'critical', health: '/api/health' },
            { port: 5000, name: 'Flask Backend', type: 'document', priority: 'high', health: '/api/status' },
            { port: 8080, name: 'Platform Hub', type: 'document', priority: 'critical', health: '/health' },
            { port: 8081, name: 'Template WebSocket', type: 'document', priority: 'medium', health: null },
            { port: 8082, name: 'LLM WebSocket', type: 'document', priority: 'medium', health: null },
            { port: 8085, name: 'Sovereign Agents', type: 'document', priority: 'high', health: null },
            
            // Gaming & Specialized Services
            { port: 9800, name: 'Cybersecurity Gaming', type: 'gaming', priority: 'high', health: '/health' },
            { port: 9999, name: 'ESPN Sports Hub', type: 'gaming', priority: 'high', health: '/health' },
            { port: 8889, name: 'Brand Integration Hub', type: 'gaming', priority: 'medium', health: '/api/status' },
            { port: 8888, name: 'Multiplayer Hub', type: 'gaming', priority: 'medium', health: null },
            { port: 9001, name: 'Unix Custom Database', type: 'gaming', priority: 'medium', health: null },
            { port: 9998, name: 'Guardian Teacher', type: 'gaming', priority: 'medium', health: '/health' },
            { port: 9706, name: 'AI Casino', type: 'gaming', priority: 'low', health: '/health' },
            { port: 8001, name: 'Infinity Router', type: 'gaming', priority: 'low', health: '/health' },
            { port: 7001, name: 'Special Orchestrator', type: 'gaming', priority: 'medium', health: '/health' },
            
            // Infrastructure Services
            { port: 5432, name: 'PostgreSQL Database', type: 'infrastructure', priority: 'critical', health: null },
            { port: 6379, name: 'Redis Cache', type: 'infrastructure', priority: 'critical', health: null },
            { port: 9000, name: 'MinIO Storage', type: 'infrastructure', priority: 'critical', health: '/minio/health/live' },
            { port: 11434, name: 'Ollama AI Models', type: 'infrastructure', priority: 'critical', health: '/api/tags' },
            { port: 9090, name: 'Prometheus Metrics', type: 'infrastructure', priority: 'high', health: '/-/ready' },
            { port: 3003, name: 'Grafana Dashboard', type: 'infrastructure', priority: 'medium', health: '/api/health' },
            { port: 80, name: 'Nginx Load Balancer', type: 'infrastructure', priority: 'high', health: null },
            { port: 443, name: 'Nginx SSL', type: 'infrastructure', priority: 'high', health: null }
        ];
        
        this.initialize();
    }
    
    /**
     * Enhanced service discovery with code analysis
     */
    async performEnhancedDiscovery() {
        console.log('🔬 Performing enhanced service discovery with code analysis...');
        
        // Scan unified-vault for service files
        await this.scanUnifiedVault();
        
        // Analyze discovered service files
        if (this.config.deepAnalysis) {
            await this.performDeepServiceAnalysis();
        }
        
        // Map service connections
        await this.mapServiceConnections();
        
        // Generate enhanced registry
        await this.generateEnhancedRegistry();
        
        console.log(`✅ Enhanced discovery complete: ${this.discoveredServices.size} services analyzed`);
    }
    
    async scanUnifiedVault() {
        const scanPaths = [this.config.unifiedVaultPath, ...this.config.additionalPaths];
        
        for (const scanPath of scanPaths) {
            console.log(`🔍 Scanning: ${scanPath}`);
            await this.scanPathForServices(scanPath);
        }
    }
    
    async scanPathForServices(dir) {
        try {
            await this.recursiveServiceScan(dir);
        } catch (error) {
            console.warn(`⚠️ Could not scan ${dir}: ${error.message}`);
        }
    }
    
    async recursiveServiceScan(dir) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
                    await this.recursiveServiceScan(fullPath);
                } else if (entry.isFile() && this.isServiceFile(entry.name)) {
                    await this.analyzeServiceFile(fullPath);
                }
            }
        } catch (error) {
            // Directory might not exist
        }
    }
    
    shouldSkipDirectory(dirName) {
        const skipDirs = [
            'node_modules', '.git', '.env', 'dist', 'build', 
            'coverage', '.vscode', '.idea', 'logs', 'tmp'
        ];
        return skipDirs.includes(dirName) || dirName.startsWith('.');
    }
    
    isServiceFile(filename) {
        const servicePatterns = [
            /\.service\.(js|ts)$/,
            /-service\.(js|ts)$/,
            /-orchestrator\.(js|ts)$/,
            /-engine\.(js|ts)$/,
            /-manager\.(js|ts)$/,
            /-handler\.(js|ts)$/,
            /-processor\.(js|ts)$/
        ];
        
        return servicePatterns.some(pattern => pattern.test(filename));
    }
    
    async analyzeServiceFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const filename = path.basename(filePath, path.extname(filePath));
            const serviceId = this.generateServiceId(filePath);
            
            if (this.looksLikeService(filename, content)) {
                const service = {
                    id: serviceId,
                    name: filename,
                    displayName: this.generateDisplayName(filename),
                    path: filePath,
                    type: this.detectServiceType(filename, content),
                    
                    // Code analysis
                    ports: this.extractPorts(content),
                    dependencies: this.extractDependencies(content),
                    capabilities: this.detectCapabilities(content),
                    apis: this.detectAPIs(content),
                    
                    // Metadata
                    discoveredAt: new Date(),
                    size: content.length,
                    complexity: this.calculateComplexity(content)
                };
                
                this.discoveredServices.set(serviceId, service);
                console.log(`  📦 Found: ${service.displayName}`);
            }
        } catch (error) {
            // File might be binary or inaccessible
        }
    }
    
    generateServiceId(filePath) {
        return crypto.createHash('md5').update(filePath).digest('hex').substring(0, 8);
    }
    
    generateDisplayName(filename) {
        return filename
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .replace(/\.(service|engine|manager|orchestrator)/i, '');
    }
    
    looksLikeService(filename, content) {
        const serviceIndicators = [
            /class\s+\w+Service/i,
            /class\s+\w+Engine/i,
            /class\s+\w+Manager/i,
            /class\s+\w+Orchestrator/i,
            /module\.exports\s*=/,
            /export\s+(default\s+)?class/,
            /app\.listen\(/,
            /server\.listen\(/
        ];
        
        return serviceIndicators.some(pattern => pattern.test(content));
    }
    
    detectServiceType(filename, content) {
        const typePatterns = [
            { pattern: /orchestrator/i, type: 'orchestrator' },
            { pattern: /engine/i, type: 'engine' },
            { pattern: /manager/i, type: 'manager' },
            { pattern: /service/i, type: 'service' },
            { pattern: /processor/i, type: 'processor' },
            { pattern: /handler/i, type: 'handler' }
        ];
        
        for (const { pattern, type } of typePatterns) {
            if (pattern.test(filename) || pattern.test(content)) {
                return type;
            }
        }
        
        return 'service';
    }
    
    extractDependencies(content) {
        const deps = new Set();
        
        // CommonJS requires
        const requirePattern = /require\(['\"`]([^'\"`]+)['\"`]\)/g;
        let match;
        while ((match = requirePattern.exec(content))) {
            if (!match[1].startsWith('.')) {
                deps.add(match[1]);
            }
        }
        
        return Array.from(deps);
    }
    
    detectCapabilities(content) {
        const capabilities = new Set();
        
        const capabilityPatterns = [
            { pattern: /websocket|ws/i, cap: 'websocket' },
            { pattern: /http|express|fastify/i, cap: 'http' },
            { pattern: /database|db|sql/i, cap: 'database' },
            { pattern: /auth|jwt|oauth/i, cap: 'authentication' },
            { pattern: /ai|llm|gpt|claude/i, cap: 'ai' },
            { pattern: /game|gaming|player/i, cap: 'gaming' },
            { pattern: /payment|stripe/i, cap: 'payments' },
            { pattern: /cache|redis/i, cap: 'caching' }
        ];
        
        for (const { pattern, cap } of capabilityPatterns) {
            if (pattern.test(content)) {
                capabilities.add(cap);
            }
        }
        
        return Array.from(capabilities);
    }
    
    detectAPIs(content) {
        const apis = new Set();
        
        const endpointPatterns = [
            /app\.(get|post|put|delete)\(['\"`]([^'\"`]+)['\"`]/g,
            /router\.(get|post|put|delete)\(['\"`]([^'\"`]+)['\"`]/g
        ];
        
        for (const pattern of endpointPatterns) {
            let match;
            while ((match = pattern.exec(content))) {
                apis.add(match[2]);
            }
        }
        
        return Array.from(apis);
    }
    
    calculateComplexity(content) {
        const lines = content.split('\n').length;
        const functions = (content.match(/function/g) || []).length;
        const classes = (content.match(/class/g) || []).length;
        const conditions = (content.match(/if|switch|while|for/g) || []).length;
        
        return {
            lines,
            functions,
            classes,
            conditions,
            score: Math.min(100, Math.round((lines + functions * 5 + classes * 10 + conditions * 2) / 50))
        };
    }
    
    async performDeepServiceAnalysis() {
        console.log('🔬 Performing deep service analysis...');
        
        for (const [serviceId, service] of this.discoveredServices) {
            await this.analyzeServiceConnections(service);
        }
    }
    
    async analyzeServiceConnections(service) {
        const connections = [];
        
        try {
            const content = await fs.readFile(service.path, 'utf-8');
            
            // Find HTTP calls to other services
            const httpPattern = /http[s]?:\/\/[^'\"`\s]+/g;
            let match;
            while ((match = httpPattern.exec(content))) {
                connections.push({
                    type: 'http',
                    target: match[0],
                    direction: 'outbound'
                });
            }
            
            this.serviceConnections.set(service.id, connections);
            
        } catch (error) {
            // Could not analyze connections
        }
    }
    
    async mapServiceConnections() {
        console.log('🔗 Mapping service connections...');
        
        for (const [serviceId, service] of this.discoveredServices) {
            const connections = this.generateConnectionsForService(service);
            this.connectionGraph.set(serviceId, connections);
        }
    }
    
    generateConnectionsForService(service) {
        const connections = [];
        
        // Generate connections based on capabilities
        for (const [otherId, otherService] of this.discoveredServices) {
            if (otherId !== service.id) {
                const connection = this.analyzeConnectionPotential(service, otherService);
                if (connection.score > 0.5) {
                    connections.push(connection);
                }
            }
        }
        
        return connections.sort((a, b) => b.score - a.score);
    }
    
    analyzeConnectionPotential(service1, service2) {
        let score = 0;
        const reasons = [];
        
        // Check capability complementarity
        const complementaryPairs = [
            ['http', 'database'],
            ['authentication', 'http'],
            ['ai', 'http'],
            ['gaming', 'database']
        ];
        
        for (const [cap1, cap2] of complementaryPairs) {
            if (service1.capabilities.includes(cap1) && service2.capabilities.includes(cap2)) {
                score += 0.3;
                reasons.push(`${service1.name} (${cap1}) ↔ ${service2.name} (${cap2})`);
            }
        }
        
        // Check port compatibility
        if (service1.capabilities.includes('http') && service2.ports.length > 0) {
            score += 0.2;
            reasons.push(`${service1.name} can call ${service2.name}:${service2.ports[0]}`);
        }
        
        return {
            from: service1.id,
            to: service2.id,
            fromName: service1.name,
            toName: service2.name,
            score: Math.min(1, score),
            reasons,
            type: this.inferConnectionType(service1, service2)
        };
    }
    
    inferConnectionType(service1, service2) {
        if (service1.capabilities.includes('http') && service2.capabilities.includes('http')) {
            return 'http';
        }
        if (service1.capabilities.includes('websocket') || service2.capabilities.includes('websocket')) {
            return 'websocket';
        }
        return 'direct';
    }
    
    async generateEnhancedRegistry() {
        const registry = {
            generatedAt: new Date(),
            version: '2.0.0', // Enhanced version
            totalServices: this.discoveredServices.size,
            
            // Running services (from port discovery)
            runningServices: Object.fromEntries(this.serviceRegistry),
            
            // Discovered services (from code analysis)
            discoveredServices: Object.fromEntries(this.discoveredServices),
            
            // Connections and dependencies
            connections: Object.fromEntries(this.connectionGraph),
            
            // Metadata
            metadata: {
                discoveryPaths: [this.config.unifiedVaultPath, ...this.config.additionalPaths],
                analysisDepth: this.config.deepAnalysis ? 'deep' : 'shallow',
                capabilities: this.getUniqueCapabilities(),
                types: this.getUniqueTypes()
            }
        };
        
        // Write enhanced registry to file
        const registryPath = './enhanced-service-registry.json';
        await fs.writeFile(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
        
        console.log(`✅ Enhanced service registry saved: ${registryPath}`);
        
        return registry;
    }
    
    getUniqueCapabilities() {
        const capabilities = new Set();
        for (const [, service] of this.discoveredServices) {
            service.capabilities.forEach(cap => capabilities.add(cap));
        }
        return Array.from(capabilities);
    }
    
    getUniqueTypes() {
        const types = new Set();
        for (const [, service] of this.discoveredServices) {
            types.add(service.type);
        }
        return Array.from(types);
    }
    
    async initialize() {
        console.log('🚀 Initializing Service Discovery Engine...');
        
        // Start discovery process (running services)
        await this.performServiceDiscovery();
        
        // Enhanced discovery (code analysis)
        await this.performEnhancedDiscovery();
        
        // Start continuous monitoring
        this.startContinuousMonitoring();
        
        // Start discovery web interface
        await this.startDiscoveryInterface();
        
        console.log('✅ Service Discovery Engine fully operational!');
        console.log('🌐 Discovery Interface: http://localhost:9999');
        console.log('📋 Enhanced Registry: ./enhanced-service-registry.json');
    }
    
    async performServiceDiscovery() {
        console.log('🔍 Performing comprehensive service discovery...');
        
        const discoveredServices = new Map();
        
        // Check each known service pattern
        for (const servicePattern of this.servicePatterns) {
            const discoveryResult = await this.discoverService(servicePattern);
            if (discoveryResult.isRunning) {
                discoveredServices.set(servicePattern.port, discoveryResult);
            }
        }
        
        // Scan for unknown services on common ports
        const additionalServices = await this.scanForUnknownServices();
        for (const [port, service] of additionalServices) {
            discoveredServices.set(port, service);
        }
        
        // Update service registry
        this.serviceRegistry = discoveredServices;
        
        console.log(`   ✅ Discovered ${discoveredServices.size} running services`);
        this.logDiscoveredServices();
    }
    
    async discoverService(servicePattern) {
        const { port, name, type, priority } = servicePattern;
        
        try {
            // Check if port is open
            const isPortOpen = await this.checkPort(port);
            if (!isPortOpen) {
                return { isRunning: false, port, name, type, priority };
            }
            
            // Try to get service information
            const serviceInfo = await this.getServiceInfo(port);
            
            return {
                isRunning: true,
                port,
                name: serviceInfo.detectedName || name,
                actualName: serviceInfo.detectedName,
                expectedName: name,
                type,
                priority,
                status: serviceInfo.status || 'unknown',
                healthEndpoint: serviceInfo.healthEndpoint,
                version: serviceInfo.version,
                lastSeen: Date.now(),
                responseTime: serviceInfo.responseTime,
                serviceUrl: `http://localhost:${port}`,
                isHealthy: serviceInfo.isHealthy
            };
            
        } catch (error) {
            return {
                isRunning: false,
                port,
                name,
                type,
                priority,
                error: error.message
            };
        }
    }
    
    async checkPort(port) {
        return new Promise((resolve) => {
            const net = require('net');
            const socket = new net.Socket();
            
            const timeout = setTimeout(() => {
                socket.destroy();
                resolve(false);
            }, 1000);
            
            socket.connect(port, 'localhost', () => {
                clearTimeout(timeout);
                socket.destroy();
                resolve(true);
            });
            
            socket.on('error', () => {
                clearTimeout(timeout);
                resolve(false);
            });
        });
    }
    
    async getServiceInfo(port) {
        const startTime = Date.now();
        
        // Try common health check endpoints
        const healthEndpoints = ['/health', '/api/health', '/ping', '/status', '/'];
        
        for (const endpoint of healthEndpoints) {
            try {
                const response = await this.httpRequest(`http://localhost:${port}${endpoint}`);
                const responseTime = Date.now() - startTime;
                
                let detectedName = null;
                let status = 'running';
                let version = null;
                let isHealthy = response.statusCode >= 200 && response.statusCode < 300;
                
                // Try to parse response for service information
                try {
                    const data = JSON.parse(response.body);
                    detectedName = data.service || data.name || data.title;
                    status = data.status || status;
                    version = data.version;
                } catch (e) {
                    // Try to extract from HTML title or content
                    const titleMatch = response.body.match(/<title>(.*?)<\/title>/i);
                    if (titleMatch) {
                        detectedName = titleMatch[1].replace(/[🚀📊🎮🔗🏥]/g, '').trim();
                    }
                }
                
                return {
                    detectedName,
                    status,
                    version,
                    healthEndpoint: endpoint,
                    responseTime,
                    isHealthy,
                    responseBody: response.body.substring(0, 200) // First 200 chars for analysis
                };
                
            } catch (error) {
                // Continue to next endpoint
                continue;
            }
        }
        
        // If no endpoints responded, still return basic info
        return {
            status: 'running',
            responseTime: Date.now() - startTime,
            isHealthy: false
        };
    }
    
    httpRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const httpModule = urlObj.protocol === 'https:' ? https : http;
            
            const req = httpModule.request({
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname,
                method: options.method || 'GET',
                timeout: 3000,
                headers: {
                    'User-Agent': 'ServiceDiscoveryEngine/1.0',
                    ...options.headers
                }
            }, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body
                    });
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }
    
    async scanForUnknownServices() {
        console.log('🔎 Scanning for unknown services...');
        
        const unknownServices = new Map();
        const commonPorts = [3000, 3001, 3002, 3003, 4000, 5000, 8000, 8001, 8080, 8888, 9090];
        
        for (const port of commonPorts) {
            // Skip if we already know about this port
            if (this.servicePatterns.some(sp => sp.port === port)) continue;
            
            const isOpen = await this.checkPort(port);
            if (isOpen) {
                const serviceInfo = await this.getServiceInfo(port);
                unknownServices.set(port, {
                    isRunning: true,
                    port,
                    name: serviceInfo.detectedName || `Unknown Service (${port})`,
                    type: 'unknown',
                    priority: 'unknown',
                    status: serviceInfo.status,
                    lastSeen: Date.now(),
                    responseTime: serviceInfo.responseTime,
                    serviceUrl: `http://localhost:${port}`,
                    isHealthy: serviceInfo.isHealthy
                });
            }
        }
        
        if (unknownServices.size > 0) {
            console.log(`   🔍 Found ${unknownServices.size} unknown services`);
        }
        
        return unknownServices;
    }
    
    logDiscoveredServices() {
        console.log('');
        console.log('📋 DISCOVERED SERVICES REGISTRY:');
        console.log('================================');
        
        const servicesByType = {
            critical: [],
            high: [],
            medium: [],
            low: [],
            unknown: []
        };
        
        // Group services by priority
        for (const [port, service] of this.serviceRegistry) {
            const priority = service.priority || 'unknown';
            servicesByType[priority].push(service);
        }
        
        for (const [priority, services] of Object.entries(servicesByType)) {
            if (services.length === 0) continue;
            
            const priorityIcon = {
                critical: '🔴',
                high: '🟠', 
                medium: '🟡',
                low: '🟢',
                unknown: '⚪'
            }[priority];
            
            console.log(`\n${priorityIcon} ${priority.toUpperCase()} PRIORITY:`);
            
            for (const service of services) {
                const healthIcon = service.isHealthy ? '✅' : '⚠️';
                const nameDisplay = service.actualName ? 
                    `${service.actualName} (expected: ${service.expectedName})` : 
                    service.name;
                
                console.log(`   ${healthIcon} ${service.port}: ${nameDisplay}`);
                console.log(`      🌐 ${service.serviceUrl}`);
                if (service.responseTime) {
                    console.log(`      ⚡ Response: ${service.responseTime}ms`);
                }
            }
        }
        
        console.log('');
    }
    
    startContinuousMonitoring() {
        console.log('🔄 Starting continuous service monitoring...');
        
        // Update service registry every 30 seconds
        setInterval(async () => {
            await this.performServiceDiscovery();
        }, 30000);
        
        // Clean old service history every 5 minutes
        setInterval(() => {
            this.cleanOldServiceHistory();
        }, 5 * 60 * 1000);
        
        console.log('   ✅ Continuous monitoring active');
    }
    
    cleanOldServiceHistory() {
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        const now = Date.now();
        
        for (const [port, service] of this.serviceHistory) {
            if (now - service.lastSeen > maxAge) {
                this.serviceHistory.delete(port);
            }
        }
    }
    
    async startDiscoveryInterface() {
        console.log('🌐 Starting service discovery web interface...');
        
        const app = express();
        app.use(express.json());
        
        // Health check
        app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                service: 'service-discovery-engine',
                discoveredServices: this.serviceRegistry.size,
                timestamp: Date.now() 
            });
        });
        
        // Main discovery dashboard
        app.get('/', (req, res) => {
            res.send(this.generateDiscoveryDashboard());
        });
        
        // API endpoints
        app.get('/api/services', (req, res) => {
            res.json({
                runningServices: Object.fromEntries(this.serviceRegistry),
                discoveredServices: Object.fromEntries(this.discoveredServices),
                connections: Object.fromEntries(this.connectionGraph),
                totalRunning: this.serviceRegistry.size,
                totalDiscovered: this.discoveredServices.size,
                lastDiscovery: Date.now()
            });
        });
        
        // Enhanced service analysis endpoint
        app.get('/api/enhanced-registry', (req, res) => {
            res.json({
                discoveredServices: Object.fromEntries(this.discoveredServices),
                connections: Object.fromEntries(this.connectionGraph),
                capabilities: this.getUniqueCapabilities(),
                types: this.getUniqueTypes(),
                totalAnalyzed: this.discoveredServices.size
            });
        });
        
        app.get('/api/services/:port', (req, res) => {
            const service = this.serviceRegistry.get(parseInt(req.params.port));
            if (service) {
                res.json(service);
            } else {
                res.status(404).json({ error: 'Service not found' });
            }
        });
        
        // Trigger manual discovery
        app.post('/api/discover', async (req, res) => {
            await this.performServiceDiscovery();
            await this.performEnhancedDiscovery();
            res.json({ 
                message: 'Discovery completed', 
                runningServices: this.serviceRegistry.size,
                discoveredServices: this.discoveredServices.size
            });
        });
        
        // Service correction endpoint
        app.post('/api/services/:port/correct', (req, res) => {
            const port = parseInt(req.params.port);
            const service = this.serviceRegistry.get(port);
            
            if (service && req.body.correctName) {
                service.correctedName = req.body.correctName;
                service.lastCorrected = Date.now();
                this.serviceRegistry.set(port, service);
                
                res.json({ 
                    message: `Service ${port} name corrected to: ${req.body.correctName}`,
                    service 
                });
            } else {
                res.status(400).json({ error: 'Service not found or no correction provided' });
            }
        });
        
        const server = app.listen(9999, () => {
            console.log('   ✅ Discovery interface running on http://localhost:9999');
        });
        
        return server;
    }
    
    generateDiscoveryDashboard() {
        const totalServices = this.serviceRegistry.size;
        const healthyServices = Array.from(this.serviceRegistry.values()).filter(s => s.isHealthy).length;
        const healthPercentage = totalServices > 0 ? Math.round((healthyServices / totalServices) * 100) : 0;
        
        const servicesByType = {
            document: [],
            gaming: [],
            business: [],
            infrastructure: [],
            integration: [],
            unknown: []
        };
        
        for (const [port, service] of this.serviceRegistry) {
            servicesByType[service.type].push(service);
        }
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔍 Service Discovery Engine</title>
    <style>
        body {
            margin: 0;
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
            color: #00ff41;
            min-height: 100vh;
        }
        
        .header {
            text-align: center;
            padding: 40px 20px;
            background: rgba(0, 0, 0, 0.3);
            border-bottom: 2px solid #00ff41;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .stat-card {
            background: rgba(0, 255, 65, 0.1);
            border: 2px solid #00ff41;
            border-radius: 15px;
            padding: 20px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            color: #00ff41;
        }
        
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            padding: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .service-group {
            background: rgba(0, 255, 65, 0.1);
            border: 2px solid #00ff41;
            border-radius: 15px;
            padding: 20px;
        }
        
        .service-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid rgba(0, 255, 65, 0.2);
        }
        
        .service-item:last-child {
            border-bottom: none;
        }
        
        .service-link {
            color: #00ff41;
            text-decoration: none;
            font-weight: bold;
        }
        
        .service-link:hover {
            background: #00ff41;
            color: #000;
            padding: 2px 6px;
            border-radius: 3px;
        }
        
        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 8px;
        }
        
        .status-healthy { background: #00ff41; }
        .status-unhealthy { background: #ffaa00; }
        .status-offline { background: #ff4444; }
        
        .correction-form {
            margin-top: 20px;
            padding: 15px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
        }
        
        .correction-input {
            background: #000;
            border: 1px solid #00ff41;
            color: #00ff41;
            padding: 5px;
            margin: 5px;
        }
        
        .correction-button {
            background: #00ff41;
            color: #000;
            border: none;
            padding: 8px 16px;
            cursor: pointer;
            font-weight: bold;
        }
    </style>
    <script>
        function correctServiceName(port) {
            const newName = prompt('Enter correct service name:');
            if (newName) {
                fetch(\`/api/services/\${port}/correct\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ correctName: newName })
                })
                .then(response => response.json())
                .then(data => {
                    alert('Service name corrected!');
                    location.reload();
                })
                .catch(error => {
                    alert('Error correcting service name: ' + error.message);
                });
            }
        }
        
        function rediscover() {
            fetch('/api/discover', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    alert(\`Discovery completed! Found \${data.services} services.\`);
                    location.reload();
                })
                .catch(error => {
                    alert('Error during discovery: ' + error.message);
                });
        }
        
        // Auto-refresh every 60 seconds
        setTimeout(() => location.reload(), 60000);
    </script>
</head>
<body>
    <div class="header">
        <h1>🔍 Service Discovery Engine</h1>
        <p>Real-time service registry and routing correction</p>
        <button onclick="rediscover()" class="correction-button">🔄 Rediscover Services</button>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-value">${totalServices}</div>
            <div>Total Services</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${healthyServices}</div>
            <div>Healthy Services</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${healthPercentage}%</div>
            <div>System Health</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${totalServices - healthyServices}</div>
            <div>Need Attention</div>
        </div>
    </div>
    
    <div class="services-grid">
        ${Object.entries(servicesByType).map(([type, services]) => {
            if (services.length === 0) return '';
            
            const typeIcons = {
                document: '📄',
                gaming: '🎮',
                business: '💼',
                infrastructure: '🏗️',
                integration: '🔗',
                unknown: '❓'
            };
            
            return `
            <div class="service-group">
                <h3>${typeIcons[type]} ${type.toUpperCase()} SERVICES</h3>
                ${services.map(service => {
                    const statusClass = service.isHealthy ? 'status-healthy' : 'status-unhealthy';
                    const nameToShow = service.correctedName || service.actualName || service.name;
                    const hasNameMismatch = service.actualName && service.actualName !== service.expectedName;
                    
                    return `
                    <div class="service-item">
                        <div>
                            <span class="status-indicator ${statusClass}"></span>
                            <a href="${service.serviceUrl}" target="_blank" class="service-link">
                                ${nameToShow}
                            </a>
                            ${hasNameMismatch ? '<br><small style="opacity: 0.7;">⚠️ Name mismatch detected</small>' : ''}
                        </div>
                        <div>
                            <div>:${service.port}</div>
                            <button onclick="correctServiceName(${service.port})" 
                                style="font-size: 10px; padding: 2px 4px; margin-top: 2px;"
                                class="correction-button">Fix Name</button>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
            `;
        }).join('')}
    </div>
    
    <div style="text-align: center; padding: 20px; opacity: 0.7;">
        <p>Last discovery: ${new Date().toLocaleString()}</p>
        <p>Auto-refresh in 60 seconds</p>
    </div>
</body>
</html>`;
    }
    
    // Export service information for use by other scripts
    getServiceRegistry() {
        return this.serviceRegistry;
    }
    
    getServiceByPort(port) {
        return this.serviceRegistry.get(port);
    }
    
    getAllServicesByType(type) {
        return Array.from(this.serviceRegistry.values()).filter(s => s.type === type);
    }
}

// Export for use
module.exports = ServiceDiscoveryEngine;

// If run directly, start the service discovery engine
if (require.main === module) {
    console.log('🔍 Starting Service Discovery Engine...');
    
    const discoveryEngine = new ServiceDiscoveryEngine();
    
    // Handle shutdown gracefully
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Service Discovery Engine...');
        process.exit(0);
    });
}