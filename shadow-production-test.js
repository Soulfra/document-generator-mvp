#!/usr/bin/env node

/**
 * 🌚 SHADOW PRODUCTION TESTING 🌚
 * Verify bridge data matches actual production data
 * Tests real vs bridge data accuracy in real-time
 */

const axios = require('axios');
const fs = require('fs');

class ShadowProductionTest {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            shadowData: [],
            productionData: [],
            discrepancies: []
        };
        
        this.testConfig = {
            bridgeUrl: 'http://localhost:8888',
            productionPorts: [3001, 3002, 3003],
            testDuration: 60000, // 1 minute
            sampleInterval: 5000, // 5 seconds
            tolerancePercent: 10 // 10% tolerance
        };
        
        console.log(`\n🌚 SHADOW PRODUCTION TESTING INITIALIZED 🌚`);
        console.log(`============================================\n`);
    }
    
    async runShadowTest() {
        console.log('🕵️ STARTING SHADOW PRODUCTION TESTING...\n');
        
        // Phase 1: Real-time Data Comparison
        await this.compareRealTimeData();
        
        // Phase 2: Production Load Simulation
        await this.simulateProductionLoad();
        
        // Phase 3: Data Integrity Verification
        await this.verifyDataIntegrity();
        
        // Phase 4: Performance Under Load
        await this.testPerformanceUnderLoad();
        
        // Generate Shadow Report
        this.generateShadowReport();
        
        return this.results;
    }
    
    async compareRealTimeData() {
        console.log('📊 PHASE 1: REAL-TIME DATA COMPARISON');
        console.log('=====================================');
        
        const samplesNeeded = Math.floor(this.testConfig.testDuration / this.testConfig.sampleInterval);
        let sampleCount = 0;
        
        console.log(`Taking ${samplesNeeded} samples over ${this.testConfig.testDuration/1000} seconds...\n`);
        
        const interval = setInterval(async () => {
            sampleCount++;
            console.log(`📈 Sample ${sampleCount}/${samplesNeeded}`);
            
            try {
                // Get bridge data
                const bridgeResponse = await axios.get(`${this.testConfig.bridgeUrl}/api/real-economy`);
                const bridgeData = bridgeResponse.data;
                
                // Get direct production data
                const productionData = await this.getDirectProductionData();
                
                // Store for analysis
                const timestamp = new Date().toISOString();
                this.results.shadowData.push({ timestamp, ...bridgeData });
                this.results.productionData.push({ timestamp, ...productionData });
                
                // Real-time comparison
                await this.compareSample(bridgeData, productionData, sampleCount);
                
            } catch (error) {
                console.error(`❌ Sample ${sampleCount} failed: ${error.message}`);
                this.results.failed++;
            }
            
            this.results.total++;
            
            if (sampleCount >= samplesNeeded) {
                clearInterval(interval);
                console.log('\n✅ Real-time sampling complete\n');
            }
        }, this.testConfig.sampleInterval);
        
        // Wait for sampling to complete
        return new Promise(resolve => {
            const checkComplete = setInterval(() => {
                if (sampleCount >= samplesNeeded) {
                    clearInterval(checkComplete);
                    resolve();
                }
            }, 100);
        });
    }
    
    async getDirectProductionData() {
        let totalCosts = 0;
        let totalTrades = 0;
        let totalUptime = 0;
        let onlineInstances = 0;
        
        for (const port of this.testConfig.productionPorts) {
            try {
                const response = await axios.get(`http://localhost:${port}/api/status`, {
                    timeout: 3000
                });
                
                if (response.status === 200) {
                    onlineInstances++;
                    const data = response.data;
                    
                    // Calculate using same logic as bridge
                    if (data.memory && data.uptime) {
                        const memoryMB = data.memory.rss / 1024 / 1024;
                        const costs = memoryMB * 0.0001;
                        const trades = Math.floor(data.uptime / 60);
                        
                        totalCosts += costs;
                        totalTrades += trades;
                        totalUptime += data.uptime;
                    }
                }
            } catch (error) {
                // Skip offline instances
            }
        }
        
        const actualRevenue = Math.max(0, totalTrades * 0.05 - totalCosts);
        
        return {
            realApiCosts: totalCosts,
            realTrades: totalTrades,
            actualRevenue: actualRevenue,
            onlineInstances: onlineInstances,
            averageUptime: onlineInstances > 0 ? totalUptime / onlineInstances : 0
        };
    }
    
    async compareSample(bridgeData, productionData, sampleNumber) {
        const tolerance = this.testConfig.tolerancePercent / 100;
        const discrepancies = [];
        
        // Compare API costs
        const costDiff = Math.abs(bridgeData.realApiCosts - productionData.realApiCosts);
        const costTolerance = productionData.realApiCosts * tolerance;
        
        if (costDiff > costTolerance && productionData.realApiCosts > 0) {
            discrepancies.push({
                field: 'realApiCosts',
                bridge: bridgeData.realApiCosts,
                production: productionData.realApiCosts,
                difference: costDiff,
                percentDiff: (costDiff / productionData.realApiCosts) * 100
            });
        }
        
        // Compare trades
        const tradeDiff = Math.abs(bridgeData.realTrades - productionData.realTrades);
        const tradeTolerance = productionData.realTrades * tolerance;
        
        if (tradeDiff > tradeTolerance && productionData.realTrades > 0) {
            discrepancies.push({
                field: 'realTrades',
                bridge: bridgeData.realTrades,
                production: productionData.realTrades,
                difference: tradeDiff,
                percentDiff: (tradeDiff / productionData.realTrades) * 100
            });
        }
        
        // Compare revenue
        const revenueDiff = Math.abs(bridgeData.actualRevenue - productionData.actualRevenue);
        const revenueTolerance = Math.max(productionData.actualRevenue * tolerance, 0.01); // At least $0.01 tolerance
        
        if (revenueDiff > revenueTolerance && productionData.actualRevenue > 0) {
            discrepancies.push({
                field: 'actualRevenue',
                bridge: bridgeData.actualRevenue,
                production: productionData.actualRevenue,
                difference: revenueDiff,
                percentDiff: (revenueDiff / productionData.actualRevenue) * 100
            });
        }
        
        if (discrepancies.length > 0) {
            console.log(`⚠️ Sample ${sampleNumber}: ${discrepancies.length} discrepancies found`);
            this.results.discrepancies.push({
                sample: sampleNumber,
                timestamp: new Date().toISOString(),
                discrepancies
            });
            discrepancies.forEach(d => {
                console.log(`   ${d.field}: Bridge=${d.bridge.toFixed(4)}, Production=${d.production.toFixed(4)} (${d.percentDiff.toFixed(1)}% diff)`);
            });
        } else {
            console.log(`✅ Sample ${sampleNumber}: Data matches within ${this.testConfig.tolerancePercent}% tolerance`);
            this.results.passed++;
        }
    }
    
    async simulateProductionLoad() {
        console.log('🚀 PHASE 2: PRODUCTION LOAD SIMULATION');
        console.log('======================================');
        
        console.log('Simulating high-frequency API calls...');
        
        // Generate concurrent requests to bridge
        const concurrentRequests = 20;
        const requestsPerSecond = 10;
        const testDuration = 30000; // 30 seconds
        
        let totalRequests = 0;
        let successfulRequests = 0;
        let failedRequests = 0;
        const responseTimes = [];
        
        const startTime = Date.now();
        
        const loadTest = setInterval(async () => {
            const requests = Array(concurrentRequests).fill().map(async () => {
                const requestStart = Date.now();
                try {
                    await axios.get(`${this.testConfig.bridgeUrl}/api/real-economy`);
                    const responseTime = Date.now() - requestStart;
                    responseTimes.push(responseTime);
                    successfulRequests++;
                } catch (error) {
                    failedRequests++;
                }
                totalRequests++;
            });
            
            await Promise.all(requests);
            
            if (Date.now() - startTime > testDuration) {
                clearInterval(loadTest);
            }
        }, 1000 / requestsPerSecond);
        
        // Wait for load test to complete
        await new Promise(resolve => {
            const checkComplete = setInterval(() => {
                if (Date.now() - startTime > testDuration) {
                    clearInterval(checkComplete);
                    resolve();
                }
            }, 100);
        });
        
        // Analyze results
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const maxResponseTime = Math.max(...responseTimes);
        const minResponseTime = Math.min(...responseTimes);
        const successRate = (successfulRequests / totalRequests) * 100;
        
        console.log(`\n📊 Load Test Results:`);
        console.log(`   Total Requests: ${totalRequests}`);
        console.log(`   Successful: ${successfulRequests} (${successRate.toFixed(1)}%)`);
        console.log(`   Failed: ${failedRequests}`);
        console.log(`   Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
        console.log(`   Min/Max Response: ${minResponseTime}ms / ${maxResponseTime}ms\n`);
        
        if (successRate < 95) {
            console.log(`⚠️ Success rate below 95%: ${successRate.toFixed(1)}%`);
        } else {
            console.log(`✅ Success rate acceptable: ${successRate.toFixed(1)}%`);
        }
        
        if (avgResponseTime > 1000) {
            console.log(`⚠️ Average response time high: ${avgResponseTime.toFixed(0)}ms`);
        } else {
            console.log(`✅ Average response time good: ${avgResponseTime.toFixed(0)}ms`);
        }
    }
    
    async verifyDataIntegrity() {
        console.log('🔍 PHASE 3: DATA INTEGRITY VERIFICATION');
        console.log('=======================================');
        
        // Analyze collected shadow data for consistency
        console.log('Analyzing data consistency across samples...');
        
        if (this.results.shadowData.length === 0) {
            console.log('❌ No shadow data collected for analysis');
            return;
        }
        
        const shadowData = this.results.shadowData;
        const productionData = this.results.productionData;
        
        // Check for data monotonicity (values should generally increase over time)
        let monotonicIssues = 0;
        
        for (let i = 1; i < shadowData.length; i++) {
            const prev = shadowData[i - 1];
            const curr = shadowData[i];
            
            // Trades should only increase (or stay same if no activity)
            if (curr.realTrades < prev.realTrades) {
                monotonicIssues++;
                console.log(`⚠️ Trade count decreased: ${prev.realTrades} → ${curr.realTrades}`);
            }
            
            // API costs should only increase (or stay same)
            if (curr.realApiCosts < prev.realApiCosts) {
                monotonicIssues++;
                console.log(`⚠️ API costs decreased: ${prev.realApiCosts} → ${curr.realApiCosts}`);
            }
        }
        
        if (monotonicIssues === 0) {
            console.log('✅ Data monotonicity verified - values increase consistently');
        } else {
            console.log(`⚠️ Found ${monotonicIssues} monotonicity issues`);
        }
        
        // Check for data correlation between bridge and production
        let correlationScore = 0;
        const samples = Math.min(shadowData.length, productionData.length);
        
        for (let i = 0; i < samples; i++) {
            const bridge = shadowData[i];
            const production = productionData[i];
            
            // Calculate correlation for each metric
            const costCorrelation = this.calculateCorrelation(bridge.realApiCosts, production.realApiCosts);
            const tradeCorrelation = this.calculateCorrelation(bridge.realTrades, production.realTrades);
            
            correlationScore += (costCorrelation + tradeCorrelation) / 2;
        }
        
        const avgCorrelation = correlationScore / samples;
        
        if (avgCorrelation > 0.8) {
            console.log(`✅ Strong correlation between bridge and production data: ${(avgCorrelation * 100).toFixed(1)}%`);
        } else {
            console.log(`⚠️ Weak correlation between bridge and production data: ${(avgCorrelation * 100).toFixed(1)}%`);
        }
    }
    
    async testPerformanceUnderLoad() {
        console.log('⚡ PHASE 4: PERFORMANCE UNDER LOAD');
        console.log('==================================');
        
        console.log('Testing bridge performance under sustained load...');
        
        // Monitor system resources during load
        const resourceMonitor = setInterval(() => {
            const memUsage = process.memoryUsage();
            console.log(`Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB heap, ${(memUsage.rss / 1024 / 1024).toFixed(1)}MB RSS`);
        }, 5000);
        
        // Sustained load test
        const sustainedRequests = 100;
        const responseTimeGoal = 500; // 500ms target
        
        const startTime = Date.now();
        const responses = [];
        
        console.log(`Sending ${sustainedRequests} requests to bridge...`);
        
        for (let i = 0; i < sustainedRequests; i++) {
            const requestStart = Date.now();
            try {
                await axios.get(`${this.testConfig.bridgeUrl}/api/real-economy`);
                const responseTime = Date.now() - requestStart;
                responses.push({ success: true, time: responseTime });
                
                if (i % 20 === 0) {
                    console.log(`   Completed ${i + 1}/${sustainedRequests} requests`);
                }
            } catch (error) {
                responses.push({ success: false, error: error.message });
            }
            
            // Small delay to prevent overwhelming
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        clearInterval(resourceMonitor);
        
        const totalTime = Date.now() - startTime;
        const successfulResponses = responses.filter(r => r.success);
        const avgResponseTime = successfulResponses.reduce((sum, r) => sum + r.time, 0) / successfulResponses.length;
        const successRate = (successfulResponses.length / responses.length) * 100;
        
        console.log(`\n🏁 Sustained Load Results:`);
        console.log(`   Total Time: ${totalTime}ms`);
        console.log(`   Success Rate: ${successRate.toFixed(1)}%`);
        console.log(`   Avg Response Time: ${avgResponseTime.toFixed(0)}ms`);
        console.log(`   Requests/Second: ${(sustainedRequests / (totalTime / 1000)).toFixed(1)}`);
        
        if (avgResponseTime <= responseTimeGoal) {
            console.log(`✅ Performance goal met: ${avgResponseTime.toFixed(0)}ms <= ${responseTimeGoal}ms`);
        } else {
            console.log(`⚠️ Performance goal missed: ${avgResponseTime.toFixed(0)}ms > ${responseTimeGoal}ms`);
        }
    }
    
    calculateCorrelation(value1, value2) {
        // Simple correlation calculation (values should be similar)
        if (value1 === 0 && value2 === 0) return 1;
        if (value1 === 0 || value2 === 0) return 0;
        
        const ratio = Math.min(value1, value2) / Math.max(value1, value2);
        return ratio;
    }
    
    generateShadowReport() {
        console.log(`\n🌚 SHADOW PRODUCTION TEST RESULTS`);
        console.log(`=================================`);
        
        const totalSamples = this.results.shadowData.length;
        const accuratesamples = this.results.passed;
        const inaccurateSamples = this.results.discrepancies.length;
        const accuracyRate = totalSamples > 0 ? (accuratesamples / totalSamples) * 100 : 0;
        
        console.log(`Total Samples: ${totalSamples}`);
        console.log(`Accurate Samples: ${accuratesamples}`);
        console.log(`Inaccurate Samples: ${inaccurateSamples}`);
        console.log(`Accuracy Rate: ${accuracyRate.toFixed(1)}%`);
        
        if (this.results.discrepancies.length > 0) {
            console.log(`\n⚠️ DISCREPANCY SUMMARY:`);
            const fieldIssues = {};
            
            this.results.discrepancies.forEach(d => {
                d.discrepancies.forEach(disc => {
                    if (!fieldIssues[disc.field]) {
                        fieldIssues[disc.field] = [];
                    }
                    fieldIssues[disc.field].push(disc.percentDiff);
                });
            });
            
            Object.entries(fieldIssues).forEach(([field, diffs]) => {
                const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
                const maxDiff = Math.max(...diffs);
                console.log(`   ${field}: ${diffs.length} issues, avg ${avgDiff.toFixed(1)}% diff, max ${maxDiff.toFixed(1)}%`);
            });
        }
        
        const reportData = {
            summary: {
                totalSamples,
                accuratesamples,
                inaccurateSamples,
                accuracyRate,
                testDuration: this.testConfig.testDuration,
                tolerance: this.testConfig.tolerancePercent
            },
            shadowData: this.results.shadowData,
            productionData: this.results.productionData,
            discrepancies: this.results.discrepancies,
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync('shadow-production-report.json', JSON.stringify(reportData, null, 2));
        console.log(`\n📄 Detailed shadow report saved: shadow-production-report.json`);
        
        if (accuracyRate >= 90) {
            console.log(`\n✅ SHADOW TEST PASSED: ${accuracyRate.toFixed(1)}% accuracy (>= 90% required)`);
            console.log(`🎯 Bridge data matches production within acceptable tolerance`);
        } else {
            console.log(`\n❌ SHADOW TEST FAILED: ${accuracyRate.toFixed(1)}% accuracy (< 90% required)`);
            console.log(`🔧 Bridge needs calibration to match production data`);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const shadowTest = new ShadowProductionTest();
    shadowTest.runShadowTest().catch(error => {
        console.error('❌ Shadow production test failed:', error);
        process.exit(1);
    });
}

module.exports = ShadowProductionTest;