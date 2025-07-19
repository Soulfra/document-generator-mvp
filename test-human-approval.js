const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

console.log('👤 Testing Human-in-the-Loop Document Processing\n');

async function testHumanApprovalFlow() {
  try {
    // Create test document
    const testDocument = `# E-Commerce Platform

## Features Needed
- User registration and login
- Product catalog with search
- Shopping cart functionality
- Payment processing with Stripe
- Order management
- Admin dashboard

## Technical Requirements
- React frontend
- Node.js backend
- PostgreSQL database
- JWT authentication

## User Stories
As a customer, I want to browse products so that I can find items to purchase.
As a customer, I want to add items to cart so that I can buy multiple products.
As an admin, I want to manage inventory so that I can track stock levels.

## Constraints
- Budget: $15,000
- Timeline: 2 months
- Performance: Support 500+ concurrent users
`;

    fs.writeFileSync('/tmp/ecommerce-spec.md', testDocument);

    console.log('📤 Step 1: Uploading document with human approval enabled...');
    
    // Upload document with human approval enabled
    const form = new FormData();
    form.append('document', fs.createReadStream('/tmp/ecommerce-spec.md'));
    form.append('analysisType', 'comprehensive');
    form.append('generateCode', 'true');
    form.append('humanApproval', 'true'); // Enable human approval
    form.append('deploymentTarget', 'docker');
    
    const uploadResponse = await fetch('http://localhost:3001/api/documents/upload', {
      method: 'POST',
      body: form
    });
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload result:', uploadResult);
    
    if (!uploadResult.success) {
      throw new Error('Upload failed');
    }
    
    const jobId = uploadResult.jobId;
    
    console.log(`\n🚀 Step 2: Starting processing with human approval...`);
    
    // Start processing
    const processResponse = await fetch(`http://localhost:3001/api/documents/${jobId}/process`, {
      method: 'POST'
    });
    
    const processResult = await processResponse.json();
    console.log('✅ Processing started:', processResult);
    
    console.log('\n⏳ Step 3: Waiting for approval requests...');
    
    // Monitor for approval requests
    let approvalFound = false;
    let attempts = 0;
    const maxAttempts = 30; // Wait up to 30 seconds
    
    while (!approvalFound && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      // Check for pending approvals
      const approvalsResponse = await fetch('http://localhost:3001/api/approvals');
      const approvalsData = await approvalsResponse.json();
      
      if (approvalsData.approvals && approvalsData.approvals.length > 0) {
        const jobApprovals = approvalsData.approvals.filter(a => a.jobId === jobId);
        
        if (jobApprovals.length > 0) {
          approvalFound = true;
          const approval = jobApprovals[0];
          
          console.log(`\n👤 Step 4: Found approval request!`);
          console.log(`   Type: ${approval.type}`);
          console.log(`   Title: ${approval.title}`);
          console.log(`   Description: ${approval.description}`);
          console.log(`   Options: ${approval.options.join(', ')}`);
          console.log(`   Approval ID: ${approval.id}`);
          
          // Show the data being approved
          if (approval.data) {
            console.log(`\n📋 Data for approval:`);
            if (approval.data.features) {
              console.log(`   Features: ${approval.data.features.length} found`);
              approval.data.features.slice(0, 3).forEach(f => {
                console.log(`     - ${f.name}: ${f.description}`);
              });
            }
            if (approval.data.userStories) {
              console.log(`   User Stories: ${approval.data.userStories.length} found`);
            }
            if (approval.data.technology) {
              console.log(`   Technology Stack: ${JSON.stringify(approval.data.technology)}`);
            }
          }
          
          console.log(`\n✅ Step 5: Auto-approving for demo...`);
          
          // Auto-approve the request
          const approvalResponse = await fetch(`http://localhost:3001/api/approvals/${approval.id}/respond`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              decision: 'approve',
              comment: 'Auto-approved for demo purposes',
              respondedBy: 'demo-user'
            })
          });
          
          const approvalResult = await approvalResponse.json();
          console.log('✅ Approval response:', approvalResult);
          
          console.log('\n📊 Step 6: Monitoring for additional approvals...');
          console.log('   The system may request approval for:');
          console.log('   - Requirements review');
          console.log('   - Architecture design'); 
          console.log('   - Code structure');
          
          // Continue monitoring for more approvals
          await monitorAdditionalApprovals(jobId);
        }
      }
      
      attempts++;
    }
    
    if (!approvalFound) {
      console.log('⚠️  No approval requests found within timeout period');
      console.log('   This might mean:');
      console.log('   - Processing is still in early stages');
      console.log('   - Human approval is disabled');
      console.log('   - Processing failed before reaching approval stage');
    }
    
    console.log('\n📈 Step 7: Final status check...');
    const statusResponse = await fetch(`http://localhost:3001/api/documents/${jobId}`);
    const statusData = await statusResponse.json();
    
    console.log(`   Job Status: ${statusData.status}`);
    console.log(`   Progress: ${statusData.progress}%`);
    console.log(`   Current Step: ${statusData.currentStep}`);
    
    if (statusData.status === 'completed') {
      console.log('\n🎉 Document processing completed with human approval!');
      console.log(`📥 Results available at: http://localhost:3001/api/documents/${jobId}/results`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure:');
    console.log('1. API server is running: cd services/api-server && node index.js');
    console.log('2. All dependencies are installed: npm install');
  }
}

async function monitorAdditionalApprovals(jobId) {
  let monitoring = true;
  let monitorAttempts = 0;
  const maxMonitorAttempts = 60; // Monitor for 1 minute
  
  while (monitoring && monitorAttempts < maxMonitorAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check for new approvals
    const approvalsResponse = await fetch('http://localhost:3001/api/approvals');
    const approvalsData = await approvalsResponse.json();
    
    const pendingApprovals = approvalsData.approvals.filter(a => 
      a.jobId === jobId && a.status === 'pending'
    );
    
    if (pendingApprovals.length > 0) {
      for (const approval of pendingApprovals) {
        console.log(`\n👤 New approval request: ${approval.title}`);
        console.log(`   Type: ${approval.type}`);
        
        // Auto-approve all for demo
        const approvalResponse = await fetch(`http://localhost:3001/api/approvals/${approval.id}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            decision: 'approve',
            comment: 'Auto-approved for demo',
            respondedBy: 'demo-user'
          })
        });
        
        const result = await approvalResponse.json();
        console.log(`✅ Auto-approved: ${approval.title}`);
      }
    }
    
    // Check if job is complete
    const statusResponse = await fetch(`http://localhost:3001/api/documents/${jobId}`);
    const statusData = await statusResponse.json();
    
    if (statusData.status === 'completed' || statusData.status === 'failed') {
      monitoring = false;
      console.log(`\n🏁 Monitoring stopped - Job ${statusData.status}`);
    }
    
    monitorAttempts++;
  }
}

console.log('🎬 Starting Human-in-the-Loop Demo...');
console.log('This will:');
console.log('1. Upload a document with human approval enabled');
console.log('2. Monitor for approval requests');
console.log('3. Auto-approve them for demo purposes');
console.log('4. Show the complete flow\n');

testHumanApprovalFlow();