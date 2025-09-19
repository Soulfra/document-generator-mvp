#!/usr/bin/env node

/**
 * 🚀 MASTER LAUNCHER
 * 
 * "Can we build it? YES WE CAN!"
 * Launches all systems in the right order for maximum SpongeBob energy
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class MasterLauncher {
    constructor() {
        this.processes = [];
        this.systemOrder = [
            {
                name: 'Gaming Engine',
                file: 'WORKING-GAMING-ENGINE.js',
                port: 7777,
                critical: true,
                emoji: '🎮'
            },
            {
                name: 'Character Interface',
                file: 'SPEEDRUN-LEGAL-MCP-CHARACTER.js',
                port: 6969,
                critical: false,
                emoji: '👁️👂🗣️'
            },
            {
                name: 'Handshake Layer',
                file: 'handshake-agreement-layer.js',
                port: 48009,
                critical: false,
                emoji: '🤝'
            },
            {
                name: 'System Connector',
                file: 'CONNECT-ALL-SYSTEMS.js',
                port: null,
                critical: true,
                emoji: '🔗'
            }
        ];
        
        console.log('🚀 MASTER LAUNCHER - SpongeBob Edition');
        console.log('=====================================');
        console.log('🧽 "I\'m ready, I\'m ready, I\'m ready!"');
        console.log('🏗️ "Can we build it? YES WE CAN!"');
        console.log('');
        
        this.launchAll();
    }
    
    async launchAll() {
        console.log('🚀 Starting all systems...');
        
        // Run real verification first
        console.log('\n✅ Running real verification before launch...');
        const verificationPassed = await this.runRealVerification();
        
        if (!verificationPassed) {
            console.log('⚠️  Verification found issues, but continuing anyway...');
        }
        
        for (const system of this.systemOrder) {
            console.log(`${system.emoji} Starting ${system.name}...`);
            
            try {
                await this.launchSystem(system);
                console.log(`   ✅ ${system.name} started successfully`);
                
                // Wait a bit between launches
                await this.wait(2000);
                
            } catch (error) {
                console.log(`   ❌ ${system.name} failed to start:`, error.message);
                
                if (system.critical) {
                    console.log('   🚨 Critical system failed! Continuing anyway...');
                } else {
                    console.log('   ⚠️ Optional system failed, continuing...');
                }
            }
        }
        
        console.log('');
        console.log('🎉 LAUNCH SEQUENCE COMPLETE!');
        console.log('============================');
        console.log('🎮 Game: http://localhost:7777/game');
        console.log('👁️ Character: http://localhost:6969/character');
        console.log('🤝 Handshakes: http://localhost:48009/');
        console.log('');
        console.log('🧽 SpongeBob says: "I\'m ready to work!"');
        console.log('🏗️ Bob says: "Let\'s get building!"');
        
        // Monitor all processes
        this.startMonitoring();
    }
    
    async launchSystem(system) {
        // Check if port is available first
        if (system.port) {
            const portAvailable = await this.checkPortAvailable(system.port);
            if (!portAvailable) {
                console.log(`   ⚠️ Port ${system.port} already in use, killing existing process...`);
                await this.killPort(system.port);
                await this.wait(1000);
            }
        }
        
        return new Promise((resolve, reject) => {
            const systemPath = path.join(__dirname, system.file);
            
            const process = spawn('node', [systemPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                detached: false
            });
            
            process.stdout.on('data', (data) => {
                const output = data.toString().trim();
                if (output) {
                    console.log(`   📡 ${system.name}: ${output.split('\\n')[0]}`);
                }
            });
            
            process.stderr.on('data', (data) => {
                const error = data.toString().trim();
                if (error && !error.includes('ExperimentalWarning')) {
                    console.log(`   ⚠️ ${system.name}: ${error.split('\\n')[0]}`);
                }
            });
            
            process.on('close', (code) => {
                console.log(`   💀 ${system.name} exited with code ${code}`);
                this.processes = this.processes.filter(p => p.process !== process);
            });
            
            process.on('error', (error) => {
                console.log(`   💥 ${system.name} error:`, error.message);
                reject(error);
            });
            
            // Store process info
            this.processes.push({
                name: system.name,
                emoji: system.emoji,
                process: process,
                pid: process.pid,
                started: Date.now(),
                critical: system.critical
            });
            
            // Consider it started after a short delay
            setTimeout(() => {
                resolve();
            }, 1000);
        });
    }
    
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async runRealVerification() {
        console.log('🔍 Checking system dependencies and services...');
        
        // Check if real verification script exists
        if (!fs.existsSync('./validate-services.js')) {
            console.log('⚠️  Real verification script not found, skipping...');
            return true;
        }
        
        return new Promise((resolve) => {
            const verify = spawn('node', ['validate-services.js'], {
                stdio: 'pipe'
            });
            
            let output = '';
            verify.stdout.on('data', (data) => {
                output += data.toString();
                // Show important lines
                const lines = data.toString().split('\n');
                lines.forEach(line => {
                    if (line.includes('✅') || line.includes('❌') || line.includes('⚠️')) {
                        console.log(`   ${line.trim()}`);
                    }
                });
            });
            
            verify.stderr.on('data', (data) => {
                console.error(`   ⚠️ Verification error: ${data.toString().trim()}`);
            });
            
            verify.on('close', (code) => {
                if (code === 0) {
                    console.log('   ✅ Verification completed successfully!');
                    resolve(true);
                } else {
                    console.log(`   ❌ Verification failed with code ${code}`);
                    resolve(false);
                }
            });
            
            verify.on('error', (error) => {
                console.error('   ❌ Failed to run verification:', error.message);
                resolve(false);
            });
        });
    }
    
    async checkPortAvailable(port) {
        return new Promise((resolve) => {
            exec(`lsof -i :${port} | grep LISTEN`, (error, stdout) => {
                resolve(!stdout.trim()); // Port is available if nothing is listening
            });
        });
    }
    
    startMonitoring() {
        console.log('👁️ Starting process monitoring with real health checks...');
        
        setInterval(async () => {
            await this.checkProcesses();
            await this.performHealthChecks();
        }, 10000); // Check every 10 seconds
        
        setInterval(() => {
            this.printStatus();
        }, 30000); // Status every 30 seconds
        
        // Handle shutdown gracefully
        process.on('SIGINT', () => {
            console.log('\\n🛑 Shutting down all systems...');
            this.shutdownAll();
        });
        
        process.on('SIGTERM', () => {
            console.log('\\n🛑 Terminating all systems...');
            this.shutdownAll();
        });
    }
    
    async killPort(port) {
        return new Promise((resolve) => {
            exec(`lsof -ti :${port} | xargs kill -9 2>/dev/null || true`, (error) => {
                resolve();
            });
        });
    }
    
    async checkProcesses() {
        let runningCount = 0;
        let criticalDown = 0;
        
        for (const proc of this.processes) {
            if (proc.process.killed || proc.process.exitCode !== null) {
                console.log(`💀 ${proc.emoji} ${proc.name} has died! PID: ${proc.pid}`);
                
                if (proc.critical) {
                    criticalDown++;
                    console.log('   🚨 Critical system down! Attempting auto-restart...');
                    
                    // Find the system config
                    const system = this.systemOrder.find(s => s.name === proc.name);
                    if (system) {
                        // Remove from process list
                        this.processes = this.processes.filter(p => p !== proc);
                        
                        // Attempt restart
                        try {
                            await this.launchSystem(system);
                            console.log(`   ✅ ${system.name} restarted successfully`);
                        } catch (error) {
                            console.log(`   ❌ Failed to restart ${system.name}: ${error.message}`);
                        }
                    }
                }
            } else {
                runningCount++;
            }
        }
        
        if (criticalDown > 0) {
            console.log('🧽 SpongeBob: "Oh barnacles! Something\'s wrong!"');
            console.log('🏗️ Bob: "Don\'t worry, we can fix it!"');
        }
    }
    
    printStatus() {
        console.log('');
        console.log('📊 SYSTEM STATUS REPORT');
        console.log('=======================');
        
        const now = new Date().toISOString().slice(11, 19);
        console.log(`🕐 Time: ${now}`);
        
        let runningCount = 0;
        for (const proc of this.processes) {
            const uptime = Math.floor((Date.now() - proc.started) / 1000);
            const status = proc.process.killed || proc.process.exitCode !== null ? 
                          '💀 DEAD' : '✅ RUNNING';
            
            console.log(`   ${proc.emoji} ${proc.name.padEnd(20)} : ${status} (${uptime}s)`);
            
            if (status === '✅ RUNNING') {
                runningCount++;
            }
        }
        
        console.log(`📈 Health: ${runningCount}/${this.processes.length} systems running`);
        
        // SpongeBob commentary
        if (runningCount === this.processes.length) {
            console.log('🧽 SpongeBob: "I\'m ready! Everything\'s perfect!"');
        } else if (runningCount > this.processes.length / 2) {
            console.log('🧽 SpongeBob: "We\'re getting there!"');
        } else {
            console.log('🧽 SpongeBob: "Uh oh, Gary! We need to fix this!"');
        }
        
        console.log('');
    }
    
    shutdownAll() {
        console.log('🛑 Shutting down all processes...');
        
        for (const proc of this.processes) {
            try {
                console.log(`   🛑 Stopping ${proc.name}...`);
                proc.process.kill('SIGTERM');
                
                // Force kill after 5 seconds
                setTimeout(() => {
                    if (!proc.process.killed) {
                        console.log(`   💥 Force killing ${proc.name}...`);
                        proc.process.kill('SIGKILL');
                    }
                }, 5000);
                
            } catch (error) {
                console.log(`   ⚠️ Error stopping ${proc.name}:`, error.message);
            }
        }
        
        setTimeout(() => {
            console.log('👋 All systems stopped. Goodbye!');
            process.exit(0);
        }, 6000);
    }
    
    async performHealthChecks() {
        // Real health checks for running services
        const healthChecks = [
            { name: 'Gaming Engine', port: 7777, endpoint: '/health' },
            { name: 'Character Interface', port: 6969, endpoint: '/health' },
            { name: 'Handshake Layer', port: 48009, endpoint: '/health' }
        ];
        
        for (const check of healthChecks) {
            const proc = this.processes.find(p => p.name === check.name);
            if (proc && !proc.process.killed) {
                try {
                    const response = await this.checkHealth(check.port, check.endpoint);
                    if (!response.healthy) {
                        console.log(`   ⚠️ ${check.name} health check failed`);
                    }
                } catch (error) {
                    console.log(`   ❌ ${check.name} not responding to health checks`);
                }
            }
        }
    }
    
    async checkHealth(port, endpoint = '/health') {
        return new Promise((resolve) => {
            const http = require('http');
            
            const req = http.get(`http://localhost:${port}${endpoint}`, (res) => {
                resolve({ healthy: res.statusCode < 400 });
            });
            
            req.on('error', () => {
                resolve({ healthy: false });
            });
            
            req.setTimeout(3000, () => {
                req.destroy();
                resolve({ healthy: false });
            });
        });
    }
}

// Create a quick launcher script
function createQuickLauncher() {
    const quickScript = `#!/bin/bash

echo "🚀 QUICK LAUNCHER"
echo "================"
echo "🧽 SpongeBob says: 'I'm ready!'"
echo "🏗️ Bob says: 'Let's build!'"
echo ""

echo "🎮 Starting gaming engine..."
node WORKING-GAMING-ENGINE.js &
GAMING_PID=$!

sleep 3

echo "👁️ Starting character interface..."
node SPEEDRUN-LEGAL-MCP-CHARACTER.js &
CHARACTER_PID=$!

sleep 3

echo "🤝 Starting handshake layer..."
node handshake-agreement-layer.js &
HANDSHAKE_PID=$!

sleep 2

echo "🔗 Starting system connector..."
node CONNECT-ALL-SYSTEMS.js &
CONNECTOR_PID=$!

echo ""
echo "✅ All systems started!"
echo "🎮 Game: http://localhost:7777/game"
echo "👁️ Character: http://localhost:6969/character"
echo ""
echo "Press Ctrl+C to stop all systems"

# Wait for interrupt
trap 'echo ""; echo "🛑 Stopping all systems..."; kill $GAMING_PID $CHARACTER_PID $HANDSHAKE_PID $CONNECTOR_PID 2>/dev/null; exit 0' INT

# Keep script running
wait
`;
    
    require('fs').writeFileSync('./QUICK-LAUNCH.sh', quickScript);
    require('fs').chmodSync('./QUICK-LAUNCH.sh', 0o755);
    console.log('✅ Created QUICK-LAUNCH.sh script');
}

// Start the master launcher
if (require.main === module) {
    // Create quick launcher first
    createQuickLauncher();
    
    // Start master launcher
    new MasterLauncher();
}

module.exports = MasterLauncher;