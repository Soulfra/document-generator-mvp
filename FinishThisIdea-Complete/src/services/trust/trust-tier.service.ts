import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import { platformLogger } from '../monitoring/platform-logger.service';
import { cleanupMemory } from '../memory/cleanup-memory.service';

const serviceLogger = platformLogger.createServiceLogger('trust-tier-service');

export enum TrustTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM'
}

interface TierFeatures {
  maxFileSize: number; // in MB
  maxFilesPerUpload: number;
  allowedFileTypes: string[];
  maxJobsPerDay: number;
  maxJobsPerMonth: number;
  allowClaude: boolean;
  allowBulkOperations: boolean;
  allowAdvancedFeatures: boolean;
  backupRetentionDays: number;
  priorityProcessing: boolean;
  customProfiles: number;
}

interface UserTrustMetrics {
  userId: string;
  currentTier: TrustTier;
  totalJobs: number;
  successfulJobs: number;
  failedJobs: number;
  successRate: number;
  totalSpent: number;
  accountAge: number; // in days
  violations: number;
  lastViolation?: Date;
}

const TIER_FEATURES: Record<TrustTier, TierFeatures> = {
  [TrustTier.BRONZE]: {
    maxFileSize: 10, // 10MB
    maxFilesPerUpload: 50,
    allowedFileTypes: ['.zip', '.tar.gz'],
    maxJobsPerDay: 5,
    maxJobsPerMonth: 50,
    allowClaude: false,
    allowBulkOperations: false,
    allowAdvancedFeatures: false,
    backupRetentionDays: 7,
    priorityProcessing: false,
    customProfiles: 1
  },
  [TrustTier.SILVER]: {
    maxFileSize: 25, // 25MB
    maxFilesPerUpload: 200,
    allowedFileTypes: ['.zip', '.tar.gz', '.tgz'],
    maxJobsPerDay: 20,
    maxJobsPerMonth: 200,
    allowClaude: true,
    allowBulkOperations: false,
    allowAdvancedFeatures: true,
    backupRetentionDays: 14,
    priorityProcessing: false,
    customProfiles: 3
  },
  [TrustTier.GOLD]: {
    maxFileSize: 50, // 50MB
    maxFilesPerUpload: 500,
    allowedFileTypes: ['.zip', '.tar.gz', '.tgz', '.7z'],
    maxJobsPerDay: 50,
    maxJobsPerMonth: 500,
    allowClaude: true,
    allowBulkOperations: true,
    allowAdvancedFeatures: true,
    backupRetentionDays: 30,
    priorityProcessing: true,
    customProfiles: 10
  },
  [TrustTier.PLATINUM]: {
    maxFileSize: 100, // 100MB
    maxFilesPerUpload: 1000,
    allowedFileTypes: ['.zip', '.tar.gz', '.tgz', '.7z', '.rar'],
    maxJobsPerDay: -1, // unlimited
    maxJobsPerMonth: -1, // unlimited
    allowClaude: true,
    allowBulkOperations: true,
    allowAdvancedFeatures: true,
    backupRetentionDays: 90,
    priorityProcessing: true,
    customProfiles: -1 // unlimited
  }
};

// Tier progression requirements
const TIER_REQUIREMENTS = {
  [TrustTier.SILVER]: {
    minJobs: 5,
    minSuccessRate: 0.8,
    minSpent: 5,
    minAccountAge: 7,
    maxViolations: 2
  },
  [TrustTier.GOLD]: {
    minJobs: 20,
    minSuccessRate: 0.9,
    minSpent: 20,
    minAccountAge: 30,
    maxViolations: 1
  },
  [TrustTier.PLATINUM]: {
    minJobs: 100,
    minSuccessRate: 0.95,
    minSpent: 100,
    minAccountAge: 90,
    maxViolations: 0
  }
};

