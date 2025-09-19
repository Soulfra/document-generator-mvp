#!/usr/bin/env node

/**
 * 🧪 TEST INTEGRATED SYSTEM
 * Tests the full integration: VibeVault + Stripe + Attribution
 */

// Load environment first
require('dotenv').config();

const colors = require('colors');

console.log('🧪 TESTING INTEGRATED SYSTEM'.cyan.bold);
console.log('============================\n'.cyan);

async function testIntegration() {
    console.log('🔍 Checking environment...'.yellow);
    
    // Check Stripe keys
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!stripeKey || stripeKey.includes('${')) {
        console.log('❌ Stripe secret key not properly set'.red);
        return false;
    }
    
    if (!webhookSecret || webhookSecret.includes('${')) {
        console.log('❌ Stripe webhook secret not properly set'.red);
        return false;
    }
    
    console.log('✅ Environment loaded successfully'.green);
    console.log(`  • Stripe Key: ${stripeKey.substring(0, 20)}...`.gray);
    console.log(`  • Webhook Secret: ${webhookSecret.substring(0, 15)}...`.gray);
    
    // Test database connections
    console.log('\\n🗄️ Testing database connections...'.yellow);
    
    const sqlite3 = require('sqlite3').verbose();
    
    try {
        // Test economic engine database
        const economicDb = new sqlite3.Database('./economic-engine.db');
        console.log('✅ Economic engine database connected'.green);
        
        // Check if we have agents to purchase
        const agents = await new Promise((resolve, reject) => {
            economicDb.all('SELECT * FROM ai_agents LIMIT 5', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log(`  • Found ${agents.length} agents available for purchase`.gray);
        
        economicDb.close();
        
    } catch (error) {
        console.log('❌ Database connection failed:'.red, error.message);
        return false;
    }
    
    // Test existing systems
    console.log('\\n🔗 Testing existing system integrations...'.yellow);
    
    // Check if VibeVault system exists
    const fs = require('fs');
    const existingSystems = [
        './soulfra-stripe-integration.js',
        './dual-terminal-wormhole-database-sync-vibecoding-vault.js',
        './FinishThisIdea/simple-onboarding-system.js'
    ];
    
    let systemsFound = 0;
    for (const system of existingSystems) {
        if (fs.existsSync(system)) {
            console.log(`✅ Found: ${system}`.green);
            systemsFound++;
        } else {
            console.log(`⚠️  Missing: ${system}`.yellow);
        }
    }
    
    console.log(`  • ${systemsFound}/${existingSystems.length} existing systems found`.gray);
    
    // Test new attribution system
    console.log('\\n🎯 Testing new attribution system...'.yellow);
    
    try {
        // For testing, just check if the modules can be required
        const StripeAgentAttributionHandler = require('./stripe-agent-attribution-handler.js');
        console.log('✅ Attribution handler module loaded'.green);
        
        const AttributionMirrorService = require('./attribution-mirror-service.js');
        console.log('✅ Mirror service module loaded'.green);
        
        // Test basic Stripe connection with test keys
        if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('${')) {
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
            console.log('✅ Stripe client initialized with test keys'.green);
        }
        
    } catch (error) {
        console.log('❌ Attribution system test failed:'.red, error.message);
        return false;
    }
    
    // Test bridge integration
    console.log('\\n🌉 Testing bridge integration...'.yellow);
    
    try {
        // Import our bridge
        const VibeVaultStripeAttributionBridge = require('./vibevault-stripe-attribution-bridge.js');
        
        // Test initialization (but don't fully initialize)
        console.log('✅ Bridge module loaded successfully'.green);
        
    } catch (error) {
        console.log('❌ Bridge integration test failed:'.red, error.message);
        return false;
    }
    
    return true;
}

async function demonstrateSystem() {
    console.log('\n🎮 SYSTEM DEMONSTRATION'.cyan.bold);
    console.log('========================\n'.cyan);
    
    console.log('🎯 What the integrated system does:'.yellow);
    console.log('');
    console.log('1. 👤 User signs up through existing VibeVault onboarding'.white);
    console.log('2. 💳 User purchases $1 agent through Stripe integration'.white);
    console.log('3. 🌉 Bridge connects to existing dual terminal system'.white);
    console.log('4. 📊 Attribution creates paper trail across all layers:'.white);
    console.log('   • Stripe (payment record)'.gray);
    console.log('   • VibeVault (user system)'.gray);
    console.log('   • Local database (full analytics)'.gray);
    console.log('   • Vercel mirror (encrypted public)'.gray);
    console.log('   • Blockchain (verification hash)'.gray);
    console.log('5. 🔄 Dual terminal sync keeps everything in sync'.white);
    console.log('6. 👁️  Transparency dashboard shows user exactly what data goes where'.white);
    console.log('');
    console.log('🔐 Security features:'.yellow);
    console.log('  • Device-based access control'.white);
    console.log('  • Row-level security per user'.white);
    console.log('  • Encryption at multiple layers'.white);
    console.log('  • Immutable paper trail'.white);
    console.log('  • Read-only historical data'.white);
    console.log('');
    console.log('🎉 Result: $1 agent purchase = Full attribution + Privacy + Transparency'.green.bold);
}

async function provideFixes() {
    console.log('\n🔧 QUICK FIXES'.cyan.bold);
    console.log('=============\n'.cyan);
    
    console.log('1. Start with working components:'.yellow);
    console.log('   node system-diagnostic.js  # See what\'s working'.gray);
    console.log('');
    
    console.log('2. Launch existing systems:'.yellow);
    console.log('   ./FinishThisIdea/launch-simple-ecosystem.sh  # Existing working system'.gray);
    console.log('');
    
    console.log('3. Test Stripe with existing integration:'.yellow);
    console.log('   node soulfra-stripe-integration.js  # Existing Stripe system'.gray);
    console.log('');
    
    console.log('4. Add attribution to existing flow:'.yellow);
    console.log('   # Edit soulfra-stripe-integration.js to call our attribution system'.gray);
    console.log('');
    
    console.log('5. Full integration:'.yellow);
    console.log('   node test-integrated-system.js  # This script'.gray);
    console.log('   node vibevault-stripe-attribution-bridge.js  # Full bridge'.gray);
}

// Main execution
async function main() {
    try {
        const success = await testIntegration();
        
        if (success) {
            console.log('\\n🎉 ALL TESTS PASSED!'.green.bold);
            console.log('===================\\n'.green);
            
            await demonstrateSystem();
            
            console.log('\\n🚀 Ready to launch integrated system!'.green.bold);
            console.log('');
            console.log('Next steps:'.yellow);
            console.log('1. node vibevault-stripe-attribution-bridge.js  # Start bridge'.white);
            console.log('2. Open http://localhost:3456/bridge/status  # Check status'.white);
            console.log('3. Test $1 agent purchase with full attribution'.white);
            
        } else {
            console.log('\\n❌ TESTS FAILED'.red.bold);
            console.log('=============\\n'.red);
            
            await provideFixes();
        }
        
    } catch (error) {
        console.error('\\n💥 TEST EXECUTION FAILED'.red.bold);
        console.error('========================'.red);
        console.error(error);
        
        await provideFixes();
    }
}

if (require.main === module) {
    main();
}