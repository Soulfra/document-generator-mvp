"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartRoutingDaemon = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const metrics_service_1 = require("../monitoring/metrics.service");
const ai_service_1 = require("../ai/ai.service");
const multi_tenant_service_1 = require("../multi-tenant/multi-tenant.service");
class SmartRoutingDaemon extends events_1.EventEmitter {
    name = 'SmartRouter';
    metricsService;
    aiService;
    multiTenantService;
    routingHistory = new Map();
    serviceHealth = new Map();
    systemMetrics = {
        cpuUsage: 0,
        memoryUsage: 0,
        activeRequests: 0,
        queueLength: 0,
        avgResponseTime: 0,
        errorRate: 0
    };
    config = {
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
        this.metricsService = new metrics_service_1.MetricsService();
        this.aiService = new ai_service_1.AIService();
        this.multiTenantService = new multi_tenant_service_1.MultiTenantService();
        this.initializeHealthMonitoring();
        this.startMetricsCollection();
    }
    async makeRoutingDecision(request) {
        logger_1.logger.info('Making routing decision', {
            requestId: request.id,
            type: request.type,
            priority: request.priority
        });
        try {
            const complexity = await this.analyzeRequestComplexity(request);
            const systemLoad = await this.getSystemLoad();
            const tenantLimits = request.tenantId
                ? await this.getTenantLimits(request.tenantId)
                : null;
            const feasibilityScores = this.calculateFeasibilityScores(request, complexity, systemLoad, tenantLimits);
            const chosenPath = this.selectOptimalPath(feasibilityScores, request.priority);
            const executionPlan = this.generateExecutionPlan(request, chosenPath, complexity);
            const estimates = this.estimateCostAndTime(executionPlan, complexity);
            const decision = {
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
            this.routingHistory.set(request.id, decision);
            this.emit('routing-decision', decision);
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
        }
        catch (error) {
            logger_1.logger.error('Error making routing decision', error);
            throw error;
        }
    }
    async executeRouting(request, decision) {
        logger_1.logger.info('Executing routing decision', {
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
        }
        catch (error) {
            logger_1.logger.error('Error executing routing', error);
            if (decision.executionPlan.fallbackStrategy) {
                logger_1.logger.info('Attempting fallback strategy', {
                    strategy: decision.executionPlan.fallbackStrategy
                });
                return await this.executeFallback(request, decision.executionPlan);
            }
            throw error;
        }
    }
    async analyzeRequestComplexity(request) {
        const factors = {};
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
        const score = Object.values(factors).reduce((sum, factor) => sum + factor, 0) /
            Object.keys(factors).length;
        const estimatedTokens = request.type === 'ai_query'
            ? Math.ceil((factors.promptLength || 0) * 0.75)
            : undefined;
        return { score, factors, estimatedTokens };
    }
    calculateFeasibilityScores(request, complexity, systemLoad, tenantLimits) {
        const scores = {
            internal: 0,
            hybrid: 0,
            external: 0,
            delay: 0
        };
        scores.internal = this.scoreInternalPath(complexity, systemLoad);
        scores.hybrid = this.scoreHybridPath(complexity, systemLoad);
        scores.external = this.scoreExternalPath(request, complexity, tenantLimits);
        scores.delay = this.scoreDelayPath(systemLoad, request.priority);
        return scores;
    }
    scoreInternalPath(complexity, systemLoad) {
        let score = 1.0;
        score -= complexity.score * 0.3;
        score -= systemLoad * 0.5;
        if (complexity.score < 0.3) {
            score += 0.2;
        }
        return Math.max(0, Math.min(1, score));
    }
    scoreHybridPath(complexity, systemLoad) {
        let score = 0.7;
        if (complexity.score >= 0.3 && complexity.score <= 0.7) {
            score += 0.2;
        }
        score -= systemLoad * 0.3;
        return Math.max(0, Math.min(1, score));
    }
    scoreExternalPath(request, complexity, tenantLimits) {
        let score = 0.5;
        if (complexity.score > 0.7) {
            score += 0.3;
        }
        if (request.metadata?.hasApiKeys) {
            score += 0.2;
        }
        if (request.constraints?.budget) {
            const estimatedCost = complexity.estimatedTokens ? complexity.estimatedTokens * 0.0001 : 0;
            if (estimatedCost > request.constraints.budget) {
                score -= 0.4;
            }
        }
        return Math.max(0, Math.min(1, score));
    }
    scoreDelayPath(systemLoad, priority) {
        let score = 0;
        if (systemLoad > this.config.maxSystemLoad) {
            score = 0.8;
        }
        if (priority === 'critical') {
            score = 0;
        }
        return score;
    }
    selectOptimalPath(scores, priority) {
        if (priority === 'critical' && scores.delay > 0) {
            scores.delay = 0;
        }
        let bestPath = 'internal';
        let bestScore = scores.internal;
        for (const [path, score] of Object.entries(scores)) {
            if (score > bestScore) {
                bestScore = score;
                bestPath = path;
            }
        }
        return bestPath;
    }
    generateExecutionPlan(request, path, complexity) {
        const phases = [];
        const checkpoints = [];
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
    generateReasoning(scores, chosenPath, systemLoad) {
        const reasoning = [];
        reasoning.push(`Selected ${chosenPath} path`);
        reasoning.push(`System load: ${(systemLoad * 100).toFixed(0)}%`);
        for (const [path, score] of Object.entries(scores)) {
            reasoning.push(`${path} feasibility: ${(score * 100).toFixed(0)}%`);
        }
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
    async executeInternal(request, plan) {
        logger_1.logger.info('Executing internal processing', { requestId: request.id });
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
    async executeHybrid(request, plan) {
        logger_1.logger.info('Executing hybrid processing', { requestId: request.id });
        const internalResult = await this.executeInternal(request, plan);
        const enhancedRequest = {
            ...request,
            payload: {
                ...request.payload,
                context: internalResult,
                enhanceOnly: true
            }
        };
        const externalResult = await this.executeExternal(enhancedRequest, plan);
        return this.mergeResults(internalResult, externalResult);
    }
    async executeExternal(request, plan) {
        logger_1.logger.info('Executing external processing', { requestId: request.id });
        const model = this.selectExternalModel(request);
        return await this.aiService.query({
            ...request.payload,
            model,
            priority: request.priority
        });
    }
    async executeDelayed(request, plan) {
        logger_1.logger.info('Queueing request for delayed processing', { requestId: request.id });
        setTimeout(async () => {
            try {
                const result = await this.executeInternal(request, plan);
                this.emit('delayed-processing-complete', { requestId: request.id, result });
            }
            catch (error) {
                this.emit('delayed-processing-failed', { requestId: request.id, error });
            }
        }, Math.random() * 300000 + 60000);
        return {
            status: 'queued',
            estimatedProcessingTime: plan.timeline,
            requestId: request.id
        };
    }
    async executeFallback(request, plan) {
        logger_1.logger.info('Executing fallback strategy', {
            requestId: request.id,
            strategy: plan.fallbackStrategy
        });
        const fallbackRequest = { ...request, metadata: { ...request.metadata, isFallback: true } };
        const fallbackDecision = await this.makeRoutingDecision(fallbackRequest);
        return await this.executeRouting(fallbackRequest, fallbackDecision);
    }
    getCodeSize(payload) {
        const code = payload.code || '';
        return Math.min(1, code.length / 10000);
    }
    getLanguageComplexity(payload) {
        const complexityMap = {
            'javascript': 0.5,
            'typescript': 0.6,
            'python': 0.4,
            'java': 0.7,
            'cpp': 0.8,
            'rust': 0.9
        };
        return complexityMap[payload.language] || 0.5;
    }
    async getSystemLoad() {
        return this.systemMetrics.cpuUsage * 0.4 +
            this.systemMetrics.memoryUsage * 0.3 +
            (this.systemMetrics.activeRequests / 100) * 0.3;
    }
    async getTenantLimits(tenantId) {
        const tenant = await this.multiTenantService.getTenant(tenantId);
        return tenant?.limits || {};
    }
    calculateTimeline(phases) {
        const totalSeconds = phases.reduce((sum, phase) => {
            const match = phase.duration.match(/(\d+)/);
            return sum + (match ? parseInt(match[1]) : 0);
        }, 0);
        if (totalSeconds < 60) {
            return `${totalSeconds} seconds`;
        }
        else if (totalSeconds < 3600) {
            return `${Math.ceil(totalSeconds / 60)} minutes`;
        }
        else {
            return `${Math.ceil(totalSeconds / 3600)} hours`;
        }
    }
    estimateCostAndTime(plan, complexity) {
        let cost = 0;
        let time = 0;
        switch (plan.path) {
            case 'internal':
                cost = 0;
                time = complexity.score * 10000;
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
                time = 300000;
                break;
        }
        return { cost, time };
    }
    calculateConfidence(scores, chosenPath) {
        const chosenScore = scores[chosenPath];
        const maxScore = Math.max(...Object.values(scores));
        const margin = chosenScore - (maxScore - chosenScore);
        return Math.min(0.95, 0.5 + margin);
    }
    selectExternalModel(request) {
        if (request.constraints?.preferredModel) {
            return request.constraints.preferredModel;
        }
        if (request.priority === 'critical') {
            return 'claude-3-opus';
        }
        if (request.constraints?.maxResponseTime && request.constraints.maxResponseTime < 5000) {
            return 'gpt-3.5-turbo';
        }
        return 'claude-3-sonnet';
    }
    mergeResults(internal, external) {
        return {
            ...internal,
            ...external,
            hybrid: true,
            confidence: (internal.confidence || 0.5) * 0.4 + (external.confidence || 0.5) * 0.6
        };
    }
    initializeHealthMonitoring() {
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
        setInterval(() => this.updateServiceHealth(), 30000);
    }
    startMetricsCollection() {
        setInterval(() => {
            this.systemMetrics = {
                cpuUsage: Math.random() * 0.8,
                memoryUsage: Math.random() * 0.7,
                activeRequests: Math.floor(Math.random() * 50),
                queueLength: Math.floor(Math.random() * 20),
                avgResponseTime: 200 + Math.random() * 300,
                errorRate: Math.random() * 0.05
            };
            this.emit('metrics-updated', this.systemMetrics);
        }, 5000);
    }
    async updateServiceHealth() {
        for (const [service, health] of this.serviceHealth.entries()) {
            health.responseTime = 50 + Math.random() * 200;
            health.errorRate = Math.random() * 0.1;
            health.capacity = 1 - Math.random() * 0.3;
            if (health.errorRate > 0.05) {
                health.status = 'unhealthy';
            }
            else if (health.responseTime > 150) {
                health.status = 'degraded';
            }
            else {
                health.status = 'healthy';
            }
        }
    }
    getRoutingStats() {
        const decisions = Array.from(this.routingHistory.values());
        const pathCounts = {
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
exports.SmartRoutingDaemon = SmartRoutingDaemon;
//# sourceMappingURL=smart-routing-daemon.js.map