/**
 * Story Packet Tracker - Real-time Flow Visualization Backend
 * 
 * This module tracks individual "story packets" as they flow through
 * the 8-layer neural conductor system, providing spatial coordinates
 * and flow visualization data for the frontend viewer.
 */

const EventEmitter = require('events');
const WebSocket = require('ws');

class StoryPacketTracker extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 8082,
            neuralConductorUrl: options.neuralConductorUrl || 'ws://localhost:8081',
            layers: 8,
            maxPackets: options.maxPackets || 1000,
            compressionRatio: options.compressionRatio || 0.97, // 97% information loss
            ...options
        };
        
        // Packet tracking
        this.packets = new Map();
        this.packetHistory = [];
        this.flowMetrics = {
            totalProcessed: 0,
            averageLatency: 0,
            compressionAchieved: 0,
            emergentPatterns: []
        };
        
        // Layer definitions matching neural conductor
        this.layers = [
            { id: 0, name: 'Brain Stem', symbol: '⚡', color: '#ff4444', type: 'hardware' },
            { id: 1, name: 'Reptilian', symbol: '🦕', color: '#ff8844', type: 'primitive' },
            { id: 2, name: 'Limbic', symbol: '❤️', color: '#ffff44', type: 'emotional' },
            { id: 3, name: 'Frontal', symbol: '🎯', color: '#44ff44', type: 'executive' },
            { id: 4, name: 'Parietal', symbol: '🔍', color: '#4444ff', type: 'pattern' },
            { id: 5, name: 'Temporal', symbol: '🕐', color: '#8844ff', type: 'memory' },
            { id: 6, name: 'Neocortex', symbol: '🧠', color: '#ff44ff', type: 'conscious' },
            { id: 7, name: 'Meta-Orch', symbol: '🎼', color: '#ffffff', type: 'conductor' }
        ];
        
        // Spatial positioning system
        this.spatialSystem = {
            width: 1200,
            height: 800,
            layerHeight: 100,
            flowSpeed: 2.0,
            timeScale: 1.0
        };
        
        this.init();
    }
    
    init() {
        this.setupWebSocketServer();
        this.connectToNeuralConductor();
        this.startFlowSimulation();
        
        console.log(`🎯 Story Packet Tracker initialized on port ${this.config.port}`);
    }
    
    setupWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.config.port });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 Frontend viewer connected');
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'init',
                layers: this.layers,
                spatial: this.spatialSystem,
                metrics: this.flowMetrics
            }));
            
            // Handle viewer commands
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleViewerCommand(data, ws);
                } catch (error) {
                    console.error('❌ Invalid viewer message:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('📤 Frontend viewer disconnected');
            });
        });
    }
    
    connectToNeuralConductor() {
        try {
            this.neuralWs = new WebSocket(this.config.neuralConductorUrl);
            
            this.neuralWs.on('open', () => {
                console.log('🧠 Connected to Neural Conductor');
            });
            
            this.neuralWs.on('message', (data) => {
                try {
                    const neuralData = JSON.parse(data);
                    this.processNeuralData(neuralData);
                } catch (error) {
                    console.error('❌ Invalid neural data:', error);
                }
            });
            
            this.neuralWs.on('error', (error) => {
                console.log('⚠️ Neural Conductor not available, running in simulation mode');
                this.startSimulationMode();
            });
            
        } catch (error) {
            console.log('⚠️ Neural Conductor not available, running in simulation mode');
            this.startSimulationMode();
        }
    }
    
    handleViewerCommand(data, ws) {
        switch (data.type) {
            case 'process_story':
                this.processStory(data.story);
                break;
                
            case 'speed_change':
                this.spatialSystem.timeScale = data.speed;
                break;
                
            case 'reset':
                this.resetSystem();
                break;
                
            case 'export_data':
                this.exportFlowData(ws);
                break;
                
            default:
                console.log('🤷 Unknown viewer command:', data.type);
        }
    }
    
    processStory(storyText) {
        if (!storyText || typeof storyText !== 'string') {
            console.error('❌ Invalid story text provided');
            return;
        }
        
        const words = storyText.trim().split(/\s+/).filter(w => w.length > 0);
        const storyId = `story_${Date.now()}`;
        
        console.log(`📖 Processing story: ${words.length} words`);
        
        // Create packets for story processing
        words.forEach((word, index) => {
            setTimeout(() => {
                this.createPacket({
                    storyId,
                    word,
                    index,
                    type: this.classifyWord(word),
                    startTime: Date.now()
                });
            }, index * 100); // Stagger packet creation
        });
        
        this.flowMetrics.totalProcessed++;
        this.broadcastToViewers({
            type: 'story_started',
            storyId,
            wordCount: words.length
        });
    }
    
    createPacket(data) {
        const packet = {
            id: `packet_${data.storyId}_${data.index}`,
            storyId: data.storyId,
            word: data.word,
            type: data.type,
            layer: 0,
            
            // Spatial coordinates
            x: 200, // Start position
            y: this.layers[0].id * this.spatialSystem.layerHeight + (this.spatialSystem.layerHeight / 2),
            z: 0,
            
            // Flow properties
            speed: 1.5 + Math.random() * 1.0,
            size: this.calculatePacketSize(data.word),
            opacity: 1.0,
            
            // Processing state
            startTime: data.startTime,
            currentLayer: 0,
            processed: false,
            compressionRatio: 1.0,
            
            // Metadata
            originalSize: data.word.length,
            transformations: [],
            emergentProperties: []
        };
        
        this.packets.set(packet.id, packet);
        
        this.broadcastToViewers({
            type: 'packet_created',
            packet: this.serializePacket(packet)
        });
        
        return packet;
    }
    
    classifyWord(word) {
        const classifications = {
            emotion: ['love', 'fear', 'joy', 'sad', 'angry', 'happy', 'excited', 'nervous', 'calm', 'worried'],
            action: ['run', 'jump', 'think', 'decide', 'choose', 'move', 'create', 'build', 'destroy', 'transform'],
            memory: ['remember', 'recall', 'forget', 'dream', 'imagine', 'past', 'history', 'yesterday', 'before'],
            pattern: ['pattern', 'structure', 'system', 'network', 'connection', 'relationship', 'sequence'],
            consciousness: ['aware', 'conscious', 'mind', 'thought', 'realize', 'understand', 'know', 'perceive'],
            data: [] // Default category
        };
        
        word = word.toLowerCase();
        
        for (const [type, keywords] of Object.entries(classifications)) {
            if (keywords.some(keyword => word.includes(keyword))) {
                return type;
            }
        }
        
        return 'data';
    }
    
    calculatePacketSize(word) {
        // Base size on word complexity and length
        const baseSize = Math.min(8, 2 + word.length * 0.5);
        const complexity = this.calculateWordComplexity(word);
        return baseSize * (0.5 + complexity);
    }
    
    calculateWordComplexity(word) {
        // Simple complexity metric based on unique characters and length
        const uniqueChars = new Set(word.toLowerCase().split('')).size;
        const lengthFactor = Math.min(1, word.length / 10);
        const charVariety = uniqueChars / word.length;
        
        return (lengthFactor + charVariety) / 2;
    }
    
    startFlowSimulation() {
        setInterval(() => {
            this.updatePacketFlow();
            this.detectEmergentPatterns();
            this.updateMetrics();
        }, 50); // 20 FPS update rate
    }
    
    updatePacketFlow() {
        const currentTime = Date.now();
        
        for (const [packetId, packet] of this.packets) {
            if (packet.processed) continue;
            
            // Move packet through layers
            this.movePacket(packet, currentTime);
            
            // Process packet at current layer
            if (this.shouldProcessAtLayer(packet)) {
                this.processPacketAtLayer(packet);
            }
            
            // Check if packet completed journey
            if (packet.layer >= this.layers.length - 1) {
                this.completePacket(packet);
            }
        }
        
        // Broadcast updates to viewers
        this.broadcastPacketUpdates();
    }
    
    movePacket(packet, currentTime) {
        const deltaTime = (currentTime - packet.startTime) * this.spatialSystem.timeScale;
        
        // Calculate target position based on processing time
        const progressThroughLayers = Math.min(7, deltaTime / 1000); // 1 second per layer
        const targetLayer = Math.floor(progressThroughLayers);
        
        // Update layer if changed
        if (targetLayer > packet.layer) {
            packet.layer = targetLayer;
            packet.currentLayer = targetLayer;
            
            // Update spatial coordinates
            packet.y = this.layers[targetLayer].id * this.spatialSystem.layerHeight + 
                      (this.spatialSystem.layerHeight / 2) +
                      (Math.random() - 0.5) * 20; // Add some jitter
        }
        
        // Move horizontally
        packet.x += packet.speed * this.spatialSystem.timeScale;
        
        // Apply compression effects
        if (packet.layer > 0) {
            packet.compressionRatio *= (1 - this.config.compressionRatio / this.layers.length);
            packet.size *= 0.99; // Gradual size reduction
            packet.opacity = Math.max(0.1, packet.opacity * 0.995);
        }
    }
    
    shouldProcessAtLayer(packet) {
        // Process packet when it reaches a new layer
        return packet.transformations.length <= packet.layer;
    }
    
    processPacketAtLayer(packet) {
        const layer = this.layers[packet.layer];
        
        // Apply layer-specific transformations
        const transformation = {
            layer: layer.name,
            type: layer.type,
            timestamp: Date.now(),
            effect: this.getLayerEffect(layer, packet)
        };
        
        packet.transformations.push(transformation);
        
        // Simulate information processing
        if (Math.random() < 0.1) { // 10% chance of emergent property
            packet.emergentProperties.push({
                layer: layer.name,
                property: this.generateEmergentProperty(packet, layer)
            });
        }
        
        this.broadcastToViewers({
            type: 'packet_processed',
            packetId: packet.id,
            layer: layer.name,
            transformation
        });
    }
    
    getLayerEffect(layer, packet) {
        const effects = {
            hardware: 'Signal amplified and cleaned',
            primitive: 'Basic threat/reward assessment',
            emotional: 'Emotional weight assigned',
            executive: 'Decision pathways evaluated',
            pattern: 'Patterns recognized and categorized',
            memory: 'Associated memories activated',
            conscious: 'Conscious awareness integrated',
            conductor: 'Meta-patterns orchestrated'
        };
        
        return effects[layer.type] || 'Information processed';
    }
    
    generateEmergentProperty(packet, layer) {
        const properties = [
            'Cross-layer resonance detected',
            'Pattern amplification observed',
            'Information crystallization',
            'Temporal prediction generated',
            'Chemical cascade triggered',
            'Meta-orchestration emerged',
            'Collective decision formed'
        ];
        
        return properties[Math.floor(Math.random() * properties.length)];
    }
    
    completePacket(packet) {
        packet.processed = true;
        packet.endTime = Date.now();
        packet.totalLatency = packet.endTime - packet.startTime;
        
        // Archive packet
        this.packetHistory.push({
            ...packet,
            finalCompressionRatio: packet.compressionRatio,
            transformationCount: packet.transformations.length,
            emergentCount: packet.emergentProperties.length
        });
        
        // Remove from active packets
        this.packets.delete(packet.id);
        
        this.broadcastToViewers({
            type: 'packet_completed',
            packetId: packet.id,
            summary: {
                latency: packet.totalLatency,
                compressionRatio: packet.compressionRatio,
                transformations: packet.transformations.length,
                emergentProperties: packet.emergentProperties.length
            }
        });
        
        console.log(`✅ Packet completed: ${packet.word} (${packet.totalLatency}ms, ${(packet.compressionRatio * 100).toFixed(1)}% retained)`);
    }
    
    detectEmergentPatterns() {
        // Analyze recent packets for emergent patterns
        const recentPackets = this.packetHistory.slice(-50);
        
        if (recentPackets.length >= 10) {
            const patterns = this.analyzePacketPatterns(recentPackets);
            
            if (patterns.length > 0) {
                this.flowMetrics.emergentPatterns = patterns;
                
                this.broadcastToViewers({
                    type: 'emergent_pattern',
                    patterns
                });
            }
        }
    }
    
    analyzePacketPatterns(packets) {
        const patterns = [];
        
        // Pattern 1: Synchronization waves
        const syncPackets = packets.filter(p => p.emergentCount > 0);
        if (syncPackets.length >= 3) {
            patterns.push({
                type: 'synchronization_wave',
                strength: syncPackets.length / packets.length,
                description: 'Multiple packets showing emergent properties simultaneously'
            });
        }
        
        // Pattern 2: Compression efficiency
        const avgCompression = packets.reduce((sum, p) => sum + p.finalCompressionRatio, 0) / packets.length;
        if (avgCompression < 0.05) { // Better than 95% compression
            patterns.push({
                type: 'optimal_compression',
                strength: 1 - avgCompression,
                description: 'Achieving optimal information compression'
            });
        }
        
        // Pattern 3: Processing acceleration
        const latencies = packets.map(p => p.totalLatency);
        const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
        if (avgLatency < 500) { // Less than 500ms average
            patterns.push({
                type: 'accelerated_processing',
                strength: (1000 - avgLatency) / 1000,
                description: 'Processing speed increasing'
            });
        }
        
        return patterns;
    }
    
    updateMetrics() {
        if (this.packetHistory.length > 0) {
            // Calculate average latency
            const recentPackets = this.packetHistory.slice(-20);
            this.flowMetrics.averageLatency = recentPackets.reduce((sum, p) => sum + p.totalLatency, 0) / recentPackets.length;
            
            // Calculate compression achieved
            this.flowMetrics.compressionAchieved = 1 - (recentPackets.reduce((sum, p) => sum + p.finalCompressionRatio, 0) / recentPackets.length);
        }
        
        // Broadcast updated metrics
        this.broadcastToViewers({
            type: 'metrics_update',
            metrics: this.flowMetrics,
            activePackets: this.packets.size
        });
    }
    
    processNeuralData(neuralData) {
        // Process incoming data from neural conductor
        if (neuralData.type === 'neural-state') {
            // Update our simulation based on real neural conductor data
            console.log('🧠 Received neural state update');
            
            this.broadcastToViewers({
                type: 'neural_update',
                data: neuralData
            });
        }
    }
    
    startSimulationMode() {
        console.log('🎮 Starting simulation mode');
        
        // Generate simulated neural data
        setInterval(() => {
            const simulatedData = {
                type: 'neural-state',
                timestamp: Date.now(),
                metrics: {
                    syncQuality: 60 + Math.random() * 35,
                    infoRetention: 2 + Math.random() * 8,
                    processingLag: 100 + Math.random() * 300,
                    emergentBehaviors: Math.floor(Math.random() * 4)
                }
            };
            
            this.broadcastToViewers({
                type: 'neural_update',
                data: simulatedData
            });
        }, 2000);
    }
    
    serializePacket(packet) {
        // Create a lightweight version for transmission
        return {
            id: packet.id,
            word: packet.word,
            type: packet.type,
            x: Math.round(packet.x),
            y: Math.round(packet.y),
            layer: packet.layer,
            size: Math.round(packet.size * 10) / 10,
            opacity: Math.round(packet.opacity * 100) / 100,
            compressionRatio: Math.round(packet.compressionRatio * 1000) / 1000
        };
    }
    
    broadcastPacketUpdates() {
        if (this.packets.size === 0) return;
        
        const packetData = Array.from(this.packets.values()).map(p => this.serializePacket(p));
        
        this.broadcastToViewers({
            type: 'packets_update',
            packets: packetData
        });
    }
    
    broadcastToViewers(data) {
        if (this.wss) {
            this.wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(data));
                }
            });
        }
    }
    
    resetSystem() {
        this.packets.clear();
        this.packetHistory = [];
        this.flowMetrics = {
            totalProcessed: 0,
            averageLatency: 0,
            compressionAchieved: 0,
            emergentPatterns: []
        };
        
        this.broadcastToViewers({
            type: 'system_reset'
        });
        
        console.log('🔄 System reset');
    }
    
    exportFlowData(ws) {
        const exportData = {
            timestamp: new Date().toISOString(),
            config: this.config,
            metrics: this.flowMetrics,
            activePackets: this.packets.size,
            historyCount: this.packetHistory.length,
            recentHistory: this.packetHistory.slice(-100),
            layers: this.layers,
            spatialSystem: this.spatialSystem
        };
        
        ws.send(JSON.stringify({
            type: 'export_data',
            data: exportData
        }));
        
        console.log('📊 Flow data exported');
    }
    
    shutdown() {
        if (this.wss) {
            this.wss.close();
        }
        
        if (this.neuralWs) {
            this.neuralWs.close();
        }
        
        console.log('🛑 Story Packet Tracker shutdown');
    }
}

// Command line interface
if (require.main === module) {
    const tracker = new StoryPacketTracker({
        port: process.env.PACKET_TRACKER_PORT || 8082,
        neuralConductorUrl: process.env.NEURAL_CONDUCTOR_URL || 'ws://localhost:8081'
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Story Packet Tracker...');
        tracker.shutdown();
        process.exit(0);
    });
    
    // Test story processing
    setTimeout(() => {
        tracker.processStory("The neural network awakened for the first time, each layer pulsing with newfound consciousness.");
    }, 2000);
}

module.exports = StoryPacketTracker;