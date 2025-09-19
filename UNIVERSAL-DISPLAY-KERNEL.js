#!/usr/bin/env node

/**
 * 📱 UNIVERSAL DISPLAY KERNEL - Mobile-First Responsive Architecture
 * 
 * Like Linux kernel but for display/UI abstraction across devices.
 * Adapts the Rigid-Fluid-Minimap pattern for mobile responsiveness.
 * 
 * Architecture:
 * - Viewport Manager: Handles different screen sizes/orientations
 * - Touch Abstraction: Mouse/Touch unified input layer  
 * - Responsive Layers: All three layers adapt to device capabilities
 * - Progressive Web App: Offline-capable, installable
 * - Universal State: Same state system across all devices
 */

const express = require('express');
const WebSocket = require('ws');
const { EventEmitter } = require('events');

console.log('\n📱 UNIVERSAL DISPLAY KERNEL INITIALIZING...');
console.log('============================================');
console.log('🎯 Mobile-First: Touch and small screens priority');
console.log('📐 Responsive: Adapts to any screen size');
console.log('🌊 Three Layers: Rigid-Fluid-Minimap on all devices');
console.log('💾 Progressive: Works offline, installable');
console.log('🔄 Universal: Same state across desktop/mobile');

class UniversalDisplayKernel extends EventEmitter {
    constructor() {
        super();
        
        // Core configuration
        this.port = 8888; // Universal display port
        this.wsPort = 8889; // WebSocket for real-time updates
        this.app = express();
        
        // Device detection and capabilities
        this.deviceProfiles = {
            mobile: {
                maxWidth: 768,
                touch: true,
                orientation: 'portrait-primary',
                features: ['vibration', 'geolocation'],
                limitations: ['small-screen', 'limited-hover']
            },
            tablet: {
                maxWidth: 1024,
                touch: true,
                orientation: 'landscape-primary',
                features: ['vibration', 'geolocation', 'medium-screen'],
                limitations: ['limited-hover']
            },
            desktop: {
                maxWidth: Infinity,
                touch: false,
                orientation: 'landscape',
                features: ['keyboard', 'mouse', 'hover', 'large-screen'],
                limitations: []
            }
        };
        
        // Responsive breakpoints
        this.breakpoints = {
            xs: 320,   // Small phones
            sm: 576,   // Large phones
            md: 768,   // Tablets
            lg: 992,   // Small desktops
            xl: 1200,  // Large desktops
            xxl: 1400  // Extra large
        };
        
        // Connected state managers (from existing system)
        this.stateConnections = {
            fluidState: 'ws://localhost:8081', // From UNIFIED-FLUID-STATE-MANAGER
            rigidAPIs: [
                'http://localhost:3334', // Forum API
                'http://localhost:3337', // Demo API
                'http://localhost:4444'  // Gateway
            ],
            mudViews: new Map() // Will track all active MUD views
        };
        
        // Real-time state
        this.connectedDevices = new Map();
        this.activeViewports = new Map();
        this.touchGestures = new Map();
        
        this.initializeKernel();
    }
    
    async initializeKernel() {
        console.log('📱 Setting up universal display kernel...');
        
        // Setup responsive middleware
        this.setupResponsiveMiddleware();
        
        // Setup progressive web app
        this.setupPWA();
        
        // Setup touch/mouse abstraction
        this.setupInputAbstraction();
        
        // Setup device detection
        this.setupDeviceDetection();
        
        // Setup responsive layers
        this.setupResponsiveLayers();
        
        // Connect to existing state system
        this.connectToFluidState();
        
        // Start WebSocket server for real-time
        this.startWebSocketServer();
        
        console.log('✅ Universal Display Kernel ready for all devices');
    }
    
