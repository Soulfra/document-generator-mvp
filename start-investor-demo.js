#!/usr/bin/env node

/**
 * 🚀 INVESTOR DEMO LAUNCHER
 * 
 * Quick launcher that starts the investor demo using existing infrastructure
 * Bypasses CLI issues by running as pure Node.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 BRAND GENERATION PLATFORM - INVESTOR DEMO');
console.log('===========================================');

// Start the demo backend
console.log('🌟 Starting investor demo backend...');

const demoProcess = spawn('node', ['vc-demo-backend.js'], {
    cwd: __dirname,
    stdio: 'inherit'
});

demoProcess.on('error', (error) => {
    console.error('❌ Failed to start demo:', error.message);
    process.exit(1);
});

demoProcess.on('close', (code) => {
    if (code !== 0) {
        console.error(`❌ Demo process exited with code ${code}`);
    } else {
        console.log('✅ Demo stopped successfully');
    }
});

// Handle cleanup on exit
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping investor demo...');
    demoProcess.kill();
    process.exit(0);
});

process.on('SIGTERM', () => {
    demoProcess.kill();
    process.exit(0);
});

console.log('');
console.log('🎯 INVESTOR DEMO INSTRUCTIONS:');
console.log('==============================');
console.log('1. Open http://localhost:3001 in your browser');
console.log('2. Try the "Coffee Delivery" example');
console.log('3. Watch the real-time brand generation');
console.log('4. Show the complete business output');
console.log('');
console.log('💡 KEY SELLING POINTS:');
console.log('• 30 minutes vs 6+ months traditional');
console.log('• $50 vs $50K+ agency costs');
console.log('• Complete business ecosystem generated');
console.log('• Ready-to-deploy code and assets');
console.log('');
console.log('Press Ctrl+C to stop the demo');