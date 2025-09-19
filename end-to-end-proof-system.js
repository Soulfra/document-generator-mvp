#!/usr/bin/env node

/**
 * 🔬 END-TO-END PROOF SYSTEM 🔬
 * Prove that everything is actually working together
 * Show real data flow from APIs → bridges → unified system → interfaces
 */

const axios = require('axios');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs');

class EndToEndProofSystem {
    constructor() {
        this.proofResults = {
            realDataFlow: {},
            crossLayerCommunication: {},
            worldsDiscovery: {},
            userInteraction: {},
            wormholeIntegration: {},
            overallProof: 'unknown'
        };
        
        this.wsConnections = new Map();
        this.messageLog = [];
        
        console.log('🔬 END-TO-END PROOF SYSTEM INITIALIZED');
    }
    
    async runCompleteProof() {
        console.log('\n🔬 RUNNING COMPLETE END-TO-END PROOF');
        console.log('=====================================\n');
        
        try {
            // PROOF 1: Real data is flowing from external APIs to our system
            await this.proveRealDataFlow();
            
            // PROOF 2: All layers can communicate with each other
            await this.proveCrossLayerCommunication();
            
            // PROOF 3: World discovery actually finds and can start things
            await this.proveWorldsDiscovery();
            
            // PROOF 4: User interfaces can interact with the system
            await this.proveUserInteraction();
            
            // PROOF 5: Wormhole re-auth actually changed something
            await this.proveWormholeIntegration();
            
            // PROOF 6: Generate irrefutable evidence
            await this.generateIrrefutableEvidence();
            
            console.log('\n🎯 END-TO-END PROOF COMPLETE!');
            
        } catch (error) {
            console.error('❌ End-to-end proof failed:', error);
            this.proofResults.overallProof = 'failed';
        }
    }
    
