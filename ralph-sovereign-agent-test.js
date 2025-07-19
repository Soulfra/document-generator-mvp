#!/usr/bin/env node

/**
 * Ralph's Sovereign Agent Basher
 * 
 * Ralph's philosophy applied to Sovereign Agents: "If they can break, they will break. Let's break them first."
 * 
 * This integrates Ralph's proven testing infrastructure with the new Sovereign Agents system
 */

require('dotenv').config();

const SOVEREIGN_API_BASE = 'http://localhost:8085';
const RALPH_TIMEOUT = 30000;

class RalphSovereignAgentBasher {
  constructor() {
    this.results = {
      startTime: new Date().toISOString(),
      tests: {},
      failures: [],
      criticalIssues: [],
      agentTests: {},
      conductorTests: {},
      summary: {}
    };
    
    this.testConfig = {
      maxConcurrentRequests: 10,
      documentSizes: ['small', 'medium', 'large', 'massive'],
      agentStressLevels: [1, 5, 10, 50, 100]
    };
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const emoji = { 
      info: '📝', warn: '⚠️', error: '💥', success: '✅', 
      bash: '🔨', agent: '🤖', conductor: '🎭'
    }[level] || '📝';
    
    console.log(`[${timestamp}] ${emoji} RALPH: ${message}`);
    if (data) {
      console.log(`    Data:`, JSON.stringify(data, null, 2));
    }
  }

