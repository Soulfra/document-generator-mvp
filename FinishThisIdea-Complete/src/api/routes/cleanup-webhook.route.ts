import express from 'express';
import { handleWebhook } from '../../services/payment.service';
import { logger } from '../../utils/logger';
import { asyncHandler } from '../../utils/async-handler';

const router = express.Router();

// Stripe webhook endpoint
router.post('/stripe', asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'] as string;
  
  if (!signature) {
    logger.error('Missing Stripe signature header');
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_SIGNATURE',
        message: 'Stripe signature header is required'
      }
    });
  }

  try {
    await handleWebhook(req.body as Buffer, signature);
    
    logger.info('Webhook processed successfully');
    res.json({ success: true });
    
  } catch (error) {
    logger.error('Webhook processing failed', { error: error.message });
    res.status(400).json({
      success: false,
      error: {
        code: 'WEBHOOK_FAILED',
        message: error.message
      }
    });
  }
}));

export { router as cleanupWebhookRouter };