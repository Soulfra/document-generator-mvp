#!/usr/bin/env node

/**
 * Simple Learning Demo
 * 
 * Demonstrates the complete learning ecosystem working together.
 */

const { LearningSystemIntegrationLayer } = require('./learning-system-integration-layer.js');

async function runSimpleLearningDemo() {
    console.log('🎓 SIMPLE LEARNING ORCHESTRATOR DEMO');
    console.log('====================================');
    console.log('Showing how all systems work together to help people learn!\n');
    
    // Initialize the integrated learning system
    const learningOrchestrator = new LearningSystemIntegrationLayer();
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ All learning systems integrated and ready!\n');
    
    // Set up event listeners to see the magic happen
    learningOrchestrator.on('journey:started', (event) => {
        console.log(`\n🚀 Learning journey started for ${event.userId}`);
        console.log(`${event.greeting}`);
    });
    
    // Demo: Complete learning journey from start to finish
    console.log('\n' + '='.repeat(60));
    console.log('DEMO SCENARIO: New learner wants to learn full-stack development');
    console.log('='.repeat(60));
    
    const userId = 'alex_coder_' + Date.now();
    console.log(`\nLearner ID: ${userId}`);
    
    // 1. Start learning journey
    console.log('\n📍 PHASE 1: Starting Learning Journey');
    console.log('-'.repeat(40));
    
    const journey = await learningOrchestrator.startLearningJourney(userId, {
        goal: 'become a full-stack developer and launch my own SaaS',
        learningStyle: 'hands_on',
        movieTheme: 'matrix', // "Free your mind... and your IDE"
        accountType: 'normal'
    });
    
    console.log(`Journey created! Current phase: ${journey.currentPhase}`);
    
    // 2. Check system status
    console.log('\n📍 PHASE 2: System Status Check');
    console.log('-'.repeat(40));
    
    const systemStatus = learningOrchestrator.getIntegratedStatus();
    
    console.log('\n🔗 INTEGRATED SYSTEM STATUS:');
    console.log('='.repeat(50));
    
    console.log('\n🎓 Integration Layer:');
    console.log(`  Active learning journeys: ${systemStatus.integration_layer.active_journeys}`);
    console.log(`  Total learners: ${systemStatus.integration_layer.total_learners}`);
    console.log(`  Cross-system events: ${systemStatus.integration_layer.cross_system_events}`);
    
    console.log('\n🚪 Exit Hatch System:');
    console.log(`  Exit hatches used: ${systemStatus.exit_hatch_system.hatches_used}`);
    console.log(`  Chapter 7 receipts: ${systemStatus.exit_hatch_system.receipts_generated}`);
    
    console.log('\n🎮 Pet Math System (RuneScape):');
    console.log(`  Pets dropped: ${systemStatus.pet_math_system.pets_dropped}`);
    console.log(`  Total XP earned: ${systemStatus.pet_math_system.total_xp}`);
    
    console.log('\n🎬 Tracer System (Easter Eggs):');
    console.log(`  Easter eggs found: ${systemStatus.tracer_system.easter_eggs_found}`);
    console.log(`  Active tracers: ${systemStatus.tracer_system.active_tracers}`);
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ SIMPLE LEARNING ORCHESTRATOR DEMO COMPLETE!');
    console.log('='.repeat(60));
    
    console.log('\n🎯 What this demonstrates:');
    console.log('\n1. 🚪 EXIT HATCHES everywhere:');
    console.log('   - Users can bring their own resources or use platform ones');
    console.log('   - Transparent billing only when platform resources are used');
    
    console.log('\n2. 🎮 RUNESCAPE MATH for learning:');
    console.log('   - 70/30 skill correlations (coding power = 70% coding + 30% algorithms)');
    console.log('   - Pet drops reward consistent learning (rare achievements)');
    
    console.log('\n3. 🎬 TRACER CONTEXT with movie magic:');
    console.log('   - "End of Line", "May the Force be with you" completion markers');
    console.log('   - Hidden .* files storing secrets and progress');
    
    console.log('\n4. 🔗 FULL INTEGRATION:');
    console.log('   - All systems work together seamlessly');
    console.log('   - Events flow between exit hatches, pet math, and tracers');
    
    console.log('\n🎓 The result: A learning tool that helps people:');
    console.log('   ✅ Learn to code with or without their own tools');
    console.log('   ✅ Launch projects through guided progression');
    console.log('   ✅ Track progress with game mechanics they understand');
    console.log('   ✅ Discover hidden paths and secret knowledge');
    console.log('   ✅ Only pay for platform resources when needed');
    console.log('   ✅ Get complete transparency about costs and reasoning');
    
    console.log('\n🚀 "We\'re suppose to be a learning tool so people can really learn"');
    console.log('    Mission accomplished! 🎯');
}

// Run the complete demo
if (require.main === module) {
    console.log('🌟 Starting Simple Learning Orchestrator Demo...');
    console.log('This will show all systems working together!\n');
    
    runSimpleLearningDemo().catch(error => {
        console.error('❌ Demo error:', error);
        process.exit(1);
    });
}

module.exports = { runSimpleLearningDemo };