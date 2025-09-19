#!/usr/bin/env node

/**
 * SERVICE DISCOVERY & REGISTRATION
 * Dynamic service registration, health monitoring, and load balancing
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ServiceRegistry extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            heartbeatInterval: options.heartbeatInterval || 10000, // 10 seconds
            healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
            unhealthyThreshold: options.unhealthyThreshold || 3, // failures before marking unhealthy
            registryFile: options.registryFile || './service-registry.json',
            ...options
        };
        
        // Service registry
        this.services = new Map();
        
        // Health check failures
        this.healthFailures = new Map();
        
        // Load balancing state
        this.loadBalancers = new Map();
        
        // Initialize
        this.loadRegistry();
        this.startHealthMonitoring();
        
        console.log('🔍 Service Registry initialized');
    }

    /**
     * Register a service
     */
    async register(serviceInfo) {
        const {
            name,
            version,
            host = 'localhost',
            port,
            protocol = 'http',
            healthEndpoint = '/health',
            metadata = {}
        } = serviceInfo;
        
        // Generate service ID
        const serviceId = this.generateServiceId(name, host, port);
        
        const service = {
            id: serviceId,
            name,
            version,
            host,
            port,
            protocol,
            url: `${protocol}://${host}:${port}`,
            healthEndpoint,
            metadata,
            status: 'registering',
            registeredAt: new Date(),
            lastHeartbeat: new Date(),
            lastHealthCheck: null,
            instances: 1
        };
        
        // Check if service already exists
        const existingServices = this.findServices({ name });
        if (existingServices.length > 0) {
            // This is another instance of the same service
            service.instances = existingServices.length + 1;
        }
        
        // Store service
        this.services.set(serviceId, service);
        
        // Emit registration event
        this.emit('service:registered', service);
        
        console.log(`✅ Service registered: ${name} (${serviceId})`);
        
        // Perform initial health check
        await this.checkServiceHealth(serviceId);
        
        // Save registry
        await this.saveRegistry();
        
        return {
            success: true,
            serviceId,
            service
        };
    }

    /**
     * Deregister a service
     */
    async deregister(serviceIdOrName) {
        let serviceId = serviceIdOrName;
        
        // If name provided, find service ID
        if (!this.services.has(serviceId)) {
            const services = this.findServices({ name: serviceIdOrName });
            if (services.length === 0) {
                return { success: false, error: 'Service not found' };
            }
            serviceId = services[0].id;
        }
        
        const service = this.services.get(serviceId);
        if (!service) {
            return { success: false, error: 'Service not found' };
        }
        
        // Remove service
        this.services.delete(serviceId);
        this.healthFailures.delete(serviceId);
        
        // Update load balancers
        this.updateLoadBalancers(service.name);
        
        // Emit deregistration event
        this.emit('service:deregistered', service);
        
        console.log(`🚪 Service deregistered: ${service.name} (${serviceId})`);
        
        // Save registry
        await this.saveRegistry();
        
        return { success: true, service };
    }

    /**
     * Update service heartbeat
     */
    heartbeat(serviceId, metadata = {}) {
        const service = this.services.get(serviceId);
        if (!service) {
            return { success: false, error: 'Service not found' };
        }
        
        service.lastHeartbeat = new Date();
        service.metadata = { ...service.metadata, ...metadata };
        
        // Reset health failures on successful heartbeat
        this.healthFailures.set(serviceId, 0);
        
        return { success: true };
    }

    /**
     * Find services by criteria
     */
    findServices(criteria = {}) {
        const services = [];
        
        for (const [id, service] of this.services) {
            let match = true;
            
            if (criteria.name && service.name !== criteria.name) {
                match = false;
            }
            
            if (criteria.status && service.status !== criteria.status) {
                match = false;
            }
            
            if (criteria.version && service.version !== criteria.version) {
                match = false;
            }
            
            if (criteria.healthy !== undefined) {
                const isHealthy = service.status === 'healthy';
                if (criteria.healthy !== isHealthy) {
                    match = false;
                }
            }
            
            if (match) {
                services.push(service);
            }
        }
        
        return services;
    }

    /**
     * Get service by load balancing
     */
    getService(serviceName, strategy = 'round-robin') {
        const healthyServices = this.findServices({
            name: serviceName,
            status: 'healthy'
        });
        
        if (healthyServices.length === 0) {
            return null;
        }
        
        switch (strategy) {
            case 'round-robin':
                return this.roundRobinSelect(serviceName, healthyServices);
                
            case 'random':
                return healthyServices[Math.floor(Math.random() * healthyServices.length)];
                
            case 'least-connections':
                // Would need connection tracking
                return healthyServices[0];
                
            case 'ip-hash':
                // Would need client IP
                return healthyServices[0];
                
            default:
                return healthyServices[0];
        }
    }

    /**
     * Round-robin selection
     */
    roundRobinSelect(serviceName, services) {
        if (!this.loadBalancers.has(serviceName)) {
            this.loadBalancers.set(serviceName, 0);
        }
        
        const index = this.loadBalancers.get(serviceName);
        const service = services[index % services.length];
        
        this.loadBalancers.set(serviceName, index + 1);
        
        return service;
    }

    /**
     * Check service health
     */
    async checkServiceHealth(serviceId) {
        const service = this.services.get(serviceId);
        if (!service) return;
        
        try {
            const response = await fetch(`${service.url}${service.healthEndpoint}`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                service.status = 'healthy';
                service.lastHealthCheck = new Date();
                this.healthFailures.set(serviceId, 0);
                
                this.emit('service:healthy', service);
            } else {
                this.handleHealthFailure(serviceId);
            }
        } catch (error) {
            this.handleHealthFailure(serviceId);
        }
    }

    /**
     * Handle health check failure
     */
    handleHealthFailure(serviceId) {
        const service = this.services.get(serviceId);
        if (!service) return;
        
        const failures = (this.healthFailures.get(serviceId) || 0) + 1;
        this.healthFailures.set(serviceId, failures);
        
        if (failures >= this.config.unhealthyThreshold) {
            service.status = 'unhealthy';
            this.emit('service:unhealthy', service);
            console.log(`❌ Service unhealthy: ${service.name} (${serviceId})`);
        } else {
            service.status = 'degraded';
            console.log(`⚠️  Service degraded: ${service.name} (${serviceId}) - ${failures}/${this.config.unhealthyThreshold} failures`);
        }
        
        service.lastHealthCheck = new Date();
    }

    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        // Heartbeat timeout check
        setInterval(() => {
            const now = Date.now();
            
            for (const [id, service] of this.services) {
                const timeSinceHeartbeat = now - service.lastHeartbeat.getTime();
                
                if (timeSinceHeartbeat > this.config.heartbeatInterval * 3) {
                    // No heartbeat for 3 intervals
                    service.status = 'stale';
                    this.emit('service:stale', service);
                }
            }
        }, this.config.heartbeatInterval);
        
        // Health check
        setInterval(() => {
            for (const [id, service] of this.services) {
                if (service.status !== 'stale') {
                    this.checkServiceHealth(id);
                }
            }
        }, this.config.healthCheckInterval);
    }

    /**
     * Update load balancers after service change
     */
    updateLoadBalancers(serviceName) {
        // Reset round-robin counter if no healthy services
        const healthyServices = this.findServices({
            name: serviceName,
            status: 'healthy'
        });
        
        if (healthyServices.length === 0) {
            this.loadBalancers.delete(serviceName);
        }
    }

    /**
     * Generate unique service ID
     */
    generateServiceId(name, host, port) {
        const hash = crypto.createHash('md5')
            .update(`${name}:${host}:${port}`)
            .digest('hex');
        return `${name}-${hash.substring(0, 8)}`;
    }

    /**
     * Load registry from disk
     */
    async loadRegistry() {
        try {
            const data = await fs.readFile(this.config.registryFile, 'utf8');
            const registry = JSON.parse(data);
            
            // Restore services
            for (const [id, service] of Object.entries(registry.services)) {
                // Convert dates
                service.registeredAt = new Date(service.registeredAt);
                service.lastHeartbeat = new Date(service.lastHeartbeat);
                if (service.lastHealthCheck) {
                    service.lastHealthCheck = new Date(service.lastHealthCheck);
                }
                
                this.services.set(id, service);
            }
            
            console.log(`📚 Loaded ${this.services.size} services from registry`);
        } catch (error) {
            // Registry doesn't exist yet
            if (error.code !== 'ENOENT') {
                console.error('Failed to load registry:', error);
            }
        }
    }

    /**
     * Save registry to disk
     */
    async saveRegistry() {
        try {
            const registry = {
                version: '1.0.0',
                services: Object.fromEntries(this.services),
                savedAt: new Date()
            };
            
            await fs.writeFile(
                this.config.registryFile,
                JSON.stringify(registry, null, 2)
            );
        } catch (error) {
            console.error('Failed to save registry:', error);
        }
    }

    /**
     * Get registry status
     */
    getStatus() {
        const services = Array.from(this.services.values());
        const byStatus = services.reduce((acc, service) => {
            acc[service.status] = (acc[service.status] || 0) + 1;
            return acc;
        }, {});
        
        const byName = services.reduce((acc, service) => {
            if (!acc[service.name]) {
                acc[service.name] = [];
            }
            acc[service.name].push({
                id: service.id,
                status: service.status,
                url: service.url
            });
            return acc;
        }, {});
        
        return {
            total: services.length,
            byStatus,
            byName,
            services: services.map(s => ({
                id: s.id,
                name: s.name,
                status: s.status,
                url: s.url,
                lastHeartbeat: s.lastHeartbeat
            }))
        };
    }

    /**
     * Express middleware for service registration
     */
    middleware() {
        const express = require('express');
        const router = express.Router();
        
        // Register service
        router.post('/register', async (req, res) => {
            const result = await this.register(req.body);
            res.json(result);
        });
        
        // Deregister service
        router.delete('/deregister/:serviceId', async (req, res) => {
            const result = await this.deregister(req.params.serviceId);
            res.json(result);
        });
        
        // Heartbeat
        router.post('/heartbeat/:serviceId', (req, res) => {
            const result = this.heartbeat(req.params.serviceId, req.body);
            res.json(result);
        });
        
        // Find services
        router.get('/services', (req, res) => {
            const services = this.findServices(req.query);
            res.json(services);
        });
        
        // Get service (with load balancing)
        router.get('/service/:name', (req, res) => {
            const service = this.getService(
                req.params.name,
                req.query.strategy
            );
            
            if (service) {
                res.json(service);
            } else {
                res.status(404).json({ error: 'No healthy service found' });
            }
        });
        
        // Registry status
        router.get('/status', (req, res) => {
            res.json(this.getStatus());
        });
        
        return router;
    }
}

// Export for use as module
module.exports = ServiceRegistry;

// Run as standalone service if called directly
if (require.main === module) {
    const express = require('express');
    const app = express();
    
    app.use(express.json());
    
    const registry = new ServiceRegistry();
    
    // Mount registry routes
    app.use('/registry', registry.middleware());
    
    // Health check
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            service: 'service-registry',
            uptime: process.uptime()
        });
    });
    
    const port = process.env.REGISTRY_PORT || 5555;
    app.listen(port, () => {
        console.log(`🔍 Service Registry API running on port ${port}`);
    });
    
    // Example: Auto-register some services
    setTimeout(async () => {
        console.log('📝 Auto-registering known services...');
        
        await registry.register({
            name: 'auth-daemon',
            version: '1.0.0',
            port: 8463
        });
        
        await registry.register({
            name: 'verification-mempool',
            version: '1.0.0',
            port: 7500,
            healthEndpoint: '/api/mempool/status'
        });
        
        await registry.register({
            name: 'network-service',
            version: '1.0.0',
            port: 3333
        });
    }, 2000);
}