import { EventEmitter } from 'events';
export interface OrchestratorConfig {
    autoDiscover?: boolean;
    autoStart?: boolean;
    portRange?: [number, number];
    soulfraPath?: string;
    serviceName?: string;
}
export interface AgentInfo {
    id: string;
    name: string;
    status: 'running' | 'stopped' | 'error' | 'pending';
    port: number;
    tier: string;
    health: 'healthy' | 'unhealthy' | 'unknown';
    lastSeen: number;
    metadata?: {
        script?: string;
        memory?: number;
        cpu?: number;
        uptime?: number;
    };
}
export interface ServiceManifest {
    script: string;
    tier: string;
    description?: string;
    dependencies?: string[];
    replicas?: number;
    port?: number;
}
export interface OrchestratorStatus {
    endpoint: string;
    port: number;
    agents: AgentInfo[];
    services: Record<string, ServiceManifest>;
    health: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        uptime: number;
        totalAgents: number;
        runningAgents: number;
        lastHealthCheck: number;
    };
    multiRingServices?: {
        'api-gateway'?: number;
        'service-mesh'?: number;
        'vault-protection'?: number;
        'consciousness-ledger'?: number;
        'health-discovery'?: number;
        'soulfra-runtime'?: number;
        'debug-extraction'?: number;
    };
}
export interface DeploymentRequest {
    serviceName: string;
    replicas?: number;
    tier?: string;
    config?: Record<string, any>;
}
export interface DeploymentResponse {
    success: boolean;
    agentId?: string;
    port?: number;
    message?: string;
    error?: string;
}
export declare class CalKubernetesIntegration extends EventEmitter {
    private config;
    private apiClient?;
    private orchestratorProcess?;
    private currentEndpoint?;
    private currentPort?;
    private initialized;
    private healthCheckInterval?;
    private readonly DEFAULT_SERVICES;
    constructor(config?: OrchestratorConfig);
    initialize(): Promise<void>;
    private discoverOrchestrator;
    private startOrchestrator;
    private waitForOrchestrator;
    private setupApiClient;
    private startHealthMonitoring;
    getOrchestratorStatus(): Promise<OrchestratorStatus>;
    listAgents(): Promise<AgentInfo[]>;
    deployAgent(request: DeploymentRequest): Promise<DeploymentResponse>;
    terminateAgent(agentId: string): Promise<boolean>;
    scaleService(serviceName: string, replicas: number): Promise<DeploymentResponse>;
    deployIdeaProcessingPipeline(): Promise<{
        success: boolean;
        agents: string[];
        endpoints: Record<string, string>;
    }>;
    getAvailableServices(): Promise<Record<string, ServiceManifest>>;
    getMultiRingStatus(): Promise<Record<string, {
        port: number;
        status: string;
    }>>;
    checkHealth(): Promise<boolean>;
    shutdown(): Promise<void>;
    isInitialized(): boolean;
    getCurrentEndpoint(): string | undefined;
    getConfig(): OrchestratorConfig;
}
export declare const calKubernetesOrchestrator: CalKubernetesIntegration;
//# sourceMappingURL=cal-kubernetes.integration.d.ts.map