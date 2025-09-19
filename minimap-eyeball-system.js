#!/usr/bin/env node

/**
 * 👁️🗺️ MINIMAP EYEBALL SYSTEM
 * ===========================
 * Visual command center that builds the screen based on eye tracking
 * The eyeball sees, the screen builds, reality expands
 */

const fs = require('fs').promises;
const http = require('http');
const crypto = require('crypto');
const path = require('path');

class MinimapEyeballSystem {
    constructor() {
        this.port = 3333;
        this.eyeball = {
            position: { x: 50, y: 50 }, // Center of minimap
            size: 40,
            pupilPosition: { x: 50, y: 50 },
            lookDirection: { x: 0, y: 0 },
            focusIntensity: 0,
            blinkState: false,
            visionRadius: 100,
            zoomLevel: 1.0
        };
        
        // Screen building system
        this.screenBuilder = {
            canvas: new Map(), // What's been built on screen
            blueprint: new Map(), // What could be built
            buildQueue: [],
            activeBuild: null,
            buildSpeed: 100, // ms per build action
            materials: new Set(['pixels', 'vectors', 'polygons', 'voxels', 'code'])
        };
        
        // Minimap zones - what the eye can see
        this.minimapZones = new Map([
            ['centipede-os', { x: 10, y: 10, w: 20, h: 15, color: '#00ff41', system: 'centipede' }],
            ['infinite-layers', { x: 35, y: 10, w: 25, h: 15, color: '#ff00ff', system: 'infinite' }],
            ['matrix-game', { x: 65, y: 10, w: 25, h: 15, color: '#00ffff', system: 'matrix' }],
            ['hollowtown', { x: 10, y: 30, w: 30, h: 20, color: '#ffff00', system: 'hollowtown' }],
            ['blamechain', { x: 45, y: 30, w: 20, h: 20, color: '#ff4444', system: 'blockchain' }],
            ['voxel-mcp', { x: 70, y: 30, w: 20, h: 20, color: '#44ff44', system: 'voxel' }],
            ['photography', { x: 10, y: 55, w: 25, h: 20, color: '#ff8800', system: 'photo' }],
            ['zk-proofs', { x: 40, y: 55, w: 25, h: 20, color: '#8800ff', system: 'crypto' }],
            ['cloud-drive', { x: 70, y: 55, w: 20, h: 20, color: '#0088ff', system: 'cloud' }],
            ['ai-agents', { x: 10, y: 80, w: 35, h: 15, color: '#ff0088', system: 'ai' }],
            ['xml-mapper', { x: 50, y: 80, w: 40, h: 15, color: '#88ff00', system: 'xml' }]
        ]);
        
        // Screen construction templates
        this.buildTemplates = new Map([
            ['centipede', {
                elements: ['segment-chain', 'zk-validator', 'blame-recorder'],
                layout: 'horizontal-flow',
                interactions: ['click-segment', 'grow-centipede'],
                buildTime: 2000
            }],
            ['infinite', {
                elements: ['layer-browser', 'symlink-tree', 'element-mapper'],
                layout: 'vertical-layers',
                interactions: ['layer-dive', 'symlink-follow'],
                buildTime: 3000
            }],
            ['matrix', {
                elements: ['game-board', 'avatar-upload', 'domingo-boss'],
                layout: 'game-grid',
                interactions: ['level-progress', 'contract-sign'],
                buildTime: 2500
            }],
            ['hollowtown', {
                elements: ['yellow-pages', 'service-directory', 'saga-viewer'],
                layout: 'directory-tree',
                interactions: ['scan-website', 'read-saga'],
                buildTime: 2000
            }],
            ['voxel', {
                elements: ['3d-grid', 'context-viewer', 'reread-system'],
                layout: '3d-space',
                interactions: ['voxel-navigate', 'context-reread'],
                buildTime: 3500
            }],
            ['photo', {
                elements: ['capture-pipeline', 'filter-stack', 'gallery-view'],
                layout: 'pipeline-flow',
                interactions: ['process-photo', 'apply-filter'],
                buildTime: 1500
            }]
        ]);
        
        // Eye tracking states
        this.eyeStates = {
            'scanning': { pupilSize: 0.3, blinkRate: 2000, focusRadius: 150 },
            'focusing': { pupilSize: 0.5, blinkRate: 1000, focusRadius: 80 },
            'building': { pupilSize: 0.7, blinkRate: 500, focusRadius: 50 },
            'creating': { pupilSize: 0.9, blinkRate: 200, focusRadius: 30 }
        };
        
        this.currentState = 'scanning';
        this.buildHistory = [];
        this.eyeMovementHistory = [];
    }
    
