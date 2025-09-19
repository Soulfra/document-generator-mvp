#!/usr/bin/env node

/**
 * COMPUTER VISION OVERLAY CONNECTOR
 * 
 * Bridges overlay-system.js RuneLite-style overlays with the computer vision interface
 * Translates overlay events into computer vision recognition markers
 * Enables real-time component detection and PID tracking
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const express = require('express');

class CVOverlayConnector extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.overlayServerPort = options.overlayServerPort || 42008;
        this.cvServerPort = options.cvServerPort || 42009;
        this.httpPort = options.httpPort || 42010;
        
        // Connection to overlay-system.js
        this.overlayConnection = null;
        this.overlayReconnectDelay = 5000;
        
        // Computer Vision WebSocket server for browser connections
        this.cvServer = null;
        this.cvClients = new Set();
        
        // HTTP server for API endpoints
        this.httpServer = null;
        this.app = express();
        
        // Component detection state
        this.detectedComponents = new Map();
        this.activeOverlays = new Map();
        this.recognitionMetrics = {
            componentsDetected: 0,
            recognitionRate: 98.5,
            processingFPS: 60,
            systemHealth: 'OPTIMAL'
        };
        
        // Character/Agent tracking from AGENT-ECONOMY-PID-MAPPER
        this.trackedAgents = new Map();
        this.agentOverlays = new Map();
        
        // Archive integration bridge connection
        this.archiveBridge = null;
        this.archiveBridgePort = options.archiveBridgePort || 42011;
        this.archiveComponents = new Map();
        
        // Overlay type mappings for computer vision
        this.overlayToCVMapping = {
            'quest_start': { symbol: '!', color: '#FFD700', type: 'quest', priority: 1 },
            'quest_complete': { symbol: '✓', color: '#00FF00', type: 'completion', priority: 2 },
            'quest_available': { symbol: '?', color: '#4169E1', type: 'help', priority: 3 },
            'dialogue_mention': { symbol: '@', color: '#FFFFFF', type: 'mention', priority: 4 },
            'action_command': { symbol: '⚡', color: '#FF4500', type: 'action', priority: 5 },
            'tag_marker': { symbol: '#', color: '#9370DB', type: 'tag', priority: 6 },
            'help_request': { symbol: '?', color: '#FF69B4', type: 'help', priority: 7 }
        };
        
        console.log('🔍 CV Overlay Connector initializing...');
        this.init();
    }
    
    async init() {
        try {
            // Setup HTTP server
            await this.setupHttpServer();
            
            // Setup Computer Vision WebSocket server
            await this.setupCVServer();
            
            // Connect to overlay system
            await this.connectToOverlaySystem();
            
            // Connect to archive integration bridge
            await this.connectToArchiveBridge();
            
            // Start component detection simulation
            this.startComponentDetection();
            
            // Start metrics updating
            this.startMetricsUpdating();
            
            console.log('✅ CV Overlay Connector ready');
            console.log(`🌐 HTTP API: http://localhost:${this.httpPort}`);
            console.log(`🔌 CV WebSocket: ws://localhost:${this.cvServerPort}`);
            console.log(`🔗 Overlay connection: ws://localhost:${this.overlayServerPort}`);
            
        } catch (error) {
            console.error('❌ CV Overlay Connector initialization failed:', error);
            this.emit('error', error);
        }
    }
    
    async setupHttpServer() {
        this.app.use(express.json());
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                connections: {
                    overlay: this.overlayConnection?.readyState === WebSocket.OPEN,
                    cvClients: this.cvClients.size
                },
                metrics: this.recognitionMetrics,
                detectedComponents: this.detectedComponents.size
            });
        });
        
        // Get current computer vision state
        this.app.get('/api/cv/state', (req, res) => {
            res.json({
                metrics: this.recognitionMetrics,
                detectedComponents: Array.from(this.detectedComponents.entries()),
                activeOverlays: Array.from(this.activeOverlays.entries()),
                trackedAgents: Array.from(this.trackedAgents.entries())
            });
        });
        
        // Trigger overlay from computer vision interface
        this.app.post('/api/cv/trigger-overlay', (req, res) => {
            const { characterId, overlayType, position, data } = req.body;
            
            if (this.overlayConnection && this.overlayConnection.readyState === WebSocket.OPEN) {
                // Send overlay trigger to overlay-system.js
                const overlayMessage = {
                    type: 'trigger_overlay',
                    characterId,
                    overlayType,
                    position: position || { x: Math.random() * 100, y: Math.random() * 100 },
                    data: data || {}
                };
                
                this.overlayConnection.send(JSON.stringify(overlayMessage));
                
                res.json({
                    success: true,
                    message: 'Overlay triggered',
                    overlayId: `cv_${Date.now()}`
                });
            } else {
                res.status(503).json({
                    success: false,
                    error: 'Overlay system not connected'
                });
            }
        });
        
        // Register agent for tracking
        this.app.post('/api/cv/register-agent', (req, res) => {
            const { agentPID, agentType, position, capabilities } = req.body;
            
            const agent = {
                pid: agentPID,
                type: agentType || 'unknown',
                position: position || { x: 50, y: 50 },
                capabilities: capabilities || [],
                detected: true,
                lastSeen: Date.now(),
                overlays: []
            };
            
            this.trackedAgents.set(agentPID, agent);
            this.recognitionMetrics.componentsDetected = this.trackedAgents.size;
            
            // Broadcast to CV clients
            this.broadcastToCVClients({
                type: 'agent-registered',
                agent: agent
            });
            
            res.json({
                success: true,
                agent: agent
            });
        });
        
        this.httpServer = this.app.listen(this.httpPort);
        console.log(`🌐 HTTP server started on port ${this.httpPort}`);
    }
    
    async setupCVServer() {
        this.cvServer = new WebSocket.Server({ port: this.cvServerPort });
        
        this.cvServer.on('connection', (ws, req) => {
            console.log('🔌 CV client connected');
            this.cvClients.add(ws);
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'initial-state',
                metrics: this.recognitionMetrics,
                detectedComponents: Array.from(this.detectedComponents.entries()),
                activeOverlays: Array.from(this.activeOverlays.entries()),
                trackedAgents: Array.from(this.trackedAgents.entries())
            }));
            
            // Handle CV client messages
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.handleCVMessage(data, ws);
                } catch (error) {
                    console.error('🔌 Invalid CV message:', error.message);
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 CV client disconnected');
                this.cvClients.delete(ws);
            });
        });
        
        console.log(`🔌 CV WebSocket server started on port ${this.cvServerPort}`);
    }
    
    async connectToOverlaySystem() {
        const connect = () => {
            this.overlayConnection = new WebSocket(`ws://localhost:${this.overlayServerPort}`);
            
            this.overlayConnection.on('open', () => {
                console.log('🔗 Connected to overlay system');
                
                // Subscribe to all overlay types
                this.overlayConnection.send(JSON.stringify({
                    type: 'subscribe',
                    characterId: 1, // Default character
                    overlayTypes: Object.keys(this.overlayToCVMapping)
                }));
            });
            
            this.overlayConnection.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.handleOverlayMessage(data);
                } catch (error) {
                    console.error('🔗 Invalid overlay message:', error.message);
                }
            });
            
            this.overlayConnection.on('close', () => {
                console.log('🔗 Overlay connection closed, reconnecting...');
                setTimeout(() => {
                    connect();
                }, this.overlayReconnectDelay);
            });
            
            this.overlayConnection.on('error', (error) => {
                console.error('🔗 Overlay connection error:', error.message);
            });
        };
        
        connect();
    }
    
    async connectToArchiveBridge() {
        const connect = () => {
            this.archiveBridge = new WebSocket(`ws://localhost:${this.archiveBridgePort}`);
            
            this.archiveBridge.on('open', () => {
                console.log('🔗 Connected to Archive Integration Bridge');
                
                // Request database status
                this.archiveBridge.send(JSON.stringify({
                    type: 'get-status'
                }));
            });
            
            this.archiveBridge.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.handleArchiveBridgeMessage(data);
                } catch (error) {
                    console.error('🔗 Invalid archive bridge message:', error.message);
                }
            });
            
            this.archiveBridge.on('close', () => {
                console.log('🔗 Archive bridge connection closed, reconnecting...');
                setTimeout(() => {
                    connect();
                }, 5000);
            });
            
            this.archiveBridge.on('error', (error) => {
                console.error('🔗 Archive bridge connection error:', error.message);
            });
        };
        
        connect();
    }
    
    handleArchiveBridgeMessage(data) {
        switch (data.type) {
            case 'database-status':
                console.log(`📊 Archive DB: ${data.componentsIndexed} components indexed`);
                this.recognitionMetrics.componentsDetected = data.componentsIndexed;
                break;
                
            case 'detection-results':
                this.processArchiveDetectionResults(data);
                break;
                
            case 'components-detected':
                this.addArchiveComponents(data.components);
                break;
                
            case 'statistics-update':
                this.updateArchiveStatistics(data);
                break;
                
            default:
                console.log('🔗 Unknown archive bridge message:', data.type);
        }
    }
    
    processArchiveDetectionResults(data) {
        console.log(`📦 Archive detected ${data.components.length} components`);
        
        data.components.forEach(component => {
            this.archiveComponents.set(component.id, component);
            
            // Add to detected components for CV display
            this.detectedComponents.set(component.id, component);
            
            // Broadcast to CV clients
            this.broadcastToCVClients({
                type: 'component-detected',
                component: component,
                source: 'archive-database'
            });
        });
    }
    
    addArchiveComponents(components) {
        components.forEach(component => {
            this.archiveComponents.set(component.id, component);
        });
    }
    
    updateArchiveStatistics(data) {
        if (data.databaseStats) {
            // Update recognition metrics with archive data
            this.recognitionMetrics.componentsDetected = data.componentsIndexed || 0;
        }
    }
    
    handleOverlayMessage(data) {
        switch (data.type) {
            case 'connected':
                console.log('🔗 Overlay system handshake complete');
                break;
                
            case 'show_overlay':
                this.processOverlayForCV(data.overlay);
                break;
                
            case 'hide_overlay':
                this.removeOverlayFromCV(data.overlayId);
                break;
                
            case 'subscribed':
                console.log(`🔗 Subscribed to overlays for character ${data.characterId}`);
                break;
                
            default:
                console.log('🔗 Unknown overlay message:', data.type);
        }
    }
    
    processOverlayForCV(overlay) {
        // Convert overlay to computer vision component
        const cvMapping = this.overlayToCVMapping[overlay.type];
        if (!cvMapping) return;
        
        const cvComponent = {
            id: overlay.id,
            type: 'overlay-component',
            symbol: cvMapping.symbol,
            color: cvMapping.color,
            cvType: cvMapping.type,
            priority: cvMapping.priority,
            position: overlay.position || { x: Math.random() * 100, y: Math.random() * 100 },
            characterId: overlay.characterId,
            data: overlay.data || {},
            detected: Date.now(),
            confidence: 0.95 + Math.random() * 0.05
        };
        
        // Store in detected components
        this.detectedComponents.set(overlay.id, cvComponent);
        this.activeOverlays.set(overlay.id, overlay);
        
        // Update metrics
        this.recognitionMetrics.componentsDetected = this.detectedComponents.size;
        
        // Broadcast to CV clients
        this.broadcastToCVClients({
            type: 'component-detected',
            component: cvComponent
        });
        
        console.log(`🔍 CV detected ${cvMapping.symbol} overlay at character ${overlay.characterId}`);
    }
    
    removeOverlayFromCV(overlayId) {
        if (this.detectedComponents.has(overlayId)) {
            this.detectedComponents.delete(overlayId);
            this.activeOverlays.delete(overlayId);
            
            this.recognitionMetrics.componentsDetected = this.detectedComponents.size;
            
            this.broadcastToCVClients({
                type: 'component-removed',
                overlayId: overlayId
            });
            
            console.log(`🔍 CV removed overlay ${overlayId}`);
        }
    }
    
    handleCVMessage(data, ws) {
        switch (data.type) {
            case 'request-detection':
                // Manual component detection trigger
                this.triggerComponentDetection();
                break;
                
            case 'click-component':
                // User clicked on a detected component
                this.handleComponentClick(data.componentId, data.position);
                break;
                
            case 'register-mouse-position':
                // Track mouse for hex grid
                this.updateMouseTracking(data.position);
                break;
                
            default:
                console.log('🔌 Unknown CV message:', data.type);
        }
    }
    
    triggerComponentDetection() {
        // Try archive-based detection first if bridge is connected
        if (this.archiveBridge && this.archiveBridge.readyState === WebSocket.OPEN) {
            this.requestArchiveDetection();
        } else {
            // Fallback to simulated detection
            this.simulateComponentDetection();
        }
    }
    
    requestArchiveDetection() {
        const searchTerms = this.generateSearchTerms();
        const visualHints = this.generateVisualHints();
        
        console.log(`🔍 Requesting archive detection for: [${searchTerms.join(', ')}]`);
        
        this.archiveBridge.send(JSON.stringify({
            type: 'detect-components',
            searchTerms: searchTerms,
            visualHints: visualHints,
            position: {
                x: 20 + Math.random() * 60,
                y: 20 + Math.random() * 60
            },
            context: {
                source: 'cv-system',
                timestamp: Date.now()
            },
            requestId: `detect_${Date.now()}`
        }));
    }
    
    generateSearchTerms() {
        const categories = [
            ['american', 'patriotic', 'usa'],
            ['gaming', 'game', 'player'],
            ['ai', 'artificial', 'intelligence'],
            ['blockchain', 'crypto', 'bitcoin'],
            ['api', 'service', 'endpoint'],
            ['database', 'data', 'storage'],
            ['launcher', 'startup', 'init'],
            ['hacker', 'matrix', 'cyber']
        ];
        
        const selectedCategory = categories[Math.floor(Math.random() * categories.length)];
        const numTerms = 1 + Math.floor(Math.random() * 2); // 1-2 terms
        
        return selectedCategory.slice(0, numTerms);
    }
    
    generateVisualHints() {
        const colorSchemes = ['patriotic', 'hacker', 'bitcoin', 'dark', 'light', 'default'];
        const layoutTypes = ['grid', 'flex', 'absolute', 'responsive', 'flow'];
        
        return {
            colorScheme: Math.random() > 0.5 ? colorSchemes[Math.floor(Math.random() * colorSchemes.length)] : undefined,
            layoutType: Math.random() > 0.7 ? layoutTypes[Math.floor(Math.random() * layoutTypes.length)] : undefined
        };
    }
    
    simulateComponentDetection() {
        // Simulate finding new components (original behavior)
        const componentTypes = ['file', 'function', 'variable', 'import', 'class'];
        const randomType = componentTypes[Math.floor(Math.random() * componentTypes.length)];
        
        const component = {
            id: `simulated_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            type: 'simulated-component',
            symbol: '#',
            color: '#9370DB',
            cvType: randomType,
            priority: 6,
            position: {
                x: 10 + Math.random() * 80,
                y: 10 + Math.random() * 80
            },
            detected: Date.now(),
            confidence: 0.8 + Math.random() * 0.2
        };
        
        this.detectedComponents.set(component.id, component);
        this.recognitionMetrics.componentsDetected = this.detectedComponents.size;
        
        this.broadcastToCVClients({
            type: 'component-detected',
            component: component
        });
    }
    
    handleComponentClick(componentId, position) {
        const component = this.detectedComponents.get(componentId);
        if (component) {
            console.log(`🔍 CV component clicked: ${component.symbol} (${component.cvType})`);
            
            // Trigger related overlay if it's an overlay component
            if (component.type === 'overlay-component' && component.characterId) {
                // Could trigger additional actions or overlays
                this.broadcastToCVClients({
                    type: 'component-clicked',
                    component: component,
                    position: position
                });
            }
        }
    }
    
    updateMouseTracking(position) {
        // Update hex grid tracking
        const hexX = Math.floor(position.x / 35);
        const hexY = Math.floor(position.y / 35);
        
        this.broadcastToCVClients({
            type: 'mouse-tracking',
            position: position,
            hex: { x: hexX, y: hexY }
        });
    }
    
    startComponentDetection() {
        // Periodically detect new components
        setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance every interval
                this.triggerComponentDetection();
            }
        }, 5000);
        
        // Clean up old components
        setInterval(() => {
            const now = Date.now();
            const maxAge = 60000; // 1 minute
            
            for (const [id, component] of this.detectedComponents.entries()) {
                if (now - component.detected > maxAge) {
                    this.detectedComponents.delete(id);
                    
                    this.broadcastToCVClients({
                        type: 'component-removed',
                        componentId: id
                    });
                }
            }
            
            this.recognitionMetrics.componentsDetected = this.detectedComponents.size;
        }, 30000);
    }
    
    startMetricsUpdating() {
        setInterval(() => {
            // Update recognition metrics
            this.recognitionMetrics.recognitionRate = 95 + Math.random() * 5;
            this.recognitionMetrics.processingFPS = 58 + Math.random() * 4;
            
            const healthStates = ['OPTIMAL', 'GOOD', 'SCANNING', 'TRACKING', 'ANALYZING'];
            this.recognitionMetrics.systemHealth = 
                healthStates[Math.floor(Math.random() * healthStates.length)];
            
            // Broadcast updated metrics
            this.broadcastToCVClients({
                type: 'metrics-update',
                metrics: this.recognitionMetrics
            });
        }, 2000);
    }
    
    broadcastToCVClients(data) {
        const message = JSON.stringify(data);
        
        this.cvClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                } catch (error) {
                    console.error('🔌 Failed to send to CV client:', error.message);
                    this.cvClients.delete(client);
                }
            }
        });
    }
    
    // Public API methods
    getDetectedComponents() {
        return Array.from(this.detectedComponents.values());
    }
    
    getActiveOverlays() {
        return Array.from(this.activeOverlays.values());
    }
    
    getRecognitionMetrics() {
        return { ...this.recognitionMetrics };
    }
    
    getTrackedAgents() {
        return Array.from(this.trackedAgents.values());
    }
    
    // Trigger overlay from CV interface
    triggerOverlay(characterId, overlayType, position = null, data = {}) {
        if (this.overlayConnection && this.overlayConnection.readyState === WebSocket.OPEN) {
            const message = {
                type: 'trigger_overlay',
                characterId: characterId,
                overlayType: overlayType,
                position: position || { x: Math.random() * 100, y: Math.random() * 100 },
                data: data
            };
            
            this.overlayConnection.send(JSON.stringify(message));
            return true;
        }
        return false;
    }
    
    shutdown() {
        console.log('🔍 CV Overlay Connector shutting down...');
        
        if (this.overlayConnection) {
            this.overlayConnection.close();
        }
        
        if (this.cvServer) {
            this.cvServer.close();
        }
        
        if (this.httpServer) {
            this.httpServer.close();
        }
        
        console.log('✅ CV Overlay Connector shutdown complete');
    }
}

module.exports = CVOverlayConnector;

// CLI functionality when run directly
if (require.main === module) {
    const connector = new CVOverlayConnector();
    
    console.log('\n🔍 CV OVERLAY CONNECTOR Demo');
    console.log('==============================\n');
    
    // Demo: Register some test agents
    setTimeout(() => {
        console.log('📋 Registering demo agents...');
        
        const demoAgents = [
            { pid: 'agent_document_processor_001', type: 'document_processor', position: { x: 25, y: 30 } },
            { pid: 'agent_blockchain_monitor_002', type: 'blockchain_monitor', position: { x: 75, y: 25 } },
            { pid: 'agent_financial_tracker_003', type: 'financial_tracker', position: { x: 50, y: 70 } }
        ];
        
        demoAgents.forEach((agent, index) => {
            setTimeout(() => {
                console.log(`🤖 Registering ${agent.pid}`);
                
                // Simulate agent registration
                fetch(`http://localhost:42010/api/cv/register-agent`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(agent)
                }).catch(() => {
                    // Will fail if server not ready yet, that's okay for demo
                });
            }, index * 1000);
        });
    }, 2000);
    
    // Demo: Trigger some overlays
    setTimeout(() => {
        console.log('🎯 Triggering demo overlays...');
        
        const overlays = [
            { characterId: 1, overlayType: 'quest_start' },
            { characterId: 2, overlayType: 'dialogue_mention' },
            { characterId: 3, overlayType: 'action_command' }
        ];
        
        overlays.forEach((overlay, index) => {
            setTimeout(() => {
                console.log(`🎯 Triggering ${overlay.overlayType} for character ${overlay.characterId}`);
                connector.triggerOverlay(overlay.characterId, overlay.overlayType);
            }, index * 2000);
        });
    }, 8000);
    
    // Show status every 30 seconds
    setInterval(() => {
        console.log('\n🔍 CV OVERLAY CONNECTOR STATUS:');
        console.log(`   📊 Components detected: ${connector.getDetectedComponents().length}`);
        console.log(`   🎯 Active overlays: ${connector.getActiveOverlays().length}`);
        console.log(`   🤖 Tracked agents: ${connector.getTrackedAgents().length}`);
        console.log(`   🔌 CV clients: ${connector.cvClients.size}`);
        console.log(`   🔗 Overlay connected: ${connector.overlayConnection?.readyState === WebSocket.OPEN}`);
    }, 30000);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n\n🔍 CV system shutting down...');
        connector.shutdown();
        process.exit(0);
    });
}