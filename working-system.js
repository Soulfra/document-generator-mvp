#!/usr/bin/env node
/**
 * Working System - Connects Your Existing Auth to Everything
 * 
 * This is the simple connector that makes everything work together
 * No bloat, just uses what you already built
 */

const { spawn } = require('child_process');
const SimpleAuthConnector = require('./simple-auth-connector');

class WorkingSystem {
    constructor() {
        this.auth = new SimpleAuthConnector();
        this.services = new Map();
        
        console.log('🎯 WORKING SYSTEM - CONNECTING YOUR EXISTING STUFF');
        console.log('================================================');
        console.log('');
    }
    
    async start() {
        console.log('🚀 Starting your working system...\n');
        
        // 1. Check authentication
        await this.setupAuth();
        
        // 2. Start essential services
        await this.startServices();
        
        // 3. Open main interface
        this.openInterface();
        
        console.log('\n✅ WORKING SYSTEM READY!');
        console.log('========================');
        console.log('');
        console.log('🌐 Main Interface: http://localhost:8080');
        console.log('📝 Author Studio: ./author-studio.html'); 
        console.log('🔐 Auth Status: http://localhost:9999/auth/status');
        console.log('');
        console.log('Press Ctrl+C to stop everything');
        
        // Keep running
        this.keepAlive();
    }
    
    async setupAuth() {
        console.log('🔐 Setting up authentication...');
        
        try {
            const isValid = await this.auth.checkAuth();
            if (isValid) {
                console.log('✅ Authentication ready');
            } else {
                console.log('⚠️ No valid auth found');
                console.log('💡 Run: node simple-auth-connector.js login');
            }
        } catch (error) {
            console.log('⚠️ Auth system not running (will use fallbacks)');
        }
        
        // Start auth status server
        this.auth.createStatusServer();
        console.log('✅ Auth status server running');
    }
    
    async startServices() {
        console.log('\n🚀 Starting core services...');
        
        // Start socket server if not running
        if (!this.isPortInUse(8081)) {
            console.log('📡 Starting WebSocket server...');
            this.startService('socket', 'node', ['socket-server.js']);
        } else {
            console.log('✅ WebSocket server already running');
        }
        
        // Start PropTech JWT auth backend if available
        const proptechBackend = './proptech-vc-demo/backend';
        if (require('fs').existsSync(proptechBackend)) {
            if (!this.isPortInUse(5000)) {
                console.log('🏢 Starting PropTech JWT backend...');
                this.startService('proptech', 'npm', ['run', 'dev'], { cwd: proptechBackend });
            } else {
                console.log('✅ PropTech backend already running');
            }
        }
        
        console.log('✅ Essential services running');
    }
    
    startService(name, command, args, options = {}) {
        try {
            const process = spawn(command, args, {
                stdio: 'pipe',
                detached: false,
                ...options
            });
            
            process.stdout.on('data', (data) => {
                // Only log important messages, not spam
                const message = data.toString();
                if (message.includes('listening') || message.includes('started') || message.includes('ready')) {
                    console.log(`[${name}] ${message.trim()}`);
                }
            });
            
            process.stderr.on('data', (data) => {
                const message = data.toString();
                if (!message.includes('warning') && !message.includes('deprecated')) {
                    console.log(`[${name}] ${message.trim()}`);
                }
            });
            
            this.services.set(name, process);
            return process;
        } catch (error) {
            console.log(`⚠️ Failed to start ${name}:`, error.message);
        }
    }
    
    isPortInUse(port) {
        try {
            const { execSync } = require('child_process');
            const result = execSync(`lsof -i :${port}`, { encoding: 'utf8' });
            return result.length > 0;
        } catch (e) {
            return false;
        }
    }
    
    openInterface() {
        console.log('\n🌐 Opening main interface...');
        
        const platform = process.platform;
        const command = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
        
        try {
            require('child_process').exec(`${command} index.html`);
        } catch (e) {
            console.log('💡 Manually open: index.html in your browser');
        }
    }
    
    keepAlive() {
        // Handle shutdown gracefully
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down...');
            
            this.services.forEach((service, name) => {
                console.log(`Stopping ${name}...`);
                service.kill();
            });
            
            console.log('👋 Goodbye!');
            process.exit(0);
        });
        
        // Keep process alive
        setInterval(() => {
            // Check if services are still running
            let runningServices = 0;
            this.services.forEach((service, name) => {
                if (!service.killed) {
                    runningServices++;
                }
            });
            
            if (runningServices === 0 && this.services.size > 0) {
                console.log('⚠️ All services stopped, exiting...');
                process.exit(0);
            }
        }, 5000);
    }
    
    // Helper methods for external use
    async authenticatedRequest(url, options = {}) {
        const headers = await this.auth.getAuthHeaders();
        return fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...options.headers
            }
        });
    }
    
    async pushToGitHub() {
        console.log('\n🚀 AUTHENTICATED GITHUB PUSH');
        return this.auth.authenticatedGitPush();
    }
}

// CLI commands
async function main() {
    const system = new WorkingSystem();
    const args = process.argv.slice(2);
    const command = args[0] || 'start';
    
    switch (command) {
        case 'start':
            await system.start();
            break;
            
        case 'auth':
            await system.setupAuth();
            break;
            
        case 'push':
            await system.pushToGitHub();
            break;
            
        case 'keys':
            console.log('Setting up API keys...');
            const APIKeyFixer = require('./fix-api-keys');
            const fixer = new APIKeyFixer();
            await fixer.fixKeys();
            break;
            
        default:
            console.log('Usage:');
            console.log('  node working-system.js start  # Start everything');
            console.log('  node working-system.js auth   # Setup auth only');
            console.log('  node working-system.js push   # Push to GitHub');
            console.log('  node working-system.js keys   # Setup API keys');
            console.log('');
            console.log('Quick commands:');
            console.log('  ./just-fucking-push.sh        # Simple GitHub push');
            console.log('  node fix-api-keys.js setup     # Setup API keys');
            break;
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = WorkingSystem;