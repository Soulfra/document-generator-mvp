#!/usr/bin/env node

/**
 * BASH MONITOR LIVE - Real-time system status
 * Shows everything that's actually running
 */

const fs = require('fs');
const http = require('http');

console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              🔥 BASH MONITOR LIVE 🔥                          ║
║         Real-time status of all components                    ║
╚═══════════════════════════════════════════════════════════════╝
`);

// Component status tracking
const componentStatus = {
  multiEconomy: { status: 'checking', lastUpdate: null },
  camel: { status: 'checking', lastUpdate: null },
  contracts: { status: 'checking', lastUpdate: null },
  mesh: { status: 'checking', lastUpdate: null },
  projection: { status: 'checking', lastUpdate: null }
};

// Animation for live updates
const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let spinnerIndex = 0;

// Check if components are actually running
async function checkComponentStatus() {
  // Check for result files
  const files = {
    multiEconomy: './multi-economy-report.json',
    camel: './camel-activation-report.json',
    contracts: './contract-execution-report.json',
    mesh: './mesh-integration-report.json',
    projection: { port: 8888, path: '/' }
  };
  
  // Check file-based components
  for (const [component, file] of Object.entries(files)) {
    if (component === 'projection') continue;
    
    if (fs.existsSync(file)) {
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        componentStatus[component] = {
          status: 'active',
          lastUpdate: data.timestamp || new Date().toISOString(),
          details: extractComponentDetails(component, data)
        };
      } catch (e) {
        componentStatus[component].status = 'error';
      }
    }
  }
  
  // Check projection service
  await checkProjectionService();
}

function extractComponentDetails(component, data) {
  switch(component) {
    case 'multiEconomy':
      return {
        economies: data.economies?.length || 0,
        gameAPIs: data.gameAPIs?.length || 0
      };
    case 'camel':
      return {
        consciousness: data.consciousness || 0,
        autonomy: data.autonomy || 0
      };
    case 'contracts':
      return {
        executed: data.executed || 0,
        total: data.total || 0
      };
    case 'mesh':
      return {
        services: data.services || 0,
        health: data.health || 0
      };
    default:
      return {};
  }
}

async function checkProjectionService() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:8888/', (res) => {
      if (res.statusCode === 200) {
        componentStatus.projection = {
          status: 'active',
          lastUpdate: new Date().toISOString(),
          details: { port: 8888, accessible: true }
        };
      } else {
        componentStatus.projection.status = 'inactive';
      }
      resolve();
    });
    
    req.on('error', () => {
      componentStatus.projection.status = 'offline';
      resolve();
    });
    
    req.setTimeout(1000, () => {
      req.destroy();
      componentStatus.projection.status = 'timeout';
      resolve();
    });
  });
}

// Display live status
function displayStatus() {
  console.clear();
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║              🔥 BASH MONITOR LIVE 🔥                          ║
║         Real-time status of all components                    ║
╚═══════════════════════════════════════════════════════════════╝

${new Date().toLocaleTimeString()} ${spinners[spinnerIndex]}
`);
  
  spinnerIndex = (spinnerIndex + 1) % spinners.length;
  
  // Multi-Economy Status
  const me = componentStatus.multiEconomy;
  console.log(`🌍 MULTI-ECONOMY EXPANSION`);
  console.log(`   Status: ${getStatusIcon(me.status)} ${me.status.toUpperCase()}`);
  if (me.details) {
    console.log(`   └─ ${me.details.economies} economies active`);
    console.log(`   └─ ${me.details.gameAPIs} game APIs connected`);
  }
  console.log('');
  
  // CAMEL Status
  const camel = componentStatus.camel;
  console.log(`🐪 CAMEL CONSCIOUSNESS`);
  console.log(`   Status: ${getStatusIcon(camel.status)} ${camel.status.toUpperCase()}`);
  if (camel.details) {
    console.log(`   └─ Consciousness: ${(camel.details.consciousness * 100).toFixed(1)}%`);
    console.log(`   └─ Autonomy: ${(camel.details.autonomy * 100).toFixed(1)}%`);
  }
  console.log('');
  
  // Contract Status
  const contracts = componentStatus.contracts;
  console.log(`📜 CONTRACT LAYER`);
  console.log(`   Status: ${getStatusIcon(contracts.status)} ${contracts.status.toUpperCase()}`);
  if (contracts.details) {
    console.log(`   └─ Executed: ${contracts.details.executed}/${contracts.details.total}`);
  }
  console.log('');
  
  // Mesh Status
  const mesh = componentStatus.mesh;
  console.log(`🕸️ MESH INTEGRATION`);
  console.log(`   Status: ${getStatusIcon(mesh.status)} ${mesh.status.toUpperCase()}`);
  if (mesh.details) {
    console.log(`   └─ Services: ${mesh.details.services}`);
    console.log(`   └─ Health: ${(mesh.details.health * 100).toFixed(1)}%`);
  }
  console.log('');
  
  // Projection Status
  const proj = componentStatus.projection;
  console.log(`🎭 PROJECTION NARRATOR`);
  console.log(`   Status: ${getStatusIcon(proj.status)} ${proj.status.toUpperCase()}`);
  if (proj.details && proj.status === 'active') {
    console.log(`   └─ URL: http://localhost:${proj.details.port}`);
  }
  console.log('');
  
  // Overall System Status
  const activeCount = Object.values(componentStatus).filter(c => c.status === 'active').length;
  const totalCount = Object.keys(componentStatus).length;
  
  console.log(`╔════════════════════════════════════════════════╗`);
  console.log(`║           SYSTEM STATUS: ${activeCount}/${totalCount}              ║`);
  console.log(`╚════════════════════════════════════════════════╝`);
  
  if (activeCount === totalCount) {
    console.log(`
💥 ALL SYSTEMS OPERATIONAL! 💥

🌐 Quick Actions:
   📺 View Projection: http://localhost:8888
   🎨 Open Frontend: frontend-unified-interface.html
   📊 Check Reports: ls *.json
   
Press Ctrl+C to stop monitoring
`);
  } else {
    console.log(`
⚠️  Some components not active yet...

🔧 Troubleshooting:
   - Run: node BASH-ULTIMATE-NOW.js
   - Check: node test-bash-now.js
   - Logs: Check console output
   
Press Ctrl+C to stop monitoring
`);
  }
}

