#!/usr/bin/env node

/**
 * TEMPLATE MAPPING LAYER
 * Maps templates to sites and injects them predictively
 * Works with API pre-fetch hooks for complete navigation preparation
 */

const fs = require('fs').promises;
const crypto = require('crypto');
const { EventEmitter } = require('events');

console.log(`
📋🗺️ TEMPLATE MAPPING LAYER 🗺️📋
Template Detection → Mapping → Predictive Injection
`);

class TemplateMappingLayer extends EventEmitter {
  constructor() {
    super();
    this.templateRegistry = new Map();
    this.siteTemplateMap = new Map();
    this.injectionHooks = new Map();
    this.templateCache = new Map();
    this.mappingPatterns = new Map();
    
    this.initializeTemplateMapping();
  }

  async initializeTemplateMapping() {
    console.log('📋 Initializing template mapping layer...');
    
    // Create template registry
    await this.createTemplateRegistry();
    
    // Set up site mapping patterns
    await this.setupSiteMappingPatterns();
    
    // Initialize injection hooks
    this.setupInjectionHooks();
    
    // Create template cache
    await this.initializeTemplateCache();
    
    console.log('✅ Template mapping layer active');
  }

  async createTemplateRegistry() {
    console.log('📚 Creating template registry...');
    
    const templates = {
      // Navigation Templates
      'nav-header': {
        type: 'navigation',
        components: ['logo', 'menu', 'search', 'user-menu'],
        responsive: true,
        frameworks: ['react', 'vue', 'vanilla'],
        apis: ['navigation', 'user'],
        priority: 'critical'
      },
      
      'nav-sidebar': {
        type: 'navigation',
        components: ['nav-tree', 'collapsible-menu', 'user-profile'],
        responsive: true,
        frameworks: ['react', 'vue'],
        apis: ['navigation', 'user-permissions'],
        priority: 'high'
      },
      
      // Content Templates
      'product-grid': {
        type: 'content',
        components: ['product-card', 'filters', 'pagination', 'sort-controls'],
        responsive: true,
        frameworks: ['react', 'vue', 'angular'],
        apis: ['products', 'categories', 'inventory'],
        priority: 'high'
      },
      
      'article-layout': {
        type: 'content',
        components: ['article-header', 'content-body', 'author-bio', 'related-posts'],
        responsive: true,
        frameworks: ['react', 'vue', 'vanilla'],
        apis: ['posts', 'author', 'comments'],
        priority: 'medium'
      },
      
      'dashboard-widgets': {
        type: 'content',
        components: ['chart-widget', 'stat-card', 'data-table', 'action-panel'],
        responsive: true,
        frameworks: ['react', 'vue', 'd3'],
        apis: ['analytics', 'metrics', 'user-data'],
        priority: 'critical'
      },
      
      // Interactive Templates
      'form-builder': {
        type: 'interactive',
        components: ['form-fields', 'validation', 'submit-handler', 'progress-indicator'],
        responsive: true,
        frameworks: ['react', 'vue', 'angular'],
        apis: ['form-config', 'validation', 'submission'],
        priority: 'medium'
      },
      
      'chat-interface': {
        type: 'interactive',
        components: ['message-list', 'input-area', 'user-list', 'emoji-picker'],
        responsive: true,
        frameworks: ['react', 'vue', 'websocket'],
        apis: ['messages', 'users', 'chat-rooms'],
        priority: 'high'
      },
      
      // Layout Templates
      'two-column-layout': {
        type: 'layout',
        components: ['main-content', 'sidebar', 'header', 'footer'],
        responsive: true,
        frameworks: ['css-grid', 'flexbox'],
        apis: [],
        priority: 'low'
      },
      
      'modal-overlay': {
        type: 'overlay',
        components: ['modal-content', 'backdrop', 'close-button', 'scroll-lock'],
        responsive: true,
        frameworks: ['react', 'vue', 'vanilla'],
        apis: [],
        priority: 'medium'
      }
    };

    for (const [templateName, config] of Object.entries(templates)) {
      this.templateRegistry.set(templateName, {
        ...config,
        id: crypto.randomUUID(),
        created: new Date().toISOString(),
        usage_count: 0,
        last_used: null,
        size_estimate: this.estimateTemplateSize(config)
      });
      
      console.log(`  📄 Registered: ${templateName} (${config.type}, ${config.priority} priority)`);
    }
  }

