#!/usr/bin/env node

/**
 * 🧠 LOCAL LLM PROCESSOR
 * 
 * Processes browser recordings and interactions using local LLMs for privacy-first analysis.
 * Integrates with existing local-llm-manager.js and context-aware-ai-orchestrator.js
 * 
 * Features:
 * - Privacy-first local processing only
 * - Real-time interaction analysis
 * - Content understanding and insights
 * - Session summarization and learning
 * - Pattern recognition across sessions
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const winston = require('winston');

// Import existing AI infrastructure
const LocalLLMManager = require('./local-llm-manager');

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/local-llm-processor.log' })
  ]
});

class LocalLLMProcessor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      ollamaUrl: options.ollamaUrl || 'http://localhost:11434',
      preferredModel: options.preferredModel || 'mistral',
      codeModel: options.codeModel || 'codellama',
      analysisModel: options.analysisModel || 'mistral',
      maxTokens: options.maxTokens || 4000,
      temperature: options.temperature || 0.7,
      analysisInterval: options.analysisInterval || 30000, // 30 seconds
      batchSize: options.batchSize || 10,
      database: options.database || null,
      ...options
    };

    // Core components
    this.llmManager = null;
    
    // Processing state
    this.isInitialized = false;
    this.processingQueue = [];
    this.isProcessing = false;
    this.currentAnalysis = null;
    
    // Session context
    this.activeSession = null;
    this.sessionInsights = new Map();
    this.patternDatabase = new Map();
    
    // Real-time analysis
    this.interactionBuffer = [];
    this.contentBuffer = [];
    this.lastAnalysisTime = 0;
    
    // Statistics
    this.stats = {
      sessionsAnalyzed: 0,
      interactionsProcessed: 0,
      insightsGenerated: 0,
      patternsDiscovered: 0,
      averageProcessingTime: 0
    };

    console.log('🧠 Local LLM Processor initialized');
  }

  async initialize() {
    try {
      logger.info('🚀 Initializing Local LLM Processor...');

      // Initialize LLM Manager
      this.llmManager = new LocalLLMManager();
      await this.waitForLLMReady();

      // Setup real-time analysis
      this.setupRealTimeAnalysis();

      // Load existing patterns
      await this.loadPatternDatabase();

      this.isInitialized = true;
      
      logger.info('✅ Local LLM Processor ready');
      this.emit('ready');

    } catch (error) {
      logger.error('❌ Failed to initialize LLM processor:', error);
      throw error;
    }
  }

  async waitForLLMReady() {
    if (!this.llmManager.isHealthy) {
      await new Promise((resolve) => {
        this.llmManager.once('ready', resolve);
      });
    }
  }


  /**
   * Analyze a complete browser session
   */
  async analyzeSession(session) {
    if (!this.isInitialized) {
      throw new Error('LLM Processor not initialized');
    }

    const startTime = Date.now();
    this.activeSession = session;

    try {
      logger.info('🔍 Analyzing session', { sessionId: session.id });

      // Generate comprehensive session analysis
      const insights = await this.generateSessionInsights(session);
      
      // Extract patterns
      const patterns = await this.extractSessionPatterns(session);
      
      // Generate learning summary
      const learning = await this.generateLearningInsights(session, insights, patterns);
      
      // Update statistics
      this.stats.sessionsAnalyzed++;
      this.stats.averageProcessingTime = (this.stats.averageProcessingTime + (Date.now() - startTime)) / 2;
      
      const analysis = {
        sessionId: session.id,
        timestamp: Date.now(),
        insights,
        patterns,
        learning,
        metadata: {
          duration: session.duration,
          interactionCount: session.interactions?.length || 0,
          processingTime: Date.now() - startTime
        }
      };

      // Save analysis
      await this.saveAnalysis(session.id, analysis);
      
      // Update pattern database
      await this.updatePatternDatabase(patterns);
      
      this.stats.insightsGenerated += insights.length;
      this.stats.patternsDiscovered += patterns.length;

      logger.info('✅ Session analysis complete', {
        sessionId: session.id,
        insights: insights.length,
        patterns: patterns.length,
        processingTime: Date.now() - startTime
      });

      this.emit('session:analyzed', analysis);
      return analysis;

    } catch (error) {
      logger.error('❌ Session analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate insights from session data
   */
  async generateSessionInsights(session) {
    const prompt = `Analyze this browser session and provide actionable insights:

Session Data:
- Duration: ${session.duration}ms
- Start Time: ${new Date(session.startTime).toISOString()}
- Interactions: ${session.interactions?.length || 0}

${session.interactions ? this.formatInteractionsForAnalysis(session.interactions) : ''}

Please provide insights in the following categories:
1. User Behavior Patterns
2. Productivity Assessment
3. Learning Opportunities
4. Workflow Optimization
5. Content Engagement

Format as structured JSON with categories and specific insights.`;

    try {
      const result = await this.llmManager.generateCompletion(prompt, {
        taskType: 'reasoning',
        maxTokens: this.config.maxTokens,
        temperature: 0.3,
        priority: 'balanced'
      });

      if (result.content) {
        return this.parseInsightsFromResponse(result.content);
      } else {
        throw new Error('No content in LLM response');
      }

    } catch (error) {
      logger.error('❌ Failed to generate session insights:', error);
      return this.generateBasicInsights(session);
    }
  }

  /**
   * Extract behavioral patterns from session
   */
  async extractSessionPatterns(session) {
    if (!session.interactions || session.interactions.length === 0) {
      return [];
    }

    const prompt = `Analyze these user interactions to identify behavioral patterns:

${this.formatInteractionsForPatternAnalysis(session.interactions)}

Identify patterns such as:
- Navigation habits
- Click patterns
- Scroll behavior
- Typing rhythms
- Focus areas
- Time spent on different actions

Return as JSON array of pattern objects with type, description, frequency, and significance.`;

    try {
      const result = await this.llmManager.generateCompletion(prompt, {
        taskType: 'reasoning',
        maxTokens: 2000,
        temperature: 0.2,
        priority: 'balanced'
      });

      if (result.content) {
        return this.parsePatternsFromResponse(result.content);
      } else {
        throw new Error('No content in LLM response');
      }

    } catch (error) {
      logger.error('❌ Failed to extract patterns:', error);
      return this.generateBasicPatterns(session.interactions);
    }
  }

  /**
   * Generate learning insights from session
   */
  async generateLearningInsights(session, insights, patterns) {
    const prompt = `Based on this session analysis, generate learning recommendations:

Session Insights:
${JSON.stringify(insights, null, 2)}

Behavioral Patterns:
${JSON.stringify(patterns, null, 2)}

Historical Context:
- Previous sessions analyzed: ${this.stats.sessionsAnalyzed}
- Known patterns in database: ${this.patternDatabase.size}

Generate learning insights including:
1. Skills being developed
2. Areas for improvement
3. Habits to reinforce
4. Productivity recommendations
5. Learning resources suggestions

Format as actionable recommendations.`;

    try {
      const result = await this.llmManager.generateCompletion(prompt, {
        taskType: 'general',
        maxTokens: 1500,
        temperature: 0.6,
        priority: 'balanced'
      });

      if (result.content) {
        return this.parseLearningFromResponse(result.content);
      } else {
        throw new Error('No content in LLM response');
      }

    } catch (error) {
      logger.error('❌ Failed to generate learning insights:', error);
      return this.generateBasicLearning(session);
    }
  }

  /**
   * Analyze web content for insights
   */
  async analyzeWebContent(contentData) {
    const prompt = `Analyze this web content and extract key insights:

URL: ${contentData.url}
Title: ${contentData.title}
Domain: ${contentData.domain}
Content Preview: ${contentData.text?.substring(0, 1000)}...

Provide analysis including:
1. Content type and category
2. Key topics and concepts
3. Learning value and relevance
4. Actionable takeaways
5. Related topics to explore

Format as structured analysis.`;

    try {
      const result = await this.llmManager.generateCompletion(prompt, {
        taskType: 'general',
        maxTokens: 1000,
        temperature: 0.4,
        priority: 'balanced'
      });

      if (result.content) {
        return this.parseContentAnalysis(result.content);
      } else {
        throw new Error('No content in LLM response');
      }

    } catch (error) {
      logger.error('❌ Failed to analyze web content:', error);
      return this.generateBasicContentAnalysis(contentData);
    }
  }

  /**
   * Generate insights from text content
   */
  async generateInsights(content) {
    const prompt = `Analyze this content and provide actionable insights:

Content:
${content}

Generate insights including:
1. Key themes and topics
2. Important concepts
3. Actionable items
4. Learning opportunities
5. Related areas to explore

Keep insights practical and specific.`;

    try {
      const result = await this.llmManager.generateCompletion(prompt, {
        taskType: 'general',
        maxTokens: 800,
        temperature: 0.5,
        priority: 'balanced'
      });

      if (result.content) {
        return this.parseGeneralInsights(result.content);
      } else {
        throw new Error('No content in LLM response');
      }

    } catch (error) {
      logger.error('❌ Failed to generate insights:', error);
      return ['Analysis temporarily unavailable'];
    }
  }

  /**
   * Process real-time interactions
   */
  async processInteractionBatch(interactions) {
    if (!this.isInitialized || interactions.length === 0) return;

    this.interactionBuffer.push(...interactions);
    this.stats.interactionsProcessed += interactions.length;

    // Process batch if buffer is full or enough time has passed
    if (this.interactionBuffer.length >= this.config.batchSize || 
        Date.now() - this.lastAnalysisTime > this.config.analysisInterval) {
      
      await this.analyzeInteractionBatch();
    }
  }

  /**
   * Analyze a batch of interactions in real-time
   */
  async analyzeInteractionBatch() {
    if (this.interactionBuffer.length === 0) return;

    const batch = [...this.interactionBuffer];
    this.interactionBuffer = [];
    this.lastAnalysisTime = Date.now();

    try {
      const analysis = await this.generateRealtimeInsights(batch);
      this.emit('realtime:insights', analysis);

    } catch (error) {
      logger.error('❌ Real-time analysis failed:', error);
    }
  }

  /**
   * Generate real-time insights from interaction batch
   */
  async generateRealtimeInsights(interactions) {
    const prompt = `Analyze these recent user interactions for immediate insights:

${this.formatInteractionsForRealtime(interactions)}

Provide real-time feedback including:
1. Current activity assessment
2. Productivity indicators
3. Attention patterns
4. Immediate suggestions

Keep analysis brief and actionable for real-time use.`;

    try {
      const result = await this.llmManager.generateCompletion(prompt, {
        taskType: 'fast',
        maxTokens: 500,
        temperature: 0.3,
        priority: 'fast'
      });

      if (result.content) {
        return this.parseRealtimeInsights(result.content);
      }

    } catch (error) {
      logger.debug('Real-time analysis skipped:', error.message);
    }

    return null;
  }

  /**
   * Setup real-time analysis timer
   */
  setupRealTimeAnalysis() {
    setInterval(() => {
      if (this.interactionBuffer.length > 0) {
        this.analyzeInteractionBatch();
      }
    }, this.config.analysisInterval);
  }

  /**
   * Get processor status
   */
  getStatus() {
    return {
      status: this.isInitialized ? 'ready' : 'initializing',
      currentModel: this.llmManager?.getCurrentModel() || 'unknown',
      uptime: process.uptime(),
      stats: this.stats,
      activeSession: this.activeSession?.id || null,
      queueSize: this.processingQueue.length,
      bufferSize: this.interactionBuffer.length
    };
  }

  // Formatting utilities
  formatInteractionsForAnalysis(interactions) {
    return interactions.slice(0, 50).map(i => 
      `${i.timestamp}ms: ${i.type} ${JSON.stringify(i.data)}`
    ).join('\n');
  }

  formatInteractionsForPatternAnalysis(interactions) {
    return interactions.map(i => ({
      type: i.type,
      timestamp: i.timestamp,
      data: i.data
    }));
  }

  formatInteractionsForRealtime(interactions) {
    return interactions.map(i => 
      `${i.type}: ${JSON.stringify(i.data)}`
    ).join(', ');
  }

  // Parsing utilities
  parseInsightsFromResponse(response) {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      if (parsed.insights) return parsed.insights;
      return Object.values(parsed).flat();
    } catch {
      // Fallback to text parsing
      return this.extractInsightsFromText(response);
    }
  }

  parsePatternsFromResponse(response) {
    try {
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return this.extractPatternsFromText(response);
    }
  }

  parseContentAnalysis(response) {
    return {
      summary: response.substring(0, 300),
      topics: this.extractTopics(response),
      insights: this.extractInsightsFromText(response),
      timestamp: Date.now()
    };
  }

  // Fallback generators
  generateBasicInsights(session) {
    return [
      `Session lasted ${Math.round(session.duration / 1000)} seconds`,
      `${session.interactions?.length || 0} interactions recorded`,
      'Analysis completed using local processing'
    ];
  }

  generateBasicPatterns(interactions) {
    const types = {};
    interactions.forEach(i => {
      types[i.type] = (types[i.type] || 0) + 1;
    });

    return Object.entries(types).map(([type, count]) => ({
      type: 'frequency',
      pattern: `${type}_usage`,
      description: `${type} actions occurred ${count} times`,
      frequency: count,
      significance: count > 10 ? 'high' : 'medium'
    }));
  }

  generateBasicContentAnalysis(contentData) {
    return {
      summary: `Content from ${contentData.domain}`,
      topics: [contentData.domain],
      insights: [`Visited ${contentData.title}`],
      timestamp: Date.now()
    };
  }

  // Utility methods
  extractInsightsFromText(text) {
    const lines = text.split('\n').filter(line => 
      line.trim() && 
      (line.includes('•') || line.includes('-') || line.includes('1.') || line.includes('*'))
    );
    return lines.map(line => line.replace(/^[•\-*\d.]\s*/, '').trim()).filter(Boolean);
  }

  extractTopics(text) {
    const topicKeywords = ['javascript', 'python', 'react', 'node', 'api', 'database', 'design', 'development'];
    const foundTopics = [];
    const lowerText = text.toLowerCase();
    
    topicKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        foundTopics.push(keyword);
      }
    });
    
    return foundTopics;
  }

  // Database operations
  async saveAnalysis(sessionId, analysis) {
    try {
      const analysisDir = path.join(__dirname, 'data/analysis');
      await fs.mkdir(analysisDir, { recursive: true });
      
      const filePath = path.join(analysisDir, `${sessionId}-analysis.json`);
      await fs.writeFile(filePath, JSON.stringify(analysis, null, 2));
      
      if (this.config.database) {
        await this.config.database.saveAnalysis(analysis);
      }

    } catch (error) {
      logger.error('❌ Failed to save analysis:', error);
    }
  }

  async loadPatternDatabase() {
    try {
      const patternsFile = path.join(__dirname, 'data/patterns.json');
      const data = await fs.readFile(patternsFile, 'utf8');
      const patterns = JSON.parse(data);
      
      Object.entries(patterns).forEach(([key, value]) => {
        this.patternDatabase.set(key, value);
      });
      
      logger.info(`📚 Loaded ${this.patternDatabase.size} patterns`);

    } catch (error) {
      logger.info('📚 No existing patterns found, starting fresh');
    }
  }

  async updatePatternDatabase(newPatterns) {
    newPatterns.forEach(pattern => {
      const key = `${pattern.type}_${pattern.pattern}`;
      const existing = this.patternDatabase.get(key) || { frequency: 0 };
      existing.frequency = (existing.frequency || 0) + (pattern.frequency || 1);
      existing.lastSeen = Date.now();
      existing.pattern = pattern;
      this.patternDatabase.set(key, existing);
    });

    // Save to file
    try {
      const patternsFile = path.join(__dirname, 'data/patterns.json');
      const data = Object.fromEntries(this.patternDatabase);
      await fs.writeFile(patternsFile, JSON.stringify(data, null, 2));
    } catch (error) {
      logger.error('❌ Failed to save patterns:', error);
    }
  }
}

module.exports = LocalLLMProcessor;

// Start standalone if called directly
if (require.main === module) {
  const processor = new LocalLLMProcessor();
  
  processor.on('ready', () => {
    console.log('🧠 Local LLM Processor is ready!');
  });

  processor.on('session:analyzed', (analysis) => {
    console.log(`🔍 Session analyzed: ${analysis.sessionId} (${analysis.insights.length} insights)`);
  });

  processor.on('realtime:insights', (insights) => {
    console.log('⚡ Real-time insights generated');
  });

  processor.initialize().catch(error => {
    console.error('❌ Failed to initialize LLM processor:', error);
    process.exit(1);
  });
}