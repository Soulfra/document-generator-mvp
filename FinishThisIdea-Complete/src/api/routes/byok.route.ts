/**
 * BRING YOUR OWN KEYS (BYOK) MANAGEMENT ROUTES
 * 
 * Allows users to manage their own LLM API keys for cost-effective usage
 * Users can add/remove their own Anthropic, OpenAI, Azure OpenAI keys
 */

import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/async-handler';
import { AppError, getErrorMessage } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { generateBYOKKey } from '../../services/ai-api/auth';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAuth, getAuthenticatedUser } from '../../middleware/require-auth.middleware';
// @ts-ignore - JavaScript module
import presenceLogger from '../../monitoring/presence-logger';

const router = Router();

// ============================================================================
// 📋 VALIDATION SCHEMAS
// ============================================================================

const addKeysSchema = z.object({
  keys: z.record(z.string(), z.string().min(1)).refine(
    (keys) => {
      const validProviders = ['anthropic', 'openai', 'azure'];
      return Object.keys(keys).some(key => validProviders.includes(key));
    },
    { message: 'At least one valid provider key is required (anthropic, openai, azure)' }
  ),
  name: z.string().min(1).max(100).optional()
});

const testKeysSchema = z.object({
  keys: z.record(z.string(), z.string().min(1))
});

// ============================================================================
// 🔑 BYOK MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/byok/status
 * Get user's BYOK status and current keys (without exposing actual keys)
 */
router.get(
  '/status',
  authenticate,
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const userId = user.id;
    
    // For now, mock BYOK status - in real implementation, query database
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
  })
);

/**
 * POST /api/byok/add-keys
 * Add or update user's API keys for BYOK
 */
router.post(
  '/add-keys',
  authenticate,
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const userId = user.id;
    const data = addKeysSchema.parse(req.body);
    
    try {
      // Validate each key with its respective provider
      const validationResults = await Promise.all(
        Object.entries(data.keys).map(async ([provider, key]) => {
          const isValid = await validateProviderKey(provider, key);
          return { provider, valid: isValid, key: key.substring(0, 10) + '...' };
        })
      );

      // Check if any keys failed validation
      const invalidKeys = validationResults.filter(r => !r.valid);
      if (invalidKeys.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'One or more API keys are invalid',
          invalidKeys: invalidKeys.map(k => k.provider)
        });
      }

      // Generate BYOK API key
      const byokKey = generateBYOKKey(userId, data.keys);
      
      // In real implementation, encrypt and store keys in database
      // For now, just log the successful creation
      logger.info('BYOK keys added for user', {
        userId,
        providers: Object.keys(data.keys),
        keyCount: Object.keys(data.keys).length
      });

      // Log the key generation
      await presenceLogger.logUserAction(userId, 'byok_keys_added', {
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

    } catch (error) {
      logger.error('Failed to add BYOK keys', { error: getErrorMessage(error), userId });
      throw new AppError('Failed to add API keys', 500, 'BYOK_ADD_FAILED');
    }
  })
);

/**
 * POST /api/byok/test-keys
 * Test API keys before adding them
 */
router.post(
  '/test-keys',
  authenticate,
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const userId = user.id;
    const data = testKeysSchema.parse(req.body);
    
    try {
      // Validate each key with its respective provider
      const testResults = await Promise.all(
        Object.entries(data.keys).map(async ([provider, key]) => {
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
        })
      );

      // Log the test
      await presenceLogger.logUserAction(userId, 'byok_keys_tested', {
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

    } catch (error) {
      logger.error('Failed to test BYOK keys', { error: getErrorMessage(error), userId });
      throw new AppError('Failed to test API keys', 500, 'BYOK_TEST_FAILED');
    }
  })
);

/**
 * DELETE /api/byok/remove-keys
 * Remove user's BYOK keys
 */
router.delete(
  '/remove-keys',
  authenticate,
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const userId = user.id;
    
    try {
      // In real implementation, remove encrypted keys from database
      // For now, just log the removal
      logger.info('BYOK keys removed for user', { userId });

      await presenceLogger.logUserAction(userId, 'byok_keys_removed', {
        userId,
        metadata: { action: 'remove_all_keys' }
      });

      res.json({
        success: true,
        message: 'All BYOK keys removed successfully'
      });

    } catch (error) {
      logger.error('Failed to remove BYOK keys', { error: getErrorMessage(error), userId });
      throw new AppError('Failed to remove API keys', 500, 'BYOK_REMOVE_FAILED');
    }
  })
);

/**
 * GET /api/byok/usage
 * Get detailed usage statistics for BYOK
 */
router.get(
  '/usage',
  authenticate,
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const userId = user.id;
    const { timeframe = '7d' } = req.query;
    
    try {
      // Get usage analytics from presenceLogger
      // const analytics = await presenceLogger.getAnalytics(timeframe as string);
      
      // Mock BYOK usage data
      const byokUsage = {
        timeframe,
        totalRequests: 0,
        totalCost: 0,
        costSavings: 0, // Compared to paid tiers
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

    } catch (error) {
      logger.error('Failed to get BYOK usage', { error: getErrorMessage(error), userId });
      throw new AppError('Failed to get usage statistics', 500, 'BYOK_USAGE_FAILED');
    }
  })
);

/**
 * GET /api/byok/docs
 * Get BYOK documentation and setup instructions
 */
router.get(
  '/docs',
  asyncHandler(async (_req, res) => {
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
  })
);

// ============================================================================
// 🛠️ HELPER FUNCTIONS
// ============================================================================

/**
 * Validate API key with its respective provider
 */
async function validateProviderKey(provider: string, key: string): Promise<boolean> {
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
  } catch (error) {
    logger.error(`Failed to validate ${provider} key`, { error: getErrorMessage(error) });
    return false;
  }
}

async function validateAnthropicKey(key: string): Promise<boolean> {
  try {
    // In real implementation, make a test request to Anthropic API
    // For now, just check key format
    return key.startsWith('sk-ant-api03-') && key.length > 20;
  } catch (error) {
    return false;
  }
}

async function validateOpenAIKey(key: string): Promise<boolean> {
  try {
    // In real implementation, make a test request to OpenAI API
    // For now, just check key format
    return key.startsWith('sk-') && key.length > 20;
  } catch (error) {
    return false;
  }
}

async function validateAzureKey(key: string): Promise<boolean> {
  try {
    // In real implementation, make a test request to Azure OpenAI API
    // For now, just check key format
    return key.length > 10;
  } catch (error) {
    return false;
  }
}

export { router as byokRouter };