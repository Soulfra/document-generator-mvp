const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

console.log('📤 Testing Document Upload\n');

async function testDocumentUpload() {
  try {
    // Create a test document
    const testDocument = `# E-Commerce Platform Requirements

## Overview
Build a modern e-commerce platform for selling products online.

## Features
- User registration and authentication
- Product catalog with search
- Shopping cart functionality
- Secure payment processing
- Order management
- Admin dashboard

## Technical Requirements
- React frontend
- Node.js backend with Express
- PostgreSQL database
- JWT authentication
- Stripe payment integration
- Docker deployment

## User Stories
As a customer, I want to browse products so that I can find items to purchase.
As a customer, I want to add items to cart so that I can buy multiple products.
As an admin, I want to manage inventory so that I can track stock levels.

## Constraints
- Budget: $25,000
- Timeline: 3 months
- Performance: Support 1000+ concurrent users
- Security: PCI compliance required
`;

    // Write test document
    fs.writeFileSync('/tmp/test-ecommerce-spec.md', testDocument);
    
    // Create form data
    const form = new FormData();
    form.append('document', fs.createReadStream('/tmp/test-ecommerce-spec.md'));
    form.append('analysisType', 'comprehensive');
    form.append('generateCode', 'true');
    form.append('deploymentTarget', 'docker');
    
    console.log('📤 Uploading test document...');
    
    // Upload document
    const uploadResponse = await fetch('http://localhost:3001/api/documents/upload', {
      method: 'POST',
      body: form
    });
    
    const uploadResult = await uploadResponse.json();
    console.log('✅ Upload result:', uploadResult);
    
    if (uploadResult.success) {
      console.log(`\n🎯 Document uploaded with job ID: ${uploadResult.jobId}`);
      console.log(`📊 Processing URL: http://localhost:3001${uploadResult.nextStep}`);
      
      // Start processing
      console.log('\n🚀 Starting document processing...');
      const processResponse = await fetch(`http://localhost:3001/api/documents/${uploadResult.jobId}/process`, {
        method: 'POST'
      });
      
      const processResult = await processResponse.json();
      console.log('✅ Processing started:', processResult);
      
      console.log('\n📡 Monitor progress at:');
      console.log(`- Status: GET http://localhost:3001/api/documents/${uploadResult.jobId}`);
      console.log(`- WebSocket: ws://localhost:3001/socket.io/`);
      console.log(`- Results: GET http://localhost:3001/api/documents/${uploadResult.jobId}/results`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure the API server is running:');
    console.log('cd services/api-server && node index.js');
  }
}

testDocumentUpload();