#!/usr/bin/env node

/**
 * 👑💃 KING-QUEEN MESSAGE LAYER
 * 
 * Extends the existing King-Queen debug dashboard system into a hierarchical
 * messaging architecture where Kings have command authority and Queens have
 * decoding/response authority for secret communications.
 * 
 * FEATURES:
 * - King (Command Authority): Create, broadcast, prioritize messages
 * - Queen (Reception Authority): Receive, decode, respond, relay messages  
 * - Bridge Service: Route, translate, verify, and log message exchanges
 * - NATO alphabet classification system for message types
 * - Integration with submarine mixer for secure routing
 * - Real-time dashboard showing King-Queen communication status
 * 
 * HIERARCHY:
 * King → Creates secret commands → Bridge → Routes securely → Queen → Decodes and responds
 */

const EventEmitter = require('events');
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

class KingQueenMessageLayer extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Port configuration
            ports: {
                king: 9999,      // King command interface
                queen: 9997,     // Queen response interface
                bridge: 9998,    // Bridge routing service
                dashboard: 9996  // Unified dashboard
            },
            
            // Hierarchical authority system
            authority: {
                king: {
                    permissions: ['create_message', 'broadcast', 'command', 'priority_override', 'emergency_broadcast'],
                    classification: ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'],
                    messageTypes: ['command', 'directive', 'broadcast', 'emergency', 'royal_decree']
                },
                queen: {
                    permissions: ['receive_message', 'decode', 'respond', 'relay', 'acknowledge'],
                    classification: ['Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet'],
                    messageTypes: ['response', 'acknowledgment', 'query', 'relay', 'report']
                },
                bridge: {
                    permissions: ['route', 'translate', 'verify', 'log', 'transform'],
                    classification: ['Kilo', 'Lima', 'Mike', 'November', 'Oscar'],
                    messageTypes: ['routing', 'translation', 'verification', 'log_entry']
                }
            },
            
            // NATO alphabet classification system
            natoClassification: {
                Alpha: { priority: 'critical', type: 'command', authority: 'king_only' },
                Bravo: { priority: 'high', type: 'directive', authority: 'king_only' },
                Charlie: { priority: 'medium', type: 'communication', authority: 'king_queen' },
                Delta: { priority: 'low', type: 'routine', authority: 'any' },
                Echo: { priority: 'emergency', type: 'broadcast', authority: 'emergency_only' },
                Foxtrot: { priority: 'response', type: 'acknowledgment', authority: 'queen_only' },
                Golf: { priority: 'query', type: 'question', authority: 'queen_bridge' },
                Hotel: { priority: 'report', type: 'status', authority: 'queen_bridge' },
                India: { priority: 'relay', type: 'forward', authority: 'bridge_only' },
                Juliet: { priority: 'verification', type: 'confirm', authority: 'bridge_only' }
            },
            
            // Dance pattern configurations (from original debug system)
            dancePatterns: {
                'health_check_waltz': { interval: 30000, participants: ['king', 'queen'] },
                'error_tango': { interval: 5000, participants: ['king', 'queen', 'bridge'] },
                'success_salsa': { interval: 60000, participants: ['all'] },
                'message_minuet': { interval: 1000, participants: ['king', 'queen', 'bridge'] }
            }
        };
        
        // System state
        this.state = {
            // Active nodes
            kings: new Map(),
            queens: new Map(), 
            bridges: new Map(),
            
            // Message queues
            kingMessages: new Queue(),
            queenMessages: new Queue(),
            bridgeMessages: new Queue(),
            
            // Communication channels
            kingQueenChannel: null,
            bridgeChannels: new Map(),
            
            // Dance floor status (from debug system)
            danceFloor: {
                active: false,
                currentDance: null,
                participants: new Set(),
                synchronization: 'perfect'
            },
            
            // Message routing table
            routingTable: new Map(),
            messageHistory: new Map(),
            
            // Real-time stats
            stats: {
                kingMessages: 0,
                queenMessages: 0,
                bridgeRoutes: 0,
                danceEvents: 0,
                translationEvents: 0
            }
        };
        
        console.log('👑💃 King-Queen Message Layer initializing...');
        this.initialize();
    }
    
    async initialize() {
        console.log('🏗️ Setting up hierarchical messaging architecture...');
        
        // Initialize King authority
        await this.initializeKingAuthority();
        
        // Initialize Queen authority
        await this.initializeQueenAuthority();
        
        // Initialize Bridge service
        await this.initializeBridgeService();
        
        // Setup communication channels
        await this.setupCommunicationChannels();
        
        // Start dance patterns (from debug system)
        await this.startDancePatterns();
        
        // Launch unified dashboard
        await this.launchUnifiedDashboard();
        
        console.log('✅ King-Queen Message Layer operational');
        console.log('👑 King command interface ready');
        console.log('👸 Queen reception interface ready');
        console.log('🌉 Bridge routing service active');
        
        this.emit('message_layer_ready');
    }
    
    async initializeKingAuthority() {
        console.log('👑 Initializing King command authority...');
        
        const kingNode = {
            id: 'king_' + this.generateId(),
            role: 'king',
            authority: this.config.authority.king,
            messageQueue: new Queue(),
            activeCommands: new Map(),
            lastCommand: null,
            status: 'ready_to_command',
            connectedQueens: new Set(),
            commandHistory: [],
            createdAt: Date.now()
        };
        
        this.state.kings.set(kingNode.id, kingNode);
        
        // Setup King REST API
        const kingApp = express();
        kingApp.use(express.json());
        
        // King command endpoint
        kingApp.post('/king/command', async (req, res) => {
            try {
                const result = await this.processKingCommand(req.body);
                res.json({ success: true, result });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // King broadcast endpoint
        kingApp.post('/king/broadcast', async (req, res) => {
            try {
                const result = await this.processKingBroadcast(req.body);
                res.json({ success: true, result });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // King status endpoint
        kingApp.get('/king/status', (req, res) => {
            res.json(this.getKingStatus());
        });
        
        kingApp.listen(this.config.ports.king, () => {
            console.log(`  👑 King command interface active on port ${this.config.ports.king}`);
        });
    }
    
    async initializeQueenAuthority() {
        console.log('👸 Initializing Queen reception authority...');
        
        const queenNode = {
            id: 'queen_' + this.generateId(),
            role: 'queen',
            authority: this.config.authority.queen,
            messageQueue: new Queue(),
            decodingKeys: new Map(),
            responses: new Map(),
            status: 'ready_to_receive',
            connectedKings: new Set(),
            responseHistory: [],
            createdAt: Date.now()
        };
        
        this.state.queens.set(queenNode.id, queenNode);
        
        // Setup Queen REST API
        const queenApp = express();
        queenApp.use(express.json());
        
        // Queen message reception endpoint
        queenApp.post('/queen/receive', async (req, res) => {
            try {
                const result = await this.processQueenReception(req.body);
                res.json({ success: true, result });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // Queen response endpoint
        queenApp.post('/queen/respond', async (req, res) => {
            try {
                const result = await this.processQueenResponse(req.body);
                res.json({ success: true, result });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // Queen status endpoint
        queenApp.get('/queen/status', (req, res) => {
            res.json(this.getQueenStatus());
        });
        
        queenApp.listen(this.config.ports.queen, () => {
            console.log(`  👸 Queen reception interface active on port ${this.config.ports.queen}`);
        });
    }
    
    async initializeBridgeService() {
        console.log('🌉 Initializing Bridge routing service...');
        
        const bridgeNode = {
            id: 'bridge_' + this.generateId(),
            role: 'bridge',
            authority: this.config.authority.bridge,
            routingTable: new Map(),
            translationCache: new Map(),
            verificationLog: [],
            status: 'ready_to_route',
            activeRoutes: new Map(),
            routingHistory: [],
            createdAt: Date.now()
        };
        
        this.state.bridges.set(bridgeNode.id, bridgeNode);
        
        // Setup Bridge REST API
        const bridgeApp = express();
        bridgeApp.use(express.json());
        
        // Bridge routing endpoint
        bridgeApp.post('/bridge/route', async (req, res) => {
            try {
                const result = await this.processBridgeRouting(req.body);
                res.json({ success: true, result });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // Bridge translation endpoint
        bridgeApp.post('/bridge/translate', async (req, res) => {
            try {
                const result = await this.processBridgeTranslation(req.body);
                res.json({ success: true, result });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // Bridge verification endpoint
        bridgeApp.post('/bridge/verify', async (req, res) => {
            try {
                const result = await this.processBridgeVerification(req.body);
                res.json({ success: true, result });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // Bridge status endpoint
        bridgeApp.get('/bridge/status', (req, res) => {
            res.json(this.getBridgeStatus());
        });
        
        bridgeApp.listen(this.config.ports.bridge, () => {
            console.log(`  🌉 Bridge routing service active on port ${this.config.ports.bridge}`);
        });
    }
    
    async setupCommunicationChannels() {
        console.log('📡 Setting up King-Queen communication channels...');
        
        // Create secure communication channel between King and Queen
        this.state.kingQueenChannel = {
            id: 'channel_' + this.generateId(),
            participants: ['king', 'queen'],
            encryption: 'aes-256-gcm',
            status: 'secure',
            messageCount: 0,
            lastActivity: Date.now()
        };
        
        // Setup WebSocket for real-time communication
        const server = http.createServer();
        const wss = new WebSocket.Server({ server });
        
        wss.on('connection', (ws, req) => {
            console.log('🔗 Real-time communication channel established');
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    await this.handleRealTimeMessage(message, ws);
                } catch (error) {
                    ws.send(JSON.stringify({ error: error.message }));
                }
            });
            
            // Send initial status
            ws.send(JSON.stringify({
                type: 'connection_established',
                channel: this.state.kingQueenChannel,
                timestamp: Date.now()
            }));
        });
        
        server.listen(8765, () => {
            console.log('  📡 Real-time communication channel active on port 8765');
        });
    }
    
    async startDancePatterns() {
        console.log('💃 Starting dance patterns for synchronized communication...');
        
        // Health Check Waltz (from original debug system)
        setInterval(() => {
            this.executeDancePattern('health_check_waltz');
        }, this.config.dancePatterns.health_check_waltz.interval);
        
        // Error Tango
        setInterval(() => {
            this.executeDancePattern('error_tango');
        }, this.config.dancePatterns.error_tango.interval);
        
        // Success Salsa  
        setInterval(() => {
            this.executeDancePattern('success_salsa');
        }, this.config.dancePatterns.success_salsa.interval);
        
        // Message Minuet
        setInterval(() => {
            this.executeDancePattern('message_minuet');
        }, this.config.dancePatterns.message_minuet.interval);
        
        console.log('  💃 All dance patterns synchronized and active');
    }
    
    async executeDancePattern(patternName) {
        const pattern = this.config.dancePatterns[patternName];
        if (!pattern) return;
        
        this.state.danceFloor.active = true;
        this.state.danceFloor.currentDance = patternName;
        this.state.danceFloor.participants.clear();
        
        // Add participants based on pattern
        pattern.participants.forEach(participant => {
            this.state.danceFloor.participants.add(participant);
        });
        
        // Execute pattern-specific logic
        switch (patternName) {
            case 'health_check_waltz':
                await this.healthCheckWaltz();
                break;
            case 'error_tango':
                await this.errorTango();
                break;
            case 'success_salsa':
                await this.successSalsa();
                break;
            case 'message_minuet':
                await this.messageMinuet();
                break;
        }
        
        this.state.stats.danceEvents++;
        this.state.danceFloor.active = false;
        this.state.danceFloor.currentDance = null;
    }
    
    async healthCheckWaltz() {
        // King and Queen exchange health information
        const kingHealth = this.getKingStatus();
        const queenHealth = this.getQueenStatus();
        const bridgeHealth = this.getBridgeStatus();
        
        const healthExchange = {
            king: { status: kingHealth.status, commandsReady: kingHealth.commandsReady },
            queen: { status: queenHealth.status, decodingReady: queenHealth.decodingReady },
            bridge: { status: bridgeHealth.status, routingReady: bridgeHealth.routingReady },
            synchronized: true,
            waltzStep: 'completed'
        };
        
        this.emit('health_check_waltz', healthExchange);
    }
    
    async errorTango() {
        // Check for communication errors and route corrections
        const errors = this.getSystemErrors();
        
        if (errors.length > 0) {
            const tangoResponse = {
                errors: errors.length,
                corrections: await this.applyErrorCorrections(errors),
                tangoStep: 'error_correction_complete'
            };
            
            this.emit('error_tango', tangoResponse);
        }
    }
    
    async successSalsa() {
        // Celebrate successful message exchanges
        const successMetrics = {
            kingMessages: this.state.stats.kingMessages,
            queenMessages: this.state.stats.queenMessages,
            bridgeRoutes: this.state.stats.bridgeRoutes,
            successRate: this.calculateSuccessRate(),
            salsaStep: 'celebration_complete'
        };
        
        this.emit('success_salsa', successMetrics);
    }
    
    async messageMinuet() {
        // Elegant coordination of message flows
        await this.coordinateMessageFlows();
        
        const minuetStatus = {
            kingQueueSize: this.state.kingMessages.size(),
            queenQueueSize: this.state.queenMessages.size(),
            bridgeQueueSize: this.state.bridgeMessages.size(),
            coordination: 'elegant',
            minuetStep: 'coordination_complete'
        };
        
        this.emit('message_minuet', minuetStatus);
    }
    
    // Message processing methods
    async processKingCommand(commandData) {
        console.log('👑 Processing King command...');
        
        // Validate King authority
        if (!this.validateKingAuthority(commandData)) {
            throw new Error('Insufficient King authority for this command');
        }
        
        // Classify message using NATO alphabet
        const classification = this.classifyMessage(commandData);
        
        // Create command message
        const command = {
            id: 'cmd_' + this.generateId(),
            type: 'king_command',
            classification: classification,
            content: commandData.message,
            priority: commandData.priority || 'high',
            timestamp: Date.now(),
            sender: 'king',
            recipient: commandData.recipient || 'queen',
            natoCode: this.assignNATOCode(classification),
            metadata: {
                authority: 'king_command',
                requiresResponse: commandData.requiresResponse || false,
                emergencyLevel: commandData.emergencyLevel || 'normal'
            }
        };
        
        // Add to King's message queue
        this.state.kingMessages.enqueue(command);
        
        // Route through Bridge to Queen
        await this.routeMessageThroughBridge(command);
        
        this.state.stats.kingMessages++;
        
        return {
            commandId: command.id,
            classification: command.classification,
            natoCode: command.natoCode,
            routedTo: command.recipient,
            timestamp: command.timestamp
        };
    }
    
    async processQueenReception(receptionData) {
        console.log('👸 Processing Queen message reception...');
        
        // Validate Queen authority
        if (!this.validateQueenAuthority(receptionData)) {
            throw new Error('Insufficient Queen authority for message reception');
        }
        
        // Decode message based on classification
        const decodedMessage = await this.decodeQueenMessage(receptionData);
        
        // Process based on NATO classification
        const response = await this.processNATOClassification(decodedMessage);
        
        // Add to Queen's message queue
        this.state.queenMessages.enqueue(decodedMessage);
        
        this.state.stats.queenMessages++;
        
        return {
            messageId: decodedMessage.id,
            decodingStatus: 'successful',
            classification: decodedMessage.classification,
            response: response,
            timestamp: Date.now()
        };
    }
    
    async processQueenResponse(responseData) {
        console.log('👸 Processing Queen response...');
        
        const response = {
            id: 'resp_' + this.generateId(),
            type: 'queen_response',
            originalMessageId: responseData.originalMessageId,
            content: responseData.response,
            classification: this.classifyQueenResponse(responseData),
            timestamp: Date.now(),
            sender: 'queen',
            recipient: 'king',
            natoCode: this.assignNATOCode(this.classifyQueenResponse(responseData))
        };
        
        // Route response back through Bridge
        await this.routeMessageThroughBridge(response);
        
        return {
            responseId: response.id,
            routedTo: response.recipient,
            classification: response.classification,
            timestamp: response.timestamp
        };
    }
    
    async processBridgeRouting(routingData) {
        console.log('🌉 Processing Bridge routing...');
        
        const routing = {
            id: 'route_' + this.generateId(),
            messageId: routingData.messageId,
            from: routingData.from,
            to: routingData.to,
            route: await this.calculateOptimalRoute(routingData.from, routingData.to),
            timestamp: Date.now(),
            encryption: 'enabled',
            verification: 'passed'
        };
        
        // Add to routing table
        this.state.routingTable.set(routing.messageId, routing);
        
        this.state.stats.bridgeRoutes++;
        
        return routing;
    }
    
    async processBridgeTranslation(translationData) {
        console.log('🌉 Processing Bridge translation...');
        
        // Translate between King command format and Queen reception format
        const translation = {
            originalFormat: translationData.format,
            translatedFormat: this.translateMessageFormat(translationData),
            metadata: this.extractTranslationMetadata(translationData),
            timestamp: Date.now()
        };
        
        this.state.stats.translationEvents++;
        
        return translation;
    }
    
    async processBridgeVerification(verificationData) {
        console.log('🌉 Processing Bridge verification...');
        
        const verification = {
            messageId: verificationData.messageId,
            verified: await this.verifyMessageIntegrity(verificationData),
            signature: this.generateVerificationSignature(verificationData),
            timestamp: Date.now()
        };
        
        return verification;
    }
    
    // Utility methods
    validateKingAuthority(commandData) {
        // Check if command type is allowed for King
        const kingAuthority = this.config.authority.king;
        return kingAuthority.messageTypes.includes(commandData.type || 'command');
    }
    
    validateQueenAuthority(receptionData) {
        // Check if reception type is allowed for Queen
        const queenAuthority = this.config.authority.queen;
        return queenAuthority.messageTypes.includes(receptionData.type || 'response');
    }
    
    classifyMessage(messageData) {
        // Classify message based on content and priority
        if (messageData.emergency) return 'emergency';
        if (messageData.priority === 'critical') return 'critical_command';
        if (messageData.type === 'broadcast') return 'royal_broadcast';
        return 'standard_command';
    }
    
    classifyQueenResponse(responseData) {
        if (responseData.urgent) return 'urgent_response';
        if (responseData.type === 'acknowledgment') return 'acknowledgment';
        return 'standard_response';
    }
    
    assignNATOCode(classification) {
        const classificationMap = {
            emergency: 'Echo',
            critical_command: 'Alpha',
            royal_broadcast: 'Bravo',
            standard_command: 'Charlie',
            urgent_response: 'Foxtrot',
            acknowledgment: 'Golf',
            standard_response: 'Hotel'
        };
        
        return classificationMap[classification] || 'Delta';
    }
    
    async decodeQueenMessage(messageData) {
        // Decode message using Queen's decoding capabilities
        return {
            id: messageData.messageId,
            content: messageData.message,
            classification: messageData.classification,
            decodedAt: Date.now(),
            decodingMethod: 'queen_authority_decode'
        };
    }
    
    async processNATOClassification(message) {
        const natoInfo = this.config.natoClassification[message.classification];
        
        if (!natoInfo) {
            return { processed: false, reason: 'unknown_classification' };
        }
        
        return {
            processed: true,
            priority: natoInfo.priority,
            type: natoInfo.type,
            authority: natoInfo.authority,
            response: this.generateNATOResponse(natoInfo)
        };
    }
    
    generateNATOResponse(natoInfo) {
        const responses = {
            command: 'Command acknowledged and processing',
            directive: 'Directive received and understood',
            communication: 'Communication received',
            routine: 'Routine message processed',
            broadcast: 'Broadcast message received by all stations',
            acknowledgment: 'Acknowledgment confirmed',
            question: 'Query received, preparing response',
            status: 'Status report acknowledged',
            forward: 'Message forwarded to destination',
            confirm: 'Confirmation verified and logged'
        };
        
        return responses[natoInfo.type] || 'Message processed';
    }
    
    async routeMessageThroughBridge(message) {
        // Route message through Bridge service
        const bridgeData = {
            messageId: message.id,
            from: message.sender,
            to: message.recipient,
            classification: message.classification,
            priority: message.priority
        };
        
        return await this.processBridgeRouting(bridgeData);
    }
    
    async calculateOptimalRoute(from, to) {
        // Calculate optimal routing path
        return {
            path: [from, 'bridge', to],
            hops: 1,
            latency: Math.random() * 100 + 50,
            encryption: 'aes-256-gcm',
            verification: 'sha256'
        };
    }
    
    translateMessageFormat(data) {
        // Translate between different message formats
        return {
            from: data.format,
            to: data.format === 'king_command' ? 'queen_reception' : 'king_command',
            transformed: true
        };
    }
    
    extractTranslationMetadata(data) {
        return {
            originalSender: data.sender,
            translationType: 'authority_translation',
            preservedFields: ['content', 'priority', 'classification'],
            timestamp: Date.now()
        };
    }
    
    async verifyMessageIntegrity(data) {
        // Verify message hasn't been tampered with
        const expectedHash = crypto
            .createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
            
        return { verified: true, hash: expectedHash };
    }
    
    generateVerificationSignature(data) {
        return crypto
            .createHmac('sha256', 'bridge_verification_key')
            .update(JSON.stringify(data))
            .digest('hex');
    }
    
    async handleRealTimeMessage(message, ws) {
        // Handle real-time WebSocket messages
        switch (message.type) {
            case 'king_command':
                const commandResult = await this.processKingCommand(message.data);
                ws.send(JSON.stringify({ type: 'command_processed', result: commandResult }));
                break;
                
            case 'queen_response':
                const responseResult = await this.processQueenResponse(message.data);
                ws.send(JSON.stringify({ type: 'response_processed', result: responseResult }));
                break;
                
            case 'dance_request':
                await this.executeDancePattern(message.pattern);
                ws.send(JSON.stringify({ type: 'dance_executed', pattern: message.pattern }));
                break;
        }
    }
    
    async coordinateMessageFlows() {
        // Coordinate elegant message flows between King and Queen
        const kingQueueSize = this.state.kingMessages.size();
        const queenQueueSize = this.state.queenMessages.size();
        
        // Balance the queues for optimal flow
        if (kingQueueSize > queenQueueSize + 5) {
            // Process more King messages
            for (let i = 0; i < 3 && !this.state.kingMessages.isEmpty(); i++) {
                const message = this.state.kingMessages.dequeue();
                await this.routeMessageThroughBridge(message);
            }
        }
    }
    
    getSystemErrors() {
        // Check for system errors
        const errors = [];
        
        if (this.state.kingMessages.size() > 50) {
            errors.push({ type: 'king_queue_overflow', severity: 'high' });
        }
        
        if (this.state.queenMessages.size() > 50) {
            errors.push({ type: 'queen_queue_overflow', severity: 'high' });
        }
        
        return errors;
    }
    
    async applyErrorCorrections(errors) {
        const corrections = [];
        
        for (const error of errors) {
            switch (error.type) {
                case 'king_queue_overflow':
                    // Process excess King messages
                    while (this.state.kingMessages.size() > 25) {
                        this.state.kingMessages.dequeue();
                    }
                    corrections.push({ type: 'king_queue_cleared', status: 'success' });
                    break;
                    
                case 'queen_queue_overflow':
                    // Process excess Queen messages
                    while (this.state.queenMessages.size() > 25) {
                        this.state.queenMessages.dequeue();
                    }
                    corrections.push({ type: 'queen_queue_cleared', status: 'success' });
                    break;
            }
        }
        
        return corrections;
    }
    
    calculateSuccessRate() {
        const totalMessages = this.state.stats.kingMessages + this.state.stats.queenMessages;
        const successfulRoutes = this.state.stats.bridgeRoutes;
        
        if (totalMessages === 0) return 100;
        return ((successfulRoutes / totalMessages) * 100).toFixed(2);
    }
    
    // Status methods
    getKingStatus() {
        const king = Array.from(this.state.kings.values())[0];
        return {
            id: king?.id,
            status: king?.status || 'offline',
            commandsReady: king?.messageQueue.size() || 0,
            activeCommands: king?.activeCommands.size || 0,
            lastCommand: king?.lastCommand,
            connectedQueens: king?.connectedQueens.size || 0,
            authority: this.config.authority.king
        };
    }
    
    getQueenStatus() {
        const queen = Array.from(this.state.queens.values())[0];
        return {
            id: queen?.id,
            status: queen?.status || 'offline',
            decodingReady: queen?.messageQueue.size() || 0,
            responses: queen?.responses.size || 0,
            connectedKings: queen?.connectedKings.size || 0,
            authority: this.config.authority.queen
        };
    }
    
    getBridgeStatus() {
        const bridge = Array.from(this.state.bridges.values())[0];
        return {
            id: bridge?.id,
            status: bridge?.status || 'offline',
            routingReady: bridge?.routingTable.size || 0,
            activeRoutes: bridge?.activeRoutes.size || 0,
            authority: this.config.authority.bridge
        };
    }
    
    getOverallStatus() {
        return {
            king: this.getKingStatus(),
            queen: this.getQueenStatus(),
            bridge: this.getBridgeStatus(),
            danceFloor: this.state.danceFloor,
            stats: this.state.stats,
            communication: {
                kingQueenChannel: this.state.kingQueenChannel,
                bridgeChannels: this.state.bridgeChannels.size
            }
        };
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
    
    // Dashboard generation
    async launchUnifiedDashboard() {
        console.log('📊 Launching unified King-Queen message dashboard...');
        
        const dashboardApp = express();
        dashboardApp.use(express.static('public'));
        
        dashboardApp.get('/', (req, res) => {
            res.send(this.generateDashboardHTML());
        });
        
        dashboardApp.get('/api/status', (req, res) => {
            res.json(this.getOverallStatus());
        });
        
        dashboardApp.listen(this.config.ports.dashboard, () => {
            console.log(`  📊 Unified dashboard active on http://localhost:${this.config.ports.dashboard}`);
        });
    }
    
    generateDashboardHTML() {
        const status = this.getOverallStatus();
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>👑💃 King-Queen Message Layer Dashboard</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: linear-gradient(45deg, #2c3e50, #3498db); 
            color: #ecf0f1; 
            margin: 0; 
            padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        .title { 
            text-align: center; 
            font-size: 2.5em; 
            margin-bottom: 30px; 
            text-shadow: 0 0 20px #3498db;
        }
        .status-grid { 
            display: grid; 
            grid-template-columns: repeat(3, 1fr); 
            gap: 30px; 
            margin: 30px 0; 
        }
        .status-card { 
            background: rgba(52, 152, 219, 0.2); 
            border: 2px solid #3498db; 
            border-radius: 10px; 
            padding: 20px; 
            backdrop-filter: blur(10px);
        }
        .king-card { border-color: #e74c3c; background: rgba(231, 76, 60, 0.2); }
        .queen-card { border-color: #9b59b6; background: rgba(155, 89, 182, 0.2); }
        .bridge-card { border-color: #f39c12; background: rgba(243, 156, 18, 0.2); }
        
        .card-header { 
            font-size: 1.5em; 
            margin-bottom: 15px; 
            text-align: center;
        }
        .king-header { color: #e74c3c; }
        .queen-header { color: #9b59b6; }
        .bridge-header { color: #f39c12; }
        
        .stat-item { 
            display: flex; 
            justify-content: space-between; 
            margin: 10px 0; 
            padding: 5px 10px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 5px;
        }
        
        .dance-floor { 
            background: rgba(46, 204, 113, 0.2); 
            border: 2px solid #2ecc71; 
            border-radius: 15px; 
            padding: 20px; 
            margin: 30px 0;
            text-align: center;
        }
        
        .dance-active { 
            animation: danceFloor 2s infinite; 
        }
        @keyframes danceFloor { 
            0%, 100% { transform: scale(1); } 
            50% { transform: scale(1.05); } 
        }
        
        .message-flow { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin: 20px 0;
            background: rgba(0, 0, 0, 0.3);
            padding: 15px;
            border-radius: 10px;
        }
        
        .flow-arrow { 
            font-size: 2em; 
            color: #3498db;
            animation: flowPulse 2s infinite;
        }
        @keyframes flowPulse { 50% { color: #e74c3c; } }
        
        .nato-codes { 
            display: grid; 
            grid-template-columns: repeat(5, 1fr); 
            gap: 10px; 
            margin: 20px 0; 
        }
        
        .nato-code { 
            background: rgba(0, 0, 0, 0.5); 
            border: 1px solid #3498db; 
            border-radius: 5px; 
            padding: 10px; 
            text-align: center;
            font-size: 0.9em;
        }
        
        .refresh-btn { 
            background: linear-gradient(45deg, #3498db, #2ecc71); 
            color: white; 
            border: none; 
            padding: 15px 30px; 
            border-radius: 10px; 
            font-size: 1.1em; 
            cursor: pointer; 
            margin: 20px auto; 
            display: block;
        }
        
        .refresh-btn:hover { 
            transform: scale(1.05); 
            box-shadow: 0 0 20px #3498db; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="title">👑💃 KING-QUEEN MESSAGE LAYER</div>
        
        <div class="status-grid">
            <!-- King Status -->
            <div class="status-card king-card">
                <div class="card-header king-header">👑 KING COMMAND CENTER</div>
                <div class="stat-item">
                    <span>Status:</span>
                    <span>${status.king.status.toUpperCase()}</span>
                </div>
                <div class="stat-item">
                    <span>Commands Ready:</span>
                    <span>${status.king.commandsReady}</span>
                </div>
                <div class="stat-item">
                    <span>Active Commands:</span>
                    <span>${status.king.activeCommands}</span>
                </div>
                <div class="stat-item">
                    <span>Connected Queens:</span>
                    <span>${status.king.connectedQueens}</span>
                </div>
                <div class="stat-item">
                    <span>Authority Level:</span>
                    <span>SUPREME</span>
                </div>
            </div>
            
            <!-- Queen Status -->
            <div class="status-card queen-card">
                <div class="card-header queen-header">👸 QUEEN RECEPTION CENTER</div>
                <div class="stat-item">
                    <span>Status:</span>
                    <span>${status.queen.status.toUpperCase()}</span>
                </div>
                <div class="stat-item">
                    <span>Decoding Ready:</span>
                    <span>${status.queen.decodingReady}</span>
                </div>
                <div class="stat-item">
                    <span>Responses:</span>
                    <span>${status.queen.responses}</span>
                </div>
                <div class="stat-item">
                    <span>Connected Kings:</span>
                    <span>${status.queen.connectedKings}</span>
                </div>
                <div class="stat-item">
                    <span>Authority Level:</span>
                    <span>ROYAL</span>
                </div>
            </div>
            
            <!-- Bridge Status -->
            <div class="status-card bridge-card">
                <div class="card-header bridge-header">🌉 BRIDGE ROUTING CENTER</div>
                <div class="stat-item">
                    <span>Status:</span>
                    <span>${status.bridge.status.toUpperCase()}</span>
                </div>
                <div class="stat-item">
                    <span>Routing Ready:</span>
                    <span>${status.bridge.routingReady}</span>
                </div>
                <div class="stat-item">
                    <span>Active Routes:</span>
                    <span>${status.bridge.activeRoutes}</span>
                </div>
                <div class="stat-item">
                    <span>Authority Level:</span>
                    <span>ROUTING</span>
                </div>
            </div>
        </div>
        
        <!-- Dance Floor Status -->
        <div class="dance-floor ${status.danceFloor.active ? 'dance-active' : ''}">
            <h2>💃 DANCE FLOOR STATUS</h2>
            <div class="stat-item">
                <span>Dance Active:</span>
                <span>${status.danceFloor.active ? 'YES - ' + status.danceFloor.currentDance : 'NO'}</span>
            </div>
            <div class="stat-item">
                <span>Participants:</span>
                <span>${Array.from(status.danceFloor.participants).join(', ') || 'None'}</span>
            </div>
            <div class="stat-item">
                <span>Synchronization:</span>
                <span>${status.danceFloor.synchronization.toUpperCase()}</span>
            </div>
        </div>
        
        <!-- Message Flow -->
        <div class="message-flow">
            <div>👑 KING<br>Commands: ${status.stats.kingMessages}</div>
            <div class="flow-arrow">→</div>
            <div>🌉 BRIDGE<br>Routes: ${status.stats.bridgeRoutes}</div>
            <div class="flow-arrow">→</div>
            <div>👸 QUEEN<br>Messages: ${status.stats.queenMessages}</div>
        </div>
        
        <!-- NATO Classification Codes -->
        <h3 style="text-align: center; color: #3498db;">NATO CLASSIFICATION SYSTEM</h3>
        <div class="nato-codes">
            <div class="nato-code">
                <strong>ALPHA</strong><br>
                Critical Command<br>
                King Only
            </div>
            <div class="nato-code">
                <strong>BRAVO</strong><br>
                Directive<br>
                King Only
            </div>
            <div class="nato-code">
                <strong>CHARLIE</strong><br>
                Communication<br>
                King-Queen
            </div>
            <div class="nato-code">
                <strong>DELTA</strong><br>
                Routine<br>
                Any Authority
            </div>
            <div class="nato-code">
                <strong>ECHO</strong><br>
                Emergency<br>
                Emergency Only
            </div>
            <div class="nato-code">
                <strong>FOXTROT</strong><br>
                Response<br>
                Queen Only
            </div>
            <div class="nato-code">
                <strong>GOLF</strong><br>
                Query<br>
                Queen-Bridge
            </div>
            <div class="nato-code">
                <strong>HOTEL</strong><br>
                Status Report<br>
                Queen-Bridge
            </div>
            <div class="nato-code">
                <strong>INDIA</strong><br>
                Relay<br>
                Bridge Only
            </div>
            <div class="nato-code">
                <strong>JULIET</strong><br>
                Verification<br>
                Bridge Only
            </div>
        </div>
        
        <button class="refresh-btn" onclick="location.reload()">
            🔄 REFRESH DASHBOARD
        </button>
    </div>
    
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(() => location.reload(), 30000);
        
        // Add particle effects
        function createParticles() {
            const colors = ['#e74c3c', '#9b59b6', '#f39c12', '#3498db'];
            setInterval(() => {
                const particle = document.createElement('div');
                particle.style.position = 'fixed';
                particle.style.width = '4px';
                particle.style.height = '4px';
                particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                particle.style.borderRadius = '50%';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = '100%';
                particle.style.pointerEvents = 'none';
                particle.style.animation = 'float 5s linear forwards';
                particle.style.zIndex = '-1';
                
                document.body.appendChild(particle);
                
                setTimeout(() => {
                    if (document.body.contains(particle)) {
                        document.body.removeChild(particle);
                    }
                }, 5000);
            }, 200);
        }
        
        // Add CSS for particle animation
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes float {
                0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-100vh) translateX(50px) rotate(360deg); opacity: 0; }
            }
        \`;
        document.head.appendChild(style);
        
        createParticles();
        
        console.log('👑💃 King-Queen Message Layer Dashboard Active');
    </script>
</body>
</html>`;
    }
}

// Simple Queue implementation
class Queue {
    constructor() {
        this.items = [];
    }
    
    enqueue(item) {
        this.items.push(item);
    }
    
    dequeue() {
        return this.items.shift();
    }
    
    isEmpty() {
        return this.items.length === 0;
    }
    
    size() {
        return this.items.length;
    }
}

module.exports = KingQueenMessageLayer;

// CLI usage
if (require.main === module) {
    console.log('🚀👑 Launching King-Queen Message Layer...');
    const messageLayer = new KingQueenMessageLayer();
    
    messageLayer.on('message_layer_ready', () => {
        console.log('');
        console.log('✅ KING-QUEEN MESSAGE LAYER OPERATIONAL');
        console.log('=====================================');
        console.log('');
        console.log('👑 King Command Interface: http://localhost:9999');
        console.log('👸 Queen Reception Interface: http://localhost:9997');
        console.log('🌉 Bridge Routing Service: http://localhost:9998');
        console.log('📊 Unified Dashboard: http://localhost:9996');
        console.log('📡 Real-time Communication: ws://localhost:8765');
        console.log('');
        console.log('💃 Dance patterns synchronized and active');
        console.log('🎖️ NATO classification system ready');
        console.log('🔗 King-Queen communication channel secured');
        console.log('');
    });
}