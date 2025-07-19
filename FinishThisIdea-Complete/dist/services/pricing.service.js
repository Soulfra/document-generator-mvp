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
exports.pricingService = exports.PricingService = exports.PRICING_TIERS = void 0;
exports.createTieredCheckoutSession = createTieredCheckoutSession;
exports.handleTieredCheckoutCompleted = handleTieredCheckoutCompleted;
exports.createCheckoutSession = createCheckoutSession;
const stripe_1 = __importDefault(require("stripe"));
const logger_1 = require("../utils/logger");
const database_1 = require("../utils/database");
const treasury_service_1 = require("./viral/treasury.service");
const presence_logger_1 = require("../monitoring/presence-logger");
const errors_1 = require("../utils/errors");
const api_key_management_service_1 = require("./api-key-management.service");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2023-10-16',
});
exports.PRICING_TIERS = {
    cleanup: {
        id: 'cleanup',
        name: '🧹 Quick Cleanup',
        price: 100,
        description: 'AI-powered cleanup of a single codebase',
        features: [
            'One-time codebase cleanup',
            'Basic code analysis',
            'Ollama-powered improvements',
            'Download cleaned files',
            'Community support'
        ],
        limits: {
            filesPerMonth: 1,
            fileSizeLimit: 10,
            agentsAllowed: 0,
            collaborationsPerMonth: 0,
            showcasesPerMonth: 1,
            apiCallsPerMonth: 10,
            supportLevel: 'community'
        },
        viralBenefits: {
            tokenMultiplier: 1.0,
            referralBonus: 25,
            dividendRate: 0.1,
            earlyAccess: false
        }
    },
    developer: {
        id: 'developer',
        name: '⚡ Developer Pack',
        price: 500,
        originalPrice: 800,
        description: 'Perfect for active developers with multiple projects',
        features: [
            'Up to 10 projects per month',
            'Advanced AI analysis (Claude)',
            'Custom context profiles',
            'Agent marketplace access',
            'Project showcase features',
            'Email support'
        ],
        limits: {
            filesPerMonth: 10,
            fileSizeLimit: 50,
            agentsAllowed: 3,
            collaborationsPerMonth: 5,
            showcasesPerMonth: 10,
            apiCallsPerMonth: 500,
            supportLevel: 'email'
        },
        viralBenefits: {
            tokenMultiplier: 1.2,
            referralBonus: 50,
            dividendRate: 0.2,
            earlyAccess: true
        }
    },
    team: {
        id: 'team',
        name: '🚀 Team Accelerator',
        price: 2500,
        originalPrice: 4000,
        description: 'Supercharge your entire team with AI collaboration',
        features: [
            'Unlimited projects',
            'Team collaboration tools',
            'AI agent creation & sharing',
            'Advanced analytics dashboard',
            'Priority AI routing',
            'Custom integrations',
            'Priority support'
        ],
        limits: {
            filesPerMonth: 100,
            fileSizeLimit: 500,
            agentsAllowed: 25,
            collaborationsPerMonth: 50,
            showcasesPerMonth: 50,
            apiCallsPerMonth: 5000,
            supportLevel: 'priority'
        },
        viralBenefits: {
            tokenMultiplier: 1.5,
            referralBonus: 100,
            dividendRate: 0.25,
            earlyAccess: true
        }
    },
    enterprise: {
        id: 'enterprise',
        name: '🏢 Enterprise',
        price: 0,
        description: 'Custom solution for large organizations',
        features: [
            'Everything in Team Accelerator',
            'White-label deployment',
            'Custom AI model training',
            'Dedicated infrastructure',
            'SLA guarantees',
            'On-premise deployment option',
            'White-glove support'
        ],
        limits: {
            filesPerMonth: -1,
            fileSizeLimit: -1,
            agentsAllowed: -1,
            collaborationsPerMonth: -1,
            showcasesPerMonth: -1,
            apiCallsPerMonth: -1,
            supportLevel: 'white-glove'
        },
        viralBenefits: {
            tokenMultiplier: 2.0,
            referralBonus: 500,
            dividendRate: 0.3,
            earlyAccess: true
        }
    }
};
class PricingService {
    async getRecommendedTier(userId) {
        try {
            const userJobs = await database_1.prisma.job.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            });
            let userAgent = null;
            try {
                userAgent = await database_1.prisma.user.findUnique({
                    where: { id: userId },
                    include: {
                        agents: true,
                        showcases: true,
                        collaborations: true
                    }
                });
            }
            catch (error) {
            }
            if (!userAgent || userJobs <= 1) {
                return 'cleanup';
            }
            if (userJobs <= 5 && (!userAgent.agents || userAgent.agents.length === 0)) {
                return 'developer';
            }
            if (userJobs <= 20 || (userAgent.agents && userAgent.agents.length <= 10)) {
                return 'team';
            }
            return 'enterprise';
        }
        catch (error) {
            logger_1.logger.error('Error getting recommended tier', { error, userId });
            return 'cleanup';
        }
    }
    calculateSavings(fromTier, toTier, monthlyUsage) {
        const fromPrice = exports.PRICING_TIERS[fromTier]?.price || 0;
        const toPrice = exports.PRICING_TIERS[toTier]?.price || 0;
        const currentMonthlyCost = fromPrice * monthlyUsage;
        const newMonthlyCost = toPrice;
        return Math.max(0, currentMonthlyCost - newMonthlyCost);
    }
    async getPricingDisplay(userId) {
        const tiers = Object.values(exports.PRICING_TIERS);
        let recommended;
        let savings;
        let currentTier;
        if (userId) {
            recommended = await this.getRecommendedTier(userId);
            savings = {};
            const userJobs = await database_1.prisma.job.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    }
                }
            });
            Object.keys(exports.PRICING_TIERS).forEach(tierId => {
                savings[tierId] = this.calculateSavings('cleanup', tierId, userJobs);
            });
            currentTier = userJobs > 10 ? 'team' : userJobs > 1 ? 'developer' : 'cleanup';
        }
        return { tiers, recommended, savings, currentTier };
    }
}
exports.PricingService = PricingService;
async function createTieredCheckoutSession(options) {
    try {
        const { tierId, jobId, userId, successUrl, cancelUrl, metadata = {} } = options;
        const tier = exports.PRICING_TIERS[tierId];
        if (!tier) {
            throw new errors_1.PaymentError(`Invalid tier: ${tierId}`);
        }
        if (tierId === 'enterprise') {
            throw new errors_1.PaymentError('Enterprise pricing requires custom quote. Please contact sales.');
        }
        if (tierId === 'cleanup' && jobId) {
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
        }
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: tier.name,
                            description: tier.description,
                            images: [],
                        },
                        unit_amount: tier.price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: successUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/cancel`,
            metadata: {
                tierId,
                jobId: jobId || '',
                userId: userId || '',
                ...metadata
            },
            customer_email: undefined,
            expires_at: Math.floor(Date.now() / 1000) + (30 * 60),
        });
        if (jobId) {
            await database_1.prisma.job.update({
                where: { id: jobId },
                data: { stripeSessionId: session.id },
            });
            await database_1.prisma.payment.upsert({
                where: { jobId },
                create: {
                    jobId,
                    stripePaymentIntentId: session.payment_intent || null,
                    amount: tier.price,
                    currency: 'usd',
                    status: 'PENDING',
                },
                update: {
                    stripePaymentIntentId: session.payment_intent || null,
                    status: 'PENDING',
                    amount: tier.price,
                },
            });
        }
        await presence_logger_1.presenceLogger.logUserPresence('checkout_created', {
            userId: userId || 'anonymous',
            metadata: {
                tierId,
                price: tier.price,
                sessionId: session.id,
                jobId
            }
        });
        logger_1.logger.info('Tiered checkout session created', {
            tierId,
            sessionId: session.id,
            price: tier.price,
            jobId,
            userId
        });
        return {
            sessionId: session.id,
            url: session.url || '',
            tierId,
            price: tier.price
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to create tiered checkout session', { options, error });
        if (error instanceof stripe_1.default.errors.StripeError) {
            throw new errors_1.PaymentError(`Payment setup failed: ${error.message}`);
        }
        throw error;
    }
}
async function handleTieredCheckoutCompleted(session) {
    const { tierId, jobId, userId } = session.metadata || {};
    if (!tierId) {
        logger_1.logger.error('No tierId in session metadata', { sessionId: session.id });
        return;
    }
    const tier = exports.PRICING_TIERS[tierId];
    if (!tier) {
        logger_1.logger.error('Invalid tier in session metadata', { tierId, sessionId: session.id });
        return;
    }
    logger_1.logger.info('Tiered checkout completed', { tierId, jobId, userId, sessionId: session.id });
    try {
        if (jobId) {
            await database_1.prisma.payment.update({
                where: { jobId },
                data: {
                    status: 'SUCCEEDED',
                    stripePaymentIntentId: session.payment_intent,
                },
            });
            const { cleanupQueue } = await Promise.resolve().then(() => __importStar(require('../jobs/cleanup.queue')));
            await cleanupQueue.add('cleanup-job', { jobId, tierId });
        }
        await treasury_service_1.treasuryService.addRevenue(tier.price / 100, {
            source: 'subscription',
            userId: userId || 'anonymous',
            metadata: {
                tierId,
                jobId,
                sessionId: session.id
            }
        });
        if (userId) {
            const tokensToAward = Math.floor(tier.price / 100) * tier.viralBenefits.tokenMultiplier;
            await treasury_service_1.treasuryService.awardAchievementTokens(userId, 'tier_purchase', tokensToAward);
            try {
                const apiKeyResult = await api_key_management_service_1.apiKeyManagementService.issueAPIKeyForPayment(userId, tierId, session.id);
                logger_1.logger.info('API key issued for tier purchase', {
                    userId,
                    tierId,
                    keyId: apiKeyResult.keyInfo.keyId,
                    sessionId: session.id
                });
            }
            catch (error) {
                logger_1.logger.error('Failed to issue API key for tier purchase', { error, userId, tierId });
            }
        }
        await presence_logger_1.presenceLogger.logUserPresence('payment_completed', {
            userId: userId || 'anonymous',
            metadata: {
                tierId,
                amount: tier.price,
                tokensAwarded: userId ? Math.floor(tier.price / 100) * tier.viralBenefits.tokenMultiplier : 0,
                sessionId: session.id
            }
        });
        logger_1.logger.info('Tiered payment processed successfully', {
            tierId,
            price: tier.price,
            jobId,
            userId
        });
    }
    catch (error) {
        logger_1.logger.error('Error processing tiered checkout completion', {
            error,
            sessionId: session.id,
            tierId
        });
        throw error;
    }
}
exports.pricingService = new PricingService();
async function createCheckoutSession(jobId) {
    const result = await createTieredCheckoutSession({
        jobId,
        tierId: 'cleanup'
    });
    return {
        sessionId: result.sessionId,
        url: result.url,
        jobId
    };
}
//# sourceMappingURL=pricing.service.js.map