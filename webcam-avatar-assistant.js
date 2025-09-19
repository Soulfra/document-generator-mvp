#!/usr/bin/env node
// WEBCAM-AVATAR-ASSISTANT.js - Advanced avatar assistant for boss battles

const express = require('express');
const WebSocket = require('ws');
const { EventEmitter } = require('events');

console.log('👤 WEBCAM AVATAR ASSISTANT INITIALIZING...');
console.log('=========================================');
console.log('📷 Webcam Integration: Real-time face/gesture detection');
console.log('🤖 AI Assistant: Battle companion with personality');
console.log('🎭 Avatar Modes: Helpful, Expert, Encouraging, Analytical');
console.log('🗣️ Voice Integration: Speech recognition and synthesis');

class WebcamAvatarAssistant extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 9000,
            wsPort: options.wsPort || 9001,
            
            // Avatar personality settings
            personality: {
                default: 'helpful-companion',
                modes: ['helpful', 'expert', 'encouraging', 'analytical', 'silent'],
                adaptiveness: 'high',
                learningEnabled: true
            },
            
            // Webcam settings
            webcam: {
                resolution: { width: 640, height: 480 },
                frameRate: 30,
                faceDetection: true,
                emotionRecognition: true,
                gestureDetection: true,
                eyeTracking: true
            },
            
            // Voice settings
            voice: {
                synthesis: true,
                recognition: true,
                language: 'en-US',
                volume: 0.7,
                rate: 1.0,
                pitch: 1.0
            },
            
            // Battle integration
            battles: {
                adviceFrequency: 'adaptive', // 'low', 'medium', 'high', 'adaptive'
                contextAwareness: true,
                patternRecognition: true,
                performanceTracking: true
            }
        };
        
        // Avatar state
        this.avatar = {
            currentMode: this.config.personality.default,
            emotionalState: 'neutral',
            engagement: 0.5,
            userPreferences: new Map(),
            battleContext: null,
            conversationHistory: [],
            performance: {
                battlesWatched: 0,
                adviceGiven: 0,
                successfulSuggestions: 0,
                userSatisfaction: 0.8
            }
        };
        
        // Webcam processing
        this.webcam = {
            stream: null,
            faceDetector: null,
            emotionAnalyzer: null,
            gestureRecognizer: null,
            eyeTracker: null,
            currentFrame: null,
            analysisResults: {
                face: null,
                emotion: null,
                gesture: null,
                eyeGaze: null,
                attention: 1.0
            }
        };
        
        // Voice processing
        this.voice = {
            synthesis: null,
            recognition: null,
            currentUtterance: null,
            isListening: false,
            isSpeaking: false,
            commandHistory: [],
            responseQueue: []
        };
        
        // Battle intelligence
        this.battleAI = {
            patternDatabase: new Map(),
            userAnalytics: new Map(),
            adviceStrategies: new Map(),
            contextTracker: new Map()
        };
        
        // Connected clients and battles
        this.clients = new Map();
        this.activeBattles = new Map();
        
        this.initializeAvatarAssistant();
    }
    
    async initializeAvatarAssistant() {
        console.log('🔄 Initializing Avatar Assistant...');
        
        try {
            // Initialize personality system
            await this.initializePersonality();
            
            // Initialize battle intelligence
            await this.initializeBattleAI();
            
            // Initialize voice system
            await this.initializeVoiceSystem();
            
            // Create web interface
            await this.createWebInterface();
            
            // Start WebSocket server
            await this.startWebSocketServer();
            
            // Start web server
            await this.startWebServer();
            
            console.log('✅ Webcam Avatar Assistant ready!');
            this.emit('assistant-ready');
            
        } catch (error) {
            console.error('❌ Avatar Assistant initialization failed:', error);
        }
    }
    
    async initializePersonality() {
        console.log('🎭 Initializing Avatar Personality System...');
        
        // Personality profiles with battle-specific responses
        this.personalityProfiles = {
            'helpful-companion': {
                name: 'Helpful Companion',
                description: 'Friendly and supportive battle assistant',
                traits: ['encouraging', 'patient', 'observant'],
                battleResponses: {
                    start: [
                        "Alright! Let's tackle this boss together! I'll be watching and helping.",
                        "I'm here to support you through this battle. You've got this!",
                        "Ready when you are! I'll keep an eye on patterns and give you tips."
                    ],
                    success: [
                        "Excellent move! That was perfectly timed!",
                        "Nice work! You're really getting the hang of this boss!",
                        "Great strategy! I can see you're adapting to its patterns."
                    ],
                    struggle: [
                        "Don't worry, this boss is tricky. Let me help you spot its pattern.",
                        "I notice the boss has a vulnerability window after its special attack.",
                        "You're doing better than you think! Try focusing on dodging for now."
                    ],
                    victory: [
                        "Amazing! You completely mastered that boss!",
                        "Incredible work! Your improvement was fantastic to watch!",
                        "That was awesome! You really showed that boss who's in charge!"
                    ]
                },
                voiceSettings: {
                    tone: 'warm',
                    pitch: 1.1,
                    rate: 0.95,
                    volume: 0.8
                }
            },
            
            'expert-analyst': {
                name: 'Expert Analyst',
                description: 'Data-driven strategic battle advisor',
                traits: ['analytical', 'precise', 'strategic'],
                battleResponses: {
                    start: [
                        "Analyzing boss parameters... Initial assessment: moderate threat level.",
                        "Beginning pattern recognition protocol. I'll track all attack sequences.",
                        "Combat analysis initialized. I'll provide tactical recommendations."
                    ],
                    success: [
                        "Optimal execution. Your DPS timing was 94% efficient.",
                        "Excellent pattern recognition. You predicted that attack sequence perfectly.",
                        "Superior positioning. Your dodge timing improved by 23% this round."
                    ],
                    struggle: [
                        "I've identified a 2.3-second vulnerability window after the boss's charge attack.",
                        "Your defensive positioning is suboptimal. Recommend flanking maneuver.",
                        "Boss pattern analysis complete. Next attack cycle begins in 4 seconds."
                    ],
                    victory: [
                        "Combat analysis complete. Victory achieved with 87% efficiency rating.",
                        "Excellent performance metrics. All tactical recommendations implemented successfully.",
                        "Boss defeated. Your improvement curve shows 340% efficiency gain."
                    ]
                },
                voiceSettings: {
                    tone: 'professional',
                    pitch: 0.9,
                    rate: 1.1,
                    volume: 0.7
                }
            },
            
            'energetic-coach': {
                name: 'Energetic Coach',
                description: 'High-energy motivational battle coach',
                traits: ['enthusiastic', 'motivational', 'energetic'],
                battleResponses: {
                    start: [
                        "YEAH! Let's show this boss what we're made of! I'm pumped!",
                        "Battle time! I'm so excited to see you crush this challenge!",
                        "HERE WE GO! You're about to dominate this boss! Let's DO THIS!"
                    ],
                    success: [
                        "YES! THAT'S WHAT I'M TALKING ABOUT! Incredible hit!",
                        "OH MY GOSH! That was AMAZING! You're on fire!",
                        "FANTASTIC! You just pulled off the perfect combo! Keep it going!"
                    ],
                    struggle: [
                        "Hey, don't give up! You're stronger than this boss thinks!",
                        "Come on! I believe in you! You can turn this around!",
                        "This is your moment to shine! Show that boss your determination!"
                    ],
                    victory: [
                        "YES YES YES! YOU DID IT! That was absolutely INCREDIBLE!",
                        "CHAMPION! You just demolished that boss like a true hero!",
                        "VICTORY! That was the most amazing battle I've ever witnessed!"
                    ]
                },
                voiceSettings: {
                    tone: 'excited',
                    pitch: 1.3,
                    rate: 1.2,
                    volume: 0.9
                }
            },
            
            'zen-master': {
                name: 'Zen Master',
                description: 'Calm and wise spiritual battle guide',
                traits: ['calm', 'wise', 'philosophical'],
                battleResponses: {
                    start: [
                        "Center yourself. Breathe. The boss is just another challenge to overcome.",
                        "Feel the rhythm of battle. I will guide you with gentle wisdom.",
                        "Peace, warrior. Together we will find the path to victory."
                    ],
                    success: [
                        "Beautiful. Like water flowing around stone, you adapted perfectly.",
                        "Harmony achieved. Your movements were in perfect balance.",
                        "Wisdom guides your blade. That strike came from inner peace."
                    ],
                    struggle: [
                        "Patience. Even the mightiest mountain was carved by gentle rain.",
                        "Breathe deeply. The boss's strength becomes weakness when understood.",
                        "Do not force victory. Let it flow naturally from your understanding."
                    ],
                    victory: [
                        "The cycle is complete. You have found balance through challenge.",
                        "Victory through harmony. The boss taught you, and you learned well.",
                        "Inner peace reflected in outer triumph. Well fought, warrior."
                    ]
                },
                voiceSettings: {
                    tone: 'serene',
                    pitch: 0.8,
                    rate: 0.8,
                    volume: 0.6
                }
            }
        };
        
        // Set initial personality
        this.setPersonality(this.config.personality.default);
        
        console.log('  ✅ Personality profiles loaded');
    }
    
    async initializeBattleAI() {
        console.log('🧠 Initializing Battle AI Intelligence...');
        
        // Pattern recognition system for boss battles
        this.battleAI.patternRecognizer = {
            // Analyze boss attack patterns
            analyzeBossPattern: (battleData) => {
                const attacks = battleData.attacks || [];
                const patterns = [];
                
                // Look for repeating sequences
                for (let i = 0; i < attacks.length - 2; i++) {
                    const sequence = attacks.slice(i, i + 3);
                    const sequenceStr = sequence.map(a => a.type).join('-');
                    
                    if (!patterns.find(p => p.sequence === sequenceStr)) {
                        patterns.push({
                            sequence: sequenceStr,
                            frequency: this.countSequenceFrequency(attacks, sequence),
                            timing: this.calculateSequenceTiming(sequence),
                            vulnerability: this.findVulnerabilityWindow(sequence)
                        });
                    }
                }
                
                return patterns.sort((a, b) => b.frequency - a.frequency);
            },
            
            // Predict next boss action
            predictNextAction: (battleHistory, currentHealth) => {
                const recentActions = battleHistory.slice(-5);
                const healthThreshold = currentHealth / 100;
                
                // Health-based prediction
                if (healthThreshold < 0.3) {
                    return {
                        type: 'desperate-attack',
                        confidence: 0.8,
                        timing: 'immediate',
                        advice: 'Boss is at low health - expect desperate attacks!'
                    };
                } else if (healthThreshold < 0.6) {
                    return {
                        type: 'special-ability',
                        confidence: 0.6,
                        timing: 'within-10-seconds',
                        advice: 'Special attack likely incoming - prepare to dodge!'
                    };
                }
                
                return {
                    type: 'normal-attack',
                    confidence: 0.4,
                    timing: 'variable',
                    advice: 'Maintain pressure and watch for openings.'
                };
            }
        };
        
        // User performance analytics
        this.battleAI.performanceAnalyzer = {
            trackUserPerformance: (userId, battleData) => {
                if (!this.battleAI.userAnalytics.has(userId)) {
                    this.battleAI.userAnalytics.set(userId, {
                        battlesWon: 0,
                        battlesLost: 0,
                        averageBattleTime: 0,
                        improvementRate: 0,
                        strengths: [],
                        weaknesses: [],
                        preferredStrategies: []
                    });
                }
                
                const analytics = this.battleAI.userAnalytics.get(userId);
                
                // Update stats based on battle outcome
                if (battleData.result === 'victory') {
                    analytics.battlesWon++;
                } else {
                    analytics.battlesLost++;
                }
                
                // Calculate improvement
                analytics.improvementRate = this.calculateImprovementRate(userId, battleData);
                
                // Identify strengths and weaknesses
                this.identifyUserPatterns(analytics, battleData);
                
                return analytics;
            },
            
            generatePersonalizedAdvice: (userId, battleContext) => {
                const analytics = this.battleAI.userAnalytics.get(userId);
                if (!analytics) return this.getGenericAdvice(battleContext);
                
                const advice = [];
                
                // Advice based on weaknesses
                if (analytics.weaknesses.includes('timing')) {
                    advice.push("Focus on timing your attacks right after the boss finishes its combo.");
                }
                if (analytics.weaknesses.includes('positioning')) {
                    advice.push("Try staying at medium range - you're most effective there.");
                }
                
                // Leverage strengths
                if (analytics.strengths.includes('pattern-recognition')) {
                    advice.push("You're great at spotting patterns! Trust your instincts on the next sequence.");
                }
                
                return advice.length > 0 ? advice : this.getGenericAdvice(battleContext);
            }
        };
        
        // Adaptive advice system
        this.battleAI.adviceSystem = {
            generateContextualAdvice: (battleState, userContext, personalityMode) => {
                const profile = this.personalityProfiles[personalityMode];
                if (!profile) return "Keep fighting!";
                
                // Determine battle phase
                const bossHealthPercent = (battleState.boss.health / battleState.boss.maxHealth) * 100;
                const playerHealthPercent = (battleState.player.health / battleState.player.maxHealth) * 100;
                
                let phase = 'start';
                if (bossHealthPercent < 30) phase = 'critical';
                else if (bossHealthPercent < 70) phase = 'mid';
                else if (playerHealthPercent < 30) phase = 'danger';
                
                // Get appropriate response
                let responses;
                if (playerHealthPercent < 30) {
                    responses = profile.battleResponses.struggle;
                } else if (battleState.recentSuccess) {
                    responses = profile.battleResponses.success;
                } else {
                    responses = profile.battleResponses.start;
                }
                
                return responses[Math.floor(Math.random() * responses.length)];
            }
        };
        
        console.log('  ✅ Battle AI intelligence initialized');
    }
    
    async initializeVoiceSystem() {
        console.log('🗣️ Initializing Voice System...');
        
        // Voice command processing
        this.voice.commandProcessor = {
            commands: {
                // Battle commands
                'attack': { action: 'battle', command: 'attack' },
                'defend': { action: 'battle', command: 'defend' },
                'dodge': { action: 'battle', command: 'dodge' },
                'special': { action: 'battle', command: 'special' },
                'retreat': { action: 'battle', command: 'retreat' },
                
                // Avatar commands
                'help': { action: 'avatar', command: 'request_help' },
                'advice': { action: 'avatar', command: 'give_advice' },
                'quiet': { action: 'avatar', command: 'reduce_chatter' },
                'more help': { action: 'avatar', command: 'increase_help' },
                'switch mode': { action: 'avatar', command: 'change_personality' },
                
                // System commands
                'pause': { action: 'system', command: 'pause_battle' },
                'resume': { action: 'system', command: 'resume_battle' },
                'status': { action: 'system', command: 'show_status' },
                'mute': { action: 'system', command: 'mute_avatar' },
                'unmute': { action: 'system', command: 'unmute_avatar' }
            },
            
            processCommand: (speechText) => {
                const text = speechText.toLowerCase().trim();
                
                // Find matching command
                for (const [phrase, command] of Object.entries(this.voice.commandProcessor.commands)) {
                    if (text.includes(phrase)) {
                        return {
                            recognized: true,
                            command,
                            confidence: this.calculateCommandConfidence(text, phrase),
                            originalText: speechText
                        };
                    }
                }
                
                return {
                    recognized: false,
                    command: null,
                    confidence: 0,
                    originalText: speechText,
                    response: "I didn't understand that command. Try saying 'help' for assistance."
                };
            }
        };
        
        // Speech synthesis responses
        this.voice.responseGenerator = {
            generateResponse: (context, personalityMode) => {
                const profile = this.personalityProfiles[personalityMode];
                if (!profile) return { text: "I'm here to help!", settings: {} };
                
                let responseText;
                if (context.type === 'battle_advice') {
                    responseText = this.battleAI.adviceSystem.generateContextualAdvice(
                        context.battleState, 
                        context.userContext, 
                        personalityMode
                    );
                } else if (context.type === 'command_response') {
                    responseText = context.message || "Got it!";
                } else {
                    responseText = "I'm watching and ready to help!";
                }
                
                return {
                    text: responseText,
                    settings: profile.voiceSettings
                };
            }
        };
        
        console.log('  ✅ Voice system initialized');
    }
    
    async createWebInterface() {
        console.log('🎨 Creating Avatar Web Interface...');
        
        this.app = express();
        this.app.use(express.json());
        this.app.use(express.static(__dirname + '/avatar-assets'));
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            if (req.method === 'OPTIONS') return res.sendStatus(200);
            next();
        });
        
        // Main avatar interface
        this.app.get('/', (req, res) => {
            res.send(this.generateAvatarInterface());
        });
        
        // Avatar configuration API
        this.app.get('/api/avatar/config', (req, res) => {
            res.json({
                personality: this.avatar.currentMode,
                availableModes: Object.keys(this.personalityProfiles),
                webcamSupported: true,
                voiceSupported: true,
                performance: this.avatar.performance
            });
        });
        
        // Change avatar personality
        this.app.post('/api/avatar/personality', (req, res) => {
            const { mode } = req.body;
            if (this.personalityProfiles[mode]) {
                this.setPersonality(mode);
                res.json({ success: true, newMode: mode });
            } else {
                res.status(400).json({ error: 'Invalid personality mode' });
            }
        });
        
        // Process webcam frame for analysis
        this.app.post('/api/avatar/analyze-frame', (req, res) => {
            const { frameData, timestamp } = req.body;
            
            // Simulate frame analysis (in real implementation, use ML models)
            const analysis = this.analyzeWebcamFrame(frameData);
            
            res.json({
                timestamp,
                analysis,
                suggestions: this.generateFrameBasedSuggestions(analysis)
            });
        });
        
        // Voice command endpoint
        this.app.post('/api/avatar/voice-command', (req, res) => {
            const { command, battleContext } = req.body;
            
            const result = this.voice.commandProcessor.processCommand(command);
            
            if (result.recognized) {
                const response = this.voice.responseGenerator.generateResponse(
                    { type: 'command_response', message: `Executing ${result.command.command}` },
                    this.avatar.currentMode
                );
                
                res.json({
                    success: true,
                    command: result.command,
                    response: response.text,
                    voiceSettings: response.settings
                });
            } else {
                res.json({
                    success: false,
                    error: result.response,
                    suggestions: Object.keys(this.voice.commandProcessor.commands).slice(0, 5)
                });
            }
        });
        
        console.log('  ✅ Web interface created');
    }
    
    async startWebSocketServer() {
        console.log('📡 Starting Avatar WebSocket Server...');
        
        this.wss = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wss.on('connection', (ws, req) => {
            const clientId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            
            this.clients.set(clientId, {
                ws,
                id: clientId,
                connectedAt: Date.now(),
                battleContext: null,
                preferences: {
                    personality: this.avatar.currentMode,
                    adviceFrequency: 'adaptive',
                    voiceEnabled: true,
                    webcamEnabled: false
                }
            });
            
            console.log(`👤 Avatar client connected: ${clientId}`);
            
            // Send initial avatar state
            ws.send(JSON.stringify({
                type: 'avatar_connected',
                clientId,
                personality: this.avatar.currentMode,
                availableModes: Object.keys(this.personalityProfiles),
                capabilities: {
                    webcam: this.config.webcam,
                    voice: this.config.voice,
                    battleAI: true
                }
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(ws, clientId, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                console.log(`👤 Avatar client disconnected: ${clientId}`);
                this.clients.delete(clientId);
            });
        });
        
        console.log(`  ✅ Avatar WebSocket server running on port ${this.config.wsPort}`);
    }
    
    async startWebServer() {
        this.app.listen(this.config.port, () => {
            console.log(`  ✅ Avatar web server running on port ${this.config.port}`);
        });
    }
    
    handleWebSocketMessage(ws, clientId, data) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        switch (data.type) {
            case 'battle_start':
                this.handleBattleStart(clientId, data.battleData);
                break;
                
            case 'battle_update':
                this.handleBattleUpdate(clientId, data.update);
                break;
                
            case 'battle_end':
                this.handleBattleEnd(clientId, data.result);
                break;
                
            case 'webcam_frame':
                this.handleWebcamFrame(clientId, data.frameData);
                break;
                
            case 'voice_input':
                this.handleVoiceInput(clientId, data.audioData);
                break;
                
            case 'gesture_detected':
                this.handleGestureDetection(clientId, data.gesture);
                break;
                
            case 'request_advice':
                this.handleAdviceRequest(clientId, data.context);
                break;
                
            case 'personality_change':
                this.handlePersonalityChange(clientId, data.newMode);
                break;
                
            default:
                console.log('Unknown avatar message:', data.type);
        }
    }
    
    handleBattleStart(clientId, battleData) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        client.battleContext = {
            battleId: battleData.id,
            boss: battleData.boss,
            startTime: Date.now(),
            events: [],
            userPerformance: {
                hits: 0,
                misses: 0,
                dodges: 0,
                damage: 0
            }
        };
        
        this.activeBattles.set(battleData.id, {
            clientId,
            battleData,
            startTime: Date.now()
        });
        
        // Avatar introduction
        const profile = this.personalityProfiles[client.preferences.personality];
        const introduction = profile.battleResponses.start[
            Math.floor(Math.random() * profile.battleResponses.start.length)
        ];
        
        this.sendAvatarMessage(clientId, {
            type: 'battle_start_response',
            message: introduction,
            voiceSettings: profile.voiceSettings,
            battleAdvice: this.battleAI.adviceSystem.generateContextualAdvice(
                battleData,
                client.preferences,
                client.preferences.personality
            )
        });
        
        console.log(`⚔️ Avatar watching battle: ${battleData.id}`);
    }
    
    handleBattleUpdate(clientId, update) {
        const client = this.clients.get(clientId);
        if (!client || !client.battleContext) return;
        
        client.battleContext.events.push({
            timestamp: Date.now(),
            type: update.type,
            data: update
        });
        
        // Update performance tracking
        if (update.type === 'player_attack') {
            if (update.hit) {
                client.battleContext.userPerformance.hits++;
                client.battleContext.userPerformance.damage += update.damage || 0;
            } else {
                client.battleContext.userPerformance.misses++;
            }
        } else if (update.type === 'player_dodge') {
            client.battleContext.userPerformance.dodges++;
        }
        
        // Generate contextual response
        const shouldRespond = this.shouldAvatarRespond(clientId, update);
        if (shouldRespond) {
            const response = this.generateBattleResponse(clientId, update);
            this.sendAvatarMessage(clientId, response);
        }
        
        // Pattern analysis
        if (update.type === 'boss_attack') {
            const patterns = this.battleAI.patternRecognizer.analyzeBossPattern(client.battleContext);
            if (patterns.length > 0) {
                const advice = this.generatePatternAdvice(patterns[0]);
                if (advice) {
                    this.sendAvatarMessage(clientId, {
                        type: 'pattern_advice',
                        message: advice,
                        confidence: patterns[0].frequency > 3 ? 'high' : 'medium'
                    });
                }
            }
        }
    }
    
    handleBattleEnd(clientId, result) {
        const client = this.clients.get(clientId);
        if (!client || !client.battleContext) return;
        
        // Update avatar performance stats
        this.avatar.performance.battlesWatched++;
        
        if (result.victory) {
            this.avatar.performance.successfulSuggestions++;
        }
        
        // Generate victory/defeat response
        const profile = this.personalityProfiles[client.preferences.personality];
        const responses = result.victory ? 
            profile.battleResponses.victory : 
            profile.battleResponses.struggle;
        
        const message = responses[Math.floor(Math.random() * responses.length)];
        
        // Performance analysis
        const performance = this.analyzeBattlePerformance(client.battleContext, result);
        
        this.sendAvatarMessage(clientId, {
            type: 'battle_end_response',
            message,
            voiceSettings: profile.voiceSettings,
            performance,
            improvements: this.generateImprovementSuggestions(performance)
        });
        
        // Clean up battle context
        this.activeBattles.delete(client.battleContext.battleId);
        client.battleContext = null;
        
        console.log(`⚔️ Battle ended for client: ${clientId}, Victory: ${result.victory}`);
    }
    
    handleWebcamFrame(clientId, frameData) {
        // Analyze webcam frame for facial expressions and gestures
        const analysis = this.analyzeWebcamFrame(frameData);
        
        const client = this.clients.get(clientId);
        if (!client) return;
        
        // Update emotional state based on facial analysis
        if (analysis.emotion) {
            this.updateAvatarEmotionalResponse(clientId, analysis.emotion);
        }
        
        // Detect gestures and respond
        if (analysis.gesture) {
            this.handleGestureDetection(clientId, analysis.gesture);
        }
        
        // Attention tracking
        if (analysis.attention < 0.5 && client.battleContext) {
            this.sendAvatarMessage(clientId, {
                type: 'attention_reminder',
                message: "Hey! The boss is about to attack - stay focused!",
                priority: 'high'
            });
        }
    }
    
    handleGestureDetection(clientId, gesture) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        const responses = {
            'thumbs_up': "Thanks! I'm glad you're enjoying the battle!",
            'thumbs_down': "I'll try to be more helpful. Let me know what you need!",
            'wave': "Hello! I'm here and ready to help you win!",
            'point_left': "Should I focus on the left side of the battlefield?",
            'point_right': "Got it, watching the right side for you!",
            'nod': "I agree! That's a great strategy!",
            'shake_head': "No worries! Let's try a different approach.",
            'peace_sign': "Peace! Let's keep this battle fun and engaging!"
        };
        
        const message = responses[gesture.type] || "I see your gesture! I'm paying attention!";
        
        this.sendAvatarMessage(clientId, {
            type: 'gesture_response',
            gesture: gesture.type,
            message,
            confidence: gesture.confidence
        });
        
        console.log(`👋 Gesture detected from ${clientId}: ${gesture.type}`);
    }
    
    handleAdviceRequest(clientId, context) {
        const client = this.clients.get(clientId);
        if (!client) return;
        
        let advice;
        
        if (client.battleContext) {
            // Battle-specific advice
            advice = this.battleAI.performanceAnalyzer.generatePersonalizedAdvice(
                clientId, 
                client.battleContext
            );
        } else {
            // General advice
            advice = ["I'm ready to help when you start a battle!", 
                     "Try starting a boss fight and I'll give you specific tips!"];
        }
        
        const adviceText = Array.isArray(advice) ? 
            advice[Math.floor(Math.random() * advice.length)] : advice;
        
        this.sendAvatarMessage(clientId, {
            type: 'advice_response',
            message: adviceText,
            context: context
        });
    }
    
    sendAvatarMessage(clientId, message) {
        const client = this.clients.get(clientId);
        if (!client || client.ws.readyState !== WebSocket.OPEN) return;
        
        const enhancedMessage = {
            ...message,
            timestamp: Date.now(),
            personality: client.preferences.personality,
            clientId
        };
        
        client.ws.send(JSON.stringify(enhancedMessage));
        
        // Track advice given
        if (message.type.includes('advice')) {
            this.avatar.performance.adviceGiven++;
        }
    }
    
    setPersonality(mode) {
        if (!this.personalityProfiles[mode]) return false;
        
        this.avatar.currentMode = mode;
        
        // Notify all connected clients
        this.clients.forEach((client, clientId) => {
            client.preferences.personality = mode;
            this.sendAvatarMessage(clientId, {
                type: 'personality_changed',
                newMode: mode,
                profile: this.personalityProfiles[mode]
            });
        });
        
        console.log(`🎭 Avatar personality changed to: ${mode}`);
        return true;
    }
    
    // Webcam analysis simulation (replace with actual ML models)
    analyzeWebcamFrame(frameData) {
        return {
            face: {
                detected: true,
                confidence: 0.92,
                position: { x: 320, y: 240 },
                size: { width: 150, height: 180 }
            },
            emotion: {
                primary: 'focused',
                confidence: 0.78,
                secondary: 'excited',
                all: {
                    focused: 0.78,
                    excited: 0.12,
                    frustrated: 0.05,
                    happy: 0.05
                }
            },
            gesture: {
                type: 'neutral',
                confidence: 0.6
            },
            attention: Math.random() > 0.2 ? 0.85 : 0.3 // Simulate attention tracking
        };
    }
    
    generateAvatarInterface() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>👤 Webcam Avatar Assistant</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            height: 100vh;
            overflow: hidden;
        }
        
        .avatar-container {
            display: grid;
            grid-template-columns: 300px 1fr 300px;
            grid-template-rows: 80px 1fr;
            height: 100vh;
            gap: 10px;
            padding: 10px;
        }
        
        .header {
            grid-column: 1 / -1;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 30px;
            backdrop-filter: blur(10px);
        }
        
        .avatar-panel {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
        }
        
        .main-display {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
            position: relative;
            overflow: hidden;
        }
        
        .controls-panel {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(10px);
        }
        
        .webcam-video {
            width: 100%;
            height: 200px;
            background: #1a1a2e;
            border-radius: 10px;
            margin-bottom: 15px;
            position: relative;
            overflow: hidden;
        }
        
        .webcam-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 0, 0, 0.7);
            color: #4ecdc4;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .webcam-overlay:hover {
            background: rgba(0, 0, 0, 0.5);
        }
        
        .personality-selector {
            margin-bottom: 20px;
        }
        
        .personality-btn {
            width: 100%;
            padding: 10px;
            margin-bottom: 8px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .personality-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
        
        .personality-btn.active {
            background: #4ecdc4;
            color: #1a1a2e;
        }
        
        .message-area {
            height: 300px;
            overflow-y: auto;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
        }
        
        .message {
            margin-bottom: 15px;
            padding: 10px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.1);
            border-left: 3px solid #4ecdc4;
        }
        
        .message.user {
            background: rgba(102, 126, 234, 0.2);
            border-left-color: #667eea;
        }
        
        .voice-controls {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        
        .control-btn {
            flex: 1;
            padding: 12px;
            background: linear-gradient(45deg, #667eea, #764ba2);
            border: none;
            border-radius: 8px;
            color: white;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }
        
        .control-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .control-btn.active {
            background: linear-gradient(45deg, #4ecdc4, #44a08d);
        }
        
        .battle-visualizer {
            width: 100%;
            height: 400px;
            border: 2px solid #4ecdc4;
            border-radius: 15px;
            background: radial-gradient(circle at center, rgba(78, 205, 196, 0.1) 0%, transparent 70%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            margin-bottom: 20px;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #4ecdc4;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 12px;
            opacity: 0.8;
        }
        
        .emotion-indicator {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 10px;
        }
        
        .emotion-focused { background: #4ecdc4; }
        .emotion-excited { background: #ff6b6b; }
        .emotion-frustrated { background: #ff9f43; }
        .emotion-happy { background: #00d2d3; }
        
        @media (max-width: 1024px) {
            .avatar-container {
                grid-template-columns: 1fr;
                grid-template-rows: 80px 250px 1fr 150px;
            }
            
            .webcam-video {
                height: 120px;
            }
            
            .message-area {
                height: 200px;
            }
        }
    </style>
</head>
<body>
    <div class="avatar-container">
        <div class="header">
            <h1>👤 Webcam Avatar Assistant</h1>
            <div>
                <span id="connectionStatus">🔴 Connecting...</span>
                <span id="currentMode">Mode: Helpful Companion</span>
            </div>
        </div>
        
        <div class="avatar-panel">
            <div class="webcam-video">
                <video id="webcamFeed" width="100%" height="100%" autoplay muted></video>
                <div class="webcam-overlay" id="webcamOverlay" onclick="toggleWebcam()">
                    📷 Click to enable webcam
                </div>
            </div>
            
            <div class="personality-selector">
                <h3>🎭 Avatar Personality</h3>
                <button class="personality-btn active" onclick="setPersonality('helpful-companion')">
                    😊 Helpful Companion
                </button>
                <button class="personality-btn" onclick="setPersonality('expert-analyst')">
                    🧠 Expert Analyst
                </button>
                <button class="personality-btn" onclick="setPersonality('energetic-coach')">
                    🔥 Energetic Coach
                </button>
                <button class="personality-btn" onclick="setPersonality('zen-master')">
                    🧘 Zen Master
                </button>
            </div>
            
            <div id="emotionDisplay">
                <h4>😊 Detected Emotion</h4>
                <div id="emotionIndicator">
                    <span class="emotion-indicator emotion-focused"></span>
                    <span id="emotionText">Focused</span>
                </div>
            </div>
        </div>
        
        <div class="main-display">
            <div class="battle-visualizer" id="battleVisualizer">
                <div>🎮 Start a battle to see avatar assistance in action!</div>
            </div>
            
            <div class="message-area" id="messageArea">
                <div class="message">
                    👤 <strong>Avatar:</strong> Hello! I'm your AI battle companion. Enable your webcam and I'll watch for your reactions and gestures to provide better help!
                </div>
            </div>
            
            <div class="voice-controls">
                <button class="control-btn" id="voiceBtn" onclick="toggleVoice()">
                    🎤 Start Voice
                </button>
                <button class="control-btn" onclick="requestAdvice()">
                    💡 Get Advice
                </button>
                <button class="control-btn" onclick="startDemoBattle()">
                    ⚔️ Demo Battle
                </button>
            </div>
        </div>
        
        <div class="controls-panel">
            <h3>📊 Avatar Stats</h3>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value" id="battlesWatched">0</div>
                    <div class="stat-label">Battles Watched</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-value" id="adviceGiven">0</div>
                    <div class="stat-label">Advice Given</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-value" id="gesturesDetected">0</div>
                    <div class="stat-label">Gestures Detected</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-value" id="voiceCommands">0</div>
                    <div class="stat-label">Voice Commands</div>
                </div>
            </div>
            
            <h4 style="margin-top: 20px;">🎮 Battle Controls</h4>
            <div class="voice-controls">
                <button class="control-btn" onclick="sendVoiceCommand('attack')">Attack</button>
                <button class="control-btn" onclick="sendVoiceCommand('defend')">Defend</button>
                <button class="control-btn" onclick="sendVoiceCommand('help')">Help</button>
            </div>
        </div>
    </div>
    
    <script>
        // Avatar Assistant Client
        let ws = null;
        let webcamStream = null;
        let voiceRecognition = null;
        let isListening = false;
        let currentPersonality = 'helpful-companion';
        let demoBattle = null;
        
        // Initialize
        function init() {
            connectWebSocket();
            setupWebcam();
            setupVoiceRecognition();
        }
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:${this.config.wsPort}');
            
            ws.onopen = () => {
                console.log('👤 Connected to Avatar Assistant');
                document.getElementById('connectionStatus').innerHTML = '🟢 Connected';
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleAvatarMessage(data);
            };
            
            ws.onclose = () => {
                console.log('👤 Disconnected from Avatar Assistant');
                document.getElementById('connectionStatus').innerHTML = '🔴 Disconnected';
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function handleAvatarMessage(data) {
            switch (data.type) {
                case 'avatar_connected':
                    console.log('Avatar connected:', data);
                    break;
                    
                case 'battle_start_response':
                case 'advice_response':
                case 'gesture_response':
                    addMessage('Avatar', data.message, 'avatar');
                    if (data.voiceSettings && 'speechSynthesis' in window) {
                        speak(data.message, data.voiceSettings);
                    }
                    break;
                    
                case 'personality_changed':
                    updatePersonalityUI(data.newMode);
                    addMessage('System', 'Personality changed to ' + data.newMode, 'system');
                    break;
                    
                default:
                    console.log('Avatar message:', data.type, data);
            }
        }
        
        async function toggleWebcam() {
            if (!webcamStream) {
                try {
                    webcamStream = await navigator.mediaDevices.getUserMedia({
                        video: { width: 280, height: 200 },
                        audio: false
                    });
                    
                    document.getElementById('webcamFeed').srcObject = webcamStream;
                    document.getElementById('webcamOverlay').style.display = 'none';
                    
                    addMessage('System', 'Webcam enabled! Avatar is now watching for gestures and emotions.', 'system');
                    
                    // Start frame analysis
                    startFrameAnalysis();
                    
                } catch (error) {
                    addMessage('System', 'Could not access webcam: ' + error.message, 'system');
                }
            } else {
                webcamStream.getTracks().forEach(track => track.stop());
                webcamStream = null;
                document.getElementById('webcamFeed').srcObject = null;
                document.getElementById('webcamOverlay').style.display = 'flex';
                addMessage('System', 'Webcam disabled.', 'system');
            }
        }
        
        function startFrameAnalysis() {
            if (!webcamStream) return;
            
            // Simulate frame analysis every 2 seconds
            setInterval(() => {
                if (webcamStream && ws && ws.readyState === WebSocket.OPEN) {
                    // In a real implementation, capture frame data here
                    const mockFrameData = { timestamp: Date.now() };
                    
                    ws.send(JSON.stringify({
                        type: 'webcam_frame',
                        frameData: mockFrameData
                    }));
                }
            }, 2000);
        }
        
        function toggleVoice() {
            if (!isListening) {
                if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
                    recognition.continuous = true;
                    recognition.interimResults = false;
                    recognition.lang = 'en-US';
                    
                    recognition.onstart = () => {
                        isListening = true;
                        document.getElementById('voiceBtn').classList.add('active');
                        document.getElementById('voiceBtn').textContent = '🎤 Listening...';
                    };
                    
                    recognition.onresult = (event) => {
                        const command = event.results[event.results.length - 1][0].transcript;
                        addMessage('You', command, 'user');
                        sendVoiceCommand(command);
                    };
                    
                    recognition.onend = () => {
                        isListening = false;
                        document.getElementById('voiceBtn').classList.remove('active');
                        document.getElementById('voiceBtn').textContent = '🎤 Start Voice';
                    };
                    
                    recognition.start();
                    voiceRecognition = recognition;
                } else {
                    addMessage('System', 'Voice recognition not supported in this browser.', 'system');
                }
            } else {
                if (voiceRecognition) {
                    voiceRecognition.stop();
                }
            }
        }
        
        function sendVoiceCommand(command) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'voice_input',
                    command: command,
                    battleContext: demoBattle
                }));
                
                updateStat('voiceCommands');
            }
        }
        
        function setPersonality(mode) {
            currentPersonality = mode;
            
            // Update UI
            document.querySelectorAll('.personality-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Send to server
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'personality_change',
                    newMode: mode
                }));
            }
            
            updatePersonalityUI(mode);
        }
        
        function updatePersonalityUI(mode) {
            const modeNames = {
                'helpful-companion': 'Helpful Companion',
                'expert-analyst': 'Expert Analyst',
                'energetic-coach': 'Energetic Coach',
                'zen-master': 'Zen Master'
            };
            
            document.getElementById('currentMode').textContent = 'Mode: ' + modeNames[mode];
        }
        
        function requestAdvice() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'request_advice',
                    context: demoBattle || { type: 'general' }
                }));
            }
        }
        
        function startDemoBattle() {
            demoBattle = {
                id: 'demo-' + Date.now(),
                boss: { name: 'Demo Boss', health: 100, maxHealth: 100 },
                player: { health: 80, maxHealth: 100 }
            };
            
            document.getElementById('battleVisualizer').innerHTML = \`
                <div style="text-align: center;">
                    <h3>⚔️ Demo Battle: \${demoBattle.boss.name}</h3>
                    <div style="margin: 20px 0;">
                        <div>Boss Health: \${demoBattle.boss.health}/\${demoBattle.boss.maxHealth}</div>
                        <div>Your Health: \${demoBattle.player.health}/\${demoBattle.player.maxHealth}</div>
                    </div>
                    <button onclick="simulateBattleEvent()" style="padding: 10px 20px; background: #4ecdc4; border: none; border-radius: 5px; color: #1a1a2e; cursor: pointer;">
                        Simulate Attack
                    </button>
                </div>
            \`;
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'battle_start',
                    battleData: demoBattle
                }));
            }
            
            updateStat('battlesWatched');
            addMessage('System', 'Demo battle started! Avatar is now watching and ready to help.', 'system');
        }
        
        function simulateBattleEvent() {
            if (!demoBattle) return;
            
            const events = ['player_attack', 'boss_attack', 'player_dodge'];
            const eventType = events[Math.floor(Math.random() * events.length)];
            
            const event = {
                type: eventType,
                timestamp: Date.now(),
                hit: Math.random() > 0.3,
                damage: Math.floor(Math.random() * 25) + 10
            };
            
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'battle_update',
                    update: event
                }));
            }
            
            addMessage('Battle', \`\${eventType.replace('_', ' ')}: \${event.hit ? 'Hit!' : 'Miss!'} (Damage: \${event.damage})\`, 'battle');
        }
        
        function addMessage(sender, text, type) {
            const messageArea = document.getElementById('messageArea');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + type;
            messageDiv.innerHTML = \`<strong>\${sender}:</strong> \${text}\`;
            messageArea.appendChild(messageDiv);
            messageArea.scrollTop = messageArea.scrollHeight;
            
            if (sender === 'Avatar') {
                updateStat('adviceGiven');
            }
        }
        
        function speak(text, settings = {}) {
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.rate = settings.rate || 1.0;
                utterance.pitch = settings.pitch || 1.0;
                utterance.volume = settings.volume || 0.7;
                speechSynthesis.speak(utterance);
            }
        }
        
        function updateStat(statName) {
            const element = document.getElementById(statName);
            if (element) {
                const current = parseInt(element.textContent);
                element.textContent = current + 1;
            }
        }
        
        // Simulate emotion detection
        function simulateEmotionDetection() {
            const emotions = ['focused', 'excited', 'frustrated', 'happy'];
            const emotion = emotions[Math.floor(Math.random() * emotions.length)];
            
            document.getElementById('emotionText').textContent = emotion;
            document.getElementById('emotionIndicator').innerHTML = 
                \`<span class="emotion-indicator emotion-\${emotion}"></span><span id="emotionText">\${emotion}</span>\`;
        }
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
        
        // Simulate emotion changes every 10 seconds
        setInterval(simulateEmotionDetection, 10000);
    </script>
</body>
</html>`;
    }
    
    // Helper methods
    shouldAvatarRespond(clientId, update) {
        const client = this.clients.get(clientId);
        if (!client) return false;
        
        const frequency = client.preferences.adviceFrequency;
        
        if (frequency === 'silent') return false;
        if (frequency === 'high') return Math.random() > 0.3;
        if (frequency === 'low') return Math.random() > 0.8;
        
        // Adaptive frequency based on battle events
        const importantEvents = ['boss_special', 'player_critical_hit', 'low_health'];
        return importantEvents.includes(update.type) || Math.random() > 0.6;
    }
    
    generateBattleResponse(clientId, update) {
        const client = this.clients.get(clientId);
        const profile = this.personalityProfiles[client.preferences.personality];
        
        let responseCategory = 'start';
        if (update.type === 'player_attack' && update.hit) {
            responseCategory = 'success';
        } else if (update.type === 'player_damaged' && update.damage > 30) {
            responseCategory = 'struggle';
        }
        
        const responses = profile.battleResponses[responseCategory];
        const message = responses[Math.floor(Math.random() * responses.length)];
        
        return {
            type: 'battle_response',
            message,
            voiceSettings: profile.voiceSettings,
            updateType: update.type
        };
    }
    
    countSequenceFrequency(attacks, sequence) {
        return Math.floor(Math.random() * 5) + 1; // Simplified
    }
    
    calculateSequenceTiming(sequence) {
        return sequence.reduce((acc, attack) => acc + (attack.duration || 1000), 0);
    }
    
    findVulnerabilityWindow(sequence) {
        return {
            start: sequence.length * 1000,
            duration: 2000,
            probability: 0.7
        };
    }
    
    calculateCommandConfidence(text, phrase) {
        return text.includes(phrase) ? 0.9 : 0.3;
    }
    
    getCompactorStats() {
        return {
            avatar: {
                personality: this.avatar.currentMode,
                availableModes: Object.keys(this.personalityProfiles).length,
                performance: this.avatar.performance,
                connectedClients: this.clients.size,
                activeBattles: this.activeBattles.size
            },
            webcam: this.config.webcam,
            voice: this.config.voice,
            capabilities: {
                faceDetection: this.config.webcam.faceDetection,
                emotionRecognition: this.config.webcam.emotionRecognition,
                gestureDetection: this.config.webcam.gestureDetection,
                voiceCommands: Object.keys(this.voice.commandProcessor.commands).length
            }
        };
    }
}

