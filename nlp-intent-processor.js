#!/usr/bin/env node

/**
 * 🧠 NATURAL LANGUAGE INTENT PROCESSOR
 * Processes user requests like "I want a boat with armaments"
 * Extracts intent, entities, and parameters for content generation
 */

const EventEmitter = require('events');
const axios = require('axios');

class NLPIntentProcessor extends EventEmitter {
    constructor() {
        super();
        
        this.port = 7783;
        
        // Intent patterns and entity extraction
        this.intentPatterns = {
            creation: {
                patterns: ['i want', 'create', 'make', 'build', 'generate', 'design'],
                extractor: this.extractCreationIntent.bind(this)
            },
            music: {
                patterns: ['spotify', 'music', 'songs', 'wrapped', 'playlist', 'top tracks'],
                extractor: this.extractMusicIntent.bind(this)
            },
            event: {
                patterns: ['event', 'meetup', 'concert', 'ticketmaster', 'live show'],
                extractor: this.extractEventIntent.bind(this)
            },
            verification: {
                patterns: ['verify', 'verified fan', 'qr code', 'meet up', 'peer to peer'],
                extractor: this.extractVerificationIntent.bind(this)
            },
            profile: {
                patterns: ['profile', 'soulfra', 'account', 'page', 'space'],
                extractor: this.extractProfileIntent.bind(this)
            }
        };
        
        // Entity types and attributes
        this.entityTypes = {
            objects: ['boat', 'ship', 'building', 'character', 'weapon', 'vehicle', 'house', 'castle'],
            attributes: ['mast', 'armaments', 'cannon', 'sails', 'color', 'size', 'style'],
            networks: ['roughsparks', 'culture vultures', 'soulfra', 'empire', 'community'],
            actions: ['shooting', 'sailing', 'flying', 'dancing', 'playing', 'streaming']
        };
        
        // Ollama configuration
        this.ollamaConfig = {
            url: 'http://localhost:11434',
            model: 'mistral',
            temperature: 0.7
        };
        
        // Processing statistics
        this.stats = {
            requestsProcessed: 0,
            intentsExtracted: {},
            entitiesFound: {},
            errors: 0
        };
        
        console.log('🧠 NLP Intent Processor initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Check Ollama availability
        await this.checkOllama();
        
        // Start API server
        this.startServer();
        
        console.log('✅ NLP Intent Processor ready!');
    }
    
    async checkOllama() {
        try {
            const response = await axios.get(`${this.ollamaConfig.url}/api/tags`);
            console.log('🤖 Ollama connected, models available:', response.data.models?.map(m => m.name).join(', '));
        } catch (error) {
            console.warn('⚠️ Ollama not available, using pattern matching fallback');
        }
    }
    
    async processRequest(input) {
        console.log(`📝 Processing: "${input}"`);
        
        const startTime = Date.now();
        this.stats.requestsProcessed++;
        
        try {
            // 1. Detect primary intent
            const intent = await this.detectIntent(input);
            
            // 2. Extract entities and parameters
            const entities = await this.extractEntities(input, intent);
            
            // 3. Enhanced AI analysis if Ollama available
            const aiAnalysis = await this.enhanceWithAI(input, intent, entities);
            
            // 4. Build structured output
            const result = this.buildStructuredOutput(intent, entities, aiAnalysis);
            
            // Update statistics
            this.updateStats(intent, entities);
            
            const processingTime = Date.now() - startTime;
            console.log(`✅ Processed in ${processingTime}ms`);
            
            this.emit('intentProcessed', result);
            
            return result;
            
        } catch (error) {
            console.error('❌ Processing error:', error);
            this.stats.errors++;
            throw error;
        }
    }
    
    async detectIntent(input) {
        const lowercaseInput = input.toLowerCase();
        
        // Check each intent pattern
        for (const [intentType, config] of Object.entries(this.intentPatterns)) {
            for (const pattern of config.patterns) {
                if (lowercaseInput.includes(pattern)) {
                    return {
                        type: intentType,
                        confidence: 0.8,
                        pattern: pattern
                    };
                }
            }
        }
        
        // Default to creation intent if no specific pattern matched
        return {
            type: 'creation',
            confidence: 0.5,
            pattern: 'general'
        };
    }
    
    async extractEntities(input, intent) {
        // Use intent-specific extractor
        const extractor = this.intentPatterns[intent.type]?.extractor;
        
        if (extractor) {
            return await extractor(input);
        }
        
        // Fallback to general entity extraction
        return this.extractGeneralEntities(input);
    }
    
    extractCreationIntent(input) {
        const entities = {
            objects: [],
            attributes: [],
            networks: [],
            actions: [],
            custom: {}
        };
        
        const words = input.toLowerCase().split(/\s+/);
        
        // Extract known entity types
        for (const word of words) {
            if (this.entityTypes.objects.includes(word)) {
                entities.objects.push(word);
            }
            if (this.entityTypes.attributes.includes(word)) {
                entities.attributes.push(word);
            }
            if (this.entityTypes.networks.some(n => word.includes(n))) {
                entities.networks.push(word);
            }
            if (this.entityTypes.actions.some(a => word.includes(a))) {
                entities.actions.push(word);
            }
        }
        
        // Extract phrases
        if (input.includes('with')) {
            const withParts = input.split('with')[1]?.trim().split(/\s+/);
            if (withParts) {
                entities.custom.features = withParts;
            }
        }
        
        if (input.includes('for')) {
            const forParts = input.split('for')[1]?.trim();
            if (forParts) {
                entities.custom.purpose = forParts;
            }
        }
        
        return entities;
    }
    
    extractMusicIntent(input) {
        const entities = {
            service: 'spotify',
            action: null,
            timeframe: null,
            format: null
        };
        
        if (input.includes('wrapped')) {
            entities.action = 'generate_wrapped';
            entities.format = 'visual_summary';
        }
        
        if (input.includes('top songs')) {
            entities.action = 'get_top_tracks';
        }
        
        if (input.includes('calculate') || input.includes('match')) {
            entities.action = 'calculate_compatibility';
        }
        
        // Extract timeframes
        const timeframes = ['weekly', 'monthly', 'yearly', 'all time'];
        for (const tf of timeframes) {
            if (input.includes(tf)) {
                entities.timeframe = tf;
                break;
            }
        }
        
        return entities;
    }
    
    extractEventIntent(input) {
        const entities = {
            type: 'event',
            action: null,
            platform: null,
            verification: false
        };
        
        if (input.includes('ticketmaster')) {
            entities.platform = 'ticketmaster';
        }
        
        if (input.includes('verified') || input.includes('verify')) {
            entities.verification = true;
        }
        
        if (input.includes('meet')) {
            entities.action = 'organize_meetup';
        }
        
        return entities;
    }
    
    extractVerificationIntent(input) {
        const entities = {
            method: null,
            type: null,
            platform: null
        };
        
        if (input.includes('qr')) {
            entities.method = 'qr_code';
        }
        
        if (input.includes('peer to peer') || input.includes('p2p')) {
            entities.type = 'p2p';
        }
        
        if (input.includes('cd') || input.includes('vinyl')) {
            entities.method = 'physical_media';
        }
        
        return entities;
    }
    
    extractProfileIntent(input) {
        const entities = {
            platform: 'soulfra',
            features: [],
            integrations: []
        };
        
        if (input.includes('soulfra')) {
            entities.platform = 'soulfra';
        }
        
        if (input.includes('music')) {
            entities.integrations.push('spotify');
        }
        
        if (input.includes('space')) {
            entities.features.push('personal_space');
        }
        
        return entities;
    }
    
    extractGeneralEntities(input) {
        // Fallback general extraction
        return {
            raw: input,
            words: input.split(/\s+/),
            length: input.length
        };
    }
    
    async enhanceWithAI(input, intent, entities) {
        try {
            const prompt = `Analyze this user request and enhance the understanding:

User Input: "${input}"
Detected Intent: ${intent.type}
Initial Entities: ${JSON.stringify(entities)}

Please provide additional insights:
1. What is the user trying to achieve?
2. What specific features or attributes should be included?
3. What technology or platform would best serve this request?
4. Any missing information we should ask for?

Respond in JSON format with keys: goal, features, technology, questions`;

            const response = await axios.post(`${this.ollamaConfig.url}/api/generate`, {
                model: this.ollamaConfig.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: this.ollamaConfig.temperature
                }
            });
            
            try {
                // Extract JSON from response
                const responseText = response.data.response;
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                console.warn('Could not parse AI response as JSON');
            }
            
            return {
                enhanced: true,
                raw: response.data.response
            };
            
        } catch (error) {
            console.warn('AI enhancement failed:', error.message);
            return null;
        }
    }
    
