/**
 * Agent Orchestration API Routes
 * REST endpoints for managing agents, tasks, and orchestration plans
 */

import { Router, Request, Response } from 'express';
import { agentRegistry } from '../../services/orchestration/agent-registry.service';
import { aiConductor } from '../../services/orchestration/ai-conductor.service';
import { logger } from '../../utils/logger';
import { authentication } from '../../middleware/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authentication({ optional: true }));

/**
 * POST /api/orchestration/agents
 * Register a new agent
 */
router.post('/agents', async (req: Request, res: Response) => {
  try {
    const { name, type, version, description, capabilities, configuration } = req.body;
    
    if (!name || !type || !capabilities) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, type, and capabilities are required'
        }
      });
    }
    
    const agentId = await agentRegistry.registerAgent({
      name,
      type,
      version: version || '1.0.0',
      description: description || '',
      capabilities,
      configuration: configuration || {},
      status: 'idle',
      performance: {
        successRate: 1.0,
        averageResponseTime: 1000,
        totalTasks: 0,
        lastSeen: new Date()
      }
    });
    
    res.status(201).json({
      success: true,
      data: {
        agentId,
        message: 'Agent registered successfully'
      }
    });
    
  } catch (error) {
    logger.error('Failed to register agent', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: 'Failed to register agent'
      }
    });
  }
});

/**
 * GET /api/orchestration/agents
 * List all agents with optional filtering
 */
router.get('/agents', async (req: Request, res: Response) => {
  try {
    const { type, status, capabilities } = req.query;
    
    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (capabilities) {
      filter.capabilities = Array.isArray(capabilities) 
        ? capabilities as string[]
        : [capabilities as string];
    }
    
    const agents = agentRegistry.listAgents(filter);
    
    res.json({
      success: true,
      data: {
        agents,
        total: agents.length
      }
    });
    
  } catch (error) {
    logger.error('Failed to list agents', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'LIST_AGENTS_FAILED',
        message: 'Failed to retrieve agents'
      }
    });
  }
});

/**
 * GET /api/orchestration/agents/:agentId
 * Get agent details
 */
router.get('/agents/:agentId', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const agent = agentRegistry.getAgent(agentId);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AGENT_NOT_FOUND',
          message: 'Agent not found'
        }
      });
    }
    
    const tasks = agentRegistry.getAgentTasks(agentId);
    
    res.json({
      success: true,
      data: {
        agent,
        tasks,
        taskCount: tasks.length
      }
    });
    
  } catch (error) {
    logger.error('Failed to get agent', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_AGENT_FAILED',
        message: 'Failed to retrieve agent'
      }
    });
  }
});

/**
 * PUT /api/orchestration/agents/:agentId/status
 * Update agent status
 */
router.put('/agents/:agentId/status', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const { status } = req.body;
    
    if (!['idle', 'working', 'failed', 'maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Invalid status value'
        }
      });
    }
    
    const success = await agentRegistry.updateAgentStatus(agentId, status);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AGENT_NOT_FOUND',
          message: 'Agent not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        agentId,
        status,
        message: 'Agent status updated successfully'
      }
    });
    
  } catch (error) {
    logger.error('Failed to update agent status', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_STATUS_FAILED',
        message: 'Failed to update agent status'
      }
    });
  }
});

/**
 * DELETE /api/orchestration/agents/:agentId
 * Unregister an agent
 */
router.delete('/agents/:agentId', async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const success = await agentRegistry.unregisterAgent(agentId);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'AGENT_NOT_FOUND',
          message: 'Agent not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        agentId,
        message: 'Agent unregistered successfully'
      }
    });
    
  } catch (error) {
    logger.error('Failed to unregister agent', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UNREGISTER_FAILED',
        message: 'Failed to unregister agent'
      }
    });
  }
});

/**
 * POST /api/orchestration/tasks
 * Submit a task for processing
 */
router.post('/tasks', async (req: Request, res: Response) => {
  try {
    const { type, payload, priority = 'medium', timeoutMinutes = 30 } = req.body;
    
    if (!type || !payload) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Type and payload are required'
        }
      });
    }
    
    const taskId = await agentRegistry.submitTask(type, payload, priority, timeoutMinutes);
    
    res.status(201).json({
      success: true,
      data: {
        taskId,
        message: 'Task submitted successfully'
      }
    });
    
  } catch (error) {
    logger.error('Failed to submit task', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SUBMIT_TASK_FAILED',
        message: 'Failed to submit task'
      }
    });
  }
});

