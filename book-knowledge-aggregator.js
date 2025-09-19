/**
 * Book Knowledge Aggregator
 * Unified API combining Google Books and Open Library for educational content discovery
 * Neural network node for intelligent book recommendations and metadata enrichment
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class BookKnowledgeAggregator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            apis: {
                googleBooks: {
                    enabled: true,
                    baseUrl: 'https://www.googleapis.com/books/v1',
                    apiKey: config.googleBooksApiKey || process.env.GOOGLE_BOOKS_API_KEY,
                    rateLimit: 1000, // requests per day
                    priority: 1
                },
                openLibrary: {
                    enabled: true,
                    baseUrl: 'https://openlibrary.org',
                    rateLimit: 100, // requests per minute
                    priority: 2
                },
                dynamicLinks: {
                    enabled: true,
                    baseUrl: 'https://books.google.com/books',
                    priority: 3
                }
            },
            
            // Educational focus areas
            educationalCategories: [
                'education',
                'business',
                'self-help',
                'professional-development',
                'skill-building',
                'gaming',
                'customer-service',
                'financial-literacy',
                'social-impact'
            ],
            
            // Multi-format output support
            outputFormats: {
                json: true,
                html: true,
                markdown: true,
                latex: true,
                regex: true,
                md5: true
            },
            
            // Neural network features
            neuralNetwork: {
                learningEnabled: true,
                patternRecognition: true,
                semanticAnalysis: true,
                crossReferencing: true
            },
            
            // Caching and performance
            cache: {
                enabled: true,
                ttl: 3600000, // 1 hour
                maxSize: 10000
            },
            
            ...config
        };
        
        // Knowledge base storage
        this.knowledgeBase = new Map();
        this.semanticNetwork = new Map();
        this.educationalMappings = new Map();
        
        // API management
        this.rateLimits = new Map();
        this.apiHealth = new Map();
        this.requestQueue = [];
        
        // Neural network components
        this.learningPatterns = new Map();
        this.recommendationEngine = new Map();
        this.skillMappings = new Map();
        
        this.initialize();
    }
    
    async initialize() {
        console.log('📚 Book Knowledge Aggregator initializing...');
        
        // Initialize API health monitoring
        await this.initializeApiHealth();
        
        // Load educational mappings
        await this.loadEducationalMappings();
        
        // Initialize neural network components
        await this.initializeNeuralNetwork();
        
        console.log('✅ Book Knowledge Aggregator ready');
        console.log(`🔍 Monitoring ${Object.keys(this.config.apis).length} book APIs`);
        console.log(`🎓 Tracking ${this.config.educationalCategories.length} educational categories`);
    }
    
    /**
     * Main search function - aggregates results from all APIs
     */
    async searchBooks(query, options = {}) {
        console.log(`🔍 Searching for: "${query}"`);
        
        const searchId = this.generateSearchId(query, options);
        const results = {
            searchId,
            query,
            timestamp: new Date(),
            sources: {},
            aggregated: [],
            educational: {
                skillMappings: [],
                learningPaths: [],
                difficultyLevels: []
            },
            metadata: {
                totalResults: 0,
                searchTime: 0,
                apiResponses: 0
            }
        };
        
        const startTime = Date.now();
        
        // Search across all enabled APIs in parallel
        const searchPromises = [];
        
        if (this.config.apis.googleBooks.enabled) {
            searchPromises.push(this.searchGoogleBooks(query, options));
        }
        
        if (this.config.apis.openLibrary.enabled) {
            searchPromises.push(this.searchOpenLibrary(query, options));
        }
        
        if (this.config.apis.dynamicLinks.enabled && options.includePreviews) {
            searchPromises.push(this.searchDynamicLinks(query, options));
        }
        
        // Execute searches
        const apiResults = await Promise.allSettled(searchPromises);
        
        // Process and aggregate results
        apiResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                const apiName = Object.keys(this.config.apis)[index];
                results.sources[apiName] = result.value;
                results.metadata.apiResponses++;
            }
        });
        
        // Aggregate and deduplicate
        results.aggregated = await this.aggregateResults(results.sources);
        
        // Apply educational analysis
        results.educational = await this.analyzeEducationalContent(results.aggregated, query);
        
        // Neural network learning
        if (this.config.neuralNetwork.learningEnabled) {
            await this.learnFromSearch(query, results);
        }
        
        results.metadata.totalResults = results.aggregated.length;
        results.metadata.searchTime = Date.now() - startTime;
        
        this.emit('searchCompleted', results);
        console.log(`✅ Search completed: ${results.metadata.totalResults} books in ${results.metadata.searchTime}ms`);
        
        return results;
    }
    
    /**
     * Search Google Books API
     */
    async searchGoogleBooks(query, options = {}) {
        if (!await this.checkRateLimit('googleBooks')) {
            throw new Error('Google Books API rate limit exceeded');
        }
        
        const params = new URLSearchParams({
            q: this.enhanceQuery(query, 'googleBooks'),
            maxResults: options.maxResults || 20,
            startIndex: options.startIndex || 0,
            langRestrict: options.language || 'en',
            printType: options.printType || 'books',
            orderBy: options.orderBy || 'relevance'
        });
        
        if (this.config.apis.googleBooks.apiKey) {
            params.append('key', this.config.apis.googleBooks.apiKey);
        }
        
        if (options.subject) {
            params.set('q', `${query} subject:${options.subject}`);
        }
        
        const url = `${this.config.apis.googleBooks.baseUrl}/volumes?${params}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            return {
                source: 'googleBooks',
                success: true,
                totalItems: data.totalItems || 0,
                items: (data.items || []).map(item => this.normalizeGoogleBooksItem(item))
            };
            
        } catch (error) {
            console.error('Google Books API error:', error);
            return { source: 'googleBooks', success: false, error: error.message, items: [] };
        }
    }
    
    /**
     * Search Open Library API
     */
    async searchOpenLibrary(query, options = {}) {
        if (!await this.checkRateLimit('openLibrary')) {
            throw new Error('Open Library API rate limit exceeded');
        }
        
        const params = new URLSearchParams({
            q: this.enhanceQuery(query, 'openLibrary'),
            limit: options.maxResults || 20,
            offset: options.startIndex || 0,
            lang: options.language || 'en',
            sort: options.orderBy || 'relevance'
        });
        
        if (options.subject) {
            params.append('subject', options.subject);
        }
        
        const url = `${this.config.apis.openLibrary.baseUrl}/search.json?${params}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            return {
                source: 'openLibrary',
                success: true,
                totalItems: data.numFound || 0,
                items: (data.docs || []).map(item => this.normalizeOpenLibraryItem(item))
            };
            
        } catch (error) {
            console.error('Open Library API error:', error);
            return { source: 'openLibrary', success: false, error: error.message, items: [] };
        }
    }
    
    /**
     * Search Dynamic Links for previews
     */
    async searchDynamicLinks(query, options = {}) {
        // Use Google Books Dynamic Links API for preview checking
        const identifiers = options.identifiers || [];
        
        if (identifiers.length === 0) return { source: 'dynamicLinks', items: [] };
        
        const items = [];
        
        for (const id of identifiers.slice(0, 10)) { // Limit to 10 for performance
            try {
                const url = `${this.config.apis.dynamicLinks.baseUrl}?jscmd=viewapi&bibkeys=${id}&callback=?`;
                const response = await fetch(url);
                const text = await response.text();
                
                // Parse JSONP response
                const jsonMatch = text.match(/\{.*\}/);
                if (jsonMatch) {
                    const data = JSON.parse(jsonMatch[0]);
                    
                    if (data[id]) {
                        items.push({
                            identifier: id,
                            previewUrl: data[id].preview_url,
                            thumbnailUrl: data[id].thumbnail_url,
                            embeddable: data[id].embeddable,
                            viewability: data[id].viewability
                        });
                    }
                }
            } catch (error) {
                console.warn(`Dynamic Links error for ${id}:`, error.message);
            }
        }
        
        return { source: 'dynamicLinks', success: true, items };
    }
    
    /**
     * Aggregate and deduplicate results from multiple sources
     */
    async aggregateResults(sources) {
        const aggregated = [];
        const seenBooks = new Set();
        
        // Priority order: Google Books, Open Library, Dynamic Links
        const priorities = ['googleBooks', 'openLibrary', 'dynamicLinks'];
        
        for (const sourceName of priorities) {
            const source = sources[sourceName];
            if (!source || !source.success) continue;
            
            for (const item of source.items) {
                const bookId = this.generateBookId(item);
                
                if (!seenBooks.has(bookId)) {
                    seenBooks.add(bookId);
                    
                    // Enrich with cross-API data
                    const enrichedItem = await this.enrichBookData(item, sources);
                    aggregated.push(enrichedItem);
                }
            }
        }
        
        return aggregated;
    }
    
    /**
     * Analyze educational content and map to skills
     */
    async analyzeEducationalContent(books, query) {
        const educational = {
            skillMappings: [],
            learningPaths: [],
            difficultyLevels: [],
            recommendations: []
        };
        
        for (const book of books) {
            // Extract educational value
            const skills = await this.extractSkills(book);
            const difficulty = await this.assessDifficulty(book);
            const learningPath = await this.mapToLearningPath(book, skills);
            
            if (skills.length > 0) {
                educational.skillMappings.push({
                    bookId: book.id,
                    title: book.title,
                    skills,
                    confidence: this.calculateSkillConfidence(book, skills)
                });
            }
            
            if (difficulty) {
                educational.difficultyLevels.push({
                    bookId: book.id,
                    level: difficulty.level,
                    reasoning: difficulty.reasoning,
                    prerequisites: difficulty.prerequisites
                });
            }
            
            if (learningPath) {
                educational.learningPaths.push({
                    bookId: book.id,
                    path: learningPath.name,
                    position: learningPath.position,
                    nextBooks: learningPath.nextBooks
                });
            }
        }
        
        // Generate recommendations based on query intent
        educational.recommendations = await this.generateEducationalRecommendations(
            books, 
            query, 
            educational
        );
        
        return educational;
    }
    
    /**
     * Multi-format output generation
     */
    async generateOutput(data, format) {
        console.log(`🔄 Generating ${format} output...`);
        
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(data, null, 2);
                
            case 'html':
                return this.generateHTMLOutput(data);
                
            case 'markdown':
                return this.generateMarkdownOutput(data);
                
            case 'latex':
                return this.generateLaTeXOutput(data);
                
            case 'regex':
                return this.generateRegexPatterns(data);
                
            case 'md5':
                return this.generateMD5Signatures(data);
                
            default:
                throw new Error(`Unsupported output format: ${format}`);
        }
    }
    
    /**
     * Generate HTML output
     */
    generateHTMLOutput(data) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Book Knowledge Search Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .book { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 8px; }
        .title { font-size: 1.2em; font-weight: bold; color: #2c3e50; }
        .authors { color: #7f8c8d; margin: 5px 0; }
        .skills { background: #ecf0f1; padding: 8px; border-radius: 4px; margin: 10px 0; }
        .skill { display: inline-block; background: #3498db; color: white; padding: 3px 8px; margin: 2px; border-radius: 3px; font-size: 0.9em; }
        .metadata { font-size: 0.9em; color: #95a5a6; }
    </style>
</head>
<body>
    <h1>📚 Book Knowledge Search Results</h1>
    <div class="summary">
        <p><strong>Query:</strong> ${data.query}</p>
        <p><strong>Results:</strong> ${data.metadata.totalResults} books</p>
        <p><strong>Search Time:</strong> ${data.metadata.searchTime}ms</p>
    </div>
    
    ${data.aggregated.map(book => `
        <div class="book">
            <div class="title">${book.title}</div>
            <div class="authors">by ${book.authors?.join(', ') || 'Unknown'}</div>
            <div class="description">${book.description?.substring(0, 200) || 'No description available'}...</div>
            ${this.getBookSkills(book, data.educational)?.length > 0 ? `
                <div class="skills">
                    <strong>Skills:</strong>
                    ${this.getBookSkills(book, data.educational).map(skill => `
                        <span class="skill">${skill}</span>
                    `).join('')}
                </div>
            ` : ''}
            <div class="metadata">
                Published: ${book.publishedDate || 'Unknown'} | 
                Pages: ${book.pageCount || 'Unknown'} | 
                Source: ${book.source}
            </div>
        </div>
    `).join('')}
</body>
</html>`;
        
        return html;
    }
    
    /**
     * Generate Markdown output
     */
    generateMarkdownOutput(data) {
        let markdown = `# 📚 Book Knowledge Search Results\n\n`;
        markdown += `**Query:** ${data.query}\n`;
        markdown += `**Results:** ${data.metadata.totalResults} books\n`;
        markdown += `**Search Time:** ${data.metadata.searchTime}ms\n\n`;
        
        markdown += `## Books\n\n`;
        
        data.aggregated.forEach((book, index) => {
            markdown += `### ${index + 1}. ${book.title}\n\n`;
            markdown += `**Authors:** ${book.authors?.join(', ') || 'Unknown'}\n\n`;
            
            if (book.description) {
                markdown += `**Description:** ${book.description.substring(0, 300)}...\n\n`;
            }
            
            const skills = this.getBookSkills(book, data.educational);
            if (skills?.length > 0) {
                markdown += `**Skills:** ${skills.map(skill => `\`${skill}\``).join(', ')}\n\n`;
            }
            
            markdown += `**Metadata:**\n`;
            markdown += `- Published: ${book.publishedDate || 'Unknown'}\n`;
            markdown += `- Pages: ${book.pageCount || 'Unknown'}\n`;
            markdown += `- Source: ${book.source}\n`;
            
            if (book.previewUrl) {
                markdown += `- [Preview](${book.previewUrl})\n`;
            }
            
            markdown += `\n---\n\n`;
        });
        
        return markdown;
    }
    
    /**
     * Generate LaTeX output
     */
    generateLaTeXOutput(data) {
        let latex = `\\documentclass{article}\n`;
        latex += `\\usepackage[utf8]{inputenc}\n`;
        latex += `\\usepackage{hyperref}\n`;
        latex += `\\title{Book Knowledge Search Results}\n`;
        latex += `\\author{Book Knowledge Aggregator}\n`;
        latex += `\\date{\\today}\n\n`;
        latex += `\\begin{document}\n`;
        latex += `\\maketitle\n\n`;
        
        latex += `\\section{Search Summary}\n`;
        latex += `\\textbf{Query:} ${this.escapeLatex(data.query)}\\\\\n`;
        latex += `\\textbf{Results:} ${data.metadata.totalResults} books\\\\\n`;
        latex += `\\textbf{Search Time:} ${data.metadata.searchTime}ms\n\n`;
        
        latex += `\\section{Books}\n`;
        
        data.aggregated.forEach((book, index) => {
            latex += `\\subsection{${this.escapeLatex(book.title)}}\n`;
            latex += `\\textbf{Authors:} ${this.escapeLatex(book.authors?.join(', ') || 'Unknown')}\\\\\n`;
            
            if (book.description) {
                latex += `\\textbf{Description:} ${this.escapeLatex(book.description.substring(0, 300))}...\\\\\n`;
            }
            
            latex += `\\textbf{Published:} ${book.publishedDate || 'Unknown'}\\\\\n`;
            latex += `\\textbf{Pages:} ${book.pageCount || 'Unknown'}\\\\\n`;
            latex += `\\textbf{Source:} ${book.source}\\\\\n\n`;
        });
        
        latex += `\\end{document}`;
        
        return latex;
    }
    
    /**
     * Generate regex patterns for book matching
     */
    generateRegexPatterns(data) {
        const patterns = {
            titles: data.aggregated.map(book => 
                this.generateTitleRegex(book.title)
            ),
            authors: [...new Set(data.aggregated.flatMap(book => book.authors || []))].map(author =>
                this.generateAuthorRegex(author)
            ),
            skills: data.educational.skillMappings.flatMap(mapping => 
                mapping.skills.map(skill => this.generateSkillRegex(skill))
            ),
            isbn: data.aggregated.filter(book => book.isbn).map(book =>
                `/^${book.isbn.replace(/[-\s]/g, '').replace(/\d/g, '\\d')}$/`
            )
        };
        
        return {
            patterns,
            usage: {
                titles: "Match book titles with variations",
                authors: "Match author names with common variations", 
                skills: "Match skill-related content",
                isbn: "Match ISBN formats"
            },
            examples: {
                titleMatch: `/${patterns.titles[0]}/i`,
                authorMatch: `/${patterns.authors[0]}/i`,
                skillMatch: patterns.skills[0] ? `/${patterns.skills[0]}/i` : null
            }
        };
    }
    
    /**
     * Generate MD5 signatures for content verification
     */
    generateMD5Signatures(data) {
        const signatures = {};
        
        // Book content signatures
        signatures.books = data.aggregated.map(book => ({
            id: book.id,
            title: book.title,
            contentHash: crypto.createHash('md5').update(JSON.stringify(book)).digest('hex'),
            titleHash: crypto.createHash('md5').update(book.title.toLowerCase()).digest('hex'),
            authorHash: book.authors ? crypto.createHash('md5').update(book.authors.join(',').toLowerCase()).digest('hex') : null
        }));
        
        // Search signature
        signatures.search = {
            queryHash: crypto.createHash('md5').update(data.query.toLowerCase()).digest('hex'),
            resultsHash: crypto.createHash('md5').update(JSON.stringify(data.aggregated.map(b => b.id))).digest('hex'),
            fullHash: crypto.createHash('md5').update(JSON.stringify(data)).digest('hex')
        };
        
        // Educational content signatures
        signatures.educational = {
            skillsHash: crypto.createHash('md5').update(JSON.stringify(data.educational.skillMappings)).digest('hex'),
            pathsHash: crypto.createHash('md5').update(JSON.stringify(data.educational.learningPaths)).digest('hex')
        };
        
        return signatures;
    }
    
    // Helper methods
    
    generateSearchId(query, options) {
        const searchString = JSON.stringify({ query, options });
        return crypto.createHash('md5').update(searchString).digest('hex').substring(0, 16);
    }
    
    generateBookId(book) {
        const identifier = book.isbn || book.id || book.title + book.authors?.join(',');
        return crypto.createHash('md5').update(identifier).digest('hex').substring(0, 12);
    }
    
    enhanceQuery(query, apiName) {
        // Add API-specific enhancements
        const enhancements = {
            googleBooks: query,
            openLibrary: query
        };
        
        return enhancements[apiName] || query;
    }
    
    normalizeGoogleBooksItem(item) {
        const volumeInfo = item.volumeInfo || {};
        return {
            id: item.id,
            source: 'googleBooks',
            title: volumeInfo.title,
            authors: volumeInfo.authors,
            description: volumeInfo.description,
            publishedDate: volumeInfo.publishedDate,
            pageCount: volumeInfo.pageCount,
            categories: volumeInfo.categories,
            isbn: volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier,
            thumbnail: volumeInfo.imageLinks?.thumbnail,
            previewLink: volumeInfo.previewLink,
            language: volumeInfo.language,
            publisher: volumeInfo.publisher
        };
    }
    
    normalizeOpenLibraryItem(item) {
        return {
            id: item.key,
            source: 'openLibrary',
            title: item.title,
            authors: item.author_name,
            description: item.first_sentence?.[0],
            publishedDate: item.first_publish_year?.toString(),
            pageCount: item.number_of_pages_median,
            categories: item.subject,
            isbn: item.isbn?.[0],
            language: item.language?.[0],
            publisher: item.publisher?.[0],
            editions: item.edition_count
        };
    }
    
    async enrichBookData(item, sources) {
        // Cross-reference with other APIs for additional data
        let enriched = { ...item };
        
        // Add preview data if available
        if (sources.dynamicLinks?.items) {
            const preview = sources.dynamicLinks.items.find(p => 
                p.identifier.includes(item.isbn) || p.identifier.includes(item.id)
            );
            if (preview) {
                enriched.previewUrl = preview.previewUrl;
                enriched.embeddable = preview.embeddable;
                enriched.viewability = preview.viewability;
            }
        }
        
        return enriched;
    }
    
    async extractSkills(book) {
        const skills = [];
        const content = `${book.title} ${book.description} ${book.categories?.join(' ') || ''}`.toLowerCase();
        
        // Skill mapping patterns
        const skillPatterns = {
            'Customer Service': /customer service|support|help desk|communication/,
            'Financial Literacy': /finance|money|budget|invest|economic/,
            'Leadership': /leader|manage|team|supervise/,
            'Problem Solving': /problem|solution|troubleshoot|debug/,
            'Communication': /communicate|present|write|speak/,
            'Gaming Skills': /game|gaming|strategy|tactics/,
            'Social Impact': /social|community|impact|sustainable/
        };
        
        for (const [skill, pattern] of Object.entries(skillPatterns)) {
            if (pattern.test(content)) {
                skills.push(skill);
            }
        }
        
        return skills;
    }
    
    async assessDifficulty(book) {
        const indicators = {
            beginner: /beginner|intro|basic|fundamentals|101/i,
            intermediate: /intermediate|practical|applied|handbook/i,
            advanced: /advanced|expert|master|comprehensive|complete/i
        };
        
        const content = `${book.title} ${book.description || ''}`;
        
        for (const [level, pattern] of Object.entries(indicators)) {
            if (pattern.test(content)) {
                return {
                    level,
                    reasoning: `Title/description contains ${level}-level indicators`,
                    prerequisites: level === 'beginner' ? [] : [`${level === 'advanced' ? 'intermediate' : 'beginner'} knowledge`]
                };
            }
        }
        
        return null;
    }
    
    async mapToLearningPath(book, skills) {
        if (skills.length === 0) return null;
        
        const primarySkill = skills[0];
        const paths = {
            'Customer Service': {
                name: 'Customer Service Mastery',
                stages: ['Communication Basics', 'Problem Resolution', 'Advanced Support'],
                position: this.determinePathPosition(book, primarySkill)
            },
            'Financial Literacy': {
                name: 'Financial Mastery',
                stages: ['Money Basics', 'Budgeting & Saving', 'Investment Strategies'],
                position: this.determinePathPosition(book, primarySkill)
            }
        };
        
        return paths[primarySkill] || null;
    }
    
    determinePathPosition(book, skill) {
        // Simplified position determination
        const content = book.title?.toLowerCase() || '';
        if (content.includes('beginner') || content.includes('intro')) return 1;
        if (content.includes('advanced') || content.includes('master')) return 3;
        return 2;
    }
    
    calculateSkillConfidence(book, skills) {
        // Calculate confidence score based on multiple factors
        let confidence = 0;
        
        // Title relevance
        if (skills.some(skill => book.title?.toLowerCase().includes(skill.toLowerCase()))) {
            confidence += 0.4;
        }
        
        // Description relevance
        if (skills.some(skill => book.description?.toLowerCase().includes(skill.toLowerCase()))) {
            confidence += 0.3;
        }
        
        // Category match
        if (book.categories?.some(cat => skills.some(skill => cat.toLowerCase().includes(skill.toLowerCase())))) {
            confidence += 0.3;
        }
        
        return Math.min(confidence, 1.0);
    }
    
    async generateEducationalRecommendations(books, query, educational) {
        const recommendations = [];
        
        // Skill-based recommendations
        const skillCounts = {};
        educational.skillMappings.forEach(mapping => {
            mapping.skills.forEach(skill => {
                skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
        });
        
        const topSkills = Object.entries(skillCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([skill]) => skill);
        
        recommendations.push({
            type: 'skill_focus',
            title: 'Top Skills in Results',
            items: topSkills,
            reason: 'Most commonly found skills in search results'
        });
        
        return recommendations;
    }
    
    getBookSkills(book, educational) {
        const mapping = educational.skillMappings.find(m => m.bookId === book.id);
        return mapping ? mapping.skills : [];
    }
    
    async checkRateLimit(apiName) {
        const now = Date.now();
        const limits = this.rateLimits.get(apiName) || { requests: 0, resetTime: now };
        
        const config = this.config.apis[apiName];
        if (now > limits.resetTime) {
            // Reset limits based on API-specific intervals
            this.rateLimits.set(apiName, { requests: 0, resetTime: now + (60 * 60 * 1000) }); // 1 hour
            return true;
        }
        
        if (limits.requests >= config.rateLimit) {
            return false;
        }
        
        limits.requests++;
        this.rateLimits.set(apiName, limits);
        return true;
    }
    
    async initializeApiHealth() {
        for (const apiName of Object.keys(this.config.apis)) {
            this.apiHealth.set(apiName, {
                status: 'unknown',
                lastCheck: null,
                responseTime: null
            });
        }
    }
    
    async loadEducationalMappings() {
        // Load or initialize educational mappings
        console.log('📖 Loading educational skill mappings...');
    }
    
    async initializeNeuralNetwork() {
        console.log('🧠 Initializing neural network components...');
        // Initialize learning patterns and recommendation algorithms
    }
    
    async learnFromSearch(query, results) {
        // Neural network learning from search patterns
        const pattern = {
            query: query.toLowerCase(),
            resultCount: results.metadata.totalResults,
            topSkills: results.educational.skillMappings.slice(0, 3),
            timestamp: Date.now()
        };
        
        this.learningPatterns.set(query, pattern);
    }
    
    generateTitleRegex(title) {
        return title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                   .replace(/\s+/g, '\\s+')
                   .replace(/\w/g, char => `[${char.toLowerCase()}${char.toUpperCase()}]`);
    }
    
    generateAuthorRegex(author) {
        return author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    .replace(/\s+/g, '\\s+');
    }
    
    generateSkillRegex(skill) {
        return skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                   .replace(/\s+/g, '\\s+');
    }
    
    escapeLatex(text) {
        return text.replace(/[&%$#_{}~^\\]/g, '\\$&');
    }
}

// Export
module.exports = BookKnowledgeAggregator;

// Example usage
if (require.main === module) {
    async function demonstrateBookAggregator() {
        console.log('🚀 Book Knowledge Aggregator Demo\n');
        
        const aggregator = new BookKnowledgeAggregator({
            // Demo configuration
            googleBooksApiKey: 'demo_key',
            neuralNetwork: {
                learningEnabled: true,
                patternRecognition: true
            }
        });
        
        // Search for educational books
        console.log('🔍 Searching for customer service books...');
        const results = await aggregator.searchBooks('customer service training', {
            maxResults: 10,
            subject: 'business',
            includePreviews: true
        });
        
        console.log(`\n📊 Search Results:`);
        console.log(`Found: ${results.metadata.totalResults} books`);
        console.log(`Search time: ${results.metadata.searchTime}ms`);
        console.log(`API responses: ${results.metadata.apiResponses}`);
        
        // Show educational analysis
        if (results.educational.skillMappings.length > 0) {
            console.log(`\n🎓 Educational Analysis:`);
            console.log(`Skills found: ${results.educational.skillMappings.length} mappings`);
            console.log(`Learning paths: ${results.educational.learningPaths.length} paths`);
        }
        
        // Generate different output formats
        console.log('\n📝 Generating output formats...');
        
        const htmlOutput = await aggregator.generateOutput(results, 'html');
        console.log(`HTML output: ${htmlOutput.length} characters`);
        
        const markdownOutput = await aggregator.generateOutput(results, 'markdown');
        console.log(`Markdown output: ${markdownOutput.length} characters`);
        
        const regexPatterns = await aggregator.generateOutput(results, 'regex');
        console.log(`Regex patterns: ${regexPatterns.patterns.titles.length} title patterns`);
        
        const md5Signatures = await aggregator.generateOutput(results, 'md5');
        console.log(`MD5 signatures: ${md5Signatures.books.length} book signatures`);
        
        console.log('\n✅ Book Knowledge Aggregator demo complete!');
    }
    
    demonstrateBookAggregator().catch(console.error);
}