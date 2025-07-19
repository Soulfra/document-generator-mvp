"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRouter = void 0;
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const database_1 = require("../../utils/database");
const cleanup_queue_1 = require("../../jobs/cleanup.queue");
const logger_1 = require("../../utils/logger");
const async_handler_1 = require("../../utils/async-handler");
const errors_1 = require("../../utils/errors");
const router = (0, express_1.Router)();
exports.webhookRouter = router;
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    typescript: true,
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
router.post('/', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    if (!sig) {
        throw new errors_1.AppError('No Stripe signature found', 400, 'MISSING_SIGNATURE');
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    catch (err) {
        logger_1.logger.error('Webhook signature verification failed', { error: err });
        throw new errors_1.AppError('Invalid signature', 400, 'INVALID_SIGNATURE');
    }
    logger_1.logger.info('Webhook received', {
        type: event.type,
        id: event.id,
    });
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            await handleCheckoutCompleted(session);
            break;
        }
        case 'checkout.session.expired': {
            const session = event.data.object;
            await handleCheckoutExpired(session);
            break;
        }
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object;
            await handlePaymentSucceeded(paymentIntent);
            break;
        }
        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object;
            await handlePaymentFailed(paymentIntent);
            break;
        }
        case 'charge.refunded': {
            const charge = event.data.object;
            await handleChargeRefunded(charge);
            break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            logger_1.logger.info('Subscription event', {
                type: event.type,
                subscriptionId: subscription.id,
            });
            break;
        }
        default:
            logger_1.logger.info('Unhandled webhook event type', { type: event.type });
    }
    res.json({ received: true });
}));
async function handleCheckoutCompleted(session) {
    const { jobId, userId } = session.metadata || {};
    if (!jobId || !userId) {
        logger_1.logger.error('Missing metadata in checkout session', {
            sessionId: session.id,
            metadata: session.metadata,
        });
        return;
    }
    logger_1.logger.info('Checkout session completed', {
        sessionId: session.id,
        jobId,
        userId,
    });
    const payment = await database_1.prisma.payment.findFirst({
        where: { stripeSessionId: session.id },
    });
    if (!payment) {
        logger_1.logger.error('Payment record not found', { sessionId: session.id });
        return;
    }
    await database_1.prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: 'SUCCEEDED',
            stripePaymentIntent: session.payment_intent,
            paidAt: new Date(),
            metadata: {
                ...payment.metadata,
                sessionPaymentStatus: session.payment_status,
                customerEmail: session.customer_email,
            },
        },
    });
    const job = await database_1.prisma.job.findUnique({
        where: { id: jobId },
    });
    if (!job) {
        logger_1.logger.error('Job not found', { jobId });
        return;
    }
    if (job.status === 'PENDING') {
        await cleanup_queue_1.cleanupQueue.add('process-cleanup', {
            jobId: job.id,
            userId: job.userId,
            uploadId: job.uploadId,
            options: job.input.options,
            type: job.type,
            paidProcessing: true,
        }, {
            priority: 2,
            attempts: 5,
            backoff: {
                type: 'exponential',
                delay: 2000,
            },
        });
        logger_1.logger.info('Job queued for processing after payment', { jobId });
    }
    await sendPaymentConfirmation(userId, jobId, session);
    const io = global.io;
    if (io) {
        io.to(`user:${userId}`).emit('payment:completed', {
            jobId,
            paymentId: payment.id,
            status: 'succeeded',
        });
    }
}
async function handleCheckoutExpired(session) {
    logger_1.logger.info('Checkout session expired', {
        sessionId: session.id,
        metadata: session.metadata,
    });
    const payment = await database_1.prisma.payment.findFirst({
        where: { stripeSessionId: session.id },
    });
    if (payment && payment.status === 'PENDING') {
        await database_1.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'FAILED',
                metadata: {
                    ...payment.metadata,
                    failureReason: 'session_expired',
                    expiredAt: new Date(),
                },
            },
        });
    }
}
async function handlePaymentSucceeded(paymentIntent) {
    const { jobId, userId } = paymentIntent.metadata || {};
    logger_1.logger.info('Payment intent succeeded', {
        paymentIntentId: paymentIntent.id,
        jobId,
        userId,
    });
    const payment = await database_1.prisma.payment.findFirst({
        where: { stripePaymentIntent: paymentIntent.id },
    });
    if (payment && payment.status !== 'SUCCEEDED') {
        await database_1.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'SUCCEEDED',
                paidAt: new Date(),
            },
        });
    }
}
async function handlePaymentFailed(paymentIntent) {
    const { jobId, userId } = paymentIntent.metadata || {};
    logger_1.logger.error('Payment intent failed', {
        paymentIntentId: paymentIntent.id,
        jobId,
        userId,
        error: paymentIntent.last_payment_error,
    });
    const payment = await database_1.prisma.payment.findFirst({
        where: { stripePaymentIntent: paymentIntent.id },
    });
    if (payment) {
        await database_1.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'FAILED',
                metadata: {
                    ...payment.metadata,
                    failureReason: paymentIntent.last_payment_error?.message,
                    failureCode: paymentIntent.last_payment_error?.code,
                    failedAt: new Date(),
                },
            },
        });
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
async function handleChargeRefunded(charge) {
    logger_1.logger.info('Charge refunded', {
        chargeId: charge.id,
        amount: charge.amount_refunded,
        paymentIntent: charge.payment_intent,
    });
    if (!charge.payment_intent)
        return;
    const payment = await database_1.prisma.payment.findFirst({
        where: { stripePaymentIntent: charge.payment_intent },
    });
    if (payment) {
        const isFullRefund = charge.amount_refunded === charge.amount;
        await database_1.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: isFullRefund ? 'REFUNDED' : 'SUCCEEDED',
                metadata: {
                    ...payment.metadata,
                    refundAmount: charge.amount_refunded,
                    refundedAt: new Date(),
                    isPartialRefund: !isFullRefund,
                },
            },
        });
        if (isFullRefund) {
            const job = await database_1.prisma.job.findUnique({
                where: { id: payment.jobId },
            });
            if (job && ['PENDING', 'PROCESSING', 'REVIEW'].includes(job.status)) {
                await database_1.prisma.job.update({
                    where: { id: job.id },
                    data: { status: 'CANCELLED' },
                });
                const queueJob = await cleanup_queue_1.cleanupQueue.getJob(job.id);
                if (queueJob) {
                    await queueJob.remove();
                }
                logger_1.logger.info('Job cancelled due to refund', { jobId: job.id });
            }
        }
    }
}
async function sendPaymentConfirmation(userId, jobId, session) {
    try {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !session.customer_email)
            return;
        logger_1.logger.info('Payment confirmation email queued', {
            userId,
            email: session.customer_email,
            jobId,
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to send payment confirmation', {
            error,
            userId,
            jobId,
        });
    }
}
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
//# sourceMappingURL=webhook.route.js.map