#!/usr/bin/env node
/**
 * SYSTEM INTEGRATION BRIDGE
 * Connects User Control Center with existing Document Generator systems
 * 
 * Integrates with:
 * - Character Model Service
 * - Visual Builder Approval Workflow
 * - Component Graph System
 * - Universal Human Interface
 * - Existing authentication and vault systems
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SystemIntegrationBridge {
    constructor(config = {}) {
        this.config = {
            baseDir: config.baseDir || process.cwd(),
            servicesDir: config.servicesDir || './services',
            vaultDir: config.vaultDir || './.vault',
            characterServicePort: config.characterServicePort || 3003,
            visualBuilderPort: config.visualBuilderPort || 3004,
            componentGraphPort: config.componentGraphPort || 3005,
            universalInterfacePort: config.universalInterfacePort || 3006,
            ...config
        };

        this.connections = new Map();
        this.healthStatus = new Map();
        this.integrationPoints = new Map();
        
        this.initialize();
    }

    async initialize() {
        console.log('🔗 Initializing System Integration Bridge...');
        
        // Register integration points
        await this.registerIntegrationPoints();
        
        // Discover existing services
        await this.discoverServices();
        
        // Setup health monitoring
        this.startHealthMonitoring();
        
        console.log('✅ System Integration Bridge initialized');
    }

    // ==================== SERVICE DISCOVERY ====================
    
    async discoverServices() {
        const servicePatterns = [
            'character-model-service*',
            'visual-builder*',
            'component-graph*',
            'universal-human-interface*',
            'deathtodata-*',
            'soulfra-*',
            'auth-*',
            'vault-*'
        ];

        for (const pattern of servicePatterns) {
            try {
                const files = await this.findFiles(pattern);
                for (const file of files) {
                    await this.analyzeServiceFile(file);
                }
            } catch (error) {
                console.warn(`Service discovery warning for ${pattern}:`, error.message);
            }
        }
    }

    async findFiles(pattern) {
        try {
            const { stdout } = await execAsync(`find ${this.config.baseDir} -name "${pattern}" -type f | head -20`);
            return stdout.trim().split('\n').filter(line => line);
        } catch (error) {
            return [];
        }
    }

    async analyzeServiceFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const serviceName = path.basename(filePath, path.extname(filePath));
            
            // Extract service metadata
            const metadata = this.extractServiceMetadata(content, serviceName);
            
            if (metadata) {
                this.integrationPoints.set(serviceName, {
                    filePath,
                    metadata,
                    status: 'discovered',
                    lastCheck: new Date()
                });
                
                console.log(`📋 Discovered service: ${serviceName}`);
            }
        } catch (error) {
            console.warn(`Failed to analyze ${filePath}:`, error.message);
        }
    }

    extractServiceMetadata(content, serviceName) {
        const metadata = {
            name: serviceName,
            ports: [],
            endpoints: [],
            dependencies: [],
            capabilities: [],
            integrationHooks: []
        };

        // Extract ports
        const portMatches = content.match(/(?:port|PORT|listen)\s*[=:]\s*(\d+)/g);
        if (portMatches) {
            metadata.ports = portMatches.map(match => {
                const port = match.match(/(\d+)/);
                return port ? parseInt(port[1]) : null;
            }).filter(Boolean);
        }

        // Extract API endpoints
        const endpointMatches = content.match(/(?:app\.|router\.|express\.)(?:get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g);
        if (endpointMatches) {
            metadata.endpoints = endpointMatches.map(match => {
                const endpoint = match.match(/['"`]([^'"`]+)['"`]/);
                return endpoint ? endpoint[1] : null;
            }).filter(Boolean);
        }

        // Extract capabilities based on content
        if (content.includes('character') || content.includes('Character')) {
            metadata.capabilities.push('character-management');
        }
        if (content.includes('visual') || content.includes('Visual')) {
            metadata.capabilities.push('visual-rendering');
        }
        if (content.includes('component') || content.includes('Component')) {
            metadata.capabilities.push('component-system');
        }
        if (content.includes('auth') || content.includes('Auth')) {
            metadata.capabilities.push('authentication');
        }
        if (content.includes('vault') || content.includes('Vault')) {
            metadata.capabilities.push('secure-storage');
        }

        // Extract integration hooks
        const hookPatterns = [
            /webhook/gi,
            /callback/gi,
            /emit\(/gi,
            /socket\./gi,
            /EventEmitter/gi
        ];

        hookPatterns.forEach(pattern => {
            if (pattern.test(content)) {
                metadata.integrationHooks.push(pattern.source.replace(/\\/g, '').replace(/gi/g, ''));
            }
        });

        return metadata.capabilities.length > 0 ? metadata : null;
    }

    // ==================== INTEGRATION POINTS ====================
    
    async registerIntegrationPoints() {
        // Character Model Service Integration
        this.registerIntegration('character-model', {
            description: '3D character model rendering and management',
            endpoints: ['/api/character/create', '/api/character/update', '/api/character/render'],
            capabilities: ['3d-rendering', 'character-persistence', 'model-export'],
            integrationMethods: ['rest-api', 'websocket', 'file-export']
        });

        // Visual Builder Integration
        this.registerIntegration('visual-builder', {
            description: 'Visual interface builder with approval workflow',
            endpoints: ['/api/builder/create', '/api/builder/approve', '/api/builder/export'],
            capabilities: ['ui-generation', 'approval-workflow', 'code-export'],
            integrationMethods: ['rest-api', 'workflow-hooks', 'template-system']
        });

        // Component Graph Integration
        this.registerIntegration('component-graph', {
            description: 'Component relationship and dependency management',
            endpoints: ['/api/graph/nodes', '/api/graph/edges', '/api/graph/analyze'],
            capabilities: ['dependency-tracking', 'relationship-mapping', 'graph-analysis'],
            integrationMethods: ['rest-api', 'graph-query', 'visualization']
        });

        // Universal Human Interface Integration
        this.registerIntegration('universal-interface', {
            description: 'Accessibility and universal design interface',
            endpoints: ['/api/ui/adapt', '/api/ui/accessibility', '/api/ui/responsive'],
            capabilities: ['accessibility', 'responsive-design', 'multi-modal'],
            integrationMethods: ['css-injection', 'dom-manipulation', 'aria-enhancement']
        });

        // Vault System Integration
        this.registerIntegration('vault-system', {
            description: 'Secure storage and encryption system',
            endpoints: ['/api/vault/store', '/api/vault/retrieve', '/api/vault/encrypt'],
            capabilities: ['encryption', 'secure-storage', 'key-management'],
            integrationMethods: ['api-keys', 'encrypted-channels', 'certificate-auth']
        });
    }

    registerIntegration(name, config) {
        this.integrationPoints.set(name, {
            ...config,
            status: 'registered',
            lastCheck: new Date()
        });
    }

    // ==================== CONNECTION MANAGEMENT ====================
    
    async establishConnection(serviceName, options = {}) {
        const integration = this.integrationPoints.get(serviceName);
        if (!integration) {
            throw new Error(`Unknown integration: ${serviceName}`);
        }

        try {
            const connection = await this.createConnection(integration, options);
            this.connections.set(serviceName, connection);
            this.healthStatus.set(serviceName, 'connected');
            
            console.log(`✅ Connected to ${serviceName}`);
            return connection;
        } catch (error) {
            this.healthStatus.set(serviceName, 'failed');
            console.error(`❌ Failed to connect to ${serviceName}:`, error.message);
            throw error;
        }
    }

    async createConnection(integration, options) {
        const connection = {
            name: integration.name,
            status: 'connecting',
            capabilities: integration.capabilities,
            methods: {},
            lastActivity: new Date()
        };

        // Create connection methods based on integration type
        if (integration.integrationMethods.includes('rest-api')) {
            connection.methods.restApi = this.createRestApiMethods(integration);
        }

        if (integration.integrationMethods.includes('websocket')) {
            connection.methods.websocket = await this.createWebSocketConnection(integration);
        }

        if (integration.integrationMethods.includes('file-export')) {
            connection.methods.fileExport = this.createFileExportMethods(integration);
        }

        if (integration.integrationMethods.includes('workflow-hooks')) {
            connection.methods.workflowHooks = this.createWorkflowHooks(integration);
        }

        connection.status = 'connected';
        return connection;
    }

    createRestApiMethods(integration) {
        return {
            async get(endpoint, params = {}) {
                const url = `http://localhost:${this.guessPort(integration)}${endpoint}`;
                // Implementation would use fetch or axios
                return { url, method: 'GET', params };
            },
            
            async post(endpoint, data = {}) {
                const url = `http://localhost:${this.guessPort(integration)}${endpoint}`;
                return { url, method: 'POST', data };
            },
            
            async put(endpoint, data = {}) {
                const url = `http://localhost:${this.guessPort(integration)}${endpoint}`;
                return { url, method: 'PUT', data };
            }
        };
    }

    async createWebSocketConnection(integration) {
        // Mock WebSocket connection - in real implementation would use ws library
        return {
            connected: true,
            emit: (event, data) => ({ event, data }),
            on: (event, callback) => ({ event, callback })
        };
    }

    createFileExportMethods(integration) {
        return {
            async exportToFile(data, filename) {
                const filepath = path.join(this.config.baseDir, 'exports', filename);
                await fs.mkdir(path.dirname(filepath), { recursive: true });
                await fs.writeFile(filepath, JSON.stringify(data, null, 2));
                return filepath;
            },
            
            async importFromFile(filename) {
                const filepath = path.join(this.config.baseDir, 'exports', filename);
                const content = await fs.readFile(filepath, 'utf8');
                return JSON.parse(content);
            }
        };
    }

    createWorkflowHooks(integration) {
        return {
            async triggerWorkflow(workflowName, data) {
                console.log(`🔄 Triggering workflow: ${workflowName}`, data);
                return { workflow: workflowName, data, status: 'triggered' };
            },
            
            async getWorkflowStatus(workflowId) {
                return { id: workflowId, status: 'completed', result: {} };
            }
        };
    }

    // ==================== USER CONTROL CENTER INTEGRATION ====================
    
    async integrateWithControlCenter() {
        console.log('🎛️ Integrating with User Control Center...');
        
        // Create integration configuration for the Control Center
        const controlCenterConfig = {
            integrations: {},
            capabilities: {},
            healthChecks: {}
        };

        // Map discovered services to Control Center format
        for (const [name, integration] of this.integrationPoints) {
            controlCenterConfig.integrations[name] = {
                available: this.healthStatus.get(name) === 'connected',
                capabilities: integration.capabilities || [],
                endpoints: integration.endpoints || [],
                lastCheck: integration.lastCheck
            };
        }

        // Add capability mappings
        controlCenterConfig.capabilities = {
            '3d-rendering': this.getServicesWithCapability('3d-rendering'),
            'character-management': this.getServicesWithCapability('character-management'),
            'visual-rendering': this.getServicesWithCapability('visual-rendering'),
            'component-system': this.getServicesWithCapability('component-system'),
            'authentication': this.getServicesWithCapability('authentication'),
            'secure-storage': this.getServicesWithCapability('secure-storage')
        };

        // Write integration configuration
        const configPath = path.join(this.config.baseDir, 'control-center-integration.json');
        await fs.writeFile(configPath, JSON.stringify(controlCenterConfig, null, 2));
        
        console.log(`📝 Integration configuration written to: ${configPath}`);
        return controlCenterConfig;
    }

    getServicesWithCapability(capability) {
        const services = [];
        for (const [name, integration] of this.integrationPoints) {
            if (integration.capabilities && integration.capabilities.includes(capability)) {
                services.push({
                    name,
                    status: this.healthStatus.get(name) || 'unknown',
                    endpoints: integration.endpoints || []
                });
            }
        }
        return services;
    }

    // ==================== HEALTH MONITORING ====================
    
    startHealthMonitoring() {
        setInterval(() => {
            this.performHealthChecks();
        }, 30000); // Check every 30 seconds
    }

    async performHealthChecks() {
        for (const [serviceName, connection] of this.connections) {
            try {
                await this.checkServiceHealth(serviceName, connection);
            } catch (error) {
                this.healthStatus.set(serviceName, 'unhealthy');
                console.warn(`⚠️ Health check failed for ${serviceName}:`, error.message);
            }
        }
    }

    async checkServiceHealth(serviceName, connection) {
        // Mock health check - in real implementation would ping service
        const isHealthy = Math.random() > 0.1; // 90% uptime simulation
        
        if (isHealthy) {
            this.healthStatus.set(serviceName, 'healthy');
            connection.lastActivity = new Date();
        } else {
            this.healthStatus.set(serviceName, 'unhealthy');
        }
        
        return isHealthy;
    }

    // ==================== UTILITY METHODS ====================
    
    guessPort(integration) {
        // Try to guess port based on service type
        if (integration.name.includes('character')) return 3003;
        if (integration.name.includes('visual')) return 3004;
        if (integration.name.includes('component')) return 3005;
        if (integration.name.includes('universal')) return 3006;
        return 3000 + Math.floor(Math.random() * 1000);
    }

    getIntegrationStatus() {
        const status = {
            totalIntegrations: this.integrationPoints.size,
            activeConnections: this.connections.size,
            healthStatus: Object.fromEntries(this.healthStatus),
            capabilities: {},
            lastUpdate: new Date().toISOString()
        };

        // Count capabilities
        for (const integration of this.integrationPoints.values()) {
            if (integration.capabilities) {
                integration.capabilities.forEach(cap => {
                    status.capabilities[cap] = (status.capabilities[cap] || 0) + 1;
                });
            }
        }

        return status;
    }

    async generateIntegrationReport() {
        const report = {
            timestamp: new Date().toISOString(),
            status: this.getIntegrationStatus(),
            integrations: {},
            recommendations: []
        };

        // Add detailed integration info
        for (const [name, integration] of this.integrationPoints) {
            report.integrations[name] = {
                ...integration,
                connectionStatus: this.healthStatus.get(name) || 'not-connected',
                hasConnection: this.connections.has(name)
            };
        }

        // Generate recommendations
        if (report.status.activeConnections < report.status.totalIntegrations) {
            report.recommendations.push('Some services are not connected - consider establishing connections for full functionality');
        }

        if (Object.values(report.status.healthStatus).includes('unhealthy')) {
            report.recommendations.push('Some services are unhealthy - check service logs and restart if needed');
        }

        return report;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SystemIntegrationBridge;
}

// CLI usage
if (require.main === module) {
    async function main() {
        const bridge = new SystemIntegrationBridge();
        
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate and display integration report
        const report = await bridge.generateIntegrationReport();
        console.log('\n📊 Integration Report:');
        console.log(JSON.stringify(report, null, 2));
        
        // Integrate with Control Center
        const controlCenterConfig = await bridge.integrateWithControlCenter();
        console.log('\n🎛️ Control Center Integration Complete');
        
        // Keep running for health monitoring
        console.log('\n🔄 Health monitoring active...');
        console.log('Press Ctrl+C to exit');
    }
    
    main().catch(console.error);
}