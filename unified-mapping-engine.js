// 🗺️ UNIFIED MAPPING ENGINE WITH GAMING VISUALIZATION
// ==================================================
// Maps trust system, AI reasoning, and bot swarms in real-time game format

const WebSocket = require('ws');
const EventEmitter = require('events');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

class UnifiedMappingEngine extends EventEmitter {
    constructor() {
        super();
        
        // Core components
        this.trustSystem = null;
        this.reasoningEngine = new ReasoningEngine();
        this.botSwarm = new BotSwarmManager();
        this.gameWorld = new GameWorldMap();
        this.verificationLayers = new Map();
        
        // Real-time connections
        this.connections = new Map();
        this.wsServer = null;
        
        // State tracking
        this.worldState = {
            entities: new Map(),
            trustNodes: new Map(),
            reasoningThreads: new Map(),
            verificationPaths: new Map(),
            swarmActivity: new Map()
        };
        
        this.initializeEngine();
    }
    
    initializeEngine() {
        console.log('🗺️ Initializing Unified Mapping Engine...');
        
        // Create WebSocket server for real-time updates
        this.wsServer = new WebSocket.Server({ port: 7777 });
        
        this.wsServer.on('connection', (ws) => {
            console.log('🎮 Game client connected');
            const clientId = crypto.randomBytes(16).toString('hex');
            this.connections.set(clientId, ws);
            
            // Send initial world state
            ws.send(JSON.stringify({
                type: 'world_init',
                data: this.getWorldSnapshot()
            }));
            
            ws.on('message', (message) => {
                this.handleClientMessage(clientId, message);
            });
            
            ws.on('close', () => {
                this.connections.delete(clientId);
            });
        });
        
        // Start the mapping loops
        this.startMappingCycles();
    }
    
    // Map trust verification to game entities
    mapTrustToGameWorld(trustData) {
        console.log('🔐 Mapping trust data to game world...');
        
        const trustEntity = {
            id: trustData.sessionId,
            type: 'trust_node',
            position: this.calculateTrustPosition(trustData),
            visual: {
                shape: 'hexagon',
                color: this.getTrustColor(trustData.trustLevel),
                size: 20 + (trustData.trustLevel * 30),
                glow: true,
                pulseRate: 2 - trustData.trustLevel
            },
            data: {
                trustLevel: trustData.trustLevel,
                timestamp: trustData.timestamp,
                layers: trustData.verificationLayers || []
            },
            connections: []
        };
        
        // Add to world
        this.worldState.trustNodes.set(trustEntity.id, trustEntity);
        
        // Create reasoning about this trust node
        this.reasoningEngine.reasonAbout(trustEntity, 'trust_establishment', {
            why: 'New trust connection established between human and AI',
            whatItsGoodFor: [
                'Enables secure communication',
                'Provides cryptographic proof of interaction',
                'Creates verifiable audit trail',
                'Allows for anonymous yet trusted exchange'
            ],
            implications: this.analyzeTrustImplications(trustData)
        });
        
        // Spawn verification bots
        this.spawnVerificationBots(trustEntity);
        
        // Broadcast update
        this.broadcastWorldUpdate({
            type: 'trust_mapped',
            entity: trustEntity
        });
        
        return trustEntity;
    }
    
    // Calculate position in game world based on trust properties
    calculateTrustPosition(trustData) {
        // Map trust properties to 3D coordinates
        const x = (trustData.trustLevel * 500) - 250;
        const y = Math.sin(Date.now() * 0.001) * 100;
        const z = (trustData.zkProof ? 100 : 0) + 
                  (trustData.nlpScore ? trustData.nlpScore * 50 : 0);
        
        return { x, y, z };
    }
    
    // Get color based on trust level
    getTrustColor(trustLevel) {
        if (trustLevel >= 0.9) return '#00ff88'; // Bright green
        if (trustLevel >= 0.7) return '#88ff00'; // Yellow-green
        if (trustLevel >= 0.5) return '#ffff00'; // Yellow
        if (trustLevel >= 0.3) return '#ff8800'; // Orange
        return '#ff0000'; // Red
    }
    
