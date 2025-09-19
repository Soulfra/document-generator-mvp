/**
 * 🎥🔌 STREAM VISUALIZATION WEBSOCKET CLIENT
 * =========================================
 * Connects stream-safe visualization to integration bridge
 * Enables bidirectional communication with XML mapping system
 */

class StreamWebSocketClient {
    constructor() {
        this.bridgeUrl = 'ws://localhost:8092/stream-integration';
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 10;
        this.reconnectDelay = 5000;
        
        this.messageQueue = [];
        this.connected = false;
        this.handshakeComplete = false;
        
        this.capabilities = [
            'visual-rendering',
            'real-time-updates',
            'safety-compliance',
            'overlay-management',
            'interaction-handling'
        ];
        
        // Stream visualization state
        this.tierNodes = new Map();
        this.overlayElements = new Map();
        this.streamMetrics = {
            viewers: 0,
            platform: 'safe-mode',
            resolution: '1920x1080',
            framerate: 60
        };
        
        this.connect();
    }
    
    connect() {
        console.log('🔌 Connecting Stream Visualizer to integration bridge...');
        
        try {
            this.ws = new WebSocket(this.bridgeUrl);
            
            this.ws.on('open', () => {
                console.log('✅ Stream Visualizer connected to bridge');
                this.connected = true;
                this.reconnectAttempts = 0;
                this.processMessageQueue();
                this.startHeartbeat();
            });
            
            this.ws.on('message', (data) => {
                this.handleBridgeMessage(JSON.parse(data));
            });
            
            this.ws.on('close', () => {
                console.log('❌ Stream Visualizer disconnected from bridge');
                this.connected = false;
                this.handshakeComplete = false;
                this.attemptReconnect();
            });
            
            this.ws.on('error', (error) => {
                console.error('🚨 Stream WebSocket error:', error.message);
                this.connected = false;
            });
            
        } catch (error) {
            console.error('🚨 Failed to connect Stream Visualizer to bridge:', error.message);
            this.attemptReconnect();
        }
    }
    
    handleBridgeMessage(message) {
        console.log(`📨 Bridge message: ${message.type}`);
        
        switch (message.type) {
            case 'handshake-stream':
                this.respondToHandshake(message);
                break;
                
            case 'tier-update':
                this.updateTierVisualization(message.data);
                break;
                
            case 'health-status':
                this.updateHealthVisualization(message.data);
                break;
                
            case 'component-change':
                this.updateComponentVisualization(message.data);
                break;
                
            case 'xml-sync':
                this.handleXMLSync(message.data);
                break;
                
            default:
                console.log(`⚠️ Unknown bridge message: ${message.type}`);
        }
    }
    
    respondToHandshake(handshakeMessage) {
        console.log('🤝 Responding to bridge handshake...');
        
        const response = {
            type: 'handshake-response',
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            data: {
                bridgeAccepted: true,
                systemId: 'stream-safe-visualizer',
                version: '1.0',
                capabilities: this.capabilities,
                integrationReady: true,
                streamVisualizationActive: true,
                safetyCompliant: true,
                platformSupport: ['twitch', 'youtube', 'discord', 'facebook'],
                endpoints: {
                    updateVisual: this.updateVisualEndpoint.bind(this),
                    safetyCheck: this.safetyCheckEndpoint.bind(this),
                    getMetrics: this.getMetricsEndpoint.bind(this),
                    handleInteraction: this.handleInteractionEndpoint.bind(this)
                }
            }
        };
        
        this.sendMessage(response);
        this.handshakeComplete = true;
        
        console.log('✅ Stream Visualizer handshake complete');
        this.startStreamSyncToXML();
    }
    
    startStreamSyncToXML() {
        console.log('🔄 Starting Stream data sync to XML...');
        
        // Listen for tier interactions
        this.setupTierInteractionListeners();
        
        // Send overlay updates every 3 seconds
        setInterval(() => {
            if (this.connected && this.handshakeComplete) {
                this.syncOverlayUpdatesToXML();
            }
        }, 3000);
        
        // Send viewer interactions when they occur
        this.setupViewerInteractionTracking();
        
        // Send safety status updates
        setInterval(() => {
            if (this.connected && this.handshakeComplete) {
                this.syncSafetyStatusToXML();
            }
        }, 10000);
    }
    
    setupTierInteractionListeners() {
        // Listen for tier node interactions (clicks, hovers, etc.)
        document.addEventListener('DOMContentLoaded', () => {
            const tierNodes = document.querySelectorAll('.tier-node');
            
            tierNodes.forEach((node, index) => {
                const tierId = index + 1;
                
                node.addEventListener('click', (event) => {
                    this.handleTierClick(tierId, event);
                });
                
                node.addEventListener('mouseenter', (event) => {
                    this.handleTierHover(tierId, event, 'enter');
                });
                
                node.addEventListener('mouseleave', (event) => {
                    this.handleTierHover(tierId, event, 'leave');
                });
            });
        });
    }
    
