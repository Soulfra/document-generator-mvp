#!/usr/bin/env node

/**
 * UNIFIED API GATEWAY
 * Single endpoint that routes to all services
 * Aggregates data from multiple sources
 * Provides unified interface for all operations
 */

const express = require('express');
const axios = require('axios');
const EventEmitter = require('events');
const S3ServiceLayer = require('./s3-service-layer');

class UnifiedAPIGateway extends EventEmitter {
  constructor() {
    super();
    this.app = express();
    this.port = 8890;
    
    // Service registry - Updated with working services
    this.services = {
      templateProcessor: { url: 'http://localhost:3000', name: 'Template Processor', active: true },
      aiApi: { url: 'http://localhost:3001', name: 'CAL Compare AI API', active: true },
      analytics: { url: 'http://localhost:3002', name: 'Analytics Service', active: false },
      empireBridge: { url: 'http://localhost:3333', name: 'Empire Bridge', active: true },
      unifiedGateway: { url: 'http://localhost:4444', name: 'Unified Gateway', active: true },
      flaskBackend: { url: 'http://localhost:5000', name: 'Flask Backend', active: true },
      cryptoVault: { url: 'http://localhost:8888', name: 'Crypto Vault', active: true },
      masterController: { url: 'http://localhost:9999', name: 'Master Controller', active: true },
      aiDebugger: { url: 'http://localhost:9500', name: 'AI Debugging Dashboard', active: true },
      // Infrastructure services
      postgres: { url: 'http://localhost:5432', name: 'PostgreSQL Database', active: true },
      redis: { url: 'http://localhost:6379', name: 'Redis Cache', active: true },
      minio: { url: 'http://localhost:9000', name: 'MinIO Storage', active: true },
      ollama: { url: 'http://localhost:11434', name: 'Ollama Local AI', active: true }
    };
    
    // S3 integration
    this.s3Service = new S3ServiceLayer();
    
    // Request statistics
    this.stats = {
      totalRequests: 0,
      requestsByService: {},
      errors: 0,
      startTime: Date.now()
    };
    
    this.setupMiddleware();
    this.setupRoutes();
  }
  
