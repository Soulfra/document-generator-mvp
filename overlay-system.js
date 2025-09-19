#!/usr/bin/env node

/**
 * OVERLAY SYSTEM
 * RuneLite-style overlay renderer for quest markers, dialogue bubbles
 * Displays ! ? @ # symbols above characters with animations
 */

const WebSocket = require('ws');
const express = require('express');
const mysql = require('mysql2/promise');
const { EventEmitter } = require('events');

class OverlaySystem extends EventEmitter {
    constructor() {
        super();
        
        this.app = express();
        this.httpPort = 42007;
        this.wsPort = 42008;
        
        // Active overlays and connections
        this.activeOverlays = new Map();
        this.overlayConnections = new Map();
        this.characterOverlays = new Map();
        
        // Database pool
        this.dbPool = null;
        
        // Overlay configurations
        this.overlayTypes = {
            quest_start: { icon: '!', color: '#FFD700', animation: 'bounce', priority: 1 },
            quest_complete: { icon: '✓', color: '#00FF00', animation: 'pulse', priority: 2 },
            quest_available: { icon: '?', color: '#4169E1', animation: 'none', priority: 3 },
            dialogue_mention: { icon: '@', color: '#FFFFFF', animation: 'fade', priority: 4 },
            action_command: { icon: '⚡', color: '#FF4500', animation: 'pulse', priority: 5 },
            tag_marker: { icon: '#', color: '#9370DB', animation: 'none', priority: 6 },
            help_request: { icon: '?', color: '#FF69B4', animation: 'bounce', priority: 7 }
        };
        
        // Animation settings
        this.animations = {
            bounce: { duration: 1000, ease: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
            pulse: { duration: 2000, ease: 'ease-in-out' },
            fade: { duration: 3000, ease: 'ease-in-out' },
            spin: { duration: 1500, ease: 'linear' },
            none: { duration: 0, ease: 'none' }
        };
        
        console.log('🎨 Overlay System initializing...');
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
            
            // Start overlay monitoring
            this.startOverlayMonitoring();
            
            console.log('🎨 Overlay System ready');
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
                activeOverlays: this.activeOverlays.size,
                connections: this.overlayConnections.size
            });
        });
        
        // Serve overlay demo page
        this.app.get('/overlay-demo', this.serveOverlayDemo.bind(this));
        
        // API endpoints
        this.app.get('/api/overlays/:characterId', this.getCharacterOverlays.bind(this));
        this.app.post('/api/overlays/:characterId/trigger', this.triggerOverlay.bind(this));
        this.app.delete('/api/overlays/:overlayId', this.dismissOverlay.bind(this));
        
        // Start HTTP server
        this.httpServer = this.app.listen(this.httpPort);
    }
    
    setupWebSocketServer() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            const connectionId = this.generateConnectionId();
            console.log(`🔌 Overlay connection: ${connectionId}`);
            
            const connection = {
                id: connectionId,
                ws,
                characterId: null,
                subscribedOverlays: new Set(),
                lastPing: Date.now()
            };
            
            this.overlayConnections.set(connectionId, connection);
            
            // Send welcome message
            this.sendOverlayMessage(ws, {
                type: 'connected',
                connectionId,
                availableOverlays: Object.keys(this.overlayTypes)
            });
            
            // Handle messages
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleOverlayMessage(connectionId, data);
                } catch (error) {
                    this.sendOverlayMessage(ws, {
                        type: 'error',
                        error: 'Invalid message format'
                    });
                }
            });
            
            // Handle disconnect
            ws.on('close', () => {
                console.log(`🔌 Overlay disconnected: ${connectionId}`);
                this.handleOverlayDisconnect(connectionId);
            });
        });
    }
    
    async handleOverlayMessage(connectionId, data) {
        const connection = this.overlayConnections.get(connectionId);
        if (!connection) return;
        
        connection.lastPing = Date.now();
        
        switch (data.type) {
            case 'subscribe':\n                await this.handleOverlaySubscribe(connection, data);\n                break;\n                \n            case 'unsubscribe':\n                this.handleOverlayUnsubscribe(connection, data);\n                break;\n                \n            case 'overlay_clicked':\n                await this.handleOverlayClick(connection, data);\n                break;\n                \n            case 'overlay_dismissed':\n                await this.handleOverlayDismiss(connection, data);\n                break;\n                \n            case 'ping':\n                this.sendOverlayMessage(connection.ws, { type: 'pong' });\n                break;\n                \n            default:\n                this.sendOverlayMessage(connection.ws, {\n                    type: 'error',\n                    error: 'Unknown message type'\n                });\n        }\n    }\n    \n    async handleOverlaySubscribe(connection, data) {\n        const { characterId, overlayTypes } = data;\n        \n        if (characterId) {\n            connection.characterId = characterId;\n            \n            // Subscribe to specific overlay types\n            if (overlayTypes && Array.isArray(overlayTypes)) {\n                overlayTypes.forEach(type => {\n                    connection.subscribedOverlays.add(type);\n                });\n            } else {\n                // Subscribe to all overlay types\n                Object.keys(this.overlayTypes).forEach(type => {\n                    connection.subscribedOverlays.add(type);\n                });\n            }\n            \n            // Send current overlays for this character\n            await this.sendCurrentOverlays(connection, characterId);\n            \n            this.sendOverlayMessage(connection.ws, {\n                type: 'subscribed',\n                characterId,\n                overlayTypes: Array.from(connection.subscribedOverlays)\n            });\n        }\n    }\n    \n    async sendCurrentOverlays(connection, characterId) {\n        try {\n            // Get active overlays from database\n            const [overlays] = await this.dbPool.execute(`\n                SELECT \n                    ce.*,\n                    oc.config_name,\n                    oc.default_icon,\n                    oc.default_color,\n                    oc.default_position,\n                    oc.default_animation,\n                    oc.display_duration\n                FROM character_events ce\n                LEFT JOIN overlay_configs oc ON ce.overlay_config_id = oc.id\n                WHERE ce.character_id = ?\n                AND ce.trigger_overlay = TRUE\n                AND (ce.overlay_shown_at IS NULL OR ce.overlay_shown_at > DATE_SUB(NOW(), INTERVAL 1 HOUR))\n                ORDER BY ce.created_at DESC\n            `, [characterId]);\n            \n            // Get active quests\n            const [quests] = await this.dbPool.execute(`\n                SELECT \n                    id,\n                    quest_name,\n                    quest_type,\n                    status,\n                    overlay_data,\n                    started_at\n                FROM character_quests\n                WHERE character_id = ?\n                AND status = 'active'\n                ORDER BY started_at DESC\n            `, [characterId]);\n            \n            // Send event overlays\n            overlays.forEach(overlay => {\n                const overlayData = {\n                    id: overlay.id,\n                    type: overlay.config_name || 'default',\n                    characterId,\n                    icon: overlay.default_icon || '!',\n                    color: overlay.default_color || '#FFD700',\n                    position: overlay.default_position || 'above_head',\n                    animation: overlay.default_animation || 'bounce',\n                    duration: overlay.display_duration || 0,\n                    eventData: JSON.parse(overlay.event_data || '{}'),\n                    timestamp: overlay.created_at\n                };\n                \n                this.sendOverlayMessage(connection.ws, {\n                    type: 'show_overlay',\n                    overlay: overlayData\n                });\n            });\n            \n            // Send quest overlays\n            quests.forEach(quest => {\n                const overlayData = JSON.parse(quest.overlay_data || '{}');\n                \n                this.sendOverlayMessage(connection.ws, {\n                    type: 'show_overlay',\n                    overlay: {\n                        id: `quest_${quest.id}`,\n                        type: 'quest',\n                        characterId,\n                        icon: quest.quest_type,\n                        color: overlayData.color || (quest.quest_type === '!' ? '#FFD700' : '#4169E1'),\n                        position: overlayData.position || 'above_head',\n                        animation: overlayData.animation || 'bounce',\n                        questName: quest.quest_name,\n                        questType: quest.quest_type,\n                        timestamp: quest.started_at\n                    }\n                });\n            });\n            \n        } catch (error) {\n            console.error('Error sending current overlays:', error);\n        }\n    }\n    \n    async triggerOverlay(req, res) {\n        try {\n            const characterId = parseInt(req.params.characterId);\n            const { type, icon, color, position, animation, duration, data } = req.body;\n            \n            // Create overlay event\n            const [result] = await this.dbPool.execute(`\n                INSERT INTO character_events \n                (character_id, event_type, event_data, trigger_overlay) \n                VALUES (?, ?, ?, TRUE)\n            `, [\n                characterId,\n                type || 'custom_overlay',\n                JSON.stringify(data || {})\n            ]);\n            \n            const overlayId = result.insertId;\n            \n            // Create overlay data\n            const overlayData = {\n                id: overlayId,\n                type: type || 'custom',\n                characterId,\n                icon: icon || '!',\n                color: color || '#FFD700',\n                position: position || 'above_head',\n                animation: animation || 'bounce',\n                duration: duration || 0,\n                data: data || {},\n                timestamp: new Date()\n            };\n            \n            // Broadcast to subscribers\n            this.broadcastOverlay(characterId, overlayData);\n            \n            res.json({\n                success: true,\n                overlayId,\n                message: 'Overlay triggered successfully'\n            });\n            \n        } catch (error) {\n            res.status(500).json({ error: error.message });\n        }\n    }\n    \n    broadcastOverlay(characterId, overlayData) {\n        this.overlayConnections.forEach((connection) => {\n            if (connection.characterId === characterId && \n                connection.subscribedOverlays.has(overlayData.type)) {\n                this.sendOverlayMessage(connection.ws, {\n                    type: 'show_overlay',\n                    overlay: overlayData\n                });\n            }\n        });\n        \n        // Store in active overlays\n        this.activeOverlays.set(overlayData.id, overlayData);\n        \n        // Auto-dismiss after duration\n        if (overlayData.duration > 0) {\n            setTimeout(() => {\n                this.dismissOverlay(overlayData.id);\n            }, overlayData.duration);\n        }\n    }\n    \n    startOverlayMonitoring() {\n        // Monitor for new dialogue events that should trigger overlays\n        setInterval(async () => {\n            await this.checkForNewOverlayTriggers();\n        }, 2000);\n        \n        // Cleanup expired overlays\n        setInterval(() => {\n            this.cleanupExpiredOverlays();\n        }, 30000);\n        \n        // Ping connections\n        setInterval(() => {\n            this.pingConnections();\n        }, 30000);\n    }\n    \n    async checkForNewOverlayTriggers() {\n        try {\n            // Check for new mentions that need overlay triggers\n            const [mentions] = await this.dbPool.execute(`\n                SELECT \n                    cd.id,\n                    cd.character_id,\n                    cd.mentions,\n                    c.character_name\n                FROM character_dialogues cd\n                JOIN characters c ON cd.character_id = c.id\n                WHERE cd.dialogue_type = 'mention'\n                AND cd.created_at > DATE_SUB(NOW(), INTERVAL 30 SECOND)\n                AND JSON_LENGTH(cd.mentions) > 0\n            `);\n            \n            for (const mention of mentions) {\n                const mentionedNames = JSON.parse(mention.mentions || '[]');\n                \n                for (const mentionedName of mentionedNames) {\n                    // Find the mentioned character\n                    const [mentionedChars] = await this.dbPool.execute(\n                        'SELECT id FROM characters WHERE character_name = ?',\n                        [mentionedName]\n                    );\n                    \n                    if (mentionedChars.length > 0) {\n                        const mentionedId = mentionedChars[0].id;\n                        \n                        // Trigger mention overlay\n                        this.broadcastOverlay(mentionedId, {\n                            id: `mention_${mention.id}_${mentionedId}`,\n                            type: 'dialogue_mention',\n                            characterId: mentionedId,\n                            icon: '@',\n                            color: '#FFFFFF',\n                            position: 'above_head',\n                            animation: 'fade',\n                            duration: 5000,\n                            data: {\n                                mentionedBy: mention.character_name,\n                                dialogueId: mention.id\n                            },\n                            timestamp: new Date()\n                        });\n                    }\n                }\n            }\n            \n        } catch (error) {\n            console.error('Error checking overlay triggers:', error);\n        }\n    }\n    \n    serveOverlayDemo(req, res) {\n        const html = `<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>RuneLite-Style Overlay Demo</title>\n    <style>\n        * { margin: 0; padding: 0; box-sizing: border-box; }\n        \n        body {\n            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\n            background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%);\n            color: #fff;\n            min-height: 100vh;\n            overflow: hidden;\n            position: relative;\n        }\n        \n        .game-world {\n            width: 100vw;\n            height: 100vh;\n            position: relative;\n            background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\" viewBox=\"0 0 100 100\"><rect width=\"100\" height=\"100\" fill=\"%23001122\"/><circle cx=\"20\" cy=\"20\" r=\"2\" fill=\"%23334455\"/><circle cx=\"80\" cy=\"40\" r=\"1\" fill=\"%23334455\"/><circle cx=\"40\" cy=\"80\" r=\"1.5\" fill=\"%23334455\"/></svg>');\n        }\n        \n        .character {\n            position: absolute;\n            width: 40px;\n            height: 60px;\n            background: linear-gradient(45deg, #4CAF50, #2E7D32);\n            border-radius: 20px 20px 5px 5px;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            font-size: 20px;\n            cursor: pointer;\n            transition: transform 0.3s ease;\n            user-select: none;\n        }\n        \n        .character:hover {\n            transform: scale(1.1);\n        }\n        \n        .character.warrior { background: linear-gradient(45deg, #F44336, #C62828); }\n        .character.scholar { background: linear-gradient(45deg, #2196F3, #1565C0); }\n        .character.rogue { background: linear-gradient(45deg, #9C27B0, #6A1B9A); }\n        .character.mage { background: linear-gradient(45deg, #FF9800, #E65100); }\n        \n        .character::before {\n            content: attr(data-lineage);\n            font-size: 12px;\n            color: white;\n            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);\n        }\n        \n        .overlay {\n            position: absolute;\n            z-index: 1000;\n            pointer-events: none;\n            font-size: 24px;\n            font-weight: bold;\n            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);\n            transition: all 0.3s ease;\n        }\n        \n        .overlay.above-head {\n            top: -40px;\n            left: 50%;\n            transform: translateX(-50%);\n        }\n        \n        .overlay.bounce {\n            animation: bounce 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite;\n        }\n        \n        .overlay.pulse {\n            animation: pulse 2s ease-in-out infinite;\n        }\n        \n        .overlay.fade {\n            animation: fade 3s ease-in-out infinite;\n        }\n        \n        @keyframes bounce {\n            0%, 100% { transform: translateX(-50%) translateY(0px); }\n            50% { transform: translateX(-50%) translateY(-10px); }\n        }\n        \n        @keyframes pulse {\n            0%, 100% { transform: translateX(-50%) scale(1); opacity: 1; }\n            50% { transform: translateX(-50%) scale(1.2); opacity: 0.8; }\n        }\n        \n        @keyframes fade {\n            0%, 100% { opacity: 1; }\n            50% { opacity: 0.5; }\n        }\n        \n        .controls {\n            position: fixed;\n            top: 20px;\n            left: 20px;\n            background: rgba(0,0,0,0.8);\n            padding: 20px;\n            border-radius: 10px;\n            z-index: 2000;\n        }\n        \n        .controls h3 {\n            margin-bottom: 15px;\n            color: #00ff88;\n        }\n        \n        .controls button {\n            display: block;\n            width: 100%;\n            margin: 5px 0;\n            padding: 8px 15px;\n            background: linear-gradient(135deg, #00ff88, #00bbff);\n            border: none;\n            border-radius: 5px;\n            color: #0f0f23;\n            font-weight: bold;\n            cursor: pointer;\n            transition: transform 0.2s ease;\n        }\n        \n        .controls button:hover {\n            transform: translateY(-2px);\n        }\n        \n        .status {\n            position: fixed;\n            bottom: 20px;\n            left: 20px;\n            background: rgba(0,0,0,0.8);\n            padding: 15px;\n            border-radius: 10px;\n            font-family: monospace;\n            font-size: 12px;\n        }\n        \n        .chat-box {\n            position: fixed;\n            bottom: 20px;\n            right: 20px;\n            width: 300px;\n            max-height: 200px;\n            background: rgba(0,0,0,0.9);\n            border-radius: 10px;\n            padding: 15px;\n            overflow-y: auto;\n        }\n        \n        .chat-input {\n            width: 100%;\n            padding: 8px;\n            border: none;\n            border-radius: 5px;\n            background: rgba(255,255,255,0.1);\n            color: white;\n            margin-top: 10px;\n        }\n        \n        .chat-input::placeholder {\n            color: rgba(255,255,255,0.5);\n        }\n    </style>\n</head>\n<body>\n    <div class=\"game-world\" id=\"gameWorld\">\n        <!-- Characters will be placed here -->\n    </div>\n    \n    <div class=\"controls\">\n        <h3>Overlay Demo</h3>\n        <button onclick=\"triggerQuest()\">! Start Quest</button>\n        <button onclick=\"triggerHelp()\">? Need Help</button>\n        <button onclick=\"triggerMention()\">@ Mention Player</button>\n        <button onclick=\"triggerAction()\">⚡ Action Command</button>\n        <button onclick=\"clearOverlays()\">Clear All</button>\n    </div>\n    \n    <div class=\"status\" id=\"status\">\n        Status: Connecting...\n    </div>\n    \n    <div class=\"chat-box\">\n        <div id=\"chatLog\">Type with @, #, !, ? symbols</div>\n        <input type=\"text\" class=\"chat-input\" id=\"chatInput\" placeholder=\"Type: !quest(dragon) or ?help or @player\">\n    </div>\n    \n    <script>\n        let ws = null;\n        let characters = [];\n        let overlays = new Map();\n        \n        // Character data\n        const characterData = [\n            { id: 1, name: 'Alice', lineage: 'WARRIOR', x: 200, y: 300 },\n            { id: 2, name: 'Bob', lineage: 'SCHOLAR', x: 400, y: 200 },\n            { id: 3, name: 'Carol', lineage: 'ROGUE', x: 600, y: 350 },\n            { id: 4, name: 'Dave', lineage: 'MAGE', x: 300, y: 500 }\n        ];\n        \n        function initDemo() {\n            createCharacters();\n            connectWebSocket();\n            setupChat();\n        }\n        \n        function createCharacters() {\n            const gameWorld = document.getElementById('gameWorld');\n            \n            characterData.forEach(char => {\n                const charElement = document.createElement('div');\n                charElement.className = \\`character \\${char.lineage.toLowerCase()}\\`;\n                charElement.id = \\`char_\\${char.id}\\`;\n                charElement.setAttribute('data-lineage', char.lineage.substring(0, 1));\n                charElement.style.left = char.x + 'px';\n                charElement.style.top = char.y + 'px';\n                \n                charElement.addEventListener('click', () => selectCharacter(char.id));\n                \n                gameWorld.appendChild(charElement);\n                characters.push(char);\n            });\n        }\n        \n        function connectWebSocket() {\n            ws = new WebSocket('ws://localhost:42008');\n            \n            ws.onopen = () => {\n                updateStatus('Connected to Overlay System');\n                \n                // Subscribe to all overlay types\n                ws.send(JSON.stringify({\n                    type: 'subscribe',\n                    characterId: 1, // Default to first character\n                    overlayTypes: ['quest_start', 'quest_available', 'dialogue_mention', 'action_command']\n                }));\n            };\n            \n            ws.onmessage = (event) => {\n                const data = JSON.parse(event.data);\n                handleOverlayMessage(data);\n            };\n            \n            ws.onclose = () => {\n                updateStatus('Disconnected');\n                setTimeout(connectWebSocket, 2000);\n            };\n        }\n        \n        function handleOverlayMessage(data) {\n            switch (data.type) {\n                case 'connected':\n                    updateStatus('Overlay System Connected');\n                    break;\n                    \n                case 'show_overlay':\n                    showOverlay(data.overlay);\n                    break;\n                    \n                case 'hide_overlay':\n                    hideOverlay(data.overlayId);\n                    break;\n            }\n        }\n        \n        function showOverlay(overlayData) {\n            const charElement = document.getElementById(\\`char_\\${overlayData.characterId}\\`);\n            if (!charElement) return;\n            \n            // Remove existing overlay if any\n            const existingOverlay = charElement.querySelector('.overlay');\n            if (existingOverlay) {\n                existingOverlay.remove();\n            }\n            \n            // Create overlay element\n            const overlay = document.createElement('div');\n            overlay.className = \\`overlay \\${overlayData.position.replace('_', '-')} \\${overlayData.animation}\\`;\n            overlay.textContent = overlayData.icon;\n            overlay.style.color = overlayData.color;\n            overlay.id = \\`overlay_\\${overlayData.id}\\`;\n            \n            charElement.appendChild(overlay);\n            overlays.set(overlayData.id, overlay);\n            \n            // Auto-dismiss if duration is set\n            if (overlayData.duration > 0) {\n                setTimeout(() => {\n                    hideOverlay(overlayData.id);\n                }, overlayData.duration);\n            }\n            \n            updateStatus(\\`Overlay shown: \\${overlayData.icon} on character \\${overlayData.characterId}\\`);\n        }\n        \n        function hideOverlay(overlayId) {\n            const overlay = overlays.get(overlayId);\n            if (overlay) {\n                overlay.remove();\n                overlays.delete(overlayId);\n            }\n        }\n        \n        function triggerQuest() {\n            triggerOverlayAPI(1, {\n                type: 'quest_start',\n                icon: '!',\n                color: '#FFD700',\n                animation: 'bounce',\n                duration: 10000\n            });\n        }\n        \n        function triggerHelp() {\n            triggerOverlayAPI(2, {\n                type: 'quest_available',\n                icon: '?',\n                color: '#4169E1',\n                animation: 'pulse',\n                duration: 8000\n            });\n        }\n        \n        function triggerMention() {\n            triggerOverlayAPI(3, {\n                type: 'dialogue_mention',\n                icon: '@',\n                color: '#FFFFFF',\n                animation: 'fade',\n                duration: 5000\n            });\n        }\n        \n        function triggerAction() {\n            triggerOverlayAPI(4, {\n                type: 'action_command',\n                icon: '⚡',\n                color: '#FF4500',\n                animation: 'pulse',\n                duration: 3000\n            });\n        }\n        \n        function triggerOverlayAPI(characterId, overlayData) {\n            fetch(\\`http://localhost:42007/api/overlays/\\${characterId}/trigger\\`, {\n                method: 'POST',\n                headers: { 'Content-Type': 'application/json' },\n                body: JSON.stringify(overlayData)\n            });\n        }\n        \n        function clearOverlays() {\n            overlays.forEach((overlay, id) => {\n                hideOverlay(id);\n            });\n            updateStatus('All overlays cleared');\n        }\n        \n        function setupChat() {\n            const chatInput = document.getElementById('chatInput');\n            \n            chatInput.addEventListener('keypress', (e) => {\n                if (e.key === 'Enter') {\n                    const message = chatInput.value.trim();\n                    if (message) {\n                        processMessage(message);\n                        chatInput.value = '';\n                    }\n                }\n            });\n        }\n        \n        function processMessage(message) {\n            const chatLog = document.getElementById('chatLog');\n            chatLog.innerHTML += \\`<div>\\${message}</div>\\`;\n            chatLog.scrollTop = chatLog.scrollHeight;\n            \n            // Parse symbols and trigger overlays\n            if (message.includes('!')) {\n                triggerQuest();\n            }\n            if (message.includes('?')) {\n                triggerHelp();\n            }\n            if (message.includes('@')) {\n                triggerMention();\n            }\n        }\n        \n        function updateStatus(status) {\n            document.getElementById('status').textContent = \\`Status: \\${status}\\`;\n        }\n        \n        function selectCharacter(characterId) {\n            updateStatus(\\`Selected character \\${characterId}\\`);\n            \n            // Subscribe to this character's overlays\n            if (ws && ws.readyState === WebSocket.OPEN) {\n                ws.send(JSON.stringify({\n                    type: 'subscribe',\n                    characterId\n                }));\n            }\n        }\n        \n        // Initialize demo when page loads\n        initDemo();\n    </script>\n</body>\n</html>`;\n        \n        res.send(html);\n    }\n    \n    cleanupExpiredOverlays() {\n        const now = Date.now();\n        \n        this.activeOverlays.forEach((overlay, id) => {\n            if (overlay.duration > 0 && \n                (now - new Date(overlay.timestamp).getTime()) > overlay.duration) {\n                this.activeOverlays.delete(id);\n            }\n        });\n    }\n    \n    pingConnections() {\n        this.overlayConnections.forEach((connection, id) => {\n            if (Date.now() - connection.lastPing > 60000) {\n                // Connection inactive for over 1 minute\n                connection.ws.close();\n            } else {\n                this.sendOverlayMessage(connection.ws, { type: 'ping' });\n            }\n        });\n    }\n    \n    handleOverlayDisconnect(connectionId) {\n        this.overlayConnections.delete(connectionId);\n    }\n    \n    sendOverlayMessage(ws, data) {\n        if (ws.readyState === WebSocket.OPEN) {\n            ws.send(JSON.stringify(data));\n        }\n    }\n    \n    generateConnectionId() {\n        return `overlay_${Date.now()}_${Math.random().toString(36).substring(7)}`;\n    }\n    \n    async shutdown() {\n        console.log('🎨 Overlay System shutting down...');\n        \n        // Close all connections\n        this.overlayConnections.forEach((connection) => {\n            connection.ws.close();\n        });\n        \n        if (this.wss) {\n            this.wss.close();\n        }\n        \n        if (this.httpServer) {\n            this.httpServer.close();\n        }\n        \n        if (this.dbPool) {\n            await this.dbPool.end();\n        }\n    }\n}\n\n// Start the service\nconst overlaySystem = new OverlaySystem();\n\n// Handle shutdown\nprocess.on('SIGINT', async () => {\n    await overlaySystem.shutdown();\n    process.exit(0);\n});\n\nmodule.exports = OverlaySystem;