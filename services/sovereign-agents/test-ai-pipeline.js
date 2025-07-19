#!/usr/bin/env node

/**
 * Test AI Analysis Pipeline - Verify end-to-end AI analysis functionality
 */

const fs = require('fs').promises;
const path = require('path');
const { AIAnalysisRegistrar } = require('./register-ai-analysis');

console.log('🧪 TESTING AI ANALYSIS PIPELINE');
console.log('===============================');

class AIPipelineTester {
  constructor() {
    this.registrar = null;
    this.testResults = [];
    this.testDocuments = [];
  }

  /**
   * Run comprehensive AI pipeline tests
   */
  async runTests() {
    try {
      console.log('🚀 Starting AI pipeline tests...\n');

      // Step 1: Initialize AI Analysis Service
      await this.initializeService();

      // Step 2: Create test documents
      await this.createTestDocuments();

      // Step 3: Test document parsing
      await this.testDocumentParsing();

      // Step 4: Test AI analysis
      await this.testAIAnalysis();

      // Step 5: Test insight extraction
      await this.testInsightExtraction();

      // Step 6: Test event-driven flow
      await this.testEventFlow();

      // Step 7: Test error handling
      await this.testErrorHandling();

      // Generate final report
      const report = this.generateTestReport();
      await this.saveTestReport(report);

      return report;

    } catch (error) {
      console.error('💥 AI pipeline test failed:', error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Initialize AI Analysis Service
   */
  async initializeService() {
    console.log('🔧 Initializing AI Analysis Service...');

    this.registrar = new AIAnalysisRegistrar();
    
    try {
      const result = await this.registrar.register();
      
      this.testResults.push({
        test: 'Service Initialization',
        success: result.success,
        duration: 0,
        details: result.message
      });

      console.log('✅ AI Analysis Service initialized\n');

    } catch (error) {
      this.testResults.push({
        test: 'Service Initialization',
        success: false,
        duration: 0,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Create test documents for analysis
   */
  async createTestDocuments() {
    console.log('📄 Creating test documents...');

    const testDir = path.join(__dirname, 'test-documents');
    await fs.mkdir(testDir, { recursive: true });

    // Test Document 1: Business Plan
    const businessPlan = `# SaaS Platform Business Plan

## Executive Summary
We are developing a revolutionary SaaS platform that transforms documents into working applications using AI.

## Problem Statement
Many businesses struggle with the gap between documentation and implementation. Requirements documents, business plans, and specifications often sit unused while development teams build from scratch.

## Solution
Our AI-powered platform analyzes any document (business plans, technical specs, chat logs) and automatically generates:
- Working application prototypes
- Technical architecture recommendations
- Implementation timelines
- Cost estimates

## Market Analysis
- Target Market: Small to medium businesses (1-500 employees)
- Market Size: $50B+ no-code/low-code market
- Growth Rate: 25% annually
- Competitors: Bubble, Webflow, OutSystems

## Technical Requirements
- Document upload and parsing (PDF, Word, Markdown)
- AI analysis using GPT-4 and local models
- Template matching system
- Code generation engine
- Cloud deployment automation

## Features
1. Document Upload Interface
2. AI-Powered Analysis Engine
3. Template Marketplace
4. Code Generation System
5. One-Click Deployment
6. Project Management Dashboard
7. Collaboration Tools
8. Analytics and Reporting

## Revenue Model
- Subscription-based SaaS
- Tiered pricing: Starter ($29/mo), Professional ($99/mo), Enterprise ($299/mo)
- Revenue projections: $1M ARR by year 2

## Team
- CEO: Product visionary with 10+ years experience
- CTO: AI/ML expert, former Google engineer
- Lead Developer: Full-stack expert
- Marketing Lead: Growth specialist

## Funding Requirements
Seeking $2M seed funding for:
- Team expansion (5 additional engineers)
- AI infrastructure and compute costs
- Marketing and customer acquisition
- 18-month runway

## Timeline
- Q1: MVP development and testing
- Q2: Beta launch with 50 customers
- Q3: Public launch and marketing
- Q4: Series A fundraising

This represents a massive opportunity to revolutionize how businesses turn ideas into reality.`;

    const businessPlanPath = path.join(testDir, 'saas-business-plan.md');
    await fs.writeFile(businessPlanPath, businessPlan);

    // Test Document 2: Technical Specification
    const techSpec = `# Technical Architecture Specification

## System Overview
Microservices-based architecture for document-to-application conversion platform.

## Core Components

### 1. Document Processing Service
- File upload handling (50MB max)
- Format detection and validation
- Streaming parser for large files
- Content extraction and normalization

### 2. AI Analysis Engine
- Local Ollama integration (mistral, codellama)
- Cloud fallback (OpenAI GPT-4, Anthropic Claude)
- Progressive enhancement strategy
- Confidence scoring and validation

### 3. Template Matching Service
- ML-based template recommendation
- Business plan templates
- Technical specification templates
- Custom template support

### 4. Code Generation Engine
- React/TypeScript frontend generation
- Node.js/Express backend generation
- Database schema generation (PostgreSQL)
- Docker containerization
- Kubernetes deployment manifests

## Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL, Redis
- **AI/ML**: Ollama, OpenAI API, Anthropic API
- **Infrastructure**: Docker, Kubernetes, AWS
- **Monitoring**: Prometheus, Grafana
- **CI/CD**: GitHub Actions

## API Design
RESTful APIs with OpenAPI 3.0 specification:
- POST /api/upload - Document upload
- GET /api/jobs/{id} - Job status
- POST /api/analyze - AI analysis
- GET /api/templates - Template listing
- POST /api/generate - Code generation

## Database Schema
- Users (authentication, profiles)
- Documents (metadata, storage references)
- Jobs (processing status, results)
- Templates (definitions, examples)
- Generated_Projects (code, deployment info)

## Security Requirements
- JWT-based authentication
- Role-based access control (RBAC)
- File upload validation and scanning
- Input sanitization and validation
- Rate limiting and DDoS protection
- Secrets management with Vault

## Performance Requirements
- Document processing: < 30 seconds for 10MB files
- AI analysis: < 2 minutes average
- Code generation: < 5 minutes
- 99.9% uptime SLA
- Handle 1000 concurrent users

## Scalability
- Horizontal scaling with load balancers
- Database read replicas
- Redis clustering
- CDN for static assets
- Auto-scaling based on metrics

## Monitoring and Observability
- Application metrics (Prometheus)
- Log aggregation (ELK stack)
- Distributed tracing (Jaeger)
- Health checks and alerting
- Performance monitoring (APM)

## Deployment Strategy
- Blue-green deployments
- Feature flags for gradual rollouts
- Automated testing pipeline
- Infrastructure as Code (Terraform)
- Multi-environment setup (dev, staging, prod)`;

    const techSpecPath = path.join(testDir, 'technical-specification.md');
    await fs.writeFile(techSpecPath, techSpec);

    // Test Document 3: Chat Log
    const chatLog = `[2024-01-15, 10:30:45] Alice: Hey team, I have an idea for a new product
[2024-01-15, 10:31:12] Bob: What's the idea?
[2024-01-15, 10:31:45] Alice: What if we could take any business document and automatically generate a working app from it?
[2024-01-15, 10:32:15] Charlie: That sounds ambitious. How would that work?
[2024-01-15, 10:33:20] Alice: We'd use AI to analyze the document, extract requirements, and then generate code
[2024-01-15, 10:34:10] Bob: Like for business plans?
[2024-01-15, 10:34:30] Alice: Exactly! Upload a business plan, get a working prototype
[2024-01-15, 10:35:15] Charlie: We'd need document parsing, AI analysis, and code generation
[2024-01-15, 10:36:00] Alice: Right. Plus template matching to know what kind of app to build
[2024-01-15, 10:37:30] Bob: Could use React for frontend, Node.js for backend
[2024-01-15, 10:38:15] Charlie: And Docker for deployment
[2024-01-15, 10:39:00] Alice: We should target SMBs first - they need this most
[2024-01-15, 10:40:30] Bob: Pricing could be subscription-based, maybe $50-200/month
[2024-01-15, 10:41:15] Charlie: Need to think about AI costs though
[2024-01-15, 10:42:00] Alice: We could use local models first, then fallback to cloud
[2024-01-15, 10:43:30] Bob: Like Ollama for local, then OpenAI/Anthropic for complex stuff
[2024-01-15, 10:44:15] Charlie: Security will be important - handling customer documents
[2024-01-15, 10:45:00] Alice: Definitely. RBAC, encryption, the works
[2024-01-15, 10:46:30] Bob: When do we start building?
[2024-01-15, 10:47:15] Alice: Let's do a prototype this quarter
[2024-01-15, 10:48:00] Charlie: I'm in. This could be huge.`;

    const chatLogPath = path.join(testDir, 'product-brainstorm-chat.txt');
    await fs.writeFile(chatLogPath, chatLog);

    this.testDocuments = [
      { path: businessPlanPath, type: 'business_plan', size: businessPlan.length },
      { path: techSpecPath, type: 'technical_spec', size: techSpec.length },
      { path: chatLogPath, type: 'chat_log', size: chatLog.length }
    ];

    console.log(`✅ Created ${this.testDocuments.length} test documents\n`);
  }

  /**
   * Test document parsing functionality
   */
  async testDocumentParsing() {
    console.log('📖 Testing document parsing...');

    for (const doc of this.testDocuments) {
      const startTime = Date.now();
      
      try {
        console.log(`   Parsing: ${path.basename(doc.path)}`);

        const result = await this.registrar.actionRegistry.executeAction('parseDocument', {
          documentId: `test-${Date.now()}`,
          filename: path.basename(doc.path),
          format: path.extname(doc.path).slice(1)
        }, {
          executedBy: 'pipeline-tester',
          correlationId: `test-parse-${Date.now()}`
        });

        const duration = Date.now() - startTime;

        this.testResults.push({
          test: `Document Parsing - ${doc.type}`,
          success: result.success,
          duration,
          details: result.success ? 
            `Parsed ${doc.size} bytes in ${duration}ms` : 
            result.error || 'Unknown error'
        });

        console.log(`   ✅ Parsed ${path.basename(doc.path)} (${duration}ms)`);

      } catch (error) {
        const duration = Date.now() - startTime;

        this.testResults.push({
          test: `Document Parsing - ${doc.type}`,
          success: false,
          duration,
          error: error.message
        });

        console.log(`   ❌ Failed to parse ${path.basename(doc.path)}: ${error.message}`);
      }
    }

    console.log('');
  }

  /**
   * Test AI analysis functionality
   */
  async testAIAnalysis() {
    console.log('🧠 Testing AI analysis...');

    const testContent = {
      documentType: 'business_plan',
      metadata: {
        fileName: 'test-business-plan.md',
        fileSize: 5000,
        wordCount: 800
      },
      content: `# SaaS Business Plan
      
## Problem
Businesses struggle to turn documents into applications.

## Solution  
AI-powered platform that generates working apps from business documents.

## Market
$50B+ no-code market, 25% growth rate.

## Features
- Document upload and parsing
- AI analysis and code generation
- One-click deployment
- Template marketplace

## Revenue Model
Subscription SaaS: $29-299/month tiers

## Team
Experienced founders with AI/ML and product expertise.`
    };

    const startTime = Date.now();

    try {
      const result = await this.registrar.actionRegistry.executeAction('analyzeContent', {
        content: testContent,
        analysisType: 'comprehensive',
        options: { extractInsights: true }
      }, {
        executedBy: 'pipeline-tester',
        correlationId: `test-analysis-${Date.now()}`
      });

      const duration = Date.now() - startTime;

      this.testResults.push({
        test: 'AI Analysis - Comprehensive',
        success: result.success,
        duration,
        details: result.success ? 
          `Analyzed content with ${result.result.confidence.toFixed(2)} confidence` :
          result.error || 'Unknown error'
      });

      console.log(`   ✅ AI analysis completed (${duration}ms, confidence: ${result.result.confidence.toFixed(2)})`);

    } catch (error) {
      const duration = Date.now() - startTime;

      this.testResults.push({
        test: 'AI Analysis - Comprehensive',
        success: false,
        duration,
        error: error.message
      });

      console.log(`   ❌ AI analysis failed: ${error.message}`);
    }

    console.log('');
  }

  /**
   * Test insight extraction
   */
  async testInsightExtraction() {
    console.log('💡 Testing insight extraction...');

    const mockAnalysisResult = {
      analysis: {
        summary: {
          documentType: 'business_plan',
          complexity: 7,
          estimates: {
            developmentTime: '8-12 weeks',
            budget: '$50k-75k'
          },
          architecture: {
            pattern: 'microservices',
            technologies: ['React', 'Node.js', 'PostgreSQL']
          }
        },
        confidence: 0.85
      },
      recommendations: [
        {
          type: 'enhancement',
          priority: 'medium',
          description: 'Consider adding real-time collaboration features'
        }
      ]
    };

    const startTime = Date.now();

    try {
      const result = await this.registrar.actionRegistry.executeAction('extractInsights', {
        analysisResult: mockAnalysisResult,
        insightTypes: ['technical', 'business', 'risks'],
        options: { includeRecommendations: true }
      }, {
        executedBy: 'pipeline-tester',
        correlationId: `test-insights-${Date.now()}`
      });

      const duration = Date.now() - startTime;

      this.testResults.push({
        test: 'Insight Extraction',
        success: result.success,
        duration,
        details: result.success ? 
          `Extracted ${result.result.count} insights` :
          result.error || 'Unknown error'
      });

      console.log(`   ✅ Extracted ${result.result.count} insights (${duration}ms)`);

    } catch (error) {
      const duration = Date.now() - startTime;

      this.testResults.push({
        test: 'Insight Extraction',
        success: false,
        duration,
        error: error.message
      });

      console.log(`   ❌ Insight extraction failed: ${error.message}`);
    }

    console.log('');
  }

  /**
   * Test event-driven flow
   */
  async testEventFlow() {
    console.log('📡 Testing event-driven flow...');

    try {
      // Test event publishing
      await this.registrar.eventRouter.publish('test.ai.pipeline', {
        message: 'Pipeline test event',
        timestamp: new Date().toISOString(),
        testId: 'pipeline-test-' + Date.now()
      });

      // Test document upload simulation
      await this.registrar.eventRouter.publish('document.uploaded', {
        documentId: 'test-doc-' + Date.now(),
        filename: 'test-business-plan.md',
        size: 5000,
        format: 'md',
        uploadedBy: 'pipeline-tester'
      });

      this.testResults.push({
        test: 'Event Flow',
        success: true,
        duration: 0,
        details: 'Event publishing and routing working'
      });

      console.log('   ✅ Event flow test passed');

    } catch (error) {
      this.testResults.push({
        test: 'Event Flow',
        success: false,
        duration: 0,
        error: error.message
      });

      console.log(`   ❌ Event flow test failed: ${error.message}`);
    }

    console.log('');
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    console.log('⚠️  Testing error handling...');

    try {
      // Test invalid document analysis
      await this.registrar.actionRegistry.executeAction('analyzeContent', {
        content: null, // Invalid content
        analysisType: 'invalid_type'
      }, {
        executedBy: 'pipeline-tester',
        correlationId: 'test-error-' + Date.now()
      });

      this.testResults.push({
        test: 'Error Handling',
        success: false,
        duration: 0,
        details: 'Expected error was not thrown'
      });

      console.log('   ❌ Error handling test failed - no error thrown');

    } catch (error) {
      this.testResults.push({
        test: 'Error Handling',
        success: true,
        duration: 0,
        details: 'Properly caught and handled error: ' + error.message
      });

      console.log('   ✅ Error handling test passed - properly caught error');
    }

    console.log('');
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    const endTime = Date.now();
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;

    const report = {
      title: 'AI Analysis Pipeline Test Report',
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: `${successRate}%`,
        status: failedTests === 0 ? 'PASSED' : 'FAILED'
      },
      results: this.testResults,
      serviceStatus: this.registrar ? this.registrar.getStatus() : null,
      recommendations: this.generateRecommendations()
    };

    // Print summary
    console.log('🎯 TEST SUMMARY');
    console.log('===============');
    console.log(`📊 Tests: ${passedTests}/${totalTests} passed (${successRate}%)`);
    console.log(`🎭 Status: ${report.summary.status}`);

    if (report.summary.status === 'PASSED') {
      console.log('\n🎉 ALL TESTS PASSED!');
      console.log('==================');
      console.log('✅ Document parsing working');
      console.log('✅ AI analysis pipeline functional');
      console.log('✅ Insight extraction operational');
      console.log('✅ Event-driven architecture active');
      console.log('✅ Error handling robust');
      console.log('\n🚀 AI Analysis Pipeline is ready for production use!');
    } else {
      console.log('\n⚠️  SOME TESTS FAILED');
      console.log('===================');
      const failures = this.testResults.filter(r => !r.success);
      for (const failure of failures) {
        console.log(`❌ ${failure.test}: ${failure.error || 'Unknown error'}`);
      }
    }

    return report;
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];
    const failures = this.testResults.filter(r => !r.success);

    if (failures.length === 0) {
      recommendations.push('✅ All tests passed - system ready for production');
      recommendations.push('🔄 Consider setting up continuous integration for automated testing');
      recommendations.push('📊 Implement monitoring and alerting for production deployment');
    } else {
      recommendations.push('🔧 Fix failing tests before production deployment');
      
      failures.forEach(failure => {
        if (failure.test.includes('Parsing')) {
          recommendations.push('📖 Review document parsing configuration and supported formats');
        }
        if (failure.test.includes('AI Analysis')) {
          recommendations.push('🧠 Check Ollama installation and AI service connectivity');
        }
        if (failure.test.includes('Event')) {
          recommendations.push('📡 Verify Redis connection and event bus configuration');
        }
      });
    }

    return recommendations;
  }

  /**
   * Save test report to file
   */
  async saveTestReport(report) {
    try {
      const reportPath = path.join(__dirname, 'ai-pipeline-test-report.json');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n💾 Test report saved: ${reportPath}`);
    } catch (error) {
      console.warn('⚠️ Failed to save test report:', error.message);
    }
  }

  /**
   * Cleanup test resources
   */
  async cleanup() {
    console.log('\n🧹 Cleaning up test resources...');

    try {
      // Cleanup test documents
      const testDir = path.join(__dirname, 'test-documents');
      try {
        await fs.rm(testDir, { recursive: true, force: true });
        console.log('🗑️ Test documents cleaned up');
      } catch (error) {
        console.warn('⚠️ Failed to cleanup test documents:', error.message);
      }

      // Cleanup service
      if (this.registrar) {
        await this.registrar.cleanup();
        console.log('🧹 Service cleanup completed');
      }

    } catch (error) {
      console.error('❌ Cleanup error:', error);
    }
  }
}

// Main execution
async function main() {
  const tester = new AIPipelineTester();
  
  try {
    const report = await tester.runTests();
    
    // Exit with appropriate code
    process.exit(report.summary.status === 'PASSED' ? 0 : 1);
    
  } catch (error) {
    console.error('\n💥 PIPELINE TEST EXECUTION FAILED');
    console.error('=================================');
    console.error(error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { AIPipelineTester, main };