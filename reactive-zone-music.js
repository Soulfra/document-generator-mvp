#!/usr/bin/env node

/**
 * REACTIVE ZONE MUSIC SYSTEM
 * 
 * A dynamic music system that responds to zone boundaries, aggro ranges,
 * and player actions. Music transitions smoothly between zones and reacts
 * to danger proximity, creating an immersive audio landscape.
 * 
 * Features:
 * - Zone boundary detection with smooth crossfades
 * - Aggro range monitoring with dynamic intensity
 * - Position-based spatial audio
 * - Emotional state tracking
 * - Seamless music transitions
 * - Integration with telepathic interfaces
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class ReactiveZoneMusicSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Zone settings
            fadeDistance: 50,              // Distance for crossfade between zones
            aggroThreshold: 100,           // Default aggro detection range
            updateFrequency: 100,          // Position check frequency (ms)
            
            // Music settings
            crossfadeDuration: 3000,       // Crossfade time between zones
            intensityLayers: 4,            // Number of intensity layers
            spatialAudioEnabled: true,     // 3D audio positioning
            
            // Integration settings
            enableTelepathy: true,         // Telepathic emotion detection
            enableBrainWaves: true,        // Brain wave pattern analysis
            enableGlassUI: true,           // Glass UI widget support
            
            ...config
        };
        
        // Zone definitions with musical themes
        this.zones = {
            sanctuary: {
                name: 'Sanctuary',
                music: {
                    base: 'peaceful_ambient',
                    instruments: ['harp', 'flute', 'soft_strings'],
                    tempo: 60,
                    key: 'C_major',
                    mood: 'tranquil'
                },
                boundaries: { x: [0, 500], y: [0, 500], z: [0, 100] },
                safeZone: true,
                aggroRange: 0
            },
            
            mysticalForest: {
                name: 'Mystical Forest',
                music: {
                    base: 'ethereal_woodland',
                    instruments: ['woodwinds', 'chimes', 'nature_sounds'],
                    tempo: 75,
                    key: 'D_dorian',
                    mood: 'mysterious'
                },
                boundaries: { x: [500, 1500], y: [0, 1000], z: [0, 200] },
                creatures: ['wisps', 'sprites'],
                aggroRange: 75
            },
            
            darkCaverns: {
                name: 'Dark Caverns',
                music: {
                    base: 'ominous_depths',
                    instruments: ['low_strings', 'timpani', 'whispers'],
                    tempo: 50,
                    key: 'F_minor',
                    mood: 'foreboding'
                },
                boundaries: { x: [0, 1000], y: [-500, 0], z: [-200, 0] },
                creatures: ['shadows', 'echoes'],
                aggroRange: 150
            },
            
            battleArena: {
                name: 'Battle Arena',
                music: {
                    base: 'epic_combat',
                    instruments: ['brass', 'percussion', 'choir'],
                    tempo: 140,
                    key: 'D_minor',
                    mood: 'intense'
                },
                boundaries: { x: [1500, 2500], y: [500, 1500], z: [0, 300] },
                creatures: ['warriors', 'champions'],
                aggroRange: 200,
                combatZone: true
            },
            
            floatingCitadel: {
                name: 'Floating Citadel',
                music: {
                    base: 'celestial_majesty',
                    instruments: ['organ', 'bells', 'ethereal_voices'],
                    tempo: 85,
                    key: 'A_lydian',
                    mood: 'majestic'
                },
                boundaries: { x: [2000, 3000], y: [2000, 3000], z: [500, 1000] },
                aggroRange: 50,
                magicalZone: true
            },
            
            voidRealm: {
                name: 'Void Realm',
                music: {
                    base: 'quantum_silence',
                    instruments: ['synth_pads', 'reversed_sounds', 'void_whispers'],
                    tempo: 0,
                    key: 'atonal',
                    mood: 'transcendent'
                },
                boundaries: { x: [-1000, 0], y: [-1000, 0], z: [-500, -200] },
                aggroRange: 0,
                telepathicZone: true
            }
        };
        
        // Creature definitions with musical signatures
        this.creatures = {
            wisps: {
                musicalSignature: ['high_bells', 'sparkles'],
                aggroSound: 'dissonant_chimes',
                aggroRange: 75,
                dangerLevel: 'low'
            },
            shadows: {
                musicalSignature: ['low_drones', 'whispers'],
                aggroSound: 'dark_crescendo',
                aggroRange: 150,
                dangerLevel: 'medium'
            },
            warriors: {
                musicalSignature: ['war_drums', 'battle_cries'],
                aggroSound: 'combat_fanfare',
                aggroRange: 200,
                dangerLevel: 'high'
            },
            guardians: {
                musicalSignature: ['holy_chorus', 'protective_aura'],
                aggroSound: 'warning_bells',
                aggroRange: 100,
                dangerLevel: 'protective'
            }
        };
        
        // Music state
        this.musicState = {
            currentZone: null,
            previousZone: null,
            activeZones: [],           // Zones within fade distance
            
            currentIntensity: 0,       // 0-1 danger level
            targetIntensity: 0,
            
            activeLayers: new Map(),   // Currently playing music layers
            queuedTransitions: [],
            
            emotionalState: 'neutral',
            brainWavePattern: 'alpha',
            
            spatialSources: new Map()  // 3D audio sources
        };
        
        // Player state
        this.playerState = {
            position: { x: 250, y: 250, z: 50 }, // Start in sanctuary
            velocity: { x: 0, y: 0, z: 0 },
            heading: 0,
            
            nearbyCreatures: [],
            aggroedCreatures: [],
            
            emotionalState: 'calm',
            heartRate: 70,
            stressLevel: 0
        };
        
        // Zone transition state
        this.transitionState = {
            active: false,
            fromZone: null,
            toZone: null,
            progress: 0,
            startTime: null
        };
        
        console.log('🎵 Reactive Zone Music System initialized');
        console.log(`🗺️ Loaded ${Object.keys(this.zones).length} musical zones`);
        console.log(`👾 Loaded ${Object.keys(this.creatures).length} creature types`);
    }

    /**
     * Initialize the reactive music system
     */
    async initialize() {
        try {
            console.log('🎵 Initializing Reactive Zone Music System...');
            
            // Initialize audio engine
            await this.initializeAudioEngine();
            
            // Load zone music
            await this.loadZoneMusic();
            
            // Setup position monitoring
            this.startPositionMonitoring();
            
            // Setup aggro detection
            this.startAggroDetection();
            
            // Setup emotional monitoring if enabled
            if (this.config.enableTelepathy) {
                await this.initializeTelepathicMonitoring();
            }
            
            // Start in sanctuary
            await this.enterZone('sanctuary');
            
            console.log('✅ Reactive Zone Music System ready');
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize zone music:', error);
            throw error;
        }
    }

    /**
     * Initialize audio engine (placeholder for actual audio implementation)
     */
    async initializeAudioEngine() {
        console.log('🔊 Initializing spatial audio engine...');
        
        // In a real implementation, this would initialize Web Audio API or Tone.js
        this.audioEngine = {
            context: 'AudioContext',
            masterGain: 1.0,
            spatialPanner: '3D Panner Node',
            convolver: 'Reverb Node'
        };
        
        this.emit('audio-initialized', this.audioEngine);
    }

    /**
     * Load music for all zones
     */
    async loadZoneMusic() {
        console.log('🎼 Loading zone music...');
        
        for (const [zoneId, zone] of Object.entries(this.zones)) {
            try {
                // In real implementation, this would load actual audio files
                const musicLayers = await this.generateZoneLayers(zone);
                zone.musicLayers = musicLayers;
                
                console.log(`✅ Loaded music for ${zone.name}`);
            } catch (error) {
                console.error(`❌ Failed to load music for ${zone.name}:`, error);
            }
        }
    }

    /**
     * Generate music layers for a zone
     */
    async generateZoneLayers(zone) {
        const layers = [];
        
        // Base ambient layer
        layers.push({
            id: `${zone.name}_base`,
            type: 'ambient',
            intensity: 0,
            volume: 0.6,
            loop: true,
            crossfade: true
        });
        
        // Instrument layers
        zone.music.instruments.forEach((instrument, index) => {
            layers.push({
                id: `${zone.name}_${instrument}`,
                type: 'melodic',
                instrument: instrument,
                intensity: index * 0.25,
                volume: 0.4,
                loop: true
            });
        });
        
        // Danger/combat layer
        if (zone.aggroRange > 0) {
            layers.push({
                id: `${zone.name}_danger`,
                type: 'danger',
                intensity: 0.75,
                volume: 0.8,
                loop: true,
                trigger: 'aggro'
            });
        }
        
        return layers;
    }

    /**
     * Start monitoring player position
     */
    startPositionMonitoring() {
        console.log('📍 Starting position monitoring...');
        
        this.positionInterval = setInterval(() => {
            this.updatePlayerPosition();
            this.checkZoneTransitions();
            this.updateSpatialAudio();
        }, this.config.updateFrequency);
    }

    /**
     * Update player position (simulated movement)
     */
    updatePlayerPosition() {
        // In real implementation, this would get actual player position
        // For now, simulate some movement
        const time = Date.now() / 1000;
        
        // Simulate wandering movement
        this.playerState.position.x += Math.sin(time * 0.1) * 2;
        this.playerState.position.y += Math.cos(time * 0.08) * 1.5;
        this.playerState.position.z += Math.sin(time * 0.05) * 0.5;
        
        // Calculate velocity
        this.playerState.velocity = {
            x: Math.sin(time * 0.1) * 2,
            y: Math.cos(time * 0.08) * 1.5,
            z: Math.sin(time * 0.05) * 0.5
        };
        
        this.emit('position-updated', this.playerState.position);
    }

    /**
     * Check for zone transitions
     */
    checkZoneTransitions() {
        const currentPos = this.playerState.position;
        const activeZones = [];
        
        // Find all zones player is in or near
        for (const [zoneId, zone] of Object.entries(this.zones)) {
            const distance = this.getDistanceToZone(currentPos, zone);
            
            if (distance === 0) {
                // Player is inside zone
                activeZones.push({ zoneId, zone, weight: 1.0 });
            } else if (distance < this.config.fadeDistance) {
                // Player is near zone boundary
                const weight = 1 - (distance / this.config.fadeDistance);
                activeZones.push({ zoneId, zone, weight });
            }
        }
        
        // Sort by weight
        activeZones.sort((a, b) => b.weight - a.weight);
        
        // Update music based on active zones
        this.updateZoneMusic(activeZones);
        
        // Check if primary zone changed
        const primaryZone = activeZones[0];
        if (primaryZone && primaryZone.zoneId !== this.musicState.currentZone) {
            this.handleZoneTransition(this.musicState.currentZone, primaryZone.zoneId);
        }
        
        this.musicState.activeZones = activeZones;
    }

    /**
     * Get distance from position to zone
     */
    getDistanceToZone(position, zone) {
        const bounds = zone.boundaries;
        
        // Check if inside zone
        if (position.x >= bounds.x[0] && position.x <= bounds.x[1] &&
            position.y >= bounds.y[0] && position.y <= bounds.y[1] &&
            position.z >= bounds.z[0] && position.z <= bounds.z[1]) {
            return 0;
        }
        
        // Calculate distance to nearest zone boundary
        const dx = Math.max(bounds.x[0] - position.x, 0, position.x - bounds.x[1]);
        const dy = Math.max(bounds.y[0] - position.y, 0, position.y - bounds.y[1]);
        const dz = Math.max(bounds.z[0] - position.z, 0, position.z - bounds.z[1]);
        
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Update zone music based on active zones
     */
    updateZoneMusic(activeZones) {
        // Mix music from all active zones based on weights
        const musicMix = {
            layers: [],
            totalWeight: 0
        };
        
        activeZones.forEach(({ zone, weight }) => {
            if (zone.musicLayers) {
                zone.musicLayers.forEach(layer => {
                    musicMix.layers.push({
                        ...layer,
                        volume: layer.volume * weight,
                        zoneWeight: weight
                    });
                });
                musicMix.totalWeight += weight;
            }
        });
        
        // Apply the music mix
        this.applyMusicMix(musicMix);
    }

    /**
     * Apply music mix to audio engine
     */
    applyMusicMix(musicMix) {
        // Update active layers based on intensity
        musicMix.layers.forEach(layer => {
            const shouldPlay = layer.intensity <= this.musicState.currentIntensity ||
                             layer.type === 'ambient';
            
            if (shouldPlay && !this.musicState.activeLayers.has(layer.id)) {
                this.startMusicLayer(layer);
            } else if (!shouldPlay && this.musicState.activeLayers.has(layer.id)) {
                this.stopMusicLayer(layer);
            } else if (shouldPlay) {
                // Update volume for active layer
                this.updateLayerVolume(layer);
            }
        });
    }

    /**
     * Handle zone transition
     */
    async handleZoneTransition(fromZoneId, toZoneId) {
        const fromZone = fromZoneId ? this.zones[fromZoneId] : null;
        const toZone = this.zones[toZoneId];
        
        console.log(`🎵 Transitioning from ${fromZone?.name || 'nowhere'} to ${toZone.name}`);
        
        // Start transition
        this.transitionState = {
            active: true,
            fromZone: fromZoneId,
            toZone: toZoneId,
            progress: 0,
            startTime: Date.now()
        };
        
        // Update current zone
        this.musicState.previousZone = this.musicState.currentZone;
        this.musicState.currentZone = toZoneId;
        
        // Emit transition event
        this.emit('zone-transition', {
            from: fromZone,
            to: toZone,
            position: this.playerState.position
        });
        
        // Update emotional state based on zone
        this.updateEmotionalState(toZone);
        
        // Smooth transition over configured duration
        await this.performCrossfade(fromZone, toZone);
        
        this.transitionState.active = false;
    }

    /**
     * Perform crossfade between zones
     */
    async performCrossfade(fromZone, toZone) {
        const duration = this.config.crossfadeDuration;
        const steps = 30; // 30fps for smooth transition
        const stepDuration = duration / steps;
        
        for (let i = 0; i <= steps; i++) {
            const progress = i / steps;
            this.transitionState.progress = progress;
            
            // Update volumes for crossfade
            if (fromZone) {
                const fromVolume = 1 - progress;
                this.setZoneVolume(fromZone, fromVolume);
            }
            
            const toVolume = progress;
            this.setZoneVolume(toZone, toVolume);
            
            await new Promise(resolve => setTimeout(resolve, stepDuration));
        }
    }

    /**
     * Start aggro detection
     */
    startAggroDetection() {
        console.log('⚔️ Starting aggro detection...');
        
        this.aggroInterval = setInterval(() => {
            this.detectNearbyCreatures();
            this.updateAggroStates();
            this.calculateIntensity();
        }, 250); // Check 4 times per second
    }

    /**
     * Detect nearby creatures
     */
    detectNearbyCreatures() {
        const playerPos = this.playerState.position;
        const nearbyCreatures = [];
        
        // Check current zone for creatures
        const currentZone = this.zones[this.musicState.currentZone];
        if (currentZone && currentZone.creatures) {
            currentZone.creatures.forEach(creatureType => {
                const creature = this.creatures[creatureType];
                if (creature) {
                    // Simulate creature positions
                    const creaturePos = this.simulateCreaturePosition(creatureType);
                    const distance = this.calculateDistance(playerPos, creaturePos);
                    
                    if (distance < creature.aggroRange * 2) {
                        nearbyCreatures.push({
                            type: creatureType,
                            position: creaturePos,
                            distance: distance,
                            aggroRange: creature.aggroRange,
                            isAggroed: distance < creature.aggroRange
                        });
                    }
                }
            });
        }
        
        this.playerState.nearbyCreatures = nearbyCreatures;
    }

    /**
     * Update aggro states
     */
    updateAggroStates() {
        const previousAggro = this.playerState.aggroedCreatures;
        const currentAggro = this.playerState.nearbyCreatures
            .filter(c => c.isAggroed)
            .map(c => c.type);
        
        // Check for new aggros
        currentAggro.forEach(creature => {
            if (!previousAggro.includes(creature)) {
                this.handleNewAggro(creature);
            }
        });
        
        // Check for dropped aggros
        previousAggro.forEach(creature => {
            if (!currentAggro.includes(creature)) {
                this.handleDroppedAggro(creature);
            }
        });
        
        this.playerState.aggroedCreatures = currentAggro;
    }

    /**
     * Handle new creature aggro
     */
    handleNewAggro(creatureType) {
        const creature = this.creatures[creatureType];
        console.log(`⚔️ Aggroed by ${creatureType}!`);
        
        // Play aggro sound
        this.playAggroSound(creature);
        
        // Increase intensity
        this.musicState.targetIntensity = Math.min(1, 
            this.musicState.targetIntensity + (creature.dangerLevel === 'high' ? 0.5 : 0.3)
        );
        
        this.emit('creature-aggroed', {
            creature: creatureType,
            position: this.playerState.position
        });
    }

    /**
     * Handle dropped creature aggro
     */
    handleDroppedAggro(creatureType) {
        console.log(`✅ Lost aggro from ${creatureType}`);
        
        // Decrease intensity
        this.musicState.targetIntensity = Math.max(0,
            this.musicState.targetIntensity - 0.2
        );
        
        this.emit('creature-deaggroed', {
            creature: creatureType,
            position: this.playerState.position
        });
    }

    /**
     * Calculate overall intensity level
     */
    calculateIntensity() {
        let intensity = 0;
        
        // Base intensity from aggroed creatures
        this.playerState.aggroedCreatures.forEach(creatureType => {
            const creature = this.creatures[creatureType];
            if (creature.dangerLevel === 'high') intensity += 0.5;
            else if (creature.dangerLevel === 'medium') intensity += 0.3;
            else intensity += 0.1;
        });
        
        // Zone modifier
        const currentZone = this.zones[this.musicState.currentZone];
        if (currentZone) {
            if (currentZone.combatZone) intensity += 0.2;
            if (currentZone.safeZone) intensity *= 0.5;
        }
        
        // Emotional state modifier
        if (this.playerState.stressLevel > 0.7) intensity += 0.2;
        
        // Set target intensity
        this.musicState.targetIntensity = Math.min(1, intensity);
        
        // Smooth intensity changes
        const diff = this.musicState.targetIntensity - this.musicState.currentIntensity;
        this.musicState.currentIntensity += diff * 0.1; // Smooth lerp
        
        this.emit('intensity-changed', this.musicState.currentIntensity);
    }

    /**
     * Initialize telepathic monitoring
     */
    async initializeTelepathicMonitoring() {
        console.log('🧠 Initializing telepathic monitoring...');
        
        // Monitor emotional state
        this.telepathicInterval = setInterval(() => {
            this.monitorEmotionalState();
            this.monitorBrainWaves();
        }, 1000);
        
        this.emit('telepathy-initialized');
    }

    /**
     * Monitor emotional state
     */
    monitorEmotionalState() {
        // Simulate emotional state detection
        const emotions = ['calm', 'excited', 'anxious', 'focused', 'curious'];
        const stressFactors = {
            calm: 0,
            excited: 0.3,
            anxious: 0.7,
            focused: 0.2,
            curious: 0.1
        };
        
        // In real implementation, this would use actual biometric data
        const emotion = emotions[Math.floor(Math.random() * emotions.length)];
        this.playerState.emotionalState = emotion;
        this.playerState.stressLevel = stressFactors[emotion];
        
        // Adjust music based on emotion
        this.adjustMusicForEmotion(emotion);
    }

    /**
     * Monitor brain wave patterns
     */
    monitorBrainWaves() {
        // Simulate brain wave detection
        const patterns = ['alpha', 'beta', 'theta', 'gamma', 'delta'];
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        this.musicState.brainWavePattern = pattern;
        
        // Adjust music tempo based on brain waves
        this.adjustMusicForBrainWaves(pattern);
    }

    /**
     * Update spatial audio based on position
     */
    updateSpatialAudio() {
        if (!this.config.spatialAudioEnabled) return;
        
        // Update listener position
        const pos = this.playerState.position;
        const vel = this.playerState.velocity;
        
        // In real implementation, update Web Audio API spatial listener
        this.emit('spatial-update', {
            position: pos,
            velocity: vel,
            orientation: this.playerState.heading
        });
        
        // Update spatial sources (creatures, ambient sounds)
        this.playerState.nearbyCreatures.forEach(creature => {
            this.updateSpatialSource(creature.type, creature.position);
        });
    }

    // Helper methods

    simulateCreaturePosition(creatureType) {
        // Simulate creature movement
        const time = Date.now() / 1000;
        const hash = creatureType.charCodeAt(0);
        
        return {
            x: this.playerState.position.x + Math.sin(time * 0.2 + hash) * 100,
            y: this.playerState.position.y + Math.cos(time * 0.15 + hash) * 100,
            z: this.playerState.position.z + Math.sin(time * 0.1 + hash) * 20
        };
    }

    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    startMusicLayer(layer) {
        console.log(`🎵 Starting layer: ${layer.id}`);
        this.musicState.activeLayers.set(layer.id, layer);
        this.emit('layer-started', layer);
    }

    stopMusicLayer(layer) {
        console.log(`🔇 Stopping layer: ${layer.id}`);
        this.musicState.activeLayers.delete(layer.id);
        this.emit('layer-stopped', layer);
    }

    updateLayerVolume(layer) {
        const activeLayer = this.musicState.activeLayers.get(layer.id);
        if (activeLayer) {
            activeLayer.volume = layer.volume;
            this.emit('layer-volume-changed', layer);
        }
    }

    setZoneVolume(zone, volume) {
        if (zone && zone.musicLayers) {
            zone.musicLayers.forEach(layer => {
                const activeLayer = this.musicState.activeLayers.get(layer.id);
                if (activeLayer) {
                    activeLayer.zoneVolume = volume;
                    this.emit('zone-volume-changed', { zone: zone.name, volume });
                }
            });
        }
    }

    playAggroSound(creature) {
        this.emit('aggro-sound', {
            creature: creature,
            sound: creature.aggroSound
        });
    }

    updateEmotionalState(zone) {
        const moodMap = {
            tranquil: 'calm',
            mysterious: 'curious',
            foreboding: 'anxious',
            intense: 'excited',
            majestic: 'focused',
            transcendent: 'calm'
        };
        
        this.playerState.emotionalState = moodMap[zone.music.mood] || 'neutral';
    }

    adjustMusicForEmotion(emotion) {
        // Adjust music parameters based on emotion
        const adjustments = {
            calm: { tempoMultiplier: 0.9, volumeMultiplier: 0.8 },
            excited: { tempoMultiplier: 1.1, volumeMultiplier: 1.1 },
            anxious: { tempoMultiplier: 1.05, volumeMultiplier: 0.9 },
            focused: { tempoMultiplier: 1.0, volumeMultiplier: 0.85 },
            curious: { tempoMultiplier: 0.95, volumeMultiplier: 0.9 }
        };
        
        const adj = adjustments[emotion] || adjustments.calm;
        this.emit('emotion-adjustment', adj);
    }

    adjustMusicForBrainWaves(pattern) {
        // Adjust music based on brain wave patterns
        const adjustments = {
            alpha: { effect: 'relaxation', parameter: 'reverb' },
            beta: { effect: 'focus', parameter: 'clarity' },
            theta: { effect: 'meditation', parameter: 'ambience' },
            gamma: { effect: 'intensity', parameter: 'brightness' },
            delta: { effect: 'deep_calm', parameter: 'depth' }
        };
        
        const adj = adjustments[pattern];
        this.emit('brainwave-adjustment', adj);
    }

    updateSpatialSource(sourceId, position) {
        this.musicState.spatialSources.set(sourceId, position);
        this.emit('spatial-source-updated', { sourceId, position });
    }

    /**
     * Enter a specific zone
     */
    async enterZone(zoneId) {
        const zone = this.zones[zoneId];
        if (!zone) {
            throw new Error(`Unknown zone: ${zoneId}`);
        }
        
        // Set player position to zone center
        const bounds = zone.boundaries;
        this.playerState.position = {
            x: (bounds.x[0] + bounds.x[1]) / 2,
            y: (bounds.y[0] + bounds.y[1]) / 2,
            z: (bounds.z[0] + bounds.z[1]) / 2
        };
        
        await this.handleZoneTransition(this.musicState.currentZone, zoneId);
    }

    /**
     * Get current music state
     */
    getMusicState() {
        return {
            currentZone: this.musicState.currentZone,
            activeZones: this.musicState.activeZones,
            intensity: this.musicState.currentIntensity,
            activeLayers: Array.from(this.musicState.activeLayers.values()),
            emotionalState: this.playerState.emotionalState,
            brainWavePattern: this.musicState.brainWavePattern,
            nearbyCreatures: this.playerState.nearbyCreatures,
            aggroedCreatures: this.playerState.aggroedCreatures,
            position: this.playerState.position
        };
    }

    /**
     * Stop the music system
     */
    async stop() {
        console.log('🛑 Stopping Reactive Zone Music System...');
        
        // Clear intervals
        if (this.positionInterval) clearInterval(this.positionInterval);
        if (this.aggroInterval) clearInterval(this.aggroInterval);
        if (this.telepathicInterval) clearInterval(this.telepathicInterval);
        
        // Stop all active layers
        this.musicState.activeLayers.forEach(layer => {
            this.stopMusicLayer(layer);
        });
        
        this.emit('stopped');
        
        console.log('✅ Reactive Zone Music System stopped');
    }
}

