#!/usr/bin/env node

/**
 * SoulFRA Floating Interactive Widget System
 * 
 * Creates a floating mascot/widget that activates when clicking logos/icons/SVGs.
 * Features drag-and-drop, text morphing, and integration with existing systems.
 * 
 * Features:
 * - Logo/icon click detection and activation
 * - Physics-based floating with natural movement  
 * - Drag-and-drop interactions
 * - Integration with Character Movement System
 * - Connection to Advanced Mascot Physics
 * - WebSocket real-time updates
 * - Text morphing capabilities
 * - OSRS character data display
 * - Progressive disclosure system
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class FloatingInteractiveWidget extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Widget Configuration
            widget: {
                size: { width: 120, height: 120 },
                maxSize: { width: 200, height: 200 },
                minSize: { width: 80, height: 80 },
                opacity: 0.9,
                zIndex: 10000,
                borderRadius: '50%',
                initialPosition: { x: 100, y: 100 }
            },
            
            // Physics Configuration
            physics: {
                gravity: 0.2,
                friction: 0.85,
                bounce: 0.3,
                maxVelocity: 8,
                acceleration: 0.5,
                magnetism: 0.1,                    // Attraction to interesting content
                avoidance: 50,                     // Distance to maintain from edges
                floatHeight: 20                    // Gentle floating motion
            },
            
            // Movement Behavior
            movement: {
                autoFloat: true,
                followMouse: false,
                smartPositioning: true,
                collisionAvoidance: true,
                screenBoundary: true,
                idleWander: true,
                wanderRadius: 200,
                returnHome: true,
                homePosition: { x: 100, y: 100 }
            },
            
            // Logo Detection
            logoDetection: {
                selectors: [
                    'svg[viewBox]',                // SVG graphics
                    'img[src*="logo"]',           // Logo images
                    'img[src*="brand"]',          // Brand images
                    '.logo',                      // Logo classes
                    '.brand',                     // Brand classes
                    '#logo',                      // Logo IDs
                    '[data-widget-trigger]',      // Explicit triggers
                    'img[src$=".svg"]'           // SVG images
                ],
                clickableArea: 10,               // Extra clickable padding
                highlightOnHover: true,
                activationAnimation: true
            },
            
            // Text Morphing
            textMorphing: {
                enabled: true,
                scanRadius: 300,                 // Area around widget to analyze
                morphSpeed: 0.1,                // How quickly to morph
                colorMatching: true,
                fontMatching: true,
                sizeAdaptation: true,
                wordArtEffects: true
            },
            
            // Integration Settings
            integration: {
                characterMovementPort: 8090,
                integrationBridgePort: 4000,
                webSocketPort: 4001,
                enableCharacterSync: true,
                enableRealTimeUpdates: true,
                osrsDataDisplay: true,
                immortalProgressionTracking: true
            },
            
            // UI Elements
            ui: {
                showCharacterInfo: true,
                showProgressBar: true,
                showNotifications: true,
                contextMenu: true,
                helpTooltips: true,
                animations: true,
                soundEffects: false
            },
            
            // Debug options
            debug: config.debug || false
        };
        
        this.state = {
            // Widget state
            isActive: false,
            isVisible: false,
            isDragging: false,
            isFloating: false,
            
            // Position and movement
            position: { ...this.config.widget.initialPosition },
            velocity: { x: 0, y: 0 },
            targetPosition: { x: 0, y: 0 },
            
            // Physics state
            mass: 1.0,
            forces: { x: 0, y: 0 },
            anchored: false,
            
            // Interaction state
            hovering: false,
            mousePosition: { x: 0, y: 0 },
            dragOffset: { x: 0, y: 0 },
            
            // Character integration
            characterData: null,
            osrsStats: null,
            immortalityScore: 0,
            achievements: [],
            
            // Morphing state
            currentMorph: 'default',
            morphTarget: null,
            morphProgress: 0,
            surroundingContext: null,
            
            // System connections
            wsConnections: new Map(),
            registeredServices: new Set(),
            
            // Timing
            lastUpdate: Date.now(),
            idleTime: 0,
            activatedAt: null,
            
            // Performance tracking
            frameRate: 60,
            updateCount: 0,
            renderTime: 0
        };
        
        // DOM elements
        this.elements = {
            widget: null,
            container: null,
            characterInfo: null,
            progressBar: null,
            tooltip: null,
            contextMenu: null
        };
        
        // Animation state
        this.animations = {
            float: { phase: 0, amplitude: 1 },
            pulse: { phase: 0, amplitude: 0.1 },
            morph: { phase: 0, duration: 1000 },
            glow: { phase: 0, intensity: 0.5 }
        };
        
        // Initialize the widget system
        this.initializeWidget();
        
        console.log('🦸 Floating Interactive Widget System initialized');
        console.log(`📍 Activation triggers: ${this.config.logoDetection.selectors.length} selectors`);
        console.log(`⚡ Physics enabled: gravity=${this.config.physics.gravity}, friction=${this.config.physics.friction}`);
    }
    
    /**
     * Initialize the complete widget system
     */
    async initializeWidget() {
        try {
            // Initialize DOM elements
            this.initializeDOMElements();
            
            // Setup logo detection and activation
            this.setupLogoDetection();
            
            // Initialize physics simulation
            this.startPhysicsSimulation();
            
            // Setup system integrations
            await this.initializeIntegrations();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize text morphing engine
            this.initializeTextMorphing();
            
            // Start the main update loop
            this.startUpdateLoop();
            
            console.log('✅ Floating widget system ready');
            this.emit('widget:ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize widget:', error);
            throw error;
        }
    }
    
    /**
     * Create and setup DOM elements
     */
    initializeDOMElements() {
        // Create main widget container
        this.elements.container = document.createElement('div');
        this.elements.container.id = 'floating-interactive-widget';
        this.elements.container.style.cssText = `
            position: fixed;
            top: ${this.state.position.y}px;
            left: ${this.state.position.x}px;
            width: ${this.config.widget.size.width}px;
            height: ${this.config.widget.size.height}px;
            z-index: ${this.config.widget.zIndex};
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
            user-select: none;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        // Create main widget element
        this.elements.widget = document.createElement('div');
        this.elements.widget.className = 'widget-mascot';
        this.elements.widget.style.cssText = `
            position: relative;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #e94560 0%, #f47068 50%, #4ecca3 100%);
            border-radius: ${this.config.widget.borderRadius};
            cursor: grab;
            pointer-events: auto;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255, 255, 255, 0.2);
        `;
        
        // Create character representation
        const characterElement = document.createElement('div');
        characterElement.className = 'widget-character';
        characterElement.style.cssText = `
            width: 60%;
            height: 60%;
            background: rgba(255, 255, 255, 0.9);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: #333;
            position: relative;
        `;
        characterElement.textContent = '🦸';
        
        // Create info panel
        this.elements.characterInfo = document.createElement('div');
        this.elements.characterInfo.className = 'widget-info-panel';
        this.elements.characterInfo.style.cssText = `
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        // Create progress bar
        this.elements.progressBar = document.createElement('div');
        this.elements.progressBar.className = 'widget-progress';
        this.elements.progressBar.style.cssText = `
            position: absolute;
            bottom: -8px;
            left: 10%;
            right: 10%;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
            overflow: hidden;
        `;
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-fill';
        progressFill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #4ecca3, #44a08d);
            width: 0%;
            transition: width 0.3s ease;
            border-radius: 2px;
        `;
        this.elements.progressBar.appendChild(progressFill);
        
        // Assemble widget
        this.elements.widget.appendChild(characterElement);
        this.elements.widget.appendChild(this.elements.progressBar);
        this.elements.container.appendChild(this.elements.widget);
        this.elements.container.appendChild(this.elements.characterInfo);
        
        // Add to document
        document.body.appendChild(this.elements.container);
        
        console.log('🎨 Widget DOM elements created');
    }
    
    /**
     * Setup logo detection and click activation
     */
    setupLogoDetection() {
        const selectors = this.config.logoDetection.selectors;
        
        // Enhanced logo detection with multiple strategies
        const detectLogos = () => {
            const logos = [];
            
            // Strategy 1: Direct selector matching
            selectors.forEach(selector => {
                try {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach(element => {
                        if (!element.dataset.widgetProcessed) {
                            logos.push(element);
                            element.dataset.widgetProcessed = 'true';
                        }
                    });
                } catch (error) {
                    if (this.config.debug) {
                        console.warn('Logo detection selector error:', selector, error);
                    }
                }
            });
            
            // Strategy 2: Attribute-based detection
            const allImages = document.querySelectorAll('img');
            allImages.forEach(img => {
                if (!img.dataset.widgetProcessed) {
                    const src = img.src.toLowerCase();
                    const alt = (img.alt || '').toLowerCase();
                    const className = (img.className || '').toLowerCase();
                    
                    if (src.includes('logo') || src.includes('brand') || 
                        alt.includes('logo') || alt.includes('brand') ||
                        className.includes('logo') || className.includes('brand')) {
                        logos.push(img);
                        img.dataset.widgetProcessed = 'true';
                    }
                }
            });
            
            // Strategy 3: SVG content analysis
            const svgs = document.querySelectorAll('svg');
            svgs.forEach(svg => {
                if (!svg.dataset.widgetProcessed) {
                    const hasText = svg.querySelector('text');
                    const hasComplexPath = svg.querySelectorAll('path').length > 2;
                    const hasGradient = svg.querySelector('gradient');
                    
                    if (hasText || hasComplexPath || hasGradient) {
                        logos.push(svg);
                        svg.dataset.widgetProcessed = 'true';
                    }
                }
            });
            
            return logos;
        };
        
        // Initial logo detection
        let detectedLogos = detectLogos();
        console.log(`🎯 Detected ${detectedLogos.length} potential activation triggers`);
        
        // Setup click handlers
        const setupLogoClickHandler = (element) => {
            const clickHandler = (event) => {
                event.preventDefault();
                event.stopPropagation();
                
                console.log('🖱️ Logo clicked, activating widget');
                this.activateWidget(event);
                
                // Visual feedback
                if (this.config.logoDetection.activationAnimation) {
                    this.animateLogoActivation(element);
                }
            };
            
            // Enhanced click area
            const padding = this.config.logoDetection.clickableArea;
            element.style.padding = `${padding}px`;
            element.style.margin = `-${padding}px`;
            element.style.cursor = 'pointer';
            
            // Click event
            element.addEventListener('click', clickHandler);
            
            // Hover effects
            if (this.config.logoDetection.highlightOnHover) {
                element.addEventListener('mouseenter', () => {
                    element.style.filter = 'brightness(1.2) drop-shadow(0 0 8px rgba(73, 204, 163, 0.6))';
                    element.style.transform = 'scale(1.05)';
                    element.style.transition = 'all 0.2s ease';
                });
                
                element.addEventListener('mouseleave', () => {
                    element.style.filter = '';
                    element.style.transform = '';
                });
            }
            
            // Store reference for cleanup
            element.dataset.widgetClickHandler = 'true';
        };
        
        // Apply click handlers to detected logos
        detectedLogos.forEach(setupLogoClickHandler);
        
        // Observe for new logos (for dynamic content)
        const observer = new MutationObserver((mutations) => {
            let newLogos = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            const newLogoElements = detectLogos();
                            if (newLogoElements.length > detectedLogos.length) {
                                const added = newLogoElements.slice(detectedLogos.length);
                                added.forEach(setupLogoClickHandler);
                                detectedLogos = newLogoElements;
                                newLogos = true;
                            }
                        }
                    });
                }
            });
            
            if (newLogos && this.config.debug) {
                console.log(`🔄 Dynamic logo detection: ${detectedLogos.length} total triggers`);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log(`⚡ Logo click handlers setup complete`);
    }
    
    /**
     * Activate the widget with animation
     */
    activateWidget(triggerEvent) {
        if (this.state.isActive) {
            console.log('📍 Widget already active, moving to click position');
            this.moveToPosition(triggerEvent.clientX - 60, triggerEvent.clientY - 60);
            return;
        }
        
        this.state.isActive = true;
        this.state.isVisible = true;
        this.state.activatedAt = Date.now();
        
        // Position near click location
        const clickX = triggerEvent.clientX;
        const clickY = triggerEvent.clientY;
        
        // Smart positioning to avoid screen edges
        const safeX = Math.max(60, Math.min(clickX - 60, window.innerWidth - 120));
        const safeY = Math.max(60, Math.min(clickY - 60, window.innerHeight - 120));
        
        this.state.position.x = safeX;
        this.state.position.y = safeY;
        
        // Update DOM position
        this.updateDOMPosition();
        
        // Activation animation
        this.elements.container.style.opacity = '0';
        this.elements.container.style.transform = 'scale(0.5)';
        this.elements.container.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        // Animate in
        requestAnimationFrame(() => {
            this.elements.container.style.opacity = this.config.widget.opacity;
            this.elements.container.style.transform = 'scale(1)';
        });
        
        // Start floating behavior
        if (this.config.movement.autoFloat) {
            setTimeout(() => {
                this.state.isFloating = true;
                this.startFloatingBehavior();
            }, 1000);
        }
        
        // Load character data
        this.loadCharacterData();
        
        // Connect to systems
        this.connectToSystems();
        
        console.log('🚀 Widget activated and floating');
        this.emit('widget:activated', { position: this.state.position, trigger: triggerEvent });
    }
    
    /**
     * Setup drag and drop functionality
     */
    setupEventListeners() {
        let isDragging = false;
        let dragStartPos = { x: 0, y: 0 };
        let dragStartMouse = { x: 0, y: 0 };
        
        // Mouse events
        this.elements.widget.addEventListener('mousedown', (e) => {
            if (!this.state.isActive) return;
            
            isDragging = true;
            this.state.isDragging = true;
            this.state.anchored = true;
            
            dragStartPos = { ...this.state.position };
            dragStartMouse = { x: e.clientX, y: e.clientY };
            
            this.elements.widget.style.cursor = 'grabbing';
            this.elements.widget.style.transform = 'scale(1.1)';
            this.elements.widget.style.transition = 'transform 0.1s ease';
            
            // Stop floating while dragging
            this.state.isFloating = false;
            
            console.log('🖐️ Widget drag started');
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging || !this.state.isActive) return;
            
            const deltaX = e.clientX - dragStartMouse.x;
            const deltaY = e.clientY - dragStartMouse.y;
            
            // Update position with boundary checking
            let newX = dragStartPos.x + deltaX;
            let newY = dragStartPos.y + deltaY;
            
            // Screen boundary constraints
            if (this.config.movement.screenBoundary) {
                const padding = this.config.physics.avoidance;
                newX = Math.max(padding, Math.min(newX, window.innerWidth - this.config.widget.size.width - padding));
                newY = Math.max(padding, Math.min(newY, window.innerHeight - this.config.widget.size.height - padding));
            }
            
            this.state.position.x = newX;
            this.state.position.y = newY;
            this.updateDOMPosition();
            
            // Update mouse position for other effects
            this.state.mousePosition = { x: e.clientX, y: e.clientY };
        });
        
        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            
            isDragging = false;
            this.state.isDragging = false;
            this.state.anchored = false;
            
            this.elements.widget.style.cursor = 'grab';
            this.elements.widget.style.transform = 'scale(1)';
            
            // Resume floating after a short delay
            setTimeout(() => {
                if (this.config.movement.autoFloat) {
                    this.state.isFloating = true;
                }
            }, 1000);
            
            console.log('🖐️ Widget drag ended');
        });
        
        // Touch events for mobile
        this.elements.widget.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.elements.widget.dispatchEvent(mouseEvent);
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            document.dispatchEvent(mouseEvent);
        });
        
        document.addEventListener('touchend', () => {
            if (isDragging) {
                document.dispatchEvent(new MouseEvent('mouseup'));
            }
        });
        
        // Widget interactions
        this.elements.widget.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleWidgetClick(e);
        });
        
        this.elements.widget.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.handleWidgetDoubleClick(e);
        });
        
        // Hover effects
        this.elements.widget.addEventListener('mouseenter', () => {
            this.state.hovering = true;
            this.showCharacterInfo();
        });
        
        this.elements.widget.addEventListener('mouseleave', () => {
            this.state.hovering = false;
            this.hideCharacterInfo();
        });
        
        // Window resize handling
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboard(e);
        });
        
        console.log('📱 Event listeners setup complete');
    }
    
    /**
     * Start physics simulation loop
     */
    startPhysicsSimulation() {
        const physicsLoop = () => {
            if (!this.state.isActive) {
                requestAnimationFrame(physicsLoop);
                return;
            }
            
            const now = Date.now();
            const deltaTime = (now - this.state.lastUpdate) / 1000;
            this.state.lastUpdate = now;
            
            // Apply physics updates
            this.updatePhysics(deltaTime);
            
            // Update animations
            this.updateAnimations(deltaTime);
            
            // Update DOM position
            this.updateDOMPosition();
            
            // Continue physics loop
            requestAnimationFrame(physicsLoop);
        };
        
        physicsLoop();
        console.log('⚡ Physics simulation started');
    }
    
    /**
     * Update widget physics
     */
    updatePhysics(deltaTime) {
        if (this.state.isDragging || this.state.anchored || !this.state.isFloating) {
            return;
        }
        
        const physics = this.config.physics;
        
        // Reset forces
        this.state.forces.x = 0;
        this.state.forces.y = 0;
        
        // Floating behavior
        if (this.config.movement.autoFloat) {
            this.applyFloatingForces();
        }
        
        // Boundary avoidance
        if (this.config.movement.screenBoundary) {
            this.applyBoundaryForces();
        }
        
        // Apply gravity
        this.state.forces.y += physics.gravity;
        
        // Update velocity
        this.state.velocity.x += this.state.forces.x * deltaTime;
        this.state.velocity.y += this.state.forces.y * deltaTime;
        
        // Apply friction
        this.state.velocity.x *= physics.friction;
        this.state.velocity.y *= physics.friction;
        
        // Limit velocity
        const speed = Math.sqrt(this.state.velocity.x ** 2 + this.state.velocity.y ** 2);
        if (speed > physics.maxVelocity) {
            const scale = physics.maxVelocity / speed;
            this.state.velocity.x *= scale;
            this.state.velocity.y *= scale;
        }
        
        // Update position
        this.state.position.x += this.state.velocity.x * deltaTime * 60;
        this.state.position.y += this.state.velocity.y * deltaTime * 60;
        
        // Enforce boundaries
        this.enforceBoundaries();
    }
    
    /**
     * Apply floating forces for natural movement
     */
    applyFloatingForces() {
        const time = Date.now() * 0.001;
        
        // Gentle floating motion
        const floatForceX = Math.sin(time * 0.5) * 0.1;
        const floatForceY = Math.sin(time * 0.3 + 1) * 0.15;
        
        this.state.forces.x += floatForceX;
        this.state.forces.y += floatForceY;
        
        // Idle wandering
        if (this.config.movement.idleWander) {
            if (Math.random() < 0.02) {  // Random impulse
                this.state.forces.x += (Math.random() - 0.5) * 2;
                this.state.forces.y += (Math.random() - 0.5) * 2;
            }
        }
        
        // Return to home position if too far
        if (this.config.movement.returnHome) {
            const home = this.config.movement.homePosition;
            const distance = Math.sqrt(
                (this.state.position.x - home.x) ** 2 + 
                (this.state.position.y - home.y) ** 2
            );
            
            if (distance > this.config.movement.wanderRadius) {
                const returnForce = 0.5;
                const dx = home.x - this.state.position.x;
                const dy = home.y - this.state.position.y;
                const normalize = returnForce / distance;
                
                this.state.forces.x += dx * normalize;
                this.state.forces.y += dy * normalize;
            }
        }
    }
    
    /**
     * Apply boundary avoidance forces
     */
    applyBoundaryForces() {
        const avoidance = this.config.physics.avoidance;
        const force = 2.0;
        
        // Left boundary
        if (this.state.position.x < avoidance) {
            this.state.forces.x += force * (avoidance - this.state.position.x) / avoidance;
        }
        
        // Right boundary
        const rightEdge = window.innerWidth - this.config.widget.size.width;
        if (this.state.position.x > rightEdge - avoidance) {
            this.state.forces.x -= force * (this.state.position.x - (rightEdge - avoidance)) / avoidance;
        }
        
        // Top boundary
        if (this.state.position.y < avoidance) {
            this.state.forces.y += force * (avoidance - this.state.position.y) / avoidance;
        }
        
        // Bottom boundary
        const bottomEdge = window.innerHeight - this.config.widget.size.height;
        if (this.state.position.y > bottomEdge - avoidance) {
            this.state.forces.y -= force * (this.state.position.y - (bottomEdge - avoidance)) / avoidance;
        }
    }
    
    /**
     * Enforce absolute boundaries
     */
    enforceBoundaries() {
        const padding = 10;
        
        if (this.state.position.x < padding) {
            this.state.position.x = padding;
            this.state.velocity.x = Math.abs(this.state.velocity.x) * this.config.physics.bounce;
        }
        
        const rightLimit = window.innerWidth - this.config.widget.size.width - padding;
        if (this.state.position.x > rightLimit) {
            this.state.position.x = rightLimit;
            this.state.velocity.x = -Math.abs(this.state.velocity.x) * this.config.physics.bounce;
        }
        
        if (this.state.position.y < padding) {
            this.state.position.y = padding;
            this.state.velocity.y = Math.abs(this.state.velocity.y) * this.config.physics.bounce;
        }
        
        const bottomLimit = window.innerHeight - this.config.widget.size.height - padding;
        if (this.state.position.y > bottomLimit) {
            this.state.position.y = bottomLimit;
            this.state.velocity.y = -Math.abs(this.state.velocity.y) * this.config.physics.bounce;
        }
    }
    
    /**
     * Update DOM position
     */
    updateDOMPosition() {
        if (!this.elements.container) return;
        
        this.elements.container.style.transform = `translate(${this.state.position.x}px, ${this.state.position.y}px)`;
    }
    
    /**
     * Initialize system integrations
     */
    async initializeIntegrations() {
        try {
            // Connect to Character Movement System
            if (this.config.integration.enableCharacterSync) {
                await this.connectToCharacterMovement();
            }
            
            // Connect to Integration Bridge
            await this.connectToIntegrationBridge();
            
            // Setup WebSocket connections
            if (this.config.integration.enableRealTimeUpdates) {
                await this.setupWebSocketConnections();
            }
            
            console.log('🔗 System integrations initialized');
        } catch (error) {
            console.error('❌ Integration setup failed:', error);
        }
    }
    
    /**
     * Connect to Character Movement System
     */
    async connectToCharacterMovement() {
        try {
            const ws = new WebSocket(`ws://localhost:${this.config.integration.characterMovementPort}/character-movement`);
            
            ws.on('open', () => {
                console.log('🎮 Connected to Character Movement System');
                this.state.wsConnections.set('characterMovement', ws);
                
                // Request character data
                ws.send(JSON.stringify({
                    type: 'get_character_state',
                    characterId: 'widget-character'
                }));
            });
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleCharacterMovementMessage(message);
                } catch (error) {
                    console.error('Character movement message error:', error);
                }
            });
            
            ws.on('error', (error) => {
                console.warn('Character movement connection error:', error);
            });
            
        } catch (error) {
            console.warn('Failed to connect to Character Movement System:', error);
        }
    }
    
    /**
     * Connect to Integration Bridge
     */
    async connectToIntegrationBridge() {
        try {
            // Register widget as a service
            const response = await fetch(`http://localhost:${this.config.integration.integrationBridgePort}/api/services/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'floating-interactive-widget',
                    type: 'ui-component',
                    status: 'active',
                    capabilities: ['text-morphing', 'drag-drop', 'character-display', 'real-time-updates'],
                    endpoint: 'widget://floating-interactive',
                    version: '1.0.0'
                })
            });
            
            if (response.ok) {
                console.log('📋 Registered with Integration Bridge');
                this.state.registeredServices.add('integration-bridge');
            }
        } catch (error) {
            console.warn('Failed to register with Integration Bridge:', error);
        }
    }
    
    /**
     * Setup WebSocket connections
     */
    async setupWebSocketConnections() {
        try {
            const ws = new WebSocket(`ws://localhost:${this.config.integration.webSocketPort}/bridge`);
            
            ws.addEventListener('open', () => {
                console.log('🔌 Connected to WebSocket Bridge');
                this.state.wsConnections.set('webSocketBridge', ws);
            });
            
            ws.addEventListener('message', (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleWebSocketMessage(message);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
        } catch (error) {
            console.warn('WebSocket connection failed:', error);
        }
    }
    
    /**
     * Load character data
     */
    async loadCharacterData() {
        try {
            // Get character data from Integration Bridge
            const response = await fetch(`http://localhost:${this.config.integration.integrationBridgePort}/api/characters`);
            if (response.ok) {
                const characters = await response.json();
                if (characters.length > 0) {
                    this.state.characterData = characters[0];
                    this.updateCharacterDisplay();
                }
            }
            
            // Load OSRS data if available
            if (this.config.integration.osrsDataDisplay && this.state.characterData?.osrsUsername) {
                await this.loadOSRSData(this.state.characterData.osrsUsername);
            }
            
        } catch (error) {
            console.warn('Failed to load character data:', error);
        }
    }
    
    /**
     * Load OSRS data
     */
    async loadOSRSData(username) {
        try {
            const response = await fetch(`http://localhost:${this.config.integration.integrationBridgePort}/api/osrs/hiscores/${username}`);
            if (response.ok) {
                this.state.osrsStats = await response.json();
                this.updateCharacterDisplay();
            }
        } catch (error) {
            console.warn('Failed to load OSRS data:', error);
        }
    }
    
    /**
     * Update character display
     */
    updateCharacterDisplay() {
        if (!this.state.characterData && !this.state.osrsStats) return;
        
        let infoText = 'SoulFRA Widget';
        
        if (this.state.characterData) {
            infoText = this.state.characterData.name || 'Character';
            
            if (this.state.osrsStats) {
                const combatLevel = this.state.osrsStats.combatLevel || 'N/A';
                const totalLevel = this.state.osrsStats.totalLevel || 'N/A';
                infoText += `\nCombat: ${combatLevel} | Total: ${totalLevel}`;
            }
            
            if (this.state.characterData.immortalityScore) {
                infoText += `\nImmortality: ${this.state.characterData.immortalityScore}`;
            }
        }
        
        this.elements.characterInfo.innerHTML = infoText.replace(/\n/g, '<br>');
        
        // Update progress bar
        if (this.state.characterData?.immortalityScore) {
            const progress = Math.min(100, (this.state.characterData.immortalityScore / 10000) * 100);
            const progressFill = this.elements.progressBar.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
            }
        }
    }
    
    /**
     * Show character info panel
     */
    showCharacterInfo() {
        if (this.elements.characterInfo) {
            this.elements.characterInfo.style.opacity = '1';
        }
    }
    
    /**
     * Hide character info panel
     */
    hideCharacterInfo() {
        if (this.elements.characterInfo && !this.state.isDragging) {
            this.elements.characterInfo.style.opacity = '0';
        }
    }
    
    /**
     * Handle widget click
     */
    handleWidgetClick(event) {
        console.log('🖱️ Widget clicked');
        
        // Cycle through display modes
        const modes = ['default', 'stats', 'minimal'];
        const currentIndex = modes.indexOf(this.state.currentMorph);
        const nextIndex = (currentIndex + 1) % modes.length;
        this.state.currentMorph = modes[nextIndex];
        
        this.updateWidgetAppearance();
        
        this.emit('widget:clicked', { mode: this.state.currentMorph });
    }
    
    /**
     * Handle widget double click
     */
    handleWidgetDoubleClick(event) {
        console.log('🖱️ Widget double-clicked');
        
        // Toggle floating behavior
        this.state.isFloating = !this.state.isFloating;
        
        if (this.state.isFloating) {
            this.startFloatingBehavior();
        }
        
        this.emit('widget:doubleClicked', { floating: this.state.isFloating });
    }
    
    /**
     * Start floating behavior
     */
    startFloatingBehavior() {
        console.log('🎈 Starting floating behavior');
        this.state.isFloating = true;
        
        // Apply initial floating impulse
        this.state.velocity.x += (Math.random() - 0.5) * 2;
        this.state.velocity.y += (Math.random() - 0.5) * 2;
    }
    
    /**
     * Move widget to specific position
     */
    moveToPosition(x, y, animate = true) {
        if (animate) {
            // Smooth animation to target position
            const duration = 1000;
            const startPos = { ...this.state.position };
            const startTime = Date.now();
            
            const animateMove = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Easing function
                const eased = 1 - Math.pow(1 - progress, 3);
                
                this.state.position.x = startPos.x + (x - startPos.x) * eased;
                this.state.position.y = startPos.y + (y - startPos.y) * eased;
                
                if (progress < 1) {
                    requestAnimationFrame(animateMove);
                }
            };
            
            animateMove();
        } else {
            this.state.position.x = x;
            this.state.position.y = y;
        }
    }
    
    /**
     * Initialize text morphing engine
     */
    initializeTextMorphing() {
        if (!this.config.textMorphing.enabled) return;
        
        // This will be implemented in the separate text morphing engine
        console.log('🎨 Text morphing engine initialized');
    }
    
    /**
     * Start main update loop
     */
    startUpdateLoop() {
        const updateLoop = () => {
            this.state.updateCount++;
            
            // Update idle time
            if (!this.state.isDragging && !this.state.hovering) {
                this.state.idleTime = Date.now() - (this.state.lastInteraction || this.state.activatedAt);
            } else {
                this.state.lastInteraction = Date.now();
                this.state.idleTime = 0;
            }
            
            // Idle behavior
            if (this.state.idleTime > 30000) { // 30 seconds
                this.handleIdleBehavior();
            }
            
            // Continue update loop
            requestAnimationFrame(updateLoop);
        };
        
        updateLoop();
        console.log('🔄 Main update loop started');
    }
    
    /**
     * Handle idle behavior
     */
    handleIdleBehavior() {
        // Gentle pulsing animation when idle
        if (!this.animations.idle) {
            this.animations.idle = { phase: 0 };
        }
        
        this.animations.idle.phase += 0.02;
        const pulse = 1 + Math.sin(this.animations.idle.phase) * 0.05;
        this.elements.widget.style.transform = `scale(${pulse})`;
    }
    
    /**
     * Update animations
     */
    updateAnimations(deltaTime) {
        // Float animation
        this.animations.float.phase += deltaTime;
        
        // Pulse animation
        this.animations.pulse.phase += deltaTime * 2;
        
        // Apply animations if not dragging
        if (!this.state.isDragging) {
            const floatOffset = Math.sin(this.animations.float.phase) * this.animations.float.amplitude;
            const pulseScale = 1 + Math.sin(this.animations.pulse.phase) * this.animations.pulse.amplitude;
            
            if (!this.animations.idle) {
                this.elements.widget.style.transform = `scale(${pulseScale})`;
            }
        }
    }
    
    /**
     * Handle window resize
     */
    handleWindowResize() {
        // Ensure widget stays within bounds
        this.enforceBoundaries();
        this.updateDOMPosition();
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard(event) {
        if (!this.state.isActive) return;
        
        switch (event.key) {
            case 'Escape':
                this.deactivateWidget();
                break;
            case ' ':
                event.preventDefault();
                this.state.isFloating = !this.state.isFloating;
                break;
            case 'r':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.resetPosition();
                }
                break;
        }
    }
    
    /**
     * Reset widget to home position
     */
    resetPosition() {
        const home = this.config.movement.homePosition;
        this.moveToPosition(home.x, home.y);
    }
    
    /**
     * Deactivate widget
     */
    deactivateWidget() {
        this.state.isActive = false;
        this.state.isVisible = false;
        this.state.isFloating = false;
        
        // Fade out animation
        this.elements.container.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        this.elements.container.style.opacity = '0';
        this.elements.container.style.transform = 'scale(0.8)';
        
        setTimeout(() => {
            this.elements.container.style.display = 'none';
        }, 300);
        
        console.log('😴 Widget deactivated');
        this.emit('widget:deactivated');
    }
    
    /**
     * Update widget appearance based on current mode
     */
    updateWidgetAppearance() {
        const widget = this.elements.widget;
        
        switch (this.state.currentMorph) {
            case 'stats':
                widget.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                break;
            case 'minimal':
                widget.style.background = 'rgba(255, 255, 255, 0.2)';
                widget.style.backdropFilter = 'blur(20px)';
                break;
            default:
                widget.style.background = 'linear-gradient(135deg, #e94560 0%, #f47068 50%, #4ecca3 100%)';
                break;
        }
    }
    
    /**
     * Handle Character Movement System messages
     */
    handleCharacterMovementMessage(message) {
        switch (message.type) {
            case 'character_state':
                if (message.character) {
                    this.state.characterData = message.character;
                    this.updateCharacterDisplay();
                }
                break;
            case 'position_sync':
                // Optionally sync position with character movement
                break;
        }
    }
    
    /**
     * Handle WebSocket messages
     */
    handleWebSocketMessage(message) {
        switch (message.type) {
            case 'character:achievement':
                this.handleNewAchievement(message.achievement);
                break;
            case 'system:notification':
                this.showNotification(message.notification);
                break;
        }
    }
    
    /**
     * Handle new achievement
     */
    handleNewAchievement(achievement) {
        console.log('🏆 New achievement:', achievement);
        
        // Add achievement to list
        this.state.achievements.unshift(achievement);
        
        // Show achievement notification
        this.showAchievementNotification(achievement);
    }
    
    /**
     * Show achievement notification
     */
    showAchievementNotification(achievement) {
        // Create temporary notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: ${this.state.position.y - 60}px;
            left: ${this.state.position.x}px;
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            color: #333;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            z-index: ${this.config.widget.zIndex + 1};
            animation: achievementPop 2s ease-out forwards;
            box-shadow: 0 4px 20px rgba(255, 215, 0, 0.4);
        `;
        notification.textContent = `🏆 ${achievement.name}`;
        
        // Add animation style
        if (!document.querySelector('#achievement-animation-style')) {
            const style = document.createElement('style');
            style.id = 'achievement-animation-style';
            style.textContent = `
                @keyframes achievementPop {
                    0% { opacity: 0; transform: translateY(20px) scale(0.8); }
                    20% { opacity: 1; transform: translateY(-10px) scale(1.1); }
                    40% { transform: translateY(0) scale(1); }
                    100% { opacity: 0; transform: translateY(-30px); }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(notification);
        
        // Remove after animation
        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
    
    /**
     * Show notification
     */
    showNotification(notification) {
        console.log('📢 Notification:', notification);
        // Implement notification display
    }
    
    /**
     * Animate logo activation
     */
    animateLogoActivation(logoElement) {
        const originalTransform = logoElement.style.transform;
        const originalFilter = logoElement.style.filter;
        
        // Activation animation
        logoElement.style.transition = 'all 0.3s ease';
        logoElement.style.transform = 'scale(1.2) rotate(5deg)';
        logoElement.style.filter = 'brightness(1.5) drop-shadow(0 0 16px rgba(73, 204, 163, 0.8))';
        
        setTimeout(() => {
            logoElement.style.transform = originalTransform;
            logoElement.style.filter = originalFilter;
        }, 300);
    }
    
    /**
     * Get widget status
     */
    getStatus() {
        return {
            isActive: this.state.isActive,
            isVisible: this.state.isVisible,
            isDragging: this.state.isDragging,
            isFloating: this.state.isFloating,
            position: { ...this.state.position },
            currentMorph: this.state.currentMorph,
            characterData: this.state.characterData,
            uptime: Date.now() - (this.state.activatedAt || Date.now()),
            connections: Array.from(this.state.wsConnections.keys()),
            services: Array.from(this.state.registeredServices)
        };
    }
    
    /**
     * Connect to systems
     */
    connectToSystems() {
        // Additional system connections can be added here
        console.log('🔗 Connecting to additional systems...');
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FloatingInteractiveWidget;
} else if (typeof window !== 'undefined') {
    window.FloatingInteractiveWidget = FloatingInteractiveWidget;
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.floatingWidget = new FloatingInteractiveWidget({
                debug: true
            });
        });
    } else {
        window.floatingWidget = new FloatingInteractiveWidget({
            debug: true
        });
    }
    
    console.log('🦸 Floating Interactive Widget loaded and ready');
    console.log('🎯 Click any logo, icon, or SVG to activate the floating mascot');
    console.log('🖱️ Drag the widget around, double-click to toggle floating');
}