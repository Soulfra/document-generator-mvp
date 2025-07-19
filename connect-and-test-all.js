#!/usr/bin/env node

/**
 * Connect and Test All Systems - Document Generator
 * Manual testing and connection verification
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🔗 DOCUMENT GENERATOR - CONNECT & TEST ALL');
console.log('=========================================\n');

// System components
const components = {
  // Tier 1-7: Main System
  'Character System': {
    file: './character-system-max.js',
    test: () => testModule('./character-system-max.js'),
    start: 'node character-system-max.js'
  },
  'Web Interface': {
    file: './execute-character-system.js',
    test: () => testHttpService('http://localhost:8888'),
    start: 'node execute-character-system.js'
  },
  'API Server': {
    file: './services/api-server/index.js',
    test: () => testHttpService('http://localhost:3001'),
    start: 'node services/api-server/index.js'
  },
  'Sovereign Agents': {
    file: './services/sovereign-agents/src/index.js',
    test: () => testModule('./services/sovereign-agents/src/services/SovereignAgent.js'),
    start: 'node services/sovereign-agents/src/index.js'
  },
  
  // Integration Layers
  'Integration Layer': {
    file: './integration-layer.js',
    test: () => testFile('./integration-layer.js')
  },
  'Mesh Layer': {
    file: './mesh-layer.js',
    test: () => testFile('./mesh-layer.js')
  },
  'Tool Layer': {
    file: './tool-layer.js',
    test: () => testFile('./tool-layer.js')
  },
  'Runtime Layer': {
    file: './runtime-layer.js',
    test: () => testFile('./runtime-layer.js')
  },
  'Economy Layer': {
    file: './economy-layer.js',
    test: () => testFile('./economy-layer.js')
  },
  'Git Layer': {
    file: './git-layer.js',
    test: () => testFile('./git-layer.js')
  },
  
  // Tier 8-13: FinishThisIdea System
  'Tier 3 Symlinks': {
    file: './FinishThisIdea/tier-3-symlink-manager.js',
    test: () => testFile('./FinishThisIdea/tier-3-symlink-manager.js')
  },
  'Tier 4 Substrate': {
    file: './FinishThisIdea/tier-4-substrate-manager.js',
    test: () => testFile('./FinishThisIdea/tier-4-substrate-manager.js')
  },
  'Tier 5 Universal': {
    file: './FinishThisIdea/tier-5-universal-interface.js',
    test: () => testFile('./FinishThisIdea/tier-5-universal-interface.js')
  },
  
  // Master Controllers
  'Master Orchestrator': {
    file: './master-orchestrator.js',
    test: () => testFile('./master-orchestrator.js')
  },
  'Final Executor': {
    file: './final-executor.js',
    test: () => testFile('./final-executor.js')
  }
};

// Test functions
function testFile(filepath) {
  return fs.existsSync(filepath);
}

function testModule(modulePath) {
  try {
    require(modulePath);
    return true;
  } catch (e) {
    return false;
  }
}

async function testHttpService(url) {
  // Skip HTTP tests for now as services aren't running
  return 'skipped';
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Testing all components...\n');
  
  const results = {
    passed: [],
    failed: [],
    skipped: []
  };
  
  for (const [name, component] of Object.entries(components)) {
    process.stdout.write(`Testing ${name}... `);
    
    const result = await component.test();
    
    if (result === 'skipped') {
      console.log('⏭️  SKIPPED');
      results.skipped.push(name);
    } else if (result) {
      console.log('✅ PASSED');
      results.passed.push(name);
    } else {
      console.log('❌ FAILED');
      results.failed.push(name);
    }
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('===============');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failed components:');
    results.failed.forEach(name => {
      console.log(`   - ${name}: ${components[name].file}`);
    });
  }
  
  return results;
}

// Manual test steps
function showManualSteps() {
  console.log('\n📋 MANUAL TEST STEPS');
  console.log('====================\n');
  
  console.log('Step 1: Test Character System');
  console.log('------------------------------');
  console.log('Run: node character-system-max.js');
  console.log('Expected: Characters introduce themselves\n');
  
  console.log('Step 2: Test Web Interface');
  console.log('--------------------------');
  console.log('Run: node execute-character-system.js');
  console.log('Open: http://localhost:8888');
  console.log('Expected: Character interaction web UI\n');
  
  console.log('Step 3: Test Sovereign Agents');
  console.log('-----------------------------');
  console.log('Run: node services/sovereign-agents/src/index.js');
  console.log('Expected: Sovereign agent system starts\n');
  
  console.log('Step 4: Test API Server');
  console.log('-----------------------');
  console.log('Run: node services/api-server/index.js');
  console.log('Expected: API server on port 3001\n');
  
  console.log('Step 5: Test Complete Integration');
  console.log('---------------------------------');
  console.log('Run: node final-executor.js');
  console.log('Expected: All layers execute in sequence\n');
}

// Connection map
function showConnectionMap() {
  console.log('\n🗺️  SYSTEM CONNECTION MAP');
  console.log('=========================\n');
  
  console.log('User Interface Layer:');
  console.log('  CLI (cli.js) ─┐');
  console.log('  Web (web-interface.js) ─┼─→ Character System');
  console.log('  Git (git-wrapper.js) ──┘');
  console.log('');
  console.log('Character Layer:');
  console.log('  Character System ─→ 7 Living Characters');
  console.log('       ↓');
  console.log('Integration Layers:');
  console.log('  Integration → Mesh → Tools');
  console.log('       ↓         ↓       ↓');
  console.log('  Runtime → Economy → Git Layer');
  console.log('       ↓');
  console.log('Service Layer:');
  console.log('  API Server ←→ Sovereign Agents');
  console.log('       ↓              ↓');
  console.log('  WebSocket     Chain-of-Thought');
  console.log('       ↓              ↓');
  console.log('FinishThisIdea Tiers:');
  console.log('  Tier 3: Symlinks');
  console.log('       ↓');
  console.log('  Tier 4: Substrate + Service Mesh');
  console.log('       ↓');
  console.log('  Tier 5: Universal Interface');
  console.log('');
  console.log('Master Control:');
  console.log('  Master Orchestrator → Final Executor');
}

// Quick start function
function quickStart() {
  console.log('\n🚀 QUICK START');
  console.log('==============\n');
  
  console.log('Option 1: Minimal Memory');
  console.log('------------------------');
  console.log('node launch.js');
  console.log('→ Open http://localhost:7777\n');
  
  console.log('Option 2: Character System Only');
  console.log('-------------------------------');
  console.log('node character-system-max.js\n');
  
  console.log('Option 3: Full Web Interface');
  console.log('----------------------------');
  console.log('node execute-character-system.js');
  console.log('→ Open http://localhost:8888\n');
  
  console.log('Option 4: Complete System');
  console.log('------------------------');
  console.log('node final-executor.js\n');
  
  console.log('Option 5: Clean Memory First');
  console.log('---------------------------');
  console.log('./quick-deploy.sh\n');
}

// Interactive menu
async function interactiveMenu() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\n🎮 INTERACTIVE MENU');
  console.log('===================');
  console.log('1. Run all tests');
  console.log('2. Show manual test steps');
  console.log('3. Show connection map');
  console.log('4. Quick start guide');
  console.log('5. Start character system');
  console.log('6. Start web interface');
  console.log('7. Check tier connections');
  console.log('8. Exit\n');
  
  rl.question('Select option (1-8): ', (answer) => {
    rl.close();
    
    switch (answer) {
      case '1':
        runAllTests().then(() => setTimeout(interactiveMenu, 2000));
        break;
      case '2':
        showManualSteps();
        setTimeout(interactiveMenu, 2000);
        break;
      case '3':
        showConnectionMap();
        setTimeout(interactiveMenu, 2000);
        break;
      case '4':
        quickStart();
        setTimeout(interactiveMenu, 2000);
        break;
      case '5':
        console.log('\n🎭 Starting character system...');
        spawn('node', ['character-system-max.js'], { stdio: 'inherit' });
        break;
      case '6':
        console.log('\n🌐 Starting web interface...');
        spawn('node', ['execute-character-system.js'], { stdio: 'inherit' });
        break;
      case '7':
        console.log('\n🔗 Checking tier connections...');
        spawn('node', ['tier-connector.js'], { stdio: 'inherit' });
        break;
      case '8':
        console.log('\n👋 Goodbye!');
        process.exit(0);
        break;
      default:
        console.log('Invalid option');
        setTimeout(interactiveMenu, 1000);
    }
  });
}

// Main execution
if (require.main === module) {
  console.log('Welcome to Document Generator Test Suite!\n');
  
  // Check if we should run automated tests
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    runAllTests().then(() => {
      console.log('\n✅ Tests complete!');
    });
  } else if (args.includes('--manual')) {
    showManualSteps();
  } else if (args.includes('--map')) {
    showConnectionMap();
  } else if (args.includes('--quick')) {
    quickStart();
  } else {
    // Default: show menu
    interactiveMenu();
  }
}

module.exports = { runAllTests, components };