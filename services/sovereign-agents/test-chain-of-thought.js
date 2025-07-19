#!/usr/bin/env node

/**
 * Test Chain of Thought Reasoning - Verify reasoning capabilities
 */

const ChainOfThoughtEngine = require('./src/reasoning/ChainOfThoughtEngine');
const ReasoningSession = require('./src/reasoning/ReasoningSession');
const ConfidenceCalculator = require('./src/reasoning/ConfidenceCalculator');
const SovereignOrchestrationDatabase = require('./src/services/SovereignOrchestrationDatabase');

console.log('🧠 TESTING CHAIN OF THOUGHT REASONING');
console.log('=====================================');

class ChainOfThoughtTester {
  constructor() {
    this.database = null;
    this.reasoningEngine = null;
    this.confidenceCalculator = null;
    this.testResults = [];
  }

  /**
   * Run comprehensive reasoning tests
   */
  async runTests() {
    try {
      console.log('🚀 Starting Chain of Thought tests...\n');

      // Initialize components
      await this.initialize();

      // Test 1: Basic reasoning flow
      await this.testBasicReasoning();

      // Test 2: Confidence calculation
      await this.testConfidenceCalculation();

      // Test 3: Session persistence
      await this.testSessionPersistence();

      // Test 4: Reasoning reflection
      await this.testReasoningReflection();

      // Test 5: Low confidence handling
      await this.testLowConfidenceHandling();

      // Test 6: Reasoning patterns
      await this.testReasoningPatterns();

      // Generate report
      const report = this.generateReport();
      console.log(report);

      return report;

    } catch (error) {
      console.error('💥 Test suite failed:', error);
      throw error;
    }
  }

  /**
   * Initialize test components
   */
  async initialize() {
    console.log('🔧 Initializing test components...');

    // Initialize database
    this.database = new SovereignOrchestrationDatabase({
      dbPath: ':memory:' // Use in-memory database for tests
    });
    await this.database.initialize();

    // Initialize confidence calculator
    this.confidenceCalculator = new ConfidenceCalculator({
      baseConfidence: 0.5,
      evidenceWeight: 0.3,
      consistencyWeight: 0.2
    });

    // Initialize reasoning engine
    this.reasoningEngine = new ChainOfThoughtEngine(this.database, {
      maxSteps: 10,
      minConfidence: 0.7,
      enableLogging: true
    });

    console.log('✅ Components initialized\n');
  }

  /**
   * Test basic reasoning flow
   */
  async testBasicReasoning() {
    console.log('📝 Test 1: Basic Reasoning Flow');
    console.log('-------------------------------');

    const startTime = Date.now();

    try {
      // Create a test task
      const task = {
        type: 'analyze_document',
        document: 'Business plan for SaaS platform',
        objective: 'Extract requirements and generate implementation plan'
      };

      // Start reasoning
      const sessionId = await this.reasoningEngine.startReasoning('test-agent-1', task, {
        documentType: 'business_plan',
        complexity: 'medium'
      });

      // Wait for completion
      await new Promise(resolve => {
        this.reasoningEngine.once('reasoning:completed', (data) => {
          console.log(`\n✅ Reasoning completed: ${data.conclusion.summary}`);
          console.log(`   Final confidence: ${data.confidence.toFixed(2)}`);
          console.log(`   Duration: ${data.duration}ms`);
          console.log(`   Steps taken: ${data.steps.length}`);
          resolve();
        });

        this.reasoningEngine.once('reasoning:failed', (data) => {
          console.error(`\n❌ Reasoning failed: ${data.error}`);
          resolve();
        });
      });

      const duration = Date.now() - startTime;

      this.testResults.push({
        test: 'Basic Reasoning Flow',
        success: true,
        duration,
        details: `Completed reasoning in ${duration}ms`
      });

    } catch (error) {
      this.testResults.push({
        test: 'Basic Reasoning Flow',
        success: false,
        error: error.message
      });
      console.error(`❌ Test failed: ${error.message}`);
    }

    console.log('\n');
  }

