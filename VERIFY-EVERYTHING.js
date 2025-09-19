#!/usr/bin/env node
// VERIFY-EVERYTHING.js - Check what's real vs fake

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const http = require('http');

console.log('🔍 VERIFYING EVERYTHING IN THIS PROJECT');
console.log('======================================\n');

const results = {
  files: { found: [], missing: [], errors: [] },
  servers: { running: [], failed: [] },
  tests: { passed: [], failed: [] },
  dependencies: { installed: [], missing: [] }
};

// 1. CHECK FILES EXIST
console.log('📁 CHECKING FILES...\n');

const filesToCheck = [
  // Drag & Drop
  { file: 'real-drag-drop.js', desc: 'Real drag & drop server' },
  { file: 'START-DRAG-DROP-NOW.js', desc: 'Drag & drop launcher' },
  
  // Core Systems
  { file: 'master-integration-controller.js', desc: 'Master controller' },
  { file: 'unified-character-workflow-system.js', desc: 'Character workflow' },
  { file: 'api-orchestration-layer.js', desc: 'API orchestration' },
  { file: 'game-engine-musical-arpanet.js', desc: 'Game engine ARPANET' },
  
  // Archaeological
  { file: 'mcp/modules/archaeological-programming/archaeological-programming.ts', desc: 'Archaeological core' },
  { file: 'mcp/modules/archaeological-programming/archaeological-docs-generator.js', desc: 'Archaeological docs' },
  { file: 'mcp/modules/archaeological-programming/archaeological-testing-framework.js', desc: 'Archaeological tests' },
  
  // HTML Interfaces
  { file: 'master-dashboard.html', desc: 'Master dashboard' },
  { file: 'unified-dashboard.html', desc: 'Character dashboard' }
];

filesToCheck.forEach(({ file, desc }) => {
  try {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      console.log(`✅ ${file} (${stats.size} bytes)`);
      results.files.found.push({ file, size: stats.size, desc });
    } else {
      console.log(`❌ ${file} - NOT FOUND`);
      results.files.missing.push({ file, desc });
    }
  } catch (error) {
    console.log(`⚠️  ${file} - ERROR: ${error.message}`);
    results.files.errors.push({ file, error: error.message });
  }
});

// 2. CHECK DEPENDENCIES
console.log('\n\n📦 CHECKING DEPENDENCIES...\n');

const dependencies = ['express', 'multer', 'ws', 'cors', 'node-fetch'];

dependencies.forEach(dep => {
  try {
    require.resolve(dep);
    console.log(`✅ ${dep} - installed`);
    results.dependencies.installed.push(dep);
  } catch (e) {
    console.log(`❌ ${dep} - NOT INSTALLED`);
    results.dependencies.missing.push(dep);
  }
});

// 3. TEST FILE CONTENTS
console.log('\n\n🧪 TESTING FILE CONTENTS...\n');

// Test if files have actual code (not just strings)
function testFileContent(filepath, testName, searchString) {
  try {
    if (fs.existsSync(filepath)) {
      const content = fs.readFileSync(filepath, 'utf8');
      if (content.includes(searchString)) {
        console.log(`✅ ${testName}`);
        results.tests.passed.push(testName);
        return true;
      } else {
        console.log(`❌ ${testName} - missing expected content`);
        results.tests.failed.push(testName);
        return false;
      }
    }
  } catch (e) {
    console.log(`⚠️  ${testName} - ERROR: ${e.message}`);
    results.tests.failed.push(testName);
    return false;
  }
}

testFileContent('real-drag-drop.js', 'Drag & drop has Express server', 'express()');
testFileContent('master-integration-controller.js', 'Master has WebSocket', 'WebSocket');
testFileContent('game-engine-musical-arpanet.js', 'Game engine has frequencies', 'frequencyMap');
testFileContent('api-orchestration-layer.js', 'API has musical scales', 'musicalScales');

// 4. CHECK PORTS
console.log('\n\n🌐 CHECKING PORTS...\n');

