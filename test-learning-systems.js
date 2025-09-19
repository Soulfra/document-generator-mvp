#!/usr/bin/env node

/**
 * Simple test of all learning systems
 */

console.log('🎓 Testing Learning Systems...\n');

// Test individual components first
try {
    console.log('1. Testing Learning Tool Exit Hatch System...');
    const { LearningToolExitHatchSystem } = require('./learning-tool-exit-hatch-system.js');
    const exitHatchSystem = new LearningToolExitHatchSystem();
    console.log('✅ Exit Hatch System loaded');
    
    console.log('\n2. Testing RuneScape Pet Math Learning System...');
    const { RuneScapePetMathLearningSystem } = require('./runescape-pet-math-learning-system.js');
    const petMathSystem = new RuneScapePetMathLearningSystem();
    console.log('✅ Pet Math System loaded');
    
    console.log('\n3. Testing Tracer Context Easter Egg System...');
    const { TracerContextEasterEggSystem } = require('./tracer-context-easter-egg-system.js');
    const tracerSystem = new TracerContextEasterEggSystem();
    console.log('✅ Tracer System loaded');
    
    console.log('\n4. Testing Integration Layer...');
    const { LearningSystemIntegrationLayer } = require('./learning-system-integration-layer.js');
    const integrationLayer = new LearningSystemIntegrationLayer();
    console.log('✅ Integration Layer loaded');
    
    console.log('\n🎉 All systems loaded successfully!');
    console.log('\nNext: Run the full demo with:');
    console.log('node unified-learning-orchestrator-demo.js');
    
} catch (error) {
    console.error('❌ Error loading systems:', error.message);
    console.error('\nStack trace:', error.stack);
}