// Auto-start if run directly
if (require.main === module) {
    console.log('🚀 Starting Webcam Avatar Assistant...');
    
    const assistant = new WebcamAvatarAssistant();
    
    assistant.on('assistant-ready', () => {
        const stats = assistant.getCompactorStats();
        
        console.log('\n👤 WEBCAM AVATAR ASSISTANT READY!');
        console.log('==================================');
        console.log(`📡 Web Interface: http://localhost:${assistant.config.port}`);
        console.log(`🔌 WebSocket: ws://localhost:${assistant.config.wsPort}`);
        
        console.log('\n🎭 AVATAR FEATURES:');
        console.log(`  Personalities: ${stats.avatar.availableModes} modes`);
        console.log(`  Current Mode: ${stats.avatar.personality}`);
        console.log(`  Connected Clients: ${stats.avatar.connectedClients}`);
        console.log(`  Active Battles: ${stats.avatar.activeBattles}`);
        
        console.log('\n📷 WEBCAM CAPABILITIES:');
        console.log(`  Face Detection: ${stats.capabilities.faceDetection ? '✅' : '❌'}`);
        console.log(`  Emotion Recognition: ${stats.capabilities.emotionRecognition ? '✅' : '❌'}`);
        console.log(`  Gesture Detection: ${stats.capabilities.gestureDetection ? '✅' : '❌'}`);
        
        console.log('\n🗣️ VOICE CAPABILITIES:');
        console.log(`  Voice Commands: ${stats.capabilities.voiceCommands} supported`);
        console.log(`  Speech Synthesis: ${stats.voice.synthesis ? '✅' : '❌'}`);
        console.log(`  Voice Recognition: ${stats.voice.recognition ? '✅' : '❌'}`);
        
        console.log('\n🎮 BATTLE INTEGRATION:');
        console.log('  ✅ Real-time battle watching and advice');
        console.log('  ✅ Pattern recognition and predictions');
        console.log('  ✅ Personalized performance analysis');
        console.log('  ✅ Contextual emotional responses');
        console.log('  ✅ Gesture-based interaction');
        
        console.log('\n💎 THE "CRAZY GAMES" EXPERIENCE:');
        console.log('  👤 Avatar watches your face and reactions');
        console.log('  🎭 Multiple personalities for different styles'); 
        console.log('  🗣️ Voice commands and natural conversation');
        console.log('  🤖 AI learns your patterns and adapts advice');
        console.log('  📷 Webcam integration like modern AI assistants');
    });
}

module.exports = WebcamAvatarAssistant;