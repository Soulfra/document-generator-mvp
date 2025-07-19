import { EventEmitter } from 'events';
export interface K8sConfig {
    calKubernetesUrl?: string;
    serviceMeshUrl?: string;
    pulseOrchestratorPath?: string;
    autoStart?: boolean;
    soulfraPath?: string;
    portRange?: {
        min: number;
        max: number;
    };
    enableServiceMesh?: boolean;
    enablePulseMonitoring?: boolean;
    terraformPath?: string;
}
export interface Agent {
    id: string;
    serviceName: string;
    port: number;
    status: 'pending' | 'running' | 'failed';
    startTime: number;
    tier?: string;
    uptime?: number;
    process?: any;
}
export interface Service {
    name: string;
    host: string;
    port: number;
    healthy: boolean;
    endpoint?: string;
    tier?: string;
    dependencies?: string[];
    healthCheck?: string;
}
export interface DeploymentRequest {
    serviceName: string;
    replicas?: number;
    tier?: string;
    dependencies?: string[];
    environment?: Record<string, string>;
}
export interface ServiceMeshStatus {
    services: Array<{
        name: string;
        host: string;
        port: number;
        healthy: boolean;
        lastHeartbeat: number;
        messageCount: number;
        errorCount: number;
    }>;
    circuitBreakers: Array<{
        service: string;
        state: 'open' | 'closed' | 'half-open';
        failures: number;
        successes: number;
    }>;
    messageQueues: Array<{
        service: string;
        queueSize: number;
    }>;
}
export interface PulseStatus {
    lastPulse: number;
    reflectionAlive: boolean;
    qrIntegrity: boolean;
    deviceCount: number;
    driftDetected: boolean;
    llmHealth: {
        claude: boolean;
        ollama: boolean;
        deepseek: boolean;
    };
}
export interface DriftEvent {
    timestamp: number;
    pulse: number;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
}
export interface InfrastructureStatus {
    provider: 'aws' | 'gcp' | 'local';
    resources: {
        vpcId?: string;
        clusterName?: string;
        nodeCount?: number;
        databases?: Array<{
            name: string;
            status: string;
        }>;
        caches?: Array<{
            name: string;
            status: string;
        }>;
    };
    monitoring: {
        prometheus: boolean;
        grafana: boolean;
        datadog: boolean;
    };
    costs?: {
        current: number;
        projected: number;
        recommendations: string[];
    };
}
export declare class ProductionK8sIntegration extends EventEmitter {
    private config;
    private calKubernetesClient?;
    private serviceMeshWs?;
    private pulseProcess?;
    private initialized;
    private meshSecret?;
    private agentRegistry;
    private serviceDiscovery;
    constructor(config?: K8sConfig);
    initialize(): Promise<void>;
    private initializeCalKubernetes;
    private startCalKubernetes;
    private connectToServiceMesh;
    private setupMeshHandlers;
    private handleServiceAvailable;
    private handleServiceUnavailable;
    private handleMeshRequest;
    private handleMeshResponse;
    private startPulseMonitoring;
    private discoverServices;
    getClusterStatus(): Promise<{
        healthy: boolean;
        agents: Agent[];
        services: Service[];
        portPoolUsage: {
            used: number;
            available: number;
        };
        uptime: number;
    }>;
    deployService(request: DeploymentRequest): Promise<Agent>;
    scaleService(serviceName: string, replicas: number): Promise<void>;
    terminateAgent(agentId: string): Promise<void>;
    performHealthCheck(): Promise<Record<string, any>>;
    getServiceMeshStatus(): Promise<ServiceMeshStatus | null>;
    sendServiceRequest(targetService: string, payload: any, priority?: 'normal' | 'high'): Promise<string>;
    broadcastToServices(payload: any, excludeServices?: string[]): void;
    getPulseStatus(): Promise<PulseStatus | null>;
    getDriftLog(): Promise<DriftEvent[]>;
    getInfrastructureStatus(): Promise<InfrastructureStatus>;
    provisionInfrastructure(config: any): Promise<void>;
    getContainers(): Promise<any[]>;
    deployContainer(config: any): Promise<void>;
    checkHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        components: {
            calKubernetes: boolean;
            serviceMesh: boolean;
            pulseMonitor: boolean;
            infrastructure: boolean;
        };
        details: any;
    }>;
    shutdown(): Promise<void>;
    isInitialized(): boolean;
    getConfig(): K8sConfig;
    getAgents(): Agent[];
    getServices(): Service[];
}
export declare const productionK8s: ProductionK8sIntegration;
//# sourceMappingURL=production-k8s.integration.d.ts.map