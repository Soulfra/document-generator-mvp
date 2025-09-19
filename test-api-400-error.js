#!/usr/bin/env node

/**
 * Test script to reproduce API 400 errors
 * This will help identify character limit and other issues
 */

// First, load the debug interceptor
require('./api-debug-interceptor');

const axios = require('axios');

async function testLargePayload() {
    console.log('🧪 Testing large payload scenarios...\n');
    
    // Test 1: Very large text
    console.log('Test 1: Large text payload');
    const largeText = 'x'.repeat(150000); // 150KB of text
    
    try {
        const response = await axios.post('http://localhost:9500/api/test', {
            prompt: `Process this text: ${largeText}`,
            taskType: 'general'
        });
        console.log('✅ Large text succeeded');
    } catch (error) {
        console.log('❌ Large text failed:', error.response?.status, error.response?.data);
    }
    
    // Test 2: Test with Claude directly (if that's where the error is)
    console.log('\nTest 2: Direct Anthropic test');
    try {
        const response = await axios.post('http://localhost:9500/api/test/anthropic', {
            prompt: `Generate a very long response about AI technology ${largeText.substring(0, 50000)}`,
            model: 'claude-3-opus-20240229'
        });
        console.log('✅ Anthropic test succeeded');
    } catch (error) {
        console.log('❌ Anthropic test failed:', error.response?.status, error.response?.data);
    }
    
    // Test 3: Multiple large messages
    console.log('\nTest 3: Multiple messages');
    const messages = Array(50).fill({
        role: 'user',
        content: 'x'.repeat(10000) // 50 messages of 10KB each
    });
    
    try {
        const response = await axios.post('http://localhost:9500/api/test', {
            messages: messages,
            taskType: 'general'
        });
        console.log('✅ Multiple messages succeeded');
    } catch (error) {
        console.log('❌ Multiple messages failed:', error.response?.status, error.response?.data);
    }
    
    // Test 4: Special characters
    console.log('\nTest 4: Special characters');
    const specialChars = '{"test": "' + '\\n\\t\\r'.repeat(10000) + '"}';
    
    try {
        const response = await axios.post('http://localhost:9500/api/test', {
            prompt: specialChars,
            taskType: 'general'
        });
        console.log('✅ Special characters succeeded');
    } catch (error) {
        console.log('❌ Special characters failed:', error.response?.status, error.response?.data);
    }
}

async function testClaudeCodeAPI() {
    console.log('\n🧪 Testing Claude Code API scenarios...\n');
    
    // These tests simulate what Claude Code might be sending
    const testScenarios = [
        {
            name: 'Long code generation',
            payload: {
                prompt: 'Generate a complete implementation of a ' + 'x'.repeat(50000),
                taskType: 'code'
            }
        },
        {
            name: 'Deep context',
            payload: {
                prompt: 'Analyze this codebase',
                context: 'x'.repeat(200000), // 200KB context
                taskType: 'analysis'
            }
        },
        {
            name: 'Structured output',
            payload: {
                prompt: 'Generate JSON',
                format: 'json',
                schema: JSON.stringify({properties: 'x'.repeat(50000)}),
                taskType: 'general'
            }
        }
    ];
    
    for (const scenario of testScenarios) {
        console.log(`Testing: ${scenario.name}`);
        try {
            const response = await axios.post('http://localhost:9500/api/test', scenario.payload);
            console.log(`✅ ${scenario.name} succeeded`);
        } catch (error) {
            console.log(`❌ ${scenario.name} failed:`, error.response?.status, error.response?.data);
            
            // Log the actual error details
            if (error.response?.data) {
                console.log('Error details:', JSON.stringify(error.response.data, null, 2));
            }
        }
    }
}

async function checkAPIDebugLogs() {
    console.log('\n📋 Checking debug logs...\n');
    
    const fs = require('fs');
    const path = require('path');
    
    // Check error log
    const errorLogPath = path.join(__dirname, 'api-errors.log');
    if (fs.existsSync(errorLogPath)) {
        const errors = fs.readFileSync(errorLogPath, 'utf8');
        const lines = errors.split('\n').filter(l => l.includes('400'));
        
        if (lines.length > 0) {
            console.log('Found 400 errors in log:');
            lines.slice(-5).forEach(line => console.log(line));
        }
    }
}

// Run all tests
async function runTests() {
    console.log('🚀 Starting API 400 Error Tests\n');
    console.log('Debug logs will be written to:');
    console.log('  - api-debug.log (all requests)');
    console.log('  - api-errors.log (errors only)\n');
    
    await testLargePayload();
    await testClaudeCodeAPI();
    await checkAPIDebugLogs();
    
    console.log('\n✅ Tests complete. Check api-errors.log for any 400 errors.');
}

// Run the tests
runTests().catch(console.error);