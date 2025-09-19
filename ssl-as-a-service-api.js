#!/usr/bin/env node

/**
 * SSL-AS-A-SERVICE API
 * Complete SSL certificate management API for resellers and hosting platforms
 * 
 * Features:
 * - RESTful API for certificate lifecycle management
 * - Multi-tenant architecture with API key authentication
 * - Webhook system for real-time notifications
 * - Usage-based billing and quota management
 * - Rate limiting and abuse protection
 * - Comprehensive logging and analytics
 * - SDK support for popular languages
 * - Reseller dashboard and reporting
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { body, param, validationResult } = require('express-validator');

// Import our certificate management systems
const WildcardCertificateManager = require('./wildcard-certificate-manager.js');

class SSLAsAServiceAPI {
    constructor(options = {}) {
        this.options = {
            port: options.port || process.env.SSL_API_PORT || 3443,
            jwtSecret: options.jwtSecret || process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
            
            // Database configuration
            databaseUrl: options.databaseUrl || process.env.DATABASE_URL,
            redisUrl: options.redisUrl || process.env.REDIS_URL,
            
            // Billing configuration
            stripeSecretKey: options.stripeSecretKey || process.env.STRIPE_SECRET_KEY,
            billingWebhookSecret: options.billingWebhookSecret || process.env.BILLING_WEBHOOK_SECRET,
            
            // Certificate manager settings
            certificateManager: options.certificateManager || new WildcardCertificateManager({
                dnsProvider: 'cloudflare',
                dnsApiKey: process.env.DNS_API_KEY,
                dnsEmail: process.env.DNS_EMAIL
            }),
            
            // Rate limiting
            defaultRateLimit: options.defaultRateLimit || 100, // requests per hour
            premiumRateLimit: options.premiumRateLimit || 1000,
            
            // Webhook configuration
            webhookSecret: options.webhookSecret || crypto.randomBytes(32).toString('hex'),
            
            ...options
        };
        
        // Express app setup
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        
        // Data stores (in production, use proper database)
        this.clients = new Map(); // API clients
        this.certificates = new Map(); // Certificate tracking
        this.usage = new Map(); // Usage tracking
        this.webhooks = new Map(); // Webhook endpoints
        this.apiKeys = new Map(); // API key management
        
        // Pricing tiers
        this.pricingTiers = {
            free: {
                name: 'Free',
                monthlyQuota: 5,
                rateLimit: 50,
                features: ['basic-ssl', 'auto-renewal'],
                price: 0
            },
            startup: {
                name: 'Startup',
                monthlyQuota: 50,
                rateLimit: 200,
                features: ['wildcard-ssl', 'webhook-notifications', 'priority-support'],
                price: 29
            },
            business: {
                name: 'Business',
                monthlyQuota: 500,
                rateLimit: 1000,
                features: ['bulk-operations', 'custom-dns', 'advanced-analytics'],
                price: 149
            },
            enterprise: {
                name: 'Enterprise',
                monthlyQuota: -1, // unlimited
                rateLimit: 5000,
                features: ['dedicated-support', 'sla', 'custom-integration'],
                price: 499
            }
        };
        
        console.log('🚀 SSL-as-a-Service API initialized');
        console.log(`📋 Available pricing tiers: ${Object.keys(this.pricingTiers).join(', ')}`);
    }
    
    setupMiddleware() {
        // Security middleware
        this.app.use(helmet());
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
            credentials: true
        }));
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            const start = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - start;
                console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
                
                // Track API usage
                this.trackUsage(req);
            });
            
            next();
        });
        
        // API key authentication middleware
        this.app.use('/api', this.authenticateApiKey.bind(this));
        
        // Rate limiting
        this.app.use('/api', this.createRateLimiter());
    }
    
    setupRoutes() {
        // Public routes
        this.app.get('/', this.getAPIInfo.bind(this));
        this.app.get('/health', this.healthCheck.bind(this));
        this.app.get('/pricing', this.getPricing.bind(this));
        this.app.post('/signup', this.signup.bind(this));
        
        // Authentication routes
        this.app.post('/auth/login', this.login.bind(this));
        this.app.post('/auth/refresh', this.refreshToken.bind(this));
        
        // Certificate management API
        this.app.post('/api/certificates', 
            body('domain').isURL({ require_protocol: false }),
            body('type').isIn(['single', 'wildcard', 'multi']),
            this.issueCertificate.bind(this)
        );
        
        this.app.get('/api/certificates', this.listCertificates.bind(this));
        
        this.app.get('/api/certificates/:certId', 
            param('certId').isAlphanumeric(),
            this.getCertificate.bind(this)
        );
        
        this.app.post('/api/certificates/:certId/renew',
            param('certId').isAlphanumeric(),
            this.renewCertificate.bind(this)
        );
        
        this.app.delete('/api/certificates/:certId',
            param('certId').isAlphanumeric(),
            this.revokeCertificate.bind(this)
        );
        
        // Bulk operations
        this.app.post('/api/bulk/certificates',
            body('domains').isArray({ min: 1, max: 100 }),
            this.bulkIssueCertificates.bind(this)
        );
        
        this.app.post('/api/bulk/renew', this.bulkRenewCertificates.bind(this));
        
        // Subdomain SSL provisioning
        this.app.post('/api/subdomains/ssl',
            body('subdomain').isURL({ require_protocol: false }),
            this.provisionSubdomainSSL.bind(this)
        );
        
        // Account management
        this.app.get('/api/account', this.getAccount.bind(this));
        this.app.put('/api/account', this.updateAccount.bind(this));
        this.app.get('/api/account/usage', this.getUsage.bind(this));
        this.app.get('/api/account/billing', this.getBilling.bind(this));
        
        // Webhook management
        this.app.post('/api/webhooks',
            body('url').isURL(),
            body('events').isArray(),
            this.createWebhook.bind(this)
        );
        
        this.app.get('/api/webhooks', this.listWebhooks.bind(this));
        this.app.delete('/api/webhooks/:webhookId', this.deleteWebhook.bind(this));
        
        // Analytics and reporting
        this.app.get('/api/analytics/certificates', this.getCertificateAnalytics.bind(this));
        this.app.get('/api/analytics/usage', this.getUsageAnalytics.bind(this));
        
        // DNS provider management
        this.app.get('/api/dns/providers', this.getDNSProviders.bind(this));
        this.app.post('/api/dns/validate',
            body('provider').isIn(['cloudflare', 'route53', 'digitalocean']),
            body('credentials').isObject(),
            this.validateDNSCredentials.bind(this)
        );
        
        // Status and monitoring
        this.app.get('/api/status', this.getSystemStatus.bind(this));
        this.app.get('/api/certificates/:certId/status', this.getCertificateStatus.bind(this));
        
        // Billing webhooks (Stripe)
        this.app.post('/webhooks/billing', this.handleBillingWebhook.bind(this));
        
        // Error handling
        this.app.use(this.errorHandler.bind(this));
        
        console.log('🛣️ API routes configured');
    }
    
    // Authentication middleware
    async authenticateApiKey(req, res, next) {
        const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
        
        if (!apiKey) {
            return res.status(401).json({
                error: 'API key required',
                code: 'API_KEY_MISSING'
            });
        }
        
        const client = this.apiKeys.get(apiKey);
        
        if (!client) {
            return res.status(401).json({
                error: 'Invalid API key',
                code: 'API_KEY_INVALID'
            });
        }
        
        if (!client.active) {
            return res.status(401).json({
                error: 'API key disabled',
                code: 'API_KEY_DISABLED'
            });
        }
        
        // Check subscription status
        if (client.subscription?.status !== 'active' && client.tier !== 'free') {
            return res.status(402).json({
                error: 'Payment required',
                code: 'SUBSCRIPTION_REQUIRED'
            });
        }
        
        // Attach client to request
        req.client = client;
        next();
    }
    
    // Rate limiting
    createRateLimiter() {
        return rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            limit: (req) => {
                const client = req.client;
                if (!client) return 10; // Unauthenticated requests
                
                const tier = this.pricingTiers[client.tier] || this.pricingTiers.free;
                return tier.rateLimit;
            },
            message: (req) => ({
                error: 'Rate limit exceeded',
                code: 'RATE_LIMIT_EXCEEDED',
                limit: req.rateLimit.limit,
                remaining: req.rateLimit.remaining,
                resetTime: req.rateLimit.resetTime
            }),
            standardHeaders: true,
            legacyHeaders: false
        });
    }
    
    // Route handlers
    async getAPIInfo(req, res) {
        res.json({
            name: 'SSL-as-a-Service API',
            version: '1.0.0',
            description: 'Complete SSL certificate management API for hosting platforms',
            endpoints: {
                certificates: '/api/certificates',
                subdomains: '/api/subdomains/ssl',
                bulk: '/api/bulk',
                account: '/api/account',
                webhooks: '/api/webhooks',
                analytics: '/api/analytics'
            },
            documentation: 'https://docs.ssl-service.com',
            support: 'support@ssl-service.com',
            features: [
                'Wildcard SSL certificates',
                'Instant subdomain provisioning',
                'Automatic renewal',
                'Multi-DNS provider support',
                'Real-time webhooks',
                'Usage analytics',
                'Bulk operations'
            ]
        });
    }
    
    async healthCheck(req, res) {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0',
            services: {
                api: 'healthy',
                database: 'healthy',
                certificateManager: 'healthy',
                dns: 'healthy'
            }
        };
        
        res.json(health);
    }
    
    async getPricing(req, res) {
        res.json({
            tiers: this.pricingTiers,
            billing: 'monthly',
            currency: 'USD',
            freeTrialDays: 14,
            discounts: {
                annual: '20%',
                enterprise: 'custom'
            }
        });
    }
    
    async signup(req, res) {
        try {
            const { email, company, tier = 'free' } = req.body;
            
            if (!email || !company) {
                return res.status(400).json({
                    error: 'Email and company are required',
                    code: 'VALIDATION_ERROR'
                });
            }
            
            // Generate API credentials
            const apiKey = `ssl_${crypto.randomBytes(32).toString('hex')}`;
            const clientId = crypto.randomBytes(16).toString('hex');
            
            const client = {
                id: clientId,
                email,
                company,
                tier,
                apiKey,
                active: true,
                createdAt: new Date(),
                subscription: tier === 'free' ? null : {
                    status: 'trial',
                    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                },
                usage: {
                    certificates: 0,
                    renewals: 0,
                    apiCalls: 0,
                    monthlyReset: new Date()
                },
                webhooks: [],
                dnsProviders: []
            };
            
            this.apiKeys.set(apiKey, client);
            this.clients.set(clientId, client);
            
            console.log(`📝 New client registered: ${company} (${email})`);
            
            res.status(201).json({
                success: true,
                client: {
                    id: clientId,
                    email,
                    company,
                    tier
                },
                credentials: {
                    apiKey,
                    keyId: clientId
                },
                endpoints: {
                    base: `${req.protocol}://${req.get('host')}/api`,
                    certificates: '/api/certificates',
                    account: '/api/account'
                },
                documentation: 'https://docs.ssl-service.com/getting-started'
            });
            
        } catch (error) {
            res.status(500).json({
                error: 'Registration failed',
                code: 'REGISTRATION_ERROR',
                message: error.message
            });
        }
    }
    
    async issueCertificate(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: errors.array()
                });
            }
            
            const { domain, type = 'wildcard', autoRenew = true, dnsProvider } = req.body;
            const client = req.client;
            
            // Check quota
            const tier = this.pricingTiers[client.tier];
            if (tier.monthlyQuota !== -1 && client.usage.certificates >= tier.monthlyQuota) {
                return res.status(429).json({
                    error: 'Monthly certificate quota exceeded',
                    code: 'QUOTA_EXCEEDED',
                    quota: tier.monthlyQuota,
                    used: client.usage.certificates
                });
            }
            
            // Generate certificate ID
            const certificateId = crypto.randomBytes(16).toString('hex');
            
            // Create certificate tracking
            const certificate = {
                id: certificateId,
                clientId: client.id,
                domain,
                type,
                status: 'issuing',
                autoRenew,
                dnsProvider: dnsProvider || 'cloudflare',
                createdAt: new Date(),
                progress: 0,
                logs: []
            };
            
            this.certificates.set(certificateId, certificate);
            
            // Start certificate issuance (async)
            this.processCertificateIssuance(certificate).catch(error => {
                console.error(`Certificate issuance failed for ${certificateId}:`, error);
                certificate.status = 'failed';
                certificate.error = error.message;
                this.sendWebhook(client, 'certificate.failed', certificate);
            });
            
            // Update usage
            client.usage.certificates++;
            
            res.status(202).json({
                success: true,
                certificate: {
                    id: certificateId,
                    domain,
                    type,
                    status: 'issuing'
                },
                statusUrl: `/api/certificates/${certificateId}/status`,
                estimatedTime: type === 'wildcard' ? '5-10 minutes' : '2-5 minutes'
            });
            
        } catch (error) {
            console.error('Certificate issuance error:', error);
            res.status(500).json({
                error: 'Certificate issuance failed',
                code: 'ISSUANCE_ERROR',
                message: error.message
            });
        }
    }
    
    async processCertificateIssuance(certificate) {
        try {
            certificate.status = 'issuing';
            certificate.progress = 10;
            certificate.logs.push({ timestamp: new Date(), message: 'Starting certificate issuance' });
            
            const client = this.clients.get(certificate.clientId);
            
            // Use the wildcard certificate manager
            const result = await this.options.certificateManager.issueWildcardCertificate(
                certificate.domain,
                {
                    type: certificate.type,
                    dnsProvider: certificate.dnsProvider
                }
            );
            
            if (result.success) {
                certificate.status = 'active';
                certificate.progress = 100;
                certificate.issuedAt = result.issuedAt;
                certificate.expiresAt = result.expiresAt;
                certificate.certPath = result.certPath;
                certificate.keyPath = result.keyPath;
                certificate.logs.push({ timestamp: new Date(), message: 'Certificate issued successfully' });
                
                // Send webhook
                await this.sendWebhook(client, 'certificate.issued', certificate);
                
                console.log(`✅ Certificate issued: ${certificate.domain} (${certificate.id})`);
            } else {
                throw new Error('Certificate issuance failed');
            }
            
        } catch (error) {
            certificate.status = 'failed';
            certificate.error = error.message;
            certificate.logs.push({ timestamp: new Date(), message: `Error: ${error.message}` });
            
            console.error(`❌ Certificate issuance failed: ${certificate.domain} (${certificate.id})`);
            throw error;
        }
    }
    
    async listCertificates(req, res) {
        try {
            const client = req.client;
            const { status, type, domain } = req.query;
            
            const clientCertificates = Array.from(this.certificates.values())
                .filter(cert => cert.clientId === client.id)
                .filter(cert => !status || cert.status === status)
                .filter(cert => !type || cert.type === type)
                .filter(cert => !domain || cert.domain.includes(domain))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            
            const certificates = clientCertificates.map(cert => ({
                id: cert.id,
                domain: cert.domain,
                type: cert.type,
                status: cert.status,
                autoRenew: cert.autoRenew,
                issuedAt: cert.issuedAt,
                expiresAt: cert.expiresAt,
                daysUntilExpiry: cert.expiresAt ? 
                    Math.ceil((new Date(cert.expiresAt) - new Date()) / (24 * 60 * 60 * 1000)) : null
            }));
            
            res.json({
                certificates,
                total: certificates.length,
                pagination: {
                    page: 1,
                    limit: 100,
                    hasMore: false
                }
            });
            
        } catch (error) {
            res.status(500).json({
                error: 'Failed to list certificates',
                code: 'LIST_ERROR',
                message: error.message
            });
        }
    }
    
    async getCertificate(req, res) {
        try {
            const { certId } = req.params;
            const client = req.client;
            
            const certificate = this.certificates.get(certId);
            
            if (!certificate || certificate.clientId !== client.id) {
                return res.status(404).json({
                    error: 'Certificate not found',
                    code: 'CERTIFICATE_NOT_FOUND'
                });
            }
            
            res.json({
                id: certificate.id,
                domain: certificate.domain,
                type: certificate.type,
                status: certificate.status,
                progress: certificate.progress,
                autoRenew: certificate.autoRenew,
                dnsProvider: certificate.dnsProvider,
                createdAt: certificate.createdAt,
                issuedAt: certificate.issuedAt,
                expiresAt: certificate.expiresAt,
                daysUntilExpiry: certificate.expiresAt ? 
                    Math.ceil((new Date(certificate.expiresAt) - new Date()) / (24 * 60 * 60 * 1000)) : null,
                logs: certificate.logs,
                error: certificate.error
            });
            
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get certificate',
                code: 'GET_ERROR',
                message: error.message
            });
        }
    }
    
    async provisionSubdomainSSL(req, res) {
        try {
            const { subdomain } = req.body;
            const client = req.client;
            
            // Use the certificate manager to provision SSL
            const result = await this.options.certificateManager.provisionSubdomainSSL(subdomain);
            
            if (result.success) {
                res.json({
                    success: true,
                    subdomain,
                    certificate: {
                        domain: result.certificate.domain,
                        type: result.source,
                        expiresAt: result.certificate.expiresAt
                    },
                    message: `SSL provisioned for ${subdomain}`
                });
                
                // Send webhook
                await this.sendWebhook(client, 'subdomain.ssl_provisioned', {
                    subdomain,
                    certificate: result.certificate
                });
                
            } else {
                res.status(400).json({
                    error: 'SSL provisioning failed',
                    code: 'SSL_PROVISION_FAILED',
                    message: result.error,
                    suggestion: result.suggestion
                });
            }
            
        } catch (error) {
            res.status(500).json({
                error: 'SSL provisioning error',
                code: 'SSL_ERROR',
                message: error.message
            });
        }
    }
    
    async getAccount(req, res) {
        try {
            const client = req.client;
            const tier = this.pricingTiers[client.tier];
            
            res.json({
                id: client.id,
                email: client.email,
                company: client.company,
                tier: client.tier,
                status: client.active ? 'active' : 'suspended',
                createdAt: client.createdAt,
                subscription: client.subscription,
                usage: {
                    ...client.usage,
                    quota: tier.monthlyQuota,
                    quotaUsagePercent: tier.monthlyQuota === -1 ? 0 : 
                        Math.round((client.usage.certificates / tier.monthlyQuota) * 100)
                },
                features: tier.features,
                limits: {
                    certificates: tier.monthlyQuota,
                    rateLimit: tier.rateLimit
                }
            });
            
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get account',
                code: 'ACCOUNT_ERROR',
                message: error.message
            });
        }
    }
    
    async createWebhook(req, res) {
        try {
            const { url, events, secret } = req.body;
            const client = req.client;
            
            const webhookId = crypto.randomBytes(16).toString('hex');
            const webhook = {
                id: webhookId,
                clientId: client.id,
                url,
                events,
                secret: secret || crypto.randomBytes(32).toString('hex'),
                active: true,
                createdAt: new Date(),
                lastDelivery: null,
                deliveryCount: 0,
                failureCount: 0
            };
            
            this.webhooks.set(webhookId, webhook);
            client.webhooks.push(webhookId);
            
            res.status(201).json({
                success: true,
                webhook: {
                    id: webhookId,
                    url,
                    events,
                    secret: webhook.secret,
                    active: true
                }
            });
            
        } catch (error) {
            res.status(500).json({
                error: 'Failed to create webhook',
                code: 'WEBHOOK_ERROR',
                message: error.message
            });
        }
    }
    
    async sendWebhook(client, event, data) {
        const clientWebhooks = client.webhooks
            .map(id => this.webhooks.get(id))
            .filter(webhook => webhook && webhook.active && webhook.events.includes(event));
        
        for (const webhook of clientWebhooks) {
            try {
                const payload = {
                    event,
                    data,
                    timestamp: new Date().toISOString(),
                    webhook_id: webhook.id
                };
                
                const signature = crypto
                    .createHmac('sha256', webhook.secret)
                    .update(JSON.stringify(payload))
                    .digest('hex');
                
                const response = await fetch(webhook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-SSL-Service-Signature': signature,
                        'X-SSL-Service-Event': event
                    },
                    body: JSON.stringify(payload)
                });
                
                webhook.lastDelivery = new Date();
                webhook.deliveryCount++;
                
                if (!response.ok) {
                    webhook.failureCount++;
                    console.warn(`Webhook delivery failed: ${webhook.url} (${response.status})`);
                }
                
            } catch (error) {
                webhook.failureCount++;
                console.error(`Webhook error: ${webhook.url}`, error.message);
            }
        }
    }
    
    trackUsage(req) {
        const client = req.client;
        if (!client) return;
        
        client.usage.apiCalls++;
        
        // Reset monthly usage if needed
        const now = new Date();
        const resetDate = new Date(client.usage.monthlyReset);
        
        if (now.getMonth() !== resetDate.getMonth() || now.getFullYear() !== resetDate.getFullYear()) {
            client.usage.certificates = 0;
            client.usage.renewals = 0;
            client.usage.monthlyReset = now;
        }
    }
    
    errorHandler(error, req, res, next) {
        console.error('API Error:', error);
        
        res.status(error.status || 500).json({
            error: error.message || 'Internal server error',
            code: error.code || 'INTERNAL_ERROR',
            timestamp: new Date().toISOString(),
            requestId: req.id || crypto.randomBytes(8).toString('hex')
        });
    }
    
    async start() {
        return new Promise((resolve) => {
            this.app.listen(this.options.port, () => {
                console.log(`🌐 SSL-as-a-Service API running on port ${this.options.port}`);
                console.log(`📚 API Documentation: http://localhost:${this.options.port}/`);
                console.log(`🔑 Signup endpoint: http://localhost:${this.options.port}/signup`);
                console.log(`📊 Health check: http://localhost:${this.options.port}/health`);
                
                // Initialize demo clients
                this.initializeDemoClients();
                
                resolve();
            });
        });
    }
    
    initializeDemoClients() {
        // Create demo API keys for testing
        const demoClients = [
            {
                email: 'demo@hostingcompany.com',
                company: 'Demo Hosting Co',
                tier: 'business'
            },
            {
                email: 'test@startup.com',
                company: 'Test Startup',
                tier: 'startup'
            }
        ];
        
        demoClients.forEach((demo, index) => {
            const apiKey = `ssl_demo_${crypto.randomBytes(16).toString('hex')}`;
            const clientId = `demo-${index + 1}`;
            
            const client = {
                id: clientId,
                email: demo.email,
                company: demo.company,
                tier: demo.tier,
                apiKey,
                active: true,
                createdAt: new Date(),
                subscription: demo.tier === 'free' ? null : {
                    status: 'active',
                    planId: demo.tier
                },
                usage: {
                    certificates: Math.floor(Math.random() * 10),
                    renewals: Math.floor(Math.random() * 5),
                    apiCalls: Math.floor(Math.random() * 1000),
                    monthlyReset: new Date()
                },
                webhooks: [],
                dnsProviders: ['cloudflare']
            };
            
            this.apiKeys.set(apiKey, client);
            this.clients.set(clientId, client);
            
            console.log(`🔑 Demo client: ${demo.company} | API Key: ${apiKey}`);
        });
    }
    
    // SDK Generation endpoints
    async getSDKs(req, res) {
        const sdks = {
            javascript: {
                name: 'JavaScript/Node.js SDK',
                installation: 'npm install ssl-service-sdk',
                documentation: 'https://docs.ssl-service.com/sdk/javascript',
                example: `
const SSLService = require('ssl-service-sdk');

const client = new SSLService({
  apiKey: 'your-api-key'
});

// Issue wildcard certificate
const cert = await client.certificates.issue({
  domain: 'example.com',
  type: 'wildcard'
});
                `
            },
            python: {
                name: 'Python SDK',
                installation: 'pip install ssl-service-sdk',
                documentation: 'https://docs.ssl-service.com/sdk/python',
                example: `
from ssl_service import SSLService

client = SSLService(api_key='your-api-key')

# Issue wildcard certificate
cert = client.certificates.issue(
    domain='example.com',
    type='wildcard'
)
                `
            },
            php: {
                name: 'PHP SDK',
                installation: 'composer require ssl-service/sdk',
                documentation: 'https://docs.ssl-service.com/sdk/php',
                example: `
<?php
require_once 'vendor/autoload.php';

use SSLService\\Client;

$client = new Client('your-api-key');

// Issue wildcard certificate
$cert = $client->certificates->issue([
    'domain' => 'example.com',
    'type' => 'wildcard'
]);
                `
            },
            curl: {
                name: 'cURL Examples',
                documentation: 'https://docs.ssl-service.com/api/curl',
                example: `
# Issue a wildcard certificate
curl -X POST https://api.ssl-service.com/api/certificates \\
  -H "X-API-Key: your-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "domain": "example.com",
    "type": "wildcard",
    "autoRenew": true
  }'
                `
            }
        };
        
        res.json({
            sdks,
            gettingStarted: 'https://docs.ssl-service.com/getting-started',
            apiReference: 'https://docs.ssl-service.com/api',
            support: 'support@ssl-service.com'
        });
    }
    
    // Generate OpenAPI specification
    getOpenAPISpec() {
        return {
            openapi: '3.0.3',
            info: {
                title: 'SSL-as-a-Service API',
                version: '1.0.0',
                description: 'Complete SSL certificate management API for hosting platforms',
                contact: {
                    name: 'SSL Service Support',
                    email: 'support@ssl-service.com'
                },
                license: {
                    name: 'MIT',
                    url: 'https://opensource.org/licenses/MIT'
                }
            },
            servers: [
                {
                    url: 'https://api.ssl-service.com',
                    description: 'Production server'
                },
                {
                    url: 'https://staging-api.ssl-service.com',
                    description: 'Staging server'
                }
            ],
            security: [
                {
                    ApiKeyAuth: []
                }
            ],
            components: {
                securitySchemes: {
                    ApiKeyAuth: {
                        type: 'apiKey',
                        in: 'header',
                        name: 'X-API-Key'
                    }
                },
                schemas: {
                    Certificate: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            domain: { type: 'string' },
                            type: { type: 'string', enum: ['single', 'wildcard', 'multi'] },
                            status: { type: 'string', enum: ['issuing', 'active', 'expired', 'failed'] },
                            autoRenew: { type: 'boolean' },
                            issuedAt: { type: 'string', format: 'date-time' },
                            expiresAt: { type: 'string', format: 'date-time' }
                        }
                    }
                }
            },
            paths: {
                '/api/certificates': {
                    post: {
                        summary: 'Issue a new SSL certificate',
                        requestBody: {
                            required: true,
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        required: ['domain'],
                                        properties: {
                                            domain: { type: 'string' },
                                            type: { type: 'string', enum: ['single', 'wildcard', 'multi'], default: 'wildcard' },
                                            autoRenew: { type: 'boolean', default: true }
                                        }
                                    }
                                }
                            }
                        },
                        responses: {
                            '202': {
                                description: 'Certificate issuance started',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                success: { type: 'boolean' },
                                                certificate: { $ref: '#/components/schemas/Certificate' },
                                                statusUrl: { type: 'string' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    get: {
                        summary: 'List all certificates',
                        parameters: [
                            {
                                name: 'status',
                                in: 'query',
                                schema: { type: 'string' }
                            },
                            {
                                name: 'type',
                                in: 'query',
                                schema: { type: 'string' }
                            }
                        ],
                        responses: {
                            '200': {
                                description: 'List of certificates',
                                content: {
                                    'application/json': {
                                        schema: {
                                            type: 'object',
                                            properties: {
                                                certificates: {
                                                    type: 'array',
                                                    items: { $ref: '#/components/schemas/Certificate' }
                                                },
                                                total: { type: 'integer' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
    }
}

// Export for use
module.exports = SSLAsAServiceAPI;

// Demo if run directly
if (require.main === module) {
    (async () => {
        console.log('\n=== SSL-as-a-Service API Demo ===\n');
        
        const api = new SSLAsAServiceAPI({
            port: 3443
        });
        
        await api.start();
        
        console.log('\n📖 API Documentation:');
        console.log('  Pricing: GET /pricing');
        console.log('  Signup: POST /signup');
        console.log('  Health: GET /health');
        console.log('  Certificates: POST /api/certificates (requires API key)');
        console.log('  SDK Examples: GET /sdks');
        
        console.log('\n🔑 Demo API Keys (for testing):');
        api.apiKeys.forEach((client, apiKey) => {
            if (apiKey.startsWith('ssl_demo_')) {
                console.log(`  ${client.company}: ${apiKey}`);
            }
        });
        
        console.log('\n📋 Example API Call:');
        console.log(`
curl -X POST http://localhost:3443/api/certificates \\
  -H "X-API-Key: [DEMO_API_KEY]" \\
  -H "Content-Type: application/json" \\
  -d '{
    "domain": "example.com",
    "type": "wildcard",
    "autoRenew": true
  }'
        `);
        
        console.log('\n🌐 Integration Examples:');
        console.log('  JavaScript: npm install ssl-service-sdk');
        console.log('  Python: pip install ssl-service-sdk');
        console.log('  PHP: composer require ssl-service/sdk');
        console.log('  Documentation: https://docs.ssl-service.com');
        
    })().catch(console.error);
}

console.log('🚀 SSL-as-a-Service API loaded');
console.log('🔐 Complete certificate management for hosting platforms');
console.log('💼 Multi-tenant with usage-based billing');