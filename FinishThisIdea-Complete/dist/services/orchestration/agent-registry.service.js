"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRegistry = exports.AgentRegistryService = void 0;
const uuid_1 = require("uuid");
const logger_1 = require("../../utils/logger");
const redis_1 = require("../../config/redis");
const prometheus_metrics_service_1 = require("../monitoring/prometheus-metrics.service");
class AgentRegistryService {
    agents = new Map();
    tasks = new Map();
    taskQueue = [];
    REDIS_PREFIX = 'agent_registry:';
    constructor() {
        this.loadFromPersistence();
        this.startTaskProcessor();
        this.startHealthChecker();
    }
    async registerAgent(definition) {
        const agentId = (0, uuid_1.v4)();
        const now = new Date();
        const agent = {
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
        logger_1.logger.info('Agent registered', {
            agentId,
            name: agent.name,
            type: agent.type,
            capabilities: agent.capabilities.length
        });
        prometheus_metrics_service_1.prometheusMetrics.recordAchievementUnlocked('agent_registered', 'system');
        return agentId;
    }
    async unregisterAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return false;
        }
        const runningTasks = Array.from(this.tasks.values())
            .filter(task => task.agentId === agentId && task.status === 'running');
        for (const task of runningTasks) {
            await this.failTask(task.id, 'Agent unregistered');
        }
        this.agents.delete(agentId);
        await this.removeFromPersistence(agentId);
        logger_1.logger.info('Agent unregistered', { agentId, name: agent.name });
        return true;
    }
    async submitTask(type, payload, priority = 'medium', timeoutMinutes = 30) {
        const taskId = (0, uuid_1.v4)();
        const now = new Date();
        const timeoutAt = new Date(now.getTime() + timeoutMinutes * 60 * 1000);
        const task = {
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
        logger_1.logger.info('Task submitted', {
            taskId,
            type,
            priority,
            timeoutMinutes
        });
        return taskId;
    }
    getTask(taskId) {
        return this.tasks.get(taskId);
    }
    getAgentTasks(agentId) {
        return Array.from(this.tasks.values())
            .filter(task => task.agentId === agentId);
    }
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    listAgents(filter) {
        let agents = Array.from(this.agents.values());
        if (filter) {
            if (filter.type) {
                agents = agents.filter(agent => agent.type === filter.type);
            }
            if (filter.status) {
                agents = agents.filter(agent => agent.status === filter.status);
            }
            if (filter.capabilities) {
                agents = agents.filter(agent => filter.capabilities.some(cap => agent.capabilities.some(agentCap => agentCap.name === cap)));
            }
        }
        return agents;
    }
    async updateAgentStatus(agentId, status) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return false;
        }
        agent.status = status;
        agent.metadata.updatedAt = new Date();
        agent.performance.lastSeen = new Date();
        await this.persistAgent(agent);
        logger_1.logger.debug('Agent status updated', { agentId, status });
        return true;
    }
    async updateTaskProgress(taskId, progress, result) {
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
            const agent = this.agents.get(task.agentId);
            if (agent) {
                agent.performance.totalTasks++;
                this.updateAgentPerformance(agent, true);
            }
            logger_1.logger.info('Task completed', { taskId, agentId: task.agentId });
        }
        await this.persistTask(task);
        return true;
    }
    async failTask(taskId, error) {
        const task = this.tasks.get(taskId);
        if (!task) {
            return false;
        }
        task.status = 'failed';
        task.error = error;
        task.completedAt = new Date();
        const agent = this.agents.get(task.agentId);
        if (agent) {
            agent.performance.totalTasks++;
            this.updateAgentPerformance(agent, false);
        }
        await this.persistTask(task);
        logger_1.logger.warn('Task failed', { taskId, agentId: task.agentId, error });
        return true;
    }
    getStats() {
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
    findBestAgent(task) {
        const availableAgents = Array.from(this.agents.values())
            .filter(agent => agent.status === 'idle' &&
            agent.capabilities.some(cap => cap.name === task.type || cap.inputTypes.includes(task.type)));
        if (availableAgents.length === 0) {
            return null;
        }
        availableAgents.sort((a, b) => {
            const aScore = a.performance.successRate * 0.7 + (1 / (a.performance.averageResponseTime || 1)) * 0.3;
            const bScore = b.performance.successRate * 0.7 + (1 / (b.performance.averageResponseTime || 1)) * 0.3;
            return bScore - aScore;
        });
        return availableAgents[0];
    }
    async processTaskQueue() {
        if (this.taskQueue.length === 0) {
            return;
        }
        const task = this.taskQueue.shift();
        const agent = this.findBestAgent(task);
        if (!agent) {
            this.taskQueue.unshift(task);
            return;
        }
        task.agentId = agent.id;
        task.status = 'assigned';
        task.assignedAt = new Date();
        agent.status = 'working';
        await Promise.all([
            this.persistTask(task),
            this.persistAgent(agent)
        ]);
        logger_1.logger.info('Task assigned', {
            taskId: task.id,
            agentId: agent.id,
            agentName: agent.name,
            taskType: task.type
        });
        this.simulateTaskProcessing(task);
    }
    async simulateTaskProcessing(task) {
        setTimeout(async () => {
            task.status = 'running';
            await this.persistTask(task);
            for (let progress = 10; progress <= 100; progress += 10) {
                setTimeout(async () => {
                    await this.updateTaskProgress(task.id, progress);
                }, (progress / 10) * 1000);
            }
        }, 100);
    }
    startTaskProcessor() {
        setInterval(() => {
            this.processTaskQueue();
        }, 1000);
    }
    startHealthChecker() {
        setInterval(() => {
            this.checkAgentHealth();
            this.checkTaskTimeouts();
        }, 30000);
    }
    async checkAgentHealth() {
        const now = new Date();
        const healthCheckThreshold = 5 * 60 * 1000;
        for (const agent of this.agents.values()) {
            const lastSeen = agent.performance.lastSeen?.getTime() || 0;
            if (now.getTime() - lastSeen > healthCheckThreshold) {
                if (agent.status !== 'failed' && agent.status !== 'maintenance') {
                    agent.status = 'failed';
                    await this.persistAgent(agent);
                    logger_1.logger.warn('Agent marked as failed due to health check', {
                        agentId: agent.id,
                        name: agent.name,
                        lastSeen: agent.performance.lastSeen
                    });
                }
            }
        }
    }
    async checkTaskTimeouts() {
        const now = new Date();
        for (const task of this.tasks.values()) {
            if (task.status === 'running' && now > task.timeoutAt) {
                await this.failTask(task.id, 'Task timeout');
                const agent = this.agents.get(task.agentId);
                if (agent) {
                    agent.status = 'idle';
                    await this.persistAgent(agent);
                }
            }
        }
    }
    updateAgentPerformance(agent, success) {
        const { performance } = agent;
        const totalTasks = performance.totalTasks;
        const alpha = 0.1;
        const newSuccessRate = success ? 1 : 0;
        performance.successRate = performance.successRate * (1 - alpha) + newSuccessRate * alpha;
        performance.averageResponseTime = Math.random() * 1000 + 500;
    }
    sortTaskQueue() {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        this.taskQueue.sort((a, b) => {
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0) {
                return priorityDiff;
            }
            return a.createdAt.getTime() - b.createdAt.getTime();
        });
    }
    groupBy(array, property) {
        return array.reduce((acc, item) => {
            const key = String(item[property]);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});
    }
    async persistAgent(agent) {
        try {
            await redis_1.redis.setex(`${this.REDIS_PREFIX}agent:${agent.id}`, 3600, JSON.stringify(agent));
        }
        catch (error) {
            logger_1.logger.error('Failed to persist agent', { agentId: agent.id, error });
        }
    }
    async persistTask(task) {
        try {
            await redis_1.redis.setex(`${this.REDIS_PREFIX}task:${task.id}`, 86400, JSON.stringify(task));
        }
        catch (error) {
            logger_1.logger.error('Failed to persist task', { taskId: task.id, error });
        }
    }
    async removeFromPersistence(agentId) {
        try {
            await redis_1.redis.del(`${this.REDIS_PREFIX}agent:${agentId}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to remove agent from persistence', { agentId, error });
        }
    }
    async loadFromPersistence() {
        try {
            const keys = await redis_1.redis.keys(`${this.REDIS_PREFIX}*`);
            for (const key of keys) {
                const data = await redis_1.redis.get(key);
                if (!data)
                    continue;
                const parsed = JSON.parse(data);
                if (key.includes(':agent:')) {
                    parsed.metadata.createdAt = new Date(parsed.metadata.createdAt);
                    parsed.metadata.updatedAt = new Date(parsed.metadata.updatedAt);
                    parsed.performance.lastSeen = new Date(parsed.performance.lastSeen);
                    this.agents.set(parsed.id, parsed);
                }
                else if (key.includes(':task:')) {
                    parsed.createdAt = new Date(parsed.createdAt);
                    parsed.timeoutAt = new Date(parsed.timeoutAt);
                    if (parsed.assignedAt)
                        parsed.assignedAt = new Date(parsed.assignedAt);
                    if (parsed.completedAt)
                        parsed.completedAt = new Date(parsed.completedAt);
                    this.tasks.set(parsed.id, parsed);
                    if (parsed.status === 'pending') {
                        this.taskQueue.push(parsed);
                    }
                }
            }
            this.sortTaskQueue();
            logger_1.logger.info('Loaded from persistence', {
                agents: this.agents.size,
                tasks: this.tasks.size,
                queuedTasks: this.taskQueue.length
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to load from persistence', error);
        }
    }
}
exports.AgentRegistryService = AgentRegistryService;
exports.agentRegistry = new AgentRegistryService();
//# sourceMappingURL=agent-registry.service.js.map