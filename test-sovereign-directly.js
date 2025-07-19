#!/usr/bin/env node

/**
 * Direct Sovereign Agents Test - No shell dependencies
 */

console.log('🔨 DIRECT SOVEREIGN AGENTS TEST');
console.log('================================');
console.log('🎭 Testing your "conductor of orchestration with soul-like agents"');
console.log('Vision: "I was a conductor of orchestration and it would be responsive like a soul"');
console.log('');

async function testSovereignAgents() {
  const tests = [
    { 
      name: 'Sovereign Agents Health', 
      url: 'http://localhost:8085/health',
      description: 'Are your agents alive?'
    },
    { 
      name: 'Agent Roster', 
      url: 'http://localhost:8085/api/sovereign/agents',
      description: 'DocumentAnalyzer_Prime, TemplateSelector_Alpha, CodeGenerator_Beta ready?'
    },
    { 
      name: 'Conductor Interface', 
      url: 'http://localhost:8085/api/sovereign/conductor/pending',
      description: 'Human oversight system operational?'
    }
  ];
  
  let passedTests = 0;
  let servicesRunning = false;
  
  console.log('🐳 Testing Sovereign Agents services...\n');
  
  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      console.log(`   ${test.description}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(test.url, { 
        signal: controller.signal,
        headers: { 'User-Agent': 'Direct-Sovereign-Test/1.0' }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ PASSED: ${test.name} (${response.status})`);
        
        // Special handling for specific endpoints
        if (test.name === 'Sovereign Agents Health') {
          servicesRunning = true;
          if (data.agents >= 3) {
            console.log(`   🤖 Found ${data.agents} agents ready for orchestration`);
          }
        }
        
        if (test.name === 'Agent Roster' && data.agents && data.agents.length >= 3) {
          console.log(`   🎭 Verified agents: ${data.agents.map(a => a.name).join(', ')}`);
          console.log(`   👻 Soul-like personalities loaded`);
        }
        
        passedTests++;
      } else {
        console.log(`❌ FAILED: ${test.name} (${response.status})`);
        const errorText = await response.text();
        console.log(`   Error: ${errorText}`);
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`⏰ TIMEOUT: ${test.name} (service not responding)`);
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
        console.log(`🔌 NOT RUNNING: ${test.name}`);
        console.log(`   💡 Service appears to be offline`);
      } else {
        console.log(`💥 ERROR: ${test.name} - ${error.message}`);
      }
    }
    
    console.log(''); // Add spacing
  }
  
  // Test document processing if services are running
  if (servicesRunning) {
    console.log('📄 Testing document processing pipeline...');
    try {
      const docResponse = await fetch('http://localhost:8085/api/sovereign/process-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentContent: '# Test SaaS Idea\\n\\nBuild an AI meeting assistant that schedules meetings automatically.',
          documentType: 'markdown',
          userId: 'conductor-test'
        }),
        signal: AbortSignal.timeout(8000)
      });
      
      if (docResponse.ok) {
        const docData = await docResponse.json();
        console.log('✅ PASSED: Document Processing');
        if (docData.sessionId) {
          console.log(`   🎯 Session created: ${docData.sessionId}`);
          console.log(`   🎼 Your digital orchestra is processing!`);
        }
        passedTests++;
      } else {
        console.log(`❌ FAILED: Document Processing (${docResponse.status})`);
      }
    } catch (error) {
      console.log(`💥 ERROR: Document processing - ${error.message}`);
    }
    
    console.log('');
  }
  
  // Final Results
  console.log('🎯 FINAL RESULTS');
  console.log('================');
  
  if (passedTests === 0) {
    console.log('🔌 SERVICES NOT RUNNING');
    console.log('');
    console.log('💡 SOLUTION: Start Docker services:');
    console.log('   docker-compose up -d');
    console.log('   sleep 60');
    console.log('   node test-sovereign-directly.js');
    console.log('');
    console.log('📋 ALTERNATIVE: Manual check:');
    console.log('   docker-compose ps');
    console.log('   docker-compose logs sovereign-agents');
    
  } else if (passedTests >= 3) {
    console.log('🏆 SUCCESS: Your Sovereign Agents are operational!');
    console.log('🎼 Your "conductor of orchestration" is ready!');
    console.log('');
    console.log('🎭 ACCESS YOUR DIGITAL ORCHESTRA:');
    console.log('   • Health: http://localhost:8085/health');
    console.log('   • Agents: http://localhost:8085/api/sovereign/agents');
    console.log('   • Process: POST to http://localhost:8085/api/sovereign/process-document');
    console.log('   • Monitor: ws://localhost:8085');
    console.log('');
    console.log('🎯 NEXT STEPS:');
    console.log('   1. Upload a business document');
    console.log('   2. Watch your agents analyze it');
    console.log('   3. See your MVP generated');
    console.log('   4. Conduct your digital orchestra!');
    
  } else {
    console.log('⚠️ PARTIAL SUCCESS: Some services working');
    console.log(`   Tests passed: ${passedTests}`);
    console.log('   Some agents may need attention');
  }
  
  console.log('');
  console.log('🎭 "Responsive like a soul" - Your vision awaits!');
  
  return passedTests >= 3;
}

// Execute the test
testSovereignAgents()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test execution failed:', error);
    process.exit(1);
  });