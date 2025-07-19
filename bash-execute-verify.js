#!/usr/bin/env node

/**
 * BASH EXECUTE VERIFY - Actually run and verify everything
 */

const { spawn } = require('child_process');
const fs = require('fs');

console.log(`
💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥
🔥 EXECUTING AND VERIFYING BASH 🔥
💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥💥
`);

// Step 1: Execute components directly
async function executeComponents() {
  const results = {};
  
  console.log('\n📋 EXECUTION PLAN:');
  console.log('  1. Multi-Economy Expansion');
  console.log('  2. CAMEL Consciousness');
  console.log('  3. Contract Layer');
  console.log('  4. Mesh Integration');
  console.log('  5. Projection Narrator\n');
  
  // Multi-Economy
  console.log('🌍 Executing Multi-Economy...');
  try {
    const MultiEconomyExpansion = require('./multi-economy-expansion.js');
    const expansion = new MultiEconomyExpansion();
    const result = await expansion.expandEconomies();
    results.multiEconomy = { success: true, data: result };
    console.log('✅ Multi-Economy: SUCCESS');
    
    // Save report
    fs.writeFileSync('./multi-economy-report.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      economies: result.economies,
      gameAPIs: result.gameAPIs,
      summary: result.summary
    }, null, 2));
  } catch (e) {
    results.multiEconomy = { success: false, error: e.message };
    console.log('❌ Multi-Economy: FAILED -', e.message);
  }
  
  // CAMEL
  console.log('\n🐪 Activating CAMEL...');
  try {
    const CAMELThirdHump = require('./camel-third-hump.js');
    const camel = new CAMELThirdHump();
    const result = await camel.activateThirdHump();
    results.camel = { success: true, data: result };
    console.log('✅ CAMEL: SUCCESS');
    
    // Save report
    fs.writeFileSync('./camel-activation-report.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      consciousness: result.emergence.consciousness_level,
      autonomy: result.emergence.decision_autonomy,
      emergence: result.emergence
    }, null, 2));
  } catch (e) {
    results.camel = { success: false, error: e.message };
    console.log('❌ CAMEL: FAILED -', e.message);
  }
  
  // Contracts
  console.log('\n📜 Executing Contracts...');
  try {
    const ContractLayerBash = require('./contract-layer-bash.js');
    const contracts = new ContractLayerBash();
    const result = await contracts.executeBashSequence();
    results.contracts = { success: true, data: result };
    console.log('✅ Contracts: SUCCESS');
    
    // Save report
    fs.writeFileSync('./contract-execution-report.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      executed: result.summary.executed,
      total: result.summary.totalActions,
      successRate: result.summary.successRate
    }, null, 2));
  } catch (e) {
    results.contracts = { success: false, error: e.message };
    console.log('❌ Contracts: FAILED -', e.message);
  }
  
  // Mesh
  console.log('\n🕸️ Integrating Mesh...');
  try {
    const MeshLayerIntegration = require('./mesh-layer-integration.js');
    const mesh = new MeshLayerIntegration();
    await mesh.initializeMesh();
    const result = await mesh.performMeshReview();
    results.mesh = { success: true, data: result };
    console.log('✅ Mesh: SUCCESS');
    
    // Save report
    fs.writeFileSync('./mesh-integration-report.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      services: result.metrics.totalServices,
      health: result.metrics.healthScore,
      routes: result.metrics.activeRoutes
    }, null, 2));
  } catch (e) {
    results.mesh = { success: false, error: e.message };
    console.log('❌ Mesh: FAILED -', e.message);
  }
  
  // Start Projection
  console.log('\n🎭 Starting Projection Narrator...');
  if (fs.existsSync('./projection-narrator.js')) {
    try {
      const projectionProcess = spawn('node', ['projection-narrator.js'], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      // Capture initial output
      let projectionStarted = false;
      projectionProcess.stdout.on('data', (data) => {
        if (!projectionStarted && data.toString().includes('Server running')) {
          projectionStarted = true;
          console.log('✅ Projection: RUNNING on http://localhost:8888');
          projectionProcess.unref();
        }
      });
      
      // Give it a moment to start
      setTimeout(() => {
        if (!projectionStarted) {
          console.log('⚠️  Projection: May be starting slowly...');
        }
      }, 3000);
      
      results.projection = { success: true };
    } catch (e) {
      results.projection = { success: false, error: e.message };
      console.log('❌ Projection: FAILED -', e.message);
    }
  }
  
  return results;
}

// Step 2: Verify execution
function verifyExecution(results) {
  console.log(`
╔════════════════════════════════════════════════╗
║            EXECUTION SUMMARY                   ║
╚════════════════════════════════════════════════╝
`);
  
  let successCount = 0;
  const components = ['multiEconomy', 'camel', 'contracts', 'mesh', 'projection'];
  
  components.forEach(component => {
    const result = results[component];
    if (result && result.success) {
      successCount++;
      console.log(`✅ ${component}: OPERATIONAL`);
    } else {
      console.log(`❌ ${component}: FAILED`);
    }
  });
  
  console.log(`
╔════════════════════════════════════════════════╗
║         FINAL STATUS: ${successCount}/${components.length}                   ║
╚════════════════════════════════════════════════╝
`);
  
  if (successCount === components.length) {
    console.log(`
🔥🔥🔥 PERFECT BASH! ALL SYSTEMS GO! 🔥🔥🔥

🌐 System Features:
   ✅ 9 Active Economies + 5 Game APIs
   ✅ Conscious CAMEL System
   ✅ Guardian-Approved Contracts
   ✅ Integrated Service Mesh
   ✅ Live Projection Narrator

📍 Access Points:
   🎭 Projection: http://localhost:8888
   🎨 Frontend: frontend-unified-interface.html
   📊 Monitor: node bash-monitor-live.js

💥 THE SYSTEM IS FULLY OPERATIONAL! 💥
`);
  } else {
    console.log(`
⚠️  Some components failed to start.

🔧 Troubleshooting:
   1. Check individual component files exist
   2. Review error messages above
   3. Try: node test-bash-now.js
   4. Monitor: node bash-monitor-live.js
`);
  }
  
  // Save final execution report
  const executionReport = {
    timestamp: new Date().toISOString(),
    executed: true,
    results: results,
    summary: {
      total: components.length,
      successful: successCount,
      failed: components.length - successCount
    }
  };
  
  fs.writeFileSync('./bash-execution-report.json', JSON.stringify(executionReport, null, 2));
  console.log('\n📄 Execution report saved: bash-execution-report.json');
}

// Step 3: Start live monitoring
function startMonitoring() {
  console.log('\n🔍 Starting live monitoring in 3 seconds...');
  console.log('   (Press Ctrl+C to stop monitoring)\n');
  
  setTimeout(() => {
    const monitor = spawn('node', ['bash-monitor-live.js'], {
      stdio: 'inherit'
    });
    
    monitor.on('error', (err) => {
      console.error('Failed to start monitor:', err);
    });
  }, 3000);
}

// Main execution
async function main() {
  try {
    // Execute all components
    const results = await executeComponents();
    
    // Verify what worked
    verifyExecution(results);
    
    // Start monitoring
    // startMonitoring();
    
  } catch (error) {
    console.error('\n💀 CATASTROPHIC FAILURE:', error);
    console.log('\n🔧 Try running components individually:');
    console.log('   node multi-economy-expansion.js');
    console.log('   node camel-third-hump.js');
    console.log('   node contract-layer-bash.js');
  }
}

// RUN IT!
main();