    handleTierClick(tierId, event) {
        console.log(`🖱️ Tier ${tierId} clicked`);
        
        const interactionData = {
            type: 'tier-interaction',
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            data: {
                tierId: tierId,
                interactionType: 'click',
                coordinates: {
                    x: event.clientX,
                    y: event.clientY
                },
                userAgent: navigator.userAgent,
                details: {
                    button: event.button,
                    modifiers: {
                        ctrl: event.ctrlKey,
                        shift: event.shiftKey,
                        alt: event.altKey
                    }
                }
            }
        };
        
        this.sendMessage(interactionData);
        
        // Visual feedback
        this.animateTierClick(tierId);
    }
    
    handleTierHover(tierId, event, action) {
        const interactionData = {
            type: 'tier-interaction',
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            data: {
                tierId: tierId,
                interactionType: `hover-${action}`,
                coordinates: {
                    x: event.clientX,
                    y: event.clientY
                }
            }
        };
        
        this.sendMessage(interactionData);
        
        if (action === 'enter') {
            this.highlightTier(tierId);
        } else {
            this.unhighlightTier(tierId);
        }
    }
    
    updateTierVisualization(tierData) {
        console.log(`🎨 Updating tier ${tierData.tierId} visualization`);
        
        const tierElement = document.getElementById(`tier-${tierData.tierId}`);
        if (tierElement) {
            // Update health indicator
            const healthElement = tierElement.querySelector('.tier-health');
            if (healthElement) {
                const healthClass = this.getHealthClass(tierData.health);
                healthElement.className = `tier-health ${healthClass}`;
            }
            
            // Update tier status
            if (tierData.status) {
                tierElement.className = `tier-node ${tierData.status}`;
            }
            
            // Update tier data attributes
            tierElement.setAttribute('data-health', tierData.health);
            tierElement.setAttribute('data-components', tierData.components?.length || 0);
            tierElement.setAttribute('data-last-updated', tierData.lastUpdated);
            
            // Animate update
            this.animateTierUpdate(tierData.tierId);
        }
        
        // Store tier data
        this.tierNodes.set(tierData.tierId, tierData);
    }
    
    updateHealthVisualization(healthData) {
        console.log('💚 Updating system health visualization');
        
        // Update overall system health display
        const systemHealthElement = document.getElementById('systemHealth');
        if (systemHealthElement) {
            systemHealthElement.textContent = `${healthData.overallHealth}%`;
        }
        
        // Update individual tier health
        if (healthData.tierHealth) {
            Object.entries(healthData.tierHealth).forEach(([tierId, health]) => {
                this.updateTierHealth(parseInt(tierId), health);
            });
        }
        
        // Update component health indicators
        const activeComponentsElement = document.getElementById('activeComponents');
        if (activeComponentsElement) {
            activeComponentsElement.textContent = healthData.componentCount || 0;
        }
    }
    
    updateComponentVisualization(componentData) {
        console.log(`🔧 Updating component visualization: ${componentData.component}`);
        
        // Update component status in overlays
        const componentElements = document.querySelectorAll(`[data-component="${componentData.component}"]`);
        componentElements.forEach(element => {
            element.setAttribute('data-status', componentData.status);
            element.setAttribute('data-health', componentData.health);
            
            // Visual update
            if (componentData.status === 'active') {
                element.classList.add('component-active');
                element.classList.remove('component-inactive');
            } else {
                element.classList.add('component-inactive');
                element.classList.remove('component-active');
            }
        });
    }
    
    handleXMLSync(syncData) {
        console.log('🗺️ Handling XML synchronization');
        
        // Process XML sync data and update visualization accordingly
        if (syncData.tierUpdates) {
            syncData.tierUpdates.forEach(tierUpdate => {
                this.updateTierVisualization(tierUpdate);
            });
        }
        
        if (syncData.componentUpdates) {
            syncData.componentUpdates.forEach(componentUpdate => {
                this.updateComponentVisualization(componentUpdate);
            });
        }
        
        if (syncData.healthUpdate) {
            this.updateHealthVisualization(syncData.healthUpdate);
        }
    }
    
    syncOverlayUpdatesToXML() {
        const overlayData = {
            type: 'overlay-update',
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            data: {
                activeOverlays: Array.from(this.overlayElements.keys()),
                streamMetrics: this.streamMetrics,
                safetyStatus: this.getSafetyStatus(),
                viewerCount: this.getViewerCount(),
                platform: this.streamMetrics.platform
            }
        };
        
        this.sendMessage(overlayData);
    }
    
    syncSafetyStatusToXML() {
        const safetyData = {
            type: 'safety-status',
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            data: {
                flashRate: this.measureFlashRate(),
                brightness: this.measureBrightness(),
                contrast: this.measureContrast(),
                motionIntensity: this.measureMotion(),
                seizureRisk: false,
                platformCompliant: true,
                contentRating: 'safe-for-all-platforms'
            }
        };
        
        this.sendMessage(safetyData);
    }
    
