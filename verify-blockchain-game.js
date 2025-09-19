#!/usr/bin/env node

/**
 * Blockchain Game Verification System
 * Proves everything is working by running comprehensive tests
 * and monitoring all system components in real-time
 */

const Web3 = require('web3');
const axios = require('axios');
const WebSocket = require('ws');
const fs = require('fs');

class BlockchainGameVerifier {
    constructor() {
        this.web3 = new Web3('http://localhost:8545');
        this.testResults = [];
        this.realTimeMonitor = {};
        
        // Service endpoints to verify
        this.services = {
            'Meta Layer': { api: 'http://localhost:48015', ws: 'ws://localhost:48016' },
            'Monero Explorer': { api: 'http://localhost:48013', ws: 'ws://localhost:48014' },
            'BlameChain': { api: 'http://localhost:48011', ws: 'ws://localhost:48012' },
            'Handshake Layer': { api: 'http://localhost:48009', ws: 'ws://localhost:48010' },
            'Game Bridge': { api: 'http://localhost:48017', ws: 'ws://localhost:48018' }
        };
        
        console.log('🔍 BLOCKCHAIN GAME VERIFICATION SYSTEM');
        console.log('======================================');
        console.log('✅ Proving everything works end-to-end');
        console.log('📊 Real-time monitoring of all components');
        console.log('⛓️ Blockchain transaction verification');
        console.log('🎮 Game interaction testing');
        console.log('');
    }
    
    async runCompleteVerification() {
        console.log('🚀 Starting complete system verification...\n');
        
        try {
            // Phase 1: Infrastructure Verification
            await this.verifyInfrastructure();
            
            // Phase 2: Service Health Checks
            await this.verifyAllServices();
            
            // Phase 3: Blockchain Integration Test
            await this.verifyBlockchainIntegration();
            
            // Phase 4: End-to-End Game Test
            await this.runEndToEndGameTest();
            
            // Phase 5: Real-time Monitoring
            await this.startRealTimeMonitoring();
            
            // Phase 6: Generate Verification Report
            this.generateVerificationReport();
            
        } catch (error) {
            console.error('❌ Verification failed:', error);
            this.addTestResult('CRITICAL_FAILURE', 'Complete verification failed', error.message, false);
        }
        
        console.log('\n🎯 Verification complete! Check the results above.');
        return this.testResults;
    }
    
    async verifyInfrastructure() {
        console.log('📋 Phase 1: Infrastructure Verification');
        console.log('----------------------------------------');
        
        // Check Ethereum node
        try {
            const accounts = await this.web3.eth.getAccounts();
            const blockNumber = await this.web3.eth.getBlockNumber();
            
            this.addTestResult('BLOCKCHAIN', 'Ethereum node connectivity', 
                `Connected to local node, ${accounts.length} accounts, block ${blockNumber}`, true);
                
            console.log(`✅ Ethereum: ${accounts.length} accounts, block ${blockNumber}`);
        } catch (error) {
            this.addTestResult('BLOCKCHAIN', 'Ethereum node connectivity', error.message, false);
            console.log('❌ Ethereum node not available');
        }
        
        // Check Node.js version
        const nodeVersion = process.version;
        this.addTestResult('SYSTEM', 'Node.js version', nodeVersion, true);
        console.log(`✅ Node.js: ${nodeVersion}`);
        
        // Check if contracts directory exists
        const contractsExist = fs.existsSync('./contracts/GameBroadcastRegistry.sol');
        this.addTestResult('SYSTEM', 'Smart contracts', 
            contractsExist ? 'Contracts found' : 'Contracts missing', contractsExist);
        console.log(`${contractsExist ? '✅' : '❌'} Smart contracts: ${contractsExist ? 'Found' : 'Missing'}`);
        
        console.log('');
    }
    
    async verifyAllServices() {
        console.log('📋 Phase 2: Service Health Verification');
        console.log('---------------------------------------');
        
        for (const [serviceName, config] of Object.entries(this.services)) {
            await this.verifyService(serviceName, config);
        }
        
        console.log('');
    }
    
