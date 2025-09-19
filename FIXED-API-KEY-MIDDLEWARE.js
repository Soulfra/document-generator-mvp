#!/usr/bin/env node

/**
 * 🔑 FIXED API KEY MIDDLEWARE
 * 
 * Properly handles API key management for all AI providers without crashing:
 * - DeepSeek API (research and coding)
 * - Anthropic Claude (synthesis and reasoning) - FIXED
 * - OpenAI GPT (architecture and planning)
 * - Local Ollama (privacy-first processing)
 * 
 * FIXES:
 * - Proper Node.js fetch handling
 * - Robust error handling (no more crashes)
 * - Real Anthropic API integration
 * - Graceful fallbacks
 * - Better environment variable handling
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const winston = require('winston');
const axios = require('axios'); // Use axios instead of fetch for better Node.js support
const fs = require('fs').promises;
const path = require('path');

// Configure enhanced logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    }),
    new winston.transports.File({ 
      filename: 'logs/api-key-middleware.log',
      handleExceptions: true,
      handleRejections: true,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exitOnError: false // Don't crash on errors
});

class FixedAPIKeyMiddleware extends EventEmitter {
  constructor() {
    super();
    
    // Enhanced API key configuration with better error handling
    this.providers = {
      ollama: {
        name: 'Ollama (Local)',
        apiKey: null, // No API key needed
        endpoint: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        models: ['codellama:7b', 'mistral:7b', 'llama2:7b', 'phi:2.7b'],
        costPerToken: 0, // Free local processing
        monthlyBudget: 0,
        usageThisMonth: 0,
        requestCount: 0,
        status: 'unknown',
        priority: 1, // Highest priority (try first)
        timeout: 30000 // 30 seconds
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
        status: 'unknown',
        priority: 2,
        timeout: 60000, // 60 seconds
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        }
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
        status: 'unknown',
        priority: 3,
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        }
      },
      deepseek: {
        name: 'DeepSeek',
        apiKey: process.env.DEEPSEEK_API_KEY,
        endpoint: 'https://api.deepseek.com',
        models: ['deepseek-chat', 'deepseek-coder'],
        costPerToken: 0.0002,
        monthlyBudget: 100, // $100/month
        usageThisMonth: 0,
        requestCount: 0,
        status: 'unknown',
        priority: 4,
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
        }
      }
    };
    
    // Usage tracking with better persistence
    this.usageHistory = new Map();
    this.dailyLimits = {
      deepseek: 50,    // $50/day
      anthropic: 100,  // $100/day
      openai: 75       // $75/day
    };
    
    // Enhanced routing rules
    this.routingRules = {
      code: ['ollama', 'deepseek', 'openai'],           
      research: ['ollama', 'anthropic', 'deepseek'],    
      synthesis: ['anthropic', 'openai', 'ollama'],     
      architecture: ['openai', 'anthropic', 'ollama'],  
      general: ['ollama', 'anthropic', 'openai', 'deepseek'],
      chat: ['anthropic', 'openai', 'ollama'], // For chat-like interactions
      'claude-specific': ['anthropic'] // Force Claude for specific requests
    };
    
    this.initialized = false;
    this.lastHealthCheck = 0;
    this.healthCheckInterval = 300000; // 5 minutes
    
    // Graceful error handling
    this.on('error', (error) => {
      logger.error('🔥 API Middleware Error (non-fatal):', error.message);
      // Don't crash - just log and continue
    });
    
    logger.info('🔑 Fixed API Key Middleware initialized');
  }

  async initialize() {
    logger.info('🚀 Initializing API providers with enhanced error handling...');
    
    try {
      // Create logs directory if it doesn't exist
      await this.ensureLogsDirectory();
      
      // Check which providers are available (with retries)
      await this.checkProviderAvailability();
      
      // Load usage history safely
      await this.loadUsageHistory();
      
      // Setup usage monitoring
      this.startUsageMonitoring();
      
      // Setup periodic health checks
      this.startHealthChecks();
      
      this.initialized = true;
      this.emit('ready');
      
      logger.info('✅ Fixed API Key Middleware ready');
      this.logProviderStatus();
      
    } catch (error) {
      logger.error('❌ API Key Middleware initialization failed:', error.message);
      
      // Don't throw - initialize with limited functionality
      this.initialized = true;
      this.emit('ready-with-errors', error);
      
      logger.warn('⚠️ Middleware running with limited functionality');
    }
  }

  async ensureLogsDirectory() {
    try {
      await fs.mkdir('logs', { recursive: true });
    } catch (error) {
      // Directory might already exist, that's fine
      if (error.code !== 'EEXIST') {
        logger.warn('Could not create logs directory:', error.message);
      }
    }
  }

  async checkProviderAvailability() {
    const checks = Object.entries(this.providers).map(async ([key, provider]) => {
      try {
        await this.checkSingleProvider(key, provider);
      } catch (error) {
        // Don't let one provider failure break everything
        provider.status = 'error';
        provider.error = error.message;
        logger.warn(`❌ ${provider.name}: ${error.message}`);
      }
    });
    
    // Wait for all checks with timeout
    try {
      await Promise.allSettled(checks);
    } catch (error) {
      logger.warn('Some provider checks failed, continuing anyway:', error.message);
    }
  }

  async checkSingleProvider(key, provider) {
    try {
      if (key === 'ollama') {
        // Check Ollama with simple request and timeout
        const response = await axios.get(`${provider.endpoint}/api/tags`, {
          timeout: 5000,
          validateStatus: () => true // Don't throw on non-2xx status codes
        });
        
        if (response.status === 200) {
          provider.status = 'available';
          provider.models = response.data.models?.map(m => m.name) || provider.models;
        } else {
          provider.status = 'offline';
        }
        
      } else if (key === 'anthropic') {
        // Check Anthropic API key and basic connectivity
        if (!provider.apiKey || provider.apiKey === 'undefined') {
          provider.status = 'missing-key';
          logger.warn(`⚠️ ${provider.name}: No API key configured`);
        } else {
          // Test with a minimal request
          try {
            await this.testAnthropicConnection(provider);
            provider.status = 'available';
          } catch (error) {
            provider.status = 'auth-error';
            provider.error = error.message;
          }
        }
        
      } else {
        // Check other cloud providers have API keys
        if (!provider.apiKey || provider.apiKey === 'undefined') {
          provider.status = 'missing-key';
        } else {
          provider.status = 'available';
        }
      }
      
      logger.info(`${provider.status === 'available' ? '✅' : '⚠️'} ${provider.name}: ${provider.status}`);
      
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  }

  async testAnthropicConnection(provider) {
    try {
      // Simple test message to verify API key works
      const response = await axios.post(
        `${provider.endpoint}/v1/messages`,
        {
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }]
        },
        {
          headers: provider.headers,
          timeout: 10000,
          validateStatus: (status) => status < 500 // Only throw on server errors
        }
      );
      
      if (response.status === 401) {
        throw new Error('Invalid API key');
      } else if (response.status === 429) {
        throw new Error('Rate limited (but key is valid)');
      } else if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.data?.error?.message || 'Unknown error'}`);
      }
      
      // If we get here, the API key is valid
      return true;
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Connection refused - API unavailable');
      } else if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${error.response.data?.error?.message || 'API error'}`);
      } else {
        throw new Error(`Network error: ${error.message}`);
      }
    }
  }

  // Enhanced provider selection with better error handling
  selectProvider(taskType = 'general', options = {}) {
    try {
      const preferredOrder = this.routingRules[taskType] || this.routingRules.general;
      const { maxCost = Infinity, excludeProviders = [], forceProvider = null } = options;
      
      // If a specific provider is forced, use it
      if (forceProvider && this.providers[forceProvider]) {
        const provider = this.providers[forceProvider];
        if (provider.status === 'available') {
          logger.info(`🎯 Forced provider: ${provider.name} for ${taskType} task`);
          return { key: forceProvider, provider };
        } else {
          logger.warn(`⚠️ Forced provider ${provider.name} is not available (${provider.status})`);
        }
      }
      
      // Find first available provider
      for (const providerKey of preferredOrder) {
        const provider = this.providers[providerKey];
        
        if (excludeProviders.includes(providerKey)) continue;
        if (!provider || provider.status !== 'available') continue;
        
        // Check budget constraints
        if (this.isWithinBudget(providerKey, maxCost)) {
          logger.info(`🎯 Selected provider: ${provider.name} for ${taskType} task`);
          return { key: providerKey, provider };
        }
      }
      
      // Fallback: try any available provider
      for (const [providerKey, provider] of Object.entries(this.providers)) {
        if (excludeProviders.includes(providerKey)) continue;
        if (provider.status === 'available') {
          logger.warn(`🔄 Fallback to ${provider.name} (budget constraints ignored)`);
          return { key: providerKey, provider };
        }
      }
      
      throw new Error(`No available providers for ${taskType} task`);
      
    } catch (error) {
      logger.error('Provider selection failed:', error.message);
      throw error;
    }
  }

  isWithinBudget(providerKey, maxCost) {
    try {
      const provider = this.providers[providerKey];
      
      // Local providers (like Ollama) are always within budget
      if (provider.costPerToken === 0) return true;
      
      // Check daily limit
      const today = new Date().toDateString();
      const dailyUsage = this.getDailyUsage(providerKey, today);
      const dailyLimit = this.dailyLimits[providerKey] || Infinity;
      
      if (dailyUsage >= dailyLimit) {
        logger.warn(`⚠️ ${provider.name} daily limit reached: $${dailyUsage}/$${dailyLimit}`);
        return false;
      }
      
      // Check monthly budget
      if (provider.usageThisMonth >= provider.monthlyBudget && provider.monthlyBudget > 0) {
        logger.warn(`⚠️ ${provider.name} monthly budget exceeded: $${provider.usageThisMonth}/$${provider.monthlyBudget}`);
        return false;
      }
      
      return true;
      
    } catch (error) {
      logger.error('Budget check failed:', error.message);
      return true; // Allow if we can't check budget
    }
  }

  // Enhanced request routing with proper error handling
  async routeRequest(query, taskType = 'general', options = {}) {
    const { maxRetries = 3, timeout = 60000 } = options;
    let attempt = 0;
    const excludeProviders = [];
    const errors = [];
    
    // Validate inputs
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query: must be a non-empty string');
    }
    
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
          queryLength: query.length
        });
        
        // Route to appropriate API
        const result = await this.sendToProvider(query, key, taskType, {
          requestId,
          timeout,
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
        errors.push(error);
        logger.error(`❌ Request attempt ${attempt + 1} failed:`, error.message);
        
        // Add failed provider to exclusion list if it's a provider-specific error
        if (error.provider) {
          excludeProviders.push(error.provider);
        }
        
        attempt++;
        
        if (attempt >= maxRetries) {
          const errorMsg = `All ${maxRetries} provider attempts failed. Errors: ${errors.map(e => e.message).join('; ')}`;
          logger.error('🔥 Complete routing failure:', errorMsg);
          throw new Error(errorMsg);
        }
        
        // Wait before retry with exponential backoff
        const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
        logger.info(`⏳ Waiting ${waitTime}ms before retry ${attempt + 1}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  async sendToProvider(query, providerKey, taskType, options = {}) {
    const provider = this.providers[providerKey];
    const { requestId, timeout = 60000 } = options;
    
    try {
      switch (providerKey) {
        case 'ollama':
          return await this.sendToOllama(query, provider, options);
        case 'anthropic':
          return await this.sendToAnthropic(query, provider, options);
        case 'openai':
          return await this.sendToOpenAI(query, provider, options);
        case 'deepseek':
          return await this.sendToDeepSeek(query, provider, options);
        default:
          throw new Error(`Unknown provider: ${providerKey}`);
      }
    } catch (error) {
      error.provider = providerKey; // Tag error with provider
      throw error;
    }
  }

  async sendToOllama(query, provider, options = {}) {
    try {
      const response = await axios.post(
        `${provider.endpoint}/api/generate`,
        {
          model: 'mistral:7b',
          prompt: query,
          stream: false
        },
        {
          timeout: options.timeout || 30000,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      return {
        content: response.data.response,
        tokensUsed: 0, // Ollama doesn't charge tokens
        model: 'mistral:7b'
      };
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama server not running or not accessible');
      } else {
        throw new Error(`Ollama error: ${error.message}`);
      }
    }
  }

  async sendToAnthropic(query, provider, options = {}) {
    try {
      if (!provider.apiKey || provider.apiKey === 'undefined') {
        throw new Error('Anthropic API key not configured');
      }
      
      const response = await axios.post(
        `${provider.endpoint}/v1/messages`,
        {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4096,
          messages: [{ role: 'user', content: query }]
        },
        {
          headers: provider.headers,
          timeout: options.timeout || 60000
        }
      );
      
      return {
        content: response.data.content[0].text,
        tokensUsed: response.data.usage?.input_tokens + response.data.usage?.output_tokens || 0,
        model: 'claude-3-sonnet-20240229'
      };
      
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          throw new Error('Invalid Anthropic API key');
        } else if (status === 429) {
          throw new Error('Anthropic rate limit exceeded');
        } else if (status === 400) {
          throw new Error(`Anthropic API error: ${data.error?.message || 'Bad request'}`);
        } else {
          throw new Error(`Anthropic HTTP ${status}: ${data.error?.message || 'Unknown error'}`);
        }
      } else {
        throw new Error(`Anthropic connection error: ${error.message}`);
      }
    }
  }

  async sendToOpenAI(query, provider, options = {}) {
    try {
      if (!provider.apiKey || provider.apiKey === 'undefined') {
        throw new Error('OpenAI API key not configured');
      }
      
      const response = await axios.post(
        `${provider.endpoint}/v1/chat/completions`,
        {
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: query }],
          max_tokens: 4096
        },
        {
          headers: provider.headers,
          timeout: options.timeout || 60000
        }
      );
      
      return {
        content: response.data.choices[0].message.content,
        tokensUsed: response.data.usage.total_tokens,
        model: 'gpt-3.5-turbo'
      };
      
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          throw new Error('Invalid OpenAI API key');
        } else if (status === 429) {
          throw new Error('OpenAI rate limit exceeded');
        } else {
          throw new Error(`OpenAI HTTP ${status}: ${data.error?.message || 'Unknown error'}`);
        }
      } else {
        throw new Error(`OpenAI connection error: ${error.message}`);
      }
    }
  }

  async sendToDeepSeek(query, provider, options = {}) {
    try {
      if (!provider.apiKey || provider.apiKey === 'undefined') {
        throw new Error('DeepSeek API key not configured');
      }
      
      const response = await axios.post(
        `${provider.endpoint}/v1/chat/completions`,
        {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: query }],
          max_tokens: 4096
        },
        {
          headers: provider.headers,
          timeout: options.timeout || 60000
        }
      );
      
      return {
        content: response.data.choices[0].message.content,
        tokensUsed: response.data.usage.total_tokens,
        model: 'deepseek-chat'
      };
      
    } catch (error) {
      if (error.response) {
        throw new Error(`DeepSeek HTTP ${error.response.status}: ${error.response.data?.error?.message || 'Unknown error'}`);
      } else {
        throw new Error(`DeepSeek connection error: ${error.message}`);
      }
    }
  }

  // Improved usage tracking with persistence
  async trackUsage(providerKey, tokensUsed, duration, success) {
    try {
      const provider = this.providers[providerKey];
      const cost = this.calculateCost(providerKey, tokensUsed);
      
      // Update provider stats
      provider.requestCount++;
      provider.usageThisMonth += cost;
      
      // Track daily usage
      const today = new Date().toDateString();
      const dailyKey = `${providerKey}:${today}`;
      const currentDaily = this.usageHistory.get(dailyKey) || 0;
      this.usageHistory.set(dailyKey, currentDaily + cost);
      
      // Log usage
      logger.info(`📊 Usage tracked: ${provider.name}`, {
        tokens: tokensUsed,
        cost: `$${cost.toFixed(4)}`,
        duration: `${duration}ms`,
        success
      });
      
      // Persist usage data
      await this.saveUsageHistory();
      
    } catch (error) {
      logger.error('Usage tracking failed:', error.message);
      // Don't throw - tracking failure shouldn't break the main flow
    }
  }

  calculateCost(providerKey, tokensUsed) {
    const provider = this.providers[providerKey];
    return tokensUsed * provider.costPerToken;
  }

  getDailyUsage(providerKey, date) {
    const dailyKey = `${providerKey}:${date}`;
    return this.usageHistory.get(dailyKey) || 0;
  }

  async loadUsageHistory() {
    try {
      const historyFile = path.join(__dirname, 'usage-history.json');
      const data = await fs.readFile(historyFile, 'utf8');
      const history = JSON.parse(data);
      
      // Convert array back to Map
      this.usageHistory = new Map(history);
      logger.info('📊 Usage history loaded');
      
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.warn('Could not load usage history:', error.message);
      }
      // Start with empty history if file doesn't exist
    }
  }

  async saveUsageHistory() {
    try {
      const historyFile = path.join(__dirname, 'usage-history.json');
      
      // Convert Map to array for JSON serialization
      const historyArray = Array.from(this.usageHistory.entries());
      await fs.writeFile(historyFile, JSON.stringify(historyArray, null, 2));
      
    } catch (error) {
      logger.error('Could not save usage history:', error.message);
    }
  }

  startUsageMonitoring() {
    // Save usage data every 5 minutes
    setInterval(() => {
      this.saveUsageHistory().catch(error => {
        logger.error('Periodic usage save failed:', error.message);
      });
    }, 300000);
    
    logger.info('📊 Usage monitoring started');
  }

  startHealthChecks() {
    // Check provider health every 5 minutes
    setInterval(() => {
      this.checkProviderAvailability().catch(error => {
        logger.error('Health check failed:', error.message);
      });
    }, this.healthCheckInterval);
    
    logger.info('🏥 Health monitoring started');
  }

  generateRequestId() {
    return crypto.randomBytes(8).toString('hex');
  }

  logProviderStatus() {
    logger.info('📊 Provider Status Summary:');
    Object.entries(this.providers).forEach(([key, provider]) => {
      const status = provider.status === 'available' ? '✅' : 
                    provider.status === 'missing-key' ? '🔑' : 
                    provider.status === 'offline' ? '📴' : '❌';
      logger.info(`  ${status} ${provider.name}: ${provider.status}`);
    });
  }

  // Public API methods
  async chat(message, options = {}) {
    return this.routeRequest(message, 'chat', options);
  }

  async generate(prompt, options = {}) {
    return this.routeRequest(prompt, 'general', options);
  }

  async anthropicDirect(message, options = {}) {
    return this.routeRequest(message, 'claude-specific', options);
  }

  getStatus() {
    return {
      initialized: this.initialized,
      providers: Object.fromEntries(
        Object.entries(this.providers).map(([key, provider]) => [
          key, 
          {
            name: provider.name,
            status: provider.status,
            requestCount: provider.requestCount,
            usageThisMonth: provider.usageThisMonth,
            monthlyBudget: provider.monthlyBudget
          }
        ])
      ),
      totalRequests: Object.values(this.providers).reduce((sum, p) => sum + p.requestCount, 0)
    };
  }
}

// Export the fixed middleware
module.exports = FixedAPIKeyMiddleware;

// CLI usage
if (require.main === module) {
  const middleware = new FixedAPIKeyMiddleware();
  
  middleware.on('ready', () => {
    console.log('🔑 Fixed API Key Middleware is ready!');
    console.log('✅ No more crashes on Anthropic calls');
    console.log('🛡️ Enhanced error handling');
    console.log('📊 Usage tracking enabled');
    console.log('');
    
    // Test the middleware
    middleware.chat('Hello, this is a test message')
      .then(result => {
        console.log('✅ Test successful:', result.provider);
      })
      .catch(error => {
        console.log('⚠️ Test failed (but middleware didn\'t crash):', error.message);
      });
  });
  
  middleware.on('ready-with-errors', (error) => {
    console.log('⚠️ Middleware running with limited functionality');
    console.log('Error:', error.message);
  });
  
  middleware.initialize().catch(error => {
    console.error('❌ Failed to start middleware:', error.message);
    process.exit(1);
  });
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down Fixed API Key Middleware...');
    middleware.saveUsageHistory().then(() => {
      process.exit(0);
    });
  });
}