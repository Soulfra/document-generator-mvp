#!/usr/bin/env node

/**
 * 🗣️ VOICE COMMAND PROCESSOR
 * Processes voice commands, verifies speech patterns, and routes to empire actions
 * Integrates with the unified empire gaming system and blockchain verification
 */

const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const ZoneDatabaseManager = require('./zone-database-manager');
const ZoneContextSystem = require('./zone-context-system');

class VoiceCommandProcessor {
    constructor(config = {}) {
        this.port = config.port || 7779;
        this.zoneDb = new ZoneDatabaseManager(config.database);
        this.zoneSystem = new ZoneContextSystem();
        
        // Voice verification settings
        this.voiceProfiles = new Map();
        this.commandHistory = new Map();
        this.verificationThreshold = config.verificationThreshold || 0.75;
        
        // Natural language processing patterns
        this.commandPatterns = {
            administrator: /talk to.*administrator|speak to.*admin|call.*administrator/i,
            status: /show.*status|empire.*status|system.*status|what.*status/i,
            generate: /generate.*content|create.*content|make.*content/i,
            search: /search.*docs|find.*documentation|help.*with|look.*up/i,
            blockchain: /blockchain.*status|wallet.*balance|crypto.*balance/i,
            domain: /domain|website|site/i,
            service: /service|api|system/i,
            help: /help|assistance|guide|tutorial/i
        };
        
        // Intent classification
        this.intents = {
            'administrator_chat': {
                patterns: ['talk to administrator', 'speak to admin', 'call administrator'],
                confidence_threshold: 0.8,
                requires_verification: true
            },
            'empire_status': {
                patterns: ['show status', 'empire status', 'system status'],
                confidence_threshold: 0.7,
                requires_verification: false
            },
            'content_generation': {
                patterns: ['generate content', 'create content', 'make content'],
                confidence_threshold: 0.8,
                requires_verification: true
            },
            'documentation_search': {
                patterns: ['search docs', 'find documentation', 'help with'],
                confidence_threshold: 0.7,
                requires_verification: false
            },
            'blockchain_query': {
                patterns: ['blockchain status', 'wallet balance', 'crypto balance'],
                confidence_threshold: 0.8,
                requires_verification: true
            }
        };
        
        // Export formats support
        this.exportFormats = {
            jsonl: this.exportToJSONL.bind(this),
            yaml: this.exportToYAML.bind(this),
            cat: this.exportToCAT.bind(this),
            cad: this.exportToCAD.bind(this),
            god: this.exportToGOD.bind(this),
            dog: this.exportToDOG.bind(this),
            xml: this.exportToXML.bind(this),
            csv: this.exportToCSV.bind(this)
        };
        
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        
        console.log('🗣️ Voice Command Processor initializing...');
    }
    
    async initialize() {
        await this.zoneDb.initialize();
        await this.zoneSystem.initialize();
        await this.loadVoiceProfiles();
        await this.setupVoiceVerification();
        
        this.server = this.app.listen(this.port, () => {
            console.log(`🗣️ Voice Command Processor running on port ${this.port}`);
            console.log(`🎯 Zone Context System enabled with simplified database`);
        });
    }
    
