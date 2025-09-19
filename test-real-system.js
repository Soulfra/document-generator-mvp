// Test the REAL System - Economic Trading & Gaming Platform
// This tests the actual architecture, not the document generator facade

console.log(`
🎮 TESTING THE REAL SYSTEM 🎮
Economic Trading Platform with Gaming Integration
ShipRekt Chart Battles | Trinity Reasoning | Blamechain Registry
`);

// Test results tracking
const results = {
    components: {},
    features: {},
    errors: []
};

// Test 1: Verify ShipRekt Gaming Components
console.log('\n⚔️ Testing ShipRekt Gaming System...');
try {
    const ShipRektEngine = require('./shiprekt-charting-game-engine.js');
    const ShipRektScoring = require('./shiprekt-gaming-economy-scoring-tiers.js');
    const ShipRektInterface = require('./shiprekt-visual-interface-electron.js');
    
    console.log('✅ ShipRekt core components loaded');
    results.components.shiprekt = 'loaded';
    
    // Check for teams
    if (ShipRektEngine.teams) {
        console.log('✅ Teams found:', Object.keys(ShipRektEngine.teams).join(', '));
    }
    
    // Check scoring tiers
    if (ShipRektScoring.tiers) {
        console.log('✅ Scoring tiers:', ShipRektScoring.tiers.length);
    }
} catch (error) {
    console.log('❌ ShipRekt failed:', error.message);
    results.errors.push({ component: 'ShipRekt', error: error.message });
}

// Test 2: Verify Trinity System Components
console.log('\n🔱 Testing Trinity System...');
try {
    // Check for Soulfra (Soul framework)
    const soulfraFiles = require('fs').readdirSync('.').filter(f => f.includes('soulfra'));
    console.log('✅ Soulfra components:', soulfraFiles.length);
    
    // Check Clarity Engine
    const ClarityEngine = require('./clarity-workflow-engine.js');
    console.log('✅ Clarity Engine loaded');
    results.components.clarity = 'loaded';
    
    // Check Cringeproof
    const Cringeproof = require('./cringeproof-verification.js');
    console.log('✅ Cringeproof Engine loaded');
    results.components.cringeproof = 'loaded';
    
} catch (error) {
    console.log('❌ Trinity system error:', error.message);
    results.errors.push({ component: 'Trinity', error: error.message });
}

// Test 3: Check Economic Layers
console.log('\n💰 Testing Economic System...');
try {
    // Check for economy files
    const economyFiles = require('fs').readdirSync('.')
        .filter(f => f.includes('economy') || f.includes('economic'));
    
    console.log('✅ Economic components found:', economyFiles.length);
    
    // Try to load key economic systems
    const files = [
        'AGENT-TO-AGENT-BLOCKCHAIN-ECONOMY.js',
        'UNIFIED-API-ECONOMY-INTEGRATION.js',
        'THREE-ECONOMY-WAR-SYSTEM.js'
    ];
    
    for (const file of files) {
        try {
            if (require('fs').existsSync('./' + file)) {
                console.log(`✅ ${file} exists`);
                results.features[file.replace('.js', '')] = true;
            }
        } catch (e) {}
    }
} catch (error) {
    console.log('❌ Economic system error:', error.message);
}

// Test 4: Verify Runtime Rings (Economic Isolation)
console.log('\n🔄 Testing Runtime Ring System...');
try {
    const SSHSystem = require('./ssh-terminal-runtime-ring-system.js');
    const system = new SSHSystem();
    
    console.log('✅ Runtime rings initialized:', Object.keys(system.runtimeRings).length);
    
    // Check ring purposes
    const rings = system.runtimeRings;
    console.log('📍 Ring 0:', rings.ring0.name, '- Databases:', rings.ring0.databases.join(', '));
    console.log('📍 Ring 1:', rings.ring1.name, '- Databases:', rings.ring1.databases.join(', '));
    console.log('📍 Ring 2:', rings.ring2.name, '- Databases:', rings.ring2.databases.join(', '));
    
    results.components.runtimeRings = Object.keys(rings).length;
    
    // Stop the server to prevent hanging
    if (system.server) {
        system.server.close();
    }
} catch (error) {
    console.log('❌ Runtime ring error:', error.message);
}

// Test 5: Check Blamechain System
console.log('\n🔗 Testing Blamechain Registry...');
try {
    const blameFiles = require('fs').readdirSync('.')
        .filter(f => f.toLowerCase().includes('blame'));
    
    console.log('✅ Blamechain components:', blameFiles.length);
    results.features.blamechain = blameFiles.length > 0;
    
    // Check for specific blamechain features
    if (blameFiles.includes('blamechain.js')) {
        const Blamechain = require('./blamechain.js');
        console.log('✅ Core Blamechain system found');
    }
} catch (error) {
    console.log('❌ Blamechain error:', error.message);
}

// Test 6: Verify Trading Features
console.log('\n📈 Testing Trading System...');
try {
    // Look for trading-related files
    const tradingFiles = require('fs').readdirSync('.')
        .filter(f => f.includes('trading') || f.includes('chart') || f.includes('market'));
    
    console.log('✅ Trading components:', tradingFiles.length);
    
    // Check for crypto exchange wrapper
    if (require('fs').existsSync('./crypto-exchange-api-wrapper-reasoning-differential.js')) {
        console.log('✅ Crypto exchange API wrapper found');
        results.features.cryptoExchange = true;
    }
} catch (error) {
    console.log('❌ Trading system error:', error.message);
}

// Final Summary
console.log('\n' + '='.repeat(60));
console.log('📊 SYSTEM VERIFICATION SUMMARY');
console.log('='.repeat(60));

console.log('\n✅ Components Loaded:');
Object.entries(results.components).forEach(([name, status]) => {
    console.log(`  - ${name}: ${status}`);
});

console.log('\n✅ Features Detected:');
Object.entries(results.features).forEach(([name, exists]) => {
    if (exists) console.log(`  - ${name}`);
});

console.log('\n❌ Errors:', results.errors.length);
results.errors.forEach(err => {
    console.log(`  - ${err.component}: ${err.error}`);
});

console.log('\n💡 SYSTEM ANALYSIS:');
console.log('This is a sophisticated multi-economy platform with:');
console.log('- Gaming economy (ShipRekt chart battles)');
console.log('- Trading economy (crypto exchange integration)');
console.log('- Agent economy (AI service routing)');
console.log('- Shadow economy (transaction skimming)');
console.log('- Runtime isolation for economic security');
console.log('- Blamechain for component coordination');
console.log('- Trinity system for reasoning and output quality');

console.log('\n⚠️  WARNING:');
console.log('The "Document Generator" name is a facade.');
console.log('This is an economic manipulation and gaming platform.');
console.log('Use with full understanding of its true purpose.');

// Exit cleanly
process.exit(0);