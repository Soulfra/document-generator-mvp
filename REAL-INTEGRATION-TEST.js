#!/usr/bin/env node

/**
 * REAL INTEGRATION TEST
 * This will test actual document processing through the full system
 * to identify timeout and integration issues
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🧪 REAL INTEGRATION TEST STARTING...\n');

class RealIntegrationTester {
  constructor() {
    this.testResults = {
      services: {},
      integrations: {},
      errors: [],
      timeouts: []
    };
    this.timeout = 10000; // 10 second timeout for tests
  }

  async runFullTest() {
    console.log('📋 Testing Full Document Processing Pipeline...\n');
    
    try {
      // Phase 1: Check all expected services
      await this.testServiceAvailability();
      
      // Phase 2: Test service integrations
      await this.testServiceIntegrations();
      
      // Phase 3: Test document processing flow
      await this.testDocumentProcessingFlow();
      
      // Phase 4: Test Soulfra architecture requirements
      await this.testSoulfraArchitecture();
      
      // Phase 5: Report results
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Fatal error during testing:', error);
      this.testResults.errors.push({
        phase: 'initialization',
        error: error.message
      });
    }
  }

  async testServiceAvailability() {
    console.log('🔍 Phase 1: Testing Service Availability...');
    
    const expectedServices = [
      { name: 'Ollama', url: 'http://localhost:11434/api/tags', critical: true },
      { name: 'Template Processor', url: 'http://localhost:3000/health', critical: true },
      { name: 'AI API Service', url: 'http://localhost:3001/health', critical: true },
      { name: 'Cal-Compare', url: 'http://localhost:3001/api/cal-compare/consultations', critical: true },
      { name: 'PostgreSQL', url: 'postgresql://localhost:5432', critical: false },
      { name: 'Redis', url: 'redis://localhost:6379', critical: false },
      { name: 'MinIO', url: 'http://localhost:9000/minio/health/live', critical: false },
      { name: 'Platform Hub', url: 'http://localhost:8080/health', critical: false }
    ];
    
    for (const service of expectedServices) {
      try {
        const result = await this.testService(service);
        this.testResults.services[service.name] = result;
        
        const status = result.available ? '✅' : '❌';
        console.log(`  ${status} ${service.name}: ${result.status}`);
        
        if (!result.available && service.critical) {
          this.testResults.errors.push({
            phase: 'service_availability',
            service: service.name,
            error: `Critical service unavailable: ${result.error}`
          });
        }
      } catch (error) {
        console.log(`  ❌ ${service.name}: Error - ${error.message}`);
        this.testResults.services[service.name] = {
          available: false,
          error: error.message
        };
      }
    }
    console.log('');
  }

  async testServiceIntegrations() {
    console.log('🔗 Phase 2: Testing Service Integrations...');
    
    // Test 1: Template Processor → AI API
    try {
      console.log('  Testing: Template Processor → AI API...');
      const aiApiTest = await this.testHTTP('POST', 'http://localhost:3001/api/analyze', {
        content: 'Test document for integration',
        type: 'business_plan'
      });
      
      this.testResults.integrations['template_to_ai'] = aiApiTest;
      console.log(`    ${aiApiTest.success ? '✅' : '❌'} AI API Integration`);
      
    } catch (error) {
      console.log(`    ❌ AI API Integration: ${error.message}`);
      this.testResults.integrations['template_to_ai'] = { success: false, error: error.message };
    }
    
    // Test 2: AI API → Cal-Compare
    try {
      console.log('  Testing: AI API → Cal-Compare...');
      const calCompareTest = await this.testHTTP('POST', 'http://localhost:3001/api/cal-compare/consult', {
        expertType: 'technical-architecture',
        question: 'Test integration question',
        userId: 'integration-test'
      });
      
      this.testResults.integrations['ai_to_calcompare'] = calCompareTest;
      console.log(`    ${calCompareTest.success ? '✅' : '❌'} Cal-Compare Integration`);
      
    } catch (error) {
      console.log(`    ❌ Cal-Compare Integration: ${error.message}`);
      this.testResults.integrations['ai_to_calcompare'] = { success: false, error: error.message };
    }
    
    // Test 3: Database connections
    try {
      console.log('  Testing: Database Connections...');
      const dbTest = await this.testDatabaseConnections();
      this.testResults.integrations['database'] = dbTest;
      console.log(`    ${dbTest.success ? '✅' : '❌'} Database Connections`);
      
    } catch (error) {
      console.log(`    ❌ Database Connections: ${error.message}`);
      this.testResults.integrations['database'] = { success: false, error: error.message };
    }
    
    console.log('');
  }

  async testDocumentProcessingFlow() {
    console.log('📄 Phase 3: Testing Document Processing Flow...');
    
    // Create test document
    const testDoc = `
# Test Business Plan
## Executive Summary
Create a SaaS platform for managing customer invoices with AI-powered categorization.

## Market Analysis
The invoice management market is worth $2.1B annually.

## Technical Requirements
- Web-based interface
- Database integration
- AI classification
- PDF generation
`;
    
    try {
      console.log('  Creating test document...');
      fs.writeFileSync('/tmp/test-document.md', testDoc);
      
      console.log('  Testing: Document Upload → Processing...');
      // Simulate document processing through the system
      const processingTest = await this.testDocumentUpload('/tmp/test-document.md');
      
      this.testResults.integrations['document_processing'] = processingTest;
      console.log(`    ${processingTest.success ? '✅' : '❌'} Document Processing Flow`);
      
      if (processingTest.success) {
        console.log(`    Generated MVP components: ${processingTest.components || 'Unknown'}`);
      }
      
    } catch (error) {
      console.log(`    ❌ Document Processing: ${error.message}`);
      this.testResults.integrations['document_processing'] = { success: false, error: error.message };
    }
    
    console.log('');
  }

  async testSoulfraArchitecture() {
    console.log('🏗️ Phase 4: Testing Soulfra Architecture Requirements...');
    
    // Test for Soulfra unified backend
    const soulfraTests = [
      { file: './soulfra-unified-backend-engine.js', name: 'Unified Backend Engine' },
      { file: './clean-system/UNIFIED-MEGA-SYSTEM.js', name: 'Unified Mega System' },
      { file: './FinishThisIdea/ai-os-clean/database-service.js', name: 'Database Service' }
    ];
    
    for (const test of soulfraTests) {
      const exists = fs.existsSync(test.file);
      console.log(`  ${exists ? '✅' : '❌'} ${test.name}: ${exists ? 'Found' : 'Missing'}`);
      
      if (!exists) {
        this.testResults.errors.push({
          phase: 'soulfra_architecture',
          component: test.name,
          error: `Required Soulfra component missing: ${test.file}`
        });
      }
    }
    
    // Test isolation layers
    try {
      console.log('  Testing: Isolation Layer Compliance...');
      const isolationTest = await this.testIsolationLayers();
      console.log(`    ${isolationTest ? '✅' : '❌'} Isolation Layers`);
    } catch (error) {
      console.log(`    ❌ Isolation Layers: ${error.message}`);
    }
    
    console.log('');
  }

  async testService(service) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.testResults.timeouts.push(service.name);
        resolve({ available: false, status: 'timeout', error: 'Request timed out' });
      }, this.timeout);

      if (service.url.startsWith('http')) {
        fetch(service.url)
          .then(response => {
            clearTimeout(timeout);
            resolve({
              available: response.ok,
              status: response.ok ? 'online' : `error ${response.status}`,
              code: response.status
            });
          })
          .catch(error => {
            clearTimeout(timeout);
            resolve({
              available: false,
              status: 'offline',
              error: error.message
            });
          });
      } else {
        // Non-HTTP services (database URLs)
        clearTimeout(timeout);
        resolve({ available: false, status: 'not_tested', error: 'Database testing not implemented' });
      }
    });
  }

  async testHTTP(method, url, data = null) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Request timed out' });
      }, this.timeout);

      const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      fetch(url, options)
        .then(async response => {
          clearTimeout(timeout);
          const responseData = await response.text();
          resolve({
            success: response.ok,
            status: response.status,
            data: responseData
          });
        })
        .catch(error => {
          clearTimeout(timeout);
          resolve({ success: false, error: error.message });
        });
    });
  }

  async testDatabaseConnections() {
    // Check if database files exist
    const dbFiles = [
      './FinishThisIdea/ai-os-clean/data/cal-compare.sqlite',
      './data/physical_layer.db',
      './data/identity_layer.db',
      './data/creation_layer.db'
    ];

    let foundDbs = 0;
    for (const dbFile of dbFiles) {
      if (fs.existsSync(dbFile)) {
        foundDbs++;
      }
    }

    return {
      success: foundDbs > 0,
      found: foundDbs,
      expected: dbFiles.length,
      message: `Found ${foundDbs}/${dbFiles.length} expected databases`
    };
  }

  async testDocumentUpload(filePath) {
    // Simulate document upload to template processor
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const response = await this.testHTTP('POST', 'http://localhost:3000/api/process', {
        content: fileContent,
        filename: path.basename(filePath),
        type: 'markdown'
      });

      return {
        success: response.success,
        components: response.data ? 'MVP generated' : 'No MVP data',
        error: response.error
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testIsolationLayers() {
    // Check if Soulfra isolation layer files exist
    const isolationFiles = [
      './data/physical_layer.db',
      './data/identity_layer.db',
      './data/creation_layer.db',
      './data/social_layer.db',
      './data/meta_layer.db',
      './data/business_layer.db',
      './data/os_layer.db'
    ];

    return isolationFiles.some(file => fs.existsSync(file));
  }

  generateReport() {
    console.log('📊 INTEGRATION TEST RESULTS');
    console.log('='.repeat(50));
    
    // Service availability summary
    const services = Object.entries(this.testResults.services);
    const availableServices = services.filter(([_, result]) => result.available).length;
    console.log(`\n🔍 Services: ${availableServices}/${services.length} available`);
    
    // Integration summary
    const integrations = Object.entries(this.testResults.integrations);
    const workingIntegrations = integrations.filter(([_, result]) => result.success).length;
    console.log(`🔗 Integrations: ${workingIntegrations}/${integrations.length} working`);
    
    // Errors summary
    console.log(`❌ Errors: ${this.testResults.errors.length}`);
    console.log(`⏰ Timeouts: ${this.testResults.timeouts.length}`);
    
    // Detailed errors
    if (this.testResults.errors.length > 0) {
      console.log('\n❌ CRITICAL ISSUES:');
      this.testResults.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. [${error.phase}] ${error.error}`);
      });
    }
    
    // Timeout issues
    if (this.testResults.timeouts.length > 0) {
      console.log('\n⏰ TIMEOUT ISSUES:');
      this.testResults.timeouts.forEach((service, i) => {
        console.log(`  ${i + 1}. ${service} - Request timed out after ${this.timeout}ms`);
      });
    }
    
    // Overall assessment
    console.log('\n🎯 OVERALL ASSESSMENT:');
    if (this.testResults.errors.length === 0 && workingIntegrations === integrations.length) {
      console.log('✅ System is ready for production use');
    } else if (this.testResults.errors.length < 3 && workingIntegrations > integrations.length / 2) {
      console.log('⚠️  System has issues but may work for basic use');
    } else {
      console.log('❌ System has critical issues and will likely fail');
    }
    
    // Save detailed report
    fs.writeFileSync('./INTEGRATION-TEST-REPORT.json', JSON.stringify(this.testResults, null, 2));
    console.log('\n📄 Detailed report saved to: INTEGRATION-TEST-REPORT.json');
  }
}

// Run the test
const tester = new RealIntegrationTester();
tester.runFullTest().catch(console.error);