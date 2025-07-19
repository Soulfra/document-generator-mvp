import { Router } from 'express';
import Stripe from 'stripe';
import { prisma } from '../../utils/database';
import { logger } from '../../utils/logger';
import { treasuryService } from '../../services/treasury.service';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

/**
 * POST /api/payments/bundles/:bundleId
 * Create payment session for bundle
 */
router.post('/bundles/:bundleId', async (req, res) => {
  try {
    const { bundleId } = req.params;
    const { successUrl, cancelUrl } = req.body;

    const bundle = await prisma.bundle.findUnique({
      where: { id: bundleId },
      include: { jobs: true }
    });

    if (!bundle) {
      return res.status(404).json({
        success: false,
        error: 'Bundle not found'
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: bundle.name,
              description: bundle.description || 'Complete project transformation bundle',
              metadata: {
                bundleId: bundle.id,
                jobIds: bundle.jobs.map(j => j.id).join(',')
              }
            },
            unit_amount: bundle.totalPrice
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.FRONTEND_URL}/dashboard/bundles/${bundleId}/success`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/dashboard/bundles/${bundleId}/cancel`,
      metadata: {
        bundleId: bundle.id,
        type: 'bundle'
      }
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        bundleId: bundle.id,
        stripePaymentIntentId: session.payment_intent as string,
        amount: bundle.totalPrice,
        currency: 'usd',
        status: 'PENDING'
      }
    });

    logger.info('Bundle payment session created', {
      bundleId,
      sessionId: session.id,
      amount: bundle.totalPrice
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        sessionUrl: session.url,
        amount: bundle.totalPrice,
        currency: 'usd'
      }
    });

  } catch (error) {
    logger.error('Failed to create bundle payment session', {
      bundleId: req.params.bundleId,
      error
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create payment session'
    });
  }
});

/**
 * POST /api/payments/services/:jobId
 * Create payment session for individual service
 */
