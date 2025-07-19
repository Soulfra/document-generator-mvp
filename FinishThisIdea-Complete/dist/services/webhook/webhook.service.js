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
exports.WebhookService = void 0;
const events_1 = require("events");
const crypto = __importStar(require("crypto"));
const client_1 = require("@prisma/client");
const bull_1 = __importDefault(require("bull"));
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../../utils/logger");
const metrics_service_1 = require("../monitoring/metrics.service");
class WebhookService extends events_1.EventEmitter {
    prisma;
    metricsService;
    deliveryQueue;
    webhooks = new Map();
    deliveries = new Map();
    endpoints = new Map();
    eventTypes = [
        'user.registered',
        'user.upgraded',
        'user.downgraded',
        'user.deleted',
        'code.analyzed',
        'code.cleaned',
        'code.error',
        'project.created',
        'project.updated',
        'project.deleted',
        'project.shared',
        'ai.query',
        'ai.response',
        'ai.error',
        'arena.fighter.created',
        'arena.battle.started',
        'arena.battle.completed',
        'arena.tournament.started',
        'payment.success',
        'payment.failed',
        'subscription.created',
        'subscription.cancelled',
        'system.maintenance',
        'system.update',
        'api.limit.reached'
    ];
    constructor() {
        super();
        this.prisma = new client_1.PrismaClient();
        this.metricsService = new metrics_service_1.MetricsService();
        this.deliveryQueue = new bull_1.default('webhook-delivery', {
            redis: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379')
            },
            defaultJobOptions: {
                removeOnComplete: true,
                removeOnFail: false,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000
                }
            }
        });
        this.setupQueueProcessors();
        this.registerDefaultEndpoints();
    }
    setupQueueProcessors() {
        this.deliveryQueue.process('deliver-webhook', async (job) => {
            const { delivery, webhook, event } = job.data;
            return await this.processWebhookDelivery(delivery, webhook, event);
        });
        this.deliveryQueue.on('completed', (job, result) => {
            logger_1.logger.info('Webhook delivered successfully', {
                deliveryId: result.id,
                webhookId: result.webhookId
            });
        });
        this.deliveryQueue.on('failed', (job, err) => {
            logger_1.logger.error('Webhook delivery failed', {
                error: err.message,
                attempts: job.attemptsMade
            });
        });
    }
    async registerWebhook(options) {
        try {
            const urlObj = new URL(options.url);
            if (!['http:', 'https:'].includes(urlObj.protocol)) {
                throw new Error('Invalid webhook URL protocol');
            }
            const invalidEvents = options.events.filter(e => !this.eventTypes.includes(e));
            if (invalidEvents.length > 0) {
                throw new Error(`Invalid event types: ${invalidEvents.join(', ')}`);
            }
            const webhook = {
                id: `webhook-${crypto.randomBytes(8).toString('hex')}`,
                url: options.url,
                secret: options.secret || this.generateSecret(),
                events: options.events,
                active: true,
                headers: options.headers,
                retryConfig: {
                    maxRetries: 3,
                    retryDelay: 2000,
                    backoffMultiplier: 2
                },
                createdBy: options.userId,
                createdAt: new Date(),
                failureCount: 0
            };
            const testResult = await this.testWebhook(webhook);
            if (!testResult.success) {
                throw new Error(`Webhook test failed: ${testResult.error}`);
            }
            this.webhooks.set(webhook.id, webhook);
            await this.saveWebhook(webhook);
            logger_1.logger.info('Webhook registered', {
                webhookId: webhook.id,
                url: webhook.url,
                events: webhook.events
            });
            return webhook;
        }
        catch (error) {
            logger_1.logger.error('Error registering webhook', error);
            throw error;
        }
    }
    async updateWebhook(webhookId, updates) {
        const webhook = this.webhooks.get(webhookId);
        if (!webhook) {
            throw new Error('Webhook not found');
        }
        Object.assign(webhook, updates);
        await this.saveWebhook(webhook);
        logger_1.logger.info('Webhook updated', { webhookId });
        return webhook;
    }
    async deleteWebhook(webhookId, userId) {
        const webhook = this.webhooks.get(webhookId);
        if (!webhook) {
            throw new Error('Webhook not found');
        }
        if (webhook.createdBy !== userId) {
            throw new Error('Unauthorized to delete this webhook');
        }
        this.webhooks.delete(webhookId);
        await this.removeWebhook(webhookId);
        logger_1.logger.info('Webhook deleted', { webhookId });
    }
    async triggerEvent(event) {
        try {
            logger_1.logger.info('Triggering webhook event', {
                eventType: event.type,
                eventId: event.id
            });
            const matchingWebhooks = Array.from(this.webhooks.values()).filter(webhook => webhook.active && webhook.events.includes(event.type));
            if (matchingWebhooks.length === 0) {
                logger_1.logger.debug('No webhooks registered for event', { eventType: event.type });
                return;
            }
            for (const webhook of matchingWebhooks) {
                const delivery = {
                    id: `delivery-${crypto.randomBytes(8).toString('hex')}`,
                    webhookId: webhook.id,
                    eventId: event.id,
                    url: webhook.url,
                    status: 'pending',
                    attempts: 0
                };
                this.deliveries.set(delivery.id, delivery);
                await this.deliveryQueue.add('deliver-webhook', {
                    delivery,
                    webhook,
                    event
                });
            }
            this.metricsService.recordMetric({
                name: 'webhook.event.triggered',
                value: 1,
                tags: {
                    eventType: event.type,
                    webhookCount: matchingWebhooks.length.toString()
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error triggering webhook event', error);
        }
    }
    async processWebhookDelivery(delivery, webhook, event) {
        try {
            delivery.attempts++;
            delivery.status = 'retrying';
            const payload = {
                id: event.id,
                type: event.type,
                payload: event.payload,
                timestamp: event.timestamp,
                metadata: event.metadata
            };
            const signature = this.generateSignature(payload, webhook.secret);
            const headers = {
                'Content-Type': 'application/json',
                'X-Webhook-Id': webhook.id,
                'X-Webhook-Signature': signature,
                'X-Event-Type': event.type,
                'X-Event-Id': event.id,
                ...webhook.headers
            };
            const response = await axios_1.default.post(webhook.url, payload, {
                headers,
                timeout: 30000,
                validateStatus: () => true
            });
            delivery.responseCode = response.status;
            delivery.responseBody = JSON.stringify(response.data).substring(0, 1000);
            if (response.status >= 200 && response.status < 300) {
                delivery.status = 'success';
                delivery.deliveredAt = new Date();
                webhook.lastTriggered = new Date();
                webhook.failureCount = 0;
                logger_1.logger.info('Webhook delivered successfully', {
                    deliveryId: delivery.id,
                    statusCode: response.status
                });
            }
            else {
                delivery.status = 'failed';
                delivery.error = `HTTP ${response.status}: ${response.statusText}`;
                webhook.failureCount++;
                logger_1.logger.warn('Webhook delivery failed', {
                    deliveryId: delivery.id,
                    statusCode: response.status,
                    error: delivery.error
                });
                if (webhook.failureCount >= 10) {
                    webhook.active = false;
                    logger_1.logger.warn('Webhook disabled due to repeated failures', {
                        webhookId: webhook.id
                    });
                }
            }
        }
        catch (error) {
            delivery.status = 'failed';
            delivery.error = error.message;
            webhook.failureCount++;
            logger_1.logger.error('Webhook delivery error', {
                deliveryId: delivery.id,
                error: error.message
            });
            throw error;
        }
        await this.saveWebhook(webhook);
        return delivery;
    }
    async testWebhook(webhook) {
        try {
            const startTime = Date.now();
            const testPayload = {
                type: 'webhook.test',
                timestamp: new Date().toISOString(),
                message: 'Webhook configuration test'
            };
            const signature = this.generateSignature(testPayload, webhook.secret);
            const response = await axios_1.default.post(webhook.url, testPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Event-Type': 'webhook.test'
                },
                timeout: 10000,
                validateStatus: () => true
            });
            const responseTime = Date.now() - startTime;
            if (response.status >= 200 && response.status < 300) {
                return { success: true, responseTime };
            }
            else {
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    generateSignature(payload, secret) {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(payload));
        return `sha256=${hmac.digest('hex')}`;
    }
    verifySignature(payload, signature, secret) {
        const expectedSignature = this.generateSignature(payload, secret);
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    registerDefaultEndpoints() {
        this.registerEndpoint({
            path: '/webhooks/github',
            method: 'POST',
            handler: this.handleGitHubWebhook.bind(this),
            authentication: 'signature'
        });
        this.registerEndpoint({
            path: '/webhooks/stripe',
            method: 'POST',
            handler: this.handleStripeWebhook.bind(this),
            authentication: 'signature'
        });
        this.registerEndpoint({
            path: '/webhooks/discord',
            method: 'POST',
            handler: this.handleDiscordWebhook.bind(this),
            authentication: 'bearer'
        });
        this.registerEndpoint({
            path: '/webhooks/generic',
            method: 'POST',
            handler: this.handleGenericWebhook.bind(this),
            authentication: 'basic'
        });
    }
    registerEndpoint(endpoint) {
        const key = `${endpoint.method}:${endpoint.path}`;
        this.endpoints.set(key, endpoint);
        logger_1.logger.info('Webhook endpoint registered', {
            path: endpoint.path,
            method: endpoint.method
        });
    }
    async handleIncomingWebhook(req, res) {
        const key = `${req.method}:${req.path}`;
        const endpoint = this.endpoints.get(key);
        if (!endpoint) {
            res.status(404).json({ error: 'Webhook endpoint not found' });
            return;
        }
        try {
            if (!this.verifyEndpointAuth(req, endpoint)) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            await endpoint.handler(req, res);
            this.metricsService.recordMetric({
                name: 'webhook.received',
                value: 1,
                tags: {
                    endpoint: endpoint.path,
                    source: this.getWebhookSource(req)
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error handling incoming webhook', {
                endpoint: endpoint.path,
                error: error.message
            });
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async handleGitHubWebhook(req, res) {
        const event = req.headers['x-github-event'];
        const payload = req.body;
        logger_1.logger.info('GitHub webhook received', { event });
        switch (event) {
            case 'push':
                await this.triggerEvent({
                    id: `gh-${Date.now()}`,
                    type: 'github.push',
                    payload,
                    timestamp: new Date(),
                    source: 'github'
                });
                break;
            case 'pull_request':
                await this.triggerEvent({
                    id: `gh-${Date.now()}`,
                    type: 'github.pr',
                    payload,
                    timestamp: new Date(),
                    source: 'github'
                });
                break;
        }
        res.status(200).json({ received: true });
    }
    async handleStripeWebhook(req, res) {
        const event = req.body;
        logger_1.logger.info('Stripe webhook received', { type: event.type });
        const eventMap = {
            'payment_intent.succeeded': 'payment.success',
            'payment_intent.failed': 'payment.failed',
            'customer.subscription.created': 'subscription.created',
            'customer.subscription.deleted': 'subscription.cancelled'
        };
        const internalEvent = eventMap[event.type];
        if (internalEvent) {
            await this.triggerEvent({
                id: `stripe-${event.id}`,
                type: internalEvent,
                payload: event.data,
                timestamp: new Date(),
                source: 'stripe'
            });
        }
        res.status(200).json({ received: true });
    }
    async handleDiscordWebhook(req, res) {
        const payload = req.body;
        logger_1.logger.info('Discord webhook received', { type: payload.type });
        await this.triggerEvent({
            id: `discord-${Date.now()}`,
            type: `discord.${payload.type}`,
            payload,
            timestamp: new Date(),
            source: 'discord'
        });
        res.status(200).json({ received: true });
    }
    async handleGenericWebhook(req, res) {
        const payload = req.body;
        logger_1.logger.info('Generic webhook received');
        await this.triggerEvent({
            id: `generic-${Date.now()}`,
            type: payload.type || 'generic.webhook',
            payload,
            timestamp: new Date(),
            source: 'generic',
            metadata: {
                headers: req.headers,
                query: req.query
            }
        });
        res.status(200).json({ received: true });
    }
    verifyEndpointAuth(req, endpoint) {
        switch (endpoint.authentication) {
            case 'none':
                return true;
            case 'basic':
                const auth = req.headers.authorization;
                if (!auth || !auth.startsWith('Basic '))
                    return false;
                return true;
            case 'bearer':
                const token = req.headers.authorization;
                if (!token || !token.startsWith('Bearer '))
                    return false;
                return true;
            case 'signature':
                const source = this.getWebhookSource(req);
                switch (source) {
                    case 'github':
                        return this.verifyGitHubSignature(req);
                    case 'stripe':
                        return this.verifyStripeSignature(req);
                    default:
                        return false;
                }
            default:
                return false;
        }
    }
    verifyGitHubSignature(req) {
        const signature = req.headers['x-hub-signature-256'];
        if (!signature)
            return false;
        const secret = process.env.GITHUB_WEBHOOK_SECRET || '';
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(JSON.stringify(req.body));
        const expectedSignature = `sha256=${hmac.digest('hex')}`;
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    }
    verifyStripeSignature(req) {
        const signature = req.headers['stripe-signature'];
        if (!signature)
            return false;
        return true;
    }
    getWebhookSource(req) {
        if (req.headers['x-github-event'])
            return 'github';
        if (req.headers['stripe-signature'])
            return 'stripe';
        if (req.headers['x-discord-webhook'])
            return 'discord';
        return 'generic';
    }
    async getUserWebhooks(userId) {
        return Array.from(this.webhooks.values()).filter(w => w.createdBy === userId);
    }
    async getWebhookDeliveries(webhookId, limit = 50) {
        return Array.from(this.deliveries.values())
            .filter(d => d.webhookId === webhookId)
            .sort((a, b) => (b.deliveredAt?.getTime() || 0) - (a.deliveredAt?.getTime() || 0))
            .slice(0, limit);
    }
    async retryDelivery(deliveryId) {
        const delivery = this.deliveries.get(deliveryId);
        if (!delivery) {
            throw new Error('Delivery not found');
        }
        const webhook = this.webhooks.get(delivery.webhookId);
        if (!webhook) {
            throw new Error('Webhook not found');
        }
        delivery.status = 'pending';
        delivery.attempts = 0;
        await this.deliveryQueue.add('deliver-webhook', {
            delivery,
            webhook,
            event: { id: delivery.eventId }
        });
    }
    getWebhookStats() {
        const webhooks = Array.from(this.webhooks.values());
        const deliveries = Array.from(this.deliveries.values());
        const eventTypeCount = {};
        webhooks.forEach(webhook => {
            webhook.events.forEach(event => {
                eventTypeCount[event] = (eventTypeCount[event] || 0) + 1;
            });
        });
        return {
            totalWebhooks: webhooks.length,
            activeWebhooks: webhooks.filter(w => w.active).length,
            totalDeliveries: deliveries.length,
            successfulDeliveries: deliveries.filter(d => d.status === 'success').length,
            failedDeliveries: deliveries.filter(d => d.status === 'failed').length,
            eventTypeDistribution: eventTypeCount
        };
    }
    async saveWebhook(webhook) {
        logger_1.logger.debug('Saving webhook', { webhookId: webhook.id });
    }
    async removeWebhook(webhookId) {
        logger_1.logger.debug('Removing webhook', { webhookId });
    }
    generateSecret() {
        return crypto.randomBytes(32).toString('hex');
    }
}
exports.WebhookService = WebhookService;
//# sourceMappingURL=webhook.service.js.map