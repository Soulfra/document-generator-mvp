#!/usr/bin/env node

const baseUrl = 'https://api.anthropic.com/v1';
const endpoint = '/messages';

const url = new URL(endpoint, baseUrl);
console.log('BaseUrl:', baseUrl);
console.log('Endpoint:', endpoint);
console.log('Final URL:', url.href);

// Test what happens if baseUrl is wrong
const wrongBaseUrl = 'https://api.anthropic.com';
const url2 = new URL(endpoint, wrongBaseUrl);
console.log('\nWith wrong baseUrl:');
console.log('BaseUrl:', wrongBaseUrl);
console.log('Final URL:', url2.href);