#!/usr/bin/env node

/**
 * Register AI Analysis Service - Integrate AI analysis pipeline with Sovereign Agents
 */

const path = require('path');
const fs = require('fs').promises;

// Import core components
const EventBus = require('./src/eventbus/EventBus');
const EventRouter = require('./src/eventbus/EventRouter');
const ActionRegistry = require('./src/actions/ActionRegistry');
const AIAnalysisService = require('./src/ai/AIAnalysisService');

console.log('🧠 REGISTERING AI ANALYSIS SERVICE WITH SOVEREIGN AGENTS');
console.log('========================================================');

class AIAnalysisRegistrar {
  constructor() {
    this.eventBus = null;
    this.eventRouter = null;
    this.actionRegistry = null;
    this.aiAnalysisService = null;
    this.isRegistered = false;
  }

  /**
   * Register AI Analysis Service
   */
  async register() {
    try {
      console.log('🚀 Starting AI Analysis Service registration...');

      // Step 1: Initialize Event Bus
      await this.initializeEventBus();

      // Step 2: Initialize Event Router
      await this.initializeEventRouter();

      // Step 3: Initialize Action Registry
      await this.initializeActionRegistry();

      // Step 4: Initialize AI Analysis Service
      await this.initializeAIAnalysisService();

      // Step 5: Register AI-specific event routes
      await this.setupAIEventRoutes();

      // Step 6: Test the integration
      await this.testIntegration();

      // Step 7: Save configuration
      await this.saveConfiguration();

      this.isRegistered = true;
      console.log('✅ AI Analysis Service registration completed successfully!');

      return {
        success: true,
        message: 'AI Analysis Service integrated with Sovereign Agents',
        services: {
          eventBus: 'connected',
          eventRouter: 'active',
          actionRegistry: 'loaded',
          aiAnalysisService: 'initialized'
        },
        actions: ['parseDocument', 'analyzeContent', 'extractInsights'],
        endpoints: {
          health: 'http://localhost:8085/ai/health',
          metrics: 'http://localhost:8085/ai/metrics',
          actions: 'http://localhost:8085/actions/ai_analysis'
        }
      };

    } catch (error) {
      console.error('❌ AI Analysis Service registration failed:', error);
      throw error;
    }
  }

  /**
   * Initialize Event Bus
   */
  async initializeEventBus() {
    console.log('📡 Initializing Event Bus...');

    this.eventBus = new EventBus({
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      namespace: 'sovereign-agents',
      enableMetrics: true,
      retryAttempts: 3
    });

    await this.eventBus.initialize();
    console.log('✅ Event Bus initialized');
  }

  /**
   * Initialize Event Router
   */
  async initializeEventRouter() {
    console.log('🔀 Initializing Event Router...');

    this.eventRouter = new EventRouter(this.eventBus, {
      enableRoundRobin: true,
      enablePriority: true,
      maxConcurrentEvents: 10,
      eventTimeout: 30000
    });

    await this.eventRouter.initialize();
    console.log('✅ Event Router initialized');
  }

  /**
   * Initialize Action Registry
   */
  async initializeActionRegistry() {
    console.log('📋 Initializing Action Registry...');

    this.actionRegistry = new ActionRegistry(this.eventRouter, {
      maxConcurrentActions: 5,
      actionTimeout: 300000, // 5 minutes for AI operations
      enableRollback: true,
      enableMetrics: true
    });

    await this.actionRegistry.initialize();
    console.log('✅ Action Registry initialized');
  }

  /**
   * Initialize AI Analysis Service
   */
  async initializeAIAnalysisService() {
    console.log('🧠 Initializing AI Analysis Service...');

    this.aiAnalysisService = new AIAnalysisService(
      this.eventRouter, 
      this.actionRegistry,
      {
        tempDirectory: path.join(__dirname, 'temp', 'ai-analysis'),
        enableOllama: true,
        enableCloudFallback: true,
        confidenceThreshold: 0.7,
        costBudget: 10.0, // $10 per session
        maxConcurrentAnalyses: 3,
        ollamaUrl: process.env.OLLAMA_URL || 'http://localhost:11434',
        enableMetrics: true,
        enableCaching: true
      }
    );

    await this.aiAnalysisService.initialize();
    console.log('✅ AI Analysis Service initialized');
  }

  /**
   * Setup AI-specific event routes
   */
  async setupAIEventRoutes() {
    console.log('🛤️ Setting up AI event routes...');

    // Route for document upload events (from Document Generator)
    await this.eventRouter.addRoute('document.uploaded', async (event) => {
      console.log(`📄 Document uploaded: ${event.data.filename}`);
      
      // Trigger AI analysis if document is suitable
      if (this.shouldAnalyzeDocument(event.data)) {
        await this.triggerDocumentAnalysis(event.data);
      }
    }, { priority: 'high' });

    // Route for analysis completion events
    await this.eventRouter.addRoute('ai.analysis.completed', async (event) => {
      console.log(`✅ AI analysis completed: ${event.data.filename}`);
      
      // Publish results to interested agents
      await this.publishAnalysisResults(event.data);
    }, { priority: 'medium' });

    // Route for analysis failure events
    await this.eventRouter.addRoute('ai.analysis.failed', async (event) => {
      console.log(`❌ AI analysis failed: ${event.data.filename || 'unknown'}`);
      
      // Handle analysis failures
      await this.handleAnalysisFailure(event.data);
    }, { priority: 'high' });

    // Route for human approval requests (for large files)
    await this.eventRouter.addRoute('human.approval.requested', async (event) => {
      console.log(`👤 Human approval requested: ${event.data.action}`);
      
      // Route to human conductor interface
      await this.routeApprovalRequest(event.data);
    }, { priority: 'critical' });

    console.log('✅ AI event routes configured');
  }

