#!/usr/bin/env node

/**
 * AI ROUTER TEST SUITE
 * 
 * Tests the AI Router functionality:
 * - Connection to all AI services
 * - Smart routing logic
 * - Timeout handling
 * - Fallback mechanisms
 * - Performance measurement
 */

const AIRouter = require('./ai-router');
const LocalLLMManager = require('./local-llm-manager');

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorLog(color, message) {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testAIRouter() {
  colorLog('cyan', '🧪 Starting AI Router Test Suite\n');

  try {
    // Initialize AI Router
    colorLog('blue', '📡 Initializing AI Router...');
    const router = new AIRouter();
    
    // Wait for initialization
    await sleep(2000);
    
    // Test 1: Health Check
    colorLog('blue', '\n🏥 Test 1: Health Check');
    await router.checkAllServices();
    const healthStatus = router.healthStatus;
    
    Object.entries(healthStatus).forEach(([service, status]) => {
      if (status.healthy) {
        colorLog('green', `  ✅ ${service}: Healthy`);
        if (status.models && status.models.length > 0) {
          colorLog('green', `    Models: ${status.models.join(', ')}`);
        }
      } else {
        colorLog('red', `  ❌ ${service}: ${status.error || 'Unhealthy'}`);
      }
    });

    // Test 2: Simple Completion
    colorLog('blue', '\n💬 Test 2: Simple Completion');
    try {
      const result = await router.routeRequest('Hello, how are you?', {
        maxTokens: 50,
        priority: 'high'
      });
      
      if (result.success) {
        colorLog('green', `  ✅ Success via ${result.service}`);
        colorLog('green', `  📊 Duration: ${result.duration}ms, Tokens: ${result.tokens}`);
        colorLog('green', `  💰 Cost: $${(result.cost || 0).toFixed(4)}`);
        colorLog('cyan', `  📝 Response: ${result.result.slice(0, 100)}...`);
      } else {
        colorLog('red', `  ❌ Failed: ${result.error}`);
      }
    } catch (error) {
      colorLog('red', `  ❌ Error: ${error.message}`);
    }

    // Test 3: Code Generation
    colorLog('blue', '\n💻 Test 3: Code Generation');
    try {
      const result = await router.routeRequest(
        'Write a simple JavaScript function to calculate fibonacci numbers',
        {
          maxTokens: 200,
          temperature: 0.3,
          priority: 'normal'
        }
      );
      
      if (result.success) {
        colorLog('green', `  ✅ Success via ${result.service}`);
        colorLog('green', `  📊 Duration: ${result.duration}ms, Tokens: ${result.tokens}`);
        colorLog('green', `  💰 Cost: $${(result.cost || 0).toFixed(4)}`);
      } else {
        colorLog('red', `  ❌ Failed: ${result.error}`);
      }
    } catch (error) {
      colorLog('red', `  ❌ Error: ${error.message}`);
    }

    // Test 4: Timeout Test (Short timeout)
    colorLog('blue', '\n⏱️ Test 4: Timeout Handling');
    try {
      const result = await router.routeRequest(
        'Write a very detailed explanation of quantum computing with examples',
        {
          maxTokens: 2000,
          timeout: 1000, // Very short timeout
          priority: 'low'
        }
      );
      
      if (result.success) {
        colorLog('yellow', `  ⚠️  Unexpectedly succeeded: ${result.service} (${result.duration}ms)`);
      } else {
        colorLog('green', `  ✅ Timeout handled correctly: ${result.error}`);
      }
    } catch (error) {
      colorLog('green', `  ✅ Timeout handled: ${error.message}`);
    }

    // Test 5: Performance Test
    colorLog('blue', '\n🚀 Test 5: Performance Test (5 concurrent requests)');
    const startTime = Date.now();
    const promises = [];
    
    for (let i = 0; i < 5; i++) {
      promises.push(
        router.routeRequest(`Write a haiku about the number ${i + 1}`, {
          maxTokens: 100,
          priority: 'normal'
        })
      );
    }
    
    try {
      const results = await Promise.allSettled(promises);
      const totalTime = Date.now() - startTime;
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      
      colorLog('green', `  ✅ Completed: ${successful}/5 successful`);
      colorLog('green', `  📊 Total time: ${totalTime}ms`);
      colorLog('green', `  📊 Average per request: ${Math.round(totalTime / 5)}ms`);
      
      // Show service distribution
      const serviceCount = {};
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.success) {
          const service = result.value.service;
          serviceCount[service] = (serviceCount[service] || 0) + 1;
        }
      });
      
      colorLog('cyan', `  📈 Service distribution: ${JSON.stringify(serviceCount)}`);
      
    } catch (error) {
      colorLog('red', `  ❌ Performance test failed: ${error.message}`);
    }

    // Test 6: Statistics
    colorLog('blue', '\n📊 Test 6: Statistics');
    const stats = router.getStats();
    colorLog('cyan', `  📈 Total requests: ${stats.summary.totalRequests}`);
    colorLog('cyan', `  📈 Total errors: ${stats.summary.totalErrors}`);
    colorLog('cyan', `  📈 Success rate: ${(stats.summary.successRate * 100).toFixed(1)}%`);
    colorLog('cyan', `  📈 Average response time: ${Math.round(stats.summary.averageResponseTime)}ms`);
    colorLog('cyan', `  💰 Total cost: $${stats.summary.totalCost.toFixed(4)}`);

    // Service breakdown
    Object.entries(stats.requests).forEach(([service, count]) => {
      if (count > 0) {
        const errors = stats.errors[service] || 0;
        const successRate = count > 0 ? ((count - errors) / count * 100).toFixed(1) : '0';
        colorLog('cyan', `    ${service}: ${count} requests, ${successRate}% success`);
      }
    });

  } catch (error) {
    colorLog('red', `❌ Test suite failed: ${error.message}`);
    console.error(error);
  }
}

