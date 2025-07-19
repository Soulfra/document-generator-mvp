#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("../../utils/logger");
const presence_logger_1 = require("../../monitoring/presence-logger");
const ai_router_1 = require("./ai-router");
const auth_1 = require("./auth");
const app = (0, express_1.default)();
exports.app = app;
const port = process.env.AI_API_PORT || 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
const createRateLimit = (windowMs, max) => (0, express_rate_limit_1.default)({
    windowMs,
    max,
    message: { error: 'Rate limit exceeded' },
    standardHeaders: true,
    legacyHeaders: false,
});
const tierLimits = {
    'internal': createRateLimit(60 * 1000, 10000),
    'byok': createRateLimit(60 * 1000, 500),
    'cleanup': createRateLimit(60 * 1000, 10),
    'developer': createRateLimit(60 * 1000, 100),
    'team': createRateLimit(60 * 1000, 500),
    'enterprise': createRateLimit(60 * 1000, 2000)
};
const aiRouter = new ai_router_1.AIRouter();
app.use(async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const apiKey = authHeader?.replace('Bearer ', '') || req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({
                error: 'API key required',
                hint: 'Include Authorization: Bearer <key> header or x-api-key header'
            });
        }
        const validation = await (0, auth_1.validateAPIKey)(apiKey);
        if (!validation.valid) {
            return res.status(401).json({
                error: 'Invalid API key',
                code: validation.error
            });
        }
        req.keyInfo = validation;
        const rateLimiter = tierLimits[validation.tier];
        rateLimiter(req, res, next);
    }
    catch (error) {
        logger_1.logger.error('API key validation error', { error });
        res.status(500).json({ error: 'Authentication service unavailable' });
    }
});
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        provider: 'FinishThisIdea AI API'
    });
});
app.get('/models', async (req, res) => {
    try {
        const keyInfo = req.keyInfo;
        const models = await aiRouter.getAvailableModels(keyInfo);
        await presence_logger_1.presenceLogger.logAPICall({
            userId: keyInfo.userId,
            sessionId: keyInfo.keyId,
            endpoint: '/models',
            method: 'GET',
            statusCode: 200,
            userAgent: req.headers['user-agent']
        });
        res.json({
            success: true,
            models,
            tier: keyInfo.tier,
            internal_rate: keyInfo.tier === 'internal' ? true : false
        });
    }
    catch (error) {
        logger_1.logger.error('Error fetching models', { error });
        res.status(500).json({ error: 'Failed to fetch available models' });
    }
});
app.post('/analyze', async (req, res) => {
    try {
        const { code, language, profile, options = {} } = req.body;
        const keyInfo = req.keyInfo;
        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }
        const startTime = Date.now();
        const result = await aiRouter.analyzeCode({
            code,
            language,
            profile,
            keyInfo,
            options: {
                preferLocal: keyInfo.tier === 'internal',
                maxCost: getMaxCostForTier(keyInfo.tier),
                ...options
            }
        });
        const duration = Date.now() - startTime;
        await presence_logger_1.presenceLogger.logAPICall({
            userId: keyInfo.userId,
            sessionId: keyInfo.keyId,
            endpoint: '/analyze',
            method: 'POST',
            statusCode: 200,
            responseTime: duration,
            userAgent: req.headers['user-agent'],
            metadata: {
                codeLength: code.length,
                language,
                provider: result.provider,
                cost: result.cost,
                tier: keyInfo.tier
            }
        });
        res.json({
            success: true,
            ...result,
            meta: {
                duration,
                tier: keyInfo.tier,
                rateLimit: {
                    remaining: res.getHeader('X-RateLimit-Remaining'),
                    reset: res.getHeader('X-RateLimit-Reset')
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Code analysis error', { error, userId: req.keyInfo?.userId });
        res.status(500).json({
            error: 'Analysis failed',
            message: error.message
        });
    }
});
app.post('/cleanup', async (req, res) => {
    try {
        const { code, language, profile, options = {} } = req.body;
        const keyInfo = req.keyInfo;
        if (!code) {
            return res.status(400).json({ error: 'Code is required' });
        }
        const startTime = Date.now();
        const result = await aiRouter.cleanupCode({
            code,
            language,
            profile,
            keyInfo,
            options: {
                preferLocal: keyInfo.tier === 'internal',
                maxCost: getMaxCostForTier(keyInfo.tier),
                ...options
            }
        });
        const duration = Date.now() - startTime;
        await presence_logger_1.presenceLogger.logAPICall({
            userId: keyInfo.userId,
            sessionId: keyInfo.keyId,
            endpoint: '/cleanup',
            method: 'POST',
            statusCode: 200,
            responseTime: duration,
            userAgent: req.headers['user-agent'],
            metadata: {
                codeLength: code.length,
                language,
                provider: result.provider,
                cost: result.cost,
                tier: keyInfo.tier
            }
        });
        res.json({
            success: true,
            ...result,
            meta: {
                duration,
                tier: keyInfo.tier,
                rateLimit: {
                    remaining: res.getHeader('X-RateLimit-Remaining'),
                    reset: res.getHeader('X-RateLimit-Reset')
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Code cleanup error', { error, userId: req.keyInfo?.userId });
        res.status(500).json({
            error: 'Cleanup failed',
            message: error.message
        });
    }
});
app.post('/structure', async (req, res) => {
    try {
        const { files, projectType, options = {} } = req.body;
        const keyInfo = req.keyInfo;
        if (!files || !Array.isArray(files)) {
            return res.status(400).json({ error: 'Files array is required' });
        }
        const startTime = Date.now();
        const result = await aiRouter.suggestStructure({
            files,
            projectType,
            keyInfo,
            options: {
                preferLocal: keyInfo.tier === 'internal',
                maxCost: getMaxCostForTier(keyInfo.tier),
                ...options
            }
        });
        const duration = Date.now() - startTime;
        await presence_logger_1.presenceLogger.logAPICall({
            userId: keyInfo.userId,
            sessionId: keyInfo.keyId,
            endpoint: '/structure',
            method: 'POST',
            statusCode: 200,
            responseTime: duration,
            userAgent: req.headers['user-agent'],
            metadata: {
                fileCount: files.length,
                projectType,
                provider: result.provider,
                cost: result.cost,
                tier: keyInfo.tier
            }
        });
        res.json({
            success: true,
            ...result,
            meta: {
                duration,
                tier: keyInfo.tier,
                rateLimit: {
                    remaining: res.getHeader('X-RateLimit-Remaining'),
                    reset: res.getHeader('X-RateLimit-Reset')
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Structure suggestion error', { error, userId: req.keyInfo?.userId });
        res.status(500).json({
            error: 'Structure suggestion failed',
            message: error.message
        });
    }
});
app.post('/generate', async (req, res) => {
    try {
        const { prompt, type = 'code', options = {} } = req.body;
        const keyInfo = req.keyInfo;
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }
        const startTime = Date.now();
        const result = await aiRouter.generate({
            prompt,
            type,
            keyInfo,
            options: {
                preferLocal: keyInfo.tier === 'internal',
                maxCost: getMaxCostForTier(keyInfo.tier),
                ...options
            }
        });
        const duration = Date.now() - startTime;
        await presence_logger_1.presenceLogger.logAPICall({
            userId: keyInfo.userId,
            sessionId: keyInfo.keyId,
            endpoint: '/generate',
            method: 'POST',
            statusCode: 200,
            responseTime: duration,
            userAgent: req.headers['user-agent'],
            metadata: {
                promptLength: prompt.length,
                type,
                provider: result.provider,
                cost: result.cost,
                tier: keyInfo.tier
            }
        });
        res.json({
            success: true,
            ...result,
            meta: {
                duration,
                tier: keyInfo.tier,
                rateLimit: {
                    remaining: res.getHeader('X-RateLimit-Remaining'),
                    reset: res.getHeader('X-RateLimit-Reset')
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Generation error', { error, userId: req.keyInfo?.userId });
        res.status(500).json({
            error: 'Generation failed',
            message: error.message
        });
    }
});
app.post('/estimate', async (req, res) => {
    try {
        const { task, input, options = {} } = req.body;
        const keyInfo = req.keyInfo;
        if (!task || !input) {
            return res.status(400).json({ error: 'Task and input are required' });
        }
        const estimate = await aiRouter.estimateCost({
            task,
            input,
            keyInfo,
            options
        });
        await presence_logger_1.presenceLogger.logAPICall({
            userId: keyInfo.userId,
            sessionId: keyInfo.keyId,
            endpoint: '/estimate',
            method: 'POST',
            statusCode: 200,
            userAgent: req.headers['user-agent']
        });
        res.json({
            success: true,
            estimate,
            tier: keyInfo.tier
        });
    }
    catch (error) {
        logger_1.logger.error('Cost estimation error', { error });
        res.status(500).json({
            error: 'Cost estimation failed',
            message: error.message
        });
    }
});
app.get('/usage', async (req, res) => {
    try {
        const keyInfo = req.keyInfo;
        const { timeframe = '24h' } = req.query;
        const analytics = await presence_logger_1.presenceLogger.getAnalytics(timeframe);
        const userAnalytics = {
            ...analytics,
            keyId: keyInfo.keyId,
            tier: keyInfo.tier,
            period: timeframe
        };
        res.json({
            success: true,
            usage: userAnalytics
        });
    }
    catch (error) {
        logger_1.logger.error('Usage analytics error', { error });
        res.status(500).json({
            error: 'Failed to fetch usage analytics'
        });
    }
});
app.use((error, req, res, next) => {
    logger_1.logger.error('Unhandled API error', { error, path: req.path, method: req.method });
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});
function getMaxCostForTier(tier) {
    const limits = {
        'internal': 0,
        'byok': 0,
        'cleanup': 0,
        'developer': 0.10,
        'team': 0.50,
        'enterprise': 5.00
    };
    return limits[tier] || 0;
}
async function startServer() {
    try {
        await aiRouter.initialize();
        app.listen(port, () => {
            logger_1.logger.info(`🤖 AI API Service running on port ${port}`, {
                env: process.env.NODE_ENV,
                ollama: aiRouter.isOllamaAvailable(),
                anthropic: !!process.env.ANTHROPIC_API_KEY,
                openai: !!process.env.OPENAI_API_KEY
            });
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start AI API service', { error });
        process.exit(1);
    }
}
process.on('SIGTERM', () => {
    logger_1.logger.info('AI API service shutting down...');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_1.logger.info('AI API service shutting down...');
    process.exit(0);
});
if (require.main === module) {
    startServer();
}
//# sourceMappingURL=server.js.map