/**
 * GET /api/orchestration/tasks/:taskId
 * Get task status and result
 */
router.get('/tasks/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const task = agentRegistry.getTask(taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: task
    });
    
  } catch (error) {
    logger.error('Failed to get task', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_TASK_FAILED',
        message: 'Failed to retrieve task'
      }
    });
  }
});

/**
 * PUT /api/orchestration/tasks/:taskId/progress
 * Update task progress (for agents)
 */
router.put('/tasks/:taskId/progress', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { progress, result } = req.body;
    
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PROGRESS',
          message: 'Progress must be a number between 0 and 100'
        }
      });
    }
    
    const success = await agentRegistry.updateTaskProgress(taskId, progress, result);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        taskId,
        progress,
        message: 'Task progress updated successfully'
      }
    });
    
  } catch (error) {
    logger.error('Failed to update task progress', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_PROGRESS_FAILED',
        message: 'Failed to update task progress'
      }
    });
  }
});

/**
 * POST /api/orchestration/plans
 * Create an orchestration plan
 */
router.post('/plans', async (req: Request, res: Response) => {
  try {
    const { goal, context = {}, constraints = {} } = req.body;
    
    if (!goal) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Goal is required'
        }
      });
    }
    
    const plan = await aiConductor.createOrchestrationPlan(goal, context, constraints);
    
    res.status(201).json({
      success: true,
      data: {
        planId: plan.id,
        plan: {
          goal: plan.goal,
          steps: plan.steps.map(step => ({
            id: step.id,
            type: step.type,
            description: step.description,
            estimatedDuration: step.estimatedDuration,
            status: step.status
          })),
          estimatedDuration: plan.estimatedDuration,
          confidence: plan.confidence,
          hasFallback: !!plan.fallbackPlan
        }
      }
    });
    
  } catch (error) {
    logger.error('Failed to create orchestration plan', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_PLAN_FAILED',
        message: 'Failed to create orchestration plan'
      }
    });
  }
});

/**
 * POST /api/orchestration/plans/:planId/execute
 * Execute an orchestration plan
 */
router.post('/plans/:planId/execute', async (req: Request, res: Response) => {
  try {
    const { planId } = req.params;
    
    // This is a long-running operation, so we'll return immediately
    // and let the client poll for results
    
    // Execute plan asynchronously
    aiConductor.executePlan(planId)
      .then(result => {
        logger.info('Plan execution completed', { planId, result });
      })
      .catch(error => {
        logger.error('Plan execution failed', { planId, error });
      });
    
    res.json({
      success: true,
      data: {
        planId,
        message: 'Plan execution started',
        statusUrl: `/api/orchestration/plans/${planId}/status`
      }
    });
    
  } catch (error) {
    logger.error('Failed to start plan execution', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'EXECUTE_PLAN_FAILED',
        message: 'Failed to start plan execution'
      }
    });
  }
});

/**
 * GET /api/orchestration/stats
 * Get orchestration system statistics
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const registryStats = agentRegistry.getStats();
    const conductorStats = aiConductor.getStats();
    
    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        registry: registryStats,
        conductor: conductorStats,
        system: {
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform
        }
      }
    });
    
  } catch (error) {
    logger.error('Failed to get orchestration stats', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_STATS_FAILED',
        message: 'Failed to retrieve orchestration statistics'
      }
    });
  }
});

/**
 * GET /api/orchestration/health
 * Health check for orchestration system
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const registryStats = agentRegistry.getStats();
    const conductorStats = aiConductor.getStats();
    
    const isHealthy = registryStats.agents.total >= 0 && conductorStats.activePlans >= 0;
    
    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      data: {
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        components: {
          agentRegistry: {
            status: 'healthy',
            agents: registryStats.agents.total,
            tasks: registryStats.tasks.total
          },
          aiConductor: {
            status: 'healthy',
            activePlans: conductorStats.activePlans,
            successRate: conductorStats.successRate
          }
        }
      }
    });
    
  } catch (error) {
    logger.error('Failed orchestration health check', error);
    res.status(503).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Orchestration system health check failed'
      }
    });
  }
});

export { router as agentOrchestrationRouter };