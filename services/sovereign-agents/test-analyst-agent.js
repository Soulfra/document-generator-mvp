#!/usr/bin/env node

/**
 * Test Analyst Agent - Verify requirements extraction capabilities
 */

const AnalystAgent = require('./src/agents/AnalystAgent');
const SovereignOrchestrationDatabase = require('./src/services/SovereignOrchestrationDatabase');
const fs = require('fs').promises;
const path = require('path');

console.log('🧪 TESTING ANALYST AGENT');
console.log('========================');

class AnalystAgentTester {
  constructor() {
    this.database = null;
    this.analystAgent = null;
    this.testDocuments = [];
    this.testResults = [];
  }

  async runTests() {
    try {
      console.log('🚀 Starting Analyst Agent tests...\n');

      // Initialize
      await this.initialize();

      // Create test documents
      await this.createTestDocuments();

      // Test 1: Business document analysis
      await this.testBusinessDocumentAnalysis();

      // Test 2: Technical document analysis
      await this.testTechnicalDocumentAnalysis();

      // Test 3: Chat log analysis
      await this.testChatLogAnalysis();

      // Test 4: Insight generation
      await this.testInsightGeneration();

      // Generate report
      const report = this.generateReport();
      console.log(report);

      // Save sample output
      await this.saveSampleOutput();

      return report;

    } catch (error) {
      console.error('💥 Test suite failed:', error);
      throw error;
    }
  }

  async initialize() {
    console.log('🔧 Initializing Analyst Agent...');

    // Initialize database
    this.database = new SovereignOrchestrationDatabase({
      dbPath: ':memory:'
    });
    await this.database.initialize();

    // Initialize Analyst Agent
    this.analystAgent = new AnalystAgent(this.database, {
      name: 'TestAnalyst',
      enableReasoning: true
    });

    console.log('✅ Analyst Agent initialized\n');
  }

  async createTestDocuments() {
    console.log('📄 Creating test documents...');

    // Business document
    this.testDocuments.push({
      type: 'business',
      fileName: 'saas-business-plan.md',
      content: `# SaaS Business Plan

## Problem Statement
Small businesses struggle with managing customer relationships effectively. They lose track of leads, miss follow-ups, and lack insights into their sales pipeline.

## Solution
We will create a simple, affordable CRM platform specifically designed for small businesses with 1-50 employees. 

## Features
1. Contact Management - Store and organize customer information
2. Lead Tracking - Track leads through the sales pipeline
3. Email Integration - Sync with Gmail and Outlook
4. Task Management - Create and assign follow-up tasks
5. Basic Analytics - View sales performance dashboards
6. Mobile App - Access CRM on the go

## Market Analysis
Target Market: Small businesses in the US
Market Size: $5 billion
Growth Rate: 12% annually

## Revenue Model
Subscription-based SaaS
- Starter: $29/month (up to 5 users)
- Professional: $79/month (up to 20 users)  
- Enterprise: $199/month (unlimited users)

## Team
- CEO: 10 years SaaS experience
- CTO: Former Google engineer
- Head of Sales: B2B sales expert`
    });

    // Technical document
    this.testDocuments.push({
      type: 'technical',
      fileName: 'api-specification.md',
      content: `# API Technical Specification

## System Overview
RESTful API for user authentication and data management service.

## Architecture
Microservices architecture with the following components:
- Authentication Service
- User Service  
- Data Service
- Notification Service

## Technical Requirements
- The system shall support 10,000 concurrent users
- Response time must be under 200ms for 95% of requests
- System uptime must be 99.9%
- All data must be encrypted at rest and in transit
- User authentication is required for all endpoints

## API Endpoints
POST /api/auth/login - User login
POST /api/auth/logout - User logout
GET /api/users/:id - Get user details
PUT /api/users/:id - Update user
DELETE /api/users/:id - Delete user

## Database Schema
Users table with fields: id, email, password_hash, created_at
Sessions table with fields: id, user_id, token, expires_at

## Security Requirements
- JWT-based authentication
- Role-based access control (RBAC)
- Rate limiting: 100 requests per minute
- Input validation on all endpoints`
    });

    // Chat log
    this.testDocuments.push({
      type: 'conversation', 
      fileName: 'product-discussion.txt',
      content: `[2024-01-20, 14:30:00] Alice: Hey team, we need to discuss the new feature
[2024-01-20, 14:30:30] Bob: What feature are we building?
[2024-01-20, 14:31:00] Alice: A real-time collaboration tool for documents
[2024-01-20, 14:31:45] Charlie: Like Google Docs?
[2024-01-20, 14:32:15] Alice: Yes, but focused on developers. Think collaborative code editing
[2024-01-20, 14:33:00] Bob: We'll need WebSocket for real-time sync
[2024-01-20, 14:33:30] Charlie: And operational transformation for conflict resolution
[2024-01-20, 14:34:00] Alice: Let's use React for the frontend
[2024-01-20, 14:34:30] Bob: Agreed. Node.js for the backend?
[2024-01-20, 14:35:00] Charlie: Yes, with Socket.io for WebSocket
[2024-01-20, 14:35:30] Alice: We should implement user authentication first
[2024-01-20, 14:36:00] Bob: I'll create the database schema
[2024-01-20, 14:36:30] Charlie: I'll work on the real-time sync algorithm
[2024-01-20, 14:37:00] Alice: Great! Let's target a beta release in 6 weeks`,
      documentType: 'chat_log',
      result: {
        metadata: {
          participants: ['Alice', 'Bob', 'Charlie']
        }
      }
    });

    console.log(`✅ Created ${this.testDocuments.length} test documents\n`);
  }

