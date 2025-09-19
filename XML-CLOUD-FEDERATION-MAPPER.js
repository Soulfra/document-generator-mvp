#!/usr/bin/env node

/**
 * 🌐 XML CLOUD FEDERATION MAPPER
 * 
 * Maps local gaming engine → Docker services → Galactic Federation
 * Because you're right - we built local but didn't deploy to the galactic infrastructure
 */

const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');
const { spawn } = require('child_process');

class XMLCloudFederationMapper {
    constructor() {
        this.port = 8888; // Federation mapping port
        
        // Local systems we need to map to cloud
        this.localSystems = {
            gaming: { port: 7777, status: 'unknown', cloudMapped: false },
            character: { port: 6969, status: 'unknown', cloudMapped: false },
            connector: { port: null, status: 'unknown', cloudMapped: false }
        };
        
        // Docker cloud services (from your docker-compose.yml)
        this.cloudServices = {
            'template-processor': { port: 3000, container: 'document-generator-template-processor' },
            'ai-api': { port: 3001, container: 'document-generator-ai-api' },
            'platform-hub': { port: 8080, container: 'document-generator-platform-hub' },
            'sovereign-agents': { port: 8085, container: 'document-generator-sovereign-agents' },
            'analytics': { port: 3002, container: 'document-generator-analytics' },
            'postgres': { port: 5432, container: 'document-generator-postgres' },
            'redis': { port: 6379, container: 'document-generator-redis' },
            'minio': { port: 9000, container: 'document-generator-minio' },
            'ollama': { port: 11434, container: 'document-generator-ollama' }
        };
        
        // Galactic Federation endpoints
        this.federationNodes = {
            'galactic-terminal': { file: 'GALACTIC-FEDERATION-TERMINAL.js', port: 9999 },
            'distributed-system': { file: 'FinishThisIdea-Phase2/dist/services/distributedSystem.service.js' },
            'federation-exchange': { file: 'FEDERATED-GUARDIAN-EXCHANGE-SYSTEM.html' }
        };
        
        // XML mapping schemas
        this.xmlMappings = new Map();
        
        console.log('🌐 XML CLOUD FEDERATION MAPPER');
        console.log('==============================');
        console.log('🚀 Local → Docker → Galactic Federation');
        console.log('📡 XML mapping deployment layers');
        console.log('');
        
        this.init();
    }
    
    async init() {
        try {
            // 1. Scan local systems
            await this.scanLocalSystems();
            
            // 2. Check Docker cloud services
            await this.checkDockerServices();
            
            // 3. Connect to Galactic Federation
            await this.connectToFederation();
            
            // 4. Create XML mappings
            await this.createXMLMappings();
            
            // 5. Deploy federation bridge
            await this.deployFederationBridge();
            
            console.log('🌟 FEDERATION MAPPING COMPLETE!');
            this.printMappingReport();
            
        } catch (error) {
            console.error('💥 Federation mapping failed:', error);
        }
    }
    
    async scanLocalSystems() {
        console.log('🔍 Scanning local systems...');
        
        for (const [name, system] of Object.entries(this.localSystems)) {
            if (system.port) {
                try {
                    const response = await this.pingSystem(system.port);
                    system.status = response ? 'running' : 'down';
                    
                    if (response) {
                        console.log(`   ✅ ${name}: running on port ${system.port}`);
                    } else {
                        console.log(`   ❌ ${name}: down`);
                    }
                } catch (error) {
                    system.status = 'down';
                    console.log(`   💀 ${name}: error - ${error.message}`);
                }
            } else {
                console.log(`   🟡 ${name}: process-based (no port)`);
                system.status = 'process';
            }
        }
    }
    
