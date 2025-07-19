/**
 * Agent Registry Service
 * Central registry for managing AI agents with capabilities, performance tracking, and lifecycle management
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { prisma } from '../../utils/database';
import { redis } from '../../config/redis';
import { prometheusMetrics } from '../monitoring/prometheus-metrics.service';

export interface AgentCapability {
  name: string;
  description: string;
  inputTypes: string[];
  outputTypes: string[];
  complexity: 'low' | 'medium' | 'high';
  estimatedCost: number;
}

export interface AgentDefinition {
  id: string;
  name: string;
  type: string;
  version: string;
  description: string;
  capabilities: AgentCapability[];
  configuration: Record<string, any>;
  status: 'idle' | 'working' | 'failed' | 'maintenance';
  performance: {
    successRate: number;
    averageResponseTime: number;
    totalTasks: number;
    lastSeen: Date;
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tags: string[];
  };
}

export interface AgentTask {
  id: string;
  agentId: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  payload: Record<string, any>;
  status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: Record<string, any>;
  error?: string;
  createdAt: Date;
  assignedAt?: Date;
  completedAt?: Date;
  timeoutAt: Date;
}

export class AgentRegistryService {
  private agents: Map<string, AgentDefinition> = new Map();
  private tasks: Map<string, AgentTask> = new Map();
  private taskQueue: AgentTask[] = [];
  private readonly REDIS_PREFIX = 'agent_registry:';
  
  constructor() {
    // Delay initialization to avoid Redis connection during module loading
    setImmediate(() => {
      this.initialize().catch(error => {
        logger.error('Failed to initialize AgentRegistryService', error);
      });
    });
  }

  private async initialize(): Promise<void> {
    await this.loadFromPersistence();
    this.startTaskProcessor();
    this.startHealthChecker();
  }
  
  /**
   * Register a new agent in the system
   */
  async registerAgent(definition: Omit<AgentDefinition, 'id' | 'metadata'>): Promise<string> {
    const agentId = uuidv4();
    const now = new Date();
    
    const agent: AgentDefinition = {
      ...definition,
      id: agentId,
      metadata: {
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        tags: definition.type ? [definition.type] : []
      }
    };
    
    this.agents.set(agentId, agent);
    await this.persistAgent(agent);
    
    logger.info('Agent registered', {
      agentId,
      name: agent.name,
      type: agent.type,
      capabilities: agent.capabilities.length
    });
    
    // Record metrics
    prometheusMetrics.recordAchievementUnlocked('agent_registered', 'system');
    
    return agentId;
  }
  
  /**
   * Unregister an agent from the system
   */
  async unregisterAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }
    
    // Cancel any running tasks
    const runningTasks = Array.from(this.tasks.values())
      .filter(task => task.agentId === agentId && task.status === 'running');
    
    for (const task of runningTasks) {
      await this.failTask(task.id, 'Agent unregistered');
    }
    
    this.agents.delete(agentId);
    await this.removeFromPersistence(agentId);
    
    logger.info('Agent unregistered', { agentId, name: agent.name });
    
    return true;
  }
  
  /**
   * Submit a task for agent processing
   */
  async submitTask(
    type: string,
    payload: Record<string, any>,
    priority: AgentTask['priority'] = 'medium',
    timeoutMinutes: number = 30
  ): Promise<string> {
    const taskId = uuidv4();
    const now = new Date();
    const timeoutAt = new Date(now.getTime() + timeoutMinutes * 60 * 1000);
    
    const task: AgentTask = {
      id: taskId,
      agentId: '',
      type,
      priority,
      payload,
      status: 'pending',
      progress: 0,
      createdAt: now,
      timeoutAt
    };
    
    this.tasks.set(taskId, task);
    this.taskQueue.push(task);
    this.sortTaskQueue();
    
    await this.persistTask(task);
    
    logger.info('Task submitted', {
      taskId,
      type,
      priority,
      timeoutMinutes
    });
    
    return taskId;
  }
  
  /**
   * Get task status and result
   */
  getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }
  
  /**
   * Get all tasks for an agent
   */
  getAgentTasks(agentId: string): AgentTask[] {
    return Array.from(this.tasks.values())
      .filter(task => task.agentId === agentId);
  }
  
  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentDefinition | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * List all agents with optional filtering
   */
  listAgents(filter?: {
    type?: string;
    status?: AgentDefinition['status'];
    capabilities?: string[];
  }): AgentDefinition[] {
    let agents = Array.from(this.agents.values());
    
    if (filter) {
      if (filter.type) {
        agents = agents.filter(agent => agent.type === filter.type);
      }
      
      if (filter.status) {
        agents = agents.filter(agent => agent.status === filter.status);
      }
      
      if (filter.capabilities) {
        agents = agents.filter(agent =>
          filter.capabilities!.some(cap =>
            agent.capabilities.some(agentCap => agentCap.name === cap)
          )
        );
      }
    }
    
    return agents;
  }
  
  /**
   * Update agent status
   */
  async updateAgentStatus(agentId: string, status: AgentDefinition['status']): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }
    
    agent.status = status;
    agent.metadata.updatedAt = new Date();
    agent.performance.lastSeen = new Date();
    
    await this.persistAgent(agent);
    
    logger.debug('Agent status updated', { agentId, status });
    
    return true;
  }
  
  /**
   * Update task progress
   */
  async updateTaskProgress(taskId: string, progress: number, result?: Record<string, any>): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }
    
    task.progress = Math.max(0, Math.min(100, progress));
    
    if (result) {
      task.result = { ...task.result, ...result };
    }
    
    if (progress >= 100) {
      task.status = 'completed';
      task.completedAt = new Date();
      
      // Update agent performance
      const agent = this.agents.get(task.agentId);
      if (agent) {
        agent.performance.totalTasks++;
        this.updateAgentPerformance(agent, true);
      }
      
      logger.info('Task completed', { taskId, agentId: task.agentId });
    }
    
    await this.persistTask(task);
    
    return true;
  }
  
  /**
   * Fail a task with error message
   */
  async failTask(taskId: string, error: string): Promise<boolean> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }
    
    task.status = 'failed';
    task.error = error;
    task.completedAt = new Date();
    
    // Update agent performance
    const agent = this.agents.get(task.agentId);
    if (agent) {
      agent.performance.totalTasks++;
      this.updateAgentPerformance(agent, false);
    }
    
    await this.persistTask(task);
    
    logger.warn('Task failed', { taskId, agentId: task.agentId, error });
    
    return true;
  }
  
  /**
   * Get system statistics
   */
  getStats(): {
    agents: {
      total: number;
      byStatus: Record<string, number>;
      byType: Record<string, number>;
    };
    tasks: {
      total: number;
      byStatus: Record<string, number>;
      byType: Record<string, number>;
      queueLength: number;
    };
  } {
    const agents = Array.from(this.agents.values());
    const tasks = Array.from(this.tasks.values());
    
    return {
      agents: {
        total: agents.length,
        byStatus: this.groupBy(agents, 'status'),
        byType: this.groupBy(agents, 'type')
      },
      tasks: {
        total: tasks.length,
        byStatus: this.groupBy(tasks, 'status'),
        byType: this.groupBy(tasks, 'type'),
        queueLength: this.taskQueue.length
      }
    };
  }
  
  /**
   * Find best agent for a task
   */
  private findBestAgent(task: AgentTask): AgentDefinition | null {
    const availableAgents = Array.from(this.agents.values())
      .filter(agent => 
        agent.status === 'idle' &&
        agent.capabilities.some(cap => cap.name === task.type || cap.inputTypes.includes(task.type))
      );
    
    if (availableAgents.length === 0) {
      return null;
    }
    
    // Sort by performance and capability match
    availableAgents.sort((a, b) => {
      const aScore = a.performance.successRate * 0.7 + (1 / (a.performance.averageResponseTime || 1)) * 0.3;
      const bScore = b.performance.successRate * 0.7 + (1 / (b.performance.averageResponseTime || 1)) * 0.3;
      return bScore - aScore;
    });
    
    return availableAgents[0];
  }
  
  /**
   * Process task queue
   */
  private async processTaskQueue(): Promise<void> {
    if (this.taskQueue.length === 0) {
      return;
    }
    
    const task = this.taskQueue.shift()!;
    const agent = this.findBestAgent(task);
    
    if (!agent) {
      // Put task back in queue
      this.taskQueue.unshift(task);
      return;
    }
    
    // Assign task to agent
    task.agentId = agent.id;
    task.status = 'assigned';
    task.assignedAt = new Date();
    
    agent.status = 'working';
    
    await Promise.all([
      this.persistTask(task),
      this.persistAgent(agent)
    ]);
    
    logger.info('Task assigned', {
      taskId: task.id,
      agentId: agent.id,
      agentName: agent.name,
      taskType: task.type
    });
    
    // Simulate task processing (in real implementation, this would be handled by the agent)
    this.simulateTaskProcessing(task);
  }
  
  /**
   * Simulate task processing (placeholder for real agent integration)
   */
  private async simulateTaskProcessing(task: AgentTask): Promise<void> {
    setTimeout(async () => {
      // Mark task as running
      task.status = 'running';
      await this.persistTask(task);
      
      // Simulate progress updates
      for (let progress = 10; progress <= 100; progress += 10) {
        setTimeout(async () => {
          await this.updateTaskProgress(task.id, progress);
        }, (progress / 10) * 1000);
      }
    }, 100);
  }
  
  /**
   * Start task processor
   */
  private startTaskProcessor(): void {
    setInterval(() => {
      this.processTaskQueue();
    }, 1000);
  }
  
  /**
   * Start health checker
   */
  private startHealthChecker(): void {
    setInterval(() => {
      this.checkAgentHealth();
      this.checkTaskTimeouts();
    }, 30000);
  }
  
  /**
   * Check agent health and availability
   */
  private async checkAgentHealth(): Promise<void> {
    const now = new Date();
    const healthCheckThreshold = 5 * 60 * 1000; // 5 minutes
    
    for (const agent of this.agents.values()) {
      const lastSeen = agent.performance.lastSeen?.getTime() || 0;
      
      if (now.getTime() - lastSeen > healthCheckThreshold) {
        if (agent.status !== 'failed' && agent.status !== 'maintenance') {
          agent.status = 'failed';
          await this.persistAgent(agent);
          
          logger.warn('Agent marked as failed due to health check', {
            agentId: agent.id,
            name: agent.name,
            lastSeen: agent.performance.lastSeen
          });
        }
      }
    }
  }
  
  /**
   * Check for timed-out tasks
   */
  private async checkTaskTimeouts(): Promise<void> {
    const now = new Date();
    
    for (const task of this.tasks.values()) {
      if (task.status === 'running' && now > task.timeoutAt) {
        await this.failTask(task.id, 'Task timeout');
        
        // Reset agent status
        const agent = this.agents.get(task.agentId);
        if (agent) {
          agent.status = 'idle';
          await this.persistAgent(agent);
        }
      }
    }
  }
  
  /**
   * Update agent performance metrics
   */
  private updateAgentPerformance(agent: AgentDefinition, success: boolean): void {
    const { performance } = agent;
    const totalTasks = performance.totalTasks;
    
    // Update success rate using exponential moving average
    const alpha = 0.1;
    const newSuccessRate = success ? 1 : 0;
    performance.successRate = performance.successRate * (1 - alpha) + newSuccessRate * alpha;
    
    // Update average response time (simplified)
    // In real implementation, this would track actual response times
    performance.averageResponseTime = Math.random() * 1000 + 500; // 500-1500ms
  }
  
  /**
   * Sort task queue by priority and creation time
   */
  private sortTaskQueue(): void {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    
    this.taskQueue.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }
  
  /**
   * Group array by property
   */
  private groupBy<T>(array: T[], property: keyof T): Record<string, number> {
    return array.reduce((acc, item) => {
      const key = String(item[property]);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
  
  /**
   * Persist agent to Redis
   */
  private async persistAgent(agent: AgentDefinition): Promise<void> {
    try {
      await redis.setex(
        `${this.REDIS_PREFIX}agent:${agent.id}`,
        3600,
        JSON.stringify(agent)
      );
    } catch (error) {
      logger.error('Failed to persist agent', { agentId: agent.id, error });
    }
  }
  
  /**
   * Persist task to Redis
   */
  private async persistTask(task: AgentTask): Promise<void> {
    try {
      await redis.setex(
        `${this.REDIS_PREFIX}task:${task.id}`,
        86400,
        JSON.stringify(task)
      );
    } catch (error) {
      logger.error('Failed to persist task', { taskId: task.id, error });
    }
  }
  
  /**
   * Remove agent from persistence
   */
  private async removeFromPersistence(agentId: string): Promise<void> {
    try {
      await redis.del(`${this.REDIS_PREFIX}agent:${agentId}`);
    } catch (error) {
      logger.error('Failed to remove agent from persistence', { agentId, error });
    }
  }
  
  /**
   * Load agents and tasks from persistence
   */
  private async loadFromPersistence(): Promise<void> {
    try {
      const keys = await redis.keys(`${this.REDIS_PREFIX}*`);
      
      for (const key of keys) {
        const data = await redis.get(key);
        if (!data) continue;
        
        const parsed = JSON.parse(data);
        
        if (key.includes(':agent:')) {
          // Restore date objects
          parsed.metadata.createdAt = new Date(parsed.metadata.createdAt);
          parsed.metadata.updatedAt = new Date(parsed.metadata.updatedAt);
          parsed.performance.lastSeen = new Date(parsed.performance.lastSeen);
          
          this.agents.set(parsed.id, parsed);
        } else if (key.includes(':task:')) {
          // Restore date objects
          parsed.createdAt = new Date(parsed.createdAt);
          parsed.timeoutAt = new Date(parsed.timeoutAt);
          if (parsed.assignedAt) parsed.assignedAt = new Date(parsed.assignedAt);
          if (parsed.completedAt) parsed.completedAt = new Date(parsed.completedAt);
          
          this.tasks.set(parsed.id, parsed);
          
          if (parsed.status === 'pending') {
            this.taskQueue.push(parsed);
          }
        }
      }
      
      this.sortTaskQueue();
      
      logger.info('Loaded from persistence', {
        agents: this.agents.size,
        tasks: this.tasks.size,
        queuedTasks: this.taskQueue.length
      });
      
    } catch (error) {
      logger.error('Failed to load from persistence', error);
    }
  }
}

// Export singleton instance
export const agentRegistry = new AgentRegistryService();