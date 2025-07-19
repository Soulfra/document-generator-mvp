#!/usr/bin/env node

/**
 * SYSTEM COMPARISON
 * Compare heavy vs lightweight chaos monitoring
 */

console.log(`
🔍 CHAOS MONITORING SYSTEM COMPARISON
Heavy vs Lightweight - Runtime Analysis
`);

const systems = {
  heavy: {
    name: "Visual Chaos Stream",
    file: "visual-chaos-stream.js",
    port: 3337,
    features: [
      "Real-time WebSocket streaming",
      "Complex visual interface", 
      "Multiple event emitters",
      "Heavy CSS animations",
      "Complex state management",
      "Multiple concurrent processes",
      "Continuous monitoring loops",
      "Advanced warning system"
    ],
    runtime: {
      memory: "150-300MB",
      cpu: "High - continuous processing",
      network: "WebSocket connections",
      files: "Multiple complex HTML/CSS/JS"
    },
    pros: [
      "Full-featured interface",
      "Real-time visual feedback", 
      "Advanced interaction",
      "Complete monitoring"
    ],
    cons: [
      "High runtime overhead",
      "Memory intensive",
      "Complex dependencies",
      "Hits timeout limits"
    ]
  },
  
  light: {
    name: "Simple Chaos Monitor", 
    file: "simple-chaos-monitor.js",
    port: 3338,
    features: [
      "3-second interval checks",
      "Simple file output",
      "Webhook alerts only",
      "Minimal HTML interface",
      "Basic status tracking", 
      "External tool integration",
      "OBS-ready text files",
      "Cloudflare Worker ready"
    ],
    runtime: {
      memory: "20-50MB",
      cpu: "Low - minimal processing",
      network: "Simple HTTP + webhooks",
      files: "Simple text/JSON outputs"
    },
    pros: [
      "Ultra-lightweight",
      "No runtime limits",
      "External integration",
      "Cloudflare deployable"
    ],
    cons: [
      "Basic interface",
      "No real-time updates",
      "Limited visualization",
      "External dependency"
    ]
  }
};

function compareFeatures() {
  console.log('\n📊 FEATURE COMPARISON\n');
  
  console.log('HEAVY SYSTEM (visual-chaos-stream.js):');
  systems.heavy.features.forEach(feature => console.log(`  ✅ ${feature}`));
  
  console.log('\nLIGHT SYSTEM (simple-chaos-monitor.js):');
  systems.light.features.forEach(feature => console.log(`  📱 ${feature}`));
}

function compareRuntime() {
  console.log('\n⚡ RUNTIME COMPARISON\n');
  
  Object.entries(systems).forEach(([key, system]) => {
    console.log(`${key.toUpperCase()} SYSTEM:`);
    Object.entries(system.runtime).forEach(([metric, value]) => {
      console.log(`  ${metric}: ${value}`);
    });
    console.log('');
  });
}

function compareUseCases() {
  console.log('\n🎯 USE CASE RECOMMENDATIONS\n');
  
  console.log('USE HEAVY SYSTEM WHEN:');
  console.log('  🖥️ Running on powerful local machine');
  console.log('  📺 Need real-time visual monitoring');
  console.log('  🎮 Interactive chaos testing');
  console.log('  🔬 Development/debugging environment');
  
  console.log('\nUSE LIGHT SYSTEM WHEN:');
  console.log('  ☁️ Deploying to Cloudflare/edge');
  console.log('  📡 Integration with Discord/Telegram');
  console.log('  📺 OBS streaming overlays');
  console.log('  ⏱️ Hitting runtime/timeout limits');
  console.log('  💰 Cost optimization needed');
}

function generateMigrationScript() {
  console.log('\n🔄 MIGRATION SCRIPT\n');
  
  const migration = `#!/bin/bash

# Migrate from heavy to light chaos monitoring

echo "🔄 Migrating to lightweight chaos monitoring..."

# Stop heavy system if running
pkill -f "visual-chaos-stream.js" 2>/dev/null

# Backup heavy system data
if [ -f "chaos-stream-interface.html" ]; then
    mv chaos-stream-interface.html chaos-stream-interface.html.backup
    echo "📦 Backed up heavy interface"
fi

# Start lightweight system
echo "🚀 Starting lightweight chaos monitor..."
npm run simple-chaos &

# Setup external integrations
if [ ! -f ".env" ]; then
    echo "⚙️ Setting up .env configuration..."
    cat > .env << 'EOF'
WEBHOOK_URL=""  # Add your Discord webhook URL here
ALERT_COOLDOWN=5000
CHAOS_THRESHOLD=50
MEMORY_THRESHOLD=100
EOF
fi

echo "✅ Migration complete!"
echo "🌐 Light system: http://localhost:3338"
echo "📄 OBS text file: chaos-status.txt"
echo "⚙️ Configure webhooks in .env file"
`;

  require('fs').writeFileSync('migrate-to-light.sh', migration);
  console.log('Migration script created: migrate-to-light.sh');
}

function showCurrentStatus() {
  console.log('\n📈 CURRENT SYSTEM STATUS\n');
  
  const memUsage = process.memoryUsage();
  console.log(`Memory Usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`);
  console.log(`Uptime: ${process.uptime().toFixed(1)}s`);
  console.log(`Node Version: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'features':
    compareFeatures();
    break;
  case 'runtime':
    compareRuntime();
    break;
  case 'use-cases':
    compareUseCases();
    break;
  case 'migrate':
    generateMigrationScript();
    break;
  case 'status':
    showCurrentStatus();
    break;
  default:
    console.log(`
🔍 Chaos Monitoring System Comparison

Commands:
  node compare-systems.js features    # Compare features
  node compare-systems.js runtime     # Compare runtime usage
  node compare-systems.js use-cases   # Show use case recommendations
  node compare-systems.js migrate     # Generate migration script
  node compare-systems.js status      # Show current system status

💡 QUICK DECISION:

Runtime Issues? → Use Light System
  npm run simple-chaos

Full Features? → Use Heavy System  
  npm run chaos

External Tools? → Use Light System
  OBS, Discord, Telegram integration

Cloudflare Deploy? → Use Light System
  Edge-ready, minimal resources
    `);
    
    compareFeatures();
    compareRuntime();
    compareUseCases();
}