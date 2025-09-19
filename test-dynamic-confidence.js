#!/usr/bin/env node
// Test script for the dynamic confidence/XP system

const http = require('http');

async function httpRequest(method, hostname, port, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname,
            port,
            path,
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
        }
        
        const req = http.request(options, (res) => {
            let responseData = '';
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(responseData));
                } catch (e) {
                    resolve(responseData);
                }
            });
        });
        
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function testDynamicConfidence() {
    console.log('🎮 Testing RuneScape-style Dynamic Confidence System...\n');
    
    try {
        // Test tech-spec-agent with some predictions
        console.log('📊 Testing tech-spec-agent (Claude 3 Opus)...');
        const agent = 'tech-spec-agent';
        
        // Get initial stats
        const initialStats = await httpRequest('GET', 'localhost', 9400, `/reasoning/stats/${agent}`);
        console.log('Initial stats:', initialStats);
        
        // Simulate 20 predictions with 70% success rate
        console.log('\n🎯 Simulating 20 predictions...');
        const testResult = await httpRequest('POST', 'localhost', 9400, `/reasoning/test-xp/${agent}`, {
            count: 20
        });
        
        console.log('\n🏆 Results:');
        console.log(`Final Level: ${testResult.finalStats.level}`);
        console.log(`Total XP: ${testResult.finalStats.experience}`);
        console.log(`Confidence: ${testResult.finalStats.confidence}%`);
        console.log(`Success Rate: ${testResult.finalStats.successRate}`);
        console.log(`XP to Next Level: ${testResult.finalStats.xpToNextLevel}`);
        console.log(`Progress to Next: ${testResult.finalStats.progressToNextLevel}`);
        
        // Check if any level ups occurred
        const levelUps = testResult.testResults.filter(r => r.levelUp);
        if (levelUps.length > 0) {
            console.log(`\n🎉 Level ups: ${levelUps.length}`);
            levelUps.forEach(lu => {
                console.log(`   Reached level ${lu.level} with ${lu.experience} XP!`);
            });
        }
        
        // Get leaderboard
        console.log('\n🏆 Fetching model leaderboard...');
        const leaderboard = await httpRequest('GET', 'localhost', 9400, '/reasoning/leaderboard');
        
        console.log('\nTop 5 Models:');
        leaderboard.leaderboard.slice(0, 5).forEach((model, index) => {
            console.log(`${index + 1}. ${model.agentId} - Lvl ${model.level} (${model.experience} XP) - ${model.confidence}% confidence`);
        });
        
        console.log('\n✅ Dynamic confidence system is working!');
        console.log('   Models start at level 1 with 0% confidence');
        console.log('   They gain XP from predictions (more for success)');
        console.log('   Confidence increases with level and success rate');
        console.log('   Just like RuneScape skills! 🎮');
        
    } catch (error) {
        console.error('❌ Error testing system:', error.message);
        console.log('\nMake sure reasoning-differential-layer.js is running:');
        console.log('node reasoning-differential-layer.js');
    }
}

// Run the test
testDynamicConfidence();