    buildStructuredOutput(intent, entities, aiAnalysis) {
        const output = {
            timestamp: new Date().toISOString(),
            intent: intent,
            entities: entities,
            aiAnalysis: aiAnalysis,
            suggestions: this.generateSuggestions(intent, entities, aiAnalysis),
            nextSteps: this.determineNextSteps(intent, entities),
            confidence: this.calculateConfidence(intent, entities, aiAnalysis)
        };
        
        return output;
    }
    
    generateSuggestions(intent, entities, aiAnalysis) {
        const suggestions = [];
        
        switch (intent.type) {
            case 'creation':
                if (entities.objects.includes('boat')) {
                    suggestions.push({
                        template: '3d-pirate-ship',
                        customization: entities.attributes,
                        style: entities.custom?.purpose?.includes('rough') ? 'weathered' : 'pristine'
                    });
                }
                break;
                
            case 'music':
                suggestions.push({
                    template: 'spotify-wrapped',
                    features: ['top-tracks', 'genre-analysis', 'listening-time'],
                    sharing: ['qr-code', 'social-media', 'soulfra-profile']
                });
                break;
                
            case 'event':
                suggestions.push({
                    template: 'event-verification',
                    methods: ['qr-checkin', 'nfc-tap', 'facial-recognition'],
                    integration: entities.platform
                });
                break;
        }
        
        // Add AI suggestions if available
        if (aiAnalysis?.features) {
            suggestions.push({
                source: 'ai',
                features: aiAnalysis.features
            });
        }
        
        return suggestions;
    }
    
