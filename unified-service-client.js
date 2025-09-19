#!/usr/bin/env node

/**
 * 🔗 UNIFIED SERVICE CLIENT
 * 
 * Centralized client for connecting agentic browser to all running services:
 * - CalCompare Consultation Hub (port 3001)
 * - Template Processor (port 3000) 
 * - Platform Hub (port 8080)
 * - WebSocket real-time updates (port 8081)
 * - PostgreSQL database (port 5432)
 * - Redis cache (port 6379)
 */

const { EventEmitter } = require('events');
const axios = require('axios');
const WebSocket = require('ws');
const winston = require('winston');
const APIKeyMiddleware = require('./api-key-middleware');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/unified-service-client.log' })
  ]
});

class UnifiedServiceClient extends EventEmitter {
  constructor() {
    super();
    
    this.services = {
      calCompare: {
        name: 'CalCompare Consultation Hub',
        url: 'http://localhost:3001',
        endpoints: {
          consult: '/api/cal-compare/consult',
          consultations: '/api/cal-compare/consultations',
          history: '/api/cal-compare/history',
          stats: '/api/cal-compare/stats',
          billing: '/api/cal-compare/billing'
        },
        status: 'unknown'
      },
      templateProcessor: {
        name: 'Template Processor',
        url: 'http://localhost:3000',
        endpoints: {
          health: '/health',
          templates: '/templates',
          process: '/api/process'
        },
        status: 'unknown'
      },
      platformHub: {
        name: 'Platform Hub',
        url: 'http://localhost:8080',
        endpoints: {
          health: '/health',
          status: '/api/status'
        },
        status: 'unknown'
      },
      webSocket: {
        name: 'WebSocket Server',
        url: 'ws://localhost:8081',
        connection: null,
        status: 'unknown'
      },
      postgres: {
        name: 'PostgreSQL Database',
        host: 'localhost',
        port: 5432,
        status: 'unknown'
      },
      redis: {
        name: 'Redis Cache',
        host: 'localhost',
        port: 6379,
        status: 'unknown'
      }
    };
    
    this.initialized = false;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
    
    // API key middleware for centralized provider management
    this.apiKeyMiddleware = null;
    
    // Cache for consultation history and frequently used data
    this.cache = new Map();
    this.cacheExpiry = new Map();
    
    logger.info('🔗 Unified Service Client initialized');
  }

  async initialize() {
    logger.info('🚀 Initializing connections to all services...');
    
    try {
      // Initialize API key middleware first
      this.apiKeyMiddleware = new APIKeyMiddleware();
      await this.apiKeyMiddleware.initialize();
      
      // Setup API middleware event handlers
      this.setupAPIMiddlewareEvents();
      
      // Discover and connect to all services
      await this.discoverServices();
      
      // Initialize WebSocket connection
      await this.initializeWebSocket();
      
      // Setup health monitoring
      this.startHealthMonitoring();
      
      this.initialized = true;
      this.emit('ready');
      
      logger.info('✅ All service connections established');
      
    } catch (error) {
      logger.error('❌ Service initialization failed:', error);
      throw error;
    }
  }

  setupAPIMiddlewareEvents() {
    if (!this.apiKeyMiddleware) return;
    
    this.apiKeyMiddleware.on('usage-update', (usage) => {
      logger.info(`💰 API usage: ${usage.provider} - $${usage.cost.toFixed(4)}`);
      this.emit('api-usage', usage);
    });
    
    this.apiKeyMiddleware.on('limit-warning', (warning) => {
      logger.warn(`⚠️ API limit warning: ${warning.provider} ${warning.type} usage at ${warning.percentage.toFixed(1)}%`);
      this.emit('api-limit-warning', warning);
    });
    
    this.apiKeyMiddleware.on('monthly-reset', () => {
      logger.info('🔄 Monthly API usage reset');
      this.emit('api-monthly-reset');
    });
  }

  async discoverServices() {
    const promises = Object.entries(this.services).map(async ([key, service]) => {
      if (key === 'webSocket' || key === 'postgres' || key === 'redis') {
        return; // Handle these separately
      }
      
      try {
        const healthUrl = service.endpoints?.health || '/health';
        const response = await axios.get(`${service.url}${healthUrl}`, {
          timeout: 5000
        });
        
        service.status = 'online';
        service.info = response.data;
        
        logger.info(`✅ ${service.name} connected at ${service.url}`);
        
      } catch (error) {
        service.status = 'offline';
        service.error = error.message;
        
        logger.warn(`⚠️ ${service.name} unavailable at ${service.url}`);
      }
    });
    
    await Promise.all(promises);
  }

