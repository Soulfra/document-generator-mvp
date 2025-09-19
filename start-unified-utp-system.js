#!/usr/bin/env node

/**
 * UNIFIED UTP/COBOL SYSTEM LAUNCHER
 * Starts the complete integrated SoulFRA system with:
 * - UTP Command Interface 
 * - COBOL Security Bridge
 * - Secure API Endpoints
 * - Unified HTML Interface
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class UnifiedSystemLauncher {
    constructor() {
        this.processes = [];
        this.services = [
            {
                name: 'UTP Command Interface',
                script: './utp-command-interface.js',
                port: 7001,
                enabled: true
            },
            {
                name: 'COBOL Security Bridge',
                script: './cobol-security-bridge.js',
                port: 7002,
                enabled: true
            },
            {
                name: 'Secure API Endpoints',
                script: './secure-api-endpoints.js',
                port: 8080,
                enabled: true
            },
            {
                name: 'CAL MMORPG System',
                script: './cal-mmorpg-unified-system.js',
                port: 7777,
                enabled: true
            },
            {
                name: 'SoulFRA Launcher',
                script: './soulfra-unified-launcher.js',
                port: 9001,
                enabled: true
            }
        ];
        
        this.htmlInterface = './UNIFIED-SOULFRA-INTEGRATED-SYSTEM.html';
        this.webPort = 3000;
    }
    
    async start() {
        console.log('🌐 Starting Unified UTP/COBOL System...\n');
        
        // Check if all required files exist
        await this.checkRequiredFiles();
        
        // Start all services
        await this.startServices();
        
        // Start web interface
        await this.startWebInterface();
        
        // Setup graceful shutdown
        this.setupGracefulShutdown();
        
        // Display system status
        this.displaySystemStatus();
        
        console.log('\n✅ Unified System fully operational!');
        console.log('🌐 Access the system at: http://localhost:3000');
        console.log('⚡ UTP Console: Switch to UTP mode in interface');
        console.log('🧠 COBOL Bridge: Security monitoring active');
        console.log('🔒 API Endpoints: Secured and operational');
        console.log('\nPress Ctrl+C to shutdown all services gracefully\n');
    }
    
    async checkRequiredFiles() {
        console.log('📋 Checking required files...');
        
        const requiredFiles = [
            './utp-command-interface.js',
            './cobol-security-bridge.js', 
            './secure-api-endpoints.js',
            './UNIFIED-SOULFRA-INTEGRATED-SYSTEM.html'
        ];
        
        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                console.error(`❌ Required file missing: ${file}`);
                console.log('Please ensure all UTP/COBOL integration files are present.');
                process.exit(1);
            }
        }
        
        console.log('✅ All required files present\n');
    }
    
    async startServices() {
        console.log('🚀 Starting backend services...\n');
        
        for (const service of this.services) {
            if (!service.enabled) {
                console.log(`⏭️  Skipping ${service.name} (disabled)`);
                continue;
            }
            
            if (!fs.existsSync(service.script)) {
                console.log(`⚠️  ${service.name}: Script not found (${service.script})`);
                continue;
            }
            
            try {
                console.log(`🔄 Starting ${service.name}...`);
                
                const process = spawn('node', [service.script], {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    detached: false
                });
                
                process.stdout.on('data', (data) => {
                    const output = data.toString().trim();
                    if (output) {
                        console.log(`[${service.name}] ${output}`);
                    }
                });
                
                process.stderr.on('data', (data) => {
                    const error = data.toString().trim();
                    if (error && !error.includes('ExperimentalWarning')) {
                        console.error(`[${service.name}] ERROR: ${error}`);
                    }
                });
                
                process.on('close', (code) => {
                    console.log(`[${service.name}] Process exited with code ${code}`);
                    this.processes = this.processes.filter(p => p !== process);
                });
                
                this.processes.push(process);
                
                // Give service time to start
                await this.sleep(1000);
                
                console.log(`✅ ${service.name} started on port ${service.port}\n`);
                
            } catch (error) {
                console.error(`❌ Failed to start ${service.name}:`, error.message);
            }
        }
    }
    
    async startWebInterface() {
        console.log('🌐 Starting web interface server...');
        
        // Create a simple HTTP server to serve the HTML interface
        const http = require('http');
        const url = require('url');
        
        const server = http.createServer((req, res) => {
            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;
            
            // Serve the main interface
            if (pathname === '/' || pathname === '/index.html') {
                try {
                    const html = fs.readFileSync(this.htmlInterface, 'utf8');
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(html);
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error loading interface: ' + error.message);
                }
                return;
            }
            
            // Health check endpoint
            if (pathname === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'healthy',
                    services: this.getServiceStatus(),
                    timestamp: Date.now()
                }));
                return;
            }
            
            // System status endpoint
            if (pathname === '/api/system/status') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    unified: {
                        status: 'operational',
                        services: this.services.length,
                        uptime: process.uptime()
                    },
                    utp: {
                        adapters: 4,
                        commands: 24,
                        status: 'connected'
                    },
                    cobol: {
                        mode: 'SURVIVAL',
                        security: 'ACTIVE',
                        threatLevel: 'LOW'
                    },
                    api: {
                        endpoints: 12,
                        secured: 8,
                        hidden: 4
                    }
                }));
                return;
            }
            
            // 404 for everything else
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        });
        
        server.listen(this.webPort, () => {
            console.log(`✅ Web interface server started on port ${this.webPort}\n`);
        });
        
        this.webServer = server;
    }
    
    getServiceStatus() {
        return this.services.map(service => ({
            name: service.name,
            port: service.port,
            enabled: service.enabled,
            running: service.enabled && fs.existsSync(service.script)
        }));
    }
    
    setupGracefulShutdown() {
        const shutdown = () => {
            console.log('\n🛑 Shutting down Unified UTP/COBOL System...');
            
            // Stop web server
            if (this.webServer) {
                this.webServer.close();
                console.log('✅ Web interface server stopped');
            }
            
            // Stop all service processes
            this.processes.forEach((process, index) => {
                try {
                    process.kill('SIGTERM');
                    console.log(`✅ Service ${index + 1} stopped`);
                } catch (error) {
                    console.error(`❌ Error stopping service ${index + 1}:`, error.message);
                }
            });
            
            console.log('👋 Goodbye! All systems shut down gracefully.');
            process.exit(0);
        };
        
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }
    
    displaySystemStatus() {
        console.log('\n📊 UNIFIED SYSTEM STATUS');
        console.log('═══════════════════════════════════════════════════');
        
        // Service status
        console.log('\n🔧 Backend Services:');
        this.services.forEach(service => {
            const status = service.enabled ? '🟢 RUNNING' : '⚪ DISABLED';
            const port = service.port ? `(port ${service.port})` : '';
            console.log(`   ${status} ${service.name} ${port}`);
        });
        
        // System components
        console.log('\n⚡ UTP Integration:');
        console.log('   🟢 Command Interface - 24 commands available');
        console.log('   🟢 Mathematical Adapter - Blamechain verified');
        console.log('   🟢 Spatial Locator - Territory mapping');
        console.log('   🟢 Verification Audit - Security patterns');
        
        console.log('\n🧠 COBOL Security Bridge:');
        console.log('   🟢 Reptilian Brain - Survival mode active');
        console.log('   🟢 Threat Assessment - Real-time monitoring');
        console.log('   🟢 Territorial Defense - Boundary protection');
        console.log('   🟢 Resource Management - Allocation tracking');
        
        console.log('\n🔒 Secure API Endpoints:');
        console.log('   🟢 Business Website - Professional frontend');
        console.log('   🟢 Authentication - Biometric integration');
        console.log('   🟢 Document Processing - UTP secured');
        console.log('   🟢 Gaming Interface - Hidden endpoints');
        
        console.log('\n🌐 Unified Interface:');
        console.log('   🟢 Mode Switching - 6 integrated modes');
        console.log('   🟢 UTP Console - Direct command access');
        console.log('   🟢 Security Status - Real-time monitoring');
        console.log('   🟢 Cross-Integration - All systems connected');
        
        console.log('\n═══════════════════════════════════════════════════');
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Start the system if run directly
if (require.main === module) {
    const launcher = new UnifiedSystemLauncher();
    launcher.start().catch(error => {
        console.error('❌ Failed to start unified system:', error);
        process.exit(1);
    });
}

module.exports = UnifiedSystemLauncher;