    async initialize() {
        console.log('👁️🗺️ MINIMAP EYEBALL SYSTEM INITIALIZING...');
        console.log('===========================================');
        console.log('👁️ Creating visual command center...');
        console.log('🗺️ Mapping available systems...');
        console.log('🔨 Setting up screen builder...');
        console.log('⚡ Enabling eye tracking...');
        console.log('');
        
        await this.initializeEyeTracking();
        await this.prepareScreenBuilder();
        await this.startMinimapServer();
    }
    
    async initializeEyeTracking() {
        console.log('👁️ Initializing eye tracking system...');
        
        // Start eye movement simulation
        this.startEyeMovement();
        
        // Start blinking
        this.startBlinking();
        
        console.log('   ✅ Eye tracking active');
    }
    
    startEyeMovement() {
        setInterval(() => {
            // Simulate natural eye movement
            const movement = this.calculateEyeMovement();
            this.updateEyePosition(movement);
            this.checkFocusZone();
        }, 50); // 20 FPS eye tracking
    }
    
    calculateEyeMovement() {
        // Natural eye movement patterns
        const time = Date.now() / 1000;
        const naturalDrift = {
            x: Math.sin(time * 0.3) * 2,
            y: Math.cos(time * 0.7) * 1.5
        };
        
        // Add some randomness
        const randomJitter = {
            x: (Math.random() - 0.5) * 0.5,
            y: (Math.random() - 0.5) * 0.5
        };
        
        return {
            x: naturalDrift.x + randomJitter.x,
            y: naturalDrift.y + randomJitter.y
        };
    }
    
    updateEyePosition(movement) {
        this.eyeball.pupilPosition.x += movement.x;
        this.eyeball.pupilPosition.y += movement.y;
        
        // Keep pupil within eyeball bounds
        const maxDistance = this.eyeball.size * 0.3;
        const distance = Math.sqrt(
            Math.pow(this.eyeball.pupilPosition.x - this.eyeball.position.x, 2) +
            Math.pow(this.eyeball.pupilPosition.y - this.eyeball.position.y, 2)
        );
        
        if (distance > maxDistance) {
            const angle = Math.atan2(
                this.eyeball.pupilPosition.y - this.eyeball.position.y,
                this.eyeball.pupilPosition.x - this.eyeball.position.x
            );
            this.eyeball.pupilPosition.x = this.eyeball.position.x + Math.cos(angle) * maxDistance;
            this.eyeball.pupilPosition.y = this.eyeball.position.y + Math.sin(angle) * maxDistance;
        }
        
        // Record movement history
        this.eyeMovementHistory.push({
            position: { ...this.eyeball.pupilPosition },
            timestamp: Date.now()
        });
        
        // Keep only last 100 movements
        if (this.eyeMovementHistory.length > 100) {
            this.eyeMovementHistory.shift();
        }
    }
    
    checkFocusZone() {
        const pupil = this.eyeball.pupilPosition;
        let focusedZone = null;
        let maxIntensity = 0;
        
        for (const [zoneName, zone] of this.minimapZones) {
            const distance = Math.sqrt(
                Math.pow(pupil.x - (zone.x + zone.w/2), 2) +
                Math.pow(pupil.y - (zone.y + zone.h/2), 2)
            );
            
            const intensity = Math.max(0, 1 - (distance / this.eyeball.visionRadius));
            
            if (intensity > maxIntensity && intensity > 0.3) {
                maxIntensity = intensity;
                focusedZone = zoneName;
            }
        }
        
        if (focusedZone && maxIntensity > 0.7) {
            this.focusOnZone(focusedZone, maxIntensity);
        }
    }
    
