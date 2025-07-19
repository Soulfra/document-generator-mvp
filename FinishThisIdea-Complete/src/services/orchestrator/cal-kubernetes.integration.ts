/**
 * Cal-Kubernetes Orchestrator Integration
 * 
 * Connects our platform with the existing Cal-Kubernetes orchestrator system
 * Provides access to 90+ agents, multi-ring architecture, and autonomous orchestration
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import axios, { AxiosInstance } from 'axios';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

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

export class CalKubernetesIntegration extends EventEmitter {
  private config: OrchestratorConfig;
  private apiClient?: AxiosInstance;
  private orchestratorProcess?: ChildProcess;
  private currentEndpoint?: string;
  private currentPort?: number;
  private initialized: boolean = false;
  private healthCheckInterval?: NodeJS.Timeout;

  // Pre-configured services from Cal-Kubernetes
  private readonly DEFAULT_SERVICES: Record<string, ServiceManifest> = {
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

  constructor(config: OrchestratorConfig = {}) {
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

  async initialize(): Promise<void> {
    try {
      // Try to discover running orchestrator
      if (this.config.autoDiscover) {
        await this.discoverOrchestrator();
      }

      if (!this.currentEndpoint && this.config.autoStart) {
        logger.info('Cal-Kubernetes orchestrator not found, starting new instance...');
        await this.startOrchestrator();
        await this.waitForOrchestrator();
      }

      if (!this.currentEndpoint) {
        throw new Error('Cal-Kubernetes orchestrator not available and autoStart is disabled');
      }

      // Setup API client
      this.setupApiClient();
      
      // Start health monitoring
      this.startHealthMonitoring();

      this.initialized = true;
      this.emit('initialized');
      
      logger.info('Cal-Kubernetes integration initialized', {
        endpoint: this.currentEndpoint,
        port: this.currentPort
      });

    } catch (error) {
      logger.error('Failed to initialize Cal-Kubernetes integration', error);
      throw error;
    }
  }

  private async discoverOrchestrator(): Promise<void> {
    const [startPort, endPort] = this.config.portRange!;
    
    for (let port = startPort; port <= endPort; port++) {
      try {
        const endpoint = `http://localhost:${port}`;
        const response = await axios.get(`${endpoint}/api/health`, { timeout: 1000 });
        
        if (response.data && response.data.status) {
          this.currentEndpoint = endpoint;
          this.currentPort = port;
          logger.info('Discovered Cal-Kubernetes orchestrator', { endpoint, port });
          return;
        }
      } catch (error) {
        // Continue searching
      }
    }

    logger.warn('No running Cal-Kubernetes orchestrator found');
  }

  private async startOrchestrator(): Promise<void> {
    if (!this.config.soulfraPath) {
      throw new Error('Soulfra path not configured');
    }

    const orchestratorPath = path.join(this.config.soulfraPath, 'misc', 'cal-kubernetes-orchestrator.js');
    
    this.orchestratorProcess = spawn('node', [orchestratorPath], {
      cwd: this.config.soulfraPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        NODE_PATH: this.config.soulfraPath
      }
    });

    this.orchestratorProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      logger.debug('Cal-Kubernetes stdout:', output);
      
      // Detect port from startup message
      const portMatch = output.match(/listening on port (\d+)/i);
      if (portMatch) {
        this.currentPort = parseInt(portMatch[1]);
        this.currentEndpoint = `http://localhost:${this.currentPort}`;
        this.emit('orchestrator-ready');
      }
    });

    this.orchestratorProcess.stderr?.on('data', (data) => {
      const error = data.toString();
      logger.warn('Cal-Kubernetes stderr:', error);
    });

    this.orchestratorProcess.on('exit', (code) => {
      logger.info('Cal-Kubernetes process exited', { code });
      this.orchestratorProcess = undefined;
      this.currentEndpoint = undefined;
      this.currentPort = undefined;
      this.emit('orchestrator-stopped', { code });
    });

    this.orchestratorProcess.on('error', (error) => {
      logger.error('Cal-Kubernetes process error', error);
      this.emit('orchestrator-error', error);
    });
  }

  private async waitForOrchestrator(): Promise<void> {
    const maxWait = 30000; // 30 seconds
    const interval = 1000; // 1 second
    let waited = 0;

    while (waited < maxWait && !this.currentEndpoint) {
      await new Promise(resolve => setTimeout(resolve, interval));
      waited += interval;
      
      // Try to discover again
      await this.discoverOrchestrator();
    }

    if (!this.currentEndpoint) {
      throw new Error('Cal-Kubernetes orchestrator failed to start within timeout');
    }
  }

  private setupApiClient(): void {
    if (!this.currentEndpoint) return;

    this.apiClient = axios.create({
      baseURL: this.currentEndpoint,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FinishThisIdea-Platform/1.0'
      }
    });

    // Add request/response interceptors
    this.apiClient.interceptors.request.use(
      (config) => {
        logger.debug('Cal-Kubernetes API request', { 
          method: config.method, 
          url: config.url 
        });
        return config;
      },
      (error) => {
        logger.error('Cal-Kubernetes API request error', error);
        return Promise.reject(error);
      }
    );

    this.apiClient.interceptors.response.use(
      (response) => {
        logger.debug('Cal-Kubernetes API response', { 
          status: response.status,
          url: response.config.url 
        });
        return response;
      },
      (error) => {
        logger.error('Cal-Kubernetes API error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const status = await this.getOrchestratorStatus();
        this.emit('health-update', status);
      } catch (error) {
        logger.warn('Health check failed', error);
        this.emit('health-error', error);
      }
    }, 30000); // Every 30 seconds
  }

  // Core Orchestrator Operations

  async getOrchestratorStatus(): Promise<OrchestratorStatus> {
    if (!this.apiClient || !this.currentEndpoint || !this.currentPort) {
      throw new Error('Cal-Kubernetes orchestrator not available');
    }

    const [healthResponse, agentsResponse, servicesResponse] = await Promise.all([
      this.apiClient.get('/api/health'),
      this.apiClient.get('/api/agents'),
      this.apiClient.get('/api/services')
    ]);

    const status: OrchestratorStatus = {
      endpoint: this.currentEndpoint,
      port: this.currentPort,
      agents: agentsResponse.data || [],
      services: servicesResponse.data || this.DEFAULT_SERVICES,
      health: {
        status: healthResponse.data.status || 'unknown',
        uptime: healthResponse.data.uptime || 0,
        totalAgents: agentsResponse.data?.length || 0,
        runningAgents: agentsResponse.data?.filter((a: AgentInfo) => a.status === 'running').length || 0,
        lastHealthCheck: Date.now()
      }
    };

    return status;
  }

  async listAgents(): Promise<AgentInfo[]> {
    if (!this.apiClient) {
      throw new Error('Cal-Kubernetes orchestrator not available');
    }

    const response = await this.apiClient.get('/api/agents');
    return response.data || [];
  }

  async deployAgent(request: DeploymentRequest): Promise<DeploymentResponse> {
    if (!this.apiClient) {
      throw new Error('Cal-Kubernetes orchestrator not available');
    }

    try {
      const response = await this.apiClient.post(`/api/deploy/${request.serviceName}`, {
        replicas: request.replicas || 1,
        tier: request.tier,
        config: request.config
      });

      const result: DeploymentResponse = {
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
    } catch (error: any) {
      const result: DeploymentResponse = {
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

  async terminateAgent(agentId: string): Promise<boolean> {
    if (!this.apiClient) {
      throw new Error('Cal-Kubernetes orchestrator not available');
    }

    try {
      await this.apiClient.delete(`/api/agents/${agentId}`);
      
      this.emit('agent-terminated', { agentId });
      return true;
    } catch (error) {
      logger.error('Failed to terminate agent', { agentId, error });
      return false;
    }
  }

  async scaleService(serviceName: string, replicas: number): Promise<DeploymentResponse> {
    if (!this.apiClient) {
      throw new Error('Cal-Kubernetes orchestrator not available');
    }

    try {
      const response = await this.apiClient.post(`/api/scale/${serviceName}`, {
        replicas
      });

      const result: DeploymentResponse = {
        success: true,
        message: response.data.message
      };

      this.emit('service-scaled', {
        serviceName,
        replicas,
        result: response.data
      });

      return result;
    } catch (error: any) {
      const result: DeploymentResponse = {
        success: false,
        error: error.response?.data?.error || error.message
      };

      return result;
    }
  }

  // Business Logic Methods

  async deployIdeaProcessingPipeline(): Promise<{
    success: boolean;
    agents: string[];
    endpoints: Record<string, string>;
  }> {
    const pipeline = [
      'idea-processor',
      'market-analyzer', 
      'cal-agent',
      'domingo-agent'
    ];

    const deployedAgents: string[] = [];
    const endpoints: Record<string, string> = {};

    try {
      for (const serviceName of pipeline) {
        const result = await this.deployAgent({ serviceName });
        
        if (result.success && result.agentId && result.port) {
          deployedAgents.push(result.agentId);
          endpoints[serviceName] = `http://localhost:${result.port}`;
        } else {
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
    } catch (error) {
      // Cleanup partially deployed agents
      for (const agentId of deployedAgents) {
        await this.terminateAgent(agentId);
      }

      throw error;
    }
  }

  async getAvailableServices(): Promise<Record<string, ServiceManifest>> {
    if (!this.apiClient) {
      return this.DEFAULT_SERVICES;
    }

    try {
      const response = await this.apiClient.get('/api/services');
      return response.data || this.DEFAULT_SERVICES;
    } catch (error) {
      logger.warn('Failed to get services from orchestrator, using defaults', error);
      return this.DEFAULT_SERVICES;
    }
  }

  async getMultiRingStatus(): Promise<Record<string, { port: number; status: string }>> {
    const multiRingPorts = {
      'api-gateway': 3000,
      'service-mesh': 7777,
      'vault-protection': 8888,
      'consciousness-ledger': 8889,
      'health-discovery': 9090,
      'soulfra-runtime': 8080,
      'debug-extraction': 9999
    };

    const status: Record<string, { port: number; status: string }> = {};

    for (const [service, port] of Object.entries(multiRingPorts)) {
      try {
        await axios.get(`http://localhost:${port}/health`, { timeout: 1000 });
        status[service] = { port, status: 'running' };
      } catch (error) {
        status[service] = { port, status: 'stopped' };
      }
    }

    return status;
  }

  // Utility Methods

  async checkHealth(): Promise<boolean> {
    try {
      const status = await this.getOrchestratorStatus();
      return status.health.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  async shutdown(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }

    if (this.orchestratorProcess) {
      this.orchestratorProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
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
    logger.info('Cal-Kubernetes integration shut down');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getCurrentEndpoint(): string | undefined {
    return this.currentEndpoint;
  }

  getConfig(): OrchestratorConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const calKubernetesOrchestrator = new CalKubernetesIntegration({
  autoDiscover: true,
  autoStart: true,
  soulfraPath: process.env.SOULFRA_PATH || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025'
});