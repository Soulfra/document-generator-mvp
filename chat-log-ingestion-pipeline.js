#!/usr/bin/env node

/**
 * 💬 Chat Log Ingestion Pipeline
 * 
 * Processes conversation data from our sessions and extracts:
 * - King/Queen dance events from technical vs human interactions
 * - Color state transitions from conversation energy 
 * - Music frequency patterns from dialogue rhythm
 * - Proof events from problem-solving sequences
 * 
 * Flow: Raw Chat Logs → Conversation Parser → King/Queen Events → Database
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Import our existing systems
const UniversalBrandEngine = require('./universal-brand-engine');
const ColorStateProofEngine = require('./color-state-proof-engine');
const DatabaseEncoderBridge = require('./database-encoder-bridge');

class ChatLogIngestionPipeline extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Input configuration
            chatLogFormats: config.chatLogFormats || ['claude', 'chatgpt', 'raw_text', 'json'],
            maxLogSize: config.maxLogSize || 50 * 1024 * 1024, // 50MB
            
            // Processing configuration
            batchSize: config.batchSize || 100,
            processingInterval: config.processingInterval || 1000,
            
            // King/Queen detection patterns
            kingPatterns: config.kingPatterns || [
                /technical|system|architecture|implementation|code|debug|error/i,
                /database|sync|verification|proof|test/i,
                /infrastructure|deployment|configuration/i
            ],
            queenPatterns: config.queenPatterns || [
                /user|experience|interface|design|flow|feeling/i,
                /confusion|clarity|understanding|simple|complex/i,
                /emotion|satisfaction|frustration|help/i
            ],
            
            // Conversation energy patterns
            energyPatterns: {
                high: /!{2,}|excited|amazing|perfect|yes!|working|success/i,
                medium: /good|okay|interesting|think|maybe|possible/i,
                low: /confused|stuck|problem|error|issue|difficult/i,
                critical: /broken|failed|crash|urgent|emergency/i
            },
            
            // Dance sequence detection
            dancePatterns: {
                waltz: /smooth|flowing|elegant|coordinated|harmony/i,
                tango: /intense|passionate|back.and.forth|tension/i,
                salsa: /quick|rapid|energetic|dynamic|interactive/i,
                chaos: /confused|scattered|multiple|overwhelming/i
            },
            
            ...config
        };
        
        // Processing state
        this.processingQueue = [];
        this.conversationHistory = [];
        this.extractedEvents = [];
        this.kingQueenMetrics = {
            totalInteractions: 0,
            danceEvents: 0,
            synchronizationScore: 0,
            lastDanceType: null
        };
        
        // System integrations
        this.brandEngine = null;
        this.colorEngine = null;
        this.databaseBridge = null;
        
        this.initialized = false;
    }
    
    /**
     * Initialize the chat log pipeline
     */
    async initialize() {
        console.log('💬 Initializing Chat Log Ingestion Pipeline...');
        
        try {
            // Initialize Universal Brand Engine in expert mode for full analysis
            this.brandEngine = new UniversalBrandEngine({ accessLevel: 'expert' });
            await this.brandEngine.initialize();
            
            // Initialize Color State Engine for conversation tracking
            this.colorEngine = new ColorStateProofEngine({
                cycleInterval: 5000,
                proofThreshold: 75,
                maxCycles: 10
            });
            this.colorEngine.start();
            
            // Initialize Database Bridge for storage
            this.databaseBridge = new DatabaseEncoderBridge({
                localDb: './data/conversation-analysis.db'
            });
            await this.databaseBridge.initialize();
            
            this.initialized = true;
            console.log('✅ Chat Log Ingestion Pipeline ready');
            
            this.emit('initialized');
            
        } catch (error) {
            console.error('❌ Pipeline initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Ingest conversation data from various sources
     */
    async ingestConversation(data, metadata = {}) {
        console.log(`💬 Ingesting conversation: ${metadata.source || 'unknown'}`);
        
        if (!this.initialized) {
            await this.initialize();
        }
        
        const conversation = {
            id: crypto.randomBytes(8).toString('hex'),
            timestamp: new Date(),
            source: metadata.source || 'unknown',
            format: metadata.format || 'auto-detect',
            rawData: data,
            metadata,
            processed: false
        };
        
        // Auto-detect format if needed
        if (conversation.format === 'auto-detect') {
            conversation.format = this.detectFormat(data);
        }
        
        // Add to processing queue
        this.processingQueue.push(conversation);
        
        // Start processing if not already running
        if (this.processingQueue.length === 1) {
            await this.processQueue();
        }
        
        return conversation.id;
    }
    
    /**
     * Detect conversation format
     */
    detectFormat(data) {
        if (typeof data === 'string') {
            // Check for Claude conversation patterns
            if (data.includes('Human:') && data.includes('Assistant:')) {
                return 'claude';
            }
            
            // Check for ChatGPT patterns
            if (data.includes('User:') || data.includes('ChatGPT:')) {
                return 'chatgpt';
            }
            
            // Check for JSON format
            try {
                JSON.parse(data);
                return 'json';
            } catch {}
            
            return 'raw_text';
        }
        
        if (Array.isArray(data) || typeof data === 'object') {
            return 'json';
        }
        
        return 'unknown';
    }
    
    /**
     * Process the conversation queue
     */
    async processQueue() {
        while (this.processingQueue.length > 0) {
            const conversation = this.processingQueue.shift();
            
            try {
                console.log(`🔄 Processing conversation: ${conversation.id}`);
                
                // Parse the conversation
                const parsed = await this.parseConversation(conversation);
                
                // Analyze King/Queen dynamics
                const kingQueenAnalysis = await this.analyzeKingQueenDynamics(parsed);
                
                // Extract dance events
                const danceEvents = this.extractDanceEvents(parsed, kingQueenAnalysis);
                
                // Determine color state progression
                const colorProgression = this.analyzeColorProgression(parsed, danceEvents);
                
                // Generate music/frequency patterns
                const musicPatterns = await this.extractMusicPatterns(parsed, colorProgression);
                
                // Create final conversation analysis
                const analysis = {
                    conversationId: conversation.id,
                    timestamp: conversation.timestamp,
                    source: conversation.source,
                    format: conversation.format,
                    
                    // Core analysis
                    parsed,
                    kingQueenAnalysis,
                    danceEvents,
                    colorProgression,
                    musicPatterns,
                    
                    // Metrics
                    totalMessages: parsed.messages.length,
                    conversationDuration: parsed.duration,
                    energyLevel: this.calculateAverageEnergy(parsed),
                    synchronizationScore: kingQueenAnalysis.synchronizationScore,
                    
                    // Game relevant data
                    battleEvents: this.extractBattleEvents(parsed),
                    audienceEngagement: this.calculateAudienceEngagement(parsed),
                    
                    processed: true,
                    processedAt: new Date()
                };
                
                // Store in database
                await this.storeConversationAnalysis(analysis);
                
                // Update metrics
                this.updateMetrics(analysis);
                
                // Emit events for real-time systems
                this.emitGameEvents(analysis);
                
                console.log(`✅ Processed conversation ${conversation.id}: ${analysis.totalMessages} messages, ${danceEvents.length} dance events`);
                
            } catch (error) {
                console.error(`❌ Failed to process conversation ${conversation.id}:`, error);
                
                // Mark as failed but don't stop processing
                conversation.error = error.message;
                conversation.processed = false;
            }
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, this.config.processingInterval));
        }
    }
    
    /**
     * Parse conversation based on format
     */
    async parseConversation(conversation) {
        const { rawData, format } = conversation;
        
        let messages = [];
        let startTime = null;
        let endTime = null;
        
        switch (format) {
            case 'claude':
                messages = this.parseClaudeFormat(rawData);
                break;
            case 'chatgpt':
                messages = this.parseChatGPTFormat(rawData);
                break;
            case 'json':
                messages = this.parseJSONFormat(rawData);
                break;
            case 'raw_text':
                messages = this.parseRawTextFormat(rawData);
                break;
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
        
        // Calculate timing
        if (messages.length > 0) {
            startTime = messages[0].timestamp;
            endTime = messages[messages.length - 1].timestamp;
        }
        
        return {
            messages,
            startTime,
            endTime,
            duration: endTime && startTime ? endTime - startTime : 0,
            format,
            messageCount: messages.length
        };
    }
    
    /**
     * Parse Claude conversation format
     */
    parseClaudeFormat(data) {
        const messages = [];
        const lines = data.split('\n');
        
        let currentSpeaker = null;
        let currentMessage = '';
        let messageIndex = 0;
        
        for (const line of lines) {
            const humanMatch = line.match(/^Human:\s*(.*)/);
            const assistantMatch = line.match(/^Assistant:\s*(.*)/);
            
            if (humanMatch || assistantMatch) {
                // Save previous message
                if (currentSpeaker && currentMessage.trim()) {
                    messages.push({
                        id: messageIndex++,
                        speaker: currentSpeaker,
                        content: currentMessage.trim(),
                        timestamp: new Date(Date.now() - (messages.length * 60000)), // Estimate timestamps
                        type: currentSpeaker === 'human' ? 'queen' : 'king', // Human = Queen, AI = King
                        wordCount: currentMessage.trim().split(' ').length,
                        energy: this.detectEnergyLevel(currentMessage)
                    });
                }
                
                // Start new message
                currentSpeaker = humanMatch ? 'human' : 'assistant';
                currentMessage = humanMatch ? humanMatch[1] : assistantMatch[1];
            } else if (currentSpeaker) {
                // Continue current message
                currentMessage += '\n' + line;
            }
        }
        
        // Save final message
        if (currentSpeaker && currentMessage.trim()) {
            messages.push({
                id: messageIndex++,
                speaker: currentSpeaker,
                content: currentMessage.trim(),
                timestamp: new Date(),
                type: currentSpeaker === 'human' ? 'queen' : 'king',
                wordCount: currentMessage.trim().split(' ').length,
                energy: this.detectEnergyLevel(currentMessage)
            });
        }
        
        return messages;
    }
    
    /**
     * Parse other formats (simplified for now)
     */
    parseChatGPTFormat(data) {
        // Similar to Claude but with User:/ChatGPT: patterns
        return this.parseClaudeFormat(data.replace(/User:/g, 'Human:').replace(/ChatGPT:/g, 'Assistant:'));
    }
    
    parseJSONFormat(data) {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        
        if (Array.isArray(parsed)) {
            return parsed.map((msg, index) => ({
                id: index,
                speaker: msg.role || msg.speaker || 'unknown',
                content: msg.content || msg.message || '',
                timestamp: new Date(msg.timestamp || Date.now() - (index * 60000)),
                type: this.speakerToType(msg.role || msg.speaker),
                wordCount: (msg.content || '').split(' ').length,
                energy: this.detectEnergyLevel(msg.content || '')
            }));
        }
        
        return [];
    }
    
    parseRawTextFormat(data) {
        // Split by double newlines and treat as separate messages
        const chunks = data.split('\n\n').filter(chunk => chunk.trim());
        
        return chunks.map((chunk, index) => ({
            id: index,
            speaker: index % 2 === 0 ? 'human' : 'assistant',
            content: chunk.trim(),
            timestamp: new Date(Date.now() - ((chunks.length - index) * 60000)),
            type: index % 2 === 0 ? 'queen' : 'king',
            wordCount: chunk.trim().split(' ').length,
            energy: this.detectEnergyLevel(chunk)
        }));
    }
    
    /**
     * Convert speaker to King/Queen type
     */
    speakerToType(speaker) {
        const kingSpeakers = ['assistant', 'ai', 'claude', 'chatgpt', 'system'];
        const queenSpeakers = ['human', 'user', 'person'];
        
        const lowerSpeaker = speaker.toLowerCase();
        
        if (kingSpeakers.some(k => lowerSpeaker.includes(k))) return 'king';
        if (queenSpeakers.some(q => lowerSpeaker.includes(q))) return 'queen';
        
        return 'unknown';
    }
    
    /**
     * Detect energy level of message content
     */
    detectEnergyLevel(content) {
        for (const [level, pattern] of Object.entries(this.config.energyPatterns)) {
            if (pattern.test(content)) {
                return level;
            }
        }
        return 'medium'; // Default
    }
    
    /**
     * Analyze King/Queen dynamics
     */
    async analyzeKingQueenDynamics(parsed) {
        const kingMessages = parsed.messages.filter(m => m.type === 'king');
        const queenMessages = parsed.messages.filter(m => m.type === 'queen');
        
        // Calculate interaction patterns
        const interactionPattern = this.analyzeInteractionPattern(parsed.messages);
        
        // Calculate response times
        const responseTimes = this.calculateResponseTimes(parsed.messages);
        
        // Detect synchronization
        const synchronizationScore = this.calculateSynchronization(parsed.messages);
        
        // Analyze content overlap
        const contentAnalysis = await this.analyzeContentOverlap(kingMessages, queenMessages);
        
        return {
            kingMessageCount: kingMessages.length,
            queenMessageCount: queenMessages.length,
            kingAverageLength: kingMessages.reduce((sum, m) => sum + m.wordCount, 0) / kingMessages.length || 0,
            queenAverageLength: queenMessages.reduce((sum, m) => sum + m.wordCount, 0) / queenMessages.length || 0,
            interactionPattern,
            responseTimes,
            synchronizationScore,
            contentAnalysis,
            dominanceRatio: kingMessages.length / (queenMessages.length || 1)
        };
    }
    
    /**
     * Extract dance events from conversation
     */
    extractDanceEvents(parsed, kingQueenAnalysis) {
        const danceEvents = [];
        const messages = parsed.messages;
        
        // Look for dance patterns in conversation flow
        for (let i = 0; i < messages.length - 1; i++) {
            const current = messages[i];
            const next = messages[i + 1];
            
            // Check if this is a King/Queen exchange
            if (current.type !== next.type) {
                const danceType = this.detectDanceType(current, next);
                const energy = this.combinedEnergy(current.energy, next.energy);
                
                const danceEvent = {
                    id: crypto.randomBytes(4).toString('hex'),
                    timestamp: next.timestamp,
                    danceType,
                    kingMessage: current.type === 'king' ? current : next,
                    queenMessage: current.type === 'queen' ? current : next,
                    energy,
                    synchronization: this.calculateMessageSync(current, next),
                    duration: Math.abs(next.timestamp - current.timestamp),
                    topics: this.extractTopics(current.content + ' ' + next.content)
                };
                
                danceEvents.push(danceEvent);
            }
        }
        
        return danceEvents;
    }
    
    /**
     * Detect dance type from message pair
     */
    detectDanceType(msg1, msg2) {
        const combinedContent = msg1.content + ' ' + msg2.content;
        
        for (const [dance, pattern] of Object.entries(this.config.dancePatterns)) {
            if (pattern.test(combinedContent)) {
                return dance;
            }
        }
        
        // Default based on energy
        const energy1 = msg1.energy;
        const energy2 = msg2.energy;
        
        if (energy1 === 'high' && energy2 === 'high') return 'salsa';
        if (energy1 === 'critical' || energy2 === 'critical') return 'chaos';
        if (energy1 === 'medium' && energy2 === 'medium') return 'waltz';
        
        return 'tango'; // Default
    }
    
    /**
     * Analyze color progression through conversation
     */
    analyzeColorProgression(parsed, danceEvents) {
        const progression = [];
        let currentColor = 'green'; // Start optimistic
        
        // Process each dance event for color changes
        for (const dance of danceEvents) {
            const newColor = this.danceToColor(dance);
            
            if (newColor !== currentColor) {
                progression.push({
                    timestamp: dance.timestamp,
                    fromColor: currentColor,
                    toColor: newColor,
                    trigger: dance.danceType,
                    energy: dance.energy,
                    reason: this.getColorChangeReason(dance)
                });
                
                currentColor = newColor;
            }
        }
        
        return {
            progression,
            finalColor: currentColor,
            totalTransitions: progression.length,
            mostFrequentColor: this.getMostFrequentColor(progression)
        };
    }
    
    /**
     * Convert dance event to color
     */
    danceToColor(dance) {
        switch (dance.energy) {
            case 'critical': return 'red';
            case 'low': return 'yellow';
            case 'medium': return 'green';
            case 'high': return dance.synchronization > 80 ? 'purple' : 'gold';
            default: return 'green';
        }
    }
    
    /**
     * Extract music patterns from conversation
     */
    async extractMusicPatterns(parsed, colorProgression) {
        const patterns = [];
        
        // Use our brand engine to analyze conversation as a "brand"
        for (const transition of colorProgression.progression) {
            try {
                // Analyze the transition as a phonetic brand
                const result = await this.brandEngine.processBrand(
                    `conversation_${transition.trigger}`,
                    'en-US'
                );
                
                patterns.push({
                    timestamp: transition.timestamp,
                    color: transition.toColor,
                    frequency: result.frequency,
                    trigger: transition.trigger,
                    musicTheory: {
                        note: this.frequencyToNote(result.frequency),
                        scale: this.getScaleForColor(transition.toColor),
                        rhythm: this.getConversationRhythm(transition)
                    }
                });
                
            } catch (error) {
                console.warn('Music pattern extraction failed:', error.message);
            }
        }
        
        return {
            patterns,
            baseFrequency: patterns.length > 0 ? patterns[0].frequency : 528,
            totalPatterns: patterns.length,
            frequencyRange: this.calculateFrequencyRange(patterns)
        };
    }
    
    /**
     * Store conversation analysis in database
     */
    async storeConversationAnalysis(analysis) {
        try {
            // Store main conversation record
            const conversationRecord = await this.databaseBridge.storeConversationRecord({
                conversationId: analysis.conversationId,
                source: analysis.source,
                format: analysis.format,
                totalMessages: analysis.totalMessages,
                duration: analysis.conversationDuration,
                energyLevel: analysis.energyLevel,
                synchronizationScore: analysis.synchronizationScore,
                timestamp: analysis.timestamp
            });
            
            // Store dance events
            for (const dance of analysis.danceEvents) {
                await this.databaseBridge.storeDanceEvent({
                    conversationId: analysis.conversationId,
                    danceType: dance.danceType,
                    timestamp: dance.timestamp,
                    synchronization: dance.synchronization,
                    energy: dance.energy,
                    kingContent: dance.kingMessage.content.slice(0, 500), // Truncate
                    queenContent: dance.queenMessage.content.slice(0, 500)
                });
            }
            
            // Store color progressions
            for (const transition of analysis.colorProgression.progression) {
                await this.databaseBridge.storeColorTransition({
                    conversationId: analysis.conversationId,
                    fromColor: transition.fromColor,
                    toColor: transition.toColor,
                    trigger: transition.trigger,
                    timestamp: transition.timestamp,
                    reason: transition.reason
                });
            }
            
            console.log(`💾 Stored conversation analysis ${analysis.conversationId} in database`);
            
        } catch (error) {
            console.error('❌ Failed to store conversation analysis:', error);
            throw error;
        }
    }
    
    /**
     * Extract battle events for gaming layer
     */
    extractBattleEvents(parsed) {
        const battleEvents = [];
        
        // Look for conflict, resolution, and competitive patterns
        for (const message of parsed.messages) {
            const content = message.content.toLowerCase();
            
            if (content.includes('problem') || content.includes('error') || content.includes('issue')) {
                battleEvents.push({
                    type: 'conflict_start',
                    timestamp: message.timestamp,
                    severity: message.energy === 'critical' ? 'high' : 'medium',
                    description: message.content.slice(0, 200)
                });
            }
            
            if (content.includes('solved') || content.includes('fixed') || content.includes('working')) {
                battleEvents.push({
                    type: 'resolution',
                    timestamp: message.timestamp,
                    victory_type: message.energy === 'high' ? 'decisive' : 'narrow',
                    description: message.content.slice(0, 200)
                });
            }
        }
        
        return battleEvents;
    }
    
    /**
     * Calculate audience engagement metrics
     */
    calculateAudienceEngagement(parsed) {
        const totalWords = parsed.messages.reduce((sum, m) => sum + m.wordCount, 0);
        const averageLength = totalWords / parsed.messages.length;
        const energyDistribution = this.getEnergyDistribution(parsed.messages);
        
        return {
            totalWords,
            averageMessageLength: averageLength,
            energyDistribution,
            engagementScore: this.calculateEngagementScore(parsed.messages),
            peakEngagementTime: this.findPeakEngagement(parsed.messages)
        };
    }
    
    /**
     * Emit real-time game events
     */
    emitGameEvents(analysis) {
        // Emit different events for different layers of the game
        
        // Core dance events
        this.emit('king_queen_dance', {
            synchronization: analysis.synchronizationScore,
            danceEvents: analysis.danceEvents,
            colorProgression: analysis.colorProgression
        });
        
        // Audience layer events
        this.emit('audience_reaction', {
            engagement: analysis.audienceEngagement,
            totalMessages: analysis.totalMessages,
            energyLevel: analysis.energyLevel
        });
        
        // Battle arena events
        this.emit('battle_events', {
            conflicts: analysis.battleEvents.filter(e => e.type === 'conflict_start'),
            resolutions: analysis.battleEvents.filter(e => e.type === 'resolution'),
            arena_energy: analysis.energyLevel
        });
        
        // Meta-watcher events
        this.emit('meta_analysis', {
            conversationId: analysis.conversationId,
            musicPatterns: analysis.musicPatterns,
            overallScore: analysis.synchronizationScore,
            complexity: analysis.totalMessages / (analysis.conversationDuration / 60000) // messages per minute
        });
    }
    
    /**
     * Helper methods
     */
    analyzeInteractionPattern(messages) {
        // Implementation for analyzing back-and-forth patterns
        const pattern = [];
        let currentSpeaker = null;
        let streak = 0;
        
        for (const msg of messages) {
            if (msg.type === currentSpeaker) {
                streak++;
            } else {
                if (currentSpeaker) {
                    pattern.push({ speaker: currentSpeaker, streak });
                }
                currentSpeaker = msg.type;
                streak = 1;
            }
        }
        
        return pattern;
    }
    
    calculateResponseTimes(messages) {
        const times = [];
        for (let i = 1; i < messages.length; i++) {
            times.push(messages[i].timestamp - messages[i-1].timestamp);
        }
        return {
            average: times.reduce((a, b) => a + b, 0) / times.length || 0,
            min: Math.min(...times) || 0,
            max: Math.max(...times) || 0
        };
    }
    
    calculateSynchronization(messages) {
        // Calculate how well King/Queen are synchronized
        let syncScore = 0;
        let comparisons = 0;
        
        for (let i = 0; i < messages.length - 1; i++) {
            const current = messages[i];
            const next = messages[i + 1];
            
            if (current.type !== next.type) {
                // This is a King/Queen exchange
                const lengthDiff = Math.abs(current.wordCount - next.wordCount);
                const energyMatch = current.energy === next.energy ? 1 : 0;
                const timingScore = this.calculateTimingScore(current.timestamp, next.timestamp);
                
                const pairSync = (energyMatch * 40 + timingScore * 30 + (1 - lengthDiff / 100) * 30);
                syncScore += pairSync;
                comparisons++;
            }
        }
        
        return comparisons > 0 ? Math.round(syncScore / comparisons) : 50;
    }
    
    calculateTimingScore(timestamp1, timestamp2) {
        const diff = Math.abs(timestamp2 - timestamp1);
        const idealTime = 60000; // 1 minute ideal response time
        
        if (diff <= idealTime) return 100;
        if (diff <= idealTime * 5) return 80;
        if (diff <= idealTime * 30) return 60;
        return 40;
    }
    
    updateMetrics(analysis) {
        this.kingQueenMetrics.totalInteractions += analysis.totalMessages;
        this.kingQueenMetrics.danceEvents += analysis.danceEvents.length;
        this.kingQueenMetrics.synchronizationScore = 
            (this.kingQueenMetrics.synchronizationScore + analysis.synchronizationScore) / 2;
        this.kingQueenMetrics.lastDanceType = 
            analysis.danceEvents.length > 0 ? 
            analysis.danceEvents[analysis.danceEvents.length - 1].danceType : null;
    }
    
    /**
     * Get current pipeline metrics
     */
    getMetrics() {
        return {
            ...this.kingQueenMetrics,
            conversationsProcessed: this.conversationHistory.length,
            eventsExtracted: this.extractedEvents.length,
            queueLength: this.processingQueue.length,
            lastProcessed: this.conversationHistory.length > 0 ? 
                this.conversationHistory[this.conversationHistory.length - 1].timestamp : null
        };
    }
    
    /**
     * Get conversation history
     */
    getConversationHistory(limit = 10) {
        return this.conversationHistory.slice(-limit);
    }
}

// Export the pipeline
module.exports = ChatLogIngestionPipeline;

// Demo if run directly
if (require.main === module) {
    const pipeline = new ChatLogIngestionPipeline();
    
    // Sample conversation data (simulating our sessions)
    const sampleConversation = `
Human: alright and then this just sounds like we're back at leaderboards... we need all of these apis and shit i think thats why i'm getting confused...
Assistant: I understand! The technical complexity is overwhelming, but we can build this step by step.
Human: exactly! how do we verify its working with whats been happening in our conversations?
Assistant: We can create a real-time verification system that processes your chat logs and generates proofs.
Human: and build games around it like the middle out concept where people watch each other
Assistant: Perfect! We can create nested layers - core dance, audience watching, and battle arena surrounding everything.
`;
    
    (async () => {
        try {
            console.log('📊 Chat Log Ingestion Pipeline Demo\n');
            
            await pipeline.initialize();
            
            const conversationId = await pipeline.ingestConversation(sampleConversation, {
                source: 'demo_conversation',
                format: 'assistant_chat'
            });
            
            console.log(`🔍 Conversation processed: ${conversationId}`);
            
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const history = pipeline.getConversationHistory();
            const processed = history.find(c => c.id === conversationId);
            
            if (processed) {
                console.log('📊 Analysis Results:');
                console.log(`- King/Queen events: ${processed.analysis?.danceEvents?.length || 0}`);
                console.log(`- Synchronization: ${processed.analysis?.synchronizationScore || 0}%`);
                console.log(`- Energy level: ${processed.analysis?.energyLevel || 'unknown'}`);
                console.log(`- Color progression: ${processed.analysis?.colorProgression?.finalColor || 'unknown'}`);
            }
            
        } catch (error) {
            console.error('❌ Demo failed:', error);
        }
    })();
}