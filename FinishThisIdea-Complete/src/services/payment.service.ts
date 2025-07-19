import Stripe from 'stripe';
import { logger } from '../utils/logger';
import { prisma } from '../utils/database';
import { PaymentError, NotFoundError } from '../utils/errors';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export interface CheckoutSession {
  sessionId: string;
  url: string;
  jobId: string;
}

export interface StripeSessionConfig {
  jobId: string;
  amount: number;
  currency: string;
  description: string;
}

export async function createStripeSession(config: StripeSessionConfig): Promise<{ id: string; url: string }> {
  return createCheckoutSession(config.jobId);
}

export async function createCheckoutSession(jobId: string): Promise<CheckoutSession> {
  try {
    // Verify job exists and is pending payment
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

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Codebase Cleanup',
              description: 'AI-powered cleanup and organization of your messy codebase',
              images: [], // Add product images later
            },
            unit_amount: 100, // $1.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel`,
      metadata: {
        jobId: job.id,
      },
      customer_email: undefined, // No account required for MVP
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });

    // Update job with session ID
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
        amount: 100,
        currency: 'usd',
        status: 'PENDING',
      },
      update: {
        stripePaymentIntentId: session.payment_intent as string || null,
        status: 'PENDING',
      },
    });

    logger.info('Checkout session created', {
      jobId,
      sessionId: session.id,
      amount: 100,
    });

    return {
      sessionId: session.id,
      url: session.url || '',
      jobId,
    };

  } catch (error) {
    logger.error('Failed to create checkout session', { jobId, error });
    
    if (error instanceof Stripe.errors.StripeError) {
      throw new PaymentError(`Payment setup failed: ${error.message}`);
    }
    
    throw error;
  }
}

export async function handleWebhook(body: Buffer, signature: string): Promise<void> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('Stripe webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    logger.error('Webhook signature verification failed', { error });
    throw new PaymentError('Invalid webhook signature');
  }

  logger.info('Processing webhook event', { 
    type: event.type, 
    id: event.id 
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'checkout.session.expired':
        await handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
        
      default:
        logger.info('Unhandled webhook event type', { type: event.type });
    }
  } catch (error) {
    logger.error('Webhook processing failed', { 
      eventType: event.type, 
      eventId: event.id, 
      error 
    });
    throw error;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const jobId = session.metadata?.jobId;
  
  if (!jobId) {
    logger.error('No jobId in session metadata', { sessionId: session.id });
    return;
  }

  logger.info('Checkout completed', { jobId, sessionId: session.id });

  // Update payment status
  await prisma.payment.update({
    where: { jobId },
    data: {
      status: 'SUCCEEDED',
      stripePaymentIntentId: session.payment_intent as string,
    },
  });

  // Start processing the job by adding it to the queue
  const { cleanupQueue } = await import('../jobs/cleanup.queue');
  await cleanupQueue.add('cleanup-job', { jobId });

  logger.info('Job queued for processing', { jobId });
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
  const jobId = session.metadata?.jobId;
  
  if (!jobId) return;

  logger.info('Checkout expired', { jobId, sessionId: session.id });

  // Mark payment as failed
  await prisma.payment.update({
    where: { jobId },
    data: { status: 'FAILED' },
  });

  // Optionally, mark job as failed or keep it for retry
  await prisma.job.update({
    where: { id: jobId },
    data: { 
      status: 'FAILED',
      error: 'Payment expired - please try again',
    },
  });
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  logger.info('Payment succeeded', { 
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount 
  });

  // Update payment record
  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { status: 'SUCCEEDED' },
  });
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  logger.error('Payment failed', { 
    paymentIntentId: paymentIntent.id,
    lastPaymentError: paymentIntent.last_payment_error 
  });

  // Update payment record
  await prisma.payment.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: { status: 'FAILED' },
  });

  // Update associated job
  const payment = await prisma.payment.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
    include: { job: true },
  });

  if (payment) {
    await prisma.job.update({
      where: { id: payment.jobId },
      data: { 
        status: 'FAILED',
        error: paymentIntent.last_payment_error?.message || 'Payment failed',
      },
    });
  }
}