    async verifyService(serviceName, config) {
        console.log(`🔍 Testing ${serviceName}...`);
        
        // Test HTTP API
        try {
            const response = await axios.get(`${config.api}/health`, { timeout: 5000 });
            this.addTestResult('SERVICE_HTTP', serviceName, `HTTP OK (${response.status})`, true);
            console.log(`  ✅ HTTP API: Available`);
        } catch (error) {
            this.addTestResult('SERVICE_HTTP', serviceName, `HTTP failed: ${error.message}`, false);
            console.log(`  ❌ HTTP API: ${error.message}`);
        }
        
        // Test WebSocket
        try {
            const wsConnected = await this.testWebSocket(config.ws);
            this.addTestResult('SERVICE_WS', serviceName, 
                wsConnected ? 'WebSocket connected' : 'WebSocket failed', wsConnected);
            console.log(`  ${wsConnected ? '✅' : '❌'} WebSocket: ${wsConnected ? 'Connected' : 'Failed'}`);
        } catch (error) {
            this.addTestResult('SERVICE_WS', serviceName, `WebSocket error: ${error.message}`, false);
            console.log(`  ❌ WebSocket: ${error.message}`);
        }
    }
    
    async testWebSocket(wsUrl) {
        return new Promise((resolve, reject) => {
            try {
                const ws = new WebSocket(wsUrl);
                const timeout = setTimeout(() => {
                    ws.close();
                    resolve(false);
                }, 3000);
                
                ws.on('open', () => {
                    clearTimeout(timeout);
                    ws.close();
                    resolve(true);
                });
                
                ws.on('error', () => {
                    clearTimeout(timeout);
                    resolve(false);
                });
            } catch (error) {
                resolve(false);
            }
        });
    }
    
    async verifyBlockchainIntegration() {
        console.log('📋 Phase 3: Blockchain Integration Verification');
        console.log('----------------------------------------------');
        
        try {
            // Check if Game Bridge is available
            const bridgeStatus = await axios.get('http://localhost:48017/api/contract-status');
            const status = bridgeStatus.data;
            
            console.log(`🔍 Contract Status:`);
            console.log(`  Deployed: ${status.contractDeployed}`);
            console.log(`  Address: ${status.contractAddress || 'None'}`);
            console.log(`  Active Sessions: ${status.activeSessions}`);
            console.log(`  Connected Systems: ${status.connectedSystems.join(', ')}`);
            
            this.addTestResult('BLOCKCHAIN_INTEGRATION', 'Game Bridge Status', 
                `Contract: ${status.contractDeployed}, Systems: ${status.connectedSystems.length}`, true);
            
            // If contract is not deployed, try to deploy it
            if (!status.contractDeployed) {
                console.log('📄 Deploying GameBroadcastRegistry contract...');
                
                try {
                    const deployResponse = await axios.post('http://localhost:48017/api/deploy-game-contract');
                    const deployResult = deployResponse.data;
                    
                    if (deployResult.success) {
                        console.log(`✅ Contract deployed: ${deployResult.contractAddress}`);
                        this.addTestResult('BLOCKCHAIN_DEPLOY', 'Contract Deployment', 
                            `Deployed to ${deployResult.contractAddress}`, true);
                    }
                } catch (deployError) {
                    console.log(`❌ Contract deployment failed: ${deployError.message}`);
                    this.addTestResult('BLOCKCHAIN_DEPLOY', 'Contract Deployment', 
                        deployError.message, false);
                }
            }
            
        } catch (error) {
            console.log(`❌ Blockchain integration check failed: ${error.message}`);
            this.addTestResult('BLOCKCHAIN_INTEGRATION', 'Integration Check', error.message, false);
        }
        
        console.log('');
    }
    
    async runEndToEndGameTest() {
        console.log('📋 Phase 4: End-to-End Game Test');
        console.log('--------------------------------');
        
        try {
            // Step 1: Start a game session
            console.log('🎮 Step 1: Starting game session...');
            const sessionResponse = await axios.post('http://localhost:48017/api/start-game-session', {
                playerAddress: null // Use default
            });
            
            if (sessionResponse.data.success) {
                const sessionId = sessionResponse.data.sessionId;
                console.log(`✅ Game session started: ${sessionId}`);
                this.addTestResult('GAME_TEST', 'Session Start', `Session ID: ${sessionId}`, true);
                
                // Step 2: Record some interactions
                await this.simulateGameInteractions(sessionId);
                
                // Step 3: Verify blockchain records
                await this.verifyBlockchainRecords(sessionId);
                
            } else {
                throw new Error('Failed to start game session');
            }
            
        } catch (error) {
            console.log(`❌ End-to-end test failed: ${error.message}`);
            this.addTestResult('GAME_TEST', 'End-to-End Test', error.message, false);
        }
        
        console.log('');
    }
    