    async focusOnZone(zoneName, intensity) {
        const zone = this.minimapZones.get(zoneName);
        if (!zone) return;
        
        console.log(`👁️ Eye focusing on: ${zoneName} (intensity: ${intensity.toFixed(2)})`);
        
        this.eyeball.focusIntensity = intensity;
        this.currentState = intensity > 0.9 ? 'building' : 'focusing';
        
        // Start building this zone on the main screen
        if (intensity > 0.8 && !this.screenBuilder.activeBuild) {
            await this.startScreenBuild(zone.system, zoneName);
        }
    }
    
    async startScreenBuild(systemType, zoneName) {
        const template = this.buildTemplates.get(systemType);
        if (!template) return;
        
        console.log(`🔨 Starting screen build: ${systemType}`);
        
        this.screenBuilder.activeBuild = {
            system: systemType,
            zone: zoneName,
            template: template,
            progress: 0,
            startTime: Date.now(),
            elements: [...template.elements]
        };
        
        this.currentState = 'building';
        
        // Build elements progressively
        await this.progressiveBuild();
    }
    
    async progressiveBuild() {
        const build = this.screenBuilder.activeBuild;
        if (!build) return;
        
        const buildElement = async (elementName) => {
            console.log(`   🔧 Building element: ${elementName}`);
            
            // Simulate building time
            await new Promise(resolve => setTimeout(resolve, this.screenBuilder.buildSpeed));
            
            // Add to canvas
            this.screenBuilder.canvas.set(elementName, {
                type: elementName,
                system: build.system,
                position: this.calculateElementPosition(elementName, build.template.layout),
                built: Date.now(),
                interactions: build.template.interactions
            });
            
            build.progress = (build.template.elements.length - build.elements.length + 1) / build.template.elements.length;
        };
        
        // Build each element
        while (build.elements.length > 0) {
            const element = build.elements.shift();
            await buildElement(element);
        }
        
        // Build complete
        console.log(`✅ Screen build complete: ${build.system}`);
        this.buildHistory.push({
            ...build,
            completedTime: Date.now(),
            duration: Date.now() - build.startTime
        });
        
        this.screenBuilder.activeBuild = null;
        this.currentState = 'scanning';
    }
    
    calculateElementPosition(elementName, layout) {
        const canvasSize = { width: 800, height: 600 };
        const existingElements = Array.from(this.screenBuilder.canvas.values());
        
        switch (layout) {
            case 'horizontal-flow':
                return {
                    x: existingElements.length * 120 + 50,
                    y: canvasSize.height / 2,
                    width: 100,
                    height: 80
                };
            case 'vertical-layers':
                return {
                    x: canvasSize.width / 2,
                    y: existingElements.length * 100 + 50,
                    width: 200,
                    height: 80
                };
            case 'game-grid':
                const gridPos = existingElements.length;
                return {
                    x: (gridPos % 3) * 200 + 100,
                    y: Math.floor(gridPos / 3) * 150 + 100,
                    width: 150,
                    height: 120
                };
            case '3d-space':
                return {
                    x: Math.random() * (canvasSize.width - 100) + 50,
                    y: Math.random() * (canvasSize.height - 100) + 50,
                    z: Math.random() * 100,
                    width: 80,
                    height: 80
                };
            default:
                return {
                    x: Math.random() * (canvasSize.width - 100) + 50,
                    y: Math.random() * (canvasSize.height - 100) + 50,
                    width: 100,
                    height: 80
                };
        }
    }
    
    startBlinking() {
        const blink = () => {
            this.eyeball.blinkState = true;
            setTimeout(() => {
                this.eyeball.blinkState = false;
            }, 100);
            
            const blinkRate = this.eyeStates[this.currentState].blinkRate;
            setTimeout(blink, blinkRate + Math.random() * 500);
        };
        
        blink();
    }
    
    async prepareScreenBuilder() {
        console.log('🔨 Preparing screen builder...');
        
        // Initialize canvas
        this.screenBuilder.canvas.clear();
        
        // Set up build materials
        console.log(`   ✅ Materials ready: ${Array.from(this.screenBuilder.materials).join(', ')}`);
    }
    
