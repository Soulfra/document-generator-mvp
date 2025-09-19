#!/usr/bin/env node

/**
 * 🧠 RAG KNOWLEDGE QUERY ENGINE
 * Implements RAG-first knowledge queries with local portfolio priority
 * Integrates with encrypted portfolios, ASCII SOL storage, and directory federation
 */

const fs = require('fs').promises;
const crypto = require('crypto');
const path = require('path');
const EventEmitter = require('events');

class RAGKnowledgeQueryEngine extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            queryPort: 8081,
            knowledgeBaseRoot: './knowledge-base',
            cacheTimeout: 300000, // 5 minutes
            maxCacheSize: 10000,
            searchStrategies: {
                exact_match: { weight: 1.0, timeout: 100 },
                semantic_search: { weight: 0.8, timeout: 500 },
                fuzzy_search: { weight: 0.6, timeout: 1000 },
                contextual_search: { weight: 0.9, timeout: 800 },
                portfolio_search: { weight: 1.2, timeout: 1500 }
            }
        };
        
        // Knowledge repositories
        this.knowledgeRepositories = {
            encrypted_portfolios: new Map(),
            ascii_sol_files: new Map(),
            local_documents: new Map(),
            user_profiles: new Map(),
            cached_responses: new Map(),
            external_cache: new Map()
        };
        
        // Search indexes
        this.searchIndexes = {
            keywords: new Map(),
            semanticVectors: new Map(),
            documentHashes: new Map(),
            userAccess: new Map(),
            contentTypes: new Map()
        };
        
        // Query cache
        this.queryCache = new Map();
        this.cacheMetrics = {
            hits: 0,
            misses: 0,
            totalQueries: 0
        };
        
        console.log('🧠 RAG Knowledge Query Engine initialized');
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Starting RAG Knowledge Query Engine...');
        
        // Initialize knowledge base storage
        await this.initializeKnowledgeBase();
        
        // Load existing knowledge repositories
        await this.loadKnowledgeRepositories();
        
        // Build search indexes
        await this.buildSearchIndexes();
        
        // Start query processing service
        await this.startQueryService();
        
        console.log('✅ RAG Knowledge Query Engine ready');
        this.emit('rag:ready');
    }
    
    async initializeKnowledgeBase() {
        console.log('📚 Initializing knowledge base...');
        
        try {
            await fs.mkdir(this.config.knowledgeBaseRoot, { recursive: true });
            await fs.mkdir(path.join(this.config.knowledgeBaseRoot, 'encrypted'), { recursive: true });
            await fs.mkdir(path.join(this.config.knowledgeBaseRoot, 'ascii-sol'), { recursive: true });
            await fs.mkdir(path.join(this.config.knowledgeBaseRoot, 'documents'), { recursive: true });
            await fs.mkdir(path.join(this.config.knowledgeBaseRoot, 'indexes'), { recursive: true });
            await fs.mkdir(path.join(this.config.knowledgeBaseRoot, 'cache'), { recursive: true });
            
            console.log(`📁 Knowledge base initialized at: ${this.config.knowledgeBaseRoot}`);
        } catch (error) {
            console.error('❌ Knowledge base initialization failed:', error);
        }
    }
    
    async loadKnowledgeRepositories() {
        console.log('📖 Loading knowledge repositories...');
        
        try {
            // Load encrypted portfolios
            await this.loadEncryptedPortfolios();
            
            // Load ASCII SOL files
            await this.loadASCIISOLFiles();
            
            // Load local documents
            await this.loadLocalDocuments();
            
            // Load user profiles
            await this.loadUserProfiles();
            
            // Load cached responses
            await this.loadCachedResponses();
            
            console.log('✅ Knowledge repositories loaded');
            this.logRepositoryStats();
            
        } catch (error) {
            console.error('❌ Knowledge repository loading failed:', error);
        }
    }
    
    async loadEncryptedPortfolios() {
        const encryptedPath = path.join(this.config.knowledgeBaseRoot, 'encrypted');
        
        try {
            const entries = await fs.readdir(encryptedPath, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.isFile() && entry.name.endsWith('.encrypted')) {
                    const filePath = path.join(encryptedPath, entry.name);
                    const content = await fs.readFile(filePath, 'utf8');
                    
                    try {
                        const portfolio = JSON.parse(content);
                        this.knowledgeRepositories.encrypted_portfolios.set(entry.name, {
                            file: entry.name,
                            path: filePath,
                            portfolio,
                            lastLoaded: Date.now(),
                            searchable: this.isPortfolioSearchable(portfolio)
                        });
                    } catch (error) {
                        console.warn(`⚠️  Skipped invalid portfolio: ${entry.name}`);
                    }
                }
            }
            
            console.log(`📦 Loaded ${this.knowledgeRepositories.encrypted_portfolios.size} encrypted portfolios`);
        } catch (error) {
            console.log('📦 No encrypted portfolios directory found');
        }
    }
    
    async loadASCIISOLFiles() {
        const asciiSOLPath = path.join(this.config.knowledgeBaseRoot, 'ascii-sol');
        
        try {
            const entries = await fs.readdir(asciiSOLPath, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.isFile() && entry.name.endsWith('.ascii-sol')) {
                    const filePath = path.join(asciiSOLPath, entry.name);
                    const content = await fs.readFile(filePath, 'utf8');
                    
                    const parsed = this.parseASCIISOLFile(content);
                    if (parsed) {
                        this.knowledgeRepositories.ascii_sol_files.set(entry.name, {
                            file: entry.name,
                            path: filePath,
                            solHeader: parsed.header,
                            content: parsed.content,
                            metadata: parsed.metadata,
                            lastLoaded: Date.now()
                        });
                    }
                }
            }
            
            console.log(`📝 Loaded ${this.knowledgeRepositories.ascii_sol_files.size} ASCII SOL files`);
        } catch (error) {
            console.log('📝 No ASCII SOL files directory found');
        }
    }
    
    parseASCIISOLFile(content) {
        try {
            // Extract SOL header
            const headerMatch = content.match(/\/\*\s*(.*?)\s*\*\//s);
            if (!headerMatch) return null;
            
            const headerText = headerMatch[1].replace(/^ \* /gm, '');
            const header = JSON.parse(headerText);
            
            // Extract content
            const contentMatch = content.match(/\/\/ ASCII FILE CONTENT\s*\n\/\/ ===============================================\s*\n(.*?)(?:\n\/\/ ===============================================|$)/s);
            const fileContent = contentMatch ? contentMatch[1] : '';
            
            return {
                header,
                content: fileContent,
                metadata: {
                    format: header.storage?.format || 'unknown',
                    encoding: header.storage?.encoding || 'unknown',
                    entertainment: header.community?.entertainmentRating || 1,
                    gutterLevel: header.community?.gutterLevel || 'surface',
                    tags: header.community?.tags || []
                }
            };
        } catch (error) {
            return null;
        }
    }
    
    async loadLocalDocuments() {
        const documentsPath = path.join(this.config.knowledgeBaseRoot, 'documents');
        
        try {
            const entries = await fs.readdir(documentsPath, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.isFile()) {
                    const filePath = path.join(documentsPath, entry.name);
                    const stats = await fs.stat(filePath);
                    const content = await fs.readFile(filePath, 'utf8');
                    
                    this.knowledgeRepositories.local_documents.set(entry.name, {
                        file: entry.name,
                        path: filePath,
                        content,
                        size: stats.size,
                        modified: stats.mtime,
                        extension: path.extname(entry.name),
                        contentType: this.detectContentType(entry.name, content),
                        lastLoaded: Date.now()
                    });
                }
            }
            
            console.log(`📄 Loaded ${this.knowledgeRepositories.local_documents.size} local documents`);
        } catch (error) {
            console.log('📄 No local documents directory found');
        }
    }
    
    async loadUserProfiles() {
        // Load user profiles from OAuth integration
        try {
            const profilesPath = path.join(this.config.knowledgeBaseRoot, 'user-profiles.json');
            const content = await fs.readFile(profilesPath, 'utf8');
            const profiles = JSON.parse(content);
            
            Object.entries(profiles).forEach(([userId, profile]) => {
                this.knowledgeRepositories.user_profiles.set(userId, {
                    userId,
                    profile,
                    lastLoaded: Date.now(),
                    accessLevel: this.determineUserAccessLevel(profile)
                });
            });
            
            console.log(`👥 Loaded ${this.knowledgeRepositories.user_profiles.size} user profiles`);
        } catch (error) {
            console.log('👥 No user profiles found');
        }
    }
    
    async loadCachedResponses() {
        const cachePath = path.join(this.config.knowledgeBaseRoot, 'cache');
        
        try {
            const entries = await fs.readdir(cachePath, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.isFile() && entry.name.endsWith('.cache')) {
                    const filePath = path.join(cachePath, entry.name);
                    const content = await fs.readFile(filePath, 'utf8');
                    
                    try {
                        const cached = JSON.parse(content);
                        if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                            this.knowledgeRepositories.cached_responses.set(cached.queryHash, cached);
                        }
                    } catch (error) {
                        console.warn(`⚠️  Skipped invalid cache: ${entry.name}`);
                    }
                }
            }
            
            console.log(`💾 Loaded ${this.knowledgeRepositories.cached_responses.size} cached responses`);
        } catch (error) {
            console.log('💾 No cached responses found');
        }
    }
    
    async buildSearchIndexes() {
        console.log('🔍 Building search indexes...');
        
        // Index keywords from all repositories
        await this.buildKeywordIndex();
        
        // Build semantic vectors (simplified)
        await this.buildSemanticIndex();
        
        // Build document hash index
        await this.buildDocumentHashIndex();
        
        // Build user access index
        await this.buildUserAccessIndex();
        
        // Build content type index
        await this.buildContentTypeIndex();
        
        console.log('✅ Search indexes built');
        this.logIndexStats();
    }
    
    async buildKeywordIndex() {
        // Index keywords from encrypted portfolios
        for (const [key, repo] of this.knowledgeRepositories.encrypted_portfolios) {
            if (repo.searchable) {
                const keywords = this.extractKeywords(JSON.stringify(repo.portfolio));
                this.indexKeywords(keywords, 'encrypted_portfolio', key);
            }
        }
        
        // Index keywords from ASCII SOL files
        for (const [key, repo] of this.knowledgeRepositories.ascii_sol_files) {
            const keywords = this.extractKeywords(repo.content + JSON.stringify(repo.metadata));
            this.indexKeywords(keywords, 'ascii_sol', key);
        }
        
        // Index keywords from local documents
        for (const [key, repo] of this.knowledgeRepositories.local_documents) {
            const keywords = this.extractKeywords(repo.content);
            this.indexKeywords(keywords, 'local_document', key);
        }
        
        // Index keywords from user profiles
        for (const [key, repo] of this.knowledgeRepositories.user_profiles) {
            const keywords = this.extractKeywords(JSON.stringify(repo.profile));
            this.indexKeywords(keywords, 'user_profile', key);
        }
    }
    
    extractKeywords(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2)
            .filter(word => !this.isStopWord(word));
    }
    
    isStopWord(word) {
        const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'this', 'that', 'these', 'those'];
        return stopWords.includes(word);
    }
    
    indexKeywords(keywords, type, key) {
        keywords.forEach(keyword => {
            if (!this.searchIndexes.keywords.has(keyword)) {
                this.searchIndexes.keywords.set(keyword, []);
            }
            
            this.searchIndexes.keywords.get(keyword).push({
                type,
                key,
                relevance: 1.0
            });
        });
    }
    
    async buildSemanticIndex() {
        // Simplified semantic indexing - could be enhanced with embeddings
        for (const [keyword, references] of this.searchIndexes.keywords) {
            const synonyms = this.generateSynonyms(keyword);
            
            synonyms.forEach(synonym => {
                if (!this.searchIndexes.semanticVectors.has(synonym)) {
                    this.searchIndexes.semanticVectors.set(synonym, []);
                }
                
                this.searchIndexes.semanticVectors.get(synonym).push(...references.map(ref => ({
                    ...ref,
                    relevance: ref.relevance * 0.8 // Lower relevance for synonyms
                })));
            });
        }
    }
    
    generateSynonyms(word) {
        const synonymMap = {
            'user': ['person', 'account', 'profile', 'individual'],
            'file': ['document', 'data', 'content', 'item'],
            'search': ['find', 'locate', 'query', 'lookup'],
            'system': ['platform', 'service', 'application'],
            'auth': ['authentication', 'login', 'signin', 'credential'],
            'config': ['configuration', 'settings', 'setup', 'preferences']
        };
        
        return synonymMap[word] || [];
    }
    
    async buildDocumentHashIndex() {
        // Create hash index for quick document identification
        for (const [key, repo] of this.knowledgeRepositories.local_documents) {
            const hash = crypto.createHash('sha256').update(repo.content).digest('hex');
            this.searchIndexes.documentHashes.set(hash, {
                type: 'local_document',
                key,
                size: repo.size
            });
        }
        
        for (const [key, repo] of this.knowledgeRepositories.ascii_sol_files) {
            const hash = crypto.createHash('sha256').update(repo.content).digest('hex');
            this.searchIndexes.documentHashes.set(hash, {
                type: 'ascii_sol',
                key,
                solHeader: repo.solHeader
            });
        }
    }
    
    async buildUserAccessIndex() {
        // Build index of user access patterns
        for (const [userId, repo] of this.knowledgeRepositories.user_profiles) {
            this.searchIndexes.userAccess.set(userId, {
                accessLevel: repo.accessLevel,
                capabilities: this.analyzeUserCapabilities(repo.profile),
                lastAccess: repo.lastLoaded
            });
        }
    }
    
    async buildContentTypeIndex() {
        // Index content by type for faster filtering
        const contentTypes = ['code', 'documentation', 'configuration', 'data', 'entertainment', 'business'];
        
        contentTypes.forEach(type => {
            this.searchIndexes.contentTypes.set(type, []);
        });
        
        // Classify content
        for (const [key, repo] of this.knowledgeRepositories.local_documents) {
            const contentType = this.classifyContent(repo.content, repo.file);
            this.searchIndexes.contentTypes.get(contentType).push({
                type: 'local_document',
                key,
                confidence: 0.8
            });
        }
        
        for (const [key, repo] of this.knowledgeRepositories.ascii_sol_files) {
            const contentType = this.classifyContentFromMetadata(repo.metadata);
            this.searchIndexes.contentTypes.get(contentType).push({
                type: 'ascii_sol',
                key,
                confidence: 0.9
            });
        }
    }
    
    classifyContent(content, filename) {
        const ext = path.extname(filename).toLowerCase();
        
        if (['.js', '.ts', '.py', '.java', '.cpp', '.c'].includes(ext)) return 'code';
        if (['.md', '.txt', '.doc'].includes(ext)) return 'documentation';
        if (['.json', '.yaml', '.yml', '.toml'].includes(ext)) return 'configuration';
        if (['.csv', '.sql', '.db'].includes(ext)) return 'data';
        
        // Content-based classification
        const contentLower = content.toLowerCase();
        if (contentLower.includes('entertainment') || contentLower.includes('viral') || contentLower.includes('fun')) {
            return 'entertainment';
        }
        if (contentLower.includes('business') || contentLower.includes('revenue') || contentLower.includes('profit')) {
            return 'business';
        }
        
        return 'documentation';
    }
    
    classifyContentFromMetadata(metadata) {
        if (metadata.entertainment > 5) return 'entertainment';
        if (metadata.tags.includes('business')) return 'business';
        if (metadata.tags.includes('code')) return 'code';
        if (metadata.format === 'ASCII+SOL') return 'data';
        
        return 'documentation';
    }
    
    async startQueryService() {
        console.log('🔧 Starting query service...');
        
        // Start cache cleanup scheduler
        setInterval(() => {
            this.cleanupCache();
        }, 60000); // Every minute
        
        console.log('✅ Query service ready');
    }
    
    async processQuery(queryString, options = {}) {
        console.log(`🧠 Processing RAG query: "${queryString}"`);
        
        this.cacheMetrics.totalQueries++;
        
        // Check cache first
        const queryHash = this.hashQuery(queryString, options);
        if (this.queryCache.has(queryHash)) {
            this.cacheMetrics.hits++;
            console.log('💾 Cache hit');
            return this.queryCache.get(queryHash);
        }
        
        this.cacheMetrics.misses++;
        
        try {
            // Execute search strategies in parallel
            const searchPromises = Object.entries(this.config.searchStrategies).map(([strategy, config]) => {
                return this.executeSearchStrategy(strategy, queryString, options, config.timeout);
            });
            
            const searchResults = await Promise.allSettled(searchPromises);
            
            // Combine and rank results
            const combinedResults = this.combineSearchResults(searchResults, queryString);
            
            // Cache result
            this.cacheResult(queryHash, combinedResults);
            
            console.log(`✅ Query processed: ${combinedResults.totalResults} results found`);
            
            return combinedResults;
            
        } catch (error) {
            console.error('❌ Query processing failed:', error);
            throw error;
        }
    }
    
    async executeSearchStrategy(strategy, queryString, options, timeout) {
        const startTime = Date.now();
        
        try {
            let results = [];
            
            switch (strategy) {
                case 'exact_match':
                    results = await this.exactMatchSearch(queryString, options);
                    break;
                    
                case 'semantic_search':
                    results = await this.semanticSearch(queryString, options);
                    break;
                    
                case 'fuzzy_search':
                    results = await this.fuzzySearch(queryString, options);
                    break;
                    
                case 'contextual_search':
                    results = await this.contextualSearch(queryString, options);
                    break;
                    
                case 'portfolio_search':
                    results = await this.portfolioSearch(queryString, options);
                    break;
            }
            
            const searchTime = Date.now() - startTime;
            
            return {
                strategy,
                results,
                searchTime,
                success: true
            };
            
        } catch (error) {
            return {
                strategy,
                results: [],
                searchTime: Date.now() - startTime,
                success: false,
                error: error.message
            };
        }
    }
    
    async exactMatchSearch(queryString, options) {
        const results = [];
        const queryLower = queryString.toLowerCase();
        
        // Search keywords
        if (this.searchIndexes.keywords.has(queryLower)) {
            const references = this.searchIndexes.keywords.get(queryLower);
            
            for (const ref of references) {
                const data = this.getRepositoryData(ref.type, ref.key);
                if (data) {
                    results.push({
                        type: ref.type,
                        key: ref.key,
                        confidence: 1.0,
                        data,
                        matchType: 'exact_keyword'
                    });
                }
            }
        }
        
        // Search content directly
        for (const [key, repo] of this.knowledgeRepositories.local_documents) {
            if (repo.content.toLowerCase().includes(queryLower)) {
                results.push({
                    type: 'local_document',
                    key,
                    confidence: 0.9,
                    data: repo,
                    matchType: 'exact_content'
                });
            }
        }
        
        return results;
    }
    
    async semanticSearch(queryString, options) {
        const results = [];
        const queryWords = queryString.toLowerCase().split(/\s+/);
        
        // Search semantic vectors
        for (const word of queryWords) {
            if (this.searchIndexes.semanticVectors.has(word)) {
                const references = this.searchIndexes.semanticVectors.get(word);
                
                for (const ref of references) {
                    const data = this.getRepositoryData(ref.type, ref.key);
                    if (data) {
                        results.push({
                            type: ref.type,
                            key: ref.key,
                            confidence: ref.relevance,
                            data,
                            matchType: 'semantic',
                            matchedWord: word
                        });
                    }
                }
            }
        }
        
        // Deduplicate and sort
        const uniqueResults = this.deduplicateResults(results);
        return uniqueResults.sort((a, b) => b.confidence - a.confidence);
    }
    
    async fuzzySearch(queryString, options) {
        const results = [];
        const queryLower = queryString.toLowerCase();
        
        // Fuzzy match against keywords
        for (const [keyword, references] of this.searchIndexes.keywords) {
            const distance = this.levenshteinDistance(queryLower, keyword);
            const similarity = 1 - (distance / Math.max(queryLower.length, keyword.length));
            
            if (similarity > 0.6) {
                for (const ref of references) {
                    const data = this.getRepositoryData(ref.type, ref.key);
                    if (data) {
                        results.push({
                            type: ref.type,
                            key: ref.key,
                            confidence: similarity * ref.relevance,
                            data,
                            matchType: 'fuzzy',
                            similarity
                        });
                    }
                }
            }
        }
        
        return results.sort((a, b) => b.confidence - a.confidence);
    }
    
    async contextualSearch(queryString, options) {
        const results = [];
        
        // Search based on user context
        if (options.userId) {
            const userAccess = this.searchIndexes.userAccess.get(options.userId);
            if (userAccess) {
                // Search content appropriate for user's access level
                results.push(...await this.searchByAccessLevel(queryString, userAccess.accessLevel));
            }
        }
        
        // Search based on content type context
        if (options.contentType) {
            const typeResults = this.searchIndexes.contentTypes.get(options.contentType) || [];
            
            for (const ref of typeResults) {
                const data = this.getRepositoryData(ref.type, ref.key);
                if (data && this.contentMatchesQuery(data, queryString)) {
                    results.push({
                        type: ref.type,
                        key: ref.key,
                        confidence: ref.confidence,
                        data,
                        matchType: 'contextual_type'
                    });
                }
            }
        }
        
        return results;
    }
    
    async portfolioSearch(queryString, options) {
        const results = [];
        
        // High-priority search in encrypted portfolios
        for (const [key, repo] of this.knowledgeRepositories.encrypted_portfolios) {
            if (repo.searchable) {
                const portfolioText = JSON.stringify(repo.portfolio).toLowerCase();
                if (portfolioText.includes(queryString.toLowerCase())) {
                    results.push({
                        type: 'encrypted_portfolio',
                        key,
                        confidence: 1.2, // Higher weight for portfolio content
                        data: repo,
                        matchType: 'portfolio_content'
                    });
                }
            }
        }
        
        // Search ASCII SOL files with entertainment rating boost
        for (const [key, repo] of this.knowledgeRepositories.ascii_sol_files) {
            const searchableText = (repo.content + JSON.stringify(repo.metadata)).toLowerCase();
            if (searchableText.includes(queryString.toLowerCase())) {
                const entertainmentBoost = repo.metadata.entertainment / 10;
                results.push({
                    type: 'ascii_sol',
                    key,
                    confidence: 1.0 + entertainmentBoost,
                    data: repo,
                    matchType: 'ascii_sol_content'
                });
            }
        }
        
        return results.sort((a, b) => b.confidence - a.confidence);
    }
    
    combineSearchResults(searchResults, queryString) {
        const allResults = [];
        const strategyStats = {};
        
        // Collect results from all strategies
        searchResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.success) {
                const strategy = result.value.strategy;
                const weight = this.config.searchStrategies[strategy].weight;
                
                strategyStats[strategy] = {
                    results: result.value.results.length,
                    searchTime: result.value.searchTime,
                    success: true
                };
                
                // Apply strategy weight to confidence scores
                result.value.results.forEach(r => {
                    allResults.push({
                        ...r,
                        confidence: r.confidence * weight,
                        strategy
                    });
                });
            } else {
                strategyStats[result.value?.strategy || 'unknown'] = {
                    results: 0,
                    searchTime: result.value?.searchTime || 0,
                    success: false,
                    error: result.reason?.message || 'Unknown error'
                };
            }
        });
        
        // Deduplicate and rank results
        const uniqueResults = this.deduplicateResults(allResults);
        const rankedResults = this.rankResults(uniqueResults, queryString);
        
        return {
            query: queryString,
            totalResults: rankedResults.length,
            results: rankedResults.slice(0, 20), // Top 20 results
            strategyStats,
            searchTime: Math.max(...Object.values(strategyStats).map(s => s.searchTime)),
            cacheMetrics: this.getCacheMetrics()
        };
    }
    
    deduplicateResults(results) {
        const seen = new Set();
        return results.filter(result => {
            const key = `${result.type}:${result.key}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    
    rankResults(results, queryString) {
        // Calculate final relevance scores
        return results
            .map(result => ({
                ...result,
                finalScore: this.calculateFinalScore(result, queryString)
            }))
            .sort((a, b) => b.finalScore - a.finalScore);
    }
    
    calculateFinalScore(result, queryString) {
        let score = result.confidence;
        
        // Boost for exact matches
        if (result.matchType === 'exact_keyword' || result.matchType === 'exact_content') {
            score *= 1.5;
        }
        
        // Boost for portfolio content (highest priority)
        if (result.type === 'encrypted_portfolio') {
            score *= 1.3;
        }
        
        // Boost for entertainment content
        if (result.data?.metadata?.entertainment > 5) {
            score *= 1.2;
        }
        
        // Boost for recent content
        if (result.data?.lastLoaded && Date.now() - result.data.lastLoaded < 86400000) {
            score *= 1.1;
        }
        
        return score;
    }
    
    getRepositoryData(type, key) {
        switch (type) {
            case 'encrypted_portfolio':
                return this.knowledgeRepositories.encrypted_portfolios.get(key);
            case 'ascii_sol':
                return this.knowledgeRepositories.ascii_sol_files.get(key);
            case 'local_document':
                return this.knowledgeRepositories.local_documents.get(key);
            case 'user_profile':
                return this.knowledgeRepositories.user_profiles.get(key);
            default:
                return null;
        }
    }
    
    contentMatchesQuery(data, query) {
        const queryLower = query.toLowerCase();
        
        if (data.content && typeof data.content === 'string') {
            return data.content.toLowerCase().includes(queryLower);
        }
        
        if (data.portfolio) {
            return JSON.stringify(data.portfolio).toLowerCase().includes(queryLower);
        }
        
        return false;
    }
    
    async searchByAccessLevel(queryString, accessLevel) {
        // Filter content based on user access level
        const results = [];
        
        const accessLevels = {
            'basic': 1,
            'advanced': 2,
            'expert': 3,
            'business': 4
        };
        
        const userLevel = accessLevels[accessLevel] || 1;
        
        // Only return content appropriate for user's level
        for (const [key, repo] of this.knowledgeRepositories.encrypted_portfolios) {
            if (repo.portfolio.accessLevel && accessLevels[repo.portfolio.accessLevel] <= userLevel) {
                if (this.contentMatchesQuery(repo, queryString)) {
                    results.push({
                        type: 'encrypted_portfolio',
                        key,
                        confidence: 0.8,
                        data: repo,
                        matchType: 'access_filtered'
                    });
                }
            }
        }
        
        return results;
    }
    
    hashQuery(queryString, options) {
        const queryData = JSON.stringify({ query: queryString, options });
        return crypto.createHash('sha256').update(queryData).digest('hex');
    }
    
    cacheResult(queryHash, result) {
        if (this.queryCache.size >= this.config.maxCacheSize) {
            // Remove oldest entries
            const entries = Array.from(this.queryCache.entries());
            entries.slice(0, Math.floor(this.config.maxCacheSize * 0.1)).forEach(([hash]) => {
                this.queryCache.delete(hash);
            });
        }
        
        this.queryCache.set(queryHash, {
            ...result,
            cached: true,
            cacheTime: Date.now()
        });
    }
    
    cleanupCache() {
        const now = Date.now();
        
        for (const [hash, entry] of this.queryCache) {
            if (now - entry.cacheTime > this.config.cacheTimeout) {
                this.queryCache.delete(hash);
            }
        }
    }
    
    getCacheMetrics() {
        const hitRate = this.cacheMetrics.totalQueries > 0 
            ? this.cacheMetrics.hits / this.cacheMetrics.totalQueries 
            : 0;
        
        return {
            ...this.cacheMetrics,
            hitRate: hitRate.toFixed(2),
            cacheSize: this.queryCache.size
        };
    }
    
    // Utility methods
    isPortfolioSearchable(portfolio) {
        return portfolio.searchable !== false && !portfolio.encrypted;
    }
    
    detectContentType(filename, content) {
        const ext = path.extname(filename).toLowerCase();
        
        if (['.js', '.ts', '.py', '.java'].includes(ext)) return 'code';
        if (['.md', '.txt', '.doc'].includes(ext)) return 'documentation';
        if (['.json', '.yaml', '.xml'].includes(ext)) return 'configuration';
        
        return 'document';
    }
    
    determineUserAccessLevel(profile) {
        if (profile.company) return 'business';
        if (profile.public_repos > 50) return 'expert';
        if (profile.public_repos > 10) return 'advanced';
        return 'basic';
    }
    
    analyzeUserCapabilities(profile) {
        const capabilities = [];
        
        if (profile.public_repos > 0) capabilities.push('developer');
        if (profile.followers > 10) capabilities.push('influencer');
        if (profile.company) capabilities.push('business_user');
        if (profile.email) capabilities.push('verified_user');
        
        return capabilities;
    }
    
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    logRepositoryStats() {
        console.log('\n📊 Knowledge Repository Statistics:');
        console.log(`  📦 Encrypted Portfolios: ${this.knowledgeRepositories.encrypted_portfolios.size}`);
        console.log(`  📝 ASCII SOL Files: ${this.knowledgeRepositories.ascii_sol_files.size}`);
        console.log(`  📄 Local Documents: ${this.knowledgeRepositories.local_documents.size}`);
        console.log(`  👥 User Profiles: ${this.knowledgeRepositories.user_profiles.size}`);
        console.log(`  💾 Cached Responses: ${this.knowledgeRepositories.cached_responses.size}`);
    }
    
    logIndexStats() {
        console.log('\n🔍 Search Index Statistics:');
        console.log(`  🏷️  Keywords: ${this.searchIndexes.keywords.size}`);
        console.log(`  🧠 Semantic Vectors: ${this.searchIndexes.semanticVectors.size}`);
        console.log(`  #️⃣  Document Hashes: ${this.searchIndexes.documentHashes.size}`);
        console.log(`  👤 User Access Entries: ${this.searchIndexes.userAccess.size}`);
        console.log(`  📁 Content Type Categories: ${this.searchIndexes.contentTypes.size}`);
    }
}

// CLI execution
if (require.main === module) {
    console.log('🧠 RAG KNOWLEDGE QUERY ENGINE');
    console.log('===============================');
    
    const ragEngine = new RAGKnowledgeQueryEngine();
    
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('\n🎭 Demo: RAG knowledge search...\n');
        
        // Demo query
        ragEngine.on('rag:ready', async () => {
            const queries = [
                'user authentication',
                'oauth github',
                'portfolio encryption',
                'entertainment content',
                'underground viral'
            ];
            
            console.log('🔍 Running demo queries...\n');
            
            for (const query of queries) {
                console.log(`Query: "${query}"`);
                const result = await ragEngine.processQuery(query);
                console.log(`  Results: ${result.totalResults}`);
                console.log(`  Search time: ${result.searchTime}ms`);
                console.log(`  Cache hit rate: ${result.cacheMetrics.hitRate}\n`);
            }
            
            console.log('✅ Demo complete!');
        });
        
    } else if (args[0] === 'query' && args[1]) {
        ragEngine.on('rag:ready', async () => {
            const result = await ragEngine.processQuery(args[1]);
            console.log(JSON.stringify(result, null, 2));
        });
        
    } else {
        console.log('\nUsage:');
        console.log('  node rag-knowledge-query-engine.js                    # Demo');
        console.log('  node rag-knowledge-query-engine.js query "search term" # Query');
    }
}

module.exports = RAGKnowledgeQueryEngine;