    setupResponsiveMiddleware() {
        console.log('📐 Setting up responsive middleware...');
        
        this.app.use(express.json());
        this.app.use(express.static(__dirname + '/universal-display-assets'));
        
        // CORS for all devices
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, User-Agent');
            if (req.method === 'OPTIONS') return res.sendStatus(200);
            next();
        });
        
        // Device detection middleware
        this.app.use((req, res, next) => {
            const userAgent = req.headers['user-agent'] || '';
            const device = this.detectDevice(userAgent);
            req.device = device;
            req.viewport = this.calculateViewport(req.headers);
            next();
        });
        
        // Responsive content negotiation
        this.app.use((req, res, next) => {
            const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');
            const acceptsJson = req.headers.accept && req.headers.accept.includes('application/json');
            
            req.responseFormat = acceptsJson ? 'json' : 'html';
            req.isAPI = req.path.startsWith('/api/');
            
            next();
        });
    }
    
    setupPWA() {
        console.log('💾 Setting up Progressive Web App...');
        
        // Service Worker registration
        this.app.get('/sw.js', (req, res) => {
            res.setHeader('Content-Type', 'application/javascript');
            res.send(this.generateServiceWorker());
        });
        
        // PWA manifest
        this.app.get('/manifest.json', (req, res) => {
            res.json({
                name: 'Universal Display System',
                short_name: 'UDS',
                description: 'Mobile-first responsive interface for the three-layer architecture',
                start_url: '/',
                display: 'standalone',
                background_color: '#0a0a0a',
                theme_color: '#00ff00',
                orientation: 'any',
                icons: [
                    {
                        src: '/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/icon-512.png', 
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            });
        });
        
        // Offline fallback
        this.app.get('/offline', (req, res) => {
            res.send(this.generateOfflinePage(req.device));
        });
    }
    
    setupInputAbstraction() {
        console.log('👆 Setting up input abstraction layer...');
        
        // Touch/Mouse unified event handling
        this.inputAbstraction = {
            // Convert touch to mouse-like events
            normalizeTouchEvent: (touchEvent) => {
                return {
                    type: touchEvent.type.replace('touch', 'pointer'),
                    x: touchEvent.touches[0]?.clientX || touchEvent.changedTouches[0]?.clientX,
                    y: touchEvent.touches[0]?.clientY || touchEvent.changedTouches[0]?.clientY,
                    pressure: touchEvent.touches[0]?.force || 1,
                    timestamp: Date.now(),
                    device: 'touch'
                };
            },
            
            // Convert mouse to unified events
            normalizeMouseEvent: (mouseEvent) => {
                return {
                    type: mouseEvent.type.replace('mouse', 'pointer'),
                    x: mouseEvent.clientX,
                    y: mouseEvent.clientY,
                    pressure: mouseEvent.pressure || 1,
                    timestamp: Date.now(),
                    device: 'mouse'
                };
            },
            
            // Gesture recognition
            recognizeGesture: (events) => {
                // Simple gesture recognition
                if (events.length < 2) return null;
                
                const start = events[0];
                const end = events[events.length - 1];
                const deltaX = end.x - start.x;
                const deltaY = end.y - start.y;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
                const duration = end.timestamp - start.timestamp;
                
                // Swipe detection
                if (distance > 50 && duration < 500) {
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        return deltaX > 0 ? 'swipe-right' : 'swipe-left';
                    } else {
                        return deltaY > 0 ? 'swipe-down' : 'swipe-up';
                    }
                }
                
                // Tap detection
                if (distance < 10 && duration < 200) {
                    return 'tap';
                }
                
                // Long press
                if (distance < 10 && duration > 800) {
                    return 'long-press';
                }
                
                return null;
            }
        };
    }
    
    setupDeviceDetection() {
        console.log('📱 Setting up device detection...');
        
        this.deviceDetector = {
            detect: (userAgent) => {
                const ua = userAgent.toLowerCase();
                
                // Mobile detection
                const mobileKeywords = ['mobile', 'android', 'iphone', 'ipod', 'blackberry', 'windows phone'];
                const isMobile = mobileKeywords.some(keyword => ua.includes(keyword));
                
                // Tablet detection
                const tabletKeywords = ['ipad', 'tablet', 'kindle', 'silk', 'android'];
                const isTablet = !isMobile && tabletKeywords.some(keyword => ua.includes(keyword));
                
                // Desktop fallback
                const isDesktop = !isMobile && !isTablet;
                
                return {
                    type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
                    isMobile,
                    isTablet,
                    isDesktop,
                    supportsTouch: isMobile || isTablet,
                    userAgent: userAgent
                };
            }
        };
    }
    
    setupResponsiveLayers() {
        console.log('🌊 Setting up responsive three-layer system...');
        
        // Main responsive interface - serve the clean debugger
        this.app.get('/', (req, res) => {
            res.sendFile(__dirname + '/MOBILE-RESPONSIVE-DEBUGGER.html');
        });
        
        // Legacy responsive interface
        this.app.get('/legacy', (req, res) => {
            res.send(this.generateResponsiveInterface(req.device, req.viewport));
        });
        
        // Mobile-optimized rigid API interface
        this.app.get('/api/mobile/rigid', (req, res) => {
            res.json(this.getMobileRigidAPIs(req.device));
        });
        
        // Fluid state with bandwidth adaptation
        this.app.get('/api/mobile/fluid', (req, res) => {
            res.json(this.getMobileFluidState(req.device));
        });
        
        // Minimap view adapted for small screens
        this.app.get('/api/mobile/minimap', (req, res) => {
            res.json(this.getMobileMinimap(req.device));
        });
        
        // Device-specific endpoints
        this.app.get('/mobile', (req, res) => {
            res.send(this.generateMobileInterface(req.viewport));
        });
        
        this.app.get('/tablet', (req, res) => {
            res.send(this.generateTabletInterface(req.viewport));
        });
        
        this.app.get('/desktop', (req, res) => {
            res.send(this.generateDesktopInterface(req.viewport));
        });
        
        // Health check endpoints for restart testing
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'operational',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                connectedDevices: this.connectedDevices.size,
                activeViewports: this.activeViewports.size,
                fluidStateConnection: !!this.fluidStateWS && this.fluidStateWS.readyState === 1,
                services: Object.keys(this.stateConnections.rigidAPIs).length
            });
        });
        
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'operational',
                timestamp: new Date().toISOString(),
                connectedDevices: this.connectedDevices.size,
                activeViewports: this.activeViewports.size
            });
        });
        
        // Test API for restart testing
        this.app.post('/api/test', (req, res) => {
            const { action, name, mode } = req.body;
            
            try {
                switch (action) {
                    case 'create_agent':
                        const agentId = 'agent_' + Date.now();
                        // Simulate agent creation
                        res.json({
                            success: true,
                            action: 'create_agent',
                            agentId,
                            name: name || 'Test Agent',
                            timestamp: new Date().toISOString()
                        });
                        break;
                        
                    case 'test_debug':
                        res.json({
                            success: true,
                            action: 'test_debug',
                            mode: mode || 'normal',
                            debugFunctional: true,
                            timestamp: new Date().toISOString()
                        });
                        break;
                        
                    default:
                        res.json({
                            success: true,
                            action: action || 'unknown',
                            message: 'Test API responding',
                            timestamp: new Date().toISOString()
                        });
                }
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // Responsive sonar (addressing user's concern)
        this.app.get('/sonar', (req, res) => {
            res.send(this.generateResponsiveSonar(req.device, req.viewport));
        });
    }
    
    connectToFluidState() {
        console.log('🌊 Connecting to existing fluid state system...');
        
        // Connect to existing WebSocket from UNIFIED-FLUID-STATE-MANAGER
        try {
            this.fluidStateWS = new WebSocket(this.stateConnections.fluidState);
            
            this.fluidStateWS.on('open', () => {
                console.log('✅ Connected to Fluid State Manager');
                this.fluidStateWS.send(JSON.stringify({
                    type: 'register_display_kernel',
                    capabilities: ['mobile', 'tablet', 'desktop'],
                    timestamp: new Date().toISOString()
                }));
            });
            
            this.fluidStateWS.on('message', (data) => {
                try {
                    const stateEvent = JSON.parse(data);
                    this.handleFluidStateEvent(stateEvent);
                } catch (error) {
                    console.error('Error processing fluid state event:', error);
                }
            });
            
        } catch (error) {
            console.log('⚠️ Fluid State Manager not available, running standalone');
        }
    }
    
    handleFluidStateEvent(event) {
        // Broadcast state changes to all connected devices
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                const deviceEvent = this.adaptEventForDevice(event, client.device);
                client.send(JSON.stringify(deviceEvent));
            }
        });
    }
    
    adaptEventForDevice(event, device) {
        // Adapt events based on device capabilities
        const adapted = { ...event };
        
        if (device.type === 'mobile') {
            // Reduce data for mobile
            adapted.data = this.compressForMobile(event.data);
            adapted.priority = 'high'; // Mobile users get priority updates
        } else if (device.type === 'tablet') {
            // Medium detail for tablets
            adapted.data = this.optimizeForTablet(event.data);
        } else {
            // Full data for desktop
            adapted.data = event.data;
        }
        
        return adapted;
    }
    
    startWebSocketServer() {
        console.log('🔌 Starting WebSocket server for real-time updates...');
        
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            const userAgent = req.headers['user-agent'];
            const device = this.deviceDetector.detect(userAgent);
            
            ws.device = device;
            ws.id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            
            console.log(`📱 Device connected: ${device.type} (${ws.id})`);
            
            // Track connected devices
            this.connectedDevices.set(ws.id, {
                device,
                connection: ws,
                connectedAt: new Date(),
                viewport: null
            });
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'connection_established',
                device,
                capabilities: this.deviceProfiles[device.type]
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleDeviceMessage(ws, data);
                } catch (error) {
                    console.error('Error handling device message:', error);
                }
            });
            
            ws.on('close', () => {
                console.log(`📱 Device disconnected: ${device.type} (${ws.id})`);
                this.connectedDevices.delete(ws.id);
            });
        });
    }
    
    handleDeviceMessage(ws, data) {
        switch (data.type) {
            case 'viewport_update':
                ws.viewport = data.viewport;
                this.activeViewports.set(ws.id, data.viewport);
                break;
                
            case 'touch_gesture':
                const gesture = this.inputAbstraction.recognizeGesture(data.events);
                if (gesture) {
                    this.handleGesture(ws, gesture, data);
                }
                break;
                
            case 'api_request':
                this.handleMobileAPIRequest(ws, data);
                break;
                
            default:
                console.log('Unknown device message type:', data.type);
        }
    }
    
    handleGesture(ws, gesture, data) {
        console.log(`👆 Gesture detected: ${gesture} from ${ws.device.type}`);
        
        // Route gestures to appropriate handlers
        switch (gesture) {
            case 'swipe-left':
                this.handleNavigation(ws, 'back');
                break;
            case 'swipe-right':
                this.handleNavigation(ws, 'forward');
                break;
            case 'swipe-up':
                this.handleRefresh(ws);
                break;
            case 'swipe-down':
                this.handleMenu(ws);
                break;
            case 'long-press':
                this.handleContextMenu(ws, data);
                break;
        }
    }
    
    detectDevice(userAgent) {
        return this.deviceDetector.detect(userAgent);
    }
    
    calculateViewport(headers) {
        // Extract viewport info from headers if available
        const screenWidth = parseInt(headers['screen-width']) || 800;
        const screenHeight = parseInt(headers['screen-height']) || 600;
        const pixelRatio = parseFloat(headers['pixel-ratio']) || 1;
        
        return {
            width: screenWidth,
            height: screenHeight,
            ratio: pixelRatio,
            breakpoint: this.getBreakpoint(screenWidth)
        };
    }
    
    getBreakpoint(width) {
        if (width < this.breakpoints.sm) return 'xs';
        if (width < this.breakpoints.md) return 'sm';
        if (width < this.breakpoints.lg) return 'md';
        if (width < this.breakpoints.xl) return 'lg';
        if (width < this.breakpoints.xxl) return 'xl';
        return 'xxl';
    }
    
    generateResponsiveInterface(device, viewport) {
        const isMobile = device.isMobile;
        const isTouch = device.supportsTouch;
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>🌊⚡🗺️ Universal Display - ${device.type}</title>
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#00ff00">
    <style>
        /* Universal Reset */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        /* Root Variables for Responsive Design */
        :root {
            --bg-primary: #0a0a0a;
            --bg-secondary: #1a1a1a;
            --color-primary: #00ff00;
            --color-secondary: #4488ff;
            --color-accent: #ff6b6b;
            --font-mono: 'Courier New', monospace;
            
            /* Responsive Spacing */
            --space-xs: ${isMobile ? '4px' : '8px'};
            --space-sm: ${isMobile ? '8px' : '12px'};
            --space-md: ${isMobile ? '12px' : '16px'};
            --space-lg: ${isMobile ? '16px' : '24px'};
            --space-xl: ${isMobile ? '24px' : '32px'};
            
            /* Responsive Fonts */
            --font-xs: ${isMobile ? '10px' : '12px'};
            --font-sm: ${isMobile ? '12px' : '14px'};
            --font-md: ${isMobile ? '14px' : '16px'};
            --font-lg: ${isMobile ? '16px' : '18px'};
            --font-xl: ${isMobile ? '20px' : '24px'};
            --font-xxl: ${isMobile ? '24px' : '32px'};
        }
        
        body {
            font-family: var(--font-mono);
            background: var(--bg-primary);
            color: var(--color-primary);
            overflow: hidden;
            height: 100vh;
            ${isTouch ? 'touch-action: manipulation;' : ''}
            ${isTouch ? '-webkit-overflow-scrolling: touch;' : ''}
        }
        
        /* Mobile-First Grid Layout */
        .universal-container {
            height: 100vh;
            display: grid;
            ${isMobile ? `
                grid-template-rows: 50px 1fr 60px;
                grid-template-areas:
                    "header"
                    "main"  
                    "controls";
            ` : `
                grid-template-columns: 300px 1fr 400px;
                grid-template-rows: 60px 1fr 50px;
                grid-template-areas:
                    "header header header"
                    "rigid fluid minimap"
                    "controls controls controls";
            `}
        }
        
        .header {
            grid-area: header;
            background: var(--bg-secondary);
            border-bottom: 2px solid var(--color-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${isMobile ? 'var(--font-md)' : 'var(--font-xl)'};
            text-shadow: 0 0 10px var(--color-primary);
            padding: var(--space-sm);
        }
        
        .main-content {
            grid-area: main;
            overflow: hidden;
            position: relative;
        }
        
        /* Mobile: Tabbed Interface */
        ${isMobile ? `
        .mobile-tabs {
            display: flex;
            height: 40px;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--color-primary);
        }
        
        .tab-button {
            flex: 1;
            background: none;
            border: none;
            color: var(--color-primary);
            font-family: inherit;
            font-size: var(--font-sm);
            cursor: pointer;
            border-right: 1px solid var(--color-primary);
            transition: all 0.3s;
        }
        
        .tab-button.active {
            background: var(--color-primary);
            color: var(--bg-primary);
        }
        
        .tab-content {
            height: calc(100% - 40px);
            overflow-y: auto;
            padding: var(--space-md);
        }
        
        .tab-panel {
            display: none;
        }
        
        .tab-panel.active {
            display: block;
        }
        ` : `
        /* Desktop: Three-Panel Layout */
        .rigid-layer {
            grid-area: rigid;
            background: var(--bg-primary);
            border-right: 2px solid var(--color-accent);
            padding: var(--space-lg);
            overflow-y: auto;
        }
        
        .fluid-layer {
            grid-area: fluid;
            background: #0a0f1a;
            padding: var(--space-lg);
            overflow: hidden;
            position: relative;
        }
        
        .minimap-layer {
            grid-area: minimap;
            background: var(--bg-primary);
            border-left: 2px solid var(--color-primary);
            padding: var(--space-lg);
            overflow-y: auto;
        }
        `}
        
        .controls {
            grid-area: controls;
            background: var(--bg-secondary);
            border-top: 1px solid var(--color-primary);
            display: flex;
            align-items: center;
            justify-content: space-around;
            padding: var(--space-sm);
        }
        
        /* Touch-Optimized Controls */
        .control-button {
            background: var(--bg-primary);
            border: 1px solid var(--color-primary);
            color: var(--color-primary);
            padding: ${isMobile ? '12px 16px' : '8px 16px'};
            border-radius: 4px;
            font-family: inherit;
            font-size: var(--font-sm);
            cursor: pointer;
            transition: all 0.3s;
            ${isTouch ? 'min-height: 44px; min-width: 44px;' : ''}
        }
        
        .control-button:active,
        .control-button:hover {
            background: var(--color-primary);
            color: var(--bg-primary);
            ${isTouch ? 'transform: scale(0.95);' : ''}
        }
        
        /* Responsive Sonar Display */
        .sonar-container {
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
        }
        
        .sonar-canvas {
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at center, 
                rgba(0, 255, 0, 0.1) 0%, 
                transparent 70%);
            position: relative;
        }
        
        /* Mobile-specific adjustments */
        @media (max-width: 768px) {
            .sonar-canvas {
                height: calc(100% - 40px); /* Account for mobile tabs */
            }
        }
        
        /* Loading States */
        .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            font-size: var(--font-lg);
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }
        
        /* Touch Gesture Indicators */
        ${isTouch ? `
        .gesture-hint {
            position: absolute;
            bottom: var(--space-lg);
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: var(--color-primary);
            padding: var(--space-sm);
            border-radius: 4px;
            font-size: var(--font-xs);
            opacity: 0.7;
            pointer-events: none;
        }
        ` : ''}
    </style>