    // Spawn verification bots for a trust entity
    spawnVerificationBots(trustEntity) {
        console.log('🤖 Spawning verification bots...');
        
        const botTypes = [
            { type: 'zkp_verifier', symbol: '🔐', task: 'Verify zero-knowledge proofs' },
            { type: 'nlp_analyzer', symbol: '📝', task: 'Analyze natural language' },
            { type: 'qr_scanner', symbol: '📱', task: 'Scan QR codes' },
            { type: 'temporal_validator', symbol: '⏰', task: 'Validate temporal chains' }
        ];
        
        botTypes.forEach((botType, index) => {
            const bot = this.botSwarm.spawnBot({
                id: `${trustEntity.id}-${botType.type}`,
                type: botType.type,
                symbol: botType.symbol,
                task: botType.task,
                position: {
                    x: trustEntity.position.x + Math.cos(index * Math.PI / 2) * 50,
                    y: trustEntity.position.y + Math.sin(index * Math.PI / 2) * 50,
                    z: trustEntity.position.z
                },
                target: trustEntity.id,
                behavior: this.createBotBehavior(botType.type)
            });
            
            // Add connection between bot and trust node
            trustEntity.connections.push(bot.id);
        });
    }
    
    // Create bot behavior based on type
    createBotBehavior(botType) {
        const behaviors = {
            zkp_verifier: {
                patrol: true,
                scanRadius: 100,
                action: async (target) => {
                    const proof = await this.verifyZeroKnowledgeProof(target);
                    return {
                        verified: proof.valid,
                        confidence: proof.confidence,
                        details: proof.details
                    };
                }
            },
            nlp_analyzer: {
                analyze: true,
                sampleRate: 1000,
                action: async (target) => {
                    const analysis = await this.analyzeNaturalLanguage(target);
                    return {
                        sentiment: analysis.sentiment,
                        keywords: analysis.keywords,
                        trustPhrases: analysis.trustPhrases
                    };
                }
            },
            qr_scanner: {
                scan: true,
                range: 150,
                action: async (target) => {
                    const qrData = await this.scanQRCode(target);
                    return {
                        decoded: qrData.content,
                        trustId: qrData.trustId,
                        valid: qrData.valid
                    };
                }
            },
            temporal_validator: {
                validate: true,
                chainLength: 12,
                action: async (target) => {
                    const chain = await this.validateTemporalChain(target);
                    return {
                        chainValid: chain.valid,
                        blocks: chain.blocks,
                        integrity: chain.integrity
                    };
                }
            }
        };
        
        return behaviors[botType] || { idle: true };
    }
    
    // Analyze implications of trust establishment
    analyzeTrustImplications(trustData) {
        return {
            security: {
                level: trustData.trustLevel > 0.8 ? 'high' : 'medium',
                features: [
                    'End-to-end encryption enabled',
                    'Anonymous identity preserved',
                    'Cryptographic non-repudiation'
                ]
            },
            capabilities: {
                enabled: [
                    'Secure message exchange',
                    'Verified computation requests',
                    'Trusted data sharing',
                    'Collaborative reasoning'
                ],
                restricted: trustData.trustLevel < 0.5 ? [
                    'System-level access',
                    'Sensitive data operations'
                ] : []
            },
            network: {
                effect: 'Strengthens overall trust network',
                connections: this.worldState.trustNodes.size,
                trustDensity: this.calculateTrustDensity()
            }
        };
    }
    
    // Calculate trust density in the network
    calculateTrustDensity() {
        let totalTrust = 0;
        let connections = 0;
        
        this.worldState.trustNodes.forEach(node => {
            totalTrust += node.data.trustLevel;
            connections += node.connections.length;
        });
        
        return {
            averageTrust: totalTrust / Math.max(this.worldState.trustNodes.size, 1),
            connectionDensity: connections / Math.max(this.worldState.trustNodes.size, 1),
            networkHealth: totalTrust > 0.7 ? 'healthy' : 'needs-improvement'
        };
    }
    
