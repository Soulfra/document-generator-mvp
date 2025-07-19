/**
 * Webhook Service
 * Adapted from Soulfra-AgentZero's webhook implementations
 * Provides webhook management, verification, and event routing
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import Bull from 'bull';
import axios from 'axios';
import { logger } from '../../utils/logger';
import { MetricsService } from '../monitoring/metrics.service';

interface WebhookConfig {
  id: string;
  url: string;
  secret?: string;
  events: string[];
  active: boolean;
  headers?: Record<string, string>;
  retryConfig?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: Date;
  lastTriggered?: Date;
  failureCount: number;
}

interface WebhookEvent {
  id: string;
  type: string;
  payload: any;
  timestamp: Date;
  source: string;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
}

interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  url: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  attempts: number;
  responseCode?: number;
  responseBody?: string;
  error?: string;
  deliveredAt?: Date;
  nextRetryAt?: Date;
}

interface WebhookEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: (req: any, res: any) => Promise<void>;
  authentication?: 'none' | 'basic' | 'bearer' | 'signature';
  rateLimit?: number;
}

export class WebhookService extends EventEmitter {
  private prisma: PrismaClient;
  private metricsService: MetricsService;
  private deliveryQueue: Bull.Queue;
  
  private webhooks: Map<string, WebhookConfig> = new Map();
  private deliveries: Map<string, WebhookDelivery> = new Map();
  private endpoints: Map<string, WebhookEndpoint> = new Map();
  
  // Event types that can trigger webhooks
  private eventTypes = [
    // User events
    'user.registered',
    'user.upgraded',
    'user.downgraded',
    'user.deleted',
    
    // Code events
    'code.analyzed',
    'code.cleaned',
    'code.error',
    
    // Project events
    'project.created',
    'project.updated',
    'project.deleted',
    'project.shared',
    
    // AI events
    'ai.query',
    'ai.response',
    'ai.error',
    
    // Arena events
    'arena.fighter.created',
    'arena.battle.started',
    'arena.battle.completed',
    'arena.tournament.started',
    
    // Payment events
    'payment.success',
    'payment.failed',
    'subscription.created',
    'subscription.cancelled',
    
    // System events
    'system.maintenance',
    'system.update',
    'api.limit.reached'
  ];

  constructor() {
    super();
    this.prisma = new PrismaClient();
    this.metricsService = new MetricsService();
    
    // Initialize delivery queue
    this.deliveryQueue = new Bull('webhook-delivery', {
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

  /**
   * Setup queue processors
   */
  private setupQueueProcessors(): void {
    this.deliveryQueue.process('deliver-webhook', async (job) => {
      const { delivery, webhook, event } = job.data;
      return await this.processWebhookDelivery(delivery, webhook, event);
    });
    
    this.deliveryQueue.on('completed', (job, result) => {
      logger.info('Webhook delivered successfully', { 
        deliveryId: result.id,
        webhookId: result.webhookId 
      });
    });
    
    this.deliveryQueue.on('failed', (job, err) => {
      logger.error('Webhook delivery failed', {
        error: err.message,
        attempts: job.attemptsMade
      });
    });
  }

  /**
   * Register a new webhook
   */
  async registerWebhook(options: {
    url: string;
    events: string[];
    secret?: string;
    headers?: Record<string, string>;
    userId: string;
  }): Promise<WebhookConfig> {
    try {
      // Validate URL
      const urlObj = new URL(options.url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid webhook URL protocol');
      }
      
      // Validate events
      const invalidEvents = options.events.filter(e => !this.eventTypes.includes(e));
      if (invalidEvents.length > 0) {
        throw new Error(`Invalid event types: ${invalidEvents.join(', ')}`);
      }
      
      // Create webhook
      const webhook: WebhookConfig = {
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
      
      // Test webhook with ping event
      const testResult = await this.testWebhook(webhook);
      if (!testResult.success) {
        throw new Error(`Webhook test failed: ${testResult.error}`);
      }
      
      // Store webhook
      this.webhooks.set(webhook.id, webhook);
      await this.saveWebhook(webhook);
      
      logger.info('Webhook registered', {
        webhookId: webhook.id,
        url: webhook.url,
        events: webhook.events
      });
      
      return webhook;
    } catch (error) {
      logger.error('Error registering webhook', error);
      throw error;
    }
  }

  /**
   * Update webhook configuration
   */
  async updateWebhook(
    webhookId: string, 
    updates: Partial<WebhookConfig>
  ): Promise<WebhookConfig> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }
    
    // Apply updates
    Object.assign(webhook, updates);
    
    // Save to database
    await this.saveWebhook(webhook);
    
    logger.info('Webhook updated', { webhookId });
    
    return webhook;
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string, userId: string): Promise<void> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }
    
    if (webhook.createdBy !== userId) {
      throw new Error('Unauthorized to delete this webhook');
    }
    
    this.webhooks.delete(webhookId);
    await this.removeWebhook(webhookId);
    
    logger.info('Webhook deleted', { webhookId });
  }

  /**
   * Trigger webhook event
   */
  async triggerEvent(event: WebhookEvent): Promise<void> {
    try {
      logger.info('Triggering webhook event', { 
        eventType: event.type,
        eventId: event.id 
      });
      
      // Find matching webhooks
      const matchingWebhooks = Array.from(this.webhooks.values()).filter(webhook =>
        webhook.active && webhook.events.includes(event.type)
      );
      
      if (matchingWebhooks.length === 0) {
        logger.debug('No webhooks registered for event', { eventType: event.type });
        return;
      }
      
      // Queue deliveries
      for (const webhook of matchingWebhooks) {
        const delivery: WebhookDelivery = {
          id: `delivery-${crypto.randomBytes(8).toString('hex')}`,
          webhookId: webhook.id,
          eventId: event.id,
          url: webhook.url,
          status: 'pending',
          attempts: 0
        };
        
        this.deliveries.set(delivery.id, delivery);
        
        // Add to delivery queue
        await this.deliveryQueue.add('deliver-webhook', {
          delivery,
          webhook,
          event
        });
      }
      
      // Update metrics
      this.metricsService.recordMetric({
        name: 'webhook.event.triggered',
        value: 1,
        tags: {
          eventType: event.type,
          webhookCount: matchingWebhooks.length.toString()
        }
      });
    } catch (error) {
      logger.error('Error triggering webhook event', error);
    }
  }

  /**
   * Process webhook delivery
   */
  private async processWebhookDelivery(
    delivery: WebhookDelivery,
    webhook: WebhookConfig,
    event: WebhookEvent
  ): Promise<WebhookDelivery> {
    try {
      delivery.attempts++;
      delivery.status = 'retrying';
      
      // Prepare payload
      const payload = {
        id: event.id,
        type: event.type,
        payload: event.payload,
        timestamp: event.timestamp,
        metadata: event.metadata
      };
      
      // Generate signature
      const signature = this.generateSignature(payload, webhook.secret!);
      
      // Prepare headers
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Id': webhook.id,
        'X-Webhook-Signature': signature,
        'X-Event-Type': event.type,
        'X-Event-Id': event.id,
        ...webhook.headers
      };
      
      // Make request
      const response = await axios.post(webhook.url, payload, {
        headers,
        timeout: 30000, // 30 seconds
        validateStatus: () => true // Don't throw on non-2xx
      });
      
      delivery.responseCode = response.status;
      delivery.responseBody = JSON.stringify(response.data).substring(0, 1000);
      
      if (response.status >= 200 && response.status < 300) {
        delivery.status = 'success';
        delivery.deliveredAt = new Date();
        webhook.lastTriggered = new Date();
        webhook.failureCount = 0;
        
        logger.info('Webhook delivered successfully', {
          deliveryId: delivery.id,
          statusCode: response.status
        });
      } else {
        delivery.status = 'failed';
        delivery.error = `HTTP ${response.status}: ${response.statusText}`;
        webhook.failureCount++;
        
        logger.warn('Webhook delivery failed', {
          deliveryId: delivery.id,
          statusCode: response.status,
          error: delivery.error
        });
        
        // Disable webhook after too many failures
        if (webhook.failureCount >= 10) {
          webhook.active = false;
          logger.warn('Webhook disabled due to repeated failures', {
            webhookId: webhook.id
          });
        }
      }
    } catch (error: any) {
      delivery.status = 'failed';
      delivery.error = error.message;
      webhook.failureCount++;
      
      logger.error('Webhook delivery error', {
        deliveryId: delivery.id,
        error: error.message
      });
      
      throw error; // Will trigger retry
    }
    
    // Update records
    await this.saveWebhook(webhook);
    
    return delivery;
  }

  /**
   * Test webhook connectivity
   */
  private async testWebhook(webhook: WebhookConfig): Promise<{
    success: boolean;
    responseTime?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      
      const testPayload = {
        type: 'webhook.test',
        timestamp: new Date().toISOString(),
        message: 'Webhook configuration test'
      };
      
      const signature = this.generateSignature(testPayload, webhook.secret!);
      
      const response = await axios.post(webhook.url, testPayload, {
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
      } else {
        return { 
          success: false, 
          error: `HTTP ${response.status}: ${response.statusText}` 
        };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  /**
   * Generate webhook signature
   */
  private generateSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: any, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Register webhook endpoints (for receiving webhooks)
   */
  private registerDefaultEndpoints(): void {
    // GitHub webhook endpoint
    this.registerEndpoint({
      path: '/webhooks/github',
      method: 'POST',
      handler: this.handleGitHubWebhook.bind(this),
      authentication: 'signature'
    });
    
    // Stripe webhook endpoint
    this.registerEndpoint({
      path: '/webhooks/stripe',
      method: 'POST',
      handler: this.handleStripeWebhook.bind(this),
      authentication: 'signature'
    });
    
    // Discord webhook endpoint
    this.registerEndpoint({
      path: '/webhooks/discord',
      method: 'POST',
      handler: this.handleDiscordWebhook.bind(this),
      authentication: 'bearer'
    });
    
    // Generic webhook endpoint
    this.registerEndpoint({
      path: '/webhooks/generic',
      method: 'POST',
      handler: this.handleGenericWebhook.bind(this),
      authentication: 'basic'
    });
  }

  /**
   * Register a webhook endpoint
   */
  registerEndpoint(endpoint: WebhookEndpoint): void {
    const key = `${endpoint.method}:${endpoint.path}`;
    this.endpoints.set(key, endpoint);
    logger.info('Webhook endpoint registered', { 
      path: endpoint.path,
      method: endpoint.method 
    });
  }

  /**
   * Handle incoming webhook request
   */
  async handleIncomingWebhook(req: any, res: any): Promise<void> {
    const key = `${req.method}:${req.path}`;
    const endpoint = this.endpoints.get(key);
    
    if (!endpoint) {
      res.status(404).json({ error: 'Webhook endpoint not found' });
      return;
    }
    
    try {
      // Verify authentication
      if (!this.verifyEndpointAuth(req, endpoint)) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      
      // Process webhook
      await endpoint.handler(req, res);
      
      // Record metric
      this.metricsService.recordMetric({
        name: 'webhook.received',
        value: 1,
        tags: {
          endpoint: endpoint.path,
          source: this.getWebhookSource(req)
        }
      });
    } catch (error: any) {
      logger.error('Error handling incoming webhook', {
        endpoint: endpoint.path,
        error: error.message
      });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GitHub webhook handler
   */
  private async handleGitHubWebhook(req: any, res: any): Promise<void> {
    const event = req.headers['x-github-event'];
    const payload = req.body;
    
    logger.info('GitHub webhook received', { event });
    
    // Process based on event type
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

  /**
   * Stripe webhook handler
   */
  private async handleStripeWebhook(req: any, res: any): Promise<void> {
    const event = req.body;
    
    logger.info('Stripe webhook received', { type: event.type });
    
    // Map Stripe events to internal events
    const eventMap: Record<string, string> = {
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

  /**
   * Discord webhook handler
   */
  private async handleDiscordWebhook(req: any, res: any): Promise<void> {
    const payload = req.body;
    
    logger.info('Discord webhook received', { type: payload.type });
    
    await this.triggerEvent({
      id: `discord-${Date.now()}`,
      type: `discord.${payload.type}`,
      payload,
      timestamp: new Date(),
      source: 'discord'
    });
    
    res.status(200).json({ received: true });
  }

  /**
   * Generic webhook handler
   */
  private async handleGenericWebhook(req: any, res: any): Promise<void> {
    const payload = req.body;
    
    logger.info('Generic webhook received');
    
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

  /**
   * Verify endpoint authentication
   */
  private verifyEndpointAuth(req: any, endpoint: WebhookEndpoint): boolean {
    switch (endpoint.authentication) {
      case 'none':
        return true;
        
      case 'basic':
        const auth = req.headers.authorization;
        if (!auth || !auth.startsWith('Basic ')) return false;
        // Verify basic auth
        return true;
        
      case 'bearer':
        const token = req.headers.authorization;
        if (!token || !token.startsWith('Bearer ')) return false;
        // Verify bearer token
        return true;
        
      case 'signature':
        // Verify signature based on source
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

  /**
   * Verify GitHub signature
   */
  private verifyGitHubSignature(req: any): boolean {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) return false;
    
    const secret = process.env.GITHUB_WEBHOOK_SECRET || '';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(req.body));
    const expectedSignature = `sha256=${hmac.digest('hex')}`;
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Verify Stripe signature
   */
  private verifyStripeSignature(req: any): boolean {
    const signature = req.headers['stripe-signature'];
    if (!signature) return false;
    
    // In production, use Stripe SDK to verify
    return true;
  }

  /**
   * Get webhook source from request
   */
  private getWebhookSource(req: any): string {
    if (req.headers['x-github-event']) return 'github';
    if (req.headers['stripe-signature']) return 'stripe';
    if (req.headers['x-discord-webhook']) return 'discord';
    return 'generic';
  }

  /**
   * Get user's webhooks
   */
  async getUserWebhooks(userId: string): Promise<WebhookConfig[]> {
    return Array.from(this.webhooks.values()).filter(w => w.createdBy === userId);
  }

  /**
   * Get webhook deliveries
   */
  async getWebhookDeliveries(webhookId: string, limit: number = 50): Promise<WebhookDelivery[]> {
    return Array.from(this.deliveries.values())
      .filter(d => d.webhookId === webhookId)
      .sort((a, b) => (b.deliveredAt?.getTime() || 0) - (a.deliveredAt?.getTime() || 0))
      .slice(0, limit);
  }

  /**
   * Retry failed delivery
   */
  async retryDelivery(deliveryId: string): Promise<void> {
    const delivery = this.deliveries.get(deliveryId);
    if (!delivery) {
      throw new Error('Delivery not found');
    }
    
    const webhook = this.webhooks.get(delivery.webhookId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }
    
    // Reset delivery status
    delivery.status = 'pending';
    delivery.attempts = 0;
    
    // Re-queue delivery
    await this.deliveryQueue.add('deliver-webhook', {
      delivery,
      webhook,
      event: { id: delivery.eventId } // Simplified event
    });
  }

  /**
   * Get webhook statistics
   */
  getWebhookStats(): {
    totalWebhooks: number;
    activeWebhooks: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    eventTypeDistribution: Record<string, number>;
  } {
    const webhooks = Array.from(this.webhooks.values());
    const deliveries = Array.from(this.deliveries.values());
    
    const eventTypeCount: Record<string, number> = {};
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

  /**
   * Database operations (simplified)
   */
  private async saveWebhook(webhook: WebhookConfig): Promise<void> {
    // In production, save to database
    logger.debug('Saving webhook', { webhookId: webhook.id });
  }

  private async removeWebhook(webhookId: string): Promise<void> {
    // In production, remove from database
    logger.debug('Removing webhook', { webhookId });
  }

  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}