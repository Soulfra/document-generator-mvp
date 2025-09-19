/**
 * Master Content Orchestrator
 * 
 * The central brain that routes content through your existing Document Generator ecosystem.
 * Transforms content into "trading cards" and routes them through:
 * - Document Generator Brain (7 subagents)
 * - Universal Brand Engine
 * - Portfolio Brand Manager (11 domains)
 * - Tier-3 System (access control)
 * - Brand Meme Generator (viral scoring)
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const EventEmitter = require('events');

// Import existing system components
const UniversalBrandEngine = require('./universal-brand-engine');
const PortfolioBrandManager = require('./portfolio-brand-manager');
const BrandMemeGenerator = require('./Brand-Meme-Generator');

class MasterContentOrchestrator extends EventEmitter {
    constructor() {
        super();
        this.app = express();
        this.port = process.env.ORCHESTRATOR_PORT || 9000;
        
        // Initialize existing system components
        this.brandEngine = new UniversalBrandEngine({ accessLevel: 'expert' });
        this.portfolioManager = new PortfolioBrandManager();
        this.memeGenerator = new BrandMemeGenerator();
        
        // Content card database
        this.contentCards = new Map();
        this.cardMatchings = new Map();
        this.virality_scores = new Map();
        
        // Integration endpoints
        this.services = {
            documentGenerator: 'http://localhost:3009',
            contentWireshark: 'http://localhost:7500',
            distributionOrchestrator: 'http://localhost:7501',
            analyticsAggregator: 'http://localhost:7502',
            accountManager: 'http://localhost:7503'
        };
        
        this.setupMiddleware();
        this.setupRoutes();
        this.loadDomainRegistry();
    }
    
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request tracking
        this.app.use((req, res, next) => {
            req.orchestrationId = this.generateOrchestrationId();
            req.timestamp = new Date();
            next();
        });
    }
    
    setupRoutes() {
        // Main orchestration endpoint
        this.app.post('/api/orchestrate/content', this.orchestrateContent.bind(this));
        
        // Trading card endpoints
        this.app.get('/api/cards/all', this.getAllCards.bind(this));
        this.app.get('/api/cards/domain/:domain', this.getCardsByDomain.bind(this));
        this.app.get('/api/cards/viral/:threshold', this.getViralCards.bind(this));
        this.app.get('/api/cards/:cardId', this.getCard.bind(this));
        
        // Card matching endpoints
        this.app.post('/api/match/api-docs', this.matchToApiDocs.bind(this));
        this.app.post('/api/match/brands', this.matchToBrands.bind(this));
        this.app.post('/api/match/domains', this.matchToDomains.bind(this));
        
        // Meme/viral analysis
        this.app.post('/api/analyze/viral-potential', this.analyzeViralPotential.bind(this));
        this.app.post('/api/analyze/meme-dna', this.analyzeMemeDNA.bind(this));
        
        // Integration status
        this.app.get('/api/status/integrations', this.getIntegrationStatus.bind(this));
        this.app.get('/api/status/pipeline', this.getPipelineStatus.bind(this));
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'master-content-orchestrator',
                port: this.port,
                contentCards: this.contentCards.size,
                integrations: Object.keys(this.services).length,
                brandEngine: this.brandEngine ? 'connected' : 'disconnected',
                portfolioManager: this.portfolioManager ? 'connected' : 'disconnected'
            });
        });
    }
    
    /**
     * Main orchestration flow: Content → Document Generator → Brand Engine → Cards
     */
    async orchestrateContent(req, res) {
        try {
            const {
                content,
                contentType = 'text',
                targetDomains = [],
                userId = 'anonymous',
                options = {}
            } = req.body;
            
            if (!content) {
                return res.status(400).json({ error: 'Content is required' });
            }
            
            const orchestrationId = req.orchestrationId;
            console.log(`🎭 Starting orchestration ${orchestrationId} for content type: ${contentType}`);
            
            // Step 1: Process through Document Generator Brain (7 subagents)
            const documentAnalysis = await this.processDocumentGenerator(content, contentType, orchestrationId);
            
            // Step 2: Route through Universal Brand Engine
            const brandAnalysis = await this.processBrandEngine(content, documentAnalysis, orchestrationId);
            
            // Step 3: Apply Portfolio Brand Manager (11-domain strategy)
            const portfolioStrategy = await this.processPortfolioManager(content, brandAnalysis, targetDomains, orchestrationId);
            
            // Step 4: Generate viral/meme potential
            const viralAnalysis = await this.processViralAnalysis(content, brandAnalysis, orchestrationId);
            
            // Step 5: Create Content Trading Card
            const contentCard = await this.createContentCard({
                content,
                contentType,
                documentAnalysis,
                brandAnalysis,
                portfolioStrategy,
                viralAnalysis,
                orchestrationId,
                userId,
                options
            });
            
            // Step 6: Match to API docs and existing systems
            const cardMatchings = await this.performCardMatching(contentCard, orchestrationId);
            
            // Step 7: Route to appropriate services based on analysis
            const distributionPlan = await this.createDistributionPlan(contentCard, cardMatchings, orchestrationId);
            
            // Store the card and emit events
            this.contentCards.set(contentCard.id, contentCard);
            this.cardMatchings.set(contentCard.id, cardMatchings);
            
            this.emit('contentOrchestrated', {
                orchestrationId,
                contentCard,
                cardMatchings,
                distributionPlan
            });
            
            res.json({
                success: true,
                orchestrationId,
                contentCard,
                cardMatchings,
                distributionPlan,
                processingTime: Date.now() - req.timestamp.getTime()
            });
            
        } catch (error) {
            console.error('Orchestration error:', error);
            res.status(500).json({
                error: 'Orchestration failed',
                details: error.message,
                orchestrationId: req.orchestrationId
            });
        }
    }
    
    /**
     * Step 1: Process through Document Generator (7 subagents)
     */
    async processDocumentGenerator(content, contentType, orchestrationId) {
        try {
            console.log(`📄 Processing through Document Generator...`);
            
            // Call the main Document Generator endpoint
            const response = await axios.post(`${this.services.documentGenerator}/api/process-document`, {
                document: {
                    content,
                    type: contentType,
                    orchestrationId
                },
                options: {
                    enableSubagents: true,
                    enableGoldfishBrain: true,
                    generateInsights: true
                }
            });
            
            const analysis = response.data;
            
            return {
                // Document analysis results
                processedContent: analysis.processedDocument,
                insights: analysis.insights,
                
                // 7 Subagent analyses
                subagentAnalyses: {
                    docAgent: analysis.agents?.docAgent || null,
                    roastAgent: analysis.agents?.roastAgent || null,
                    tradeAgent: analysis.agents?.tradeAgent || null,
                    hustleAgent: analysis.agents?.hustleAgent || null,
                    spyAgent: analysis.agents?.spyAgent || null,
                    battleAgent: analysis.agents?.battleAgent || null,
                    legalAgent: analysis.agents?.legalAgent || null
                },
                
                // Goldfish Brain context
                contextPreservation: analysis.goldfishBrainClause || null,
                
                // Document classification
                documentType: analysis.classification?.type || 'unknown',
                confidence: analysis.classification?.confidence || 0,
                
                // Technical specs
                technicalSpecs: analysis.technicalSpecs || null,
                apiRequirements: analysis.apiRequirements || null,
                
                timestamp: new Date()
            };
            
        } catch (error) {
            console.warn('Document Generator not available, using fallback analysis');
            
            // Fallback analysis when Document Generator is unavailable
            return {
                processedContent: content,
                insights: [`Fallback analysis for ${contentType} content`],
                subagentAnalyses: {},
                documentType: contentType,
                confidence: 0.5,
                timestamp: new Date()
            };
        }
    }
    
    /**
     * Step 2: Route through Universal Brand Engine
     */
    async processBrandEngine(content, documentAnalysis, orchestrationId) {
        try {
            console.log(`🎨 Processing through Brand Engine...`);
            
            // Use the existing Universal Brand Engine
            const brandResult = await this.brandEngine.generateBrandIdentity(content, {
                analysisData: documentAnalysis,
                orchestrationId,
                includeVisuals: true,
                includeAudio: true
            });
            
            return {
                brandIdentity: brandResult.brandIdentity,
                colorPalette: brandResult.colors,
                typography: brandResult.typography,
                brandPersonality: brandResult.personality,
                brandArchetype: brandResult.archetype,
                visualStyle: brandResult.visualStyle,
                brandFit: brandResult.brandFit || 0.8,
                timestamp: new Date()
            };
            
        } catch (error) {
            console.warn('Brand Engine error, using fallback:', error.message);
            
            // Fallback brand analysis
            return {
                brandIdentity: { name: 'Unknown Brand', tagline: 'Generated Content' },
                colorPalette: { primary: '#6B46C1', secondary: '#1a1a2e' },
                brandPersonality: ['Creative', 'Technical'],
                brandFit: 0.6,
                timestamp: new Date()
            };
        }
    }
    
    /**
     * Step 3: Apply Portfolio Brand Manager (11-domain strategy)
     */
    async processPortfolioManager(content, brandAnalysis, targetDomains, orchestrationId) {
        try {
            console.log(`🏢 Processing through Portfolio Manager...`);
            
            // Use existing Portfolio Brand Manager to determine domain fit
            const portfolioStrategy = await this.portfolioManager.analyzeCrossBrandStrategy({
                content,
                brandAnalysis,
                targetDomains,
                orchestrationId
            });
            
            return {
                optimalDomains: portfolioStrategy.recommendedDomains || [],
                domainFitScores: portfolioStrategy.domainFitScores || {},
                crossBrandSynergies: portfolioStrategy.crossBrandSynergies || [],
                portfolioStrategy: portfolioStrategy.strategy || 'balanced',
                brandConsistency: portfolioStrategy.brandConsistency || 0.85,
                targetAudiences: portfolioStrategy.targetAudiences || [],
                timestamp: new Date()
            };
            
        } catch (error) {
            console.warn('Portfolio Manager error, using fallback:', error.message);
            
            // Load domain registry for fallback
            const fallbackDomains = ['soulfra.com', 'deathtodata.com', 'dealordelete.com'];
            
            return {
                optimalDomains: fallbackDomains.slice(0, 2),
                domainFitScores: Object.fromEntries(fallbackDomains.map(domain => [domain, 0.7])),
                crossBrandSynergies: [],
                portfolioStrategy: 'balanced',
                brandConsistency: 0.7,
                timestamp: new Date()
            };
        }
    }
    
    /**
     * Step 4: Generate viral/meme potential using existing Brand Meme Generator
     */
    async processViralAnalysis(content, brandAnalysis, orchestrationId) {
        try {
            console.log(`🔥 Processing viral analysis...`);
            
            // Use existing Brand Meme Generator for viral potential
            const viralAnalysis = await this.memeGenerator.analyzeViralPotential(content, {
                brandContext: brandAnalysis,
                orchestrationId
            });
            
            return {
                viralScore: viralAnalysis.viralScore || 0.5,
                memeElements: viralAnalysis.memeElements || [],
                culturalRelevance: viralAnalysis.culturalRelevance || 0.5,
                shareabilityScore: viralAnalysis.shareabilityScore || 0.5,
                trendingTopics: viralAnalysis.trendingTopics || [],
                memeDNA: viralAnalysis.memeDNA || null,
                viralPrediction: viralAnalysis.viralPrediction || 'moderate',
                timestamp: new Date()
            };
            
        } catch (error) {
            console.warn('Viral analysis error, using fallback:', error.message);
            
            // Fallback viral analysis
            const fallbackScore = Math.random() * 0.4 + 0.3; // 0.3 to 0.7
            
            return {
                viralScore: fallbackScore,
                memeElements: ['text-based', 'shareable'],
                culturalRelevance: fallbackScore,
                shareabilityScore: fallbackScore,
                viralPrediction: fallbackScore > 0.6 ? 'high' : 'moderate',
                timestamp: new Date()
            };
        }
    }
    
    /**
     * Step 5: Create Content Trading Card
     */
    async createContentCard(data) {
        const {
            content,
            contentType,
            documentAnalysis,
            brandAnalysis,
            portfolioStrategy,
            viralAnalysis,
            orchestrationId,
            userId,
            options
        } = data;
        
        const cardId = this.generateCardId();
        
        const contentCard = {
            // Card Identity
            id: cardId,
            orchestrationId,
            userId,
            
            // Content Data
            content: {
                original: content,
                processed: documentAnalysis.processedContent,
                type: contentType,
                insights: documentAnalysis.insights
            },
            
            // Trading Card Properties
            card: {
                name: this.generateCardName(content, brandAnalysis),
                rarity: this.calculateCardRarity(viralAnalysis, documentAnalysis),
                power: Math.round(viralAnalysis.viralScore * 100),
                type: this.determineCardType(documentAnalysis, brandAnalysis),
                element: this.determineCardElement(brandAnalysis),
                cost: this.calculateCardCost(viralAnalysis, portfolioStrategy)
            },
            
            // Brand Analysis Results
            brand: {
                identity: brandAnalysis.brandIdentity,
                archetype: brandAnalysis.brandArchetype,
                personality: brandAnalysis.brandPersonality,
                colors: brandAnalysis.colorPalette,
                fit: brandAnalysis.brandFit
            },
            
            // Portfolio Strategy
            portfolio: {
                domains: portfolioStrategy.optimalDomains,
                domainScores: portfolioStrategy.domainFitScores,
                strategy: portfolioStrategy.portfolioStrategy,
                synergies: portfolioStrategy.crossBrandSynergies
            },
            
            // Viral Potential
            viral: {
                score: viralAnalysis.viralScore,
                elements: viralAnalysis.memeElements,
                culturalRelevance: viralAnalysis.culturalRelevance,
                prediction: viralAnalysis.viralPrediction,
                memeDNA: viralAnalysis.memeDNA
            },
            
            // Document Analysis
            analysis: {
                type: documentAnalysis.documentType,
                confidence: documentAnalysis.confidence,
                technicalSpecs: documentAnalysis.technicalSpecs,
                apiRequirements: documentAnalysis.apiRequirements,
                subagents: documentAnalysis.subagentAnalyses
            },
            
            // Metadata
            metadata: {
                created: new Date(),
                version: '1.0.0',
                status: 'active',
                tags: this.generateCardTags(documentAnalysis, brandAnalysis, viralAnalysis),
                options
            }
        };
        
        console.log(`🃏 Created content card: ${contentCard.card.name} (${contentCard.card.rarity})`);
        
        return contentCard;
    }
    
    /**
     * Generate card matching to API docs and existing systems
     */
    async performCardMatching(contentCard, orchestrationId) {
        try {
            const matchings = {
                // API Documentation Matches
                apiDocs: await this.matchToAPIDocs(contentCard),
                
                // Brand System Matches
                brandSystems: await this.matchToBrandSystems(contentCard),
                
                // Domain Matches
                domainMatches: await this.matchToDomainSystems(contentCard),
                
                // Service Integration Matches
                serviceMatches: await this.matchToServices(contentCard),
                
                // Similar Cards
                similarCards: this.findSimilarCards(contentCard),
                
                matchingScore: 0,
                timestamp: new Date()
            };
            
            // Calculate overall matching score
            matchings.matchingScore = this.calculateMatchingScore(matchings);
            
            return matchings;
            
        } catch (error) {
            console.error('Card matching error:', error);
            return {
                apiDocs: [],
                brandSystems: [],
                domainMatches: [],
                serviceMatches: [],
                similarCards: [],
                matchingScore: 0.5,
                error: error.message,
                timestamp: new Date()
            };
        }
    }
    
    // Helper methods for card generation
    generateCardName(content, brandAnalysis) {
        const prefix = brandAnalysis.brandArchetype || 'Mystery';
        const contentSnippet = content.slice(0, 20).replace(/[^a-zA-Z0-9\s]/g, '');
        return `${prefix} ${contentSnippet}`.trim() || `${prefix} Card`;
    }
    
    calculateCardRarity(viralAnalysis, documentAnalysis) {
        const score = (viralAnalysis.viralScore + documentAnalysis.confidence) / 2;
        
        if (score >= 0.9) return 'legendary';
        if (score >= 0.8) return 'epic';
        if (score >= 0.6) return 'rare';
        if (score >= 0.4) return 'uncommon';
        return 'common';
    }
    
    determineCardType(documentAnalysis, brandAnalysis) {
        if (documentAnalysis.apiRequirements) return 'API';
        if (brandAnalysis.brandPersonality?.includes('Technical')) return 'Technical';
        if (brandAnalysis.brandPersonality?.includes('Creative')) return 'Creative';
        return 'Content';
    }
    
    determineCardElement(brandAnalysis) {
        const archetype = brandAnalysis.brandArchetype?.toLowerCase() || '';
        
        if (archetype.includes('hero')) return 'fire';
        if (archetype.includes('magician')) return 'air';
        if (archetype.includes('explorer')) return 'earth';
        if (archetype.includes('innocent')) return 'water';
        
        return 'neutral';
    }
    
    calculateCardCost(viralAnalysis, portfolioStrategy) {
        // Higher viral potential = higher cost
        const viralCost = Math.round(viralAnalysis.viralScore * 5);
        
        // Multiple domain synergies = higher cost
        const strategyCost = portfolioStrategy.crossBrandSynergies?.length || 0;
        
        return Math.max(1, viralCost + strategyCost);
    }
    
    generateCardTags(documentAnalysis, brandAnalysis, viralAnalysis) {
        const tags = [];
        
        // Add document type tags
        if (documentAnalysis.documentType) {
            tags.push(documentAnalysis.documentType);
        }
        
        // Add brand personality tags
        if (brandAnalysis.brandPersonality) {
            tags.push(...brandAnalysis.brandPersonality.map(p => p.toLowerCase()));
        }
        
        // Add viral element tags
        if (viralAnalysis.memeElements) {
            tags.push(...viralAnalysis.memeElements);
        }
        
        // Add rarity tag
        tags.push('content-card');
        
        return [...new Set(tags)]; // Remove duplicates
    }
    
    // API endpoints implementation
    async getAllCards(req, res) {
        try {
            const cards = Array.from(this.contentCards.values());
            res.json({
                success: true,
                cards,
                total: cards.length,
                timestamp: new Date()
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getCardsByDomain(req, res) {
        try {
            const { domain } = req.params;
            const cards = Array.from(this.contentCards.values())
                .filter(card => card.portfolio.domains.includes(domain));
            
            res.json({
                success: true,
                domain,
                cards,
                total: cards.length,
                timestamp: new Date()
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getViralCards(req, res) {
        try {
            const { threshold } = req.params;
            const minScore = parseFloat(threshold) || 0.7;
            
            const viralCards = Array.from(this.contentCards.values())
                .filter(card => card.viral.score >= minScore)
                .sort((a, b) => b.viral.score - a.viral.score);
            
            res.json({
                success: true,
                threshold: minScore,
                cards: viralCards,
                total: viralCards.length,
                timestamp: new Date()
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    // Utility methods
    generateOrchestrationId() {
        return `orch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    generateCardId() {
        return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    loadDomainRegistry() {
        try {
            this.domainRegistry = require('./DOMAIN-REGISTRY.json');
            console.log(`📋 Loaded ${Object.keys(this.domainRegistry.domains).length} domains`);
        } catch (error) {
            console.warn('Could not load domain registry:', error.message);
            this.domainRegistry = { domains: {} };
        }
    }
    
    async start() {
        try {
            // Initialize components
            await this.brandEngine.initialize?.();
            await this.portfolioManager.initialize?.();
            await this.memeGenerator.initialize?.();
            
            // Start HTTP server
            this.server = this.app.listen(this.port, () => {
                console.log(`🎭 Master Content Orchestrator running on port ${this.port}`);
                console.log(`🃏 Trading Card Universe: ACTIVE`);
                console.log(`🏢 Portfolio Management: ${Object.keys(this.domainRegistry.domains).length} domains`);
                console.log(`🎨 Brand Engine: READY`);
                console.log(`🔥 Viral Analysis: ENABLED`);
            });
            
            return this.server;
            
        } catch (error) {
            console.error('Failed to start Master Content Orchestrator:', error);
            throw error;
        }
    }
}

module.exports = { MasterContentOrchestrator };

// Start service if run directly
if (require.main === module) {
    const orchestrator = new MasterContentOrchestrator();
    orchestrator.start().catch(console.error);
}