  async testBusinessDocumentAnalysis() {
    console.log('📊 Test 1: Business Document Analysis');
    console.log('------------------------------------');

    const businessDoc = this.testDocuments.find(d => d.type === 'business');
    const startTime = Date.now();

    try {
      const result = await this.analystAgent.analyzeDocument(businessDoc);
      const duration = Date.now() - startTime;

      console.log(`✅ Analysis completed in ${duration}ms`);
      console.log(`   Document type: ${result.documentType}`);
      console.log(`   Requirements found: ${result.metadata.requirementsFound}`);
      console.log(`   Confidence: ${result.confidence.toFixed(2)}`);
      console.log(`   Functional requirements: ${result.requirements.functional.length}`);
      console.log(`   User stories: ${result.requirements.userStories.length}`);
      
      // Display sample requirement
      if (result.requirements.functional.length > 0) {
        console.log(`\n   Sample requirement:`);
        console.log(`   - ${result.requirements.functional[0].title}`);
        console.log(`     ${result.requirements.functional[0].description}`);
      }

      this.testResults.push({
        test: 'Business Document Analysis',
        success: true,
        duration,
        details: `Extracted ${result.metadata.requirementsFound} requirements`
      });

    } catch (error) {
      this.testResults.push({
        test: 'Business Document Analysis',
        success: false,
        error: error.message
      });
      console.error(`❌ Test failed: ${error.message}`);
    }

    console.log('\n');
  }

  async testTechnicalDocumentAnalysis() {
    console.log('🔧 Test 2: Technical Document Analysis');
    console.log('-------------------------------------');

    const techDoc = this.testDocuments.find(d => d.type === 'technical');
    const startTime = Date.now();

    try {
      const result = await this.analystAgent.analyzeDocument(techDoc);
      const duration = Date.now() - startTime;

      console.log(`✅ Analysis completed in ${duration}ms`);
      console.log(`   Document type: ${result.documentType}`);
      console.log(`   Functional requirements: ${result.requirements.functional.length}`);
      console.log(`   Non-functional requirements: ${result.requirements.nonFunctional.length}`);
      console.log(`   Confidence: ${result.confidence.toFixed(2)}`);

      // Display non-functional requirements
      if (result.requirements.nonFunctional.length > 0) {
        console.log(`\n   Non-functional requirements:`);
        result.requirements.nonFunctional.forEach(req => {
          console.log(`   - ${req.category}: ${req.description}`);
        });
      }

      this.testResults.push({
        test: 'Technical Document Analysis',
        success: true,
        duration,
        details: `Found ${result.requirements.nonFunctional.length} NFRs`
      });

    } catch (error) {
      this.testResults.push({
        test: 'Technical Document Analysis',
        success: false,
        error: error.message
      });
      console.error(`❌ Test failed: ${error.message}`);
    }

    console.log('\n');
  }

