#!/usr/bin/env node

/**
 * Simple API connector test
 */

require('dotenv').config();

const RealAIAPIConnector = require('./real-ai-api-connector.js');

async function testAPI() {
    console.log('🧪 Testing Real AI API Connector');
    
    const connector = new RealAIAPIConnector({
        enableGasTankFallback: true,
        enableTestingMode: true
    });
    
    console.log('⏳ Waiting for initialization...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
        console.log('🔌 Testing Anthropic API call...');
        
        const result = await connector.callAPI(
            'anthropic',
            'claude-3-haiku-20240307',
            'Say hello briefly',
            { maxTokens: 50 }
        );
        
        console.log('✅ API call successful!');
        console.log('Response:', result.response);
        console.log('Cost:', result.metadata.cost);
        console.log('Duration:', result.metadata.duration + 'ms');
        
    } catch (error) {
        console.error('❌ API call failed:', error.message);
        console.error('Full error:', error);
    }
}

testAPI().catch(console.error);