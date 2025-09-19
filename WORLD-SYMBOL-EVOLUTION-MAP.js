#!/usr/bin/env node
// WORLD-SYMBOL-EVOLUTION-MAP.js - Topographic world map showing symbol evolution

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

class WorldSymbolEvolutionMap {
    constructor() {
        this.port = 9090;
        this.wsPort = 9091;
        
        // ANCIENT WRITING SYSTEMS BY GEOGRAPHIC ORIGIN
        this.writingSystems = {
            // MIDDLE EAST - Cradle of Writing
            'mesopotamia': {
                lat: 33.2232, lon: 43.6793,
                name: 'Mesopotamia',
                system: 'Cuneiform',
                year: -3200,
                symbols: ['𒀭', '𒂗', '𒁍', '𒊩'],
                color: '#8B4513',
                elevation: 200,
                contribution: 'First writing system, accounting and computation'
            },
            'egypt': {
                lat: 26.8206, lon: 30.8025,
                name: 'Ancient Egypt',
                system: 'Hieroglyphics',
                year: -3200,
                symbols: ['𓂀', '𓊖', '𓆎', '𓅓', '𓎛'],
                color: '#DAA520',
                elevation: 100,
                contribution: 'Visual symbols for concepts, first "programming" concepts'
            },
            'phoenicia': {
                lat: 33.2721, lon: 35.2033,
                name: 'Phoenicia',
                system: 'Alphabet',
                year: -1050,
                symbols: ['א', 'ב', 'ג', 'ד'],
                color: '#4B0082',
                elevation: 50,
                contribution: 'First alphabet, foundation of all Western writing'
            },
            
            // EUROPE - Logic and Mathematics
            'greece': {
                lat: 37.9838, lon: 23.7275,
                name: 'Ancient Greece',
                system: 'Greek Alphabet',
                year: -800,
                symbols: ['Α', 'Β', 'Γ', 'Δ', 'Λ', 'Σ', 'Ω'],
                color: '#0000FF',
                elevation: 500,
                contribution: 'Logic, mathematics, algorithms (Al-Khwarizmi)'
            },
            'rome': {
                lat: 41.9028, lon: 12.4964,
                name: 'Roman Empire',
                system: 'Latin',
                year: -700,
                symbols: ['I', 'V', 'X', 'L', 'C', 'D', 'M'],
                color: '#DC143C',
                elevation: 300,
                contribution: 'Numerals, legal code structure'
            },
            'scandinavia': {
                lat: 59.9139, lon: 10.7522,
                name: 'Viking Scandinavia',
                system: 'Runes',
                year: 150,
                symbols: ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ'],
                color: '#4682B4',
                elevation: 800,
                contribution: 'Mystical computation, early encryption'
            },
            
            // ASIA - Eastern Philosophy
            'china': {
                lat: 34.5199, lon: 108.7066,
                name: 'Ancient China',
                system: 'Chinese Characters',
                year: -1250,
                symbols: ['甲', '乙', '丙', '丁'],
                color: '#FF0000',
                elevation: 1200,
                contribution: 'I Ching binary system, first binary computation'
            },
            'india': {
                lat: 20.5937, lon: 78.9629,
                name: 'Ancient India',
                system: 'Sanskrit',
                year: -1500,
                symbols: ['अ', 'आ', 'इ', 'ई'],
                color: '#FF7F00',
                elevation: 600,
                contribution: 'Zero concept, decimal system, algorithms'
            },
            'japan': {
                lat: 36.2048, lon: 138.2529,
                name: 'Japan',
                system: 'Kanji/Kana',
                year: 500,
                symbols: ['あ', 'か', 'さ', 'た'],
                color: '#FF1493',
                elevation: 1500,
                contribution: 'Efficiency in symbols, compact notation'
            },
            
            // AMERICAS - New World Systems
            'maya': {
                lat: 17.2220, lon: -89.6237,
                name: 'Maya Civilization',
                system: 'Maya Glyphs',
                year: -300,
                symbols: ['𝋠', '𝋡', '𝋢', '𝋣'],
                color: '#228B22',
                elevation: 400,
                contribution: 'Advanced calendar computation, zero concept'
            },
            'inca': {
                lat: -13.5319, lon: -71.9675,
                name: 'Inca Empire',
                system: 'Quipu',
                year: 1200,
                symbols: ['⚬', '⚭', '⚮', '⚯'],
                color: '#FFD700',
                elevation: 3400,
                contribution: 'Knot-based computation, physical programming'
            },
            
            // MODERN COMPUTING CENTERS
            'manchester': {
                lat: 53.4808, lon: -2.2426,
                name: 'Manchester UK',
                system: 'Manchester Baby',
                year: 1948,
                symbols: ['0', '1'],
                color: '#000080',
                elevation: 100,
                contribution: 'First stored-program computer'
            },
            'philadelphia': {
                lat: 39.9526, lon: -75.1652,
                name: 'Philadelphia USA',
                system: 'ENIAC',
                year: 1945,
                symbols: ['00', '01', '10', '11'],
                color: '#00008B',
                elevation: 50,
                contribution: 'First general-purpose computer'
            },
            'zurich': {
                lat: 47.3769, lon: 8.5417,
                name: 'Zurich ETH',
                system: 'Algol',
                year: 1958,
                symbols: ['begin', 'end', ':='],
                color: '#4169E1',
                elevation: 400,
                contribution: 'Structured programming'
            },
            'palo_alto': {
                lat: 37.4419, lon: -122.1430,
                name: 'Silicon Valley',
                system: 'Modern Languages',
                year: 1970,
                symbols: ['{}', '()', '[]', '=>'],
                color: '#00CED1',
                elevation: 20,
                contribution: 'C, JavaScript, modern computing'
            }
        };
        
        // SYMBOL FLOW CONNECTIONS
        this.symbolFlows = [
            // Ancient flows
            { from: 'mesopotamia', to: 'egypt', strength: 1.0 },
            { from: 'egypt', to: 'phoenicia', strength: 0.8 },
            { from: 'phoenicia', to: 'greece', strength: 1.0 },
            { from: 'greece', to: 'rome', strength: 0.9 },
            { from: 'mesopotamia', to: 'india', strength: 0.6 },
            { from: 'india', to: 'china', strength: 0.7 },
            { from: 'china', to: 'japan', strength: 0.8 },
            
            // Viking connections
            { from: 'rome', to: 'scandinavia', strength: 0.5 },
            
            // To modern computing
            { from: 'greece', to: 'manchester', strength: 0.7 },
            { from: 'india', to: 'manchester', strength: 0.8 },
            { from: 'manchester', to: 'philadelphia', strength: 0.9 },
            { from: 'philadelphia', to: 'zurich', strength: 0.8 },
            { from: 'zurich', to: 'palo_alto', strength: 1.0 }
        ];
        
        // ACTIVE FLOWS
        this.activeFlows = [];
        this.flowSpeed = 0.001;
        
        // WEBSOCKET CLIENTS
        this.wsClients = new Set();
        
        console.log('🌍 WORLD SYMBOL EVOLUTION MAP');
        console.log('=============================');
        console.log('📍 Tracking writing systems across the globe');
        console.log('🏔️ Topographic elevation data included');
        console.log('➡️ Symbol flow animations');
    }
    
