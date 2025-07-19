"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRouter = void 0;
const express_1 = require("express");
const payment_service_1 = require("../../services/payment.service");
const logger_1 = require("../../utils/logger");
const router = (0, express_1.Router)();
router.post('/stripe', async (req, res, next) => {
    try {
        const signature = req.headers['stripe-signature'];
        if (!signature) {
            return res.status(400).json({
                success: false,
                error: 'Missing stripe-signature header',
            });
        }
        await (0, payment_service_1.handleWebhook)(req.body, signature);
        res.json({ received: true });
    }
    catch (error) {
        logger_1.logger.error('Webhook processing failed', { error });
        next(error);
    }
});
exports.webhookRouter = router;
//# sourceMappingURL=webhook.route.simple.js.map