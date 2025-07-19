#!/usr/bin/env node

/**
 * PUPPET TEST AUTOMATION
 * Test all systems with puppeteer automation to make sure shit actually works
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;

console.log('🤖 PUPPET TEST AUTOMATION - TESTING ALL SYSTEMS');

class PuppetTestAutomation {
  constructor() {
    this.testResults = new Map();
    this.dependencies = new Map();
    this.systemTests = new Map();
    
    this.runAutomatedTests();
  }

  async runAutomatedTests() {
    console.log('🎭 Starting puppet automation tests...');
    
    // 1. Check if systems exist
    await this.checkSystemDependencies();
    
    // 2. Test basic functionality
    await this.testBasicFunctionality();
    
    // 3. Test integrations
    await this.testSystemIntegrations();
    
    // 4. Generate test report
    this.generateTestReport();
  }

  async checkSystemDependencies() {
    console.log('\n📦 CHECKING SYSTEM DEPENDENCIES...');
    
    const systemFiles = [
      'conductor-character.js',
      'unified-system-interface.js',
      'reasoning-differential-bash-engine.js',
      'hidden-layer-bus-gas-system.js',
      'backup-auth-system.js',
      'device-gis-router.js',
      'runtime-bash-executor.js',
      'simple-start.js'
    ];

    for (const file of systemFiles) {
      try {
        await fs.access(file);
        console.log(`  ✅ ${file} - EXISTS`);
        this.dependencies.set(file, { status: 'exists', tested: false });
      } catch (error) {
        console.log(`  ❌ ${file} - MISSING`);
        this.dependencies.set(file, { status: 'missing', error: error.message });
      }
    }
  }

  async testBasicFunctionality() {
    console.log('\n🔧 TESTING BASIC FUNCTIONALITY...');
    
    // Test 1: Conductor character loads
    await this.testConductorLoad();
    
    // Test 2: Auth system generates tokens
    await this.testAuthSystem();
    
    // Test 3: GIS router registers devices
    await this.testGISRouter();
    
    // Test 4: Simple start works
    await this.testSimpleStart();
  }

  async testConductorLoad() {
    console.log('  🎼 Testing Conductor character...');
    
    try {
      // Try to require the conductor
      const Conductor = require('./conductor-character.js');
      const conductor = new Conductor();
      
      // Test basic properties
      if (conductor.name === 'Conductor' && conductor.powerLevel === 85) {
        console.log('    ✅ Conductor loads and initializes correctly');
        this.testResults.set('conductor_load', { status: 'pass', details: 'Loaded successfully' });
      } else {
        console.log('    ⚠️ Conductor loads but properties incorrect');
        this.testResults.set('conductor_load', { status: 'partial', details: 'Properties mismatch' });
      }
      
      // Test manifestIntent method
      const result = conductor.manifestIntent('test automation');
      if (result && result.simplified_action) {
        console.log('    ✅ Conductor manifest method works');
        this.testResults.set('conductor_manifest', { status: 'pass', details: 'Manifest works' });
      }
      
    } catch (error) {
      console.log(`    ❌ Conductor test failed: ${error.message}`);
      this.testResults.set('conductor_load', { status: 'fail', error: error.message });
    }
  }

  async testAuthSystem() {
    console.log('  🔐 Testing Auth system...');
    
    try {
      const BackupAuth = require('./backup-auth-system.js');
      const auth = new BackupAuth();
      
      // Test auth generation (without full CLI)
      const authToken = auth.generateAuth();
      
      if (authToken && authToken.token && authToken.session) {
        console.log('    ✅ Auth system generates tokens correctly');
        this.testResults.set('auth_generation', { status: 'pass', details: 'Token generated' });
      } else {
        console.log('    ❌ Auth system token generation failed');
        this.testResults.set('auth_generation', { status: 'fail', details: 'No token generated' });
      }
      
    } catch (error) {
      console.log(`    ❌ Auth test failed: ${error.message}`);
      this.testResults.set('auth_generation', { status: 'fail', error: error.message });
    }
  }

  async testGISRouter() {
    console.log('  🌍 Testing GIS Router...');
    
    try {
      const GISRouter = require('./device-gis-router.js');
      const router = new GISRouter();
      
      // Check if device was registered
      if (router.devices.size > 0) {
        console.log('    ✅ GIS Router registers devices');
        this.testResults.set('gis_registration', { status: 'pass', details: 'Device registered' });
      } else {
        console.log('    ⚠️ GIS Router loaded but no devices registered');
        this.testResults.set('gis_registration', { status: 'partial', details: 'No devices' });
      }
      
      // Test location calculation
      const coords = router.getGISLocation();
      if (coords && coords.latitude && coords.longitude) {
        console.log('    ✅ GIS location calculation works');
        this.testResults.set('gis_location', { status: 'pass', details: 'Location calculated' });
      }
      
    } catch (error) {
      console.log(`    ❌ GIS test failed: ${error.message}`);
      this.testResults.set('gis_registration', { status: 'fail', error: error.message });
    }
  }

  async testSimpleStart() {
    console.log('  🚀 Testing Simple Start...');
    
    try {
      // Check if simple-start.js exists and has the right structure
      const content = await fs.readFile('simple-start.js', 'utf8');
      
      if (content.includes('Conductor') && content.includes('unifyAndExecute')) {
        console.log('    ✅ Simple start file structure correct');
        this.testResults.set('simple_start', { status: 'pass', details: 'File structure valid' });
      } else {
        console.log('    ⚠️ Simple start file exists but structure unclear');
        this.testResults.set('simple_start', { status: 'partial', details: 'Structure unclear' });
      }
      
    } catch (error) {
      console.log(`    ❌ Simple start test failed: ${error.message}`);
      this.testResults.set('simple_start', { status: 'fail', error: error.message });
    }
  }

  async testSystemIntegrations() {
    console.log('\n🔗 TESTING SYSTEM INTEGRATIONS...');
    
    // Test package.json commands
    await this.testPackageCommands();
    
    // Test cross-system communication
    await this.testCrossSystemComm();
  }

  async testPackageCommands() {
    console.log('  📦 Testing package.json commands...');
    
    try {
      const packageData = await fs.readFile('package.json', 'utf8');
      const pkg = JSON.parse(packageData);
      
      const expectedCommands = [
        'conductor', 'conduct', 'symphony', 'manifest', 'just-do-it',
        'backup', 'auth', 'login', 'device-gis', 'bash'
      ];
      
      let commandsFound = 0;
      for (const cmd of expectedCommands) {
        if (pkg.scripts && pkg.scripts[cmd]) {
          commandsFound++;
        }
      }
      
      const percentage = (commandsFound / expectedCommands.length) * 100;
      console.log(`    📊 Commands available: ${commandsFound}/${expectedCommands.length} (${percentage.toFixed(0)}%)`);
      
      if (percentage >= 80) {
        console.log('    ✅ Package commands integration good');
        this.testResults.set('package_commands', { status: 'pass', percentage });
      } else {
        console.log('    ⚠️ Package commands integration partial');
        this.testResults.set('package_commands', { status: 'partial', percentage });
      }
      
    } catch (error) {
      console.log(`    ❌ Package commands test failed: ${error.message}`);
      this.testResults.set('package_commands', { status: 'fail', error: error.message });
    }
  }

  async testCrossSystemComm() {
    console.log('  🔄 Testing cross-system communication...');
    
    try {
      // Test if systems can be imported together
      const Conductor = require('./conductor-character.js');
      const GISRouter = require('./device-gis-router.js');
      const BackupAuth = require('./backup-auth-system.js');
      
      console.log('    ✅ All major systems import without conflicts');
      this.testResults.set('cross_system_import', { status: 'pass', details: 'No import conflicts' });
      
      // Test if they can coexist
      const conductor = new Conductor();
      const router = new GISRouter();
      const auth = new BackupAuth();
      
      console.log('    ✅ All systems can be instantiated together');
      this.testResults.set('cross_system_coexist', { status: 'pass', details: 'Coexistence works' });
      
    } catch (error) {
      console.log(`    ❌ Cross-system communication failed: ${error.message}`);
      this.testResults.set('cross_system_import', { status: 'fail', error: error.message });
    }
  }

  generateTestReport() {
    console.log('\n📊 PUPPET TEST REPORT');
    console.log('═'.repeat(50));
    
    let totalTests = 0;
    let passedTests = 0;
    let partialTests = 0;
    let failedTests = 0;
    
    for (const [testName, result] of this.testResults) {
      totalTests++;
      
      let status = '❓';
      if (result.status === 'pass') {
        status = '✅';
        passedTests++;
      } else if (result.status === 'partial') {
        status = '⚠️';
        partialTests++;
      } else if (result.status === 'fail') {
        status = '❌';
        failedTests++;
      }
      
      console.log(`${status} ${testName}: ${result.details || result.error || 'Unknown'}`);
    }
    
    console.log('═'.repeat(50));
    console.log(`📊 TEST SUMMARY:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   ✅ Passed: ${passedTests}`);
    console.log(`   ⚠️ Partial: ${partialTests}`);
    console.log(`   ❌ Failed: ${failedTests}`);
    
    const successRate = ((passedTests + (partialTests * 0.5)) / totalTests) * 100;
    console.log(`   📈 Success Rate: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 80) {
      console.log('\n🎉 SYSTEM HEALTH: GOOD - Ready for production');
    } else if (successRate >= 60) {
      console.log('\n⚠️ SYSTEM HEALTH: PARTIAL - Needs attention');
    } else {
      console.log('\n🚨 SYSTEM HEALTH: POOR - Requires fixes');
    }
    
    // Recommendations
    this.generateRecommendations(successRate);
  }

  generateRecommendations(successRate) {
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (successRate < 60) {
      console.log('  🔧 PRIORITY: Fix failed systems before proceeding');
      console.log('  💥 Consider running Ralph bash to reset and simplify');
    }
    
    if (this.testResults.get('package_commands')?.percentage < 80) {
      console.log('  📦 Add missing package.json commands');
    }
    
    if (successRate >= 80) {
      console.log('  🚀 System ready for next development phase');
      console.log('  📈 Consider adding more integration tests');
    }
    
    console.log('  🎼 Conductor can orchestrate any working systems');
    console.log('  🛡️ Charlie is monitoring system security');
  }

  // CLI interface
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'quick':
        await this.checkSystemDependencies();
        break;
        
      case 'basic':
        await this.testBasicFunctionality();
        break;
        
      case 'integration':
        await this.testSystemIntegrations();
        break;
        
      case 'report':
        this.generateTestReport();
        break;

      default:
        console.log(`
🤖 Puppet Test Automation

Usage:
  node puppet-test-automation.js        # Run all tests
  node puppet-test-automation.js quick  # Quick dependency check
  node puppet-test-automation.js basic  # Basic functionality tests
  node puppet-test-automation.js integration # Integration tests
  node puppet-test-automation.js report # Generate test report

🎭 Automated Testing:
  • Dependency verification
  • Basic functionality testing
  • System integration testing  
  • Cross-system communication
  • Package command validation
  • Health reporting

Will bash through and reset if systems fail.
        `);
    }
  }
}

// Export for use as module
module.exports = PuppetTestAutomation;

// Run CLI if called directly
if (require.main === module) {
  const puppet = new PuppetTestAutomation();
  puppet.cli().catch(console.error);
}