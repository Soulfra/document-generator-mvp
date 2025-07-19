// run-complete-ssh-terminal-demo.js - Run complete SSH terminal integration demo
// Starts all systems and demonstrates SSH terminal with runtime rings

const { spawn } = require('child_process');
const path = require('path');

console.log(`
🚀 COMPLETE SSH TERMINAL DEMO LAUNCHER 🚀
Starting all Document Generator systems with SSH terminal integration:

Layer 74: SSH Terminal Runtime Ring System (port 9703)
+ Electron App with SSH terminal interface
+ Runtime ring switching with prime number daemons
+ Database switching based on performance
+ Max bash process management
+ Real-time system monitoring

This demo shows the complete integrated system!
`);

class CompleteDemoLauncher {
    constructor() {
        this.processes = new Map();
        this.services = [
            {
                name: 'SSH Terminal Runtime Ring System',
                file: 'ssh-terminal-runtime-ring-system.js',
                port: 9703,
                startDelay: 0
            },
            {
                name: 'Viral Developer Acquisition',
                file: 'viral-developer-acquisition-culture-system.js', 
                port: 9702,
                startDelay: 2000
            },
            {
                name: 'Airdrop Developer Incentive',
                file: 'airdrop-developer-incentive-system.js',
                port: 9701,
                startDelay: 4000
            },
            {
                name: 'AI Model Evaluation',
                file: 'ai-model-evaluation-ranking-system.js',
                port: 9700,
                startDelay: 6000
            },
            {
                name: 'Player History AI Agent Care',
                file: 'player-history-ai-agent-care-system.js',
                port: 9699,
                startDelay: 8000
            }
        ];
    }
    
    async runCompleteDemoSystem() {
        console.log('🎬 Starting complete Document Generator system with SSH terminal...\n');
        
        // Start all services
        for (const service of this.services) {
            await this.delay(service.startDelay);
            this.startService(service);
        }
        
        // Wait for all services to start
        console.log('\n⏳ Waiting for all services to initialize...');
        await this.delay(15000);
        
        // Run the integration demo
        console.log('\n🔗 Running SSH terminal integration demo...');
        await this.runIntegrationDemo();
        
        // Show electron app instructions
        this.showElectronInstructions();
        
        // Setup cleanup
        this.setupCleanup();
    }
    
    startService(service) {
        console.log(`🚀 Starting ${service.name} on port ${service.port}...`);
        
        const filePath = path.join(__dirname, service.file);
        
        const child = spawn('node', [filePath], {
            env: {
                ...process.env,
                PORT: service.port,
                NODE_ENV: 'demo'
            },
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        child.stdout.on('data', (data) => {
            const output = data.toString().trim();
            if (output) {
                console.log(`   [${service.name}] ${output}`);
            }
        });
        
        child.stderr.on('data', (data) => {
            const error = data.toString().trim();
            if (error && !error.includes('DeprecationWarning')) {
                console.error(`   [${service.name}] ERROR: ${error}`);
            }
        });
        
        child.on('error', (error) => {
            console.error(`❌ Failed to start ${service.name}:`, error.message);
        });
        
        child.on('exit', (code) => {
            if (code !== 0) {
                console.log(`⚠️ ${service.name} exited with code ${code}`);
            }
            this.processes.delete(service.name);
        });
        
        this.processes.set(service.name, {
            process: child,
            ...service
        });
    }
    
    async runIntegrationDemo() {
        try {
            // Import and run the integration demo
            const IntegratedSSHTerminalDemo = require('./integrated-ssh-terminal-demo');
            const demo = new IntegratedSSHTerminalDemo();
            
            await demo.runCompleteDemo();
            
        } catch (error) {
            console.error('❌ Integration demo failed:', error.message);
            console.log('⚠️ Demo may not run if services are still starting up...');
        }
    }
    
    showElectronInstructions() {
        console.log(`
📱 ELECTRON APP WITH SSH TERMINAL
================================

To see the complete SSH terminal interface:

1. Start the Electron app:
   electron electron-main.js

2. The app will show:
   🔐 Live SSH terminal with command execution
   🔄 Runtime ring status (5 rings with prime intervals)
   💾 Database switching status and metrics  
   🔢 Prime daemon pings and health monitoring
   💥 Bash process queue and management
   
3. Try these commands in the SSH terminal:
   - ls -la
   - ps aux
   - df -h
   - echo "Testing SSH terminal integration"
   - top -n 1
   
4. Watch the system automatically:
   - Switch between runtime rings based on load
   - Change databases when performance degrades
   - Ping with prime number intervals (2s, 3s, 5s, 7s, 11s)
   - Queue bash commands when max threshold reached

5. Access individual services:
   🔐 SSH Terminal API: http://localhost:9703
   🚀 Viral Acquisition: http://localhost:9702  
   🪂 Airdrop System: http://localhost:9701
   🧪 AI Evaluation: http://localhost:9700
   👤 Player History: http://localhost:9699

🎯 This is Layer 74 - SSH Terminal Runtime Ring integration!
`);
    }
    
    setupCleanup() {
        const cleanup = () => {
            console.log('\n🧹 Shutting down all services...');
            
            for (const [name, service] of this.processes) {
                try {
                    console.log(`⚠️ Stopping ${name}...`);
                    service.process.kill('SIGTERM');
                } catch (error) {
                    console.error(`Failed to stop ${name}:`, error.message);
                }
            }
            
            console.log('✅ All services stopped');
            process.exit(0);
        };
        
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
        process.on('exit', cleanup);
        
        console.log('\n💡 Press Ctrl+C to stop all services and exit');
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the complete demo system
if (require.main === module) {
    const launcher = new CompleteDemoLauncher();
    launcher.runCompleteDemoSystem().catch(error => {
        console.error('❌ Demo launcher failed:', error);
        process.exit(1);
    });
}

module.exports = CompleteDemoLauncher;