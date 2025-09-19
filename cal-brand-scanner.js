#!/usr/bin/env node

/**
 * 🎯 CAL BRAND SCANNER
 * 
 * CAL orchestration integration for internal brand scanning of games and components.
 * Provides Pinterest-style idea board functionality with Excel-like ranking system.
 * 
 * Features:
 * - Brand name detection and categorization
 * - Component analysis and tagging
 * - Sortable ranking system with columns
 * - Idea submission and approval workflow
 * - Integration with unified document organizer
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const UnifiedDocumentOrganizer = require('./unified-document-organizer');

class CALBrandScanner extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            vaultPath: config.vaultPath || './unified-vault',
            brandDatabase: config.brandDatabase || './cal-brand-database.json',
            ideaBoard: config.ideaBoard || './idea-board-submissions.json',
            rankingSystem: config.rankingSystem || './ranking-matrix.json',
            autoApprove: config.autoApprove || false,
            confidenceThreshold: config.confidenceThreshold || 0.7,
            maxIdeasPerUser: config.maxIdeasPerUser || 10,
            ...config
        };
        
        this.organizer = new UnifiedDocumentOrganizer({
            vaultPath: this.config.vaultPath
        });
        
        // Brand detection patterns
        this.brandPatterns = {
            internal: {
                'document-generator': { weight: 10, category: 'core-product' },
                'blamechain': { weight: 9, category: 'blockchain' },
                'soulfra': { weight: 9, category: 'authentication' },
                'hollowtown': { weight: 8, category: 'gaming' },
                'cal-system': { weight: 8, category: 'orchestration' },
                'agent-economy': { weight: 7, category: 'ai-systems' },
                'unified-vault': { weight: 7, category: 'storage' },
                'algo-villa': { weight: 6, category: 'trading' }
            },
            gaming: {
                'runescape': { weight: 8, category: 'mmorpg', external: true },
                'battlenet': { weight: 7, category: 'platform', external: true },
                'steam': { weight: 7, category: 'platform', external: true },
                'world-of-warcraft': { weight: 8, category: 'mmorpg', external: true }
            },
            components: {
                'api-gateway': { weight: 9, category: 'infrastructure' },
                'authentication': { weight: 9, category: 'security' },
                'database': { weight: 8, category: 'storage' },
                'frontend': { weight: 7, category: 'ui' },
                'backend': { weight: 7, category: 'server' },
                'ai-service': { weight: 8, category: 'intelligence' }
            }
        };
        
        // Ranking criteria for Excel-like system
        this.rankingCriteria = {
            innovation: { weight: 0.25, description: 'How innovative is the idea?' },
            feasibility: { weight: 0.20, description: 'How feasible to implement?' },
            marketPotential: { weight: 0.20, description: 'Market opportunity size' },
            techComplexity: { weight: 0.15, description: 'Technical complexity (lower is better)' },
            brandAlignment: { weight: 0.10, description: 'Alignment with brand values' },
            resourceRequirement: { weight: 0.10, description: 'Resource requirements (lower is better)' }
        };
        
        // In-memory databases
        this.brandDatabase = new Map();
        this.ideaBoard = new Map();
        this.rankingMatrix = new Map();
        this.userSubmissions = new Map();
        
        console.log('🎯 CAL BRAND SCANNER INITIALIZED');
    }
    
    async initialize() {
        console.log('🚀 Initializing CAL Brand Scanner...');
        
        // Load existing databases
        await this.loadDatabases();
        
        // Initialize document organizer
        await this.organizer.initialize();
        
        console.log('✅ CAL Brand Scanner ready');
        this.emit('initialized');
    }
    
    async scanForBrands(input, options = {}) {
        console.log('🔍 Scanning for brand mentions and components...');
        
        const scanResult = {
            timestamp: new Date().toISOString(),
            input: options.inputType || 'text',
            brands: {
                internal: [],
                external: [],
                gaming: [],
                components: []
            },
            confidence: 0,
            suggestions: [],
            recommendations: []
        };
        
        let text = '';
        
        // Handle different input types
        if (typeof input === 'string') {
            if (await this.isFilePath(input)) {
                text = await fs.readFile(input, 'utf8');
                scanResult.input = 'file';
            } else {
                text = input;
                scanResult.input = 'text';
            }
        } else if (input.content) {
            text = input.content;
            scanResult.input = 'document';
        }
        
        text = text.toLowerCase();
        
        // Scan for brand patterns
        for (const [category, patterns] of Object.entries(this.brandPatterns)) {
            for (const [brand, metadata] of Object.entries(patterns)) {
                const regex = new RegExp(`\\b${brand.replace('-', '[\\s\\-_]?')}\\b`, 'gi');
                const matches = text.match(regex);
                
                if (matches) {
                    const brandMatch = {
                        name: brand,
                        category: metadata.category,
                        weight: metadata.weight,
                        occurrences: matches.length,
                        confidence: this.calculateBrandConfidence(brand, text, matches),
                        external: metadata.external || false
                    };
                    
                    if (category === 'internal') {
                        scanResult.brands.internal.push(brandMatch);
                    } else if (category === 'gaming') {
                        scanResult.brands.gaming.push(brandMatch);
                    } else if (category === 'components') {
                        scanResult.brands.components.push(brandMatch);
                    }
                }
            }
        }
        
        // Calculate overall confidence
        scanResult.confidence = this.calculateOverallConfidence(scanResult.brands);
        
        // Generate suggestions
        scanResult.suggestions = this.generateBrandSuggestions(scanResult.brands);
        
        // Generate recommendations
        scanResult.recommendations = this.generateRecommendations(scanResult);
        
        // Store in brand database
        await this.storeBrandScan(scanResult);
        
        console.log(`✅ Brand scan complete. Found ${this.getTotalMatches(scanResult.brands)} brand mentions`);
        
        return scanResult;
    }
    
    async submitIdea(ideaData, submitterInfo = {}) {
        console.log(`💡 Processing idea submission: "${ideaData.title}"`);
        
        const idea = {
            id: `idea_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            title: ideaData.title,
            description: ideaData.description,
            category: ideaData.category || 'general',
            submitter: {
                name: submitterInfo.name || 'Anonymous',
                email: submitterInfo.email,
                role: submitterInfo.role || 'contributor'
            },
            submission: {
                timestamp: new Date().toISOString(),
                status: 'pending',
                source: 'pinterest-style-board'
            },
            content: {
                raw: ideaData.description,
                tags: ideaData.tags || [],
                attachments: ideaData.attachments || []
            },
            ranking: {
                scores: {},
                totalScore: 0,
                rank: 0,
                status: 'unranked'
            }
        };
        
        // Scan idea for brand mentions
        const brandScan = await this.scanForBrands(ideaData.description, { inputType: 'idea' });
        idea.brands = brandScan.brands;
        idea.brandConfidence = brandScan.confidence;
        
        // Auto-rank the idea
        const ranking = await this.rankIdea(idea);
        idea.ranking = ranking;
        
        // Check if auto-approval is enabled and criteria met
        if (this.config.autoApprove && ranking.totalScore > this.config.confidenceThreshold) {
            idea.submission.status = 'approved';
            idea.submission.autoApproved = true;
        }
        
        // Store in idea board
        this.ideaBoard.set(idea.id, idea);
        
        // Track user submissions
        const userKey = submitterInfo.email || submitterInfo.name || 'anonymous';
        if (!this.userSubmissions.has(userKey)) {
            this.userSubmissions.set(userKey, []);
        }
        this.userSubmissions.get(userKey).push(idea.id);
        
        // Save to persistent storage
        await this.saveIdeaBoard();
        
        console.log(`✅ Idea submitted with ID: ${idea.id} (Score: ${ranking.totalScore.toFixed(2)})`);
        
        this.emit('ideaSubmitted', idea);
        
        return idea;
    }
    
    async rankIdea(idea) {
        console.log(`📊 Ranking idea: ${idea.title}`);
        
        const scores = {};
        let totalScore = 0;
        
        // Score each criteria
        for (const [criterion, config] of Object.entries(this.rankingCriteria)) {
            const score = await this.scoreCriterion(idea, criterion);
            scores[criterion] = {
                score: score,
                weight: config.weight,
                weightedScore: score * config.weight,
                description: config.description
            };
            totalScore += scores[criterion].weightedScore;
        }
        
        // Calculate rank among all ideas
        const allIdeas = Array.from(this.ideaBoard.values());
        const betterIdeas = allIdeas.filter(i => i.ranking.totalScore > totalScore);
        const rank = betterIdeas.length + 1;
        
        const ranking = {
            scores,
            totalScore,
            rank,
            status: 'ranked',
            rankedAt: new Date().toISOString(),
            percentile: ((allIdeas.length - rank + 1) / allIdeas.length * 100).toFixed(1)
        };
        
        // Update ranking matrix
        this.rankingMatrix.set(idea.id, ranking);
        
        return ranking;
    }
    
    async scoreCriterion(idea, criterion) {
        // Simplified scoring algorithm - in production, this could use AI
        let score = 0.5; // Base score
        
        switch (criterion) {
            case 'innovation':
                // Check for unique keywords, novel combinations
                const innovativeKeywords = ['ai', 'blockchain', 'novel', 'unique', 'revolutionary'];
                const text = idea.description.toLowerCase();
                score = Math.min(1.0, 0.3 + (innovativeKeywords.filter(k => text.includes(k)).length * 0.2));
                break;
                
            case 'feasibility':
                // Check for technical feasibility indicators
                const complexity = idea.description.length > 500 ? 0.2 : 0.1;
                const hasRealistic = /realistic|achievable|simple|straightforward/.test(idea.description.toLowerCase());
                score = hasRealistic ? 0.8 - complexity : 0.5 - complexity;
                break;
                
            case 'marketPotential':
                // Check for market-related keywords
                const marketKeywords = ['market', 'user', 'customer', 'demand', 'revenue'];
                const marketMentions = marketKeywords.filter(k => idea.description.toLowerCase().includes(k)).length;
                score = Math.min(1.0, 0.4 + (marketMentions * 0.15));
                break;
                
            case 'techComplexity':
                // Lower complexity is better (inverted score)
                const complexKeywords = ['complex', 'advanced', 'sophisticated', 'enterprise'];
                const complexity2 = complexKeywords.filter(k => idea.description.toLowerCase().includes(k)).length;
                score = Math.max(0.1, 1.0 - (complexity2 * 0.2));
                break;
                
            case 'brandAlignment':
                // Use brand scan confidence
                score = idea.brandConfidence || 0.5;
                break;
                
            case 'resourceRequirement':
                // Lower requirements are better (inverted score)
                const resourceKeywords = ['team', 'expensive', 'time', 'investment'];
                const resourceMentions = resourceKeywords.filter(k => idea.description.toLowerCase().includes(k)).length;
                score = Math.max(0.1, 1.0 - (resourceMentions * 0.15));
                break;
        }
        
        return Math.max(0, Math.min(1, score));
    }
    
    getSortableRankings(sortBy = 'totalScore', sortOrder = 'desc') {
        const ideas = Array.from(this.ideaBoard.values());
        
        // Sort by specified criteria
        ideas.sort((a, b) => {
            let aValue, bValue;
            
            if (sortBy === 'totalScore') {
                aValue = a.ranking.totalScore;
                bValue = b.ranking.totalScore;
            } else if (sortBy === 'timestamp') {
                aValue = new Date(a.submission.timestamp);
                bValue = new Date(b.submission.timestamp);
            } else if (a.ranking.scores[sortBy]) {
                aValue = a.ranking.scores[sortBy].score;
                bValue = b.ranking.scores[sortBy].score;
            } else {
                aValue = a[sortBy];
                bValue = b[sortBy];
            }
            
            if (sortOrder === 'desc') {
                return bValue > aValue ? 1 : -1;
            } else {
                return aValue > bValue ? 1 : -1;
            }
        });
        
        // Create Excel-like table data
        return ideas.map((idea, index) => ({
            rank: index + 1,
            id: idea.id,
            title: idea.title,
            submitter: idea.submitter.name,
            category: idea.category,
            totalScore: idea.ranking.totalScore.toFixed(3),
            percentile: idea.ranking.percentile,
            status: idea.submission.status,
            timestamp: idea.submission.timestamp,
            innovation: idea.ranking.scores.innovation?.score.toFixed(3) || 'N/A',
            feasibility: idea.ranking.scores.feasibility?.score.toFixed(3) || 'N/A',
            marketPotential: idea.ranking.scores.marketPotential?.score.toFixed(3) || 'N/A',
            techComplexity: idea.ranking.scores.techComplexity?.score.toFixed(3) || 'N/A',
            brandAlignment: idea.ranking.scores.brandAlignment?.score.toFixed(3) || 'N/A',
            resourceRequirement: idea.ranking.scores.resourceRequirement?.score.toFixed(3) || 'N/A'
        }));
    }
    
    generatePinterestBoard() {
        const ideas = Array.from(this.ideaBoard.values());
        const board = {
            title: 'Idea Board - Pinterest Style',
            totalIdeas: ideas.length,
            categories: {},
            topIdeas: ideas
                .sort((a, b) => b.ranking.totalScore - a.ranking.totalScore)
                .slice(0, 12)
                .map(idea => ({
                    id: idea.id,
                    title: idea.title,
                    description: idea.description.substring(0, 150) + '...',
                    score: idea.ranking.totalScore.toFixed(2),
                    category: idea.category,
                    submitter: idea.submitter.name,
                    brands: idea.brands,
                    status: idea.submission.status
                }))
        };
        
        // Group by category
        for (const idea of ideas) {
            if (!board.categories[idea.category]) {
                board.categories[idea.category] = [];
            }
            board.categories[idea.category].push({
                id: idea.id,
                title: idea.title,
                score: idea.ranking.totalScore
            });
        }
        
        return board;
    }
    
    // Helper methods
    calculateBrandConfidence(brand, text, matches) {
        // Simple confidence calculation based on context
        const contextKeywords = ['integration', 'platform', 'system', 'component', 'service'];
        const contextMatches = contextKeywords.filter(k => text.includes(k)).length;
        
        return Math.min(1.0, 0.5 + (matches.length * 0.1) + (contextMatches * 0.05));
    }
    
    calculateOverallConfidence(brands) {
        const allBrands = [...brands.internal, ...brands.gaming, ...brands.components];
        if (allBrands.length === 0) return 0;
        
        const avgConfidence = allBrands.reduce((sum, b) => sum + b.confidence, 0) / allBrands.length;
        return avgConfidence;
    }
    
    generateBrandSuggestions(brands) {
        const suggestions = [];
        
        if (brands.internal.length > 0) {
            suggestions.push('Consider integration with existing internal platforms');
        }
        
        if (brands.gaming.length > 0) {
            suggestions.push('Gaming integration opportunities identified');
        }
        
        if (brands.components.length > 0) {
            suggestions.push('Component architecture alignment detected');
        }
        
        return suggestions;
    }
    
    generateRecommendations(scanResult) {
        const recs = [];
        
        if (scanResult.confidence > 0.8) {
            recs.push({ priority: 'high', action: 'Fast-track for implementation review' });
        }
        
        if (scanResult.brands.internal.length > 2) {
            recs.push({ priority: 'medium', action: 'Consider platform consolidation opportunities' });
        }
        
        return recs;
    }
    
    getTotalMatches(brands) {
        return [...brands.internal, ...brands.gaming, ...brands.components]
            .reduce((sum, b) => sum + b.occurrences, 0);
    }
    
    async isFilePath(str) {
        try {
            await fs.access(str);
            return true;
        } catch {
            return false;
        }
    }
    
    // Persistence methods
    async loadDatabases() {
        try {
            const brandData = await fs.readFile(this.config.brandDatabase, 'utf8');
            const brandEntries = JSON.parse(brandData);
            this.brandDatabase = new Map(brandEntries);
        } catch (error) {
            console.log('📝 Creating new brand database');
        }
        
        try {
            const ideaData = await fs.readFile(this.config.ideaBoard, 'utf8');
            const ideaEntries = JSON.parse(ideaData);
            this.ideaBoard = new Map(ideaEntries);
        } catch (error) {
            console.log('📝 Creating new idea board');
        }
    }
    
    async storeBrandScan(scanResult) {
        const scanId = `scan_${Date.now()}`;
        this.brandDatabase.set(scanId, scanResult);
        
        const data = Array.from(this.brandDatabase.entries());
        await fs.writeFile(this.config.brandDatabase, JSON.stringify(data, null, 2));
    }
    
    async saveIdeaBoard() {
        const data = Array.from(this.ideaBoard.entries());
        await fs.writeFile(this.config.ideaBoard, JSON.stringify(data, null, 2));
    }
}

// CLI Usage
if (require.main === module) {
    const scanner = new CALBrandScanner();
    
    async function runDemo() {
        await scanner.initialize();
        
        console.log('\n🎯 CAL BRAND SCANNER DEMO');
        console.log('========================\n');
        
        // Demo: Scan text for brands
        const testText = `
        Our document-generator platform integrates with blamechain for authentication 
        and uses the soulfra system for secure storage. The hollowtown gaming components 
        provide excellent user engagement, while our cal-system orchestrates everything.
        `;
        
        const brandScan = await scanner.scanForBrands(testText);
        console.log('🔍 Brand scan results:', {
            confidence: brandScan.confidence.toFixed(2),
            internal: brandScan.brands.internal.length,
            gaming: brandScan.brands.gaming.length,
            components: brandScan.brands.components.length
        });
        
        // Demo: Submit idea
        const idea = await scanner.submitIdea({
            title: 'AI-Powered Gaming Economy',
            description: 'Create an intelligent trading system that uses blockchain technology to enable cross-platform gaming economies. This would integrate with existing platforms and provide real-time market analysis.',
            category: 'gaming-platform',
            tags: ['ai', 'blockchain', 'gaming', 'economy']
        }, {
            name: 'Demo User',
            email: 'demo@example.com'
        });
        
        console.log(`💡 Idea submitted: ${idea.id} (Score: ${idea.ranking.totalScore.toFixed(3)})`);
        
        // Demo: Get sortable rankings
        const rankings = scanner.getSortableRankings();
        console.log('📊 Top ranked ideas:');
        rankings.slice(0, 3).forEach(item => {
            console.log(`   ${item.rank}. ${item.title} (${item.totalScore})`);
        });
        
        // Demo: Generate Pinterest board
        const board = scanner.generatePinterestBoard();
        console.log(`🎨 Pinterest board: ${board.totalIdeas} ideas in ${Object.keys(board.categories).length} categories`);
        
        console.log('\n✅ CAL Brand Scanner ready for integration!');
    }
    
    runDemo().catch(console.error);
}

module.exports = CALBrandScanner;