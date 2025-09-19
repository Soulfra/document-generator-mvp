#!/usr/bin/env node

/**
 * TEST WHAT ACTUALLY WORKS
 * Stop creating new shit, test the existing systems
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class ActualTester {
  constructor() {
    this.results = {
      working: [],
      broken: [],
      untested: []
    };
    
    console.log('🧪 TESTING WHAT ACTUALLY EXISTS\n');
    console.log('No more creating. Just testing.\n');
  }

  async testEverything() {
    // Test 1: Basic server
    await this.testComponent('Basic Server', async () => {
      console.log('Testing: node server.js');
      
      // Check if server.js exists and has required dependencies
      if (!fs.existsSync('./server.js')) {
        throw new Error('server.js not found');
      }
      
      // Check if required modules exist
      const requiredFiles = [
        './flag-tag-system.js',
        './database-integration.js'
      ];
      
      for (const file of requiredFiles) {
        if (!fs.existsSync(file)) {
          throw new Error(`Missing dependency: ${file}`);
        }
      }
      
      return 'Server files exist';
    });

    // Test 2: Master Menu
    await this.testComponent('Master Menu', async () => {
      if (!fs.existsSync('./master-menu-compactor.html')) {
        throw new Error('master-menu-compactor.html not found');
      }
      return 'Master menu exists';
    });

    // Test 3: AI Economy Runtime
    await this.testComponent('AI Economy Runtime', async () => {
      if (!fs.existsSync('./ai-economy-runtime.js')) {
        throw new Error('ai-economy-runtime.js not found');
      }
      
      // Try to load it
      try {
        const AIEconomyRuntime = require('./ai-economy-runtime.js');
        const runtime = new AIEconomyRuntime();
        return `AI Economy loaded. Agents: ${runtime.agents.size}`;
      } catch (err) {
        throw new Error(`Failed to load AI Economy: ${err.message}`);
      }
    });

    // Test 4: Blamechain
    await this.testComponent('Blamechain', async () => {
      if (!fs.existsSync('./blamechain.js')) {
        throw new Error('blamechain.js not found');
      }
      
      try {
        const BlameChain = require('./blamechain.js');
        const chain = new BlameChain();
        return 'Blamechain loaded';
      } catch (err) {
        throw new Error(`Failed to load Blamechain: ${err.message}`);
      }
    });

    // Test 5: Contract System
    await this.testComponent('Contract Veil Piercing', async () => {
      if (!fs.existsSync('./contract-veil-piercing-system.js')) {
        throw new Error('contract-veil-piercing-system.js not found');
      }
      
      try {
        const ContractVeilPiercingSystem = require('./contract-veil-piercing-system.js');
        const contracts = new ContractVeilPiercingSystem();
        return 'Contract system loaded';
      } catch (err) {
        throw new Error(`Failed to load contracts: ${err.message}`);
      }
    });

    // Test 6: MAX Integration
    await this.testComponent('MAX Integration', async () => {
      if (!fs.existsSync('./max-integration-system.js')) {
        throw new Error('max-integration-system.js not found');
      }
      
      try {
        const MaxIntegrationSystem = require('./max-integration-system.js');
        const max = new MaxIntegrationSystem();
        return 'MAX system loaded';
      } catch (err) {
        throw new Error(`Failed to load MAX: ${err.message}`);
      }
    });

    // Test 7: Check for package.json
    await this.testComponent('Package Dependencies', async () => {
      if (!fs.existsSync('./package.json')) {
        throw new Error('package.json not found');
      }
      
      const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      const deps = Object.keys(pkg.dependencies || {}).length;
      const devDeps = Object.keys(pkg.devDependencies || {}).length;
      
      return `Dependencies: ${deps}, DevDeps: ${devDeps}`;
    });

    // Test 8: Database file
    await this.testComponent('Database', async () => {
      const dbFile = './soulfra.db';
      if (fs.existsSync(dbFile)) {
        const stats = fs.statSync(dbFile);
        return `Database exists: ${(stats.size / 1024).toFixed(2)}KB`;
      }
      return 'No database file (will be created on first run)';
    });

    // Test 9: Actually try to start the server
    await this.testComponent('Server Startup', async () => {
      return new Promise((resolve, reject) => {
        console.log('  Attempting to start server...');
        
        const serverProcess = spawn('node', ['server.js'], {
          env: { ...process.env, PORT: 3456 } // Use different port for test
        });
        
        let output = '';
        let errorOutput = '';
        
        serverProcess.stdout.on('data', (data) => {
          output += data.toString();
          if (output.includes('Server running') || output.includes('listening')) {
            serverProcess.kill();
            resolve('Server starts successfully');
          }
        });
        
        serverProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        serverProcess.on('error', (err) => {
          reject(new Error(`Failed to start: ${err.message}`));
        });
        
        // Timeout after 5 seconds
        setTimeout(() => {
          serverProcess.kill();
          if (errorOutput) {
            reject(new Error(`Server errors: ${errorOutput.substring(0, 200)}`));
          } else {
            reject(new Error('Server timeout - no response'));
          }
        }, 5000);
      });
    });

    // Display results
    this.displayResults();
  }

  async testComponent(name, testFn) {
    process.stdout.write(`Testing ${name}... `);
    
    try {
      const result = await testFn();
      console.log('✅');
      this.results.working.push({ name, result });
    } catch (error) {
      console.log('❌');
      this.results.broken.push({ name, error: error.message });
    }
  }

  displayResults() {
    console.log('\n' + '='.repeat(70));
    console.log('TEST RESULTS');
    console.log('='.repeat(70));
    
    console.log(`\n✅ WORKING (${this.results.working.length}):`);
    this.results.working.forEach(item => {
      console.log(`  - ${item.name}: ${item.result}`);
    });
    
    console.log(`\n❌ BROKEN (${this.results.broken.length}):`);
    this.results.broken.forEach(item => {
      console.log(`  - ${item.name}: ${item.error}`);
    });
    
    console.log('\n📊 SUMMARY:');
    console.log(`  Total Tests: ${this.results.working.length + this.results.broken.length}`);
    console.log(`  Passed: ${this.results.working.length}`);
    console.log(`  Failed: ${this.results.broken.length}`);
    console.log(`  Success Rate: ${((this.results.working.length / (this.results.working.length + this.results.broken.length)) * 100).toFixed(1)}%`);
    
    console.log('\n🎯 REALITY CHECK:');
    if (this.results.working.length > this.results.broken.length) {
      console.log('  ✅ Most things actually work!');
      console.log('  📍 Next: Just run "node server.js" and use it');
    } else {
      console.log('  ❌ More broken than working');
      console.log('  📍 Next: Fix the broken parts before creating more');
    }
    
    // Save results
    fs.writeFileSync(
      './test-results-actual.json',
      JSON.stringify(this.results, null, 2)
    );
    
    console.log('\n💾 Results saved to: test-results-actual.json');
  }
}

// Just run the tests
if (require.main === module) {
  const tester = new ActualTester();
  
  tester.testEverything()
    .then(() => {
      console.log('\n✅ Testing complete');
      console.log('\n🚀 TO ACTUALLY USE THE SYSTEM:');
      console.log('  1. npm install (if needed)');
      console.log('  2. node server.js');
      console.log('  3. Open http://localhost:3000/master');
      console.log('\nSTOP CREATING. START USING.');
    })
    .catch(err => {
      console.error('\n❌ Testing failed:', err);
      process.exit(1);
    });
}

module.exports = ActualTester;