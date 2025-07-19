"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAgent = void 0;
const events_1 = require("events");
const logger_1 = require("../../../utils/logger");
const agent_registry_service_1 = require("../agent-registry.service");
class BaseAgent extends events_1.EventEmitter {
    id;
    config;
    isRunning = false;
    currentTask;
    constructor(config) {
        super();
        this.config = config;
        this.id = '';
    }
    async start() {
        if (this.isRunning) {
            throw new Error('Agent is already running');
        }
        try {
            this.id = await agent_registry_service_1.agentRegistry.registerAgent({
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
            logger_1.logger.info('Agent started', {
                agentId: this.id,
                name: this.config.name,
                type: this.config.type
            });
            this.emit('started');
        }
        catch (error) {
            logger_1.logger.error('Failed to start agent', error);
            throw error;
        }
    }
    async stop() {
        if (!this.isRunning) {
            return;
        }
        try {
            this.isRunning = false;
            if (this.currentTask) {
                await agent_registry_service_1.agentRegistry.failTask(this.currentTask.id, 'Agent stopped');
            }
            await agent_registry_service_1.agentRegistry.unregisterAgent(this.id);
            logger_1.logger.info('Agent stopped', {
                agentId: this.id,
                name: this.config.name
            });
            this.emit('stopped');
        }
        catch (error) {
            logger_1.logger.error('Failed to stop agent', error);
            throw error;
        }
    }
    canHandle(taskType) {
        return this.config.capabilities.some(cap => cap.name === taskType || cap.inputTypes.includes(taskType));
    }
    startTaskPolling() {
        const pollInterval = setInterval(async () => {
            if (!this.isRunning) {
                clearInterval(pollInterval);
                return;
            }
            if (this.currentTask) {
                return;
            }
            try {
                await this.checkForTasks();
            }
            catch (error) {
                logger_1.logger.error('Error polling for tasks', { agentId: this.id, error });
            }
        }, 5000);
    }
    async checkForTasks() {
        await agent_registry_service_1.agentRegistry.updateAgentStatus(this.id, 'idle');
    }
    async executeTask(task) {
        if (this.currentTask) {
            throw new Error('Agent is already processing a task');
        }
        this.currentTask = task;
        try {
            logger_1.logger.info('Starting task execution', {
                agentId: this.id,
                taskId: task.id,
                taskType: task.type
            });
            await agent_registry_service_1.agentRegistry.updateAgentStatus(this.id, 'working');
            await agent_registry_service_1.agentRegistry.updateTaskProgress(task.id, 10);
            const result = await this.processTask(task);
            await agent_registry_service_1.agentRegistry.updateTaskProgress(task.id, 100, result);
            await agent_registry_service_1.agentRegistry.updateAgentStatus(this.id, 'idle');
            logger_1.logger.info('Task execution completed', {
                agentId: this.id,
                taskId: task.id
            });
            this.emit('taskCompleted', task, result);
        }
        catch (error) {
            logger_1.logger.error('Task execution failed', {
                agentId: this.id,
                taskId: task.id,
                error
            });
            await agent_registry_service_1.agentRegistry.failTask(task.id, error instanceof Error ? error.message : 'Unknown error');
            await agent_registry_service_1.agentRegistry.updateAgentStatus(this.id, 'idle');
            this.emit('taskFailed', task, error);
        }
        finally {
            this.currentTask = undefined;
        }
    }
    async updateProgress(progress, result) {
        if (this.currentTask) {
            await agent_registry_service_1.agentRegistry.updateTaskProgress(this.currentTask.id, progress, result);
        }
    }
    getId() {
        return this.id;
    }
    getConfig() {
        return { ...this.config };
    }
    isAgentRunning() {
        return this.isRunning;
    }
    getCurrentTask() {
        return this.currentTask;
    }
}
exports.BaseAgent = BaseAgent;
//# sourceMappingURL=base-agent.js.map