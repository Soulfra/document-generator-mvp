/**
 * Content Card Matcher
 * 
 * Matches content trading cards to:
 * - API Documentation
 * - Brand Systems
 * - Domain Strategies
 * - Similar Cards
 * 
 * Creates the "trading card game" layer that connects everything together.
 */

const fs = require('fs');
const path = require('path');
const natural = require('natural');
const EventEmitter = require('events');

class ContentCardMatcher extends EventEmitter {
    constructor() {
        super();
        
        // Matching algorithms
        this.textAnalyzer = new natural.TfIdf();
        this.sentiment = new natural.SentimentAnalyzer('English', 
            natural.PorterStemmer, 'afinn');
        this.tokenizer = new natural.WordTokenizer();
        
        // Matching databases
        this.apiDocDatabase = new Map();
        this.brandSystemDatabase = new Map();
        this.domainDatabase = new Map();
        this.cardDatabase = new Map();
        
        // Matching thresholds
        this.matchingThresholds = {
            apiDocs: 0.7,
            brandSystems: 0.75,
            domains: 0.8,
            similarCards: 0.6
        };
        
        this.initialize();
    }
    
    async initialize() {
        await this.loadAPIDocs();
        await this.loadBrandSystems();
        await this.loadDomainConfigs();
        console.log('🃏 Content Card Matcher initialized');
    }
    
    /**
     * Main matching function - match a content card to everything
     */
    async matchCard(contentCard) {
        try {
            const matches = {
                cardId: contentCard.id,
                timestamp: new Date(),
                
                // API Documentation matches
                apiDocs: await this.matchToAPIDocs(contentCard),
                
                // Brand system matches
                brandSystems: await this.matchToBrandSystems(contentCard),
                
                // Domain matches
                domains: await this.matchToDomains(contentCard),
                
                // Similar card matches
                similarCards: await this.findSimilarCards(contentCard),
                
                // Trading card synergies
                synergies: await this.findCardSynergies(contentCard),
                
                // Overall matching score
                overallScore: 0,
                
                // Recommendations
                recommendations: []
            };
            
            // Calculate overall matching score
            matches.overallScore = this.calculateOverallScore(matches);
            
            // Generate recommendations
            matches.recommendations = this.generateRecommendations(contentCard, matches);
            
            return matches;
            
        } catch (error) {
            console.error('Card matching error:', error);
            throw error;
        }
    }
    
    /**
     * Match content card to API documentation
     */
    async matchToAPIDocs(contentCard) {
        const matches = [];
        
        try {
            const contentText = this.extractCardText(contentCard);
            const contentTokens = this.tokenizer.tokenize(contentText.toLowerCase());
            
            for (const [apiName, apiDoc] of this.apiDocDatabase.entries()) {
                const similarity = this.calculateTextSimilarity(contentText, apiDoc.description);
                
                if (similarity >= this.matchingThresholds.apiDocs) {
                    matches.push({
                        apiName,
                        apiDoc,
                        similarity,
                        matchReason: this.explainAPIMatch(contentCard, apiDoc, similarity),
                        implementation: this.generateImplementationSuggestion(contentCard, apiDoc),
                        codeExample: this.generateCodeExample(contentCard, apiDoc)
                    });
                }
            }
            
            // Sort by similarity
            matches.sort((a, b) => b.similarity - a.similarity);
            
            return matches.slice(0, 5); // Top 5 matches
            
        } catch (error) {
            console.error('API docs matching error:', error);
            return [];
        }
    }
    
    /**
     * Match content card to brand systems
     */
    async matchToBrandSystems(contentCard) {
        const matches = [];
        
        try {
            const brandPersonality = contentCard.brand.personality || [];
            const brandArchetype = contentCard.brand.archetype || '';
            
            for (const [systemName, brandSystem] of this.brandSystemDatabase.entries()) {
                const personalityMatch = this.calculateArraySimilarity(
                    brandPersonality, 
                    brandSystem.personality || []
                );
                
                const archetypeMatch = brandArchetype.toLowerCase() === 
                    (brandSystem.archetype || '').toLowerCase() ? 1.0 : 0.0;
                
                const colorMatch = this.calculateColorSimilarity(
                    contentCard.brand.colors,
                    brandSystem.colors
                );
                
                const overallMatch = (personalityMatch + archetypeMatch + colorMatch) / 3;
                
                if (overallMatch >= this.matchingThresholds.brandSystems) {
                    matches.push({
                        systemName,
                        brandSystem,
                        overallMatch,
                        breakdown: {
                            personality: personalityMatch,
                            archetype: archetypeMatch,
                            colors: colorMatch
                        },
                        matchReason: this.explainBrandMatch(contentCard, brandSystem, overallMatch),
                        brandStrategy: this.generateBrandStrategy(contentCard, brandSystem)
                    });
                }
            }
            
            matches.sort((a, b) => b.overallMatch - a.overallMatch);
            return matches.slice(0, 3);
            
        } catch (error) {
            console.error('Brand systems matching error:', error);
            return [];
        }
    }
    
