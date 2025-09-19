#!/usr/bin/env node

/**
 * Master API Frogger Router
 * Like the thieving skill in RuneScape - we need to be stealthy and quick
 * Implements leapfrogging between API endpoints to avoid rate limits
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const Redis = require('ioredis');
const crypto = require('crypto');

// Initialize Redis for distributed state
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  keyPrefix: 'frogger:'
});

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'frogger-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'frogger-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class APIKeyring {
  constructor() {
    this.rings = new Map();
    this.currentRing = 0;
    this.initializeKeyrings();
  }

  initializeKeyrings() {
    // Multiple keyrings like lockpicking levels
    this.rings.set('bronze', {
      level: 1,
      endpoints: [
        { url: process.env.API_ENDPOINT_1, key: process.env.API_KEY_1, weight: 100 },
        { url: process.env.API_ENDPOINT_2, key: process.env.API_KEY_2, weight: 100 },
        { url: process.env.API_ENDPOINT_3, key: process.env.API_KEY_3, weight: 100 }
      ]
    });

    this.rings.set('iron', {
      level: 2,
      endpoints: [
        { url: process.env.BACKUP_API_1, key: process.env.BACKUP_KEY_1, weight: 80 },
        { url: process.env.BACKUP_API_2, key: process.env.BACKUP_KEY_2, weight: 80 }
      ]
    });

    this.rings.set('steel', {
      level: 3,
      endpoints: [
        { url: process.env.PREMIUM_API_1, key: process.env.PREMIUM_KEY_1, weight: 60 },
        { url: process.env.PREMIUM_API_2, key: process.env.PREMIUM_KEY_2, weight: 60 }
      ]
    });

    this.rings.set('mithril', {
      level: 4,
      endpoints: [
        { url: 'http://localhost:11434', key: 'local-ollama', weight: 120 } // Local always available
      ]
    });
  }

  async getNextEndpoint(requestHash) {
    // Check if this request has a preferred endpoint
    const cached = await redis.get(`route:${requestHash}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get all available endpoints
    const available = await this.getAvailableEndpoints();
    if (available.length === 0) {
      throw new Error('No available endpoints - all on cooldown');
    }

    // Select based on weight and availability
    const selected = this.weightedSelect(available);
    
    // Cache the selection for consistency
    await redis.setex(`route:${requestHash}`, 300, JSON.stringify(selected));
    
    return selected;
  }

  async getAvailableEndpoints() {
    const available = [];
    
    for (const [ringName, ring] of this.rings) {
      for (const endpoint of ring.endpoints) {
        const cooldown = await redis.get(`cooldown:${endpoint.url}`);
        if (!cooldown) {
          available.push({
            ...endpoint,
            ring: ringName,
            level: ring.level
          });
        }
      }
    }

    return available;
  }

  weightedSelect(endpoints) {
    const totalWeight = endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const endpoint of endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }
    
    return endpoints[0]; // Fallback
  }

  async markEndpointUsed(endpoint, success = true) {
    const key = `usage:${endpoint.url}`;
    const count = await redis.incr(key);
    
    // Set expiry for the counter
    if (count === 1) {
      await redis.expire(key, 60); // Reset counter every minute
    }

    // Check if we need to cooldown this endpoint
    const limit = endpoint.rateLimit || 50;
    if (count >= limit) {
      logger.warn(`Endpoint ${endpoint.url} hit rate limit, cooling down`);
      await redis.setex(`cooldown:${endpoint.url}`, 60, 'true');
    }

    // Track success rate
    if (!success) {
      await redis.incr(`failures:${endpoint.url}`);
    }
  }
}

class FroggerRouter {
  constructor() {
    this.keyring = new APIKeyring();
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Request parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      next();
    });

    // Request ID for tracking
    this.app.use((req, res, next) => {
      req.id = crypto.randomBytes(16).toString('hex');
      req.startTime = Date.now();
      next();
    });

    // Logging
    this.app.use((req, res, next) => {
      logger.info('Incoming request', {
        id: req.id,
        method: req.method,
        path: req.path,
        ip: req.ip
      });
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', async (req, res) => {
      const endpoints = await this.keyring.getAvailableEndpoints();
      res.json({
        status: 'healthy',
        availableEndpoints: endpoints.length,
        timestamp: new Date().toISOString()
      });
    });

    // Stats endpoint
    this.app.get('/stats', async (req, res) => {
      const stats = await this.getStats();
      res.json(stats);
    });

    // Main proxy route - the frogger leap
    this.app.all('/api/*', async (req, res, next) => {
      try {
        // Generate request hash for consistent routing
        const requestHash = crypto
          .createHash('sha256')
          .update(JSON.stringify({
            path: req.path,
            method: req.method,
            body: req.body
          }))
          .digest('hex');

        // Get next available endpoint
        const endpoint = await this.keyring.getNextEndpoint(requestHash);
        
        logger.info('Routing request', {
          id: req.id,
          endpoint: endpoint.url,
          ring: endpoint.ring
        });

        // Create proxy with dynamic target
        const proxy = createProxyMiddleware({
          target: endpoint.url,
          changeOrigin: true,
          pathRewrite: {
            '^/api': ''
          },
          onProxyReq: (proxyReq, req, res) => {
            // Add authentication
            if (endpoint.key && endpoint.key !== 'local-ollama') {
              proxyReq.setHeader('Authorization', `Bearer ${endpoint.key}`);
            }
            
            // Add tracking headers
            proxyReq.setHeader('X-Request-ID', req.id);
            proxyReq.setHeader('X-Forwarded-By', 'frogger-router');
          },
          onProxyRes: async (proxyRes, req, res) => {
            // Track response
            const success = proxyRes.statusCode < 400;
            await this.keyring.markEndpointUsed(endpoint, success);
            
            // Log response
            logger.info('Response received', {
              id: req.id,
              status: proxyRes.statusCode,
              endpoint: endpoint.url,
              duration: Date.now() - req.startTime
            });
          },
          onError: async (err, req, res) => {
            logger.error('Proxy error', {
              id: req.id,
              error: err.message,
              endpoint: endpoint.url
            });
            
            // Mark endpoint as failed
            await this.keyring.markEndpointUsed(endpoint, false);
            
            // Try next endpoint
            next();
          }
        });

        proxy(req, res, next);
      } catch (error) {
        logger.error('Router error', {
          id: req.id,
          error: error.message
        });
        
        res.status(503).json({
          error: 'Service temporarily unavailable',
          message: 'All endpoints are currently at capacity',
          retryAfter: 60
        });
      }
    });

    // Fallback error handler
    this.app.use((err, req, res, next) => {
      logger.error('Unhandled error', {
        id: req.id,
        error: err.message,
        stack: err.stack
      });
      
      res.status(500).json({
        error: 'Internal server error',
        id: req.id
      });
    });
  }

  async getStats() {
    const keys = await redis.keys('*');
    const stats = {
      endpoints: {},
      totalRequests: 0,
      totalFailures: 0
    };

    for (const key of keys) {
      if (key.startsWith('frogger:usage:')) {
        const endpoint = key.replace('frogger:usage:', '');
        const count = await redis.get(key);
        stats.endpoints[endpoint] = {
          requests: parseInt(count),
          failures: 0
        };
        stats.totalRequests += parseInt(count);
      } else if (key.startsWith('frogger:failures:')) {
        const endpoint = key.replace('frogger:failures:', '');
        const count = await redis.get(key);
        if (!stats.endpoints[endpoint]) {
          stats.endpoints[endpoint] = { requests: 0, failures: 0 };
        }
        stats.endpoints[endpoint].failures = parseInt(count);
        stats.totalFailures += parseInt(count);
      }
    }

    return stats;
  }

  start(port = 3456) {
    this.app.listen(port, () => {
      logger.info(`Frogger Router started on port ${port}`);
      logger.info('Ready to leap between API endpoints!');
    });
  }
}

// Circuit breaker pattern for resilience
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failures = new Map();
    this.states = new Map(); // 'closed', 'open', 'half-open'
  }

  async call(endpoint, fn) {
    const state = this.states.get(endpoint) || 'closed';
    
    if (state === 'open') {
      const lastFailure = this.failures.get(endpoint).lastFailure;
      if (Date.now() - lastFailure > this.timeout) {
        this.states.set(endpoint, 'half-open');
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();
      
      if (state === 'half-open') {
        this.states.set(endpoint, 'closed');
        this.failures.delete(endpoint);
      }
      
      return result;
    } catch (error) {
      this.recordFailure(endpoint);
      throw error;
    }
  }

  recordFailure(endpoint) {
    const failures = this.failures.get(endpoint) || { count: 0, lastFailure: 0 };
    failures.count++;
    failures.lastFailure = Date.now();
    this.failures.set(endpoint, failures);

    if (failures.count >= this.threshold) {
      this.states.set(endpoint, 'open');
      logger.warn(`Circuit breaker opened for ${endpoint}`);
    }
  }
}

// Start the router
if (require.main === module) {
  const router = new FroggerRouter();
  router.start(process.env.FROGGER_PORT || 3456);
}

module.exports = { FroggerRouter, APIKeyring, CircuitBreaker };