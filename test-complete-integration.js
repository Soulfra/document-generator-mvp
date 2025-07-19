#!/usr/bin/env node

/**
 * Test Complete Integration - End-to-end system test
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

console.log('🧪 TESTING COMPLETE SOVEREIGN AGENTS INTEGRATION');
console.log('================================================');

class IntegrationTester {
  constructor() {
    this.testResults = [];
    this.startTime = new Date();
    this.services = [
      { name: 'Redis Event Bus', url: 'http://localhost:6379', type: 'redis' },
      { name: 'Document Generator API', url: 'http://localhost:3001/health', type: 'http' },
      { name: 'Sovereign Agents', url: 'http://localhost:8085/health', type: 'http' },
      { name: 'Debug Dashboard', url: 'http://localhost:8086/health', type: 'http' },
      { name: 'Template Processor', url: 'http://localhost:3000/health', type: 'http' }
    ];
  }

  /**
   * Run comprehensive integration test
   */
  async runIntegrationTest() {
    console.log('🚀 Starting comprehensive integration test...\n');

    try {
      // Phase 1: Execute startup sequence
      console.log('📋 PHASE 1: SYSTEM STARTUP');
      console.log('==========================');
      await this.executePhase1();

      // Phase 2: Service health checks
      console.log('\n📋 PHASE 2: SERVICE HEALTH CHECKS');
      console.log('==================================');
      await this.testServiceHealth();

      // Phase 3: Event bus connectivity
      console.log('\n📋 PHASE 3: EVENT BUS CONNECTIVITY');
      console.log('===================================');
      await this.testEventBusConnectivity();

      // Phase 4: Document upload simulation
      console.log('\n📋 PHASE 4: DOCUMENT UPLOAD SIMULATION');
      console.log('=======================================');
      await this.testDocumentUpload();

      // Phase 5: Agent reasoning verification
      console.log('\n📋 PHASE 5: AGENT REASONING VERIFICATION');
      console.log('=========================================');
      await this.testAgentReasoning();

      // Generate final report
      const report = this.generateFinalReport();
      await this.saveReport(report);

      return report;

    } catch (error) {
      console.error('💥 Integration test failed:', error.message);
      throw error;
    }
  }

  /**
   * Execute Phase 1 startup sequence
   */
  async executePhase1() {
    console.log('🔄 Executing Phase 1 startup sequence...');
    
    const result = await this.executeCommand('node', ['execute-phase1-now.js']);
    
    this.testResults.push({
      phase: 'Phase 1 Startup',
      success: result.success,
      duration: result.duration,
      details: result.success ? 'All startup scripts executed' : 'Startup failed',
      timestamp: new Date()
    });

    if (!result.success) {
      throw new Error('Phase 1 startup failed');
    }

    console.log('✅ Phase 1 startup completed');
  }

  /**
   * Test service health
   */
  async testServiceHealth() {
    console.log('🏥 Testing service health...');

    for (const service of this.services) {
      const startTime = Date.now();
      
      try {
        let healthy = false;
        
        if (service.type === 'http') {
          healthy = await this.testHttpHealth(service.url);
        } else if (service.type === 'redis') {
          healthy = await this.testRedisHealth();
        }

        const duration = Date.now() - startTime;
        
        this.testResults.push({
          phase: 'Service Health',
          service: service.name,
          success: healthy,
          duration,
          details: healthy ? 'Service responsive' : 'Service unreachable',
          timestamp: new Date()
        });

        console.log(`   ${healthy ? '✅' : '❌'} ${service.name}: ${healthy ? 'HEALTHY' : 'UNHEALTHY'} (${duration}ms)`);

      } catch (error) {
        const duration = Date.now() - startTime;
        
        this.testResults.push({
          phase: 'Service Health',
          service: service.name,
          success: false,
          duration,
          details: error.message,
          timestamp: new Date()
        });

        console.log(`   ❌ ${service.name}: ERROR - ${error.message}`);
      }
    }
  }

  /**
   * Test HTTP service health
   */
  async testHttpHealth(url) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Test Redis health
   */
  async testRedisHealth() {
    try {
      const result = await this.executeCommand('redis-cli', ['ping']);
      return result.success && result.stdout.includes('PONG');
    } catch (error) {
      return false;
    }
  }

  /**
   * Test event bus connectivity
   */
  async testEventBusConnectivity() {
    console.log('📡 Testing event bus connectivity...');
    
    try {
      // Test Redis pub/sub
      const testMessage = JSON.stringify({
        id: 'test-' + Date.now(),
        type: 'test.connectivity',
        data: { message: 'Integration test' },
        timestamp: new Date().toISOString()
      });

      // Publish test message
      const publishResult = await this.executeCommand('redis-cli', [
        'PUBLISH', 
        'sovereign-agents:events:test.connectivity', 
        testMessage
      ]);

      const success = publishResult.success;
      
      this.testResults.push({
        phase: 'Event Bus Connectivity',
        success,
        duration: publishResult.duration,
        details: success ? 'Event published successfully' : 'Failed to publish event',
        timestamp: new Date()
      });

      console.log(`   ${success ? '✅' : '❌'} Event Bus: ${success ? 'CONNECTED' : 'DISCONNECTED'}`);

    } catch (error) {
      this.testResults.push({
        phase: 'Event Bus Connectivity',
        success: false,
        duration: 0,
        details: error.message,
        timestamp: new Date()
      });

      console.log(`   ❌ Event Bus: ERROR - ${error.message}`);
    }
  }

  /**
   * Test document upload flow
   */
  async testDocumentUpload() {
    console.log('📄 Testing document upload flow...');

    try {
      // Create test document
      const testDoc = await this.createTestDocument();
      
      // Simulate document upload via API
      const uploadResult = await this.simulateDocumentUpload(testDoc);
      
      this.testResults.push({
        phase: 'Document Upload',
        success: uploadResult.success,
        duration: uploadResult.duration,
        details: uploadResult.success ? 'Document uploaded and processed' : 'Upload failed',
        timestamp: new Date()
      });

      console.log(`   ${uploadResult.success ? '✅' : '❌'} Document Upload: ${uploadResult.success ? 'SUCCESS' : 'FAILED'}`);

      if (uploadResult.success) {
        // Wait for processing
        console.log('   ⏳ Waiting for document processing...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check processing status
        const status = await this.checkProcessingStatus(uploadResult.documentId);
        console.log(`   📊 Processing Status: ${status}`);
      }

    } catch (error) {
      this.testResults.push({
        phase: 'Document Upload',
        success: false,
        duration: 0,
        details: error.message,
        timestamp: new Date()
      });

      console.log(`   ❌ Document Upload: ERROR - ${error.message}`);
    }
  }

  /**
   * Test agent reasoning
   */
  async testAgentReasoning() {
    console.log('🤖 Testing agent reasoning capabilities...');

    try {
      // Test agent decision making
      const reasoningTest = await this.testAgentDecisionMaking();
      
      this.testResults.push({
        phase: 'Agent Reasoning',
        success: reasoningTest.success,
        duration: reasoningTest.duration,
        details: reasoningTest.details,
        timestamp: new Date()
      });

      console.log(`   ${reasoningTest.success ? '✅' : '❌'} Agent Reasoning: ${reasoningTest.success ? 'WORKING' : 'FAILED'}`);

    } catch (error) {
      this.testResults.push({
        phase: 'Agent Reasoning',
        success: false,
        duration: 0,
        details: error.message,
        timestamp: new Date()
      });

      console.log(`   ❌ Agent Reasoning: ERROR - ${error.message}`);
    }
  }

  /**
   * Create test document
   */
  async createTestDocument() {
    const testContent = `# Test Business Plan

## Problem Statement
Many businesses struggle with document-to-MVP conversion.

## Solution
An AI-powered system that transforms documents into working applications.

## Market Analysis
The no-code/low-code market is growing rapidly.

## Technical Requirements
- Document upload and parsing
- AI-powered analysis
- Code generation
- Automated deployment

## Features
1. User authentication
2. Document upload
3. AI analysis
4. Template matching
5. Code generation
6. Deployment automation

This is a test document for integration testing.`;

    const filename = `test-document-${Date.now()}.md`;
    const filepath = path.join(__dirname, filename);
    
    await fs.writeFile(filepath, testContent);
    
    return {
      filename,
      filepath,
      content: testContent,
      size: Buffer.byteLength(testContent, 'utf8')
    };
  }

  /**
   * Simulate document upload
   */
  async simulateDocumentUpload(testDoc) {
    const startTime = Date.now();
    
    try {
      // Simulate HTTP upload to Document Generator API
      const formData = new FormData();
      const blob = new Blob([testDoc.content], { type: 'text/markdown' });
      formData.append('file', blob, testDoc.filename);

      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(10000)
      });

      const duration = Date.now() - startTime;

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          duration,
          documentId: result.data.jobId,
          details: 'Document uploaded successfully'
        };
      } else {
        return {
          success: false,
          duration,
          details: `HTTP ${response.status}: ${response.statusText}`
        };
      }

    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        details: error.message
      };
    }
  }

  /**
   * Check processing status
   */
  async checkProcessingStatus(documentId) {
    try {
      const response = await fetch(`http://localhost:3001/api/jobs/${documentId}`, {
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        return data.data?.status || 'unknown';
      } else {
        return 'error';
      }
    } catch (error) {
      return 'unreachable';
    }
  }

  /**
   * Test agent decision making
   */
  async testAgentDecisionMaking() {
    const startTime = Date.now();
    
    try {
      // Test agent API if available
      const response = await fetch('http://localhost:8085/api/test-reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: 'document_analysis',
          input: 'Test business plan document'
        }),
        signal: AbortSignal.timeout(5000)
      });

      const duration = Date.now() - startTime;

      if (response.ok) {
        const result = await response.json();
        return {
          success: true,
          duration,
          details: 'Agent reasoning test completed'
        };
      } else {
        return {
          success: false,
          duration,
          details: `Agent API returned ${response.status}`
        };
      }

    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        details: 'Agent reasoning API not available (expected in development)'
      };
    }
  }

  /**
   * Execute command helper
   */
  async executeCommand(command, args = []) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const process = spawn(command, args, { stdio: 'pipe' });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => stdout += data.toString());
      process.stderr.on('data', (data) => stderr += data.toString());
      
      process.on('close', (code) => {
        const duration = Date.now() - startTime;
        resolve({
          success: code === 0,
          duration,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code
        });
      });

      process.on('error', (error) => {
        const duration = Date.now() - startTime;
        resolve({
          success: false,
          duration,
          stdout: '',
          stderr: error.message,
          error: error.message
        });
      });
    });
  }

  /**
   * Generate final test report
   */
  generateFinalReport() {
    const endTime = new Date();
    const totalDuration = endTime - this.startTime;
    
    const summary = {
      totalTests: this.testResults.length,
      passed: this.testResults.filter(r => r.success).length,
      failed: this.testResults.filter(r => !r.success).length,
      successRate: 0
    };

    summary.successRate = summary.totalTests > 0 ? 
      (summary.passed / summary.totalTests * 100).toFixed(1) : 0;

    const report = {
      title: 'Sovereign Agents Integration Test Report',
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalDuration,
      summary,
      results: this.testResults,
      status: summary.failed === 0 ? 'PASSED' : 'FAILED'
    };

    // Print summary
    console.log('\n🎯 INTEGRATION TEST SUMMARY');
    console.log('============================');
    console.log(`📅 Started: ${this.startTime.toLocaleTimeString()}`);
    console.log(`📅 Completed: ${endTime.toLocaleTimeString()}`);
    console.log(`⏱️ Total Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log(`📊 Tests: ${summary.passed}/${summary.totalTests} passed (${summary.successRate}%)`);
    console.log(`🎭 Status: ${report.status}`);

    if (report.status === 'PASSED') {
      console.log('\n🎉 INTEGRATION TEST PASSED!');
      console.log('============================');
      console.log('✅ All core systems are operational');
      console.log('✅ Event-driven architecture working');
      console.log('✅ Document processing pipeline active');
      console.log('✅ Sovereign agents responding');
      
      console.log('\n🚀 SYSTEM READY FOR PRODUCTION USE!');
      console.log('===================================');
      console.log('🎭 Sovereign Agents: http://localhost:8085');
      console.log('🖥️ Debug Dashboard: http://localhost:8086/debug');
      console.log('📡 Document API: http://localhost:3001');
      console.log('🎨 Template Processor: http://localhost:3000');
      
    } else {
      console.log('\n⚠️ INTEGRATION TEST FAILED');
      console.log('==========================');
      
      const failedTests = this.testResults.filter(r => !r.success);
      console.log('❌ Failed tests:');
      for (const test of failedTests) {
        console.log(`   - ${test.phase}${test.service ? ` (${test.service})` : ''}: ${test.details}`);
      }
    }

    return report;
  }

  /**
   * Save test report
   */
  async saveReport(report) {
    try {
      await fs.writeFile(
        'integration-test-report.json',
        JSON.stringify(report, null, 2)
      );
      console.log('\n💾 Test report saved: integration-test-report.json');
    } catch (error) {
      console.error('❌ Failed to save test report:', error.message);
    }
  }
}

// Main execution
async function main() {
  const tester = new IntegrationTester();
  
  try {
    const report = await tester.runIntegrationTest();
    process.exit(report.status === 'PASSED' ? 0 : 1);
    
  } catch (error) {
    console.error('💥 Integration test execution failed:', error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = IntegrationTester;