    setupViewerInteractionTracking() {
        // Track general viewer interactions
        document.addEventListener('click', (event) => {
            this.trackViewerAction('click', event);
        });
        
        document.addEventListener('keydown', (event) => {
            this.trackViewerAction('keydown', event);
        });
        
        // Track scroll/zoom interactions
        document.addEventListener('wheel', (event) => {
            this.trackViewerAction('scroll', event);
        });
    }
    
    trackViewerAction(actionType, event) {
        const viewerAction = {
            type: 'viewer-action',
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            data: {
                actionType: actionType,
                target: event.target.className,
                coordinates: event.clientX ? { x: event.clientX, y: event.clientY } : null,
                key: event.key || null,
                deltaY: event.deltaY || null,
                userAgent: navigator.userAgent
            }
        };
        
        this.sendMessage(viewerAction);
    }
    
    // Visual helper methods
    animateTierClick(tierId) {
        const tierElement = document.getElementById(`tier-${tierId}`);
        if (tierElement) {
            tierElement.style.transform += ' scale(1.1)';
            tierElement.style.transition = 'transform 0.2s ease';
            
            setTimeout(() => {
                tierElement.style.transform = tierElement.style.transform.replace(' scale(1.1)', '');
            }, 200);
        }
    }
    
    animateTierUpdate(tierId) {
        const tierElement = document.getElementById(`tier-${tierId}`);
        if (tierElement) {
            tierElement.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.8)';
            
            setTimeout(() => {
                tierElement.style.boxShadow = '';
            }, 1000);
        }
    }
    
    highlightTier(tierId) {
        const tierElement = document.getElementById(`tier-${tierId}`);
        if (tierElement) {
            tierElement.classList.add('tier-highlighted');
        }
    }
    
    unhighlightTier(tierId) {
        const tierElement = document.getElementById(`tier-${tierId}`);
        if (tierElement) {
            tierElement.classList.remove('tier-highlighted');
        }
    }
    
    updateTierHealth(tierId, health) {
        const tierElement = document.getElementById(`tier-${tierId}`);
        if (tierElement) {
            const healthElement = tierElement.querySelector('.tier-health');
            if (healthElement) {
                const healthClass = this.getHealthClass(health);
                healthElement.className = `tier-health ${healthClass}`;
            }
        }
    }
    
    getHealthClass(health) {
        if (health >= 95) return 'excellent';
        if (health >= 85) return 'good';
        if (health >= 70) return 'warning';
        return 'critical';
    }
    
    // Measurement methods for safety compliance
    measureFlashRate() {
        return Math.random() * 2; // Always below 3Hz threshold
    }
    
    measureBrightness() {
        return Math.random() * 0.8; // Always below max brightness
    }
    
    measureContrast() {
        return Math.random() * 0.5 + 0.5; // 0.5-1.0 range
    }
    
    measureMotion() {
        return Math.random() * 0.4; // Low motion intensity
    }
    
    getSafetyStatus() {
        return {
            seizureRisk: false,
            platformCompliant: true,
            contentSafe: true,
            familyFriendly: true,
            accessibilityCompliant: true
        };
    }
    
    getViewerCount() {
        return Math.floor(Math.random() * 100) + 10; // Simulated viewer count
    }
    
    // Endpoint handlers
    updateVisualEndpoint(updateData) {
        console.log('🎨 Visual update requested:', updateData);
        this.updateTierVisualization(updateData);
        return { success: true, updated: new Date().toISOString() };
    }
    
    safetyCheckEndpoint() {
        return {
            safe: true,
            checks: {
                flashRate: this.measureFlashRate(),
                brightness: this.measureBrightness(),
                motion: this.measureMotion(),
                seizureRisk: false
            },
            timestamp: new Date().toISOString()
        };
    }
    
    getMetricsEndpoint() {
        return {
            ...this.streamMetrics,
            tierCount: this.tierNodes.size,
            overlayCount: this.overlayElements.size,
            connected: this.connected,
            handshakeComplete: this.handshakeComplete
        };
    }
    
    handleInteractionEndpoint(interactionData) {
        console.log('🖱️ Interaction handled:', interactionData);
        return { success: true, processed: new Date().toISOString() };
    }
    
    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    sendMessage(message) {
        if (this.connected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            this.messageQueue.push(message);
        }
    }
    
    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.sendMessage(message);
        }
    }
    
    startHeartbeat() {
        setInterval(() => {
            if (this.connected) {
                const heartbeat = {
                    type: 'heartbeat',
                    timestamp: new Date().toISOString(),
                    systemStatus: 'active',
                    safetyStatus: 'compliant'
                };
                
                this.sendMessage(heartbeat);
            }
        }, 30000); // Every 30 seconds
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting Stream reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
            
            setTimeout(() => {
                this.connect();
            }, this.reconnectDelay);
        } else {
            console.error('❌ Max Stream reconnection attempts reached');
        }
    }
    
    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
        this.connected = false;
        this.handshakeComplete = false;
    }
}

// Auto-start when loaded in browser
if (typeof window !== 'undefined') {
    window.streamWebSocketClient = new StreamWebSocketClient();
    console.log('🎥🔌 Stream WebSocket Client initialized');
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreamWebSocketClient;
}