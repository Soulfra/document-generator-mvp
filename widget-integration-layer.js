/**
 * Widget Integration Layer
 * Connects the floating interactive widget to the unified ecosystem services
 * Enables complete integration with character movement, authentication, and ecosystem
 */

const WebSocket = require('ws');
const crypto = require('crypto');
const axios = require('axios');
const EventEmitter = require('events');

/**
 * Widget Integration Service
 * Orchestrates all widget interactions with the ecosystem
 */
class WidgetIntegrationService extends EventEmitter {
    constructor() {
        super();
        this.config = {
            // Service endpoints
            unifiedBridge: {
                api: 'http://localhost:4000/api',
                websocket: 'ws://localhost:4001'
            },
            characterMovement: {
                websocket: 'ws://localhost:8090'
            },
            authentication: {
                api: 'http://localhost:4002/auth'
            },
            
            // Widget configuration
            widget: {
                maxInstances: 3,
                sessionTimeout: 300000, // 5 minutes
                syncInterval: 1000, // 1 second
                physicsUpdateRate: 60 // 60 FPS
            }
        };
        
        this.activeWidgets = new Map();
        this.websockets = new Map();
        this.characterSessions = new Map();
        this.authenticated = false;
        this.sessionId = crypto.randomUUID();
        
        this.init();
    }
    
    /**
     * Initialize the integration layer
     */
    async init() {
        try {
            // Connect to unified bridge WebSocket
            await this.connectUnifiedBridge();
            
            // Connect to character movement system
            await this.connectCharacterMovement();
            
            // Register widget service with ecosystem
            await this.registerWithEcosystem();
            
            // Set up periodic sync
            this.setupPeriodicSync();
            
            console.log('Widget Integration Layer initialized successfully');
            this.emit('ready');
        } catch (error) {
            console.error('Failed to initialize Widget Integration Layer:', error);
            this.emit('error', error);
        }
    }
    
