#!/usr/bin/env node

// Live Crypto Differential Test - Bloomberg/Citadel Style Terminal
// Tests real-time ETH/BTC/XMR arbitrage across Kraken, Coinbase, Binance

const { spawn } = require('child_process');
const WebSocket = require('ws');

console.log('💰 LIVE CRYPTO DIFFERENTIAL TEST');
console.log('=================================\n');

console.log('🚀 Starting crypto differential engine...');

// Start the REAL crypto engine with live market data
const cryptoEngine = spawn('node', ['real-crypto-differential-engine.js'], {
    cwd: __dirname,
    stdio: 'inherit'
});

console.log('⏱️  Waiting 5 seconds for engine to connect to exchanges...\n');

setTimeout(() => {
    console.log('📊 Testing WebSocket connection...');
    
    // Test connection to crypto engine
    const ws = new WebSocket('ws://localhost:47002');
    
    ws.on('open', () => {
        console.log('✅ Connected to crypto differential engine');
        console.log('📡 Receiving live data from:');
        console.log('   • Kraken (BTC/ETH/XMR)');
        console.log('   • Coinbase Pro (BTC/ETH/XMR)');
        console.log('   • Binance (BTC/ETH/XMR)');
        console.log('');
        console.log('🎯 Looking for arbitrage opportunities > 0.1%');
        console.log('');
        
        let messageCount = 0;
        let opportunities = 0;
        
        ws.on('message', (data) => {
            const parsed = JSON.parse(data);
            messageCount++;
            
            switch (parsed.type) {
                case 'price_update':
                    console.log(`📈 ${parsed.exchange.toUpperCase()} prices updated`);
                    if (parsed.prices.BTC > 0) {
                        console.log(`   BTC: $${parsed.prices.BTC.toLocaleString()}`);
                    }
                    if (parsed.prices.ETH > 0) {
                        console.log(`   ETH: $${parsed.prices.ETH.toLocaleString()}`);
                    }
                    if (parsed.prices.XMR > 0) {
                        console.log(`   XMR: $${parsed.prices.XMR.toLocaleString()}`);
                    }
                    console.log('');
                    break;
                    
                case 'differentials':
                    if (parsed.opportunities.length > 0) {
                        opportunities += parsed.opportunities.length;
                        console.log(`🚨 ARBITRAGE OPPORTUNITIES FOUND: ${parsed.opportunities.length}`);
                        
                        parsed.opportunities.forEach(opp => {
                            console.log(`   ${opp.coin}: ${opp.spreadPct}% spread`);
                            console.log(`   Buy ${opp.buyExchange.toUpperCase()}: $${opp.buyPrice}`);
                            console.log(`   Sell ${opp.sellExchange.toUpperCase()}: $${opp.sellPrice}`);
                            console.log(`   Potential profit: $${opp.profit}`);
                            console.log('');
                        });
                        
                        if (parsed.summary) {
                            console.log(`📊 Summary: ${parsed.summary.totalOpportunities} opportunities, max spread: ${parsed.summary.maxSpread.toFixed(3)}%`);
                            console.log('');
                        }
                    }
                    break;
                    
                case 'init':
                    console.log('🔧 Engine initialized successfully');
                    console.log(`   Tracking: ${parsed.symbols.join(', ')}`);
                    console.log(`   Exchanges: ${parsed.exchanges.join(', ')}`);
                    console.log('');
                    break;
            }
            
            // Show stats every 20 messages
            if (messageCount % 20 === 0) {
                console.log(`📈 Stats: ${messageCount} updates received, ${opportunities} total arbitrage opportunities found`);
                console.log('');
            }
        });
    });
    
    ws.on('error', (error) => {
        console.error('❌ WebSocket connection failed:', error.message);
        console.log('\n🔧 Make sure the crypto differential engine is running');
        process.exit(1);
    });
    
    ws.on('close', () => {
        console.log('📡 Connection closed');
    });
    
    // Also launch the visual terminal after 10 seconds
    setTimeout(() => {
        console.log('🖥️  Launching Electron app with crypto terminal...\n');
        
        const electronProcess = spawn('npm', ['run', 'electron-unified'], {
            cwd: __dirname,
            stdio: 'inherit'
        });
        
        electronProcess.on('close', () => {
            console.log('\n📱 Electron app closed');
            ws.close();
            cryptoEngine.kill();
            process.exit(0);
        });
        
    }, 10000);
    
}, 5000);

// Handle cleanup
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down crypto test...');
    cryptoEngine.kill();
    process.exit(0);
});

cryptoEngine.on('close', (code) => {
    console.log('\n💰 Crypto engine stopped');
    process.exit(code);
});

console.log('📋 Test Instructions:');
console.log('1. Wait for exchanges to connect');
console.log('2. Monitor console for live price updates');
console.log('3. Watch for arbitrage opportunities');
console.log('4. Electron app will launch automatically in 15 seconds');
console.log('5. Use menu: Mode → Crypto Arbitrage Terminal');
console.log('6. Press Ctrl+C to stop\n');