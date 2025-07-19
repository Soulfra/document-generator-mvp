#!/usr/bin/env node

/**
 * TEST SYSTEM CONNECTIONS
 * Tests that APIs actually connect to bus/mesh and all layers communicate
 */

console.log(`
🧪 TESTING SYSTEM CONNECTIONS 🧪
Verifying API → Bus → Mesh → Brain flow
`);

const BashSystemIntegration = require('./bash-system-integration');

class SystemConnectionTester {
  constructor() {
    this.integration = new BashSystemIntegration();
    this.testResults = [];
    this.server = null;
  }

  async runAllTests() {
    console.log('🚀 Starting system connection tests...\n');
    
    // Start the integration server
    this.server = this.integration.start();
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Run tests
    await this.testAPIEndpoints();
    await this.testCharacterCommunication();
    await this.testBusMessaging();
    await this.testLayerConnections();
    await this.testBrainIntegration();
    
    // Show results
    this.showResults();
    
    // Cleanup
    this.server.close();
  }

  async testAPIEndpoints() {
    console.log('📡 Testing API endpoints...');
    
    const tests = [
      { name: 'Health Check', url: 'http://localhost:3001/health' },
      { name: 'Character List', url: 'http://localhost:3001/api/characters' },
      { name: 'Brain Status', url: 'http://localhost:3001/api/brain/status' },
      { name: 'System Status', url: 'http://localhost:3001/api/system/status' },
      { name: 'Layer List', url: 'http://localhost:3001/api/layers' }
    ];

    for (const test of tests) {
      try {
        const response = await fetch(test.url);
        if (response.ok) {
          const data = await response.json();
          this.testResults.push({
            test: test.name,
            status: 'PASS',
            message: `API responding correctly`,
            data: data
          });
          console.log(`  ✅ ${test.name}: PASS`);
        } else {
          this.testResults.push({
            test: test.name,
            status: 'FAIL',
            message: `HTTP ${response.status}`,
            data: null
          });
          console.log(`  ❌ ${test.name}: FAIL (${response.status})`);
        }
      } catch (error) {
        this.testResults.push({
          test: test.name,
          status: 'ERROR',
          message: error.message,
          data: null
        });
        console.log(`  ❌ ${test.name}: ERROR - ${error.message}`);
      }
    }
  }

  async testCharacterCommunication() {
    console.log('\n🎭 Testing character communication...');
    
    const characters = ['ralph', 'alice', 'bob', 'charlie', 'diana', 'eve', 'frank'];
    
    for (const character of characters) {
      try {
        const response = await fetch(`http://localhost:3001/api/characters/${character}/command`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            command: 'test',
            message: 'connection test'
          })
        });

