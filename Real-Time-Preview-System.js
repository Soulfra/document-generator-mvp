#!/usr/bin/env node

/**
 * 🔴⚡ REAL-TIME PREVIEW SYSTEM
 * 
 * Live platform generation with WebSocket streaming, real-time progress updates,
 * preview synchronization, and collaborative editing capabilities.
 * Integrates with all platform generation components for seamless user experience.
 * 
 * The real-time backbone connecting users to live platform creation.
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const crypto = require('crypto');

console.log(`
🔴⚡ REAL-TIME PREVIEW SYSTEM 🔴⚡
=================================
WebSocket Streaming | Live Updates | Collaborative Editing
Real-time Platform Generation and Preview Synchronization
`);

class RealTimePreviewSystem extends EventEmitter {
    constructor(port = 8081) {
        super();
        
        this.config = {
            // WebSocket server configuration
            websocket: {
                port: port,
                maxConnections: 1000,
                heartbeatInterval: 30000, // 30 seconds
                messageRateLimit: 100,    // messages per minute
                maxMessageSize: 1048576   // 1MB max message size
            },
            
            // Preview generation settings
            preview: {
                updateInterval: 500,      // 500ms minimum between updates
                maxPreviewSize: 5242880,  // 5MB max preview size
                supportedFormats: ['html', 'json', 'image', 'video'],
                compressionLevel: 6,
                cacheSize: 100            // Number of previews to cache
            },
            
            // Collaboration settings
            collaboration: {
                maxCollaborators: 10,
                lockTimeout: 300000,      // 5 minutes
                conflictResolution: 'last_write_wins',
                versionHistory: 20        // Keep 20 versions
            },
            
            // Streaming configuration
            streaming: {
                chunkSize: 8192,          // 8KB chunks
                maxStreamDuration: 300000, // 5 minutes max stream
                compressionEnabled: true,
                bufferSize: 16384         // 16KB buffer
            },
            
            // Security settings
            security: {
                rateLimitWindow: 60000,   // 1 minute
                maxRequestsPerWindow: 100,
                requireAuth: false,       // Set to true in production
                allowedOrigins: ['*']     // Configure for production
            }
        };
        
        // System state
        this.state = {
            // Active WebSocket connections
            connections: new Map(),      // connectionId -> connection data
            
            // Active preview sessions
            sessions: new Map(),         // sessionId -> session data
            
            // Real-time collaboration rooms
            rooms: new Map(),            // roomId -> room data
            
            // Preview cache
            previewCache: new Map(),     // previewId -> preview data
            
            // Streaming operations
            activeStreams: new Map(),    // streamId -> stream data
            
            // Rate limiting
            rateLimits: new Map(),       // connectionId -> rate limit data
            
            // System metrics
            metrics: {
                totalConnections: 0,
                activeConnections: 0,
                messagesProcessed: 0,
                previewsGenerated: 0,
                errorCount: 0,
                avgResponseTime: 0
            }
        };
        
        // WebSocket server
        this.wsServer = null;
        
        // Preview generation queue
        this.previewQueue = [];
        this.isProcessingQueue = false;
        
        // Heartbeat interval
        this.heartbeatInterval = null;
        
        console.log('🔴 Real-Time Preview System initialized');
        console.log(`📡 WebSocket port: ${port}`);
        console.log(`👥 Max connections: ${this.config.websocket.maxConnections}`);
        console.log(`⚡ Update interval: ${this.config.preview.updateInterval}ms`);
        
        this.initialize();
    }
    
    /**
     * Initialize the real-time preview system
     */
    async initialize() {
        try {
            // Start WebSocket server
            await this.startWebSocketServer();
            
            // Start preview processing queue
            this.startPreviewQueue();
            
            // Start heartbeat monitoring
            this.startHeartbeat();
            
            // Start metrics collection
            this.startMetricsCollection();
            
            console.log('✅ Real-Time Preview System started successfully');
            this.emit('system_started');
            
        } catch (error) {
            console.error('❌ Failed to initialize Real-Time Preview System:', error.message);
            this.emit('system_error', error);
        }
    }
    
    /**
     * Start WebSocket server
     */
    async startWebSocketServer() {
        this.wsServer = new WebSocket.Server({
            port: this.config.websocket.port,
            maxPayload: this.config.websocket.maxMessageSize,
            perMessageDeflate: {
                zlibDeflateOptions: {
                    chunkSize: this.config.streaming.chunkSize,
                    windowBits: 14,
                    level: this.config.preview.compressionLevel
                },
                threshold: 1024,
                concurrencyLimit: 10
            }
        });
        
        this.wsServer.on('connection', (ws, request) => {
            this.handleNewConnection(ws, request);
        });
        
        this.wsServer.on('error', (error) => {
            console.error('❌ WebSocket server error:', error.message);
            this.emit('server_error', error);
        });
        
        console.log(`📡 WebSocket server listening on port ${this.config.websocket.port}`);
    }
    
    /**
     * Handle new WebSocket connection
     */
    handleNewConnection(ws, request) {
        // Generate unique connection ID
        const connectionId = crypto.randomUUID();
        
        // Extract client information
        const clientInfo = this.extractClientInfo(request);
        
        // Check connection limits
        if (this.state.connections.size >= this.config.websocket.maxConnections) {
            console.warn(`🚫 Connection limit reached, rejecting ${connectionId}`);
            ws.close(1013, 'Server overloaded');
            return;
        }
        
        // Create connection data
        const connection = {
            id: connectionId,
            ws: ws,
            clientInfo: clientInfo,
            connected: Date.now(),
            lastActivity: Date.now(),
            sessionId: null,
            roomId: null,
            isAlive: true,
            messageCount: 0,
            rateLimitData: {
                requests: 0,
                windowStart: Date.now()
            }
        };
        
        // Store connection
        this.state.connections.set(connectionId, connection);
        this.state.metrics.totalConnections++;
        this.state.metrics.activeConnections++;
        
        console.log(`🔌 New connection: ${connectionId} (${clientInfo.ip})`);
        
        // Set up event handlers
        this.setupConnectionHandlers(connection);
        
        // Send welcome message
        this.sendMessage(connection, {
            type: 'welcome',
            connectionId: connectionId,
            timestamp: Date.now(),
            capabilities: {
                realTimePreview: true,
                collaboration: true,
                streaming: true,
                formats: this.config.preview.supportedFormats
            }
        });
        
        this.emit('connection_established', connection);
    }
    
    /**
     * Set up connection event handlers
     */
    setupConnectionHandlers(connection) {
        const ws = connection.ws;
        
        // Handle incoming messages
        ws.on('message', (data) => {
            this.handleMessage(connection, data);
        });
        
        // Handle connection close
        ws.on('close', (code, reason) => {
            this.handleConnectionClose(connection, code, reason);
        });
        
        // Handle connection errors
        ws.on('error', (error) => {
            this.handleConnectionError(connection, error);
        });
        
        // Handle pong responses (for heartbeat)
        ws.on('pong', () => {
            connection.isAlive = true;
            connection.lastActivity = Date.now();
        });
    }
    
    /**
     * Handle incoming WebSocket messages
     */
    async handleMessage(connection, data) {
        try {
            connection.lastActivity = Date.now();
            connection.messageCount++;
            this.state.metrics.messagesProcessed++;
            
            // Check rate limiting
            if (!this.checkRateLimit(connection)) {
                this.sendError(connection, 'Rate limit exceeded', 429);
                return;
            }
            
            // Parse message
            let message;
            try {
                message = JSON.parse(data.toString());
            } catch (parseError) {
                this.sendError(connection, 'Invalid JSON message', 400);
                return;
            }
            
            // Validate message structure
            if (!message.type) {
                this.sendError(connection, 'Message must have a type', 400);
                return;
            }
            
            console.log(`📨 Message received: ${message.type} from ${connection.id}`);
            
            // Route message based on type
            const startTime = Date.now();
            await this.routeMessage(connection, message);
            const responseTime = Date.now() - startTime;
            
            // Update average response time
            this.updateAverageResponseTime(responseTime);
            
        } catch (error) {
            console.error(`❌ Error handling message from ${connection.id}:`, error.message);
            this.sendError(connection, 'Internal server error', 500);
            this.state.metrics.errorCount++;
        }
    }
    
    /**
     * Route messages to appropriate handlers
     */
    async routeMessage(connection, message) {
        switch (message.type) {
            case 'start_preview_session':
                await this.handleStartPreviewSession(connection, message);
                break;
                
            case 'update_platform_config':
                await this.handleUpdatePlatformConfig(connection, message);
                break;
                
            case 'request_preview':
                await this.handleRequestPreview(connection, message);
                break;
                
            case 'join_collaboration_room':
                await this.handleJoinCollaborationRoom(connection, message);
                break;
                
            case 'leave_collaboration_room':
                await this.handleLeaveCollaborationRoom(connection, message);
                break;
                
            case 'collaborative_edit':
                await this.handleCollaborativeEdit(connection, message);
                break;
                
            case 'start_stream':
                await this.handleStartStream(connection, message);
                break;
                
            case 'stop_stream':
                await this.handleStopStream(connection, message);
                break;
                
            case 'ping':
                this.sendMessage(connection, { type: 'pong', timestamp: Date.now() });
                break;
                
            case 'get_system_status':
                await this.handleGetSystemStatus(connection, message);
                break;
                
            default:
                this.sendError(connection, `Unknown message type: ${message.type}`, 400);
        }
    }
    
    /**
     * Handle start preview session
     */
    async handleStartPreviewSession(connection, message) {
        const sessionId = crypto.randomUUID();
        
        const session = {
            id: sessionId,
            connectionId: connection.id,
            platformConfig: message.platformConfig || {},
            created: Date.now(),
            lastUpdate: Date.now(),
            status: 'active',
            previewHistory: [],
            collaborators: [connection.id]
        };
        
        // Store session
        this.state.sessions.set(sessionId, session);
        connection.sessionId = sessionId;
        
        // Send response
        this.sendMessage(connection, {
            type: 'preview_session_started',
            sessionId: sessionId,
            timestamp: Date.now()
        });
        
        // Generate initial preview
        this.queuePreviewGeneration(session, 'initial');
        
        console.log(`🎬 Preview session started: ${sessionId}`);
        this.emit('preview_session_started', { connection, session });
    }
    
    /**
     * Handle platform configuration updates
     */
    async handleUpdatePlatformConfig(connection, message) {
        if (!connection.sessionId) {
            this.sendError(connection, 'No active preview session', 400);
            return;
        }
        
        const session = this.state.sessions.get(connection.sessionId);
        if (!session) {
            this.sendError(connection, 'Session not found', 404);
            return;
        }
        
        // Update platform configuration
        session.platformConfig = { ...session.platformConfig, ...message.config };
        session.lastUpdate = Date.now();
        
        // Send acknowledgment
        this.sendMessage(connection, {
            type: 'config_updated',
            sessionId: session.id,
            timestamp: Date.now()
        });
        
        // Broadcast to collaborators
        this.broadcastToSession(session, {
            type: 'config_changed',
            sessionId: session.id,
            config: message.config,
            changedBy: connection.id,
            timestamp: Date.now()
        }, [connection.id]);
        
        // Generate updated preview
        this.queuePreviewGeneration(session, 'config_update');
        
        console.log(`⚙️ Platform config updated for session ${session.id}`);
    }
    
    /**
     * Handle preview request
     */
    async handleRequestPreview(connection, message) {
        if (!connection.sessionId) {
            this.sendError(connection, 'No active preview session', 400);
            return;
        }
        
        const session = this.state.sessions.get(connection.sessionId);
        if (!session) {
            this.sendError(connection, 'Session not found', 404);
            return;
        }
        
        // Queue preview generation with specific format
        this.queuePreviewGeneration(session, 'user_request', {
            format: message.format || 'html',
            quality: message.quality || 'high',
            includeAssets: message.includeAssets !== false
        });
        
        this.sendMessage(connection, {
            type: 'preview_queued',
            sessionId: session.id,
            estimatedTime: this.estimatePreviewTime(session),
            timestamp: Date.now()
        });
    }
    
    /**
     * Handle joining collaboration room
     */
    async handleJoinCollaborationRoom(connection, message) {
        const roomId = message.roomId || crypto.randomUUID();
        
        let room = this.state.rooms.get(roomId);
        if (!room) {
            // Create new room
            room = {
                id: roomId,
                created: Date.now(),
                collaborators: new Map(),
                locks: new Map(),
                versionHistory: [],
                currentVersion: 0
            };
            this.state.rooms.set(roomId, room);
        }
        
        // Add collaborator to room
        room.collaborators.set(connection.id, {
            connectionId: connection.id,
            joined: Date.now(),
            cursor: null,
            permissions: message.permissions || ['read', 'write']
        });
        
        connection.roomId = roomId;
        
        // Send room info
        this.sendMessage(connection, {
            type: 'collaboration_room_joined',
            roomId: roomId,
            collaborators: Array.from(room.collaborators.keys()),
            currentVersion: room.currentVersion,
            timestamp: Date.now()
        });
        
        // Notify other collaborators
        this.broadcastToRoom(room, {
            type: 'collaborator_joined',
            roomId: roomId,
            collaboratorId: connection.id,
            timestamp: Date.now()
        }, [connection.id]);
        
        console.log(`👥 ${connection.id} joined collaboration room ${roomId}`);
    }
    
    /**
     * Handle collaborative editing
     */
    async handleCollaborativeEdit(connection, message) {
        if (!connection.roomId) {
            this.sendError(connection, 'Not in a collaboration room', 400);
            return;
        }
        
        const room = this.state.rooms.get(connection.roomId);
        if (!room) {
            this.sendError(connection, 'Room not found', 404);
            return;
        }
        
        // Check if the section is locked by another user
        const sectionLock = room.locks.get(message.section);
        if (sectionLock && sectionLock.userId !== connection.id) {
            this.sendError(connection, 'Section is locked by another user', 423);
            return;
        }
        
        // Apply edit
        const edit = {
            id: crypto.randomUUID(),
            userId: connection.id,
            section: message.section,
            operation: message.operation,
            data: message.data,
            timestamp: Date.now()
        };
        
        // Add to version history
        room.versionHistory.push(edit);
        room.currentVersion++;
        
        // Keep only recent versions
        if (room.versionHistory.length > this.config.collaboration.versionHistory) {
            room.versionHistory = room.versionHistory.slice(-this.config.collaboration.versionHistory);
        }
        
        // Broadcast edit to all collaborators
        this.broadcastToRoom(room, {
            type: 'collaborative_edit',
            roomId: room.id,
            edit: edit,
            version: room.currentVersion,
            timestamp: Date.now()
        }, [connection.id]);
        
        // Send confirmation to editor
        this.sendMessage(connection, {
            type: 'edit_applied',
            editId: edit.id,
            version: room.currentVersion,
            timestamp: Date.now()
        });
        
        console.log(`✏️ Collaborative edit applied in room ${room.id}`);
    }
    
    /**
     * Queue preview generation
     */
    queuePreviewGeneration(session, trigger, options = {}) {
        const previewRequest = {
            id: crypto.randomUUID(),
            sessionId: session.id,
            platformConfig: session.platformConfig,
            trigger: trigger,
            options: options,
            queued: Date.now(),
            priority: this.calculatePreviewPriority(trigger, options),
            retries: 0
        };
        
        // Insert into queue based on priority
        this.insertIntoQueue(previewRequest);
        
        // Process queue if not already processing
        if (!this.isProcessingQueue) {
            this.processPreviewQueue();
        }
        
        console.log(`📋 Preview queued: ${previewRequest.id} (${trigger})`);
    }
    
    /**
     * Process preview generation queue
     */
    async processPreviewQueue() {
        if (this.isProcessingQueue || this.previewQueue.length === 0) {
            return;
        }
        
        this.isProcessingQueue = true;
        
        while (this.previewQueue.length > 0) {
            const request = this.previewQueue.shift();
            
            try {
                console.log(`🔄 Processing preview: ${request.id}`);
                await this.generatePreview(request);
                
            } catch (error) {
                console.error(`❌ Preview generation failed: ${error.message}`);
                
                request.retries++;
                if (request.retries < 3) {
                    // Requeue with lower priority
                    request.priority -= 10;
                    this.insertIntoQueue(request);
                } else {
                    // Send error to session
                    this.sendPreviewError(request, error);
                }
            }
            
            // Small delay between processing
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        this.isProcessingQueue = false;
    }
    
    /**
     * Generate preview for a platform configuration
     */
    async generatePreview(request) {
        const session = this.state.sessions.get(request.sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        const startTime = Date.now();
        
        // Send preview generation started event
        this.broadcastToSession(session, {
            type: 'preview_generation_started',
            previewId: request.id,
            sessionId: session.id,
            estimatedTime: this.estimatePreviewTime(session),
            timestamp: startTime
        });
        
        // Simulate preview generation (in real implementation, this would call actual generation services)
        const preview = await this.simulatePreviewGeneration(request);
        
        const endTime = Date.now();
        const generationTime = endTime - startTime;
        
        // Cache preview
        this.cachePreview(request.id, preview);
        
        // Add to session history
        session.previewHistory.push({
            id: request.id,
            trigger: request.trigger,
            generated: endTime,
            generationTime: generationTime,
            size: preview.size
        });
        
        // Keep only recent previews in history
        if (session.previewHistory.length > 10) {
            session.previewHistory = session.previewHistory.slice(-10);
        }
        
        // Send preview to all session collaborators
        this.broadcastToSession(session, {
            type: 'preview_generated',
            previewId: request.id,
            sessionId: session.id,
            preview: preview,
            generationTime: generationTime,
            trigger: request.trigger,
            timestamp: endTime
        });
        
        this.state.metrics.previewsGenerated++;
        
        console.log(`✅ Preview generated: ${request.id} (${generationTime}ms)`);
        this.emit('preview_generated', { request, preview, generationTime });
    }
    
    /**
     * Simulate preview generation (replace with actual generation logic)
     */
    async simulatePreviewGeneration(request) {
        // Simulate generation time based on complexity
        const complexity = this.calculateComplexity(request.platformConfig);
        const baseTime = 1000 + (complexity * 500); // 1-3 seconds based on complexity
        const actualTime = baseTime + (Math.random() * 1000); // Add random variance
        
        await new Promise(resolve => setTimeout(resolve, actualTime));
        
        // Generate mock preview data
        const preview = {
            id: request.id,
            format: request.options.format || 'html',
            content: this.generateMockPreviewContent(request),
            assets: request.options.includeAssets ? this.generateMockAssets(request) : [],
            metadata: {
                platformType: request.platformConfig.type || 'webapp',
                theme: request.platformConfig.theme || 'modern',
                features: Object.keys(request.platformConfig.features || {}),
                complexity: complexity,
                generatedAt: Date.now()
            },
            size: Math.floor(50000 + Math.random() * 200000), // 50KB - 250KB
            quality: request.options.quality || 'high'
        };
        
        return preview;
    }
    
    /**
     * Generate mock preview content
     */
    generateMockPreviewContent(request) {
        const config = request.platformConfig;
        const platformType = config.type || 'webapp';
        const theme = config.theme || 'modern';
        
        // Generate different content based on format
        switch (request.options.format) {
            case 'html':
                return this.generateMockHTML(config, platformType, theme);
            case 'json':
                return this.generateMockJSON(config);
            case 'image':
                return this.generateMockImageData(config);
            default:
                return `Mock preview content for ${platformType} with ${theme} theme`;
        }
    }
    
    /**
     * Generate mock HTML preview
     */
    generateMockHTML(config, platformType, theme) {
        const brandName = config.brandName || 'Generated Platform';
        const primaryColor = config.primaryColor || '#3b82f6';
        const features = Object.keys(config.features || {});
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brandName} - Live Preview</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}40 100%);
            min-height: 100vh;
        }
        .header { 
            background: ${primaryColor}; 
            color: white; 
            padding: 1rem 2rem; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            padding: 2rem; 
        }
        .preview-badge {
            position: fixed;
            top: 10px;
            right: 10px;
            background: #ff6b35;
            color: white;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            z-index: 1000;
            animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .feature-list { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 1rem; 
            margin: 2rem 0; 
        }
        .feature-card { 
            background: white; 
            padding: 1.5rem; 
            border-radius: 10px; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        .feature-card:hover { transform: translateY(-5px); }
    </style>
</head>
<body>
    <div class="preview-badge">🔴 LIVE PREVIEW</div>
    <header class="header">
        <h1>${brandName}</h1>
        <p>Platform Type: ${platformType} | Theme: ${theme}</p>
    </header>
    <div class="container">
        <h2>Features Preview</h2>
        <div class="feature-list">
            ${features.map(feature => `
                <div class="feature-card">
                    <h3>📦 ${feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
                    <p>Preview of ${feature} functionality integrated into your platform.</p>
                </div>
            `).join('')}
        </div>
        <div style="text-align: center; margin: 2rem 0; color: #666;">
            <p>🚀 Generated at: ${new Date().toLocaleString()}</p>
            <p>⚡ Real-time preview powered by AI</p>
        </div>
    </div>
    <script>
        console.log('🔴 Live Preview System Active');
        console.log('Platform Configuration:', ${JSON.stringify(config, null, 2)});
    </script>
</body>
</html>`;
    }
    
    /**
     * Broadcasting and messaging utilities
     */
    broadcastToSession(session, message, exclude = []) {
        for (const collaboratorId of session.collaborators) {
            if (!exclude.includes(collaboratorId)) {
                const connection = this.state.connections.get(collaboratorId);
                if (connection && connection.ws.readyState === WebSocket.OPEN) {
                    this.sendMessage(connection, message);
                }
            }
        }
    }
    
    broadcastToRoom(room, message, exclude = []) {
        for (const [collaboratorId] of room.collaborators) {
            if (!exclude.includes(collaboratorId)) {
                const connection = this.state.connections.get(collaboratorId);
                if (connection && connection.ws.readyState === WebSocket.OPEN) {
                    this.sendMessage(connection, message);
                }
            }
        }
    }
    
    sendMessage(connection, message) {
        if (connection.ws.readyState === WebSocket.OPEN) {
            try {
                const data = JSON.stringify(message);
                connection.ws.send(data);
            } catch (error) {
                console.error(`❌ Failed to send message to ${connection.id}:`, error.message);
            }
        }
    }
    
    sendError(connection, message, code = 400) {
        this.sendMessage(connection, {
            type: 'error',
            error: message,
            code: code,
            timestamp: Date.now()
        });
    }
    
    /**
     * Utility functions
     */
    extractClientInfo(request) {
        return {
            ip: request.headers['x-forwarded-for'] || request.connection.remoteAddress,
            userAgent: request.headers['user-agent'] || 'Unknown',
            origin: request.headers.origin || 'Unknown'
        };
    }
    
    checkRateLimit(connection) {
        const now = Date.now();
        const windowStart = connection.rateLimitData.windowStart;
        
        // Reset window if expired
        if (now - windowStart > this.config.security.rateLimitWindow) {
            connection.rateLimitData = {
                requests: 1,
                windowStart: now
            };
            return true;
        }
        
        connection.rateLimitData.requests++;
        return connection.rateLimitData.requests <= this.config.security.maxRequestsPerWindow;
    }
    
    calculatePreviewPriority(trigger, options) {
        let priority = 50; // Base priority
        
        switch (trigger) {
            case 'initial':
                priority = 100; // Highest priority
                break;
            case 'config_update':
                priority = 80;
                break;
            case 'user_request':
                priority = 60;
                break;
            default:
                priority = 40;
        }
        
        // Adjust for quality
        if (options.quality === 'high') {
            priority += 10;
        } else if (options.quality === 'low') {
            priority -= 10;
        }
        
        return priority;
    }
    
    insertIntoQueue(request) {
        // Insert based on priority (higher priority first)
        let inserted = false;
        
        for (let i = 0; i < this.previewQueue.length; i++) {
            if (request.priority > this.previewQueue[i].priority) {
                this.previewQueue.splice(i, 0, request);
                inserted = true;
                break;
            }
        }
        
        if (!inserted) {
            this.previewQueue.push(request);
        }
    }
    
    calculateComplexity(platformConfig) {
        let complexity = 1; // Base complexity
        
        // Add complexity for features
        const featureCount = Object.keys(platformConfig.features || {}).length;
        complexity += featureCount * 0.5;
        
        // Add complexity for custom styling
        if (platformConfig.customStyling) {
            complexity += 1;
        }
        
        // Add complexity for integrations
        if (platformConfig.integrations) {
            complexity += Object.keys(platformConfig.integrations).length * 0.3;
        }
        
        return Math.max(1, Math.min(5, complexity)); // Clamp between 1-5
    }
    
    cachePreview(previewId, preview) {
        // Implement LRU cache
        if (this.state.previewCache.size >= this.config.preview.cacheSize) {
            const firstKey = this.state.previewCache.keys().next().value;
            this.state.previewCache.delete(firstKey);
        }
        
        this.state.previewCache.set(previewId, {
            preview: preview,
            cached: Date.now(),
            accessCount: 0
        });
    }
    
    estimatePreviewTime(session) {
        const complexity = this.calculateComplexity(session.platformConfig);
        return 1000 + (complexity * 500); // 1-3.5 seconds
    }
    
    updateAverageResponseTime(responseTime) {
        const current = this.state.metrics.avgResponseTime;
        const count = this.state.metrics.messagesProcessed;
        
        this.state.metrics.avgResponseTime = ((current * (count - 1)) + responseTime) / count;
    }
    
    /**
     * System maintenance functions
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.performHeartbeat();
        }, this.config.websocket.heartbeatInterval);
    }
    
    performHeartbeat() {
        const now = Date.now();
        
        for (const [connectionId, connection] of this.state.connections) {
            if (!connection.isAlive) {
                console.log(`💔 Connection ${connectionId} failed heartbeat, terminating`);
                this.terminateConnection(connection);
                continue;
            }
            
            connection.isAlive = false;
            if (connection.ws.readyState === WebSocket.OPEN) {
                connection.ws.ping();
            }
        }
    }
    
    terminateConnection(connection) {
        // Remove from any rooms
        if (connection.roomId) {
            this.handleLeaveCollaborationRoom(connection, { roomId: connection.roomId });
        }
        
        // Close WebSocket
        if (connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.terminate();
        }
        
        // Remove from connections
        this.state.connections.delete(connection.id);
        this.state.metrics.activeConnections--;
        
        console.log(`🔌 Connection terminated: ${connection.id}`);
        this.emit('connection_terminated', connection);
    }
    
    startMetricsCollection() {
        setInterval(() => {
            this.collectMetrics();
        }, 60000); // Every minute
    }
    
    collectMetrics() {
        const now = Date.now();
        
        // Update connection metrics
        this.state.metrics.activeConnections = this.state.connections.size;
        
        // Clean up old sessions
        for (const [sessionId, session] of this.state.sessions) {
            if (now - session.lastUpdate > 3600000) { // 1 hour inactive
                this.state.sessions.delete(sessionId);
                console.log(`🧹 Cleaned up inactive session: ${sessionId}`);
            }
        }
        
        // Clean up old rooms
        for (const [roomId, room] of this.state.rooms) {
            if (room.collaborators.size === 0) {
                this.state.rooms.delete(roomId);
                console.log(`🧹 Cleaned up empty room: ${roomId}`);
            }
        }
        
        // Emit metrics
        this.emit('metrics_collected', this.state.metrics);
    }
    
    /**
     * Get system status and statistics
     */
    getSystemStatus() {
        return {
            server: {
                uptime: process.uptime(),
                port: this.config.websocket.port,
                status: this.wsServer ? 'running' : 'stopped'
            },
            connections: {
                active: this.state.connections.size,
                total: this.state.metrics.totalConnections,
                limit: this.config.websocket.maxConnections
            },
            sessions: {
                active: this.state.sessions.size,
                rooms: this.state.rooms.size
            },
            preview: {
                queue: this.previewQueue.length,
                processing: this.isProcessingQueue,
                cached: this.state.previewCache.size,
                generated: this.state.metrics.previewsGenerated
            },
            metrics: this.state.metrics,
            timestamp: Date.now()
        };
    }
    
    /**
     * Graceful shutdown
     */
    shutdown() {
        console.log('\n🛑 Shutting down Real-Time Preview System...');
        
        // Stop heartbeat
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        
        // Close all connections
        for (const [connectionId, connection] of this.state.connections) {
            this.sendMessage(connection, {
                type: 'system_shutdown',
                message: 'Server is shutting down',
                timestamp: Date.now()
            });
            
            connection.ws.close(1012, 'Service restart');
        }
        
        // Close WebSocket server
        if (this.wsServer) {
            this.wsServer.close(() => {
                console.log('📡 WebSocket server closed');
            });
        }
        
        console.log('👋 Real-Time Preview System shutdown complete');
    }
}

// Export for use as module
module.exports = RealTimePreviewSystem;

// Demo if run directly
if (require.main === module) {
    console.log('🔴 Running Real-Time Preview System Demo...\n');
    
    const previewSystem = new RealTimePreviewSystem(8081);
    
    // Listen for events
    previewSystem.on('system_started', () => {
        console.log('✅ Real-Time Preview System started successfully');
    });
    
    previewSystem.on('connection_established', (connection) => {
        console.log(`🔌 New connection established: ${connection.id}`);
    });
    
    previewSystem.on('preview_generated', ({ request, preview, generationTime }) => {
        console.log(`✨ Preview generated: ${request.id} (${generationTime}ms, ${preview.size} bytes)`);
    });
    
    previewSystem.on('metrics_collected', (metrics) => {
        console.log(`📊 Metrics: ${metrics.activeConnections} connections, ${metrics.previewsGenerated} previews generated`);
    });
    
    // Simulate some activity
    setTimeout(() => {
        const status = previewSystem.getSystemStatus();
        console.log('\n📈 System Status:');
        console.log(`🔌 Active connections: ${status.connections.active}`);
        console.log(`📋 Preview queue: ${status.preview.queue}`);
        console.log(`💾 Cached previews: ${status.preview.cached}`);
        console.log(`⚡ Average response time: ${status.metrics.avgResponseTime.toFixed(2)}ms`);
        
        console.log('\n🌐 WebSocket server ready for connections at ws://localhost:8081');
        console.log('📱 Test with: wscat -c ws://localhost:8081');
        
    }, 2000);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        previewSystem.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        previewSystem.shutdown();
        process.exit(0);
    });
}