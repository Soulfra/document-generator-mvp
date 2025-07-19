/**
 * PROGRESSIVE PRICING SERVICE
 * 
 * Handles the $1 → $5 → $25 → Enterprise tier progression
 * Integrates with existing Stripe setup and viral token economics
 */

import Stripe from 'stripe';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { treasuryService } from './viral/treasury.service';
import { presenceLogger } from '../monitoring/presence-logger';
import { PaymentError, NotFoundError } from '../utils/errors';
import { apiKeyManagementService } from './api-key-management.service';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// ============================================================================
// 🎯 PRICING TIER DEFINITIONS
// ============================================================================

export interface PricingTier {
  id: string;
  name: string;
  price: number; // in cents
  originalPrice?: number; // for showing savings
  description: string;
  features: string[];
  limits: {
    filesPerMonth: number;
    fileSizeLimit: number; // in MB
    agentsAllowed: number;
    collaborationsPerMonth: number;
    showcasesPerMonth: number;
    apiCallsPerMonth: number;
    supportLevel: 'community' | 'email' | 'priority' | 'white-glove';
  };
  viralBenefits: {
    tokenMultiplier: number;
    referralBonus: number;
    dividendRate: number;
    earlyAccess: boolean;
  };
  stripeProductId?: string;
  stripePriceId?: string;
}

export const PRICING_TIERS: Record<string, PricingTier> = {
  cleanup: {
    id: 'cleanup',
    name: '🧹 Quick Cleanup',
    price: 100, // $1.00
    description: 'AI-powered cleanup of a single codebase',
    features: [
      'One-time codebase cleanup',
      'Basic code analysis',
      'Ollama-powered improvements',
      'Download cleaned files',
      'Community support'
    ],
    limits: {
      filesPerMonth: 1,
      fileSizeLimit: 10,
      agentsAllowed: 0,
      collaborationsPerMonth: 0,
      showcasesPerMonth: 1,
      apiCallsPerMonth: 10,
      supportLevel: 'community'
    },
    viralBenefits: {
      tokenMultiplier: 1.0,
      referralBonus: 25,
      dividendRate: 0.1,
      earlyAccess: false
    }
  },

  developer: {
    id: 'developer',
    name: '⚡ Developer Pack',
    price: 500, // $5.00
    originalPrice: 800, // Show $3 savings
    description: 'Perfect for active developers with multiple projects',
    features: [
      'Up to 10 projects per month',
      'Advanced AI analysis (Claude)',
      'Custom context profiles',
      'Agent marketplace access',
      'Project showcase features',
      'Email support'
    ],
    limits: {
      filesPerMonth: 10,
      fileSizeLimit: 50,
      agentsAllowed: 3,
      collaborationsPerMonth: 5,
      showcasesPerMonth: 10,
      apiCallsPerMonth: 500,
      supportLevel: 'email'
    },
    viralBenefits: {
      tokenMultiplier: 1.2,
      referralBonus: 50,
      dividendRate: 0.2,
      earlyAccess: true
    }
  },

  team: {
    id: 'team',
    name: '🚀 Team Accelerator',
    price: 2500, // $25.00
    originalPrice: 4000, // Show $15 savings
    description: 'Supercharge your entire team with AI collaboration',
    features: [
      'Unlimited projects',
      'Team collaboration tools',
      'AI agent creation & sharing',
      'Advanced analytics dashboard',
      'Priority AI routing',
      'Custom integrations',
      'Priority support'
    ],
    limits: {
      filesPerMonth: 100,
      fileSizeLimit: 500,
      agentsAllowed: 25,
      collaborationsPerMonth: 50,
      showcasesPerMonth: 50,
      apiCallsPerMonth: 5000,
      supportLevel: 'priority'
    },
    viralBenefits: {
      tokenMultiplier: 1.5,
      referralBonus: 100,
      dividendRate: 0.25,
      earlyAccess: true
    }
  },

  enterprise: {
    id: 'enterprise',
    name: '🏢 Enterprise',
    price: 0, // Custom pricing
    description: 'Custom solution for large organizations',
    features: [
      'Everything in Team Accelerator',
      'White-label deployment',
      'Custom AI model training',
      'Dedicated infrastructure',
      'SLA guarantees',
      'On-premise deployment option',
      'White-glove support'
    ],
    limits: {
      filesPerMonth: -1, // Unlimited
      fileSizeLimit: -1, // Unlimited
      agentsAllowed: -1, // Unlimited
      collaborationsPerMonth: -1, // Unlimited
      showcasesPerMonth: -1, // Unlimited
      apiCallsPerMonth: -1, // Unlimited
      supportLevel: 'white-glove'
    },
    viralBenefits: {
      tokenMultiplier: 2.0,
      referralBonus: 500,
      dividendRate: 0.3,
      earlyAccess: true
    }
  }
};

