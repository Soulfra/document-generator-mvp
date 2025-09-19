#!/usr/bin/env node

// Test URL construction with the exact same values used in real-ai-api-connector.js

const baseUrl = 'https://api.anthropic.com/v1';
const endpoint = 'messages';

console.log('Base URL:', baseUrl);
console.log('Endpoint:', endpoint);

const url = new URL(endpoint, baseUrl);
console.log('Constructed URL:', url.href);

// This should output: https://api.anthropic.com/v1/messages

// Test other services
console.log('\nTesting all services:');

const configs = {
    anthropic: { baseUrl: 'https://api.anthropic.com/v1', endpoint: 'messages' },
    openai: { baseUrl: 'https://api.openai.com/v1', endpoint: 'chat/completions' },
    deepseek: { baseUrl: 'https://api.deepseek.com/v1', endpoint: 'chat/completions' },
    kimi: { baseUrl: 'https://api.moonshot.cn/v1', endpoint: 'chat/completions' },
    perplexity: { baseUrl: 'https://api.perplexity.ai', endpoint: 'chat/completions' },
    gemini: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', endpoint: 'models/gemini-pro:generateContent' }
};

for (const [service, config] of Object.entries(configs)) {
    const url = new URL(config.endpoint, config.baseUrl);
    console.log(`${service}: ${url.href}`);
}