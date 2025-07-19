"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeysRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const async_handler_1 = require("../../utils/async-handler");
const errors_1 = require("../../utils/errors");
const api_key_management_service_1 = require("../../services/api-key-management.service");
const pricing_service_1 = require("../../services/pricing.service");
const logger_1 = require("../../utils/logger");
const require_auth_middleware_1 = require("../../middleware/require-auth.middleware");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
exports.apiKeysRouter = router;
const generateKeySchema = zod_1.z.object({
    tier: zod_1.z.enum(['cleanup', 'developer', 'team', 'enterprise']),
    name: zod_1.z.string().min(1).max(100).optional(),
    description: zod_1.z.string().max(500).optional(),
    expiresInDays: zod_1.z.number().min(1).max(365).optional(),
});
const deactivateKeySchema = zod_1.z.object({
    keyId: zod_1.z.string().min(1),
});
router.get('/', auth_middleware_1.authenticate, require_auth_middleware_1.requireAuth, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = (0, require_auth_middleware_1.getAuthenticatedUser)(req);
    const userId = user.id;
    const [keys, stats] = await Promise.all([
        api_key_management_service_1.apiKeyManagementService.getUserAPIKeys(userId),
        api_key_management_service_1.apiKeyManagementService.getAPIKeyStats(userId)
    ]);
    const recommendedTier = await pricing_service_1.pricingService.getRecommendedTier(userId);
    res.json({
        success: true,
        data: {
            keys: keys.map(key => ({
                id: key.id,
                keyId: key.keyId,
                tier: key.tier,
                isActive: key.isActive,
                createdAt: key.createdAt,
                expiresAt: key.expiresAt,
                lastUsedAt: key.lastUsedAt,
                usageCount: key.usageCount,
                metadata: key.metadata
            })),
            stats,
            recommendedTier
        }
    });
}));
router.post('/generate', auth_middleware_1.authenticate, require_auth_middleware_1.requireAuth, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = (0, require_auth_middleware_1.getAuthenticatedUser)(req);
    const userId = user.id;
    const data = generateKeySchema.parse(req.body);
    const userTier = await pricing_service_1.pricingService.getRecommendedTier(userId);
    const tierHierarchy = ['cleanup', 'developer', 'team', 'enterprise'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    const requestedTierIndex = tierHierarchy.indexOf(data.tier);
    if (requestedTierIndex > userTierIndex) {
        throw new errors_1.AppError(`You need to upgrade to ${data.tier} tier to generate this API key`, 403, 'INSUFFICIENT_TIER');
    }
    try {
        const result = await api_key_management_service_1.apiKeyManagementService.generateAPIKeyForUser(userId, data.tier, {
            name: data.name,
            description: data.description,
            expiresInDays: data.expiresInDays
        });
        logger_1.logger.info('API key generated', {
            userId,
            tier: data.tier,
            keyId: result.keyInfo.keyId,
            requestedBy: 'user'
        });
        res.json({
            success: true,
            data: {
                apiKey: result.apiKey,
                keyInfo: {
                    id: result.keyInfo.id,
                    keyId: result.keyInfo.keyId,
                    tier: result.keyInfo.tier,
                    createdAt: result.keyInfo.createdAt,
                    expiresAt: result.keyInfo.expiresAt,
                    metadata: result.keyInfo.metadata
                }
            },
            warning: 'This is the only time the API key will be shown. Please save it securely.'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to generate API key', { error, userId, data });
        throw new errors_1.AppError('Failed to generate API key', 500, 'KEY_GENERATION_FAILED');
    }
}));
router.post('/deactivate', auth_middleware_1.authenticate, require_auth_middleware_1.requireAuth, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = (0, require_auth_middleware_1.getAuthenticatedUser)(req);
    const userId = user.id;
    const data = deactivateKeySchema.parse(req.body);
    const success = await api_key_management_service_1.apiKeyManagementService.deactivateAPIKey(userId, data.keyId);
    if (!success) {
        throw new errors_1.AppError('Failed to deactivate API key', 500, 'DEACTIVATION_FAILED');
    }
    res.json({
        success: true,
        message: 'API key deactivated successfully'
    });
}));
router.get('/usage/:keyId', auth_middleware_1.authenticate, require_auth_middleware_1.requireAuth, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { keyId } = req.params;
    const { timeframe = '7d' } = req.query;
    const keyUsage = {
        keyId,
        timeframe,
        totalRequests: 0,
        totalCost: 0,
        endpointBreakdown: {},
        dailyUsage: [],
        errorRate: 0
    };
    res.json({
        success: true,
        data: keyUsage
    });
}));
router.post('/upgrade', auth_middleware_1.authenticate, require_auth_middleware_1.requireAuth, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = (0, require_auth_middleware_1.getAuthenticatedUser)(req);
    const userId = user.id;
    const { fromTier, toTier } = req.body;
    if (!fromTier || !toTier) {
        throw new errors_1.AppError('Both fromTier and toTier are required', 400, 'MISSING_TIERS');
    }
    const userTier = await pricing_service_1.pricingService.getRecommendedTier(userId);
    const tierHierarchy = ['cleanup', 'developer', 'team', 'enterprise'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    const targetTierIndex = tierHierarchy.indexOf(toTier);
    if (targetTierIndex > userTierIndex) {
        throw new errors_1.AppError(`Please upgrade your subscription to ${toTier} tier first`, 403, 'SUBSCRIPTION_REQUIRED');
    }
    try {
        const result = await api_key_management_service_1.apiKeyManagementService.upgradeAPIKey(userId, fromTier, toTier);
        res.json({
            success: true,
            data: {
                apiKey: result.apiKey,
                keyInfo: result.keyInfo,
                message: `API key upgraded from ${fromTier} to ${toTier}`
            },
            warning: 'This is the only time the new API key will be shown. Please save it securely.'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to upgrade API key', { error, userId, fromTier, toTier });
        throw new errors_1.AppError('Failed to upgrade API key', 500, 'UPGRADE_FAILED');
    }
}));
router.get('/tier-access', auth_middleware_1.authenticate, require_auth_middleware_1.requireAuth, (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = (0, require_auth_middleware_1.getAuthenticatedUser)(req);
    const userId = user.id;
    const [userTier, pricing] = await Promise.all([
        pricing_service_1.pricingService.getRecommendedTier(userId),
        pricing_service_1.pricingService.getPricingDisplay(userId)
    ]);
    const tierHierarchy = ['cleanup', 'developer', 'team', 'enterprise'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    const accessibleTiers = tierHierarchy.slice(0, userTierIndex + 1);
    const upgradeOptions = tierHierarchy.slice(userTierIndex + 1);
    res.json({
        success: true,
        data: {
            currentTier: userTier,
            accessibleTiers,
            upgradeOptions,
            pricing: pricing.tiers,
            recommended: pricing.recommended
        }
    });
}));
router.get('/docs', (0, async_handler_1.asyncHandler)(async (_req, res) => {
    const docs = {
        baseUrl: process.env.AI_API_URL || 'http://localhost:3001',
        authentication: {
            method: 'Bearer Token',
            header: 'Authorization: Bearer YOUR_API_KEY',
            alternative: 'x-api-key: YOUR_API_KEY'
        },
        endpoints: [
            {
                method: 'GET',
                path: '/health',
                description: 'Check API health and status'
            },
            {
                method: 'GET',
                path: '/models',
                description: 'Get available AI models for your tier'
            },
            {
                method: 'POST',
                path: '/analyze',
                description: 'Analyze code for issues and improvements',
                body: {
                    code: 'string (required)',
                    language: 'string (optional)',
                    profile: 'object (optional)'
                }
            },
            {
                method: 'POST',
                path: '/cleanup',
                description: 'Clean up and improve code',
                body: {
                    code: 'string (required)',
                    language: 'string (optional)',
                    profile: 'object (optional)'
                }
            },
            {
                method: 'POST',
                path: '/structure',
                description: 'Suggest file/folder structure',
                body: {
                    files: 'array (required)',
                    projectType: 'string (optional)'
                }
            },
            {
                method: 'POST',
                path: '/generate',
                description: 'Generate code or documentation',
                body: {
                    prompt: 'string (required)',
                    type: 'string (optional): code|docs|tests|comments'
                }
            }
        ],
        examples: {
            curl: `curl -X POST \\
  ${process.env.AI_API_URL || 'http://localhost:3001'}/analyze \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"code": "function hello() { console.log(\\"Hello World\\"); }", "language": "javascript"}'`,
            javascript: `const response = await fetch('${process.env.AI_API_URL || 'http://localhost:3001'}/analyze', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    code: 'function hello() { console.log("Hello World"); }',
    language: 'javascript'
  })
});

const result = await response.json();`,
            python: `import requests

response = requests.post('${process.env.AI_API_URL || 'http://localhost:3001'}/analyze', 
  headers={
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  json={
    'code': 'def hello(): print("Hello World")',
    'language': 'python'
  }
)

result = response.json()`
        },
        rateLimits: {
            cleanup: '10 requests/minute, 100 requests/day',
            developer: '100 requests/minute, 500 requests/day',
            team: '500 requests/minute, 5000 requests/day',
            enterprise: '2000 requests/minute, 500000 requests/day'
        }
    };
    res.json({
        success: true,
        data: docs
    });
}));
//# sourceMappingURL=api-keys.route.js.map