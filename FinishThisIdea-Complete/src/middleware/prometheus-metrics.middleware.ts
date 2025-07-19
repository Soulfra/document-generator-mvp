/**
 * Business Metrics Middleware
 * Automatically records business metrics for key operations
 */

import { Request, Response, NextFunction } from 'express';
import { prometheusMetrics } from '../services/monitoring/prometheus-metrics.service';
import { logger } from '../utils/logger';

/**
 * Middleware to automatically record business metrics based on API calls
 */
export function businessMetricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Store original res.json to intercept responses
  const originalJson = res.json;
  
  res.json = function(body: any) {
    try {
      // Record metrics based on route and response
      recordBusinessMetrics(req, res, body);
    } catch (error) {
      logger.error('Failed to record business metrics:', error);
    }
    
    // Call original json method
    return originalJson.call(this, body);
  };
  
  next();
}

/**
 * Record business metrics based on API endpoint and response
 */
function recordBusinessMetrics(req: Request, res: Response, responseBody: any): void {
  const { method, path } = req;
  const statusCode = res.statusCode;
  const isSuccess = statusCode >= 200 && statusCode < 300;
  
  // API Key usage tracking
  if (path.includes('/api-keys') && method === 'POST' && isSuccess) {
    const tier = responseBody?.data?.tier || 'FREE';
    prometheusMetrics.recordApiKeyUsage('new', tier, 'create');
  }
  
  // Payment processing
  if (path.includes('/payment') && method === 'POST' && isSuccess) {
    const amount = responseBody?.data?.amount || 0;
    prometheusMetrics.recordPayment('succeeded', amount);
  }
  
  // AI requests (LLM calls)
  if (path.includes('/ai') || path.includes('/llm') || path.includes('/chat')) {
    const provider = extractProvider(req, responseBody);
    const model = extractModel(req, responseBody);
    const status = isSuccess ? 'success' : 'error';
    prometheusMetrics.recordAiRequest(provider, model, status);
  }
  
  // QR code generation
  if (path.includes('/qr') && method === 'POST' && isSuccess) {
    const type = path.includes('referral') ? 'referral' : 'general';
    prometheusMetrics.recordQrCodeGenerated(type);
  }
  
  // Social sharing
  if (path.includes('/share') || path.includes('/social')) {
    const platform = extractSocialPlatform(req);
    const contentType = extractContentType(req);
    prometheusMetrics.recordSocialShare(platform, contentType);
  }
  
  // Achievement unlocks
  if (path.includes('/achievements') && method === 'POST' && isSuccess) {
    const achievementType = responseBody?.data?.type || 'unknown';
    const tier = responseBody?.data?.userTier || 'FREE';
    prometheusMetrics.recordAchievementUnlocked(achievementType, tier);
  }
  
  // File uploads (additional tracking)
  if (path.includes('/upload') && method === 'POST' && isSuccess) {
    const fileType = extractFileType(req);
    prometheusMetrics.recordUpload(fileType, 'processing');
  }
}

/**
 * Extract AI provider from request/response
 */
function extractProvider(req: Request, responseBody: any): string {
  // Check request body
  if (req.body?.provider) return req.body.provider;
  
  // Check response body
  if (responseBody?.data?.provider) return responseBody.data.provider;
  
  // Infer from path
  if (req.path.includes('anthropic')) return 'anthropic';
  if (req.path.includes('openai')) return 'openai';
  if (req.path.includes('ollama')) return 'ollama';
  
  return 'unknown';
}

/**
 * Extract AI model from request/response
 */
function extractModel(req: Request, responseBody: any): string {
  // Check request body
  if (req.body?.model) return req.body.model;
  
  // Check response body
  if (responseBody?.data?.model) return responseBody.data.model;
  
  // Default models based on provider
  const provider = extractProvider(req, responseBody);
  switch (provider) {
    case 'anthropic': return 'claude-3';
    case 'openai': return 'gpt-4';
    case 'ollama': return 'llama2';
    default: return 'unknown';
  }
}

/**
 * Extract social media platform from request
 */
function extractSocialPlatform(req: Request): string {
  if (req.body?.platform) return req.body.platform;
  if (req.query?.platform) return req.query.platform as string;
  
  // Infer from path or headers
  if (req.path.includes('twitter')) return 'twitter';
  if (req.path.includes('facebook')) return 'facebook';
  if (req.path.includes('linkedin')) return 'linkedin';
  
  return 'unknown';
}

/**
 * Extract content type for social sharing
 */
function extractContentType(req: Request): string {
  if (req.body?.contentType) return req.body.contentType;
  
  // Infer from path
  if (req.path.includes('achievement')) return 'achievement';
  if (req.path.includes('job')) return 'job_completion';
  if (req.path.includes('referral')) return 'referral';
  
  return 'general';
}

/**
 * Extract file type from upload request
 */
function extractFileType(req: Request): string {
  if (req.file?.originalname) {
    const extension = req.file.originalname.split('.').pop();
    return extension?.toLowerCase() || 'unknown';
  }
  
  return 'unknown';
}

/**
 * Middleware specifically for tracking API key usage
 */
export function apiKeyUsageMiddleware(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (apiKey) {
    // Record API key usage
    const tier = (req as any).user?.tier || 'FREE';
    const endpoint = req.path;
    prometheusMetrics.recordApiKeyUsage(apiKey.substring(0, 8), tier, endpoint);
  }
  
  next();
}

/**
 * Middleware for tracking user tier-based metrics
 */
export function userTierMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Store user tier in request for other middleware to use
  const userTier = (req as any).user?.tier || 'FREE';
  (req as any).userTier = userTier;
  
  next();
}