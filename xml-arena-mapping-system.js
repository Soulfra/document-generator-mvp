#!/usr/bin/env node

/**
 * 🗺️ XML ARENA MAPPING SYSTEM
 * Maps the entire Spectator Arena Trap Theater to a live XML feed
 * Creates structured, watchable XML streams of all trap-building activities
 * Includes RSS feeds, XML-RPC endpoints, and real-time XML transformations
 */

const http = require('http');
const { WebSocketServer } = require('ws');
const crypto = require('crypto');
const net = require('net');
const fs = require('fs');
const path = require('path');
const { XMLBuilder, XMLParser } = require('fast-xml-parser');

class XMLArenaMappingSystem {
    constructor() {
        this.systemId = crypto.randomUUID();
        this.port = null;
        this.wsPort = null;
        this.xmlPort = null;
        
        // XML mapping state
        this.xmlState = {
            id: this.systemId,
            name: 'XML Arena Mapping System',
            version: '1.0',
            
            // Live XML documents
            documents: {
                arena: null,          // Main arena state
                builders: null,       // Builder activities
                traps: null,          // Trap catalog
                events: null,         // Event stream
                spectators: null,     // Spectator data
                gacha: null,          // Gacha/claw results
                mime: null            // Mime performances
            },
            
            // XML schemas
            schemas: {
                arena: this.createArenaSchema(),
                trap: this.createTrapSchema(),
                builder: this.createBuilderSchema(),
                event: this.createEventSchema()
            },
            
            // Transformation pipelines
            transformations: new Map(),
            
            // Subscription system
            subscribers: new Map(),
            
            // XML-RPC endpoints
            rpcEndpoints: new Map()
        };
        
        // XML builder configuration
        this.xmlBuilder = new XMLBuilder({
            ignoreAttributes: false,
            format: true,
            indentBy: '  ',
            suppressEmptyNode: false,
            attributeNamePrefix: '@',
            textNodeName: '#text',
            commentPropName: '#comment'
        });
        
        // XML parser configuration
        this.xmlParser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@',
            textNodeName: '#text',
            commentPropName: '#comment'
        });
        
        // Connect to arena theater
        this.arenaConnection = null;
        this.arenaState = null;
        
        console.log(`🗺️ XML Arena Mapping System initialized`);
        console.log(`📡 System ID: ${this.systemId}`);
        console.log(`🎭 Ready to map arena activities to XML`);
    }
    
    async initialize() {
        console.log('🔄 Initializing XML Arena Mapping System...');
        
        // Allocate ports
        await this.allocatePorts();
        
        // Connect to arena theater
        await this.connectToArena();
        
        // Initialize XML documents
        this.initializeXMLDocuments();
        
        // Start XML server
        this.startXMLServer();
        
        // Start WebSocket for live XML updates
        this.startXMLWebSocket();
        
        // Start transformation engine
        this.startTransformationEngine();
        
        // Initialize RPC endpoints
        this.initializeRPCEndpoints();
        
        console.log('\\n✅ XML ARENA MAPPING SYSTEM OPERATIONAL!');
        console.log(`🗺️ XML Interface: http://localhost:${this.port}`);
        console.log(`📡 Live XML Updates: ws://localhost:${this.wsPort}`);
        console.log(`📋 XML Feeds: http://localhost:${this.xmlPort}/feeds/`);
        console.log(`🔄 XML-RPC: http://localhost:${this.xmlPort}/rpc`);
        
        return this;
    }
    
    async allocatePorts() {
        this.port = await this.findAvailablePort(9200);
        this.wsPort = await this.findAvailablePort(9201);
        this.xmlPort = await this.findAvailablePort(9202);
        console.log(`🔌 Allocated ports - HTTP: ${this.port}, WebSocket: ${this.wsPort}, XML: ${this.xmlPort}`);
    }
    
    async findAvailablePort(preferredPort) {
        return new Promise((resolve) => {
            const server = net.createServer();
            
            server.listen(preferredPort, '127.0.0.1', () => {
                const port = server.address().port;
                server.close(() => resolve(port));
            });
            
            server.on('error', () => {
                this.findAvailablePort(preferredPort + 1).then(resolve);
            });
        });
    }
    
    async connectToArena() {
        console.log('🎭 Connecting to Spectator Arena Theater...');
        
        return new Promise((resolve) => {
            // Connect to arena WebSocket
            const WebSocket = require('ws');
            this.arenaConnection = new WebSocket('ws://localhost:9101');
            
            this.arenaConnection.on('open', () => {
                console.log('✅ Connected to arena theater');
                resolve();
            });
            
            this.arenaConnection.on('message', (data) => {
                const message = JSON.parse(data);
                this.handleArenaMessage(message);
            });
            
            this.arenaConnection.on('error', (error) => {
                console.error('❌ Arena connection error:', error);
            });
        });
    }
    
    handleArenaMessage(message) {
        // Update internal state
        if (message.type === 'arena_update') {
            this.arenaState = message;
        }
        
        // Transform to XML and update documents
        this.updateXMLDocuments(message);
        
        // Broadcast XML updates
        this.broadcastXMLUpdate(message);
        
        // Trigger transformations
        this.applyTransformations(message);
    }
    
    initializeXMLDocuments() {
        console.log('📄 Initializing XML documents...');
        
        // Main arena document
        this.xmlState.documents.arena = {
            '?xml': { '@version': '1.0', '@encoding': 'UTF-8' },
            'arena': {
                '@xmlns': 'http://spectator-arena.local/schema/arena',
                '@xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
                '@version': '1.0',
                'metadata': {
                    'id': this.systemId,
                    'name': 'Spectator Arena Trap Theater',
                    'timestamp': new Date().toISOString()
                },
                'builders': {},
                'traps': {},
                'spectators': {},
                'events': {}
            }
        };
        
        // Builder activity feed
        this.xmlState.documents.builders = {
            '?xml': { '@version': '1.0', '@encoding': 'UTF-8' },
            'builders': {
                '@xmlns': 'http://spectator-arena.local/schema/builders',
                'builder': []
            }
        };
        
        // Trap catalog
        this.xmlState.documents.traps = {
            '?xml': { '@version': '1.0', '@encoding': 'UTF-8' },
            'trap-catalog': {
                '@xmlns': 'http://spectator-arena.local/schema/traps',
                'trap': []
            }
        };
        
        // Event stream (RSS-style)
        this.xmlState.documents.events = {
            '?xml': { '@version': '1.0', '@encoding': 'UTF-8' },
            'rss': {
                '@version': '2.0',
                '@xmlns:arena': 'http://spectator-arena.local/schema/events',
                'channel': {
                    'title': 'Arena Event Stream',
                    'link': `http://localhost:${this.xmlPort}/feeds/events`,
                    'description': 'Live events from the Spectator Arena Trap Theater',
                    'lastBuildDate': new Date().toUTCString(),
                    'item': []
                }
            }
        };
    }
    
    updateXMLDocuments(message) {
        const timestamp = new Date().toISOString();
        
        switch (message.type) {
            case 'arena_update':
                this.updateArenaXML(message);
                break;
            
            case 'event':
                this.addEventToXML(message, timestamp);
                break;
            
            case 'trap_completed':
                this.addTrapToXML(message.trap, timestamp);
                break;
            
            case 'builder_interaction':
                this.updateBuilderXML(message.builder, message.action);
                break;
        }
    }
    
    updateArenaXML(data) {
        const arena = this.xmlState.documents.arena.arena;
        
        // Update builders
        arena.builders = {
            '@count': data.builders?.length || 0,
            'builder': (data.builders || []).map(b => ({
                '@id': b.id,
                '@status': 'active',
                'name': b.name,
                'layer': b.layer,
                'progress': {
                    '@percentage': b.progress,
                    '#text': b.action
                },
                'stats': {
                    'traps-built': b.trapsBuilt
                }
            }))
        };
        
        // Update spectators
        arena.spectators = {
            '@count': data.spectators || 0,
            'viewing-angle': data.camera || 'OVERVIEW'
        };
        
        // Update metadata
        arena.metadata.timestamp = new Date().toISOString();
    }
    
    addEventToXML(event, timestamp) {
        // Add to RSS-style event feed
        const channel = this.xmlState.documents.events.rss.channel;
        
        const item = {
            'title': this.getEventTitle(event),
            'link': `http://localhost:${this.xmlPort}/event/${event.id || crypto.randomUUID()}`,
            'description': this.getEventDescription(event),
            'pubDate': new Date(timestamp).toUTCString(),
            'guid': event.id || crypto.randomUUID(),
            'arena:eventType': event.type,
            'arena:metadata': JSON.stringify(event)
        };
        
        // Add to beginning of feed
        channel.item.unshift(item);
        
        // Limit to 100 most recent events
        if (channel.item.length > 100) {
            channel.item = channel.item.slice(0, 100);
        }
        
        channel.lastBuildDate = new Date().toUTCString();
    }
    
    addTrapToXML(trap, timestamp) {
        const catalog = this.xmlState.documents.traps['trap-catalog'];
        
        const trapXML = {
            '@id': trap.id,
            '@builder': trap.builder,
            '@rarity': trap.severity,
            'name': trap.name,
            'type': trap.type,
            'layer': trap.layer,
            'creativity': {
                '@score': trap.creativity,
                '@percentage': Math.round(trap.creativity * 100)
            },
            'code': {
                '@language': 'javascript',
                '#text': trap.code
            },
            'timestamp': timestamp
        };
        
        catalog.trap.push(trapXML);
    }
    
    updateBuilderXML(builderName, action) {
        const builders = this.xmlState.documents.builders.builders;
        
        let builder = builders.builder.find(b => b.name === builderName);
        
        if (!builder) {
            builder = {
                '@id': crypto.randomUUID(),
                'name': builderName,
                'actions': {
                    'action': []
                }
            };
            builders.builder.push(builder);
        }
        
        builder.actions.action.push({
            '@timestamp': new Date().toISOString(),
            '#text': action
        });
        
        // Limit action history
        if (builder.actions.action.length > 50) {
            builder.actions.action = builder.actions.action.slice(-50);
        }
    }
    
    getEventTitle(event) {
        const titles = {
            'trap_completed': `New Trap: ${event.trap?.name || 'Unknown'}`,
            'mime_performance': `Mime Act: ${event.act?.name || 'Unknown'}`,
            'builder_interaction': `Builder Action: ${event.builder || 'Unknown'}`,
            'random_event': event.description || 'Random Event'
        };
        
        return titles[event.type] || event.type;
    }
    
    getEventDescription(event) {
        switch (event.type) {
            case 'trap_completed':
                return `${event.builder} completed a ${event.trap?.severity || 'unknown'} severity trap: ${event.trap?.name}`;
            
            case 'mime_performance':
                return event.act?.description || 'A mime performance occurred';
            
            case 'builder_interaction':
                return `${event.builder} ${event.action}`;
            
            default:
                return JSON.stringify(event);
        }
    }
    
    createArenaSchema() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           targetNamespace="http://spectator-arena.local/schema/arena"
           xmlns="http://spectator-arena.local/schema/arena"
           elementFormDefault="qualified">
    
    <xs:element name="arena">
        <xs:complexType>
            <xs:sequence>
                <xs:element name="metadata" type="metadataType"/>
                <xs:element name="builders" type="buildersType"/>
                <xs:element name="traps" type="trapsType"/>
                <xs:element name="spectators" type="spectatorsType"/>
                <xs:element name="events" type="eventsType"/>
            </xs:sequence>
            <xs:attribute name="version" type="xs:string" use="required"/>
        </xs:complexType>
    </xs:element>
    
    <xs:complexType name="metadataType">
        <xs:sequence>
            <xs:element name="id" type="xs:string"/>
            <xs:element name="name" type="xs:string"/>
            <xs:element name="timestamp" type="xs:dateTime"/>
        </xs:sequence>
    </xs:complexType>
    
    <xs:complexType name="builderType">
        <xs:sequence>
            <xs:element name="name" type="xs:string"/>
            <xs:element name="layer" type="xs:string"/>
            <xs:element name="progress" type="progressType"/>
            <xs:element name="stats" type="statsType"/>
        </xs:sequence>
        <xs:attribute name="id" type="xs:string" use="required"/>
        <xs:attribute name="status" type="xs:string"/>
    </xs:complexType>
    
