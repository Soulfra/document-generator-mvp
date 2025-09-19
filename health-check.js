#!/usr/bin/env node

/**
 * 🏥 Comprehensive Health Check Script
 * Verifies all system components are working properly
 */

const axios = require('axios');
const { Client } = require('pg');
const redis = require('redis');
const fs = require('fs').promises;
const path = require('path');
const networkResolver = require('./config/network-resolver');

// Service configurations
const SERVICES = {
  infrastructure: {
    postgres: { port: 5432, critical: true },
    redis: { port: 6379, critical: true },
    ollama: { port: 11434, critical: true },
    minio: { port: 9000, critical: false }
  },
  core: {
    'template-processor': { port: 3000, critical: false },
    'ai-api': { port: 3001, critical: false },
    'analytics': { port: 3002, critical: false }
  },
  platform: {
    'platform-hub': { port: 8080, critical: false },
    'websocket': { port: 8081, critical: false }
  }
};

class HealthChecker {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: { total: 0, healthy: 0, unhealthy: 0, critical: 0 },
      services: {},
      recommendations: []
    };
  }

  async checkAll() {
    console.log('🏥 COMPREHENSIVE HEALTH CHECK');
    console.log('============================\n');

    // Check infrastructure
    await this.checkInfrastructure();
    
    // Check core services
    await this.checkCoreServices();
    
    // Check Ollama models
    await this.checkOllamaModels();
    
    // Check file system
    await this.checkFileSystem();
    
    // Check environment
    await this.checkEnvironment();
    
    // Generate report
    this.generateReport();
  }

  async checkInfrastructure() {
    console.log('🔧 Checking Infrastructure Services...\n');
    
    for (const [name, config] of Object.entries(SERVICES.infrastructure)) {
      const result = await this.checkService(name, config);
      this.results.services[name] = result;
      
      if (config.critical && !result.healthy) {
        this.results.recommendations.push({
          type: 'critical',
          service: name,
          action: this.getRecommendation(name)
        });
      }
    }
  }

  async checkCoreServices() {
    console.log('\n📦 Checking Core Services...\n');
    
    for (const [name, config] of Object.entries(SERVICES.core)) {
      const result = await this.checkService(name, config);
      this.results.services[name] = result;
    }
  }

  async checkService(name, config) {
    this.results.summary.total++;
    
    try {
      const url = networkResolver.resolve(name, config.port);
      let healthy = false;
      let details = {};
      
      if (name === 'postgres') {
        // Special handling for PostgreSQL
        const client = new Client({ connectionString: url });
        await client.connect();
        const result = await client.query('SELECT version()');
        await client.end();
        
        healthy = true;
        details = { version: result.rows[0].version };
        
      } else if (name === 'redis') {
        // Special handling for Redis
        const client = redis.createClient({ url });
        await client.connect();
        const info = await client.info();
        await client.quit();
        
        healthy = true;
        details = { version: info.match(/redis_version:([^\r\n]+)/)?.[1] };
        
      } else if (name === 'ollama') {
        // Special handling for Ollama
        const response = await axios.get(`${url}/api/tags`, { timeout: 5000 });
        healthy = true;
        details = { models: response.data.models?.length || 0 };
        
      } else {
        // HTTP health check for other services
        const healthUrl = `${url}/health`;
        const response = await axios.get(healthUrl, { timeout: 5000 });
        healthy = response.status === 200;
        details = response.data;
      }
      
      if (healthy) {
        this.results.summary.healthy++;
        console.log(`✅ ${name}: HEALTHY (${url})`);
        if (Object.keys(details).length > 0) {
          console.log(`   Details: ${JSON.stringify(details)}`);
        }
      }
      
      return { healthy, url, details, critical: config.critical };
      
    } catch (error) {
      this.results.summary.unhealthy++;
      if (config.critical) {
        this.results.summary.critical++;
      }
      
      console.log(`❌ ${name}: UNHEALTHY`);
      console.log(`   Error: ${error.message}`);
      
      return { 
        healthy: false, 
        error: error.message,
        critical: config.critical
      };
    }
  }

  async checkOllamaModels() {
    console.log('\n🤖 Checking Ollama Models...\n');
    
    try {
      const url = networkResolver.resolve('ollama', 11434);
      const response = await axios.get(`${url}/api/tags`);
      const models = response.data.models || [];
      
      console.log(`Found ${models.length} models:`);
      models.forEach(model => {
        const size = (model.size / 1e9).toFixed(2);
        console.log(`  - ${model.name} (${size} GB)`);
      });
      
      // Check for recommended models
      const recommended = ['codellama:7b', 'mistral:7b', 'llama3:8b'];
      const missing = recommended.filter(m => !models.some(model => model.name.includes(m.split(':')[0])));
      
      if (missing.length > 0) {
        console.log('\n⚠️  Missing recommended models:');
        missing.forEach(model => {
          console.log(`  - ${model}`);
        });
        
        this.results.recommendations.push({
          type: 'enhancement',
          service: 'ollama',
          action: `Install recommended models: ${missing.join(', ')}`
        });
      }
      
    } catch (error) {
      console.log('❌ Could not check Ollama models:', error.message);
    }
  }

  async checkFileSystem() {
    console.log('\n📁 Checking File System...\n');
    
    const checks = [
      { path: '.env', type: 'file', required: true },
      { path: 'config/services.js', type: 'file', required: true },
      { path: 'docker-compose.yml', type: 'file', required: false },
      { path: 'uploads', type: 'directory', required: false },
      { path: 'data', type: 'directory', required: false }
    ];
    
    for (const check of checks) {
      try {
        const stats = await fs.stat(check.path);
        const exists = check.type === 'file' ? stats.isFile() : stats.isDirectory();
        
        if (exists) {
          console.log(`✅ ${check.path}: EXISTS`);
        } else {
          console.log(`❌ ${check.path}: WRONG TYPE`);
        }
      } catch (error) {
        if (check.required) {
          console.log(`❌ ${check.path}: MISSING (required)`);
          this.results.recommendations.push({
            type: 'setup',
            action: `Create required ${check.type}: ${check.path}`
          });
        } else {
          console.log(`⚠️  ${check.path}: MISSING (optional)`);
        }
      }
    }
  }

  async checkEnvironment() {
    console.log('\n🔐 Checking Environment Variables...\n');
    
    const envVars = {
      required: ['DATABASE_URL', 'REDIS_URL'],
      optional: ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'OLLAMA_URL']
    };
    
    // Check required vars
    for (const varName of envVars.required) {
      if (process.env[varName]) {
        console.log(`✅ ${varName}: SET`);
      } else {
        console.log(`❌ ${varName}: MISSING`);
        this.results.recommendations.push({
          type: 'configuration',
          action: `Set required environment variable: ${varName}`
        });
      }
    }
    
    // Check optional vars
    console.log('\nOptional:');
    for (const varName of envVars.optional) {
      if (process.env[varName]) {
        console.log(`✅ ${varName}: SET`);
      } else {
        console.log(`⚠️  ${varName}: NOT SET`);
      }
    }
    
    // Check for API keys
    const hasAnyApiKey = envVars.optional.some(v => v.includes('API_KEY') && process.env[v]);
    if (!hasAnyApiKey) {
      this.results.recommendations.push({
        type: 'enhancement',
        action: 'Add at least one AI API key for cloud fallback'
      });
    }
  }

  getRecommendation(service) {
    const recommendations = {
      postgres: 'Start PostgreSQL: docker-compose up -d postgres',
      redis: 'Start Redis: docker-compose up -d redis',
      ollama: 'Start Ollama: ollama serve',
      minio: 'Start MinIO: docker-compose up -d minio'
    };
    
    return recommendations[service] || `Start ${service} service`;
  }

  generateReport() {
    console.log('\n📊 HEALTH CHECK SUMMARY');
    console.log('======================\n');
    
    const { summary } = this.results;
    const healthPercentage = ((summary.healthy / summary.total) * 100).toFixed(1);
    
    console.log(`Total Services: ${summary.total}`);
    console.log(`Healthy: ${summary.healthy} ✅`);
    console.log(`Unhealthy: ${summary.unhealthy} ❌`);
    console.log(`Critical Issues: ${summary.critical} 🚨`);
    console.log(`Health Score: ${healthPercentage}%`);
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS');
      console.log('==================\n');
      
      this.results.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. [${rec.type.toUpperCase()}] ${rec.action}`);
      });
    }
    
    // Save report
    const reportPath = path.join(__dirname, 'health-check-report.json');
    fs.writeFile(reportPath, JSON.stringify(this.results, null, 2))
      .then(() => console.log(`\n💾 Full report saved to: ${reportPath}`))
      .catch(console.error);
    
    // Overall status
    console.log('\n🏁 OVERALL STATUS');
    console.log('=================\n');
    
    if (summary.critical > 0) {
      console.log('❌ SYSTEM UNHEALTHY - Critical services are down');
      process.exit(1);
    } else if (healthPercentage >= 80) {
      console.log('✅ SYSTEM HEALTHY - All critical services operational');
      process.exit(0);
    } else {
      console.log('⚠️  SYSTEM DEGRADED - Some services unavailable');
      process.exit(0);
    }
  }
}

// Load environment variables
require('dotenv').config();

// Run health check
const checker = new HealthChecker();
checker.checkAll().catch(error => {
  console.error('Health check failed:', error);
  process.exit(1);
});