    // Handle messages from game clients
    handleClientMessage(clientId, message) {
        try {
            const msg = JSON.parse(message);
            
            switch (msg.type) {
                case 'request_reasoning':
                    this.sendReasoningStream(clientId, msg.entityId);
                    break;
                    
                case 'spawn_verification':
                    this.handleVerificationRequest(clientId, msg.data);
                    break;
                    
                case 'query_swarm':
                    this.sendSwarmStatus(clientId);
                    break;
                    
                case 'map_view_change':
                    this.updateClientView(clientId, msg.view);
                    break;
                    
                default:
                    console.log('Unknown message type:', msg.type);
            }
        } catch (err) {
            console.error('Error handling client message:', err);
        }
    }
    
    // Send reasoning stream for an entity
    sendReasoningStream(clientId, entityId) {
        const reasoningThread = this.reasoningEngine.getReasoningThread(entityId);
        const ws = this.connections.get(clientId);
        
        if (ws && reasoningThread) {
            ws.send(JSON.stringify({
                type: 'reasoning_stream',
                entityId: entityId,
                reasoning: reasoningThread
            }));
        }
    }
    
    // Get world snapshot
    getWorldSnapshot() {
        return {
            timestamp: Date.now(),
            entities: Array.from(this.worldState.entities.values()),
            trustNodes: Array.from(this.worldState.trustNodes.values()),
            swarmBots: this.botSwarm.getAllBots(),
            verificationPaths: Array.from(this.worldState.verificationPaths.values()),
            reasoning: this.reasoningEngine.getActiveThreads(),
            metrics: {
                totalEntities: this.worldState.entities.size,
                activeTrust: this.worldState.trustNodes.size,
                swarmSize: this.botSwarm.getBotCount(),
                reasoningThreads: this.reasoningEngine.getThreadCount()
            }
        };
    }
    
    // Broadcast world update to all clients
    broadcastWorldUpdate(update) {
        const message = JSON.stringify({
            type: 'world_update',
            timestamp: Date.now(),
            update: update
        });
        
        this.connections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
    
    // Start mapping cycles
    startMappingCycles() {
        // Trust verification cycle
        setInterval(() => {
            this.worldState.trustNodes.forEach(node => {
                this.updateTrustNode(node);
            });
        }, 1000);
        
        // Bot swarm update cycle
        setInterval(() => {
            this.botSwarm.updateAllBots(this.worldState);
        }, 100);
        
        // Reasoning engine cycle
        setInterval(() => {
            this.reasoningEngine.processReasoningQueue();
        }, 500);
        
        // Verification path tracing
        setInterval(() => {
            this.traceVerificationPaths();
        }, 2000);
    }
    
    // Update trust node
    updateTrustNode(node) {
        // Animate position slightly
        node.position.y = Math.sin(Date.now() * 0.001 + node.position.x) * 10;
        
        // Update visual properties based on age
        const age = Date.now() - node.data.timestamp;
        node.visual.glow = age < 5000; // Glow for 5 seconds
        
        // Check if verification is complete
        if (node.data.layers.length >= 4) {
            node.visual.shape = 'star';
            node.visual.color = '#ffffff';
        }
    }
    
    // Trace verification paths between entities
    traceVerificationPaths() {
        this.worldState.trustNodes.forEach((node1, id1) => {
            this.worldState.trustNodes.forEach((node2, id2) => {
                if (id1 !== id2 && this.areNodesConnected(node1, node2)) {
                    const path = {
                        id: `${id1}-${id2}`,
                        start: node1.position,
                        end: node2.position,
                        strength: (node1.data.trustLevel + node2.data.trustLevel) / 2,
                        particles: this.generatePathParticles(node1, node2)
                    };
                    
                    this.worldState.verificationPaths.set(path.id, path);
                }
            });
        });
    }
    
    // Check if nodes are connected
    areNodesConnected(node1, node2) {
        // Nodes are connected if they share verification layers
        const layers1 = new Set(node1.data.layers);
        const layers2 = new Set(node2.data.layers);
        
        for (let layer of layers1) {
            if (layers2.has(layer)) return true;
        }
        
        return false;
    }
    
    // Generate particles for path visualization
    generatePathParticles(node1, node2) {
        const particles = [];
        const particleCount = Math.floor((node1.data.trustLevel + node2.data.trustLevel) * 5);
        
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                position: i / particleCount,
                speed: 0.01 + Math.random() * 0.02,
                size: 2 + Math.random() * 3,
                color: this.getTrustColor((node1.data.trustLevel + node2.data.trustLevel) / 2)
            });
        }
        
        return particles;
    }
}

