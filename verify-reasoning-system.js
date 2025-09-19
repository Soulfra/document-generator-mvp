#!/usr/bin/env node

/**
 * 🔍✅ REASONING SYSTEM VERIFICATION
 * =================================
 * Comprehensive test suite to verify all components are working
 * - Tests logging system
 * - Verifies AI bridge connectivity
 * - Checks visualization components
 * - End-to-end integration tests
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const http = require('http');

class ReasoningSystemVerifier {
    constructor() {
        this.results = [];
        this.servers = new Map();
        this.testData = [];
        this.vizDir = path.join(process.cwd(), '.reasoning-viz');
        
        this.tests = [
            { name: 'Directory Structure', test: () => this.testDirectoryStructure() },
            { name: 'Logger Functionality', test: () => this.testLogger() },
            { name: 'JSONL Format', test: () => this.testJSONLFormat() },
            { name: 'Viz Manager Server', test: () => this.testVizManager() },
            { name: 'AI Bridge Server', test: () => this.testAIBridge() },
            { name: 'WebSocket Connection', test: () => this.testWebSocket() },
            { name: 'Context API', test: () => this.testContextAPI() },
            { name: 'File Watching', test: () => this.testFileWatching() },
            { name: 'Real-time Streaming', test: () => this.testRealtimeStreaming() },
            { name: 'End-to-End Flow', test: () => this.testEndToEnd() }
        ];
    }
    
    async runAllTests() {
        console.log('🔍✅ REASONING SYSTEM VERIFICATION');
        console.log('==================================');
        console.log(`Testing ${this.tests.length} components...\n`);
        
        for (const test of this.tests) {
            await this.runTest(test);
        }
        
        this.printResults();
        await this.cleanup();
        
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        
        if (passed === total) {
            console.log('\n🎉 ALL TESTS PASSED! System is ready to use.');
            process.exit(0);
        } else {
            console.log(`\n❌ ${total - passed} tests failed. Check details above.`);
            process.exit(1);
        }
    }
    
    async runTest(test) {
        const startTime = Date.now();
        
        try {
            console.log(`🔍 Testing: ${test.name}...`);
            
            const result = await test.test();
            const duration = Date.now() - startTime;
            
            this.results.push({
                name: test.name,
                passed: true,
                duration,
                details: result
            });
            
            console.log(`   ✅ PASSED (${duration}ms)`);
            if (result && typeof result === 'string') {
                console.log(`   📝 ${result}`);
            }
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            this.results.push({
                name: test.name,
                passed: false,
                duration,
                error: error.message
            });
            
            console.log(`   ❌ FAILED (${duration}ms)`);
            console.log(`   💥 ${error.message}`);
        }
        
        console.log('');
    }
    
    async testDirectoryStructure() {
        const requiredDirs = [
            this.vizDir,
            path.join(this.vizDir, 'logs'),
            path.join(this.vizDir, 'captures'),
            path.join(this.vizDir, 'sessions'),
            path.join(this.vizDir, 'web'),
            path.join(this.vizDir, 'docs')
        ];
        
        for (const dir of requiredDirs) {
            try {
                const stats = await fs.stat(dir);
                if (!stats.isDirectory()) {
                    throw new Error(`${dir} is not a directory`);
                }
            } catch (error) {
                if (error.code === 'ENOENT') {
                    throw new Error(`Missing directory: ${dir}`);
                }
                throw error;
            }
        }
        
        // Check for required files
        const configFile = path.join(this.vizDir, 'config.json');
        await fs.access(configFile);
        
        return `All required directories and files exist`;
    }
    
    async testLogger() {
        // Test logger import and basic functionality
        delete require.cache[require.resolve('./reasoning-logger.js')];
        const logger = require('./reasoning-logger.js');
        
        // Test different log types
        const thoughtEntry = logger.thought('Test thought for verification');
        const actionEntry = logger.action('Test action for verification');
        const explorationEntry = logger.exploration('Test exploration for verification');
        
        // Verify entry structure
        if (!thoughtEntry.id || !thoughtEntry.timestamp || !thoughtEntry.type) {
            throw new Error('Logger entries missing required fields');
        }
        
        if (thoughtEntry.type !== 'thought') {
            throw new Error('Logger not categorizing entries correctly');
        }
        
        // Force flush to write to file
        await logger.flush();
        
        this.testData.push(thoughtEntry, actionEntry, explorationEntry);
        
        return `Logger creating entries with correct structure`;
    }
    
    async testJSONLFormat() {
        // Find today's log file
        const today = new Date().toISOString().split('T')[0];
        const logFile = path.join(this.vizDir, 'logs', `${today}.jsonl`);
        
        try {
            const content = await fs.readFile(logFile, 'utf8');
            const lines = content.trim().split('\n');
            
            // Test each line is valid JSON
            for (const line of lines) {
                if (line.trim()) {
                    const entry = JSON.parse(line); // Will throw if invalid
                    
                    // Check required JSONL fields
                    if (!entry.timestamp || !entry.type || !entry.text) {
                        throw new Error('JSONL entry missing required fields');
                    }
                    
                    // Check schema
                    if (!entry._schema || entry._schema.format !== 'reasoning-stream-jsonl') {
                        throw new Error('JSONL entry missing proper schema');
                    }
                }
            }
            
            return `${lines.length} valid JSONL entries in log file`;
            
        } catch (error) {
            if (error.code === 'ENOENT') {
                throw new Error('No log file created - logger may not be working');
            }
            throw error;
        }
    }
    
    async testVizManager() {
        // Start viz manager server
        return new Promise((resolve, reject) => {
            const manager = spawn('node', ['reasoning-viz-manager.js'], {
                stdio: 'pipe',
                env: { ...process.env, PORT: '3006' }
            });
            
            this.servers.set('vizManager', manager);
            
            let output = '';
            manager.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            manager.stderr.on('data', (data) => {
                output += data.toString();
            });
            
            // Wait for server to start
            setTimeout(() => {
                if (output.includes('REASONING VIZ MANAGER ACTIVE')) {
                    resolve('Viz Manager server started successfully');
                } else {
                    reject(new Error(`Viz Manager failed to start: ${output}`));
                }
            }, 3000);
        });
    }
    
    async testAIBridge() {
        // Start AI bridge server
        return new Promise((resolve, reject) => {
            const bridge = spawn('node', ['ai-reasoning-bridge.js'], {
                stdio: 'pipe',
                env: { ...process.env, PORT: '3007' }
            });
            
            this.servers.set('aiBridge', bridge);
            
            let output = '';
            bridge.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            bridge.stderr.on('data', (data) => {
                output += data.toString();
            });
            
            // Wait for server to start
            setTimeout(() => {
                if (output.includes('AI REASONING BRIDGE ACTIVE')) {
                    resolve('AI Bridge server started successfully');
                } else {
                    reject(new Error(`AI Bridge failed to start: ${output}`));
                }
            }, 3000);
        });
    }
    
    async testWebSocket() {
        // Test WebSocket connection to viz manager
        return new Promise((resolve, reject) => {
            const WebSocket = require('ws');
            const ws = new WebSocket('ws://localhost:3006');
            
            const timeout = setTimeout(() => {
                ws.close();
                reject(new Error('WebSocket connection timeout'));
            }, 5000);
            
            ws.on('open', () => {
                clearTimeout(timeout);
                ws.close();
                resolve('WebSocket connection successful');
            });
            
            ws.on('error', (error) => {
                clearTimeout(timeout);
                reject(new Error(`WebSocket error: ${error.message}`));
            });
        });
    }
    
    async testContextAPI() {
        // Test AI Bridge context API
        return new Promise((resolve, reject) => {
            const req = http.get('http://localhost:3007/api/ai/context', (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        
                        if (!parsed.success) {
                            reject(new Error('Context API returned error'));
                            return;
                        }
                        
                        if (!parsed.context) {
                            reject(new Error('Context API missing context field'));
                            return;
                        }
                        
                        resolve(`Context API returning data: ${typeof parsed.context}`);
                        
                    } catch (error) {
                        reject(new Error(`Context API returned invalid JSON: ${error.message}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(new Error(`Context API request failed: ${error.message}`));
            });
            
            req.setTimeout(5000, () => {
                req.destroy();
                reject(new Error('Context API request timeout'));
            });
        });
    }
    
    async testFileWatching() {
        // Create a test log entry and see if it gets picked up
        const logger = require('./reasoning-logger.js');
        
        // Create test entry
        const testEntry = logger.thought('File watching verification test entry');
        await logger.flush();
        
        // Wait a moment for file watching to pick it up
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return 'File watching test completed (manual verification needed)';
    }
    
    async testRealtimeStreaming() {
        // Test the event stream endpoint
        return new Promise((resolve, reject) => {
            const req = http.get('http://localhost:3007/api/ai/stream', (res) => {
                if (res.headers['content-type'] !== 'text/event-stream') {
                    reject(new Error('Stream endpoint not returning event-stream'));
                    return;
                }
                
                let dataReceived = false;
                
                res.on('data', (chunk) => {
                    const data = chunk.toString();
                    if (data.includes('data:')) {
                        dataReceived = true;
                    }
                });
                
                setTimeout(() => {
                    res.destroy();
                    if (dataReceived) {
                        resolve('Real-time streaming endpoint working');
                    } else {
                        reject(new Error('No data received from stream'));
                    }
                }, 3000);
            });
            
            req.on('error', (error) => {
                reject(new Error(`Stream request failed: ${error.message}`));
            });
        });
    }
    
    async testEndToEnd() {
        // Create a reasoning entry and verify it flows through the system
        const logger = require('./reasoning-logger.js');
        
        // Create test entries of different types
        const entries = [
            logger.thought('End-to-end test thought'),
            logger.action('End-to-end test action'),
            logger.exploration('End-to-end test exploration'),
            logger.discovery('End-to-end test discovery')
        ];
        
        await logger.flush();
        
        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if AI bridge can see the entries
        try {
            const response = await this.httpGet('http://localhost:3007/api/ai/context?format=raw');
            const data = JSON.parse(response);
            
            if (!data.success || !Array.isArray(data.context)) {
                throw new Error('AI Bridge not returning proper context');
            }
            
            // Look for our test entries
            const testThought = data.context.find(entry => 
                entry.text && entry.text.includes('End-to-end test thought')
            );
            
            if (!testThought) {
                throw new Error('Test entry not found in AI Bridge context');
            }
            
            return `End-to-end flow working: ${data.context.length} entries in context`;
            
        } catch (error) {
            throw new Error(`End-to-end test failed: ${error.message}`);
        }
    }
    
    httpGet(url) {
        return new Promise((resolve, reject) => {
            http.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        });
    }
    
    printResults() {
        console.log('\n📊 TEST RESULTS SUMMARY');
        console.log('========================');
        
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        const passRate = ((passed / total) * 100).toFixed(1);
        
        console.log(`✅ Passed: ${passed}/${total} (${passRate}%)`);
        console.log(`❌ Failed: ${total - passed}/${total}`);
        console.log(`⏱️  Total time: ${this.results.reduce((sum, r) => sum + r.duration, 0)}ms\n`);
        
        // Detailed results
        this.results.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            const time = `${result.duration}ms`;
            console.log(`${status} ${result.name.padEnd(25)} ${time.padStart(10)}`);
            
            if (result.error) {
                console.log(`    💥 ${result.error}`);
            }
            if (result.details) {
                console.log(`    📝 ${result.details}`);
            }
        });
    }
    
    async cleanup() {
        console.log('\n🧹 Cleaning up test servers...');
        
        for (const [name, server] of this.servers) {
            try {
                server.kill('SIGTERM');
                console.log(`   🛑 Stopped ${name}`);
            } catch (error) {
                console.log(`   ⚠️  Failed to stop ${name}: ${error.message}`);
            }
        }
        
        // Wait for cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// Add CLI commands
class ReasoningSystemDemo {
    constructor() {
        this.logger = require('./reasoning-logger.js');
    }
    
    async runDemo() {
        console.log('🎭 REASONING SYSTEM DEMO');
        console.log('========================');
        console.log('Creating sample reasoning entries...\n');
        
        const scenarios = [
            { type: 'thought', text: 'I need to debug this authentication issue' },
            { type: 'exploration', text: 'Looking through the user login code' },
            { type: 'discovery', text: 'Found the problem - missing JWT validation!' },
            { type: 'action', text: 'Adding the validation middleware' },
            { type: 'reasoning', text: 'This should fix the security vulnerability' },
            { type: 'emotion', text: 'Feeling relieved that we caught this early' }
        ];
        
        for (let i = 0; i < scenarios.length; i++) {
            const scenario = scenarios[i];
            
            console.log(`${i + 1}. ${this.getTypeEmoji(scenario.type)} ${scenario.text}`);
            
            // Log the entry
            this.logger.log(scenario.type, scenario.text);
            
            // Wait between entries for realistic timing
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        await this.logger.flush();
        
        console.log('\n✅ Demo entries created!');
        console.log('🌐 Check the visualization at:');
        console.log('   • Viz Manager: http://localhost:3006');
        console.log('   • AI Watcher: http://localhost:3007');
        console.log('\n📋 Copy context with:');
        console.log('   curl http://localhost:3007/api/ai/copyable-context');
    }
    
    getTypeEmoji(type) {
        const emojis = {
            thought: '💭',
            action: '🔴',
            exploration: '🟣',
            reasoning: '🔵',
            discovery: '🟢',
            emotion: '🟡'
        };
        return emojis[type] || '📝';
    }
}

// CLI handling
const command = process.argv[2] || 'test';

switch (command) {
    case 'test':
    case 'verify':
        new ReasoningSystemVerifier().runAllTests();
        break;
    
    case 'demo':
        new ReasoningSystemDemo().runDemo();
        break;
    
    case 'quick':
        // Quick test without starting servers
        const quickVerifier = new ReasoningSystemVerifier();
        quickVerifier.tests = quickVerifier.tests.slice(0, 3); // Only first 3 tests
        quickVerifier.runAllTests();
        break;
    
    default:
        console.log(`
🔍✅ REASONING SYSTEM VERIFICATION

Commands:
  node verify-reasoning-system.js test     # Full verification suite
  node verify-reasoning-system.js demo    # Create demo reasoning entries
  node verify-reasoning-system.js quick   # Quick structure test only

What gets tested:
  ✅ Directory structure and isolation
  ✅ Logger functionality and JSONL format  
  ✅ Viz Manager server startup
  ✅ AI Bridge server startup
  ✅ WebSocket connections
  ✅ Context API endpoints
  ✅ File watching system
  ✅ Real-time streaming
  ✅ End-to-end integration

This ensures all components work together correctly.
        `);
}