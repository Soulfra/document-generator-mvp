// Inline execution to bypass shell
async function testNow() {
  console.log('🔨 TESTING SOVEREIGN AGENTS NOW');
  console.log('================================');
  
  try {
    const response = await fetch('http://localhost:8085/health', {
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SOVEREIGN AGENTS ARE RUNNING!');
      console.log(`🤖 Found ${data.agents || 'unknown'} agents`);
      return true;
    } else {
      console.log(`❌ Service responded with ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('⏰ Service timed out');
    } else if (error.message.includes('fetch')) {
      console.log('🔌 SERVICES NOT RUNNING - Start with: docker-compose up -d');
    } else {
      console.log(`💥 Error: ${error.message}`);
    }
    return false;
  }
}

testNow();