  estimateTemplateSize(config) {
    // Estimate template size based on complexity
    const baseSize = 1024; // 1KB base
    const componentMultiplier = config.components.length * 500; // 500B per component
    const frameworkOverhead = config.frameworks.length * 200; // 200B per framework
    
    return baseSize + componentMultiplier + frameworkOverhead;
  }

  async setupSiteMappingPatterns() {
    console.log('🔍 Setting up site mapping patterns...');
    
    const sitePatterns = {
      // E-commerce patterns
      'e-commerce-home': {
        url_patterns: ['/shop', '/store', '/', '/home'],
        page_indicators: ['product', 'cart', 'checkout', 'category'],
        required_templates: ['nav-header', 'product-grid', 'two-column-layout'],
        optional_templates: ['modal-overlay', 'form-builder'],
        confidence_threshold: 0.8
      },
      
      'e-commerce-product': {
        url_patterns: ['/product', '/item', '/p/'],
        page_indicators: ['add-to-cart', 'price', 'reviews', 'product-images'],
        required_templates: ['nav-header', 'product-details', 'modal-overlay'],
        optional_templates: ['form-builder', 'chat-interface'],
        confidence_threshold: 0.9
      },
      
      // Dashboard patterns
      'admin-dashboard': {
        url_patterns: ['/dashboard', '/admin', '/app'],
        page_indicators: ['analytics', 'metrics', 'chart', 'table'],
        required_templates: ['nav-sidebar', 'dashboard-widgets', 'two-column-layout'],
        optional_templates: ['modal-overlay', 'form-builder'],
        confidence_threshold: 0.85
      },
      
      // Blog patterns
      'blog-home': {
        url_patterns: ['/blog', '/news', '/articles'],
        page_indicators: ['post', 'article', 'author', 'category'],
        required_templates: ['nav-header', 'article-grid', 'two-column-layout'],
        optional_templates: ['modal-overlay'],
        confidence_threshold: 0.7
      },
      
      'blog-article': {
        url_patterns: ['/post', '/article', '/blog/'],
        page_indicators: ['article-content', 'author', 'comments', 'share'],
        required_templates: ['nav-header', 'article-layout', 'two-column-layout'],
        optional_templates: ['modal-overlay', 'form-builder'],
        confidence_threshold: 0.9
      },
      
      // Social patterns
      'social-feed': {
        url_patterns: ['/feed', '/timeline', '/home'],
        page_indicators: ['post', 'like', 'comment', 'share', 'profile'],
        required_templates: ['nav-header', 'feed-layout', 'modal-overlay'],
        optional_templates: ['chat-interface', 'form-builder'],
        confidence_threshold: 0.8
      },
      
      // Documentation patterns
      'docs-page': {
        url_patterns: ['/docs', '/help', '/guide'],
        page_indicators: ['documentation', 'toc', 'navigation', 'search'],
        required_templates: ['nav-sidebar', 'article-layout', 'two-column-layout'],
        optional_templates: ['modal-overlay'],
        confidence_threshold: 0.75
      }
    };

    for (const [patternName, config] of Object.entries(sitePatterns)) {
      this.mappingPatterns.set(patternName, {
        ...config,
        id: crypto.randomUUID(),
        match_count: 0,
        last_matched: null,
        accuracy_score: 0
      });
      
      console.log(`  🎯 Pattern: ${patternName} (${config.required_templates.length} required templates)`);
    }
  }

