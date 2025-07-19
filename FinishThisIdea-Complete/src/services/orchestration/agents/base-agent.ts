/**
 * Base Agent Implementation
 * Template for creating agents that can work with the orchestration system
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../../utils/logger';
import { agentRegistry, AgentCapability, AgentTask } from '../agent-registry.service';

export interface AgentConfig {
  name: string;
  type: string;
  version: string;
  description: string;
  capabilities: AgentCapability[];
  configuration: Record<string, any>;
}

export abstract class BaseAgent extends EventEmitter {
  protected id: string;
  protected config: AgentConfig;
  protected isRunning: boolean = false;
  protected currentTask?: AgentTask;
  
  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.id = '';
  }
  
  /**
   * Start the agent and register with the orchestration system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Agent is already running');
    }
    
    try {
      // Register with agent registry
      this.id = await agentRegistry.registerAgent({
        name: this.config.name,
        type: this.config.type,
        version: this.config.version,
        description: this.config.description,
        capabilities: this.config.capabilities,
        configuration: this.config.configuration,
        status: 'idle',
        performance: {
          successRate: 1.0,
          averageResponseTime: 1000,
          totalTasks: 0,
          lastSeen: new Date()
        }
      });
      
      this.isRunning = true;
      this.startTaskPolling();
      
      logger.info('Agent started', {
        agentId: this.id,
        name: this.config.name,
        type: this.config.type
      });
      
      this.emit('started');
      
    } catch (error) {
      logger.error('Failed to start agent', error);
      throw error;
    }
  }
  
  /**
   * Stop the agent and unregister from the orchestration system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    try {
      this.isRunning = false;
      
      // Complete current task if any
      if (this.currentTask) {
        await agentRegistry.failTask(this.currentTask.id, 'Agent stopped');
      }
      
      // Unregister from agent registry
      await agentRegistry.unregisterAgent(this.id);
      
      logger.info('Agent stopped', {
        agentId: this.id,
        name: this.config.name
      });
      
      this.emit('stopped');
      
    } catch (error) {
      logger.error('Failed to stop agent', error);
      throw error;
    }
  }
  
  /**
   * Check if agent can handle a specific task type
   */
  canHandle(taskType: string): boolean {
    return this.config.capabilities.some(cap => 
      cap.name === taskType || cap.inputTypes.includes(taskType)
    );
  }
  
  /**
   * Abstract method for processing tasks - must be implemented by subclasses
   */
  abstract processTask(task: AgentTask): Promise<any>;
  
  /**
   * Start polling for tasks
   */
  private startTaskPolling(): void {
    const pollInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(pollInterval);
        return;
      }
      
      if (this.currentTask) {
        return; // Already processing a task
      }
      
      try {
        await this.checkForTasks();
      } catch (error) {
        logger.error('Error polling for tasks', { agentId: this.id, error });
      }
    }, 5000); // Poll every 5 seconds
  }
  
  /**
   * Check for available tasks
   */
  private async checkForTasks(): Promise<void> {
    // Update agent status to show it's alive
    await agentRegistry.updateAgentStatus(this.id, 'idle');
    
    // In a real implementation, this would check for assigned tasks
    // For now, we'll simulate by checking if there are any pending tasks
    // that match our capabilities
    
    // This is a simplified polling mechanism
    // In production, you'd want a more efficient event-driven approach
  }
  
  /**
   * Execute a task assigned to this agent
   */
  async executeTask(task: AgentTask): Promise<void> {
    if (this.currentTask) {
      throw new Error('Agent is already processing a task');
    }
    
    this.currentTask = task;
    
    try {
      logger.info('Starting task execution', {
        agentId: this.id,
        taskId: task.id,
        taskType: task.type
      });
      
      // Update agent status
      await agentRegistry.updateAgentStatus(this.id, 'working');
      
      // Process the task
      await agentRegistry.updateTaskProgress(task.id, 10);
      
      const result = await this.processTask(task);
      
      // Mark task as completed
      await agentRegistry.updateTaskProgress(task.id, 100, result);
      
      // Update agent status back to idle
      await agentRegistry.updateAgentStatus(this.id, 'idle');
      
      logger.info('Task execution completed', {
        agentId: this.id,
        taskId: task.id
      });
      
      this.emit('taskCompleted', task, result);
      
    } catch (error) {
      logger.error('Task execution failed', {
        agentId: this.id,
        taskId: task.id,
        error
      });
      
      // Mark task as failed
      await agentRegistry.failTask(task.id, error instanceof Error ? error.message : 'Unknown error');
      
      // Update agent status back to idle
      await agentRegistry.updateAgentStatus(this.id, 'idle');
      
      this.emit('taskFailed', task, error);
      
    } finally {
      this.currentTask = undefined;
    }
  }
  
  /**
   * Update task progress
   */
  protected async updateProgress(progress: number, result?: any): Promise<void> {
    if (this.currentTask) {
      await agentRegistry.updateTaskProgress(this.currentTask.id, progress, result);
    }
  }
  
  /**
   * Get agent ID
   */
  getId(): string {
    return this.id;
  }
  
  /**
   * Get agent configuration
   */
  getConfig(): AgentConfig {
    return { ...this.config };
  }
  
  /**
   * Check if agent is running
   */
  isAgentRunning(): boolean {
    return this.isRunning;
  }
  
  /**
   * Get current task
   */
  getCurrentTask(): AgentTask | undefined {
    return this.currentTask;
  }
}