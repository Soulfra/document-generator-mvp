#!/usr/bin/env node

/**
 * Fail-Safe Recovery System
 * Implements multiple layers of fallback and recovery mechanisms
 * Like having multiple lives in a game - we keep trying different approaches
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const WebSocket = require('ws');
const { spawn } = require('child_process');

class FailSafeRecoverySystem extends EventEmitter {
  constructor() {
    super();
    this.recoveryStrategies = new Map();
    this.healthChecks = new Map();
    this.fallbackChain = [];
    this.recoveryLog = [];
    this.maxRetries = 3;
    this.initializeStrategies();
  }

  initializeStrategies() {
    // Level 1: Simple retry with exponential backoff
    this.addStrategy('retry', {
      level: 1,
      async execute(context, attempt = 1) {
        if (attempt > this.maxRetries) {
          throw new Error('Max retries exceeded');
        }
        
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        
        try {
          return await context.originalFunction();
        } catch (error) {
          console.log(`Retry attempt ${attempt} failed:`, error.message);
          return this.execute(context, attempt + 1);
        }
      }
    });

    // Level 2: Switch to alternative endpoint
    this.addStrategy('endpoint-switch', {
      level: 2,
      async execute(context) {
        const alternatives = context.alternatives || [];
        
        for (const alt of alternatives) {
          try {
            console.log(`Trying alternative endpoint: ${alt.url}`);
            return await context.originalFunction({ endpoint: alt });
          } catch (error) {
            console.log(`Alternative ${alt.url} failed:`, error.message);
          }
        }
        
        throw new Error('All alternative endpoints failed');
      }
    });

    // Level 3: Degrade to local processing
    this.addStrategy('local-fallback', {
      level: 3,
      async execute(context) {
        console.log('Falling back to local processing');
        
        // Try local Ollama
        if (context.type === 'ai') {
          try {
            const response = await axios.post('http://localhost:11434/api/generate', {
              model: 'mistral',
              prompt: context.prompt,
              stream: false
            });
            return response.data;
          } catch (error) {
            console.log('Local Ollama not available:', error.message);
          }
        }
        
        // Try cached response
        if (context.cacheKey) {
          const cached = await this.getCachedResponse(context.cacheKey);
          if (cached) {
            console.log('Using cached response');
            return cached;
          }
        }
        
        throw new Error('Local fallback failed');
      }
    });

    // Level 4: Request queuing and batch processing
    this.addStrategy('queue-and-batch', {
      level: 4,
      queue: [],
      processing: false,
      
      async execute(context) {
        return new Promise((resolve, reject) => {
          this.queue.push({ context, resolve, reject });
          
          if (!this.processing) {
            this.processBatch();
          }
        });
      },
      
      async processBatch() {
        this.processing = true;
        
        while (this.queue.length > 0) {
          const batch = this.queue.splice(0, 10); // Process 10 at a time
          
          try {
            const results = await this.batchProcess(batch.map(item => item.context));
            
            batch.forEach((item, index) => {
              if (results[index].success) {
                item.resolve(results[index].data);
              } else {
                item.reject(results[index].error);
              }
            });
          } catch (error) {
            batch.forEach(item => item.reject(error));
          }
          
          // Rate limit between batches
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        this.processing = false;
      },
      
      async batchProcess(contexts) {
        // Implement batch processing logic
        console.log(`Processing batch of ${contexts.length} requests`);
        return contexts.map(() => ({ success: true, data: { processed: true } }));
      }
    });

    // Level 5: Emergency circuit breaker and system reset
    this.addStrategy('emergency-reset', {
      level: 5,
      async execute(context) {
        console.log('EMERGENCY: Initiating system reset');
        
        // Clear all caches
        await this.clearAllCaches();
        
        // Reset all connections
        await this.resetConnections();
        
        // Restart services if needed
        if (context.allowRestart) {
          await this.restartServices();
        }
        
        // Final attempt after reset
        try {
          return await context.originalFunction();
        } catch (error) {
          // Log critical failure
          await this.logCriticalFailure(context, error);
          throw new Error('System recovery failed - manual intervention required');
        }
      }
    });
  }

  addStrategy(name, strategy) {
    this.recoveryStrategies.set(name, strategy);
    this.fallbackChain.push(name);
    this.fallbackChain.sort((a, b) => {
      const stratA = this.recoveryStrategies.get(a);
      const stratB = this.recoveryStrategies.get(b);
      return (stratA.level || 0) - (stratB.level || 0);
    });
  }

  async executeWithRecovery(context) {
    const startTime = Date.now();
    const recoveryAttempts = [];
    
    for (const strategyName of this.fallbackChain) {
      const strategy = this.recoveryStrategies.get(strategyName);
      
      try {
        console.log(`Attempting recovery strategy: ${strategyName}`);
        const result = await strategy.execute.call(this, context);
        
        // Success! Log recovery
        recoveryAttempts.push({
          strategy: strategyName,
          success: true,
          duration: Date.now() - startTime
        });
        
        this.emit('recovery-success', {
          context,
          strategy: strategyName,
          attempts: recoveryAttempts
        });
        
        return result;
      } catch (error) {
        console.error(`Strategy ${strategyName} failed:`, error.message);
        
        recoveryAttempts.push({
          strategy: strategyName,
          success: false,
          error: error.message,
          duration: Date.now() - startTime
        });
        
        this.emit('strategy-failed', {
          context,
          strategy: strategyName,
          error
        });
      }
    }
    
    // All strategies failed
    this.emit('recovery-failed', {
      context,
      attempts: recoveryAttempts,
      totalDuration: Date.now() - startTime
    });
    
    throw new Error('All recovery strategies exhausted');
  }

  async addHealthCheck(name, check) {
    this.healthChecks.set(name, {
      check,
      lastCheck: null,
      status: 'unknown',
      consecutiveFailures: 0
    });
  }

  async runHealthChecks() {
    const results = new Map();
    
    for (const [name, health] of this.healthChecks) {
      try {
        const result = await health.check();
        health.status = 'healthy';
        health.consecutiveFailures = 0;
        health.lastCheck = new Date();
        results.set(name, { healthy: true, ...result });
      } catch (error) {
        health.status = 'unhealthy';
        health.consecutiveFailures++;
        health.lastCheck = new Date();
        results.set(name, { healthy: false, error: error.message });
      }
    }
    
    return results;
  }

  async getCachedResponse(cacheKey) {
    try {
      const cachePath = path.join(__dirname, '.cache', `${cacheKey}.json`);
      const data = await fs.readFile(cachePath, 'utf8');
      const cached = JSON.parse(data);
      
      // Check if cache is still valid (1 hour)
      if (Date.now() - cached.timestamp < 3600000) {
        return cached.data;
      }
    } catch (error) {
      // Cache miss is not an error
    }
    
    return null;
  }

  async setCachedResponse(cacheKey, data) {
    try {
      const cachePath = path.join(__dirname, '.cache');
      await fs.mkdir(cachePath, { recursive: true });
      
      const filePath = path.join(cachePath, `${cacheKey}.json`);
      await fs.writeFile(filePath, JSON.stringify({
        timestamp: Date.now(),
        data
      }));
    } catch (error) {
      console.error('Failed to cache response:', error);
    }
  }

  async clearAllCaches() {
    console.log('Clearing all caches...');
    
    try {
      // Clear file cache
      const cachePath = path.join(__dirname, '.cache');
      await fs.rm(cachePath, { recursive: true, force: true });
      
      // Clear Redis if available
      if (this.redis) {
        await this.redis.flushall();
      }
      
      // Clear in-memory caches
      this.recoveryStrategies.forEach(strategy => {
        if (strategy.cache) {
          strategy.cache.clear();
        }
      });
      
      console.log('All caches cleared');
    } catch (error) {
      console.error('Error clearing caches:', error);
    }
  }

  async resetConnections() {
    console.log('Resetting all connections...');
    
    // Close and reopen database connections
    if (this.db) {
      await this.db.close();
      await this.db.connect();
    }
    
    // Reset WebSocket connections
    if (this.websockets) {
      this.websockets.forEach(ws => ws.close());
      this.websockets.clear();
    }
    
    // Clear HTTP agent pools
    if (this.httpAgent) {
      this.httpAgent.destroy();
    }
  }

  async restartServices() {
    console.log('Restarting services...');
    
    const services = [
      { name: 'ollama', command: 'systemctl', args: ['restart', 'ollama'] },
      { name: 'redis', command: 'systemctl', args: ['restart', 'redis'] },
      { name: 'docker', command: 'docker-compose', args: ['restart'] }
    ];
    
    for (const service of services) {
      try {
        await this.executeCommand(service.command, service.args);
        console.log(`Restarted ${service.name}`);
      } catch (error) {
        console.error(`Failed to restart ${service.name}:`, error.message);
      }
    }
  }

  executeCommand(command, args) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args);
      
      proc.on('close', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command failed with code ${code}`));
        }
      });
      
      proc.on('error', reject);
    });
  }

  async logCriticalFailure(context, error) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      context: {
        type: context.type,
        endpoint: context.endpoint,
        action: context.action
      },
      error: {
        message: error.message,
        stack: error.stack
      },
      systemState: await this.getSystemState()
    };
    
    // Write to failure log
    const logPath = path.join(__dirname, 'critical-failures.log');
    await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
    
    // Send alert if configured
    if (this.alertHandler) {
      await this.alertHandler(logEntry);
    }
  }

  async getSystemState() {
    const state = {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      healthChecks: {}
    };
    
    // Get health check states
    for (const [name, health] of this.healthChecks) {
      state.healthChecks[name] = {
        status: health.status,
        consecutiveFailures: health.consecutiveFailures,
        lastCheck: health.lastCheck
      };
    }
    
    return state;
  }
}

// Wrapper function for easy integration
function withRecovery(fn, options = {}) {
  const recovery = new FailSafeRecoverySystem();
  
  return async function(...args) {
    const context = {
      originalFunction: () => fn.apply(this, args),
      type: options.type || 'generic',
      cacheKey: options.cacheKey || null,
      alternatives: options.alternatives || [],
      allowRestart: options.allowRestart || false,
      ...options
    };
    
    return recovery.executeWithRecovery(context);
  };
}

// Example usage
if (require.main === module) {
  const recovery = new FailSafeRecoverySystem();
  
  // Add health checks
  recovery.addHealthCheck('ollama', {
    check: async () => {
      const response = await axios.get('http://localhost:11434/api/tags');
      return { models: response.data.models.length };
    }
  });
  
  recovery.addHealthCheck('api-endpoint', {
    check: async () => {
      const response = await axios.get('https://api.example.com/health');
      return { status: response.data.status };
    }
  });
  
  // Monitor recovery events
  recovery.on('recovery-success', (event) => {
    console.log('Recovery successful:', event);
  });
  
  recovery.on('recovery-failed', (event) => {
    console.error('Recovery failed:', event);
  });
  
  // Example function with recovery
  const apiCall = withRecovery(
    async () => {
      // This might fail
      const response = await axios.get('https://api.example.com/data');
      return response.data;
    },
    {
      type: 'api',
      alternatives: [
        { url: 'https://backup1.example.com' },
        { url: 'https://backup2.example.com' }
      ],
      cacheKey: 'api-data',
      allowRestart: false
    }
  );
  
  // Use it
  apiCall()
    .then(data => console.log('Success:', data))
    .catch(error => console.error('Failed:', error));
}

module.exports = { FailSafeRecoverySystem, withRecovery };