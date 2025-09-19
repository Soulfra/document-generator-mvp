#!/usr/bin/env node

/**
 * Frogger System Test Suite
 * Tests the complete API leapfrogging system
 */

const { FroggerRouter, APIKeyring } = require('./master-api-frogger-router');
const KeyringManager = require('./keyring-manager');
const { FailSafeRecoverySystem } = require('./fail-safe-recovery-system');
const { ConnectionMapper } = require('./connection-mapper-load-balancer');
const express = require('express');
const axios = require('axios');

class FroggerTestSuite {
  constructor() {
    this.testResults = [];
    this.mockServers = [];
  }

  async setup() {
    console.log('🐸 Setting up Frogger test environment...\n');
    
    // Create mock API servers
    await this.createMockServers();
    
    // Setup keyring with test keys
    await this.setupTestKeyrings();
    
    // Initialize systems
    this.froggerRouter = new FroggerRouter();
    this.connectionMapper = new ConnectionMapper();
    this.failSafeSystem = new FailSafeRecoverySystem();
    
    await this.connectionMapper.initialize();
  }

  async createMockServers() {
    const configs = [
      { port: 4001, rateLimit: 5, name: 'bronze-1' },
      { port: 4002, rateLimit: 5, name: 'bronze-2' },
      { port: 4003, rateLimit: 3, name: 'iron-1' },
      { port: 4004, rateLimit: 10, name: 'steel-1' }
    ];
    
    for (const config of configs) {
      const server = await this.createMockServer(config);
      this.mockServers.push(server);
    }
  }

  createMockServer(config) {
    return new Promise((resolve) => {
      const app = express();
      let requestCount = 0;
      let resetTime = Date.now() + 60000;
      
      app.use(express.json());
      
      // Rate limiting
      app.use((req, res, next) => {
        if (Date.now() > resetTime) {
          requestCount = 0;
          resetTime = Date.now() + 60000;
        }
        
        requestCount++;
        
        if (requestCount > config.rateLimit) {
          return res.status(429).json({
            error: 'Rate limit exceeded',
            limit: config.rateLimit,
            reset: resetTime
          });
        }
        
        next();
      });
      
      // Mock endpoints
      app.get('/health', (req, res) => {
        res.json({ 
          status: 'healthy', 
          server: config.name,
          requests: requestCount,
          limit: config.rateLimit
        });
      });
      
      app.post('/api/generate', (req, res) => {
        // Simulate processing delay
        setTimeout(() => {
          res.json({
            server: config.name,
            response: `Generated from ${config.name}`,
            timestamp: new Date().toISOString()
          });
        }, Math.random() * 100 + 50);
      });
      
      app.get('/api/status', (req, res) => {
        res.json({
          server: config.name,
          uptime: process.uptime(),
          requests: requestCount,
          rateLimit: config.rateLimit,
          remaining: Math.max(0, config.rateLimit - requestCount)
        });
      });
      
      const server = app.listen(config.port, () => {
        console.log(`Mock server ${config.name} running on port ${config.port}`);
        resolve({ app, server, config });
      });
    });
  }

  async setupTestKeyrings() {
    // Set test environment variables
    process.env.API_ENDPOINT_1 = 'http://localhost:4001';
    process.env.API_KEY_1 = 'test-key-bronze-1';
    process.env.API_ENDPOINT_2 = 'http://localhost:4002';
    process.env.API_KEY_2 = 'test-key-bronze-2';
    process.env.BACKUP_API_1 = 'http://localhost:4003';
    process.env.BACKUP_KEY_1 = 'test-key-iron-1';
    process.env.PREMIUM_API_1 = 'http://localhost:4004';
    process.env.PREMIUM_KEY_1 = 'test-key-steel-1';
  }

  async runTests() {
    console.log('\n🧪 Running Frogger tests...\n');
    
    await this.testBasicRouting();
    await this.testRateLimitHandling();
    await this.testFailoverBehavior();
    await this.testLoadBalancing();
    await this.testRecoveryMechanisms();
    await this.testKeyringRotation();
    
    this.printResults();
  }

  async testBasicRouting() {
    console.log('📍 Testing basic routing...');
    
    try {
      // Start frogger router
      const frogger = this.froggerRouter;
      frogger.start(3456);
      
      // Make a request through frogger
      const response = await axios.get('http://localhost:3456/api/status');
      
      this.addResult('Basic Routing', true, `Routed to ${response.data.server}`);
    } catch (error) {
      this.addResult('Basic Routing', false, error.message);
    }
  }

  async testRateLimitHandling() {
    console.log('🚦 Testing rate limit handling...');
    
    try {
      const requests = [];
      
      // Make many requests to trigger rate limits
      for (let i = 0; i < 20; i++) {
        requests.push(
          axios.post('http://localhost:3456/api/generate', {
            prompt: `Test request ${i}`
          }).catch(err => ({ error: err.response?.status }))
        );
      }
      
      const results = await Promise.all(requests);
      
      // Check that requests were distributed across servers
      const serverCounts = {};
      const rateLimitHits = 0;
      
      results.forEach(result => {
        if (result.error === 429) {
          rateLimitHits++;
        } else if (result.data?.server) {
          serverCounts[result.data.server] = (serverCounts[result.data.server] || 0) + 1;
        }
      });
      
      const serversUsed = Object.keys(serverCounts).length;
      
      this.addResult(
        'Rate Limit Handling', 
        serversUsed > 1,
        `Distributed across ${serversUsed} servers`
      );
    } catch (error) {
      this.addResult('Rate Limit Handling', false, error.message);
    }
  }

