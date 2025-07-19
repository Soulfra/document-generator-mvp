import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import { rateLimit } from '../../middleware/rate-limit.middleware';
import { agentRegistry } from '../../services/orchestration/agent-registry.service';
import { agentManager } from '../../services/orchestration/agent-manager.service';
import { webSocketService } from '../../services/websocket/websocket.service';
import { analyticsService } from '../../services/analytics/analytics.service';
import { logger } from '../../utils/logger';
import Joi from 'joi';

const router = Router();

// Validation schemas
const taskAssignmentSchema = Joi.object({
  agentId: Joi.string().required(),
  taskType: Joi.string().required(),
  payload: Joi.object().optional(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  timeoutMinutes: Joi.number().min(1).max(180).default(30)
});

const collaborationSessionSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  participants: Joi.array().items(Joi.string()).min(2).required(),
  taskDescription: Joi.string().required(),
  mode: Joi.string().valid('sequential', 'parallel', 'debate').default('parallel')
});

const feedbackSchema = Joi.object({
  outputId: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  comments: Joi.string().optional().allow('')
});

// Rate limiting for AI team endpoints
const aiTeamRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Too many AI team requests'
});

// Get team overview
router.get('/overview',
  authenticate(),
  aiTeamRateLimit,
  async (req: Request, res: Response) => {
    try {
      const agents = await agentRegistry.listAgents();
      const teamStats = {
        totalAgents: agents.length,
        activeAgents: agents.filter(agent => agent.status === 'idle' || agent.status === 'working').length,
        totalTasks: await getTotalTaskCount(),
        completedTasks: await getCompletedTaskCount(),
        avgResponseTime: await getAverageResponseTime(),
        systemHealth: await getSystemHealth(),
        collaborationEvents: 0 // Will be tracked separately
      };

      // Track analytics
      await analyticsService.track({
        userId: req.user!.id,
        event: 'AI Team Overview Viewed',
        properties: {
          totalAgents: teamStats.totalAgents,
          activeAgents: teamStats.activeAgents
        }
      });

      res.status(200).json({
        success: true,
        data: {
          teamStats,
          connectedClients: webSocketService?.getConnectedClients() || 0,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to get team overview', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve team overview'
      });
    }
  }
);

// Get detailed agent list
router.get('/agents',
  authenticate(),
  aiTeamRateLimit,
  async (req: Request, res: Response) => {
    try {
      const agents = await agentRegistry.listAgents();
      const detailedAgents = await Promise.all(
        agents.map(async (agent) => {
          const status = await agentManager.getAgentStatus(agent.id);
          const queueLength = await agentRegistry.getQueueLength(agent.id);
          
          return {
            id: agent.id,
            name: agent.name,
            type: agent.type,
            status: status.status,
            currentTask: status.currentTask,
            performance: status.performance,
            capabilities: agent.capabilities,
            queueLength,
            healthScore: status.healthScore,
            metadata: agent.metadata
          };
        })
      );

      res.status(200).json({
        success: true,
        data: detailedAgents
      });
    } catch (error) {
      logger.error('Failed to get agent list', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve agent list'
      });
    }
  }
);

// Get specific agent details
router.get('/agents/:agentId',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      const agent = await agentRegistry.getAgent(agentId);
      
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found'
        });
      }

      const status = await agentManager.getAgentStatus(agentId);
      const queueLength = await agentRegistry.getQueueLength(agentId);
      const tasks = await agentRegistry.getAgentTasks(agentId, 10); // Last 10 tasks

      const detailedAgent = {
        ...agent,
        status: status.status,
        currentTask: status.currentTask,
        performance: status.performance,
        queueLength,
        healthScore: status.healthScore,
        recentTasks: tasks
      };

      res.status(200).json({
        success: true,
        data: detailedAgent
      });
    } catch (error) {
      logger.error('Failed to get agent details', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve agent details'
      });
    }
  }
);

