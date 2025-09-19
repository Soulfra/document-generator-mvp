#!/usr/bin/env node

/**
 * TEST DEEP FLOW
 * Test if requests can actually go "all the way to the center and back out"
 */

const { spawn } = require('child_process');

class DeepFlowTester {
  constructor() {
    this.bridgeProcess = null;
    this.corePort = 8890;
  }

  async testCompleteFlow() {
    console.log('🎯 TESTING COMPLETE DEEP FLOW');
    console.log('=============================');
    console.log('Testing if requests can go all the way to the center and back...\n');

    try {
      // Step 1: Start core bridge
      await this.startCoreBridge();
      
      // Step 2: Wait for bridge to be ready
      await this.waitForBridge();
      
      // Step 3: Test deep processing
      await this.testDeepProcessing();
      
      // Step 4: Verify complete trace
      await this.verifyCompleteTrace();
      
      console.log('\n🎉 SUCCESS: Requests can now flow all the way to center and back!');
      
    } catch (error) {
      console.error('\n❌ FAILURE:', error.message);
    } finally {
      this.cleanup();
    }
  }

  async startCoreBridge() {
    console.log('1️⃣ Starting Core Architecture Bridge...');
    
    this.bridgeProcess = spawn('node', ['core-architecture-bridge.js'], {
      stdio: 'pipe'
    });

    this.bridgeProcess.stdout.on('data', (data) => {
      console.log(`[BRIDGE] ${data.toString().trim()}`);
    });

    this.bridgeProcess.stderr.on('data', (data) => {
      console.error(`[BRIDGE ERROR] ${data.toString().trim()}`);
    });

    // Give it time to start
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  async waitForBridge() {
    console.log('2️⃣ Waiting for bridge to be ready...');
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`http://localhost:${this.corePort}/health`);
        const health = await response.json();
        
        if (health.status === 'operational') {
          console.log('✅ Core bridge is ready');
          console.log(`   Core services: ${JSON.stringify(health.core_services)}`);
          return;
        }
        
      } catch (error) {
        // Bridge not ready yet
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Core bridge failed to start');
  }

  async testDeepProcessing() {
    console.log('3️⃣ Testing deep processing flow...');
    
    const testData = {
      type: 'deep_test',
      content: 'Testing flow through XML → Blockchain → Quantum → Model Tagging → Data Feeds',
      metadata: {
        test_id: Date.now(),
        flow_test: true
      }
    };

    try {
      const response = await fetch(`http://localhost:${this.corePort}/deep/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });

      const result = await response.json();
      
      if (result.success && result.result.went_to_center) {
        console.log('✅ Deep processing successful!');
        console.log(`   Request ID: ${result.requestId}`);
        console.log(`   Layers traversed: ${result.result.layers_traversed.join(' → ')}`);
        console.log(`   Went to center: ${result.result.went_to_center}`);
        console.log(`   Processing complete: ${result.result.processing_complete}`);
        
        this.traceData = result.trace;
        return result;
        
      } else {
        throw new Error(`Deep processing failed: ${result.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      throw new Error(`Deep processing request failed: ${error.message}`);
    }
  }

  async verifyCompleteTrace() {
    console.log('4️⃣ Verifying complete trace...');
    
    if (!this.traceData) {
      throw new Error('No trace data available');
    }

    const expectedLayers = [
      'xml_schema',
      'blockchain', 
      'quantum_engine',
      'model_tagging',
      'data_feeds'
    ];

    console.log('📊 Trace Analysis:');
    
    let allLayersPassed = true;
    for (const layer of expectedLayers) {
      const layerTrace = this.traceData.find(t => t.layer === layer);
      
      if (layerTrace && layerTrace.status === 'passed') {
        console.log(`   ✅ ${layer}: Passed`);
      } else {
        console.log(`   ❌ ${layer}: Failed or missing`);
        allLayersPassed = false;
      }
    }

    // Check for quantum center processing
    const quantumTrace = this.traceData.find(t => t.layer === 'quantum_engine');
    if (quantumTrace && quantumTrace.result && quantumTrace.result.processed_at_center) {
      console.log('   🎯 QUANTUM CENTER: Request processed at the center!');
    } else {
      console.log('   ❌ QUANTUM CENTER: Request did not reach the center');
      allLayersPassed = false;
    }

    if (allLayersPassed) {
      console.log('✅ Complete trace verified - all layers passed');
    } else {
      throw new Error('Trace verification failed - some layers did not pass');
    }
  }

  cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    if (this.bridgeProcess && !this.bridgeProcess.killed) {
      this.bridgeProcess.kill('SIGTERM');
      console.log('✅ Core bridge stopped');
    }
  }
}

// Run the test
if (require.main === module) {
  const tester = new DeepFlowTester();
  tester.testCompleteFlow();
}

module.exports = DeepFlowTester;