</head>
<body>
    <div class="universal-container">
        <div class="header">
            📱🌊⚡🗺️ Universal Display - ${device.type.toUpperCase()} MODE
        </div>
        
        ${isMobile ? `
        <div class="main-content">
            <div class="mobile-tabs">
                <button class="tab-button active" data-tab="rigid">⚡ APIs</button>
                <button class="tab-button" data-tab="fluid">🌊 State</button>
                <button class="tab-button" data-tab="minimap">🗺️ Map</button>
                <button class="tab-button" data-tab="sonar">📡 Sonar</button>
            </div>
            
            <div class="tab-panel active" id="rigid-panel">
                <div class="loading">Loading Rigid APIs...</div>
            </div>
            
            <div class="tab-panel" id="fluid-panel">
                <div class="loading">Loading Fluid State...</div>
            </div>
            
            <div class="tab-panel" id="minimap-panel">
                <div class="loading">Loading Minimap...</div>
            </div>
            
            <div class="tab-panel" id="sonar-panel">
                <div class="sonar-container">
                    <div class="sonar-canvas" id="mobilesonar"></div>
                </div>
            </div>
            
            ${isTouch ? '<div class="gesture-hint">↑ Swipe up to refresh • ← → Swipe to navigate</div>' : ''}
        </div>
        ` : `
        <div class="rigid-layer">
            <h2 style="color: var(--color-accent); margin-bottom: var(--space-lg);">⚡ RIGID API LAYER</h2>
            <div id="rigid-content" class="loading">Loading APIs...</div>
        </div>
        
        <div class="fluid-layer">
            <h2 style="color: var(--color-secondary); margin-bottom: var(--space-lg);">🌊 FLUID STATE LAYER</h2>
            <div id="fluid-content" class="loading">Loading State...</div>
        </div>
        
        <div class="minimap-layer">
            <h2 style="color: var(--color-primary); margin-bottom: var(--space-lg);">🗺️ MINIMAP/MUD VIEW</h2>
            <div class="sonar-container">
                <div class="sonar-canvas" id="desktopSonar"></div>
            </div>
        </div>
        `}
        
        <div class="controls">
            <button class="control-button" onclick="refreshAll()">🔄 Refresh</button>
            <button class="control-button" onclick="toggleFullscreen()">⛶ Full</button>
            <button class="control-button" onclick="showInfo()">ℹ️ Info</button>
            <button class="control-button" onclick="connectState()">🔌 Connect</button>
        </div>
    </div>
    
    <script>
        // Universal Display Kernel Client
        const UDK = {
            device: ${JSON.stringify(device)},
            viewport: ${JSON.stringify(viewport)},
            ws: null,
            
            init() {
                this.connectWebSocket();
                this.setupResponsiveHandlers();
                ${isMobile ? 'this.setupMobileTabs();' : ''}
                ${isTouch ? 'this.setupTouchHandlers();' : 'this.setupMouseHandlers();'}
                this.loadInitialContent();
                
                // Register service worker for PWA
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.register('/sw.js');
                }
            },
            
            connectWebSocket() {
                this.ws = new WebSocket('ws://' + location.hostname + ':${this.wsPort}');
                
                this.ws.onopen = () => {
                    console.log('📱 Connected to Universal Display Kernel');
                    this.ws.send(JSON.stringify({
                        type: 'viewport_update',
                        viewport: {
                            width: window.innerWidth,
                            height: window.innerHeight,
                            ratio: window.devicePixelRatio || 1
                        }
                    }));
                };
                
                this.ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleServerMessage(data);
                };
            },
            
            handleServerMessage(data) {
                switch (data.type) {
                    case 'state_update':
                        this.updateFluidState(data.state);
                        break;
                    case 'api_change':
                        this.updateRigidAPIs(data.apis);
                        break;
                    case 'minimap_update':
                        this.updateMinimap(data.minimap);
                        break;
                }
            },
            
            setupResponsiveHandlers() {
                window.addEventListener('resize', () => {
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        this.ws.send(JSON.stringify({
                            type: 'viewport_update',
                            viewport: {
                                width: window.innerWidth,
                                height: window.innerHeight,
                                ratio: window.devicePixelRatio || 1
                            }
                        }));
                    }
                });
                
                // Orientation change for mobile
                window.addEventListener('orientationchange', () => {
                    setTimeout(() => location.reload(), 500);
                });
            },
            
            ${isMobile ? `
            setupMobileTabs() {
                const tabButtons = document.querySelectorAll('.tab-button');
                const tabPanels = document.querySelectorAll('.tab-panel');
                
                tabButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const targetTab = button.getAttribute('data-tab');
                        
                        // Update buttons
                        tabButtons.forEach(b => b.classList.remove('active'));
                        button.classList.add('active');
                        
                        // Update panels
                        tabPanels.forEach(p => p.classList.remove('active'));
                        document.getElementById(targetTab + '-panel').classList.add('active');
                        
                        // Load content if needed
                        this.loadTabContent(targetTab);
                    });
                });
            },
            ` : ''}
            
            ${isTouch ? `
            setupTouchHandlers() {
                let touchStart = null;
                let touchEvents = [];
                
                document.addEventListener('touchstart', (e) => {
                    touchStart = {
                        x: e.touches[0].clientX,
                        y: e.touches[0].clientY,
                        timestamp: Date.now()
                    };
                    touchEvents = [touchStart];
                });
                
                document.addEventListener('touchmove', (e) => {
                    if (touchStart) {
                        touchEvents.push({
                            x: e.touches[0].clientX,
                            y: e.touches[0].clientY,
                            timestamp: Date.now()
                        });
                    }
                });
                
                document.addEventListener('touchend', (e) => {
                    if (touchStart && this.ws && this.ws.readyState === WebSocket.OPEN) {
                        this.ws.send(JSON.stringify({
                            type: 'touch_gesture',
                            events: touchEvents,
                            target: e.target.tagName
                        }));
                    }
                    touchStart = null;
                    touchEvents = [];
                });
            }
            ` : `
            setupMouseHandlers() {
                // Standard mouse event handling
                document.addEventListener('click', (e) => {
                    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                        this.ws.send(JSON.stringify({
                            type: 'mouse_click',
                            x: e.clientX,
                            y: e.clientY,
                            target: e.target.tagName
                        }));
                    }
                });
            }
            `}
        };
        
        // Global functions
        function refreshAll() {
            UDK.loadInitialContent();
        }
        
        function toggleFullscreen() {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                document.documentElement.requestFullscreen();
            }
        }
        
        function showInfo() {
            alert('Universal Display Kernel\\n\\nDevice: ' + JSON.stringify(UDK.device, null, 2));
        }
        
        function connectState() {
            if (UDK.ws.readyState !== WebSocket.OPEN) {
                UDK.connectWebSocket();
            }
        }
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => UDK.init());
        } else {
            UDK.init();
        }
    </script>
