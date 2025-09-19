#!/usr/bin/env node

/**
 * 🧪 REAL-TIME DATA SYSTEM INTEGRATION TEST
 * 
 * Tests the complete flow:
 * 1. Real API calls (when keys are configured)
 * 2. Tiered access control
 * 3. Caching behavior
 * 4. Visual display differences
 * 5. Fallback to demo data
 */

const RealTimeDataOracle = require('./real-time-data-oracle');
const DataAccessControl = require('./middleware/data-access-control');
const express = require('express');

class RealTimeDataSystemTest {
    constructor() {
        this.oracle = new RealTimeDataOracle();
        this.accessControl = new DataAccessControl({ oracle: this.oracle });
        this.app = express();
        this.setupExpress();
    }
    
    setupExpress() {
        this.app.use(express.json());
        
        // Apply access control middleware
        this.app.use('/api/data', this.accessControl.middleware());
        
        // Price endpoint
        this.app.get('/api/data/price/:ticker', async (req, res) => {
            try {
                const { ticker } = req.params;
                const data = await req.getData('crypto/coingecko', ticker);
                
                res.json({
                    success: true,
                    tier: req.userTier,
                    data
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Sports data endpoint
        this.app.get('/api/data/sports/:ticker', async (req, res) => {
            try {
                const { ticker } = req.params;
                const data = await req.getData('sports/espn', ticker);
                
                res.json({
                    success: true,
                    tier: req.userTier,
                    data
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Serve the visual display
        this.app.use(express.static('.'));
    }
    
    async runTests() {
        console.log('🧪 Starting Real-Time Data System Tests\n');
        
        // Test 1: Different user tiers
        await this.testUserTiers();
        
        // Test 2: Cache behavior
        await this.testCacheBehavior();
        
        // Test 3: Real API calls (if keys configured)
        await this.testRealAPIs();
        
        // Test 4: Rate limiting
        await this.testRateLimiting();
        
        // Test 5: Data quality visualization
        await this.testDataQuality();
        
        console.log('\n✅ All tests completed!');
    }
    
    async testUserTiers() {
        console.log('\n📊 Testing User Tiers...\n');
        
        const testUsers = [
            { id: 'anonymous', expected: 'free' },
            { id: 'free_user_123', expected: 'free' },
            { id: 'test_paid_user', expected: 'paid' },
            { id: 'test_premium_user', expected: 'premium' }
        ];
        
        for (const user of testUsers) {
            const tier = await this.accessControl.getUserTier(user.id);
            console.log(`User: ${user.id} → Tier: ${tier} ${tier === user.expected ? '✅' : '❌'}`);
            
            // Get price data
            const data = await this.accessControl.getPrice(user.id, 'btc');
            console.log(`  Quality: ${data.quality}, Cached: ${data.cached}, Cache Age: ${data.cacheAge || 0}ms`);
            
            if (data.upgradeMessage) {
                console.log(`  Message: ${data.upgradeMessage}`);
            }
        }
    }
    
    async testCacheBehavior() {
        console.log('\n💾 Testing Cache Behavior...\n');
        
        const userId = 'test_paid_user';
        const ticker = 'eth';
        
        // First call - should hit API
        console.log('First call (should hit API):');
        const data1 = await this.accessControl.getPrice(userId, ticker);
        console.log(`  Quality: ${data1.quality}, Cached: ${data1.cached}`);
        
        // Second call immediately - should hit cache
        console.log('\nSecond call (should hit cache):');
        const data2 = await this.accessControl.getPrice(userId, ticker);
        console.log(`  Quality: ${data2.quality}, Cached: ${data2.cached}, Cache Age: ${data2.cacheAge}ms`);
        
        // Wait and test cache expiry
        console.log('\nWaiting 11 seconds for paid tier cache to expire...');
        await new Promise(resolve => setTimeout(resolve, 11000));
        
        console.log('Third call (cache expired, should hit API):');
        const data3 = await this.accessControl.getPrice(userId, ticker);
        console.log(`  Quality: ${data3.quality}, Cached: ${data3.cached}`);
    }
    
    async testRealAPIs() {
        console.log('\n🌐 Testing Real APIs...\n');
        
        // Check which APIs have keys configured
        const apis = {
            coingecko: process.env.COINGECKO_API_KEY ? '✅ Configured' : '❌ Not configured',
            binance: process.env.BINANCE_API_KEY ? '✅ Configured' : '❌ Not configured',
            coinmarketcap: process.env.COINMARKETCAP_API_KEY ? '✅ Configured' : '❌ Not configured'
        };
        
        console.log('API Key Status:');
        Object.entries(apis).forEach(([api, status]) => {
            console.log(`  ${api}: ${status}`);
        });
        
        // Try real API call if CoinGecko is available (no key required)
        console.log('\nTrying CoinGecko API (no key required):');
        try {
            const data = await this.oracle.getRealTimeData('crypto/coingecko', 'bitcoin');
            console.log('✅ Real API call successful!');
            console.log(`  Bitcoin price: $${data.price}`);
            console.log(`  24h change: ${data.changePercent24h}%`);
            console.log(`  Source: ${data.source}`);
        } catch (error) {
            console.log('❌ API call failed:', error.message);
        }
        
        // Try ESPN API (no key required)
        console.log('\nTrying ESPN API (no key required):');
        try {
            const data = await this.oracle.getRealTimeData('sports/espn', 'mlb:nyy');
            console.log('✅ Real API call successful!');
            console.log(`  Games found: ${data.games?.length || 0}`);
        } catch (error) {
            console.log('❌ API call failed:', error.message);
        }
    }
    
    async testRateLimiting() {
        console.log('\n⏱️ Testing Rate Limiting...\n');
        
        const userId = 'free_user_rate_limit_test';
        const limit = 100; // Free tier limit
        
        console.log(`Making ${limit + 5} requests to test rate limiting...`);
        
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < limit + 5; i++) {
            try {
                await this.accessControl.trackUsage(userId, 'test');
                successCount++;
            } catch (error) {
                failCount++;
            }
        }
        
        console.log(`  Successful: ${successCount}`);
        console.log(`  Rate limited: ${failCount}`);
        console.log(`  ${failCount > 0 ? '✅' : '❌'} Rate limiting working`);
    }
    
    async testDataQuality() {
        console.log('\n🎨 Testing Data Quality Visualization...\n');
        
        const qualities = {
            realtime: {
                border: '2px solid gold',
                background: 'rgba(255, 215, 0, 0.1)',
                icon: '⚡',
                label: 'REAL-TIME'
            },
            cached: {
                border: '1px solid silver',
                background: 'rgba(192, 192, 192, 0.1)',
                icon: '🔄',
                label: 'LIVE (cached)'
            },
            demo: {
                border: '1px dashed orange',
                background: 'rgba(255, 165, 0, 0.1)',
                icon: '🎲',
                label: 'DEMO'
            }
        };
        
        console.log('Visual indicators by quality:');
        Object.entries(qualities).forEach(([quality, style]) => {
            console.log(`\n${quality.toUpperCase()}:`);
            console.log(`  Border: ${style.border}`);
            console.log(`  Background: ${style.background}`);
            console.log(`  Badge: ${style.icon} ${style.label}`);
        });
    }
    
    async startServer() {
        const PORT = 3333;
        this.app.listen(PORT, () => {
            console.log(`\n🚀 Test server running on http://localhost:${PORT}`);
            console.log(`📊 View price display at http://localhost:${PORT}/real-time-price-display.html`);
            console.log('\nTest endpoints:');
            console.log(`  GET /api/data/price/:ticker (e.g., btc, eth, sol)`);
            console.log(`  GET /api/data/sports/:ticker (e.g., mlb:nyy, nba:lakers)`);
            console.log('\nAdd X-User-Id header to test different tiers:');
            console.log(`  X-User-Id: anonymous (free tier)`);
            console.log(`  X-User-Id: test_paid_user (paid tier)`);
            console.log(`  X-User-Id: test_premium_user (premium tier)`);
        });
    }
}

// Run tests
if (require.main === module) {
    const tester = new RealTimeDataSystemTest();
    
    (async () => {
        // Run all tests
        await tester.runTests();
        
        // Start server for manual testing
        console.log('\n🌐 Starting test server for manual testing...');
        tester.startServer();
        
        // Show example curl commands
        console.log('\n📝 Example curl commands:\n');
        console.log('# Free tier (demo data):');
        console.log('curl http://localhost:3333/api/data/price/btc');
        console.log('\n# Paid tier (10s cache):');
        console.log('curl -H "X-User-Id: test_paid_user" http://localhost:3333/api/data/price/eth');
        console.log('\n# Premium tier (real-time):');
        console.log('curl -H "X-User-Id: test_premium_user" http://localhost:3333/api/data/price/sol');
        console.log('\n# Sports data:');
        console.log('curl -H "X-User-Id: test_premium_user" http://localhost:3333/api/data/sports/mlb:nyy');
    })();
}