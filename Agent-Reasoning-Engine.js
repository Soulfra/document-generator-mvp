#!/usr/bin/env node

/**
 * AGENT REASONING ENGINE
 * Manages AI agents with reasoning capabilities and live learning
 * Tracks decisions, outcomes, and fine-tunes based on performance
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class AgentReasoningEngine extends EventEmitter {
  constructor() {
    super();
    
    // Agent registry
    this.agents = new Map();
    
    // Decision history for learning
    this.decisionHistory = new Map();
    
    // Performance metrics
    this.globalMetrics = {
      totalDecisions: 0,
      successfulDecisions: 0,
      failedDecisions: 0,
      avgDecisionTime: 0,
      learningCycles: 0
    };
    
    // Learning configuration
    this.learningConfig = {
      minDecisionsForLearning: 10,
      learningThreshold: 0.7, // Trigger learning if accuracy below 70%
      memorySize: 1000, // Max decisions to remember per agent
      learningRate: 0.1,
      explorationRate: 0.1 // Chance to try new approaches
    };
    
    // Decision models (simulated)
    this.decisionModels = {
      'economic-reasoning': this.createEconomicModel(),
      'trend-detection': this.createTrendModel(),
      'brand-generation': this.createBrandModel(),
      'legal-reasoning': this.createLegalModel(),
      'technical-analysis': this.createTechnicalModel()
    };
    
    console.log('🧠 Agent Reasoning Engine initialized');
    console.log('📊 Live learning and fine-tuning enabled');
    console.log('🤖 Ready to manage reasoning agents');
    
    this.initialize();
  }
  
  /**
   * Initialize the reasoning engine
   */
  async initialize() {
    // Start performance monitoring
    this.startPerformanceMonitoring();
    
    // Start learning cycles
    this.startLearningCycles();
    
    console.log('✅ Reasoning engine systems active');
  }
  
  /**
   * Create a new reasoning agent
   */
  async createAgent(config) {
    const agentId = config.id || `agent_${crypto.randomBytes(4).toString('hex')}`;
    
    const agent = {
      id: agentId,
      type: config.type,
      model: config.model || 'general',
      capabilities: config.capabilities || [],
      created: Date.now(),
      state: 'active',
      
      // Performance tracking
      performance: {
        decisions: 0,
        correct: 0,
        incorrect: 0,
        accuracy: 0,
        avgResponseTime: 0,
        lastDecision: null
      },
      
      // Memory for learning
      memory: {
        decisions: [],
        patterns: new Map(),
        preferences: {},
        contextualKnowledge: new Map()
      },
      
      // Model parameters (can be fine-tuned)
      parameters: {
        confidence: 0.5,
        riskTolerance: 0.5,
        creativityLevel: 0.5,
        analyticalDepth: 0.5,
        speedVsAccuracy: 0.5
      },
      
      // Agent methods
      makeDecision: async (context) => this.agentMakeDecision(agentId, context),
      updateOutcome: async (decisionId, outcome) => this.agentUpdateOutcome(agentId, decisionId, outcome),
      getInsights: () => this.getAgentInsights(agentId),
      reset: () => this.resetAgent(agentId)
    };
    
    // Store agent
    this.agents.set(agentId, agent);
    
    // Initialize decision history
    this.decisionHistory.set(agentId, []);
    
    console.log(`🤖 Created reasoning agent: ${agentId} (${config.type})`);
    this.emit('agent_created', { agentId, config });
    
    return agent;
  }
  
  /**
   * Agent makes a decision
   */
  async agentMakeDecision(agentId, context) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);
    
    const startTime = Date.now();
    
    // Create decision record
    const decisionId = `dec_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const decision = {
      id: decisionId,
      agentId,
      context: this.sanitizeContext(context),
      timestamp: startTime,
      reasoning: [],
      confidence: 0,
      alternatives: [],
      result: null,
      outcome: null // Will be updated later
    };
    
    try {
      // Apply reasoning based on agent model
      const model = this.decisionModels[agent.model] || this.decisionModels['general'];
      const reasoning = await this.applyReasoning(agent, context, model);
      
      decision.reasoning = reasoning.steps;
      decision.confidence = reasoning.confidence;
      decision.alternatives = reasoning.alternatives;
      decision.result = reasoning.decision;
      
      // Check if we should explore (try something new)
      if (Math.random() < this.learningConfig.explorationRate) {
        decision.explored = true;
        decision.result = this.exploreAlternative(decision.result, decision.alternatives);
      }
      
      // Record decision
      const decisionTime = Date.now() - startTime;
      this.recordDecision(agent, decision, decisionTime);
      
      console.log(`🎯 Agent ${agentId} made decision in ${decisionTime}ms (confidence: ${decision.confidence.toFixed(2)})`);
      
      // Emit decision event
      this.emit('decision_made', {
        agentId,
        decisionId,
        decision: decision.result,
        confidence: decision.confidence,
        responseTime: decisionTime
      });
      
      return {
        decisionId,
        ...decision.result,
        confidence: decision.confidence,
        reasoning: decision.reasoning
      };
      
    } catch (error) {
      console.error(`❌ Agent ${agentId} decision failed:`, error.message);
      decision.error = error.message;
      this.recordDecision(agent, decision, Date.now() - startTime);
      throw error;
    }
  }
  
  /**
   * Apply reasoning based on model
   */
  async applyReasoning(agent, context, model) {
    const reasoning = {
      steps: [],
      confidence: 0,
      alternatives: [],
      decision: null
    };
    
    // Step 1: Analyze context
    const analysis = model.analyzeContext(context, agent.parameters);
    reasoning.steps.push({
      step: 'context_analysis',
      result: analysis.summary,
      factors: analysis.factors
    });
    
    // Step 2: Retrieve relevant memories
    const relevantMemories = this.retrieveRelevantMemories(agent, context);
    reasoning.steps.push({
      step: 'memory_retrieval',
      memoriesFound: relevantMemories.length,
      relevance: relevantMemories.map(m => m.relevance)
    });
    
    // Step 3: Generate options
    const options = model.generateOptions(analysis, relevantMemories, agent.parameters);
    reasoning.steps.push({
      step: 'option_generation',
      optionsCount: options.length,
      options: options.map(o => o.summary)
    });
    
    // Step 4: Evaluate options
    const evaluations = model.evaluateOptions(options, context, agent);
    reasoning.steps.push({
      step: 'option_evaluation',
      evaluations: evaluations.map(e => ({
        option: e.option.summary,
        score: e.score,
        risks: e.risks,
        benefits: e.benefits
      }))
    });
    
    // Step 5: Select best option
    const selected = evaluations.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    reasoning.decision = selected.option;
    reasoning.confidence = this.calculateConfidence(selected, evaluations, agent);
    reasoning.alternatives = evaluations
      .filter(e => e !== selected)
      .slice(0, 3)
      .map(e => e.option);
    
    reasoning.steps.push({
      step: 'decision_selection',
      selected: selected.option.summary,
      confidence: reasoning.confidence,
      alternativeCount: reasoning.alternatives.length
    });
    
    return reasoning;
  }
  
  /**
   * Update agent with decision outcome
   */
  async agentUpdateOutcome(agentId, decisionId, outcome) {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent ${agentId} not found`);
    
    const history = this.decisionHistory.get(agentId);
    const decision = history.find(d => d.id === decisionId);
    
    if (!decision) {
      console.warn(`Decision ${decisionId} not found for agent ${agentId}`);
      return;
    }
    
    // Update decision with outcome
    decision.outcome = {
      success: outcome.success,
      feedback: outcome.feedback,
      metrics: outcome.metrics || {},
      timestamp: Date.now()
    };
    
    // Update agent performance
    agent.performance.decisions++;
    if (outcome.success) {
      agent.performance.correct++;
    } else {
      agent.performance.incorrect++;
    }
    agent.performance.accuracy = agent.performance.correct / agent.performance.decisions;
    
    // Learn from outcome
    await this.learnFromOutcome(agent, decision);
    
    console.log(`📚 Agent ${agentId} updated with outcome (${outcome.success ? 'success' : 'failure'})`);
    console.log(`   Accuracy: ${(agent.performance.accuracy * 100).toFixed(1)}% (${agent.performance.decisions} decisions)`);
    
    // Check if learning is needed
    if (agent.performance.decisions >= this.learningConfig.minDecisionsForLearning &&
        agent.performance.accuracy < this.learningConfig.learningThreshold) {
      console.log(`🔧 Agent ${agentId} needs fine-tuning (accuracy below threshold)`);
      this.scheduleFineTuning(agentId);
    }
    
    this.emit('outcome_recorded', {
      agentId,
      decisionId,
      outcome,
      performance: agent.performance
    });
  }
  
  /**
   * Learn from decision outcome
   */
  async learnFromOutcome(agent, decision) {
    // Update memory with outcome
    agent.memory.decisions.push({
      context: decision.context,
      decision: decision.result,
      outcome: decision.outcome,
      confidence: decision.confidence,
      timestamp: decision.timestamp
    });
    
    // Keep memory size limited
    if (agent.memory.decisions.length > this.learningConfig.memorySize) {
      agent.memory.decisions = agent.memory.decisions.slice(-this.learningConfig.memorySize);
    }
    
    // Extract patterns from successful decisions
    if (decision.outcome.success) {
      this.extractSuccessPatterns(agent, decision);
    } else {
      this.extractFailurePatterns(agent, decision);
    }
    
    // Update agent parameters based on outcome
    this.updateAgentParameters(agent, decision);
  }
  
  /**
   * Extract patterns from successful decisions
   */
  extractSuccessPatterns(agent, decision) {
    // Look for context features that led to success
    const contextFeatures = this.extractContextFeatures(decision.context);
    
    contextFeatures.forEach(feature => {
      const pattern = agent.memory.patterns.get(feature) || {
        feature,
        successCount: 0,
        failureCount: 0,
        avgConfidence: 0
      };
      
      pattern.successCount++;
      pattern.avgConfidence = (pattern.avgConfidence * (pattern.successCount - 1) + decision.confidence) / pattern.successCount;
      
      agent.memory.patterns.set(feature, pattern);
    });
  }
  
  /**
   * Extract patterns from failed decisions
   */
  extractFailurePatterns(agent, decision) {
    const contextFeatures = this.extractContextFeatures(decision.context);
    
    contextFeatures.forEach(feature => {
      const pattern = agent.memory.patterns.get(feature) || {
        feature,
        successCount: 0,
        failureCount: 0,
        avgConfidence: 0
      };
      
      pattern.failureCount++;
      agent.memory.patterns.set(feature, pattern);
    });
    
    // If agent was confident but failed, adjust confidence calibration
    if (decision.confidence > 0.7) {
      agent.parameters.confidence *= 0.95; // Reduce overconfidence
    }
  }
  
  /**
   * Update agent parameters based on outcomes
   */
  updateAgentParameters(agent, decision) {
    const learningRate = this.learningConfig.learningRate;
    
    if (decision.outcome.success) {
      // Successful decision - reinforce current parameters
      if (decision.explored) {
        // Exploration was successful, increase creativity
        agent.parameters.creativityLevel = Math.min(1, agent.parameters.creativityLevel + learningRate);
      }
      
      // If decision was made quickly and correctly, favor speed
      if (decision.responseTime < 1000) {
        agent.parameters.speedVsAccuracy = Math.min(1, agent.parameters.speedVsAccuracy + learningRate * 0.5);
      }
    } else {
      // Failed decision - adjust parameters
      if (decision.confidence > 0.8) {
        // Overconfident failure - increase analytical depth
        agent.parameters.analyticalDepth = Math.min(1, agent.parameters.analyticalDepth + learningRate);
        agent.parameters.speedVsAccuracy = Math.max(0, agent.parameters.speedVsAccuracy - learningRate * 0.5);
      }
      
      if (decision.explored) {
        // Exploration failed, be more conservative
        agent.parameters.riskTolerance = Math.max(0, agent.parameters.riskTolerance - learningRate);
      }
    }
  }
  
  /**
   * Retrieve relevant memories for decision-making
   */
  retrieveRelevantMemories(agent, context) {
    const contextFeatures = this.extractContextFeatures(context);
    const relevantMemories = [];
    
    // Find similar past decisions
    agent.memory.decisions.forEach(memory => {
      const memoryFeatures = this.extractContextFeatures(memory.context);
      const similarity = this.calculateFeatureSimilarity(contextFeatures, memoryFeatures);
      
      if (similarity > 0.5) {
        relevantMemories.push({
          ...memory,
          relevance: similarity
        });
      }
    });
    
    // Sort by relevance and recency
    return relevantMemories
      .sort((a, b) => {
        const relevanceDiff = b.relevance - a.relevance;
        if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff;
        return b.timestamp - a.timestamp; // More recent if similar relevance
      })
      .slice(0, 10); // Top 10 most relevant
  }
  
  /**
   * Extract features from context
   */
  extractContextFeatures(context) {
    const features = [];
    
    // Extract type-based features
    if (context.type) features.push(`type:${context.type}`);
    if (context.category) features.push(`category:${context.category}`);
    if (context.domain) features.push(`domain:${context.domain}`);
    
    // Extract value-based features
    if (context.value !== undefined) {
      if (context.value < 10) features.push('value:low');
      else if (context.value < 100) features.push('value:medium');
      else features.push('value:high');
    }
    
    // Extract complexity features
    if (context.complexity) features.push(`complexity:${context.complexity}`);
    
    // Extract custom features
    Object.entries(context).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length < 50) {
        features.push(`${key}:${value}`);
      }
    });
    
    return features;
  }
  
  /**
   * Calculate similarity between feature sets
   */
  calculateFeatureSimilarity(features1, features2) {
    const set1 = new Set(features1);
    const set2 = new Set(features2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size; // Jaccard similarity
  }
  
  /**
   * Calculate confidence for a decision
   */
  calculateConfidence(selected, evaluations, agent) {
    let confidence = selected.score;
    
    // Adjust based on how much better this option is than others
    const secondBest = evaluations
      .filter(e => e !== selected)
      .sort((a, b) => b.score - a.score)[0];
    
    if (secondBest) {
      const margin = selected.score - secondBest.score;
      confidence *= (1 + margin); // Higher confidence if clear winner
    }
    
    // Adjust based on agent's calibration
    confidence *= agent.parameters.confidence;
    
    // Adjust based on past performance with similar decisions
    const relevantPatterns = Array.from(agent.memory.patterns.values())
      .filter(p => selected.option.summary.includes(p.feature));
    
    if (relevantPatterns.length > 0) {
      const successRate = relevantPatterns.reduce((sum, p) => 
        sum + (p.successCount / (p.successCount + p.failureCount)), 0
      ) / relevantPatterns.length;
      
      confidence *= successRate;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }
  
  /**
   * Schedule fine-tuning for an agent
   */
  scheduleFineTuning(agentId) {
    // In a real system, this would trigger model retraining
    // For now, we'll adjust parameters based on performance
    setTimeout(() => {
      this.fineTuneAgent(agentId);
    }, 5000); // Fine-tune after 5 seconds
  }
  
  /**
   * Fine-tune agent based on performance
   */
  async fineTuneAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    
    console.log(`🔧 Fine-tuning agent ${agentId}...`);
    
    // Analyze decision patterns
    const patterns = this.analyzeDecisionPatterns(agent);
    
    // Adjust parameters based on patterns
    if (patterns.overconfidence > 0.2) {
      agent.parameters.confidence *= 0.8;
      agent.parameters.analyticalDepth = Math.min(1, agent.parameters.analyticalDepth + 0.1);
      console.log(`   Reduced confidence, increased analysis`);
    }
    
    if (patterns.underconfidence > 0.2) {
      agent.parameters.confidence = Math.min(1, agent.parameters.confidence * 1.1);
      console.log(`   Increased confidence`);
    }
    
    if (patterns.slowButAccurate) {
      agent.parameters.speedVsAccuracy = Math.min(1, agent.parameters.speedVsAccuracy + 0.1);
      console.log(`   Favoring speed (maintaining accuracy)`);
    }
    
    if (patterns.fastButInaccurate) {
      agent.parameters.speedVsAccuracy = Math.max(0, agent.parameters.speedVsAccuracy - 0.2);
      agent.parameters.analyticalDepth = Math.min(1, agent.parameters.analyticalDepth + 0.15);
      console.log(`   Favoring accuracy over speed`);
    }
    
    // Reset performance counters after tuning
    agent.performance.correct = Math.floor(agent.performance.correct * 0.8);
    agent.performance.incorrect = Math.floor(agent.performance.incorrect * 0.8);
    agent.performance.decisions = agent.performance.correct + agent.performance.incorrect;
    
    this.globalMetrics.learningCycles++;
    
    console.log(`✅ Fine-tuning complete for ${agentId}`);
    this.emit('agent_tuned', { agentId, patterns, parameters: agent.parameters });
  }
  
  /**
   * Analyze decision patterns
   */
  analyzeDecisionPatterns(agent) {
    const recentDecisions = agent.memory.decisions.slice(-50);
    
    let overconfidentFailures = 0;
    let underconfidentSuccesses = 0;
    let totalResponseTime = 0;
    let accurateSlowDecisions = 0;
    let inaccurateFastDecisions = 0;
    
    recentDecisions.forEach(decision => {
      totalResponseTime += decision.responseTime || 0;
      
      if (decision.outcome) {
        if (!decision.outcome.success && decision.confidence > 0.7) {
          overconfidentFailures++;
        }
        if (decision.outcome.success && decision.confidence < 0.5) {
          underconfidentSuccesses++;
        }
        
        if (decision.outcome.success && decision.responseTime > 2000) {
          accurateSlowDecisions++;
        }
        if (!decision.outcome.success && decision.responseTime < 500) {
          inaccurateFastDecisions++;
        }
      }
    });
    
    return {
      overconfidence: overconfidentFailures / recentDecisions.length,
      underconfidence: underconfidentSuccesses / recentDecisions.length,
      avgResponseTime: totalResponseTime / recentDecisions.length,
      slowButAccurate: accurateSlowDecisions / recentDecisions.length > 0.3,
      fastButInaccurate: inaccurateFastDecisions / recentDecisions.length > 0.3
    };
  }
  
  /**
   * Create decision models
   */
  createEconomicModel() {
    return {
      analyzeContext: (context, parameters) => ({
        summary: `Economic analysis of ${context.type || 'general'} decision`,
        factors: {
          marketConditions: context.marketConditions || 'stable',
          costBenefit: context.value || 0,
          riskLevel: context.risk || 'medium'
        }
      }),
      
      generateOptions: (analysis, memories, parameters) => {
        const options = [];
        
        // Conservative option
        options.push({
          type: 'conservative',
          summary: 'Minimize risk, stable returns',
          expectedValue: analysis.factors.costBenefit * 0.8,
          risk: 0.2
        });
        
        // Balanced option
        options.push({
          type: 'balanced',
          summary: 'Balance risk and reward',
          expectedValue: analysis.factors.costBenefit,
          risk: 0.5
        });
        
        // Aggressive option
        if (parameters.riskTolerance > 0.6) {
          options.push({
            type: 'aggressive',
            summary: 'Maximize returns, accept risk',
            expectedValue: analysis.factors.costBenefit * 1.5,
            risk: 0.8
          });
        }
        
        return options;
      },
      
      evaluateOptions: (options, context, agent) => {
        return options.map(option => {
          let score = option.expectedValue / (1 + option.risk);
          
          // Adjust based on agent parameters
          score *= (1 - Math.abs(option.risk - agent.parameters.riskTolerance));
          
          return {
            option,
            score,
            risks: [`Risk level: ${option.risk}`],
            benefits: [`Expected value: ${option.expectedValue}`]
          };
        });
      }
    };
  }
  
  createTrendModel() {
    return {
      analyzeContext: (context, parameters) => ({
        summary: `Trend analysis for ${context.domain || 'general'} domain`,
        factors: {
          currentTrends: context.trends || [],
          velocity: context.trendVelocity || 0,
          lifecycle: context.trendLifecycle || 'emerging'
        }
      }),
      
      generateOptions: (analysis, memories, parameters) => {
        const options = [];
        
        options.push({
          type: 'follow_trend',
          summary: 'Follow current trending patterns',
          confidence: 0.7
        });
        
        options.push({
          type: 'anticipate_next',
          summary: 'Anticipate next trend wave',
          confidence: 0.5
        });
        
        if (parameters.creativityLevel > 0.7) {
          options.push({
            type: 'create_trend',
            summary: 'Attempt to create new trend',
            confidence: 0.3
          });
        }
        
        return options;
      },
      
      evaluateOptions: (options, context, agent) => {
        return options.map(option => {
          let score = option.confidence;
          
          // Boost score based on creativity parameter
          if (option.type === 'create_trend') {
            score *= agent.parameters.creativityLevel;
          }
          
          return {
            option,
            score,
            risks: ['Trend may not materialize'],
            benefits: ['First mover advantage']
          };
        });
      }
    };
  }
  
  createBrandModel() {
    return {
      analyzeContext: (context, parameters) => ({
        summary: `Brand generation for ${context.industry || 'general'} industry`,
        factors: {
          targetAudience: context.audience || 'general',
          brandValues: context.values || [],
          competition: context.competitors || []
        }
      }),
      
      generateOptions: (analysis, memories, parameters) => {
        const archetypes = ['Hero', 'Outlaw', 'Magician', 'Creator', 'Explorer'];
        
        return archetypes.slice(0, 3 + Math.floor(parameters.creativityLevel * 2)).map(archetype => ({
          type: 'brand_concept',
          summary: `${archetype} archetype brand`,
          archetype,
          differentiation: Math.random()
        }));
      },
      
      evaluateOptions: (options, context, agent) => {
        return options.map(option => {
          let score = option.differentiation;
          
          // Consider market fit
          if (context.culturalMood === 'optimistic' && 
              ['Hero', 'Creator', 'Magician'].includes(option.archetype)) {
            score *= 1.2;
          }
          
          return {
            option,
            score,
            risks: ['Market saturation'],
            benefits: [`Strong ${option.archetype} positioning`]
          };
        });
      }
    };
  }
  
  createLegalModel() {
    return {
      analyzeContext: (context, parameters) => ({
        summary: `Legal analysis for ${context.type || 'general'} matter`,
        factors: {
          jurisdiction: context.jurisdiction || 'US',
          regulations: context.relevantLaws || [],
          riskAreas: context.riskAreas || []
        }
      }),
      
      generateOptions: (analysis, memories, parameters) => {
        return [
          {
            type: 'approve',
            summary: 'Approve with standard compliance',
            complianceLevel: 0.9
          },
          {
            type: 'conditional',
            summary: 'Approve with conditions',
            complianceLevel: 0.7
          },
          {
            type: 'reject',
            summary: 'Reject due to compliance issues',
            complianceLevel: 0.3
          }
        ];
      },
      
      evaluateOptions: (options, context, agent) => {
        return options.map(option => {
          let score = option.complianceLevel;
          
          // Legal decisions favor safety
          if (option.type === 'reject' && agent.parameters.riskTolerance < 0.3) {
            score *= 1.5;
          }
          
          return {
            option,
            score,
            risks: option.type === 'approve' ? ['Regulatory risk'] : [],
            benefits: option.type === 'approve' ? ['Business continuity'] : ['Risk mitigation']
          };
        });
      }
    };
  }
  
  createTechnicalModel() {
    return {
      analyzeContext: (context, parameters) => ({
        summary: `Technical analysis for ${context.system || 'general'} system`,
        factors: {
          complexity: context.complexity || 'medium',
          resources: context.resources || {},
          constraints: context.constraints || []
        }
      }),
      
      generateOptions: (analysis, memories, parameters) => {
        const options = [
          {
            type: 'simple',
            summary: 'Simple, proven solution',
            complexity: 0.3,
            reliability: 0.9
          },
          {
            type: 'balanced',
            summary: 'Balanced approach',
            complexity: 0.6,
            reliability: 0.7
          }
        ];
        
        if (parameters.analyticalDepth > 0.7) {
          options.push({
            type: 'advanced',
            summary: 'Advanced, optimized solution',
            complexity: 0.9,
            reliability: 0.6
          });
        }
        
        return options;
      },
      
      evaluateOptions: (options, context, agent) => {
        return options.map(option => {
          let score = option.reliability * (1 - option.complexity * 0.3);
          
          // Adjust based on available resources
          if (context.resources?.time === 'limited' && option.complexity > 0.7) {
            score *= 0.5;
          }
          
          return {
            option,
            score,
            risks: [`Complexity: ${option.complexity}`],
            benefits: [`Reliability: ${option.reliability}`]
          };
        });
      }
    };
  }
  
  /**
   * Explore alternative decision
   */
  exploreAlternative(original, alternatives) {
    if (alternatives.length === 0) return original;
    
    // Pick a random alternative
    const alternative = alternatives[Math.floor(Math.random() * alternatives.length)];
    
    console.log(`🔍 Exploring alternative: ${alternative.summary} instead of ${original.summary}`);
    
    return alternative;
  }
  
  /**
   * Get insights about an agent
   */
  getAgentInsights(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;
    
    const insights = {
      performance: agent.performance,
      parameters: agent.parameters,
      strengths: [],
      weaknesses: [],
      recommendations: []
    };
    
    // Analyze patterns for insights
    const successfulPatterns = Array.from(agent.memory.patterns.values())
      .filter(p => p.successCount > p.failureCount)
      .sort((a, b) => b.successCount - a.successCount)
      .slice(0, 5);
    
    const failurePatterns = Array.from(agent.memory.patterns.values())
      .filter(p => p.failureCount > p.successCount)
      .sort((a, b) => b.failureCount - a.failureCount)
      .slice(0, 5);
    
    if (successfulPatterns.length > 0) {
      insights.strengths = successfulPatterns.map(p => 
        `Strong in ${p.feature} contexts (${p.successCount} successes)`
      );
    }
    
    if (failurePatterns.length > 0) {
      insights.weaknesses = failurePatterns.map(p => 
        `Struggles with ${p.feature} contexts (${p.failureCount} failures)`
      );
    }
    
    // Generate recommendations
    if (agent.performance.accuracy < 0.6) {
      insights.recommendations.push('Needs significant fine-tuning');
    }
    
    if (agent.parameters.confidence < 0.3) {
      insights.recommendations.push('Increase confidence through successful experiences');
    }
    
    if (agent.performance.avgResponseTime > 3000) {
      insights.recommendations.push('Optimize for faster decision-making');
    }
    
    return insights;
  }
  
  /**
   * Reset an agent
   */
  resetAgent(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    
    // Reset performance
    agent.performance = {
      decisions: 0,
      correct: 0,
      incorrect: 0,
      accuracy: 0,
      avgResponseTime: 0,
      lastDecision: null
    };
    
    // Clear memory but keep some patterns
    const importantPatterns = Array.from(agent.memory.patterns.entries())
      .filter(([_, pattern]) => pattern.successCount > 10)
      .slice(0, 20);
    
    agent.memory = {
      decisions: [],
      patterns: new Map(importantPatterns),
      preferences: {},
      contextualKnowledge: new Map()
    };
    
    // Reset parameters to defaults
    agent.parameters = {
      confidence: 0.5,
      riskTolerance: 0.5,
      creativityLevel: 0.5,
      analyticalDepth: 0.5,
      speedVsAccuracy: 0.5
    };
    
    console.log(`🔄 Agent ${agentId} reset`);
    this.emit('agent_reset', { agentId });
  }
  
  /**
   * Record decision in history
   */
  recordDecision(agent, decision, responseTime) {
    decision.responseTime = responseTime;
    
    // Update agent performance
    agent.performance.lastDecision = decision.id;
    agent.performance.avgResponseTime = 
      (agent.performance.avgResponseTime * agent.performance.decisions + responseTime) / 
      (agent.performance.decisions + 1);
    
    // Add to history
    const history = this.decisionHistory.get(agent.id);
    history.push(decision);
    
    // Limit history size
    if (history.length > this.learningConfig.memorySize) {
      this.decisionHistory.set(agent.id, history.slice(-this.learningConfig.memorySize));
    }
    
    // Update global metrics
    this.globalMetrics.totalDecisions++;
    this.globalMetrics.avgDecisionTime = 
      (this.globalMetrics.avgDecisionTime * (this.globalMetrics.totalDecisions - 1) + responseTime) / 
      this.globalMetrics.totalDecisions;
  }
  
  /**
   * Sanitize context for storage
   */
  sanitizeContext(context) {
    // Remove any sensitive or large data
    const sanitized = {};
    
    Object.entries(context).forEach(([key, value]) => {
      if (typeof value === 'string' && value.length < 1000) {
        sanitized[key] = value;
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value) && value.length < 100) {
        sanitized[key] = value.slice(0, 10); // Limit array size
      } else if (typeof value === 'object' && value !== null) {
        // Store only a summary of objects
        sanitized[key] = { type: 'object', keys: Object.keys(value).slice(0, 5) };
      }
    });
    
    return sanitized;
  }
  
  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    setInterval(() => {
      this.collectPerformanceMetrics();
    }, 60000); // Every minute
  }
  
  /**
   * Collect performance metrics
   */
  collectPerformanceMetrics() {
    const agentMetrics = [];
    
    this.agents.forEach((agent, agentId) => {
      if (agent.performance.decisions > 0) {
        agentMetrics.push({
          agentId,
          type: agent.type,
          accuracy: agent.performance.accuracy,
          decisions: agent.performance.decisions,
          avgResponseTime: agent.performance.avgResponseTime
        });
      }
    });
    
    if (agentMetrics.length > 0) {
      console.log('\n📊 Agent Performance Report:');
      agentMetrics.forEach(metrics => {
        console.log(`   ${metrics.agentId}: ${(metrics.accuracy * 100).toFixed(1)}% accuracy, ${metrics.avgResponseTime.toFixed(0)}ms avg response`);
      });
    }
    
    this.emit('performance_report', {
      agents: agentMetrics,
      global: this.globalMetrics,
      timestamp: Date.now()
    });
  }
  
  /**
   * Start learning cycles
   */
  startLearningCycles() {
    setInterval(() => {
      this.performLearningCycle();
    }, 300000); // Every 5 minutes
  }
  
  /**
   * Perform a learning cycle
   */
  performLearningCycle() {
    console.log('\n🔄 Performing learning cycle...');
    
    let agentsTuned = 0;
    
    this.agents.forEach((agent, agentId) => {
      if (agent.performance.decisions >= this.learningConfig.minDecisionsForLearning) {
        const patterns = this.analyzeDecisionPatterns(agent);
        
        if (agent.performance.accuracy < this.learningConfig.learningThreshold ||
            patterns.overconfidence > 0.3 ||
            patterns.underconfidence > 0.3) {
          this.fineTuneAgent(agentId);
          agentsTuned++;
        }
      }
    });
    
    if (agentsTuned > 0) {
      console.log(`✅ Learning cycle complete: ${agentsTuned} agents fine-tuned`);
    } else {
      console.log('✅ Learning cycle complete: All agents performing well');
    }
  }
  
  /**
   * Get all agents
   */
  getAllAgents() {
    return Array.from(this.agents.values()).map(agent => ({
      id: agent.id,
      type: agent.type,
      model: agent.model,
      state: agent.state,
      performance: agent.performance,
      parameters: agent.parameters
    }));
  }
  
  /**
   * Get global statistics
   */
  getGlobalStats() {
    return {
      totalAgents: this.agents.size,
      activeAgents: Array.from(this.agents.values()).filter(a => a.state === 'active').length,
      globalMetrics: this.globalMetrics,
      bestPerformer: this.getBestPerformer(),
      worstPerformer: this.getWorstPerformer()
    };
  }
  
  getBestPerformer() {
    let best = null;
    let bestAccuracy = 0;
    
    this.agents.forEach(agent => {
      if (agent.performance.decisions > 10 && agent.performance.accuracy > bestAccuracy) {
        bestAccuracy = agent.performance.accuracy;
        best = {
          id: agent.id,
          type: agent.type,
          accuracy: agent.performance.accuracy,
          decisions: agent.performance.decisions
        };
      }
    });
    
    return best;
  }
  
  getWorstPerformer() {
    let worst = null;
    let worstAccuracy = 1;
    
    this.agents.forEach(agent => {
      if (agent.performance.decisions > 10 && agent.performance.accuracy < worstAccuracy) {
        worstAccuracy = agent.performance.accuracy;
        worst = {
          id: agent.id,
          type: agent.type,
          accuracy: agent.performance.accuracy,
          decisions: agent.performance.decisions
        };
      }
    });
    
    return worst;
  }
}

