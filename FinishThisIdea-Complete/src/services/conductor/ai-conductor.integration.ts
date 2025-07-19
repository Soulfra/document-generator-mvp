import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../utils/logger';
import { EventEmitter } from 'events';
import axios from 'axios';
import path from 'path';

const execAsync = promisify(exec);

export interface ConductorConfig {
  pythonPath: string;
  conductorScript: string;
  apiPort: number;
  webSocketPort: number;
  dbPath: string;
}

export interface ConversationRequest {
  content: string;
  source: 'claude' | 'gpt4' | 'gemini' | 'local';
  threadId: string;
  userId?: string;
  metadata?: any;
}

export interface ThoughtChainRequest {
  goal: string;
  context: string;
  maxDepth: number;
  userId?: string;
}

export interface ThoughtNode {
  id: string;
  parentId?: string;
  thought: string;
  reasoning: string;
  confidence: number;
  pathScore: number;
  children?: ThoughtNode[];
}

export interface AIBuilder {
  id: string;
  name: string;
  type: 'claude' | 'gpt4' | 'gemini' | 'local';
  status: 'idle' | 'building' | 'blocked' | 'error';
  currentProject?: string;
  capabilities: string[];
  performance: {
    completedTasks: number;
    successRate: number;
    avgResponseTime: number;
  };
}

export interface ProjectState {
  id: string;
  name: string;
  goal: string;
  currentState: string;
  nextActions: string[];
  blockers: string[];
  aiAssignments: Record<string, string>;
  progress: number;
  updatedAt: string;
}

export interface OrchestrationResult {
  projectId: string;
  assignments: Record<string, string>;
  timeline: string[];
  confidence: number;
  estimatedCompletion: string;
}

export class AIConductorIntegration extends EventEmitter {
  private config: ConductorConfig;
  private conductorProcess: ChildProcess | null = null;
  private isRunning: boolean = false;
  private apiBaseUrl: string;

  constructor(config?: Partial<ConductorConfig>) {
    super();
    
    this.config = {
      pythonPath: 'python3',
      conductorScript: '/Users/matthewmauer/Desktop/soulfra-agentzero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025/agents/AI_CONDUCTOR_SYSTEM.py',
      apiPort: 8090,
      webSocketPort: 8091,
      dbPath: './conductor_brain.db',
      ...config
    };
    
    this.apiBaseUrl = `http://localhost:${this.config.apiPort}`;
  }

