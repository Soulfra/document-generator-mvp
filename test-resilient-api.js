#!/usr/bin/env node

/**
 * 🧪 TEST RESILIENT API WRAPPER
 * 
 * Tests various failure scenarios to ensure the system "rolls through" API errors
 */

const ResilientAPIWrapper = require('./resilient-api-wrapper');
const RedisPriceCache = require('./redis-price-cache');

async function testResilientAPI() {
    console.log('🧪 TESTING RESILIENT API WRAPPER');
    console.log('================================\n');
    
    // Initialize components
    const cache = new RedisPriceCache();
    await cache.connect();
    
    const resilientAPI = new ResilientAPIWrapper({
        cache,
        maxRetries: 3,
        circuitBreakerThreshold: 3,
        cacheEnabled: true,
        queueEnabled: true
    });
    
    await resilientAPI.initialize();
    
    // Test 1: Successful request
    console.log('📝 Test 1: Successful API call');
    try {
        const result = await resilientAPI.fetch({
            url: 'https://prices.runescape.wiki/api/v1/osrs/latest',
            cacheKey: 'test_prices',
            priority: 'high'
        });
        
        console.log('✅ Success:', {
            success: result.success,
            fromCache: result.fromCache,
            confidence: result.confidence,
            latency: result.latency
        });
    } catch (error) {
        console.error('❌ Failed:', error.message);
    }
    
    // Test 2: Non-existent endpoint (should fail and use cache/queue)
    console.log('\n📝 Test 2: Non-existent endpoint');
    try {
        const result = await resilientAPI.fetch({
            url: 'https://api.doesnotexist.invalid/test',
            cacheKey: 'test_fail',
            fallbackToCache: true,
            queueOnFailure: true,
            priority: 'medium'
        });
        
        console.log('Result:', {
            success: result.success,
            fromCache: result.fromCache,
            queued: result.queued,
            confidence: result.confidence
        });
    } catch (error) {
        console.error('Error handled:', error.message);
    }
    
    // Test 3: Simulate multiple failures to trigger circuit breaker
    console.log('\n📝 Test 3: Circuit breaker test');
    const failUrl = 'https://httpstat.us/500'; // Always returns 500
    
    for (let i = 0; i < 5; i++) {
        try {
            console.log(`  Attempt ${i + 1}...`);
            const result = await resilientAPI.fetch({
                url: failUrl,
                cacheKey: 'test_circuit',
                maxRetries: 0, // Fail fast for testing
                priority: 'low'
            });
            
            console.log(`  Result:`, result.success ? '✅' : '❌', 
                result.circuitOpen ? '(Circuit Open)' : '');
        } catch (error) {
            console.log(`  Failed as expected`);
        }
        
        await sleep(1000);
    }
    
    // Test 4: Queue processing
    console.log('\n📝 Test 4: Queue processing');
    console.log('  Queued requests:', resilientAPI.requestQueue.length);
    
    // Wait for queue processor to run
    console.log('  Waiting for queue processor...');
    await sleep(15000);
    console.log('  Queued requests after processing:', resilientAPI.requestQueue.length);
    
    // Show final metrics
    console.log('\n📊 Final Metrics:');
    const metrics = resilientAPI.getMetrics();
    console.log('  Total requests:', metrics.totalRequests);
    console.log('  Successful:', metrics.successfulRequests);
    console.log('  Failed:', metrics.failedRequests);
    console.log('  Retried:', metrics.retriedRequests);
    console.log('  From cache:', metrics.cachedResponses);
    console.log('  Queued:', metrics.queuedRequests);
    console.log('  Circuit trips:', metrics.circuitBreakerTrips);
    
    // Show health summary
    console.log('\n🏥 Health Summary:');
    const health = resilientAPI.getHealthSummary();
    for (const [endpoint, status] of Object.entries(health.endpoints)) {
        console.log(`  ${endpoint}:`);
        console.log(`    Success rate: ${(status.successRate * 100).toFixed(1)}%`);
        console.log(`    Avg latency: ${status.avgLatency.toFixed(0)}ms`);
        console.log(`    Circuit: ${status.circuitBreakerStatus}`);
    }
    
    // Cleanup
    await cache.disconnect();
    await resilientAPI.cleanup();
    
    console.log('\n✅ Test complete!');
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run tests
testResilientAPI().catch(console.error);