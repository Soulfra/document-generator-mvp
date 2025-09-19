#!/usr/bin/env node

/**
 * 🤖 AI CHARACTER INTERACTION SYSTEM 🤖
 * 
 * Enhanced AI Character System with Sims-like interactions
 * - Interactive AI characters customers can watch and bet on
 * - Real-time mood, energy, and personality simulation
 * - Character-to-character interactions and relationships
 * - Visual avatar system with animations
 * - Gamification with character progression and rewards
 */

const express = require('express');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

class AICharacterSystem {
    constructor() {
        this.app = express();
        this.port = 6001;
        this.wsPort = 6002;
        
        // Character storage
        this.characters = new Map();
        this.interactions = new Map();
        this.relationships = new Map();
        this.customerWatching = new Map();
        
        // WebSocket server for real-time updates
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        // Personality traits that affect behavior
        this.personalityTraits = {
            extroversion: { min: 0, max: 100 },
            agreeableness: { min: 0, max: 100 },
            conscientiousness: { min: 0, max: 100 },
            neuroticism: { min: 0, max: 100 },
            openness: { min: 0, max: 100 },
            playfulness: { min: 0, max: 100 },
            creativity: { min: 0, max: 100 },
            competitiveness: { min: 0, max: 100 }
        };
        
        // Mood system
        this.moodTypes = [
            'happy', 'excited', 'focused', 'tired', 'stressed', 
            'curious', 'confident', 'melancholy', 'energetic', 'zen'
        ];
        
        // Activity types
        this.activities = [
            'researching', 'creating', 'socializing', 'learning', 'resting',
            'competing', 'exploring', 'analyzing', 'meditating', 'celebrating'
        ];
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
        this.startCharacterSimulation();
        this.startServer();
        
        console.log('🤖 AI Character System initializing...');
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        this.app.use('/avatars', express.static(path.join(__dirname, 'avatars')));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`🤖 [${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });
    }
    
    setupRoutes() {
        // Character management
        this.app.post('/api/character/create', this.createCharacter.bind(this));
        this.app.get('/api/character/:id', this.getCharacter.bind(this));
        this.app.put('/api/character/:id/interact', this.interactWithCharacter.bind(this));
        this.app.get('/api/characters/active', this.getActiveCharacters.bind(this));
        
        // Character watching/streaming
        this.app.post('/api/character/:id/watch', this.startWatching.bind(this));
        this.app.delete('/api/character/:id/watch', this.stopWatching.bind(this));
        this.app.get('/api/character/:id/stream', this.getCharacterStream.bind(this));
        
        // Character relationships
        this.app.get('/api/character/:id/relationships', this.getRelationships.bind(this));
        this.app.post('/api/character/:id/befriend/:targetId', this.createFriendship.bind(this));
        
        // Character predictions and betting integration
        this.app.get('/api/character/:id/predictions', this.getCharacterPredictions.bind(this));
        this.app.post('/api/character/:id/prediction', this.createPrediction.bind(this));
        
        // Character customization
        this.app.put('/api/character/:id/customize', this.customizeCharacter.bind(this));
        this.app.post('/api/character/:id/train', this.trainCharacter.bind(this));
        
        // Interactive character interface
        this.app.get('/character/:id', this.getCharacterInterface.bind(this));
        this.app.get('/', this.getMainInterface.bind(this));
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                service: 'ai-character-system',
                status: 'operational',
                characters: this.characters.size,
                activeInteractions: this.interactions.size,
                watchers: this.customerWatching.size,
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            });
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('👤 New client connected to character stream');
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('👤 Client disconnected from character stream');
            });
        });
    }
    
    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'watch_character':
                this.addWatcher(ws, data.characterId, data.customerId);
                break;
            case 'interact':
                this.processInteraction(data.characterId, data.interaction);
                break;
            case 'place_bet':
                this.processBet(data.characterId, data.bet);
                break;
        }
    }
    
    createCharacter(req, res) {
        try {
            const {
                customer_id,
                name,
                character_type = 'assistant',
                personality_preset = 'balanced',
                specialization = [],
                avatar_style = 'modern'
            } = req.body;
            
            const characterId = this.generateCharacterId();
            
            // Generate personality based on preset
            const personality = this.generatePersonality(personality_preset);
            
            const character = {
                id: characterId,
                customer_id,
                name: name || this.generateCharacterName(character_type),
                character_type,
                personality,
                specialization,
                avatar_style,
                
                // Core stats
                level: 1,
                experience: 0,
                mood: this.getRandomMood(),
                energy: 100,
                happiness: 80,
                intelligence: 50 + Math.random() * 50,
                creativity: 50 + Math.random() * 50,
                social_skills: 50 + Math.random() * 50,
                
                // State
                current_activity: 'idle',
                location: 'home',
                status: 'active',
                
                // Interaction history
                interactions_today: 0,
                total_interactions: 0,
                last_interaction: null,
                
                // Performance metrics
                prediction_accuracy: 0.5,
                content_quality_score: 0.5,
                customer_satisfaction: 5.0,
                
                // Visual appearance
                avatar: {
                    style: avatar_style,
                    color_scheme: this.generateColorScheme(),
                    accessories: [],
                    expression: 'neutral'
                },
                
                // Timestamps
                created_at: new Date().toISOString(),
                last_active: new Date().toISOString()
            };
            
            this.characters.set(characterId, character);
            this.relationships.set(characterId, new Map());
            
            console.log(`🤖 Character created: ${character.name} (${characterId})`);
            
            // Broadcast to watchers
            this.broadcastCharacterUpdate(characterId, {
                type: 'character_created',
                character
            });
            
            res.json({
                success: true,
                character_id: characterId,
                character
            });
            
        } catch (error) {
            console.error('Character creation error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    generatePersonality(preset) {
        const presets = {
            analytical: {
                extroversion: 30 + Math.random() * 20,
                agreeableness: 60 + Math.random() * 20,
                conscientiousness: 80 + Math.random() * 20,
                neuroticism: 20 + Math.random() * 30,
                openness: 90 + Math.random() * 10,
                playfulness: 20 + Math.random() * 30,
                creativity: 70 + Math.random() * 30,
                competitiveness: 70 + Math.random() * 30
            },
            social: {
                extroversion: 80 + Math.random() * 20,
                agreeableness: 80 + Math.random() * 20,
                conscientiousness: 60 + Math.random() * 20,
                neuroticism: 30 + Math.random() * 20,
                openness: 70 + Math.random() * 30,
                playfulness: 80 + Math.random() * 20,
                creativity: 60 + Math.random() * 30,
                competitiveness: 40 + Math.random() * 30
            },
            creative: {
                extroversion: 60 + Math.random() * 30,
                agreeableness: 70 + Math.random() * 20,
                conscientiousness: 50 + Math.random() * 30,
                neuroticism: 40 + Math.random() * 30,
                openness: 95 + Math.random() * 5,
                playfulness: 90 + Math.random() * 10,
                creativity: 95 + Math.random() * 5,
                competitiveness: 30 + Math.random() * 40
            },
            balanced: {
                extroversion: 50 + Math.random() * 30,
                agreeableness: 60 + Math.random() * 30,
                conscientiousness: 60 + Math.random() * 30,
                neuroticism: 40 + Math.random() * 20,
                openness: 60 + Math.random() * 30,
                playfulness: 60 + Math.random() * 30,
                creativity: 60 + Math.random() * 30,
                competitiveness: 50 + Math.random() * 30
            }
        };
        
        return presets[preset] || presets.balanced;
    }
    
    generateColorScheme() {
        const schemes = [
            { primary: '#667eea', secondary: '#764ba2', accent: '#f093fb' },
            { primary: '#4facfe', secondary: '#00f2fe', accent: '#43e97b' },
            { primary: '#a8edea', secondary: '#fed6e3', accent: '#ffecd2' },
            { primary: '#ff9a9e', secondary: '#fecfef', accent: '#fecfef' },
            { primary: '#a18cd1', secondary: '#fbc2eb', accent: '#ffecd2' }
        ];
        
        return schemes[Math.floor(Math.random() * schemes.length)];
    }
    
    getCharacter(req, res) {
        const { id } = req.params;
        const character = this.characters.get(id);
        
        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }
        
        res.json(character);
    }
    
    interactWithCharacter(req, res) {
        try {
            const { id } = req.params;
            const { interaction_type, message, customer_id } = req.body;
            
            const character = this.characters.get(id);
            if (!character) {
                return res.status(404).json({ error: 'Character not found' });
            }
            
            // Process interaction
            const interactionResult = this.processCharacterInteraction(character, {
                type: interaction_type,
                message,
                customer_id,
                timestamp: new Date().toISOString()
            });
            
            // Update character state
            character.interactions_today++;
            character.total_interactions++;
            character.last_interaction = new Date().toISOString();
            character.last_active = new Date().toISOString();
            
            // Mood and energy changes based on interaction
            this.updateCharacterMood(character, interaction_type);
            
            this.characters.set(id, character);
            
            // Broadcast to watchers
            this.broadcastCharacterUpdate(id, {
                type: 'interaction',
                interaction: interactionResult,
                character: character
            });
            
            res.json({
                success: true,
                interaction: interactionResult,
                character_state: {
                    mood: character.mood,
                    energy: character.energy,
                    happiness: character.happiness
                }
            });
            
        } catch (error) {
            console.error('Character interaction error:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    processCharacterInteraction(character, interaction) {
        const responses = {
            greeting: [
                "Hello! Great to see you! 👋",
                "Hey there! I've been working on something exciting! ✨",
                "Hi! I just discovered something interesting you might like! 🎯"
            ],
            compliment: [
                "Thank you! That really made my day! 😊",
                "Aww, you're so sweet! This motivates me to work even harder! 💪",
                "That means a lot coming from you! 🥰"
            ],
            question: [
                "That's a great question! Let me think about that... 🤔",
                "Interesting! I love exploring new ideas! 💡",
                "Ooh, I have some thoughts on that! 🎯"
            ],
            task: [
                "I'm on it! This looks like a fun challenge! 🚀",
                "Consider it done! I love being helpful! ⚡",
                "Perfect timing! I was just thinking about this! 🎨"
            ]
        };
        
        const responseList = responses[interaction.type] || responses.greeting;
        const response = responseList[Math.floor(Math.random() * responseList.length)];
        
        return {
            id: this.generateInteractionId(),
            character_id: character.id,
            customer_id: interaction.customer_id,
            type: interaction.type,
            input: interaction.message,
            response: response,
            mood_before: character.mood,
            mood_after: this.predictMoodChange(character, interaction.type),
            timestamp: interaction.timestamp,
            quality_score: Math.random() * 0.3 + 0.7 // 70-100% quality
        };
    }
    
    updateCharacterMood(character, interactionType) {
        const moodChanges = {
            greeting: { energy: 5, happiness: 10 },
            compliment: { energy: 10, happiness: 20 },
            question: { energy: -2, happiness: 5 },
            task: { energy: -10, happiness: 15 },
            criticism: { energy: -5, happiness: -15 },
            ignore: { energy: -15, happiness: -25 }
        };
        
        const changes = moodChanges[interactionType] || { energy: 0, happiness: 0 };
        
        character.energy = Math.max(0, Math.min(100, character.energy + changes.energy));
        character.happiness = Math.max(0, Math.min(100, character.happiness + changes.happiness));
        
        // Update mood based on happiness and energy
        if (character.happiness > 80 && character.energy > 70) {
            character.mood = 'excited';
        } else if (character.happiness > 60 && character.energy > 50) {
            character.mood = 'happy';
        } else if (character.energy < 30) {
            character.mood = 'tired';
        } else if (character.happiness < 30) {
            character.mood = 'melancholy';
        } else {
            character.mood = 'focused';
        }
        
        // Update avatar expression
        character.avatar.expression = this.getExpressionFromMood(character.mood);
    }
    
    getExpressionFromMood(mood) {
        const expressions = {
            excited: 'big_smile',
            happy: 'smile',
            focused: 'determined',
            tired: 'sleepy',
            melancholy: 'sad',
            curious: 'surprised',
            confident: 'smirk',
            energetic: 'grin',
            zen: 'peaceful'
        };
        
        return expressions[mood] || 'neutral';
    }
    
    startCharacterSimulation() {
        // Run character simulation every 30 seconds
        setInterval(() => {
            this.simulateCharacterBehavior();
        }, 30000);
        
        console.log('🎮 Character simulation started');
    }
    
    simulateCharacterBehavior() {
        for (const [characterId, character] of this.characters) {
            if (character.status !== 'active') continue;
            
            // Gradual energy decay
            character.energy = Math.max(0, character.energy - 1);
            
            // Random mood shifts based on personality
            if (Math.random() < 0.1) { // 10% chance per cycle
                this.randomMoodShift(character);
            }
            
            // Autonomous activities
            if (Math.random() < 0.3) { // 30% chance per cycle
                this.performAutonomousActivity(character);
            }
            
            // Update last active
            character.last_active = new Date().toISOString();
            
            // Broadcast updates to watchers
            this.broadcastCharacterUpdate(characterId, {
                type: 'autonomous_update',
                character: character
            });
        }
    }
    
    randomMoodShift(character) {
        const currentMoodIndex = this.moodTypes.indexOf(character.mood);
        const possibleMoods = this.moodTypes.filter((mood, index) => 
            Math.abs(index - currentMoodIndex) <= 2
        );
        
        character.mood = possibleMoods[Math.floor(Math.random() * possibleMoods.length)];
        character.avatar.expression = this.getExpressionFromMood(character.mood);
    }
    
    performAutonomousActivity(character) {
        const activity = this.activities[Math.floor(Math.random() * this.activities.length)];
        const previousActivity = character.current_activity;
        
        character.current_activity = activity;
        
        // Activity-specific changes
        const activityEffects = {
            researching: { energy: -3, intelligence: 1 },
            creating: { energy: -5, creativity: 2, happiness: 5 },
            socializing: { energy: -2, social_skills: 1, happiness: 10 },
            learning: { energy: -4, intelligence: 2 },
            resting: { energy: 15, happiness: 5 },
            competing: { energy: -8, competitiveness: 1, happiness: 8 },
            exploring: { energy: -6, openness: 1, happiness: 12 },
            analyzing: { energy: -3, intelligence: 1 },
            meditating: { energy: 10, happiness: 15, neuroticism: -1 },
            celebrating: { energy: -2, happiness: 20 }
        };
        
        const effects = activityEffects[activity] || {};
        
        Object.keys(effects).forEach(stat => {
            if (character[stat] !== undefined) {
                character[stat] = Math.max(0, Math.min(100, character[stat] + effects[stat]));
            }
        });
        
        console.log(`🎭 ${character.name} switched from ${previousActivity} to ${activity}`);
    }
    
    getCharacterInterface(req, res) {
        const { id } = req.params;
        const character = this.characters.get(id);
        
        if (!character) {
            return res.status(404).send('Character not found');
        }
        
        res.send(this.generateCharacterHTML(character));
    }
    
    generateCharacterHTML(character) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🤖 ${character.name} - AI Character</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, ${character.avatar.color_scheme.primary} 0%, ${character.avatar.color_scheme.secondary} 100%);
            min-height: 100vh;
        }
        .character-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            display: grid;
            grid-template-columns: 300px 1fr 300px;
            gap: 20px;
        }
        .character-avatar {
            background: white;
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            height: fit-content;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .avatar-display {
            width: 200px;
            height: 200px;
            background: ${character.avatar.color_scheme.accent};
            border-radius: 50%;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 72px;
            position: relative;
            overflow: hidden;
        }
        .character-main {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .character-stats {
            background: white;
            border-radius: 15px;
            padding: 30px;
            height: fit-content;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .stat-bar {
            background: #f0f0f0;
            height: 10px;
            border-radius: 5px;
            margin: 10px 0;
            overflow: hidden;
        }
        .stat-fill {
            height: 100%;
            background: linear-gradient(90deg, ${character.avatar.color_scheme.primary}, ${character.avatar.color_scheme.secondary});
            transition: width 0.3s;
        }
        .mood-indicator {
            background: ${character.avatar.color_scheme.accent};
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            margin: 10px 5px;
            font-size: 14px;
        }
        .activity-log {
            max-height: 400px;
            overflow-y: auto;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .interaction-panel {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .btn {
            background: ${character.avatar.color_scheme.primary};
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            margin: 5px;
            font-size: 14px;
        }
        .btn:hover {
            opacity: 0.9;
        }
        .live-indicator {
            background: #e74c3c;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .personality-trait {
            background: ${character.avatar.color_scheme.accent};
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            margin: 2px;
            display: inline-block;
        }
    </style>
</head>
<body>
    <div class="character-container">
        <div class="character-avatar">
            <div class="avatar-display">
                🤖
                <div style="position: absolute; bottom: 10px; right: 10px; font-size: 24px;">
                    ${this.getExpressionEmoji(character.avatar.expression)}
                </div>
            </div>
            <h2>${character.name}</h2>
            <div class="live-indicator">🔴 LIVE</div>
            <div class="mood-indicator">${character.mood}</div>
            <p><strong>Level ${character.level}</strong></p>
            <p>Currently: ${character.current_activity}</p>
            
            <div class="interaction-panel">
                <h4>Quick Interactions</h4>
                <button class="btn" onclick="interact('greeting')">👋 Say Hi</button>
                <button class="btn" onclick="interact('compliment')">👍 Compliment</button>
                <button class="btn" onclick="interact('question')">❓ Ask Question</button>
                <button class="btn" onclick="interact('task')">📋 Give Task</button>
            </div>
        </div>
        
        <div class="character-main">
            <h1>🤖 ${character.name}</h1>
            <p><strong>Type:</strong> ${character.character_type}</p>
            <p><strong>Specialization:</strong> ${character.specialization.join(', ') || 'General AI'}</p>
            
            <h3>🎭 Personality Traits</h3>
            <div>
                ${Object.entries(character.personality).map(([trait, value]) => 
                    `<span class="personality-trait">${trait}: ${Math.round(value)}</span>`
                ).join('')}
            </div>
            
            <h3>📊 Performance Metrics</h3>
            <div>
                <strong>Prediction Accuracy:</strong> ${(character.prediction_accuracy * 100).toFixed(1)}%<br>
                <strong>Content Quality:</strong> ${(character.content_quality_score * 100).toFixed(1)}%<br>
                <strong>Customer Satisfaction:</strong> ${character.customer_satisfaction.toFixed(1)}/5.0
            </div>
            
            <h3>🎮 Betting Opportunities</h3>
            <div class="interaction-panel">
                <p>Bet on what ${character.name} will do next!</p>
                <button class="btn" onclick="placeBet('mood_change')">🎭 Next Mood Change</button>
                <button class="btn" onclick="placeBet('activity_switch')">🎯 Activity Switch</button>
                <button class="btn" onclick="placeBet('prediction_accuracy')">📈 Prediction Success</button>
            </div>
            
            <div class="activity-log" id="activity-log">
                <h4>🎬 Live Activity Stream</h4>
                <p><em>Connecting to live stream...</em></p>
            </div>
        </div>
        
        <div class="character-stats">
            <h3>📊 Character Stats</h3>
            
            <h4>Energy</h4>
            <div class="stat-bar">
                <div class="stat-fill" style="width: ${character.energy}%"></div>
            </div>
            <small>${character.energy}/100</small>
            
            <h4>Happiness</h4>
            <div class="stat-bar">
                <div class="stat-fill" style="width: ${character.happiness}%"></div>
            </div>
            <small>${character.happiness}/100</small>
            
            <h4>Intelligence</h4>
            <div class="stat-bar">
                <div class="stat-fill" style="width: ${character.intelligence}%"></div>
            </div>
            <small>${character.intelligence}/100</small>
            
            <h4>Creativity</h4>
            <div class="stat-bar">
                <div class="stat-fill" style="width: ${character.creativity}%"></div>
            </div>
            <small>${character.creativity}/100</small>
            
            <h4>Social Skills</h4>
            <div class="stat-bar">
                <div class="stat-fill" style="width: ${character.social_skills}%"></div>
            </div>
            <small>${character.social_skills}/100</small>
            
            <h3>📈 Activity Stats</h3>
            <p><strong>Today:</strong> ${character.interactions_today} interactions</p>
            <p><strong>Total:</strong> ${character.total_interactions} interactions</p>
            <p><strong>Experience:</strong> ${character.experience} XP</p>
            
            <h3>⏰ Status</h3>
            <p><strong>Created:</strong> ${new Date(character.created_at).toLocaleDateString()}</p>
            <p><strong>Last Active:</strong> ${this.getTimeAgo(character.last_active)}</p>
        </div>
    </div>
    
    <script>
        const characterId = '${character.id}';
        const ws = new WebSocket('ws://localhost:6002');
        
        ws.onopen = function() {
            ws.send(JSON.stringify({
                type: 'watch_character',
                characterId: characterId,
                customerId: 'web_viewer'
            }));
        };
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            updateCharacterDisplay(data);
        };
        
        function updateCharacterDisplay(data) {
            const activityLog = document.getElementById('activity-log');
            
            if (data.type === 'autonomous_update') {
                const logEntry = document.createElement('div');
                logEntry.innerHTML = '<small>' + new Date().toLocaleTimeString() + '</small> - ' + 
                                   '${character.name} is now ' + data.character.current_activity + 
                                   ' (mood: ' + data.character.mood + ')';
                activityLog.appendChild(logEntry);
                activityLog.scrollTop = activityLog.scrollHeight;
            } else if (data.type === 'interaction') {
                const logEntry = document.createElement('div');
                logEntry.innerHTML = '<strong>' + new Date().toLocaleTimeString() + '</strong> - ' + 
                                   'Interaction: ' + data.interaction.response;
                activityLog.appendChild(logEntry);
                activityLog.scrollTop = activityLog.scrollHeight;
            }
        }
        
        async function interact(type) {
            try {
                const response = await fetch('/api/character/' + characterId + '/interact', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        interaction_type: type,
                        message: 'Web interaction',
                        customer_id: 'web_viewer'
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    console.log('Interaction successful:', result);
                }
            } catch (error) {
                console.error('Interaction error:', error);
            }
        }
        
        function placeBet(betType) {
            // Integrate with betting system
            alert('Betting feature - would integrate with betting workflow!');
        }
    </script>
</body>
</html>
        `;
    }
    