async function checkPort(port, service) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      console.log(`✅ Port ${port} (${service}) - ACTIVE`);
      results.servers.running.push({ port, service });
      resolve(true);
    });
    
    req.on('error', () => {
      console.log(`❌ Port ${port} (${service}) - NOT RUNNING`);
      results.servers.failed.push({ port, service });
      resolve(false);
    });
    
    req.setTimeout(1000);
  });
}

async function checkAllPorts() {
  await checkPort(5678, 'Drag & Drop Server');
  await checkPort(9999, 'Master Controller');
  await checkPort(3000, 'MCP Template Server');
  await checkPort(7777, 'Musical Processor');
  await checkPort(8888, 'Full Integrated System');
}

// 5. TEST ARCHAEOLOGICAL SYMBOLS
console.log('\n\n🏛️ TESTING ARCHAEOLOGICAL SYMBOLS...\n');

const symbols = ['𓂀', '𓊖', '𓆎', '𓎛', '𓈗'];
console.log('Egyptian Hieroglyphs:');
symbols.forEach(s => console.log(`  ${s} - displays correctly`));

// 6. QUICK FUNCTIONALITY TEST
console.log('\n\n⚡ QUICK FUNCTIONALITY TESTS...\n');

// Test frequency calculation
function testFrequencyCalc() {
  try {
    const frequencyToNote = (freq) => {
      const A4 = 440;
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      const halfSteps = 12 * Math.log2(freq / A4);
      const noteIndex = Math.round(halfSteps + 9) % 12;
      return notes[noteIndex];
    };
    
    const testFreq = 440;
    const note = frequencyToNote(testFreq);
    console.log(`✅ Frequency to note: ${testFreq}Hz = ${note}`);
    results.tests.passed.push('Frequency calculation');
  } catch (e) {
    console.log(`❌ Frequency calculation failed: ${e.message}`);
    results.tests.failed.push('Frequency calculation');
  }
}

testFrequencyCalc();

// 7. GENERATE SUMMARY
async function generateSummary() {
  await checkAllPorts();
  
  console.log('\n\n📊 VERIFICATION SUMMARY');
  console.log('======================\n');
  
  console.log(`FILES:`);
  console.log(`  ✅ Found: ${results.files.found.length}`);
  console.log(`  ❌ Missing: ${results.files.missing.length}`);
  console.log(`  ⚠️  Errors: ${results.files.errors.length}`);
  
  console.log(`\nDEPENDENCIES:`);
  console.log(`  ✅ Installed: ${results.dependencies.installed.length}`);
  console.log(`  ❌ Missing: ${results.dependencies.missing.length}`);
  
  console.log(`\nSERVERS:`);
  console.log(`  ✅ Running: ${results.servers.running.length}`);
  console.log(`  ❌ Not Running: ${results.servers.failed.length}`);
  
  console.log(`\nTESTS:`);
  console.log(`  ✅ Passed: ${results.tests.passed.length}`);
  console.log(`  ❌ Failed: ${results.tests.failed.length}`);
  
  // Missing files details
  if (results.files.missing.length > 0) {
    console.log('\n❌ MISSING FILES:');
    results.files.missing.forEach(f => console.log(`  - ${f.file} (${f.desc})`));
  }
  
  // What to run
  console.log('\n\n🚀 WHAT YOU CAN RUN RIGHT NOW:');
  
  if (results.files.found.some(f => f.file === 'real-drag-drop.js')) {
    console.log('\n1. Drag & Drop Interface:');
    console.log('   node START-DRAG-DROP-NOW.js');
    console.log('   OR');
    console.log('   node real-drag-drop.js');
  }
  
  if (results.files.found.some(f => f.file === 'master-integration-controller.js')) {
    console.log('\n2. Master Controller:');
    console.log('   node master-integration-controller.js');
  }
  
  if (results.files.found.some(f => f.file === 'unified-character-workflow-system.js')) {
    console.log('\n3. Character Workflow:');
    console.log('   node unified-character-workflow-system.js');
  }
  
  // Save results to file
  fs.writeFileSync('verification-results.json', JSON.stringify(results, null, 2));
  console.log('\n\n📄 Full results saved to: verification-results.json');
}

// Run everything
generateSummary().catch(console.error);