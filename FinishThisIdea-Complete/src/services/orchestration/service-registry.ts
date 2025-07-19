/**
 * SERVICE REGISTRY & ORCHESTRATION
 * 
 * Manages service discovery, health checks, and inter-service communication
 * for the FinishThisIdea microservices architecture
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { presenceLogger } from '../../monitoring/presence-logger';

export interface ServiceConfig {
  name: string;
  url: string;
  health: string;
  version: string;
  dependencies: string[];
  metadata?: Record<string, any>;
}

export interface ServiceStatus {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  responseTime: number;
  uptime: number;
  errors: number;
  dependencies: Record<string, 'healthy' | 'unhealthy' | 'unknown'>;
}

export class ServiceRegistry extends EventEmitter {
  private services: Map<string, ServiceConfig> = new Map();
  private statuses: Map<string, ServiceStatus> = new Map();
  private healthCheckInterval: NodeJS.Timer | null = null;
  private readonly CHECK_INTERVAL = 30000; // 30 seconds

  constructor() {
    super();
    this.initialize();
  }

  private initialize() {
    // Register core services
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

    // Start health checking
    this.startHealthChecking();

    logger.info('Service registry initialized', {
      services: Array.from(this.services.keys()),
      healthCheckInterval: this.CHECK_INTERVAL
    });
  }

  registerService(config: ServiceConfig): void {
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

    logger.info('Service registered', { service: config.name, url: config.url });
    this.emit('service:registered', config);
  }

  async getServiceStatus(serviceName: string): Promise<ServiceStatus | null> {
    return this.statuses.get(serviceName) || null;
  }

  async getAllServiceStatuses(): Promise<Record<string, ServiceStatus>> {
    const statuses: Record<string, ServiceStatus> = {};
    for (const [name, status] of this.statuses.entries()) {
      statuses[name] = status;
    }
    return statuses;
  }

  async getHealthyServices(): Promise<ServiceConfig[]> {
    const healthy: ServiceConfig[] = [];
    for (const [name, status] of this.statuses.entries()) {
      if (status.status === 'healthy') {
        const service = this.services.get(name);
        if (service) healthy.push(service);
      }
    }
    return healthy;
  }

  async getServiceUrl(serviceName: string): Promise<string | null> {
    const service = this.services.get(serviceName);
    const status = this.statuses.get(serviceName);
    
    if (service && status?.status === 'healthy') {
      return service.url;
    }
    
    return null;
  }

  private startHealthChecking(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.CHECK_INTERVAL);

    // Perform initial health check
    setTimeout(() => this.performHealthChecks(), 1000);
  }

  private async performHealthChecks(): Promise<void> {
    const promises = Array.from(this.services.values()).map(service => 
      this.checkServiceHealth(service)
    );

    await Promise.allSettled(promises);
    
    // Check dependencies after all health checks
    await this.checkDependencies();
    
    // Emit overall status
    this.emit('health:checked', await this.getAllServiceStatuses());
  }

  private async checkServiceHealth(service: ServiceConfig): Promise<void> {
    const startTime = Date.now();
    const status = this.statuses.get(service.name)!;
    
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

      // Update status
      const previousStatus = status.status;
      status.status = isHealthy ? 'healthy' : 'unhealthy';
      status.lastCheck = new Date();
      status.responseTime = responseTime;
      
      if (isHealthy) {
        status.uptime = Date.now() - status.lastCheck.getTime();
      } else {
        status.errors += 1;
      }

      // Emit status change if different
      if (previousStatus !== status.status) {
        logger.info('Service status changed', {
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

        // Log to presence logger for analytics
        await presenceLogger.logUserPresence('service_status_change', {
          userId: 'system',
          metadata: {
            service: service.name,
            status: status.status,
            previousStatus,
            responseTime
          }
        });
      }

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const previousStatus = status.status;
      
      status.status = 'unhealthy';
      status.lastCheck = new Date();
      status.responseTime = responseTime;
      status.errors += 1;

      if (previousStatus !== 'unhealthy') {
        logger.error('Service health check failed', {
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

  private async checkDependencies(): Promise<void> {
    for (const [serviceName, service] of this.services.entries()) {
      const status = this.statuses.get(serviceName)!;
      
      // Check each dependency
      for (const depName of service.dependencies) {
        const depStatus = this.statuses.get(depName);
        status.dependencies[depName] = depStatus?.status || 'unknown';
      }
    }
  }

  async waitForService(serviceName: string, timeoutMs: number = 60000): Promise<boolean> {
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

  async waitForDependencies(serviceName: string, timeoutMs: number = 120000): Promise<boolean> {
    const service = this.services.get(serviceName);
    if (!service) return false;

    const promises = service.dependencies.map(dep => 
      this.waitForService(dep, timeoutMs)
    );

    const results = await Promise.all(promises);
    return results.every(result => result === true);
  }

  getServiceTopology(): Record<string, string[]> {
    const topology: Record<string, string[]> = {};
    
    for (const [name, service] of this.services.entries()) {
      topology[name] = service.dependencies;
    }
    
    return topology;
  }

  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    logger.info('Service registry shutting down');
    this.emit('registry:shutdown');
  }
}

// Singleton instance
export const serviceRegistry = new ServiceRegistry();