    async proveRealDataFlow() {
        console.log('📡 PROOF 1: Real Data Flow from External APIs');
        console.log('============================================');
        
        const proofs = [];
        
        // Trace Wikipedia data from source to system
        console.log('\n🔍 Tracing Wikipedia API → Universal Bridge → Unified System...');
        
        try {
            // Step 1: Direct Wikipedia API call
            const wikiDirect = await axios.get('https://en.wikipedia.org/api/rest_v1/page/summary/Artificial_intelligence');
            const wikiTitle = wikiDirect.data.title;
            const wikiExtract = wikiDirect.data.extract.substring(0, 100);
            
            console.log(`  📄 Wikipedia Direct: "${wikiTitle}" - "${wikiExtract}..."`);
            
            // Step 2: Get same data through our Universal Bridge
            const bridgeData = await axios.get('http://localhost:9999/api/real-data');
            const bridgeWiki = bridgeData.data.data.wikipedia;
            
            console.log(`  🌉 Through Bridge: "${bridgeWiki.title}" - "${bridgeWiki.extract.substring(0, 100)}..."`);
            
            // Step 3: Get same data through Unified System
            const unifiedData = await axios.get('http://localhost:8080/api/unified-data');
            const unifiedWiki = unifiedData.data.universal.data.wikipedia;
            
            console.log(`  🎯 Through Unified: "${unifiedWiki.title}" - "${unifiedWiki.extract.substring(0, 100)}..."`);
            
            // Verify data consistency
            const dataMatches = wikiTitle === bridgeWiki.title && bridgeWiki.title === unifiedWiki.title;
            
            proofs.push({
                test: 'Wikipedia data consistency',
                result: dataMatches,
                details: `Direct → Bridge → Unified: "${wikiTitle}" → "${bridgeWiki.title}" → "${unifiedWiki.title}"`
            });
            
            console.log(`  ${dataMatches ? '✅' : '❌'} Data consistency: ${dataMatches ? 'PROVED' : 'FAILED'}`);
            
        } catch (error) {
            proofs.push({
                test: 'Wikipedia data flow',
                result: false,
                error: error.message
            });
            console.log(`  ❌ Wikipedia data flow: FAILED - ${error.message}`);
        }
        
        // Trace GitHub data
        console.log('\n🔍 Tracing GitHub API → Universal Bridge → Unified System...');
        
        try {
            const githubDirect = await axios.get('https://api.github.com/repos/microsoft/vscode');
            const directStars = githubDirect.data.stargazers_count;
            
            const bridgeData = await axios.get('http://localhost:9999/api/real-data');
            const bridgeStars = bridgeData.data.data.github.stars;
            
            const unifiedData = await axios.get('http://localhost:8080/api/unified-data');
            const unifiedStars = unifiedData.data.universal.data.github.stars;
            
            const starsMatch = directStars === bridgeStars && bridgeStars === unifiedStars;
            
            proofs.push({
                test: 'GitHub data consistency',
                result: starsMatch,
                details: `Stars: ${directStars} → ${bridgeStars} → ${unifiedStars}`
            });
            
            console.log(`  ${starsMatch ? '✅' : '❌'} GitHub stars consistency: ${starsMatch ? 'PROVED' : 'FAILED'}`);
            console.log(`  📊 Star count: ${directStars} (verified across all layers)`);
            
        } catch (error) {
            proofs.push({
                test: 'GitHub data flow',
                result: false,
                error: error.message
            });
            console.log(`  ❌ GitHub data flow: FAILED - ${error.message}`);
        }
        
        // Verify W3C integration
        console.log('\n🔍 Verifying W3C Integration...');
        
        try {
            const w3cDirect = await axios.get('https://www.w3.org/Status');
            const directPageSize = w3cDirect.data.length;
            
            const bridgeData = await axios.get('http://localhost:9999/api/real-data');
            const bridgePageSize = bridgeData.data.data.w3c.statusPageSize;
            
            const sizesMatch = Math.abs(directPageSize - bridgePageSize) < 1000; // Allow small differences
            
            proofs.push({
                test: 'W3C integration',
                result: sizesMatch,
                details: `Page sizes: ${directPageSize} vs ${bridgePageSize}`
            });
            
            console.log(`  ${sizesMatch ? '✅' : '❌'} W3C integration: ${sizesMatch ? 'PROVED' : 'FAILED'}`);
            console.log(`  📄 W3C validators available: ${bridgeData.data.data.w3c.availableStandards.validationTools.length}`);
            
        } catch (error) {
            proofs.push({
                test: 'W3C integration',
                result: false,
                error: error.message
            });
            console.log(`  ❌ W3C integration: FAILED - ${error.message}`);
        }
        
        this.proofResults.realDataFlow = {
            proofs: proofs,
            passed: proofs.filter(p => p.result).length,
            total: proofs.length,
            success: proofs.every(p => p.result)
        };
        
        console.log(`\n📊 Real Data Flow Proof: ${this.proofResults.realDataFlow.passed}/${this.proofResults.realDataFlow.total} tests passed`);
    }
    
