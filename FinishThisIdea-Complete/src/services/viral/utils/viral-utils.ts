/**
 * VIRAL UTILITIES - Helper Functions
 * 
 * Common utility functions used across viral services
 */

import crypto from 'crypto';
import { logger } from '../../../utils/logger';

// ============================================================================
// 🎯 REFERRAL CODE GENERATION
// ============================================================================

/**
 * Generate a unique referral code for a user
 */
export function generateReferralCode(userId: string, displayName?: string): string {
  // Create a base from user info
  const base = displayName ? 
    displayName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 6) :
    userId.substring(0, 6);
  
  // Add random suffix for uniqueness
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  
  return `${base}${randomSuffix}`.toUpperCase();
}

/**
 * Validate referral code format
 */
export function isValidReferralCode(code: string): boolean {
  // Should be 6-12 characters, alphanumeric
  return /^[A-Z0-9]{6,12}$/.test(code);
}

// ============================================================================
// 💰 TOKEN REWARD CALCULATIONS
// ============================================================================

/**
 * Calculate token reward based on action type and user tier
 */
export function calculateTokenReward(
  actionType: 'signup' | 'referral' | 'showcase' | 'collaboration' | 'upload',
  metadata: {
    userTier?: string;
    revenueGenerated?: number;
    collaborators?: number;
    showcaseViews?: number;
    uploadValue?: number;
  } = {}
): number {
  const baseRewards = {
    signup: 50,
    referral: 25,
    showcase: 10,
    collaboration: 100,
    upload: 1
  };

  let reward = baseRewards[actionType] || 0;

  // Apply tier multipliers
  const tierMultipliers = {
    'free': 1.0,
    'paid': 1.2,
    'enterprise': 1.5
  };
  
  const multiplier = tierMultipliers[metadata.userTier as keyof typeof tierMultipliers] || 1.0;
  reward *= multiplier;

  // Apply action-specific bonuses
  switch (actionType) {
    case 'collaboration':
      // Bonus based on collaboration complexity
      if (metadata.collaborators && metadata.collaborators > 2) {
        reward += (metadata.collaborators - 2) * 20;
      }
      break;

    case 'showcase':
      // Bonus based on viral performance
      if (metadata.showcaseViews && metadata.showcaseViews > 100) {
        reward += Math.min(metadata.showcaseViews / 10, 50);
      }
      break;

    case 'upload':
      // Bonus based on revenue generated
      if (metadata.revenueGenerated && metadata.revenueGenerated > 0) {
        reward += Math.floor(metadata.revenueGenerated);
      }
      break;
  }

  return Math.floor(reward);
}

/**
 * Calculate dividend payout for a user based on token holdings
 */
export function calculateDividendPayout(
  userTokens: number,
  totalTokens: number,
  totalDividendPool: number
): number {
  if (totalTokens === 0 || userTokens === 0) return 0;
  
  const userShare = userTokens / totalTokens;
  const payout = totalDividendPool * userShare;
  
  // Minimum payout threshold (avoid tiny payouts)
  return payout >= 0.01 ? payout : 0;
}

// ============================================================================
// 📊 SHOWCASE VALIDATION & SCORING
// ============================================================================

/**
 * Validate showcase data before submission
 */
