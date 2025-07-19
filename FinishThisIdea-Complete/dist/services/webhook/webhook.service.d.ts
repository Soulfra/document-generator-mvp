import { EventEmitter } from 'events';
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
export declare class WebhookService extends EventEmitter {
    private prisma;
    private metricsService;
    private deliveryQueue;
    private webhooks;
    private deliveries;
    private endpoints;
    private eventTypes;
    constructor();
    private setupQueueProcessors;
    registerWebhook(options: {
        url: string;
        events: string[];
        secret?: string;
        headers?: Record<string, string>;
        userId: string;
    }): Promise<WebhookConfig>;
    updateWebhook(webhookId: string, updates: Partial<WebhookConfig>): Promise<WebhookConfig>;
    deleteWebhook(webhookId: string, userId: string): Promise<void>;
    triggerEvent(event: WebhookEvent): Promise<void>;
    private processWebhookDelivery;
    private testWebhook;
    private generateSignature;
    verifySignature(payload: any, signature: string, secret: string): boolean;
    private registerDefaultEndpoints;
    registerEndpoint(endpoint: WebhookEndpoint): void;
    handleIncomingWebhook(req: any, res: any): Promise<void>;
    private handleGitHubWebhook;
    private handleStripeWebhook;
    private handleDiscordWebhook;
    private handleGenericWebhook;
    private verifyEndpointAuth;
    private verifyGitHubSignature;
    private verifyStripeSignature;
    private getWebhookSource;
    getUserWebhooks(userId: string): Promise<WebhookConfig[]>;
    getWebhookDeliveries(webhookId: string, limit?: number): Promise<WebhookDelivery[]>;
    retryDelivery(deliveryId: string): Promise<void>;
    getWebhookStats(): {
        totalWebhooks: number;
        activeWebhooks: number;
        totalDeliveries: number;
        successfulDeliveries: number;
        failedDeliveries: number;
        eventTypeDistribution: Record<string, number>;
    };
    private saveWebhook;
    private removeWebhook;
    private generateSecret;
}
export {};
//# sourceMappingURL=webhook.service.d.ts.map