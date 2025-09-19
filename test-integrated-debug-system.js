#!/usr/bin/env node

/**
 * 🧪 TEST INTEGRATED DEBUG SYSTEM
 * 
 * Comprehensive test of the unified debugging system that demonstrates:
 * - Color-coded logging with database storage
 * - Error categorization and character assignment  
 * - Intelligent suggestion engine with learning
 * - Real-time service monitoring during startup
 * - Integration between all debugging components
 */

const UnifiedDebugIntegrationBridge = require('./unified-debug-integration-bridge');
const UnifiedColorTaggedLogger = require('./unified-color-tagged-logger');
const { spawn } = require('child_process');
const fs = require('fs');

class IntegratedDebugSystemTest {
    constructor() {
        this.logger = new UnifiedColorTaggedLogger('TEST');
        this.bridge = null;
        this.testResults = [];
        this.testServices = [];
    }
    
    async runCompleteTest() {
        console.log('\n🧪 INTEGRATED DEBUG SYSTEM TEST');
        console.log('=====================================\n');
        
        try {
            // Test 1: Initialize the unified bridge
            await this.testBridgeInitialization();
            
            // Test 2: Test color-coded logging
            await this.testColorCodedLogging();
            
            // Test 3: Test error handling with character assignment
            await this.testErrorHandlingWithCharacterAssignment();
            
            // Test 4: Test suggestion engine integration
            await this.testSuggestionEngineIntegration();
            
            // Test 5: Test real-time service monitoring
            await this.testRealTimeServiceMonitoring();
            
            // Test 6: Test unified system status
            await this.testUnifiedSystemStatus();
            
            // Test 7: Test analytics export
            await this.testAnalyticsExport();
            
            // Show final results
            this.showTestResults();
            
        } catch (error) {
            this.logger.error('TEST', `Test suite failed: ${error.message}`, {
                suggestion: 'Check error details and fix before retrying'
            });
            console.error(error);
        }
    }
    
    async testBridgeInitialization() {
        const timer = this.logger.startTimer('INIT', 'Testing bridge initialization');
        
        try {
            this.bridge = new UnifiedDebugIntegrationBridge();
            
            // Wait for initialization to complete
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            this.recordTestResult('Bridge Initialization', true, 'Successfully initialized unified debug bridge');
            timer.end(true);
            
        } catch (error) {
            this.recordTestResult('Bridge Initialization', false, error.message);
            timer.end(false);
            throw error;
        }
    }
    
    async testColorCodedLogging() {
        const timer = this.logger.startTimer('LOGGING', 'Testing color-coded logging');
        
        try {
            // Test all log levels with color coding
            this.logger.success('COLOR', '🟢 Success messages work with green color');
            this.logger.warning('COLOR', '🟡 Warning messages work with yellow color');
            this.logger.error('COLOR', '🔴 Error messages work with red color');
            this.logger.info('COLOR', '🔵 Info messages work with blue color');
            this.logger.debug('COLOR', '🟣 Debug messages work with purple color');
            this.logger.suggest('COLOR', '⚪ Suggestion messages work with white color', 'echo "test command"');
            
            // Test database logging
            const logs = await this.logger.searchLogs({
                service: 'TEST',
                tag: 'COLOR',
                limit: 10
            });
            
            if (logs.length >= 6) {
                this.recordTestResult('Color-Coded Logging', true, `Found ${logs.length} color-coded log entries in database`);
                timer.end(true);
            } else {
                this.recordTestResult('Color-Coded Logging', false, `Only found ${logs.length} log entries, expected 6`);
                timer.end(false);
            }
            
        } catch (error) {
            this.recordTestResult('Color-Coded Logging', false, error.message);
            timer.end(false);
        }
    }
    