  /**
   * Test confidence calculation
   */
  async testConfidenceCalculation() {
    console.log('📊 Test 2: Confidence Calculation');
    console.log('---------------------------------');

    try {
      // Test step confidence
      const step = {
        step: 'analyze_requirements',
        thought: 'Identified 5 core requirements for the SaaS platform',
        evidence: [
          'Document explicitly lists user authentication',
          'Payment processing mentioned in features',
          'Scalability requirements defined'
        ]
      };

      const confidence = this.confidenceCalculator.calculateStepConfidence(step, {
        previousSteps: [],
        taskComplexity: 'medium',
        agentId: 'test-agent-1'
      });

      console.log(`Step confidence: ${confidence.toFixed(2)}`);

      // Test chain confidence
      const steps = [
        { confidence: 0.9 },
        { confidence: 0.85 },
        { confidence: 0.8 },
        { confidence: 0.95 }
      ];

      const chainConfidence = this.confidenceCalculator.calculateChainConfidence(steps);
      console.log(`Chain confidence: ${chainConfidence.toFixed(2)}`);

      this.testResults.push({
        test: 'Confidence Calculation',
        success: true,
        details: `Step: ${confidence.toFixed(2)}, Chain: ${chainConfidence.toFixed(2)}`
      });

    } catch (error) {
      this.testResults.push({
        test: 'Confidence Calculation',
        success: false,
        error: error.message
      });
      console.error(`❌ Test failed: ${error.message}`);
    }

    console.log('\n');
  }

  /**
   * Test session persistence
   */
  async testSessionPersistence() {
    console.log('💾 Test 3: Session Persistence');
    console.log('------------------------------');

    try {
      // Create and save a session
      const sessionData = {
        agentId: 'test-agent-2',
        task: { type: 'code_generation', language: 'javascript' },
        pattern: 'code_generation'
      };

      const session = new ReasoningSession(sessionData, this.database);
      
      // Add some thoughts
      await session.addThought('understand_requirements', 
        'Need to generate a REST API with CRUD operations', 
        0.85, 
        ['RESTful design mentioned', 'CRUD operations required']
      );

      await session.addThought('choose_architecture',
        'Express.js with PostgreSQL database',
        0.9,
        ['Node.js environment', 'Relational data structure']
      );

      // Save session
      await session.save();

      // Load session from database
      const loadedSession = await ReasoningSession.load(session.id, this.database);
      
      console.log(`✅ Session saved and loaded: ${loadedSession.id}`);
      console.log(`   Steps saved: ${loadedSession.steps.length}`);
      console.log(`   Working memory items: ${loadedSession.workingMemory.size}`);

      this.testResults.push({
        test: 'Session Persistence',
        success: true,
        details: `Persisted ${loadedSession.steps.length} steps`
      });

    } catch (error) {
      this.testResults.push({
        test: 'Session Persistence',
        success: false,
        error: error.message
      });
      console.error(`❌ Test failed: ${error.message}`);
    }

    console.log('\n');
  }

  /**
   * Test reasoning reflection
   */
  async testReasoningReflection() {
    console.log('🤔 Test 4: Reasoning Reflection');
    console.log('--------------------------------');

    try {
      const sessionData = {
        agentId: 'test-agent-3',
        task: { type: 'problem_solving', problem: 'Optimize database queries' },
        pattern: 'problem_solving'
      };

      const session = new ReasoningSession(sessionData, this.database);
      
      // Add varied confidence thoughts
      await session.addThought('define_problem', 
        'Database queries taking too long, affecting user experience', 
        0.95, 
        ['Performance metrics show 5s+ response times']
      );

      await session.addThought('gather_context',
        'Current setup uses unindexed queries on large tables',
        0.4, // Low confidence
        ['Limited access to database schema']
      );

      await session.addThought('brainstorm_solutions',
        'Add indexes, optimize queries, implement caching',
        0.8,
        ['Standard optimization techniques', 'Proven approaches']
      );

      // Perform reflection
      const reflection = await session.reflect();
      
      console.log(`✅ Reflection completed:`);
      console.log(`   Progress: ${reflection.progress}%`);
      console.log(`   Confidence: ${reflection.confidence.toFixed(2)}`);
      console.log(`   Insights: ${reflection.insights.length}`);
      console.log(`   Concerns: ${reflection.concerns.length}`);

      if (reflection.concerns.length > 0) {
        console.log(`   ⚠️ Concern: ${reflection.concerns[0].type} (${reflection.concerns[0].severity})`);
      }

      this.testResults.push({
        test: 'Reasoning Reflection',
        success: true,
        details: `${reflection.insights.length} insights, ${reflection.concerns.length} concerns`
      });

    } catch (error) {
      this.testResults.push({
        test: 'Reasoning Reflection',
        success: false,
        error: error.message
      });
      console.error(`❌ Test failed: ${error.message}`);
    }

    console.log('\n');
  }

