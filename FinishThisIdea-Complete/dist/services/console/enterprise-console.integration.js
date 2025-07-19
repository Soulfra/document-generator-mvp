"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enterpriseConsole = exports.EnterpriseConsoleIntegration = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
class EnterpriseConsoleIntegration extends events_1.EventEmitter {
    config;
    apiClient;
    consoleProcess;
    initialized = false;
    currentPort;
    constructor(config = {}) {
        super();
        this.config = {
            consoleUrl: config.consoleUrl || 'http://localhost:7000',
            autoStart: config.autoStart !== false,
            soulfraPath: config.soulfraPath || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025',
            port: config.port || 7000,
            witnessValidation: config.witnessValidation !== false,
            enableWhiteLabel: config.enableWhiteLabel !== false,
            ...config
        };
    }
    async initialize() {
        try {
            await this.checkConsoleService();
            logger_1.logger.info('Connected to existing enterprise console service');
        }
        catch (error) {
            if (this.config.autoStart) {
                logger_1.logger.info('Enterprise console service not running, starting new instance...');
                await this.startConsoleService();
                await this.waitForConsoleService();
            }
            else {
                throw new Error('Enterprise console service not available and autoStart is disabled');
            }
        }
        this.setupApiClient();
        this.initialized = true;
        this.emit('initialized');
        logger_1.logger.info('Enterprise console integration initialized', {
            url: this.config.consoleUrl,
            port: this.currentPort,
            witnessValidation: this.config.witnessValidation,
            whiteLabel: this.config.enableWhiteLabel
        });
    }
    async startConsoleService() {
        if (!this.config.soulfraPath) {
            throw new Error('Soulfra path not configured');
        }
        const consolePath = path_1.default.join(this.config.soulfraPath, 'misc', 'enterprise-console-hooks.js');
        this.consoleProcess = (0, child_process_1.spawn)('node', [consolePath], {
            cwd: this.config.soulfraPath,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env,
                PORT: this.config.port.toString(),
                WITNESS_VALIDATION: this.config.witnessValidation.toString(),
                WHITE_LABEL_ENABLED: this.config.enableWhiteLabel.toString(),
                NODE_PATH: this.config.soulfraPath
            }
        });
        this.consoleProcess.stdout?.on('data', (data) => {
            const output = data.toString();
            logger_1.logger.debug('Enterprise console stdout:', output);
            if (output.includes('Console service listening')) {
                this.emit('console-service-ready');
            }
        });
        this.consoleProcess.stderr?.on('data', (data) => {
            const error = data.toString();
            logger_1.logger.warn('Enterprise console stderr:', error);
        });
        this.consoleProcess.on('exit', (code) => {
            logger_1.logger.info('Enterprise console process exited', { code });
            this.consoleProcess = undefined;
            this.emit('console-service-stopped', { code });
        });
        this.consoleProcess.on('error', (error) => {
            logger_1.logger.error('Enterprise console process error', error);
            this.emit('console-service-error', error);
        });
    }
    async waitForConsoleService() {
        const maxWait = 30000;
        const interval = 1000;
        let waited = 0;
        while (waited < maxWait) {
            try {
                await this.checkConsoleService();
                return;
            }
            catch (error) {
                await new Promise(resolve => setTimeout(resolve, interval));
                waited += interval;
            }
        }
        throw new Error('Enterprise console service failed to start within timeout');
    }
    async checkConsoleService() {
        const response = await axios_1.default.get(`${this.config.consoleUrl}/health`);
        return response.data.status === 'healthy';
    }
    setupApiClient() {
        this.apiClient = axios_1.default.create({
            baseURL: this.config.consoleUrl,
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FinishThisIdea-Platform/1.0'
            }
        });
        this.apiClient.interceptors.request.use((config) => {
            logger_1.logger.debug('Enterprise console API request', {
                method: config.method,
                url: config.url
            });
            return config;
        }, (error) => {
            logger_1.logger.error('Enterprise console API request error', error);
            return Promise.reject(error);
        });
        this.apiClient.interceptors.response.use((response) => {
            logger_1.logger.debug('Enterprise console API response', {
                status: response.status,
                url: response.config.url
            });
            return response;
        }, (error) => {
            logger_1.logger.error('Enterprise console API error', {
                status: error.response?.status,
                url: error.config?.url,
                message: error.message
            });
            return Promise.reject(error);
        });
    }
    async createTenant(request) {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        const response = await this.apiClient.post('/tenants', request);
        const tenant = response.data;
        this.emit('tenant-created', {
            tenantId: tenant.id,
            name: tenant.name,
            domain: tenant.domain,
            plan: tenant.plan
        });
        return tenant;
    }
    async getTenant(tenantId) {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        const response = await this.apiClient.get(`/tenants/${tenantId}`);
        return response.data;
    }
    async updateTenant(tenantId, updates) {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        const response = await this.apiClient.put(`/tenants/${tenantId}`, updates);
        const tenant = response.data;
        this.emit('tenant-updated', {
            tenantId,
            updates,
            tenant
        });
        return tenant;
    }
    async listTenants(options = {}) {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        const response = await this.apiClient.get('/tenants', { params: options });
        return response.data;
    }
    async deleteTenant(tenantId, options = {}) {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        await this.apiClient.delete(`/tenants/${tenantId}`, { data: options });
        this.emit('tenant-deleted', {
            tenantId,
            preserveData: options.preserveData || false
        });
    }
    async updateTenantBranding(tenantId, branding) {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        const response = await this.apiClient.put(`/tenants/${tenantId}/branding`, branding);
        this.emit('tenant-branding-updated', {
            tenantId,
            branding
        });
        return response.data;
    }
    async deployTenantCustomization(tenantId) {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        const response = await this.apiClient.post(`/tenants/${tenantId}/deploy-customization`);
        this.emit('tenant-customization-deployed', {
            tenantId,
            deployment: response.data
        });
        return response.data;
    }
    async getTenantResourceUsage(tenantId) {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        const response = await this.apiClient.get(`/tenants/${tenantId}/resources`);
        return response.data;
    }
    async scaleTenantResources(tenantId, resources) {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        const response = await this.apiClient.post(`/tenants/${tenantId}/scale`, resources);
        this.emit('tenant-scaled', {
            tenantId,
            resources,
            result: response.data
        });
        return response.data;
    }
    async optimizeTenantResources(tenantId, autoApply = false) {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        const response = await this.apiClient.post(`/tenants/${tenantId}/optimize`, {
            autoApply
        });
        if (autoApply) {
            this.emit('tenant-optimized', {
                tenantId,
                optimization: response.data
            });
        }
        return response.data;
    }
    async getConsoleMetrics() {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        const response = await this.apiClient.get('/metrics');
        return response.data;
    }
    async getDepartmentView(department, tenantId) {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        const params = tenantId ? { tenantId } : {};
        const response = await this.apiClient.get(`/departments/${department}`, { params });
        return response.data;
    }
    async getTenantAnalytics(tenantId, timeRange = '30d') {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        const response = await this.apiClient.get(`/tenants/${tenantId}/analytics`, {
            params: { timeRange }
        });
        return response.data;
    }
    async runComplianceAudit(tenantId, framework) {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        const response = await this.apiClient.post(`/tenants/${tenantId}/compliance/audit`, {
            framework
        });
        this.emit('compliance-audit-completed', {
            tenantId,
            framework,
            score: response.data.score
        });
        return response.data;
    }
    async getSecurityStatus(tenantId) {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        const params = tenantId ? { tenantId } : {};
        const response = await this.apiClient.get('/security/status', { params });
        return response.data;
    }
    async getTenantBilling(tenantId) {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        const response = await this.apiClient.get(`/tenants/${tenantId}/billing`);
        return response.data;
    }
    async updateTenantPlan(tenantId, plan, effective) {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        const response = await this.apiClient.put(`/tenants/${tenantId}/plan`, {
            plan,
            effectiveDate: effective
        });
        this.emit('tenant-plan-updated', {
            tenantId,
            newPlan: plan,
            effectiveDate: response.data.effectiveDate
        });
        return response.data;
    }
    async checkHealth() {
        if (!this.apiClient) {
            throw new Error('Enterprise console service not available');
        }
        const response = await this.apiClient.get('/health');
        return response.data;
    }
    async shutdown() {
        if (this.consoleProcess) {
            this.consoleProcess.kill('SIGTERM');
            await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    this.consoleProcess?.kill('SIGKILL');
                    resolve();
                }, 5000);
                this.consoleProcess?.on('exit', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
        }
        this.initialized = false;
        this.emit('shutdown');
        logger_1.logger.info('Enterprise console integration shut down');
    }
    isInitialized() {
        return this.initialized;
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.EnterpriseConsoleIntegration = EnterpriseConsoleIntegration;
exports.enterpriseConsole = new EnterpriseConsoleIntegration({
    autoStart: true,
    witnessValidation: true,
    enableWhiteLabel: true,
    soulfraPath: process.env.SOULFRA_PATH || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025'
});
//# sourceMappingURL=enterprise-console.integration.js.map