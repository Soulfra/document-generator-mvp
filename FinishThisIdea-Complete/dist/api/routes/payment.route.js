"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRouter = void 0;
const express_1 = require("express");
const stripe_1 = __importDefault(require("stripe"));
const zod_1 = require("zod");
const database_1 = require("../../utils/database");
const logger_1 = require("../../utils/logger");
const async_handler_1 = require("../../utils/async-handler");
const errors_1 = require("../../utils/errors");
const pricing_service_1 = require("../../services/pricing.service");
const presence_logger_1 = require("../../monitoring/presence-logger");
const router = (0, express_1.Router)();
exports.paymentRouter = router;
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    typescript: true,
});
const createPaymentSchema = zod_1.z.object({
    jobId: zod_1.z.string().uuid(),
    successUrl: zod_1.z.string().url().optional(),
    cancelUrl: zod_1.z.string().url().optional(),
});
const createTieredPaymentSchema = zod_1.z.object({
    tierId: zod_1.z.enum(['cleanup', 'developer', 'team', 'enterprise']),
    jobId: zod_1.z.string().uuid().optional(),
    successUrl: zod_1.z.string().url().optional(),
    cancelUrl: zod_1.z.string().url().optional(),
    metadata: zod_1.z.record(zod_1.z.string()).optional(),
});
const isFreeTier = (user) => {
    return user.jobCount === 0;
};
router.get('/pricing', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const pricingDisplay = await pricing_service_1.pricingService.getPricingDisplay(userId);
    if (userId) {
        await presence_logger_1.presenceLogger.logUserPresence('pricing_viewed', {
            userId,
            metadata: {
                recommended: pricingDisplay.recommended,
                currentTier: pricingDisplay.currentTier
            }
        });
    }
    res.json({
        success: true,
        data: pricingDisplay
    });
}));
router.post('/create-tiered-session', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const data = createTieredPaymentSchema.parse(req.body);
    if (data.tierId === 'enterprise') {
        return res.json({
            success: false,
            error: 'Enterprise pricing requires a custom quote',
            contact: {
                email: 'enterprise@finishthisidea.com',
                message: 'Please contact our sales team for enterprise pricing'
            }
        });
    }
    try {
        const session = await (0, pricing_service_1.createTieredCheckoutSession)({
            tierId: data.tierId,
            jobId: data.jobId,
            userId,
            successUrl: data.successUrl,
            cancelUrl: data.cancelUrl,
            metadata: data.metadata
        });
        res.json({
            success: true,
            data: {
                sessionId: session.sessionId,
                sessionUrl: session.url,
                tierId: session.tierId,
                price: session.price,
                tier: pricing_service_1.PRICING_TIERS[session.tierId]
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to create tiered checkout session', { error, data, userId });
        throw new errors_1.AppError('Failed to create payment session', 500, 'PAYMENT_SESSION_FAILED');
    }
}));
router.post('/create-session', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const data = createPaymentSchema.parse(req.body);
    const job = await database_1.prisma.job.findFirst({
        where: {
            id: data.jobId,
            userId,
            status: { in: ['PENDING', 'PROCESSING', 'REVIEW'] },
        },
        include: {
            payment: true,
        },
    });
    if (!job) {
        throw new errors_1.AppError('Job not found or not payable', 404, 'JOB_NOT_PAYABLE');
    }
    if (job.payment) {
        throw new errors_1.AppError('Payment already exists for this job', 400, 'PAYMENT_EXISTS');
    }
    const user = await database_1.prisma.user.findUnique({
        where: { id: userId },
        include: {
            _count: {
                select: { jobs: true },
            },
        },
    });
    if (!user) {
        throw new errors_1.AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    if (isFreeTier({ jobCount: user._count.jobs })) {
        logger_1.logger.info('Free tier job, no payment required', { jobId: job.id, userId });
        return res.json({
            success: true,
            data: {
                requiresPayment: false,
                message: 'Your first cleanup is free! 🎉',
            },
        });
    }
    const amount = Math.max(100, Math.round(Number(job.cost) * 100));
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            metadata: { userId },
        });
        stripeCustomerId = customer.id;
        await database_1.prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId },
        });
    }
    const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Code Cleanup Service',
                        description: `${job.type} service for your code`,
                        metadata: {
                            jobId: job.id,
                            type: job.type,
                        },
                    },
                    unit_amount: amount,
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: data.successUrl || `${process.env.FRONTEND_URL}/jobs/${job.id}?payment=success`,
        cancel_url: data.cancelUrl || `${process.env.FRONTEND_URL}/jobs/${job.id}?payment=cancelled`,
        metadata: {
            jobId: job.id,
            userId,
        },
        payment_intent_data: {
            metadata: {
                jobId: job.id,
                userId,
            },
        },
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
    });
    await database_1.prisma.payment.create({
        data: {
            userId,
            jobId: job.id,
            stripeSessionId: session.id,
            amount,
            currency: 'usd',
            status: 'PENDING',
            metadata: {
                sessionUrl: session.url,
                expiresAt: new Date(session.expires_at * 1000),
            },
        },
    });
    logger_1.logger.info('Payment session created', {
        jobId: job.id,
        userId,
        sessionId: session.id,
        amount,
    });
    res.json({
        success: true,
        data: {
            requiresPayment: true,
            sessionId: session.id,
            sessionUrl: session.url,
            amount,
            expiresAt: new Date(session.expires_at * 1000),
        },
    });
}));
router.get('/:jobId', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { jobId } = req.params;
    const userId = req.user.id;
    const payment = await database_1.prisma.payment.findFirst({
        where: {
            jobId,
            userId,
        },
    });
    if (!payment) {
        const job = await database_1.prisma.job.findFirst({
            where: { id: jobId, userId },
        });
        if (!job) {
            throw new errors_1.AppError('Job not found', 404, 'JOB_NOT_FOUND');
        }
        return res.json({
            success: true,
            data: {
                requiresPayment: false,
                status: 'FREE_TIER',
            },
        });
    }
    if (payment.stripeSessionId && payment.status === 'PENDING') {
        try {
            const session = await stripe.checkout.sessions.retrieve(payment.stripeSessionId);
            if (session.payment_status === 'paid' && payment.status !== 'SUCCEEDED') {
                await database_1.prisma.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: 'SUCCEEDED',
                        stripePaymentIntent: session.payment_intent,
                        paidAt: new Date(),
                    },
                });
                payment.status = 'SUCCEEDED';
            }
        }
        catch (error) {
            logger_1.logger.error('Error retrieving Stripe session', { error, sessionId: payment.stripeSessionId });
        }
    }
    res.json({
        success: true,
        data: {
            requiresPayment: true,
            id: payment.id,
            status: payment.status,
            amount: payment.amount,
            currency: payment.currency,
            paidAt: payment.paidAt,
            sessionUrl: payment.metadata?.sessionUrl,
        },
    });
}));
router.post('/refund', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { paymentId, reason } = req.body;
    const payment = await database_1.prisma.payment.findFirst({
        where: {
            id: paymentId,
            userId,
            status: 'SUCCEEDED',
        },
        include: {
            job: true,
        },
    });
    if (!payment) {
        throw new errors_1.AppError('Payment not found or not refundable', 404, 'PAYMENT_NOT_REFUNDABLE');
    }
    const refundAmount = payment.job.status === 'COMPLETED'
        ? Math.round(payment.amount * 0.5)
        : payment.amount;
    if (!payment.stripePaymentIntent) {
        throw new errors_1.AppError('Payment intent not found', 400, 'NO_PAYMENT_INTENT');
    }
    const refund = await stripe.refunds.create({
        payment_intent: payment.stripePaymentIntent,
        amount: refundAmount,
        reason: 'requested_by_customer',
        metadata: {
            userId,
            paymentId: payment.id,
            jobId: payment.jobId,
            customerReason: reason || 'No reason provided',
        },
    });
    await database_1.prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: 'REFUNDED',
            metadata: {
                ...payment.metadata,
                refundId: refund.id,
                refundAmount,
                refundReason: reason,
                refundedAt: new Date(),
            },
        },
    });
    logger_1.logger.info('Refund processed', {
        paymentId: payment.id,
        refundId: refund.id,
        amount: refundAmount,
        userId,
    });
    res.json({
        success: true,
        data: {
            refundId: refund.id,
            amount: refundAmount,
            status: refund.status,
            message: refundAmount === payment.amount
                ? 'Full refund processed'
                : 'Partial refund processed (50% for completed jobs)',
        },
    });
}));
router.get('/history', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;
    const [payments, total] = await Promise.all([
        database_1.prisma.payment.findMany({
            where: { userId },
            include: {
                job: {
                    select: {
                        id: true,
                        type: true,
                        status: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip: Number(offset),
        }),
        database_1.prisma.payment.count({ where: { userId } }),
    ]);
    const totalSpent = await database_1.prisma.payment.aggregate({
        where: {
            userId,
            status: 'SUCCEEDED',
        },
        _sum: {
            amount: true,
        },
    });
    res.json({
        success: true,
        data: {
            payments: payments.map(payment => ({
                id: payment.id,
                amount: payment.amount,
                currency: payment.currency,
                status: payment.status,
                jobId: payment.jobId,
                jobType: payment.job.type,
                jobStatus: payment.job.status,
                createdAt: payment.createdAt,
                paidAt: payment.paidAt,
            })),
            summary: {
                totalSpent: totalSpent._sum.amount || 0,
                paymentCount: total,
                currency: 'usd',
            },
            pagination: {
                total,
                limit: Number(limit),
                offset: Number(offset),
                hasMore: Number(offset) + Number(limit) < total,
            },
        },
    });
}));
//# sourceMappingURL=payment.route.js.map