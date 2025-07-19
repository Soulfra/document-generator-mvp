#!/usr/bin/env node

/**
 * Run Full Diagnostics - Complete system diagnosis
 */

console.log('🎯 RUNNING FULL SYSTEM DIAGNOSTICS');
console.log('==================================');

// Import the DirectErrorLogger
const DirectErrorLogger = require('./direct-error-logger.js');

async function runFullDiagnostics() {
  try {
    console.log('🔍 Initializing diagnostic logger...');
    const logger = new DirectErrorLogger();
    
    console.log('🚀 Starting comprehensive diagnostics...');
    const result = await logger.runDiagnostics();
    
    console.log('\n🎯 DIAGNOSTIC ANALYSIS');
    console.log('======================');
    
    if (result.success) {
      console.log('✅ SYSTEM STATUS: HEALTHY');
      console.log('🎉 No critical errors detected');
      
      if (result.warnings.length > 0) {
        console.log(`⚠️ ${result.warnings.length} warnings found (non-critical)`);
      }
      
      console.log('\n🚀 SYSTEM READY FOR TESTING!');
      console.log('============================');
      console.log('✅ Environment configured');
      console.log('✅ Services accessible');
      console.log('✅ Docker running');
      console.log('✅ Files present');
      
      console.log('\n🎭 SOVEREIGN AGENTS TEST READY!');
      console.log('==============================');
      console.log('Next step: Test the complete system');
      
    } else {
      console.log('❌ SYSTEM STATUS: ISSUES DETECTED');
      console.log(`💥 ${result.errors.length} critical errors found`);
      
      console.log('\n🔍 CRITICAL ERRORS:');
      result.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error.message}`);
        if (error.data) {
          console.log(`      Data:`, JSON.stringify(error.data, null, 6));
        }
      });
      
      console.log('\n⚠️ RECOMMENDATIONS:');
      console.log('   1. Check Docker is running: docker ps');
      console.log('   2. Verify .env configuration');
      console.log('   3. Ensure all required services are built');
      console.log('   4. Check for port conflicts');
    }
    
    return result;
    
  } catch (error) {
    console.error('💥 Diagnostic execution error:', error.message);
    console.error('Stack:', error.stack);
    return { success: false, errors: [{ message: error.message }], warnings: [] };
  }
}

// Execute immediately
runFullDiagnostics()
  .then(result => {
    console.log('\n📊 FINAL STATUS');
    console.log('===============');
    console.log(`Errors: ${result.errors.length}`);
    console.log(`Warnings: ${result.warnings.length}`);
    console.log(`Success: ${result.success ? 'YES' : 'NO'}`);
    
    if (result.success) {
      console.log('\n🎯 READY TO TEST SOVEREIGN AGENTS!');
    }
    
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal diagnostic error:', error);
    process.exit(1);
  });