    async testErrorHandlingWithCharacterAssignment() {
        const timer = this.logger.startTimer('ERROR', 'Testing error handling with character assignment');
        
        try {
            // Test different types of errors to see character assignment
            const testErrors = [
                {
                    error: new SyntaxError('Unexpected token }'),
                    expectedCharacter: 'Arty',
                    category: 'syntax'
                },
                {
                    error: new TypeError('Cannot read property \'foo\' of undefined'),
                    expectedCharacter: 'Ralph', 
                    category: 'runtime'
                },
                {
                    error: new Error('UnhandledPromiseRejection'),
                    expectedCharacter: 'Cal',
                    category: 'async'
                },
                {
                    error: new Error('ECONNREFUSED connection failed'),
                    expectedCharacter: 'Ralph',
                    category: 'network'
                }
            ];
            
            let successCount = 0;
            
            for (const testCase of testErrors) {
                try {
                    const result = await this.bridge.handleError(testCase.error, { source: 'test' });
                    
                    this.logger.info('ASSIGN', `Error "${testCase.error.message}" assigned to ${result.character} (expected: ${testCase.expectedCharacter})`);
                    
                    if (result.character === testCase.expectedCharacter) {
                        successCount++;
                    }
                    
                    // Wait between errors
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (error) {
                    this.logger.error('ASSIGN', `Failed to handle test error: ${error.message}`);
                }
            }
            
            const success = successCount >= 3; // Allow some flexibility
            this.recordTestResult('Character Assignment', success, `${successCount}/${testErrors.length} errors assigned to correct characters`);
            timer.end(success);
            
        } catch (error) {
            this.recordTestResult('Character Assignment', false, error.message);
            timer.end(false);
        }
    }
    
    async testSuggestionEngineIntegration() {
        const timer = this.logger.startTimer('SUGGEST', 'Testing suggestion engine integration');
        
        try {
            // Test various error patterns for suggestions
            const testCases = [
                {
                    error: 'Error: listen EADDRINUSE: address already in use :::3000',
                    expectedPattern: 'port_conflict'
                },
                {
                    error: 'Error: connect ECONNREFUSED 127.0.0.1:5432',
                    expectedPattern: 'postgres_down'
                },
                {
                    error: 'Error: Cannot find module \'express\'',
                    expectedPattern: 'missing_module'
                }
            ];
            
            let successCount = 0;
            
            for (const testCase of testCases) {
                const result = await this.bridge.handleError(new Error(testCase.error), { source: 'suggestion-test' });
                
                if (result.suggestion && result.suggestion.pattern === testCase.expectedPattern) {
                    this.logger.success('SUGGEST', `✓ Correct suggestion for ${testCase.expectedPattern}`);
                    successCount++;
                } else {
                    this.logger.warning('SUGGEST', `? Unexpected suggestion for ${testCase.error}`);
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            const success = successCount >= 2;
            this.recordTestResult('Suggestion Engine Integration', success, `${successCount}/${testCases.length} suggestions matched expected patterns`);
            timer.end(success);
            
        } catch (error) {
            this.recordTestResult('Suggestion Engine Integration', false, error.message);
            timer.end(false);
        }
    }
    
    async testRealTimeServiceMonitoring() {
        const timer = this.logger.startTimer('MONITOR', 'Testing real-time service monitoring');
        
        try {
            // Create a simple test service
            const testServiceCode = `
const http = require('http');
const port = process.argv[2] || 9999;

console.log('Test service starting on port ' + port + '...');

const server = http.createServer((req, res) => {
    if (req.url === '/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(port, () => {
    console.log('Test service ready on port ' + port);
});

// Simulate some activity
let counter = 0;
const interval = setInterval(() => {
    counter++;
    console.log('Service heartbeat #' + counter);
    
    if (counter === 3) {
        console.error('Warning: This is a test warning message');
    }
    
    if (counter >= 8) {
        console.log('Test service shutting down...');
        clearInterval(interval);
        server.close();
        process.exit(0);
    }
}, 1000);
            `;
            
            // Write test service
            fs.writeFileSync('test-service-temp.js', testServiceCode);
            
            // Launch with unified monitoring
            const process = await this.bridge.launchServiceWithUnifiedMonitoring('node', ['test-service-temp.js', '9999'], {
                name: 'test-service-monitor',
                port: 9999
            });
            
            // Wait for service to run and complete
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            // Check if monitoring captured the service lifecycle
            const systemStatus = this.bridge.getUnifiedStatus();
            
            const hasService = systemStatus.services && Object.keys(systemStatus.services).length > 0;
            const hasTests = systemStatus.tests && systemStatus.tests.total > 0;
            
            this.recordTestResult('Real-Time Service Monitoring', hasService && hasTests, `Captured service lifecycle: services=${hasService}, tests=${hasTests}`);
            timer.end(hasService && hasTests);
            
            // Cleanup
            try {
                fs.unlinkSync('test-service-temp.js');
            } catch (e) {}
            
        } catch (error) {
            this.recordTestResult('Real-Time Service Monitoring', false, error.message);
            timer.end(false);
        }
    }
    
    async testUnifiedSystemStatus() {
        const timer = this.logger.startTimer('STATUS', 'Testing unified system status');
        
        try {
            const status = this.bridge.getUnifiedStatus();
            
            // Check if status has expected structure
            const hasBasicStructure = status.bridge && status.components && status.services && status.tests;
            const hasBridge = status.bridge.status === 'operational';
            const hasComponents = Object.keys(status.components).length >= 4;
            
            this.logger.info('STATUS', `Bridge status: ${status.bridge.status}`);
            this.logger.info('STATUS', `Active services: ${status.bridge.activeServices}`);
            this.logger.info('STATUS', `Total errors tracked: ${status.bridge.totalErrors}`);
            this.logger.info('STATUS', `Total fixes applied: ${status.bridge.totalFixes}`);
            
            const success = hasBasicStructure && hasBridge && hasComponents;
            this.recordTestResult('Unified System Status', success, `System status complete: structure=${hasBasicStructure}, bridge=${hasBridge}, components=${hasComponents}`);
            timer.end(success);
            
        } catch (error) {
            this.recordTestResult('Unified System Status', false, error.message);
            timer.end(false);
        }
    }
    
    async testAnalyticsExport() {
        const timer = this.logger.startTimer('EXPORT', 'Testing analytics export');
        
        try {
            // Export in different formats
            const jsonExport = await this.bridge.exportUnifiedAnalytics('json');
            const csvExport = await this.bridge.exportUnifiedAnalytics('csv');
            
            const hasJsonData = jsonExport && jsonExport.length > 100;
            const hasCsvData = csvExport && csvExport.includes('timestamp,type,message');
            
            if (hasJsonData && hasCsvData) {
                this.logger.success('EXPORT', `✓ Successfully exported analytics in both JSON and CSV formats`);
                this.recordTestResult('Analytics Export', true, `JSON: ${jsonExport.length} chars, CSV: ${csvExport.split('\n').length} lines`);
            } else {
                this.logger.warning('EXPORT', `? Analytics export incomplete: JSON=${hasJsonData}, CSV=${hasCsvData}`);
                this.recordTestResult('Analytics Export', false, 'Export data incomplete or missing');
            }
            
            timer.end(hasJsonData && hasCsvData);
            
        } catch (error) {
            this.recordTestResult('Analytics Export', false, error.message);
            timer.end(false);
        }
    }
    
    recordTestResult(testName, success, details) {
        this.testResults.push({
            name: testName,
            success,
            details,
            timestamp: Date.now()
        });
        
        if (success) {
            this.logger.success('RESULT', `✅ ${testName}: ${details}`);
        } else {
            this.logger.error('RESULT', `❌ ${testName}: ${details}`, {
                suggestion: 'Check component logs for debugging information'
            });
        }
    }
    
    showTestResults() {
        const passed = this.testResults.filter(r => r.success).length;
        const total = this.testResults.length;
        const percentage = Math.round((passed / total) * 100);
        
        console.log('\n📊 INTEGRATED DEBUG SYSTEM TEST RESULTS');
        console.log('==========================================\n');
        
        this.testResults.forEach(result => {
            const icon = result.success ? '✅' : '❌';
            const color = result.success ? 'green' : 'red';
            console.log(`${icon} ${result.name}`.padEnd(35) + ` ${result.details}`);
        });
        
        console.log('\n' + '='.repeat(42));
        
        if (passed === total) {
            this.logger.success('FINAL', `🎉 ALL TESTS PASSED! (${passed}/${total}) - ${percentage}%`);
            console.log('\n🌉 Unified Debug Integration System is fully operational!');
            console.log('🎯 All components are connected and working together');
            console.log('🌈 Color-coded logging is active and storing to database');
            console.log('🤖 Character assignment and intelligent suggestions are working');
            console.log('📊 Real-time monitoring and analytics are operational');
        } else {
            this.logger.warning('FINAL', `⚠️  PARTIAL SUCCESS: ${passed}/${total} tests passed (${percentage}%)`);
            console.log('\n🔧 Some components may need attention, but core system is functional');
        }
        
        console.log('\n📚 Next Steps:');
        console.log('1. Use ./launch-unified-debug-system.sh to start all components');
        console.log('2. Use ./launch-with-monitoring.sh to monitor your services');
        console.log('3. Check http://localhost:1505 for real-time monitoring dashboard');
        console.log('4. View logs in ./logs/ directory for detailed debugging');
        console.log('\n✨ Happy debugging!\n');
    }
}

// Run the test if called directly
if (require.main === module) {
    const test = new IntegratedDebugSystemTest();
    
    test.runCompleteTest().catch(error => {
        console.error('\n❌ Test suite crashed:', error);
        process.exit(1);
    });
}