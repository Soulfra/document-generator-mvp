#!/usr/bin/env node

/**
 * 🎮 URL BOSS BATTLE TEST
 * Demonstrates the actual gaming interface for URL analysis
 */

async function testURLBattle() {
    console.log('⚔️ URL BOSS BATTLE TEST');
    console.log('========================');
    console.log('🎮 This demonstrates the gaming interface for URL analysis');
    console.log('📱 Input a URL → Character battles through layers → AI collaboration → Talking points');
    console.log('');

    const baseUrl = 'http://localhost:8090';
    
    // Test with a suspicious URL
    const testUrl = 'https://secure-bank-update.tk/verify-account?urgent=true';
    
    console.log(`🎯 TESTING WITH: ${testUrl}`);
    console.log('   (This is a simulated phishing URL with multiple red flags)');
    console.log('');
    
    try {
        // Start the battle
        console.log('🚀 STARTING BATTLE...');
        const battleResponse = await fetch(`${baseUrl}/api/battle/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId: 'player',
                targetUrl: testUrl
            })
        });
        
        const battle = await battleResponse.json();
        
        console.log('⚔️ BATTLE COMPLETED!');
        console.log(`   Battle ID: ${battle.id}`);
        console.log(`   Duration: ${battle.duration}ms`);
        console.log(`   Status: ${battle.status}`);
        console.log('');
        
        // Display battle phases
        console.log('📋 BATTLE PHASES:');
        battle.layers.forEach((layer, i) => {
            console.log(`\n   ${i + 1}. ${layer.phase.toUpperCase().replace('_', ' ')}`);
            console.log(`      💥 Damage dealt: ${layer.damage_dealt}`);
            console.log(`      🔍 Key discoveries:`);
            layer.discoveries?.slice(0, 3).forEach(discovery => {
                console.log(`         • ${discovery}`);
            });
        });
        
        console.log(`\n👹 BOSS STATUS:`);
        console.log(`   Final HP: ${battle.boss.hp}/1000`);
        console.log(`   Victory: ${battle.boss.hp <= 0 ? '🏆 YES' : '❌ NO'}`);
        
        // Display anomalies found
        console.log(`\n🚨 ANOMALIES DETECTED: ${battle.anomalies.length}`);
        battle.anomalies.forEach(anomaly => {
            console.log(`   • ${anomaly.type}: ${anomaly.description}`);
            console.log(`     Severity: ${anomaly.severity} | Confidence: ${(anomaly.confidence * 100).toFixed(1)}%`);
        });
        
        // Display AI collaboration
        console.log(`\n🤖 AI COLLABORATION:`);
        battle.aiAssistance?.insights?.slice(0, 4).forEach(insight => {
            console.log(`   • ${insight}`);
        });
        
        // Display talking points for other layers
        console.log(`\n📝 TALKING POINTS FOR OTHER LAYERS:`);
        console.log(`   🎯 Risk Level: ${battle.talkingPoints.executive_summary.risk_level}`);
        console.log(`   📊 Recommendation: ${battle.talkingPoints.executive_summary.recommendation}`);
        console.log(`   ⚡ Immediate Actions:`);
        battle.talkingPoints.next_actions.immediate.forEach(action => {
            console.log(`      • ${action}`);
        });
        
        console.log(`\n🎮 GAMING MECHANICS SUMMARY:`);
        console.log(`   • Character Level: ${battle.character.level}`);
        console.log(`   • Abilities Used: ${getAbilitiesUsed(battle).join(', ')}`);
        console.log(`   • Total Damage: ${getTotalDamage(battle)}`);
        console.log(`   • Wormholes Created: ${getWormholesCreated(battle)}`);
        console.log(`   • Tiles Accessed: ${getTilesAccessed(battle)}`);
        
        console.log(`\n✅ SUCCESS! The URL battle system is working!`);
        console.log(`🌐 Access the web interface at: ${baseUrl}/url-battle`);
        console.log(`🎮 Input any URL and your character will battle it through deep layers`);
        console.log(`🤖 AI collaboration provides insights for anomaly detection`);
        console.log(`📋 Talking points are generated for integration with other systems`);
        
        return battle;
        
    } catch (error) {
        console.error('❌ Battle test failed:', error.message);
        console.log('🔧 Make sure the server is running on port 8090');
        return null;
    }
}

function getAbilitiesUsed(battle) {
    const abilities = [];
    battle.layers.forEach(layer => {
        layer.actions?.forEach(action => {
            if (action.includes('Character uses')) {
                const ability = action.replace('Character uses ', '');
                if (!abilities.includes(ability)) abilities.push(ability);
            }
        });
    });
    return abilities.length > 0 ? abilities : ['Basic Scan'];
}

function getTotalDamage(battle) {
    return battle.layers.reduce((total, layer) => total + (layer.damage_dealt || 0), 0);
}

function getWormholesCreated(battle) {
    return battle.layers.reduce((total, layer) => total + (layer.wormholes_created || 0), 0);
}

function getTilesAccessed(battle) {
    return battle.layers.reduce((total, layer) => total + (layer.tiles_accessed || 0), 0);
}

// Polyfill fetch for Node.js
if (typeof fetch === 'undefined') {
    global.fetch = function(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = require('http');
            
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: options.headers || {}
            };
            
            const req = client.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        json: () => Promise.resolve(JSON.parse(data)),
                        text: () => Promise.resolve(data),
                        ok: res.statusCode >= 200 && res.statusCode < 300
                    });
                });
            });
            
            req.on('error', reject);
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    };
}

// Run the test
if (require.main === module) {
    testURLBattle().catch(console.error);
}

module.exports = { testURLBattle };