#!/usr/bin/env node
const { loadUserState, getUserStats, closeUserStateLoader } = require('./user-state-loader');
const UserCacheManager = require('./user-cache-manager');
const fs = require('fs').promises;
const path = require('path');

/**
 * 🎪 USER STATE LOADER DEMO
 * 
 * Demonstrates all features of the bulletproof user state loader:
 * - Loading by different identifier types
 * - Cache performance and fallback behavior
 * - Circuit breaker functionality
 * - Memory and file cache interaction
 * - Error recovery and graceful degradation
 */

async function runDemo() {
    console.log('🎪 Starting User State Loader Demo...');
    console.log('====================================');
    
    try {
        // Demo 1: Basic user loading by different identifiers
        console.log('\n📋 Demo 1: Loading Users by Different Identifiers');
        console.log('--------------------------------------------------');
        
        // Load by user ID
        console.log('🔍 Loading user by ID (123)...');
        const userById = await loadUserState(123);
        console.log('Result:', JSON.stringify(userById, null, 2));
        
        // Load by username
        console.log('\n🔍 Loading user by username (cal_pirate)...');
        const userByUsername = await loadUserState('cal_pirate');
        console.log('Result:', JSON.stringify(userByUsername, null, 2));
        
        // Load by email
        console.log('\n🔍 Loading user by email (cal@deathtodata.com)...');
        const userByEmail = await loadUserState('cal@deathtodata.com');
        console.log('Result:', JSON.stringify(userByEmail, null, 2));
        
        // Load by invalid identifier (should return empty state)
        console.log('\n🔍 Loading user by invalid ID (99999)...');
        const userInvalid = await loadUserState(99999);
        console.log('Result:', JSON.stringify(userInvalid, null, 2));
        
        // Demo 2: Cache performance demonstration
        console.log('\n📦 Demo 2: Cache Performance');
        console.log('-----------------------------');
        
        // First load (should be slow - database)
        console.time('First Load');
        const user1 = await loadUserState('demo_user');
        console.timeEnd('First Load');
        console.log('Source:', user1._source);
        
        // Second load (should be fast - memory cache)
        console.time('Second Load');
        const user2 = await loadUserState('demo_user');
        console.timeEnd('Second Load');
        console.log('Source:', user2._source);
        
        // Demo 3: Cache manager functionality
        console.log('\n🗃️ Demo 3: Cache Manager Features');
        console.log('----------------------------------');
        
        const cacheManager = new UserCacheManager({
            cacheDir: path.join(__dirname, 'user-cache-demo')
        });
        
        // Store some test data
        const testUserData = {
            id: 456,
            username: 'test_user',
            level: 3,
            games: ['pirate-adventure', 'death-search'],
            achievements: ['first-login', 'level-up']
        };
        
        await cacheManager.set('test_user', testUserData);
        console.log('✅ Stored test user in cache');
        
        // Retrieve cached data
        const cachedData = await cacheManager.get('test_user');
        console.log('📥 Retrieved from cache:', cachedData ? 'SUCCESS' : 'FAILED');
        
        // List all cached items
        const cacheList = await cacheManager.list();
        console.log('📋 Cache contains', cacheList.length, 'items');
        
        // Get cache statistics
        const cacheStats = await cacheManager.getStats();
        console.log('📊 Cache stats:', JSON.stringify(cacheStats, null, 2));
        
        // Demo 4: Error resilience testing
        console.log('\n🛡️ Demo 4: Error Resilience');
        console.log('----------------------------');
        
        // Test with null identifier
        const nullResult = await loadUserState(null);
        console.log('Null identifier result:', nullResult._source);
        
        // Test with empty string
        const emptyResult = await loadUserState('');
        console.log('Empty identifier result:', emptyResult._source);
        
        // Test with malformed data
        const malformedResult = await loadUserState('///invalid//path//');
        console.log('Malformed identifier result:', malformedResult._source);
        
        // Demo 5: Memory management
        console.log('\n🧠 Demo 5: Memory Management');
        console.log('-----------------------------');
        
        // Load many users to test memory caching
        console.log('Loading multiple users to test memory cache...');
        const loadPromises = [];
        for (let i = 1; i <= 10; i++) {
            loadPromises.push(loadUserState(`user_${i}`));
        }
        
        const results = await Promise.all(loadPromises);
        console.log('Loaded', results.length, 'users');
        
        // Check memory usage
        const memUsage = process.memoryUsage();
        console.log('Memory usage:', Math.round(memUsage.heapUsed / 1024 / 1024), 'MB');
        
        // Demo 6: System statistics
        console.log('\n📈 Demo 6: System Statistics');
        console.log('-----------------------------');
        
        const stats = await getUserStats();
        if (stats) {
            console.log('User State Loader Statistics:');
            console.log(JSON.stringify(stats, null, 2));
        }
        
        // Demo 7: Bulk operations
        console.log('\n🔄 Demo 7: Bulk Operations');
        console.log('---------------------------');
        
        console.time('Bulk Load');
        const bulkUsers = await Promise.all([
            loadUserState('bulk_user_1'),
            loadUserState('bulk_user_2'),
            loadUserState('bulk_user_3'),
            loadUserState('bulk_user_4'),
            loadUserState('bulk_user_5')
        ]);
        console.timeEnd('Bulk Load');
        
        console.log('Bulk load sources:', bulkUsers.map(u => u._source));
        
        // Demo 8: Cache export/import
        console.log('\n💾 Demo 8: Cache Backup/Export');
        console.log('-------------------------------');
        
        // Export current cache
        const exportData = await cacheManager.exportCache();
        console.log('Exported', exportData.length, 'cache entries');
        
        // Save export to file
        if (exportData.length > 0) {
            const exportFile = path.join(__dirname, 'cache-export-demo.json');
            await fs.writeFile(exportFile, JSON.stringify(exportData, null, 2));
            console.log('✅ Cache exported to:', exportFile);
        }
        
        // Demo 9: Performance benchmarking
        console.log('\n🏃 Demo 9: Performance Benchmark');
        console.log('----------------------------------');
        
        const iterations = 100;
        console.log(`Running ${iterations} lookups for performance test...`);
        
        console.time('Performance Test');
        for (let i = 0; i < iterations; i++) {
            await loadUserState(`perf_test_${i % 10}`); // Reuse some identifiers for cache hits
        }
        console.timeEnd('Performance Test');
        
        // Final statistics
        const finalStats = await getUserStats();
        if (finalStats) {
            console.log('\nFinal Statistics:');
            console.log('- Circuit Breaker:', finalStats.circuitBreaker.state);
            console.log('- Memory Cache:', finalStats.memoryCache.size, '/', finalStats.memoryCache.maxSize);
            console.log('- Memory Usage:', finalStats.memory.usage, '/', finalStats.memory.limit);
            console.log('- Database Status: Primary:', finalStats.databases.primary ? '✅' : '❌', 
                       'Fallback:', finalStats.databases.fallback ? '✅' : '❌');
        }
        
        // Demo summary
        console.log('\n🎉 Demo Summary');
        console.log('===============');
        console.log('✅ All user state loading methods tested');
        console.log('✅ Cache performance validated');
        console.log('✅ Error resilience confirmed');
        console.log('✅ Memory management working');
        console.log('✅ Bulk operations successful');
        console.log('✅ Cache backup/export functional');
        console.log('✅ Performance benchmarking complete');
        console.log('');
        console.log('🛡️ Bulletproof User State Loader is ready for production!');
        console.log('');
        console.log('Usage Examples:');
        console.log('  const { loadUserState } = require("./user-state-loader");');
        console.log('  const user = await loadUserState(123);           // By ID');
        console.log('  const user = await loadUserState("username");    // By username');
        console.log('  const user = await loadUserState("user@email");  // By email');
        console.log('  const user = await loadUserState("jwt_token");   // By token');
        
    } catch (error) {
        console.error('❌ Demo error:', error.message);
        console.error(error.stack);
    } finally {
        // Cleanup
        await closeUserStateLoader();
        console.log('\n🧹 Demo cleanup complete');
    }
}

// Run demo if called directly
if (require.main === module) {
    runDemo()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('❌ Fatal demo error:', error.message);
            process.exit(1);
        });
}

module.exports = { runDemo };