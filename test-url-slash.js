#!/usr/bin/env node

console.log('Testing URL construction with and without trailing slash:');

// Without trailing slash
const baseUrl1 = 'https://api.anthropic.com/v1';
const endpoint = 'messages';
const url1 = new URL(endpoint, baseUrl1);
console.log('Without slash:', url1.href);

// With trailing slash
const baseUrl2 = 'https://api.anthropic.com/v1/';
const url2 = new URL(endpoint, baseUrl2);
console.log('With slash:', url2.href);

console.log('\nThe issue is the base URL needs a trailing slash!');