/**
 * Smart Routing Daemon
 * Adapted from Soulfra-AgentZero's SmartRoutingDaemon.js
 * Intelligently routes requests based on load, cost, and feasibility
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { MetricsService } from '../monitoring/metrics.service';
import { AIService } from '../ai/ai.service';
import { MultiTenantService } from '../multi-tenant/multi-tenant.service';

interface RoutingRequest {
  id: string;
  type: 'code_analysis' | 'ai_query' | 'code_cleanup' | 'document_generation' | 'custom';
  userId: string;
  tenantId?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  payload: any;
  constraints?: {
    maxResponseTime?: number; // ms
    preferredModel?: string;
    requiredFeatures?: string[];
    budget?: number;
  };
  metadata?: Record<string, any>;
}

interface RoutingDecision {
  requestId: string;
  timestamp: Date;
  scores: {
    internal: number;
    hybrid: number;
    external: number;
    delay: number;
  };
  chosenPath: 'internal' | 'hybrid' | 'external' | 'delay';
  reasoning: string[];
  executionPlan: ExecutionPlan;
  estimatedCost: number;
  estimatedTime: number;
  confidence: number;
}

interface ExecutionPlan {
  path: string;
  phases: ExecutionPhase[];
  timeline: string;
  checkpoints: Checkpoint[];
  fallbackStrategy?: string;
}

interface ExecutionPhase {
  name: string;
  duration: string;
  tasks: string[];
  resources: {
    service: string;
    allocation: number;
  }[];
}

interface Checkpoint {
  name: string;
  condition: string;
  action: string;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  activeRequests: number;
  queueLength: number;
  avgResponseTime: number;
  errorRate: number;
}

interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  errorRate: number;
  capacity: number;
}

export class SmartRoutingDaemon extends EventEmitter {
  private name = 'SmartRouter';
  private metricsService: MetricsService;
  private aiService: AIService;
  private multiTenantService: MultiTenantService;
  
  private routingHistory: Map<string, RoutingDecision> = new Map();
  private serviceHealth: Map<string, ServiceHealth> = new Map();
  private systemMetrics: SystemMetrics = {
    cpuUsage: 0,
    memoryUsage: 0,
    activeRequests: 0,
    queueLength: 0,
    avgResponseTime: 0,
    errorRate: 0
  };
  
  // Routing configuration
  private config = {
    internalThreshold: 0.7,
    hybridThreshold: 0.4,
    maxSystemLoad: 0.9,
    costWeights: {
      time: 0.3,
      money: 0.3,
      quality: 0.4
    },
    modelPreferences: {
      fast: ['ollama', 'gpt-3.5-turbo'],
      balanced: ['claude-3-sonnet', 'gpt-4'],
      quality: ['claude-3-opus', 'gpt-4-turbo']
    }
  };

  constructor() {
    super();
    this.metricsService = new MetricsService();
    this.aiService = new AIService();
    this.multiTenantService = new MultiTenantService();
    
    this.initializeHealthMonitoring();
    this.startMetricsCollection();
  }

  /**
   * Make routing decision for a request
   */
  async makeRoutingDecision(request: RoutingRequest): Promise<RoutingDecision> {
    logger.info('Making routing decision', { 
      requestId: request.id,
      type: request.type,
      priority: request.priority 
    });
    
    try {
      // Analyze request complexity
      const complexity = await this.analyzeRequestComplexity(request);
      
      // Check system load
      const systemLoad = await this.getSystemLoad();
      
      // Get tenant limits if applicable
      const tenantLimits = request.tenantId 
        ? await this.getTenantLimits(request.tenantId)
        : null;
      
      // Calculate feasibility scores
      const feasibilityScores = this.calculateFeasibilityScores(
        request,
        complexity,
        systemLoad,
        tenantLimits
      );
      
      // Determine best path
      const chosenPath = this.selectOptimalPath(feasibilityScores, request.priority);
      
      // Generate execution plan
      const executionPlan = this.generateExecutionPlan(
        request,
        chosenPath,
        complexity
      );
      
      // Estimate cost and time
      const estimates = this.estimateCostAndTime(executionPlan, complexity);
      
      const decision: RoutingDecision = {
        requestId: request.id,
        timestamp: new Date(),
        scores: feasibilityScores,
        chosenPath,
        reasoning: this.generateReasoning(feasibilityScores, chosenPath, systemLoad),
        executionPlan,
        estimatedCost: estimates.cost,
        estimatedTime: estimates.time,
        confidence: this.calculateConfidence(feasibilityScores, chosenPath)
      };
      
      // Store decision
      this.routingHistory.set(request.id, decision);
      
      // Emit decision event
      this.emit('routing-decision', decision);
      
      // Update metrics
      this.metricsService.recordMetric({
        name: 'routing.decision',
        value: 1,
        tags: {
          path: chosenPath,
          requestType: request.type,
          priority: request.priority
        }
      });
      
      return decision;
    } catch (error) {
      logger.error('Error making routing decision', error);
      throw error;
    }
  }

  /**
   * Execute routing decision
   */
  async executeRouting(
    request: RoutingRequest, 
    decision: RoutingDecision
  ): Promise<any> {
    logger.info('Executing routing decision', {
      requestId: request.id,
      path: decision.chosenPath
    });
    
    try {
      switch (decision.chosenPath) {
        case 'internal':
          return await this.executeInternal(request, decision.executionPlan);
          
        case 'hybrid':
          return await this.executeHybrid(request, decision.executionPlan);
          
        case 'external':
          return await this.executeExternal(request, decision.executionPlan);
          
        case 'delay':
          return await this.executeDelayed(request, decision.executionPlan);
          
        default:
          throw new Error(`Unknown routing path: ${decision.chosenPath}`);
      }
    } catch (error) {
      logger.error('Error executing routing', error);
      
      // Try fallback strategy
      if (decision.executionPlan.fallbackStrategy) {
        logger.info('Attempting fallback strategy', { 
          strategy: decision.executionPlan.fallbackStrategy 
        });
        return await this.executeFallback(request, decision.executionPlan);
      }
      
      throw error;
    }
  }

  /**
   * Analyze request complexity
   */
  private async analyzeRequestComplexity(request: RoutingRequest): Promise<{
    score: number;
    factors: Record<string, number>;
    estimatedTokens?: number;
  }> {
    const factors: Record<string, number> = {};
    
    switch (request.type) {
      case 'code_analysis':
        factors.codeSize = this.getCodeSize(request.payload);
        factors.languageComplexity = this.getLanguageComplexity(request.payload);
        factors.analysisDepth = request.payload.depth || 0.5;
        break;
        
      case 'ai_query':
        factors.promptLength = request.payload.prompt?.length || 0;
        factors.contextSize = request.payload.context?.length || 0;
        factors.responseComplexity = request.payload.expectedComplexity || 0.5;
        break;
        
      case 'code_cleanup':
        factors.codeSize = this.getCodeSize(request.payload);
        factors.refactoringDepth = request.payload.refactoringLevel || 0.5;
        factors.preservationRequirements = request.payload.preserve?.length || 0;
        break;
    }
    
    // Calculate overall complexity score
    const score = Object.values(factors).reduce((sum, factor) => sum + factor, 0) / 
                  Object.keys(factors).length;
    
    // Estimate tokens for AI operations
    const estimatedTokens = request.type === 'ai_query' 
      ? Math.ceil((factors.promptLength || 0) * 0.75)
      : undefined;
    
    return { score, factors, estimatedTokens };
  }

  /**
   * Calculate feasibility scores for each path
   */
  private calculateFeasibilityScores(
    request: RoutingRequest,
    complexity: any,
    systemLoad: number,
    tenantLimits: any
  ): Record<string, number> {
    const scores = {
      internal: 0,
      hybrid: 0,
      external: 0,
      delay: 0
    };
    
    // Internal path scoring
    scores.internal = this.scoreInternalPath(complexity, systemLoad);
    
    // Hybrid path scoring
    scores.hybrid = this.scoreHybridPath(complexity, systemLoad);
    
    // External path scoring
    scores.external = this.scoreExternalPath(request, complexity, tenantLimits);
    
    // Delay path scoring
    scores.delay = this.scoreDelayPath(systemLoad, request.priority);
    
    return scores;
  }

  /**
   * Score internal path feasibility
   */
  private scoreInternalPath(complexity: any, systemLoad: number): number {
    let score = 1.0;
    
    // Reduce score based on complexity
    score -= complexity.score * 0.3;
    
    // Reduce score based on system load
    score -= systemLoad * 0.5;
    
    // Bonus for simple requests
    if (complexity.score < 0.3) {
      score += 0.2;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Score hybrid path feasibility
   */
  private scoreHybridPath(complexity: any, systemLoad: number): number {
    let score = 0.7;
    
    // Good for medium complexity
    if (complexity.score >= 0.3 && complexity.score <= 0.7) {
      score += 0.2;
    }
    
    // Reduce based on system load
    score -= systemLoad * 0.3;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Score external path feasibility
   */
  private scoreExternalPath(request: RoutingRequest, complexity: any, tenantLimits: any): number {
    let score = 0.5;
    
    // Increase for high complexity
    if (complexity.score > 0.7) {
      score += 0.3;
    }
    
    // Check if user has API keys
    if (request.metadata?.hasApiKeys) {
      score += 0.2;
    }
    
    // Check budget constraints
    if (request.constraints?.budget) {
      const estimatedCost = complexity.estimatedTokens ? complexity.estimatedTokens * 0.0001 : 0;
      if (estimatedCost > request.constraints.budget) {
        score -= 0.4;
      }
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Score delay path
   */
  private scoreDelayPath(systemLoad: number, priority: string): number {
    let score = 0;
    
    // Only consider delay if system is overloaded
    if (systemLoad > this.config.maxSystemLoad) {
      score = 0.8;
    }
    
    // Never delay critical requests
    if (priority === 'critical') {
      score = 0;
    }
    
    return score;
  }

  /**
   * Select optimal path based on scores
   */
  private selectOptimalPath(
    scores: Record<string, number>, 
    priority: string
  ): 'internal' | 'hybrid' | 'external' | 'delay' {
    // For critical requests, avoid delay
    if (priority === 'critical' && scores.delay > 0) {
      scores.delay = 0;
    }
    
    // Find path with highest score
    let bestPath: string = 'internal';
    let bestScore = scores.internal;
    
    for (const [path, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score;
        bestPath = path;
      }
    }
    
    return bestPath as any;
  }

  /**
   * Generate execution plan
   */
  private generateExecutionPlan(
    request: RoutingRequest,
    path: string,
    complexity: any
  ): ExecutionPlan {
    const phases: ExecutionPhase[] = [];
    const checkpoints: Checkpoint[] = [];
    
    switch (path) {
      case 'internal':
        phases.push({
          name: 'Local Processing',
          duration: `${Math.ceil(complexity.score * 10)} seconds`,
          tasks: ['Load Ollama model', 'Process request', 'Generate response'],
          resources: [
            { service: 'ollama', allocation: 80 },
            { service: 'cpu', allocation: 60 }
          ]
        });
        checkpoints.push({
          name: 'Response Quality',
          condition: 'quality_score > 0.7',
          action: 'proceed'
        });
        break;
        
      case 'hybrid':
        phases.push({
          name: 'Initial Processing',
          duration: `${Math.ceil(complexity.score * 5)} seconds`,
          tasks: ['Preprocess with Ollama', 'Identify complex parts'],
          resources: [
            { service: 'ollama', allocation: 50 },
            { service: 'cpu', allocation: 40 }
          ]
        });
        phases.push({
          name: 'External Enhancement',
          duration: `${Math.ceil(complexity.score * 8)} seconds`,
          tasks: ['Send to external AI', 'Merge responses'],
          resources: [
            { service: 'external-ai', allocation: 70 },
            { service: 'network', allocation: 30 }
          ]
        });
        break;
        
      case 'external':
        phases.push({
          name: 'External Processing',
          duration: `${Math.ceil(complexity.score * 15)} seconds`,
          tasks: ['Prepare request', 'Call external API', 'Process response'],
          resources: [
            { service: 'external-ai', allocation: 90 },
            { service: 'network', allocation: 40 }
          ]
        });
        break;
        
      case 'delay':
        phases.push({
          name: 'Queue Processing',
          duration: 'Variable (5-30 minutes)',
          tasks: ['Add to queue', 'Wait for resources', 'Process when available'],
          resources: [
            { service: 'queue', allocation: 10 },
            { service: 'scheduler', allocation: 20 }
          ]
        });
        break;
    }
    
    return {
      path,
      phases,
      timeline: this.calculateTimeline(phases),
      checkpoints,
      fallbackStrategy: path === 'external' ? 'hybrid' : 'external'
    };
  }

  /**
   * Generate reasoning for decision
   */
  private generateReasoning(
    scores: Record<string, number>,
    chosenPath: string,
    systemLoad: number
  ): string[] {
    const reasoning: string[] = [];
    
    reasoning.push(`Selected ${chosenPath} path`);
    reasoning.push(`System load: ${(systemLoad * 100).toFixed(0)}%`);
    
    // Add score-based reasoning
    for (const [path, score] of Object.entries(scores)) {
      reasoning.push(`${path} feasibility: ${(score * 100).toFixed(0)}%`);
    }
    
    // Add path-specific reasoning
    switch (chosenPath) {
      case 'internal':
        reasoning.push('Local resources sufficient for request');
        break;
      case 'hybrid':
        reasoning.push('Combining local and external processing for optimal results');
        break;
      case 'external':
        reasoning.push('Complex request requires external AI capabilities');
        break;
      case 'delay':
        reasoning.push('System overloaded, queueing for later processing');
        break;
    }
    
    return reasoning;
  }

  /**
   * Execute internal processing
   */
  private async executeInternal(request: RoutingRequest, plan: ExecutionPlan): Promise<any> {
    logger.info('Executing internal processing', { requestId: request.id });
    
    // Route to appropriate internal service
    switch (request.type) {
      case 'code_analysis':
        return await this.aiService.analyzeCode(request.payload);
      case 'ai_query':
        return await this.aiService.query({
          ...request.payload,
          model: 'ollama'
        });
      default:
        throw new Error(`Unsupported internal request type: ${request.type}`);
    }
  }

  /**
   * Execute hybrid processing
   */
  private async executeHybrid(request: RoutingRequest, plan: ExecutionPlan): Promise<any> {
    logger.info('Executing hybrid processing', { requestId: request.id });
    
    // First phase: Internal preprocessing
    const internalResult = await this.executeInternal(request, plan);
    
    // Second phase: External enhancement
    const enhancedRequest = {
      ...request,
      payload: {
        ...request.payload,
        context: internalResult,
        enhanceOnly: true
      }
    };
    
    const externalResult = await this.executeExternal(enhancedRequest, plan);
    
    // Merge results
    return this.mergeResults(internalResult, externalResult);
  }

  /**
   * Execute external processing
   */
  private async executeExternal(request: RoutingRequest, plan: ExecutionPlan): Promise<any> {
    logger.info('Executing external processing', { requestId: request.id });
    
    // Determine best external model
    const model = this.selectExternalModel(request);
    
    return await this.aiService.query({
      ...request.payload,
      model,
      priority: request.priority
    });
  }

  /**
   * Execute delayed processing
   */
  private async executeDelayed(request: RoutingRequest, plan: ExecutionPlan): Promise<any> {
    logger.info('Queueing request for delayed processing', { requestId: request.id });
    
    // Add to processing queue
    // In production, this would use a proper queue system
    setTimeout(async () => {
      try {
        const result = await this.executeInternal(request, plan);
        this.emit('delayed-processing-complete', { requestId: request.id, result });
      } catch (error) {
        this.emit('delayed-processing-failed', { requestId: request.id, error });
      }
    }, Math.random() * 300000 + 60000); // 1-6 minutes delay
    
    return {
      status: 'queued',
      estimatedProcessingTime: plan.timeline,
      requestId: request.id
    };
  }

  /**
   * Execute fallback strategy
   */
  private async executeFallback(request: RoutingRequest, plan: ExecutionPlan): Promise<any> {
    logger.info('Executing fallback strategy', { 
      requestId: request.id,
      strategy: plan.fallbackStrategy 
    });
    
    // Create new decision with fallback path
    const fallbackRequest = { ...request, metadata: { ...request.metadata, isFallback: true } };
    const fallbackDecision = await this.makeRoutingDecision(fallbackRequest);
    
    return await this.executeRouting(fallbackRequest, fallbackDecision);
  }

  /**
   * Helper methods
   */
  private getCodeSize(payload: any): number {
    const code = payload.code || '';
    return Math.min(1, code.length / 10000); // Normalize to 0-1
  }

  private getLanguageComplexity(payload: any): number {
    const complexityMap: Record<string, number> = {
      'javascript': 0.5,
      'typescript': 0.6,
      'python': 0.4,
      'java': 0.7,
      'cpp': 0.8,
      'rust': 0.9
    };
    return complexityMap[payload.language] || 0.5;
  }

  private async getSystemLoad(): Promise<number> {
    // In production, get real metrics
    return this.systemMetrics.cpuUsage * 0.4 + 
           this.systemMetrics.memoryUsage * 0.3 +
           (this.systemMetrics.activeRequests / 100) * 0.3;
  }

  private async getTenantLimits(tenantId: string): Promise<any> {
    const tenant = await this.multiTenantService.getTenant(tenantId);
    return tenant?.limits || {};
  }

  private calculateTimeline(phases: ExecutionPhase[]): string {
    const totalSeconds = phases.reduce((sum, phase) => {
      const match = phase.duration.match(/(\d+)/);
      return sum + (match ? parseInt(match[1]) : 0);
    }, 0);
    
    if (totalSeconds < 60) {
      return `${totalSeconds} seconds`;
    } else if (totalSeconds < 3600) {
      return `${Math.ceil(totalSeconds / 60)} minutes`;
    } else {
      return `${Math.ceil(totalSeconds / 3600)} hours`;
    }
  }

  private estimateCostAndTime(plan: ExecutionPlan, complexity: any): { cost: number; time: number } {
    let cost = 0;
    let time = 0;
    
    // Estimate based on path
    switch (plan.path) {
      case 'internal':
        cost = 0; // Free with Ollama
        time = complexity.score * 10000; // ms
        break;
      case 'hybrid':
        cost = complexity.estimatedTokens ? complexity.estimatedTokens * 0.00005 : 0.01;
        time = complexity.score * 15000;
        break;
      case 'external':
        cost = complexity.estimatedTokens ? complexity.estimatedTokens * 0.0001 : 0.02;
        time = complexity.score * 20000;
        break;
      case 'delay':
        cost = 0;
        time = 300000; // 5 minutes average
        break;
    }
    
    return { cost, time };
  }

  private calculateConfidence(scores: Record<string, number>, chosenPath: string): number {
    const chosenScore = scores[chosenPath];
    const maxScore = Math.max(...Object.values(scores));
    
    // Confidence based on how much better the chosen path is
    const margin = chosenScore - (maxScore - chosenScore);
    return Math.min(0.95, 0.5 + margin);
  }

  private selectExternalModel(request: RoutingRequest): string {
    // Select model based on requirements
    if (request.constraints?.preferredModel) {
      return request.constraints.preferredModel;
    }
    
    if (request.priority === 'critical') {
      return 'claude-3-opus';
    }
    
    if (request.constraints?.maxResponseTime && request.constraints.maxResponseTime < 5000) {
      return 'gpt-3.5-turbo';
    }
    
    return 'claude-3-sonnet'; // Default balanced choice
  }

  private mergeResults(internal: any, external: any): any {
    // Merge strategy depends on request type
    return {
      ...internal,
      ...external,
      hybrid: true,
      confidence: (internal.confidence || 0.5) * 0.4 + (external.confidence || 0.5) * 0.6
    };
  }

  /**
   * Initialize health monitoring
   */
  private initializeHealthMonitoring(): void {
    // Monitor key services
    const services = ['ollama', 'external-ai', 'database', 'redis'];
    
    services.forEach(service => {
      this.serviceHealth.set(service, {
        service,
        status: 'healthy',
        responseTime: 100,
        errorRate: 0,
        capacity: 1.0
      });
    });
    
    // Update health periodically
    setInterval(() => this.updateServiceHealth(), 30000); // Every 30 seconds
  }

  /**
   * Start metrics collection
   */
  private startMetricsCollection(): void {
    setInterval(() => {
      // In production, collect real metrics
      this.systemMetrics = {
        cpuUsage: Math.random() * 0.8,
        memoryUsage: Math.random() * 0.7,
        activeRequests: Math.floor(Math.random() * 50),
        queueLength: Math.floor(Math.random() * 20),
        avgResponseTime: 200 + Math.random() * 300,
        errorRate: Math.random() * 0.05
      };
      
      this.emit('metrics-updated', this.systemMetrics);
    }, 5000); // Every 5 seconds
  }

  /**
   * Update service health
   */
  private async updateServiceHealth(): Promise<void> {
    for (const [service, health] of this.serviceHealth.entries()) {
      // In production, actually check service health
      health.responseTime = 50 + Math.random() * 200;
      health.errorRate = Math.random() * 0.1;
      health.capacity = 1 - Math.random() * 0.3;
      
      // Update status
      if (health.errorRate > 0.05) {
        health.status = 'unhealthy';
      } else if (health.responseTime > 150) {
        health.status = 'degraded';
      } else {
        health.status = 'healthy';
      }
    }
  }

  /**
   * Get routing statistics
   */
  getRoutingStats(): {
    totalDecisions: number;
    pathDistribution: Record<string, number>;
    avgConfidence: number;
    avgResponseTime: number;
  } {
    const decisions = Array.from(this.routingHistory.values());
    const pathCounts: Record<string, number> = {
      internal: 0,
      hybrid: 0,
      external: 0,
      delay: 0
    };
    
    let totalConfidence = 0;
    let totalTime = 0;
    
    decisions.forEach(decision => {
      pathCounts[decision.chosenPath]++;
      totalConfidence += decision.confidence;
      totalTime += decision.estimatedTime;
    });
    
    return {
      totalDecisions: decisions.length,
      pathDistribution: pathCounts,
      avgConfidence: decisions.length > 0 ? totalConfidence / decisions.length : 0,
      avgResponseTime: decisions.length > 0 ? totalTime / decisions.length : 0
    };
  }
}