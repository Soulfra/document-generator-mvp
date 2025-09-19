#!/usr/bin/env node

// Quick test launcher for Electron Unified App
// This starts the minimal services needed and launches Electron

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 STARTING ELECTRON UNIFIED APP TEST');
console.log('=====================================\n');

// Start minimal services in background
console.log('📡 Starting background services...');

// Start streaming system
const streamingProcess = spawn('node', ['integrated-streaming-system.js'], {
    cwd: __dirname,
    stdio: 'ignore',
    detached: true
});

// Start differential extractor
const differentialProcess = spawn('node', ['differential-game-extractor.js'], {
    cwd: __dirname,
    stdio: 'ignore', 
    detached: true
});

console.log('✅ Background services started');
console.log('⏱️  Waiting 3 seconds for services to initialize...\n');

// Wait for services to start
setTimeout(() => {
    console.log('🖥️  Launching Electron Unified App...');
    console.log('');
    console.log('📋 Available modes in the app:');
    console.log('   • Desktop Environment - Winamp-style monitoring');
    console.log('   • Document Processor - Transform docs to MVPs');
    console.log('   • Framework Wormhole - Integrate open source frameworks');
    console.log('   • Differential Games - Extract hidden value from forums');
    console.log('');
    console.log('🎮 Use the menu bar to switch between modes');
    console.log('🔧 Check Services → Verify All Services for status');
    console.log('');

    // Launch Electron
    const electronProcess = spawn('npm', ['run', 'electron-unified'], {
        cwd: __dirname,
        stdio: 'inherit'
    });

    // Handle cleanup
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down...');
        
        try {
            electronProcess.kill();
            process.kill(-streamingProcess.pid);
            process.kill(-differentialProcess.pid);
        } catch (error) {
            // Ignore cleanup errors
        }
        
        process.exit(0);
    });

    electronProcess.on('close', (code) => {
        console.log('\n📱 Electron app closed');
        
        // Cleanup background services
        try {
            process.kill(-streamingProcess.pid);
            process.kill(-differentialProcess.pid);
        } catch (error) {
            // Ignore cleanup errors
        }
        
        process.exit(code);
    });

}, 3000);