// ============================================================================
// 📊 PRICING LOGIC & RECOMMENDATIONS
// ============================================================================

export class PricingService {
  
  /**
   * Get recommended tier based on user's usage patterns
   */
  async getRecommendedTier(userId: string): Promise<string> {
    try {
      // Get user's historical usage
      const userJobs = await prisma.job.count({
        where: { 
          // Add userId field to jobs in the future
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      });

      // Get user's viral activity if they exist
      let userAgent: any = null;
      try {
        userAgent = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            agents: true,
            showcases: true,
            collaborations: true
          }
        });
      } catch (error) {
        // User doesn't exist in viral system yet
      }

      // Recommendation logic
      if (!userAgent || userJobs <= 1) {
        return 'cleanup'; // New users start with cleanup
      }

      if (userJobs <= 5 && (!userAgent.agents || userAgent.agents.length === 0)) {
        return 'developer'; // Light usage
      }

      if (userJobs <= 20 || (userAgent.agents && userAgent.agents.length <= 10)) {
        return 'team'; // Regular usage
      }

      return 'enterprise'; // Heavy usage

    } catch (error) {
      logger.error('Error getting recommended tier', { error, userId });
      return 'cleanup'; // Default to entry tier
    }
  }

  /**
   * Calculate savings when upgrading to a tier
   */
  calculateSavings(fromTier: string, toTier: string, monthlyUsage: number): number {
    const fromPrice = PRICING_TIERS[fromTier]?.price || 0;
    const toPrice = PRICING_TIERS[toTier]?.price || 0;
    
    // Calculate monthly cost at current tier vs new tier
    const currentMonthlyCost = fromPrice * monthlyUsage;
    const newMonthlyCost = toPrice;
    
    return Math.max(0, currentMonthlyCost - newMonthlyCost);
  }

  /**
   * Get pricing tiers with personalized recommendations
   */
  async getPricingDisplay(userId?: string): Promise<{
    tiers: PricingTier[];
    recommended?: string;
    savings?: Record<string, number>;
    currentTier?: string;
  }> {
    const tiers = Object.values(PRICING_TIERS);
    let recommended: string | undefined;
    let savings: Record<string, number> | undefined;
    let currentTier: string | undefined;

    if (userId) {
      recommended = await this.getRecommendedTier(userId);
      
      // Calculate potential savings
      savings = {};
      const userJobs = await prisma.job.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      });

      Object.keys(PRICING_TIERS).forEach(tierId => {
        savings![tierId] = this.calculateSavings('cleanup', tierId, userJobs);
      });

      // Determine current tier (simplified)
      currentTier = userJobs > 10 ? 'team' : userJobs > 1 ? 'developer' : 'cleanup';
    }

    return { tiers, recommended, savings, currentTier };
  }
}

// ============================================================================
// 💳 ENHANCED CHECKOUT SESSION CREATION
// ============================================================================

