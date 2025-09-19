#!/usr/bin/env node

/**
 * 🔑 API KEY MIDDLEWARE
 * 
 * Centralized API key management for all AI providers:
 * - DeepSeek API (research and coding)
 * - Anthropic Claude (synthesis and reasoning)
 * - OpenAI GPT (architecture and planning)
 * - Local Ollama (privacy-first processing)
 * 
 * Eliminates BYOK requirement - users get access to all models seamlessly
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/api-key-middleware.log' })
  ]
});

class APIKeyMiddleware extends EventEmitter {
  constructor() {
    super();
    
    // API key configuration with usage tracking
    this.providers = {
      deepseek: {
        name: 'DeepSeek',
        apiKey: process.env.DEEPSEEK_API_KEY,
        endpoint: 'https://api.deepseek.com',
        models: ['deepseek-chat', 'deepseek-coder'],
        costPerToken: 0.0002,
        monthlyBudget: 100, // $100/month
        usageThisMonth: 0,
        requestCount: 0,
        status: 'unknown'
      },
      anthropic: {
        name: 'Anthropic Claude',
        apiKey: process.env.ANTHROPIC_API_KEY,
        endpoint: 'https://api.anthropic.com',
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
        costPerToken: 0.015,
        monthlyBudget: 200, // $200/month
        usageThisMonth: 0,
        requestCount: 0,
        status: 'unknown'
      },
      openai: {
        name: 'OpenAI',
        apiKey: process.env.OPENAI_API_KEY,
        endpoint: 'https://api.openai.com',
        models: ['gpt-4-turbo-preview', 'gpt-4', 'gpt-3.5-turbo'],
        costPerToken: 0.01,
        monthlyBudget: 150, // $150/month
        usageThisMonth: 0,
        requestCount: 0,
        status: 'unknown'
      },
      ollama: {
        name: 'Ollama (Local)',
        apiKey: null, // No API key needed
        endpoint: 'http://localhost:11434',
        models: ['codellama:7b', 'mistral:7b', 'llama2:7b', 'phi:2.7b'],
        costPerToken: 0, // Free local processing
        monthlyBudget: 0,
        usageThisMonth: 0,
        requestCount: 0,
        status: 'unknown',
        priority: 1 // Highest priority (try first)
      }
    };
    
    // Usage tracking
    this.usageHistory = new Map();
    this.dailyLimits = {
      deepseek: 50,    // $50/day
      anthropic: 100,  // $100/day
      openai: 75       // $75/day
    };
    
    // Request routing rules
    this.routingRules = {
      code: ['ollama', 'deepseek', 'openai'],           // Code tasks prefer local, then DeepSeek
      research: ['ollama', 'deepseek', 'anthropic'],    // Research prefers DeepSeek for depth
      synthesis: ['anthropic', 'openai', 'ollama'],     // Synthesis prefers Claude for reasoning
      architecture: ['openai', 'anthropic', 'ollama'],  // Architecture prefers GPT for planning
      general: ['ollama', 'deepseek', 'anthropic', 'openai'] // General prefer cheapest first
    };
    
    this.initialized = false;
    
    logger.info('🔑 API Key Middleware initialized');
  }

  async initialize() {
    logger.info('🚀 Initializing API providers...');
    
    try {
      // Check which providers are available
      await this.checkProviderAvailability();
      
      // Load usage history
      await this.loadUsageHistory();
      
      // Setup usage monitoring
      this.startUsageMonitoring();
      
      this.initialized = true;
      this.emit('ready');
      
      logger.info('✅ API Key Middleware ready');
      
    } catch (error) {
      logger.error('❌ API Key Middleware initialization failed:', error);
      throw error;
    }
  }

  async checkProviderAvailability() {
    const checks = Object.entries(this.providers).map(async ([key, provider]) => {
      try {
        if (key === 'ollama') {
          // Check Ollama with simple request
          const response = await fetch(`${provider.endpoint}/api/tags`);
          provider.status = response.ok ? 'available' : 'offline';
        } else {
          // Check cloud providers have API keys
          provider.status = provider.apiKey ? 'available' : 'missing-key';
        }
        
        logger.info(`${provider.status === 'available' ? '✅' : '⚠️'} ${provider.name}: ${provider.status}`);
        
      } catch (error) {
        provider.status = 'error';
        provider.error = error.message;
        logger.warn(`❌ ${provider.name}: ${error.message}`);
      }
    });
    
    await Promise.all(checks);
  }

  // Smart provider selection based on task type and availability
  selectProvider(taskType = 'general', options = {}) {
    const preferredOrder = this.routingRules[taskType] || this.routingRules.general;
    const { maxCost = Infinity, excludeProviders = [] } = options;
    
    for (const providerKey of preferredOrder) {
      const provider = this.providers[providerKey];
      
      if (excludeProviders.includes(providerKey)) continue;
      if (provider.status !== 'available') continue;
      
      // Check budget constraints
      if (this.isWithinBudget(providerKey, maxCost)) {
        logger.info(`🎯 Selected provider: ${provider.name} for ${taskType} task`);
        return { key: providerKey, provider };
      }
    }
    
    throw new Error(`No available providers for ${taskType} within budget constraints`);
  }

  isWithinBudget(providerKey, maxCost) {
    const provider = this.providers[providerKey];
    
    // Check daily limit
    const today = new Date().toDateString();
    const dailyUsage = this.getDailyUsage(providerKey, today);
    const dailyLimit = this.dailyLimits[providerKey] || Infinity;
    
    if (dailyUsage >= dailyLimit) {
      logger.warn(`⚠️ ${provider.name} daily limit reached: $${dailyUsage}/$${dailyLimit}`);
      return false;
    }
    
    // Check monthly budget
    if (provider.usageThisMonth >= provider.monthlyBudget) {
      logger.warn(`⚠️ ${provider.name} monthly budget exceeded: $${provider.usageThisMonth}/$${provider.monthlyBudget}`);
      return false;
    }
    
    // Check request cost limit
    const estimatedCost = maxCost * provider.costPerToken;
    if (estimatedCost > maxCost) {
      return false;
    }
    
    return true;
  }

  // Route request to appropriate provider with fallbacks
  async routeRequest(query, taskType = 'general', options = {}) {
    const { maxRetries = 3, fallbackProviders = [] } = options;
    let attempt = 0;
    const excludeProviders = [];
    
    while (attempt < maxRetries) {
      try {
        const { key, provider } = this.selectProvider(taskType, { 
          ...options, 
          excludeProviders 
        });
        
        // Track request
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        
        logger.info(`📤 Routing request ${requestId} to ${provider.name}`, {
          attempt: attempt + 1,
          taskType,
          query: query.substring(0, 100)
        });
        
        // Route to CalCompare service
        const result = await this.sendToCalCompare(query, key, taskType, {
          requestId,
          ...options
        });
        
        // Track usage
        const duration = Date.now() - startTime;
        await this.trackUsage(key, result.tokensUsed || 0, duration, true);
        
        logger.info(`✅ Request ${requestId} completed`, {
          provider: provider.name,
          duration,
          tokens: result.tokensUsed
        });
        
        return {
          success: true,
          result: result.content,
          provider: provider.name,
          providerKey: key,
          requestId,
          duration,
          tokensUsed: result.tokensUsed,
          cost: this.calculateCost(key, result.tokensUsed)
        };
        
      } catch (error) {
        logger.error(`❌ Request attempt ${attempt + 1} failed:`, error.message);
        
        // Add failed provider to exclusion list
        if (error.provider) {
          excludeProviders.push(error.provider);
        }
        
        attempt++;
        
        if (attempt >= maxRetries) {
          throw new Error(`All provider attempts failed. Last error: ${error.message}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async sendToCalCompare(query, providerKey, taskType, options = {}) {
    // This would integrate with the actual CalCompare service
    // For now, we'll create a placeholder that shows the integration structure
    
    const consultationType = this.mapTaskTypeToConsultation(taskType);
    
    // In real implementation, this would call the CalCompare API
    // with the specific provider preference
    const requestData = {
      query,
      consultation_type: consultationType,
      preferred_provider: providerKey,
      request_id: options.requestId,
      user_id: options.userId || 'agentic-browser',
      session_id: options.sessionId
    };
    
    // Placeholder response - in real implementation this would be an HTTP request
    return {
      content: `Response from ${this.providers[providerKey].name} via CalCompare`,
      tokensUsed: Math.floor(query.length / 4), // Rough token estimate
      consultation_id: options.requestId
    };
  }

  mapTaskTypeToConsultation(taskType) {
    const mapping = {
      code: 'code-review',
      research: 'business-strategy',
      synthesis: 'technical-architecture',
      architecture: 'technical-architecture',
      general: 'general'
    };
    
    return mapping[taskType] || 'general';
  }

  generateRequestId() {
    return `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  calculateCost(providerKey, tokensUsed) {
    const provider = this.providers[providerKey];
    return (tokensUsed || 0) * provider.costPerToken;
  }

  async trackUsage(providerKey, tokensUsed, duration, success) {
    const provider = this.providers[providerKey];
    const cost = this.calculateCost(providerKey, tokensUsed);
    
    // Update provider stats
    provider.requestCount++;
    if (success) {
      provider.usageThisMonth += cost;
    }
    
    // Track daily usage
    const today = new Date().toDateString();
    const dailyKey = `${providerKey}:${today}`;
    const currentDaily = this.getDailyUsage(providerKey, today);
    this.usageHistory.set(dailyKey, currentDaily + cost);
    
    // Log usage
    logger.info(`💰 Usage tracked`, {
      provider: provider.name,
      cost: cost.toFixed(4),
      tokens: tokensUsed,
      duration,
      dailyTotal: (currentDaily + cost).toFixed(2),
      monthlyTotal: provider.usageThisMonth.toFixed(2)
    });
    
    // Emit usage update
    this.emit('usage-update', {
      provider: providerKey,
      cost,
      tokens: tokensUsed,
      dailyTotal: currentDaily + cost,
      monthlyTotal: provider.usageThisMonth
    });
    
    // Check if approaching limits
    await this.checkUsageLimits(providerKey);
  }

  getDailyUsage(providerKey, date) {
    const dailyKey = `${providerKey}:${date}`;
    return this.usageHistory.get(dailyKey) || 0;
  }

  async checkUsageLimits(providerKey) {
    const provider = this.providers[providerKey];
    const dailyLimit = this.dailyLimits[providerKey];
    const today = new Date().toDateString();
    const dailyUsage = this.getDailyUsage(providerKey, today);
    
    // Daily limit warnings
    if (dailyLimit) {
      const dailyPercentage = (dailyUsage / dailyLimit) * 100;
      
      if (dailyPercentage >= 90) {
        this.emit('limit-warning', {
          provider: providerKey,
          type: 'daily',
          usage: dailyUsage,
          limit: dailyLimit,
          percentage: dailyPercentage
        });
      }
    }
    
    // Monthly budget warnings
    const monthlyPercentage = (provider.usageThisMonth / provider.monthlyBudget) * 100;
    
    if (monthlyPercentage >= 90) {
      this.emit('limit-warning', {
        provider: providerKey,
        type: 'monthly',
        usage: provider.usageThisMonth,
        limit: provider.monthlyBudget,
        percentage: monthlyPercentage
      });
    }
  }

  async loadUsageHistory() {
    // In production, this would load from database
    // For now, we'll start fresh each time
    logger.info('📊 Usage history loaded');
  }

  startUsageMonitoring() {
    // Reset monthly usage on the 1st of each month
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const msUntilNextMonth = nextMonth.getTime() - now.getTime();
    
    setTimeout(() => {
      this.resetMonthlyUsage();
      
      // Set monthly reset interval
      setInterval(() => {
        this.resetMonthlyUsage();
      }, 30 * 24 * 60 * 60 * 1000); // 30 days
    }, msUntilNextMonth);
    
    // Daily usage summary
    setInterval(() => {
      this.logDailySummary();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  resetMonthlyUsage() {
    for (const provider of Object.values(this.providers)) {
      provider.usageThisMonth = 0;
    }
    
    logger.info('🔄 Monthly usage reset for all providers');
    this.emit('monthly-reset');
  }

  logDailySummary() {
    const today = new Date().toDateString();
    const summary = {};
    
    for (const [key, provider] of Object.entries(this.providers)) {
      summary[key] = {
        name: provider.name,
        dailyUsage: this.getDailyUsage(key, today),
        monthlyUsage: provider.usageThisMonth,
        requestCount: provider.requestCount,
        status: provider.status
      };
    }
    
    logger.info('📊 Daily usage summary', summary);
    this.emit('daily-summary', summary);
  }

  // Get provider status and usage information
  getProviderStatus() {
    const status = {};
    const today = new Date().toDateString();
    
    for (const [key, provider] of Object.entries(this.providers)) {
      status[key] = {
        name: provider.name,
        status: provider.status,
        error: provider.error,
        models: provider.models,
        dailyUsage: this.getDailyUsage(key, today),
        dailyLimit: this.dailyLimits[key],
        monthlyUsage: provider.usageThisMonth,
        monthlyBudget: provider.monthlyBudget,
        requestCount: provider.requestCount,
        costPerToken: provider.costPerToken,
        available: provider.status === 'available' && this.isWithinBudget(key, Infinity)
      };
    }
    
    return status;
  }

  // Update provider configuration
  updateProviderConfig(providerKey, config) {
    if (!this.providers[providerKey]) {
      throw new Error(`Unknown provider: ${providerKey}`);
    }
    
    const provider = this.providers[providerKey];
    
    if (config.monthlyBudget !== undefined) {
      provider.monthlyBudget = config.monthlyBudget;
    }
    
    if (config.dailyLimit !== undefined) {
      this.dailyLimits[providerKey] = config.dailyLimit;
    }
    
    logger.info(`⚙️ Updated configuration for ${provider.name}`, config);
    this.emit('config-updated', { provider: providerKey, config });
  }
}

module.exports = APIKeyMiddleware;

// Start standalone if called directly
if (require.main === module) {
  const middleware = new APIKeyMiddleware();
  
  middleware.on('ready', () => {
    console.log('🔑 API Key Middleware is ready!');
    console.log(JSON.stringify(middleware.getProviderStatus(), null, 2));
  });
  
  middleware.on('limit-warning', ({ provider, type, usage, limit, percentage }) => {
    console.warn(`⚠️ Usage warning: ${provider} ${type} usage at ${percentage.toFixed(1)}% ($${usage.toFixed(2)}/$${limit})`);
  });
  
  middleware.on('usage-update', ({ provider, cost, tokens, dailyTotal, monthlyTotal }) => {
    console.log(`💰 ${provider}: $${cost.toFixed(4)} (${tokens} tokens) - Daily: $${dailyTotal.toFixed(2)}, Monthly: $${monthlyTotal.toFixed(2)}`);
  });
  
  middleware.initialize().catch(error => {
    console.error('❌ Failed to initialize API Key Middleware:', error);
    process.exit(1);
  });
}