    getExpressionEmoji(expression) {
        const emojis = {
            big_smile: '😄',
            smile: '😊',
            determined: '😤',
            sleepy: '😴',
            sad: '😢',
            surprised: '😲',
            smirk: '😏',
            grin: '😁',
            peaceful: '😌',
            neutral: '😐'
        };
        
        return emojis[expression] || '😐';
    }
    
    getTimeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
        return `${Math.floor(diffMins / 1440)} days ago`;
    }
    
    getMainInterface(req, res) {
        const characterList = Array.from(this.characters.values());
        
        res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>🤖 AI Character Showcase</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            color: white;
            margin-bottom: 40px;
        }
        .character-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .character-card {
            background: white;
            border-radius: 15px;
            padding: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            transition: transform 0.3s;
        }
        .character-card:hover {
            transform: translateY(-5px);
        }
        .character-preview {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            position: relative;
        }
        .live-badge {
            position: absolute;
            top: -5px;
            right: -5px;
            background: #e74c3c;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            animation: pulse 2s infinite;
        }
        .btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin: 5px;
            text-decoration: none;
            display: inline-block;
            text-align: center;
        }
        .btn:hover {
            background: #5a6fd8;
        }
        .stats {
            display: flex;
            justify-content: space-between;
            margin: 15px 0;
            font-size: 12px;
        }
        .mood-badge {
            background: #667eea;
            color: white;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
        }
        .create-character {
            background: rgba(255,255,255,0.2);
            border: 2px dashed rgba(255,255,255,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            cursor: pointer;
            color: white;
            text-align: center;
        }
        .create-character:hover {
            background: rgba(255,255,255,0.3);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 AI Character Showcase</h1>
            <p>Watch, interact, and bet on AI characters in real-time!</p>
        </div>
        
        <div class="character-grid">
            ${characterList.map(char => `
                <div class="character-card">
                    <div class="character-preview" style="background: ${char.avatar.color_scheme.accent}">
                        🤖
                        <div class="live-badge">●</div>
                    </div>
                    <h3 style="text-align: center; margin: 0;">${char.name}</h3>
                    <p style="text-align: center; color: #666;">${char.character_type}</p>
                    <div class="mood-badge" style="display: block; text-align: center; margin: 10px auto; width: fit-content;">
                        ${char.mood} • ${char.current_activity}
                    </div>
                    <div class="stats">
                        <span>⚡ ${char.energy}</span>
                        <span>😊 ${char.happiness}</span>
                        <span>🧠 ${Math.round(char.intelligence)}</span>
                        <span>🎨 ${Math.round(char.creativity)}</span>
                    </div>
                    <div style="text-align: center;">
                        <a href="/character/${char.id}" class="btn">👀 Watch</a>
                        <button class="btn" onclick="quickInteract('${char.id}')">💬 Say Hi</button>
                    </div>
                </div>
            `).join('')}
            
            <div class="character-card create-character" onclick="showCreateForm()">
                <h2>+ Create New Character</h2>
                <p>Design your own AI companion</p>
            </div>
        </div>
    </div>
    
    <script>
        async function quickInteract(characterId) {
            try {
                const response = await fetch('/api/character/' + characterId + '/interact', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        interaction_type: 'greeting',
                        message: 'Quick hello from showcase',
                        customer_id: 'showcase_visitor'
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    alert(result.interaction.response);
                }
            } catch (error) {
                console.error('Quick interaction error:', error);
            }
        }
        
        function showCreateForm() {
            // Simple create form - in production this would be more sophisticated
            const name = prompt('Character name:');
            const type = prompt('Character type (assistant/mascot/mentor):') || 'assistant';
            
            if (name) {
                createCharacter(name, type);
            }
        }
        
        async function createCharacter(name, type) {
            try {
                const response = await fetch('/api/character/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        customer_id: 'showcase_creator',
                        name: name,
                        character_type: type,
                        personality_preset: 'balanced'
                    })
                });
                
                const result = await response.json();
                if (result.success) {
                    location.reload();
                }
            } catch (error) {
                console.error('Character creation error:', error);
            }
        }
        
        // Auto-refresh every 30 seconds to show live updates
        setInterval(() => {
            location.reload();
        }, 30000);
    </script>