// Reasoning Engine
class ReasoningEngine {
    constructor() {
        this.reasoningThreads = new Map();
        this.reasoningQueue = [];
        this.templates = {
            trust_establishment: [
                "Establishing trust creates a cryptographic bond that enables ${capabilities}",
                "This verification provides ${security} while maintaining ${privacy}",
                "The ${layers} layers ensure ${integrity} across all interactions"
            ],
            verification_success: [
                "All ${count} verification layers passed, creating an unbreakable chain of trust",
                "The system verified ${checks} ensuring ${reliability} for future operations",
                "Success rate of ${rate}% indicates ${health} of the trust network"
            ],
            bot_activity: [
                "Bot ${id} is ${action} to ensure ${purpose}",
                "Swarm intelligence detected ${pattern} indicating ${conclusion}",
                "Collective behavior shows ${trend} which benefits ${outcome}"
            ]
        };
    }
    
    reasonAbout(entity, context, details) {
        const threadId = `${entity.id}-${Date.now()}`;
        
        const reasoning = {
            id: threadId,
            entityId: entity.id,
            context: context,
            timestamp: Date.now(),
            thoughts: [],
            conclusions: [],
            visualizations: []
        };
        
        // Generate reasoning based on context
        switch (context) {
            case 'trust_establishment':
                reasoning.thoughts.push(
                    `New trust node established with level ${entity.data.trustLevel}`,
                    `Position in trust network: (${entity.position.x.toFixed(2)}, ${entity.position.y.toFixed(2)}, ${entity.position.z.toFixed(2)})`,
                    details.why
                );
                
                reasoning.conclusions = details.whatItsGoodFor;
                
                reasoning.visualizations.push({
                    type: 'trust_web',
                    data: {
                        node: entity,
                        connections: entity.connections,
                        implications: details.implications
                    }
                });
                break;
                
            case 'verification_complete':
                reasoning.thoughts.push(
                    `Verification completed for entity ${entity.id}`,
                    `All ${details.layerCount} layers verified successfully`,
                    `Trust level achieved: ${details.finalTrustLevel}`
                );
                
                reasoning.conclusions.push(
                    'System can now proceed with trusted operations',
                    'Cryptographic proof stored for audit trail',
                    'Entity added to trusted network graph'
                );
                break;
        }
        
        this.reasoningThreads.set(threadId, reasoning);
        this.reasoningQueue.push(threadId);
        
        return reasoning;
    }
    
    getReasoningThread(entityId) {
        for (let [id, thread] of this.reasoningThreads) {
            if (thread.entityId === entityId) {
                return thread;
            }
        }
        return null;
    }
    
    getActiveThreads() {
        return Array.from(this.reasoningThreads.values())
            .filter(thread => Date.now() - thread.timestamp < 60000); // Active in last minute
    }
    
    getThreadCount() {
        return this.reasoningThreads.size;
    }
    
    processReasoningQueue() {
        // Process reasoning and generate new insights
        while (this.reasoningQueue.length > 0) {
            const threadId = this.reasoningQueue.shift();
            const thread = this.reasoningThreads.get(threadId);
            
            if (thread) {
                // Evolve reasoning over time
                this.evolveReasoning(thread);
            }
        }
    }
    
    evolveReasoning(thread) {
        // Add new thoughts based on time and context
        const age = Date.now() - thread.timestamp;
        
        if (age > 5000 && thread.thoughts.length < 10) {
            thread.thoughts.push(
                `After ${(age / 1000).toFixed(1)} seconds, the ${thread.context} remains stable`,
                `Network effects are propagating to connected nodes`
            );
        }
        
        if (age > 10000 && !thread.evolved) {
            thread.conclusions.push(
                'Long-term stability achieved',
                'Ready for advanced operations'
            );
            thread.evolved = true;
        }
    }
}

// Bot Swarm Manager
class BotSwarmManager {
    constructor() {
        this.bots = new Map();
        this.swarmBehaviors = {
            patrol: this.patrolBehavior,
            verify: this.verifyBehavior,
            analyze: this.analyzeBehavior,
            protect: this.protectBehavior
        };
    }
    
