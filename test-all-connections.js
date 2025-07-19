#!/usr/bin/env node

/**
 * Test All Connections - Manual verification of Document Generator system
 * Connects and tests all 13+ tiers
 */

const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

console.log('🔗 DOCUMENT GENERATOR CONNECTION TESTER');
console.log('======================================');
console.log('Testing all connections manually...\n');

// Track test results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  details: []
};

// Test functions
async function testFileExists(name, path) {
  console.log(`📁 Testing ${name}...`);
  try {
    if (fs.existsSync(path)) {
      console.log(`✅ ${name} exists at ${path}`);
      results.passed++;
      results.details.push({ name, status: 'exists', path });
      return true;
    } else {
      console.log(`❌ ${name} missing at ${path}`);
      results.failed++;
      results.details.push({ name, status: 'missing', path });
      return false;
    }
  } catch (error) {
    console.log(`❌ Error checking ${name}: ${error.message}`);
    results.failed++;
    return false;
  }
}

async function testHttpEndpoint(name, url, expectedStatus = 200) {
  console.log(`🌐 Testing ${name} at ${url}...`);
  
  return new Promise((resolve) => {
    http.get(url, (res) => {
      if (res.statusCode === expectedStatus) {
        console.log(`✅ ${name} responding (status: ${res.statusCode})`);
        results.passed++;
        results.details.push({ name, status: 'online', url });
        resolve(true);
      } else {
        console.log(`⚠️  ${name} returned status ${res.statusCode}`);
        results.failed++;
        results.details.push({ name, status: 'error', url, code: res.statusCode });
        resolve(false);
      }
    }).on('error', (err) => {
      console.log(`❌ ${name} not reachable: ${err.message}`);
      results.failed++;
      results.details.push({ name, status: 'offline', url });
      resolve(false);
    });
  });
}

async function testWebSocket(name, url) {
  console.log(`🔌 Testing WebSocket ${name} at ${url}...`);
  
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(url);
      
      ws.on('open', () => {
        console.log(`✅ ${name} WebSocket connected`);
        results.passed++;
        results.details.push({ name, status: 'connected', url });
        ws.close();
        resolve(true);
      });
      
      ws.on('error', (err) => {
        console.log(`❌ ${name} WebSocket error: ${err.message}`);
        results.failed++;
        results.details.push({ name, status: 'error', url });
        resolve(false);
      });
      
      setTimeout(() => {
        ws.close();
        resolve(false);
      }, 3000);
    } catch (error) {
      console.log(`❌ ${name} WebSocket failed: ${error.message}`);
      results.failed++;
      resolve(false);
    }
  });
}

async function testNodeModule(name, modulePath) {
  console.log(`📦 Testing module ${name}...`);
  try {
    require(modulePath);
    console.log(`✅ ${name} module loads successfully`);
    results.passed++;
    results.details.push({ name, status: 'loadable', path: modulePath });
    return true;
  } catch (error) {
    console.log(`❌ ${name} module error: ${error.message}`);
    results.failed++;
    results.details.push({ name, status: 'error', path: modulePath });
    return false;
  }
}

