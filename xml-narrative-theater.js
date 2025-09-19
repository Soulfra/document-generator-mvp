#!/usr/bin/env node

/**
 * 🎭🎪 XML NARRATIVE THEATER
 * =========================
 * Interactive storytelling system that paints XML flow from inside out
 * Multiple perspectives: Claw Machine, TV Pixels, Whip Vectors
 * Showboat commentary and narrative generation
 */

const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');
const crypto = require('crypto');
const http = require('http');

class XMLNarrativeTheater {
    constructor() {
        this.vizDir = path.join(process.cwd(), '.reasoning-viz');
        this.theaterDir = path.join(this.vizDir, 'narrative-theater');
        
        // Theater HTTP server
        this.httpServer = null;
        this.httpPort = 8100;
        
        // WebSocket servers
        this.theaterWsServer = null;
        this.audienceClients = new Set();
        
        // Narrative state
        this.narrativeState = {
            currentAct: 1,
            currentScene: 1,
            storyMode: 'genesis', // genesis, conflict, resolution, finale
            perspectiveMode: 'claw-machine', // claw-machine, tv-pixels, whip-vector
            showboatLevel: 5, // 1-10 how dramatic the narration
            
            // Story elements
            characters: new Map(), // XML tiers as characters
            plotPoints: [],
            tensions: [],
            resolutions: [],
            
            // Visual metaphors
            clawPosition: { x: 0, y: 0, z: 100 },
            pixelGrid: this.generatePixelGrid(),
            whipVectors: [],
            
            // Commentary queue
            commentaryQueue: [],
            narrativeVoice: 'dramatic-showboat'
        };
        
        // Showboat narrator personalities
        this.narratorPersonalities = {
            'dramatic-showboat': {
                greeting: "LADIES AND GENTLEMEN, BOYS AND GIRLS! Welcome to the GREATEST XML SHOW ON EARTH!",
                exclamations: ["BEHOLD!", "WITNESS!", "MARVEL AT!", "GAZE UPON!", "FEAST YOUR EYES!"],
                metaphors: ["like a digital phoenix", "as if painted by the gods", "with the force of a thousand suns", "dancing through cyberspace", "weaving reality itself"],
                drama: 10
            },
            'noir-detective': {
                greeting: "The city sleeps, but the data never does. Welcome to the dark underbelly of XML...",
                exclamations: ["It was then...", "In the shadows...", "The plot thickens...", "A twist emerges..."],
                metaphors: ["like smoke in the digital rain", "darker than a null pointer", "twisted as corrupted memory", "cold as a dead process"],
                drama: 7
            },
            'carnival-barker': {
                greeting: "Step right up, step right up! See the AMAZING, the STUPENDOUS, the MIND-BLOWING XML CIRCUS!",
                exclamations: ["ONE TIME ONLY!", "YOU WON'T BELIEVE!", "NEVER BEFORE SEEN!", "ABSOLUTELY INCREDIBLE!"],
                metaphors: ["spinning like a carousel", "brighter than carnival lights", "wild as a runaway ride", "explosive as fireworks"],
                drama: 9
            },
            'zen-master': {
                greeting: "Welcome, seekers. Observe the flow of data as water observes the stone...",
                exclamations: ["Notice...", "Consider...", "Reflect upon...", "Breathe with..."],
                metaphors: ["flowing like digital water", "balanced as yin and yang", "growing like bamboo", "patient as the mountain"],
                drama: 3
            },
            'game-show-host': {
                greeting: "HELLOOOO EVERYBODY! Are you ready to play... WHEEL! OF! XML!",
                exclamations: ["FANTASTIC!", "UNBELIEVABLE!", "WHAT A MOVE!", "CAN YOU BELIEVE IT?!"],
                metaphors: ["scoring big points", "hitting the jackpot", "going for the gold", "winning the grand prize"],
                drama: 8
            }
        };
        
        // Story generation engine
        this.storyEngine = {
            acts: {
                1: { name: "The Awakening", theme: "initialization" },
                2: { name: "The Connection", theme: "handshakes" },
                3: { name: "The Convergence", theme: "consensus" },
                4: { name: "The Transformation", theme: "processing" },
                5: { name: "The Revelation", theme: "visualization" }
            },
            
            conflictGenerators: [
                () => "But wait! A wild timeout appears, threatening our heroes!",
                () => "Suddenly, the licensing layer demands attribution!",
                () => "The meta-orchestrator calls for order amidst the chaos!",
                () => "Data flows collide in a spectacular cascade!",
                () => "The gaming engine revs up to maximum performance!"
            ],
            
            resolutionGenerators: [
                () => "Through clever handshaking, harmony is restored!",
                () => "The five layers unite in perfect synchronization!",
                () => "Performance optimization saves the day!",
                () => "Byzantine consensus brings order to chaos!",
                () => "The XML mapping completes its epic journey!"
            ]
        };
        
        // Visual effect generators
        this.effectGenerators = {
            clawMachine: {
                grab: () => ({ action: 'grab', duration: 2000, particles: 50 }),
                swing: () => ({ action: 'swing', duration: 3000, trail: true }),
                drop: () => ({ action: 'drop', duration: 1000, impact: true })
            },
            
            tvPixels: {
                static: () => ({ effect: 'static', intensity: 0.5, duration: 500 }),
                scanlines: () => ({ effect: 'scanlines', speed: 0.02, glow: true }),
                channelChange: () => ({ effect: 'channel-flip', channels: 5 })
            },
            
            whipVectors: {
                crack: () => ({ sound: 'whip-crack', vector: this.generateWhipPath(), speed: 0.1 }),
                lasso: () => ({ shape: 'lasso', radius: 100, rotation: 0.05 }),
                spiral: () => ({ pattern: 'spiral', coils: 5, expansion: 0.02 })
            }
        };
        
        this.logger = require('./reasoning-logger');
        this.init();
    }
    
