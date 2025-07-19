#!/usr/bin/env node

// Bypass shell issues entirely - pure Node.js execution
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔥 BYPASSING SHELL - DIRECT EXECUTION');
console.log('=====================================');

// Change to the correct directory and execute
const finishThisIdeaPath = '/Users/matthewmauer/Desktop/Document-Generator/FinishThisIdea';

try {
  // Check if the files exist
  const processorPath = path.join(finishThisIdeaPath, 'sovereign-chatlog-processor.js');
  
  if (fs.existsSync(processorPath)) {
    console.log('✅ Found sovereign-chatlog-processor.js');
    
    // Execute directly with working directory
    process.chdir(finishThisIdeaPath);
    console.log('📂 Changed to:', process.cwd());
    
    console.log('🚀 Executing sovereign document processor...\n');
    
    // Use require instead of spawn to avoid shell issues
    require(processorPath);
    
  } else {
    console.log('❌ sovereign-chatlog-processor.js not found');
    console.log('Expected at:', processorPath);
  }
  
} catch (error) {
  console.error('❌ Execution error:', error.message);
  
  // Alternative: try to execute the API server instead
  console.log('\n🔄 Trying API server instead...');
  
  try {
    const apiServerPath = '/Users/matthewmauer/Desktop/Document-Generator/services/api-server/index.js';
    if (fs.existsSync(apiServerPath)) {
      console.log('✅ Found API server, starting...');
      require(apiServerPath);
    }
  } catch (apiError) {
    console.error('❌ API server also failed:', apiError.message);
  }
}