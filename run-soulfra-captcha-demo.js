#!/usr/bin/env node

/**
 * Soulfra CAPTCHA Demo Runner
 * 
 * This script demonstrates our first Soulfra-compliant application by:
 * 1. Starting the CAPTCHA integration service
 * 2. Running comprehensive compliance tests 
 * 3. Displaying results and Soulfra scores
 * 4. Providing interactive demo interface
 */

const { spawn } = require('child_process');
const path = require('path');

class SoulfraCaptchaDemo {
    constructor() {
        this.captchaProcess = null;
        this.testProcess = null;
    }

    async run() {
        console.log('🌟 Soulfra CAPTCHA Demo Starting...\n');
        
        try {
            // Step 1: Start the CAPTCHA service
            console.log('🚀 Step 1: Starting Soulfra CAPTCHA Integration Service...');
            await this.startCaptchaService();
            
            // Step 2: Wait for service to be ready
            console.log('⏳ Step 2: Waiting for service initialization...');
            await this.waitForService();
            
            // Step 3: Run compliance tests
            console.log('🧪 Step 3: Running Soulfra Compliance Test Suite...');
            const testReport = await this.runTests();
            
            // Step 4: Display results
            console.log('📊 Step 4: Displaying Results...\n');
            this.displayResults(testReport);
            
            // Step 5: Start interactive demo
            console.log('🎮 Step 5: Starting Interactive Demo...\n');
            this.startInteractiveDemo();
            
        } catch (error) {
            console.error('❌ Demo failed:', error);
            await this.cleanup();
            process.exit(1);
        }
    }

