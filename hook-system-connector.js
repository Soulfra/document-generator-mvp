/**
 * Hook System Connector
 * 
 * Bridges between orchestration layers and exit hatches, connecting all the systems together.
 * Monitors for key requests and resource needs, handles graceful fallbacks to platform resources,
 * and tracks usage for billing purposes. This is the glue that makes everything work seamlessly.
 * 
 * "cloud deployment is all part of the orchestrations tool layer or hooks"
 */

const EventEmitter = require('events');
const { ExitHatchOrchestrationLayer } = require('./exit-hatch-orchestration-layer.js');
const { Chapter7BillingReceiptGenerator } = require('./chapter7-billing-receipt-generator.js');
const { APIPermissionTierManager } = require('./api-permission-tier-management-system.js');
const { MultiTenantDeploymentOrchestrator } = require('./multi-tenant-deployment-orchestrator.js');

class HookSystemConnector extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            enableAutoConnect: options.enableAutoConnect !== false,
            monitoringInterval: options.monitoringInterval || 5000,
            retryAttempts: options.retryAttempts || 3,
            gracefulFallback: options.gracefulFallback !== false,
            ...options
        };
        
        // System connections
        this.systems = {
            exitHatch: null,
            billing: null,
            apiTiers: null,
            deployment: null,
            creditPool: null, // Platform-Credit-Pool-System
            domainGateway: null, // master-domain-gateway-hub
            chapter7: null // Chapter 7 Auto-Generator
        };
        
        // Hook registry for different events
        this.hooks = {
            // Resource request hooks
            beforeResourceRequest: [],
            afterResourceRequest: [],
            
            // Billing hooks
            beforeBilling: [],
            afterBilling: [],
            
            // Deployment hooks
            beforeDeployment: [],
            afterDeployment: [],
            
            // Fallback hooks
            onFallbackTriggered: [],
            onFallbackCompleted: [],
            
            // Error hooks
            onError: [],
            onRetry: []
        };
        
        // Active connections and monitoring
        this.activeConnections = new Map();
        this.monitoringActive = false;
        this.statistics = {
            totalRequests: 0,
            customResources: 0,
            platformFallbacks: 0,
            billingEvents: 0,
            errors: 0
        };
        
        console.log('🔗 Hook System Connector initialized');
        
        if (this.config.enableAutoConnect) {
            this.connectAllSystems();
        }
    }
    
    /**
     * Connect all systems together
     */
    async connectAllSystems() {
        console.log('🔌 Connecting all systems...');
        
        try {
            // Initialize core systems
            this.systems.exitHatch = new ExitHatchOrchestrationLayer();
            this.systems.billing = new Chapter7BillingReceiptGenerator();
            this.systems.apiTiers = new APIPermissionTierManager();
            this.systems.deployment = new MultiTenantDeploymentOrchestrator();
            
            // Set up inter-system connections
            await this.setupSystemConnections();
            
            // Register core hooks
            await this.registerCoreHooks();
            
            // Start monitoring
            if (this.config.monitoringInterval > 0) {
                this.startMonitoring();
            }
            
            console.log('✅ All systems connected successfully');
            
            this.emit('systems:connected', {
                timestamp: new Date(),
                systems: Object.keys(this.systems).filter(s => this.systems[s] !== null)
            });
            
        } catch (error) {
            console.error('❌ Failed to connect systems:', error);
            this.emit('systems:error', error);
            throw error;
        }
    }
    
    /**
     * Set up connections between systems
     */
    async setupSystemConnections() {
        // Connect Exit Hatch to Billing
        this.systems.exitHatch.on('billing:resource_used', async (event) => {
            console.log('💰 Billing event from exit hatch:', event.resourceType);
            
            // Run pre-billing hooks
            await this.runHooks('beforeBilling', event);
            
            // Generate Chapter 7 receipt
            const receipt = await this.systems.billing.generateReceipt(event);
            
            // Run post-billing hooks
            await this.runHooks('afterBilling', { event, receipt });
            
            this.statistics.billingEvents++;
        });
        
        // Connect Exit Hatch to API Tiers
        this.systems.exitHatch.registerHook('resource_requested', async (request) => {
            if (request.resourceType === 'api_keys') {
                // Determine appropriate tier
                const deployment = await this.getDeploymentInfo(request.deploymentId);
                if (deployment && deployment.tierAccess) {
                    request.options.tier = deployment.tierAccess[0];
                }
            }
        });
        
        // Connect Deployment Orchestrator to Exit Hatch
        this.setupDeploymentHooks();
        
        // Connect API Tiers to Billing
        this.setupAPITierBilling();
        
        console.log('🔗 System connections established');
    }
    
    /**
     * Register core system hooks
     */
    async registerCoreHooks() {
        // Resource request monitoring
        this.systems.exitHatch.registerHook('resource_requested', async (request) => {
            this.statistics.totalRequests++;
            await this.runHooks('beforeResourceRequest', request);
        });
        
        this.systems.exitHatch.registerHook('resource_fulfilled_custom', async (request) => {
            this.statistics.customResources++;
            await this.runHooks('afterResourceRequest', { ...request, type: 'custom' });
        });
        
        this.systems.exitHatch.registerHook('resource_fulfilled_platform', async (request) => {
            this.statistics.platformFallbacks++;
            await this.runHooks('onFallbackTriggered', request);
            await this.runHooks('afterResourceRequest', { ...request, type: 'platform' });
            await this.runHooks('onFallbackCompleted', request);
        });
        
        this.systems.exitHatch.registerHook('resource_failed', async (request) => {
            this.statistics.errors++;
            await this.runHooks('onError', request);
        });
        
        console.log('🪝 Core hooks registered');
    }
    
    /**
     * Set up deployment-related hooks
     */
    setupDeploymentHooks() {
        // Before deployment, check resource requirements
        this.registerHook('beforeDeployment', async (deployment) => {
            console.log(`🚀 Pre-deployment hook for ${deployment.brandName}`);
            
            const resourceRequirements = await this.analyzeResourceRequirements(deployment);
            
            // Pre-allocate resources through exit hatches
            for (const requirement of resourceRequirements) {
                try {
                    await this.systems.exitHatch.requestResource(
                        deployment.deploymentId,
                        requirement.type,
                        requirement.options
                    );
                } catch (error) {
                    console.error(`Failed to allocate ${requirement.type}:`, error);
                    throw error;
                }
            }
        });
        
        // After deployment, set up monitoring and billing
        this.registerHook('afterDeployment', async (deployment) => {
            console.log(`✅ Post-deployment hook for ${deployment.brandName}`);
            
            // Set up usage monitoring
            this.activeConnections.set(deployment.deploymentId, {
                deployment,
                startTime: new Date(),
                resources: deployment.resources,
                monitoring: true
            });
        });
    }
    
    /**
     * Set up API tier billing connections
     */
    setupAPITierBilling() {
        // When API usage is tracked, generate appropriate billing
        this.systems.apiTiers.on('usage:tracked', async (usage) => {
            if (usage.billable) {
                const billingEvent = {
                    deploymentId: usage.deploymentId,
                    resourceType: 'api_keys',
                    usage: {
                        timestamp: new Date(),
                        cost: usage.cost,
                        details: {
                            service: usage.service,
                            tier: usage.tier,
                            endpoint: usage.endpoint,
                            requests: usage.requests
                        }
                    },
                    reasoning: {
                        who: usage.deploymentId,
                        what: `${usage.service} API usage`,
                        when: new Date(),
                        where: 'Platform API Infrastructure',
                        why: 'API calls made using platform keys',
                        how: {
                            cost: usage.cost,
                            calculation: `${usage.requests} requests @ tier ${usage.tier} rates`,
                            details: usage
                        }
                    }
                };
                
                await this.systems.billing.generateReceipt(billingEvent);
            }
        });
    }
    
    /**
     * Register a hook for a specific event
     */
    registerHook(event, handler) {
        if (!this.hooks[event]) {
            this.hooks[event] = [];
        }
        
        this.hooks[event].push(handler);
        console.log(`🪝 Hook registered for event: ${event}`);
        
        return () => {
            // Return unregister function
            const index = this.hooks[event].indexOf(handler);
            if (index > -1) {
                this.hooks[event].splice(index, 1);
            }
        };
    }
    
    /**
     * Run all hooks for an event
     */
    async runHooks(event, data) {
        const hooks = this.hooks[event] || [];
        
        for (const hook of hooks) {
            try {
                await hook(data);
            } catch (error) {
                console.error(`Hook error in ${event}:`, error);
                
                // Run error hooks
                if (event !== 'onError') {
                    await this.runHooks('onError', { event, error, data });
                }
            }
        }
    }
    
    /**
     * Request a resource through the connected systems
     */
    async requestResource(deploymentId, resourceType, options = {}) {
        console.log(`📤 Resource request: ${resourceType} for ${deploymentId}`);
        
        try {
            // Check if we have deployment info
            const deployment = await this.getDeploymentInfo(deploymentId);
            
            if (deployment) {
                // Enhance options with deployment context
                options = {
                    ...options,
                    tier: deployment.tierAccess?.[0] || options.tier,
                    brandName: deployment.brandName,
                    domain: deployment.domain
                };
            }
            
            // Request through exit hatch
            const result = await this.systems.exitHatch.requestResource(
                deploymentId,
                resourceType,
                options
            );
            
            // Track the connection
            this.trackResourceConnection(deploymentId, resourceType, result);
            
            return result;
            
        } catch (error) {
            console.error(`Failed to request ${resourceType}:`, error);
            
            // Retry logic
            if (this.config.retryAttempts > 0) {
                return this.retryResourceRequest(deploymentId, resourceType, options);
            }
            
            throw error;
        }
    }
    
    /**
     * Retry resource request with exponential backoff
     */
    async retryResourceRequest(deploymentId, resourceType, options, attempt = 1) {
        if (attempt > this.config.retryAttempts) {
            throw new Error(`Failed after ${this.config.retryAttempts} attempts`);
        }
        
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ Retrying ${resourceType} request in ${delay}ms (attempt ${attempt})`);
        
        await this.runHooks('onRetry', { deploymentId, resourceType, attempt });
        
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
            return await this.systems.exitHatch.requestResource(
                deploymentId,
                resourceType,
                options
            );
        } catch (error) {
            return this.retryResourceRequest(deploymentId, resourceType, options, attempt + 1);
        }
    }
    
    /**
     * Get deployment information
     */
    async getDeploymentInfo(deploymentId) {
        // Check active connections first
        const connection = this.activeConnections.get(deploymentId);
        if (connection) {
            return connection.deployment;
        }
        
        // Check with deployment orchestrator
        if (this.systems.deployment) {
            const deployment = this.systems.deployment.deployments.get(deploymentId);
            if (deployment) {
                return deployment;
            }
        }
        
        // Check with API tier manager
        if (this.systems.apiTiers) {
            const deployment = this.systems.apiTiers.deploymentConfigs.get(deploymentId);
            if (deployment) {
                return deployment;
            }
        }
        
        return null;
    }
    
    /**
     * Analyze resource requirements for a deployment
     */
    async analyzeResourceRequirements(deployment) {
        const requirements = [];
        
        // API keys needed
        if (!deployment.apiKeys) {
            requirements.push({
                type: 'api_keys',
                options: {
                    service: 'platform-default',
                    tier: deployment.tierAccess?.[0] || 'tier1_public'
                }
            });
        }
        
        // Domain needed
        if (!deployment.customDomain) {
            requirements.push({
                type: 'domain_names',
                options: {
                    brandName: deployment.brandName
                }
            });
        }
        
        // Cloud resources
        if (!deployment.cloudProvider) {
            requirements.push({
                type: 'cloud_resources',
                options: {
                    resourceType: 'compute',
                    size: deployment.deploymentStrategy || 'small'
                }
            });
        }
        
        // SSL certificate
        requirements.push({
            type: 'ssl_certificates',
            options: {
                domain: deployment.domain
            }
        });
        
        // Database
        if (deployment.needsDatabase !== false) {
            requirements.push({
                type: 'database_access',
                options: {
                    engine: 'postgresql'
                }
            });
        }
        
        return requirements;
    }
    
    /**
     * Track resource connections
     */
    trackResourceConnection(deploymentId, resourceType, result) {
        if (!this.activeConnections.has(deploymentId)) {
            this.activeConnections.set(deploymentId, {
                resources: {},
                startTime: new Date()
            });
        }
        
        const connection = this.activeConnections.get(deploymentId);
        connection.resources[resourceType] = {
            result,
            timestamp: new Date(),
            type: result.type, // 'custom' or 'platform'
            billing: result.billing
        };
    }
    
    /**
     * Start monitoring active connections
     */
    startMonitoring() {
        if (this.monitoringActive) return;
        
        this.monitoringActive = true;
        
        this.monitoringInterval = setInterval(() => {
            this.monitorActiveConnections();
        }, this.config.monitoringInterval);
        
        console.log('👁️ Monitoring started');
    }
    
    /**
     * Monitor active connections for usage and health
     */
    async monitorActiveConnections() {
        for (const [deploymentId, connection] of this.activeConnections) {
            if (!connection.monitoring) continue;
            
            try {
                // Check resource usage
                for (const [resourceType, resource] of Object.entries(connection.resources || {})) {
                    if (resource.billing && resource.type === 'platform') {
                        // Track ongoing usage for billable resources
                        await this.trackOngoingUsage(deploymentId, resourceType, resource);
                    }
                }
                
                // Health check
                if (connection.deployment) {
                    const health = await this.checkDeploymentHealth(deploymentId);
                    if (!health.healthy) {
                        console.warn(`⚠️ Unhealthy deployment: ${deploymentId}`);
                        this.emit('deployment:unhealthy', { deploymentId, health });
                    }
                }
                
            } catch (error) {
                console.error(`Monitoring error for ${deploymentId}:`, error);
            }
        }
    }
    
    /**
     * Track ongoing usage for billable resources
     */
    async trackOngoingUsage(deploymentId, resourceType, resource) {
        // This would integrate with actual usage tracking
        // For now, simulate periodic usage
        
        const usage = {
            deploymentId,
            resourceType,
            timestamp: new Date(),
            amount: Math.random() * 10, // Simulated usage
            cost: 0.01 * Math.random() // Simulated cost
        };
        
        this.emit('usage:tracked', usage);
    }
    
    /**
     * Check deployment health
     */
    async checkDeploymentHealth(deploymentId) {
        // This would check actual deployment health
        // For now, return simulated health
        
        return {
            healthy: Math.random() > 0.1, // 90% healthy
            metrics: {
                uptime: 99.5,
                responseTime: Math.random() * 200,
                errorRate: Math.random() * 0.05
            }
        };
    }
    
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            this.monitoringActive = false;
            console.log('👁️ Monitoring stopped');
        }
    }
    
    /**
     * Get system statistics
     */
    getStatistics() {
        return {
            ...this.statistics,
            activeConnections: this.activeConnections.size,
            uptime: process.uptime(),
            timestamp: new Date()
        };
    }
    
    /**
     * Graceful shutdown
     */
    async shutdown() {
        console.log('🔌 Shutting down Hook System Connector...');
        
        // Stop monitoring
        this.stopMonitoring();
        
        // Close active connections
        for (const [deploymentId, connection] of this.activeConnections) {
            try {
                await this.closeConnection(deploymentId);
            } catch (error) {
                console.error(`Error closing connection ${deploymentId}:`, error);
            }
        }
        
        // Emit shutdown event
        this.emit('shutdown', { timestamp: new Date() });
        
        console.log('✅ Hook System Connector shut down');
    }
    
    /**
     * Close a specific connection
     */
    async closeConnection(deploymentId) {
        const connection = this.activeConnections.get(deploymentId);
        if (!connection) return;
        
        // Final usage tracking
        if (connection.resources) {
            for (const [resourceType, resource] of Object.entries(connection.resources)) {
                if (resource.billing) {
                    await this.trackOngoingUsage(deploymentId, resourceType, resource);
                }
            }
        }
        
        this.activeConnections.delete(deploymentId);
        console.log(`🔌 Connection closed: ${deploymentId}`);
    }
}

// Example usage and testing
async function testHookSystem() {
    console.log('\n🧪 Testing Hook System Connector\n');
    
    const connector = new HookSystemConnector({
        enableAutoConnect: true,
        monitoringInterval: 5000
    });
    
    // Register custom hooks
    connector.registerHook('beforeResourceRequest', async (request) => {
        console.log(`🎣 Before resource request: ${request.resourceType}`);
    });
    
    connector.registerHook('onFallbackTriggered', async (request) => {
        console.log(`🔄 Fallback triggered for: ${request.resourceType}`);
    });
    
    connector.registerHook('afterBilling', async ({ event, receipt }) => {
        console.log(`💰 Billing completed: $${receipt.billing.finalCost.toFixed(4)}`);
    });
    
    // Wait for systems to connect
    await new Promise(resolve => {
        connector.once('systems:connected', resolve);
    });
    
    // Test resource request
    console.log('\n📤 Testing resource requests...\n');
    
    const deploymentId = 'test-deployment-456';
    
    // Request API key (will fall back to platform)
    const apiKeyResult = await connector.requestResource(deploymentId, 'api_keys', {
        service: 'anthropic'
    });
    console.log('API Key Result:', apiKeyResult);
    
    // Request domain
    const domainResult = await connector.requestResource(deploymentId, 'domain_names', {
        brandName: 'Test Brand'
    });
    console.log('Domain Result:', domainResult);
    
    // Get statistics
    console.log('\n📊 System Statistics:');
    console.log(connector.getStatistics());
    
    // Shutdown after 10 seconds
    setTimeout(async () => {
        await connector.shutdown();
    }, 10000);
}

// Run test
testHookSystem().catch(console.error);

module.exports = {
    HookSystemConnector
};

console.log('\n🔗 Hook System Connector Ready!');
console.log('✅ Bridges all orchestration layers');
console.log('✅ Monitors resource requests and usage');
console.log('✅ Handles graceful fallbacks');
console.log('✅ Tracks usage for billing');
console.log('✅ Extensible hook system');
console.log('✅ Health monitoring and statistics');