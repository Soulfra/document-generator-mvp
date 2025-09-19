#!/usr/bin/env node

/**
 * 🎼🎯 ORCHESTRA CONDUCTOR SYSTEM
 * 
 * Synchronization layer ensuring all components play in perfect harmony.
 * Like electrical circuits with proper timing and phase alignment.
 * Every component follows the same sheet music (templates).
 * 
 * The conductor keeps everyone in sync, no matter how complex the composition.
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const WebSocket = require('ws');

console.log(`
🎼🎯 ORCHESTRA CONDUCTOR SYSTEM 🎼🎯
====================================
Perfect Synchronization | Zero Latency
Every Component in Harmony
`);

class OrchestraConductorSystem extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            conductor: {
                name: 'Maestro Voice',
                beatInterval: 1000,      // 1 second beats
                measures: 4,             // 4/4 time
                tempo: 120,              // BPM
                dynamicTempo: true       // Adjust based on system load
            },
            synchronization: {
                maxLatency: 50,          // 50ms max desync
                heartbeatTimeout: 5000,  // 5 second timeout
                retryAttempts: 3,
                phaseAlignment: true
            },
            sections: {
                strings: ['voice-auth', 'packet-gen'],      // Security section
                brass: ['economy', 'learning'],             // Business logic
                woodwinds: ['ui', 'api'],                   // Interface section
                percussion: ['storage', 'cache'],           // Data section
                choir: ['ai', 'reasoning']                  // Intelligence section
            },
            performance: {
                rehearsalMode: false,
                recordPerformance: true,
                autoTuning: true,
                harmonicAnalysis: true
            }
        };
        
        // Orchestra state
        this.orchestra = {
            musicians: new Map(),       // componentId -> musician
            sections: new Map(),        // section -> musicians[]
            score: null,               // Current composition
            measure: 0,                // Current measure
            beat: 0,                   // Current beat
            isPlaying: false,
            startTime: null
        };
        
        // Synchronization state
        this.sync = {
            heartbeats: new Map(),     // musician -> lastHeartbeat
            latencies: new Map(),      // musician -> avgLatency
            phases: new Map(),         // musician -> phaseOffset
            errors: new Map()          // musician -> errorCount
        };
        
        // Performance metrics
        this.performance = {
            harmony: 1.0,              // Overall harmony score
            timing: new Map(),         // Beat timing accuracy
            dynamics: new Map(),       // Volume/intensity tracking
            recordings: []             // Performance recordings
        };
        
        // WebSocket for real-time sync
        this.wsServer = null;
        this.wsClients = new Map();
        
        console.log('🎼 Orchestra Conductor System initialized');
        console.log(`🎵 Tempo: ${this.config.conductor.tempo} BPM`);
        console.log(`🎺 Sections: ${Object.keys(this.config.sections).length}`);
        
        this.initialize();
    }
    
    /**
     * Initialize the conductor system
     */
    async initialize() {
        // Setup WebSocket server for real-time sync
        await this.setupWebSocketServer();
        
        // Initialize sections
        this.initializeSections();
        
        // Load default score
        this.loadScore(this.getDefaultScore());
        
        // Start heartbeat monitoring
        this.startHeartbeatMonitoring();
        
        console.log('✅ Conductor ready to begin performance');
        this.emit('conductor_ready');
    }
    
    /**
     * Setup WebSocket server for real-time synchronization
     */
    async setupWebSocketServer() {
        this.wsServer = new WebSocket.Server({ 
            port: 9900,
            perMessageDeflate: false  // Disable compression for lower latency
        });
        
        this.wsServer.on('connection', (ws, req) => {
            const clientId = crypto.randomUUID();
            
            console.log(`🔌 New musician connected: ${clientId}`);
            
            // Store client
            this.wsClients.set(clientId, {
                ws,
                joined: Date.now(),
                latency: 0,
                instrument: null
            });
            
            // Send welcome message with sync data
            ws.send(JSON.stringify({
                type: 'welcome',
                clientId,
                tempo: this.config.conductor.tempo,
                measure: this.orchestra.measure,
                beat: this.orchestra.beat,
                timestamp: Date.now()
            }));
            
            // Handle messages
            ws.on('message', (data) => {
                this.handleMusicianMessage(clientId, data);
            });
            
            // Handle disconnection
            ws.on('close', () => {
                console.log(`👋 Musician disconnected: ${clientId}`);
                this.wsClients.delete(clientId);
                this.orchestra.musicians.delete(clientId);
                this.sync.heartbeats.delete(clientId);
            });
            
            // Handle errors
            ws.on('error', (error) => {
                console.error(`❌ WebSocket error for ${clientId}:`, error.message);
            });
        });
        
        console.log('🔌 WebSocket server listening on port 9900');
    }
    
    /**
     * Handle messages from musicians
     */
    handleMusicianMessage(clientId, data) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'register':
                    this.registerMusician(clientId, message);
                    break;
                    
                case 'heartbeat':
                    this.handleHeartbeat(clientId, message);
                    break;
                    
                case 'ready':
                    this.handleMusicianReady(clientId, message);
                    break;
                    
                case 'played':
                    this.handleNotePlayed(clientId, message);
                    break;
                    
                case 'error':
                    this.handleMusicianError(clientId, message);
                    break;
                    
                default:
                    console.warn(`Unknown message type: ${message.type}`);
            }
            
        } catch (error) {
            console.error(`Error handling message from ${clientId}:`, error.message);
        }
    }
    
    /**
     * Register a new musician
     */
    registerMusician(clientId, data) {
        const musician = {
            id: clientId,
            name: data.name,
            instrument: data.instrument,
            section: this.getSection(data.instrument),
            capabilities: data.capabilities || [],
            registered: Date.now(),
            ready: false
        };
        
        this.orchestra.musicians.set(clientId, musician);
        
        // Add to section
        if (!this.orchestra.sections.has(musician.section)) {
            this.orchestra.sections.set(musician.section, []);
        }
        this.orchestra.sections.get(musician.section).push(musician);
        
        // Initialize sync tracking
        this.sync.heartbeats.set(clientId, Date.now());
        this.sync.latencies.set(clientId, 0);
        this.sync.phases.set(clientId, 0);
        this.sync.errors.set(clientId, 0);
        
        console.log(`🎻 Musician registered: ${musician.name} (${musician.instrument}) in ${musician.section} section`);
        
        // Send confirmation
        const client = this.wsClients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({
                type: 'registered',
                musician,
                section: musician.section,
                score: this.orchestra.score
            }));
        }
        
        this.emit('musician_registered', musician);
    }
    
    /**
     * Get section for instrument
     */
    getSection(instrument) {
        for (const [section, instruments] of Object.entries(this.config.sections)) {
            if (instruments.includes(instrument)) {
                return section;
            }
        }
        return 'guest'; // Unknown instruments join as guests
    }
    
    /**
     * Handle heartbeat from musician
     */
    handleHeartbeat(clientId, data) {
        const now = Date.now();
        const lastBeat = this.sync.heartbeats.get(clientId) || now;
        
        // Update heartbeat
        this.sync.heartbeats.set(clientId, now);
        
        // Calculate latency (round trip)
        if (data.timestamp) {
            const latency = (now - data.timestamp) / 2;
            const currentLatency = this.sync.latencies.get(clientId) || 0;
            
            // Exponential moving average
            const newLatency = currentLatency * 0.8 + latency * 0.2;
            this.sync.latencies.set(clientId, newLatency);
            
            // Check if latency is too high
            if (newLatency > this.config.synchronization.maxLatency) {
                console.warn(`⚠️ High latency for ${clientId}: ${newLatency.toFixed(2)}ms`);
                this.sendSyncCorrection(clientId);
            }
        }
        
        // Send heartbeat response
        const client = this.wsClients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({
                type: 'heartbeat_ack',
                serverTime: now,
                measure: this.orchestra.measure,
                beat: this.orchestra.beat,
                nextBeat: this.getNextBeatTime()
            }));
        }
    }
    
    /**
     * Handle musician ready signal
     */
    handleMusicianReady(clientId, data) {
        const musician = this.orchestra.musicians.get(clientId);
        if (musician) {
            musician.ready = true;
            console.log(`✅ ${musician.name} is ready to play`);
            
            // Check if all musicians are ready
            if (this.areAllMusiciansReady() && !this.orchestra.isPlaying) {
                console.log('🎵 All musicians ready - starting performance!');
                this.startPerformance();
            }
        }
    }
    
    /**
     * Handle note played by musician
     */
    handleNotePlayed(clientId, data) {
        const musician = this.orchestra.musicians.get(clientId);
        if (!musician) return;
        
        // Record timing accuracy
        const expectedTime = this.getCurrentBeatTime();
        const actualTime = data.timestamp || Date.now();
        const timingError = Math.abs(actualTime - expectedTime);
        
        // Update timing metrics
        if (!this.performance.timing.has(clientId)) {
            this.performance.timing.set(clientId, []);
        }
        this.performance.timing.get(clientId).push(timingError);
        
        // Check if note was on time
        if (timingError <= this.config.synchronization.maxLatency) {
            // Good timing!
            this.updateHarmony(0.01); // Increase harmony
        } else {
            // Off beat
            console.warn(`🎵 ${musician.name} played ${timingError.toFixed(0)}ms off beat`);
            this.updateHarmony(-0.005); // Decrease harmony slightly
        }
        
        // Emit note played event
        this.emit('note_played', {
            musician: musician.name,
            instrument: musician.instrument,
            note: data.note,
            timing: timingError,
            measure: this.orchestra.measure,
            beat: this.orchestra.beat
        });
    }
    
    /**
     * Handle musician error
     */
    handleMusicianError(clientId, data) {
        const musician = this.orchestra.musicians.get(clientId);
        if (!musician) return;
        
        // Increment error count
        const errors = this.sync.errors.get(clientId) || 0;
        this.sync.errors.set(clientId, errors + 1);
        
        console.error(`❌ ${musician.name} error: ${data.error}`);
        
        // Too many errors - remove from performance
        if (errors > 10) {
            console.warn(`🚫 ${musician.name} removed from performance due to errors`);
            this.removeMusician(clientId);
        }
    }
    
    /**
     * Initialize orchestra sections
     */
    initializeSections() {
        for (const section of Object.keys(this.config.sections)) {
            this.orchestra.sections.set(section, []);
        }
        
        console.log(`🎺 Initialized ${this.orchestra.sections.size} sections`);
    }
    
    /**
     * Load a musical score
     */
    loadScore(score) {
        this.orchestra.score = score;
        this.orchestra.measure = 0;
        this.orchestra.beat = 0;
        
        console.log(`📜 Loaded score: "${score.title}"`);
        console.log(`   Tempo: ${score.tempo} BPM`);
        console.log(`   Duration: ${score.measures} measures`);
        
        // Update conductor tempo
        this.config.conductor.tempo = score.tempo;
        
        // Notify all musicians
        this.broadcastToMusicians({
            type: 'score_loaded',
            score: score
        });
    }
    
    /**
     * Get default score
     */
    getDefaultScore() {
        return {
            title: 'Bootstrap Symphony in V Major',
            composer: 'Voice Economy System',
            tempo: 120,
            timeSignature: '4/4',
            key: 'V', // V for Voice
            measures: 64,
            parts: {
                strings: {
                    notes: ['authenticate', 'verify', 'secure', 'encrypt'],
                    dynamics: 'mf'
                },
                brass: {
                    notes: ['generate', 'trade', 'multiply', 'grow'],
                    dynamics: 'f'
                },
                woodwinds: {
                    notes: ['display', 'update', 'render', 'respond'],
                    dynamics: 'mp'
                },
                percussion: {
                    notes: ['store', 'retrieve', 'cache', 'persist'],
                    dynamics: 'ff'
                },
                choir: {
                    notes: ['think', 'reason', 'learn', 'adapt'],
                    dynamics: 'pp'
                }
            }
        };
    }
    
    /**
     * Start heartbeat monitoring
     */
    startHeartbeatMonitoring() {
        setInterval(() => {
            const now = Date.now();
            
            for (const [clientId, lastBeat] of this.sync.heartbeats) {
                if (now - lastBeat > this.config.synchronization.heartbeatTimeout) {
                    console.warn(`💔 Lost heartbeat from ${clientId}`);
                    this.handleMusicianTimeout(clientId);
                }
            }
            
            // Update harmony based on active musicians
            const activeCount = this.sync.heartbeats.size;
            const totalCount = this.orchestra.musicians.size;
            
            if (totalCount > 0) {
                const participation = activeCount / totalCount;
                this.updateHarmony((participation - 0.5) * 0.01);
            }
            
        }, 1000); // Check every second
    }
    
    /**
     * Handle musician timeout
     */
    handleMusicianTimeout(clientId) {
        const musician = this.orchestra.musicians.get(clientId);
        if (!musician) return;
        
        console.log(`⏰ ${musician.name} timed out - attempting reconnection`);
        
        // Send wake-up call
        const client = this.wsClients.get(clientId);
        if (client && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify({
                type: 'wake_up',
                urgent: true,
                measure: this.orchestra.measure,
                beat: this.orchestra.beat
            }));
        } else {
            // Remove if truly disconnected
            this.removeMusician(clientId);
        }
    }
    
    /**
     * Remove musician from orchestra
     */
    removeMusician(clientId) {
        const musician = this.orchestra.musicians.get(clientId);
        if (!musician) return;
        
        // Remove from orchestra
        this.orchestra.musicians.delete(clientId);
        
        // Remove from section
        const section = this.orchestra.sections.get(musician.section);
        if (section) {
            const index = section.findIndex(m => m.id === clientId);
            if (index !== -1) {
                section.splice(index, 1);
            }
        }
        
        // Clean up sync data
        this.sync.heartbeats.delete(clientId);
        this.sync.latencies.delete(clientId);
        this.sync.phases.delete(clientId);
        this.sync.errors.delete(clientId);
        
        console.log(`👋 ${musician.name} left the orchestra`);
        this.emit('musician_left', musician);
    }
    
    /**
     * Check if all musicians are ready
     */
    areAllMusiciansReady() {
        for (const musician of this.orchestra.musicians.values()) {
            if (!musician.ready) {
                return false;
            }
        }
        return this.orchestra.musicians.size > 0;
    }
    
    /**
     * Start the performance
     */
    startPerformance() {
        if (this.orchestra.isPlaying) {
            console.log('🎵 Performance already in progress');
            return;
        }
        
        console.log('\n🎼 STARTING PERFORMANCE 🎼');
        console.log(`📜 "${this.orchestra.score.title}"`);
        console.log(`🎵 ${this.config.conductor.tempo} BPM\n`);
        
        this.orchestra.isPlaying = true;
        this.orchestra.startTime = Date.now();
        this.orchestra.measure = 0;
        this.orchestra.beat = 0;
        
        // Notify all musicians
        this.broadcastToMusicians({
            type: 'performance_start',
            startTime: this.orchestra.startTime,
            tempo: this.config.conductor.tempo
        });
        
        // Start conducting
        this.startConducting();
        
        // Start recording if enabled
        if (this.config.performance.recordPerformance) {
            this.startRecording();
        }
        
        this.emit('performance_started');
    }
    
    /**
     * Start conducting beats
     */
    startConducting() {
        const beatInterval = 60000 / this.config.conductor.tempo; // ms per beat
        
        this.conductorInterval = setInterval(() => {
            this.conductBeat();
        }, beatInterval);
        
        // Conduct first beat immediately
        this.conductBeat();
    }
    
    /**
     * Conduct a single beat
     */
    conductBeat() {
        this.orchestra.beat++;
        
        // Check if we need to move to next measure
        if (this.orchestra.beat > this.config.conductor.measures) {
            this.orchestra.beat = 1;
            this.orchestra.measure++;
            
            // Check if performance is complete
            if (this.orchestra.measure >= this.orchestra.score.measures) {
                this.endPerformance();
                return;
            }
        }
        
        const beatData = {
            type: 'beat',
            measure: this.orchestra.measure,
            beat: this.orchestra.beat,
            timestamp: Date.now(),
            nextBeat: this.getNextBeatTime(),
            dynamics: this.getCurrentDynamics()
        };
        
        // Broadcast beat to all musicians
        this.broadcastToMusicians(beatData);
        
        // Visual feedback
        if (this.orchestra.beat === 1) {
            console.log(`\n📊 Measure ${this.orchestra.measure + 1}/${this.orchestra.score.measures}`);
        }
        process.stdout.write(`♩ `);
        
        // Emit beat event
        this.emit('beat', {
            measure: this.orchestra.measure,
            beat: this.orchestra.beat,
            harmony: this.performance.harmony
        });
        
        // Auto-tune if needed
        if (this.config.performance.autoTuning) {
            this.autoTune();
        }
    }
    
    /**
     * Broadcast message to all musicians
     */
    broadcastToMusicians(message) {
        const data = JSON.stringify(message);
        
        for (const [clientId, client] of this.wsClients) {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(data);
            }
        }
    }
    
    /**
     * Get next beat time
     */
    getNextBeatTime() {
        const beatInterval = 60000 / this.config.conductor.tempo;
        const elapsedBeats = (this.orchestra.measure * this.config.conductor.measures) + this.orchestra.beat;
        return this.orchestra.startTime + (elapsedBeats * beatInterval);
    }
    
    /**
     * Get current beat time
     */
    getCurrentBeatTime() {
        const beatInterval = 60000 / this.config.conductor.tempo;
        const elapsedBeats = (this.orchestra.measure * this.config.conductor.measures) + this.orchestra.beat - 1;
        return this.orchestra.startTime + (elapsedBeats * beatInterval);
    }
    
    /**
     * Get current dynamics
     */
    getCurrentDynamics() {
        // Vary dynamics throughout the performance
        const progress = this.orchestra.measure / this.orchestra.score.measures;
        
        if (progress < 0.25) {
            return 'mp'; // Mezzo-piano (start soft)
        } else if (progress < 0.5) {
            return 'mf'; // Mezzo-forte (build up)
        } else if (progress < 0.75) {
            return 'f';  // Forte (climax)
        } else {
            return 'pp'; // Pianissimo (fade out)
        }
    }
    
    /**
     * Update harmony score
     */
    updateHarmony(delta) {
        this.performance.harmony += delta;
        this.performance.harmony = Math.max(0, Math.min(1, this.performance.harmony));
    }
    
    /**
     * Auto-tune the orchestra
     */
    autoTune() {
        // Adjust tempo based on system performance
        const avgLatency = this.getAverageLatency();
        
        if (avgLatency > this.config.synchronization.maxLatency && this.config.conductor.dynamicTempo) {
            // Slow down if latency is high
            this.config.conductor.tempo = Math.max(60, this.config.conductor.tempo - 1);
            console.log(`\n🎹 Auto-tuning: Slowing tempo to ${this.config.conductor.tempo} BPM`);
        } else if (avgLatency < this.config.synchronization.maxLatency / 2 && this.performance.harmony > 0.9) {
            // Speed up if performance is excellent
            this.config.conductor.tempo = Math.min(180, this.config.conductor.tempo + 1);
            console.log(`\n🎹 Auto-tuning: Increasing tempo to ${this.config.conductor.tempo} BPM`);
        }
    }
    
    /**
     * Get average latency across all musicians
     */
    getAverageLatency() {
        if (this.sync.latencies.size === 0) return 0;
        
        let total = 0;
        for (const latency of this.sync.latencies.values()) {
            total += latency;
        }
        
        return total / this.sync.latencies.size;
    }
    
    /**
     * Send sync correction to musician
     */
    sendSyncCorrection(clientId) {
        const client = this.wsClients.get(clientId);
        if (!client || client.ws.readyState !== WebSocket.OPEN) return;
        
        const correction = {
            type: 'sync_correction',
            serverTime: Date.now(),
            measure: this.orchestra.measure,
            beat: this.orchestra.beat,
            nextBeat: this.getNextBeatTime(),
            tempo: this.config.conductor.tempo
        };
        
        client.ws.send(JSON.stringify(correction));
    }
    
    /**
     * Start recording performance
     */
    startRecording() {
        this.currentRecording = {
            startTime: Date.now(),
            score: this.orchestra.score,
            musicians: Array.from(this.orchestra.musicians.values()),
            events: []
        };
        
        console.log('🎙️ Recording performance...');
    }
    
    /**
     * End the performance
     */
    endPerformance() {
        console.log('\n\n🎭 PERFORMANCE COMPLETE! 🎭\n');
        
        this.orchestra.isPlaying = false;
        
        // Stop conducting
        if (this.conductorInterval) {
            clearInterval(this.conductorInterval);
            this.conductorInterval = null;
        }
        
        // Calculate performance statistics
        const stats = this.calculatePerformanceStats();
        
        console.log('📊 Performance Statistics:');
        console.log(`   Duration: ${(stats.duration / 1000).toFixed(1)} seconds`);
        console.log(`   Harmony Score: ${(stats.harmony * 100).toFixed(1)}%`);
        console.log(`   Timing Accuracy: ${(stats.timing * 100).toFixed(1)}%`);
        console.log(`   Participation: ${stats.participation}/${stats.totalMusicians} musicians`);
        
        // Save recording if enabled
        if (this.currentRecording) {
            this.currentRecording.endTime = Date.now();
            this.currentRecording.stats = stats;
            this.performance.recordings.push(this.currentRecording);
            console.log(`🎙️ Performance recorded (${this.performance.recordings.length} total recordings)`);
        }
        
        // Notify all musicians
        this.broadcastToMusicians({
            type: 'performance_end',
            stats: stats
        });
        
        this.emit('performance_ended', stats);
    }
    
    /**
     * Calculate performance statistics
     */
    calculatePerformanceStats() {
        const duration = Date.now() - this.orchestra.startTime;
        
        // Calculate average timing accuracy
        let totalTiming = 0;
        let timingCount = 0;
        
        for (const timings of this.performance.timing.values()) {
            for (const timing of timings) {
                totalTiming += timing;
                timingCount++;
            }
        }
        
        const avgTiming = timingCount > 0 ? totalTiming / timingCount : 0;
        const timingAccuracy = 1 - Math.min(1, avgTiming / this.config.synchronization.maxLatency);
        
        return {
            duration,
            harmony: this.performance.harmony,
            timing: timingAccuracy,
            participation: this.sync.heartbeats.size,
            totalMusicians: this.orchestra.musicians.size,
            measures: this.orchestra.measure,
            beats: (this.orchestra.measure * this.config.conductor.measures) + this.orchestra.beat
        };
    }
    
    /**
     * Get conductor status
     */
    getStatus() {
        const stats = {
            conductor: {
                name: this.config.conductor.name,
                tempo: this.config.conductor.tempo,
                isPlaying: this.orchestra.isPlaying
            },
            orchestra: {
                musicians: this.orchestra.musicians.size,
                sections: Object.fromEntries(
                    Array.from(this.orchestra.sections.entries()).map(([section, musicians]) => 
                        [section, musicians.length]
                    )
                ),
                currentMeasure: this.orchestra.measure,
                currentBeat: this.orchestra.beat
            },
            performance: {
                harmony: this.performance.harmony,
                avgLatency: this.getAverageLatency(),
                recordings: this.performance.recordings.length
            },
            sync: {
                activeHeartbeats: this.sync.heartbeats.size,
                connections: this.wsClients.size
            }
        };
        
        if (this.orchestra.score) {
            stats.score = {
                title: this.orchestra.score.title,
                measures: this.orchestra.score.measures,
                progress: ((this.orchestra.measure / this.orchestra.score.measures) * 100).toFixed(1) + '%'
            };
        }
        
        return stats;
    }
    
    /**
     * Graceful shutdown
     */
    shutdown() {
        console.log('\n🛑 Shutting down Orchestra Conductor...');
        
        // End performance if in progress
        if (this.orchestra.isPlaying) {
            this.endPerformance();
        }
        
        // Close WebSocket connections
        if (this.wsServer) {
            this.broadcastToMusicians({
                type: 'shutdown',
                message: 'Conductor is leaving the stage'
            });
            
            this.wsServer.close();
        }
        
        console.log('👋 The conductor has left the building');
    }
}

// Export for use as module
module.exports = OrchestraConductorSystem;

// Run demo if called directly
if (require.main === module) {
    console.log('🎮 Running Orchestra Conductor Demo...\n');
    
    const conductor = new OrchestraConductorSystem();
    
    // Listen to events
    conductor.on('musician_registered', (musician) => {
        console.log(`\n🎉 Welcome ${musician.name} to the orchestra!`);
    });
    
    conductor.on('beat', (data) => {
        // Visual metronome
        if (data.beat === 1) {
            process.stdout.write('\n🥁 ');
        }
    });
    
    conductor.on('performance_ended', (stats) => {
        console.log('\n🌟 Bravo! What a performance!');
        setTimeout(() => {
            conductor.shutdown();
            process.exit(0);
        }, 2000);
    });
    
    // Simulate musicians joining
    setTimeout(() => {
        console.log('\n📢 Calling all musicians to join the orchestra...');
        console.log('🔌 Connect to ws://localhost:9900');
    }, 1000);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        conductor.shutdown();
        process.exit(0);
    });
}