/**
 * AI Analysis Service - Main entry point for AI-powered document analysis
 */

const EventEmitter = require('events');
const DocumentAnalyzer = require('./DocumentAnalyzer');
const path = require('path');
const fs = require('fs').promises;

class AIAnalysisService extends EventEmitter {
  constructor(eventRouter, actionRegistry, options = {}) {
    super();
    this.eventRouter = eventRouter;
    this.actionRegistry = actionRegistry;
    
    this.options = {
      tempDirectory: options.tempDirectory || '/tmp/ai-analysis',
      enableMetrics: options.enableMetrics !== false,
      enableCaching: options.enableCaching !== false,
      logLevel: options.logLevel || 'info',
      ...options
    };

    // Initialize document analyzer
    this.documentAnalyzer = new DocumentAnalyzer(this.eventRouter, {
      maxConcurrentAnalyses: options.maxConcurrentAnalyses || 3,
      parser: {
        chunkSize: 1024 * 1024, // 1MB chunks
        maxMemoryUsage: 100 * 1024 * 1024, // 100MB max
        enableProgressTracking: true,
        enableContentExtraction: true
      },
      ai: {
        enableOllama: options.enableOllama !== false,
        enableCloudFallback: options.enableCloudFallback !== false,
        confidenceThreshold: options.confidenceThreshold || 0.7,
        costBudget: options.costBudget || 5.0,
        ollama: {
          baseUrl: options.ollamaUrl || 'http://localhost:11434',
          defaultModel: 'mistral',
          timeout: 30000
        }
      }
    });

    // Service state
    this.isInitialized = false;
    this.startTime = Date.now();
    
    // Metrics
    this.serviceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      uptime: 0
    };

