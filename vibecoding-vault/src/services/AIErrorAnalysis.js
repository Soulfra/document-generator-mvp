/**
 * AIErrorAnalysis - Intelligent Error Analysis using Local and Cloud AI
 * 
 * Provides AI-powered insights and fix suggestions for errors
 */

import { safeMap } from '../utils/safeArrayHelpers';

class AIErrorAnalysisService {
  constructor() {
    this.config = {
      ollamaUrl: 'http://localhost:11434',
      claudeApiKey: process.env.REACT_APP_CLAUDE_API_KEY,
      openaiApiKey: process.env.REACT_APP_OPENAI_API_KEY,
      preferLocalAI: true,
      maxRetries: 3,
      timeout: 30000,
      cacheResults: true,
      analysisCache: new Map()
    };
    
    this.errorPatterns = this.loadErrorPatterns();
    this.fixDatabase = new Map();
  }

  /**
   * Analyze an error and provide insights and fixes
   */
  async analyzeError(error, context = {}) {
    // Check cache first
    const cacheKey = this.generateCacheKey(error, context);
    if (this.config.cacheResults && this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    try {
      // Build comprehensive error context
      const errorContext = this.buildErrorContext(error, context);
      
      // Try local AI first (Ollama)
      let analysis = null;
      if (this.config.preferLocalAI) {
        analysis = await this.analyzeWithOllama(errorContext);
      }
      
      // Fallback to cloud AI if needed
      if (!analysis || analysis.confidence < 0.7) {
        if (this.config.claudeApiKey) {
          analysis = await this.analyzeWithClaude(errorContext);
        } else if (this.config.openaiApiKey) {
          analysis = await this.analyzeWithOpenAI(errorContext);
        }
      }
      
      // Enhance with pattern matching
      const enhancedAnalysis = this.enhanceWithPatterns(analysis, error);
      
      // Cache result
      if (this.config.cacheResults) {
        this.analysisCache.set(cacheKey, enhancedAnalysis);
      }
      
      // Store successful fixes
      if (enhancedAnalysis.fixes?.length > 0) {
        this.storeFixes(error, enhancedAnalysis.fixes);
      }
      
      return enhancedAnalysis;
    } catch (err) {
      console.error('[AI Analysis] Failed:', err);
      return this.getFallbackAnalysis(error);
    }
  }

  /**
   * Analyze with local Ollama
   */
  async analyzeWithOllama(errorContext) {
    try {
      const prompt = this.buildAnalysisPrompt(errorContext);
      
      const response = await fetch(`${this.config.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'codellama',
          prompt,
          temperature: 0.3,
          stream: false
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAIResponse(data.response, 'ollama');
    } catch (error) {
      console.warn('[AI Analysis] Ollama failed:', error);
      return null;
    }
  }

  /**
   * Analyze with Claude API
   */
  async analyzeWithClaude(errorContext) {
    if (!this.config.claudeApiKey) return null;

    try {
      const prompt = this.buildAnalysisPrompt(errorContext);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.claudeApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 1024,
          temperature: 0.3
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`Claude error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAIResponse(data.content[0].text, 'claude');
    } catch (error) {
      console.warn('[AI Analysis] Claude failed:', error);
      return null;
    }
  }

  /**
   * Analyze with OpenAI
   */
  async analyzeWithOpenAI(errorContext) {
    if (!this.config.openaiApiKey) return null;

    try {
      const prompt = this.buildAnalysisPrompt(errorContext);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{
            role: 'system',
            content: 'You are an expert debugging assistant. Analyze errors and provide specific, actionable fixes.'
          }, {
            role: 'user',
            content: prompt
          }],
          temperature: 0.3,
          max_tokens: 1024
        }),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      if (!response.ok) {
        throw new Error(`OpenAI error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAIResponse(data.choices[0].message.content, 'openai');
    } catch (error) {
      console.warn('[AI Analysis] OpenAI failed:', error);
      return null;
    }
  }

  /**
   * Build error context for analysis
   */
  buildErrorContext(error, context) {
    return {
      error: {
        name: error.name || 'Unknown Error',
        message: error.message || 'No message',
        stack: error.stack || '',
        type: error.constructor?.name || typeof error
      },
      context: {
        ...context,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        sessionDuration: Date.now() - (window.__telemetryStartTime || Date.now())
      },
      code: this.extractCodeContext(error, context),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        reactVersion: React.version,
        browserInfo: this.getBrowserInfo()
      }
    };
  }

  /**
   * Build analysis prompt for AI
   */
  buildAnalysisPrompt(errorContext) {
    return `Analyze this JavaScript/React error and provide specific fixes:

ERROR DETAILS:
- Type: ${errorContext.error.name}
- Message: ${errorContext.error.message}
- Component Stack: ${errorContext.context.componentStack || 'N/A'}

STACK TRACE:
${errorContext.error.stack}

CODE CONTEXT:
${errorContext.code || 'No code context available'}

ENVIRONMENT:
- React Version: ${errorContext.environment.reactVersion}
- Browser: ${errorContext.environment.browserInfo}
- URL: ${errorContext.context.url}

Provide a JSON response with:
1. root_cause: Brief explanation of why this error occurred
2. immediate_fix: Specific code fix to resolve the error
3. prevention: How to prevent this error in the future
4. similar_patterns: Common patterns that cause this error
5. confidence: Your confidence level (0-1)
6. additional_context: Any other relevant information

Focus on practical, implementable solutions.`;
  }

  /**
   * Parse AI response into structured format
   */
  parseAIResponse(response, source) {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          source,
          rootCause: parsed.root_cause || 'Unknown',
          fixes: [{
            type: 'immediate',
            description: parsed.immediate_fix || 'No immediate fix available',
            code: this.extractCodeFromResponse(parsed.immediate_fix),
            confidence: parsed.confidence || 0.5
          }],
          prevention: parsed.prevention || [],
          similarPatterns: parsed.similar_patterns || [],
          confidence: parsed.confidence || 0.5,
          additionalContext: parsed.additional_context || '',
          timestamp: new Date().toISOString()
        };
      }
      
      // Fallback to text parsing
      return this.parseTextResponse(response, source);
    } catch (error) {
      console.error('[AI Analysis] Failed to parse response:', error);
      return this.parseTextResponse(response, source);
    }
  }

  /**
   * Parse text response when JSON parsing fails
   */
  parseTextResponse(response, source) {
    const lines = response.split('\n');
    const analysis = {
      source,
      rootCause: '',
      fixes: [],
      prevention: [],
      similarPatterns: [],
      confidence: 0.5,
      additionalContext: response,
      timestamp: new Date().toISOString()
    };

    // Simple keyword-based parsing
    let currentSection = '';
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      
      if (lowerLine.includes('cause') || lowerLine.includes('reason')) {
        currentSection = 'cause';
      } else if (lowerLine.includes('fix') || lowerLine.includes('solution')) {
        currentSection = 'fix';
      } else if (lowerLine.includes('prevent')) {
        currentSection = 'prevention';
      } else if (currentSection === 'cause' && line.trim()) {
        analysis.rootCause += line + ' ';
      } else if (currentSection === 'fix' && line.trim()) {
        analysis.fixes.push({
          type: 'suggested',
          description: line.trim(),
          confidence: 0.5
        });
      } else if (currentSection === 'prevention' && line.trim()) {
        analysis.prevention.push(line.trim());
      }
    }

    return analysis;
  }

  /**
   * Enhance analysis with pattern matching
   */
  enhanceWithPatterns(analysis, error) {
    const patterns = this.findMatchingPatterns(error);
    const communityFixes = this.findCommunityFixes(error);

    return {
      ...analysis,
      patterns: patterns,
      communityFixes: communityFixes,
      confidence: this.calculateConfidence(analysis, patterns, communityFixes),
      recommendations: this.generateRecommendations(analysis, patterns)
    };
  }

  /**
   * Find matching error patterns
   */
  findMatchingPatterns(error) {
    const matches = [];
    const errorSignature = `${error.name}-${error.message}`;
    
    for (const [pattern, info] of this.errorPatterns) {
      if (errorSignature.match(new RegExp(pattern, 'i'))) {
        matches.push({
          pattern,
          ...info,
          matchConfidence: this.calculatePatternMatch(errorSignature, pattern)
        });
      }
    }
    
    return matches.sort((a, b) => b.matchConfidence - a.matchConfidence);
  }

  /**
   * Find community fixes for similar errors
   */
  findCommunityFixes(error) {
    const errorKey = this.getErrorKey(error);
    const fixes = [];
    
    // Check exact matches
    if (this.fixDatabase.has(errorKey)) {
      fixes.push(...this.fixDatabase.get(errorKey));
    }
    
    // Check similar errors
    for (const [key, communityFixes] of this.fixDatabase) {
      if (this.calculateSimilarity(errorKey, key) > 0.8) {
        fixes.push(...communityFixes.map(fix => ({
          ...fix,
          similarity: this.calculateSimilarity(errorKey, key)
        })));
      }
    }
    
    return fixes.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(analysis, patterns) {
    const recommendations = [];
    
    // Add pattern-based recommendations
    if (patterns.length > 0) {
      const topPattern = patterns[0];
      recommendations.push({
        type: 'pattern',
        title: 'Common Error Pattern Detected',
        description: topPattern.description,
        actions: topPattern.fixes || []
      });
    }
    
    // Add prevention recommendations
    if (analysis.prevention?.length > 0) {
      recommendations.push({
        type: 'prevention',
        title: 'Prevention Strategies',
        description: 'Ways to prevent this error in the future',
        actions: analysis.prevention
      });
    }
    
    // Add code quality recommendations
    if (analysis.rootCause?.includes('undefined') || analysis.rootCause?.includes('null')) {
      recommendations.push({
        type: 'code-quality',
        title: 'Add Defensive Programming',
        description: 'Use optional chaining and null checks',
        actions: [
          'Use optional chaining (?.) for property access',
          'Add default values for function parameters',
          'Validate data before using it',
          'Use TypeScript for type safety'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * Get fallback analysis when AI fails
   */
  getFallbackAnalysis(error) {
    const errorType = error.name || 'UnknownError';
    const fallbacks = {
      TypeError: {
        rootCause: 'Attempting to access a property or method on undefined or null',
        fixes: [{
          type: 'immediate',
          description: 'Add null/undefined checks before accessing properties',
          code: 'if (object && object.property) { /* safe to use */ }',
          confidence: 0.7
        }],
        prevention: [
          'Use optional chaining (?.)',
          'Set default values',
          'Validate data at boundaries'
        ]
      },
      ReferenceError: {
        rootCause: 'Variable or function is not defined',
        fixes: [{
          type: 'immediate',
          description: 'Ensure variable is declared and in scope',
          code: 'const variableName = defaultValue;',
          confidence: 0.6
        }],
        prevention: [
          'Use const/let instead of var',
          'Check import statements',
          'Verify variable spelling'
        ]
      },
      SyntaxError: {
        rootCause: 'Invalid JavaScript syntax',
        fixes: [{
          type: 'immediate',
          description: 'Check for missing brackets, quotes, or semicolons',
          confidence: 0.5
        }],
        prevention: [
          'Use a linter (ESLint)',
          'Enable editor syntax highlighting',
          'Use Prettier for formatting'
        ]
      }
    };

    return {
      source: 'fallback',
      ...fallbacks[errorType] || {
        rootCause: 'Unknown error occurred',
        fixes: [{
          type: 'general',
          description: 'Check console for more details',
          confidence: 0.3
        }],
        prevention: ['Add error boundaries', 'Implement logging']
      },
      confidence: 0.5,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Load predefined error patterns
   */
  loadErrorPatterns() {
    return new Map([
      ['TypeError.*undefined.*map', {
        description: 'Attempting to use map on undefined',
        fixes: [
          'Use optional chaining: array?.map(...)',
          'Add default value: (array || []).map(...)',
          'Check if array exists before mapping'
        ],
        severity: 'high'
      }],
      ['Cannot read prop.*of null', {
        description: 'Accessing property of null object',
        fixes: [
          'Add null check: if (object !== null)',
          'Use optional chaining: object?.property',
          'Set default values in destructuring'
        ],
        severity: 'high'
      }],
      ['Maximum update depth exceeded', {
        description: 'React infinite loop in useEffect or setState',
        fixes: [
          'Add proper dependencies to useEffect',
          'Avoid setState in render',
          'Use useCallback for event handlers'
        ],
        severity: 'critical'
      }],
      ['Network request failed', {
        description: 'API or network connectivity issue',
        fixes: [
          'Check network connection',
          'Verify API endpoint URL',
          'Add proper error handling',
          'Implement retry logic'
        ],
        severity: 'medium'
      }]
    ]);
  }

  // Utility methods

  generateCacheKey(error, context) {
    const key = `${error.name}-${error.message}-${context.componentStack || ''}`;
    return this.hashString(key);
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  extractCodeContext(error, context) {
    // Extract relevant code from stack trace or component
    if (context.componentStack) {
      return context.componentStack;
    }
    
    if (error.stack) {
      const lines = error.stack.split('\n').slice(0, 5);
      return lines.join('\n');
    }
    
    return null;
  }

  extractCodeFromResponse(text) {
    if (!text) return null;
    
    // Look for code blocks
    const codeMatch = text.match(/```[\s\S]*?```/);
    if (codeMatch) {
      return codeMatch[0].replace(/```/g, '').trim();
    }
    
    // Look for inline code
    const inlineMatch = text.match(/`[^`]+`/);
    if (inlineMatch) {
      return inlineMatch[0].replace(/`/g, '');
    }
    
    return null;
  }

  getBrowserInfo() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return `Chrome ${ua.match(/Chrome\/(\d+)/)?.[1]}`;
    if (ua.includes('Firefox')) return `Firefox ${ua.match(/Firefox\/(\d+)/)?.[1]}`;
    if (ua.includes('Safari')) return `Safari ${ua.match(/Safari\/(\d+)/)?.[1]}`;
    return ua.substring(0, 50);
  }

  calculatePatternMatch(errorSignature, pattern) {
    try {
      const regex = new RegExp(pattern, 'i');
      const match = errorSignature.match(regex);
      if (!match) return 0;
      
      // Calculate match quality based on matched length
      return match[0].length / errorSignature.length;
    } catch {
      return 0;
    }
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  getEditDistance(str1, str2) {
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

  getErrorKey(error) {
    return `${error.name}-${error.message}`.replace(/\d+/g, 'N').substring(0, 100);
  }

  calculateConfidence(analysis, patterns, communityFixes) {
    let confidence = analysis.confidence || 0.5;
    
    // Boost confidence based on pattern matches
    if (patterns.length > 0) {
      confidence = Math.min(1, confidence + (patterns[0].matchConfidence * 0.2));
    }
    
    // Boost confidence based on community fixes
    if (communityFixes.length > 0) {
      const avgRating = communityFixes.reduce((sum, fix) => sum + (fix.rating || 0), 0) / communityFixes.length;
      confidence = Math.min(1, confidence + (avgRating * 0.1));
    }
    
    return confidence;
  }

  storeFixes(error, fixes) {
    const errorKey = this.getErrorKey(error);
    const existingFixes = this.fixDatabase.get(errorKey) || [];
    
    // Add new fixes with metadata
    const newFixes = fixes.map(fix => ({
      ...fix,
      timestamp: new Date().toISOString(),
      errorKey,
      rating: 0,
      usageCount: 0
    }));
    
    this.fixDatabase.set(errorKey, [...existingFixes, ...newFixes]);
  }

  /**
   * Rate a fix (for community learning)
   */
  rateFix(errorKey, fixId, rating) {
    const fixes = this.fixDatabase.get(errorKey);
    if (!fixes) return;
    
    const fix = fixes.find(f => f.id === fixId);
    if (fix) {
      fix.rating = (fix.rating * fix.usageCount + rating) / (fix.usageCount + 1);
      fix.usageCount++;
    }
  }

  /**
   * Export error patterns and fixes for sharing
   */
  exportKnowledge() {
    return {
      patterns: Array.from(this.errorPatterns.entries()),
      fixes: Array.from(this.fixDatabase.entries()),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
  }

  /**
   * Import error patterns and fixes from community
   */
  importKnowledge(data) {
    if (data.patterns) {
      for (const [pattern, info] of data.patterns) {
        this.errorPatterns.set(pattern, info);
      }
    }
    
    if (data.fixes) {
      for (const [errorKey, fixes] of data.fixes) {
        const existing = this.fixDatabase.get(errorKey) || [];
        this.fixDatabase.set(errorKey, [...existing, ...fixes]);
      }
    }
    
    console.log('[AI Analysis] Imported knowledge:', {
      patterns: data.patterns?.length || 0,
      fixes: data.fixes?.length || 0
    });
  }
}

// Create and export singleton instance
const aiErrorAnalysis = new AIErrorAnalysisService();

// Auto-import community knowledge if available
if (typeof window !== 'undefined' && window.__communityErrorKnowledge) {
  aiErrorAnalysis.importKnowledge(window.__communityErrorKnowledge);
}

export default aiErrorAnalysis;