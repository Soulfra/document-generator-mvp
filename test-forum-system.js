#!/usr/bin/env node

/**
 * 🧪 FORUM SYSTEM INTEGRATION TEST
 * 
 * Complete test suite for the Real Forum Interface + Production API Server
 * Tests auto-refresh, RNG replies, WebSocket, and visual interface
 */

const http = require('http');
const WebSocket = require('ws');
const { spawn } = require('child_process');

class ForumSystemTest {
    constructor() {
        this.apiBase = 'http://localhost:3334';
        this.testId = `test-${Date.now()}`;
        this.results = [];
        this.legendaryCount = 0;
        this.totalReplies = 0;
        
        console.log('🧪 FORUM SYSTEM INTEGRATION TEST');
        console.log('================================');
        console.log(`Test ID: ${this.testId}\n`);
    }
    
    async runFullTest() {
        console.log('🚀 Starting comprehensive forum system test...\n');
        
        try {
            // Test 1: API Server Health
            await this.testAPIHealth();
            
            // Test 2: Post Creation & RNG Replies
            await this.testPostCreation();
            
            // Test 3: Multiple Posts for RNG Statistics
            await this.testRNGSystem();
            
            // Test 4: WebSocket Connection
            await this.testWebSocketConnection();
            
            // Test 5: Forum Interface File Check
            await this.testForumInterface();
            
            // Final Report
            this.generateFinalReport();
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        }
    }
    
    async testAPIHealth() {
        console.log('🏥 TEST 1: API Server Health Check');
        console.log('==================================');
        
        try {
            const response = await this.makeRequest('/health');
            
            if (response.status === 'healthy') {
                console.log('  ✅ API Server is healthy');
                console.log(`  📊 Uptime: ${response.uptime}ms`);
                console.log(`  💾 Database: ${response.database ? 'Connected' : 'Not Connected'}`);
                
                this.results.push({
                    test: 'API Health',
                    status: 'PASS',
                    details: `Healthy, uptime: ${response.uptime}ms`
                });
            } else {
                throw new Error('API not healthy');
            }
            
        } catch (error) {
            this.results.push({
                test: 'API Health',
                status: 'FAIL', 
                details: error.message
            });
            console.log(`  ❌ API Health check failed: ${error.message}`);
        }
        
        console.log('');
    }
    
    async testPostCreation() {
        console.log('📝 TEST 2: Post Creation & Basic Functionality');
        console.log('============================================');
        
        try {
            // Create a test post
            console.log('  📤 Creating test post...');
            const postData = {
                username: `TestUser_${this.testId}`,
                content: 'This is a test post to verify the forum system is working properly!'
            };
            
            const postResponse = await this.makeRequest('/api/forum/post', 'POST', postData);
            console.log(`  ✅ Post created with ID: ${postResponse.postId}`);
            
            // Wait for replies to generate
            console.log('  ⏳ Waiting for AI replies to generate...');
            await this.sleep(8000);
            
            // Get all posts to verify
            console.log('  📥 Fetching posts to verify...');
            const postsResponse = await this.makeRequest('/api/forum/posts');
            
            const testPost = postsResponse.posts.find(p => p.username === postData.username);
            
            if (testPost) {
                console.log(`  ✅ Test post found with ${testPost.replies?.length || 0} replies`);
                
                if (testPost.replies && testPost.replies.length > 0) {
                    testPost.replies.forEach((reply, index) => {
                        console.log(`    💬 Reply ${index + 1}: ${reply.rarity} - "${reply.content.substring(0, 50)}..."`);
                        if (reply.rarity === 'legendary') this.legendaryCount++;
                    });
                    this.totalReplies += testPost.replies.length;
                }
                
                this.results.push({
                    test: 'Post Creation',
                    status: 'PASS',
                    details: `Post created with ${testPost.replies?.length || 0} replies`
                });
            } else {
                throw new Error('Test post not found in response');
            }
            
        } catch (error) {
            this.results.push({
                test: 'Post Creation',
                status: 'FAIL',
                details: error.message
            });
            console.log(`  ❌ Post creation test failed: ${error.message}`);
        }
        
        console.log('');
    }
    
