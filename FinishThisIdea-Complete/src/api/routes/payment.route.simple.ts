import { Router } from 'express';
import { createCheckoutSession } from '../../services/payment.service';
import { logger } from '../../utils/logger';
import { ValidationError } from '../../utils/errors';

const router = Router();

/**
 * POST /api/payment/checkout
 * Create a Stripe checkout session for a job
 */
router.post('/checkout', async (req, res, next) => {
  try {
    const { jobId } = req.body;

    if (!jobId || typeof jobId !== 'string') {
      throw new ValidationError('jobId is required');
    }

    const session = await createCheckoutSession(jobId);

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        checkoutUrl: session.url,
        jobId: session.jobId,
      },
    });

  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/payment/success
 * Handle successful payment redirect
 */
router.get('/success', async (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).json({
      success: false,
      error: 'No session ID provided',
    });
  }

  // In a full app, you'd verify the session and show a success page
  // For MVP, just redirect to job status
  res.json({
    success: true,
    message: 'Payment successful! Your code is being cleaned.',
    sessionId: session_id,
  });
});

/**
 * GET /api/payment/cancel
 * Handle cancelled payment
 */
router.get('/cancel', async (req, res) => {
  res.json({
    success: false,
    message: 'Payment cancelled. You can try again anytime.',
  });
});

export const paymentRouter = router;