  async testFailoverBehavior() {
    console.log('🔄 Testing failover behavior...');
    
    try {
      // Stop one server
      this.mockServers[0].server.close();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Make requests and ensure they succeed
      const results = [];
      for (let i = 0; i < 5; i++) {
        const response = await axios.get('http://localhost:3456/api/status');
        results.push(response.data.server);
      }
      
      // Restart the server
      this.mockServers[0] = await this.createMockServer(this.mockServers[0].config);
      
      this.addResult(
        'Failover Behavior',
        !results.includes('bronze-1'),
        'Successfully avoided failed server'
      );
    } catch (error) {
      this.addResult('Failover Behavior', false, error.message);
    }
  }

  async testLoadBalancing() {
    console.log('⚖️  Testing load balancing...');
    
    try {
      const requests = [];
      
      // Make many concurrent requests
      for (let i = 0; i < 100; i++) {
        requests.push(
          axios.get('http://localhost:3456/api/status')
            .then(res => res.data.server)
        );
      }
      
      const servers = await Promise.all(requests);
      
      // Count distribution
      const distribution = {};
      servers.forEach(server => {
        distribution[server] = (distribution[server] || 0) + 1;
      });
      
      // Calculate standard deviation
      const values = Object.values(distribution);
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      this.addResult(
        'Load Balancing',
        stdDev < avg * 0.5, // Good distribution if std dev is less than 50% of average
        `Distribution: ${JSON.stringify(distribution)}`
      );
    } catch (error) {
      this.addResult('Load Balancing', false, error.message);
    }
  }

  async testRecoveryMechanisms() {
    console.log('🛡️  Testing recovery mechanisms...');
    
    try {
      // Test recovery wrapper
      const testFunction = async () => {
        if (Math.random() < 0.7) { // 70% failure rate
          throw new Error('Simulated failure');
        }
        return { success: true };
      };
      
      const context = {
        type: 'test',
        alternatives: [
          { url: 'http://localhost:4001' },
          { url: 'http://localhost:4002' }
        ],
        cacheKey: 'test-recovery'
      };
      
      let successCount = 0;
      const attempts = 10;
      
      for (let i = 0; i < attempts; i++) {
        try {
          await this.failSafeSystem.executeWithRecovery({
            ...context,
            originalFunction: testFunction
          });
          successCount++;
        } catch (error) {
          // Recovery failed completely
        }
      }
      
      this.addResult(
        'Recovery Mechanisms',
        successCount > attempts * 0.5,
        `Recovered ${successCount}/${attempts} times`
      );
    } catch (error) {
      this.addResult('Recovery Mechanisms', false, error.message);
    }
  }

  async testKeyringRotation() {
    console.log('🔑 Testing keyring rotation...');
    
    try {
      const manager = new KeyringManager();
      await manager.initialize();
      
      // Create test keyring
      await manager.createKeyring('test-rotation', 'Test keyring for rotation');
      
      // Add multiple keys
      for (let i = 0; i < 3; i++) {
        await manager.addKey('test-rotation', {
          provider: 'test',
          endpoint: `http://localhost:400${i + 1}`,
          value: `test-key-${i}`,
          rateLimit: 10
        });
      }
      
      // Get keys in sequence
      const keys = [];
      for (let i = 0; i < 6; i++) {
        const key = manager.getNextKey('test-rotation');
        keys.push(key.value);
      }
      
      // Check that keys were rotated
      const uniqueKeys = new Set(keys);
      
      this.addResult(
        'Keyring Rotation',
        uniqueKeys.size === 3 && keys.length === 6,
        'Keys rotated properly'
      );
    } catch (error) {
      this.addResult('Keyring Rotation', false, error.message);
    }
  }

  addResult(test, passed, details) {
    this.testResults.push({
      test,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
    
    console.log(`  ${passed ? '✅' : '❌'} ${test}: ${details}`);
  }

  printResults() {
    console.log('\n📊 Test Results Summary\n');
    console.log('═'.repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const percentage = (passed / total * 100).toFixed(1);
    
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Success Rate: ${percentage}%`);
    
    console.log('═'.repeat(50));
    
    if (passed === total) {
      console.log('\n🎉 All tests passed! The Frogger system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the implementation.');
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');
    
    // Stop all mock servers
    for (const mock of this.mockServers) {
      if (mock.server && mock.server.listening) {
        mock.server.close();
      }
    }
    
    // Stop frogger router
    if (this.froggerRouter && this.froggerRouter.app) {
      // The router doesn't expose server directly, so we'd need to modify it
      // For now, just exit the process
    }
    
    // Stop connection mapper
    if (this.connectionMapper) {
      this.connectionMapper.stop();
    }
    
    console.log('Cleanup complete.');
  }
}

// Run tests
if (require.main === module) {
  const suite = new FroggerTestSuite();
  
  suite.setup()
    .then(() => suite.runTests())
    .then(() => suite.cleanup())
    .then(() => {
      console.log('\n🐸 Frogger test suite completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = FroggerTestSuite;