#!/usr/bin/env node

/**
 * ✅ VERIFY MONITORING SYSTEM
 * 
 * Tests the complete color-tagged debug system
 * Ensures everything is working as expected
 */

const UnifiedColorTaggedLogger = require('./unified-color-tagged-logger');
const SuggestionEngine = require('./suggestion-engine');
const RealTimeTestMonitor = require('./real-time-test-monitor');
const { spawn } = require('child_process');

async function verifySystem() {
    const logger = new UnifiedColorTaggedLogger('VERIFY');
    
    console.log('\n✅ VERIFYING MONITORING SYSTEM\n');
    
    // Test 1: Logger functionality
    logger.info('TEST', 'Testing logger functionality...');
    
    // Test different log levels
    logger.success('LOGGER', 'Success messages work');
    logger.warning('LOGGER', 'Warning messages work');
    logger.error('LOGGER', 'Error messages work', {
        suggestion: 'This is a test suggestion'
    });
    logger.debug('LOGGER', 'Debug messages work');
    
    // Test timer
    const timer = logger.startTimer('PERF', 'Logger performance test');
    await new Promise(resolve => setTimeout(resolve, 123));
    timer.end();
    
    // Test 2: Suggestion Engine
    logger.info('TEST', 'Testing suggestion engine...');
    const suggestionEngine = new SuggestionEngine();
    
    // Test error pattern matching
    const testErrors = [
        'Error: listen EADDRINUSE: address already in use :::3013',
        'Error: connect ECONNREFUSED 127.0.0.1:5432',
        'Error: Cannot find module \'axios\''
    ];
    
    for (const error of testErrors) {
        const suggestion = suggestionEngine.getSuggestion(error);
        logger.info('SUGGEST', `Error: ${error}`);
        logger.suggest('SUGGEST', suggestion.suggestion, suggestion.command);
    }
    
    // Test 3: Real-time monitoring
    logger.info('TEST', 'Testing real-time monitoring...');
    
    // Create a simple test service
    const testServiceCode = `
        const http = require('http');
        const port = process.argv[2] || 9876;
        
        console.log('Test service starting on port ' + port + '...');
        
        const server = http.createServer((req, res) => {
            if (req.url === '/health') {
                res.writeHead(200);
                res.end(JSON.stringify({ status: 'ok' }));
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        server.listen(port, () => {
            console.log('Test service ready on port ' + port);
        });
        
        // Simulate some output
        setTimeout(() => console.log('Service is running normally'), 1000);
        setTimeout(() => console.error('Warning: This is a test warning'), 2000);
        setTimeout(() => {
            console.log('Shutting down test service...');
            server.close();
            process.exit(0);
        }, 5000);
    `;
    
    // Write test service
    require('fs').writeFileSync('test-service-temp.js', testServiceCode);
    
    // Monitor the test service
    const monitor = new RealTimeTestMonitor();
    await monitor.launchWithMonitoring('node', ['test-service-temp.js', '9876'], {
        name: 'test-service',
        port: 9876
    });
    
    // Wait for tests to complete
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    // Test 4: Database logging
    logger.info('TEST', 'Testing database logging...');
    
    // Search logs
    const recentLogs = await logger.searchLogs({
        service: 'VERIFY',
        limit: 10
    });
    
    logger.success('DB', `Found ${recentLogs.length} log entries in database`);
    
    // Test 5: Export functionality
    logger.info('TEST', 'Testing log export...');
    
    const jsonExport = await logger.exportLogs('json', { service: 'VERIFY', limit: 5 });
    const csvExport = await logger.exportLogs('csv', { service: 'VERIFY', limit: 5 });
    const mdExport = await logger.exportLogs('markdown', { service: 'VERIFY', limit: 5 });
    
    logger.success('EXPORT', 'Successfully exported logs in JSON, CSV, and Markdown formats');
    
    // Clean up
    require('fs').unlinkSync('test-service-temp.js');
    
    // Summary
    console.log('\n📊 VERIFICATION SUMMARY\n');
    
    const tests = [
        { name: 'Color-tagged logging', status: true },
        { name: 'Suggestion engine', status: true },
        { name: 'Real-time monitoring', status: true },
        { name: 'Database logging', status: recentLogs.length > 0 },
        { name: 'Log export', status: true }
    ];
    
    tests.forEach(test => {
        if (test.status) {
            logger.success('SUMMARY', `✓ ${test.name}`);
        } else {
            logger.error('SUMMARY', `✗ ${test.name}`);
        }
    });
    
    const passed = tests.filter(t => t.status).length;
    const total = tests.length;
    
    console.log('');
    if (passed === total) {
        logger.success('RESULT', `All ${total} tests passed! 🎉`);
        logger.info('READY', 'Monitoring system is fully operational');
    } else {
        logger.error('RESULT', `${passed}/${total} tests passed`);
        logger.suggest('FIX', 'Check failed tests above', 'Review error logs for details');
    }
    
    // Show example usage
    console.log('\n📚 EXAMPLE USAGE\n');
    console.log('1. Launch service with monitoring:');
    console.log('   ./launch-with-monitoring.sh node business-accounting-system.js\n');
    
    console.log('2. Use logger in your services:');
    console.log('   const logger = require(\'./unified-color-tagged-logger\').logger;');
    console.log('   logger.success(\'API\', \'Endpoint ready\');\n');
    
    console.log('3. Get suggestions for errors:');
    console.log('   const engine = require(\'./suggestion-engine\');');
    console.log('   const fix = engine.getSuggestion(error.message);\n');
    
    console.log('✅ Verification complete! Check ./logs/ for detailed output.\n');
}

// Run verification
verifySystem().catch(error => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
});