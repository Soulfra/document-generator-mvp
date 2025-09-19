#!/usr/bin/env node

/**
 * DATABASE-DRIVEN SYSTEM TEST SUITE
 * Tests the complete database-driven automation system
 */

const DatabaseDrivenBuilder = require('./database-driven-builder');
const SchemaToSystem = require('./schema-to-system');
const AutomatedTurnRunner = require('./automated-turn-runner');
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class DatabaseDrivenTest {
    constructor() {
        this.testResults = [];
        this.tempDir = path.join(__dirname, 'test-output');
    }
    
    /**
     * Run all tests
     */
    async runAllTests() {
        console.log(`
🧪 DATABASE-DRIVEN SYSTEM TEST SUITE
Testing the complete automation pipeline
        `);
        
        try {
            // Setup
            await this.setup();
            
            // Run tests
            await this.testDatabaseDrivenBuilder();
            await this.testSchemaToSystem();
            await this.testAutomatedTurnRunner();
            await this.testIntegration();
            
            // Report results
            this.reportResults();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error);
            process.exit(1);
        } finally {
            // Cleanup
            await this.cleanup();
        }
    }
    
    /**
     * Test setup
     */
    async setup() {
        console.log('\n📋 Setting up test environment...');
        
        // Create temp directory
        await fs.mkdir(this.tempDir, { recursive: true });
        
        // Create test schema
        const testSchema = `
-- Test Document Generator Schema
CREATE TABLE IF NOT EXISTS test_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'markdown',
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS test_mvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    revenue REAL DEFAULT 0,
    deployment_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES test_documents(id)
);

CREATE TABLE IF NOT EXISTS test_revenue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mvp_id INTEGER,
    amount REAL NOT NULL,
    source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mvp_id) REFERENCES test_mvps(id)
);

-- Sample stored procedure
CREATE PROCEDURE calculate_total_revenue()
BEGIN
    SELECT SUM(amount) as total FROM test_revenue;
END;
`;
        
        await fs.writeFile(path.join(this.tempDir, 'test-schema.sql'), testSchema);
        console.log('✅ Test environment ready');
    }
    
    /**
     * Test DatabaseDrivenBuilder
     */
    async testDatabaseDrivenBuilder() {
        console.log('\n🔨 Testing DatabaseDrivenBuilder...');
        
        const test = {
            name: 'DatabaseDrivenBuilder',
            passed: 0,
            failed: 0,
            tests: []
        };
        
        try {
            // Test 1: Build from schema
            const builder = new DatabaseDrivenBuilder({
                schemaPath: path.join(this.tempDir, 'test-schema.sql'),
                outputDir: path.join(this.tempDir, 'generated-system'),
                generateAPI: true,
                generateUI: true,
                generateTests: true
            });
            
            const result = await builder.buildFromSchema();
            
            // Verify output
            const modelExists = await this.fileExists(
                path.join(this.tempDir, 'generated-system', 'models', 'TestDocuments.js')
            );
            
            if (modelExists) {
                test.passed++;
                test.tests.push({ name: 'Generate models from schema', status: 'PASS' });
            } else {
                test.failed++;
                test.tests.push({ name: 'Generate models from schema', status: 'FAIL' });
            }
            
            // Test 2: Verify services
            const serviceExists = await this.fileExists(
                path.join(this.tempDir, 'generated-system', 'services', 'TestDocumentsService.js')
            );
            
            if (serviceExists) {
                test.passed++;
                test.tests.push({ name: 'Generate services', status: 'PASS' });
            } else {
                test.failed++;
                test.tests.push({ name: 'Generate services', status: 'FAIL' });
            }
            
            // Test 3: Verify API generation
            const apiExists = await this.fileExists(
                path.join(this.tempDir, 'generated-system', 'api', 'testdocuments.js')
            );
            
            if (apiExists) {
                test.passed++;
                test.tests.push({ name: 'Generate REST APIs', status: 'PASS' });
            } else {
                test.failed++;
                test.tests.push({ name: 'Generate REST APIs', status: 'FAIL' });
            }
            
            // Test 4: Verify main app
            const appExists = await this.fileExists(
                path.join(this.tempDir, 'generated-system', 'app.js')
            );
            
            if (appExists) {
                test.passed++;
                test.tests.push({ name: 'Generate main application', status: 'PASS' });
            } else {
                test.failed++;
                test.tests.push({ name: 'Generate main application', status: 'FAIL' });
            }
            
            console.log(`  ✅ DatabaseDrivenBuilder: ${test.passed} passed, ${test.failed} failed`);
            
        } catch (error) {
            test.failed++;
            test.tests.push({ 
                name: 'DatabaseDrivenBuilder execution', 
                status: 'FAIL', 
                error: error.message 
            });
        }
        
        this.testResults.push(test);
    }
    
    /**
     * Test SchemaToSystem
     */
    async testSchemaToSystem() {
        console.log('\n🔄 Testing SchemaToSystem...');
        
        const test = {
            name: 'SchemaToSystem',
            passed: 0,
            failed: 0,
            tests: []
        };
        
        try {
            // Test 1: Load schema and create runtime
            const converter = new SchemaToSystem({
                database: ':memory:',
                autoMigrate: true,
                generateEndpoints: true
            });
            
            const result = await converter.loadSchema(
                path.join(this.tempDir, 'test-schema.sql')
            );
            
            if (result.tables === 3 && result.models === 3) {
                test.passed++;
                test.tests.push({ name: 'Load schema and generate runtime', status: 'PASS' });
            } else {
                test.failed++;
                test.tests.push({ name: 'Load schema and generate runtime', status: 'FAIL' });
            }
            
            // Test 2: Test model operations
            const docModel = converter.models.get('test_documents');
            const created = await docModel.create({
                title: 'Test Document',
                content: 'This is a test',
                type: 'markdown'
            });
            
            if (created.id && created.title === 'Test Document') {
                test.passed++;
                test.tests.push({ name: 'Model create operation', status: 'PASS' });
            } else {
                test.failed++;
                test.tests.push({ name: 'Model create operation', status: 'FAIL' });
            }
            
            // Test 3: Test service operations
            const docService = converter.services.get('test_documents');
            const searchResults = await docService.search('test');
            
            if (Array.isArray(searchResults) && searchResults.length > 0) {
                test.passed++;
                test.tests.push({ name: 'Service search operation', status: 'PASS' });
            } else {
                test.failed++;
                test.tests.push({ name: 'Service search operation', status: 'FAIL' });
            }
            
            // Test 4: Test relationships
            const mvpModel = converter.models.get('test_mvps');
            const mvp = await mvpModel.create({
                document_id: created.id,
                name: 'Test MVP',
                revenue: 1000
            });
            
            const mvpService = converter.services.get('test_mvps');
            const mvpWithRelations = await mvpService.findWithRelations(mvp.id);
            
            if (mvpWithRelations && mvpWithRelations.test_documents) {
                test.passed++;
                test.tests.push({ name: 'Load relationships', status: 'PASS' });
            } else {
                test.failed++;
                test.tests.push({ name: 'Load relationships', status: 'FAIL' });
            }
            
            console.log(`  ✅ SchemaToSystem: ${test.passed} passed, ${test.failed} failed`);
            
        } catch (error) {
            test.failed++;
            test.tests.push({ 
                name: 'SchemaToSystem execution', 
                status: 'FAIL', 
                error: error.message 
            });
        }
        
        this.testResults.push(test);
    }
    
    /**
     * Test AutomatedTurnRunner
     */
    async testAutomatedTurnRunner() {
        console.log('\n🎮 Testing AutomatedTurnRunner...');
        
        const test = {
            name: 'AutomatedTurnRunner',
            passed: 0,
            failed: 0,
            tests: []
        };
        
        try {
            // Test 1: Initialize runner
            const runner = new AutomatedTurnRunner({
                database: ':memory:',
                maxTurns: 3,
                turnDuration: 100, // Fast for testing
                autoStart: false
            });
            
            await runner.initialize();
            
            if (runner.schemaSystem && runner.services.turns) {
                test.passed++;
                test.tests.push({ name: 'Initialize automation system', status: 'PASS' });
            } else {
                test.failed++;
                test.tests.push({ name: 'Initialize automation system', status: 'FAIL' });
            }
            
            // Test 2: Execute single turn
            await runner.executeTurn();
            
            const turns = await runner.services.turns.model.findAll();
            if (turns.length > 0 && turns[0].status === 'completed') {
                test.passed++;
                test.tests.push({ name: 'Execute single turn', status: 'PASS' });
            } else {
                test.failed++;
                test.tests.push({ name: 'Execute single turn', status: 'FAIL' });
            }
            
            // Test 3: Check revenue generation
            const revenue = await runner.services.revenue.model.findAll();
            if (revenue.length > 0 && revenue.some(r => r.amount > 0)) {
                test.passed++;
                test.tests.push({ name: 'Generate revenue', status: 'PASS' });
            } else {
                test.failed++;
                test.tests.push({ name: 'Generate revenue', status: 'FAIL' });
            }
            
            // Test 4: Get statistics
            const stats = await runner.getStats();
            if (stats.currentTurn === 1 && stats.totalRevenue > 0) {
                test.passed++;
                test.tests.push({ name: 'Get automation statistics', status: 'PASS' });
            } else {
                test.failed++;
                test.tests.push({ name: 'Get automation statistics', status: 'FAIL' });
            }
            
            console.log(`  ✅ AutomatedTurnRunner: ${test.passed} passed, ${test.failed} failed`);
            
        } catch (error) {
            test.failed++;
            test.tests.push({ 
                name: 'AutomatedTurnRunner execution', 
                status: 'FAIL', 
                error: error.message 
            });
        }
        
        this.testResults.push(test);
    }
    
    /**
     * Test full integration
     */
    async testIntegration() {
        console.log('\n🔗 Testing Full Integration...');
        
        const test = {
            name: 'Integration',
            passed: 0,
            failed: 0,
            tests: []
        };
        
        try {
            // Test 1: Build → Load → Run pipeline
            console.log('  Running full pipeline test...');
            
            // Build system from schema
            const builder = new DatabaseDrivenBuilder({
                schemaPath: path.join(this.tempDir, 'test-schema.sql'),
                outputDir: path.join(this.tempDir, 'integration-test')
            });
            
            await builder.buildFromSchema();
            
            // Load into runtime
            const runtime = new SchemaToSystem({
                database: ':memory:'
            });
            
            await runtime.loadSchema(path.join(this.tempDir, 'test-schema.sql'));
            
            // Create automation runner with the runtime
            const runner = new AutomatedTurnRunner({
                database: ':memory:',
                maxTurns: 2,
                turnDuration: 50
            });
            
            await runner.initialize();
            
            // Execute automation
            await new Promise((resolve) => {
                runner.on('automation-stopped', resolve);
                runner.start();
            });
            
            // Verify results
            const stats = await runner.getStats();
            if (stats.totalRevenue > 0 && runner.turnHistory.length === 2) {
                test.passed++;
                test.tests.push({ name: 'Full integration pipeline', status: 'PASS' });
            } else {
                test.failed++;
                test.tests.push({ name: 'Full integration pipeline', status: 'FAIL' });
            }
            
            // Test 2: Verify generated system can run
            const packageJson = await fs.readFile(
                path.join(this.tempDir, 'integration-test', 'package.json'),
                'utf-8'
            );
            
            const pkg = JSON.parse(packageJson);
            if (pkg.scripts && pkg.scripts.start) {
                test.passed++;
                test.tests.push({ name: 'Generated system structure', status: 'PASS' });
            } else {
                test.failed++;
                test.tests.push({ name: 'Generated system structure', status: 'FAIL' });
            }
            
            console.log(`  ✅ Integration: ${test.passed} passed, ${test.failed} failed`);
            
        } catch (error) {
            test.failed++;
            test.tests.push({ 
                name: 'Integration test', 
                status: 'FAIL', 
                error: error.message 
            });
        }
        
        this.testResults.push(test);
    }
    
    /**
     * Report test results
     */
    reportResults() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST RESULTS SUMMARY');
        console.log('='.repeat(60));
        
        let totalPassed = 0;
        let totalFailed = 0;
        
        for (const suite of this.testResults) {
            console.log(`\n${suite.name}:`);
            console.log(`  Passed: ${suite.passed}`);
            console.log(`  Failed: ${suite.failed}`);
            
            if (suite.failed > 0) {
                console.log('  Failed tests:');
                suite.tests
                    .filter(t => t.status === 'FAIL')
                    .forEach(t => {
                        console.log(`    - ${t.name}`);
                        if (t.error) {
                            console.log(`      Error: ${t.error}`);
                        }
                    });
            }
            
            totalPassed += suite.passed;
            totalFailed += suite.failed;
        }
        
        console.log('\n' + '='.repeat(60));
        console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
        console.log('='.repeat(60));
        
        if (totalFailed === 0) {
            console.log('\n✅ All tests passed! The database-driven system works correctly.');
        } else {
            console.log('\n❌ Some tests failed. Please review the errors above.');
        }
    }
    
    /**
     * Cleanup test environment
     */
    async cleanup() {
        console.log('\n🧹 Cleaning up test environment...');
        
        try {
            // Remove test directory
            await fs.rm(this.tempDir, { recursive: true, force: true });
            console.log('✅ Cleanup complete');
        } catch (error) {
            console.warn('⚠️ Cleanup warning:', error.message);
        }
    }
    
    /**
     * Helper: Check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new DatabaseDrivenTest();
    tester.runAllTests();
}

module.exports = DatabaseDrivenTest;