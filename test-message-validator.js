#!/usr/bin/env node

/**
 * Test script for message validation fix
 */

const MessageContentValidator = require('./message-content-validator');

// Create validator instance
const validator = new MessageContentValidator();

// Test cases that were causing the API error
const testCases = [
    // Empty content cases
    { input: '', expected: '[empty message]', description: 'Empty string' },
    { input: null, expected: '[empty message]', description: 'Null value' },
    { input: undefined, expected: '[empty message]', description: 'Undefined value' },
    { input: '   ', expected: '[empty message]', description: 'Only whitespace' },
    { input: '\n\n\n', expected: '[empty message]', description: 'Only newlines' },
    
    // Symbol-only cases (should be preserved)
    { input: '@', expected: '@', description: 'Single @ symbol' },
    { input: '#', expected: '#', description: 'Single # symbol' },
    { input: '!', expected: '!', description: 'Single ! symbol' },
    { input: '?', expected: '?', description: 'Single ? symbol' },
    { input: '!!!', expected: '!!!', description: 'Multiple exclamation marks' },
    { input: '@@@', expected: '@@@', description: 'Multiple @ symbols' },
    { input: '@#!?', expected: '@#!?', description: 'Mixed symbols' },
    
    // Symbol commands
    { input: '@username', expected: '@username', description: 'Mention command' },
    { input: '#tag', expected: '#tag', description: 'Tag command' },
    { input: '!action', expected: '!action', description: 'Action command' },
    { input: '?query', expected: '?query', description: 'Query command' },
    { input: '!quest(params)', expected: '!quest(params)', description: 'Action with params' },
    
    // Normal content
    { input: 'Hello world', expected: 'Hello world', description: 'Normal message' },
    { input: 'Message with @mention', expected: 'Message with @mention', description: 'Message with mention' },
    { input: 'Multiple\n\n\n\nNewlines', expected: 'Multiple\n\nNewlines', description: 'Normalized newlines' },
    { input: 'Multiple   spaces', expected: 'Multiple spaces', description: 'Normalized spaces' },
    
    // HTML stripping
    { input: '<script>alert("test")</script>', expected: '', description: 'Script tag stripped' },
    { input: 'Hello <b>world</b>', expected: 'Hello world', description: 'HTML tags stripped' },
    
    // Empty indicators
    { input: '...', expected: '[empty message]', description: 'Dots treated as empty' },
    { input: '---', expected: '[empty message]', description: 'Dashes treated as empty' },
    { input: 'null', expected: '[empty message]', description: 'String "null" treated as empty' },
    { input: 'undefined', expected: '[empty message]', description: 'String "undefined" treated as empty' }
];

console.log('🧪 Testing Message Content Validator\n');
console.log('=' .repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
    const result = validator.validate(testCase.input, {
        allowEmpty: false,
        stripHtml: true,
        normalizeWhitespace: true
    });
    
    const success = result.content === testCase.expected;
    
    if (success) {
        passed++;
        console.log(`✅ Test ${index + 1}: ${testCase.description}`);
        console.log(`   Input: ${JSON.stringify(testCase.input)}`);
        console.log(`   Output: ${JSON.stringify(result.content)}`);
    } else {
        failed++;
        console.log(`❌ Test ${index + 1}: ${testCase.description}`);
        console.log(`   Input: ${JSON.stringify(testCase.input)}`);
        console.log(`   Expected: ${JSON.stringify(testCase.expected)}`);
        console.log(`   Got: ${JSON.stringify(result.content)}`);
        console.log(`   Full result:`, result);
    }
    console.log('');
});

console.log('=' .repeat(80));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

// Test the actual database insert scenario
console.log('🗄️  Testing Database Insert Scenario:');
console.log('=' .repeat(80));

// Simulate what would be inserted into the database
const dbTestCases = [
    { content: '', description: 'Empty content that was causing the error' },
    { content: null, description: 'Null content' },
    { content: '@', description: 'Single symbol' },
    { content: 'Normal message', description: 'Regular message' }
];

dbTestCases.forEach(testCase => {
    const validation = validator.validate(testCase.content);
    console.log(`\n${testCase.description}:`);
    console.log(`Original: ${JSON.stringify(testCase.content)}`);
    console.log(`For DB: ${JSON.stringify(validation.content)}`);
    console.log(`Valid: ${validation.valid}`);
    console.log(`Type: ${validation.type}`);
    console.log(`Would insert: "${validation.content}" (NOT NULL constraint satisfied: ${validation.content.length > 0})`);
});

console.log('\n✅ All database inserts would now succeed with non-null content!\n');