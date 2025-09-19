"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiTeamRouter = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const validation_middleware_1 = require("../../middleware/validation.middleware");
const rate_limit_middleware_1 = require("../../middleware/rate-limit.middleware");
const agent_registry_service_1 = require("../../services/orchestration/agent-registry.service");
const agent_manager_service_1 = require("../../services/orchestration/agent-manager.service");
const websocket_service_1 = require("../../services/websocket/websocket.service");
const analytics_service_1 = require("../../services/analytics/analytics.service");
const logger_1 = require("../../utils/logger");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
exports.aiTeamRouter = router;
const taskAssignmentSchema = joi_1.default.object({
    agentId: joi_1.default.string().required(),
    taskType: joi_1.default.string().required(),
    payload: joi_1.default.object().optional(),
    priority: joi_1.default.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    timeoutMinutes: joi_1.default.number().min(1).max(180).default(30)
});
const collaborationSessionSchema = joi_1.default.object({
    name: joi_1.default.string().required().min(1).max(100),
    participants: joi_1.default.array().items(joi_1.default.string()).min(2).required(),
    taskDescription: joi_1.default.string().required(),
    mode: joi_1.default.string().valid('sequential', 'parallel', 'debate').default('parallel')
});
const feedbackSchema = joi_1.default.object({
    outputId: joi_1.default.string().required(),
    rating: joi_1.default.number().min(1).max(5).required(),
    comments: joi_1.default.string().optional().allow('')
});
const aiTeamRateLimit = (0, rate_limit_middleware_1.rateLimit)({
    windowMs: 60 * 1000,
    max: 30,
    message: 'Too many AI team requests'
});
router.get('/overview', (0, auth_middleware_1.authenticate)(), aiTeamRateLimit, async (req, res) => {
    try {
        const agents = await agent_registry_service_1.agentRegistry.listAgents();
        const teamStats = {
            totalAgents: agents.length,
            activeAgents: agents.filter(agent => agent.status === 'idle' || agent.status === 'working').length,
            totalTasks: await getTotalTaskCount(),
            completedTasks: await getCompletedTaskCount(),
            avgResponseTime: await getAverageResponseTime(),
            systemHealth: await getSystemHealth(),
            collaborationEvents: 0
        };
        await analytics_service_1.analyticsService.track({
            userId: req.user.id,
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
                connectedClients: websocket_service_1.webSocketService?.getConnectedClients() || 0,
                timestamp: new Date()
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get team overview', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve team overview'
        });
    }
});
router.get('/agents', (0, auth_middleware_1.authenticate)(), aiTeamRateLimit, async (req, res) => {
    try {
        const agents = await agent_registry_service_1.agentRegistry.listAgents();
        const detailedAgents = await Promise.all(agents.map(async (agent) => {
            const status = await agent_manager_service_1.agentManager.getAgentStatus(agent.id);
            const queueLength = await agent_registry_service_1.agentRegistry.getQueueLength(agent.id);
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
        }));
        res.status(200).json({
            success: true,
            data: detailedAgents
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get agent list', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve agent list'
        });
    }
});
router.get('/agents/:agentId', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const { agentId } = req.params;
        const agent = await agent_registry_service_1.agentRegistry.getAgent(agentId);
        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agent not found'
            });
        }
        const status = await agent_manager_service_1.agentManager.getAgentStatus(agentId);
        const queueLength = await agent_registry_service_1.agentRegistry.getQueueLength(agentId);
        const tasks = await agent_registry_service_1.agentRegistry.getAgentTasks(agentId, 10);
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get agent details', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve agent details'
        });
    }
});
router.post('/tasks/assign', (0, auth_middleware_1.authenticate)(['admin', 'forest']), (0, validation_middleware_1.validate)(taskAssignmentSchema), async (req, res) => {
    try {
        const { agentId, taskType, payload, priority, timeoutMinutes } = req.body;
        const agent = await agent_registry_service_1.agentRegistry.getAgent(agentId);
        if (!agent) {
            return res.status(404).json({
                success: false,
                error: 'Agent not found'
            });
        }
        const taskId = await agent_registry_service_1.agentRegistry.submitTask(agentId, taskType, payload || {}, priority, timeoutMinutes);
        if (websocket_service_1.webSocketService) {
            websocket_service_1.webSocketService.emitToAll('agent:task_assigned', {
                agentId,
                taskId,
                taskType,
                assignedBy: req.user.id,
                timestamp: new Date()
            });
        }
        await analytics_service_1.analyticsService.track({
            userId: req.user.id,
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
    }
    catch (error) {
        logger_1.logger.error('Failed to assign task', error);
        res.status(500).json({
            success: false,
            error: 'Failed to assign task'
        });
    }
});
router.get('/tasks/:taskId', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const { taskId } = req.params;
        const task = await agent_registry_service_1.agentRegistry.getTask(taskId);
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get task status', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve task status'
        });
    }
});
router.post('/agents/:agentId/pause', (0, auth_middleware_1.authenticate)(['admin', 'forest']), async (req, res) => {
    try {
        const { agentId } = req.params;
        await agent_manager_service_1.agentManager.pauseAgent(agentId);
        if (websocket_service_1.webSocketService) {
            websocket_service_1.webSocketService.emitToAll('agent:status', {
                id: agentId,
                status: 'paused',
                pausedBy: req.user.id,
                pausedAt: new Date()
            });
        }
        await analytics_service_1.analyticsService.track({
            userId: req.user.id,
            event: 'Agent Paused',
            properties: { agentId }
        });
        res.status(200).json({
            success: true,
            message: 'Agent paused successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to pause agent', error);
        res.status(500).json({
            success: false,
            error: 'Failed to pause agent'
        });
    }
});
router.post('/agents/:agentId/resume', (0, auth_middleware_1.authenticate)(['admin', 'forest']), async (req, res) => {
    try {
        const { agentId } = req.params;
        await agent_manager_service_1.agentManager.resumeAgent(agentId);
        if (websocket_service_1.webSocketService) {
            websocket_service_1.webSocketService.emitToAll('agent:status', {
                id: agentId,
                status: 'idle',
                resumedBy: req.user.id,
                resumedAt: new Date()
            });
        }
        await analytics_service_1.analyticsService.track({
            userId: req.user.id,
            event: 'Agent Resumed',
            properties: { agentId }
        });
        res.status(200).json({
            success: true,
            message: 'Agent resumed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to resume agent', error);
        res.status(500).json({
            success: false,
            error: 'Failed to resume agent'
        });
    }
});
router.post('/agents/:agentId/restart', (0, auth_middleware_1.authenticate)(['admin', 'forest']), async (req, res) => {
    try {
        const { agentId } = req.params;
        await agent_manager_service_1.agentManager.restartAgent(agentId);
        if (websocket_service_1.webSocketService) {
            websocket_service_1.webSocketService.emitToAll('agent:status', {
                id: agentId,
                status: 'idle',
                restartedBy: req.user.id,
                restartedAt: new Date()
            });
        }
        await analytics_service_1.analyticsService.track({
            userId: req.user.id,
            event: 'Agent Restarted',
            properties: { agentId }
        });
        res.status(200).json({
            success: true,
            message: 'Agent restarted successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to restart agent', error);
        res.status(500).json({
            success: false,
            error: 'Failed to restart agent'
        });
    }
});
router.post('/collaboration/sessions', (0, auth_middleware_1.authenticate)(), (0, validation_middleware_1.validate)(collaborationSessionSchema), async (req, res) => {
    try {
        const { name, participants, taskDescription, mode } = req.body;
        const agents = await agent_registry_service_1.agentRegistry.listAgents();
        const validAgents = agents.map(a => a.id);
        const invalidParticipants = participants.filter((id) => !validAgents.includes(id));
        if (invalidParticipants.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Invalid agent IDs: ${invalidParticipants.join(', ')}`
            });
        }
        const sessionId = Math.random().toString(36).substr(2, 9);
        const session = {
            id: sessionId,
            name,
            participants,
            taskDescription,
            mode,
            createdBy: req.user.id,
            createdAt: new Date(),
            status: 'active'
        };
        const taskPromises = participants.map((agentId) => agent_registry_service_1.agentRegistry.submitTask(agentId, 'collaborative_task', {
            sessionId,
            description: taskDescription,
            mode,
            round: 1
        }, 'medium', 30));
        await Promise.all(taskPromises);
        if (websocket_service_1.webSocketService) {
            websocket_service_1.webSocketService.emitToAll('collaboration:session_created', {
                session,
                createdBy: req.user.id
            });
        }
        await analytics_service_1.analyticsService.track({
            userId: req.user.id,
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
    }
    catch (error) {
        logger_1.logger.error('Failed to create collaboration session', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create collaboration session'
        });
    }
});
router.post('/feedback', (0, auth_middleware_1.authenticate)(), (0, validation_middleware_1.validate)(feedbackSchema), async (req, res) => {
    try {
        const { outputId, rating, comments } = req.body;
        const feedback = {
            id: Math.random().toString(36).substr(2, 9),
            outputId,
            userId: req.user.id,
            rating,
            comments,
            timestamp: new Date()
        };
        if (websocket_service_1.webSocketService) {
            websocket_service_1.webSocketService.emitToAll('agent:feedback', {
                outputId,
                feedback: {
                    rating,
                    comments
                },
                submittedBy: req.user.id
            });
        }
        await analytics_service_1.analyticsService.track({
            userId: req.user.id,
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
    }
    catch (error) {
        logger_1.logger.error('Failed to submit feedback', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit feedback'
        });
    }
});
router.get('/performance', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const { timeframe = '24h' } = req.query;
        const metrics = {
            taskCompletionRate: await getTaskCompletionRate(timeframe),
            avgTaskDuration: await getAverageTaskDuration(timeframe),
            agentUtilization: await getAgentUtilization(timeframe),
            errorRate: await getErrorRate(timeframe),
            collaborationEfficiency: await getCollaborationEfficiency(timeframe),
            topPerformingAgents: await getTopPerformingAgents(timeframe),
            performanceTrends: await getPerformanceTrends(timeframe)
        };
        res.status(200).json({
            success: true,
            data: {
                timeframe,
                metrics,
                generatedAt: new Date()
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get performance metrics', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve performance metrics'
        });
    }
});
router.get('/websocket/info', (0, auth_middleware_1.authenticate)(), async (req, res) => {
    try {
        const info = {
            connected: !!websocket_service_1.webSocketService,
            connectedClients: websocket_service_1.webSocketService?.getConnectedClients() || 0,
            userSessions: websocket_service_1.webSocketService?.getUserSessions(req.user.id) || [],
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
    }
    catch (error) {
        logger_1.logger.error('Failed to get WebSocket info', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve WebSocket information'
        });
    }
});
async function getTotalTaskCount() {
    return 0;
}
async function getCompletedTaskCount() {
    return 0;
}
async function getAverageResponseTime() {
    return 0;
}
async function getSystemHealth() {
    return 100;
}
async function getTaskCompletionRate(timeframe) {
    return 0.95;
}
async function getAverageTaskDuration(timeframe) {
    return 45;
}
async function getAgentUtilization(timeframe) {
    return 0.75;
}
async function getErrorRate(timeframe) {
    return 0.05;
}
async function getCollaborationEfficiency(timeframe) {
    return 0.85;
}
async function getTopPerformingAgents(timeframe) {
    return [];
}
async function getPerformanceTrends(timeframe) {
    return [];
}
//# sourceMappingURL=ai-team.route.js.map