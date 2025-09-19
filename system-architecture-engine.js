/**
 * 🏗️ SYSTEM ARCHITECTURE ENGINE
 * Core 3D visualization engine for hardware, security, integration, and reasoning layers
 */

import * as THREE from 'three';

export default class SystemArchitectureEngine {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Engine state
        this.currentLayer = 'hardware';
        this.components = new Map();
        this.connections = new Map();
        this.particles = [];
        this.lights = [];
        
        // Layer groups
        this.layers = {
            hardware: new THREE.Group(),
            shadow: new THREE.Group(),
            integration: new THREE.Group(),
            reasoning: new THREE.Group(),
            game: new THREE.Group()
        };
        
        // System architecture data
        this.architecture = {
            hardware: {
                components: [
                    { id: 'web-server-1', type: 'server', name: 'Web Server Alpha', position: [-50, 20, 0], status: 'active' },
                    { id: 'web-server-2', type: 'server', name: 'Web Server Beta', position: [50, 20, 0], status: 'active' },
                    { id: 'database', type: 'database', name: 'PostgreSQL Master', position: [0, 10, -60], status: 'active' },
                    { id: 'cache', type: 'cache', name: 'Redis Cluster', position: [0, 30, 30], status: 'active' },
                    { id: 'load-balancer', type: 'load-balancer', name: 'HAProxy', position: [0, 40, 60], status: 'active' },
                    { id: 'router', type: 'router', name: 'Core Router', position: [0, 35, 100], status: 'active' }
                ],
                connections: [
                    { from: 'router', to: 'load-balancer', type: 'network', bandwidth: '10Gbps' },
                    { from: 'load-balancer', to: 'web-server-1', type: 'network', bandwidth: '1Gbps' },
                    { from: 'load-balancer', to: 'web-server-2', type: 'network', bandwidth: '1Gbps' },
                    { from: 'web-server-1', to: 'database', type: 'network', bandwidth: '1Gbps' },
                    { from: 'web-server-2', to: 'database', type: 'network', bandwidth: '1Gbps' },
                    { from: 'web-server-1', to: 'cache', type: 'network', bandwidth: '1Gbps' },
                    { from: 'web-server-2', to: 'cache', type: 'network', bandwidth: '1Gbps' }
                ]
            },
            shadow: {
                components: [
                    { id: 'auth-middleware', type: 'security', name: 'JWT Auth Layer', position: [0, 50, 40], status: 'active' },
                    { id: 'guardian', type: 'security', name: 'Request Guardian', position: [-30, 45, 20], status: 'active' },
                    { id: 'firewall', type: 'security', name: 'Security Firewall', position: [30, 45, 20], status: 'active' },
                    { id: 'fingerprint', type: 'security', name: 'Request Fingerprinter', position: [0, 40, 80], status: 'active' },
                    { id: 'blockchain', type: 'security', name: 'Blockchain Validator', position: [0, 30, 0], status: 'active' }
                ],
                shields: [
                    { componentId: 'web-server-1', strength: 0.8 },
                    { componentId: 'web-server-2', strength: 0.8 },
                    { componentId: 'database', strength: 0.95 }
                ]
            },
            integration: {
                components: [
                    { id: 'api-gateway', type: 'api', name: 'API Gateway', position: [0, 60, 0], status: 'active' },
                    { id: 'message-queue', type: 'queue', name: 'RabbitMQ', position: [-40, 25, -20], status: 'active' },
                    { id: 'service-mesh', type: 'mesh', name: 'Service Mesh', position: [40, 25, -20], status: 'active' },
                    { id: 'monitoring', type: 'monitor', name: 'Prometheus', position: [-60, 40, 40], status: 'active' },
                    { id: 'logging', type: 'logs', name: 'ELK Stack', position: [60, 40, 40], status: 'active' }
                ],
                flows: [
                    { from: 'api-gateway', to: 'web-server-1', type: 'http', rate: 100 },
                    { from: 'api-gateway', to: 'web-server-2', type: 'http', rate: 100 },
                    { from: 'web-server-1', to: 'message-queue', type: 'amqp', rate: 50 },
                    { from: 'web-server-2', to: 'message-queue', type: 'amqp', rate: 50 }
                ]
            },
            reasoning: {
                components: [
                    { id: 'claude-ai', type: 'ai', name: 'Claude Reasoning Engine', position: [0, 80, 0], status: 'active' },
                    { id: 'ollama', type: 'ai', name: 'Ollama Local AI', position: [-60, 70, -30], status: 'active' },
                    { id: 'knowledge-graph', type: 'knowledge', name: 'Knowledge Graph', position: [60, 70, -30], status: 'active' },
                    { id: 'reasoning-cache', type: 'cache', name: 'Reasoning Cache', position: [0, 60, -60], status: 'active' },
                    { id: 'feedback-loop', type: 'ml', name: 'Feedback System', position: [0, 90, 40], status: 'active' }
                ],
                neuralPaths: [
                    { from: 'claude-ai', to: 'knowledge-graph', strength: 0.9 },
                    { from: 'ollama', to: 'knowledge-graph', strength: 0.7 },
                    { from: 'reasoning-cache', to: 'claude-ai', strength: 0.8 },
                    { from: 'feedback-loop', to: 'claude-ai', strength: 0.6 }
                ]
            }
        };
        
