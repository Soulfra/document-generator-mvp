#!/usr/bin/env node

/**
 * Core Services Test Script
 * Tests all essential services to ensure they're working
 */

const http = require('http');
const https = require('https');

console.log('🧪 Testing Core Services...\n');

const services = [
  {
    name: 'Ollama Local AI',
    url: 'http://localhost:11434/api/tags',
    method: 'GET',
    critical: true
  },
  {
    name: 'Template Processor (MCP)',
    url: 'http://localhost:3000/health',
    method: 'GET',
    critical: true
  },
  {
    name: 'AI API Service',
    url: 'http://localhost:3001/health',
    method: 'GET',
    critical: true
  },
  {
    name: 'Cal-Compare Service',
    url: 'http://localhost:3001/api/cal-compare/consultations',
    method: 'GET',
    critical: false
  },
  {
    name: 'Document Generator',
    url: 'http://localhost:4000/health',
    method: 'GET',
    critical: false
  },
  {
    name: 'Platform Hub',
    url: 'http://localhost:8080',
    method: 'GET',
    critical: false
  }
];

async function testService(service) {
  return new Promise((resolve) => {
    const url = new URL(service.url);
    const protocol = url.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: service.method,
      timeout: 5000
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          service: service.name,
          status: 'online',
          code: res.statusCode,
          critical: service.critical
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        service: service.name,
        status: 'offline',
        error: err.code || err.message,
        critical: service.critical
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        service: service.name,
        status: 'timeout',
        error: 'Request timed out',
        critical: service.critical
      });
    });

    req.end();
  });
}

async function testOllamaModels() {
  console.log('📦 Checking Ollama Models...');
  
  try {
    const response = await new Promise((resolve, reject) => {
      http.get('http://localhost:11434/api/tags', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data)));
      }).on('error', reject);
    });

    if (response.models && response.models.length > 0) {
      console.log(`✅ Found ${response.models.length} Ollama models:`);
      response.models.forEach(model => {
        console.log(`   - ${model.name} (${(model.size / 1e9).toFixed(1)}GB)`);
      });
    } else {
      console.log('❌ No Ollama models found');
    }
  } catch (err) {
    console.log('❌ Could not check Ollama models:', err.message);
  }
  console.log('');
}

async function checkAPIKeys() {
  console.log('🔑 Checking API Keys Configuration...');
  
  const keys = {
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
    'ANTHROPIC_API_KEY': process.env.ANTHROPIC_API_KEY,
    'DEEPSEEK_API_KEY': process.env.DEEPSEEK_API_KEY
  };

  let hasAnyKey = false;
  Object.entries(keys).forEach(([name, value]) => {
    if (value && value !== '' && !value.includes('your-') && !value.includes('${')) {
      console.log(`✅ ${name}: Configured`);
      hasAnyKey = true;
    } else {
      console.log(`⚠️  ${name}: Not configured (using Ollama fallback)`);
    }
  });

  if (!hasAnyKey) {
    console.log('\n📝 Note: No cloud API keys found. System will use free Ollama models.');
    console.log('   See API_KEYS_SETUP.md for instructions to add cloud APIs.');
  }
  console.log('');
}

async function runTests() {
  // Check API keys
  await checkAPIKeys();

  // Test Ollama models
  await testOllamaModels();

  // Test all services
  console.log('🌐 Testing Service Endpoints...');
  const results = await Promise.all(services.map(testService));

  // Display results
  const online = results.filter(r => r.status === 'online');
  const offline = results.filter(r => r.status !== 'online');
  const criticalOffline = offline.filter(r => r.critical);

  console.log('\n📊 Test Results:');
  console.log(`✅ Online: ${online.length}/${services.length}`);
  
  online.forEach(r => {
    console.log(`   ✓ ${r.service} (HTTP ${r.code})`);
  });

  if (offline.length > 0) {
    console.log(`\n❌ Offline: ${offline.length}`);
    offline.forEach(r => {
      const marker = r.critical ? '🚨' : '⚠️';
      console.log(`   ${marker} ${r.service}: ${r.error}`);
    });
  }

  // Summary
  console.log('\n📋 Summary:');
  if (criticalOffline.length === 0) {
    console.log('✅ All critical services are operational!');
    console.log('🚀 System is ready for document processing.');
  } else {
    console.log('❌ Critical services are offline:');
    criticalOffline.forEach(r => {
      console.log(`   - ${r.service}`);
    });
    console.log('\n💡 To start services:');
    console.log('   npm start           # Start main services');
    console.log('   docker-compose up   # Start with Docker');
  }

  // Quick start commands
  console.log('\n🚀 Quick Start Commands:');
  console.log('1. Start Ollama (if not running):');
  console.log('   ollama serve');
  console.log('\n2. Start main services:');
  console.log('   cd /Users/matthewmauer/Desktop/Document-Generator');
  console.log('   npm start');
  console.log('\n3. Access the system:');
  console.log('   http://localhost:3000  - Template Processor');
  console.log('   http://localhost:3001  - AI API Service');
}

// Load environment variables
require('dotenv').config();

// Run tests
runTests().catch(console.error);