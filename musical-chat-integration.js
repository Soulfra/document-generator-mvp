#!/usr/bin/env node

/**
 * MUSICAL CHAT INTEGRATION
 * 
 * Master integration layer that connects the chat action stream with the 
 * musical translation and piano player systems. This creates the complete
 * chat-to-music pipeline with character responses, wizards, kobolds, and
 * all the fantasy elements playing as piano music in real-time.
 * 
 * Features:
 * - Complete integration with chat action stream system
 * - Real-time musical responses to all chat interactions
 * - Character-specific piano themes and styles
 * - Zone-based musical context adaptation  
 * - Piano roll visualization with 3D spatial positioning
 * - Integration with existing VoiceToMusicConverter and spatial audio
 * - Support for NPCs, wizards, kobolds, citadel guardians, etc.
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

// Import our musical components
const ChatToMusicTranslator = require('./chat-to-music-translator.js');
const PianoResponsePlayer = require('./piano-response-player.js');

// Import existing system components
const UnifiedActionStream = require('./unified-action-stream.js');

class MusicalChatIntegration extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Integration settings
            enableMusicalChat: true,
            enableRealTimeResponses: true,
            enableCharacterThemes: true,
            enableZonalInfluence: true,
            enableSpatialAudio: true,
            
            // Response settings
            respondToAllChat: false, // Only respond to specific triggers
            respondToNPCs: true,     // Always respond to NPC messages
            respondToQuestions: true, // Respond to questions
            respondToEmotions: true,  // Respond to emotional expressions
            respondToActions: true,   // Respond to game actions
            
            // Character AI settings
            enableCharacterAI: true,
            enableWizardResponses: true,
            enableKoboldResponses: true,
            enableCitadelGuardians: true,
            enableOccultSages: true,
            
            // Musical settings
            masterVolume: 0.6,
            enableHarmony: true,
            enableRhythm: true,
            spatialAudioRange: 1000, // Units in game world
            
            // Performance settings
            maxSimultaneousResponses: 4,
            responseDelay: 200, // ms delay before musical response
            cacheResponses: true,
            
            // Integration with existing systems
            integrateWithActionStream: true,
            integrateWithVoiceConverter: true,
            integrateWithSpatialAudio: true,
            integrateWithZoneEngine: true,
            
            ...config
        };
        
        // Initialize components
        this.musicTranslator = new ChatToMusicTranslator({
            enableCharacterThemes: this.config.enableCharacterThemes,
            enableZoneInfluence: this.config.enableZonalInfluence,
            enableHarmony: this.config.enableHarmony,
            enableRhythm: this.config.enableRhythm
        });
        
        this.pianoPlayer = new PianoResponsePlayer({
            enableSpatialAudio: this.config.enableSpatialAudio,
            masterVolume: this.config.masterVolume,
            enableVisualization: true,
            maxPolyphony: this.config.maxSimultaneousResponses * 2
        });
        
        // Action stream integration (optional)
        this.actionStream = null;
        
        // Character AI responses
        this.characterResponses = {
            wizard: {
                greetings: [
                    "Ah, a seeker of knowledge approaches...",
                    "The ancient tomes whisper your name...",
                    "Magic flows through these words...",
                    "What mysteries do you wish to uncover?"
                ],
                questions: [
                    "The answer lies within the ethereal planes...",
                    "Let me consult the cosmic harmonies...",
                    "The stars align to reveal...",
                    "Ancient wisdom speaks thus..."
                ],
                wisdom: [
                    "Power without wisdom is mere destruction...",
                    "The true magic is in understanding...",
                    "Time weaves all things together...",
                    "Knowledge is the greatest treasure..."
                ]
            },
            
            kobold: {
                greetings: [
                    "Hehe! New shiny person!",
                    "Ooh ooh! Want to see my collection?",
                    "Sneaky sneaky! You found me!",
                    "Trade? Trade? I got good stuff!"
                ],
                mischief: [
                    "Hehe! Look what I took!",
                    "Bet you can't catch me!",
                    "Oops! Did I do that?",
                    "Shiny things are MINE!"
                ],
                playful: [
                    "Let's play hide and seek!",
                    "I know secret passages!",
                    "Want to cause some trouble?",
                    "Follow me, I know shortcuts!"
                ]
            },
            
            citadel_guardian: {
                protective: [
                    "I stand vigilant against the darkness.",
                    "The citadel's walls remain strong.",
                    "Honor guides my blade.",
                    "I serve the realm with unwavering loyalty."
                ],
                warnings: [
                    "Danger approaches from the shadows.",
                    "The ancient seals grow weak.",
                    "Evil stirs in the forbidden lands.",
                    "Prepare yourself for battle."
                ],
                heroic: [
                    "For honor and glory!",
                    "The light shall prevail!",
                    "Stand together, we are stronger!",
                    "Victory belongs to the righteous!"
                ]
            },
            
            occult_tower_sage: {
                mysterious: [
                    "The forbidden texts speak of...",
                    "In the depths of shadow, truth dwells...",
                    "What mortals call evil, I call... knowledge.",
                    "The tower holds secrets beyond imagination..."
                ],
                ancient: [
                    "I have walked between worlds...",
                    "Time is but an illusion to those who know...",
                    "The old ways are not forgotten...",
                    "Death is merely another doorway..."
                ],
                forbidden: [
                    "Some knowledge comes at a price...",
                    "The dark arts require sacrifice...",
                    "Not all truths are meant for mortal minds...",
                    "Power and madness walk hand in hand..."
                ]
            }
        };
        
        // Integration state
        this.integrationState = {
            sessionId: uuidv4(),
            isActive: false,
            startTime: Date.now(),
            
            // Active responses
            activeResponses: new Map(), // messageId -> response session
            pendingResponses: new Map(), // Delayed responses
            responseQueue: [],
            
            // Character states
            characterStates: new Map(), // character -> current emotional/activity state
            lastResponses: new Map(),   // character -> last response time
            
            // Performance tracking
            totalResponses: 0,
            responseLatency: 0,
            musicalNotesPlayed: 0,
            
            // Cache
            responseCache: new Map(),
            translationCache: new Map()
        };
        
        // Response triggers
        this.responseTriggers = {
            // NPCs always respond
            npc_message: () => true,
            
            // Questions get responses
            question_asked: (message) => message.includes('?'),
            
            // Emotional expressions
            emotional_expression: (message) => {
                const emotionalWords = ['happy', 'sad', 'angry', 'excited', 'scared', 'amazed'];
                return emotionalWords.some(word => message.toLowerCase().includes(word));
            },
            
            // Magic/mystical content
            mystical_content: (message) => {
                const mysticalWords = ['magic', 'spell', 'wizard', 'ancient', 'mystical', 'arcane'];
                return mysticalWords.some(word => message.toLowerCase().includes(word));
            },
            
            // Character name mentions
            character_mentioned: (message) => {
                const characters = ['wizard', 'kobold', 'guardian', 'sage', 'crocodile', 'buggy', 'mihawk'];
                return characters.some(char => message.toLowerCase().includes(char));
            },
            
            // Action responses
            action_performed: (message) => {
                const actionWords = ['attack', 'defend', 'cast', 'use', 'move', 'explore'];
                return actionWords.some(word => message.toLowerCase().includes(word));
            }
        };
        
        console.log('🎼 Musical Chat Integration initialized');
        console.log(`🎭 Character types: ${Object.keys(this.characterResponses).length}`);
        console.log(`🎵 Response triggers: ${Object.keys(this.responseTriggers).length}`);
    }

    /**
     * Initialize the musical chat integration
     */
    async initialize() {
        try {
            console.log('🎼 Initializing Musical Chat Integration...');
            
            // Initialize music components
            await this.musicTranslator.initialize();
            await this.pianoPlayer.initialize();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Initialize action stream integration if enabled
            if (this.config.integrateWithActionStream) {
                await this.initializeActionStreamIntegration();
            }
            
            this.integrationState.isActive = true;
            
            console.log('✅ Musical Chat Integration ready');
            this.emit('initialized', this.getIntegrationStatus());
            
        } catch (error) {
            console.error('❌ Failed to initialize musical chat integration:', error);
            throw error;
        }
    }

    /**
     * Process chat message and generate musical responses
     */
    async processChatMessage(chatEvent) {
        if (!this.integrationState.isActive || !this.config.enableMusicalChat) {
            return null;
        }
        
        try {
            const processStart = Date.now();
            
            // Check if this message should trigger a response
            const shouldRespond = this.shouldGenerateResponse(chatEvent);
            if (!shouldRespond.respond) {
                return null;
            }
            
            // Determine responding character(s)
            const respondingCharacters = this.determineRespondingCharacters(chatEvent, shouldRespond);
            
            const responses = [];
            
            // Generate responses for each character
            for (const character of respondingCharacters) {
                // Check if character is on cooldown
                if (this.isCharacterOnCooldown(character)) {
                    continue;
                }
                
                // Generate character response
                const characterResponse = await this.generateCharacterResponse(
                    character, 
                    chatEvent, 
                    shouldRespond.reason
                );
                
                if (characterResponse) {
                    // Translate response to music
                    const musicalTranslation = await this.musicTranslator.translateChatToMusic({
                        ...characterResponse,
                        zoneContext: chatEvent.zoneContext
                    });
                    
                    if (musicalTranslation) {
                        // Add delay if configured
                        if (this.config.responseDelay > 0) {
                            await this.delay(this.config.responseDelay);
                        }
                        
                        // Play musical response
                        const playbackSession = await this.pianoPlayer.playMusicalResponse(musicalTranslation);
                        
                        const response = {
                            responseId: uuidv4(),
                            character,
                            originalMessage: chatEvent.original || chatEvent.message,
                            characterResponse: characterResponse.message,
                            musicalTranslation,
                            playbackSession,
                            timestamp: Date.now(),
                            processingTime: Date.now() - processStart
                        };
                        
                        responses.push(response);
                        
                        // Track response
                        this.trackResponse(response);
                        
                        // Update character state
                        this.updateCharacterState(character, response);
                    }
                }
            }
            
            // Emit integration event
            if (responses.length > 0) {
                this.emit('musical_responses_generated', {
                    originalMessage: chatEvent,
                    responses,
                    processingTime: Date.now() - processStart
                });
            }
            
            return responses;
            
        } catch (error) {
            console.error('Error processing chat message:', error);
            this.emit('processing_error', { chatEvent, error: error.message });
            return null;
        }
    }

    /**
     * Determine if message should generate musical response
     */
    shouldGenerateResponse(chatEvent) {
        const message = chatEvent.original || chatEvent.message || '';
        
        // Check all triggers
        for (const [triggerName, triggerFunction] of Object.entries(this.responseTriggers)) {
            if (triggerFunction(message)) {
                return { respond: true, reason: triggerName, trigger: triggerFunction };
            }
        }
        
        // Check if from NPC
        if (this.config.respondToNPCs && this.isNPCMessage(chatEvent)) {
            return { respond: true, reason: 'npc_message' };
        }
        
        // Check configuration flags
        if (this.config.respondToAllChat) {
            return { respond: true, reason: 'respond_to_all' };
        }
        
        return { respond: false, reason: 'no_trigger_matched' };
    }

    /**
     * Determine which characters should respond
     */
    determineRespondingCharacters(chatEvent, shouldRespond) {
        const message = (chatEvent.original || chatEvent.message || '').toLowerCase();
        const characters = [];
        
        // Character-specific triggers
        if (message.includes('wizard') || message.includes('magic') || message.includes('spell')) {
            characters.push('wizard');
        }
        
        if (message.includes('kobold') || message.includes('shiny') || message.includes('treasure')) {
            characters.push('kobold');
        }
        
        if (message.includes('guardian') || message.includes('protect') || message.includes('defend')) {
            characters.push('citadel_guardian');
        }
        
        if (message.includes('sage') || message.includes('ancient') || message.includes('forbidden')) {
            characters.push('occult_tower_sage');
        }
        
        if (message.includes('crocodile') || message.includes('strategy')) {
            characters.push('crocodile');
        }
        
        if (message.includes('buggy') || message.includes('show') || message.includes('entertainment')) {
            characters.push('buggy');
        }
        
        // Zone-based character selection
        if (chatEvent.zoneContext?.zone) {
            const zoneCharacters = this.getZoneCharacters(chatEvent.zoneContext.zone);
            characters.push(...zoneCharacters);
        }
        
        // Default character if none specified
        if (characters.length === 0) {
            characters.push(this.selectDefaultCharacter(shouldRespond.reason));
        }
        
        // Limit simultaneous responses
        return characters.slice(0, this.config.maxSimultaneousResponses);
    }

    /**
     * Generate character response text
     */
    async generateCharacterResponse(character, chatEvent, reason) {
        const message = chatEvent.original || chatEvent.message || '';
        const characterData = this.characterResponses[character];
        
        if (!characterData) {
            console.warn(`No response data for character: ${character}`);
            return null;
        }
        
        // Determine response type
        let responseType = 'general';
        let responses = [];
        
        if (reason === 'question_asked') {
            responses = characterData.questions || characterData.wisdom || [];
            responseType = 'question';
        } else if (reason === 'mystical_content') {
            responses = characterData.wisdom || characterData.mysterious || [];
            responseType = 'mystical';
        } else if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
            responses = characterData.greetings || [];
            responseType = 'greeting';
        } else if (character === 'kobold') {
            if (Math.random() > 0.5) {
                responses = characterData.mischief || [];
                responseType = 'mischief';
            } else {
                responses = characterData.playful || [];
                responseType = 'playful';
            }
        } else if (character === 'citadel_guardian') {
            if (message.toLowerCase().includes('danger') || message.toLowerCase().includes('enemy')) {
                responses = characterData.warnings || [];
                responseType = 'warning';
            } else {
                responses = characterData.protective || [];
                responseType = 'protective';
            }
        }
        
        // Default to first available response category
        if (responses.length === 0) {
            const categories = Object.keys(characterData);
            if (categories.length > 0) {
                responses = characterData[categories[0]];
                responseType = categories[0];
            }
        }
        
        if (responses.length === 0) {
            return null;
        }
        
        // Select random response
        const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
        
        return {
            id: uuidv4(),
            character,
            message: selectedResponse,
            responseType,
            originalTrigger: message,
            timestamp: Date.now(),
            username: this.getCharacterDisplayName(character)
        };
    }

    /**
     * Setup event handlers for integration
     */
    setupEventHandlers() {
        // Music translator events
        this.musicTranslator.on('musical_response_generated', (response) => {
            this.emit('translation_completed', response);
        });
        
        // Piano player events
        this.pianoPlayer.on('note_triggered', (note) => {
            this.integrationState.musicalNotesPlayed++;
            this.emit('musical_note_played', note);
        });
        
        this.pianoPlayer.on('playback_started', (session) => {
            this.emit('musical_playback_started', session);
        });
        
        // Visualization events
        this.pianoPlayer.on('visualization_frame', (frameData) => {
            this.emit('piano_roll_update', frameData);
        });
    }

    /**
     * Initialize action stream integration
     */
    async initializeActionStreamIntegration() {
        try {
            console.log('🔗 Integrating with Unified Action Stream...');
            
            this.actionStream = new UnifiedActionStream({
                enableUnifiedStream: true,
                enableRealTimeFiltering: true,
                enableExcelExport: false // We'll handle our own exports
            });
            
            await this.actionStream.initialize();
            
            // Listen for chat events from action stream
            this.actionStream.on('unified_event', (event) => {
                if (event.type === 'chat') {
                    this.processChatMessage(event);
                }
            });
            
            console.log('✅ Action stream integration ready');
            
        } catch (error) {
            console.warn('⚠️ Action stream integration failed:', error.message);
            this.config.integrateWithActionStream = false;
        }
    }

    // Helper methods...

    isNPCMessage(chatEvent) {
        const npcIndicators = ['npc_', 'bot_', 'ai_'];
        const username = (chatEvent.username || '').toLowerCase();
        
        return npcIndicators.some(indicator => username.includes(indicator)) ||
               Object.keys(this.characterResponses).includes(chatEvent.character);
    }

    isCharacterOnCooldown(character) {
        const lastResponse = this.integrationState.lastResponses.get(character);
        if (!lastResponse) return false;
        
        const cooldownTime = 5000; // 5 seconds
        return Date.now() - lastResponse < cooldownTime;
    }

    getZoneCharacters(zone) {
        const zoneCharacterMap = {
            mystical: ['wizard', 'occult_tower_sage'],
            entertainment: ['buggy', 'kobold'],
            business: ['crocodile'],
            mastery: ['mihawk', 'citadel_guardian'],
            combat: ['citadel_guardian'],
            default: ['wizard']
        };
        
        return zoneCharacterMap[zone] || zoneCharacterMap.default;
    }

    selectDefaultCharacter(reason) {
        const reasonCharacterMap = {
            mystical_content: 'wizard',
            question_asked: 'wizard',
            action_performed: 'citadel_guardian',
            emotional_expression: 'kobold',
            character_mentioned: 'wizard'
        };
        
        return reasonCharacterMap[reason] || 'wizard';
    }

    getCharacterDisplayName(character) {
        const displayNames = {
            wizard: 'Arcane Sage',
            kobold: 'Sneaky Kobold',
            citadel_guardian: 'Guardian of the Citadel',
            occult_tower_sage: 'Tower Sage',
            crocodile: 'Sir Crocodile',
            buggy: 'Buggy the Clown',
            mihawk: 'Dracule Mihawk'
        };
        
        return displayNames[character] || character;
    }

    trackResponse(response) {
        this.integrationState.totalResponses++;
        this.integrationState.responseLatency = 
            (this.integrationState.responseLatency + response.processingTime) / 2;
        
        this.integrationState.lastResponses.set(response.character, response.timestamp);
        this.integrationState.activeResponses.set(response.responseId, response);
        
        // Cache if enabled
        if (this.config.cacheResponses) {
            const cacheKey = `${response.character}_${response.originalMessage}`;
            this.integrationState.responseCache.set(cacheKey, response);
        }
    }

    updateCharacterState(character, response) {
        const state = this.integrationState.characterStates.get(character) || {
            mood: 'neutral',
            activity: 'idle',
            lastInteraction: 0
        };
        
        // Update based on response type
        if (response.characterResponse.responseType === 'greeting') {
            state.mood = 'friendly';
            state.activity = 'socializing';
        } else if (response.characterResponse.responseType === 'warning') {
            state.mood = 'alert';
            state.activity = 'guarding';
        } else if (response.characterResponse.responseType === 'mischief') {
            state.mood = 'playful';
            state.activity = 'scheming';
        }
        
        state.lastInteraction = Date.now();
        this.integrationState.characterStates.set(character, state);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get integration status
     */
    getIntegrationStatus() {
        const uptime = Date.now() - this.integrationState.startTime;
        
        return {
            sessionId: this.integrationState.sessionId,
            isActive: this.integrationState.isActive,
            uptime,
            
            // Response statistics
            totalResponses: this.integrationState.totalResponses,
            averageResponseLatency: this.integrationState.responseLatency,
            musicalNotesPlayed: this.integrationState.musicalNotesPlayed,
            
            // Active sessions
            activeResponses: this.integrationState.activeResponses.size,
            pendingResponses: this.integrationState.pendingResponses.size,
            
            // Character states
            characterStates: Object.fromEntries(this.integrationState.characterStates),
            
            // Component status
            musicTranslatorStatus: this.musicTranslator.getTranslationStatus(),
            pianoPlayerStatus: this.pianoPlayer.getPlayerStatus(),
            actionStreamIntegrated: this.config.integrateWithActionStream && !!this.actionStream,
            
            // Configuration
            enabledFeatures: {
                musicalChat: this.config.enableMusicalChat,
                characterThemes: this.config.enableCharacterThemes,
                spatialAudio: this.config.enableSpatialAudio,
                zonalInfluence: this.config.enableZonalInfluence
            }
        };
    }

    /**
     * Stop musical chat integration
     */
    async stop() {
        try {
            this.integrationState.isActive = false;
            
            // Stop components
            await this.pianoPlayer.stop();
            await this.musicTranslator.stop();
            
            if (this.actionStream) {
                await this.actionStream.stop();
            }
            
            const finalStatus = this.getIntegrationStatus();
            
            console.log('🎼 Musical Chat Integration stopped');
            this.emit('stopped', finalStatus);
            
            return finalStatus;
            
        } catch (error) {
            console.error('Error stopping musical chat integration:', error);
            throw error;
        }
    }
}

