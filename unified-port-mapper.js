#!/usr/bin/env node

/**
 * 🗺️ UNIFIED PORT MAPPER & WORLD MAP
 * Maps all running services, finds calcompare/multillmrouter/infinity systems
 * Creates a visual world map of all interconnected systems
 */

const axios = require('axios');
const http = require('http');
const { exec } = require('child_process');

class UnifiedPortMapper {
    constructor() {
        this.port = 8888;
        this.discoveredServices = new Map();
        this.serviceConnections = new Map();
        this.worldMap = {
            continents: new Map(),
            routes: [],
            hubs: []
        };
        
        // Known service patterns to look for
        this.knownPatterns = {
            'calcompare': [/cal.*compare/i, /calculator.*compare/i],
            'multillmrouter': [/multi.*llm/i, /llm.*router/i, /multi.*router/i], 
            'infinity-system': [/infinity/i, /∞/],
            'template-processor': [/template/i, /processor/i],
            'ai-api': [/ai.*api/i, /artificial.*intelligence/i],
            'document-generator': [/document.*generator/i, /doc.*gen/i],
            'gaming-engine': [/gaming/i, /game.*engine/i],
            's3-storage': [/minio/i, /s3/i, /storage/i],
            'control-center': [/control.*center/i, /dashboard/i],
            'verification': [/verification/i, /monitor/i],
            'learning-proof': [/learning.*proof/i, /integration.*proof/i]
        };
        
        console.log('🗺️ UNIFIED PORT MAPPER & WORLD MAP');
        console.log('====================================');
        console.log('🔍 Discovering all running services...');
        console.log('🌍 Building world map of system connections...');
        
        this.start();
    }
    
    async start() {
        try {
            // Step 1: Discover all running services
            await this.discoverServices();
            
            // Step 2: Test service connectivity
            await this.testConnectivity();
            
            // Step 3: Build world map
            this.buildWorldMap();
            
            // Step 4: Start unified dashboard
            await this.startDashboard();
            
            console.log('🎉 UNIFIED PORT MAPPER READY!');
            console.log(`🌍 World Map: http://localhost:${this.port}`);
            
        } catch (error) {
            console.error('💥 Failed to start port mapper:', error.message);
        }
    }
    
    async discoverServices() {
        console.log('🔍 Scanning for active services...');
        
        // Get listening ports
        const ports = await this.getListeningPorts();
        console.log(`Found ${ports.length} listening ports:`, ports.join(', '));
        
        // Test each port for HTTP services
        for (const port of ports) {
            await this.probeService(port);
        }
        
        // Look for specific service files
        await this.findServiceFiles();
        
        console.log(`✅ Discovered ${this.discoveredServices.size} services`);
    }
    
    async getListeningPorts() {
        return new Promise((resolve) => {
            exec("lsof -i -P | grep LISTEN | grep -E ':[0-9]+' | awk '{print $9}' | cut -d: -f2 | sort -n | uniq", 
                (error, stdout) => {
                    if (error) {
                        resolve([]);
                        return;
                    }
                    
                    const ports = stdout.trim().split('\n')
                        .map(p => parseInt(p))
                        .filter(p => p && p >= 3000 && p <= 9999); // Focus on app ports
                    
                    resolve(ports);
                });
        });
    }
    
    async probeService(port) {
        const baseUrl = `http://localhost:${port}`;
        
        try {
            // Try common endpoints
            const endpoints = ['/', '/health', '/api/status', '/api/info'];
            let serviceInfo = null;
            
            for (const endpoint of endpoints) {
                try {
                    const response = await axios.get(baseUrl + endpoint, { 
                        timeout: 2000,
                        validateStatus: () => true // Accept any status
                    });
                    
                    if (response.status < 400) {
                        serviceInfo = {
                            port,
                            baseUrl,
                            endpoint,
                            status: response.status,
                            contentType: response.headers['content-type'] || 'unknown',
                            data: this.extractServiceInfo(response.data, response.headers),
                            lastSeen: Date.now()
                        };
                        break;
                    }
                } catch (error) {
                    // Continue trying other endpoints
                }
            }
            
            if (serviceInfo) {
                // Classify the service
                serviceInfo.classification = this.classifyService(serviceInfo);
                this.discoveredServices.set(port, serviceInfo);
                
                console.log(`✅ Port ${port}: ${serviceInfo.classification} (${serviceInfo.endpoint})`);
            }
            
        } catch (error) {
            // Service not HTTP or not responding
        }
    }
    
