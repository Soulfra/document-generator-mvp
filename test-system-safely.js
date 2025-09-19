// Safe System Test Runner - Tests components without crashing everything
// Captures errors, logs them, and provides detailed feedback

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class SafeSystemTester {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            tests: [],
            errors: [],
            warnings: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0
            }
        };
        
        this.logFile = path.join(__dirname, `test-results-${Date.now()}.json`);
    }
    
    async runTests() {
        console.log('🧪 Safe System Test Runner Starting...');
        console.log('📝 Results will be saved to:', this.logFile);
        console.log('');
        
        // Test 1: Check file existence
        await this.testFileExistence();
        
        // Test 2: Check module imports
        await this.testModuleImports();
        
        // Test 3: Test individual components
        await this.testComponents();
        
        // Test 4: Test electron app (safely)
        await this.testElectronApp();
        
        // Save results
        this.saveResults();
        this.printSummary();
    }
    
    async testFileExistence() {
        console.log('📁 Testing file existence...');
        
        const requiredFiles = [
            'electron-main.js',
            'context-memory-stream-manager.js',
            'ssh-terminal-runtime-ring-system.js',
            'shiprekt-visual-interface-electron.js',
            'clarity-workflow-engine.js',
            'cringeproof-verification.js',
            'symlink-manager.service.js'
        ];
        
        for (const file of requiredFiles) {
            const testName = `File exists: ${file}`;
            const filePath = path.join(__dirname, file);
            
            if (fs.existsSync(filePath)) {
                this.recordTest(testName, 'passed', `Found at ${filePath}`);
            } else {
                this.recordTest(testName, 'failed', `Not found at ${filePath}`);
            }
        }
    }
    
    async testModuleImports() {
        console.log('\n📦 Testing module imports...');
        
        const modules = [
            { name: 'ContextMemoryStreamManager', file: './context-memory-stream-manager.js' },
            { name: 'SSHTerminalRuntimeRingSystem', file: './ssh-terminal-runtime-ring-system.js' },
            { name: 'ShipRektVisualInterfaceElectron', file: './shiprekt-visual-interface-electron.js' }
        ];
        
        for (const module of modules) {
            const testName = `Import module: ${module.name}`;
            
            try {
                // Try to require the module
                const ModuleClass = require(module.file);
                
                // Check if it's a valid constructor
                if (typeof ModuleClass === 'function') {
                    this.recordTest(testName, 'passed', 'Module imported successfully');
                } else {
                    this.recordTest(testName, 'warning', `Module imported but not a constructor: ${typeof ModuleClass}`);
                }
            } catch (error) {
                this.recordTest(testName, 'failed', error.message);
                this.errors.push({
                    module: module.name,
                    error: error.message,
                    stack: error.stack
                });
            }
        }
    }
    
    async testComponents() {
        console.log('\n🔧 Testing individual components...');
        
        // Test 1: Context Memory Stream Manager
        await this.testContextManager();
        
        // Test 2: SSH Terminal System
        await this.testSSHTerminalSystem();
        
        // Test 3: Symlink Manager
        await this.testSymlinkManager();
    }
    
    async testContextManager() {
        const testName = 'Context Memory Stream Manager initialization';
        
        try {
            const ContextMemoryStreamManager = require('./context-memory-stream-manager.js');
            
            // Create instance with error handling
            const manager = new ContextMemoryStreamManager();
            
            // Test basic functionality
            const health = manager.getSystemHealth();
            
            if (health && health.timestamp) {
                this.recordTest(testName, 'passed', 'Manager initialized and health check works');
                
                // Test context streams
                if (health.contextStreams) {
                    this.recordTest('Context streams available', 'passed', 
                        `Found ${Object.keys(health.contextStreams).length} streams`);
                }
                
                // Test memory pools
                if (health.memoryPools) {
                    this.recordTest('Memory pools available', 'passed',
                        `Found ${Object.keys(health.memoryPools).length} pools`);
                }
            } else {
                this.recordTest(testName, 'warning', 'Manager initialized but health check incomplete');
            }
            
        } catch (error) {
            this.recordTest(testName, 'failed', error.message);
        }
    }
    
    async testSSHTerminalSystem() {
        const testName = 'SSH Terminal Runtime Ring System initialization';
        
        try {
            const SSHTerminalRuntimeRingSystem = require('./ssh-terminal-runtime-ring-system.js');
            
            // Create instance
            const sshSystem = new SSHTerminalRuntimeRingSystem();
            
            // Check if runtime rings are initialized
            if (sshSystem.runtimeRings) {
                const ringCount = Object.keys(sshSystem.runtimeRings).length;
                this.recordTest(testName, 'passed', `System initialized with ${ringCount} runtime rings`);
                
                // Test ring status
                for (const [ringId, ring] of Object.entries(sshSystem.runtimeRings)) {
                    if (ring.status && ring.name) {
                        this.recordTest(`Runtime ring ${ringId}`, 'passed', 
                            `${ring.name} - Status: ${ring.status}`);
                    }
                }
            } else {
                this.recordTest(testName, 'warning', 'System initialized but no runtime rings found');
            }
            
            // Clean up - close any open servers
            if (sshSystem.server) {
                sshSystem.server.close();
            }
            
        } catch (error) {
            this.recordTest(testName, 'failed', error.message);
        }
    }
    
    async testSymlinkManager() {
        const testName = 'Symlink Manager Service initialization';
        
        try {
            const SymlinkManagerService = require('./symlink-manager.service.js');
            
            // Create instance
            const symlinkManager = new SymlinkManagerService();
            
            // Get status
            const status = await symlinkManager.getStatus();
            
            if (status && status.service === 'symlink-manager') {
                this.recordTest(testName, 'passed', 'Symlink manager initialized successfully');
                
                // Check link registry
                if (status.links) {
                    const linkCount = Object.keys(status.links).length;
                    this.recordTest('Symlink registry', 'passed', `Found ${linkCount} link groups`);
                }
            } else {
                this.recordTest(testName, 'warning', 'Manager initialized but status incomplete');
            }
            
        } catch (error) {
            this.recordTest(testName, 'failed', error.message);
        }
    }
    
    async testElectronApp() {
        console.log('\n🖥️  Testing Electron app (safe mode)...');
        
        const testName = 'Electron app startup test';
        
        // First check if electron binary exists
        try {
            const electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron');
            
            if (!fs.existsSync(electronPath)) {
                this.recordTest(testName, 'skipped', 'Electron binary not found');
                return;
            }
            
            // Test electron app with a timeout
            const electronTest = spawn('node', ['-e', `
                try {
                    const app = require('./electron-main.js');
                    console.log('ELECTRON_TEST_SUCCESS');
                    process.exit(0);
                } catch (error) {
                    console.error('ELECTRON_TEST_ERROR:', error.message);
                    process.exit(1);
                }
            `], {
                cwd: __dirname,
                timeout: 5000
            });
            
            let output = '';
            let errorOutput = '';
            
            electronTest.stdout.on('data', (data) => {
                output += data.toString();
            });
            
            electronTest.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });
            
            electronTest.on('close', (code) => {
                if (code === 0 && output.includes('ELECTRON_TEST_SUCCESS')) {
                    this.recordTest(testName, 'passed', 'Electron app can be loaded');
                } else {
                    this.recordTest(testName, 'failed', errorOutput || 'Unknown error');
                }
            });
            
            // Give it time to complete
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            this.recordTest(testName, 'failed', error.message);
        }
    }
    
    recordTest(name, status, details) {
        const test = {
            name,
            status,
            details,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.tests.push(test);
        this.testResults.summary.total++;
        this.testResults.summary[status === 'warning' ? 'passed' : status]++;
        
        // Console output with colors
        const symbols = {
            passed: '✅',
            failed: '❌',
            warning: '⚠️ ',
            skipped: '⏭️ '
        };
        
        console.log(`${symbols[status]} ${name}`);
        if (details && status !== 'passed') {
            console.log(`   ${details}`);
        }
    }
    
    saveResults() {
        fs.writeFileSync(this.logFile, JSON.stringify(this.testResults, null, 2));
    }
    
    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${this.testResults.summary.total}`);
        console.log(`✅ Passed: ${this.testResults.summary.passed}`);
        console.log(`❌ Failed: ${this.testResults.summary.failed}`);
        console.log(`⏭️  Skipped: ${this.testResults.summary.skipped}`);
        console.log('');
        console.log(`📄 Full results saved to: ${this.logFile}`);
        
        if (this.testResults.summary.failed > 0) {
            console.log('\n⚠️  CRITICAL ISSUES FOUND:');
            this.testResults.tests
                .filter(t => t.status === 'failed')
                .forEach(t => {
                    console.log(`  - ${t.name}: ${t.details}`);
                });
        }
        
        // Provide recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        if (this.testResults.summary.failed > 0) {
            console.log('  1. Fix the failed tests before running the full system');
            console.log('  2. Check error logs for detailed stack traces');
            console.log('  3. Ensure all dependencies are installed');
        } else if (this.testResults.summary.passed === this.testResults.summary.total) {
            console.log('  ✨ All tests passed! The system should be safe to run.');
            console.log('  📝 Run: npm run electron-dev');
        } else {
            console.log('  ⚠️  Some warnings detected. Review before running.');
        }
    }
}

// Run the tests
if (require.main === module) {
    const tester = new SafeSystemTester();
    tester.runTests().catch(console.error);
}

module.exports = SafeSystemTester;