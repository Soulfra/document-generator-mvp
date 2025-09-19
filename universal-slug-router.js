/**
 * Universal Slug Router - Java.com-style subdomain routing with shared tracking
 * Enables: research.docgen.com/abc123, visual.docgen.com/abc123, pos.docgen.com/abc123
 * Maintains character state and session continuity across all subdomains
 */

const express = require('express');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class UniversalSlugRouter extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Router configuration
    this.config = {
      // Domain routing
      domains: {
        research: 'research.docgen.com',
        visual: 'visual.docgen.com',
        gaming: 'game.docgen.com',
        pos: 'pos.docgen.com',
        api: 'api.docgen.com',
        cdn: 'cdn.docgen.com'
      },
      
      // Slug generation
      slugGeneration: {
        length: 32,                    // Length of tracking slug
        encoding: 'base64url',         // Java-compatible encoding
        prefix: 'xd_co_f',            // Java.com style prefix
        separator: '=',                // Parameter separator
        checksumEnabled: true,         // Integrity checking
        expiration: 30 * 24 * 60 * 60 * 1000 // 30 days
      },
      
      // Character encoding (Java compatibility)
      characterEncoding: {
        charset: 'UTF-8',              // Java standard
        normalization: 'NFC',          // Unicode normalization
        maxLength: 4096,               // Java string limits
        escapeHtml: true,              // XSS protection
        validateUnicode: true          // Strict Unicode validation
      },
      
      // Cross-domain tracking
      tracking: {
        cookieDomain: '.docgen.com',   // Shared across subdomains
        sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
        analyticsEnabled: true,
        gdprCompliant: true,
        sameSiteCookies: 'Lax'
      },
      
      // Routing rules
      routing: {
        defaultRedirect: 'research',   // Default subdomain
        preserveQuery: true,           // Keep query parameters
        preserveHash: true,            // Keep hash fragments
        cacheEnabled: true,            // Route caching
        compressionEnabled: true       // Response compression
      }
    };
    
    // State management
    this.state = {
      // Active slugs and their mappings
      slugMap: new Map(),              // slug -> route_data
      domainMap: new Map(),            // domain -> handler
      sessionMap: new Map(),           // session_id -> user_data
      
      // Character state tracking
      characterStates: new Map(),      // character_id -> state_data
      characterSessions: new Map(),    // session_id -> character_ids[]
      
      // Analytics and tracking
      routeAnalytics: new Map(),       // slug -> analytics_data
      performanceMetrics: new Map(),   // route -> performance_data
      
      // Caching
      routeCache: new Map(),           // route_key -> cached_response
      slugCache: new Map()             // slug -> cached_data
    };
    
    // Routing engines
    this.engines = {
      // URL generation and parsing
      urlEngine: this.createURLEngine(),
      
      // Character state management
      characterEngine: this.createCharacterEngine(),
      
      // Analytics and tracking
      analyticsEngine: this.createAnalyticsEngine(),
      
      // QR code integration
      qrEngine: this.createQREngine(),
      
      // POS integration
      posEngine: this.createPOSEngine()
    };
    
    // Express app for routing
    this.app = express();
    this.server = null;
    
    console.log('🔗 Universal Slug Router initializing...');
  }
  
  /**
   * Initialize the router and start handling requests
   */
  async initialize() {
    try {
      console.log('🚀 Starting Universal Slug Router...');
      
      // Setup middleware
      await this.setupMiddleware();
      
      // Configure domain routing
      await this.configureDomainRouting();
      
      // Initialize character engine
      await this.engines.characterEngine.initialize();
      
      // Setup analytics
      await this.engines.analyticsEngine.initialize();
      
      // Start server
      await this.startServer();
      
      // Load existing state
      await this.loadPersistedState();
      
      console.log('✅ Universal Slug Router ready');
      this.emit('router_ready');
      
      return true;
      
    } catch (error) {
      console.error('❌ Router initialization failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Generate universal slug with Java.com-style format
   */
  generateUniversalSlug(context = {}) {
    const slugData = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      context: this.sanitizeContext(context),
      checksum: null,
      
      // Java-compatible metadata
      encoding: this.config.characterEncoding.charset,
      version: '1.0',
      type: context.type || 'universal'
    };
    
    // Generate base slug
    const baseData = JSON.stringify({
      id: slugData.id,
      timestamp: slugData.timestamp,
      context: slugData.context
    });
    
    // Create Java.com-style encoded slug
    const encoded = Buffer.from(baseData, 'utf8').toString('base64url');
    
    // Add checksum for integrity
    slugData.checksum = this.generateChecksum(encoded);
    
    // Format like Java.com: #xd_co_f=base64data~checksum
    const slug = `${this.config.slugGeneration.prefix}${this.config.slugGeneration.separator}${encoded}~${slugData.checksum}`;
    
    // Store slug mapping
    this.state.slugMap.set(slug, slugData);
    
    console.log(`🔗 Generated universal slug: ${slug.substring(0, 50)}...`);
    
    this.emit('slug_generated', { slug, data: slugData });
    
    return slug;
  }
  
  /**
   * Parse universal slug and extract context
   */
  parseUniversalSlug(slug) {
    try {
      // Extract components (format: xd_co_f=data~checksum)
      const parts = slug.split('=');
      if (parts.length !== 2 || parts[0] !== this.config.slugGeneration.prefix) {
        throw new Error('Invalid slug format');
      }
      
      const [encoded, checksum] = parts[1].split('~');
      
      // Verify checksum
      const expectedChecksum = this.generateChecksum(encoded);
      if (checksum !== expectedChecksum) {
        throw new Error('Slug integrity check failed');
      }
      
      // Decode base64url data
      const decoded = Buffer.from(encoded, 'base64url').toString('utf8');
      const baseData = JSON.parse(decoded);
      
      // Get full slug data if cached
      const fullData = this.state.slugMap.get(slug) || {
        ...baseData,
        checksum,
        verified: true
      };
      
      console.log(`🔍 Parsed universal slug: ${fullData.id}`);
      
      return fullData;
      
    } catch (error) {
      console.error('❌ Failed to parse slug:', error.message);
      return null;
    }
  }
  
  /**
   * Route request across subdomains maintaining slug context
   */
  async routeRequest(req, res, targetDomain, options = {}) {
    const startTime = Date.now();
    
    try {
      // Extract slug from request
      const slug = this.extractSlugFromRequest(req);
      const slugData = slug ? this.parseUniversalSlug(slug) : null;
      
      // Determine routing context
      const routingContext = {
        originalDomain: req.get('host'),
        targetDomain: targetDomain,
        slug: slug,
        slugData: slugData,
        preserveQuery: this.config.routing.preserveQuery,
        preserveHash: this.config.routing.preserveHash,
        userId: req.session?.userId,
        characterIds: req.session?.characterIds || [],
        timestamp: Date.now()
      };
      
      // Handle character state migration
      if (slugData && routingContext.characterIds.length > 0) {
        await this.migrateCharacterStates(routingContext.characterIds, targetDomain, slugData);
      }
      
      // Build target URL
      const targetUrl = this.buildTargetURL(req, targetDomain, slug, options);
      
      // Record analytics
      await this.recordRouteAnalytics(routingContext, targetUrl);
      
      // Perform routing
      const routingResult = await this.executeRouting(req, res, targetUrl, routingContext);
      
      const processingTime = Date.now() - startTime;
      
      console.log(`🔄 Routed ${req.get('host')} → ${targetDomain} in ${processingTime}ms`);
      
      this.emit('route_completed', {
        routingContext,
        targetUrl,
        processingTime,
        success: routingResult.success
      });
      
      return routingResult;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ Routing failed after ${processingTime}ms:`, error.message);
      
      this.emit('route_failed', {
        error: error.message,
        processingTime,
        originalDomain: req.get('host'),
        targetDomain
      });
      
      throw error;
    }
  }
  
  /**
   * Setup Express middleware for routing
   */
  async setupMiddleware() {
    // CORS for cross-subdomain requests
    this.app.use((req, res, next) => {
      const origin = req.get('origin');
      const allowedDomains = Object.values(this.config.domains);
      
      if (origin && allowedDomains.some(domain => origin.includes(domain))) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      }
      
      next();
    });
    
    // Session management
    this.app.use((req, res, next) => {
      // Extract or create session
      const sessionId = req.cookies?.sessionId || crypto.randomUUID();
      
      if (!req.cookies?.sessionId) {
        res.cookie('sessionId', sessionId, {
          domain: this.config.tracking.cookieDomain,
          maxAge: this.config.tracking.sessionDuration,
          httpOnly: true,
          secure: true,
          sameSite: this.config.tracking.sameSiteCookies
        });
      }
      
      req.sessionId = sessionId;
      req.session = this.state.sessionMap.get(sessionId) || { userId: null, characterIds: [] };
      
      next();
    });
    
    // Character encoding validation
    this.app.use((req, res, next) => {
      // Validate all text inputs for Java compatibility
      if (req.body) {
        req.body = this.validateAndNormalizeText(req.body);
      }
      
      if (req.query) {
        req.query = this.validateAndNormalizeText(req.query);
      }
      
      next();
    });
    
    // Request logging and analytics
    this.app.use((req, res, next) => {
      const requestData = {
        timestamp: Date.now(),
        method: req.method,
        url: req.url,
        host: req.get('host'),
        userAgent: req.get('user-agent'),
        sessionId: req.sessionId,
        slug: this.extractSlugFromRequest(req)
      };
      
      this.engines.analyticsEngine.recordRequest(requestData);
      
      next();
    });
  }
  
  /**
   * Configure routing for different subdomains
   */
  async configureDomainRouting() {
    // Research subdomain routing
    this.configureResearchRouting();
    
    // Visual subdomain routing
    this.configureVisualRouting();
    
    // Gaming subdomain routing
    this.configureGamingRouting();
    
    // POS subdomain routing
    this.configurePOSRouting();
    
    // API subdomain routing
    this.configureAPIRouting();
    
    // CDN subdomain routing
    this.configureCDNRouting();
  }
  
  /**
   * Configure research.docgen.com routing
   */
  configureResearchRouting() {
    // Handle research document requests
    this.app.get('/research/:slug?', async (req, res) => {
      try {
        const slug = req.params.slug || this.extractSlugFromRequest(req);
        const slugData = slug ? this.parseUniversalSlug(slug) : null;
        
        // Route to deep linking bridge
        const bridgeUrl = `http://localhost:4200/research/${slug || ''}`;
        
        if (slugData?.context?.type === 'research') {
          // Direct research content
          const content = await this.generateResearchPage(slugData, req);
          res.send(content);
        } else {
          // Redirect to research interface
          res.redirect(bridgeUrl);
        }
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Handle bibliography navigation
    this.app.get('/bibliography/:slug', async (req, res) => {
      await this.routeRequest(req, res, this.config.domains.research, {
        level: 0,
        type: 'bibliography'
      });
    });
    
    // Handle document snippets
    this.app.get('/snippet/:slug', async (req, res) => {
      await this.routeRequest(req, res, this.config.domains.research, {
        level: 3,
        type: 'snippet'
      });
    });
  }
  
  /**
   * Configure visual.docgen.com routing
   */
  configureVisualRouting() {
    // Handle visual display requests
    this.app.get('/visual/:slug?', async (req, res) => {
      try {
        const slug = req.params.slug || this.extractSlugFromRequest(req);
        const slugData = slug ? this.parseUniversalSlug(slug) : null;
        
        // Route to visual interface
        if (slugData?.context?.type === 'visual') {
          const content = await this.generateVisualPage(slugData, req);
          res.send(content);
        } else {
          // Redirect to visual interface
          res.redirect(`http://localhost:4200/visual/${slug || ''}`);
        }
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Handle pixel art generation
    this.app.get('/pixel/:slug', async (req, res) => {
      await this.routeRequest(req, res, this.config.domains.visual, {
        type: 'pixel_art',
        format: req.query.format || 'svg'
      });
    });
    
    // Handle scene generation
    this.app.get('/scene/:slug', async (req, res) => {
      await this.routeRequest(req, res, this.config.domains.visual, {
        type: 'scene',
        format: req.query.format || 'html'
      });
    });
  }
  
  /**
   * Configure game.docgen.com routing
   */
  configureGamingRouting() {
    // Handle tycoon game requests
    this.app.get('/tycoon/:slug?', async (req, res) => {
      try {
        const slug = req.params.slug || this.extractSlugFromRequest(req);
        const slugData = slug ? this.parseUniversalSlug(slug) : null;
        
        // Route to tycoon game
        if (slugData?.context?.type === 'tycoon') {
          const content = await this.generateTycoonPage(slugData, req);
          res.send(content);
        } else {
          // Redirect to gaming interface
          res.redirect(`http://localhost:4200/tycoon/${slug || ''}`);
        }
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Handle character interactions
    this.app.get('/character/:slug/:characterId', async (req, res) => {
      await this.engines.characterEngine.handleCharacterRoute(req, res, req.params.slug, req.params.characterId);
    });
  }
  
  /**
   * Configure pos.docgen.com routing
   */
  configurePOSRouting() {
    // Handle QR code purchases
    this.app.get('/qr/:slug', async (req, res) => {
      try {
        const slug = req.params.slug;
        const slugData = this.parseUniversalSlug(slug);
        
        if (slugData) {
          // Generate POS transaction from slug context
          const posTransaction = await this.engines.posEngine.createTransaction(slugData, req);
          res.json(posTransaction);
        } else {
          res.status(400).json({ error: 'Invalid QR code' });
        }
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Handle physical purchases
    this.app.post('/purchase/:slug', async (req, res) => {
      await this.engines.posEngine.processPurchase(req, res, req.params.slug);
    });
  }
  
  /**
   * Configure API subdomain routing
   */
  configureAPIRouting() {
    // Slug generation API
    this.app.post('/api/slug/generate', (req, res) => {
      try {
        const context = req.body.context || {};
        const slug = this.generateUniversalSlug(context);
        
        res.json({
          slug: slug,
          urls: this.generateAllDomainURLs(slug),
          qrCode: this.engines.qrEngine.generateQRCode(slug),
          expiresAt: Date.now() + this.config.slugGeneration.expiration
        });
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Slug parsing API
    this.app.get('/api/slug/parse/:slug', (req, res) => {
      try {
        const slugData = this.parseUniversalSlug(req.params.slug);
        
        if (slugData) {
          res.json({
            data: slugData,
            valid: true,
            domains: this.generateAllDomainURLs(req.params.slug)
          });
        } else {
          res.status(400).json({ error: 'Invalid slug', valid: false });
        }
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Analytics API
    this.app.get('/api/analytics/:slug', async (req, res) => {
      const analytics = await this.engines.analyticsEngine.getSlugAnalytics(req.params.slug);
      res.json(analytics);
    });
  }
  
  /**
   * Configure CDN subdomain routing
   */
  configureCDNRouting() {
    // Serve generated assets
    this.app.use('/cdn', express.static(path.join(__dirname, 'generated-assets')));
    
    // Dynamic asset generation
    this.app.get('/cdn/generate/:type/:slug', async (req, res) => {
      const assetType = req.params.type; // 'pixel', 'qr', 'scene', etc.
      const slug = req.params.slug;
      
      const asset = await this.generateDynamicAsset(assetType, slug, req.query);
      
      res.type(asset.mimeType);
      res.send(asset.data);
    });
  }
  
  /**
   * Create URL engine for slug generation and parsing
   */
  createURLEngine() {
    return {
      generateSlugURL: (slug, domain) => {
        return `https://${domain}/${slug}`;
      },
      
      parseSlugURL: (url) => {
        const urlObj = new URL(url);
        const slug = urlObj.pathname.split('/').pop();
        return this.parseUniversalSlug(slug);
      },
      
      validateURL: (url) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      }
    };
  }
  
  /**
   * Create character engine for state management across domains
   */
  createCharacterEngine() {
    return {
      initialize: async () => {
        console.log('🎭 Character engine initialized');
      },
      
      handleCharacterRoute: async (req, res, slug, characterId) => {
        try {
          const slugData = this.parseUniversalSlug(slug);
          const characterState = this.state.characterStates.get(characterId);
          
          if (characterState) {
            // Render character in context
            const characterPage = await this.renderCharacterPage(characterState, slugData, req);
            res.send(characterPage);
          } else {
            res.status(404).json({ error: 'Character not found' });
          }
          
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      },
      
      migrateCharacterState: async (characterId, fromDomain, toDomain, slugData) => {
        const character = this.state.characterStates.get(characterId);
        
        if (character) {
          character.currentDomain = toDomain;
          character.migrationHistory = character.migrationHistory || [];
          character.migrationHistory.push({
            from: fromDomain,
            to: toDomain,
            timestamp: Date.now(),
            context: slugData
          });
          
          console.log(`🎭 Migrated character ${characterId}: ${fromDomain} → ${toDomain}`);
        }
      }
    };
  }
  
  /**
   * Create analytics engine for tracking across domains
   */
  createAnalyticsEngine() {
    return {
      initialize: async () => {
        console.log('📊 Analytics engine initialized');
      },
      
      recordRequest: (requestData) => {
        const key = requestData.slug || 'no-slug';
        const analytics = this.state.routeAnalytics.get(key) || {
          requests: 0,
          domains: new Set(),
          sessions: new Set(),
          firstSeen: Date.now(),
          lastSeen: Date.now()
        };
        
        analytics.requests++;
        analytics.domains.add(requestData.host);
        analytics.sessions.add(requestData.sessionId);
        analytics.lastSeen = Date.now();
        
        this.state.routeAnalytics.set(key, analytics);
      },
      
      getSlugAnalytics: async (slug) => {
        const analytics = this.state.routeAnalytics.get(slug);
        
        if (analytics) {
          return {
            ...analytics,
            domains: Array.from(analytics.domains),
            sessions: Array.from(analytics.sessions),
            uniqueDomains: analytics.domains.size,
            uniqueSessions: analytics.sessions.size
          };
        }
        
        return { error: 'No analytics found for slug' };
      }
    };
  }
  
  /**
   * Create QR engine for dynamic QR code generation
   */
  createQREngine() {
    return {
      generateQRCode: (slug, options = {}) => {
        // Mock QR code generation - in real implementation would use qrcode library
        const qrData = {
          slug: slug,
          format: options.format || 'png',
          size: options.size || 256,
          url: `https://${this.config.domains.pos}/${slug}`,
          generatedAt: Date.now()
        };
        
        console.log(`📱 Generated QR code for slug: ${slug.substring(0, 20)}...`);
        
        return qrData;
      },
      
      generateQRCodeURL: (slug, domain = 'pos') => {
        return `https://${this.config.domains.cdn}/generate/qr/${slug}`;
      }
    };
  }
  
  /**
   * Create POS engine for physical transaction integration
   */
  createPOSEngine() {
    return {
      createTransaction: async (slugData, req) => {
        const transaction = {
          id: crypto.randomUUID(),
          slug: slugData.id,
          type: 'qr_purchase',
          context: slugData.context,
          amount: this.calculateAmountFromContext(slugData.context),
          currency: 'USD',
          customerSession: req.sessionId,
          createdAt: Date.now(),
          status: 'pending'
        };
        
        console.log(`💳 Created POS transaction: ${transaction.id}`);
        
        return transaction;
      },
      
      processPurchase: async (req, res, slug) => {
        try {
          const slugData = this.parseUniversalSlug(slug);
          const purchaseData = req.body;
          
          // Process payment (mock implementation)
          const result = {
            success: true,
            transactionId: crypto.randomUUID(),
            amount: purchaseData.amount,
            slug: slug,
            context: slugData?.context,
            timestamp: Date.now()
          };
          
          res.json(result);
          
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      }
    };
  }
  
  // Helper methods
  
  extractSlugFromRequest(req) {
    // Check URL path
    const pathSlug = req.path.split('/').find(segment => 
      segment.startsWith(this.config.slugGeneration.prefix)
    );
    
    if (pathSlug) return pathSlug;
    
    // Check query parameters
    const querySlug = req.query[this.config.slugGeneration.prefix];
    if (querySlug) return `${this.config.slugGeneration.prefix}=${querySlug}`;
    
    // Check hash fragment (if passed as query)
    const hashSlug = req.query.hash;
    if (hashSlug && hashSlug.startsWith(this.config.slugGeneration.prefix)) {
      return hashSlug;
    }
    
    return null;
  }
  
  generateChecksum(data) {
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 8);
  }
  
  sanitizeContext(context) {
    // Ensure Java compatibility
    if (typeof context === 'string') {
      return this.validateAndNormalizeText(context);
    }
    
    if (typeof context === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(context)) {
        sanitized[key] = typeof value === 'string' 
          ? this.validateAndNormalizeText(value)
          : value;
      }
      return sanitized;
    }
    
    return context;
  }
  
  validateAndNormalizeText(text) {
    if (typeof text === 'string') {
      // Unicode normalization (Java standard)
      return text.normalize(this.config.characterEncoding.normalization)
                 .substring(0, this.config.characterEncoding.maxLength);
    }
    
    if (typeof text === 'object') {
      const normalized = {};
      for (const [key, value] of Object.entries(text)) {
        normalized[key] = this.validateAndNormalizeText(value);
      }
      return normalized;
    }
    
    return text;
  }
  
  generateAllDomainURLs(slug) {
    const urls = {};
    
    Object.entries(this.config.domains).forEach(([name, domain]) => {
      urls[name] = `https://${domain}/${slug}`;
    });
    
    return urls;
  }
  
  buildTargetURL(req, targetDomain, slug, options) {
    const protocol = req.secure ? 'https' : 'http';
    let url = `${protocol}://${targetDomain}`;
    
    if (slug) {
      url += `/${slug}`;
    }
    
    if (this.config.routing.preserveQuery && req.query) {
      const queryString = new URLSearchParams(req.query).toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    
    if (this.config.routing.preserveHash && req.query.hash) {
      url += `#${req.query.hash}`;
    }
    
    return url;
  }
  
  executeRouting(req, res, targetUrl, context) {
    // In real implementation, this would handle the actual routing
    // For now, we'll redirect or proxy the request
    
    if (context.targetDomain === req.get('host')) {
      // Same domain, continue processing
      return { success: true, type: 'local' };
    } else {
      // Cross-domain, redirect
      res.redirect(302, targetUrl);
      return { success: true, type: 'redirect' };
    }
  }
  
  calculateAmountFromContext(context) {
    // Calculate purchase amount based on context
    const baseAmounts = {
      research: 5.00,    // Research paper access
      visual: 3.00,      // Visual content
      character: 10.00,  // Character merchandise
      tycoon: 15.00,     // Game content
      premium: 25.00     // Premium features
    };
    
    return baseAmounts[context?.type] || 5.00;
  }
  
  async migrateCharacterStates(characterIds, targetDomain, slugData) {
    for (const characterId of characterIds) {
      await this.engines.characterEngine.migrateCharacterState(
        characterId,
        'unknown',
        targetDomain,
        slugData
      );
    }
  }
  
  async recordRouteAnalytics(context, targetUrl) {
    this.engines.analyticsEngine.recordRequest({
      ...context,
      targetUrl,
      timestamp: Date.now()
    });
  }
  
  async startServer() {
    const PORT = process.env.SLUG_ROUTER_PORT || 3500;
    
    this.server = this.app.listen(PORT, () => {
      console.log(`✅ Universal Slug Router running on port ${PORT}`);
      console.log(`🔗 Example URLs:`);
      console.log(`   Research: http://localhost:${PORT}/research/xd_co_f=abc123`);
      console.log(`   Visual:   http://localhost:${PORT}/visual/xd_co_f=abc123`);
      console.log(`   Gaming:   http://localhost:${PORT}/tycoon/xd_co_f=abc123`);
      console.log(`   POS:      http://localhost:${PORT}/qr/xd_co_f=abc123`);
      console.log(`   API:      http://localhost:${PORT}/api/slug/generate`);
    });
  }
  
  async loadPersistedState() {
    // Load any persisted state from storage
    console.log('💾 Loading persisted router state...');
    // Implementation would load from database or file system
  }
  
  async savePersistedState() {
    // Save current state to storage
    console.log('💾 Saving router state...');
    // Implementation would save to database or file system
  }
  
  // Placeholder methods for page generation
  async generateResearchPage(slugData, req) { return '<h1>Research Page</h1>'; }
  async generateVisualPage(slugData, req) { return '<h1>Visual Page</h1>'; }
  async generateTycoonPage(slugData, req) { return '<h1>Tycoon Game</h1>'; }
  async renderCharacterPage(character, slugData, req) { return '<h1>Character Page</h1>'; }
  async generateDynamicAsset(type, slug, query) { return { mimeType: 'text/plain', data: 'Asset' }; }
}

module.exports = UniversalSlugRouter;

// Example usage and testing
if (require.main === module) {
  async function demonstrateUniversalRouting() {
    console.log('🚀 Universal Slug Router Demo');
    console.log('=' .repeat(50));
    
    const router = new UniversalSlugRouter();
    
    try {
      // Initialize the router
      await router.initialize();
      
      // Generate a universal slug
      const slug = router.generateUniversalSlug({
        type: 'research',
        document: 'cancer_treatment_flowers',
        level: 3,
        concept: 'botanical_therapy'
      });
      
      console.log(`\n🔗 Generated universal slug: ${slug}`);
      
      // Parse the slug back
      const parsed = router.parseUniversalSlug(slug);
      console.log(`📄 Parsed slug data:`, parsed);
      
      // Generate URLs for all domains
      const allURLs = router.generateAllDomainURLs(slug);
      console.log(`\n🌐 All domain URLs:`);
      Object.entries(allURLs).forEach(([domain, url]) => {
        console.log(`   ${domain}: ${url}`);
      });
      
      // Generate QR code
      const qrCode = router.engines.qrEngine.generateQRCode(slug);
      console.log(`\n📱 QR Code:`, qrCode);
      
      console.log('\n✅ Universal routing system ready!');
      console.log('🎯 Java.com-style subdomain routing with shared tracking enabled!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error.message);
    }
  }
  
  demonstrateUniversalRouting().catch(console.error);
}