export function validateShowcaseData(showcase: {
  title: string;
  description: string;
  beforeCode: string;
  afterCode: string;
  technologies: string[];
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Title validation
  if (!showcase.title || showcase.title.length < 5 || showcase.title.length > 100) {
    errors.push('Title must be between 5 and 100 characters');
  }

  // Description validation
  if (!showcase.description || showcase.description.length < 10 || showcase.description.length > 500) {
    errors.push('Description must be between 10 and 500 characters');
  }

  // Code validation
  if (!showcase.beforeCode || showcase.beforeCode.length < 10) {
    errors.push('Before code must be at least 10 characters');
  }

  if (!showcase.afterCode || showcase.afterCode.length < 10) {
    errors.push('After code must be at least 10 characters');
  }

  // Must have some changes
  if (showcase.beforeCode === showcase.afterCode) {
    errors.push('Before and after code must be different');
  }

  // Technologies validation
  if (!showcase.technologies || showcase.technologies.length === 0) {
    errors.push('At least one technology must be specified');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Calculate improvement metrics for a showcase
 */
export function calculateShowcaseMetrics(beforeCode: string, afterCode: string): {
  complexity: number;
  performance: number;
  security: number;
  maintainability: number;
  linesReduced: number;
} {
  const beforeLines = beforeCode.split('\n').filter(line => line.trim()).length;
  const afterLines = afterCode.split('\n').filter(line => line.trim()).length;
  const linesReduced = beforeLines - afterLines;

  // Simple heuristic scoring (0-100)
  const complexity = Math.min(100, Math.max(0, 
    60 + (linesReduced > 0 ? Math.min(linesReduced * 2, 30) : -10)
  ));

  const performance = Math.min(100, Math.max(0,
    65 + (countPerformanceImprovements(beforeCode, afterCode) * 10)
  ));

  const security = Math.min(100, Math.max(0,
    70 + (countSecurityImprovements(beforeCode, afterCode) * 15)
  ));

  const maintainability = Math.min(100, Math.max(0,
    75 + (linesReduced > 0 ? 15 : 0) + (countCleanCodePractices(afterCode) * 5)
  ));

  return {
    complexity,
    performance,
    security,
    maintainability,
    linesReduced: Math.max(0, linesReduced)
  };
}

// ============================================================================
// 🔗 URL & QR CODE UTILITIES
// ============================================================================

/**
 * Generate a unique share URL for a showcase
 */
export function generateShareUrl(showcaseId: string, baseUrl: string = ''): string {
  const base = baseUrl || process.env.APP_URL || 'https://finishthisidea.com';
  return `${base}/showcase/${showcaseId}`;
}

/**
 * Generate QR code data URL for a given URL
 */
export function generateQRCodeDataURL(url: string): string {
  // In a real implementation, this would use a QR code library
  // For now, return a mock data URL
  const mockQRData = `data:image/svg+xml;base64,${Buffer.from(
    `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12">${url.substring(0, 20)}</text>
    </svg>`
  ).toString('base64')}`;
  
  return mockQRData;
}

// ============================================================================
// 📈 VIRALITY SCORING
// ============================================================================

/**
 * Calculate virality score for a showcase based on engagement
 */
export function calculateViralityScore(shareMetrics: {
  views: number;
  likes: number;
  shares: number;
  forks: number;
}): number {
  const { views, likes, shares, forks } = shareMetrics;
  
  // Weighted scoring
  const score = (
    Math.min(views / 1000, 1) * 20 +      // Views (20% max)
    Math.min(likes / 100, 1) * 30 +       // Likes (30% max)
    Math.min(shares / 50, 1) * 40 +       // Shares (40% max)
    Math.min(forks / 20, 1) * 10          // Forks (10% max)
  );
  
  return Math.round(Math.min(score, 100));
}

/**
 * Calculate user's overall virality score
 */
export function calculateUserViralityScore(userStats: {
  showcasesCreated: number;
  totalViews: number;
  totalShares: number;
  referralsGenerated: number;
  collaborationsCompleted: number;
}): number {
  const { showcasesCreated, totalViews, totalShares, referralsGenerated, collaborationsCompleted } = userStats;
  
  const score = (
    Math.min(showcasesCreated / 10, 1) * 20 +
    Math.min(totalViews / 10000, 1) * 25 +
    Math.min(totalShares / 500, 1) * 25 +
    Math.min(referralsGenerated / 20, 1) * 20 +
    Math.min(collaborationsCompleted / 10, 1) * 10
  );
  
  return Math.round(Math.min(score, 100));
}

// ============================================================================
// 🛠️ HELPER FUNCTIONS
// ============================================================================

/**
 * Count performance improvements in code
 */
function countPerformanceImprovements(beforeCode: string, afterCode: string): number {
  let improvements = 0;
  
  // Simple heuristics for performance improvements
  const performancePatterns = [
    /async\/await/g,
    /Promise\.all/g,
    /\.map\(/g,
    /\.filter\(/g,
    /const\s+/g
  ];
  
  performancePatterns.forEach(pattern => {
    const beforeMatches = (beforeCode.match(pattern) || []).length;
    const afterMatches = (afterCode.match(pattern) || []).length;
    if (afterMatches > beforeMatches) improvements++;
  });
  
  return improvements;
}

/**
 * Count security improvements in code
 */
function countSecurityImprovements(beforeCode: string, afterCode: string): number {
  let improvements = 0;
  
  // Simple heuristics for security improvements
  const securityPatterns = [
    /sanitize|escape|validate/gi,
    /try\s*{/g,
    /catch\s*\(/g
  ];
  
  securityPatterns.forEach(pattern => {
    const beforeMatches = (beforeCode.match(pattern) || []).length;
    const afterMatches = (afterCode.match(pattern) || []).length;
    if (afterMatches > beforeMatches) improvements++;
  });
  
  return improvements;
}

/**
 * Count clean code practices in code
 */
function countCleanCodePractices(code: string): number {
  let practices = 0;
  
  // Simple heuristics for clean code
  const cleanCodePatterns = [
    /\/\*\*.*?\*\//gs,  // JSDoc comments
    /\/\/.*$/gm,        // Single line comments
    /function\s+\w+/g,  // Named functions
    /const\s+\w+/g      // Const declarations
  ];
  
  cleanCodePatterns.forEach(pattern => {
    if (pattern.test(code)) practices++;
  });
  
  return practices;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format large numbers with appropriate suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Log viral event for analytics
 */
export function logViralEvent(
  eventType: string,
  userId: string,
  metadata: Record<string, any> = {}
): void {
  logger.info('Viral event logged', {
    event: eventType,
    userId,
    timestamp: new Date().toISOString(),
    ...metadata
  });
}