  setupInjectionHooks() {
    console.log('💉 Setting up template injection hooks...');
    
    const injectionStrategies = {
      'preload': {
        trigger: 'navigation-prediction',
        timing: 'before-navigation',
        method: 'cache-templates',
        priority: 'high'
      },
      
      'just-in-time': {
        trigger: 'page-load',
        timing: 'during-navigation',
        method: 'inject-templates',
        priority: 'critical'
      },
      
      'lazy': {
        trigger: 'component-visible',
        timing: 'after-navigation',
        method: 'lazy-load-templates',
        priority: 'low'
      },
      
      'predictive': {
        trigger: 'user-interaction',
        timing: 'before-interaction',
        method: 'predictive-load',
        priority: 'medium'
      }
    };

    for (const [strategyName, config] of Object.entries(injectionStrategies)) {
      this.injectionHooks.set(strategyName, {
        ...config,
        id: crypto.randomUUID(),
        executions: 0,
        success_rate: 0,
        avg_injection_time: 0
      });
      
      console.log(`  💉 Hook: ${strategyName} (${config.trigger} → ${config.method})`);
    }
  }

  async initializeTemplateCache() {
    console.log('💾 Initializing template cache...');
    
    // Pre-cache critical templates
    const criticalTemplates = Array.from(this.templateRegistry.entries())
      .filter(([_, template]) => template.priority === 'critical')
      .map(([name, _]) => name);

    for (const templateName of criticalTemplates) {
      await this.cacheTemplate(templateName);
    }
    
    console.log(`✅ Template cache initialized (${this.templateCache.size} templates cached)`);
  }

  async cacheTemplate(templateName) {
    const template = this.templateRegistry.get(templateName);
    if (!template) {
      console.log(`❌ Template not found: ${templateName}`);
      return null;
    }

    console.log(`📄 Caching template: ${templateName}`);
    
    // Simulate template compilation/processing
    const compiledTemplate = await this.compileTemplate(template);
    
    const cacheEntry = {
      name: templateName,
      compiled: compiledTemplate,
      cached_at: Date.now(),
      size: template.size_estimate,
      access_count: 0,
      last_accessed: null
    };

    this.templateCache.set(templateName, cacheEntry);
    
    // Update template usage
    template.usage_count++;
    template.last_used = new Date().toISOString();
    
    this.emit('template-cached', { templateName, size: template.size_estimate });
    
    return cacheEntry;
  }