// Assign task to agent
router.post('/tasks/assign',
  authenticate(['admin', 'forest']),
  validate(taskAssignmentSchema),
  async (req: Request, res: Response) => {
    try {
      const { agentId, taskType, payload, priority, timeoutMinutes } = req.body;
      
      // Check if agent exists
      const agent = await agentRegistry.getAgent(agentId);
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found'
        });
      }

      // Submit task
      const taskId = await agentRegistry.submitTask(
        agentId,
        taskType,
        payload || {},
        priority,
        timeoutMinutes
      );

      // Broadcast update via WebSocket
      if (webSocketService) {
        webSocketService.emitToAll('agent:task_assigned', {
          agentId,
          taskId,
          taskType,
          assignedBy: req.user!.id,
          timestamp: new Date()
        });
      }

      // Track analytics
      await analyticsService.track({
        userId: req.user!.id,
        event: 'Task Assigned to Agent',
        properties: {
          agentId,
          taskType,
          priority,
          timeoutMinutes
        }
      });

      res.status(201).json({
        success: true,
        data: {
          taskId,
          agentId,
          assignedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to assign task', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign task'
      });
    }
  }
);

// Get task status
router.get('/tasks/:taskId',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const task = await agentRegistry.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({
          success: false,
          error: 'Task not found'
        });
      }

      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      logger.error('Failed to get task status', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve task status'
      });
    }
  }
);

// Agent control endpoints
router.post('/agents/:agentId/pause',
  authenticate(['admin', 'forest']),
  async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      await agentManager.pauseAgent(agentId);
      
      // Broadcast update
      if (webSocketService) {
        webSocketService.emitToAll('agent:status', {
          id: agentId,
          status: 'paused',
          pausedBy: req.user!.id,
          pausedAt: new Date()
        });
      }

      // Track analytics
      await analyticsService.track({
        userId: req.user!.id,
        event: 'Agent Paused',
        properties: { agentId }
      });

      res.status(200).json({
        success: true,
        message: 'Agent paused successfully'
      });
    } catch (error) {
      logger.error('Failed to pause agent', error);
      res.status(500).json({
        success: false,
        error: 'Failed to pause agent'
      });
    }
  }
);

router.post('/agents/:agentId/resume',
  authenticate(['admin', 'forest']),
  async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      await agentManager.resumeAgent(agentId);
      
      // Broadcast update
      if (webSocketService) {
        webSocketService.emitToAll('agent:status', {
          id: agentId,
          status: 'idle',
          resumedBy: req.user!.id,
          resumedAt: new Date()
        });
      }

      // Track analytics
      await analyticsService.track({
        userId: req.user!.id,
        event: 'Agent Resumed',
        properties: { agentId }
      });

      res.status(200).json({
        success: true,
        message: 'Agent resumed successfully'
      });
    } catch (error) {
      logger.error('Failed to resume agent', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resume agent'
      });
    }
  }
);

router.post('/agents/:agentId/restart',
  authenticate(['admin', 'forest']),
  async (req: Request, res: Response) => {
    try {
      const { agentId } = req.params;
      await agentManager.restartAgent(agentId);
      
      // Broadcast update
      if (webSocketService) {
        webSocketService.emitToAll('agent:status', {
          id: agentId,
          status: 'idle',
          restartedBy: req.user!.id,
          restartedAt: new Date()
        });
      }

      // Track analytics
      await analyticsService.track({
        userId: req.user!.id,
        event: 'Agent Restarted',
        properties: { agentId }
      });

      res.status(200).json({
        success: true,
        message: 'Agent restarted successfully'
      });
    } catch (error) {
      logger.error('Failed to restart agent', error);
      res.status(500).json({
        success: false,
        error: 'Failed to restart agent'
      });
    }
  }
);

