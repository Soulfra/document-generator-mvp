#!/usr/bin/env node

/**
 * 🎹 Universal Band Interface - OP-1 Style Platform Orchestra
 * 
 * Transforms chatrooms into band members and messages into music.
 * Each platform becomes an instrument, every conversation becomes a song.
 * 
 * Like the OP-1 synthesizer:
 * - 4 tracks (Discord, Slack, Twitter, Reddit)
 * - Real-time sampling from chat platforms
 * - Visual waveforms of conversations
 * - Searchable musical URLs (mmm://platform/channel/date/song)
 * 
 * "Chatrooms as Instruments, Messages as Music"
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

class UniversalBandInterface extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // OP-1 style configuration
            tracks: config.tracks || 4,
            tapeLengthMinutes: config.tapeLengthMinutes || 6,
            bpm: config.bpm || 120,
            swing: config.swing || 0,
            
            // Platform configuration
            platforms: config.platforms || ['discord', 'slack', 'twitter', 'reddit'],
            maxBandMembers: config.maxBandMembers || 16,
            
            // Musical settings
            defaultKey: config.defaultKey || 'C',
            defaultScale: config.defaultScale || 'major',
            quantization: config.quantization || '16th',
            
            // Visual settings
            waveformResolution: config.waveformResolution || 512,
            colorScheme: config.colorScheme || 'op1_classic',
            
            ...config
        };
        
        // OP-1 style state
        this.op1State = {
            // Current mode (like OP-1 modes)
            mode: 'perform', // perform, pattern, mixer, effects
            currentTrack: 1,
            
            // Tape state
            tapePosition: 0,
            isRecording: false,
            isPlaying: false,
            
            // Musical state
            currentKey: this.config.defaultKey,
            currentScale: this.config.defaultScale,
            currentBPM: this.config.bpm,
            
            // Effects
            effects: {
                filter: { cutoff: 0.5, resonance: 0.3 },
                delay: { time: 0.25, feedback: 0.4, mix: 0.2 },
                reverb: { size: 0.3, damping: 0.5, mix: 0.1 },
                drive: { amount: 0.0 }
            }
        };
        
        // Band members (chatroom instruments)
        this.bandMembers = new Map();
        
        // Tracks (like OP-1's 4 tracks)
        this.tracks = {
            1: { platform: 'discord', channel: null, instrument: 'drum', muted: false, solo: false },
            2: { platform: 'slack', channel: null, instrument: 'bass', muted: false, solo: false },
            3: { platform: 'twitter', channel: null, instrument: 'lead', muted: false, solo: false },
            4: { platform: 'reddit', channel: null, instrument: 'chord', muted: false, solo: false }
        };
        
        // Pattern sequencer (16 steps)
        this.pattern = {
            length: 16,
            steps: Array(4).fill(null).map(() => Array(16).fill(null))
        };
        
        // Tape recorder (conversation history)
        this.tape = {
            buffer: [],
            maxLength: this.config.tapeLengthMinutes * 60 * 1000, // ms
            markers: new Map()
        };
        
        // Key mappings (like OP-1 keyboard)
        this.keyMap = this.initializeKeyMap();
        
        // Platform connections
        this.platformConnections = new Map();
        
        // Musical translation engine
        this.translator = new ChatroomMusicTranslator(this);
        
        // Search index for musical URLs
        this.musicalIndex = new Map();
        
        this.initialized = false;
    }
    
    /**
     * Initialize the Universal Band Interface
     */
    async initialize() {
        console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                  🎹 UNIVERSAL BAND INTERFACE 🎹                ║
║                      OP-1 Style Orchestra                      ║
║                                                               ║
║   Track 1: Discord  🥁  |  Track 2: Slack     🎸             ║
║   Track 3: Twitter  🎺  |  Track 4: Reddit    🎹             ║
║                                                               ║
║         "Chatrooms as Instruments, Messages as Music"         ║
╚═══════════════════════════════════════════════════════════════╝
        `);
        
        try {
            // Initialize musical components
            await this.initializeMusicalEngine();
            
            // Set up platform connections
            await this.connectPlatforms();
            
            // Initialize pattern sequencer
            this.initializeSequencer();
            
            // Start the tape
            this.startTapeRecorder();
            
            // Load saved patterns
            await this.loadSavedPatterns();
            
            this.initialized = true;
            
            console.log('🎵 Band Interface initialized!');
            console.log(`📻 BPM: ${this.op1State.currentBPM} | Key: ${this.op1State.currentKey} ${this.op1State.currentScale}`);
            
            this.emit('interface_ready', {
                tracks: this.tracks,
                bpm: this.op1State.currentBPM,
                key: this.op1State.currentKey
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize band interface:', error.message);
            throw error;
        }
    }
    
    /**
     * Connect a chatroom as a band member
     */
    async addBandMember(platform, channel, options = {}) {
        const memberId = `${platform}:${channel}`;
        
        console.log(`🎸 Adding band member: ${memberId}`);
        
        try {
            const bandMember = {
                id: memberId,
                platform,
                channel,
                
                // Musical properties
                instrument: options.instrument || this.assignInstrument(platform),
                volume: options.volume || 0.7,
                pan: options.pan || 0,
                
                // Chat properties
                messageBuffer: [],
                userActivity: new Map(),
                lastActivity: Date.now(),
                
                // Musical translation
                noteMapping: this.generateNoteMapping(channel),
                rhythmPattern: this.generateRhythmPattern(platform),
                
                // Performance state
                isActive: true,
                isSoloing: false,
                currentNotes: []
            };
            
            this.bandMembers.set(memberId, bandMember);
            
            // Connect to platform
            await this.connectToPlatform(platform, channel);
            
            // Assign to track if available
            const availableTrack = this.findAvailableTrack();
            if (availableTrack) {
                this.tracks[availableTrack].channel = channel;
                this.tracks[availableTrack].platform = platform;
            }
            
            console.log(`✅ Band member added: ${memberId} playing ${bandMember.instrument}`);
            
            this.emit('band_member_added', bandMember);
            
            return bandMember;
            
        } catch (error) {
            console.error(`❌ Failed to add band member ${memberId}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Process incoming chat message as music
     */
    async processMessage(platform, channel, message) {
        const memberId = `${platform}:${channel}`;
        const bandMember = this.bandMembers.get(memberId);
        
        if (!bandMember) return;
        
        try {
            // Translate message to musical events
            const musicalEvents = await this.translator.translateMessage(message, bandMember);
            
            // Add to pattern if recording
            if (this.op1State.isRecording) {
                this.recordToPattern(musicalEvents, this.getCurrentTrack(platform));
            }
            
            // Play the notes
            if (this.op1State.isPlaying || this.op1State.isRecording) {
                await this.playMusicalEvents(musicalEvents, bandMember);
            }
            
            // Record to tape
            this.recordToTape({
                timestamp: Date.now(),
                platform,
                channel,
                message,
                musicalEvents
            });
            
            // Update waveform display
            this.updateWaveform(memberId, musicalEvents);
            
            // Index for search
            await this.indexMusicalContent(message, musicalEvents);
            
            this.emit('message_processed', {
                platform,
                channel,
                message,
                musicalEvents
            });
            
        } catch (error) {
            console.error('❌ Error processing message:', error.message);
        }
    }
    
    /**
     * OP-1 style controls
     */
    
    // Mode switching (like OP-1 modes)
    switchMode(mode) {
        const validModes = ['perform', 'pattern', 'mixer', 'effects'];
        if (!validModes.includes(mode)) return;
        
        this.op1State.mode = mode;
        console.log(`🎛️ Switched to ${mode} mode`);
        
        this.emit('mode_changed', mode);
    }
    
    // Track selection
    selectTrack(trackNumber) {
        if (trackNumber >= 1 && trackNumber <= 4) {
            this.op1State.currentTrack = trackNumber;
            console.log(`🎚️ Selected track ${trackNumber}: ${this.tracks[trackNumber].platform}`);
            
            this.emit('track_selected', trackNumber);
        }
    }
    
    // Transport controls
    play() {
        this.op1State.isPlaying = true;
        console.log('▶️ Playback started');
        this.emit('playback_started');
    }
    
    stop() {
        this.op1State.isPlaying = false;
        this.op1State.isRecording = false;
        console.log('⏹️ Playback stopped');
        this.emit('playback_stopped');
    }
    
    record() {
        this.op1State.isRecording = true;
        this.op1State.isPlaying = true;
        console.log('⏺️ Recording started');
        this.emit('recording_started');
    }
    
    // Encoder controls (like OP-1's colored encoders)
    turnEncoder(color, value) {
        switch (color) {
            case 'blue': // Message scroll
                this.scrollMessages(value);
                break;
            case 'green': // Channel select
                this.changeChannel(value);
                break;
            case 'white': // Tempo
                this.adjustTempo(value);
                break;
            case 'orange': // Filter/effects
                this.adjustFilter(value);
                break;
        }
    }
    
    // Pattern operations
    clearPattern() {
        this.pattern.steps = Array(4).fill(null).map(() => Array(16).fill(null));
        console.log('🗑️ Pattern cleared');
    }
    
    copyPattern() {
        this.patternClipboard = JSON.parse(JSON.stringify(this.pattern));
        console.log('📋 Pattern copied');
    }
    
    pastePattern() {
        if (this.patternClipboard) {
            this.pattern = JSON.parse(JSON.stringify(this.patternClipboard));
            console.log('📋 Pattern pasted');
        }
    }
    
    /**
     * Generate searchable musical URL
     */
    generateMusicalURL(platform, channel, timestamp) {
        const date = new Date(timestamp);
        const musicalKey = this.op1State.currentKey.toLowerCase();
        const tempo = this.op1State.currentBPM;
        
        // Format: mmm://platform/channel/date/key-tempo-mood
        const mood = this.detectMood();
        const slug = `${musicalKey}-${tempo}bpm-${mood}`;
        
        return `mmm://${platform}/${channel}/${date.toISOString().split('T')[0]}/${slug}`;
    }
    
    /**
     * Search for musical patterns
     */
    async searchMusicalPatterns(query) {
        const results = [];
        
        // Search by musical properties
        if (query.key) {
            for (const [url, data] of this.musicalIndex) {
                if (data.key === query.key) {
                    results.push({ url, ...data });
                }
            }
        }
        
        // Search by tempo range
        if (query.minTempo && query.maxTempo) {
            for (const [url, data] of this.musicalIndex) {
                if (data.tempo >= query.minTempo && data.tempo <= query.maxTempo) {
                    results.push({ url, ...data });
                }
            }
        }
        
        // Search by platform
        if (query.platform) {
            for (const [url, data] of this.musicalIndex) {
                if (url.includes(query.platform)) {
                    results.push({ url, ...data });
                }
            }
        }
        
        return results;
    }
    
    /**
     * Helper methods
     */
    
    initializeKeyMap() {
        return {
            // Number keys for quick track selection
            '1': () => this.selectTrack(1),
            '2': () => this.selectTrack(2),
            '3': () => this.selectTrack(3),
            '4': () => this.selectTrack(4),
            
            // Mode keys (with shift)
            'shift+1': () => this.switchMode('perform'),
            'shift+2': () => this.switchMode('pattern'),
            'shift+3': () => this.switchMode('mixer'),
            'shift+4': () => this.switchMode('effects'),
            
            // Transport
            'space': () => this.op1State.isPlaying ? this.stop() : this.play(),
            'r': () => this.record(),
            's': () => this.stop(),
            
            // Pattern operations
            'shift+c': () => this.clearPattern(),
            'cmd+c': () => this.copyPattern(),
            'cmd+v': () => this.pastePattern(),
            
            // Musical keys (bottom row like OP-1)
            'z': () => this.playNote('C'),
            'x': () => this.playNote('D'),
            'c': () => this.playNote('E'),
            'v': () => this.playNote('F'),
            'b': () => this.playNote('G'),
            'n': () => this.playNote('A'),
            'm': () => this.playNote('B'),
            
            // Black keys (top row)
            's': () => this.playNote('C#'),
            'd': () => this.playNote('D#'),
            'g': () => this.playNote('F#'),
            'h': () => this.playNote('G#'),
            'j': () => this.playNote('A#')
        };
    }
    
    async initializeMusicalEngine() {
        // Initialize audio context and synthesis
        console.log('🎼 Initializing musical engine...');
        
        // Set up Web Audio API components
        if (typeof window !== 'undefined' && window.AudioContext) {
            this.audioContext = new window.AudioContext();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
        }
    }
    
    async connectPlatforms() {
        console.log('🔌 Connecting to platforms...');
        
        // Platform adapters would be initialized here
        // For now, we'll simulate connections
        for (const platform of this.config.platforms) {
            this.platformConnections.set(platform, {
                status: 'connected',
                adapter: null // Would be actual platform adapter
            });
        }
    }
    
    initializeSequencer() {
        // Set up 16-step sequencer
        this.sequencer = {
            currentStep: 0,
            isRunning: false,
            stepTime: 60000 / (this.op1State.currentBPM * 4), // 16th notes
            
            tick: () => {
                if (!this.sequencer.isRunning) return;
                
                // Play any notes on current step
                for (let track = 0; track < 4; track++) {
                    const note = this.pattern.steps[track][this.sequencer.currentStep];
                    if (note) {
                        this.playSequencerNote(track + 1, note);
                    }
                }
                
                // Advance step
                this.sequencer.currentStep = (this.sequencer.currentStep + 1) % 16;
                
                // Schedule next tick
                setTimeout(this.sequencer.tick, this.sequencer.stepTime);
            }
        };
    }
    
    startTapeRecorder() {
        // Start the tape recorder for conversation history
        this.tapeInterval = setInterval(() => {
            // Clean up old tape data
            const cutoffTime = Date.now() - this.tape.maxLength;
            this.tape.buffer = this.tape.buffer.filter(event => event.timestamp > cutoffTime);
        }, 10000); // Clean every 10 seconds
    }
    
    assignInstrument(platform) {
        // Assign instruments based on platform characteristics
        const instrumentMap = {
            'discord': 'drum',      // Fast, rhythmic
            'slack': 'bass',        // Steady, foundational
            'twitter': 'lead',      // Melodic, attention-grabbing
            'reddit': 'chord',      // Harmonic, community-driven
            'telegram': 'synth',    // Electronic, direct
            'email': 'pad'          // Ambient, background
        };
        
        return instrumentMap[platform] || 'synth';
    }
    
    generateNoteMapping(channel) {
        // Generate unique note mapping for channel
        const hash = crypto.createHash('sha256').update(channel).digest();
        const scale = this.getScale(this.op1State.currentKey, this.op1State.currentScale);
        
        const mapping = {};
        
        // Map common words to notes
        const commonWords = ['hello', 'yes', 'no', 'lol', 'thanks', 'please', 'help', 'done'];
        commonWords.forEach((word, i) => {
            mapping[word] = scale[i % scale.length];
        });
        
        return mapping;
    }
    
    generateRhythmPattern(platform) {
        // Generate rhythm pattern based on platform
        const patterns = {
            'discord': [1, 0, 1, 0, 1, 0, 1, 0], // Steady beat
            'slack': [1, 0, 0, 0, 1, 0, 0, 0],   // Simple bass
            'twitter': [0, 1, 0, 1, 1, 0, 1, 0], // Syncopated
            'reddit': [1, 1, 0, 1, 1, 1, 0, 1]   // Complex
        };
        
        return patterns[platform] || [1, 0, 1, 0, 1, 0, 1, 0];
    }
    
    findAvailableTrack() {
        for (let i = 1; i <= 4; i++) {
            if (!this.tracks[i].channel) {
                return i;
            }
        }
        return null;
    }
    
    getCurrentTrack(platform) {
        for (let i = 1; i <= 4; i++) {
            if (this.tracks[i].platform === platform) {
                return i;
            }
        }
        return this.op1State.currentTrack;
    }
    
    recordToPattern(musicalEvents, track) {
        const currentStep = Math.floor((Date.now() % (16 * this.sequencer.stepTime)) / this.sequencer.stepTime);
        
        musicalEvents.forEach(event => {
            if (event.type === 'note') {
                this.pattern.steps[track - 1][currentStep] = event;
            }
        });
    }
    
    async playMusicalEvents(events, bandMember) {
        // Play the musical events through the audio system
        events.forEach(event => {
            this.emit('musical_event', {
                bandMember: bandMember.id,
                event
            });
        });
    }
    
    recordToTape(data) {
        this.tape.buffer.push(data);
        
        // Trim if too long
        if (this.tape.buffer.length > 10000) {
            this.tape.buffer = this.tape.buffer.slice(-10000);
        }
    }
    
    updateWaveform(memberId, events) {
        // Update visual waveform for the band member
        this.emit('waveform_update', {
            memberId,
            amplitude: events.reduce((sum, e) => sum + (e.velocity || 0), 0) / events.length
        });
    }
    
    async indexMusicalContent(message, events) {
        const url = this.generateMusicalURL(
            message.platform,
            message.channel,
            Date.now()
        );
        
        this.musicalIndex.set(url, {
            timestamp: Date.now(),
            key: this.op1State.currentKey,
            tempo: this.op1State.currentBPM,
            events: events.length,
            participants: message.userId ? [message.userId] : []
        });
    }
    
    detectMood() {
        // Detect mood from current musical state
        const moods = ['happy', 'sad', 'energetic', 'calm', 'mysterious'];
        return moods[Math.floor(Math.random() * moods.length)];
    }
    
    getScale(key, scaleName) {
        const scales = {
            'major': [0, 2, 4, 5, 7, 9, 11],
            'minor': [0, 2, 3, 5, 7, 8, 10],
            'pentatonic': [0, 2, 4, 7, 9],
            'blues': [0, 3, 5, 6, 7, 10]
        };
        
        const noteMap = {
            'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
            'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
        };
        
        const rootNote = noteMap[key] || 0;
        const scale = scales[scaleName] || scales['major'];
        
        return scale.map(interval => {
            const noteIndex = (rootNote + interval) % 12;
            return Object.keys(noteMap).find(note => noteMap[note] === noteIndex);
        });
    }
    
    scrollMessages(delta) {
        // Scroll through message history
        this.emit('scroll_messages', delta);
    }
    
    changeChannel(delta) {
        // Change active channel
        this.emit('change_channel', delta);
    }
    
    adjustTempo(delta) {
        this.op1State.currentBPM = Math.max(40, Math.min(300, this.op1State.currentBPM + delta));
        this.sequencer.stepTime = 60000 / (this.op1State.currentBPM * 4);
        
        console.log(`⏱️ Tempo: ${this.op1State.currentBPM} BPM`);
        this.emit('tempo_changed', this.op1State.currentBPM);
    }
    
    adjustFilter(delta) {
        this.op1State.effects.filter.cutoff = Math.max(0, Math.min(1, this.op1State.effects.filter.cutoff + delta * 0.01));
        
        console.log(`🎛️ Filter: ${Math.round(this.op1State.effects.filter.cutoff * 100)}%`);
        this.emit('filter_changed', this.op1State.effects.filter.cutoff);
    }
    
    playNote(note) {
        // Play a note manually
        this.emit('play_note', {
            note,
            track: this.op1State.currentTrack,
            velocity: 0.8
        });
    }
    
    playSequencerNote(track, note) {
        // Play note from sequencer
        this.emit('sequencer_note', {
            track,
            note
        });
    }
    
    async loadSavedPatterns() {
        // Load any saved patterns
        console.log('📂 Loading saved patterns...');
    }
    
    async connectToPlatform(platform, channel) {
        // Connect to specific platform/channel
        console.log(`🔗 Connecting to ${platform}/${channel}...`);
    }
}

