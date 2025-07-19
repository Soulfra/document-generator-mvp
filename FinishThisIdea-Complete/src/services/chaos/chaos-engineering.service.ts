/**
 * Chaos Engineering Service
 * Controlled failure injection for resilience testing
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import redis from '../../config/redis';
import { prisma } from '../../utils/database';
import { Request, Response, NextFunction } from 'express';
import * as os from 'os';

export interface ChaosExperiment {
  id: string;
  name: string;
  description: string;
  type: 'latency' | 'error' | 'resource' | 'network' | 'database';
  target?: string;
  probability: number; // 0-1 probability of triggering
  duration?: number; // milliseconds
  config?: any;
  enabled: boolean;
  schedule?: string; // Cron expression
  tags?: string[];
}

export interface ChaosResult {
  experimentId: string;
  timestamp: Date;
  triggered: boolean;
  affectedRequests: number;
  impact?: string;
  metrics?: any;
}

export class ChaosEngineeringService extends EventEmitter {
  private static instance: ChaosEngineeringService;
  private experiments: Map<string, ChaosExperiment> = new Map();
  private activeExperiments: Set<string> = new Set();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private isEnabled: boolean;

  constructor() {
    super();
    this.isEnabled = process.env.CHAOS_ENGINEERING_ENABLED === 'true' && 
                    process.env.NODE_ENV !== 'production';
    
    if (this.isEnabled) {
      this.initializeDefaultExperiments();
    }
  }

  public static getInstance(): ChaosEngineeringService {
    if (!ChaosEngineeringService.instance) {
      ChaosEngineeringService.instance = new ChaosEngineeringService();
    }
    return ChaosEngineeringService.instance;
  }

  /**
   * Initialize default experiments
   */
  private initializeDefaultExperiments(): void {
    const defaults: ChaosExperiment[] = [
      {
        id: 'api-latency',
        name: 'API Latency Injection',
        description: 'Adds random latency to API requests',
        type: 'latency',
        target: '/api/*',
        probability: 0.1,
        duration: 2000,
        enabled: false,
        config: {
          minLatency: 500,
          maxLatency: 3000
        }
      },
      {
        id: 'db-error',
        name: 'Database Error Simulation',
        description: 'Simulates database connection errors',
        type: 'database',
        probability: 0.05,
        enabled: false,
        config: {
          errorType: 'connection_timeout'
        }
      },
      {
        id: 'memory-pressure',
        name: 'Memory Pressure',
        description: 'Simulates high memory usage',
        type: 'resource',
        probability: 0.1,
        duration: 60000,
        enabled: false,
        config: {
          memoryPercent: 80
        }
      },
      {
        id: 'network-partition',
        name: 'Network Partition',
        description: 'Simulates network failures',
        type: 'network',
        target: 'redis',
        probability: 0.05,
        duration: 5000,
        enabled: false
      },
      {
        id: 'random-500',
        name: 'Random 500 Errors',
        description: 'Returns random 500 errors',
        type: 'error',
        target: '/api/*',
        probability: 0.02,
        enabled: false,
        config: {
          statusCode: 500,
          message: 'Chaos: Simulated server error'
        }
      }
    ];

    defaults.forEach(exp => {
      this.experiments.set(exp.id, exp);
    });
  }

  /**
   * Express middleware for chaos injection
   */
  public middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      if (!this.isEnabled) {
        return next();
      }

      // Check if any experiments should trigger
      for (const [id, experiment] of this.experiments) {
        if (!experiment.enabled) continue;
        
        if (this.shouldTrigger(experiment, req)) {
          try {
            await this.executeExperiment(experiment, req, res, next);
            return; // Experiment handled the request
          } catch (error) {
            logger.error('Chaos experiment failed', { experimentId: id, error });
          }
        }
      }
      
      next();
    };
  }

  /**
   * Should trigger experiment
   */
  private shouldTrigger(experiment: ChaosExperiment, req: Request): boolean {
    // Check target matching
    if (experiment.target) {
      if (experiment.target.includes('*')) {
        const pattern = experiment.target.replace('*', '.*');
        if (!new RegExp(pattern).test(req.path)) {
          return false;
        }
      } else if (!req.path.startsWith(experiment.target)) {
        return false;
      }
    }

    // Probability check
    return Math.random() < experiment.probability;
  }

  /**
   * Execute chaos experiment
   */
  private async executeExperiment(
    experiment: ChaosExperiment,
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    this.activeExperiments.add(experiment.id);
    const startTime = Date.now();

    logger.warn('Chaos experiment triggered', {
      experimentId: experiment.id,
      type: experiment.type,
      path: req.path
    });

    this.emit('experiment:triggered', {
      experiment,
      request: {
        method: req.method,
        path: req.path,
        ip: req.ip
      }
    });

    try {
      switch (experiment.type) {
        case 'latency':
          await this.injectLatency(experiment, req, res, next);
          break;
        
        case 'error':
          await this.injectError(experiment, req, res);
          break;
        
        case 'resource':
          await this.injectResourcePressure(experiment);
          next();
          break;
        
        case 'network':
          await this.injectNetworkFailure(experiment, req, res, next);
          break;
        
        case 'database':
          await this.injectDatabaseError(experiment, req, res, next);
          break;
        
        default:
          next();
      }
    } finally {
      this.activeExperiments.delete(experiment.id);
      
      const result: ChaosResult = {
        experimentId: experiment.id,
        timestamp: new Date(),
        triggered: true,
        affectedRequests: 1,
        impact: `Added ${Date.now() - startTime}ms delay`
      };
      
      await this.recordResult(result);
    }
  }

  /**
   * Inject latency
   */
  private async injectLatency(
    experiment: ChaosExperiment,
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const config = experiment.config || {};
    const minLatency = config.minLatency || 100;
    const maxLatency = config.maxLatency || experiment.duration || 1000;
    const latency = Math.random() * (maxLatency - minLatency) + minLatency;
    
    logger.info('Injecting latency', { latency, path: req.path });
    
    setTimeout(() => next(), latency);
  }

  /**
   * Inject error response
   */
  private async injectError(
    experiment: ChaosExperiment,
    req: Request,
    res: Response
  ): Promise<void> {
    const config = experiment.config || {};
    const statusCode = config.statusCode || 500;
    const message = config.message || 'Chaos: Injected error';
    
    logger.info('Injecting error', { statusCode, path: req.path });
    
    res.status(statusCode).json({
      success: false,
      error: message,
      chaos: true,
      experimentId: experiment.id
    });
  }

  /**
   * Inject resource pressure
   */
  private async injectResourcePressure(experiment: ChaosExperiment): Promise<void> {
    const config = experiment.config || {};
    
    if (config.memoryPercent) {
      // Allocate memory to simulate pressure
      const totalMemory = os.totalmem();
      const targetMemory = (totalMemory * config.memoryPercent) / 100;
      const currentMemory = process.memoryUsage().heapUsed;
      const toAllocate = Math.max(0, targetMemory - currentMemory);
      
      logger.info('Injecting memory pressure', {
        targetPercent: config.memoryPercent,
        bytesToAllocate: toAllocate
      });
      
      // Allocate memory in chunks
      const chunks: Buffer[] = [];
      const chunkSize = 1024 * 1024; // 1MB chunks
      const numChunks = Math.floor(toAllocate / chunkSize);
      
      for (let i = 0; i < numChunks; i++) {
        chunks.push(Buffer.alloc(chunkSize));
      }
      
      // Hold memory for duration
      setTimeout(() => {
        chunks.length = 0; // Release memory
        logger.info('Released memory pressure');
      }, experiment.duration || 10000);
    }
  }

  /**
   * Inject network failure
   */
  private async injectNetworkFailure(
    experiment: ChaosExperiment,
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    if (experiment.target === 'redis') {
      // Temporarily break Redis connection
      logger.info('Simulating Redis network failure');
      
      const originalGet = redis.get;
      const originalSet = redis.set;
      
      redis.get = async () => {
        throw new Error('Chaos: Redis connection lost');
      };
      redis.set = async () => {
        throw new Error('Chaos: Redis connection lost');
      };
      
      // Restore after duration
      setTimeout(() => {
        redis.get = originalGet;
        redis.set = originalSet;
        logger.info('Restored Redis connection');
      }, experiment.duration || 5000);
    }
    
    next();
  }

  /**
   * Inject database error
   */
  private async injectDatabaseError(
    experiment: ChaosExperiment,
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    // Simulate database error by throwing
    // In a real implementation, you'd override connection methods
    logger.info('Simulating database connection timeout');
    
    // For demo purposes, we'll just delay the request
    setTimeout(() => {
      logger.info('Database simulation ended');
    }, experiment.duration || 5000);
    
    next();
  }

  /**
   * Record experiment result
   */
  private async recordResult(result: ChaosResult): Promise<void> {
    const key = `chaos:results:${result.experimentId}:${Date.now()}`;
    await redis.setex(key, 86400, JSON.stringify(result)); // 24 hour TTL
    
    // Add to sorted set for retrieval
    await redis.zadd(
      `chaos:history:${result.experimentId}`,
      Date.now(),
      key
    );
  }

  /**
   * Enable experiment
   */
  public enableExperiment(experimentId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (experiment) {
      experiment.enabled = true;
      logger.info('Chaos experiment enabled', { experimentId });
      this.emit('experiment:enabled', experiment);
    }
  }

  /**
   * Disable experiment
   */
  public disableExperiment(experimentId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (experiment) {
      experiment.enabled = false;
      logger.info('Chaos experiment disabled', { experimentId });
      this.emit('experiment:disabled', experiment);
    }
  }

  /**
   * Create custom experiment
   */
  public createExperiment(experiment: ChaosExperiment): void {
    this.experiments.set(experiment.id, experiment);
    logger.info('Created chaos experiment', { experimentId: experiment.id });
  }

  /**
   * Get experiment results
   */
  public async getExperimentResults(
    experimentId: string,
    limit: number = 100
  ): Promise<ChaosResult[]> {
    const keys = await redis.zrevrange(
      `chaos:history:${experimentId}`,
      0,
      limit - 1
    );
    
    const results: ChaosResult[] = [];
    for (const key of keys) {
      const data = await redis.get(key);
      if (data) {
        results.push(JSON.parse(data));
      }
    }
    
    return results;
  }

  /**
   * Get all experiments
   */
  public getExperiments(): ChaosExperiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Get circuit breaker for service
   */
  public getCircuitBreaker(serviceName: string): CircuitBreaker {
    if (!this.circuitBreakers.has(serviceName)) {
      this.circuitBreakers.set(serviceName, new CircuitBreaker(serviceName));
    }
    return this.circuitBreakers.get(serviceName)!;
  }
}

/**
 * Circuit Breaker implementation
 */
export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failures = 0;
  private successes = 0;
  private lastFailureTime?: Date;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute
  private readonly successThreshold = 3;

  constructor(private serviceName: string) {}

  public async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => T
  ): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - (this.lastFailureTime?.getTime() || 0) > this.timeout) {
        this.state = 'half-open';
        logger.info('Circuit breaker half-open', { service: this.serviceName });
      } else if (fallback) {
        return fallback();
      } else {
        throw new Error(`Circuit breaker open for ${this.serviceName}`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    
    if (this.state === 'half-open') {
      this.successes++;
      if (this.successes >= this.successThreshold) {
        this.state = 'closed';
        this.successes = 0;
        logger.info('Circuit breaker closed', { service: this.serviceName });
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = new Date();
    this.successes = 0;
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
      logger.warn('Circuit breaker opened', {
        service: this.serviceName,
        failures: this.failures
      });
    }
  }

  public getState(): string {
    return this.state;
  }

  public reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
  }
}

// Export singleton instance
export const chaosEngineering = ChaosEngineeringService.getInstance();