    determineNextSteps(intent, entities) {
        const steps = [];
        
        // Common next steps
        steps.push({
            action: 'select_template',
            priority: 1
        });
        
        // Intent-specific steps
        switch (intent.type) {
            case 'creation':
                steps.push({
                    action: 'customize_3d_model',
                    priority: 2
                });
                break;
                
            case 'music':
                steps.push({
                    action: 'connect_spotify',
                    priority: 2
                });
                steps.push({
                    action: 'generate_visualization',
                    priority: 3
                });
                break;
                
            case 'verification':
                steps.push({
                    action: 'generate_qr_code',
                    priority: 2
                });
                break;
        }
        
        return steps.sort((a, b) => a.priority - b.priority);
    }
    
    calculateConfidence(intent, entities, aiAnalysis) {
        let confidence = intent.confidence;
        
        // Boost confidence based on entity matches
        if (Object.values(entities).some(e => Array.isArray(e) ? e.length > 0 : e)) {
            confidence += 0.1;
        }
        
        // Boost if AI provided good analysis
        if (aiAnalysis && aiAnalysis.goal) {
            confidence += 0.1;
        }
        
        return Math.min(confidence, 1.0);
    }
    
    updateStats(intent, entities) {
        // Track intent types
        this.stats.intentsExtracted[intent.type] = 
            (this.stats.intentsExtracted[intent.type] || 0) + 1;
        
        // Track entity types found
        Object.keys(entities).forEach(entityType => {
            const value = entities[entityType];
            if (value && (Array.isArray(value) ? value.length > 0 : true)) {
                this.stats.entitiesFound[entityType] = 
                    (this.stats.entitiesFound[entityType] || 0) + 1;
            }
        });
    }
    
    startServer() {
        const express = require('express');
        const app = express();
        
        app.use(express.json());
        
        // Process endpoint
        app.post('/process', async (req, res) => {
            try {
                const { input } = req.body;
                
                if (!input) {
                    return res.status(400).json({ error: 'No input provided' });
                }
                
                const result = await this.processRequest(input);
                res.json(result);
                
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Statistics endpoint
        app.get('/stats', (req, res) => {
            res.json({
                ...this.stats,
                uptime: Date.now() - this.startTime
            });
        });
        
        // Test endpoint
        app.get('/test', async (req, res) => {
            const testInputs = [
                "I want a boat with armaments for the roughsparks network",
                "Calculate my spotify wrapped for this year",
                "Create a verified fan qr code for the concert",
                "Build me a profile page with music integration"
            ];
            
            const results = [];
            for (const input of testInputs) {
                const result = await this.processRequest(input);
                results.push({ input, result });
            }
            
            res.json(results);
        });
        
        app.listen(this.port, () => {
            console.log(`🌐 NLP Intent Processor API running on port ${this.port}`);
        });
    }
    
    getStats() {
        return this.stats;
    }
}

// Export
module.exports = NLPIntentProcessor;

// Run if called directly
if (require.main === module) {
    const processor = new NLPIntentProcessor();
    
    // Example processing
    setTimeout(async () => {
        console.log('\n📝 Example processing...\n');
        
        const examples = [
            "I want a boat that has a mast and armaments for the roughsparks network culture vultures and is shooting a cannon ball",
            "Generate my spotify wrapped with top songs and compatibility scores",
            "Create a verified fan QR code for meeting up at concerts"
        ];
        
        for (const example of examples) {
            console.log(`\nInput: "${example}"`);
            const result = await processor.processRequest(example);
            console.log('Result:', JSON.stringify(result, null, 2));
        }
    }, 2000);
    
    console.log(`
🧠 NLP INTENT PROCESSOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Processes natural language requests
Extracts intents and entities
Enhanced with AI understanding

API Endpoint: http://localhost:7783/process

Example usage:
  curl -X POST http://localhost:7783/process \\
    -H 'Content-Type: application/json' \\
    -d '{"input":"I want a boat with armaments"}'
    `);
}