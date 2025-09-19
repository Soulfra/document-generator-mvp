#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const { XMLParser, XMLBuilder } = require('fast-xml-parser');
const EventEmitter = require('events');

class MasterXMLDroneMapper extends EventEmitter {
    constructor() {
        super();
        
        this.mapperState = {
            mapper_id: `xml-drone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            session_start: new Date(),
            
            // Platform discovery
            platform: {
                base_path: '/Users/matthewmauer/Desktop/Document-Generator',
                discovered_layers: new Map(),
                layer_hierarchy: [],
                total_layers: 0,
                mapped_layers: 0
            },
            
            // XML mapping engine
            xml_engine: {
                parser: new XMLParser({
                    ignoreAttributes: false,
                    attributeNamePrefix: '@_',
                    textNodeName: '#text'
                }),
                builder: new XMLBuilder({
                    ignoreAttributes: false,
                    attributeNamePrefix: '@_',
                    textNodeName: '#text',
                    format: true
                }),
                mappings: new Map(),
                transformations: new Map()
            },
            
            // Drone system
            drones: {
                active_drones: new Map(),
                drone_tasks: [],
                mapping_strategies: {
                    'inside_out': this.mapInsideOut.bind(this),
                    'outside_in': this.mapOutsideIn.bind(this),
                    'middle_out': this.mapMiddleOut.bind(this),
                    'bidirectional': this.mapBidirectional.bind(this),
                    'recursive': this.mapRecursive.bind(this)
                },
                auto_discovery: true,
                continuous_mapping: true
            },
            
            // Menu system
            menu_system: {
                active_menu: 'main',
                menu_stack: [],
                keybindings: new Map(),
                shortcuts: new Map(),
                command_history: []
            },
            
            // Real-time monitoring
            monitoring: {
                active_connections: new Set(),
                xml_feed: [],
                live_transformations: new Map(),
                performance_metrics: {
                    mappings_per_second: 0,
                    xml_transformations_per_minute: 0,
                    drone_efficiency: 0
                }
            }
        };
        
        this.ports = {
            http: 9500,
            ws: 9501,
            xml_api: 9502
        };
        
        // Initialize keybindings
        this.initializeKeybindings();
    }
    
    async initialize() {
        console.log('🚁 Initializing Master XML Drone Mapper...');
        console.log(`🔍 Mapper ID: ${this.mapperState.mapper_id}`);
        
        // Discover platform layers
        await this.discoverPlatformLayers();
        
        // Initialize XML engine
        await this.initializeXMLEngine();
        
        // Deploy mapping drones
        await this.deployMappingDrones();
        
        // Start web interface with menus
        await this.startWebInterface();
        
        // Start XML API server
        await this.startXMLAPIServer();
        
        // Start continuous mapping
        this.startContinuousMapping();
        
        console.log('\n✅ MASTER XML DRONE MAPPER READY!');
        console.log(`🌐 Control Interface: http://localhost:${this.ports.http}`);
        console.log(`📡 XML Feed: ws://localhost:${this.ports.ws}`);
        console.log(`🔌 XML API: http://localhost:${this.ports.xml_api}`);
        console.log(`🚁 Drones Active: ${this.mapperState.drones.active_drones.size}`);
        console.log(`📊 Layers Discovered: ${this.mapperState.platform.total_layers}`);
        console.log('\n🎮 KEYBINDINGS ACTIVE - Press keys to control the mapper!');
    }
    
    async discoverPlatformLayers() {
        console.log('🔍 Discovering platform layers...');
        
        const layerFiles = [
            'creative-commons-licensing-handshake.js',
            'bloomberg-licensing-terminal.js', 
            'licensing-tycoon-empire.js',
            'veil-piercing-meta-empire.js',
            'personal-apple-licensing-wrapper.js',
            'personal-apple-licensing-wrapper-secured.js',
            'barrows-security-scanner.js',
            'barrows-boss-layer-scanner-fixed.js',
            'spectator-arena-trap-theater.js',
            'xml-arena-mapping-system.js',
            'domain-master-dungeon-crawler.js',
            'live-reasoning-observer.js'
        ];
        
        for (const file of layerFiles) {
            try {
                const filePath = path.join(this.mapperState.platform.base_path, file);
                const stats = await fs.stat(filePath);
                const content = await fs.readFile(filePath, 'utf8');
                
                const layer = {
                    id: `layer-${this.mapperState.platform.discovered_layers.size + 1}`,
                    filename: file,
                    filepath: filePath,
                    size: stats.size,
                    modified: stats.mtime,
                    content: content,
                    analysis: await this.analyzeLayerContent(content),
                    xml_mappings: new Map(),
                    drone_assignments: []
                };
                
                this.mapperState.platform.discovered_layers.set(file, layer);
                console.log(`✅ Discovered layer: ${file} (${Math.floor(stats.size/1024)}KB)`);
                
            } catch (error) {
                console.log(`⚠️ Could not discover ${file}: ${error.message}`);
            }
        }
        
        this.mapperState.platform.total_layers = this.mapperState.platform.discovered_layers.size;
        console.log(`🎯 Total layers discovered: ${this.mapperState.platform.total_layers}`);
        
        // Build hierarchy
        this.buildLayerHierarchy();
    }
    
    async analyzeLayerContent(content) {
        const analysis = {
            functions: [],
            classes: [],
            variables: [],
            connections: [],
            complexity_score: 0,
            xml_mappable_elements: []
        };
        
        // Extract functions
        const functionMatches = content.match(/(?:function\s+|const\s+\w+\s*=\s*(?:async\s+)?function|\w+\s*:\s*(?:async\s+)?function)/g);
        if (functionMatches) {
            analysis.functions = functionMatches.map((match, i) => ({
                id: `func-${i}`,
                signature: match,
                xml_path: `/functions/function[@id='func-${i}']`
            }));
        }
        
        // Extract classes
        const classMatches = content.match(/class\s+\w+/g);
        if (classMatches) {
            analysis.classes = classMatches.map((match, i) => ({
                id: `class-${i}`,
                name: match.replace('class ', ''),
                xml_path: `/classes/class[@id='class-${i}']`
            }));
        }
        
        // Extract connections (ports, URLs, dependencies)
        const connectionMatches = content.match(/(?:localhost:\d+|:\d+|http:\/\/|ws:\/\/|require\(['"][\w-]+['"]\))/g);
        if (connectionMatches) {
            analysis.connections = connectionMatches.map((match, i) => ({
                id: `conn-${i}`,
                endpoint: match,
                xml_path: `/connections/connection[@id='conn-${i}']`
            }));
        }
        
        // Calculate complexity
        analysis.complexity_score = Math.min(
            Math.floor((content.length / 1000) + analysis.functions.length * 2 + analysis.classes.length * 3),
            100
        );
        
        // Identify XML mappable elements
        analysis.xml_mappable_elements = [
            ...analysis.functions.map(f => ({ type: 'function', ...f })),
            ...analysis.classes.map(c => ({ type: 'class', ...c })),
            ...analysis.connections.map(c => ({ type: 'connection', ...c }))
        ];
        
        return analysis;
    }
    
    buildLayerHierarchy() {
        // Build dependency hierarchy based on creation order and complexity
        const layers = Array.from(this.mapperState.platform.discovered_layers.values());
        
        // Sort by complexity and dependencies
        this.mapperState.platform.layer_hierarchy = layers.sort((a, b) => {
            // Creative Commons should be first (base layer)
            if (a.filename.includes('creative-commons')) return -1;
            if (b.filename.includes('creative-commons')) return 1;
            
            // Meta empire layers go towards the end
            if (a.filename.includes('meta-empire')) return 1;
            if (b.filename.includes('meta-empire')) return -1;
            
            // Sort by complexity otherwise
            return a.analysis.complexity_score - b.analysis.complexity_score;
        });
        
        console.log('🏗️ Layer hierarchy built:');
        this.mapperState.platform.layer_hierarchy.forEach((layer, i) => {
            console.log(`  ${i + 1}. ${layer.filename} (complexity: ${layer.analysis.complexity_score})`);
        });
    }
    
    async initializeXMLEngine() {
        console.log('🔧 Initializing XML engine...');
        
        // Create base XML schemas for each layer type
        const schemas = {
            base_layer: {
                'layer': {
                    '@_id': '',
                    '@_type': '',
                    '@_complexity': '',
                    'metadata': {
                        'filename': '',
                        'size': '',
                        'modified': ''
                    },
                    'analysis': {
                        'functions': { 'function': [] },
                        'classes': { 'class': [] },
                        'connections': { 'connection': [] }
                    },
                    'mappings': { 'mapping': [] }
                }
            },
            
            system_overview: {
                'platform': {
                    '@_id': this.mapperState.mapper_id,
                    '@_total_layers': this.mapperState.platform.total_layers,
                    'layers': { 'layer': [] },
                    'hierarchy': { 'level': [] },
                    'drones': { 'drone': [] }
                }
            }
        };
        
        // Store schemas
        for (const [name, schema] of Object.entries(schemas)) {
            this.mapperState.xml_engine.mappings.set(name, schema);
        }
        
        console.log(`✅ XML schemas initialized: ${Object.keys(schemas).join(', ')}`);
    }
    
    async deployMappingDrones() {
        console.log('🚁 Deploying mapping drones...');
        
        const droneTypes = [
            {
                id: 'inside-out-drone',
                strategy: 'inside_out',
                target: 'layer_internals',
                description: 'Maps internal structure outward'
            },
            {
                id: 'outside-in-drone', 
                strategy: 'outside_in',
                target: 'layer_interfaces',
                description: 'Maps external interfaces inward'
            },
            {
                id: 'middle-out-drone',
                strategy: 'middle_out', 
                target: 'core_systems',
                description: 'Maps from core systems bidirectionally'
            },
            {
                id: 'hierarchy-drone',
                strategy: 'recursive',
                target: 'layer_hierarchy',
                description: 'Maps layer dependencies recursively'
            },
            {
                id: 'connection-drone',
                strategy: 'bidirectional',
                target: 'inter_layer_connections',
                description: 'Maps connections between layers'
            }
        ];
        
        for (const droneConfig of droneTypes) {
            const drone = {
                ...droneConfig,
                status: 'active',
                deployed_at: new Date(),
                tasks_completed: 0,
                current_target: null,
                xml_output: [],
                performance: {
                    mappings_per_minute: 0,
                    success_rate: 0,
                    efficiency_score: 0
                }
            };
            
            this.mapperState.drones.active_drones.set(droneConfig.id, drone);
            console.log(`🚁 Deployed ${droneConfig.id}: ${droneConfig.description}`);
            
            // Start drone
            this.startDrone(drone);
        }
        
        console.log(`✅ ${droneTypes.length} mapping drones deployed and active`);
    }
    
    startDrone(drone) {
        // Each drone runs its mapping strategy on a timer
        const interval = setInterval(async () => {
            if (drone.status !== 'active') {
                clearInterval(interval);
                return;
            }
            
            try {
                // Get mapping strategy
                const strategy = this.mapperState.drones.mapping_strategies[drone.strategy];
                
                // Select target based on drone type
                const target = this.selectDroneTarget(drone);
                if (!target) return;
                
                drone.current_target = target;
                
                // Execute mapping
                const xmlResult = await strategy(target, drone);
                
                if (xmlResult) {
                    drone.xml_output.push({
                        timestamp: new Date(),
                        target: target.filename || target.id,
                        xml: xmlResult
                    });
                    
                    drone.tasks_completed++;
                    
                    // Broadcast XML update
                    this.broadcastXMLUpdate({
                        drone_id: drone.id,
                        target: target,
                        xml: xmlResult,
                        timestamp: new Date()
                    });
                }
                
                // Update performance metrics
                this.updateDronePerformance(drone);
                
            } catch (error) {
                console.error(`❌ Drone ${drone.id} error:`, error.message);
                drone.status = 'error';
            }
            
        }, 5000 + Math.random() * 3000); // Stagger drones
    }
    
    selectDroneTarget(drone) {
        const layers = Array.from(this.mapperState.platform.discovered_layers.values());
        
        switch (drone.target) {
            case 'layer_internals':
                return layers.find(l => l.analysis.xml_mappable_elements.length > 0);
                
            case 'layer_interfaces':
                return layers.find(l => l.analysis.connections.length > 0);
                
            case 'core_systems':
                return layers.find(l => l.filename.includes('licensing') || l.filename.includes('terminal'));
                
            case 'layer_hierarchy':
                return { 
                    id: 'hierarchy', 
                    type: 'hierarchy',
                    layers: this.mapperState.platform.layer_hierarchy 
                };
                
            case 'inter_layer_connections':
                return {
                    id: 'connections',
                    type: 'connections',
                    connections: this.findInterLayerConnections()
                };
                
            default:
                return layers[Math.floor(Math.random() * layers.length)];
        }
    }
    
    async mapInsideOut(target, drone) {
        // Maps from internal components outward to interfaces
        if (!target.analysis) return null;
        
        const internalMapping = {
            'inside_out_mapping': {
                '@_drone': drone.id,
                '@_target': target.filename || target.id,
                '@_timestamp': new Date().toISOString(),
                'internal_structure': {
                    'functions': {
                        'function': target.analysis.functions.map(f => ({
                            '@_id': f.id,
                            'signature': f.signature,
                            'xml_path': f.xml_path
                        }))
                    },
                    'classes': {
                        'class': target.analysis.classes.map(c => ({
                            '@_id': c.id,
                            'name': c.name,
                            'xml_path': c.xml_path
                        }))
                    }
                },
                'external_interfaces': {
                    'connection': target.analysis.connections.map(c => ({
                        '@_id': c.id,
                        'endpoint': c.endpoint,
                        'xml_path': c.xml_path
                    }))
                }
            }
        };
        
        return this.mapperState.xml_engine.builder.build(internalMapping);
    }
    
    async mapOutsideIn(target, drone) {
        // Maps from external interfaces inward to implementation
        if (!target.analysis) return null;
        
        const externalMapping = {
            'outside_in_mapping': {
                '@_drone': drone.id,
                '@_target': target.filename || target.id,
                '@_timestamp': new Date().toISOString(),
                'external_surface': {
                    'ports': this.extractPorts(target),
                    'endpoints': this.extractEndpoints(target),
                    'dependencies': this.extractDependencies(target)
                },
                'internal_implementation': {
                    'handlers': this.extractHandlers(target),
                    'business_logic': this.extractBusinessLogic(target)
                }
            }
        };
        
        return this.mapperState.xml_engine.builder.build(externalMapping);
    }
    
    async mapMiddleOut(target, drone) {
        // Maps from core systems bidirectionally
        const coreMapping = {
            'middle_out_mapping': {
                '@_drone': drone.id,
                '@_target': target.filename || target.id,
                '@_timestamp': new Date().toISOString(),
                'core_system': {
                    'central_components': this.identifyCoreComponents(target),
                    'data_flow': {
                        'inbound': this.mapInboundConnections(target),
                        'outbound': this.mapOutboundConnections(target)
                    }
                },
                'expansion_layers': {
                    'inner_layer': this.mapInnerLayer(target),
                    'outer_layer': this.mapOuterLayer(target)
                }
            }
        };
        
        return this.mapperState.xml_engine.builder.build(coreMapping);
    }
    
    async mapBidirectional(target, drone) {
        // Maps connections in both directions
        const bidirectionalMapping = {
            'bidirectional_mapping': {
                '@_drone': drone.id,
                '@_target': target.id,
                '@_timestamp': new Date().toISOString(),
                'connections': {
                    'connection': target.connections ? target.connections.map(conn => ({
                        '@_id': conn.id,
                        'source': conn.source,
                        'target': conn.target,
                        'bidirectional': conn.bidirectional || false,
                        'data_flow': {
                            'forward': conn.forward_data || 'unknown',
                            'reverse': conn.reverse_data || 'unknown'
                        }
                    })) : []
                }
            }
        };
        
        return this.mapperState.xml_engine.builder.build(bidirectionalMapping);
    }
    
    async mapRecursive(target, drone) {
        // Maps hierarchical structures recursively
        const recursiveMapping = {
            'recursive_mapping': {
                '@_drone': drone.id,
                '@_target': target.id,
                '@_timestamp': new Date().toISOString(),
                'hierarchy': {
                    'level': target.layers ? target.layers.map((layer, index) => ({
                        '@_depth': index,
                        '@_id': layer.id,
                        'layer_info': {
                            'filename': layer.filename,
                            'complexity': layer.analysis.complexity_score,
                            'dependencies': layer.analysis.connections.length
                        },
                        'child_layers': {
                            // Recursive structure - layers that depend on this one
                            'layer': this.findChildLayers(layer).map(child => ({
                                '@_id': child.id,
                                'filename': child.filename
                            }))
                        }
                    })) : []
                }
            }
        };
        
        return this.mapperState.xml_engine.builder.build(recursiveMapping);
    }
    
    // Helper methods for mapping strategies
    extractPorts(target) {
        const ports = [];
        const portMatches = target.content?.match(/:\d+/g) || [];
        portMatches.forEach((match, i) => {
            ports.push({
                '@_id': `port-${i}`,
                'number': match.replace(':', ''),
                'context': 'extracted_from_code'
            });
        });
        return { 'port': ports };
    }
    
    extractEndpoints(target) {
        const endpoints = [];
        const urlMatches = target.content?.match(/https?:\/\/[^\s'"]+/g) || [];
        urlMatches.forEach((match, i) => {
            endpoints.push({
                '@_id': `endpoint-${i}`,
                'url': match,
                'type': 'external'
            });
        });
        return { 'endpoint': endpoints };
    }
    
    extractDependencies(target) {
        const deps = [];
        const requireMatches = target.content?.match(/require\(['"`]([^'"`]+)['"`]\)/g) || [];
        requireMatches.forEach((match, i) => {
            const dep = match.match(/require\(['"`]([^'"`]+)['"`]\)/)[1];
            deps.push({
                '@_id': `dep-${i}`,
                'module': dep,
                'type': dep.startsWith('.') ? 'local' : 'external'
            });
        });
        return { 'dependency': deps };
    }
    
    extractHandlers(target) {
        const handlers = [];
        const handlerMatches = target.content?.match(/\.on\(['"`]([^'"`]+)['"`]/g) || [];
        handlerMatches.forEach((match, i) => {
            const event = match.match(/\.on\(['"`]([^'"`]+)['"`]/)[1];
            handlers.push({
                '@_id': `handler-${i}`,
                'event': event,
                'type': 'event_handler'
            });
        });
        return { 'handler': handlers };
    }
    
    extractBusinessLogic(target) {
        return {
            'complexity_score': target.analysis?.complexity_score || 0,
            'function_count': target.analysis?.functions?.length || 0,
            'class_count': target.analysis?.classes?.length || 0
        };
    }
    
    identifyCoreComponents(target) {
        const core = [];
        if (target.analysis?.classes) {
            target.analysis.classes.forEach(cls => {
                core.push({
                    '@_type': 'class',
                    'name': cls.name,
                    'role': 'core_component'
                });
            });
        }
        return { 'component': core };
    }
    
    mapInboundConnections(target) {
        return { 'connection': [] }; // Simplified for now
    }
    
    mapOutboundConnections(target) {
        return { 'connection': [] }; // Simplified for now
    }
    
    mapInnerLayer(target) {
        return { 'component': [] }; // Simplified
    }
    
    mapOuterLayer(target) {
        return { 'component': [] }; // Simplified  
    }
    
    findChildLayers(layer) {
        // Find layers that depend on this layer
        return Array.from(this.mapperState.platform.discovered_layers.values()).filter(l => 
            l !== layer && l.analysis.connections.some(conn => 
                conn.endpoint.includes('localhost')
            )
        );
    }
    
    findInterLayerConnections() {
        const connections = [];
        const layers = Array.from(this.mapperState.platform.discovered_layers.values());
        
        layers.forEach(layer => {
            layer.analysis.connections.forEach(conn => {
                if (conn.endpoint.includes('localhost')) {
                    connections.push({
                        id: `inter-${connections.length}`,
                        source: layer.filename,
                        target: conn.endpoint,
                        type: 'network_connection'
                    });
                }
            });
        });
        
        return connections;
    }
    
    updateDronePerformance(drone) {
        const now = Date.now();
        const deployTime = drone.deployed_at.getTime();
        const minutesActive = (now - deployTime) / 60000;
        
        drone.performance.mappings_per_minute = drone.tasks_completed / Math.max(minutesActive, 1);
        drone.performance.success_rate = drone.tasks_completed / Math.max(drone.tasks_completed + 1, 1) * 100;
        drone.performance.efficiency_score = Math.min(drone.performance.mappings_per_minute * 10, 100);
    }
    
    initializeKeybindings() {
        const keybindings = new Map([
            // Menu navigation
            ['1', { action: 'main_menu', description: 'Main Menu' }],
            ['2', { action: 'layer_menu', description: 'Layer Management' }],
            ['3', { action: 'drone_menu', description: 'Drone Control' }],
            ['4', { action: 'xml_menu', description: 'XML Viewer' }],
            ['5', { action: 'monitoring_menu', description: 'Live Monitoring' }],
            
            // Drone controls
            ['d', { action: 'deploy_drone', description: 'Deploy New Drone' }],
            ['s', { action: 'stop_drone', description: 'Stop Active Drone' }],
            ['r', { action: 'restart_drones', description: 'Restart All Drones' }],
            
            // XML operations
            ['x', { action: 'export_xml', description: 'Export All XML' }],
            ['t', { action: 'transform_xml', description: 'Transform XML' }],
            ['v', { action: 'validate_xml', description: 'Validate XML' }],
            
            // Mapping controls
            ['m', { action: 'manual_map', description: 'Manual Mapping' }],
            ['a', { action: 'auto_map', description: 'Auto Map All' }],
            ['c', { action: 'clear_mappings', description: 'Clear Mappings' }],
            
            // Navigation
            ['h', { action: 'help', description: 'Show Help' }],
            ['q', { action: 'quit', description: 'Quit Mapper' }],
            ['p', { action: 'pause', description: 'Pause/Resume' }]
        ]);
        
        this.mapperState.menu_system.keybindings = keybindings;
        
        // Initialize command shortcuts
        const shortcuts = new Map([
            ['Ctrl+M', 'manual_map'],
            ['Ctrl+A', 'auto_map'],
            ['Ctrl+D', 'deploy_drone'],
            ['Ctrl+X', 'export_xml'],
            ['Ctrl+Q', 'quit']
        ]);
        
        this.mapperState.menu_system.shortcuts = shortcuts;
    }
    
    async startWebInterface() {
        // Create comprehensive web interface with menus and keybindings
        this.httpServer = http.createServer((req, res) => {
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.generateMasterHTML());
            } else if (req.url === '/api/state') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(this.getFullState()));
            } else if (req.url === '/api/xml/export') {
                res.writeHead(200, { 'Content-Type': 'application/xml' });
                res.end(this.exportAllXML());
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        // WebSocket for real-time updates
        this.wss = new WebSocket.Server({ 
            server: this.httpServer,
            path: '/ws'
        });
        
        this.wss.on('connection', (ws) => {
            console.log('🌐 Control interface connected');
            this.mapperState.monitoring.active_connections.add(ws);
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'initial_state',
                state: this.getFullState()
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message.toString());
                    this.handleWebCommand(data, ws);
                } catch (error) {
                    console.error('Web command error:', error);
                }
            });
            
            ws.on('close', () => {
                this.mapperState.monitoring.active_connections.delete(ws);
            });
        });
        
        await new Promise((resolve) => {
            this.httpServer.listen(this.ports.http, () => {
                console.log(`🌐 Master control interface listening on http://localhost:${this.ports.http}`);
                resolve();
            });
        });
    }
    
    async startXMLAPIServer() {
        // Dedicated XML API server
        this.xmlServer = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/xml');
            
            if (req.url === '/platform') {
                res.end(this.generatePlatformXML());
            } else if (req.url === '/layers') {
                res.end(this.generateLayersXML());
            } else if (req.url === '/drones') {
                res.end(this.generateDronesXML());
            } else if (req.url.startsWith('/layer/')) {
                const layerName = req.url.split('/')[2];
                res.end(this.generateLayerXML(layerName));
            } else {
                res.writeHead(404);
                res.end('<error>Endpoint not found</error>');
            }
        });
        
        await new Promise((resolve) => {
            this.xmlServer.listen(this.ports.xml_api, () => {
                console.log(`🔌 XML API server listening on http://localhost:${this.ports.xml_api}`);
                resolve();
            });
        });
    }
    
    broadcastXMLUpdate(update) {
        const message = JSON.stringify({
            type: 'xml_update',
            update: update
        });
        
        this.mapperState.monitoring.active_connections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
        
        // Add to XML feed
        this.mapperState.monitoring.xml_feed.unshift(update);
        if (this.mapperState.monitoring.xml_feed.length > 1000) {
            this.mapperState.monitoring.xml_feed = this.mapperState.monitoring.xml_feed.slice(0, 1000);
        }
    }
    
    startContinuousMapping() {
        console.log('🔄 Starting continuous mapping process...');
        
        // Performance monitoring
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 10000);
        
        // Auto-discovery
        setInterval(async () => {
            if (this.mapperState.drones.auto_discovery) {
                await this.discoverPlatformLayers();
            }
        }, 30000);
        
        console.log('✅ Continuous mapping active');
    }
    
    updatePerformanceMetrics() {
        const metrics = this.mapperState.monitoring.performance_metrics;
        const drones = Array.from(this.mapperState.drones.active_drones.values());
        
        // Calculate aggregate metrics
        metrics.mappings_per_second = drones.reduce((sum, drone) => 
            sum + (drone.performance.mappings_per_minute / 60), 0
        );
        
        metrics.xml_transformations_per_minute = this.mapperState.monitoring.xml_feed.length / 10;
        
        metrics.drone_efficiency = drones.reduce((sum, drone) => 
            sum + drone.performance.efficiency_score, 0
        ) / Math.max(drones.length, 1);
    }
    
    getFullState() {
        return {
            mapper_id: this.mapperState.mapper_id,
            session_start: this.mapperState.session_start,
            
            platform: {
                total_layers: this.mapperState.platform.total_layers,
                mapped_layers: this.mapperState.platform.mapped_layers,
                hierarchy_depth: this.mapperState.platform.layer_hierarchy.length
            },
            
            drones: {
                active_count: this.mapperState.drones.active_drones.size,
                total_tasks: Array.from(this.mapperState.drones.active_drones.values())
                    .reduce((sum, drone) => sum + drone.tasks_completed, 0)
            },
            
            xml_engine: {
                mappings_count: this.mapperState.xml_engine.mappings.size,
                transformations_count: this.mapperState.xml_engine.transformations.size
            },
            
            monitoring: {
                active_connections: this.mapperState.monitoring.active_connections.size,
                xml_feed_size: this.mapperState.monitoring.xml_feed.length,
                performance: this.mapperState.monitoring.performance_metrics
            },
            
            menu_system: {
                active_menu: this.mapperState.menu_system.active_menu,
                keybindings_count: this.mapperState.menu_system.keybindings.size
            }
        };
    }
    
    generateMasterHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Master XML Drone Mapper</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0a0a2e, #16213e, #0f3460);
            color: #00ff00;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
            min-height: 100vh;
        }
        
        .master-container {
            max-width: 1600px;
            margin: 0 auto;
            padding: 20px;
        }
        
        h1 {
            text-align: center;
            color: #00ff00;
            text-shadow: 0 0 20px #00ff00;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .status-bar {
            background: rgba(0, 255, 0, 0.1);
            border: 2px solid #00ff00;
            padding: 10px;
            margin: 20px 0;
            border-radius: 10px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        
        .status-item {
            text-align: center;
            padding: 10px;
            background: rgba(0, 255, 0, 0.05);
            border-radius: 5px;
        }
        
        .status-value {
            font-size: 2em;
            color: #00ff00;
            text-shadow: 0 0 10px #00ff00;
        }
        
        .menu-grid {
            display: grid;
            grid-template-columns: 300px 1fr 300px;
            gap: 20px;
            margin: 20px 0;
        }
        
        .left-panel, .right-panel {
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
        }
        
        .center-panel {
            background: rgba(0, 0, 0, 0.8);
            border: 3px solid #00ff00;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 0 50px rgba(0, 255, 0, 0.5);
        }
        
        .menu-section {
            margin: 20px 0;
        }
        
        .menu-section h3 {
            color: #00ff00;
            text-shadow: 0 0 10px #00ff00;
            border-bottom: 1px solid #00ff00;
            padding-bottom: 5px;
        }
        
        .menu-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(0, 255, 0, 0.2);
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .menu-item:hover {
            background: rgba(0, 255, 0, 0.1);
            padding-left: 10px;
        }
        
        .keybinding {
            background: rgba(0, 255, 0, 0.2);
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.8em;
        }
        
        .drone-list {
            max-height: 300px;
            overflow-y: auto;
        }
        
        .drone-item {
            background: rgba(0, 100, 0, 0.2);
            margin: 5px 0;
            padding: 10px;
            border-radius: 5px;
            border-left: 4px solid #00ff00;
        }
        
        .drone-status {
            font-size: 0.8em;
            opacity: 0.8;
        }
        
        .xml-feed {
            height: 400px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.5);
            padding: 15px;
            border-radius: 5px;
            font-size: 0.8em;
        }
        
        .xml-item {
            margin: 5px 0;
            padding: 8px;
            background: rgba(0, 255, 0, 0.05);
            border-left: 3px solid #00ff00;
            border-radius: 3px;
        }
        
        .layer-hierarchy {
            max-height: 500px;
            overflow-y: auto;
        }
        
        .layer-item {
            background: rgba(0, 50, 0, 0.3);
            margin: 3px 0;
            padding: 8px;
            border-radius: 5px;
            border-left: 3px solid #00ff00;
            font-size: 0.9em;
        }
        
        .layer-complexity {
            float: right;
            background: rgba(255, 255, 0, 0.2);
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 0.7em;
            color: #ffff00;
        }
        
        .control-buttons {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin: 20px 0;
        }
        
        .control-btn {
            background: rgba(0, 255, 0, 0.2);
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: 10px;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
        }
        
        .control-btn:hover {
            background: rgba(0, 255, 0, 0.4);
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
        }
        
        .performance-chart {
            height: 200px;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 5px;
            padding: 10px;
            position: relative;
            overflow: hidden;
        }
        
        .chart-bar {
            position: absolute;
            bottom: 0;
            background: linear-gradient(to top, #00ff00, #00ff0080);
            border-radius: 2px 2px 0 0;
            animation: grow 1s ease-out;
        }
        
        @keyframes grow {
            from { height: 0; }
            to { height: var(--height); }
        }
        
        .floating-help {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 15px;
            max-width: 300px;
            font-size: 0.8em;
            z-index: 1000;
        }
        
        .xml-preview {
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #00ff00;
            border-radius: 5px;
            padding: 10px;
            font-family: monospace;
            font-size: 0.7em;
            white-space: pre-wrap;
            max-height: 200px;
            overflow-y: auto;
        }
        
        @media (max-width: 1200px) {
            .menu-grid {
                grid-template-columns: 1fr;
                gap: 10px;
            }
            
            .left-panel, .right-panel {
                order: 2;
            }
            
            .center-panel {
                order: 1;
            }
        }
    </style>
</head>
<body>
    <div class="master-container">
        <h1>🚁 MASTER XML DRONE MAPPER 🚁</h1>
        <div class="subtitle" style="text-align: center; margin-bottom: 30px; color: #00ff00; opacity: 0.8;">
            Comprehensive Platform Mapping • Inside-Out • Middle-Out • Droned • Menu Controlled
        </div>
        
        <div class="status-bar">
            <div class="status-item">
                <div>Platform Layers</div>
                <div class="status-value" id="total-layers">0</div>
            </div>
            <div class="status-item">
                <div>Active Drones</div>
                <div class="status-value" id="active-drones">0</div>
            </div>
            <div class="status-item">
                <div>XML Mappings</div>
                <div class="status-value" id="xml-mappings">0</div>
            </div>
            <div class="status-item">
                <div>Performance</div>
                <div class="status-value" id="performance">0%</div>
            </div>
        </div>
        
        <div class="menu-grid">
            <div class="left-panel">
                <div class="menu-section">
                    <h3>🎮 KEYBINDINGS</h3>
                    <div id="keybindings-list"></div>
                </div>
                
                <div class="menu-section">
                    <h3>🚁 ACTIVE DRONES</h3>
                    <div class="drone-list" id="drone-list"></div>
                </div>
            </div>
            
            <div class="center-panel">
                <div class="menu-section">
                    <h3>🏗️ LAYER HIERARCHY</h3>
                    <div class="layer-hierarchy" id="layer-hierarchy"></div>
                </div>
                
                <div class="control-buttons">
                    <button class="control-btn" onclick="executeCommand('auto_map')">🤖 Auto Map All</button>
                    <button class="control-btn" onclick="executeCommand('deploy_drone')">🚁 Deploy Drone</button>
                    <button class="control-btn" onclick="executeCommand('export_xml')">📋 Export XML</button>
                    <button class="control-btn" onclick="executeCommand('manual_map')">✋ Manual Map</button>
                    <button class="control-btn" onclick="executeCommand('restart_drones')">🔄 Restart Drones</button>
                    <button class="control-btn" onclick="executeCommand('validate_xml')">✅ Validate XML</button>
                </div>
                
                <div class="menu-section">
                    <h3>📊 PERFORMANCE CHART</h3>
                    <div class="performance-chart" id="performance-chart"></div>
                </div>
            </div>
            
            <div class="right-panel">
                <div class="menu-section">
                    <h3>📡 LIVE XML FEED</h3>
                    <div class="xml-feed" id="xml-feed"></div>
                </div>
                
                <div class="menu-section">
                    <h3>🔍 XML PREVIEW</h3>
                    <div class="xml-preview" id="xml-preview">
                        Select a mapping to preview XML...
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="floating-help" id="floating-help">
        <h4>🎯 QUICK HELP</h4>
        <p><strong>1-5:</strong> Navigate menus</p>
        <p><strong>D:</strong> Deploy drone</p>
        <p><strong>M:</strong> Manual mapping</p>
        <p><strong>X:</strong> Export XML</p>
        <p><strong>H:</strong> Toggle help</p>
        <p><strong>Q:</strong> Quit</p>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.ports.http}/ws');
        let state = {};
        let helpVisible = true;
        
        ws.onopen = () => {
            console.log('Connected to master mapper');
            updateConnectionStatus('Connected', 'green');
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleMessage(data);
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateConnectionStatus('Error', 'red');
        };
        
        ws.onclose = () => {
            updateConnectionStatus('Disconnected', 'red');
        };
        
        function handleMessage(data) {
            switch (data.type) {
                case 'initial_state':
                    state = data.state;
                    updateUI();
                    break;
                    
                case 'xml_update':
                    addXMLUpdate(data.update);
                    break;
                    
                case 'drone_update':
                    updateDroneStatus(data.drone);
                    break;
                    
                case 'performance_update':
                    updatePerformanceChart(data.metrics);
                    break;
            }
        }
        
        function updateUI() {
            // Update status bar
            document.getElementById('total-layers').textContent = state.platform?.total_layers || 0;
            document.getElementById('active-drones').textContent = state.drones?.active_count || 0;
            document.getElementById('xml-mappings').textContent = state.xml_engine?.mappings_count || 0;
            document.getElementById('performance').textContent = Math.floor(state.monitoring?.performance?.drone_efficiency || 0) + '%';
            
            // Update keybindings
            updateKeybindingsList();
            
            // Update drone list
            updateDroneList();
            
            // Update layer hierarchy
            updateLayerHierarchy();
        }
        
        function updateKeybindingsList() {
            const container = document.getElementById('keybindings-list');
            container.innerHTML = '';
            
            const keybindings = [
                { key: '1', desc: 'Main Menu' },
                { key: '2', desc: 'Layer Management' },
                { key: '3', desc: 'Drone Control' },
                { key: '4', desc: 'XML Viewer' },
                { key: 'D', desc: 'Deploy Drone' },
                { key: 'M', desc: 'Manual Map' },
                { key: 'X', desc: 'Export XML' },
                { key: 'H', desc: 'Toggle Help' }
            ];
            
            keybindings.forEach(kb => {
                const item = document.createElement('div');
                item.className = 'menu-item';
                item.innerHTML = \`
                    <span>\${kb.desc}</span>
                    <span class="keybinding">\${kb.key}</span>
                \`;
                item.onclick = () => executeCommand(kb.desc.toLowerCase().replace(' ', '_'));
                container.appendChild(item);
            });
        }
        
        function updateDroneList() {
            const container = document.getElementById('drone-list');
            container.innerHTML = '';
            
            // Mock drone data - would be populated from state
            const drones = [
                { id: 'inside-out-drone', status: 'active', tasks: 15 },
                { id: 'outside-in-drone', status: 'active', tasks: 12 },
                { id: 'middle-out-drone', status: 'active', tasks: 8 },
                { id: 'hierarchy-drone', status: 'active', tasks: 6 },
                { id: 'connection-drone', status: 'active', tasks: 10 }
            ];
            
            drones.forEach(drone => {
                const item = document.createElement('div');
                item.className = 'drone-item';
                item.innerHTML = \`
                    <div><strong>\${drone.id}</strong></div>
                    <div class="drone-status">Status: \${drone.status} | Tasks: \${drone.tasks}</div>
                \`;
                container.appendChild(item);
            });
        }
        
        function updateLayerHierarchy() {
            const container = document.getElementById('layer-hierarchy');
            container.innerHTML = '';
            
            // Mock layer data - would be populated from state
            const layers = [
                { name: 'creative-commons-licensing-handshake.js', complexity: 25 },
                { name: 'bloomberg-licensing-terminal.js', complexity: 45 },
                { name: 'licensing-tycoon-empire.js', complexity: 60 },
                { name: 'veil-piercing-meta-empire.js', complexity: 85 },
                { name: 'personal-apple-licensing-wrapper.js', complexity: 30 },
                { name: 'barrows-security-scanner.js', complexity: 40 },
                { name: 'spectator-arena-trap-theater.js', complexity: 70 },
                { name: 'xml-arena-mapping-system.js', complexity: 55 },
                { name: 'domain-master-dungeon-crawler.js', complexity: 80 },
                { name: 'live-reasoning-observer.js', complexity: 65 }
            ];
            
            layers.forEach((layer, index) => {
                const item = document.createElement('div');
                item.className = 'layer-item';
                item.innerHTML = \`
                    <span>\${index + 1}. \${layer.name}</span>
                    <span class="layer-complexity">\${layer.complexity}</span>
                \`;
                item.onclick = () => selectLayer(layer);
                container.appendChild(item);
            });
        }
        
        function addXMLUpdate(update) {
            const container = document.getElementById('xml-feed');
            const item = document.createElement('div');
            item.className = 'xml-item';
            
            const time = new Date().toLocaleTimeString();
            item.innerHTML = \`
                <strong>\${time}</strong> - \${update.drone_id}<br>
                Target: \${update.target.filename || update.target.id}<br>
                <small>XML mapping completed</small>
            \`;
            
            container.insertBefore(item, container.firstChild);
            
            // Keep only recent items
            while (container.children.length > 50) {
                container.removeChild(container.lastChild);
            }
        }
        
        function selectLayer(layer) {
            const preview = document.getElementById('xml-preview');
            preview.innerHTML = \`
<?xml version="1.0" encoding="UTF-8"?>
<layer id="\${layer.name}" complexity="\${layer.complexity}">
    <metadata>
        <filename>\${layer.name}</filename>
        <complexity_score>\${layer.complexity}</complexity_score>
        <last_mapped>\${new Date().toISOString()}</last_mapped>
    </metadata>
    <mappings>
        <inside_out status="active"/>
        <outside_in status="active"/>
        <middle_out status="active"/>
        <bidirectional status="pending"/>
    </mappings>
    <drones>
        <drone id="inside-out-drone" assigned="true"/>
        <drone id="middle-out-drone" assigned="true"/>
    </drones>
</layer>\`;
        }
        
        function executeCommand(command) {
            console.log('Executing command:', command);
            
            ws.send(JSON.stringify({
                type: 'command',
                command: command,
                timestamp: new Date().toISOString()
            }));
            
            // Visual feedback
            const btn = event?.target;
            if (btn) {
                const originalBg = btn.style.background;
                btn.style.background = 'rgba(0, 255, 0, 0.6)';
                setTimeout(() => {
                    btn.style.background = originalBg;
                }, 200);
            }
        }
        
        function updateConnectionStatus(status, color) {
            console.log('Connection status:', status);
        }
        
        function updatePerformanceChart(metrics) {
            const chart = document.getElementById('performance-chart');
            // Update performance visualization
        }
        
        // Keyboard event handling
        document.addEventListener('keydown', (event) => {
            const key = event.key.toLowerCase();
            
            switch (key) {
                case '1': executeCommand('main_menu'); break;
                case '2': executeCommand('layer_menu'); break;
                case '3': executeCommand('drone_menu'); break;
                case '4': executeCommand('xml_menu'); break;
                case '5': executeCommand('monitoring_menu'); break;
                case 'd': executeCommand('deploy_drone'); break;
                case 'm': executeCommand('manual_map'); break;
                case 'x': executeCommand('export_xml'); break;
                case 'a': executeCommand('auto_map'); break;
                case 'r': executeCommand('restart_drones'); break;
                case 'h': toggleHelp(); break;
                case 'q': executeCommand('quit'); break;
            }
        });
        
        function toggleHelp() {
            const help = document.getElementById('floating-help');
            helpVisible = !helpVisible;
            help.style.display = helpVisible ? 'block' : 'none';
        }
        
        // Auto-refresh updates
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'request_update' }));
            }
        }, 5000);
        
        // Initialize
        setTimeout(() => {
            updateUI();
        }, 1000);
    </script>
</body>
</html>`;
    }
    
    async handleWebCommand(data, ws) {
        switch (data.command) {
            case 'auto_map':
                await this.executeAutoMapping();
                break;
                
            case 'deploy_drone':
                await this.deployNewDrone();
                break;
                
            case 'export_xml':
                const xmlExport = this.exportAllXML();
                ws.send(JSON.stringify({
                    type: 'xml_export',
                    xml: xmlExport
                }));
                break;
                
            case 'restart_drones':
                await this.restartAllDrones();
                break;
                
            case 'request_update':
                ws.send(JSON.stringify({
                    type: 'state_update',
                    state: this.getFullState()
                }));
                break;
        }
    }
    
    async executeAutoMapping() {
        console.log('🤖 Executing auto-mapping of all layers...');
        
        const layers = Array.from(this.mapperState.platform.discovered_layers.values());
        for (const layer of layers) {
            // Trigger all mapping strategies for this layer
            for (const [strategyName, strategy] of Object.entries(this.mapperState.drones.mapping_strategies)) {
                try {
                    const xmlResult = await strategy(layer, { id: `auto-${strategyName}` });
                    if (xmlResult) {
                        console.log(`✅ Auto-mapped ${layer.filename} using ${strategyName}`);
                    }
                } catch (error) {
                    console.error(`❌ Auto-mapping failed for ${layer.filename}:`, error.message);
                }
            }
        }
        
        this.mapperState.platform.mapped_layers = layers.length;
        console.log('🎯 Auto-mapping complete');
    }
    
    async deployNewDrone() {
        const droneId = `custom-drone-${Date.now()}`;
        const drone = {
            id: droneId,
            strategy: 'bidirectional',
            target: 'custom_mapping',
            description: 'Custom deployed drone',
            status: 'active',
            deployed_at: new Date(),
            tasks_completed: 0,
            current_target: null,
            xml_output: [],
            performance: {
                mappings_per_minute: 0,
                success_rate: 0,
                efficiency_score: 0
            }
        };
        
        this.mapperState.drones.active_drones.set(droneId, drone);
        this.startDrone(drone);
        
        console.log(`🚁 Deployed new drone: ${droneId}`);
    }
    
    async restartAllDrones() {
        console.log('🔄 Restarting all drones...');
        
        // Stop all drones
        this.mapperState.drones.active_drones.forEach(drone => {
            drone.status = 'restarting';
        });
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Restart drones
        this.mapperState.drones.active_drones.forEach(drone => {
            drone.status = 'active';
            this.startDrone(drone);
        });
        
        console.log('✅ All drones restarted');
    }
    
    exportAllXML() {
        const platformXML = this.generatePlatformXML();
        const layersXML = this.generateLayersXML();
        const dronesXML = this.generateDronesXML();
        
        return `<?xml version="1.0" encoding="UTF-8"?>
<master_xml_export timestamp="${new Date().toISOString()}">
    ${platformXML}
    ${layersXML}
    ${dronesXML}
</master_xml_export>`;
    }
    
    generatePlatformXML() {
        const platformData = {
            'platform': {
                '@_mapper_id': this.mapperState.mapper_id,
                '@_session_start': this.mapperState.session_start.toISOString(),
                'statistics': {
                    'total_layers': this.mapperState.platform.total_layers,
                    'mapped_layers': this.mapperState.platform.mapped_layers,
                    'active_drones': this.mapperState.drones.active_drones.size,
                    'xml_mappings': this.mapperState.xml_engine.mappings.size
                },
                'performance': this.mapperState.monitoring.performance_metrics
            }
        };
        
        return this.mapperState.xml_engine.builder.build(platformData);
    }
    
    generateLayersXML() {
        const layers = Array.from(this.mapperState.platform.discovered_layers.values());
        
        const layersData = {
            'layers': {
                'layer': layers.map(layer => ({
                    '@_id': layer.id,
                    '@_filename': layer.filename,
                    '@_complexity': layer.analysis.complexity_score,
                    'metadata': {
                        'size': layer.size,
                        'modified': layer.modified.toISOString()
                    },
                    'analysis': {
                        'functions_count': layer.analysis.functions.length,
                        'classes_count': layer.analysis.classes.length,
                        'connections_count': layer.analysis.connections.length
                    }
                }))
            }
        };
        
        return this.mapperState.xml_engine.builder.build(layersData);
    }
    
    generateDronesXML() {
        const drones = Array.from(this.mapperState.drones.active_drones.values());
        
        const dronesData = {
            'drones': {
                'drone': drones.map(drone => ({
                    '@_id': drone.id,
                    '@_strategy': drone.strategy,
                    '@_status': drone.status,
                    'deployment': {
                        'deployed_at': drone.deployed_at.toISOString(),
                        'tasks_completed': drone.tasks_completed
                    },
                    'performance': drone.performance
                }))
            }
        };
        
        return this.mapperState.xml_engine.builder.build(dronesData);
    }
    
    generateLayerXML(layerName) {
        const layer = this.mapperState.platform.discovered_layers.get(layerName);
        if (!layer) {
            return '<error>Layer not found</error>';
        }
        
        const layerData = {
            'layer': {
                '@_id': layer.id,
                '@_filename': layer.filename,
                'metadata': {
                    'size': layer.size,
                    'modified': layer.modified.toISOString(),
                    'complexity_score': layer.analysis.complexity_score
                },
                'structure': {
                    'functions': {
                        'function': layer.analysis.functions.map(f => ({
                            '@_id': f.id,
                            'signature': f.signature,
                            'xml_path': f.xml_path
                        }))
                    },
                    'classes': {
                        'class': layer.analysis.classes.map(c => ({
                            '@_id': c.id,
                            'name': c.name,
                            'xml_path': c.xml_path
                        }))
                    },
                    'connections': {
                        'connection': layer.analysis.connections.map(c => ({
                            '@_id': c.id,
                            'endpoint': c.endpoint,
                            'xml_path': c.xml_path
                        }))
                    }
                },
                'mappings': {
                    'mapping': Array.from(layer.xml_mappings.entries()).map(([key, value]) => ({
                        '@_type': key,
                        'data': value
                    }))
                }
            }
        };
        
        return this.mapperState.xml_engine.builder.build(layerData);
    }
}

// Main execution
async function main() {
    const mapper = new MasterXMLDroneMapper();
    
    try {
        await mapper.initialize();
        
        console.log('\n🎮 MASTER XML DRONE MAPPER READY!');
        console.log('All platform layers are being continuously mapped');
        console.log('XML transformations available via API and web interface');
        console.log('Drones are actively mapping inside-out, outside-in, and middle-out');
        console.log('\n⌨️ Use keybindings to control the mapper!');
        
    } catch (error) {
        console.error('❌ Failed to initialize master mapper:', error);
        process.exit(1);
    }
}

// Start the master mapper
main();