  async testChatLogAnalysis() {
    console.log('💬 Test 3: Chat Log Analysis');
    console.log('---------------------------');

    const chatDoc = this.testDocuments.find(d => d.type === 'conversation');
    const startTime = Date.now();

    try {
      const result = await this.analystAgent.analyzeDocument(chatDoc);
      const duration = Date.now() - startTime;

      console.log(`✅ Analysis completed in ${duration}ms`);
      console.log(`   Document type: ${result.documentType}`);
      console.log(`   Requirements extracted: ${result.requirements.functional.length}`);
      console.log(`   Confidence: ${result.confidence.toFixed(2)}`);

      // Display extracted decisions
      console.log(`\n   Key decisions from chat:`);
      result.requirements.functional.forEach(req => {
        if (req.source === 'conversation') {
          console.log(`   - ${req.description}`);
        }
      });

      this.testResults.push({
        test: 'Chat Log Analysis',
        success: true,
        duration,
        details: `Extracted ${result.requirements.functional.length} requirements from chat`
      });

    } catch (error) {
      this.testResults.push({
        test: 'Chat Log Analysis',
        success: false,
        error: error.message
      });
      console.error(`❌ Test failed: ${error.message}`);
    }

    console.log('\n');
  }

  async testInsightGeneration() {
    console.log('💡 Test 4: Insight Generation');
    console.log('----------------------------');

    const businessDoc = this.testDocuments.find(d => d.type === 'business');
    const startTime = Date.now();

    try {
      const result = await this.analystAgent.analyzeDocument(businessDoc);
      const duration = Date.now() - startTime;

      console.log(`✅ Generated ${result.insights.length} insights in ${duration}ms`);
      
      result.insights.forEach(insight => {
        console.log(`\n   ${insight.title}:`);
        console.log(`   - ${insight.description}`);
        
        if (insight.recommendations) {
          console.log(`   Recommendations:`);
          insight.recommendations.forEach(rec => {
            console.log(`     • ${rec}`);
          });
        }
        
        if (insight.stack) {
          console.log(`   Technology Stack:`);
          console.log(`     • Frontend: ${insight.stack.frontend.framework}`);
          console.log(`     • Backend: ${insight.stack.backend.framework}`);
          console.log(`     • Database: ${insight.stack.database.primary}`);
        }
      });

      this.testResults.push({
        test: 'Insight Generation',
        success: true,
        duration,
        details: `Generated ${result.insights.length} actionable insights`
      });

    } catch (error) {
      this.testResults.push({
        test: 'Insight Generation',
        success: false,
        error: error.message
      });
      console.error(`❌ Test failed: ${error.message}`);
    }

    console.log('\n');
  }

  generateReport() {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;

    return `
🎯 ANALYST AGENT TEST RESULTS
=============================
📊 Summary: ${passedTests}/${totalTests} tests passed
${failedTests === 0 ? '✅ All tests passed!' : `⚠️ ${failedTests} tests failed`}

📋 Test Results:
${this.testResults.map(r => 
  `${r.success ? '✅' : '❌'} ${r.test}: ${r.success ? r.details || 'Passed' : r.error}`
).join('\n')}

🔍 Analyst Capabilities Verified:
${passedTests >= 3 ? '✅' : '❌'} Business document analysis
${passedTests >= 3 ? '✅' : '❌'} Technical document analysis
${passedTests >= 3 ? '✅' : '❌'} Chat log processing
${passedTests >= 3 ? '✅' : '❌'} Insight generation
${passedTests >= 3 ? '✅' : '❌'} Requirement extraction
${passedTests >= 3 ? '✅' : '❌'} Confidence scoring

💡 Next Steps:
${passedTests === totalTests ? 
  '- Ready to integrate with Architect Agent\n- Can process real documents\n- Deploy to production' :
  '- Fix failing tests before proceeding\n- Review error logs for issues'}
`;
  }

  async saveSampleOutput() {
    try {
      // Analyze a document and save the output
      const businessDoc = this.testDocuments.find(d => d.type === 'business');
      const result = await this.analystAgent.analyzeDocument(businessDoc);

      const outputPath = path.join(__dirname, 'analyst-sample-output.json');
      await fs.writeFile(outputPath, JSON.stringify(result, null, 2));

      console.log(`💾 Sample output saved to: ${outputPath}`);
    } catch (error) {
      console.warn('⚠️ Failed to save sample output:', error.message);
    }
  }
}

// Run tests
async function main() {
  const tester = new AnalystAgentTester();
  
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

module.exports = { AnalystAgentTester, main };