// Export for use
module.exports = AgentReasoningEngine;

// Demo if run directly
if (require.main === module) {
  console.log('🧠 Starting Agent Reasoning Engine Demo...\n');
  
  const engine = new AgentReasoningEngine();
  
  // Create test agents
  async function runDemo() {
    // Create different types of agents
    const priceAgent = await engine.createAgent({
      id: 'price-optimizer-001',
      type: 'pricing',
      model: 'economic-reasoning',
      capabilities: ['market-analysis', 'price-optimization']
    });
    
    const trendAgent = await engine.createAgent({
      id: 'trend-analyzer-001',
      type: 'cultural',
      model: 'trend-detection',
      capabilities: ['trend-analysis', 'viral-prediction']
    });
    
    // Test decision making
    console.log('\n🧪 Testing agent decisions...\n');
    
    // Price decision
    const priceDecision = await priceAgent.makeDecision({
      type: 'product-pricing',
      marketConditions: 'competitive',
      value: 100,
      risk: 'medium',
      competitors: ['BrandA', 'BrandB']
    });
    
    console.log('Price decision:', priceDecision);
    
    // Trend decision
    const trendDecision = await trendAgent.makeDecision({
      domain: 'technology',
      trends: ['AI', 'sustainability', 'crypto'],
      trendVelocity: 0.8,
      trendLifecycle: 'growing'
    });
    
    console.log('\nTrend decision:', trendDecision);
    
    // Simulate outcomes
    setTimeout(async () => {
      console.log('\n📊 Updating with outcomes...\n');
      
      await priceAgent.updateOutcome(priceDecision.decisionId, {
        success: true,
        feedback: 'Price point was well received by market',
        metrics: { conversionRate: 0.15, revenue: 1500 }
      });
      
      await trendAgent.updateOutcome(trendDecision.decisionId, {
        success: false,
        feedback: 'Trend prediction was too early',
        metrics: { accuracy: 0.3 }
      });
      
      // Get insights
      console.log('\n💡 Agent Insights:\n');
      console.log('Price Agent:', priceAgent.getInsights());
      console.log('\nTrend Agent:', trendAgent.getInsights());
      
      // Global stats
      console.log('\n📈 Global Statistics:');
      console.log(engine.getGlobalStats());
      
    }, 2000);
  }
  
  // Listen for events
  engine.on('agent_tuned', (data) => {
    console.log(`\n🔧 Agent ${data.agentId} was fine-tuned`);
    console.log('New parameters:', data.parameters);
  });
  
  engine.on('performance_report', (report) => {
    console.log('\n📊 Performance Report:', report.global);
  });
  
  runDemo();
}