    async testRNGSystem() {
        console.log('🎲 TEST 3: RNG Reply System Statistics');
        console.log('======================================');
        
        try {
            console.log('  🎯 Creating multiple posts to test RNG distribution...');
            
            const testPosts = [
                'How can I optimize my website performance?',
                'What are the best practices for database design?',
                'Can you help me debug this complex algorithm?',
                'I need advice on scaling my application.',
                'What is the most efficient way to handle large datasets?'
            ];
            
            for (let i = 0; i < testPosts.length; i++) {
                console.log(`  📤 Creating test post ${i + 1}/5...`);
                
                await this.makeRequest('/api/forum/post', 'POST', {
                    username: `RNGTester${i + 1}`,
                    content: testPosts[i]
                });
                
                // Small delay between posts
                await this.sleep(2000);
            }
            
            console.log('  ⏳ Waiting for all AI replies to generate...');
            await this.sleep(15000);
            
            // Analyze RNG distribution
            const postsResponse = await this.makeRequest('/api/forum/posts');
            const allReplies = postsResponse.posts.flatMap(post => post.replies || []);
            
            const rngStats = {
                normal: allReplies.filter(r => r.rarity === 'normal').length,
                rare: allReplies.filter(r => r.rarity === 'rare').length,
                legendary: allReplies.filter(r => r.rarity === 'legendary').length,
                total: allReplies.length
            };
            
            console.log('  📊 RNG Distribution Results:');
            console.log(`    🟦 Normal: ${rngStats.normal} (${(rngStats.normal/rngStats.total*100).toFixed(1)}%) - Expected: ~70%`);
            console.log(`    🟧 Rare: ${rngStats.rare} (${(rngStats.rare/rngStats.total*100).toFixed(1)}%) - Expected: ~25%`);
            console.log(`    🟪 Legendary: ${rngStats.legendary} (${(rngStats.legendary/rngStats.total*100).toFixed(1)}%) - Expected: ~5%`);
            console.log(`    📈 Total Replies: ${rngStats.total}`);
            
            this.legendaryCount += rngStats.legendary;
            this.totalReplies += rngStats.total;
            
            const hasLegendary = rngStats.legendary > 0;
            const hasVariety = rngStats.normal > 0 && (rngStats.rare > 0 || rngStats.legendary > 0);
            
            this.results.push({
                test: 'RNG System',
                status: hasLegendary && hasVariety ? 'PASS' : 'PARTIAL',
                details: `${rngStats.total} replies: ${rngStats.normal}N, ${rngStats.rare}R, ${rngStats.legendary}L`
            });
            
            if (hasLegendary) {
                console.log('  🎉 SUCCESS: At least one legendary response generated!');
            }
            
        } catch (error) {
            this.results.push({
                test: 'RNG System',
                status: 'FAIL',
                details: error.message
            });
            console.log(`  ❌ RNG test failed: ${error.message}`);
        }
        
        console.log('');
    }
    
    async testWebSocketConnection() {
        console.log('📡 TEST 4: WebSocket Real-time Connection');
        console.log('=========================================');
        
        return new Promise((resolve) => {
            try {
                console.log('  🔌 Attempting WebSocket connection...');
                
                const ws = new WebSocket('ws://localhost:3334');
                let connected = false;
                let messageReceived = false;
                
                const timeout = setTimeout(() => {
                    if (!connected) {
                        console.log('  ⚠️  WebSocket connection timeout');
                        this.results.push({
                            test: 'WebSocket Connection',
                            status: 'FAIL',
                            details: 'Connection timeout'
                        });
                    }
                    resolve();
                }, 5000);
                
                ws.on('open', () => {
                    connected = true;
                    console.log('  ✅ WebSocket connected successfully');
                    
                    // Test sending a message
                    ws.send(JSON.stringify({
                        type: 'test',
                        message: 'Forum system test'
                    }));
                });
                
                ws.on('message', (data) => {
                    messageReceived = true;
                    console.log('  📨 WebSocket message received');
                    
                    this.results.push({
                        test: 'WebSocket Connection',
                        status: 'PASS',
                        details: 'Connected and message exchange successful'
                    });
                    
                    clearTimeout(timeout);
                    ws.close();
                    resolve();
                });
                
                ws.on('error', (error) => {
                    console.log(`  ❌ WebSocket error: ${error.message}`);
                    this.results.push({
                        test: 'WebSocket Connection',
                        status: 'FAIL',
                        details: error.message
                    });
                    
                    clearTimeout(timeout);
                    resolve();
                });
                
                ws.on('close', () => {
                    if (connected && !messageReceived) {
                        console.log('  ⚠️  WebSocket closed before message exchange');
                        this.results.push({
                            test: 'WebSocket Connection',
                            status: 'PARTIAL',
                            details: 'Connected but no message exchange'
                        });
                    }
                });
                
            } catch (error) {
                console.log(`  ❌ WebSocket test failed: ${error.message}`);
                this.results.push({
                    test: 'WebSocket Connection',
                    status: 'FAIL',
                    details: error.message
                });
                resolve();
            }
        });
    }
    