    async startMinimapServer() {
        const server = http.createServer(async (req, res) => {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            
            if (req.url === '/') {
                res.end(await this.generateMinimapInterface());
            } else if (req.url === '/api/eyeball') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    eyeball: this.eyeball,
                    state: this.currentState,
                    focusZone: this.getCurrentFocusZone()
                }));
            } else if (req.url === '/api/canvas') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    elements: Array.from(this.screenBuilder.canvas.entries()),
                    activeBuild: this.screenBuilder.activeBuild,
                    buildHistory: this.buildHistory.slice(-5)
                }));
            } else if (req.url === '/api/zones') {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                    zones: Array.from(this.minimapZones.entries()),
                    eyePosition: this.eyeball.pupilPosition
                }));
            }
        });
        
        server.listen(this.port, () => {
            console.log(`\n👁️ MINIMAP EYEBALL SYSTEM ACTIVE`);
            console.log(`🗺️ Interface: http://localhost:${this.port}`);
            console.log(`\n📊 SYSTEM STATUS:`);
            console.log(`   • Eye State: ${this.currentState}`);
            console.log(`   • Vision Radius: ${this.eyeball.visionRadius}px`);
            console.log(`   • Available Zones: ${this.minimapZones.size}`);
            console.log(`   • Build Templates: ${this.buildTemplates.size}`);
            console.log(`\n🎯 FEATURES:`);
            console.log(`   • Real-time eye tracking simulation`);
            console.log(`   • Dynamic screen building based on focus`);
            console.log(`   • Progressive element construction`);
            console.log(`   • Interactive minimap zones`);
            console.log(`   • Build history tracking`);
        });
    }
    
    getCurrentFocusZone() {
        const pupil = this.eyeball.pupilPosition;
        
        for (const [zoneName, zone] of this.minimapZones) {
            const distance = Math.sqrt(
                Math.pow(pupil.x - (zone.x + zone.w/2), 2) +
                Math.pow(pupil.y - (zone.y + zone.h/2), 2)
            );
            
            if (distance < this.eyeball.visionRadius * 0.5) {
                return { zone: zoneName, distance, intensity: 1 - (distance / this.eyeball.visionRadius) };
            }
        }
        
        return null;
    }
    
    async generateMinimapInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Minimap Eyeball System - Visual Command Center</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        
        body {
            font-family: 'JetBrains Mono', monospace;
            background: #000;
            color: #fff;
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        
        .container {
            display: flex;
            height: 100vh;
        }
        
        .minimap-panel {
            width: 300px;
            background: rgba(0, 20, 40, 0.9);
            border-right: 2px solid #00ffff;
            padding: 20px;
            overflow-y: auto;
        }
        
        .main-screen {
            flex: 1;
            background: #111;
            position: relative;
            overflow: hidden;
        }
        
        .minimap {
            width: 260px;
            height: 200px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ffff;
            border-radius: 10px;
            position: relative;
            margin: 20px 0;
        }
        
        .eyeball {
            position: absolute;
            width: 40px;
            height: 40px;
            background: radial-gradient(circle at center, #fff 20%, #87ceeb 40%, #4682b4 100%);
            border-radius: 50%;
            border: 3px solid #00ffff;
            cursor: pointer;
            transition: all 0.1s;
        }
        
        .pupil {
            position: absolute;
            width: 12px;
            height: 12px;
            background: #000;
            border-radius: 50%;
            transition: all 0.05s;
        }
        
        .iris {
            position: absolute;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, #4a90e2 0%, #2171b5 100%);
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        
        .zone {
            position: absolute;
            border: 1px solid;
            border-radius: 3px;
            background: rgba(255, 255, 255, 0.1);
            cursor: pointer;
            transition: all 0.3s;
            font-size: 8px;
            color: #fff;
            text-align: center;
            line-height: 1.2;
            padding: 2px;
            box-sizing: border-box;
        }
        
        .zone:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
        }
        
        .zone.focused {
            box-shadow: 0 0 10px currentColor;
            background: rgba(255, 255, 255, 0.2);
        }
        
        .build-canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        
        .built-element {
            position: absolute;
            background: rgba(0, 255, 65, 0.2);
            border: 2px solid #00ff41;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #00ff41;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            animation: buildIn 0.5s ease-out;
        }
        
        @keyframes buildIn {
            from {
                opacity: 0;
                transform: scale(0.1);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }
        
        .built-element:hover {
            background: rgba(0, 255, 65, 0.4);
            transform: scale(1.1);
        }
        
        .eye-status {
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #00ffff;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        
        .build-status {
            background: rgba(40, 0, 40, 0.8);
            border: 1px solid #ff00ff;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        
        .progress-bar {
            width: 100%;
            height: 10px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 5px;
            overflow: hidden;
            margin: 5px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff00ff, #00ffff);
            transition: width 0.3s;
        }
        
        .control-panel {
            margin-top: 20px;
        }
        
        .control-button {
            background: #00ff41;
            color: #000;
            border: none;
            padding: 8px 15px;
            margin: 5px 0;
            border-radius: 3px;
            cursor: pointer;
            font-family: inherit;
            font-size: 10px;
            font-weight: bold;
            width: 100%;
        }
        
        .control-button:hover {
            background: #00cc33;
        }
        
        .movement-trail {
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(0, 255, 255, 0.5);
            border-radius: 50%;
            pointer-events: none;
            animation: fadeOut 2s linear forwards;
        }
        
        @keyframes fadeOut {
            to {
                opacity: 0;
                transform: scale(0.1);
            }
        }
        
        .state-indicator {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: #00ffff;
            padding: 10px;
            border-radius: 5px;
            border: 1px solid #00ffff;
        }
        
        .blinking {
            animation: blink 0.1s;
        }
        
        @keyframes blink {
            50% { transform: scaleY(0.1); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="minimap-panel">
            <h2>👁️ EYE COMMAND CENTER</h2>
            
            <div class="minimap" id="minimap">
                <div class="eyeball" id="eyeball">
                    <div class="iris"></div>
                    <div class="pupil" id="pupil"></div>
                </div>
                
                <!-- Zones will be populated by JavaScript -->
            </div>
            
            <div class="eye-status" id="eyeStatus">
                <h4>Eye Status</h4>
                <div>State: <span id="currentState">scanning</span></div>
                <div>Focus: <span id="focusIntensity">0%</span></div>
                <div>Zone: <span id="focusZone">none</span></div>
            </div>
            
            <div class="build-status" id="buildStatus">
                <h4>Build Status</h4>
                <div>Active: <span id="activeBuild">none</span></div>
                <div class="progress-bar">
                    <div class="progress-fill" id="buildProgress" style="width: 0%"></div>
                </div>
                <div>Elements: <span id="elementCount">0</span></div>
            </div>
            
            <div class="control-panel">
                <button class="control-button" onclick="centerEye()">Center Eye</button>
                <button class="control-button" onclick="clearCanvas()">Clear Canvas</button>
                <button class="control-button" onclick="toggleEyeTracking()">Toggle Tracking</button>
                <button class="control-button" onclick="focusRandomZone()">Random Focus</button>
            </div>
        </div>
        
        <div class="main-screen" id="mainScreen">
            <div class="state-indicator" id="stateIndicator">
                SCANNING
            </div>
            <div class="build-canvas" id="buildCanvas">
                <!-- Built elements appear here -->
            </div>
        </div>
    </div>
    
    <script>
        let eyeTracking = true;
        let zones = new Map();
        let builtElements = new Map();
        
        async function loadZones() {
            const response = await fetch('/api/zones');
            const data = await response.json();
            
            zones = new Map(data.zones);
            renderZones();
        }
        
        function renderZones() {
            const minimap = document.getElementById('minimap');
            
            // Clear existing zones
            minimap.querySelectorAll('.zone').forEach(z => z.remove());
            
            // Add zones
            zones.forEach((zone, name) => {
                const zoneEl = document.createElement('div');
                zoneEl.className = 'zone';
                zoneEl.style.left = zone.x + '%';
                zoneEl.style.top = zone.y + '%';
                zoneEl.style.width = zone.w + '%';
                zoneEl.style.height = zone.h + '%';
                zoneEl.style.borderColor = zone.color;
                zoneEl.style.color = zone.color;
                zoneEl.textContent = name.replace('-', '\\n').toUpperCase();
                zoneEl.onclick = () => focusOnZone(name);
                minimap.appendChild(zoneEl);
            });
        }
        
        async function updateEyeball() {
            if (!eyeTracking) return;
            
            const response = await fetch('/api/eyeball');
            const data = await response.json();
            
            const eyeball = document.getElementById('eyeball');
            const pupil = document.getElementById('pupil');
            
            eyeball.style.left = data.eyeball.position.x + '%';
            eyeball.style.top = data.eyeball.position.y + '%';
            
            pupil.style.left = (data.eyeball.pupilPosition.x - data.eyeball.position.x) * 2 + 14 + 'px';
            pupil.style.top = (data.eyeball.pupilPosition.y - data.eyeball.position.y) * 2 + 14 + 'px';
            
            // Update state
            document.getElementById('currentState').textContent = data.state;
            document.getElementById('stateIndicator').textContent = data.state.toUpperCase();
            
            if (data.focusZone) {
                document.getElementById('focusZone').textContent = data.focusZone.zone;
                document.getElementById('focusIntensity').textContent = (data.focusZone.intensity * 100).toFixed(0) + '%';
                
                // Highlight focused zone
                document.querySelectorAll('.zone').forEach(z => z.classList.remove('focused'));
                const focusedZone = Array.from(document.querySelectorAll('.zone')).find(z => 
                    z.textContent.toLowerCase().includes(data.focusZone.zone.split('-')[0])
                );
                if (focusedZone) focusedZone.classList.add('focused');
            } else {
                document.getElementById('focusZone').textContent = 'none';
                document.getElementById('focusIntensity').textContent = '0%';
                document.querySelectorAll('.zone').forEach(z => z.classList.remove('focused'));
            }
            
            // Blinking effect
            if (data.eyeball.blinkState) {
                eyeball.classList.add('blinking');
                setTimeout(() => eyeball.classList.remove('blinking'), 100);
            }
        }
        
        async function updateCanvas() {
            const response = await fetch('/api/canvas');
            const data = await response.json();
            
            const canvas = document.getElementById('buildCanvas');
            
            // Update active build status
            if (data.activeBuild) {
                document.getElementById('activeBuild').textContent = data.activeBuild.system;
                document.getElementById('buildProgress').style.width = (data.activeBuild.progress * 100) + '%';
            } else {
                document.getElementById('activeBuild').textContent = 'none';
                document.getElementById('buildProgress').style.width = '0%';
            }
            
            document.getElementById('elementCount').textContent = data.elements.length;
            
            // Add new elements
            data.elements.forEach(([name, element]) => {
                if (!builtElements.has(name)) {
                    const elementEl = document.createElement('div');
                    elementEl.className = 'built-element';
                    elementEl.style.left = element.position.x + 'px';
                    elementEl.style.top = element.position.y + 'px';
                    elementEl.style.width = element.position.width + 'px';
                    elementEl.style.height = element.position.height + 'px';
                    elementEl.textContent = name.toUpperCase();
                    elementEl.onclick = () => interactWithElement(name, element);
                    canvas.appendChild(elementEl);
                    builtElements.set(name, elementEl);
                }
            });
        }
        
        function focusOnZone(zoneName) {
            console.log('Manually focusing on zone:', zoneName);
            // Could trigger specific build here
        }
        
        function centerEye() {
            // Reset eye to center - would send command to backend
            console.log('Centering eye');
        }
        
        function clearCanvas() {
            document.getElementById('buildCanvas').innerHTML = '';
            builtElements.clear();
        }
        
        function toggleEyeTracking() {
            eyeTracking = !eyeTracking;
            console.log('Eye tracking:', eyeTracking);
        }
        
        function focusRandomZone() {
            const zoneNames = Array.from(zones.keys());
            const randomZone = zoneNames[Math.floor(Math.random() * zoneNames.length)];
            focusOnZone(randomZone);
        }
        
        function interactWithElement(name, element) {
            console.log('Interacting with element:', name, element);
            // Trigger element-specific interactions
        }
        
        // Initialize
        loadZones();
        
        // Update loops
        setInterval(updateEyeball, 100); // 10 FPS
        setInterval(updateCanvas, 500);  // 2 FPS
        setInterval(loadZones, 5000);    // Refresh zones every 5s
    </script>
</body>
</html>`;
    }
}

// Initialize the minimap eyeball system
const minimapEyeball = new MinimapEyeballSystem();
minimapEyeball.initialize().catch(error => {
    console.error('❌ Failed to initialize Minimap Eyeball System:', error);
});