    extractServiceInfo(data, headers) {
        let info = { type: 'unknown' };
        
        if (typeof data === 'string') {
            // HTML response
            const title = data.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (title) info.title = title[1];
            
            // Look for service identifiers in HTML
            if (data.includes('Template Processor')) info.type = 'template-processor';
            if (data.includes('AI API')) info.type = 'ai-api';
            if (data.includes('Document Generator')) info.type = 'document-generator';
            if (data.includes('Learning')) info.type = 'learning-system';
            if (data.includes('Control Center')) info.type = 'control-center';
            
        } else if (typeof data === 'object') {
            // JSON response
            info = { ...info, ...data };
            if (data.service) info.type = data.service.toLowerCase().replace(/\\s+/g, '-');
        }
        
        return info;
    }
    
    classifyService(serviceInfo) {
        const { port, data } = serviceInfo;
        
        // Check content for known patterns
        const content = JSON.stringify(data).toLowerCase();
        
        for (const [type, patterns] of Object.entries(this.knownPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(content) || pattern.test(serviceInfo.baseUrl)) {
                    return type;
                }
            }
        }
        
        // Port-based classification
        const portClassifications = {
            3000: 'template-processor',
            3001: 'ai-api', 
            4000: 'document-generator',
            5000: 'control-center',
            5002: 'python-service',
            6000: 'verification-system',
            7000: 'control-center',
            7001: 'learning-proof',
            8888: 'gaming-engine',
            9000: 's3-storage',
            9001: 's3-admin'
        };
        