module.exports = ReactiveZoneMusicSystem;

// CLI interface for testing
if (require.main === module) {
    const musicSystem = new ReactiveZoneMusicSystem();
    
    async function demo() {
        try {
            await musicSystem.initialize();
            
            // Listen to events
            musicSystem.on('zone-transition', (data) => {
                console.log(`\n🎵 Zone transition: ${data.from?.name || 'nowhere'} → ${data.to.name}`);
            });
            
            musicSystem.on('creature-aggroed', (data) => {
                console.log(`\n⚔️ Aggroed by ${data.creature}!`);
            });
            
            musicSystem.on('intensity-changed', (intensity) => {
                const bar = '█'.repeat(Math.floor(intensity * 20));
                console.log(`\n🎚️ Intensity: [${bar.padEnd(20, '░')}] ${(intensity * 100).toFixed(0)}%`);
            });
            
            console.log('\n🎮 Simulating player movement through zones...');
            console.log('Press Ctrl+C to stop\n');
            
            // Simulate zone transitions
            const zoneSequence = [
                'sanctuary',
                'mysticalForest',
                'darkCaverns',
                'battleArena',
                'floatingCitadel',
                'voidRealm'
            ];
            
            let zoneIndex = 0;
            setInterval(async () => {
                const nextZone = zoneSequence[zoneIndex % zoneSequence.length];
                console.log(`\n📍 Teleporting to ${nextZone}...`);
                await musicSystem.enterZone(nextZone);
                zoneIndex++;
                
                // Show current state
                const state = musicSystem.getMusicState();
                console.log(`\n📊 Current State:`);
                console.log(`   Zone: ${state.currentZone}`);
                console.log(`   Intensity: ${(state.intensity * 100).toFixed(0)}%`);
                console.log(`   Active Layers: ${state.activeLayers.length}`);
                console.log(`   Emotional State: ${state.emotionalState}`);
                console.log(`   Brain Waves: ${state.brainWavePattern}`);
                
            }, 10000); // Change zones every 10 seconds
            
        } catch (error) {
            console.error('Demo error:', error);
        }
    }
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n\n🛑 Shutting down...');
        await musicSystem.stop();
        process.exit(0);
    });
    
    demo();
}

console.log('🎵 Reactive Zone Music System ready');