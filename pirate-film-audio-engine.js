#!/usr/bin/env node

/**
 * 🎵🏴‍☠️ Pirate Film Audio-Visual Symphony Engine
 * 
 * Creates immersive spatial audio experience with:
 * - 3D positioned sound sources for ships and characters
 * - Dynamic soundtrack generation based on narrative
 * - Binaural beats for enhanced immersion
 * - Real-time frequency analysis and visualization
 * - Synchronized audio-visual effects
 * 
 * Philosophy: "Every wave has its frequency, every story its rhythm"
 */

const { EventEmitter } = require('events');

class PirateFilmAudioEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Audio settings
            sampleRate: config.sampleRate || 44100,
            bufferSize: config.bufferSize || 4096,
            spatialRange: config.spatialRange || 100,
            masterVolume: config.masterVolume || 0.8,
            
            // Binaural settings
            binauralEnabled: config.binauralEnabled || true,
            baseFrequency: config.baseFrequency || 440,
            binauralBeatFreq: config.binauralBeatFreq || 10, // Alpha waves
            
            // Soundtrack settings
            dynamicSoundtrack: config.dynamicSoundtrack || true,
            adaptiveMusic: config.adaptiveMusic || true,
            
            ...config
        };
        
        // Audio context and nodes
        this.audioContext = null;
        this.masterGain = null;
        this.analyser = null;
        this.frequencyData = null;
        
        // Spatial audio system
        this.listener = null;
        this.audioSources = new Map();
        this.spatialNodes = new Map();
        
        // Binaural beat system
        this.binauralNodes = new Map();
        this.binauralActive = false;
        
        // Dynamic soundtrack
        this.soundtrack = {
            currentTheme: 'ocean_calm',
            intensity: 0.5,
            progression: 0,
            adaptiveElements: new Map()
        };
        
        // Character voice synthesis
        this.voiceSynthesis = new Map();
        
        // Performance monitoring
        this.performanceStats = {
            activeSources: 0,
            cpuUsage: 0,
            latency: 0,
            sampleTime: Date.now()
        };
        
        console.log('🎵 Pirate Film Audio Engine initializing...');
        this.init();
    }
    
    async init() {
        try {
            console.log('🔧 Setting up audio context...');
            await this.setupAudioContext();
            
            console.log('🌊 Creating spatial audio system...');
            this.setupSpatialAudio();
            
            console.log('🧠 Initializing binaural beat system...');
            this.setupBinauralBeats();
            
            console.log('🎼 Creating dynamic soundtrack...');
            this.setupDynamicSoundtrack();
            
            console.log('🎭 Setting up character voices...');
            this.setupVoiceSynthesis();
            
            console.log('📊 Starting performance monitoring...');
            this.startPerformanceMonitoring();
            
            this.emit('ready');
            console.log('✅ Pirate Film Audio Engine ready!');
            
        } catch (error) {
            console.error('❌ Audio engine initialization failed:', error);
            this.emit('error', error);
        }
    }
    
    async setupAudioContext() {
        // Create audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: this.config.sampleRate,
            latencyHint: 'interactive'
        });
        
        // Resume context if suspended (required by browser policies)
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        // Create master gain node
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = this.config.masterVolume;
        this.masterGain.connect(this.audioContext.destination);
        
        // Create analyser for frequency visualization
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;
        this.masterGain.connect(this.analyser);
        
        this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        
        console.log(`🎵 Audio context initialized: ${this.audioContext.sampleRate}Hz, ${this.audioContext.state}`);
    }
    
    setupSpatialAudio() {
        // Create 3D audio listener
        if (this.audioContext.listener) {
            this.listener = this.audioContext.listener;
            
            // Set listener orientation (facing forward)
            if (this.listener.forwardX) {
                this.listener.forwardX.value = 0;
                this.listener.forwardY.value = 0;
                this.listener.forwardZ.value = -1;
                this.listener.upX.value = 0;
                this.listener.upY.value = 1;
                this.listener.upZ.value = 0;
            }
        }
        
        // Create spatial audio zones
        this.createSpatialZones();
        
        console.log('🌊 Spatial audio system ready');
    }
    
    createSpatialZones() {
        // Define audio zones for different areas of the pirate world
        const zones = {
            'cal_ship': {
                position: { x: 0, y: 2, z: 0 },
                radius: 20,
                ambience: 'ai_consciousness',
                reverb: 0.3
            },
            'ocean_center': {
                position: { x: 0, y: 0, z: 0 },
                radius: 50,
                ambience: 'ocean_waves',
                reverb: 0.8
            },
            'distant_ships': {
                position: { x: 40, y: 2, z: 30 },
                radius: 15,
                ambience: 'pirate_activity',
                reverb: 0.5
            },
            'convergence_point': {
                position: { x: 0, y: 10, z: -20 },
                radius: 30,
                ambience: 'mystical_energy',
                reverb: 1.2
            }
        };
        
        Object.entries(zones).forEach(([zoneId, zone]) => {
            this.createAudioZone(zoneId, zone);
        });
    }
    
    createAudioZone(zoneId, config) {
        // Create convolver for reverb
        const convolver = this.audioContext.createConvolver();
        convolver.buffer = this.createReverbBuffer(config.reverb);
        
        // Create gain node for zone volume
        const zoneGain = this.audioContext.createGain();
        zoneGain.gain.value = 0.8;
        
        // Connect: source -> gain -> convolver -> master
        zoneGain.connect(convolver);
        convolver.connect(this.masterGain);
        
        // Store zone configuration
        this.spatialNodes.set(zoneId, {
            gain: zoneGain,
            convolver: convolver,
            config: config,
            activeSources: new Set()
        });
        
        // Create ambient sound for zone
        this.createZoneAmbience(zoneId, config);
    }
    
    createReverbBuffer(reverbTime) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * reverbTime;
        const buffer = this.audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }
        
        return buffer;
    }
    
    async createZoneAmbience(zoneId, config) {
        const zone = this.spatialNodes.get(zoneId);
        if (!zone) return;
        
        // Create different ambient sounds based on zone type
        let ambientSound;
        
        switch (config.ambience) {
            case 'ocean_waves':
                ambientSound = await this.createOceanAmbience();
                break;
            case 'ai_consciousness':
                ambientSound = this.createAIAmbience();
                break;
            case 'pirate_activity':
                ambientSound = this.createPirateAmbience();
                break;
            case 'mystical_energy':
                ambientSound = this.createMysticalAmbience();
                break;
            default:
                ambientSound = this.createGenericAmbience();
        }
        
        if (ambientSound) {
            ambientSound.connect(zone.gain);
            zone.ambientSource = ambientSound;
        }
    }
    
    async createOceanAmbience() {
        // Create ocean wave sound using white noise and filtering
        const bufferSize = this.audioContext.sampleRate * 10; // 10 seconds
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate ocean-like noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        // Apply low-pass filter for ocean sound
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;
        filter.Q.value = 0.5;
        
        source.connect(filter);
        source.start();
        
        return filter;
    }
    
    createAIAmbience() {
        // Create AI consciousness sound using oscillators
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.1;
        
        // Create harmonic series for AI consciousness
        const frequencies = [110, 220, 330, 440]; // Harmonic series
        
        frequencies.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = 'sine';
            oscillator.frequency.value = freq;
            
            const oscGain = this.audioContext.createGain();
            oscGain.gain.value = 0.1 / (index + 1); // Decreasing volume for harmonics
            
            // Add slow modulation
            const lfo = this.audioContext.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.1 + index * 0.05;
            
            const lfoGain = this.audioContext.createGain();
            lfoGain.gain.value = 10;
            
            lfo.connect(lfoGain);
            lfoGain.connect(oscillator.frequency);
            
            oscillator.connect(oscGain);
            oscGain.connect(gain);
            
            oscillator.start();
            lfo.start();
        });
        
        return gain;
    }
    
    createPirateAmbience() {
        // Create pirate ship ambience with creaking and activity
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.2;
        
        // Random creaking sounds
        setInterval(() => {
            if (Math.random() < 0.3) { // 30% chance every interval
                this.createCreakSound(gain);
            }
        }, 2000);
        
        return gain;
    }
    
    createCreakSound(destination) {
        // Create wooden creaking sound
        const duration = 0.5 + Math.random() * 1.0;
        const source = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        source.type = 'sawtooth';
        source.frequency.value = 80 + Math.random() * 40;
        
        filter.type = 'lowpass';
        filter.frequency.value = 200 + Math.random() * 100;
        
        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(destination);
        
        source.start();
        source.stop(this.audioContext.currentTime + duration);
    }
    
    createMysticalAmbience() {
        // Create mystical convergence ambience
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.15;
        
        // Ethereal pad sound
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = 55; // Low fundamental
        
        // Add chorus effect
        const delay1 = this.audioContext.createDelay();
        const delay2 = this.audioContext.createDelay();
        delay1.delayTime.value = 0.02;
        delay2.delayTime.value = 0.03;
        
        const feedback = this.audioContext.createGain();
        feedback.gain.value = 0.3;
        
        oscillator.connect(delay1);
        oscillator.connect(delay2);
        delay1.connect(feedback);
        delay2.connect(feedback);
        feedback.connect(gain);
        
        oscillator.start();
        
        return gain;
    }
    
    createGenericAmbience() {
        // Default ambient sound
        const gain = this.audioContext.createGain();
        gain.gain.value = 0.1;
        
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = 110;
        
        oscillator.connect(gain);
        oscillator.start();
        
        return gain;
    }
    
    setupBinauralBeats() {
        // Create binaural beat generators for different brain states
        const brainwaveStates = {
            'alpha': { freq: 10, description: 'Relaxed focus for learning' },
            'theta': { freq: 6, description: 'Deep creativity and insight' },
            'beta': { freq: 20, description: 'Active problem solving' },
            'gamma': { freq: 40, description: 'Enhanced perception' }
        };
        
        Object.entries(brainwaveStates).forEach(([state, config]) => {
            this.createBinauralBeat(state, config.freq);
        });
        
        console.log('🧠 Binaural beat system ready');
    }
    
    createBinauralBeat(state, beatFreq) {
        const baseFreq = this.config.baseFrequency;
        
        // Left ear - base frequency
        const leftOsc = this.audioContext.createOscillator();
        leftOsc.type = 'sine';
        leftOsc.frequency.value = baseFreq;
        
        const leftGain = this.audioContext.createGain();
        leftGain.gain.value = 0.0; // Start silent
        
        const leftMerger = this.audioContext.createChannelMerger(2);
        
        leftOsc.connect(leftGain);
        leftGain.connect(leftMerger, 0, 0); // Connect to left channel
        
        // Right ear - base frequency + beat frequency
        const rightOsc = this.audioContext.createOscillator();
        rightOsc.type = 'sine';
        rightOsc.frequency.value = baseFreq + beatFreq;
        
        const rightGain = this.audioContext.createGain();
        rightGain.gain.value = 0.0; // Start silent
        
        rightGain.connect(leftMerger, 0, 1); // Connect to right channel
        rightOsc.connect(rightGain);
        
        // Connect to master output
        leftMerger.connect(this.masterGain);
        
        // Start oscillators
        leftOsc.start();
        rightOsc.start();
        
        // Store for later control
        this.binauralNodes.set(state, {
            leftOsc,
            rightOsc,
            leftGain,
            rightGain,
            frequency: beatFreq,
            active: false
        });
    }
    
    setupDynamicSoundtrack() {
        // Create musical themes for different narrative moments
        this.soundtrack.themes = {
            'ocean_calm': {
                key: 'Am',
                tempo: 60,
                mood: 'peaceful',
                instruments: ['pad', 'strings']
            },
            'storm_chaos': {
                key: 'Dm',
                tempo: 140,
                mood: 'intense',
                instruments: ['percussion', 'brass', 'strings']
            },
            'discovery': {
                key: 'C',
                tempo: 80,
                mood: 'mysterious',
                instruments: ['piano', 'strings', 'choir']
            },
            'convergence': {
                key: 'E',
                tempo: 100,
                mood: 'triumphant',
                instruments: ['full_orchestra']
            },
            'wisdom': {
                key: 'F',
                tempo: 70,
                mood: 'enlightening',
                instruments: ['harp', 'flute', 'strings']
            }
        };
        
        // Initialize adaptive music engine
        this.createAdaptiveMusicEngine();
        
        console.log('🎼 Dynamic soundtrack system ready');
    }
    
    createAdaptiveMusicEngine() {
        // Create musical scales for procedural composition
        this.musicalScales = {
            'Am': [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392.00], // A minor
            'Dm': [293.66, 329.63, 349.23, 392.00, 440.00, 466.16, 523.25], // D minor
            'C': [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88], // C major
            'E': [329.63, 369.99, 415.30, 440.00, 493.88, 554.37, 622.25], // E major
            'F': [349.23, 392.00, 440.00, 466.16, 523.25, 587.33, 659.25]  // F major
        };
        
        // Create musical pattern generators
        this.patternGenerators = new Map();
        
        // Start with calm ocean theme
        this.transitionToTheme('ocean_calm');
    }
    
    setupVoiceSynthesis() {
        // Create voice profiles for different characters
        const characterVoices = {
            'cal': {
                pitch: 1.2,
                rate: 0.9,
                volume: 0.8,
                voice: null, // Will be set to best available voice
                spatialPosition: { x: 0, y: 8, z: 0 }
            },
            'logistics_lucy': {
                pitch: 1.4,
                rate: 1.1,
                volume: 0.7,
                voice: null,
                spatialPosition: { x: 40, y: 6, z: 30 }
            },
            'climate_carl': {
                pitch: 0.8,
                rate: 0.8,
                volume: 0.7,
                voice: null,
                spatialPosition: { x: -35, y: 6, z: 25 }
            },
            'narrator': {
                pitch: 1.0,
                rate: 0.85,
                volume: 0.9,
                voice: null,
                spatialPosition: { x: 0, y: 15, z: 10 }
            }
        };
        
        // Get available voices
        if ('speechSynthesis' in window) {
            const voices = speechSynthesis.getVoices();
            
            Object.entries(characterVoices).forEach(([character, config]) => {
                // Try to find a suitable voice
                const voice = voices.find(v => v.lang.startsWith('en')) || voices[0];
                config.voice = voice;
                this.voiceSynthesis.set(character, config);
            });
            
            console.log(`🎭 Voice synthesis ready with ${voices.length} voices`);
        } else {
            console.warn('⚠️ Speech synthesis not available');
        }
    }
    
    startPerformanceMonitoring() {
        setInterval(() => {
            this.updatePerformanceStats();
        }, 1000);
    }
    
    updatePerformanceStats() {
        this.performanceStats.activeSources = this.audioSources.size;
        this.performanceStats.cpuUsage = this.audioContext.baseLatency || 0;
        this.performanceStats.latency = this.audioContext.outputLatency || 0;
        
        // Emit performance data
        this.emit('performance', this.performanceStats);
    }
    
    // Public API methods
    
    /**
     * Create a positioned audio source
     */
    createSpatialSource(id, config) {
        const source = this.audioContext.createBufferSource();
        const panner = this.audioContext.createPanner();
        const gain = this.audioContext.createGain();
        
        // Configure panner
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = config.refDistance || 1;
        panner.maxDistance = config.maxDistance || 100;
        panner.rolloffFactor = config.rolloffFactor || 1;
        
        // Set position
        panner.positionX.value = config.position.x;
        panner.positionY.value = config.position.y;
        panner.positionZ.value = config.position.z;
        
        // Set volume
        gain.gain.value = config.volume || 0.5;
        
        // Connect: source -> panner -> gain -> master
        source.connect(panner);
        panner.connect(gain);
        gain.connect(this.masterGain);
        
        // Store reference
        this.audioSources.set(id, {
            source,
            panner,
            gain,
            config
        });
        
        return { source, panner, gain };
    }
    
    /**
     * Update listener position (camera position)
     */
    updateListenerPosition(position, orientation) {
        if (!this.listener) return;
        
        // Update position
        if (this.listener.positionX) {
            this.listener.positionX.value = position.x;
            this.listener.positionY.value = position.y;
            this.listener.positionZ.value = position.z;
        }
        
        // Update orientation if provided
        if (orientation && this.listener.forwardX) {
            this.listener.forwardX.value = orientation.forward.x;
            this.listener.forwardY.value = orientation.forward.y;
            this.listener.forwardZ.value = orientation.forward.z;
            this.listener.upX.value = orientation.up.x;
            this.listener.upY.value = orientation.up.y;
            this.listener.upZ.value = orientation.up.z;
        }
    }
    
    /**
     * Activate binaural beats for enhanced focus
     */
    activateBinauralBeats(state = 'alpha', volume = 0.1) {
        // Deactivate current binaural beats
        this.deactivateBinauralBeats();
        
        const binauralBeat = this.binauralNodes.get(state);
        if (!binauralBeat) {
            console.warn(`Unknown binaural state: ${state}`);
            return;
        }
        
        // Fade in binaural beats
        binauralBeat.leftGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        binauralBeat.rightGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        binauralBeat.leftGain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 2);
        binauralBeat.rightGain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 2);
        
        binauralBeat.active = true;
        this.binauralActive = true;
        
        console.log(`🧠 Activated ${state} binaural beats (${binauralBeat.frequency}Hz)`);
        this.emit('binaural_activated', { state, frequency: binauralBeat.frequency });
    }
    
    /**
     * Deactivate binaural beats
     */
    deactivateBinauralBeats() {
        this.binauralNodes.forEach((beat, state) => {
            if (beat.active) {
                beat.leftGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1);
                beat.rightGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1);
                beat.active = false;
            }
        });
        
        this.binauralActive = false;
        this.emit('binaural_deactivated');
    }
    
    /**
     * Transition to new musical theme
     */
    transitionToTheme(themeName, duration = 3.0) {
        const theme = this.soundtrack.themes[themeName];
        if (!theme) {
            console.warn(`Unknown theme: ${themeName}`);
            return;
        }
        
        console.log(`🎼 Transitioning to theme: ${themeName} (${theme.mood})`);
        
        // Stop current theme
        this.stopCurrentTheme();
        
        // Start new theme
        setTimeout(() => {
            this.startTheme(themeName);
            this.soundtrack.currentTheme = themeName;
        }, duration * 500); // Halfway through transition
        
        this.emit('theme_change', { theme: themeName, mood: theme.mood });
    }
    
    startTheme(themeName) {
        const theme = this.soundtrack.themes[themeName];
        const scale = this.musicalScales[theme.key];
        
        // Create procedural music based on theme
        if (theme.instruments.includes('pad')) {
            this.createPadSound(scale, theme);
        }
        
        if (theme.instruments.includes('strings')) {
            this.createStringSection(scale, theme);
        }
        
        if (theme.instruments.includes('percussion')) {
            this.createPercussion(theme);
        }
    }
    
    createPadSound(scale, theme) {
        const padGain = this.audioContext.createGain();
        padGain.gain.value = 0.2;
        
        // Create chord progression
        const chordProgression = [0, 3, 5, 1]; // i - IV - vi - ii
        let chordIndex = 0;
        
        const playChord = () => {
            const chordRoot = scale[chordProgression[chordIndex]];
            
            // Play triad
            [0, 2, 4].forEach((interval, i) => {
                const freq = chordRoot * Math.pow(2, interval / 7);
                this.createToneWithEnvelope(freq, 4.0, padGain, 'sine');
            });
            
            chordIndex = (chordIndex + 1) % chordProgression.length;
            
            // Schedule next chord
            const nextChordTime = (60 / theme.tempo) * 4 * 1000; // 4 beats per chord
            setTimeout(playChord, nextChordTime);
        };
        
        padGain.connect(this.masterGain);
        playChord();
        
        // Store for cleanup
        this.soundtrack.adaptiveElements.set('pad', padGain);
    }
    
    createToneWithEnvelope(frequency, duration, destination, waveform = 'sine') {
        const oscillator = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        oscillator.type = waveform;
        oscillator.frequency.value = frequency;
        
        // ADSR envelope
        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.1); // Attack
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.3); // Decay
        gain.gain.setValueAtTime(0.2, now + duration - 0.5); // Sustain
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration); // Release
        
        oscillator.connect(gain);
        gain.connect(destination);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
    
    stopCurrentTheme() {
        // Fade out and disconnect current adaptive elements
        this.soundtrack.adaptiveElements.forEach((element, name) => {
            if (element.gain) {
                element.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1);
                setTimeout(() => {
                    element.disconnect();
                }, 1000);
            }
        });
        
        this.soundtrack.adaptiveElements.clear();
    }
    
    /**
     * Speak dialogue with character voice and spatial positioning
     */
    speakDialogue(character, text, config = {}) {
        const voiceConfig = this.voiceSynthesis.get(character);
        if (!voiceConfig) {
            console.warn(`Unknown character voice: ${character}`);
            return;
        }
        
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = voiceConfig.voice;
            utterance.pitch = voiceConfig.pitch;
            utterance.rate = voiceConfig.rate;
            utterance.volume = voiceConfig.volume;
            
            // Emit event for visual synchronization
            utterance.onstart = () => {
                this.emit('dialogue_start', { character, text });
            };
            
            utterance.onend = () => {
                this.emit('dialogue_end', { character, text });
            };
            
            speechSynthesis.speak(utterance);
            
            console.log(`🎭 ${character} speaking: "${text.substring(0, 50)}..."`);
        }
    }
    
    /**
     * Get current frequency analysis data
     */
    getFrequencyData() {
        if (this.analyser && this.frequencyData) {
            this.analyser.getByteFrequencyData(this.frequencyData);
            return this.frequencyData;
        }
        return null;
    }
    
    /**
     * Clean up resources
     */
    destroy() {
        console.log('🔄 Cleaning up audio engine...');
        
        // Stop all audio sources
        this.audioSources.forEach((source) => {
            if (source.source.stop) {
                source.source.stop();
            }
        });
        
        // Clear maps
        this.audioSources.clear();
        this.spatialNodes.clear();
        this.binauralNodes.clear();
        this.voiceSynthesis.clear();
        
        // Close audio context
        if (this.audioContext && this.audioContext.close) {
            this.audioContext.close();
        }
        
        console.log('✅ Audio engine cleaned up');
    }
}

// Export for use in browsers and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PirateFilmAudioEngine;
} else if (typeof window !== 'undefined') {
    window.PirateFilmAudioEngine = PirateFilmAudioEngine;
}

// Usage example and testing
if (require.main === module) {
    console.log('🎵 Pirate Film Audio Engine - Standalone Test');
    console.log('=' .repeat(60));
    
    // This would run in a browser environment for testing
    console.log('Note: This engine requires a browser environment with Web Audio API');
    console.log('Features:');
    console.log('🌊 Spatial 3D audio with HRTF processing');
    console.log('🧠 Binaural beats for enhanced immersion');
    console.log('🎼 Dynamic adaptive soundtrack generation');
    console.log('🎭 Character voice synthesis with spatial positioning');
    console.log('📊 Real-time frequency analysis and visualization');
    console.log('✨ Atmospheric effects and ambient soundscapes');
}