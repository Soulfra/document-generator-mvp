/**
 * Document Analyzer - Main service for processing documents through AI pipeline
 */

const EventEmitter = require('events');
const StreamingDocumentParser = require('../parsers/StreamingDocumentParser');
const ProgressiveAIAnalyzer = require('./ProgressiveAIAnalyzer');
const { v4: uuidv4 } = require('uuid');

class DocumentAnalyzer extends EventEmitter {
  constructor(eventRouter, options = {}) {
    super();
    this.eventRouter = eventRouter;
    this.options = {
      maxConcurrentAnalyses: options.maxConcurrentAnalyses || 5,
      enableDetailedLogging: options.enableDetailedLogging !== false,
      autoCleanup: options.autoCleanup !== false,
      cleanupInterval: options.cleanupInterval || 3600000, // 1 hour
      ...options
    };

    // Initialize components
    this.documentParser = new StreamingDocumentParser(options.parser);
    this.aiAnalyzer = new ProgressiveAIAnalyzer(options.ai);

    // State tracking
    this.activeAnalyses = new Map();
    this.analysisQueue = [];
    this.processingQueue = false;
    
    // Metrics
    this.metrics = {
      totalAnalyses: 0,
      successfulAnalyses: 0,
      failedAnalyses: 0,
      averageProcessingTime: 0,
      totalProcessingTime: 0,
      peakConcurrentAnalyses: 0
    };

    // Setup event handlers
    this.setupEventHandlers();
    
    // Setup cleanup if enabled
    if (this.options.autoCleanup) {
      this.setupCleanup();
    }
  }

  /**
   * Initialize the document analyzer
   */
  async initialize() {
    console.log('📊 Initializing Document Analyzer...');

    try {
      // Initialize AI analyzer
      await this.aiAnalyzer.initialize();

      // Setup parser event handlers
      this.documentParser.on('parse:started', (data) => {
        this.emit('document:parsing:started', data);
      });

      this.documentParser.on('parse:progress', (data) => {
        this.emit('document:parsing:progress', data);
      });

      this.documentParser.on('parse:completed', (data) => {
        this.emit('document:parsing:completed', data);
      });

      this.documentParser.on('parse:failed', (data) => {
        this.emit('document:parsing:failed', data);
      });

      // Setup AI analyzer event handlers
      this.aiAnalyzer.on('analysis:completed', (data) => {
        this.emit('document:analysis:completed', data);
      });

      this.aiAnalyzer.on('analysis:failed', (data) => {
        this.emit('document:analysis:failed', data);
      });

      console.log('✅ Document Analyzer initialized successfully');
      
      this.emit('analyzer:initialized', {
        parserReady: true,
        aiReady: true,
        queueCapacity: this.options.maxConcurrentAnalyses
      });

    } catch (error) {
      console.error('❌ Failed to initialize Document Analyzer:', error);
      throw error;
    }
  }

