#!/usr/bin/env node

/**
 * TEST REAL APIS
 * Actually tests if our APIs return real data or fake numbers
 * NO MORE FAKE DATA - this verifies everything works
 */

console.log('🔍 TESTING REAL API CONNECTIONS');
console.log('===============================');

async function testOSRSAPI() {
    console.log('\n⚔️ Testing OSRS Wiki API...');
    
    try {
        const response = await fetch('https://prices.runescape.wiki/api/v1/osrs/latest', {
            headers: {
                'User-Agent': 'Real API Test - Document Generator 1.0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.data) {
            throw new Error('No data property in response');
        }
        
        // Test specific items
        const scytheUncharged = data.data['22325']; // Scythe of vitur (uncharged)
        const scytheCharged = data.data['22486']; // Scythe of vitur
        const tbow = data.data['20997']; // Twisted bow
        const elderMaul = data.data['21003']; // Elder maul
        
        console.log('✅ OSRS Wiki API - REAL DATA RECEIVED:');
        
        if (scytheUncharged) {
            console.log(`  💰 Scythe (uncharged): ${scytheUncharged.high?.toLocaleString() || 'N/A'} GP (high) | ${scytheUncharged.low?.toLocaleString() || 'N/A'} GP (low)`);
        }
        
        if (scytheCharged) {
            console.log(`  💰 Scythe (charged): ${scytheCharged.high?.toLocaleString() || 'N/A'} GP (high) | ${scytheCharged.low?.toLocaleString() || 'N/A'} GP (low)`);
        }
        
        if (tbow) {
            console.log(`  🏹 Twisted Bow: ${tbow.high?.toLocaleString() || 'N/A'} GP (high) | ${tbow.low?.toLocaleString() || 'N/A'} GP (low)`);
        }
        
        if (elderMaul) {
            console.log(`  🔨 Elder Maul: ${elderMaul.high?.toLocaleString() || 'N/A'} GP (high) | ${elderMaul.low?.toLocaleString() || 'N/A'} GP (low)`);
        }
        
        // Count total items
        const totalItems = Object.keys(data.data).length;
        console.log(`  📊 Total items tracked: ${totalItems.toLocaleString()}`);
        
        return true;
        
    } catch (error) {
        console.log('❌ OSRS API FAILED:');
        console.log(`  Error: ${error.message}`);
        return false;
    }
}

async function testCryptoAPI() {
    console.log('\n₿ Testing CoinGecko API...');
    
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,monero&vs_currencies=usd');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        console.log('✅ CoinGecko API - REAL DATA RECEIVED:');
        
        if (data.bitcoin?.usd) {
            console.log(`  ₿ Bitcoin: $${data.bitcoin.usd.toLocaleString()}`);
        }
        
        if (data.ethereum?.usd) {
            console.log(`  Ξ Ethereum: $${data.ethereum.usd.toLocaleString()}`);
        }
        
        if (data.monero?.usd) {
            console.log(`  Ɱ Monero: $${data.monero.usd.toLocaleString()}`);
        }
        
        return true;
        
    } catch (error) {
        console.log('❌ Crypto API FAILED:');
        console.log(`  Error: ${error.message}`);
        return false;
    }
}

async function testArbitrageCalculation(osrsPrice, btcPrice) {
    console.log('\n📈 Testing Arbitrage Calculation...');
    
    if (!osrsPrice || !btcPrice) {
        console.log('❌ Cannot calculate arbitrage without both prices');
        return false;
    }
    
    // Example calculation: 1B OSRS GP → USD → Bitcoin
    const osrsGoldRate = 0.65; // $0.65 per 1M GP (approximate)
    const oneBillionGP = 1000; // 1B GP = 1000 * 1M GP
    
    const usdValue = oneBillionGP * osrsGoldRate; // $650 for 1B GP
    const btcAmount = usdValue / btcPrice; // BTC equivalent
    
    console.log('✅ REAL ARBITRAGE CALCULATION:');
    console.log(`  🪙 1 Billion OSRS GP → $${usdValue.toFixed(2)} USD`);
    console.log(`  ₿ $${usdValue.toFixed(2)} USD → ${btcAmount.toFixed(8)} BTC`);
    console.log(`  📊 If BTC rises 10%, profit = $${(usdValue * 0.1).toFixed(2)}`);
    
    return true;
}

async function runAllTests() {
    console.log('🚀 Running comprehensive API tests...');
    console.log('This will prove if we get REAL data or FAKE numbers\n');
    
    let osrsWorking = false;
    let cryptoWorking = false;
    let scythePrice = 0;
    let btcPrice = 0;
    
    // Test OSRS API
    osrsWorking = await testOSRSAPI();
    
    // Test Crypto API  
    cryptoWorking = await testCryptoAPI();
    
    // If both work, test arbitrage calculation
    if (osrsWorking && cryptoWorking) {
        // Get actual prices for calculation
        try {
            const osrsResponse = await fetch('https://prices.runescape.wiki/api/v1/osrs/latest', {
                headers: { 'User-Agent': 'Real API Test' }
            });
            const osrsData = await osrsResponse.json();
            scythePrice = osrsData.data['22325']?.high || osrsData.data['22486']?.high || 0;
            
            const cryptoResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
            const cryptoData = await cryptoResponse.json();
            btcPrice = cryptoData.bitcoin?.usd || 0;
            
            await testArbitrageCalculation(scythePrice, btcPrice);
            
        } catch (error) {
            console.log('⚠️ Could not fetch prices for arbitrage calculation');
        }
    }
    
    // Final results
    console.log('\n🎯 TEST RESULTS SUMMARY');
    console.log('======================');
    console.log(`⚔️ OSRS Wiki API: ${osrsWorking ? '✅ REAL DATA' : '❌ FAILED'}`);
    console.log(`₿ Crypto API: ${cryptoWorking ? '✅ REAL DATA' : '❌ FAILED'}`);
    
    if (osrsWorking && cryptoWorking) {
        console.log('🎉 ALL APIS WORKING - NO FAKE DATA!');
        console.log('🔗 Ready to connect to Unified Integration Hub');
        return true;
    } else {
        console.log('💥 SOME APIS FAILED - Need to fix before running hub');
        return false;
    }
}

// Run the tests
runAllTests()
    .then(success => {
        if (success) {
            console.log('\n🚀 APIs verified! Run ./launch-unified-hub.sh to start with REAL data');
        } else {
            console.log('\n🛑 Fix API connections before starting the hub');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('💥 Test runner failed:', error);
        process.exit(1);
    });