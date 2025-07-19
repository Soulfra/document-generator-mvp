/**
 * Reasoning Session - Manages persistent reasoning state across agent restarts
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class ReasoningSession extends EventEmitter {
  constructor(sessionData, database, aiClient = null) {
    super();
    this.id = sessionData.id || uuidv4();
    this.agentId = sessionData.agentId;
    this.task = sessionData.task;
    this.context = sessionData.context || {};
    this.pattern = sessionData.pattern;
    this.steps = sessionData.steps || [];
    this.currentStep = sessionData.currentStep || 0;
    this.status = sessionData.status || 'initialized';
    this.startTime = sessionData.startTime || Date.now();
    this.endTime = sessionData.endTime || null;
    this.confidence = sessionData.confidence || 0;
    this.metadata = sessionData.metadata || {};
    
    this.database = database;
    this.aiClient = aiClient;
    
    // Memory management
    this.workingMemory = new Map();
    this.longTermMemory = new Map();
    this.episodicMemory = [];
    
    // Learning capabilities
    this.learnedPatterns = new Map();
    this.feedbackHistory = [];
  }

  /**
   * Initialize session from database or create new
   */
  static async load(sessionId, database, aiClient) {
    const data = database.getReasoningSession(sessionId);
    if (!data) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const session = new ReasoningSession({
      id: data.id,
      agentId: data.agent_id,
      task: JSON.parse(data.task),
      context: JSON.parse(data.context),
      pattern: data.pattern,
      steps: JSON.parse(data.steps || '[]'),
      currentStep: data.current_step,
      status: data.status,
      startTime: new Date(data.created_at).getTime(),
      endTime: data.completed_at ? new Date(data.completed_at).getTime() : null,
      confidence: data.confidence,
      metadata: JSON.parse(data.metadata || '{}')
    }, database, aiClient);

    // Load thoughts
    const thoughts = database.getThoughtsBySession(sessionId);
    session.loadThoughts(thoughts);

    return session;
  }

  /**
   * Save session state to database
   */
  async save() {
    const sessionData = {
      id: this.id,
      agent_id: this.agentId,
      task: JSON.stringify(this.task),
      context: JSON.stringify(this.context),
      pattern: this.pattern,
      steps: JSON.stringify(this.steps),
      current_step: this.currentStep,
      status: this.status,
      confidence: this.confidence,
      metadata: JSON.stringify(this.metadata),
      updated_at: new Date().toISOString()
    };

    if (this.endTime) {
      sessionData.completed_at = new Date(this.endTime).toISOString();
    }

    this.database.updateReasoningSession(this.id, sessionData);
    
    this.emit('session:saved', { sessionId: this.id });
  }

  /**
   * Load thoughts from database
   */
  loadThoughts(thoughts) {
    thoughts.forEach(thought => {
      // Reconstruct working memory
      if (thought.memory_type === 'working') {
        this.workingMemory.set(thought.key, JSON.parse(thought.value));
      }
      
      // Reconstruct long-term memory
      if (thought.memory_type === 'long_term') {
        this.longTermMemory.set(thought.key, JSON.parse(thought.value));
      }
      
      // Reconstruct episodic memory
      if (thought.memory_type === 'episodic') {
        this.episodicMemory.push(JSON.parse(thought.value));
      }
    });
  }

  /**
   * Add a thought to the session
   */
  async addThought(stepName, content, confidence, evidence = []) {
    const thought = {
      id: uuidv4(),
      step: stepName,
      content,
      confidence,
      evidence,
      timestamp: Date.now(),
      memoryContext: this.captureMemoryContext()
    };

    this.steps.push(thought);
    
    // Store in database
    this.database.insertThought({
      id: thought.id,
      session_id: this.id,
      step_number: this.steps.length - 1,
      step_name: stepName,
      thought: content,
      confidence,
      evidence: JSON.stringify(evidence),
      memory_context: JSON.stringify(thought.memoryContext),
      created_at: new Date().toISOString()
    });

    // Update working memory
    this.workingMemory.set(stepName, { content, confidence, evidence });
    
    // Add to episodic memory
    this.episodicMemory.push({
      type: 'thought',
      step: stepName,
      content,
      timestamp: thought.timestamp
    });

    this.emit('thought:added', thought);
    
    // Learn from high-confidence thoughts
    if (confidence > 0.8) {
      await this.learnFromThought(thought);
    }

    return thought;
  }

  /**
   * Capture current memory context
   */
  captureMemoryContext() {
    return {
      workingMemorySize: this.workingMemory.size,
      longTermMemorySize: this.longTermMemory.size,
      episodicMemoryLength: this.episodicMemory.length,
      recentMemories: Array.from(this.workingMemory.entries()).slice(-3)
    };
  }

  /**
   * Learn from high-confidence thoughts
   */
  async learnFromThought(thought) {
    const pattern = {
      context: this.task.type,
      step: thought.step,
      thought: thought.content,
      confidence: thought.confidence,
      timestamp: thought.timestamp
    };

    // Store in long-term memory
    const key = `${this.task.type}:${thought.step}`;
    const existing = this.longTermMemory.get(key) || [];
    existing.push(pattern);
    this.longTermMemory.set(key, existing);

    // Identify repeated patterns
    if (existing.length > 3) {
      const commonality = this.findCommonPatterns(existing);
      if (commonality) {
        this.learnedPatterns.set(key, commonality);
        console.log(`📚 Learned pattern for ${key}: ${commonality.pattern}`);
      }
    }
  }

  /**
   * Find common patterns in thoughts
   */
  findCommonPatterns(thoughts) {
    // Simple pattern detection - in production would use ML
    const contents = thoughts.map(t => t.thought);
    
    // Find common words/phrases
    const wordFreq = {};
    contents.forEach(content => {
      const words = content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
    });

    // Find most common meaningful words
    const commonWords = Object.entries(wordFreq)
      .filter(([word, freq]) => freq > thoughts.length * 0.6 && word.length > 3)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    if (commonWords.length > 0) {
      return {
        pattern: commonWords.join(' '),
        confidence: 0.7,
        examples: thoughts.slice(-3)
      };
    }

    return null;
  }

  /**
   * Reflect on current reasoning progress
   */
  async reflect() {
    const reflection = {
      sessionId: this.id,
      progress: this.calculateProgress(),
      confidence: this.calculateConfidence(),
      insights: this.extractInsights(),
      concerns: this.identifyConcerns(),
      timestamp: Date.now()
    };

    // Add to episodic memory
    this.episodicMemory.push({
      type: 'reflection',
      content: reflection,
      timestamp: reflection.timestamp
    });

    console.log(`🤔 Reflection: Progress ${reflection.progress}%, Confidence ${reflection.confidence.toFixed(2)}`);

    this.emit('session:reflection', reflection);

    return reflection;
  }

  /**
   * Calculate reasoning progress
   */
  calculateProgress() {
    if (!this.pattern || this.steps.length === 0) return 0;
    
    // Assuming pattern defines expected number of steps
    const expectedSteps = this.metadata.expectedSteps || 6;
    return Math.min(100, Math.round((this.steps.length / expectedSteps) * 100));
  }

  /**
   * Calculate overall confidence
   */
  calculateConfidence() {
    if (this.steps.length === 0) return 0;
    
    const weights = this.steps.map((step, index) => {
      // More recent steps have higher weight
      const recencyWeight = (index + 1) / this.steps.length;
      return step.confidence * recencyWeight;
    });

    const totalWeight = this.steps.length * (this.steps.length + 1) / 2;
    const weightedSum = weights.reduce((sum, w, i) => sum + w * (i + 1), 0);
    
    return weightedSum / totalWeight;
  }

  /**
   * Extract key insights from reasoning
   */
  extractInsights() {
    const insights = [];

    // High confidence findings
    const highConfidenceSteps = this.steps.filter(s => s.confidence > 0.85);
    highConfidenceSteps.forEach(step => {
      insights.push({
        type: 'high_confidence',
        step: step.step,
        content: step.content,
        confidence: step.confidence
      });
    });

    // Learned patterns
    this.learnedPatterns.forEach((pattern, key) => {
      insights.push({
        type: 'learned_pattern',
        context: key,
        pattern: pattern.pattern,
        confidence: pattern.confidence
      });
    });

    return insights;
  }

  /**
   * Identify concerns in reasoning
   */
  identifyConcerns() {
    const concerns = [];

    // Low confidence steps
    const lowConfidenceSteps = this.steps.filter(s => s.confidence < 0.5);
    lowConfidenceSteps.forEach(step => {
      concerns.push({
        type: 'low_confidence',
        step: step.step,
        confidence: step.confidence,
        severity: step.confidence < 0.3 ? 'high' : 'medium'
      });
    });

    // Stalled progress
    if (this.steps.length > 0) {
      const timeSinceLastStep = Date.now() - this.steps[this.steps.length - 1].timestamp;
      if (timeSinceLastStep > 60000) { // 1 minute
        concerns.push({
          type: 'stalled',
          duration: timeSinceLastStep,
          severity: 'high'
        });
      }
    }

    return concerns;
  }

  /**
   * Apply feedback to improve reasoning
   */
  async applyFeedback(feedback) {
    this.feedbackHistory.push({
      ...feedback,
      timestamp: Date.now()
    });

    // Adjust confidence based on feedback
    if (feedback.stepName && feedback.rating) {
      const step = this.steps.find(s => s.step === feedback.stepName);
      if (step) {
        const adjustment = (feedback.rating - 3) * 0.1; // -0.2 to +0.2
        step.confidence = Math.max(0, Math.min(1, step.confidence + adjustment));
        
        console.log(`📝 Applied feedback to ${feedback.stepName}: confidence ${step.confidence.toFixed(2)}`);
      }
    }

    // Learn from feedback
    if (feedback.suggestion) {
      this.workingMemory.set('feedback_suggestion', feedback.suggestion);
    }

    await this.save();
  }

  /**
   * Branch reasoning to explore alternative path
   */
  async branch(branchPoint) {
    const branchId = `${this.id}-branch-${Date.now()}`;
    
    const branchSession = new ReasoningSession({
      id: branchId,
      agentId: this.agentId,
      task: this.task,
      context: { ...this.context, parentSession: this.id, branchPoint },
      pattern: this.pattern,
      steps: this.steps.slice(0, branchPoint + 1),
      currentStep: branchPoint + 1,
      status: 'active',
      metadata: { ...this.metadata, isBranch: true }
    }, this.database, this.aiClient);

    // Copy relevant memories
    this.workingMemory.forEach((value, key) => {
      branchSession.workingMemory.set(key, value);
    });

    console.log(`🌿 Created reasoning branch at step ${branchPoint}`);
    
    this.emit('session:branched', { 
      parentId: this.id, 
      branchId: branchSession.id,
      branchPoint 
    });

    return branchSession;
  }

  /**
   * Merge insights from branch back to main session
   */
  async mergeBranch(branchSession) {
    console.log(`🔀 Merging branch ${branchSession.id} into ${this.id}`);

    // Compare branch insights with main
    const branchInsights = branchSession.extractInsights();
    const mainInsights = this.extractInsights();

    // Merge unique insights
    branchInsights.forEach(insight => {
      const exists = mainInsights.some(i => 
        i.type === insight.type && i.content === insight.content
      );
      
      if (!exists) {
        this.workingMemory.set(`branch_insight_${Date.now()}`, insight);
      }
    });

    // Update confidence if branch performed better
    if (branchSession.calculateConfidence() > this.calculateConfidence()) {
      console.log(`✨ Branch had higher confidence, adopting branch reasoning`);
      this.steps = [...branchSession.steps];
      this.currentStep = branchSession.currentStep;
    }

    await this.save();
  }

  /**
   * Export session for analysis or sharing
   */
  exportSession() {
    return {
      id: this.id,
      agentId: this.agentId,
      task: this.task,
      pattern: this.pattern,
      status: this.status,
      duration: this.endTime ? this.endTime - this.startTime : Date.now() - this.startTime,
      confidence: this.calculateConfidence(),
      progress: this.calculateProgress(),
      steps: this.steps,
      insights: this.extractInsights(),
      concerns: this.identifyConcerns(),
      learnedPatterns: Array.from(this.learnedPatterns.entries()),
      feedbackHistory: this.feedbackHistory,
      metadata: this.metadata
    };
  }

  /**
   * Check if session can continue
   */
  canContinue() {
    return this.status === 'active' && 
           this.calculateProgress() < 100 &&
           this.identifyConcerns().filter(c => c.severity === 'high').length === 0;
  }

  /**
   * Pause session
   */
  pause() {
    if (this.status === 'active') {
      this.status = 'paused';
      this.save();
      console.log(`⏸️ Session ${this.id} paused`);
      this.emit('session:paused', { sessionId: this.id });
    }
  }

  /**
   * Resume session
   */
  resume() {
    if (this.status === 'paused') {
      this.status = 'active';
      this.save();
      console.log(`▶️ Session ${this.id} resumed`);
      this.emit('session:resumed', { sessionId: this.id });
    }
  }

  /**
   * Complete session
   */
  complete(conclusion) {
    this.status = 'completed';
    this.endTime = Date.now();
    this.metadata.conclusion = conclusion;
    this.confidence = this.calculateConfidence();
    
    this.save();
    
    console.log(`✅ Session ${this.id} completed with confidence ${this.confidence.toFixed(2)}`);
    
    this.emit('session:completed', {
      sessionId: this.id,
      conclusion,
      confidence: this.confidence,
      duration: this.endTime - this.startTime
    });
  }

  /**
   * Fail session
   */
  fail(error) {
    this.status = 'failed';
    this.endTime = Date.now();
    this.metadata.error = error;
    
    this.save();
    
    console.error(`❌ Session ${this.id} failed:`, error);
    
    this.emit('session:failed', {
      sessionId: this.id,
      error,
      lastStep: this.steps[this.steps.length - 1]
    });
  }
}

module.exports = ReasoningSession;