        // Animation properties
        this.clock = new THREE.Clock();
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Performance tracking
        this.stats = {
            fps: 60,
            objects: 0,
            particles: 0,
            memory: 0
        };
    }
    
    async init() {
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.container,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Setup camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            10000
        );
        this.camera.position.set(0, 100, 200);
        
        // Setup controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Scene setup
        this.scene.background = new THREE.Color(0x000a1a);
        this.scene.fog = new THREE.Fog(0x000a1a, 100, 2000);
        
        // Add layers to scene
        Object.values(this.layers).forEach(layer => {
            this.scene.add(layer);
        });
        
        // Setup lighting
        this.setupLighting();
        
        // Start animation loop
        this.animate();
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Dynamic lights for each layer
        const layerColors = {
            hardware: 0x00ff00,
            shadow: 0xff0066,
            integration: 0x0066ff,
            reasoning: 0xffaa00,
            game: 0xff00ff
        };
        
        Object.entries(layerColors).forEach(([layer, color]) => {
            const light = new THREE.PointLight(color, 0.5, 200);
            light.position.set(0, 50, 0);
            this.lights.push({ layer, light });
            this.scene.add(light);
        });
    }
    
    async loadSystemArchitecture() {
        // Load all layers
        await this.loadHardwareLayer();
        await this.loadShadowLayer();
        await this.loadIntegrationLayer();
        await this.loadReasoningLayer();
        
        // Initially show hardware layer
        this.switchLayer('hardware');
    }
    
    async loadHardwareLayer() {
        const hardwareData = this.architecture.hardware;
        
        // Create components
        hardwareData.components.forEach(comp => {
            const component = this.createHardwareComponent(comp);
            this.layers.hardware.add(component);
            this.components.set(comp.id, {
                ...comp,
                object3d: component,
                layer: 'hardware'
            });
        });
        
        // Create connections
        hardwareData.connections.forEach(conn => {
            const connection = this.createConnection(conn, 'hardware');
            this.layers.hardware.add(connection);
        });
        
        // Add environment
        this.addHardwareEnvironment();
    }
    
    createHardwareComponent(comp) {
        const group = new THREE.Group();
        
        // Base geometry based on type
        let geometry, material;
        
        switch (comp.type) {
            case 'server':
                geometry = new THREE.BoxGeometry(20, 30, 10);
                material = new THREE.MeshLambertMaterial({ 
                    color: 0x333333,
                    emissive: 0x003300,
                    emissiveIntensity: 0.2
                });
                break;
                
            case 'database':
                geometry = new THREE.CylinderGeometry(15, 15, 25, 8);
                material = new THREE.MeshLambertMaterial({ 
                    color: 0x0066cc,
                    emissive: 0x001166,
                    emissiveIntensity: 0.3
                });
                break;
                
            case 'cache':
                geometry = new THREE.SphereGeometry(12, 16, 16);
                material = new THREE.MeshLambertMaterial({ 
                    color: 0xff6600,
                    emissive: 0x663300,
                    emissiveIntensity: 0.2
                });
                break;
                
            case 'load-balancer':
                geometry = new THREE.OctahedronGeometry(15);
                material = new THREE.MeshLambertMaterial({ 
                    color: 0x00ffaa,
                    emissive: 0x006644,
                    emissiveIntensity: 0.2
                });
                break;
                
            case 'router':
                geometry = new THREE.DodecahedronGeometry(12);
                material = new THREE.MeshLambertMaterial({ 
                    color: 0xffaa00,
                    emissive: 0x664400,
                    emissiveIntensity: 0.2
                });
                break;
                
            default:
                geometry = new THREE.BoxGeometry(10, 10, 10);
                material = new THREE.MeshLambertMaterial({ color: 0x666666 });
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = comp;
        group.add(mesh);
        
        // Add status indicator
        const statusGeometry = new THREE.SphereGeometry(2, 8, 8);
        const statusMaterial = new THREE.MeshBasicMaterial({ 
            color: comp.status === 'active' ? 0x00ff00 : 0xff0000,
            emissive: comp.status === 'active' ? 0x004400 : 0x440000,
            emissiveIntensity: 0.5
        });
        const statusIndicator = new THREE.Mesh(statusGeometry, statusMaterial);
        statusIndicator.position.y = 20;
        group.add(statusIndicator);
        
        // Add text label
        this.addTextLabel(group, comp.name, { y: 25 });
        
        group.position.set(...comp.position);
        return group;
    }
    
    async loadShadowLayer() {
        const shadowData = this.architecture.shadow;
        
        // Create security components
        shadowData.components.forEach(comp => {
            const component = this.createSecurityComponent(comp);
            this.layers.shadow.add(component);
            this.components.set(comp.id, {
                ...comp,
                object3d: component,
                layer: 'shadow'
            });
        });
        
        // Create security shields around protected components
        shadowData.shields.forEach(shield => {
            const shieldMesh = this.createSecurityShield(shield);
            this.layers.shadow.add(shieldMesh);
        });
    }
    
    createSecurityComponent(comp) {
        const group = new THREE.Group();
        
        // Security-specific geometries
        let geometry, material;
        
        switch (comp.type) {
            case 'security':
                geometry = new THREE.TetrahedronGeometry(15);
                material = new THREE.MeshLambertMaterial({ 
                    color: 0xff0066,
                    emissive: 0x660022,
                    emissiveIntensity: 0.4,
                    transparent: true,
                    opacity: 0.8
                });
                break;
                
            default:
                geometry = new THREE.ConeGeometry(10, 20, 6);
                material = new THREE.MeshLambertMaterial({ 
                    color: 0xff0066,
                    transparent: true,
                    opacity: 0.7
                });
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = comp;
        group.add(mesh);
        
        // Add scanning animation
        const scanRing = this.createScanRing();
        group.add(scanRing);
        
        this.addTextLabel(group, comp.name, { y: 25 });
        group.position.set(...comp.position);
        
        return group;
    }
    
    createSecurityShield(shield) {
        const component = this.components.get(shield.componentId);
        if (!component) return null;
        
        const geometry = new THREE.SphereGeometry(25, 16, 16);
        const material = new THREE.MeshLambertMaterial({
            color: 0xff0066,
            transparent: true,
            opacity: 0.15 * shield.strength,
            side: THREE.DoubleSide
        });
        
        const shieldMesh = new THREE.Mesh(geometry, material);
        shieldMesh.position.copy(component.object3d.position);
        
        return shieldMesh;
    }
    
    createScanRing() {
        const geometry = new THREE.TorusGeometry(20, 2, 4, 16);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xff0066,
            transparent: true,
            opacity: 0.6
        });
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = Math.PI / 2;
        return ring;
    }
    
    async loadIntegrationLayer() {
        const integrationData = this.architecture.integration;
        
        // Create integration components
        integrationData.components.forEach(comp => {
            const component = this.createIntegrationComponent(comp);
            this.layers.integration.add(component);
            this.components.set(comp.id, {
                ...comp,
                object3d: component,
                layer: 'integration'
            });
        });
        
        // Create data flows
        integrationData.flows.forEach(flow => {
            const flowViz = this.createDataFlow(flow);
            this.layers.integration.add(flowViz);
        });
    }
    
    createIntegrationComponent(comp) {
        const group = new THREE.Group();
        
        let geometry, material;
        
        switch (comp.type) {
            case 'api':
                geometry = new THREE.IcosahedronGeometry(12);
                material = new THREE.MeshLambertMaterial({ 
                    color: 0x0066ff,
                    emissive: 0x002266,
                    emissiveIntensity: 0.3
                });
                break;
                
            case 'queue':
                geometry = new THREE.BoxGeometry(25, 8, 8);
                material = new THREE.MeshLambertMaterial({ 
                    color: 0x00aaff,
                    emissive: 0x004466,
                    emissiveIntensity: 0.2
                });
                break;
                
            case 'mesh':
                geometry = new THREE.OctahedronGeometry(15);
                material = new THREE.MeshLambertMaterial({ 
                    color: 0x6600ff,
                    wireframe: true
                });
                break;
                
            default:
                geometry = new THREE.BoxGeometry(15, 15, 15);
                material = new THREE.MeshLambertMaterial({ color: 0x0066ff });
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = comp;
        group.add(mesh);
        
        this.addTextLabel(group, comp.name, { y: 20 });
        group.position.set(...comp.position);
        
        return group;
    }
    
    createDataFlow(flow) {
        // Create animated particle system for data flow
        const particleCount = 50;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = Math.random() * 100 - 50;
            positions[i * 3 + 1] = Math.random() * 100 - 50;
            positions[i * 3 + 2] = Math.random() * 100 - 50;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 2,
            transparent: true,
            opacity: 0.8
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.userData = flow;
        
        return particles;
    }
    
    async loadReasoningLayer() {
        const reasoningData = this.architecture.reasoning;
        
        // Create AI components
        reasoningData.components.forEach(comp => {
            const component = this.createReasoningComponent(comp);
            this.layers.reasoning.add(component);
            this.components.set(comp.id, {
                ...comp,
                object3d: component,
                layer: 'reasoning'
            });
        });
        
        // Create neural pathways
        reasoningData.neuralPaths.forEach(path => {
            const pathway = this.createNeuralPathway(path);
            this.layers.reasoning.add(pathway);
        });
    }
    
    createReasoningComponent(comp) {
        const group = new THREE.Group();
        
        let geometry, material;
        
        switch (comp.type) {
            case 'ai':
                geometry = new THREE.SphereGeometry(20, 32, 32);
                material = new THREE.MeshLambertMaterial({ 
                    color: 0xffaa00,
                    emissive: 0x664400,
                    emissiveIntensity: 0.4
                });
                break;
                
            case 'knowledge':
                geometry = new THREE.DodecahedronGeometry(15);
                material = new THREE.MeshLambertMaterial({ 
                    color: 0x00ff88,
                    emissive: 0x006644,
                    emissiveIntensity: 0.3,
                    wireframe: true
                });
                break;
                
            case 'ml':
                geometry = new THREE.TorusKnotGeometry(12, 4, 64, 16);
                material = new THREE.MeshLambertMaterial({ 
                    color: 0xff6600,
                    emissive: 0x663300,
                    emissiveIntensity: 0.2
                });
                break;
                
            default:
                geometry = new THREE.IcosahedronGeometry(15);
                material = new THREE.MeshLambertMaterial({ color: 0xffaa00 });
        }
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData = comp;
        group.add(mesh);
        
        // Add thinking particles
        const thinkingParticles = this.createThinkingParticles();
        group.add(thinkingParticles);
        
        this.addTextLabel(group, comp.name, { y: 30 });
        group.position.set(...comp.position);
        
        return group;
    }
    
    createThinkingParticles() {
        const particleCount = 20;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const radius = 25 + Math.random() * 10;
            const theta = (i / particleCount) * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.cos(phi);
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xffaa00,
            size: 3,
            transparent: true,
            opacity: 0.6
        });
        
        return new THREE.Points(geometry, material);
    }
    
    createNeuralPathway(path) {
        const fromComp = this.components.get(path.from);
        const toComp = this.components.get(path.to);
        
        if (!fromComp || !toComp) return null;
        
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(...fromComp.position),
            new THREE.Vector3(0, 100, 0), // Control point
            new THREE.Vector3(...toComp.position)
        );
        
        const geometry = new THREE.TubeGeometry(curve, 50, 2, 8, false);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xffaa00,
            transparent: true,
            opacity: path.strength
        });
        
        return new THREE.Mesh(geometry, material);
    }
    
    addHardwareEnvironment() {
        // Add grid floor
        const gridHelper = new THREE.GridHelper(400, 40, 0x00ff00, 0x004400);
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        this.layers.hardware.add(gridHelper);
        
        // Add server racks
        for (let i = -2; i <= 2; i++) {
            const rack = this.createServerRack();
            rack.position.set(i * 80, 0, -120);
            this.layers.hardware.add(rack);
        }
    }
    
    createServerRack() {
        const group = new THREE.Group();
        
        // Rack frame
        const frameGeometry = new THREE.BoxGeometry(30, 80, 10);
        const frameMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x222222,
            transparent: true,
            opacity: 0.8
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        group.add(frame);
        
        // Server units
        for (let i = 0; i < 8; i++) {
            const serverGeometry = new THREE.BoxGeometry(28, 8, 8);
            const serverMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x333333,
                emissive: 0x001100,
                emissiveIntensity: 0.1
            });
            const server = new THREE.Mesh(serverGeometry, serverMaterial);
            server.position.y = -35 + i * 10;
            group.add(server);
            
            // LED indicators
            const ledGeometry = new THREE.SphereGeometry(0.5, 4, 4);
            const ledMaterial = new THREE.MeshBasicMaterial({ 
                color: Math.random() > 0.8 ? 0xff0000 : 0x00ff00,
                emissive: Math.random() > 0.8 ? 0x440000 : 0x004400,
                emissiveIntensity: 0.8
            });
            const led = new THREE.Mesh(ledGeometry, ledMaterial);
            led.position.set(-12, -35 + i * 10, 5);
            group.add(led);
        }
        
        return group;
    }
    
    createConnection(conn, layer) {
        const fromComp = this.components.get(conn.from);
        const toComp = this.components.get(conn.to);
        
        if (!fromComp || !toComp) return null;
        
        const fromPos = new THREE.Vector3(...fromComp.position);
        const toPos = new THREE.Vector3(...toComp.position);
        
        const geometry = new THREE.BufferGeometry().setFromPoints([fromPos, toPos]);
        const material = new THREE.LineBasicMaterial({ 
            color: layer === 'hardware' ? 0x00ff00 : 0x0066ff,
            opacity: 0.6,
            transparent: true
        });
        
        const line = new THREE.Line(geometry, material);
        line.userData = conn;
        
        return line;
    }
    
    addTextLabel(group, text, offset = { x: 0, y: 0, z: 0 }) {
        // Create a simple text sprite
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = '#000000';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = '#00ff00';
        context.font = '16px Courier New';
        context.textAlign = 'center';
        context.fillText(text, canvas.width / 2, canvas.height / 2 + 6);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        sprite.position.set(offset.x, offset.y, offset.z);
        sprite.scale.set(20, 5, 1);
        
        group.add(sprite);
        return sprite;
    }
    
    switchLayer(layer) {
        // Hide all layers
        Object.values(this.layers).forEach(layerGroup => {
            layerGroup.visible = false;
        });
        
        // Show selected layer
        this.layers[layer].visible = true;
        this.currentLayer = layer;
        
        // Update lighting
        this.lights.forEach(lightInfo => {
            lightInfo.light.intensity = lightInfo.layer === layer ? 1 : 0.1;
        });
        
        // Layer-specific camera positioning
        this.adjustCameraForLayer(layer);
    }
    
    adjustCameraForLayer(layer) {
        const positions = {
            hardware: { x: 0, y: 100, z: 200 },
            shadow: { x: 50, y: 120, z: 150 },
            integration: { x: -50, y: 150, z: 100 },
            reasoning: { x: 0, y: 200, z: 100 },
            game: { x: 0, y: 50, z: 100 }
        };
        
        const targetPos = positions[layer];
        if (targetPos) {
            // Smooth camera transition
            const startPos = this.camera.position.clone();
            const duration = 1000; // 1 second
            const startTime = Date.now();
            
            const animateCamera = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
                
                this.camera.position.lerpVectors(startPos, new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z), eased);
                
                if (progress < 1) {
                    requestAnimationFrame(animateCamera);
                }
            };
            
            animateCamera();
        }
    }
    
    animate = () => {
        requestAnimationFrame(this.animate);
        
        const deltaTime = this.clock.getDelta();
        const elapsedTime = this.clock.getElapsedTime();
        
        // Update controls
        this.controls.update();
        
        // Animate components based on current layer
        this.animateLayer(deltaTime, elapsedTime);
        
        // Update stats
        this.updateStats();
        
        // Render
        this.renderer.render(this.scene, this.camera);
    };
    
    animateLayer(deltaTime, elapsedTime) {
        const currentLayerGroup = this.layers[this.currentLayer];
        
        // Animate components in current layer
        currentLayerGroup.traverse((child) => {
            if (child.userData && child.userData.type) {
                // Rotate components slightly
                child.rotation.y += deltaTime * 0.5;
                
                // Pulse emissive intensity
                if (child.material && child.material.emissive) {
                    const pulse = Math.sin(elapsedTime * 2) * 0.2 + 0.8;
                    child.material.emissiveIntensity = pulse * 0.3;
                }
            }
        });
        
        // Layer-specific animations
        switch (this.currentLayer) {
            case 'shadow':
                this.animateSecurityLayer(elapsedTime);
                break;
            case 'integration':
                this.animateIntegrationLayer(elapsedTime);
                break;
            case 'reasoning':
                this.animateReasoningLayer(elapsedTime);
                break;
        }
    }
    
    animateSecurityLayer(elapsedTime) {
        // Animate scan rings
        this.layers.shadow.traverse((child) => {
            if (child.geometry && child.geometry.type === 'TorusGeometry') {
                child.rotation.z += 0.02;
                child.scale.setScalar(1 + Math.sin(elapsedTime * 3) * 0.1);
            }
        });
    }
    
    animateIntegrationLayer(elapsedTime) {
        // Animate data flow particles
        this.layers.integration.traverse((child) => {
            if (child.type === 'Points') {
                const positions = child.geometry.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i + 1] += Math.sin(elapsedTime + i * 0.1) * 0.5;
                }
                child.geometry.attributes.position.needsUpdate = true;
            }
        });
    }
    
    animateReasoningLayer(elapsedTime) {
        // Animate thinking particles
        this.layers.reasoning.traverse((child) => {
            if (child.type === 'Points') {
                child.rotation.y += 0.01;
                child.rotation.x = Math.sin(elapsedTime * 0.5) * 0.2;
            }
        });
    }
    
    updateStats() {
        // Count objects and particles
        let objectCount = 0;
        let particleCount = 0;
        
        this.scene.traverse((child) => {
            if (child.isMesh) objectCount++;
            if (child.isPoints) particleCount += child.geometry.attributes.position.count;
        });
        
        this.stats.objects = objectCount;
        this.stats.particles = particleCount;
        this.stats.memory = Math.round(this.renderer.info.memory.geometries + 
                                      this.renderer.info.memory.textures);
    }
    
    getComponentAt(x, y) {
        this.mouse.set(x, y);
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);
        
        for (const intersect of intersects) {
            if (intersect.object.userData && intersect.object.userData.id) {
                const comp = this.components.get(intersect.object.userData.id);
                return comp || intersect.object.userData;
            }
        }
        
        return null;
    }
    
    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    resetCamera() {
        this.camera.position.set(0, 100, 200);
        this.camera.lookAt(0, 0, 0);
        this.controls.reset();
    }
    
    // Testing and debugging methods
    injectRequest(requestData) {
        // Visual representation of request flowing through system
        // This would show the request path through components
        console.log('Injecting request:', requestData);
    }
    
    simulateLoad(requestCount) {
        // Simulate multiple requests for performance testing
        console.log('Simulating load:', requestCount, 'requests');
    }
    
    testSecurityLayers() {
        // Test security components
        console.log('Testing security layers...');
    }
    
    startRequestTrace() {
        // Start visual tracing of requests
        console.log('Starting request trace...');
    }
    
    runStressTest() {
        // Run stress test visualization
        console.log('Running stress test...');
    }
    
    async validateAllIntegrations() {
        // Validate all component integrations
        const results = [];
        
        for (const [id, component] of this.components) {
            results.push({
                component: component.name,
                status: component.status === 'active' ? 'OK' : 'ERROR'
            });
        }
        
        return results;
    }
    
    updateComponent(componentId, updates) {
        const component = this.components.get(componentId);
        if (component) {
            Object.assign(component, updates);
            // Update visual representation
        }
    }
    
    visualizeDataFlow(flow) {
        // Add visual data flow
        console.log('Visualizing data flow:', flow);
    }
    
    updateMinimap() {
        // Update minimap canvas
        console.log('Updating minimap...');
    }
}