    setupMiddleware() {
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
        // CORS for frontend integration
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });
        
        // Audio upload middleware
        this.upload = multer({
            storage: multer.memoryStorage(),
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
            fileFilter: (req, file, cb) => {
                if (file.mimetype.startsWith('audio/')) {
                    cb(null, true);
                } else {
                    cb(new Error('Only audio files are allowed'));
                }
            }
        });
    }
    
    setupRoutes() {
        // Voice command processing
        this.app.post('/api/voice/process', this.upload.single('audio'), (req, res) => {
            this.processVoiceCommand(req, res);
        });
        
        // Text command processing
        this.app.post('/api/voice/text', (req, res) => {
            this.processTextCommand(req, res);
        });
        
        // Voice profile management
        this.app.post('/api/voice/profile/create', this.upload.single('audio'), (req, res) => {
            this.createVoiceProfile(req, res);
        });
        
        // Voice verification
        this.app.post('/api/voice/verify', this.upload.single('audio'), (req, res) => {
            this.verifyVoiceCommand(req, res);
        });
        
        // Administrator chat interface
        this.app.post('/api/administrator/chat', (req, res) => {
            this.chatWithAdministrator(req, res);
        });
        
        // Command history and analytics
        this.app.get('/api/voice/history', (req, res) => {
            this.getCommandHistory(req, res);
        });
        
        // Export voice data
        this.app.get('/api/voice/export/:format', (req, res) => {
            this.exportVoiceData(req, res);
        });
        
        // Intent training data
        this.app.post('/api/voice/train', (req, res) => {
            this.trainIntentModel(req, res);
        });
        
        // Zone context routes
        this.app.get('/api/zones/current', (req, res) => {
            this.getCurrentZoneInfo(req, res);
        });
        
        this.app.post('/api/zones/detect', (req, res) => {
            this.detectZoneFromContext(req, res);
        });
        
        this.app.get('/api/zones/map', (req, res) => {
            this.getZoneMap(req, res);
        });
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                voice_profiles: this.voiceProfiles.size,
                command_history: this.commandHistory.size,
                supported_formats: Object.keys(this.exportFormats),
                intents: Object.keys(this.intents)
            });
        });
    }
    
    // ================================================
    // 🎤 VOICE PROCESSING
    // ================================================
    
    async processVoiceCommand(req, res) {
        try {
            const { userId = 'anonymous' } = req.body;
            const audioBuffer = req.file.buffer;
            
            // Convert audio to text (mock implementation - would use real STT)
            const transcript = await this.speechToText(audioBuffer);
            
            // Verify voice if user has a profile
            let voiceVerified = false;
            if (this.voiceProfiles.has(userId)) {
                voiceVerified = await this.verifyVoicePattern(audioBuffer, userId);
            }
            
            // Process the command
            const result = await this.processCommand(transcript, {
                userId,
                voiceVerified,
                audioFingerprint: this.generateAudioFingerprint(audioBuffer),
                timestamp: new Date().toISOString()
            });
            
            // Log the command to zone database
            await this.zoneSystem.logVoiceCommand(transcript, result, {
                userId,
                voiceVerified,
                audioFingerprint: this.generateAudioFingerprint(audioBuffer),
                sessionId: req.headers['session-id'],
                userAgent: req.headers['user-agent']
            });
            
            res.json({
                transcript,
                voiceVerified,
                result,
                confidence: result.confidence,
                intent: result.intent,
                action: result.action
            });
            
        } catch (error) {
            console.error('Voice processing error:', error);
            res.status(500).json({ error: 'Voice processing failed', details: error.message });
        }
    }
    
    async processTextCommand(req, res) {
        try {
            const { command, userId = 'anonymous' } = req.body;
            
            // Process the text command
            const result = await this.processCommand(command, {
                userId,
                voiceVerified: false,
                isText: true,
                timestamp: new Date().toISOString()
            });
            
            // Log the command to zone database
            await this.zoneSystem.logVoiceCommand(command, result, {
                userId,
                voiceVerified: false,
                sessionId: req.headers['session-id'],
                userAgent: req.headers['user-agent']
            });
            
            res.json({
                command,
                result,
                confidence: result.confidence,
                intent: result.intent,
                action: result.action
            });
            
        } catch (error) {
            console.error('Text processing error:', error);
            res.status(500).json({ error: 'Text processing failed', details: error.message });
        }
    }
    
    // ================================================
    // 🧠 COMMAND PROCESSING
    // ================================================
    
    async processCommand(text, context) {
        // First check if this is a zone-related command
        const zoneResult = this.zoneSystem.processVoiceCommand(text, context);
        
        if (zoneResult.intent.startsWith('zone_')) {
            // Zone command handled by zone system
            return {
                intent: zoneResult.intent,
                confidence: 0.9,
                response: zoneResult.response,
                action: zoneResult.action,
                zone: zoneResult.zone,
                suggestions: zoneResult.suggestions,
                timestamp: context.timestamp
            };
        }
        
        // Classify intent for non-zone commands
        const intent = this.classifyIntent(text);
        
        // Check if verification is required
        if (intent.requires_verification && !context.voiceVerified) {
            return {
                intent: intent.name,
                confidence: intent.confidence,
                error: 'Voice verification required for this command',
                requiresVerification: true
            };
        }
        
        // Get current zone context for enhanced responses
        const currentZone = this.zoneSystem.getCurrentZone();
        context.currentZone = currentZone;
        
        // Route to appropriate handler
        let action = null;
        let response = '';
        
        switch (intent.name) {
            case 'administrator_chat':
                action = await this.handleAdministratorChat(text, context);
                response = 'Connecting to local administrator...';
                break;
                
            case 'empire_status':
                action = await this.handleEmpireStatus(text, context);
                response = 'Fetching empire status...';
                break;
                
            case 'content_generation':
                action = await this.handleContentGeneration(text, context);
                response = `Initiating content generation for ${currentZone.name}...`;
                break;
                
            case 'documentation_search':
                action = await this.handleDocumentationSearch(text, context);
                response = 'Searching empire documentation...';
                break;
                
            case 'blockchain_query':
                action = await this.handleBlockchainQuery(text, context);
                response = 'Checking blockchain status...';
                break;
                
            default:
                action = await this.handleUnknownCommand(text, context);
                response = `Processing command with AI in ${currentZone.name}...`;
        }
        
        return {
            intent: intent.name,
            confidence: intent.confidence,
            response,
            action,
            zone: currentZone.type,
            timestamp: context.timestamp
        };
    }
    
    classifyIntent(text) {
        let bestMatch = { name: 'unknown', confidence: 0, requires_verification: false };
        
        for (const [intentName, intentData] of Object.entries(this.intents)) {
            for (const pattern of intentData.patterns) {
                const similarity = this.calculateTextSimilarity(text.toLowerCase(), pattern.toLowerCase());
                
                if (similarity > intentData.confidence_threshold && similarity > bestMatch.confidence) {
                    bestMatch = {
                        name: intentName,
                        confidence: similarity,
                        requires_verification: intentData.requires_verification
                    };
                }
            }
        }
        
        return bestMatch;
    }
    
    calculateTextSimilarity(text1, text2) {
        // Simple word overlap similarity (would use more sophisticated NLP in production)
        const words1 = text1.split(' ');
        const words2 = text2.split(' ');
        
        const intersection = words1.filter(word => words2.includes(word));
        const union = [...new Set([...words1, ...words2])];
        
        return intersection.length / union.length;
    }
    
    // ================================================
    // 🎯 COMMAND HANDLERS
    // ================================================
    
    async handleAdministratorChat(text, context) {
        // Extract the actual message for the administrator
        const message = text.replace(/talk to.*administrator|speak to.*admin|call.*administrator/i, '').trim();
        
        return {
            type: 'administrator_chat',
            description: 'Chat with local AI administrator',
            parameters: {
                message: message || 'Hello, I need assistance',
                userId: context.userId,
                voiceVerified: context.voiceVerified
            },
            endpoint: 'http://localhost:3001/api/ai/chat',
            method: 'POST'
        };
    }
    
    async handleEmpireStatus(text, context) {
        return {
            type: 'empire_status',
            description: 'Get empire gaming system status',
            parameters: {
                userId: context.userId,
                detailed: text.includes('detailed') || text.includes('full')
            },
            endpoint: 'http://localhost:7777/api/empire/status',
            method: 'GET'
        };
    }
    
    async handleContentGeneration(text, context) {
        // Extract domain/site if mentioned
        const domainMatch = text.match(/for\s+([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        const domain = domainMatch ? domainMatch[1] : null;
        
        // Extract content type
        let contentType = 'general';
        if (text.includes('article')) contentType = 'article';
        if (text.includes('description')) contentType = 'description';
        if (text.includes('post')) contentType = 'post';
        
        return {
            type: 'content_generation',
            description: `Generate ${contentType} content${domain ? ` for ${domain}` : ''}`,
            parameters: {
                type: contentType,
                domain: domain,
                rarity: 'voice_request',
                userId: context.userId,
                trigger_source: 'voice_command'
            },
            endpoint: 'http://localhost:7777/api/content/generate',
            method: 'POST'
        };
    }
    
    async handleDocumentationSearch(text, context) {
        // Extract search query
        const query = text.replace(/search.*docs|find.*documentation|help.*with|look.*up/i, '').trim();
        
        return {
            type: 'documentation_search',
            description: `Search documentation for: ${query}`,
            parameters: {
                query: query,
                userId: context.userId,
                voice: true
            },
            endpoint: 'http://localhost:7777/api/docs/search',
            method: 'POST'
        };
    }
    
    async handleBlockchainQuery(text, context) {
        // Determine which blockchain(s)
        const chains = [];
        if (text.includes('ethereum') || text.includes('eth')) chains.push('ethereum');
        if (text.includes('bitcoin') || text.includes('btc')) chains.push('bitcoin');
        if (text.includes('solana') || text.includes('sol')) chains.push('solana');
        if (text.includes('monero') || text.includes('xmr')) chains.push('monero');
        
        return {
            type: 'blockchain_query',
            description: `Check blockchain status${chains.length ? ` for ${chains.join(', ')}` : ''}`,
            parameters: {
                chains: chains.length ? chains : ['all'],
                userId: context.userId,
                includeBalances: text.includes('balance')
            },
            endpoint: 'http://localhost:7777/api/blockchain/status',
            method: 'GET'
        };
    }
    
    async handleUnknownCommand(text, context) {
        return {
            type: 'ai_interpretation',
            description: 'Process unknown command with AI',
            parameters: {
                command: text,
                userId: context.userId,
                context: context
            },
            endpoint: 'http://localhost:3001/api/ai/interpret',
            method: 'POST'
        };
    }
    
    // ================================================
    // 🎤 VOICE VERIFICATION
    // ================================================
    
    async createVoiceProfile(req, res) {
        try {
            const { userId } = req.body;
            const audioBuffer = req.file.buffer;
            
            // Generate voice fingerprint
            const fingerprint = this.generateVoiceFingerprint(audioBuffer);
            
            // Store voice profile
            this.voiceProfiles.set(userId, {
                fingerprint,
                created: new Date().toISOString(),
                samples: [fingerprint],
                verified_commands: 0
            });
            
            // Save to file
            await this.saveVoiceProfiles();
            
            res.json({
                success: true,
                message: 'Voice profile created',
                userId
            });
            
        } catch (error) {
            res.status(500).json({ error: 'Failed to create voice profile', details: error.message });
        }
    }
    
    async verifyVoiceCommand(req, res) {
        try {
            const { userId } = req.body;
            const audioBuffer = req.file.buffer;
            
            const isVerified = await this.verifyVoicePattern(audioBuffer, userId);
            
            res.json({
                verified: isVerified,
                userId,
                confidence: isVerified ? 0.85 : 0.15 // Mock confidence score
            });
            
        } catch (error) {
            res.status(500).json({ error: 'Voice verification failed', details: error.message });
        }
    }
    
    async verifyVoicePattern(audioBuffer, userId) {
        const profile = this.voiceProfiles.get(userId);
        if (!profile) return false;
        
        const currentFingerprint = this.generateVoiceFingerprint(audioBuffer);
        const similarity = this.compareVoiceFingerprints(currentFingerprint, profile.fingerprint);
        
        if (similarity > this.verificationThreshold) {
            profile.verified_commands++;
            profile.last_verified = new Date().toISOString();
            return true;
        }
        
        return false;
    }
    
    generateVoiceFingerprint(audioBuffer) {
        // Generate a hash-based fingerprint (would use actual audio analysis in production)
        return crypto.createHash('sha256').update(audioBuffer).digest('hex').substring(0, 32);
    }
    
    generateAudioFingerprint(audioBuffer) {
        return {
            hash: crypto.createHash('md5').update(audioBuffer).digest('hex'),
            size: audioBuffer.length,
            timestamp: Date.now()
        };
    }
    
    compareVoiceFingerprints(fp1, fp2) {
        // Simple similarity check (would use actual audio analysis in production)
        const common = fp1.split('').filter((char, i) => char === fp2[i]).length;
        return common / fp1.length;
    }
    
    // ================================================
    // 🗣️ SPEECH PROCESSING
    // ================================================
    
    async speechToText(audioBuffer) {
        // Mock implementation - would integrate with real STT service
        // For demonstration, return common commands based on audio characteristics
        
        const audioHash = crypto.createHash('md5').update(audioBuffer).digest('hex');
        const commonCommands = [
            'talk to local administrator',
            'show empire status',
            'generate content for deathtodata.com',
            'search documentation for API',
            'show blockchain balances',
            'help me with deployment'
        ];
        
        // Return a command based on hash (for demo purposes)
        return commonCommands[parseInt(audioHash.substring(0, 2), 16) % commonCommands.length];
    }
    
    // ================================================
    // 🤖 ADMINISTRATOR CHAT
    // ================================================
    
    async chatWithAdministrator(req, res) {
        try {
            const { message, voice = false, userId = 'anonymous' } = req.body;
            
            // Process message with local AI administrator
            const response = await this.processAdministratorMessage(message, { userId, voice });
            
            res.json({
                response: response.message,
                action: response.action,
                confidence: response.confidence,
                suggestions: response.suggestions
            });
            
        } catch (error) {
            res.status(500).json({ 
                error: 'Administrator chat failed', 
                response: 'Sorry, I am currently unavailable. Please try again later.'
            });
        }
    }
    
    async processAdministratorMessage(message, context) {
        // AI administrator responses based on message content
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('help') || lowerMessage.includes('assist')) {
            return {
                message: "I'm your local AI administrator. I can help you with empire management, content generation, blockchain operations, and system documentation. What would you like assistance with?",
                confidence: 0.9,
                suggestions: [
                    'Show me empire statistics',
                    'Generate content for a domain',
                    'Search documentation',
                    'Check blockchain status'
                ]
            };
        }
        
        if (lowerMessage.includes('status') || lowerMessage.includes('health')) {
            return {
                message: "Empire systems are running normally. All gaming mechanics are active, AI services are online, and blockchain connections are stable. Would you like detailed status information?",
                confidence: 0.9,
                action: {
                    type: 'empire_status',
                    description: 'Get detailed empire status'
                }
            };
        }
        
        if (lowerMessage.includes('generate') || lowerMessage.includes('content')) {
            return {
                message: "I can help you generate content using our gaming system. Which domain or type of content would you like me to create?",
                confidence: 0.9,
                action: {
                    type: 'content_generation',
                    description: 'Initiate content generation'
                }
            };
        }
        
        if (lowerMessage.includes('documentation') || lowerMessage.includes('docs')) {
            return {
                message: "I can search through all empire documentation, code files, and CLAUDE instructions. What specific topic are you looking for?",
                confidence: 0.9,
                action: {
                    type: 'documentation_search',
                    description: 'Search empire documentation'
                }
            };
        }
        
        // Default response
        return {
            message: "I understand you're asking about: '" + message + "'. Let me process this request and find the best way to help you.",
            confidence: 0.7,
            action: {
                type: 'ai_interpretation',
                description: 'Process request with AI'
            }
        };
    }
    
    // ================================================
    // 📊 DATA EXPORT
    // ================================================
    
    async exportVoiceData(req, res) {
        try {
            const { format } = req.params;
            const { userId, startDate, endDate } = req.query;
            
            if (!this.exportFormats[format]) {
                return res.status(400).json({ error: 'Unsupported export format' });
            }
            
            // Get voice command history
            const history = await this.getFilteredCommandHistory(userId, startDate, endDate);
            
            // Export in requested format
            const exportedData = await this.exportFormats[format](history);
            
            res.setHeader('Content-Type', this.getContentType(format));
            res.setHeader('Content-Disposition', `attachment; filename="voice_data.${format}"`);
            res.send(exportedData);
            
        } catch (error) {
            res.status(500).json({ error: 'Export failed', details: error.message });
        }
    }
    
    async exportToJSONL(data) {
        return data.map(item => JSON.stringify(item)).join('\n');
    }
    
    async exportToYAML(data) {
        // Simple YAML export (would use proper YAML library in production)
        return data.map(item => 
            `---\n${Object.entries(item).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join('\n')}`
        ).join('\n\n');
    }
    
    async exportToCAT(data) {
        // CAT format (Category Analysis Text)
        return data.map(item => 
            `[${item.intent}] ${item.timestamp}: ${item.command} -> ${item.result}`
        ).join('\n');
    }
    
    async exportToCAD(data) {
        // CAD format (Command Analysis Data)
        return JSON.stringify({
            metadata: { format: 'CAD', version: '1.0', generated: new Date().toISOString() },
            commands: data
        }, null, 2);
    }
    
    async exportToGOD(data) {
        // GOD format (Gaming Operations Data)
        return data.map((item, index) => 
            `GOD_RECORD_${index + 1}|${item.timestamp}|${item.userId}|${item.command}|${item.intent}|${item.voiceVerified}`
        ).join('\n');
    }
    
    async exportToDOG(data) {
        // DOG format (Domain Operations Graph)
        const domains = [...new Set(data.map(item => item.domain).filter(Boolean))];
        return domains.map(domain => {
            const domainCommands = data.filter(item => item.domain === domain);
            return `DOMAIN:${domain}\nCOMMANDS:${domainCommands.length}\nLAST_ACTIVITY:${domainCommands[domainCommands.length - 1]?.timestamp}`;
        }).join('\n\n');
    }
    
    async exportToXML(data) {
        const xmlItems = data.map(item => 
            `<command>
                <timestamp>${item.timestamp}</timestamp>
                <user>${item.userId}</user>
                <text>${item.command}</text>
                <intent>${item.intent}</intent>
                <verified>${item.voiceVerified}</verified>
            </command>`
        ).join('\n');
        
        return `<?xml version="1.0" encoding="UTF-8"?>\n<voice_commands>\n${xmlItems}\n</voice_commands>`;
    }
    
    async exportToCSV(data) {
        const headers = 'timestamp,userId,command,intent,voiceVerified,confidence\n';
        const rows = data.map(item => 
            `${item.timestamp},${item.userId},"${item.command}",${item.intent},${item.voiceVerified},${item.confidence}`
        ).join('\n');
        
        return headers + rows;
    }
    
    getContentType(format) {
        const types = {
            jsonl: 'application/jsonlines',
            yaml: 'application/x-yaml',
            cat: 'text/plain',
            cad: 'application/json',
            god: 'text/plain',
            dog: 'text/plain',
            xml: 'application/xml',
            csv: 'text/csv'
        };
        return types[format] || 'text/plain';
    }
    
    // ================================================
    // 💾 DATA MANAGEMENT
    // ================================================
    
    async logVoiceCommand(userId, command, result, voiceVerified) {
        const commandData = {
            id: crypto.randomUUID(),
            userId,
            command,
            intent: result.intent,
            confidence: result.confidence,
            voiceVerified,
            timestamp: new Date().toISOString(),
            result: result.response,
            action: result.action
        };
        
        // Store in memory
        if (!this.commandHistory.has(userId)) {
            this.commandHistory.set(userId, []);
        }
        this.commandHistory.get(userId).push(commandData);
        
        // Legacy logging - now handled by zone system
        console.log(`📝 Voice command logged: ${command} → ${result.intent}`);
    }
    
    async getCommandHistory(req, res) {
        const { userId, limit = 50 } = req.query;
        
        try {
            if (userId) {
                const userHistory = this.commandHistory.get(userId) || [];
                res.json(userHistory.slice(-limit));
            } else {
                // All command history (admin only)
                const allHistory = [];
                for (const userCommands of this.commandHistory.values()) {
                    allHistory.push(...userCommands);
                }
                res.json(allHistory.slice(-limit));
            }
        } catch (error) {
            res.status(500).json({ error: 'Failed to get command history' });
        }
    }
    
    async getFilteredCommandHistory(userId, startDate, endDate) {
        let history = [];
        
        if (userId) {
            history = this.commandHistory.get(userId) || [];
        } else {
            for (const userCommands of this.commandHistory.values()) {
                history.push(...userCommands);
            }
        }
        
        // Apply date filters
        if (startDate) {
            history = history.filter(item => new Date(item.timestamp) >= new Date(startDate));
        }
        if (endDate) {
            history = history.filter(item => new Date(item.timestamp) <= new Date(endDate));
        }
        
        return history;
    }
    
    async loadVoiceProfiles() {
        try {
            const profilesPath = path.join(__dirname, 'voice-profiles.json');
            const data = await fs.readFile(profilesPath, 'utf8');
            const profiles = JSON.parse(data);
            
            for (const [userId, profile] of Object.entries(profiles)) {
                this.voiceProfiles.set(userId, profile);
            }
            
            console.log(`Loaded ${this.voiceProfiles.size} voice profiles`);
        } catch (error) {
            console.log('No existing voice profiles found, starting fresh');
        }
    }
    
    async saveVoiceProfiles() {
        try {
            const profilesPath = path.join(__dirname, 'voice-profiles.json');
            const profiles = Object.fromEntries(this.voiceProfiles);
            await fs.writeFile(profilesPath, JSON.stringify(profiles, null, 2));
        } catch (error) {
            console.error('Failed to save voice profiles:', error);
        }
    }
    
    async setupVoiceVerification() {
        // Setup voice verification models and patterns
        console.log('🎤 Voice verification system ready');
    }
    
    async trainIntentModel(req, res) {
        try {
            const { command, intent, confidence = 0.8 } = req.body;
            
            // Add to training data (would train actual ML model in production)
            if (!this.intents[intent]) {
                this.intents[intent] = {
                    patterns: [],
                    confidence_threshold: confidence,
                    requires_verification: false
                };
            }
            
            this.intents[intent].patterns.push(command.toLowerCase());
            
            res.json({
                success: true,
                message: `Intent model updated for: ${intent}`,
                patterns: this.intents[intent].patterns.length
            });
            
        } catch (error) {
            res.status(500).json({ error: 'Intent training failed', details: error.message });
        }
    }
    
    // ================================================
    // 🎯 ZONE CONTEXT ROUTES
    // ================================================
    
    async getCurrentZoneInfo(req, res) {
        try {
            const currentZone = this.zoneSystem.getCurrentZone();
            res.json({
                zone: currentZone,
                zone_context: this.zoneSystem.generateZoneContextForDomain(req.headers.host || 'localhost')
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get zone info', details: error.message });
        }
    }
    
    async detectZoneFromContext(req, res) {
        try {
            const { domain, url, referrer } = req.body;
            
            let detectedZone = 'spawn';
            
            if (url) {
                detectedZone = this.zoneSystem.detectZoneFromURL(url);
            } else if (domain) {
                detectedZone = this.zoneSystem.detectZoneFromDomain(domain);
            }
            
            // Set the zone context
            const result = this.zoneSystem.setCurrentZone(detectedZone, { domain, url, referrer });
            
            res.json({
                detected_zone: detectedZone,
                zone_info: result.success ? result.zone : null,
                zone_context: this.zoneSystem.generateZoneContextForDomain(domain || 'localhost')
            });
        } catch (error) {
            res.status(500).json({ error: 'Zone detection failed', details: error.message });
        }
    }
    
    async getZoneMap(req, res) {
        try {
            const zoneData = this.zoneSystem.exportForWeb();
            res.json(zoneData);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get zone map', details: error.message });
        }
    }
    
    async shutdown() {
        console.log('🗣️ Shutting down Voice Command Processor...');
        
        await this.saveVoiceProfiles();
        
        if (this.server) {
            this.server.close();
        }
        
        await this.zoneDb.close();
        console.log('✅ Voice Command Processor shutdown complete');
    }
}

module.exports = VoiceCommandProcessor;

// CLI usage
if (require.main === module) {
    const processor = new VoiceCommandProcessor();
    
    processor.initialize().catch(error => {
        console.error('Failed to initialize Voice Command Processor:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await processor.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await processor.shutdown();
        process.exit(0);
    });
    
    console.log(`
🗣️ VOICE COMMAND PROCESSOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎤 Speech-to-text with voice verification
🧠 Natural language intent classification
🎯 Empire action routing and execution
📊 Multi-format data export (JSONL, YAML, CAT, CAD, GOD, DOG)
🔐 Voice fingerprint authentication
🤖 Local AI administrator integration

Ready for voice commands!
    `);
}