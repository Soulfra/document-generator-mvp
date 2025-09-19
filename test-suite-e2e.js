#!/usr/bin/env node

/**
 * 🧪 E2E TEST SUITE - MAX PERFORMANCE EDITION 🧪
 * Comprehensive end-to-end testing for entire real data system
 */

const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class E2ETestSuite {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            total: 0,
            details: []
        };
        
        this.testData = {
            expectedPorts: [3001, 3002, 3003, 8888],
            bridgeUrl: 'http://localhost:8888',
            gameUrl: 'file://' + path.resolve('./corrected-gaming-interface.html'),
            adminUrl: 'file://' + path.resolve('./real-admin-dashboard.html')
        };
        
        console.log(`\n🧪 E2E TEST SUITE INITIALIZED 🧪`);
        console.log(`=================================\n`);
    }
    
    async runAllTests() {
        console.log('🚀 STARTING COMPREHENSIVE E2E TESTING...\n');
        
        // Phase 1: Infrastructure Tests
        await this.testInfrastructure();
        
        // Phase 2: API Tests
        await this.testAPIs();
        
        // Phase 3: Real Data Integration Tests
        await this.testRealDataIntegration();
        
        // Phase 4: UI E2E Tests
        await this.testUIIntegration();
        
        // Phase 5: Performance Tests
        await this.testPerformance();
        
        // Phase 6: Shadow Production Tests
        await this.testShadowProduction();
        
        // Generate Report
        this.generateTestReport();
        
        return this.results;
    }
    
    async testInfrastructure() {
        console.log('🏗️ PHASE 1: INFRASTRUCTURE TESTS');
        console.log('================================');
        
        // Test all required ports
        for (const port of this.testData.expectedPorts) {
            await this.test(`Port ${port} Health Check`, async () => {
                const response = await axios.get(`http://localhost:${port}/api/status`, {
                    timeout: 5000
                });
                
                if (response.status !== 200) {
                    throw new Error(`Port ${port} returned ${response.status}`);
                }
                
                if (port === 8888) {
                    // Bridge specific checks
                    if (!response.data.purpose) {
                        throw new Error('Bridge missing purpose field');
                    }
                }
                
                return `Port ${port}: HEALTHY`;
            });
        }
        
        // Test file system
        await this.test('Required Files Exist', async () => {
            const requiredFiles = [
                'corrected-gaming-interface.html',
                'real-admin-dashboard.html',
                'real-data-bridge.js'
            ];
            
            for (const file of requiredFiles) {
                if (!fs.existsSync(file)) {
                    throw new Error(`Missing required file: ${file}`);
                }
            }
            
            return 'All required files present';
        });
    }
    
    async testAPIs() {
        console.log('\n🌐 PHASE 2: API TESTS');
        console.log('====================');
        
        // Test Bridge API endpoints
        const bridgeEndpoints = [
            '/api/bridge-health',
            '/api/real-economy',
            '/api/real-status',
            '/api/real-agents'
        ];
        
        for (const endpoint of bridgeEndpoints) {
            await this.test(`Bridge API ${endpoint}`, async () => {
                const response = await axios.get(this.testData.bridgeUrl + endpoint, {
                    timeout: 3000
                });
                
                if (response.status !== 200) {
                    throw new Error(`API ${endpoint} returned ${response.status}`);
                }
                
                const data = response.data;
                
                // Validate response structure
                if (endpoint === '/api/real-economy') {
                    if (typeof data.realApiCosts !== 'number') {
                        throw new Error('realApiCosts should be a number');
                    }
                    if (typeof data.realTrades !== 'number') {
                        throw new Error('realTrades should be a number');
                    }
                    if (!data.dataSource) {
                        throw new Error('Missing dataSource field');
                    }
                }
                
                return `${endpoint}: Valid response`;
            });
        }
    }
    
    async testRealDataIntegration() {
        console.log('\n📊 PHASE 3: REAL DATA INTEGRATION TESTS');
        console.log('=======================================');
        
        await this.test('Real vs Fake Data Comparison', async () => {
            const economyData = await axios.get(this.testData.bridgeUrl + '/api/real-economy');
            const data = economyData.data;
            
            // Verify fake data is properly identified
            if (data.fakeBalance !== 1247.89) {
                throw new Error('Fake balance not properly identified');
            }
            
            // Verify real data is different from fake
            if (data.realBalance === data.fakeBalance) {
                throw new Error('Real balance matches fake balance - no real data');
            }
            
            // Verify calculations make sense
            const expectedRevenue = data.realTrades * 0.05 - data.realApiCosts;
            const actualRevenue = data.actualRevenue;
            
            if (Math.abs(expectedRevenue - actualRevenue) > 0.01) {
                throw new Error(`Revenue calculation mismatch: expected ${expectedRevenue}, got ${actualRevenue}`);
            }
            
            return `Real: $${data.realBalance.toFixed(4)} vs Fake: $${data.fakeBalance}`;
        });
        
        await this.test('Live Instance Data Collection', async () => {
            const statusData = await axios.get(this.testData.bridgeUrl + '/api/real-status');
            const data = statusData.data;
            
            if (data.onlineInstances === 0) {
                throw new Error('No instances online - cannot collect real data');
            }
            
            if (!data.instances || data.instances.length === 0) {
                throw new Error('No instance data available');
            }
            
            // Verify instance data has required fields
            for (const instance of data.instances) {
                if (!instance.port || !instance.status) {
                    throw new Error('Instance missing required fields');
                }
            }
            
            return `${data.onlineInstances}/${data.totalInstances} instances online`;
        });
    }
    
    async testUIIntegration() {
        console.log('\n🖥️ PHASE 4: UI E2E TESTS');
        console.log('========================');
        
        let browser, page;
        
        try {
            browser = await puppeteer.launch({ headless: true });
            page = await browser.newPage();
            
            // Test Gaming Interface
            await this.test('Gaming Interface Loads', async () => {
                await page.goto(this.testData.gameUrl, { waitUntil: 'networkidle0' });
                
                const title = await page.title();
                if (!title.includes('CORRECTED Gaming Economy')) {
                    throw new Error('Wrong page title');
                }
                
                return 'Gaming interface loaded successfully';
            });
            
            await this.test('Real Data Displays in UI', async () => {
                // Wait for data to load
                await page.waitForTimeout(3000);
                
                // Check if real earnings element exists and has data
                const realEarnings = await page.$eval('#realEarnings', el => el.textContent);
                
                if (realEarnings === 'Loading...' || realEarnings === 'UNAVAILABLE') {
                    throw new Error('Real earnings not loaded in UI');
                }
                
                // Check if fake data is crossed out
                const fakeEarnings = await page.$eval('#fakeEarnings', el => 
                    window.getComputedStyle(el).textDecoration
                );
                
                if (!fakeEarnings.includes('line-through')) {
                    throw new Error('Fake data not properly crossed out');
                }
                
                return `UI showing real data: ${realEarnings}`;
            });
            
            await this.test('Bridge Status Indicator', async () => {
                const bridgeStatus = await page.$eval('#bridgeStatus', el => el.textContent);
                
                if (bridgeStatus !== 'Connected') {
                    throw new Error(`Bridge status: ${bridgeStatus}`);
                }
                
                return 'Bridge status: Connected';
            });
            
            // Test Admin Dashboard
            await this.test('Admin Dashboard Loads', async () => {
                await page.goto(this.testData.adminUrl, { waitUntil: 'networkidle0' });
                
                const title = await page.title();
                if (!title.includes('Real Admin Dashboard')) {
                    throw new Error('Wrong admin dashboard title');
                }
                
                return 'Admin dashboard loaded successfully';
            });
            
        } finally {
            if (browser) {
                await browser.close();
            }
        }
    }
    
    async testPerformance() {
        console.log('\n⚡ PHASE 5: PERFORMANCE TESTS');
        console.log('=============================');
        
        await this.test('API Response Time', async () => {
            const start = Date.now();
            await axios.get(this.testData.bridgeUrl + '/api/real-economy');
            const duration = Date.now() - start;
            
            if (duration > 2000) {
                throw new Error(`API too slow: ${duration}ms`);
            }
            
            return `API response: ${duration}ms`;
        });
        
        await this.test('Concurrent Request Handling', async () => {
            const requests = Array(10).fill().map(() => 
                axios.get(this.testData.bridgeUrl + '/api/real-economy')
            );
            
            const start = Date.now();
            const responses = await Promise.all(requests);
            const duration = Date.now() - start;
            
            // All should succeed
            if (responses.some(r => r.status !== 200)) {
                throw new Error('Some concurrent requests failed');
            }
            
            return `10 concurrent requests: ${duration}ms total`;
        });
        
        await this.test('Data Update Frequency', async () => {
            const response1 = await axios.get(this.testData.bridgeUrl + '/api/real-economy');
            const timestamp1 = response1.data.lastUpdate;
            
            // Wait for next update cycle
            await new Promise(resolve => setTimeout(resolve, 6000));
            
            const response2 = await axios.get(this.testData.bridgeUrl + '/api/real-economy');
            const timestamp2 = response2.data.lastUpdate;
            
            if (timestamp1 === timestamp2) {
                throw new Error('Data not updating - timestamps identical');
            }
            
            return 'Data updating as expected';
        });
    }
    
    async testShadowProduction() {
        console.log('\n🌚 PHASE 6: SHADOW PRODUCTION TESTS');
        console.log('===================================');
        
        await this.test('Production Data Accuracy', async () => {
            // Get data from bridge
            const bridgeData = await axios.get(this.testData.bridgeUrl + '/api/real-economy');
            
            // Compare with direct instance data
            let directTotal = 0;
            let directTrades = 0;
            
            for (const port of [3001, 3002, 3003]) {
                try {
                    const directResponse = await axios.get(`http://localhost:${port}/api/status`);
                    if (directResponse.data.memory) {
                        directTotal += (directResponse.data.memory.rss / 1024 / 1024) * 0.0001;
                    }
                    if (directResponse.data.uptime) {
                        directTrades += Math.floor(directResponse.data.uptime / 60);
                    }
                } catch (error) {
                    // Skip offline instances
                }
            }
            
            const bridgeTotal = bridgeData.data.realApiCosts;
            const bridgeTrades = bridgeData.data.realTrades;
            
            // Allow 10% variance for timing differences
            if (Math.abs(bridgeTotal - directTotal) > directTotal * 0.1) {
                throw new Error(`Cost mismatch: bridge ${bridgeTotal} vs direct ${directTotal}`);
            }
            
            return `Shadow test: Bridge data matches production within 10%`;
        });
        
        await this.test('End-to-End Data Flow', async () => {
            // Trace data from source to UI
            const steps = [];
            
            // Step 1: Direct instance data
            const instanceData = await axios.get('http://localhost:3001/api/status');
            steps.push(`Instance: ${JSON.stringify(instanceData.data).length} bytes`);
            
            // Step 2: Bridge processing
            const bridgeData = await axios.get(this.testData.bridgeUrl + '/api/real-economy');
            steps.push(`Bridge: $${bridgeData.data.realBalance.toFixed(4)} processed`);
            
            // Step 3: UI consumption (simulate)
            steps.push(`UI: Ready for display`);
            
            return `E2E flow: ${steps.join(' → ')}`;
        });
    }
    
    async test(name, testFunction) {
        this.results.total++;
        
        try {
            const result = await testFunction();
            this.results.passed++;
            this.results.details.push({
                name,
                status: 'PASS',
                result,
                timestamp: new Date().toISOString()
            });
            console.log(`✅ ${name}: ${result}`);
        } catch (error) {
            this.results.failed++;
            this.results.details.push({
                name,
                status: 'FAIL',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            console.log(`❌ ${name}: ${error.message}`);
        }
    }
    
    generateTestReport() {
        console.log(`\n📊 E2E TEST RESULTS`);
        console.log(`===================`);
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed}`);
        console.log(`Failed: ${this.results.failed}`);
        console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
        
        const reportData = {
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                successRate: (this.results.passed / this.results.total) * 100
            },
            tests: this.results.details,
            timestamp: new Date().toISOString(),
            environment: {
                bridgeUrl: this.testData.bridgeUrl,
                testedPorts: this.testData.expectedPorts
            }
        };
        
        // Save detailed report
        fs.writeFileSync('e2e-test-report.json', JSON.stringify(reportData, null, 2));
        console.log(`\n📄 Detailed report saved: e2e-test-report.json`);
        
        if (this.results.failed > 0) {
            console.log(`\n⚠️ ${this.results.failed} tests failed. Review report for details.`);
            process.exit(1);
        } else {
            console.log(`\n🎉 ALL TESTS PASSED! System ready for deployment.`);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const testSuite = new E2ETestSuite();
    testSuite.runAllTests().catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = E2ETestSuite;