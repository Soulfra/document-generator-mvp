#!/usr/bin/env node

/**
 * AI API SERVICE - Scalable LLM Processing Server
 * 
 * Dedicated microservice for AI operations that can be:
 * - Scaled independently in containers
 * - Used internally at reduced rates (Ollama-first)
 * - Support BYOK (Bring Your Own Keys)
 * - Route between different LLM providers intelligently
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { logger } from '../../utils/logger';
import { presenceLogger } from '../../monitoring/presence-logger';
import { AIRouter } from './ai-router';
import { validateAPIKey, APIKeyTier } from './auth';

const app = express();
const port = process.env.AI_API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Rate limiting based on tier
const createRateLimit = (windowMs: number, max: number) => 
  rateLimit({
    windowMs,
    max,
    message: { error: 'Rate limit exceeded' },
    standardHeaders: true,
    legacyHeaders: false,
  });

// Different rate limits for different tiers
const tierLimits = {
  'internal': createRateLimit(60 * 1000, 10000), // 10000/min for internal
  'byok': createRateLimit(60 * 1000, 500),       // 500/min for BYOK
  'cleanup': createRateLimit(60 * 1000, 10),     // 10/min for $1 cleanup
  'developer': createRateLimit(60 * 1000, 100),  // 100/min for $5 developer
  'team': createRateLimit(60 * 1000, 500),       // 500/min for $25 team
  'enterprise': createRateLimit(60 * 1000, 2000) // 2000/min for enterprise
};

// Initialize AI Router
const aiRouter = new AIRouter();

// Middleware to extract and validate API key
app.use(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const apiKey = authHeader?.replace('Bearer ', '') || req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key required',
        hint: 'Include Authorization: Bearer <key> header or x-api-key header'
      });
    }

    const validation = await validateAPIKey(apiKey);
    if (!validation.valid) {
      return res.status(401).json({ 
        error: 'Invalid API key',
        code: validation.error
      });
    }

    // Attach key info to request
    (req as any).keyInfo = validation;
    
    // Apply appropriate rate limit
    const rateLimiter = tierLimits[validation.tier];
    rateLimiter(req, res, next);
    
  } catch (error) {
    logger.error('API key validation error', { error });
    res.status(500).json({ error: 'Authentication service unavailable' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    provider: 'FinishThisIdea AI API'
  });
});

// Get available models and pricing
app.get('/models', async (req, res) => {
  try {
    const keyInfo = (req as any).keyInfo;
    const models = await aiRouter.getAvailableModels(keyInfo);
    
    await presenceLogger.logAPICall({
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
    
  } catch (error) {
    logger.error('Error fetching models', { error });
    res.status(500).json({ error: 'Failed to fetch available models' });
  }
});

// Code analysis endpoint
app.post('/analyze', async (req, res) => {
  try {
    const { code, language, profile, options = {} } = req.body;
    const keyInfo = (req as any).keyInfo;
    
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
        preferLocal: keyInfo.tier === 'internal', // Internal users prefer local/free
        maxCost: getMaxCostForTier(keyInfo.tier),
        ...options
      }
    });

    const duration = Date.now() - startTime;
    
    // Log the API call
    await presenceLogger.logAPICall({
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

  } catch (error) {
    logger.error('Code analysis error', { error, userId: (req as any).keyInfo?.userId });
    res.status(500).json({ 
      error: 'Analysis failed',
      message: error.message 
    });
  }
});

// Code cleanup endpoint
app.post('/cleanup', async (req, res) => {
  try {
    const { code, language, profile, options = {} } = req.body;
    const keyInfo = (req as any).keyInfo;
    
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
    
    // Log the API call
    await presenceLogger.logAPICall({
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

  } catch (error) {
    logger.error('Code cleanup error', { error, userId: (req as any).keyInfo?.userId });
    res.status(500).json({ 
      error: 'Cleanup failed',
      message: error.message 
    });
  }
});

// File structure suggestion endpoint
app.post('/structure', async (req, res) => {
  try {
    const { files, projectType, options = {} } = req.body;
    const keyInfo = (req as any).keyInfo;
    
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
    
    // Log the API call
    await presenceLogger.logAPICall({
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

  } catch (error) {
    logger.error('Structure suggestion error', { error, userId: (req as any).keyInfo?.userId });
    res.status(500).json({ 
      error: 'Structure suggestion failed',
      message: error.message 
    });
  }
});

// General generation endpoint
app.post('/generate', async (req, res) => {
  try {
    const { prompt, type = 'code', options = {} } = req.body;
    const keyInfo = (req as any).keyInfo;
    
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
    
    // Log the API call
    await presenceLogger.logAPICall({
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

  } catch (error) {
    logger.error('Generation error', { error, userId: (req as any).keyInfo?.userId });
    res.status(500).json({ 
      error: 'Generation failed',
      message: error.message 
    });
  }
});

// Cost estimation endpoint
app.post('/estimate', async (req, res) => {
  try {
    const { task, input, options = {} } = req.body;
    const keyInfo = (req as any).keyInfo;
    
    if (!task || !input) {
      return res.status(400).json({ error: 'Task and input are required' });
    }

    const estimate = await aiRouter.estimateCost({
      task,
      input,
      keyInfo,
      options
    });
    
    await presenceLogger.logAPICall({
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

  } catch (error) {
    logger.error('Cost estimation error', { error });
    res.status(500).json({ 
      error: 'Cost estimation failed',
      message: error.message 
    });
  }
});

// Usage analytics for the API key
app.get('/usage', async (req, res) => {
  try {
    const keyInfo = (req as any).keyInfo;
    const { timeframe = '24h' } = req.query;
    
    // This would fetch usage from presenceLogger analytics
    const analytics = await presenceLogger.getAnalytics(timeframe as string);
    
    // Filter for this specific user/key
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

  } catch (error) {
    logger.error('Usage analytics error', { error });
    res.status(500).json({ 
      error: 'Failed to fetch usage analytics' 
    });
  }
});

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  logger.error('Unhandled API error', { error, path: req.path, method: req.method });
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Helper function to get max cost per tier
function getMaxCostForTier(tier: APIKeyTier): number {
  const limits = {
    'internal': 0, // No cost limit for internal (uses free models)
    'byok': 0, // BYOK uses user's own keys
    'cleanup': 0, // $1 cleanup tier - no additional AI costs
    'developer': 0.10, // $5 developer tier - $0.10 per request limit
    'team': 0.50, // $25 team tier - $0.50 per request limit
    'enterprise': 5.00 // Enterprise tier - $5.00 per request limit
  };
  
  return limits[tier] || 0;
}

// Initialize AI Router and start server
async function startServer() {
  try {
    await aiRouter.initialize();
    
    app.listen(port, () => {
      logger.info(`🤖 AI API Service running on port ${port}`, {
        env: process.env.NODE_ENV,
        ollama: aiRouter.isOllamaAvailable(),
        anthropic: !!process.env.ANTHROPIC_API_KEY,
        openai: !!process.env.OPENAI_API_KEY
      });
    });
    
  } catch (error) {
    logger.error('Failed to start AI API service', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('AI API service shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('AI API service shutting down...');
  process.exit(0);
});

// Start the server
if (require.main === module) {
  startServer();
}

export { app };