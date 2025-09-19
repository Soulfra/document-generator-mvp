#!/usr/bin/env node

/**
 * 🧪 CODEBASE MIRRORING SYSTEM DEMO
 * Demonstrates the complete codebase analysis and mirroring ecosystem
 */

const WebSocket = require('ws');
const { execSync } = require('child_process');

class CodebaseMirroringDemo {
    constructor() {
        this.analysisWS = null;
        this.mirroringWS = null;
        this.emergencyWS = null;
        this.characterWS = null;
        
        this.demoSteps = [
            'connect_to_systems',
            'trigger_codebase_scan',
            'analyze_reasoning_patterns',
            'generate_pairings',
            'create_critical_discovery',
            'test_emergency_notification',
            'demonstrate_human_loop',
            'show_character_integration'
        ];
        
        this.currentStep = 0;
    }
    
    async runDemo() {
        console.log('🧪 CODEBASE ANALYSIS & MIRRORING SYSTEM DEMO');
        console.log('============================================');
        console.log('');
        console.log('This demo shows how the system:');
        console.log('✅ Analyzes your own codebase and reasoning files');
        console.log('✅ Mirrors findings to pair with financial anomalies');
        console.log('✅ Surfaces critical discoveries through notifications');
        console.log('✅ Integrates with human-in-the-loop workflows');
        console.log('✅ Connects to your character interface');
        console.log('');
        
        // Check if systems are running
        await this.checkSystemsRunning();
        
        // Run demo steps
        for (const step of this.demoSteps) {
            await this.runDemoStep(step);
            await this.wait(2000); // Wait 2 seconds between steps
        }
        
        console.log('');
        console.log('🎉 DEMO COMPLETE!');
        console.log('');
        console.log('💡 Your codebase analysis and mirroring system is now:');
        console.log('   📊 Continuously analyzing your own code and reasoning');
        console.log('   🪞 Mirroring findings to pair with discoveries');
        console.log('   🚨 Sending critical alerts to emergency system');
        console.log('   🎮 Integrating with character interface notifications');
        console.log('   👥 Managing human-in-the-loop workflows');
        console.log('');
        console.log('🎯 To interact with the system:');
        console.log('   1. Open interactive-character-interface.html');
        console.log('   2. Check emergency inbox for critical findings');
        console.log('   3. Review human tasks queue for actions needed');
        console.log('   4. Monitor character notifications for discoveries');
        console.log('');
        
        process.exit(0);
    }
    
    async checkSystemsRunning() {
        console.log('🔍 Checking if systems are running...');
        
        const requiredPorts = [8087, 8088, 8089, 8090];
        const runningPorts = [];
        
        for (const port of requiredPorts) {
            try {
                execSync(`lsof -i:${port}`, { stdio: 'ignore' });
                runningPorts.push(port);
                console.log(`✅ Port ${port} is active`);
            } catch (error) {
                console.log(`❌ Port ${port} is not active`);
            }
        }
        
        if (runningPorts.length < requiredPorts.length) {
            console.log('');
            console.log('⚠️  Not all required systems are running!');
            console.log('');
            console.log('🚀 To start all systems, run:');
            console.log('   ./launch-complete-codebase-mirroring-system.sh');
            console.log('');
            console.log('   Then run this demo again.');
            process.exit(1);
        }
        
        console.log('✅ All systems are running!');
        console.log('');
    }
    
    async runDemoStep(step) {
        switch (step) {
            case 'connect_to_systems':
                await this.connectToSystems();
                break;
            case 'trigger_codebase_scan':
                await this.triggerCodebaseScan();
                break;
            case 'analyze_reasoning_patterns':
                await this.analyzeReasoningPatterns();
                break;
            case 'generate_pairings':
                await this.generatePairings();
                break;
            case 'create_critical_discovery':
                await this.createCriticalDiscovery();
                break;
            case 'test_emergency_notification':
                await this.testEmergencyNotification();
                break;
            case 'demonstrate_human_loop':
                await this.demonstrateHumanLoop();
                break;
            case 'show_character_integration':
                await this.showCharacterIntegration();
                break;
        }
    }
    