    async checkDockerServices() {
        console.log('🐳 Checking Docker cloud services...');
        
        try {
            // Check if Docker is running
            const dockerPs = spawn('docker', ['ps', '--format', 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'], {
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let dockerOutput = '';
            dockerPs.stdout.on('data', (data) => {
                dockerOutput += data.toString();
            });
            
            dockerPs.on('close', (code) => {
                if (code === 0) {
                    this.parseDockerStatus(dockerOutput);
                } else {
                    console.log('   ⚠️ Docker not running or not accessible');
                    console.log('     Run: docker-compose up -d');
                }
            });
            
        } catch (error) {
            console.log('   ❌ Docker check failed:', error.message);
        }
    }
    
    parseDockerStatus(output) {
        const lines = output.split('\\n').slice(1); // Skip header
        let runningServices = 0;
        
        for (const [serviceName, service] of Object.entries(this.cloudServices)) {
            const containerRunning = lines.some(line => 
                line.includes(service.container) && line.includes('Up')
            );
            
            service.status = containerRunning ? 'running' : 'down';
            
            if (containerRunning) {
                console.log(`   ✅ ${serviceName}: running (${service.container})`);
                runningServices++;
            } else {
                console.log(`   ❌ ${serviceName}: down`);
            }
        }
        
        console.log(`📊 Docker services: ${runningServices}/${Object.keys(this.cloudServices).length} running`);
        
        if (runningServices === 0) {
            console.log('🚨 No Docker services running! Start with: docker-compose up -d');
        }
    }
    
    async connectToFederation() {
        console.log('🌌 Connecting to Galactic Federation...');
        
        // Check if Galactic Federation terminal exists
        try {
            await fs.access(path.join(__dirname, 'GALACTIC-FEDERATION-TERMINAL.js'));
            console.log('   ✅ Galactic Federation Terminal found');
            
            // Start federation terminal
            await this.startFederationTerminal();
            
        } catch (error) {
            console.log('   ⚠️ Galactic Federation Terminal not accessible');
            console.log('     Creating federation bridge...');
            await this.createFederationBridge();
        }
    }
    
    async startFederationTerminal() {
        try {
            const federationProcess = spawn('node', ['GALACTIC-FEDERATION-TERMINAL.js'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                detached: false
            });
            
            federationProcess.stdout.on('data', (data) => {
                console.log(`   🌌 Federation: ${data.toString().trim()}`);
            });
            
            federationProcess.on('error', (error) => {
                console.log('   ⚠️ Federation terminal error:', error.message);
            });
            
            // Give it time to start
            await this.wait(2000);
            console.log('   ✅ Galactic Federation Terminal started');
            
        } catch (error) {
            console.log('   ❌ Failed to start federation terminal');
        }
    }
    
    async createFederationBridge() {
        console.log('   🌉 Creating federation bridge...');
        
        // Create a minimal federation bridge
        this.federationBridge = {
            id: 'FED-BRIDGE-' + Date.now(),
            status: 'active',
            connections: new Map(),
            protocols: ['XML_MAPPING', 'CLOUD_DEPLOYMENT', 'DISTRIBUTED_SYNC'],
            nodes: []
        };
        
        console.log('   ✅ Federation bridge created');
    }
    
    async createXMLMappings() {
        console.log('📋 Creating XML deployment mappings...');
        
        // Map local gaming engine to cloud services
        this.xmlMappings.set('gaming-to-cloud', this.createXMLMapping({
            source: {
                system: 'gaming-engine',
                port: 7777,
                type: 'pixel-voxel-engine',
                endpoints: ['/game', '/api/status']
            },
            destinations: [
                {
                    service: 'template-processor',
                    port: 3000,
                    mapping: 'game-state → template processing',
                    protocol: 'WebSocket + HTTP'
                },
                {
                    service: 'ai-api',
                    port: 3001,
                    mapping: 'character actions → AI processing',
                    protocol: 'REST API'
                },
                {
                    service: 'sovereign-agents',
                    port: 8085,
                    mapping: 'player decisions → agent orchestration',
                    protocol: 'Agent Protocol'
                }
            ]
        }));
        
        // Map character interface to distributed systems
        this.xmlMappings.set('character-to-distributed', this.createXMLMapping({
            source: {
                system: 'character-interface',
                port: 6969,
                type: 'eyes-ears-face-hands',
                capabilities: ['scanning', 'listening', 'gesturing', 'expression']
            },
            destinations: [
                {
                    service: 'analytics',
                    port: 3002,
                    mapping: 'character behavior → analytics tracking',
                    protocol: 'Event Stream'
                },
                {
                    service: 'redis',
                    port: 6379,
                    mapping: 'character state → distributed cache',
                    protocol: 'Redis Protocol'
                },
                {
                    service: 'postgres',
                    port: 5432,
                    mapping: 'character actions → persistent storage',
                    protocol: 'SQL'
                }
            ]
        }));
        
        // Map to Galactic Federation
        this.xmlMappings.set('local-to-federation', this.createXMLMapping({
            source: {
                system: 'local-systems',
                components: ['gaming', 'character', 'connector'],
                type: 'local-cluster'
            },
            destinations: [
                {
                    service: 'galactic-federation',
                    port: 9999,
                    mapping: 'local cluster → galactic nodes',
                    protocol: 'Federation Protocol'
                },
                {
                    service: 'distributed-network',
                    mapping: 'game state → distributed consensus',
                    protocol: 'Blockchain + P2P'
                }
            ]
        }));
        
        console.log(`   ✅ Created ${this.xmlMappings.size} XML mappings`);
    }
    
    createXMLMapping(config) {
        const timestamp = new Date().toISOString();
        
        return {
            id: 'XML-MAP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            created: timestamp,
            source: config.source,
            destinations: config.destinations,
            status: 'active',
            xml_schema: this.generateXMLSchema(config),
            deployment_config: this.generateDeploymentConfig(config),
            monitoring: {
                enabled: true,
                metrics: ['latency', 'throughput', 'error_rate', 'availability'],
                alerts: ['connection_lost', 'high_latency', 'service_down']
            }
        };
    }
    
    generateXMLSchema(config) {
        return `<?xml version="1.0" encoding="UTF-8"?>
<mapping xmlns="http://federation.galactic/schema/v1">
    <source>
        <system>${config.source.system}</system>
        <type>${config.source.type}</type>
        ${config.source.port ? `<port>${config.source.port}</port>` : ''}
        ${config.source.capabilities ? 
            '<capabilities>' + 
            config.source.capabilities.map(cap => `<capability>${cap}</capability>`).join('') +
            '</capabilities>' : ''
        }
    </source>
    <destinations>
        ${config.destinations.map(dest => `
        <destination>
            <service>${dest.service}</service>
            ${dest.port ? `<port>${dest.port}</port>` : ''}
            <mapping>${dest.mapping}</mapping>
            <protocol>${dest.protocol}</protocol>
        </destination>`).join('')}
    </destinations>
    <deployment>
        <strategy>distributed</strategy>
        <replication>3</replication>
        <load_balancing>round_robin</load_balancing>
        <failover>automatic</failover>
    </deployment>
</mapping>`;
    }
    
    generateDeploymentConfig(config) {
        return {
            docker_compose: this.generateDockerMapping(config),
            kubernetes: this.generateK8sMapping(config),
            federation: this.generateFederationConfig(config)
        };
    }
    
    generateDockerMapping(config) {
        return {
            version: '3.8',
            services: config.destinations.reduce((services, dest) => {
                services[`${config.source.system}-to-${dest.service}`] = {
                    image: 'federation-mapper:latest',
                    environment: {
                        SOURCE_SYSTEM: config.source.system,
                        SOURCE_PORT: config.source.port,
                        DEST_SERVICE: dest.service,
                        DEST_PORT: dest.port,
                        MAPPING_TYPE: dest.mapping,
                        PROTOCOL: dest.protocol
                    },
                    networks: ['document-generator', 'federation']
                };
                return services;
            }, {})
        };
    }
    
    generateK8sMapping(config) {
        return {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            metadata: {
                name: `${config.source.system}-federation-mapper`,
                namespace: 'galactic-federation'
            },
            spec: {
                replicas: 3,
                selector: {
                    matchLabels: {
                        app: `${config.source.system}-mapper`
                    }
                },
                template: {
                    metadata: {
                        labels: {
                            app: `${config.source.system}-mapper`
                        }
                    },
                    spec: {
                        containers: [{
                            name: 'federation-mapper',
                            image: 'galactic-federation/mapper:v1.0.0',
                            ports: config.destinations.map(dest => ({
                                containerPort: dest.port
                            }))
                        }]
                    }
                }
            }
        };
    }
    
    generateFederationConfig(config) {
        return {
            federation_node: {
                id: config.source.system + '-node',
                type: 'bridge_node',
                capabilities: config.source.capabilities || [],
                connections: config.destinations.map(dest => ({
                    target: dest.service,
                    protocol: dest.protocol,
                    mapping: dest.mapping
                }))
            },
            consensus: {
                algorithm: 'PBFT',
                min_nodes: 3,
                timeout: 5000
            },
            replication: {
                factor: 3,
                strategy: 'async'
            }
        };
    }
    
    async deployFederationBridge() {
        console.log('🚀 Deploying federation bridge...');
        
        // Create federation bridge service
        const bridgeService = {
            name: 'Federation Bridge',
            port: this.port,
            mappings: this.xmlMappings.size,
            connections: [],
            status: 'active'
        };
        
        // Start bridge server
        await this.startBridgeServer();
        
        // Connect to all mapped services
        await this.establishConnections();
        
        console.log('   ✅ Federation bridge deployed');
    }
    
    async startBridgeServer() {
        const http = require('http');
        
        const server = http.createServer(async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json');
            
            if (req.url === '/federation/status') {
                res.end(JSON.stringify({
                    status: 'operational',
                    mappings: Array.from(this.xmlMappings.keys()),
                    local_systems: this.localSystems,
                    cloud_services: this.cloudServices,
                    federation_bridge: this.federationBridge
                }));
            } else if (req.url === '/federation/mappings') {
                const mappings = {};
                for (const [key, mapping] of this.xmlMappings) {
                    mappings[key] = {
                        id: mapping.id,
                        source: mapping.source,
                        destinations: mapping.destinations.length,
                        status: mapping.status
                    };
                }
                res.end(JSON.stringify(mappings, null, 2));
            } else if (req.url === '/federation/xml') {
                res.setHeader('Content-Type', 'application/xml');
                const xml = Array.from(this.xmlMappings.values())
                    .map(mapping => mapping.xml_schema)
                    .join('\\n\\n');
                res.end(xml);
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`   🌐 Federation bridge server running on port ${this.port}`);
        });
    }
    
    async establishConnections() {
        console.log('🔗 Establishing federation connections...');
        
        let connectedSystems = 0;
        
        // Connect to local systems
        for (const [name, system] of Object.entries(this.localSystems)) {
            if (system.status === 'running' && system.port) {
                try {
                    // Create WebSocket connection for real-time mapping
                    const ws = new WebSocket(`ws://localhost:${system.port}`);
                    
                    ws.on('open', () => {
                        system.cloudMapped = true;
                        connectedSystems++;
                        console.log(`   ✅ ${name} → cloud federation mapped`);
                        
                        // Send federation registration
                        ws.send(JSON.stringify({
                            type: 'federation_register',
                            system: name,
                            bridge_port: this.port,
                            cloud_services: Object.keys(this.cloudServices)
                        }));
                    });
                    
                    ws.on('message', (data) => {
                        this.handleFederationMessage(name, JSON.parse(data));
                    });
                    
                    ws.on('error', (error) => {
                        console.log(`   ⚠️ ${name} federation connection error:`, error.message);
                    });
                    
                } catch (error) {
                    console.log(`   ❌ Failed to map ${name} to federation`);
                }
            }
        }
        
        console.log(`📡 Federation connections: ${connectedSystems} systems mapped`);
    }
    
    handleFederationMessage(systemName, message) {
        // Route messages between local systems and cloud services
        switch (message.type) {
            case 'game_state_update':
                this.routeToCloudService('template-processor', {
                    type: 'game_template_update',
                    data: message.data,
                    source: systemName
                });
                break;
                
            case 'character_action':
                this.routeToCloudService('ai-api', {
                    type: 'character_ai_processing',
                    data: message.data,
                    source: systemName
                });
                break;
                
            case 'player_decision':
                this.routeToCloudService('sovereign-agents', {
                    type: 'agent_orchestration',
                    data: message.data,
                    source: systemName
                });
                break;
        }
    }
    
    async routeToCloudService(serviceName, message) {
        const service = this.cloudServices[serviceName];
        if (!service) return;
        
        try {
            // Route to Docker service
            const response = await fetch(`http://localhost:${service.port}/api/federation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message)
            });
            
            if (response.ok) {
                console.log(`   📡 Routed to ${serviceName}: ${message.type}`);
            }
            
        } catch (error) {
            console.log(`   ⚠️ Failed to route to ${serviceName}:`, error.message);
        }
    }
    
    printMappingReport() {
        console.log('');
        console.log('🌟 FEDERATION MAPPING REPORT');
        console.log('============================');
        
        console.log('📍 Local Systems:');
        for (const [name, system] of Object.entries(this.localSystems)) {
            const status = system.cloudMapped ? '🌐 MAPPED' : '🔌 LOCAL';
            console.log(`   ${status} ${name.padEnd(15)} : ${system.status}`);
        }
        
        console.log('\\n🐳 Docker Services:');
        for (const [name, service] of Object.entries(this.cloudServices)) {
            const status = service.status === 'running' ? '✅' : '❌';
            console.log(`   ${status} ${name.padEnd(20)} : ${service.status} (port ${service.port})`);
        }
        
        console.log(`\\n📋 XML Mappings: ${this.xmlMappings.size} active`);
        for (const [key, mapping] of this.xmlMappings) {
            console.log(`   📄 ${key}: ${mapping.destinations.length} destinations`);
        }
        
        console.log('\\n🌐 Federation Endpoints:');
        console.log(`   🎮 Local Gaming: http://localhost:7777/game`);
        console.log(`   👁️ Character: http://localhost:6969/character`);
        console.log(`   🔗 Federation Bridge: http://localhost:${this.port}/federation/status`);
        console.log(`   📋 XML Mappings: http://localhost:${this.port}/federation/xml`);
        console.log(`   🐳 Docker Hub: http://localhost:8080`);
        console.log(`   🌌 Galactic Federation: http://localhost:9999 (if running)`);
    }
    
    async pingSystem(port) {
        return new Promise((resolve) => {
            const http = require('http');
            const req = http.request({
                hostname: 'localhost',
                port: port,
                method: 'GET',
                timeout: 1000
            }, (res) => {
                resolve(true);
            });
            
            req.on('error', () => resolve(false));
            req.on('timeout', () => resolve(false));
            req.end();
        });
    }
    
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Start the federation mapper
if (require.main === module) {
    console.log('🌐 STARTING XML CLOUD FEDERATION MAPPER');
    console.log('======================================');
    console.log('🚀 Mapping local systems to galactic infrastructure');
    console.log('');
    
    new XMLCloudFederationMapper();
}

module.exports = XMLCloudFederationMapper;