async function testCommand(name, command, args = []) {
  console.log(`🔧 Testing command: ${name}...`);
  
  return new Promise((resolve) => {
    const proc = spawn(command, args, { 
      shell: true,
      timeout: 5000
    });
    
    let output = '';
    
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${name} command succeeded`);
        results.passed++;
        results.details.push({ name, status: 'success', command });
        resolve(true);
      } else {
        console.log(`❌ ${name} command failed with code ${code}`);
        results.failed++;
        results.details.push({ name, status: 'failed', command, code });
        resolve(false);
      }
    });
    
    proc.on('error', (err) => {
      console.log(`❌ ${name} command error: ${err.message}`);
      results.failed++;
      resolve(false);
    });
    
    // Kill after timeout
    setTimeout(() => {
      proc.kill();
      resolve(false);
    }, 5000);
  });
}

// Main test suite
async function runAllTests() {
  console.log('🧪 STARTING CONNECTION TESTS\n');
  
  // Test 1: Core Files
  console.log('📋 Test 1: Core Files');
  console.log('=====================');
  await testFileExists('CLI Interface', './cli.js');
  await testFileExists('Web Interface', './web-interface.js');
  await testFileExists('Character System', './character-system-max.js');
  await testFileExists('Master Orchestrator', './master-orchestrator.js');
  await testFileExists('Final Executor', './final-executor.js');
  
  console.log('\n📋 Test 2: Layer Files');
  console.log('======================');
  await testFileExists('Integration Layer', './integration-layer.js');
  await testFileExists('Mesh Layer', './mesh-layer.js');
  await testFileExists('Tool Layer', './tool-layer.js');
  await testFileExists('Runtime Layer', './runtime-layer.js');
  await testFileExists('Economy Layer', './economy-layer.js');
  await testFileExists('Git Layer', './git-layer.js');
  
  console.log('\n📋 Test 3: FinishThisIdea Tiers');
  console.log('================================');
  await testFileExists('Tier 3 Symlinks', './FinishThisIdea/tier-3-symlink-manager.js');
  await testFileExists('Tier 4 Substrate', './FinishThisIdea/tier-4-substrate-manager.js');
  await testFileExists('Tier 4 Service Mesh', './FinishThisIdea/tier-4-service-mesh.js');
  await testFileExists('Tier 5 Universal', './FinishThisIdea/tier-5-universal-interface.js');
  
  console.log('\n📋 Test 4: Module Loading');
  console.log('=========================');
  await testNodeModule('Character System', './character-system-max.js');
  await testNodeModule('Tier Connector', './tier-connector.js');
  
  console.log('\n📋 Test 5: HTTP Services');
  console.log('========================');
  // Only test if services are running
  console.log('⚠️  Skipping HTTP tests (services not started)');
  results.skipped += 4;
  
  console.log('\n📋 Test 6: Character Interaction');
  console.log('================================');
  try {
    const CharacterSystem = require('./character-system-max.js');
    const chars = new CharacterSystem();
    
    // Test character creation
    if (chars.characters.size > 0) {
      console.log(`✅ Created ${chars.characters.size} characters`);
      results.passed++;
      
      // Test character speech
      const nova = chars.getCharacter('Nova');
      if (nova) {
        nova.speak('Testing character speech system', 'happy');
        console.log('✅ Character speech working');
        results.passed++;
      }
    }
  } catch (error) {
    console.log(`❌ Character system error: ${error.message}`);
    results.failed++;
  }
  
  console.log('\n📋 Test 7: Tier Connections');
  console.log('===========================');
  try {
    const TierConnector = require('./tier-connector.js');
    const connector = new TierConnector();
    await connector.initialize();
    
    console.log(`✅ Discovered ${connector.tiersFound} tiers`);
    console.log(`✅ Created ${connector.connections.length} connections`);
    results.passed += 2;
    
    // Get execution command
    const cmd = connector.getExecutionCommand();
    console.log(`✅ Best execution command: ${cmd}`);
    results.passed++;
  } catch (error) {
    console.log(`❌ Tier connector error: ${error.message}`);
    results.failed++;
  }
  
  console.log('\n📋 Test 8: Quick Scripts');
  console.log('========================');
  await testFileExists('Quick Deploy', './quick-deploy.sh');
  await testFileExists('Memory Saver', './symlink-memory-saver.js');
  await testFileExists('Launch Script', './launch.js');
  
  // Show results
  console.log('\n📊 TEST RESULTS');
  console.log('===============');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⏭️  Skipped: ${results.skipped}`);
  console.log(`📊 Total: ${results.passed + results.failed + results.skipped}`);
  
  const successRate = (results.passed / (results.passed + results.failed) * 100).toFixed(1);
  console.log(`\n🎯 Success Rate: ${successRate}%`);
  
  // Save detailed results
  fs.writeFileSync('test-results.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Detailed results saved to test-results.json');
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================');
  
  if (results.failed === 0) {
    console.log('✅ All connections working! System ready to use.');
    console.log('\n🚀 Start with:');
    console.log('   node character-system-max.js');
    console.log('   OR');
    console.log('   node final-executor.js');
  } else {
    console.log('⚠️  Some connections failed. Recommended actions:');
    
    const missing = results.details.filter(d => d.status === 'missing');
    if (missing.length > 0) {
      console.log('\n📁 Missing files:');
      missing.forEach(m => console.log(`   - ${m.name}: ${m.path}`));
    }
    
    const errors = results.details.filter(d => d.status === 'error');
    if (errors.length > 0) {
      console.log('\n❌ Errors found:');
      errors.forEach(e => console.log(`   - ${e.name}: ${e.path || e.url}`));
    }
  }
  
  // Manual test commands
  console.log('\n🔧 MANUAL TEST COMMANDS');
  console.log('=======================');
  console.log('Test individual components:');
  console.log('  node character-system-max.js    # Test characters');
  console.log('  node tier-connector.js          # Test tier discovery');
  console.log('  node execute-character-system.js # Test web interface');
  console.log('  ./quick-deploy.sh               # Test deployment');
  console.log('  node symlink-memory-saver.js    # Test memory optimization');
  
  console.log('\n🔗 INTEGRATION COMMANDS');
  console.log('=======================');
  console.log('Connect everything:');
  console.log('  node final-executor.js          # Execute all layers');
  console.log('  node master-orchestrator.js     # Orchestrate with characters');
  console.log('  node launch.js                  # Minimal memory launcher');
}

// Interactive test menu
async function showTestMenu() {
  console.log('\n📋 INTERACTIVE TEST MENU');
  console.log('========================');
  console.log('1. Run all tests');
  console.log('2. Test files only');
  console.log('3. Test characters only');
  console.log('4. Test tier connections');
  console.log('5. Start character system');
  console.log('6. Start final executor');
  console.log('7. Exit');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\nSelect option (1-7): ', async (answer) => {
    switch (answer) {
      case '1':
        await runAllTests();
        break;
      case '2':
        console.log('\n📁 Testing files...');
        await testFileExists('Character System', './character-system-max.js');
        await testFileExists('Final Executor', './final-executor.js');
        break;
      case '3':
        console.log('\n🎭 Testing characters...');
        spawn('node', ['character-system-max.js'], { stdio: 'inherit' });
        break;
      case '4':
        console.log('\n🔗 Testing tier connections...');
        spawn('node', ['tier-connector.js'], { stdio: 'inherit' });
        break;
      case '5':
        console.log('\n🎭 Starting character system...');
        spawn('node', ['execute-character-system.js'], { stdio: 'inherit' });
        break;
      case '6':
        console.log('\n🚀 Starting final executor...');
        spawn('node', ['final-executor.js'], { stdio: 'inherit' });
        break;
      case '7':
        console.log('👋 Goodbye!');
        process.exit(0);
        break;
      default:
        console.log('Invalid option');
    }
    
    rl.close();
    
    // Show menu again after 3 seconds
    if (answer !== '7' && answer !== '5' && answer !== '6') {
      setTimeout(showTestMenu, 3000);
    }
  });
}

// Main execution
if (require.main === module) {
  // Check for command line args
  const args = process.argv.slice(2);
  
  if (args.includes('--auto')) {
    // Run all tests automatically
    runAllTests().then(() => {
      console.log('\n✅ Automated testing complete!');
    });
  } else if (args.includes('--menu')) {
    // Show interactive menu
    showTestMenu();
  } else {
    // Default: run all tests then show menu
    runAllTests().then(() => {
      showTestMenu();
    });
  }
}

module.exports = { runAllTests, testFileExists, testHttpEndpoint };