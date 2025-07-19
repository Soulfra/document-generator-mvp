import { Router } from 'express';
import Stripe from 'stripe';
import { z } from 'zod';
import { prisma } from '../database/connection';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../utils/errors';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Payment creation schema
const createPaymentSchema = z.object({
  jobId: z.string().uuid(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

// Free tier check
const isFreeTier = (user: any): boolean => {
  // First job is free
  return user.jobCount === 0;
};

/**
 * POST /api/payment/create-session
 * Create a Stripe checkout session
 */
router.post(
  '/create-session',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const data = createPaymentSchema.parse(req.body);

    // Get job details
    const job = await prisma.job.findFirst({
      where: {
        id: data.jobId,
        userId,
        status: { in: ['PENDING', 'PROCESSING', 'REVIEW'] },
      },
      include: {
        payment: true,
      },
    });

    if (!job) {
      throw new AppError('Job not found or not payable', 404, 'JOB_NOT_PAYABLE');
    }

    if (job.payment) {
      throw new AppError('Payment already exists for this job', 400, 'PAYMENT_EXISTS');
    }

    // Check if user has free tier available
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: { jobs: true },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Free tier - no payment needed
    if (isFreeTier({ jobCount: user._count.jobs })) {
      logger.info('Free tier job, no payment required', { jobId: job.id, userId });
      
      return res.json({
        success: true,
        data: {
          requiresPayment: false,
          message: 'Your first cleanup is free! 🎉',
        },
      });
    }

    // Calculate amount in cents
    const amount = Math.max(100, Math.round(Number(job.cost) * 100)); // Minimum $1

    // Create or update Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      
      stripeCustomerId = customer.id;
      
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Code Cleanup Service',
              description: `${job.type} service for your code`,
              metadata: {
                jobId: job.id,
                type: job.type,
              },
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: data.successUrl || `${process.env.FRONTEND_URL}/jobs/${job.id}?payment=success`,
      cancel_url: data.cancelUrl || `${process.env.FRONTEND_URL}/jobs/${job.id}?payment=cancelled`,
      metadata: {
        jobId: job.id,
        userId,
      },
      payment_intent_data: {
        metadata: {
          jobId: job.id,
          userId,
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        userId,
        jobId: job.id,
        stripeSessionId: session.id,
        amount,
        currency: 'usd',
        status: 'PENDING',
        metadata: {
          sessionUrl: session.url,
          expiresAt: new Date(session.expires_at * 1000),
        },
      },
    });

    logger.info('Payment session created', {
      jobId: job.id,
      userId,
      sessionId: session.id,
      amount,
    });

    res.json({
      success: true,
      data: {
        requiresPayment: true,
        sessionId: session.id,
        sessionUrl: session.url,
        amount,
        expiresAt: new Date(session.expires_at * 1000),
      },
    });
  })
);

/**
 * GET /api/payment/:jobId
 * Get payment status for a job
 */
router.get(
  '/:jobId',
  asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const userId = req.user.id;

    const payment = await prisma.payment.findFirst({
      where: {
        jobId,
        userId,
      },
    });

    if (!payment) {
      // Check if job exists and is free tier
      const job = await prisma.job.findFirst({
        where: { id: jobId, userId },
      });

      if (!job) {
        throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
      }

      // Free tier job
      return res.json({
        success: true,
        data: {
          requiresPayment: false,
          status: 'FREE_TIER',
        },
      });
    }

    // Get latest status from Stripe
    if (payment.stripeSessionId && payment.status === 'PENDING') {
      try {
        const session = await stripe.checkout.sessions.retrieve(payment.stripeSessionId);
        
        if (session.payment_status === 'paid' && payment.status !== 'SUCCEEDED') {
          // Update payment status
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCEEDED',
              stripePaymentIntent: session.payment_intent as string,
              paidAt: new Date(),
            },
          });
          
          payment.status = 'SUCCEEDED';
        }
      } catch (error) {
        logger.error('Error retrieving Stripe session', { error, sessionId: payment.stripeSessionId });
      }
    }

    res.json({
      success: true,
      data: {
        requiresPayment: true,
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: payment.paidAt,
        sessionUrl: (payment.metadata as any)?.sessionUrl,
      },
    });
  })
);

/**
 * POST /api/payment/refund
 * Request a refund for a payment
 */
router.post(
  '/refund',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { paymentId, reason } = req.body;

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
        status: 'SUCCEEDED',
      },
      include: {
        job: true,
      },
    });

    if (!payment) {
      throw new AppError('Payment not found or not refundable', 404, 'PAYMENT_NOT_REFUNDABLE');
    }

    // Check if job is completed - partial refund if not
    const refundAmount = payment.job.status === 'COMPLETED' 
      ? Math.round(payment.amount * 0.5) // 50% refund if completed
      : payment.amount; // Full refund if not completed

    if (!payment.stripePaymentIntent) {
      throw new AppError('Payment intent not found', 400, 'NO_PAYMENT_INTENT');
    }

    // Create Stripe refund
    const refund = await stripe.refunds.create({
      payment_intent: payment.stripePaymentIntent,
      amount: refundAmount,
      reason: 'requested_by_customer',
      metadata: {
        userId,
        paymentId: payment.id,
        jobId: payment.jobId,
        customerReason: reason || 'No reason provided',
      },
    });

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        metadata: {
          ...(payment.metadata as any),
          refundId: refund.id,
          refundAmount,
          refundReason: reason,
          refundedAt: new Date(),
        },
      },
    });

    logger.info('Refund processed', {
      paymentId: payment.id,
      refundId: refund.id,
      amount: refundAmount,
      userId,
    });

    res.json({
      success: true,
      data: {
        refundId: refund.id,
        amount: refundAmount,
        status: refund.status,
        message: refundAmount === payment.amount 
          ? 'Full refund processed' 
          : 'Partial refund processed (50% for completed jobs)',
      },
    });
  })
);

/**
 * GET /api/payment/history
 * Get payment history
 */
router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        include: {
          job: {
            select: {
              id: true,
              type: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.payment.count({ where: { userId } }),
    ]);

    const totalSpent = await prisma.payment.aggregate({
      where: {
        userId,
        status: 'SUCCEEDED',
      },
      _sum: {
        amount: true,
      },
    });

    res.json({
      success: true,
      data: {
        payments: payments.map(payment => ({
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          jobId: payment.jobId,
          jobType: payment.job.type,
          jobStatus: payment.job.status,
          createdAt: payment.createdAt,
          paidAt: payment.paidAt,
        })),
        summary: {
          totalSpent: totalSpent._sum.amount || 0,
          paymentCount: total,
          currency: 'usd',
        },
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: Number(offset) + Number(limit) < total,
        },
      },
    });
  })
);

export { router as paymentRouter };