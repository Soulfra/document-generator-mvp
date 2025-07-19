"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enterpriseDashboard = exports.EnterpriseDashboardIntegration = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
class EnterpriseDashboardIntegration extends events_1.EventEmitter {
    config;
    apiClient;
    dashboardProcess;
    initialized = false;
    currentPort;
    realtimeConnection;
    constructor(config = {}) {
        super();
        this.config = {
            serviceUrl: config.serviceUrl || 'http://localhost:5000',
            autoStart: config.autoStart !== false,
            soulfraPath: config.soulfraPath || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025',
            port: config.port || 5000,
            enableExports: config.enableExports !== false,
            enableRealTime: config.enableRealTime !== false,
            ...config
        };
    }
    async initialize() {
        try {
            await this.checkDashboardService();
            logger_1.logger.info('Connected to existing enterprise dashboard service');
        }
        catch (error) {
            if (this.config.autoStart) {
                logger_1.logger.info('Dashboard service not running, starting new instance...');
                await this.startDashboardService();
                await this.waitForDashboardService();
            }
            else {
                throw new Error('Dashboard service not available and autoStart is disabled');
            }
        }
        this.setupApiClient();
        if (this.config.enableRealTime) {
            await this.setupRealtimeConnection();
        }
        this.initialized = true;
        this.emit('initialized');
        logger_1.logger.info('Enterprise dashboard integration initialized', {
            url: this.config.serviceUrl,
            port: this.currentPort,
            realtime: this.config.enableRealTime,
            exports: this.config.enableExports
        });
    }
    async startDashboardService() {
        if (!this.config.soulfraPath) {
            throw new Error('Soulfra path not configured');
        }
        const dashboardPath = path_1.default.join(this.config.soulfraPath, 'misc', 'enterprise-dashboard-engine_tier-minus20.js');
        this.dashboardProcess = (0, child_process_1.spawn)('node', [dashboardPath], {
            cwd: this.config.soulfraPath,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env,
                PORT: this.config.port.toString(),
                ENABLE_EXPORTS: this.config.enableExports.toString(),
                ENABLE_REALTIME: this.config.enableRealTime.toString(),
                NODE_PATH: this.config.soulfraPath
            }
        });
        this.dashboardProcess.stdout?.on('data', (data) => {
            const output = data.toString();
            logger_1.logger.debug('Dashboard service stdout:', output);
            if (output.includes('Dashboard service listening')) {
                this.emit('dashboard-service-ready');
            }
        });
        this.dashboardProcess.stderr?.on('data', (data) => {
            const error = data.toString();
            logger_1.logger.warn('Dashboard service stderr:', error);
        });
        this.dashboardProcess.on('exit', (code) => {
            logger_1.logger.info('Dashboard service process exited', { code });
            this.dashboardProcess = undefined;
            this.emit('dashboard-service-stopped', { code });
        });
        this.dashboardProcess.on('error', (error) => {
            logger_1.logger.error('Dashboard service process error', error);
            this.emit('dashboard-service-error', error);
        });
    }
    async waitForDashboardService() {
        const maxWait = 30000;
        const interval = 1000;
        let waited = 0;
        while (waited < maxWait) {
            try {
                await this.checkDashboardService();
                return;
            }
            catch (error) {
                await new Promise(resolve => setTimeout(resolve, interval));
                waited += interval;
            }
        }
        throw new Error('Dashboard service failed to start within timeout');
    }
    async checkDashboardService() {
        const response = await axios_1.default.get(`${this.config.serviceUrl}/health`);
        return response.data.status === 'healthy';
    }
    setupApiClient() {
        this.apiClient = axios_1.default.create({
            baseURL: this.config.serviceUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FinishThisIdea-Platform/1.0'
            }
        });
        this.apiClient.interceptors.request.use((config) => {
            logger_1.logger.debug('Dashboard API request', {
                method: config.method,
                url: config.url
            });
            return config;
        }, (error) => {
            logger_1.logger.error('Dashboard API request error', error);
            return Promise.reject(error);
        });
        this.apiClient.interceptors.response.use((response) => {
            logger_1.logger.debug('Dashboard API response', {
                status: response.status,
                url: response.config.url
            });
            return response;
        }, (error) => {
            logger_1.logger.error('Dashboard API error', {
                status: error.response?.status,
                url: error.config?.url,
                message: error.message
            });
            return Promise.reject(error);
        });
    }
    async setupRealtimeConnection() {
        const wsUrl = this.config.serviceUrl.replace('http', 'ws') + '/realtime';
        this.realtimeConnection = new WebSocket(wsUrl);
        this.realtimeConnection.onopen = () => {
            logger_1.logger.info('Real-time dashboard connection established');
            this.emit('realtime-connected');
        };
        this.realtimeConnection.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.emit('realtime-data', data);
            }
            catch (error) {
                logger_1.logger.error('Failed to parse real-time data', error);
            }
        };
        this.realtimeConnection.onclose = () => {
            logger_1.logger.warn('Real-time dashboard connection closed');
            this.emit('realtime-disconnected');
            setTimeout(() => {
                if (this.initialized) {
                    this.setupRealtimeConnection();
                }
            }, 5000);
        };
        this.realtimeConnection.onerror = (error) => {
            logger_1.logger.error('Real-time dashboard connection error', error);
            this.emit('realtime-error', error);
        };
    }
    async getDashboardMetrics(timeRange) {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const params = timeRange ? {
            startDate: timeRange.start.toISOString(),
            endDate: timeRange.end.toISOString()
        } : {};
        const response = await this.apiClient.get('/metrics', { params });
        return response.data;
    }
    async getDepartmentView(department, tenantId) {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const params = tenantId ? { tenantId } : {};
        const response = await this.apiClient.get(`/departments/${department}`, { params });
        return response.data;
    }
    async getIndustryDashboard(industry, tenantId) {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const params = tenantId ? { tenantId } : {};
        const response = await this.apiClient.get(`/industry/${industry}`, { params });
        return response.data;
    }
    async getRealtimeData() {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const response = await this.apiClient.get('/realtime');
        return response.data;
    }
    async getPredictiveAnalytics(category, timeframe = '30d') {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const response = await this.apiClient.get(`/analytics/predictive/${category}`, {
            params: { timeframe }
        });
        return response.data;
    }
    async generateInsights(dataPoints, timeRange) {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const response = await this.apiClient.post('/analytics/insights', {
            dataPoints,
            timeRange
        });
        return response.data;
    }
    async runBusinessIntelligence(query) {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const response = await this.apiClient.post('/analytics/business-intelligence', query);
        return response.data;
    }
    async createCustomWidget(widget) {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const response = await this.apiClient.post('/widgets', widget);
        const createdWidget = response.data;
        this.emit('widget-created', {
            widgetId: createdWidget.id,
            name: createdWidget.name,
            type: createdWidget.type
        });
        return createdWidget;
    }
    async updateCustomWidget(widgetId, updates) {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const response = await this.apiClient.put(`/widgets/${widgetId}`, updates);
        this.emit('widget-updated', {
            widgetId,
            updates
        });
        return response.data;
    }
    async getCustomWidgets(userId) {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const params = userId ? { userId } : {};
        const response = await this.apiClient.get('/widgets', { params });
        return response.data;
    }
    async deleteCustomWidget(widgetId) {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        await this.apiClient.delete(`/widgets/${widgetId}`);
        this.emit('widget-deleted', { widgetId });
    }
    async exportDashboard(exportConfig) {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const response = await this.apiClient.post('/exports', exportConfig);
        const exportResult = response.data;
        this.emit('dashboard-exported', {
            exportId: exportResult.exportId,
            type: exportConfig.type,
            title: exportConfig.title
        });
        return exportResult;
    }
    async getExportStatus(exportId) {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const response = await this.apiClient.get(`/exports/${exportId}`);
        return response.data;
    }
    async scheduleReport(schedule) {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const response = await this.apiClient.post('/reports/schedule', schedule);
        this.emit('report-scheduled', {
            scheduleId: response.data.scheduleId,
            name: schedule.name,
            frequency: schedule.frequency
        });
        return response.data;
    }
    async createAlert(alert) {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const response = await this.apiClient.post('/alerts', alert);
        this.emit('alert-created', {
            alertId: response.data.alertId,
            name: alert.name,
            metric: alert.metric
        });
        return response.data;
    }
    async getActiveAlerts() {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const response = await this.apiClient.get('/alerts/active');
        return response.data;
    }
    async getSystemPerformance() {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const response = await this.apiClient.get('/performance');
        return response.data;
    }
    async getBusinessMetrics(department) {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const params = department ? { department } : {};
        const response = await this.apiClient.get('/business-metrics', { params });
        return response.data;
    }
    async checkHealth() {
        if (!this.apiClient) {
            throw new Error('Dashboard service not available');
        }
        const response = await this.apiClient.get('/health');
        return response.data;
    }
    async shutdown() {
        if (this.realtimeConnection) {
            this.realtimeConnection.close();
            this.realtimeConnection = undefined;
        }
        if (this.dashboardProcess) {
            this.dashboardProcess.kill('SIGTERM');
            await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    this.dashboardProcess?.kill('SIGKILL');
                    resolve();
                }, 5000);
                this.dashboardProcess?.on('exit', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
        }
        this.initialized = false;
        this.emit('shutdown');
        logger_1.logger.info('Enterprise dashboard integration shut down');
    }
    isInitialized() {
        return this.initialized;
    }
    hasRealtimeConnection() {
        return this.realtimeConnection?.readyState === WebSocket.OPEN;
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.EnterpriseDashboardIntegration = EnterpriseDashboardIntegration;
exports.enterpriseDashboard = new EnterpriseDashboardIntegration({
    autoStart: true,
    enableExports: true,
    enableRealTime: true,
    soulfraPath: process.env.SOULFRA_PATH || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025'
});
//# sourceMappingURL=enterprise-dashboard.integration.js.map