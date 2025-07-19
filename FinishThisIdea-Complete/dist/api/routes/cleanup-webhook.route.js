"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupWebhookRouter = void 0;
const express_1 = __importDefault(require("express"));
const payment_service_1 = require("../../services/payment.service");
const logger_1 = require("../../utils/logger");
const async_handler_1 = require("../../utils/async-handler");
const router = express_1.default.Router();
exports.cleanupWebhookRouter = router;
router.post('/stripe', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
        logger_1.logger.error('Missing Stripe signature header');
        return res.status(400).json({
            success: false,
            error: {
                code: 'MISSING_SIGNATURE',
                message: 'Stripe signature header is required'
            }
        });
    }
    try {
        await (0, payment_service_1.handleWebhook)(req.body, signature);
        logger_1.logger.info('Webhook processed successfully');
        res.json({ success: true });
    }
    catch (error) {
        logger_1.logger.error('Webhook processing failed', { error: error.message });
        res.status(400).json({
            success: false,
            error: {
                code: 'WEBHOOK_FAILED',
                message: error.message
            }
        });
    }
}));
//# sourceMappingURL=cleanup-webhook.route.js.map