/**
 * 🎭 Dungeon Master Orchestrator - The Voice-to-World Engine
 * DM speaks → Sound waves → Visual minimap → NPCs build → Players interact
 * The DM provides lore, quests, and narrative while the world materializes
 */

const express = require('express');
const WebSocket = require('ws');
const { spawn } = require('child_process');
const fs = require('fs').promises;

class DungeonMasterOrchestrator {
    constructor() {
        this.app = express();
        this.port = 7904;
        this.wsPort = 7905;
        
        // The DM's Domain
        this.dmState = {
            currentNarrative: '',
            activeQuests: [],
            worldLore: new Map(),
            soundBuffer: [],
            voicePatterns: new Map(),
            minimapState: {
                center: { x: 0, y: 0 },
                zoom: 1,
                activeLayers: [],
                soundWaves: []
            }
        };
        
        // Voice to Symbol Mapping
        this.voiceToSymbol = {
            // Tone patterns
            rising: '↗️',      // Question
            falling: '↘️',     // Statement
            flat: '➡️',        // Neutral
            excited: '⚡',     // Excitement
            quiet: '🤫',       // Whisper
            loud: '📢',        // Shout
            
            // Emotion patterns (from voice analysis)
            happy: '😊',
            sad: '😢',
            angry: '😡',
            mysterious: '🔮',
            threatening: '💀',
            peaceful: '🕊️',
            
            // DM Commands (voice activated)
            'spawn': '✨',
            'create': '🏗️',
            'destroy': '💥',
            'quest': '📜',
            'battle': '⚔️',
            'treasure': '💎',
            'portal': '🌀',
            'npc': '🧙',
            
            // Sound characteristics
            bass: '🔊',        // Low frequency
            treble: '🔈',      // High frequency
            rhythm: '🥁',      // Rhythmic pattern
            melody: '🎵',      // Melodic pattern
            silence: '🔇',     // Pause/silence
            echo: '🔄'         // Reverb/echo
        };
        
        // The Eye Minimap - Shows sound as visual waves
        this.eyeMinimap = {
            width: 800,
            height: 600,
            layers: {
                soundscape: {
                    active: true,
                    opacity: 0.8,
                    waveforms: []
                },
                narrative: {
                    active: true,
                    opacity: 0.6,
                    textNodes: []
                },
                worldMap: {
                    active: true,
                    opacity: 1.0,
                    terrain: []
                },
                entities: {
                    active: true,
                    opacity: 0.9,
                    npcs: [],
                    players: [],
                    objects: []
                }
            }
        };
        
        // NPC Builders - They listen to the DM and build
        this.npcBuilders = {
            'Lorekeeper': {
                emoji: '📚',
                role: 'teacher',
                listensFor: ['story', 'history', 'lore', 'ancient'],
                builds: ['libraries', 'monuments', 'scrolls'],
                knowledge: new Map(),
                questions: []
            },
            'Architect': {
                emoji: '🏛️',
                role: 'builder',
                listensFor: ['build', 'create', 'construct', 'design'],
                builds: ['structures', 'cities', 'dungeons'],
                blueprints: new Map(),
                questions: []
            },
            'Sage': {
                emoji: '🔮',
                role: 'guardian',
                listensFor: ['magic', 'spell', 'enchant', 'mystic'],
                builds: ['portals', 'wards', 'enchantments'],
                spellbook: new Map(),
                questions: []
            },
            'Cartographer': {
                emoji: '🗺️',
                role: 'mapper',
                listensFor: ['map', 'location', 'where', 'direction'],
                builds: ['maps', 'paths', 'regions'],
                charts: new Map(),
                questions: []
            },
            'Questgiver': {
                emoji: '📜',
                role: 'guide',
                listensFor: ['quest', 'mission', 'task', 'objective'],
                builds: ['quests', 'objectives', 'rewards'],
                questLog: new Map(),
                questions: []
            },
            'Chronicler': {
                emoji: '✍️',
                role: 'recorder',
                listensFor: ['event', 'happen', 'action', 'result'],
                builds: ['chronicles', 'records', 'history'],
                events: [],
                questions: []
            }
        };
        
        // Player Interface - Where humans interact
        this.playerInterface = {
            activePlayer: null,
            playerActions: [],
            decisionPoints: [],
            voiceCommands: new Map(),
            textCommands: new Map()
        };
        
        // Sound Processing Pipeline
        this.soundPipeline = {
            stages: [
                'capture',      // Capture audio input
                'analyze',      // Analyze frequency/emotion
                'symbolize',    // Convert to symbols
                'visualize',    // Create visual representation
                'interpret',    // NPCs interpret meaning
                'build',        // NPCs build based on interpretation
                'interact'      // Players can interact
            ],
            processors: new Map()
        };
        
        // Saga & Quest System
        this.sagaSystem = {
            currentSaga: null,
            chapters: [],
            activeQuests: new Map(),
            completedQuests: new Set(),
            worldEvents: [],
            playerDecisions: []
        };
        
        // The DM's Tome - All knowledge
        this.dmTome = {
            worldRules: new Map(),
            creatureStats: new Map(),
            itemCatalog: new Map(),
            spellList: new Map(),
            locationData: new Map(),
            npcDialogue: new Map()
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.initializeDungeonMaster();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });
    }
    
    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.send(this.generateDMInterface());
        });
        
        // DM narration endpoint
        this.app.post('/dm/narrate', async (req, res) => {
            const result = await this.processNarration(req.body);
            res.json(result);
        });
        
        // Voice processing
        this.app.post('/dm/voice', async (req, res) => {
            const result = await this.processVoiceInput(req.body);
            res.json(result);
        });
        
        // NPC questions
        this.app.get('/npc/:name/questions', (req, res) => {
            const questions = this.getNPCQuestions(req.params.name);
            res.json(questions);
        });
        
        // Player actions
        this.app.post('/player/action', async (req, res) => {
            const result = await this.processPlayerAction(req.body);
            res.json(result);
        });
        
        // Minimap state
        this.app.get('/minimap/state', (req, res) => {
            res.json(this.eyeMinimap);
        });
    }
    
    setupWebSocket() {
        this.wsServer = new WebSocket.Server({ port: this.wsPort });
        
        this.wsServer.on('connection', (ws, req) => {
            const sessionId = this.generateSessionId();
            console.log(`🎭 New adventurer enters the realm: ${sessionId}`);
            
            // Send initial world state
            ws.send(JSON.stringify({
                type: 'world_init',
                message: this.getWelcomeNarration(),
                minimap: this.eyeMinimap,
                npcs: this.getNPCStates(),
                quests: Array.from(this.sagaSystem.activeQuests.values())
            }));
            
            // Setup voice channel simulation
            this.setupVoiceChannel(ws, sessionId);
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleRealmMessage(ws, sessionId, data);
                } catch (error) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: `The realm rejects your command: ${error.message}`
                    }));
                }
            });
            
            ws.on('close', () => {
                console.log(`🚪 Adventurer ${sessionId} leaves the realm`);
            });
        });
    }
    
    initializeDungeonMaster() {
        console.log('🎭 Initializing Dungeon Master Orchestrator...');
        console.log('👁️ Eye Minimap visualization ready');
        console.log('🎙️ Voice-to-world pipeline active');
        console.log('🧙 NPCs await the DM\'s commands');
        console.log('📚 Tome of knowledge prepared');
        
        // Initialize the world with a starting narration
        this.startingNarration();
        
        // Start the sound processing loop
        this.startSoundProcessing();
        
        // Initialize NPC behaviors
        this.initializeNPCs();
    }
    
    startingNarration() {
        const opening = `
            The realm awakens to the sound of your voice...
            
            In this world, words become reality. Every sound creates ripples
            in the fabric of existence. The NPCs listen intently, ready to
            build what you describe, to manifest your narrative into being.
            
            Speak, and watch the minimap pulse with your voice.
            Command, and see the builders spring to action.
            Question, and hear the teachers respond.
            
            You are the Dungeon Master. The world awaits your story.
        `;
        
        this.dmState.currentNarrative = opening;
        this.broadcastNarration(opening);
    }
    
    async processVoiceInput(input) {
        const { audioData, metadata = {} } = input;
        
        // Simulate voice analysis (in real implementation, would use Web Audio API)
        const analysis = this.analyzeVoice(audioData);
        
        // Convert voice patterns to symbols
        const symbols = this.voiceToSymbols(analysis);
        
        // Create visual representation
        const visualization = this.createSoundVisualization(analysis, symbols);
        
        // Update minimap with sound waves
        this.updateMinimapWithSound(visualization);
        
        // NPCs interpret the voice
        const interpretations = await this.npcsInterpretVoice(analysis, symbols);
        
        // NPCs build based on interpretation
        const constructions = await this.npcsBuild(interpretations);
        
        return {
            analysis,
            symbols,
            visualization,
            interpretations,
            constructions,
            minimapUpdate: this.eyeMinimap.layers.soundscape
        };
    }
    
    analyzeVoice(audioData) {
        // Simulated voice analysis
        return {
            frequency: {
                fundamental: 220 + Math.random() * 220, // A3 to A4
                harmonics: [440, 880, 1320],
                spectrum: this.generateSpectrum()
            },
            amplitude: {
                average: 0.5 + Math.random() * 0.5,
                peak: 0.8 + Math.random() * 0.2,
                envelope: 'attack-decay-sustain-release'
            },
            tone: {
                pattern: ['rising', 'falling', 'flat'][Math.floor(Math.random() * 3)],
                emotion: this.detectEmotion(),
                intent: this.detectIntent()
            },
            timing: {
                duration: 1000 + Math.random() * 3000,
                pauses: this.detectPauses(),
                rhythm: this.detectRhythm()
            }
        };
    }
    
    generateSpectrum() {
        const spectrum = [];
        for (let i = 0; i < 32; i++) {
            spectrum.push(Math.random() * Math.exp(-i / 10));
        }
        return spectrum;
    }
    
    detectEmotion() {
        const emotions = ['happy', 'sad', 'angry', 'mysterious', 'threatening', 'peaceful'];
        return emotions[Math.floor(Math.random() * emotions.length)];
    }
    
    detectIntent() {
        const intents = ['command', 'question', 'narration', 'description', 'dialogue'];
        return intents[Math.floor(Math.random() * intents.length)];
    }
    
    detectPauses() {
        return Array.from({ length: Math.floor(Math.random() * 3) }, () => ({
            start: Math.random() * 1000,
            duration: 100 + Math.random() * 500
        }));
    }
    
    detectRhythm() {
        return {
            pattern: 'conversational',
            tempo: 120 + Math.random() * 40,
            emphasis: Array.from({ length: 4 }, () => Math.random() > 0.7)
        };
    }
    
    voiceToSymbols(analysis) {
        const symbols = [];
        
        // Tone pattern symbol
        symbols.push({
            type: 'tone',
            symbol: this.voiceToSymbol[analysis.tone.pattern],
            meaning: analysis.tone.pattern
        });
        
        // Emotion symbol
        symbols.push({
            type: 'emotion',
            symbol: this.voiceToSymbol[analysis.tone.emotion],
            meaning: analysis.tone.emotion
        });
        
        // Frequency symbols
        if (analysis.frequency.fundamental < 300) {
            symbols.push({
                type: 'frequency',
                symbol: this.voiceToSymbol.bass,
                meaning: 'low frequency'
            });
        } else {
            symbols.push({
                type: 'frequency',
                symbol: this.voiceToSymbol.treble,
                meaning: 'high frequency'
            });
        }
        
        // Amplitude symbols
        if (analysis.amplitude.peak > 0.9) {
            symbols.push({
                type: 'volume',
                symbol: this.voiceToSymbol.loud,
                meaning: 'loud'
            });
        } else if (analysis.amplitude.average < 0.3) {
            symbols.push({
                type: 'volume',
                symbol: this.voiceToSymbol.quiet,
                meaning: 'quiet'
            });
        }
        
        return symbols;
    }
    
    createSoundVisualization(analysis, symbols) {
        return {
            waveform: {
                points: analysis.frequency.spectrum.map((amp, i) => ({
                    x: i * 25,
                    y: 300 + amp * 200 * Math.sin(i / 5)
                })),
                color: this.emotionToColor(analysis.tone.emotion)
            },
            symbols: symbols.map((sym, i) => ({
                symbol: sym.symbol,
                x: 100 + i * 100,
                y: 100,
                size: 40 + analysis.amplitude.average * 20
            })),
            ripples: this.generateRipples(analysis)
        };
    }
    
    emotionToColor(emotion) {
        const colors = {
            happy: '#FFD700',
            sad: '#4169E1',
            angry: '#FF4500',
            mysterious: '#9370DB',
            threatening: '#8B0000',
            peaceful: '#98FB98'
        };
        return colors[emotion] || '#FFFFFF';
    }
    
    generateRipples(analysis) {
        return Array.from({ length: 3 }, (_, i) => ({
            center: { x: 400, y: 300 },
            radius: 50 + i * 50,
            opacity: 1 - (i * 0.3),
            speed: 2 + analysis.amplitude.average,
            color: this.emotionToColor(analysis.tone.emotion)
        }));
    }
    
    updateMinimapWithSound(visualization) {
        // Add sound waves to minimap
        this.eyeMinimap.layers.soundscape.waveforms.push({
            timestamp: Date.now(),
            visualization: visualization,
            decay: 5000 // Fade out over 5 seconds
        });
        
        // Limit waveform history
        const now = Date.now();
        this.eyeMinimap.layers.soundscape.waveforms = 
            this.eyeMinimap.layers.soundscape.waveforms.filter(w => 
                now - w.timestamp < w.decay
            );
        
        // Broadcast minimap update
        this.broadcastMinimapUpdate();
    }
    
    async npcsInterpretVoice(analysis, symbols) {
        const interpretations = new Map();
        
        for (const [npcName, npc] of Object.entries(this.npcBuilders)) {
            const interpretation = await this.interpretForNPC(npc, analysis, symbols);
            if (interpretation.understood) {
                interpretations.set(npcName, interpretation);
                
                // NPC might have questions
                if (interpretation.hasQuestions) {
                    npc.questions.push(...interpretation.questions);
                }
            }
        }
        
        return interpretations;
    }
    
    async interpretForNPC(npc, analysis, symbols) {
        const interpretation = {
            understood: false,
            confidence: 0,
            meaning: '',
            actionRequired: false,
            questions: [],
            hasQuestions: false
        };
        
        // Check if any listened-for keywords would be in the voice
        // (In real implementation, would use speech recognition)
        const relevanceScore = Math.random(); // Simulated
        
        if (relevanceScore > 0.5) {
            interpretation.understood = true;
            interpretation.confidence = relevanceScore;
            
            // Interpret based on NPC role
            switch (npc.role) {
                case 'teacher':
                    interpretation.meaning = 'New lore to record and teach';
                    if (analysis.tone.intent === 'question') {
                        interpretation.questions.push({
                            question: 'What specific lore should I document?',
                            timestamp: Date.now()
                        });
                        interpretation.hasQuestions = true;
                    }
                    break;
                    
                case 'builder':
                    interpretation.meaning = 'Construction directive detected';
                    interpretation.actionRequired = true;
                    break;
                    
                case 'guardian':
                    interpretation.meaning = 'Magical intent sensed';
                    if (analysis.tone.emotion === 'mysterious') {
                        interpretation.actionRequired = true;
                    }
                    break;
                    
                case 'mapper':
                    interpretation.meaning = 'Geographic information detected';
                    interpretation.actionRequired = true;
                    break;
                    
                case 'guide':
                    interpretation.meaning = 'Quest-related communication';
                    if (analysis.tone.intent === 'command') {
                        interpretation.actionRequired = true;
                    }
                    break;
                    
                case 'recorder':
                    interpretation.meaning = 'Event worth chronicling';
                    interpretation.actionRequired = true;
                    break;
            }
        }
        
        return interpretation;
    }
    
    async npcsBuild(interpretations) {
        const constructions = [];
        
        for (const [npcName, interpretation] of interpretations) {
            if (interpretation.actionRequired) {
                const npc = this.npcBuilders[npcName];
                const construction = await this.npcConstruct(npc, interpretation);
                constructions.push({
                    npc: npcName,
                    built: construction,
                    location: this.determineLocation(npc, interpretation)
                });
                
                // Update minimap with new construction
                this.addToMinimap(construction);
            }
        }
        
        return constructions;
    }
    
    async npcConstruct(npc, interpretation) {
        const buildOptions = npc.builds;
        const selectedBuild = buildOptions[Math.floor(Math.random() * buildOptions.length)];
        
        const construction = {
            type: selectedBuild,
            builder: npc.emoji,
            timestamp: Date.now(),
            properties: {}
        };
        
        // Build based on type
        switch (selectedBuild) {
            case 'libraries':
                construction.properties = {
                    name: 'Library of ' + this.generateName(),
                    books: Math.floor(Math.random() * 1000) + 100,
                    knowledge: interpretation.meaning
                };
                break;
                
            case 'structures':
                construction.properties = {
                    name: this.generateName() + ' Tower',
                    height: Math.floor(Math.random() * 50) + 10,
                    material: ['stone', 'crystal', 'wood'][Math.floor(Math.random() * 3)]
                };
                break;
                
            case 'portals':
                construction.properties = {
                    name: 'Portal to ' + this.generateName(),
                    destination: { x: Math.random() * 1000, y: Math.random() * 1000 },
                    magical_resonance: Math.random()
                };
                break;
                
            case 'quests':
                construction.properties = {
                    name: 'Quest: ' + this.generateQuestName(),
                    objective: interpretation.meaning,
                    reward: this.generateReward(),
                    difficulty: Math.floor(Math.random() * 5) + 1
                };
                // Add to saga system
                this.sagaSystem.activeQuests.set(construction.properties.name, construction.properties);
                break;
        }
        
        return construction;
    }
    
    generateName() {
        const prefixes = ['Ancient', 'Mystic', 'Grand', 'Lost', 'Sacred', 'Hidden'];
        const suffixes = ['Halls', 'Sanctum', 'Keep', 'Grove', 'Peak', 'Depths'];
        return prefixes[Math.floor(Math.random() * prefixes.length)] + ' ' + 
               suffixes[Math.floor(Math.random() * suffixes.length)];
    }
    
    generateQuestName() {
        const types = ['The Search for', 'The Mystery of', 'The Defense of', 'The Journey to'];
        const objects = ['the Lost Artifact', 'the Ancient Tome', 'the Sacred Grove', 'the Hidden City'];
        return types[Math.floor(Math.random() * types.length)] + ' ' + 
               objects[Math.floor(Math.random() * objects.length)];
    }
    
    generateReward() {
        const rewards = ['100 gold', 'Magic Sword', 'Ancient Scroll', 'Mystic Gem', 'Experience'];
        return rewards[Math.floor(Math.random() * rewards.length)];
    }
    
    determineLocation(npc, interpretation) {
        // Place constructions based on NPC type and interpretation
        return {
            x: 400 + (Math.random() - 0.5) * 600,
            y: 300 + (Math.random() - 0.5) * 400,
            layer: 'entities'
        };
    }
    
    addToMinimap(construction) {
        const location = construction.location || { x: 400, y: 300 };
        
        this.eyeMinimap.layers.entities.objects.push({
            id: Date.now().toString(),
            type: construction.type,
            x: location.x,
            y: location.y,
            icon: construction.builder,
            properties: construction.properties,
            timestamp: construction.timestamp
        });
        
        // Limit objects shown
        if (this.eyeMinimap.layers.entities.objects.length > 50) {
            this.eyeMinimap.layers.entities.objects.shift();
        }
    }
    
    async processNarration(input) {
        const { text, tone = 'neutral', volume = 'normal' } = input;
        
        // Update current narrative
        this.dmState.currentNarrative = text;
        
        // Simulate voice processing for text
        const simulatedVoice = {
            audioData: this.textToSimulatedAudio(text),
            metadata: { tone, volume }
        };
        
        // Process as voice
        const result = await this.processVoiceInput(simulatedVoice);
        
        // Add to world lore
        this.dmState.worldLore.set(Date.now().toString(), {
            text,
            tone,
            interpretations: result.interpretations,
            constructions: result.constructions
        });
        
        // Broadcast narration
        this.broadcastNarration(text, result);
        
        return result;
    }
    
    textToSimulatedAudio(text) {
        // Simulate audio characteristics from text
        return {
            duration: text.length * 50, // Rough speech duration
            words: text.split(' ').length,
            sentences: text.split(/[.!?]/).length,
            emotion: this.detectTextEmotion(text),
            keywords: this.extractKeywords(text)
        };
    }
    
    detectTextEmotion(text) {
        if (text.includes('!')) return 'excited';
        if (text.includes('?')) return 'questioning';
        if (text.match(/dark|shadow|evil/i)) return 'threatening';
        if (text.match(/peace|calm|serene/i)) return 'peaceful';
        if (text.match(/ancient|mystery|unknown/i)) return 'mysterious';
        return 'neutral';
    }
    
    extractKeywords(text) {
        const keywords = [];
        const words = text.toLowerCase().split(/\s+/);
        
        // Check against NPC listening patterns
        Object.values(this.npcBuilders).forEach(npc => {
            npc.listensFor.forEach(keyword => {
                if (words.includes(keyword)) {
                    keywords.push(keyword);
                }
            });
        });
        
        return keywords;
    }
    
    getNPCQuestions(npcName) {
        const npc = this.npcBuilders[npcName];
        if (!npc) return { error: 'NPC not found' };
        
        return {
            npc: npcName,
            role: npc.role,
            questions: npc.questions,
            canAnswer: npc.questions.length > 0
        };
    }
    
    async processPlayerAction(input) {
        const { playerId, action, target, parameters = {} } = input;
        
        // Record player action
        this.playerInterface.playerActions.push({
            playerId,
            action,
            target,
            parameters,
            timestamp: Date.now()
        });
        
        // Process based on action type
        let result = {
            success: false,
            message: '',
            worldChange: null
        };
        
        switch (action) {
            case 'speak':
                result = await this.playerSpeak(playerId, parameters.text);
                break;
                
            case 'interact':
                result = await this.playerInteract(playerId, target);
                break;
                
            case 'answer':
                result = await this.playerAnswer(playerId, target, parameters.answer);
                break;
                
            case 'quest':
                result = await this.playerQuest(playerId, target, parameters.questAction);
                break;
                
            case 'move':
                result = await this.playerMove(playerId, parameters.x, parameters.y);
                break;
        }
        
        // Check if this triggers a decision point
        if (result.worldChange) {
            this.checkDecisionPoint(playerId, result);
        }
        
        return result;
    }
    
    async playerSpeak(playerId, text) {
        // Process player speech like DM narration but with less authority
        const narrationResult = await this.processNarration({
            text,
            tone: 'player',
            volume: 'normal'
        });
        
        return {
            success: true,
            message: 'Your words echo through the realm',
            worldChange: narrationResult.constructions.length > 0,
            constructions: narrationResult.constructions
        };
    }
    
    async playerInteract(playerId, target) {
        // Find target object in minimap
        const object = this.eyeMinimap.layers.entities.objects.find(o => o.id === target);
        
        if (!object) {
            return {
                success: false,
                message: 'Target not found in the realm'
            };
        }
        
        // Interaction based on object type
        let result = {
            success: true,
            message: `You interact with the ${object.type}`,
            worldChange: false
        };
        
        if (object.type === 'portals') {
            result.message = `You step through the portal to ${object.properties.name}`;
            result.worldChange = true;
        } else if (object.type === 'libraries') {
            result.message = `You browse the ${object.properties.books} books, gaining knowledge`;
            result.worldChange = false;
        }
        
        return result;
    }
    
    async playerAnswer(playerId, npcName, answer) {
        const npc = this.npcBuilders[npcName];
        if (!npc || npc.questions.length === 0) {
            return {
                success: false,
                message: 'No pending questions from this NPC'
            };
        }
        
        // Process answer
        const question = npc.questions.shift();
        npc.knowledge.set(question.question, answer);
        
        // NPC might build something based on answer
        const construction = await this.npcConstruct(npc, {
            meaning: answer,
            actionRequired: true
        });
        
        return {
            success: true,
            message: `${npcName} nods and begins ${construction.type}`,
            worldChange: true,
            construction: construction
        };
    }
    
    async playerQuest(playerId, questName, questAction) {
        const quest = this.sagaSystem.activeQuests.get(questName);
        if (!quest) {
            return {
                success: false,
                message: 'Quest not found'
            };
        }
        
        let result = {
            success: false,
            message: '',
            worldChange: false
        };
        
        switch (questAction) {
            case 'accept':
                result.success = true;
                result.message = `You accept the quest: ${questName}`;
                this.playerInterface.activePlayer = playerId;
                break;
                
            case 'complete':
                if (Math.random() > 0.5) { // Simulated quest completion check
                    result.success = true;
                    result.message = `Quest completed! You receive: ${quest.reward}`;
                    result.worldChange = true;
                    this.sagaSystem.completedQuests.add(questName);
                    this.sagaSystem.activeQuests.delete(questName);
                } else {
                    result.message = 'Quest objectives not yet complete';
                }
                break;
                
            case 'abandon':
                result.success = true;
                result.message = `You abandon the quest: ${questName}`;
                break;
        }
        
        return result;
    }
    
    async playerMove(playerId, x, y) {
        // Update player position on minimap
        let player = this.eyeMinimap.layers.entities.players.find(p => p.id === playerId);
        
        if (!player) {
            player = {
                id: playerId,
                x: x,
                y: y,
                icon: '🧑',
                name: `Player ${playerId.substring(0, 4)}`
            };
            this.eyeMinimap.layers.entities.players.push(player);
        } else {
            player.x = x;
            player.y = y;
        }
        
        return {
            success: true,
            message: `You move to (${Math.round(x)}, ${Math.round(y)})`,
            worldChange: false
        };
    }
    
    checkDecisionPoint(playerId, actionResult) {
        // Check if player action creates a decision point
        if (actionResult.worldChange && Math.random() > 0.7) {
            const decision = {
                id: Date.now().toString(),
                playerId: playerId,
                trigger: actionResult,
                question: 'This action will significantly change the world. Proceed?',
                options: ['Yes', 'No', 'Ask DM'],
                timestamp: Date.now()
            };
            
            this.playerInterface.decisionPoints.push(decision);
            
            // Notify player of decision point
            this.broadcastDecisionPoint(playerId, decision);
        }
    }
    
    setupVoiceChannel(ws, sessionId) {
        // Simulate voice channel (in real implementation, would use WebRTC)
        const voiceChannel = {
            sessionId,
            active: false,
            audioStream: null
        };
        
        // Store voice channel reference
        this.playerInterface.voiceCommands.set(sessionId, voiceChannel);
    }
    
    startSoundProcessing() {
        // Simulate continuous sound processing
        setInterval(() => {
            // Generate ambient sounds
            if (Math.random() > 0.8) {
                this.generateAmbientSound();
            }
            
            // Process any queued sounds
            if (this.dmState.soundBuffer.length > 0) {
                const sound = this.dmState.soundBuffer.shift();
                this.processVoiceInput(sound);
            }
        }, 1000);
    }
    
    generateAmbientSound() {
        const ambientTypes = ['wind', 'water', 'birds', 'magic', 'footsteps'];
        const type = ambientTypes[Math.floor(Math.random() * ambientTypes.length)];
        
        const ambientSound = {
            type: 'ambient',
            source: type,
            visualization: {
                x: Math.random() * 800,
                y: Math.random() * 600,
                radius: 20 + Math.random() * 30,
                color: 'rgba(255, 255, 255, 0.3)'
            }
        };
        
        // Add to minimap as subtle background
        this.eyeMinimap.layers.soundscape.waveforms.push({
            timestamp: Date.now(),
            visualization: ambientSound,
            decay: 2000
        });
    }
    
    initializeNPCs() {
        // Give each NPC some starting knowledge
        Object.values(this.npcBuilders).forEach(npc => {
            if (!npc.knowledge) {
                npc.knowledge = new Map();
            }
            npc.knowledge.set('realm_start', Date.now());
            npc.knowledge.set('dm_present', true);
        });
    }
    
    getNPCStates() {
        const states = {};
        
        Object.entries(this.npcBuilders).forEach(([name, npc]) => {
            states[name] = {
                emoji: npc.emoji,
                role: npc.role,
                questionsCount: npc.questions.length,
                knowledgeCount: npc.knowledge.size,
                buildCount: npc.blueprints ? npc.blueprints.size : 0
            };
        });
        
        return states;
    }
    
    getWelcomeNarration() {
        return `
🎭 Welcome to the Dungeon Master's Realm

You stand at the threshold of a world that responds to voice and thought.
The Eye Minimap pulses before you, showing sound as living waves of color.

Six NPCs await your commands:
📚 The Lorekeeper - Teacher of ancient knowledge
🏛️ The Architect - Builder of impossible structures  
🔮 The Sage - Guardian of mystical forces
🗺️ The Cartographer - Mapper of infinite realms
📜 The Questgiver - Guide to grand adventures
✍️ The Chronicler - Recorder of all that transpires

Speak, and watch your words transform:
Sound → Symbol → Vision → Reality

The minimap shows all: every word creates ripples, every command spawns creation.
NPCs will ask questions when unclear. Players may override with direct action.
But ultimately, all paths lead back to the Dungeon Master.

Your voice is the genesis. Begin the creation...
        `;
    }
    
    broadcastNarration(text, result = null) {
        const message = {
            type: 'dm_narration',
            text: text,
            timestamp: Date.now(),
            worldEffects: result ? result.constructions : []
        };
        
        this.wsServer.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
    
    broadcastMinimapUpdate() {
        const message = {
            type: 'minimap_update',
            minimap: this.eyeMinimap,
            timestamp: Date.now()
        };
        
        this.wsServer.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
    
    broadcastDecisionPoint(playerId, decision) {
        const message = {
            type: 'decision_point',
            playerId: playerId,
            decision: decision
        };
        
        this.wsServer.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
    
    async handleRealmMessage(ws, sessionId, data) {
        switch (data.type) {
            case 'voice_start':
                this.playerInterface.voiceCommands.get(sessionId).active = true;
                break;
                
            case 'voice_data':
                await this.processVoiceInput({
                    audioData: data.audioData,
                    metadata: { sessionId }
                });
                break;
                
            case 'voice_end':
                this.playerInterface.voiceCommands.get(sessionId).active = false;
                break;
                
            case 'text_command':
                const result = await this.processPlayerAction({
                    playerId: sessionId,
                    action: data.action,
                    target: data.target,
                    parameters: data.parameters
                });
                ws.send(JSON.stringify({
                    type: 'action_result',
                    result: result
                }));
                break;
                
            case 'dm_override':
                // DM can override any NPC or player action
                if (data.override === 'approve') {
                    // Process the pending action
                } else {
                    // Cancel the action
                }
                break;
        }
    }
    
    generateSessionId() {
        return 'realm_' + Math.random().toString(36).substring(2, 9);
    }
    
    generateDMInterface() {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>🎭 Dungeon Master Orchestrator</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=MedievalSharp&family=Uncial+Antiqua&display=swap');
                
                * { box-sizing: border-box; }
                
                body {
                    font-family: 'MedievalSharp', serif;
                    background: #0a0a0a;
                    color: #f0e6d2;
                    margin: 0;
                    padding: 0;
                    overflow: hidden;
                    background-image: 
                        radial-gradient(circle at 20% 50%, rgba(138, 43, 226, 0.2) 0%, transparent 40%),
                        radial-gradient(circle at 80% 80%, rgba(75, 0, 130, 0.2) 0%, transparent 40%);
                }
                
                .dm-interface {
                    display: grid;
                    grid-template-columns: 300px 1fr 350px;
                    grid-template-rows: 60px 1fr 150px;
                    height: 100vh;
                    gap: 2px;
                    background: rgba(0, 0, 0, 0.5);
                }
                
                /* Header */
                .header {
                    grid-column: 1 / -1;
                    background: linear-gradient(to bottom, rgba(138, 43, 226, 0.3), rgba(75, 0, 130, 0.2));
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-bottom: 2px solid rgba(255, 215, 0, 0.3);
                }
                
                .header h1 {
                    font-family: 'Uncial Antiqua', cursive;
                    font-size: 2em;
                    margin: 0;
                    color: #ffd700;
                    text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
                }
                
                /* NPC Panel */
                .npc-panel {
                    background: rgba(20, 0, 40, 0.8);
                    border-right: 1px solid rgba(255, 215, 0, 0.2);
                    overflow-y: auto;
                    padding: 20px;
                }
                
                .npc-card {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 215, 0, 0.2);
                    border-radius: 10px;
                    padding: 15px;
                    margin-bottom: 15px;
                    transition: all 0.3s ease;
                }
                
                .npc-card:hover {
                    background: rgba(255, 255, 255, 0.1);
                    border-color: rgba(255, 215, 0, 0.5);
                    transform: translateX(5px);
                }
                
                .npc-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 10px;
                }
                
                .npc-emoji {
                    font-size: 2em;
                }
                
                .npc-name {
                    font-weight: bold;
                    color: #ffd700;
                }
                
                .npc-stats {
                    font-size: 0.9em;
                    color: #ccc;
                }
                
                .npc-questions {
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .question {
                    background: rgba(255, 215, 0, 0.1);
                    padding: 5px 10px;
                    border-radius: 5px;
                    margin: 5px 0;
                    font-size: 0.85em;
                    font-style: italic;
                }
                
                /* Eye Minimap */
                .minimap-container {
                    background: #000;
                    border: 2px solid rgba(255, 215, 0, 0.3);
                    border-radius: 15px;
                    padding: 10px;
                    position: relative;
                    overflow: hidden;
                }
                
                .minimap-canvas {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    background: radial-gradient(ellipse at center, 
                        rgba(138, 43, 226, 0.1) 0%, 
                        transparent 70%);
                }
                
                .sound-wave {
                    position: absolute;
                    border-radius: 50%;
                    pointer-events: none;
                    animation: ripple 3s ease-out;
                }
                
                @keyframes ripple {
                    0% {
                        transform: scale(0);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
                
                .minimap-object {
                    position: absolute;
                    font-size: 1.5em;
                    cursor: pointer;
                    transition: transform 0.2s;
                }
                
                .minimap-object:hover {
                    transform: scale(1.2);
                }
                
                .minimap-overlay {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    background: rgba(0, 0, 0, 0.7);
                    padding: 10px;
                    border-radius: 5px;
                    font-size: 0.8em;
                }
                
                /* Saga Panel */
                .saga-panel {
                    background: rgba(40, 0, 20, 0.8);
                    border-left: 1px solid rgba(255, 215, 0, 0.2);
                    overflow-y: auto;
                    padding: 20px;
                }
                
                .quest-card {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 215, 0, 0.2);
                    border-radius: 10px;
                    padding: 15px;
                    margin-bottom: 15px;
                }
                
                .quest-name {
                    font-weight: bold;
                    color: #ffd700;
                    margin-bottom: 5px;
                }
                
                .quest-objective {
                    font-size: 0.9em;
                    color: #ccc;
                    margin-bottom: 5px;
                }
                
                .quest-reward {
                    font-size: 0.85em;
                    color: #90EE90;
                }
                
                /* DM Console */
                .dm-console {
                    grid-column: 1 / -1;
                    background: rgba(0, 0, 0, 0.9);
                    border-top: 2px solid rgba(255, 215, 0, 0.3);
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                
                .narration-input {
                    width: 100%;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 215, 0, 0.3);
                    color: #f0e6d2;
                    padding: 10px;
                    border-radius: 5px;
                    font-family: 'MedievalSharp', serif;
                    font-size: 1.1em;
                    resize: none;
                }
                
                .narration-input:focus {
                    outline: none;
                    border-color: #ffd700;
                    box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
                }
                
                .dm-controls {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                }
                
                .dm-btn {
                    background: linear-gradient(135deg, rgba(138, 43, 226, 0.5), rgba(75, 0, 130, 0.5));
                    border: 1px solid rgba(255, 215, 0, 0.5);
                    color: #ffd700;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-family: 'MedievalSharp', serif;
                    transition: all 0.3s ease;
                }
                
                .dm-btn:hover {
                    background: linear-gradient(135deg, rgba(138, 43, 226, 0.7), rgba(75, 0, 130, 0.7));
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(255, 215, 0, 0.3);
                }
                
                .voice-indicator {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #333;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                
                .voice-indicator.active {
                    background: #ff0000;
                    animation: pulse 1s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                
                /* Sound Visualization */
                .sound-viz {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                }
                
                .freq-bar {
                    display: inline-block;
                    width: 4px;
                    background: linear-gradient(to top, #ffd700, #ff6347);
                    margin: 0 2px;
                    transform-origin: bottom;
                    animation: freq-dance 0.5s ease infinite alternate;
                }
                
                @keyframes freq-dance {
                    to { transform: scaleY(0.3); }
                }
                
                /* Floating Symbols */
                .floating-symbol {
                    position: absolute;
                    font-size: 2em;
                    animation: float-up 3s ease-out;
                    pointer-events: none;
                }
                
                @keyframes float-up {
                    0% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-100px);
                    }
                }
                
                /* Player Action Log */
                .action-log {
                    position: fixed;
                    bottom: 170px;
                    right: 20px;
                    width: 300px;
                    max-height: 200px;
                    background: rgba(0, 0, 0, 0.9);
                    border: 1px solid rgba(255, 215, 0, 0.3);
                    border-radius: 10px;
                    padding: 15px;
                    overflow-y: auto;
                }
                
                .action-entry {
                    font-size: 0.85em;
                    margin: 5px 0;
                    padding: 5px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 3px;
                }
                
                .action-entry.player {
                    border-left: 3px solid #00ff00;
                }
                
                .action-entry.npc {
                    border-left: 3px solid #ffd700;
                }
                
                .action-entry.dm {
                    border-left: 3px solid #ff00ff;
                }
            </style>
        </head>
        <body>
            <div class="dm-interface">
                <!-- Header -->
                <div class="header">
                    <h1>🎭 Dungeon Master's Realm 🎭</h1>
                </div>
                
                <!-- NPC Panel -->
                <div class="npc-panel">
                    <h2 style="margin-top: 0; color: #ffd700;">NPCs</h2>
                    <div id="npcList"></div>
                </div>
                
                <!-- Eye Minimap -->
                <div class="minimap-container">
                    <div class="minimap-canvas" id="minimapCanvas">
                        <div class="minimap-overlay">
                            <div>👁️ Eye Minimap</div>
                            <div style="font-size: 0.7em; margin-top: 5px;">Sound → Vision</div>
                        </div>
                        <div id="minimapObjects"></div>
                        <div id="soundWaves"></div>
                    </div>
                    <div class="sound-viz" id="soundViz" style="display: none;">
                        <!-- Frequency bars will be added dynamically -->
                    </div>
                </div>
                
                <!-- Saga Panel -->
                <div class="saga-panel">
                    <h2 style="margin-top: 0; color: #ffd700;">Active Quests</h2>
                    <div id="questList"></div>
                    
                    <h3 style="color: #ffd700; margin-top: 30px;">World Events</h3>
                    <div id="worldEvents"></div>
                </div>
                
                <!-- DM Console -->
                <div class="dm-console">
                    <textarea 
                        id="narrationInput" 
                        class="narration-input" 
                        placeholder="Speak your narration... Describe the world, spawn creatures, create quests..."
                        rows="3"
                    ></textarea>
                    <div class="dm-controls">
                        <button class="dm-btn" onclick="narrate()">
                            📜 Narrate
                        </button>
                        <button class="dm-btn" onclick="generateQuest()">
                            ⚔️ Create Quest
                        </button>
                        <button class="dm-btn" onclick="spawnCreature()">
                            🐉 Spawn Creature
                        </button>
                        <button class="dm-btn" onclick="worldEvent()">
                            🌟 World Event
                        </button>
                        <div class="voice-indicator" id="voiceIndicator" onclick="toggleVoice()">
                            🎙️
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Player Action Log -->
            <div class="action-log" id="actionLog">
                <h4 style="margin-top: 0; color: #ffd700;">Action Log</h4>
                <div id="actionEntries"></div>
            </div>
            
            <script>
                let ws;
                let isRecording = false;
                let audioContext;
                let mediaRecorder;
                let currentNPCs = {};
                let currentQuests = [];
                let minimapObjects = [];
                
                function connectWebSocket() {
                    ws = new WebSocket('ws://localhost:7905');
                    
                    ws.onopen = () => {
                        console.log('Connected to DM Realm');
                        addActionLog('Connected to the realm', 'dm');
                    };
                    
                    ws.onmessage = (event) => {
                        const data = JSON.parse(event.data);
                        handleRealmMessage(data);
                    };
                    
                    ws.onclose = () => {
                        addActionLog('Connection lost, reconnecting...', 'dm');
                        setTimeout(connectWebSocket, 3000);
                    };
                }
                
                function handleRealmMessage(data) {
                    switch(data.type) {
                        case 'world_init':
                            initializeWorld(data);
                            break;
                            
                        case 'dm_narration':
                            handleNarration(data);
                            break;
                            
                        case 'minimap_update':
                            updateMinimap(data.minimap);
                            break;
                            
                        case 'npc_construction':
                            handleNPCConstruction(data);
                            break;
                            
                        case 'quest_created':
                            addQuest(data.quest);
                            break;
                            
                        case 'player_action':
                            handlePlayerAction(data);
                            break;
                            
                        case 'decision_point':
                            handleDecisionPoint(data);
                            break;
                    }
                }
                
                function initializeWorld(data) {
                    // Display welcome message
                    console.log(data.message);
                    
                    // Initialize NPCs
                    updateNPCDisplay(data.npcs);
                    
                    // Initialize quests
                    data.quests.forEach(quest => addQuest(quest));
                    
                    // Initialize minimap
                    updateMinimap(data.minimap);
                }
                
                function updateNPCDisplay(npcs) {
                    currentNPCs = npcs;
                    const npcList = document.getElementById('npcList');
                    npcList.innerHTML = '';
                    
                    Object.entries(npcs).forEach(([name, npc]) => {
                        const card = document.createElement('div');
                        card.className = 'npc-card';
                        
                        let questionsHtml = '';
                        if (npc.questionsCount > 0) {
                            questionsHtml = \`
                                <div class="npc-questions">
                                    <div class="question">❓ \${npc.questionsCount} questions pending</div>
                                </div>
                            \`;
                        }
                        
                        card.innerHTML = \`
                            <div class="npc-header">
                                <div class="npc-emoji">\${npc.emoji}</div>
                                <div>
                                    <div class="npc-name">\${name}</div>
                                    <div class="npc-stats">\${npc.role}</div>
                                </div>
                            </div>
                            <div class="npc-stats">
                                Knowledge: \${npc.knowledgeCount} | Built: \${npc.buildCount}
                            </div>
                            \${questionsHtml}
                        \`;
                        
                        npcList.appendChild(card);
                    });
                }
                
                function updateMinimap(minimap) {
                    if (!minimap || !minimap.layers) return;
                    
                    const objectsContainer = document.getElementById('minimapObjects');
                    const wavesContainer = document.getElementById('soundWaves');
                    
                    // Clear existing objects
                    objectsContainer.innerHTML = '';
                    wavesContainer.innerHTML = '';
                    
                    // Add entities
                    if (minimap.layers.entities) {
                        minimap.layers.entities.objects.forEach(obj => {
                            const objEl = document.createElement('div');
                            objEl.className = 'minimap-object';
                            objEl.style.left = obj.x + 'px';
                            objEl.style.top = obj.y + 'px';
                            objEl.textContent = obj.icon;
                            objEl.title = obj.properties ? obj.properties.name : obj.type;
                            objectsContainer.appendChild(objEl);
                        });
                        
                        // Add players
                        minimap.layers.entities.players.forEach(player => {
                            const playerEl = document.createElement('div');
                            playerEl.className = 'minimap-object';
                            playerEl.style.left = player.x + 'px';
                            playerEl.style.top = player.y + 'px';
                            playerEl.textContent = player.icon;
                            playerEl.title = player.name;
                            objectsContainer.appendChild(playerEl);
                        });
                    }
                    
                    // Add sound waves
                    if (minimap.layers.soundscape) {
                        minimap.layers.soundscape.waveforms.forEach(wave => {
                            if (wave.visualization && wave.visualization.ripples) {
                                wave.visualization.ripples.forEach(ripple => {
                                    const waveEl = document.createElement('div');
                                    waveEl.className = 'sound-wave';
                                    waveEl.style.left = ripple.center.x + 'px';
                                    waveEl.style.top = ripple.center.y + 'px';
                                    waveEl.style.width = ripple.radius * 2 + 'px';
                                    waveEl.style.height = ripple.radius * 2 + 'px';
                                    waveEl.style.marginLeft = -ripple.radius + 'px';
                                    waveEl.style.marginTop = -ripple.radius + 'px';
                                    waveEl.style.border = \`2px solid \${ripple.color}\`;
                                    waveEl.style.opacity = ripple.opacity;
                                    wavesContainer.appendChild(waveEl);
                                });
                            }
                        });
                    }
                }
                
                async function narrate() {
                    const text = document.getElementById('narrationInput').value;
                    if (!text.trim()) return;
                    
                    try {
                        const response = await fetch('/dm/narrate', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ text })
                        });
                        
                        const result = await response.json();
                        console.log('Narration processed:', result);
                        
                        // Show sound visualization
                        showSoundVisualization(result);
                        
                        // Clear input
                        document.getElementById('narrationInput').value = '';
                        
                        addActionLog('DM narrates: ' + text.substring(0, 50) + '...', 'dm');
                    } catch (error) {
                        console.error('Narration error:', error);
                    }
                }
                
                function showSoundVisualization(result) {
                    const soundViz = document.getElementById('soundViz');
                    soundViz.innerHTML = '';
                    soundViz.style.display = 'block';
                    
                    // Create frequency bars
                    for (let i = 0; i < 20; i++) {
                        const bar = document.createElement('div');
                        bar.className = 'freq-bar';
                        bar.style.height = (20 + Math.random() * 60) + 'px';
                        bar.style.animationDelay = (i * 0.05) + 's';
                        soundViz.appendChild(bar);
                    }
                    
                    // Add floating symbols
                    if (result.symbols) {
                        result.symbols.forEach((sym, i) => {
                            setTimeout(() => {
                                addFloatingSymbol(sym.symbol);
                            }, i * 200);
                        });
                    }
                    
                    // Hide after animation
                    setTimeout(() => {
                        soundViz.style.display = 'none';
                    }, 3000);
                }
                
                function addFloatingSymbol(symbol) {
                    const canvas = document.getElementById('minimapCanvas');
                    const symEl = document.createElement('div');
                    symEl.className = 'floating-symbol';
                    symEl.textContent = symbol;
                    symEl.style.left = (Math.random() * 80 + 10) + '%';
                    symEl.style.top = '80%';
                    canvas.appendChild(symEl);
                    
                    // Remove after animation
                    setTimeout(() => symEl.remove(), 3000);
                }
                
                function generateQuest() {
                    const questTypes = [
                        "Find the Lost Artifact of Power",
                        "Defeat the Shadow Beast",
                        "Rescue the Captured Sage",
                        "Explore the Forgotten Temple",
                        "Gather the Three Sacred Stones"
                    ];
                    
                    const quest = questTypes[Math.floor(Math.random() * questTypes.length)];
                    document.getElementById('narrationInput').value = \`A new quest emerges: \${quest}. Heroes are needed to answer the call!\`;
                    narrate();
                }
                
                function spawnCreature() {
                    const creatures = [
                        "ancient dragon",
                        "mystical unicorn",
                        "shadow wraith",
                        "stone golem",
                        "forest sprite"
                    ];
                    
                    const creature = creatures[Math.floor(Math.random() * creatures.length)];
                    document.getElementById('narrationInput').value = \`A \${creature} appears in the realm, its presence felt by all!\`;
                    narrate();
                }
                
                function worldEvent() {
                    const events = [
                        "The sky darkens as an eclipse begins",
                        "Ancient ruins rise from the earth",
                        "A magical storm sweeps across the land",
                        "Portals to other realms begin opening",
                        "The earth trembles with mysterious power"
                    ];
                    
                    const event = events[Math.floor(Math.random() * events.length)];
                    document.getElementById('narrationInput').value = event;
                    narrate();
                }
                
                function toggleVoice() {
                    const indicator = document.getElementById('voiceIndicator');
                    
                    if (!isRecording) {
                        startRecording();
                        indicator.classList.add('active');
                        isRecording = true;
                    } else {
                        stopRecording();
                        indicator.classList.remove('active');
                        isRecording = false;
                    }
                }
                
                async function startRecording() {
                    try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        audioContext = new AudioContext();
                        
                        // Analyze audio for visualization
                        const analyser = audioContext.createAnalyser();
                        const source = audioContext.createMediaStreamSource(stream);
                        source.connect(analyser);
                        
                        // Start visualization
                        visualizeAudio(analyser);
                        
                        // Start recording
                        mediaRecorder = new MediaRecorder(stream);
                        const chunks = [];
                        
                        mediaRecorder.ondataavailable = (e) => {
                            chunks.push(e.data);
                        };
                        
                        mediaRecorder.onstop = async () => {
                            const blob = new Blob(chunks, { type: 'audio/webm' });
                            // Send to server for processing
                            await processAudioBlob(blob);
                        };
                        
                        mediaRecorder.start();
                        
                        // Notify server
                        ws.send(JSON.stringify({ type: 'voice_start' }));
                        
                    } catch (error) {
                        console.error('Recording error:', error);
                        alert('Microphone access required for voice commands');
                    }
                }
                
                function stopRecording() {
                    if (mediaRecorder && mediaRecorder.state === 'recording') {
                        mediaRecorder.stop();
                        
                        // Stop all tracks
                        mediaRecorder.stream.getTracks().forEach(track => track.stop());
                        
                        // Notify server
                        ws.send(JSON.stringify({ type: 'voice_end' }));
                    }
                    
                    if (audioContext) {
                        audioContext.close();
                    }
                }
                
                function visualizeAudio(analyser) {
                    const soundViz = document.getElementById('soundViz');
                    soundViz.style.display = 'block';
                    
                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);
                    
                    function draw() {
                        if (!isRecording) {
                            soundViz.style.display = 'none';
                            return;
                        }
                        
                        requestAnimationFrame(draw);
                        analyser.getByteFrequencyData(dataArray);
                        
                        // Update frequency bars based on actual audio
                        const bars = soundViz.querySelectorAll('.freq-bar');
                        bars.forEach((bar, i) => {
                            const value = dataArray[i * Math.floor(bufferLength / bars.length)];
                            bar.style.height = (value / 255 * 80 + 20) + 'px';
                        });
                    }
                    
                    draw();
                }
                
                async function processAudioBlob(blob) {
                    // Convert blob to base64 for sending
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                        const base64 = reader.result.split(',')[1];
                        
                        try {
                            const response = await fetch('/dm/voice', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    audioData: {
                                        base64: base64,
                                        mimeType: 'audio/webm'
                                    }
                                })
                            });
                            
                            const result = await response.json();
                            console.log('Voice processed:', result);
                            
                            // Show results
                            showSoundVisualization(result);
                            
                        } catch (error) {
                            console.error('Voice processing error:', error);
                        }
                    };
                    
                    reader.readAsDataURL(blob);
                }
                
                function addQuest(quest) {
                    currentQuests.push(quest);
                    updateQuestDisplay();
                }
                
                function updateQuestDisplay() {
                    const questList = document.getElementById('questList');
                    questList.innerHTML = '';
                    
                    currentQuests.forEach(quest => {
                        const card = document.createElement('div');
                        card.className = 'quest-card';
                        card.innerHTML = \`
                            <div class="quest-name">📜 \${quest.name}</div>
                            <div class="quest-objective">\${quest.objective}</div>
                            <div class="quest-reward">Reward: \${quest.reward}</div>
                        \`;
                        questList.appendChild(card);
                    });
                }
                
                function handleNarration(data) {
                    // Add floating text effect
                    if (data.worldEffects && data.worldEffects.length > 0) {
                        data.worldEffects.forEach(effect => {
                            addActionLog(\`\${effect.builder} creates \${effect.type}\`, 'npc');
                        });
                    }
                }
                
                function handleNPCConstruction(data) {
                    addActionLog(\`\${data.npc} builds \${data.construction.type}\`, 'npc');
                    
                    // Add to minimap
                    const obj = {
                        icon: data.construction.builder,
                        x: Math.random() * 600 + 100,
                        y: Math.random() * 400 + 100,
                        type: data.construction.type
                    };
                    
                    addMinimapObject(obj);
                }
                
                function handlePlayerAction(data) {
                    addActionLog(\`Player: \${data.action} \${data.target || ''}\`, 'player');
                }
                
                function handleDecisionPoint(data) {
                    const decision = confirm(data.decision.question + '\\n\\nOptions: ' + data.decision.options.join(', '));
                    
                    // Send decision back
                    ws.send(JSON.stringify({
                        type: 'decision_response',
                        decisionId: data.decision.id,
                        choice: decision ? 'Yes' : 'No'
                    }));
                }
                
                function addMinimapObject(obj) {
                    const objectsContainer = document.getElementById('minimapObjects');
                    const objEl = document.createElement('div');
                    objEl.className = 'minimap-object';
                    objEl.style.left = obj.x + 'px';
                    objEl.style.top = obj.y + 'px';
                    objEl.textContent = obj.icon;
                    objEl.title = obj.type;
                    objectsContainer.appendChild(objEl);
                }
                
                function addActionLog(message, type) {
                    const entries = document.getElementById('actionEntries');
                    const entry = document.createElement('div');
                    entry.className = \`action-entry \${type}\`;
                    entry.textContent = new Date().toLocaleTimeString() + ' - ' + message;
                    entries.appendChild(entry);
                    
                    // Keep only last 20 entries
                    if (entries.children.length > 20) {
                        entries.removeChild(entries.firstChild);
                    }
                    
                    entries.scrollTop = entries.scrollHeight;
                }
                
                // Keyboard shortcuts
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                        narrate();
                    } else if (e.key === ' ' && e.ctrlKey) {
                        toggleVoice();
                        e.preventDefault();
                    }
                });
                
                // Initialize
                connectWebSocket();
                
                // Initialize with some frequency bars
                const soundViz = document.getElementById('soundViz');
                for (let i = 0; i < 20; i++) {
                    const bar = document.createElement('div');
                    bar.className = 'freq-bar';
                    bar.style.height = '20px';
                    soundViz.appendChild(bar);
                }
            </script>
        </body>
        </html>
        `;
    }
    
    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(`🎭 Dungeon Master Orchestrator running on http://localhost:${this.port}`);
            console.log(`🔌 WebSocket server running on ws://localhost:${this.wsPort}`);
            console.log('🎙️ Voice-to-world pipeline active');
            console.log('👁️ Eye Minimap visualizing sound as reality');
            console.log('🧙 NPCs await your commands, ready to build');
            console.log('📚 The realm responds to your voice...');
        });
    }
}

// Initialize and start the DM
const dungeonMaster = new DungeonMasterOrchestrator();
dungeonMaster.start();

module.exports = DungeonMasterOrchestrator;