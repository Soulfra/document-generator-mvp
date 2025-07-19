#!/usr/bin/env node

// Test deployment plan execution
const DeploymentPlan = require('./deployment-plan.js');

async function testDeployment() {
  console.log('Testing deployment plan...');
  
  const plan = new DeploymentPlan();
  
  try {
    // Phase 1: Plan
    await plan.planDeployment();
    
    // Phase 2: Present
    const recommended = await plan.presentOptions();
    
    // Phase 3: Execute (using recommended option)
    const result = await plan.executeDeployment(recommended.option.id);
    
    // Generate final report
    const report = plan.generateReport(result);
    
    console.log('\n🎉 DEPLOYMENT PLANNING COMPLETE!');
    console.log('Final result:', result);
    
    return report;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

testDeployment();