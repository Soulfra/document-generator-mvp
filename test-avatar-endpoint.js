#!/usr/bin/env node

/**
 * Test script for avatar processing endpoint
 */

const fetch = require('node-fetch');

async function testAvatarEndpoint() {
    console.log('🧪 Testing avatar processing endpoint...');
    
    // Create a simple test image (1x1 red pixel)
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    
    try {
        const response = await fetch('http://localhost:3030/api/process-avatar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: testImageData,
                style: 'hollow-knight',
                class: 'fullstack'
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Avatar processing successful!');
            console.log('Avatar ID:', result.avatar.id);
            console.log('Style:', result.avatar.style);
            console.log('Class:', result.avatar.class);
            console.log('Processing time:', result.avatar.processingTime + 'ms');
        } else {
            console.error('❌ Avatar processing failed:', result.error);
        }
    } catch (error) {
        console.error('❌ Connection error:', error.message);
        console.log('\nMake sure the backend is running:');
        console.log('  node wasm-recovery-real-backend.js');
    }
}

// Run the test
testAvatarEndpoint();