export interface CheckoutSessionOptions {
  jobId?: string;
  tierId: string;
  userId?: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export async function createTieredCheckoutSession(options: CheckoutSessionOptions): Promise<{
  sessionId: string;
  url: string;
  tierId: string;
  price: number;
}> {
  try {
    const { tierId, jobId, userId, successUrl, cancelUrl, metadata = {} } = options;
    
    const tier = PRICING_TIERS[tierId];
    if (!tier) {
      throw new PaymentError(`Invalid tier: ${tierId}`);
    }

    // Handle enterprise tier
    if (tierId === 'enterprise') {
      throw new PaymentError('Enterprise pricing requires custom quote. Please contact sales.');
    }

    // For cleanup tier, verify job exists
    if (tierId === 'cleanup' && jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { payment: true },
      });

      if (!job) {
        throw new NotFoundError('Job not found');
      }

      if (job.payment && job.payment.status === 'SUCCEEDED') {
        throw new PaymentError('Job already paid');
      }
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: tier.name,
              description: tier.description,
              images: [], // Add tier-specific images
            },
            unit_amount: tier.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel`,
      metadata: {
        tierId,
        jobId: jobId || '',
        userId: userId || '',
        ...metadata
      },
      customer_email: undefined, // No account required for MVP
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });

    // Update job with session ID if applicable
    if (jobId) {
      await prisma.job.update({
        where: { id: jobId },
        data: { stripeSessionId: session.id },
      });

      // Create or update payment record
      await prisma.payment.upsert({
        where: { jobId },
        create: {
          jobId,
          stripePaymentIntentId: session.payment_intent as string || null,
          amount: tier.price,
          currency: 'usd',
          status: 'PENDING',
        },
        update: {
          stripePaymentIntentId: session.payment_intent as string || null,
          status: 'PENDING',
          amount: tier.price,
        },
      });
    }

    // Log the checkout session creation
    await presenceLogger.logUserPresence('checkout_created', {
      userId: userId || 'anonymous',
      metadata: {
        tierId,
        price: tier.price,
        sessionId: session.id,
        jobId
      }
    });

    logger.info('Tiered checkout session created', {
      tierId,
      sessionId: session.id,
      price: tier.price,
      jobId,
      userId
    });

    return {
      sessionId: session.id,
      url: session.url || '',
      tierId,
      price: tier.price
    };

  } catch (error) {
    logger.error('Failed to create tiered checkout session', { options, error });
    
    if (error instanceof Stripe.errors.StripeError) {
      throw new PaymentError(`Payment setup failed: ${error.message}`);
    }
    
    throw error;
  }
}

// ============================================================================
// 🎉 ENHANCED WEBHOOK HANDLING WITH VIRAL FEATURES
// ============================================================================

export async function handleTieredCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const { tierId, jobId, userId } = session.metadata || {};
  
  if (!tierId) {
    logger.error('No tierId in session metadata', { sessionId: session.id });
    return;
  }

  const tier = PRICING_TIERS[tierId];
  if (!tier) {
    logger.error('Invalid tier in session metadata', { tierId, sessionId: session.id });
    return;
  }

  logger.info('Tiered checkout completed', { tierId, jobId, userId, sessionId: session.id });

  try {
    // Update payment status
    if (jobId) {
      await prisma.payment.update({
        where: { jobId },
        data: {
          status: 'SUCCEEDED',
          stripePaymentIntentId: session.payment_intent as string,
        },
      });

      // Start processing the job
      const { cleanupQueue } = await import('../jobs/cleanup.queue');
      await cleanupQueue.add('cleanup-job', { jobId, tierId });
    }

    // Add revenue to treasury system
    await treasuryService.addRevenue(tier.price / 100, {
      source: 'subscription',
      userId: userId || 'anonymous',
      metadata: {
        tierId,
        jobId,
        sessionId: session.id
      }
    });

    // Award tokens for payment
    if (userId) {
      const tokensToAward = Math.floor(tier.price / 100) * tier.viralBenefits.tokenMultiplier;
      await treasuryService.awardAchievementTokens(userId, 'tier_purchase', tokensToAward);
      
      // Issue API key for the purchased tier
      try {
        const apiKeyResult = await apiKeyManagementService.issueAPIKeyForPayment(
          userId, 
          tierId, 
          session.id
        );
        
        logger.info('API key issued for tier purchase', {
          userId,
          tierId,
          keyId: apiKeyResult.keyInfo.keyId,
          sessionId: session.id
        });
      } catch (error) {
        logger.error('Failed to issue API key for tier purchase', { error, userId, tierId });
        // Don't fail the payment if API key generation fails
      }
    }

    // Log successful payment for analytics
    await presenceLogger.logUserPresence('payment_completed', {
      userId: userId || 'anonymous',
      metadata: {
        tierId,
        amount: tier.price,
        tokensAwarded: userId ? Math.floor(tier.price / 100) * tier.viralBenefits.tokenMultiplier : 0,
        sessionId: session.id
      }
    });

    logger.info('Tiered payment processed successfully', {
      tierId,
      price: tier.price,
      jobId,
      userId
    });

  } catch (error) {
    logger.error('Error processing tiered checkout completion', { 
      error, 
      sessionId: session.id, 
      tierId 
    });
    throw error;
  }
}

// Singleton instance
export const pricingService = new PricingService();

// Export backward compatibility function for existing code
export async function createCheckoutSession(jobId: string): Promise<{
  sessionId: string;
  url: string;
  jobId: string;
}> {
  const result = await createTieredCheckoutSession({
    jobId,
    tierId: 'cleanup'
  });
  
  return {
    sessionId: result.sessionId,
    url: result.url,
    jobId
  };
}