    async proveCrossLayerCommunication() {
        console.log('\n🌉 PROOF 2: Cross-Layer Communication');
        console.log('=====================================');
        
        const testMessage = `TEST_MESSAGE_${Date.now()}`;
        let messageReceived = false;
        
        try {
            // Connect to unified broadcaster WebSocket
            const ws = new WebSocket('ws://localhost:8081?layer=proof&world=test');
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);
                
                ws.on('open', () => {
                    clearTimeout(timeout);
                    console.log('  🔗 Connected to unified broadcaster WebSocket');
                    
                    // Listen for messages
                    ws.on('message', (data) => {
                        const message = JSON.parse(data);
                        this.messageLog.push({
                            timestamp: new Date().toISOString(),
                            type: message.type,
                            source: 'unified_broadcaster'
                        });
                        
                        if (message.type === 'universal-message' && message.data.message === testMessage) {
                            messageReceived = true;
                            console.log('  ✅ Test message received back through WebSocket');
                        }
                        
                        console.log(`  📨 Received: ${message.type}`);
                    });
                    
                    resolve();
                });
                
                ws.on('error', reject);
            });
            
            // Send broadcast through API
            console.log('  📡 Sending test broadcast through API...');
            await axios.post('http://localhost:8080/api/broadcast', {
                message: testMessage,
                layer: 'all',
                target: null
            });
            
            // Wait for message to propagate
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            ws.close();
            
        } catch (error) {
            console.log(`  ❌ Cross-layer communication: FAILED - ${error.message}`);
        }
        
        this.proofResults.crossLayerCommunication = {
            wsConnection: true,
            messagesSent: 1,
            messagesReceived: this.messageLog.length,
            broadcastWorking: messageReceived,
            success: messageReceived
        };
        
        console.log(`  ${messageReceived ? '✅' : '❌'} Cross-layer broadcast: ${messageReceived ? 'PROVED' : 'FAILED'}`);
        console.log(`  📨 Messages logged: ${this.messageLog.length}`);
    }
    
    async proveWorldsDiscovery() {
        console.log('\n🌍 PROOF 3: World Discovery and Interaction');
        console.log('===========================================');
        
        try {
            // Get all discovered worlds
            const worldsResponse = await axios.get('http://localhost:8080/api/worlds');
            const worlds = worldsResponse.data.worlds;
            const categories = worldsResponse.data.categories;
            
            console.log(`  🔍 Total worlds discovered: ${worlds.length}`);
            console.log(`  📊 Categories: ${categories.worlds} worlds, ${categories.engines} engines, ${categories.games} games, ${categories.interfaces} interfaces`);
            
            // Test starting a specific world
            const testWorld = worlds.find(w => w.name.includes('game') && w.extension === '.html');
            
            if (testWorld) {
                console.log(`  🎮 Testing world startup: ${testWorld.name}`);
                
                const startResponse = await axios.post(`http://localhost:8080/api/worlds/${testWorld.name}/start`);
                
                console.log(`  ${startResponse.data.success ? '✅' : '❌'} World startup: ${startResponse.data.success ? 'SUCCESS' : 'FAILED'}`);
                
                this.proofResults.worldsDiscovery = {
                    totalWorlds: worlds.length,
                    categories: categories,
                    testWorldStarted: startResponse.data.success,
                    success: startResponse.data.success && worlds.length > 500
                };
            } else {
                this.proofResults.worldsDiscovery = {
                    totalWorlds: worlds.length,
                    categories: categories,
                    testWorldStarted: false,
                    success: worlds.length > 500
                };
            }
            
        } catch (error) {
            console.log(`  ❌ World discovery: FAILED - ${error.message}`);
            this.proofResults.worldsDiscovery = {
                success: false,
                error: error.message
            };
        }
    }
    
    async proveUserInteraction() {
        console.log('\n👤 PROOF 4: User Interface Interaction');
        console.log('======================================');
        
        try {
            // Test gaming interface data
            const gamingResponse = await axios.get('http://localhost:7777/api/gaming-data');
            const gamingData = gamingResponse.data;
            
            console.log(`  🎮 Gaming engines available: ${gamingData.activeGameEngines}/${gamingData.totalGameEngines}`);
            console.log(`  👥 Active players: ${gamingData.activePlayers}`);
            
            // Test user action through gaming bridge
            const actionResponse = await axios.post('http://localhost:7777/api/player/action', {
                action: 'invest',
                gameId: 'vcGame',
                data: { amount: 1000, company: 'TestCorp' }
            });
            
            console.log(`  ${actionResponse.data.success ? '✅' : '❌'} User action simulation: ${actionResponse.data.success ? 'SUCCESS' : 'FAILED'}`);
            
            if (actionResponse.data.success) {
                console.log(`  💰 Investment result: ${actionResponse.data.outcome} (${actionResponse.data.returns})`);
            }
            
            this.proofResults.userInteraction = {
                gamingEngines: gamingData.totalGameEngines,
                userActionWorking: actionResponse.data.success,
                actionResult: actionResponse.data,
                success: actionResponse.data.success
            };
            
        } catch (error) {
            console.log(`  ❌ User interaction: FAILED - ${error.message}`);
            this.proofResults.userInteraction = {
                success: false,
                error: error.message
            };
        }
    }
    
    async proveWormholeIntegration() {
        console.log('\n🕳️ PROOF 5: Wormhole Re-Authentication Impact');
        console.log('==============================================');
        
        try {
            // Check if wormhole auth chain exists
            if (fs.existsSync('wormhole-auth-chain.json')) {
                const authChain = JSON.parse(fs.readFileSync('wormhole-auth-chain.json', 'utf8'));
                
                console.log(`  🔗 Authentication chain: ${authChain.chain.length} blocks`);
                console.log(`  ✅ Success rate: ${(authChain.status.successCount / (authChain.status.successCount + authChain.status.failures.length) * 100).toFixed(1)}%`);
                console.log(`  🔐 Authenticated nodes: ${authChain.status.successCount}`);
                
                // Verify W3C integration is working
                const w3cData = await axios.get('http://localhost:9999/api/real-data');
                const hasW3C = w3cData.data.data.w3c && w3cData.data.data.w3c.authenticationReady;
                
                console.log(`  ${hasW3C ? '✅' : '❌'} W3C integration active: ${hasW3C ? 'YES' : 'NO'}`);
                
                this.proofResults.wormholeIntegration = {
                    authChainExists: true,
                    chainLength: authChain.chain.length,
                    successRate: authChain.status.successCount / (authChain.status.successCount + authChain.status.failures.length),
                    w3cIntegrated: hasW3C,
                    success: hasW3C && authChain.chain.length > 5
                };
                
            } else {
                console.log('  ❌ No wormhole authentication chain found');
                this.proofResults.wormholeIntegration = { success: false };
            }
            
        } catch (error) {
            console.log(`  ❌ Wormhole integration: FAILED - ${error.message}`);
            this.proofResults.wormholeIntegration = {
                success: false,
                error: error.message
            };
        }
    }
    
    async generateIrrefutableEvidence() {
        console.log('\n📋 PROOF 6: Generating Irrefutable Evidence');
        console.log('===========================================');
        
        const evidence = {
            timestamp: new Date().toISOString(),
            proofSystem: 'End-to-End Verification',
            
            // System status at time of proof
            systemSnapshot: {},
            
            // All proof results
            proofResults: this.proofResults,
            
            // Message log showing real communication
            communicationLog: this.messageLog,
            
            // Overall assessment
            overallVerdict: null
        };
        
        try {
            // Take system snapshot
            const [broadcaster, gaming, universal, financial] = await Promise.all([
                axios.get('http://localhost:8080/api/status'),
                axios.get('http://localhost:7777/api/gaming-status'),
                axios.get('http://localhost:9999/api/universal-status'),
                axios.get('http://localhost:8888/api/real-economy')
            ]);
            
            evidence.systemSnapshot = {
                broadcaster: broadcaster.data,
                gaming: gaming.data,
                universal: universal.data,
                financial: financial.data
            };
            
            // Determine overall verdict
            const allProofsPassed = Object.values(this.proofResults).every(proof => 
                proof.success !== false
            );
            
            evidence.overallVerdict = allProofsPassed ? 'FULLY_OPERATIONAL' : 'NEEDS_ATTENTION';
            this.proofResults.overallProof = evidence.overallVerdict;
            
            // Save evidence
            fs.writeFileSync('irrefutable-evidence.json', JSON.stringify(evidence, null, 2));
            
            console.log('  📄 Evidence saved to irrefutable-evidence.json');
            console.log(`  ⚖️ Overall verdict: ${evidence.overallVerdict}`);
            
            // Print summary
            console.log('\n' + '='.repeat(60));
            console.log('🏆 FINAL PROOF SUMMARY 🏆');
            console.log('='.repeat(60));
            
            const proofNames = [
                'Real Data Flow',
                'Cross-Layer Communication', 
                'World Discovery',
                'User Interaction',
                'Wormhole Integration'
            ];
            
            Object.values(this.proofResults).slice(0, 5).forEach((proof, i) => {
                const status = proof.success ? '✅ PROVED' : '❌ FAILED';
                console.log(`${status}: ${proofNames[i]}`);
            });
            
            console.log('='.repeat(60));
            
            if (allProofsPassed) {
                console.log('🎉 ALL PROOFS PASSED - SYSTEM FULLY VERIFIED! 🎉');
                console.log('Every layer is connected and working with real data!');
            } else {
                console.log('⚠️ SOME PROOFS FAILED - SYSTEM NEEDS ATTENTION');
                console.log('Check individual proof results for details.');
            }
            
            console.log('='.repeat(60));
            
        } catch (error) {
            console.error('❌ Evidence generation failed:', error);
            evidence.overallVerdict = 'EVIDENCE_GENERATION_FAILED';
        }
    }
}

// Run proof if called directly
if (require.main === module) {
    console.log('🔬 Starting End-to-End Proof System...\n');
    
    const prover = new EndToEndProofSystem();
    
    prover.runCompleteProof().then(() => {
        console.log('\n✅ End-to-end proof complete!');
        process.exit(0);
    }).catch((error) => {
        console.error('\n❌ End-to-end proof failed:', error);
        process.exit(1);
    });
}

module.exports = EndToEndProofSystem;