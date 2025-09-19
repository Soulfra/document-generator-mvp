#!/usr/bin/env node

/**
 * 🌐 WEB CONTENT FETCHER SERVICE
 * 
 * Backend service for the Web Content Swipe Interface
 * - Fetches content from government sites, W3C specs, and other URLs
 * - Integrates with Context-Aware AI Orchestrator for analysis
 * - Handles content parsing, cleaning, and metadata extraction
 * - Provides proxy functionality to bypass CORS issues
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const winston = require('winston');
const rateLimit = require('express-rate-limit');
const { URL } = require('url');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Import our AI orchestrator
const ContextAwareAIOrchestrator = require('./context-aware-ai-orchestrator');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/web-content-fetcher.log' })
  ]
});

class WebContentFetcherService {
  constructor(options = {}) {
    this.config = {
      port: options.port || 3052,
      timeout: options.timeout || 30000,
      maxContentLength: options.maxContentLength || 1024 * 1024, // 1MB
      cacheTTL: options.cacheTTL || 60 * 60 * 1000, // 1 hour
      userAgent: options.userAgent || 'Mozilla/5.0 (compatible; DocumentGenerator/1.0; +https://github.com/user/repo)',
      puppeteerEnabled: options.puppeteerEnabled !== false,
      ...options
    };

    // Content cache
    this.contentCache = new Map();
    this.analysisCache = new Map();
    
    // Browser instance for dynamic content
    this.browser = null;
    
    // AI orchestrator for analysis
    this.aiOrchestrator = null;
    
    // Statistics
    this.stats = {
      requestsTotal: 0,
      requestsSuccess: 0,
      requestsError: 0,
      cacheHits: 0,
      analysisGenerated: 0,
      averageResponseTime: 0
    };

    // Initialize
    this.initialize();
  }

  async initialize() {
    logger.info('🌐 Initializing Web Content Fetcher Service...');

    try {
      // Initialize AI orchestrator
      this.aiOrchestrator = new ContextAwareAIOrchestrator();
      await new Promise((resolve) => {
        this.aiOrchestrator.once('ready', resolve);
      });

      // Initialize Puppeteer if enabled
      if (this.config.puppeteerEnabled) {
        await this.initializePuppeteer();
      }

      // Start HTTP server
      await this.startServer();

      // Schedule cache cleanup
      this.scheduleCacheCleanup();

      logger.info('✅ Web Content Fetcher Service ready');

    } catch (error) {
      logger.error('❌ Failed to initialize service:', error);
      throw error;
    }
  }

  async initializePuppeteer() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
      
      logger.info('🤖 Puppeteer browser initialized');
    } catch (error) {
      logger.warn('⚠️ Puppeteer initialization failed, using HTTP only:', error.message);
      this.config.puppeteerEnabled = false;
    }
  }

  async startServer() {
    const app = express();

    // Security middleware
    app.use(helmet());
    app.use(cors({
      origin: true,
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP',
        retryAfter: '15 minutes'
      }
    });
    app.use('/api', limiter);

    // Body parsing
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Request logging
    app.use((req, res, next) => {
      this.stats.requestsTotal++;
      logger.debug(`📥 ${req.method} ${req.path} - ${req.ip}`);
      next();
    });

    // Serve the web interface
    app.use(express.static(path.join(__dirname, 'public')));

    // Health check
    app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'web-content-fetcher',
        uptime: process.uptime(),
        stats: this.stats,
        features: {
          puppeteer: this.config.puppeteerEnabled,
          aiOrchestrator: !!this.aiOrchestrator,
          cache: this.contentCache.size
        }
      });
    });

    // Main content fetching endpoint
    app.post('/api/fetch-content', async (req, res) => {
      const startTime = Date.now();
      
      try {
        const { url, options = {} } = req.body;
        
        if (!url) {
          return res.status(400).json({ error: 'URL is required' });
        }

        // Validate URL
        const validationResult = this.validateUrl(url);
        if (!validationResult.valid) {
          return res.status(400).json({ error: validationResult.error });
        }

        logger.info('🌐 Fetching content', { url, options });

        // Check cache first
        const cacheKey = this.generateCacheKey(url, options);
        if (this.contentCache.has(cacheKey)) {
          const cached = this.contentCache.get(cacheKey);
          this.stats.cacheHits++;
          
          logger.debug('📦 Cache hit', { url });
          return res.json({
            success: true,
            cached: true,
            ...cached
          });
        }

        // Fetch content
        const content = await this.fetchContent(url, options);
        
        // Cache the result
        this.contentCache.set(cacheKey, content);

        // Update stats
        this.stats.requestsSuccess++;
        const duration = Date.now() - startTime;
        this.updateAverageResponseTime(duration);

        logger.info('✅ Content fetched successfully', { 
          url, 
          duration,
          titleLength: content.title?.length || 0,
          textLength: content.text?.length || 0
        });

        res.json({
          success: true,
          cached: false,
          ...content
        });

      } catch (error) {
        this.stats.requestsError++;
        const duration = Date.now() - startTime;
        
        logger.error('❌ Content fetch failed', { 
          url: req.body.url,
          error: error.message,
          duration
        });

        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Content decision recording endpoint
    app.post('/api/content-decision', async (req, res) => {
      try {
        const { url, decision, action, analysis, conversationId } = req.body;
        
        // Store decision for learning
        const decisionRecord = {
          url,
          decision,
          action,
          analysis,
          conversationId,
          timestamp: Date.now()
        };

        // Save to file-based database (in production, use proper DB)
        await this.saveDecision(decisionRecord);

        // Optionally trigger learning updates
        if (action === 'learn' || action === 'analyze') {
          await this.triggerLearningUpdate(decisionRecord);
        }

        logger.info('📊 Decision recorded', { url, decision, action });

        res.json({ success: true });

      } catch (error) {
        logger.error('❌ Failed to record decision:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Analysis endpoint
    app.post('/api/analyze-content', async (req, res) => {
      try {
        const { content, url, options = {} } = req.body;
        
        if (!content) {
          return res.status(400).json({ error: 'Content is required' });
        }

        const analysis = await this.analyzeContent(content, url, options);
        
        res.json({
          success: true,
          analysis
        });

      } catch (error) {
        logger.error('❌ Analysis failed:', error);
        res.status(500).json({ error: error.message });
      }
    });

    // Statistics endpoint
    app.get('/api/stats', (req, res) => {
      res.json({
        stats: this.stats,
        cache: {
          contentEntries: this.contentCache.size,
          analysisEntries: this.analysisCache.size
        },
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          puppeteer: this.config.puppeteerEnabled
        }
      });
    });

    // Start server
    app.listen(this.config.port, () => {
      logger.info(`🌐 Web Content Fetcher Service started on port ${this.config.port}`);
      console.log(`📱 Web Interface: http://localhost:${this.config.port}`);
      console.log(`🔗 API: http://localhost:${this.config.port}/api`);
    });

    return app;
  }

  validateUrl(url) {
    try {
      const parsedUrl = new URL(url);
      
      // Check protocol
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return { valid: false, error: 'Only HTTP and HTTPS URLs are supported' };
      }

      // Check for suspicious domains (basic security)
      const hostname = parsedUrl.hostname.toLowerCase();
      const suspiciousDomains = ['localhost', '127.0.0.1', '0.0.0.0'];
      
      if (suspiciousDomains.some(domain => hostname.includes(domain)) && !hostname.includes('github.com')) {
        return { valid: false, error: 'Local URLs are not allowed for security reasons' };
      }

      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  async fetchContent(url, options = {}) {
    const startTime = Date.now();
    
    try {
      // Determine fetch strategy
      const strategy = this.determineFetchStrategy(url);
      
      let content;
      if (strategy === 'puppeteer' && this.config.puppeteerEnabled) {
        content = await this.fetchWithPuppeteer(url, options);
      } else {
        content = await this.fetchWithAxios(url, options);
      }

      // Add metadata
      content.fetchTime = Date.now() - startTime;
      content.fetchStrategy = strategy;
      content.url = url;

      return content;

    } catch (error) {
      logger.error(`❌ Fetch failed for ${url}:`, error.message);
      throw error;
    }
  }

  determineFetchStrategy(url) {
    const hostname = new URL(url).hostname.toLowerCase();
    
    // Sites that typically need JavaScript rendering
    const jsRequiredSites = [
      'twitter.com',
      'instagram.com',
      'facebook.com',
      'linkedin.com',
      'app.',
      'dashboard.',
      'portal.'
    ];

    if (jsRequiredSites.some(site => hostname.includes(site))) {
      return 'puppeteer';
    }

    // Government and documentation sites usually work with HTTP
    const staticSites = [
      'github.com',
      'w3.org',
      'mozilla.org',
      'developer.mozilla.org',
      '.gov',
      '.edu',
      'docs.',
      'documentation.'
    ];

    if (staticSites.some(site => hostname.includes(site))) {
      return 'axios';
    }

    // Default to HTTP, fallback to Puppeteer if needed
    return 'axios';
  }

  async fetchWithAxios(url, options = {}) {
    try {
      const response = await axios.get(url, {
        timeout: this.config.timeout,
        maxContentLength: this.config.maxContentLength,
        headers: {
          'User-Agent': this.config.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          ...options.headers
        },
        validateStatus: (status) => status < 500 // Accept redirects and client errors
      });

      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Parse HTML
      const $ = cheerio.load(response.data);
      
      // Extract content
      const content = this.extractContent($, response.data, url);
      
      return content;

    } catch (error) {
      // If axios fails and puppeteer is available, try that
      if (this.config.puppeteerEnabled && !options.noFallback) {
        logger.warn(`🔄 Axios failed for ${url}, trying Puppeteer:`, error.message);
        return this.fetchWithPuppeteer(url, { ...options, noFallback: true });
      }
      
      throw error;
    }
  }

  async fetchWithPuppeteer(url, options = {}) {
    if (!this.browser) {
      throw new Error('Puppeteer not available');
    }

    const page = await this.browser.newPage();
    
    try {
      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(this.config.userAgent);

      // Block unnecessary resources to speed up loading
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['stylesheet', 'font', 'image', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Navigate to page
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: this.config.timeout
      });

      // Wait for dynamic content to load
      await page.waitForTimeout(2000);

      // Extract content
      const content = await page.evaluate(() => {
        // Remove scripts and styles
        const scripts = document.querySelectorAll('script, style, nav, footer, aside, .advertisement, .ad, .sidebar');
        scripts.forEach(el => el.remove());

        return {
          title: document.title,
          text: document.body.innerText || '',
          html: document.body.innerHTML,
          links: Array.from(document.links).map(link => ({
            text: link.textContent.trim(),
            href: link.href
          })).filter(link => link.text && link.href),
          meta: {
            description: document.querySelector('meta[name="description"]')?.content || '',
            keywords: document.querySelector('meta[name="keywords"]')?.content || '',
            author: document.querySelector('meta[name="author"]')?.content || ''
          }
        };
      });

      return content;

    } finally {
      await page.close();
    }
  }

  extractContent($, html, url) {
    // Remove unwanted elements
    $('script, style, nav, footer, aside, .advertisement, .ad, .sidebar').remove();

    // Extract title
    const title = $('title').text().trim() || 
                  $('h1').first().text().trim() || 
                  'Untitled Document';

    // Extract main text content
    const mainSelectors = [
      'main',
      'article', 
      '.content',
      '.main-content',
      '#content',
      '.post-content',
      '.entry-content'
    ];

    let mainContent = null;
    for (const selector of mainSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        mainContent = element;
        break;
      }
    }

    // Fallback to body if no main content found
    if (!mainContent) {
      mainContent = $('body');
    }

    // Extract text
    const text = mainContent.text()
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000); // Limit text length

    // Extract links
    const links = [];
    $('a[href]').each((i, el) => {
      const $link = $(el);
      const href = $link.attr('href');
      const text = $link.text().trim();
      
      if (text && href && !href.startsWith('#')) {
        links.push({
          text: text.substring(0, 100),
          href: this.resolveUrl(href, url)
        });
      }
    });

    // Extract metadata
    const meta = {
      description: $('meta[name="description"]').attr('content') || '',
      keywords: $('meta[name="keywords"]').attr('content') || '',
      author: $('meta[name="author"]').attr('content') || '',
      canonical: $('link[rel="canonical"]').attr('href') || '',
      og: {
        title: $('meta[property="og:title"]').attr('content') || '',
        description: $('meta[property="og:description"]').attr('content') || '',
        image: $('meta[property="og:image"]').attr('content') || ''
      }
    };

    return {
      title,
      text,
      html: mainContent.html() || '',
      links: links.slice(0, 20), // Limit links
      meta,
      wordCount: text.split(/\s+/).length,
      domain: new URL(url).hostname
    };
  }

  resolveUrl(href, base) {
    try {
      return new URL(href, base).href;
    } catch {
      return href;
    }
  }

  generateCacheKey(url, options) {
    const key = `${url}:${JSON.stringify(options)}`;
    return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
  }

  async analyzeContent(content, url, options = {}) {
    if (!this.aiOrchestrator) {
      throw new Error('AI Orchestrator not available');
    }

    const cacheKey = this.generateCacheKey(`analysis:${url}`, content);
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    try {
      const analysisPrompt = `Analyze this web content and provide structured insights:

URL: ${url}
Title: ${content.title}
Domain: ${content.domain}
Word Count: ${content.wordCount}

Content Preview:
${content.text.substring(0, 1500)}

Please analyze and return:
1. Content type (documentation, tutorial, reference, blog, tool, specification, etc.)
2. Main topics and themes
3. Technical concepts mentioned
4. Learning value (high/medium/low) and why
5. Key insights or takeaways
6. Relevance for developers/learners

Format as structured analysis suitable for quick scanning.`;

      const result = await this.aiOrchestrator.processRequest(analysisPrompt, {
        conversationId: `content-analysis-${Date.now()}`,
        maxTokens: 500,
        temperature: 0.7
      });

      if (result.success) {
        const analysis = this.parseAnalysisResult(result.content);
        this.analysisCache.set(cacheKey, analysis);
        this.stats.analysisGenerated++;
        return analysis;
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      logger.error('❌ Content analysis failed:', error);
      
      // Return basic analysis as fallback
      return {
        type: this.inferContentType(content, url),
        topics: this.extractTopics(content.text),
        concepts: this.extractTechnicalConcepts(content.text),
        learningValue: 'medium',
        insights: ['Content analysis temporarily unavailable'],
        relevance: 'Content may contain valuable information for learning and development'
      };
    }
  }

  parseAnalysisResult(analysisText) {
    // Parse AI-generated analysis into structured format
    const lines = analysisText.split('\n').filter(line => line.trim());
    
    const analysis = {
      type: 'Web Content',
      topics: [],
      concepts: [],
      learningValue: 'medium',
      insights: [],
      relevance: 'Medium relevance for development'
    };

    lines.forEach(line => {
      const lower = line.toLowerCase();
      
      if (lower.includes('type:') || lower.includes('content type')) {
        analysis.type = this.extractValue(line) || analysis.type;
      } else if (lower.includes('topics:') || lower.includes('themes:')) {
        analysis.topics = this.extractListItems(line);
      } else if (lower.includes('concepts:') || lower.includes('technical')) {
        analysis.concepts = this.extractListItems(line);
      } else if (lower.includes('learning') && (lower.includes('high') || lower.includes('medium') || lower.includes('low'))) {
        if (lower.includes('high')) analysis.learningValue = 'high';
        else if (lower.includes('low')) analysis.learningValue = 'low';
        else analysis.learningValue = 'medium';
      } else if (lower.includes('insight') || lower.includes('takeaway') || lower.includes('•') || lower.includes('-')) {
        const insight = line.trim().replace(/^[•\-*]\s*/, '');
        if (insight && insight.length > 10) {
          analysis.insights.push(insight);
        }
      } else if (lower.includes('relevance')) {
        analysis.relevance = this.extractValue(line) || analysis.relevance;
      }
    });

    return analysis;
  }

  extractValue(line) {
    const match = line.match(/:\s*(.+)$/);
    return match ? match[1].trim() : null;
  }

  extractListItems(line) {
    const items = line.split(/[,;]/).map(item => item.trim().replace(/^[•\-*]\s*/, ''));
    return items.filter(item => item.length > 2).slice(0, 5);
  }

  inferContentType(content, url) {
    const title = content.title.toLowerCase();
    const text = content.text.toLowerCase();
    const domain = content.domain.toLowerCase();

    if (domain.includes('github.com') || text.includes('repository') || text.includes('code')) return 'Code Repository';
    if (domain.includes('w3.org') || title.includes('specification')) return 'Specification';
    if (domain.includes('developer.') || domain.includes('docs.')) return 'Documentation';
    if (text.includes('tutorial') || text.includes('how to')) return 'Tutorial';
    if (text.includes('reference') || text.includes('api')) return 'Reference';
    if (domain.includes('blog') || text.includes('posted') || text.includes('author')) return 'Blog Post';
    if (text.includes('download') || text.includes('install')) return 'Tool/Software';
    
    return 'Web Content';
  }

  extractTopics(text) {
    const topics = [];
    const techTopics = [
      'javascript', 'python', 'react', 'node', 'api', 'database', 'security',
      'performance', 'css', 'html', 'docker', 'kubernetes', 'aws', 'cloud',
      'machine learning', 'ai', 'blockchain', 'web development', 'mobile'
    ];

    techTopics.forEach(topic => {
      if (text.toLowerCase().includes(topic)) {
        topics.push(topic);
      }
    });

    return topics.slice(0, 5);
  }

  extractTechnicalConcepts(text) {
    const concepts = [];
    const techConcepts = [
      'REST API', 'GraphQL', 'microservices', 'serverless', 'OAuth',
      'JSON', 'XML', 'HTTP', 'HTTPS', 'SSL', 'TLS', 'JWT', 'CORS',
      'SQL', 'NoSQL', 'Redis', 'MongoDB', 'PostgreSQL', 'MySQL'
    ];

    techConcepts.forEach(concept => {
      if (text.includes(concept)) {
        concepts.push(concept);
      }
    });

    return concepts.slice(0, 5);
  }

  async saveDecision(decisionRecord) {
    try {
      const dataDir = path.join(__dirname, 'data');
      await fs.mkdir(dataDir, { recursive: true });
      
      const decisionsFile = path.join(dataDir, 'content-decisions.jsonl');
      const line = JSON.stringify(decisionRecord) + '\n';
      
      await fs.appendFile(decisionsFile, line);
    } catch (error) {
      logger.error('❌ Failed to save decision:', error);
    }
  }

  async triggerLearningUpdate(decisionRecord) {
    // This could trigger additional processing for learning content
    // For now, just log the learning action
    logger.info('📚 Learning action triggered', {
      url: decisionRecord.url,
      action: decisionRecord.action,
      timestamp: decisionRecord.timestamp
    });
  }

  updateAverageResponseTime(duration) {
    if (this.stats.averageResponseTime === 0) {
      this.stats.averageResponseTime = duration;
    } else {
      this.stats.averageResponseTime = (this.stats.averageResponseTime + duration) / 2;
    }
  }

  scheduleCacheCleanup() {
    // Clean cache every hour
    setInterval(() => {
      this.cleanupCache();
    }, 60 * 60 * 1000);
  }

  cleanupCache() {
    const now = Date.now();
    let cleaned = 0;

    // Clean content cache
    for (const [key, value] of this.contentCache.entries()) {
      if (now - value.timestamp > this.config.cacheTTL) {
        this.contentCache.delete(key);
        cleaned++;
      }
    }

    // Clean analysis cache
    for (const [key, value] of this.analysisCache.entries()) {
      if (now - value.timestamp > this.config.cacheTTL) {
        this.analysisCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.info(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
    }
  }

  async shutdown() {
    logger.info('🛑 Shutting down Web Content Fetcher Service...');
    
    if (this.browser) {
      await this.browser.close();
    }
    
    logger.info('✅ Shutdown complete');
  }
}

// Export for use in other modules
module.exports = WebContentFetcherService;

// Start the service if called directly
if (require.main === module) {
  const service = new WebContentFetcherService();
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await service.shutdown();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down...');
    await service.shutdown();
    process.exit(0);
  });
}