</xs:schema>`;
    }
    
    createTrapSchema() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"
           targetNamespace="http://spectator-arena.local/schema/traps"
           xmlns="http://spectator-arena.local/schema/traps"
           elementFormDefault="qualified">
    
    <xs:element name="trap">
        <xs:complexType>
            <xs:sequence>
                <xs:element name="name" type="xs:string"/>
                <xs:element name="type" type="xs:string"/>
                <xs:element name="layer" type="xs:string"/>
                <xs:element name="creativity" type="creativityType"/>
                <xs:element name="code" type="codeType"/>
                <xs:element name="timestamp" type="xs:dateTime"/>
            </xs:sequence>
            <xs:attribute name="id" type="xs:string" use="required"/>
            <xs:attribute name="builder" type="xs:string"/>
            <xs:attribute name="rarity" type="rarityType"/>
        </xs:complexType>
    </xs:element>
    
    <xs:simpleType name="rarityType">
        <xs:restriction base="xs:string">
            <xs:enumeration value="LEGENDARY"/>
            <xs:enumeration value="EPIC"/>
            <xs:enumeration value="RARE"/>
            <xs:enumeration value="COMMON"/>
        </xs:restriction>
    </xs:simpleType>
    
</xs:schema>`;
    }
    
    createBuilderSchema() {
        // Similar schema for builders
        return `<?xml version="1.0" encoding="UTF-8"?>...`;
    }
    
    createEventSchema() {
        // Similar schema for events
        return `<?xml version="1.0" encoding="UTF-8"?>...`;
    }
    
    startXMLServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/xml');
            
            const url = new URL(req.url, `http://localhost:${this.xmlPort}`);
            
            // XML feed endpoints
            if (url.pathname.startsWith('/feeds/')) {
                this.handleXMLFeed(url.pathname, res);
            }
            // XML-RPC endpoint
            else if (url.pathname === '/rpc' && req.method === 'POST') {
                this.handleXMLRPC(req, res);
            }
            // Schema endpoints
            else if (url.pathname.startsWith('/schema/')) {
                this.handleSchema(url.pathname, res);
            }
            // Transformation endpoints
            else if (url.pathname.startsWith('/transform/')) {
                this.handleTransformation(url.pathname, res);
            }
            // Root XML interface
            else if (url.pathname === '/') {
                res.setHeader('Content-Type', 'text/html');
                res.writeHead(200);
                res.end(this.getXMLInterfaceHTML());
            }
            else {
                res.writeHead(404);
                res.end('<?xml version="1.0"?><error>Not Found</error>');
            }
        });
        
        server.listen(this.xmlPort, () => {
            console.log(`📋 XML server listening on http://localhost:${this.xmlPort}`);
        });
    }
    
    handleXMLFeed(pathname, res) {
        const feedName = pathname.split('/').pop();
        
        const feeds = {
            'arena': this.xmlState.documents.arena,
            'builders': this.xmlState.documents.builders,
            'traps': this.xmlState.documents.traps,
            'events': this.xmlState.documents.events,
            'all': this.combineAllFeeds()
        };
        
        const feed = feeds[feedName];
        
        if (feed) {
            const xml = this.xmlBuilder.build(feed);
            res.writeHead(200);
            res.end(xml);
        } else {
            res.writeHead(404);
            res.end('<?xml version="1.0"?><error>Feed not found</error>');
        }
    }
    
    combineAllFeeds() {
        return {
            '?xml': { '@version': '1.0', '@encoding': 'UTF-8' },
            'arena-data': {
                '@xmlns': 'http://spectator-arena.local/schema/combined',
                '@timestamp': new Date().toISOString(),
                'arena': this.xmlState.documents.arena.arena,
                'builders': this.xmlState.documents.builders.builders,
                'traps': this.xmlState.documents.traps['trap-catalog'],
                'events': this.xmlState.documents.events.rss.channel
            }
        };
    }
    
    handleXMLRPC(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const parsed = this.xmlParser.parse(body);
                const methodCall = parsed.methodCall;
                
                if (methodCall) {
                    const methodName = methodCall.methodName;
                    const params = this.extractRPCParams(methodCall.params);
                    
                    const result = this.executeRPCMethod(methodName, params);
                    const responseXML = this.buildRPCResponse(result);
                    
                    res.writeHead(200);
                    res.end(responseXML);
                } else {
                    res.writeHead(400);
                    res.end(this.buildRPCFault('Invalid XML-RPC request'));
                }
            } catch (error) {
                res.writeHead(500);
                res.end(this.buildRPCFault(error.message));
            }
        });
    }
    
    extractRPCParams(params) {
        if (!params || !params.param) return [];
        
        const paramArray = Array.isArray(params.param) ? params.param : [params.param];
        
        return paramArray.map(param => {
            const value = param.value;
            if (value.string) return value.string;
            if (value.int || value.i4) return parseInt(value.int || value.i4);
            if (value.boolean) return value.boolean === '1';
            if (value.double) return parseFloat(value.double);
            if (value.array) return this.extractRPCArray(value.array);
            if (value.struct) return this.extractRPCStruct(value.struct);
            return null;
        });
    }
    
    executeRPCMethod(methodName, params) {
        const methods = {
            'arena.getBuilders': () => {
                return Array.from(this.arenaState?.builders || []);
            },
            'arena.getTraps': () => {
                return this.xmlState.documents.traps['trap-catalog'].trap;
            },
            'arena.getEvents': (limit = 10) => {
                return this.xmlState.documents.events.rss.channel.item.slice(0, limit);
            },
            'arena.subscribeToFeed': (feedName, callbackUrl) => {
                this.xmlState.subscribers.set(feedName, callbackUrl);
                return { success: true, message: `Subscribed to ${feedName}` };
            }
        };
        
        const method = methods[methodName];
        if (method) {
            return method(...params);
        } else {
            throw new Error(`Method ${methodName} not found`);
        }
    }
    
    buildRPCResponse(result) {
        const response = {
            '?xml': { '@version': '1.0', '@encoding': 'UTF-8' },
            'methodResponse': {
                'params': {
                    'param': {
                        'value': this.convertToRPCValue(result)
                    }
                }
            }
        };
        
        return this.xmlBuilder.build(response);
    }
    
    buildRPCFault(message) {
        const fault = {
            '?xml': { '@version': '1.0', '@encoding': 'UTF-8' },
            'methodResponse': {
                'fault': {
                    'value': {
                        'struct': {
                            'member': [
                                {
                                    'name': 'faultCode',
                                    'value': { 'int': 1 }
                                },
                                {
                                    'name': 'faultString',
                                    'value': { 'string': message }
                                }
                            ]
                        }
                    }
                }
            }
        };
        
        return this.xmlBuilder.build(fault);
    }
    
    convertToRPCValue(value) {
        if (typeof value === 'string') {
            return { 'string': value };
        } else if (typeof value === 'number') {
            return Number.isInteger(value) ? { 'int': value } : { 'double': value };
        } else if (typeof value === 'boolean') {
            return { 'boolean': value ? '1' : '0' };
        } else if (Array.isArray(value)) {
            return {
                'array': {
                    'data': {
                        'value': value.map(v => this.convertToRPCValue(v))
                    }
                }
            };
        } else if (typeof value === 'object') {
            return {
                'struct': {
                    'member': Object.entries(value).map(([k, v]) => ({
                        'name': k,
                        'value': this.convertToRPCValue(v)
                    }))
                }
            };
        }
        return { 'nil': {} };
    }
    
    startXMLWebSocket() {
        this.wss = new WebSocketServer({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('📡 New XML subscriber connected');
            
            // Send current state as XML
            ws.send(this.xmlBuilder.build(this.combineAllFeeds()));
            
            // Handle subscription requests
            ws.on('message', (message) => {
                try {
                    const request = JSON.parse(message);
                    
                    if (request.subscribe) {
                        this.handleSubscription(ws, request.subscribe);
                    }
                    
                    if (request.transform) {
                        this.handleTransformRequest(ws, request.transform);
                    }
                } catch (error) {
                    ws.send(JSON.stringify({ error: error.message }));
                }
            });
        });
        
        console.log(`📡 XML WebSocket listening on ws://localhost:${this.wsPort}`);
    }
    
    handleSubscription(ws, feeds) {
        // Subscribe to specific XML feeds
        ws.subscribedFeeds = feeds;
        
        ws.send(JSON.stringify({
            type: 'subscription_confirmed',
            feeds: feeds
        }));
    }
    
    broadcastXMLUpdate(message) {
        if (!this.wss) return;
        
        // Convert message to XML
        const xmlUpdate = {
            '?xml': { '@version': '1.0', '@encoding': 'UTF-8' },
            'update': {
                '@type': message.type,
                '@timestamp': new Date().toISOString(),
                'data': message
            }
        };
        
        const xml = this.xmlBuilder.build(xmlUpdate);
        
        // Broadcast to all connected clients
        this.wss.clients.forEach(client => {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(xml);
            }
        });
    }
    
    startTransformationEngine() {
        console.log('🔄 Starting XML transformation engine...');
        
        // Add default transformations
        this.xmlState.transformations.set('arena-to-rss', {
            name: 'Arena to RSS',
            transform: (xml) => this.transformArenaToRSS(xml)
        });
        
        this.xmlState.transformations.set('traps-to-atom', {
            name: 'Traps to Atom',
            transform: (xml) => this.transformTrapsToAtom(xml)
        });
        
        this.xmlState.transformations.set('builders-to-opml', {
            name: 'Builders to OPML',
            transform: (xml) => this.transformBuildersToOPML(xml)
        });
        
        this.xmlState.transformations.set('events-to-svg', {
            name: 'Events to SVG Timeline',
            transform: (xml) => this.transformEventsToSVG(xml)
        });
    }
    
    transformArenaToRSS(arenaXML) {
        // Transform arena state to RSS feed
        return {
            '?xml': { '@version': '1.0', '@encoding': 'UTF-8' },
            'rss': {
                '@version': '2.0',
                'channel': {
                    'title': 'Arena State Feed',
                    'link': `http://localhost:${this.xmlPort}/feeds/arena`,
                    'description': 'Current state of the Spectator Arena',
                    'lastBuildDate': new Date().toUTCString(),
                    'item': this.convertArenaToRSSItems(arenaXML)
                }
            }
        };
    }
    
    transformTrapsToAtom(trapsXML) {
        // Transform trap catalog to Atom feed
        return {
            '?xml': { '@version': '1.0', '@encoding': 'UTF-8' },
            'feed': {
                '@xmlns': 'http://www.w3.org/2005/Atom',
                'title': 'Trap Catalog Feed',
                'link': {
                    '@href': `http://localhost:${this.xmlPort}/feeds/traps`,
                    '@rel': 'self'
                },
                'updated': new Date().toISOString(),
                'author': {
                    'name': 'Arena System'
                },
                'entry': this.convertTrapsToAtomEntries(trapsXML)
            }
        };
    }
    
    transformBuildersToOPML(buildersXML) {
        // Transform builders to OPML outline
        return {
            '?xml': { '@version': '1.0', '@encoding': 'UTF-8' },
            'opml': {
                '@version': '2.0',
                'head': {
                    'title': 'Arena Builders Outline',
                    'dateCreated': new Date().toUTCString()
                },
                'body': {
                    'outline': this.convertBuildersToOutline(buildersXML)
                }
            }
        };
    }
    
    transformEventsToSVG(eventsXML) {
        // Transform events to SVG timeline visualization
        const events = eventsXML.rss?.channel?.item || [];
        const width = 1000;
        const height = 600;
        const padding = 50;
        
        return {
            '?xml': { '@version': '1.0', '@encoding': 'UTF-8' },
            'svg': {
                '@xmlns': 'http://www.w3.org/2000/svg',
                '@width': width,
                '@height': height,
                '@viewBox': `0 0 ${width} ${height}`,
                'rect': {
                    '@x': 0,
                    '@y': 0,
                    '@width': width,
                    '@height': height,
                    '@fill': '#000000'
                },
                'text': {
                    '@x': width / 2,
                    '@y': 30,
                    '@text-anchor': 'middle',
                    '@fill': '#FFFFFF',
                    '@font-size': 24,
                    '#text': 'Arena Event Timeline'
                },
                'g': this.createEventTimelineSVG(events, width, height, padding)
            }
        };
    }
    
    createEventTimelineSVG(events, width, height, padding) {
        const timelineY = height / 2;
        const timelineWidth = width - (2 * padding);
        
        return {
            // Timeline line
            'line': {
                '@x1': padding,
                '@y1': timelineY,
                '@x2': width - padding,
                '@y2': timelineY,
                '@stroke': '#FFFFFF',
                '@stroke-width': 2
            },
            // Event markers
            'circle': events.slice(0, 10).map((event, index) => ({
                '@cx': padding + (index * (timelineWidth / 10)),
                '@cy': timelineY,
                '@r': 8,
                '@fill': this.getEventColor(event['arena:eventType']),
                '@opacity': 0.8
            })),
            // Event labels
            'text': events.slice(0, 10).map((event, index) => ({
                '@x': padding + (index * (timelineWidth / 10)),
                '@y': timelineY - 20,
                '@text-anchor': 'middle',
                '@fill': '#FFFFFF',
                '@font-size': 10,
                '#text': event.title?.substring(0, 20) || 'Event'
            }))
        };
    }
    
    getEventColor(eventType) {
        const colors = {
            'trap_completed': '#00FF00',
            'mime_performance': '#FF00FF',
            'builder_interaction': '#00FFFF',
            'random_event': '#FFFF00'
        };
        return colors[eventType] || '#FFFFFF';
    }
    
    initializeRPCEndpoints() {
        console.log('🔄 Initializing XML-RPC endpoints...');
        
        // Register RPC methods
        this.xmlState.rpcEndpoints.set('arena.getBuilders', {
            description: 'Get current builders in the arena',
            params: [],
            handler: () => this.getBuilders()
        });
        
        this.xmlState.rpcEndpoints.set('arena.getTraps', {
            description: 'Get all traps in the catalog',
            params: ['limit?'],
            handler: (limit) => this.getTraps(limit)
        });
        
        this.xmlState.rpcEndpoints.set('arena.subscribeToEvents', {
            description: 'Subscribe to arena events',
            params: ['callbackUrl', 'eventTypes[]'],
            handler: (url, types) => this.subscribeToEvents(url, types)
        });
        
        this.xmlState.rpcEndpoints.set('arena.transformFeed', {
            description: 'Transform a feed using specified transformation',
            params: ['feedName', 'transformationType'],
            handler: (feed, transform) => this.transformFeed(feed, transform)
        });
    }
    
    applyTransformations(message) {
        // Apply registered transformations to incoming messages
        for (const [name, transformation] of this.xmlState.transformations) {
            try {
                const transformed = transformation.transform(message);
                
                // Notify transformation subscribers
                this.notifyTransformationSubscribers(name, transformed);
            } catch (error) {
                console.error(`Transformation ${name} failed:`, error);
            }
        }
    }
    
    notifyTransformationSubscribers(transformationName, result) {
        // WebHook-style notifications for transformation results
        const subscribers = this.xmlState.subscribers.get(transformationName) || [];
        
        for (const subscriber of subscribers) {
            // POST XML result to subscriber
            this.postXMLToSubscriber(subscriber, result);
        }
    }
    
    postXMLToSubscriber(url, xmlData) {
        // Implement webhook POST of XML data
        const xml = this.xmlBuilder.build(xmlData);
        
        // Would implement actual HTTP POST here
        console.log(`📮 Would POST XML to ${url}:`, xml.substring(0, 100) + '...');
    }
    
    getXMLInterfaceHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🗺️ XML Arena Mapping System</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: #1a1a1a;
            color: #e0e0e0;
            font-family: 'Courier New', monospace;
        }
        
        .header {
            background: linear-gradient(45deg, #2a2a2a, #3a3a3a);
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            border: 1px solid #444;
        }
        
        .header h1 {
            margin: 0;
            color: #00ff00;
            text-shadow: 0 0 10px #00ff00;
        }
        
        .feeds-section {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            border: 1px solid #444;
        }
        
        .feed-link {
            display: inline-block;
            background: #333;
            color: #00ff00;
            padding: 10px 20px;
            margin: 5px;
            text-decoration: none;
            border-radius: 5px;
            border: 1px solid #00ff00;
            transition: all 0.3s;
        }
        
        .feed-link:hover {
            background: #00ff00;
            color: #000;
            transform: translateY(-2px);
        }
        
        .xml-viewer {
            background: #000;
            border: 1px solid #444;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            height: 400px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
        }
        
        .transformation-section {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            border: 1px solid #444;
        }
        
        .transform-button {
            background: #ff6600;
            color: white;
            border: none;
            padding: 10px 20px;
            margin: 5px;
            cursor: pointer;
            border-radius: 5px;
            transition: all 0.3s;
        }
        
        .transform-button:hover {
            background: #ff8833;
            transform: translateY(-2px);
        }
        
        .rpc-section {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #444;
        }
        
        .rpc-method {
            background: #333;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            border: 1px solid #666;
        }
        
        .websocket-status {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2a2a2a;
            padding: 10px 20px;
            border-radius: 20px;
            border: 1px solid #444;
        }
        
        .connected {
            color: #00ff00;
        }
        
        .disconnected {
            color: #ff0000;
        }
        
        .schema-section {
            background: #2a2a2a;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            border: 1px solid #444;
        }
        
        pre {
            margin: 0;
            color: #00ff00;
        }
        
        .control-panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #2a2a2a;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #444;
        }
    </style>
