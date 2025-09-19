#!/usr/bin/env node

/**
 * CHAT TO MUSIC TRANSLATOR
 * 
 * Converts chat responses into piano music using character personalities,
 * emotional analysis, and thematic mapping. Integrates with the existing
 * chat action stream to provide musical responses for NPCs, wizards, 
 * kobolds, and other game entities.
 * 
 * Features:
 * - Character-specific musical themes and styles
 * - Emotional analysis to influence musical mood
 * - Response type mapping (questions, answers, actions)
 * - Zone-based musical context adaptation
 * - Real-time piano note generation
 * - Integration with spatial audio system
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class ChatToMusicTranslator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Musical settings
            enableMusicalResponses: true,
            defaultKey: 'C',
            defaultScale: 'major',
            enableHarmony: true,
            enableRhythm: true,
            
            // Character settings
            enableCharacterThemes: true,
            enableEmotionalMapping: true,
            enableZoneInfluence: true,
            
            // Performance settings
            maxSimultaneousVoices: 8,
            noteVelocityRange: [40, 127],
            defaultNoteDuration: 500, // milliseconds
            
            // Integration settings
            integrateWithActionStream: true,
            integrateWithZoneEngine: true,
            integrateWithSpatialAudio: true,
            
            ...config
        };
        
        // Musical theory foundations
        this.musicalScales = {
            major: [0, 2, 4, 5, 7, 9, 11],
            minor: [0, 2, 3, 5, 7, 8, 10],
            dorian: [0, 2, 3, 5, 7, 9, 10],
            mixolydian: [0, 2, 4, 5, 7, 9, 10],
            pentatonic: [0, 2, 4, 7, 9],
            blues: [0, 3, 5, 6, 7, 10],
            harmonic_minor: [0, 2, 3, 5, 7, 8, 11],
            phrygian: [0, 1, 3, 5, 7, 8, 10],
            lydian: [0, 2, 4, 6, 7, 9, 11]
        };
        
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        
        // Character musical profiles
        this.characterProfiles = {
            // One Piece Characters
            crocodile: {
                personality: 'strategic',
                musicalStyle: 'dark_jazz',
                preferredKeys: ['Dm', 'Gm', 'Am'],
                scales: ['minor', 'harmonic_minor'],
                chordTypes: ['minor7', 'dominant7', 'diminished'],
                rhythmPattern: 'syncopated',
                tempoRange: [80, 110],
                dynamicRange: [60, 100],
                articulation: 'legato_with_staccato_accents',
                instruments: ['piano', 'bass', 'subtle_strings'],
                emotionalRange: ['calculating', 'menacing', 'confident', 'mysterious']
            },
            
            buggy: {
                personality: 'entertainment',
                musicalStyle: 'circus_ragtime',
                preferredKeys: ['C', 'F', 'G', 'Bb'],
                scales: ['major', 'mixolydian'],
                chordTypes: ['major', 'major7', 'sus4'],
                rhythmPattern: 'bouncy_ragtime',
                tempoRange: [120, 160],
                dynamicRange: [70, 127],
                articulation: 'staccato_playful',
                instruments: ['piano', 'accordion', 'circus_organ'],
                emotionalRange: ['playful', 'chaotic', 'showoff', 'dramatic']
            },
            
            mihawk: {
                personality: 'mastery',
                musicalStyle: 'minimalist_classical',
                preferredKeys: ['Em', 'Am', 'F#m'],
                scales: ['minor', 'dorian'],
                chordTypes: ['minor', 'major', 'perfect_fifth'],
                rhythmPattern: 'precise_measured',
                tempoRange: [60, 90],
                dynamicRange: [40, 90],
                articulation: 'precise_clean',
                instruments: ['solo_piano', 'strings_section'],
                emotionalRange: ['focused', 'deadly_calm', 'superior', 'philosophical']
            },
            
            // Fantasy Characters
            wizard: {
                personality: 'mystical',
                musicalStyle: 'ethereal_ambient',
                preferredKeys: ['F#', 'Db', 'Ab'],
                scales: ['lydian', 'pentatonic', 'blues'],
                chordTypes: ['add9', 'sus2', 'maj7'],
                rhythmPattern: 'flowing_arpeggios',
                tempoRange: [40, 80],
                dynamicRange: [30, 80],
                articulation: 'sustained_mysterious',
                instruments: ['piano', 'pad_synth', 'bells', 'ethereal_choir'],
                emotionalRange: ['wise', 'mystical', 'ancient', 'powerful']
            },
            
            kobold: {
                personality: 'mischievous',
                musicalStyle: 'playful_staccato',
                preferredKeys: ['G', 'D', 'A'],
                scales: ['major', 'pentatonic'],
                chordTypes: ['major', 'diminished', 'augmented'],
                rhythmPattern: 'quick_scattered',
                tempoRange: [140, 200],
                dynamicRange: [60, 110],
                articulation: 'staccato_bouncy',
                instruments: ['piano', 'xylophone', 'piccolo'],
                emotionalRange: ['mischievous', 'quick', 'sneaky', 'playful']
            },
            
            citadel_guardian: {
                personality: 'protective',
                musicalStyle: 'epic_orchestral',
                preferredKeys: ['C', 'G', 'D'],
                scales: ['major', 'dorian'],
                chordTypes: ['major', 'sus4', 'power_chords'],
                rhythmPattern: 'march_like',
                tempoRange: [90, 130],
                dynamicRange: [80, 127],
                articulation: 'strong_decisive',
                instruments: ['piano', 'brass', 'timpani', 'strings'],
                emotionalRange: ['protective', 'noble', 'determined', 'heroic']
            },
            
            occult_tower_sage: {
                personality: 'esoteric',
                musicalStyle: 'dark_ambient_classical',
                preferredKeys: ['F#m', 'C#m', 'Bbm'],
                scales: ['harmonic_minor', 'phrygian'],
                chordTypes: ['minor', 'diminished7', 'minor_maj7'],
                rhythmPattern: 'irregular_mystical',
                tempoRange: [30, 70],
                dynamicRange: [20, 70],
                articulation: 'mysterious_whispered',
                instruments: ['piano', 'organ', 'strings', 'subtle_choir'],
                emotionalRange: ['mysterious', 'ancient', 'forbidden', 'enlightened']
            }
        };
        
        // Response type musical patterns
        this.responsePatterns = {
            greeting: {
                melodicDirection: 'ascending',
                chordProgression: ['I', 'vi', 'IV', 'V'],
                dynamicCurve: 'crescendo',
                rhythm: 'welcoming'
            },
            
            question: {
                melodicDirection: 'rising_inquiry',
                chordProgression: ['I', 'V', 'vi', 'V7'],
                dynamicCurve: 'questioning',
                rhythm: 'curious'
            },
            
            answer: {
                melodicDirection: 'resolving',
                chordProgression: ['vi', 'IV', 'I', 'V', 'I'],
                dynamicCurve: 'confident_resolution',
                rhythm: 'declarative'
            },
            
            action_response: {
                melodicDirection: 'energetic',
                chordProgression: ['I', 'VII', 'IV', 'I'],
                dynamicCurve: 'dynamic',
                rhythm: 'action_oriented'
            },
            
            emotional_response: {
                melodicDirection: 'expressive',
                chordProgression: ['vi', 'IV', 'I', 'V'],
                dynamicCurve: 'emotional',
                rhythm: 'expressive'
            },
            
            wisdom: {
                melodicDirection: 'contemplative',
                chordProgression: ['ii', 'V', 'I', 'vi'],
                dynamicCurve: 'thoughtful',
                rhythm: 'measured'
            },
            
            warning: {
                melodicDirection: 'descending_urgent',
                chordProgression: ['i', 'bVII', 'bVI', 'V'],
                dynamicCurve: 'urgent',
                rhythm: 'warning'
            },
            
            celebration: {
                melodicDirection: 'jubilant',
                chordProgression: ['I', 'V', 'vi', 'IV'],
                dynamicCurve: 'celebratory',
                rhythm: 'festive'
            }
        };
        
        // Emotional to musical mapping
        this.emotionalMappings = {
            happy: { key: 'major', tempo: '+20%', dynamics: '+10%' },
            sad: { key: 'minor', tempo: '-30%', dynamics: '-20%' },
            angry: { key: 'minor', tempo: '+40%', dynamics: '+30%' },
            calm: { key: 'major', tempo: '-20%', dynamics: '-10%' },
            mysterious: { key: 'minor', tempo: '-10%', dynamics: '-15%' },
            excited: { key: 'major', tempo: '+30%', dynamics: '+20%' },
            fearful: { key: 'minor', tempo: '+10%', dynamics: '-20%' },
            wise: { key: 'dorian', tempo: '-15%', dynamics: 'varied' },
            mischievous: { key: 'major', tempo: '+25%', dynamics: 'playful' },
            heroic: { key: 'major', tempo: '+15%', dynamics: '+25%' }
        };
        
        // Zone musical influences
        this.zoneMusicStyles = {
            entertainment: {
                styleModifier: 'more_theatrical',
                tempoBoost: 1.2,
                dynamicBoost: 1.1,
                addInstruments: ['theatrical_elements']
            },
            
            business: {
                styleModifier: 'professional_measured',
                tempoBoost: 0.9,
                dynamicBoost: 0.8,
                addInstruments: ['subtle_background']
            },
            
            mastery: {
                styleModifier: 'precise_technical',
                tempoBoost: 0.8,
                dynamicBoost: 0.9,
                addInstruments: ['technical_precision']
            },
            
            mystical: {
                styleModifier: 'ethereal_ambient',
                tempoBoost: 0.7,
                dynamicBoost: 0.6,
                addInstruments: ['ethereal_pads', 'bells']
            },
            
            combat: {
                styleModifier: 'intense_rhythmic',
                tempoBoost: 1.4,
                dynamicBoost: 1.3,
                addInstruments: ['percussion', 'brass']
            }
        };
        
        // Translation state
        this.translationState = {
            sessionId: uuidv4(),
            activeVoices: new Map(), // characterId -> musical state
            currentZone: 'default',
            globalKey: this.config.defaultKey,
            globalScale: this.config.defaultScale,
            
            // Performance tracking
            totalTranslations: 0,
            activeNotes: new Set(),
            voiceAssignments: new Map(),
            
            // Musical context
            lastChordProgression: null,
            rhythmicContext: null,
            harmonicContext: null
        };
        
        console.log('🎼 Chat to Music Translator initialized');
        console.log(`🎹 Musical characters: ${Object.keys(this.characterProfiles).length}`);
        console.log(`🎵 Response patterns: ${Object.keys(this.responsePatterns).length}`);
    }

    /**
     * Initialize the music translator
     */
    async initialize() {
        try {
            // Set up musical context
            this.setupMusicalContext();
            
            // Initialize character voices
            this.initializeCharacterVoices();
            
            console.log('✅ Chat to Music Translator ready');
            this.emit('initialized', this.getTranslationStatus());
            
        } catch (error) {
            console.error('❌ Failed to initialize music translator:', error);
            throw error;
        }
    }

    /**
     * Translate chat message to musical response
     */
    async translateChatToMusic(chatEvent) {
        if (!this.config.enableMusicalResponses) {
            return null;
        }
        
        try {
            // Analyze the chat message
            const analysis = this.analyzeChatMessage(chatEvent);
            
            // Determine character/speaker
            const character = this.identifyCharacter(chatEvent, analysis);
            
            // Get character's musical profile
            const profile = this.getCharacterProfile(character);
            
            // Analyze emotional content
            const emotion = this.analyzeEmotion(chatEvent.original || chatEvent.message, profile);
            
            // Determine response type
            const responseType = this.determineResponseType(analysis);
            
            // Generate musical response
            const musicalResponse = await this.generateMusicalResponse({
                character,
                profile,
                emotion,
                responseType,
                message: chatEvent.original || chatEvent.message,
                analysis,
                chatEvent
            });
            
            // Apply zone influences
            if (this.config.enableZoneInfluence && chatEvent.zoneContext) {
                this.applyZoneInfluence(musicalResponse, chatEvent.zoneContext.zone);
            }
            
            // Track translation
            this.translationState.totalTranslations++;
            
            // Emit musical event
            this.emit('musical_response_generated', musicalResponse);
            
            return musicalResponse;
            
        } catch (error) {
            console.error('Error translating chat to music:', error);
            return null;
        }
    }

    /**
     * Generate musical response based on analysis
     */
    async generateMusicalResponse(context) {
        const { character, profile, emotion, responseType, message, analysis } = context;
        
        // Select musical elements
        const key = this.selectKey(profile, emotion);
        const scale = this.selectScale(profile, emotion);
        const tempo = this.calculateTempo(profile, emotion, responseType);
        const dynamics = this.calculateDynamics(profile, emotion, responseType);
        
        // Generate melody
        const melody = this.generateMelody({
            key,
            scale,
            profile,
            responseType,
            message,
            emotion
        });
        
        // Generate harmony
        const harmony = this.config.enableHarmony ? 
            this.generateHarmony(melody, key, scale, profile) : null;
        
        // Generate rhythm
        const rhythm = this.config.enableRhythm ?
            this.generateRhythm(profile, responseType, emotion) : null;
        
        // Create musical response object
        const musicalResponse = {
            responseId: uuidv4(),
            timestamp: Date.now(),
            character,
            
            // Source information
            originalMessage: message,
            messageAnalysis: analysis,
            emotionalContext: emotion,
            responseType,
            
            // Musical elements
            musical: {
                key,
                scale,
                tempo,
                dynamics,
                melody,
                harmony,
                rhythm,
                
                // Performance instructions
                articulation: profile.articulation,
                instruments: profile.instruments,
                duration: this.calculateResponseDuration(message),
                
                // Advanced musical elements
                voicing: this.generateVoicing(harmony, profile),
                phrasing: this.generatePhrasing(melody, emotion),
                expression: this.generateExpression(profile, emotion)
            },
            
            // Playback information
            playback: {
                startTime: Date.now(),
                voice: this.assignVoice(character),
                spatialPosition: this.calculateSpatialPosition(context.chatEvent),
                volume: this.calculateVolume(dynamics, character)
            },
            
            // Metadata
            metadata: {
                characterProfile: profile.personality,
                musicalStyle: profile.musicalStyle,
                zone: context.chatEvent.zoneContext?.zone || 'unknown'
            }
        };
        
        return musicalResponse;
    }

    /**
     * Analyze chat message for musical translation
     */
    analyzeChatMessage(chatEvent) {
        const message = chatEvent.original || chatEvent.message || '';
        
        const analysis = {
            length: message.length,
            wordCount: message.split(/\s+/).length,
            
            // Punctuation analysis
            hasQuestion: message.includes('?'),
            hasExclamation: message.includes('!'),
            hasPause: message.includes('...') || message.includes(','),
            
            // Content analysis
            keywords: this.extractKeywords(message),
            topics: this.identifyTopics(message),
            sentiment: this.analyzeSentiment(message),
            
            // Musical relevance
            musicalKeywords: this.findMusicalKeywords(message),
            actionWords: this.findActionWords(message),
            emotionalWords: this.findEmotionalWords(message),
            
            // Message type
            isGreeting: this.isGreeting(message),
            isQuestion: this.isQuestion(message),
            isCommand: this.isCommand(message),
            isStatement: this.isStatement(message)
        };
        
        return analysis;
    }

    /**
     * Identify character from chat event
     */
    identifyCharacter(chatEvent, analysis) {
        // Check if character is specified in event
        if (chatEvent.character && this.characterProfiles[chatEvent.character]) {
            return chatEvent.character;
        }
        
        // Check username mapping
        const username = (chatEvent.username || '').toLowerCase();
        if (this.characterProfiles[username]) {
            return username;
        }
        
        // Analyze message content for character indicators
        const message = (chatEvent.original || chatEvent.message || '').toLowerCase();
        
        // Look for character-specific keywords
        for (const [character, profile] of Object.entries(this.characterProfiles)) {
            if (message.includes(character) || 
                profile.emotionalRange.some(emotion => message.includes(emotion))) {
                return character;
            }
        }
        
        // Default character based on message type
        if (analysis.isQuestion && analysis.sentiment === 'mysterious') {
            return 'wizard';
        } else if (analysis.actionWords.length > 0) {
            return 'citadel_guardian';
        } else if (analysis.sentiment === 'playful') {
            return 'kobold';
        }
        
        // Default to wizard for mystical/unknown responses
        return 'wizard';
    }

    /**
     * Get character musical profile
     */
    getCharacterProfile(character) {
        return this.characterProfiles[character] || this.characterProfiles.wizard;
    }

    /**
     * Analyze emotional content of message
     */
    analyzeEmotion(message, profile) {
        const text = message.toLowerCase();
        
        // Check for explicit emotional words
        for (const emotion of profile.emotionalRange) {
            if (text.includes(emotion)) {
                return emotion;
            }
        }
        
        // Simple sentiment analysis
        const positiveWords = ['great', 'good', 'happy', 'awesome', 'wonderful', 'excellent'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'sad', 'angry'];
        const mysticalWords = ['magic', 'spell', 'ancient', 'mystical', 'arcane'];
        
        if (positiveWords.some(word => text.includes(word))) {
            return 'happy';
        } else if (negativeWords.some(word => text.includes(word))) {
            return 'angry';
        } else if (mysticalWords.some(word => text.includes(word))) {
            return 'mysterious';
        }
        
        // Default to character's primary emotion
        return profile.emotionalRange[0];
    }

    /**
     * Determine response type from analysis
     */
    determineResponseType(analysis) {
        if (analysis.isGreeting) return 'greeting';
        if (analysis.hasQuestion) return 'question';
        if (analysis.isCommand) return 'action_response';
        if (analysis.emotionalWords.length > 0) return 'emotional_response';
        if (analysis.keywords.includes('wisdom') || analysis.keywords.includes('knowledge')) {
            return 'wisdom';
        }
        if (analysis.hasExclamation) return 'celebration';
        
        return 'answer'; // default
    }

    /**
     * Select musical key based on character and emotion
     */
    selectKey(profile, emotion) {
        const emotionalMapping = this.emotionalMappings[emotion];
        
        if (emotionalMapping && emotionalMapping.key) {
            // Apply emotional modification to preferred keys
            const preferredKeys = profile.preferredKeys;
            const keyType = emotionalMapping.key;
            
            // Find a preferred key that matches the emotional requirement
            for (const key of preferredKeys) {
                const isMinor = key.includes('m');
                if ((keyType === 'minor' && isMinor) || (keyType === 'major' && !isMinor)) {
                    return key;
                }
            }
        }
        
        // Default to first preferred key
        return profile.preferredKeys[0] || this.config.defaultKey;
    }

    /**
     * Select musical scale
     */
    selectScale(profile, emotion) {
        if (this.emotionalMappings[emotion] && this.emotionalMappings[emotion].key) {
            const emotionalScale = this.emotionalMappings[emotion].key;
            if (profile.scales.includes(emotionalScale)) {
                return emotionalScale;
            }
        }
        
        return profile.scales[0] || this.config.defaultScale;
    }

    /**
     * Calculate tempo based on profile and emotion
     */
    calculateTempo(profile, emotion, responseType) {
        let baseTempo = (profile.tempoRange[0] + profile.tempoRange[1]) / 2;
        
        // Apply emotional modification
        const emotionalMapping = this.emotionalMappings[emotion];
        if (emotionalMapping && emotionalMapping.tempo) {
            const modifier = parseFloat(emotionalMapping.tempo.replace('%', '')) / 100;
            baseTempo *= (1 + modifier);
        }
        
        // Apply response type modification
        const responseModifiers = {
            question: 1.1,
            action_response: 1.3,
            celebration: 1.4,
            warning: 1.2,
            wisdom: 0.8
        };
        
        if (responseModifiers[responseType]) {
            baseTempo *= responseModifiers[responseType];
        }
        
        // Keep within character's range
        return Math.max(profile.tempoRange[0], 
               Math.min(profile.tempoRange[1], baseTempo));
    }

    /**
     * Calculate dynamics (volume/intensity)
     */
    calculateDynamics(profile, emotion, responseType) {
        let baseDynamics = (profile.dynamicRange[0] + profile.dynamicRange[1]) / 2;
        
        // Apply emotional modification
        const emotionalMapping = this.emotionalMappings[emotion];
        if (emotionalMapping && emotionalMapping.dynamics) {
            const modifier = parseFloat(emotionalMapping.dynamics.replace('%', '')) / 100;
            baseDynamics *= (1 + modifier);
        }
        
        // Keep within character's range and MIDI limits
        return Math.max(profile.dynamicRange[0], 
               Math.min(profile.dynamicRange[1], baseDynamics));
    }

    /**
     * Generate melody for the response
     */
    generateMelody(context) {
        const { key, scale, profile, responseType, message, emotion } = context;
        
        // Get scale notes
        const scaleNotes = this.getScaleNotes(key, scale);
        
        // Determine melody characteristics
        const pattern = this.responsePatterns[responseType];
        const melodicDirection = pattern?.melodicDirection || 'balanced';
        
        // Generate note sequence based on message characteristics
        const noteCount = Math.min(Math.max(3, Math.floor(message.length / 10)), 12);
        const melody = [];
        
        let currentOctave = 4; // Middle octave
        let currentNoteIndex = Math.floor(scaleNotes.length / 2); // Start in middle of scale
        
        for (let i = 0; i < noteCount; i++) {
            // Select note based on melodic direction and randomness
            const note = scaleNotes[currentNoteIndex];
            const octave = currentOctave;
            
            melody.push({
                note: note,
                octave: octave,
                duration: this.config.defaultNoteDuration,
                velocity: this.calculateNoteVelocity(context, i, noteCount),
                timing: i * (this.config.defaultNoteDuration * 0.8) // Slight overlap
            });
            
            // Move to next note based on melodic direction
            currentNoteIndex = this.getNextNoteIndex(
                currentNoteIndex, 
                scaleNotes.length, 
                melodicDirection, 
                i, 
                noteCount
            );
            
            // Adjust octave if needed
            if (currentNoteIndex >= scaleNotes.length) {
                currentNoteIndex = 0;
                currentOctave = Math.min(6, currentOctave + 1);
            } else if (currentNoteIndex < 0) {
                currentNoteIndex = scaleNotes.length - 1;
                currentOctave = Math.max(2, currentOctave - 1);
            }
        }
        
        return melody;
    }

    /**
     * Generate harmony for melody
     */
    generateHarmony(melody, key, scale, profile) {
        if (!melody || melody.length === 0) return null;
        
        const chordTypes = profile.chordTypes;
        const harmony = [];
        
        // Generate chord progression
        const pattern = this.responsePatterns[this.determineResponseType({})] || this.responsePatterns.answer;
        const progression = pattern.chordProgression;
        
        // Map roman numerals to actual chords
        const chords = progression.map(roman => this.romanToChord(roman, key, scale));
        
        // Create harmonic accompaniment
        for (let i = 0; i < melody.length; i += 2) { // Every other melody note
            const chordIndex = Math.floor((i / melody.length) * chords.length);
            const chord = chords[chordIndex] || chords[0];
            
            harmony.push({
                chord: chord,
                timing: melody[i].timing,
                duration: melody[i].duration * 2,
                velocity: melody[i].velocity * 0.7,
                voicing: 'root_position' // Could be enhanced with better voicing
            });
        }
        
        return harmony;
    }

    /**
     * Generate rhythm pattern
     */
    generateRhythm(profile, responseType, emotion) {
        const rhythmPattern = profile.rhythmPattern;
        
        // Basic rhythm patterns
        const patterns = {
            syncopated: [1, 0.5, 1, 0.5, 1.5, 0.5],
            bouncy_ragtime: [1, 0.25, 0.25, 1, 0.5, 1],
            precise_measured: [1, 1, 1, 1],
            flowing_arpeggios: [0.25, 0.25, 0.25, 0.25, 0.5, 0.5],
            quick_scattered: [0.125, 0.25, 0.125, 0.5, 0.25],
            march_like: [1, 0.5, 0.5, 1],
            irregular_mystical: [1.5, 0.25, 0.75, 1, 0.5]
        };
        
        return patterns[rhythmPattern] || patterns.precise_measured;
    }

    // Helper methods...

    getScaleNotes(key, scaleName) {
        const rootNote = this.noteNames.indexOf(key.replace('m', ''));
        const intervals = this.musicalScales[scaleName] || this.musicalScales.major;
        
        return intervals.map(interval => this.noteNames[(rootNote + interval) % 12]);
    }

    calculateNoteVelocity(context, index, total) {
        const baseVelocity = context.profile.dynamicRange[0];
        const maxVelocity = context.profile.dynamicRange[1];
        
        // Create dynamic curve based on response type
        const curve = this.responsePatterns[context.responseType]?.dynamicCurve || 'stable';
        
        let velocityMultiplier = 1;
        switch (curve) {
            case 'crescendo':
                velocityMultiplier = 0.7 + (index / total) * 0.3;
                break;
            case 'diminuendo':
                velocityMultiplier = 1 - (index / total) * 0.3;
                break;
            case 'dynamic':
                velocityMultiplier = 0.8 + Math.sin((index / total) * Math.PI) * 0.2;
                break;
            default:
                velocityMultiplier = 0.9 + Math.random() * 0.2;
        }
        
        return Math.floor(baseVelocity + (maxVelocity - baseVelocity) * velocityMultiplier);
    }

    getNextNoteIndex(current, scaleLength, direction, step, total) {
        const progress = step / total;
        
        switch (direction) {
            case 'ascending':
                return Math.min(current + 1, scaleLength - 1);
            case 'descending':
                return Math.max(current - 1, 0);
            case 'rising_inquiry':
                return current + (progress > 0.7 ? 1 : Math.floor(Math.random() * 3) - 1);
            case 'resolving':
                return progress > 0.8 ? 0 : current + Math.floor(Math.random() * 3) - 1;
            case 'energetic':
                return current + (Math.random() > 0.5 ? 2 : -1);
            case 'contemplative':
                return current + (Math.random() > 0.7 ? 1 : 0);
            default: // balanced
                return current + Math.floor(Math.random() * 3) - 1;
        }
    }

    romanToChord(roman, key, scale) {
        // Simplified roman numeral to chord conversion
        const romanMap = {
            'I': 'major',
            'ii': 'minor',
            'iii': 'minor',
            'IV': 'major',
            'V': 'major',
            'vi': 'minor',
            'vii': 'diminished'
        };
        
        return {
            roman: roman,
            type: romanMap[roman] || 'major',
            root: key // Simplified - would need full implementation
        };
    }

    applyZoneInfluence(musicalResponse, zone) {
        const zoneStyle = this.zoneMusicStyles[zone];
        if (!zoneStyle) return;
        
        // Apply zone modifications
        musicalResponse.musical.tempo *= zoneStyle.tempoBoost;
        musicalResponse.musical.dynamics *= zoneStyle.dynamicBoost;
        
        // Add zone-specific instruments
        if (zoneStyle.addInstruments) {
            musicalResponse.musical.instruments = [
                ...musicalResponse.musical.instruments,
                ...zoneStyle.addInstruments
            ];
        }
        
        // Update metadata
        musicalResponse.metadata.zoneInfluence = zoneStyle.styleModifier;
    }

    calculateResponseDuration(message) {
        // Base duration on message length
        const baseDuration = Math.max(2000, message.length * 100);
        return Math.min(baseDuration, 10000); // Max 10 seconds
    }

    assignVoice(character) {
        // Simple voice assignment - could be enhanced
        if (!this.translationState.voiceAssignments.has(character)) {
            const availableVoices = Array.from({length: this.config.maxSimultaneousVoices}, (_, i) => i);
            const assignedVoices = Array.from(this.translationState.voiceAssignments.values());
            const freeVoices = availableVoices.filter(v => !assignedVoices.includes(v));
            
            const voice = freeVoices.length > 0 ? freeVoices[0] : 0;
            this.translationState.voiceAssignments.set(character, voice);
        }
        
        return this.translationState.voiceAssignments.get(character);
    }

    calculateSpatialPosition(chatEvent) {
        // Use position from chat event or default
        return chatEvent.position || { x: 0, y: 0, z: 0 };
    }

    calculateVolume(dynamics, character) {
        // Convert MIDI velocity to volume (0-1)
        return dynamics / 127;
    }

    generateVoicing(harmony, profile) {
        // Simplified voicing generation
        return profile.chordTypes[0] || 'root_position';
    }

    generatePhrasing(melody, emotion) {
        // Generate phrasing based on emotion
        const phrasings = {
            happy: 'bouncy_legato',
            sad: 'slow_legato',
            angry: 'sharp_staccato',
            mysterious: 'ethereal_sustained'
        };
        
        return phrasings[emotion] || 'natural';
    }

    generateExpression(profile, emotion) {
        return {
            vibrato: profile.personality === 'mystical' ? 'subtle' : 'none',
            rubato: profile.personality === 'entertainment' ? 'playful' : 'minimal',
            pedaling: 'contextual'
        };
    }

    setupMusicalContext() {
        // Initialize global musical context
        this.translationState.globalKey = this.config.defaultKey;
        this.translationState.globalScale = this.config.defaultScale;
    }

    initializeCharacterVoices() {
        // Initialize voice tracking for characters
        for (const character of Object.keys(this.characterProfiles)) {
            this.translationState.activeVoices.set(character, {
                isActive: false,
                currentNotes: [],
                lastActivity: 0
            });
        }
    }

    // Analysis helper methods
    extractKeywords(message) {
        const words = message.toLowerCase().split(/\s+/);
        return words.filter(word => word.length > 3);
    }

    identifyTopics(message) {
        const topicKeywords = {
            magic: ['spell', 'magic', 'arcane', 'mystical'],
            combat: ['fight', 'battle', 'attack', 'defend'],
            wisdom: ['knowledge', 'wisdom', 'learn', 'teach'],
            adventure: ['quest', 'journey', 'explore', 'discover']
        };
        
        const topics = [];
        const text = message.toLowerCase();
        
        for (const [topic, keywords] of Object.entries(topicKeywords)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                topics.push(topic);
            }
        }
        
        return topics;
    }

    analyzeSentiment(message) {
        const text = message.toLowerCase();
        
        if (['great', 'awesome', 'wonderful'].some(word => text.includes(word))) {
            return 'positive';
        } else if (['bad', 'terrible', 'awful'].some(word => text.includes(word))) {
            return 'negative';
        } else if (['mysterious', 'arcane', 'ancient'].some(word => text.includes(word))) {
            return 'mysterious';
        }
        
        return 'neutral';
    }

    findMusicalKeywords(message) {
        const musicalWords = ['music', 'song', 'note', 'chord', 'melody', 'harmony', 'rhythm'];
        return musicalWords.filter(word => message.toLowerCase().includes(word));
    }

    findActionWords(message) {
        const actionWords = ['fight', 'attack', 'defend', 'cast', 'use', 'move', 'go', 'run'];
        return actionWords.filter(word => message.toLowerCase().includes(word));
    }

    findEmotionalWords(message) {
        const emotionalWords = ['happy', 'sad', 'angry', 'excited', 'calm', 'mysterious', 'wise'];
        return emotionalWords.filter(word => message.toLowerCase().includes(word));
    }

    isGreeting(message) {
        const greetings = ['hello', 'hi', 'hey', 'greetings', 'welcome'];
        return greetings.some(greeting => message.toLowerCase().includes(greeting));
    }

    isQuestion(message) {
        return message.includes('?') || 
               ['what', 'how', 'why', 'when', 'where', 'who'].some(word => 
                   message.toLowerCase().startsWith(word));
    }

    isCommand(message) {
        const commandWords = ['do', 'go', 'use', 'cast', 'attack', 'defend'];
        return commandWords.some(word => message.toLowerCase().startsWith(word));
    }

    isStatement(message) {
        return !this.isQuestion(message) && !this.isCommand(message);
    }

    /**
     * Get translation status
     */
    getTranslationStatus() {
        return {
            sessionId: this.translationState.sessionId,
            totalTranslations: this.translationState.totalTranslations,
            activeVoices: this.translationState.activeVoices.size,
            currentZone: this.translationState.currentZone,
            globalKey: this.translationState.globalKey,
            globalScale: this.translationState.globalScale,
            availableCharacters: Object.keys(this.characterProfiles),
            voiceAssignments: Object.fromEntries(this.translationState.voiceAssignments)
        };
    }

    /**
     * Stop music translator
     */
    async stop() {
        try {
            // Clear active voices
            this.translationState.activeVoices.clear();
            this.translationState.voiceAssignments.clear();
            
            const finalStatus = this.getTranslationStatus();
            
            console.log('🎼 Chat to Music Translator stopped');
            this.emit('stopped', finalStatus);
            
            return finalStatus;
            
        } catch (error) {
            console.error('Error stopping music translator:', error);
            throw error;
        }
    }
}

