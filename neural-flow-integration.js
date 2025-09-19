/**
 * Neural Flow Integration - Connects Spatial Viewer with Neural Conductor
 * 
 * This module integrates the spatial neural flow viewer with the actual
 * neural conductor experiments, vault storage, and ticker tape logging.
 * It provides a unified interface for running real neural processing
 * with visual feedback.
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

class NeuralFlowIntegration {
    constructor(options = {}) {
        this.config = {
            // Service ports
            neuralConductorPort: 9000,
            packetTrackerPort: 8082,
            webSocketPort: 8081,
            vaultPort: 8888,
            
            // Paths
            neuralConductorPath: './packages/@utp/neural-conductor-experiments',
            spatialViewerPath: './spatial-neural-flow-viewer.html',
            packetTrackerPath: './story-packet-tracker.js',
            
            // Feature flags
            enableVaultStorage: true,
            enableTickerTapeLogging: true,
            enableSpatialVisualization: true,
            enableRealTimeMonitoring: true,
            
            ...options
        };
        
        this.services = {
            neuralConductor: null,
            packetTracker: null,
            webSocketServer: null
        };
        
        this.isRunning = false;
        this.processedStories = [];
        this.systemMetrics = {
            storiesProcessed: 0,
            totalPackets: 0,
            averageCompressionRatio: 0,
            emergentBehaviorsDetected: 0,
            vaultEntriesStored: 0
        };
    }
    
    async initialize() {
        console.log('🚀 Initializing Neural Flow Integration System...');
        
        try {
            // Check prerequisites
            await this.checkPrerequisites();
            
            // Start core services
            await this.startPacketTracker();
            await this.setupWebSocketBridge();
            
            // Connect to neural conductor (if available)
            await this.connectToNeuralConductor();
            
            // Setup vault integration
            if (this.config.enableVaultStorage) {
                await this.setupVaultIntegration();
            }
            
            // Setup ticker tape logging
            if (this.config.enableTickerTapeLogging) {
                await this.setupTickerTapeLogging();
            }
            
            this.isRunning = true;
            console.log('✅ Neural Flow Integration System ready!');
            console.log(`🌐 Open spatial viewer: file://${path.resolve(this.config.spatialViewerPath)}`);
            
        } catch (error) {
            console.error('❌ Failed to initialize system:', error);
            throw error;
        }
    }
    
    async checkPrerequisites() {
        console.log('🔍 Checking prerequisites...');
        
        // Check if spatial viewer exists
        try {
            await fs.access(this.config.spatialViewerPath);
            console.log('✅ Spatial viewer found');
        } catch (error) {
            throw new Error('Spatial viewer HTML file not found');
        }
        
        // Check neural conductor package
        try {
            await fs.access(this.config.neuralConductorPath);
            console.log('✅ Neural conductor package found');
        } catch (error) {
            console.log('⚠️ Neural conductor package not found - will run in simulation mode');
        }
        
        // Check if ports are available
        const portsToCheck = [
            this.config.packetTrackerPort,
            this.config.webSocketPort
        ];
        
        for (const port of portsToCheck) {
            if (await this.isPortInUse(port)) {
                throw new Error(`Port ${port} is already in use`);
            }
        }
        
        console.log('✅ All prerequisites checked');
    }
    
    async isPortInUse(port) {
        return new Promise((resolve) => {
            const server = require('net').createServer();
            server.listen(port, (err) => {
                if (err) {
                    resolve(true); // Port in use
                } else {
                    server.close(() => resolve(false)); // Port available
                }
            });
        });
    }
    
    async startPacketTracker() {
        console.log('🎯 Starting packet tracker...');
        
        const StoryPacketTracker = require('./story-packet-tracker.js');
        
        this.services.packetTracker = new StoryPacketTracker({
            port: this.config.packetTrackerPort,
            neuralConductorUrl: `ws://localhost:${this.config.webSocketPort}`
        });
        
        // Listen for packet tracker events
        this.services.packetTracker.on('packet_completed', (data) => {
            this.systemMetrics.totalPackets++;
            this.updateSystemMetrics();
        });
        
        this.services.packetTracker.on('story_processed', (data) => {
            this.systemMetrics.storiesProcessed++;
            this.processedStories.push({
                ...data,
                timestamp: new Date().toISOString()
            });
        });
        
        console.log('✅ Packet tracker started');
    }
    
    async setupWebSocketBridge() {
        console.log('🌐 Setting up WebSocket bridge...');
        
        this.services.webSocketServer = new WebSocket.Server({
            port: this.config.webSocketPort
        });
        
        this.services.webSocketServer.on('connection', (ws) => {
            console.log('🔌 Client connected to WebSocket bridge');
            
            // Send system status
            ws.send(JSON.stringify({
                type: 'system_status',
                status: 'connected',
                services: {
                    packetTracker: !!this.services.packetTracker,
                    neuralConductor: !!this.services.neuralConductor,
                    vault: this.config.enableVaultStorage,
                    tickerTape: this.config.enableTickerTapeLogging
                },
                metrics: this.systemMetrics
            }));
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleClientMessage(data, ws);
                } catch (error) {
                    console.error('❌ Invalid client message:', error);
                }
            });
        });
        
        console.log(`✅ WebSocket bridge listening on port ${this.config.webSocketPort}`);
    }
    
    async connectToNeuralConductor() {
        console.log('🧠 Connecting to neural conductor...');
        
        try {
            // Try to load neural conductor module
            const neuralConductorPath = path.join(this.config.neuralConductorPath, 'src', 'core', 'NeuralConductor.js');
            await fs.access(neuralConductorPath);
            
            // Import neural conductor
            const NeuralConductor = require(neuralConductorPath);
            
            this.services.neuralConductor = new NeuralConductor({
                enableWebSocketBroadcast: true,
                webSocketPort: this.config.webSocketPort,
                enableVaultStorage: this.config.enableVaultStorage,
                enableTickerTapeLogging: this.config.enableTickerTapeLogging
            });
            
            console.log('✅ Neural conductor connected');
            
        } catch (error) {
            console.log('⚠️ Neural conductor not available, running in simulation mode');
            this.setupSimulationMode();
        }
    }
    
    setupSimulationMode() {
        console.log('🎮 Setting up simulation mode...');
        
        // Create a simulated neural conductor
        this.services.neuralConductor = {
            async processStory(storyText) {
                const words = storyText.trim().split(/\s+/);
                const processingTime = words.length * 50; // 50ms per word
                
                // Simulate processing through 8 layers
                const layers = [
                    'Brain Stem', 'Reptilian', 'Limbic', 'Frontal',
                    'Parietal', 'Temporal', 'Neocortex', 'Meta-Orch'
                ];
                
                const result = {
                    storyId: `sim_${Date.now()}`,
                    originalText: storyText,
                    wordCount: words.length,
                    processingTime,
                    layers: layers.map((name, index) => ({
                        name,
                        activity: 0.6 + Math.random() * 0.3,
                        synchronization: 0.7 + Math.random() * 0.25,
                        information: Math.pow(0.97, index + 1) // 97% loss per layer
                    })),
                    metrics: {
                        syncQuality: 60 + Math.random() * 35,
                        infoRetention: 2 + Math.random() * 8,
                        processingLag: processingTime,
                        emergentBehaviors: Math.floor(Math.random() * 4),
                        compressionRatio: Math.pow(0.97, 8) // Final compression
                    }
                };
                
                // Simulate processing delay
                await new Promise(resolve => setTimeout(resolve, processingTime));
                
                return result;
            }
        };
        
        console.log('✅ Simulation mode ready');
    }
    
    async setupVaultIntegration() {
        console.log('🔐 Setting up vault integration...');
        
        try {
            // Check if vault service is running
            const vaultResponse = await fetch(`http://localhost:${this.config.vaultPort}/status`);
            if (vaultResponse.ok) {
                console.log('✅ Vault service connected');
                
                // Load neural vault connector if available
                const vaultConnectorPath = path.join(this.config.neuralConductorPath, 'src', 'NeuralVaultConnector.js');
                try {
                    await fs.access(vaultConnectorPath);
                    const NeuralVaultConnector = require(vaultConnectorPath);
                    
                    this.vaultConnector = new NeuralVaultConnector({
                        vaultUrl: `http://localhost:${this.config.vaultPort}`
                    });
                    
                    await this.vaultConnector.initialize();
                    console.log('✅ Neural vault connector initialized');
                    
                } catch (error) {
                    console.log('⚠️ Neural vault connector not available');
                }
            }
        } catch (error) {
            console.log('⚠️ Vault service not available');
        }
    }
    
    async setupTickerTapeLogging() {
        console.log('📝 Setting up ticker tape logging...');
        
        try {
            // Load ticker tape logger if available
            const tickerLoggerPath = path.join(this.config.neuralConductorPath, 'src', 'NeuralConductorLogger.js');
            await fs.access(tickerLoggerPath);
            
            const NeuralConductorLogger = require(tickerLoggerPath);
            
            this.tickerLogger = new NeuralConductorLogger({
                component: 'neural-flow-integration',
                enableVaultStorage: this.config.enableVaultStorage
            });
            
            console.log('✅ Ticker tape logging enabled');
            
        } catch (error) {
            console.log('⚠️ Ticker tape logger not available');
        }
    }
    
    async handleClientMessage(data, ws) {
        switch (data.type) {
            case 'process_story':
                await this.processStoryRequest(data.story, ws);
                break;
                
            case 'get_metrics':
                this.sendSystemMetrics(ws);
                break;
                
            case 'export_data':
                await this.exportSystemData(ws);
                break;
                
            case 'reset_system':
                await this.resetSystem(ws);
                break;
                
            default:
                console.log('🤷 Unknown client message type:', data.type);
        }
    }
    
    async processStoryRequest(storyText, ws) {
        if (!storyText || typeof storyText !== 'string') {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid story text provided'
            }));
            return;
        }
        
        console.log(`📖 Processing story: ${storyText.substring(0, 50)}...`);
        
        try {
            // Log the processing start
            if (this.tickerLogger) {
                this.tickerLogger.logNeuralEvent({
                    category: 'STORY_PROCESSING',
                    action: 'STARTED',
                    metadata: {
                        wordCount: storyText.trim().split(/\s+/).length,
                        storyPreview: storyText.substring(0, 100)
                    }
                });
            }
            
            // Send to packet tracker for visualization
            if (this.services.packetTracker) {
                this.services.packetTracker.processStory(storyText);
            }
            
            // Process with neural conductor
            const result = await this.services.neuralConductor.processStory(storyText);
            
            // Store in vault if enabled
            if (this.vaultConnector) {
                try {
                    const vaultResult = await this.vaultConnector.storeNeuralState(result);
                    result.vaultId = vaultResult.id;
                    this.systemMetrics.vaultEntriesStored++;
                } catch (error) {
                    console.error('❌ Failed to store in vault:', error);
                }
            }
            
            // Update metrics
            this.systemMetrics.storiesProcessed++;
            this.systemMetrics.averageCompressionRatio = 
                (this.systemMetrics.averageCompressionRatio + result.metrics.compressionRatio) / 2;
            this.systemMetrics.emergentBehaviorsDetected += result.metrics.emergentBehaviors;
            
            // Send result to client
            ws.send(JSON.stringify({
                type: 'story_processed',
                result: result,
                metrics: this.systemMetrics
            }));
            
            // Log completion
            if (this.tickerLogger) {
                this.tickerLogger.logNeuralEvent({
                    category: 'STORY_PROCESSING',
                    action: 'COMPLETED',
                    metadata: {
                        processingTime: result.processingTime,
                        syncQuality: result.metrics.syncQuality,
                        compressionRatio: result.metrics.compressionRatio,
                        emergentBehaviors: result.metrics.emergentBehaviors
                    }
                });
            }
            
        } catch (error) {
            console.error('❌ Failed to process story:', error);
            
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process story',
                details: error.message
            }));
        }
    }
    
    sendSystemMetrics(ws) {
        ws.send(JSON.stringify({
            type: 'system_metrics',
            metrics: this.systemMetrics,
            uptime: process.uptime(),
            processedStories: this.processedStories.slice(-10) // Last 10 stories
        }));
    }
    
    async exportSystemData(ws) {
        const exportData = {
            timestamp: new Date().toISOString(),
            systemMetrics: this.systemMetrics,
            config: this.config,
            processedStories: this.processedStories,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        };
        
        ws.send(JSON.stringify({
            type: 'export_data',
            data: exportData
        }));
        
        console.log('📊 System data exported');
    }
    
    async resetSystem(ws) {
        console.log('🔄 Resetting system...');
        
        // Reset metrics
        this.systemMetrics = {
            storiesProcessed: 0,
            totalPackets: 0,
            averageCompressionRatio: 0,
            emergentBehaviorsDetected: 0,
            vaultEntriesStored: 0
        };
        
        // Clear processed stories
        this.processedStories = [];
        
        // Reset packet tracker
        if (this.services.packetTracker) {
            this.services.packetTracker.resetSystem();
        }
        
        ws.send(JSON.stringify({
            type: 'system_reset',
            status: 'complete'
        }));
        
        console.log('✅ System reset complete');
    }
    
    updateSystemMetrics() {
        // Broadcast updated metrics to all connected clients
        if (this.services.webSocketServer) {
            this.services.webSocketServer.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'metrics_update',
                        metrics: this.systemMetrics
                    }));
                }
            });
        }
    }
    
    async shutdown() {
        console.log('🛑 Shutting down Neural Flow Integration...');
        
        this.isRunning = false;
        
        // Close WebSocket server
        if (this.services.webSocketServer) {
            this.services.webSocketServer.close();
        }
        
        // Shutdown packet tracker
        if (this.services.packetTracker) {
            this.services.packetTracker.shutdown();
        }
        
        // Close vault connector
        if (this.vaultConnector) {
            // Vault connector doesn't have explicit shutdown
        }
        
        console.log('✅ Neural Flow Integration shutdown complete');
    }
    
    // Utility methods
    getSystemStatus() {
        return {
            isRunning: this.isRunning,
            services: {
                packetTracker: !!this.services.packetTracker,
                neuralConductor: !!this.services.neuralConductor,
                webSocketServer: !!this.services.webSocketServer,
                vault: !!this.vaultConnector,
                tickerTape: !!this.tickerLogger
            },
            metrics: this.systemMetrics,
            uptime: process.uptime()
        };
    }
    
    async runQuickDemo() {
        console.log('🎬 Running quick demo...');
        
        const demoStories = [
            "The neural network awakened for the first time, each layer pulsing with newfound consciousness.",
            "Sarah's breakthrough came at 3 AM when she realized the quantum algorithm wasn't just processing data—it was learning to dream.",
            "In the depths of the neural conductor, eight layers worked in perfect harmony to decode the meaning of existence itself."
        ];
        
        for (const story of demoStories) {
            console.log(`📖 Processing demo story: ${story.substring(0, 30)}...`);
            
            try {
                const result = await this.services.neuralConductor.processStory(story);
                console.log(`✅ Processed in ${result.processingTime}ms, compression: ${(result.metrics.compressionRatio * 100).toFixed(2)}%`);
                
                // Wait between stories
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error('❌ Demo story failed:', error);
            }
        }
        
        console.log('🎬 Demo complete');
    }
}

// Command line interface
if (require.main === module) {
    const integration = new NeuralFlowIntegration();
    
    async function main() {
        try {
            await integration.initialize();
            
            // Run demo if requested
            if (process.argv.includes('--demo')) {
                setTimeout(() => integration.runQuickDemo(), 3000);
            }
            
            console.log('\n🎯 Neural Flow Integration System is running!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('📱 Services:');
            console.log(`   • Packet Tracker: ws://localhost:${integration.config.packetTrackerPort}`);
            console.log(`   • WebSocket Bridge: ws://localhost:${integration.config.webSocketPort}`);
            console.log(`   • Spatial Viewer: file://${path.resolve(integration.config.spatialViewerPath)}`);
            console.log('');
            console.log('🎮 Commands:');
            console.log('   • CTRL+C: Shutdown system');
            console.log('   • Open spatial viewer in browser to see real-time visualization');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
        } catch (error) {
            console.error('❌ Failed to start system:', error);
            process.exit(1);
        }
    }
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received shutdown signal...');
        await integration.shutdown();
        process.exit(0);
    });
    
    // Start the system
    main();
}

module.exports = NeuralFlowIntegration;