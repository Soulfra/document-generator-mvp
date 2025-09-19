#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const systems = [
    { name: 'Soulfra Multiverse', file: 'soulfra-xml-multiverse-engine.js', port: 7881 },
    { name: 'Tutorial Island', file: 'tutorial-island-observer.js', port: 7892 },
    { name: 'Dungeon Master', file: 'dungeon-master-orchestrator.js', port: 7904 },
    { name: 'Language Dissector', file: 'universal-language-dissector.js', port: 7900 },
    { name: 'Emoji Transformer', file: 'emoji-color-code-transformer.js', port: 7902 },
    { name: 'Agent Orchestrator', file: 'agent-onboarding-commission-orchestrator.js', port: 7906 },
    { name: 'Whisper-XML Bridge', file: 'whisper-xml-bridge.js', port: 7908 }
];

console.log('🚀 Starting Document Generator Ecosystem...\n');

function startSystem(system) {
    return new Promise((resolve) => {
        const filePath = path.join(__dirname, system.file);
        
        if (!fs.existsSync(filePath)) {
            console.log(`❌ ${system.name}: File not found`);
            resolve(false);
            return;
        }

        const process = spawn('node', [system.file], {
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: false
        });

        let started = false;
        const timeout = setTimeout(() => {
            if (!started) {
                console.log(`⏰ ${system.name}: Starting (port ${system.port})`);
                started = true;
                resolve(true);
            }
        }, 2000);

        process.stdout.on('data', (data) => {
            if (!started && data.toString().includes('running on')) {
                console.log(`✅ ${system.name}: Online (port ${system.port})`);
                clearTimeout(timeout);
                started = true;
                resolve(true);
            }
        });

        process.stderr.on('data', (data) => {
            const error = data.toString();
            if (error.includes('EADDRINUSE')) {
                console.log(`🔄 ${system.name}: Port ${system.port} already in use`);
                clearTimeout(timeout);
                started = true;
                resolve(true);
            }
        });

        process.on('error', (err) => {
            console.log(`❌ ${system.name}: ${err.message}`);
            clearTimeout(timeout);
            resolve(false);
        });
    });
}

async function startEcosystem() {
    let onlineCount = 0;
    
    for (const system of systems) {
        const success = await startSystem(system);
        if (success) onlineCount++;
        
        // Small delay between starts
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n🌐 Ecosystem Status: ${onlineCount}/${systems.length} systems online`);
    console.log('📊 Dashboard: http://localhost:8080/public/');
    console.log('🤝 Agent Orchestrator: http://localhost:7906');
    console.log('\n💡 If systems show as "already in use", they\'re running from before');
}

startEcosystem().catch(console.error);