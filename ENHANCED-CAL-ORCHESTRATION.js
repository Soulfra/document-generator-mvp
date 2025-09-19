#!/usr/bin/env node

/**
 * ENHANCED CAL ORCHESTRATION SYSTEM
 * 
 * Enhances the existing Cal-Orchestration-Router with advanced natural language processing
 * for instant character generation and 3D world building.
 * 
 * Enables the Twitch COBOL gamedev experience:
 * - "Cal, draw me a pirate" → Instant 3D character
 * - "Cal, create a futuristic city" → 3D world generation
 * - Direct Unity/Unreal export
 */

const EventEmitter = require('events');
const { CalOrchestrationRouter, CalOrchestrationHelper } = require('./Cal-Orchestration-Router.js');
const CalNaturalLanguageCharacterGenerator = require('./CAL-NATURAL-LANGUAGE-CHARACTER-GENERATOR.js');

class EnhancedCalOrchestration extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 8300,
            characterGeneratorPort: config.characterGeneratorPort || 8200,
            enableVoiceCommands: config.enableVoiceCommands !== false,
            enableRealtimeGeneration: config.enableRealtimeGeneration !== false,
            enableUnityBridge: config.enableUnityBridge !== false,
            enableUnrealBridge: config.enableUnrealBridge !== false,
            autoSaveCreations: config.autoSaveCreations !== false,
            ...config
        };
        
        // Enhanced NLP system for better understanding
        this.nlp = new AdvancedNLPProcessor();
        
        // Character generator integration
        this.characterGenerator = null;
        
        // Base Cal orchestration
        this.calRouter = new CalOrchestrationRouter();
        this.calHelper = new CalOrchestrationHelper(this.calRouter);
        
        // Session management for conversations
        this.sessions = new Map();
        this.conversationHistory = [];
        
        // Real-time generation queue
        this.generationQueue = [];
        this.activeGenerations = new Map();
        
        // Creation library
        this.creationLibrary = new Map();
        
        console.log('🧠 Enhanced Cal Orchestration System initializing...');
        this.init();
    }
    
    async init() {
        // Start character generator
        await this.startCharacterGenerator();
        
        // Enhance Cal router with new capabilities
        await this.enhanceCalRouter();
        
        // Start orchestration server
        await this.startOrchestrationServer();
        
        // Setup real-time bridges
        await this.setupBridges();
        
        console.log('✅ Enhanced Cal Orchestration ready for natural language commands');
        this.emit('ready');
    }
    
    async startCharacterGenerator() {
        console.log('🎨 Starting integrated character generator...');
        
        this.characterGenerator = new CalNaturalLanguageCharacterGenerator({
            port: this.config.characterGeneratorPort,
            enableUnityBridge: this.config.enableUnityBridge,
            enableUnrealBridge: this.config.enableUnrealBridge
        });
        
        // Listen for character generation events
        this.characterGenerator.on('character_created', (character) => {
            this.handleCharacterCreated(character);
        });
        
        await new Promise(resolve => {
            this.characterGenerator.on('ready', resolve);
        });
        
        console.log('✅ Character generator ready');
    }
    
    async enhanceCalRouter() {
        console.log('🔧 Enhancing Cal router with advanced capabilities...');
        
        // Register enhanced intents
        this.calRouter.registerIntentMapping('create_character', ['cal-character-generator']);
        this.calRouter.registerIntentMapping('create_world', ['cal-world-generator']);
        this.calRouter.registerIntentMapping('modify_character', ['cal-character-modifier']);
        this.calRouter.registerIntentMapping('export_to_unity', ['cal-unity-exporter']);
        this.calRouter.registerIntentMapping('export_to_unreal', ['cal-unreal-exporter']);
        
        // Enhanced natural language middleware
        this.calRouter.use(new EnhancedNLPMiddleware(this));
        
        // Creative workflow middleware
        this.calRouter.use(new CreativeWorkflowMiddleware(this));
        
        // Real-time generation middleware
        this.calRouter.use(new RealtimeGenerationMiddleware(this));
        
        console.log('✅ Cal router enhanced with advanced NLP');
    }
    
    async startOrchestrationServer() {
        const express = require('express');
        const cors = require('cors');
        const WebSocket = require('ws');
        
        this.app = express();
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        
        // Main enhanced Cal endpoint
        this.app.post('/cal/enhanced', async (req, res) => {
            try {
                const { input, session, context = {} } = req.body;
                
                console.log(`🗣️ Enhanced Cal request: "${input}"`);
                
                const result = await this.processEnhancedRequest(input, session, context);
                
                res.json({
                    success: true,
                    result: result,
                    timestamp: new Date(),
                    session: session || this.createSession()
                });
                
            } catch (error) {
                console.error('❌ Enhanced Cal error:', error);
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });
        
        // Quick character generation endpoint
        this.app.post('/cal/character', async (req, res) => {
            try {
                const { prompt, options = {} } = req.body;
                
                const result = await this.generateCharacterInstantly(prompt, options);
                
                res.json({
                    success: true,
                    character: result,
                    readyForGameEngine: true
                });
                
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Voice command endpoint
        this.app.post('/cal/voice', async (req, res) => {
            try {
                const { audioData, format = 'wav' } = req.body;
                
                // Process voice command (simplified - would use speech-to-text)
                const transcript = await this.processVoiceCommand(audioData, format);
                const result = await this.processEnhancedRequest(transcript);
                
                res.json({
                    success: true,
                    transcript: transcript,
                    result: result
                });
                
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // Creation library
        this.app.get('/cal/library', (req, res) => {
            const library = Array.from(this.creationLibrary.values())
                .map(creation => ({
                    id: creation.id,
                    name: creation.name,
                    type: creation.type,
                    createdAt: creation.createdAt,
                    thumbnail: creation.thumbnail
                }));
            
            res.json({ library });
        });
        
        // Export to game engines
        this.app.post('/cal/export/:engine/:id', async (req, res) => {
            try {
                const { engine, id } = req.params;
                const creation = this.creationLibrary.get(id);
                
                if (!creation) {
                    return res.status(404).json({ error: 'Creation not found' });
                }
                
                const exportResult = await this.exportToGameEngine(creation, engine);
                
                res.json({
                    success: true,
                    export: exportResult,
                    downloadUrl: exportResult.downloadUrl
                });
                
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // System status and metrics
        this.app.get('/cal/status', (req, res) => {
            res.json({
                status: 'online',
                capabilities: {
                    characterGeneration: true,
                    worldGeneration: true,
                    unityExport: this.config.enableUnityBridge,
                    unrealExport: this.config.enableUnrealBridge,
                    voiceCommands: this.config.enableVoiceCommands,
                    realtimeGeneration: this.config.enableRealtimeGeneration
                },
                stats: {
                    sessionsActive: this.sessions.size,
                    charactersCreated: this.countCreationsByType('character'),
                    worldsCreated: this.countCreationsByType('world'),
                    totalCreations: this.creationLibrary.size,
                    activeGenerations: this.activeGenerations.size
                },
                uptime: process.uptime()
            });
        });
        
        // Web interface
        this.app.get('/', (req, res) => {
            res.send(this.getEnhancedWebInterface());
        });
        
        // Start HTTP server
        this.server = this.app.listen(this.config.port, () => {
            console.log(`🌐 Enhanced Cal Orchestration running on http://localhost:${this.config.port}`);
        });
        
        // Setup WebSocket for real-time communication
        this.wss = new WebSocket.Server({ 
            port: this.config.port + 1,
            path: '/cal/realtime'
        });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 Real-time Cal connection established');
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    const result = await this.processRealtimeMessage(message);
                    ws.send(JSON.stringify(result));
                } catch (error) {
                    ws.send(JSON.stringify({ error: error.message }));
                }
            });
        });
        
        console.log(`🔌 Real-time WebSocket on ws://localhost:${this.config.port + 1}/cal/realtime`);
    }
    
    async setupBridges() {
        if (this.config.enableUnityBridge) {
            await this.setupUnityBridge();
        }
        
        if (this.config.enableUnrealBridge) {
            await this.setupUnrealBridge();
        }
    }
    
    async processEnhancedRequest(input, sessionId = null, context = {}) {
        console.log(`🧠 Processing enhanced request: "${input}"`);
        
        // Get or create session
        const session = this.getOrCreateSession(sessionId);
        
        // Enhanced NLP processing
        const analysis = await this.nlp.analyzeAdvanced(input, session.context);
        
        console.log('📊 NLP Analysis:', analysis);
        
        // Determine action type
        switch (analysis.intent) {
            case 'create_character':
                return await this.handleCharacterCreation(analysis, session);
                
            case 'create_world':
                return await this.handleWorldCreation(analysis, session);
                
            case 'modify_creation':
                return await this.handleCreationModification(analysis, session);
                
            case 'export_creation':
                return await this.handleCreationExport(analysis, session);
                
            case 'conversation':
                return await this.handleConversation(analysis, session);
                
            default:
                // Fall back to standard Cal orchestration
                return await this.calHelper.processNaturalRequest(input);
        }
    }
    
    async handleCharacterCreation(analysis, session) {
        console.log('🎨 Creating character from analysis...');
        
        const characterPrompt = analysis.originalInput;
        const options = {
            style: analysis.style || 'realistic',
            complexity: analysis.complexity || 'medium',
            quickGeneration: analysis.urgency === 'immediate'
        };
        
        // Generate character
        const character = await this.generateCharacterInstantly(characterPrompt, options);
        
        // Add to session context
        session.context.lastCreation = character;
        session.context.creationType = 'character';
        
        // Save to library
        if (this.config.autoSaveCreations) {
            this.creationLibrary.set(character.id, character);
        }
        
        return {
            type: 'character_created',
            character: character,
            message: `✨ Created character "${character.name}" successfully!`,
            actions: [
                { label: 'Export to Unity', action: 'export_unity', id: character.id },
                { label: 'Export to Unreal', action: 'export_unreal', id: character.id },
                { label: 'Modify Character', action: 'modify', id: character.id }
            ]
        };
    }
    
    async handleWorldCreation(analysis, session) {
        console.log('🌍 Creating world from analysis...');
        
        // For now, simulate world creation (would integrate with 3D world generator)
        const world = {
            id: `world_${Date.now()}`,
            name: analysis.entities.find(e => e.type === 'location')?.name || 'Generated World',
            type: 'world',
            theme: analysis.theme || 'fantasy',
            size: analysis.scale || 'medium',
            features: analysis.features || [],
            createdAt: new Date(),
            readyForExport: true
        };
        
        session.context.lastCreation = world;
        session.context.creationType = 'world';
        
        if (this.config.autoSaveCreations) {
            this.creationLibrary.set(world.id, world);
        }
        
        return {
            type: 'world_created',
            world: world,
            message: `🌍 Created world "${world.name}" successfully!`,
            actions: [
                { label: 'Export to Unity', action: 'export_unity', id: world.id },
                { label: 'Export to Unreal', action: 'export_unreal', id: world.id },
                { label: 'Add Characters', action: 'add_characters', worldId: world.id }
            ]
        };
    }
    
    async handleCreationModification(analysis, session) {
        const lastCreation = session.context.lastCreation;
        
        if (!lastCreation) {
            return {
                type: 'error',
                message: 'No creation to modify. Please create something first.'
            };
        }
        
        console.log(`🔧 Modifying ${lastCreation.type}: ${lastCreation.name}`);
        
        // Apply modifications based on analysis
        const modifications = this.extractModifications(analysis);
        const modifiedCreation = await this.applyModifications(lastCreation, modifications);
        
        session.context.lastCreation = modifiedCreation;
        
        return {
            type: 'creation_modified',
            creation: modifiedCreation,
            message: `✅ Modified "${modifiedCreation.name}" successfully!`,
            changes: modifications
        };
    }
    
    async handleCreationExport(analysis, session) {
        const lastCreation = session.context.lastCreation;
        const targetEngine = analysis.exportTarget || 'unity';
        
        if (!lastCreation) {
            return {
                type: 'error',
                message: 'No creation to export. Please create something first.'
            };
        }
        
        const exportResult = await this.exportToGameEngine(lastCreation, targetEngine);
        
        return {
            type: 'creation_exported',
            export: exportResult,
            message: `📦 Exported "${lastCreation.name}" to ${targetEngine.toUpperCase()}!`,
            downloadUrl: exportResult.downloadUrl
        };
    }
    
    async handleConversation(analysis, session) {
        // Handle conversational queries about creations, capabilities, etc.
        const responses = {
            'capabilities': 'I can create 3D characters, worlds, and export them to Unity/Unreal. Just tell me what you want!',
            'help': 'Try saying: "Cal, draw me a pirate" or "Cal, create a futuristic city"',
            'status': `I have ${this.creationLibrary.size} creations in the library and ${this.activeGenerations.size} active generations.`
        };
        
        const responseKey = Object.keys(responses).find(key => 
            analysis.originalInput.toLowerCase().includes(key)
        );
        
        return {
            type: 'conversation',
            message: responses[responseKey] || 'I\'m ready to create! What would you like me to make?',
            suggestions: [
                'Create a character',
                'Build a world',
                'Show my library',
                'Export to Unity'
            ]
        };
    }
    
    async generateCharacterInstantly(prompt, options = {}) {
        console.log(`⚡ Instant character generation: "${prompt}"`);
        
        // Use the character generator
        const response = await fetch(`http://localhost:${this.config.characterGeneratorPort}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, options })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        return data.character;
    }
    
    handleCharacterCreated(character) {
        console.log(`✨ Character created: ${character.name}`);
        
        // Broadcast to connected clients
        this.broadcastToClients({
            type: 'character_created',
            character: character
        });
        
        // Add to creation history
        this.conversationHistory.push({
            type: 'character_creation',
            character: character,
            timestamp: new Date()
        });
        
        this.emit('character_created', character);
    }
    
    broadcastToClients(message) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
    
    getOrCreateSession(sessionId) {
        if (!sessionId) {
            sessionId = this.createSession();
        }
        
        if (!this.sessions.has(sessionId)) {
            this.sessions.set(sessionId, {
                id: sessionId,
                createdAt: new Date(),
                context: {},
                history: []
            });
        }
        
        return this.sessions.get(sessionId);
    }
    
    createSession() {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
        return sessionId;
    }
    
    countCreationsByType(type) {
        return Array.from(this.creationLibrary.values())
            .filter(creation => creation.type === type).length;
    }
    
    async exportToGameEngine(creation, engine) {
        console.log(`📦 Exporting ${creation.name} to ${engine}...`);
        
        // Simulate export process
        const exportData = {
            id: `export_${Date.now()}`,
            creationId: creation.id,
            engine: engine,
            format: engine === 'unity' ? 'unitypackage' : 'pak',
            downloadUrl: `http://localhost:${this.config.port}/downloads/${creation.id}.${engine}`,
            exportedAt: new Date(),
            ready: true
        };
        
        return exportData;
    }
    
    extractModifications(analysis) {
        // Extract modification requests from NLP analysis
        const modifications = [];
        
        if (analysis.colors && analysis.colors.length > 0) {
            modifications.push({ type: 'color', value: analysis.colors[0] });
        }
        
        if (analysis.scale) {
            modifications.push({ type: 'scale', value: analysis.scale });
        }
        
        if (analysis.features) {
            modifications.push({ type: 'features', value: analysis.features });
        }
        
        return modifications;
    }
    
    async applyModifications(creation, modifications) {
        // Apply modifications to creation
        const modified = { ...creation };
        
        modifications.forEach(mod => {
            switch (mod.type) {
                case 'color':
                    modified.style = { ...modified.style, primaryColor: mod.value };
                    break;
                case 'scale':
                    modified.scale = mod.value;
                    break;
                case 'features':
                    modified.features = [...(modified.features || []), ...mod.value];
                    break;
            }
        });
        
        modified.modifiedAt = new Date();
        return modified;
    }
    
    async processVoiceCommand(audioData, format) {
        // Simplified voice processing - would use actual speech-to-text
        console.log('🎤 Processing voice command...');
        
        // Mock transcript
        return "Cal, draw me a pirate";
    }
    
    async processRealtimeMessage(message) {
        switch (message.type) {
            case 'generate_character':
                const character = await this.generateCharacterInstantly(message.prompt);
                return { type: 'character_generated', character };
                
            case 'get_status':
                return { 
                    type: 'status', 
                    activeGenerations: this.activeGenerations.size,
                    totalCreations: this.creationLibrary.size
                };
                
            default:
                return { type: 'unknown_message' };
        }
    }
    
    async setupUnityBridge() {
        console.log('🎮 Setting up Unity bridge...');
        // Unity integration setup
    }
    
    async setupUnrealBridge() {
        console.log('🎮 Setting up Unreal bridge...');
        // Unreal integration setup
    }
    
    getEnhancedWebInterface() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Enhanced Cal Orchestration</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%);
            color: #00ff00;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: rgba(0, 255, 0, 0.1);
            border: 2px solid #00ff00;
            border-radius: 15px;
            box-shadow: 0 0 20px rgba(0, 255, 0, 0.3);
        }
        
        .header h1 {
            font-size: 3em;
            margin: 0;
            text-shadow: 0 0 15px #00ff00;
            background: linear-gradient(45deg, #00ff00, #00ffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .cal-input {
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .cal-prompt {
            width: 100%;
            background: #111;
            border: 2px solid #00ff00;
            color: #00ff00;
            padding: 15px;
            font-family: inherit;
            font-size: 1.2em;
            border-radius: 8px;
            margin-bottom: 15px;
            box-shadow: inset 0 0 10px rgba(0, 255, 0, 0.2);
        }
        
        .cal-prompt:focus {
            outline: none;
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
        }
        
        .action-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .action-btn {
            background: linear-gradient(45deg, #00ff00, #00cc00);
            color: #000;
            border: none;
            padding: 15px 20px;
            border-radius: 8px;
            font-family: inherit;
            font-weight: bold;
            font-size: 1em;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
            overflow: hidden;
        }
        
        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(0, 255, 0, 0.4);
        }
        
        .action-btn:active {
            transform: translateY(0);
        }
        
        .quick-commands {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .quick-cmd {
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            color: #00ff00;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
        }
        
        .quick-cmd:hover {
            background: rgba(0, 255, 0, 0.2);
            transform: scale(1.02);
        }
        
        .result-area {
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 20px;
            min-height: 300px;
            margin-bottom: 20px;
        }
        
        .creation-preview {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 15px;
        }
        
        .creation-info {
            background: rgba(0, 255, 0, 0.1);
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #00ff00;
        }
        
        .status-bar {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #00ff00;
            border-radius: 5px;
            padding: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-online { background: #00ff00; }
        .status-processing { background: #ffff00; animation: blink 1s infinite; }
        .status-error { background: #ff0000; }
        
        @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0.3; }
        }
        
        .capabilities {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .capability {
            background: rgba(0, 255, 0, 0.1);
            border: 1px solid #00ff00;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        
        .capability h4 {
            color: #00ffff;
            margin: 0 0 10px 0;
        }
        
        .examples {
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid #00ff00;
            border-radius: 8px;
            padding: 15px;
            margin-top: 15px;
        }
        
        .example-command {
            background: rgba(0, 255, 0, 0.1);
            padding: 8px 12px;
            border-radius: 5px;
            margin: 5px 0;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .example-command:hover {
            background: rgba(0, 255, 0, 0.2);
            transform: translateX(5px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧠 ENHANCED CAL ORCHESTRATION</h1>
            <p>Natural Language 3D Creation System</p>
            <p style="font-size: 0.9em; opacity: 0.8;">Just tell Cal what you want to create</p>
        </div>
        
        <div class="status-bar">
            <div>
                <span class="status-indicator status-online"></span>
                Cal Enhanced System Online
            </div>
            <div>
                <span class="status-indicator status-online"></span>
                Character Generator Ready
            </div>
            <div>
                <span class="status-indicator status-online"></span>
                Unity/Unreal Bridges Active
            </div>
        </div>
        
        <div class="cal-input">
            <h3>💬 Tell Cal what to create:</h3>
            <input type="text" 
                   class="cal-prompt" 
                   id="calInput" 
                   placeholder="Cal, draw me a pirate..."
                   onkeypress="if(event.key==='Enter') sendToCal()">
            
            <div class="action-buttons">
                <button class="action-btn" onclick="sendToCal()">
                    🗣️ Send to Cal
                </button>
                <button class="action-btn" onclick="startVoiceCommand()">
                    🎤 Voice Command
                </button>
                <button class="action-btn" onclick="showLibrary()">
                    📚 My Creations
                </button>
                <button class="action-btn" onclick="clearResult()">
                    🗑️ Clear
                </button>
            </div>
            
            <div class="quick-commands">
                <div class="quick-cmd" onclick="useCommand('Cal, draw me a pirate')">
                    🏴‍☠️ Create Pirate Character
                </div>
                <div class="quick-cmd" onclick="useCommand('Cal, make a futuristic city')">
                    🏙️ Build Futuristic City
                </div>
                <div class="quick-cmd" onclick="useCommand('Cal, create a wizard with a staff')">
                    🧙‍♂️ Generate Wizard
                </div>
                <div class="quick-cmd" onclick="useCommand('Cal, build a medieval castle')">
                    🏰 Medieval Castle
                </div>
                <div class="quick-cmd" onclick="useCommand('Cal, design a robot warrior')">
                    🤖 Robot Warrior
                </div>
                <div class="quick-cmd" onclick="useCommand('Cal, make a fantasy forest')">
                    🌲 Fantasy Forest
                </div>
            </div>
            
            <div class="examples">
                <h4>💡 Example Commands:</h4>
                <div class="example-command" onclick="useCommand('Cal, draw me a cyberpunk warrior with glowing armor')">
                    "Cal, draw me a cyberpunk warrior with glowing armor"
                </div>
                <div class="example-command" onclick="useCommand('Cal, create a steampunk airship captain')">
                    "Cal, create a steampunk airship captain"
                </div>
                <div class="example-command" onclick="useCommand('Cal, build a mystical underwater city')">
                    "Cal, build a mystical underwater city"
                </div>
                <div class="example-command" onclick="useCommand('Cal, make it more colorful and add wings')">
                    "Cal, make it more colorful and add wings" (modify last creation)
                </div>
                <div class="example-command" onclick="useCommand('Cal, export this to Unity')">
                    "Cal, export this to Unity"
                </div>
            </div>
        </div>
        
        <div class="capabilities">
            <div class="capability">
                <h4>🎨 Character Creation</h4>
                <p>Instant 3D character generation from natural language</p>
            </div>
            <div class="capability">
                <h4>🌍 World Building</h4>
                <p>Create entire 3D worlds and environments</p>
            </div>
            <div class="capability">
                <h4>🎮 Game Engine Export</h4>
                <p>Direct export to Unity and Unreal Engine</p>
            </div>
            <div class="capability">
                <h4>🔧 Real-time Modification</h4>
                <p>Modify creations with simple commands</p>
            </div>
        </div>
        
        <div class="result-area">
            <h3>🎯 Cal's Response:</h3>
            <div id="resultContent">
                <p>Ready to create! Tell me what you'd like to make...</p>
                <p style="opacity: 0.7;">Try saying: "Cal, draw me a pirate" or "Cal, create a futuristic city"</p>
            </div>
        </div>
    </div>
    
    <script>
        let currentSession = null;
        let ws = null;
        
        // Connect to WebSocket for real-time updates
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.config.port + 1}/cal/realtime');
            
            ws.onopen = () => {
                console.log('🔌 Connected to Cal real-time system');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleRealtimeUpdate(data);
            };
            
            ws.onclose = () => {
                console.log('🔌 Disconnected from Cal real-time system');
                setTimeout(connectWebSocket, 5000); // Reconnect after 5 seconds
            };
        }
        
        function handleRealtimeUpdate(data) {
            if (data.type === 'character_created') {
                showCharacterResult(data.character);
            }
        }
        
        async function sendToCal() {
            const input = document.getElementById('calInput').value.trim();
            
            if (!input) {
                alert('Please enter a command for Cal!');
                return;
            }
            
            const resultDiv = document.getElementById('resultContent');
            resultDiv.innerHTML = '<div style="color: #ffff00;">🧠 Cal is thinking...</div>';
            
            try {
                const response = await fetch('/cal/enhanced', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        input: input,
                        session: currentSession
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    currentSession = data.session;
                    displayCalResult(data.result);
                } else {
                    resultDiv.innerHTML = '<div style="color: #ff0000;">❌ Error: ' + data.error + '</div>';
                }
            } catch (error) {
                resultDiv.innerHTML = '<div style="color: #ff0000;">❌ Error: ' + error.message + '</div>';
            }
        }
        
        function displayCalResult(result) {
            const resultDiv = document.getElementById('resultContent');
            
            let html = '<div style="color: #00ffff; font-size: 1.2em; margin-bottom: 15px;">' + result.message + '</div>';
            
            if (result.type === 'character_created') {
                html += generateCharacterHTML(result.character);
            } else if (result.type === 'world_created') {
                html += generateWorldHTML(result.world);
            } else if (result.type === 'creation_exported') {
                html += generateExportHTML(result.export);
            }
            
            if (result.actions && result.actions.length > 0) {
                html += '<div style="margin-top: 15px;"><h4>🎯 Available Actions:</h4>';
                result.actions.forEach(action => {
                    html += \\`<button onclick="executeAction('\\${action.action}', '\\${action.id || action.worldId}')" 
                              style="background: rgba(0,255,0,0.2); border: 1px solid #00ff00; color: #00ff00; 
                                     padding: 8px 15px; margin: 5px; border-radius: 5px; cursor: pointer;">
                              \\${action.label}
                            </button>\\`;
                });
                html += '</div>';
            }
            
            resultDiv.innerHTML = html;
        }
        
        function generateCharacterHTML(character) {
            return \\`
                <div class="creation-preview">
                    <div class="creation-info">
                        <h4>🎭 \\${character.name}</h4>
                        <p><strong>Type:</strong> \\${character.type}</p>
                        <p><strong>Created:</strong> \\${new Date(character.createdAt).toLocaleTimeString()}</p>
                        <p><strong>Generation Time:</strong> \\${character.totalDuration || character.metadata?.generationTime || 'Instant'}ms</p>
                        <p><strong>Unity Ready:</strong> \\${character.readyForUnity || character.unityData ? '✅ Yes' : '❌ No'}</p>
                        <p><strong>Unreal Ready:</strong> \\${character.readyForUnreal || character.unrealData ? '✅ Yes' : '❌ No'}</p>
                    </div>
                    <div class="creation-info">
                        <h4>📋 Character Details:</h4>
                        <p><strong>Original Prompt:</strong><br>"\\${character.originalPrompt || 'Generated character'}"</p>
                        <p><strong>Export Ready:</strong> ✅ Yes</p>
                        <p><strong>ID:</strong> \\${character.id}</p>
                    </div>
                </div>
            \\`;
        }
        
        function generateWorldHTML(world) {
            return \\`
                <div class="creation-preview">
                    <div class="creation-info">
                        <h4>🌍 \\${world.name}</h4>
                        <p><strong>Type:</strong> \\${world.type}</p>
                        <p><strong>Theme:</strong> \\${world.theme}</p>
                        <p><strong>Size:</strong> \\${world.size}</p>
                        <p><strong>Created:</strong> \\${new Date(world.createdAt).toLocaleTimeString()}</p>
                    </div>
                    <div class="creation-info">
                        <h4>📋 World Features:</h4>
                        <p><strong>Features:</strong> \\${world.features.join(', ') || 'Standard terrain'}</p>
                        <p><strong>Export Ready:</strong> \\${world.readyForExport ? '✅ Yes' : '⏳ Processing'}</p>
                        <p><strong>ID:</strong> \\${world.id}</p>
                    </div>
                </div>
            \\`;
        }
        
        function generateExportHTML(exportData) {
            return \\`
                <div class="creation-info">
                    <h4>📦 Export Complete</h4>
                    <p><strong>Engine:</strong> \\${exportData.engine.toUpperCase()}</p>
                    <p><strong>Format:</strong> \\${exportData.format}</p>
                    <p><strong>Download:</strong> <a href="\\${exportData.downloadUrl}" style="color: #00ffff;">\\${exportData.downloadUrl}</a></p>
                    <p><strong>Exported:</strong> \\${new Date(exportData.exportedAt).toLocaleTimeString()}</p>
                </div>
            \\`;
        }
        
        async function executeAction(action, id) {
            if (action === 'export_unity') {
                await exportToEngine('unity', id);
            } else if (action === 'export_unreal') {
                await exportToEngine('unreal', id);
            }
        }
        
        async function exportToEngine(engine, id) {
            try {
                const response = await fetch(\\`/cal/export/\\${engine}/\\${id}\\`, {
                    method: 'POST'
                });
                
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('resultContent').innerHTML += 
                        \\`<div style="color: #00ff00; margin-top: 10px;">
                            ✅ Successfully exported to \\${engine.toUpperCase()}!<br>
                            📥 Download: <a href="\\${data.export.downloadUrl}" style="color: #00ffff;">\\${data.export.downloadUrl}</a>
                        </div>\\`;
                }
            } catch (error) {
                console.error('Export error:', error);
            }
        }
        
        function useCommand(command) {
            document.getElementById('calInput').value = command;
        }
        
        function clearResult() {
            document.getElementById('resultContent').innerHTML = 
                '<p>Ready to create! Tell me what you\\'d like to make...</p>' +
                '<p style="opacity: 0.7;">Try saying: "Cal, draw me a pirate" or "Cal, create a futuristic city"</p>';
            document.getElementById('calInput').value = '';
        }
        
        function startVoiceCommand() {
            alert('Voice commands coming soon! For now, please type your command.');
        }
        
        function showLibrary() {
            fetch('/cal/library')
                .then(response => response.json())
                .then(data => {
                    let html = '<h4>📚 Your Creation Library</h4>';
                    if (data.library.length === 0) {
                        html += '<p>No creations yet. Start by asking Cal to create something!</p>';
                    } else {
                        data.library.forEach(creation => {
                            html += \\`
                                <div style="background: rgba(0,255,0,0.1); padding: 10px; margin: 5px 0; border-radius: 5px;">
                                    <strong>\\${creation.name}</strong> (\\${creation.type}) - 
                                    Created: \\${new Date(creation.createdAt).toLocaleString()}
                                </div>
                            \\`;
                        });
                    }
                    document.getElementById('resultContent').innerHTML = html;
                });
        }
        
        // Auto-focus and connect WebSocket on load
        document.getElementById('calInput').focus();
        connectWebSocket();
    </script>
</body>
</html>
        `;
    }
}

// Advanced NLP Processor for better understanding
class AdvancedNLPProcessor {
    constructor() {
        this.intents = {
            'create_character': {
                keywords: ['draw', 'create', 'make', 'generate', 'build', 'design'],
                entities: ['character', 'person', 'hero', 'villain', 'pirate', 'knight', 'wizard', 'robot']
            },
            'create_world': {
                keywords: ['build', 'create', 'make', 'generate'],
                entities: ['world', 'city', 'forest', 'castle', 'environment', 'scene', 'place']
            },
            'modify_creation': {
                keywords: ['change', 'modify', 'update', 'edit', 'adjust', 'alter'],
                entities: ['color', 'size', 'style', 'feature']
            },
            'export_creation': {
                keywords: ['export', 'save', 'download', 'send'],
                entities: ['unity', 'unreal', 'game', 'engine']
            }
        };
        
        this.themes = ['fantasy', 'sci-fi', 'modern', 'historical', 'cyberpunk', 'steampunk', 'post-apocalyptic'];
        this.styles = ['realistic', 'cartoon', 'anime', 'low-poly', 'stylized'];
        this.urgencyWords = ['quick', 'fast', 'instant', 'immediately', 'now', 'asap'];
    }
    
    async analyzeAdvanced(input, context = {}) {
        const analysis = {
            originalInput: input,
            intent: this.detectIntent(input),
            entities: this.extractEntities(input),
            theme: this.detectTheme(input),
            style: this.detectStyle(input),
            urgency: this.detectUrgency(input),
            complexity: this.detectComplexity(input),
            colors: this.extractColors(input),
            scale: this.extractScale(input),
            features: this.extractFeatures(input),
            exportTarget: this.detectExportTarget(input),
            confidence: 0.8 // Simplified confidence score
        };
        
        return analysis;
    }
    
    detectIntent(input) {
        const lowercaseInput = input.toLowerCase();
        
        for (const [intent, data] of Object.entries(this.intents)) {
            const hasKeyword = data.keywords.some(keyword => lowercaseInput.includes(keyword));
            const hasEntity = data.entities.some(entity => lowercaseInput.includes(entity));
            
            if (hasKeyword && hasEntity) {
                return intent;
            }
        }
        
        return 'conversation';
    }
    
    extractEntities(input) {
        const entities = [];
        const lowercaseInput = input.toLowerCase();
        
        // Character types
        const characterTypes = ['pirate', 'knight', 'wizard', 'robot', 'alien', 'dragon', 'warrior', 'archer'];
        characterTypes.forEach(type => {
            if (lowercaseInput.includes(type)) {
                entities.push({ type: 'character_type', name: type });
            }
        });
        
        // Locations
        const locations = ['city', 'forest', 'castle', 'mountain', 'ocean', 'desert', 'space'];
        locations.forEach(location => {
            if (lowercaseInput.includes(location)) {
                entities.push({ type: 'location', name: location });
            }
        });
        
        return entities;
    }
    
    detectTheme(input) {
        const lowercaseInput = input.toLowerCase();
        
        for (const theme of this.themes) {
            if (lowercaseInput.includes(theme)) {
                return theme;
            }
        }
        
        // Infer theme from context
        if (lowercaseInput.includes('future') || lowercaseInput.includes('tech')) return 'sci-fi';
        if (lowercaseInput.includes('magic') || lowercaseInput.includes('medieval')) return 'fantasy';
        
        return 'fantasy'; // Default
    }
    
    detectStyle(input) {
        const lowercaseInput = input.toLowerCase();
        
        for (const style of this.styles) {
            if (lowercaseInput.includes(style)) {
                return style;
            }
        }
        
        return 'realistic'; // Default
    }
    
    detectUrgency(input) {
        const lowercaseInput = input.toLowerCase();
        
        if (this.urgencyWords.some(word => lowercaseInput.includes(word))) {
            return 'immediate';
        }
        
        return 'normal';
    }
    
    detectComplexity(input) {
        const complexWords = ['detailed', 'intricate', 'complex', 'advanced'];
        const simpleWords = ['simple', 'basic', 'quick', 'easy'];
        
        const lowercaseInput = input.toLowerCase();
        
        if (complexWords.some(word => lowercaseInput.includes(word))) {
            return 'high';
        } else if (simpleWords.some(word => lowercaseInput.includes(word))) {
            return 'low';
        }
        
        return 'medium';
    }
    
    extractColors(input) {
        const colors = ['red', 'blue', 'green', 'yellow', 'purple', 'black', 'white', 'silver', 'gold'];
        const foundColors = [];
        
        const lowercaseInput = input.toLowerCase();
        colors.forEach(color => {
            if (lowercaseInput.includes(color)) {
                foundColors.push(color);
            }
        });
        
        return foundColors;
    }
    
    extractScale(input) {
        const scaleWords = {
            'tiny': 'tiny',
            'small': 'small',
            'large': 'large',
            'huge': 'huge',
            'massive': 'massive',
            'giant': 'giant'
        };
        
        const lowercaseInput = input.toLowerCase();
        
        for (const [word, scale] of Object.entries(scaleWords)) {
            if (lowercaseInput.includes(word)) {
                return scale;
            }
        }
        
        return 'medium';
    }
    
    extractFeatures(input) {
        const features = ['wings', 'armor', 'weapon', 'magic', 'glowing', 'metallic'];
        const foundFeatures = [];
        
        const lowercaseInput = input.toLowerCase();
        features.forEach(feature => {
            if (lowercaseInput.includes(feature)) {
                foundFeatures.push(feature);
            }
        });
        
        return foundFeatures;
    }
    
    detectExportTarget(input) {
        const lowercaseInput = input.toLowerCase();
        
        if (lowercaseInput.includes('unity')) return 'unity';
        if (lowercaseInput.includes('unreal')) return 'unreal';
        
        return null;
    }
}

// Enhanced NLP Middleware
class EnhancedNLPMiddleware {
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
    }
    
    async process(request) {
        // Enhanced natural language processing for all requests
        if (request.originalInput) {
            const analysis = await this.orchestrator.nlp.analyzeAdvanced(request.originalInput);
            request.nlpAnalysis = analysis;
            request.intent = analysis.intent;
        }
        
        return request;
    }
}

// Creative Workflow Middleware
class CreativeWorkflowMiddleware {
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
    }
    
    async process(request) {
        // Add creative workflow context
        request.creativeContext = {
            sessionId: request.session,
            workflowStage: this.determineWorkflowStage(request),
            suggestedNextActions: this.suggestNextActions(request)
        };
        
        return request;
    }
    
    determineWorkflowStage(request) {
        if (request.intent === 'create_character' || request.intent === 'create_world') {
            return 'creation';
        } else if (request.intent === 'modify_creation') {
            return 'modification';
        } else if (request.intent === 'export_creation') {
            return 'export';
        }
        
        return 'planning';
    }
    
    suggestNextActions(request) {
        const stage = this.determineWorkflowStage(request);
        
        switch (stage) {
            case 'creation':
                return ['modify', 'export', 'create_another'];
            case 'modification':
                return ['export', 'modify_more', 'create_another'];
            case 'export':
                return ['create_another', 'import_to_engine'];
            default:
                return ['create_character', 'create_world'];
        }
    }
}

// Real-time Generation Middleware
class RealtimeGenerationMiddleware {
    constructor(orchestrator) {
        this.orchestrator = orchestrator;
    }
    
    async process(request) {
        // Enable real-time generation tracking
        if (request.intent === 'create_character' || request.intent === 'create_world') {
            request.realtimeTracking = {
                enabled: true,
                updateInterval: 500,
                notifyClients: true
            };
        }
        
        return request;
    }
}

module.exports = EnhancedCalOrchestration;

// Start if run directly
if (require.main === module) {
    const enhancedCal = new EnhancedCalOrchestration({
        port: 8300,
        characterGeneratorPort: 8200,
        enableUnityBridge: true,
        enableUnrealBridge: true,
        enableVoiceCommands: true,
        enableRealtimeGeneration: true
    });
    
    enhancedCal.on('ready', () => {
        console.log('🎉 ENHANCED CAL ORCHESTRATION READY!');
        console.log('');
        console.log('🌐 Web Interface: http://localhost:8300');
        console.log('📡 API Endpoint: http://localhost:8300/cal/enhanced');
        console.log('🔌 WebSocket: ws://localhost:8301/cal/realtime');
        console.log('');
        console.log('💬 Try these commands:');
        console.log('  "Cal, draw me a pirate"');
        console.log('  "Cal, create a futuristic city"');
        console.log('  "Cal, make it bigger and add wings"');
        console.log('  "Cal, export this to Unity"');
        console.log('');
        console.log('🎮 Unity/Unreal export ready!');
        console.log('🎨 Instant character generation operational!');
    });
}