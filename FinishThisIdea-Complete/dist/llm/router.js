"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.llmRouter = exports.LLMRouter = void 0;
const ollama_1 = require("./ollama");
const claude_1 = require("./claude");
const logger_1 = require("../utils/logger");
class LLMRouter {
    ollamaAvailable = false;
    async initialize() {
        this.ollamaAvailable = await ollama_1.ollama.isAvailable();
        logger_1.logger.info('LLM Router initialized', {
            ollamaAvailable: this.ollamaAvailable,
            claudeAvailable: !!process.env.ANTHROPIC_API_KEY,
        });
    }
    async route(task) {
        const startTime = Date.now();
        const { preferLocal = true, maxCost = 0.5, minConfidence = 0.7 } = task.options || {};
        if (this.ollamaAvailable && preferLocal) {
            try {
                const result = await this.processWithOllama(task);
                if (result.confidence >= minConfidence) {
                    return {
                        ...result,
                        duration: Date.now() - startTime,
                    };
                }
                logger_1.logger.info('Ollama result below confidence threshold, escalating', {
                    confidence: result.confidence,
                    threshold: minConfidence,
                });
            }
            catch (error) {
                logger_1.logger.error('Ollama processing failed, falling back', { error });
            }
        }
        if (process.env.ANTHROPIC_API_KEY) {
            try {
                const result = await this.processWithClaude(task);
                if (result.cost > maxCost) {
                    throw new Error(`Cost exceeds limit: $${result.cost} > $${maxCost}`);
                }
                return {
                    ...result,
                    duration: Date.now() - startTime,
                };
            }
            catch (error) {
                logger_1.logger.error('Claude processing failed', { error });
                throw error;
            }
        }
        throw new Error('No LLM providers available or all attempts failed');
    }
    async processWithOllama(task) {
        let data;
        let confidence = 0.8;
        switch (task.type) {
            case 'analyze':
                data = await ollama_1.ollama.analyzeCode(task.input.code, task.options?.profile);
                confidence = this.calculateAnalysisConfidence(data);
                break;
            case 'cleanup':
                data = await ollama_1.ollama.cleanupCode(task.input.code, task.input.language, task.options?.profile);
                confidence = this.calculateCleanupConfidence(task.input.code, data);
                break;
            case 'structure':
                data = await ollama_1.ollama.suggestFileStructure(task.input.files);
                confidence = this.calculateStructureConfidence(data);
                break;
            case 'generate':
                data = await ollama_1.ollama.generate(task.input.prompt);
                confidence = 0.7;
                break;
            default:
                throw new Error(`Unknown task type: ${task.type}`);
        }
        return {
            success: true,
            data,
            provider: 'ollama',
            confidence,
            cost: 0,
            duration: 0,
        };
    }
    async processWithClaude(task) {
        let data;
        let cost = 0;
        const confidence = 0.95;
        switch (task.type) {
            case 'analyze':
                const analysisResult = await claude_1.claude.analyzeCode(task.input.code, task.options?.profile);
                data = analysisResult.data;
                cost = analysisResult.cost;
                break;
            case 'cleanup':
                const cleanupResult = await claude_1.claude.cleanupCode(task.input.code, task.input.language, task.options?.profile);
                data = cleanupResult.data;
                cost = cleanupResult.cost;
                break;
            case 'structure':
                const structureResult = await claude_1.claude.suggestFileStructure(task.input.files);
                data = structureResult.data;
                cost = structureResult.cost;
                break;
            case 'generate':
                const generateResult = await claude_1.claude.generate(task.input.prompt);
                data = generateResult.data;
                cost = generateResult.cost;
                break;
            default:
                throw new Error(`Unknown task type: ${task.type}`);
        }
        return {
            success: true,
            data,
            provider: 'claude',
            confidence,
            cost,
            duration: 0,
        };
    }
    calculateAnalysisConfidence(analysis) {
        const issueCount = analysis.issues?.length || 0;
        const suggestionCount = analysis.suggestions?.length || 0;
        if (issueCount === 0 && suggestionCount === 0) {
            return 0.5;
        }
        return Math.min(0.9, 0.6 + (issueCount + suggestionCount) * 0.05);
    }
    calculateCleanupConfidence(original, cleaned) {
        if (original === cleaned) {
            return 0.3;
        }
        const changeRatio = Math.abs(original.length - cleaned.length) / original.length;
        if (changeRatio > 0.5) {
            return 0.5;
        }
        return 0.8;
    }
    calculateStructureConfidence(structure) {
        const folders = Object.keys(structure.structure || {});
        if (folders.length === 0) {
            return 0.4;
        }
        const goodFolders = ['src/', 'tests/', 'docs/', 'lib/', 'config/'];
        const matchCount = folders.filter(f => goodFolders.some(gf => f.includes(gf))).length;
        return Math.min(0.9, 0.6 + matchCount * 0.1);
    }
    async estimateCost(task) {
        const estimates = {
            ollama: 0,
            claude: 0,
            recommended: 'ollama',
        };
        const inputSize = JSON.stringify(task.input).length;
        switch (task.type) {
            case 'analyze':
                estimates.claude = inputSize * 0.00001;
                break;
            case 'cleanup':
                estimates.claude = inputSize * 0.000015;
                break;
            case 'structure':
                estimates.claude = 0.01;
                break;
            case 'generate':
                estimates.claude = inputSize * 0.00002;
                break;
        }
        if (!this.ollamaAvailable) {
            estimates.recommended = 'claude';
        }
        else if (inputSize > 10000 || task.type === 'generate') {
            estimates.recommended = 'claude';
        }
        return estimates;
    }
}
exports.LLMRouter = LLMRouter;
exports.llmRouter = new LLMRouter();
//# sourceMappingURL=router.js.map