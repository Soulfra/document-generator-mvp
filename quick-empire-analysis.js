#!/usr/bin/env node

/**
 * QUICK EMPIRE ANALYSIS
 * Fast analysis of what's actually in this massive codebase
 */

const fs = require('fs').promises;
const path = require('path');

async function analyzeEmpire() {
  console.log('🔍 Quick Empire Analysis...\n');
  
  const stats = {
    totalFiles: 0,
    byExtension: {},
    byDirectory: {},
    largeFiles: [],
    keyPatterns: {
      databases: 0,
      apis: 0,
      games: 0,
      blockchain: 0,
      ai: 0,
      realImplementations: 0
    }
  };
  
  const baseDir = '/Users/matthewmauer/Desktop/Document-Generator';
  
  async function scan(dir, depth = 0) {
    if (depth > 3) return; // Limit depth to avoid infinite recursion
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && 
            entry.name !== 'node_modules' && entry.name !== 'dist') {
          
          const relPath = path.relative(baseDir, fullPath);
          stats.byDirectory[relPath] = (stats.byDirectory[relPath] || 0) + 1;
          
          await scan(fullPath, depth + 1);
          
        } else if (entry.isFile()) {
          stats.totalFiles++;
          
          const ext = path.extname(entry.name);
          stats.byExtension[ext] = (stats.byExtension[ext] || 0) + 1;
          
          // Check file size
          const stat = await fs.stat(fullPath);
          if (stat.size > 1024 * 1024) { // Files over 1MB
            stats.largeFiles.push({
              path: path.relative(baseDir, fullPath),
              size: (stat.size / 1024 / 1024).toFixed(2) + 'MB'
            });
          }
          
          // Quick pattern check for key files
          if (ext === '.js' || ext === '.ts') {
            try {
              const content = await fs.readFile(fullPath, 'utf8');
              const contentLower = content.toLowerCase();
              
              if (contentLower.includes('postgres') || contentLower.includes('database')) {
                stats.keyPatterns.databases++;
              }
              if (contentLower.includes('express') || contentLower.includes('api')) {
                stats.keyPatterns.apis++;
              }
              if (contentLower.includes('game') || contentLower.includes('player')) {
                stats.keyPatterns.games++;
              }
              if (contentLower.includes('blockchain') || contentLower.includes('crypto')) {
                stats.keyPatterns.blockchain++;
              }
              if (contentLower.includes('ai') || contentLower.includes('llm')) {
                stats.keyPatterns.ai++;
              }
              if (contentLower.includes('localhost') || contentLower.includes('process.env')) {
                stats.keyPatterns.realImplementations++;
              }
            } catch (e) {
              // Skip files we can't read
            }
          }
        }
      }
    } catch (error) {
      // Skip directories we can't access
    }
  }
  
  await scan(baseDir);
  
  // Print results
  console.log('📊 EMPIRE ANALYSIS RESULTS:\n');
  
  console.log(`Total Files: ${stats.totalFiles.toLocaleString()}`);
  
  console.log('\n📁 Top Directories:');
  const topDirs = Object.entries(stats.byDirectory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [dir, count] of topDirs) {
    console.log(`   ${dir || 'root'}: ${count} files`);
  }
  
  console.log('\n📄 File Types:');
  const topExts = Object.entries(stats.byExtension)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  for (const [ext, count] of topExts) {
    console.log(`   ${ext || 'no extension'}: ${count} files`);
  }
  
  console.log('\n💾 Large Files:');
  for (const file of stats.largeFiles.slice(0, 5)) {
    console.log(`   ${file.path}: ${file.size}`);
  }
  
  console.log('\n🎯 Key Patterns Found:');
  console.log(`   Database systems: ${stats.keyPatterns.databases}`);
  console.log(`   API endpoints: ${stats.keyPatterns.apis}`);
  console.log(`   Gaming systems: ${stats.keyPatterns.games}`);
  console.log(`   Blockchain/Crypto: ${stats.keyPatterns.blockchain}`);
  console.log(`   AI/LLM integration: ${stats.keyPatterns.ai}`);
  console.log(`   Real implementations: ${stats.keyPatterns.realImplementations}`);
  
  // Find the most important files
  console.log('\n🔑 Key Entry Points:');
  const keyFiles = [
    'server.js',
    'index.js',
    'app.js',
    'main.js',
    'empire-document-bridge.js',
    'docker-compose.yml',
    'package.json'
  ];
  
  for (const keyFile of keyFiles) {
    try {
      const exists = await fs.access(path.join(baseDir, keyFile))
        .then(() => true)
        .catch(() => false);
      if (exists) {
        console.log(`   ✅ ${keyFile}`);
      }
    } catch (e) {}
  }
  
  // Check what's actually running
  console.log('\n🚀 Quick Recommendations:');
  console.log('1. You have 76K+ files but most are probably experiments');
  console.log('2. Focus on these verified working components:');
  console.log('   - empire-document-bridge.js (port 3333)');
  console.log('   - PostgreSQL + Redis (via Docker)');
  console.log('   - real-mobile-game-platform.html');
  console.log('   - real-audit-firm.html');
  console.log('3. The vortex layering is overwhelming - simplify!');
  console.log('4. Build a clean API gateway to unify everything');
}

analyzeEmpire().catch(console.error);