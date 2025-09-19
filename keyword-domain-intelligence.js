/**
 * Keyword Domain Intelligence System
 * Integrates blockchain oracle crawler for real-time keyword detection and domain mapping
 * Maps keywords to relevant domains (matthew, roughsparks, etc.) and builds contextual understanding
 * Feeds into grant narrative generation and public/private display routing
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const BlockchainOracleCrawler = require('./blockchain-oracle-crawler');

class KeywordDomainIntelligence extends EventEmitter {
    constructor(oracleCrawler, metaOrchestrator, database, config = {}) {
        super();
        
        this.oracle = oracleCrawler;
        this.metaOrchestrator = metaOrchestrator;
        this.db = database;
        this.config = {
            enableRealTimeDetection: true,
            enableDomainMapping: true,
            enableContextualAnalysis: true,
            keywordScanInterval: 15000, // 15 seconds
            domainRelevanceThreshold: 0.6,
            contextWindowSize: 200, // words
            maxKeywordsPerScan: 50,
            enableGrantRelevanceScoring: true,
            ...config
        };
        
        // Domain structure for the holding company
        this.domainStructure = {
            'matthew': {
                type: 'personal_brand',
                focus: ['leadership', 'vision', 'strategy', 'innovation'],
                grants: ['leadership_development', 'entrepreneurship', 'innovation_grants'],
                publicProfile: {
                    description: 'Visionary leader driving technological innovation',
                    expertise: ['AI/ML', 'Blockchain', 'Fintech', 'Strategic Planning'],
                    achievements: ['Multiple successful projects', 'Community leadership']
                },
                privateProfile: {
                    internalRole: 'CEO/Founder',
                    decisionAuthority: 'final_approval',
                    accessLevel: 'all_systems'
                }
            },
            'roughsparks': {
                type: 'technical_brand',
                focus: ['development', 'architecture', 'implementation', 'security'],
                grants: ['technical_innovation', 'open_source', 'security_research'],
                publicProfile: {
                    description: 'Technical architect and security specialist',
                    expertise: ['System Architecture', 'Cybersecurity', 'Open Source', 'DevOps'],
                    achievements: ['Security frameworks', 'Open source contributions']
                },
                privateProfile: {
                    internalRole: 'CTO/Lead Developer',
                    decisionAuthority: 'technical_decisions',
                    accessLevel: 'development_systems'
                }
            },
            'soulfra': {
                type: 'company_brand',
                focus: ['product', 'platform', 'services', 'business'],
                grants: ['startup_grants', 'platform_development', 'business_innovation'],
                publicProfile: {
                    description: 'AI-powered document and workflow automation platform',
                    expertise: ['Document Processing', 'AI Integration', 'Workflow Automation'],
                    achievements: ['Platform development', 'Client success stories']
                },
                privateProfile: {
                    internalRole: 'Main Business Entity',
                    decisionAuthority: 'business_operations',
                    accessLevel: 'business_systems'
                }
            },
            'document-generator': {
                type: 'product_brand',
                focus: ['automation', 'ai', 'productivity', 'tools'],
                grants: ['ai_research', 'productivity_tools', 'automation_grants'],
                publicProfile: {
                    description: 'Revolutionary document generation and MVP creation platform',
                    expertise: ['AI Generation', 'Template Processing', 'Rapid Prototyping'],
                    achievements: ['Template library', 'Generation speed improvements']
                },
                privateProfile: {
                    internalRole: 'Core Product',
                    decisionAuthority: 'product_features',
                    accessLevel: 'product_systems'
                }
            }
        };
        
        // Keyword intelligence patterns
        this.keywordPatterns = {
            // Technology keywords
            technology: {
                ai_ml: ['artificial intelligence', 'machine learning', 'ai', 'ml', 'neural networks', 'deep learning'],
                blockchain: ['blockchain', 'cryptocurrency', 'defi', 'smart contracts', 'web3', 'ethereum', 'solana'],
                development: ['javascript', 'node.js', 'python', 'react', 'api', 'database', 'cloud'],
                security: ['cybersecurity', 'encryption', 'security', 'authentication', 'authorization', 'penetration testing']
            },
            
            // Business keywords
            business: {
                funding: ['grant', 'funding', 'investment', 'seed', 'series a', 'venture capital', 'angel'],
                growth: ['scale', 'expansion', 'market', 'customer', 'revenue', 'business model'],
                innovation: ['innovation', 'disruption', 'breakthrough', 'revolutionary', 'cutting-edge'],
                social_impact: ['community', 'social good', 'impact', 'sustainability', 'education', 'accessibility']
            },
            
            // Grant-relevant keywords
            grants: {
                eligibility: ['small business', 'startup', 'minority-owned', 'veteran-owned', 'women-owned'],
                focus_areas: ['research', 'development', 'innovation', 'education', 'healthcare', 'environment'],
                outcomes: ['job creation', 'economic development', 'community benefit', 'research advancement']
            },
            
            // Domain-specific keywords
            domains: {
                matthew: ['leadership', 'vision', 'strategy', 'founder', 'ceo', 'executive', 'business strategy'],
                roughsparks: ['technical', 'architecture', 'development', 'security', 'infrastructure', 'engineering'],
                soulfra: ['platform', 'automation', 'workflow', 'business process', 'enterprise', 'saas'],
                'document-generator': ['generation', 'templates', 'automation', 'productivity', 'mvp', 'rapid development']
            }
        };
        
        // Context analysis engine
        this.contextAnalyzer = {
            relevanceScorers: new Map(),
            domainMappers: new Map(),
            grantMatchers: new Map(),
            narrativeBuilders: new Map()
        };
        
        // Real-time intelligence state
        this.intelligenceState = {
            activeKeywords: new Map(),
            domainMappings: new Map(),
            grantOpportunities: new Map(),
            contextualInsights: new Map(),
            lastScan: 0,
            totalDetections: 0
        };
        
        this.initializeIntelligence();
    }
    
    /**
     * Initialize the keyword domain intelligence system
     */
    async initializeIntelligence() {
        console.log('🧠 Initializing Keyword Domain Intelligence...');
        
        try {
            // Initialize databases
            await this.initializeIntelligenceDatabases();
            
            // Load existing keyword mappings
            await this.loadExistingMappings();
            
            // Initialize context analyzers
            await this.initializeContextAnalyzers();
            
            // Start real-time keyword detection
            if (this.config.enableRealTimeDetection) {
                this.startRealTimeDetection();
            }
            
            // Start domain mapping
            if (this.config.enableDomainMapping) {
                this.startDomainMapping();
            }
            
            // Start contextual analysis
            if (this.config.enableContextualAnalysis) {
                this.startContextualAnalysis();
            }
            
            console.log('✅ Keyword Domain Intelligence Online');
            console.log('🔍 Real-time keyword detection active');
            console.log('🏢 Domain mapping system operational');
            console.log('📊 Contextual analysis running');
            console.log(`🎯 Monitoring ${Object.keys(this.domainStructure).length} domains`);
            
            this.emit('intelligence_ready', {
                domains: Object.keys(this.domainStructure),
                patterns: Object.keys(this.keywordPatterns),
                realTimeDetection: this.config.enableRealTimeDetection
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize keyword intelligence:', error);
            throw error;
        }
    }
    
    /**
     * Detect keywords from various data sources and map to domains
     */
    async detectAndMapKeywords(source, data, context = {}) {
        try {
            const detectionId = crypto.randomUUID();
            const startTime = Date.now();
            
            console.log(`🔍 Detecting keywords from ${source}...`);
            
            // Extract text content based on source type
            const textContent = this.extractTextContent(source, data);
            
            // Detect keywords using pattern matching
            const detectedKeywords = await this.detectKeywords(textContent, context);
            
            // Score relevance to domains
            const domainRelevance = await this.scoreDomainRelevance(detectedKeywords, context);
            
            // Map keywords to domains
            const domainMappings = await this.mapKeywordsToDomains(detectedKeywords, domainRelevance);
            
            // Analyze grant relevance
            const grantRelevance = await this.analyzeGrantRelevance(detectedKeywords, domainMappings);
            
            // Build contextual insights
            const contextualInsights = await this.buildContextualInsights(detectedKeywords, domainMappings, grantRelevance);
            
            // Store detection results
            const detectionResult = {
                detectionId,
                source,
                timestamp: Date.now(),
                processingTime: Date.now() - startTime,
                keywords: detectedKeywords,
                domainMappings,
                grantRelevance,
                contextualInsights,
                confidence: this.calculateOverallConfidence(detectedKeywords, domainMappings)
            };
            
            // Update intelligence state
            await this.updateIntelligenceState(detectionResult);
            
            // Store in database
            await this.storeDetectionResult(detectionResult);
            
            console.log(`✅ Keyword detection complete: ${detectedKeywords.length} keywords, ${domainMappings.length} domain mappings`);
            
            this.emit('keywords_detected', detectionResult);
            
            return detectionResult;
            
        } catch (error) {
            console.error(`❌ Failed to detect keywords from ${source}:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Get domain-specific intelligence for grant applications
     */
    async getDomainIntelligence(domainName, focusArea = null) {
        try {
            const domain = this.domainStructure[domainName];
            
            if (!domain) {
                throw new Error(`Unknown domain: ${domainName}`);
            }
            
            console.log(`📊 Getting intelligence for domain: ${domainName}`);
            
            // Get recent keyword detections for this domain
            const recentKeywords = await this.getRecentKeywordsForDomain(domainName);
            
            // Get grant opportunities
            const grantOpportunities = await this.getGrantOpportunitiesForDomain(domainName, focusArea);
            
            // Build domain narrative
            const domainNarrative = await this.buildDomainNarrative(domainName, recentKeywords, grantOpportunities);
            
            // Get competitive intelligence
            const competitiveIntel = await this.getCompetitiveIntelligence(domainName);
            
            // Calculate domain strength score
            const strengthScore = await this.calculateDomainStrengthScore(domainName, recentKeywords);
            
            const intelligence = {
                domain: domainName,
                config: domain,
                narrative: domainNarrative,
                keywords: recentKeywords,
                grants: grantOpportunities,
                competitive: competitiveIntel,
                strength: strengthScore,
                lastUpdated: Date.now(),
                recommendations: await this.generateDomainRecommendations(domainName, strengthScore)
            };
            
            return intelligence;
            
        } catch (error) {
            console.error(`❌ Failed to get domain intelligence for ${domainName}:`, error);
            return null;
        }
    }
    
    /**
     * Build grant-relevant narrative for holding company
     */
    async buildHoldingCompanyNarrative(grantCriteria = {}) {
        try {
            console.log('📝 Building holding company narrative for grants...');
            
            // Get intelligence for all domains
            const domainIntelligence = {};
            for (const domainName of Object.keys(this.domainStructure)) {
                domainIntelligence[domainName] = await this.getDomainIntelligence(domainName);
            }
            
            // Analyze grant criteria alignment
            const criteriaAlignment = await this.analyzeGrantCriteriaAlignment(domainIntelligence, grantCriteria);
            
            // Build unified narrative
            const narrative = {
                executive_summary: await this.buildExecutiveSummary(domainIntelligence),
                company_overview: await this.buildCompanyOverview(domainIntelligence),
                leadership_team: await this.buildLeadershipProfile(domainIntelligence),
                technical_capabilities: await this.buildTechnicalCapabilities(domainIntelligence),
                social_impact: await this.buildSocialImpactStatement(domainIntelligence),
                innovation_portfolio: await this.buildInnovationPortfolio(domainIntelligence),
                funding_justification: await this.buildFundingJustification(domainIntelligence, grantCriteria),
                grant_alignment: criteriaAlignment,
                success_metrics: await this.defineSuccessMetrics(domainIntelligence, grantCriteria)
            };
            
            console.log('✅ Holding company narrative built');
            
            this.emit('narrative_built', narrative);
            
            return narrative;
            
        } catch (error) {
            console.error('❌ Failed to build holding company narrative:', error);
            return null;
        }
    }
    
    /**
     * Detect keywords using pattern matching and NLP
     */
    async detectKeywords(textContent, context) {
        const detectedKeywords = [];
        
        // Pattern-based detection
        for (const [category, patterns] of Object.entries(this.keywordPatterns)) {
            for (const [subcategory, keywords] of Object.entries(patterns)) {
                for (const keyword of keywords) {
                    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
                    const matches = textContent.match(regex) || [];
                    
                    if (matches.length > 0) {
                        detectedKeywords.push({
                            keyword,
                            category,
                            subcategory,
                            frequency: matches.length,
                            context: this.extractKeywordContext(textContent, keyword),
                            confidence: this.calculateKeywordConfidence(keyword, matches, textContent)
                        });
                    }
                }
            }
        }
        
        // Remove duplicates and sort by confidence
        return detectedKeywords
            .filter((item, index, arr) => arr.findIndex(i => i.keyword === item.keyword) === index)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, this.config.maxKeywordsPerScan);
    }
    
    /**
     * Score relevance of keywords to domains
     */
    async scoreDomainRelevance(keywords, context) {
        const relevanceScores = {};
        
        for (const domainName of Object.keys(this.domainStructure)) {
            const domain = this.domainStructure[domainName];
            relevanceScores[domainName] = 0;
            
            for (const keywordData of keywords) {
                const keyword = keywordData.keyword.toLowerCase();
                
                // Check direct domain keywords
                if (this.keywordPatterns.domains[domainName]) {
                    const domainKeywords = this.keywordPatterns.domains[domainName];
                    if (domainKeywords.some(dk => dk.toLowerCase().includes(keyword) || keyword.includes(dk.toLowerCase()))) {
                        relevanceScores[domainName] += 0.8 * keywordData.confidence;
                    }
                }
                
                // Check focus area alignment
                for (const focusArea of domain.focus) {
                    if (keyword.includes(focusArea.toLowerCase()) || focusArea.toLowerCase().includes(keyword)) {
                        relevanceScores[domainName] += 0.6 * keywordData.confidence;
                    }
                }
                
                // Check grant category alignment
                for (const grantType of domain.grants) {
                    if (keyword.includes(grantType.toLowerCase()) || grantType.toLowerCase().includes(keyword)) {
                        relevanceScores[domainName] += 0.5 * keywordData.confidence;
                    }
                }
            }
            
            // Normalize score
            relevanceScores[domainName] = Math.min(relevanceScores[domainName], 1.0);
        }
        
        return relevanceScores;
    }
    
    /**
     * Map keywords to most relevant domains
     */
    async mapKeywordsToDomains(keywords, relevanceScores) {
        const mappings = [];
        
        for (const [domainName, score] of Object.entries(relevanceScores)) {
            if (score >= this.config.domainRelevanceThreshold) {
                mappings.push({
                    domain: domainName,
                    relevanceScore: score,
                    relevantKeywords: keywords.filter(k => 
                        this.isKeywordRelevantToDomain(k, domainName)
                    ),
                    mappingReason: this.generateMappingReason(domainName, score, keywords)
                });
            }
        }
        
        return mappings.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    
    /**
     * Start real-time keyword detection
     */
    startRealTimeDetection() {
        console.log('⚡ Starting real-time keyword detection...');
        
        setInterval(async () => {
            try {
                // Get latest oracle data
                const latestData = await this.oracle.getLatestMarketData();
                
                if (latestData && latestData.length > 0) {
                    for (const dataPoint of latestData) {
                        await this.detectAndMapKeywords('oracle_feed', dataPoint, {
                            realTime: true,
                            source: 'blockchain_oracle'
                        });
                    }
                }
                
                this.intelligenceState.lastScan = Date.now();
                
            } catch (error) {
                console.error('❌ Real-time detection error:', error);
            }
        }, this.config.keywordScanInterval);
    }
    
    /**
     * Initialize intelligence databases
     */
    async initializeIntelligenceDatabases() {
        try {
            // Keyword detections table
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS keyword_detections (
                    id SERIAL PRIMARY KEY,
                    detection_id VARCHAR(100) UNIQUE NOT NULL,
                    source VARCHAR(100),
                    keywords JSONB,
                    domain_mappings JSONB,
                    grant_relevance JSONB,
                    contextual_insights JSONB,
                    confidence_score DECIMAL(3,2),
                    processing_time INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Domain intelligence table
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS domain_intelligence (
                    id SERIAL PRIMARY KEY,
                    domain_name VARCHAR(100),
                    intelligence_data JSONB,
                    strength_score DECIMAL(3,2),
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(domain_name)
                )
            `);
            
            // Grant narratives table
            await this.db.query(`
                CREATE TABLE IF NOT EXISTS grant_narratives (
                    id SERIAL PRIMARY KEY,
                    narrative_id VARCHAR(100) UNIQUE NOT NULL,
                    grant_criteria JSONB,
                    narrative_data JSONB,
                    alignment_score DECIMAL(3,2),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            console.log('✅ Intelligence databases initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize intelligence databases:', error);
            throw error;
        }
    }
    
    // Utility methods
    extractTextContent(source, data) {
        if (typeof data === 'string') return data;
        if (data.description) return data.description;
        if (data.content) return data.content;
        if (data.text) return data.text;
        return JSON.stringify(data);
    }
    
    extractKeywordContext(text, keyword) {
        const index = text.toLowerCase().indexOf(keyword.toLowerCase());
        if (index === -1) return '';
        
        const start = Math.max(0, index - this.config.contextWindowSize / 2);
        const end = Math.min(text.length, index + keyword.length + this.config.contextWindowSize / 2);
        
        return text.substring(start, end).trim();
    }
    
    calculateKeywordConfidence(keyword, matches, text) {
        const frequency = matches.length;
        const textLength = text.length;
        const keywordLength = keyword.length;
        
        // Base confidence on frequency and keyword specificity
        const frequencyScore = Math.min(frequency / 10, 1.0);
        const specificityScore = Math.min(keywordLength / 20, 1.0);
        const densityScore = Math.min((frequency * keywordLength) / textLength * 100, 1.0);
        
        return (frequencyScore * 0.4 + specificityScore * 0.3 + densityScore * 0.3);
    }
    
    calculateOverallConfidence(keywords, mappings) {
        if (keywords.length === 0) return 0;
        
        const keywordConfidence = keywords.reduce((sum, k) => sum + k.confidence, 0) / keywords.length;
        const mappingConfidence = mappings.length > 0 ? 
            mappings.reduce((sum, m) => sum + m.relevanceScore, 0) / mappings.length : 0;
        
        return (keywordConfidence * 0.6 + mappingConfidence * 0.4);
    }
    
    isKeywordRelevantToDomain(keywordData, domainName) {
        const domain = this.domainStructure[domainName];
        const keyword = keywordData.keyword.toLowerCase();
        
        // Check direct domain keywords
        if (this.keywordPatterns.domains[domainName]) {
            const domainKeywords = this.keywordPatterns.domains[domainName];
            if (domainKeywords.some(dk => dk.toLowerCase().includes(keyword) || keyword.includes(dk.toLowerCase()))) {
                return true;
            }
        }
        
        // Check focus areas
        return domain.focus.some(focus => 
            keyword.includes(focus.toLowerCase()) || focus.toLowerCase().includes(keyword)
        );
    }
    
    generateMappingReason(domainName, score, keywords) {
        const domain = this.domainStructure[domainName];
        const relevantKeywords = keywords
            .filter(k => this.isKeywordRelevantToDomain(k, domainName))
            .map(k => k.keyword)
            .slice(0, 3);
        
        return `Mapped to ${domainName} (score: ${score.toFixed(2)}) due to alignment with ${domain.type} focus areas and keywords: ${relevantKeywords.join(', ')}`;
    }
    
    // Placeholder methods for full implementation
    async loadExistingMappings() { console.log('📊 Loading existing keyword mappings...'); }
    async initializeContextAnalyzers() { console.log('🧠 Initializing context analyzers...'); }
    startDomainMapping() { console.log('🏢 Starting domain mapping...'); }
    startContextualAnalysis() { console.log('📊 Starting contextual analysis...'); }
    async analyzeGrantRelevance(keywords, mappings) { return { score: 0.8, relevantGrants: ['innovation_grant'] }; }
    async buildContextualInsights(keywords, mappings, grants) { return { insights: ['High AI relevance', 'Strong technical focus'] }; }
    async updateIntelligenceState(result) { this.intelligenceState.totalDetections++; }
    async storeDetectionResult(result) { console.log(`💾 Storing detection: ${result.detectionId}`); }
    async getRecentKeywordsForDomain(domain) { return []; }
    async getGrantOpportunitiesForDomain(domain, focus) { return []; }
    async buildDomainNarrative(domain, keywords, grants) { return `${domain} narrative with ${keywords.length} keywords`; }
    async getCompetitiveIntelligence(domain) { return { competitors: [], advantages: [] }; }
    async calculateDomainStrengthScore(domain, keywords) { return 0.8; }
    async generateDomainRecommendations(domain, score) { return ['Focus on AI keywords', 'Expand grant applications']; }
    async analyzeGrantCriteriaAlignment(intelligence, criteria) { return { alignment: 0.85 }; }
    async buildExecutiveSummary(intelligence) { return 'Innovative technology holding company...'; }
    async buildCompanyOverview(intelligence) { return 'Multi-domain technology portfolio...'; }
    async buildLeadershipProfile(intelligence) { return 'Experienced leadership team...'; }
    async buildTechnicalCapabilities(intelligence) { return 'Advanced AI and blockchain capabilities...'; }
    async buildSocialImpactStatement(intelligence) { return 'Committed to positive social impact...'; }
    async buildInnovationPortfolio(intelligence) { return 'Diverse portfolio of innovative solutions...'; }
    async buildFundingJustification(intelligence, criteria) { return 'Funding will accelerate development...'; }
    async defineSuccessMetrics(intelligence, criteria) { return { metrics: ['User adoption', 'Revenue growth'] }; }
}

module.exports = KeywordDomainIntelligence;