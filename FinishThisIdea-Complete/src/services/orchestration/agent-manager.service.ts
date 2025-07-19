/**
 * Agent Manager Service
 * Manages the lifecycle of agents and provides auto-scaling capabilities
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { BaseAgent } from './agents/base-agent';
import { codeAnalysisAgent } from './agents/code-analysis-agent';
import { agentRegistry } from './agent-registry.service';
import { prometheusMetrics } from '../monitoring/prometheus-metrics.service';

export interface AgentManagerConfig {
  autoStart: boolean;
  autoScale: boolean;
  maxAgents: number;
  scaleThreshold: number;
  healthCheckInterval: number;
}

export class AgentManagerService extends EventEmitter {
  private agents: Map<string, BaseAgent> = new Map();
  private config: AgentManagerConfig;
  private healthCheckTimer?: NodeJS.Timeout;
  
  constructor(config: Partial<AgentManagerConfig> = {}) {
    super();
    
    this.config = {
      autoStart: true,
      autoScale: false,
      maxAgents: 10,
      scaleThreshold: 5, // Scale when queue has 5+ pending tasks
      healthCheckInterval: 30000, // 30 seconds
      ...config
    };
    
    if (this.config.autoStart) {
      this.autoStartAgents();
    }
    
    this.startHealthMonitoring();
  }
  
  /**
   * Register and start a new agent
   */
  async registerAgent(agent: BaseAgent): Promise<string> {
    try {
      await agent.start();
      const agentId = agent.getId();
      
      this.agents.set(agentId, agent);
      
      // Set up event listeners
      agent.on('taskCompleted', (task, result) => {
        this.emit('agentTaskCompleted', agentId, task, result);
        prometheusMetrics.recordAchievementUnlocked('agent_task_completed', 'orchestration');
      });
      
      agent.on('taskFailed', (task, error) => {
        this.emit('agentTaskFailed', agentId, task, error);
        logger.warn('Agent task failed', { agentId, taskId: task.id, error });
      });
      
      agent.on('stopped', () => {
        this.agents.delete(agentId);
        this.emit('agentStopped', agentId);
      });
      
      logger.info('Agent registered and started', {
        agentId,
        agentType: agent.getConfig().type,
        totalAgents: this.agents.size
      });
      
      this.emit('agentRegistered', agentId, agent);
      
      return agentId;
      
    } catch (error) {
      logger.error('Failed to register agent', { error });
      throw error;
    }
  }
  
  /**
   * Unregister and stop an agent
   */
  async unregisterAgent(agentId: string): Promise<boolean> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return false;
    }
    
    try {
      await agent.stop();
      this.agents.delete(agentId);
      
      logger.info('Agent unregistered', { agentId });
      this.emit('agentUnregistered', agentId);
      
      return true;
      
    } catch (error) {
      logger.error('Failed to unregister agent', { agentId, error });
      return false;
    }
  }
  
  /**
   * Get agent by ID
   */
  getAgent(agentId: string): BaseAgent | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * List all managed agents
   */
  listAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Get agents by type
   */
  getAgentsByType(type: string): BaseAgent[] {
    return Array.from(this.agents.values())
      .filter(agent => agent.getConfig().type === type);
  }
  
  /**
   * Get agent statistics
   */
  getStats(): {
    totalAgents: number;
    agentsByType: Record<string, number>;
    activeAgents: number;
    idleAgents: number;
  } {
    const agents = Array.from(this.agents.values());
    
    const agentsByType = agents.reduce((acc, agent) => {
      const type = agent.getConfig().type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const activeAgents = agents.filter(agent => agent.getCurrentTask()).length;
    const idleAgents = agents.length - activeAgents;
    
    return {
      totalAgents: agents.length,
      agentsByType,
      activeAgents,
      idleAgents
    };
  }
  
  /**
   * Auto-start default agents
   */
  private async autoStartAgents(): Promise<void> {
    try {
      logger.info('Auto-starting default agents');
      
      // Start code analysis agent
      await this.registerAgent(codeAnalysisAgent);
      
      // Add more default agents here as needed
      
      logger.info('Default agents started successfully');
      
    } catch (error) {
      logger.error('Failed to auto-start agents', error);
    }
  }
  
  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
      
      if (this.config.autoScale) {
        this.checkAutoScaling();
      }
    }, this.config.healthCheckInterval);
  }
  
  /**
   * Perform health check on all agents
   */
  private async performHealthCheck(): Promise<void> {
    const agents = Array.from(this.agents.values());
    
    for (const agent of agents) {
      try {
        if (!agent.isAgentRunning()) {
          logger.warn('Agent is not running, attempting restart', {
            agentId: agent.getId(),
            agentType: agent.getConfig().type
          });
          
          // Attempt to restart the agent
          await agent.start();
        }
      } catch (error) {
        logger.error('Agent health check failed', {
          agentId: agent.getId(),
          error
        });
        
        // Remove unhealthy agent
        this.agents.delete(agent.getId());
        this.emit('agentHealthCheckFailed', agent.getId(), error);
      }
    }
  }
  
  /**
   * Check if auto-scaling is needed
   */
  private async checkAutoScaling(): Promise<void> {
    try {
      const stats = agentRegistry.getStats();
      const queueLength = stats.tasks.queueLength;
      const currentAgents = this.agents.size;
      
      // Scale up if queue is too long and we haven't reached max agents
      if (queueLength >= this.config.scaleThreshold && currentAgents < this.config.maxAgents) {
        logger.info('Auto-scaling up agents', {
          queueLength,
          currentAgents,
          maxAgents: this.config.maxAgents
        });
        
        // Create a new code analysis agent
        const newAgent = new (await import('./agents/code-analysis-agent')).CodeAnalysisAgent();
        await this.registerAgent(newAgent);
        
        this.emit('agentScaledUp', newAgent.getId());
      }
      
      // Scale down if queue is empty and we have idle agents
      else if (queueLength === 0 && this.getStats().idleAgents > 1) {
        const idleAgents = Array.from(this.agents.values())
          .filter(agent => !agent.getCurrentTask());
        
        if (idleAgents.length > 1) {
          // Remove one idle agent
          const agentToRemove = idleAgents[0];
          await this.unregisterAgent(agentToRemove.getId());
          
          logger.info('Auto-scaling down agents', {
            removedAgentId: agentToRemove.getId(),
            remainingAgents: this.agents.size
          });
          
          this.emit('agentScaledDown', agentToRemove.getId());
        }
      }
      
    } catch (error) {
      logger.error('Auto-scaling check failed', error);
    }
  }
  
  /**
   * Stop all agents and cleanup
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down agent manager');
    
    // Clear health check timer
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    
    // Stop all agents
    const stopPromises = Array.from(this.agents.values()).map(agent => {
      return agent.stop().catch(error => {
        logger.error('Failed to stop agent during shutdown', {
          agentId: agent.getId(),
          error
        });
      });
    });
    
    await Promise.allSettled(stopPromises);
    
    this.agents.clear();
    this.emit('shutdown');
    
    logger.info('Agent manager shutdown complete');
  }
  
  /**
   * Get system health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    totalAgents: number;
    healthyAgents: number;
    issues: string[];
  } {
    const agents = Array.from(this.agents.values());
    const healthyAgents = agents.filter(agent => agent.isAgentRunning()).length;
    const issues: string[] = [];
    
    if (agents.length === 0) {
      issues.push('No agents are running');
    }
    
    if (healthyAgents < agents.length) {
      issues.push(`${agents.length - healthyAgents} agents are unhealthy`);
    }
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (issues.length === 0) {
      status = 'healthy';
    } else if (healthyAgents > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }
    
    return {
      status,
      totalAgents: agents.length,
      healthyAgents,
      issues
    };
  }
}

// Export singleton instance
export const agentManager = new AgentManagerService();