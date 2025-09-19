#!/usr/bin/env node

/**
 * CHARACTER COMMAND INTERFACE
 * WebSocket server that accepts typed commands from the website
 * Parses special symbols (@, #, !, ?) and stores in database
 * Enables Claude to query character interactions
 */

const WebSocket = require('ws');
const express = require('express');
const mysql = require('mysql2/promise');
const { EventEmitter } = require('events');
const MessageContentValidator = require('./message-content-validator');

class CharacterCommandInterface extends EventEmitter {
    constructor() {
        super();
        
        this.app = express();
        this.httpPort = 42004;
        this.wsPort = 42005;
        
        // Active connections
        this.connections = new Map();
        this.characterSessions = new Map();
        
        // Database pool
        this.dbPool = null;
        
        // Message validator
        this.validator = new MessageContentValidator();
        
        // Symbol patterns
        this.patterns = {
            mention: /@(\w+)/g,           // @username
            tag: /#(\w+)/g,               // #quest_tag
            action: /!(\w+)(?:\(([^)]*)\))?/g,  // !action or !action(params)
            query: /\?(\w+)/g,            // ?query
            questGiver: /!{2,}/g,         // !! for important quests
            helpRequest: /\?{2,}/g        // ?? for help
        };
        
        console.log('💬 Character Command Interface initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Connect to database
            await this.connectDatabase();
            
            // Setup HTTP server
            this.setupHttpServer();
            
            // Setup WebSocket server
            this.setupWebSocketServer();
            
            console.log('💬 Character Command Interface ready');
            console.log(`🌐 HTTP: http://localhost:${this.httpPort}`);
            console.log(`🔌 WebSocket: ws://localhost:${this.wsPort}`);
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.emit('error', error);
        }
    }
    
    async connectDatabase() {
        this.dbPool = await mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'economic_engine',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        console.log('📊 Database connected');
    }
    
    setupHttpServer() {
        // Middleware
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Routes
        this.app.get('/health', (req, res) => {
            res.json({ 
                status: 'healthy',
                connections: this.connections.size,
                activeSessions: this.characterSessions.size
            });
        });
        
        // Get recent dialogues for a character
        this.app.get('/api/dialogues/:characterId', async (req, res) => {
            try {
                const characterId = parseInt(req.params.characterId);
                const limit = parseInt(req.query.limit) || 50;
                
                const [dialogues] = await this.dbPool.execute(
                    `SELECT * FROM character_dialogues 
                     WHERE character_id = ? 
                     ORDER BY created_at DESC 
                     LIMIT ?`,
                    [characterId, limit]
                );
                
                res.json({ dialogues });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Start HTTP server
        this.httpServer = this.app.listen(this.httpPort);
    }
    
    setupWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            const connectionId = this.generateConnectionId();
            console.log(`🔌 New connection: ${connectionId}`);
            
            const connection = {
                id: connectionId,
                ws,
                characterId: null,
                authenticated: false,
                lastActivity: Date.now()
            };
            
            this.connections.set(connectionId, connection);
            
            // Send welcome message
            this.sendMessage(ws, {
                type: 'connected',
                connectionId,
                message: 'Character Command Interface connected. Authenticate to begin.'
            });
            
            // Handle messages
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleCommand(connectionId, data);
                } catch (error) {
                    this.sendMessage(ws, {
                        type: 'error',
                        error: 'Invalid message format'
                    });
                }
            });
            
            // Handle disconnect
            ws.on('close', () => {
                console.log(`🔌 Disconnected: ${connectionId}`);
                this.handleDisconnect(connectionId);
            });
            
            ws.on('error', (error) => {
                console.error(`WebSocket error for ${connectionId}:`, error);
            });
        });
    }
    
    async handleCommand(connectionId, data) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        connection.lastActivity = Date.now();
        
        switch (data.type) {
            case 'auth':
                await this.handleAuth(connection, data);
                break;
                
            case 'dialogue':
                await this.handleDialogue(connection, data);
                break;
                
            case 'quest':
                await this.handleQuest(connection, data);
                break;
                
            case 'subscribe':
                await this.handleSubscribe(connection, data);
                break;
                
            default:
                this.sendMessage(connection.ws, {
                    type: 'error',
                    error: 'Unknown command type'
                });
        }
    }
    
    async handleAuth(connection, data) {
        try {
            const { characterId, token } = data;
            
            // Verify character ownership (simplified for demo)
            const [characters] = await this.dbPool.execute(
                'SELECT id, character_name FROM characters WHERE id = ?',
                [characterId]
            );
            
            if (characters.length === 0) {
                throw new Error('Character not found');
            }
            
            connection.characterId = characterId;
            connection.authenticated = true;
            connection.characterName = characters[0].character_name;
            
            // Track session
            this.characterSessions.set(characterId, connection);
            
            this.sendMessage(connection.ws, {
                type: 'authenticated',
                characterId,
                characterName: connection.characterName,
                message: `Welcome, ${connection.characterName}! You can now send dialogues.`
            });
            
            // Load recent dialogues
            await this.sendRecentDialogues(connection);
            
        } catch (error) {
            this.sendMessage(connection.ws, {
                type: 'auth_failed',
                error: error.message
            });
        }
    }
    
    async handleDialogue(connection, data) {
        if (!connection.authenticated) {
            this.sendMessage(connection.ws, {
                type: 'error',
                error: 'Not authenticated'
            });
            return;
        }
        
        try {
            const { content: rawContent } = data;
            
            // Validate and sanitize content
            const validation = this.validator.validate(rawContent, {
                allowEmpty: false,
                stripHtml: true
            });
            
            if (!validation.valid) {
                throw new Error(validation.error || 'Invalid content');
            }
            
            const content = validation.content;
            
            // Log if content was transformed
            if (validation.transformed) {
                console.log(`Content transformed for character ${connection.characterId}:`, {
                    original: validation.original,
                    transformed: content,
                    type: validation.type
                });
            }
            
            // Parse content for special symbols
            const parsed = this.parseContent(content);
            
            // Store dialogue in database with validation metadata
            const [result] = await this.dbPool.execute(
                `INSERT INTO character_dialogues 
                (character_id, content, symbols, dialogue_type, mentions, tags, actions, queries, source, context) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    connection.characterId,
                    content,
                    parsed.symbols,
                    parsed.dialogueType,
                    JSON.stringify(parsed.mentions),
                    JSON.stringify(parsed.tags),
                    JSON.stringify(parsed.actions),
                    JSON.stringify(parsed.queries),
                    'websocket',
                    JSON.stringify({
                        validation: {
                            type: validation.type,
                            transformed: validation.transformed,
                            originalLength: validation.original ? validation.original.length : 0
                        }
                    })
                ]
            );
            
            const dialogueId = result.insertId;
            
            // Process special commands
            await this.processSpecialCommands(connection, parsed, dialogueId);
            
            // Broadcast to subscribers
            this.broadcastDialogue({
                id: dialogueId,
                characterId: connection.characterId,
                characterName: connection.characterName,
                content,
                parsed,
                timestamp: new Date()
            });
            
            // Send confirmation
            this.sendMessage(connection.ws, {
                type: 'dialogue_sent',
                dialogueId,
                parsed,
                message: 'Dialogue processed successfully'
            });
            
        } catch (error) {
            console.error('Dialogue error:', error);
            this.sendMessage(connection.ws, {
                type: 'error',
                error: error.message
            });
        }
    }
    
    parseContent(content) {
        const result = {
            symbols: '',
            dialogueType: 'chat',
            mentions: [],
            tags: [],
            actions: [],
            queries: []
        };
        
        // Extract all symbols
        const symbolMatch = content.match(/[@#!?]+/g);
        if (symbolMatch) {
            result.symbols = symbolMatch.join('');
        }
        
        // Parse mentions (@username)
        let match;
        while ((match = this.patterns.mention.exec(content)) !== null) {
            result.mentions.push(match[1]);
        }
        
        // Parse tags (#tag)
        this.patterns.tag.lastIndex = 0;
        while ((match = this.patterns.tag.exec(content)) !== null) {
            result.tags.push(match[1]);
        }
        
        // Parse actions (!action)
        this.patterns.action.lastIndex = 0;
        while ((match = this.patterns.action.exec(content)) !== null) {
            result.actions.push({
                action: match[1],
                params: match[2] ? match[2].split(',').map(p => p.trim()) : []
            });
        }
        
        // Parse queries (?query)
        this.patterns.query.lastIndex = 0;
        while ((match = this.patterns.query.exec(content)) !== null) {
            result.queries.push(match[1]);
        }
        
        // Determine dialogue type
        if (result.actions.length > 0) {
            result.dialogueType = 'action';
        } else if (result.queries.length > 0) {
            result.dialogueType = 'quest';
        } else if (result.mentions.length > 0) {
            result.dialogueType = 'mention';
        } else if (result.tags.length > 0) {
            result.dialogueType = 'command';
        }
        
        // Check for special patterns
        if (content.includes('!!')) {
            result.dialogueType = 'quest_important';
        } else if (content.includes('??')) {
            result.dialogueType = 'help_request';
        }
        
        return result;
    }
    
    async processSpecialCommands(connection, parsed, dialogueId) {
        // Process mentions - notify mentioned characters
        for (const mention of parsed.mentions) {
            await this.processMention(connection, mention, dialogueId);
        }
        
        // Process actions - execute commands
        for (const action of parsed.actions) {
            await this.processAction(connection, action, dialogueId);
        }
        
        // Process queries - create help requests or quests
        for (const query of parsed.queries) {
            await this.processQuery(connection, query, dialogueId);
        }
        
        // Process tags - categorize content
        for (const tag of parsed.tags) {
            await this.processTag(connection, tag, dialogueId);
        }
    }
    
    async processMention(connection, mentionedName, dialogueId) {
        // Find mentioned character
        const [characters] = await this.dbPool.execute(
            'SELECT id FROM characters WHERE character_name = ?',
            [mentionedName]
        );
        
        if (characters.length > 0) {
            const mentionedId = characters[0].id;
            
            // Create notification event
            await this.dbPool.execute(
                `INSERT INTO character_events 
                (character_id, event_type, event_data, trigger_overlay) 
                VALUES (?, ?, ?, ?)`,
                [
                    mentionedId,
                    'mentioned',
                    JSON.stringify({
                        by_character: connection.characterId,
                        by_name: connection.characterName,
                        dialogue_id: dialogueId
                    }),
                    true
                ]
            );
            
            // Notify if online
            const mentionedConnection = this.characterSessions.get(mentionedId);
            if (mentionedConnection) {
                this.sendMessage(mentionedConnection.ws, {
                    type: 'mentioned',
                    by: connection.characterName,
                    dialogueId
                });
            }
        }
    }
    
    async processAction(connection, action, dialogueId) {
        console.log(`⚡ Processing action: ${action.action}`, action.params);
        
        // Common game actions
        switch (action.action) {
            case 'quest':
                if (action.params[0]) {
                    await this.createQuest(connection, action.params[0], dialogueId);
                }
                break;
                
            case 'trade':
                if (action.params[0]) {
                    await this.initiateTrade(connection, action.params[0], dialogueId);
                }
                break;
                
            case 'teleport':
                if (action.params[0]) {
                    await this.teleportCharacter(connection, action.params[0], dialogueId);
                }
                break;
                
            default:
                // Custom action
                await this.dbPool.execute(
                    `INSERT INTO character_events 
                    (character_id, event_type, event_data) 
                    VALUES (?, ?, ?)`,
                    [
                        connection.characterId,
                        'custom_action',
                        JSON.stringify({ action: action.action, params: action.params })
                    ]
                );
        }
    }
    
    async processQuery(connection, query, dialogueId) {
        console.log(`❓ Processing query: ${query}`);
        
        // Create a quest or help request
        if (query === 'help' || query === 'quest') {
            await this.dbPool.execute(
                `INSERT INTO character_quests 
                (character_id, quest_name, quest_type, quest_description, overlay_data) 
                VALUES (?, ?, ?, ?, ?)`,
                [
                    connection.characterId,
                    `Help Request #${dialogueId}`,
                    '?',
                    `Character needs help with: ${query}`,
                    JSON.stringify({
                        icon: 'question_blue',
                        color: '#4169E1',
                        position: 'above_head',
                        animation: 'bounce'
                    })
                ]
            );
        }
    }
    
    async processTag(connection, tag, dialogueId) {
        console.log(`🏷️ Processing tag: #${tag}`);
        
        // Tags can be used for categorization, triggers, etc.
        // For now, just log them with the dialogue
    }
    
    async createQuest(connection, questName, dialogueId) {
        const [result] = await this.dbPool.execute(
            `INSERT INTO character_quests 
            (character_id, quest_name, quest_type, quest_description, overlay_data) 
            VALUES (?, ?, ?, ?, ?)`,
            [
                connection.characterId,
                questName,
                '!',
                `Quest created from dialogue #${dialogueId}`,
                JSON.stringify({
                    icon: 'exclamation_yellow',
                    color: '#FFD700',
                    position: 'above_head',
                    animation: 'bounce'
                })
            ]
        );
        
        this.sendMessage(connection.ws, {
            type: 'quest_created',
            questId: result.insertId,
            questName
        });
    }
    
    async sendRecentDialogues(connection) {
        const [dialogues] = await this.dbPool.execute(
            `SELECT * FROM character_dialogues 
             WHERE character_id = ? 
             ORDER BY created_at DESC 
             LIMIT 20`,
            [connection.characterId]
        );
        
        this.sendMessage(connection.ws, {
            type: 'recent_dialogues',
            dialogues: dialogues.map(d => ({
                ...d,
                mentions: JSON.parse(d.mentions || '[]'),
                tags: JSON.parse(d.tags || '[]'),
                actions: JSON.parse(d.actions || '[]'),
                queries: JSON.parse(d.queries || '[]')
            }))
        });
    }
    
    broadcastDialogue(dialogueData) {
        // Broadcast to all connected clients for real-time updates
        this.connections.forEach((connection) => {
            if (connection.authenticated) {
                this.sendMessage(connection.ws, {
                    type: 'new_dialogue',
                    dialogue: dialogueData
                });
            }
        });
        
        this.emit('dialogue', dialogueData);
    }
    
    handleDisconnect(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection && connection.characterId) {
            this.characterSessions.delete(connection.characterId);
        }
        this.connections.delete(connectionId);
    }
    
    sendMessage(ws, data) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }
    
    generateConnectionId() {
        return `conn_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }
    
    async shutdown() {
        console.log('💬 Character Command Interface shutting down...');
        
        // Close all connections
        this.connections.forEach((connection) => {
            connection.ws.close();
        });
        
        if (this.wss) {
            this.wss.close();
        }
        
        if (this.httpServer) {
            this.httpServer.close();
        }
        
        if (this.dbPool) {
            await this.dbPool.end();
        }
    }
}

// Start the service
const commandInterface = new CharacterCommandInterface();

// Handle shutdown
process.on('SIGINT', async () => {
    await commandInterface.shutdown();
    process.exit(0);
});

// Export for testing
module.exports = CharacterCommandInterface;