import express from 'express';
import { asyncHandler } from '../../utils/async-handler';
import { trustTierService } from '../../services/trust/trust-tier.service';
import { logger } from '../../utils/logger';
import { prisma } from '../../utils/database';

const router = express.Router();

// Get all tier information
router.get('/tiers', asyncHandler(async (req, res) => {
  const tiers = trustTierService.getAllTiers();
  
  res.json({
    success: true,
    data: {
      tiers,
      description: 'Trust tiers provide progressive access to features based on usage history and reliability'
    }
  });
}));

// Get user's current tier and metrics
router.get('/my-tier', asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.query.userId as string;
  
  if (!userId) {
    return res.json({
      success: true,
      data: {
        tier: 'BRONZE',
        message: 'Anonymous users have BRONZE tier access',
        features: trustTierService.getTierFeatures('BRONZE' as any)
      }
    });
  }

  try {
    const metrics = await trustTierService.getUserTrustMetrics(userId);
    const features = trustTierService.getTierFeatures(metrics.currentTier);
    
    // Check for potential upgrade
    const upgradeCheck = await trustTierService.checkForTierUpgrade(userId);
    
    // Get progress to next tier
    const nextTierProgress = await calculateNextTierProgress(metrics);
    
    res.json({
      success: true,
      data: {
        currentTier: metrics.currentTier,
        metrics: {
          totalJobs: metrics.totalJobs,
          successRate: Math.round(metrics.successRate * 100),
          totalSpent: metrics.totalSpent,
          accountAge: metrics.accountAge,
          violations: metrics.violations
        },
        features,
        nextTierProgress,
        canUpgrade: upgradeCheck.shouldUpgrade,
        upgradeToTier: upgradeCheck.newTier
      }
    });
  } catch (error) {
    logger.error('Failed to get user tier', { error, userId });
    res.status(500).json({
      success: false,
      error: {
        code: 'TIER_LOOKUP_FAILED',
        message: 'Failed to retrieve tier information'
      }
    });
  }
}));

// Check specific permission
router.post('/check-permission', asyncHandler(async (req, res) => {
  const { feature, value } = req.body;
  const userId = req.user?.id || req.body.userId;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'USER_ID_REQUIRED',
        message: 'User ID is required'
      }
    });
  }

  if (!feature) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'FEATURE_REQUIRED',
        message: 'Feature name is required'
      }
    });
  }

  const permission = await trustTierService.checkTierPermission(userId, feature, value);
  
  res.json({
    success: true,
    data: permission
  });
}));

// Check rate limits
router.get('/rate-limits', asyncHandler(async (req, res) => {
  const userId = req.user?.id || req.query.userId as string;
  
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'USER_ID_REQUIRED',
        message: 'User ID is required'
      }
    });
  }

  const rateLimit = await trustTierService.checkRateLimits(userId);
  const metrics = await trustTierService.getUserTrustMetrics(userId);
  const features = trustTierService.getTierFeatures(metrics.currentTier);
  
  res.json({
    success: true,
    data: {
      allowed: rateLimit.allowed,
      limits: {
        daily: features.maxJobsPerDay === -1 ? 'unlimited' : features.maxJobsPerDay,
        monthly: features.maxJobsPerMonth === -1 ? 'unlimited' : features.maxJobsPerMonth,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt
      },
      currentTier: metrics.currentTier
    }
  });
}));

// Simulate tier for testing (admin only)
router.post('/simulate-tier', asyncHandler(async (req, res) => {
  // This should be admin-only in production
  const { userId, tier } = req.body;
  
  if (!userId || !tier) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PARAMS',
        message: 'userId and tier are required'
      }
    });
  }

  // For testing, we'll update the user's metadata to simulate tier
  await prisma.user.update({
    where: { id: userId },
    data: {
      metadata: {
        simulatedTier: tier,
        simulatedAt: new Date().toISOString()
      }
    }
  });

  res.json({
    success: true,
    data: {
      message: `User ${userId} tier simulated as ${tier}`,
      note: 'This is for testing only and will be removed in production'
    }
  });
}));

// Helper function to calculate progress to next tier
async function calculateNextTierProgress(metrics: any): Promise<any> {
  const tierOrder = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  const currentIndex = tierOrder.indexOf(metrics.currentTier);
  
  if (currentIndex === tierOrder.length - 1) {
    return {
      nextTier: null,
      message: 'You have reached the highest tier!',
      progress: 100
    };
  }

  const nextTier = tierOrder[currentIndex + 1];
  const requirements = {
    SILVER: {
      minJobs: 5,
      minSuccessRate: 0.8,
      minSpent: 5,
      minAccountAge: 7,
      maxViolations: 2
    },
    GOLD: {
      minJobs: 20,
      minSuccessRate: 0.9,
      minSpent: 20,
      minAccountAge: 30,
      maxViolations: 1
    },
    PLATINUM: {
      minJobs: 100,
      minSuccessRate: 0.95,
      minSpent: 100,
      minAccountAge: 90,
      maxViolations: 0
    }
  };

  const nextReqs = requirements[nextTier as keyof typeof requirements];
  if (!nextReqs) return null;

  // Calculate progress for each requirement
  const progress = {
    jobs: Math.min(100, (metrics.totalJobs / nextReqs.minJobs) * 100),
    successRate: Math.min(100, (metrics.successRate / nextReqs.minSuccessRate) * 100),
    spent: Math.min(100, (metrics.totalSpent / nextReqs.minSpent) * 100),
    accountAge: Math.min(100, (metrics.accountAge / nextReqs.minAccountAge) * 100),
    violations: metrics.violations <= nextReqs.maxViolations ? 100 : 0
  };

  const overallProgress = Object.values(progress).reduce((a, b) => a + b, 0) / 5;

  return {
    nextTier,
    requirements: nextReqs,
    progress: progress,
    overallProgress: Math.round(overallProgress),
    missing: Object.entries(progress)
      .filter(([_, value]) => value < 100)
      .map(([key]) => key)
  };
}

export { router as trustTierRouter };