module.exports = ChatToMusicTranslator;

// CLI interface for testing
if (require.main === module) {
    const translator = new ChatToMusicTranslator();
    
    async function demo() {
        try {
            await translator.initialize();
            
            // Demo character responses
            const testMessages = [
                {
                    character: 'wizard',
                    message: 'Greetings, seeker of ancient knowledge',
                    username: 'MerlinSage',
                    zoneContext: { zone: 'mystical' }
                },
                {
                    character: 'kobold', 
                    message: 'Hehe! Want to see something shiny?',
                    username: 'SneakyKobold',
                    zoneContext: { zone: 'entertainment' }
                },
                {
                    character: 'crocodile',
                    message: 'Your strategy is... interesting',
                    username: 'SirCrocodile',
                    zoneContext: { zone: 'business' }
                }
            ];
            
            console.log('🎵 Testing musical translations...');
            
            for (const testMessage of testMessages) {
                const translation = await translator.translateChatToMusic(testMessage);
                
                if (translation) {
                    console.log(`\n🎼 ${testMessage.character.toUpperCase()}`);
                    console.log(`   Message: "${testMessage.message}"`);
                    console.log(`   Key: ${translation.musical.key}`);
                    console.log(`   Scale: ${translation.musical.scale}`);
                    console.log(`   Tempo: ${translation.musical.tempo}`);
                    console.log(`   Style: ${translation.metadata.musicalStyle}`);
                    console.log(`   Notes: ${translation.musical.melody.length}`);
                }
            }
            
            console.log('\n📊 Translator Status:');
            console.log(JSON.stringify(translator.getTranslationStatus(), null, 2));
            
        } catch (error) {
            console.error('Demo error:', error);
        }
    }
    
    demo();
}

console.log('🎼 Chat to Music Translator ready');