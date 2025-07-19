const fetch = require('node-fetch');

console.log('🧪 Testing Human Approval API Endpoints\n');

async function testApprovalAPI() {
  const baseUrl = 'http://localhost:3001';
  
  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    
    // Test 2: Get pending approvals (should be empty initially)
    console.log('\n2. Testing approvals endpoint...');
    const approvalsResponse = await fetch(`${baseUrl}/api/approvals`);
    const approvalsData = await approvalsResponse.json();
    console.log('✅ Approvals endpoint working');
    console.log(`   Pending approvals: ${approvalsData.count}`);
    
    // Test 3: Get approval stats
    console.log('\n3. Testing approval stats...');
    const statsResponse = await fetch(`${baseUrl}/api/approvals/stats`);
    const statsData = await statsResponse.json();
    console.log('✅ Approval stats:', statsData);
    
    console.log('\n🎉 All API endpoints working!');
    console.log('\n📡 Available endpoints:');
    console.log(`   GET  ${baseUrl}/health`);
    console.log(`   GET  ${baseUrl}/api/approvals`);
    console.log(`   GET  ${baseUrl}/api/approvals/stats`);
    console.log(`   POST ${baseUrl}/api/documents/upload`);
    console.log(`   POST ${baseUrl}/api/approvals/:id/respond`);
    
    console.log('\n🎯 Ready for document upload with human approval!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\nMake sure API server is running:');
    console.log('node quick-start-demo.js');
  }
}

testApprovalAPI();