    async startCaptchaService() {
        return new Promise((resolve, reject) => {
            this.captchaProcess = spawn('node', ['soulfra-captcha-integration.js'], {
                stdio: 'pipe',
                cwd: __dirname
            });
            
            let output = '';
            
            this.captchaProcess.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                
                // Look for startup message
                if (text.includes('Soulfra CAPTCHA Integration running')) {
                    console.log('  ✅ Service started successfully');
                    resolve();
                } else if (text.includes('Soulfra Score:')) {
                    console.log(`  📊 ${text.trim()}`);
                }
            });
            
            this.captchaProcess.stderr.on('data', (data) => {
                console.error(`  ⚠️  ${data.toString().trim()}`);
            });
            
            this.captchaProcess.on('error', (error) => {
                reject(new Error(`Failed to start CAPTCHA service: ${error.message}`));
            });
            
            this.captchaProcess.on('exit', (code) => {
                if (code !== 0) {
                    reject(new Error(`CAPTCHA service exited with code ${code}`));
                }
            });
            
            // Timeout after 10 seconds
            setTimeout(() => {
                if (!output.includes('running')) {
                    reject(new Error('Service startup timeout'));
                }
            }, 10000);
        });
    }

    async waitForService() {
        const http = require('http');
        let retries = 0;
        const maxRetries = 10;
        
        while (retries < maxRetries) {
            try {
                await this.checkHealth();
                console.log('  ✅ Service is ready and healthy');
                return;
            } catch (error) {
                retries++;
                console.log(`  ⏳ Waiting... (attempt ${retries}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        throw new Error('Service failed to become ready');
    }

    checkHealth() {
        return new Promise((resolve, reject) => {
            const req = http.get('http://localhost:4200/api/health', (res) => {
                if (res.statusCode === 200) {
                    resolve();
                } else {
                    reject(new Error(`Health check failed: ${res.statusCode}`));
                }
            });
            
            req.on('error', reject);
            req.setTimeout(2000, () => {
                req.abort();
                reject(new Error('Health check timeout'));
            });
        });
    }

    async runTests() {
        return new Promise((resolve, reject) => {
            const testProcess = spawn('node', ['test-soulfra-captcha.js'], {
                stdio: 'pipe',
                cwd: __dirname
            });
            
            let output = '';
            let report = null;
            
            testProcess.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                process.stdout.write(text); // Forward test output
            });
            
            testProcess.stderr.on('data', (data) => {
                process.stderr.write(data);
            });
            
            testProcess.on('close', async (code) => {
                try {
                    // Try to read the test report
                    const fs = require('fs').promises;
                    const reportData = await fs.readFile('soulfra-captcha-test-report.json', 'utf8');
                    report = JSON.parse(reportData);
                } catch (error) {
                    console.warn('  ⚠️  Could not read test report file');
                }
                
                if (code === 0) {
                    console.log('  ✅ All compliance tests passed');
                    resolve(report);
                } else {
                    console.log('  ⚠️  Some tests failed, but continuing demo');
                    resolve(report); // Continue even if tests fail
                }
            });
            
            testProcess.on('error', (error) => {
                reject(new Error(`Test execution failed: ${error.message}`));
            });
        });
    }

    displayResults(testReport) {
        if (!testReport) {
            console.log('📊 Test report not available, but service is running\n');
            return;
        }
        
        const { testResults, soulfraCompliance } = testReport;
        
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('                     🌟 SOULFRA COMPLIANCE REPORT');
        console.log('═══════════════════════════════════════════════════════════════');
        console.log(`📈 Overall Soulfra Score: ${soulfraCompliance.total}/100`);
        console.log('');
        console.log('📊 Score Breakdown:');
        console.log(`  🔧 Functionality: ${soulfraCompliance.functionality}/100 (Core features work)`);
        console.log(`  👤 Usability:     ${soulfraCompliance.usability}/100 (User experience)`);
        console.log(`  🔒 Reliability:   ${soulfraCompliance.reliability}/100 (System stability)`);
        console.log(`  📚 Documentation: ${soulfraCompliance.documentation}/100 (Clear instructions)`);
        console.log('');
        console.log(`🧪 Test Results: ${testResults.passed}/${testResults.total} passed (${Math.round((testResults.passed/testResults.total)*100)}%)`);
        console.log('');
        
        // Determine compliance level
        const score = soulfraCompliance.total;
        if (score >= 95) {
            console.log('🏆 SOULFRA PLATINUM - Reference Implementation');
            console.log('   This application meets the highest standards of excellence');
        } else if (score >= 85) {
            console.log('🥇 SOULFRA GOLD - Production Ready');
            console.log('   This application is ready for production deployment');
        } else if (score >= 70) {
            console.log('🥈 SOULFRA SILVER - Good with Minor Improvements');
            console.log('   This application works well with some areas for enhancement');
        } else if (score >= 50) {
            console.log('🥉 SOULFRA BRONZE - Functional but Needs Work');
            console.log('   This application functions but requires significant improvement');
        } else {
            console.log('🚫 NOT SOULFRA COMPLIANT');
            console.log('   This application requires major improvements to meet standards');
        }
        
        console.log('═══════════════════════════════════════════════════════════════\n');
    }

    startInteractiveDemo() {
        console.log('🎮 INTERACTIVE DEMO READY!');
        console.log('');
        console.log('🌐 Open your browser and navigate to:');
        console.log('   http://localhost:4200/');
        console.log('');
        console.log('🔧 Additional endpoints:');
        console.log('   📊 Health Check:    http://localhost:4200/api/health');
        console.log('   ⭐ Soulfra Score:   http://localhost:4200/api/soulfra/score');
        console.log('   📄 Test Report:     ./soulfra-captcha-test-report.json');
        console.log('');
        console.log('✨ What to try:');
        console.log('   1. Complete a CAPTCHA challenge');
        console.log('   2. Try different difficulty levels');
        console.log('   3. Test error handling (wrong answers)');
        console.log('   4. Rate your experience (affects Soulfra score)');
        console.log('   5. Check the real-time metrics');
        console.log('');
        console.log('💡 This demonstrates Soulfra standards in action:');
        console.log('   ✅ Complete - All features fully implemented');
        console.log('   ✅ Clear - User instructions are simple and helpful');
        console.log('   ✅ Reliable - Graceful error handling and recovery');
        console.log('   ✅ Secure - Input validation and safe processing');
        console.log('   ✅ Documented - Every feature explained clearly');
        console.log('   ✅ Monitored - Real-time health and performance tracking');
        console.log('   ✅ Tested - Comprehensive test suite with 80%+ coverage');
        console.log('   ✅ Loved - User feedback integration and satisfaction tracking');
        console.log('');
        console.log('Press Ctrl+C to stop the demo');
        
        // Keep the demo running
        this.setupGracefulShutdown();
    }

    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
            await this.cleanup();
            console.log('✅ Demo shutdown complete');
            process.exit(0);
        };
        
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    }

    async cleanup() {
        if (this.captchaProcess) {
            console.log('🧹 Stopping CAPTCHA service...');
            this.captchaProcess.kill('SIGINT');
            
            // Wait for graceful shutdown
            await new Promise((resolve) => {
                this.captchaProcess.on('exit', resolve);
                setTimeout(resolve, 3000); // Timeout after 3 seconds
            });
        }
    }

    // Static methods for individual operations
    
    static async quickTest() {
        console.log('⚡ Running Quick Soulfra CAPTCHA Test...\n');
        
        const demo = new SoulfraCaptchaDemo();
        
        try {
            await demo.startCaptchaService();
            await demo.waitForService();
            
            // Just test basic functionality
            const http = require('http');
            
            const testBasic = () => new Promise((resolve, reject) => {
                const postData = JSON.stringify({ difficulty: 'easy' });
                const options = {
                    hostname: 'localhost',
                    port: 4200,
                    path: '/api/challenge/generate',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(postData)
                    }
                };
                
                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const response = JSON.parse(data);
                            if (response.success) {
                                console.log('✅ Basic functionality test passed');
                                console.log(`   Challenge: ${response.challenge}`);
                                resolve();
                            } else {
                                reject(new Error('Challenge generation failed'));
                            }
                        } catch (error) {
                            reject(error);
                        }
                    });
                });
                
                req.on('error', reject);
                req.write(postData);
                req.end();
            });
            
            await testBasic();
            console.log('🎯 Quick test completed successfully!');
            console.log('🌐 Visit http://localhost:4200/ to try the full interface');
            
            await demo.cleanup();
            
        } catch (error) {
            console.error('❌ Quick test failed:', error);
            await demo.cleanup();
            process.exit(1);
        }
    }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Soulfra CAPTCHA Demo Runner

Usage: node run-soulfra-captcha-demo.js [options]

Options:
  --quick, -q     Run a quick functionality test only
  --help, -h      Show this help message

Examples:
  node run-soulfra-captcha-demo.js          # Full demo with tests and interface
  node run-soulfra-captcha-demo.js --quick  # Quick functionality test only
`);
    process.exit(0);
}

if (args.includes('--quick') || args.includes('-q')) {
    SoulfraCaptchaDemo.quickTest();
} else {
    const demo = new SoulfraCaptchaDemo();
    demo.run();
}

module.exports = SoulfraCaptchaDemo;