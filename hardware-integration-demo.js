#!/usr/bin/env node

/**
 * 🎮⚡🤖 HARDWARE INTEGRATION DEMO
 * Complete demonstration of AI agents playing MUD with physical hardware control
 * Shows the digital-to-physical bridge in action
 */

const AutonomousMUDPlayerAgent = require('./autonomous-mud-player-agent.js');
const RevenueMUDBossIntegration = require('./revenue-mud-boss-integration.js');
const PhysicalRevenueCounter = require('./physical-revenue-counter.js');
const HardwareOrchestrator = require('./hardware-orchestrator.js');

class HardwareIntegrationDemo {
    constructor() {
        this.agents = [];
        this.hardware = new HardwareOrchestrator();
        this.revenueCounter = new PhysicalRevenueCounter();
        this.bossIntegration = null;
        this.mudEngine = null;
        this.isRunning = false;
        
        // Demo configuration
        this.config = {
            agentCount: 3,
            demoSessions: [
                'keyboard_automation',
                'boss_battle_hardware',
                'revenue_counter_demo',
                'autonomous_exploration'
            ],
            physicality: {
                keyboardIntensity: 0.8,
                hardwareEffects: true,
                servoCounters: true,
                ledEffects: true
            }
        };
    }
    
    async startDemo() {
        console.log('🎮⚡ Starting Hardware Integration Demo...');
        console.log('==========================================');
        
        try {
            // Initialize hardware
            await this.initializeHardware();
            
            // Create demo agents
            await this.createDemoAgents();
            
            // Start demo sessions
            await this.runDemoSessions();
            
        } catch (error) {
            console.error('❌ Demo failed:', error.message);
        }
    }
    
    async initializeHardware() {
        console.log('🔧 Initializing hardware systems...');
        
        // Initialize Arduino hardware
        console.log('📡 Connecting to Arduino...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Test hardware connection
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*',
            command: 'LED_PULSE',
            commandParams: { 
                color: 'blue', 
                intensity: 255 
            }
        });
        
