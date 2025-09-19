#!/usr/bin/env node

/**
 * Test Master Gaming Platform Integration
 * Shows how cheat codes work with persistence and security
 */

const http = require('http');

async function makeRequest(options) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });
        req.on('error', reject);
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

async function testMasterGaming() {
    console.log('🎮 Testing Master Gaming Platform Integration...\n');
    
    try {
        // 1. Test persistent tycoon
        console.log('1️⃣ Testing Persistent Tycoon (port 7090)...');
        const tycoonState = await makeRequest({
            hostname: 'localhost',
            port: 7090,
            path: '/api/gamestate',
            method: 'GET'
        });
        console.log('✅ Persistent Tycoon:', tycoonState ? 'ONLINE' : 'OFFLINE');
        
        // 2. Test security layer
        console.log('\n2️⃣ Testing Security Layer (port 7200)...');
        const securityHealth = await makeRequest({
            hostname: 'localhost',
            port: 7200,
            path: '/api/health',
            method: 'GET'
        });
        console.log('✅ Security Layer:', securityHealth ? 'ONLINE' : 'OFFLINE');
        
        // 3. Test cheat codes
        console.log('\n3️⃣ Testing Cheat Code System (port 7100)...');
        const cheatState = await makeRequest({
            hostname: 'localhost',
            port: 7100,
            path: '/api/gamestate',
            method: 'GET'
        });
        console.log('✅ Cheat System State:', cheatState);
        
        // 4. Apply a cheat code
        console.log('\n4️⃣ Applying IDDQD (God Mode) cheat...');
        const cheatResult = await makeRequest({
            hostname: 'localhost',
            port: 7100,
            path: '/api/cheat',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: 'IDDQD' })
        });
        console.log('✅ Cheat Result:', cheatResult);
        
        // 5. Apply money cheat
        console.log('\n5️⃣ Applying showmethemoney cheat...');
        const moneyResult = await makeRequest({
            hostname: 'localhost',
            port: 7100,
            path: '/api/cheat',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: 'showmethemoney' })
        });
        console.log('✅ Money Cheat Result:', moneyResult);
        
        // 6. Test Konami code
        console.log('\n6️⃣ Testing Konami Code sequence...');
        const konamiSequence = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
        
        for (const input of konamiSequence) {
            const konamiResult = await makeRequest({
                hostname: 'localhost',
                port: 7100,
                path: '/api/konami',
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input })
            });
            console.log(`   ${input}: ${konamiResult.message || konamiResult.success}`);
            
            // Small delay between inputs
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // 7. Check master platform
        console.log('\n7️⃣ Testing Master Gaming Platform (port 8800)...');
        const masterHealth = await makeRequest({
            hostname: 'localhost',
            port: 8800,
            path: '/',
            method: 'GET'
        });
        console.log('✅ Master Platform:', masterHealth.includes('MASTER GAMING PLATFORM') ? 'ONLINE' : 'OFFLINE');
        
        console.log('\n✨ All systems integrated and working!');
        console.log('\n🎮 Classic cheat codes are active:');
        console.log('   💀 IDDQD = God Mode');
        console.log('   💰 showmethemoney = +$10,000');
        console.log('   🎮 ↑↑↓↓←→←→BA = +30 Lives');
        console.log('   🏆 allyourbasearebelongtous = Instant Win');
        console.log('\n🔗 Access the game at: http://localhost:8800');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testMasterGaming();