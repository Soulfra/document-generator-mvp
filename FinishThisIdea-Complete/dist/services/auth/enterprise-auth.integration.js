"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enterpriseAuth = exports.EnterpriseAuthIntegration = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
class EnterpriseAuthIntegration extends events_1.EventEmitter {
    config;
    apiClient;
    authProcess;
    initialized = false;
    currentPort;
    constructor(config = {}) {
        super();
        this.config = {
            authServiceUrl: config.authServiceUrl || 'http://localhost:9000',
            autoStart: config.autoStart !== false,
            soulfraPath: config.soulfraPath || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025',
            port: config.port || 9000,
            jwtSecret: config.jwtSecret || process.env.JWT_SECRET,
            encryptionKey: config.encryptionKey || process.env.ENCRYPTION_KEY,
            complianceMode: config.complianceMode || 'standard',
            ...config
        };
    }
    async initialize() {
        try {
            await this.checkAuthService();
            logger_1.logger.info('Connected to existing enterprise auth service');
        }
        catch (error) {
            if (this.config.autoStart) {
                logger_1.logger.info('Enterprise auth service not running, starting new instance...');
                await this.startAuthService();
                await this.waitForAuthService();
            }
            else {
                throw new Error('Enterprise auth service not available and autoStart is disabled');
            }
        }
        this.setupApiClient();
        this.initialized = true;
        this.emit('initialized');
        logger_1.logger.info('Enterprise auth integration initialized', {
            url: this.config.authServiceUrl,
            port: this.currentPort,
            complianceMode: this.config.complianceMode
        });
    }
    async startAuthService() {
        if (!this.config.soulfraPath) {
            throw new Error('Soulfra path not configured');
        }
        const authServicePath = path_1.default.join(this.config.soulfraPath, 'misc', 'auth-service.js');
        this.authProcess = (0, child_process_1.spawn)('node', [authServicePath], {
            cwd: this.config.soulfraPath,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env,
                PORT: this.config.port.toString(),
                JWT_SECRET: this.config.jwtSecret,
                ENCRYPTION_KEY: this.config.encryptionKey,
                COMPLIANCE_MODE: this.config.complianceMode,
                NODE_PATH: this.config.soulfraPath
            }
        });
        this.authProcess.stdout?.on('data', (data) => {
            const output = data.toString();
            logger_1.logger.debug('Enterprise auth stdout:', output);
            if (output.includes('Auth service listening')) {
                this.emit('auth-service-ready');
            }
        });
        this.authProcess.stderr?.on('data', (data) => {
            const error = data.toString();
            logger_1.logger.warn('Enterprise auth stderr:', error);
        });
        this.authProcess.on('exit', (code) => {
            logger_1.logger.info('Enterprise auth process exited', { code });
            this.authProcess = undefined;
            this.emit('auth-service-stopped', { code });
        });
        this.authProcess.on('error', (error) => {
            logger_1.logger.error('Enterprise auth process error', error);
            this.emit('auth-service-error', error);
        });
    }
    async waitForAuthService() {
        const maxWait = 30000;
        const interval = 1000;
        let waited = 0;
        while (waited < maxWait) {
            try {
                await this.checkAuthService();
                return;
            }
            catch (error) {
                await new Promise(resolve => setTimeout(resolve, interval));
                waited += interval;
            }
        }
        throw new Error('Enterprise auth service failed to start within timeout');
    }
    async checkAuthService() {
        const response = await axios_1.default.get(`${this.config.authServiceUrl}/health`);
        return response.data.status === 'healthy';
    }
    setupApiClient() {
        this.apiClient = axios_1.default.create({
            baseURL: this.config.authServiceUrl,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FinishThisIdea-Platform/1.0'
            }
        });
        this.apiClient.interceptors.request.use((config) => {
            logger_1.logger.debug('Enterprise auth API request', {
                method: config.method,
                url: config.url
            });
            return config;
        }, (error) => {
            logger_1.logger.error('Enterprise auth API request error', error);
            return Promise.reject(error);
        });
        this.apiClient.interceptors.response.use((response) => {
            logger_1.logger.debug('Enterprise auth API response', {
                status: response.status,
                url: response.config.url
            });
            return response;
        }, (error) => {
            logger_1.logger.error('Enterprise auth API error', {
                status: error.response?.status,
                url: error.config?.url,
                message: error.message
            });
            return Promise.reject(error);
        });
    }
    async login(request) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const response = await this.apiClient.post('/auth/login', request);
        const result = response.data;
        this.emit('user-login', {
            userId: result.user.id,
            email: result.user.email,
            organization: result.user.organization,
            mfaUsed: !!request.mfaCode
        });
        return result;
    }
    async logout(token) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        await this.apiClient.post('/auth/logout', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        this.emit('user-logout', { token });
    }
    async refreshToken(refreshToken) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const response = await this.apiClient.post('/auth/refresh', {
            refreshToken
        });
        return response.data;
    }
    async verifyToken(token) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const response = await this.apiClient.get('/auth/verify', {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data.user;
    }
    async initiateSSO(provider, organizationDomain) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const response = await this.apiClient.post('/auth/sso/initiate', {
            provider,
            organizationDomain
        });
        return response.data;
    }
    async processSSOCallback(request) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const response = await this.apiClient.post(`/auth/sso/${request.provider}`, request);
        const result = response.data;
        this.emit('sso-login', {
            userId: result.user.id,
            provider: request.provider,
            organization: result.user.organization
        });
        return result;
    }
    async setupMFA(request) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const response = await this.apiClient.post('/auth/mfa/setup', request);
        this.emit('mfa-setup', {
            userId: request.userId,
            method: request.method
        });
        return response.data;
    }
    async verifyMFA(userId, code) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const response = await this.apiClient.post('/auth/mfa/verify', {
            userId,
            code
        });
        return response.data.valid;
    }
    async disableMFA(userId, confirmationCode) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        await this.apiClient.post('/auth/mfa/disable', {
            userId,
            confirmationCode
        });
        this.emit('mfa-disabled', { userId });
    }
    async createOrganization(config) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const response = await this.apiClient.post('/organizations', config);
        this.emit('organization-created', response.data);
        return response.data;
    }
    async updateOrganization(id, config) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const response = await this.apiClient.put(`/organizations/${id}`, config);
        this.emit('organization-updated', response.data);
        return response.data;
    }
    async getOrganization(id) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const response = await this.apiClient.get(`/organizations/${id}`);
        return response.data;
    }
    async createUser(userData) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const response = await this.apiClient.post('/users', userData);
        this.emit('user-created', response.data);
        return response.data;
    }
    async updateUser(id, userData) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const response = await this.apiClient.put(`/users/${id}`, userData);
        this.emit('user-updated', response.data);
        return response.data;
    }
    async getUser(id) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const response = await this.apiClient.get(`/users/${id}`);
        return response.data;
    }
    async listUsers(organizationId, teamId) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const params = {};
        if (organizationId)
            params.organizationId = organizationId;
        if (teamId)
            params.teamId = teamId;
        const response = await this.apiClient.get('/users', { params });
        return response.data;
    }
    async getAuditLogs(options = {}) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const response = await this.apiClient.get('/audit', { params: options });
        return response.data;
    }
    async getSecurityMetrics(organizationId) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const params = organizationId ? { organizationId } : {};
        const response = await this.apiClient.get('/security/metrics', { params });
        return response.data;
    }
    async runComplianceCheck(framework) {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const response = await this.apiClient.post('/compliance/check', { framework });
        return response.data;
    }
    async checkHealth() {
        if (!this.apiClient) {
            throw new Error('Enterprise auth service not available');
        }
        const response = await this.apiClient.get('/health');
        return response.data;
    }
    async shutdown() {
        if (this.authProcess) {
            this.authProcess.kill('SIGTERM');
            await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    this.authProcess?.kill('SIGKILL');
                    resolve();
                }, 5000);
                this.authProcess?.on('exit', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
        }
        this.initialized = false;
        this.emit('shutdown');
        logger_1.logger.info('Enterprise auth integration shut down');
    }
    isInitialized() {
        return this.initialized;
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.EnterpriseAuthIntegration = EnterpriseAuthIntegration;
exports.enterpriseAuth = new EnterpriseAuthIntegration({
    autoStart: true,
    complianceMode: process.env.COMPLIANCE_MODE || 'standard',
    soulfraPath: process.env.SOULFRA_PATH || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025'
});
//# sourceMappingURL=enterprise-auth.integration.js.map