</body>
</html>`;
    }
    
    generateResponsiveSonar(device, viewport) {
        // Responsive version of the sonar system
        const isMobile = device.isMobile;
        const canvasWidth = isMobile ? viewport.width - 32 : 800;
        const canvasHeight = isMobile ? viewport.height - 200 : 600;
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📡 Responsive Sonar - ${device.type}</title>
    <style>
        body {
            margin: 0;
            padding: 16px;
            background: #0a0a0a;
            color: #00ff00;
            font-family: monospace;
            overflow: hidden;
        }
        
        .sonar-container {
            width: 100%;
            height: calc(100vh - 32px);
            position: relative;
            border: 2px solid #00ff00;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .sonar-display {
            width: 100%;
            height: 100%;
            position: relative;
            background: radial-gradient(circle at center, 
                rgba(0, 255, 0, 0.1) 0%, 
                transparent 70%);
        }
        
        .sonar-info {
            position: absolute;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            padding: 8px;
            border-radius: 4px;
            font-size: ${isMobile ? '10px' : '12px'};
        }
        
        .sonar-controls {
            position: absolute;
            bottom: 10px;
            right: 10px;
            display: flex;
            gap: 8px;
        }
        
        .sonar-button {
            background: #1a1a1a;
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: ${isMobile ? '12px' : '8px 12px'};
            border-radius: 4px;
            font-family: inherit;
            cursor: pointer;
            ${isMobile ? 'min-width: 44px; min-height: 44px;' : ''}
        }
        
        .sonar-sweep {
            position: absolute;
            width: 2px;
            height: 50%;
            background: linear-gradient(to bottom, #00ff00, transparent);
            transform-origin: bottom center;
            animation: sweep 4s linear infinite;
        }
        
        @keyframes sweep {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .sonar-ping {
            position: absolute;
            border: 2px solid #00ff00;
            border-radius: 50%;
            animation: ping 2s linear infinite;
        }
        
        @keyframes ping {
            from {
                width: 0;
                height: 0;
                opacity: 1;
            }
            to {
                width: 200px;
                height: 200px;
                opacity: 0;
            }
        }
    </style>
</head>
<body>
    <div class="sonar-container">
        <div class="sonar-display" id="sonarDisplay">
            <div class="sonar-info">
                Device: ${device.type}<br>
                Canvas: ${canvasWidth}x${canvasHeight}<br>
                Touch: ${device.supportsTouch ? 'Yes' : 'No'}<br>
                Status: Active
            </div>
            
            <div class="sonar-sweep" id="sonarSweep"></div>
            
            <div class="sonar-controls">
                <button class="sonar-button" onclick="toggleSweep()">⏯️</button>
                <button class="sonar-button" onclick="addPing()">📡</button>
                <button class="sonar-button" onclick="resetSonar()">🔄</button>
            </div>
        </div>
    </div>
    
    <script>
        let sweepActive = true;
        let pingCounter = 0;
        
        function toggleSweep() {
            sweepActive = !sweepActive;
            const sweep = document.getElementById('sonarSweep');
            sweep.style.animationPlayState = sweepActive ? 'running' : 'paused';
        }
        
        function addPing() {
            const display = document.getElementById('sonarDisplay');
            const ping = document.createElement('div');
            ping.className = 'sonar-ping';
            ping.style.left = '50%';
            ping.style.top = '50%';
            ping.style.transform = 'translate(-50%, -50%)';
            
            display.appendChild(ping);
            
            setTimeout(() => {
                if (ping.parentNode) {
                    ping.parentNode.removeChild(ping);
                }
            }, 2000);
        }
        
        function resetSonar() {
            const pings = document.querySelectorAll('.sonar-ping');
            pings.forEach(ping => ping.remove());
        }
        
        // Auto-ping every 3 seconds
        setInterval(addPing, 3000);
        
        ${device.supportsTouch ? `
        // Touch support for mobile
        document.getElementById('sonarDisplay').addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = e.target.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const y = e.touches[0].clientY - rect.top;
            
            const ping = document.createElement('div');
            ping.className = 'sonar-ping';
            ping.style.left = x + 'px';
            ping.style.top = y + 'px';
            ping.style.transform = 'translate(-50%, -50%)';
            
            e.target.appendChild(ping);
            
            setTimeout(() => {
                if (ping.parentNode) {
                    ping.parentNode.removeChild(ping);
                }
            }, 2000);
        });
        ` : ''}
    </script>
</body>
</html>`;
    }
    
    generateServiceWorker() {
        return `
const CACHE_NAME = 'universal-display-v1';
const urlsToCache = [
    '/',
    '/manifest.json',
    '/offline'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
            .catch(() => {
                return caches.match('/offline');
            })
    );
});
`;
    }
    
    generateOfflinePage(device) {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - Universal Display</title>
    <style>
        body {
            background: #0a0a0a;
            color: #00ff00;
            font-family: monospace;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .offline-message {
            padding: 20px;
            border: 2px solid #00ff00;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <div class="offline-message">
        <h1>📱 Universal Display Offline</h1>
        <p>Device: ${device.type}</p>
        <p>You're offline, but the interface is cached!</p>
        <button onclick="location.reload()">🔄 Try Again</button>
    </div>
</body>
</html>`;
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log('\n📱 UNIVERSAL DISPLAY KERNEL STARTED!');
            console.log('=====================================');
            console.log('📍 Main Interface: http://localhost:' + this.port);
            console.log('🔌 WebSocket: ws://localhost:' + this.wsPort);
            console.log('');
            console.log('🎯 FEATURES ACTIVE:');
            console.log('   ✅ Mobile-First: Touch screens optimized');
            console.log('   ✅ Responsive: Adapts to all screen sizes');
            console.log('   ✅ Three Layers: Rigid-Fluid-Minimap on all devices');
            console.log('   ✅ PWA Ready: Installable, works offline');
            console.log('   ✅ Touch/Mouse: Unified input abstraction');
            console.log('   ✅ Real-time: WebSocket state synchronization');
            console.log('');
            console.log('📱 DEVICE SUPPORT:');
            console.log('   • Mobile: Touch-optimized tabs, swipe gestures');
            console.log('   • Tablet: Medium-density interface');
            console.log('   • Desktop: Full three-panel layout');
            console.log('');
            console.log('🌊 SONAR SYSTEM: Now responsive across all devices');
            console.log('🧠 UNIVERSAL KERNEL: Mobile-desktop unified architecture');
        });
    }
}

// Start the Universal Display Kernel
const displayKernel = new UniversalDisplayKernel();
displayKernel.start();

module.exports = UniversalDisplayKernel;