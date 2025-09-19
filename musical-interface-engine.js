/**
 * 🎼 Musical Interface Engine - 10-Bar, 3-Stack Musical UI System
 * 
 * Creates an interactive musical interface where:
 * - 10 horizontal bars (musical measures) arranged in 3 vertical stacks (layers)
 * - Notes can rise in pitch and position until they trigger popup interactions
 * - Visual feedback with musical notation and real-time sound generation
 * - Integration with Musical Cryptographic Genealogy System
 * 
 * Features:
 * - 10x3 grid-based musical interface (10 bars, 3 stacks)
 * - Interactive note placement and manipulation
 * - Rising note animations with pitch escalation
 * - Popup triggers when notes reach threshold heights
 * - Real-time musical playback and visualization
 * - Family harmonic integration from MusicCryptoFamily
 * - Device-specific melody overlays from HarmonicDeviceAuth
 * - WebSocket real-time collaboration
 * - Voice control integration points
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const WebSocket = require('ws');

class MusicalInterfaceEngine extends EventEmitter {
    constructor(musicCryptoFamily, harmonicDeviceAuth, config = {}) {
        super();
        
        this.musicCryptoFamily = musicCryptoFamily;
        this.harmonicDeviceAuth = harmonicDeviceAuth;
        
        this.config = {
            // Interface Structure
            interface: {
                barsCount: 10,           // 10 horizontal bars (measures)
                stacksCount: 3,          // 3 vertical stacks (layers)
                beatsPerBar: 4,          // Standard 4/4 time
                totalCells: 120,         // 10 bars × 3 stacks × 4 beats
                cellWidth: 60,           // Pixels per cell
                cellHeight: 40,          // Pixels per cell
                stackHeight: 200         // Pixels per stack
            },
            
            // Note Behavior
            notes: {
                risingSpeed: 2.0,        // Pixels per update
                maxRiseHeight: 150,      // Maximum rise before popup trigger
                popupThreshold: 120,     // Height that triggers popup
                decayRate: 0.95,         // Fade rate when note dies
                sustainTime: 5000,       // How long notes sustain (ms)
                harmonicAttraction: 0.1, // How much notes attract to harmony
                pitchEscalation: 1.2     // Pitch multiplier as notes rise
            },
            
            // Visual Configuration
            visual: {
                backgroundColor: '#0a0a0a',
                gridColor: '#333333',
                noteColors: {
                    active: '#00ff88',
                    rising: '#ffaa00',
                    peaked: '#ff0088',
                    harmony: '#0088ff',
                    device: '#ff8800'
                },
                popupColors: {
                    background: 'rgba(0, 255, 136, 0.9)',
                    border: '#00ff88',
                    text: '#000000'
                },
                animations: {
                    noteRise: 'ease-out',
                    popupFade: 'ease-in-out',
                    stackShimmer: 'pulse'
                }
            },
            
            // Audio Configuration
            audio: {
                baseFrequency: 440,      // A4 = 440 Hz
                octaveRange: [3, 7],     // Musical octave range
                volume: 0.7,             // Default volume
                reverbAmount: 0.3,       // Reverb effect
                chorusAmount: 0.2,       // Chorus effect
                synthType: 'sine',       // Waveform type
                attackTime: 0.1,         // Note attack time
                releaseTime: 0.5         // Note release time
            },
            
            // Interaction Configuration
            interaction: {
                clickToPlace: true,      // Click to place notes
                dragToMove: true,        // Drag notes around
                rightClickDelete: true,  // Right-click to delete
                voiceControl: true,      // Voice command integration
                keyboardShortcuts: true, // Keyboard shortcuts
                touchGestures: true,     // Mobile touch support
                collaborativeMode: true  // Multi-user mode
            },
            
            // Popup System
            popups: {
                types: [
                    'note_peaked',       // Note reached maximum height
                    'harmony_achieved',  // Harmony detected
                    'device_melody',     // Device melody triggered
                    'family_signature',  // Family signature activated
                    'voice_command',     // Voice command recognized
                    'collaboration'      // Multi-user interaction
                ],
                displayTime: 3000,       // Popup display duration (ms)
                maxSimultaneous: 5,      // Max popups at once
                queueEnabled: true,      // Queue popups if too many
                animationSpeed: 300      // Popup animation speed (ms)
            },
            
            // WebSocket Configuration
            websocket: {
                port: 3355,              // WebSocket server port
                heartbeatInterval: 30000, // Heartbeat every 30 seconds
                maxConnections: 100,     // Maximum concurrent connections
                messageBuffer: 1000,     // Message buffer size
                compressionEnabled: true
            },
            
            ...config
        };
        
        // Interface State
        this.interface = {
            grid: new Array(this.config.interface.barsCount).fill(null).map(() => 
                new Array(this.config.interface.stacksCount).fill(null).map(() => 
                    new Array(this.config.interface.beatsPerBar).fill(null)
                )
            ), // [bar][stack][beat] = noteData
            activeNotes: new Map(),      // noteId -> noteInstance
            risingNotes: new Set(),      // Set of noteIds that are rising
            peakedNotes: new Set(),      // Set of noteIds that have peaked
            harmonies: new Map(),        // Detected harmonies
            deviceMelodies: new Map(),   // Active device melodies
            familySignatures: new Map()  // Family musical signatures
        };
        
        // Audio Context
        this.audioContext = null;
        this.audioNodes = new Map();     // nodeId -> audioNode
        this.masterGain = null;
        
        // Visual Context
        this.canvas = null;
        this.ctx = null;
        this.animationFrame = null;
        
        // WebSocket Server
        this.wsServer = null;
        this.connections = new Map();    // connectionId -> websocket
        
        // Popup System
        this.popups = {
            active: new Map(),           // popupId -> popupData
            queue: [],                   // Queued popups
            container: null              // DOM container for popups
        };
        
        // Performance Metrics
        this.metrics = {
            frameRate: 60,
            noteCount: 0,
            popupCount: 0,
            harmonyDetections: 0,
            voiceCommands: 0,
            collaborativeActions: 0,
            averageLatency: 0
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🎼 Initializing Musical Interface Engine...');
        
        // Initialize audio system
        await this.initializeAudio();
        
        // Initialize WebSocket server
        await this.initializeWebSocket();
        
        // Setup integration with musical systems
        await this.setupMusicalIntegration();
        
        // Initialize visual interface
        await this.initializeVisualInterface();
        
        // Setup interaction handlers
        this.setupInteractionHandlers();
        
        // Start animation loop
        this.startAnimationLoop();
        
        console.log('✅ Musical Interface Engine initialized');
        console.log(`  📊 Interface: ${this.config.interface.barsCount} bars × ${this.config.interface.stacksCount} stacks`);
        console.log(`  🎵 Audio: ${this.config.audio.octaveRange[0]}-${this.config.audio.octaveRange[1]} octave range`);
        console.log(`  🌐 WebSocket: ws://localhost:${this.config.websocket.port}`);
        
        this.emit('interface_ready');
    }
    
    /**
     * Initialize Web Audio API
     */
    async initializeAudio() {
        if (typeof window !== 'undefined' && window.AudioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.config.audio.volume;
            
            console.log('🎵 Audio context initialized');
        } else {
            console.log('🎵 Audio context not available (server-side)');
        }
    }
    
    /**
     * Initialize WebSocket server for real-time collaboration
     */
    async initializeWebSocket() {
        this.wsServer = new WebSocket.Server({ port: this.config.websocket.port });
        
        this.wsServer.on('connection', (ws) => {
            const connectionId = crypto.randomUUID();
            this.connections.set(connectionId, ws);
            
            console.log(`🔌 New interface connection: ${connectionId.slice(0, 8)}...`);
            
            ws.on('message', (message) => {
                this.handleWebSocketMessage(connectionId, JSON.parse(message));
            });
            
            ws.on('close', () => {
                this.connections.delete(connectionId);
                console.log(`🔌 Interface disconnected: ${connectionId.slice(0, 8)}...`);
            });
            
            // Send initial interface state
            ws.send(JSON.stringify({
                type: 'interface_state',
                data: this.getInterfaceState()
            }));
        });
        
        console.log(`🌐 WebSocket server listening on port ${this.config.websocket.port}`);
    }
    
    /**
     * Setup integration with musical cryptographic systems
     */
    async setupMusicalIntegration() {
        // Listen for family creation events
        if (this.musicCryptoFamily) {
            this.musicCryptoFamily.on('familyCreated', (family) => {
                this.addFamilySignature(family);
            });
            
            this.musicCryptoFamily.on('characterCreated', (character) => {
                this.addCharacterMelody(character);
            });
        }
        
        // Listen for device authentication events
        if (this.harmonicDeviceAuth) {
            this.harmonicDeviceAuth.on('deviceAuthenticated', (authData) => {
                this.addDeviceMelody(authData.deviceId);
            });
            
            this.harmonicDeviceAuth.on('deviceRegistered', (device) => {
                this.addDeviceMelody(device.id);
            });
        }
        
        console.log('🔗 Musical system integration setup complete');
    }
    
    /**
     * Initialize visual interface (canvas-based)
     */
    async initializeVisualInterface() {
        // Create canvas element if we're in a browser environment
        if (typeof document !== 'undefined') {
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.config.interface.barsCount * this.config.interface.cellWidth;
            this.canvas.height = this.config.interface.stacksCount * this.config.interface.stackHeight;
            this.ctx = this.canvas.getContext('2d');
            
            // Create popup container
            this.popups.container = document.createElement('div');
            this.popups.container.id = 'musical-interface-popups';
            this.popups.container.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 1000;
            `;
            
            console.log('🖥️ Visual interface initialized');
        } else {
            console.log('🖥️ Visual interface not available (server-side)');
        }
    }
    
    /**
     * Place a note at specific coordinates
     */
    placeNote(bar, stack, beat, noteData = {}) {
        if (bar >= this.config.interface.barsCount || 
            stack >= this.config.interface.stacksCount || 
            beat >= this.config.interface.beatsPerBar) {
            return { success: false, reason: 'coordinates_out_of_bounds' };
        }
        
        // Calculate note frequency based on position
        const baseFrequency = this.config.audio.baseFrequency;
        const octaveOffset = (this.config.interface.stacksCount - stack - 1) * 12; // Higher stacks = higher octaves
        const noteOffset = (bar * this.config.interface.beatsPerBar + beat) % 12;
        const frequency = baseFrequency * Math.pow(2, (octaveOffset + noteOffset) / 12);
        
        const noteId = crypto.randomUUID();
        const note = {
            id: noteId,
            bar,
            stack,
            beat,
            frequency,
            baseFrequency: frequency,
            amplitude: noteData.amplitude || 0.7,
            phase: noteData.phase || 0,
            color: noteData.color || this.config.visual.noteColors.active,
            
            // Animation properties
            rising: false,
            riseHeight: 0,
            maxRiseHeight: this.config.notes.maxRiseHeight,
            riseSpeed: this.config.notes.risingSpeed,
            
            // State tracking
            createdAt: Date.now(),
            lastUpdate: Date.now(),
            sustainUntil: Date.now() + this.config.notes.sustainTime,
            
            // Family/Device association
            familyId: noteData.familyId || null,
            deviceId: noteData.deviceId || null,
            characterId: noteData.characterId || null,
            
            // User data
            ...noteData
        };
        
        // Place in grid
        this.interface.grid[bar][stack][beat] = note;
        this.interface.activeNotes.set(noteId, note);
        
        // Play audio if available
        this.playNote(note);
        
        // Broadcast to connected clients
        this.broadcastInterfaceUpdate({
            type: 'note_placed',
            note: this.sanitizeNoteForBroadcast(note)
        });
        
        console.log(`🎵 Note placed: ${noteId.slice(0, 8)}... at [${bar},${stack},${beat}] (${frequency.toFixed(1)}Hz)`);
        
        this.emit('note_placed', note);
        
        return { success: true, noteId, note };
    }
    
    /**
     * Start a note rising in pitch and position
     */
    startNoteRising(noteId) {
        const note = this.interface.activeNotes.get(noteId);
        if (!note || note.rising) {
            return { success: false, reason: 'note_not_found_or_already_rising' };
        }
        
        note.rising = true;
        note.riseStartTime = Date.now();
        this.interface.risingNotes.add(noteId);
        
        console.log(`📈 Note rising: ${noteId.slice(0, 8)}... starting rise animation`);
        
        this.emit('note_rising', note);
        
        return { success: true };
    }
    
    /**
     * Update rising notes animation and physics
     */
    updateRisingNotes() {
        for (const noteId of this.interface.risingNotes) {
            const note = this.interface.activeNotes.get(noteId);
            if (!note) {
                this.interface.risingNotes.delete(noteId);
                continue;
            }
            
            // Update rise height
            note.riseHeight += note.riseSpeed;
            
            // Update frequency as note rises (pitch escalation)
            note.frequency = note.baseFrequency * Math.pow(this.config.notes.pitchEscalation, note.riseHeight / 100);
            
            // Check if note has peaked
            if (note.riseHeight >= note.maxRiseHeight) {
                this.triggerNotePeaked(noteId);
            }
            
            // Update visual properties
            const riseRatio = note.riseHeight / note.maxRiseHeight;
            note.color = this.interpolateColor(
                this.config.visual.noteColors.active,
                this.config.visual.noteColors.peaked,
                riseRatio
            );
            
            note.lastUpdate = Date.now();
        }
    }
    
    /**
     * Trigger popup when note reaches peak
     */
    triggerNotePeaked(noteId) {
        const note = this.interface.activeNotes.get(noteId);
        if (!note) return;
        
        // Move to peaked notes
        this.interface.risingNotes.delete(noteId);
        this.interface.peakedNotes.add(noteId);
        
        note.rising = false;
        note.peaked = true;
        note.peakedAt = Date.now();
        
        // Create popup
        this.createPopup('note_peaked', {
            note,
            message: `🎵 Note peaked at ${note.frequency.toFixed(1)}Hz!`,
            position: {
                x: note.bar * this.config.interface.cellWidth,
                y: note.stack * this.config.interface.stackHeight - note.riseHeight
            },
            actions: [
                { label: 'Sustain', action: () => this.sustainNote(noteId) },
                { label: 'Harmonize', action: () => this.harmonizeNote(noteId) },
                { label: 'Record', action: () => this.recordNotePattern(noteId) }
            ]
        });
        
        // Check for harmony opportunities
        this.detectHarmonies(note);
        
        console.log(`🎯 Note peaked: ${noteId.slice(0, 8)}... triggering popup`);
        
        this.emit('note_peaked', note);
        
        // Update metrics
        this.metrics.popupCount++;
    }
    
    /**
     * Create and display a popup
     */
    createPopup(type, data = {}) {
        const popupId = crypto.randomUUID();
        
        const popup = {
            id: popupId,
            type,
            data,
            createdAt: Date.now(),
            expiresAt: Date.now() + this.config.popups.displayTime,
            position: data.position || { x: 100, y: 100 },
            visible: true,
            ...data
        };
        
        // Check if we can display immediately
        if (this.popups.active.size < this.config.popups.maxSimultaneous) {
            this.displayPopup(popup);
        } else if (this.config.popups.queueEnabled) {
            this.popups.queue.push(popup);
        }
        
        return { success: true, popupId, popup };
    }
    
    /**
     * Display popup visually
     */
    displayPopup(popup) {
        this.popups.active.set(popup.id, popup);
        
        // Create DOM element for popup if in browser
        if (this.popups.container) {
            const popupElement = document.createElement('div');
            popupElement.id = `popup-${popup.id}`;
            popupElement.style.cssText = `
                position: absolute;
                left: ${popup.position.x}px;
                top: ${popup.position.y}px;
                background: ${this.config.visual.popupColors.background};
                border: 2px solid ${this.config.visual.popupColors.border};
                color: ${this.config.visual.popupColors.text};
                padding: 10px;
                border-radius: 8px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                max-width: 200px;
                z-index: 1001;
                animation: fadeIn ${this.config.popups.animationSpeed}ms ease-in-out;
            `;
            
            // Add message
            const message = document.createElement('div');
            message.textContent = popup.message || 'Musical event triggered!';
            popupElement.appendChild(message);
            
            // Add action buttons
            if (popup.actions && popup.actions.length > 0) {
                const buttonContainer = document.createElement('div');
                buttonContainer.style.marginTop = '10px';
                
                popup.actions.forEach(action => {
                    const button = document.createElement('button');
                    button.textContent = action.label;
                    button.style.cssText = `
                        margin: 2px;
                        padding: 4px 8px;
                        border: 1px solid ${this.config.visual.popupColors.border};
                        background: transparent;
                        color: ${this.config.visual.popupColors.text};
                        cursor: pointer;
                        font-size: 10px;
                    `;
                    button.onclick = () => {
                        action.action();
                        this.dismissPopup(popup.id);
                    };
                    buttonContainer.appendChild(button);
                });
                
                popupElement.appendChild(buttonContainer);
            }
            
            this.popups.container.appendChild(popupElement);
            
            // Auto-dismiss after display time
            setTimeout(() => {
                this.dismissPopup(popup.id);
            }, popup.expiresAt - Date.now());
        }
        
        console.log(`💬 Popup displayed: ${popup.type} - ${popup.message || 'No message'}`);
        
        this.emit('popup_displayed', popup);
    }
    
    /**
     * Dismiss a popup
     */
    dismissPopup(popupId) {
        const popup = this.popups.active.get(popupId);
        if (!popup) return;
        
        // Remove from active popups
        this.popups.active.delete(popupId);
        
        // Remove DOM element
        if (this.popups.container) {
            const element = document.getElementById(`popup-${popupId}`);
            if (element) {
                element.style.animation = `fadeOut ${this.config.popups.animationSpeed}ms ease-in-out`;
                setTimeout(() => {
                    element.remove();
                }, this.config.popups.animationSpeed);
            }
        }
        
        // Process queue
        if (this.popups.queue.length > 0) {
            const nextPopup = this.popups.queue.shift();
            this.displayPopup(nextPopup);
        }
        
        this.emit('popup_dismissed', popup);
    }
    
    /**
     * Detect harmonies between active notes
     */
    detectHarmonies(triggerNote) {
        const harmonies = [];
        
        for (const [noteId, note] of this.interface.activeNotes) {
            if (note.id === triggerNote.id) continue;
            
            // Calculate frequency ratio
            const ratio = Math.max(note.frequency, triggerNote.frequency) / 
                         Math.min(note.frequency, triggerNote.frequency);
            
            // Check for simple harmonic ratios
            const harmonicRatios = {
                'unison': 1.0,
                'octave': 2.0,
                'perfect_fifth': 1.5,
                'perfect_fourth': 1.333,
                'major_third': 1.25,
                'minor_third': 1.2
            };
            
            for (const [interval, targetRatio] of Object.entries(harmonicRatios)) {
                if (Math.abs(ratio - targetRatio) < 0.05) { // 5% tolerance
                    harmonies.push({
                        interval,
                        notes: [triggerNote, note],
                        ratio,
                        strength: 1 - Math.abs(ratio - targetRatio) / 0.05
                    });
                }
            }
        }
        
        if (harmonies.length > 0) {
            this.createPopup('harmony_achieved', {
                message: `🎼 Harmony detected: ${harmonies.map(h => h.interval).join(', ')}!`,
                harmonies,
                position: {
                    x: triggerNote.bar * this.config.interface.cellWidth + 30,
                    y: triggerNote.stack * this.config.interface.stackHeight - triggerNote.riseHeight - 30
                },
                actions: [
                    { label: 'Record Harmony', action: () => this.recordHarmony(harmonies) },
                    { label: 'Extend Pattern', action: () => this.extendHarmonyPattern(harmonies) }
                ]
            });
            
            this.metrics.harmonyDetections++;
            console.log(`🎼 Harmony detected: ${harmonies.length} harmonic relationships`);
        }
    }
    
    /**
     * Add family signature to interface
     */
    addFamilySignature(family) {
        const signature = {
            familyId: family.id,
            keySignature: family.musicalProfile.keySignature,
            chordProgression: family.musicalProfile.chordProgression,
            melodyPattern: family.musicalProfile.melodyPattern,
            color: this.generateFamilyColor(family.id)
        };
        
        this.interface.familySignatures.set(family.id, signature);
        
        // Place signature notes in interface
        this.placeFamilySignatureNotes(signature);
        
        console.log(`🎵 Added family signature: ${family.name} (${signature.keySignature})`);
    }
    
    /**
     * Add device melody to interface
     */
    addDeviceMelody(deviceId) {
        if (!this.harmonicDeviceAuth) return;
        
        const deviceProfile = this.harmonicDeviceAuth.getDeviceProfile(deviceId);
        if (!deviceProfile) return;
        
        const melody = deviceProfile.melody;
        const deviceMelody = {
            deviceId,
            notes: melody.notes,
            color: this.config.visual.noteColors.device,
            harmonic: deviceProfile.harmonicGroup
        };
        
        this.interface.deviceMelodies.set(deviceId, deviceMelody);
        
        // Place device melody notes
        this.placeDeviceMelodyNotes(deviceMelody);
        
        console.log(`📱 Added device melody: ${deviceId.slice(0, 8)}... (${melody.notes.length} notes)`);
    }
    
    /**
     * Animation loop for visual updates
     */
    startAnimationLoop() {
        const animate = () => {
            // Update rising notes
            this.updateRisingNotes();
            
            // Update audio nodes
            this.updateAudioNodes();
            
            // Render visual interface
            this.renderInterface();
            
            // Process expired popups
            this.processExpiredPopups();
            
            // Continue animation loop
            this.animationFrame = requestAnimationFrame ? requestAnimationFrame(animate) : setTimeout(animate, 16);
        };
        
        animate();
        console.log('🎬 Animation loop started');
    }
    
    /**
     * Render the musical interface
     */
    renderInterface() {
        if (!this.ctx) return;
        
        const ctx = this.ctx;
        const config = this.config;
        
        // Clear canvas
        ctx.fillStyle = config.visual.backgroundColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        ctx.strokeStyle = config.visual.gridColor;
        ctx.lineWidth = 1;
        
        // Draw vertical lines (bar separators)
        for (let bar = 0; bar <= config.interface.barsCount; bar++) {
            const x = bar * config.interface.cellWidth;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }
        
        // Draw horizontal lines (stack separators)
        for (let stack = 0; stack <= config.interface.stacksCount; stack++) {
            const y = stack * config.interface.stackHeight;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
        
        // Draw beat separators (lighter lines)
        ctx.strokeStyle = config.visual.gridColor + '40';
        for (let bar = 0; bar < config.interface.barsCount; bar++) {
            for (let beat = 1; beat < config.interface.beatsPerBar; beat++) {
                const x = bar * config.interface.cellWidth + beat * (config.interface.cellWidth / config.interface.beatsPerBar);
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, this.canvas.height);
                ctx.stroke();
            }
        }
        
        // Draw active notes
        for (const [noteId, note] of this.interface.activeNotes) {
            this.renderNote(ctx, note);
        }
        
        // Draw interface labels
        this.renderInterfaceLabels(ctx);
    }
    
    /**
     * Render individual note
     */
    renderNote(ctx, note) {
        const x = note.bar * this.config.interface.cellWidth + 
                 note.beat * (this.config.interface.cellWidth / this.config.interface.beatsPerBar);
        const y = note.stack * this.config.interface.stackHeight + this.config.interface.stackHeight / 2;
        
        // Apply rise offset
        const renderY = y - note.riseHeight;
        
        // Note circle
        const radius = 8 + (note.amplitude * 10);
        ctx.fillStyle = note.color;
        ctx.beginPath();
        ctx.arc(x + this.config.interface.cellWidth / (this.config.interface.beatsPerBar * 2), 
               renderY, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Note outline
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Rising effect (trail)
        if (note.rising && note.riseHeight > 20) {
            const trailHeight = Math.min(note.riseHeight, 50);
            const gradient = ctx.createLinearGradient(0, renderY, 0, renderY + trailHeight);
            gradient.addColorStop(0, note.color + '80');
            gradient.addColorStop(1, note.color + '00');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x, renderY, this.config.interface.cellWidth / this.config.interface.beatsPerBar, trailHeight);
        }
        
        // Frequency label (for peaked notes)
        if (note.peaked) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px Courier New';
            ctx.textAlign = 'center';
            ctx.fillText(`${note.frequency.toFixed(0)}Hz`, x + this.config.interface.cellWidth / (this.config.interface.beatsPerBar * 2), renderY - radius - 5);
        }
    }
    
    /**
     * Render interface labels
     */
    renderInterfaceLabels(ctx) {
        ctx.fillStyle = '#00ff88';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'left';
        
        // Bar numbers
        for (let bar = 0; bar < this.config.interface.barsCount; bar++) {
            ctx.fillText(`${bar + 1}`, bar * this.config.interface.cellWidth + 5, 15);
        }
        
        // Stack labels
        const stackLabels = ['High', 'Mid', 'Low'];
        ctx.textAlign = 'right';
        for (let stack = 0; stack < this.config.interface.stacksCount; stack++) {
            ctx.fillText(
                stackLabels[stack] || `Stack ${stack + 1}`,
                this.canvas.width - 5,
                stack * this.config.interface.stackHeight + 20
            );
        }
    }
    
    // Additional helper methods...
    
    playNote(note) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = this.config.audio.synthType;
        oscillator.frequency.setValueAtTime(note.frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(note.amplitude, this.audioContext.currentTime + this.config.audio.attackTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + this.config.audio.releaseTime);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + this.config.audio.releaseTime);
        
        // Store audio node reference
        this.audioNodes.set(note.id, { oscillator, gainNode });
    }
    
    handleWebSocketMessage(connectionId, message) {
        switch (message.type) {
            case 'place_note':
                this.placeNote(message.bar, message.stack, message.beat, message.noteData);
                break;
            case 'start_rising':
                this.startNoteRising(message.noteId);
                break;
            case 'voice_command':
                this.handleVoiceCommand(message.command, message.data);
                break;
            // Additional message handlers...
        }
    }
    
    handleVoiceCommand(command, data) {
        console.log(`🎤 Voice command: ${command}`);
        
        // Integration point for VoiceMouseController
        this.emit('voice_command', { command, data });
        
        // Update metrics
        this.metrics.voiceCommands++;
    }
    
    getInterfaceState() {
        return {
            grid: this.interface.grid,
            activeNotes: Array.from(this.interface.activeNotes.values()),
            risingNotes: Array.from(this.interface.risingNotes),
            peakedNotes: Array.from(this.interface.peakedNotes),
            familySignatures: Array.from(this.interface.familySignatures.values()),
            deviceMelodies: Array.from(this.interface.deviceMelodies.values()),
            metrics: this.metrics
        };
    }
    
    // Utility methods
    interpolateColor(color1, color2, ratio) {
        // Simple color interpolation
        return color1; // Simplified for now
    }
    
    generateFamilyColor(familyId) {
        const hash = crypto.createHash('md5').update(familyId).digest('hex');
        return `#${hash.slice(0, 6)}`;
    }
    
    sanitizeNoteForBroadcast(note) {
        return {
            id: note.id,
            bar: note.bar,
            stack: note.stack,
            beat: note.beat,
            frequency: note.frequency,
            rising: note.rising,
            riseHeight: note.riseHeight,
            color: note.color
        };
    }
    
    // Placeholder methods for future implementation
    sustainNote(noteId) { /* Implementation */ }
    harmonizeNote(noteId) { /* Implementation */ }
    recordNotePattern(noteId) { /* Implementation */ }
    recordHarmony(harmonies) { /* Implementation */ }
    extendHarmonyPattern(harmonies) { /* Implementation */ }
    placeFamilySignatureNotes(signature) { /* Implementation */ }
    placeDeviceMelodyNotes(melody) { /* Implementation */ }
    updateAudioNodes() { /* Implementation */ }
    processExpiredPopups() { /* Implementation */ }
    setupInteractionHandlers() { /* Implementation */ }
}

