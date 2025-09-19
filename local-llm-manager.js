#!/usr/bin/env node

/**
 * LOCAL LLM MANAGER - Ollama Connection Manager
 * 
 * Manages local Ollama models and connections:
 * - Model availability checking
 * - Auto-pull missing models
 * - Connection pooling and recovery
 * - Performance monitoring
 * - Model switching based on task type
 */

const { Ollama } = require('ollama');
const winston = require('winston');
const EventEmitter = require('events');
const cron = require('node-cron');
const axios = require('axios');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ level: 'info' }),
    new winston.transports.File({ filename: 'logs/local-llm.log' })
  ]
});

class LocalLLMManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      host: options.host || process.env.OLLAMA_HOST || 'http://localhost:11434',
      defaultModels: options.defaultModels || [
        'codellama:7b',      // Best for code generation
        'mistral:7b',        // General purpose, fast
        'llama2:7b',         // Good reasoning
        'phi:2.7b'           // Lightweight, fast
      ],
      autoPull: options.autoPull !== false,
      maxConcurrent: options.maxConcurrent || 3,
      healthCheckInterval: options.healthCheckInterval || 30000, // 30 seconds
      modelSwitchThreshold: options.modelSwitchThreshold || 5000  // 5s response time
    };

    this.ollama = new Ollama({ host: this.config.host });
    this.modelStatus = new Map();
    this.activeRequests = new Map();
    this.performanceMetrics = new Map();
    this.isHealthy = false;
    this.lastHealthCheck = null;

    // Initialize
    this.initialize();
  }

  async initialize() {
    logger.info('Initializing Local LLM Manager', { 
      host: this.config.host,
      models: this.config.defaultModels 
    });

    try {
      // Check Ollama connection
      await this.checkConnection();
      
      // Load model information
      await this.loadModels();
      
      // Start monitoring
      this.startMonitoring();
      
      logger.info('Local LLM Manager initialized successfully');
      this.emit('ready');
      
    } catch (error) {
      logger.error('Failed to initialize Local LLM Manager', { error: error.message });
      this.emit('error', error);
    }
  }

  /**
   * Check connection to Ollama server
   */
  async checkConnection() {
    try {
      const response = await axios.get(`${this.config.host}/api/tags`, { timeout: 5000 });
      this.isHealthy = true;
      this.lastHealthCheck = new Date();
      return true;
    } catch (error) {
      this.isHealthy = false;
      this.lastHealthCheck = new Date();
      throw new Error(`Cannot connect to Ollama at ${this.config.host}: ${error.message}`);
    }
  }

  /**
   * Load and check available models
   */
  async loadModels() {
    try {
      const models = await this.ollama.list();
      
      // Update model status
      this.modelStatus.clear();
      for (const model of models.models) {
        this.modelStatus.set(model.name, {
          name: model.name,
          size: model.size,
          digest: model.digest,
          modified_at: model.modified_at,
          available: true,
          loading: false,
          lastUsed: null,
          responseCount: 0,
          averageResponseTime: 0,
          errorCount: 0
        });
      }

      // Check for missing default models
      const availableModels = models.models.map(m => m.name);
      const missingModels = this.config.defaultModels.filter(
        model => !availableModels.includes(model)
      );

      if (missingModels.length > 0 && this.config.autoPull) {
        logger.info('Missing models detected, will attempt to pull', { missing: missingModels });
        await this.pullMissingModels(missingModels);
      }

      logger.info('Models loaded', { 
        available: availableModels.length,
        missing: missingModels.length 
      });

    } catch (error) {
      logger.error('Failed to load models', { error: error.message });
      throw error;
    }
  }

  /**
   * Pull missing models from Ollama registry
   */
  async pullMissingModels(models) {
    for (const modelName of models) {
      try {
        logger.info(`Pulling model: ${modelName}`);
        
        // Set model as loading
        this.modelStatus.set(modelName, {
          name: modelName,
          available: false,
          loading: true,
          lastUsed: null,
          responseCount: 0,
          averageResponseTime: 0,
          errorCount: 0
        });

        this.emit('model:pulling', { model: modelName });

        // Pull model
        await this.ollama.pull({ model: modelName });
        
        // Update status
        const status = this.modelStatus.get(modelName);
        status.available = true;
        status.loading = false;
        
        logger.info(`Successfully pulled model: ${modelName}`);
        this.emit('model:ready', { model: modelName });

      } catch (error) {
        logger.error(`Failed to pull model: ${modelName}`, { error: error.message });
        
        const status = this.modelStatus.get(modelName);
        if (status) {
          status.loading = false;
          status.errorCount++;
        }

        this.emit('model:error', { model: modelName, error: error.message });
      }
    }
  }

  /**
   * Get best model for a specific task type
   */
  getBestModel(taskType = 'general', priority = 'balanced') {
    const availableModels = Array.from(this.modelStatus.values()).filter(m => m.available && !m.loading);
    
    if (availableModels.length === 0) {
      throw new Error('No models available');
    }

    // Task-specific model selection
    switch (taskType) {
      case 'code':
        return this.findBestModelByName(availableModels, ['codellama', 'deepseek', 'coder']) ||
               availableModels[0];

      case 'chat':
      case 'general':
        return this.findBestModelByName(availableModels, ['mistral', 'llama2', 'phi']) ||
               availableModels[0];

      case 'reasoning':
        return this.findBestModelByName(availableModels, ['llama2', 'mistral']) ||
               availableModels[0];

      case 'fast':
        // Prefer smaller, faster models
        return availableModels
          .sort((a, b) => (a.size || Infinity) - (b.size || Infinity))[0];

      case 'quality':
        // Prefer larger, more capable models
        return availableModels
          .sort((a, b) => (b.size || 0) - (a.size || 0))[0];

      default:
        // Performance-based selection
        return this.selectByPerformance(availableModels, priority);
    }
  }

  /**
   * Find best model by name patterns
   */
  findBestModelByName(models, patterns) {
    for (const pattern of patterns) {
      const match = models.find(m => m.name.toLowerCase().includes(pattern));
      if (match) return match;
    }
    return null;
  }

  /**
   * Select model based on performance metrics
   */
  selectByPerformance(models, priority) {
    switch (priority) {
      case 'speed':
        return models.sort((a, b) => a.averageResponseTime - b.averageResponseTime)[0];
      
      case 'reliability':
        return models.sort((a, b) => {
          const aReliability = a.responseCount > 0 ? (1 - a.errorCount / a.responseCount) : 0;
          const bReliability = b.responseCount > 0 ? (1 - b.errorCount / b.responseCount) : 0;
          return bReliability - aReliability;
        })[0];
      
      case 'balanced':
      default:
        return models.sort((a, b) => {
          // Balance speed and reliability
          const aScore = this.calculatePerformanceScore(a);
          const bScore = this.calculatePerformanceScore(b);
          return bScore - aScore;
        })[0];
    }
  }

  /**
   * Calculate performance score for model
   */
  calculatePerformanceScore(model) {
    if (model.responseCount === 0) return 0;
    
    const reliability = 1 - (model.errorCount / model.responseCount);
    const speed = model.averageResponseTime > 0 ? (1000 / model.averageResponseTime) : 0;
    
    return (reliability * 0.7) + (speed * 0.3); // Weighted score
  }

  /**
   * Generate completion with automatic model selection
   */
  async generateCompletion(prompt, options = {}) {
    const startTime = Date.now();
    const requestId = `req_${startTime}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Select best model
      const model = options.model ? 
        this.modelStatus.get(options.model) :
        this.getBestModel(options.taskType, options.priority);

      if (!model) {
        throw new Error('No suitable model available');
      }

      logger.debug('Starting completion', { requestId, model: model.name, prompt: prompt.slice(0, 50) });

      // Track active request
      this.activeRequests.set(requestId, {
        model: model.name,
        startTime,
        prompt: prompt.slice(0, 100)
      });

      // Generate completion
      const response = await this.ollama.chat({
        model: model.name,
        messages: [{ role: 'user', content: prompt }],
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.maxTokens || 1000,
          top_k: options.topK || 40,
          top_p: options.topP || 0.9
        }
      });

      const duration = Date.now() - startTime;
      
      // Update performance metrics
      this.updateModelMetrics(model.name, duration, true);
      
      // Clean up
      this.activeRequests.delete(requestId);

      logger.info('Completion generated', { 
        requestId, 
        model: model.name, 
        duration,
        tokens: response.eval_count || 0 
      });

      return {
        content: response.message.content,
        model: model.name,
        tokens: response.eval_count || 0,
        duration,
        prompt_eval_count: response.prompt_eval_count || 0,
        eval_count: response.eval_count || 0
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      const activeRequest = this.activeRequests.get(requestId);
      
      if (activeRequest) {
        this.updateModelMetrics(activeRequest.model, duration, false);
        this.activeRequests.delete(requestId);
      }

      logger.error('Completion failed', { 
        requestId, 
        error: error.message,
        duration 
      });

      throw error;
    }
  }

  /**
   * Update performance metrics for a model
   */
  updateModelMetrics(modelName, duration, success) {
    const model = this.modelStatus.get(modelName);
    if (!model) return;

    model.responseCount++;
    model.lastUsed = new Date();

    if (success) {
      // Update average response time
      if (model.averageResponseTime === 0) {
        model.averageResponseTime = duration;
      } else {
        model.averageResponseTime = (model.averageResponseTime + duration) / 2;
      }
    } else {
      model.errorCount++;
    }
  }

  /**
   * Start monitoring and health checks
   */
  startMonitoring() {
    // Health check every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      try {
        await this.checkConnection();
        this.emit('health:ok');
      } catch (error) {
        this.emit('health:error', error);
      }
    });

    // Model refresh every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.loadModels();
        this.emit('models:refreshed');
      } catch (error) {
        logger.error('Failed to refresh models', { error: error.message });
      }
    });

    // Performance cleanup every hour
    cron.schedule('0 * * * *', () => {
      this.cleanupMetrics();
    });
  }

  /**
   * Clean up old performance metrics
   */
  cleanupMetrics() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [requestId, request] of this.activeRequests.entries()) {
      if (request.startTime < oneHourAgo) {
        this.activeRequests.delete(requestId);
        logger.warn('Cleaned up stale request', { requestId });
      }
    }
  }

  /**
   * Get status information
   */
  getStatus() {
    const models = Array.from(this.modelStatus.values());
    const activeCount = this.activeRequests.size;
    
    return {
      healthy: this.isHealthy,
      lastHealthCheck: this.lastHealthCheck,
      host: this.config.host,
      models: {
        total: models.length,
        available: models.filter(m => m.available).length,
        loading: models.filter(m => m.loading).length,
        details: models
      },
      requests: {
        active: activeCount,
        details: Array.from(this.activeRequests.values())
      },
      performance: this.getPerformanceSummary()
    };
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const models = Array.from(this.modelStatus.values());
    const totalRequests = models.reduce((sum, m) => sum + m.responseCount, 0);
    const totalErrors = models.reduce((sum, m) => sum + m.errorCount, 0);
    const avgResponseTime = models.length > 0 ? 
      models.reduce((sum, m) => sum + m.averageResponseTime, 0) / models.length : 0;

    return {
      totalRequests,
      totalErrors,
      successRate: totalRequests > 0 ? (1 - totalErrors / totalRequests) : 0,
      averageResponseTime: Math.round(avgResponseTime),
      fastestModel: models.sort((a, b) => a.averageResponseTime - b.averageResponseTime)[0]?.name,
      mostReliable: models.sort((a, b) => {
        const aReliability = a.responseCount > 0 ? (1 - a.errorCount / a.responseCount) : 0;
        const bReliability = b.responseCount > 0 ? (1 - b.errorCount / b.responseCount) : 0;
        return bReliability - aReliability;
      })[0]?.name
    };
  }
}

// Export for use in other modules
module.exports = LocalLLMManager;

// CLI usage if called directly
if (require.main === module) {
  const manager = new LocalLLMManager();
  
  manager.on('ready', () => {
    console.log('✅ Local LLM Manager is ready');
    console.log(JSON.stringify(manager.getStatus(), null, 2));
  });

  manager.on('error', (error) => {
    console.error('❌ Local LLM Manager error:', error.message);
    process.exit(1);
  });

  manager.on('model:pulling', ({ model }) => {
    console.log(`🔄 Pulling model: ${model}`);
  });

  manager.on('model:ready', ({ model }) => {
    console.log(`✅ Model ready: ${model}`);
  });
}