/**
 * Translates chat messages into musical events
 */
class ChatroomMusicTranslator {
    constructor(bandInterface) {
        this.interface = bandInterface;
    }
    
    async translateMessage(message, bandMember) {
        const events = [];
        
        // Message length → note duration
        const duration = Math.min(message.text.length * 10, 1000);
        
        // User activity → velocity
        const velocity = Math.min(0.3 + (message.reactions || 0) * 0.1, 1.0);
        
        // Keywords → specific notes
        const words = message.text.toLowerCase().split(/\s+/);
        words.forEach((word, i) => {
            if (bandMember.noteMapping[word]) {
                events.push({
                    type: 'note',
                    note: bandMember.noteMapping[word],
                    velocity,
                    duration,
                    time: i * 100 // Stagger notes
                });
            }
        });
        
        // Emojis → effects
        const emojis = message.text.match(/[\u{1F300}-\u{1F9FF}]/gu) || [];
        emojis.forEach(emoji => {
            events.push({
                type: 'effect',
                effect: this.emojiToEffect(emoji),
                intensity: 0.5
            });
        });
        
        // Mentions → chord changes
        if (message.mentions && message.mentions.length > 0) {
            events.push({
                type: 'chord_change',
                chord: this.mentionsToChord(message.mentions)
            });
        }
        
        // URLs → samples
        if (message.urls && message.urls.length > 0) {
            events.push({
                type: 'sample',
                url: message.urls[0],
                trigger: 'oneshot'
            });
        }
        
        return events;
    }
    
