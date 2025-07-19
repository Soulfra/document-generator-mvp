"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRouter = void 0;
const express_1 = require("express");
const payment_service_1 = require("../../services/payment.service");
const errors_1 = require("../../utils/errors");
const router = (0, express_1.Router)();
router.post('/checkout', async (req, res, next) => {
    try {
        const { jobId } = req.body;
        if (!jobId || typeof jobId !== 'string') {
            throw new errors_1.ValidationError('jobId is required');
        }
        const session = await (0, payment_service_1.createCheckoutSession)(jobId);
        res.json({
            success: true,
            data: {
                sessionId: session.sessionId,
                checkoutUrl: session.url,
                jobId: session.jobId,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/success', async (req, res) => {
    const { session_id } = req.query;
    if (!session_id) {
        return res.status(400).json({
            success: false,
            error: 'No session ID provided',
        });
    }
    res.json({
        success: true,
        message: 'Payment successful! Your code is being cleaned.',
        sessionId: session_id,
    });
});
router.get('/cancel', async (req, res) => {
    res.json({
        success: false,
        message: 'Payment cancelled. You can try again anytime.',
    });
});
exports.paymentRouter = router;
//# sourceMappingURL=payment.route.simple.js.map