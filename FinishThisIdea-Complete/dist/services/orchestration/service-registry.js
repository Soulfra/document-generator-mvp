"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceRegistry = exports.ServiceRegistry = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const presence_logger_1 = require("../../monitoring/presence-logger");
class ServiceRegistry extends events_1.EventEmitter {
    services = new Map();
    statuses = new Map();
    healthCheckInterval = null;
    CHECK_INTERVAL = 30000;
    constructor() {
        super();
        this.initialize();
    }
    initialize() {
        this.registerService({
            name: 'finishthisidea-app',
            url: process.env.BACKEND_URL || 'http://app:3000',
            health: '/api/health',
            version: '1.0.0',
            dependencies: ['postgres', 'redis', 'ollama'],
            metadata: {
                type: 'main-application',
                port: 3000
            }
        });
        this.registerService({
            name: 'finishthisidea-ai-api',
            url: process.env.AI_API_URL || 'http://ai-api:3001',
            health: '/health',
            version: '1.0.0',
            dependencies: ['postgres', 'redis', 'ollama'],
            metadata: {
                type: 'ai-microservice',
                port: 3001
            }
        });
        this.registerService({
            name: 'finishthisidea-analytics',
            url: 'http://analytics:3002',
            health: '/health',
            version: '1.0.0',
            dependencies: ['postgres', 'redis'],
            metadata: {
                type: 'analytics-service',
                port: 3002
            }
        });
        this.registerService({
            name: 'postgres',
            url: 'http://postgres:5432',
            health: '/health',
            version: '15.0',
            dependencies: [],
            metadata: {
                type: 'database',
                port: 5432
            }
        });
        this.registerService({
            name: 'redis',
            url: 'http://redis:6379',
            health: '/health',
            version: '7.0',
            dependencies: [],
            metadata: {
                type: 'cache-queue',
                port: 6379
            }
        });
        this.registerService({
            name: 'ollama',
            url: 'http://ollama:11434',
            health: '/api/tags',
            version: 'latest',
            dependencies: [],
            metadata: {
                type: 'ai-provider',
                port: 11434
            }
        });
        this.registerService({
            name: 'minio',
            url: 'http://minio:9000',
            health: '/minio/health/live',
            version: 'latest',
            dependencies: [],
            metadata: {
                type: 'storage',
                port: 9000
            }
        });
        this.registerService({
            name: 'nginx',
            url: 'http://nginx:80',
            health: '/health',
            version: 'alpine',
            dependencies: ['finishthisidea-app', 'finishthisidea-ai-api', 'finishthisidea-analytics'],
            metadata: {
                type: 'reverse-proxy',
                port: 80
            }
        });
        this.startHealthChecking();
        logger_1.logger.info('Service registry initialized', {
            services: Array.from(this.services.keys()),
            healthCheckInterval: this.CHECK_INTERVAL
        });
    }
    registerService(config) {
        this.services.set(config.name, config);
        this.statuses.set(config.name, {
            name: config.name,
            status: 'unknown',
            lastCheck: new Date(),
            responseTime: 0,
            uptime: 0,
            errors: 0,
            dependencies: {}
        });
        logger_1.logger.info('Service registered', { service: config.name, url: config.url });
        this.emit('service:registered', config);
    }
    async getServiceStatus(serviceName) {
        return this.statuses.get(serviceName) || null;
    }
    async getAllServiceStatuses() {
        const statuses = {};
        for (const [name, status] of this.statuses.entries()) {
            statuses[name] = status;
        }
        return statuses;
    }
    async getHealthyServices() {
        const healthy = [];
        for (const [name, status] of this.statuses.entries()) {
            if (status.status === 'healthy') {
                const service = this.services.get(name);
                if (service)
                    healthy.push(service);
            }
        }
        return healthy;
    }
    async getServiceUrl(serviceName) {
        const service = this.services.get(serviceName);
        const status = this.statuses.get(serviceName);
        if (service && status?.status === 'healthy') {
            return service.url;
        }
        return null;
    }
    startHealthChecking() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        this.healthCheckInterval = setInterval(() => {
            this.performHealthChecks();
        }, this.CHECK_INTERVAL);
        setTimeout(() => this.performHealthChecks(), 1000);
    }
    async performHealthChecks() {
        const promises = Array.from(this.services.values()).map(service => this.checkServiceHealth(service));
        await Promise.allSettled(promises);
        await this.checkDependencies();
        this.emit('health:checked', await this.getAllServiceStatuses());
    }
    async checkServiceHealth(service) {
        const startTime = Date.now();
        const status = this.statuses.get(service.name);
        try {
            const healthUrl = `${service.url}${service.health}`;
            const response = await fetch(healthUrl, {
                method: 'GET',
                timeout: 10000,
                headers: {
                    'User-Agent': 'FinishThisIdea-ServiceRegistry/1.0'
                }
            });
            const responseTime = Date.now() - startTime;
            const isHealthy = response.ok;
            const previousStatus = status.status;
            status.status = isHealthy ? 'healthy' : 'unhealthy';
            status.lastCheck = new Date();
            status.responseTime = responseTime;
            if (isHealthy) {
                status.uptime = Date.now() - status.lastCheck.getTime();
            }
            else {
                status.errors += 1;
            }
            if (previousStatus !== status.status) {
                logger_1.logger.info('Service status changed', {
                    service: service.name,
                    from: previousStatus,
                    to: status.status,
                    responseTime
                });
                this.emit('service:status_changed', {
                    service: service.name,
                    status: status.status,
                    previousStatus,
                    responseTime
                });
                await presence_logger_1.presenceLogger.logUserPresence('service_status_change', {
                    userId: 'system',
                    metadata: {
                        service: service.name,
                        status: status.status,
                        previousStatus,
                        responseTime
                    }
                });
            }
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            const previousStatus = status.status;
            status.status = 'unhealthy';
            status.lastCheck = new Date();
            status.responseTime = responseTime;
            status.errors += 1;
            if (previousStatus !== 'unhealthy') {
                logger_1.logger.error('Service health check failed', {
                    service: service.name,
                    error: error.message,
                    responseTime
                });
                this.emit('service:status_changed', {
                    service: service.name,
                    status: 'unhealthy',
                    previousStatus,
                    error: error.message
                });
            }
        }
    }
    async checkDependencies() {
        for (const [serviceName, service] of this.services.entries()) {
            const status = this.statuses.get(serviceName);
            for (const depName of service.dependencies) {
                const depStatus = this.statuses.get(depName);
                status.dependencies[depName] = depStatus?.status || 'unknown';
            }
        }
    }
    async waitForService(serviceName, timeoutMs = 60000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const checkService = () => {
                const status = this.statuses.get(serviceName);
                if (status?.status === 'healthy') {
                    resolve(true);
                    return;
                }
                if (Date.now() - startTime > timeoutMs) {
                    resolve(false);
                    return;
                }
                setTimeout(checkService, 1000);
            };
            checkService();
        });
    }
    async waitForDependencies(serviceName, timeoutMs = 120000) {
        const service = this.services.get(serviceName);
        if (!service)
            return false;
        const promises = service.dependencies.map(dep => this.waitForService(dep, timeoutMs));
        const results = await Promise.all(promises);
        return results.every(result => result === true);
    }
    getServiceTopology() {
        const topology = {};
        for (const [name, service] of this.services.entries()) {
            topology[name] = service.dependencies;
        }
        return topology;
    }
    async shutdown() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
        logger_1.logger.info('Service registry shutting down');
        this.emit('registry:shutdown');
    }
}
exports.ServiceRegistry = ServiceRegistry;
exports.serviceRegistry = new ServiceRegistry();
//# sourceMappingURL=service-registry.js.map