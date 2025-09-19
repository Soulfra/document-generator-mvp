#!/usr/bin/env node

/**
 * 💰 FINANCIAL ANALYZER TEST
 * Tests the complete financial transaction analysis system
 */

async function testFinancialAnalyzer() {
    console.log('💰 FINANCIAL TRANSACTION ANALYZER TEST');
    console.log('======================================');
    console.log('🤖 Testing AI-powered investment analysis with local LLM reasoning');
    console.log('📊 Side-by-side transaction viewing with privacy assessment');
    console.log('🎭 API chameleon layer for CoinGecko/Coinbase/Binance data');
    console.log('');

    const baseUrl = 'http://localhost:8090';
    
    // Test with demo user
    const testUserId = 'demo_user';
    
    console.log(`💰 TESTING FINANCIAL ANALYSIS: ${testUserId}`);
    console.log('   (Analyzing transaction history with AI investment advice)');
    console.log('');
    
    try {
        // Start the financial analysis
        console.log('💰 STARTING FINANCIAL ANALYSIS...');
        const analysisResponse = await fetch(`${baseUrl}/api/financial/analyze`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: testUserId,
                includePrivacy: true,
                includeLLMReasoning: true
            })
        });
        
        const analysis = await analysisResponse.json();
        
        console.log('💰 FINANCIAL ANALYSIS COMPLETED!');
        console.log(`   Analysis ID: ${analysis.id}`);
        console.log(`   Duration: ${analysis.duration}ms`);
        console.log(`   Status: ${analysis.status}`);
        console.log('');
        
        // Display transaction analysis
        console.log('📊 TRANSACTION ANALYSIS:');
        console.log(`   💼 Transactions analyzed: ${analysis.transactions.length}`);
        console.log(`   💰 Total value: $${analysis.transactions.reduce((sum, tx) => sum + tx.value, 0).toLocaleString()}`);
        console.log(`   🪙 Assets: ${[...new Set(analysis.transactions.map(tx => tx.asset))].join(', ')}`);
        console.log(`   🏦 Exchanges: ${[...new Set(analysis.transactions.map(tx => tx.exchange))].join(', ')}`);
        
        console.log('\\n📈 SAMPLE TRANSACTIONS:');
        analysis.transactions.slice(0, 3).forEach(tx => {
            console.log(`   • ${tx.date.substr(0, 10)}: ${tx.type.toUpperCase()} ${tx.amount} ${tx.asset} @ $${tx.price.toLocaleString()} (${tx.exchange})`);
        });
        
        // Display market context
        console.log('\\n🌍 MARKET CONTEXT:');
        Object.entries(analysis.marketData).forEach(([asset, data]) => {
            console.log(`   🪙 ${asset}: $${data.currentPrice.toLocaleString()} (${data.priceChange24h.toFixed(2)}% 24h)`);
            console.log(`      📊 Volume: $${(data.volume24h / 1000000).toFixed(1)}M | Sentiment: ${data.sentiment.label}`);
        });
        
        // Display LLM reasoning
        console.log('\\n🤖 LOCAL LLM REASONING:');
        if (analysis.llmReasoning && analysis.llmReasoning.length > 0) {
            const reasoning = analysis.llmReasoning[0];
            console.log(`   ✅ Model: ${reasoning.model}`);
            console.log(`   📝 Response length: ${reasoning.response.length} characters`);
            console.log(`   💡 Analysis type: ${reasoning.analysisType}`);
            console.log(`   🧠 Key insights: ${analysis.llmInsights?.length || 0} extracted`);
            
            if (analysis.llmInsights) {
                analysis.llmInsights.forEach(insight => {
                    console.log(`      • ${insight.category}: ${insight.summary}`);
                });
            }
        } else {
            console.log('   ❌ No LLM reasoning available');
        }
        
        // Display investment advice
        console.log('\\n📈 INVESTMENT ADVICE:');
        if (analysis.investmentAdvice && analysis.investmentAdvice.length > 0) {
            analysis.investmentAdvice.forEach(advice => {
                console.log(`   🎯 ${advice.type.toUpperCase()} (${advice.priority} priority):`);
                console.log(`      💡 ${advice.recommendation}`);
                console.log(`      📋 Reasoning: ${advice.reasoning}`);
                console.log(`      ⚡ Action: ${advice.action}`);
                console.log('');
            });
        } else {
            console.log('   📊 No specific investment advice generated');
        }
        
        // Display privacy assessment
        console.log('🔒 PRIVACY ASSESSMENT:');
        if (analysis.privacyScore) {
            console.log(`   🔒 Overall Privacy Score: ${analysis.privacyScore.overall}/10`);
            console.log(`   🏦 Exchange Data Exposure:`);
            
            if (analysis.dataExposure) {
                analysis.dataExposure.forEach(exposure => {
                    console.log(`      • ${exposure.exchange}: $${exposure.totalValue.toLocaleString()} (${exposure.privacyRisk} risk)`);
                    console.log(`        KYC Level: ${exposure.kycLevel} | Retention: ${exposure.dataRetention}`);
                });
            }
            
            console.log(`   🛡️ Privacy Recommendations: ${analysis.privacyRecommendations?.length || 0}`);
            if (analysis.privacyRecommendations) {
                analysis.privacyRecommendations.forEach(rec => {
                    console.log(`      • ${rec.category}: ${rec.recommendation}`);
                });
            }
        }
        
        // Display pattern analysis
        console.log('\\n📊 TRADING PATTERNS:');
        if (analysis.patterns && analysis.patterns.length > 0) {
            analysis.patterns.forEach(pattern => {
                console.log(`   📈 ${pattern.type}: ${pattern.description}`);
            });
        }
        
        // Display correlations
        console.log('\\n🔗 ASSET CORRELATIONS:');
        if (analysis.correlations && analysis.correlations.length > 0) {
            analysis.correlations.forEach(corr => {
                console.log(`   🔗 ${corr.asset1} ↔ ${corr.asset2}: ${corr.correlation.toFixed(3)} correlation`);
            });
        }
        
        console.log('\\n✅ SUCCESS! Financial analysis completed successfully');
        console.log('🌐 Access the web interface at: http://localhost:8090/financial-analyzer');
        console.log('📊 Side-by-side viewing: Transaction history with AI reasoning');
        console.log('🤖 Local LLM investment advice with privacy assessment');
        console.log('🎭 API chameleon layer ready for real exchange integration');
        
        return analysis;
        
    } catch (error) {
        console.error('❌ Financial analysis test failed:', error.message);
        console.log('🔧 Make sure the server is running on port 8090');
        return null;
    }
}

// Polyfill fetch for Node.js
if (typeof fetch === 'undefined') {
    global.fetch = function(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const client = require('http');
            
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port || 8090,
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
    testFinancialAnalyzer().catch(console.error);
}

module.exports = { testFinancialAnalyzer };