  setupMiddleware() {
    // Increase payload limits for document processing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });
    
    // Request logging
    this.app.use((req, res, next) => {
      this.stats.totalRequests++;
      console.log(`📨 ${req.method} ${req.path}`);
      next();
    });
  }
  
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'unified-api-gateway',
        port: this.port,
        uptime: Date.now() - this.stats.startTime,
        stats: this.stats
      });
    });
    
    // Service status
    this.app.get('/api/services/status', async (req, res) => {
      const statuses = await this.checkAllServices();
      res.json({
        services: statuses,
        healthy: Object.values(statuses).filter(s => s.healthy).length,
        total: Object.keys(statuses).length
      });
    });
    
    // Character operations
    this.app.all('/api/characters/:character/:operation', async (req, res) => {
      try {
        const result = await this.routeToService('characterDB', req);
        res.json(result);
      } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
      }
    });
    
    // Reinforcement learning operations
    this.app.all('/api/rl/:operation', async (req, res) => {
      try {
        const result = await this.routeToService('carrotRL', req);
        res.json(result);
      } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
      }
    });
    
    // Learning chain operations
    this.app.all('/api/learning/:operation', async (req, res) => {
      try {
        const result = await this.routeToService('learningChain', req);
        res.json(result);
      } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
      }
    });
    
    // S3 storage operations
    this.app.post('/api/storage/upload', async (req, res) => {
      try {
        const { type, data, metadata } = req.body;
        let result;
        
        switch (type) {
          case 'character-operation':
            result = await this.s3Service.storeCharacterOperation(
              metadata.character,
              metadata.operation,
              data,
              metadata
            );
            break;
            
          case 'rl-data':
            result = await this.s3Service.storeRLData(
              metadata.dataType,
              data,
              metadata
            );
            break;
            
          case 'knowledge-graph':
            result = await this.s3Service.storeKnowledgeGraph(
              data,
              metadata.format || 'json',
              metadata
            );
            break;
            
          case 'system-snapshot':
            result = await this.s3Service.storeSystemSnapshot(data, metadata);
            break;
            
          default:
            throw new Error(`Unknown storage type: ${type}`);
        }
        
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // S3 retrieval
    this.app.get('/api/storage/:bucket/:key(*)', async (req, res) => {
      try {
        const { bucket, key } = req.params;
        const result = await this.s3Service.getObject(bucket, key);
        
        if (!result.success) {
          return res.status(404).json({ error: result.error });
        }
        
        res.type(result.contentType).send(result.body);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Storage statistics
    this.app.get('/api/storage/stats', async (req, res) => {
      try {
        const stats = await this.s3Service.getStorageStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Aggregate data from multiple services
    this.app.get('/api/aggregate/system-overview', async (req, res) => {
      try {
        const overview = await this.getSystemOverview();
        res.json(overview);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Aggregate learning progress
    this.app.get('/api/aggregate/learning-progress', async (req, res) => {
      try {
        const progress = await this.getLearningProgress();
        res.json(progress);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Dashboard endpoint
    this.app.get('/dashboard', (req, res) => {
      res.send(this.generateDashboardHTML());
    });
    
    // Catch-all proxy to services
    this.app.all('/api/proxy/:service/*', async (req, res) => {
      try {
        const { service } = req.params;
        const path = req.params[0];
        
        if (!this.services[service]) {
          return res.status(404).json({ error: `Service ${service} not found` });
        }
        
        const result = await this.proxyRequest(service, path, req);
        res.json(result);
      } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
      }
    });
  }
  
  async routeToService(serviceName, req) {
    const service = this.services[serviceName];
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    
    this.stats.requestsByService[serviceName] = (this.stats.requestsByService[serviceName] || 0) + 1;
    
    try {
      const url = `${service.url}${req.path}`;
      const response = await axios({
        method: req.method,
        url,
        data: req.body,
        params: req.query,
        headers: {
          'Content-Type': 'application/json',
          ...req.headers
        }
      });
      
      return response.data;
    } catch (error) {
      this.stats.errors++;
      if (error.response) {
        error.status = error.response.status;
        throw new Error(error.response.data.error || error.message);
      }
      throw error;
    }
  }
  
  async proxyRequest(serviceName, path, req) {
    const service = this.services[serviceName];
    const url = `${service.url}/${path}`;
    
    try {
      const response = await axios({
        method: req.method,
        url,
        data: req.body,
        params: req.query
      });
      
      return response.data;
    } catch (error) {
      if (error.response) {
        error.status = error.response.status;
        throw new Error(error.response.data.error || error.message);
      }
      throw error;
    }
  }
  
  async checkAllServices() {
    const statuses = {};
    
    for (const [name, service] of Object.entries(this.services)) {
      try {
        const response = await axios.get(`${service.url}/health`, { 
          timeout: 2000 
        });
        statuses[name] = {
          name: service.name,
          url: service.url,
          healthy: true,
          status: response.data
        };
      } catch (error) {
        statuses[name] = {
          name: service.name,
          url: service.url,
          healthy: false,
          error: error.message
        };
      }
    }
    
    return statuses;
  }
  
  async getSystemOverview() {
    const overview = {
      timestamp: new Date().toISOString(),
      services: {},
      storage: {},
      learning: {},
      characters: {}
    };
    
    // Get service statuses
    overview.services = await this.checkAllServices();
    
    // Get storage stats
    try {
      overview.storage = await this.s3Service.getStorageStats();
    } catch (error) {
      overview.storage = { error: error.message };
    }
    
    // Get learning metrics
    try {
      const rlResponse = await axios.get(`${this.services.carrotRL.url}/api/metrics`);
      overview.learning = rlResponse.data.metrics;
    } catch (error) {
      overview.learning = { error: error.message };
    }
    
    // Get character effectiveness
    try {
      const charResponse = await axios.get(`${this.services.characterDB.url}/api/characters/effectiveness`);
      overview.characters = charResponse.data;
    } catch (error) {
      overview.characters = { error: error.message };
    }
    
    return overview;
  }
  
  async getLearningProgress() {
    const progress = {
      timestamp: new Date().toISOString(),
      carrots: {},
      patterns: {},
      correlations: {},
      knowledge: {}
    };
    
    // Get carrot system metrics
    try {
      const carrotResponse = await axios.get(`${this.services.carrotRL.url}/api/status`);
      progress.carrots = carrotResponse.data;
    } catch (error) {
      progress.carrots = { error: error.message };
    }
    
    // Get learning chain correlations
    try {
      const chainResponse = await axios.get(`${this.services.learningChain.url}/api/status`);
      progress.correlations = chainResponse.data;
    } catch (error) {
      progress.correlations = { error: error.message };
    }
    
    // Get knowledge graph
    try {
      const graphResponse = await axios.get(`${this.services.carrotRL.url}/api/knowledge-graph`);
      progress.knowledge = graphResponse.data;
    } catch (error) {
      progress.knowledge = { error: error.message };
    }
    
    return progress;
  }
  
  generateDashboardHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Unified API Gateway Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; background: #1a1a1a; color: #fff; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: #2a2a2a; padding: 20px; border-radius: 8px; }
        .card h3 { color: #4a9eff; margin-top: 0; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        .healthy { background: #00ff00; color: #000; }
        .unhealthy { background: #ff0000; color: #fff; }
        .button { background: #4a9eff; color: #fff; border: none; padding: 10px 20px; 
                  border-radius: 4px; cursor: pointer; margin: 5px; }
        .button:hover { background: #357abd; }
        pre { background: #000; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌐 Unified API Gateway</h1>
            <p>Single endpoint for all services • Real-time monitoring • S3 integration</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>📊 Gateway Statistics</h3>
                <div class="metric">
                    <span>Total Requests:</span>
                    <span>${this.stats.totalRequests}</span>
                </div>
                <div class="metric">
                    <span>Errors:</span>
                    <span>${this.stats.errors}</span>
                </div>
                <div class="metric">
                    <span>Uptime:</span>
                    <span>${Math.floor((Date.now() - this.stats.startTime) / 1000)}s</span>
                </div>
            </div>
            
            <div class="card">
                <h3>🔌 Service Registry</h3>
                ${Object.entries(this.services).map(([key, service]) => `
                    <div class="metric">
                        <span>${service.name}:</span>
                        <span>${service.url}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="card">
                <h3>🎯 Quick Actions</h3>
                <button class="button" onclick="checkServices()">Check All Services</button>
                <button class="button" onclick="getSystemOverview()">System Overview</button>
                <button class="button" onclick="getLearningProgress()">Learning Progress</button>
                <button class="button" onclick="getStorageStats()">Storage Stats</button>
            </div>
            
            <div class="card">
                <h3>📡 API Endpoints</h3>
                <pre>
GET  /api/services/status
GET  /api/aggregate/system-overview
GET  /api/aggregate/learning-progress
POST /api/storage/upload
GET  /api/storage/:bucket/:key
GET  /api/storage/stats
ALL  /api/proxy/:service/*
                </pre>
            </div>
        </div>
        
        <div class="card" style="margin-top: 20px;">
            <h3>🖥️ Console Output</h3>
            <pre id="console" style="height: 300px; overflow-y: auto;"></pre>
        </div>
    </div>
    
    <script>
        const consoleEl = document.getElementById('console');
        
        function log(message) {
            const timestamp = new Date().toLocaleTimeString();
            consoleEl.innerHTML += \`[\${timestamp}] \${message}\\n\`;
            consoleEl.scrollTop = consoleEl.scrollHeight;
        }
        
        async function checkServices() {
            log('Checking all services...');
            try {
                const response = await fetch('/api/services/status');
                const data = await response.json();
                log(\`Services: \${data.healthy}/\${data.total} healthy\`);
                
                for (const [name, status] of Object.entries(data.services)) {
                    const icon = status.healthy ? '✅' : '❌';
                    log(\`  \${icon} \${status.name}: \${status.healthy ? 'OK' : status.error}\`);
                }
            } catch (error) {
                log('Error: ' + error.message);
            }
        }
        
        async function getSystemOverview() {
            log('Getting system overview...');
            try {
                const response = await fetch('/api/aggregate/system-overview');
                const data = await response.json();
                log('System Overview:');
                log('  Storage: ' + JSON.stringify(data.storage));
                log('  Learning: ' + JSON.stringify(data.learning));
                log('  Characters: ' + JSON.stringify(data.characters));
            } catch (error) {
                log('Error: ' + error.message);
            }
        }
        
        async function getLearningProgress() {
            log('Getting learning progress...');
            try {
                const response = await fetch('/api/aggregate/learning-progress');
                const data = await response.json();
                log('Learning Progress:');
                log('  Carrots: ' + (data.carrots.metrics?.totalCarrots || 'N/A'));
                log('  Patterns: ' + (data.patterns?.count || 'N/A'));
                log('  Knowledge Nodes: ' + (data.knowledge.nodes?.length || 'N/A'));
            } catch (error) {
                log('Error: ' + error.message);
            }
        }
        
        async function getStorageStats() {
            log('Getting storage statistics...');
            try {
                const response = await fetch('/api/storage/stats');
                const data = await response.json();
                log('Storage Statistics:');
                
                for (const [bucket, stats] of Object.entries(data)) {
                    if (stats.error) {
                        log(\`  \${bucket}: Error - \${stats.error}\`);
                    } else {
                        log(\`  \${bucket}: \${stats.objectCount} objects, \${stats.totalSizeMB} MB\`);
                    }
                }
            } catch (error) {
                log('Error: ' + error.message);
            }
        }
        
        // Initial check
        checkServices();
    </script>
</body>
</html>
    `;
  }
  
  async start() {
    const server = this.app.listen(this.port, () => {
      console.log(`
🌐 UNIFIED API GATEWAY STARTED! 🌐
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Gateway URL: http://localhost:${this.port}
📊 Dashboard: http://localhost:${this.port}/dashboard
🔌 Services: ${Object.keys(this.services).length} registered

API Endpoints:
  • /api/services/status - Check all service health
  • /api/aggregate/system-overview - Get full system overview
  • /api/aggregate/learning-progress - Get learning metrics
  • /api/storage/* - S3 storage operations
  • /api/proxy/:service/* - Proxy to any service

Ready to unify all operations!
      `);
    });
    
    return server;
  }
}

// Export
module.exports = UnifiedAPIGateway;

// Run if called directly
if (require.main === module) {
  const gateway = new UnifiedAPIGateway();
  gateway.start().catch(console.error);
}