    this.setupEventHandlers();
  }

  /**
   * Initialize the AI Analysis Service
   */
  async initialize() {
    console.log('🚀 Initializing AI Analysis Service...');

    try {
      // Create temp directory if needed
      await this.ensureTempDirectory();

      // Initialize document analyzer
      await this.documentAnalyzer.initialize();

      // Register actions with action registry
      await this.registerActions();

      // Setup service endpoints
      await this.setupServiceEndpoints();

      this.isInitialized = true;
      console.log('✅ AI Analysis Service initialized successfully');

      this.emit('service:initialized', {
        timestamp: new Date().toISOString(),
        components: ['DocumentAnalyzer', 'ActionRegistry'],
        endpoints: ['parseDocument', 'analyzeContent', 'extractInsights']
      });

    } catch (error) {
      console.error('❌ Failed to initialize AI Analysis Service:', error);
      throw error;
    }
  }

  /**
   * Register actions with the action registry
   */
  async registerActions() {
    console.log('📋 Registering AI analysis actions...');

    // Register document parsing action
    await this.actionRegistry.registerAction({
      id: 'parseDocument',
      name: 'Parse Document',
      description: 'Parse document and extract structured content',
      category: 'ai_analysis',
      version: '1.0.0',
      parameters: {
        documentId: { type: 'string', required: true },
        filename: { type: 'string', required: true },
        format: { type: 'string', required: false },
        analysisType: { type: 'string', required: false, default: 'comprehensive' }
      },
      execute: async (params, context) => {
        return this.handleParseDocument(params, context);
      },
      rollback: async (params, context, rollbackData) => {
        return this.handleRollbackParsing(params, context, rollbackData);
      },
      config: {
        timeout: 300000, // 5 minutes
        retryCount: 2,
        rollbackable: true,
        priority: 'high'
      }
    });

    // Register content analysis action
    await this.actionRegistry.registerAction({
      id: 'analyzeContent',
      name: 'Analyze Content',
      description: 'Perform AI analysis on parsed document content',
      category: 'ai_analysis',
      version: '1.0.0',
      parameters: {
        content: { type: 'object', required: true },
        analysisType: { type: 'string', required: false, default: 'comprehensive' },
        options: { type: 'object', required: false }
      },
      execute: async (params, context) => {
        return this.handleAnalyzeContent(params, context);
      },
      config: {
        timeout: 180000, // 3 minutes
        retryCount: 2,
        rollbackable: false,
        priority: 'medium'
      }
    });

    // Register insight extraction action
    await this.actionRegistry.registerAction({
      id: 'extractInsights',
      name: 'Extract Insights',
      description: 'Extract actionable insights from analysis results',
      category: 'ai_analysis',
      version: '1.0.0',
      parameters: {
        analysisResult: { type: 'object', required: true },
        insightTypes: { type: 'array', required: false },
        options: { type: 'object', required: false }
      },
      execute: async (params, context) => {
        return this.handleExtractInsights(params, context);
      },
      config: {
        timeout: 60000, // 1 minute
        retryCount: 1,
        rollbackable: false,
        priority: 'low'
      }
    });

    console.log('✅ AI analysis actions registered');
  }

  /**
   * Setup service endpoints for HTTP access
   */
  async setupServiceEndpoints() {
    // This would integrate with the HTTP server if needed
    console.log('🌐 AI Analysis Service endpoints ready');
  }

  /**
   * Handle document parsing action
   */
  async handleParseDocument(params, context) {
    const startTime = Date.now();
    this.serviceMetrics.totalRequests++;

    try {
      const { documentId, filename, format, analysisType } = params;
      
      console.log(`📄 Processing document parsing request: ${filename}`);

      // For now, we'll simulate finding the file path
      // In a real implementation, this would look up the file location
      const filePath = this.resolveDocumentPath(documentId, filename);

      // Perform document analysis
      const result = await this.documentAnalyzer.analyzeDocument(filePath, {
        analysisType,
        parser: { format }
      });

      const duration = Date.now() - startTime;
      this.updateMetrics(duration, true);

      console.log(`✅ Document parsing completed: ${filename} (${duration}ms)`);

      // Publish success event
      await this.publishEvent('ai.analysis.completed', {
        documentId,
        filename,
        analysisId: result.analysisId,
        processingTime: duration,
        executedBy: context.executedBy
      });

      return {
        success: true,
        result: {
          analysisId: result.analysisId,
          parsing: result.parsing,
          analysis: result.analysis,
          insights: result.insights,
          recommendations: result.recommendations,
          metadata: result.metadata
        },
        executionTime: duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics(duration, false);

      console.error(`❌ Document parsing failed: ${error.message}`);

      // Publish error event
      await this.publishEvent('ai.analysis.failed', {
        documentId: params.documentId,
        filename: params.filename,
        error: error.message,
        executedBy: context.executedBy
      });

      throw error;
    }
  }

  /**
   * Handle content analysis action
   */
  async handleAnalyzeContent(params, context) {
    const startTime = Date.now();
    this.serviceMetrics.totalRequests++;

    try {
      const { content, analysisType, options } = params;
      
      console.log(`🧠 Processing content analysis request: ${analysisType}`);

      // Create a parsed document structure for the analyzer
      const parsedDocument = {
        fileName: 'direct_content',
        format: 'direct',
        fileSize: JSON.stringify(content).length,
        result: content,
        documentId: context.correlationId || 'direct'
      };

      // Perform AI analysis
      const result = await this.documentAnalyzer.aiAnalyzer.analyzeDocument(
        parsedDocument, 
        analysisType
      );

      const duration = Date.now() - startTime;
      this.updateMetrics(duration, true);

      console.log(`✅ Content analysis completed: ${analysisType} (${duration}ms)`);

      return {
        success: true,
        result: {
          analysis: result.summary,
          confidence: result.confidence,
          insights: result.insights,
          metadata: result.metadata
        },
        executionTime: duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics(duration, false);

      console.error(`❌ Content analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle insight extraction action
   */
  async handleExtractInsights(params, context) {
    const startTime = Date.now();
    this.serviceMetrics.totalRequests++;

    try {
      const { analysisResult, insightTypes, options } = params;
      
      console.log(`💡 Processing insight extraction request`);

      // Extract insights based on analysis result
      const insights = await this.extractCustomInsights(analysisResult, insightTypes, options);

      const duration = Date.now() - startTime;
      this.updateMetrics(duration, true);

      console.log(`✅ Insight extraction completed: ${insights.length} insights (${duration}ms)`);

      return {
        success: true,
        result: {
          insights,
          count: insights.length,
          categories: [...new Set(insights.map(i => i.category))]
        },
        executionTime: duration
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics(duration, false);

      console.error(`❌ Insight extraction failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Handle rollback for parsing operations
   */
  async handleRollbackParsing(params, context, rollbackData) {
    console.log(`🔄 Rolling back document parsing: ${params.filename}`);

    try {
      // Cleanup any temporary files or cached results
      if (rollbackData.tempFiles) {
        for (const file of rollbackData.tempFiles) {
          try {
            await fs.unlink(file);
            console.log(`🗑️ Cleaned up temp file: ${file}`);
          } catch (error) {
            console.warn(`⚠️ Failed to cleanup temp file: ${file}`);
          }
        }
      }

      // Remove from analysis cache if applicable
      if (rollbackData.analysisId) {
        // Implementation would remove from cache
        console.log(`🗑️ Cleaned up analysis cache: ${rollbackData.analysisId}`);
      }

      return { success: true, message: 'Parsing rollback completed' };

    } catch (error) {
      console.error(`❌ Rollback failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract custom insights based on types
   */
  async extractCustomInsights(analysisResult, insightTypes = [], options = {}) {
    const insights = [];

    // If no specific types requested, extract all
    if (insightTypes.length === 0) {
      insightTypes = ['technical', 'business', 'risks', 'opportunities'];
    }

    for (const type of insightTypes) {
      const typeInsights = await this.extractInsightsByType(analysisResult, type, options);
      insights.push(...typeInsights);
    }

    return insights;
  }

  /**
   * Extract insights by specific type
   */
  async extractInsightsByType(analysisResult, type, options) {
    const insights = [];

    switch (type) {
      case 'technical':
        if (analysisResult.analysis?.summary?.architecture) {
          const arch = analysisResult.analysis.summary.architecture;
          insights.push({
            type: 'technical_architecture',
            category: 'technical',
            description: `Recommended architecture: ${arch.pattern}`,
            value: arch.pattern,
            confidence: analysisResult.analysis.confidence,
            recommendations: arch.technologies ? 
              [`Use ${arch.technologies.join(', ')} stack`] : []
          });
        }
        break;

      case 'business':
        if (analysisResult.analysis?.summary?.estimates) {
          const est = analysisResult.analysis.summary.estimates;
          insights.push({
            type: 'business_estimate',
            category: 'business',
            description: `Development estimate: ${est.developmentTime}`,
            value: est,
            confidence: analysisResult.analysis.confidence,
            recommendations: est.budget ? 
              [`Budget range: ${est.budget}`] : []
          });
        }
        break;

      case 'risks':
        const complexity = analysisResult.analysis?.summary?.complexity;
        if (complexity && complexity > 7) {
          insights.push({
            type: 'complexity_risk',
            category: 'risks',
            description: `High complexity project (${complexity}/10)`,
            value: complexity,
            severity: 'high',
            recommendations: [
              'Consider phased implementation',
              'Allocate additional time for testing',
              'Plan for iterative development'
            ]
          });
        }
        break;

      case 'opportunities':
        if (analysisResult.recommendations) {
          const opportunities = analysisResult.recommendations
            .filter(rec => rec.type === 'enhancement')
            .map(rec => ({
              type: 'enhancement_opportunity',
              category: 'opportunities',
              description: rec.description,
              value: rec.priority,
              potential: 'medium',
              recommendations: [rec.description]
            }));
          insights.push(...opportunities);
        }
        break;
    }

    return insights;
  }

  /**
   * Resolve document path from ID and filename
   */
  resolveDocumentPath(documentId, filename) {
    // In a real implementation, this would look up the actual file location
    // For now, we'll create a path in the temp directory
    return path.join(this.options.tempDirectory, `${documentId}_${filename}`);
  }

  /**
   * Ensure temp directory exists
   */
  async ensureTempDirectory() {
    try {
      await fs.access(this.options.tempDirectory);
    } catch (error) {
      await fs.mkdir(this.options.tempDirectory, { recursive: true });
      console.log(`📁 Created temp directory: ${this.options.tempDirectory}`);
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Forward document analyzer events
    this.documentAnalyzer.on('document:analysis:started', (data) => {
      this.emit('analysis:started', data);
    });

    this.documentAnalyzer.on('document:analysis:completed', (data) => {
      this.emit('analysis:completed', data);
    });

    this.documentAnalyzer.on('document:analysis:failed', (data) => {
      this.emit('analysis:failed', data);
    });

    this.documentAnalyzer.on('document:parsing:progress', (data) => {
      this.emit('parsing:progress', data);
    });
  }

  /**
   * Update service metrics
   */
  updateMetrics(duration, success) {
    if (success) {
      this.serviceMetrics.successfulRequests++;
    } else {
      this.serviceMetrics.failedRequests++;
    }

    // Update average response time
    const totalRequests = this.serviceMetrics.successfulRequests + this.serviceMetrics.failedRequests;
    this.serviceMetrics.averageResponseTime = 
      (this.serviceMetrics.averageResponseTime * (totalRequests - 1) + duration) / totalRequests;
  }

  /**
   * Publish event through event router
   */
  async publishEvent(eventType, data) {
    if (this.eventRouter) {
      try {
        await this.eventRouter.publish(eventType, data, {
          source: 'ai-analysis-service'
        });
      } catch (error) {
        console.error(`Failed to publish event ${eventType}:`, error);
      }
    }
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      uptime: Date.now() - this.startTime,
      metrics: {
        ...this.serviceMetrics,
        uptime: Date.now() - this.startTime
      },
      components: {
        documentAnalyzer: this.documentAnalyzer ? 'ready' : 'not_initialized'
      },
      actions: ['parseDocument', 'analyzeContent', 'extractInsights']
    };
  }

  /**
   * Get detailed metrics
   */
  getMetrics() {
    const baseMetrics = {
      ...this.serviceMetrics,
      uptime: Date.now() - this.startTime,
      successRate: this.serviceMetrics.totalRequests > 0 ? 
        (this.serviceMetrics.successfulRequests / this.serviceMetrics.totalRequests * 100).toFixed(2) : 0
    };

    if (this.documentAnalyzer) {
      return {
        ...baseMetrics,
        analyzer: this.documentAnalyzer.getMetrics()
      };
    }

    return baseMetrics;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const analyzerHealth = this.documentAnalyzer ? 
        await this.documentAnalyzer.healthCheck() : 
        { healthy: false, error: 'Not initialized' };

      return {
        healthy: this.isInitialized && analyzerHealth.healthy,
        service: 'ai-analysis-service',
        version: '1.0.0',
        uptime: Date.now() - this.startTime,
        components: {
          analyzer: analyzerHealth
        },
        metrics: this.getMetrics()
      };

    } catch (error) {
      return {
        healthy: false,
        service: 'ai-analysis-service',
        error: error.message,
        uptime: Date.now() - this.startTime
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🔄 Shutting down AI Analysis Service...');

    try {
      if (this.documentAnalyzer) {
        await this.documentAnalyzer.cleanup();
      }

      this.isInitialized = false;
      this.removeAllListeners();

      console.log('✅ AI Analysis Service shutdown completed');

    } catch (error) {
      console.error('❌ AI Analysis Service shutdown error:', error);
      throw error;
    }
  }
}

module.exports = AIAnalysisService;