export class TrustTierService {
  /**
   * Get user's current trust metrics
   */
  async getUserTrustMetrics(userId: string): Promise<UserTrustMetrics> {
    try {
      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          jobs: {
            select: {
              status: true,
              createdAt: true,
              payment: {
                select: {
                  amount: true,
                  status: true
                }
              }
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate metrics
      const totalJobs = user.jobs.length;
      const successfulJobs = user.jobs.filter(j => j.status === 'COMPLETED').length;
      const failedJobs = user.jobs.filter(j => j.status === 'FAILED').length;
      const successRate = totalJobs > 0 ? successfulJobs / totalJobs : 0;
      
      const totalSpent = user.jobs.reduce((sum, job) => {
        if (job.payment?.status === 'SUCCEEDED') {
          return sum + (job.payment.amount / 100); // Convert cents to dollars
        }
        return sum;
      }, 0);

      const accountAge = Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Get violations from metadata
      const userMetadata = user.metadata as any || {};
      const violations = userMetadata.violations || 0;
      const lastViolation = userMetadata.lastViolation ? 
        new Date(userMetadata.lastViolation) : undefined;

      // Determine current tier
      const currentTier = await this.calculateUserTier({
        totalJobs,
        successRate,
        totalSpent,
        accountAge,
        violations
      });

      return {
        userId,
        currentTier,
        totalJobs,
        successfulJobs,
        failedJobs,
        successRate,
        totalSpent,
        accountAge,
        violations,
        lastViolation
      };

    } catch (error) {
      serviceLogger.error(error, { userId, operation: 'get-trust-metrics' });
      throw error;
    }
  }

  /**
   * Calculate user's tier based on metrics
   */
  private async calculateUserTier(metrics: {
    totalJobs: number;
    successRate: number;
    totalSpent: number;
    accountAge: number;
    violations: number;
  }): Promise<TrustTier> {
    // Check for platinum eligibility
    const platinumReqs = TIER_REQUIREMENTS[TrustTier.PLATINUM];
    if (
      metrics.totalJobs >= platinumReqs.minJobs &&
      metrics.successRate >= platinumReqs.minSuccessRate &&
      metrics.totalSpent >= platinumReqs.minSpent &&
      metrics.accountAge >= platinumReqs.minAccountAge &&
      metrics.violations <= platinumReqs.maxViolations
    ) {
      return TrustTier.PLATINUM;
    }

    // Check for gold eligibility
    const goldReqs = TIER_REQUIREMENTS[TrustTier.GOLD];
    if (
      metrics.totalJobs >= goldReqs.minJobs &&
      metrics.successRate >= goldReqs.minSuccessRate &&
      metrics.totalSpent >= goldReqs.minSpent &&
      metrics.accountAge >= goldReqs.minAccountAge &&
      metrics.violations <= goldReqs.maxViolations
    ) {
      return TrustTier.GOLD;
    }

    // Check for silver eligibility
    const silverReqs = TIER_REQUIREMENTS[TrustTier.SILVER];
    if (
      metrics.totalJobs >= silverReqs.minJobs &&
      metrics.successRate >= silverReqs.minSuccessRate &&
      metrics.totalSpent >= silverReqs.minSpent &&
      metrics.accountAge >= silverReqs.minAccountAge &&
      metrics.violations <= silverReqs.maxViolations
    ) {
      return TrustTier.SILVER;
    }

    // Default to bronze
    return TrustTier.BRONZE;
  }

  /**
   * Check if user can perform an action based on their tier
   */
  async checkTierPermission(
    userId: string, 
    feature: keyof TierFeatures,
    value?: any
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const metrics = await this.getUserTrustMetrics(userId);
      const tierFeatures = TIER_FEATURES[metrics.currentTier];

      // Check boolean features
      if (typeof tierFeatures[feature] === 'boolean') {
        const allowed = tierFeatures[feature] as boolean;
        if (!allowed) {
          return {
            allowed: false,
            reason: `This feature requires ${this.getRequiredTierForFeature(feature)} tier or higher`
          };
        }
        return { allowed: true };
      }

      // Check numeric limits
      if (typeof tierFeatures[feature] === 'number' && value !== undefined) {
        const limit = tierFeatures[feature] as number;
        
        // -1 means unlimited
        if (limit === -1) {
          return { allowed: true };
        }

        if (value > limit) {
          return {
            allowed: false,
            reason: `Your ${metrics.currentTier} tier allows up to ${limit} for this feature`
          };
        }
        return { allowed: true };
      }

      // Check array features (like allowed file types)
      if (Array.isArray(tierFeatures[feature]) && value !== undefined) {
        const allowedValues = tierFeatures[feature] as string[];
        if (!allowedValues.includes(value)) {
          return {
            allowed: false,
            reason: `Your ${metrics.currentTier} tier doesn't support ${value}`
          };
        }
        return { allowed: true };
      }

      return { allowed: true };

    } catch (error) {
      serviceLogger.error(error, { userId, feature, operation: 'check-permission' });
      // Default to most restrictive on error
      return {
        allowed: false,
        reason: 'Unable to verify permissions at this time'
      };
    }
  }

  /**
   * Check rate limits for user
   */
  async checkRateLimits(userId: string): Promise<{ 
    allowed: boolean; 
    remaining?: number;
    resetAt?: Date;
    reason?: string;
  }> {
    try {
      const metrics = await this.getUserTrustMetrics(userId);
      const features = TIER_FEATURES[metrics.currentTier];

      // Check daily limit
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const jobsToday = await prisma.job.count({
        where: {
          userId,
          createdAt: {
            gte: today
          }
        }
      });

      if (features.maxJobsPerDay !== -1 && jobsToday >= features.maxJobsPerDay) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return {
          allowed: false,
          remaining: 0,
          resetAt: tomorrow,
          reason: `Daily limit of ${features.maxJobsPerDay} jobs reached for ${metrics.currentTier} tier`
        };
      }

      // Check monthly limit
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const jobsThisMonth = await prisma.job.count({
        where: {
          userId,
          createdAt: {
            gte: startOfMonth
          }
        }
      });

      if (features.maxJobsPerMonth !== -1 && jobsThisMonth >= features.maxJobsPerMonth) {
        const nextMonth = new Date(startOfMonth);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        return {
          allowed: false,
          remaining: 0,
          resetAt: nextMonth,
          reason: `Monthly limit of ${features.maxJobsPerMonth} jobs reached for ${metrics.currentTier} tier`
        };
      }

      return {
        allowed: true,
        remaining: features.maxJobsPerDay === -1 ? 
          undefined : features.maxJobsPerDay - jobsToday
      };

    } catch (error) {
      serviceLogger.error(error, { userId, operation: 'check-rate-limits' });
      return {
        allowed: false,
        reason: 'Unable to verify rate limits at this time'
      };
    }
  }