    async connectToSystems() {
        console.log('🔗 STEP 1: Connecting to all systems...');
        
        try {
            // Connect to codebase analysis system
            this.analysisWS = new WebSocket('ws://localhost:8088');
            await this.waitForConnection(this.analysisWS, 'Codebase Analysis');
            
            // Connect to mirroring system
            this.mirroringWS = new WebSocket('ws://localhost:8089');
            await this.waitForConnection(this.mirroringWS, 'Mirroring System');
            
            // Connect to emergency system
            this.emergencyWS = new WebSocket('ws://localhost:8090');
            await this.waitForConnection(this.emergencyWS, 'Emergency System');
            
            // Try to connect to character interface
            try {
                this.characterWS = new WebSocket('ws://localhost:8087');
                await this.waitForConnection(this.characterWS, 'Character Interface');
            } catch (error) {
                console.log('   ⚠️ Character Interface not responding (may be HTTP only)');
            }
            
            console.log('✅ Successfully connected to all available systems');
            
        } catch (error) {
            console.log(`❌ Connection error: ${error.message}`);
        }
    }
    
    async waitForConnection(ws, name) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Timeout connecting to ${name}`));
            }, 5000);
            
            ws.onopen = () => {
                clearTimeout(timeout);
                console.log(`   ✅ Connected to ${name}`);
                resolve();
            };
            
            ws.onerror = (error) => {
                clearTimeout(timeout);
                reject(error);
            };
        });
    }
    
    async triggerCodebaseScan() {
        console.log('🔍 STEP 2: Triggering comprehensive codebase scan...');
        
        if (!this.analysisWS) {
            console.log('   ❌ Not connected to analysis system');
            return;
        }
        
        return new Promise((resolve) => {
            this.analysisWS.onmessage = (message) => {
                const response = JSON.parse(message.data);
                console.log(`   📊 Scan Results:`);
                console.log(`      - Files scanned: ${response.files_scanned}`);
                console.log(`      - Intelligence extracted: ${response.intelligence_extracted?.length || 0} files`);
                console.log(`      - Critical findings: ${response.critical_findings?.length || 0}`);
                resolve();
            };
            
            this.analysisWS.send(JSON.stringify({
                action: 'scan_codebase'
            }));
        });
    }
    
    async analyzeReasoningPatterns() {
        console.log('🧠 STEP 3: Analyzing reasoning patterns in codebase...');
        
        if (!this.analysisWS) {
            console.log('   ❌ Not connected to analysis system');
            return;
        }
        
        return new Promise((resolve) => {
            this.analysisWS.onmessage = (message) => {
                const response = JSON.parse(message.data);
                console.log(`   🧠 Reasoning Analysis:`);
                console.log(`      - Reasoning files found: ${response.reasoning_files_found || 0}`);
                console.log(`      - Patterns detected: ${response.reasoning_patterns?.length || 0}`);
                console.log(`      - Decision trees: ${response.decision_trees?.length || 0}`);
                resolve();
            };
            
            this.analysisWS.send(JSON.stringify({
                action: 'analyze_reasoning'
            }));
        });
    }
    
    async generatePairings() {
        console.log('🪞 STEP 4: Generating intelligent pairings...');
        
        if (!this.mirroringWS) {
            console.log('   ❌ Not connected to mirroring system');
            return;
        }
        
        return new Promise((resolve) => {
            this.mirroringWS.onmessage = (message) => {
                const response = JSON.parse(message.data);
                console.log(`   🪞 Pairing Results:`);
                console.log(`      - Financial pairings: ${response.financial_pairings?.length || 0}`);
                console.log(`      - Security pairings: ${response.security_pairings?.length || 0}`);
                console.log(`      - Anomaly pairings: ${response.anomaly_pairings?.length || 0}`);
                console.log(`      - Integration opportunities: ${response.integration_opportunities?.length || 0}`);
                resolve();
            };
            
            this.mirroringWS.send(JSON.stringify({
                action: 'get_mirror_status'
            }));
        });
    }
    
    async createCriticalDiscovery() {
        console.log('🚨 STEP 5: Simulating critical discovery...');
        
        // Simulate a critical discovery
        const criticalDiscovery = {
            type: 'critical_discovery',
            discovery: {
                file1: './financial-anomaly-detection-engine.js',
                file2: './codebase-analysis-mirroring-system.js',
                similarity_score: 0.95,
                pairing_reason: 'Both files contain financial pattern detection algorithms with 95% similarity',
                category: 'financial_intelligence',
                suggested_action: 'Review for potential consolidation or enhanced integration'
            },
            urgency: 'critical',
            requires_human_attention: true
        };
        
        console.log('   🔍 Critical Discovery Details:');
        console.log(`      - Files: ${criticalDiscovery.discovery.file1} ↔ ${criticalDiscovery.discovery.file2}`);
        console.log(`      - Similarity: ${Math.round(criticalDiscovery.discovery.similarity_score * 100)}%`);
        console.log(`      - Reason: ${criticalDiscovery.discovery.pairing_reason}`);
        console.log(`      - Category: ${criticalDiscovery.discovery.category}`);
        
        // This would normally be detected automatically by the system
        console.log('   ✅ Critical discovery generated (this would trigger automatic alerts)');
    }
    
    async testEmergencyNotification() {
        console.log('📢 STEP 6: Testing emergency notification system...');
        
        if (!this.emergencyWS) {
            console.log('   ❌ Not connected to emergency system');
            return;
        }
        
        return new Promise((resolve) => {
            this.emergencyWS.onmessage = (message) => {
                const response = JSON.parse(message.data);
                console.log('   🚨 Emergency System Status:');
                console.log(`      - Critical alerts: ${response.critical_alerts?.total || 0}`);
                console.log(`      - Emergency inbox items: ${response.emergency_inbox?.total_items || 0}`);
                console.log(`      - Human tasks pending: ${response.human_loop_queue?.pending_tasks || 0}`);
                console.log(`      - Connected emergency clients: ${response.connected_clients || 0}`);
                resolve();
            };
            
            this.emergencyWS.send(JSON.stringify({
                action: 'get_system_status'
            }));
        });
    }
    
    async demonstrateHumanLoop() {
        console.log('👥 STEP 7: Demonstrating human-in-the-loop integration...');
        
        if (!this.emergencyWS) {
            console.log('   ❌ Not connected to emergency system');
            return;
        }
        
        return new Promise((resolve) => {
            this.emergencyWS.onmessage = (message) => {
                const response = JSON.parse(message.data);
                
                if (Array.isArray(response)) {
                    console.log(`   👥 Human Tasks Queue: ${response.length} tasks`);
                    
                    response.slice(0, 3).forEach((task, index) => {
                        console.log(`      ${index + 1}. ${task.title || task.type}`);
                        console.log(`         Priority: ${task.priority}`);
                        console.log(`         Status: ${task.status}`);
                        console.log(`         Created: ${task.created_at ? new Date(task.created_at).toLocaleTimeString() : 'Unknown'}`);
                    });
                    
                    if (response.length > 3) {
                        console.log(`      ... and ${response.length - 3} more tasks`);
                    }
                } else {
                    console.log('   👥 Human task queue is empty');
                }
                
                resolve();
            };
            
            this.emergencyWS.send(JSON.stringify({
                action: 'get_human_loop_queue'
            }));
        });
    }
    
    async showCharacterIntegration() {
        console.log('🎮 STEP 8: Character interface integration...');
        
        if (this.characterWS && this.characterWS.readyState === WebSocket.OPEN) {
            console.log('   ✅ Character interface is connected');
            console.log('   🎮 Critical discoveries will appear as character notifications');
            console.log('   ⚡ Runic enhancements will activate for urgent findings');
            console.log('   📊 Skills will progress based on reviews completed');
        } else {
            console.log('   ℹ️ Character interface available at: interactive-character-interface.html');
            console.log('   🎮 Open the character interface to see:');
            console.log('      - Critical discovery notifications');
            console.log('      - Emergency alert popups');
            console.log('      - Human task assignments');
            console.log('      - Runic enhancement activations');
        }
        
        console.log('');
        console.log('   🔗 Integration Features:');
        console.log('      ✅ Real-time WebSocket communication');
        console.log('      ✅ Emergency alert forwarding');
        console.log('      ✅ Human task notification');
        console.log('      ✅ Critical discovery highlighting');
        console.log('      ✅ Game-like interaction layer');
    }
    
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the demo
if (require.main === module) {
    const demo = new CodebaseMirroringDemo();
    demo.runDemo().catch(console.error);
}

module.exports = CodebaseMirroringDemo;