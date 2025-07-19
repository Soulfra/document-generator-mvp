/**
 * Progressive AI Analyzer - Tries Ollama first, then cloud APIs as fallback
 */

const EventEmitter = require('events');
const OllamaClient = require('./OllamaClient');

class ProgressiveAIAnalyzer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      enableOllama: options.enableOllama !== false,
      enableCloudFallback: options.enableCloudFallback !== false,
      confidenceThreshold: options.confidenceThreshold || 0.7,
      maxRetries: options.maxRetries || 2,
      costBudget: options.costBudget || 1.0, // USD per analysis
      ...options
    };

    // Initialize AI clients
    this.ollama = new OllamaClient(options.ollama);
    this.cloudClients = new Map();
    
    // Cost tracking
    this.costTracker = {
      totalSpent: 0,
      requestCount: 0,
      successfulOllamaRequests: 0,
      cloudFallbacks: 0
    };

    // Analysis cache
    this.cache = new Map();
    this.cacheHits = 0;

    this.setupCloudClients();
  }

  /**
   * Initialize the analyzer
   */
  async initialize() {
    console.log('🧠 Initializing Progressive AI Analyzer...');

    try {
      // Initialize Ollama if enabled
      if (this.options.enableOllama) {
        try {
          await this.ollama.initialize();
          console.log('✅ Ollama client ready');
        } catch (error) {
          console.warn('⚠️ Ollama not available, cloud-only mode:', error.message);
          this.options.enableOllama = false;
        }
      }

      // Test cloud clients if enabled
      if (this.options.enableCloudFallback) {
        await this.testCloudClients();
      }

      console.log('✅ Progressive AI Analyzer initialized');
      
      this.emit('initialized', {
        ollamaAvailable: this.options.enableOllama,
        cloudAvailable: this.options.enableCloudFallback,
        models: this.getAvailableModels()
      });

    } catch (error) {
      console.error('❌ Failed to initialize Progressive AI Analyzer:', error);
      throw error;
    }
  }

  /**
   * Setup cloud AI clients
   */
  setupCloudClients() {
    // Placeholder for cloud clients (would integrate with actual APIs)
    this.cloudClients.set('anthropic', {
      name: 'Claude',
      costPerToken: 0.015,
      available: false,
      capabilities: ['analysis', 'reasoning', 'code', 'vision']
    });

    this.cloudClients.set('openai', {
      name: 'GPT-4',
      costPerToken: 0.03,
      available: false,
      capabilities: ['analysis', 'reasoning', 'code', 'vision', 'audio']
    });
  }

  /**
   * Test cloud client availability
   */
  async testCloudClients() {
    console.log('🌩️ Testing cloud AI clients...');
    
    // In a real implementation, this would test actual API keys
    // For now, just simulate availability based on environment
    const hasAnthropicKey = process.env.ANTHROPIC_API_KEY;
    const hasOpenAIKey = process.env.OPENAI_API_KEY;

    if (hasAnthropicKey) {
      this.cloudClients.get('anthropic').available = true;
      console.log('✅ Anthropic Claude available');
    }

    if (hasOpenAIKey) {
      this.cloudClients.get('openai').available = true;
      console.log('✅ OpenAI GPT-4 available');
    }

    const availableClients = Array.from(this.cloudClients.values())
      .filter(client => client.available);

    console.log(`📊 ${availableClients.length} cloud AI clients available`);
  }

  /**
   * Analyze document with progressive enhancement
   */
  async analyzeDocument(parsedDocument, analysisType = 'comprehensive') {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Starting ${analysisType} analysis for: ${parsedDocument.fileName}`);

      // Check cache first
      const cacheKey = this.generateCacheKey(parsedDocument, analysisType);
      const cached = this.getCachedResult(cacheKey);
      if (cached) {
        console.log('💾 Using cached analysis result');
        return cached;
      }

      // Step 1: Try Ollama first
      let result = null;
      let confidence = 0;
      let provider = null;

      if (this.options.enableOllama) {
        try {
          result = await this.analyzeWithOllama(parsedDocument, analysisType);
          confidence = this.assessConfidence(result, parsedDocument);
          provider = 'ollama';
          
          this.costTracker.successfulOllamaRequests++;
          
          console.log(`✅ Ollama analysis completed (confidence: ${confidence.toFixed(2)})`);

        } catch (error) {
          console.warn('⚠️ Ollama analysis failed:', error.message);
        }
      }

      // Step 2: Use cloud fallback if confidence is low or Ollama failed
      if ((!result || confidence < this.options.confidenceThreshold) && this.options.enableCloudFallback) {
        console.log(`🌩️ Using cloud fallback (${!result ? 'ollama failed' : 'low confidence'})`);
        
        try {
          const cloudResult = await this.analyzeWithCloud(parsedDocument, analysisType, result);
          if (cloudResult) {
            result = cloudResult;
            confidence = 0.95; // Cloud results generally more reliable
            provider = cloudResult.provider;
            this.costTracker.cloudFallbacks++;
          }
        } catch (error) {
          console.error('❌ Cloud analysis failed:', error.message);
        }
      }

      if (!result) {
        throw new Error('All AI analysis methods failed');
      }

      // Enhance result with metadata
      const enhancedResult = {
        ...result,
        metadata: {
          ...result.metadata,
          analysisType,
          provider,
          confidence,
          processingTime: Date.now() - startTime,
          cost: this.calculateCost(result, provider),
          timestamp: new Date().toISOString()
        }
      };

      // Cache the result
      this.cacheResult(cacheKey, enhancedResult);

      // Update tracking
      this.costTracker.requestCount++;
      this.costTracker.totalSpent += enhancedResult.metadata.cost;

      this.emit('analysis:completed', {
        documentId: parsedDocument.documentId,
        provider,
        confidence,
        processingTime: enhancedResult.metadata.processingTime,
        cost: enhancedResult.metadata.cost
      });

      console.log(`✅ Document analysis completed using ${provider}`);
      return enhancedResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error(`❌ Document analysis failed after ${duration}ms:`, error);
      
      this.emit('analysis:failed', {
        documentId: parsedDocument.documentId,
        error: error.message,
        duration
      });

      throw error;
    }
  }

  /**
   * Analyze with Ollama
   */
  async analyzeWithOllama(parsedDocument, analysisType) {
    const prompt = this.buildAnalysisPrompt(parsedDocument, analysisType);
    
    const model = this.selectOllamaModel(analysisType);
    
    const result = await this.ollama.generate(prompt, {
      model,
      temperature: 0.3, // Lower temperature for analysis
      max_tokens: 2048,
      task: analysisType
    });

    return this.parseAnalysisResult(result.text, {
      provider: 'ollama',
      model: result.model,
      tokens: result.tokens,
      duration: result.duration
    });
  }

  /**
   * Analyze with cloud AI
   */
  async analyzeWithCloud(parsedDocument, analysisType, ollamaResult = null) {
    // Select best available cloud client
    const client = this.selectBestCloudClient(analysisType);
    if (!client) {
      throw new Error('No cloud AI clients available');
    }

    // Build enhanced prompt if we have Ollama result
    let prompt = this.buildAnalysisPrompt(parsedDocument, analysisType);
    if (ollamaResult) {
      prompt += `\n\nPrevious analysis to improve upon:\n${JSON.stringify(ollamaResult.summary, null, 2)}`;
    }

    // Simulate cloud API call (in real implementation, would call actual APIs)
    const result = await this.simulateCloudAnalysis(prompt, client, analysisType);

    return this.parseAnalysisResult(result.text, {
      provider: client.name.toLowerCase(),
      model: client.model,
      tokens: result.tokens,
      duration: result.duration,
      cost: result.cost
    });
  }

  /**
   * Build analysis prompt based on document and type
   */
  buildAnalysisPrompt(parsedDocument, analysisType) {
    const basePrompt = `
Analyze this document and extract structured information:

Document: ${parsedDocument.fileName}
Format: ${parsedDocument.format}
Size: ${parsedDocument.fileSize} bytes

Content Summary:
${JSON.stringify(parsedDocument.result?.metadata || {}, null, 2)}

Content Preview:
${this.getContentPreview(parsedDocument)}

`;

    switch (analysisType) {
      case 'business':
        return basePrompt + `
Extract business information:
1. Problem statement and market opportunity
2. Proposed solution and value proposition  
3. Target market and customer segments
4. Revenue model and pricing strategy
5. Competitive landscape
6. Key success metrics
7. Risk assessment

Return as JSON with keys: problem, solution, market, revenue, competition, metrics, risks`;

      case 'technical':
        return basePrompt + `
Extract technical requirements:
1. Functional requirements (what the system should do)
2. Non-functional requirements (performance, scalability, security)
3. Technology stack preferences
4. API and integration requirements
5. Database and data requirements
6. User interface requirements
7. Deployment and infrastructure needs

Return as JSON with keys: functional, nonFunctional, technology, apis, database, ui, deployment`;

      case 'features':
        return basePrompt + `
Extract feature requirements:
1. Core features (must-have functionality)
2. Secondary features (nice-to-have)
3. User stories and use cases
4. Feature priorities and dependencies
5. User roles and permissions
6. Integration requirements

Return as JSON with keys: coreFeatures, secondaryFeatures, userStories, priorities, roles, integrations`;

      case 'comprehensive':
      default:
        return basePrompt + `
Provide comprehensive analysis including:
1. Document type and intent
2. Key requirements and specifications
3. Technical feasibility assessment
4. Recommended architecture and technologies
5. Implementation complexity (1-10 scale)
6. Time and resource estimates
7. Next steps and recommendations

Return as JSON with keys: documentType, intent, requirements, architecture, complexity, estimates, recommendations`;
    }
  }

  /**
   * Get content preview for analysis
   */
  getContentPreview(parsedDocument) {
    const content = parsedDocument.result?.content;
    
    if (typeof content === 'string') {
      return content.slice(0, 2000) + (content.length > 2000 ? '...' : '');
    }
    
    if (content?.messages) {
      // Chat log preview
      const messages = content.messages.slice(0, 10);
      return messages.map(m => `${m.sender}: ${m.text}`).join('\n');
    }
    
    if (Array.isArray(content)) {
      return JSON.stringify(content.slice(0, 5), null, 2);
    }
    
    return JSON.stringify(content, null, 2).slice(0, 2000);
  }

  /**
   * Select best Ollama model for analysis type
   */
  selectOllamaModel(analysisType) {
    const modelPreferences = {
      'business': 'mistral',
      'technical': 'codellama',
      'features': 'mistral',
      'comprehensive': 'mistral'
    };

    return this.ollama.selectBestModel(modelPreferences[analysisType] || 'analysis');
  }

  /**
   * Select best cloud client for analysis
   */
  selectBestCloudClient(analysisType) {
    const availableClients = Array.from(this.cloudClients.entries())
      .filter(([, client]) => client.available)
      .map(([id, client]) => ({ id, ...client }));

    if (availableClients.length === 0) {
      return null;
    }

    // Prefer Anthropic for analysis, OpenAI for code
    if (analysisType === 'technical' || analysisType === 'features') {
      const openai = availableClients.find(c => c.id === 'openai');
      if (openai) return { ...openai, model: 'gpt-4' };
    }

    const anthropic = availableClients.find(c => c.id === 'anthropic');
    if (anthropic) return { ...anthropic, model: 'claude-3-opus' };

    // Return first available
    return { ...availableClients[0], model: availableClients[0].id === 'openai' ? 'gpt-4' : 'claude-3-opus' };
  }

  /**
   * Simulate cloud analysis (placeholder for real implementation)
   */
  async simulateCloudAnalysis(prompt, client, analysisType) {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    const tokens = this.estimateTokens(prompt) + 500;
    const cost = tokens * client.costPerToken / 1000;

    return {
      text: JSON.stringify({
        documentType: 'business_plan',
        intent: 'create_mvp',
        requirements: {
          functional: ['user authentication', 'data processing', 'reporting'],
          nonFunctional: ['scalability', 'security', 'performance']
        },
        architecture: {
          pattern: 'microservices',
          technologies: ['React', 'Node.js', 'PostgreSQL', 'Docker'],
          deployment: 'cloud'
        },
        complexity: 7,
        estimates: {
          developmentTime: '8-12 weeks',
          teamSize: '3-4 developers',
          budget: '$50k-75k'
        },
        recommendations: [
          'Start with MVP focusing on core features',
          'Use established frameworks and libraries',
          'Implement CI/CD pipeline early',
          'Plan for iterative development'
        ]
      }, null, 2),
      tokens,
      duration: 3000,
      cost
    };
  }

  /**
   * Parse analysis result from AI response
   */
  parseAnalysisResult(text, metadata) {
    try {
      // Try to parse as JSON first
      let parsed;
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: create structured result from text
        parsed = {
          summary: text,
          structured: false
        };
      }

      return {
        summary: parsed,
        confidence: this.assessResultQuality(parsed),
        insights: this.extractInsights(parsed),
        metadata
      };

    } catch (error) {
      console.warn('⚠️ Failed to parse AI analysis result, using raw text');
      return {
        summary: { rawText: text },
        confidence: 0.3,
        insights: [],
        metadata: { ...metadata, parseError: error.message }
      };
    }
  }

  /**
   * Assess confidence in analysis result
   */
  assessConfidence(result, parsedDocument) {
    if (!result || !result.summary) return 0;

    let confidence = 0.5; // Base confidence

    // Check if result is structured
    if (typeof result.summary === 'object' && !result.summary.rawText) {
      confidence += 0.2;
    }

    // Check for key fields based on document type
    const summary = result.summary;
    if (summary.requirements || summary.features || summary.problem) {
      confidence += 0.2;
    }

    // Check content relevance
    if (summary.documentType || summary.intent) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Assess result quality
   */
  assessResultQuality(parsed) {
    if (!parsed || typeof parsed !== 'object') return 0.3;

    let score = 0.5;

    // Check for completeness
    const expectedFields = ['requirements', 'architecture', 'complexity', 'recommendations'];
    const presentFields = expectedFields.filter(field => parsed[field]);
    score += (presentFields.length / expectedFields.length) * 0.3;

    // Check for detail level
    if (parsed.requirements && Array.isArray(parsed.requirements.functional)) {
      score += 0.1;
    }

    // Check for actionable recommendations
    if (parsed.recommendations && Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Extract insights from analysis
   */
  extractInsights(parsed) {
    const insights = [];

    if (parsed.complexity) {
      insights.push({
        type: 'complexity_assessment',
        value: parsed.complexity,
        description: `Project complexity rated ${parsed.complexity}/10`
      });
    }

    if (parsed.estimates?.developmentTime) {
      insights.push({
        type: 'time_estimate',
        value: parsed.estimates.developmentTime,
        description: `Estimated development time: ${parsed.estimates.developmentTime}`
      });
    }

    if (parsed.architecture?.pattern) {
      insights.push({
        type: 'architecture_recommendation',
        value: parsed.architecture.pattern,
        description: `Recommended architecture: ${parsed.architecture.pattern}`
      });
    }

    return insights;
  }

  /**
   * Generate cache key for analysis
   */
  generateCacheKey(parsedDocument, analysisType) {
    const content = JSON.stringify(parsedDocument.result?.metadata || {});
    const hash = require('crypto').createHash('md5').update(content + analysisType).digest('hex');
    return `analysis:${hash}`;
  }

  /**
   * Get cached analysis result
   */
  getCachedResult(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < 3600000) { // 1 hour TTL
      this.cacheHits++;
      return cached.result;
    }
    return null;
  }

  /**
   * Cache analysis result
   */
  cacheResult(cacheKey, result) {
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    // Limit cache size
    if (this.cache.size > 100) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Calculate cost for analysis
   */
  calculateCost(result, provider) {
    if (provider === 'ollama') return 0;

    const tokens = result.metadata?.tokens || 1000;
    const client = Array.from(this.cloudClients.values()).find(c => 
      c.name.toLowerCase() === provider
    );

    return client ? (tokens * client.costPerToken / 1000) : 0;
  }

  /**
   * Estimate token count
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    const models = [];

    if (this.options.enableOllama) {
      models.push(...this.ollama.getAvailableModels());
    }

    if (this.options.enableCloudFallback) {
      Array.from(this.cloudClients.entries())
        .filter(([, client]) => client.available)
        .forEach(([id, client]) => {
          models.push({
            name: client.name,
            provider: 'cloud',
            type: id,
            capabilities: client.capabilities,
            costPerToken: client.costPerToken
          });
        });
    }

    return models;
  }

  /**
   * Get analyzer metrics
   */
  getMetrics() {
    return {
      ...this.costTracker,
      cacheHits: this.cacheHits,
      cacheSize: this.cache.size,
      ollamaMetrics: this.ollama.getMetrics(),
      cloudClients: Array.from(this.cloudClients.entries()).map(([id, client]) => ({
        id,
        name: client.name,
        available: client.available,
        costPerToken: client.costPerToken
      }))
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    const health = {
      healthy: true,
      services: {}
    };

    // Check Ollama
    if (this.options.enableOllama) {
      try {
        const ollamaHealth = await this.ollama.healthCheck();
        health.services.ollama = {
          available: ollamaHealth,
          models: this.ollama.getAvailableModels().length
        };
      } catch (error) {
        health.services.ollama = { available: false, error: error.message };
        health.healthy = false;
      }
    }

    // Check cloud services
    if (this.options.enableCloudFallback) {
      const availableClients = Array.from(this.cloudClients.values())
        .filter(client => client.available);
      
      health.services.cloud = {
        available: availableClients.length > 0,
        clients: availableClients.length
      };

      if (availableClients.length === 0) {
        health.healthy = false;
      }
    }

    return health;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('🧹 Cleaning up Progressive AI Analyzer...');
    
    await this.ollama.cleanup();
    this.cache.clear();
    this.removeAllListeners();
  }
}

module.exports = ProgressiveAIAnalyzer;