        console.log('✅ Hardware initialization complete');
    }
    
    async createDemoAgents() {
        console.log('🤖 Creating AI demonstration agents...');
        
        const agentProfiles = [
            {
                id: 'agent_keyboard_master',
                name: '⌨️ KeyboardMaster',
                strategy: {
                    hardwareEnabled: true,
                    physicalIntensity: 0.9,
                    explorationPriority: 0.7
                },
                hardware: {
                    preferredInputMethod: 'physical',
                    keyboardLayout: 'qwerty'
                },
                specialization: 'keyboard_automation'
            },
            {
                id: 'agent_boss_hunter',
                name: '⚔️ BossHunter',
                strategy: {
                    hardwareEnabled: true,
                    physicalIntensity: 0.6,
                    revenuePriority: 0.8
                },
                hardware: {
                    preferredInputMethod: 'hybrid'
                },
                specialization: 'combat_hardware'
            },
            {
                id: 'agent_revenue_tracker',
                name: '💰 RevenueTracker',
                strategy: {
                    hardwareEnabled: true,
                    physicalIntensity: 0.5,
                    revenuePriority: 0.9
                },
                hardware: {
                    preferredInputMethod: 'hybrid'
                },
                specialization: 'revenue_optimization'
            }
        ];
        
        for (const profile of agentProfiles) {
            const agent = new AutonomousMUDPlayerAgent(profile, { empire: {} });
            
            // Configure for demo
            agent.assignPriorities(profile.strategy);
            agent.setInputMethod(profile.hardware.preferredInputMethod);
            agent.setPhysicalIntensity(profile.strategy.physicalIntensity);
            
            // Add demo event listeners
            this.setupAgentDemoHandlers(agent, profile.specialization);
            
            this.agents.push({
                agent: agent,
                profile: profile
            });
            
            console.log(`✅ Created agent: ${profile.name} (${profile.specialization})`);
        }
    }
    
    setupAgentDemoHandlers(agent, specialization) {
        agent.on('connected', () => {
            console.log(`🟢 ${agent.agent.name} connected to MUD`);
        });
        
        // Override decision making for demo purposes
        const originalMakeDecision = agent.makeDecision.bind(agent);
        agent.makeDecision = async function() {
            const decision = await originalMakeDecision();
            
            // Demo-specific behavior based on specialization
            switch (specialization) {
                case 'keyboard_automation':
                    // Focus on emacs commands and complex key sequences
                    if (Math.random() < 0.3) {
                        this.executeAction({
                            type: 'emacs',
                            command: 'save-buffer',
                            priority: 0.9
                        });
                    }
                    break;
                    
                case 'combat_hardware':
                    // Seek out boss battles
                    if (Math.random() < 0.4) {
                        this.executeAction({
                            type: 'command',
                            command: 'boss',
                            priority: 0.8
                        });
                    }
                    break;
                    
                case 'revenue_optimization':
                    // Focus on revenue generation
                    if (Math.random() < 0.5) {
                        this.executeAction({
                            type: 'command',
                            command: 'wallet',
                            priority: 0.8
                        });
                    }
                    break;
            }
            
            return decision;
        };
    }
    
    async runDemoSessions() {
        console.log('🎭 Starting demonstration sessions...');
        
        for (const sessionType of this.config.demoSessions) {
            console.log(`\n📋 Starting session: ${sessionType}`);
            console.log('─'.repeat(50));
            
            await this.runSession(sessionType);
            
            // Brief pause between sessions
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        console.log('\n🎉 All demonstration sessions completed!');
    }
    
    async runSession(sessionType) {
        switch (sessionType) {
            case 'keyboard_automation':
                await this.demoKeyboardAutomation();
                break;
                
            case 'boss_battle_hardware':
                await this.demoBossBattleHardware();
                break;
                
            case 'revenue_counter_demo':
                await this.demoRevenueCounter();
                break;
                
            case 'autonomous_exploration':
                await this.demoAutonomousExploration();
                break;
        }
    }
    
    async demoKeyboardAutomation() {
        console.log('⌨️ KEYBOARD AUTOMATION DEMO');
        console.log('Showing AI agents physically pressing keys...');
        
        const keyboardAgent = this.agents.find(a => 
            a.profile.specialization === 'keyboard_automation'
        );
        
        if (!keyboardAgent) {
            console.log('❌ No keyboard agent available');
            return;
        }
        
        const agent = keyboardAgent.agent;
        
        // Demonstrate various keyboard sequences
        const demoSequences = [
            {
                action: 'emacs_save',
                description: 'Emacs save-buffer (Ctrl+X Ctrl+S)',
                sequence: ['control', 'x', 'control', 's']
            },
            {
                action: 'git_commit',
                description: 'Git commit (Ctrl+X V C)',
                sequence: ['control', 'x', 'v', 'c']
            },
            {
                action: 'navigation',
                description: 'Arrow key navigation',
                sequence: ['up', 'up', 'right', 'right', 'down', 'left']
            }
        ];
        
        for (const demo of demoSequences) {
            console.log(`🔹 Executing: ${demo.description}`);
            
            // Execute physical keyboard action
            await agent.executeManualPhysicalAction('keyboard_sequence', {
                keys: demo.sequence,
                delay: 200,
                description: demo.description
            });
            
            // Visual feedback
            await this.hardware.executePhysicalAction('arduino_command', {
                deviceId: 'arduino_*',
                command: 'LED_FLASH',
                commandParams: { 
                    color: 'green', 
                    count: 2, 
                    duration: 150 
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        console.log('✅ Keyboard automation demo completed');
    }
    
    async demoBossBattleHardware() {
        console.log('⚔️ BOSS BATTLE HARDWARE DEMO');
        console.log('Simulating boss battle with hardware effects...');
        
        // Simulate boss spawn
        console.log('🐉 Boss spawning...');
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*',
            command: 'BOSS_SPAWN',
            commandParams: { 
                boss: 'Demo Dragon',
                intensity: 1.0 
            }
        });
        
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Simulate battle sequence
        console.log('⚔️ Battle in progress...');
        for (let round = 1; round <= 5; round++) {
            console.log(`  Round ${round}/5`);
            
            // Player attack
            await this.hardware.executePhysicalAction('arduino_command', {
                deviceId: 'arduino_*',
                command: 'LED_FLASH',
                commandParams: { 
                    color: 'yellow', 
                    count: 1, 
                    duration: 200 
                }
            });
            
            // Boss damage visualization
            const healthPercent = Math.max(0, (6 - round) / 5);
            await this.hardware.executePhysicalAction('arduino_command', {
                deviceId: 'arduino_*',
                command: 'BOSS_DAMAGE',
                commandParams: { 
                    healthPercent: healthPercent,
                    damage: 20
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Victory sequence
        console.log('🏆 Victory achieved!');
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*',
            command: 'VICTORY',
            commandParams: { 
                message: 'Demo Dragon defeated!',
                duration: 5000 
            }
        });
        
        console.log('✅ Boss battle hardware demo completed');
    }
    
    async demoRevenueCounter() {
        console.log('💰 REVENUE COUNTER DEMO');
        console.log('Demonstrating physical revenue counters...');
        
        // Initialize counters
        console.log('🔧 Initializing physical counters...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate revenue increases
        const revenueUpdates = [
            { totalRevenue: 50, bits: 100, tokens: 5, coins: 500, shards: 1 },
            { totalRevenue: 150, bits: 300, tokens: 15, coins: 800, shards: 2 },
            { totalRevenue: 300, bits: 600, tokens: 30, coins: 1200, shards: 5 },
            { totalRevenue: 500, bits: 1000, tokens: 50, coins: 2000, shards: 10 }
        ];
        
        for (let i = 0; i < revenueUpdates.length; i++) {
            const revenue = revenueUpdates[i];
            console.log(`💵 Revenue update ${i + 1}: $${revenue.totalRevenue}`);
            
            await this.revenueCounter.updateRevenue(revenue);
            
            // Bonus effect for large gains
            if (i === revenueUpdates.length - 1) {
                console.log('🎉 Milestone bonus!');
                await this.revenueCounter.triggerMilestone('Demo Milestone: $500');
            }
            
            await new Promise(resolve => setTimeout(resolve, 4000));
        }
        
        console.log('✅ Revenue counter demo completed');
    }
    
    async demoAutonomousExploration() {
        console.log('🗺️ AUTONOMOUS EXPLORATION DEMO');
        console.log('AI agents exploring MUD world autonomously...');
        
        // Start all agents (simulated)
        for (const { agent, profile } of this.agents) {
            console.log(`🤖 ${profile.name} starting autonomous exploration...`);
            
            // Simulate exploration with hardware feedback
            for (let step = 0; step < 5; step++) {
                const actions = ['north', 'east', 'south', 'west', 'look'];
                const action = actions[Math.floor(Math.random() * actions.length)];
                
                console.log(`  ${profile.name}: ${action}`);
                
                // Physical action simulation
                if (profile.strategy.hardwareEnabled && Math.random() < 0.6) {
                    console.log(`    ⚡ Physical action: ${action}`);
                    
                    await this.hardware.executePhysicalAction('keyboard_press', {
                        key: action === 'look' ? 'l' : action[0],
                        duration: 100
                    });
                }
                
                // LED feedback
                const colors = ['red', 'green', 'blue', 'orange', 'purple'];
                await this.hardware.executePhysicalAction('arduino_command', {
                    deviceId: 'arduino_*',
                    command: 'LED_PULSE',
                    commandParams: { 
                        color: colors[step % colors.length], 
                        intensity: 150 
                    }
                });
                
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log('✅ Autonomous exploration demo completed');
    }
    
    // Real-time status display
    displayStatus() {
        console.log('\n📊 HARDWARE INTEGRATION STATUS');
        console.log('==============================');
        
        // Hardware status
        const hardwareStatus = this.hardware.getHardwareStatus();
        console.log(`🔧 Hardware: ${hardwareStatus.connected ? '🟢 CONNECTED' : '🔴 DISCONNECTED'}`);
        console.log(`📡 Arduino: ${hardwareStatus.devices.arduino ? '🟢 READY' : '🔴 NOT FOUND'}`);
        console.log(`⌨️ Keyboard: ${hardwareStatus.devices.keyboard ? '🟢 ACTIVE' : '🔴 INACTIVE'}`);
        
        // Agent status
        console.log(`\n🤖 Active Agents: ${this.agents.length}`);
        for (const { agent, profile } of this.agents) {
            const status = agent.getStatus();
            console.log(`  ${profile.name}:`);
            console.log(`    Physical Actions: ${status.hardware.physicalActionsCount}`);
            console.log(`    Hardware Enabled: ${status.strategy.hardwareEnabled ? '✅' : '❌'}`);
            console.log(`    Intensity: ${(status.strategy.physicalIntensity * 100).toFixed(0)}%`);
        }
        
        // Revenue counter status
        const counterStatus = this.revenueCounter.getCounterStatus();
        console.log(`\n💰 Revenue Counters:`);
        console.log(`    Total Revenue: $${counterStatus.revenueState.totalRevenue}`);
        console.log(`    Active Animations: ${counterStatus.activeAnimations}`);
        console.log(`    Current Display: ${counterStatus.currentCurrency}`);
    }
    
    async stopDemo() {
        console.log('\n🛑 Stopping hardware integration demo...');
        
        // Stop all agents
        for (const { agent } of this.agents) {
            agent.stop();
        }
        
        // Emergency stop all hardware
        await this.revenueCounter.emergencyStop();
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*',
            command: 'EMERGENCY_STOP'
        });
        
        console.log('✅ Demo stopped safely');
    }
    
    // Interactive demo control
    startInteractiveDemo() {
        console.log('\n🎮 INTERACTIVE DEMO MODE');
        console.log('========================');
        console.log('Commands:');
        console.log('  status  - Show system status');
        console.log('  boss    - Trigger boss battle');
        console.log('  revenue - Update revenue counters');
        console.log('  keys    - Demo keyboard automation');
        console.log('  stop    - Stop demo');
        
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        
        process.stdin.on('data', async (key) => {
            if (key === '\u0003') { // Ctrl+C
                await this.stopDemo();
                process.exit();
            }
            
            switch (key) {
                case 's':
                    this.displayStatus();
                    break;
                    
                case 'b':
                    await this.demoBossBattleHardware();
                    break;
                    
                case 'r':
                    await this.demoRevenueCounter();
                    break;
                    
                case 'k':
                    await this.demoKeyboardAutomation();
                    break;
                    
                case 'q':
                    await this.stopDemo();
                    process.exit();
                    break;
            }
        });
    }
}

// Demo execution
async function main() {
    const demo = new HardwareIntegrationDemo();
    
    console.log('🎮⚡🤖 HARDWARE INTEGRATION DEMO');
    console.log('================================');
    console.log('This demonstration shows AI agents playing a MUD game');
    console.log('while controlling physical hardware in real-time.');
    console.log('');
    console.log('Features demonstrated:');
    console.log('• AI agents pressing physical keyboard keys');
    console.log('• Boss battles triggering LED effects and servos');
    console.log('• Revenue updates moving physical servo counters');
    console.log('• Autonomous exploration with hardware feedback');
    console.log('');
    
    // Check command line args
    if (process.argv.includes('--interactive')) {
        await demo.initializeHardware();
        await demo.createDemoAgents();
        demo.startInteractiveDemo();
    } else {
        await demo.startDemo();
        
        // Keep running and show status every 10 seconds
        setInterval(() => {
            demo.displayStatus();
        }, 10000);
        
        // Stop demo after 2 minutes
        setTimeout(async () => {
            await demo.stopDemo();
            process.exit();
        }, 120000);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    process.exit();
});

// Export for use as module
module.exports = HardwareIntegrationDemo;

// Run demo if called directly
if (require.main === module) {
    main().catch(console.error);
}