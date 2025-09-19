"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiConductor = exports.AIConductorService = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("../../utils/logger");
const agent_registry_service_1 = require("./agent-registry.service");
const router_1 = require("../../llm/router");
const redis_1 = require("../../config/redis");
const prometheus_metrics_service_1 = require("../monitoring/prometheus-metrics.service");
class AIConductorService {
    activePlans = new Map();
    semanticClusters = new Map();
    performanceHistory = new Map();
    REDIS_PREFIX = 'ai_conductor:';
    constructor() {
        this.loadPerformanceHistory();
        this.startPatternLearning();
    }
    async createOrchestrationPlan(goal, context = {}, constraints = {}) {
        logger_1.logger.info('Creating orchestration plan', { goal });
        const thoughtTree = await this.generateThoughtTree(goal, context, constraints);
        const bestPath = this.extractBestPath(thoughtTree);
        const steps = await this.thoughtsToSteps(bestPath, context);
        const estimatedDuration = steps.reduce((sum, step) => sum + step.estimatedDuration, 0);
        const confidence = this.calculatePlanConfidence(steps, thoughtTree);
        const plan = {
            id: (0, uuid_1.v4)(),
            goal,
            steps,
            thoughtTree,
            estimatedDuration,
            confidence
        };
        if (confidence < 0.7) {
            plan.fallbackPlan = await this.generateFallbackPlan(goal, context, constraints);
        }
        this.activePlans.set(plan.id, plan);
        await this.persistPlan(plan);
        logger_1.logger.info('Orchestration plan created', {
            planId: plan.id,
            steps: steps.length,
            estimatedDuration,
            confidence
        });
        return plan;
    }
    async executePlan(planId) {
        const plan = this.activePlans.get(planId);
        if (!plan) {
            throw new Error(`Plan ${planId} not found`);
        }
        logger_1.logger.info('Executing orchestration plan', { planId, goal: plan.goal });
        try {
            const result = await this.executeSteps(plan.steps);
            this.recordPlanPerformance(planId, true);
            logger_1.logger.info('Plan execution completed successfully', { planId });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Plan execution failed', { planId, error });
            if (plan.fallbackPlan) {
                logger_1.logger.info('Attempting fallback plan', { planId });
                try {
                    const fallbackResult = await this.executeSteps(plan.fallbackPlan.steps);
                    this.recordPlanPerformance(planId, true);
                    return fallbackResult;
                }
                catch (fallbackError) {
                    logger_1.logger.error('Fallback plan also failed', { planId, fallbackError });
                }
            }
            this.recordPlanPerformance(planId, false);
            throw error;
        }
    }
    async generateThoughtTree(goal, context, constraints, depth = 0, maxDepth = 3) {
        if (depth >= maxDepth) {
            return {
                id: (0, uuid_1.v4)(),
                content: goal,
                reasoning: 'Maximum depth reached',
                confidence: 0.5,
                children: [],
                depth
            };
        }
        const prompt = this.buildThoughtPrompt(goal, context, constraints, depth);
        try {
            const response = await router_1.llmRouter.generateResponse(prompt, {
                temperature: 0.7,
                maxTokens: 1000
            });
            const thoughts = this.parseThoughtResponse(response);
            const node = {
                id: (0, uuid_1.v4)(),
                content: goal,
                reasoning: thoughts.reasoning || 'Generated through Tree of Thought',
                confidence: thoughts.confidence || 0.8,
                children: [],
                depth,
                evaluation: thoughts.evaluation
            };
            if (thoughts.alternatives && depth < maxDepth - 1) {
                for (const alternative of thoughts.alternatives.slice(0, 3)) {
                    const child = await this.generateThoughtTree(alternative, context, constraints, depth + 1, maxDepth);
                    child.parent = node.id;
                    node.children.push(child);
                }
            }
            return node;
        }
        catch (error) {
            logger_1.logger.error('Failed to generate thought tree', { goal, depth, error });
            return {
                id: (0, uuid_1.v4)(),
                content: goal,
                reasoning: 'Error in thought generation',
                confidence: 0.3,
                children: [],
                depth
            };
        }
    }
    buildThoughtPrompt(goal, context, constraints, depth) {
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
    parseThoughtResponse(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
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
        }
        catch (error) {
            logger_1.logger.warn('Failed to parse thought response', { error });
            return {
                reasoning: 'Unable to parse response',
                confidence: 0.5,
                alternatives: []
            };
        }
    }
    extractBestPath(tree) {
        const path = [tree];
        let current = tree;
        while (current.children.length > 0) {
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
    calculateNodeScore(node) {
        if (!node.evaluation) {
            return node.confidence;
        }
        const { feasibility, impact, effort, risk } = node.evaluation;
        return (feasibility * 0.3 +
            impact * 0.3 +
            (1 - effort) * 0.2 +
            (1 - risk) * 0.2) * node.confidence;
    }
    async thoughtsToSteps(thoughts, context) {
        const steps = [];
        for (let i = 0; i < thoughts.length; i++) {
            const thought = thoughts[i];
            const stepType = this.inferStepType(thought.content, i, thoughts.length);
            const step = {
                id: (0, uuid_1.v4)(),
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
    inferStepType(content, position, total) {
        const lowerContent = content.toLowerCase();
        if (position === 0)
            return 'analysis';
        if (position === total - 1)
            return 'synthesis';
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
    inferCapabilities(content, stepType) {
        const capabilities = [];
        const lowerContent = content.toLowerCase();
        capabilities.push(stepType);
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
    estimateStepDuration(thought, stepType) {
        const baseTime = {
            analysis: 30,
            generation: 60,
            validation: 20,
            coordination: 10,
            synthesis: 40
        };
        const base = baseTime[stepType] || 30;
        if (thought.evaluation) {
            const complexity = thought.evaluation.effort || 0.5;
            return Math.round(base * (0.5 + complexity));
        }
        return base;
    }
    async executeSteps(steps) {
        const results = [];
        for (const step of steps) {
            logger_1.logger.info('Executing step', { stepId: step.id, type: step.type });
            step.status = 'running';
            try {
                const agents = agent_registry_service_1.agentRegistry.listAgents({
                    status: 'idle',
                    capabilities: step.requiredCapabilities
                });
                if (agents.length === 0) {
                    throw new Error(`No available agents with capabilities: ${step.requiredCapabilities.join(', ')}`);
                }
                const taskId = await agent_registry_service_1.agentRegistry.submitTask(step.type, { description: step.description, context: results }, 'medium', step.estimatedDuration);
                step.taskId = taskId;
                const result = await this.waitForTaskCompletion(taskId);
                step.status = 'completed';
                step.result = result;
                results.push(result);
                logger_1.logger.info('Step completed', { stepId: step.id, type: step.type });
            }
            catch (error) {
                step.status = 'failed';
                logger_1.logger.error('Step failed', { stepId: step.id, error });
                throw error;
            }
        }
        return results;
    }
    async waitForTaskCompletion(taskId, timeoutMs = 300000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            const task = agent_registry_service_1.agentRegistry.getTask(taskId);
            if (!task) {
                throw new Error(`Task ${taskId} not found`);
            }
            if (task.status === 'completed') {
                return task.result;
            }
            if (task.status === 'failed') {
                throw new Error(`Task failed: ${task.error}`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        throw new Error(`Task ${taskId} timed out`);
    }
    calculatePlanConfidence(steps, thoughtTree) {
        const stepConfidence = steps.length > 0 ? 1 / steps.length : 0.5;
        const treeConfidence = thoughtTree.confidence;
        const availabilityScore = this.calculateAgentAvailability(steps);
        return (stepConfidence * 0.3 + treeConfidence * 0.5 + availabilityScore * 0.2);
    }
    calculateAgentAvailability(steps) {
        const allCapabilities = steps.flatMap(step => step.requiredCapabilities);
        const uniqueCapabilities = [...new Set(allCapabilities)];
        let availableCount = 0;
        for (const capability of uniqueCapabilities) {
            const agents = agent_registry_service_1.agentRegistry.listAgents({
                status: 'idle',
                capabilities: [capability]
            });
            if (agents.length > 0) {
                availableCount++;
            }
        }
        return uniqueCapabilities.length > 0 ? availableCount / uniqueCapabilities.length : 0;
    }
    async generateFallbackPlan(goal, context, constraints) {
        const simplifiedGoal = `Create a simple approach to: ${goal}`;
        const fallbackTree = await this.generateThoughtTree(simplifiedGoal, context, constraints, 0, 2);
        const fallbackPath = this.extractBestPath(fallbackTree);
        const fallbackSteps = await this.thoughtsToSteps(fallbackPath, context);
        return {
            id: (0, uuid_1.v4)(),
            goal: simplifiedGoal,
            steps: fallbackSteps,
            thoughtTree: fallbackTree,
            estimatedDuration: fallbackSteps.reduce((sum, step) => sum + step.estimatedDuration, 0),
            confidence: this.calculatePlanConfidence(fallbackSteps, fallbackTree)
        };
    }
    recordPlanPerformance(planId, success) {
        const plan = this.activePlans.get(planId);
        if (!plan)
            return;
        const history = this.performanceHistory.get(plan.goal) || [];
        history.push(success ? 1 : 0);
        if (history.length > 100) {
            history.shift();
        }
        this.performanceHistory.set(plan.goal, history);
        this.persistPerformanceHistory();
    }
    startPatternLearning() {
        setInterval(() => {
            this.analyzePatterns();
        }, 3600000);
    }
    async analyzePatterns() {
        logger_1.logger.info('Analyzing orchestration patterns');
        for (const [goal, history] of this.performanceHistory.entries()) {
            const successRate = history.reduce((sum, val) => sum + val, 0) / history.length;
            if (successRate > 0.8) {
                prometheus_metrics_service_1.prometheusMetrics.recordAchievementUnlocked('successful_pattern', 'ai_conductor');
            }
        }
    }
    getStats() {
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
    async persistPlan(plan) {
        try {
            await redis_1.redis.setex(`${this.REDIS_PREFIX}plan:${plan.id}`, 86400, JSON.stringify(plan));
        }
        catch (error) {
            logger_1.logger.error('Failed to persist orchestration plan', { planId: plan.id, error });
        }
    }
    async persistPerformanceHistory() {
        try {
            const historyObject = Object.fromEntries(this.performanceHistory);
            await redis_1.redis.setex(`${this.REDIS_PREFIX}performance_history`, 604800, JSON.stringify(historyObject));
        }
        catch (error) {
            logger_1.logger.error('Failed to persist performance history', error);
        }
    }
    async loadPerformanceHistory() {
        try {
            const data = await redis_1.redis.get(`${this.REDIS_PREFIX}performance_history`);
            if (data) {
                const historyObject = JSON.parse(data);
                this.performanceHistory = new Map(Object.entries(historyObject));
                logger_1.logger.info('Loaded performance history', {
                    goals: this.performanceHistory.size
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to load performance history', error);
        }
    }
}
exports.AIConductorService = AIConductorService;
exports.aiConductor = new AIConductorService();
//# sourceMappingURL=ai-conductor.service.js.map