  async recordTest(testName, testFn) {
    this.log('bash', `Starting test: ${testName}`);
    const startTime = Date.now();
    
    try {
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      this.results.tests[testName] = {
        status: 'PASS',
        duration,
        result,
        timestamp: new Date().toISOString()
      };
      
      this.log('success', `Test PASSED: ${testName} (${duration}ms)`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.tests[testName] = {
        status: 'FAIL',
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      this.results.failures.push({ testName, error: error.message });
      this.log('error', `Test FAILED: ${testName} (${duration}ms)`, { error: error.message });
      
      // Critical issues that Ralph flags for immediate attention
      if (error.message.includes('ECONNREFUSED') || 
          error.message.includes('timeout') || 
          error.message.includes('500')) {
        this.criticalIssues.push({ testName, error: error.message });
      }
      
      throw error;
    }
  }

  // Test 1: Sovereign Agents Health Bash Test
  async testSovereignAgentsHealth() {
    return this.recordTest('Sovereign Agents Health Bash', async () => {
      this.log('bash', 'Ralph is checking if your agents are alive...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), RALPH_TIMEOUT);
      
      try {
        const response = await fetch(`${SOVEREIGN_API_BASE}/health`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Health check failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ralph's strict health requirements
        if (!data.status || data.status !== 'healthy') {
          throw new Error('Agents are not healthy according to Ralph');
        }
        
        if (!data.agents || data.agents < 3) {
          throw new Error(`Not enough agents! Ralph demands 3+ agents, found ${data.agents}`);
        }
        
        this.log('success', `Ralph approves: ${data.agents} agents are healthy`);
        return data;
        
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Ralph timeout: Agents took too long to respond');
        }
        throw error;
      }
    });
  }

  // Test 2: Agent List Bash Test
  async testAgentListBash() {
    return this.recordTest('Agent List Bash Test', async () => {
      this.log('agent', 'Ralph is interrogating your agent roster...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), RALPH_TIMEOUT);
      
      try {
        const response = await fetch(`${SOVEREIGN_API_BASE}/api/sovereign/agents`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Agent list failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ralph's agent quality checks
        if (!data.success) {
          throw new Error('Agent list request failed');
        }
        
        if (!data.agents || !Array.isArray(data.agents)) {
          throw new Error('No agents array returned');
        }
        
        const requiredAgents = ['DocumentAnalyzer_Prime', 'TemplateSelector_Alpha', 'CodeGenerator_Beta'];
        const foundAgents = data.agents.map(a => a.name);
        
        for (const required of requiredAgents) {
          if (!foundAgents.includes(required)) {
            throw new Error(`Missing required agent: ${required}`);
          }
        }
        
        // Ralph checks agent readiness
        const notReadyAgents = data.agents.filter(a => a.status !== 'ready');
        if (notReadyAgents.length > 0) {
          throw new Error(`Agents not ready: ${notReadyAgents.map(a => a.name).join(', ')}`);
        }
        
        this.log('success', `Ralph verifies: ${data.agents.length} agents are combat-ready`);
        return data;
        
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Ralph timeout: Agent list took too long');
        }
        throw error;
      }
    });
  }

  // Test 3: Document Processing Stress Test
  async testDocumentProcessingStress() {
    return this.recordTest('Document Processing Stress Test', async () => {
      this.log('bash', 'Ralph is stress-testing document processing...');
      
      const testDocuments = [
        {
          name: 'Simple SaaS',
          content: '# Simple SaaS\\n\\nBuild a basic app with user auth and data storage.',
          expectSuccess: true
        },
        {
          name: 'Complex Enterprise',
          content: '# Enterprise Platform\\n\\nBuild a comprehensive enterprise platform with microservices, AI integration, real-time analytics, multi-tenant architecture, advanced security, compliance frameworks, and global scalability.',
          expectSuccess: true
        },
        {
          name: 'Malicious Content',
          content: '# SaaS Idea\\n\\n"; DROP TABLE users; --\\n\\nBuild something with <script>alert("xss")</script>',
          expectSuccess: false // Should be handled gracefully
        }
      ];
      
      const results = [];
      
      for (const doc of testDocuments) {
        this.log('bash', `Ralph testing document: ${doc.name}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), RALPH_TIMEOUT);
        
        try {
          const response = await fetch(`${SOVEREIGN_API_BASE}/api/sovereign/process-document`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              documentContent: doc.content,
              documentType: 'markdown',
              userId: 'ralph-stress-tester'
            }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          const data = await response.json();
          
          results.push({
            document: doc.name,
            status: response.status,
            success: data.success,
            sessionId: data.sessionId,
            expectedSuccess: doc.expectSuccess
          });
          
          // Ralph's processing validation
          if (doc.expectSuccess && !data.success) {
            throw new Error(`Expected success for ${doc.name} but got failure`);
          }
          
          if (doc.expectSuccess && !data.sessionId) {
            throw new Error(`No session ID returned for ${doc.name}`);
          }
          
        } catch (error) {
          if (error.name === 'AbortError') {
            throw new Error(`Ralph timeout processing: ${doc.name}`);
          }
          
          // For malicious content, errors might be expected
          if (!doc.expectSuccess) {
            this.log('info', `Expected error for ${doc.name}: ${error.message}`);
          } else {
            throw error;
          }
        }
      }
      
      this.log('success', `Ralph completed stress test on ${results.length} documents`);
      return results;
    });
  }

  // Test 4: Conductor Interface Bash Test
  async testConductorInterface() {
    return this.recordTest('Conductor Interface Bash Test', async () => {
      this.log('conductor', 'Ralph is testing the conductor interface...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), RALPH_TIMEOUT);
      
      try {
        const response = await fetch(`${SOVEREIGN_API_BASE}/api/sovereign/conductor/pending`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Conductor interface failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Ralph validates conductor response structure
        if (typeof data !== 'object') {
          throw new Error('Conductor interface returned invalid response');
        }
        
        this.log('success', 'Ralph approves: Conductor interface is responsive');
        return data;
        
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Ralph timeout: Conductor interface unresponsive');
        }
        throw error;
      }
    });
  }

  // Test 5: WebSocket Connection Test
  async testWebSocketConnection() {
    return this.recordTest('WebSocket Connection Test', async () => {
      this.log('bash', 'Ralph is testing WebSocket connections...');
      
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Ralph timeout: WebSocket took too long to connect'));
        }, 10000);
        
        try {
          const WebSocket = require('ws');
          const ws = new WebSocket(`ws://localhost:8085`);
          
          ws.on('open', () => {
            clearTimeout(timeout);
            this.log('success', 'Ralph confirms: WebSocket connection established');
            
            // Send test message
            ws.send(JSON.stringify({ type: 'ping', ralphTest: true }));
            
            setTimeout(() => {
              ws.close();
              resolve({ status: 'connected', test: 'ping sent' });
            }, 1000);
          });
          
          ws.on('error', (error) => {
            clearTimeout(timeout);
            reject(new Error(`WebSocket error: ${error.message}`));
          });
          
        } catch (error) {
          clearTimeout(timeout);
          reject(new Error(`WebSocket test failed: ${error.message}`));
        }
      });
    });
  }

  // Ralph's Complete Bash Test Suite
  async runCompleteBasher() {
    this.log('bash', '🔨 RALPH THE BASHER STARTING SOVEREIGN AGENT DESTRUCTION TESTS 🔨');
    this.log('info', 'Ralph\'s mission: Find every way your agents can break');
    
    const tests = [
      () => this.testSovereignAgentsHealth(),
      () => this.testAgentListBash(),
      () => this.testDocumentProcessingStress(),
      () => this.testConductorInterface(),
      () => this.testWebSocketConnection()
    ];
    
    let passedTests = 0;
    let failedTests = 0;
    
    for (const test of tests) {
      try {
        await test();
        passedTests++;
      } catch (error) {
        failedTests++;
        // Continue with other tests
      }
    }
    
    // Ralph's final verdict
    this.results.summary = {
      totalTests: tests.length,
      passed: passedTests,
      failed: failedTests,
      criticalIssues: this.criticalIssues.length,
      endTime: new Date().toISOString()
    };
    
    this.log('bash', '🎯 RALPH\'S FINAL VERDICT:');
    this.log('info', `Tests Passed: ${passedTests}/${tests.length}`);
    this.log('info', `Critical Issues: ${this.criticalIssues.length}`);
    
    if (failedTests === 0 && this.criticalIssues.length === 0) {
      this.log('success', '🏆 RALPH APPROVES: Your Sovereign Agents are battle-ready!');
    } else if (this.criticalIssues.length > 0) {
      this.log('error', '💥 RALPH DEMANDS FIXES: Critical issues found!');
      this.criticalIssues.forEach(issue => {
        this.log('error', `  - ${issue.testName}: ${issue.error}`);
      });
    } else {
      this.log('warn', '⚠️ RALPH SAYS: Some tests failed but system is functional');
    }
    
    return this.results;
  }
}

// Auto-run if called directly
if (require.main === module) {
  const ralph = new RalphSovereignAgentBasher();
  ralph.runCompleteBasher()
    .then(results => {
      console.log('\\n📊 RALPH\\'S COMPLETE TEST RESULTS:');
      console.log(JSON.stringify(results, null, 2));
      process.exit(results.summary.criticalIssues > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 RALPH\\'S BASHER CRASHED:', error);
      process.exit(1);
    });
}

module.exports = RalphSovereignAgentBasher;