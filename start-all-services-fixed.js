#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Import our universal HTTP client to ensure fetch works everywhere
require('./universal-http-client');

console.log('🚀 Starting all Document Generator services with fixed HTTP client...\n');

// Services to start in order
const services = [
    // Core infrastructure
    { name: 'Internal API Seeder', file: 'INTERNAL-API-SEEDER.js', port: 1503 },
    { name: 'API Connection Fixer', file: 'API-CONNECTION-FIXER.js', port: 1502 },
    
    // Auth and data layer
    { name: 'Native Auth Foundation', file: 'NATIVE-AUTH-FOUNDATION.js', port: 1337 },
    { name: 'Sovereign Database Bridge', file: 'SOVEREIGN-DATABASE-BRIDGE.js', port: 1338 },
    { name: 'Agent Employment Tax System', file: 'AGENT-EMPLOYMENT-TAX-SYSTEM.js', port: 1339 },
    { name: 'Enterprise Ecosystem Bridge', file: 'ENTERPRISE-ECOSYSTEM-BRIDGE.js', port: 1340 },
    
    // Monitoring and helpers
    { name: 'Self-Diagnostic System', file: 'SELF-DIAGNOSTIC-CLAUDE-PROMPT-SYSTEM.js', port: 1400 },
    { name: 'Proactive LLM Helper', file: 'PROACTIVE-LLM-HELPER-SERVICE.js', port: 1500 },
    
    // Gaming systems
    { name: 'Persistent Tycoon', file: 'PERSISTENT-TYCOON-COMPLETE-FIXED.js', port: 7090 },
    { name: 'Gacha Token System', file: 'GACHA-TOKEN-SYSTEM-FIXED.js', port: 7300 },
    { name: 'Debug Game Visualizer', file: 'DEBUG-GAME-VISUALIZER-FIXED.js', port: 8500 },
    
    // Knowledge systems
    { name: 'Knowledge Graph', file: 'KNOWLEDGE-GRAPH-OSS-BRIDGE.js', port: 9700 },
    { name: 'Massive Graph Builder', file: 'MASSIVE-KNOWLEDGE-GRAPH-BUILDER.js', port: 9800 },
    { name: 'BlameChain Integration', file: 'BLAMECHAIN-INTEGRATION-MASTER.js', port: 6600 }
];

const runningProcesses = [];

// Function to start a service
function startService(service, delay = 0) {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`🔧 Starting ${service.name} on port ${service.port}...`);
            
            const proc = spawn('node', [service.file], {
                cwd: __dirname,
                stdio: ['ignore', 'pipe', 'pipe'],
                detached: false
            });
            
            proc.stdout.on('data', (data) => {
                console.log(`[${service.name}] ${data.toString().trim()}`);
            });
            
            proc.stderr.on('data', (data) => {
                console.error(`[${service.name}] ERROR: ${data.toString().trim()}`);
            });
            
            proc.on('error', (err) => {
                console.error(`❌ Failed to start ${service.name}:`, err.message);
            });
            
            proc.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`⚠️ ${service.name} exited with code ${code}`);
                }
            });
            
            runningProcesses.push({ service, process: proc });
            
            // Give service time to start
            setTimeout(resolve, 1000);
        }, delay);
    });
}

// Start all services sequentially
async function startAll() {
    console.log('📦 Loading universal HTTP client...\n');
    
    for (let i = 0; i < services.length; i++) {
        await startService(services[i], i * 500); // Stagger starts by 500ms
    }
    
    console.log('\n✅ All services started!');
    console.log('📊 Dashboard: http://localhost:1502/status');
    console.log('🤖 Proactive Helper: http://localhost:1500');
    console.log('🏰 Auth Foundation: http://localhost:1337\n');
    
    // Health check after 5 seconds
    setTimeout(async () => {
        console.log('🏥 Running health check...\n');
        
        try {
            const response = await fetch('http://localhost:1502/status');
            const status = await response.json();
            
            console.log('Service Status:');
            for (const [key, service] of Object.entries(status)) {
                console.log(`${service.status === 'online' ? '✅' : '❌'} ${service.name}: ${service.status}`);
            }
        } catch (err) {
            console.error('❌ Health check failed:', err.message);
        }
    }, 5000);
}

// Handle shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down all services...');
    
    runningProcesses.forEach(({ service, process }) => {
        console.log(`Stopping ${service.name}...`);
        process.kill('SIGTERM');
    });
    
    setTimeout(() => {
        process.exit(0);
    }, 2000);
});

// Start everything
startAll().catch(console.error);