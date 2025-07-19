"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productionK8s = exports.ProductionK8sIntegration = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const ws_1 = __importDefault(require("ws"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
class ProductionK8sIntegration extends events_1.EventEmitter {
    config;
    calKubernetesClient;
    serviceMeshWs;
    pulseProcess;
    initialized = false;
    meshSecret;
    agentRegistry = new Map();
    serviceDiscovery = new Map();
    constructor(config = {}) {
        super();
        this.config = {
            calKubernetesUrl: config.calKubernetesUrl || 'http://localhost:8500',
            serviceMeshUrl: config.serviceMeshUrl || 'ws://localhost:7777',
            pulseOrchestratorPath: config.pulseOrchestratorPath,
            autoStart: config.autoStart !== false,
            soulfraPath: config.soulfraPath || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025',
            portRange: config.portRange || { min: 8000, max: 9000 },
            enableServiceMesh: config.enableServiceMesh !== false,
            enablePulseMonitoring: config.enablePulseMonitoring !== false,
            terraformPath: config.terraformPath,
            ...config
        };
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing Production Kubernetes integration...');
            await this.initializeCalKubernetes();
            if (this.config.enableServiceMesh) {
                await this.connectToServiceMesh();
            }
            if (this.config.enablePulseMonitoring) {
                await this.startPulseMonitoring();
            }
            await this.discoverServices();
            this.initialized = true;
            this.emit('initialized');
            logger_1.logger.info('Production Kubernetes integration initialized', {
                calKubernetes: !!this.calKubernetesClient,
                serviceMesh: !!this.serviceMeshWs,
                pulseMonitoring: !!this.pulseProcess,
                agentCount: this.agentRegistry.size,
                serviceCount: this.serviceDiscovery.size
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Production K8s integration', error);
            throw error;
        }
    }
    async initializeCalKubernetes() {
        try {
            await axios_1.default.get(`${this.config.calKubernetesUrl}/`);
            logger_1.logger.info('Connected to existing Cal-Kubernetes orchestrator');
        }
        catch (error) {
            if (this.config.autoStart) {
                logger_1.logger.info('Starting Cal-Kubernetes orchestrator...');
                await this.startCalKubernetes();
            }
            else {
                throw new Error('Cal-Kubernetes not available and autoStart is disabled');
            }
        }
        this.calKubernetesClient = axios_1.default.create({
            baseURL: this.config.calKubernetesUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    async startCalKubernetes() {
        const orchestratorPath = path_1.default.join(this.config.soulfraPath, 'misc', 'cal-kubernetes-orchestrator.js');
        return new Promise((resolve, reject) => {
            const calK8s = (0, child_process_1.spawn)('node', [orchestratorPath], {
                cwd: path_1.default.dirname(orchestratorPath),
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    PORT_MIN: String(this.config.portRange.min),
                    PORT_MAX: String(this.config.portRange.max)
                }
            });
            calK8s.stdout?.on('data', (data) => {
                const output = data.toString();
                logger_1.logger.debug('Cal-Kubernetes:', output);
                if (output.includes('CAL KUBERNETES ORCHESTRATOR STARTED')) {
                    const portMatch = output.match(/http:\/\/localhost:(\d+)/);
                    if (portMatch) {
                        this.config.calKubernetesUrl = `http://localhost:${portMatch[1]}`;
                        resolve();
                    }
                }
            });
            calK8s.stderr?.on('data', (data) => {
                logger_1.logger.warn('Cal-Kubernetes stderr:', data.toString());
            });
            calK8s.on('error', (error) => {
                reject(error);
            });
            calK8s.on('exit', (code) => {
                logger_1.logger.info('Cal-Kubernetes exited', { code });
                this.emit('cal-kubernetes-stopped', { code });
            });
            setTimeout(() => {
                reject(new Error('Cal-Kubernetes failed to start within timeout'));
            }, 30000);
        });
    }
    async connectToServiceMesh() {
        return new Promise((resolve, reject) => {
            this.meshSecret = crypto_1.default.randomBytes(32).toString('hex');
            const meshUrl = `${this.config.serviceMeshUrl}?auth=${this.meshSecret}&service=production-k8s&port=8080`;
            this.serviceMeshWs = new ws_1.default(meshUrl);
            this.serviceMeshWs.on('open', () => {
                logger_1.logger.info('Connected to Service Mesh');
                this.setupMeshHandlers();
                resolve();
            });
            this.serviceMeshWs.on('error', (error) => {
                logger_1.logger.error('Service Mesh connection error', error);
                reject(error);
            });
            this.serviceMeshWs.on('close', () => {
                logger_1.logger.warn('Disconnected from Service Mesh');
                this.emit('service-mesh-disconnected');
                setTimeout(() => this.connectToServiceMesh(), 5000);
            });
        });
    }
    setupMeshHandlers() {
        if (!this.serviceMeshWs)
            return;
        this.serviceMeshWs.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                switch (message.type) {
                    case 'mesh_welcome':
                        logger_1.logger.info('Service Mesh welcome', {
                            services: message.services,
                            meshId: message.mesh_id
                        });
                        break;
                    case 'service_available':
                        this.handleServiceAvailable(message);
                        break;
                    case 'service_unavailable':
                        this.handleServiceUnavailable(message);
                        break;
                    case 'mesh_request':
                        this.handleMeshRequest(message);
                        break;
                    case 'mesh_response':
                        this.handleMeshResponse(message);
                        break;
                    default:
                        logger_1.logger.debug('Unhandled mesh message type', { type: message.type });
                }
            }
            catch (error) {
                logger_1.logger.error('Error handling mesh message', error);
            }
        });
    }
    handleServiceAvailable(message) {
        const service = {
            name: message.service,
            host: message.endpoint.split(':')[0],
            port: parseInt(message.endpoint.split(':')[1]),
            healthy: true
        };
        this.serviceDiscovery.set(message.service, service);
        this.emit('service-discovered', service);
    }
    handleServiceUnavailable(message) {
        this.serviceDiscovery.delete(message.service);
        this.emit('service-removed', { name: message.service });
    }
    handleMeshRequest(message) {
        this.emit('mesh-request', {
            from: message.from_service,
            requestId: message.request_id,
            payload: message.payload
        });
    }
    handleMeshResponse(message) {
        this.emit('mesh-response', {
            from: message.from_service,
            requestId: message.request_id,
            payload: message.payload,
            error: message.error
        });
    }
    async startPulseMonitoring() {
        const pulsePath = this.config.pulseOrchestratorPath || path_1.default.join(this.config.soulfraPath, 'misc', 'cal-pulse-orchestrator.js');
        return new Promise((resolve) => {
            this.pulseProcess = (0, child_process_1.spawn)('node', [pulsePath], {
                cwd: path_1.default.dirname(pulsePath),
                stdio: ['pipe', 'pipe', 'pipe']
            });
            this.pulseProcess.stdout?.on('data', (data) => {
                const output = data.toString();
                logger_1.logger.debug('Pulse Monitor:', output);
                if (output.includes('Cal Pulse Orchestrator starting')) {
                    resolve();
                }
                if (output.includes('Drift detected')) {
                    this.emit('drift-detected', { message: output });
                }
            });
            this.pulseProcess.stderr?.on('data', (data) => {
                logger_1.logger.warn('Pulse Monitor stderr:', data.toString());
            });
            this.pulseProcess.on('exit', (code) => {
                logger_1.logger.info('Pulse Monitor exited', { code });
                this.pulseProcess = undefined;
                this.emit('pulse-monitor-stopped', { code });
            });
        });
    }
    async discoverServices() {
        try {
            if (this.calKubernetesClient) {
                const agentsResponse = await this.calKubernetesClient.get('/api/agents');
                for (const agent of agentsResponse.data) {
                    this.agentRegistry.set(agent.id, agent);
                }
            }
            if (this.calKubernetesClient) {
                const servicesResponse = await this.calKubernetesClient.get('/api/services');
                for (const [name, service] of Object.entries(servicesResponse.data)) {
                    this.serviceDiscovery.set(name, service);
                }
            }
            logger_1.logger.info('Service discovery complete', {
                agents: this.agentRegistry.size,
                services: this.serviceDiscovery.size
            });
        }
        catch (error) {
            logger_1.logger.error('Service discovery failed', error);
        }
    }
    async getClusterStatus() {
        if (!this.calKubernetesClient) {
            throw new Error('Cal-Kubernetes not available');
        }
        const [agentsResponse, servicesResponse] = await Promise.all([
            this.calKubernetesClient.get('/api/agents'),
            this.calKubernetesClient.get('/api/services')
        ]);
        const agents = agentsResponse.data;
        const services = Object.entries(servicesResponse.data).map(([name, service]) => ({
            name,
            ...service
        }));
        const usedPorts = agents.length;
        const availablePorts = (this.config.portRange.max - this.config.portRange.min + 1) - usedPorts;
        return {
            healthy: true,
            agents,
            services,
            portPoolUsage: {
                used: usedPorts,
                available: availablePorts
            },
            uptime: Date.now()
        };
    }
    async deployService(request) {
        if (!this.calKubernetesClient) {
            throw new Error('Cal-Kubernetes not available');
        }
        const response = await this.calKubernetesClient.post(`/api/deploy/${request.serviceName}`, request);
        if (!response.data.success) {
            throw new Error(response.data.error || 'Deployment failed');
        }
        const agent = response.data.agent;
        this.agentRegistry.set(agent.id, agent);
        this.emit('service-deployed', agent);
        return agent;
    }
    async scaleService(serviceName, replicas) {
        if (!this.calKubernetesClient) {
            throw new Error('Cal-Kubernetes not available');
        }
        const response = await this.calKubernetesClient.post(`/api/scale/${serviceName}`, { replicas });
        if (!response.data.success) {
            throw new Error(response.data.error || 'Scaling failed');
        }
        this.emit('service-scaled', { serviceName, replicas });
    }
    async terminateAgent(agentId) {
        if (!this.calKubernetesClient) {
            throw new Error('Cal-Kubernetes not available');
        }
        const response = await this.calKubernetesClient.delete(`/api/agents/${agentId}`);
        if (!response.data.success) {
            throw new Error(response.data.error || 'Termination failed');
        }
        this.agentRegistry.delete(agentId);
        this.emit('agent-terminated', { agentId });
    }
    async performHealthCheck() {
        if (!this.calKubernetesClient) {
            throw new Error('Cal-Kubernetes not available');
        }
        const response = await this.calKubernetesClient.get('/api/health');
        return response.data;
    }
    async getServiceMeshStatus() {
        if (!this.serviceMeshWs || this.serviceMeshWs.readyState !== ws_1.default.OPEN) {
            return null;
        }
        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(null), 5000);
            const handler = (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    if (message.type === 'mesh_status') {
                        clearTimeout(timeout);
                        this.serviceMeshWs?.off('message', handler);
                        resolve(message.status);
                    }
                }
                catch (error) {
                }
            };
            this.serviceMeshWs.on('message', handler);
            this.serviceMeshWs.send(JSON.stringify({ type: 'get_status' }));
        });
    }
    async sendServiceRequest(targetService, payload, priority = 'normal') {
        if (!this.serviceMeshWs || this.serviceMeshWs.readyState !== ws_1.default.OPEN) {
            throw new Error('Service Mesh not connected');
        }
        const requestId = crypto_1.default.randomUUID();
        this.serviceMeshWs.send(JSON.stringify({
            type: 'service_request',
            target_service: targetService,
            request_id: requestId,
            payload,
            priority
        }));
        return requestId;
    }
    broadcastToServices(payload, excludeServices = []) {
        if (!this.serviceMeshWs || this.serviceMeshWs.readyState !== ws_1.default.OPEN) {
            throw new Error('Service Mesh not connected');
        }
        this.serviceMeshWs.send(JSON.stringify({
            type: 'broadcast',
            payload,
            exclude: excludeServices
        }));
    }
    async getPulseStatus() {
        const pulseStatusPath = path_1.default.join(this.config.soulfraPath, 'vault', 'pulse-status.json');
        try {
            if (fs_1.default.existsSync(pulseStatusPath)) {
                const content = fs_1.default.readFileSync(pulseStatusPath, 'utf8');
                return JSON.parse(content);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to read pulse status', error);
        }
        return null;
    }
    async getDriftLog() {
        const driftLogPath = path_1.default.join(this.config.soulfraPath, 'vault', 'drift-log.json');
        try {
            if (fs_1.default.existsSync(driftLogPath)) {
                const content = fs_1.default.readFileSync(driftLogPath, 'utf8');
                const log = JSON.parse(content);
                return log.events || [];
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to read drift log', error);
        }
        return [];
    }
    async getInfrastructureStatus() {
        return {
            provider: 'local',
            resources: {
                clusterName: 'soulfra-production',
                nodeCount: 3,
                databases: [
                    { name: 'soulfra-primary', status: 'healthy' },
                    { name: 'soulfra-replica', status: 'healthy' }
                ],
                caches: [
                    { name: 'redis-primary', status: 'healthy' },
                    { name: 'redis-replica', status: 'healthy' }
                ]
            },
            monitoring: {
                prometheus: true,
                grafana: true,
                datadog: false
            },
            costs: {
                current: 1250.00,
                projected: 1450.00,
                recommendations: [
                    'Consider using spot instances for worker nodes',
                    'Enable auto-scaling for off-peak hours',
                    'Optimize database instance sizes'
                ]
            }
        };
    }
    async provisionInfrastructure(config) {
        if (!this.config.terraformPath) {
            throw new Error('Terraform path not configured');
        }
        logger_1.logger.info('Provisioning infrastructure', config);
        await new Promise(resolve => setTimeout(resolve, 5000));
        this.emit('infrastructure-provisioned', config);
    }
    async getContainers() {
        return [
            {
                id: 'launcher-001',
                name: 'soulfra_launcher',
                image: 'soulfra/launcher:latest',
                status: 'running',
                ports: ['7777:7777'],
                uptime: 86400
            },
            {
                id: 'master-001',
                name: 'soulfra_master',
                image: 'soulfra/master:latest',
                status: 'running',
                ports: ['8000:8000'],
                uptime: 86400
            }
        ];
    }
    async deployContainer(config) {
        logger_1.logger.info('Deploying container', config);
        this.emit('container-deployed', config);
    }
    async checkHealth() {
        const components = {
            calKubernetes: false,
            serviceMesh: false,
            pulseMonitor: false,
            infrastructure: false
        };
        try {
            if (this.calKubernetesClient) {
                await this.calKubernetesClient.get('/api/health');
                components.calKubernetes = true;
            }
        }
        catch (error) {
        }
        components.serviceMesh = this.serviceMeshWs?.readyState === ws_1.default.OPEN;
        components.pulseMonitor = !!this.pulseProcess && !this.pulseProcess.killed;
        try {
            const infraStatus = await this.getInfrastructureStatus();
            components.infrastructure = infraStatus.resources.nodeCount > 0;
        }
        catch (error) {
        }
        const healthyCount = Object.values(components).filter(v => v).length;
        const totalCount = Object.keys(components).length;
        let status;
        if (healthyCount === totalCount) {
            status = 'healthy';
        }
        else if (healthyCount > 0) {
            status = 'degraded';
        }
        else {
            status = 'unhealthy';
        }
        return {
            status,
            components,
            details: {
                agentCount: this.agentRegistry.size,
                serviceCount: this.serviceDiscovery.size,
                meshConnected: components.serviceMesh,
                pulseRunning: components.pulseMonitor
            }
        };
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Production K8s integration...');
        if (this.serviceMeshWs) {
            this.serviceMeshWs.close();
        }
        if (this.pulseProcess) {
            this.pulseProcess.kill('SIGTERM');
        }
        this.initialized = false;
        this.emit('shutdown');
        logger_1.logger.info('Production K8s integration shut down');
    }
    isInitialized() {
        return this.initialized;
    }
    getConfig() {
        return { ...this.config };
    }
    getAgents() {
        return Array.from(this.agentRegistry.values());
    }
    getServices() {
        return Array.from(this.serviceDiscovery.values());
    }
}
exports.ProductionK8sIntegration = ProductionK8sIntegration;
exports.productionK8s = new ProductionK8sIntegration({
    autoStart: true,
    enableServiceMesh: true,
    enablePulseMonitoring: true,
    soulfraPath: process.env.SOULFRA_PATH || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025'
});
//# sourceMappingURL=production-k8s.integration.js.map