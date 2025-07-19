#!/usr/bin/env node

/**
 * Run Bypass Now - Execute environment bypass immediately
 */

console.log('🔓 EXECUTING ENVIRONMENT BYPASS NOW');
console.log('===================================');

// Import and execute the bypass class directly
const EnvironmentBypass = require('./bypass-environment-blocks.js');

async function runBypassNow() {
  try {
    const bypass = new EnvironmentBypass();
    const result = await bypass.run();
    
    console.log('\n🎉 BYPASS EXECUTION COMPLETE!');
    console.log('=============================');
    
    if (result !== false) {
      console.log('✅ Environment bypass successful');
      console.log('✅ Valid .env created');
      console.log('✅ Feature flags configured');
      
      console.log('\n🚀 NEXT STEPS:');
      console.log('   1. node disable-blocking-features.js');
      console.log('   2. docker-compose up -d');
      console.log('   3. node direct-error-logger.js');
      console.log('   4. Test sovereign agents');
      
      return true;
    } else {
      console.log('❌ Environment bypass failed');
      return false;
    }
    
  } catch (error) {
    console.error('💥 Bypass execution error:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Execute immediately
runBypassNow()
  .then(success => {
    console.log(success ? '\n🎯 Ready to proceed!' : '\n⚠️ Manual intervention required');
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });