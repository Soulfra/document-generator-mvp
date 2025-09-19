#!/usr/bin/env node
// TERMINAL-CLIENT.js - Send packets from terminal

const WebSocket = require('ws');
const readline = require('readline');

const ws = new WebSocket('ws://localhost:5555');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('💻 TERMINAL CLIENT');
console.log('==================');

ws.on('open', () => {
    console.log('✅ Connected to Digital Post Office');
    console.log('📤 Type messages to send (or "quit" to exit)\n');
    
    prompt();
});

ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.type === 'incoming') {
        console.log(`\n📬 INCOMING from ${msg.packet.from}:`);
        console.log(JSON.stringify(msg.data, null, 2));
        prompt();
    }
});

ws.on('close', () => {
    console.log('❌ Disconnected');
    process.exit(0);
});

function prompt() {
    rl.question('Message> ', (message) => {
        if (message === 'quit') {
            ws.close();
            rl.close();
            return;
        }
        
        const packet = {
            id: Math.random().toString(36).substr(2, 9),
            from: 'terminal',
            to: 'broadcast',
            timestamp: Date.now(),
            envelope: Buffer.from(JSON.stringify({ 
                message, 
                type: 'terminal-message' 
            })).toString('base64'),
            checksum: 'auto'
        };
        
        ws.send(JSON.stringify(packet));
        console.log('📤 Sent!');
        prompt();
    });
}