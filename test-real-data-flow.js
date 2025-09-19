#!/usr/bin/env node

/**
 * TEST REAL DATA FLOW
 * Verifies that real data is flowing between all components
 */

const http = require('http');
const WebSocket = require('ws');

console.log('🔍 TESTING REAL DATA FLOW...\n');

const tests = {
    dataOracle: false,
    tickerTape: false,
    grandExchange: false,
    cryptoAggregator: false,
    tickerLogger: false
};

// Test 1: Data Oracle API
function testDataOracle() {
    console.log('1️⃣ Testing Real-Time Data Oracle...');
    
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/price/btc?userId=test_user&tier=premium',
        method: 'GET'
    };
    
    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (result.price && result.quality) {
                    console.log(`   ✅ BTC Price: $${result.price.toLocaleString()} (${result.quality})`);
                    tests.dataOracle = true;
                } else {
                    console.log('   ❌ No real price data received');
                }
            } catch (e) {
                console.log('   ❌ Failed to parse response');
            }
        });
    });
    
    req.on('error', () => {
        console.log('   ❌ Data Oracle not responding');
    });
    
    req.end();
}

// Test 2: Ticker Tape
function testTickerTape() {
    console.log('\n2️⃣ Testing Real-Time Ticker Tape...');
    
    const options = {
        hostname: 'localhost',
        port: 3335,
        path: '/api/ticker/data',
        method: 'GET'
    };
    
    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const result = JSON.parse(data);
                const tickers = Object.keys(result);
                if (tickers.length > 0) {
                    console.log(`   ✅ Active tickers: ${tickers.join(', ')}`);
                    tests.tickerTape = true;
                } else {
                    console.log('   ⚠️  No active tickers');
                }
            } catch (e) {
                console.log('   ❌ Failed to parse response');
            }
        });
    });
    
    req.on('error', () => {
        console.log('   ❌ Ticker Tape not responding');
    });
    
    req.end();
}

// Test 3: Grand Exchange
function testGrandExchange() {
    console.log('\n3️⃣ Testing Grand Exchange Real Data...');
    
    const options = {
        hostname: 'localhost',
        port: 9600,
        path: '/api/ge/items',
        method: 'GET'
    };
    
    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (result.dataSource === 'real_time_oracle' && result.items.length > 0) {
                    const realItems = result.items.filter(item => item.dataQuality === 'realtime');
                    console.log(`   ✅ ${realItems.length} items with real-time prices`);
                    console.log(`   💰 Bitcoin Ore: $${result.items[0]?.price?.toLocaleString() || 'N/A'}`);
                    tests.grandExchange = true;
                } else {
                    console.log('   ❌ No real data found');
                }
            } catch (e) {
                console.log('   ❌ Failed to parse response');
            }
        });
    });
    
    req.on('error', () => {
        console.log('   ❌ Grand Exchange not responding');
    });
    
    req.end();
}

// Test 4: Crypto Aggregator WebSocket
function testCryptoAggregator() {
    console.log('\n4️⃣ Testing Crypto Data Aggregator...');
    
    const ws = new WebSocket('ws://localhost:47003');
    let timeout = setTimeout(() => {
        console.log('   ❌ WebSocket connection timeout');
        ws.close();
    }, 5000);
    
    ws.on('open', () => {
        console.log('   ✅ Connected to aggregator');
    });
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            if (message.type === 'init') {
                console.log(`   ✅ Sources: ${message.sources.join(', ')}`);
                tests.cryptoAggregator = true;
                clearTimeout(timeout);
                ws.close();
            } else if (message.type === 'price_update_aggregated') {
                console.log(`   ✅ Received aggregated prices from ${message.dataQuality}`);
            }
        } catch (e) {
            console.log('   ❌ Failed to parse message');
        }
    });
    
    ws.on('error', () => {
        console.log('   ❌ Crypto Aggregator not responding');
        clearTimeout(timeout);
    });
}

// Test 5: Ticker Logger
function testTickerLogger() {
    console.log('\n5️⃣ Testing Ticker Tape Logger...');
    
    const options = {
        hostname: 'localhost',
        port: 8888,
        path: '/',
        method: 'GET'
    };
    
    const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
            console.log('   ✅ Ticker Logger UI accessible');
            tests.tickerLogger = true;
        } else {
            console.log('   ❌ Ticker Logger returned error');
        }
    });
    
    req.on('error', () => {
        console.log('   ❌ Ticker Logger not responding');
    });
    
    req.end();
}

// Test WebSocket price flow
function testPriceFlow() {
    console.log('\n6️⃣ Testing Real-Time Price Flow...');
    
    const tickerWs = new WebSocket('ws://localhost:3336');
    const exchangeWs = new WebSocket('ws://localhost:9601');
    
    let tickerConnected = false;
    let exchangeConnected = false;
    
    tickerWs.on('open', () => {
        tickerConnected = true;
        tickerWs.send(JSON.stringify({
            type: 'authenticate',
            userId: 'test_user'
        }));
    });
    
    tickerWs.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'price_update') {
            console.log('   ✅ Ticker Tape receiving real prices');
            tickerWs.close();
        }
    });
    
    exchangeWs.on('open', () => {
        exchangeConnected = true;
        console.log('   ✅ Grand Exchange WebSocket connected');
    });
    
    exchangeWs.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'price_updates') {
            console.log('   ✅ Grand Exchange broadcasting real prices');
            exchangeWs.close();
        }
    });
    
    setTimeout(() => {
        if (!tickerConnected) console.log('   ❌ Ticker WebSocket failed');
        if (!exchangeConnected) console.log('   ❌ Exchange WebSocket failed');
        tickerWs.close();
        exchangeWs.close();
    }, 5000);
}

// Run all tests
async function runTests() {
    testDataOracle();
    
    setTimeout(() => {
        testTickerTape();
    }, 1000);
    
    setTimeout(() => {
        testGrandExchange();
    }, 2000);
    
    setTimeout(() => {
        testCryptoAggregator();
    }, 3000);
    
    setTimeout(() => {
        testTickerLogger();
    }, 4000);
    
    setTimeout(() => {
        testPriceFlow();
    }, 5000);
    
    // Summary
    setTimeout(() => {
        console.log('\n📊 TEST SUMMARY:');
        console.log('================');
        let passed = 0;
        let total = Object.keys(tests).length;
        
        for (const [component, status] of Object.entries(tests)) {
            console.log(`${status ? '✅' : '❌'} ${component}`);
            if (status) passed++;
        }
        
        console.log(`\nPassed: ${passed}/${total}`);
        
        if (passed === total) {
            console.log('\n🎉 ALL SYSTEMS OPERATIONAL WITH REAL DATA!');
        } else {
            console.log('\n⚠️  Some components not working. Run ./launch-real-trading-system.sh first');
        }
        
        process.exit(0);
    }, 10000);
}

runTests();