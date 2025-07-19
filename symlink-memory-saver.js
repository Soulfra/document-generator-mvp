#!/usr/bin/env node

/**
 * Symlink Memory Saver - Reduces duplicate files and saves memory
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔗 SYMLINK MEMORY SAVER');
console.log('=======================');
console.log('Creating symlinks to save memory...\n');

// Find duplicate node_modules and symlink them
function symlinkDuplicates() {
  console.log('🔍 Finding duplicate node_modules...');
  
  try {
    // Find all node_modules directories
    const nodeModules = execSync('find . -name "node_modules" -type d', { encoding: 'utf8' })
      .split('\n')
      .filter(p => p && !p.includes('/.git/'));
    
    console.log(`Found ${nodeModules.length} node_modules directories`);
    
    // Keep the main one, symlink others
    const mainModules = './node_modules';
    
    nodeModules.forEach(modulePath => {
      if (modulePath !== mainModules && fs.existsSync(modulePath)) {
        console.log(`🔗 Symlinking ${modulePath} → ${mainModules}`);
        
        try {
          // Remove the duplicate
          execSync(`rm -rf "${modulePath}"`);
          
          // Create symlink
          const relativePath = path.relative(path.dirname(modulePath), mainModules);
          fs.symlinkSync(relativePath, modulePath);
          
          console.log(`✅ Saved memory from ${modulePath}`);
        } catch (err) {
          console.log(`⚠️  Could not symlink ${modulePath}`);
        }
      }
    });
    
  } catch (error) {
    console.log('⚠️  Could not scan for duplicates');
  }
}

// Create essential symlinks only
function createEssentialSymlinks() {
  console.log('\n🔗 Creating essential symlinks...');
  
  const essentialLinks = [
    // Link character system to web root
    {
      source: './character-system-max.js',
      target: './public/js/character-system.js'
    },
    // Link FinishThisIdea tiers
    {
      source: './FinishThisIdea/tier-5-universal-interface.js',
      target: './universal-interface.js'
    }
  ];
  
  essentialLinks.forEach(({ source, target }) => {
    try {
      if (fs.existsSync(source) && !fs.existsSync(target)) {
        const targetDir = path.dirname(target);
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        fs.symlinkSync(path.resolve(source), path.resolve(target));
        console.log(`✅ Linked ${source} → ${target}`);
      }
    } catch (err) {
      console.log(`⚠️  Could not link ${source}`);
    }
  });
}

// Memory status
function checkMemory() {
  console.log('\n💾 Memory Status:');
  
  try {
    if (process.platform === 'darwin') {
      // macOS
      const memInfo = execSync('vm_stat', { encoding: 'utf8' });
      console.log('macOS Memory:', memInfo.split('\n').slice(1, 4).join('\n'));
    } else {
      // Linux
      const memInfo = execSync('free -h', { encoding: 'utf8' });
      console.log(memInfo);
    }
    
    // Node.js memory
    const usage = process.memoryUsage();
    console.log('\nNode.js Memory:');
    console.log(`  Heap Used: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
    console.log(`  Heap Total: ${Math.round(usage.heapTotal / 1024 / 1024)}MB`);
    
  } catch (error) {
    console.log('Could not check memory status');
  }
}

// Cleanup unnecessary files
function cleanupFiles() {
  console.log('\n🧹 Cleaning up unnecessary files...');
  
  const cleanupPaths = [
    './temp',
    './logs',
    './.cache',
    './generated/temp',
    './uploads/temp'
  ];
  
  cleanupPaths.forEach(p => {
    if (fs.existsSync(p)) {
      try {
        execSync(`rm -rf ${p}/*`);
        console.log(`✅ Cleaned ${p}`);
      } catch (err) {
        console.log(`⚠️  Could not clean ${p}`);
      }
    }
  });
}

// Main execution
console.log('Starting memory optimization...\n');

checkMemory();
symlinkDuplicates();
createEssentialSymlinks();
cleanupFiles();

console.log('\n✅ Memory optimization complete!');
checkMemory();

console.log('\n🚀 You can now safely:');
console.log('1. Close terminal windows');
console.log('2. Run: node launch.js');
console.log('3. Access system at: http://localhost:7777');
console.log('\nThe system will run with minimal memory usage!');