    emojiToEffect(emoji) {
        const effectMap = {
            '😀': 'reverb',
            '😂': 'delay',
            '❤️': 'chorus',
            '🔥': 'distortion',
            '💯': 'filter_sweep',
            '🎵': 'pitch_shift',
            '🌟': 'phaser'
        };
        
        return effectMap[emoji] || 'reverb';
    }
    
    mentionsToChord(mentions) {
        // Convert number of mentions to chord type
        const chordTypes = ['major', 'minor', 'dominant7', 'major7', 'sus4'];
        return chordTypes[mentions.length % chordTypes.length];
    }
}

// Export the band interface
module.exports = UniversalBandInterface;

// CLI Demo
if (require.main === module) {
    const band = new UniversalBandInterface();
    
    console.log('🎹 Universal Band Interface Demo\n');
    
    const command = process.argv[2];
    
    if (command === 'jam') {
        // Start a jam session
        band.initialize()
            .then(async () => {
                console.log('\n🎸 Jam session started!\n');
                
                // Add some band members
                await band.addBandMember('discord', 'general', { instrument: 'drum' });
                await band.addBandMember('slack', 'team-chat', { instrument: 'bass' });
                await band.addBandMember('twitter', '@mentions', { instrument: 'lead' });
                
                // Simulate some messages
                setTimeout(async () => {
                    await band.processMessage('discord', 'general', {
                        text: 'Hello everyone! 🎵',
                        userId: 'user1',
                        reactions: 5
                    });
                }, 1000);
                
                setTimeout(async () => {
                    await band.processMessage('slack', 'team-chat', {
                        text: 'Great work today team! 💯',
                        userId: 'user2',
                        reactions: 3
                    });
                }, 2000);
                
                // Start playback
                setTimeout(() => {
                    band.play();
                    console.log('\n🎶 Band is playing! Press Ctrl+C to stop.\n');
                }, 3000);
            })
            .catch(console.error);
            
    } else if (command === 'search') {
        // Search for musical patterns
        const query = process.argv[3];
        band.initialize()
            .then(async () => {
                const results = await band.searchMusicalPatterns({ key: query });
                console.log('🔍 Search results:', results);
            })
            .catch(console.error);
            
    } else {
        console.log(`
Usage:
  node universal-band-interface.js jam       # Start a jam session
  node universal-band-interface.js search    # Search musical patterns

The Universal Band Interface treats chatrooms as band members:
- Discord → Drums (rhythm section)
- Slack → Bass (foundation)
- Twitter → Lead (melody)
- Reddit → Chords (harmony)

Controls (like OP-1):
- Keys 1-4: Select tracks
- Shift+1-4: Switch modes
- Space: Play/Stop
- R: Record
- Encoders: Blue (scroll), Green (channel), White (tempo), Orange (filter)

"Chatrooms as Instruments, Messages as Music"
        `);
    }
}