    spawnBot(config) {
        const bot = {
            id: config.id,
            type: config.type,
            symbol: config.symbol,
            position: config.position,
            velocity: { x: 0, y: 0, z: 0 },
            task: config.task,
            target: config.target,
            behavior: config.behavior,
            state: 'idle',
            health: 100,
            energy: 100,
            memory: [],
            visual: {
                size: 10,
                color: '#00ffff',
                trail: true
            }
        };
        
        this.bots.set(bot.id, bot);
        console.log(`🤖 Spawned ${bot.type} bot: ${bot.id}`);
        
        return bot;
    }
    
    updateAllBots(worldState) {
        this.bots.forEach(bot => {
            this.updateBot(bot, worldState);
        });
    }
    
    updateBot(bot, worldState) {
        // Update bot position based on behavior
        if (bot.behavior.patrol) {
            this.patrolBehavior(bot, worldState);
        } else if (bot.behavior.analyze) {
            this.analyzeBehavior(bot, worldState);
        } else if (bot.behavior.scan) {
            this.scanBehavior(bot, worldState);
        } else if (bot.behavior.validate) {
            this.validateBehavior(bot, worldState);
        }
        
        // Update visual state
        this.updateBotVisual(bot);
        
        // Execute actions
        if (bot.state === 'active' && bot.behavior.action) {
            this.executeBotAction(bot, worldState);
        }
    }
    
    patrolBehavior(bot, worldState) {
        // Orbit around target
        const target = worldState.trustNodes.get(bot.target);
        if (target) {
            const angle = Date.now() * 0.001 * (bot.id.charCodeAt(0) % 5 + 1);
            const radius = bot.behavior.scanRadius || 100;
            
            bot.position.x = target.position.x + Math.cos(angle) * radius;
            bot.position.y = target.position.y + Math.sin(angle) * radius;
            bot.position.z = target.position.z + Math.sin(angle * 2) * 20;
            
            bot.state = 'patrolling';
        }
    }
    
    analyzeBehavior(bot, worldState) {
        // Move between nodes analyzing
        const nodes = Array.from(worldState.trustNodes.values());
        if (nodes.length > 0) {
            const targetNode = nodes[Math.floor(Date.now() / 5000) % nodes.length];
            
            // Move towards target
            const dx = targetNode.position.x - bot.position.x;
            const dy = targetNode.position.y - bot.position.y;
            const dz = targetNode.position.z - bot.position.z;
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            
            if (distance > 10) {
                bot.velocity.x = (dx / distance) * 2;
                bot.velocity.y = (dy / distance) * 2;
                bot.velocity.z = (dz / distance) * 2;
                
                bot.position.x += bot.velocity.x;
                bot.position.y += bot.velocity.y;
                bot.position.z += bot.velocity.z;
                
                bot.state = 'analyzing';
            } else {
                bot.state = 'active';
                bot.target = targetNode.id;
            }
        }
    }
    
    scanBehavior(bot, worldState) {
        // Scan in expanding circles
        const range = bot.behavior.range || 150;
        const scanSpeed = 0.005;
        const time = Date.now() * scanSpeed;
        
        bot.position.x += Math.cos(time) * range;
        bot.position.y += Math.sin(time) * range;
        bot.position.z = 50 + Math.sin(time * 2) * 25;
        
        bot.state = 'scanning';
        
        // Check for nearby entities
        worldState.trustNodes.forEach(node => {
            const distance = this.getDistance(bot.position, node.position);
            if (distance < range / 2) {
                bot.state = 'active';
                bot.target = node.id;
            }
        });
    }
    
    validateBehavior(bot, worldState) {
        // Move along verification paths
        const paths = Array.from(worldState.verificationPaths.values());
        if (paths.length > 0) {
            const path = paths[Math.floor(Date.now() / 3000) % paths.length];
            const progress = (Date.now() % 3000) / 3000;
            
            bot.position.x = path.start.x + (path.end.x - path.start.x) * progress;
            bot.position.y = path.start.y + (path.end.y - path.start.y) * progress;
            bot.position.z = path.start.z + (path.end.z - path.start.z) * progress;
            
            bot.state = 'validating';
        }
    }
    
