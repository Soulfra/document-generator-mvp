// Pure HTTP test - no shell dependencies

async function testSovereignAgentsHTTP() {
  console.log('🔨 HTTP-ONLY SOVEREIGN AGENTS TEST');
  console.log('===================================');
  console.log('🎭 Testing: "conductor of orchestration with soul-like agents"');
  console.log('');

  const tests = [
    {
      name: 'Health Check',
      url: 'http://localhost:8085/health',
      method: 'GET'
    },
    {
      name: 'Agent List',
      url: 'http://localhost:8085/api/sovereign/agents',
      method: 'GET'
    },
    {
      name: 'Document Processing',
      url: 'http://localhost:8085/api/sovereign/process-document',
      method: 'POST',
      body: {
        documentContent: '# Test Business Idea\n\nBuild an AI meeting scheduler',
        documentType: 'markdown',
        userId: 'test-conductor'
      }
    }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}...`);
      
      const options = {
        method: test.method,
        signal: AbortSignal.timeout(8000),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'HTTP-Only-Test/1.0'
        }
      };

      if (test.body) {
        options.body = JSON.stringify(test.body);
      }

      const response = await fetch(test.url, options);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ PASSED: ${test.name} (${response.status})`);
        
        if (test.name === 'Health Check' && data.agents) {
          console.log(`   🤖 Found ${data.agents} agents`);
        }
        if (test.name === 'Agent List' && data.agents) {
          console.log(`   🎭 Agents: ${data.agents.map(a => a.name).join(', ')}`);
        }
        if (test.name === 'Document Processing' && data.sessionId) {
          console.log(`   🎯 Session: ${data.sessionId}`);
        }
        
        passed++;
      } else {
        console.log(`❌ FAILED: ${test.name} (${response.status})`);
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`⏰ TIMEOUT: ${test.name}`);
      } else if (error.message.includes('fetch')) {
        console.log(`🔌 NOT RUNNING: ${test.name}`);
        if (test.name === 'Health Check') {
          console.log('   💡 Start services: docker-compose up -d');
        }
      } else {
        console.log(`💥 ERROR: ${test.name} - ${error.message}`);
      }
    }
    console.log('');
  }

  console.log('🎯 FINAL RESULTS:');
  console.log('=================');
  
  if (passed === total) {
    console.log('🏆 SUCCESS: All tests passed!');
    console.log('🎼 Your Sovereign Agents are operational!');
    console.log('🎭 "Conductor of orchestration with soul-like agents" is READY!');
    return true;
  } else if (passed === 0) {
    console.log('🔌 SERVICES NOT RUNNING');
    console.log('💡 Run: docker-compose up -d');
    return false;
  } else {
    console.log(`⚠️ PARTIAL: ${passed}/${total} tests passed`);
    return false;
  }
}

// Execute immediately
testSovereignAgentsHTTP()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Test failed:', error);
    process.exit(1);
  });