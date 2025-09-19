#!/usr/bin/env node

/**
 * PIANO RESPONSE PLAYER
 * 
 * Real-time piano audio player that takes musical responses from the 
 * Chat to Music Translator and plays them using Tone.js synthesis.
 * Supports polyphony, spatial audio, and character-specific timbres.
 * 
 * Features:
 * - Real-time piano synthesis with Tone.js
 * - Character-specific piano timbres and effects
 * - Polyphonic playing for multiple simultaneous characters
 * - Spatial audio positioning based on game coordinates
 * - Dynamic volume and expression control
 * - Piano roll visualization data generation
 * - Integration with existing VoiceToMusicConverter infrastructure
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class PianoResponsePlayer extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Audio settings
            enableAudio: true,
            enableSpatialAudio: true,
            masterVolume: 0.7,
            maxPolyphony: 8,
            
            // Piano settings
            pianoType: 'grand_piano', // grand_piano, upright_piano, electric_piano
            enableSustainPedal: true,
            enableReverbEffect: true,
            enableChorusEffect: false,
            
            // Character-specific settings
            enableCharacterTimbres: true,
            enableDynamicTimbres: true,
            
            // Performance settings
            audioLatency: 'interactive', // interactive, balanced, playback
            bufferSize: 256,
            sampleRate: 44100,
            
            // Visualization settings
            enableVisualization: true,
            generatePianoRoll: true,
            visualizationUpdateRate: 60, // FPS
            
            // Integration settings
            integrateWithSpatialAudio: true,
            integrateWithVoiceConverter: true,
            
            ...config
        };
        
        // Audio engine state
        this.audioState = {
            isInitialized: false,
            isPlaying: false,
            context: null,
            
            // Tone.js components (will be initialized when Tone.js is available)
            synths: new Map(), // character -> synth
            effects: new Map(), // character -> effects chain
            masterBus: null,
            spatialPanner: null,
            
            // Voice management
            activeVoices: new Map(), // noteId -> voice info
            characterVoices: new Map(), // character -> active notes
            sustainedNotes: new Set(),
            
            // Performance tracking
            totalNotesPlayed: 0,
            currentPolyphony: 0,
            cpuUsage: 0,
            audioDropouts: 0
        };
        
        // Character-specific synth configurations
        this.characterSynths = {
            crocodile: {
                type: 'dark_piano',
                synthType: 'Synth',
                envelope: {
                    attack: 0.1,
                    decay: 0.3,
                    sustain: 0.4,
                    release: 1.2
                },
                oscillator: {
                    type: 'triangle'
                },
                effects: ['reverb', 'lowpass'],
                volume: -8,
                detune: -5
            },
            
            buggy: {
                type: 'playful_piano',
                synthType: 'FMSynth',
                envelope: {
                    attack: 0.02,
                    decay: 0.1,
                    sustain: 0.8,
                    release: 0.4
                },
                modulation: {
                    frequency: 3,
                    depth: 0.1
                },
                effects: ['chorus', 'reverb'],
                volume: -6,
                detune: 0
            },
            
            mihawk: {
                type: 'precise_piano',
                synthType: 'Synth',
                envelope: {
                    attack: 0.01,
                    decay: 0.05,
                    sustain: 0.9,
                    release: 0.8
                },
                oscillator: {
                    type: 'sine'
                },
                effects: ['compressor'],
                volume: -10,
                detune: 0
            },
            
            wizard: {
                type: 'ethereal_piano',
                synthType: 'AMSynth',
                envelope: {
                    attack: 0.3,
                    decay: 0.8,
                    sustain: 0.6,
                    release: 2.0
                },
                modulation: {
                    frequency: 0.5,
                    depth: 0.3
                },
                effects: ['reverb', 'delay', 'chorus'],
                volume: -12,
                detune: 7
            },
            
            kobold: {
                type: 'mischievous_piano',
                synthType: 'PluckSynth',
                envelope: {
                    attack: 0.001,
                    decay: 0.05,
                    sustain: 0.1,
                    release: 0.2
                },
                resonance: 0.9,
                dampening: 4000,
                effects: ['distortion', 'delay'],
                volume: -4,
                detune: 3
            },
            
            citadel_guardian: {
                type: 'heroic_piano',
                synthType: 'Synth',
                envelope: {
                    attack: 0.05,
                    decay: 0.2,
                    sustain: 0.7,
                    release: 1.0
                },
                oscillator: {
                    type: 'square'
                },
                effects: ['reverb', 'compressor'],
                volume: -5,
                detune: 0
            },
            
            occult_tower_sage: {
                type: 'mysterious_piano',
                synthType: 'MonoSynth',
                envelope: {
                    attack: 0.8,
                    decay: 1.2,
                    sustain: 0.3,
                    release: 3.0
                },
                filter: {
                    frequency: 800,
                    type: 'lowpass'
                },
                effects: ['reverb', 'delay', 'lowpass'],
                volume: -15,
                detune: -12
            }
        };
        
        // Piano roll visualization data
        this.pianoRollData = {
            activeNotes: new Map(), // noteId -> note visualization data
            noteHistory: [], // Historical notes for playback visualization
            currentTimePosition: 0,
            timeRange: { start: 0, end: 10000 }, // 10 second window
            
            // Visualization settings
            noteColors: {
                crocodile: '#8B4513',     // Dark brown
                buggy: '#FF6347',        // Bright red/orange
                mihawk: '#4682B4',       // Steel blue
                wizard: '#9370DB',       // Purple
                kobold: '#32CD32',       // Lime green
                citadel_guardian: '#FFD700', // Gold
                occult_tower_sage: '#800080' // Dark purple
            },
            
            keyRange: { lowest: 21, highest: 108 }, // MIDI note numbers (A0 to C8)
            zoom: 1.0,
            followPlayhead: true
        };
        
        // Performance monitoring
        this.performanceStats = {
            notesPlayed: 0,
            averageLatency: 0,
            peakPolyphony: 0,
            memoryUsage: 0,
            audioThreadCPU: 0
        };
        
        console.log('🎹 Piano Response Player initialized');
        console.log(`🎵 Character synths: ${Object.keys(this.characterSynths).length}`);
    }

    /**
     * Initialize the piano player
     */
    async initialize() {
        try {
            console.log('🎹 Initializing piano audio engine...');
            
            // Initialize audio context
            await this.initializeAudioContext();
            
            // Setup character synthesizers
            await this.setupCharacterSynths();
            
            // Setup effects chains
            await this.setupEffectsChains();
            
            // Setup spatial audio if enabled
            if (this.config.enableSpatialAudio) {
                await this.setupSpatialAudio();
            }
            
            // Setup master bus
            await this.setupMasterBus();
            
            // Initialize visualization
            if (this.config.enableVisualization) {
                this.initializeVisualization();
            }
            
            this.audioState.isInitialized = true;
            
            console.log('✅ Piano Response Player ready');
            this.emit('initialized', this.getPlayerStatus());
            
        } catch (error) {
            console.error('❌ Failed to initialize piano player:', error);
            
            // Fallback to silent mode
            this.config.enableAudio = false;
            console.log('🔇 Running in silent mode');
            
            this.emit('initialized', { silentMode: true });
        }
    }

    /**
     * Play musical response
     */
    async playMusicalResponse(musicalResponse) {
        if (!this.config.enableAudio) {
            return this.simulatePlayback(musicalResponse);
        }
        
        if (!this.audioState.isInitialized) {
            console.warn('⚠️ Audio not initialized, cannot play response');
            return null;
        }
        
        try {
            const playbackStart = Date.now();
            
            // Get character synth
            const character = musicalResponse.character;
            const synth = this.audioState.synths.get(character);
            
            if (!synth) {
                console.warn(`⚠️ No synth configured for character: ${character}`);
                return null;
            }
            
            // Extract musical elements
            const { melody, harmony, rhythm, tempo, dynamics } = musicalResponse.musical;
            const { spatialPosition, volume } = musicalResponse.playback;
            
            // Create playback session
            const playbackSession = {
                sessionId: uuidv4(),
                character,
                startTime: playbackStart,
                musicalResponse,
                activeNotes: new Map(),
                scheduledNotes: [],
                effects: []
            };
            
            // Schedule melody notes
            if (melody && melody.length > 0) {
                await this.scheduleMelodyNotes(synth, melody, playbackSession);
            }
            
            // Schedule harmony if present
            if (harmony && this.config.enableHarmony) {
                await this.scheduleHarmonyNotes(synth, harmony, playbackSession);
            }
            
            // Apply spatial positioning
            if (this.config.enableSpatialAudio && spatialPosition) {
                this.applySpatialPosition(synth, spatialPosition);
            }
            
            // Apply dynamic volume
            this.applyVolume(synth, volume * this.config.masterVolume);
            
            // Update visualization
            if (this.config.enableVisualization) {
                this.updateVisualization(playbackSession);
            }
            
            // Track performance
            this.updatePerformanceStats(playbackSession);
            
            // Emit playback event
            this.emit('playback_started', {
                sessionId: playbackSession.sessionId,
                character,
                noteCount: melody?.length || 0,
                duration: this.calculatePlaybackDuration(musicalResponse)
            });
            
            return playbackSession;
            
        } catch (error) {
            console.error('Error playing musical response:', error);
            this.emit('playback_error', { error: error.message, musicalResponse });
            return null;
        }
    }

    /**
     * Initialize audio context (mock implementation - would use Tone.js in real environment)
     */
    async initializeAudioContext() {
        // In a real implementation, this would initialize Tone.js
        console.log('🔊 Initializing audio context...');
        
        // Mock audio context initialization
        this.audioState.context = {
            state: 'running',
            sampleRate: this.config.sampleRate,
            destination: 'mock_destination'
        };
        
        // Simulate Tone.js initialization
        await this.simulateToneJSInit();
    }

    async simulateToneJSInit() {
        // Mock Tone.js initialization
        console.log('🎵 Initializing Tone.js (simulated)...');
        
        // In real implementation:
        // await Tone.start();
        // Tone.Transport.start();
        
        return true;
    }

    /**
     * Setup character synthesizers
     */
    async setupCharacterSynths() {
        console.log('🎹 Setting up character synthesizers...');
        
        for (const [character, synthConfig] of Object.entries(this.characterSynths)) {
            // In real implementation, would create actual Tone.js synths
            const synth = this.createMockSynth(synthConfig);
            this.audioState.synths.set(character, synth);
            
            console.log(`   ✅ ${character}: ${synthConfig.type}`);
        }
    }

    createMockSynth(synthConfig) {
        // Mock synth object - in real implementation would be actual Tone.js synth
        return {
            type: synthConfig.synthType,
            config: synthConfig,
            volume: { value: synthConfig.volume },
            detune: { value: synthConfig.detune },
            
            // Mock methods
            triggerAttackRelease: (note, duration, time, velocity) => {
                console.log(`🎵 Playing ${note} for ${duration}ms at velocity ${velocity}`);
                return { note, duration, time, velocity };
            },
            
            triggerAttack: (note, time, velocity) => {
                console.log(`🎵 Attack ${note} at velocity ${velocity}`);
                return { note, time, velocity };
            },
            
            triggerRelease: (note, time) => {
                console.log(`🎵 Release ${note}`);
                return { note, time };
            },
            
            dispose: () => {
                console.log('🎵 Synth disposed');
            }
        };
    }

    /**
     * Setup effects chains for each character
     */
    async setupEffectsChains() {
        console.log('🎛️ Setting up effects chains...');
        
        for (const [character, synthConfig] of Object.entries(this.characterSynths)) {
            const effectsChain = this.createEffectsChain(synthConfig.effects);
            this.audioState.effects.set(character, effectsChain);
        }
    }

    createEffectsChain(effectsList) {
        const effects = {};
        
        for (const effectType of effectsList) {
            switch (effectType) {
                case 'reverb':
                    effects.reverb = this.createReverbEffect();
                    break;
                case 'delay':
                    effects.delay = this.createDelayEffect();
                    break;
                case 'chorus':
                    effects.chorus = this.createChorusEffect();
                    break;
                case 'compressor':
                    effects.compressor = this.createCompressorEffect();
                    break;
                case 'distortion':
                    effects.distortion = this.createDistortionEffect();
                    break;
                case 'lowpass':
                    effects.lowpass = this.createLowpassEffect();
                    break;
                default:
                    console.warn(`Unknown effect type: ${effectType}`);
            }
        }
        
        return effects;
    }

    createReverbEffect() {
        return {
            type: 'reverb',
            roomSize: 0.4,
            decay: 2.0,
            wet: 0.3,
            apply: (signal) => `${signal}_with_reverb`
        };
    }

    createDelayEffect() {
        return {
            type: 'delay',
            delayTime: '8n',
            feedback: 0.3,
            wet: 0.2,
            apply: (signal) => `${signal}_with_delay`
        };
    }

    createChorusEffect() {
        return {
            type: 'chorus',
            frequency: 2,
            delayTime: 3.5,
            depth: 0.7,
            wet: 0.4,
            apply: (signal) => `${signal}_with_chorus`
        };
    }

    createCompressorEffect() {
        return {
            type: 'compressor',
            threshold: -24,
            ratio: 12,
            attack: 0.003,
            release: 0.1,
            apply: (signal) => `${signal}_compressed`
        };
    }

    createDistortionEffect() {
        return {
            type: 'distortion',
            distortion: 0.1,
            oversample: '2x',
            apply: (signal) => `${signal}_distorted`
        };
    }

    createLowpassEffect() {
        return {
            type: 'lowpass',
            frequency: 2000,
            rolloff: -12,
            apply: (signal) => `${signal}_filtered`
        };
    }

    /**
     * Setup spatial audio
     */
    async setupSpatialAudio() {
        console.log('🌍 Setting up spatial audio...');
        
        // Mock spatial audio setup
        this.audioState.spatialPanner = {
            type: '3d_panner',
            positionX: 0,
            positionY: 0,
            positionZ: 0,
            orientationX: 0,
            orientationY: 0,
            orientationZ: -1,
            
            setPosition: (x, y, z) => {
                console.log(`🌍 Spatial position: ${x}, ${y}, ${z}`);
            }
        };
    }

    /**
     * Setup master bus
     */
    async setupMasterBus() {
        console.log('🎛️ Setting up master bus...');
        
        this.audioState.masterBus = {
            volume: this.config.masterVolume,
            limiter: true,
            compressor: true,
            
            setVolume: (volume) => {
                this.audioState.masterBus.volume = volume;
                console.log(`🔊 Master volume: ${volume}`);
            }
        };
    }

    /**
     * Schedule melody notes for playback
     */
    async scheduleMelodyNotes(synth, melody, playbackSession) {
        const baseTime = Date.now();
        
        for (let i = 0; i < melody.length; i++) {
            const note = melody[i];
            const midiNote = this.convertToMidiNote(note.note, note.octave);
            const playTime = baseTime + note.timing;
            const velocity = note.velocity / 127; // Normalize to 0-1
            
            // Schedule note
            const scheduledNote = {
                noteId: uuidv4(),
                midiNote,
                note: note.note,
                octave: note.octave,
                velocity,
                duration: note.duration,
                playTime,
                character: playbackSession.character,
                type: 'melody'
            };
            
            playbackSession.scheduledNotes.push(scheduledNote);
            
            // Mock note triggering (in real implementation would schedule with Tone.js)
            setTimeout(() => {
                this.triggerNote(synth, scheduledNote);
            }, note.timing);
            
            // Update visualization
            if (this.config.enableVisualization) {
                this.addNoteToVisualization(scheduledNote);
            }
        }
    }

    /**
     * Schedule harmony notes
     */
    async scheduleHarmonyNotes(synth, harmony, playbackSession) {
        // Similar to melody scheduling but for chords
        for (const chord of harmony) {
            const chordNotes = this.expandChord(chord);
            
            for (const note of chordNotes) {
                const scheduledNote = {
                    noteId: uuidv4(),
                    ...note,
                    character: playbackSession.character,
                    type: 'harmony'
                };
                
                playbackSession.scheduledNotes.push(scheduledNote);
                
                setTimeout(() => {
                    this.triggerNote(synth, scheduledNote);
                }, chord.timing);
            }
        }
    }

    /**
     * Trigger individual note
     */
    triggerNote(synth, scheduledNote) {
        const noteString = `${scheduledNote.note}${scheduledNote.octave}`;
        
        // Add to active notes
        this.audioState.activeVoices.set(scheduledNote.noteId, {
            ...scheduledNote,
            startTime: Date.now()
        });
        
        // Trigger synth note (mock)
        const result = synth.triggerAttackRelease(
            noteString,
            scheduledNote.duration,
            0, // immediate
            scheduledNote.velocity
        );
        
        // Schedule note release
        setTimeout(() => {
            this.releaseNote(scheduledNote.noteId);
        }, scheduledNote.duration);
        
        // Update stats
        this.performanceStats.notesPlayed++;
        this.audioState.currentPolyphony++;
        
        this.emit('note_triggered', scheduledNote);
        
        return result;
    }

    /**
     * Release note
     */
    releaseNote(noteId) {
        const voice = this.audioState.activeVoices.get(noteId);
        if (voice) {
            this.audioState.activeVoices.delete(noteId);
            this.audioState.currentPolyphony--;
            
            this.emit('note_released', { noteId, duration: Date.now() - voice.startTime });
        }
    }

    /**
     * Apply spatial positioning
     */
    applySpatialPosition(synth, position) {
        if (this.audioState.spatialPanner && position) {
            this.audioState.spatialPanner.setPosition(
                position.x / 100, // Scale down coordinates
                position.y / 100,
                position.z / 100
            );
        }
    }

    /**
     * Apply volume to synth
     */
    applyVolume(synth, volume) {
        synth.volume.value = this.linearToDecibels(volume);
    }

    /**
     * Initialize visualization system
     */
    initializeVisualization() {
        console.log('📊 Initializing piano roll visualization...');
        
        // Setup visualization update loop
        if (this.config.visualizationUpdateRate > 0) {
            const updateInterval = 1000 / this.config.visualizationUpdateRate;
            
            setInterval(() => {
                this.updateVisualizationLoop();
            }, updateInterval);
        }
        
        this.pianoRollData.currentTimePosition = Date.now();
    }

    /**
     * Update visualization with new playback session
     */
    updateVisualization(playbackSession) {
        // Add session notes to visualization
        for (const note of playbackSession.scheduledNotes) {
            this.addNoteToVisualization(note);
        }
        
        this.emit('visualization_updated', {
            sessionId: playbackSession.sessionId,
            noteCount: playbackSession.scheduledNotes.length
        });
    }

    /**
     * Add note to piano roll visualization
     */
    addNoteToVisualization(note) {
        const visualNote = {
            id: note.noteId,
            midiNote: this.convertToMidiNote(note.note, note.octave),
            startTime: note.playTime,
            duration: note.duration,
            velocity: note.velocity,
            character: note.character,
            color: this.pianoRollData.noteColors[note.character] || '#888888',
            type: note.type || 'melody'
        };
        
        this.pianoRollData.activeNotes.set(note.noteId, visualNote);
        this.pianoRollData.noteHistory.push(visualNote);
        
        // Trim history to prevent memory issues
        if (this.pianoRollData.noteHistory.length > 1000) {
            this.pianoRollData.noteHistory.shift();
        }
    }

    /**
     * Update visualization loop
     */
    updateVisualizationLoop() {
        const currentTime = Date.now();
        this.pianoRollData.currentTimePosition = currentTime;
        
        // Remove finished notes from active display
        for (const [noteId, note] of this.pianoRollData.activeNotes.entries()) {
            if (currentTime > note.startTime + note.duration) {
                this.pianoRollData.activeNotes.delete(noteId);
            }
        }
        
        // Update time range if following playhead
        if (this.pianoRollData.followPlayhead) {
            const rangeSize = this.pianoRollData.timeRange.end - this.pianoRollData.timeRange.start;
            this.pianoRollData.timeRange.start = currentTime - rangeSize * 0.3;
            this.pianoRollData.timeRange.end = currentTime + rangeSize * 0.7;
        }
        
        this.emit('visualization_frame', {
            currentTime,
            activeNotes: Array.from(this.pianoRollData.activeNotes.values()),
            timeRange: this.pianoRollData.timeRange
        });
    }

    /**
     * Simulate playback when audio is disabled
     */
    simulatePlayback(musicalResponse) {
        console.log(`🎹 [SILENT] Playing response for ${musicalResponse.character}`);
        
        const simulation = {
            sessionId: uuidv4(),
            character: musicalResponse.character,
            noteCount: musicalResponse.musical.melody?.length || 0,
            duration: this.calculatePlaybackDuration(musicalResponse),
            silentMode: true
        };
        
        // Still update visualization in silent mode
        if (this.config.enableVisualization) {
            const mockPlaybackSession = {
                sessionId: simulation.sessionId,
                character: musicalResponse.character,
                scheduledNotes: this.createMockScheduledNotes(musicalResponse)
            };
            
            this.updateVisualization(mockPlaybackSession);
        }
        
        this.emit('silent_playback', simulation);
        return simulation;
    }

    createMockScheduledNotes(musicalResponse) {
        const notes = [];
        
        if (musicalResponse.musical.melody) {
            for (let i = 0; i < musicalResponse.musical.melody.length; i++) {
                const note = musicalResponse.musical.melody[i];
                notes.push({
                    noteId: uuidv4(),
                    note: note.note,
                    octave: note.octave,
                    velocity: note.velocity,
                    duration: note.duration,
                    playTime: Date.now() + note.timing,
                    character: musicalResponse.character,
                    type: 'melody'
                });
            }
        }
        
        return notes;
    }

    // Helper methods...

    convertToMidiNote(noteName, octave) {
        const noteMap = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
        return (octave + 1) * 12 + noteMap[noteName];
    }

    expandChord(chord) {
        // Simplified chord expansion - would be more complex in real implementation
        return [
            { note: 'C', octave: 4, velocity: 0.7, duration: chord.duration },
            { note: 'E', octave: 4, velocity: 0.6, duration: chord.duration },
            { note: 'G', octave: 4, velocity: 0.6, duration: chord.duration }
        ];
    }

    linearToDecibels(linear) {
        return linear > 0 ? 20 * Math.log10(linear) : -Infinity;
    }

    calculatePlaybackDuration(musicalResponse) {
        const melody = musicalResponse.musical.melody;
        if (!melody || melody.length === 0) return 1000;
        
        const lastNote = melody[melody.length - 1];
        return lastNote.timing + lastNote.duration;
    }

    updatePerformanceStats(playbackSession) {
        this.performanceStats.peakPolyphony = Math.max(
            this.performanceStats.peakPolyphony,
            this.audioState.currentPolyphony
        );
        
        this.performanceStats.memoryUsage = process.memoryUsage().heapUsed;
    }

    /**
     * Get current player status
     */
    getPlayerStatus() {
        return {
            isInitialized: this.audioState.isInitialized,
            isPlaying: this.audioState.isPlaying,
            audioEnabled: this.config.enableAudio,
            spatialAudioEnabled: this.config.enableSpatialAudio,
            
            // Audio state
            currentPolyphony: this.audioState.currentPolyphony,
            activeVoices: this.audioState.activeVoices.size,
            characterSynths: Array.from(this.audioState.synths.keys()),
            
            // Performance stats
            performanceStats: { ...this.performanceStats },
            
            // Visualization
            visualizationEnabled: this.config.enableVisualization,
            activeVisualNotes: this.pianoRollData.activeNotes.size,
            visualizationTimeRange: this.pianoRollData.timeRange,
            
            // Configuration
            masterVolume: this.config.masterVolume,
            maxPolyphony: this.config.maxPolyphony,
            pianoType: this.config.pianoType
        };
    }

    /**
     * Set master volume
     */
    setMasterVolume(volume) {
        this.config.masterVolume = Math.max(0, Math.min(1, volume));
        
        if (this.audioState.masterBus) {
            this.audioState.masterBus.setVolume(this.config.masterVolume);
        }
        
        this.emit('volume_changed', this.config.masterVolume);
    }

    /**
     * Get piano roll visualization data
     */
    getPianoRollData() {
        return {
            ...this.pianoRollData,
            activeNotes: Array.from(this.pianoRollData.activeNotes.values()),
            recentHistory: this.pianoRollData.noteHistory.slice(-100) // Last 100 notes
        };
    }

    /**
     * Stop all currently playing notes
     */
    stopAllNotes() {
        for (const [noteId] of this.audioState.activeVoices) {
            this.releaseNote(noteId);
        }
        
        this.audioState.currentPolyphony = 0;
        this.emit('all_notes_stopped');
    }

    /**
     * Stop piano player
     */
    async stop() {
        try {
            // Stop all playing notes
            this.stopAllNotes();
            
            // Dispose of synthesizers
            for (const [character, synth] of this.audioState.synths) {
                if (synth.dispose) {
                    synth.dispose();
                }
            }
            
            // Clear state
            this.audioState.synths.clear();
            this.audioState.effects.clear();
            this.audioState.activeVoices.clear();
            
            const finalStatus = this.getPlayerStatus();
            
            console.log('🎹 Piano Response Player stopped');
            this.emit('stopped', finalStatus);
            
            return finalStatus;
            
        } catch (error) {
            console.error('Error stopping piano player:', error);
            throw error;
        }
    }
}

