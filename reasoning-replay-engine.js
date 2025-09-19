/**
 * 🎬 Reasoning Replay Engine
 * Records all AI interactions, decisions, and reasoning processes for movie-style playback
 * Enables timeline scrubbing, multi-track visualization, and collaborative learning
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ReasoningReplayEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            recordingDir: options.recordingDir || './recordings',
            maxRecordingSize: options.maxRecordingSize || 100 * 1024 * 1024, // 100MB
            compressionEnabled: options.compressionEnabled || true,
            realtimeMode: options.realtimeMode || true,
            ...options
        };
        
        // Recording state
        this.activeRecordings = new Map();
        this.replayingSessions = new Map();
        
        // Timeline management
        this.timelineIndex = new Map();
        this.bookmarks = new Map();
        
        // Session management
        this.currentSession = null;
        this.sessionMetadata = new Map();
        
        // Performance tracking
        this.stats = {
            totalRecordings: 0,
            totalPlaybacks: 0,
            averageSessionDuration: 0,
            popularReplayMoments: []
        };
        
        this.init();
    }
    
    async init() {
        // Ensure recording directory exists
        await this.ensureDirectories();
        
        // Load existing session metadata
        await this.loadSessionMetadata();
        
        console.log('🎬 Reasoning Replay Engine initialized');
        console.log(`📁 Recording directory: ${this.options.recordingDir}`);
        console.log(`📊 Found ${this.sessionMetadata.size} existing recordings`);
    }
    
    async ensureDirectories() {
        const dirs = [
            this.options.recordingDir,
            path.join(this.options.recordingDir, 'sessions'),
            path.join(this.options.recordingDir, 'exports'),
            path.join(this.options.recordingDir, 'thumbnails'),
            path.join(this.options.recordingDir, 'metadata')
        ];
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                console.error(`Failed to create directory ${dir}:`, error);
            }
        }
    }
    
    /**
     * Start recording a new reasoning session
     */
    async startRecording(sessionConfig = {}) {
        const sessionId = sessionConfig.sessionId || this.generateSessionId();
        
        const session = {
            id: sessionId,
            startTime: Date.now(),
            title: sessionConfig.title || `Reasoning Session ${sessionId}`,
            description: sessionConfig.description || 'AI reasoning and decision-making session',
            participants: sessionConfig.participants || ['AI'],
            tags: sessionConfig.tags || [],
            domain: sessionConfig.domain || 'general',
            theme: sessionConfig.theme || 'default',
            
            // Recording data
            timeline: [],
            reasoning_chains: [],
            decisions: [],
            interactions: [],
            system_events: [],
            performance_metrics: [],
            
            // State tracking
            isRecording: true,
            isPaused: false,
            currentTimestamp: 0,
            
            // Metadata
            version: '1.0.0',
            engine_version: '2.0.0',
            created_by: sessionConfig.creator || 'system'
        };
        
        this.activeRecordings.set(sessionId, session);
        this.currentSession = session;
        
        // Create session file
        await this.saveSession(session);
        
        this.emit('recording:started', {
            sessionId,
            session: this.sanitizeSessionForEmit(session)
        });
        
        console.log(`🎬 Started recording session: ${sessionId}`);
        return session;
    }
    
    /**
     * Record a reasoning step
     */
    async recordReasoningStep(step) {
        if (!this.currentSession || !this.currentSession.isRecording) {
            return;
        }
        
        const timestamp = Date.now() - this.currentSession.startTime;
        
        const reasoningEntry = {
            id: crypto.randomUUID(),
            timestamp,
            type: 'reasoning_step',
            step_number: this.currentSession.reasoning_chains.length + 1,
            component: step.component || 'unknown',
            operation: step.operation || 'think',
            input: step.input,
            output: step.output,
            reasoning_text: step.reasoning || '',
            confidence: step.confidence || 0.8,
            processing_time: step.processing_time || 0,
            context: step.context || {},
            
            // Visual representation data
            visual_state: {
                component_highlight: step.component,
                data_flow: step.data_flow || [],
                decision_tree: step.decision_tree || null,
                alternative_paths: step.alternative_paths || []
            }
        };
        
        this.currentSession.reasoning_chains.push(reasoningEntry);
        this.currentSession.timeline.push({
            timestamp,
            type: 'reasoning',
            entry_id: reasoningEntry.id,
            importance: step.importance || 'medium'
        });
        
        // Real-time broadcast
        if (this.options.realtimeMode) {
            this.emit('reasoning:step', {
                sessionId: this.currentSession.id,
                step: reasoningEntry
            });
        }
        
        // Auto-save periodically
        if (this.currentSession.reasoning_chains.length % 10 === 0) {
            await this.saveSession(this.currentSession);
        }
        
        return reasoningEntry;
    }
    
    /**
     * Record a decision made by AI
     */
    async recordDecision(decision) {
        if (!this.currentSession || !this.currentSession.isRecording) {
            return;
        }
        
        const timestamp = Date.now() - this.currentSession.startTime;
        
        const decisionEntry = {
            id: crypto.randomUUID(),
            timestamp,
            type: 'decision',
            decision_type: decision.type || 'choice',
            question: decision.question || '',
            options: decision.options || [],
            chosen_option: decision.chosen || null,
            reasoning: decision.reasoning || '',
            confidence: decision.confidence || 0.8,
            impact_assessment: decision.impact || 'unknown',
            reversible: decision.reversible || false,
            
            // Context and consequences
            context: decision.context || {},
            prerequisites: decision.prerequisites || [],
            consequences: decision.consequences || [],
            alternative_outcomes: decision.alternatives || []
        };
        
        this.currentSession.decisions.push(decisionEntry);
        this.currentSession.timeline.push({
            timestamp,
            type: 'decision',
            entry_id: decisionEntry.id,
            importance: 'high' // Decisions are always important
        });
        
        if (this.options.realtimeMode) {
            this.emit('decision:made', {
                sessionId: this.currentSession.id,
                decision: decisionEntry
            });
        }
        
        return decisionEntry;
    }
    
    /**
     * Record human-AI interaction
     */
    async recordInteraction(interaction) {
        if (!this.currentSession || !this.currentSession.isRecording) {
            return;
        }
        
        const timestamp = Date.now() - this.currentSession.startTime;
        
        const interactionEntry = {
            id: crypto.randomUUID(),
            timestamp,
            type: 'interaction',
            interaction_type: interaction.type || 'message',
            participant: interaction.from || 'user',
            target: interaction.to || 'ai',
            content: interaction.content || '',
            intent: interaction.intent || 'unknown',
            response_time: interaction.response_time || 0,
            satisfaction_score: interaction.satisfaction || null,
            
            // Conversation context
            conversation_context: interaction.context || {},
            previous_messages: interaction.history || [],
            follow_up_actions: interaction.follow_up || []
        };
        
        this.currentSession.interactions.push(interactionEntry);
        this.currentSession.timeline.push({
            timestamp,
            type: 'interaction',
            entry_id: interactionEntry.id,
            importance: 'medium'
        });
        
        if (this.options.realtimeMode) {
            this.emit('interaction:recorded', {
                sessionId: this.currentSession.id,
                interaction: interactionEntry
            });
        }
        
        return interactionEntry;
    }
    
    /**
     * Record system events (component changes, errors, etc.)
     */
    async recordSystemEvent(event) {
        if (!this.currentSession || !this.currentSession.isRecording) {
            return;
        }
        
        const timestamp = Date.now() - this.currentSession.startTime;
        
        const eventEntry = {
            id: crypto.randomUUID(),
            timestamp,
            type: 'system_event',
            event_type: event.type || 'info',
            component: event.component || 'system',
            message: event.message || '',
            data: event.data || {},
            severity: event.severity || 'info',
            error_details: event.error || null,
            
            // System state
            system_state: event.system_state || {},
            affected_components: event.affected || [],
            recovery_actions: event.recovery || []
        };
        
        this.currentSession.system_events.push(eventEntry);
        this.currentSession.timeline.push({
            timestamp,
            type: 'system_event',
            entry_id: eventEntry.id,
            importance: event.severity === 'error' ? 'high' : 'low'
        });
        
        if (this.options.realtimeMode) {
            this.emit('system:event', {
                sessionId: this.currentSession.id,
                event: eventEntry
            });
        }
        
        return eventEntry;
    }
    
    /**
     * Pause recording
     */
    pauseRecording() {
        if (this.currentSession) {
            this.currentSession.isPaused = true;
            this.emit('recording:paused', { sessionId: this.currentSession.id });
        }
    }
    
    /**
     * Resume recording
     */
    resumeRecording() {
        if (this.currentSession) {
            this.currentSession.isPaused = false;
            this.emit('recording:resumed', { sessionId: this.currentSession.id });
        }
    }
    
    /**
     * Stop recording and finalize session
     */
    async stopRecording() {
        if (!this.currentSession) {
            return null;
        }
        
        const session = this.currentSession;
        session.isRecording = false;
        session.endTime = Date.now();
        session.duration = session.endTime - session.startTime;
        
        // Generate session statistics
        session.statistics = this.generateSessionStatistics(session);
        
        // Create session thumbnail/preview
        session.thumbnail = await this.generateSessionThumbnail(session);
        
        // Save final session
        await this.saveSession(session);
        
        // Update metadata
        this.sessionMetadata.set(session.id, {
            id: session.id,
            title: session.title,
            description: session.description,
            duration: session.duration,
            created: session.startTime,
            participants: session.participants,
            tags: session.tags,
            domain: session.domain,
            theme: session.theme,
            statistics: session.statistics,
            thumbnail: session.thumbnail
        });
        
        await this.saveSessionMetadata();
        
        this.activeRecordings.delete(session.id);
        this.currentSession = null;
        
        this.emit('recording:completed', {
            sessionId: session.id,
            session: this.sanitizeSessionForEmit(session)
        });
        
        this.stats.totalRecordings++;
        console.log(`🎬 Recording completed: ${session.id} (${session.duration}ms)`);
        
        return session;
    }
    
    /**
     * Start replaying a recorded session
     */
    async startReplay(sessionId, options = {}) {
        const session = await this.loadSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        const replayState = {
            sessionId,
            session,
            currentTime: 0,
            isPlaying: false,
            playbackSpeed: options.speed || 1.0,
            startTime: options.startTime || 0,
            endTime: options.endTime || session.duration,
            
            // Playback controls
            loop: options.loop || false,
            autoPlay: options.autoPlay || false,
            
            // View options
            tracks: options.tracks || ['reasoning', 'decisions', 'interactions', 'system_events'],
            perspective: options.perspective || 'timeline',
            
            // State
            playbackStarted: Date.now(),
            lastUpdate: Date.now()
        };
        
        this.replayingSessions.set(sessionId, replayState);
        
        if (replayState.autoPlay) {
            this.playReplay(sessionId);
        }
        
        this.emit('replay:started', {
            sessionId,
            replayState: this.sanitizeReplayStateForEmit(replayState)
        });
        
        this.stats.totalPlaybacks++;
        return replayState;
    }
    
    /**
     * Control replay playback
     */
    playReplay(sessionId) {
        const replay = this.replayingSessions.get(sessionId);
        if (!replay) return;
        
        replay.isPlaying = true;
        replay.lastUpdate = Date.now();
        
        const playbackLoop = () => {
            if (!replay.isPlaying) return;
            
            const now = Date.now();
            const deltaTime = (now - replay.lastUpdate) * replay.playbackSpeed;
            replay.currentTime += deltaTime;
            replay.lastUpdate = now;
            
            // Check if we've reached the end
            if (replay.currentTime >= replay.endTime) {
                if (replay.loop) {
                    replay.currentTime = replay.startTime;
                } else {
                    this.pauseReplay(sessionId);
                    return;
                }
            }
            
            // Emit current state
            this.emitReplayUpdate(sessionId, replay);
            
            // Continue playback
            setTimeout(playbackLoop, 16); // ~60fps
        };
        
        playbackLoop();
        
        this.emit('replay:playing', { sessionId });
    }
    
    pauseReplay(sessionId) {
        const replay = this.replayingSessions.get(sessionId);
        if (replay) {
            replay.isPlaying = false;
            this.emit('replay:paused', { sessionId });
        }
    }
    
    seekReplay(sessionId, time) {
        const replay = this.replayingSessions.get(sessionId);
        if (replay) {
            replay.currentTime = Math.max(0, Math.min(time, replay.session.duration));
            this.emitReplayUpdate(sessionId, replay);
            this.emit('replay:seeked', { sessionId, time: replay.currentTime });
        }
    }
    
    setReplaySpeed(sessionId, speed) {
        const replay = this.replayingSessions.get(sessionId);
        if (replay) {
            replay.playbackSpeed = Math.max(0.1, Math.min(speed, 10.0));
            this.emit('replay:speed_changed', { sessionId, speed: replay.playbackSpeed });
        }
    }
    
    emitReplayUpdate(sessionId, replay) {
        const currentEvents = this.getEventsAtTime(replay.session, replay.currentTime);
        
        this.emit('replay:update', {
            sessionId,
            currentTime: replay.currentTime,
            progress: replay.currentTime / replay.session.duration,
            events: currentEvents,
            isPlaying: replay.isPlaying,
            speed: replay.playbackSpeed
        });
    }
    
    getEventsAtTime(session, time) {
        const events = {
            reasoning: [],
            decisions: [],
            interactions: [],
            system_events: []
        };
        
        // Get events that are active at this time (with some tolerance)
        const tolerance = 500; // 500ms tolerance
        
        session.reasoning_chains.forEach(entry => {
            if (Math.abs(entry.timestamp - time) <= tolerance) {
                events.reasoning.push(entry);
            }
        });
        
        session.decisions.forEach(entry => {
            if (Math.abs(entry.timestamp - time) <= tolerance) {
                events.decisions.push(entry);
            }
        });
        
        session.interactions.forEach(entry => {
            if (Math.abs(entry.timestamp - time) <= tolerance) {
                events.interactions.push(entry);
            }
        });
        
        session.system_events.forEach(entry => {
            if (Math.abs(entry.timestamp - time) <= tolerance) {
                events.system_events.push(entry);
            }
        });
        
        return events;
    }
    
    /**
     * Create a bookmark at current time
     */
    addBookmark(sessionId, name, description = '') {
        const replay = this.replayingSessions.get(sessionId);
        if (!replay) return;
        
        const bookmark = {
            id: crypto.randomUUID(),
            sessionId,
            name,
            description,
            time: replay.currentTime,
            created: Date.now()
        };
        
        if (!this.bookmarks.has(sessionId)) {
            this.bookmarks.set(sessionId, []);
        }
        
        this.bookmarks.get(sessionId).push(bookmark);
        
        this.emit('bookmark:added', { sessionId, bookmark });
        return bookmark;
    }
    
    /**
     * Export session as shareable movie file
     */
    async exportSession(sessionId, format = 'json') {
        const session = await this.loadSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        
        const exportData = {
            session: session,
            bookmarks: this.bookmarks.get(sessionId) || [],
            metadata: this.sessionMetadata.get(sessionId),
            export_info: {
                exported_at: Date.now(),
                format: format,
                version: '1.0.0'
            }
        };
        
        const filename = `${sessionId}_export_${Date.now()}.${format}`;
        const filepath = path.join(this.options.recordingDir, 'exports', filename);
        
        switch (format) {
            case 'json':
                await fs.writeFile(filepath, JSON.stringify(exportData, null, 2));
                break;
            case 'csv':
                const csv = this.convertToCsv(session);
                await fs.writeFile(filepath, csv);
                break;
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
        
        this.emit('session:exported', { sessionId, filepath, format });
        return filepath;
    }
    
    // Utility methods
    generateSessionId() {
        return `session_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    generateSessionStatistics(session) {
        return {
            total_reasoning_steps: session.reasoning_chains.length,
            total_decisions: session.decisions.length,
            total_interactions: session.interactions.length,
            total_system_events: session.system_events.length,
            average_response_time: this.calculateAverageResponseTime(session),
            decision_accuracy: this.calculateDecisionAccuracy(session),
            reasoning_complexity: this.calculateReasoningComplexity(session),
            interaction_satisfaction: this.calculateInteractionSatisfaction(session)
        };
    }
    
    async generateSessionThumbnail(session) {
        // Generate a visual preview/thumbnail of the session
        // This would integrate with the 3D visualization system
        return {
            timeline_preview: 'base64_image_data',
            key_moments: this.extractKeyMoments(session),
            dominant_components: this.identifyDominantComponents(session)
        };
    }
    
    extractKeyMoments(session) {
        // Find the most important moments in the session
        const keyMoments = [];
        
        // High-confidence decisions
        session.decisions.forEach(decision => {
            if (decision.confidence > 0.9) {
                keyMoments.push({
                    timestamp: decision.timestamp,
                    type: 'decision',
                    importance: 'high',
                    description: decision.question
                });
            }
        });
        
        // Complex reasoning steps
        session.reasoning_chains.forEach(reasoning => {
            if (reasoning.processing_time > 1000) { // Took more than 1 second
                keyMoments.push({
                    timestamp: reasoning.timestamp,
                    type: 'reasoning',
                    importance: 'medium',
                    description: 'Complex reasoning step'
                });
            }
        });
        
        return keyMoments.sort((a, b) => a.timestamp - b.timestamp);
    }
    
    identifyDominantComponents(session) {
        const componentActivity = {};
        
        session.reasoning_chains.forEach(entry => {
            componentActivity[entry.component] = (componentActivity[entry.component] || 0) + 1;
        });
        
        return Object.entries(componentActivity)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([component, count]) => ({ component, activity: count }));
    }
    
    calculateAverageResponseTime(session) {
        const times = session.reasoning_chains.map(r => r.processing_time).filter(t => t > 0);
        return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    }
    
    calculateDecisionAccuracy(session) {
        // This would be enhanced with feedback data
        return 0.85; // Placeholder
    }
    
    calculateReasoningComplexity(session) {
        // Analyze reasoning chain complexity
        const averageSteps = session.reasoning_chains.length / Math.max(1, session.decisions.length);
        return Math.min(1, averageSteps / 10); // Normalize to 0-1
    }
    
    calculateInteractionSatisfaction(session) {
        const satisfactionScores = session.interactions
            .map(i => i.satisfaction_score)
            .filter(s => s !== null);
        
        return satisfactionScores.length > 0 
            ? satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length 
            : null;
    }
    
    async saveSession(session) {
        const filename = `${session.id}.json`;
        const filepath = path.join(this.options.recordingDir, 'sessions', filename);
        
        await fs.writeFile(filepath, JSON.stringify(session, null, 2));
    }
    
    async loadSession(sessionId) {
        const filename = `${sessionId}.json`;
        const filepath = path.join(this.options.recordingDir, 'sessions', filename);
        
        try {
            const data = await fs.readFile(filepath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Failed to load session ${sessionId}:`, error);
            return null;
        }
    }
    
    async loadSessionMetadata() {
        const metadataPath = path.join(this.options.recordingDir, 'metadata', 'sessions.json');
        
        try {
            const data = await fs.readFile(metadataPath, 'utf8');
            const metadata = JSON.parse(data);
            
            for (const [sessionId, sessionMeta] of Object.entries(metadata)) {
                this.sessionMetadata.set(sessionId, sessionMeta);
            }
        } catch (error) {
            // File doesn't exist yet, which is fine
        }
    }
    
    async saveSessionMetadata() {
        const metadataPath = path.join(this.options.recordingDir, 'metadata', 'sessions.json');
        const metadata = Object.fromEntries(this.sessionMetadata);
        
        await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    }
    
    sanitizeSessionForEmit(session) {
        // Remove large data arrays for real-time emission
        return {
            id: session.id,
            title: session.title,
            description: session.description,
            startTime: session.startTime,
            isRecording: session.isRecording,
            isPaused: session.isPaused,
            participants: session.participants,
            tags: session.tags,
            domain: session.domain,
            theme: session.theme
        };
    }
    
    sanitizeReplayStateForEmit(replayState) {
        return {
            sessionId: replayState.sessionId,
            currentTime: replayState.currentTime,
            isPlaying: replayState.isPlaying,
            playbackSpeed: replayState.playbackSpeed,
            tracks: replayState.tracks,
            perspective: replayState.perspective
        };
    }
    
    convertToCsv(session) {
        // Convert session data to CSV format for analysis
        const rows = [
            ['timestamp', 'type', 'component', 'content', 'confidence', 'processing_time']
        ];
        
        session.reasoning_chains.forEach(entry => {
            rows.push([
                entry.timestamp,
                'reasoning',
                entry.component,
                entry.reasoning_text,
                entry.confidence,
                entry.processing_time
            ]);
        });
        
        session.decisions.forEach(entry => {
            rows.push([
                entry.timestamp,
                'decision',
                'decision_engine',
                entry.question,
                entry.confidence,
                0
            ]);
        });
        
        return rows.map(row => row.join(',')).join('\n');
    }
    
    // Public API methods
    getActiveRecordings() {
        return Array.from(this.activeRecordings.values()).map(this.sanitizeSessionForEmit);
    }
    
    getSessionList() {
        return Array.from(this.sessionMetadata.values());
    }
    
    getReplayStatus(sessionId) {
        const replay = this.replayingSessions.get(sessionId);
        return replay ? this.sanitizeReplayStateForEmit(replay) : null;
    }
    
    getStats() {
        return { ...this.stats };
    }
}

module.exports = ReasoningReplayEngine;