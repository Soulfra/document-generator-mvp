import { Router } from 'express';
import { handleWebhook } from '../../services/payment.service';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * POST /api/webhook/stripe
 * Handle Stripe webhooks
 */
router.post('/stripe', async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing stripe-signature header',
      });
    }

    // Process webhook
    await handleWebhook(req.body, signature);

    res.json({ received: true });

  } catch (error) {
    logger.error('Webhook processing failed', { error });
    next(error);
  }
});

export const webhookRouter = router;