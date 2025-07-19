"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.licensingPayout = exports.LicensingPayoutIntegration = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
class LicensingPayoutIntegration extends events_1.EventEmitter {
    config;
    apiClient;
    licensingProcess;
    initialized = false;
    currentPort;
    constructor(config = {}) {
        super();
        this.config = {
            serviceUrl: config.serviceUrl || 'http://localhost:6000',
            autoStart: config.autoStart !== false,
            soulfraPath: config.soulfraPath || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025',
            port: config.port || 6000,
            stripeSecretKey: config.stripeSecretKey || process.env.STRIPE_SECRET_KEY,
            stripeWebhookSecret: config.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET,
            enableAutoBuyback: config.enableAutoBuyback !== false,
            ...config
        };
    }
    async initialize() {
        try {
            await this.checkLicensingService();
            logger_1.logger.info('Connected to existing licensing and payout service');
        }
        catch (error) {
            if (this.config.autoStart) {
                logger_1.logger.info('Licensing service not running, starting new instance...');
                await this.startLicensingService();
                await this.waitForLicensingService();
            }
            else {
                throw new Error('Licensing service not available and autoStart is disabled');
            }
        }
        this.setupApiClient();
        this.initialized = true;
        this.emit('initialized');
        logger_1.logger.info('Licensing and payout integration initialized', {
            url: this.config.serviceUrl,
            port: this.currentPort,
            autoBuyback: this.config.enableAutoBuyback
        });
    }
    async startLicensingService() {
        if (!this.config.soulfraPath) {
            throw new Error('Soulfra path not configured');
        }
        const licensingPath = path_1.default.join(this.config.soulfraPath, 'misc', 'stripe-integration.js');
        this.licensingProcess = (0, child_process_1.spawn)('node', [licensingPath], {
            cwd: this.config.soulfraPath,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env,
                PORT: this.config.port.toString(),
                STRIPE_SECRET_KEY: this.config.stripeSecretKey,
                STRIPE_WEBHOOK_SECRET: this.config.stripeWebhookSecret,
                ENABLE_AUTO_BUYBACK: this.config.enableAutoBuyback.toString(),
                NODE_PATH: this.config.soulfraPath
            }
        });
        this.licensingProcess.stdout?.on('data', (data) => {
            const output = data.toString();
            logger_1.logger.debug('Licensing service stdout:', output);
            if (output.includes('Licensing service listening')) {
                this.emit('licensing-service-ready');
            }
        });
        this.licensingProcess.stderr?.on('data', (data) => {
            const error = data.toString();
            logger_1.logger.warn('Licensing service stderr:', error);
        });
        this.licensingProcess.on('exit', (code) => {
            logger_1.logger.info('Licensing service process exited', { code });
            this.licensingProcess = undefined;
            this.emit('licensing-service-stopped', { code });
        });
        this.licensingProcess.on('error', (error) => {
            logger_1.logger.error('Licensing service process error', error);
            this.emit('licensing-service-error', error);
        });
    }
    async waitForLicensingService() {
        const maxWait = 30000;
        const interval = 1000;
        let waited = 0;
        while (waited < maxWait) {
            try {
                await this.checkLicensingService();
                return;
            }
            catch (error) {
                await new Promise(resolve => setTimeout(resolve, interval));
                waited += interval;
            }
        }
        throw new Error('Licensing service failed to start within timeout');
    }
    async checkLicensingService() {
        const response = await axios_1.default.get(`${this.config.serviceUrl}/health`);
        return response.data.status === 'healthy';
    }
    setupApiClient() {
        this.apiClient = axios_1.default.create({
            baseURL: this.config.serviceUrl,
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FinishThisIdea-Platform/1.0'
            }
        });
        this.apiClient.interceptors.request.use((config) => {
            logger_1.logger.debug('Licensing API request', {
                method: config.method,
                url: config.url
            });
            return config;
        }, (error) => {
            logger_1.logger.error('Licensing API request error', error);
            return Promise.reject(error);
        });
        this.apiClient.interceptors.response.use((response) => {
            logger_1.logger.debug('Licensing API response', {
                status: response.status,
                url: response.config.url
            });
            return response;
        }, (error) => {
            logger_1.logger.error('Licensing API error', {
                status: error.response?.status,
                url: error.config?.url,
                message: error.message
            });
            return Promise.reject(error);
        });
    }
    async createLicense(userId, modelId, tenantId) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.post('/licenses', {
            userId,
            modelId,
            tenantId
        });
        const license = response.data;
        this.emit('license-created', {
            licenseId: license.id,
            userId,
            modelId,
            tenantId
        });
        return license;
    }
    async getLicense(licenseId) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.get(`/licenses/${licenseId}`);
        return response.data;
    }
    async updateLicense(licenseId, updates) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.put(`/licenses/${licenseId}`, updates);
        this.emit('license-updated', {
            licenseId,
            updates
        });
        return response.data;
    }
    async cancelLicense(licenseId, reason) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        await this.apiClient.delete(`/licenses/${licenseId}`, {
            data: { reason }
        });
        this.emit('license-cancelled', {
            licenseId,
            reason
        });
    }
    async createSubscription(userId, modelId, paymentMethodId) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.post('/subscriptions', {
            userId,
            modelId,
            paymentMethodId
        });
        const subscription = response.data;
        this.emit('subscription-created', {
            subscriptionId: subscription.subscriptionId,
            userId,
            modelId
        });
        return subscription;
    }
    async cancelSubscription(subscriptionId, cancelAtPeriodEnd = true) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        await this.apiClient.delete(`/subscriptions/${subscriptionId}`, {
            data: { cancelAtPeriodEnd }
        });
        this.emit('subscription-cancelled', {
            subscriptionId,
            cancelAtPeriodEnd
        });
    }
    async getSubscriptionMetrics() {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.get('/metrics/subscriptions');
        return response.data;
    }
    async createCheckoutSession(options) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.post('/checkout/session', options);
        return response.data;
    }
    async createPaymentLink(modelId, metadata) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.post('/checkout/payment-link', {
            modelId,
            metadata
        });
        return response.data;
    }
    async requestPayout(request) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.post('/payouts', request);
        const payout = response.data;
        this.emit('payout-requested', {
            payoutId: payout.id,
            recipientId: request.recipientId,
            amount: request.amount,
            reason: request.reason
        });
        return payout;
    }
    async getPayoutStatus(payoutId) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.get(`/payouts/${payoutId}`);
        return response.data;
    }
    async calculateRevenueShare(licenseId, period) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.post(`/licenses/${licenseId}/revenue-share`, {
            startDate: period.start.toISOString(),
            endDate: period.end.toISOString()
        });
        return response.data;
    }
    async processAutomaticPayouts() {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.post('/payouts/process-automatic');
        const result = response.data;
        this.emit('automatic-payouts-processed', {
            processed: result.processed,
            totalAmount: result.totalAmount,
            failed: result.failed
        });
        return result;
    }
    async getAgentRevenue(agentId) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.get(`/agents/${agentId}/revenue`);
        return response.data;
    }
    async updateAgentOwnership(agentId, ownership) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.put(`/agents/${agentId}/ownership`, {
            ownership
        });
        this.emit('agent-ownership-updated', {
            agentId,
            ownership
        });
        return response.data;
    }
    async triggerAgentBuyback(agentId) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.post(`/agents/${agentId}/buyback`);
        const result = response.data;
        this.emit('agent-buyback-triggered', {
            agentId,
            buybackPrice: result.buybackPrice,
            tokensRepurchased: result.tokensRepurchased
        });
        return result;
    }
    async distributeDividends(agentId) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.post(`/agents/${agentId}/dividends`);
        const result = response.data;
        this.emit('dividends-distributed', {
            agentId,
            totalDividends: result.totalDividends,
            recipientCount: result.recipientCount
        });
        return result;
    }
    async trackUsage(licenseId, usage) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        await this.apiClient.post(`/licenses/${licenseId}/usage`, usage);
        this.emit('usage-tracked', {
            licenseId,
            type: usage.type,
            quantity: usage.quantity
        });
    }
    async getUsageMetrics(licenseId, period) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const params = period ? {
            startDate: period.start.toISOString(),
            endDate: period.end.toISOString()
        } : {};
        const response = await this.apiClient.get(`/licenses/${licenseId}/usage-metrics`, { params });
        return response.data;
    }
    async createLicenseModel(model) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.post('/models', model);
        this.emit('license-model-created', response.data);
        return response.data;
    }
    async getLicenseModels() {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.get('/models');
        return response.data;
    }
    async updateLicenseModel(modelId, updates) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.put(`/models/${modelId}`, updates);
        this.emit('license-model-updated', {
            modelId,
            updates
        });
        return response.data;
    }
    async processWebhook(eventType, data) {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        await this.apiClient.post('/webhooks/stripe', {
            type: eventType,
            data
        });
        this.emit('webhook-processed', {
            eventType,
            timestamp: Date.now()
        });
    }
    async checkHealth() {
        if (!this.apiClient) {
            throw new Error('Licensing service not available');
        }
        const response = await this.apiClient.get('/health');
        return response.data;
    }
    async shutdown() {
        if (this.licensingProcess) {
            this.licensingProcess.kill('SIGTERM');
            await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    this.licensingProcess?.kill('SIGKILL');
                    resolve();
                }, 5000);
                this.licensingProcess?.on('exit', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
        }
        this.initialized = false;
        this.emit('shutdown');
        logger_1.logger.info('Licensing and payout integration shut down');
    }
    isInitialized() {
        return this.initialized;
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.LicensingPayoutIntegration = LicensingPayoutIntegration;
exports.licensingPayout = new LicensingPayoutIntegration({
    autoStart: true,
    enableAutoBuyback: true,
    soulfraPath: process.env.SOULFRA_PATH || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025'
});
//# sourceMappingURL=licensing-payout.integration.js.map