    /**
     * Connect to unified bridge WebSocket
     */
    async connectUnifiedBridge() {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(this.config.unifiedBridge.websocket);
            
            ws.on('open', () => {
                console.log('Connected to Unified Bridge WebSocket');
                
                // Register as widget service
                ws.send(JSON.stringify({
                    type: 'service_register',
                    service: 'widget-integration',
                    capabilities: [
                        'floating-widget',
                        'text-morphing',
                        'physics-simulation',
                        'user-interaction'
                    ],
                    sessionId: this.sessionId
                }));
                
                this.websockets.set('unified', ws);
                resolve();
            });
            
            ws.on('message', (data) => {
                this.handleUnifiedMessage(JSON.parse(data.toString()));
            });
            
            ws.on('error', reject);
            ws.on('close', () => {
                console.log('Unified Bridge WebSocket disconnected');
                this.websockets.delete('unified');
                // Attempt reconnection
                setTimeout(() => this.connectUnifiedBridge(), 5000);
            });
        });
    }
    
    /**
     * Connect to character movement system
     */
    async connectCharacterMovement() {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket(this.config.characterMovement.websocket);
            
            ws.on('open', () => {
                console.log('Connected to Character Movement WebSocket');
                
                // Register widget characters
                ws.send(JSON.stringify({
                    type: 'register_client',
                    clientType: 'widget',
                    sessionId: this.sessionId
                }));
                
                this.websockets.set('movement', ws);
                resolve();
            });
            
            ws.on('message', (data) => {
                this.handleMovementMessage(JSON.parse(data.toString()));
            });
            
            ws.on('error', reject);
            ws.on('close', () => {
                console.log('Character Movement WebSocket disconnected');
                this.websockets.delete('movement');
                // Attempt reconnection
                setTimeout(() => this.connectCharacterMovement(), 5000);
            });
        });
    }
    
    /**
     * Register widget service with ecosystem
     */
    async registerWithEcosystem() {
        try {
            const response = await axios.post(`${this.config.unifiedBridge.api}/services/register`, {
                serviceName: 'widget-integration',
                serviceType: 'interactive-widget',
                version: '1.0.0',
                endpoints: {
                    health: '/widget/health',
                    status: '/widget/status',
                    create: '/widget/create',
                    destroy: '/widget/destroy',
                    morph: '/widget/morph'
                },
                capabilities: [
                    'floating-interaction',
                    'text-morphing',
                    'physics-simulation',
                    'character-integration',
                    'real-time-sync'
                ],
                sessionId: this.sessionId
            });
            
            console.log('Widget service registered with ecosystem:', response.data);
        } catch (error) {
            console.error('Failed to register with ecosystem:', error.message);
        }
    }
    
    /**
     * Create a new floating widget instance
     */
    async createWidget(options = {}) {
        const widgetId = crypto.randomUUID();
        
        try {
            // Create character in movement system
            const characterId = await this.createCharacterForWidget(widgetId, options);
            
            // Create widget configuration
            const widgetConfig = {
                id: widgetId,
                characterId: characterId,
                position: options.position || { x: 100, y: 100 },
                size: options.size || { width: 64, height: 64 },
                appearance: options.appearance || 'default',
                behavior: options.behavior || 'friendly',
                permissions: options.permissions || ['move', 'morph', 'interact'],
                sessionId: this.sessionId,
                createdAt: Date.now(),
                lastSync: Date.now()
            };
            
            // Store widget
            this.activeWidgets.set(widgetId, widgetConfig);
            
            // Notify unified bridge
            this.sendToUnified({
                type: 'widget_created',
                widgetId: widgetId,
                characterId: characterId,
                config: widgetConfig
            });
            
            // Notify character movement system
            this.sendToMovement({
                type: 'widget_character_created',
                widgetId: widgetId,
                characterId: characterId,
                initialPosition: widgetConfig.position
            });
            
            console.log(`Widget ${widgetId} created with character ${characterId}`);
            this.emit('widget_created', widgetConfig);
            
            return widgetConfig;
        } catch (error) {
            console.error('Failed to create widget:', error);
            throw error;
        }
    }
    
    /**
     * Create character for widget in movement system
     */
    async createCharacterForWidget(widgetId, options) {
        try {
            const response = await axios.post('http://localhost:8090/characters', {
                type: 'widget',
                widgetId: widgetId,
                appearance: options.appearance || 'mascot',
                physics: {
                    mass: 1.0,
                    friction: 0.95,
                    maxSpeed: 100,
                    acceleration: 200
                },
                behavior: {
                    followMouse: options.followMouse || false,
                    avoidObstacles: true,
                    bounceOffWalls: true,
                    morphToText: true
                },
                permissions: options.permissions || ['move', 'interact']
            });
            
            const characterId = response.data.characterId;
            this.characterSessions.set(widgetId, characterId);
            
            return characterId;
        } catch (error) {
            console.error('Failed to create character for widget:', error);
            // Fallback to local character ID
            const characterId = `widget_char_${widgetId.slice(0, 8)}`;
            this.characterSessions.set(widgetId, characterId);
            return characterId;
        }
    }
    
    /**
     * Update widget position and sync with character
     */
    async updateWidgetPosition(widgetId, position, velocity = null) {
        const widget = this.activeWidgets.get(widgetId);
        if (!widget) {
            throw new Error(`Widget ${widgetId} not found`);
        }
        
        // Update widget position
        widget.position = position;
        widget.lastSync = Date.now();
        
        // Sync with character movement system
        this.sendToMovement({
            type: 'update_position',
            characterId: widget.characterId,
            position: position,
            velocity: velocity,
            timestamp: Date.now()
        });
        
        // Notify unified bridge
        this.sendToUnified({
            type: 'widget_position_update',
            widgetId: widgetId,
            position: position,
            velocity: velocity
        });
        
        this.emit('widget_moved', { widgetId, position, velocity });
    }
    
    /**
     * Morph widget to surrounding text/images
     */
    async morphWidget(widgetId, morphTarget) {
        const widget = this.activeWidgets.get(widgetId);
        if (!widget) {
            throw new Error(`Widget ${widgetId} not found`);
        }
        
        try {
            // Call text morphing engine
            const morphData = await this.processTextMorph(morphTarget);
            
            // Update widget appearance
            widget.appearance = {
                ...widget.appearance,
                morph: morphData,
                lastMorphAt: Date.now()
            };
            
            // Notify unified bridge
            this.sendToUnified({
                type: 'widget_morphed',
                widgetId: widgetId,
                morphData: morphData,
                target: morphTarget
            });
            
            // Update character appearance in movement system
            this.sendToMovement({
                type: 'update_appearance',
                characterId: widget.characterId,
                appearance: morphData.visualStyle,
                animation: morphData.transitionAnimation
            });
            
            this.emit('widget_morphed', { widgetId, morphData, target: morphTarget });
            
            return morphData;
        } catch (error) {
            console.error('Failed to morph widget:', error);
            throw error;
        }
    }
    
    /**
     * Process text morphing using text morphing engine
     */
    async processTextMorph(target) {
        try {
            // Simulate text morphing engine call
            // In real implementation, this would call the actual text-morphing-engine.js
            return {
                targetType: target.type, // 'text', 'image', 'certificate'
                colors: target.colors || ['#333333', '#666666'],
                fonts: target.fonts || ['Arial', 'sans-serif'],
                effects: target.effects || ['gradient'],
                texture: target.texture || 'smooth',
                visualStyle: {
                    background: target.colors?.[0] || '#333333',
                    color: target.colors?.[1] || '#ffffff',
                    fontFamily: target.fonts?.[0] || 'Arial',
                    filter: target.effects?.join(' ') || 'none'
                },
                transitionAnimation: {
                    duration: 500,
                    easing: 'ease-in-out',
                    keyframes: ['opacity', 'transform', 'filter']
                }
            };
        } catch (error) {
            console.error('Text morph processing failed:', error);
            return {
                targetType: 'fallback',
                colors: ['#333333', '#ffffff'],
                fonts: ['Arial'],
                effects: ['none'],
                visualStyle: {},
                transitionAnimation: { duration: 0 }
            };
        }
    }
    
    /**
     * Handle drag and drop interactions
     */
    async handleDragDrop(widgetId, dragData) {
        const widget = this.activeWidgets.get(widgetId);
        if (!widget) {
            throw new Error(`Widget ${widgetId} not found`);
        }
        
        try {
            // Process drag data
            const dropResult = await this.processDragDrop(dragData);
            
            // Update widget based on drop
            if (dropResult.shouldMorph) {
                await this.morphWidget(widgetId, dropResult.morphTarget);
            }
            
            if (dropResult.shouldMove) {
                await this.updateWidgetPosition(widgetId, dropResult.newPosition);
            }
            
            // Notify unified bridge
            this.sendToUnified({
                type: 'widget_drag_drop',
                widgetId: widgetId,
                dragData: dragData,
                result: dropResult
            });
            
            this.emit('widget_drag_drop', { widgetId, dragData, result: dropResult });
            
            return dropResult;
        } catch (error) {
            console.error('Failed to handle drag drop:', error);
            throw error;
        }
    }
    
    /**
     * Process drag and drop data
     */
    async processDragDrop(dragData) {
        // Analyze drop target
        const dropAnalysis = {
            targetElement: dragData.target,
            elementType: dragData.target?.tagName?.toLowerCase(),
            hasText: dragData.target?.textContent?.length > 0,
            hasImages: dragData.target?.querySelector('img') !== null,
            isCertificate: dragData.target?.classList?.contains('certificate'),
            isLogo: dragData.target?.classList?.contains('logo')
        };
        
        return {
            shouldMorph: dropAnalysis.hasText || dropAnalysis.hasImages,
            shouldMove: true,
            newPosition: dragData.position,
            morphTarget: dropAnalysis.hasText ? {
                type: 'text',
                content: dragData.target?.textContent,
                colors: this.extractColors(dragData.target),
                fonts: this.extractFonts(dragData.target)
            } : null,
            analysis: dropAnalysis
        };
    }
    
    /**
     * Extract colors from DOM element
     */
    extractColors(element) {
        if (!element) return ['#333333', '#ffffff'];
        
        try {
            const styles = window.getComputedStyle(element);
            return [
                styles.backgroundColor || '#333333',
                styles.color || '#ffffff'
            ];
        } catch (error) {
            return ['#333333', '#ffffff'];
        }
    }
    
    /**
     * Extract fonts from DOM element
     */
    extractFonts(element) {
        if (!element) return ['Arial'];
        
        try {
            const styles = window.getComputedStyle(element);
            const fontFamily = styles.fontFamily || 'Arial';
            return fontFamily.split(',').map(font => font.trim().replace(/['"]/g, ''));
        } catch (error) {
            return ['Arial'];
        }
    }
    
    /**
     * Destroy widget and cleanup
     */
    async destroyWidget(widgetId) {
        const widget = this.activeWidgets.get(widgetId);
        if (!widget) {
            throw new Error(`Widget ${widgetId} not found`);
        }
        
        try {
            // Remove character from movement system
            this.sendToMovement({
                type: 'remove_character',
                characterId: widget.characterId
            });
            
            // Notify unified bridge
            this.sendToUnified({
                type: 'widget_destroyed',
                widgetId: widgetId,
                characterId: widget.characterId
            });
            
            // Cleanup local state
            this.activeWidgets.delete(widgetId);
            this.characterSessions.delete(widgetId);
            
            console.log(`Widget ${widgetId} destroyed`);
            this.emit('widget_destroyed', { widgetId });
            
        } catch (error) {
            console.error('Failed to destroy widget:', error);
            throw error;
        }
    }
    
    /**
     * Handle messages from unified bridge
     */
    handleUnifiedMessage(message) {
        switch (message.type) {
            case 'service_registered':
                console.log('Widget service registered successfully');
                break;
                
            case 'character_data_sync':
                this.syncCharacterData(message.data);
                break;
                
            case 'ecosystem_event':
                this.handleEcosystemEvent(message.event);
                break;
                
            case 'auth_update':
                this.handleAuthUpdate(message.authData);
                break;
                
            default:
                console.log('Unhandled unified message:', message.type);
        }
    }
    
    /**
     * Handle messages from character movement system
     */
    handleMovementMessage(message) {
        switch (message.type) {
            case 'position_update':
                this.handleCharacterPositionUpdate(message);
                break;
                
            case 'collision_detected':
                this.handleCharacterCollision(message);
                break;
                
            case 'character_registered':
                console.log('Character registered:', message.characterId);
                break;
                
            case 'pathfinding_complete':
                this.handlePathfindingComplete(message);
                break;
                
            default:
                console.log('Unhandled movement message:', message.type);
        }
    }
    
    /**
     * Handle character position updates
     */
    handleCharacterPositionUpdate(message) {
        // Find widget by character ID
        for (const [widgetId, widget] of this.activeWidgets.entries()) {
            if (widget.characterId === message.characterId) {
                widget.position = message.position;
                widget.lastSync = Date.now();
                
                this.emit('widget_position_synced', {
                    widgetId,
                    position: message.position,
                    velocity: message.velocity
                });
                break;
            }
        }
    }
    
    /**
     * Handle character collision events
     */
    handleCharacterCollision(message) {
        // Find widget by character ID
        for (const [widgetId, widget] of this.activeWidgets.entries()) {
            if (widget.characterId === message.characterId) {
                this.emit('widget_collision', {
                    widgetId,
                    collision: message.collision,
                    position: message.position
                });
                break;
            }
        }
    }
    
    /**
     * Handle pathfinding completion
     */
    handlePathfindingComplete(message) {
        // Find widget by character ID
        for (const [widgetId, widget] of this.activeWidgets.entries()) {
            if (widget.characterId === message.characterId) {
                this.emit('widget_path_complete', {
                    widgetId,
                    path: message.path,
                    destination: message.destination
                });
                break;
            }
        }
    }
    
    /**
     * Send message to unified bridge
     */
    sendToUnified(message) {
        const ws = this.websockets.get('unified');
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    
    /**
     * Send message to character movement system
     */
    sendToMovement(message) {
        const ws = this.websockets.get('movement');
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    
    /**
     * Set up periodic synchronization
     */
    setupPeriodicSync() {
        setInterval(() => {
            this.syncAllWidgets();
        }, this.config.widget.syncInterval);
    }
    
    /**
     * Sync all active widgets
     */
    async syncAllWidgets() {
        for (const [widgetId, widget] of this.activeWidgets.entries()) {
            try {
                // Check if widget needs sync
                const timeSinceSync = Date.now() - widget.lastSync;
                if (timeSinceSync > this.config.widget.syncInterval * 2) {
                    await this.syncWidget(widgetId);
                }
            } catch (error) {
                console.error(`Failed to sync widget ${widgetId}:`, error);
            }
        }
    }
    
    /**
     * Sync individual widget
     */
    async syncWidget(widgetId) {
        const widget = this.activeWidgets.get(widgetId);
        if (!widget) return;
        
        // Send sync message to movement system
        this.sendToMovement({
            type: 'sync_character',
            characterId: widget.characterId,
            widgetId: widgetId,
            timestamp: Date.now()
        });
        
        // Send sync message to unified bridge
        this.sendToUnified({
            type: 'widget_sync',
            widgetId: widgetId,
            character: widget.characterId,
            position: widget.position,
            appearance: widget.appearance,
            timestamp: Date.now()
        });
        
        widget.lastSync = Date.now();
    }
    
    /**
     * Get widget status
     */
    getWidgetStatus(widgetId) {
        const widget = this.activeWidgets.get(widgetId);
        if (!widget) {
            throw new Error(`Widget ${widgetId} not found`);
        }
        
        return {
            id: widget.id,
            characterId: widget.characterId,
            position: widget.position,
            appearance: widget.appearance,
            isActive: true,
            lastSync: widget.lastSync,
            uptime: Date.now() - widget.createdAt
        };
    }
    
    /**
     * Get all active widgets
     */
    getAllWidgets() {
        const widgets = [];
        for (const [widgetId, widget] of this.activeWidgets.entries()) {
            widgets.push(this.getWidgetStatus(widgetId));
        }
        return widgets;
    }
    
    /**
     * Cleanup and shutdown
     */
    async shutdown() {
        console.log('Shutting down Widget Integration Layer...');
        
        // Destroy all widgets
        for (const widgetId of this.activeWidgets.keys()) {
            try {
                await this.destroyWidget(widgetId);
            } catch (error) {
                console.error(`Failed to destroy widget ${widgetId}:`, error);
            }
        }
        
        // Close WebSocket connections
        for (const [name, ws] of this.websockets.entries()) {
            try {
                ws.close();
                console.log(`Closed ${name} WebSocket connection`);
            } catch (error) {
                console.error(`Failed to close ${name} WebSocket:`, error);
            }
        }
        
        this.emit('shutdown');
        console.log('Widget Integration Layer shutdown complete');
    }
}

/**
 * Client-side Widget Integration API
 * Provides easy-to-use functions for web applications
 */
class WidgetIntegrationClient {
    constructor() {
        this.service = new WidgetIntegrationService();
        this.widgets = new Map();
        
        // Set up event listeners
        this.service.on('widget_created', (widget) => {
            this.widgets.set(widget.id, widget);
        });
        
        this.service.on('widget_destroyed', ({ widgetId }) => {
            this.widgets.delete(widgetId);
        });
    }
    
    /**
     * Initialize client
     */
    async init() {
        return new Promise((resolve, reject) => {
            this.service.once('ready', resolve);
            this.service.once('error', reject);
        });
    }
    
    /**
     * Create floating widget from logo click
     */
    async createFloatingWidget(logoElement, options = {}) {
        const rect = logoElement.getBoundingClientRect();
        
        const widgetConfig = await this.service.createWidget({
            position: {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            },
            appearance: options.appearance || 'logo-based',
            behavior: options.behavior || 'helpful',
            permissions: options.permissions || ['move', 'morph', 'interact'],
            sourceElement: logoElement
        });
        
        // Create DOM element for widget
        const widgetElement = this.createWidgetElement(widgetConfig);
        document.body.appendChild(widgetElement);
        
        // Set up drag and drop
        this.setupWidgetInteractions(widgetElement, widgetConfig);
        
        return {
            widgetId: widgetConfig.id,
            element: widgetElement,
            config: widgetConfig
        };
    }
    
    /**
     * Create widget DOM element
     */
    createWidgetElement(config) {
        const element = document.createElement('div');
        element.className = 'floating-widget';
        element.id = `widget-${config.id}`;
        element.style.cssText = `
            position: fixed;
            left: ${config.position.x}px;
            top: ${config.position.y}px;
            width: ${config.size?.width || 64}px;
            height: ${config.size?.height || 64}px;
            z-index: 9999;
            cursor: grab;
            user-select: none;
            transition: all 0.3s ease;
            border-radius: 50%;
            background: linear-gradient(45deg, #e94560, #4ecca3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        
        element.innerHTML = config.appearance?.icon || '🤖';
        
        return element;
    }
    
    /**
     * Set up widget interactions
     */
    setupWidgetInteractions(element, config) {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        element.addEventListener('mousedown', (e) => {
            isDragging = true;
            element.style.cursor = 'grabbing';
            
            const rect = element.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const newPosition = {
                x: e.clientX - dragOffset.x,
                y: e.clientY - dragOffset.y
            };
            
            element.style.left = newPosition.x + 'px';
            element.style.top = newPosition.y + 'px';
            
            // Update service
            this.service.updateWidgetPosition(config.id, newPosition);
        });
        
        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;
            
            isDragging = false;
            element.style.cursor = 'grab';
            
            // Check for drop targets
            const dropTarget = document.elementFromPoint(e.clientX, e.clientY);
            if (dropTarget && dropTarget !== element) {
                this.service.handleDragDrop(config.id, {
                    target: dropTarget,
                    position: {
                        x: parseInt(element.style.left),
                        y: parseInt(element.style.top)
                    }
                });
            }
        });
        
        // Double-click to morph
        element.addEventListener('dblclick', (e) => {
            const nearbyText = this.findNearbyText(element);
            if (nearbyText) {
                this.service.morphWidget(config.id, {
                    type: 'text',
                    content: nearbyText.textContent,
                    element: nearbyText
                });
            }
        });
    }
    
    /**
     * Find nearby text elements
     */
    findNearbyText(widgetElement) {
        const rect = widgetElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Search for text elements within 100px radius
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
        
        for (const element of textElements) {
            const elemRect = element.getBoundingClientRect();
            const elemCenterX = elemRect.left + elemRect.width / 2;
            const elemCenterY = elemRect.top + elemRect.height / 2;
            
            const distance = Math.sqrt(
                Math.pow(centerX - elemCenterX, 2) + 
                Math.pow(centerY - elemCenterY, 2)
            );
            
            if (distance < 100 && element.textContent.trim().length > 0) {
                return element;
            }
        }
        
        return null;
    }
}

// Auto-detect and set up logo click handlers
document.addEventListener('DOMContentLoaded', () => {
    const client = new WidgetIntegrationClient();
    
    client.init().then(() => {
        console.log('Widget Integration Client ready');
        
        // Set up logo click handlers
        const logoSelectors = [
            'svg[viewBox]',
            'img[src*="logo"]',
            'img[src*="brand"]',
            '.logo',
            '.brand',
            '#logo',
            '[data-widget-trigger]',
            'img[src$=".svg"]'
        ];
        
        logoSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                element.addEventListener('click', async (e) => {
                    try {
                        const widget = await client.createFloatingWidget(element);
                        console.log('Widget created:', widget.widgetId);
                    } catch (error) {
                        console.error('Failed to create widget:', error);
                    }
                });
                
                // Add hover effect
                element.style.cursor = 'pointer';
                element.title = 'Click to activate floating helper';
            });
        });
        
    }).catch(error => {
        console.error('Failed to initialize Widget Integration Client:', error);
    });
});

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        WidgetIntegrationService,
        WidgetIntegrationClient
    };
}

// Export for browser environments
if (typeof window !== 'undefined') {
    window.WidgetIntegration = {
        Service: WidgetIntegrationService,
        Client: WidgetIntegrationClient
    };
}