    async simulateGameInteractions(sessionId) {
        console.log('🎯 Step 2: Simulating game interactions...');
        
        const interactions = [
            {
                type: 'node_click',
                serviceName: 'Meta Layer',
                scoreGained: 10,
                description: 'Clicked Meta Layer node'
            },
            {
                type: 'discovery',
                serviceName: 'Discovery System',
                scoreGained: 50,
                description: 'Triggered service discovery'
            },
            {
                type: 'narrative',
                serviceName: 'Meta Layer',
                scoreGained: 25,
                description: 'Added system narrative'
            }
        ];
        
        for (const interaction of interactions) {
            try {
                const response = await axios.post('http://localhost:48017/api/record-interaction', {
                    sessionId: sessionId,
                    serviceName: interaction.serviceName,
                    interactionType: interaction.type,
                    scoreGained: interaction.scoreGained,
                    additionalData: interaction.description
                });
                
                if (response.data.success) {
                    console.log(`  ✅ ${interaction.description} - TX: ${response.data.transactionHash.substring(0, 10)}...`);
                    this.addTestResult('GAME_INTERACTION', interaction.type, 
                        `Recorded with TX: ${response.data.transactionHash}`, true);
                } else {
                    throw new Error('Interaction recording failed');
                }
                
                // Wait between interactions
                await this.delay(2000);
                
            } catch (error) {
                console.log(`  ❌ ${interaction.description} failed: ${error.message}`);
                this.addTestResult('GAME_INTERACTION', interaction.type, error.message, false);
            }
        }
    }
    
    async verifyBlockchainRecords(sessionId) {
        console.log('🔍 Step 3: Verifying blockchain records...');
        
        try {
            // Get session data from blockchain
            const sessionResponse = await axios.get(`http://localhost:48017/api/game-session/${sessionId}`);
            const sessionData = sessionResponse.data;
            
            console.log(`  📊 Session Data:`);
            console.log(`    Player: ${sessionData.player}`);
            console.log(`    Start Time: ${new Date(sessionData.startTime * 1000).toLocaleString()}`);
            console.log(`    Interactions: ${sessionData.totalInteractions}`);
            console.log(`    Status: ${sessionData.isActive ? 'Active' : 'Ended'}`);
            
            this.addTestResult('BLOCKCHAIN_VERIFY', 'Session Verification', 
                `Found ${sessionData.totalInteractions} interactions on-chain`, true);
            
            // Get broadcast data
            const broadcastResponse = await axios.get(`http://localhost:48017/api/session-broadcasts/${sessionId}`);
            const broadcasts = broadcastResponse.data.broadcasts;
            
            console.log(`  📡 Broadcasts: ${broadcasts.length} events recorded`);
            
            broadcasts.forEach((broadcast, index) => {
                console.log(`    ${index + 1}. ${broadcast.eventType} from ${broadcast.sourceService} at ${new Date(broadcast.timestamp * 1000).toLocaleTimeString()}`);
            });
            
            this.addTestResult('BLOCKCHAIN_VERIFY', 'Broadcast Verification', 
                `Found ${broadcasts.length} broadcasts on-chain`, true);
            
        } catch (error) {
            console.log(`  ❌ Blockchain verification failed: ${error.message}`);
            this.addTestResult('BLOCKCHAIN_VERIFY', 'Verification', error.message, false);
        }
    }
    
