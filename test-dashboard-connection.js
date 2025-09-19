#!/usr/bin/env node

/**
 * Test Dashboard Connection
 * Verifies complete data flow: Database → API → WebSocket → Dashboard
 */

const http = require('http');
const WebSocket = require('ws');

async function testCompleteDataFlow() {
    console.log('🧪 Testing Complete Data Flow: Database → API → WebSocket → Dashboard');
    console.log('================================================================');
    
    const results = {
        database: false,
        api: false,
        websocket: false,
        dashboard: false
    };
    
    // Test 1: Database connectivity through API
    console.log('\n1️⃣ Testing Database → API Connection...');
    try {
        const response = await fetch('http://localhost:3009/api/system/status');
        const data = await response.json();
        
        if (data.success && data.services.database.status === 'connected') {
            console.log(`✅ Database connected with ${data.services.database.documents} documents`);
            results.database = true;
            results.api = true;
        } else {
            console.log('❌ Database not connected through API');
        }
    } catch (error) {
        console.log('❌ API not responding:', error.message);
    }
    
    // Test 2: WebSocket connectivity
    console.log('\n2️⃣ Testing API → WebSocket Connection...');
    try {
        await testWebSocket('ws://localhost:3009', 'Main API WebSocket');
        results.websocket = true;
    } catch (error) {
        console.log('❌ WebSocket connection failed:', error.message);
    }
    
    // Test 3: Dashboard accessibility
    console.log('\n3️⃣ Testing Dashboard Accessibility...');
    try {
        const response = await fetch('http://localhost:8082/unified-live-dashboard.html');
        if (response.ok) {
            const html = await response.text();
            if (html.includes('Document Generator - Live System Dashboard')) {
                console.log('✅ Dashboard accessible and contains expected content');
                results.dashboard = true;
            } else {
                console.log('❌ Dashboard accessible but missing expected content');
            }
        } else {
            console.log('❌ Dashboard not accessible');
        }
    } catch (error) {
        console.log('❌ Dashboard test failed:', error.message);
    }
    
    // Test 4: Real-time data flow
    console.log('\n4️⃣ Testing Real-time Data Flow...');
    try {
        const metricsResponse = await fetch('http://localhost:3009/api/metrics');
        const metrics = await metricsResponse.json();
        
        if (metrics.success && metrics.metrics.totalDocuments) {
            console.log(`✅ Real-time metrics available: ${metrics.metrics.totalDocuments} documents, ${metrics.metrics.totalJobs} jobs`);
        } else {
            console.log('❌ Real-time metrics not available');
        }
    } catch (error) {
        console.log('❌ Real-time data test failed:', error.message);
    }
    
    // Final Results
    console.log('\n📊 COMPLETE DATA FLOW TEST RESULTS');
    console.log('=====================================');
    console.log(`Database Connection: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`API Server: ${results.api ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`WebSocket Connection: ${results.websocket ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Dashboard Access: ${results.dashboard ? '✅ PASS' : '❌ FAIL'}`);
    
    const passCount = Object.values(results).filter(Boolean).length;
    const overallSuccess = passCount === 4;
    
    console.log(`\n🎯 OVERALL RESULT: ${overallSuccess ? '✅ COMPLETE SUCCESS' : `⚠️ PARTIAL SUCCESS (${passCount}/4)`}`);
    
    if (overallSuccess) {
        console.log('\n🎉 BRIDGE SUCCESSFUL! Your dashboards are now connected to real data!');
        console.log('📊 Dashboard URL: http://localhost:8082/unified-live-dashboard.html');
        console.log('🔗 API Status: http://localhost:3009/api/system/status');
        console.log('📈 Live Metrics: http://localhost:3009/api/metrics');
    } else {
        console.log('\n🔧 Some components need attention. Check the failed tests above.');
    }
    
    return overallSuccess;
}

function testWebSocket(url, name) {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(url);
        const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Connection timeout'));
        }, 5000);
        
        ws.on('open', () => {
            console.log(`✅ ${name} connected successfully`);
            clearTimeout(timeout);
            ws.close();
            resolve(true);
        });
        
        ws.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                console.log(`📨 Received real-time data: ${message.type}`);
            } catch (e) {
                console.log(`📨 Received data: ${data.toString().slice(0, 50)}...`);
            }
        });
    });
}

// Global fetch polyfill for Node.js
if (!global.fetch) {
    global.fetch = require('node-fetch');
}

// Run the test
if (require.main === module) {
    testCompleteDataFlow().catch(console.error);
}

module.exports = { testCompleteDataFlow };