    async init() {
        await this.setupTheaterDirectories();
        await this.createTheaterInterface();
        await this.startTheaterServer();
        await this.connectToXMLViewer();
        await this.startNarrativeEngine();
        
        console.log('🎭🎪 XML NARRATIVE THEATER ACTIVE');
        console.log('=================================');
        console.log(`🎪 Theater Interface: http://localhost:${this.httpPort}`);
        console.log('🎭 Multiple perspective storytelling');
        console.log('🎯 Claw machine operation mode');
        console.log('📺 TV pixel grid visualization');
        console.log('🎯 Whip vector commentary system');
        console.log('🎪 Showboat narrator ready!');
    }
    
    async setupTheaterDirectories() {
        const dirs = [
            this.theaterDir,
            path.join(this.theaterDir, 'recordings'),
            path.join(this.theaterDir, 'screenshots'),
            path.join(this.theaterDir, 'narratives')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    generatePixelGrid() {
        const grid = [];
        const width = 64;
        const height = 48;
        
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                row.push({
                    x: x,
                    y: y,
                    color: '#000000',
                    brightness: 0,
                    data: null
                });
            }
            grid.push(row);
        }
        
        return grid;
    }
    
    generateWhipPath() {
        const points = [];
        const segments = 20;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = Math.sin(t * Math.PI * 2) * 100 * (1 - t);
            const y = Math.cos(t * Math.PI * 4) * 50 * (1 - t);
            const z = t * 200;
            points.push({ x, y, z });
        }
        
