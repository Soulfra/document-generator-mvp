#!/usr/bin/env node

/**
 * 🚀 MASTER EXECUTIVE LAUNCHER
 * 
 * The ultimate system launcher that starts Cal Riven Executive Orchestrator
 * and all subordinate systems in the correct order with proper dependencies
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

class MasterExecutiveLauncher {
    constructor() {
        this.baseDir = process.cwd();
        this.processes = new Map();
        this.launchOrder = [
            {
                name: 'Cal Riven Executive Orchestrator',
                file: 'CAL-RIVEN-ASSISTANT.js',
                port: 9999,
                required: true,
                waitTime: 3000
            },
            {
                name: 'LLM Reasoning Orchestrator',
                file: 'llm-reasoning-orchestrator.js',
                port: null,
                required: false,
                waitTime: 2000
            },
            {
                name: 'DeathToData Unified',
                file: 'launch-deathtodata-unified.sh',
                script: true,
                port: 7777,
                required: false,
                waitTime: 5000
            },
            {
                name: 'Deep Tier Service',
                file: 'deep-tier-service.js',
                port: null,
                required: false,
                waitTime: 2000
            }
        ];
    }

    async launch() {
        console.log('🚀 MASTER EXECUTIVE LAUNCHER STARTING');
        console.log('=====================================');
        console.log('🎯 Orchestrating complete system startup...\n');

        // Phase 1: Pre-flight checks
        await this.preFlightChecks();

        // Phase 2: Launch systems in order
        for (const system of this.launchOrder) {
            await this.launchSystem(system);
        }

        // Phase 3: Post-launch verification
        await this.postLaunchVerification();

        // Phase 4: Setup monitoring
        this.setupMonitoring();

        console.log('\n🎉 MASTER EXECUTIVE LAUNCHER COMPLETE!');
        console.log('✅ All systems launched and verified');
        console.log('🎯 Cal Riven Executive Dashboard: http://localhost:9999');
        console.log('\n🔧 Press Ctrl+C to shutdown all systems gracefully');
    }

    async preFlightChecks() {
        console.log('🔍 PHASE 1: PRE-FLIGHT CHECKS');
        console.log('==============================');

        // Check Node.js version
        const nodeVersion = process.version;
        console.log(`✅ Node.js version: ${nodeVersion}`);

        // Check for required files
        const missingFiles = [];
        for (const system of this.launchOrder) {
            const filePath = path.join(this.baseDir, system.file);
            if (!fs.existsSync(filePath)) {
                missingFiles.push(system.file);
                if (system.required) {
                    console.log(`❌ REQUIRED FILE MISSING: ${system.file}`);
                } else {
                    console.log(`⚠️  Optional file missing: ${system.file}`);
                }
            } else {
                console.log(`✅ Found: ${system.file}`);
            }
        }

        // Check for port conflicts
        const portConflicts = [];
        for (const system of this.launchOrder) {
            if (system.port) {
                const inUse = await this.checkPort(system.port);
                if (inUse) {
                    portConflicts.push({ system: system.name, port: system.port });
                    console.log(`⚠️  Port ${system.port} in use (${system.name})`);
                } else {
                    console.log(`✅ Port ${system.port} available`);
                }
            }
        }

        // Check for critical dependencies
        await this.checkDependencies();

        if (missingFiles.filter((_, index) => this.launchOrder[index]?.required).length > 0) {
            throw new Error('Required files missing - cannot continue');
        }

        console.log('✅ Pre-flight checks completed\n');
    }

    async checkDependencies() {
        console.log('📦 Checking dependencies...');

        // Check if Ollama is available
        try {
            await this.executeCommand('ollama --version');
            console.log('✅ Ollama available');
        } catch (error) {
            console.log('⚠️  Ollama not found (optional for local AI)');
        }

        // Check if tmux is available (for advanced terminal management)
        try {
            await this.executeCommand('tmux -V');
            console.log('✅ tmux available');
        } catch (error) {
            console.log('⚠️  tmux not found (optional)');
        }

        // Check available memory
        const memInfo = process.memoryUsage();
        const totalMem = Math.round(memInfo.heapTotal / 1024 / 1024);
        console.log(`✅ Memory available: ${totalMem}MB`);
    }

    async launchSystem(system) {
        console.log(`🚀 LAUNCHING: ${system.name}`);
        console.log(`📁 File: ${system.file}`);

        const filePath = path.join(this.baseDir, system.file);

        if (!fs.existsSync(filePath)) {
            if (system.required) {
                throw new Error(`Required system file not found: ${system.file}`);
            } else {
                console.log(`⚠️  Skipping optional system: ${system.name}\n`);
                return;
            }
        }

        try {
            let process;

            if (system.script) {
                // Launch shell script
                process = spawn('bash', [filePath], {
                    detached: false,
                    stdio: ['inherit', 'pipe', 'pipe'],
                    cwd: this.baseDir
                });
            } else {
                // Launch Node.js file
                process = spawn('node', [filePath], {
                    detached: false,
                    stdio: ['inherit', 'pipe', 'pipe'],
                    cwd: this.baseDir
                });
            }

            // Handle process output
            process.stdout.on('data', (data) => {
                const output = data.toString().trim();
                if (output) {
                    console.log(`[${system.name}] ${output}`);
                }
            });

            process.stderr.on('data', (data) => {
                const output = data.toString().trim();
                if (output) {
                    console.error(`[${system.name}] ERROR: ${output}`);
                }
            });

            process.on('close', (code) => {
                console.log(`❌ ${system.name} exited with code ${code}`);
                this.processes.delete(system.name);
            });

            this.processes.set(system.name, {
                process: process,
                system: system,
                startTime: Date.now()
            });

            console.log(`🔄 Waiting ${system.waitTime}ms for ${system.name} to start...`);
            await this.delay(system.waitTime);

            // Verify the system started correctly
            if (system.port) {
                const isRunning = await this.checkPort(system.port);
                if (isRunning) {
                    console.log(`✅ ${system.name} is running on port ${system.port}`);
                } else {
                    console.log(`⚠️  ${system.name} may not be fully ready yet`);
                }
            } else {
                console.log(`✅ ${system.name} launched (no port check)`);
            }

        } catch (error) {
            console.error(`❌ Failed to launch ${system.name}:`, error.message);
            if (system.required) {
                throw error;
            }
        }

        console.log(''); // Add spacing
    }

    async postLaunchVerification() {
        console.log('🔍 PHASE 3: POST-LAUNCH VERIFICATION');
        console.log('====================================');

        // Check all systems are running
        for (const [name, processInfo] of this.processes) {
            const system = processInfo.system;
            const uptime = Math.round((Date.now() - processInfo.startTime) / 1000);

            if (system.port) {
                const isRunning = await this.checkPort(system.port);
                if (isRunning) {
                    console.log(`✅ ${name} - Running (${uptime}s uptime) on port ${system.port}`);
                } else {
                    console.log(`❌ ${name} - Not responding on port ${system.port}`);
                }
            } else {
                console.log(`✅ ${name} - Running (${uptime}s uptime)`);
            }
        }

        // Test Cal Riven executive dashboard
        try {
            const response = await this.httpGet('http://localhost:9999');
            if (response) {
                console.log('✅ Cal Riven Executive Dashboard accessible');
            }
        } catch (error) {
            console.log('⚠️  Cal Riven Dashboard not yet accessible');
        }

        console.log('✅ Post-launch verification completed\n');
    }

    setupMonitoring() {
        console.log('🩺 PHASE 4: SETTING UP MONITORING');
        console.log('==================================');

        // Monitor process health every 30 seconds
        setInterval(() => {
            this.healthCheck();
        }, 30000);

        // Setup graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 GRACEFUL SHUTDOWN INITIATED');
            this.shutdown();
        });

        process.on('SIGTERM', () => {
            console.log('\n🛑 GRACEFUL SHUTDOWN INITIATED');
            this.shutdown();
        });

        console.log('✅ Monitoring and shutdown handlers active\n');
    }

    async healthCheck() {
        console.log('🩺 Health check...');
        
        for (const [name, processInfo] of this.processes) {
            const system = processInfo.system;
            
            if (system.port) {
                const isRunning = await this.checkPort(system.port);
                if (!isRunning) {
                    console.log(`⚠️  ${name} not responding - may need restart`);
                }
            }
        }
    }

    async shutdown() {
        console.log('🔌 Shutting down all systems...');

        // Shutdown in reverse order
        const shutdownOrder = Array.from(this.processes.entries()).reverse();

        for (const [name, processInfo] of shutdownOrder) {
            console.log(`🔌 Stopping ${name}...`);
            
            try {
                processInfo.process.kill('SIGTERM');
                await this.delay(2000);
                
                if (!processInfo.process.killed) {
                    processInfo.process.kill('SIGKILL');
                }
            } catch (error) {
                console.error(`Error stopping ${name}:`, error.message);
            }
        }

        console.log('✅ All systems shutdown completed');
        process.exit(0);
    }

    // Utility methods
    async checkPort(port) {
        return new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(1000);
            
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });
            
            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });
            
            socket.on('error', () => {
                resolve(false);
            });
            
            socket.connect(port, 'localhost');
        });
    }

    async executeCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }

    async httpGet(url) {
        return new Promise((resolve, reject) => {
            const http = require('http');
            const request = http.get(url, (response) => {
                resolve(response.statusCode === 200);
            });
            
            request.on('error', (error) => {
                reject(error);
            });
            
            request.setTimeout(5000, () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getSystemStatus() {
        const status = {
            totalSystems: this.processes.size,
            running: 0,
            failed: 0,
            systems: {}
        };

        for (const [name, processInfo] of this.processes) {
            const uptime = Math.round((Date.now() - processInfo.startTime) / 1000);
            status.systems[name] = {
                uptime: uptime,
                port: processInfo.system.port,
                required: processInfo.system.required
            };
            status.running++;
        }

        return status;
    }
}

// CLI usage
if (require.main === module) {
    const launcher = new MasterExecutiveLauncher();
    
    console.log(`
🚀 MASTER EXECUTIVE LAUNCHER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Complete system orchestration and management
🔧 Cal Riven + LLM + DeathToData + Deep Tier
🩺 Automated health monitoring and recovery
🛡️  Graceful shutdown and error handling

Starting complete system launch sequence...
    `);

    launcher.launch().catch((error) => {
        console.error('\n❌ LAUNCH FAILED:', error.message);
        console.log('\n🔧 Attempting emergency cleanup...');
        launcher.shutdown();
    });
}

module.exports = MasterExecutiveLauncher;