  async startConductor(): Promise<void> {
    if (this.isRunning) {
      logger.warn('AI Conductor already running');
      return;
    }

    try {
      logger.info('Starting AI Conductor system', { config: this.config });

      // Check if Python script exists
      const scriptExists = await this.checkScriptExists();
      if (!scriptExists) {
        throw new Error(`Conductor script not found: ${this.config.conductorScript}`);
      }

      // Start the Python conductor process
      this.conductorProcess = spawn(this.config.pythonPath, [
        this.config.conductorScript,
        '--api-port', this.config.apiPort.toString(),
        '--ws-port', this.config.webSocketPort.toString(),
        '--db-path', this.config.dbPath
      ], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      });

      // Handle process events
      this.conductorProcess.stdout?.on('data', (data) => {
        const message = data.toString().trim();
        logger.info('Conductor stdout', { message });
        this.emit('output', message);
      });

      this.conductorProcess.stderr?.on('data', (data) => {
        const error = data.toString().trim();
        logger.warn('Conductor stderr', { error });
        this.emit('error', error);
      });

      this.conductorProcess.on('close', (code) => {
        logger.info('Conductor process closed', { code });
        this.isRunning = false;
        this.emit('stopped', code);
      });

      this.conductorProcess.on('error', (error) => {
        logger.error('Conductor process error', { error });
        this.isRunning = false;
        this.emit('error', error);
      });

      // Wait for conductor to be ready
      await this.waitForReady();
      this.isRunning = true;
      
      logger.info('AI Conductor started successfully');
      this.emit('started');

    } catch (error) {
      logger.error('Failed to start AI Conductor', { error });
      throw error;
    }
  }

  async stopConductor(): Promise<void> {
    if (!this.isRunning || !this.conductorProcess) {
      logger.warn('AI Conductor not running');
      return;
    }

    try {
      logger.info('Stopping AI Conductor system');
      
      // Try graceful shutdown first
      this.conductorProcess.kill('SIGTERM');
      
      // Force kill after timeout
      setTimeout(() => {
        if (this.conductorProcess && !this.conductorProcess.killed) {
          this.conductorProcess.kill('SIGKILL');
        }
      }, 5000);

      this.isRunning = false;
      this.conductorProcess = null;
      
      logger.info('AI Conductor stopped');
      this.emit('stopped');

    } catch (error) {
      logger.error('Error stopping AI Conductor', { error });
      throw error;
    }
  }

  async ingestConversation(request: ConversationRequest): Promise<void> {
    if (!this.isRunning) {
      throw new Error('AI Conductor not running');
    }

    try {
      const response = await axios.post(`${this.apiBaseUrl}/ingest`, {
        content: request.content,
        source: request.source,
        thread_id: request.threadId,
        user_id: request.userId,
        metadata: request.metadata,
        timestamp: new Date().toISOString()
      });

      logger.info('Conversation ingested', { 
        threadId: request.threadId, 
        source: request.source,
        success: response.data.success 
      });

    } catch (error) {
      logger.error('Failed to ingest conversation', { error, request });
      throw new Error('Failed to ingest conversation into AI Conductor');
    }
  }

  async generateThoughtChain(request: ThoughtChainRequest): Promise<ThoughtNode[]> {
    if (!this.isRunning) {
      throw new Error('AI Conductor not running');
    }

    try {
      const response = await axios.post(`${this.apiBaseUrl}/thought-chain`, {
        goal: request.goal,
        context: request.context,
        max_depth: request.maxDepth,
        user_id: request.userId
      });

      const thoughts = response.data.thoughts || [];
      
      logger.info('Thought chain generated', { 
        goal: request.goal,
        nodeCount: thoughts.length,
        maxDepth: request.maxDepth
      });

      return this.formatThoughtNodes(thoughts);

    } catch (error) {
      logger.error('Failed to generate thought chain', { error, request });
      throw new Error('Failed to generate thought chain');
    }
  }

  async getAIBuilders(): Promise<AIBuilder[]> {
    if (!this.isRunning) {
      throw new Error('AI Conductor not running');
    }

    try {
      const response = await axios.get(`${this.apiBaseUrl}/builders`);
      
      return response.data.builders.map(builder => ({
        id: builder.id,
        name: builder.name,
        type: builder.type,
        status: builder.status,
        currentProject: builder.current_project,
        capabilities: builder.capabilities || [],
        performance: {
          completedTasks: builder.completed_tasks || 0,
          successRate: builder.success_rate || 0,
          avgResponseTime: builder.avg_response_time || 0
        }
      }));

    } catch (error) {
      logger.error('Failed to get AI builders', { error });
      throw new Error('Failed to get AI builders');
    }
  }

  async orchestrateProject(projectId: string): Promise<OrchestrationResult> {
    if (!this.isRunning) {
      throw new Error('AI Conductor not running');
    }

    try {
      const response = await axios.post(`${this.apiBaseUrl}/orchestrate`, {
        project_id: projectId
      });

      const result = response.data;
      
      logger.info('Project orchestrated', { 
        projectId,
        assignmentCount: Object.keys(result.assignments || {}).length
      });

      return {
        projectId,
        assignments: result.assignments || {},
        timeline: result.timeline || [],
        confidence: result.confidence || 0.8,
        estimatedCompletion: result.estimated_completion
      };

    } catch (error) {
      logger.error('Failed to orchestrate project', { error, projectId });
      throw new Error('Failed to orchestrate project');
    }
  }

  async getProjectStates(): Promise<ProjectState[]> {
    if (!this.isRunning) {
      throw new Error('AI Conductor not running');
    }

    try {
      const response = await axios.get(`${this.apiBaseUrl}/projects`);
      
      return response.data.projects.map(project => ({
        id: project.id,
        name: project.name,
        goal: project.goal,
        currentState: project.current_state,
        nextActions: project.next_actions || [],
        blockers: project.blockers || [],
        aiAssignments: project.ai_assignments || {},
        progress: project.progress || 0,
        updatedAt: project.updated_at
      }));

    } catch (error) {
      logger.error('Failed to get project states', { error });
      throw new Error('Failed to get project states');
    }
  }

  async getConductorStatus(): Promise<any> {
    if (!this.isRunning) {
      return { running: false, error: 'Conductor not started' };
    }

    try {
      const response = await axios.get(`${this.apiBaseUrl}/status`);
      return {
        running: true,
        ...response.data
      };

    } catch (error) {
      logger.error('Failed to get conductor status', { error });
      return { 
        running: false, 
        error: 'Failed to connect to conductor API' 
      };
    }
  }

  private async checkScriptExists(): Promise<boolean> {
    try {
      const { access } = await import('fs/promises');
      await access(this.config.conductorScript);
      return true;
    } catch {
      return false;
    }
  }

  private async waitForReady(timeout: number = 30000): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/health`, {
          timeout: 1000
        });
        
        if (response.status === 200) {
          return;
        }
      } catch (error) {
        // Conductor not ready yet, continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('AI Conductor failed to start within timeout period');
  }

  private formatThoughtNodes(thoughts: any[]): ThoughtNode[] {
    return thoughts.map(thought => ({
      id: thought.id,
      parentId: thought.parent_id,
      thought: thought.thought,
      reasoning: thought.reasoning,
      confidence: thought.confidence,
      pathScore: thought.path_score,
      children: thought.children ? this.formatThoughtNodes(thought.children) : undefined
    }));
  }

  isRunning(): boolean {
    return this.isRunning;
  }
}

// Export singleton instance
export const aiConductorIntegration = new AIConductorIntegration();