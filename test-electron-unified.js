#!/usr/bin/env node

// Test Electron Unified - Quick Electron test with all modes
// Starts services and launches Electron with verification

const { spawn } = require('child_process');
const WebSocket = require('ws');

console.log('🖥️  ELECTRON UNIFIED TEST');
console.log('========================\n');

console.log('🚀 Quick Electron verification test...');
console.log('📡 Starting minimal services for Electron...\n');

const services = [
    {
        name: 'Universal Aggregator',
        file: 'universal-data-aggregator.js',
        port: 47004,
        critical: true
    },
    {
        name: 'Crypto Aggregator', 
        file: 'crypto-data-aggregator.js',
        port: 47003,
        critical: false
    },
    {
        name: 'Differential Games',
        file: 'differential-game-extractor.js', 
        port: 48000,
        critical: false
    }
];

const processes = [];
let electronProcess = null;

async function startServices() {
    for (const service of services) {
        try {
            console.log(`🔧 Starting ${service.name}...`);
            
            const process = spawn('node', [service.file], {
                cwd: __dirname,
                stdio: 'ignore',
                detached: true
            });
            
            processes.push(process);
            console.log(`✅ ${service.name} started (PID: ${process.pid})`);
            
            // Small delay between starts
            await new Promise(resolve => setTimeout(resolve, 2000));
            
        } catch (error) {
            console.log(`❌ Failed to start ${service.name}: ${error.message}`);
        }
    }
    
    console.log(`\n📊 Started ${processes.length}/${services.length} services\n`);
}

async function testConnections() {
    console.log('🔌 Testing connections...\n');
    
    let connected = 0;
    
    for (const service of services) {
        try {
            const ws = new WebSocket(`ws://localhost:${service.port}`);
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('timeout'));
                }, 5000);
                
                ws.onopen = () => {
                    clearTimeout(timeout);
                    console.log(`✅ ${service.name} connected`);
                    connected++;
                    ws.close();
                    resolve();
                };
                
                ws.onerror = () => {
                    clearTimeout(timeout);
                    console.log(`❌ ${service.name} failed`);
                    reject();
                };
            });
            
        } catch (error) {
            console.log(`❌ ${service.name} connection failed`);
        }
    }
    
    console.log(`\n📊 Connections: ${connected}/${services.length} successful\n`);
    return connected;
}

async function launchElectron() {
    console.log('🖥️  Launching Electron Unified App...\n');
    
    console.log('📋 Available modes in the app:');
    console.log('   🖥️  Desktop Environment - Winamp-style monitoring');
    console.log('   📄 Document Processor - Transform docs to MVPs');  
    console.log('   🌀 Framework Wormhole - Integrate OSS frameworks');
    console.log('   💎 Differential Games - Extract hidden value');
    console.log('   💰 Crypto Arbitrage Terminal - Live trading data');
    console.log('   🌍 Universal Data Terminal - Everything, everywhere');
    console.log('');
    console.log('🎯 To test:');
    console.log('   1. App will open in Desktop mode');
    console.log('   2. Use Menu → Mode to switch between modes');
    console.log('   3. Try Universal Data Terminal for full experience');
    console.log('   4. Check Services → Verify All Services');
    console.log('');

    electronProcess = spawn('npm', ['run', 'electron-unified'], {
        cwd: __dirname,
        stdio: 'inherit'
    });

    electronProcess.on('close', (code) => {
        console.log(`\n📱 Electron app closed (exit code: ${code})`);
        cleanup();
    });
}

function cleanup() {
    console.log('\n🛑 Cleaning up test...');
    
    // Kill background services
    processes.forEach((process, index) => {
        try {
            process.kill();
            console.log(`🔧 Stopped service ${index + 1}`);
        } catch (error) {
            // Ignore cleanup errors
        }
    });
    
    if (electronProcess && !electronProcess.killed) {
        try {
            electronProcess.kill();
            console.log('📱 Stopped Electron app');
        } catch (error) {
            // Ignore cleanup errors
        }
    }
    
    console.log('✅ Cleanup complete');
    process.exit(0);
}

// Handle cleanup on exit
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Main test sequence
async function runTest() {
    try {
        await startServices();
        
        console.log('⏱️  Waiting 8 seconds for services to initialize...\n');
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        const connected = await testConnections();
        
        if (connected > 0) {
            console.log('✅ Services ready! Launching Electron...\n');
            await launchElectron();
        } else {
            console.log('❌ No services connected. Check for errors above.');
            cleanup();
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        cleanup();
    }
}

// Start the test
runTest();