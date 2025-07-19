#!/usr/bin/env node

console.log('🏦 RUNNING DUAL ECONOMY SIMULATION');
console.log('==================================');

try {
  const DualEconomySimulator = require('./dual-economy-simulator.js');
  
  async function runSimulation() {
    console.log('🚀 Starting simulation...');
    
    const simulator = new DualEconomySimulator();
    
    // Start the simulation
    await simulator.startSimulation();
    
    // Let it run for a bit, then run pen tests
    setTimeout(async () => {
      console.log('\n🔒 Starting pen tests...');
      await simulator.penTest();
      
      console.log('\n🎉 Simulation complete!');
    }, 10000); // 10 seconds
  }
  
  runSimulation().catch(console.error);
  
} catch (error) {
  console.error('💥 Simulation failed:', error.message);
  console.error(error.stack);
}