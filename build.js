#!/usr/bin/env node

/**
 * 🚀 DOCUMENT GENERATOR BUILD SYSTEM
 * 
 * One command to rule them all:
 * - Start all services
 * - Handle different modes
 * - Provide clean interface
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class DocumentGeneratorBuilder {
    constructor() {
        this.services = [];
        this.mode = 'full';
        this.port = 5000;
        
        console.log('🚀 DOCUMENT GENERATOR BUILD SYSTEM');
        console.log('📄 Document → Brain → Live App');
    }
    
    /**
     * 📋 PARSE COMMAND LINE ARGS
     */
    parseArgs(args) {
        const flags = {};
        
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            
            switch(arg) {
                case '--mode':
                case '-m':
                    flags.mode = args[++i] || 'full';
                    break;
                    
                case '--port':
                case '-p':
                    flags.port = parseInt(args[++i]) || 5000;
                    break;
                    
                case '--quick':
                case '-q':
                    flags.mode = 'quick';
                    break;
                    
                case '--brain-only':
                case '-b':
                    flags.mode = 'brain';
                    break;
                    
                case '--demo':
                case '-d':
                    flags.mode = 'demo';
                    break;
                    
                case '--help':
                case '-h':
                    this.showHelp();
                    process.exit(0);
                    
                default:
                    if (arg.startsWith('-')) {
                        console.log(`Unknown flag: ${arg}`);
                        this.showHelp();
                        process.exit(1);
                    }
            }
        }
        
        return flags;
    }
    
    /**
     * 📖 SHOW HELP
     */
    showHelp() {
        console.log(`
🚀 Document Generator - Transform any document into a live app

Usage: node build.js [options]

Options:
  --mode, -m <mode>    Start mode: full, quick, brain, demo (default: full)
  --port, -p <port>    Main port for brain service (default: 5000)
  --quick, -q          Quick start - brain only
  --brain-only, -b     Start only the AI brain service
  --demo, -d           Start demo mode
  --help, -h           Show this help

Modes:
  full        Start all services (brain, error bash, biometric, etc.)
  quick       Start only essential services (brain + error bash)
  brain       Start only the AI brain deployment service
  demo        Start the demo MVP generator

Examples:
  node build.js                    # Start everything
  node build.js --quick            # Quick start
  node build.js --mode brain       # Brain only
  node build.js --port 8080        # Use different port
  node build.js --demo             # Run demo

Access Points:
  Brain UI:    http://localhost:5000
  Demo:        http://localhost:4000
  Error Bash:  http://localhost:9999
        `);
    }
    
    /**
     * 🎯 GET SERVICES BY MODE
     */
    getServicesByMode(mode) {
        const services = {
            full: [
                { name: 'Control Panel', file: 'unified-menu-interface.js', port: 3030, critical: true },
                { name: 'Auth System', file: '../auth-layer/auth-system-complete.js', port: 8080, critical: true },
                { name: 'Auth Integration', file: '../auth-layer/auth-integration.js', port: 8090 },
                { name: 'AI Brain', file: 'showboat-brain-deployment.js', port: 5000, critical: true },
                { name: 'Error Bash', file: 'error-bash-through-system.js', port: 9999, critical: true },
                { name: 'OSS Reasoning', file: 'oss-reasoning-direct-integration.js', port: 8888 },
                { name: 'Contract Layer', file: 'contract-layer-biometric-mesh.js', port: 7777 },
                { name: 'Menu Debug', file: 'collapsed-menu-debug.js', port: 6666 },
                { name: 'Biometric', file: 'biometric-wormhole-interface.js', port: 5555 }
            ],
            quick: [
                { name: 'Control Panel', file: 'unified-menu-interface.js', port: 3030, critical: true },
                { name: 'AI Brain', file: 'showboat-brain-deployment.js', port: 5000, critical: true },
                { name: 'Error Bash', file: 'error-bash-through-system.js', port: 9999, critical: true }
            ],
            brain: [
                { name: 'AI Brain', file: 'showboat-brain-deployment.js', port: 5000, critical: true }
            ],
            demo: [
                { name: 'MVP Demo', file: 'simple-mvp-demo.js', port: 4000, critical: true }
            ]
        };
        
        return services[mode] || services.full;
    }
    
    /**
     * 🚀 START SERVICE
     */
    async startService(service, retries = 3) {
        console.log(`\n🚀 Starting ${service.name} on port ${service.port}...`);
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                // Kill any existing process on port
                await this.killPort(service.port);
                
                // Start service
                const servicePath = path.join(__dirname, 'web-interface', service.file);
                const proc = spawn('node', [servicePath], {
                    detached: false,
                    stdio: ['ignore', 'pipe', 'pipe']
                });
                
                // Handle output
                proc.stdout.on('data', (data) => {
                    const output = data.toString();
                    if (output.includes('running on port') || output.includes('listening')) {
                        console.log(`   ✅ ${service.name} started successfully`);
                    }
                });
                
                proc.stderr.on('data', (data) => {
                    if (service.critical) {
                        console.error(`   ⚠️  ${service.name} error: ${data.toString().slice(0, 100)}`);
                    }
                });
                
                proc.on('error', (error) => {
                    console.error(`   ❌ ${service.name} failed to start: ${error.message}`);
                    if (attempt < retries) {
                        console.log(`   🔄 Retrying... (${attempt}/${retries})`);
                    }
                });
                
                // Store process
                service.process = proc;
                this.services.push(service);
                
                // Give it time to start
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                return true;
                
            } catch (error) {
                console.error(`   ❌ Failed to start ${service.name}: ${error.message}`);
                if (attempt === retries && service.critical) {
                    throw error;
                }
            }
        }
        
        return false;
    }
    
    /**
     * 💀 KILL PORT
     */
    async killPort(port) {
        try {
            const killCmd = process.platform === 'win32' 
                ? `netstat -ano | findstr :${port} | findstr LISTENING`
                : `lsof -ti:${port}`;
                
            const killProc = process.platform === 'win32'
                ? 'taskkill /F /PID'
                : 'kill -9';
                
            const proc = spawn(killCmd, [], { shell: true });
            
            await new Promise(resolve => {
                proc.on('close', resolve);
                setTimeout(resolve, 1000);
            });
        } catch (error) {
            // Ignore kill errors
        }
    }
    
    /**
     * 🏗️ BUILD AND START
     */
    async build(flags) {
        const mode = flags.mode || this.mode;
        const services = this.getServicesByMode(mode);
        
        console.log(`\n🏗️  Building in ${mode.toUpperCase()} mode...`);
        console.log(`📦 Starting ${services.length} services`);
        
        // Start all services
        for (const service of services) {
            if (flags.port && service.port === 5000) {
                service.port = flags.port;
            }
            
            try {
                await this.startService(service);
            } catch (error) {
                console.error(`\n❌ Critical service failed: ${service.name}`);
                await this.cleanup();
                process.exit(1);
            }
        }
        
        // Show success message
        console.log('\n✅ BUILD COMPLETE!');
        console.log('\n🎯 MAIN CONTROL PANEL: http://localhost:3030');
        console.log('\n🌐 All Access Points:');
        
        services.forEach(service => {
            console.log(`   ${service.name}: http://localhost:${service.port}`);
        });
        
        console.log('\n📄 Quick Start:');
        console.log('   1. Open Control Panel: http://localhost:3030');
        console.log('   2. Click "Open AI Brain" or visit http://localhost:5000');
        console.log('   3. Paste your document and click Deploy!');
        console.log('\n💡 Press Ctrl+C to stop all services');
        
        // Setup cleanup handlers
        this.setupCleanup();
    }
    
    /**
     * 🧹 SETUP CLEANUP
     */
    setupCleanup() {
        const cleanup = async () => {
            console.log('\n🛑 Shutting down services...');
            await this.cleanup();
            process.exit(0);
        };
        
        process.on('SIGINT', cleanup);
        process.on('SIGTERM', cleanup);
        process.on('exit', () => this.cleanup());
    }
    
    /**
     * 🧹 CLEANUP
     */
    async cleanup() {
        for (const service of this.services) {
            if (service.process && !service.process.killed) {
                console.log(`   Stopping ${service.name}...`);
                service.process.kill();
            }
        }
    }
}

// 🚀 MAIN
if (require.main === module) {
    const builder = new DocumentGeneratorBuilder();
    const args = process.argv.slice(2);
    const flags = builder.parseArgs(args);
    
    builder.build(flags).catch(error => {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
    });
}

module.exports = DocumentGeneratorBuilder;