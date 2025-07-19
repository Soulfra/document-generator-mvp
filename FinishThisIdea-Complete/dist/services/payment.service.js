"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStripeSession = createStripeSession;
exports.createCheckoutSession = createCheckoutSession;
exports.handleWebhook = handleWebhook;
const stripe_1 = __importDefault(require("stripe"));
const logger_1 = require("../utils/logger");
const database_1 = require("../utils/database");
const errors_1 = require("../utils/errors");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});
async function createStripeSession(config) {
    return createCheckoutSession(config.jobId);
}
async function createCheckoutSession(jobId) {
    try {
        const job = await database_1.prisma.job.findUnique({
            where: { id: jobId },
            include: { payment: true },
        });
        if (!job) {
            throw new errors_1.NotFoundError('Job not found');
        }
        if (job.payment && job.payment.status === 'SUCCEEDED') {
            throw new errors_1.PaymentError('Job already paid');
        }
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Codebase Cleanup',
                            description: 'AI-powered cleanup and organization of your messy codebase',
                            images: [],
                        },
                        unit_amount: 100,
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
            customer_email: undefined,
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
        });
        await database_1.prisma.job.update({
            where: { id: jobId },
            data: { stripeSessionId: session.id },
        });
        await database_1.prisma.payment.upsert({
            where: { jobId },
            create: {
                jobId,
                stripePaymentIntentId: session.payment_intent || null,
                amount: 100,
                currency: 'usd',
                status: 'PENDING',
            },
            update: {
                stripePaymentIntentId: session.payment_intent || null,
                status: 'PENDING',
            },
        });
        logger_1.logger.info('Checkout session created', {
            jobId,
            sessionId: session.id,
            amount: 100,
        });
        return {
            sessionId: session.id,
            url: session.url || '',
            jobId,
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to create checkout session', { jobId, error });
        if (error instanceof stripe_1.default.errors.StripeError) {
            throw new errors_1.PaymentError(`Payment setup failed: ${error.message}`);
        }
        throw error;
    }
}
async function handleWebhook(body, signature) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
        throw new Error('Stripe webhook secret not configured');
    }
    let event;
    try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    }
    catch (error) {
        logger_1.logger.error('Webhook signature verification failed', { error });
        throw new errors_1.PaymentError('Invalid webhook signature');
    }
    logger_1.logger.info('Processing webhook event', {
        type: event.type,
        id: event.id
    });
    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object);
                break;
            case 'checkout.session.expired':
                await handleCheckoutExpired(event.data.object);
                break;
            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;
            default:
                logger_1.logger.info('Unhandled webhook event type', { type: event.type });
        }
    }
    catch (error) {
        logger_1.logger.error('Webhook processing failed', {
            eventType: event.type,
            eventId: event.id,
            error
        });
        throw error;
    }
}
async function handleCheckoutCompleted(session) {
    const jobId = session.metadata?.jobId;
    if (!jobId) {
        logger_1.logger.error('No jobId in session metadata', { sessionId: session.id });
        return;
    }
    logger_1.logger.info('Checkout completed', { jobId, sessionId: session.id });
    await database_1.prisma.payment.update({
        where: { jobId },
        data: {
            status: 'SUCCEEDED',
            stripePaymentIntentId: session.payment_intent,
        },
    });
    const { cleanupQueue } = await Promise.resolve().then(() => __importStar(require('../jobs/cleanup.queue')));
    await cleanupQueue.add('cleanup-job', { jobId });
    logger_1.logger.info('Job queued for processing', { jobId });
}
async function handleCheckoutExpired(session) {
    const jobId = session.metadata?.jobId;
    if (!jobId)
        return;
    logger_1.logger.info('Checkout expired', { jobId, sessionId: session.id });
    await database_1.prisma.payment.update({
        where: { jobId },
        data: { status: 'FAILED' },
    });
    await database_1.prisma.job.update({
        where: { id: jobId },
        data: {
            status: 'FAILED',
            error: 'Payment expired - please try again',
        },
    });
}
async function handlePaymentSucceeded(paymentIntent) {
    logger_1.logger.info('Payment succeeded', {
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount
    });
    await database_1.prisma.payment.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: { status: 'SUCCEEDED' },
    });
}
async function handlePaymentFailed(paymentIntent) {
    logger_1.logger.error('Payment failed', {
        paymentIntentId: paymentIntent.id,
        lastPaymentError: paymentIntent.last_payment_error
    });
    await database_1.prisma.payment.updateMany({
        where: { stripePaymentIntentId: paymentIntent.id },
        data: { status: 'FAILED' },
    });
    const payment = await database_1.prisma.payment.findFirst({
        where: { stripePaymentIntentId: paymentIntent.id },
        include: { job: true },
    });
    if (payment) {
        await database_1.prisma.job.update({
            where: { id: payment.jobId },
            data: {
                status: 'FAILED',
                error: paymentIntent.last_payment_error?.message || 'Payment failed',
            },
        });
    }
}
//# sourceMappingURL=payment.service.js.map