    /**
     * Match content card to domain strategies
     */
    async matchToDomains(contentCard) {
        const matches = [];
        
        try {
            const optimalDomains = contentCard.portfolio.domains || [];
            const domainScores = contentCard.portfolio.domainScores || {};
            
            for (const [domainName, domainConfig] of this.domainDatabase.entries()) {
                const isOptimal = optimalDomains.includes(domainName);
                const scoreMatch = domainScores[domainName] || 0;
                
                const contentTypeMatch = this.matchContentTypeToDomain(
                    contentCard.analysis.type,
                    domainConfig.functionality.gameTypes
                );
                
                const brandMatch = this.matchBrandToDomain(
                    contentCard.brand,
                    domainConfig.branding
                );
                
                const overallMatch = isOptimal ? 
                    Math.max(scoreMatch, (contentTypeMatch + brandMatch) / 2) :
                    (contentTypeMatch + brandMatch) / 2;
                
                if (overallMatch >= this.matchingThresholds.domains || isOptimal) {
                    matches.push({
                        domainName,
                        domainConfig,
                        overallMatch,
                        isOptimal,
                        breakdown: {
                            contentType: contentTypeMatch,
                            brand: brandMatch,
                            portfolioScore: scoreMatch
                        },
                        matchReason: this.explainDomainMatch(contentCard, domainConfig, overallMatch),
                        distributionStrategy: this.generateDistributionStrategy(contentCard, domainConfig)
                    });
                }
            }
            
            matches.sort((a, b) => b.overallMatch - a.overallMatch);
            return matches;
            
        } catch (error) {
            console.error('Domain matching error:', error);
            return [];
        }
    }
    
    /**
     * Find similar cards for trading/synergy
     */
    async findSimilarCards(contentCard) {
        const similarCards = [];
        
        try {
            const cardText = this.extractCardText(contentCard);
            const cardVector = this.createCardVector(contentCard);
            
            for (const [cardId, existingCard] of this.cardDatabase.entries()) {
                if (cardId === contentCard.id) continue;
                
                const existingText = this.extractCardText(existingCard);
                const existingVector = this.createCardVector(existingCard);
                
                const textSimilarity = this.calculateTextSimilarity(cardText, existingText);
                const vectorSimilarity = this.calculateVectorSimilarity(cardVector, existingVector);
                
                const overallSimilarity = (textSimilarity + vectorSimilarity) / 2;
                
                if (overallSimilarity >= this.matchingThresholds.similarCards) {
                    similarCards.push({
                        cardId,
                        card: existingCard,
                        similarity: overallSimilarity,
                        breakdown: {
                            text: textSimilarity,
                            features: vectorSimilarity
                        },
                        synergy: this.calculateCardSynergy(contentCard, existingCard),
                        tradingValue: this.calculateTradingValue(contentCard, existingCard)
                    });
                }
            }
            
            similarCards.sort((a, b) => b.similarity - a.similarity);
            return similarCards.slice(0, 10);
            
        } catch (error) {
            console.error('Similar cards matching error:', error);
            return [];
        }
    }
    
    /**
     * Find card synergies for combination effects
     */
    async findCardSynergies(contentCard) {
        const synergies = [];
        
        try {
            for (const [cardId, existingCard] of this.cardDatabase.entries()) {
                if (cardId === contentCard.id) continue;
                
                const synergy = this.calculateCardSynergy(contentCard, existingCard);
                
                if (synergy.score >= 0.7) {
                    synergies.push({
                        cardId,
                        card: existingCard,
                        synergy,
                        combinedEffect: this.describeCombinedEffect(contentCard, existingCard, synergy),
                        strategicValue: this.calculateStrategicValue(contentCard, existingCard)
                    });
                }
            }
            
            synergies.sort((a, b) => b.synergy.score - a.synergy.score);
            return synergies.slice(0, 5);
            
        } catch (error) {
            console.error('Card synergies error:', error);
            return [];
        }
    }
    