module.exports = MusicalChatIntegration;

// CLI interface for testing
if (require.main === module) {
    const integration = new MusicalChatIntegration({
        enableMusicalChat: true,
        respondToAllChat: true,
        masterVolume: 0.5
    });
    
    async function demo() {
        try {
            await integration.initialize();
            
            // Test different character responses
            const testMessages = [
                {
                    message: "Hello, is anyone there? I need help with magic!",
                    username: "TestUser",
                    zoneContext: { zone: 'mystical' }
                },
                {
                    message: "Hehe, I found something shiny!",
                    username: "SneakyPlayer", 
                    character: 'kobold',
                    zoneContext: { zone: 'entertainment' }
                },
                {
                    message: "We must defend the citadel at all costs!",
                    username: "HeroicPlayer",
                    zoneContext: { zone: 'combat' }
                },
                {
                    message: "What ancient secrets lie in the forbidden tower?",
                    username: "CuriousSeeker",
                    zoneContext: { zone: 'mystical' }
                }
            ];
            
            console.log('🎼 Testing musical chat responses...');
            
            for (let i = 0; i < testMessages.length; i++) {
                const message = testMessages[i];
                console.log(`\n📨 Processing: "${message.message}"`);
                
                const responses = await integration.processChatMessage(message);
                
                if (responses && responses.length > 0) {
                    for (const response of responses) {
                        console.log(`   🎭 ${response.character}: "${response.characterResponse.message}"`);
                        console.log(`   🎵 Musical key: ${response.musicalTranslation.musical.key}`);
                        console.log(`   🎹 Notes: ${response.musicalTranslation.musical.melody.length}`);
                    }
                } else {
                    console.log('   (No musical response generated)');
                }
                
                // Wait between messages
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
            
            console.log('\n📊 Integration Status:');
            console.log(JSON.stringify(integration.getIntegrationStatus(), null, 2));
            
        } catch (error) {
            console.error('Demo error:', error);
        }
    }
    
    demo();
}

console.log('🎼 Musical Chat Integration ready');