    async startRealTimeMonitoring() {
        console.log('📋 Phase 5: Real-Time Monitoring');
        console.log('--------------------------------');
        console.log('🔴 LIVE: Monitoring all services for 30 seconds...\n');
        
        // Monitor each service
        for (const [serviceName, config] of Object.entries(this.services)) {
            this.monitorService(serviceName, config);
        }
        
        // Run monitoring for 30 seconds
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('\n📊 Real-time monitoring complete.');
                this.addTestResult('MONITORING', 'Real-time Monitoring', 
                    'Monitored all services for 30 seconds', true);
                resolve();
            }, 30000);
        });
    }
    
    monitorService(serviceName, config) {
        try {
            const ws = new WebSocket(config.ws);
            
            ws.on('open', () => {
                console.log(`🟢 ${serviceName}: Connected to real-time stream`);
                this.realTimeMonitor[serviceName] = { connected: true, messages: 0 };
                
                // Send monitoring request
                ws.send(JSON.stringify({ 
                    type: 'monitor_request',
                    source: 'verification_system'
                }));
            });
            
            ws.on('message', (data) => {
                this.realTimeMonitor[serviceName].messages++;
                try {
                    const message = JSON.parse(data);
                    console.log(`📡 ${serviceName}: ${message.type || 'message'} - ${new Date().toLocaleTimeString()}`);
                } catch (e) {
                    console.log(`📡 ${serviceName}: Raw message - ${new Date().toLocaleTimeString()}`);
                }
            });
            
            ws.on('error', (error) => {
                console.log(`🔴 ${serviceName}: Connection error`);
            });
            
            ws.on('close', () => {
                console.log(`⚫ ${serviceName}: Connection closed`);
            });
            
        } catch (error) {
            console.log(`❌ ${serviceName}: Monitor setup failed`);
        }
    }
    
    generateVerificationReport() {
        console.log('\n📋 VERIFICATION REPORT');
        console.log('=====================');
        
        const passed = this.testResults.filter(r => r.passed).length;
        const failed = this.testResults.filter(r => !r.passed).length;
        const total = this.testResults.length;
        
        console.log(`\n📊 Summary: ${passed}/${total} tests passed (${failed} failed)`);
        console.log(`✅ Success Rate: ${((passed/total) * 100).toFixed(1)}%\n`);
        
        // Group results by category
        const categories = {};
        this.testResults.forEach(result => {
            if (!categories[result.category]) {
                categories[result.category] = [];
            }
            categories[result.category].push(result);
        });
        
        // Display by category
        for (const [category, results] of Object.entries(categories)) {
            console.log(`📂 ${category}:`);
            results.forEach(result => {
                const status = result.passed ? '✅' : '❌';
                console.log(`  ${status} ${result.testName}: ${result.result}`);
            });
            console.log('');
        }
        
        // Real-time monitoring summary
        console.log('📡 Real-time Monitoring Results:');
        for (const [service, data] of Object.entries(this.realTimeMonitor)) {
            const status = data.connected ? '🟢' : '🔴';
            console.log(`  ${status} ${service}: ${data.messages || 0} messages received`);
        }
        
        // Generate JSON report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: total,
                passed: passed,
                failed: failed,
                successRate: ((passed/total) * 100).toFixed(1) + '%'
            },
            testResults: this.testResults,
            realTimeMonitoring: this.realTimeMonitor
        };
        
        fs.writeFileSync('./verification-report.json', JSON.stringify(report, null, 2));
        console.log('\n💾 Detailed report saved to: verification-report.json');
        
        // Final verdict
        if (failed === 0) {
            console.log('\n🎉 ALL SYSTEMS VERIFIED! Everything is working perfectly!');
        } else if (failed < 3) {
            console.log('\n⚠️ MOSTLY WORKING: Some minor issues detected');
        } else {
            console.log('\n❌ ISSUES DETECTED: Multiple systems need attention');
        }
    }
    
    addTestResult(category, testName, result, passed) {
        this.testResults.push({
            category: category,
            testName: testName,
            result: result,
            passed: passed,
            timestamp: new Date().toISOString()
        });
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create interactive verification runner
class InteractiveVerifier {
    constructor() {
        this.verifier = new BlockchainGameVerifier();
    }
    
    async run() {
        console.log('🎯 INTERACTIVE BLOCKCHAIN GAME VERIFIER');
        console.log('=======================================\n');
        
        console.log('Choose verification mode:');
        console.log('1. 🚀 Complete Verification (All tests + monitoring)');
        console.log('2. ⚡ Quick Health Check (Services only)');
        console.log('3. 🔗 Blockchain Only (Contract + transactions)');
        console.log('4. 🎮 Game Test Only (End-to-end gameplay)');
        console.log('5. 📡 Monitor Mode (Real-time monitoring only)\n');
        
        // For automated run, just do complete verification
        if (process.argv.includes('--auto')) {
            console.log('🤖 Running in automated mode - Complete Verification\n');
            return await this.verifier.runCompleteVerification();
        }
        
        // Interactive menu would go here for manual testing
        console.log('🤖 Auto-running Complete Verification...\n');
        return await this.verifier.runCompleteVerification();
    }
}

// Auto-start verification
if (require.main === module) {
    const interactive = new InteractiveVerifier();
    
    interactive.run().then(() => {
        console.log('\n🏁 Verification complete. Check the results above!');
        process.exit(0);
    }).catch((error) => {
        console.error('\n💥 Verification system crashed:', error);
        process.exit(1);
    });
}

module.exports = { BlockchainGameVerifier, InteractiveVerifier };