    /**
     * Load API documentation database
     */
    async loadAPIDocs() {
        try {
            // Load existing API docs from the system
            const apiDocs = [
                {
                    name: 'Document Generator API',
                    description: 'Transform documents into working applications using AI agents',
                    endpoints: ['/api/process-document', '/api/chat', '/api/ai/reason'],
                    category: 'AI Processing',
                    tags: ['document', 'ai', 'processing', 'generation']
                },
                {
                    name: 'Content Wireshark API',
                    description: 'Analyze content patterns and viral potential across platforms',
                    endpoints: ['/api/analyze/content', '/api/patterns/viral', '/api/optimize/content'],
                    category: 'Analytics',
                    tags: ['content', 'analysis', 'viral', 'patterns']
                },
                {
                    name: 'Distribution Orchestrator API',
                    description: 'Multi-platform content distribution and scheduling',
                    endpoints: ['/api/distribute/content', '/api/platforms/status', '/api/monitor/active'],
                    category: 'Distribution',
                    tags: ['distribution', 'platforms', 'scheduling', 'automation']
                },
                {
                    name: 'Analytics Aggregator API',
                    description: 'Cross-platform analytics and real-time metrics collection',
                    endpoints: ['/api/analytics/overview', '/api/realtime/metrics', '/api/reports/daily'],
                    category: 'Analytics',
                    tags: ['analytics', 'metrics', 'realtime', 'reporting']
                },
                {
                    name: 'Account Manager API',
                    description: 'Manage user account pools and behavioral patterns',
                    endpoints: ['/api/accounts/allocate', '/api/accounts/health', '/api/accounts/behavior'],
                    category: 'Account Management',
                    tags: ['accounts', 'users', 'behavior', 'management']
                }
            ];
            
            for (const api of apiDocs) {
                this.apiDocDatabase.set(api.name, api);
            }
            
            console.log(`📚 Loaded ${apiDocs.length} API documentation entries`);
            
        } catch (error) {
            console.error('Error loading API docs:', error);
        }
    }
    
    /**
     * Load brand systems database
     */
    async loadBrandSystems() {
        try {
            const brandSystems = [
                {
                    name: 'Universal Brand Engine',
                    personality: ['Creative', 'Technical', 'Innovative'],
                    archetype: 'Magician',
                    colors: { primary: '#6B46C1', secondary: '#1a1a2e' },
                    category: 'Brand Identity'
                },
                {
                    name: 'Portfolio Brand Manager', 
                    personality: ['Professional', 'Strategic', 'Coordinated'],
                    archetype: 'Ruler',
                    colors: { primary: '#1e40af', secondary: '#7c3aed' },
                    category: 'Portfolio Management'
                },
                {
                    name: 'Brand Meme Generator',
                    personality: ['Viral', 'Cultural', 'Trendy'],
                    archetype: 'Jester',
                    colors: { primary: '#ff0080', secondary: '#00ffff' },
                    category: 'Viral Content'
                }
            ];
            
            for (const system of brandSystems) {
                this.brandSystemDatabase.set(system.name, system);
            }
            
            console.log(`🎨 Loaded ${brandSystems.length} brand system entries`);
            
        } catch (error) {
            console.error('Error loading brand systems:', error);
        }
    }
    
    /**
     * Load domain configurations
     */
    async loadDomainConfigs() {
        try {
            // Load from DOMAIN-REGISTRY.json
            const domainRegistry = require('./DOMAIN-REGISTRY.json');
            
            for (const [domainName, config] of Object.entries(domainRegistry.domains)) {
                this.domainDatabase.set(domainName, config);
            }
            
            console.log(`🌐 Loaded ${Object.keys(domainRegistry.domains).length} domain configurations`);
            
        } catch (error) {
            console.error('Error loading domain configs:', error);
        }
    }
    
    /**
     * Helper methods for matching
     */
    extractCardText(card) {
        const parts = [
            card.content.original,
            card.content.insights?.join(' ') || '',
            card.brand.personality?.join(' ') || '',
            card.analysis.type || '',
            card.metadata.tags?.join(' ') || ''
        ];
        
        return parts.filter(Boolean).join(' ');
    }
    