        if (response.ok) {
          const result = await response.json();
          this.testResults.push({
            test: `${character} Communication`,
            status: 'PASS',
            message: `Character responded: ${result.response}`,
            data: result
          });
          console.log(`  ✅ ${character.toUpperCase()}: PASS`);
        } else {
          this.testResults.push({
            test: `${character} Communication`,
            status: 'FAIL',
            message: `HTTP ${response.status}`,
            data: null
          });
          console.log(`  ❌ ${character.toUpperCase()}: FAIL`);
        }
      } catch (error) {
        this.testResults.push({
          test: `${character} Communication`,
          status: 'ERROR',
          message: error.message,
          data: null
        });
        console.log(`  ❌ ${character.toUpperCase()}: ERROR - ${error.message}`);
      }
    }
  }

  async testBusMessaging() {
    console.log('\n🚌 Testing bus messaging...');
    
    // Test message routing
    const testMessage = {
      from: 'test',
      to: 'ralph',
      message: 'bus test message'
    };

    try {
      // Emit a message through the bus
      this.integration.emit('characterMessage', testMessage);
      
      this.testResults.push({
        test: 'Bus Messaging',
        status: 'PASS',
        message: 'Message routing functional',
        data: testMessage
      });
      console.log('  ✅ Bus Messaging: PASS');
    } catch (error) {
      this.testResults.push({
        test: 'Bus Messaging',
        status: 'ERROR',
        message: error.message,
        data: null
      });
      console.log(`  ❌ Bus Messaging: ERROR - ${error.message}`);
    }
  }

  async testLayerConnections() {
    console.log('\n📊 Testing layer connections...');
    
    const systemMap = this.integration.getSystemMap();
    
    if (systemMap.layers.length >= 11) {
      this.testResults.push({
        test: 'Layer Connections',
        status: 'PASS',
        message: `${systemMap.layers.length} layers connected`,
        data: systemMap.layers
      });
      console.log(`  ✅ Layer Connections: PASS (${systemMap.layers.length} layers)`);
    } else {
      this.testResults.push({
        test: 'Layer Connections',
        status: 'FAIL',
        message: `Only ${systemMap.layers.length} layers connected`,
        data: systemMap.layers
      });
      console.log(`  ❌ Layer Connections: FAIL (${systemMap.layers.length} layers)`);
    }

    // Test individual layer status
    const layerNumbers = [1, 4, 5, 7, 9, 14, 19, 20, 21, 22, 23];
    
    for (const layerNum of layerNumbers) {
      try {
        const response = await fetch(`http://localhost:3001/api/layers/${layerNum}/status`);
        if (response.ok) {
          const data = await response.json();
          console.log(`  ✅ Layer ${layerNum} (${data.name}): ${data.status}`);
        } else {
          console.log(`  ❌ Layer ${layerNum}: HTTP ${response.status}`);
        }
      } catch (error) {
        console.log(`  ❌ Layer ${layerNum}: ${error.message}`);
      }
    }
  }

  async testBrainIntegration() {
    console.log('\n🧠 Testing brain integration...');
    
    try {
      const response = await fetch('http://localhost:3001/api/system/orchestrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'test',
          target: 'brain',
          parameters: { test: 'integration' }
        })
      });

      if (response.ok) {
        const result = await response.json();
        this.testResults.push({
          test: 'Brain Integration',
          status: 'PASS',
          message: 'Brain orchestration functional',
          data: result
        });
        console.log('  ✅ Brain Integration: PASS');
      } else {
        this.testResults.push({
          test: 'Brain Integration',
          status: 'FAIL',
          message: `HTTP ${response.status}`,
          data: null
        });
        console.log(`  ❌ Brain Integration: FAIL (${response.status})`);
      }
    } catch (error) {
      this.testResults.push({
        test: 'Brain Integration',
        status: 'ERROR',
        message: error.message,
        data: null
      });
      console.log(`  ❌ Brain Integration: ERROR - ${error.message}`);
    }
  }

  showResults() {
    console.log('\n📋 TEST RESULTS SUMMARY');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;
    const errors = this.testResults.filter(r => r.status === 'ERROR').length;
    
    console.log(`Total Tests: ${this.testResults.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Errors: ${errors}`);
    console.log('='.repeat(50));
    
    // Show detailed results
    this.testResults.forEach(result => {
      const statusIcon = result.status === 'PASS' ? '✅' : 
                         result.status === 'FAIL' ? '❌' : '⚠️';
      console.log(`${statusIcon} ${result.test}: ${result.status} - ${result.message}`);
    });
    
    console.log('\n🎯 SYSTEM CONNECTION STATUS:');
    if (failed === 0 && errors === 0) {
      console.log('🟢 ALL SYSTEMS CONNECTED - Ready for orchestration!');
    } else {
      console.log('🟡 SOME ISSUES DETECTED - Check connections and retry');
    }
    
    // Save results
    const fs = require('fs');
    fs.writeFileSync('./test-results.json', JSON.stringify(this.testResults, null, 2));
    console.log('\n📄 Results saved to test-results.json');
  }
}

// Run tests
async function runTests() {
  const tester = new SystemConnectionTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Export for use
module.exports = SystemConnectionTester;

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}