    async testForumInterface() {
        console.log('🖼️  TEST 5: Forum Interface File Verification');
        console.log('=============================================');
        
        const fs = require('fs').promises;
        
        try {
            // Check if forum interface file exists
            const interfaceExists = await this.fileExists('REAL-FORUM-INTERFACE.html');
            
            if (interfaceExists) {
                console.log('  ✅ REAL-FORUM-INTERFACE.html found');
                
                // Check file size (should be substantial)
                const stats = await fs.stat('REAL-FORUM-INTERFACE.html');
                console.log(`  📊 Interface file size: ${(stats.size/1024).toFixed(1)}KB`);
                
                if (stats.size > 10000) { // At least 10KB
                    console.log('  ✅ Interface file appears complete');
                    
                    this.results.push({
                        test: 'Forum Interface',
                        status: 'PASS',
                        details: `File exists, ${(stats.size/1024).toFixed(1)}KB`
                    });
                } else {
                    console.log('  ⚠️  Interface file seems small');
                    this.results.push({
                        test: 'Forum Interface', 
                        status: 'PARTIAL',
                        details: 'File exists but may be incomplete'
                    });
                }
            } else {
                throw new Error('REAL-FORUM-INTERFACE.html not found');
            }
            
        } catch (error) {
            console.log(`  ❌ Interface test failed: ${error.message}`);
            this.results.push({
                test: 'Forum Interface',
                status: 'FAIL',
                details: error.message
            });
        }
        
        console.log('');
    }
    
    generateFinalReport() {
        console.log('📊 FINAL TEST REPORT');
        console.log('====================');
        
        const passed = this.results.filter(r => r.status === 'PASS').length;
        const partial = this.results.filter(r => r.status === 'PARTIAL').length;
        const failed = this.results.filter(r => r.status === 'FAIL').length;
        
        console.log(`\n🎯 SUMMARY:`);
        console.log(`  ✅ Passed: ${passed}`);
        console.log(`  ⚠️  Partial: ${partial}`);
        console.log(`  ❌ Failed: ${failed}`);
        console.log(`  🎲 Total Replies Generated: ${this.totalReplies}`);
        console.log(`  🌟 Legendary Replies: ${this.legendaryCount}`);
        
        console.log(`\n📋 DETAILED RESULTS:`);
        this.results.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : 
                        result.status === 'PARTIAL' ? '⚠️' : '❌';
            console.log(`  ${icon} ${result.test}: ${result.status} - ${result.details}`);
        });
        
        // Overall status
        const overallStatus = failed === 0 ? 
            (partial === 0 ? 'SUCCESS' : 'MOSTLY_SUCCESS') : 
            'NEEDS_ATTENTION';
        
        console.log(`\n🏆 OVERALL STATUS: ${overallStatus}`);
        
        if (overallStatus === 'SUCCESS') {
            console.log('\n🎉 CONGRATULATIONS!');
            console.log('Your Cal Production Forum system is fully operational!');
            console.log('\n🌟 READY TO USE:');
            console.log('  1. Run: ./launch-forum.sh');
            console.log('  2. Forum will open automatically in your browser');
            console.log('  3. Create posts and watch the legendary RNG system!');
        }
        
        console.log('');
    }
    
    // Helper methods
    async makeRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const url = new URL(endpoint, this.apiBase);
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const req = http.request(url, options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const result = JSON.parse(body);
                        resolve(result);
                    } catch (error) {
                        reject(new Error(`Invalid JSON response: ${body}`));
                    }
                });
            });
            
            req.on('error', reject);
            
            if (data) {
                req.write(JSON.stringify(data));
            }
            
            req.end();
        });
    }
    
    async fileExists(path) {
        const fs = require('fs').promises;
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CLI interface
if (require.main === module) {
    const tester = new ForumSystemTest();
    
    console.log('🧪 Starting Forum System Integration Test...\n');
    
    tester.runFullTest()
        .then(() => {
            console.log('✅ Test suite completed!\n');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = ForumSystemTest;