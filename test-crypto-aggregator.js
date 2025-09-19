#!/usr/bin/env node

// Test Crypto Data Aggregator - Multi-source validation
// CoinGecko, CryptoCompare, Kraken, Binance, DEXs

const { spawn } = require('child_process');
const WebSocket = require('ws');

console.log('🌐 CRYPTO DATA AGGREGATOR TEST');
console.log('==============================\n');

console.log('🚀 Starting multi-source crypto data aggregator...');
console.log('📡 Will connect to:');
console.log('   • CoinGecko (primary free API)');
console.log('   • CryptoCompare (backup)');
console.log('   • Kraken Public API');
console.log('   • Binance Public API (if available)');
console.log('   • Jupiter DEX (Solana)');
console.log('   • Cross-validation between sources');
console.log('');

// Start the aggregator
const aggregator = spawn('node', ['crypto-data-aggregator.js'], {
    cwd: __dirname,
    stdio: 'inherit'
});

console.log('⏱️  Waiting 8 seconds for aggregator to fetch from all sources...\n');

setTimeout(() => {
    console.log('📊 Testing WebSocket connection to aggregated data...');
    
    // Test connection to aggregator
    const ws = new WebSocket('ws://localhost:47003');
    
    ws.on('open', () => {
        console.log('✅ Connected to crypto data aggregator');
        console.log('📈 Receiving multi-source validated data...\n');
        
        let messageCount = 0;
        let priceUpdates = 0;
        let arbitrageFound = 0;
        let sourcesActive = new Set();
        
        ws.on('message', (data) => {
            const parsed = JSON.parse(data);
            messageCount++;
            
            switch (parsed.type) {
                case 'init':
                    console.log('🔧 Aggregator initialized successfully');
                    console.log(`   Tracking: ${parsed.symbols.join(', ')}`);
                    console.log(`   Data quality: ${parsed.dataQuality}`);
                    console.log('');
                    break;
                    
                case 'price_update_aggregated':
                    priceUpdates++;
                    console.log('📈 AGGREGATED PRICE UPDATE:');
                    
                    Object.entries(parsed.prices).forEach(([coin, data]) => {
                        if (data.price > 0) {
                            const sourceCount = Object.keys(data.sources || {}).length;
                            console.log(`   ${coin}: $${data.price.toLocaleString()} (${data.confidence}% confidence, ${sourceCount} sources)`);
                            
                            // Track which sources are providing data
                            Object.keys(data.sources || {}).forEach(source => {
                                sourcesActive.add(source);
                            });
                        }
                    });
                    console.log('');
                    break;
                    
                case 'arbitrage_opportunities':
                    if (parsed.opportunities.length > 0) {
                        arbitrageFound += parsed.opportunities.length;
                        console.log(`🚨 DATA SOURCE ARBITRAGE: ${parsed.opportunities.length} opportunities`);
                        
                        parsed.opportunities.forEach(opp => {
                            console.log(`   ${opp.coin}: ${opp.spreadPct}% spread`);
                            console.log(`   Buy from ${opp.buySource}: $${opp.buyPrice}`);
                            console.log(`   Sell to ${opp.sellSource}: $${opp.sellPrice}`);
                            console.log(`   Potential: $${opp.spreadUsd} difference`);
                            console.log('');
                        });
                        
                        if (parsed.summary) {
                            console.log(`📊 Summary: ${parsed.summary.totalOpportunities} opportunities, max spread: ${parsed.summary.maxSpread.toFixed(3)}%`);
                            console.log(`   Data quality: ${parsed.summary.dataQuality}`);
                            console.log('');
                        }
                    }
                    break;
                    
                case 'exchange_error':
                    console.log(`⚠️ ${parsed.exchange} error: ${parsed.error}`);
                    break;
            }
            
            // Show stats every 15 messages
            if (messageCount % 15 === 0) {
                console.log(`📈 Stats: ${messageCount} updates, ${priceUpdates} price updates, ${arbitrageFound} arbitrage opportunities`);
                console.log(`📡 Active sources: ${Array.from(sourcesActive).join(', ')}`);
                console.log('');
            }
        });
    });
    
    ws.on('error', (error) => {
        console.error('❌ WebSocket connection failed:', error.message);
        console.log('\n🔧 Make sure the crypto data aggregator is running');
        process.exit(1);
    });
    
    ws.on('close', () => {
        console.log('📡 Connection closed');
    });
    
    // Launch Electron app after 15 seconds
    setTimeout(() => {
        console.log('🖥️  Launching Electron app with crypto terminal...\n');
        console.log('📋 Instructions:');
        console.log('1. Menu → Mode → Crypto Arbitrage Terminal');
        console.log('2. Watch for multi-source price validation');
        console.log('3. Green cells = high confidence (75%+)');
        console.log('4. Red cells = low confidence (<50%)');
        console.log('5. Look for "X sources" in price display');
        console.log('');
        
        const electronProcess = spawn('npm', ['run', 'electron-unified'], {
            cwd: __dirname,
            stdio: 'inherit'
        });
        
        electronProcess.on('close', () => {
            console.log('\n📱 Electron app closed');
            ws.close();
            aggregator.kill();
            process.exit(0);
        });
        
    }, 15000);
    
}, 8000);

// Handle cleanup
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down aggregator test...');
    aggregator.kill();
    process.exit(0);
});

aggregator.on('close', (code) => {
    console.log('\n🌐 Crypto data aggregator stopped');
    process.exit(code);
});

console.log('📋 Test Features:');
console.log('• Multi-source price validation');
console.log('• Cross-source arbitrage detection');
console.log('• Confidence scoring (25% per source, max 100%)');
console.log('• Outlier detection (>5% price difference)');
console.log('• Fallback mechanisms');
console.log('• Real-time data aggregation');
console.log('');
console.log('⏰ Electron app will launch in 23 seconds...');
console.log('🔄 Press Ctrl+C to stop\n');