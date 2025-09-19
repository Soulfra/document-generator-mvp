#!/usr/bin/env node

/**
 * Test Energy-Enhanced Context Profiles
 * 
 * Demonstrates how energy cards power context deduction
 * and profile switching.
 */

const ContextProfileManager = require('./context-profiles');

async function testEnergyContext() {
    console.log('\n🧪 Testing Energy-Enhanced Context Profiles\n');
    
    // Create profile manager (includes energy cards)
    const profileManager = new ContextProfileManager();
    
    // Show initial state
    console.log('📊 Initial State:');
    console.log(`Current Profile: ${profileManager.currentProfile}`);
    console.log(`Energy Cards: ${profileManager.energyCards.inventory.size}`);
    
    // Show energy profile
    console.log('\n⚡ Energy Profile:');
    const energyProfile = profileManager.energyCards.getEnergyProfile();
    console.log(`Total Energy: ${energyProfile.totalEnergy}/${energyProfile.totalCapacity}`);
    console.log(`Card Types: ${Object.keys(energyProfile.cardsByType).length}`);
    
    // Test context deduction
    console.log('\n🔮 Testing Context Deduction...');
    try {
        // First, ensure we have the required cards
        const required = ['userProfile', 'history', 'location', 'device'];
        for (const cardType of required) {
            const cards = profileManager.energyCards.getCardsByType(cardType);
            if (cards.length === 0) {
                console.log(`Adding ${cardType} card...`);
                profileManager.energyCards.addCard(cardType, 100);
            }
        }
        
        const context = await profileManager.deduceContextFromEnergy();
        console.log('✅ Context deduced successfully!');
        console.log(`Confidence: ${Math.round(context.confidence * 100)}%`);
        console.log(`User Level: ${context.user.level}`);
        console.log(`Device Power: ${context.device.powerLevel}%`);
        
    } catch (error) {
        console.error('❌ Context deduction failed:', error.message);
    }
    
    // Test profile validation
    console.log('\n🔍 Testing Profile Energy Validation...');
    const profiles = ['development', 'staging', 'production', 'remote'];
    
    for (const profile of profiles) {
        const validation = await profileManager.validateEnergyForProfile(profile);
        const status = validation.valid ? '✅' : '❌';
        console.log(`${status} ${profile}: ${validation.valid ? 'Ready' : 'Missing: ' + validation.missing.join(', ')}`);
    }
    
    // Test profile switching with energy
    console.log('\n🔄 Testing Energy-Based Profile Switching...');
    try {
        // Try to switch to staging
        console.log('Attempting to switch to staging profile...');
        
        // Add required cards for staging if missing
        const stagingReq = profileManager.energyRequirements.get('staging');
        for (const cardType of stagingReq.required) {
            const cards = profileManager.energyCards.getCardsByType(cardType);
            if (cards.length === 0) {
                console.log(`Adding ${cardType} card for staging...`);
                profileManager.energyCards.addCard(cardType, 100);
            }
        }
        
        await profileManager.switchProfile('staging');
        console.log('✅ Successfully switched to staging!');
        
        // Show energy consumption
        const afterSwitch = profileManager.energyCards.getEnergyProfile();
        console.log(`Energy consumed: ${energyProfile.totalEnergy - afterSwitch.totalEnergy}`);
        
    } catch (error) {
        console.error('❌ Profile switch failed:', error.message);
    }
    
    // Test card combinations
    console.log('\n🎴 Testing Card Combinations...');
    const combinations = profileManager.energyCards.combinations;
    console.log(`Available combinations: ${combinations.size}`);
    
    for (const [name, combo] of combinations) {
        console.log(`\n  ${combo.name}:`);
        console.log(`    Required: ${combo.required.join(', ')}`);
        console.log(`    Output: ${combo.output}`);
        
        // Check if we can execute it
        try {
            // Don't actually execute all, just check
            const hasCards = combo.required.every(type => 
                profileManager.energyCards.getCardsByType(type).length > 0
            );
            console.log(`    Status: ${hasCards ? '✅ Available' : '❌ Missing cards'}`);
        } catch (error) {
            console.log(`    Status: ❌ Error checking`);
        }
    }
    
    // Show final energy status
    console.log('\n📊 Final Energy Status:');
    const finalStatus = profileManager.getEnergyAwareStatus();
    console.log(`Profile: ${finalStatus.currentProfile}`);
    console.log(`Total Cards: ${finalStatus.energy.profile.totalCards}`);
    console.log(`Average Charge: ${Math.round(finalStatus.energy.profile.averageCharge)}%`);
    
    // Energy flow analysis
    console.log('\n🌊 Energy Flow Patterns:');
    const flows = profileManager.energyCards.energyFlows;
    const regenCount = flows.filter(f => f.action === 'regen').length;
    const useCount = flows.filter(f => f.action === 'use').length;
    console.log(`Regeneration events: ${regenCount}`);
    console.log(`Usage events: ${useCount}`);
    
    console.log('\n✨ Test complete!');
}

// Run the test
testEnergyContext().catch(console.error);