router.post('/services/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { successUrl, cancelUrl } = req.body;

    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Get service pricing
    const servicePricing = {
      'CLEANUP': { name: 'Code Cleanup', price: 100 },
      'DOCUMENTATION': { name: 'Documentation Generator', price: 300 },
      'API_GENERATION': { name: 'API Generator', price: 500 },
      'TEST_GENERATION': { name: 'Test Generator', price: 400 },
      'SECURITY_ANALYSIS': { name: 'Security Analyzer', price: 700 }
    };

    const service = servicePricing[job.type as keyof typeof servicePricing];
    if (!service) {
      return res.status(400).json({
        success: false,
        error: 'Invalid service type'
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: service.name,
              description: `${service.name} for ${job.originalFileName}`,
              metadata: {
                jobId: job.id,
                serviceType: job.type
              }
            },
            unit_amount: service.price
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: successUrl || `${process.env.FRONTEND_URL}/dashboard/jobs/${jobId}/success`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/dashboard/jobs/${jobId}/cancel`,
      metadata: {
        jobId: job.id,
        type: 'service'
      }
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        jobId: job.id,
        stripePaymentIntentId: session.payment_intent as string,
        amount: service.price,
        currency: 'usd',
        status: 'PENDING'
      }
    });

    // Update job with session ID
    await prisma.job.update({
      where: { id: jobId },
      data: { stripeSessionId: session.id }
    });

    logger.info('Service payment session created', {
      jobId,
      serviceType: job.type,
      sessionId: session.id,
      amount: service.price
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        sessionUrl: session.url,
        amount: service.price,
        currency: 'usd'
      }
    });

  } catch (error) {
    logger.error('Failed to create service payment session', {
      jobId: req.params.jobId,
      error
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create payment session'
    });
  }
});

/**
 * POST /api/payments/webhook
 * Handle Stripe webhooks
 */
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err });
    return res.status(400).send('Webhook signature verification failed');
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing failed', { eventType: event.type, error });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { bundleId, jobId, type } = session.metadata || {};

  if (type === 'bundle' && bundleId) {
    // Handle bundle payment
    await prisma.payment.updateMany({
      where: { bundleId },
      data: { status: 'SUCCEEDED' }
    });

    await prisma.bundle.update({
      where: { id: bundleId },
      data: { status: 'PROCESSING' }
    });

    // Start processing all jobs in bundle
    const jobs = await prisma.job.findMany({
      where: { bundleId }
    });

    // Import and queue jobs
    const { cleanupQueue } = await import('../../jobs/cleanup.job');
    const { documentationQueue } = await import('../../jobs/documentation.job');
    const { apiGenerationQueue } = await import('../../jobs/api-generation.job');
    const { testGenerationQueue } = await import('../../jobs/test-generation.job');
    const { securityAnalysisQueue } = await import('../../jobs/security-analysis.job');

    for (const job of jobs) {
      await prisma.job.update({
        where: { id: job.id },
        data: { 
          status: 'PROCESSING',
          processingStartedAt: new Date()
        }
      });

      // Queue appropriate job based on type
      switch (job.type) {
        case 'CLEANUP':
          await cleanupQueue.add('process', { jobId: job.id });
          break;
        case 'DOCUMENTATION':
          await documentationQueue.add('process', { jobId: job.id });
          break;
        case 'API_GENERATION':
          await apiGenerationQueue.add('process', { jobId: job.id });
          break;
        case 'TEST_GENERATION':
          await testGenerationQueue.add('process', { jobId: job.id });
          break;
        case 'SECURITY_ANALYSIS':
          await securityAnalysisQueue.add('process', { jobId: job.id });
          break;
      }
    }

    // Add revenue to treasury
    const bundlePayments = await prisma.payment.findMany({
      where: { bundleId }
    });
    const totalRevenue = bundlePayments.reduce((sum, p) => sum + p.amount, 0);
    
    await treasuryService.processPayment(totalRevenue / 100, 'bundle', {
      bundleId,
      sessionId: session.id,
      type: 'bundle'
    });

    logger.info('Bundle payment completed, jobs queued', {
      bundleId,
      jobCount: jobs.length,
      totalRevenue: totalRevenue / 100
    });

  } else if (type === 'service' && jobId) {
    // Handle individual service payment
    await prisma.payment.updateMany({
      where: { jobId },
      data: { status: 'SUCCEEDED' }
    });

    await prisma.job.update({
      where: { id: jobId },
      data: { 
        status: 'PROCESSING',
        processingStartedAt: new Date()
      }
    });

    // Queue the job
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (job) {
      switch (job.type) {
        case 'CLEANUP':
          const { cleanupQueue } = await import('../../jobs/cleanup.job');
          await cleanupQueue.add('process', { jobId: job.id });
          break;
        case 'DOCUMENTATION':
          const { documentationQueue } = await import('../../jobs/documentation.job');
          await documentationQueue.add('process', { jobId: job.id });
          break;
        case 'API_GENERATION':
          const { apiGenerationQueue } = await import('../../jobs/api-generation.job');
          await apiGenerationQueue.add('process', { jobId: job.id });
          break;
        case 'TEST_GENERATION':
          const { testGenerationQueue } = await import('../../jobs/test-generation.job');
          await testGenerationQueue.add('process', { jobId: job.id });
          break;
        case 'SECURITY_ANALYSIS':
          const { securityAnalysisQueue } = await import('../../jobs/security-analysis.job');
          await securityAnalysisQueue.add('process', { jobId: job.id });
          break;
      }
      
      // Add revenue to treasury
      const payment = await prisma.payment.findFirst({
        where: { jobId }
      });
      
      if (payment) {
        await treasuryService.processPayment(payment.amount / 100, jobId, {
          jobId,
          jobType: job.type,
          sessionId: session.id,
          type: 'service'
        });
      }
    }

    logger.info('Service payment completed, job queued', { 
      jobId,
      revenueProcessed: true
    });
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { status: 'SUCCEEDED' }
  });

  logger.info('Payment intent succeeded', {
    paymentIntentId: paymentIntent.id
  });
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { status: 'FAILED' }
  });

  // Mark associated jobs/bundles as failed
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
    include: { job: true, bundle: true }
  });

  if (payment?.job) {
    await prisma.job.update({
      where: { id: payment.job.id },
      data: { status: 'FAILED', error: 'Payment failed' }
    });
  }

  if (payment?.bundle) {
    await prisma.bundle.update({
      where: { id: payment.bundle.id },
      data: { status: 'FAILED' }
    });
  }

  logger.error('Payment intent failed', {
    paymentIntentId: paymentIntent.id
  });
}

/**
 * GET /api/payments/:paymentId/status
 * Get payment status
 */
router.get('/:paymentId/status', async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        job: true,
        bundle: {
          include: { jobs: true }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: {
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          createdAt: payment.createdAt
        },
        job: payment.job,
        bundle: payment.bundle
      }
    });

  } catch (error) {
    logger.error('Failed to get payment status', {
      paymentId: req.params.paymentId,
      error
    });
    res.status(500).json({
      success: false,
      error: 'Failed to get payment status'
    });
  }
});

/**
 * GET /api/payments/session/:sessionId/job
 * Get job info from payment session
 */
router.get('/session/:sessionId/job', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    const { bundleId, jobId, type } = session.metadata || {};
    
    if (type === 'bundle' && bundleId) {
      const bundle = await prisma.bundle.findUnique({
        where: { id: bundleId },
        include: { jobs: true }
      });
      
      return res.json({
        success: true,
        data: {
          bundleId,
          services: bundle?.services || [],
          status: bundle?.status || 'PROCESSING',
          jobs: bundle?.jobs || []
        }
      });
    } else if (jobId) {
      const job = await prisma.job.findUnique({
        where: { id: jobId }
      });
      
      return res.json({
        success: true,
        data: {
          jobId,
          services: [job?.type || 'CLEANUP'],
          status: job?.status || 'PROCESSING'
        }
      });
    }
    
    res.status(400).json({
      success: false,
      error: 'Invalid session metadata'
    });
    
  } catch (error) {
    logger.error('Failed to get session job info', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get job information'
    });
  }
});

export const paymentsRouter = router;