  async compileTemplate(template) {
    // Simulate template compilation
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));
    
    return {
      id: template.id,
      type: template.type,
      components: template.components,
      compiled_at: Date.now(),
      framework_variants: template.frameworks.reduce((variants, framework) => {
        variants[framework] = `compiled-${framework}-template-${Date.now()}`;
        return variants;
      }, {}),
      injection_points: this.generateInjectionPoints(template),
      dependencies: template.apis
    };
  }

  generateInjectionPoints(template) {
    const points = [];
    
    template.components.forEach(component => {
      points.push({
        component,
        selector: `[data-component="${component}"]`,
        priority: template.priority,
        fallback_selector: `.${component}, #${component}`
      });
    });
    
    return points;
  }

  // Main mapping function
  async mapSiteToTemplates(url, pageContent = '', context = {}) {
    console.log(`🗺️ Mapping site to templates: ${url}`);
    
    const matches = [];
    
    for (const [patternName, pattern] of this.mappingPatterns) {
      const confidence = this.calculatePatternMatch(url, pageContent, pattern);
      
      if (confidence >= pattern.confidence_threshold) {
        matches.push({
          pattern: patternName,
          confidence,
          required_templates: pattern.required_templates,
          optional_templates: pattern.optional_templates
        });
        
        // Update pattern stats
        pattern.match_count++;
        pattern.last_matched = Date.now();
        pattern.accuracy_score = (pattern.accuracy_score + confidence) / 2;
      }
    }
    
    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);
    
    if (matches.length > 0) {
      const bestMatch = matches[0];
      console.log(`🎯 Best match: ${bestMatch.pattern} (${(bestMatch.confidence * 100).toFixed(1)}% confidence)`);
      
      // Cache required templates
      for (const templateName of bestMatch.required_templates) {
        if (!this.templateCache.has(templateName)) {
          await this.cacheTemplate(templateName);
        }
      }
      
      return {
        matched_pattern: bestMatch.pattern,
        confidence: bestMatch.confidence,
        required_templates: bestMatch.required_templates,
        optional_templates: bestMatch.optional_templates,
        cached_templates: this.getCachedTemplateNames(),
        injection_strategy: this.selectInjectionStrategy(bestMatch)
      };
    }
    
    console.log('❓ No pattern match found, using fallback templates');
    return this.getFallbackMapping();
  }

  calculatePatternMatch(url, pageContent, pattern) {
    let score = 0;
    let maxScore = 0;
    
    // URL pattern matching (40% weight)
    maxScore += 0.4;
    for (const urlPattern of pattern.url_patterns) {
      if (url.includes(urlPattern)) {
        score += 0.4;
        break;
      }
    }
    
    // Page indicator matching (60% weight)
    maxScore += 0.6;
    if (pageContent) {
      const indicatorMatches = pattern.page_indicators.filter(indicator => 
        pageContent.toLowerCase().includes(indicator.toLowerCase())
      );
      score += (indicatorMatches.length / pattern.page_indicators.length) * 0.6;
    }
    
    return maxScore > 0 ? Math.min(score / maxScore, 1) : 0;
  }

  selectInjectionStrategy(match) {
    if (match.confidence > 0.9) return 'just-in-time';
    if (match.confidence > 0.7) return 'preload';
    return 'predictive';
  }

  getFallbackMapping() {
    return {
      matched_pattern: 'generic',
      confidence: 0.5,
      required_templates: ['nav-header', 'two-column-layout'],
      optional_templates: ['modal-overlay'],
      cached_templates: this.getCachedTemplateNames(),
      injection_strategy: 'lazy'
    };
  }

  getCachedTemplateNames() {
    return Array.from(this.templateCache.keys());
  }

  // Template injection
  async injectTemplates(templateNames, strategy = 'just-in-time', context = {}) {
    console.log(`💉 Injecting templates: ${templateNames.join(', ')} (${strategy})`);
    
    const injectionResults = [];
    
    for (const templateName of templateNames) {
      const result = await this.injectSingleTemplate(templateName, strategy, context);
      injectionResults.push(result);
    }
    
    const hook = this.injectionHooks.get(strategy);
    if (hook) {
      hook.executions++;
      const successCount = injectionResults.filter(r => r.success).length;
      hook.success_rate = (hook.success_rate + (successCount / injectionResults.length)) / 2;
    }
    
    return {
      strategy,
      templates: templateNames,
      results: injectionResults,
      success_count: injectionResults.filter(r => r.success).length,
      total_injection_time: injectionResults.reduce((total, r) => total + r.injection_time, 0)
    };
  }

  async injectSingleTemplate(templateName, strategy, context) {
    const startTime = Date.now();
    
    try {
      // Get template from cache or compile it
      let cacheEntry = this.templateCache.get(templateName);
      if (!cacheEntry) {
        cacheEntry = await this.cacheTemplate(templateName);
      }
      
      if (!cacheEntry) {
        throw new Error(`Template not found: ${templateName}`);
      }
      
      // Update access stats
      cacheEntry.access_count++;
      cacheEntry.last_accessed = Date.now();
      
      // Simulate template injection
      await this.performTemplateInjection(cacheEntry, context);
      
      const injection_time = Date.now() - startTime;
      
      console.log(`  ✅ Injected: ${templateName} (${injection_time}ms)`);
      
      return {
        template: templateName,
        success: true,
        injection_time,
        strategy,
        cache_hit: true
      };
      
    } catch (error) {
      const injection_time = Date.now() - startTime;
      
      console.log(`  ❌ Failed to inject ${templateName}: ${error.message}`);
      
      return {
        template: templateName,
        success: false,
        injection_time,
        strategy,
        error: error.message,
        cache_hit: false
      };
    }
  }

  async performTemplateInjection(cacheEntry, context) {
    // Simulate DOM injection
    await new Promise(resolve => setTimeout(resolve, 10 + Math.random() * 50));
    
    // Log injection details
    this.emit('template-injected', {
      template: cacheEntry.name,
      injection_points: cacheEntry.compiled.injection_points.length,
      context
    });
  }

  getStats() {
    return {
      registered_templates: this.templateRegistry.size,
      cached_templates: this.templateCache.size,
      mapping_patterns: this.mappingPatterns.size,
      injection_hooks: this.injectionHooks.size,
      cache_size: Array.from(this.templateCache.values())
        .reduce((total, entry) => total + entry.size, 0),
      total_injections: Array.from(this.injectionHooks.values())
        .reduce((total, hook) => total + hook.executions, 0)
    };
  }

  // CLI interface
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'status':
        const stats = this.getStats();
        console.log('📊 Template Mapping Layer Status:');
        console.log(`  📚 Registered Templates: ${stats.registered_templates}`);
        console.log(`  💾 Cached Templates: ${stats.cached_templates}`);
        console.log(`  🎯 Mapping Patterns: ${stats.mapping_patterns}`);
        console.log(`  💉 Injection Hooks: ${stats.injection_hooks}`);
        console.log(`  📏 Cache Size: ${(stats.cache_size / 1024).toFixed(1)}KB`);
        console.log(`  📈 Total Injections: ${stats.total_injections}`);
        break;
        
      case 'map':
        const url = args[1] || 'https://example.com/shop';
        const mapping = await this.mapSiteToTemplates(url);
        console.log(`🗺️ Template mapping for ${url}:`);
        console.log(`  Pattern: ${mapping.matched_pattern}`);
        console.log(`  Confidence: ${(mapping.confidence * 100).toFixed(1)}%`);
        console.log(`  Required: ${mapping.required_templates.join(', ')}`);
        console.log(`  Optional: ${mapping.optional_templates.join(', ')}`);
        console.log(`  Strategy: ${mapping.injection_strategy}`);
        break;
        
      case 'inject':
        const templates = args.slice(1) || ['nav-header'];
        const result = await this.injectTemplates(templates);
        console.log(`💉 Injection result:`);
        console.log(`  Success: ${result.success_count}/${templates.length}`);
        console.log(`  Time: ${result.total_injection_time}ms`);
        break;
        
      case 'cache':
        console.log('💾 Template Cache:');
        for (const [name, entry] of this.templateCache) {
          const age = Math.floor((Date.now() - entry.cached_at) / 1000);
          console.log(`  ${name} - ${(entry.size / 1024).toFixed(1)}KB (${age}s old, ${entry.access_count} accesses)`);
        }
        break;
        
      case 'demo':
        console.log('🎬 Running template mapping demo...');
        const demoSites = [
          'https://shop.example.com/products',
          'https://app.example.com/dashboard',
          'https://blog.example.com/posts'
        ];
        
        for (const site of demoSites) {
          const mapping = await this.mapSiteToTemplates(site);
          await this.injectTemplates(mapping.required_templates.slice(0, 2));
        }
        
        console.log('✅ Demo complete');
        break;

      default:
        console.log(`
📋🗺️ Template Mapping Layer

Usage:
  node template-mapping-layer.js status    # Show system status
  node template-mapping-layer.js map       # Map URL to templates
  node template-mapping-layer.js inject    # Test template injection
  node template-mapping-layer.js cache     # Show template cache
  node template-mapping-layer.js demo      # Run demo

🗺️ Features:
  • Smart site pattern recognition
  • Template registry and caching
  • Predictive template injection
  • Multiple injection strategies
  • Real-time template mapping

📋 Maps any site to the right templates automatically.
        `);
    }
  }
}

// Export for use as module
module.exports = TemplateMappingLayer;

// Run CLI if called directly
if (require.main === module) {
  const templateMapper = new TemplateMappingLayer();
  templateMapper.cli().catch(console.error);
}