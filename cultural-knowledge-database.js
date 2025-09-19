#!/usr/bin/env node

/**
 * CULTURAL KNOWLEDGE DATABASE
 * Database-first AI system that queries local cultural knowledge before external LLMs
 * Analyzes transcripts, discovers cultural patterns, and identifies authentic "culture warriors"
 * 
 * Features:
 * - SQLite database with cultural pattern storage
 * - Transcript analysis and cultural signal extraction
 * - "Diamond detection" algorithm for authentic vs artificial culture
 * - Query local knowledge first, then fall back to external LLMs
 * - Cultural scoring and influence mapping
 */

const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

console.log(`
💎 CULTURAL KNOWLEDGE DATABASE 💎
================================
🧠 Local cultural intelligence before external LLMs
📊 Transcript analysis & pattern detection
💫 Diamond detection for authentic culture warriors
🎯 Smart model weighting based on cultural context
`);

class CulturalKnowledgeDatabase extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            dbPath: config.dbPath || './cultural_knowledge.db',
            enableCulturalScoring: config.enableCulturalScoring !== false,
            enableTranscriptAnalysis: config.enableTranscriptAnalysis !== false,
            enableDiamondDetection: config.enableDiamondDetection !== false,
            
            // Cultural scoring weights
            authenticityWeight: config.authenticityWeight || 0.4,
            influenceWeight: config.influenceWeight || 0.3,
            consistencyWeight: config.consistencyWeight || 0.2,
            engagementWeight: config.engagementWeight || 0.1,
            
            // Model selection thresholds
            localKnowledgeThreshold: config.localKnowledgeThreshold || 0.7,
            culturalRelevanceThreshold: config.culturalRelevanceThreshold || 0.5,
            
            ...config
        };
        
        // Cultural pattern categories
        this.culturalPatterns = {
            leadership: {
                keywords: ['vision', 'strategy', 'leadership', 'team', 'guide', 'inspire', 'direction'],
                indicators: ['taking charge', 'making decisions', 'inspiring others', 'setting vision'],
                antiPatterns: ['micromanaging', 'blame shifting', 'ego-driven', 'authoritarian']
            },
            
            technical: {
                keywords: ['code', 'architecture', 'system', 'build', 'engineer', 'technical', 'solve'],
                indicators: ['problem solving', 'systematic thinking', 'building solutions', 'teaching'],
                antiPatterns: ['gatekeeping', 'elitism', 'dismissive', 'over-engineering']
            },
            
            creative: {
                keywords: ['creative', 'design', 'art', 'innovative', 'original', 'expression', 'aesthetic'],
                indicators: ['original thinking', 'aesthetic sense', 'pushing boundaries', 'inspiring'],
                antiPatterns: ['copying', 'trend following', 'superficial', 'commercialized']
            },
            
            community: {
                keywords: ['community', 'people', 'connection', 'helping', 'support', 'together', 'collective'],
                indicators: ['building bridges', 'helping others', 'creating inclusion', 'facilitating'],
                antiPatterns: ['toxic behavior', 'divisiveness', 'exclusion', 'exploitation']
            },
            
            entrepreneur: {
                keywords: ['business', 'startup', 'opportunity', 'market', 'value', 'growth', 'innovation'],
                indicators: ['identifying opportunities', 'taking risks', 'creating value', 'scaling'],
                antiPatterns: ['get rich quick', 'exploitation', 'corner cutting', 'hype-driven']
            }
        };
        
        // Cultural authenticity signals
        this.authenticitySignals = {
            positive: [
                'consistent messaging over time',
                'admits mistakes and learns',
                'credits others appropriately',
                'shows vulnerability',
                'teaches without gatekeeping',
                'builds others up',
                'walks the walk'
            ],
            
            negative: [
                'contradictory statements',
                'never admits fault',
                'takes credit inappropriately',
                'performative behavior',
                'gatekeeping knowledge',
                'puts others down',
                'talks without action'
            ]
        };
        
        // Domain mapping for cultural routing
        this.culturalDomains = {
            matthew: ['leadership', 'entrepreneur', 'vision'],
            roughsparks: ['technical', 'security', 'systems'],
            soulfra: ['business', 'platform', 'automation'],
            'document-generator': ['productivity', 'automation', 'tools']
        };
        
        this.db = null;
        this.modelWeights = new Map();
        this.culturalCache = new Map();
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing Cultural Knowledge Database...');
        
        try {
            // Initialize SQLite database
            await this.initializeDatabase();
            
            // Create cultural analysis tables
            await this.createCulturalTables();
            
            // Load existing cultural patterns
            await this.loadCulturalPatterns();
            
            // Initialize model weighting system
            await this.initializeModelWeighting();
            
            console.log('✅ Cultural Knowledge Database ready!');
            console.log(`📊 Tracking ${Object.keys(this.culturalPatterns).length} cultural pattern types`);
            console.log(`💎 Diamond detection algorithm active`);
            console.log(`🧠 Local-first AI routing enabled`);
            
            this.emit('database_ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Cultural Knowledge Database:', error);
            throw error;
        }
    }
    
    async initializeDatabase() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.config.dbPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('🗄️ SQLite database connected');
                    resolve();
                }
            });
        });
    }
    
    async createCulturalTables() {
        const tables = [
            // Cultural profiles for users/entities
            `CREATE TABLE IF NOT EXISTS cultural_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                entity_id TEXT UNIQUE NOT NULL,
                entity_type TEXT NOT NULL, -- 'user', 'transcript', 'content'
                cultural_categories TEXT, -- JSON array of cultural categories
                authenticity_score REAL DEFAULT 0.0,
                influence_score REAL DEFAULT 0.0,
                consistency_score REAL DEFAULT 0.0,
                engagement_score REAL DEFAULT 0.0,
                overall_cultural_score REAL DEFAULT 0.0,
                is_culture_warrior BOOLEAN DEFAULT FALSE,
                cultural_domain TEXT, -- matthew, roughsparks, soulfra, etc.
                profile_data TEXT, -- JSON blob with detailed analysis
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Transcript analysis and cultural extraction
            `CREATE TABLE IF NOT EXISTS transcript_analysis (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transcript_id TEXT UNIQUE NOT NULL,
                source TEXT, -- 'conversation', 'podcast', 'video', 'meeting'
                participant_count INTEGER DEFAULT 1,
                duration_minutes INTEGER,
                content_text TEXT NOT NULL,
                cultural_signals TEXT, -- JSON array of detected cultural signals
                dominant_patterns TEXT, -- JSON array of strongest cultural patterns
                authenticity_markers TEXT, -- JSON array of authenticity signals
                cultural_influence_score REAL DEFAULT 0.0,
                diamond_potential REAL DEFAULT 0.0, -- 0-1 score for being a "diamond"
                extracted_insights TEXT, -- JSON array of key cultural insights
                recommended_actions TEXT, -- JSON array of suggested actions
                processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Cultural pattern library (local knowledge base)
            `CREATE TABLE IF NOT EXISTS cultural_patterns (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern_name TEXT UNIQUE NOT NULL,
                pattern_category TEXT NOT NULL,
                keywords TEXT, -- JSON array of keywords
                indicators TEXT, -- JSON array of positive indicators
                anti_patterns TEXT, -- JSON array of negative indicators
                cultural_weight REAL DEFAULT 1.0,
                success_examples TEXT, -- JSON array of successful examples
                failure_examples TEXT, -- JSON array of failure examples
                domain_mapping TEXT, -- JSON object mapping to domains
                usage_count INTEGER DEFAULT 0,
                effectiveness_score REAL DEFAULT 0.0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Local knowledge queries (to reduce external LLM calls)
            `CREATE TABLE IF NOT EXISTS knowledge_queries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query_hash TEXT UNIQUE NOT NULL,
                query_text TEXT NOT NULL,
                query_type TEXT, -- 'cultural_analysis', 'pattern_detection', 'authenticity_check'
                local_response TEXT, -- Response from local analysis
                confidence_score REAL DEFAULT 0.0,
                external_llm_needed BOOLEAN DEFAULT TRUE,
                external_response TEXT, -- Response from external LLM if needed
                response_quality_score REAL DEFAULT 0.0,
                usage_count INTEGER DEFAULT 0,
                last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            
            // Cultural influence network mapping
            `CREATE TABLE IF NOT EXISTS cultural_influence_network (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_entity TEXT NOT NULL,
                target_entity TEXT NOT NULL,
                influence_type TEXT, -- 'mentorship', 'collaboration', 'inspiration', 'opposition'
                influence_strength REAL DEFAULT 0.0,
                cultural_context TEXT, -- JSON object with context
                interaction_frequency INTEGER DEFAULT 0,
                relationship_quality TEXT, -- 'positive', 'negative', 'neutral', 'complex'
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(source_entity, target_entity, influence_type)
            )`,
            
            // Model performance tracking
            `CREATE TABLE IF NOT EXISTS model_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                model_name TEXT NOT NULL,
                query_type TEXT NOT NULL,
                cultural_context TEXT,
                response_quality REAL DEFAULT 0.0,
                processing_time_ms INTEGER,
                cost_estimate REAL DEFAULT 0.0,
                user_satisfaction REAL DEFAULT 0.0,
                local_vs_external TEXT, -- 'local_only', 'external_only', 'hybrid'
                effectiveness_score REAL DEFAULT 0.0,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];
        
        for (const tableSQL of tables) {
            await new Promise((resolve, reject) => {
                this.db.run(tableSQL, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
        
        console.log('📊 Cultural analysis tables created');
    }
    
    /**
     * Query local cultural knowledge first, then decide if external LLM is needed
     */
    async queryWithCulturalIntelligence(query, context = {}) {
        const queryId = crypto.randomUUID();
        const queryHash = crypto.createHash('sha256').update(query).digest('hex');
        
        console.log(`🧠 Cultural intelligence query: ${queryId}`);
        console.log(`   Query: "${query.substring(0, 100)}..."`);
        
        try {
            // 1. Check if we have local knowledge for this query
            const localKnowledge = await this.checkLocalKnowledge(queryHash, query);
            
            // 2. Analyze cultural context
            const culturalContext = await this.analyzeCulturalContext(query, context);
            
            // 3. Determine if we need external LLM
            const needsExternalLLM = await this.shouldUseExternalLLM(localKnowledge, culturalContext);
            
            let response;
            let confidence;
            let processingTime = Date.now();
            
            if (!needsExternalLLM && localKnowledge.confidence > this.config.localKnowledgeThreshold) {
                // Use local knowledge
                console.log('  📚 Using local cultural knowledge');
                response = await this.generateLocalResponse(query, localKnowledge, culturalContext);
                confidence = localKnowledge.confidence;
            } else {
                // Route to appropriate external LLM based on cultural context
                console.log('  🌐 Routing to external LLM with cultural context');
                const selectedModel = await this.selectOptimalModel(culturalContext);
                response = await this.queryExternalLLM(query, selectedModel, culturalContext);
                confidence = 0.8; // Default confidence for external LLMs
                
                // Store response for future local use
                await this.storeCulturalKnowledge(queryHash, query, response, culturalContext);
            }
            
            processingTime = Date.now() - processingTime;
            
            // Record performance metrics
            await this.recordModelPerformance(
                needsExternalLLM ? 'external_llm' : 'local_knowledge',
                culturalContext,
                confidence,
                processingTime
            );
            
            const result = {
                queryId,
                response,
                confidence,
                source: needsExternalLLM ? 'external_llm' : 'local_knowledge',
                culturalContext,
                processingTime,
                localKnowledgeUsed: !needsExternalLLM,
                modelWeights: this.calculateCurrentModelWeights(culturalContext)
            };
            
            this.emit('query_completed', result);
            
            return result;
            
        } catch (error) {
            console.error(`❌ Cultural intelligence query failed: ${error.message}`);
            return {
                queryId,
                error: error.message,
                fallback: await this.generateFallbackResponse(query)
            };
        }
    }
    
    /**
     * Analyze transcript for cultural patterns and authenticity
     */
    async analyzeTranscript(transcriptId, content, metadata = {}) {
        console.log(`📝 Analyzing transcript: ${transcriptId}`);
        
        try {
            const analysis = {
                transcriptId,
                culturalSignals: [],
                dominantPatterns: [],
                authenticityMarkers: [],
                diamondPotential: 0,
                culturalInfluenceScore: 0,
                extractedInsights: [],
                recommendedActions: []
            };
            
            // 1. Extract cultural signals
            analysis.culturalSignals = await this.extractCulturalSignals(content);
            
            // 2. Identify dominant cultural patterns
            analysis.dominantPatterns = await this.identifyDominantPatterns(content, analysis.culturalSignals);
            
            // 3. Analyze authenticity markers
            analysis.authenticityMarkers = await this.analyzeAuthenticity(content);
            
            // 4. Calculate diamond potential (authentic culture warrior score)
            analysis.diamondPotential = await this.calculateDiamondPotential(
                analysis.culturalSignals,
                analysis.authenticityMarkers,
                metadata
            );
            
            // 5. Calculate cultural influence score
            analysis.culturalInfluenceScore = await this.calculateCulturalInfluence(
                analysis.dominantPatterns,
                analysis.diamondPotential,
                metadata
            );
            
            // 6. Generate insights and recommendations
            analysis.extractedInsights = await this.extractCulturalInsights(analysis);
            analysis.recommendedActions = await this.generateCulturalRecommendations(analysis);
            
            // Store analysis in database
            await this.storeTranscriptAnalysis(analysis, content, metadata);
            
            console.log(`✅ Transcript analysis complete:`);
            console.log(`   Cultural signals: ${analysis.culturalSignals.length}`);
            console.log(`   Dominant patterns: ${analysis.dominantPatterns.join(', ')}`);
            console.log(`   Diamond potential: ${(analysis.diamondPotential * 100).toFixed(1)}%`);
            console.log(`   Cultural influence: ${(analysis.culturalInfluenceScore * 100).toFixed(1)}%`);
            
            this.emit('transcript_analyzed', analysis);
            
            return analysis;
            
        } catch (error) {
            console.error(`❌ Transcript analysis failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Cultural authenticity and "diamond detection" algorithm
     */
    async calculateDiamondPotential(culturalSignals, authenticityMarkers, metadata = {}) {
        let score = 0;
        let factors = [];
        
        // Factor 1: Authenticity signals (40% weight)
        const authenticityScore = this.scoreAuthenticity(authenticityMarkers);
        score += authenticityScore * this.config.authenticityWeight;
        factors.push({ factor: 'authenticity', score: authenticityScore, weight: this.config.authenticityWeight });
        
        // Factor 2: Cultural influence signals (30% weight)
        const influenceScore = this.scoreCulturalInfluence(culturalSignals);
        score += influenceScore * this.config.influenceWeight;
        factors.push({ factor: 'influence', score: influenceScore, weight: this.config.influenceWeight });
        
        // Factor 3: Consistency over time (20% weight)
        const consistencyScore = await this.scoreConsistency(metadata.entityId);
        score += consistencyScore * this.config.consistencyWeight;
        factors.push({ factor: 'consistency', score: consistencyScore, weight: this.config.consistencyWeight });
        
        // Factor 4: Engagement quality (10% weight)
        const engagementScore = this.scoreEngagementQuality(culturalSignals, metadata);
        score += engagementScore * this.config.engagementWeight;
        factors.push({ factor: 'engagement', score: engagementScore, weight: this.config.engagementWeight });
        
        console.log(`💎 Diamond potential calculation:`);
        factors.forEach(f => {
            console.log(`   ${f.factor}: ${(f.score * 100).toFixed(1)}% (weight: ${(f.weight * 100).toFixed(0)}%)`);
        });
        console.log(`   Overall: ${(score * 100).toFixed(1)}%`);
        
        return Math.max(0, Math.min(1, score));
    }
    
    /**
     * Extract cultural signals from text content
     */
    async extractCulturalSignals(content) {
        const signals = [];
        const contentLower = content.toLowerCase();
        
        // Analyze each cultural pattern category
        for (const [category, pattern] of Object.entries(this.culturalPatterns)) {
            let categoryScore = 0;
            const matchedKeywords = [];
            const matchedIndicators = [];
            const matchedAntiPatterns = [];
            
            // Check for keywords
            for (const keyword of pattern.keywords) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const matches = content.match(regex) || [];
                if (matches.length > 0) {
                    categoryScore += matches.length * 0.1;
                    matchedKeywords.push({ keyword, count: matches.length });
                }
            }
            
            // Check for positive indicators
            for (const indicator of pattern.indicators) {
                if (contentLower.includes(indicator.toLowerCase())) {
                    categoryScore += 0.3;
                    matchedIndicators.push(indicator);
                }
            }
            
            // Check for anti-patterns (subtract from score)
            for (const antiPattern of pattern.antiPatterns) {
                if (contentLower.includes(antiPattern.toLowerCase())) {
                    categoryScore -= 0.2;
                    matchedAntiPatterns.push(antiPattern);
                }
            }
            
            if (categoryScore > 0.1) {
                signals.push({
                    category,
                    score: Math.max(0, categoryScore),
                    keywords: matchedKeywords,
                    indicators: matchedIndicators,
                    antiPatterns: matchedAntiPatterns,
                    confidence: Math.min(1.0, categoryScore / 2.0)
                });
            }
        }
        
        return signals.sort((a, b) => b.score - a.score);
    }
    
    /**
     * Determine optimal AI model based on cultural context
     */
    async selectOptimalModel(culturalContext) {
        const models = [
            { name: 'ollama/codellama', strengths: ['technical', 'engineering'], cost: 0 },
            { name: 'ollama/llama3.2:3b', strengths: ['general', 'analysis'], cost: 0 },
            { name: 'anthropic/claude-3-haiku', strengths: ['creative', 'nuanced'], cost: 0.25 },
            { name: 'anthropic/claude-3-sonnet', strengths: ['leadership', 'strategy'], cost: 3.0 },
            { name: 'openai/gpt-4', strengths: ['complex', 'synthesis'], cost: 30.0 }
        ];
        
        let bestModel = models[0];
        let bestScore = 0;
        
        for (const model of models) {
            let score = 0;
            
            // Score based on cultural context alignment
            if (culturalContext.dominantPatterns) {
                for (const pattern of culturalContext.dominantPatterns) {
                    if (model.strengths.includes(pattern)) {
                        score += 2.0;
                    }
                }
            }
            
            // Factor in cost efficiency
            const costEfficiency = 1.0 / (model.cost + 0.1);
            score *= costEfficiency;
            
            if (score > bestScore) {
                bestScore = score;
                bestModel = model;
            }
        }
        
        console.log(`🤖 Selected model: ${bestModel.name} (score: ${bestScore.toFixed(2)})`);
        return bestModel.name;
    }
    
    // Utility methods for cultural analysis
    scoreAuthenticity(authenticityMarkers) {
        if (!authenticityMarkers || authenticityMarkers.length === 0) return 0.5;
        
        let score = 0.5; // Base score
        
        authenticityMarkers.forEach(marker => {
            if (this.authenticitySignals.positive.some(signal => 
                marker.toLowerCase().includes(signal.toLowerCase()))) {
                score += 0.1;
            }
            if (this.authenticitySignals.negative.some(signal => 
                marker.toLowerCase().includes(signal.toLowerCase()))) {
                score -= 0.15;
            }
        });
        
        return Math.max(0, Math.min(1, score));
    }
    
    scoreCulturalInfluence(culturalSignals) {
        if (!culturalSignals || culturalSignals.length === 0) return 0;
        
        const totalScore = culturalSignals.reduce((sum, signal) => sum + signal.score, 0);
        const averageConfidence = culturalSignals.reduce((sum, signal) => sum + signal.confidence, 0) / culturalSignals.length;
        
        return Math.min(1, (totalScore / 5.0) * averageConfidence);
    }
    
    async scoreConsistency(entityId) {
        if (!entityId) return 0.5;
        
        // Query historical data for consistency analysis
        const historicalData = await this.getHistoricalCulturalData(entityId);
        
        if (historicalData.length < 2) return 0.5;
        
        // Calculate consistency based on pattern variance over time
        const patterns = historicalData.map(d => d.dominantPatterns);
        const consistency = this.calculatePatternConsistency(patterns);
        
        return consistency;
    }
    
    scoreEngagementQuality(culturalSignals, metadata) {
        let score = 0.5;
        
        // Quality indicators
        if (metadata.participantCount > 1) score += 0.1;
        if (metadata.duration_minutes > 30) score += 0.1;
        if (culturalSignals.some(s => s.category === 'community')) score += 0.2;
        
        return Math.min(1, score);
    }
    
    // Placeholder methods for full implementation
    async loadCulturalPatterns() { console.log('📊 Loading cultural patterns...'); }
    async initializeModelWeighting() { console.log('⚖️ Initializing model weighting...'); }
    async checkLocalKnowledge(hash, query) { return { confidence: 0.3, response: null }; }
    async analyzeCulturalContext(query, context) { return { dominantPatterns: ['general'], culturalRelevance: 0.5 }; }
    async shouldUseExternalLLM(local, cultural) { return local.confidence < 0.7; }
    async generateLocalResponse(query, knowledge, context) { return `Local response for: ${query}`; }
    async queryExternalLLM(query, model, context) { return `External response for: ${query} using ${model}`; }
    async storeCulturalKnowledge(hash, query, response, context) { console.log('💾 Storing cultural knowledge...'); }
    async recordModelPerformance(model, context, confidence, time) { console.log(`📊 Recording performance: ${model}`); }
    calculateCurrentModelWeights(context) { return { local: 0.7, external: 0.3 }; }
    async generateFallbackResponse(query) { return `Fallback response for: ${query}`; }
    async identifyDominantPatterns(content, signals) { return signals.slice(0, 3).map(s => s.category); }
    async analyzeAuthenticity(content) { return ['consistent messaging', 'admits mistakes']; }
    async calculateCulturalInfluence(patterns, diamond, metadata) { return diamond * 0.8; }
    async extractCulturalInsights(analysis) { return ['Strong technical leadership', 'Authentic communication']; }
    async generateCulturalRecommendations(analysis) { return ['Continue building technical community', 'Share more experiences']; }
    async storeTranscriptAnalysis(analysis, content, metadata) { console.log(`💾 Storing analysis: ${analysis.transcriptId}`); }
    async getHistoricalCulturalData(entityId) { return []; }
    calculatePatternConsistency(patterns) { return 0.8; }
}

// Export the system
module.exports = CulturalKnowledgeDatabase;

// Example usage and testing
if (require.main === module) {
    async function testCulturalDatabase() {
        console.log('🧪 Testing Cultural Knowledge Database...\n');
        
        const culturalDB = new CulturalKnowledgeDatabase({
            dbPath: './test_cultural_knowledge.db'
        });
        
        // Wait for initialization
        await new Promise(resolve => culturalDB.on('database_ready', resolve));
        
        // Test cultural intelligence query
        console.log('🧠 Testing cultural intelligence query...');
        const queryResult = await culturalDB.queryWithCulturalIntelligence(
            'How can we build a stronger technical leadership culture in our organization?',
            { domain: 'roughsparks', userType: 'technical_leader' }
        );
        
        console.log(`Query result:`, queryResult);
        
        // Test transcript analysis
        console.log('\n📝 Testing transcript analysis...');
        const sampleTranscript = `
        I think the key to technical leadership is not just knowing the code, but being able to 
        inspire and guide your team. You need to admit when you don't know something and be 
        willing to learn. I've made mistakes in the past, but that's how I grew. The best 
        leaders I know are the ones who build others up, not tear them down. They create 
        systems that scale, but more importantly, they create cultures where people can thrive.
        
        I always try to teach what I learn, because knowledge shouldn't be hoarded. When someone 
        junior asks a question, I remember being in their shoes. The goal isn't to show how 
        smart you are, it's to help the whole team get better.
        `;
        
        const transcriptAnalysis = await culturalDB.analyzeTranscript(
            'sample-transcript-001',
            sampleTranscript,
            {
                entityId: 'tech-leader-001',
                source: 'podcast',
                duration_minutes: 45,
                participantCount: 2
            }
        );
        
        console.log('\nTranscript Analysis Results:');
        console.log(`  Diamond Potential: ${(transcriptAnalysis.diamondPotential * 100).toFixed(1)}%`);
        console.log(`  Cultural Influence: ${(transcriptAnalysis.culturalInfluenceScore * 100).toFixed(1)}%`);
        console.log(`  Dominant Patterns: ${transcriptAnalysis.dominantPatterns.join(', ')}`);
        console.log(`  Insights: ${transcriptAnalysis.extractedInsights.join(', ')}`);
        
        console.log('\n✅ Cultural Knowledge Database testing complete!');
    }
    
    testCulturalDatabase().catch(console.error);
}