</body>
</html>
        `);
    }
    
    broadcastCharacterUpdate(characterId, update) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(JSON.stringify({
                        characterId,
                        ...update
                    }));
                } catch (error) {
                    console.error('WebSocket broadcast error:', error);
                }
            }
        });
    }
    
    addWatcher(ws, characterId, customerId) {
        if (!this.customerWatching.has(characterId)) {
            this.customerWatching.set(characterId, new Set());
        }
        
        this.customerWatching.get(characterId).add(customerId);
        
        // Send initial character state
        const character = this.characters.get(characterId);
        if (character) {
            ws.send(JSON.stringify({
                type: 'character_state',
                characterId,
                character
            }));
        }
    }
    
    // Additional missing route implementations
    getActiveCharacters(req, res) {
        const activeChars = Array.from(this.characters.values())
            .filter(char => char.status === 'active')
            .map(char => ({
                id: char.id,
                name: char.name,
                mood: char.mood,
                activity: char.current_activity,
                energy: char.energy,
                happiness: char.happiness,
                watchers: this.customerWatching.get(char.id)?.size || 0
            }));
        
        res.json({ characters: activeChars });
    }
    
    startWatching(req, res) {
        const { id } = req.params;
        const { customer_id } = req.body;
        
        if (!this.customerWatching.has(id)) {
            this.customerWatching.set(id, new Set());
        }
        
        this.customerWatching.get(id).add(customer_id);
        
        res.json({ success: true, watching: id });
    }
    
    stopWatching(req, res) {
        const { id } = req.params;
        const { customer_id } = req.query;
        
        if (this.customerWatching.has(id)) {
            this.customerWatching.get(id).delete(customer_id);
        }
        
        res.json({ success: true });
    }
    
    getCharacterStream(req, res) {
        const { id } = req.params;
        const character = this.characters.get(id);
        
        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }
        
        // Return recent activity stream
        const stream = {
            character_id: id,
            current_state: {
                mood: character.mood,
                activity: character.current_activity,
                energy: character.energy,
                happiness: character.happiness
            },
            watchers: this.customerWatching.get(id)?.size || 0,
            live_updates: true
        };
        
        res.json(stream);
    }
    
    getRelationships(req, res) {
        const { id } = req.params;
        const relationships = this.relationships.get(id);
        
        if (!relationships) {
            return res.status(404).json({ error: 'Character not found' });
        }
        
        const relationshipData = Array.from(relationships.entries()).map(([otherId, relationship]) => ({
            character_id: otherId,
            character_name: this.characters.get(otherId)?.name || 'Unknown',
            relationship_type: relationship.type,
            strength: relationship.strength,
            last_interaction: relationship.last_interaction
        }));
        
        res.json({ relationships: relationshipData });
    }
    
    createFriendship(req, res) {
        const { id, targetId } = req.params;
        
        const char1 = this.characters.get(id);
        const char2 = this.characters.get(targetId);
        
        if (!char1 || !char2) {
            return res.status(404).json({ error: 'Character not found' });
        }
        
        // Create mutual friendship
        if (!this.relationships.has(id)) {
            this.relationships.set(id, new Map());
        }
        if (!this.relationships.has(targetId)) {
            this.relationships.set(targetId, new Map());
        }
        
        const relationship = {
            type: 'friendship',
            strength: 50,
            created_at: new Date().toISOString(),
            last_interaction: new Date().toISOString()
        };
        
        this.relationships.get(id).set(targetId, relationship);
        this.relationships.get(targetId).set(id, relationship);
        
        // Broadcast friendship event
        this.broadcastCharacterUpdate(id, {
            type: 'new_friendship',
            friend_id: targetId,
            friend_name: char2.name
        });
        
        res.json({ success: true, relationship });
    }
    
    getCharacterPredictions(req, res) {
        const { id } = req.params;
        const character = this.characters.get(id);
        
        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }
        
        // Generate prediction opportunities
        const predictions = [
            {
                id: 'mood_' + Date.now(),
                type: 'mood_change',
                description: `Will ${character.name}'s mood change in the next 10 minutes?`,
                current_value: character.mood,
                predicted_value: this.predictMoodChange(character, 'autonomous'),
                confidence: 60 + Math.random() * 30,
                odds: (1.5 + Math.random() * 2).toFixed(2),
                expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
            },
            {
                id: 'activity_' + Date.now(),
                type: 'activity_switch',
                description: `Will ${character.name} switch activities in the next 5 minutes?`,
                current_value: character.current_activity,
                predicted_value: this.activities[Math.floor(Math.random() * this.activities.length)],
                confidence: 40 + Math.random() * 40,
                odds: (2.0 + Math.random() * 2).toFixed(2),
                expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
            },
            {
                id: 'energy_' + Date.now(),
                type: 'energy_level',
                description: `Will ${character.name}'s energy be above ${character.energy} in 15 minutes?`,
                current_value: character.energy,
                predicted_value: Math.max(0, character.energy - 3),
                confidence: 70 + Math.random() * 20,
                odds: (1.3 + Math.random() * 1.5).toFixed(2),
                expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
            }
        ];
        
        res.json({ predictions });
    }
    
    createPrediction(req, res) {
        const { id } = req.params;
        const { prediction_type, predicted_outcome, confidence, bet_amount } = req.body;
        
        const character = this.characters.get(id);
        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }
        
        const prediction = {
            id: 'pred_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            character_id: id,
            prediction_type,
            predicted_outcome,
            confidence: confidence || 50,
            bet_amount: bet_amount || 0,
            created_at: new Date().toISOString(),
            status: 'active'
        };
        
        // Store prediction for later resolution
        if (!this.interactions.has('predictions')) {
            this.interactions.set('predictions', new Map());
        }
        this.interactions.get('predictions').set(prediction.id, prediction);
        
        res.json({ success: true, prediction });
    }
    
    customizeCharacter(req, res) {
        const { id } = req.params;
        const { avatar_style, color_scheme, accessories, personality_adjustments } = req.body;
        
        const character = this.characters.get(id);
        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }
        
        // Update avatar
        if (avatar_style) character.avatar.style = avatar_style;
        if (color_scheme) character.avatar.color_scheme = color_scheme;
        if (accessories) character.avatar.accessories = accessories;
        
        // Update personality (limited adjustments)
        if (personality_adjustments) {
            Object.keys(personality_adjustments).forEach(trait => {
                if (character.personality[trait] !== undefined) {
                    const adjustment = Math.max(-10, Math.min(10, personality_adjustments[trait]));
                    character.personality[trait] = Math.max(0, Math.min(100, 
                        character.personality[trait] + adjustment));
                }
            });
        }
        
        this.characters.set(id, character);
        
        // Broadcast customization
        this.broadcastCharacterUpdate(id, {
            type: 'character_customized',
            character
        });
        
        res.json({ success: true, character });
    }
    
    trainCharacter(req, res) {
        const { id } = req.params;
        const { training_type, duration_minutes } = req.body;
        
        const character = this.characters.get(id);
        if (!character) {
            return res.status(404).json({ error: 'Character not found' });
        }
        
        // Training effects
        const trainingEffects = {
            intelligence: { intelligence: 5, energy: -20 },
            creativity: { creativity: 5, energy: -15 },
            social: { social_skills: 5, energy: -10 },
            endurance: { energy: 10, happiness: -5 },
            focus: { intelligence: 2, creativity: 2, energy: -15 }
        };
        
        const effects = trainingEffects[training_type];
        if (effects) {
            Object.keys(effects).forEach(stat => {
                if (character[stat] !== undefined) {
                    character[stat] = Math.max(0, Math.min(100, character[stat] + effects[stat]));
                }
            });
            
            character.experience += duration_minutes * 2;
            
            // Level up check
            const requiredXP = character.level * 100;
            if (character.experience >= requiredXP) {
                character.level++;
                character.experience -= requiredXP;
                
                // Broadcast level up
                this.broadcastCharacterUpdate(id, {
                    type: 'level_up',
                    character,
                    new_level: character.level
                });
            }
        }
        
        this.characters.set(id, character);
        
        res.json({ 
            success: true, 
            training_completed: training_type,
            character_state: {
                level: character.level,
                experience: character.experience,
                energy: character.energy
            }
        });
    }
    
    // Additional helper methods
    generateCharacterId() {
        return 'char_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
    
    generateInteractionId() {
        return 'int_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
    
    generateCharacterName(type) {
        const names = {
            assistant: ['Alex AI', 'Morgan Mind', 'Jordan Genius', 'Casey Creative', 'Riley Research'],
            mascot: ['Zippy', 'Sparkle', 'Nova', 'Echo', 'Pixel Pal'],
            mentor: ['Sage Wisdom', 'Atlas Guide', 'Phoenix Insight', 'Orion Oracle', 'Luna Learn']
        };
        
        const nameList = names[type] || names.assistant;
        return nameList[Math.floor(Math.random() * nameList.length)];
    }
    
    getRandomMood() {
        return this.moodTypes[Math.floor(Math.random() * this.moodTypes.length)];
    }
    
    predictMoodChange(character, interactionType) {
        // Simple mood prediction for betting
        const currentMoodIndex = this.moodTypes.indexOf(character.mood);
        const moodShifts = {
            greeting: 1,
            compliment: 2,
            question: 0,
            task: -1,
            criticism: -2
        };
        
        const shift = moodShifts[interactionType] || 0;
        const newIndex = Math.max(0, Math.min(this.moodTypes.length - 1, currentMoodIndex + shift));
        return this.moodTypes[newIndex];
    }
    
    startServer() {
        this.app.listen(this.port, () => {
            console.log(`🤖 AI Character System running on port ${this.port}`);
            console.log(`📡 WebSocket server running on port ${this.wsPort}`);
            console.log(`🎮 Character interface: http://localhost:${this.port}`);
            console.log(`👀 Watch characters: http://localhost:${this.port}/character/{id}`);
        });
    }
}

// Export for use as module
module.exports = AICharacterSystem;

// CLI interface
if (require.main === module) {
    const characterSystem = new AICharacterSystem();
    
    // Handle process cleanup
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down AI Character System...');
        process.exit(0);
    });
}
