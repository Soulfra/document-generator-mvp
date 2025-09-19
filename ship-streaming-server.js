#!/usr/bin/env node

/**
 * 🚢 SHIP STREAMING SERVER
 * Real-time WebSocket server for viking/pirate ship 3D visualization
 * Handles binary decoding, crew interaction, and reasoning streams
 */

const express = require('express');
const { WebSocketServer } = require('ws');
const { createServer } = require('http');
const cors = require('cors');
const { EventEmitter } = require('events');

class ShipStreamingServer extends EventEmitter {
    constructor() {
        super();
        this.app = express();
        this.port = 8116;
        this.server = createServer(this.app);
        this.wss = new WebSocketServer({ server: this.server });
        
        // Connected clients
        this.clients = new Map();
        
        // Ship state
        this.ships = new Map();
        
        // Crew reasoning engine
        this.crewAI = new CrewReasoningEngine();
        
        this.init();
    }
    
    init() {
        console.log('🚢 Initializing Ship Streaming Server...');
        
        // Setup express middleware
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.static('public'));
        
        this.setupAPIEndpoints();
        this.setupWebSocket();
        
        // Start server
        this.server.listen(this.port, () => {
            console.log(`⚓ Ship streaming server running on http://localhost:${this.port}`);
            console.log(`🌊 WebSocket available at ws://localhost:${this.port}/stream`);
        });
    }
    
    setupAPIEndpoints() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'sailing',
                ships: this.ships.size,
                clients: this.clients.size,
                uptime: process.uptime()
            });
        });
        
        // Decode binary ship data
        this.app.post('/api/decode', async (req, res) => {
            try {
                const { data, format } = req.body;
                const decoded = await this.decodeShipData(data, format);
                
                // Create ship instance
                const shipId = `ship_${Date.now()}`;
                this.ships.set(shipId, decoded);
                
                // Broadcast to connected clients
                this.broadcast({
                    type: 'new_ship',
                    shipId,
                    data: decoded
                });
                
                res.json({ success: true, shipId, decoded });
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // Query crew member
        this.app.post('/api/crew/query', async (req, res) => {
            try {
                const { shipId, crewRole, question } = req.body;
                
                const response = await this.crewAI.processQuery(crewRole, question);
                
                // Stream reasoning steps
                this.streamToShip(shipId, {
                    type: 'crew_reasoning',
                    crewRole,
                    reasoning: response.reasoning,
                    message: response.message
                });
                
                res.json(response);
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // Provide feedback
        this.app.post('/api/feedback', (req, res) => {
            const { shipId, crewRole, feedbackType, context } = req.body;
            
            // Store feedback for learning
            this.crewAI.recordFeedback(crewRole, feedbackType, context);
            
            res.json({ success: true });
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws, req) => {
            const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            console.log(`🔗 New client connected: ${clientId}`);
            
            // Store client
            this.clients.set(clientId, {
                ws,
                shipId: null,
                subscriptions: new Set()
            });
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                clientId,
                ships: Array.from(this.ships.keys())
            }));
            
            // Handle messages
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleClientMessage(clientId, data);
                } catch (error) {
                    console.error('Invalid message:', error);
                }
            });
            
            // Handle disconnect
            ws.on('close', () => {
                console.log(`🔌 Client disconnected: ${clientId}`);
                this.clients.delete(clientId);
            });
            
            // Handle errors
            ws.on('error', (error) => {
                console.error(`Client ${clientId} error:`, error);
            });
        });
    }
    
    handleClientMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        switch (data.type) {
            case 'subscribe_ship':
                client.shipId = data.shipId;
                client.subscriptions.add('ship_updates');
                this.sendShipUpdate(clientId, data.shipId);
                break;
                
            case 'crew_query':
                this.handleCrewQuery(clientId, data);
                break;
                
            case 'decode_request':
                this.handleDecodeRequest(clientId, data);
                break;
                
            case 'feedback':
                this.handleFeedback(clientId, data);
                break;
        }
    }
    
    async handleCrewQuery(clientId, data) {
        const { crewRole, question, shipId } = data;
        
        // Start streaming reasoning
        this.sendToClient(clientId, {
            type: 'reasoning_start',
            crewRole
        });
        
        // Process query with streaming updates
        const response = await this.crewAI.processQueryWithStreaming(
            crewRole,
            question,
            (step) => {
                this.sendToClient(clientId, {
                    type: 'reasoning_step',
                    step
                });
            }
        );
        
        // Send final response
        this.sendToClient(clientId, {
            type: 'crew_response',
            crewRole,
            response
        });
    }
    
    async handleDecodeRequest(clientId, data) {
        const { encodedData, format } = data;
        
        this.sendToClient(clientId, {
            type: 'decode_start',
            format
        });
        
        try {
            const decoded = await this.decodeShipData(encodedData, format);
            const shipId = `ship_${Date.now()}`;
            
            this.ships.set(shipId, decoded);
            
            this.sendToClient(clientId, {
                type: 'decode_complete',
                shipId,
                data: decoded
            });
            
            // Broadcast to other clients
            this.broadcast({
                type: 'new_ship',
                shipId,
                data: decoded
            }, clientId);
            
        } catch (error) {
            this.sendToClient(clientId, {
                type: 'decode_error',
                error: error.message
            });
        }
    }
    
    async decodeShipData(data, format) {
        // Implement decoding logic for different formats
        switch (format) {
            case 'binary':
                return this.decodeBinary(data);
            case 'fortran':
                return this.decodeFortran(data);
            case 'ascii':
                return this.decodeASCII(data);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }
    
    decodeBinary(binaryString) {
        // Convert binary to ASCII
        const cleaned = binaryString.replace(/[^01]/g, '');
        let ascii = '';
        
        for (let i = 0; i < cleaned.length; i += 8) {
            const byte = cleaned.substr(i, 8);
            if (byte.length === 8) {
                ascii += String.fromCharCode(parseInt(byte, 2));
            }
        }
        
        return this.parseShipSpec(ascii);
    }
    
    decodeFortran(fortranCode) {
        // Extract ship data from Fortran code
        const lengthMatch = fortranCode.match(/LENGTH[\/\s=]*(\d+\.?\d*)/i);
        const widthMatch = fortranCode.match(/WIDTH[\/\s=]*(\d+\.?\d*)/i);
        const heightMatch = fortranCode.match(/HEIGHT[\/\s=]*(\d+\.?\d*)/i);
        
        return {
            type: 'viking_longboat',
            dimensions: {
                length: lengthMatch ? parseFloat(lengthMatch[1]) : 30,
                width: widthMatch ? parseFloat(widthMatch[1]) : 8,
                height: heightMatch ? parseFloat(heightMatch[1]) : 5
            },
            crew: this.generateCrew(30),
            features: ['dragon_head', 'shields', 'oars', 'sail']
        };
    }
    
    decodeASCII(asciiData) {
        return this.parseShipSpec(asciiData);
    }
    
    parseShipSpec(text) {
        const parts = text.split(/[:;,\s]+/);
        
        let type = 'viking_longboat';
        let length = 30, width = 8, height = 5;
        let features = [];
        
        parts.forEach((part, i) => {
            const lower = part.toLowerCase();
            
            if (lower.includes('viking') || lower.includes('pirate')) {
                type = lower;
            }
            
            if (lower === 'l' && i < parts.length - 1) {
                length = parseFloat(parts[i + 1]) || length;
            }
            
            if (lower === 'w' && i < parts.length - 1) {
                width = parseFloat(parts[i + 1]) || width;
            }
            
            if (lower === 'h' && i < parts.length - 1) {
                height = parseFloat(parts[i + 1]) || height;
            }
            
            if (['dragon', 'shields', 'oars', 'sail', 'cannons'].includes(lower)) {
                features.push(lower);
            }
        });
        
        return {
            type,
            dimensions: { length, width, height },
            crew: this.generateCrew(length),
            features: features.length ? features : ['dragon_head', 'shields', 'oars', 'sail'],
            timestamp: Date.now()
        };
    }
    
    generateCrew(shipLength) {
        const crewCount = Math.floor(shipLength / 2);
        const crew = [];
        const roles = ['warrior', 'rower', 'archer', 'shield_maiden', 'berserker'];
        
        for (let i = 0; i < crewCount; i++) {
            crew.push({
                id: `crew_${i}`,
                role: roles[i % roles.length],
                position: {
                    x: (i % 2) * 2 - 1,
                    y: 0,
                    z: (i / 2) * 1.5 - shipLength / 4
                },
                status: 'ready'
            });
        }
        
        return crew;
    }
    
    sendToClient(clientId, data) {
        const client = this.clients.get(clientId);
        if (client && client.ws.readyState === 1) {
            client.ws.send(JSON.stringify(data));
        }
    }
    
    streamToShip(shipId, data) {
        this.clients.forEach((client, clientId) => {
            if (client.shipId === shipId) {
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
    
    sendShipUpdate(clientId, shipId) {
        const ship = this.ships.get(shipId);
        if (ship) {
            this.sendToClient(clientId, {
                type: 'ship_update',
                shipId,
                data: ship
            });
        }
    }
    
    handleFeedback(clientId, data) {
        const { crewRole, feedbackType, context } = data;
        this.crewAI.recordFeedback(crewRole, feedbackType, context);
        
        this.sendToClient(clientId, {
            type: 'feedback_recorded',
            message: 'Thank you for your feedback!'
        });
    }
}

class CrewReasoningEngine {
    constructor() {
        this.knowledgeBase = {
            captain: {
                expertise: ['navigation', 'strategy', 'leadership', 'weather'],
                personality: 'wise and experienced',
                reasoning_style: 'strategic and long-term focused'
            },
            warlord: {
                expertise: ['combat', 'tactics', 'weapons', 'morale'],
                personality: 'fierce and confident',
                reasoning_style: 'aggressive and action-oriented'
            },
            admiral: {
                expertise: ['fleet operations', 'naval tactics', 'logistics'],
                personality: 'calm and analytical',
                reasoning_style: 'systematic and coordinated'
            },
            navigator: {
                expertise: ['stars', 'currents', 'routes', 'weather patterns'],
                personality: 'observant and patient',
                reasoning_style: 'detailed and nature-focused'
            },
            shipwright: {
                expertise: ['construction', 'materials', 'repairs', 'design'],
                personality: 'practical and knowledgeable',
                reasoning_style: 'technical and hands-on'
            }
        };
        
        this.feedbackHistory = [];
    }
    
    async processQuery(role, question) {
        const knowledge = this.knowledgeBase[role] || this.knowledgeBase.captain;
        
        // Generate reasoning steps
        const reasoning = this.generateReasoning(role, question, knowledge);
        
        // Generate response
        const message = this.generateResponse(role, question, knowledge, reasoning);
        
        return { reasoning, message };
    }
    
    async processQueryWithStreaming(role, question, onStep) {
        const knowledge = this.knowledgeBase[role] || this.knowledgeBase.captain;
        
        // Stream reasoning steps
        const reasoning = [];
        const steps = this.generateReasoningSteps(role, question, knowledge);
        
        for (const step of steps) {
            reasoning.push(step);
            onStep(step);
            
            // Simulate thinking time
            await this.delay(300 + Math.random() * 200);
        }
        
        // Generate final response
        const message = this.generateResponse(role, question, knowledge, reasoning);
        
        return { reasoning, message };
    }
    
    generateReasoningSteps(role, question, knowledge) {
        const steps = [];
        
        // Analyze question context
        const context = this.analyzeQuestion(question);
        
        // Generate role-specific reasoning
        if (context.includes('navigation') || context.includes('route')) {
            steps.push('Analyzing current position and destination');
            steps.push('Checking weather conditions and wind patterns');
            steps.push('Evaluating known hazards and safe passages');
            steps.push('Calculating optimal route considering crew stamina');
        } else if (context.includes('combat') || context.includes('battle')) {
            steps.push('Assessing crew combat readiness');
            steps.push('Analyzing enemy strength and positioning');
            steps.push('Evaluating tactical advantages');
            steps.push('Planning engagement strategy');
        } else if (context.includes('ship') || context.includes('build')) {
            steps.push('Examining ship structural integrity');
            steps.push('Reviewing construction techniques');
            steps.push('Considering material availability');
            steps.push('Planning maintenance schedule');
        } else {
            // Generic reasoning
            steps.push(`Drawing on ${knowledge.expertise.join(', ')} expertise`);
            steps.push('Considering historical precedents');
            steps.push('Evaluating risk vs reward');
            steps.push('Formulating comprehensive response');
        }
        
        return steps;
    }
    
    generateReasoning(role, question, knowledge) {
        return this.generateReasoningSteps(role, question, knowledge);
    }
    
    generateResponse(role, question, knowledge, reasoning) {
        const context = this.analyzeQuestion(question);
        
        // Role-specific responses
        const responses = {
            captain: {
                navigation: "Based on my years at sea, the best route follows the coastal waters until we reach the narrows. The stars tell us favorable winds await.",
                combat: "Strategy wins battles before they begin. Position our ships to use the sun's glare, and strike when they least expect.",
                default: "A captain must balance many concerns. Let me share my wisdom on this matter."
            },
            warlord: {
                combat: "Our warriors are unmatched! Form shield walls on the beaches and let our berserkers lead the charge!",
                default: "Victory belongs to the bold! Our strength will overcome any challenge."
            },
            navigator: {
                navigation: "The currents speak of safe passage three days hence. Follow the morning star and keep the coast to starboard.",
                default: "The sea reveals her secrets to those who listen. I sense the path ahead."
            },
            admiral: {
                fleet: "Coordinate our longships in a crescent formation. Signal with horn blasts - one for advance, two for retreat.",
                default: "Fleet coordination is key. Every ship must know its role in the greater strategy."
            },
            shipwright: {
                construction: "This vessel uses traditional clinker construction - overlapping planks for flexibility and strength in rough seas.",
                default: "Every timber has its purpose, every joint tells a story of the sea."
            }
        };
        
        const roleResponses = responses[role] || responses.captain;
        
        // Match context to response
        for (const [key, response] of Object.entries(roleResponses)) {
            if (key !== 'default' && context.includes(key)) {
                return response;
            }
        }
        
        return roleResponses.default;
    }
    
    analyzeQuestion(question) {
        const lower = question.toLowerCase();
        const contexts = [];
        
        if (lower.match(/navigat|route|sail|journey|path/)) contexts.push('navigation');
        if (lower.match(/fight|combat|battle|attack|defend/)) contexts.push('combat');
        if (lower.match(/build|construct|repair|design|ship/)) contexts.push('construction');
        if (lower.match(/fleet|ships|coordinate|signal/)) contexts.push('fleet');
        
        return contexts;
    }
    
    recordFeedback(role, feedbackType, context) {
        this.feedbackHistory.push({
            role,
            feedbackType,
            context,
            timestamp: Date.now()
        });
        
        // In a real system, this would update the AI model
        console.log(`Feedback recorded for ${role}: ${feedbackType}`);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in other modules
module.exports = ShipStreamingServer;

// Start server if run directly
if (require.main === module) {
    new ShipStreamingServer();
}