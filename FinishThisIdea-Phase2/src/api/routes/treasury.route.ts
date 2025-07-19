import { Router } from 'express';
import { treasuryService } from '../../services/treasury.service';
import { logger } from '../../utils/logger';
import { presenceLogger } from '../../monitoring/presence-logger';

const router = Router();

/**
 * GET /api/treasury/stats
 * Get platform revenue and token statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await treasuryService.getPlatformStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get treasury stats', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get treasury statistics'
    });
  }
});

/**
 * GET /api/treasury/earnings/:userId
 * Get user earnings, tokens, and ownership information
 */
router.get('/earnings/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const earnings = await treasuryService.getUserEarnings(userId);
    
    // Log earnings query
    await presenceLogger.logUserPresence('earnings_viewed', {
      sessionId: req.sessionID,
      userId,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      metadata: {
        tokensHeld: earnings.tokensHeld,
        totalEarnings: earnings.totalEarnings
      }
    });

    res.json({
      success: true,
      data: earnings
    });
  } catch (error) {
    logger.error('Failed to get user earnings', { error, userId: req.params.userId });
    res.status(500).json({
      success: false,
      error: 'Failed to get user earnings'
    });
  }
});

/**
 * POST /api/treasury/revenue
 * Add revenue to platform (internal endpoint)
 */
router.post('/revenue', async (req, res) => {
  try {
    const { amount, source = 'usage', userId = 'anonymous', metadata = {} } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    const result = await treasuryService.addRevenue(amount, {
      source,
      userId,
      metadata: {
        ...metadata,
        sessionId: req.sessionID,
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip
      }
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to add revenue', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: 'Failed to add revenue'
    });
  }
});

/**
 * POST /api/treasury/tokens/award
 * Award achievement tokens to user
 */
router.post('/tokens/award', async (req, res) => {
  try {
    const { userId, achievement, tokens } = req.body;
    
    if (!userId || !achievement || !tokens || tokens <= 0) {
      return res.status(400).json({
        success: false,
        error: 'userId, achievement, and tokens are required'
      });
    }

    const result = await treasuryService.awardAchievementTokens(userId, achievement, tokens);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to award tokens', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: 'Failed to award tokens'
    });
  }
});

/**
 * POST /api/treasury/dividends/distribute
 * Manually trigger dividend distribution (admin endpoint)
 */
router.post('/dividends/distribute', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    const result = await treasuryService.distributeDividends(amount);

    // Log dividend distribution
    await presenceLogger.logUserPresence('dividends_distributed', {
      sessionId: req.sessionID,
      userId: 'admin',
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      metadata: {
        amount,
        holdersCount: result.holders,
        totalDistributed: result.distributed
      }
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to distribute dividends', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: 'Failed to distribute dividends'
    });
  }
});

/**
 * GET /api/treasury/leaderboard
 * Get top token holders and earners
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const type = req.query.type as string || 'tokens';

    let leaderboard: any[] = [];

    try {
      if (type === 'tokens') {
        const users = await (global as any).prisma?.user.findMany({
          where: {
            platformTokens: { gt: 0 }
          },
          select: {
            id: true,
            name: true,
            platformTokens: true
          },
          orderBy: {
            platformTokens: 'desc'
          },
          take: limit
        });
        
        leaderboard = users || [];
      } else if (type === 'earnings') {
        const users = await (global as any).prisma?.user.findMany({
          where: {
            totalEarnings: { gt: 0 }
          },
          select: {
            id: true,
            name: true,
            totalEarnings: true,
            referralEarnings: true
          },
          orderBy: {
            totalEarnings: 'desc'
          },
          take: limit
        });
        
        leaderboard = users || [];
      }
    } catch (error) {
      logger.warn('Cannot fetch leaderboard from database', { error: error.message });
    }

    res.json({
      success: true,
      data: {
        type,
        leaderboard,
        count: leaderboard.length
      }
    });
  } catch (error) {
    logger.error('Failed to get leaderboard', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard'
    });
  }
});

/**
 * POST /api/treasury/payment/process
 * Process a payment and update treasury
 */
router.post('/payment/process', async (req, res) => {
  try {
    const { amount, userId, metadata = {} } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    const result = await treasuryService.processPayment(amount, userId || 'anonymous', {
      ...metadata,
      sessionId: req.sessionID,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to process payment', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: 'Failed to process payment'
    });
  }
});

/**
 * GET /api/treasury/earnings
 * Get current user earnings (uses session)
 */
router.get('/earnings', async (req, res) => {
  try {
    const userId = req.session?.userId || 'anonymous';
    const earnings = await treasuryService.getUserEarnings(userId);
    
    res.json({
      success: true,
      data: earnings
    });
  } catch (error) {
    logger.error('Failed to get current user earnings', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get earnings'
    });
  }
});

/**
 * POST /api/treasury/referral
 * Process referral revenue
 */
router.post('/referral', async (req, res) => {
  try {
    const { amount, referrerId, newUserId, metadata = {} } = req.body;
    
    if (!amount || !referrerId || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount and referrerId are required'
      });
    }

    const result = await treasuryService.addRevenue(amount, {
      source: 'referral',
      userId: newUserId || 'anonymous',
      metadata: {
        ...metadata,
        referrerId,
        sessionId: req.sessionID,
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Failed to process referral', { error, body: req.body });
    res.status(500).json({
      success: false,
      error: 'Failed to process referral'
    });
  }
});

export default router;