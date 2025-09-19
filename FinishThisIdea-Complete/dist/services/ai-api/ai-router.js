"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIRouter = void 0;
const logger_1 = require("../../utils/logger");
const presence_logger_1 = require("../../monitoring/presence-logger");
class AIRouter {
    ollamaAvailable = false;
    claudeAvailable = false;
    openaiAvailable = false;
    availableModels = [];
    async initialize() {
        this.ollamaAvailable = await this.checkOllamaAvailability();
        this.claudeAvailable = !!process.env.ANTHROPIC_API_KEY;
        this.openaiAvailable = !!process.env.OPENAI_API_KEY;
        await this.refreshAvailableModels();
        logger_1.logger.info('AI Router initialized', {
            ollama: this.ollamaAvailable,
            claude: this.claudeAvailable,
            openai: this.openaiAvailable,
            models: this.availableModels.length
        });
    }
    async checkOllamaAvailability() {
        try {
            const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
            return !!process.env.OLLAMA_URL || process.env.NODE_ENV === 'development';
        }
        catch (error) {
            logger_1.logger.warn('Ollama not available', { error: error.message });
            return false;
        }
    }
    async refreshAvailableModels() {
        this.availableModels = [];
        if (this.ollamaAvailable) {
            this.availableModels.push({
                id: 'codellama:7b',
                name: 'Code Llama 7B',
                provider: 'ollama',
                cost_per_token: 0,
                capabilities: ['code_analysis', 'code_cleanup', 'code_generation'],
                context_length: 4096,
                available: true
            }, {
                id: 'deepseek-coder:6.7b',
                name: 'DeepSeek Coder 6.7B',
                provider: 'ollama',
                cost_per_token: 0,
                capabilities: ['code_analysis', 'code_cleanup', 'code_generation'],
                context_length: 16384,
                available: true
            });
        }
        if (this.claudeAvailable) {
            this.availableModels.push({
                id: 'claude-3-haiku-20240307',
                name: 'Claude 3 Haiku',
                provider: 'claude',
                cost_per_token: 0.000025,
                capabilities: ['code_analysis', 'code_cleanup', 'code_generation', 'documentation'],
                context_length: 200000,
                available: true
            }, {
                id: 'claude-3-sonnet-20240229',
                name: 'Claude 3 Sonnet',
                provider: 'claude',
                cost_per_token: 0.000075,
                capabilities: ['code_analysis', 'code_cleanup', 'code_generation', 'documentation', 'architecture'],
                context_length: 200000,
                available: true
            });
        }
        if (this.openaiAvailable) {
            this.availableModels.push({
                id: 'gpt-3.5-turbo',
                name: 'GPT-3.5 Turbo',
                provider: 'openai',
                cost_per_token: 0.0000015,
                capabilities: ['code_analysis', 'code_cleanup', 'code_generation'],
                context_length: 16385,
                available: true
            }, {
                id: 'gpt-4-turbo-preview',
                name: 'GPT-4 Turbo',
                provider: 'openai',
                cost_per_token: 0.00003,
                capabilities: ['code_analysis', 'code_cleanup', 'code_generation', 'architecture'],
                context_length: 128000,
                available: true
            });
        }
    }
    async getAvailableModels(keyInfo) {
        let availableToUser = [...this.availableModels];
        if (keyInfo.tier === 'internal') {
            return availableToUser;
        }
        if (keyInfo.tier === 'byok') {
            return availableToUser.filter(model => model.cost_per_token === 0 || keyInfo.customKeys?.[model.provider]);
        }
        if (keyInfo.tier === 'free') {
            availableToUser = availableToUser.filter(model => model.cost_per_token === 0);
        }
        return availableToUser;
    }
    async analyzeCode(request) {
        const { code, language, profile, keyInfo, options = {} } = request;
        const model = await this.selectModel({
            task: 'code_analysis',
            inputSize: code.length,
            keyInfo,
            options
        });
        const startTime = Date.now();
        try {
            let result;
            let cost = 0;
            let confidence = 0;
            switch (model.provider) {
                case 'ollama':
                    result = await this.processWithOllama('analyze', { code, language, profile });
                    confidence = 0.8;
                    cost = 0;
                    break;
                case 'claude':
                    result = await this.processWithClaude('analyze', { code, language, profile });
                    confidence = 0.95;
                    cost = this.calculateCost(code, model);
                    break;
                case 'openai':
                    result = await this.processWithOpenAI('analyze', { code, language, profile });
                    confidence = 0.9;
                    cost = this.calculateCost(code, model);
                    break;
                default:
                    throw new Error(`Unsupported provider: ${model.provider}`);
            }
            await presence_logger_1.presenceLogger.logUserPresence('ai_processing', {
                userId: keyInfo.userId,
                sessionId: keyInfo.keyId,
                metadata: {
                    task: 'analyze',
                    provider: model.provider,
                    model: model.id,
                    inputSize: code.length,
                    cost,
                    confidence,
                    duration: Date.now() - startTime
                }
            });
            return {
                success: true,
                data: result,
                provider: model.provider,
                model: model.id,
                confidence,
                cost,
                reasoning: `Used ${model.name} for code analysis (tier: ${keyInfo.tier})`
            };
        }
        catch (error) {
            logger_1.logger.error('Code analysis failed', {
                error: error.message,
                model: model.id,
                provider: model.provider
            });
            if (options.preferLocal && model.provider !== 'ollama' && this.ollamaAvailable) {
                logger_1.logger.info('Falling back to Ollama for code analysis');
                return this.analyzeCode({
                    ...request,
                    options: { ...options, preferLocal: false }
                });
            }
            throw error;
        }
    }
    async cleanupCode(request) {
        const { code, language, profile, keyInfo, options = {} } = request;
        const model = await this.selectModel({
            task: 'code_cleanup',
            inputSize: code.length,
            keyInfo,
            options
        });
        const startTime = Date.now();
        try {
            let result;
            let cost = 0;
            let confidence = 0;
            switch (model.provider) {
                case 'ollama':
                    result = await this.processWithOllama('cleanup', { code, language, profile });
                    confidence = this.calculateCleanupConfidence(code, result);
                    cost = 0;
                    break;
                case 'claude':
                    result = await this.processWithClaude('cleanup', { code, language, profile });
                    confidence = 0.95;
                    cost = this.calculateCost(code, model);
                    break;
                case 'openai':
                    result = await this.processWithOpenAI('cleanup', { code, language, profile });
                    confidence = 0.9;
                    cost = this.calculateCost(code, model);
                    break;
                default:
                    throw new Error(`Unsupported provider: ${model.provider}`);
            }
            await presence_logger_1.presenceLogger.logUserPresence('ai_processing', {
                userId: keyInfo.userId,
                sessionId: keyInfo.keyId,
                metadata: {
                    task: 'cleanup',
                    provider: model.provider,
                    model: model.id,
                    inputSize: code.length,
                    cost,
                    confidence,
                    duration: Date.now() - startTime
                }
            });
            return {
                success: true,
                data: result,
                provider: model.provider,
                model: model.id,
                confidence,
                cost,
                reasoning: `Used ${model.name} for code cleanup (tier: ${keyInfo.tier})`
            };
        }
        catch (error) {
            logger_1.logger.error('Code cleanup failed', {
                error: error.message,
                model: model.id,
                provider: model.provider
            });
            if (options.preferLocal && model.provider !== 'ollama' && this.ollamaAvailable) {
                logger_1.logger.info('Falling back to Ollama for code cleanup');
                return this.cleanupCode({
                    ...request,
                    options: { ...options, preferLocal: false }
                });
            }
            throw error;
        }
    }
    async suggestStructure(request) {
        const { files, projectType, keyInfo, options = {} } = request;
        const model = await this.selectModel({
            task: 'structure_analysis',
            inputSize: files.join('').length,
            keyInfo,
            options,
            preferLargeContext: true
        });
        const startTime = Date.now();
        try {
            let result;
            let cost = 0;
            switch (model.provider) {
                case 'ollama':
                    result = await this.processWithOllama('structure', { files, projectType });
                    cost = 0;
                    break;
                case 'claude':
                    result = await this.processWithClaude('structure', { files, projectType });
                    cost = this.calculateCost(files.join(''), model);
                    break;
                case 'openai':
                    result = await this.processWithOpenAI('structure', { files, projectType });
                    cost = this.calculateCost(files.join(''), model);
                    break;
                default:
                    throw new Error(`Unsupported provider: ${model.provider}`);
            }
            return {
                success: true,
                data: result,
                provider: model.provider,
                model: model.id,
                confidence: 0.85,
                cost,
                reasoning: `Used ${model.name} for structure analysis (tier: ${keyInfo.tier})`
            };
        }
        catch (error) {
            logger_1.logger.error('Structure suggestion failed', {
                error: error.message,
                model: model.id,
                provider: model.provider
            });
            throw error;
        }
    }
    async generate(request) {
        const { prompt, type, keyInfo, options = {} } = request;
        const model = await this.selectModel({
            task: 'generation',
            inputSize: prompt.length,
            keyInfo,
            options
        });
        const startTime = Date.now();
        try {
            let result;
            let cost = 0;
            switch (model.provider) {
                case 'ollama':
                    result = await this.processWithOllama('generate', { prompt, type });
                    cost = 0;
                    break;
                case 'claude':
                    result = await this.processWithClaude('generate', { prompt, type });
                    cost = this.calculateCost(prompt, model);
                    break;
                case 'openai':
                    result = await this.processWithOpenAI('generate', { prompt, type });
                    cost = this.calculateCost(prompt, model);
                    break;
                default:
                    throw new Error(`Unsupported provider: ${model.provider}`);
            }
            return {
                success: true,
                data: result,
                provider: model.provider,
                model: model.id,
                confidence: 0.85,
                cost,
                reasoning: `Used ${model.name} for generation (tier: ${keyInfo.tier})`
            };
        }
        catch (error) {
            logger_1.logger.error('Generation failed', {
                error: error.message,
                model: model.id,
                provider: model.provider
            });
            throw error;
        }
    }
    async estimateCost(params) {
        const { task, input, keyInfo, options } = params;
        const estimates = {
            ollama: 0,
            claude: 0,
            openai: 0,
            recommended: 'ollama'
        };
        const inputSize = typeof input === 'string' ? input.length : JSON.stringify(input).length;
        const claudeModel = this.availableModels.find(m => m.provider === 'claude');
        if (claudeModel) {
            estimates.claude = this.calculateCost(input, claudeModel);
        }
        const openaiModel = this.availableModels.find(m => m.provider === 'openai');
        if (openaiModel) {
            estimates.openai = this.calculateCost(input, openaiModel);
        }
        if (keyInfo.tier === 'internal') {
            estimates.recommended = 'ollama';
        }
        else if (inputSize > 50000) {
            estimates.recommended = 'claude';
        }
        else if (keyInfo.tier === 'free') {
            estimates.recommended = 'ollama';
        }
        else {
            estimates.recommended = estimates.claude < estimates.openai ? 'claude' : 'openai';
        }
        return estimates;
    }
    async selectModel(params) {
        const { task, inputSize, keyInfo, options, preferLargeContext = false } = params;
        const userModels = await this.getAvailableModels(keyInfo);
        const capableModels = userModels.filter(model => {
            const taskMap = {
                'code_analysis': 'code_analysis',
                'code_cleanup': 'code_cleanup',
                'structure_analysis': 'architecture',
                'generation': 'code_generation'
            };
            return model.capabilities.includes(taskMap[task] || task);
        });
        if (capableModels.length === 0) {
            throw new Error(`No capable models available for task: ${task}`);
        }
        if (keyInfo.tier === 'internal' && options.preferLocal !== false) {
            const ollamaModel = capableModels.find(m => m.provider === 'ollama');
            if (ollamaModel) {
                return ollamaModel;
            }
        }
        if (inputSize > 50000 || preferLargeContext) {
            const largeContextModels = capableModels
                .filter(m => m.context_length > 50000)
                .sort((a, b) => b.context_length - a.context_length);
            if (largeContextModels.length > 0) {
                return largeContextModels[0];
            }
        }
        if (keyInfo.tier === 'free' || options.maxCost < 0.05) {
            const freeModels = capableModels.filter(m => m.cost_per_token === 0);
            if (freeModels.length > 0) {
                return freeModels[0];
            }
        }
        return capableModels[0];
    }
    calculateCost(input, model) {
        const estimatedTokens = Math.ceil(input.length / 4);
        return estimatedTokens * model.cost_per_token;
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
    async processWithOllama(task, params) {
        logger_1.logger.info('Processing with Ollama', { task, params: Object.keys(params) });
        switch (task) {
            case 'analyze':
                return {
                    issues: ['Mock issue 1', 'Mock issue 2'],
                    suggestions: ['Mock suggestion 1'],
                    complexity: 'medium',
                    quality_score: 0.8
                };
            case 'cleanup':
                return {
                    cleaned_code: params.code + '\n// Cleaned by Ollama',
                    changes_made: ['Added semicolons', 'Fixed indentation'],
                    improvement_score: 0.15
                };
            case 'structure':
                return {
                    suggested_structure: {
                        'src/': ['main.js', 'utils.js'],
                        'tests/': ['main.test.js'],
                        'docs/': ['README.md']
                    },
                    reasoning: 'Standard project structure'
                };
            case 'generate':
                return {
                    generated_content: `// Generated by Ollama\n// ${params.prompt}\nfunction example() {\n  return "Hello World";\n}`,
                    explanation: 'Generated example function'
                };
            default:
                throw new Error(`Unknown task: ${task}`);
        }
    }
    async processWithClaude(task, params) {
        logger_1.logger.info('Processing with Claude', { task, params: Object.keys(params) });
        await new Promise(resolve => setTimeout(resolve, 500));
        switch (task) {
            case 'analyze':
                return {
                    issues: ['Detailed issue 1', 'Detailed issue 2', 'Performance concern'],
                    suggestions: ['Detailed suggestion 1', 'Architectural improvement'],
                    complexity: 'medium-high',
                    quality_score: 0.85,
                    security_issues: [],
                    performance_issues: ['Memory allocation concern']
                };
            case 'cleanup':
                return {
                    cleaned_code: params.code.replace(/\s+/g, ' ').trim() + '\n// Enhanced by Claude',
                    changes_made: ['Optimized imports', 'Improved variable naming', 'Added type hints'],
                    improvement_score: 0.25,
                    explanation: 'Applied best practices and optimizations'
                };
            case 'structure':
                return {
                    suggested_structure: {
                        'src/': {
                            'components/': ['Header.jsx', 'Footer.jsx'],
                            'services/': ['api.js', 'auth.js'],
                            'utils/': ['helpers.js']
                        },
                        'tests/': {
                            'unit/': ['components.test.js'],
                            'integration/': ['api.test.js']
                        },
                        'docs/': ['README.md', 'API.md']
                    },
                    reasoning: 'Modern React project structure with separation of concerns'
                };
            case 'generate':
                return {
                    generated_content: `// Generated by Claude\n// ${params.prompt}\n\nfunction sophisticatedExample(input) {\n  // Validate input\n  if (!input) {\n    throw new Error('Input is required');\n  }\n  \n  // Process and return\n  return \`Processed: \${input}\`;\n}`,
                    explanation: 'Generated robust function with error handling'
                };
            default:
                throw new Error(`Unknown task: ${task}`);
        }
    }
    async processWithOpenAI(task, params) {
        logger_1.logger.info('Processing with OpenAI', { task, params: Object.keys(params) });
        await new Promise(resolve => setTimeout(resolve, 300));
        switch (task) {
            case 'analyze':
                return {
                    issues: ['OpenAI detected issue 1', 'Code smell detected'],
                    suggestions: ['Refactor suggestion', 'Performance optimization'],
                    complexity: 'medium',
                    quality_score: 0.82
                };
            case 'cleanup':
                return {
                    cleaned_code: params.code + '\n// Optimized by OpenAI',
                    changes_made: ['Simplified logic', 'Removed redundancy'],
                    improvement_score: 0.20
                };
            case 'structure':
                return {
                    suggested_structure: {
                        'app/': ['main.py', 'config.py'],
                        'tests/': ['test_main.py'],
                        'requirements.txt': null
                    },
                    reasoning: 'Python project structure'
                };
            case 'generate':
                return {
                    generated_content: `# Generated by OpenAI\n# ${params.prompt}\n\ndef smart_function(data):\n    \"\"\"Process data intelligently.\"\"\"\n    return [item for item in data if item]`,
                    explanation: 'Generated Pythonic solution'
                };
            default:
                throw new Error(`Unknown task: ${task}`);
        }
    }
    isOllamaAvailable() {
        return this.ollamaAvailable;
    }
}
exports.AIRouter = AIRouter;
//# sourceMappingURL=ai-router.js.map