    calculateTextSimilarity(text1, text2) {
        const tokens1 = this.tokenizer.tokenize(text1.toLowerCase());
        const tokens2 = this.tokenizer.tokenize(text2.toLowerCase());
        
        const set1 = new Set(tokens1);
        const set2 = new Set(tokens2);
        
        const intersection = new Set([...set1].filter(token => set2.has(token)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }
    
    calculateArraySimilarity(arr1, arr2) {
        if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) return 0;
        
        const set1 = new Set(arr1.map(item => item.toLowerCase()));
        const set2 = new Set(arr2.map(item => item.toLowerCase()));
        
        const intersection = new Set([...set1].filter(item => set2.has(item)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }
    
    calculateColorSimilarity(colors1, colors2) {
        if (!colors1 || !colors2) return 0;
        
        // Simple color similarity based on hex values
        const primary1 = colors1.primary || '#000000';
        const primary2 = colors2.primary || '#000000';
        
        // Convert hex to RGB and calculate distance
        const rgb1 = this.hexToRgb(primary1);
        const rgb2 = this.hexToRgb(primary2);
        
        if (!rgb1 || !rgb2) return 0;
        
        const distance = Math.sqrt(
            Math.pow(rgb1.r - rgb2.r, 2) +
            Math.pow(rgb1.g - rgb2.g, 2) +
            Math.pow(rgb1.b - rgb2.b, 2)
        );
        
        // Normalize to 0-1 (max distance is ~441)
        return Math.max(0, 1 - (distance / 441));
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    createCardVector(card) {
        return {
            viralScore: card.viral.score || 0,
            brandFit: card.brand.fit || 0,
            confidence: card.analysis.confidence || 0,
            cardPower: card.card.power || 0,
            cardCost: card.card.cost || 0,
            domainCount: card.portfolio.domains?.length || 0
        };
    }
    
    calculateVectorSimilarity(vector1, vector2) {
        const keys = Object.keys(vector1);
        let dotProduct = 0;
        let magnitude1 = 0;
        let magnitude2 = 0;
        
        for (const key of keys) {
            const val1 = vector1[key] || 0;
            const val2 = vector2[key] || 0;
            
            dotProduct += val1 * val2;
            magnitude1 += val1 * val1;
            magnitude2 += val2 * val2;
        }
        
        magnitude1 = Math.sqrt(magnitude1);
        magnitude2 = Math.sqrt(magnitude2);
        
        if (magnitude1 === 0 || magnitude2 === 0) return 0;
        
        return dotProduct / (magnitude1 * magnitude2);
    }
    
    calculateCardSynergy(card1, card2) {
        const elementSynergy = this.calculateElementSynergy(card1.card.element, card2.card.element);
        const typeSynergy = this.calculateTypeSynergy(card1.card.type, card2.card.type);
        const domainSynergy = this.calculateDomainSynergy(card1.portfolio.domains, card2.portfolio.domains);
        
        const overallScore = (elementSynergy + typeSynergy + domainSynergy) / 3;
        
        return {
            score: overallScore,
            breakdown: {
                element: elementSynergy,
                type: typeSynergy,
                domain: domainSynergy
            }
        };
    }
    
    calculateElementSynergy(element1, element2) {
        const synergyMatrix = {
            fire: { water: 0.2, earth: 0.8, air: 0.9, fire: 0.5 },
            water: { fire: 0.2, earth: 0.9, air: 0.7, water: 0.5 },
            earth: { fire: 0.8, water: 0.9, air: 0.3, earth: 0.5 },
            air: { fire: 0.9, water: 0.7, earth: 0.3, air: 0.5 },
            neutral: { fire: 0.6, water: 0.6, earth: 0.6, air: 0.6, neutral: 0.7 }
        };
        
        return synergyMatrix[element1]?.[element2] || 0.5;
    }
    
    calculateTypeSynergy(type1, type2) {
        if (type1 === type2) return 0.8;
        
        const complementaryTypes = {
            'API': ['Technical'],
            'Technical': ['API', 'Creative'],
            'Creative': ['Technical', 'Content'],
            'Content': ['Creative']
        };
        
        return complementaryTypes[type1]?.includes(type2) ? 0.9 : 0.4;
    }
    
    calculateDomainSynergy(domains1, domains2) {
        if (!domains1 || !domains2) return 0;
        
        const intersection = domains1.filter(domain => domains2.includes(domain));
        const union = [...new Set([...domains1, ...domains2])];
        
        return intersection.length / union.length;
    }
    
    // Store card in database for future matching
    storeCard(card) {
        this.cardDatabase.set(card.id, card);
        console.log(`🃏 Stored card ${card.id} in matching database`);
    }
    
    // Remove card from database
    removeCard(cardId) {
        const removed = this.cardDatabase.delete(cardId);
        if (removed) {
            console.log(`🗑️ Removed card ${cardId} from matching database`);
        }
        return removed;
    }
    
    // Get all stored cards
    getAllStoredCards() {
        return Array.from(this.cardDatabase.values());
    }
    
    // Get matching statistics
    getMatchingStats() {
        return {
            totalCards: this.cardDatabase.size,
            apiDocs: this.apiDocDatabase.size,
            brandSystems: this.brandSystemDatabase.size,
            domains: this.domainDatabase.size,
            thresholds: this.matchingThresholds
        };
    }
}

module.exports = { ContentCardMatcher };

// Export for use in other services
if (require.main === module) {
    const matcher = new ContentCardMatcher();
    console.log('🃏 Content Card Matcher running standalone');
}