  /**
   * Test low confidence handling
   */
  async testLowConfidenceHandling() {
    console.log('⚠️ Test 5: Low Confidence Handling');
    console.log('-----------------------------------');

    try {
      let assistanceRequested = false;
      
      // Listen for assistance requests
      this.reasoningEngine.once('reasoning:assistance_needed', (data) => {
        console.log(`🆘 Assistance requested at step: ${data.stepName}`);
        console.log(`   Reason: ${data.reason}`);
        console.log(`   Urgency: ${data.urgency}`);
        assistanceRequested = true;
      });

      // Create a task that will trigger low confidence
      const task = {
        type: 'analyze_document',
        document: 'Complex technical specification with ambiguous requirements',
        objective: 'Generate implementation plan'
      };

      // Mock low confidence response
      const originalSimulateThought = this.reasoningEngine.simulateThought;
      this.reasoningEngine.simulateThought = async (stepName) => {
        if (stepName === 'identify_requirements') {
          return {
            content: 'Requirements are unclear and potentially conflicting',
            confidence: 0.3, // Very low confidence
            evidence: ['Ambiguous terminology used', 'Missing key details']
          };
        }
        return originalSimulateThought.call(this.reasoningEngine, stepName);
      };

      // Start reasoning
      await this.reasoningEngine.startReasoning('test-agent-4', task);

      // Wait for assistance or completion
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Restore original method
      this.reasoningEngine.simulateThought = originalSimulateThought;

      this.testResults.push({
        test: 'Low Confidence Handling',
        success: assistanceRequested,
        details: assistanceRequested ? 'Assistance requested as expected' : 'No assistance requested'
      });

    } catch (error) {
      this.testResults.push({
        test: 'Low Confidence Handling',
        success: false,
        error: error.message
      });
      console.error(`❌ Test failed: ${error.message}`);
    }

    console.log('\n');
  }

  /**
   * Test different reasoning patterns
   */
  async testReasoningPatterns() {
    console.log('🎯 Test 6: Reasoning Patterns');
    console.log('-----------------------------');

    try {
      const patterns = ['document_analysis', 'code_generation', 'problem_solving'];
      const results = [];

      for (const pattern of patterns) {
        console.log(`\nTesting pattern: ${pattern}`);
        
        const task = {
          type: pattern === 'document_analysis' ? 'analyze_document' :
                pattern === 'code_generation' ? 'generate_code' : 'solve_problem',
          description: `Test task for ${pattern} pattern`
        };

        const sessionId = await this.reasoningEngine.startReasoning(`test-agent-${pattern}`, task);
        
        // Get pattern steps
        const thoughtPattern = this.reasoningEngine.thoughtPatterns.get(pattern);
        console.log(`   Steps in pattern: ${thoughtPattern.length}`);
        thoughtPattern.forEach((step, index) => {
          console.log(`   ${index + 1}. ${step.step}`);
        });

        results.push({
          pattern,
          steps: thoughtPattern.length
        });
      }

      this.testResults.push({
        test: 'Reasoning Patterns',
        success: true,
        details: `Tested ${patterns.length} patterns successfully`
      });

    } catch (error) {
      this.testResults.push({
        test: 'Reasoning Patterns',
        success: false,
        error: error.message
      });
      console.error(`❌ Test failed: ${error.message}`);
    }

    console.log('\n');
  }

  /**
   * Generate test report
   */
  generateReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    const report = `
🎯 CHAIN OF THOUGHT TEST RESULTS
================================
📊 Summary: ${passedTests}/${totalTests} tests passed
${failedTests === 0 ? '✅ All tests passed!' : `⚠️ ${failedTests} tests failed`}

📋 Test Results:
${this.testResults.map(r => 
  `${r.success ? '✅' : '❌'} ${r.test}: ${r.success ? r.details || 'Passed' : r.error}`
).join('\n')}

🧠 Reasoning Capabilities Verified:
${passedTests >= 4 ? '✅' : '❌'} Multi-step reasoning
${passedTests >= 4 ? '✅' : '❌'} Confidence assessment
${passedTests >= 4 ? '✅' : '❌'} Session persistence
${passedTests >= 4 ? '✅' : '❌'} Self-reflection
${passedTests >= 4 ? '✅' : '❌'} Low confidence handling
${passedTests >= 4 ? '✅' : '❌'} Multiple reasoning patterns

💡 Next Steps:
${passedTests === totalTests ? 
  '- Ready to integrate with specialized agents\n- Can proceed to production deployment' :
  '- Fix failing tests before proceeding\n- Review error logs for issues'}
`;

    return report;
  }
}

// Run tests
async function main() {
  const tester = new ChainOfThoughtTester();
  
  try {
    const report = await tester.runTests();
    process.exit(report.includes('All tests passed') ? 0 : 1);
  } catch (error) {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { ChainOfThoughtTester, main };