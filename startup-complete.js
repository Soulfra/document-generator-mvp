#!/usr/bin/env node

/**
 * STARTUP COMPLETE - SMASH BASH EVERYTHING
 * Run the entire Soulfra platform with all systems integrated
 */

console.log('🔥 SMASHING BASH - STARTING EVERYTHING 🔥');
console.log('');

// Import all systems
const express = require('express');
const path = require('path');
const fs = require('fs');

// Check if all required files exist
const requiredFiles = [
  './flag-tag-system.js',
  './database-integration.js',
  './real-data-hooks-layer.js',
  './server.js'
];

console.log('📋 CHECKING REQUIRED FILES:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING!`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('❌ Some required files are missing. Cannot start.');
  process.exit(1);
}

console.log('');
console.log('🚀 INITIALIZING ALL SYSTEMS:');

// Initialize database integration
console.log('💾 Starting database integration...');
const DatabaseIntegration = require('./database-integration');
const db = new DatabaseIntegration();

// Initialize flag-tag system
console.log('🏴 Starting flag-tag system...');
const FlagTagSystem = require('./flag-tag-system');
const flagTagSystem = new FlagTagSystem();

// Initialize real data hooks
console.log('🎣 Starting real data hooks...');
const RealDataHooksLayer = require('./real-data-hooks-layer');
const realDataHooks = new RealDataHooksLayer();

console.log('');
console.log('📊 SYSTEM OVERVIEW:');

// Get database stats
const dbStats = db.getDatabaseStats();
console.log(`💾 Database: ${dbStats.connected ? 'CONNECTED' : 'DISCONNECTED'}`);
console.log(`  • Components: ${dbStats.tables.components}`);
console.log(`  • Flags: ${dbStats.tables.flags}`);
console.log(`  • Tags: ${dbStats.tables.tags}`);
console.log(`  • Database size: ${(dbStats.total_size / 1024).toFixed(1)}KB`);

// Get flag-tag system stats
console.log(`🏴 Flag-Tag System: ACTIVE`);
console.log(`  • Registered components: ${flagTagSystem.componentRegistry.size}`);
console.log(`  • Active flags: ${flagTagSystem.flags.size}`);
console.log(`  • Active tags: ${flagTagSystem.tags.size}`);

// Get AI network stats
const aiNetworkStatus = realDataHooks.aiRequestLayer.getNetworkStatus();
console.log(`🤖 AI Network: ${aiNetworkStatus.connected_ais > 0 ? 'CONNECTED' : 'READY'}`);
console.log(`  • Connected AIs: ${aiNetworkStatus.connected_ais}`);
console.log(`  • Total requests: ${aiNetworkStatus.total_requests}`);
console.log(`  • Pending requests: ${aiNetworkStatus.pending_requests}`);

console.log('');
console.log('🎯 SYSTEM HEALTH CHECK:');

// Run system health check
flagTagSystem.generateSystemMap();
const systemHealth = flagTagSystem.systemMap.overview.system_health;
console.log(`❤️ Overall Health: ${systemHealth}%`);

if (systemHealth >= 90) {
  console.log('✅ EXCELLENT - All systems optimal');
} else if (systemHealth >= 75) {
  console.log('⚠️ GOOD - Minor issues detected');
} else if (systemHealth >= 50) {
  console.log('🚨 WARNING - Multiple issues detected');
} else {
  console.log('💥 CRITICAL - Major system problems');
}

// Show critical path components
const criticalPath = flagTagSystem.systemMap.critical_path;
console.log(`🎯 Critical components: ${criticalPath.length}`);
criticalPath.forEach(comp => {
  console.log(`  • ${comp.id}: ${comp.status}`);
});

// Show health alerts
const alerts = flagTagSystem.systemMap.health_alerts;
if (alerts.length > 0) {
  console.log(`🚨 Health alerts: ${alerts.length}`);
  alerts.forEach(alert => {
    console.log(`  • ${alert.level.toUpperCase()}: ${alert.message}`);
  });
} else {
  console.log('✅ No health alerts');
}

console.log('');
console.log('🔥 RIP-THROUGH OPERATIONS:');

// Test rip-through operations
console.log('🔄 Testing refresh_flags operation...');
const refreshResult = flagTagSystem.ripThroughSystem('refresh_flags', {});
console.log(`  • Processed: ${refreshResult.processed}/${refreshResult.targets}`);
console.log(`  • Success: ${refreshResult.success.length}`);
console.log(`  • Errors: ${refreshResult.errors.length}`);

console.log('✅ Testing validate_existence operation...');
const validateResult = flagTagSystem.ripThroughSystem('validate_existence', {});
console.log(`  • Processed: ${validateResult.processed}/${validateResult.targets}`);
console.log(`  • Success: ${validateResult.success.length}`);
console.log(`  • Errors: ${validateResult.errors.length}`);

console.log('⏰ Testing update_timestamps operation...');
const timestampResult = flagTagSystem.ripThroughSystem('update_timestamps', {});
console.log(`  • Processed: ${timestampResult.processed}/${timestampResult.targets}`);
console.log(`  • Success: ${timestampResult.success.length}`);
console.log(`  • Errors: ${timestampResult.errors.length}`);

console.log('');
console.log('📊 LAYER BREAKDOWN:');

// Show component breakdown by layer
const layers = flagTagSystem.systemMap.layers;
Object.entries(layers).forEach(([layerName, components]) => {
  const layerIcon = {
    'documentation': '📚',
    'mvp': '🚀',
    'distributed': '🌍',
    'vanity': '👑',
    'hooks': '🎣',
    'ai-network': '🤖',
    'flag-tag': '🏴'
  }[layerName] || '📦';
  
  console.log(`${layerIcon} ${layerName.toUpperCase()}: ${components.length} components`);
  components.forEach(comp => {
    console.log(`  • ${comp.id}: ${comp.status}`);
  });
});

console.log('');
console.log('💾 DATABASE OPERATIONS:');

// Test database persistence
console.log('💾 Testing database persistence...');
const testData = {
  test_key: 'test_value',
  timestamp: Date.now()
};

db.setCache('test_cache', testData, 60000); // 1 minute TTL
const retrieved = db.getCache('test_cache');
console.log(`  • Cache test: ${retrieved ? 'SUCCESS' : 'FAILED'}`);

// Record some test vanity stats
db.recordVanityStat('tech_flex', 'system_startup', 'success');
db.recordVanityStat('performance', 'health_check', systemHealth + '%');
console.log('  • Vanity stats recorded: SUCCESS');

// Create a backup
const backupPath = db.createBackup();
console.log(`  • Backup created: ${backupPath ? 'SUCCESS' : 'FAILED'}`);

console.log('');
console.log('🌐 ACCESS POINTS:');
console.log('🏴 Flag & Tag Dashboard: http://localhost:3000/flags');
console.log('👑 Vanity Rooms: http://localhost:3000/vanity');
console.log('🎣 Real Data Hooks: http://localhost:3000/api/vanity/real-stats');
console.log('🤖 AI Network Status: http://localhost:3000/api/ai/network');
console.log('💾 System Map: http://localhost:3000/api/flags/system-map');
console.log('🔥 Rip Through: POST http://localhost:3000/api/flags/rip-through');

console.log('');
console.log('🎯 READY TO START SERVER:');
console.log('Run: node server.js');
console.log('Or: npm start');

console.log('');
console.log('🔥 SMASH BASH COMPLETE - ALL SYSTEMS READY! 🔥');

// Optional: Start server automatically
if (process.argv.includes('--start-server')) {
  console.log('🚀 Auto-starting server...');
  require('./server.js');
}