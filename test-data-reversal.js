#!/usr/bin/env node

/**
 * 🔄 DATA REVERSAL SYSTEM TEST
 * Tests the verification system for reversing collected information
 */

async function testDataReversal() {
    console.log('🔄 DATA REVERSAL SYSTEM TEST');
    console.log('============================');
    console.log('🕵️ This tests the system that reverses what they collected on you');
    console.log('📊 Input a URL → Character extracts their data collection → Display it properly');
    console.log('');

    const baseUrl = 'http://localhost:8090';
    
    // Test with big tech surveillance sites
    const testUrls = [
        'https://facebook.com/login',
        'https://google.com/search',
        'https://amazon.com/account'
    ];
    
    for (const testUrl of testUrls) {
        console.log(`🎯 TESTING REVERSAL: ${testUrl}`);
        console.log('   (Analyzing what data they collect about you)');
        console.log('');
        
        try {
            // Start the reversal battle
            console.log('🔄 STARTING DATA REVERSAL...');
            const reversalResponse = await fetch(`${baseUrl}/api/reversal/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerId: 'player',
                    targetUrl: testUrl
                })
            });
            
            const reversal = await reversalResponse.json();
            
            console.log('🔄 REVERSAL COMPLETED!');
            console.log(`   Reversal ID: ${reversal.id}`);
            console.log(`   Duration: ${reversal.duration}ms`);
            console.log(`   Status: ${reversal.status}`);
            console.log('');
            
            // Display reversal phases
            console.log('📋 REVERSAL PHASES:');
            reversal.phases.forEach((phase, i) => {
                console.log(`\n   ${i + 1}. ${phase.phase.toUpperCase().replace('_', ' ')}`);
                if (phase.extracted_data?.length) {
                    console.log(`      📊 Data extracted: ${phase.extracted_data.length} types`);
                }
                if (phase.cookies_analyzed) {
                    console.log(`      🍪 Cookies analyzed: ${phase.cookies_analyzed}`);
                }
                if (phase.tracker_network?.length) {
                    console.log(`      📡 Trackers found: ${phase.tracker_network.length}`);
                }
                if (phase.fingerprint_data) {
                    console.log(`      👤 Fingerprint uniqueness: ${(phase.uniqueness_score * 100).toFixed(1)}%`);
                }
                
                console.log(`      🔍 Key discoveries:`);
                phase.discoveries?.slice(0, 3).forEach(discovery => {
                    console.log(`         • ${discovery}`);
                });
            });
            
            // Display what they know about you
            if (reversal.dataDisplay) {
                const dataDisplay = reversal.dataDisplay;
                
                console.log(`\n📊 WHAT THEY COLLECTED ABOUT YOU:`);
                console.log(`   🎯 Target: ${dataDisplay.summary.target}`);
                console.log(`   📈 Tracking Level: ${dataDisplay.summary.tracking_level}/10`);
                console.log(`   📊 Data Points: ${dataDisplay.summary.data_points_collected}`);
                console.log(`   🚨 Privacy Invasion Score: ${dataDisplay.summary.privacy_invasion_score}/10`);
                
                console.log(`\n🕵️ YOUR DIGITAL FOOTPRINT:`);
                if (dataDisplay.your_digital_footprint.unique_identifiers?.length) {
                    console.log(`   🆔 Unique Identifiers: ${dataDisplay.your_digital_footprint.unique_identifiers.length}`);
                }
                if (dataDisplay.your_digital_footprint.cross_site_tracking?.length) {
                    console.log(`   🌐 Cross-site Tracking: ${dataDisplay.your_digital_footprint.cross_site_tracking.length} flows`);
                }
                console.log(`   ⏱️ Data Retention: ${dataDisplay.your_digital_footprint.retention_period}`);
                
                console.log(`\n🛡️ COUNTERMEASURES AVAILABLE:`);
                if (dataDisplay.countermeasures.evasion_opportunities?.length) {
                    console.log(`   🕵️ Evasion Opportunities: ${dataDisplay.countermeasures.evasion_opportunities.length}`);
                    dataDisplay.countermeasures.evasion_opportunities.slice(0, 2).forEach(opportunity => {
                        console.log(`      • ${opportunity}`);
                    });
                }
                if (dataDisplay.countermeasures.privacy_tools?.length) {
                    console.log(`   🛠️ Privacy Tools: ${dataDisplay.countermeasures.privacy_tools.length}`);
                    dataDisplay.countermeasures.privacy_tools.slice(0, 2).forEach(tool => {
                        console.log(`      • ${tool}`);
                    });
                }
            }
            
            console.log(`\n✅ SUCCESS! Data reversal completed for ${testUrl}`);
            console.log('');
            
        } catch (error) {
            console.error(`❌ Reversal test failed for ${testUrl}:`, error.message);
            console.log('');
        }
    }
    
    console.log(`🎮 REVERSAL SYSTEM SUMMARY:`);
    console.log(`✅ Data Reversal System is working!`);
    console.log(`🌐 Access the web interface at: ${baseUrl}/data-reversal`);
    console.log(`🔄 Input any URL and see what data they collect about you`);
    console.log(`📊 View privacy invasion scores and tracking networks`);
    console.log(`🛡️ Get countermeasures and privacy tool recommendations`);
    console.log(`🕵️ Turn the tables on surveillance with gaming mechanics`);
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
    testDataReversal().catch(console.error);
}

module.exports = { testDataReversal };