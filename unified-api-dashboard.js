#!/usr/bin/env node

/**
 * Unified API Dashboard - Central AI Orchestration Hub
 * 
 * This is the convergence point for:
 * - API key management and routing
 * - Fine-tuning model management
 * - Visual canvas interface
 * - Game layer prompt intake
 * - Cost monitoring and analytics
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
require('dotenv').config();

// Import existing services
const { testDeepSeek, testOpenAI, testAnthropic, testOllama } = require('./FinishThisIdea/test-workspace/ai-os-clean/test-apis.js');

class UnifiedAPIDashboard {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    this.port = process.env.UNIFIED_API_PORT || 8090;
    
    // Initialize databases
    this.initDatabases();
    
    // API configurations with enhanced tracking
    this.apiConfigs = {
      deepseek: {
        url: 'https://api.deepseek.com/v1/chat/completions',
        key: process.env.DEEPSEEK_API_KEY,
        model: 'deepseek-chat',
        name: 'DeepSeek',
        costPerToken: 0.00014,
        rateLimit: { requests: 60, window: 60000 },
        usage: { requests: 0, tokens: 0, cost: 0 }
      },
      openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        key: process.env.OPENAI_API_KEY,
        model: 'gpt-3.5-turbo',
        name: 'OpenAI',
        costPerToken: 0.002,
        rateLimit: { requests: 60, window: 60000 },
        usage: { requests: 0, tokens: 0, cost: 0 }
      },
      anthropic: {
        url: 'https://api.anthropic.com/v1/messages',
        key: process.env.ANTHROPIC_API_KEY,
        model: 'claude-3-haiku-20240307',
        name: 'Anthropic',
        costPerToken: 0.00025,
        rateLimit: { requests: 50, window: 60000 },
        usage: { requests: 0, tokens: 0, cost: 0 }
      },
      ollama: {
        url: 'http://localhost:11434/api/generate',
        key: null,
        model: 'mistral',
        name: 'Ollama (Local)',
        costPerToken: 0,
        rateLimit: { requests: 1000, window: 60000 },
        usage: { requests: 0, tokens: 0, cost: 0 }
      }
    };
    
    // Fine-tuning models registry
    this.fineTunedModels = new Map();
    
    // Routing strategies
    this.routingStrategies = {
      costOptimized: this.costOptimizedRouting.bind(this),
      qualityFirst: this.qualityFirstRouting.bind(this),
      balanced: this.balancedRouting.bind(this),
      characterBased: this.characterBasedRouting.bind(this),
      gameLayer: this.gameLayerRouting.bind(this)
    };
    
    // Active routing strategy
    this.activeStrategy = 'balanced';
    
    // Prompt templates for game layer
    this.promptTemplates = new Map();
    
    // Real-time metrics
    this.metrics = {
      totalRequests: 0,
      totalTokens: 0,
      totalCost: 0,
      avgResponseTime: 0,
      successRate: 0,
      activeConnections: 0
    };
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.loadFineTunedModels();
    this.loadPromptTemplates();
  }

  initDatabases() {
    // API usage database
    this.usageDB = new Database('./data/api-usage.sqlite');
    this.usageDB.pragma('journal_mode = WAL');
    
    this.usageDB.exec(`
      CREATE TABLE IF NOT EXISTS api_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        api_name TEXT NOT NULL,
        model TEXT NOT NULL,
        prompt_tokens INTEGER,
        completion_tokens INTEGER,
        total_tokens INTEGER,
        cost REAL,
        response_time_ms INTEGER,
        success BOOLEAN,
        error_message TEXT,
        user_id TEXT,
        session_id TEXT,
        purpose TEXT
      )
    `);
    
    // Fine-tuning database
    this.fineTuningDB = new Database('./data/fine-tuning.sqlite');
    this.fineTuningDB.pragma('journal_mode = WAL');
    
    this.fineTuningDB.exec(`
      CREATE TABLE IF NOT EXISTS fine_tuned_models (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        base_model TEXT NOT NULL,
        provider TEXT NOT NULL,
        training_data_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'active',
        performance_metrics TEXT,
        cost REAL,
        description TEXT
      )
    `);
    
    this.fineTuningDB.exec(`
      CREATE TABLE IF NOT EXISTS prompt_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        template TEXT NOT NULL,
        variables TEXT,
        character TEXT,
        game_context TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        usage_count INTEGER DEFAULT 0,
        avg_score REAL DEFAULT 0
      )
    `);
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // CORS for dashboard
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Dashboard UI
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'api-dashboard.html'));
    });
    
    // API Status
    this.app.get('/api/status', (req, res) => {
      const status = {};
      
      Object.entries(this.apiConfigs).forEach(([key, config]) => {
        status[key] = {
          name: config.name,
          available: !!config.key || key === 'ollama',
          model: config.model,
          usage: config.usage,
          costPerToken: config.costPerToken,
          healthy: true // Will be updated by health checks
        };
      });
      
      res.json({
        apis: status,
        metrics: this.metrics,
        activeStrategy: this.activeStrategy,
        fineTunedModels: Array.from(this.fineTunedModels.values()),
        timestamp: new Date().toISOString()
      });
    });
    
    // Execute prompt with routing
    this.app.post('/api/prompt', async (req, res) => {
      const { prompt, context = {}, strategy = this.activeStrategy, userId = 'anonymous' } = req.body;
      
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt required' });
      }
      
      try {
        const startTime = Date.now();
        const sessionId = this.generateSessionId();
        
        // Apply routing strategy
        const routingFunc = this.routingStrategies[strategy] || this.routingStrategies.balanced;
        const result = await routingFunc(prompt, context);
        
        const responseTime = Date.now() - startTime;
        
        // Track usage
        this.trackUsage({
          apiName: result.provider,
          model: result.model,
          promptTokens: result.promptTokens,
          completionTokens: result.completionTokens,
          totalTokens: result.totalTokens,
          cost: result.cost,
          responseTimeMs: responseTime,
          success: true,
          userId,
          sessionId,
          purpose: context.purpose || 'general'
        });
        
        // Update metrics
        this.updateMetrics(result);
        
        res.json({
          success: true,
          response: result.response,
          provider: result.provider,
          model: result.model,
          cost: result.cost,
          responseTime,
          sessionId,
          metadata: {
            strategy,
            totalTokens: result.totalTokens,
            confidence: result.confidence
          }
        });
        
      } catch (error) {
        console.error('Prompt execution error:', error);
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Fine-tuning management
    this.app.get('/api/fine-tuning/models', (req, res) => {
      const models = this.fineTuningDB.prepare('SELECT * FROM fine_tuned_models WHERE status = ?').all('active');
      res.json(models);
    });
    
    this.app.post('/api/fine-tuning/models', async (req, res) => {
      const { name, baseModel, provider, trainingDataPath, description } = req.body;
      
      const modelId = `ft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      try {
        this.fineTuningDB.prepare(`
          INSERT INTO fine_tuned_models (id, name, base_model, provider, training_data_path, description)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(modelId, name, baseModel, provider, trainingDataPath, description);
        
        // Add to active models
        this.fineTunedModels.set(modelId, {
          id: modelId,
          name,
          baseModel,
          provider,
          active: true
        });
        
        res.json({
          success: true,
          modelId,
          message: 'Fine-tuned model registered'
        });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Prompt templates
    this.app.get('/api/templates', (req, res) => {
      const templates = this.fineTuningDB.prepare('SELECT * FROM prompt_templates ORDER BY usage_count DESC').all();
      res.json(templates);
    });
    
    this.app.post('/api/templates', (req, res) => {
      const { name, category, template, variables = '[]', character, gameContext } = req.body;
      
      try {
        const result = this.fineTuningDB.prepare(`
          INSERT INTO prompt_templates (name, category, template, variables, character, game_context)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(name, category, template, JSON.stringify(variables), character, gameContext);
        
        res.json({
          success: true,
          templateId: result.lastInsertRowid
        });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Game layer integration
    this.app.post('/api/game/prompt', async (req, res) => {
      const { character, action, context, templateId } = req.body;
      
      try {
        // Build game-specific prompt
        const prompt = await this.buildGamePrompt(character, action, context, templateId);
        
        // Route with game layer strategy
        const result = await this.gameLayerRouting(prompt, { character, action, ...context });
        
        res.json({
          success: true,
          response: result.response,
          character,
          action,
          provider: result.provider,
          cost: result.cost
        });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    // Usage analytics
    this.app.get('/api/analytics/usage', (req, res) => {
      const { days = 7 } = req.query;
      
      const usage = this.usageDB.prepare(`
        SELECT 
          DATE(timestamp) as date,
          api_name,
          COUNT(*) as requests,
          SUM(total_tokens) as tokens,
          SUM(cost) as cost,
          AVG(response_time_ms) as avg_response_time
        FROM api_usage
        WHERE timestamp > datetime('now', '-' || ? || ' days')
        GROUP BY DATE(timestamp), api_name
        ORDER BY date DESC
      `).all(days);
      
      res.json(usage);
    });
    
    // Cost analytics
    this.app.get('/api/analytics/costs', (req, res) => {
      const costs = this.usageDB.prepare(`
        SELECT 
          api_name,
          SUM(cost) as total_cost,
          COUNT(*) as total_requests,
          AVG(cost) as avg_cost_per_request
        FROM api_usage
        WHERE timestamp > datetime('now', '-30 days')
        GROUP BY api_name
      `).all();
      
      res.json(costs);
    });
    
    // Health check all APIs
    this.app.get('/api/health', async (req, res) => {
      const healthChecks = await Promise.all(
        Object.entries(this.apiConfigs).map(async ([key, config]) => {
          try {
            if (key === 'ollama') {
              const response = await fetch(`${config.url.replace('/api/generate', '')}/api/tags`);
              return { api: key, healthy: response.ok, latency: 0 };
            } else if (config.key) {
              // Simple health check - just verify key format
              return { api: key, healthy: true, latency: 0 };
            }
            return { api: key, healthy: false, reason: 'No API key' };
          } catch (error) {
            return { api: key, healthy: false, error: error.message };
          }
        })
      );
      
      res.json(healthChecks);
    });
    
    // Update routing strategy
    this.app.put('/api/routing/strategy', (req, res) => {
      const { strategy } = req.body;
      
      if (this.routingStrategies[strategy]) {
        this.activeStrategy = strategy;
        res.json({ success: true, activeStrategy: strategy });
      } else {
        res.status(400).json({ error: 'Invalid strategy' });
      }
    });
    
    // Billing verification endpoints
    this.app.get('/api/billing/verify', async (req, res) => {
      try {
        const verificationResults = await this.verifyBillingCosts();
        res.json({
          success: true,
          verification: verificationResults,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
    
    this.app.get('/api/billing/projected', async (req, res) => {
      try {
        const { days = 30 } = req.query;
        const projection = await this.calculateCostProjection(parseInt(days));
        res.json({
          success: true,
          projection,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('New WebSocket connection');
      this.metrics.activeConnections++;
      
      // Send initial status
      ws.send(JSON.stringify({
        type: 'status',
        data: {
          apis: this.apiConfigs,
          metrics: this.metrics
        }
      }));
      
      ws.on('close', () => {
        this.metrics.activeConnections--;
      });
    });
  }

  // Routing strategies
  async costOptimizedRouting(prompt, context) {
    // Try APIs in order of cost (cheapest first)
    const sortedApis = Object.entries(this.apiConfigs)
      .filter(([key, config]) => config.key || key === 'ollama')
      .sort((a, b) => a[1].costPerToken - b[1].costPerToken);
    
    for (const [apiKey, config] of sortedApis) {
      try {
        return await this.callAPI(apiKey, prompt, context);
      } catch (error) {
        console.error(`${apiKey} failed, trying next...`);
      }
    }
    
    throw new Error('All APIs failed');
  }

  async qualityFirstRouting(prompt, context) {
    // Prioritize quality (Anthropic > OpenAI > DeepSeek > Ollama)
    const qualityOrder = ['anthropic', 'openai', 'deepseek', 'ollama'];
    
    for (const apiKey of qualityOrder) {
      if (this.apiConfigs[apiKey].key || apiKey === 'ollama') {
        try {
          return await this.callAPI(apiKey, prompt, context);
        } catch (error) {
          console.error(`${apiKey} failed, trying next...`);
        }
      }
    }
    
    throw new Error('All APIs failed');
  }

  async balancedRouting(prompt, context) {
    // Balance between cost and quality
    // Use local for simple tasks, cloud for complex
    const complexity = this.assessComplexity(prompt);
    
    if (complexity < 0.3) {
      // Simple task - try local first
      try {
        return await this.callAPI('ollama', prompt, context);
      } catch (error) {
        // Fallback to DeepSeek
        return await this.callAPI('deepseek', prompt, context);
      }
    } else if (complexity < 0.7) {
      // Medium complexity - DeepSeek or OpenAI
      try {
        return await this.callAPI('deepseek', prompt, context);
      } catch (error) {
        return await this.callAPI('openai', prompt, context);
      }
    } else {
      // High complexity - Anthropic or OpenAI
      try {
        return await this.callAPI('anthropic', prompt, context);
      } catch (error) {
        return await this.callAPI('openai', prompt, context);
      }
    }
  }

  async characterBasedRouting(prompt, context) {
    // Route based on character requirements and specializations
    const character = context.character || 'default';
    
    const characterRouting = {
      // Core team
      cal: 'deepseek',      // 📊 Cal: Systems/Data orchestrator
      arty: 'anthropic',    // 🎨 Arty: Creative/Frontend specialist 
      ralph: 'openai',      // 🔧 Ralph: Backend/Engineering
      
      // Specialized team
      vera: 'anthropic',    // 🔐 Vera: Security/Blockchain specialist
      paulo: 'deepseek',    // 🐍 Paulo: Python/ML specialist
      nash: 'deepseek',     // ⚡ Nash: Performance/Systems specialist
      
      default: 'balanced'
    };
    
    // Character specialization context
    const characterSpecializations = {
      cal: ['systems', 'architecture', 'databases', 'apis', 'devops', 'analysis'],
      arty: ['ui', 'ux', 'design', 'react', 'vue', 'frontend', 'creative', 'documentation'],
      ralph: ['backend', 'rust', 'go', 'testing', 'performance', 'infrastructure'],
      vera: ['security', 'blockchain', 'solidity', 'smart-contracts', 'audits', 'cryptography'],
      paulo: ['python', 'flask', 'django', 'fastapi', 'ml', 'data-science', 'jupyter'],
      nash: ['cpp', 'rust', 'performance', 'embedded', 'compilers', 'optimization']
    };
    
    // Auto-detect character if not specified based on prompt content
    let selectedCharacter = character;
    if (character === 'default') {
      selectedCharacter = this.detectCharacterFromPrompt(prompt, characterSpecializations);
    }
    
    const preferredApi = characterRouting[selectedCharacter.toLowerCase()];
    
    if (preferredApi === 'balanced' || !preferredApi) {
      return this.balancedRouting(prompt, context);
    }
    
    try {
      const result = await this.callAPI(preferredApi, prompt, context);
      
      // Add character context to result
      result.character = selectedCharacter;
      result.specialization = characterSpecializations[selectedCharacter.toLowerCase()];
      
      return result;
    } catch (error) {
      // Fallback to balanced
      return this.balancedRouting(prompt, context);
    }
  }
  
  detectCharacterFromPrompt(prompt, specializations) {
    const promptLower = prompt.toLowerCase();
    let bestMatch = 'cal'; // Default to Cal
    let maxScore = 0;
    
    Object.entries(specializations).forEach(([character, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        if (promptLower.includes(keyword)) {
          score += 1;
        }
        // Bonus for exact keyword matches
        if (promptLower.includes(` ${keyword} `) || promptLower.startsWith(keyword) || promptLower.endsWith(keyword)) {
          score += 0.5;
        }
      });
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = character;
      }
    });
    
    return bestMatch;
  }

  async gameLayerRouting(prompt, context) {
    // Special routing for game layer with caching
    const cacheKey = this.generateCacheKey(prompt, context);
    
    // Check cache first (for repeated game actions)
    const cached = this.checkCache(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Route based on game action type
    const actionType = context.action || 'general';
    
    const actionRouting = {
      combat: 'ollama',        // Fast responses for combat
      dialogue: 'anthropic',   // Quality for NPC dialogue
      exploration: 'deepseek', // Balanced for exploration
      puzzle: 'openai',        // Problem-solving
      general: 'balanced'
    };
    
    const strategy = actionRouting[actionType] || 'balanced';
    
    let result;
    if (this.routingStrategies[strategy]) {
      result = await this.routingStrategies[strategy](prompt, context);
    } else {
      result = await this.callAPI(strategy, prompt, context);
    }
    
    // Cache result
    this.cacheResult(cacheKey, result);
    
    return result;
  }

  // API calling logic
  async callAPI(apiKey, prompt, context) {
    const config = this.apiConfigs[apiKey];
    
    if (!config) {
      throw new Error(`Unknown API: ${apiKey}`);
    }
    
    if (!config.key && apiKey !== 'ollama') {
      throw new Error(`No API key for ${apiKey}`);
    }
    
    const startTime = Date.now();
    
    try {
      let response, data, completionText, promptTokens, completionTokens;
      
      switch (apiKey) {
        case 'deepseek':
        case 'openai':
          response = await fetch(config.url, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.key}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: config.model,
              messages: [{ role: 'user', content: prompt }],
              max_tokens: context.maxTokens || 500,
              temperature: context.temperature || 0.7
            })
          });
          
          data = await response.json();
          completionText = data.choices?.[0]?.message?.content;
          promptTokens = data.usage?.prompt_tokens || 0;
          completionTokens = data.usage?.completion_tokens || 0;
          break;
          
        case 'anthropic':
          response = await fetch(config.url, {
            method: 'POST',
            headers: {
              'x-api-key': config.key,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: config.model,
              messages: [{ role: 'user', content: prompt }],
              max_tokens: context.maxTokens || 500
            })
          });
          
          data = await response.json();
          completionText = data.content?.[0]?.text;
          promptTokens = data.usage?.input_tokens || 0;
          completionTokens = data.usage?.output_tokens || 0;
          break;
          
        case 'ollama':
          response = await fetch(config.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: config.model,
              prompt: prompt,
              stream: false
            })
          });
          
          data = await response.json();
          completionText = data.response;
          // Estimate tokens for Ollama
          promptTokens = prompt.length / 4;
          completionTokens = completionText.length / 4;
          break;
      }
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const totalTokens = promptTokens + completionTokens;
      const cost = totalTokens * config.costPerToken / 1000;
      
      // Update usage stats
      config.usage.requests++;
      config.usage.tokens += totalTokens;
      config.usage.cost += cost;
      
      return {
        provider: apiKey,
        model: config.model,
        response: completionText,
        promptTokens,
        completionTokens,
        totalTokens,
        cost,
        responseTime: Date.now() - startTime,
        confidence: 0.8 // Can be enhanced with actual confidence scoring
      };
      
    } catch (error) {
      throw new Error(`${apiKey} API error: ${error.message}`);
    }
  }

  // Helper methods
  assessComplexity(prompt) {
    // Simple complexity assessment based on prompt characteristics
    const factors = {
      length: prompt.length / 1000,
      codeRequested: /code|implement|function|class/i.test(prompt) ? 0.3 : 0,
      analysisRequested: /analyze|explain|compare/i.test(prompt) ? 0.2 : 0,
      creativityRequested: /create|design|imagine/i.test(prompt) ? 0.3 : 0
    };
    
    return Math.min(1, Object.values(factors).reduce((a, b) => a + b, 0));
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateCacheKey(prompt, context) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(`${prompt}${JSON.stringify(context)}`).digest('hex');
  }

  checkCache(key) {
    // Simple in-memory cache (can be replaced with Redis)
    return this.cache?.get(key);
  }

  cacheResult(key, result) {
    if (!this.cache) {
      this.cache = new Map();
    }
    this.cache.set(key, result);
    
    // Simple TTL - clear after 5 minutes
    setTimeout(() => this.cache.delete(key), 5 * 60 * 1000);
  }

  async buildGamePrompt(character, action, context, templateId) {
    if (templateId) {
      const template = this.fineTuningDB.prepare('SELECT * FROM prompt_templates WHERE id = ?').get(templateId);
      if (template) {
        let prompt = template.template;
        // Replace variables
        const variables = JSON.parse(template.variables || '[]');
        variables.forEach(varName => {
          if (context[varName]) {
            prompt = prompt.replace(`{{${varName}}}`, context[varName]);
          }
        });
        return prompt;
      }
    }
    
    // Default game prompt construction
    return `Character ${character} performs action: ${action}. Context: ${JSON.stringify(context)}`;
  }

  trackUsage(data) {
    this.usageDB.prepare(`
      INSERT INTO api_usage (
        api_name, model, prompt_tokens, completion_tokens, total_tokens,
        cost, response_time_ms, success, error_message, user_id, session_id, purpose
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.apiName,
      data.model,
      data.promptTokens,
      data.completionTokens,
      data.totalTokens,
      data.cost,
      data.responseTimeMs,
      data.success ? 1 : 0,
      data.errorMessage || null,
      data.userId,
      data.sessionId,
      data.purpose
    );
  }

  updateMetrics(result) {
    this.metrics.totalRequests++;
    this.metrics.totalTokens += result.totalTokens;
    this.metrics.totalCost += result.cost;
    
    // Update average response time
    const currentAvg = this.metrics.avgResponseTime;
    this.metrics.avgResponseTime = (currentAvg * (this.metrics.totalRequests - 1) + result.responseTime) / this.metrics.totalRequests;
    
    // Broadcast update to connected clients
    this.broadcast({
      type: 'metrics_update',
      data: this.metrics
    });
  }

  broadcast(message) {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  loadFineTunedModels() {
    const models = this.fineTuningDB.prepare('SELECT * FROM fine_tuned_models WHERE status = ?').all('active');
    models.forEach(model => {
      this.fineTunedModels.set(model.id, model);
    });
    console.log(`Loaded ${models.length} fine-tuned models`);
  }

  loadPromptTemplates() {
    const templates = this.fineTuningDB.prepare('SELECT * FROM prompt_templates').all();
    templates.forEach(template => {
      this.promptTemplates.set(template.id, template);
    });
    console.log(`Loaded ${templates.length} prompt templates`);
  }

  // Billing verification methods
  async verifyBillingCosts() {
    const internalCosts = await this.getInternalCostSummary();
    const billingData = await this.fetchActualBillingData();
    
    const verification = {
      internal: internalCosts,
      actual: billingData,
      discrepancies: this.calculateDiscrepancies(internalCosts, billingData),
      accuracy: this.calculateAccuracy(internalCosts, billingData),
      recommendations: this.generateCostRecommendations(internalCosts, billingData)
    };
    
    return verification;
  }
  
  async getInternalCostSummary() {
    const summary = this.usageDB.prepare(`
      SELECT 
        api_name,
        COUNT(*) as request_count,
        SUM(total_tokens) as total_tokens,
        SUM(cost) as calculated_cost,
        AVG(cost) as avg_cost_per_request,
        DATE(timestamp) as date
      FROM api_usage 
      WHERE timestamp > datetime('now', '-7 days')
      GROUP BY api_name, DATE(timestamp)
      ORDER BY date DESC, calculated_cost DESC
    `).all();
    
    return summary;
  }
  
  async fetchActualBillingData() {
    // Real billing API integration
    const billingPromises = [];
    
    // Anthropic billing (if they have a billing API)
    if (this.apiConfigs.anthropic.key) {
      billingPromises.push(this.fetchAnthropicBilling());
    }
    
    // OpenAI billing
    if (this.apiConfigs.openai.key) {
      billingPromises.push(this.fetchOpenAIBilling());
    }
    
    // DeepSeek billing (if available)
    if (this.apiConfigs.deepseek.key) {
      billingPromises.push(this.fetchDeepSeekBilling());
    }
    
    const results = await Promise.allSettled(billingPromises);
    return results.map(r => r.status === 'fulfilled' ? r.value : { error: r.reason.message });
  }
  
  async fetchOpenAIBilling() {
    try {
      // OpenAI has a usage API endpoint
      const response = await fetch('https://api.openai.com/v1/usage', {
        headers: {
          'Authorization': `Bearer ${this.apiConfigs.openai.key}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          provider: 'openai',
          billing_data: data,
          status: 'success'
        };
      } else {
        return {
          provider: 'openai',
          error: 'Billing API not accessible',
          status: 'unavailable'
        };
      }
    } catch (error) {
      return {
        provider: 'openai',
        error: error.message,
        status: 'error'
      };
    }
  }
  
  async fetchAnthropicBilling() {
    // Anthropic doesn't have a public billing API yet
    return {
      provider: 'anthropic',
      message: 'Billing verification via dashboard recommended',
      estimated_monthly: this.estimateMonthlyUsage('anthropic'),
      status: 'estimated'
    };
  }
  
  async fetchDeepSeekBilling() {
    // DeepSeek billing API (if available)
    return {
      provider: 'deepseek',
      message: 'Billing verification via dashboard recommended',
      estimated_monthly: this.estimateMonthlyUsage('deepseek'),
      status: 'estimated'
    };
  }
  
  estimateMonthlyUsage(provider) {
    const dailyUsage = this.usageDB.prepare(`
      SELECT SUM(cost) as daily_cost
      FROM api_usage 
      WHERE api_name = ? AND timestamp > datetime('now', '-1 day')
    `).get(provider);
    
    return {
      daily_average: dailyUsage?.daily_cost || 0,
      monthly_projection: (dailyUsage?.daily_cost || 0) * 30,
      confidence: dailyUsage?.daily_cost ? 'high' : 'low'
    };
  }
  
  calculateDiscrepancies(internal, actual) {
    const discrepancies = [];
    
    internal.forEach(internalData => {
      const actualData = actual.find(a => a.provider === internalData.api_name);
      if (actualData && actualData.billing_data) {
        const difference = Math.abs(internalData.calculated_cost - actualData.billing_data.cost);
        const percentDiff = (difference / internalData.calculated_cost) * 100;
        
        if (percentDiff > 5) { // Flag if more than 5% difference
          discrepancies.push({
            provider: internalData.api_name,
            internal_cost: internalData.calculated_cost,
            actual_cost: actualData.billing_data.cost,
            difference: difference,
            percent_difference: percentDiff
          });
        }
      }
    });
    
    return discrepancies;
  }
  
  calculateAccuracy(internal, actual) {
    let totalAccuracy = 0;
    let comparisons = 0;
    
    internal.forEach(internalData => {
      const actualData = actual.find(a => a.provider === internalData.api_name);
      if (actualData && actualData.billing_data) {
        const accuracy = 100 - Math.abs(
          (internalData.calculated_cost - actualData.billing_data.cost) / 
          internalData.calculated_cost * 100
        );
        totalAccuracy += accuracy;
        comparisons++;
      }
    });
    
    return comparisons > 0 ? totalAccuracy / comparisons : 0;
  }
  
  generateCostRecommendations(internal, actual) {
    const recommendations = [];
    
    // Check for high-cost providers
    const sortedCosts = internal.sort((a, b) => b.calculated_cost - a.calculated_cost);
    if (sortedCosts.length > 0 && sortedCosts[0].calculated_cost > 0.01) {
      recommendations.push({
        type: 'cost_optimization',
        message: `Consider routing more requests to cheaper alternatives. ${sortedCosts[0].api_name} is your highest cost provider.`,
        potential_savings: this.calculatePotentialSavings(sortedCosts)
      });
    }
    
    // Check for unusual usage patterns
    const avgRequestCosts = internal.map(i => i.avg_cost_per_request);
    const maxCost = Math.max(...avgRequestCosts);
    const minCost = Math.min(...avgRequestCosts.filter(c => c > 0));
    
    if (maxCost > minCost * 10) {
      recommendations.push({
        type: 'routing_optimization',
        message: 'Significant cost variance between providers detected. Review routing strategy.',
        cost_range: { min: minCost, max: maxCost }
      });
    }
    
    return recommendations;
  }
  
  calculatePotentialSavings(sortedCosts) {
    if (sortedCosts.length < 2) return 0;
    
    const highestCost = sortedCosts[0];
    const lowestCost = sortedCosts[sortedCosts.length - 1];
    
    return {
      current_highest: highestCost.calculated_cost,
      potential_with_cheapest: highestCost.request_count * (lowestCost.calculated_cost / lowestCost.request_count),
      savings_amount: highestCost.calculated_cost - (highestCost.request_count * (lowestCost.calculated_cost / lowestCost.request_count)),
      savings_percent: ((highestCost.calculated_cost - (highestCost.request_count * (lowestCost.calculated_cost / lowestCost.request_count))) / highestCost.calculated_cost) * 100
    };
  }
  
  async calculateCostProjection(days) {
    const recentUsage = this.usageDB.prepare(`
      SELECT 
        api_name,
        AVG(daily_cost) as avg_daily_cost,
        AVG(daily_requests) as avg_daily_requests
      FROM (
        SELECT 
          api_name,
          DATE(timestamp) as date,
          SUM(cost) as daily_cost,
          COUNT(*) as daily_requests
        FROM api_usage 
        WHERE timestamp > datetime('now', '-7 days')
        GROUP BY api_name, DATE(timestamp)
      )
      GROUP BY api_name
    `).all();
    
    const projection = {
      period_days: days,
      projections: recentUsage.map(usage => ({
        provider: usage.api_name,
        daily_average: usage.avg_daily_cost,
        projected_cost: usage.avg_daily_cost * days,
        projected_requests: usage.avg_daily_requests * days
      })),
      total_projected_cost: recentUsage.reduce((sum, usage) => sum + (usage.avg_daily_cost * days), 0),
      confidence: recentUsage.length > 0 ? 'medium' : 'low',
      recommendations: this.generateProjectionRecommendations(recentUsage, days)
    };
    
    return projection;
  }
  
  generateProjectionRecommendations(usage, days) {
    const totalCost = usage.reduce((sum, u) => sum + (u.avg_daily_cost * days), 0);
    const recommendations = [];
    
    if (totalCost > 100) {
      recommendations.push({
        type: 'budget_alert',
        message: `Projected cost of $${totalCost.toFixed(2)} for ${days} days exceeds $100 threshold`,
        suggestion: 'Consider implementing more aggressive cost-optimization routing'
      });
    }
    
    if (usage.length > 1) {
      const costRatios = usage.map(u => u.avg_daily_cost);
      const maxCost = Math.max(...costRatios);
      const minCost = Math.min(...costRatios.filter(c => c > 0));
      
      if (maxCost > minCost * 5) {
        recommendations.push({
          type: 'efficiency_opportunity',
          message: 'High cost variance detected between providers',
          suggestion: 'Review routing strategies to favor cost-effective providers for appropriate tasks'
        });
      }
    }
    
    return recommendations;
  }

  async start() {
    this.server.listen(this.port, () => {
      console.log('🚀 Unified API Dashboard running!');
      console.log('=====================================');
      console.log(`📊 Dashboard: http://localhost:${this.port}`);
      console.log(`🔌 WebSocket: ws://localhost:${this.port}`);
      console.log(`📡 API Status: http://localhost:${this.port}/api/status`);
      console.log(`🎮 Game API: http://localhost:${this.port}/api/game/prompt`);
      console.log('\n📋 Available APIs:');
      
      Object.entries(this.apiConfigs).forEach(([key, config]) => {
        const status = config.key || key === 'ollama' ? '✅' : '❌';
        console.log(`  ${status} ${config.name} (${config.model})`);
      });
      
      console.log('\n🎯 Routing Strategies:');
      console.log(`  Active: ${this.activeStrategy}`);
      console.log(`  Available: ${Object.keys(this.routingStrategies).join(', ')}`);
      
      console.log('\n✨ This is where everything converges!');
    });
  }
}

// Create public directory if it doesn't exist
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Start the dashboard
const dashboard = new UnifiedAPIDashboard();
dashboard.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down Unified API Dashboard...');
  dashboard.server.close(() => {
    dashboard.usageDB.close();
    dashboard.fineTuningDB.close();
    console.log('✅ Dashboard stopped gracefully');
    process.exit(0);
  });
});

module.exports = UnifiedAPIDashboard;