  /**
   * Determine if document should be analyzed
   */
  shouldAnalyzeDocument(documentData) {
    const { filename, size, format } = documentData;

    // Skip very small files
    if (size < 1024) { // Less than 1KB
      return false;
    }

    // Skip unsupported formats
    const supportedFormats = ['txt', 'md', 'json', 'csv', 'log', 'chat', 'zip'];
    if (format && !supportedFormats.includes(format.toLowerCase())) {
      return false;
    }

    // Analyze if looks like business document
    const businessKeywords = ['plan', 'spec', 'requirement', 'proposal', 'design', 'architecture'];
    const lowerFilename = filename.toLowerCase();
    
    return businessKeywords.some(keyword => lowerFilename.includes(keyword)) || size > 10000; // > 10KB
  }

  /**
   * Trigger document analysis
   */
  async triggerDocumentAnalysis(documentData) {
    try {
      console.log(`🔬 Triggering AI analysis for: ${documentData.filename}`);

      // Execute analysis action
      const result = await this.actionRegistry.executeAction('parseDocument', {
        documentId: documentData.documentId,
        filename: documentData.filename,
        format: documentData.format
      }, {
        executedBy: 'ai-analysis-registrar',
        correlationId: documentData.documentId,
        priority: 'high'
      });

      console.log(`✅ Analysis triggered successfully: ${documentData.filename}`);
      return result;

    } catch (error) {
      console.error(`❌ Failed to trigger analysis for ${documentData.filename}:`, error);
      
      // Publish failure event
      await this.eventRouter.publish('ai.analysis.trigger.failed', {
        documentId: documentData.documentId,
        filename: documentData.filename,
        error: error.message
      });
    }
  }

  /**
   * Publish analysis results to interested systems
   */
  async publishAnalysisResults(analysisData) {
    try {
      // Publish to template matching service
      await this.eventRouter.publish('template.matching.input', {
        analysisId: analysisData.analysisId,
        documentId: analysisData.documentId,
        analysisResults: analysisData,
        source: 'ai-analysis-service'
      });

      // Publish to code generation service
      if (analysisData.recommendations) {
        await this.eventRouter.publish('code.generation.input', {
          analysisId: analysisData.analysisId,
          documentId: analysisData.documentId,
          requirements: analysisData.analysis?.summary?.requirements,
          architecture: analysisData.analysis?.summary?.architecture,
          source: 'ai-analysis-service'
        });
      }

      // Publish general analysis completion
      await this.eventRouter.publish('document.processing.step.completed', {
        step: 'ai_analysis',
        documentId: analysisData.documentId,
        results: analysisData,
        nextSteps: this.determineNextSteps(analysisData)
      });

    } catch (error) {
      console.error('❌ Failed to publish analysis results:', error);
    }
  }

  /**
   * Handle analysis failures
   */
  async handleAnalysisFailure(failureData) {
    try {
      // Log failure for investigation
      console.error(`🔍 Analysis failure details:`, failureData);

      // Publish to error handling system
      await this.eventRouter.publish('system.error', {
        errorType: 'ai_analysis_failure',
        errorMessage: failureData.error,
        context: failureData,
        severity: 'medium',
        source: 'ai-analysis-service'
      });

      // Attempt recovery if possible
      if (failureData.retryable !== false) {
        console.log(`🔄 Attempting analysis recovery for: ${failureData.filename}`);
        // Could implement retry logic here
      }

    } catch (error) {
      console.error('❌ Failed to handle analysis failure:', error);
    }
  }

  /**
   * Route approval request to human conductor
   */
  async routeApprovalRequest(approvalData) {
    try {
      // Publish to human conductor interface
      await this.eventRouter.publish('human.conductor.approval.needed', {
        requestId: approvalData.requestId,
        processId: approvalData.processId,
        action: approvalData.action,
        reason: approvalData.reason,
        urgency: approvalData.urgency || 'normal',
        context: approvalData,
        source: 'ai-analysis-service'
      });

      console.log(`👤 Approval request routed: ${approvalData.requestId}`);

    } catch (error) {
      console.error('❌ Failed to route approval request:', error);
    }
  }