module.exports = MusicalInterfaceEngine;

// Example usage and testing
if (require.main === module) {
    async function demonstrateMusicalInterface() {
        console.log('🎼 Musical Interface Engine Demo\n');
        
        // Import dependencies
        const MusicCryptoFamily = require('./musical-crypto-family');
        const HarmonicDeviceAuth = require('./harmonic-device-auth');
        
        const musicCrypto = new MusicCryptoFamily();
        await new Promise(resolve => musicCrypto.once('initialized', resolve));
        
        const harmonicAuth = new HarmonicDeviceAuth(musicCrypto);
        await new Promise(resolve => harmonicAuth.once('initialized', resolve));
        
        const interfaceEngine = new MusicalInterfaceEngine(musicCrypto, harmonicAuth);
        await new Promise(resolve => interfaceEngine.once('interface_ready', resolve));
        
        // Create a family
        const family = await musicCrypto.createFamily('Demo Family');
        
        // Register a device
        const device = await harmonicAuth.registerDevice({
            type: 'demo',
            platform: 'test'
        }, family.id);
        
        // Place some test notes
        console.log('\n🎵 Placing test notes in 10-bar, 3-stack interface:');
        
        for (let i = 0; i < 5; i++) {
            const bar = i * 2;
            const stack = i % 3;
            const beat = 0;
            
            const result = interfaceEngine.placeNote(bar, stack, beat, {
                familyId: family.id,
                deviceId: device.id,
                amplitude: 0.5 + i * 0.1
            });
            
            if (result.success) {
                console.log(`  ✅ Note ${i + 1}: Bar ${bar}, Stack ${stack}, Beat ${beat}`);
                
                // Start note rising after 1 second
                setTimeout(() => {
                    interfaceEngine.startNoteRising(result.noteId);
                }, (i + 1) * 1000);
            }
        }
        
        // Show interface state
        setTimeout(() => {
            const state = interfaceEngine.getInterfaceState();
            console.log(`\n📊 Interface State:`);
            console.log(`  Active Notes: ${state.activeNotes.length}`);
            console.log(`  Rising Notes: ${state.risingNotes.length}`);
            console.log(`  Peaked Notes: ${state.peakedNotes.length}`);
            console.log(`  Family Signatures: ${state.familySignatures.length}`);
            console.log(`  Device Melodies: ${state.deviceMelodies.length}`);
        }, 3000);
        
        console.log('\n✅ Musical Interface Engine demonstration complete!');
        console.log('🌐 WebSocket interface available for real-time interaction');
        console.log('🎯 Notes will rise and trigger popups when they peak!');
    }
    
    demonstrateMusicalInterface().catch(console.error);
}