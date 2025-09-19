#!/usr/bin/env node

/**
 * 🎮🧠 AUTONOMOUS GAMEPLAY DEMO - MASTER LAUNCHER
 * 
 * COMPLETE PROOF: Database Learning → Character Intelligence → Visual Gameplay
 * 
 * This is the ultimate demonstration that database operations translate
 * into intelligent NPC behaviors in real-time 3D gameplay.
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const axios = require('axios').default;

class AutonomousGameplayDemo {
    constructor() {
        this.services = new Map();
        this.healthChecks = new Map();
        this.demoStep = 0;
        this.startTime = Date.now();
        
        // Service definitions with dependencies
        this.serviceConfig = {
            // Core infrastructure first
            'postgresql': {
                name: 'PostgreSQL Database',
                port: 5432,
                healthUrl: null,
                command: null, // Assume already running
                dependency: null,
                essential: true
            },
            'redis': {
                name: 'Redis Cache',
                port: 6379,
                healthUrl: null,
                command: null, // Assume already running
                dependency: null,
                essential: true
            },
            's3-minio': {
                name: 'MinIO S3 Storage',
                port: 9000,
                healthUrl: 'http://localhost:9000/minio/health/live',
                command: null, // Assume already running
                dependency: null,
                essential: true
            },
            
            // Learning and database systems
            'character-database': {
                name: 'Character Database Integration',
                port: 9902,
                healthUrl: 'http://localhost:9902/health',
                command: 'node character-database-integration.js',
                dependency: ['postgresql', 's3-minio'],
                essential: true
            },
            'reinforcement-learning': {
                name: 'Reinforcement Learning System',
                port: 9900,
                healthUrl: 'http://localhost:9900/health',
                command: 'node carrot-reinforcement-learning-db.js',
                dependency: ['postgresql', 'redis'],
                essential: true
            },
            
            // NPC and gaming systems
            'npc-controller': {
                name: 'Autonomous NPC Controller',
                port: 4500,
                healthUrl: 'http://localhost:4500/health',
                command: 'node autonomous-character-controller.js',
                dependency: ['character-database', 'reinforcement-learning'],
                essential: true
            },
            'npc-rpc': {
                name: 'NPC RPC Autonomous System',
                port: 54322,
                healthUrl: 'http://localhost:54322',
                command: 'node npc-rpc-autonomous-system.js',
                dependency: ['character-database'],
                essential: false
            },
            
            // Visualization systems
            'gaming-engine': {
                name: 'Working Gaming Engine',
                port: 8888,
                healthUrl: 'http://localhost:8888/api/status',
                command: 'node WORKING-GAMING-ENGINE.js',
                dependency: ['npc-controller'],
                essential: false
            }
        };
        
        console.log('🎮🧠 AUTONOMOUS GAMEPLAY DEMO');
        console.log('===============================');
        console.log('🔥 Ultimate proof: Database → Intelligence → Gameplay');
        console.log('');
    }
    
    async start() {
        try {
            console.log('🚀 Starting Autonomous Gameplay Demo...');
            console.log('');
            
            // Step 1: Check prerequisites
            await this.checkPrerequisites();
            
            // Step 2: Start services in dependency order
            await this.startServices();
            
            // Step 3: Verify integration
            await this.verifyIntegration();
            
            // Step 4: Generate demonstration data
            await this.generateDemoData();
            
            // Step 5: Start monitoring
            this.startMonitoring();
            
            // Step 6: Display success and access points
            this.displaySuccessInfo();
            
        } catch (error) {
            console.error('💥 Demo startup failed:', error);
            await this.cleanup();
            process.exit(1);
        }
    }
    
    async checkPrerequisites() {
        console.log('🔍 STEP 1: Checking Prerequisites');
        console.log('==================================');
        
        const requiredFiles = [
            'character-database-integration.js',
            'autonomous-character-controller.js',
            'carrot-reinforcement-learning-db.js',
            'npc-rpc-autonomous-system.js',
            'WORKING-GAMING-ENGINE.js',
            'visual-learning-dashboard.html',
            'actually-working-3d-game.html'
        ];
        
        for (const file of requiredFiles) {
            if (fs.existsSync(file)) {
                console.log(`✅ ${file} - Found`);
            } else {
                throw new Error(`❌ Required file missing: ${file}`);
            }
        }
        
        // Check core infrastructure
        for (const [serviceId, config] of Object.entries(this.serviceConfig)) {
            if (config.essential && !config.command) {
                const isRunning = await this.checkServiceHealth(serviceId);
                if (isRunning) {
                    console.log(`✅ ${config.name} - Running`);
                } else {
                    console.log(`⚠️ ${config.name} - Not running (will try to continue)`);
                }
            }
        }
        
        console.log('✅ Prerequisites check complete');
        console.log('');
    }
    
    async startServices() {
        console.log('🚀 STEP 2: Starting Services');
        console.log('============================');
        
        // Get services in dependency order
        const orderedServices = this.getServicesInDependencyOrder();
        
        for (const serviceId of orderedServices) {
            const config = this.serviceConfig[serviceId];
            
            if (!config.command) {
                // Infrastructure service - just check if running
                continue;
            }
            
            console.log(`🔄 Starting ${config.name}...`);
            
            try {
                // Wait for dependencies
                await this.waitForDependencies(serviceId);
                
                // Start the service
                const process = spawn('node', [config.command.split(' ')[1]], {
                    stdio: 'pipe',
                    detached: false
                });
                
                this.services.set(serviceId, process);
                
                // Capture output for debugging
                process.stdout.on('data', (data) => {
                    const output = data.toString().trim();
                    if (output) {
                        console.log(`[${serviceId}] ${output}`);
                    }
                });
                
                process.stderr.on('data', (data) => {
                    const output = data.toString().trim();
                    if (output && !output.includes('DeprecationWarning')) {
                        console.log(`[${serviceId}] ERROR: ${output}`);
                    }
                });
                
                // Wait for service to be ready
                await this.waitForService(serviceId);
                console.log(`✅ ${config.name} - Started on port ${config.port}`);
                
                // Small delay between services
                await this.sleep(2000);
                
            } catch (error) {
                if (config.essential) {
                    throw new Error(`Failed to start essential service ${config.name}: ${error.message}`);
                } else {
                    console.log(`⚠️ ${config.name} - Failed to start (non-essential)`);
                }
            }
        }
        
        console.log('✅ All services started');
        console.log('');
    }
    
    getServicesInDependencyOrder() {
        const ordered = [];
        const visited = new Set();
        const visiting = new Set();
        
        const visit = (serviceId) => {
            if (visiting.has(serviceId)) {
                throw new Error(`Circular dependency detected: ${serviceId}`);
            }
            if (visited.has(serviceId)) {
                return;
            }
            
            visiting.add(serviceId);
            
            const config = this.serviceConfig[serviceId];
            if (config.dependency) {
                for (const dep of config.dependency) {
                    visit(dep);
                }
            }
            
            visiting.delete(serviceId);
            visited.add(serviceId);
            ordered.push(serviceId);
        };
        
        for (const serviceId of Object.keys(this.serviceConfig)) {
            visit(serviceId);
        }
        
        return ordered;
    }
    
    async waitForDependencies(serviceId) {
        const config = this.serviceConfig[serviceId];
        if (!config.dependency) return;
        
        console.log(`⏳ Waiting for dependencies of ${config.name}...`);
        
        for (const depId of config.dependency) {
            const maxWait = 30000; // 30 seconds
            const startTime = Date.now();
            
            while (Date.now() - startTime < maxWait) {
                if (await this.checkServiceHealth(depId)) {
                    break;
                }
                await this.sleep(1000);
            }
            
            if (!(await this.checkServiceHealth(depId))) {
                throw new Error(`Dependency ${depId} not ready for ${serviceId}`);
            }
        }
    }
    
    async waitForService(serviceId) {
        const maxWait = 30000; // 30 seconds
        const startTime = Date.now();
        
        while (Date.now() - startTime < maxWait) {
            if (await this.checkServiceHealth(serviceId)) {
                return true;
            }
            await this.sleep(1000);
        }
        
        throw new Error(`Service ${serviceId} failed to start within timeout`);
    }
    
    async checkServiceHealth(serviceId) {
        const config = this.serviceConfig[serviceId];
        if (!config.healthUrl && !config.port) return false;
        
        try {
            if (config.healthUrl) {
                const response = await axios.get(config.healthUrl, { timeout: 2000 });
                return response.status === 200;
            } else {
                // Simple port check
                return new Promise((resolve) => {
                    const socket = require('net').createConnection(config.port, 'localhost');
                    socket.on('connect', () => {
                        socket.end();
                        resolve(true);
                    });
                    socket.on('error', () => resolve(false));
                    setTimeout(() => resolve(false), 2000);
                });
            }
        } catch (error) {
            return false;
        }
    }
    
    async verifyIntegration() {
        console.log('🔗 STEP 3: Verifying Integration');
        console.log('=================================');
        
        // Test the complete data flow
        const verifications = [
            {
                name: 'Character Database Connection',
                test: () => this.testCharacterDatabase()
            },
            {
                name: 'Learning System Integration',
                test: () => this.testLearningSystem()
            },
            {
                name: 'NPC Controller Data Flow',
                test: () => this.testNPCController()
            },
            {
                name: 'WebSocket Connections',
                test: () => this.testWebSocketConnections()
            }
        ];
        
        for (const verification of verifications) {
            try {
                console.log(`🔍 Testing ${verification.name}...`);
                await verification.test();
                console.log(`✅ ${verification.name} - OK`);
            } catch (error) {
                console.log(`❌ ${verification.name} - Failed: ${error.message}`);
                throw error;
            }
        }
        
        console.log('✅ Integration verification complete');
        console.log('');
    }
    
    async testCharacterDatabase() {
        const response = await axios.get('http://localhost:9902/api/characters/effectiveness');
        if (!response.data || typeof response.data !== 'object') {
            throw new Error('Invalid character database response');
        }
    }
    
    async testLearningSystem() {
        const response = await axios.get('http://localhost:9900/api/knowledge-graph');
        if (!response.data) {
            throw new Error('Learning system not responding');
        }
    }
    
    async testNPCController() {
        const response = await axios.get('http://localhost:4500/api/npcs');
        if (!response.data || !response.data.npcs) {
            throw new Error('NPC Controller not returning NPC data');
        }
    }
    
    async testWebSocketConnections() {
        // Test WebSocket connectivity
        return new Promise((resolve, reject) => {
            const WebSocket = require('ws');
            const ws = new WebSocket('ws://localhost:4501');
            
            const timeout = setTimeout(() => {
                ws.close();
                reject(new Error('WebSocket connection timeout'));
            }, 5000);
            
            ws.on('open', () => {
                clearTimeout(timeout);
                ws.close();
                resolve();
            });
            
            ws.on('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }
    
    async generateDemoData() {
        console.log('📊 STEP 4: Generating Demo Data');
        console.log('=================================');
        
        // Trigger some database operations to create learning data
        try {
            console.log('🔄 Triggering character database operations...');
            
            const characters = ['ralph', 'alice', 'bob', 'charlie', 'diana', 'eve'];
            
            for (const char of characters) {
                try {
                    await axios.post('http://localhost:9902/api/database/operation', {
                        character: char,
                        operation: 'demo_learning_operation',
                        data: { demo: true, timestamp: Date.now() }
                    });
                    console.log(`✅ Generated demo data for ${char}`);
                } catch (error) {
                    console.log(`⚠️ Demo data generation failed for ${char}: ${error.message}`);
                }
                
                await this.sleep(500); // Small delay between operations
            }
            
            console.log('✅ Demo data generation complete');
            
        } catch (error) {
            console.log(`⚠️ Demo data generation had issues: ${error.message}`);
        }
        
        console.log('');
    }
    
    startMonitoring() {
        console.log('📊 STEP 5: Starting Monitoring');
        console.log('===============================');
        
        // Monitor service health every 30 seconds
        setInterval(async () => {
            const healthStatus = new Map();
            
            for (const [serviceId, config] of Object.entries(this.serviceConfig)) {
                if (config.command || config.healthUrl) {
                    const isHealthy = await this.checkServiceHealth(serviceId);
                    healthStatus.set(serviceId, isHealthy);
                }
            }
            
            this.healthChecks.set(Date.now(), healthStatus);
            
            // Log any service failures
            for (const [serviceId, isHealthy] of healthStatus) {
                if (!isHealthy) {
                    console.log(`⚠️ Service health warning: ${this.serviceConfig[serviceId].name}`);
                }
            }
            
        }, 30000);
        
        console.log('✅ Monitoring started');
        console.log('');
    }
    
    displaySuccessInfo() {
        console.log('🎉 AUTONOMOUS GAMEPLAY DEMO READY!');
        console.log('===================================');
        console.log('');
        console.log('🔥 PROOF OF CONCEPT: Database Learning → NPC Intelligence → Visual Gameplay');
        console.log('');
        console.log('📊 MONITORING DASHBOARDS:');
        console.log('  🤖 NPC Controller:           http://localhost:4500');
        console.log('  🧠 Visual Learning Dashboard: file://visual-learning-dashboard.html');
        console.log('  🎮 3D Game World:            file://actually-working-3d-game.html');
        console.log('  📡 NPC RPC Monitor:          http://localhost:54322');
        console.log('  🎯 Gaming Engine:            http://localhost:8888');
        console.log('');
        console.log('🔗 API ENDPOINTS:');
        console.log('  📊 Character Database:       http://localhost:9902/api/characters/effectiveness');
        console.log('  🧠 Learning System:          http://localhost:9900/api/knowledge-graph');
        console.log('  🤖 NPC Status:               http://localhost:4500/api/npcs');
        console.log('  🎮 Game State:               http://localhost:8888/api/status');
        console.log('');
        console.log('🎯 DEMONSTRATION FLOW:');
        console.log('  1. Characters perform database operations');
        console.log('  2. Operations are tracked and stored in S3');
        console.log('  3. Learning scores are calculated from success rates');
        console.log('  4. NPCs receive learning data via WebSocket');
        console.log('  5. NPCs move and act based on learning scores');
        console.log('  6. Visual dashboards show real-time learning → behavior');
        console.log('');
        console.log('✨ Open the Visual Learning Dashboard to see NPCs acting based on database learning!');
        console.log('');
        
        // Set up graceful shutdown
        process.on('SIGINT', () => {
            console.log('\\n🛑 Shutting down Autonomous Gameplay Demo...');
            this.cleanup().then(() => {
                console.log('✅ Demo shutdown complete');
                process.exit(0);
            });
        });
        
        console.log('🔄 Demo running... Press Ctrl+C to stop');
    }
    
    async cleanup() {
        console.log('🧹 Cleaning up services...');
        
        for (const [serviceId, process] of this.services) {
            try {
                if (process && !process.killed) {
                    process.kill('SIGTERM');
                    console.log(`✅ Stopped ${serviceId}`);
                }
            } catch (error) {
                console.log(`⚠️ Error stopping ${serviceId}: ${error.message}`);
            }
        }
        
        // Wait a moment for graceful shutdown
        await this.sleep(2000);
        
        // Force kill any remaining processes
        for (const [serviceId, process] of this.services) {
            try {
                if (process && !process.killed) {
                    process.kill('SIGKILL');
                }
            } catch (error) {
                // Ignore errors during force kill
            }
        }
    }
    
    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the demo
if (require.main === module) {
    const demo = new AutonomousGameplayDemo();
    demo.start().catch(console.error);
}

module.exports = AutonomousGameplayDemo;