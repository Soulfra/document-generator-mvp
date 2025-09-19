#!/usr/bin/env node
/**
 * TEST INTEGRATION - Shows how services work together
 */

const axios = require('axios');

async function testIntegration() {
    console.log('=== DOCUMENT GENERATOR INTEGRATION TEST ===\n');
    
    try {
        // 1. Test Template Processor
        console.log('1️⃣ Testing Template Processor (port 3000)...');
        const templateTest = await axios.post('http://localhost:3000/api/process', {
            document: 'Create a simple landing page for a startup',
            type: 'text'
        });
        console.log('✅ Template Processor Response:', templateTest.data);
        console.log('');
        
        // 2. Test AI Service
        console.log('2️⃣ Testing AI Service (port 3001)...');
        const aiTest = await axios.post('http://localhost:3001/api/cal-compare/consult', {
            question: 'Generate a landing page HTML structure',
            expertType: 'technical-architecture'
        });
        console.log('✅ AI Service Response:');
        console.log('   Provider:', aiTest.data.consultation.provider);
        console.log('   Cost:', aiTest.data.consultation.cost);
        console.log('   Response preview:', aiTest.data.consultation.response.substring(0, 100) + '...');
        console.log('');
        
        // 3. Test Empire Bridge
        console.log('3️⃣ Testing Empire Bridge (port 3333)...');
        const bridgeTest = await axios.get('http://localhost:3333/api/stats');
        console.log('✅ Empire Bridge Stats:', bridgeTest.data);
        console.log('');
        
        // 4. Test Unified Gateway
        console.log('4️⃣ Testing Unified Gateway (port 4444)...');
        const gatewayTest = await axios.get('http://localhost:4444/api/health');
        console.log('✅ Gateway Health:', gatewayTest.data);
        console.log('');
        
        // 5. Show how to use them together
        console.log('5️⃣ COMPLETE FLOW: Document → AI Enhancement → MVP');
        console.log('─'.repeat(50));
        
        // Step 1: Process document
        const docResult = await axios.post('http://localhost:3000/api/process', {
            document: 'I need a todo app with user authentication',
            type: 'text'
        });
        console.log('📄 Document processed:', docResult.data.mvp.type);
        
        // Step 2: Enhance with AI
        const aiEnhancement = await axios.post('http://localhost:3001/api/cal-compare/consult', {
            question: `Based on this MVP requirement: ${JSON.stringify(docResult.data.mvp)}, generate the authentication code`,
            expertType: 'technical-architecture'
        });
        console.log('🤖 AI Enhancement added');
        console.log('💰 Total cost: $' + aiEnhancement.data.consultation.cost);
        
        console.log('\n✅ INTEGRATION TEST COMPLETE!');
        console.log('\n📚 Available Endpoints:');
        console.log('   • Document Processing: POST http://localhost:3000/api/process');
        console.log('   • AI Consultation: POST http://localhost:3001/api/cal-compare/consult');
        console.log('   • Empire Bridge: GET http://localhost:3333/api/systems');
        console.log('   • Unified Dashboard: http://localhost:4444/');
        
    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testIntegration();