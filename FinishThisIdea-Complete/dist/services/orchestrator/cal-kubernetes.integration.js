"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calKubernetesOrchestrator = exports.CalKubernetesIntegration = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
class CalKubernetesIntegration extends events_1.EventEmitter {
    config;
    apiClient;
    orchestratorProcess;
    currentEndpoint;
    currentPort;
    initialized = false;
    healthCheckInterval;
    DEFAULT_SERVICES = {
        'semantic-api': {
            script: 'semantic-graph/semantic_api_router.js',
            tier: 'memory',
            description: 'Semantic analysis and graph operations'
        },
        'infinity-router': {
            script: 'infinity-router-server.js',
            tier: 'auth',
            description: 'Authentication and routing service'
        },
        'cal-interface': {
            script: 'runtime/riven-cli-server.js',
            tier: 'interface',
            description: 'Cal AI agent interface'
        },
        'main-dashboard': {
            script: 'server.js',
            tier: 'presentation',
            description: 'Main orchestrator dashboard'
        },
        'cal-agent': {
            script: 'agents/cal-agent.js',
            tier: 'intelligence',
            description: 'Strategic and analytical AI agent'
        },
        'domingo-agent': {
            script: 'agents/domingo-agent.js',
            tier: 'intelligence',
            description: 'Creative and adaptive AI agent'
        },
        'idea-processor': {
            script: 'agents/idea-processor.js',
            tier: 'business',
            description: 'Business idea analysis and processing'
        },
        'market-analyzer': {
            script: 'agents/market-analyzer.js',
            tier: 'business',
            description: 'Market analysis and competitive intelligence'
        }
    };
    constructor(config = {}) {
        super();
        this.config = {
            autoDiscover: config.autoDiscover !== false,
            autoStart: config.autoStart !== false,
            portRange: config.portRange || [8000, 9000],
            soulfraPath: config.soulfraPath || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025',
            serviceName: config.serviceName || 'cal-kubernetes-orchestrator',
            ...config
        };
    }
    async initialize() {
        try {
            if (this.config.autoDiscover) {
                await this.discoverOrchestrator();
            }
            if (!this.currentEndpoint && this.config.autoStart) {
                logger_1.logger.info('Cal-Kubernetes orchestrator not found, starting new instance...');
                await this.startOrchestrator();
                await this.waitForOrchestrator();
            }
            if (!this.currentEndpoint) {
                throw new Error('Cal-Kubernetes orchestrator not available and autoStart is disabled');
            }
            this.setupApiClient();
            this.startHealthMonitoring();
            this.initialized = true;
            this.emit('initialized');
            logger_1.logger.info('Cal-Kubernetes integration initialized', {
                endpoint: this.currentEndpoint,
                port: this.currentPort
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Cal-Kubernetes integration', error);
            throw error;
        }
    }
    async discoverOrchestrator() {
        const [startPort, endPort] = this.config.portRange;
        for (let port = startPort; port <= endPort; port++) {
            try {
                const endpoint = `http://localhost:${port}`;
                const response = await axios_1.default.get(`${endpoint}/api/health`, { timeout: 1000 });
                if (response.data && response.data.status) {
                    this.currentEndpoint = endpoint;
                    this.currentPort = port;
                    logger_1.logger.info('Discovered Cal-Kubernetes orchestrator', { endpoint, port });
                    return;
                }
            }
            catch (error) {
            }
        }
        logger_1.logger.warn('No running Cal-Kubernetes orchestrator found');
    }
    async startOrchestrator() {
        if (!this.config.soulfraPath) {
            throw new Error('Soulfra path not configured');
        }
        const orchestratorPath = path_1.default.join(this.config.soulfraPath, 'misc', 'cal-kubernetes-orchestrator.js');
        this.orchestratorProcess = (0, child_process_1.spawn)('node', [orchestratorPath], {
            cwd: this.config.soulfraPath,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env,
                NODE_PATH: this.config.soulfraPath
            }
        });
        this.orchestratorProcess.stdout?.on('data', (data) => {
            const output = data.toString();
            logger_1.logger.debug('Cal-Kubernetes stdout:', output);
            const portMatch = output.match(/listening on port (\d+)/i);
            if (portMatch) {
                this.currentPort = parseInt(portMatch[1]);
                this.currentEndpoint = `http://localhost:${this.currentPort}`;
                this.emit('orchestrator-ready');
            }
        });
        this.orchestratorProcess.stderr?.on('data', (data) => {
            const error = data.toString();
            logger_1.logger.warn('Cal-Kubernetes stderr:', error);
        });
        this.orchestratorProcess.on('exit', (code) => {
            logger_1.logger.info('Cal-Kubernetes process exited', { code });
            this.orchestratorProcess = undefined;
            this.currentEndpoint = undefined;
            this.currentPort = undefined;
            this.emit('orchestrator-stopped', { code });
        });
        this.orchestratorProcess.on('error', (error) => {
            logger_1.logger.error('Cal-Kubernetes process error', error);
            this.emit('orchestrator-error', error);
        });
    }
    async waitForOrchestrator() {
        const maxWait = 30000;
        const interval = 1000;
        let waited = 0;
        while (waited < maxWait && !this.currentEndpoint) {
            await new Promise(resolve => setTimeout(resolve, interval));
            waited += interval;
            await this.discoverOrchestrator();
        }
        if (!this.currentEndpoint) {
            throw new Error('Cal-Kubernetes orchestrator failed to start within timeout');
        }
    }
    setupApiClient() {
        if (!this.currentEndpoint)
            return;
        this.apiClient = axios_1.default.create({
            baseURL: this.currentEndpoint,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FinishThisIdea-Platform/1.0'
            }
        });
        this.apiClient.interceptors.request.use((config) => {
            logger_1.logger.debug('Cal-Kubernetes API request', {
                method: config.method,
                url: config.url
            });
            return config;
        }, (error) => {
            logger_1.logger.error('Cal-Kubernetes API request error', error);
            return Promise.reject(error);
        });
        this.apiClient.interceptors.response.use((response) => {
            logger_1.logger.debug('Cal-Kubernetes API response', {
                status: response.status,
                url: response.config.url
            });
            return response;
        }, (error) => {
            logger_1.logger.error('Cal-Kubernetes API error', {
                status: error.response?.status,
                url: error.config?.url,
                message: error.message
            });
            return Promise.reject(error);
        });
    }
    startHealthMonitoring() {
        this.healthCheckInterval = setInterval(async () => {
            try {
                const status = await this.getOrchestratorStatus();
                this.emit('health-update', status);
            }
            catch (error) {
                logger_1.logger.warn('Health check failed', error);
                this.emit('health-error', error);
            }
        }, 30000);
    }
    async getOrchestratorStatus() {
        if (!this.apiClient || !this.currentEndpoint || !this.currentPort) {
            throw new Error('Cal-Kubernetes orchestrator not available');
        }
        const [healthResponse, agentsResponse, servicesResponse] = await Promise.all([
            this.apiClient.get('/api/health'),
            this.apiClient.get('/api/agents'),
            this.apiClient.get('/api/services')
        ]);
        const status = {
            endpoint: this.currentEndpoint,
            port: this.currentPort,
            agents: agentsResponse.data || [],
            services: servicesResponse.data || this.DEFAULT_SERVICES,
            health: {
                status: healthResponse.data.status || 'unknown',
                uptime: healthResponse.data.uptime || 0,
                totalAgents: agentsResponse.data?.length || 0,
                runningAgents: agentsResponse.data?.filter((a) => a.status === 'running').length || 0,
                lastHealthCheck: Date.now()
            }
        };
        return status;
    }
    async listAgents() {
        if (!this.apiClient) {
            throw new Error('Cal-Kubernetes orchestrator not available');
        }
        const response = await this.apiClient.get('/api/agents');
        return response.data || [];
    }
    async deployAgent(request) {
        if (!this.apiClient) {
            throw new Error('Cal-Kubernetes orchestrator not available');
        }
        try {
            const response = await this.apiClient.post(`/api/deploy/${request.serviceName}`, {
                replicas: request.replicas || 1,
                tier: request.tier,
                config: request.config
            });
            const result = {
                success: true,
                agentId: response.data.agentId,
                port: response.data.port,
                message: response.data.message
            };
            this.emit('agent-deployed', {
                serviceName: request.serviceName,
                agentId: result.agentId,
                port: result.port
            });
            return result;
        }
        catch (error) {
            const result = {
                success: false,
                error: error.response?.data?.error || error.message
            };
            this.emit('deployment-failed', {
                serviceName: request.serviceName,
                error: result.error
            });
            return result;
        }
    }
    async terminateAgent(agentId) {
        if (!this.apiClient) {
            throw new Error('Cal-Kubernetes orchestrator not available');
        }
        try {
            await this.apiClient.delete(`/api/agents/${agentId}`);
            this.emit('agent-terminated', { agentId });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to terminate agent', { agentId, error });
            return false;
        }
    }
    async scaleService(serviceName, replicas) {
        if (!this.apiClient) {
            throw new Error('Cal-Kubernetes orchestrator not available');
        }
        try {
            const response = await this.apiClient.post(`/api/scale/${serviceName}`, {
                replicas
            });
            const result = {
                success: true,
                message: response.data.message
            };
            this.emit('service-scaled', {
                serviceName,
                replicas,
                result: response.data
            });
            return result;
        }
        catch (error) {
            const result = {
                success: false,
                error: error.response?.data?.error || error.message
            };
            return result;
        }
    }
    async deployIdeaProcessingPipeline() {
        const pipeline = [
            'idea-processor',
            'market-analyzer',
            'cal-agent',
            'domingo-agent'
        ];
        const deployedAgents = [];
        const endpoints = {};
        try {
            for (const serviceName of pipeline) {
                const result = await this.deployAgent({ serviceName });
                if (result.success && result.agentId && result.port) {
                    deployedAgents.push(result.agentId);
                    endpoints[serviceName] = `http://localhost:${result.port}`;
                }
                else {
                    throw new Error(`Failed to deploy ${serviceName}: ${result.error}`);
                }
            }
            this.emit('pipeline-deployed', {
                pipeline: 'idea-processing',
                agents: deployedAgents,
                endpoints
            });
            return {
                success: true,
                agents: deployedAgents,
                endpoints
            };
        }
        catch (error) {
            for (const agentId of deployedAgents) {
                await this.terminateAgent(agentId);
            }
            throw error;
        }
    }
    async getAvailableServices() {
        if (!this.apiClient) {
            return this.DEFAULT_SERVICES;
        }
        try {
            const response = await this.apiClient.get('/api/services');
            return response.data || this.DEFAULT_SERVICES;
        }
        catch (error) {
            logger_1.logger.warn('Failed to get services from orchestrator, using defaults', error);
            return this.DEFAULT_SERVICES;
        }
    }
    async getMultiRingStatus() {
        const multiRingPorts = {
            'api-gateway': 3000,
            'service-mesh': 7777,
            'vault-protection': 8888,
            'consciousness-ledger': 8889,
            'health-discovery': 9090,
            'soulfra-runtime': 8080,
            'debug-extraction': 9999
        };
        const status = {};
        for (const [service, port] of Object.entries(multiRingPorts)) {
            try {
                await axios_1.default.get(`http://localhost:${port}/health`, { timeout: 1000 });
                status[service] = { port, status: 'running' };
            }
            catch (error) {
                status[service] = { port, status: 'stopped' };
            }
        }
        return status;
    }
    async checkHealth() {
        try {
            const status = await this.getOrchestratorStatus();
            return status.health.status === 'healthy';
        }
        catch (error) {
            return false;
        }
    }
    async shutdown() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = undefined;
        }
        if (this.orchestratorProcess) {
            this.orchestratorProcess.kill('SIGTERM');
            await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    this.orchestratorProcess?.kill('SIGKILL');
                    resolve();
                }, 5000);
                this.orchestratorProcess?.on('exit', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
        }
        this.initialized = false;
        this.currentEndpoint = undefined;
        this.currentPort = undefined;
        this.emit('shutdown');
        logger_1.logger.info('Cal-Kubernetes integration shut down');
    }
    isInitialized() {
        return this.initialized;
    }
    getCurrentEndpoint() {
        return this.currentEndpoint;
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.CalKubernetesIntegration = CalKubernetesIntegration;
exports.calKubernetesOrchestrator = new CalKubernetesIntegration({
    autoDiscover: true,
    autoStart: true,
    soulfraPath: process.env.SOULFRA_PATH || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025'
});
//# sourceMappingURL=cal-kubernetes.integration.js.map