// Collaboration session endpoints
router.post('/collaboration/sessions',
  authenticate(),
  validate(collaborationSessionSchema),
  async (req: Request, res: Response) => {
    try {
      const { name, participants, taskDescription, mode } = req.body;
      
      // Validate participants are valid agents
      const agents = await agentRegistry.listAgents();
      const validAgents = agents.map(a => a.id);
      const invalidParticipants = participants.filter((id: string) => !validAgents.includes(id));
      
      if (invalidParticipants.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid agent IDs: ${invalidParticipants.join(', ')}`
        });
      }

      const sessionId = Math.random().toString(36).substr(2, 9);
      
      // Create collaboration session (would be stored in database)
      const session = {
        id: sessionId,
        name,
        participants,
        taskDescription,
        mode,
        createdBy: req.user!.id,
        createdAt: new Date(),
        status: 'active'
      };

      // Assign collaborative task to all participants
      const taskPromises = participants.map((agentId: string) =>
        agentRegistry.submitTask(
          agentId,
          'collaborative_task',
          {
            sessionId,
            description: taskDescription,
            mode,
            round: 1
          },
          'medium',
          30
        )
      );

      await Promise.all(taskPromises);

      // Broadcast session creation
      if (webSocketService) {
        webSocketService.emitToAll('collaboration:session_created', {
          session,
          createdBy: req.user!.id
        });
      }

      // Track analytics
      await analyticsService.track({
        userId: req.user!.id,
        event: 'Collaboration Session Created',
        properties: {
          sessionId,
          participantCount: participants.length,
          mode
        }
      });

      res.status(201).json({
        success: true,
        data: session
      });
    } catch (error) {
      logger.error('Failed to create collaboration session', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create collaboration session'
      });
    }
  }
);

// Submit feedback on agent output
router.post('/feedback',
  authenticate(),
  validate(feedbackSchema),
  async (req: Request, res: Response) => {
    try {
      const { outputId, rating, comments } = req.body;
      
      // Store feedback (would be in database)
      const feedback = {
        id: Math.random().toString(36).substr(2, 9),
        outputId,
        userId: req.user!.id,
        rating,
        comments,
        timestamp: new Date()
      };

      // Broadcast feedback
      if (webSocketService) {
        webSocketService.emitToAll('agent:feedback', {
          outputId,
          feedback: {
            rating,
            comments
          },
          submittedBy: req.user!.id
        });
      }

      // Track analytics
      await analyticsService.track({
        userId: req.user!.id,
        event: 'Agent Output Feedback',
        properties: {
          outputId,
          rating,
          hasComments: !!comments
        }
      });

      res.status(201).json({
        success: true,
        data: feedback
      });
    } catch (error) {
      logger.error('Failed to submit feedback', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit feedback'
      });
    }
  }
);

// Get team performance metrics
router.get('/performance',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const { timeframe = '24h' } = req.query;
      
      const metrics = {
        taskCompletionRate: await getTaskCompletionRate(timeframe as string),
        avgTaskDuration: await getAverageTaskDuration(timeframe as string),
        agentUtilization: await getAgentUtilization(timeframe as string),
        errorRate: await getErrorRate(timeframe as string),
        collaborationEfficiency: await getCollaborationEfficiency(timeframe as string),
        topPerformingAgents: await getTopPerformingAgents(timeframe as string),
        performanceTrends: await getPerformanceTrends(timeframe as string)
      };

      res.status(200).json({
        success: true,
        data: {
          timeframe,
          metrics,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to get performance metrics', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance metrics'
      });
    }
  }
);

// WebSocket connection info
router.get('/websocket/info',
  authenticate(),
  async (req: Request, res: Response) => {
    try {
      const info = {
        connected: !!webSocketService,
        connectedClients: webSocketService?.getConnectedClients() || 0,
        userSessions: webSocketService?.getUserSessions(req.user!.id) || [],
        endpoints: {
          url: process.env.FRONTEND_URL || 'http://localhost:3000',
          namespace: '/',
          transports: ['websocket', 'polling']
        }
      };

      res.status(200).json({
        success: true,
        data: info
      });
    } catch (error) {
      logger.error('Failed to get WebSocket info', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve WebSocket information'
      });
    }
  }
);

// Helper functions for statistics (implement based on your data storage)
async function getTotalTaskCount(): Promise<number> {
  // Implementation would query your task database
  return 0; // Placeholder
}

async function getCompletedTaskCount(): Promise<number> {
  // Implementation would query your task database
  return 0; // Placeholder
}

async function getAverageResponseTime(): Promise<number> {
  // Implementation would calculate from task completion times
  return 0; // Placeholder
}

async function getSystemHealth(): Promise<number> {
  // Implementation would calculate based on agent health scores
  return 100; // Placeholder
}

async function getTaskCompletionRate(timeframe: string): Promise<number> {
  return 0.95; // Placeholder
}

async function getAverageTaskDuration(timeframe: string): Promise<number> {
  return 45; // Placeholder
}

async function getAgentUtilization(timeframe: string): Promise<number> {
  return 0.75; // Placeholder
}

async function getErrorRate(timeframe: string): Promise<number> {
  return 0.05; // Placeholder
}

async function getCollaborationEfficiency(timeframe: string): Promise<number> {
  return 0.85; // Placeholder
}

async function getTopPerformingAgents(timeframe: string): Promise<any[]> {
  return []; // Placeholder
}

async function getPerformanceTrends(timeframe: string): Promise<any[]> {
  return []; // Placeholder
}

export { router as aiTeamRouter };