        return points;
    }
    
    async createTheaterInterface() {
        console.log('🎭 Creating narrative theater interface...');
        
        const theaterHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎭🎪 XML Narrative Theater - The Greatest Show in Cyberspace!</title>
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Baskerville', 'Georgia', serif;
            background: linear-gradient(135deg, #1a0033 0%, #330011 100%);
            color: #ffd700;
            overflow: hidden;
            height: 100vh;
            display: grid;
            grid-template-rows: 80px 1fr 150px;
            grid-template-columns: 250px 1fr 300px;
            gap: 15px;
            padding: 15px;
        }
        
        .theater-header {
            grid-column: 1 / -1;
            background: linear-gradient(90deg, #660000 0%, #000066 50%, #660000 100%);
            border: 3px solid #ffd700;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 30px;
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
            position: relative;
            overflow: hidden;
        }
        
        .theater-header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: repeating-conic-gradient(
                from 0deg at 50% 50%,
                transparent 0deg,
                rgba(255, 215, 0, 0.1) 10deg,
                transparent 20deg
            );
            animation: spotlight 20s linear infinite;
        }
        
        @keyframes spotlight {
            to { transform: rotate(360deg); }
        }
        
        .perspective-controls {
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 20px;
            overflow-y: auto;
        }
        
        .main-stage {
            background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
            border: 3px solid #ffd700;
            border-radius: 20px;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .commentary-booth {
            background: linear-gradient(180deg, rgba(0, 0, 0, 0.9) 0%, rgba(50, 0, 0, 0.9) 100%);
            border: 2px solid #ffd700;
            border-radius: 15px;
            padding: 20px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
        }
        
        .narrative-marquee {
            grid-column: 1 / -1;
            background: #000;
            border: 3px solid #ffd700;
            border-radius: 15px;
            padding: 20px;
            overflow: hidden;
            position: relative;
        }
        
        .marquee-text {
            position: absolute;
            white-space: nowrap;
            animation: marquee 30s linear infinite;
            font-size: 24px;
            text-shadow: 0 0 10px #ffd700;
            letter-spacing: 3px;
        }
        
        @keyframes marquee {
            from { transform: translateX(100%); }
            to { transform: translateX(-100%); }
        }
        
        #mainCanvas {
            width: 100%;
            height: 100%;
            cursor: none;
        }
        
        .claw-machine {
            position: absolute;
            width: 60px;
            height: 80px;
            pointer-events: none;
            filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.8));
        }
        
        .claw-part {
            position: absolute;
            width: 20px;
            height: 40px;
            background: linear-gradient(90deg, #silver 0%, #gold 50%, #silver 100%);
            border: 1px solid #000;
            transform-origin: top center;
        }
        
        .tv-static {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            opacity: 0.1;
            pointer-events: none;
            background-image: 
                repeating-linear-gradient(
                    0deg,
                    rgba(255, 255, 255, 0.03),
                    rgba(255, 255, 255, 0.03) 1px,
                    transparent 1px,
                    transparent 2px
                );
            animation: static-move 0.5s steps(10) infinite;
        }
        
        @keyframes static-move {
            to { transform: translateY(10px); }
        }
        
        .whip-trail {
            position: absolute;
            stroke: #ffd700;
            fill: none;
            stroke-width: 3;
            filter: drop-shadow(0 0 10px #ffd700);
            pointer-events: none;
        }
        
        .control-section {
            margin: 20px 0;
        }
        
        .control-title {
            font-size: 18px;
            margin-bottom: 10px;
            text-shadow: 0 0 5px currentColor;
        }
        
        .perspective-btn {
            display: block;
            width: 100%;
            margin: 5px 0;
            padding: 10px;
            background: linear-gradient(45deg, #330000 0%, #000033 100%);
            border: 2px solid #ffd700;
            color: #ffd700;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .perspective-btn:hover {
            background: linear-gradient(45deg, #660000 0%, #000066 100%);
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            transform: scale(1.05);
        }
        
        .perspective-btn.active {
            background: linear-gradient(45deg, #990000 0%, #000099 100%);
            box-shadow: 0 0 30px rgba(255, 215, 0, 0.8);
        }
        
        .narrator-select {
            width: 100%;
            padding: 10px;
            background: #000;
            border: 2px solid #ffd700;
            color: #ffd700;
            border-radius: 5px;
            margin: 10px 0;
        }
        
        .showboat-slider {
            width: 100%;
            margin: 10px 0;
        }
        
        .commentary-line {
            margin: 5px 0;
            padding: 5px;
            border-left: 3px solid #ffd700;
            padding-left: 10px;
            animation: glow-in 0.5s ease-out;
        }
        
        @keyframes glow-in {
            from {
                opacity: 0;
                transform: translateX(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        .theater-title {
            font-size: 36px;
            text-shadow: 
                0 0 10px #ffd700,
                0 0 20px #ffd700,
                0 0 30px #ffd700;
            z-index: 1;
            position: relative;
        }
        
        .act-scene {
            font-size: 20px;
            z-index: 1;
            position: relative;
        }
        
        .effect-particles {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #ffd700;
            border-radius: 50%;
            pointer-events: none;
            animation: particle-float 3s ease-out forwards;
        }
        
        @keyframes particle-float {
            to {
                transform: translateY(-100px) scale(0);
                opacity: 0;
            }
        }
        
        .pixel-display {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: grid;
            grid-template-columns: repeat(64, 8px);
            grid-template-rows: repeat(48, 8px);
            gap: 1px;
            background: #000;
            padding: 10px;
            border: 2px solid #ffd700;
            border-radius: 10px;
        }
        
        .pixel {
            width: 8px;
            height: 8px;
            background: #000;
            transition: all 0.1s;
        }
        
        .story-controls {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }
        
        .story-btn {
            flex: 1;
            padding: 8px;
            background: #000;
            border: 1px solid #ffd700;
            color: #ffd700;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .story-btn:hover {
            background: #330000;
        }
    </style>
</head>
<body>
    <div class="theater-header">
        <h1 class="theater-title">🎭 XML NARRATIVE THEATER 🎪</h1>
        <div class="act-scene">Act <span id="currentAct">1</span> • Scene <span id="currentScene">1</span></div>
    </div>
    
    <div class="perspective-controls">
        <div class="control-section">
            <h3 class="control-title">🎯 PERSPECTIVE</h3>
            <button class="perspective-btn active" data-mode="claw-machine">🎯 Claw Machine</button>
            <button class="perspective-btn" data-mode="tv-pixels">📺 TV Pixels</button>
            <button class="perspective-btn" data-mode="whip-vector">🎯 Whip Vectors</button>
        </div>
        
        <div class="control-section">
            <h3 class="control-title">🎭 NARRATOR</h3>
            <select class="narrator-select" id="narratorSelect">
                <option value="dramatic-showboat">🎪 Dramatic Showboat</option>
                <option value="noir-detective">🕵️ Noir Detective</option>
                <option value="carnival-barker">🎡 Carnival Barker</option>
                <option value="zen-master">☯️ Zen Master</option>
                <option value="game-show-host">🎮 Game Show Host</option>
            </select>
        </div>
        
        <div class="control-section">
            <h3 class="control-title">🎪 SHOWBOAT LEVEL</h3>
            <input type="range" class="showboat-slider" id="showboatSlider" 
                   min="1" max="10" value="5" />
            <div style="text-align: center; margin-top: 5px;">
                <span id="showboatLevel">5</span> / 10
            </div>
        </div>
        
        <div class="story-controls">
            <button class="story-btn" id="pauseBtn">⏸️ Pause</button>
            <button class="story-btn" id="recordBtn">⏺️ Record</button>
            <button class="story-btn" id="commentBtn">💬 Comment</button>
        </div>
    </div>
    
    <div class="main-stage" id="mainStage">
        <canvas id="mainCanvas"></canvas>
        <div class="tv-static" id="tvStatic"></div>
        <div class="claw-machine" id="clawMachine" style="display: none;">
            <div class="claw-part" style="left: 0; transform: rotate(-30deg);"></div>
            <div class="claw-part" style="left: 20px;"></div>
            <div class="claw-part" style="left: 40px; transform: rotate(30deg);"></div>
        </div>
        <svg class="whip-trail" id="whipTrail" style="display: none;">
            <path id="whipPath" d="" />
        </svg>
    </div>
    
    <div class="commentary-booth" id="commentaryBooth">
        <div class="commentary-line">🎪 <strong>SHOWBOAT:</strong> Ladies and gentlemen, the show is about to begin!</div>
    </div>
    
    <div class="narrative-marquee">
        <div class="marquee-text" id="marqueeText">
            🎭 THE GREATEST XML SHOW ON EARTH 🎪 Watch as data flows become epic tales 🎯 See the story painted from inside out 📺 Marvel at the spectacle of five layers in harmony 🎪
        </div>
    </div>
    
    <script>
        class NarrativeTheaterShow {
            constructor() {
                this.canvas = document.getElementById('mainCanvas');
                this.ctx = this.canvas.getContext('2d');
                this.stage = document.getElementById('mainStage');
                
                this.ws = null;
                this.perspective = 'claw-machine';
                this.narrator = 'dramatic-showboat';
                this.showboatLevel = 5;
                this.paused = false;
                this.recording = false;
                
                // Visual elements
                this.clawMachine = document.getElementById('clawMachine');
                this.whipTrail = document.getElementById('whipTrail');
                this.tvStatic = document.getElementById('tvStatic');
                
                // Story state
                this.currentStory = {
                    characters: new Map(),
                    events: [],
                    tensions: 0,
                    climaxReached: false
                };
                
                // Animation state
                this.animations = [];
                this.particles = [];
                this.pixelGrid = null;
                this.whipPoints = [];
                
                this.init();
            }
            
            async init() {
                this.setupCanvas();
                this.connectWebSocket();
                this.setupControls();
                this.startShowtime();
                
                console.log('🎭 Narrative Theater Show initialized!');
            }
            
            setupCanvas() {
                const resize = () => {
                    const rect = this.stage.getBoundingClientRect();
                    this.canvas.width = rect.width;
                    this.canvas.height = rect.height;
                    
                    if (this.perspective === 'tv-pixels') {
                        this.createPixelDisplay();
                    }
                };
                
                window.addEventListener('resize', resize);
                resize();
            }
            
            connectWebSocket() {
                try {
                    this.ws = new WebSocket('ws://localhost:8100/narrative-theater');
                    
                    this.ws.onopen = () => {
                        this.addCommentary('✨ The connection to the narrative realm is established!', 'system');
                        this.announce('Welcome to the show!');
                    };
                    
                    this.ws.onmessage = (event) => {
                        const message = JSON.parse(event.data);
                        this.handleTheaterMessage(message);
                    };
                    
                    this.ws.onclose = () => {
                        this.addCommentary('🎭 The curtain falls... but the show must go on!', 'system');
                        setTimeout(() => this.connectWebSocket(), 5000);
                    };
                    
                } catch (error) {
                    console.error('WebSocket error:', error);
                }
            }
            
            handleTheaterMessage(message) {
                if (this.paused) return;
                
                switch (message.type) {
                    case 'story-event':
                        this.processStoryEvent(message.data);
                        break;
                        
                    case 'character-update':
                        this.updateCharacter(message.data);
                        break;
                        
                    case 'narrative-beat':
                        this.narrateBeat(message.data);
                        break;
                        
                    case 'visual-effect':
                        this.triggerVisualEffect(message.data);
                        break;
                        
                    case 'act-change':
                        this.changeAct(message.data);
                        break;
                }
                
                if (this.recording) {
                    this.recordEvent(message);
                }
            }
            
            processStoryEvent(event) {
                // Add to story
                this.currentStory.events.push(event);
                
                // Generate dramatic narration
                const narration = this.generateNarration(event);
                this.announce(narration);
                
                // Create visual representation
                this.visualizeEvent(event);
                
                // Check for story beats
                if (event.type === 'conflict') {
                    this.currentStory.tensions++;
                    this.createTensionEffect();
                } else if (event.type === 'resolution') {
                    this.currentStory.tensions = Math.max(0, this.currentStory.tensions - 1);
                    this.createResolutionEffect();
                }
            }
            
            generateNarration(event) {
                const personality = this.getPersonality();
                const exclamation = personality.exclamations[Math.floor(Math.random() * personality.exclamations.length)];
                const metaphor = personality.metaphors[Math.floor(Math.random() * personality.metaphors.length)];
                
                let narration = exclamation + ' ';
                
                switch (event.type) {
                    case 'data-flow':
                        narration += \`The data flows from \${event.source} to \${event.target}, \${metaphor}!\`;
                        break;
                        
                    case 'handshake':
                        narration += \`A magnificent handshake between \${event.layer1} and \${event.layer2}, \${metaphor}!\`;
                        break;
                        
                    case 'conflict':
                        narration += \`Tension rises as \${event.description}, \${metaphor}!\`;
                        break;
                        
                    case 'resolution':
                        narration += \`Peace returns as \${event.description}, \${metaphor}!\`;
                        break;
                        
                    default:
                        narration += \`Something extraordinary happens, \${metaphor}!\`;
                }
                
                return narration;
            }
            
            visualizeEvent(event) {
                switch (this.perspective) {
                    case 'claw-machine':
                        this.animateClawMachine(event);
                        break;
                        
                    case 'tv-pixels':
                        this.animatePixels(event);
                        break;
                        
                    case 'whip-vector':
                        this.animateWhip(event);
                        break;
                }
            }
            
            animateClawMachine(event) {
                // Show claw machine
                this.clawMachine.style.display = 'block';
                
                // Move to event position
                const targetX = this.canvas.width * (0.2 + Math.random() * 0.6);
                const targetY = this.canvas.height * (0.2 + Math.random() * 0.6);
                
                // Animate claw movement
                const animation = {
                    type: 'claw',
                    startX: parseFloat(this.clawMachine.style.left) || targetX,
                    startY: parseFloat(this.clawMachine.style.top) || 0,
                    targetX: targetX,
                    targetY: targetY,
                    progress: 0,
                    speed: 0.02,
                    action: event.type
                };
                
                this.animations.push(animation);
                
                // Create grab effect
                if (event.type === 'data-flow') {
                    setTimeout(() => {
                        this.createGrabEffect(targetX, targetY);
                        this.announce("The claw GRABS the data with precision!");
                    }, 1000);
                }
            }
            
            animatePixels(event) {
                if (!this.pixelGrid) {
                    this.createPixelDisplay();
                }
                
                // Create pixel pattern based on event
                const pattern = this.getPixelPattern(event.type);
                
                // Animate pattern across grid
                const centerX = 32;
                const centerY = 24;
                const radius = 10 + Math.random() * 20;
                
                for (let y = 0; y < 48; y++) {
                    for (let x = 0; x < 64; x++) {
                        const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                        if (dist < radius) {
                            const pixel = this.pixelGrid.children[y * 64 + x];
                            const delay = dist * 50;
                            
                            setTimeout(() => {
                                pixel.style.background = this.getEventColor(event.type);
                                pixel.style.boxShadow = \`0 0 10px \${this.getEventColor(event.type)}\`;
                                
                                setTimeout(() => {
                                    pixel.style.background = '#000';
                                    pixel.style.boxShadow = 'none';
                                }, 1000);
                            }, delay);
                        }
                    }
                }
                
                this.announce("The pixels dance with digital delight!");
            }
            
            animateWhip(event) {
                // Show whip trail
                this.whipTrail.style.display = 'block';
                
                // Generate whip path
                const points = [];
                const segments = 30;
                const time = Date.now() * 0.001;
                
                for (let i = 0; i <= segments; i++) {
                    const t = i / segments;
                    const x = this.canvas.width * 0.1 + 
                             Math.sin(time + t * Math.PI * 4) * 200 * (1 - t) + 
                             t * this.canvas.width * 0.8;
                    const y = this.canvas.height * 0.5 + 
                             Math.cos(time + t * Math.PI * 2) * 100 * (1 - t);
                    
                    points.push(\`\${x},\${y}\`);
                }
                
                // Update SVG path
                const path = \`M \${points.join(' L ')}\`;
                document.getElementById('whipPath').setAttribute('d', path);
                
                // Create crack effect
                if (event.type === 'conflict' || event.type === 'resolution') {
                    this.createWhipCrackEffect(
                        parseFloat(points[points.length - 1].split(',')[0]),
                        parseFloat(points[points.length - 1].split(',')[1])
                    );
                    this.announce("The whip CRACKS with thunderous force!");
                }
            }
            
            createPixelDisplay() {
                // Remove existing pixel display
                const existing = document.querySelector('.pixel-display');
                if (existing) existing.remove();
                
                // Create new pixel grid
                const pixelDisplay = document.createElement('div');
                pixelDisplay.className = 'pixel-display';
                
                for (let i = 0; i < 64 * 48; i++) {
                    const pixel = document.createElement('div');
                    pixel.className = 'pixel';
                    pixelDisplay.appendChild(pixel);
                }
                
                this.stage.appendChild(pixelDisplay);
                this.pixelGrid = pixelDisplay;
            }
            
            getPixelPattern(eventType) {
                const patterns = {
                    'data-flow': 'wave',
                    'handshake': 'pulse',
                    'conflict': 'static',
                    'resolution': 'spiral',
                    'consensus': 'converge'
                };
                return patterns[eventType] || 'random';
            }
            
            getEventColor(eventType) {
                const colors = {
                    'data-flow': '#00ff00',
                    'handshake': '#00ffff',
                    'conflict': '#ff0000',
                    'resolution': '#ffff00',
                    'consensus': '#ff00ff'
                };
                return colors[eventType] || '#ffffff';
            }
            
            createGrabEffect(x, y) {
                // Create particles
                for (let i = 0; i < 20; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'effect-particles';
                    particle.style.left = x + 'px';
                    particle.style.top = y + 'px';
                    particle.style.transform = \`rotate(\${Math.random() * 360}deg)\`;
                    
                    this.stage.appendChild(particle);
                    
                    setTimeout(() => particle.remove(), 3000);
                }
            }
            
            createWhipCrackEffect(x, y) {
                // Create expanding ring
                const ring = document.createElement('div');
                ring.style.position = 'absolute';
                ring.style.left = x + 'px';
                ring.style.top = y + 'px';
                ring.style.width = '0px';
                ring.style.height = '0px';
                ring.style.border = '3px solid #ffd700';
                ring.style.borderRadius = '50%';
                ring.style.transform = 'translate(-50%, -50%)';
                ring.style.transition = 'all 1s ease-out';
                ring.style.opacity = '1';
                
                this.stage.appendChild(ring);
                
                requestAnimationFrame(() => {
                    ring.style.width = '200px';
                    ring.style.height = '200px';
                    ring.style.opacity = '0';
                });
                
                setTimeout(() => ring.remove(), 1000);
            }
            
            createTensionEffect() {
                // Add red tint
                this.stage.style.filter = 'hue-rotate(-20deg) saturate(1.5)';
                
                // Shake effect
                this.stage.style.animation = 'shake 0.5s';
                setTimeout(() => {
                    this.stage.style.animation = '';
                }, 500);
            }
            
            createResolutionEffect() {
                // Golden glow
                this.stage.style.filter = 'hue-rotate(20deg) brightness(1.2)';
                setTimeout(() => {
                    this.stage.style.filter = '';
                }, 2000);
            }
            
            announce(text) {
                // Adjust for showboat level
                let finalText = text;
                
                if (this.showboatLevel >= 8) {
                    finalText = '🎺🎺🎺 ' + finalText.toUpperCase() + ' 🎺🎺🎺';
                } else if (this.showboatLevel >= 5) {
                    finalText = '✨ ' + finalText + ' ✨';
                }
                
                this.addCommentary(finalText, this.narrator);
            }
            
            addCommentary(text, type = 'narrator') {
                const booth = document.getElementById('commentaryBooth');
                const line = document.createElement('div');
                line.className = 'commentary-line';
                
                const timestamp = new Date().toTimeString().split(' ')[0];
                line.innerHTML = \`<small>\${timestamp}</small> <strong>\${type.toUpperCase()}:</strong> \${text}\`;
                
                booth.appendChild(line);
                booth.scrollTop = booth.scrollHeight;
                
                // Limit lines
                while (booth.children.length > 50) {
                    booth.removeChild(booth.firstChild);
                }
            }
            
            getPersonality() {
                // This would connect to the server's personality data
                return {
                    exclamations: ["BEHOLD!", "WITNESS!", "MARVEL AT!"],
                    metaphors: ["like digital lightning", "as if painted by code", "with algorithmic grace"]
                };
            }
            
            setupControls() {
                // Perspective buttons
                document.querySelectorAll('.perspective-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        document.querySelectorAll('.perspective-btn').forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                        
                        this.perspective = btn.dataset.mode;
                        this.switchPerspective();
                    });
                });
                
                // Narrator select
                document.getElementById('narratorSelect').addEventListener('change', (e) => {
                    this.narrator = e.target.value;
                    this.announce(\`The narrator transforms into: \${this.narrator}!\`);
                });
                
                // Showboat slider
                const slider = document.getElementById('showboatSlider');
                slider.addEventListener('input', (e) => {
                    this.showboatLevel = parseInt(e.target.value);
                    document.getElementById('showboatLevel').textContent = this.showboatLevel;
                    
                    if (this.showboatLevel === 10) {
                        this.announce("MAXIMUM SHOWBOAT MODE ACTIVATED! PREPARE FOR ULTIMATE SPECTACLE!");
                    }
                });
                
                // Control buttons
                document.getElementById('pauseBtn').addEventListener('click', () => {
                    this.paused = !this.paused;
                    document.getElementById('pauseBtn').textContent = this.paused ? '▶️ Play' : '⏸️ Pause';
                    this.announce(this.paused ? "The show pauses for dramatic effect..." : "The show resumes with renewed vigor!");
                });
                
                document.getElementById('recordBtn').addEventListener('click', () => {
                    this.recording = !this.recording;
                    document.getElementById('recordBtn').style.background = this.recording ? '#ff0000' : '';
                    this.announce(this.recording ? "Recording this epic tale!" : "Recording complete!");
                });
                
                document.getElementById('commentBtn').addEventListener('click', () => {
                    const comment = prompt("Add your commentary to the show:");
                    if (comment) {
                        this.addCommentary(comment, 'audience');
                        this.ws.send(JSON.stringify({
                            type: 'audience-comment',
                            data: { comment: comment, timestamp: Date.now() }
                        }));
                    }
                });
                
                // Keyboard shortcuts
                document.addEventListener('keydown', (e) => {
                    switch(e.key) {
                        case '1': this.perspective = 'claw-machine'; this.switchPerspective(); break;
                        case '2': this.perspective = 'tv-pixels'; this.switchPerspective(); break;
                        case '3': this.perspective = 'whip-vector'; this.switchPerspective(); break;
                        case ' ': e.preventDefault(); this.paused = !this.paused; break;
                        case '+': this.showboatLevel = Math.min(10, this.showboatLevel + 1); break;
                        case '-': this.showboatLevel = Math.max(1, this.showboatLevel - 1); break;
                    }
                });
            }
            
            switchPerspective() {
                // Hide all perspective elements
                this.clawMachine.style.display = 'none';
                this.whipTrail.style.display = 'none';
                if (this.pixelGrid) this.pixelGrid.style.display = 'none';
                
                // Clear canvas
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Announce perspective change
                const announcements = {
                    'claw-machine': "Behold! The mighty claw descends from above!",
                    'tv-pixels': "Witness! The story unfolds in glorious pixels!",
                    'whip-vector': "Marvel! As vectors crack through cyberspace!"
                };
                
                this.announce(announcements[this.perspective]);
                
                // Show relevant elements
                switch (this.perspective) {
                    case 'claw-machine':
                        this.clawMachine.style.display = 'block';
                        break;
                    case 'tv-pixels':
                        this.createPixelDisplay();
                        break;
                    case 'whip-vector':
                        this.whipTrail.style.display = 'block';
                        break;
                }
            }
            
            changeAct(actData) {
                document.getElementById('currentAct').textContent = actData.act;
                document.getElementById('currentScene').textContent = actData.scene;
                
                this.announce(\`ACT \${actData.act} BEGINS: "\${actData.title}"!\`);
                
                // Create dramatic transition
                this.stage.style.transition = 'all 1s';
                this.stage.style.opacity = '0';
                
                setTimeout(() => {
                    this.stage.style.opacity = '1';
                }, 500);
            }
            
            updateCharacter(character) {
                this.currentStory.characters.set(character.id, character);
                
                // Visualize character based on perspective
                if (this.perspective === 'claw-machine') {
                    // Characters as grabbable objects
                    this.drawCharacterObject(character);
                } else if (this.perspective === 'tv-pixels') {
                    // Characters as pixel sprites
                    this.drawCharacterSprite(character);
                } else if (this.perspective === 'whip-vector') {
                    // Characters as vector paths
                    this.drawCharacterVector(character);
                }
            }
            
            narrateBeat(beat) {
                // Process narrative beat
                const dramaticText = this.amplifyDrama(beat.text);
                this.announce(dramaticText);
                
                // Update marquee
                document.getElementById('marqueeText').textContent = 
                    '🎭 ' + dramaticText + ' 🎪';
            }
            
            amplifyDrama(text) {
                // Apply showboat level modifications
                if (this.showboatLevel >= 9) {
                    text = text.replace(/\\./g, '!!!');
                    text = text.replace(/,/g, '! AND!');
                }
                if (this.showboatLevel >= 7) {
                    text = text.replace(/the/gi, 'THE INCREDIBLE');
                    text = text.replace(/is/gi, 'IS MAGNIFICENTLY');
                }
                if (this.showboatLevel >= 5) {
                    text = text.toUpperCase();
                }
                
                return text;
            }
            
            startShowtime() {
                const animate = () => {
                    requestAnimationFrame(animate);
                    
                    if (!this.paused) {
                        this.updateAnimations();
                        this.renderEffects();
                    }
                };
                
                animate();
                
                // Start with a grand opening
                setTimeout(() => {
                    this.announce("Ladies and gentlemen, boys and girls! Welcome to the GREATEST XML SHOW ON EARTH!");
                }, 1000);
            }
            
            updateAnimations() {
                // Update claw animations
                this.animations.forEach((anim, index) => {
                    anim.progress += anim.speed;
                    
                    if (anim.type === 'claw') {
                        const x = anim.startX + (anim.targetX - anim.startX) * anim.progress;
                        const y = anim.startY + (anim.targetY - anim.startY) * anim.progress;
                        
                        this.clawMachine.style.left = x + 'px';
                        this.clawMachine.style.top = y + 'px';
                        
                        if (anim.progress >= 1) {
                            this.animations.splice(index, 1);
                        }
                    }
                });
                
                // Update particle effects
                this.particles = this.particles.filter(particle => {
                    particle.life -= 0.02;
                    particle.y -= particle.velocity;
                    particle.x += Math.sin(particle.life * 10) * 2;
                    
                    return particle.life > 0;
                });
            }
            
            renderEffects() {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                
                // Render particles
                this.particles.forEach(particle => {
                    this.ctx.fillStyle = \`rgba(255, 215, 0, \${particle.life})\`;
                    this.ctx.beginPath();
                    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    this.ctx.fill();
                });
                
                // Render perspective-specific effects
                if (this.perspective === 'claw-machine') {
                    this.renderClawEffects();
                } else if (this.perspective === 'tv-pixels') {
                    this.renderPixelEffects();
                } else if (this.perspective === 'whip-vector') {
                    this.renderWhipEffects();
                }
            }
            
            renderClawEffects() {
                // Draw targeting reticle
                const clawX = parseFloat(this.clawMachine.style.left) + 30;
                const clawY = parseFloat(this.clawMachine.style.top) + 80;
                
                this.ctx.strokeStyle = '#ffd700';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                
                this.ctx.beginPath();
                this.ctx.arc(clawX, clawY, 50, 0, Math.PI * 2);
                this.ctx.stroke();
                
                this.ctx.setLineDash([]);
            }
            
            renderPixelEffects() {
                // Add scanlines
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                for (let y = 0; y < this.canvas.height; y += 4) {
                    this.ctx.fillRect(0, y, this.canvas.width, 2);
                }
            }
            
            renderWhipEffects() {
                // Add motion blur to whip
                this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
                this.ctx.lineWidth = 10;
                this.ctx.filter = 'blur(5px)';
                
                // Draw previous whip positions
                // (Would be tracked in real implementation)
                
                this.ctx.filter = 'none';
            }
            
            recordEvent(event) {
                // Record for later playback
                const recordedEvent = {
                    timestamp: Date.now(),
                    event: event,
                    perspective: this.perspective,
                    showboatLevel: this.showboatLevel,
                    narrator: this.narrator
                };
                
                // Send to server for storage
                this.ws.send(JSON.stringify({
                    type: 'record-event',
                    data: recordedEvent
                }));
            }
        }
        
        // Initialize the show!
        const show = new NarrativeTheaterShow();
        
        // Add CSS animation for shake effect
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-10px); }
                75% { transform: translateX(10px); }
            }
        \`;
        document.head.appendChild(style);
        
        console.log('🎭🎪 THE SHOW HAS BEGUN! 🎪🎭');
    </script>
</body>
</html>`;
        
        await fs.writeFile(
            path.join(this.theaterDir, 'index.html'),
            theaterHTML
        );
        
        console.log('   ✅ Theater interface created');
    }
    
    async startTheaterServer() {
        console.log('🎪 Starting theater HTTP server...');
        
        this.httpServer = http.createServer(async (req, res) => {
            if (req.url === '/') {
                const html = await fs.readFile(path.join(this.theaterDir, 'index.html'), 'utf8');
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(html);
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        this.httpServer.listen(this.httpPort);
        
        // WebSocket server
        this.theaterWsServer = new WebSocket.Server({
            port: this.httpPort,
            path: '/narrative-theater',
            server: this.httpServer
        });
        
        this.theaterWsServer.on('connection', (ws) => {
            console.log('🎭 Audience member connected to the theater!');
            this.audienceClients.add(ws);
            
            // Send opening narration
            this.sendOpeningNarration(ws);
            
            ws.on('message', (data) => {
                const message = JSON.parse(data);
                this.handleAudienceMessage(message);
            });
            
            ws.on('close', () => {
                this.audienceClients.delete(ws);
            });
        });
        
        console.log(`   ✅ Theater server: http://localhost:${this.httpPort}`);
    }
    
    async connectToXMLViewer() {
        console.log('🔗 Connecting to XML viewer for story data...');
        
        try {
            this.viewerWs = new WebSocket('ws://localhost:8099/xml-viewer');
            
            this.viewerWs.on('open', () => {
                console.log('   ✅ Connected to XML viewer');
                
                // Subscribe to all events
                this.viewerWs.send(JSON.stringify({
                    type: 'SUBSCRIBE_NARRATIVE',
                    data: { 
                        subscriber: 'narrative-theater',
                        storyMode: true
                    }
                }));
            });
            
            this.viewerWs.on('message', (data) => {
                const message = JSON.parse(data);
                this.processViewerData(message);
            });
            
            this.viewerWs.on('close', () => {
                console.log('   ❌ Disconnected from XML viewer');
                setTimeout(() => this.connectToXMLViewer(), 5000);
            });
            
        } catch (error) {
            console.error('Failed to connect to XML viewer:', error);
            setTimeout(() => this.connectToXMLViewer(), 5000);
        }
    }
    
    processViewerData(message) {
        // Transform XML flow data into narrative events
        switch (message.type) {
            case 'xml-flow':
                this.createFlowNarrative(message.data);
                break;
                
            case 'tier-update':
                this.createTierCharacter(message.data);
                break;
                
            case 'layer-status':
                this.updateStageSetup(message.data);
                break;
        }
    }
    
    createFlowNarrative(flowData) {
        // Transform data flow into story event
        const storyEvent = {
            type: 'data-flow',
            source: this.personifyLayer(flowData.from),
            target: this.personifyLayer(flowData.to),
            flowType: flowData.type,
            magnitude: flowData.size,
            timestamp: Date.now()
        };
        
        // Determine if this creates conflict or resolution
        if (flowData.type === 'error' || flowData.type === 'timeout') {
            storyEvent.type = 'conflict';
            storyEvent.description = `${storyEvent.source} struggles to reach ${storyEvent.target}`;
        } else if (flowData.type === 'handshake' || flowData.type === 'consensus') {
            storyEvent.type = 'resolution';
            storyEvent.description = `${storyEvent.source} and ${storyEvent.target} achieve harmony`;
        }
        
        // Add to plot
        this.narrativeState.plotPoints.push(storyEvent);
        
        // Broadcast to audience
        this.broadcastStoryEvent(storyEvent);
    }
    
    createTierCharacter(tierData) {
        const tierId = tierData.tierId;
        
        // Create or update character
        let character = this.narrativeState.characters.get(tierId) || {
            id: tierId,
            name: `The Magnificent Tier ${tierId}`,
            role: this.assignCharacterRole(tierId),
            health: 100,
            mood: 'neutral',
            relationships: new Map()
        };
        
        // Update character state
        character.health = tierData.health || character.health;
        character.mood = this.determineMood(character.health);
        
        this.narrativeState.characters.set(tierId, character);
        
        // Broadcast character update
        this.broadcastToAudience({
            type: 'character-update',
            data: character
        });
    }
    
    assignCharacterRole(tierId) {
        const roles = [
            'The Guardian', 'The Messenger', 'The Scholar', 'The Warrior',
            'The Sage', 'The Trickster', 'The Herald', 'The Keeper',
            'The Wanderer', 'The Oracle', 'The Champion', 'The Mystic',
            'The Sentinel', 'The Architect', 'The Phoenix'
        ];
        return roles[tierId - 1] || 'The Mystery';
    }
    
    determineMood(health) {
        if (health > 80) return 'triumphant';
        if (health > 60) return 'confident';
        if (health > 40) return 'struggling';
        if (health > 20) return 'desperate';
        return 'critical';
    }
    
    personifyLayer(layerName) {
        const personifications = {
            'gaming-engine': 'The Grand Game Master',
            'meta-orchestrator': 'The Wise Conductor',
            'licensing-compliance': 'The Lawful Guardian',
            'xml-stream-integration': 'The Swift Messenger',
            'stream-visualization': 'The All-Seeing Eye'
        };
        return personifications[layerName] || layerName;
    }
    
    async startNarrativeEngine() {
        console.log('🎭 Starting narrative engine...');
        
        // Story progression
        setInterval(() => {
            this.progressStory();
        }, 10000); // Every 10 seconds
        
        // Commentary generation
        setInterval(() => {
            this.generateCommentary();
        }, 5000); // Every 5 seconds
        
        // Visual effects
        setInterval(() => {
            this.triggerRandomEffect();
        }, 15000); // Every 15 seconds
        
        // Act progression
        setInterval(() => {
            this.checkActProgression();
        }, 60000); // Every minute
        
        console.log('   ✅ Narrative engine running');
    }
    
    progressStory() {
        // Check story state
        const currentTension = this.narrativeState.tensions.length;
        const resolved = this.narrativeState.resolutions.length;
        
        // Generate appropriate story beat
        if (currentTension > resolved + 2) {
            // Need resolution
            const resolution = this.generateResolution();
            this.narrativeState.resolutions.push(resolution);
            this.broadcastStoryEvent(resolution);
        } else if (Math.random() > 0.5) {
            // Add conflict
            const conflict = this.generateConflict();
            this.narrativeState.tensions.push(conflict);
            this.broadcastStoryEvent(conflict);
        }
        
        // Check for act change
        if (this.narrativeState.plotPoints.length > 10 * this.narrativeState.currentAct) {
            this.progressToNextAct();
        }
    }
    
    generateConflict() {
        const generator = this.storyEngine.conflictGenerators[
            Math.floor(Math.random() * this.storyEngine.conflictGenerators.length)
        ];
        
        return {
            type: 'conflict',
            description: generator(),
            intensity: Math.random() * 10,
            timestamp: Date.now()
        };
    }
    
    generateResolution() {
        const generator = this.storyEngine.resolutionGenerators[
            Math.floor(Math.random() * this.storyEngine.resolutionGenerators.length)
        ];
        
        return {
            type: 'resolution',
            description: generator(),
            satisfaction: Math.random() * 10,
            timestamp: Date.now()
        };
    }
    
    generateCommentary() {
        const personality = this.narratorPersonalities[this.narrativeState.narrativeVoice];
        const exclamation = personality.exclamations[
            Math.floor(Math.random() * personality.exclamations.length)
        ];
        
        // Generate contextual commentary
        let commentary = exclamation + ' ';
        
        // Comment on current state
        if (this.narrativeState.tensions.length > 3) {
            commentary += "The tension builds to unbearable levels!";
        } else if (this.narrativeState.characters.size > 10) {
            commentary += "So many players on this digital stage!";
        } else if (this.narrativeState.plotPoints.length > 50) {
            commentary += "What an epic tale we're witnessing!";
        } else {
            commentary += "The story continues to unfold!";
        }
        
        // Add to queue
        this.narrativeState.commentaryQueue.push(commentary);
        
        // Broadcast
        this.broadcastToAudience({
            type: 'narrative-beat',
            data: {
                text: commentary,
                intensity: personality.drama
            }
        });
    }
    
    triggerRandomEffect() {
        const effects = ['particle-burst', 'color-shift', 'perspective-wobble', 'dramatic-pause'];
        const effect = effects[Math.floor(Math.random() * effects.length)];
        
        this.broadcastToAudience({
            type: 'visual-effect',
            data: {
                effect: effect,
                duration: 3000,
                intensity: Math.random()
            }
        });
    }
    
    progressToNextAct() {
        this.narrativeState.currentAct++;
        const act = this.storyEngine.acts[this.narrativeState.currentAct];
        
        if (act) {
            this.broadcastToAudience({
                type: 'act-change',
                data: {
                    act: this.narrativeState.currentAct,
                    scene: 1,
                    title: act.name,
                    theme: act.theme
                }
            });
        }
    }
    
    checkActProgression() {
        // Complex logic for story progression based on events
        const eventDensity = this.narrativeState.plotPoints.length / 
                           (Date.now() - this.narrativeState.plotPoints[0]?.timestamp || Date.now());
        
        if (eventDensity > 0.001) { // High activity
            this.narrativeState.showboatLevel = Math.min(10, this.narrativeState.showboatLevel + 1);
        }
    }
    
    sendOpeningNarration(ws) {
        const personality = this.narratorPersonalities[this.narrativeState.narrativeVoice];
        
        ws.send(JSON.stringify({
            type: 'narrative-beat',
            data: {
                text: personality.greeting,
                intensity: personality.drama
            }
        }));
    }
    
    handleAudienceMessage(message) {
        switch (message.type) {
            case 'audience-comment':
                // Add audience participation to the story
                this.narrativeState.plotPoints.push({
                    type: 'audience-interaction',
                    comment: message.data.comment,
                    timestamp: message.data.timestamp
                });
                
                // Acknowledge in narration
                this.generateCommentary();
                break;
                
            case 'perspective-change':
                this.narrativeState.perspectiveMode = message.data.mode;
                break;
                
            case 'narrator-change':
                this.narrativeState.narrativeVoice = message.data.narrator;
                break;
        }
    }
    
    broadcastStoryEvent(event) {
        this.broadcastToAudience({
            type: 'story-event',
            data: event
        });
    }
    
    broadcastToAudience(message) {
        const data = JSON.stringify(message);
        this.audienceClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    async saveNarrative() {
        const narrative = {
            title: `The Epic of ${new Date().toDateString()}`,
            acts: this.narrativeState.currentAct,
            scenes: this.narrativeState.currentScene,
            characters: Array.from(this.narrativeState.characters.values()),
            plotPoints: this.narrativeState.plotPoints,
            tensions: this.narrativeState.tensions,
            resolutions: this.narrativeState.resolutions,
            commentary: this.narrativeState.commentaryQueue,
            duration: Date.now() - this.startTime
        };
        
        const filename = `narrative-${Date.now()}.json`;
        await fs.writeFile(
            path.join(this.theaterDir, 'narratives', filename),
            JSON.stringify(narrative, null, 2)
        );
        
        return filename;
    }
}

module.exports = XMLNarrativeTheater;

// CLI interface
if (require.main === module) {
    const theater = new XMLNarrativeTheater();
    
    console.log(`
🎭🎪 XML NARRATIVE THEATER
========================

The greatest show in cyberspace is now playing!

Access the theater at:
  http://localhost:8100

Features:
  🎯 Claw Machine - Grab and manipulate data from above
  📺 TV Pixels - Watch the story unfold in retro glory  
  🎯 Whip Vectors - Crack through the data with style
  🎭 Multiple narrator personalities
  🎪 Adjustable showboat levels (1-10)
  💬 Audience participation
  
Keyboard shortcuts:
  1 - Claw Machine view
  2 - TV Pixels view
  3 - Whip Vector view
  Space - Pause/Resume
  +/- - Adjust showboat level

The show must go on! 🎪🎭
    `);
}