  async initializeWebSocket() {
    try {
      const ws = new WebSocket(this.services.webSocket.url);
      
      ws.on('open', () => {
        this.services.webSocket.status = 'online';
        this.services.webSocket.connection = ws;
        logger.info('✅ WebSocket connection established');
        
        // Subscribe to relevant channels
        ws.send(JSON.stringify({
          type: 'subscribe',
          channels: ['consultations', 'browser-sessions', 'ai-responses']
        }));
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          logger.error('WebSocket message parsing error:', error);
        }
      });
      
      ws.on('error', (error) => {
        this.services.webSocket.status = 'error';
        logger.error('WebSocket error:', error);
      });
      
      ws.on('close', () => {
        this.services.webSocket.status = 'offline';
        logger.warn('WebSocket connection closed');
        
        // Attempt reconnection after delay
        setTimeout(() => this.initializeWebSocket(), 10000);
      });
      
    } catch (error) {
      this.services.webSocket.status = 'offline';
      logger.error('WebSocket initialization failed:', error);
    }
  }

  handleWebSocketMessage(message) {
    // Forward real-time updates to agentic browser
    this.emit('realtime-update', message);
    
    switch (message.type) {
      case 'consultation-complete':
        this.emit('consultation-complete', message.data);
        break;
      case 'ai-response':
        this.emit('ai-response', message.data);
        break;
      case 'browser-insight':
        this.emit('browser-insight', message.data);
        break;
      default:
        logger.debug('Unknown WebSocket message type:', message.type);
    }
  }

  // CalCompare API Methods with Smart Provider Routing
  async consultExperts(query, consultationType = 'general', options = {}) {
    try {
      // Use API middleware for smart provider selection if available
      if (this.apiKeyMiddleware) {
        return await this.consultWithSmartRouting(query, consultationType, options);
      }
      
      // Fallback to direct CalCompare call
      return await this.consultDirect(query, consultationType, options);
      
    } catch (error) {
      logger.error('❌ Expert consultation failed:', error);
      throw error;
    }
  }

  async consultWithSmartRouting(query, consultationType, options = {}) {
    const taskType = this.mapConsultationToTaskType(consultationType);
    
    logger.info('🎯 Smart routing consultation', {
      consultationType,
      taskType,
      query: query.substring(0, 100)
    });
    
    try {
      // Route through API middleware for optimal provider selection
      const result = await this.apiKeyMiddleware.routeRequest(query, taskType, {
        maxCost: options.maxCost || 10, // $10 max per request
        userId: options.userId || 'agentic-browser',
        sessionId: options.sessionId,
        priority: options.priority || 'normal'
      });
      
      // Format as consultation response
      const consultation = {
        id: result.requestId,
        consultation_type: consultationType,
        query,
        expert_responses: [{
          expert: result.provider,
          response: result.result,
          provider_key: result.providerKey,
          tokens_used: result.tokensUsed,
          cost: result.cost,
          duration: result.duration
        }],
        summary: result.result.substring(0, 200) + '...',
        routing: {
          selectedProvider: result.provider,
          taskType,
          cost: result.cost,
          tokensUsed: result.tokensUsed
        },
        timestamp: Date.now()
      };
      
      // Cache the result
      this.cacheConsultation(consultation.id, consultation);
      
      logger.info('✅ Smart routing consultation completed', {
        id: consultation.id,
        provider: result.provider,
        cost: result.cost,
        tokens: result.tokensUsed
      });
      
      return consultation;
      
    } catch (error) {
      logger.warn('⚠️ Smart routing failed, falling back to direct CalCompare:', error.message);
      return await this.consultDirect(query, consultationType, options);
    }
  }

  async consultDirect(query, consultationType, options = {}) {
    const service = this.services.calCompare;
    
    if (service.status !== 'online') {
      throw new Error('CalCompare service not available');
    }
    
    const requestData = {
      query,
      consultation_type: consultationType,
      user_id: options.userId || 'agentic-browser',
      session_id: options.sessionId,
      priority: options.priority || 'normal',
      ...options
    };
    
    logger.info('🧠 Direct CalCompare consultation', { 
      type: consultationType, 
      query: query.substring(0, 100) 
    });
    
    const response = await axios.post(
      `${service.url}${service.endpoints.consult}`,
      requestData,
      { timeout: 30000 }
    );
    
    if (response.data.success) {
      const consultation = response.data.consultation;
      
      // Cache the result
      this.cacheConsultation(consultation.id, consultation);
      
      logger.info('✅ Direct consultation completed', {
        id: consultation.id,
        experts: consultation.expert_responses?.length || 0
      });
      
      return consultation;
    } else {
      throw new Error(response.data.error || 'Consultation failed');
    }
  }

  mapConsultationToTaskType(consultationType) {
    const mapping = {
      'code-review': 'code',
      'business-strategy': 'research',
      'technical-architecture': 'architecture',
      'investment-analysis': 'research',
      'general': 'general'
    };
    
    return mapping[consultationType] || 'general';
  }

  async getConsultationHistory(userId = 'agentic-browser', limit = 10) {
    try {
      const service = this.services.calCompare;
      
      if (service.status !== 'online') {
        return []; // Return empty array if service unavailable
      }
      
      const response = await axios.get(
        `${service.url}${service.endpoints.history}/${userId}?limit=${limit}`
      );
      
      return response.data.consultations || [];
      
    } catch (error) {
      logger.error('❌ Failed to get consultation history:', error);
      return [];
    }
  }

  async getSystemStats() {
    try {
      const promises = Object.entries(this.services).map(async ([key, service]) => {
        if (service.status !== 'online' || !service.endpoints?.stats) {
          return [key, { status: service.status, error: service.error }];
        }
        
        try {
          const response = await axios.get(`${service.url}${service.endpoints.stats}`);
          return [key, { status: 'online', data: response.data }];
        } catch (error) {
          return [key, { status: 'error', error: error.message }];
        }
      });
      
      const results = await Promise.all(promises);
      return Object.fromEntries(results);
      
    } catch (error) {
      logger.error('❌ Failed to get system stats:', error);
      return {};
    }
  }

  // Smart routing based on query analysis
  async smartConsult(query, context = {}) {
    try {
      // Analyze query to determine best consultation type
      const consultationType = this.analyzeQueryType(query, context);
      
      logger.info('🎯 Smart routing consultation', { 
        type: consultationType,
        query: query.substring(0, 50)
      });
      
      // Route to appropriate consultation
      const consultation = await this.consultExperts(query, consultationType, {
        sessionId: context.sessionId,
        userId: context.userId,
        priority: context.priority || 'normal'
      });
      
      // Add context to consultation result
      consultation.routing = {
        determinedType: consultationType,
        confidence: this.getRoutingConfidence(query, consultationType),
        alternatives: this.getAlternativeTypes(query)
      };
      
      return consultation;
      
    } catch (error) {
      logger.error('❌ Smart consultation failed:', error);
      throw error;
    }
  }

  analyzeQueryType(query, context = {}) {
    const lowerQuery = query.toLowerCase();
    
    // Business strategy keywords
    if (lowerQuery.match(/\b(business|strategy|market|revenue|growth|competition)\b/)) {
      return 'business-strategy';
    }
    
    // Technical architecture keywords
    if (lowerQuery.match(/\b(architecture|system|design|technical|infrastructure|scalability)\b/)) {
      return 'technical-architecture';
    }
    
    // Code review keywords
    if (lowerQuery.match(/\b(code|review|bug|function|class|algorithm|optimization)\b/)) {
      return 'code-review';
    }
    
    // Investment analysis keywords
    if (lowerQuery.match(/\b(investment|financial|roi|cost|budget|funding)\b/)) {
      return 'investment-analysis';
    }
    
    // Default to general consultation
    return 'general';
  }

  getRoutingConfidence(query, type) {
    // Simple confidence scoring based on keyword matches
    const keywords = {
      'business-strategy': ['business', 'strategy', 'market', 'revenue', 'growth'],
      'technical-architecture': ['architecture', 'system', 'design', 'technical'],
      'code-review': ['code', 'review', 'bug', 'function', 'algorithm'],
      'investment-analysis': ['investment', 'financial', 'roi', 'cost', 'budget']
    };
    
    const typeKeywords = keywords[type] || [];
    const lowerQuery = query.toLowerCase();
    const matches = typeKeywords.filter(keyword => lowerQuery.includes(keyword));
    
    return Math.min(matches.length / typeKeywords.length, 1.0);
  }

  getAlternativeTypes(query) {
    const allTypes = ['business-strategy', 'technical-architecture', 'code-review', 'investment-analysis', 'general'];
    const primaryType = this.analyzeQueryType(query);
    
    return allTypes
      .filter(type => type !== primaryType)
      .map(type => ({
        type,
        confidence: this.getRoutingConfidence(query, type)
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 2);
  }

  // Cache management
  cacheConsultation(id, consultation) {
    this.cache.set(`consultation:${id}`, consultation);
    this.cacheExpiry.set(`consultation:${id}`, Date.now() + (60 * 60 * 1000)); // 1 hour
  }

  getCachedConsultation(id) {
    const key = `consultation:${id}`;
    const expiry = this.cacheExpiry.get(key);
    
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  // Health monitoring
  startHealthMonitoring() {
    setInterval(async () => {
      await this.checkServiceHealth();
    }, 30000); // Check every 30 seconds
  }

  async checkServiceHealth() {
    for (const [key, service] of Object.entries(this.services)) {
      if (key === 'webSocket' || key === 'postgres' || key === 'redis') {
        continue; // Skip these for now
      }
      
      try {
        const healthUrl = service.endpoints?.health || '/health';
        await axios.get(`${service.url}${healthUrl}`, { timeout: 3000 });
        
        if (service.status !== 'online') {
          service.status = 'online';
          this.emit('service-restored', { service: key, name: service.name });
          logger.info(`🔄 ${service.name} restored`);
        }
        
      } catch (error) {
        if (service.status === 'online') {
          service.status = 'offline';
          service.error = error.message;
          this.emit('service-down', { service: key, name: service.name, error: error.message });
          logger.warn(`⚠️ ${service.name} went offline: ${error.message}`);
        }
      }
    }
  }

  // Send real-time updates via WebSocket
  sendRealtimeUpdate(type, data) {
    if (this.services.webSocket.connection?.readyState === WebSocket.OPEN) {
      this.services.webSocket.connection.send(JSON.stringify({
        type,
        data,
        timestamp: Date.now(),
        source: 'agentic-browser'
      }));
    }
  }

  // Get service status summary
  getServiceStatus() {
    const status = {};
    
    for (const [key, service] of Object.entries(this.services)) {
      status[key] = {
        name: service.name,
        status: service.status,
        url: service.url || `${service.host}:${service.port}`,
        error: service.error,
        info: service.info
      };
    }
    
    // Add API provider status
    if (this.apiKeyMiddleware) {
      status.apiProviders = this.apiKeyMiddleware.getProviderStatus();
    }
    
    return status;
  }

  // Get comprehensive system stats including API usage
  async getSystemStats() {
    try {
      const serviceStats = await super.getSystemStats ? super.getSystemStats() : {};
      
      // Add API usage statistics
      if (this.apiKeyMiddleware) {
        serviceStats.apiUsage = this.apiKeyMiddleware.getProviderStatus();
      }
      
      return serviceStats;
      
    } catch (error) {
      logger.error('❌ Failed to get system stats:', error);
      return {};
    }
  }

  async cleanup() {
    logger.info('🧹 Cleaning up service connections...');
    
    if (this.services.webSocket.connection) {
      this.services.webSocket.connection.close();
    }
    
    // Clear cache
    this.cache.clear();
    this.cacheExpiry.clear();
    
    logger.info('✅ Service cleanup complete');
  }
}

module.exports = UnifiedServiceClient;

// Start standalone if called directly
if (require.main === module) {
  const client = new UnifiedServiceClient();
  
  client.on('ready', () => {
    console.log('🚀 Unified Service Client is ready!');
    console.log(JSON.stringify(client.getServiceStatus(), null, 2));
  });
  
  client.on('service-down', ({ service, name, error }) => {
    console.log(`⚠️ Service down: ${name} (${error})`);
  });
  
  client.on('service-restored', ({ service, name }) => {
    console.log(`🔄 Service restored: ${name}`);
  });
  
  client.initialize().catch(error => {
    console.error('❌ Failed to initialize service client:', error);
    process.exit(1);
  });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\\n🛑 Shutting down...');
    await client.cleanup();
    process.exit(0);
  });
}