  /**
   * Analyze document end-to-end
   */
  async analyzeDocument(filePath, options = {}) {
    const analysisId = uuidv4();
    const startTime = Date.now();

    try {
      console.log(`🔬 Starting document analysis: ${filePath}`);

      // Create analysis context
      const analysisContext = {
        id: analysisId,
        filePath,
        fileName: require('path').basename(filePath),
        options,
        startTime,
        status: 'queued',
        steps: []
      };

      this.activeAnalyses.set(analysisId, analysisContext);
      this.metrics.totalAnalyses++;

      // Update peak concurrent analyses
      if (this.activeAnalyses.size > this.metrics.peakConcurrentAnalyses) {
        this.metrics.peakConcurrentAnalyses = this.activeAnalyses.size;
      }

      // Emit analysis started event
      this.emit('document:analysis:started', {
        analysisId,
        fileName: analysisContext.fileName,
        queuePosition: this.activeAnalyses.size
      });

      // Publish event to event bus
      if (this.eventRouter) {
        await this.eventRouter.publish('document.analysis.started', {
          analysisId,
          fileName: analysisContext.fileName,
          filePath
        });
      }

      // Check if we need to queue or can process immediately
      if (this.activeAnalyses.size > this.options.maxConcurrentAnalyses) {
        console.log(`📋 Analysis queued: ${analysisContext.fileName} (position ${this.analysisQueue.length + 1})`);
        
        this.analysisQueue.push(analysisId);
        analysisContext.status = 'queued';
        
        return {
          analysisId,
          status: 'queued',
          message: 'Analysis queued due to capacity limits'
        };
      }

      // Process immediately
      const result = await this.processAnalysis(analysisId);
      return result;

    } catch (error) {
      console.error(`❌ Failed to start analysis for ${filePath}:`, error);
      
      const analysisContext = this.activeAnalyses.get(analysisId);
      if (analysisContext) {
        analysisContext.status = 'failed';
        analysisContext.error = error.message;
      }

      this.metrics.failedAnalyses++;
      
      this.emit('document:analysis:failed', {
        analysisId,
        fileName: require('path').basename(filePath),
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Process document analysis
   */
  async processAnalysis(analysisId) {
    const analysisContext = this.activeAnalyses.get(analysisId);
    if (!analysisContext) {
      throw new Error(`Analysis context not found: ${analysisId}`);
    }

    try {
      analysisContext.status = 'processing';
      
      console.log(`🔄 Processing analysis: ${analysisContext.fileName}`);

      // Step 1: Parse document
      analysisContext.steps.push({
        step: 'parsing',
        status: 'started',
        startTime: Date.now()
      });

      const parseResult = await this.documentParser.parseDocument(
        analysisContext.filePath,
        analysisContext.options.parser
      );

      const parseStep = analysisContext.steps[analysisContext.steps.length - 1];
      parseStep.status = 'completed';
      parseStep.endTime = Date.now();
      parseStep.result = {
        format: parseResult.format,
        fileSize: parseResult.fileSize,
        processingTime: parseResult.processingTime
      };

      console.log(`✅ Document parsed: ${analysisContext.fileName} (${parseResult.format})`);

      // Step 2: AI Analysis
      analysisContext.steps.push({
        step: 'ai_analysis',
        status: 'started',
        startTime: Date.now()
      });

      const analysisType = this.determineAnalysisType(parseResult, analysisContext.options);
      const aiResult = await this.aiAnalyzer.analyzeDocument(parseResult, analysisType);

      const aiStep = analysisContext.steps[analysisContext.steps.length - 1];
      aiStep.status = 'completed';
      aiStep.endTime = Date.now();
      aiStep.result = {
        provider: aiResult.metadata.provider,
        confidence: aiResult.metadata.confidence,
        cost: aiResult.metadata.cost
      };

      console.log(`✅ AI analysis completed: ${analysisContext.fileName} (${aiResult.metadata.provider})`);

      // Step 3: Generate insights and recommendations
      analysisContext.steps.push({
        step: 'insight_generation',
        status: 'started',
        startTime: Date.now()
      });

      const insights = await this.generateInsights(parseResult, aiResult);

      const insightStep = analysisContext.steps[analysisContext.steps.length - 1];
      insightStep.status = 'completed';
      insightStep.endTime = Date.now();
      insightStep.result = {
        insightsGenerated: insights.length,
        categories: [...new Set(insights.map(i => i.category))]
      };

      // Compile final result
      const endTime = Date.now();
      const totalTime = endTime - analysisContext.startTime;

      const finalResult = {
        analysisId,
        fileName: analysisContext.fileName,
        status: 'completed',
        processingTime: totalTime,
        
        // Parsing results
        parsing: {
          format: parseResult.format,
          fileSize: parseResult.fileSize,
          bytesProcessed: parseResult.bytesProcessed,
          result: parseResult.result
        },

        // AI analysis results
        analysis: {
          type: analysisType,
          provider: aiResult.metadata.provider,
          confidence: aiResult.metadata.confidence,
          cost: aiResult.metadata.cost,
          summary: aiResult.summary,
          insights: aiResult.insights
        },

        // Generated insights
        insights,

        // Recommendations
        recommendations: this.generateRecommendations(parseResult, aiResult, insights),

        // Metadata
        metadata: {
          analysisId,
          timestamp: new Date().toISOString(),
          steps: analysisContext.steps,
          processingTime: totalTime
        }
      };

      // Update context
      analysisContext.status = 'completed';
      analysisContext.endTime = endTime;
      analysisContext.result = finalResult;

      // Update metrics
      this.metrics.successfulAnalyses++;
      this.metrics.totalProcessingTime += totalTime;
      this.metrics.averageProcessingTime = 
        this.metrics.totalProcessingTime / this.metrics.successfulAnalyses;

      // Emit completion event
      this.emit('document:analysis:complete', finalResult);

      // Publish to event bus
      if (this.eventRouter) {
        await this.eventRouter.publish('document.analysis.completed', {
          analysisId,
          fileName: analysisContext.fileName,
          summary: finalResult.analysis.summary,
          insights: finalResult.insights,
          recommendations: finalResult.recommendations
        });
      }

      console.log(`🎉 Analysis complete: ${analysisContext.fileName} (${totalTime}ms)`);

      // Process next queued analysis
      this.processNextInQueue();

      return finalResult;

    } catch (error) {
      const endTime = Date.now();
      
      console.error(`❌ Analysis failed for ${analysisContext.fileName}:`, error);

      analysisContext.status = 'failed';
      analysisContext.error = error.message;
      analysisContext.endTime = endTime;

      // Mark current step as failed
      if (analysisContext.steps.length > 0) {
        const currentStep = analysisContext.steps[analysisContext.steps.length - 1];
        if (currentStep.status === 'started') {
          currentStep.status = 'failed';
          currentStep.error = error.message;
          currentStep.endTime = endTime;
        }
      }

      this.metrics.failedAnalyses++;

      // Publish error event
      if (this.eventRouter) {
        await this.eventRouter.publish('document.analysis.failed', {
          analysisId,
          fileName: analysisContext.fileName,
          error: error.message,
          step: analysisContext.steps[analysisContext.steps.length - 1]?.step
        });
      }

      // Process next queued analysis
      this.processNextInQueue();

      throw error;
    } finally {
      // Cleanup after delay
      setTimeout(() => {
        this.activeAnalyses.delete(analysisId);
      }, 300000); // Keep for 5 minutes for status queries
    }
  }

  /**
   * Determine analysis type based on document
   */
  determineAnalysisType(parseResult, options) {
    if (options?.analysisType) {
      return options.analysisType;
    }

    // Auto-detect based on content
    const content = parseResult.result;
    
    if (content?.documentType === 'chat_log') {
      return 'comprehensive'; // Chat logs need full analysis
    }

    if (parseResult.format === 'json' && content?.content?.messages) {
      return 'comprehensive'; // Structured chat data
    }

    if (content?.structure?.hasHeaders || content?.metadata?.lineCount > 100) {
      return 'business'; // Structured document likely business plan
    }

    return 'comprehensive'; // Default to comprehensive analysis
  }

  /**
   * Generate actionable insights
   */
  async generateInsights(parseResult, aiResult) {
    const insights = [];

    // Add parsing insights
    if (parseResult.result?.insights) {
      insights.push(...parseResult.result.insights.map(insight => ({
        ...insight,
        category: 'parsing',
        source: 'document_parser'
      })));
    }

    // Add AI insights
    if (aiResult.insights) {
      insights.push(...aiResult.insights.map(insight => ({
        ...insight,
        category: 'ai_analysis',
        source: aiResult.metadata.provider
      })));
    }

    // Generate meta-insights
    if (aiResult.summary?.complexity) {
      const complexity = aiResult.summary.complexity;
      insights.push({
        type: 'complexity_assessment',
        category: 'project_planning',
        value: complexity,
        description: `Project complexity: ${complexity}/10`,
        recommendation: complexity > 7 ? 
          'Consider breaking into smaller phases' : 
          'Suitable for single development cycle',
        source: 'meta_analysis'
      });
    }

    // Technology insights
    if (aiResult.summary?.architecture?.technologies) {
      const techs = aiResult.summary.architecture.technologies;
      insights.push({
        type: 'technology_stack',
        category: 'technical',
        value: techs,
        description: `Recommended technologies: ${techs.join(', ')}`,
        recommendation: 'Verify team expertise with suggested technologies',
        source: 'meta_analysis'
      });
    }

    // Timeline insights
    if (aiResult.summary?.estimates?.developmentTime) {
      insights.push({
        type: 'timeline_estimate',
        category: 'project_planning',
        value: aiResult.summary.estimates.developmentTime,
        description: `Estimated development time: ${aiResult.summary.estimates.developmentTime}`,
        recommendation: 'Add 20-30% buffer for unforeseen complexities',
        source: 'meta_analysis'
      });
    }

    return insights;
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(parseResult, aiResult, insights) {
    const recommendations = [];

    // Base recommendations from AI
    if (aiResult.summary?.recommendations) {
      recommendations.push(...aiResult.summary.recommendations.map(rec => ({
        type: 'ai_recommendation',
        priority: 'medium',
        description: rec,
        source: aiResult.metadata.provider
      })));
    }

    // Add specific recommendations based on insights
    const complexityInsight = insights.find(i => i.type === 'complexity_assessment');
    if (complexityInsight && complexityInsight.value > 7) {
      recommendations.push({
        type: 'project_management',
        priority: 'high',
        description: 'Use agile methodology with 2-week sprints due to high complexity',
        rationale: `Complexity score: ${complexityInsight.value}/10`,
        source: 'meta_analysis'
      });
    }

    // Document type specific recommendations
    if (parseResult.result?.documentType === 'chat_log') {
      recommendations.push({
        type: 'data_processing',
        priority: 'medium',
        description: 'Implement conversation summarization and key decision extraction',
        rationale: 'Chat logs contain valuable but unstructured information',
        source: 'meta_analysis'
      });
    }

    // File size recommendations
    if (parseResult.fileSize > 10 * 1024 * 1024) { // 10MB+
      recommendations.push({
        type: 'performance',
        priority: 'medium',
        description: 'Implement streaming processing for large document handling',
        rationale: `Large file size: ${this.formatFileSize(parseResult.fileSize)}`,
        source: 'meta_analysis'
      });
    }

    return recommendations;
  }

  /**
   * Process next analysis in queue
   */
  async processNextInQueue() {
    if (this.analysisQueue.length === 0 || this.processingQueue) {
      return;
    }

    this.processingQueue = true;

    try {
      const nextAnalysisId = this.analysisQueue.shift();
      if (nextAnalysisId && this.activeAnalyses.has(nextAnalysisId)) {
        console.log(`📋 Processing queued analysis: ${nextAnalysisId}`);
        await this.processAnalysis(nextAnalysisId);
      }
    } catch (error) {
      console.error('❌ Failed to process queued analysis:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    // Handle process cleanup on exit
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  /**
   * Setup periodic cleanup
   */
  setupCleanup() {
    setInterval(() => {
      this.cleanupCompletedAnalyses();
    }, this.options.cleanupInterval);
  }

  /**
   * Cleanup completed analyses older than threshold
   */
  cleanupCompletedAnalyses(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoff = Date.now() - maxAge;
    let cleaned = 0;

    for (const [analysisId, context] of this.activeAnalyses) {
      if (context.endTime && context.endTime < cutoff) {
        this.activeAnalyses.delete(analysisId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old analysis contexts`);
    }
  }

  /**
   * Get analysis status
   */
  getAnalysisStatus(analysisId) {
    const context = this.activeAnalyses.get(analysisId);
    if (!context) {
      return null;
    }

    return {
      id: context.id,
      fileName: context.fileName,
      status: context.status,
      progress: this.calculateProgress(context),
      currentStep: this.getCurrentStep(context),
      steps: context.steps,
      startTime: context.startTime,
      endTime: context.endTime,
      error: context.error
    };
  }

  /**
   * Calculate analysis progress
   */
  calculateProgress(context) {
    if (context.status === 'completed') return 100;
    if (context.status === 'failed') return 0;
    
    const totalSteps = 3; // parsing, ai_analysis, insight_generation
    const completedSteps = context.steps.filter(s => s.status === 'completed').length;
    
    return Math.round((completedSteps / totalSteps) * 100);
  }

  /**
   * Get current processing step
   */
  getCurrentStep(context) {
    const inProgressStep = context.steps.find(s => s.status === 'started');
    if (inProgressStep) {
      return inProgressStep.step;
    }

    const completedSteps = context.steps.filter(s => s.status === 'completed').length;
    const stepNames = ['parsing', 'ai_analysis', 'insight_generation'];
    
    if (completedSteps < stepNames.length) {
      return stepNames[completedSteps];
    }

    return 'completed';
  }

  /**
   * Get active analyses
   */
  getActiveAnalyses() {
    return Array.from(this.activeAnalyses.values()).map(context => ({
      id: context.id,
      fileName: context.fileName,
      status: context.status,
      progress: this.calculateProgress(context),
      startTime: context.startTime
    }));
  }

  /**
   * Get analyzer metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      activeAnalyses: this.activeAnalyses.size,
      queuedAnalyses: this.analysisQueue.length,
      parserMetrics: this.documentParser.getMetrics(),
      aiMetrics: this.aiAnalyzer.getMetrics()
    };
  }

  /**
   * Format file size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const parserHealth = await this.documentParser.healthCheck();
      const aiHealth = await this.aiAnalyzer.healthCheck();

      return {
        healthy: parserHealth.healthy && aiHealth.healthy,
        components: {
          parser: parserHealth,
          ai: aiHealth
        },
        metrics: this.getMetrics(),
        activeAnalyses: this.activeAnalyses.size,
        queuedAnalyses: this.analysisQueue.length
      };

    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        activeAnalyses: this.activeAnalyses.size
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('🧹 Cleaning up Document Analyzer...');

    try {
      // Cancel all active analyses
      for (const [analysisId, context] of this.activeAnalyses) {
        if (context.status === 'processing') {
          context.status = 'cancelled';
          console.log(`🚫 Cancelled analysis: ${context.fileName}`);
        }
      }

      // Cleanup components
      await this.aiAnalyzer.cleanup();
      await this.documentParser.cleanup?.();

      this.activeAnalyses.clear();
      this.analysisQueue = [];
      this.removeAllListeners();

      console.log('✅ Document Analyzer cleanup completed');

    } catch (error) {
      console.error('❌ Document Analyzer cleanup error:', error);
    }
  }
}

module.exports = DocumentAnalyzer;