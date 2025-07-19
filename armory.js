#!/usr/bin/env node

/**
 * ARMORY - Tool selection and execution layer
 * This might be what we're missing - a tool selector that bypasses shell issues
 */

console.log('⚔️  DOCUMENT GENERATOR ARMORY');
console.log('============================');
console.log('Select your weapon against the snapshot error:\n');

const fs = require('fs');
const path = require('path');

// Available weapons/tools
const weapons = {
  'direct': {
    name: '🎯 Direct Execution (No Shell)',
    description: 'Execute character system directly in Node.js',
    execute: () => {
      console.log('\n🎯 Executing directly...');
      require('./character-system-max.js');
    }
  },
  
  'middleware': {
    name: '🛠️  Middleware Layer',
    description: 'Use middleware menu to bypass shell',
    execute: () => {
      console.log('\n🛠️  Loading middleware...');
      require('./middleware-menu.js');
    }
  },
  
  'express': {
    name: '🌐 Express Web Server',
    description: 'Start web interface without shell',
    execute: () => {
      console.log('\n🌐 Starting Express...');
      try {
        const express = require('express');
        const app = express();
        
        app.get('/', (req, res) => {
          res.send('<h1>Document Generator</h1><p>Running without shell!</p>');
        });
        
        app.listen(8888, () => {
          console.log('✅ Server running at http://localhost:8888');
        });
      } catch (e) {
        console.log('❌ Express not installed. Run: npm install express');
      }
    }
  },
  
  'spawn': {
    name: '🔄 Process Spawner',
    description: 'Spawn processes without shell snapshots',
    execute: () => {
      console.log('\n🔄 Spawning process...');
      const { spawn } = require('child_process');
      const proc = spawn('node', ['character-system-max.js'], {
        stdio: 'inherit',
        shell: false
      });
      
      proc.on('error', (err) => {
        console.log('❌ Spawn failed:', err.message);
      });
    }
  },
  
  'eval': {
    name: '⚡ Eval Mode',
    description: 'Evaluate code directly',
    execute: () => {
      console.log('\n⚡ Eval mode...');
      const code = fs.readFileSync('./character-system-max.js', 'utf8');
      
      try {
        // Strip the shebang and execute
        const cleanCode = code.replace(/^#!/, '//');
        eval(cleanCode);
      } catch (e) {
        console.log('❌ Eval failed:', e.message);
      }
    }
  }
};

// Auto-select best weapon
function autoSelect() {
  console.log('🤖 Auto-selecting best weapon...\n');
  
  // Check what's available
  const hasExpress = fs.existsSync('./node_modules/express');
  const hasCharSystem = fs.existsSync('./character-system-max.js');
  
  console.log(`Express available: ${hasExpress}`);
  console.log(`Character system: ${hasCharSystem}`);
  
  if (hasCharSystem) {
    console.log('\n🎯 Using direct execution...');
    weapons.direct.execute();
  } else if (hasExpress) {
    console.log('\n🌐 Using Express fallback...');
    weapons.express.execute();
  } else {
    console.log('\n🛠️  Using middleware...');
    weapons.middleware.execute();
  }
}

// If run directly, auto-select
if (require.main === module) {
  autoSelect();
}

module.exports = weapons;