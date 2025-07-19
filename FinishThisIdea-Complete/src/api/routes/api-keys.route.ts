/**
 * API KEYS MANAGEMENT ROUTES
 * 
 * Allows users to manage their API keys for different pricing tiers
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/async-handler';
import { AppError } from '../../utils/errors';
import { apiKeyManagementService } from '../../services/api-key-management.service';
import { pricingService } from '../../services/pricing.service';
import { logger } from '../../utils/logger';
import { requireAuth, getAuthenticatedUser } from '../../middleware/require-auth.middleware';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// ============================================================================
// 📋 VALIDATION SCHEMAS
// ============================================================================

const generateKeySchema = z.object({
  tier: z.enum(['cleanup', 'developer', 'team', 'enterprise']),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  expiresInDays: z.number().min(1).max(365).optional(),
});

const deactivateKeySchema = z.object({
  keyId: z.string().min(1),
});

// ============================================================================
// 🔑 API KEY MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/api-keys
 * Get user's API keys and usage statistics
 */
router.get(
  '/',
  authenticate,
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const userId = user.id;
    
    const [keys, stats] = await Promise.all([
      apiKeyManagementService.getUserAPIKeys(userId),
      apiKeyManagementService.getAPIKeyStats(userId)
    ]);
    
    // Get current recommended tier
    const recommendedTier = await pricingService.getRecommendedTier(userId);
    
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
  })
);

/**
 * POST /api/api-keys/generate
 * Generate a new API key for a specific tier
 */
router.post(
  '/generate',
  authenticate,
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const userId = user.id;
    const data = generateKeySchema.parse(req.body);
    
    // Check if user has access to this tier
    const userTier = await pricingService.getRecommendedTier(userId);
    const tierHierarchy = ['cleanup', 'developer', 'team', 'enterprise'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    const requestedTierIndex = tierHierarchy.indexOf(data.tier);
    
    if (requestedTierIndex > userTierIndex) {
      throw new AppError(
        `You need to upgrade to ${data.tier} tier to generate this API key`, 
        403, 
        'INSUFFICIENT_TIER'
      );
    }
    
    try {
      const result = await apiKeyManagementService.generateAPIKeyForUser(
        userId,
        data.tier as any,
        {
          name: data.name,
          description: data.description,
          expiresInDays: data.expiresInDays
        }
      );
      
      // Log key generation
      logger.info('API key generated', {
        userId,
        tier: data.tier,
        keyId: result.keyInfo.keyId,
        requestedBy: 'user'
      });
      
      res.json({
        success: true,
        data: {
          apiKey: result.apiKey, // Only return this once!
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
      
    } catch (error) {
      logger.error('Failed to generate API key', { error, userId, data });
      throw new AppError('Failed to generate API key', 500, 'KEY_GENERATION_FAILED');
    }
  })
);

/**
 * POST /api/api-keys/deactivate
 * Deactivate an API key
 */
router.post(
  '/deactivate',
  authenticate,
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const userId = user.id;
    const data = deactivateKeySchema.parse(req.body);
    
    const success = await apiKeyManagementService.deactivateAPIKey(userId, data.keyId);
    
    if (!success) {
      throw new AppError('Failed to deactivate API key', 500, 'DEACTIVATION_FAILED');
    }
    
    res.json({
      success: true,
      message: 'API key deactivated successfully'
    });
  })
);

/**
 * GET /api/api-keys/usage/:keyId
 * Get detailed usage statistics for a specific API key
 */
router.get(
  '/usage/:keyId',
  authenticate,
  requireAuth,
  asyncHandler(async (req, res) => {
    // const user = getAuthenticatedUser(req); // Reserved for future use
    // const userId = user.id; // Reserved for future use
    const { keyId } = req.params;
    const { timeframe = '7d' } = req.query;
    
    // Get usage analytics - placeholder for now
    // In a real implementation, this would query actual usage data
    
    // Filter for this specific key
    // In a real implementation, this would be more sophisticated
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
  })
);

/**
 * POST /api/api-keys/upgrade
 * Upgrade an API key to a higher tier
 */
router.post(
  '/upgrade',
  authenticate,
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const userId = user.id;
    const { fromTier, toTier } = req.body;
    
    if (!fromTier || !toTier) {
      throw new AppError('Both fromTier and toTier are required', 400, 'MISSING_TIERS');
    }
    
    // Check if user has payment for the target tier
    const userTier = await pricingService.getRecommendedTier(userId);
    const tierHierarchy = ['cleanup', 'developer', 'team', 'enterprise'];
    const userTierIndex = tierHierarchy.indexOf(userTier);
    const targetTierIndex = tierHierarchy.indexOf(toTier);
    
    if (targetTierIndex > userTierIndex) {
      throw new AppError(
        `Please upgrade your subscription to ${toTier} tier first`, 
        403, 
        'SUBSCRIPTION_REQUIRED'
      );
    }
    
    try {
      const result = await apiKeyManagementService.upgradeAPIKey(
        userId,
        fromTier,
        toTier
      );
      
      res.json({
        success: true,
        data: {
          apiKey: result.apiKey,
          keyInfo: result.keyInfo,
          message: `API key upgraded from ${fromTier} to ${toTier}`
        },
        warning: 'This is the only time the new API key will be shown. Please save it securely.'
      });
      
    } catch (error) {
      logger.error('Failed to upgrade API key', { error, userId, fromTier, toTier });
      throw new AppError('Failed to upgrade API key', 500, 'UPGRADE_FAILED');
    }
  })
);

/**
 * GET /api/api-keys/tier-access
 * Check what tiers the user has access to
 */
router.get(
  '/tier-access',
  authenticate,
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const userId = user.id;
    
    const [userTier, pricing] = await Promise.all([
      pricingService.getRecommendedTier(userId),
      pricingService.getPricingDisplay(userId)
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
  })
);

/**
 * GET /api/api-keys/docs
 * Get API documentation and usage examples
 */
router.get(
  '/docs',
  asyncHandler(async (_req, res) => {
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
  })
);

export { router as apiKeysRouter };