import { Router } from 'express';
import Stripe from 'stripe';
import { prisma } from '../database/connection';
import { cleanupQueue } from '../queues/cleanup.queue';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/async-handler';
import { AppError } from '../utils/errors';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * POST /api/stripe/webhook
 * Handle Stripe webhook events
 * 
 * IMPORTANT: This route needs raw body, handled in server.ts
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      throw new AppError('No Stripe signature found', 400, 'MISSING_SIGNATURE');
    }

    let event: Stripe.Event;

    try {
      // Construct event from raw body
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );
    } catch (err) {
      logger.error('Webhook signature verification failed', { error: err });
      throw new AppError('Invalid signature', 400, 'INVALID_SIGNATURE');
    }

    logger.info('Webhook received', {
      type: event.type,
      id: event.id,
    });

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentSucceeded(paymentIntent);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        await handleChargeRefunded(charge);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        // Handle subscription events for future enterprise plans
        const subscription = event.data.object as Stripe.Subscription;
        logger.info('Subscription event', {
          type: event.type,
          subscriptionId: subscription.id,
        });
        break;
      }

      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }

    // Return a response to acknowledge receipt of the event
    res.json({ received: true });
  })
);

/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { jobId, userId } = session.metadata || {};

  if (!jobId || !userId) {
    logger.error('Missing metadata in checkout session', {
      sessionId: session.id,
      metadata: session.metadata,
    });
    return;
  }

  logger.info('Checkout session completed', {
    sessionId: session.id,
    jobId,
    userId,
  });

  // Update payment record
  const payment = await prisma.payment.findFirst({
    where: { stripeSessionId: session.id },
  });

  if (!payment) {
    logger.error('Payment record not found', { sessionId: session.id });
    return;
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'SUCCEEDED',
      stripePaymentIntent: session.payment_intent as string,
      paidAt: new Date(),
      metadata: {
        ...(payment.metadata as any),
        sessionPaymentStatus: session.payment_status,
        customerEmail: session.customer_email,
      },
    },
  });

  // Get job details
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    logger.error('Job not found', { jobId });
    return;
  }

  // If job is still pending, start processing
  if (job.status === 'PENDING') {
    await cleanupQueue.add('process-cleanup', {
      jobId: job.id,
      userId: job.userId,
      uploadId: job.uploadId!,
      options: (job.input as any).options,
      type: job.type,
      paidProcessing: true,
    }, {
      priority: 2, // Higher priority for paid jobs
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    logger.info('Job queued for processing after payment', { jobId });
  }

  // Send confirmation email (if email service is configured)
  await sendPaymentConfirmation(userId, jobId, session);

  // Notify via websocket
  const io = global.io;
  if (io) {
    io.to(`user:${userId}`).emit('payment:completed', {
      jobId,
      paymentId: payment.id,
      status: 'succeeded',
    });
  }
}

/**
 * Handle expired checkout session
 */
async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  logger.info('Checkout session expired', {
    sessionId: session.id,
    metadata: session.metadata,
  });

  const payment = await prisma.payment.findFirst({
    where: { stripeSessionId: session.id },
  });

  if (payment && payment.status === 'PENDING') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        metadata: {
          ...(payment.metadata as any),
          failureReason: 'session_expired',
          expiredAt: new Date(),
        },
      },
    });
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { jobId, userId } = paymentIntent.metadata || {};

  logger.info('Payment intent succeeded', {
    paymentIntentId: paymentIntent.id,
    jobId,
    userId,
  });

  // Update payment record if needed
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntent: paymentIntent.id },
  });

  if (payment && payment.status !== 'SUCCEEDED') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCEEDED',
        paidAt: new Date(),
      },
    });
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { jobId, userId } = paymentIntent.metadata || {};

  logger.error('Payment intent failed', {
    paymentIntentId: paymentIntent.id,
    jobId,
    userId,
    error: paymentIntent.last_payment_error,
  });

  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntent: paymentIntent.id },
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED',
        metadata: {
          ...(payment.metadata as any),
          failureReason: paymentIntent.last_payment_error?.message,
          failureCode: paymentIntent.last_payment_error?.code,
          failedAt: new Date(),
        },
      },
    });

    // Notify user via websocket
    const io = global.io;
    if (io && userId) {
      io.to(`user:${userId}`).emit('payment:failed', {
        jobId,
        paymentId: payment.id,
        error: paymentIntent.last_payment_error?.message,
      });
    }
  }
}

/**
 * Handle charge refunded
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  logger.info('Charge refunded', {
    chargeId: charge.id,
    amount: charge.amount_refunded,
    paymentIntent: charge.payment_intent,
  });

  if (!charge.payment_intent) return;

  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntent: charge.payment_intent as string },
  });

  if (payment) {
    const isFullRefund = charge.amount_refunded === charge.amount;
    
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: isFullRefund ? 'REFUNDED' : 'SUCCEEDED',
        metadata: {
          ...(payment.metadata as any),
          refundAmount: charge.amount_refunded,
          refundedAt: new Date(),
          isPartialRefund: !isFullRefund,
        },
      },
    });

    // Cancel job if full refund and job is not completed
    if (isFullRefund) {
      const job = await prisma.job.findUnique({
        where: { id: payment.jobId },
      });

      if (job && ['PENDING', 'PROCESSING', 'REVIEW'].includes(job.status)) {
        await prisma.job.update({
          where: { id: job.id },
          data: { status: 'CANCELLED' },
        });

        // Remove from queue
        const queueJob = await cleanupQueue.getJob(job.id);
        if (queueJob) {
          await queueJob.remove();
        }

        logger.info('Job cancelled due to refund', { jobId: job.id });
      }
    }
  }
}

/**
 * Send payment confirmation email
 */
async function sendPaymentConfirmation(
  userId: string,
  jobId: string,
  session: Stripe.Checkout.Session
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !session.customer_email) return;

    // Add email to queue (implement email service)
    logger.info('Payment confirmation email queued', {
      userId,
      email: session.customer_email,
      jobId,
    });

    // TODO: Implement email service
    // await emailQueue.add('payment-confirmation', {
    //   to: session.customer_email,
    //   jobId,
    //   amount: session.amount_total,
    //   receiptUrl: session.receipt_url,
    // });

  } catch (error) {
    logger.error('Failed to send payment confirmation', {
      error,
      userId,
      jobId,
    });
  }
}

// Webhook verification endpoint for Stripe CLI
router.get('/config', (req, res) => {
  res.json({
    webhookEndpoint: `${process.env.API_URL || 'http://localhost:3001'}/api/stripe/webhook`,
    events: [
      'checkout.session.completed',
      'checkout.session.expired',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'charge.refunded',
    ],
  });
});

export { router as webhookRouter };