  /**
   * Record a violation for a user
   */
  async recordViolation(
    userId: string, 
    type: string, 
    description: string
  ): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) return;

      const metadata = user.metadata as any || {};
      const violations = (metadata.violations || 0) + 1;

      await prisma.user.update({
        where: { id: userId },
        data: {
          metadata: {
            ...metadata,
            violations,
            lastViolation: new Date().toISOString(),
            violationHistory: [
              ...(metadata.violationHistory || []),
              {
                type,
                description,
                timestamp: new Date().toISOString()
              }
            ]
          }
        }
      });

      // Log to memory system
      await cleanupMemory.logThought({
        userId,
        eventType: 'violation',
        reasoning: {
          intent: 'User violation recorded',
          confidence: 1.0,
          decisionPath: ['Violation detected', 'Recorded in user metadata'],
          alternativesConsidered: []
        },
        context: {
          violationType: type,
          description,
          totalViolations: violations
        }
      });

      serviceLogger.warn('User violation recorded', {
        userId,
        type,
        description,
        totalViolations: violations
      });

    } catch (error) {
      serviceLogger.error(error, { userId, type, operation: 'record-violation' });
    }
  }

  /**
   * Get tier features for display
   */
  getTierFeatures(tier: TrustTier): TierFeatures {
    return TIER_FEATURES[tier];
  }

  /**
   * Get all tier information
   */
  getAllTiers() {
    return Object.entries(TIER_FEATURES).map(([tier, features]) => ({
      tier,
      features,
      requirements: TIER_REQUIREMENTS[tier as keyof typeof TIER_REQUIREMENTS]
    }));
  }

  /**
   * Get required tier for a feature
   */
  private getRequiredTierForFeature(feature: keyof TierFeatures): TrustTier {
    // Find the lowest tier that has this feature enabled
    const tiers = [TrustTier.BRONZE, TrustTier.SILVER, TrustTier.GOLD, TrustTier.PLATINUM];
    
    for (const tier of tiers) {
      const tierFeatures = TIER_FEATURES[tier];
      if (typeof tierFeatures[feature] === 'boolean' && tierFeatures[feature]) {
        return tier;
      }
    }
    
    return TrustTier.PLATINUM;
  }

  /**
   * Check if user should be upgraded
   */
  async checkForTierUpgrade(userId: string): Promise<{
    shouldUpgrade: boolean;
    newTier?: TrustTier;
    currentTier: TrustTier;
  }> {
    try {
      const metrics = await this.getUserTrustMetrics(userId);
      const calculatedTier = await this.calculateUserTier({
        totalJobs: metrics.totalJobs,
        successRate: metrics.successRate,
        totalSpent: metrics.totalSpent,
        accountAge: metrics.accountAge,
        violations: metrics.violations
      });

      const tierOrder = [TrustTier.BRONZE, TrustTier.SILVER, TrustTier.GOLD, TrustTier.PLATINUM];
      const currentIndex = tierOrder.indexOf(metrics.currentTier);
      const calculatedIndex = tierOrder.indexOf(calculatedTier);

      if (calculatedIndex > currentIndex) {
        // Log the upgrade
        await cleanupMemory.logThought({
          userId,
          eventType: 'tier-upgrade',
          reasoning: {
            intent: 'User tier upgraded based on metrics',
            confidence: 1.0,
            decisionPath: ['Metrics evaluated', 'Tier requirements met', 'Upgrade approved'],
            alternativesConsidered: []
          },
          learning: {
            newPatterns: [`User upgraded from ${metrics.currentTier} to ${calculatedTier}`],
            improvementNotes: [`Success rate: ${metrics.successRate}, Total spent: $${metrics.totalSpent}`]
          }
        });

        return {
          shouldUpgrade: true,
          newTier: calculatedTier,
          currentTier: metrics.currentTier
        };
      }

      return {
        shouldUpgrade: false,
        currentTier: metrics.currentTier
      };

    } catch (error) {
      serviceLogger.error(error, { userId, operation: 'check-tier-upgrade' });
      return {
        shouldUpgrade: false,
        currentTier: TrustTier.BRONZE
      };
    }
  }
}

// Export singleton instance
export const trustTierService = new TrustTierService();