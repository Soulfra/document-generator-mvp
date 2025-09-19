#!/usr/bin/env node

/**
 * CAL CHAT LOG PROCESSOR
 * Processes chat logs, music, voice, and typing patterns to build contextual worlds
 * Integrates with the voxelized MCP and remote world builder
 */

const express = require('express');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CALChatLogProcessor {
    constructor() {
        this.app = express();
        this.port = 7879; // Chat processor port
        
        this.processingState = {
            chat_logs: new Map(),
            music_analysis: new Map(),
            voice_patterns: new Map(),
            typing_rhythms: new Map(),
            world_context: {
                current_mood: 'analytical',
                activity_level: 'high',
                focus_areas: ['voxelization', 'systems', 'world-building'],
                personality_traits: new Map()
            },
            learning_stats: {
                words_processed: 0,
                conversations_analyzed: 0,
                patterns_detected: 0,
                worlds_generated: 0
            }
        };

        // Pattern recognition engines
        this.patternEngines = {
            conversation: new ConversationPatternEngine(),
            music: new MusicContextEngine(),
            voice: new VoiceAnalysisEngine(),
            typing: new TypingPatternEngine(),
            world: new WorldGenerationEngine()
        };

        this.initializeProcessor();
        this.setupRoutes();
        this.connectToMCP();
    }

    initializeProcessor() {
        console.log('🧠 Initializing CAL Chat Log Processor...');
        console.log('💬 Loading conversation analysis engines...');
        console.log('🎵 Initializing music context analysis...');
        console.log('🎤 Setting up voice pattern recognition...');
        console.log('⌨️ Activating typing rhythm analysis...');
        
        // Load existing chat logs if available
        this.loadExistingLogs();
        
        // Start continuous processing
        this.startContinuousProcessing();
    }

    async loadExistingLogs() {
        try {
            // Look for common chat log formats
            const possiblePaths = [
                path.join(process.env.HOME, 'Downloads'),
                path.join(process.env.HOME, 'Documents'),
                path.join(process.cwd(), 'chat-logs'),
                '/tmp/chat-exports'
            ];

            for (const dirPath of possiblePaths) {
                try {
                    const files = await fs.readdir(dirPath);
                    
                    for (const file of files) {
                        if (this.isChatLogFile(file)) {
                            await this.processChatLogFile(path.join(dirPath, file));
                        }
                    }
                } catch (error) {
                    // Directory doesn't exist or no access
                }
            }
        } catch (error) {
            console.log('No existing chat logs found, starting fresh');
        }
    }

    isChatLogFile(filename) {
        const chatFormats = [
            /whatsapp.*\.txt$/i,
            /telegram.*\.json$/i,
            /discord.*\.json$/i,
            /slack.*\.json$/i,
            /chat.*\.(txt|json)$/i,
            /conversation.*\.(txt|json)$/i,
            /claude.*\.(txt|json|md)$/i,
            /chatgpt.*\.(txt|json|md)$/i
        ];

        return chatFormats.some(pattern => pattern.test(filename));
    }

    async processChatLogFile(filePath) {
        try {
            console.log(`📄 Processing chat log: ${path.basename(filePath)}`);
            
            const content = await fs.readFile(filePath, 'utf8');
            const format = this.detectChatFormat(content, filePath);
            
            let messages = [];
            
            switch (format) {
                case 'whatsapp':
                    messages = this.parseWhatsAppLog(content);
                    break;
                case 'claude':
                case 'chatgpt':
                    messages = this.parseAIConversation(content);
                    break;
                case 'json':
                    messages = this.parseJSONChat(content);
                    break;
                default:
                    messages = this.parseGenericChat(content);
            }

            // Process messages for patterns
            const analysis = await this.analyzeConversation(messages);
            
            // Store in processing state
            const logId = crypto.createHash('md5').update(filePath).digest('hex');
            this.processingState.chat_logs.set(logId, {
                file: filePath,
                format: format,
                messages: messages,
                analysis: analysis,
                processed_at: Date.now()
            });

            this.processingState.learning_stats.conversations_analyzed++;
            this.processingState.learning_stats.words_processed += this.countWords(messages);

            console.log(`✅ Processed ${messages.length} messages from ${path.basename(filePath)}`);
            
        } catch (error) {
            console.error(`Error processing ${filePath}:`, error.message);
        }
    }

    detectChatFormat(content, filePath) {
        const filename = path.basename(filePath).toLowerCase();
        
        if (filename.includes('whatsapp') || content.match(/^\[\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}\]/m)) {
            return 'whatsapp';
        }
        
        if (filename.includes('claude') || content.includes('Claude') || content.includes('Assistant:')) {
            return 'claude';
        }
        
        if (filename.includes('chatgpt') || content.includes('ChatGPT') || content.includes('User:')) {
            return 'chatgpt';
        }
        
        try {
            JSON.parse(content);
            return 'json';
        } catch {}
        
        return 'generic';
    }

    parseWhatsAppLog(content) {
        const messages = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            const match = line.match(/^\[(\d{2}\/\d{2}\/\d{4}), (\d{2}:\d{2}:\d{2})\] ([^:]+): (.+)$/);
            if (match) {
                messages.push({
                    timestamp: new Date(`${match[1]} ${match[2]}`),
                    sender: match[3],
                    content: match[4],
                    type: 'text'
                });
            }
        }
        
        return messages;
    }

    parseAIConversation(content) {
        const messages = [];
        const sections = content.split(/\n(?=Human:|User:|Assistant:|Claude:)/);
        
        for (const section of sections) {
            const lines = section.trim().split('\n');
            if (lines.length === 0) continue;
            
            const firstLine = lines[0];
            let sender = 'unknown';
            let content = section;
            
            if (firstLine.startsWith('Human:') || firstLine.startsWith('User:')) {
                sender = 'human';
                content = section.replace(/^(Human:|User:)\s*/, '');
            } else if (firstLine.startsWith('Assistant:') || firstLine.startsWith('Claude:')) {
                sender = 'assistant';
                content = section.replace(/^(Assistant:|Claude:)\s*/, '');
            }
            
            if (content.trim()) {
                messages.push({
                    timestamp: new Date(),
                    sender: sender,
                    content: content.trim(),
                    type: 'text'
                });
            }
        }
        
        return messages;
    }

    parseJSONChat(content) {
        try {
            const data = JSON.parse(content);
            
            if (Array.isArray(data)) {
                return data.map(msg => ({
                    timestamp: new Date(msg.timestamp || msg.created_at || Date.now()),
                    sender: msg.sender || msg.user || msg.author || 'unknown',
                    content: msg.content || msg.text || msg.message || '',
                    type: msg.type || 'text'
                }));
            }
            
            return [];
        } catch (error) {
            return [];
        }
    }

    parseGenericChat(content) {
        const messages = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.trim()) {
                // Try to extract timestamp and sender
                const timestampMatch = line.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
                const timestamp = timestampMatch ? timestampMatch[1] : null;
                
                messages.push({
                    timestamp: new Date(),
                    sender: 'unknown',
                    content: line.trim(),
                    type: 'text'
                });
            }
        }
        
        return messages;
    }

    async analyzeConversation(messages) {
        const analysis = {
            topics: new Map(),
            sentiment: { positive: 0, negative: 0, neutral: 0 },
            complexity: 0,
            technical_terms: new Set(),
            patterns: new Set(),
            world_building_elements: new Set()
        };

        for (const message of messages) {
            // Extract topics
            const topics = this.extractTopics(message.content);
            topics.forEach(topic => {
                analysis.topics.set(topic, (analysis.topics.get(topic) || 0) + 1);
            });

            // Analyze sentiment
            const sentiment = this.analyzeSentiment(message.content);
            analysis.sentiment[sentiment]++;

            // Detect technical terms
            const techTerms = this.extractTechnicalTerms(message.content);
            techTerms.forEach(term => analysis.technical_terms.add(term));

            // Find patterns
            const patterns = this.detectConversationPatterns(message.content);
            patterns.forEach(pattern => analysis.patterns.add(pattern));

            // Identify world-building elements
            const worldElements = this.extractWorldBuildingElements(message.content);
            worldElements.forEach(element => analysis.world_building_elements.add(element));
        }

        // Calculate complexity
        analysis.complexity = this.calculateComplexity(messages);

        return analysis;
    }

    extractTopics(content) {
        const topics = [];
        const topicKeywords = {
            'voxelization': /voxel|voxelized|3d.?grid|cube/i,
            'ai_systems': /ai|artificial.?intelligence|neural|machine.?learning/i,
            'blockchain': /blockchain|crypto|hash|proof|chain/i,
            'web_development': /html|css|javascript|react|node|api/i,
            'data_processing': /data|process|parse|analyze|extract/i,
            'world_building': /world|universe|environment|scene|reality/i,
            'automation': /automat|script|pipeline|workflow/i,
            'visualization': /visual|render|display|interface|ui/i
        };

        for (const [topic, regex] of Object.entries(topicKeywords)) {
            if (regex.test(content)) {
                topics.push(topic);
            }
        }

        return topics;
    }

    analyzeSentiment(content) {
        const positiveWords = /good|great|excellent|awesome|amazing|cool|nice|perfect|love|like/i;
        const negativeWords = /bad|terrible|awful|hate|suck|wrong|error|fail|problem|issue/i;
        
        if (positiveWords.test(content)) return 'positive';
        if (negativeWords.test(content)) return 'negative';
        return 'neutral';
    }

    extractTechnicalTerms(content) {
        const terms = new Set();
        const techPatterns = [
            /\b[A-Z]{2,}\b/g,  // Acronyms
            /\b\w+\.\w+\b/g,   // Namespaced terms
            /\b\w+(?:js|py|html|css|json)\b/gi,  // File extensions
            /\bfunction\s+\w+/gi,  // Functions
            /\bclass\s+\w+/gi,     // Classes
        ];

        techPatterns.forEach(pattern => {
            const matches = content.match(pattern) || [];
            matches.forEach(match => terms.add(match.toLowerCase()));
        });

        return Array.from(terms);
    }

    detectConversationPatterns(content) {
        const patterns = new Set();
        
        if (content.includes('?')) patterns.add('questioning');
        if (content.match(/\blet'?s|we should|how about/i)) patterns.add('collaborative');
        if (content.match(/\bI think|in my opinion|maybe/i)) patterns.add('suggestive');
        if (content.match(/\berror|problem|fix|debug/i)) patterns.add('problem_solving');
        if (content.match(/\bcreate|build|make|generate/i)) patterns.add('creative');
        if (content.match(/\banalyze|understand|examine/i)) patterns.add('analytical');

        return Array.from(patterns);
    }

    extractWorldBuildingElements(content) {
        const elements = new Set();
        const worldPatterns = {
            'characters': /character|mascot|avatar|person|entity/i,
            'environments': /environment|world|scene|space|room|area/i,
            'objects': /object|item|tool|device|crystal|cube/i,
            'systems': /system|network|grid|infrastructure/i,
            'interactions': /interact|connect|communicate|interface/i,
            'visualization': /render|display|visual|3d|graphics/i
        };

        for (const [element, regex] of Object.entries(worldPatterns)) {
            if (regex.test(content)) {
                elements.add(element);
            }
        }

        return Array.from(elements);
    }

    calculateComplexity(messages) {
        let complexity = 0;
        
        for (const message of messages) {
            // Word count contributes to complexity
            const wordCount = message.content.split(/\s+/).length;
            complexity += Math.log(wordCount + 1);
            
            // Technical terms increase complexity
            const techTerms = this.extractTechnicalTerms(message.content);
            complexity += techTerms.length * 0.5;
            
            // Nested concepts increase complexity
            const nestedConcepts = (message.content.match(/\b\w+\s+of\s+\w+/g) || []).length;
            complexity += nestedConcepts * 0.3;
        }
        
        return Math.min(complexity / messages.length, 10); // Normalize to 0-10 scale
    }

    countWords(messages) {
        return messages.reduce((total, msg) => {
            return total + msg.content.split(/\s+/).length;
        }, 0);
    }

    startContinuousProcessing() {
        // Process real-time input every 5 seconds
        setInterval(() => {
            this.processRealtimeInput();
        }, 5000);

        // Analyze patterns every minute
        setInterval(() => {
            this.analyzeOverallPatterns();
        }, 60000);

        // Generate world updates every 5 minutes
        setInterval(() => {
            this.generateWorldUpdates();
        }, 300000);
    }

    processRealtimeInput() {
        // This would process incoming data from the web interface
        console.log('🔄 Processing real-time input...');
    }

    analyzeOverallPatterns() {
        console.log('🧐 Analyzing conversation patterns...');
        
        // Analyze all collected data for patterns
        const allTopics = new Map();
        const allPatterns = new Set();
        
        for (const [logId, logData] of this.processingState.chat_logs) {
            // Aggregate topics
            for (const [topic, count] of logData.analysis.topics) {
                allTopics.set(topic, (allTopics.get(topic) || 0) + count);
            }
            
            // Aggregate patterns
            logData.analysis.patterns.forEach(pattern => allPatterns.add(pattern));
        }

        // Update world context based on patterns
        this.updateWorldContext(allTopics, allPatterns);
        
        this.processingState.learning_stats.patterns_detected = allPatterns.size;
    }

    updateWorldContext(topics, patterns) {
        // Determine current mood based on conversation patterns
        if (patterns.has('creative') && patterns.has('collaborative')) {
            this.processingState.world_context.current_mood = 'innovative';
        } else if (patterns.has('problem_solving') && patterns.has('analytical')) {
            this.processingState.world_context.current_mood = 'focused';
        } else if (patterns.has('questioning')) {
            this.processingState.world_context.current_mood = 'curious';
        }

        // Update focus areas based on most discussed topics
        const sortedTopics = Array.from(topics.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([topic]) => topic);
        
        this.processingState.world_context.focus_areas = sortedTopics;

        // Determine activity level
        const totalMessages = Array.from(this.processingState.chat_logs.values())
            .reduce((total, log) => total + log.messages.length, 0);
        
        if (totalMessages > 1000) {
            this.processingState.world_context.activity_level = 'very_high';
        } else if (totalMessages > 500) {
            this.processingState.world_context.activity_level = 'high';
        } else if (totalMessages > 100) {
            this.processingState.world_context.activity_level = 'moderate';
        } else {
            this.processingState.world_context.activity_level = 'low';
        }
    }

    generateWorldUpdates() {
        console.log('🌍 Generating world updates...');
        
        const worldUpdate = {
            timestamp: Date.now(),
            mood: this.processingState.world_context.current_mood,
            focus_areas: this.processingState.world_context.focus_areas,
            activity_level: this.processingState.world_context.activity_level,
            new_elements: this.generateNewWorldElements(),
            stats: this.processingState.learning_stats
        };

        // Send to MCP and world builder
        this.broadcastWorldUpdate(worldUpdate);
        
        this.processingState.learning_stats.worlds_generated++;
    }

    generateNewWorldElements() {
        const elements = [];
        const focusAreas = this.processingState.world_context.focus_areas;
        
        focusAreas.forEach(area => {
            switch (area) {
                case 'voxelization':
                    elements.push({
                        type: 'voxel_cluster',
                        properties: { density: 'high', interaction: 'dynamic' }
                    });
                    break;
                case 'ai_systems':
                    elements.push({
                        type: 'neural_network',
                        properties: { complexity: 'advanced', learning: 'active' }
                    });
                    break;
                case 'world_building':
                    elements.push({
                        type: 'environment_generator',
                        properties: { theme: 'technical', scale: 'large' }
                    });
                    break;
            }
        });

        return elements;
    }

    broadcastWorldUpdate(update) {
        // Send to all connected clients and systems
        this.broadcastToClients('world_update', update);
        this.sendToMCP('world_context_update', update);
    }

    broadcastToClients(type, data) {
        // Broadcast to WebSocket clients
        console.log(`📡 Broadcasting ${type} to clients`);
    }

    sendToMCP(type, data) {
        // Send to MCP crawler
        fetch('http://localhost:7878/api/context-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, data })
        }).catch(err => {
            console.log('MCP not available, queuing update');
        });
    }

    connectToMCP() {
        // Connect to MCP crawler for context sharing
        try {
            const ws = new WebSocket('ws://localhost:7878');
            ws.onopen = () => {
                console.log('🔗 Connected to MCP crawler');
                ws.send(JSON.stringify({
                    type: 'chat_processor_announce',
                    capabilities: ['conversation_analysis', 'pattern_detection', 'world_context']
                }));
            };
            ws.onerror = () => {
                console.log('MCP crawler not available, running standalone');
            };
        } catch (error) {
            console.log('MCP crawler not available, running standalone');
        }
    }

    setupRoutes() {
        this.app.use(express.json());
        
        this.app.get('/', (req, res) => {
            res.json({
                system: 'CAL Chat Log Processor',
                status: 'active',
                stats: this.processingState.learning_stats,
                world_context: this.processingState.world_context
            });
        });

        this.app.post('/api/process-input', async (req, res) => {
            const { type, data } = req.body;
            
            try {
                let result;
                
                switch (type) {
                    case 'chat':
                        result = await this.processLiveChat(data);
                        break;
                    case 'typing':
                        result = await this.processTypingPattern(data);
                        break;
                    case 'voice':
                        result = await this.processVoiceInput(data);
                        break;
                    case 'music':
                        result = await this.processMusicContext(data);
                        break;
                    default:
                        throw new Error(`Unsupported input type: ${type}`);
                }
                
                res.json({ success: true, result });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/world-context', (req, res) => {
            res.json(this.processingState.world_context);
        });

        this.app.get('/api/conversation-analysis', (req, res) => {
            const analysis = {};
            
            for (const [logId, logData] of this.processingState.chat_logs) {
                analysis[logId] = {
                    file: path.basename(logData.file),
                    message_count: logData.messages.length,
                    analysis: logData.analysis,
                    processed_at: logData.processed_at
                };
            }
            
            res.json(analysis);
        });
    }

    async processLiveChat(data) {
        const message = {
            timestamp: new Date(data.timestamp),
            sender: data.sender || 'user',
            content: data.text,
            type: 'text'
        };

        const analysis = await this.analyzeConversation([message]);
        
        // Update live stats
        this.processingState.learning_stats.words_processed += this.countWords([message]);
        
        return {
            analysis: analysis,
            world_impact: this.assessWorldImpact(analysis)
        };
    }

    async processTypingPattern(data) {
        const pattern = {
            speed: data.speed,
            rhythm: data.rhythm || 'unknown',
            complexity: data.complexity || 'medium',
            timestamp: data.timestamp
        };

        this.processingState.typing_rhythms.set(Date.now(), pattern);
        
        return {
            pattern: pattern,
            personality_indicator: this.analyzePersonalityFromTyping(pattern)
        };
    }

    async processVoiceInput(data) {
        const voicePattern = {
            volume: data.volume,
            tone: data.tone || 'neutral',
            pace: data.pace || 'normal',
            emotion: data.emotion || 'neutral',
            timestamp: data.timestamp
        };

        this.processingState.voice_patterns.set(Date.now(), voicePattern);
        
        return {
            pattern: voicePattern,
            mood_indicator: this.analyzeMoodFromVoice(voicePattern)
        };
    }

    async processMusicContext(data) {
        const musicContext = {
            genre: data.genre || 'unknown',
            tempo: data.tempo || 120,
            mood: data.mood || 'neutral',
            energy: data.energy || 0.5,
            timestamp: data.timestamp
        };

        this.processingState.music_analysis.set(Date.now(), musicContext);
        
        return {
            context: musicContext,
            world_atmosphere: this.deriveWorldAtmosphere(musicContext)
        };
    }

    assessWorldImpact(analysis) {
        const impact = {
            new_topics: Array.from(analysis.topics.keys()),
            complexity_change: analysis.complexity,
            mood_shift: this.calculateMoodShift(analysis),
            world_elements: Array.from(analysis.world_building_elements)
        };

        return impact;
    }

    calculateMoodShift(analysis) {
        const sentimentScore = (analysis.sentiment.positive - analysis.sentiment.negative) / 
                              (analysis.sentiment.positive + analysis.sentiment.negative + analysis.sentiment.neutral);
        
        if (sentimentScore > 0.5) return 'positive';
        if (sentimentScore < -0.5) return 'negative';
        return 'neutral';
    }

    analyzePersonalityFromTyping(pattern) {
        const indicators = [];
        
        if (pattern.speed > 80) indicators.push('fast_thinker');
        if (pattern.speed < 40) indicators.push('deliberate');
        if (pattern.rhythm === 'burst') indicators.push('creative');
        if (pattern.complexity === 'high') indicators.push('analytical');
        
        return indicators;
    }

    analyzeMoodFromVoice(pattern) {
        const mood = [];
        
        if (pattern.volume > 0.7) mood.push('energetic');
        if (pattern.pace === 'fast') mood.push('excited');
        if (pattern.tone === 'analytical') mood.push('focused');
        
        return mood;
    }

    deriveWorldAtmosphere(musicContext) {
        const atmosphere = {
            energy_level: musicContext.energy,
            pace: musicContext.tempo > 140 ? 'fast' : musicContext.tempo < 80 ? 'slow' : 'moderate',
            mood: musicContext.mood,
            visual_style: this.mapMusicToVisuals(musicContext)
        };

        return atmosphere;
    }

    mapMusicToVisuals(musicContext) {
        const visualMappings = {
            'electronic': 'neon_cyber',
            'ambient': 'ethereal_floating',
            'rock': 'industrial_rough',
            'classical': 'elegant_structured',
            'jazz': 'flowing_organic'
        };

        return visualMappings[musicContext.genre] || 'neutral_balanced';
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`🧠 CAL Chat Log Processor: http://localhost:${this.port}`);
            console.log('💬 Ready to process conversations and build worlds');
            console.log('🌍 Context learning: ACTIVE');
            console.log('🎯 Pattern detection: ENABLED');
        });
    }
}

// Pattern engine classes
class ConversationPatternEngine {
    analyze(messages) {
        // Advanced conversation pattern analysis
        return {};
    }
}

class MusicContextEngine {
    analyze(audioData) {
        // Music analysis and mood detection
        return {};
    }
}

class VoiceAnalysisEngine {
    analyze(voiceData) {
        // Voice pattern and emotion analysis
        return {};
    }
}

class TypingPatternEngine {
    analyze(typingData) {
        // Typing rhythm and personality analysis
        return {};
    }
}

class WorldGenerationEngine {
    generate(context) {
        // Generate world elements based on context
        return {};
    }
}

// Start the processor
const processor = new CALChatLogProcessor();
processor.start();

module.exports = CALChatLogProcessor;