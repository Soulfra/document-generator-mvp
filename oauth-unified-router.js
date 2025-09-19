#!/usr/bin/env node

/**
 * 🔐 OAUTH UNIFIED ROUTER
 * Reroutes and reskins OAuth logins (GitHub, Replit, etc.) through existing signature authentication
 * Implements RAG-first knowledge queries before external API calls
 * Handles directory federation and deep structure searching
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const https = require('https');
const url = require('url');

class OAuthUnifiedRouter extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            routerPort: 8888,
            signatureAuthEndpoint: 'http://localhost:8080/signature-auth',
            knowledgeBaseEndpoint: 'http://localhost:8081/knowledge',
            directoryFederationRoot: process.env.DIRECTORY_FEDERATION_ROOT || './',
            
            // OAuth provider configurations
            providers: {
                github: {
                    clientId: process.env.GITHUB_CLIENT_ID,
                    clientSecret: process.env.GITHUB_CLIENT_SECRET,
                    authUrl: 'https://github.com/login/oauth/authorize',
                    tokenUrl: 'https://github.com/login/oauth/access_token',
                    apiUrl: 'https://api.github.com',
                    scopes: ['user:email', 'repo', 'gist']
                },
                replit: {
                    clientId: process.env.REPLIT_CLIENT_ID,
                    clientSecret: process.env.REPLIT_CLIENT_SECRET,
                    authUrl: 'https://replit.com/oauth/authorize',
                    tokenUrl: 'https://replit.com/oauth/token',
                    apiUrl: 'https://api.replit.com',
                    scopes: ['user:read', 'user:email']
                },
                discord: {
                    clientId: process.env.DISCORD_CLIENT_ID,
                    clientSecret: process.env.DISCORD_CLIENT_SECRET,
                    authUrl: 'https://discord.com/api/oauth2/authorize',
                    tokenUrl: 'https://discord.com/api/oauth2/token',
                    apiUrl: 'https://discord.com/api',
                    scopes: ['identify', 'email']
                },
                google: {
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
                    tokenUrl: 'https://oauth2.googleapis.com/token',
                    apiUrl: 'https://www.googleapis.com/oauth2/v2',
                    scopes: ['openid', 'email', 'profile']
                }
            }
        };
        
        // Internal state
        this.authSessions = new Map();
        this.knowledgeCache = new Map();
        this.directoryIndex = new Map();
        this.symlinkRegistry = new Map();
        this.ragSearchEngine = null;
        
        // Integration with existing systems
        this.signatureAuth = null;
        this.knowledgeBase = null;
        this.portfolioEncryption = null;
        this.asciiSOLStorage = null;
        this.htmlCompaction = null;
        
        console.log('🔐 OAuth Unified Router initialized');
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Starting OAuth Unified Router...');
        
        // Initialize directory federation
        await this.initializeDirectoryFederation();
        
        // Initialize RAG search engine
        await this.initializeRAGSearchEngine();
        
        // Load existing integrations
        await this.loadExistingIntegrations();
        
        // Start HTTP server
        await this.startRouterServer();
        
        console.log('✅ OAuth Unified Router ready');
        this.emit('router:ready');
    }
    
    async initializeDirectoryFederation() {
        console.log('📁 Initializing directory federation...');
        
        try {
            // Map all directories and symlinks
            await this.buildDirectoryIndex(this.config.directoryFederationRoot);
            
            // Discover and register symlinks
            await this.discoverSymlinks();
            
            // Build federated search index
            await this.buildFederatedSearchIndex();
            
            console.log(`📊 Directory federation ready: ${this.directoryIndex.size} directories, ${this.symlinkRegistry.size} symlinks`);
        } catch (error) {
            console.error('❌ Directory federation initialization failed:', error);
        }
    }
    
    async buildDirectoryIndex(rootPath, depth = 0, maxDepth = 10) {
        if (depth > maxDepth) return;
        
        try {
            const entries = await fs.readdir(rootPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(rootPath, entry.name);
                const relativePath = path.relative(this.config.directoryFederationRoot, fullPath);
                
                if (entry.isDirectory()) {
                    this.directoryIndex.set(relativePath, {
                        path: fullPath,
                        name: entry.name,
                        depth,
                        type: 'directory',
                        parent: path.dirname(relativePath),
                        children: [],
                        lastScanned: new Date().toISOString()
                    });
                    
                    // Recurse into subdirectories
                    await this.buildDirectoryIndex(fullPath, depth + 1, maxDepth);
                    
                } else if (entry.isSymbolicLink()) {
                    const linkTarget = await fs.readlink(fullPath);
                    this.symlinkRegistry.set(relativePath, {
                        path: fullPath,
                        name: entry.name,
                        target: linkTarget,
                        resolvedTarget: path.resolve(path.dirname(fullPath), linkTarget),
                        depth,
                        type: 'symlink',
                        isValid: await this.validateSymlink(fullPath, linkTarget)
                    });
                    
                } else {
                    // Regular file
                    this.directoryIndex.set(relativePath, {
                        path: fullPath,
                        name: entry.name,
                        depth,
                        type: 'file',
                        extension: path.extname(entry.name),
                        parent: path.dirname(relativePath)
                    });
                }
            }
        } catch (error) {
            console.warn(`⚠️  Skipped directory ${rootPath}:`, error.message);
        }
    }
    
    async validateSymlink(linkPath, target) {
        try {
            const resolvedTarget = path.resolve(path.dirname(linkPath), target);
            await fs.access(resolvedTarget);
            return true;
        } catch {
            return false;
        }
    }
    
    async discoverSymlinks() {
        console.log('🔗 Discovering symlinks...');
        
        const validSymlinks = Array.from(this.symlinkRegistry.values())
            .filter(link => link.isValid);
        
        // Build symlink dependency graph
        const symlinkGraph = new Map();
        
        for (const link of validSymlinks) {
            const targetRelative = path.relative(this.config.directoryFederationRoot, link.resolvedTarget);
            
            if (!symlinkGraph.has(targetRelative)) {
                symlinkGraph.set(targetRelative, []);
            }
            
            symlinkGraph.get(targetRelative).push(link.path);
        }
        
        console.log(`🔗 Symlink graph built: ${symlinkGraph.size} targets, ${validSymlinks.length} valid links`);
        return symlinkGraph;
    }
    
    async buildFederatedSearchIndex() {
        console.log('🔍 Building federated search index...');
        
        const searchIndex = {
            files: new Map(),
            directories: new Map(),
            symlinks: new Map(),
            keywords: new Map(),
            pathDepth: new Map()
        };
        
        // Index all entries
        for (const [relativePath, entry] of this.directoryIndex) {
            // Index by type
            if (entry.type === 'file') {
                searchIndex.files.set(entry.name.toLowerCase(), relativePath);
                
                // Index keywords from filename
                const keywords = this.extractKeywordsFromPath(entry.name);
                keywords.forEach(keyword => {
                    if (!searchIndex.keywords.has(keyword)) {
                        searchIndex.keywords.set(keyword, []);
                    }
                    searchIndex.keywords.get(keyword).push(relativePath);
                });
                
            } else if (entry.type === 'directory') {
                searchIndex.directories.set(entry.name.toLowerCase(), relativePath);
            }
            
            // Index by depth
            if (!searchIndex.pathDepth.has(entry.depth)) {
                searchIndex.pathDepth.set(entry.depth, []);
            }
            searchIndex.pathDepth.get(entry.depth).push(relativePath);
        }
        
        // Index symlinks
        for (const [relativePath, link] of this.symlinkRegistry) {
            searchIndex.symlinks.set(link.name.toLowerCase(), relativePath);
        }
        
        this.federatedSearchIndex = searchIndex;
        console.log(`🔍 Search index ready: ${searchIndex.files.size} files, ${searchIndex.directories.size} dirs`);
    }
    
    extractKeywordsFromPath(pathStr) {
        return pathStr
            .toLowerCase()
            .replace(/[^\w\s-]/g, ' ')
            .split(/[\s-_\.]+/)
            .filter(word => word.length > 2);
    }
    
    async initializeRAGSearchEngine() {
        console.log('🧠 Initializing RAG search engine...');
        
        this.ragSearchEngine = {
            // Knowledge base cache
            knowledgeCache: new Map(),
            
            // Search strategies
            strategies: {
                exact_match: this.exactMatchSearch.bind(this),
                fuzzy_search: this.fuzzySearch.bind(this),
                semantic_search: this.semanticSearch.bind(this),
                directory_search: this.directorySearch.bind(this),
                symlink_resolution: this.symlinkResolution.bind(this)
            },
            
            // Search priority
            searchOrder: ['exact_match', 'directory_search', 'symlink_resolution', 'fuzzy_search', 'semantic_search']
        };
        
        console.log('🧠 RAG search engine ready');
    }
    
    async loadExistingIntegrations() {
        console.log('🔌 Loading existing integrations...');
        
        try {
            // Load GitHub OAuth manager if available
            if (await this.fileExists('./WORKING-MINIMAL-SYSTEM/github-oauth-manager.js')) {
                const GitHubOAuthManager = require('./WORKING-MINIMAL-SYSTEM/github-oauth-manager.js');
                this.signatureAuth = new GitHubOAuthManager();
                console.log('✅ GitHub OAuth manager loaded');
            }
            
            // Load portfolio encryption if available
            if (await this.fileExists('./portfolio-encryption-tokenization-system.js')) {
                const PortfolioEncryption = require('./portfolio-encryption-tokenization-system.js');
                this.portfolioEncryption = new PortfolioEncryption();
                console.log('✅ Portfolio encryption loaded');
            }
            
            // Load ASCII SOL storage if available
            if (await this.fileExists('./ascii-sol-file-storage-system.js')) {
                const ASCIISOLStorage = require('./ascii-sol-file-storage-system.js');
                this.asciiSOLStorage = new ASCIISOLStorage();
                console.log('✅ ASCII SOL storage loaded');
            }
            
            // Load HTML compaction if available
            if (await this.fileExists('./html-token-compaction-engine.js')) {
                const HTMLCompaction = require('./html-token-compaction-engine.js');
                this.htmlCompaction = new HTMLCompaction();
                console.log('✅ HTML compaction loaded');
            }
            
        } catch (error) {
            console.warn('⚠️  Some integrations not available:', error.message);
        }
    }
    
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    async startRouterServer() {
        return new Promise((resolve, reject) => {
            this.server = http.createServer((req, res) => {
                this.handleRequest(req, res);
            });
            
            this.server.listen(this.config.routerPort, (err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log(`🌐 OAuth Unified Router listening on port ${this.config.routerPort}`);
                    resolve();
                }
            });
        });
    }
    
    async handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        const query = parsedUrl.query;
        
        try {
            // Route OAuth requests
            if (pathname.startsWith('/oauth/')) {
                await this.handleOAuthRequest(req, res, pathname, query);
                
            // Route knowledge queries
            } else if (pathname.startsWith('/knowledge/')) {
                await this.handleKnowledgeQuery(req, res, pathname, query);
                
            // Route directory federation
            } else if (pathname.startsWith('/directory/')) {
                await this.handleDirectoryQuery(req, res, pathname, query);
                
            // Route signature authentication
            } else if (pathname.startsWith('/signature-auth/')) {
                await this.handleSignatureAuth(req, res, pathname, query);
                
            // Route RAG search
            } else if (pathname.startsWith('/rag-search/')) {
                await this.handleRAGSearch(req, res, pathname, query);
                
            // Dashboard
            } else if (pathname === '/dashboard') {
                await this.serveDashboard(req, res);
                
            // Health check
            } else if (pathname === '/health') {
                this.sendJSON(res, { status: 'healthy', timestamp: new Date().toISOString() });
                
            } else {
                this.sendError(res, 404, 'Not Found');
            }
            
        } catch (error) {
            console.error('❌ Request handling error:', error);
            this.sendError(res, 500, 'Internal Server Error');
        }
    }
    
    async handleOAuthRequest(req, res, pathname, query) {
        const pathParts = pathname.split('/');
        const provider = pathParts[2]; // /oauth/{provider}/...
        const action = pathParts[3]; // auth, callback, etc.
        
        if (!this.config.providers[provider]) {
            return this.sendError(res, 400, `Unsupported OAuth provider: ${provider}`);
        }
        
        switch (action) {
            case 'auth':
                await this.initiateOAuth(req, res, provider, query);
                break;
                
            case 'callback':
                await this.handleOAuthCallback(req, res, provider, query);
                break;
                
            case 'refresh':
                await this.refreshOAuthToken(req, res, provider, query);
                break;
                
            default:
                this.sendError(res, 400, `Unknown OAuth action: ${action}`);
        }
    }
    
    async initiateOAuth(req, res, provider, query) {
        console.log(`🔐 Initiating OAuth for ${provider}...`);
        
        // Generate state for security
        const state = crypto.randomBytes(32).toString('hex');
        const sessionId = crypto.randomBytes(16).toString('hex');
        
        // Store session with RAG query context
        this.authSessions.set(state, {
            sessionId,
            provider,
            timestamp: Date.now(),
            originalQuery: query.q, // RAG query that triggered this auth
            userAgent: req.headers['user-agent'],
            redirectAfterAuth: query.redirect_url
        });
        
        // Build OAuth URL
        const providerConfig = this.config.providers[provider];
        const oauthParams = new URLSearchParams({
            client_id: providerConfig.clientId,
            redirect_uri: `http://localhost:${this.config.routerPort}/oauth/${provider}/callback`,
            scope: providerConfig.scopes.join(' '),
            state: state,
            response_type: 'code'
        });
        
        const authUrl = `${providerConfig.authUrl}?${oauthParams.toString()}`;
        
        // Redirect to OAuth provider
        res.writeHead(302, { 'Location': authUrl });
        res.end();
        
        console.log(`✅ OAuth initiated for ${provider}, state: ${state}`);
    }
    
    async handleOAuthCallback(req, res, provider, query) {
        console.log(`🔄 Handling OAuth callback for ${provider}...`);
        
        const { code, state, error } = query;
        
        if (error) {
            return this.sendError(res, 400, `OAuth error: ${error}`);
        }
        
        // Validate state
        const session = this.authSessions.get(state);
        if (!session) {
            return this.sendError(res, 400, 'Invalid or expired state');
        }
        
        try {
            // Exchange code for token
            const tokenData = await this.exchangeCodeForToken(provider, code);
            
            // Get user profile
            const userProfile = await this.getUserProfile(provider, tokenData.access_token);
            
            // Integrate with signature authentication
            const signatureAuthResult = await this.integrateWithSignatureAuth(userProfile, tokenData, session);
            
            // Store in knowledge base for future RAG queries
            await this.storeUserInKnowledgeBase(userProfile, tokenData, provider);
            
            // Clean up session
            this.authSessions.delete(state);
            
            // Return success with integrated authentication
            this.sendJSON(res, {
                success: true,
                provider,
                user: userProfile,
                signatureAuth: signatureAuthResult,
                sessionId: session.sessionId,
                redirectUrl: session.redirectAfterAuth || '/dashboard'
            });
            
            console.log(`✅ OAuth completed for ${provider}: ${userProfile.login || userProfile.username || userProfile.email}`);
            
        } catch (error) {
            console.error(`❌ OAuth callback failed for ${provider}:`, error);
            this.sendError(res, 500, `Authentication failed: ${error.message}`);
        }
    }
    
    async exchangeCodeForToken(provider, code) {
        const providerConfig = this.config.providers[provider];
        
        const tokenParams = new URLSearchParams({
            client_id: providerConfig.clientId,
            client_secret: providerConfig.clientSecret,
            code: code,
            redirect_uri: `http://localhost:${this.config.routerPort}/oauth/${provider}/callback`
        });
        
        if (provider === 'google') {
            tokenParams.append('grant_type', 'authorization_code');
        }
        
        return new Promise((resolve, reject) => {
            const postData = tokenParams.toString();
            const urlObj = new URL(providerConfig.tokenUrl);
            
            const options = {
                hostname: urlObj.hostname,
                path: urlObj.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Content-Length': Buffer.byteLength(postData),
                    'Accept': 'application/json',
                    'User-Agent': 'OAuth-Unified-Router/1.0'
                }
            };
            
            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        if (response.error) {
                            reject(new Error(response.error_description || response.error));
                        } else {
                            resolve(response);
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }
    
    async getUserProfile(provider, accessToken) {
        const providerConfig = this.config.providers[provider];
        let profileEndpoint = '/user';
        
        if (provider === 'discord') profileEndpoint = '/users/@me';
        if (provider === 'google') profileEndpoint = '/userinfo';
        if (provider === 'replit') profileEndpoint = '/user';
        
        return new Promise((resolve, reject) => {
            const options = {
                hostname: new URL(providerConfig.apiUrl).hostname,
                path: profileEndpoint,
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json',
                    'User-Agent': 'OAuth-Unified-Router/1.0'
                }
            };
            
            https.get(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const profile = JSON.parse(body);
                        if (profile.message) {
                            reject(new Error(profile.message));
                        } else {
                            resolve(profile);
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            }).on('error', reject);
        });
    }
    
    async integrateWithSignatureAuth(userProfile, tokenData, session) {
        console.log('🖋️  Integrating with signature authentication...');
        
        try {
            // Generate signature-based authentication for this user
            const signatureData = {
                userId: `oauth_${userProfile.id || userProfile.sub}`,
                username: userProfile.login || userProfile.username || userProfile.name,
                email: userProfile.email,
                provider: session.provider,
                signatureHash: this.generateSignatureHash(userProfile),
                timestamp: Date.now()
            };
            
            // Store in signature auth system
            if (this.signatureAuth) {
                // Use existing signature auth
                await this.signatureAuth.storeUserSignature(signatureData);
            } else {
                // Store locally
                await this.storeSignatureLocally(signatureData);
            }
            
            console.log(`✅ Signature authentication integrated for ${signatureData.username}`);
            return signatureData;
            
        } catch (error) {
            console.error('❌ Signature authentication integration failed:', error);
            throw error;
        }
    }
    
    generateSignatureHash(userProfile) {
        const signatureString = `${userProfile.login || userProfile.username}_${userProfile.id || userProfile.sub}_${userProfile.email}`;
        return crypto.createHash('sha256').update(signatureString).digest('hex');
    }
    
    async storeSignatureLocally(signatureData) {
        const signaturePath = path.join(this.config.directoryFederationRoot, '.oauth-signatures', `${signatureData.userId}.json`);
        
        await fs.mkdir(path.dirname(signaturePath), { recursive: true });
        await fs.writeFile(signaturePath, JSON.stringify(signatureData, null, 2));
    }
    
    async storeUserInKnowledgeBase(userProfile, tokenData, provider) {
        console.log('🧠 Storing user in knowledge base...');
        
        const knowledgeEntry = {
            type: 'user_profile',
            provider,
            userId: userProfile.id || userProfile.sub,
            username: userProfile.login || userProfile.username,
            email: userProfile.email,
            profileData: userProfile,
            accessCapabilities: this.analyzeUserCapabilities(userProfile, provider),
            knowledgeAccessLevel: this.determineKnowledgeAccessLevel(userProfile),
            indexed: Date.now()
        };
        
        this.knowledgeCache.set(`user_${provider}_${userProfile.id || userProfile.sub}`, knowledgeEntry);
        
        // Store in encrypted portfolio if available
        if (this.portfolioEncryption) {
            await this.portfolioEncryption.encryptUserData(knowledgeEntry);
        }
        
        // Store in ASCII SOL format if available
        if (this.asciiSOLStorage) {
            const tempPath = `/tmp/user_${provider}_${userProfile.id}.json`;
            await fs.writeFile(tempPath, JSON.stringify(knowledgeEntry, null, 2));
            await this.asciiSOLStorage.storeFileWithSOLHeader(tempPath, {
                type: 'user_profile',
                provider,
                entertainmentRating: 5,
                gutterLevel: 'authenticated',
                allowCommunityEdit: false
            });
            await fs.unlink(tempPath);
        }
        
        console.log(`✅ User stored in knowledge base: ${knowledgeEntry.username}`);
    }
    
    analyzeUserCapabilities(userProfile, provider) {
        const capabilities = [];
        
        // Base capabilities by provider
        switch (provider) {
            case 'github':
                capabilities.push('code_access', 'repository_management', 'gist_creation');
                if (userProfile.public_repos > 10) capabilities.push('experienced_developer');
                break;
                
            case 'replit':
                capabilities.push('online_coding', 'collaboration');
                break;
                
            case 'discord':
                capabilities.push('community_access', 'real_time_chat');
                break;
                
            case 'google':
                capabilities.push('document_access', 'email_integration');
                break;
        }
        
        // Additional capabilities based on profile
        if (userProfile.email) capabilities.push('email_verified');
        if (userProfile.avatar_url) capabilities.push('has_avatar');
        if (userProfile.company) capabilities.push('business_user');
        
        return capabilities;
    }
    
    determineKnowledgeAccessLevel(userProfile) {
        // Determine what level of knowledge base access this user should have
        let level = 'basic';
        
        if (userProfile.public_repos > 50) level = 'advanced';
        if (userProfile.followers > 100) level = 'expert';
        if (userProfile.company) level = 'business';
        
        return level;
    }
    
    async handleKnowledgeQuery(req, res, pathname, query) {
        console.log(`🧠 Handling knowledge query: ${query.q}`);
        
        try {
            // Step 1: Search local knowledge base first (RAG-first approach)
            const localResults = await this.searchLocalKnowledge(query.q, query);
            
            if (localResults.confidence > 0.7) {
                console.log('✅ High confidence local result found');
                return this.sendJSON(res, {
                    source: 'local_knowledge',
                    confidence: localResults.confidence,
                    results: localResults.data,
                    searchTime: localResults.searchTime
                });
            }
            
            // Step 2: Search directory federation
            const directoryResults = await this.searchDirectoryFederation(query.q, query);
            
            if (directoryResults.found) {
                console.log('✅ Directory federation result found');
                return this.sendJSON(res, {
                    source: 'directory_federation',
                    results: directoryResults.data,
                    searchTime: directoryResults.searchTime
                });
            }
            
            // Step 3: If still no good results, use external APIs (with authentication)
            const externalResults = await this.searchExternalAPIs(query.q, query, req);
            
            this.sendJSON(res, {
                source: 'external_apis',
                results: externalResults.data,
                searchTime: externalResults.searchTime
            });
            
        } catch (error) {
            console.error('❌ Knowledge query failed:', error);
            this.sendError(res, 500, `Knowledge query failed: ${error.message}`);
        }
    }
    
    async searchLocalKnowledge(queryString, options = {}) {
        const startTime = Date.now();
        console.log(`  🔍 Searching local knowledge: "${queryString}"`);
        
        const results = [];
        let totalScore = 0;
        
        // Search cached knowledge
        for (const [key, entry] of this.knowledgeCache) {
            const score = this.calculateRelevanceScore(queryString, entry);
            if (score > 0.3) {
                results.push({
                    key,
                    score,
                    data: entry,
                    type: 'knowledge_entry'
                });
                totalScore += score;
            }
        }
        
        // Search encrypted portfolios if available
        if (this.portfolioEncryption) {
            const portfolioResults = await this.portfolioEncryption.searchEncryptedContent(queryString);
            results.push(...portfolioResults.map(r => ({ ...r, type: 'encrypted_portfolio' })));
        }
        
        // Sort by relevance
        results.sort((a, b) => b.score - a.score);
        
        const searchTime = Date.now() - startTime;
        const confidence = results.length > 0 ? Math.min(totalScore / results.length, 1.0) : 0;
        
        console.log(`  ✅ Local search complete: ${results.length} results, confidence: ${confidence.toFixed(2)}`);
        
        return {
            confidence,
            data: results.slice(0, 10), // Top 10 results
            searchTime,
            totalResults: results.length
        };
    }
    
    calculateRelevanceScore(query, entry) {
        const queryLower = query.toLowerCase();
        let score = 0;
        
        // Check different fields based on entry type
        if (entry.type === 'user_profile') {
            if (entry.username && entry.username.toLowerCase().includes(queryLower)) score += 0.8;
            if (entry.email && entry.email.toLowerCase().includes(queryLower)) score += 0.6;
            if (entry.profileData && JSON.stringify(entry.profileData).toLowerCase().includes(queryLower)) score += 0.4;
        }
        
        // Generic scoring
        const entryText = JSON.stringify(entry).toLowerCase();
        const queryWords = queryLower.split(/\s+/);
        
        queryWords.forEach(word => {
            if (entryText.includes(word)) {
                score += 0.2;
            }
        });
        
        return Math.min(score, 1.0);
    }
    
    async searchDirectoryFederation(queryString, options = {}) {
        const startTime = Date.now();
        console.log(`  📁 Searching directory federation: "${queryString}"`);
        
        const results = [];
        
        // Use RAG search engine strategies
        for (const strategyName of this.ragSearchEngine.searchOrder) {
            const strategy = this.ragSearchEngine.strategies[strategyName];
            const strategyResults = await strategy(queryString, options);
            
            if (strategyResults.length > 0) {
                results.push(...strategyResults.map(r => ({ ...r, strategy: strategyName })));
                
                // If exact match or high confidence, stop searching
                if (strategyName === 'exact_match' || strategyResults.some(r => r.confidence > 0.8)) {
                    break;
                }
            }
        }
        
        const searchTime = Date.now() - startTime;
        
        console.log(`  ✅ Directory search complete: ${results.length} results`);
        
        return {
            found: results.length > 0,
            data: results.slice(0, 10),
            searchTime,
            totalResults: results.length
        };
    }
    
    async exactMatchSearch(queryString, options) {
        const results = [];
        const queryLower = queryString.toLowerCase();
        
        // Search files by exact name
        if (this.federatedSearchIndex.files.has(queryLower)) {
            const filePath = this.federatedSearchIndex.files.get(queryLower);
            const entry = this.directoryIndex.get(filePath);
            results.push({
                type: 'exact_file_match',
                confidence: 1.0,
                path: entry.path,
                relativePath: filePath,
                data: entry
            });
        }
        
        // Search directories by exact name
        if (this.federatedSearchIndex.directories.has(queryLower)) {
            const dirPath = this.federatedSearchIndex.directories.get(queryLower);
            const entry = this.directoryIndex.get(dirPath);
            results.push({
                type: 'exact_directory_match',
                confidence: 1.0,
                path: entry.path,
                relativePath: dirPath,
                data: entry
            });
        }
        
        return results;
    }
    
    async fuzzySearch(queryString, options) {
        const results = [];
        const queryLower = queryString.toLowerCase();
        const queryWords = queryLower.split(/\s+/);
        
        // Search keywords
        for (const [keyword, paths] of this.federatedSearchIndex.keywords) {
            let score = 0;
            
            queryWords.forEach(word => {
                if (keyword.includes(word) || word.includes(keyword)) {
                    score += 0.5;
                }
                
                // Levenshtein distance for fuzzy matching
                if (this.levenshteinDistance(word, keyword) <= 2) {
                    score += 0.3;
                }
            });
            
            if (score > 0) {
                paths.forEach(path => {
                    const entry = this.directoryIndex.get(path);
                    results.push({
                        type: 'fuzzy_keyword_match',
                        confidence: Math.min(score, 1.0),
                        keyword,
                        path: entry.path,
                        relativePath: path,
                        data: entry
                    });
                });
            }
        }
        
        return results.sort((a, b) => b.confidence - a.confidence);
    }
    
    async semanticSearch(queryString, options) {
        // Simplified semantic search - can be enhanced with ML models
        const results = [];
        const synonyms = this.generateSynonyms(queryString);
        
        for (const synonym of synonyms) {
            const fuzzyResults = await this.fuzzySearch(synonym, options);
            results.push(...fuzzyResults.map(r => ({ ...r, type: 'semantic_match', originalQuery: queryString })));
        }
        
        return results;
    }
    
    async directorySearch(queryString, options) {
        const results = [];
        const queryParts = queryString.split('/').filter(p => p);
        
        // Search for path patterns
        for (const [relativePath, entry] of this.directoryIndex) {
            const pathParts = relativePath.split('/').filter(p => p);
            
            let matchScore = 0;
            queryParts.forEach(queryPart => {
                pathParts.forEach(pathPart => {
                    if (pathPart.toLowerCase().includes(queryPart.toLowerCase())) {
                        matchScore += 1;
                    }
                });
            });
            
            if (matchScore > 0) {
                results.push({
                    type: 'directory_path_match',
                    confidence: Math.min(matchScore / queryParts.length, 1.0),
                    path: entry.path,
                    relativePath,
                    data: entry
                });
            }
        }
        
        return results.sort((a, b) => b.confidence - a.confidence);
    }
    
    async symlinkResolution(queryString, options) {
        const results = [];
        
        // Search through symlinks
        for (const [relativePath, link] of this.symlinkRegistry) {
            if (link.isValid && link.name.toLowerCase().includes(queryString.toLowerCase())) {
                results.push({
                    type: 'symlink_match',
                    confidence: 0.8,
                    path: link.path,
                    target: link.resolvedTarget,
                    relativePath,
                    data: link
                });
            }
        }
        
        return results;
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
    
    generateSynonyms(queryString) {
        // Simple synonym generation - can be enhanced with NLP libraries
        const synonymMap = {
            'file': ['document', 'data', 'content'],
            'directory': ['folder', 'dir', 'path'],
            'user': ['person', 'account', 'profile'],
            'search': ['find', 'locate', 'query'],
            'auth': ['authentication', 'login', 'signin'],
            'config': ['configuration', 'settings', 'setup']
        };
        
        const synonyms = [queryString];
        const words = queryString.toLowerCase().split(/\s+/);
        
        words.forEach(word => {
            if (synonymMap[word]) {
                synonymMap[word].forEach(synonym => {
                    synonyms.push(queryString.replace(word, synonym));
                });
            }
        });
        
        return synonyms;
    }
    
    async searchExternalAPIs(queryString, options, req) {
        console.log(`  🌐 Searching external APIs: "${queryString}"`);
        
        // Placeholder for external API integration
        // This would integrate with GitHub API, Google Search, etc.
        
        return {
            data: [{
                type: 'external_fallback',
                message: 'External API search not yet implemented',
                query: queryString
            }],
            searchTime: 0
        };
    }
    
    async handleDirectoryQuery(req, res, pathname, query) {
        const pathParts = pathname.split('/').slice(2); // Remove /directory/
        const action = pathParts[0];
        
        switch (action) {
            case 'list':
                await this.listDirectoryContents(req, res, query);
                break;
                
            case 'search':
                await this.searchDirectoryStructure(req, res, query);
                break;
                
            case 'symlinks':
                await this.listSymlinks(req, res, query);
                break;
                
            case 'index':
                await this.getDirectoryIndex(req, res, query);
                break;
                
            default:
                this.sendError(res, 400, `Unknown directory action: ${action}`);
        }
    }
    
    async listDirectoryContents(req, res, query) {
        const targetPath = query.path || '.';
        const maxDepth = parseInt(query.depth) || 3;
        
        const contents = Array.from(this.directoryIndex.entries())
            .filter(([relativePath, entry]) => {
                return relativePath.startsWith(targetPath) && entry.depth <= maxDepth;
            })
            .map(([relativePath, entry]) => ({
                relativePath,
                ...entry
            }));
        
        this.sendJSON(res, {
            path: targetPath,
            maxDepth,
            contents,
            totalItems: contents.length
        });
    }
    
    async searchDirectoryStructure(req, res, query) {
        const searchQuery = query.q;
        if (!searchQuery) {
            return this.sendError(res, 400, 'Query parameter "q" is required');
        }
        
        const results = await this.searchDirectoryFederation(searchQuery, query);
        
        this.sendJSON(res, {
            query: searchQuery,
            ...results
        });
    }
    
    async listSymlinks(req, res, query) {
        const symlinks = Array.from(this.symlinkRegistry.entries())
            .map(([relativePath, link]) => ({
                relativePath,
                ...link
            }));
        
        const validSymlinks = symlinks.filter(link => link.isValid);
        const brokenSymlinks = symlinks.filter(link => !link.isValid);
        
        this.sendJSON(res, {
            total: symlinks.length,
            valid: validSymlinks.length,
            broken: brokenSymlinks.length,
            symlinks: query.include_broken === 'true' ? symlinks : validSymlinks
        });
    }
    
    async getDirectoryIndex(req, res, query) {
        const summary = {
            totalDirectories: Array.from(this.directoryIndex.values()).filter(e => e.type === 'directory').length,
            totalFiles: Array.from(this.directoryIndex.values()).filter(e => e.type === 'file').length,
            totalSymlinks: this.symlinkRegistry.size,
            maxDepth: Math.max(...Array.from(this.directoryIndex.values()).map(e => e.depth)),
            lastScanned: new Date().toISOString()
        };
        
        this.sendJSON(res, {
            summary,
            directoryIndex: query.full === 'true' ? Object.fromEntries(this.directoryIndex) : summary
        });
    }
    
    async handleSignatureAuth(req, res, pathname, query) {
        // Placeholder for signature authentication integration
        this.sendJSON(res, {
            message: 'Signature authentication integration',
            status: 'available',
            endpoint: this.config.signatureAuthEndpoint
        });
    }
    
    async handleRAGSearch(req, res, pathname, query) {
        const searchQuery = query.q;
        if (!searchQuery) {
            return this.sendError(res, 400, 'Query parameter "q" is required');
        }
        
        console.log(`🧠 RAG search: "${searchQuery}"`);
        
        // Comprehensive search across all sources
        const [localResults, directoryResults] = await Promise.all([
            this.searchLocalKnowledge(searchQuery, query),
            this.searchDirectoryFederation(searchQuery, query)
        ]);
        
        // Combine and rank results
        const combinedResults = [
            ...localResults.data.map(r => ({ ...r, source: 'local_knowledge' })),
            ...directoryResults.data.map(r => ({ ...r, source: 'directory_federation' }))
        ];
        
        // Sort by confidence
        combinedResults.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
        
        this.sendJSON(res, {
            query: searchQuery,
            totalResults: combinedResults.length,
            results: combinedResults.slice(0, 20), // Top 20 results
            sources: {
                localKnowledge: localResults.data.length,
                directoryFederation: directoryResults.data.length
            },
            searchTime: Math.max(localResults.searchTime, directoryResults.searchTime)
        });
    }
    
    async serveDashboard(req, res) {
        const dashboardHTML = `<!DOCTYPE html>
<html>
<head>
    <title>OAuth Unified Router Dashboard</title>
    <style>
        body { 
            font-family: 'Monaco', 'Menlo', monospace; 
            background: #0d1117; 
            color: #f0f6fc; 
            margin: 0; 
            padding: 20px; 
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { 
            background: #161b22; 
            border: 1px solid #30363d; 
            border-radius: 8px; 
            padding: 20px; 
        }
        .card h3 { margin-top: 0; color: #58a6ff; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status.ready { background: #238636; color: white; }
        .status.loading { background: #ffa657; color: black; }
        .metric { display: flex; justify-content: space-between; margin: 10px 0; }
        .button { 
            background: #238636; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 4px; 
            cursor: pointer; 
            text-decoration: none; 
            display: inline-block; 
        }
        .button:hover { background: #2ea043; }
        .search-box { 
            width: 100%; 
            padding: 10px; 
            background: #0d1117; 
            border: 1px solid #30363d; 
            color: #f0f6fc; 
            border-radius: 4px; 
        }
        .result { 
            background: #21262d; 
            padding: 10px; 
            margin: 10px 0; 
            border-radius: 4px; 
            border-left: 3px solid #58a6ff; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 OAuth Unified Router</h1>
            <p>Unified Authentication & Knowledge Routing System</p>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>🔐 OAuth Providers</h3>
                <div class="metric">
                    <span>GitHub:</span>
                    <span class="status ready">READY</span>
                </div>
                <div class="metric">
                    <span>Replit:</span>
                    <span class="status ready">READY</span>
                </div>
                <div class="metric">
                    <span>Discord:</span>
                    <span class="status ready">READY</span>
                </div>
                <div class="metric">
                    <span>Google:</span>
                    <span class="status ready">READY</span>
                </div>
                <a href="/oauth/github/auth" class="button">Test GitHub OAuth</a>
            </div>
            
            <div class="card">
                <h3>🧠 Knowledge Base</h3>
                <div class="metric">
                    <span>Cached Entries:</span>
                    <span>${this.knowledgeCache.size}</span>
                </div>
                <div class="metric">
                    <span>Directory Index:</span>
                    <span>${this.directoryIndex.size}</span>
                </div>
                <div class="metric">
                    <span>Symlinks:</span>
                    <span>${this.symlinkRegistry.size}</span>
                </div>
                <input type="text" class="search-box" placeholder="Search knowledge base..." onkeypress="searchKnowledge(event)">
                <div id="search-results"></div>
            </div>
            
            <div class="card">
                <h3>📁 Directory Federation</h3>
                <div class="metric">
                    <span>Root Path:</span>
                    <span>${this.config.directoryFederationRoot}</span>
                </div>
                <div class="metric">
                    <span>Max Depth Scanned:</span>
                    <span>${Math.max(...Array.from(this.directoryIndex.values()).map(e => e.depth))}</span>
                </div>
                <a href="/directory/index" class="button">View Index</a>
                <a href="/directory/symlinks" class="button">View Symlinks</a>
            </div>
            
            <div class="card">
                <h3>🔧 System Integrations</h3>
                <div class="metric">
                    <span>Signature Auth:</span>
                    <span class="status ${this.signatureAuth ? 'ready' : 'loading'}">${this.signatureAuth ? 'LOADED' : 'NOT LOADED'}</span>
                </div>
                <div class="metric">
                    <span>Portfolio Encryption:</span>
                    <span class="status ${this.portfolioEncryption ? 'ready' : 'loading'}">${this.portfolioEncryption ? 'LOADED' : 'NOT LOADED'}</span>
                </div>
                <div class="metric">
                    <span>ASCII SOL Storage:</span>
                    <span class="status ${this.asciiSOLStorage ? 'ready' : 'loading'}">${this.asciiSOLStorage ? 'LOADED' : 'NOT LOADED'}</span>
                </div>
                <div class="metric">
                    <span>HTML Compaction:</span>
                    <span class="status ${this.htmlCompaction ? 'ready' : 'loading'}">${this.htmlCompaction ? 'LOADED' : 'NOT LOADED'}</span>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        async function searchKnowledge(event) {
            if (event.key === 'Enter') {
                const query = event.target.value;
                const response = await fetch(\`/rag-search/?q=\${encodeURIComponent(query)}\`);
                const results = await response.json();
                
                const resultsDiv = document.getElementById('search-results');
                resultsDiv.innerHTML = '';
                
                results.results.slice(0, 5).forEach(result => {
                    const div = document.createElement('div');
                    div.className = 'result';
                    div.innerHTML = \`
                        <strong>\${result.type}</strong> (confidence: \${(result.confidence || 0).toFixed(2)})
                        <br>Source: \${result.source}
                        \${result.path ? \`<br>Path: \${result.path}\` : ''}
                    \`;
                    resultsDiv.appendChild(div);
                });
            }
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(dashboardHTML);
    }
    
    sendJSON(res, data) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data, null, 2));
    }
    
    sendError(res, statusCode, message) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: message, timestamp: new Date().toISOString() }));
    }
    
    async shutdown() {
        console.log('🛑 Shutting down OAuth Unified Router...');
        
        if (this.server) {
            this.server.close();
        }
        
        console.log('✅ OAuth Unified Router shutdown complete');
    }
}

// CLI execution
if (require.main === module) {
    console.log('🔐 OAUTH UNIFIED ROUTER');
    console.log('========================');
    
    const router = new OAuthUnifiedRouter();
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        await router.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await router.shutdown();
        process.exit(0);
    });
}

module.exports = OAuthUnifiedRouter;