module.exports = PianoResponsePlayer;

// CLI interface for testing
if (require.main === module) {
    const player = new PianoResponsePlayer({
        enableAudio: false, // Silent mode for testing
        enableVisualization: true
    });
    
    async function demo() {
        try {
            await player.initialize();
            
            // Create test musical response
            const testResponse = {
                responseId: uuidv4(),
                character: 'wizard',
                musical: {
                    key: 'C',
                    scale: 'major',
                    tempo: 80,
                    dynamics: 70,
                    melody: [
                        { note: 'C', octave: 4, velocity: 80, duration: 500, timing: 0 },
                        { note: 'E', octave: 4, velocity: 85, duration: 500, timing: 600 },
                        { note: 'G', octave: 4, velocity: 90, duration: 750, timing: 1200 },
                        { note: 'C', octave: 5, velocity: 95, duration: 1000, timing: 2000 }
                    ]
                },
                playback: {
                    spatialPosition: { x: 100, y: 200, z: 0 },
                    volume: 0.8
                }
            };
            
            console.log('🎵 Testing musical response playback...');
            
            const session = await player.playMusicalResponse(testResponse);
            
            if (session) {
                console.log(`✅ Playback session: ${session.sessionId || 'silent'}`);
                console.log(`🎼 Character: ${testResponse.character}`);
                console.log(`🎹 Notes: ${testResponse.musical.melody.length}`);
            }
            
            // Wait a bit then show status
            setTimeout(() => {
                console.log('\n📊 Player Status:');
                console.log(JSON.stringify(player.getPlayerStatus(), null, 2));
                
                console.log('\n🎵 Piano Roll Data:');
                const pianoRoll = player.getPianoRollData();
                console.log(`Active notes: ${pianoRoll.activeNotes.length}`);
                console.log(`History: ${pianoRoll.recentHistory.length} notes`);
            }, 1000);
            
        } catch (error) {
            console.error('Demo error:', error);
        }
    }
    
    demo();
}

console.log('🎹 Piano Response Player ready');