#!/usr/bin/env node

/**
 * Execute OSS Creation
 * This script actually creates the OSS structure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Import the OSS creator
const OSSStructureCreator = require('./create-oss-structure.js');

console.log('🚀 EXECUTING OSS STRUCTURE CREATION...\n');

// Create the OSS structure
const creator = new OSSStructureCreator();
creator.create()
  .then(() => {
    console.log('\n✅ OSS structure created successfully!');
    
    // Show what was created
    console.log('\n📁 Created structure at:', path.join(__dirname, 'soulfra-platform'));
    console.log('\n📋 Next steps:');
    console.log('1. cd soulfra-platform');
    console.log('2. npm install');
    console.log('3. npm run bootstrap');
    console.log('4. npm start');
    
    // Copy core working files into the structure
    console.log('\n📦 Copying core working files...');
    
    const coreFiles = [
      'server.js',
      'flag-tag-system.js',
      'database-integration.js',
      'master-menu-compactor.html',
      'ai-economy-runtime.js',
      'real-data-hooks-layer.js',
      'simp-tag-compactor.js',
      'electron-app-wrapper.js'
    ];
    
    const destCore = path.join(__dirname, 'soulfra-platform', 'packages', 'core', 'src');
    
    coreFiles.forEach(file => {
      const src = path.join(__dirname, file);
      if (fs.existsSync(src)) {
        const dest = path.join(destCore, file);
        try {
          fs.copyFileSync(src, dest);
          console.log(`  ✅ Copied ${file}`);
        } catch (err) {
          console.log(`  ❌ Failed to copy ${file}:`, err.message);
        }
      } else {
        console.log(`  ⚠️  ${file} not found`);
      }
    });
    
    console.log('\n🎉 OSS TRANSFORMATION COMPLETE!');
    console.log('The Soulfra Platform is now packaged as a modular open source project.');
  })
  .catch(err => {
    console.error('❌ Failed to create OSS structure:', err);
    process.exit(1);
  });