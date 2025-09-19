/**
 * Stripe API Backend Integration
 * 
 * Server-side Stripe integration for secure payment processing
 * Works with Express.js and integrates with Arweave storage
 */

const express = require('express');
const stripe = require('stripe');
const cors = require('cors');
const crypto = require('crypto');

class StripeAPIBackend {
    constructor(config = {}) {
        this.config = {
            stripe: {
                secretKey: config.stripe?.secretKey || process.env.STRIPE_SECRET_KEY,
                webhookSecret: config.stripe?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET,
                webhookPath: '/webhook/stripe'
            },
            pricing: {
                premium: {
                    monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || 'price_premium_monthly',
                    yearly: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || 'price_premium_yearly'
                },
                founder: {
                    lifetime: process.env.STRIPE_FOUNDER_LIFETIME_PRICE_ID || 'price_founder_lifetime'
                },
                credits: {
                    small: process.env.STRIPE_CREDITS_SMALL_PRICE_ID || 'price_credits_small',
                    medium: process.env.STRIPE_CREDITS_MEDIUM_PRICE_ID || 'price_credits_medium',
                    large: process.env.STRIPE_CREDITS_LARGE_PRICE_ID || 'price_credits_large'
                }
            },
            features: {
                premium: [
                    'unlimited_job_applications',
                    'advanced_ai_models',
                    'priority_processing',
                    'custom_templates',
                    'analytics_dashboard',
                    'export_formats',
                    'api_access'
                ],
                founder: [
                    'all_premium_features',
                    'early_access',
                    'direct_support',
                    'custom_integrations',
                    'revenue_sharing',
                    'beta_features',
                    'white_label_options'
                ]
            },
            cors: {
                origin: [
                    'http://localhost:8080',
                    'https://soulfra.github.io',
                    'https://document-generator-mvp.vercel.app',
                    'https://soulfra.ai'
                ],
                credentials: true
            },
            ...config
        };

        // Initialize Stripe
        this.stripe = stripe(this.config.stripe.secretKey);
        this.app = express();
        
        // Customer and payment tracking
        this.customers = new Map(); // In production, use Redis or database
        this.sessions = new Map();
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        // CORS
        this.app.use(cors(this.config.cors));
        
        // Raw body for webhooks
        this.app.use(this.config.stripe.webhookPath, express.raw({ type: 'application/json' }));
        
        // JSON parsing for other routes
        this.app.use(express.json({ limit: '10mb' }));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
            next();
        });
        
        // Wallet address validation middleware
        this.app.use('/api/stripe', (req, res, next) => {
            const walletAddress = req.headers['x-wallet-address'];
            if (!walletAddress && req.method !== 'GET') {
                return res.status(400).json({ error: 'Wallet address required' });
            }
            req.walletAddress = walletAddress;
            next();
        });
    }

    setupRoutes() {
        // Health check
        this.app.get('/api/stripe/health', (req, res) => {
            res.json({ 
                status: 'ok', 
                stripe: 'connected',
                timestamp: Date.now()
            });
        });

        // Create checkout session
        this.app.post('/api/create-checkout-session', async (req, res) => {
            try {
                const session = await this.createCheckoutSession(req, res);
                res.json({ sessionId: session.id, url: session.url });
            } catch (error) {
                console.error('Checkout session creation failed:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Verify payment
        this.app.get('/api/verify-payment/:sessionId', async (req, res) => {
            try {
                const verification = await this.verifyPayment(req.params.sessionId);
                res.json(verification);
            } catch (error) {
                console.error('Payment verification failed:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Customer portal
        this.app.post('/api/stripe/customer-portal', async (req, res) => {
            try {
                const portalSession = await this.createCustomerPortal(req, res);
                res.json({ url: portalSession.url });
            } catch (error) {
                console.error('Customer portal creation failed:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Get customer data
        this.app.get('/api/stripe/customer', async (req, res) => {
            try {
                const customerData = await this.getCustomerData(req.walletAddress);
                res.json(customerData);
            } catch (error) {
                console.error('Get customer data failed:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Consume credits
        this.app.post('/api/stripe/consume-credits', async (req, res) => {
            try {
                const result = await this.consumeCredits(req, res);
                res.json(result);
            } catch (error) {
                console.error('Credit consumption failed:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Feature access check
        this.app.get('/api/stripe/feature-access/:feature', async (req, res) => {
            try {
                const access = await this.checkFeatureAccess(req.walletAddress, req.params.feature);
                res.json({ hasAccess: access });
            } catch (error) {
                console.error('Feature access check failed:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Stripe webhook
        this.app.post(this.config.stripe.webhookPath, async (req, res) => {
            try {
                await this.handleWebhook(req, res);
            } catch (error) {
                console.error('Webhook handling failed:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Usage analytics
        this.app.get('/api/stripe/analytics/:walletAddress', async (req, res) => {
            try {
                const analytics = await this.getUsageAnalytics(req.params.walletAddress);
                res.json(analytics);
            } catch (error) {
                console.error('Analytics retrieval failed:', error);
                res.status(500).json({ error: error.message });
            }
        });
    }

    async createCheckoutSession(req, res) {
        const { priceId, mode, successUrl, cancelUrl, metadata } = req.body;
        const walletAddress = req.walletAddress;

        // Find or create Stripe customer
        let customer = await this.findOrCreateCustomer(walletAddress, metadata);

        const sessionConfig = {
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1,
            }],
            mode: mode || 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            customer: customer.id,
            metadata: {
                walletAddress,
                ...metadata
            }
        };

        // Add subscription-specific configuration
        if (mode === 'subscription') {
            sessionConfig.subscription_data = {
                metadata: {
                    walletAddress,
                    ...metadata
                }
            };
        }

        const session = await this.stripe.checkout.sessions.create(sessionConfig);
        
        // Store session for verification
        this.sessions.set(session.id, {
            walletAddress,
            metadata,
            createdAt: Date.now()
        });

        return session;
    }

    async findOrCreateCustomer(walletAddress, metadata = {}) {
        // First check if customer exists with this wallet address
        const existingCustomers = await this.stripe.customers.list({
            email: `${walletAddress}@arweave.wallet`,
            limit: 1
        });

        if (existingCustomers.data.length > 0) {
            return existingCustomers.data[0];
        }

        // Create new customer
        const customer = await this.stripe.customers.create({
            email: `${walletAddress}@arweave.wallet`,
            description: `Soulfra User - Arweave Wallet: ${walletAddress}`,
            metadata: {
                walletAddress,
                platform: 'document-generator',
                ...metadata
            }
        });

        return customer;
    }

    async verifyPayment(sessionId) {
        try {
            const session = await this.stripe.checkout.sessions.retrieve(sessionId);
            const sessionData = this.sessions.get(sessionId);

            if (!session || !sessionData) {
                throw new Error('Session not found');
            }

            if (session.payment_status !== 'paid') {
                throw new Error('Payment not completed');
            }

            // Get payment details
            let amount = session.amount_total / 100; // Convert from cents
            let credits = 0;
            let type = 'unknown';

            // Determine payment type and benefits
            const metadata = session.metadata;
            if (metadata.tier === 'premium') {
                type = 'premium_subscription';
                credits = -1; // Unlimited
            } else if (metadata.tier === 'founder') {
                type = 'founder_tier';
                credits = -1; // Unlimited
            } else if (metadata.credits) {
                type = 'credits';
                credits = parseInt(metadata.credits);
            }

            // Update customer data
            await this.updateCustomerAfterPayment(sessionData.walletAddress, {
                type,
                amount,
                credits,
                stripeCustomerId: session.customer,
                stripeSessionId: sessionId
            });

            return {
                success: true,
                amount,
                credits,
                type,
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('Payment verification error:', error);
            return { success: false, error: error.message };
        }
    }

    async updateCustomerAfterPayment(walletAddress, paymentData) {
        const customerKey = `customer_${walletAddress}`;
        let customer = this.customers.get(customerKey) || {
            walletAddress,
            tier: 'free',
            credits: 10,
            subscriptions: [],
            payments: []
        };

        // Update tier based on payment
        if (paymentData.type === 'premium_subscription') {
            customer.tier = 'premium';
            customer.credits = -1; // Unlimited
        } else if (paymentData.type === 'founder_tier') {
            customer.tier = 'founder';
            customer.credits = -1; // Unlimited
        } else if (paymentData.type === 'credits') {
            customer.credits = (customer.credits === -1) ? -1 : customer.credits + paymentData.credits;
        }

        // Add payment to history
        customer.payments.push({
            ...paymentData,
            timestamp: Date.now()
        });

        // Store updated customer
        this.customers.set(customerKey, customer);

        // In production, save to database and Arweave
        await this.syncCustomerToArweave(customer);

        return customer;
    }

    async syncCustomerToArweave(customer) {
        // This would integrate with Arweave storage
        // For now, just log the sync operation
        console.log(`📡 Syncing customer data to Arweave: ${customer.walletAddress}`);
        
        // In production implementation:
        // 1. Create Arweave transaction with customer data
        // 2. Sign with service wallet
        // 3. Post to Arweave network
        // 4. Store transaction ID for future reference
        
        return true;
    }

    async handleWebhook(req, res) {
        const sig = req.headers['stripe-signature'];
        let event;

        try {
            event = this.stripe.webhooks.constructEvent(req.body, sig, this.config.stripe.webhookSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        console.log(`🔔 Stripe webhook: ${event.type}`);

        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutCompleted(event.data.object);
                break;
            
            case 'invoice.payment_succeeded':
                await this.handlePaymentSucceeded(event.data.object);
                break;
            
            case 'invoice.payment_failed':
                await this.handlePaymentFailed(event.data.object);
                break;
            
            case 'customer.subscription.deleted':
                await this.handleSubscriptionCanceled(event.data.object);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
    }

    async handleCheckoutCompleted(session) {
        console.log('Checkout completed:', session.id);
        
        const sessionData = this.sessions.get(session.id);
        if (sessionData) {
            // Update customer data
            await this.updateCustomerAfterPayment(sessionData.walletAddress, {
                type: sessionData.metadata.tier || 'unknown',
                amount: session.amount_total / 100,
                credits: parseInt(sessionData.metadata.credits) || 0,
                stripeCustomerId: session.customer,
                stripeSessionId: session.id
            });
        }
    }

    async handlePaymentSucceeded(invoice) {
        console.log('Payment succeeded:', invoice.id);
        // Handle recurring subscription payments
    }

    async handlePaymentFailed(invoice) {
        console.log('Payment failed:', invoice.id);
        // Handle failed payments, send notifications, etc.
    }

    async handleSubscriptionCanceled(subscription) {
        console.log('Subscription canceled:', subscription.id);
        // Downgrade user tier, update features, etc.
    }

    async getCustomerData(walletAddress) {
        const customerKey = `customer_${walletAddress}`;
        const customer = this.customers.get(customerKey);
        
        if (!customer) {
            return {
                walletAddress,
                tier: 'free',
                credits: 10,
                subscriptions: [],
                payments: []
            };
        }
        
        return customer;
    }

    async consumeCredits(req, res) {
        const { amount = 1, purpose = 'api_call' } = req.body;
        const walletAddress = req.walletAddress;
        
        const customer = await this.getCustomerData(walletAddress);
        
        // Check if user has unlimited credits
        if (customer.credits === -1) {
            return { success: true, remaining: -1, unlimited: true };
        }
        
        // Check if user has enough credits
        if (customer.credits < amount) {
            return { 
                success: false, 
                error: 'Insufficient credits',
                remaining: customer.credits,
                required: amount
            };
        }
        
        // Consume credits
        customer.credits -= amount;
        
        // Update customer
        const customerKey = `customer_${walletAddress}`;
        this.customers.set(customerKey, customer);
        
        // Log usage
        console.log(`💳 ${walletAddress} used ${amount} credits for ${purpose}. Remaining: ${customer.credits}`);
        
        return { 
            success: true, 
            consumed: amount, 
            remaining: customer.credits,
            purpose
        };
    }

    async checkFeatureAccess(walletAddress, feature) {
        const customer = await this.getCustomerData(walletAddress);
        const tier = customer.tier;
        
        // Feature access logic
        switch (tier) {
            case 'founder':
                return true; // Founders get everything
            
            case 'premium':
                return this.config.features.premium.includes(feature) || 
                       this.config.features.founder.includes(feature);
            
            case 'free':
            default:
                return ['basic_job_applications', 'limited_processing'].includes(feature);
        }
    }

    async createCustomerPortal(req, res) {
        const walletAddress = req.walletAddress;
        const customer = await this.getCustomerData(walletAddress);
        
        if (!customer.stripeCustomerId) {
            throw new Error('No Stripe customer found');
        }
        
        const portalSession = await this.stripe.billingPortal.sessions.create({
            customer: customer.stripeCustomerId,
            return_url: req.body.returnUrl || `${req.headers.origin}/account`
        });
        
        return portalSession;
    }

    async getUsageAnalytics(walletAddress) {
        const customer = await this.getCustomerData(walletAddress);
        
        // Calculate analytics
        const totalSpent = customer.payments.reduce((sum, payment) => sum + payment.amount, 0);
        const paymentCount = customer.payments.length;
        const avgPayment = paymentCount > 0 ? totalSpent / paymentCount : 0;
        
        return {
            tier: customer.tier,
            credits: customer.credits,
            totalSpent,
            paymentCount,
            avgPayment,
            joinDate: customer.payments[0]?.timestamp || Date.now(),
            lastPayment: customer.payments[customer.payments.length - 1]?.timestamp
        };
    }

    start(port = 3003) {
        this.app.listen(port, () => {
            console.log(`🚀 Stripe API Backend running on port ${port}`);
            console.log(`📊 Webhook endpoint: http://localhost:${port}${this.config.stripe.webhookPath}`);
        });
    }
}

// Export the class and create instance if run directly
module.exports = StripeAPIBackend;

if (require.main === module) {
    const backend = new StripeAPIBackend();
    backend.start(process.env.PORT || 3003);
}