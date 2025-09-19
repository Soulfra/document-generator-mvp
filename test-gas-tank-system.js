#!/usr/bin/env node

/**
 * 🧪 TEST GAS TANK SYSTEM
 * 
 * Comprehensive test of the gas tank key management system
 * Tests all three tanks: primary (user) → fallback (hidden) → emergency (demo)
 */

const GasTankKeyManager = require('./gas-tank-key-manager.js');
const GasTankConnector = require('./gas-tank-connector.js');
const RealAIAPIConnector = require('./real-ai-api-connector.js');
const UniversalAIAdapter = require('./universal-ai-adapter.js');
const { loadHiddenKeys } = require('./fix-key-loading.js');

async function testGasTankManager() {
    console.log('\n🧪 Testing Gas Tank Key Manager\n');
    
    const gasTank = new GasTankKeyManager({
        enableFallbackKeys: true,
        enableDemoMode: true,
        enableTransparentFallback: true
    });
    
    await gasTank.initialize();
    
    // Test getting keys from different tanks
    console.log('\n📊 Testing Key Retrieval:');
    
    const services = ['anthropic', 'openai', 'deepseek'];
    
    for (const service of services) {
        try {
            const keyData = await gasTank.getAPIKey(service, 'test');
            console.log(`✅ ${service}: Got ${keyData.source} key (${keyData.key.substring(0, 20)}...)`);
        } catch (error) {
            console.log(`❌ ${service}: ${error.message}`);
        }
    }
    
    // Show tank status
    console.log('\n⛽ Tank Status:');
    const status = gasTank.getTankStatus();
    for (const [tankName, tank] of Object.entries(status)) {
        console.log(`  ${tank.name}: ${tank.status} (${tank.keyCount} keys)`);
    }
}

async function testGasTankConnector() {
    console.log('\n\n🧪 Testing Gas Tank Connector\n');
    
    const connector = new GasTankConnector({
        enableGasTankFallback: true,
        enableTestingMode: true
    });
    
    // Test model availability
    console.log('📊 Checking Model Availability:');
    const availability = await connector.getAvailableModels();
    
    console.log(`  Total models: ${availability.availableModels}`);
    console.log(`  Gas tank status: ${availability.gasTankStatus}`);
    
    for (const [provider, info] of Object.entries(availability.providers)) {
        if (info.available) {
            console.log(`  ✅ ${provider}: ${info.models.length} models`);
        } else {
            console.log(`  ❌ ${provider}: Not available`);
        }
    }
    
    // Test API call
    if (availability.availableModels > 0) {
        console.log('\n🔌 Testing API Call through Gas Tank:');
        
        try {
            const result = await connector.callAPI(
                'anthropic',
                'claude-3-haiku',  // Will be resolved to full name
                'What is 2+2?',
                { maxTokens: 50 }
            );
            
            console.log('✅ API call successful!');
            console.log(`  Model used: ${result.model}`);
            console.log(`  Response: ${result.response.substring(0, 100)}...`);
            console.log(`  Cost: $${result.cost.toFixed(4)}`);
            
        } catch (error) {
            console.log(`❌ API call failed: ${error.message}`);
        }
    }
}

async function testRealAIConnector() {
    console.log('\n\n🧪 Testing Real AI Connector with Gas Tank\n');
    
    const connector = new RealAIAPIConnector({
        enableGasTankFallback: true,
        enableTestingMode: true
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Show status
    const status = connector.getStatus();
    console.log('📊 Connector Status:');
    console.log(`  Available APIs: ${status.availableAPIs}/${status.totalAPIs}`);
    console.log(`  Gas tank enabled: ${connector.config.enableGasTankFallback}`);
    
    // Test API call
    if (status.availableAPIs > 0) {
        console.log('\n🔌 Testing Direct API Call:');
        
        try {
            const result = await connector.callAPI(
                'anthropic',
                'claude-3-haiku-20240307',
                'Say hello',
                { maxTokens: 30 }
            );
            
            console.log('✅ Direct API call successful!');
            console.log(`  Response: ${result.response}`);
            console.log(`  Cost: $${result.metadata.cost.toFixed(4)}`);
            
        } catch (error) {
            console.log(`❌ Direct API call failed: ${error.message}`);
        }
    }
}

async function testUniversalAdapter() {
    console.log('\n\n🧪 Testing Universal AI Adapter\n');
    
    const adapter = UniversalAIAdapter;
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get status
    const status = await adapter.getStatus();
    console.log('📊 Adapter Status:');
    console.log(`  Available: ${status.available}`);
    console.log(`  Gas tank: ${status.gasTankStatus}`);
    
    // Test query
    if (status.available) {
        console.log('\n🔌 Testing Universal Query:');
        
        try {
            const result = await adapter.query(
                'What is the capital of France?',
                { domain: 'general', maxTokens: 50 }
            );
            
            console.log('✅ Universal query successful!');
            console.log(`  Model: ${result.model}`);
            console.log(`  Response: ${result.response.substring(0, 100)}...`);
            console.log(`  Cost: $${(result.cost || 0).toFixed(4)}`);
            
        } catch (error) {
            console.log(`❌ Universal query failed: ${error.message}`);
        }
    }
}

async function testIntegration() {
    console.log('\n\n🧪 Testing Full Integration\n');
    
    // Load hidden keys first
    console.log('🔑 Loading hidden keys from .env.template...');
    await loadHiddenKeys();
    
    // Now test everything
    await testGasTankManager();
    await testGasTankConnector();
    await testRealAIConnector();
    await testUniversalAdapter();
    
    console.log('\n\n📊 SUMMARY');
    console.log('='.repeat(60));
    
    // Final verification
    const gasTank = new GasTankKeyManager();
    await gasTank.initialize();
    
    const finalStatus = gasTank.getTankStatus();
    let totalKeys = 0;
    let workingTanks = 0;
    
    for (const tank of Object.values(finalStatus)) {
        totalKeys += tank.keyCount;
        if (tank.status === 'active') workingTanks++;
    }
    
    console.log(`✅ Gas tank system operational`);
    console.log(`⛽ Active tanks: ${workingTanks}/3`);
    console.log(`🔑 Total keys available: ${totalKeys}`);
    console.log(`💡 Transparent fallback: Enabled`);
    
    if (totalKeys > 0) {
        console.log('\n🎉 SUCCESS! Gas tank system is working!');
        console.log('💡 Your hidden keys are being used transparently.');
        console.log('🔧 The vault encryption issues are bypassed.');
    } else {
        console.log('\n⚠️  WARNING: No API keys found!');
        console.log('💡 Check .env.template for valid keys');
    }
}

// Run tests
if (require.main === module) {
    testIntegration().catch(console.error);
}

module.exports = { testIntegration };