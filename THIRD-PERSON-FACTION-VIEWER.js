// THIRD-PERSON FACTION VIEWER SYSTEM
// Watch faction deliberations and decisions from a god-view 3D perspective

class ThirdPersonFactionViewer {
    constructor() {
        this.viewerId = `3D-VIEWER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // 3D Scene Configuration
        this.scene = {
            world: {
                size: { width: 1000, height: 500, depth: 1000 },
                center: { x: 0, y: 0, z: 0 },
                gravity: { x: 0, y: -9.8, z: 0 }
            },
            camera: {
                position: { x: 0, y: 300, z: 500 },
                target: { x: 0, y: 0, z: 0 },
                fov: 60,
                mode: 'orbit', // orbit, free, follow, cinematic
                speed: 5
            },
            lighting: {
                ambient: { color: 0x404040, intensity: 0.5 },
                directional: { color: 0xffffff, intensity: 1, position: { x: 100, y: 200, z: 50 } },
                dynamic: true
            }
        };
        
        // Faction 3D Representations
        this.factionModels = {
            technocrats: {
                position: { x: -200, y: 0, z: -200 },
                color: 0x00ffff,
                shape: 'pyramid',
                size: 50,
                particles: 'data_streams',
                aura: 'digital'
            },
            libertarians: {
                position: { x: 200, y: 0, z: -200 },
                color: 0xffff00,
                shape: 'sphere',
                size: 45,
                particles: 'freedom_sparks',
                aura: 'chaotic'
            },
            guardians: {
                position: { x: -200, y: 0, z: 200 },
                color: 0xff0000,
                shape: 'fortress',
                size: 60,
                particles: 'shield_energy',
                aura: 'protective'
            },
            progressives: {
                position: { x: 200, y: 0, z: 200 },
                color: 0x00ff00,
                shape: 'rocket',
                size: 55,
                particles: 'innovation_trails',
                aura: 'dynamic'
            },
            traditionalists: {
                position: { x: 0, y: 0, z: 0 },
                color: 0xff00ff,
                shape: 'temple',
                size: 50,
                particles: 'ancient_wisdom',
                aura: 'stable'
            }
        };
        
        // Deliberation Chamber (Central Meeting Space)
        this.deliberationChamber = {
            position: { x: 0, y: 50, z: 0 },
            shape: 'amphitheater',
            radius: 150,
            height: 100,
            seats: [],
            podium: { x: 0, y: 60, z: 0 },
            activeDebate: null
        };
        
        // Visual Effects System
        this.effects = {
            connections: new Map(), // Visual connections between factions
            thoughtBubbles: new Map(), // 3D thought bubbles
            proposals: new Map(), // Floating proposal documents
            decisions: [], // Decision visualization effects
            particles: new Map() // Particle systems
        };
        
        // Animation System
        this.animations = {
            queue: [],
            active: new Map(),
            presets: {
                debate: this.createDebateAnimation(),
                proposal: this.createProposalAnimation(),
                decision: this.createDecisionAnimation(),
                alliance: this.createAllianceAnimation(),
                conflict: this.createConflictAnimation()
            }
        };
        
        // Camera Modes
        this.cameraModes = {
            orbit: {
                radius: 500,
                height: 300,
                speed: 0.001,
                autoRotate: true
            },
            cinematic: {
                waypoints: this.createCinematicPath(),
                currentPoint: 0,
                speed: 0.01
            },
            follow: {
                target: null,
                offset: { x: 0, y: 100, z: 200 },
                smoothing: 0.1
            },
            free: {
                velocity: { x: 0, y: 0, z: 0 },
                acceleration: 1,
                friction: 0.9
            }
        };
        
        // Event Visualization
        this.eventVisualizer = {
            queue: [],
            activeEvents: new Map(),
            maxConcurrent: 5,
            displayDuration: 5000
        };
        
        this.initialize3DViewer();
    }
    
    createDebateAnimation() {
        return {
            name: 'debate',
            duration: 10000,
            phases: [
                {
                    time: 0,
                    action: 'gather',
                    description: 'Factions move to deliberation chamber'
                },
                {
                    time: 2000,
                    action: 'present',
                    description: 'Each faction presents their position'
                },
                {
                    time: 5000,
                    action: 'argue',
                    description: 'Heated debate with visual effects'
                },
                {
                    time: 8000,
                    action: 'conclude',
                    description: 'Positions solidify or change'
                }
            ]
        };
    }
    
    createProposalAnimation() {
        return {
            name: 'proposal',
            duration: 5000,
            phases: [
                {
                    time: 0,
                    action: 'emerge',
                    description: 'Proposal materializes above faction'
                },
                {
                    time: 1000,
                    action: 'float',
                    description: 'Proposal floats to center'
                },
                {
                    time: 3000,
                    action: 'present',
                    description: 'Proposal opens and displays content'
                },
                {
                    time: 4500,
                    action: 'await',
                    description: 'Awaits human decision'
                }
            ]
        };
    }
    
    createDecisionAnimation() {
        return {
            name: 'decision',
            duration: 3000,
            phases: [
                {
                    time: 0,
                    action: 'highlight',
                    description: 'Proposal glows with decision color'
                },
                {
                    time: 1000,
                    action: 'stamp',
                    description: 'APPROVED or DENIED stamp appears'
                },
                {
                    time: 2000,
                    action: 'disperse',
                    description: 'Effects ripple to affected factions'
                }
            ]
        };
    }
    
    createAllianceAnimation() {
        return {
            name: 'alliance',
            duration: 4000,
            phases: [
                {
                    time: 0,
                    action: 'approach',
                    description: 'Factions move closer'
                },
                {
                    time: 1500,
                    action: 'connect',
                    description: 'Energy bridge forms between factions'
                },
                {
                    time: 3000,
                    action: 'stabilize',
                    description: 'Alliance connection stabilizes'
                }
            ]
        };
    }
    
    createConflictAnimation() {
        return {
            name: 'conflict',
            duration: 4000,
            phases: [
                {
                    time: 0,
                    action: 'tension',
                    description: 'Red lightning between factions'
                },
                {
                    time: 1500,
                    action: 'clash',
                    description: 'Visual clash effects'
                },
                {
                    time: 3000,
                    action: 'separate',
                    description: 'Factions push apart'
                }
            ]
        };
    }
    
    createCinematicPath() {
        // Predefined camera path for cinematic mode
        return [
            { position: { x: 0, y: 500, z: 800 }, target: { x: 0, y: 0, z: 0 }, duration: 5000 },
            { position: { x: 400, y: 300, z: 400 }, target: { x: -200, y: 0, z: -200 }, duration: 4000 },
            { position: { x: -400, y: 200, z: -400 }, target: { x: 200, y: 0, z: 200 }, duration: 4000 },
            { position: { x: 0, y: 600, z: 0 }, target: { x: 0, y: 0, z: 0 }, duration: 3000 },
            { position: { x: 300, y: 100, z: 300 }, target: { x: 0, y: 50, z: 0 }, duration: 4000 }
        ];
    }
    
    async initialize3DViewer() {
        console.log('🎮 INITIALIZING THIRD-PERSON FACTION VIEWER');
        
        // Create 3D visualization interface
        await this.create3DInterface();
        
        // Initialize 3D scene
        this.setup3DScene();
        
        // Start animation engine
        this.startAnimationEngine();
        
        // Initialize event processing
        this.startEventProcessing();
        
        console.log('✅ 3D VIEWER ACTIVE - WATCHING FROM ABOVE');
    }
    
    async create3DInterface() {
        const express = require('express');
        const app = express();
        const server = require('http').createServer(app);
        this.io = require('socket.io')(server);
        
        app.use(express.json());
        app.use(express.static('public'));
        
        // 3D Viewer Interface
        app.get('/', (req, res) => {
            res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Third-Person Faction Viewer</title>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
                    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
                    <style>
                        body {
                            margin: 0;
                            padding: 0;
                            overflow: hidden;
                            font-family: 'Arial', sans-serif;
                            background: #000;
                        }
                        
                        #canvas-container {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                        }
                        
                        .ui-overlay {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            pointer-events: none;
                            z-index: 100;
                        }
                        
                        .top-bar {
                            position: absolute;
                            top: 0;
                            left: 0;
                            right: 0;
                            height: 60px;
                            background: linear-gradient(to bottom, rgba(0,0,0,0.8), transparent);
                            display: flex;
                            align-items: center;
                            justify-content: space-between;
                            padding: 0 30px;
                            pointer-events: auto;
                        }
                        
                        .title {
                            color: #fff;
                            font-size: 24px;
                            font-weight: bold;
                            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
                        }
                        
                        .camera-controls {
                            display: flex;
                            gap: 10px;
                        }
                        
                        .camera-button {
                            padding: 8px 16px;
                            background: rgba(255,255,255,0.1);
                            border: 1px solid rgba(255,255,255,0.3);
                            color: #fff;
                            cursor: pointer;
                            border-radius: 5px;
                            transition: all 0.3s;
                            font-size: 14px;
                        }
                        
                        .camera-button:hover {
                            background: rgba(255,255,255,0.2);
                            border-color: rgba(255,255,255,0.5);
                        }
                        
                        .camera-button.active {
                            background: rgba(255,255,255,0.3);
                            border-color: #fff;
                        }
                        
                        .faction-labels {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            pointer-events: none;
                        }
                        
                        .faction-label {
                            position: absolute;
                            color: #fff;
                            font-size: 14px;
                            font-weight: bold;
                            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                            padding: 5px 10px;
                            border-radius: 5px;
                            background: rgba(0,0,0,0.5);
                            transform: translate(-50%, -50%);
                            white-space: nowrap;
                        }
                        
                        .event-log {
                            position: absolute;
                            bottom: 20px;
                            left: 20px;
                            width: 400px;
                            max-height: 200px;
                            background: rgba(0,0,0,0.7);
                            border: 1px solid rgba(255,255,255,0.2);
                            border-radius: 10px;
                            padding: 15px;
                            overflow-y: auto;
                            pointer-events: auto;
                        }
                        
                        .event-log h3 {
                            margin: 0 0 10px 0;
                            color: #fff;
                            font-size: 16px;
                        }
                        
                        .event-item {
                            margin: 5px 0;
                            padding: 5px;
                            border-left: 3px solid;
                            padding-left: 10px;
                            font-size: 12px;
                            color: #ddd;
                            animation: fadeIn 0.5s;
                        }
                        
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translateX(-10px); }
                            to { opacity: 1; transform: translateX(0); }
                        }
                        
                        .event-debate { border-color: #00ffff; }
                        .event-proposal { border-color: #ffff00; }
                        .event-decision { border-color: #00ff00; }
                        .event-alliance { border-color: #ff00ff; }
                        .event-conflict { border-color: #ff0000; }
                        
                        .stats-panel {
                            position: absolute;
                            top: 80px;
                            right: 20px;
                            width: 250px;
                            background: rgba(0,0,0,0.7);
                            border: 1px solid rgba(255,255,255,0.2);
                            border-radius: 10px;
                            padding: 15px;
                            pointer-events: auto;
                        }
                        
                        .stat-row {
                            display: flex;
                            justify-content: space-between;
                            margin: 8px 0;
                            color: #ddd;
                            font-size: 14px;
                        }
                        
                        .stat-value {
                            font-weight: bold;
                            color: #fff;
                        }
                        
                        .controls-hint {
                            position: absolute;
                            bottom: 20px;
                            right: 20px;
                            color: #888;
                            font-size: 12px;
                            text-align: right;
                            pointer-events: auto;
                        }
                        
                        .thought-bubble {
                            position: absolute;
                            background: rgba(255,255,255,0.9);
                            color: #000;
                            padding: 10px 15px;
                            border-radius: 20px;
                            font-size: 14px;
                            max-width: 200px;
                            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                            transform: translate(-50%, -100%);
                            animation: float 3s ease-in-out infinite;
                        }
                        
                        @keyframes float {
                            0%, 100% { transform: translate(-50%, -100%) translateY(0); }
                            50% { transform: translate(-50%, -100%) translateY(-10px); }
                        }
                        
                        .proposal-floating {
                            position: absolute;
                            background: rgba(255,255,255,0.95);
                            border: 2px solid #gold;
                            padding: 20px;
                            border-radius: 10px;
                            width: 300px;
                            box-shadow: 0 8px 16px rgba(0,0,0,0.4);
                            transform: translate(-50%, -50%);
                            pointer-events: auto;
                            cursor: pointer;
                        }
                        
                        .proposal-title {
                            font-weight: bold;
                            margin-bottom: 10px;
                            color: #333;
                        }
                        
                        .proposal-content {
                            color: #666;
                            font-size: 14px;
                            margin-bottom: 15px;
                        }
                        
                        .proposal-actions {
                            display: flex;
                            gap: 10px;
                            justify-content: center;
                        }
                        
                        .proposal-button {
                            padding: 8px 20px;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-weight: bold;
                            transition: all 0.3s;
                        }
                        
                        .approve { background: #4CAF50; color: white; }
                        .approve:hover { background: #45a049; }
                        .deny { background: #f44336; color: white; }
                        .deny:hover { background: #da190b; }
                        
                        .connection-line {
                            position: absolute;
                            height: 3px;
                            background: linear-gradient(90deg, transparent, #fff, transparent);
                            transform-origin: left center;
                            pointer-events: none;
                            opacity: 0.5;
                        }
                        
                        .alliance-line { background: linear-gradient(90deg, transparent, #00ff00, transparent); }
                        .conflict-line { background: linear-gradient(90deg, transparent, #ff0000, transparent); }
                    </style>
                </head>
                <body>
                    <div id="canvas-container"></div>
                    
                    <div class="ui-overlay">
                        <div class="top-bar">
                            <div class="title">🎮 Third-Person Faction Viewer</div>
                            <div class="camera-controls">
                                <button class="camera-button active" onclick="setCameraMode('orbit')">
                                    Orbit
                                </button>
                                <button class="camera-button" onclick="setCameraMode('cinematic')">
                                    Cinematic
                                </button>
                                <button class="camera-button" onclick="setCameraMode('free')">
                                    Free Cam
                                </button>
                                <button class="camera-button" onclick="setCameraMode('follow')">
                                    Follow
                                </button>
                            </div>
                        </div>
                        
                        <div class="faction-labels" id="faction-labels"></div>
                        
                        <div class="stats-panel">
                            <h3 style="margin: 0 0 10px 0; color: #fff;">System Status</h3>
                            <div class="stat-row">
                                <span>Active Debates:</span>
                                <span class="stat-value" id="active-debates">0</span>
                            </div>
                            <div class="stat-row">
                                <span>Pending Proposals:</span>
                                <span class="stat-value" id="pending-proposals">0</span>
                            </div>
                            <div class="stat-row">
                                <span>Alliances:</span>
                                <span class="stat-value" id="alliance-count">0</span>
                            </div>
                            <div class="stat-row">
                                <span>Conflicts:</span>
                                <span class="stat-value" id="conflict-count">0</span>
                            </div>
                        </div>
                        
                        <div class="event-log">
                            <h3>Event Log</h3>
                            <div id="event-list"></div>
                        </div>
                        
                        <div class="controls-hint">
                            Mouse: Rotate | Scroll: Zoom | WASD: Move (Free Cam)
                        </div>
                    </div>
                    
                    <script src="/socket.io/socket.io.js"></script>
                    <script>
                        // Three.js Scene Setup
                        const scene = new THREE.Scene();
                        scene.fog = new THREE.Fog(0x000000, 500, 2000);
                        
                        // Camera
                        const camera = new THREE.PerspectiveCamera(
                            60, 
                            window.innerWidth / window.innerHeight, 
                            0.1, 
                            5000
                        );
                        camera.position.set(0, 300, 500);
                        
                        // Renderer
                        const renderer = new THREE.WebGLRenderer({ antialias: true });
                        renderer.setSize(window.innerWidth, window.innerHeight);
                        renderer.shadowMap.enabled = true;
                        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                        document.getElementById('canvas-container').appendChild(renderer.domElement);
                        
                        // Lights
                        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
                        scene.add(ambientLight);
                        
                        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
                        directionalLight.position.set(100, 200, 50);
                        directionalLight.castShadow = true;
                        directionalLight.shadow.camera.left = -500;
                        directionalLight.shadow.camera.right = 500;
                        directionalLight.shadow.camera.top = 500;
                        directionalLight.shadow.camera.bottom = -500;
                        scene.add(directionalLight);
                        
                        // Ground
                        const groundGeometry = new THREE.PlaneGeometry(1000, 1000, 50, 50);
                        const groundMaterial = new THREE.MeshStandardMaterial({ 
                            color: 0x111111,
                            roughness: 0.8,
                            metalness: 0.2
                        });
                        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
                        ground.rotation.x = -Math.PI / 2;
                        ground.receiveShadow = true;
                        scene.add(ground);
                        
                        // Grid
                        const gridHelper = new THREE.GridHelper(1000, 50, 0x444444, 0x222222);
                        scene.add(gridHelper);
                        
                        // Faction Models
                        const factions = {};
                        const factionData = {
                            technocrats: { 
                                position: { x: -200, y: 50, z: -200 }, 
                                color: 0x00ffff, 
                                shape: 'pyramid',
                                name: 'Technocrats'
                            },
                            libertarians: { 
                                position: { x: 200, y: 50, z: -200 }, 
                                color: 0xffff00, 
                                shape: 'sphere',
                                name: 'Libertarians'
                            },
                            guardians: { 
                                position: { x: -200, y: 50, z: 200 }, 
                                color: 0xff0000, 
                                shape: 'box',
                                name: 'Guardians'
                            },
                            progressives: { 
                                position: { x: 200, y: 50, z: 200 }, 
                                color: 0x00ff00, 
                                shape: 'cone',
                                name: 'Progressives'
                            },
                            traditionalists: { 
                                position: { x: 0, y: 50, z: 0 }, 
                                color: 0xff00ff, 
                                shape: 'cylinder',
                                name: 'Traditionalists'
                            }
                        };
                        
                        // Create faction models
                        Object.entries(factionData).forEach(([id, data]) => {
                            let geometry;
                            switch(data.shape) {
                                case 'pyramid':
                                    geometry = new THREE.ConeGeometry(30, 60, 4);
                                    break;
                                case 'sphere':
                                    geometry = new THREE.SphereGeometry(30, 32, 16);
                                    break;
                                case 'box':
                                    geometry = new THREE.BoxGeometry(50, 50, 50);
                                    break;
                                case 'cone':
                                    geometry = new THREE.ConeGeometry(30, 60, 32);
                                    break;
                                case 'cylinder':
                                    geometry = new THREE.CylinderGeometry(30, 30, 60, 32);
                                    break;
                            }
                            
                            const material = new THREE.MeshStandardMaterial({ 
                                color: data.color,
                                emissive: data.color,
                                emissiveIntensity: 0.2
                            });
                            
                            const mesh = new THREE.Mesh(geometry, material);
                            mesh.position.set(data.position.x, data.position.y, data.position.z);
                            mesh.castShadow = true;
                            mesh.receiveShadow = true;
                            
                            // Add glow effect
                            const glowGeometry = geometry.clone();
                            const glowMaterial = new THREE.MeshBasicMaterial({
                                color: data.color,
                                transparent: true,
                                opacity: 0.3
                            });
                            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
                            glowMesh.scale.multiplyScalar(1.2);
                            mesh.add(glowMesh);
                            
                            scene.add(mesh);
                            factions[id] = { mesh, data, glow: glowMesh };
                        });
                        
                        // Deliberation Chamber (Center)
                        const chamberGeometry = new THREE.CylinderGeometry(150, 150, 10, 64);
                        const chamberMaterial = new THREE.MeshStandardMaterial({ 
                            color: 0x333333,
                            metalness: 0.5,
                            roughness: 0.5
                        });
                        const chamber = new THREE.Mesh(chamberGeometry, chamberMaterial);
                        chamber.position.y = 5;
                        chamber.receiveShadow = true;
                        scene.add(chamber);
                        
                        // Controls
                        let controls;
                        let currentCameraMode = 'orbit';
                        
                        function initOrbitControls() {
                            if (controls) controls.dispose();
                            controls = new THREE.OrbitControls(camera, renderer.domElement);
                            controls.enableDamping = true;
                            controls.dampingFactor = 0.05;
                            controls.maxPolarAngle = Math.PI / 2.2;
                            controls.minDistance = 200;
                            controls.maxDistance = 1000;
                        }
                        
                        initOrbitControls();
                        
                        // Socket connection
                        const socket = io();
                        
                        // Camera modes
                        function setCameraMode(mode) {
                            currentCameraMode = mode;
                            document.querySelectorAll('.camera-button').forEach(btn => {
                                btn.classList.remove('active');
                            });
                            event.target.classList.add('active');
                            
                            switch(mode) {
                                case 'orbit':
                                    initOrbitControls();
                                    break;
                                case 'cinematic':
                                    if (controls) controls.dispose();
                                    controls = null;
                                    startCinematicCamera();
                                    break;
                                case 'free':
                                    // Implement free camera
                                    break;
                                case 'follow':
                                    // Implement follow camera
                                    break;
                            }
                        }
                        
                        // Animation loop
                        let time = 0;
                        const particles = new Map();
                        const connections = new Map();
                        const thoughtBubbles = new Map();
                        
                        function animate() {
                            requestAnimationFrame(animate);
                            time += 0.01;
                            
                            // Rotate factions slightly
                            Object.values(factions).forEach(faction => {
                                faction.mesh.rotation.y += 0.005;
                                faction.glow.material.opacity = 0.3 + Math.sin(time * 2) * 0.1;
                            });
                            
                            // Update controls
                            if (controls && controls.update) {
                                controls.update();
                            }
                            
                            // Update particle effects
                            updateParticles();
                            
                            // Update connections
                            updateConnections();
                            
                            // Update labels
                            updateLabels();
                            
                            renderer.render(scene, camera);
                        }
                        
                        function updateParticles() {
                            particles.forEach((system, id) => {
                                system.rotation.y += 0.01;
                                system.children.forEach((particle, i) => {
                                    particle.position.y = Math.sin(time * 2 + i) * 20;
                                });
                            });
                        }
                        
                        function updateConnections() {
                            connections.forEach((line, id) => {
                                line.material.opacity = 0.5 + Math.sin(time * 4) * 0.3;
                            });
                        }
                        
                        function updateLabels() {
                            const labelsContainer = document.getElementById('faction-labels');
                            labelsContainer.innerHTML = '';
                            
                            Object.entries(factions).forEach(([id, faction]) => {
                                const vector = faction.mesh.position.clone();
                                vector.project(camera);
                                
                                const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
                                const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
                                
                                const label = document.createElement('div');
                                label.className = 'faction-label';
                                label.style.left = x + 'px';
                                label.style.top = (y - 80) + 'px';
                                label.textContent = faction.data.name;
                                label.style.borderColor = '#' + faction.data.color.toString(16).padStart(6, '0');
                                
                                labelsContainer.appendChild(label);
                            });
                        }
                        
                        // Socket event handlers
                        socket.on('faction-event', (event) => {
                            handleFactionEvent(event);
                            logEvent(event);
                        });
                        
                        socket.on('stats-update', (stats) => {
                            document.getElementById('active-debates').textContent = stats.activeDebates;
                            document.getElementById('pending-proposals').textContent = stats.pendingProposals;
                            document.getElementById('alliance-count').textContent = stats.alliances;
                            document.getElementById('conflict-count').textContent = stats.conflicts;
                        });
                        
                        function handleFactionEvent(event) {
                            switch(event.type) {
                                case 'debate':
                                    animateDebate(event);
                                    break;
                                case 'proposal':
                                    animateProposal(event);
                                    break;
                                case 'decision':
                                    animateDecision(event);
                                    break;
                                case 'alliance':
                                    createAlliance(event);
                                    break;
                                case 'conflict':
                                    createConflict(event);
                                    break;
                            }
                        }
                        
                        function animateDebate(event) {
                            // Move factions toward center
                            event.participants.forEach(factionId => {
                                const faction = factions[factionId];
                                if (faction) {
                                    // Create thought bubble
                                    createThoughtBubble(faction, event.position || 'Deliberating...');
                                    
                                    // Pulse effect
                                    const scale = 1.2;
                                    faction.mesh.scale.set(scale, scale, scale);
                                    setTimeout(() => {
                                        faction.mesh.scale.set(1, 1, 1);
                                    }, 1000);
                                }
                            });
                        }
                        
                        function animateProposal(event) {
                            const faction = factions[event.faction];
                            if (faction) {
                                // Create floating proposal
                                const proposalGeometry = new THREE.BoxGeometry(40, 60, 5);
                                const proposalMaterial = new THREE.MeshStandardMaterial({
                                    color: 0xffffff,
                                    emissive: 0xffff00,
                                    emissiveIntensity: 0.3
                                });
                                const proposal = new THREE.Mesh(proposalGeometry, proposalMaterial);
                                proposal.position.copy(faction.mesh.position);
                                proposal.position.y += 100;
                                scene.add(proposal);
                                
                                // Animate to center
                                const targetY = 150;
                                const animateProposal = () => {
                                    proposal.position.y += (targetY - proposal.position.y) * 0.05;
                                    proposal.rotation.y += 0.02;
                                    if (Math.abs(proposal.position.y - targetY) > 0.1) {
                                        requestAnimationFrame(animateProposal);
                                    }
                                };
                                animateProposal();
                                
                                // Remove after delay
                                setTimeout(() => {
                                    scene.remove(proposal);
                                }, 10000);
                            }
                        }
                        
                        function animateDecision(event) {
                            // Create decision effect
                            const color = event.decision === 'approved' ? 0x00ff00 : 0xff0000;
                            const geometry = new THREE.SphereGeometry(200, 32, 16);
                            const material = new THREE.MeshBasicMaterial({
                                color: color,
                                transparent: true,
                                opacity: 0.5,
                                wireframe: true
                            });
                            const sphere = new THREE.Mesh(geometry, material);
                            sphere.position.set(0, 100, 0);
                            scene.add(sphere);
                            
                            // Expand and fade
                            const expandSphere = () => {
                                sphere.scale.multiplyScalar(1.05);
                                sphere.material.opacity *= 0.95;
                                if (sphere.material.opacity > 0.01) {
                                    requestAnimationFrame(expandSphere);
                                } else {
                                    scene.remove(sphere);
                                }
                            };
                            expandSphere();
                        }
                        
                        function createAlliance(event) {
                            const faction1 = factions[event.faction1];
                            const faction2 = factions[event.faction2];
                            
                            if (faction1 && faction2) {
                                // Create connection line
                                const points = [
                                    faction1.mesh.position,
                                    faction2.mesh.position
                                ];
                                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                                const material = new THREE.LineBasicMaterial({
                                    color: 0x00ff00,
                                    transparent: true,
                                    opacity: 0.5
                                });
                                const line = new THREE.Line(geometry, material);
                                scene.add(line);
                                connections.set(\`\${event.faction1}-\${event.faction2}\`, line);
                            }
                        }
                        
                        function createConflict(event) {
                            const faction1 = factions[event.faction1];
                            const faction2 = factions[event.faction2];
                            
                            if (faction1 && faction2) {
                                // Create conflict effect
                                const midpoint = faction1.mesh.position.clone()
                                    .add(faction2.mesh.position).multiplyScalar(0.5);
                                
                                // Lightning effect
                                const points = [];
                                const segments = 10;
                                for (let i = 0; i <= segments; i++) {
                                    const t = i / segments;
                                    const point = faction1.mesh.position.clone()
                                        .lerp(faction2.mesh.position, t);
                                    point.x += (Math.random() - 0.5) * 20;
                                    point.y += (Math.random() - 0.5) * 20;
                                    point.z += (Math.random() - 0.5) * 20;
                                    points.push(point);
                                }
                                
                                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                                const material = new THREE.LineBasicMaterial({
                                    color: 0xff0000,
                                    transparent: true,
                                    opacity: 0.8
                                });
                                const lightning = new THREE.Line(geometry, material);
                                scene.add(lightning);
                                
                                // Remove after flash
                                setTimeout(() => {
                                    scene.remove(lightning);
                                }, 500);
                            }
                        }
                        
                        function createThoughtBubble(faction, text) {
                            // Implementation would create HTML thought bubble
                            // positioned above faction
                        }
                        
                        function logEvent(event) {
                            const eventList = document.getElementById('event-list');
                            const eventItem = document.createElement('div');
                            eventItem.className = 'event-item event-' + event.type;
                            eventItem.textContent = \`[\${new Date().toLocaleTimeString()}] \${event.description}\`;
                            eventList.insertBefore(eventItem, eventList.firstChild);
                            
                            // Keep only last 10 events
                            while (eventList.children.length > 10) {
                                eventList.removeChild(eventList.lastChild);
                            }
                        }
                        
                        // Handle window resize
                        window.addEventListener('resize', () => {
                            camera.aspect = window.innerWidth / window.innerHeight;
                            camera.updateProjectionMatrix();
                            renderer.setSize(window.innerWidth, window.innerHeight);
                        });
                        
                        // Cinematic camera
                        let cinematicIndex = 0;
                        const cinematicWaypoints = [
                            { pos: { x: 0, y: 500, z: 800 }, look: { x: 0, y: 0, z: 0 } },
                            { pos: { x: 400, y: 300, z: 400 }, look: { x: -200, y: 0, z: -200 } },
                            { pos: { x: -400, y: 200, z: -400 }, look: { x: 200, y: 0, z: 200 } },
                            { pos: { x: 0, y: 600, z: 0 }, look: { x: 0, y: 0, z: 0 } }
                        ];
                        
                        function startCinematicCamera() {
                            const waypoint = cinematicWaypoints[cinematicIndex];
                            camera.position.set(waypoint.pos.x, waypoint.pos.y, waypoint.pos.z);
                            camera.lookAt(waypoint.look.x, waypoint.look.y, waypoint.look.z);
                            
                            cinematicIndex = (cinematicIndex + 1) % cinematicWaypoints.length;
                            
                            if (currentCameraMode === 'cinematic') {
                                setTimeout(startCinematicCamera, 5000);
                            }
                        }
                        
                        // Keyboard controls for free camera
                        const keys = {};
                        window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
                        window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
                        
                        function updateFreeCamera() {
                            if (currentCameraMode !== 'free') return;
                            
                            const speed = 5;
                            if (keys['w']) camera.position.z -= speed;
                            if (keys['s']) camera.position.z += speed;
                            if (keys['a']) camera.position.x -= speed;
                            if (keys['d']) camera.position.x += speed;
                            if (keys['q']) camera.position.y -= speed;
                            if (keys['e']) camera.position.y += speed;
                        }
                        
                        // Start animation
                        animate();
                        
                        // Request initial data
                        socket.emit('request-3d-data');
                    </script>
                </body>
                </html>
            `);
        });
        
        // API Endpoints for 3D events
        app.post('/faction-event', (req, res) => {
            const event = req.body;
            this.process3DEvent(event);
            res.json({ success: true });
        });
        
        // WebSocket handlers
        this.io.on('connection', (socket) => {
            console.log('3D viewer connected');
            
            socket.on('request-3d-data', () => {
                // Send initial state
                socket.emit('initial-3d-state', this.getCurrentState());
                
                // Send current stats
                socket.emit('stats-update', this.getSystemStats());
            });
            
            socket.on('camera-mode', (data) => {
                // Handle camera mode changes
                this.updateCameraMode(data.mode);
            });
            
            socket.on('disconnect', () => {
                console.log('3D viewer disconnected');
            });
        });
        
        const server = app.listen(10101, () => {
            console.log('🎮 Third-Person Viewer: http://localhost:10101');
        });
    }
    
    setup3DScene() {
        // Initialize faction positions
        Object.entries(this.factionModels).forEach(([factionId, model]) => {
            model.currentPosition = { ...model.position };
            model.targetPosition = { ...model.position };
            model.activity = 'idle';
        });
        
        // Setup deliberation chamber seats
        const seatCount = 5;
        const angleStep = (Math.PI * 2) / seatCount;
        
        for (let i = 0; i < seatCount; i++) {
            const angle = i * angleStep;
            const x = Math.cos(angle) * this.deliberationChamber.radius;
            const z = Math.sin(angle) * this.deliberationChamber.radius;
            
            this.deliberationChamber.seats.push({
                position: { x, y: 60, z },
                occupied: false,
                faction: null
            });
        }
    }
    
    startAnimationEngine() {
        // Process animation queue
        setInterval(() => {
            this.processAnimationQueue();
            this.updateFactionPositions();
            this.updateVisualEffects();
        }, 16); // 60 FPS
    }
    
    processAnimationQueue() {
        const now = Date.now();
        
        // Process queued animations
        this.animations.queue.forEach((animation, index) => {
            if (animation.startTime <= now) {
                this.startAnimation(animation);
                this.animations.queue.splice(index, 1);
            }
        });
        
        // Update active animations
        this.animations.active.forEach((animation, id) => {
            const elapsed = now - animation.startTime;
            const progress = elapsed / animation.duration;
            
            if (progress >= 1) {
                this.completeAnimation(id);
            } else {
                this.updateAnimation(id, progress);
            }
        });
    }
    
    startAnimation(animation) {
        animation.startTime = Date.now();
        this.animations.active.set(animation.id, animation);
        
        // Emit animation start event
        this.io.emit('animation-start', {
            id: animation.id,
            type: animation.type,
            participants: animation.participants
        });
    }
    
    updateAnimation(id, progress) {
        const animation = this.animations.active.get(id);
        const preset = this.animations.presets[animation.type];
        
        // Find current phase
        let currentPhase = null;
        for (let i = preset.phases.length - 1; i >= 0; i--) {
            if (progress * preset.duration >= preset.phases[i].time) {
                currentPhase = preset.phases[i];
                break;
            }
        }
        
        if (currentPhase) {
            this.executeAnimationPhase(animation, currentPhase, progress);
        }
    }
    
    executeAnimationPhase(animation, phase, progress) {
        switch (animation.type) {
            case 'debate':
                this.animateDebatePhase(animation, phase, progress);
                break;
            case 'proposal':
                this.animateProposalPhase(animation, phase, progress);
                break;
            case 'decision':
                this.animateDecisionPhase(animation, phase, progress);
                break;
            case 'alliance':
                this.animateAlliancePhase(animation, phase, progress);
                break;
            case 'conflict':
                this.animateConflictPhase(animation, phase, progress);
                break;
        }
    }
    
    animateDebatePhase(animation, phase, progress) {
        switch (phase.action) {
            case 'gather':
                // Move factions to deliberation chamber
                animation.participants.forEach((factionId, index) => {
                    const faction = this.factionModels[factionId];
                    const seat = this.deliberationChamber.seats[index];
                    faction.targetPosition = { ...seat.position };
                });
                break;
                
            case 'present':
                // Show thought bubbles
                animation.participants.forEach(factionId => {
                    if (!this.effects.thoughtBubbles.has(factionId)) {
                        this.createThoughtBubble(factionId, animation.topic);
                    }
                });
                break;
                
            case 'argue':
                // Create visual debate effects
                this.createDebateEffects(animation.participants);
                break;
                
            case 'conclude':
                // Return to original positions
                animation.participants.forEach(factionId => {
                    const faction = this.factionModels[factionId];
                    faction.targetPosition = { ...faction.position };
                    this.removeThoughtBubble(factionId);
                });
                break;
        }
    }
    
    animateProposalPhase(animation, phase, progress) {
        switch (phase.action) {
            case 'emerge':
                // Create proposal visual
                if (!this.effects.proposals.has(animation.proposalId)) {
                    this.createProposalVisual(animation);
                }
                break;
                
            case 'float':
                // Move proposal to center
                const proposal = this.effects.proposals.get(animation.proposalId);
                if (proposal) {
                    proposal.targetPosition = { x: 0, y: 200, z: 0 };
                }
                break;
                
            case 'present':
                // Display proposal content
                this.displayProposalContent(animation.proposalId);
                break;
                
            case 'await':
                // Pulse effect while waiting
                this.pulseProposal(animation.proposalId);
                break;
        }
    }
    
    updateFactionPositions() {
        // Smooth movement for factions
        Object.entries(this.factionModels).forEach(([factionId, model]) => {
            const current = model.currentPosition;
            const target = model.targetPosition;
            
            current.x += (target.x - current.x) * 0.1;
            current.y += (target.y - current.y) * 0.1;
            current.z += (target.z - current.z) * 0.1;
            
            // Emit position update
            this.io.emit('faction-position', {
                faction: factionId,
                position: current
            });
        });
    }
    
    updateVisualEffects() {
        // Update particle systems
        this.effects.particles.forEach((system, id) => {
            this.updateParticleSystem(system);
        });
        
        // Update connections
        this.effects.connections.forEach((connection, id) => {
            this.updateConnection(connection);
        });
    }
    
    startEventProcessing() {
        // Process events and create 3D visualizations
        setInterval(() => {
            while (this.eventVisualizer.queue.length > 0 && 
                   this.eventVisualizer.activeEvents.size < this.eventVisualizer.maxConcurrent) {
                const event = this.eventVisualizer.queue.shift();
                this.visualizeEvent(event);
            }
            
            // Clean up old events
            this.eventVisualizer.activeEvents.forEach((event, id) => {
                if (Date.now() - event.startTime > this.eventVisualizer.displayDuration) {
                    this.eventVisualizer.activeEvents.delete(id);
                    this.removeEventVisualization(id);
                }
            });
        }, 100);
    }
    
    visualizeEvent(event) {
        const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        event.id = eventId;
        event.startTime = Date.now();
        
        this.eventVisualizer.activeEvents.set(eventId, event);
        
        // Create appropriate visualization
        switch (event.type) {
            case 'faction_update':
                this.visualizeFactionUpdate(event);
                break;
            case 'deliberation_start':
                this.queueAnimation({
                    type: 'debate',
                    participants: event.participants,
                    topic: event.topic
                });
                break;
            case 'proposal_created':
                this.queueAnimation({
                    type: 'proposal',
                    faction: event.faction,
                    proposalId: event.proposalId,
                    content: event.content
                });
                break;
            case 'decision_made':
                this.queueAnimation({
                    type: 'decision',
                    proposalId: event.proposalId,
                    decision: event.decision
                });
                break;
            case 'alliance_formed':
                this.queueAnimation({
                    type: 'alliance',
                    faction1: event.faction1,
                    faction2: event.faction2
                });
                break;
            case 'conflict_started':
                this.queueAnimation({
                    type: 'conflict',
                    faction1: event.faction1,
                    faction2: event.faction2
                });
                break;
        }
        
        // Emit event to viewers
        this.io.emit('faction-event', {
            type: event.type,
            description: event.description,
            participants: event.participants || [],
            timestamp: new Date()
        });
    }
    
    queueAnimation(animation) {
        animation.id = `anim-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        animation.startTime = Date.now() + 100; // Small delay
        animation.duration = this.animations.presets[animation.type].duration;
        
        this.animations.queue.push(animation);
    }
    
    createThoughtBubble(factionId, content) {
        this.effects.thoughtBubbles.set(factionId, {
            content,
            position: { ...this.factionModels[factionId].currentPosition },
            offset: { x: 0, y: 100, z: 0 }
        });
        
        this.io.emit('thought-bubble', {
            faction: factionId,
            content
        });
    }
    
    removeThoughtBubble(factionId) {
        this.effects.thoughtBubbles.delete(factionId);
        
        this.io.emit('remove-thought-bubble', {
            faction: factionId
        });
    }
    
    createProposalVisual(animation) {
        const faction = this.factionModels[animation.faction];
        
        this.effects.proposals.set(animation.proposalId, {
            id: animation.proposalId,
            content: animation.content,
            currentPosition: { ...faction.currentPosition, y: faction.currentPosition.y + 100 },
            targetPosition: { ...faction.currentPosition, y: faction.currentPosition.y + 100 },
            faction: animation.faction
        });
    }
    
    createDebateEffects(participants) {
        // Create energy connections between debating factions
        for (let i = 0; i < participants.length - 1; i++) {
            for (let j = i + 1; j < participants.length; j++) {
                const connectionId = `${participants[i]}-${participants[j]}-debate`;
                
                if (!this.effects.connections.has(connectionId)) {
                    this.effects.connections.set(connectionId, {
                        from: participants[i],
                        to: participants[j],
                        type: 'debate',
                        intensity: Math.random() * 0.5 + 0.5
                    });
                }
            }
        }
    }
    
    getCurrentState() {
        return {
            factions: Object.entries(this.factionModels).map(([id, model]) => ({
                id,
                position: model.currentPosition,
                activity: model.activity,
                color: model.color
            })),
            activeAnimations: Array.from(this.animations.active.values()),
            connections: Array.from(this.effects.connections.values()),
            proposals: Array.from(this.effects.proposals.values())
        };
    }
    
    getSystemStats() {
        return {
            activeDebates: this.animations.active.size,
            pendingProposals: this.effects.proposals.size,
            alliances: Array.from(this.effects.connections.values())
                .filter(c => c.type === 'alliance').length,
            conflicts: Array.from(this.effects.connections.values())
                .filter(c => c.type === 'conflict').length
        };
    }
    
    process3DEvent(event) {
        // Add event to visualization queue
        this.eventVisualizer.queue.push(event);
    }
    
    completeAnimation(id) {
        const animation = this.animations.active.get(id);
        this.animations.active.delete(id);
        
        // Emit animation complete event
        this.io.emit('animation-complete', {
            id: animation.id,
            type: animation.type
        });
    }
    
    // Integration method for faction system
    connectToFactionSystem(factionSystem) {
        // Subscribe to faction system events for 3D visualization
        factionSystem.on('deliberation-started', (data) => {
            this.process3DEvent({
                type: 'deliberation_start',
                participants: data.participants,
                topic: data.topic.title,
                description: `Deliberation started: ${data.topic.title}`
            });
        });
        
        factionSystem.on('proposal-created', (data) => {
            this.process3DEvent({
                type: 'proposal_created',
                faction: data.faction,
                proposalId: data.id,
                content: data.proposal,
                description: `New proposal from ${data.faction}`
            });
        });
        
        factionSystem.on('decision-made', (data) => {
            this.process3DEvent({
                type: 'decision_made',
                proposalId: data.proposalId,
                decision: data.decision,
                description: `Decision ${data.decision} on proposal`
            });
        });
        
        factionSystem.on('alliance-formed', (data) => {
            this.process3DEvent({
                type: 'alliance_formed',
                faction1: data.faction1,
                faction2: data.faction2,
                description: `Alliance formed between ${data.faction1} and ${data.faction2}`
            });
        });
        
        factionSystem.on('conflict-detected', (data) => {
            this.process3DEvent({
                type: 'conflict_started',
                faction1: data.faction1,
                faction2: data.faction2,
                description: `Conflict between ${data.faction1} and ${data.faction2}`
            });
        });
    }
}

// Initialize the 3D viewer
const thirdPersonViewer = new ThirdPersonFactionViewer();

// Export for integration
module.exports = thirdPersonViewer;

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║         THIRD-PERSON FACTION VIEWER - INITIALIZED                ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  🎮 3D VISUALIZATION:                                            ║
║  ├─ God-view perspective of all faction activities               ║
║  ├─ Real-time 3D animations of debates and decisions            ║
║  ├─ Visual representations of each faction                       ║
║  ├─ Animated proposals floating in 3D space                     ║
║  └─ Dynamic camera modes for different perspectives             ║
║                                                                  ║
║  📷 CAMERA MODES:                                                ║
║  ├─ Orbit - Rotate around the scene                             ║
║  ├─ Cinematic - Automated camera movements                      ║
║  ├─ Free - WASD controlled free camera                          ║
║  └─ Follow - Track specific factions                            ║
║                                                                  ║
║  🎨 VISUAL EFFECTS:                                              ║
║  ├─ Faction auras and particle effects                          ║
║  ├─ Thought bubbles during deliberations                        ║
║  ├─ Energy connections for alliances/conflicts                  ║
║  ├─ Proposal documents floating and rotating                    ║
║  └─ Decision ripple effects                                     ║
║                                                                  ║
║  🎬 ANIMATIONS:                                                  ║
║  ├─ Debate - Factions gather and argue                          ║
║  ├─ Proposal - Documents emerge and float                       ║
║  ├─ Decision - Approval/denial effects                          ║
║  ├─ Alliance - Green energy bridges form                        ║
║  └─ Conflict - Red lightning between factions                   ║
║                                                                  ║
║  🌐 3D VIEWER: http://localhost:10101                            ║
║                                                                  ║
║  ⚡ STATUS: RENDERING ACTIVE                                     ║
║  🎯 MODE: THIRD-PERSON OBSERVER                                  ║
║  👁️  VIEW: GOD PERSPECTIVE                                       ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
`);