</head>
<body>
    <div class="websocket-status">
        <span id="ws-status" class="disconnected">⚫ Disconnected</span>
    </div>
    
    <div class="header">
        <h1>🗺️ XML Arena Mapping System</h1>
        <p>Real-time XML transformation and mapping of the Spectator Arena Trap Theater</p>
    </div>
    
    <div class="feeds-section">
        <h2>📡 Live XML Feeds</h2>
        <a href="/feeds/arena" class="feed-link" target="_blank">Arena State</a>
        <a href="/feeds/builders" class="feed-link" target="_blank">Builders Activity</a>
        <a href="/feeds/traps" class="feed-link" target="_blank">Trap Catalog</a>
        <a href="/feeds/events" class="feed-link" target="_blank">Event Stream (RSS)</a>
        <a href="/feeds/all" class="feed-link" target="_blank">Combined Feed</a>
    </div>
    
    <div class="xml-viewer" id="xml-viewer">
        <pre id="xml-content">Connecting to arena...</pre>
    </div>
    
    <div class="transformation-section">
        <h2>🔄 XML Transformations</h2>
        <button class="transform-button" onclick="applyTransform('arena-to-rss')">Arena → RSS</button>
        <button class="transform-button" onclick="applyTransform('traps-to-atom')">Traps → Atom</button>
        <button class="transform-button" onclick="applyTransform('builders-to-opml')">Builders → OPML</button>
        <button class="transform-button" onclick="applyTransform('events-to-svg')">Events → SVG Timeline</button>
    </div>
    
    <div class="schema-section">
        <h2>📋 XML Schemas</h2>
        <a href="/schema/arena" class="feed-link" target="_blank">Arena Schema (XSD)</a>
        <a href="/schema/trap" class="feed-link" target="_blank">Trap Schema (XSD)</a>
        <a href="/schema/builder" class="feed-link" target="_blank">Builder Schema (XSD)</a>
        <a href="/schema/event" class="feed-link" target="_blank">Event Schema (XSD)</a>
    </div>
    
    <div class="rpc-section">
        <h2>🔧 XML-RPC Methods</h2>
        <div class="rpc-method">
            <strong>arena.getBuilders()</strong> - Get current builders in the arena
        </div>
        <div class="rpc-method">
            <strong>arena.getTraps(limit)</strong> - Get traps from the catalog
        </div>
        <div class="rpc-method">
            <strong>arena.getEvents(limit)</strong> - Get recent events
        </div>
        <div class="rpc-method">
            <strong>arena.subscribeToFeed(feedName, callbackUrl)</strong> - Subscribe to updates
        </div>
    </div>
    
    <div class="control-panel">
        <h3>🎮 Controls</h3>
        <button onclick="toggleAutoRefresh()">Toggle Auto-Refresh</button>
        <button onclick="clearDisplay()">Clear Display</button>
        <button onclick="downloadXML()">Download Current XML</button>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        let autoRefresh = true;
        let currentXML = '';
        
        ws.onopen = () => {
            document.getElementById('ws-status').textContent = '🟢 Connected';
            document.getElementById('ws-status').className = 'connected';
        };
        
        ws.onclose = () => {
            document.getElementById('ws-status').textContent = '⚫ Disconnected';
            document.getElementById('ws-status').className = 'disconnected';
        };
        
        ws.onmessage = (event) => {
            if (autoRefresh) {
                currentXML = event.data;
                updateXMLDisplay(event.data);
            }
        };
        
        function updateXMLDisplay(xml) {
            const viewer = document.getElementById('xml-content');
            
            // Pretty print XML with syntax highlighting
            const formatted = xml
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/(&lt;\\/?)(\\w+)/g, '$1<span style="color: #ff6600;">$2</span>')
                .replace(/(\\w+)(=)/g, '<span style="color: #00ccff;">$1</span>$2')
                .replace(/("[^"]*")/g, '<span style="color: #00ff00;">$1</span>');
            
            viewer.innerHTML = formatted;
        }
        
        async function applyTransform(transformType) {
            ws.send(JSON.stringify({
                transform: transformType
            }));
        }
        
        function toggleAutoRefresh() {
            autoRefresh = !autoRefresh;
            console.log('Auto-refresh:', autoRefresh);
        }
        
        function clearDisplay() {
            document.getElementById('xml-content').textContent = 'Cleared. Waiting for updates...';
        }
        
        function downloadXML() {
            const blob = new Blob([currentXML], { type: 'application/xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'arena-state.xml';
            a.click();
            URL.revokeObjectURL(url);
        }
        
        // Load initial arena feed
        fetch('/feeds/arena')
            .then(response => response.text())
            .then(xml => updateXMLDisplay(xml));
    </script>
</body>
</html>`;
    }
}

// Start if run directly
if (require.main === module) {
    const xmlMapper = new XMLArenaMappingSystem();
    
    xmlMapper.initialize().then(() => {
        console.log('\\n🗺️ XML mapping system ready!');
        console.log('📡 Connected to arena theater and mapping all activities to XML');
    }).catch(error => {
        console.error('❌ XML mapper initialization failed:', error);
        process.exit(1);
    });
}

module.exports = XMLArenaMappingSystem;