        return portClassifications[port] || `service-${port}`;
    }
    
    async findServiceFiles() {
        console.log('📁 Scanning for service files...');
        
        const serviceFiles = [
            'calcompare.js', 'cal-compare.js', 'calculator-compare.js',
            'multillmrouter.js', 'multi-llm-router.js', 'llm-router.js',
            'infinity-system.js', 'infinity.js', '∞.js',
            'document-generator-app.js',
            'services/real-ai-api.js',
            'services/real-template-processor.js',
            'SYSTEM-VERIFICATION-AND-MONETIZATION.js',
            'crypto-key-vault-layer.js',
            'working-integration-proof.js'
        ];
        
        for (const file of serviceFiles) {
            try {
                const fs = require('fs');
                if (fs.existsSync(file)) {
                    const stats = fs.statSync(file);
                    const content = fs.readFileSync(file, 'utf8').substring(0, 1000);
                    
                    const fileInfo = {
                        file,
                        size: stats.size,
                        modified: stats.mtime,
                        classification: this.classifyServiceFile(file, content),
                        isRunning: this.isFileCurrentlyRunning(file)
                    };
                    
                    this.discoveredServices.set(`file:${file}`, fileInfo);
                    console.log(`📁 Found: ${file} (${fileInfo.classification})`);
                }
            } catch (error) {
                // File doesn't exist or can't read
            }
        }
    }
    
    classifyServiceFile(filename, content) {
        for (const [type, patterns] of Object.entries(this.knownPatterns)) {
            for (const pattern of patterns) {
                if (pattern.test(filename) || pattern.test(content)) {
                    return type;
                }
            }
        }
        return 'unknown-service';
    }
    
    isFileCurrentlyRunning(filename) {
        // Check if this file appears in running processes
        return new Promise((resolve) => {
            exec(`ps aux | grep "${filename}" | grep -v grep`, (error, stdout) => {
                resolve(stdout.trim().length > 0);
            });
        });
    }
    
    async testConnectivity() {
        console.log('🔗 Testing service connectivity...');
        
        const runningServices = Array.from(this.discoveredServices.values())
            .filter(s => s.port && s.baseUrl);
        
        for (const service of runningServices) {
            const connections = [];
            
            // Test if this service connects to others
            for (const otherService of runningServices) {
                if (service.port !== otherService.port) {
                    const isConnected = await this.testConnection(service, otherService);
                    if (isConnected) {
                        connections.push(otherService.port);
                    }
                }
            }
            
            this.serviceConnections.set(service.port, connections);
            
            if (connections.length > 0) {
                console.log(`🔗 Port ${service.port} connects to: ${connections.join(', ')}`);
            }
        }
    }
    
    async testConnection(serviceA, serviceB) {
        try {
            // Try to get service A to make a call to service B
            const testEndpoints = [
                '/api/test-connection',
                '/api/health',
                '/ping'
            ];
            
            for (const endpoint of testEndpoints) {
                try {
                    await axios.get(serviceA.baseUrl + endpoint + `?target=${serviceB.port}`, {
                        timeout: 1000
                    });
                    return true;
                } catch (error) {
                    // Continue trying
                }
            }
            
            return false;
        } catch (error) {
            return false;
        }
    }
    
    buildWorldMap() {
        console.log('🌍 Building world map...');
        
        // Create continents based on service types
        const continents = {
            'AI_CONTINENT': { name: 'AI Services', services: [], color: '#ff4444' },
            'DATA_CONTINENT': { name: 'Data Processing', services: [], color: '#44ff44' },
            'FRONTEND_CONTINENT': { name: 'User Interfaces', services: [], color: '#4444ff' },
            'INFRASTRUCTURE_CONTINENT': { name: 'Infrastructure', services: [], color: '#ff8800' },
            'MYSTERY_CONTINENT': { name: 'Unknown Services', services: [], color: '#ff44ff' }
        };
        
        // Classify services into continents
        for (const [key, service] of this.discoveredServices.entries()) {
            if (!service.port) continue;
            
            if (['ai-api', 'multillmrouter', 'learning-proof'].includes(service.classification)) {
                continents.AI_CONTINENT.services.push(service);
            } else if (['template-processor', 'document-generator', 'calcompare'].includes(service.classification)) {
                continents.DATA_CONTINENT.services.push(service);
            } else if (['control-center', 'verification'].includes(service.classification)) {
                continents.FRONTEND_CONTINENT.services.push(service);
            } else if (['s3-storage', 'gaming-engine', 'infinity-system'].includes(service.classification)) {
                continents.INFRASTRUCTURE_CONTINENT.services.push(service);
            } else {
                continents.MYSTERY_CONTINENT.services.push(service);
            }
        }
        
        this.worldMap.continents = new Map(Object.entries(continents));
        
        // Create routes between connected services
        for (const [port, connections] of this.serviceConnections.entries()) {
            for (const targetPort of connections) {
                this.worldMap.routes.push({
                    from: port,
                    to: targetPort,
                    type: 'api-connection',
                    strength: 1
                });
            }
        }
        
        // Identify major hubs (services with many connections)
        for (const [port, connections] of this.serviceConnections.entries()) {
            if (connections.length >= 2) {
                const service = this.discoveredServices.get(port);
                this.worldMap.hubs.push({
                    port,
                    name: service?.classification || `Hub-${port}`,
                    connections: connections.length,
                    importance: connections.length
                });
            }
        }
        
        console.log('🌍 World map built:');
        console.log(`  Continents: ${this.worldMap.continents.size}`);
        console.log(`  Routes: ${this.worldMap.routes.length}`);
        console.log(`  Hubs: ${this.worldMap.hubs.length}`);
    }
    
    async startDashboard() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.generateWorldMapHTML());
            } else if (req.url === '/api/services') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    services: Object.fromEntries(this.discoveredServices),
                    connections: Object.fromEntries(this.serviceConnections),
                    worldMap: {
                        continents: Object.fromEntries(this.worldMap.continents),
                        routes: this.worldMap.routes,
                        hubs: this.worldMap.hubs
                    }
                }));
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        await new Promise(resolve => {
            server.listen(this.port, resolve);
        });
        
        console.log(`🌍 World Map Dashboard started on port ${this.port}`);
    }
    
    generateWorldMapHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🗺️ Unified Port Mapper & World Map</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: #00ff88; 
            margin: 0; 
            padding: 20px;
        }
        
        .header {
            text-align: center;
            background: rgba(0, 0, 0, 0.8);
            padding: 20px;
            border-radius: 15px;
            border: 2px solid #00ff88;
            margin-bottom: 20px;
        }
        
        .header h1 {
            font-size: 2.5em;
            text-shadow: 0 0 20px #00ff88;
            margin: 0;
        }
        
        .world-map {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .continent {
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid;
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
        }
        
        .continent h3 {
            text-align: center;
            margin-top: 0;
            text-shadow: 0 0 10px currentColor;
        }
        
        .service {
            background: rgba(255, 255, 255, 0.1);
            padding: 10px;
            margin: 8px 0;
            border-radius: 8px;
            border-left: 4px solid;
        }
        
        .service.running { border-left-color: #00ff88; }
        .service.file { border-left-color: #ffaa44; }
        .service.unknown { border-left-color: #ff4444; }
        
        .port-map {
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #00ffff;
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .port-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 10px;
            margin: 15px 0;
        }
        
        .port-item {
            background: rgba(0, 255, 136, 0.1);
            padding: 10px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #00ff88;
        }
        
        .port-item.active {
            background: rgba(0, 255, 136, 0.3);
            border-color: #00ffff;
            box-shadow: 0 0 10px rgba(0, 255, 136, 0.5);
        }
        
        .connections {
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #ff44ff;
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .route {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            margin: 5px 0;
            background: rgba(255, 68, 255, 0.1);
            border-radius: 5px;
        }
        
        .missing-services {
            background: rgba(255, 68, 68, 0.2);
            border: 2px solid #ff4444;
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .missing-item {
            background: rgba(255, 68, 68, 0.1);
            padding: 8px 15px;
            margin: 5px 0;
            border-radius: 5px;
            border-left: 3px solid #ff4444;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        
        .stat {
            background: rgba(0, 255, 136, 0.1);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid #00ff88;
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #00ff88;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🗺️ Unified Port Mapper & World Map</h1>
        <p>Complete mapping of all running services, connections, and missing systems</p>
    </div>
    
    <div class="stats" id="stats">
        <div class="stat">
            <div class="stat-number" id="total-services">0</div>
            <div>Total Services</div>
        </div>
        <div class="stat">
            <div class="stat-number" id="running-services">0</div>
            <div>Running Services</div>
        </div>
        <div class="stat">
            <div class="stat-number" id="connections">0</div>
            <div>Connections</div>
        </div>
        <div class="stat">
            <div class="stat-number" id="missing-count">0</div>
            <div>Missing Systems</div>
        </div>
    </div>
    
    <div class="port-map">
        <h3>📊 Active Port Map</h3>
        <div class="port-grid" id="port-grid">
            <!-- Ports will be populated by JavaScript -->
        </div>
    </div>
    
    <div class="world-map" id="world-map">
        <!-- Continents will be populated by JavaScript -->
    </div>
    
    <div class="connections">
        <h3>🔗 Service Connections</h3>
        <div id="connections-list">
            <!-- Connections will be populated by JavaScript -->
        </div>
    </div>
    
    <div class="missing-services">
        <h3>❌ Missing Expected Services</h3>
        <div id="missing-services">
            <div class="missing-item">calcompare - Calculator comparison system</div>
            <div class="missing-item">multillmrouter - Multi-LLM routing system</div>
            <div class="missing-item">infinity-system - Infinite processing system</div>
            <div class="missing-item">Direct connections between Template Processor ↔ AI API</div>
            <div class="missing-item">Learning feedback loop visualization</div>
        </div>
    </div>
    
    <script>
        let worldData = {};
        
        async function updateWorldMap() {
            try {
                const response = await fetch('/api/services');
                worldData = await response.json();
                
                updateStats();
                updatePortGrid();
                updateContinents();
                updateConnections();
                
            } catch (error) {
                console.error('Failed to update world map:', error);
            }
        }
        
        function updateStats() {
            const services = Object.values(worldData.services || {});
            const runningServices = services.filter(s => s.port && s.baseUrl);
            
            document.getElementById('total-services').textContent = services.length;
            document.getElementById('running-services').textContent = runningServices.length;
            document.getElementById('connections').textContent = worldData.worldMap?.routes?.length || 0;
            document.getElementById('missing-count').textContent = 5; // Known missing systems
        }
        
        function updatePortGrid() {
            const grid = document.getElementById('port-grid');
            const services = Object.values(worldData.services || {});
            const runningServices = services.filter(s => s.port);
            
            grid.innerHTML = runningServices.map(service => \`
                <div class="port-item active">
                    <div><strong>Port \${service.port}</strong></div>
                    <div style="font-size: 11px;">\${service.classification}</div>
                    <div style="font-size: 10px; color: #888;">\${service.data?.title || 'Active'}</div>
                </div>
            \`).join('');
        }
        
        function updateContinents() {
            const worldMapDiv = document.getElementById('world-map');
            const continents = worldData.worldMap?.continents || {};
            
            worldMapDiv.innerHTML = Object.entries(continents).map(([name, continent]) => \`
                <div class="continent" style="border-color: \${continent.color};">
                    <h3 style="color: \${continent.color};">\${continent.name}</h3>
                    \${continent.services.map(service => \`
                        <div class="service \${service.port ? 'running' : 'file'}">
                            <div><strong>\${service.port ? 'Port ' + service.port : service.file}</strong></div>
                            <div style="font-size: 11px;">\${service.classification}</div>
                            \${service.data?.title ? \`<div style="font-size: 10px; color: #888;">\${service.data.title}</div>\` : ''}
                        </div>
                    \`).join('')}
                </div>
            \`).join('');
        }
        
        function updateConnections() {
            const connectionsDiv = document.getElementById('connections-list');
            const routes = worldData.worldMap?.routes || [];
            
            if (routes.length === 0) {
                connectionsDiv.innerHTML = '<div style="text-align: center; color: #888;">No direct connections detected. Services may be operating independently.</div>';
                return;
            }
            
            connectionsDiv.innerHTML = routes.map(route => \`
                <div class="route">
                    <span>Port \${route.from}</span>
                    <span style="color: #ff44ff;">→</span>
                    <span>Port \${route.to}</span>
                </div>
            \`).join('');
        }
        
        // Update every 10 seconds
        setInterval(updateWorldMap, 10000);
        
        // Initial update
        updateWorldMap();
        
        console.log('🗺️ Unified Port Mapper & World Map loaded');
        console.log('🔍 Discovering services and building world map...');
    </script>
</body>
</html>`;
    }
}

// Start the unified port mapper
if (require.main === module) {
    new UnifiedPortMapper();
}

module.exports = UnifiedPortMapper;