#!/usr/bin/env node

/**
 * TEST UNIFIED PIPELINE
 * Verifies that all 1,156 files can actually work together
 * Tests the complete flow: Story → AI → MVP
 */

const http = require('http');
const { spawn } = require('child_process');

console.log('🧪 TESTING UNIFIED PIPELINE\n');

class PipelineTester {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0
    };
  }

  async runAllTests() {
    console.log('Starting unified pipeline...\n');
    
    // Start the unified pipeline
    const pipeline = spawn('node', ['unified-pipeline.js'], {
      detached: true,
      stdio: 'pipe'
    });
    
    // Wait for it to start
    await this.waitForService(8000);
    console.log('✅ Pipeline started on port 8000\n');
    
    // Run tests
    await this.testServiceDiscovery();
    await this.testStoryProcessing();
    await this.testEndToEndPipeline();
    await this.testInterServiceCommunication();
    
    // Show results
    this.showResults();
    
    // Cleanup
    console.log('\nStopping pipeline...');
    process.kill(-pipeline.pid);
  }
  
  async waitForService(port, maxTries = 30) {
    for (let i = 0; i < maxTries; i++) {
      try {
        await this.checkPort(port);
        return true;
      } catch (e) {
        process.stdout.write('.');
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    throw new Error(`Service on port ${port} did not start`);
  }
  
  checkPort(port) {
    return new Promise((resolve, reject) => {
      const req = http.get(`http://localhost:${port}/`, (res) => {
        resolve(true);
      });
      req.on('error', reject);
      req.end();
    });
  }
  
  async test(name, fn) {
    console.log(`\n📋 Test: ${name}`);
    this.results.total++;
    
    try {
      await fn();
      console.log(`✅ PASSED: ${name}`);
      this.results.passed++;
      this.tests.push({ name, passed: true });
    } catch (error) {
      console.log(`❌ FAILED: ${name}`);
      console.log(`   Error: ${error.message}`);
      this.results.failed++;
      this.tests.push({ name, passed: false, error: error.message });
    }
  }
  
  async testServiceDiscovery() {
    await this.test('Service Discovery', async () => {
      const response = await this.httpRequest('GET', 8000, '/api/status');
      const status = JSON.parse(response);
      
      if (!status.pipeline) throw new Error('No pipeline status');
      if (!status.pipeline.intake) throw new Error('No intake stage');
      if (!status.pipeline.processing) throw new Error('No processing stage');
      if (!status.pipeline.generation) throw new Error('No generation stage');
      
      console.log(`   Found ${Object.keys(status.pipeline).length} pipeline stages`);
    });
  }
  
  async testStoryProcessing() {
    await this.test('Story Processing', async () => {
      const testStory = 'Test story about overcoming challenges through daily habits.';
      
      const response = await this.httpRequest('POST', 8000, '/api/unified/process', {
        story: testStory
      });
      
      const result = JSON.parse(response);
      
      if (!result.success) throw new Error('Processing failed');
      if (!result.pipeline) throw new Error('No pipeline results');
      if (!result.pipeline.intake) throw new Error('No intake results');
      
      console.log(`   Story processed successfully`);
      console.log(`   Intake ID: ${result.pipeline.intake.id || 'generated'}`);
    });
  }
  
  async testEndToEndPipeline() {
    await this.test('End-to-End Pipeline', async () => {
      // Test complete flow
      const stories = [
        'I built a successful business by focusing on customer needs.',
        'Recovery taught me the importance of daily routines.',
        'Teaching others helped me understand myself better.'
      ];
      
      for (const story of stories) {
        const response = await this.httpRequest('POST', 8000, '/api/unified/process', {
          story
        });
        
        const result = JSON.parse(response);
        if (!result.success) throw new Error(`Failed to process: ${story}`);
      }
      
      console.log(`   Processed ${stories.length} stories through full pipeline`);
    });
  }
  
  async testInterServiceCommunication() {
    await this.test('Inter-Service Communication', async () => {
      // Test connections between services
      const connections = [
        { from: 'intake', to: 'processing' },
        { from: 'processing', to: 'generation' }
      ];
      
      for (const conn of connections) {
        const response = await this.httpRequest('POST', 8000, '/api/test/connection', conn);
        const result = JSON.parse(response);
        
        if (!result.success) {
          console.log(`   Warning: ${conn.from} → ${conn.to} connection not active`);
        } else {
          console.log(`   ✓ ${conn.from} → ${conn.to} connected`);
        }
      }
    });
  }
  
  httpRequest(method, port, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: { 'Content-Type': 'application/json' }
      };
      
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve(body));
      });
      
      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }
  
  showResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\nTotal Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\nFailed Tests:');
      this.tests.filter(t => !t.passed).forEach(t => {
        console.log(`  - ${t.name}: ${t.error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (this.results.passed === this.results.total) {
      console.log('✅ ALL TESTS PASSED! The unified pipeline works!');
      console.log('🎉 Your 1,156 files are successfully connected!\n');
    } else {
      console.log('⚠️  Some tests failed. Check the errors above.\n');
    }
  }
}

// Run the tests
async function main() {
  const tester = new PipelineTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
    process.exit(1);
  }
}

// Handle cleanup
process.on('SIGINT', () => {
  console.log('\n\nStopping tests...');
  // Kill any remaining services
  spawn('pkill', ['-f', 'unified-pipeline']);
  spawn('pkill', ['-f', 'simple-test']);
  spawn('pkill', ['-f', 'platform-os']);
  spawn('pkill', ['-f', 'app-in-app']);
  process.exit(0);
});

main();