    start() {
        this.startWebServer();
        this.startWebSocket();
        this.startSymbolAnimation();
        
        console.log(`\n🌍 World Symbol Map: http://localhost:${this.port}`);
        console.log(`📡 WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    startSymbolAnimation() {
        // Animate symbol flows
        setInterval(() => {
            this.updateFlows();
            this.broadcast({
                type: 'flow_update',
                flows: this.activeFlows
            });
        }, 50);
        
        // Send random historical events
        setInterval(() => {
            this.broadcastHistoricalEvent();
        }, 5000);
    }
    
    updateFlows() {
        // Add new flows periodically
        if (Math.random() < 0.1 && this.activeFlows.length < 10) {
            const flow = this.symbolFlows[Math.floor(Math.random() * this.symbolFlows.length)];
            this.activeFlows.push({
                ...flow,
                progress: 0,
                id: Date.now()
            });
        }
        
        // Update existing flows
        this.activeFlows = this.activeFlows.map(flow => ({
            ...flow,
            progress: flow.progress + this.flowSpeed
        })).filter(flow => flow.progress <= 1);
    }
    
    broadcastHistoricalEvent() {
        const systems = Object.keys(this.writingSystems);
        const system = this.writingSystems[systems[Math.floor(Math.random() * systems.length)]];
        
        const events = [
            `${system.name} develops ${system.system} in ${Math.abs(system.year)} ${system.year < 0 ? 'BCE' : 'CE'}`,
            `Symbol ${system.symbols[0]} represents new computational concept`,
            `${system.contribution}`,
            `Trade routes spread ${system.system} across continents`
        ];
        
        this.broadcast({
            type: 'historical_event',
            location: system.name,
            event: events[Math.floor(Math.random() * events.length)],
            year: system.year,
            lat: system.lat,
            lon: system.lon
        });
    }
    
    broadcast(data) {
        const message = JSON.stringify(data);
        this.wsClients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
    
    startWebServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            
            if (req.url === '/') {
                this.serveWorldMap(res);
            } else if (req.url === '/data') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    systems: this.writingSystems,
                    flows: this.symbolFlows
                }));
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        server.listen(this.port);
    }
    
    startWebSocket() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws) => {
            console.log('🌍 Client connected to world map');
            this.wsClients.add(ws);
            
            // Send initial data
            ws.send(JSON.stringify({
                type: 'initial_data',
                systems: this.writingSystems,
                flows: this.symbolFlows
            }));
            
            ws.on('close', () => {
                this.wsClients.delete(ws);
            });
        });
    }
    
    serveWorldMap(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🌍 World Symbol Evolution Map</title>
    <style>
        body { margin: 0; overflow: hidden; font-family: Arial, sans-serif; }
        #info {
            position: absolute;
            top: 10px;
            left: 10px;
            color: white;
            background: rgba(0,0,0,0.7);
            padding: 20px;
            border-radius: 10px;
            max-width: 300px;
            z-index: 100;
        }
        #timeline {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            background: rgba(0,0,0,0.7);
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 1.2em;
            z-index: 100;
        }
        #events {
            position: absolute;
            top: 10px;
            right: 10px;
            color: white;
            background: rgba(0,0,0,0.7);
            padding: 20px;
            border-radius: 10px;
            max-width: 300px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 100;
        }
        .event-item {
            margin: 10px 0;
            padding: 10px;
            background: rgba(255,255,255,0.1);
            border-radius: 5px;
            border-left: 3px solid #FFD700;
        }
        #legend {
            position: absolute;
            bottom: 100px;
            left: 10px;
            color: white;
            background: rgba(0,0,0,0.7);
            padding: 15px;
            border-radius: 10px;
            z-index: 100;
        }
        .legend-item {
            margin: 5px 0;
            display: flex;
            align-items: center;
        }
        .legend-color {
            width: 20px;
            height: 20px;
            margin-right: 10px;
            border-radius: 50%;
        }
    </style>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
    <div id="info">
        <h2>🌍 World Symbol Evolution</h2>
        <p>Tracing the evolution of writing systems into modern programming languages</p>
        <p>Rotate: Left Mouse<br>Zoom: Scroll<br>Pan: Right Mouse</p>
    </div>
    
    <div id="timeline">
        <span id="year-display">3200 BCE - 2024 CE</span>
    </div>
    
    <div id="events">
        <h3>📜 Historical Events</h3>
        <div id="event-list"></div>
    </div>
    
    <div id="legend">
        <h4>🗺️ Legend</h4>
        <div class="legend-item">
            <div class="legend-color" style="background: #DAA520;"></div>
            <span>Ancient Writing (-3200 to 0)</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background: #4169E1;"></div>
            <span>Classical Period (0 to 1500)</span>
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background: #00CED1;"></div>
            <span>Modern Computing (1940+)</span>
        </div>
    </div>
    
    <script>
        // Three.js setup
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000814);
        scene.fog = new THREE.Fog(0x000814, 10, 50);
        
        const camera = new THREE.PerspectiveCamera(
            75, window.innerWidth / window.innerHeight, 0.1, 1000
        );
        camera.position.set(0, 15, 25);
        camera.lookAt(0, 0, 0);
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        document.body.appendChild(renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        
        // Create Earth sphere with topography
        const earthGeometry = new THREE.SphereGeometry(10, 64, 64);
        const earthTexture = new THREE.TextureLoader().load('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        
        // Create custom earth material with elevation
        const earthMaterial = new THREE.MeshPhongMaterial({
            color: 0x2a4858,
            emissive: 0x112244,
            shininess: 10,
            bumpScale: 0.05
        });
        
        const earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earth.rotation.y = -Math.PI / 2; // Start with correct orientation
        scene.add(earth);
        
        // Add grid lines for latitude/longitude
        const gridHelper = new THREE.Group();
        
        // Latitude lines
        for (let lat = -80; lat <= 80; lat += 20) {
            const geometry = new THREE.BufferGeometry();
            const points = [];
            for (let lon = 0; lon <= 360; lon += 5) {
                const phi = (90 - lat) * Math.PI / 180;
                const theta = lon * Math.PI / 180;
                const r = 10.1;
                points.push(new THREE.Vector3(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.cos(phi),
                    r * Math.sin(phi) * Math.sin(theta)
                ));
            }
            geometry.setFromPoints(points);
            const line = new THREE.Line(
                geometry,
                new THREE.LineBasicMaterial({ color: 0x335577, opacity: 0.3, transparent: true })
            );
            gridHelper.add(line);
        }
        
        scene.add(gridHelper);
        
        // Store writing system markers
        const markers = new Map();
        const connections = [];
        let writingSystemsData = {};
        
        // Convert lat/lon to 3D coordinates
        function latLonToVector3(lat, lon, radius, elevation = 0) {
            const phi = (90 - lat) * Math.PI / 180;
            const theta = (lon + 180) * Math.PI / 180;
            const r = radius + elevation * 0.001;
            
            return new THREE.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.cos(phi),
                r * Math.sin(phi) * Math.sin(theta)
            );
        }
        
        // Create markers for writing systems
        function createMarkers(systems) {
            Object.entries(systems).forEach(([key, system]) => {
                // Create marker geometry with elevation
                const markerGeometry = new THREE.ConeGeometry(0.3, 0.8, 8);
                const markerMaterial = new THREE.MeshPhongMaterial({
                    color: system.color,
                    emissive: system.color,
                    emissiveIntensity: 0.5
                });
                
                const marker = new THREE.Mesh(markerGeometry, markerMaterial);
                const position = latLonToVector3(system.lat, system.lon, 10, system.elevation);
                marker.position.copy(position);
                
                // Point marker away from center
                marker.lookAt(0, 0, 0);
                marker.rotateX(Math.PI);
                
                scene.add(marker);
                markers.set(key, { marker, system, position });
                
                // Create label
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = 256;
                canvas.height = 128;
                
                context.fillStyle = 'rgba(0, 0, 0, 0.7)';
                context.fillRect(0, 0, 256, 128);
                
                context.fillStyle = system.color;
                context.font = '24px Arial';
                context.fillText(system.name, 10, 30);
                
                context.font = '48px Arial';
                context.fillText(system.symbols[0] || '?', 10, 80);
                
                context.font = '16px Arial';
                context.fillText(system.year + (system.year < 0 ? ' BCE' : ' CE'), 10, 110);
                
                const texture = new THREE.CanvasTexture(canvas);
                const labelMaterial = new THREE.SpriteMaterial({ map: texture });
                const label = new THREE.Sprite(labelMaterial);
                label.position.copy(position);
                label.position.multiplyScalar(1.1);
                label.scale.set(2, 1, 1);
                
                scene.add(label);
            });
        }
        
        // Create flow connections
        function createConnections(flows) {
            flows.forEach(flow => {
                const fromMarker = markers.get(flow.from);
                const toMarker = markers.get(flow.to);
                
                if (fromMarker && toMarker) {
                    const curve = new THREE.QuadraticBezierCurve3(
                        fromMarker.position,
                        new THREE.Vector3(0, 15, 0),
                        toMarker.position
                    );
                    
                    const points = curve.getPoints(50);
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const material = new THREE.LineBasicMaterial({
                        color: 0xFFD700,
                        opacity: flow.strength * 0.5,
                        transparent: true
                    });
                    
                    const line = new THREE.Line(geometry, material);
                    scene.add(line);
                    connections.push({ line, curve, flow });
                }
            });
        }
        
        // Animate flow particles
        const flowParticles = [];
        
        function animateFlows(activeFlows) {
            activeFlows.forEach(flow => {
                const connection = connections.find(c => 
                    c.flow.from === flow.from && c.flow.to === flow.to
                );
                
                if (connection && !flowParticles.find(p => p.id === flow.id)) {
                    const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8);
                    const particleMaterial = new THREE.MeshBasicMaterial({
                        color: 0xFFD700,
                        emissive: 0xFFD700
                    });
                    
                    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                    scene.add(particle);
                    
                    flowParticles.push({
                        id: flow.id,
                        particle,
                        curve: connection.curve,
                        progress: flow.progress
                    });
                }
            });
            
            // Update particle positions
            flowParticles.forEach((fp, index) => {
                const activeFlow = activeFlows.find(f => f.id === fp.id);
                if (activeFlow) {
                    fp.progress = activeFlow.progress;
                    const position = fp.curve.getPoint(fp.progress);
                    fp.particle.position.copy(position);
                } else {
                    // Remove completed particles
                    scene.remove(fp.particle);
                    flowParticles.splice(index, 1);
                }
            });
        }
        
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:9091');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'initial_data':
                    writingSystemsData = data.systems;
                    createMarkers(data.systems);
                    createConnections(data.flows);
                    break;
                    
                case 'flow_update':
                    animateFlows(data.flows);
                    break;
                    
                case 'historical_event':
                    addHistoricalEvent(data);
                    break;
            }
        };
        
        // Add historical events to the panel
        function addHistoricalEvent(event) {
            const eventList = document.getElementById('event-list');
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event-item';
            eventDiv.innerHTML = \`
                <strong>\${event.location}</strong><br>
                \${event.event}<br>
                <small>\${Math.abs(event.year)} \${event.year < 0 ? 'BCE' : 'CE'}</small>
            \`;
            
            eventList.insertBefore(eventDiv, eventList.firstChild);
            
            // Keep only last 10 events
            while (eventList.children.length > 10) {
                eventList.removeChild(eventList.lastChild);
            }
            
            // Flash the location marker
            const marker = Array.from(markers.values()).find(m => 
                Math.abs(m.system.lat - event.lat) < 0.1 && 
                Math.abs(m.system.lon - event.lon) < 0.1
            );
            
            if (marker) {
                const originalEmissive = marker.marker.material.emissiveIntensity;
                marker.marker.material.emissiveIntensity = 1;
                setTimeout(() => {
                    marker.marker.material.emissiveIntensity = originalEmissive;
                }, 1000);
            }
        }
        
        // Controls
        const controls = {
            mouseX: 0,
            mouseY: 0,
            targetRotationX: 0,
            targetRotationY: 0,
            mouseDown: false,
            zoom: 25
        };
        
        document.addEventListener('mousedown', () => controls.mouseDown = true);
        document.addEventListener('mouseup', () => controls.mouseDown = false);
        
        document.addEventListener('mousemove', (event) => {
            if (controls.mouseDown) {
                controls.targetRotationY += (event.clientX - controls.mouseX) * 0.02;
                controls.targetRotationX += (event.clientY - controls.mouseY) * 0.02;
            }
            controls.mouseX = event.clientX;
            controls.mouseY = event.clientY;
        });
        
        document.addEventListener('wheel', (event) => {
            controls.zoom += event.deltaY * 0.01;
            controls.zoom = Math.max(10, Math.min(50, controls.zoom));
        });
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            // Rotate earth
            earth.rotation.y += 0.001;
            gridHelper.rotation.y = earth.rotation.y;
            
            // Update camera
            earth.rotation.x += (controls.targetRotationX - earth.rotation.x) * 0.05;
            earth.rotation.y += (controls.targetRotationY - earth.rotation.y) * 0.05;
            
            camera.position.z += (controls.zoom - camera.position.z) * 0.05;
            
            // Update markers to face camera
            markers.forEach(({ marker }) => {
                marker.lookAt(camera.position);
            });
            
            renderer.render(scene, camera);
        }
        
        animate();
        
        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Load initial data
        fetch('/data')
            .then(response => response.json())
            .then(data => {
                if (!ws.readyState === WebSocket.OPEN) {
                    createMarkers(data.systems);
                    createConnections(data.flows);
                }
            });
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
}

// START THE WORLD MAP
if (require.main === module) {
    console.log('🌍 STARTING WORLD SYMBOL EVOLUTION MAP');
    console.log('======================================');
    console.log('📍 Mapping writing systems across the globe');
    console.log('🏔️ Showing topographic elevation');
    console.log('➡️ Animating symbol flow through history');
    console.log('');
    
    const worldMap = new WorldSymbolEvolutionMap();
    worldMap.start();
}

module.exports = WorldSymbolEvolutionMap;