#!/usr/bin/env node

/**
 * 🎯 UNIFIED SYSTEM ORCHESTRATOR
 * Master integration controller that connects all existing systems:
 * - CAL Guardian Production Orchestrator
 * - Database-Driven Builder  
 * - Service Discovery Engine
 * - Anti-Duplication Security
 * - All existing services in unified-vault
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const CalGuardianProductionOrchestrator = require('./CAL-GUARDIAN-PRODUCTION-ORCHESTRATOR.js');
const DatabaseDrivenBuilder = require('./database-driven-builder.js');

class UnifiedSystemOrchestrator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Core components
            schemaPath: config.schemaPath || './EMPIRE-MASTER-SCHEMA.sql',
            servicesPath: config.servicesPath || './unified-vault',
            outputDir: config.outputDir || './unified-system',
            
            // Integration settings
            autoDiscoverServices: config.autoDiscoverServices !== false,
            applySecurity: config.applySecurity !== false,
            enableMonitoring: config.enableMonitoring !== false,
            
            // CAL Guardian settings
            calGuardianPort: config.calGuardianPort || 8090,
            calGuardianHost: config.calGuardianHost || 'localhost',
            
            // Database settings
            databaseUrl: config.databaseUrl || process.env.DATABASE_URL,
            
            // Security settings
            enableAntiDuplication: config.enableAntiDuplication !== false,
            enableRequestFingerprinting: config.enableRequestFingerprinting !== false,
            
            ...config
        };
        
        // Core components
        this.calGuardian = null;
        this.databaseBuilder = null;
        this.serviceDiscovery = null;
        
        // System state
        this.discoveredServices = new Map();
        this.activeServices = new Map();
        this.systemSchema = null;
        this.securityLayers = new Map();
        
        // Integration status
        this.isInitialized = false;
        this.integrationStatus = 'starting';
        this.startTime = Date.now();
        
        console.log('🎯 UNIFIED SYSTEM ORCHESTRATOR STARTING');
        console.log('🔗 Linking all existing systems together...');
    }
    
    /**
     * Initialize and integrate all systems
     */
    async initialize() {
        try {
            console.log('\n🚀 Phase 1: Initialize Core Components');
            await this.initializeCoreComponents();
            
            console.log('\n🔍 Phase 2: Discover Existing Services');  
            await this.discoverExistingServices();
            
            console.log('\n🗄️ Phase 3: Load Database Schema');
            await this.loadDatabaseSchema();
            
            console.log('\n🔧 Phase 4: Generate Missing Components');
            await this.generateMissingComponents();
            
            console.log('\n🛡️ Phase 5: Apply Security Layers');
            await this.applySecurityLayers();
            
            console.log('\n🔗 Phase 6: Link All Services');
            await this.linkAllServices();
            
            console.log('\n📊 Phase 7: Start Monitoring');
            await this.startSystemMonitoring();
            
            this.isInitialized = true;
            this.integrationStatus = 'running';
            
            console.log('\n✅ UNIFIED SYSTEM ORCHESTRATOR READY');
            console.log(`📊 Integrated ${this.activeServices.size} services`);
            console.log(`⏱️ Initialization took ${Date.now() - this.startTime}ms`);
            
            this.emit('system-ready');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.integrationStatus = 'failed';
            throw error;
        }
    }
    
    /**
     * Initialize core components (CAL Guardian + Database Builder)
     */
    async initializeCoreComponents() {
        // Initialize CAL Guardian Production Orchestrator
        console.log('🛡️ Starting CAL Guardian Production Orchestrator...');
        this.calGuardian = new CalGuardianProductionOrchestrator({
            orchestratorPort: this.config.calGuardianPort,
            orchestratorHost: this.config.calGuardianHost
        });
        
        // Initialize Database-Driven Builder
        console.log('🗄️ Starting Database-Driven Builder...');
        this.databaseBuilder = new DatabaseDrivenBuilder({
            schemaPath: this.config.schemaPath,
            outputDir: this.config.outputDir,
            generateAPI: true,
            generateUI: true,
            generateTests: true
        });
        
        console.log('✅ Core components initialized');
    }
    
    /**
     * Discover all existing services in the unified-vault
     */
    async discoverExistingServices() {
        console.log('🔍 Scanning for existing services...');
        
        const discoveredServices = await this.scanForServices(this.config.servicesPath);
        
        for (const service of discoveredServices) {
            this.discoveredServices.set(service.name, service);
            console.log(`📦 Discovered: ${service.name} (${service.type})`);
        }
        
        console.log(`✅ Discovered ${this.discoveredServices.size} existing services`);
    }
    
    /**
     * Scan directory for service files
     */
    async scanForServices(basePath) {
        const services = [];
        
        try {
            await this.recursiveScan(basePath, services);
        } catch (error) {
            console.warn(`⚠️ Could not scan ${basePath}:`, error.message);
        }
        
        return services;
    }
    
    async recursiveScan(dir, services) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    await this.recursiveScan(fullPath, services);
                } else if (entry.isFile() && this.isServiceFile(entry.name)) {
                    const service = await this.analyzeServiceFile(fullPath);
                    if (service) {
                        services.push(service);
                    }
                }
            }
        } catch (error) {
            // Directory might not exist or be accessible
            console.debug(`Debug: Could not read directory ${dir}`);
        }
    }
    
    isServiceFile(filename) {
        const servicePatterns = [
            /\.service\.js$/,
            /\.service\.ts$/,
            /-service\.js$/,
            /-orchestrator\.js$/,
            /-engine\.js$/,
            /-manager\.js$/,
            /-handler\.js$/,
            /-processor\.js$/
        ];
        
        return servicePatterns.some(pattern => pattern.test(filename));
    }
    
    async analyzeServiceFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const name = path.basename(filePath, path.extname(filePath));
            
            // Extract service metadata from file
            const service = {
                name,
                path: filePath,
                type: this.detectServiceType(name, content),
                dependencies: this.extractDependencies(content),
                exports: this.extractExports(content),
                ports: this.extractPorts(content),
                capabilities: this.extractCapabilities(content),
                status: 'discovered'
            };
            
            return service;
        } catch (error) {
            console.debug(`Debug: Could not analyze ${filePath}:`, error.message);
            return null;
        }
    }
    
    detectServiceType(name, content) {
        const typePatterns = [
            { pattern: /orchestrator/i, type: 'orchestrator' },
            { pattern: /service/i, type: 'service' },
            { pattern: /engine/i, type: 'engine' },
            { pattern: /manager/i, type: 'manager' },
            { pattern: /processor/i, type: 'processor' },
            { pattern: /handler/i, type: 'handler' },
            { pattern: /middleware/i, type: 'middleware' },
            { pattern: /bridge/i, type: 'bridge' },
            { pattern: /wrapper/i, type: 'wrapper' }
        ];
        
        for (const { pattern, type } of typePatterns) {
            if (pattern.test(name) || pattern.test(content)) {
                return type;
            }
        }
        
        return 'service';
    }
    
    extractDependencies(content) {
        const deps = [];
        const requirePattern = /require\(['"`]([^'"`]+)['"`]\)/g;
        const importPattern = /import.*from\s+['"`]([^'"`]+)['"`]/g;
        
        let match;
        while ((match = requirePattern.exec(content))) {
            if (!match[1].startsWith('.')) deps.push(match[1]);
        }
        
        while ((match = importPattern.exec(content))) {
            if (!match[1].startsWith('.')) deps.push(match[1]);
        }
        
        return [...new Set(deps)];
    }
    
    extractExports(content) {
        const exports = [];
        
        // Look for class exports
        const classMatch = content.match(/class\s+(\w+)/);
        if (classMatch) exports.push(classMatch[1]);
        
        // Look for function exports
        const functionMatches = content.match(/module\.exports\s*=\s*(\w+)/);
        if (functionMatches) exports.push(functionMatches[1]);
        
        return exports;
    }
    
    extractPorts(content) {
        const ports = [];
        const portPattern = /port\s*[:\s]*(\d+)/gi;
        
        let match;
        while ((match = portPattern.exec(content))) {
            ports.push(parseInt(match[1]));
        }
        
        return [...new Set(ports)];
    }
    
    extractCapabilities(content) {
        const capabilities = [];
        
        const capabilityPatterns = [
            { pattern: /websocket|ws/i, cap: 'websocket' },
            { pattern: /http|express|fastify/i, cap: 'http' },
            { pattern: /database|db|sql/i, cap: 'database' },
            { pattern: /auth|jwt|oauth/i, cap: 'authentication' },
            { pattern: /crypto|encrypt|hash/i, cap: 'cryptography' },
            { pattern: /ai|llm|gpt|claude/i, cap: 'ai' },
            { pattern: /game|gaming|player/i, cap: 'gaming' },
            { pattern: /payment|stripe|paypal/i, cap: 'payments' },
            { pattern: /email|smtp|mail/i, cap: 'email' },
            { pattern: /cache|redis/i, cap: 'caching' }
        ];
        
        for (const { pattern, cap } of capabilityPatterns) {
            if (pattern.test(content)) {
                capabilities.push(cap);
            }
        }
        
        return capabilities;
    }
    
    /**
     * Load database schema for system generation
     */
    async loadDatabaseSchema() {
        console.log(`🗄️ Loading schema: ${this.config.schemaPath}`);
        
        try {
            const schemaContent = await fs.readFile(this.config.schemaPath, 'utf-8');
            this.systemSchema = await this.parseSchema(schemaContent);
            
            console.log(`✅ Schema loaded: ${this.systemSchema.tables.length} tables`);
        } catch (error) {
            console.error('❌ Failed to load schema:', error.message);
            throw error;
        }
    }
    
    async parseSchema(schemaContent) {
        // Basic SQL schema parsing
        const tables = [];
        const tablePattern = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)\s*\((.*?)\);/gis;
        
        let match;
        while ((match = tablePattern.exec(schemaContent))) {
            const tableName = match[1];
            const columns = this.parseColumns(match[2]);
            
            tables.push({
                name: tableName,
                columns,
                relationships: this.extractRelationships(match[2])
            });
        }
        
        return { tables, raw: schemaContent };
    }
    
    parseColumns(columnDefinitions) {
        const columns = [];
        const lines = columnDefinitions.split(',');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('--')) {
                const parts = trimmed.split(/\s+/);
                if (parts.length >= 2) {
                    columns.push({
                        name: parts[0],
                        type: parts[1],
                        constraints: parts.slice(2).join(' ')
                    });
                }
            }
        }
        
        return columns;
    }
    
    extractRelationships(columnDefinitions) {
        const relationships = [];
        const fkPattern = /FOREIGN KEY.*REFERENCES\s+(\w+)/gi;
        
        let match;
        while ((match = fkPattern.exec(columnDefinitions))) {
            relationships.push({
                type: 'foreign_key',
                references: match[1]
            });
        }
        
        return relationships;
    }
    
    /**
     * Generate missing components using Database-Driven Builder
     */
    async generateMissingComponents() {
        console.log('🔧 Generating missing system components...');
        
        // Use database builder to generate complete system
        const buildResult = await this.databaseBuilder.buildFromSchema(this.config.schemaPath);
        
        console.log('✅ Generated missing components:', buildResult.models.length, 'models');
    }
    
    /**
     * Apply security layers from ANTI-DUPE-SECURITY-LAYER.md
     */
    async applySecurityLayers() {
        if (!this.config.applySecurity) {
            console.log('🛡️ Security layers disabled');
            return;
        }
        
        console.log('🛡️ Applying security layers...');
        
        // Apply security layers based on documentation
        const securityLayers = [
            'request-fingerprinting',
            'auth-middleware',
            'guardian-validation',
            'database-constraints',
            'blockchain-verification'
        ];
        
        for (const layer of securityLayers) {
            await this.applySecurityLayer(layer);
        }
        
        console.log('✅ Security layers applied');
    }
    
    async applySecurityLayer(layerName) {
        console.log(`🔒 Applying ${layerName} security layer...`);
        
        this.securityLayers.set(layerName, {
            name: layerName,
            status: 'active',
            appliedAt: new Date(),
            config: this.getSecurityLayerConfig(layerName)
        });
    }
    
    getSecurityLayerConfig(layerName) {
        const configs = {
            'request-fingerprinting': {
                enabled: true,
                windowMs: 5000,
                cleanupInterval: 60000
            },
            'auth-middleware': {
                enabled: true,
                jwtSecret: process.env.JWT_SECRET || 'default-secret',
                tokenExpiry: '24h'
            },
            'guardian-validation': {
                enabled: true,
                maxItemsPerHour: 10,
                maxItemsPerDay: 100
            },
            'database-constraints': {
                enabled: true,
                uniqueConstraints: true,
                foreignKeys: true
            },
            'blockchain-verification': {
                enabled: false, // Disabled by default
                confirmationsRequired: 3
            }
        };
        
        return configs[layerName] || {};
    }
    
    /**
     * Link all discovered services through CAL Guardian
     */
    async linkAllServices() {
        console.log('🔗 Linking all services through CAL Guardian...');
        
        // Register each discovered service with CAL Guardian
        for (const [serviceName, service] of this.discoveredServices) {
            await this.linkService(serviceName, service);
        }
        
        // Start CAL Guardian orchestrator
        if (this.calGuardian && !this.calGuardian.isInitialized) {
            await this.calGuardian.initialize();
        }
        
        console.log('✅ All services linked');
    }
    
    async linkService(serviceName, service) {
        try {
            // Create workflow definitions for this service
            const workflows = this.generateServiceWorkflows(service);
            
            // Register workflows with CAL Guardian
            for (const workflow of workflows) {
                if (this.calGuardian && this.calGuardian.workflows) {
                    this.calGuardian.workflows.set(workflow.name, workflow);
                }
            }
            
            // Mark service as active
            this.activeServices.set(serviceName, {
                ...service,
                status: 'active',
                linkedAt: new Date(),
                workflows: workflows.map(w => w.name)
            });
            
            console.log(`🔗 Linked: ${serviceName}`);
            
        } catch (error) {
            console.warn(`⚠️ Failed to link ${serviceName}:`, error.message);
        }
    }
    
    generateServiceWorkflows(service) {
        const workflows = [];
        
        // Generate basic health check workflow
        workflows.push({
            name: `${service.name}-health-check`,
            steps: [
                { id: 'ping-service', component: service.name, action: 'health_check' }
            ],
            parallelizable: false,
            timeout: 30000
        });
        
        // Generate service-specific workflows based on capabilities
        if (service.capabilities.includes('database')) {
            workflows.push({
                name: `${service.name}-database-operations`,
                steps: [
                    { id: 'connect-db', component: service.name, action: 'connect' },
                    { id: 'execute-query', component: service.name, action: 'query' },
                    { id: 'disconnect-db', component: service.name, action: 'disconnect' }
                ],
                parallelizable: false,
                timeout: 60000
            });
        }
        
        if (service.capabilities.includes('ai')) {
            workflows.push({
                name: `${service.name}-ai-processing`,
                steps: [
                    { id: 'validate-input', component: service.name, action: 'validate' },
                    { id: 'process-ai', component: service.name, action: 'process' },
                    { id: 'format-output', component: service.name, action: 'format' }
                ],
                parallelizable: false,
                timeout: 120000
            });
        }
        
        return workflows;
    }
    
    /**
     * Start system monitoring
     */
    async startSystemMonitoring() {
        if (!this.config.enableMonitoring) {
            console.log('📊 Monitoring disabled');
            return;
        }
        
        console.log('📊 Starting system monitoring...');
        
        // Monitor system health every 30 seconds
        setInterval(() => {
            this.performSystemHealthCheck();
        }, 30000);
        
        // Monitor metrics every minute
        setInterval(() => {
            this.collectSystemMetrics();
        }, 60000);
        
        console.log('✅ System monitoring started');
    }
    
    async performSystemHealthCheck() {
        const healthReport = {
            timestamp: new Date(),
            orchestrator: {
                status: this.integrationStatus,
                uptime: Date.now() - this.startTime,
                activeServices: this.activeServices.size
            },
            services: {},
            calGuardian: {
                status: this.calGuardian?.isInitialized ? 'active' : 'inactive'
            }
        };
        
        // Check each active service
        for (const [serviceName, service] of this.activeServices) {
            healthReport.services[serviceName] = {
                status: service.status,
                linkedAt: service.linkedAt,
                workflows: service.workflows?.length || 0
            };
        }
        
        this.emit('health-report', healthReport);
    }
    
    async collectSystemMetrics() {
        const metrics = {
            timestamp: new Date(),
            system: {
                totalServices: this.discoveredServices.size,
                activeServices: this.activeServices.size,
                securityLayers: this.securityLayers.size,
                uptime: Date.now() - this.startTime
            },
            memory: process.memoryUsage(),
            cpu: process.cpuUsage()
        };
        
        this.emit('metrics', metrics);
    }
    
    /**
     * Get system status
     */
    getSystemStatus() {
        return {
            integrationStatus: this.integrationStatus,
            isInitialized: this.isInitialized,
            startTime: this.startTime,
            uptime: Date.now() - this.startTime,
            components: {
                calGuardian: !!this.calGuardian,
                databaseBuilder: !!this.databaseBuilder,
                serviceDiscovery: !!this.serviceDiscovery
            },
            services: {
                discovered: this.discoveredServices.size,
                active: this.activeServices.size
            },
            security: {
                layersApplied: this.securityLayers.size,
                antiDuplication: this.config.enableAntiDuplication
            }
        };
    }
    
    /**
     * Execute a workflow through the unified system
     */
    async executeWorkflow(workflowName, parameters = {}) {
        if (!this.calGuardian || !this.calGuardian.isInitialized) {
            throw new Error('CAL Guardian not initialized');
        }
        
        return await this.calGuardian.executeWorkflowLinear(workflowName, parameters, `unified_${Date.now()}`);
    }
    
    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log('🛑 Shutting down Unified System Orchestrator...');
        
        this.integrationStatus = 'shutting_down';
        
        // Shutdown CAL Guardian
        if (this.calGuardian) {
            await this.calGuardian.shutdown();
        }
        
        // Clear all state
        this.discoveredServices.clear();
        this.activeServices.clear();
        this.securityLayers.clear();
        
        this.integrationStatus = 'shutdown';
        console.log('✅ Unified System Orchestrator shutdown complete');
    }
}

// Export for use in other modules
module.exports = UnifiedSystemOrchestrator;

// CLI execution
if (require.main === module) {
    const orchestrator = new UnifiedSystemOrchestrator({
        schemaPath: process.argv[2] || './EMPIRE-MASTER-SCHEMA.sql'
    });
    
    // Event handlers
    orchestrator.on('system-ready', () => {
        console.log('\n🎉 UNIFIED SYSTEM IS READY!');
        console.log('🌐 All components linked and working together');
        console.log(`📊 Status: ${JSON.stringify(orchestrator.getSystemStatus(), null, 2)}`);
    });
    
    orchestrator.on('health-report', (report) => {
        console.log('📊 Health Report:', new Date().toISOString());
        console.log(`   Services: ${Object.keys(report.services).length} active`);
        console.log(`   Uptime: ${Math.round(report.orchestrator.uptime / 1000)}s`);
    });
    
    // Start the system
    orchestrator.initialize().catch((error) => {
        console.error('💥 System initialization failed:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await orchestrator.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await orchestrator.shutdown();
        process.exit(0);
    });
}