async function testLocalLLMManager() {
  colorLog('cyan', '\n🦙 Testing Local LLM Manager...\n');

  try {
    const manager = new LocalLLMManager();
    
    // Wait for initialization
    await new Promise((resolve, reject) => {
      manager.on('ready', resolve);
      manager.on('error', reject);
      setTimeout(() => reject(new Error('Timeout waiting for LLM manager')), 10000);
    });

    colorLog('green', '✅ Local LLM Manager initialized');

    // Get status
    const status = manager.getStatus();
    colorLog('blue', `📡 Host: ${status.host}`);
    colorLog('blue', `🏥 Healthy: ${status.healthy ? '✅' : '❌'}`);
    colorLog('blue', `📦 Models: ${status.models.available}/${status.models.total} available`);

    if (status.models.available > 0) {
      // Test completion
      colorLog('blue', '\n💭 Testing completion...');
      const result = await manager.generateCompletion('Hello, world!', {
        maxTokens: 50,
        taskType: 'chat'
      });

      colorLog('green', `✅ Completion generated via ${result.model}`);
      colorLog('green', `📊 Duration: ${result.duration}ms, Tokens: ${result.tokens}`);
      colorLog('cyan', `📝 Response: ${result.content.slice(0, 100)}...`);
    } else {
      colorLog('yellow', '⚠️  No models available for testing');
    }

  } catch (error) {
    colorLog('red', `❌ Local LLM Manager test failed: ${error.message}`);
  }
}

// Run tests
async function runAllTests() {
  console.log('🧪 AI Router & Local LLM Test Suite');
  console.log('=====================================\n');

  // Test Local LLM Manager first
  await testLocalLLMManager();
  
  // Wait a bit
  await sleep(2000);
  
  // Test AI Router
  await testAIRouter();
  
  colorLog('cyan', '\n✅ Test suite completed!');
  process.exit(0);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  colorLog('red', `❌ Uncaught Exception: ${error.message}`);
  console.error(error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  colorLog('red', `❌ Unhandled Rejection: ${error.message}`);
  console.error(error);
  process.exit(1);
});

// Run the tests
if (require.main === module) {
  runAllTests();
}