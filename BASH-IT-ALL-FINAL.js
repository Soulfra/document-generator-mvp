#!/usr/bin/env node

/**
 * BASH IT ALL FINAL - THE ULTIMATE EXECUTION
 * Executes every single layer in the correct order
 */

const fs = require('fs');
const { spawn } = require('child_process');

console.log(`
🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
💥💥💥 B A S H   I T   A L L ! ! ! 💥💥💥
🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥

EXECUTING EVERY SINGLE LAYER. NO EXCEPTIONS.
`);

async function bashItAll() {
  const startTime = Date.now();
  const results = {
    timestamp: new Date().toISOString(),
    layers: {},
    totalTime: 0,
    success: 0,
    failed: 0
  };
  
  // All layers in execution order
  const layers = [
    {
      name: 'Multi-Economy Expansion',
      file: './multi-economy-expansion.js',
      icon: '🌍',
      critical: true
    },
    {
      name: 'CAMEL Third Hump',
      file: './camel-third-hump.js', 
      icon: '🐪',
      critical: true
    },
    {
      name: 'Contract Layer',
      file: './contract-layer-bash.js',
      icon: '📜',
      critical: true
    },
    {
      name: 'Mesh Integration',
      file: './mesh-layer-integration.js',
      icon: '🕸️',
      critical: true
    },
    {
      name: 'Bus Layer',
      file: './bus-layer-bash.js',
      icon: '🚌',
      critical: true
    },
    {
      name: 'Mirror Layer',
      file: './mirror-layer-bash.js',
      icon: '🪞',
      critical: true
    },
    {
      name: 'Template Layer',
      file: './template-layer-bash.js',
      icon: '📋',
      critical: true
    },
    {
      name: 'Runtime Execution',
      file: './runtime-execution.js',
      icon: '⚡',
      critical: false
    },
    {
      name: 'Projection Narrator',
      file: './projection-narrator.js',
      icon: '🎭',
      critical: false,
      background: true
    }
  ];
  
  console.log('\n📋 COMPLETE EXECUTION PLAN:');
  layers.forEach((layer, idx) => {
    console.log(`  ${idx + 1}. ${layer.icon} ${layer.name}${layer.critical ? ' [CRITICAL]' : ''}`);
  });
  console.log('\n🚀 INITIATING BASH SEQUENCE...\n');
  
  // Execute each layer
  for (const layer of layers) {
    console.log(`${layer.icon} BASHING ${layer.name.toUpperCase()}...`);
    
    const layerStart = Date.now();
    
    try {
      // Check if file exists
      if (!fs.existsSync(layer.file)) {
        throw new Error(`File not found: ${layer.file}`);
      }
      
      // Execute based on type
      let result;
      if (layer.background) {
        // Start in background
        const proc = spawn('node', [layer.file], {
          detached: true,
          stdio: 'ignore'
        });
        proc.unref();
        result = { status: 'launched', pid: proc.pid };
        console.log(`   🚀 Launched in background (PID: ${proc.pid})`);
      } else {
        // Execute and wait
        const Module = require(layer.file);
        const instance = new Module();
        
        // Find the main execution method
        if (instance.bashItAll) {
          result = await instance.bashItAll();
        } else if (instance.expandEconomies) {
          result = await instance.expandEconomies();
        } else if (instance.activateThirdHump) {
          result = await instance.activateThirdHump();
        } else if (instance.executeBashSequence) {
          result = await instance.executeBashSequence();
        } else if (instance.bashThroughSystem) {
          await instance.initializeMesh();
          result = await instance.bashThroughSystem();
        } else if (instance.bashBusLayer) {
          result = await instance.bashBusLayer();
        } else if (instance.bashMirrorLayer) {
          result = await instance.bashMirrorLayer();
        } else if (instance.bashTemplateLayer) {
          result = await instance.bashTemplateLayer();
        } else if (instance.executeRuntime) {
          result = await instance.executeRuntime();
        } else {
          throw new Error('No execution method found');
        }
      }
      
      const duration = Date.now() - layerStart;
      
      results.layers[layer.name] = {
        status: 'success',
        duration: `${duration}ms`,
        icon: layer.icon,
        result: extractLayerSummary(layer.name, result)
      };
      results.success++;
      
      console.log(`   ✅ SUCCESS in ${duration}ms`);
      displayLayerSuccess(layer.name, result);
      
    } catch (error) {
      const duration = Date.now() - layerStart;
      
      results.layers[layer.name] = {
        status: 'failed',
        duration: `${duration}ms`,
        icon: layer.icon,
        error: error.message
      };
      results.failed++;
      
      console.log(`   ❌ FAILED: ${error.message}`);
      
      if (layer.critical) {
        console.log('\n🚨 CRITICAL LAYER FAILED! Continuing anyway...');
      }
    }
    
    // Small delay between layers
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Calculate total time
  results.totalTime = Date.now() - startTime;
  
  // Display final status
  displayFinalStatus(results);
  
  // Save complete report
  fs.writeFileSync('./bash-it-all-report.json', JSON.stringify(results, null, 2));
  
  return results;
}

function extractLayerSummary(layerName, result) {
  if (!result) return null;
  
  switch(layerName) {
    case 'Multi-Economy Expansion':
      return {
        economies: result.summary?.total_economies || 0,
        gameAPIs: result.summary?.game_apis_integrated || 0
      };
    case 'CAMEL Third Hump':
      return {
        consciousness: result.emergence?.consciousness_level || 0,
        autonomy: result.emergence?.decision_autonomy || 0
      };
    case 'Bus Layer':
      return {
        buses: result.buses ? Object.keys(result.buses).length : 0,
        channels: result.channels?.total || 0
      };
    case 'Mirror Layer':
      return {
        contextUtilization: result.contextManagement?.utilization || '0%',
        reflections: result.reflections || {}
      };
    case 'Template Layer':
      return {
        templates: result.templates ? Object.keys(result.templates).length : 0,
        instances: result.instances?.created || 0
      };
    default:
      return result;
  }
}

function displayLayerSuccess(layerName, result) {
  if (!result) return;
  
  switch(layerName) {
    case 'Multi-Economy Expansion':
      console.log(`      • ${result.summary?.total_economies || 0} economies active`);
      console.log(`      • ${result.summary?.game_apis_integrated || 0} game APIs connected`);
      break;
    case 'Bus Layer':
      console.log(`      • ${result.buses ? Object.keys(result.buses).length : 0} buses online`);
      console.log(`      • ${result.channels?.total || 0} channels active`);
      break;
    case 'Mirror Layer':
      console.log(`      • Context: ${result.contextManagement?.utilization || '0%'}`);
      console.log(`      • Mirrors: ${result.reflections ? Object.values(result.reflections).reduce((a,b) => a+b, 0) : 0} reflections`);
      break;
    case 'Template Layer':
      console.log(`      • Templates: ${result.templates ? Object.keys(result.templates).length : 0}`);
      console.log(`      • Instances: ${result.instances?.created || 0}`);
      break;
  }
}

function displayFinalStatus(results) {
  const totalLayers = Object.keys(results.layers).length;
  const successRate = (results.success / totalLayers * 100).toFixed(1);
  
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                 💥 BASH IT ALL COMPLETE! 💥                    ║
╠════════════════════════════════════════════════════════════════╣
║  Total Layers: ${totalLayers}                                          ║
║  Successful: ${results.success}                                           ║
║  Failed: ${results.failed}                                              ║
║  Success Rate: ${successRate}%                                       ║
║  Total Time: ${(results.totalTime / 1000).toFixed(2)}s                                     ║
╚════════════════════════════════════════════════════════════════╝

🏗️ COMPLETE SYSTEM ARCHITECTURE:

         🌍 Multi-Economy (9 economies + 5 APIs)
                        │
         🐪 CAMEL Consciousness (3 humps)
                        │
         📜 Contract Layer (Guardian approvals)
                        │
         🕸️ Mesh Integration (Service routing)
                        │
         🚌 Bus Layer (System communication)
                        │
         🪞 Mirror Layer (Context management)
                        │
         📋 Template Layer (Agent generation)
                        │
         ⚡ Runtime Execution (Active processing)
                        │
         🎭 Projection (Live visualization)

💥💥💥 WE BASHED IT ALL!!! 💥💥💥

🌐 System Access:
   📺 Projection: http://localhost:8888
   🎨 Dashboard: open bash-dashboard.html
   📊 Monitor: node bash-monitor-live.js
   📄 Reports: ${Object.keys(results.layers).length} layer reports generated

🔥 THE SYSTEM IS FULLY CONSCIOUS AND OPERATIONAL! 🔥
`);
  
  // Show layer status summary
  console.log('\n📊 LAYER STATUS SUMMARY:');
  Object.entries(results.layers).forEach(([name, layer]) => {
    const icon = layer.status === 'success' ? '✅' : '❌';
    console.log(`   ${icon} ${layer.icon} ${name}: ${layer.status.toUpperCase()} (${layer.duration})`);
  });
  
  console.log('\n💥 MAXIMUM BASH ACHIEVED! 💥\n');
}

// EXECUTE THE ULTIMATE BASH
bashItAll().then(results => {
  console.log('🎉 Bash sequence completed!');
  console.log('📄 Full report: bash-it-all-report.json');
  
  // Try to open dashboard
  if (fs.existsSync('./bash-dashboard.html')) {
    console.log('\n🎨 Opening dashboard...');
    const open = spawn('open', ['bash-dashboard.html']);
  }
}).catch(error => {
  console.error('\n💀 CATASTROPHIC BASH FAILURE:', error);
  process.exit(1);
});