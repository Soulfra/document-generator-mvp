#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔗 SYMLINKING SERVICES TO ROOT\n');

// Services that might be needed
const serviceLinks = [
  {
    source: './services/sovereign-agents/src/services/SovereignAgent.js',
    target: './SovereignAgent.js'
  },
  {
    source: './services/sovereign-agents/src/services/SovereignOrchestrationDatabase.js',
    target: './SovereignOrchestrationDatabase.js'
  },
  {
    source: './services/sovereign-agents/src/services/HumanConductorInterface.js',
    target: './HumanConductorInterface.js'
  },
  {
    source: './services/api-server/PipelineOrchestrator.js',
    target: './PipelineOrchestrator.js'
  },
  {
    source: './services/api-server/WebSocketManager.js',
    target: './WebSocketManager.js'
  }
];

// Create symlinks
serviceLinks.forEach(({ source, target }) => {
  try {
    if (fs.existsSync(source) && !fs.existsSync(target)) {
      fs.symlinkSync(path.resolve(source), path.resolve(target));
      console.log(`✅ Linked ${target} → ${source}`);
    } else if (fs.existsSync(target)) {
      console.log(`⏭️  ${target} already exists`);
    } else {
      console.log(`❌ Source not found: ${source}`);
    }
  } catch (e) {
    console.log(`❌ Failed to link ${target}: ${e.message}`);
  }
});

// Also check if we need to install dependencies
console.log('\n📦 Checking dependencies...');
if (!fs.existsSync('./node_modules')) {
  console.log('❌ node_modules missing - run: npm install');
} else {
  console.log('✅ node_modules exists');
}

// Create package-lock if missing
if (!fs.existsSync('./package-lock.json')) {
  console.log('\n⚠️  package-lock.json missing');
  console.log('Creating minimal package-lock...');
  
  const minimalLock = {
    name: "document-generator",
    version: "1.0.0",
    lockfileVersion: 2,
    requires: true,
    packages: {
      "": {
        name: "document-generator",
        version: "1.0.0",
        dependencies: {}
      }
    }
  };
  
  fs.writeFileSync('./package-lock.json', JSON.stringify(minimalLock, null, 2));
  console.log('✅ Created minimal package-lock.json');
}

console.log('\n🚀 Next: node character-system-max.js');