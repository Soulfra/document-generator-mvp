#!/usr/bin/env node

/**
 * 🔍 SYSTEM STATUS CHECK
 * Verify all services are running and accessible
 */

const http = require('http');

const services = {
    'Mobile Interface (New)': { port: 3333, path: '/' },
    'Forum System': { port: 5555, path: '/' },
    'NPC Monitor': { port: 54322, path: '/' },
    'Game World': { port: 8889, path: '/' },
    'Unified Dashboard': { port: 7890, path: '/' },
    'Packet Capture': { port: 54324, path: '/' }
};

async function checkService(name, config) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: config.port,
            path: config.path,
            method: 'GET',
            timeout: 2000
        };
        
        const req = http.request(options, (res) => {
            resolve({
                name,
                status: 'online',
                statusCode: res.statusCode,
                url: `http://localhost:${config.port}`
            });
        });
        
        req.on('error', () => {
            resolve({
                name,
                status: 'offline',
                statusCode: null,
                url: `http://localhost:${config.port}`
            });
        });
        
        req.on('timeout', () => {
            resolve({
                name,
                status: 'timeout',
                statusCode: null,
                url: `http://localhost:${config.port}`
            });
        });
        
        req.end();
    });
}

async function checkAllServices() {
    console.log('🔍 SYSTEM STATUS CHECK');
    console.log('=====================');
    console.log('');
    
    const results = [];
    
    for (const [name, config] of Object.entries(services)) {
        const result = await checkService(name, config);
        results.push(result);
        
        const icon = result.status === 'online' ? '✅' : '❌';
        const statusInfo = result.statusCode ? ` (${result.statusCode})` : '';
        console.log(`${icon} ${name}: ${result.status}${statusInfo}`);
        console.log(`   URL: ${result.url}`);
        console.log('');
    }
    
    const onlineCount = results.filter(r => r.status === 'online').length;
    const totalCount = results.length;
    
    console.log('📊 SUMMARY');
    console.log('==========');
    console.log(`Services Online: ${onlineCount}/${totalCount}`);
    console.log(`Success Rate: ${Math.round((onlineCount/totalCount) * 100)}%`);
    console.log('');
    
    if (onlineCount === totalCount) {
        console.log('🎉 ALL SYSTEMS OPERATIONAL!');
        console.log('');
        console.log('🚀 Quick Access:');
        console.log('📱 Mobile Interface: http://localhost:3333');
        console.log('🗣️ Forums: http://localhost:5555');
        console.log('🎮 Game: http://localhost:8889');
        console.log('📊 Monitor: http://localhost:54322');
    } else {
        console.log('⚠️ Some services are offline. Check the logs above.');
    }
}

checkAllServices().catch(console.error);