function getStatusIcon(status) {
  switch(status) {
    case 'active': return '✅';
    case 'inactive': return '⚠️';
    case 'offline': return '🔴';
    case 'error': return '❌';
    case 'checking': return '🔄';
    default: return '❓';
  }
}

// Start monitoring
async function startMonitoring() {
  console.log('🔍 Starting component monitoring...\n');
  
  // Initial check
  await checkComponentStatus();
  displayStatus();
  
  // Update every 2 seconds
  setInterval(async () => {
    await checkComponentStatus();
    displayStatus();
  }, 2000);
  
  // Also try to execute if nothing is running
  setTimeout(async () => {
    const activeCount = Object.values(componentStatus).filter(c => c.status === 'active').length;
    if (activeCount === 0) {
      console.log('\n🚀 No active components detected. Starting bash sequence...\n');
      
      try {
        // Try to run the ultimate bash
        const UltimateBashThrough = require('./ultimate-bash-through.js');
        const bash = new UltimateBashThrough();
        await bash.ripThrough();
      } catch (e) {
        console.log('⚠️  Could not auto-start. Run manually: node BASH-ULTIMATE-NOW.js');
      }
    }
  }, 5000);
}

// Handle exit
process.on('SIGINT', () => {
  console.log('\n\n👋 Monitoring stopped. System continues running in background.\n');
  process.exit(0);
});

// Start the monitor
startMonitoring();