/**
 * AI Conductor Service
 * Advanced multi-agent orchestration with Tree of Thought, semantic clustering, and self-learning capabilities
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { agentRegistry, AgentDefinition, AgentTask } from './agent-registry.service';
import { llmRouter } from '../../llm/router';
import { redis } from '../../config/redis';
import { prometheusMetrics } from '../monitoring/prometheus-metrics.service';

export interface ThoughtNode {
  id: string;
  content: string;
  reasoning: string;
  confidence: number;
  children: ThoughtNode[];
  parent?: string;
  depth: number;
  evaluation?: {
    feasibility: number;
    impact: number;
    effort: number;
    risk: number;
  };
}

export interface OrchestrationPlan {
  id: string;
  goal: string;
  steps: OrchestrationStep[];
  thoughtTree: ThoughtNode;
  estimatedDuration: number;
  confidence: number;
  fallbackPlan?: OrchestrationPlan;
}

export interface OrchestrationStep {
  id: string;
  type: 'analysis' | 'generation' | 'validation' | 'coordination' | 'synthesis';
  description: string;
  requiredCapabilities: string[];
  dependencies: string[];
  agentId?: string;
  taskId?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  estimatedDuration: number;
}

export interface SemanticCluster {
  id: string;
  centroid: number[];
  tasks: string[];
  theme: string;
  confidence: number;
  lastUpdated: Date;
}

export class AIConductorService {
  private activePlans: Map<string, OrchestrationPlan> = new Map();
  private semanticClusters: Map<string, SemanticCluster> = new Map();
  private performanceHistory: Map<string, number[]> = new Map();
  private readonly REDIS_PREFIX = 'ai_conductor:';
  
  constructor() {
    // Delay initialization to avoid Redis connection during module loading
    setImmediate(() => {
      this.initialize().catch(error => {
        logger.error('Failed to initialize AI Conductor', error);
      });
    });
  }
  
  private async initialize(): Promise<void> {
    await this.loadPerformanceHistory();
    this.startPatternLearning();
  }
  
  /**
   * Create an orchestration plan using Tree of Thought reasoning
   */
  async createOrchestrationPlan(
    goal: string,
    context: Record<string, any> = {},
    constraints: Record<string, any> = {}
  ): Promise<OrchestrationPlan> {
    logger.info('Creating orchestration plan', { goal });
    
    // Generate thought tree
    const thoughtTree = await this.generateThoughtTree(goal, context, constraints);
    
    // Extract best path through thought tree
    const bestPath = this.extractBestPath(thoughtTree);
    
    // Convert thoughts to orchestration steps
    const steps = await this.thoughtsToSteps(bestPath, context);
    
    // Estimate duration and confidence
    const estimatedDuration = steps.reduce((sum, step) => sum + step.estimatedDuration, 0);
    const confidence = this.calculatePlanConfidence(steps, thoughtTree);
    
    const plan: OrchestrationPlan = {
      id: uuidv4(),
      goal,
      steps,
      thoughtTree,
      estimatedDuration,
      confidence
    };
    
    // Generate fallback plan if confidence is low
    if (confidence < 0.7) {
      plan.fallbackPlan = await this.generateFallbackPlan(goal, context, constraints);
    }
    
    this.activePlans.set(plan.id, plan);
    await this.persistPlan(plan);
    
    logger.info('Orchestration plan created', {
      planId: plan.id,
      steps: steps.length,
      estimatedDuration,
      confidence
    });
    
    return plan;
  }
  
  /**
   * Execute an orchestration plan
   */
  async executePlan(planId: string): Promise<any> {
    const plan = this.activePlans.get(planId);
    if (!plan) {
      throw new Error(`Plan ${planId} not found`);
    }
    
    logger.info('Executing orchestration plan', { planId, goal: plan.goal });
    
    try {
      const result = await this.executeSteps(plan.steps);
      
      // Record successful execution
      this.recordPlanPerformance(planId, true);
      
      logger.info('Plan execution completed successfully', { planId });
      
      return result;
    } catch (error) {
      logger.error('Plan execution failed', { planId, error });
      
      // Try fallback plan if available
      if (plan.fallbackPlan) {
        logger.info('Attempting fallback plan', { planId });
        try {
          const fallbackResult = await this.executeSteps(plan.fallbackPlan.steps);
          this.recordPlanPerformance(planId, true);
          return fallbackResult;
        } catch (fallbackError) {
          logger.error('Fallback plan also failed', { planId, fallbackError });
        }
      }
      
      this.recordPlanPerformance(planId, false);
      throw error;
    }
  }
  
  /**
   * Generate Tree of Thought for complex reasoning
   */
  private async generateThoughtTree(
    goal: string,
    context: Record<string, any>,
    constraints: Record<string, any>,
    depth: number = 0,
    maxDepth: number = 3
  ): Promise<ThoughtNode> {
    if (depth >= maxDepth) {
      return {
        id: uuidv4(),
        content: goal,
        reasoning: 'Maximum depth reached',
        confidence: 0.5,
        children: [],
        depth
      };
    }
    
    // Generate multiple thought branches
    const prompt = this.buildThoughtPrompt(goal, context, constraints, depth);
    
    try {
      const response = await llmRouter.generateResponse(prompt, {
        temperature: 0.7,
        maxTokens: 1000
      });
      
      const thoughts = this.parseThoughtResponse(response);
      
      const node: ThoughtNode = {
        id: uuidv4(),
        content: goal,
        reasoning: thoughts.reasoning || 'Generated through Tree of Thought',
        confidence: thoughts.confidence || 0.8,
        children: [],
        depth,
        evaluation: thoughts.evaluation
      };
      
      // Generate children for promising branches
      if (thoughts.alternatives && depth < maxDepth - 1) {
        for (const alternative of thoughts.alternatives.slice(0, 3)) { // Limit branching
          const child = await this.generateThoughtTree(
            alternative,
            context,
            constraints,
            depth + 1,
            maxDepth
          );
          child.parent = node.id;
          node.children.push(child);
        }
      }
      
      return node;
    } catch (error) {
      logger.error('Failed to generate thought tree', { goal, depth, error });
      
      return {
        id: uuidv4(),
        content: goal,
        reasoning: 'Error in thought generation',
        confidence: 0.3,
        children: [],
        depth
      };
    }
  }
  
  /**
   * Build prompt for Tree of Thought generation
   */
  private buildThoughtPrompt(
    goal: string,
    context: Record<string, any>,
    constraints: Record<string, any>,
    depth: number
  ): string {
    return `
You are an expert AI orchestrator planning how to achieve a complex goal.

Goal: ${goal}
Context: ${JSON.stringify(context, null, 2)}
Constraints: ${JSON.stringify(constraints, null, 2)}
Thinking Depth: ${depth}

Please provide a comprehensive analysis in JSON format:

{
  "reasoning": "Your step-by-step reasoning about how to approach this goal",
  "confidence": 0.85,
  "evaluation": {
    "feasibility": 0.9,
    "impact": 0.8,
    "effort": 0.6,
    "risk": 0.3
  },
  "alternatives": [
    "Alternative approach 1",
    "Alternative approach 2",
    "Alternative approach 3"
  ],
  "nextSteps": [
    "Concrete step 1",
    "Concrete step 2"
  ]
}

Focus on practical, actionable approaches while considering constraints and context.
`;
  }
  
  /**
   * Parse LLM response into structured thought data
   */
  private parseThoughtResponse(response: string): any {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback to simple parsing
      return {
        reasoning: response.slice(0, 200),
        confidence: 0.7,
        alternatives: [],
        evaluation: {
          feasibility: 0.7,
          impact: 0.7,
          effort: 0.5,
          risk: 0.4
        }
      };
    } catch (error) {
      logger.warn('Failed to parse thought response', { error });
      return {
        reasoning: 'Unable to parse response',
        confidence: 0.5,
        alternatives: []
      };
    }
  }
  
  /**
   * Extract the best path through the thought tree
   */
  private extractBestPath(tree: ThoughtNode): ThoughtNode[] {
    const path: ThoughtNode[] = [tree];
    let current = tree;
    
    while (current.children.length > 0) {
      // Find child with highest confidence and evaluation score
      const bestChild = current.children.reduce((best, child) => {
        const bestScore = this.calculateNodeScore(best);
        const childScore = this.calculateNodeScore(child);
        return childScore > bestScore ? child : best;
      });
      
      path.push(bestChild);
      current = bestChild;
    }
    
    return path;
  }
  
  /**
   * Calculate score for a thought node
   */
  private calculateNodeScore(node: ThoughtNode): number {
    if (!node.evaluation) {
      return node.confidence;
    }
    
    const { feasibility, impact, effort, risk } = node.evaluation;
    
    // Weighted scoring formula
    return (
      feasibility * 0.3 +
      impact * 0.3 +
      (1 - effort) * 0.2 +  // Lower effort is better
      (1 - risk) * 0.2     // Lower risk is better
    ) * node.confidence;
  }
  
  /**
   * Convert thought path to orchestration steps
   */
  private async thoughtsToSteps(
    thoughts: ThoughtNode[],
    context: Record<string, any>
  ): Promise<OrchestrationStep[]> {
    const steps: OrchestrationStep[] = [];
    
    for (let i = 0; i < thoughts.length; i++) {
      const thought = thoughts[i];
      const stepType = this.inferStepType(thought.content, i, thoughts.length);
      
      const step: OrchestrationStep = {
        id: uuidv4(),
        type: stepType,
        description: thought.content,
        requiredCapabilities: this.inferCapabilities(thought.content, stepType),
        dependencies: i > 0 ? [steps[i - 1].id] : [],
        status: 'pending',
        estimatedDuration: this.estimateStepDuration(thought, stepType)
      };
      
      steps.push(step);
    }
    
    return steps;
  }
  
  /**
   * Infer step type from content and position
   */
  private inferStepType(content: string, position: number, total: number): OrchestrationStep['type'] {
    const lowerContent = content.toLowerCase();
    
    if (position === 0) return 'analysis';
    if (position === total - 1) return 'synthesis';
    
    if (lowerContent.includes('analyze') || lowerContent.includes('research')) {
      return 'analysis';
    }
    if (lowerContent.includes('generate') || lowerContent.includes('create')) {
      return 'generation';
    }
    if (lowerContent.includes('validate') || lowerContent.includes('verify')) {
      return 'validation';
    }
    if (lowerContent.includes('coordinate') || lowerContent.includes('manage')) {
      return 'coordination';
    }
    
    return 'generation';
  }
  
  /**
   * Infer required capabilities from content
   */
  private inferCapabilities(content: string, stepType: OrchestrationStep['type']): string[] {
    const capabilities: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Add base capability based on step type
    capabilities.push(stepType);
    
    // Add specific capabilities based on content
    if (lowerContent.includes('code') || lowerContent.includes('programming')) {
      capabilities.push('code_generation', 'code_analysis');
    }
    if (lowerContent.includes('text') || lowerContent.includes('writing')) {
      capabilities.push('text_generation', 'natural_language');
    }
    if (lowerContent.includes('data') || lowerContent.includes('analysis')) {
      capabilities.push('data_analysis', 'statistical_analysis');
    }
    if (lowerContent.includes('image') || lowerContent.includes('visual')) {
      capabilities.push('image_processing', 'visual_analysis');
    }
    
    return capabilities;
  }
  
  /**
   * Estimate step duration based on complexity
   */
  private estimateStepDuration(thought: ThoughtNode, stepType: OrchestrationStep['type']): number {
    const baseTime = {
      analysis: 30,
      generation: 60,
      validation: 20,
      coordination: 10,
      synthesis: 40
    };
    
    const base = baseTime[stepType] || 30;
    
    // Adjust based on evaluation
    if (thought.evaluation) {
      const complexity = thought.evaluation.effort || 0.5;
      return Math.round(base * (0.5 + complexity));
    }
    
    return base;
  }
  
  /**
   * Execute orchestration steps
   */
  private async executeSteps(steps: OrchestrationStep[]): Promise<any> {
    const results: any[] = [];
    
    for (const step of steps) {
      logger.info('Executing step', { stepId: step.id, type: step.type });
      
      step.status = 'running';
      
      try {
        // Find suitable agent
        const agents = agentRegistry.listAgents({
          status: 'idle',
          capabilities: step.requiredCapabilities
        });
        
        if (agents.length === 0) {
          throw new Error(`No available agents with capabilities: ${step.requiredCapabilities.join(', ')}`);
        }
        
        // Submit task to agent
        const taskId = await agentRegistry.submitTask(
          step.type,
          { description: step.description, context: results },
          'medium',
          step.estimatedDuration
        );
        
        step.taskId = taskId;
        
        // Wait for task completion
        const result = await this.waitForTaskCompletion(taskId);
        
        step.status = 'completed';
        step.result = result;
        results.push(result);
        
        logger.info('Step completed', { stepId: step.id, type: step.type });
        
      } catch (error) {
        step.status = 'failed';
        logger.error('Step failed', { stepId: step.id, error });
        throw error;
      }
    }
    
    return results;
  }
  
  /**
   * Wait for task completion
   */
  private async waitForTaskCompletion(taskId: string, timeoutMs: number = 300000): Promise<any> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const task = agentRegistry.getTask(taskId);
      
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }
      
      if (task.status === 'completed') {
        return task.result;
      }
      
      if (task.status === 'failed') {
        throw new Error(`Task failed: ${task.error}`);
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error(`Task ${taskId} timed out`);
  }
  
  /**
   * Calculate plan confidence
   */
  private calculatePlanConfidence(steps: OrchestrationStep[], thoughtTree: ThoughtNode): number {
    const stepConfidence = steps.length > 0 ? 1 / steps.length : 0.5;
    const treeConfidence = thoughtTree.confidence;
    const availabilityScore = this.calculateAgentAvailability(steps);
    
    return (stepConfidence * 0.3 + treeConfidence * 0.5 + availabilityScore * 0.2);
  }
  
  /**
   * Calculate agent availability for required capabilities
   */
  private calculateAgentAvailability(steps: OrchestrationStep[]): number {
    const allCapabilities = steps.flatMap(step => step.requiredCapabilities);
    const uniqueCapabilities = [...new Set(allCapabilities)];
    
    let availableCount = 0;
    
    for (const capability of uniqueCapabilities) {
      const agents = agentRegistry.listAgents({
        status: 'idle',
        capabilities: [capability]
      });
      
      if (agents.length > 0) {
        availableCount++;
      }
    }
    
    return uniqueCapabilities.length > 0 ? availableCount / uniqueCapabilities.length : 0;
  }
  
  /**
   * Generate fallback plan
   */
  private async generateFallbackPlan(
    goal: string,
    context: Record<string, any>,
    constraints: Record<string, any>
  ): Promise<OrchestrationPlan> {
    // Create a simpler, more conservative plan
    const simplifiedGoal = `Create a simple approach to: ${goal}`;
    const fallbackTree = await this.generateThoughtTree(simplifiedGoal, context, constraints, 0, 2);
    const fallbackPath = this.extractBestPath(fallbackTree);
    const fallbackSteps = await this.thoughtsToSteps(fallbackPath, context);
    
    return {
      id: uuidv4(),
      goal: simplifiedGoal,
      steps: fallbackSteps,
      thoughtTree: fallbackTree,
      estimatedDuration: fallbackSteps.reduce((sum, step) => sum + step.estimatedDuration, 0),
      confidence: this.calculatePlanConfidence(fallbackSteps, fallbackTree)
    };
  }
  
  /**
   * Record plan performance for learning
   */
  private recordPlanPerformance(planId: string, success: boolean): void {
    const plan = this.activePlans.get(planId);
    if (!plan) return;
    
    const history = this.performanceHistory.get(plan.goal) || [];
    history.push(success ? 1 : 0);
    
    // Keep only recent history
    if (history.length > 100) {
      history.shift();
    }
    
    this.performanceHistory.set(plan.goal, history);
    this.persistPerformanceHistory();
  }
  
  /**
   * Start pattern learning process
   */
  private startPatternLearning(): void {
    setInterval(() => {
      this.analyzePatterns();
    }, 3600000); // Every hour
  }
  
  /**
   * Analyze patterns in successful plans
   */
  private async analyzePatterns(): Promise<void> {
    logger.info('Analyzing orchestration patterns');
    
    // Analyze performance history to identify successful patterns
    for (const [goal, history] of this.performanceHistory.entries()) {
      const successRate = history.reduce((sum, val) => sum + val, 0) / history.length;
      
      if (successRate > 0.8) {
        // This is a successful pattern - record it
        prometheusMetrics.recordAchievementUnlocked('successful_pattern', 'ai_conductor');
      }
    }
  }
  
  /**
   * Get orchestration statistics
   */
  getStats(): {
    activePlans: number;
    totalPlans: number;
    averageConfidence: number;
    successRate: number;
  } {
    const totalSuccesses = Array.from(this.performanceHistory.values())
      .flat()
      .reduce((sum, val) => sum + val, 0);
    
    const totalAttempts = Array.from(this.performanceHistory.values())
      .flat().length;
    
    const averageConfidence = Array.from(this.activePlans.values())
      .reduce((sum, plan) => sum + plan.confidence, 0) / this.activePlans.size || 0;
    
    return {
      activePlans: this.activePlans.size,
      totalPlans: totalAttempts,
      averageConfidence,
      successRate: totalAttempts > 0 ? totalSuccesses / totalAttempts : 0
    };
  }
  
  /**
   * Persist orchestration plan
   */
  private async persistPlan(plan: OrchestrationPlan): Promise<void> {
    try {
      await redis.setex(
        `${this.REDIS_PREFIX}plan:${plan.id}`,
        86400, // 24 hours
        JSON.stringify(plan)
      );
    } catch (error) {
      logger.error('Failed to persist orchestration plan', { planId: plan.id, error });
    }
  }
  
  /**
   * Persist performance history
   */
  private async persistPerformanceHistory(): Promise<void> {
    try {
      const historyObject = Object.fromEntries(this.performanceHistory);
      await redis.setex(
        `${this.REDIS_PREFIX}performance_history`,
        604800, // 7 days
        JSON.stringify(historyObject)
      );
    } catch (error) {
      logger.error('Failed to persist performance history', error);
    }
  }
  
  /**
   * Load performance history from persistence
   */
  private async loadPerformanceHistory(): Promise<void> {
    try {
      const data = await redis.get(`${this.REDIS_PREFIX}performance_history`);
      if (data) {
        const historyObject = JSON.parse(data);
        this.performanceHistory = new Map(Object.entries(historyObject));
        
        logger.info('Loaded performance history', {
          goals: this.performanceHistory.size
        });
      }
    } catch (error) {
      logger.error('Failed to load performance history', error);
    }
  }
}

// Export singleton instance
export const aiConductor = new AIConductorService();