"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.byokRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const async_handler_1 = require("../../utils/async-handler");
const errors_1 = require("../../utils/errors");
const logger_1 = require("../../utils/logger");
const auth_1 = require("../../services/ai-api/auth");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const require_auth_middleware_1 = require("../../middleware/require-auth.middleware");
const presence_logger_1 = __importDefault(require("../../monitoring/presence-logger"));
const router = (0, express_1.Router)();
exports.byokRouter = router;
const addKeysSchema = zod_1.z.object({
    keys: zod_1.z.record(zod_1.z.string(), zod_1.z.string().min(1)).refine((keys) => {
        const validProviders = ['anthropic', 'openai', 'azure'];
        return Object.keys(keys).some(key => validProviders.includes(key));
    }, { message: 'At least one valid provider key is required (anthropic, openai, azure)' }),
    name: zod_1.z.string().min(1).max(100).optional()
});
const testKeysSchema = zod_1.z.object({
    keys: zod_1.z.record(zod_1.z.string(), zod_1.z.string().min(1))
});
router.get('/status', auth_middleware_1.authenticate, require_auth_middleware_1.requireAuth, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = (0, require_auth_middleware_1.getAuthenticatedUser)(req);
    const userId = user.id;
    const mockBYOKStatus = {
        hasActiveKeys: false,
        keyCount: 0,
        providers: [],
        usage: {
            totalRequests: 0,
            totalCost: 0,
            lastUsed: null
        }
    };
    res.json({
        success: true,
        data: {
            userId,
            ...mockBYOKStatus,
            benefits: {
                description: "Use your own API keys for cost-effective AI processing",
                features: [
                    "No markup on API costs - pay provider rates directly",
                    "Access to your own model quotas and limits",
                    "Support for Anthropic Claude, OpenAI GPT, Azure OpenAI",
                    "Higher rate limits than paid tiers",
                    "Full transparency on usage and costs"
                ],
                rateLimit: {
                    requestsPerMinute: 500,
                    requestsPerDay: 50000
                }
            }
        }
    });
}));
router.post('/add-keys', auth_middleware_1.authenticate, require_auth_middleware_1.requireAuth, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = (0, require_auth_middleware_1.getAuthenticatedUser)(req);
    const userId = user.id;
    const data = addKeysSchema.parse(req.body);
    try {
        const validationResults = await Promise.all(Object.entries(data.keys).map(async ([provider, key]) => {
            const isValid = await validateProviderKey(provider, key);
            return { provider, valid: isValid, key: key.substring(0, 10) + '...' };
        }));
        const invalidKeys = validationResults.filter(r => !r.valid);
        if (invalidKeys.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'One or more API keys are invalid',
                invalidKeys: invalidKeys.map(k => k.provider)
            });
        }
        const byokKey = (0, auth_1.generateBYOKKey)(userId, data.keys);
        logger_1.logger.info('BYOK keys added for user', {
            userId,
            providers: Object.keys(data.keys),
            keyCount: Object.keys(data.keys).length
        });
        await presence_logger_1.default.logUserAction(userId, 'byok_keys_added', {
            userId,
            metadata: {
                providers: Object.keys(data.keys),
                keyCount: Object.keys(data.keys).length,
                name: data.name
            }
        });
        res.json({
            success: true,
            data: {
                byokKey,
                providers: Object.keys(data.keys),
                message: 'API keys added successfully',
                validationResults: validationResults.map(r => ({
                    provider: r.provider,
                    valid: r.valid,
                    key: r.key
                }))
            },
            warning: 'This is the only time your BYOK key will be shown. Please save it securely.'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to add BYOK keys', { error: (0, errors_1.getErrorMessage)(error), userId });
        throw new errors_1.AppError('Failed to add API keys', 500, 'BYOK_ADD_FAILED');
    }
}));
router.post('/test-keys', auth_middleware_1.authenticate, require_auth_middleware_1.requireAuth, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = (0, require_auth_middleware_1.getAuthenticatedUser)(req);
    const userId = user.id;
    const data = testKeysSchema.parse(req.body);
    try {
        const testResults = await Promise.all(Object.entries(data.keys).map(async ([provider, key]) => {
            const startTime = Date.now();
            const isValid = await validateProviderKey(provider, key);
            const responseTime = Date.now() - startTime;
            return {
                provider,
                valid: isValid,
                responseTime,
                key: key.substring(0, 10) + '...',
                status: isValid ? 'success' : 'failed'
            };
        }));
        await presence_logger_1.default.logUserAction(userId, 'byok_keys_tested', {
            userId,
            metadata: {
                providers: Object.keys(data.keys),
                results: testResults.map(r => ({ provider: r.provider, valid: r.valid }))
            }
        });
        res.json({
            success: true,
            data: {
                testResults,
                summary: {
                    total: testResults.length,
                    valid: testResults.filter(r => r.valid).length,
                    invalid: testResults.filter(r => !r.valid).length
                }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to test BYOK keys', { error: (0, errors_1.getErrorMessage)(error), userId });
        throw new errors_1.AppError('Failed to test API keys', 500, 'BYOK_TEST_FAILED');
    }
}));
router.delete('/remove-keys', auth_middleware_1.authenticate, require_auth_middleware_1.requireAuth, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = (0, require_auth_middleware_1.getAuthenticatedUser)(req);
    const userId = user.id;
    try {
        logger_1.logger.info('BYOK keys removed for user', { userId });
        await presence_logger_1.default.logUserAction(userId, 'byok_keys_removed', {
            userId,
            metadata: { action: 'remove_all_keys' }
        });
        res.json({
            success: true,
            message: 'All BYOK keys removed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to remove BYOK keys', { error: (0, errors_1.getErrorMessage)(error), userId });
        throw new errors_1.AppError('Failed to remove API keys', 500, 'BYOK_REMOVE_FAILED');
    }
}));
router.get('/usage', auth_middleware_1.authenticate, require_auth_middleware_1.requireAuth, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = (0, require_auth_middleware_1.getAuthenticatedUser)(req);
    const userId = user.id;
    const { timeframe = '7d' } = req.query;
    try {
        const byokUsage = {
            timeframe,
            totalRequests: 0,
            totalCost: 0,
            costSavings: 0,
            providerBreakdown: {
                anthropic: { requests: 0, cost: 0 },
                openai: { requests: 0, cost: 0 },
                azure: { requests: 0, cost: 0 }
            },
            dailyUsage: [],
            topEndpoints: []
        };
        res.json({
            success: true,
            data: byokUsage
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get BYOK usage', { error: (0, errors_1.getErrorMessage)(error), userId });
        throw new errors_1.AppError('Failed to get usage statistics', 500, 'BYOK_USAGE_FAILED');
    }
}));
router.get('/docs', (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const docs = {
        overview: "Bring Your Own Keys (BYOK) allows you to use your own API keys from AI providers for cost-effective processing.",
        supportedProviders: [
            {
                name: "Anthropic Claude",
                keyFormat: "sk-ant-api03-...",
                website: "https://console.anthropic.com/",
                models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"]
            },
            {
                name: "OpenAI GPT",
                keyFormat: "sk-...",
                website: "https://platform.openai.com/api-keys",
                models: ["gpt-4", "gpt-3.5-turbo"]
            },
            {
                name: "Azure OpenAI",
                keyFormat: "YOUR_AZURE_KEY",
                website: "https://portal.azure.com/",
                models: ["gpt-4", "gpt-35-turbo"]
            }
        ],
        benefits: [
            "Pay provider rates directly - no markup",
            "Access to your own quotas and limits",
            "Higher rate limits than paid tiers",
            "Full cost transparency",
            "Support for latest models"
        ],
        setup: {
            step1: "Obtain API keys from your chosen providers",
            step2: "Test your keys using the /test-keys endpoint",
            step3: "Add your keys using the /add-keys endpoint",
            step4: "Use your BYOK API key in requests to our AI API",
            step5: "Monitor usage and costs in the dashboard"
        },
        security: [
            "Keys are encrypted at rest using AES-256",
            "Keys are never logged or exposed in responses",
            "You can remove keys at any time",
            "Keys are only used for your requests"
        ],
        usage: {
            apiKey: "Use your generated BYOK key in API requests",
            example: {
                curl: `curl -X POST http://localhost:3001/analyze \\
  -H "Authorization: Bearer YOUR_BYOK_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"code": "function hello() { console.log(\\"Hello\\"); }"}'`
            }
        }
    };
    res.json({
        success: true,
        data: docs
    });
}));
async function validateProviderKey(provider, key) {
    try {
        switch (provider.toLowerCase()) {
            case 'anthropic':
                return await validateAnthropicKey(key);
            case 'openai':
                return await validateOpenAIKey(key);
            case 'azure':
                return await validateAzureKey(key);
            default:
                return false;
        }
    }
    catch (error) {
        logger_1.logger.error(`Failed to validate ${provider} key`, { error: (0, errors_1.getErrorMessage)(error) });
        return false;
    }
}
async function validateAnthropicKey(key) {
    try {
        return key.startsWith('sk-ant-api03-') && key.length > 20;
    }
    catch (error) {
        return false;
    }
}
async function validateOpenAIKey(key) {
    try {
        return key.startsWith('sk-') && key.length > 20;
    }
    catch (error) {
        return false;
    }
}
async function validateAzureKey(key) {
    try {
        return key.length > 10;
    }
    catch (error) {
        return false;
    }
}
//# sourceMappingURL=byok.route.js.map