    updateBotVisual(bot) {
        // Update visual properties based on state
        switch (bot.state) {
            case 'idle':
                bot.visual.color = '#666666';
                break;
            case 'active':
                bot.visual.color = '#00ff00';
                bot.visual.size = 15;
                break;
            case 'patrolling':
                bot.visual.color = '#00ffff';
                break;
            case 'analyzing':
                bot.visual.color = '#ff00ff';
                break;
            case 'scanning':
                bot.visual.color = '#ffff00';
                break;
            case 'validating':
                bot.visual.color = '#ff8800';
                break;
        }
        
        // Pulse effect
        bot.visual.size = 10 + Math.sin(Date.now() * 0.01) * 2;
    }
    
    executeBotAction(bot, worldState) {
        if (bot.behavior.action && bot.target) {
            const target = worldState.trustNodes.get(bot.target) || 
                          worldState.entities.get(bot.target);
            
            if (target) {
                bot.behavior.action(target).then(result => {
                    bot.memory.push({
                        timestamp: Date.now(),
                        action: bot.task,
                        target: bot.target,
                        result: result
                    });
                    
                    // Reset to patrol after action
                    bot.state = 'idle';
                });
            }
        }
    }
    
    getDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }
    
    getAllBots() {
        return Array.from(this.bots.values());
    }
    
    getBotCount() {
        return this.bots.size;
    }
}

// Game World Map
class GameWorldMap {
    constructor() {
        this.bounds = {
            x: { min: -1000, max: 1000 },
            y: { min: -1000, max: 1000 },
            z: { min: -100, max: 500 }
        };
        
        this.regions = {
            trustCore: { center: { x: 0, y: 0, z: 0 }, radius: 300 },
            verificationZone: { center: { x: 500, y: 0, z: 100 }, radius: 200 },
            reasoningNexus: { center: { x: -500, y: 0, z: 200 }, radius: 250 },
            swarmHive: { center: { x: 0, y: 500, z: 50 }, radius: 150 }
        };
        
        this.landmarks = [
            { name: 'Trust Beacon', position: { x: 0, y: 0, z: 300 }, type: 'beacon' },
            { name: 'Verification Gateway', position: { x: 500, y: 0, z: 150 }, type: 'gateway' },
            { name: 'Reasoning Spire', position: { x: -500, y: 0, z: 400 }, type: 'spire' },
            { name: 'Swarm Nexus', position: { x: 0, y: 500, z: 100 }, type: 'nexus' }
        ];
    }
    
    getRegionForPosition(position) {
        for (let [name, region] of Object.entries(this.regions)) {
            const distance = this.getDistance(position, region.center);
            if (distance <= region.radius) {
                return name;
            }
        }
        return 'frontier';
    }
    
    getDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }
}

// Export the engine
module.exports = UnifiedMappingEngine;

// Start the engine if run directly
if (require.main === module) {
    const engine = new UnifiedMappingEngine();
    
    console.log('🎮 Unified Mapping Engine started!');
    console.log('📡 WebSocket server running on ws://localhost:7777');
    console.log('🗺️ Game world initialized with regions and landmarks');
    console.log('🤖 Bot swarm manager active');
    console.log('🧠 Reasoning engine online');
    
    // Connect to trust system if available
    const http = require('http');
    
    setInterval(() => {
        // Poll trust system for new handshakes
        http.get('http://localhost:6666/trust-status', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const status = JSON.parse(data);
                    if (status.recentHandshakes) {
                        status.recentHandshakes.forEach(handshake => {
                            // Map each handshake to the game world
                            engine.mapTrustToGameWorld({
                                sessionId: handshake.id,
                                trustLevel: handshake.trust_level,
                                timestamp: new Date(handshake.timestamp).getTime(),
                                verificationLayers: ['zkp', 'nlp', 'qr', 'temporal']
                            });
                        });
                    }
                } catch (err) {
                    console.error('Error processing trust data:', err);
                }
            });
        }).on('error', err => {
            console.log('Trust system not available:', err.message);
        });
    }, 5000);
}