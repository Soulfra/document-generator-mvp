import { Request, Response, NextFunction } from 'express';
import { trustTierService, TrustTier } from '../services/trust/trust-tier.service';
import { logger } from '../utils/logger';

interface TrustTierOptions {
  feature?: keyof ReturnType<typeof trustTierService.getTierFeatures>;
  minTier?: TrustTier;
  checkValue?: (req: Request) => any;
}

/**
 * Middleware to check trust tier permissions
 */
export function trustTierCheck(options: TrustTierOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get user ID from request (from auth middleware or session)
      const userId = req.user?.id || req.body?.userId || req.query?.userId;
      
      if (!userId) {
        // For MVP, allow anonymous users with BRONZE tier restrictions
        req.trustTier = TrustTier.BRONZE;
        req.trustFeatures = trustTierService.getTierFeatures(TrustTier.BRONZE);
        return next();
      }

      // Get user's trust metrics
      const metrics = await trustTierService.getUserTrustMetrics(userId as string);
      
      // Add tier info to request
      req.trustTier = metrics.currentTier;
      req.trustFeatures = trustTierService.getTierFeatures(metrics.currentTier);
      req.trustMetrics = metrics;

      // Check specific feature permission if provided
      if (options.feature) {
        const value = options.checkValue ? options.checkValue(req) : undefined;
        const permission = await trustTierService.checkTierPermission(
          userId as string,
          options.feature,
          value
        );

        if (!permission.allowed) {
          logger.warn('Trust tier permission denied', {
            userId,
            tier: metrics.currentTier,
            feature: options.feature,
            reason: permission.reason
          });

          return res.status(403).json({
            success: false,
            error: {
              code: 'TIER_RESTRICTION',
              message: permission.reason || 'This feature is not available for your tier',
              currentTier: metrics.currentTier,
              upgradeUrl: '/upgrade' // Link to upgrade information
            }
          });
        }
      }

      // Check minimum tier requirement
      if (options.minTier) {
        const tierOrder = [TrustTier.BRONZE, TrustTier.SILVER, TrustTier.GOLD, TrustTier.PLATINUM];
        const currentIndex = tierOrder.indexOf(metrics.currentTier);
        const requiredIndex = tierOrder.indexOf(options.minTier);

        if (currentIndex < requiredIndex) {
          return res.status(403).json({
            success: false,
            error: {
              code: 'INSUFFICIENT_TIER',
              message: `This feature requires ${options.minTier} tier or higher`,
              currentTier: metrics.currentTier,
              requiredTier: options.minTier,
              upgradeUrl: '/upgrade'
            }
          });
        }
      }

      // Check for automatic tier upgrade
      const upgradeCheck = await trustTierService.checkForTierUpgrade(userId as string);
      if (upgradeCheck.shouldUpgrade && upgradeCheck.newTier) {
        logger.info('User tier auto-upgraded', {
          userId,
          from: upgradeCheck.currentTier,
          to: upgradeCheck.newTier
        });
        
        // Update request with new tier
        req.trustTier = upgradeCheck.newTier;
        req.trustFeatures = trustTierService.getTierFeatures(upgradeCheck.newTier);
      }

      next();
    } catch (error) {
      logger.error('Trust tier middleware error', { error });
      // On error, apply most restrictive tier
      req.trustTier = TrustTier.BRONZE;
      req.trustFeatures = trustTierService.getTierFeatures(TrustTier.BRONZE);
      next();
    }
  };
}

/**
 * Middleware to check rate limits based on trust tier
 */
export function trustTierRateLimit() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id || req.body?.userId || req.query?.userId;
      
      if (!userId) {
        // Anonymous users get most restrictive limits
        return next();
      }

      const rateLimit = await trustTierService.checkRateLimits(userId as string);
      
      if (!rateLimit.allowed) {
        logger.warn('Trust tier rate limit exceeded', {
          userId,
          reason: rateLimit.reason
        });

        return res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: rateLimit.reason || 'Rate limit exceeded',
            resetAt: rateLimit.resetAt,
            upgradeUrl: '/upgrade'
          }
        });
      }

      // Add rate limit info to response headers
      if (rateLimit.remaining !== undefined) {
        res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
      }
      if (rateLimit.resetAt) {
        res.setHeader('X-RateLimit-Reset', rateLimit.resetAt.toISOString());
      }

      next();
    } catch (error) {
      logger.error('Trust tier rate limit error', { error });
      next();
    }
  };
}

/**
 * Middleware to validate file upload based on trust tier
 */
export function trustTierFileValidation() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return next();
      }

      const userId = req.user?.id || req.body?.userId || req.query?.userId;
      const tier = req.trustTier || TrustTier.BRONZE;
      const features = trustTierService.getTierFeatures(tier);

      // Check file size
      const fileSizeMB = req.file.size / (1024 * 1024);
      if (fileSizeMB > features.maxFileSize) {
        return res.status(413).json({
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: `File size ${fileSizeMB.toFixed(2)}MB exceeds ${tier} tier limit of ${features.maxFileSize}MB`,
            currentTier: tier,
            upgradeUrl: '/upgrade'
          }
        });
      }

      // Check file type
      const fileExt = req.file.originalname.toLowerCase().match(/\.[^.]+$/)?.[0];
      if (fileExt && !features.allowedFileTypes.includes(fileExt)) {
        return res.status(415).json({
          success: false,
          error: {
            code: 'FILE_TYPE_NOT_ALLOWED',
            message: `File type ${fileExt} is not allowed for ${tier} tier`,
            allowedTypes: features.allowedFileTypes,
            currentTier: tier,
            upgradeUrl: '/upgrade'
          }
        });
      }

      next();
    } catch (error) {
      logger.error('Trust tier file validation error', { error });
      next();
    }
  };
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      trustTier?: TrustTier;
      trustFeatures?: ReturnType<typeof trustTierService.getTierFeatures>;
      trustMetrics?: Awaited<ReturnType<typeof trustTierService.getUserTrustMetrics>>;
    }
  }
}