#!/usr/bin/env node
/**
 * Socket-First Document Generator Server
 * 
 * Simple WebSocket server for the Document Generator platform
 * Focus: Real-time document processing and collaboration
 */

const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

class DocumentGeneratorSocketServer {
    constructor(options = {}) {
        this.config = {
            httpPort: options.httpPort || 8080,
            wsPort: options.wsPort || 8081,
            host: options.host || 'localhost',
            enableCORS: options.enableCORS !== false
        };
        
        this.clients = new Map();
        this.rooms = new Map();
        this.documents = new Map();
        
        this.init();
    }
    
    init() {
        this.createHTTPServer();
        this.createWebSocketServer();
        this.setupShutdownHandlers();
        
        console.log('🚀 Document Generator Socket Server');
        console.log('=====================================');
        console.log(`📡 WebSocket: ws://${this.config.host}:${this.config.wsPort}`);
        console.log(`🌐 HTTP: http://${this.config.host}:${this.config.httpPort}`);
        console.log('');
    }
    
    createHTTPServer() {
        this.httpServer = http.createServer((req, res) => {
            this.handleHTTPRequest(req, res);
        });
        
        this.httpServer.listen(this.config.httpPort, this.config.host, () => {
            console.log(`🌐 HTTP Server running on port ${this.config.httpPort}`);
        });
    }
    
    createWebSocketServer() {
        this.wss = new WebSocket.Server({ 
            port: this.config.wsPort,
            host: this.config.host,
            clientTracking: true
        });
        
        this.wss.on('connection', (ws, req) => {
            this.handleConnection(ws, req);
        });
        
        console.log(`📡 WebSocket Server running on port ${this.config.wsPort}`);
    }
    
    handleHTTPRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        
        // Enable CORS
        if (this.config.enableCORS) {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        }
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        // Route requests
        switch (pathname) {
            case '/':
                this.serveFile(res, 'socket-landing.html');
                break;
            case '/status':
                this.serveStatus(res);
                break;
            case '/api/documents':
                this.serveDocumentsList(res);
                break;
            case '/api/rooms':
                this.serveRoomsList(res);
                break;
            default:
                // Try to serve static file
                this.serveStaticFile(res, pathname);
                break;
        }
    }
    
    serveFile(res, filename) {
        const filePath = path.join(__dirname, filename);
        
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const ext = path.extname(filename);
            const contentType = this.getContentType(ext);
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        } else {
            this.serve404(res);
        }
    }
    
    serveStaticFile(res, pathname) {
        // Remove leading slash
        const filename = pathname.slice(1);
        const filePath = path.join(__dirname, filename);
        
        // Security check - prevent directory traversal
        if (!filePath.startsWith(__dirname)) {
            this.serve404(res);
            return;
        }
        
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const content = fs.readFileSync(filePath);
            const ext = path.extname(filename);
            const contentType = this.getContentType(ext);
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        } else {
            this.serve404(res);
        }
    }
    
    serveStatus(res) {
        const status = {
            server: 'Document Generator Socket Server',
            version: '1.0.0',
            uptime: process.uptime(),
            connections: this.clients.size,
            rooms: this.rooms.size,
            documents: this.documents.size,
            timestamp: new Date().toISOString(),
            endpoints: {
                websocket: `ws://${this.config.host}:${this.config.wsPort}`,
                http: `http://${this.config.host}:${this.config.httpPort}`
            }
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status, null, 2));
    }
    
    serveDocumentsList(res) {
        const documents = Array.from(this.documents.values()).map(doc => ({
            id: doc.id,
            name: doc.name,
            type: doc.type,
            created: doc.created,
            modified: doc.modified,
            collaborators: doc.collaborators?.length || 0
        }));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ documents }));
    }
    
    serveRoomsList(res) {
        const rooms = Array.from(this.rooms.values()).map(room => ({
            id: room.id,
            name: room.name,
            participants: room.participants?.length || 0,
            created: room.created
        }));
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ rooms }));
    }
    
    serve404(res) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
            <html>
                <head><title>404 - Not Found</title></head>
                <body style="font-family: Arial; background: #1a1a1a; color: #fff; text-align: center; padding: 50px;">
                    <h1 style="color: #4ecca3;">🔍 Page Not Found</h1>
                    <p>The requested resource was not found on this server.</p>
                    <a href="/" style="color: #4ecca3;">← Back to Document Generator</a>
                </body>
            </html>
        `);
    }
    
    getContentType(ext) {
        const types = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
        };
        
        return types[ext] || 'text/plain';
    }
    
    handleConnection(ws, req) {
        const clientId = this.generateClientId();
        const clientInfo = {
            id: clientId,
            socket: ws,
            ip: req.socket.remoteAddress,
            userAgent: req.headers['user-agent'],
            connected: new Date().toISOString(),
            room: null,
            lastActivity: Date.now()
        };
        
        this.clients.set(clientId, clientInfo);
        
        console.log(`📡 Client connected: ${clientId} (${clientInfo.ip})`);
        console.log(`👥 Total connections: ${this.clients.size}`);
        
        // Send welcome message
        this.sendToClient(clientId, {
            type: 'welcome',
            clientId: clientId,
            message: 'Connected to Document Generator',
            server: 'Document Generator Socket Server v1.0.0',
            features: {
                documentProcessing: true,
                realTimeCollaboration: true,
                liveDemonstrations: true,
                progressiveFeatures: true
            },
            timestamp: new Date().toISOString()
        });
        
        // Set up message handler
        ws.on('message', (data) => {
            this.handleMessage(clientId, data);
        });
        
        // Set up close handler
        ws.on('close', (code, reason) => {
            this.handleDisconnection(clientId, code, reason);
        });
        
        // Set up error handler
        ws.on('error', (error) => {
            console.error(`❌ Client ${clientId} error:`, error);
        });
        
        // Set up ping/pong for connection health
        this.setupPingPong(clientId);
    }
    
    handleMessage(clientId, rawData) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        client.lastActivity = Date.now();
        
        try {
            const data = JSON.parse(rawData.toString());
            console.log(`📨 ${clientId}: ${data.type || 'unknown'}`);
            
            switch (data.type) {
                case 'client_connect':
                    this.handleClientConnect(clientId, data);
                    break;
                case 'enter_platform':
                    this.handleEnterPlatform(clientId, data);
                    break;
                case 'join_room':
                    this.handleJoinRoom(clientId, data);
                    break;
                case 'leave_room':
                    this.handleLeaveRoom(clientId, data);
                    break;
                case 'document_upload':
                    this.handleDocumentUpload(clientId, data);
                    break;
                case 'document_process':
                    this.handleDocumentProcess(clientId, data);
                    break;
                case 'collaboration_update':
                    this.handleCollaborationUpdate(clientId, data);
                    break;
                case 'demo_request':
                    this.handleDemoRequest(clientId, data);
                    break;
                case 'ping':
                    this.sendToClient(clientId, { type: 'pong', timestamp: new Date().toISOString() });
                    break;
                default:
                    console.log(`❓ Unknown message type: ${data.type}`);
                    this.sendToClient(clientId, {
                        type: 'error',
                        message: `Unknown message type: ${data.type}`,
                        timestamp: new Date().toISOString()
                    });
            }
        } catch (error) {
            console.error(`❌ Error parsing message from ${clientId}:`, error);
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Invalid message format',
                timestamp: new Date().toISOString()
            });
        }
    }
    
    handleClientConnect(clientId, data) {
        const client = this.clients.get(clientId);
        if (client) {
            client.clientType = data.clientType || 'unknown';
            console.log(`🎯 Client ${clientId} identified as: ${client.clientType}`);
        }
    }
    
    handleEnterPlatform(clientId, data) {
        console.log(`🎯 Client ${clientId} entering platform`);
        
        this.sendToClient(clientId, {
            type: 'platform_redirect',
            url: './unified-demo-hub.html',
            message: 'Redirecting to Document Generator platform',
            timestamp: new Date().toISOString()
        });
    }
    
    handleJoinRoom(clientId, data) {
        const roomId = data.roomId || this.generateRoomId();
        const client = this.clients.get(clientId);
        
        if (!client) return;
        
        // Leave current room if in one
        if (client.room) {
            this.handleLeaveRoom(clientId, { roomId: client.room });
        }
        
        // Create room if it doesn't exist
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                id: roomId,
                name: data.roomName || `Room ${roomId}`,
                participants: [],
                created: new Date().toISOString(),
                documents: []
            });
        }
        
        const room = this.rooms.get(roomId);
        room.participants.push(clientId);
        client.room = roomId;
        
        console.log(`🏠 Client ${clientId} joined room ${roomId}`);
        
        this.sendToClient(clientId, {
            type: 'room_joined',
            roomId: roomId,
            roomName: room.name,
            participants: room.participants.length,
            timestamp: new Date().toISOString()
        });
        
        // Notify other room participants
        this.broadcastToRoom(roomId, {
            type: 'participant_joined',
            clientId: clientId,
            participants: room.participants.length,
            timestamp: new Date().toISOString()
        }, clientId);
    }
    
    handleLeaveRoom(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client || !client.room) return;
        
        const roomId = client.room;
        const room = this.rooms.get(roomId);
        
        if (room) {
            room.participants = room.participants.filter(id => id !== clientId);
            
            console.log(`🚪 Client ${clientId} left room ${roomId}`);
            
            // Notify other room participants
            this.broadcastToRoom(roomId, {
                type: 'participant_left',
                clientId: clientId,
                participants: room.participants.length,
                timestamp: new Date().toISOString()
            });
            
            // Clean up empty room
            if (room.participants.length === 0) {
                this.rooms.delete(roomId);
                console.log(`🗑️ Room ${roomId} deleted (empty)`);
            }
        }
        
        client.room = null;
    }
    
    handleDocumentUpload(clientId, data) {
        const documentId = this.generateDocumentId();
        const document = {
            id: documentId,
            name: data.filename || 'Untitled Document',
            type: data.type || 'unknown',
            content: data.content || '',
            uploadedBy: clientId,
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            collaborators: [clientId]
        };
        
        this.documents.set(documentId, document);
        
        console.log(`📄 Document uploaded: ${document.name} (${documentId})`);
        
        this.sendToClient(clientId, {
            type: 'document_uploaded',
            documentId: documentId,
            document: {
                id: document.id,
                name: document.name,
                type: document.type,
                created: document.created
            },
            timestamp: new Date().toISOString()
        });
        
        // If in a room, notify other participants
        const client = this.clients.get(clientId);
        if (client && client.room) {
            this.broadcastToRoom(client.room, {
                type: 'document_shared',
                documentId: documentId,
                document: {
                    id: document.id,
                    name: document.name,
                    type: document.type,
                    uploadedBy: clientId
                },
                timestamp: new Date().toISOString()
            }, clientId);
        }
    }
    
    handleDocumentProcess(clientId, data) {
        const documentId = data.documentId;
        const document = this.documents.get(documentId);
        
        if (!document) {
            this.sendToClient(clientId, {
                type: 'error',
                message: 'Document not found',
                timestamp: new Date().toISOString()
            });
            return;
        }
        
        console.log(`⚡ Processing document: ${document.name} (${documentId})`);
        
        // Simulate document processing
        this.sendToClient(clientId, {
            type: 'document_processing',
            documentId: documentId,
            status: 'processing',
            progress: 0,
            timestamp: new Date().toISOString()
        });
        
        // Simulate processing progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
                progress = 100;
                clearInterval(progressInterval);
                
                // Complete processing
                document.processed = true;
                document.modified = new Date().toISOString();
                
                this.sendToClient(clientId, {
                    type: 'document_processed',
                    documentId: documentId,
                    result: {
                        success: true,
                        outputFiles: ['output.html', 'styles.css', 'script.js'],
                        summary: 'Document successfully transformed into working solution'
                    },
                    timestamp: new Date().toISOString()
                });
            } else {
                this.sendToClient(clientId, {
                    type: 'document_processing',
                    documentId: documentId,
                    status: 'processing',
                    progress: Math.round(progress),
                    timestamp: new Date().toISOString()
                });
            }
        }, 500);
    }
    
    handleCollaborationUpdate(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client || !client.room) return;
        
        console.log(`🤝 Collaboration update from ${clientId} in room ${client.room}`);
        
        // Broadcast update to room participants
        this.broadcastToRoom(client.room, {
            type: 'collaboration_update',
            from: clientId,
            data: data.data,
            timestamp: new Date().toISOString()
        }, clientId);
    }
    
    handleDemoRequest(clientId, data) {
        console.log(`🎬 Demo request from ${clientId}: ${data.demoType || 'unknown'}`);
        
        this.sendToClient(clientId, {
            type: 'demo_started',
            demoType: data.demoType,
            demoUrl: './unified-demo-hub.html',
            message: 'Demo environment ready',
            timestamp: new Date().toISOString()
        });
    }
    
    handleDisconnection(clientId, code, reason) {
        const client = this.clients.get(clientId);
        
        if (client) {
            console.log(`📡 Client disconnected: ${clientId} (${code}: ${reason})`);
            
            // Leave room if in one
            if (client.room) {
                this.handleLeaveRoom(clientId, { roomId: client.room });
            }
            
            // Clear ping interval
            if (client.pingInterval) {
                clearInterval(client.pingInterval);
            }
            
            this.clients.delete(clientId);
            console.log(`👥 Total connections: ${this.clients.size}`);
        }
    }
    
    setupPingPong(clientId) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        client.pingInterval = setInterval(() => {
            if (client.socket.readyState === WebSocket.OPEN) {
                client.socket.ping();
            }
        }, 30000); // Ping every 30 seconds
        
        client.socket.on('pong', () => {
            client.lastActivity = Date.now();
        });
    }
    
    sendToClient(clientId, data) {
        const client = this.clients.get(clientId);
        if (client && client.socket.readyState === WebSocket.OPEN) {
            client.socket.send(JSON.stringify(data));
        }
    }
    
    broadcastToRoom(roomId, data, excludeClientId = null) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        room.participants.forEach(clientId => {
            if (clientId !== excludeClientId) {
                this.sendToClient(clientId, data);
            }
        });
    }
    
    broadcast(data, excludeClientId = null) {
        this.clients.forEach((client, clientId) => {
            if (clientId !== excludeClientId) {
                this.sendToClient(clientId, data);
            }
        });
    }
    
    generateClientId() {
        return 'client_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateRoomId() {
        return 'room_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateDocumentId() {
        return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    setupShutdownHandlers() {
        const shutdown = () => {
            console.log('\n🛑 Shutting down Document Generator Socket Server...');
            
            // Close all client connections
            this.clients.forEach((client, clientId) => {
                this.sendToClient(clientId, {
                    type: 'server_shutdown',
                    message: 'Server is shutting down',
                    timestamp: new Date().toISOString()
                });
                client.socket.close();
            });
            
            // Close servers
            this.wss.close(() => {
                console.log('📡 WebSocket server closed');
            });
            
            this.httpServer.close(() => {
                console.log('🌐 HTTP server closed');
                process.exit(0);
            });
        };
        
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
    }
}

// Auto-run if called directly
if (require.main === module) {
    const server = new DocumentGeneratorSocketServer({
        httpPort: process.env.HTTP_PORT || 8080,
        wsPort: process.env.WS_PORT || 8081,
        host: process.env.HOST || 'localhost'
    });
}

module.exports = DocumentGeneratorSocketServer;