  /**
   * Determine next processing steps
   */
  determineNextSteps(analysisData) {
    const nextSteps = [];

    if (analysisData.analysis?.confidence > 0.8) {
      nextSteps.push('template_matching');
    }

    if (analysisData.analysis?.summary?.requirements) {
      nextSteps.push('requirement_validation');
    }

    if (analysisData.analysis?.summary?.architecture) {
      nextSteps.push('architecture_planning');
    }

    if (analysisData.recommendations?.length > 0) {
      nextSteps.push('recommendation_review');
    }

    return nextSteps.length > 0 ? nextSteps : ['manual_review'];
  }

  /**
   * Test the integration
   */
  async testIntegration() {
    console.log('🧪 Testing AI Analysis Service integration...');

    try {
      // Test 1: Health check
      const health = await this.aiAnalysisService.healthCheck();
      if (!health.healthy) {
        throw new Error('AI Analysis Service health check failed');
      }
      console.log('✅ Health check passed');

      // Test 2: Action registry
      const actions = await this.actionRegistry.getActions();
      const aiActions = actions.filter(a => a.category === 'ai_analysis');
      if (aiActions.length < 3) {
        throw new Error('AI analysis actions not properly registered');
      }
      console.log(`✅ ${aiActions.length} AI actions registered`);

      // Test 3: Event routing
      await this.eventRouter.publish('test.ai.integration', {
        message: 'Integration test',
        timestamp: new Date().toISOString()
      });
      console.log('✅ Event publishing works');

      // Test 4: Content analysis
      const testResult = await this.actionRegistry.executeAction('analyzeContent', {
        content: {
          text: 'This is a test business plan for a SaaS application.',
          metadata: { type: 'test' }
        },
        analysisType: 'business'
      }, {
        executedBy: 'integration-test',
        correlationId: 'test-' + Date.now()
      });

      if (!testResult.success) {
        throw new Error('Content analysis test failed');
      }
      console.log('✅ Content analysis test passed');

      console.log('🎉 All integration tests passed!');

    } catch (error) {
      console.error('❌ Integration test failed:', error);
      throw error;
    }
  }

  /**
   * Save configuration for future use
   */
  async saveConfiguration() {
    const config = {
      aiAnalysisService: {
        version: '1.0.0',
        registeredAt: new Date().toISOString(),
        actions: ['parseDocument', 'analyzeContent', 'extractInsights'],
        eventRoutes: [
          'document.uploaded',
          'ai.analysis.completed', 
          'ai.analysis.failed',
          'human.approval.requested'
        ],
        settings: {
          maxConcurrentAnalyses: 3,
          confidenceThreshold: 0.7,
          enableOllama: true,
          enableCloudFallback: true
        }
      }
    };

    const configPath = path.join(__dirname, 'config', 'ai-analysis-config.json');
    
    try {
      await fs.mkdir(path.dirname(configPath), { recursive: true });
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      console.log(`💾 Configuration saved: ${configPath}`);
    } catch (error) {
      console.warn('⚠️ Failed to save configuration:', error.message);
    }
  }

  /**
   * Get registration status
   */
  getStatus() {
    return {
      registered: this.isRegistered,
      components: {
        eventBus: this.eventBus ? 'connected' : 'not_initialized',
        eventRouter: this.eventRouter ? 'active' : 'not_initialized',
        actionRegistry: this.actionRegistry ? 'loaded' : 'not_initialized',
        aiAnalysisService: this.aiAnalysisService ? 'initialized' : 'not_initialized'
      },
      metrics: this.aiAnalysisService ? this.aiAnalysisService.getMetrics() : null
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('🧹 Cleaning up AI Analysis Service registration...');

    try {
      if (this.aiAnalysisService) {
        await this.aiAnalysisService.shutdown();
      }

      if (this.actionRegistry) {
        await this.actionRegistry.cleanup();
      }

      if (this.eventRouter) {
        await this.eventRouter.cleanup();
      }

      if (this.eventBus) {
        await this.eventBus.cleanup();
      }

      console.log('✅ Cleanup completed');

    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }
}

// Main execution function
async function main() {
  const registrar = new AIAnalysisRegistrar();

  try {
    // Handle process signals
    process.on('SIGINT', async () => {
      console.log('\n🔄 Received SIGINT, cleaning up...');
      await registrar.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🔄 Received SIGTERM, cleaning up...');
      await registrar.cleanup();
      process.exit(0);
    });

    // Register the service
    const result = await registrar.register();
    
    console.log('\n🎯 REGISTRATION RESULTS');
    console.log('=====================');
    console.log(JSON.stringify(result, null, 2));

    // Keep the service running if executed directly
    if (require.main === module) {
      console.log('\n🔄 AI Analysis Service is running...');
      console.log('Press Ctrl+C to stop');
      
      // Keep alive
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', process.exit.bind(process, 0));
    }

    return result;

  } catch (error) {
    console.error('\n💥 REGISTRATION FAILED');
    console.error('======================');
    console.error(error);
    
    await registrar.cleanup();
    process.exit(1);
  }
}

// Export for use as module
module.exports = { AIAnalysisRegistrar, main };

// Execute if run directly
if (require.main === module) {
  main();
}